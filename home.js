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
function hmKpis() {
  const { B, H, dec, wr, f, hi, q, next } = hmFigs(), span = 60, left = next ? Math.max(0, Math.min(span, next.d)) : 0;
  const r = 52, c = 2 * Math.PI * r;
  return `<div class="d-kpis">
   <article class="d-kpi d-dark" style="grid-column:span 4"><div class="d-kring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${r}" class="d-ring-t"/><circle cx="60" cy="60" r="${r}" class="d-ring-v" stroke-dasharray="${(c * wr / 100).toFixed(1)} ${c.toFixed(1)}"/></svg><b>${wr}%</b></div>
    <div class="d-kt"><small>Win rate · all opportunities</small><span>${H.won} of ${dec} bids decided in 12 months, across every type and size</span></div></article>
   <article class="d-kpi" style="grid-column:span 2"><div class="d-stat-h"><span class="d-ic">${IC.chart}</span><span class="eyebrow">The book</span></div>
    <b>${cr(B.total, 0)}</b><span class="d-note">${hmPlural(B.rows.length, 'opportunity', 'opportunities')} · ≈ ${cr(Math.round(B.total * wr / 100), 0)} weighted</span></article>
   <article class="d-kpi" style="grid-column:span 2"><div class="d-stat-h"><span class="d-ic">${IC.spark}</span><span class="eyebrow">Margin at G2</span></div>
    <b>${H.margin}%</b><div class="hm-rail"><i style="width:${Math.min(100, H.margin / 9 * 100)}%"></i><span class="hm-tick" style="left:100%" title="9% target"></span></div>
    <span class="d-note">${(9 - H.margin).toFixed(1)} points under the 9% target</span></article>
   <article class="d-kpi ${hi ? 'is-warn' : ''}" style="grid-column:span 2"><div class="d-stat-h"><span class="d-ic ${hi ? 'bad' : ''}">${IC.alert}</span><span class="eyebrow">Needs a decision</span><button class="linkbtn" data-a="go" data-v="tasks">Queue →</button></div>
    <b class="${hi ? 'warn' : ''}">${f.length}</b><span class="d-note">${hi ? `${hmPlural(hi, 'item')} cannot wait` : 'Nothing urgent'} · ${hmPlural(q, 'item')} in your queue</span></article>
   <article class="d-kpi" style="grid-column:span 2"><div class="d-stat-h"><span class="d-ic ${next && next.d <= 21 ? 'bad' : ''}">${IC.check}</span><span class="eyebrow">Next submission</span></div>
    <b>${next ? next.d + ' days' : '—'}</b><div class="d-rail"><i style="width:${Math.round((span - left) / span * 100)}%"></i></div>
    <span class="d-note">${next ? `${esc(next.o.meta.name)} · ${fmtDate(next.o.meta.submission)}` : 'Nothing dated is open'}</span></article>
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
  return `<section class="panel d-card d-ai"><div class="d-stat-h"><span class="d-ic ai">${IC.bot}</span><h4>Suggested next steps</h4><span class="chip ai">${f.length}</span><span class="sub">read from the live records</span></div>
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
/* Lessons from closed bids — the last thing on the left column, so the page ends level. */
function hmLessons() {
  const l = (typeof KB_LESSON !== 'undefined' ? KB_LESSON : []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3);
  if (!l.length) return '';
  return `<section class="panel d-card"><div class="d-stat-h"><span class="d-ic">${IC.book}</span><h4>Lessons worth carrying</h4><span class="sub">from closed bids</span><button class="linkbtn" data-a="go" data-v="kb">Knowledge library →</button></div>
   <ul class="d-les">${l.map(x => `<li><div class="d-lesh"><span class="chip ${/Loss|Disqual/.test(x.theme) ? 'bad' : 'pk'}">${esc(x.theme)}</span><span class="sub">${esc(x.proj)}</span></div><p>${esc(x.lesson)}</p><span class="d-note">${esc(x.by || 'Close-out')} · ${esc(fmtDate(x.date))}</span></li>`).join('')}</ul></section>`;
}
/* The assistant's entry point, placed inside whichever layout is showing. */
function hmAsk(cls) {
  const asks = ['What are the highest risks?', 'Which requirements are still proposed?', 'Which clarifications are still open?', 'What is the current price?'];
  return `<div class="d-hask ${cls || ''}">
   <form class="d-askf" id="dashaskform"><span class="eyebrow">Ask bidPlan</span><input type="text" id="dashq" placeholder="Anything about the live tenders — risks, requirements, dates or price…" aria-label="Ask bidPlan" autocomplete="off"><button type="submit" class="d-askgo" aria-label="Ask">${IC.up || '↑'}</button></form>
   <div class="d-asks">${asks.map(q => `<button class="d-ask" data-a="dashask" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div></div>`;
}
/* Option B — statistics first: one figure, its split, then the work that is dated. */
function hmOptionB() {
  const { B, H, dec, wr, seg, f, hi, q, next } = hmFigs();
  const rate = r => r[1] ? Math.round(r[2] / r[1] * 100) : 0;
  const types = H.byType.slice().map(r => [r[0], rate(r), r[1], r[2]]).sort((a, b) => b[1] - a[1]);
  const tmax = Math.max(...types.map(t => t[1]), 1);
  const tile = (l, v, d, c, delta) => `<article class="b-tile"><div class="b-th"><i style="background:var(${c})"></i><span>${esc(l)}</span></div><div class="b-tv"><b>${v}</b><span>${esc(d)}</span>${delta || ''}</div></article>`;
  const run = (typeof hmRunwayRows === 'function' ? hmRunwayRows() : []);
  const tab = S.ui.bTab || 'due';
  const rows = run.filter(x => tab === 'due' ? !x.gate : tab === 'gates' ? x.gate : true);
  return `<div class="d-lin">
   <section class="panel d-card"><div class="d-stat-h"><h4>Pipeline statistics</h4><span class="sub">the book as it stands today</span><button class="linkbtn" data-a="go" data-v="pipeline">Pipeline →</button></div>
    <div class="b-fig"><b>${cr(B.total, 0)}</b><span>across ${hmPlural(B.rows.length, 'opportunity', 'opportunities')}</span></div>
    <div class="b-bars">${seg.map(x => `<div class="b-seg" style="flex:${x[1]}"><span class="b-pc">${Math.round(x[1] / B.total * 100)}%</span><div class="b-hatch" style="--c:var(${x[2]})"></div></div>`).join('')}</div>
    <div class="b-tiles">${seg.map(x => tile(x[0], cr(x[1], 0), hmPlural(x[3], 'bid'), x[2], `<span class="chip ${x[1] / B.total > .25 ? 'ok' : ''}">${Math.round(x[1] / B.total * 100)}%</span>`)).join('')}</div></section>
   <section class="panel d-card d-ai"><div class="d-stat-h"><span class="d-ic ai">${IC.bot}</span><h4>Ask and act</h4><span class="chip ai">${f.length}</span></div>
    ${hmAsk()}
    <ul class="d-sg">${f.slice(0, 3).map((x, i) => `<li><span class="d-sev ${x.sev === 'high' ? 'high' : 'med'}"></span><span><b>${esc(x.t)}</b> — ${x.w}</span><button class="btn sm" data-a="dashfind" data-i="${i}">Open</button></li>`).join('') || '<li><span class="d-note">Nothing is outstanding.</span></li>'}</ul></section>
   <div class="d-kpis b-kpis">
    <article class="d-kpi" style="grid-column:span 6"><div class="d-stat-h"><span class="d-ic">${IC.spark}</span><span class="eyebrow">Margin at G2</span></div><b>${H.margin}%</b><span class="d-note">${(9 - H.margin).toFixed(1)} points under the 9% target</span></article>
    <article class="d-kpi ${hi ? 'is-warn' : ''}" style="grid-column:span 6"><div class="d-stat-h"><span class="d-ic ${hi ? 'bad' : ''}">${IC.alert}</span><span class="eyebrow">Needs a decision</span></div><b class="${hi ? 'warn' : ''}">${f.length}</b><span class="d-note">${hmPlural(q, 'item')} in your queue</span></article></div>
   <section class="panel d-card"><div class="d-stat-h"><h4>Win rate by project type</h4><span class="sub">12 months · ${H.won} of ${dec} decided</span></div>
    <div class="b-cols">${types.map(t => `<div class="b-col" title="${esc(t[0])}: ${t[3]} of ${t[2]}"><i style="height:${Math.max(6, t[1] / tmax * 100)}%" class="${t[1] >= wr ? 'ok' : ''}"></i><b>${t[1]}%</b><span>${esc(t[0].split(' ')[0])}</span></div>`).join('')}</div>
    <p class="d-note">The house rate is ${wr}%. A column under it is a type the record says to partner on, not to bid alone.</p></section>
   ${hmWinChance()}
   <section class="panel d-card"><div class="d-stat-h"><h4>Schedule</h4><div class="seg b-seg2"><button class="${tab === 'due' ? 'on' : ''}" data-a="btab" data-v="due">Submissions</button><button class="${tab === 'gates' ? 'on' : ''}" data-a="btab" data-v="gates">Gates</button><button class="${tab === 'all' ? 'on' : ''}" data-a="btab" data-v="all">All</button></div></div>
    <ul class="b-sched">${rows.slice(0, 6).map(x => `<li><button data-a="taskgo" data-t="${x.tab}" data-id="${x.id}"${x.sub ? ` data-sub="${x.sub}"` : ''}>
      <span class="b-day"><small>${esc(x.when.slice(0, 3))}</small><b>${esc(x.when.slice(4))}</b></span>
      <span class="b-stx"><b>${x.gate ? `<span class="gchip pend">${x.gate}</span> ` : ''}${esc(x.k)}</b><span>${esc(x.why)}</span></span>
      <span class="b-when">${x.d} d</span></button></li>`).join('') || '<li><span class="d-note">Nothing dated in this list.</span></li>'}</ul></section>
   ${hmQueue()}</div>`;
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
/* Option C — the live tenders on a dark band, everything else on white. */
function hmOptionC() {
  const { B, H, wr, seg, f, next } = hmFigs(), bm = hmBidManager();
  const live = liveOpps(), rest = PIPE.filter(p => !p.main && on('types', p.type)).slice(0, 3);
  const card = (id, name, client, value, due, stage) => `<button class="c-card" data-a="opp" data-id="${esc(id)}">
    <span class="c-top"><span class="c-mark">${IC.pipe}</span><span class="c-id mono">${esc(id)}</span></span>
    <b>${esc(name)}</b><span class="c-cl">${esc(client)}</span>
    <span class="c-foot"><span><small>Value</small><b>${cr(value, 0)}</b></span><span><small>Due</small><b>${esc(due)}</b></span><span><small>Stage</small><b>${esc(stage)}</b></span></span></button>`;
  return `<div class="dash-c">
   <section class="c-band">
    <div class="c-bandtx"><span class="eyebrow">Live tenders</span><h2>${hmPlural(live.length, 'tender')} open · ${cr(live.reduce((a, o) => a + num(o.meta.value), 0), 0)}</h2>
     <p>Every figure on this page is read from the records behind these tenders. Open one to work on it.</p>
     <button class="btn c-cta" data-a="newopp">${IC.plus}New tender / RFP</button></div>
    <div class="c-cards">${live.map(o => card(o.meta.id, o.meta.name, o.meta.client, num(o.meta.value), fmtDate(o.meta.submission), `${o.pos} · ${stageName(o.pos)}`)).join('')}
     ${rest.map(p => card(p.id, p.name, p.client, p.value, p.dueISO ? fmtDate(p.dueISO) : p.due, stageName(p.stage))).join('')}</div>
   </section>
   <div class="d-lin">
    <section class="panel d-card c-book"><div class="d-stat-h"><h4>The book</h4><span class="sub">every opportunity, not just the open one</span></div>
     <div class="c-bookrow"><div class="stack" style="gap:6px;min-width:0"><b class="d-big">${cr(B.total, 0)}</b>
      <p class="d-note">≈ ${cr(Math.round(B.total * wr / 100), 0)} at the ${wr}% win rate, across ${hmPlural(B.rows.length, 'opportunity', 'opportunities')}.</p>
      <div class="hm-bar">${seg.map(x => `<i style="flex:${x[1]};background:var(${x[2]})"></i>`).join('')}</div></div>
      <div class="c-stats">${[['Win rate', wr + '%'], ['Margin at G2', H.margin + '%'], ['Next due', next ? next.d + ' d' : '—'], ['Open items', String(f.length)]].map(x => `<span><b>${esc(x[1])}</b><small>${esc(x[0])}</small></span>`).join('')}</div></div></section>
    ${bm[0] || ''}${bm[1] || ''}${bm[2] || ''}${bm[3] || ''}${bm[4] || ''}${bm[5] || ''}
    <section class="panel d-card d-ai"><div class="d-stat-h"><span class="d-ic ai">${IC.bot}</span><h4>Ask and act</h4><span class="chip ai">${f.length}</span></div>
     ${hmAsk()}
     <ul class="c-news">${f.slice(0, 3).map((x, i) => `<li><span class="c-badge ${x.sev === 'high' ? 'high' : ''}">${x.sev === 'high' ? '!' : '•'}</span><span><b>${esc(x.t)}</b><small>${x.w}</small></span><button class="btn sm" data-a="dashfind" data-i="${i}">Open</button></li>`).join('') || '<li><span class="d-note">Nothing is outstanding.</span></li>'}</ul></section>
    <div class="c-tiles">${[['Pipeline', 'go', 'pipeline'], ['Knowledge', 'go', 'kb'], ['Analytics', 'go', 'analytics']].map(t => `<button class="c-tile" data-a="${t[1]}" data-v="${t[2]}"><span>${esc(t[0])}</span>${IC.next}</button>`).join('')}</div>
   </div></div>`;
}
/* Every AI action on the dashboard opens here: what was found, why it matters,
   and the ways out of it. Nothing is written from the modal itself. */
function dashModal() {
  const m = S.modal;
  if (m.find != null) {
    const f = hmFindings()[m.find]; if (!f) return '';
    const o = f.o, d = o ? daysTo(o.meta.submission) : null;
    const rows = [['Tender', o ? o.meta.name : '—'], ['Stage', o ? `${o.pos} · ${stageName(o.pos)}` : '—'],
      ['Technical bid due', o ? `${fmtDate(o.meta.submission)}${d != null ? ` · ${d} days` : ''}` : '—'],
      ['Value at stake', o ? cr(num(o.meta.value), 0) : '—'], ['Severity', f.sev === 'high' ? 'Cannot wait' : 'Should be seen this week']];
    return `<div class="scrim" data-a="closemodal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="dft">
      <div class="mh"><div><span class="eyebrow">Suggested next step · read from the records</span><h2 id="dft">${esc(f.t)}</h2></div>
       <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
      <div class="mb stack">
       <div class="note ${f.sev === 'high' ? 'warn' : ''}"><div>${f.w}</div></div>
       <dl class="kv">${rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>
       <p class="sub">Opening takes you to the screen that holds the record, where the change is made and logged against your name.</p></div>
      <div class="mf"><button class="btn" data-a="closemodal">Close</button>
       <button class="btn" data-a="dashgo" data-v="tasks">My work</button>
       <button class="btn pri" data-a="dashgo" data-t="${f.tab}" data-id="${f.id}"${f.sub ? ` data-sub="${f.sub}"` : ''}>Open the record</button></div></div></div>`;
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
   <div class="d-wcai"><div class="d-stat-h"><span class="d-ic ai">${IC.bot}</span><b>What would move them</b></div>
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
const DASH_VIEWS = [['bid', 'Bid room'], ['b', 'Option B'], ['c', 'Option C'], ['pmo', 'Delivery PMO']];
function vOverview() {
  hmS();
  const now = new Date(), me = R();
  const hr = now.getHours(), hello = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const view = DASH_VIEWS.some(v => v[0] === S.ui.dashView) ? S.ui.dashView : 'bid';
  const body = view === 'pmo' ? hmPmo() : view === 'b' ? hmOptionB() : view === 'c' ? hmOptionC()
    : `<div class="dgrid">
    <div class="d-stack" style="grid-column:span 7">${hmBookCard()}${hmTenders()}${hmAgents()}${hmWinChance()}</div>
    <div class="d-stack" style="grid-column:span 5">${hmSugg(4)}${hmRunway()}${hmQueue()}${hmLessons()}</div>
   </div>`;
  return `<div class="dash">
   <section class="d-bar">
    <div class="d-hday"><div class="d-day"><b>${now.getDate()}</b><span>${esc(now.toLocaleDateString('en-GB', { weekday: 'short' }))},<br>${esc(now.toLocaleDateString('en-GB', { month: 'long' }))}</span></div>
     <div class="stack" style="gap:1px;min-width:0"><span class="eyebrow" style="color:var(--text-brand)">${esc(S.cfg.company)}</span><h1>${hello}, ${esc(me.name.split(' ')[0])}.</h1></div></div>
    <div class="seg d-seg">${DASH_VIEWS.map(v => `<button class="${view === v[0] ? 'on' : ''}" data-a="dashview" data-v="${v[0]}">${v[1]}</button>`).join('')}</div>
    <div class="row" style="gap:8px"><button class="btn pri d-cta" data-a="go" data-v="tasks">My work${IC.next}</button><button class="btn d-cta" data-a="newopp">${IC.plus}New tender</button></div>
   </section>
   ${view === 'bid' ? `${hmAsk()}${hmKpis()}` : ''}
   ${body}</div>`;
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
