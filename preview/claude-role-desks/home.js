/* ============================================================================
   Overview — the dashboard.
   ----------------------------------------------------------------------------
   There is no separate AI panel. Each card reads its own figures and says what
   they mean at its foot, and each can be asked a follow-up that answers inside
   the same card. Nothing is written in: every number and every sentence is
   derived from the live records, so the page is wrong the moment they are.

   Prefixed hm / HM_ because the app loads classic scripts.
   ========================================================================== */

const hmFx = (kind, opts, cls, id) => { const f = kind === 'orb' ? orbFit(opts, cls) : { opts, cls, style: '' };
  return `<span class="${f.cls || 'fx-host'}" style="${f.style}" data-fx="${kind}" data-fxid="${id}" data-fxo='${JSON.stringify(f.opts)}' aria-hidden="true"></span>`; };
function hmS() { S.hm = S.hm || { ask: null, busy: false, step: 0 }; return S.hm; }
const hmPlural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;

/* ---------------- the card-level assistant ----------------
   A reading sits under the figures; "Ask" opens a longer answer in place. */
const HM_THINK = [['searching', 'Reading the records'], ['solving', 'Working it out'], ['composing', 'Writing it up']];
const HM_READS = {};
function hmRead(id, line, deeper) {
  if (deeper) HM_READS[id] = { line, deeper };
  return `<div class="hm-ai">
    <div class="hm-airow">${hmFx('orb', { state: 'breathing', size: 18 }, 'hm-orb', 'hm' + id)}
      <p>${line}</p>
      ${deeper ? `<button class="hm-askb" data-a="hmask" data-id="${esc(id)}">Ask</button>` : ''}</div></div>`;
}

/* ---------------- shared reads ---------------- */
const HM_PH = [
  ['Qualifying', s => s <= 4, '--viz-1'],
  ['Engineering & pricing', s => s >= 5 && s <= 7, '--viz-2'],
  ['Proposal', s => s === 8, '--viz-4'],
  ['Awaiting award', s => s >= 9, '--viz-5']
];
function hmBook() {
  const live = liveOpps().map(o => ({ v: num(o.meta.value), s: o.pos, o }));
  const rest = PIPE.filter(p => !p.main && on('types', p.type)).map(p => ({ v: p.value, s: p.stage, o: null }));
  const rows = live.concat(rest);
  return { rows, total: rows.reduce((a, r) => a + r.v, 0), live };
}
/* everything that is wrong across the live tenders, worst first */
function hmFindings() {
  const out = [], live = liveOpps();
  live.forEach(o => {
    const d = daysTo(o.meta.submission), nm = o.meta.name;
    Object.entries(GATES).forEach(([g, G]) => {
      if (G.stage < o.pos && !gateSigned(g) && gateBypassed(g))
        out.push({ sev: 'high', t: `${g} was never signed`, w: `${G.name} needs ${G.roles.map(r => ROLES[r].title).join(' and ')}. The tender moved past it anyway.`, tab: G.tab, id: o.meta.id, sub: G.sub, o });
    });
    if (o.pos <= 8 && d >= 0 && d <= 45) {
      const open = o.prop ? o.prop.tree.filter(s => s.st !== 'approved').length : 0;
      if (open) out.push({ sev: d <= 21 ? 'high' : 'medium', t: `${hmPlural(open, 'section')} not approved`, w: `${d} days to submission.`, tab: 'pown', id: o.meta.id, o });
    }
    const oc = o.clars.filter(c => c.status !== 'answered');
    if (oc.length) { const dr = oc.filter(c => c.status === 'draft').length;
      out.push({ sev: 'medium', t: `${hmPlural(oc.length, 'clarification')} open`, w: dr ? `${dr} ${dr === 1 ? 'is a draft that has' : 'are drafts that have'} not been sent.` : 'All are with the client.', tab: 'clar', id: o.meta.id, o }); }
    const late = (o.longlead || []).filter(l => typeof llFloat === 'function' && llFloat(l) < 0);
    if (late.length) out.push({ sev: 'high', t: `${esc(late.map(l => l.item).join(', '))} arrives late`, w: 'Pre-order at letter of award, or offer it as owner-furnished.', tab: 'proc', id: o.meta.id, o });
    const hr = o.risks.filter(r => r.l * r.i >= 16 && r.treat !== 'Price');
    if (hr.length) out.push({ sev: 'medium', t: `${hmPlural(hr.length, 'high risk')} unpriced`, w: `${cr(hr.reduce((a, r) => a + (typeof expo === 'function' ? expo(r) : 0), 0))} of exposure outside the estimate.`, tab: 'risks', id: o.meta.id, o });
  });
  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.sev] - rank[b.sev]);
}

/* ---------------- the headline cards ---------------- */
function dRing(pct, big, label, sub) {
  const r = 52, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct));
  return `<div class="d-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${r}" class="d-ring-t"/><circle cx="60" cy="60" r="${r}" class="d-ring-v" stroke-dasharray="${(c * p / 100).toFixed(1)} ${c.toFixed(1)}"/></svg>
   <div class="d-ring-tx"><b>${big}</b><span>${esc(label)}</span></div></div>${sub ? `<p class="d-note">${sub}</p>` : ''}`;
}
/* The figures, split: four compact tiles beside the assistant, then the
   book, the phase split and the findings in the grid below. */
function hmFigs() {
  const B = hmBook(), H = HIST[12], dec = H.won + H.lostPrice + H.dq, wr = Math.round(H.won / dec * 100);
  const seg = HM_PH.map(([l, fn, c]) => [l, B.rows.filter(r => fn(r.s)).reduce((a, r) => a + r.v, 0), c, B.rows.filter(r => fn(r.s)).length]).filter(x => x[1] > 0);
  const f = hmFindings(), hi = f.filter(x => x.sev === 'high').length;
  const q = typeof myTasks === 'function' ? myTasks().length : 0;
  const next = liveOpps().map(o => ({ d: daysTo(o.meta.submission), o })).filter(x => x.d >= 0).sort((a, b) => a.d - b.d)[0];
  return { B, H, dec, wr, seg, f, hi, q, next };
}
function hmKpiBand() {
  const { B, H, dec, wr, seg, f, hi, q, next } = hmFigs();
  const big = seg.slice().sort((a, b) => b[1] - a[1])[0];
  const lossTop = H.loss.slice().sort((a, b) => b[1] - a[1])[0];
  const prop = seg.filter(x => x[0] === 'Proposal').reduce((a, x) => a + x[1], 0);
  return `<div class="d-band">
   <article class="d-kpi d-kpi-book"><div class="d-stat-h"><span class="eyebrow">The book · ${hmPlural(B.rows.length, 'opportunity', 'opportunities')}</span></div>
    <div class="d-bookv"><b>${cr(B.total, 0)}</b><span class="d-note">≈ ${cr(Math.round(B.total * wr / 100), 0)} at a ${wr}% win rate${next ? ` · next due in ${next.d} d` : ''}</span></div>
    <div class="hm-bar" role="img" aria-label="${esc(seg.map(x => `${x[0]} ${cr(x[1], 0)}`).join(', '))}">${seg.map(x => `<i style="flex:${x[1]};background:var(${x[2]})"></i>`).join('')}</div>
    <ul class="d-bleg">${seg.map(x => `<li><i style="background:var(${x[2]})"></i><span>${esc(x[0])}</span><b>${cr(x[1], 0)}</b></li>`).join('')}</ul>
    ${hmRead('kband', `<b>${esc(big[0])}</b> holds ${Math.round(big[1] / B.total * 100)}% of the book. Only ${cr(prop, 0)} has reached a priced proposal.`,
      () => `<p>The weighted figure uses the 12-month win rate of ${wr}%, not a per-bid probability, so read it as a ceiling rather than a forecast.</p>
        <ul>${seg.map(x => `<li><b>${esc(x[0])}</b> — ${cr(x[1], 0)} across ${hmPlural(x[3], 'bid')}</li>`).join('')}</ul>`)}</article>
   <article class="d-kpi"><div class="d-stat-h"><span class="eyebrow">Win rate</span></div>
    <b>${wr}%</b><div class="hm-rail"><i style="width:${Math.min(100, wr)}%"></i></div>
    <span class="d-note">${H.won} of ${dec} decided in 12 months</span>
    ${hmRead('kwin', `<b>${esc(lossTop[0])}</b> decided ${lossTop[1]} of the ${H.loss.reduce((a, x) => a + x[1], 0)} recorded loss reasons.`,
      () => `<ul>${H.loss.slice().sort((a, b) => b[1] - a[1]).map(x => `<li><b>${esc(x[0])}</b> — ${hmPlural(x[1], 'bid')}</li>`).join('')}</ul>
        <p>Lost on price by ${H.gap}% on average, and ${hmPlural(H.dq, 'bid')} never reached pricing at all.</p>`)}</article>
   <article class="d-kpi"><div class="d-stat-h"><span class="eyebrow">Margin at G2</span></div>
    <b>${H.margin}%</b><div class="hm-rail"><i style="width:${Math.min(100, H.margin / 9 * 100)}%"></i><span class="hm-tick" style="left:100%" title="9% target"></span></div>
    <span class="d-note">Signed into the price, against a 9% target</span>
    ${hmRead('kmar', `Running <b>${(9 - H.margin).toFixed(1)} points</b> under target. Estimates came in <b>${H.estVar}%</b> over on the last cycle.`,
      () => `<p>The figure is the margin approved at G2, before delivery. The ${H.estVar}% estimate variance is measured on projects already finished, so the gap at hand-over is wider than the gap at signing.</p>`)}</article>
   <article class="d-kpi ${hi ? 'is-warn' : ''}"><div class="d-stat-h"><span class="eyebrow">Needs a decision</span><button class="linkbtn" data-a="go" data-v="tasks">Queue →</button></div>
    <b class="${hi ? 'warn' : ''}">${f.length}</b>
    <span class="d-note">${hi ? `${hmPlural(hi, 'item')} cannot wait` : 'Nothing urgent'} · ${hmPlural(q, 'item')} in your queue</span>
    ${f[0] ? hmRead('kdec', `Start with <b>${esc(f[0].t)}</b>${f[0].o ? ` on ${esc(f[0].o.meta.name.split(' ').slice(0, 3).join(' '))}` : ''}.`,
      () => `<ul>${f.slice(0, 4).map(x => `<li><b>${esc(x.t)}</b> — ${x.w}</li>`).join('')}</ul>`) : hmRead('kdec', 'Nothing is outstanding against the live records.')}</article>
  </div>`;
}
function hmBookCard() {
  const { B, wr, seg } = hmFigs(), big = seg.slice().sort((a, b) => b[1] - a[1])[0];
  const nmax = Math.max(...seg.map(x => x[3]), 1);
  return `<section class="panel d-card"><div class="d-stat-h"><span class="d-ic">${IC.pipe}</span><h4>Where the book sits</h4><span class="sub">${cr(B.total, 0)} across ${hmPlural(B.rows.length, 'bid')}</span><button class="linkbtn" data-a="go" data-v="pipeline">Pipeline →</button></div>
   <div class="d-split"><div class="d-bars">${seg.map(x => `<span title="${esc(x[0])}: ${hmPlural(x[3], 'bid')} · ${cr(x[1], 0)}"><i style="height:${Math.max(6, x[3] / nmax * 100)}%;background:var(${x[2]})"></i></span>`).join('')}</div>
    <ul class="d-leg">${seg.map(x => `<li><i style="background:var(${x[2]})"></i><span>${esc(x[0])}</span><b>${cr(x[1], 0)}</b><em>${x[3]}</em></li>`).join('')}</ul></div>
   <div class="hm-bar" role="img" aria-label="${esc(seg.map(x => `${x[0]} ${cr(x[1], 0)}`).join(', '))}">${seg.map(x => `<i style="flex:${x[1]};background:var(${x[2]})"></i>`).join('')}</div>
   ${hmRead('book', `<b>${esc(big[0])}</b> holds ${Math.round(big[1] / B.total * 100)}% of the book. Only ${cr(seg.filter(x => x[0] === 'Proposal').reduce((a, x) => a + x[1], 0), 0)} has reached a priced proposal.`,
    () => {
      const far = seg.filter(x => x[0] === 'Qualifying')[0];
      return `<p>The weighted figure uses the 12-month win rate of ${wr}%, not a per-bid probability, so treat it as a ceiling rather than a forecast.</p>
        <ul>${seg.map(x => `<li><b>${esc(x[0])}</b> — ${cr(x[1], 0)} across ${hmPlural(x[3], 'bid')}</li>`).join('')}</ul>
        <p>${far ? `${cr(far[1], 0)} is still in qualifying, where nothing has been engineered or priced. That is the part of the book most likely to move.` : 'Everything in the book has passed qualifying.'}</p>`;
    })}</section>`;
}
function hmSugg(n) {
  const { f } = hmFigs();
  return `<section class="panel d-card d-ai"><div class="d-stat-h"><span class="d-ic ai">${IC.spark}</span><h4>Suggested next steps</h4><span class="chip ai">${f.length}</span><span class="sub">read from the live records</span></div>
   ${f.length ? `<ul class="d-sg">${f.slice(0, n || 4).map((x, i) => `<li><span class="d-sev ${x.sev === 'high' ? 'high' : 'med'}"></span><span><b>${esc(x.t)}</b> — ${x.w}</span>
     <button class="btn sm" data-a="dashfind" data-i="${i}">Open</button></li>`).join('')}</ul>` : '<p class="d-note">Nothing is outstanding across the live tenders.</p>'}</section>`;
}

/* ---------------- live tenders, each row read ---------------- */
function hmTenders() {
  const live = liveOpps();
  const readRow = o => {
    const d = daysTo(o.meta.submission);
    const byp = Object.keys(GATES).filter(k => gateBypassed(k) && GATES[k].stage < o.pos);
    const open = o.prop ? o.prop.tree.filter(s => s.st !== 'approved').length : 0;
    const oc = o.clars.filter(c => c.status !== 'answered').length;
    if (byp.length) return ['bad', `${byp.join(' and ')} ${byp.length > 1 ? 'were' : 'was'} never signed — it moved past ${byp.length > 1 ? 'them' : 'it'}`];
    if (d <= 21 && open) return ['bad', `${hmPlural(open, 'section')} unapproved with ${d} days left`];
    if (open) return ['warn', `${hmPlural(open, 'section')} still to approve`];
    if (oc) return ['warn', `${hmPlural(oc, 'clarification')} waiting on the client`];
    return ['ok', 'Nothing blocking the next gate'];
  };
  return `<section class="panel"><div class="ph"><div><h3>Live tenders</h3>
      <span class="sub">${hmPlural(live.length, 'tender')} open · ${cr(live.reduce((a, o) => a + num(o.meta.value), 0), 0)}</span></div>
      <button class="linkbtn" data-a="go" data-v="pipeline">Pipeline →</button></div>
    <div class="pb flush"><ul class="hm-tl">${live.map(o => {
    const d = daysTo(o.meta.submission), r = readRow(o);
    const g = Object.entries(GATES).filter(([k, G]) => G.stage >= o.pos && !gateSigned(k)).sort((a, b) => a[1].stage - b[1].stage)[0];
    return `<li><button data-a="opp" data-id="${o.meta.id}">
        <div class="hm-th"><b>${esc(o.meta.name)}</b><span class="mono sub">${o.meta.id} · ${esc(o.meta.client)}</span></div>
        <div class="hm-tm"><span class="chip pk">${o.pos} · ${esc(stageName(o.pos))}</span>${g ? `<span class="gchip pend">${g[0]}</span>` : ''}
          <span class="mono">${cr(num(o.meta.value), 0)}</span>
          <span class="${d <= 21 ? 'hm-soon' : 'sub'}">${fmtDate(o.meta.submission)} · ${d} d</span>
          ${o.meta.fit != null ? `<span class="sub">Fit ${o.meta.fit}</span>` : ''}</div>
        <div class="hm-tr is-${r[0]}">${hmFx('orb', { state: 'breathing', size: 14 }, 'hm-orb', 'ht' + o.meta.id)}<span class="hm-trt">${r[1]}</span></div>
      </button></li>`;
  }).join('')}</ul></div></section>`;
}

/* ---------------- what lands next ---------------- */
function hmRunwayRows() {
  const out = [];
  liveOpps().forEach(o => {
    const d = daysTo(o.meta.submission);
    if (d >= 0) out.push({ d, k: 'Technical bid due', t: o.meta.name, id: o.meta.id, tab: 'psub', hot: d <= 21, why: (() => { const open = o.prop ? o.prop.tree.filter(s => s.st !== 'approved').length : 0; return open ? `${hmPlural(open, 'section')} still unapproved` : 'All sections approved'; })() });
    Object.entries(GATES).forEach(([g, G]) => {
      if (G.stage >= o.pos && !gateSigned(g))
        out.push({ d: Math.max(0, G.stage <= 8 ? d - (8 - G.stage) * 4 - 3 : d + (G.stage - 8) * 5), k: G.name, t: o.meta.name, id: o.meta.id, tab: G.tab, sub: G.sub, gate: g, why: `${G.roles.map(r => ROLES[r].title).join(' + ')} must sign` });
    });
  });
  return out.sort((a, b) => a.d - b.d).map(x => { const dt = new Date(TODAY.getTime() + x.d * 864e5); return Object.assign(x, { when: dt.toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + dt.getDate() }); });
}
function hmRunway() {
  const out = hmRunwayRows();
  const list = out.sort((a, b) => a.d - b.d).slice(0, 6), mx = Math.max(1, ...list.map(x => x.d));
  return `<section class="panel"><div class="ph"><div><h3>What lands next</h3><span class="sub">Deadlines and unsigned gates, soonest first</span></div></div>
    <div class="pb"><ol class="hm-run">${list.map(x => `<li><button data-a="taskgo" data-t="${x.tab}" data-id="${x.id}"${x.sub ? ` data-sub="${x.sub}"` : ''}>
      <span class="hm-rd ${x.hot ? 'is-hot' : ''}">${x.d}<small>d</small></span>
      <span class="hm-rt"><b>${x.gate ? `<span class="gchip pend">${x.gate}</span> ` : ''}${esc(x.k)}</b><span>${esc(x.why)}</span></span>
      <span class="hm-rb"><i style="width:${Math.round((1 - x.d / mx) * 100)}%"></i></span></button></li>`).join('') || '<li><span class="sub">Nothing dated is outstanding.</span></li>'}</ol></div></section>`;
}

/* ---------------- agents ---------------- */
function hmAgents() {
  const A = (typeof AGENTS !== 'undefined' ? AGENTS : []).slice(0, 5);
  const st = (typeof ensureAdmin === 'function' ? ensureAdmin().agents : {}) || {};
  const idx = typeof kxFiles === 'function' ? kxFiles().filter(f => f.idx !== 'done').length : 0;
  return `<section class="panel"><div class="ph"><div><h3>Agents at work</h3>
      <span class="sub">Every output starts as Proposed and is accepted by a person</span></div>
      <button class="linkbtn" data-a="go" data-v="agents">All nine →</button></div>
    <div class="pb"><ul class="hm-ag">${A.map(a => `<li><span class="hm-agav">${typeof agentAv === 'function' ? agentAv(a[0], 30) : ''}</span>
      <span class="hm-agt"><b>${esc(a[0])}</b><span>${esc(a[3])}</span></span>
      <span class="hm-agm"><b>${a[5]}%</b><small>${(st[a[0]] || { on: true }).on ? esc(a[6]) : 'Off'}</small></span></li>`).join('')}</ul>
      ${idx ? `<div class="hm-ai"><div class="hm-airow">${hmFx('orb', { state: 'searching', size: 18 }, 'hm-orb', 'hmlib')}
        <p>The library is still reading <b>${hmPlural(idx, 'file')}</b>; until it finishes Brix cannot answer from ${idx === 1 ? 'it' : 'them'}.</p>
        <button class="hm-askb" data-a="go" data-v="kb">Open</button></div></div>` : ''}</div></section>`;
}

/* ---------------- your queue ---------------- */
function hmQueue() {
  const t = typeof myTasks === 'function' ? myTasks() : [];
  const alert = t.filter(x => x[1] === 'Alert').length, appr = t.filter(x => x[1] === 'Approval').length;
  return `<section class="panel"><div class="ph"><div><h3>Your queue</h3><span class="sub">${esc(R().name)} · ${esc(R().title)}</span></div>
      ${t.length ? `<button class="linkbtn" data-a="go" data-v="tasks">All ${t.length} →</button>` : ''}</div>
    <div class="pb flush">${t.slice(0, 6).map(x => `<div class="flag" style="cursor:pointer" data-a="taskgo" data-t="${x[3]}" data-id="${x[4]}">
      <div class="sev ${x[1] === 'Alert' ? 'high' : x[1] === 'Approval' ? 'medium' : 'ai'}"></div>
      <div class="body"><b style="font-size:13px">${esc(x[0])}</b><span class="sub">${esc(x[1])} · ${esc(x[2])}</span></div></div>`).join('')
      || `<div class="empty"><p>Nothing waiting for you as ${esc(R().title)}.</p></div>`}</div>
    ${t.length ? `<div class="pb" style="padding-top:0">${hmRead('queue', alert ? `<b>${hmPlural(alert, 'alert')}</b> ${alert === 1 ? 'is' : 'are'} ahead of ${hmPlural(appr, 'approval')} — those block someone else.` : `${hmPlural(appr, 'approval')} waiting on you; nothing is overdue.`)}</div>` : ''}</section>`;
}

/* ---------------- the page ---------------- */
/* Lessons from closed bids — the last thing on the left column, so the page ends level. */
function hmLessons() {
  const l = (typeof KB_LESSON !== 'undefined' ? KB_LESSON : []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3);
  if (!l.length) return '';
  return `<section class="panel d-card"><div class="d-stat-h"><span class="d-ic">${IC.book}</span><h4>Lessons worth carrying</h4><span class="sub">from closed bids</span><button class="linkbtn" data-a="go" data-v="kb">Knowledge library →</button></div>
   <ul class="d-les">${l.map(x => `<li><div class="d-lesh"><span class="chip ${/Loss|Disqual/.test(x.theme) ? 'bad' : 'pk'}">${esc(x.theme)}</span><span class="sub">${esc(x.proj)}</span></div><p>${esc(x.lesson)}</p><span class="d-note">${esc(x.by || 'Close-out')} · ${esc(fmtDate(x.date))}</span></li>`).join('')}</ul></section>`;
}
/* ---------------- the Bid Manager's own cards ----------------
   One question: will this bid go out on time, complete and compliant?
   Every figure is read off the open tender's records; a card whose record is
   empty is left out rather than filled in. */
function bmOpp() { const o = O(); if (o && !o.closed) return o; return liveOpps().slice().sort((a, b) => new Date(a.meta.submission) - new Date(b.meta.submission))[0] || null; }
function bmRail(l, done, total, tab, id) {
  const pc = total ? Math.round(done / total * 100) : 0;
  return `<button class="bm-rail" data-a="taskgo" data-t="${tab}" data-id="${esc(id)}"><span class="bm-rl">${esc(l)}</span>
   <span class="bm-rb"><i style="width:${pc}%" class="${pc === 100 ? 'ok' : pc >= 60 ? '' : 'low'}"></i></span>
   <b>${done}/${total}</b></button>`;
}
function bmOnTrack(o) {
  const d = daysTo(o.meta.submission);
  const pr = o.prop || (O() === o && typeof ensureProp === 'function' ? ensureProp() : null), nodes = pr ? allNodes(pr.tree) : [];
  const appr = nodes.filter(n => n.st === 'approved').length;
  const rv = o.reqs.filter(r => r.st !== 'proposed').length;
  const cl = o.clars.filter(c => c.status === 'answered').length;
  const parts = [nodes.length ? appr / nodes.length : 1, o.reqs.length ? rv / o.reqs.length : 1, o.clars.length ? cl / o.clars.length : 1];
  const ready = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length * 100);
  const late = d <= 21 && ready < 80;
  return `<section class="panel d-card ${late ? 'is-warn' : ''}"><div class="d-stat-h"><span class="d-ic ${late ? 'bad' : ''}">${IC.check}</span><h4>On track</h4><span class="chip ${d <= 21 ? 'warn' : ''}">${d} days left</span></div>
   <div class="bm-top"><b class="d-big">${ready}%</b><span class="d-note">ready across sections, requirements and queries · technical bid due ${fmtDate(o.meta.submission)}</span></div>
   <div class="bm-rails">${nodes.length ? bmRail('Sections approved', appr, nodes.length, 'pown', o.meta.id) : ''}
    ${bmRail('Requirements reviewed', rv, o.reqs.length, 'reqs', o.meta.id)}
    ${bmRail('Queries answered', cl, o.clars.length, 'clar', o.meta.id)}</div>
   <p class="d-note">${late ? `At ${ready}% with ${d} days left, the sections are the long pole: nothing else can start until they are approved.` : `${d} days left and ${ready}% of the record is settled. Keep the unapproved sections moving first.`}</p></section>`;
}
function bmChanged(o) {
  const a = o.addenda || []; if (!a.length) return '';
  return `<section class="panel d-card"><div class="d-stat-h"><span class="d-ic">${IC.doc}</span><h4>What changed</h4><span class="chip">${a.length}</span><button class="linkbtn" data-a="taskgo" data-t="docs" data-id="${esc(o.meta.id)}">Documents →</button></div>
   <ul class="bm-list">${a.map(x => { const im = String(x.impact || '').split('\n').filter(Boolean); return `<li><div class="bm-lh"><span class="chip pk">${esc(x.no)}</span><b>${esc(x.title)}</b></div>
    <span class="d-note">${esc(x.date)} · ${esc(x.doc)} · ${hmPlural(im.length, 'thing')} it touches</span>
    ${im.length ? `<ul class="bm-sub">${im.slice(0, 3).map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}</li>`; }).join('')}</ul></section>`;
}
function bmWaiting(o) {
  const rows = [], pr = o.prop;
  if (pr) allNodes(pr.tree).filter(n => n.st !== 'approved').slice(0, 4).forEach(n => rows.push([ROLES[n.st === 'in_review' ? n.rev : n.own] || ROLES.bid_manager, n.title, n.st === 'in_review' ? 'to review' : n.st === 'draft' ? 'to finish the draft' : 'to start', 'pown']));
  o.clars.filter(c => c.status === 'open').slice(0, 2).forEach(c => rows.push([{ name: esc(o.meta.client), title: 'Client', ini: 'CL' }, `Query ${c.id}`, 'to answer', 'clar']));
  Object.entries(GATES).filter(([g, G]) => G.stage >= o.pos && !gateSigned(g)).slice(0, 1).forEach(([g, G]) => rows.push([ROLES[G.roles[0]], `${g} · ${G.name}`, 'to sign', G.tab]));
  if (!rows.length) return '';
  return `<section class="panel d-card"><div class="d-stat-h"><span class="d-ic">${IC.user}</span><h4>Waiting on</h4><span class="chip">${rows.length}</span></div>
   <ul class="bm-wait">${rows.map(r => `<li><button data-a="taskgo" data-t="${r[3]}" data-id="${esc(o.meta.id)}"><span class="av sm">${esc(r[0].ini || (r[0].name || '?').slice(0, 2).toUpperCase())}</span>
    <span class="bm-wtx"><b>${esc(r[1])}</b><small>${esc(r[0].name)} · ${esc(r[0].title)} ${esc(r[2])}</small></span>${IC.next}</button></li>`).join('')}</ul></section>`;
}
function bmQuestions(o) {
  const open = o.clars.filter(c => c.status === 'open'), draft = o.clars.filter(c => c.status === 'draft');
  if (!o.clars.length) return '';
  const pre = (o.dates || []).find(d => /pre-bid/i.test(d.k));
  return `<section class="panel d-card ${draft.length ? 'is-warn' : ''}"><div class="d-stat-h"><span class="d-ic ${draft.length ? 'bad' : ''}">${IC.chat}</span><h4>Questions</h4><span class="chip ${draft.length ? 'warn' : ''}">${draft.length} unsent</span><button class="linkbtn" data-a="taskgo" data-t="clar" data-id="${esc(o.meta.id)}">Queries →</button></div>
   <div class="bm-qs"><span><b>${open.length}</b><small>with the client</small></span><span><b>${draft.length}</b><small>drafted, not sent</small></span><span><b>${o.clars.filter(c => c.status === 'answered').length}</b><small>answered</small></span></div>
   ${pre ? `<p class="d-note">Pre-bid meeting ${esc(pre.d)}. A query not sent before it is a query the client never has to answer.</p>` : ''}
   <ul class="bm-list">${[...draft, ...open].slice(0, 3).map(c => `<li><div class="bm-lh"><span class="chip ${c.status === 'draft' ? 'warn' : ''}">${esc(c.id)}</span><b>${esc(c.disc || 'Query')}</b></div><span class="d-note">${esc(String(c.q).slice(0, 120))}…</span></li>`).join('')}</ul></section>`;
}
function bmEligibility(o) {
  const e = o.elig || []; if (!e.length) return '';
  const bad = e.filter(x => x.res !== 'pass');
  const emd = (o.bgs || []).find(b => /emd|bid security/i.test(b.type));
  return `<section class="panel d-card ${bad.length ? 'is-warn' : ''}"><div class="d-stat-h"><span class="d-ic ${bad.length ? 'bad' : ''}">${IC.lock}</span><h4>Eligibility</h4><span class="chip ${bad.length ? 'warn' : 'ok'}">${e.length - bad.length}/${e.length} pass</span><button class="linkbtn" data-a="taskgo" data-t="elig" data-id="${esc(o.meta.id)}">Criteria →</button></div>
   ${bad.length ? `<ul class="bm-list">${bad.map(x => `<li><div class="bm-lh"><span class="chip ${x.res === 'fail' ? 'bad' : 'warn'}">${esc(x.res)}</span><b>${esc(x.c)}</b></div><span class="d-note">Needs ${esc(x.need)} · ours: ${esc(x.ours)}</span></li>`).join('')}</ul>`
    : '<p class="d-note">Every criterion passes on the record as it stands.</p>'}
   ${emd ? `<p class="d-note">${esc(emd.type)}: ${cr(emd.val, 1)} with ${esc(emd.bank)}, ${esc(emd.st.toLowerCase())}, valid to ${fmtDate(emd.exp)}.</p>` : ''}</section>`;
}
function bmEnvelopeA(o) {
  if (typeof envelopeAScan !== 'function' || O() !== o) return '';
  const s = envelopeAScan();
  if (!s.sections) return '';
  const n = s.findings.length;
  return `<section class="panel d-card ${n ? 'is-warn' : ''}"><div class="d-stat-h"><span class="d-ic ${n ? 'bad' : ''}">${IC.eye}</span><h4>Envelope A</h4><span class="chip ${n ? 'warn' : 'ok'}">${n ? hmPlural(n, 'hit') : 'clean'}</span><button class="linkbtn" data-a="taskgo" data-t="pdraft" data-id="${esc(o.meta.id)}">Draft →</button></div>
   <p class="d-note">${s.paras} paragraphs across ${hmPlural(s.sections, 'drafted section')} scanned for anything priced. ${n ? 'A price in the technical envelope is a disqualification, not a correction.' : 'Nothing priced has leaked into the technical envelope.'}</p>
   ${n ? `<ul class="bm-list">${s.findings.slice(0, 3).map(f => `<li><div class="bm-lh"><span class="chip bad">${esc(f.kind)}</span><b>${esc(f.section)}</b></div><span class="d-note">¶${f.para}: “${esc(f.hit)}”</span></li>`).join('')}</ul>` : ''}</section>`;
}
function hmBidManager() {
  const o = bmOpp();
  if (!o) return '<section class="panel d-card"><p class="d-note">No tender is open. Start one and this dashboard fills itself from its records.</p></section>';
  return [bmOnTrack(o), bmWaiting(o), bmQuestions(o), bmChanged(o), bmEligibility(o), bmEnvelopeA(o)].filter(Boolean);
}
/* ---------------- the Bid Manager's chart view ----------------
   The same records as the cards, drawn: a window gauge, progress by
   discipline, the requirement and query splits, and risk exposure. */
function bmGauge(done, total, label) {
  const pc = total ? Math.max(0, Math.min(100, done / total * 100)) : 0;
  const r = 54, c = Math.PI * r; /* half circle */
  return `<div class="bc-gauge"><svg viewBox="0 0 128 72" aria-hidden="true">
    <path d="M10 64A54 54 0 0 1 118 64" class="bc-gt"/>
    <path d="M10 64A54 54 0 0 1 118 64" class="bc-gv" stroke-dasharray="${(c * pc / 100).toFixed(1)} ${c.toFixed(1)}"/></svg>
   <div class="bc-gtx"><b>${Math.round(pc)}%</b><small>${esc(label)}</small></div></div>`;
}
function bmDonut(rows, total, label) {
  let at = -90; const r = 46, c = 2 * Math.PI * r;
  const arcs = rows.filter(x => x[1]).map(x => {
    const frac = x[1] / (total || 1), dash = c * frac, el = `<circle cx="60" cy="60" r="${r}" class="bc-arc" stroke="var(${x[2]})" stroke-dasharray="${dash.toFixed(1)} ${(c - dash).toFixed(1)}" transform="rotate(${at} 60 60)"/>`;
    at += frac * 360; return el;
  }).join('');
  return `<div class="bc-donut"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${r}" class="bc-dt"/>${arcs}</svg>
   <div class="bc-dtx"><b>${total}</b><small>${esc(label)}</small></div></div>`;
}
const bmLegend = rows => `<ul class="d-leg">${rows.map(x => `<li><i style="background:var(${x[2]})"></i><span>${esc(x[0])}</span><b>${x[1]}</b></li>`).join('')}</ul>`;
function hmBmCharts() {
  const o = bmOpp();
  if (!o) return '<section class="panel d-card"><p class="d-note">No tender is open.</p></section>';
  const pr = o.prop || (O() === o && typeof ensureProp === 'function' ? ensureProp() : null);
  const nodes = pr ? allNodes(pr.tree) : [];
  const d = daysTo(o.meta.submission);
  const nit = (o.dates || []).find(x => /nit|published/i.test(x.k));
  const start = nit ? new Date(nit.d) : null, end = new Date(o.meta.submission);
  const span = start && !isNaN(start) ? Math.max(1, Math.round((end - start) / 864e5)) : null;
  const used = span ? Math.max(0, span - d) : null;
  /* progress by the discipline that owns each section */
  const byOwn = {};
  nodes.forEach(n => { const k = ROLES[n.own] ? ROLES[n.own].title : 'Unassigned'; (byOwn[k] = byOwn[k] || { t: 0, a: 0, d: 0 }).t++; if (n.st === 'approved') byOwn[k].a++; else if (n.st !== 'not_started') byOwn[k].d++; });
  const disc = Object.entries(byOwn).sort((a, b) => b[1].t - a[1].t).slice(0, 6);
  const reqRows = [['Reviewed', o.reqs.filter(r => r.st !== 'proposed').length, '--viz-4'], ['Proposed', o.reqs.filter(r => r.st === 'proposed').length, '--viz-5']];
  const clRows = [['Answered', o.clars.filter(c => c.status === 'answered').length, '--viz-4'], ['With the client', o.clars.filter(c => c.status === 'open').length, '--viz-2'], ['Drafted, unsent', o.clars.filter(c => c.status === 'draft').length, '--viz-5']];
  const byCat = {};
  o.risks.forEach(r => { const k = r.cat || 'Other'; byCat[k] = (byCat[k] || 0) + expo(r); });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const cmax = Math.max(...cats.map(c => c[1]), 1);
  const el = o.elig || [], ePass = el.filter(x => x.res === 'pass').length;
  const env = typeof envelopeAScan === 'function' && O() === o ? envelopeAScan() : null;
  const ind = [
    ['Sections approved', `${nodes.filter(n => n.st === 'approved').length}/${nodes.length}`, nodes.length && nodes.filter(n => n.st === 'approved').length === nodes.length ? 'ok' : 'warn', 'pown'],
    ['Requirements reviewed', `${o.reqs.filter(r => r.st !== 'proposed').length}/${o.reqs.length}`, o.reqs.every(r => r.st !== 'proposed') ? 'ok' : 'warn', 'reqs'],
    ['Queries open', String(o.clars.filter(c => c.status !== 'answered').length), o.clars.some(c => c.status !== 'answered') ? 'warn' : 'ok', 'clar'],
    ['Risks scoring 16+', String(o.risks.filter(r => r.l * r.i >= 16).length), o.risks.some(r => r.l * r.i >= 16) ? 'bad' : 'ok', 'risks'],
    ['Eligibility', `${ePass}/${el.length}`, ePass === el.length ? 'ok' : 'warn', 'elig'],
    ['Envelope A', env ? (env.findings.length ? `${env.findings.length} hits` : 'Clean') : '—', env && env.findings.length ? 'bad' : 'ok', 'pdraft']
  ];
  return `<div class="d-lin">
   <div class="bc-row">
    <section class="panel d-card bc-ind"><div class="d-stat-h"><h4>Bid health</h4></div>
     <ul class="bc-inds">${ind.map(x => `<li><button data-a="taskgo" data-t="${x[3]}" data-id="${esc(o.meta.id)}"><span class="bc-dot ${x[2]}"></span><span>${esc(x[0])}</span><b>${esc(x[1])}</b></button></li>`).join('')}</ul></section>
    <section class="panel d-card"><div class="d-stat-h"><h4>Bid window</h4><span class="sub">${esc(nit ? nit.k : 'from today')} → technical bid</span></div>
     ${span ? bmGauge(used, span, `${used} of ${span} days used`) : bmGauge(0, 1, 'no start date on record')}
     <div class="bc-wk"><span><b>${d}</b><small>days left</small></span><span><b>${fmtDate(o.meta.submission)}</b><small>due</small></span>${span ? `<span><b>${span}</b><small>day window</small></span>` : ''}</div></section>
    <section class="panel d-card"><div class="d-stat-h"><h4>Requirements</h4></div>
     ${bmDonut(reqRows, o.reqs.length, 'requirements')}${bmLegend(reqRows)}</section>
    <section class="panel d-card"><div class="d-stat-h"><h4>Queries</h4></div>
     ${bmDonut(clRows, o.clars.length, 'queries')}${bmLegend(clRows)}</section>
   </div>
   <div class="bc-two"><section class="panel d-card"><div class="d-stat-h"><h4>Section progress</h4><button class="linkbtn" data-a="taskgo" data-t="pown" data-id="${esc(o.meta.id)}">Sections →</button></div>
    <div class="bc-bars">${disc.map(([k, v]) => `<div class="bc-brow" title="${esc(k)}: ${v.a} approved, ${v.d} drafted or in review, ${v.t - v.a - v.d} not started"><span class="bc-bl">${esc(k)}</span>
     <span class="bc-bt"><i class="a" style="width:${v.a / v.t * 100}%"></i><i class="d" style="width:${v.d / v.t * 100}%"></i></span>
     <b>${Math.round(v.a / v.t * 100)}%</b><em>${v.a}/${v.t} approved</em></div>`).join('') || '<p class="d-note">No proposal sections yet.</p>'}</div>
    <ul class="d-leg bc-key"><li><i style="background:var(--viz-4)"></i><span>Approved</span></li><li><i style="background:var(--viz-5)"></i><span>Drafted or in review</span></li><li><i style="background:var(--bg-muted)"></i><span>Not started</span></li></ul></section>
   <section class="panel d-card"><div class="d-stat-h"><h4>Risk exposure</h4><span class="sub">₹ Cr</span><button class="linkbtn" data-a="taskgo" data-t="risks" data-id="${esc(o.meta.id)}">Register →</button></div>
    <div class="bc-cols">${cats.map((c, i) => `<div class="bc-col" title="${esc(c[0])}: ${cr(c[1], 1)}"><i style="height:${Math.max(5, c[1] / cmax * 100)}%;background:var(--viz-${i + 1})"></i><b>${cr(c[1], 1)}</b></div>`).join('') || '<p class="d-note">No risks on the register.</p>'}</div>
    <ul class="d-leg bc-key">${cats.map((c, i) => `<li><i style="background:var(--viz-${i + 1})"></i><span>${esc(c[0])}</span></li>`).join('')}</ul></section></div>
   ${hmSugg(4)}</div>`;
}
/* ---------------- every role's own desk ----------------
   The shell and the bands stay the same; the cards are the ones that role owns.
   Each reads live records, and a card whose record is empty is left out. */
const deskCard = (icon, title, right, body, cls) => `<section class="panel d-card ${cls || ''}"><div class="d-stat-h"><span class="d-ic">${icon}</span><h4>${title}</h4>${right || ''}</div>${body}</section>`;
const deskRows = rows => `<ul class="bm-wait">${rows.map(r => `<li><button data-a="taskgo" data-t="${r[3]}" data-id="${esc(r[4])}"><span class="d-sev ${r[2] || ''}"></span>
  <span class="bm-wtx"><b>${r[0]}</b><small>${r[1]}</small></span>${IC.next}</button></li>`).join('')}</ul>`;
function deskPrice(o) {
  if (!o.est.length || O() !== o) return '';
  const e = estTotals(), om = typeof omSchedule === 'function' ? omSchedule() : null;
  const g2 = gateSigned('G2');
  return deskCard(IC.spark, 'Price and margin', `<span class="chip ${g2 ? 'ok' : 'warn'}">${g2 ? 'G2 signed' : 'G2 unsigned'}</span><button class="linkbtn" data-a="taskgo" data-t="est" data-id="${esc(o.meta.id)}">Estimate →</button>`,
    `<div class="bm-qs"><span><b>${cr(e.price, 1)}</b><small>bid project cost</small></span><span><b>${e.m}%</b><small>margin in the price</small></span><span><b>${cr(e.cont + e.mkt, 1)}</b><small>risk and market carried</small></span>${om ? `<span><b>${cr(om.npv, 1)}</b><small>O&M NPV</small></span>` : ''}</div>
     <p class="d-note">Direct cost ${cr(e.direct, 1)} across ${hmPlural(o.est.length, 'work package')}, plus ${cr(e.add, 1)} of adders, contingency and market movement.</p>`);
}
function deskBonds(o) {
  const b = o.bgs || []; if (!b.length) return '';
  return deskCard(IC.lock, 'Bonds and securities', `<span class="chip">${b.length}</span><button class="linkbtn" data-a="taskgo" data-t="cadmin" data-id="${esc(o.meta.id)}">Register →</button>`,
    deskRows(b.map(x => [esc(x.type), `${cr(x.val, 1)} · ${esc(x.bank)} · ${esc(x.st)} · valid to ${fmtDate(x.exp)}`, daysTo(x.exp) < 60 ? 'high' : '', 'cadmin', o.meta.id])));
}
function deskPackages(o) {
  const p = o.pkgs || []; if (!p.length) return '';
  const open = p.filter(x => !/award/i.test(x.st || ''));
  return deskCard(IC.pipe, 'Procurement packages', `<span class="chip ${open.length ? 'warn' : 'ok'}">${open.length} open</span><button class="linkbtn" data-a="taskgo" data-t="proc" data-id="${esc(o.meta.id)}">Packages →</button>`,
    deskRows(p.slice(0, 5).map(x => [esc(x.pkg), `${x.lines} lines · ${x.sup} suppliers · ${esc(x.st)}${x.due ? ' · due ' + esc(x.due) : ''}`, /quotes in|levelling/i.test(x.st || '') ? 'med' : '', 'proc', o.meta.id])));
}
function deskLongLead(o) {
  const l = o.longlead || []; if (!l.length) return '';
  const late = l.filter(x => llFloat(x) < 0);
  return deskCard(IC.check, 'Long-lead items', `<span class="chip ${late.length ? 'warn' : 'ok'}">${late.length ? `${late.length} late` : 'all on time'}</span><button class="linkbtn" data-a="taskgo" data-t="proc" data-id="${esc(o.meta.id)}">Plan →</button>`,
    deskRows(l.slice().sort((a, b) => llFloat(a) - llFloat(b)).slice(0, 5).map(x => { const f = llFloat(x); return [esc(x.item), `${x.lead} weeks to deliver · needed month ${x.need} · ${f < 0 ? `${-f} months late` : `${f} months float`}`, f < 0 ? 'high' : f < 2 ? 'med' : '', 'proc', o.meta.id]; })));
}
function deskMarket(o) {
  const m = o.market || []; if (!m.length) return '';
  return deskCard(IC.chart, 'Market movement', `<button class="linkbtn" data-a="taskgo" data-t="proc" data-id="${esc(o.meta.id)}">Market →</button>`,
    deskRows(m.slice(0, 4).map(x => [esc(x.f), `${esc(x.basis)} · ${esc(x.move)}${x.wp ? ' · ' + esc(x.wp) : ''}${x.adj ? ` · ${num(x.adj) > 0 ? '+' : ''}${x.adj}% on the estimate` : ''}`, num(x.adj) > 0 ? 'med' : '', 'proc', o.meta.id])));
}
function deskMine(o, role) {
  const pr = o.prop || (O() === o && typeof ensureProp === 'function' ? ensureProp() : null);
  const secs = pr ? allNodes(pr.tree).filter(n => n.own === role || n.rev === role) : [];
  const reqs = o.reqs.filter(r => r.owner === role);
  const risks = o.risks.filter(r => r.owner === role);
  const rows = [];
  secs.filter(n => n.st !== 'approved').slice(0, 3).forEach(n => rows.push([esc(n.title), n.own === role ? `Yours to ${n.st === 'draft' ? 'finish' : 'start'}` : 'Yours to review', n.st === 'not_started' ? 'med' : '', 'pown', o.meta.id]));
  reqs.filter(r => r.st === 'proposed').slice(0, 2).forEach(r => rows.push([`Requirement ${esc(r.id)}`, esc(String(r.text).slice(0, 80)), 'med', 'reqs', o.meta.id]));
  risks.filter(r => r.l * r.i >= 16).slice(0, 2).forEach(r => rows.push([`Risk ${esc(r.id)}`, `${esc(r.risk)} · ${cr(expo(r), 1)} exposure`, 'high', 'risks', o.meta.id]));
  if (!rows.length) return deskCard(IC.user, 'Yours on this tender', '', '<p class="d-note">Nothing on this tender is assigned to you right now.</p>');
  return deskCard(IC.user, 'Yours on this tender', `<span class="chip">${rows.length}</span>`, deskRows(rows));
}
function deskDiscipline(o, role) {
  const flags = (o.rules || []).filter(r => r.state === 'open');
  const basis = (o.basis || []).length;
  if (!flags.length && !basis) return '';
  return deskCard(IC.ruler, 'Basis and conflicts', `<span class="chip ${flags.length ? 'warn' : 'ok'}">${flags.length} open</span><button class="linkbtn" data-a="taskgo" data-t="basis" data-id="${esc(o.meta.id)}">Rules →</button>`,
    flags.length ? deskRows(flags.slice(0, 4).map(r => [esc(r.rule || r.k || 'Conflict'), esc(String(r.note || r.why || '').slice(0, 90)), 'med', 'basis', o.meta.id]))
      : `<p class="d-note">${hmPlural(basis, 'design-basis line')} recorded and none in conflict.</p>`);
}
function deskContract(o) {
  const cl = (o.contract && o.contract.clauses) || [], dv = o.devs || [], ob = o.obl || [];
  if (!cl.length && !dv.length && !ob.length) return '';
  const rows = [];
  cl.slice(0, 3).forEach(c => rows.push([`${esc(c.ref)} · ${esc(c.title)}`, 'Our redline is with the client', 'med', 'contract', o.meta.id]));
  dv.slice(0, 2).forEach(d => rows.push([`Deviation ${esc(d.id)}`, `${esc(d.clause)} · ${esc(d.status)}`, d.status === 'proposed' ? 'med' : '', 'devs', o.meta.id]));
  ob.filter(x => !x.done).slice(0, 2).forEach(x => rows.push([esc(x.ob), `${esc(x.party)} · due ${esc(x.due)}`, 'high', 'cadmin', o.meta.id]));
  return deskCard(IC.doc, 'Contract and obligations', `<span class="chip">${rows.length}</span>`, deskRows(rows));
}
function deskClaims(o) {
  const c = o.claims || []; if (!c.length) return '';
  return deskCard(IC.alert, 'Claims and notices', `<span class="chip warn">${c.length}</span><button class="linkbtn" data-a="taskgo" data-t="cadmin" data-id="${esc(o.meta.id)}">Register →</button>`,
    deskRows(c.slice(0, 4).map(x => [esc(x.id), `${esc(String(x.event).slice(0, 80))} · ${esc(x.st || 'open')}`, 'high', 'cadmin', o.meta.id])));
}
function deskAdmin() {
  const A = typeof ensureAdmin === 'function' ? ensureAdmin() : null; if (!A) return '';
  const users = (A.users || []).length, ints = Object.values(A.integrations || {}).filter(x => x && x.on === false).length;
  return deskCard(IC.gear, 'Tenant health', `<button class="linkbtn" data-a="go" data-v="admin">Admin console →</button>`,
    `<div class="bm-qs"><span><b>${users || '—'}</b><small>people with access</small></span><span><b>${A.credits ? fmtN(A.credits.balance, 0) : '—'}</b><small>AI credits left</small></span><span><b>${ints}</b><small>integrations off</small></span></div>
     <p class="d-note">Seats, security posture and integrations are managed in the admin console; this is only the read.</p>`);
}
/* which cards each role's desk is made of */
function hmDesk() {
  const o = bmOpp(), role = S.role;
  if (!o) return ['<section class="panel d-card"><p class="d-note">No tender is open. Start one and this page fills itself from its records.</p></section>'];
  const bm = hmBidManager();
  const map = {
    bid_manager: () => bm,
    commercial: () => [deskPrice(o), deskBonds(o), deskContract(o), bm[4], bm[5]],
    estimator: () => [deskPrice(o), deskMarket(o), deskMine(o, role), deskLongLead(o)],
    procurement: () => [deskPackages(o), deskLongLead(o), deskMarket(o), deskMine(o, role)],
    contracts: () => [deskContract(o), deskClaims(o), deskBonds(o), bm[4]],
    admin: () => [deskAdmin(), bm[0], bm[1]]
  };
  const disc = ['process', 'ei', 'pipeline'];
  if (disc.includes(role)) return [bm[0], deskMine(o, role), deskDiscipline(o, role), bm[3]].filter(Boolean);
  return (map[role] || (() => [bm[0], deskMine(o, role), bm[1], bm[2]]))().filter(Boolean);
}
/* ---------------- the dashboard shell ----------------
   One layout, four readings of it. Which one you get follows “Acting as”:
   the bid desk, the book, delivery, or your own queue. */
/* Which reading opens for whom. Every role has a desk; these say what else fits. */
const DASH_ROLE = {
  bid_manager: 'bid', commercial: 'bid', estimator: 'bid', procurement: 'bid', contracts: 'bid',
  process: 'bid', ei: 'bid', pipeline: 'bid',
  bd_head: 'book', exec: 'book', admin: 'bid',
  pd: 'delivery', site: 'delivery', qhse: 'delivery', om: 'delivery'
};
const dashKind = () => DASH_ROLE[S.role] || 'work';
/* The names of the readings. Nobody sees all of them. */
const DASH_OPTS = [['bid', 'My desk'], ['charts', 'Bid charts'], ['book', 'The book'], ['delivery', 'Delivery'], ['work', 'My queue']];
const DASH_NAME = k => (DASH_OPTS.find(o => o[0] === k) || [, k])[1];
/* A role is offered a second reading only where it has one to offer. The bid
   manager runs the tender and also answers for its numbers, so the charts are a
   second desk; everyone else has one dashboard and no toggle to get it wrong. */
const DASH_FOR = { bid_manager: ['bid', 'charts'] };
const dashOpts = () => DASH_FOR[S.role] || [dashKind()];
/* The choice is remembered per role, so switching “Acting as” shows that
   person's own dashboard rather than the one the last role was looking at. */
const dashOpt = () => { const a = dashOpts(), v = (S.ui.dashOpt || {})[S.role]; return a.includes(v) ? v : a[0]; };
/* The toggle lives in the top bar, beside the breadcrumbs — and only where
   there is something to toggle between. */
function dashSeg() {
  const a = dashOpts(), opt = dashOpt();
  if (a.length < 2) return '';
  return `<div class="seg d-seg" role="tablist" aria-label="Dashboard">${a.map(k => `<button class="${opt === k ? 'on' : ''}" data-a="dashopt" data-v="${k}"${k === a[0] ? ' title="Opens by default for your role"' : ''}>${DASH_NAME(k)}</button>`).join('')}</div>`;
}
function hmTenderBand() {
  const live = liveOpps(), rest = PIPE.filter(p => !p.main && on('types', p.type)).slice(0, 3);
  const card = (id, name, client, value, due, stage) => `<button class="c-card" data-a="opp" data-id="${esc(id)}">
    <span class="c-top"><span class="c-mark">${IC.pipe}</span><span class="c-id mono">${esc(id)}</span></span>
    <b>${esc(name)}</b><span class="c-cl">${esc(client)}</span>
    <span class="c-foot"><span><small>Value</small><b>${cr(value, 0)}</b></span><span><small>Due</small><b>${esc(due)}</b></span><span><small>Stage</small><b>${esc(stage)}</b></span></span></button>`;
  return `<section class="c-band">
   <div class="c-bandtx"><span class="eyebrow">Live tenders</span><h2>${hmPlural(live.length, 'tender')} open · ${cr(live.reduce((a, o) => a + num(o.meta.value), 0), 0)}</h2>
    <p>Every figure on this page is read from the records behind these tenders. Open one to work on it.</p>
    <button class="btn c-cta" data-a="newopp">${IC.plus}New tender / RFP</button></div>
   <div class="c-cards">${live.map(o => card(o.meta.id, o.meta.name, o.meta.client, num(o.meta.value), fmtDate(o.meta.submission), `${o.pos} · ${stageName(o.pos)}`)).join('')}
    ${rest.map(p => card(p.id, p.name, p.client, p.value, p.dueISO ? fmtDate(p.dueISO) : p.due, stageName(p.stage))).join('')}</div>
  </section>`;
}
function hmProjectBand() {
  const P = (typeof PROJECTS !== 'undefined' ? PROJECTS : []).map(p => ({ id: p[0], name: p[1], client: p[2], value: p[3], prog: p[4], health: p[5], note: p[6] }));
  const val = P.reduce((a, p) => a + p.value, 0);
  const hl = { ok: 'On track', warn: 'Watch', bad: 'At risk' };
  return `<section class="c-band">
   <div class="c-bandtx"><span class="eyebrow">In delivery</span><h2>${hmPlural(P.length, 'project')} · ${cr(val, 0)} under execution</h2>
    <p>Projects already won and handed over. The cards below read their progress and what each one still owes.</p>
    <button class="btn c-cta" data-a="go" data-v="pipeline">${IC.pipe}Pipeline</button></div>
   <div class="c-cards">${P.map(p => `<button class="c-card" data-a="go" data-v="pipeline">
    <span class="c-top"><span class="c-mark">${IC.check}</span><span class="c-id mono">${esc(p.id)}</span></span>
    <b>${esc(p.name)}</b><span class="c-cl">${esc(p.client)}</span>
    <span class="c-foot"><span><small>Value</small><b>${cr(p.value, 0)}</b></span><span><small>Progress</small><b>${p.prog}%</b></span><span><small>Health</small><b>${hl[p.health]}</b></span></span></button>`).join('')
    || '<span class="d-note" style="color:rgba(255,255,255,.66)">No project has reached delivery yet.</span>'}</div>
  </section>`;
}
function hmDash() {
  const kind = dashOpt(), bm = kind === 'delivery' ? [] : hmBidManager();
  if (kind === 'delivery') return `<div class="dash-c">${hmProjectBand()}${hmPmo()}</div>`;
  if (kind === 'charts') return `<div class="dash-c">${hmTenderBand()}${hmKpiBand()}${hmBmCharts()}</div>`;
  if (kind === 'book') return `<div class="dash-c">${hmTenderBand()}${hmKpiBand()}
   <div class="d-lin">${hmBookCard()}${hmWinChance()}${hmSugg(4)}${hmRunway()}${hmLessons()}</div></div>`;
  if (kind === 'work') return `<div class="dash-c">${hmTenderBand()}
   <div class="d-lin">${hmQueue()}${bm[0] || ''}${hmSugg(3)}${hmRunway()}${hmAgents()}</div></div>`;
  const desk = hmDesk(), rest = desk.slice(1).concat(hmSugg(4)).filter(Boolean);
  const pairs = []; for (let i = 0; i < rest.length; i += 2) pairs.push(`<div class="bc-two">${rest[i]}${rest[i + 1] || ''}</div>`);
  return `<div class="dash-c">${hmTenderBand()}${hmKpiBand()}
   <div class="d-lin">${desk[0] || ''}${pairs.join('')}</div></div>`;
}
/* What can be done about a finding, from here. Each row is a record behind the
   finding; where the app has a way to change that record, the button runs the
   app's own action against it — same permission check, same audit line — and the
   modal stays open on the result. Where it has none, the row only reads. */
function dashActs(f) {
  const o = f.o;
  if (!o) return '';
  const opp = esc(o.meta.id);
  const btn = (k, id, label, extra) => `<button class="btn sm pri" data-a="dashdo" data-k="${k}" data-opp="${opp}" data-id="${esc(id)}"${extra || ''}>${esc(label)}</button>`;
  const row = (a, b, c) => `<li><span class="da-tx"><b>${a}</b><small>${b}</small></span>${c || ''}</li>`;
  const cut = (t, n) => esc(t.length > n ? t.slice(0, n).trimEnd() + '…' : t);
  let rows = [], head = '', foot = '';
  if (f.tab === 'clar') {
    head = 'The open queries';
    rows = o.clars.filter(c => c.status !== 'answered').map(c => row(`${esc(c.id)} · ${cut(c.q || '', 90)}`,
      c.status === 'draft' ? 'Drafted, never sent' : 'Sent · waiting on the client',
      c.status === 'draft' ? btn('clarsend', c.id, 'Send via portal') : ''));
  } else if (f.tab === 'pown') {
    head = 'The sections still open';
    rows = (o.prop ? o.prop.tree : []).filter(x => x.st !== 'approved').map(x => row(esc(x.title),
      `${x.st.replace('_', ' ')} · ${ROLES[x.own].name} drafts, ${ROLES[x.rev].name} reviews`,
      x.st === 'in_review' ? btn('pstat', x.id, 'Approve', ' data-v="approved"')
        : btn('pstat', x.id, 'Send for review', ' data-v="in_review"')));
  } else if (f.tab === 'risks') {
    head = 'The risks outside the estimate';
    rows = o.risks.filter(r => r.l * r.i >= 16 && r.treat !== 'Price').map(r => row(`${esc(r.id)} · ${cut(r.risk, 80)}`,
      `${cr(typeof expo === 'function' ? expo(r) : 0)} exposure · treated as ${esc(r.treat)} · ${ROLES[r.owner].name}`,
      btn('riskprice', r.id, 'Carry it in the price')));
    foot = 'Carrying a risk in the price moves its exposure into the estimate as contingency.';
  } else if (f.tab === 'proc') {
    head = 'The items that arrive late';
    rows = o.longlead.filter(l => llFloat(l) < 0).map(l => {
      const soonest = Math.max(1, num(l.need) - Math.ceil(num(l.lead) / 4.33));
      return row(esc(l.item),
        `${l.lead} weeks to make · needed month ${l.need} · ordered month ${l.order} · ${Math.round(-llFloat(l) * 4.33)} weeks short`,
        num(l.order) > soonest ? btn('llpull', l.id, `Order month ${soonest}`)
          : '<span class="da-no">Already ordered at award</span>');
    });
    foot = 'Award is the earliest the plan allows an order. An item still short after that has to be offered as owner-furnished or re-scoped, which is done on the procurement screen.';
  } else if (GATES[f.t.split(' ')[0]]) {
    const g = f.t.split(' ')[0], G = GATES[g];
    head = `${g} · ${G.name}`;
    rows = G.roles.map(r => row(ROLES[r].name, `${ROLES[r].title} · ${o.signed[g + r] ? 'signed' : 'never signed'}`, ''));
    foot = `The tender is at stage ${o.pos}; ${g} belongs to stage ${G.stage}, so it can no longer be signed. It stays on the record as bypassed.`;
  }
  if (!rows.length) return '';
  return `<div class="da"><span class="eyebrow">${esc(head)}</span><ul class="da-l">${rows.join('')}</ul>${foot ? `<p class="sub">${esc(foot)}</p>` : ''}</div>`;
}
/* Every AI action on the dashboard opens here: what was found, why it matters,
   and what can be done about it without leaving the modal. */
function dashModal() {
  const m = S.modal;
  if (m.find != null) {
    const f = hmFindings()[m.find]; if (!f) return '';
    const o = f.o, d = o ? daysTo(o.meta.submission) : null;
    const rows = [['Tender', o ? o.meta.name : '—'], ['Stage', o ? `${o.pos} · ${stageName(o.pos)}` : '—'],
      ['Technical bid due', o ? `${fmtDate(o.meta.submission)}${d != null ? ` · ${d} days` : ''}` : '—'],
      ['Value at stake', o ? cr(num(o.meta.value), 0) : '—'], ['Severity', f.sev === 'high' ? 'Cannot wait' : 'Should be seen this week']];
    const acts = dashActs(f);
    return `<div class="scrim" data-a="closemodal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="dft">
      <div class="mh"><div><span class="eyebrow">Suggested next step · read from the records</span><h2 id="dft">${esc(f.t)}</h2></div>
       <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
      <div class="mb stack">
       <div class="note ${f.sev === 'high' ? 'warn' : ''}"><div>${f.w}</div></div>
       <dl class="kv">${rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>
       ${acts || '<p class="sub">Nothing here can be changed from this screen — the record holds the change.</p>'}</div>
      <div class="mf"><button class="btn" data-a="closemodal">Close</button>
       <button class="btn" data-a="dashgo" data-t="${f.tab}" data-id="${f.id}"${f.sub ? ` data-sub="${f.sub}"` : ''}>Open the record</button></div></div></div>`;
  }
  if (m.read) {
    const r = HM_READS[m.read], s = hmS();
    if (!r) return '';
    return `<div class="scrim" data-a="closemodal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="drt">
      <div class="mh"><div><span class="eyebrow">Asked of the records</span><h2 id="drt">What this means</h2></div>
       <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
      <div class="mb stack"><div class="note"><div>${r.line}</div></div>
       ${s.busy ? `<div class="hm-steps">${HM_THINK.map(([, l], i) => { const k = i < s.step ? 'done' : i === s.step ? 'now' : ''; return `<span class="${k}">${aiMark(k)}${esc(l)}</span>`; }).join('')}</div>`
        : `<div class="hm-ans">${r.deeper()}</div>`}</div>
      <div class="mf"><button class="btn" data-a="closemodal">Close</button>
       <button class="btn pri" data-a="dashgo" data-v="analytics">Analytics & audit</button></div></div></div>`;
  }
  if (m.win != null) {
    const H = HIST[12], dec = H.won + H.lostPrice + H.dq, wr = Math.round(H.won / dec * 100), t = m.win;
    return `<div class="scrim" data-a="closemodal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="dwt">
      <div class="mh"><div><span class="eyebrow">Chance of winning · 12-month record</span><h2 id="dwt">${esc(t.head)}</h2></div>
       <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
      <div class="mb stack"><div class="note"><div>${esc(t.tip)}</div></div>
       <dl class="kv"><dt>House win rate</dt><dd>${wr}% · ${H.won} of ${dec} decided</dd>
        <dt>Lost on price</dt><dd>${H.lostPrice} bids, by ${H.gap}% on average</dd>
        <dt>Disqualified</dt><dd>${H.dq} bids</dd></dl>
       <p class="sub">These are outcomes recorded on past bids, not a forecast. They say where the odds have been, not what any one bid will do.</p></div>
      <div class="mf"><button class="btn" data-a="closemodal">Close</button>
       <button class="btn" data-a="dashgo" data-v="analytics">Analytics & audit</button>
       <button class="btn pri" data-a="dashgo" data-t="${esc(t.tab)}" data-id="${esc(t.id)}">Open the screen</button></div></div></div>`;
  }
  return '';
}
/* Chance of winning, read for every opportunity in the book: the 12-month
   record by type and by size, each bid's own odds off that record, and what
   the record says would move them. */
function hmChance(p, H, wr) {
  const rate = r => r[1] ? Math.round(r[2] / r[1] * 100) : 0;
  const tRow = H.byType.find(r => r[0] === p.type);
  const bRow = H.byBand[p.value < 250 ? 0 : p.value < 750 ? 1 : p.value < 1500 ? 2 : 3];
  const base = tRow ? rate(tRow) : wr, band = bRow ? rate(bRow) : wr;
  const fit = p.fit == null ? null : p.fit;
  return { pct: Math.max(2, Math.min(95, Math.round(base * (band || 1) / Math.max(1, wr) * (fit != null ? fit / 70 : 1)))), base, band, tRow, bRow, fit };
}
function hmWinChance() {
  const H = HIST[12], dec = H.won + H.lostPrice + H.dq, wr = Math.round(H.won / dec * 100);
  const rate = r => r[1] ? Math.round(r[2] / r[1] * 100) : 0;
  const live = liveOpps().map(o => ({ id: o.meta.id, name: o.meta.name, type: typeName(o.meta.types[0]), value: num(o.meta.value), fit: o.meta.fit, live: true }));
  const rest = PIPE.filter(p => !p.main && on('types', p.type)).map(p => ({ id: p.id, name: p.name, type: typeName(p.type), value: p.value, fit: p.fit, live: false }));
  const all = [...live, ...rest].map(p => Object.assign(p, hmChance(p, H, wr))).sort((a, b) => b.pct - a.pct);
  const weighted = all.reduce((a, p) => a + p.value * p.pct / 100, 0);
  const types = H.byType.slice().map(r => [r[0], rate(r), r[1], r[2]]).sort((a, b) => b[1] - a[1]);
  const worst = all[all.length - 1], lossTop = H.loss.slice().sort((a, b) => b[1] - a[1])[0];
  const tips = [];
  const weakT = types[types.length - 1];
  if (weakT && weakT[1] < wr) tips.push([`${weakT[0]} wins ${weakT[1]}% — ${weakT[3]} of ${weakT[2]} bids, against the ${wr}% house rate.`, 'Bring a licensor or JV partner in before bidding that type alone.', 'g1', (all.find(p => p.type === weakT[0]) || all[0]).id]);
  const lowBand = H.byBand.map(r => [r[0], rate(r), r[1], r[2]]).sort((a, b) => a[1] - b[1])[0];
  if (lowBand) tips.push([`The ${lowBand[0]} band wins ${lowBand[1]}% — ${lowBand[3]} of ${lowBand[2]}.`, `${lossTop[0]} decided ${lossTop[1]} of the recorded losses: test the value-engineered scenario there.`, 'est', all[0].id]);
  const lowFit = all.filter(p => p.fit != null && p.fit < 70);
  if (lowFit.length) tips.push([`${hmPlural(lowFit.length, 'opportunity', 'opportunities')} score under the 70 fit the won bids averaged.`, `Lowest is ${lowFit[lowFit.length - 1].name}: close the eligibility and scope gaps behind the score.`, 'elig', lowFit[lowFit.length - 1].id]);
  return `<section class="panel d-card"><div class="d-stat-h"><span class="d-ic">${IC.chart}</span><h4>Chance of winning</h4><span class="chip">${all.length} opportunities</span><span class="sub">on the 12-month record</span><button class="linkbtn" data-a="go" data-v="analytics">Analytics →</button></div>
   <div class="d-wc"><div class="d-wcring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="d-wct"/><circle cx="60" cy="60" r="52" class="d-wcv" stroke-dasharray="${(2 * Math.PI * 52 * wr / 100).toFixed(1)} ${(2 * Math.PI * 52).toFixed(1)}"/></svg><b>${wr}%</b></div>
    <div class="stack" style="gap:4px;min-width:0"><b class="d-wcn">${cr(Math.round(weighted), 0)} expected across the book</b><span class="d-note">Each bid is read off its type, its value band and its fit score. The house rate is ${wr}% — ${H.won} of ${dec} decided.</span></div></div>
   <div class="d-wcbars">${all.map(p => `<div class="d-wcrow ${p.live ? 'is-live' : ''}"><span title="${esc(p.name)} · ${esc(p.type)}">${esc(p.name)}</span><div class="d-wcb"><i style="width:${Math.max(2, p.pct)}%" class="${p.pct >= wr ? 'ok' : ''}"></i></div><b>${p.pct}%</b><em>${cr(p.value, 0)}</em></div>`).join('')}</div>
   <p class="d-note">Strongest ${esc(all[0].name.split(' ').slice(0, 3).join(' '))} at ${all[0].pct}%, weakest ${esc(worst.name.split(' ').slice(0, 3).join(' '))} at ${worst.pct}%.</p>
   <div class="d-wcai"><div class="d-stat-h"><span class="d-ic ai">${IC.spark}</span><b>What would move them</b></div>
    <ul class="d-sg">${tips.slice(0, 3).map(x => `<li><span class="d-sev med"></span><span><b>${esc(x[0])}</b> ${esc(x[1])}</span><button class="btn sm" data-a="dashwin" data-h="${esc(x[0])}" data-tip="${esc(x[1])}" data-t="${esc(x[2])}" data-id="${esc(x[3])}">Details</button></li>`).join('')}</ul></div></section>`;
}

/* The second dashboard: projects already won, read the way a PMO reads them —
   health, progress against value, and what lands next. */
function hmPmo() {
  const P = (typeof PROJECTS !== 'undefined' ? PROJECTS : []).map(p => ({ id: p[0], name: p[1], client: p[2], value: p[3], prog: p[4], health: p[5], note: p[6] }));
  const val = P.reduce((a, p) => a + p.value, 0), done = P.reduce((a, p) => a + p.value * p.prog / 100, 0);
  const risk = P.filter(p => p.health !== 'ok');
  const avg = P.length ? Math.round(P.reduce((a, p) => a + p.prog, 0) / P.length) : 0;
  const hl = { ok: ['On track', 'ok'], warn: ['Watch', 'warn'], bad: ['At risk', 'bad'] };
  const kpi = (l, v, d, cls) => `<article class="d-kpi" style="grid-column:span 3"><div class="d-stat-h"><span class="d-ic ${cls || ''}">${IC.chart}</span><span class="eyebrow">${l}</span></div><b>${v}</b><span class="d-note">${d}</span></article>`;
  return `<div class="d-lin">
   <div class="d-kpis">${kpi('Value under execution', cr(val, 0), `${hmPlural(P.length, 'project')} handed over to delivery`)}
    ${kpi('Earned by progress', cr(Math.round(done), 0), `${avg}% average completion`)}
    ${kpi('Needs attention', risk.length, risk.length ? esc(risk.map(p => p.id).join(', ')) : 'Every project is on track', risk.length ? 'bad' : '')}
    ${kpi('Still to earn', cr(Math.round(val - done), 0), 'Value left in the current book of work')}</div>
   <section class="panel d-card"><div class="d-stat-h"><span class="d-ic">${IC.check}</span><h4>Projects in delivery</h4><span class="chip">${P.length}</span><span class="sub">${cr(val, 0)} under execution</span></div>
    <ul class="d-prj">${P.map(p => `<li><div class="d-prjh"><span class="d-sev ${p.health === 'ok' ? '' : p.health === 'warn' ? 'med' : 'high'}"></span><b>${esc(p.name)}</b><span class="chip ${hl[p.health][1]}">${hl[p.health][0]}</span><span class="mono sub">${esc(p.id)}</span></div>
      <div class="d-prjb"><div class="d-wcb"><i style="width:${p.prog}%" class="${p.prog >= 90 ? 'ok' : ''}"></i></div><b>${p.prog}%</b><span class="sub">${cr(p.value, 0)} · ${esc(p.client)}</span></div>
      <span class="d-note">${esc(p.note)}</span></li>`).join('') || '<li><span class="sub">No project has reached delivery yet.</span></li>'}</ul></section>
   ${hmRunway()}${hmQueue()}${hmAgents()}</div>`;
}
const DASH_TITLE = { bid: 'My desk', charts: 'My desk · charts', book: 'The book', delivery: 'Delivery', work: 'My queue' };
/* The band's left side says what is in front of you, not hello. */
function hmContext(kind) {
  const o = bmOpp(), q = typeof myTasks === 'function' ? myTasks().length : 0;
  if (kind === 'delivery') {
    const P = (typeof PROJECTS !== 'undefined' ? PROJECTS : []);
    const risk = P.filter(p => p[5] !== 'ok').length;
    return [`${hmPlural(P.length, 'project')} in delivery`, `${cr(P.reduce((a, p) => a + p[3], 0), 0)} under execution · ${risk ? `${hmPlural(risk, 'project')} needing attention` : 'all on track'}`];
  }
  if (kind === 'book') {
    const B = hmBook(), { wr } = hmFigs();
    return [`${cr(B.total, 0)} in the book`, `${hmPlural(B.rows.length, 'opportunity', 'opportunities')} · ${wr}% win rate over 12 months`];
  }
  if (!o) return ['No tender open', 'Start one and this page fills itself from its records'];
  const d = daysTo(o.meta.submission);
  if (kind === 'work') return [o.meta.name, `${hmPlural(q, 'item')} in your queue · technical bid due ${fmtDate(o.meta.submission)}, ${d} days`];
  return [o.meta.name, `${esc(o.meta.id)} · stage ${o.pos} of 13, ${esc(stageName(o.pos))} · due ${fmtDate(o.meta.submission)}, ${d} days left`];
}
function vOverview() {
  hmS();
  const now = new Date(), me = R();
  const opt = dashOpt(), ctx = hmContext(opt === 'charts' ? 'bid' : opt);
  return `<div class="dash">
   <section class="d-bar">
    <div class="d-hday"><div class="d-day"><b>${now.getDate()}</b><span>${esc(now.toLocaleDateString('en-GB', { weekday: 'short' }))},<br>${esc(now.toLocaleDateString('en-GB', { month: 'long' }))}</span></div>
     <div class="stack" style="gap:1px;min-width:0"><span class="eyebrow" style="color:var(--text-brand)">${esc(DASH_TITLE[opt])} · ${esc(me.title)}</span><h1>${ctx[0]}</h1><span class="sub d-ctx">${ctx[1]}</span></div></div>
    <div class="row" style="gap:8px"><button class="btn pri d-cta" data-a="go" data-v="tasks">My work${IC.next}</button>${opt === 'delivery' ? `<button class="btn d-cta" data-a="go" data-v="pipeline">${IC.pipe}Pipeline</button>` : `<button class="btn d-cta" data-a="newopp">${IC.plus}New tender</button>`}</div>
   </section>
   ${hmDash()}</div>`;
}

Object.assign(ACT, {
  /* The answer opens in a modal: the card it came from never grows. */
  hmask: d => {
    const s = hmS();
    S.modal = { read: d.id }; s.busy = true; s.step = 0;
    setTimeout(() => { if (S.modal && S.modal.read === d.id) { s.step = 1; render(); } }, 400);
    setTimeout(() => { if (S.modal && S.modal.read === d.id) { s.step = 2; render(); } }, 800);
    setTimeout(() => { if (S.modal && S.modal.read === d.id) { s.busy = false; render(); } }, 1200);
  }
});
