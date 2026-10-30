// Analytics & audit, rebuilt. One tier of headline figures, a compact strip inside each
// tab instead of a second tier of cards, and insights you can actually act on.

/* a strip of figures: the same information a card row carried, without a second tier of cards */
const strip = rows => `<div class="statstrip">${rows.map(r => `<div><span class="k">${esc(r[0])}</span><span class="v ${r[3] || ''}">${r[1]}</span>${r[2] ? `<span class="d">${esc(r[2])}</span>` : ''}</div>`).join('')}</div>`;

/* Win/loss as a nested open arc: the thin inner ring is the outcome of every decided bid,
   the wide outer ring is the project types those bids were for. Total in the middle. */
/* The two rings used to be drawn in brand-500 and brand-600, which differ by
   ΔE 5 — one olive ring with faint seams. Both now take the chart palette,
   checked for separation under normal, deutan, protan and tritan vision: the
   outcome ring is the strongest trio available (worst ΔE 18), and the type
   ring orders its five so the closest pair, blue and purple, sits apart. */
const AN_SHADE = ['--viz-1', '--viz-4', '--viz-6', '--border-strong'];
const AN_TYPE = ['--viz-2', '--viz-3', '--viz-5', '--viz-4', '--viz-6', '--viz-1'];
function anWinChart(H) {
  const decided = H.won + H.lostPrice + H.dq;
  const inner = [
    { k: 'Won', v: H.won, c: AN_SHADE[0] },
    { k: 'Lost on price', v: H.lostPrice, c: AN_SHADE[1] },
    { k: 'Disqualified', v: H.dq, c: AN_SHADE[2] }
  ];
  const outer = H.byType.map((t, i) => ({ k: t[0], v: t[1], c: AN_TYPE[i % AN_TYPE.length] }));
  const spec = { type: 'donut2', inner: 42, start: -180, end: 0, center: String(decided), sub: 'bids decided', inner_data: inner, data: outer, unit1: ' bids', unit2: ' bid for' };
  return `<div class="anchart" data-legend="win" data-chart='${esc(JSON.stringify(spec))}' aria-label="Outcomes of ${decided} decided bids, and the project types they were for"></div>`;
}

/* ---------------- insights you can act on ----------------
   Every fix below reads the live record, says what it would change, and then
   changes it. None of them is a link: `run` mutates the opportunity and writes
   the audit line, so the figure the insight came from moves too. */
const AN_FIX = {
  secs: {
    t: 'Put the proposal back on a clock',
    find: o => {
      const pr = o.prop; if (!pr) return null;
      const open = pr.tree.filter(n => n.st !== 'approved'); if (!open.length) return null;
      const dr = open.filter(n => n.st === 'draft').length, nd = open.filter(n => !n.due).length;
      if (!dr && !nd) return null;
      return { say: `${open.length} of ${pr.tree.length} sections are not approved; ${nd} carry no due date`, will: `Date every open section for ${fmtDate(anDue(o))}${dr ? ` and send the ${dr} finished draft${dr > 1 ? 's' : ''} to their reviewers` : ''}.` };
    },
    run: o => {
      const pr = o.prop, due = anDue(o); let mv = 0, du = 0;
      pr.tree.forEach(n => { if (n.st === 'approved') return; if (!n.due) { n.due = due; du++; } if (n.st === 'draft') { n.st = 'in_review'; mv++; } });
      log('Dated the open proposal sections and sent drafts for review', `${o.meta.id} · ${du} dated, ${mv} to review`);
      return `${du} section${du === 1 ? '' : 's'} dated ${fmtDate(due)}, ${mv} sent to their reviewers.`;
    }
  },
  clars: {
    t: 'Send the queries that are still sitting in draft',
    find: o => {
      const dr = o.clars.filter(c => c.status === 'draft'); if (!dr.length) return null;
      const un = o.clars.filter(c => c.status !== 'answered').length;
      return { say: `${un} quer${un === 1 ? 'y is' : 'ies are'} unanswered and ${dr.length === 1 ? 'one was' : dr.length + ' were'} never sent`, will: `Release ${dr.map(c => c.id).join(', ')} to the authority against the pre-bid deadline.` };
    },
    run: o => {
      const dr = o.clars.filter(c => c.status === 'draft'); dr.forEach(c => c.status = 'open');
      log('Released drafted pre-bid queries to the authority', `${o.meta.id} · ${dr.map(c => c.id).join(', ')}`);
      return `${dr.length} quer${dr.length === 1 ? 'y' : 'ies'} sent — ${dr.map(c => c.id).join(', ')}.`;
    }
  },
  risks: {
    t: 'Price the high risks instead of carrying them open',
    find: o => {
      const hr = o.risks.filter(r => r.l * r.i >= 16 && r.treat !== 'Price'); if (!hr.length) return null;
      const e = hr.reduce((a, r) => a + expo(r), 0);
      return { say: `${hr.length} risk${hr.length > 1 ? 's score' : ' scores'} 16 or above with no price against ${hr.length > 1 ? 'them' : 'it'} — ${cr(e)} of weighted exposure`, will: `Set ${hr.map(r => r.id).join(', ')} to <b>Price</b> and note the contingency on each one.` };
    },
    run: o => {
      const hr = o.risks.filter(r => r.l * r.i >= 16 && r.treat !== 'Price'), e = hr.reduce((a, r) => a + expo(r), 0);
      hr.forEach(r => { r.treat = 'Price'; r.mit = (r.mit ? r.mit + '; ' : '') + 'Carried in contingency (set from analytics)'; });
      log('Set high risks to be priced into contingency', `${o.meta.id} · ${hr.map(r => r.id).join(', ')} · ${cr(e)}`);
      return `${hr.length} risk${hr.length === 1 ? '' : 's'} now priced — ${cr(e)} into the contingency line.`;
    }
  },
  ll: {
    t: 'Deal with the long-lead items that cannot arrive in time',
    find: o => {
      const late = o.longlead.filter(l => llFloat(l) < 0 && !anCarried(o, l)); if (!late.length) return null;
      const room = late.filter(l => num(l.order) > anEarliest(l)), stuck = late.filter(l => num(l.order) <= anEarliest(l));
      const parts = [];
      if (room.length) parts.push(`${room.map(l => `${l.item} can still be ordered ${num(l.order) - anEarliest(l)} month${num(l.order) - anEarliest(l) > 1 ? 's' : ''} earlier`).join(', ')}`);
      if (stuck.length) parts.push(`${stuck.map(l => `${l.item} stays ${Math.round(-llFloat(l) * 4.33)} weeks short even ordered at award`).join(', ')}`);
      return { say: `${parts.join('; ')}`,
        will: `${room.length ? `Pull ${room.length} order${room.length > 1 ? 's' : ''} forward to the earliest month that fits. ` : ''}${stuck.length ? `Raise a supply-chain risk for ${stuck.map(l => l.item).join(', ')} so the shortfall is carried and priced rather than left negative.` : ''}` };
    },
    run: o => {
      const late = o.longlead.filter(l => llFloat(l) < 0 && !anCarried(o, l)), out = [];
      late.forEach(l => {
        const e = anEarliest(l);
        if (num(l.order) > e) { const was = num(l.order); l.order = e; out.push(`${l.item} ordered M${was}→M${e}`); }
        if (llFloat(l) < 0) {
          const wk = Math.round(-llFloat(l) * 4.33), id = nextId(o.risks, 'R-');
          o.risks.push({ id, risk: `${l.item} is ${wk} weeks short of its need-by month even ordered at award`, cat: 'Supply chain', l: 4, i: 4, impact: 0, treat: 'Clarify', owner: 'procurement', src: '', mit: 'Pre-order at the letter of award, or ask for the item as owner-furnished supply; carry the premium in contingency until the answer comes back' });
          out.push(`${id} raised — ${l.item} ${wk} weeks short`);
        }
      });
      log('Resequenced long-lead orders and carried the shortfall as risk', `${o.meta.id} · ${out.join('; ')}`);
      return out.join(' · ') + '.';
    }
  },
  bg: {
    t: 'Extend the guarantees that are about to lapse',
    find: o => {
      const b = o.bgs.filter(x => x.st !== 'Released' && daysTo(x.exp) < 60); if (!b.length) return null;
      return { say: `${b.map(x => `${x.type} expires in ${daysTo(x.exp)} days`).join(', ')}`, will: `Request 180 days from ${[...new Set(b.map(x => x.bank))].join(' and ')} and mark ${b.length > 1 ? 'them' : 'it'} Extended.` };
    },
    run: o => {
      const b = o.bgs.filter(x => x.st !== 'Released' && daysTo(x.exp) < 60);
      b.forEach(x => { x.exp = new Date(new Date(x.exp).getTime() + 180 * 864e5).toISOString().slice(0, 10); x.st = 'Extended'; });
      log('Requested guarantee extensions', `${o.meta.id} · ${b.map(x => x.type).join(', ')}`);
      return b.map(x => `${x.type} extended to ${fmtDate(x.exp)}`).join(' · ') + '.';
    }
  },
  claim: {
    t: 'File the claim particulars before the time bar',
    find: o => {
      const c = o.claims.filter(x => !/submitted|agreed|rejected|disputed/i.test(x.st) && anBar(x) < 15); if (!c.length) return null;
      return { say: `${c.map(x => `${x.id} is ${anBar(x)} days from its 42-day bar`).join(', ')}`, will: `Submit the particulars for ${c.map(x => x.id).join(', ')} to the independent engineer.` };
    },
    run: o => {
      const c = o.claims.filter(x => !/submitted|agreed|rejected|disputed/i.test(x.st) && anBar(x) < 15);
      c.forEach(x => x.st = 'Submitted to IE');
      log('Submitted claim particulars to the independent engineer', `${o.meta.id} · ${c.map(x => x.id).join(', ')}`);
      return `${c.map(x => x.id).join(', ')} submitted — ${cr(c.reduce((a, x) => a + num(x.val), 0))} and ${c.reduce((a, x) => a + num(x.days), 0)} days claimed.`;
    }
  },
  gate: {
    t: 'Ask the outstanding signatories for G2',
    find: o => {
      if (o.pos < 7 || gateSigned('G2')) return null;
      const miss = GATES.G2.roles.filter(r => !(o.signed || {})[ 'G2' + r]);
      if (!miss.length) return null;
      if ((o.gateReq || {}).G2) return null;
      return { say: `the price approval is unsigned by ${miss.map(r => ROLES[r].name).join(' and ')} while the bid sits at stage ${o.pos}`, will: 'Send the approval request and record it against the gate, so the bypass is visible rather than quiet.' };
    },
    run: o => {
      const miss = GATES.G2.roles.filter(r => !(o.signed || {})['G2' + r]);
      o.gateReq = { ...(o.gateReq || {}), G2: nowTs() };
      log('Requested G2 price approval', `${o.meta.id} · ${miss.map(r => ROLES[r].name).join(', ')}`);
      return `Request sent to ${miss.map(r => ROLES[r].name).join(' and ')}; recorded against G2 at ${nowTs()}.`;
    }
  }
};
const anDue = o => { const d = daysTo(o.meta.submission); return new Date(TODAY.getTime() + Math.max(3, (d == null || isNaN(d) ? 14 : d) - 7) * 864e5).toISOString().slice(0, 10); };
const anCarried = (o, l) => o.risks.some(r => /weeks short/.test(r.risk || '') && String(r.risk).includes(l.item));
const anEarliest = l => Math.max(1, num(l.need) - Math.ceil(num(l.lead) / 4.33));
const anBar = c => Math.round((new Date(c.notice).getTime() + 42 * 864e5 - TODAY) / 864e5);
const anKey = (id, k) => id + '|' + k;
const anTabName = t => (typeof tabLabel === 'function' ? tabLabel(t) : t);

/* which fixes this insight actually opens up, in the order they matter */
const AN_ORDER = ['gate', 'claim', 'bg', 'll', 'clars', 'risks', 'secs'];
function anFixes(i) {
  const o = S.db.opps[i[4]]; if (!o || !o.meta) return [];
  return AN_ORDER.map(k => { const f = AN_FIX[k].find(o); return f ? { k, o, t: AN_FIX[k].t, ...f } : null; }).filter(Boolean);
}

function anInsight(i, n) {
  const sev = i[0] === 'ai' ? 'ai' : i[0];
  return `<div class="an-ins">
   <span class="an-sev ${sev}" aria-hidden="true"></span>
   <div class="an-insb"><b>${esc(i[1])}</b><span class="sub">${esc(i[2])}</span></div>
   <div class="an-insa">
    <button class="btn sm ai" data-a="aninsight" data-n="${n}">${IC.spark}Fix this</button>
    <button class="btn sm ghost" data-a="taskgo" data-t="${i[3]}" data-id="${i[4]}">Open →</button></div></div>`;
}

/* what the assistant can say about one insight, read from the tender's own records */
function anAdvise(i) {
  const o = S.db.opps[i[4]] || O(), sev = i[0];
  const facts = [];
  if (o && o.meta) {
    const d = daysTo(o.meta.submission);
    if (o.pos <= 8 && d != null) facts.push(`${esc(o.meta.name)} is at stage ${o.pos} with ${d} days to submission.`);
    const open = o.clars.filter(c => c.status !== 'answered').length;
    if (open) facts.push(`${open} clarification${open > 1 ? 's are' : ' is'} still unanswered.`);
    const hi = o.risks.filter(r => r.l * r.i >= 16).length;
    if (hi) facts.push(`${hi} risk${hi > 1 ? 's score' : ' scores'} 16 or above.`);
    const pr = o.prop, notAppr = pr ? pr.tree.filter(s => s.st !== 'approved').length : 0;
    if (notAppr) facts.push(`${notAppr} proposal section${notAppr > 1 ? 's are' : ' is'} not approved.`);
    if (o.pos >= 7 && !gateSigned('G2')) facts.push('G2 price approval is not signed, and the bid is already past the gate.');
  }
  return { facts, fixes: anFixes(i), sev };
}

function anInsightModal() {
  const n = S.ui.anIns; if (n == null) return '';
  const H = HIST[S.ui.ap || 12], ins = insights(H), i = ins[n]; if (!i) return '';
  const busy = !!S.ui.anBusy, step = S.ui.anStep || 0, did = S.ui.anDid || {};
  const orb = (state, id) => { const f = orbFit({ state, size: 32 }, 'lv-orb lv-orb32');
    return `<span class="${f.cls}" style="${f.style}" data-fx="orb" data-fxid="${id}" data-fxo='${JSON.stringify(f.opts)}' aria-hidden="true"></span>`; };
  const STEPS = [['searching', 'Reading this tender’s records'], ['solving', 'Working out what can be changed'], ['weaving', 'Writing the fixes']];
  const a = busy ? null : anAdvise(i);
  const pend = a ? a.fixes.length : 0;
  const ranAny = Object.keys(did).length > 0;
  return `<div class="scrim" data-a="closemodal"><div class="modal lg" role="dialog" aria-modal="true" aria-labelledby="ait">
   <div class="mh"><div class="row" style="gap:10px;flex-wrap:nowrap;min-width:0"><span class="an-pill lg ico-only" role="img" aria-label="Suggested by bidPlan">${IC.spark}</span>
     <div style="min-width:0"><span class="eyebrow">${esc(i[0] === 'ai' ? 'Pattern from the history' : i[0] + ' priority')}</span><h2 id="ait">${esc(i[1])}</h2></div></div>
    <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
   <div class="mb">${busy
      ? `<div class="an-think">${orb(STEPS[step][0], 'an-think')}<div class="stack" style="gap:6px">${STEPS.map((s, k) => `<span class="kb-stp ${k === step ? 'on' : k < step ? 'done' : ''}">${aiMark(k < step ? 'done' : k === step ? 'now' : '')}${esc(s[1])}</span>`).join('')}</div></div>`
      : `<div class="stack" style="gap:16px">
       <div class="an-sec"><span class="eyebrow">What I found</span>${a.facts.length ? `<ul class="an-list">${a.facts.map(f => `<li>${f}</li>`).join('')}</ul>` : '<p class="sub">This one comes from the twelve-month history, not from a live record, so there is nothing here to change.</p>'}</div>
       <div class="an-sec"><span class="eyebrow">What I will change</span>
        ${pend ? `<ul class="an-fix">${a.fixes.map(f => `<li><div class="an-fxb"><b>${esc(f.t)}</b><span class="sub">I can see ${f.say}.</span><p>${f.will}</p></div>
          <button class="btn sm pri" data-a="anfix" data-k="${f.k}" data-id="${esc(f.o.meta.id)}" data-n="${n}">Do it</button></li>`).join('')}</ul>`
          : `<p class="sub">${ranAny ? 'Everything I can change here is done.' : 'Nothing on this record can be changed from here — it needs a judgement, not a button.'}</p>`}
        ${ranAny ? `<ul class="an-done">${Object.keys(did).map(k => `<li>${IC.check}<span>${did[k]}</span></li>`).join('')}</ul>` : ''}
       </div>
       <div class="note"><div>${IC.lock} Every line above changes this tender's own records and is written to the audit trail. Nothing is sent outside bidPlan.</div></div>
      </div>`}</div>
   <div class="mf"><button class="btn" data-a="closemodal">Close</button>
    <button class="btn sm ghost" data-a="taskgo" data-t="${i[3]}" data-id="${i[4]}">Open ${esc(anTabName(i[3]))} →</button>
    ${pend > 1 ? `<button class="btn pri" data-a="anfixall" data-n="${n}">Do all ${pend}</button>` : ''}</div></div></div>`;
}

Object.assign(ACT, {
  aninsight: d => {
    S.ui.anIns = +d.n; S.ui.anBusy = true; S.ui.anStep = 0; S.ui.anDid = {}; S.modal = { anIns: true };
    setTimeout(() => { S.ui.anStep = 1; render(); }, 520);
    setTimeout(() => { S.ui.anStep = 2; render(); }, 1040);
    setTimeout(() => { S.ui.anBusy = false; S.ui.anStep = 0; render(); }, 1560);
  },
  anfix: d => {
    const o = S.db.opps[d.id], f = AN_FIX[d.k]; if (!o || !f || !f.find(o)) return;
    S.ui.anDid = S.ui.anDid || {}; S.ui.anDid[anKey(d.id, d.k)] = f.run(o);
    toast(S.ui.anDid[anKey(d.id, d.k)]);
  },
  anfixall: d => {
    const H = HIST[S.ui.ap || 12], i = insights(H)[+d.n]; if (!i) return;
    S.ui.anDid = S.ui.anDid || {};
    anFixes(i).forEach(f => { if (AN_FIX[f.k].find(f.o)) S.ui.anDid[anKey(f.o.meta.id, f.k)] = AN_FIX[f.k].run(f.o); });
    toast('Everything I could change on this record is done.');
  }
});
const _anClose = ACT.closemodal;
ACT.closemodal = () => { S.ui.anIns = null; S.ui.anBusy = false; S.ui.anDid = {}; S.ui.anCard = null; return _anClose(); };
const _anOverlays = overlays;
overlays = function () { return _anOverlays() + (S.modal && S.modal.anIns ? anInsightModal() : '') + (S.modal && S.modal.anCard ? anCardModal() : ''); };

/* ---------------- the headline row ----------------
   One lead card carries the pipeline: the figure, what it is worth once the
   win rate is applied, and how it splits across the stages. The split is read
   off the live stages, so the bar and the legend always add back to the figure
   above them. The three cards beside it stay plain; only the one asking for a
   decision is tinted, so the tint means something. */
const AN_SEG = [
  ['Qualifying', s => s <= 4, '--brand-solid'],
  ['Engineering & pricing', s => s >= 5 && s <= 7, '--ai-teal'],
  ['Proposal', s => s === 8, '--ai-sky'],
  ['Awaiting award', s => s >= 9, '--warning-fg']
];
function anHead(H, wr, dec, live, ins) {
  const rows = [...live.map(o => ({ v: num(o.meta.value), s: o.pos })), ...PIPE.filter(p => !p.main).map(p => ({ v: p.value, s: p.stage }))];
  const tot = rows.reduce((a, r) => a + r.v, 0);
  const seg = AN_SEG.map(([l, f, c]) => [l, rows.filter(r => f(r.s)).reduce((a, r) => a + r.v, 0), c]).filter(s => s[1] > 0);
  const hi = ins.filter(i => i[0] === 'high').length;
  const card = (l, v, d, cls, extra) => `<article class="anh-card ${cls || ''}"><span class="eyebrow">${l}</span><span class="v">${v}</span>${extra || ''}${d ? `<span class="d">${d}</span>` : ''}</article>`;
  return `<div class="anh">
   <article class="anh-lead">
     <span class="eyebrow">Live pipeline · ${rows.length} bids</span>
     <div class="anh-fig"><span class="v">${cr(tot, 0)}</span><span class="anh-delta">≈ ${cr(Math.round(tot * wr / 100), 0)} at a ${wr}% win rate</span></div>
     <div class="anh-bar" role="img" aria-label="${esc(seg.map(s => `${s[0]} ${cr(s[1], 0)}`).join(', '))}">${seg.map(s => `<i style="flex:${s[1]};background:var(${s[2]})"></i>`).join('')}</div>
     <ul class="anh-key">${seg.map(s => `<li><i style="background:var(${s[2]})"></i><span>${esc(s[0])}</span><b>${cr(s[1], 0)}</b></li>`).join('')}</ul>
   </article>
   ${card('Win rate', wr + '%', `${H.won} of ${dec} decided`, 'ok', `<div class="anh-rail"><i style="width:${wr}%"></i></div>`)}
   ${card('Avg margin at G2', H.margin + '%', 'across the bids that were won')}
   ${card('Need your decision', ins.length, `${hi} high priority · ${ins.length - hi} to review`, hi ? 'warn tint' : 'tint')}
  </div>`;
}


/* ============================================================================
   The assistant on this page is a chip, not a brief.
   ----------------------------------------------------------------------------
   Each piece of advice shows as one line with an orb beside it. Opening it
   gives the whole reading and the buttons that change something. Nothing here
   is a second column of prose.
   ========================================================================== */

/* a rule the analytics page sets on the tenant: it persists and is audited */
const anRules = () => (S.cfg.anRules = S.cfg.anRules || {});
function anRuleFoot(key, text, cta) {
  const r = anRules()[key];
  return r
    ? `<div class="an-rule">${IC.check}<div><b>Rule in force</b><span>${esc(r.text)} · set ${esc(r.ts)}</span></div>
       <button class="btn sm ghost" data-a="anruleoff" data-k="${esc(key)}">Remove</button></div>`
    : `<button class="btn sm pri" data-a="anruleon" data-k="${esc(key)}" data-text="${esc(text)}">${cta}</button>
       <span class="sub">It applies from the next bid that qualifies. You can remove it here.</span>`;
}

/* ---- the three readings ----------------------------------------------- */
const AN_ADVICE = {};

/* why we lost */
AN_ADVICE.loss = {
  t: 'Why we lost',
  one: H => {
    const tot = H.loss.reduce((a, l) => a + l[1], 0);
    const pr1 = H.loss.find(l => /price/i.test(l[0])) || ['Price', 0];
    const price = pr1[1] + (H.loss.find(l => /NPV/.test(l[0])) || [0, 0])[1];
    return `Price decided ${price} of ${tot} reasons`;
  },
  sub: H => `Read from ${H.lostPrice + H.dq} lost bids over ${S.ui.ap} months`,
  body: H => {
    const tot = H.loss.reduce((a, l) => a + l[1], 0);
    const pr1 = H.loss.find(l => /price/i.test(l[0])) || ['Price', 0];
    const price = pr1[1] + (H.loss.find(l => /NPV/.test(l[0])) || [0, 0])[1];
    const dq = (H.loss.find(l => /disqual/i.test(l[0])) || [0, 0])[1];
    const late = (H.loss.find(l => /late|incomplete/i.test(l[0])) || [0, 0])[1];
    const band = anBand(H);
    const worstType = H.byType.filter(t => t[1] >= 3).sort((a, b) => (a[2] / a[1]) - (b[2] / b[1]))[0];
    const lines = [
      [`<b>${price} of ${tot} reasons were price</b> — ${esc(pr1[0])} and O&amp;M NPV together`, `We came ${H.gap}% over L1 on average. On ${H.lostPrice} priced losses that is the whole gap.`],
      [`<b>${esc(band[0])} is the weakest band</b> at ${Math.round(band[2] / band[1] * 100)}% (${band[2]} of ${band[1]})`, 'Value band is the strongest single predictor in the record.'],
      worstType ? [`<b>${esc(worstType[0])} wins ${Math.round(worstType[2] / worstType[1] * 100)}%</b> across ${worstType[1]} bids`, 'The lowest of any type we bid more than twice.'] : null,
      dq ? [`<b>${dq} were disqualified</b> before evaluation`, 'Those never reached a price. Eligibility, not commercial.'] : null,
      late ? [`<b>${late} arrived late or incomplete</b>`, 'Entirely avoidable, and the cheapest thing on this list to fix.'] : null
    ].filter(Boolean);
    return `<ul class="an-why">${lines.map(l => `<li><span class="an-wd"></span><div><p>${l[0]}</p><span>${l[1]}</span></div></li>`).join('')}</ul>
     <div class="an-sec"><span class="eyebrow">Recorded loss reasons</span>
      <div class="hbar">${H.loss.map(l => `<div class="r"><span>${esc(l[0])}</span><div class="bar" style="height:10px"><i class="${/price|npv/i.test(l[0]) ? 'warn' : ''}" style="width:${l[1] / Math.max(...H.loss.map(x => x[1])) * 100}%"></i></div><b>${l[1]}</b></div>`).join('')}</div>
      <p class="sub">A bid can carry more than one reason, so these ${tot} do not sum to the ${H.lostPrice + H.dq} bids lost.</p></div>`;
  },
  foot: H => { const band = anBand(H); return anRuleFoot(`band:${band[0]}`, `Value-engineering review before G1 on every bid in ${band[0]}`, `Set a ${esc(band[0])} review rule`); }
};
const anBand = H => H.byBand.slice().sort((a, b) => (a[2] / a[1]) - (b[2] / b[1]))[0];

/* bid timing */
const AN_FIX_STAGE = {
  'Capture → G1': ['Decide bid/no-bid on the brief alone', 'The brief carries enough to decide. Waiting for the full pack adds days and rarely changes the answer.'],
  'G1 → G2 (engineering, pricing)': ['Freeze the design basis before pricing starts', 'Most of this stage is re-pricing after the basis moves. Lock it, and price once.'],
  'G2 → G3 (proposal)': ['Draft from approved blocks, not from blank', 'Reuse sits at 41%. Every point of reuse is roughly half a day off this stage.']
};
const anDays = d => { const n = +d.toFixed(1); return (n % 1 ? n : Math.round(n)) + (n === 1 ? ' day' : ' days'); };
const anOurs = c => !/award/i.test(c[0]);
const anSlipped = H => H.cycle.filter(c => c[1] > c[2] && anOurs(c)).sort((a, b) => (b[1] - b[2]) - (a[1] - a[2]) || (b[1] / b[2]) - (a[1] / a[2]));
AN_ADVICE.cycle = {
  t: 'Bid timing',
  one: H => { const o = anSlipped(H); return o.length ? `${esc(o[0][0].replace(/ \(.*\)/, ''))} runs ${anDays(o[0][1] - o[0][2])} over target` : 'Every stage is inside its target'; },
  sub: H => { const o = anSlipped(H), n = H.cycle.filter(anOurs).length; return o.length ? (o.length === n ? `All ${n} stages we control are over target` : `${o.length} of the ${n} stages we control are over target`) : 'Nothing on our side is running long'; },
  body: H => {
    const ours = anSlipped(H), theirs = H.cycle.filter(c => c[1] > c[2] && !anOurs(c));
    if (!ours.length) return `<p class="sub">Nothing on our side is running long.${theirs.length ? ` ${esc(theirs[0][0])} is ${anDays(theirs[0][1] - theirs[0][2])} over, but that is the client's clock.` : ''}</p>`;
    const worst = ours[0], slip = worst[1] - worst[2], decided = H.won + H.lostPrice + H.dq;
    return `<ul class="an-why">${ours.map(c => { const f = AN_FIX_STAGE[c[0]] || ['', ''];
      return `<li><span class="an-wd"></span><div>
        <p><b>${esc(c[0])}</b> ran <b>${c[1]} days against ${c[2]}</b> — ${anDays(c[1] - c[2])} over, ${Math.round((c[1] - c[2]) / c[2] * 100)}%</p>
        <span>${esc(f[1])}</span></div></li>`; }).join('')}
     ${theirs.map(c => `<li><span class="an-wd is-mute"></span><div><p><b>${esc(c[0])}</b> ran <b>${c[1]} days against ${c[2]}</b></p>
        <span>The client's clock, not ours. Leave it out when you judge the bid team.</span></div></li>`).join('')}</ul>
     <div class="note"><div>Start with <b>${esc(worst[0])}</b>: ${anDays(slip)} over, ${Math.round(slip / worst[2] * 100)}% past its own target. Across the ${decided} bids decided in the last ${S.ui.ap} months that is about <b>${Math.round(slip * decided)} bid-team days a year</b>.</div></div>`;
  },
  foot: H => {
    const ours = anSlipped(H); if (!ours.length) return '';
    const worst = ours[0], fix = AN_FIX_STAGE[worst[0]] || ['Review this stage with the team'];
    return anRuleFoot(`cycle:${worst[0]}`, `${worst[0]}: ${fix[0].charAt(0).toLowerCase() + fix[0].slice(1)}`, esc(fix[0]));
  }
};

/* what the scope costs, and who has to approve the correction */
const AN_INFL = [
  ['Civil works (steel, cement)', 4.8, 42, 'WPI construction materials, 12-month'],
  ['Mechanical equipment', 3.1, 26, 'Supplier quotes re-tested this quarter'],
  ['Electrical & instrumentation', 2.4, 14, 'Supplier quotes re-tested this quarter'],
  ['Labour', 6.2, 18, 'Minimum wage notification and site rates']
];
const AN_APPR = GATES.G2.roles;                       /* the price approval is G2's, so its signatories own this too */
function anReprice(H, live) {
  const o = live.find(x => x.pos <= 8) || live[0];
  const base = o ? num(o.meta.value) : 0;
  const bias = H.estVar, infl = AN_INFL.reduce((a, r) => a + r[1] * r[2], 0) / 100;
  const corrected = base * (1 + bias / 100) * (1 + infl / 100);
  const comp = H.comp.slice().sort((a, b) => b[1] - a[1])[0];
  return { o, base, bias, infl, corrected, comp, compGap: parseFloat(String(comp[3]).replace('−', '-').replace('%', '')), gap: H.gap, over: (corrected / base - 1) * 100 };
}
const anWaiting = r => AN_APPR.filter(x => !(r.ok || []).includes(x));
AN_ADVICE.cost = {
  t: 'What this scope actually costs',
  one: (H, live) => { const r = anReprice(H, live); if (!r.o) return 'No live bid to price.';
    const c = (r.o.ai || {}).reprice;
    if (c && c.st === 'approved') return `${cr(c.v, 0)} approved and carried`;
    if (c && c.st === 'pending') return `${cr(c.v, 0)} waiting on ${anWaiting(c).map(x => ROLES[x].name).join(' and ')}`;
    if (c && c.st === 'sentback') return `${cr(c.v, 0)} sent back by ${esc(c.byWhom || '')}`;
    return `Carried ${r.over.toFixed(1)}% under what this scope now costs`; },
  sub: (H, live) => { const r = anReprice(H, live); return r.o ? `Read against ${esc(r.o.meta.name)} · bias, input movement and what the competition does` : ''; },
  body: (H, live) => {
    const r = anReprice(H, live); if (!r.o) return '';
    return `<ol class="an-steps">
      <li><span>Carried price today</span><b>${cr(r.base, 0)}</b><em>The estimate as it stands at G2</em></li>
      <li><span>Our own bias</span><b>+${r.bias}%</b><em>Delivered projects came in ${r.bias}% over their estimate · the bid-versus-actual lines on this tab</em></li>
      <li><span>Input movement</span><b>+${r.infl.toFixed(1)}%</b><em>Weighted across four input groups by their share of this cost base · breakdown below</em></li>
      <li class="is-ask"><span>Corrected cost</span><b>${cr(r.corrected, 0)}</b><em>The floor for this scope once both are carried — ${r.over.toFixed(1)}% above the price on the record</em></li>
     </ol>
     <div class="note"><div>${cr(r.corrected - r.base, 0)} has to come out of <b>scope or method</b>, not margin. On the last ${H.lostPrice} priced losses we were already ${r.gap}% over L1, so bidding the carried price would be both uncompetitive and under cost.</div></div>
     <div class="an-infl"><span class="eyebrow">Where the input movement comes from</span>
      <ul>${AN_INFL.map(i => `<li><b>${esc(i[0])}</b><em>+${i[1]}%</em><span>${i[2]}% of the cost base · ${esc(i[3])}</span></li>`).join('')}</ul></div>
     <div class="an-comp"><span class="eyebrow">What the competition does</span>
      <p><b>${esc(r.comp[0])}</b> was met on ${r.comp[1]} tenders and priced <b>${esc(r.comp[3])}</b> against us${r.comp[2] ? `, winning ${r.comp[2]}` : ''}. ${r.compGap < 0 ? 'They come in under us, so the corrected cost is the floor to beat on scope, not a number to discount.' : 'They come in above us, so price is not what is losing these bids — check eligibility and the O&amp;M NPV.'}</p>
      <p class="sub">They submit early, so a late corrigendum tends to catch them out. Source: opening sheets and award letters filed in the knowledge library.</p></div>
     ${anApprBox(r)}`;
  },
  foot: (H, live) => {
    const r = anReprice(H, live); if (!r.o) return '';
    const c = (r.o.ai || {}).reprice, mine = AN_APPR.includes(S.role);
    if (!c) return `<button class="btn sm pri" data-a="anreprice" data-id="${esc(r.o.meta.id)}" data-v="${Math.round(r.corrected)}">Send ${cr(r.corrected, 0)} for price approval</button>
      <span class="sub">It goes to ${AN_APPR.map(x => ROLES[x].name).join(' and ')} before it touches the estimate.</span>`;
    if (c.st === 'pending' && mine && !(c.ok || []).includes(S.role))
      return `<button class="btn sm pri" data-a="anapprove" data-id="${esc(r.o.meta.id)}">Approve as ${esc(R().title)}</button>
        <button class="btn sm" data-a="ansendback" data-id="${esc(r.o.meta.id)}">Send back</button>
        <span class="sub">Signing as ${esc(R().name)}.</span>`;
    if (c.st === 'pending')
      return `<span class="sub">Waiting on ${anWaiting(c).map(x => ROLES[x].name).join(' and ')}. Switch “Acting as” to sign as one of them.</span>
        <button class="btn sm ghost" data-a="anwithdraw" data-id="${esc(r.o.meta.id)}">Withdraw</button>`;
    if (c.st === 'approved')
      return `<button class="btn sm ghost" data-a="taskgo" data-t="est" data-id="${esc(r.o.meta.id)}">Open the estimate →</button>
        <button class="btn sm ghost" data-a="anwithdraw" data-id="${esc(r.o.meta.id)}">Withdraw</button>`;
    return `<button class="btn sm pri" data-a="anreprice" data-id="${esc(r.o.meta.id)}" data-v="${Math.round(r.corrected)}">Re-submit ${cr(r.corrected, 0)}</button>`;
  }
};
/* the approval trail, shown inside the reading rather than as a toast */
function anApprBox(r) {
  const c = (r.o.ai || {}).reprice; if (!c) return '';
  const rows = [[`${cr(c.v, 0)} submitted`, `${esc(c.by)} · ${esc(c.ts)}`, 'done']]
    .concat(AN_APPR.map(x => (c.ok || []).includes(x)
      ? [`${ROLES[x].name} approved`, `${ROLES[x].title} · ${esc((c.at || {})[x] || '')}`, 'done']
      : [`${ROLES[x].name}`, c.st === 'sentback' ? 'Sent back' : `${ROLES[x].title} · waiting`, c.st === 'sentback' ? 'bad' : 'wait']));
  return `<div class="an-appr"><span class="eyebrow">Price approval</span>
   <ol>${rows.map(w => `<li class="is-${w[2]}">${w[2] === 'done' ? IC.check : w[2] === 'bad' ? IC.alert : '<i></i>'}<div><b>${w[0]}</b><span>${w[1]}</span></div></li>`).join('')}</ol>
   ${c.st === 'approved' ? `<p class="sub">Approved in full. The estimate carries ${cr(c.v, 0)} as the corrected cost.</p>`
      : c.st === 'sentback' ? `<p class="sub">${esc(c.note || 'Sent back without a note.')}</p>`
        : `<p class="sub">Nothing reaches the estimate until both have signed.</p>`}</div>`;
}

/* ---- the chip, and the modal it opens --------------------------------- */
function anSug(k, H, live) {
  const A = AN_ADVICE[k]; if (!A) return '';
  const st = k === 'cost' ? ((((live.find(x => x.pos <= 8) || live[0]) || {}).ai || {}).reprice || {}).st : null;
  return `<button class="an-sug${st ? ' is-' + st : ''}" data-a="ansug" data-k="${k}">
   <span class="an-sugo" aria-hidden="true">${IC.spark}</span>
   <span class="an-sugb"><b>${esc(A.t)}</b><span>${A.one(H, live)}</span></span>
   <span class="an-sugc" aria-hidden="true">${IC.next}</span></button>`;
}
function anCardModal() {
  const k = S.ui.anCard; if (!k || !AN_ADVICE[k]) return '';
  const A = AN_ADVICE[k], H = HIST[S.ui.ap || 12], live = liveOpps();
  const foot = A.foot ? A.foot(H, live) : '';
  return `<div class="scrim" data-a="closemodal"><div class="modal lg" role="dialog" aria-modal="true" aria-labelledby="anct">
   <div class="mh"><div class="row" style="gap:10px;flex-wrap:nowrap;min-width:0"><span class="an-pill lg ico-only" role="img" aria-label="Suggested by bidPlan">${IC.spark}</span>
     <div style="min-width:0"><h2 id="anct">${esc(A.t)}</h2><span class="sub">${A.sub(H, live)}</span></div></div>
    <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
   <div class="mb"><div class="stack" style="gap:16px">${A.body(H, live)}</div></div>
   ${foot ? `<div class="mf an-mf">${foot}</div>` : ''}</div></div>`;
}

Object.assign(ACT, {
  ansug: d => { S.ui.anCard = d.k; S.modal = { anCard: true }; },
  anruleon: d => { anRules()[d.k] = { text: d.text, ts: nowTs() }; log('Set a bid rule from analytics', d.text); toast('Rule in force — ' + d.text); },
  anruleoff: d => { const t = (anRules()[d.k] || {}).text; delete anRules()[d.k]; log('Removed a bid rule', t || d.k); toast('Rule removed.'); },
  anreprice: d => {
    const o = S.db.opps[d.id]; if (!o) return;
    o.ai = o.ai || {}; o.ai.reprice = { v: +d.v, ts: nowTs(), by: R().name, st: 'pending', ok: [], at: {} };
    log('Submitted a corrected cost for price approval', `${o.meta.id} · ${cr(+d.v, 0)} · to ${AN_APPR.map(x => ROLES[x].name).join(', ')}`);
    toast(`${cr(+d.v, 0)} sent to ${AN_APPR.map(x => ROLES[x].name).join(' and ')} for approval.`);
  },
  anapprove: d => {
    const o = S.db.opps[d.id], c = o && (o.ai || {}).reprice; if (!c || !AN_APPR.includes(S.role)) return;
    c.ok = (c.ok || []).concat([S.role]); c.at = c.at || {}; c.at[S.role] = nowTs(); c.st = 'pending';
    if (AN_APPR.every(x => c.ok.includes(x))) { c.st = 'approved'; c.doneTs = nowTs(); }
    log(`Approved the corrected cost as ${R().title}`, `${o.meta.id} · ${cr(c.v, 0)}`);
    toast(c.st === 'approved' ? `Approved in full. ${cr(c.v, 0)} is carried on the estimate.` : `Approved. Still waiting on ${anWaiting(c).map(x => ROLES[x].name).join(' and ')}.`);
  },
  ansendback: d => {
    const o = S.db.opps[d.id], c = o && (o.ai || {}).reprice; if (!c) return;
    c.st = 'sentback'; c.byWhom = R().name; c.note = `Sent back by ${R().name} (${R().title}) at ${nowTs()}.`;
    log('Sent the corrected cost back', `${o.meta.id} · ${cr(c.v, 0)}`); toast('Sent back to the estimator.');
  },
  anwithdraw: d => {
    const o = S.db.opps[d.id]; if (!o || !o.ai) return;
    const c = o.ai.reprice; delete o.ai.reprice;
    log('Withdrew the corrected cost', `${o.meta.id}${c ? ' · ' + cr(c.v, 0) : ''}`); toast('Withdrawn.');
  }
});

/* ---- competitors, with where the figures came from ---- */
function anCompetitors(H) {
  const early = ['Vishwa Aqua Infra'];
  return `<section class="panel"><div class="ph"><div><h3>Competitors met</h3>
      <span class="sub">From the opening sheets and award letters filed in the library · ${H.comp.reduce((a, c) => a + c[1], 0)} encounters</span></div></div>
    <div class="tw"><table class="t"><thead><tr><th>Competitor</th><th class="num">Met</th><th class="num">They won</th><th class="num">Their price vs ours</th><th>Behaviour</th><th>Source</th></tr></thead>
    <tbody>${H.comp.map(c => `<tr><td><b>${esc(c[0])}</b></td><td class="num mono">${c[1]}</td><td class="num mono">${c[2]}</td>
      <td class="num mono ${/^−/.test(c[3]) ? 'an-under' : ''}">${esc(c[3])}</td>
      <td>${early.includes(c[0]) ? '<span class="chip warn">Submits early</span>' : '<span class="sub">Submits on the day</span>'}</td>
      <td class="sub">Opening sheet${c[1] > 1 ? 's' : ''} · ${c[1]} tender${c[1] > 1 ? 's' : ''}</td></tr>`).join('')}</tbody></table></div></section>`;
}


/* ---------------- the page ---------------- */
function vAnalytics() {
  S.ui.ap = S.ui.ap || 12;
  const H = HIST[S.ui.ap], dec = H.won + H.lostPrice + H.dq, wr = Math.round(H.won / dec * 100);
  const live = liveOpps(), ins = insights(H);
  const T = subtabs('an', [['ins', 'What to act on', ins.length], ['win', 'Win / loss'], ['pipe', 'Pipeline'], ['eff', 'Bid efficiency'], ['est', 'Estimate accuracy'], ['ai', 'AI usage'], ['aud', 'Audit trail', S.audit.length]]);
  const hb = (rows, mx, cls) => `<div class="hbar">${rows.map(r => `<div class="r"><span>${esc(r[0])}</span><div class="bar" style="height:12px"><i class="${cls ? cls(r) : ''}" style="width:${Math.max(1, r[1] / mx * 100)}%"></i></div><b>${r[2] != null ? esc(String(r[2])) : fmtN(r[1], r[1] % 1 ? 1 : 0)}</b></div>`).join('')}</div>`;
  let x = '';

  if (T.cur === 'ins') {
    const hi = ins.filter(i => i[0] === 'high').length, md = ins.filter(i => i[0] === 'medium').length;
    x = `${strip([['Needs action', ins.length, `${hi} high · ${md} medium`, hi ? 'warn' : ''], ['Live bids', live.filter(o => o.pos <= 8).length, 'at or before submission'], ['Next submission', (() => { const s = live.filter(o => o.pos <= 8).map(o => daysTo(o.meta.submission)).filter(d => d >= 0).sort((a, b) => a - b)[0]; return s == null ? '—' : s + ' d'; })(), 'days away']])}
     <div class="panel"><div class="ph"><div><h3>What to act on now</h3><span class="sub">Read from live records and the last ${S.ui.ap} months. Fix this reads the tender behind the insight; Open goes to the screen that fixes it.</span></div></div>
      <div class="pb flush">${ins.map((i, n) => anInsight(i, n)).join('')}</div></div>`;
  }

  if (T.cur === 'win') {
    const typeKey = i => 'out:' + i, outKey = i => 'in:' + i;
    x = `${strip([['Win rate', wr + '%', `${H.won} of ${dec} decided`], ['Lost on price', H.lostPrice, `by ${H.gap}% on average`, 'warn'], ['Disqualified', H.dq, 'before evaluation', H.dq ? 'bad' : ''], ['Declined', H.nobid, 'no-bid at G1']])}
     <div class="grid g2">
      <div class="panel"><div class="ph"><div><h3>Outcomes and project types</h3><span class="sub">Inner ring: how the ${dec} decided bids ended. Outer: the types. Click a slice or a legend to isolate it.</span></div></div>
       <div class="pb">${anWinChart(H)}
        <div class="an-key">${[['Won', AN_SHADE[0]], ['Lost on price', AN_SHADE[1]], ['Disqualified', AN_SHADE[2]]].map((k, i) => `<button class="an-lg" data-legend-for="win" data-sl="${outKey(i)}"><i style="background:var(${k[1]})"></i>${esc(k[0])}</button>`).join('')}</div>
        <div class="an-key">${H.byType.map((t, i) => `<button class="an-lg" data-legend-for="win" data-sl="${typeKey(i)}"><i style="background:var(${AN_TYPE[i % AN_TYPE.length]})"></i>${esc(t[0])} <b>${t[2]}/${t[1]}</b></button>`).join('')}</div></div></div>
      <div class="panel"><div class="ph"><div><h3>Win rate by contract value</h3><span class="sub">The band is the strongest single predictor in the record.</span></div>${anSug('loss', H, live)}</div>
       <div class="pb">${hb(H.byBand.map(t => [t[0], t[2] / t[1] * 100, `${t[2]}/${t[1]}`]), 100)}</div></div>
     </div>
     ${anCompetitors(H)}`;
  }

  if (T.cur === 'pipe') {
    const all = [...live.map(o => ({ s: o.pos, v: num(o.meta.value), fit: o.meta.fit || 60, name: o.meta.name, due: o.meta.submission })), ...PIPE.filter(p => !p.main).map(p => ({ s: p.stage, v: p.value, fit: p.fit, name: p.name }))];
    const wtd = all.reduce((a, p) => a + p.v * (p.fit / 100) * (wr / 100), 0);
    const funnel = [['Capture → intelligence', 0, 0], ['Bid / no-bid', 0, 0], ['Engineering & pricing', 0, 0], ['Proposal', 0, 0], ['Negotiation', 0, 0]];
    all.forEach(p => { const k = p.s <= 3 ? 0 : p.s === 4 ? 1 : p.s <= 7 ? 2 : p.s === 8 ? 3 : 4; funnel[k][1] += p.v; funnel[k][2]++; });
    x = `${strip([['Pipeline value', cr(all.reduce((a, p) => a + p.v, 0), 0)], ['Expected awards', cr(wtd, 0), 'value × fit × win rate'], ['Due in 30 days', live.filter(o => daysTo(o.meta.submission) <= 30 && daysTo(o.meta.submission) >= 0).length], ['Bid team load', live.filter(o => o.pos <= 8).length, 'live bids, capacity 4', live.filter(o => o.pos <= 8).length > 4 ? 'warn' : '']])}
     <div class="grid g2">
      <div class="panel"><div class="ph"><h3>Value by stage (₹ Cr)</h3></div><div class="pb">${hb(funnel.map(f => [f[0], f[1], `${fmtN(f[1])} · ${f[2]}`]), Math.max(...funnel.map(f => f[1])) || 1)}</div></div>
      <div class="panel"><div class="ph"><h3>Upcoming submissions</h3></div><div class="tw"><table class="t"><tbody>${live.filter(o => o.pos <= 8).sort((a, b) => new Date(a.meta.submission) - new Date(b.meta.submission)).map(o => `<tr><td>${esc(o.meta.name)}</td><td class="num mono">${cr(num(o.meta.value), 0)}</td><td class="num mono">${daysTo(o.meta.submission)} d</td></tr>`).join('')}</tbody></table></div></div></div>`;
  }

  if (T.cur === 'eff') {
    x = `${strip([['Days to G1', H.cycle[0][1], 'target ' + H.cycle[0][2], H.cycle[0][1] <= H.cycle[0][2] ? 'ok' : 'warn'], ['Bid cost per win', '₹2.6 Cr'], ['Proposal reuse', '41%', 'from approved blocks'], ['No-bid rate', Math.round(H.nobid / (dec + H.nobid) * 100) + '%', 'healthy 15–25%']])}
     <div class="panel"><div class="ph"><div><h3>Cycle time by stage (days)</h3><span class="sub">bar = days taken · figure = taken / target · brown means over</span></div>${anSug('cycle', H, live)}</div><div class="pb">${hb(H.cycle.map(c => [c[0], c[1], `${c[1]} / ${c[2]}`]), Math.max(...H.cycle.map(c => c[1])), r => { const t = H.cycle.find(c => c[0] === r[0]); return t && t[1] > t[2] ? 'warn' : ''; })}</div></div>
     <div class="panel"><div class="ph"><h3>Live bids: readiness</h3></div><div class="tw"><table class="t"><thead><tr><th>Tender</th><th class="num">Reqs reviewed</th><th class="num">Sections approved</th><th class="num">Open queries</th><th class="num">Days left</th></tr></thead><tbody>${live.filter(o => o.pos <= 8).map(o => { const pr = o.prop, ap = pr ? pr.tree.filter(s => s.st === 'approved').length : 0, tt = pr ? pr.tree.length : 0; return `<tr><td>${esc(o.meta.name)}</td><td class="num mono">${o.reqs.filter(r => r.st !== 'proposed').length}/${o.reqs.length}</td><td class="num mono">${ap}/${tt}</td><td class="num mono">${o.clars.filter(c => c.status !== 'answered').length}</td><td class="num mono">${daysTo(o.meta.submission)}</td></tr>`; }).join('')}</tbody></table></div></div>`;
  }

  if (T.cur === 'est') {
    const rows = live.flatMap(o => o.bva.map(b => [o.meta.name, b]));
    x = `${strip([['Estimate vs final cost', '+' + H.estVar + '%', 'delivered projects', 'warn'], ['Margin at G2', H.margin + '%'], ['Lines over 10%', rows.filter(r => r[1].bid && Math.abs((r[1].act - r[1].bid) / r[1].bid) > 0.1).length, 'of ' + rows.length + ' measured']])}
     <div class="panel"><div class="ph"><div><h3>Bid rate against what it cost</h3><span class="sub">From delivered projects. The estimator should start from the actual.</span></div>${anSug('cost', H, live)}</div>
      <div class="tw"><table class="t"><thead><tr><th>Project</th><th>Item</th><th class="num">Bid</th><th class="num">Actual</th><th class="num">Variance</th></tr></thead><tbody>${rows.length ? rows.map(([nm, b]) => { const g = b.bid ? (b.act - b.bid) / b.bid : 0; return `<tr><td>${esc(nm)}</td><td>${esc(b.item || '—')}</td><td class="num mono">${fmtN(b.bid)}</td><td class="num mono">${fmtN(b.act)}</td><td class="num mono" style="${Math.abs(g) > 0.1 ? 'color:var(--warning-fg)' : ''}">${g > 0 ? '+' : ''}${Math.round(g * 100)}%</td></tr>`; }).join('') : '<tr><td colspan="5" class="sub">No bid-versus-actual lines recorded yet.</td></tr>'}</tbody></table></div></div>`;
  }

  if (T.cur === 'ai') {
    x = `${strip([['Model runs this month', '14,820'], ['Accepted with light edits', '64%', 'target ≥ 60%', 'ok'], ['Hours saved per bid', '38'], ['Agents active', AGENTS.length]])}
     <div class="panel"><div class="ph"><div><h3>Agent accuracy against the gold set</h3><span class="sub">Every agent hands its work to a named person; none of them signs a gate.</span></div></div>
      <div class="tw"><table class="t"><thead><tr><th>Agent</th><th>Review control</th><th class="num">Accuracy</th></tr></thead><tbody>${AGENTS.map(a => `<tr><td><b>${esc(a[0])}</b></td><td class="sub">${esc(a[4])}</td><td class="num mono">${a[5]}%</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  if (T.cur === 'aud') {
    const who = S.ui.anw && S.audit.some(a => a[1] === S.ui.anw) ? S.ui.anw : null;
    const rows = who ? S.audit.filter(a => a[1] === who) : S.audit;
    const people = [...new Set(S.audit.map(a => a[1]))];
    x = `${strip([['Entries logged', S.audit.length, 'this browser, append-only'], ['People active', people.length], ['Changes today', S.audit.filter(a => /^\s*\d+\s/.test(a[0])).length]])}
     <div class="panel"><div class="ph"><div><h3>Who changed what</h3><span class="sub">${who ? `${rows.length} of ${S.audit.length} entries` : 'Newest first'}</span></div>
      <div class="row" style="gap:6px;flex-wrap:wrap">${people.map(p => `<button class="btn sm ${who === p ? 'pri' : ''}" data-a="anwho" data-v="${esc(p)}">${esc(p)}</button>`).join('')}${who ? '<button class="btn sm" data-a="anwho" data-v="">All</button>' : ''}</div></div>
      <div class="tw"><table class="t"><thead><tr><th style="width:150px">When</th><th style="width:190px">Who</th><th>What</th></tr></thead><tbody>${rows.slice(0, 120).map(a => `<tr><td class="mono sub">${esc(a[0])}</td><td>${esc(a[1])}</td><td>${esc(a[2])}</td></tr>`).join('')}</tbody></table></div>
      <div class="pb row between"><span class="sub">The full log, with search and export, is in the Admin console.</span><button class="btn sm" data-a="go" data-v="admin">Admin console →</button></div></div>`;
  }

  return `${sh('Reports & analytics', 'Pipeline, win/loss and estimate vs actual', 'The headline figures, then the insights that need action.',
    `<div class="seg">${[12, 24].map(m => `<button class="${S.ui.ap === m ? 'on' : ''}" data-a="aperiod" data-v="${m}">${m} months</button>`).join('')}</div>`)}
  ${anHead(H, wr, dec, live, ins)}
  ${T.html}${x}`;
}
