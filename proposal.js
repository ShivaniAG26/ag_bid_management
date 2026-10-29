// Proposal workspace on live records: structure, ownership & review, draft, compliance, annexures, commercial volume, submission.

function propTemplate() {
  if (typeof rolePropTemplate === 'function') { const t = rolePropTemplate(); if (t) return t; }
  return [
    ['exec', 'Executive Summary', 'bid_manager', 'rfp', [['exec-obj', "Authority's objectives and our understanding"], ['exec-offer', 'Our offer at a glance', 'table'], ['exec-why', 'Win themes']]],
    ['comp', 'Compliance Statement and Deviations', 'bid_manager', 'rfp', [['comp-matrix', 'Compliance statement and matrix', 'table'], ['comp-clar', 'Clarifications and assumptions', 'table'], ['comp-dev', 'Proposed deviations', 'table']]],
    ['basis', 'Design Basis and Influent Characterisation', 'process', 'rfp', [['basis-crit', 'Design criteria', 'table'], ['basis-inf', 'Influent variability and site data'], ['basis-eff', 'Treated effluent standards', 'table']]],
    ['proc', 'Process Design and Guarantees', 'process', 'rfp', [['proc-train', 'Treatment train'], ['proc-tert', 'Tertiary filtration and disinfection'], ['proc-mb', 'Mass balance', 'table']]],
    ['hyd', 'Hydraulic Design and Pumping', 'process', 'rfp', [['hyd-prof', 'Hydraulic profile and outfall'], ['hyd-ips', 'Pumping stations']]],
    ['sludge', 'Sludge Management', 'process', 'pack', [['sludge-dw', 'Thickening and dewatering'], ['sludge-disp', 'Cake disposal and odour control']]],
    ['sewer', 'Pipelines, Sewers and Crossings', 'pipeline', 'rfp', [['sewer-align', 'Alignment, materials and manholes'], ['sewer-trench', 'Trenchless crossings and right-of-way'], ['sewer-rock', 'Excavation method']]],
    ['eic', 'Electrical, Automation and SCADA', 'ei', 'pack', [['eic-power', 'Power supply and distribution'], ['eic-scada', 'SCADA, analysers and regulator link']]],
    ['energy', 'Energy Efficiency and Guarantee', 'ei', 'learned', [['energy-basis', 'Guarantee basis'], ['energy-opt', 'Efficiency measures']]],
    ['prog', 'Construction Methodology and Programme', 'pd', 'rfp', [['prog-ms', 'Master programme'], ['prog-ll', 'Long-lead procurement', 'table']]],
    ['cx', 'Testing, Trial Run and PG Test', 'process', 'learned', [['cx-plan', 'Hydraulic, equipment and wet tests'], ['cx-pg', 'Performance guarantee test']]],
    ['om', 'O&M Methodology and Staffing', 'om', 'rfp', [['om-staff', 'Staffing and cost lines', 'table'], ['om-asset', 'Asset management and lifecycle replacement']]],
    ['hse', 'HSE and Quality Management', 'bid_manager', 'rfp', []],
    ['org', 'Organisation and Key Personnel', 'bid_manager', 'rfp', []],
    ['exp', 'Relevant Experience', 'bd_head', 'learned', [['exp-tab', 'Similar projects', 'table']]]
  ];
}
const FROM = { rfp: ['Mandated by ITB', 'brand'], pack: ['W&WW pack template', 'info'], learned: ['Learned from wins', 'ai'], user: ['Added by you', ''] };
function newProp(o) {
  let id = 0; const rev = own => own === 'bid_manager' ? 'bd_head' : 'bid_manager';
  const seed = o.meta.seed === 'indrayani' ? { comp: 'approved', basis: 'in_review', proc: 'draft', hyd: 'draft', sewer: 'draft', exec: 'draft' } : {};
  const mk = (k, title, own, from, type, kids, top) => ({ id: 'n' + (++id), k, title, own, rev: rev(own), from, type: type || 'text', st: top && seed[k] ? seed[k] : 'not_started', gen: false, due: '', kids: kids || [] });
  const tree = propTemplate().map(([k, t, own, from, kids]) => mk(k, t, own, from, 'text', kids.map(([kk, tt, ty]) => mk(kk, tt, own, from, ty)), true));
  tree.forEach(n => { if (seed[n.k]) { n.gen = true; n.kids.forEach(c => c.gen = true); } });
  return { tree, ver: 1, seq: id, dirty: false, versions: [{ v: 1, ts: nowTs(), by: 'bidPlan AI', note: 'Recommended from the ITB bid format and the W&WW pack template', tree: deep(tree) }], mode: 'preview', sel: tree[0].id, q: '', paras: {} };
}
function ensureProp() { const o = O(); if (!o.prop) o.prop = newProp(o); return o.prop; }
const allNodes = tree => { const a = []; tree.forEach(n => { a.push(n); n.kids.forEach(c => a.push(c)); }); return a; };
function findNode(tree, id) { for (let i = 0; i < tree.length; i++) { const n = tree[i]; if (n.id === id) return { n, parent: null, list: tree, idx: i }; for (let j = 0; j < n.kids.length; j++) if (n.kids[j].id === id) return { n: n.kids[j], parent: n, list: n.kids, idx: j }; } return null; }
function numbering(tree) { const m = {}; tree.forEach((n, i) => { m[n.id] = String(i + 1); n.kids.forEach((c, j) => m[c.id] = (i + 1) + '.' + (j + 1)); }); return m; }
const topOf = n => ensureProp().tree.find(x => x === n || x.kids.includes(n));
const canSec = n => can('prop') || topOf(n).own === S.role;
const canApprove = n => S.role === 'bid_manager' || topOf(n).rev === S.role;

function compliance() {
  const o = O(), pr = ensureProp(), nos = numbering(pr.tree);
  return o.reqs.filter(r => r.mand && r.st !== 'rejected').map(r => {
    const node = r.sec ? pr.tree.find(n => n.k === r.sec || n.id === r.sec) : null;
    const sec = node ? { node, id: nos[node.id], title: node.title, status: node.st } : null;
    const clar = r.clar && o.clars.find(c => c.id === r.clar);
    const s = !sec ? 'unmapped' : clar && clar.status !== 'answered' ? 'clarification' : sec.status === 'approved' ? 'compliant' : 'drafting';
    return { r, sec, s };
  });
}

/* drafting: rich text for the seeded tender; record-driven text for every tender */
const kb = (id, sec, sim, note) => ({ id, sec, sim, note });
const kbBtn = k => { const p = PAST[k.id]; return `<button class="kbsrc" data-a="kb" data-id="${k.id}" data-sec="${esc(k.sec)}" data-note="${esc(k.note)}" data-sim="${k.sim}">${IC.book}${k.id} ${esc(k.sec)} · ${p ? p.res.toLowerCase() : ''}</button>`; };
const P_ = (t, src, kbs, flag) => ({ t, src: src || [], kb: kbs || [], st: 'proposed', flag: flag || '' });
const TB = (head, rows) => ({ table: `<div class="tw"><table class="t"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${head.length}" class="sub">No records yet.</td></tr>`}</tbody></table></div>` });
function recTables(k) {
  if (typeof roleRecTables === 'function') { const rr = roleRecTables(k); if (rr) return rr; }
  const o = O();
  return {
    'comp-matrix': () => TB(['Req', 'Requirement', 'Response section', 'Status'], compliance().map(x => [`<span class="mono">${x.r.id}</span>`, esc(x.r.text), x.sec ? esc(x.sec.id + ' ' + x.sec.title) : '—', st(x.s)])),
    'comp-clar': () => TB(['Ref', 'Clarification', 'Status'], o.clars.map(c => [`<span class="mono">${c.id}</span>`, esc(c.q), st(c.status)])),
    'comp-dev': () => TB(['Ref', 'Clause', 'Proposed alternative', 'Status'], o.devs.map(d => [`<span class="mono">${d.id}</span>`, esc(d.clause), esc(d.text), st(d.status)])),
    'basis-crit': () => TB(['Criterion', 'Value', 'Status'], o.basis.map(b => [esc(b.f), `<b>${esc(b.v)}</b>`, st(b.st)])),
    'prog-ll': () => TB(['Item', 'Lead (weeks)', 'Need-by month', 'Order by month', 'Float'], o.longlead.map(l => { const f = llFloat(l); return [esc(l.item), l.lead, l.need, l.order, `<span style="color:${f < 0 ? 'var(--bad)' : f < 2 ? 'var(--warn)' : 'var(--ok)'}">${f > 0 ? '+' : ''}${f} mo</span>`]; })),
    'om-staff': () => TB(['O&M cost line (no prices in envelope A)'], o.om.map(r => [esc(r.item.replace(/\(.*?\)/, '').trim())])),
    'exp-tab': () => TB(['Project', 'Capacity', 'Year', 'Outcome'], Object.values(PAST).filter(p => p.res === 'Won').map(p => [esc(p.name), p.mld + ' MLD', p.yr, '<span class="chip ok">Delivered</span>']))
  }[k];
}
function draftGen(n) {
  const o = O(), m = o.meta, rt = recTables(n.k);
  if (rt) return [rt()];
  if (m.seed === 'indrayani' && SEEDTEXT[n.k]) return SEEDTEXT[n.k]();
  const top = topOf(n), reqs = compliance().filter(c => c.sec && c.sec.node.id === top.id).map(c => c.r);
  if (!top || top === n) {
    const ps = [P_(`This section sets out our approach to ${n.title.toLowerCase()} for ${m.name}, for ${m.client}.`, reqs.slice(0, 2).map(r => r.src).filter(Boolean))];
    reqs.forEach(r => ps.push(P_(`We comply with ${r.id}: ${r.text.replace(/\.$/, '')}.${r.clar ? ` Our reading is subject to ${r.clar}.` : ''}`, [r.src].filter(Boolean))));
    if (!reqs.length) ps[0].flag = 'No mandatory requirement is mapped to this section yet. Map requirements in Tender Intelligence → Requirements.';
    return ps;
  }
  const kw = { 'basis-inf': /flow|bod|cod|tss|raw|influent/i, 'proc-train': /process|sbr|mbbr|asp|treat|basin|aerat/i, 'proc-tert': /filter|disinfect|chlor|tertiary|uv/i, 'hyd-prof': /hydraul|level|outfall|hfl/i, 'hyd-ips': /pump/i, 'sludge-dw': /sludge|dewater|ds/i, 'sewer-align': /pipe|sewer|manhole/i, 'sewer-trench': /trench|crossing|row|right/i, 'energy-basis': /energy|kwh/i, 'eic-scada': /scada|analy|plc/i, 'cx-pg': /test|guarantee/i, 'prog-ms': /month|programme|completion|cod/i }[n.k];
  const basis = kw ? o.basis.filter(b => kw.test(b.f + ' ' + b.v)) : [], rs = kw ? o.reqs.filter(r => kw.test(r.text)) : [];
  if (!basis.length && !rs.length) return [P_(`${n.title}: no design basis value or requirement on this tender relates to this sub-section yet. The writer will draft it once those records exist.`, [], [], 'Partial: no tender evidence supports this sub-section yet.')];
  const out = [];
  if (basis.length) out.push(P_(`Design basis applied: ${basis.map(b => `${b.f} ${b.v}`).join('; ')}.`, basis.map(b => b.src).filter(Boolean), [], basis.some(b => b.st === 'proposed') ? 'Some design basis values are still Proposed. Accept them before approval.' : ''));
  rs.slice(0, 3).forEach(r => out.push(P_(`${r.text.replace(/\.$/, '')}: our design meets this requirement.`, [r.src].filter(Boolean))));
  return out;
}
const SEEDTEXT = {
  exec: () => [P_(`${S.cfg.company.replace(' Pvt Ltd', '')}, leading a joint venture with Aquaprocess Technologies (74:26), submits this technical bid to Indrayani Municipal Corporation for the 200 MLD sewage treatment plant, 14.2 km trunk sewer and two intermediate pumping stations under the Hybrid Annuity Model, with fifteen years of operation and maintenance.`, ['itb:2:NIT'], [kb('PB-2021-04', '§1', 0.81, 'Executive summary structure; evaluator 9/10')])],
  'exec-obj': () => [P_('We read three priorities in this tender: treated effluent that meets BOD below 10 mg/l from the first day of the PG test; a plant that holds 0.21 kWh/m³ for fifteen years; and a trunk sewer built without disrupting State Highway 55.', ['c1:1:§1', 'v2:302:§11.4', 'v2:214:§7.6'])],
  'exec-offer': () => [TB(['Item', 'Our offer'], [['Design flow', '200 MLD average · 450 MLD peak'], ['Secondary treatment', 'SBR, 4 basins × 27,000 m³'], ['Tertiary', '4 disc filters × 50 MLD, then chlorine contact'], ['Treated effluent', 'BOD < 10 · TSS < 10 mg/l · FC < 100 MPN'], ['Trunk sewer', '14.2 km DI K9 / MS epoxy, 142 manholes'], ['Energy', '≤ 0.21 kWh/m³'], ['Price', 'In envelope B only (envelope guard)']])],
  'exec-why': () => [P_('We have operated the Vadodara 150 MLD SBR plant since 2021 and met its discharge consent in 58 of 60 months.', [], [kb('PB-2021-04', '§12', 0.9, 'Reference project; won, evaluator 89/100')]), P_('We found the rock between ch 2+100 and 3+400 in the bore logs and planned for it now.', ['geo:66:BH-07'], [kb('PB-2023-02', '§7.3', 0.76, 'Lesson: rock claim lost 4 months on Rajkot')])],
  'basis-inf': () => { const c = O().clars.find(x => x.id === 'PBQ-03'), ans = c && c.status === 'answered'; return [P_(`Twelve months of data from the existing Pimpri STP show a mean raw BOD of 271 mg/l, against 200 mg/l in Vol II §3.1. ${ans ? 'The Authority answered PBQ-03: ' + (c.a || 'tender value confirmed') + '. We keep 18% blower headroom.' : 'We have raised PBQ-03 and sized the blowers with 18% headroom.'}`, ['v2:42:§3.1', 'raw:1:Summary'], [], ans ? '' : 'Consistency agent: PBQ-03 is unanswered. Keep the qualification until the Authority replies.')]; },
  'basis-eff': () => [TB(['Parameter', 'Raw', 'Treated', 'Standard'], PROCESS.map(p => [p[0], p[1], `<b>${p[2]}</b>`, p[3]]))],
  'proc-train': () => [P_('Four SBR basins of 27,000 m³ each (50 × 90 m, 6.0 m side water depth) run in parallel on a 4-hour cycle.', ['v2:44:§3.2.1', 'dwg:C-120'], [kb('PB-2021-04', '§4.2', 0.84, 'SBR cycle narrative; evaluator 9/10')]), P_('Tender drawing P-001 shows six basins. Vol II governs under ITB §1.4, so we offer four.', ['dwg:P-001', 'itb:3:§1.4'])],
  'proc-tert': () => [P_('Four disc filters of 50 MLD polish the SBR effluent to TSS below 10 mg/l ahead of a 30-minute chlorine contact tank.', ['c1:1:§2'])],
  'hyd-prof': () => { const c = O().clars.find(x => x.id === 'PBQ-07'); return [P_('The hydraulic grade falls from 552.40 m RL at the inlet chamber to 546.10 m at the outfall. We propose raising the outfall by 0.25 m and fitting a flap gate.', ['dwg:P-010', 'v2:44:§3.2.4'], [], c && c.status === 'answered' ? '' : 'Open: PBQ-07 is not yet answered.')]; },
  'sewer-trench': () => { const c = O().clars.find(x => x.id === 'PBQ-04'); return [P_(`All crossings of State Highway 55 are by microtunnelling. ${c && c.status === 'answered' ? 'Right-of-way: ' + (c.a || 'confirmed by the Authority') + '.' : 'Right-of-way along the highway is the subject of PBQ-04; our programme assumes Month 4.'}`, ['v2:214:§7.6.2', 'dwg:L-201'], [kb('PB-2023-02', '§7', 0.8, 'Rajkot: 5-month ROW delay')])]; },
  'sewer-rock': () => { const b = O().boq.find(x => x.code === 'B-7.15'); return [P_(`Bore logs BH-07 to BH-11 show weathered basalt from 2.1 m below ground between ch 2+100 and 3+400. We have allowed for ${b ? fmtN(b.ours) : '18,400'} m³ of rock against ${b ? fmtN(b.client) : '11,200'} m³ in Schedule B.`, ['geo:66:BH-07', 'boq:3:B-7.15'])]; },
  'energy-basis': () => { const k = CALC.compute(O().calc).kpis[2][1]; return [P_(`We guarantee at most 0.21 kWh/m³ at the 22 kV incomer over the 90-day PG test. At the current design basis the plant uses ${k}.`, ['v2:302:§11.4'], [kb('PB-2021-04', '§9', 0.77, 'Vadodara achieved 0.19 kWh/m³')], parseFloat(k) > 0.21 ? `Figure check: the calculator gives ${k}, above the guarantee.` : '')]; }
};
function draftParas(n) { const pr = ensureProp(); if (!n.gen) return null; const rt = recTables(n.k); if (rt) return [rt()]; if (!pr.paras[n.id]) pr.paras[n.id] = draftGen(n); return pr.paras[n.id]; }
const paraWords = ps => (ps || []).reduce((a, p) => a + (p.t ? p.t.split(/\s+/).length : 60), 0);
const nodeWords = n => paraWords(draftParas(n)) + n.kids.reduce((a, c) => a + paraWords(draftParas(c)), 0);
function propHead(title, eb, sub, right) { return `<div class="stagehead"><div class="stack" style="gap:4px"><span class="eyebrow">${eb}</span><h2>${title}</h2>${sub ? `<span class="sub">${sub}</span>` : ''}</div><div class="row">${right || ''}</div></div>`; }

/* --- structure --- */
function mPStruct() {
  const pr = ensureProp(), nos = numbering(pr.tree), q = (pr.q || '').toLowerCase(), cm = compliance(), ed = can('prop');
  const from = {}; allNodes(pr.tree).forEach(n => from[n.from] = (from[n.from] || 0) + 1);
  const reqN = n => cm.filter(c => c.sec && c.sec.node.id === n.id).length;
  const row = (n, parent, i, list) => {
    const top = !parent, ren = S.ui.pren === n.id, del = S.ui.pdel === n.id;
    if (del) return `<div class="prow ${top ? 'top' : 'sub'}" style="background:var(--bad-soft)"><span class="pt" style="font-weight:400">Delete <b>${esc(nos[n.id] + ' ' + n.title)}</b>?${reqN(n) ? ` <span class="chip bad">${reqN(n)} requirements become unmapped</span>` : ''}</span><button class="btn sm bad" data-a="pdelok" data-id="${n.id}">Delete</button><button class="btn sm" data-a="pdelno">Cancel</button></div>`;
    return `<div class="prow ${top ? 'top' : 'sub'}" data-drag="${n.id}" draggable="${ed && !ren ? 'true' : 'false'}">${ed ? `<span class="grip" aria-hidden="true">${IC.grip}</span>` : ''}
     ${ren ? `<input type="text" class="ren" id="pren-${n.id}" value="${esc(n.title)}" data-c="pren" data-id="${n.id}" aria-label="Section title">` : `<span class="pt"><span class="pno">${nos[n.id]}</span>${esc(n.title)}</span>`}
     ${n.type === 'table' ? '<span class="chip">Table</span>' : ''}${top ? `<span class="chip ${FROM[n.from][1]}">${FROM[n.from][0]}</span>` : ''}${top && reqN(n) ? `<span class="chip">${reqN(n)} reqs</span>` : ''}${top ? roleChip(n.own) : ''}
     ${ed ? `<span class="acts">${top ? `<button class="ibtn" data-a="padd" data-id="${n.id}" title="Add sub-section" aria-label="Add sub-section">${IC.plus}</button>` : ''}<button class="ibtn" data-a="pmove" data-id="${n.id}" data-v="-1" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${IC.up}</button><button class="ibtn" data-a="pmove" data-id="${n.id}" data-v="1" aria-label="Move down" ${i === list.length - 1 ? 'disabled' : ''}>${IC.down}</button><button class="ibtn" data-a="pren" data-id="${n.id}" aria-label="Rename">${IC.pen}</button><button class="ibtn del" data-a="pdel" data-id="${n.id}" aria-label="Delete">${IC.trash}</button></span>` : ''}</div>`;
  };
  const tree = pr.tree.filter(n => !q || n.title.toLowerCase().includes(q) || n.kids.some(c => c.title.toLowerCase().includes(q))).map((n, i) => row(n, null, i, pr.tree) + n.kids.map((c, j) => row(c, n, j, n.kids)).join('')).join('');
  const sug = S.ui.psug, presets = ['Follow the section order in the ITB', 'Add a biogas and sludge-to-energy section', 'Move Relevant Experience after the Executive Summary', 'Merge HSE into a Quality and HSE section', 'Add a risk management section'];
  return `${propHead('Build the proposal index before drafting', 'Proposal structure · version ' + pr.ver + (pr.dirty ? ' · unsaved changes' : ''), 'bidPlan recommends a structure; the bid manager reorders, renames and adds sections before drafting.', ed ? `<button class="btn" data-a="padd">${IC.plus}Add section</button><button class="btn pri" data-a="tab" data-t="pdraft">${IC.doc}Open draft</button>` : '')}
  ${permBar('prop')}
  ${typeof paStructure === 'function' ? paStructure() : ''}
  <div class="grid g-side"><div class="stack">
   <div class="panel"><div class="ph"><input type="search" id="ps-q" placeholder="Search sections…" value="${esc(pr.q || '')}" data-i="psq" style="max-width:320px" aria-label="Search sections"><div class="row">${pr.dirty && ed ? `<button class="btn sm pri" data-a="psave">Save as version ${pr.ver + 1}</button>` : ''}<label class="row" for="pver" style="gap:6px;font-size:13px;color:var(--ink-2)">Version<select id="pver" data-c="pver" style="width:auto">${pr.versions.map(v => `<option value="${v.v}" ${v.v === pr.ver ? 'selected' : ''}>v${v.v} · ${esc(v.by)}</option>`).join('')}</select></label></div></div>
    <div class="ptree">${tree}</div></div></div>
  <div class="stack">
   ${ed ? `<div class="panel"><div class="ph"><h3>Iterate with bidPlan</h3>${IC.spark}</div><div class="pb stack"><label class="fld" for="ps-ins">Tell bidPlan how to change the structure<textarea id="ps-ins" placeholder="e.g. Add a risk management section">${esc(S.ui.pins || '')}</textarea></label><div class="sugg">${presets.map(p => `<button data-a="ppreset" data-v="${esc(p)}">${esc(p)}</button>`).join('')}</div><button class="btn ai" data-a="psuggest">${IC.spark}Suggest revision</button></div></div>` : ''}
   ${sug ? `<div class="panel" style="border-color:var(--ai)"><div class="ph"><h3>Suggested revision</h3><span class="chip ai">Proposed</span></div><div class="pb stack"><span class="sub">${esc(sug.note)}</span><div class="stack" style="gap:4px;font-size:13px">${sug.diff.map(d => `<span class="diff-${d[0]}">${{ add: '+ Added', mov: '↕ Moved', ren: '✎ Renamed' }[d[0]]}: ${esc(d[1])}</span>`).join('')}</div><div class="row"><button class="btn pri" data-a="papply">Apply as version ${pr.ver + 1}</button><button class="btn" data-a="pdiscard">Discard</button></div></div></div>` : ''}
   <div class="panel"><div class="ph"><h3>Structure checks</h3></div><div class="pb stack" style="gap:9px"><div class="row between"><span>Mandatory requirements mapped</span>${cm.filter(c => !c.sec).length ? `<span class="chip bad">${cm.filter(c => !c.sec).length} unmapped</span>` : `<span class="chip ok">${cm.length} / ${cm.length}</span>`}</div><div class="row between"><span>Sections / sub-sections</span><span class="mono">${pr.tree.length} / ${allNodes(pr.tree).length - pr.tree.length}</span></div><div class="row between"><span>Estimated length</span><span class="mono">${Math.round(allNodes(pr.tree).length * 7.5)} / 400 pages</span></div></div></div>
   <div class="panel"><div class="ph"><h3>Version history</h3></div><div class="pb flush">${pr.versions.slice().reverse().map(v => `<div class="flag"><div class="sev ${v.by === 'bidPlan AI' ? 'ai' : 'pass'}"></div><div class="body"><div class="row between"><b>v${v.v}</b><span class="mono sub">${v.ts}</span></div><span class="sub">${esc(v.by)} · ${esc(v.note)}</span></div></div>`).join('')}</div></div></div></div>`;
}
function suggestRevision(ins) {
  const pr = ensureProp(), tr = deep(pr.tree), i = ins.toLowerCase(), diff = []; let note = ''; const ix = k => tr.findIndex(n => n.k === k);
  const mv = (k, to) => { const a = ix(k); if (a < 0 || a === to) return; const [n] = tr.splice(a, 1); tr.splice(Math.min(to, tr.length), 0, n); diff.push(['mov', `${n.title} → position ${Math.min(to, tr.length - 1) + 1}`]); };
  const mk = (title, own, from) => ({ id: 'n' + (++pr.seq), k: null, title, own: own || 'bid_manager', rev: 'bid_manager', from: from || 'learned', type: 'text', st: 'not_started', gen: false, due: '', kids: [] });
  const add = (pk, title, from) => { const p = tr.find(n => n.k === pk); const n = mk(title, p && p.own, from); if (p) { p.kids.push(n); diff.push(['add', `${title} (under ${p.title})`]); } else { tr.push(n); diff.push(['add', title]); } };
  if (/itb|order|evaluat/.test(i)) { note = 'Reordered to the mandated ITB order; pack and learned sections sit next to the section they support.'; ['exec', 'comp', 'basis', 'proc', 'energy', 'sludge', 'hyd', 'sewer', 'eic', 'prog', 'cx', 'om', 'hse', 'org', 'exp'].forEach((k, j) => mv(k, j)); }
  else if (/biogas|sludge-to/.test(i)) { note = 'Adds biogas content; evaluators reward energy recovery on large plants.'; add('sludge', 'Anaerobic digestion and biogas option'); add('energy', 'Energy recovery offset against the guarantee'); }
  else if (/experience/.test(i)) { note = 'Leads with proof: winning proposals placed experience after the summary.'; mv('exp', 1); }
  else if (/merge|hse|quality/.test(i)) { note = 'Combines HSE and quality with a sub-section for each.'; const h = tr.find(n => n.k === 'hse'); if (h) { diff.push(['ren', `${h.title} → Quality, Health, Safety and Environment`]); h.title = 'Quality, Health, Safety and Environment'; add('hse', 'Quality plan and ITPs', 'rfp'); add('hse', 'Confined space and deep trench safety', 'rfp'); } }
  else { note = 'Adds a risk management section after the programme.'; const n = mk('Risk Management Approach', 'commercial'); tr.splice(Math.max(0, ix('prog') + 1), 0, n); diff.push(['add', 'Risk Management Approach']); }
  if (!diff.length) diff.push(['mov', 'Structure already follows this instruction']);
  return { tree: tr, diff, note, ins };
}

/* --- ownership & review --- */
function mPOwn() {
  const pr = ensureProp(), nos = numbering(pr.tree), cm = compliance(), tops = pr.tree, ed = can('prop');
  const cnt = s => tops.filter(n => n.st === s).length, words = tops.reduce((a, n) => a + nodeWords(n), 0);
  const roles = Object.keys(ROLES).filter(k => k !== 'exec');
  const sel = (n, f, id) => ed && n.st !== 'approved' ? `<select id="${id}" data-c="${f}" data-id="${n.id}" style="width:auto;max-width:190px">${roles.map(r => `<option value="${r}" ${n[f === 'powner' ? 'own' : 'rev'] === r ? 'selected' : ''}>${ROLES[r].name} · ${ROLES[r].title}</option>`).join('')}</select>` : roleChip(n[f === 'powner' ? 'own' : 'rev']);
  const next = n => {
    const mine = canSec(n), ap = canApprove(n);
    return ({ not_started: mine ? `<button class="btn sm ai" data-a="pgen" data-id="${n.id}">${IC.spark}Generate draft</button>` : '<span class="sub">Owner drafts</span>', draft: mine ? `<button class="btn sm" data-a="pstat" data-id="${n.id}" data-v="in_review">Submit for review</button>` : '<span class="sub">Owner editing</span>', in_review: ap ? `<button class="btn sm ok" data-a="pstat" data-id="${n.id}" data-v="approved">Approve</button> <button class="btn sm" data-a="pstat" data-id="${n.id}" data-v="draft">Return</button>` : `<span class="sub">Waiting for ${esc(ROLES[n.rev].name)}</span>`, approved: `${IC.lock}${ap ? ` <button class="btn sm ghost" data-a="pstat" data-id="${n.id}" data-v="draft">Re-open</button>` : ''}` })[n.st];
  };
  return `${propHead('Ownership and review', 'Proposal workspace · tech', 'Each section has an owner who drafts it and a reviewer who approves it. Switch role to act as an owner or reviewer.', ed ? `<button class="btn ai" data-a="pgen" data-id="all">${IC.spark}Generate all remaining</button><button class="btn" data-a="pbulk">Submit all drafts for review</button>` : '')}
  ${permBar('prop')}
  ${(() => {
    /* The admin console's KPI card: an icon tile, the label, the figure and a sub-line. */
    const mine = tops.filter(n => n.own === S.role).length, waiting = tops.filter(n => n.st === 'in_review' && n.rev === S.role).length;
    const pct = tops.length ? Math.round(cnt('approved') / tops.length * 100) : 0;
    const card = (ic, cls, l, v, d, viz) => `<article class="akpi ${cls}"><div class="akpi-h"><span class="akpi-ic">${ic}</span><span class="akpi-l">${l}</span></div><div class="akpi-v">${v}</div><div class="akpi-f"><span class="akpi-d">${d}</span>${viz || ''}</div></article>`;
    return `<div class="akpis">
    ${card(IC.check, cnt('approved') === tops.length && tops.length ? 'ok' : '', 'Approved', `${cnt('approved')} <small>/ ${tops.length}</small>`, `${pct}% of the volume signed off`, `<span class="meter" role="img" aria-label="${pct}% approved"><i style="width:${pct}%"></i></span>`)}
    ${card(IC.eye, waiting ? 'warn' : '', 'In review', String(cnt('in_review')), waiting ? `${waiting} waiting on you` : 'None with you')}
    ${card(IC.pen, '', 'Drafting', String(cnt('draft')), mine ? `${mine} section${mine === 1 ? '' : 's'} owned by you` : 'None owned by you')}
    ${card(IC.doc, '', 'Words drafted', fmtN(words), `Across ${tops.length} top-level sections`)}
  </div>`;
  })()}
  <div class="panel"><div class="tw"><table class="t"><thead><tr><th>No.</th><th>Section</th><th>Owner</th><th>Reviewer</th><th>Due</th><th class="num">Reqs</th><th>Status</th><th></th></tr></thead><tbody>${tops.map(n => `<tr class="${n.own === S.role || n.rev === S.role ? 'mine' : ''}"><td class="mono">${nos[n.id]}</td><td><b>${esc(n.title)}</b><div class="sub">${n.kids.length} sub-sections</div></td><td>${sel(n, 'powner', 'po-' + n.id)}</td><td>${sel(n, 'preview', 'pr-' + n.id)}</td><td>${ed ? `<input type="date" id="pd-${n.id}" value="${n.due}" data-c="pdue" data-id="${n.id}" style="width:150px">` : esc(n.due || '—')}</td><td class="num mono">${cm.filter(c => c.sec && c.sec.node.id === n.id).length || '—'}</td><td>${st(n.st)}</td><td style="white-space:nowrap">${next(n)}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="note"><div>Rows with an olive edge are yours as ${esc(R().title)}. Approval needs the section's reviewer or the bid manager; agents cannot approve.</div></div>`;
}

/* --- draft --- */
function mPDraft() {
  const pr = ensureProp(), nos = numbering(pr.tree), q = (S.ui.pdq || '').toLowerCase(), o = O();
  const sel = findNode(pr.tree, pr.sel) || findNode(pr.tree, pr.tree[0].id), all = allNodes(pr.tree), done = all.filter(n => n.gen).length;
  const dotc = n => { const t = topOf(n); return t.st === 'approved' ? 'ok' : t.st === 'in_review' ? 'rev' : n.gen ? 'gen' : ''; };
  const idx = pr.tree.map(n => [n, ...n.kids]).flat().filter(n => !q || n.title.toLowerCase().includes(q)).map(n => `<button class="it ${pr.tree.includes(n) ? '' : 'sub'} ${sel && sel.n.id === n.id ? 'on' : ''}" data-a="psel" data-id="${n.id}"><span class="sdot ${dotc(n)}"></span><span>${nos[n.id]} ${esc(n.title)}</span></button>`).join('');
  const paraHtml = (n, ps, edit) => typeof edBlocks === 'function' ? edBlocks(n, ps, edit) : ps.map((p, i) => p.table ? p.table : `<div class="stack" style="gap:4px"><div class="dpara ${p.st}" ${edit ? `contenteditable="true" data-i="ppara" data-n="${n.id}" data-ix="${i}" role="textbox" aria-label="Paragraph ${i + 1}"` : ''}>${esc(p.t)}</div>${edit || p.st !== 'accepted' ? `<div class="dmeta">${p.src.map(src).join('')}${p.kb.map(kbBtn).join('')}${p.st === 'proposed' ? `<span class="chip ai">Proposed</span>${edit ? `<button class="btn sm ok" data-a="pacc" data-n="${n.id}" data-ix="${i}">Accept</button>` : ''}` : p.st === 'edited' ? '<span class="chip info">Edited</span>' : ''}</div>` : ''}${p.flag ? `<div class="note warn" style="padding:6px 10px;font-size:12.5px"><div>${esc(p.flag)}</div></div>` : ''}</div>`).join('');
  const secMenu = n => `<div class="secmenu"><button class="ibtn" data-a="pmenu" data-id="${n.id}" aria-label="Section actions">${IC.dots}</button>${S.ui.pmenu === n.id ? `<div class="mlist" role="menu"><button data-a="pregen" data-id="${n.id}" data-v="regen">Regenerate from current records</button><button data-a="pregen" data-id="${n.id}" data-v="concise">Make it more concise</button><button data-a="pregen" data-id="${n.id}" data-v="evidence">Strengthen with past-project evidence</button><button data-a="pregen" data-id="${n.id}" data-v="para">Add a paragraph</button></div>` : ''}</div>`;
  const block = (n, top, edit) => { const ps = draftParas(n), H = top ? 'h3' : 'h4', lock = topOf(n).st === 'approved' || !canSec(n); return `<div class="dsec" id="sec-${n.id}"><div class="row between" style="align-items:flex-start;flex-wrap:nowrap"><div class="stack" style="gap:2px">${top ? '<span class="eyebrow">Section</span>' : ''}<${H}>${nos[n.id]} ${esc(n.title)}</${H}></div><div class="row" style="flex-wrap:nowrap">${top ? st(n.st) + ' ' + roleChip(n.own) : ''}${n.gen && !lock ? secMenu(n) : ''}</div></div>${ps ? paraHtml(n, ps, edit && !lock) : `<div class="note"><div class="row between" style="width:100%"><span class="sub">Not drafted yet.</span>${canSec(n) ? `<button class="btn sm ai" data-a="pgen" data-id="${n.id}">${IC.spark}Generate</button>` : `<span class="sub">${esc(ROLES[topOf(n).own].name)} drafts this</span>`}</div></div>`}</div>`; };
  let body;
  if (pr.mode === 'preview') body = pr.tree.map(n => block(n, true, false) + n.kids.map(c => block(c, false, false)).join('')).join('');
  else { const n = sel.n, top = !sel.parent; body = block(n, top, true) + (top ? n.kids.map(c => block(c, false, true)).join('') : ''); const reqs = compliance().filter(c => c.sec && c.sec.node.id === topOf(n).id); body += `<div class="panel" style="margin-top:18px"><div class="ph"><h3>Requirements answered here</h3><span class="chip">${reqs.length}</span></div><div class="pb flush">${reqs.map(c => `<div class="flag"><div class="sev ${c.s === 'compliant' ? 'pass' : 'medium'}"></div><div class="body"><span class="mono muted" style="font-size:12px">${c.r.id} ${src(c.r.src)}</span><span class="sub">${esc(c.r.text)}</span></div>${st(c.s)}</div>`).join('') || '<div class="empty"><p>No mandatory requirement maps here. Map them from the Requirements screen.</p></div>'}</div></div>`; }
  const sn = topOf(sel.n);
  return `${propHead('Proposal draft', 'Proposal workspace · tech · envelope A', 'Drafts are built from this tender\'s records. Change a record (a requirement, a design basis value, an answered query) and regenerate to see the text follow.', `<button class="btn sm" data-a="pexport">${IC.dl}Export</button><button class="btn ai" data-a="asst">${IC.spark}Ask Advisor</button>`)}
  <div class="pdraft"><aside class="panel pidx" aria-label="Proposal index"><div class="ph"><h3>Proposal index</h3><span class="mono sub">${done}/${all.length}</span></div><div class="pb stack" style="gap:8px;padding-bottom:6px"><div class="seg" style="display:flex"><button class="${pr.mode === 'preview' ? 'on' : ''}" data-a="pmode" data-v="preview" style="flex:1;text-align:center">Preview</button><button class="${pr.mode === 'selected' ? 'on' : ''}" data-a="pmode" data-v="selected" style="flex:1;text-align:center">Edit selected</button></div><input type="search" id="pd-q" placeholder="Search sections…" value="${esc(S.ui.pdq || '')}" data-i="pdq" aria-label="Search sections"></div><div class="list">${idx}</div></aside>
   <article class="doc"><div class="dhd"><div class="stack" style="gap:3px"><span class="eyebrow">Technical bid · envelope A${pr.mode === 'selected' ? ' · editing ' + nos[sel.n.id] : ''}</span><h2>${esc(o.meta.name)}</h2><span class="sub">Technical proposal to ${esc(o.meta.client)} · ${esc(S.cfg.company)}</span></div><div class="row">${pr.mode === 'selected' && sel.n.gen ? (sn.st === 'draft' && canSec(sn) ? `<button class="btn sm" data-a="pstat" data-id="${sn.id}" data-v="in_review">Submit for review</button>` : sn.st === 'in_review' && canApprove(sn) ? `<button class="btn sm ok" data-a="pstat" data-id="${sn.id}" data-v="approved">Approve section</button>` : '') : ''}</div></div><div class="dbd">${body}</div></article></div>`;
}

/* --- compliance --- */
function mPComp() {
  const cm = compliance(), n = s => cm.filter(c => c.s === s).length;
  return `${propHead('Compliance matrix', 'Proposal workspace · tech', 'Built live from every mandatory requirement and the section that answers it. Add a requirement or approve a section and this matrix updates.', '')}
  <div class="grid g4">${[['Mandatory', cm.length], ['Compliant', n('compliant')], ['Clarification pending', n('clarification')], ['Unmapped', n('unmapped')]].map(k => `<div class="panel kpi"><span class="eyebrow">${k[0]}</span><span class="v">${k[1]}</span></div>`).join('')}</div>
  ${typeof paCompSummary === 'function' ? `<div class="row" style="margin:2px 0 10px">${paCompSummary()}</div>` : ''}
  <div class="panel"><div class="tw"><table class="t"><thead><tr><th>Req</th><th>Requirement</th><th>Source</th><th>Response section</th><th>Status</th></tr></thead><tbody>${cm.map(c => `<tr><td class="id">${c.r.id}</td><td>${esc(c.r.text)}${typeof paCompCell === 'function' ? paCompCell(c) : ''}</td><td>${src(c.r.src)}</td><td>${can('reqs') ? qsel('reqs', c.r, 'sec', [['', 'Not mapped'], ...ensureProp().tree.map((t, i) => [t.k || t.id, `${i + 1}. ${t.title}`])]) : c.sec ? esc(c.sec.id + ' ' + c.sec.title) : '<span class="chip bad">Unmapped</span>'}</td><td>${st(c.s)}</td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">No mandatory requirements yet. Add them in Tender Intelligence → Requirements.</div></td></tr>'}</tbody></table></div></div>`;
}
function mPAnn() {
  const o = O();
  return `${propHead('Technical annexures', 'Proposal workspace · tech', 'Data sheets come from the levelled supplier quotes; drawings from the tender set.', '')}
  ${typeof paAnnex === 'function' ? paAnnex() : ''}
  <div class="grid g2"><div class="panel"><div class="ph"><h3>Guaranteed technical particulars</h3></div><div class="pb flush">${o.lev.sups.length ? o.lev.sups.map(s => `<div class="flag"><div class="sev ${o.lev.award === s.id ? 'pass' : 'ai'}"></div><div class="body"><b>${esc(s.name)}</b><span class="sub">${esc(o.lev.pkg || 'Package')} · ${esc(s.comp)} · lead ${s.lead} weeks</span></div>${o.lev.award === s.id ? '<span class="chip ok">Awarded: GTP ready</span>' : '<span class="chip">Not selected</span>'}</div>`).join('') : '<div class="empty"><p>No supplier quotes yet. Procurement adds them in Tender Intelligence → Quotes.</p></div>'}</div></div>
  <div class="panel"><div class="ph"><h3>Drawings and calculations</h3></div><div class="pb flush">${[...o.docs.filter(d => d.kind === 'img' || d.kind === 'dwg').map(d => `<div class="flag"><div class="sev pass"></div><div class="body"><b>${esc(d.name)}</b><span class="sub">${d.id}</span></div><button class="btn sm" data-a="opendoc" data-id="${d.id}">View</button></div>`), ...o.runs.map(r => `<div class="flag"><div class="sev ai"></div><div class="body"><b>Process calculation run #${r.n}</b><span class="sub">${esc(r.sum)} · ${esc(r.ts)}</span></div></div>`)].join('') || '<div class="empty"><p>Upload drawings or save a calculator run to list them here.</p></div>'}</div></div></div>`;
}

/* --- commercial (envelope B) --- */
const wpTotal = r => num(r.lab) + num(r.mat) + num(r.sub);
function mktEffect() { const o = O(); return o.market.reduce((a, m) => { const w = o.est.find(e => e.wp === m.wp); return a + (w ? wpTotal(w) * num(m.adj) / 100 : 0); }, 0); }
function estTotals() { const o = O(), direct = o.est.reduce((a, r) => a + wpTotal(r), 0), cont = o.risks.filter(r => r.treat === 'Price').reduce((a, r) => a + expo(r), 0), mkt = mktEffect(), add = cont + mkt + o.adders.reduce((a, r) => a + num(r.val), 0), m = o.margin != null ? o.margin : (SCENS.find(s => s[0] === o.scen) || SCENS[1])[1], cost = direct + add, price = direct ? cost / (1 - m / 100) : 0; return { direct, cont, mkt, add, cost, m, price }; }
function omSchedule() { const o = O(), base = o.om.reduce((a, r) => a + num(r.cost), 0); const yrs = Array.from({ length: 15 }, (_, i) => base * Math.pow(1 + num(o.omEsc) / 100, i)); return { base, yrs, npv: yrs.reduce((a, v, i) => a + v / Math.pow(1.1, i + 1), 0) }; }
function mPComm() {
  if (typeof roleComm === 'function') { const rc = roleComm(); if (rc) return rc; }
  if (!can('envB')) return `${propHead('Commercial volume', 'Proposal workspace · commercial · envelope B', '', '')}<div class="panel"><div class="empty">${IC.lock}<h3>Envelope B is restricted</h3><p>Prices are visible to ${esc(PERM.envB.r.map(r => ROLES[r].title).join(', '))}. ${esc(R().title)} cannot open it.</p><button class="btn" data-a="role" data-r="commercial">Act as ${esc(ROLES.commercial.name)}</button></div></div>`;
  const o = O(), g2 = gateSigned('G2'), e = estTotals(), om = omSchedule(), P = e.price, mx = Math.max(1, ...om.yrs);
  return `${propHead('Commercial volume', 'Proposal workspace · commercial · envelope B', 'Rendered from the estimate; locked when G2 is signed.', `<button class="btn" data-a="tab" data-t="est">Open estimate</button>`)}
  <div class="note warn"><div>${IC.lock} <b>Envelope guard.</b> Envelope A and every outgoing message are scanned for prices, and a supplier RFQ carrying one is blocked. ${(() => { const s = envelopeAScan(); return s.findings.length ? `<b>${s.findings.length} to clear in envelope A.</b> <button class="linkbtn" data-a="tab" data-t="psub">Open the report</button>` : s.paras ? `Envelope A is clear across ${s.paras} drafted paragraph${s.paras === 1 ? '' : 's'}.` : 'Nothing drafted in envelope A yet.'; })()}</div></div>
  ${typeof paPrice === 'function' ? paPrice() : ''}
  <div class="grid g2"><div class="panel envelope"><div class="ph"><h3>Bid Project Cost (₹ Cr)</h3>${g2 ? '<span class="chip ok">Locked to G2</span>' : '<span class="chip warn">Live: not yet approved</span>'}</div>${o.est.length ? `<div class="tw"><table class="t"><tbody>${o.est.map(r => `<tr><td>${esc(r.wp)}</td><td class="num mono">${fmtN(num(r.lab) + num(r.mat) + num(r.sub), 1)}</td></tr>`).join('')}<tr><td>Contingency, adders and margin</td><td class="num mono">${fmtN(P - e.direct, 1)}</td></tr><tr class="grp"><td>Bid Project Cost</td><td class="num mono">${fmtN(P, 1)}</td></tr></tbody></table></div>` : '<div class="empty"><p>No estimate yet.</p></div>'}</div>
  <div class="panel envelope"><div class="ph"><h3>O&M quote, years 1–15</h3><span class="chip">Escalation ${o.omEsc}%</span></div><div class="pb">${om.base ? `<svg viewBox="0 0 600 150" style="width:100%;display:block" role="img" aria-label="O&M cost by year">${om.yrs.map((v, i) => { const h = v / mx * 110; return `<rect x="${20 + i * 38}" y="${125 - h}" width="28" height="${h}" rx="2" style="fill:var(--pack)"/>${i % 2 ? '' : `<text x="${34 + i * 38}" y="142" text-anchor="middle" style="font:10px var(--f-mono);fill:var(--muted)">Y${i + 1}</text>`}`; }).join('')}</svg><dl class="kv"><dt>Year-1 O&M</dt><dd class="mono">₹${fmtN(om.base, 1)} Cr</dd><dt>NPV at 10%</dt><dd class="mono">₹${fmtN(om.npv, 1)} Cr</dd><dt>Evaluated bid</dt><dd class="mono">₹${fmtN(P + om.npv, 1)} Cr</dd></dl>` : '<p class="sub">Add O&M cost lines in the estimate.</p>'}</div></div></div>`;
}

/* --- submission --- */
const CHECK = [['c1', 'Bid security (EMD) bank guarantee uploaded'], ['c2', 'JV / partner agreement executed'], ['c3', 'Solvency certificate received'], ['c4', 'Envelope A free of any price', 'guard'], ['c5', 'Every mandatory requirement answered by an approved section', 'compliance'], ['c6', 'Commercial volume locked to G2', 'g2'], ['c7', 'Digital signature on all files'], ['c8', 'Portal file-size and count limits checked']];
/* c4 is computed by scanning the assembled envelope A, and c6 needs G2 actually signed
   rather than merely passed by position. */
function checkVal(c) {
  const o = O();
  if (c[2] === 'guard') { const s = envelopeAScan(); return s.paras > 0 && s.findings.length === 0; }
  if (c[2] === 'compliance') return compliance().length > 0 && compliance().every(x => x.s === 'compliant');
  if (c[2] === 'g2') return gateSigned('G2');
  return !!o.checks[c[0]];
}
function guardPanel() {
  const s = envelopeAScan(), n = s.findings.length;
  const head = `<div class="ph"><h3>Envelope guard</h3>${s.paras === 0 ? '<span class="chip warn">Nothing to scan</span>' : n ? `<span class="chip bad">${n} to clear</span>` : '<span class="chip ok">Clear</span>'}</div>`;
  if (!s.paras) return `<div class="panel">${head}<div class="pb"><p class="sub">No drafted paragraphs yet. Draft the sections, then the guard scans them.</p></div></div>`;
  if (!n) return `<div class="panel">${head}<div class="pb"><p class="sub">Scanned ${s.paras} paragraph${s.paras === 1 ? '' : 's'} across ${s.sections} section${s.sections === 1 ? '' : 's'}. No price, rate or margin found in envelope A.</p></div></div>`;
  return `<div class="panel" style="border-color:var(--bad)">${head}<div class="pb stack" style="gap:8px"><p class="sub">Scanned ${s.paras} paragraph${s.paras === 1 ? '' : 's'} across ${s.sections} section${s.sections === 1 ? '' : 's'}. Prices belong in envelope B only, so these must be removed before release.</p>
   <div class="pb flush">${s.findings.slice(0, 12).map(f => `<div class="flag"><div class="sev high"></div><div class="body"><b style="font-size:13px">${esc(f.hit)}</b><span class="sub">${esc(f.section)} · paragraph ${f.para} · ${esc(f.kind)}</span></div><button class="btn sm" data-a="psel" data-id="${f.nodeId}" data-go="1">Open</button></div>`).join('')}</div>
   ${n > 12 ? `<p class="sub">and ${n - 12} more.</p>` : ''}</div></div>`;
}
function mPSub() {
  const ready = CHECK.every(checkVal), cm = compliance(), ed = can('prop') || can('elig');
  return `${propHead('Submission', 'Proposal workspace · commercial', 'Tick the manual items; automatic items follow the records. When all are met, G3 opens for signature.', '')}
  <div class="grid g-side"><div class="panel"><div class="ph"><h3>Submission checklist</h3><span class="mono sub">${CHECK.filter(checkVal).length} / ${CHECK.length}</span></div><div class="pb">${CHECK.map(c => { const auto = !!c[2]; return `<label class="chk" for="ck-${c[0]}"><input type="checkbox" id="ck-${c[0]}" data-c="chk" data-id="${c[0]}" ${checkVal(c) ? 'checked' : ''} ${auto || !ed ? 'disabled' : ''}><span>${esc(c[1])}${auto ? ' <span class="chip">auto</span>' : ''}${c[0] === 'c5' && !checkVal(c) ? ` <span class="sub">${cm.filter(x => x.s !== 'compliant').length} not yet compliant</span> <button class="linkbtn" data-a="tab" data-t="pcomp">Open matrix</button>` : ''}${c[0] === 'c6' && !checkVal(c) ? ' <button class="linkbtn" data-a="tab" data-t="est">Open estimate</button>' : ''}${c[0] === 'c4' && !checkVal(c) ? (() => { const s = envelopeAScan(); return s.paras ? ` <span class="sub">${s.findings.length} price reference${s.findings.length === 1 ? '' : 's'} found</span>` : ' <span class="sub">no drafted paragraphs to scan</span>'; })() : ''}</span></label>`; }).join('')}</div></div>
  <div class="stack">${guardPanel()}${gatePanel('G3', ready, 'Complete the checklist first.')}</div></div>
  ${typeof paSubmission === 'function' ? paSubmission() : ''}`;
}
