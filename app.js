// Render loop, actions and events. Every write checks the acting role's permission and is logged.

function viewContent() {
  if (S.view === 'opp' && !O()) S.view = 'pipeline';
  return ({ overview: vOverview, pipeline: vPipeline, tasks: vTasks, map: vMap, opp: vOpp, kb: vKB, agents: vAgents, analytics: vAnalytics, config: vConfig, admin: vAdmin }[S.view] || vOverview)();
}
function crumbsFor() {
  const names = { overview: 'Overview', pipeline: 'Opportunities', tasks: 'My work', map: 'Application map', kb: 'Knowledge library', agents: 'Agents & specialists', analytics: 'Analytics & audit', config: 'Configuration & roles', admin: 'Admin console' };
  if (S.view === 'opp' && O()) { const ti = tabInfo(S.tab); return crumb('<button data-a="go" data-v="pipeline">Opportunities</button>', esc(O().meta.name), `<b>${esc(ti ? tabLabel(ti.t[0]) : '')}</b>`); }
  return crumb(`<b>${names[S.view] || 'Overview'}</b>`);
}
function render() {
  const y = window.scrollY;
  clearGuardCache();
  document.getElementById('root').innerHTML = !S.auth ? (S.view === 'wizard' ? wizard() : loginPage()) : S.view === 'wizard' ? wizard() : shell(viewContent(), crumbsFor());
  renderLayer();
  if (window.BPFX) BPFX.sync();
  if (window.BPCH) BPCH.sync();
  if (S.scrollTop) { window.scrollTo(0, 0); S.scrollTop = false; } else window.scrollTo(0, y);
  cadInit();
  if (document.getElementById('pdfc')) renderPdfPage();
  if (document.getElementById('dwgimg') || (S.v.doc && O() && (O().docs.find(d => d.id === S.v.doc) || {}).kind === 'img' && document.getElementById('cadstage'))) loadImg();
  if (S.v.flash && S.tab === 'docs') { const m = document.querySelector('.paper mark:not(.ai)') || document.querySelector('.paper mark'); if (m) { m.classList.add('flash'); const pw = m.closest('.pagewrap'); if (pw) pw.scrollTop = Math.max(0, m.offsetTop - 120); } S.v.flash = null; }
  if (S.ui.pren) { const i = document.getElementById('pren-' + S.ui.pren); if (i) { i.focus(); i.select(); } }
  if (S.ui.flashRow) { const r = document.querySelector('tr.newrow'); if (r) r.scrollIntoView({ block: 'nearest' }); setTimeout(() => { S.ui.flashRow = null; }, 50); }
  save();
}
function renderLayer() {
  document.getElementById('layer').innerHTML = overlays();
  const r = document.getElementById('renname');
  if (r && S.ui.ren && !S.ui.ren.focused) { r.focus(); r.select(); S.ui.ren.focused = true; }
  const f = document.querySelector('#recform input, #recform textarea, #recform select, #oppform input, #inviteform input');
  if (f && S.modal && !S.modal.focused) { f.focus(); S.modal.focused = true; }
}
let toastTimer;
function toast(msg) { S.toast = msg; renderLayer(); clearTimeout(toastTimer); toastTimer = setTimeout(() => { S.toast = null; renderLayer(); }, 3600); }

function setTab(t) { const ti = tabInfo(t); if (!ti) return; if (!tabOn(ti.t)) { toast(`${tabLabel(t)} is switched off in configuration.`); return; } S.view = 'opp'; S.phase = ti.phase.id; S.tab = t; }
const PR = () => ensureProp();
const DOWN = { reqs: 'It now appears in Requirements and the Compliance matrix.', risks: 'Priced value flows into the estimate contingency.', clars: 'Track it in Clarifications.', basis: 'The proposal design-basis table uses it.', facts: 'Shown on the Tender brief.', est: 'Price recalculated.', om: 'O&M NPV recalculated.', bids: 'Ranking updated.', sups: 'Levelled totals updated.', ptest: 'Pass / fail recalculated.' };
const firstTab = { reqs: 'reqs', risks: 'risks', clars: 'clar', basis: 'basis', facts: 'brief' };
function dropDependentDrafts(clarId) { const pr = PR(), keys = { 'PBQ-03': ['basis-inf'], 'PBQ-04': ['sewer-trench'], 'PBQ-05': ['energy-basis'], 'PBQ-07': ['hyd-prof'] }[clarId] || []; const secs = O().reqs.filter(r => r.clar === clarId).map(r => r.sec); allNodes(pr.tree).forEach(n => { if (keys.includes(n.k) || secs.includes(n.k) || secs.includes(n.id)) delete pr.paras[n.id]; }); }

const ACT = {
  go: d => { S.view = d.v; S.scrollTop = true; },
  opp: d => { if (!S.db.opps[d.id]) { toast('Sample card only. Open a live tender, or start a new one.'); return 'skip'; } if (S.oppId !== d.id) { S.v.doc = null; S.msgs = []; } S.oppId = d.id; S.view = 'opp'; S.scrollTop = true; },
  oppdel: d => {
    if (!can('meta')) { toast(`${R().title} cannot delete a tender.`); return 'skip'; }
    if (S.ui.oppdel !== d.id) { S.ui.oppdel = d.id; return; }
    delete S.db.opps[d.id]; S.db.order = S.db.order.filter(x => x !== d.id);
    if (S.oppId === d.id) S.oppId = S.db.order[0] || null;
    S.ui.oppdel = null; log('Deleted tender', d.id);
    if (!S.oppId) { S.view = 'pipeline'; toast('That was the last tender. Start a new one to open a bid workspace.'); }
  },
  opentab: d => { setTab(d.t); S.scrollTop = true; },
  tab: d => { if (S.tab === 'docs' && d.t !== 'docs') S.v.back = null; setTab(d.t); },
  phase: d => { const p = visiblePhases().find(x => x.id === d.v); S.phase = d.v; S.tab = p.tabs.find(t => t[0] !== '~' && t[0] !== '|')[0]; },
  stage: d => { const t = PHASES.flatMap(p => p.tabs).find(t => t[2] === +d.n && tabOn(t)); if (!t) { toast('This stage is switched off in configuration.'); return 'skip'; } setTab(t[0]); },
  taskgo: d => { if (d.id) S.oppId = d.id; setTab(d.t); S.scrollTop = true; },
  ref: d => openRef(d.ref),
  dxf: d => { S.ui.dxf = d.v; },
  wkf: d => { S.ui.wkf = d.v; },
  opendoc: d => { S.view = 'opp'; S.phase = 'pre'; S.tab = 'docs'; openDoc(d.id); },
  opensheet: d => { S.view = 'opp'; S.phase = 'pre'; S.tab = 'docs'; S.v.doc = 'D-04'; S.v.sheet = d.no; S.v.z = 0; S.v.m = []; S.v.mA = null; S.v.pin = null; },
  closedoc: () => { S.v.doc = null; S.v.back = null; S.scrollTop = true; },
  vback: () => { const b = S.v.back; S.v.doc = null; S.v.back = null; S.phase = b.phase; S.tab = b.tab; S.scrollTop = true; },
  vpage: d => { S.v.page = +d.p; }, vlist: d => { S.v.list = d.v; S.v.q = ''; }, vfs: d => { S.v.fs = Math.max(60, Math.min(180, (S.v.fs || 100) + +d.v)); }, vai: () => { S.v.ai = !S.v.ai; },
  vmode: d => { S.v.mode = d.v; S.v.mA = null; S.v.cal = null; if (d.v !== 'pin') S.v.pin = null; },
  vzoom: d => { cadZoom(+d.v); return 'skip'; }, vfit: () => { cadFit(); return 'skip'; }, vdark: () => { S.v.dark = !S.v.dark; }, vlayer: d => { S.v.off[d.k] = !S.v.off[d.k]; },
  mdel: d => { S.v.m.splice(+d.i, 1); }, mclear: () => { S.v.m = []; S.v.mA = null; }, xtab: d => { S.v.xtab = +d.i; },
  extract: d => { extractReqs(d.id); return 'skip'; },
  importboq: d => { importBoq(d.id); },
  calsave: () => { const v = num(document.getElementById('calm').value), d = O().docs.find(x => x.id === S.v.doc); if (!v || !S.v.cal) { toast('Enter the real length in metres.'); return 'skip'; } d.mpu = v / S.v.cal.px; S.v.cal = null; S.v.mode = 'measure'; log('Calibrated drawing scale', `${d.id}: ${v} m`); toast(`Scale set: 1 px = ${(d.mpu * 1000).toFixed(1)} mm. Measure is on.`); },
  pinsave: d => { const t = document.getElementById('pinnote'), note = t ? t.value.trim() : ''; if (!note) { toast('Write the finding first.'); return 'skip'; } const pins = pinsOf(); pins.push({ x: S.v.pin[0], y: S.v.pin[1], note, by: S.role }); const n = pins.length, ref = S.v.doc === 'D-04' ? 'dwg:' + S.v.sheet : `${O().docs.find(x => x.id === S.v.doc).code}:1:Pin ${n}`; S.v.pin = null; log('Pinned finding', note.slice(0, 60)); if (d.also) { const k = d.also; if (!can(FORMS[k].perm)) { toast('Pin saved. Your role cannot create that record.'); return; } S.modal = { k, rec: { ...(FORMS[k].d || {}), [k === 'risks' ? 'risk' : 'q']: k === 'clars' ? `Please clarify (drawing pin ${n}): ${note}` : note, src: ref }, fromSel: true }; } else toast(`Pin ${n} saved on the drawing.`); },
  pincancel: () => { S.v.pin = null; }, pindel: d => { pinsOf().splice(+d.i, 1); },
  fadd: d => { const F = FORMS[d.k]; if (!canEdit(d.k)) { toast('Your role cannot add these.'); return 'skip'; } S.modal = { k: d.k, rec: { ...(F.d || {}) } }; },
  fedit: d => { const r = coll(O(), d.k).find(x => String(x.id) === d.id); S.modal = { k: d.k, id: d.id, rec: { ...r, ...(d.ans ? { status: 'answered' } : {}) } }; },
  fdel: d => { S.ui.del = d.k + ':' + d.id; }, fdelno: () => { S.ui.del = null; },
  fdelok: d => { const l = coll(O(), d.k), i = l.findIndex(x => String(x.id) === d.id); if (i >= 0 && canEdit(d.k)) { const [r] = l.splice(i, 1); log(`Deleted ${FORMS[d.k].t.toLowerCase()}`, r.id && !String(r.id).startsWith('r') ? r.id : ''); } S.ui.del = null; },
  accreq: d => { const r = O().reqs.find(x => x.id === d.id); if (r && can('reqs')) { r.st = 'accepted'; log('Accepted requirement', r.id); } },
  accall: () => { O().reqs.forEach(r => { if (r.st === 'proposed') r.st = 'accepted'; }); log('Accepted all proposed requirements'); toast('All proposed requirements accepted'); },
  rf: d => { S.ui.rf = d.v; },
  clarsend: d => { const c = O().clars.find(x => x.id === d.id); c.status = 'open'; log('Sent pre-bid query', c.id); toast(`${c.id} sent to the Authority. Record the answer when it arrives.`); },
  /* Soft enforcement: an unsigned gate does not silently block, and does not silently open.
     It warns, asks again, then advances and records the bypass against the tender. */
  advance: () => {
    const o = O(); if (!canAdvance()) { toast(`${R().title} cannot move this tender's stage.`); return 'skip'; }
    if (o.closed) { toast(`This tender is closed (${o.closed.state}). Reopen it first.`); return 'skip'; }
    const ge = Object.entries(GATES).find(([, G]) => G.stage === o.pos);
    if (ge && !gateSigned(ge[0])) {
      const g = ge[0];
      if (S.ui.ungate !== g) { S.ui.ungate = g; toast(`${g} ${GATES[g].name} is not signed. Press again to advance anyway — the bypass is recorded.`); return 'skip'; }
      S.ui.ungate = null;
      o.ungated[g] = { stage: o.pos, by: R().name, role: S.role, ts: nowTs() };
      log(`Advanced past ${g} without sign-off`, `${g} ${GATES[g].name} (stage ${o.pos})`);
    }
    o.pos++; log('Completed stage', `${o.pos - 1} ${stageName(o.pos - 1)}`);
    const t = STAGES[o.pos - 1][2]; if (tabOn(tabInfo(t).t)) setTab(t);
    toast(`Stage ${o.pos} ${stageName(o.pos)} is now active.`);
  },
  gate: d => { S.modal = { gate: d.g }; }, closemodal: () => { S.modal = null; }, closedrawer: () => { S.drawer = null; },
  mailguardfix: () => { if (S.modal && S.modal.mail) { S.modal.mail.guard = null; renderLayer(); } return 'skip'; },
  mailguardovr: () => {
    if (!can('envB')) { toast(`${R().title} cannot override the envelope guard.`); return 'skip'; }
    if (S.modal && S.modal.mail) { S.modal.mail.guardAck = true; const f = document.getElementById('mailform'); if (f) f.requestSubmit(); }
    return 'skip';
  },
  gatesign: d => {
    const g = d.g, G = GATES[g], o = O(), c = document.getElementById('gatecomment'), note = (c && c.value.trim()) || '';
    if (!G.roles.includes(S.role) || G.stage !== o.pos) { S.modal = null; toast(`${R().title} cannot sign ${g} now.`); return; }
    if (gateReturned(g)) { S.modal = null; toast(`${g} was returned with comments. Mark it resolved before signing.`); return; }
    o.signed[g + S.role] = true;
    (o.sigs = o.sigs || []).push({ g, role: S.role, name: R().name, title: R().title, ts: nowTs(), sid: S.sid, comment: note });
    log(`Signed ${g}`, `${R().name}${note ? ' · ' + note.slice(0, 60) : ''}`);
    S.modal = null;
    const left = G.roles.filter(r => !o.signed[g + r]);
    if (left.length) { toast(`Signed as ${R().name}. Waiting for ${left.map(r => ROLES[r].name).join(' and ')}.`); return; }
    /* G1 is a decision, not a formality: No bid closes the tender instead of advancing it. */
    if (g === 'G1' && o.g1.dec === 'No bid') {
      o.closed = { state: 'No bid', reason: note || (o.g1.memo || '').slice(0, 300), by: R().name, ts: nowTs(), stage: o.pos };
      log('Closed as No bid at G1', o.meta.id);
      toast(`${g} signed as No bid. ${o.meta.name} is closed and out of the live pipeline.`);
      return;
    }
    o.pos = G.stage + 1; log(`${g} passed`, o.meta.id);
    toast(`${g} signed by all signatories. Stage ${Math.min(13, G.stage + 1)} ${stageName(Math.min(13, G.stage + 1))} is now active.`);
  },
  gatereturn: d => {
    const g = d.g, G = GATES[g], o = O(), c = document.getElementById('gatecomment'), note = (c && c.value.trim()) || '';
    if (!G.roles.includes(S.role)) { toast(`${R().title} is not a signatory for ${g}.`); return 'skip'; }
    if (!note) { toast('Write a comment first: it is what the team has to act on.'); return 'skip'; }
    o.gateRet = o.gateRet || {};
    o.gateRet[g] = { comment: note, by: R().name, role: S.role, ts: nowTs(), open: true };
    G.roles.forEach(r => delete o.signed[g + r]);
    o.sigs = (o.sigs || []).filter(s => s.g !== g);
    log(`Returned ${g} with comments`, note.slice(0, 80));
    S.modal = null;
    toast(`${g} returned to the team. Signatures cleared and the comment is on the gate.`);
  },
  gateresolve: d => {
    const g = d.g, G = GATES[g], o = O();
    if (!G.roles.includes(S.role) && !can('meta')) { toast(`${R().title} cannot resolve ${g}.`); return 'skip'; }
    if (!gateReturned(g)) return 'skip';
    o.gateRet[g].open = false; o.gateRet[g].resolvedBy = R().name; o.gateRet[g].resolvedTs = nowTs();
    log(`Resolved the comment on ${g}`, o.meta.id);
    toast(`${g} is open for signature again.`);
  },
  reopen: () => {
    const o = O(); if (!can('meta')) { toast(`${R().title} cannot reopen a closed tender.`); return 'skip'; }
    const was = o.closed ? o.closed.state : ''; o.closed = null;
    log('Reopened tender', `${o.meta.id} (was ${was})`);
    toast(`${o.meta.name} is back in the live pipeline.`);
  },
  role: d => { S.role = d.r; S.ui.umenu = false; S.ui.rmenu = false; log('Switched role', R().name); toast(`Acting as ${R().name}, ${R().title}`); },
  asst: () => { S.asst = !S.asst; S.ui.umenu = false; if (S.asst) S.ui.aidOpen = true; else { if (S.ui.voice) voiceCancel(); S.ui.aidOpen = false; aiDock.wasOut = false; } },
  asston: () => { S.asstOn = S.asstOn === false; S.ui.umenu = false; if (S.asstOn === false) { if (S.ui.voice) voiceCancel(); S.asst = false; S.ui.aidOpen = false; aiDock.wasOut = false; } },
  aidopen: () => { S.ui.aidOpen = !S.ui.aidOpen; },
  aidmin: () => { S.ui.aidOpen = false; },
  aidclear: () => { S.msgs = []; },
  voice: () => { voiceStart(); return 'skip'; },
  voicestop: () => { voiceStop(); return 'skip'; },
  voicecancel: () => { voiceCancel(); return 'skip'; }, askq: d => { askAI(d.q); return 'skip'; },
  railtog: () => { S.ui.railMin = !S.ui.railMin; },
  umenu: () => { S.ui.umenu = !S.ui.umenu; S.ui.rmenu = false; },
  rmenu: () => { S.ui.rmenu = !S.ui.rmenu; S.ui.umenu = false; },
  nobanner: () => { S.ui.noBanner = true; },
  agmode: d => { S.ui.agMode = d.v; },
  agopen: () => { S.view = 'admin'; S.ui.sub = S.ui.sub || {}; S.ui.sub.admin = 'ai'; S.scrollTop = true; },
  kbtab: d => { S.ui.sub = S.ui.sub || {}; S.ui.sub.kb = d.v; },
  signout: () => { S.ui.umenu = false; if (typeof ACT.logout === 'function') return ACT.logout(); if (typeof signOut === 'function') return signOut(); },
  toast: d => { toast(d.msg); return 'skip'; },
  theme: () => { const el = document.documentElement, cur = el.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); const next = cur === 'dark' ? 'light' : 'dark'; el.dataset.theme = next; try { localStorage.setItem('bp-theme', next); } catch (er) { } return 'skip'; },
  reset: () => { if (!S.ui.reset) { S.ui.reset = 1; toast('Click Reset sample data again to erase every change and new tender.'); return 'skip'; } try { localStorage.removeItem(STORE); indexedDB.deleteDatabase('bidplan-ww2-files'); } catch (e) { } location.reload(); return 'skip'; },
  wizard: () => { S.wz.cfg = deep(S.cfg); S.wz.step = 1; S.view = 'wizard'; S.scrollTop = true; },
  wzstep: d => { S.wz.step = Math.max(1, Math.min(7, +d.v)); S.scrollTop = true; },
  wzall: d => { S.wz.cfg[d.k] = d.v === 'all' ? CATALOG[d.k].map(x => x[0]) : []; },
  activate: () => { if (!S.wz.cfg.types.length) S.wz.cfg.types = ['stp']; S.cfg = deep(S.wz.cfg); S.view = 'overview'; S.scrollTop = true; log('Activated workspace configuration'); toast(`Workspace activated for ${S.cfg.company}.`); },
  newopp: () => { if (!can('meta')) { toast('Only the bid manager or BD head can start a tender.'); return 'skip'; } S.modal = { newopp: true, files: [] }; },
  ntdrop: d => { if (!S.modal) return 'skip'; (S.modal.files || []).splice(+d.i, 1); renderLayer(); return 'skip'; },
  metasave: () => { const m = O().meta; document.querySelectorAll('[data-mf]').forEach(el => { const k = el.dataset.mf; if (k === 'type') m.types[0] = el.value; else if (k === 'value' || k === 'fit') m[k] = el.value === '' ? null : num(el.value); else m[k] = el.value; }); log('Updated opportunity', m.name); toast('Opportunity saved. The header, overview and pipeline now show the new values.'); },
  sumsave: () => { O().brief.summary = document.getElementById('briefsum').value; log('Updated tender summary'); toast('Summary saved'); },
  g1dec: d => { O().g1.dec = d.v; log('Recorded bid decision', d.v); }, g1save: () => { O().g1.cond = document.getElementById('g1cond').value; toast('Decision note saved'); },
  calcsave: () => { const o = O(), r = CALC.compute(o.calc); o.runs.unshift({ n: o.runs.length + 1, sum: `${o.calc.mld} MLD · BOD ${o.calc.bod} · ${o.calc.basins} basins → ${r.kpis[2][1]}`, by: R().name, ts: nowTs() }); log('Saved calculator run', '#' + o.runs.length); toast('Run saved. It is listed in Technical annexures.'); },
  calcpush: () => { const o = O(), c = o.calc, set = (f, v) => { const b = o.basis.find(x => x.f === f); if (b) { b.v = v; b.st = 'proposed'; b.src = b.src || ''; } else o.basis.push({ id: uid(), f, v, src: '', st: 'proposed' }); }; set('Average design flow', c.mld + ' MLD'); set('Peak factor', String(c.pf)); set('Raw BOD (design)', c.bod + ' mg/l'); set('SBR basins', c.basins + ' in parallel'); set('Specific energy (calculated)', CALC.compute(c).kpis[2][1]); log('Applied calculator to design basis'); toast('Five design-basis values updated as Proposed. Accept them in Design basis & rules.'); },
  award: d => { const L = O().lev; L.award = d.id; const s = L.sups.find(x => x.id === d.id); log('Awarded package', `${L.pkg} → ${s.name}`); toast(`${s.name} selected. Its data sheet is now in Technical annexures.`); },
  scen: d => { O().scen = d.v; O().margin = null; log('Chose pricing scenario', d.v); },
  selrec: d => { const k = d.k, F = FORMS[k]; if (!can(F.perm)) { toast(`${R().title} cannot create ${F.t.toLowerCase()} records.`); return 'skip'; } const t = S.sel.text, ref = S.sel.ref, pre = { reqs: { text: t }, risks: { risk: t }, clars: { q: `Please clarify: “${t}”` }, basis: { f: '', v: t }, facts: { k: '', v: t } }[k]; S.modal = { k, rec: { ...(F.d || {}), ...pre, src: ref }, fromSel: true }; S.sel = null; try { window.getSelection().removeAllRanges(); } catch (e) { } },
  kb: d => { const p = PAST[d.id]; S.drawer = { eb: 'Knowledge library · ' + d.id, title: p.name, html: `<div class="row" style="gap:6px"><span class="chip ${p.res === 'Won' ? 'ok' : 'bad'}">${p.res} ${p.yr}</span><span class="chip">Evaluator ${p.score}/100</span><span class="chip ai">Similarity ${(+d.sim).toFixed(2)}</span></div><p><b>${esc(d.sec)}</b> · ${esc(d.note)}</p>` }; },
  /* proposal */
  padd: d => { if (!can('prop')) return 'skip'; const pr = PR(), n = { id: 'n' + (++pr.seq), k: null, title: 'New section', own: 'bid_manager', rev: 'bd_head', from: 'user', type: 'text', st: 'not_started', gen: false, due: '', kids: [] }; if (d.id) findNode(pr.tree, d.id).n.kids.push(n); else pr.tree.push(n); pr.dirty = true; S.ui.pren = n.id; },
  pmove: d => { if (!can('prop')) return 'skip'; const pr = PR(), f = findNode(pr.tree, d.id), j = f.idx + +d.v; if (j < 0 || j >= f.list.length) return; [f.list[f.idx], f.list[j]] = [f.list[j], f.list[f.idx]]; pr.dirty = true; },
  pren: d => { S.ui.pren = d.id; }, pdel: d => { S.ui.pdel = d.id; }, pdelno: () => { S.ui.pdel = null; },
  pdelok: d => { const pr = PR(), f = findNode(pr.tree, d.id); f.list.splice(f.idx, 1); S.ui.pdel = null; pr.dirty = true; },
  psave: () => { const pr = PR(), v = Math.max(...pr.versions.map(x => x.v)) + 1; pr.versions.push({ v, ts: nowTs(), by: R().name, note: 'Manual edits', tree: deep(pr.tree) }); pr.ver = v; pr.dirty = false; log('Saved proposal structure', 'v' + v); },
  ppreset: d => { S.ui.pins = d.v; },
  psuggest: () => { const t = document.getElementById('ps-ins'), ins = (t && t.value.trim()) || S.ui.pins; if (!ins) { toast('Tell bidPlan what to change, or pick a suggestion.'); return 'skip'; } S.ui.pins = ins; S.ui.psug = suggestRevision(ins); },
  papply: () => { const pr = PR(), sg = S.ui.psug, v = Math.max(...pr.versions.map(x => x.v)) + 1; pr.tree = sg.tree; pr.versions.push({ v, ts: nowTs(), by: 'bidPlan AI', note: sg.note, tree: deep(sg.tree) }); pr.ver = v; pr.dirty = false; S.ui.psug = null; },
  pdiscard: () => { S.ui.psug = null; },
  pgen: d => { const pr = PR(); let n = 0; const gen = x => { if (!x.gen && canSec(x)) { x.gen = true; n++; } }; if (d.id === 'all') allNodes(pr.tree).forEach(gen); else { const f = findNode(pr.tree, d.id); gen(f.n); f.n.kids.forEach(gen); } pr.tree.forEach(t => { if ((t.gen || t.kids.some(k => k.gen)) && t.st === 'not_started') { t.gen = true; t.st = 'draft'; } }); log('Generated draft', n + ' sections'); toast(n ? `Drafted ${n} section${n === 1 ? '' : 's'} from this tender's records.` : 'Nothing you own is left to draft.'); },
  pstat: d => { const pr = PR(), n = findNode(pr.tree, d.id).n; if (d.v === 'approved' || (d.v === 'draft' && n.st === 'in_review')) { if (!canApprove(n)) { toast(`Only ${ROLES[n.rev].name} (reviewer) or the bid manager can do this.`); return 'skip'; } } else if (!canSec(n) && !canApprove(n)) { toast(`Only ${ROLES[n.own].name} (owner) can submit this section.`); return 'skip'; } if (d.v === 'approved') [n, ...n.kids].forEach(x => (pr.paras[x.id] || []).forEach(p => { if (p.st === 'proposed') p.st = 'accepted'; })); n.st = d.v; log(`Section ${d.v.replace('_', ' ')}`, n.title); },
  pbulk: () => { let c = 0; PR().tree.forEach(n => { if (n.st === 'draft') { n.st = 'in_review'; c++; } }); toast(c ? `${c} sections sent to their reviewers` : 'No sections in draft'); },
  psel: d => { const pr = PR(); pr.sel = d.id; if (d.go || d.edit) pr.mode = 'selected'; if (d.go) setTab('pdraft'); S.ui.pmenu = null; },
  pmode: d => { PR().mode = d.v; }, pmenu: d => { S.ui.pmenu = S.ui.pmenu === d.id ? null : d.id; },
  pregen: d => { const pr = PR(), n = findNode(pr.tree, d.id).n; S.ui.pmenu = null; if (d.v === 'regen') delete pr.paras[n.id]; else if (d.v === 'concise') (pr.paras[n.id] || []).forEach(p => { if (p.t) { p.t = p.t.split(/(?<=\.)\s/)[0]; p.st = 'proposed'; } }); else if (d.v === 'para') (pr.paras[n.id] = pr.paras[n.id] || []).push({ t: 'New paragraph. Click to edit.', src: [], kb: [], st: 'edited', flag: '' }); else (pr.paras[n.id] = pr.paras[n.id] || []).push({ t: 'On Vadodara 150 MLD, the same approach was accepted by the Independent Engineer without comment; we will apply it here with the same team.', src: [], kb: [kb('PB-2021-04', '§12', 0.83, 'Evidence paragraph')], st: 'proposed', flag: '' }); PR().mode = 'selected'; pr.sel = n.id; },
  pacc: d => { PR().paras[d.n][+d.ix].st = 'accepted'; }
};

document.addEventListener('mousedown', e => { if (S.sel && !e.target.closest('.selbar')) { S.sel = null; renderLayer(); } });
document.addEventListener('mouseup', e => {
  const c = e.target.closest && e.target.closest('[data-selsrc]'); if (!c) return;
  setTimeout(() => { const s = window.getSelection(), t = s ? s.toString().replace(/\s+/g, ' ').trim() : ''; if (t.length < 8) return; const r = s.getRangeAt(0).getBoundingClientRect(); S.sel = { text: t.slice(0, 600), ref: c.dataset.selsrc, x: Math.max(8, Math.min(window.innerWidth - 470, r.left)), y: Math.max(8, r.top - 46) }; renderLayer(); }, 0);
});
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if ((S.ui.umenu || S.ui.rmenu) && !e.target.closest('.profile')) { S.ui.umenu = false; S.ui.rmenu = false; if (!el) { render(); return; } }
  if (!el) { if (S.ui.pmenu && !e.target.closest('.menu')) { S.ui.pmenu = null; render(); } return; }
  const a = el.dataset.a;
  if ((a === 'closemodal' || a === 'closedrawer' || a === 'renclose') && el.classList.contains('scrim') && e.target !== el) return;
  if (el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type !== 'button')) return;
  const fn = ACT[a]; if (!fn) return; e.preventDefault();
  if (a !== 'reset') S.ui.reset = 0; if (a !== 'oppdel') S.ui.oppdel = null; if (a !== 'advance') S.ui.ungate = null;
  if (fn(el.dataset) === 'skip') return; render();
});

function quickSet(t) {
  const k = t.dataset.k, F = FORMS[k]; if (!canEdit(k)) { toast(LOCK[k] && gateSigned(LOCK[k]) ? 'Locked: ' + LOCK[k] + ' is signed.' : 'View only for your role.'); return; }
  const r = coll(O(), k).find(x => String(x.id) === t.dataset.id); if (!r) return;
  const f = t.dataset.f, v = t.type === 'checkbox' ? t.checked : (t.type === 'number' || t.type === 'range') ? num(t.value) : t.value;
  r[f] = v; log(`Updated ${F.t.toLowerCase()} ${r.id && !String(r.id).startsWith('r') ? r.id : ''}`.trim(), `${f} → ${typeof v === 'boolean' ? (v ? 'yes' : 'no') : v}`);
}
document.addEventListener('change', e => {
  const t = e.target, c = t.dataset.c; if (!c) return; const o = O(), pr = o && o.prop;
  const A = {
    actas: () => { S.role = t.value; log('Switched role', R().name); },
    /* A demo control, so it is restricted and logged like any other stage move. */
    demopos: () => { if (!canAdvance()) { toast(`${R().title} cannot move this tender's stage.`); return 'skip'; } o.pos = +t.value; Object.keys(GATES).forEach(g => GATES[g].roles.forEach(r => { if (GATES[g].stage >= o.pos) delete o.signed[g + r]; })); o.sigs = (o.sigs || []).filter(s => GATES[s.g] && GATES[s.g].stage < o.pos); Object.keys(o.ungated || {}).forEach(g => { if (GATES[g] && GATES[g].stage >= o.pos) delete o.ungated[g]; }); log('Moved demo stage', `${o.pos} ${stageName(o.pos)}`); },
    vdoc: () => openDoc(t.value),
    upload: () => { uploadFiles([...t.files]); },
    /* New-tender modal: files are held until the tender exists, then read into it. */
    ntfiles: () => { if (!S.modal) return 'skip'; S.modal.files = (S.modal.files || []).concat([...t.files]); renderLayer(); return 'skip'; },
    docdisc: () => { o.docs.find(d => d.id === t.dataset.id).disc = t.value; },
    qset: () => quickSet(t),
    levval: () => { if (!can('quotes')) return; o.lev.adders.find(a => a.id === t.dataset.ad).vals[t.dataset.s] = t.value === '' ? null : num(t.value); },
    levpkg: () => { o.lev.pkg = t.value; },
    omesc: () => { if (can('est')) o.omEsc = num(t.value); },
    custm: () => { if (can('margin')) { o.margin = t.value === '' ? null : num(t.value); log('Set margin', t.value + '%'); } },
    nres: () => { o.nego.result = t.value; log('Recorded outcome', t.value); },
    blchk: () => { o.baseline.find(b => b.id === t.dataset.id).ok = t.checked; },
    cxp: () => { if (can('cx')) o.cx.systems.find(s => s.id === t.dataset.id).p[+t.dataset.i] = num(t.value); },
    ptday: () => { o.ptDay = num(t.value); },
    ptypesel: () => { S.pipeType = t.value; },
    wzopt: () => { const l = S.wz.cfg[t.dataset.k], i = l.indexOf(t.dataset.id); if (t.checked && i < 0) l.push(t.dataset.id); if (!t.checked && i >= 0) l.splice(i, 1); },
    wzrole: () => { S.wz.cfg.role = t.value; }, wzsel: () => { S.wz.cfg[t.dataset.k] = t.value; },
    pren: () => { const f = findNode(pr.tree, t.dataset.id); if (f && t.value.trim()) { f.n.title = t.value.trim(); pr.dirty = true; } S.ui.pren = null; },
    pver: () => { const v = pr.versions.find(x => x.v === +t.value); pr.tree = deep(v.tree); pr.ver = v.v; pr.dirty = false; },
    preview: () => { findNode(pr.tree, t.dataset.id).n.rev = t.value; }, pdue: () => { findNode(pr.tree, t.dataset.id).n.due = t.value; },
    chk: () => { o.checks[t.dataset.id] = t.checked; }
  };
  if (A[c]) { A[c](); if (c !== 'upload') render(); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.calc) { if (!can('eng')) return; O().calc[t.dataset.calc] = +t.value; const tmp = document.createElement('div'); tmp.innerHTML = tEng(); ['calckpi', 'calcrows'].forEach(id => { const a = document.getElementById(id), b = tmp.querySelector('#' + id); if (a && b) a.replaceWith(b); }); const inp = CALC.inputs.find(i => i[0] === t.dataset.calc), lb = document.getElementById('cv-' + inp[0]); if (lb) lb.textContent = t.value + ' ' + inp[2]; save(); return; }
  if ((t.dataset.c === 'qset' || t.dataset.c === 'cxp') && t.type === 'range') { const b = t.parentElement.querySelector('b'); if (b) b.textContent = t.value + (b.textContent.includes('%') ? '%' : ''); return; }
  const k = t.dataset.i; if (!k) return;
  if (k === 'wzf') { S.wz.cfg[t.dataset.k] = t.value; return; }
  if (k === 'ppara') { const p = PR().paras[t.dataset.n][+t.dataset.ix]; p.t = t.textContent; p.st = 'edited'; save(); return; }
  const set = { vq: () => { S.v.q = t.value; }, psq: () => { PR().q = t.value; }, pdq: () => { S.ui.pdq = t.value; } }[k]; if (!set) return; set();
  const id = t.id, pos = t.selectionStart; render(); const n = document.getElementById(id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { } }
});
document.addEventListener('submit', e => {
  e.preventDefault(); const id = e.target.id;
  if (id === 'askform') { const i = document.getElementById('askin'), v = i.value.trim(); if (!v) return; askAI(v); return; }
  if (id === 'oppform') {
    const g = x => document.getElementById(x).value.trim(), name = g('no-name'), client = g('no-client'), due = g('no-due');
    if (!name || !client || !due) { S.modal.err = 'Name, client and bid due date are required.'; renderLayer(); return; }
    const nid = 'OPP-WW-' + (400 + S.db.order.length); S.db.opps[nid] = blankOpp({ id: nid, name, client, loc: g('no-loc'), type: g('no-type'), model: g('no-model'), value: g('no-value'), submission: due }); S.db.order.push(nid); S.oppId = nid;
    const owner = g('no-owner'); if (ROLES[owner]) { S.db.opps[nid].meta.owner = owner; log('Assigned bid manager', ROLES[owner].name); }
    const picked = (S.modal.files || []).slice();
    S.modal = null; S.view = 'opp'; S.phase = 'pre'; S.tab = 'docs'; S.v.doc = null; S.scrollTop = true; log('Created tender', name); render();
    if (picked.length) { toast(`${name} created. Reading ${picked.length} document${picked.length > 1 ? 's' : ''}…`); uploadFiles(picked); }
    else toast(`${name} created. Start by uploading the tender documents.`);
    return;
  }
  if (id === 'recform') {
    const m = S.modal, F = FORMS[m.k]; if (!canEdit(m.k)) return; const { out, miss } = readForm(m.k);
    if (miss) { m.err = `${miss} is required.`; renderLayer(); return; }
    const l = coll(O(), m.k); let rec;
    if (m.id) { rec = l.find(x => String(x.id) === m.id); const was = rec.status; Object.assign(rec, out); if (m.k === 'clars' && out.status === 'answered' && was !== 'answered') dropDependentDrafts(rec.id); log(`Edited ${F.t.toLowerCase()}`, rec.id && !String(rec.id).startsWith('r') ? rec.id : (out.text || out.name || out.risk || out.item || '').slice(0, 50)); }
    else { const C = COLL[m.k] || {}; rec = { ...(F.d || {}), ...out, id: C.pre ? nextId(l, C.pre, C.pad) : (m.k === 'sups' ? 's' + uid() : uid()) }; if (m.k === 'levadd') rec.vals = {}; if (m.k === 'cxsys') rec.p = [0, 0, 0, 0, 0]; if (m.k === 'reqs' && rec.sec == null) rec.sec = ''; l.push(rec); S.ui.flashRow = rec.id; log(`Added ${F.t.toLowerCase()}`, String(rec.id).startsWith('r') ? (out.text || out.name || out.risk || out.item || out.k || '').slice(0, 50) : rec.id); }
    const from = m.fromSel, k = m.k; S.modal = null; render();
    toast(`${F.t} ${m.id ? 'saved' : 'added'}${String(rec.id).startsWith('r') ? '' : ' as ' + rec.id}. ${DOWN[k] || ''}${from && firstTab[k] ? ' Open it from the ' + tabLabel(firstTab[k]) + ' tab.' : ''}`);
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && (S.modal || S.drawer || S.sheet || S.sel || S.ui.pmenu || S.ui.pren || S.ui.ren)) { S.modal = null; S.drawer = null; S.sheet = null; S.sel = null; S.ui.pmenu = null; S.ui.pren = null; S.ui.ren = null; render(); }
  if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('ren')) { e.preventDefault(); e.target.blur(); }
});
/* drag tender files onto the drop zone */
document.addEventListener('dragover', e => { const z = e.target.closest && e.target.closest('#dropzone,#ntdrop'); if (z) { e.preventDefault(); z.classList.add('over'); } else if (S.ui.drag) { const r = e.target.closest && e.target.closest('.prow[data-drag]'); if (r) { e.preventDefault(); document.querySelectorAll('.prow.over').forEach(x => x.classList.remove('over')); r.classList.add('over'); } } });
document.addEventListener('dragleave', e => { const z = e.target.closest && e.target.closest('#dropzone,#ntdrop'); if (z) z.classList.remove('over'); });
document.addEventListener('dragstart', e => { const r = e.target.closest && e.target.closest('.prow[data-drag]'); if (!r || !can('prop')) return; S.ui.drag = r.dataset.drag; r.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', r.dataset.drag); } catch (er) { } });
document.addEventListener('dragend', () => { S.ui.drag = null; document.querySelectorAll('.prow.over,.prow.dragging').forEach(x => x.classList.remove('over', 'dragging')); });
document.addEventListener('drop', e => {
  const nz = e.target.closest && e.target.closest('#ntdrop');
  if (nz) { e.preventDefault(); nz.classList.remove('over'); if (e.dataTransfer.files.length && S.modal) { S.modal.files = (S.modal.files || []).concat([...e.dataTransfer.files]); renderLayer(); } return; }
  const z = e.target.closest && e.target.closest('#dropzone'); if (z) { e.preventDefault(); z.classList.remove('over'); if (e.dataTransfer.files.length) uploadFiles([...e.dataTransfer.files]); return; }
  const r = e.target.closest && e.target.closest('.prow[data-drag]'); if (!r || !S.ui.drag) return; e.preventDefault();
  const pr = PR(), from = findNode(pr.tree, S.ui.drag), to = findNode(pr.tree, r.dataset.drag); S.ui.drag = null;
  if (!from || !to || from.n === to.n || to.parent === from.n) return render();
  from.list.splice(from.idx, 1); const to2 = findNode(pr.tree, to.n.id);
  if (!from.parent) { const tgt = to2.parent ? findNode(pr.tree, to2.parent.id) : to2; pr.tree.splice(tgt.idx, 0, from.n); } else if (!to2.parent) to2.n.kids.push(from.n); else to2.list.splice(to2.idx, 0, from.n);
  pr.dirty = true; render();
});

function bootLegacy() {
  load();
  if (typeof applyAdmin === 'function') applyAdmin();
  const h = (location.hash || '').slice(1);
  if (h === 'setup') S.view = 'wizard'; else if (h) { if (!S.cfg) S.cfg = fullConfig(); if (h === 'docs') { S.view = 'opp'; S.phase = 'pre'; S.tab = 'docs'; } else if (h === 'proposal') { S.view = 'opp'; S.phase = 'prop'; S.tab = 'pstruct'; } else if (h === 'overview') S.view = 'overview'; }

  if (Object.values(S.db.opps).some(o => o.docs.some(d => d.state === 'Processing'))) runLanes();
  window.addEventListener('resize', () => { if (document.getElementById('cadstage') && S.v.z) cadApply(); });
  render();
}
