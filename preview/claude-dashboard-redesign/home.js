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
function hmRead(id, line, deeper) {
  const s = hmS(), open = s.ask === id;
  return `<div class="hm-ai ${open ? 'is-open' : ''}">
    <div class="hm-airow">${hmFx('orb', { state: open && s.busy ? HM_THINK[s.step][0] : 'breathing', size: 18 }, 'hm-orb', 'hm' + id)}
      <p>${line}</p>
      ${deeper ? `<button class="hm-askb" data-a="hmask" data-id="${id}" aria-expanded="${open}">${open ? 'Close' : 'Ask'}</button>` : ''}</div>
    ${open ? (s.busy
      ? `<div class="hm-steps">${HM_THINK.map(([, l], i) => { const k = i < s.step ? 'done' : i === s.step ? 'now' : ''; return `<span class="${k}">${aiMark(k)}${esc(l)}</span>`; }).join('')}</div>`
      : `<div class="hm-ans">${deeper()}</div>`) : ''}</div>`;
}

/* ---------------- shared reads ---------------- */
const HM_PH = [
  ['Qualifying', s => s <= 4, '--brand-solid'],
  ['Engineering & pricing', s => s >= 5 && s <= 7, '--ai-teal'],
  ['Proposal', s => s === 8, '--ai-sky'],
  ['Awaiting award', s => s >= 9, '--warning-fg']
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
/* The tiles across the top: the same readings as before, in a bento. */
function hmCards() {
  const B = hmBook(), H = HIST[12], dec = H.won + H.lostPrice + H.dq, wr = Math.round(H.won / dec * 100);
  const seg = HM_PH.map(([l, fn, c]) => [l, B.rows.filter(r => fn(r.s)).reduce((a, r) => a + r.v, 0), c, B.rows.filter(r => fn(r.s)).length]).filter(x => x[1] > 0);
  const big = seg.slice().sort((a, b) => b[1] - a[1])[0];
  const f = hmFindings(), hi = f.filter(x => x.sev === 'high').length;
  const q = typeof myTasks === 'function' ? myTasks().length : 0;
  const lossTop = H.loss.slice().sort((a, b) => b[1] - a[1])[0];
  const next = liveOpps().map(o => ({ d: daysTo(o.meta.submission), o })).filter(x => x.d >= 0).sort((a, b) => a.d - b.d)[0];
  const span = 60, left = next ? Math.max(0, Math.min(span, next.d)) : 0;
  const nmax = Math.max(...seg.map(x => x[3]), 1);
  return `<article class="panel d-card d-book" style="grid-column:span 5">
    <div class="d-stat-h"><span class="d-ic">${IC.chart}</span><span class="eyebrow">The book · ${hmPlural(B.rows.length, 'opportunity', 'opportunities')}</span></div>
    <b class="d-big">${cr(B.total, 0)}</b><p class="d-note">≈ ${cr(Math.round(B.total * wr / 100), 0)} at a ${wr}% win rate</p>
    <div class="hm-bar" role="img" aria-label="${esc(seg.map(x => `${x[0]} ${cr(x[1], 0)}`).join(', '))}">${seg.map(x => `<i style="flex:${x[1]};background:var(${x[2]})"></i>`).join('')}</div>
    <ul class="hm-key">${seg.map(x => `<li><i style="background:var(${x[2]})"></i><span>${esc(x[0])}</span><b>${cr(x[1], 0)}</b></li>`).join('')}</ul>
    <div class="row" style="gap:8px;margin-top:2px"><button class="btn pri" data-a="go" data-v="pipeline">Open the pipeline</button><button class="btn" data-a="newopp">${IC.plus}New tender</button></div>
    ${hmRead('book', `<b>${esc(big[0])}</b> holds ${Math.round(big[1] / B.total * 100)}% of the book. Only ${cr(seg.filter(x => x[0] === 'Proposal').reduce((a, x) => a + x[1], 0), 0)} has reached a priced proposal.`,
    () => {
      const far = seg.filter(x => x[0] === 'Qualifying')[0];
      return `<p>The weighted figure uses the 12-month win rate of ${wr}%, not a per-bid probability, so treat it as a ceiling rather than a forecast.</p>
        <ul>${seg.map(x => `<li><b>${esc(x[0])}</b> — ${cr(x[1], 0)} across ${hmPlural(x[3], 'bid')}</li>`).join('')}</ul>
        <p>${far ? `${cr(far[1], 0)} is still in qualifying, where nothing has been engineered or priced. That is the part of the book most likely to move.` : 'Everything in the book has passed qualifying.'}</p>`;
    })}
   </article>
   <div class="d-stack" style="grid-column:span 4">
    <article class="panel d-card d-stat"><div class="d-stat-h"><span class="d-ic">${IC.spark}</span><span class="eyebrow">Margin at G2</span><span class="chip ${H.margin >= 9 ? 'ok' : 'warn'}">target 9%</span></div>
     <b>${H.margin}%</b><div class="hm-rail"><i style="width:${Math.min(100, H.margin / 9 * 100)}%"></i><span class="hm-tick" style="left:100%" title="9% target"></span></div>
     ${hmRead('margin', `Running <b>${(9 - H.margin).toFixed(1)} points</b> under target. Estimates came in <b>${H.estVar}%</b> over on the last cycle.`,
      () => `<p>Where the cycle slipped against its own plan:</p>
        <ul>${H.cycle.map(c => `<li><b>${esc(c[0])}</b> — ${c[1]} days against ${c[2]} planned${c[1] > c[2] ? ` <span class="hm-over">+${(c[1] - c[2]).toFixed(1)}</span>` : ''}</li>`).join('')}</ul>
        <p>Every day held before G2 is a day of estimating cost carried against the same margin.</p>`)}
    </article>
    <article class="panel d-card d-stat ${hi ? 'is-warn' : ''}"><div class="d-stat-h"><span class="d-ic ${hi ? 'bad' : ''}">${IC.alert}</span><span class="eyebrow">Needs a decision</span><button class="linkbtn" data-a="go" data-v="tasks">Your queue →</button></div>
     <b class="${hi ? 'warn' : ''}">${f.length}</b><p class="d-note">${hi ? `${hmPlural(hi, 'item')} cannot wait` : 'Nothing urgent'} · ${hmPlural(q, 'item')} in your queue</p></article>
   </div>
   <article class="panel d-card d-dark" style="grid-column:span 3">${dRing(wr, wr + '%', 'Win rate', `${H.won} of ${dec} decided in 12 months`)}
    <p class="d-note"><b>${esc(lossTop[0])}</b> decided ${lossTop[1]} of the ${H.loss.reduce((a, l) => a + l[1], 0)} recorded loss reasons.</p></article>
   <article class="panel d-card" style="grid-column:span 3"><div class="d-stat-h"><span class="d-ic">${IC.check}</span><span class="chip ${next && next.d <= 21 ? 'warn' : ''}">to submission</span></div>
    <b class="d-big">${next ? next.d : '—'} Days</b><p class="d-note">${next ? esc(next.o.meta.name) : 'Nothing dated is open'}</p>
    <div class="d-dots">${Array.from({ length: span }, (_, i) => `<i class="${i < left ? 'on' : ''}"></i>`).join('')}</div>
    <p class="d-note">${next ? `${left} of the next ${span} days remain before the technical bid is due.` : ''}</p></article>
   <article class="panel d-card" style="grid-column:span 3"><div class="d-stat-h"><span class="d-ic">${IC.pipe}</span><span class="eyebrow">Where the book sits</span></div>
    <div class="d-bars">${seg.map(x => `<span title="${esc(x[0])}: ${hmPlural(x[3], 'bid')} · ${cr(x[1], 0)}"><i style="height:${Math.max(6, x[3] / nmax * 100)}%;background:var(${x[2]})"></i></span>`).join('')}</div>
    <ul class="d-leg">${seg.map(x => `<li><i style="background:var(${x[2]})"></i>${esc(x[0])} <b>${x[3]}</b></li>`).join('')}</ul></article>
   <article class="panel d-card d-ai" style="grid-column:span 6"><div class="d-stat-h"><span class="d-ic ai">${IC.bot}</span><h4>Suggested next steps</h4><span class="chip ai">${f.length}</span><span class="sub">read from the live records</span></div>
    ${f.length ? `<ul class="d-sg">${f.slice(0, 3).map(x => `<li><span class="d-sev ${x.sev === 'high' ? 'high' : 'med'}"></span><span><b>${esc(x.t)}</b> — ${x.w}</span>
      <button class="btn sm" data-a="taskgo" data-t="${x.tab}" data-id="${x.id}"${x.sub ? ` data-sub="${x.sub}"` : ''}>Open</button></li>`).join('')}</ul>` : '<p class="d-note">Nothing is outstanding across the live tenders.</p>'}</article>`;
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
function hmRunway() {
  const out = [];
  liveOpps().forEach(o => {
    const d = daysTo(o.meta.submission);
    if (d >= 0) out.push({ d, k: 'Technical bid due', t: o.meta.name, id: o.meta.id, tab: 'psub', hot: d <= 21, why: (() => { const open = o.prop ? o.prop.tree.filter(s => s.st !== 'approved').length : 0; return open ? `${hmPlural(open, 'section')} still unapproved` : 'All sections approved'; })() });
    Object.entries(GATES).forEach(([g, G]) => {
      if (G.stage >= o.pos && !gateSigned(g))
        out.push({ d: Math.max(0, G.stage <= 8 ? d - (8 - G.stage) * 4 - 3 : d + (G.stage - 8) * 5), k: G.name, t: o.meta.name, id: o.meta.id, tab: G.tab, sub: G.sub, gate: g, why: `${G.roles.map(r => ROLES[r].title).join(' + ')} must sign` });
    });
  });
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
        <p>The library is still reading <b>${hmPlural(idx, 'file')}</b>; until it finishes the assistant cannot answer from ${idx === 1 ? 'it' : 'them'}.</p>
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
function vOverview() {
  hmS();
  const now = new Date(), me = R();
  const hr = now.getHours(), hello = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const asks = ['What are the highest risks?', 'Which requirements are still proposed?', 'Which clarifications are still open?'];
  return `<div class="dash">
   <section class="d-hero">
    <div class="d-hero-l"><div class="d-day"><b>${now.getDate()}</b><span>${esc(now.toLocaleDateString('en-GB', { weekday: 'short' }))},<br>${esc(now.toLocaleDateString('en-GB', { month: 'long' }))}</span></div>
     <div class="stack" style="gap:2px"><span class="eyebrow" style="color:var(--text-brand)">${esc(S.cfg.company)}</span><h1>${hello}, ${esc(me.name.split(' ')[0])}.</h1></div>
     <button class="btn pri d-cta" data-a="go" data-v="tasks">Show my work${IC.next}</button></div>
    <div class="d-hero-r"><span class="eyebrow">Hey ${esc(me.name.split(' ')[0])} — need a hand?</span><h2>Ask bidPlan anything</h2>
     <div class="d-asks">${asks.map(q => `<button class="d-ask" data-a="dashask" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div></div>
   </section>
   <div class="dgrid">${hmCards()}
    <div class="d-stack" style="grid-column:span 7">${hmTenders()}${hmAgents()}</div>
    <div class="d-stack" style="grid-column:span 5">${hmRunway()}${hmQueue()}</div>
   </div></div>`;
}

Object.assign(ACT, {
  hmask: d => {
    const s = hmS();
    if (s.ask === d.id) { s.ask = null; s.busy = false; return; }
    s.ask = d.id; s.busy = true; s.step = 0;
    setTimeout(() => { if (s.ask === d.id) { s.step = 1; render(); } }, 420);
    setTimeout(() => { if (s.ask === d.id) { s.step = 2; render(); } }, 840);
    setTimeout(() => { if (s.ask === d.id) { s.busy = false; render(); } }, 1260);
  }
});
