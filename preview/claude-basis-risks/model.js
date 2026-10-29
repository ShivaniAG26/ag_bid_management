// Editable data model: every opportunity is a mutable record set. Indrayani is seeded from data.js; new tenders start blank.

let _n = 0;
const uid = () => 'r' + Date.now().toString(36) + (++_n).toString(36);
const deep = o => JSON.parse(JSON.stringify(o));
const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isNaN(n) ? 0 : n; };
function nextId(list, prefix, pad = 2) { const m = list.reduce((a, r) => { const x = parseInt(String(r.id || '').replace(prefix, ''), 10); return isNaN(x) ? a : Math.max(a, x); }, 0); return prefix + String(m + 1).padStart(pad, '0'); }
const R_ = (rows, keys) => rows.map(r => { const o = { id: uid() }; keys.forEach((k, i) => o[k] = r[i]); return o; });

const PROB = [0, 0.1, 0.3, 0.5, 0.7, 0.9];
const expo = r => num(r.impact) * PROB[num(r.l)] ;
const CX_LEVELS = ['Hydraulic and leak tests', 'Equipment tests', 'Trial run (wet)', 'PG test (90 days)', 'O&M handover'];
const BASELINE = ['Design basis accepted', 'Estimate locked at G2 + negotiated changes', 'Risk register with owners', 'Obligations register', 'Supplier awards and long-lead orders', 'Proposal commitments carried into the contract'];
const G1_ROWS = [['Strategic fit', 15], ['Eligibility', 10], ['Technical capability', 15], ['Capacity (bid team & execution)', 10], ['Margin potential', 15], ['Contract risk', 10], ['Long-lead feasibility', 10], ['Competition', 10], ['Client relationship', 5]];
const SCENS = [['Safe', 11, 18], ['Competitive', 7.5, 31], ['Aggressive', 4.5, 46], ['Value-engineered', 8, 38]];
const DOC_TYPES = ['RFP / ITB', 'Specification', 'Contract / GCC', 'Contract / SCC', 'Drawing', 'BOQ', 'Report', 'Data', 'Addendum', 'Form', 'Quote', 'Other'];
const TYPE_OF = { 'D-01': 'RFP / ITB', 'D-02': 'Specification', 'D-11': 'Specification', 'D-03': 'Contract / GCC', 'D-04': 'Drawing', 'D-05': 'BOQ', 'D-06': 'Report', 'D-07': 'Data', 'D-08': 'Addendum', 'D-09': 'Addendum', 'D-10': 'Form' };
const WBS_OF = { Process: 'WW-02', Performance: 'WW-02', Hydraulics: 'WW-04', Energy: 'WW-07', Pipeline: 'WW-05', Sludge: 'WW-03', SCADA: 'WW-07', 'O&M': 'WW-09', Testing: 'WW-08', Programme: 'WW-10', Format: '—', Civil: 'WW-06', Commercial: '—' };
const WBS = [['WW-01', 'Inlet works and pretreatment'], ['WW-02', 'Secondary and tertiary process'], ['WW-03', 'Sludge handling'], ['WW-04', 'Pumping stations'], ['WW-05', 'Trunk sewer and crossings'], ['WW-06', 'Civil and structural'], ['WW-07', 'Electrical, I&C and SCADA'], ['WW-08', 'Testing and commissioning'], ['WW-09', 'Operation and maintenance'], ['WW-10', 'Preliminaries and general']];

function seedIndrayani() {
  const o = {
    meta: { id: OPP.id, name: OPP.name, client: OPP.client, loc: OPP.loc, types: ['stp', 'pump'], model: 'ham', value: 1260, submission: OPP.submission, fit: 72, snapshot: OPP.snapshot, desc: OPP.desc, seed: 'indrayani', owner: 'bid_manager', mld: 200, contact: 'cityengineer.wsd@indrayanimc.gov.in', size: OPP.size.map(s => ({ id: uid(), k: s[0], v: s[1], n: s[2] })) },
    pos: 8, signed: {}, checks: {}, mail: [],
    dates: OPP.dates.map(d => ({ id: uid(), k: d[0], d: d[1], st: d[2] })),
    stake: STAKE.map(s => ({ id: uid(), name: s[0], org: s[1], role: s[2], stance: s[3] })),
    comp: COMP.map(c => ({ id: uid(), name: c[0], record: c[1], price: c[2], note: c[3] })),
    brief: { summary: BRIEF.summary, facts: BRIEF.facts.map(f => ({ id: uid(), k: f[0], v: f[1], src: f[2] })) },
    scope: R_([['WW-01', 'Inlet works, screens and grit', 'In scope', 'Contractor-supplied', 'v2:20:§2'], ['WW-02', 'SBR process and tertiary filters', 'In scope', 'Tertiary added by Corr-01', 'c1:1:§2'], ['WW-03', 'Sludge thickening and dewatering', 'In scope', 'Cake to Moshi compost (11 km)', 'v2:141:§5.3'], ['WW-04', 'Raw sewage and 2 intermediate pumping stations', 'In scope', '', 'v2:20:§2'], ['WW-05', 'Trunk sewer 14.2 km', 'In scope', 'Includes trenchless crossings', 'v2:198:§7.1'], ['WW-05', 'Right-of-way along SH-55', 'Unclear', 'Who obtains permission is not stated', 'v2:214:§7.6'], ['WW-06', 'STP land (25.6 ha)', 'Owner-supplied', 'Handed over on the Appointed Date', 'ca:31:§10'], ['WW-07', 'SCADA and MPCB online link', 'In scope', '', 'v3:274:§10.2'], ['WW-09', 'O&M for 15 years', 'In scope', '46 staff minimum', 'ca:131:Sch. O'], ['—', 'Treated water reuse pipeline to MIDC', 'Excluded', 'Future phase', 'itb:4:§2.4']], ['wbs', 'wp', 'split', 'note', 'src']),
    terms: R_([['Price basis', 'Bid Project Cost (lump sum) + O&M quote per year, INR', 'itb:22:§31.3'], ['Payment structure', '40% construction support in 5 milestones; 60% as 30 bi-annual annuities', 'ca:61:§23.1'], ['Annuity interest', 'Bank rate + 3% on the reducing balance', 'ca:61:§23.1'], ['Late annuity payment', 'Interest at bank rate only', 'ca:64:§23.6'], ['Mobilisation advance', '5% of BPC against bank guarantee', ''], ['Retention', '5% of each bill; half released at COD', ''], ['Performance security', '5% of BPC within 30 days of LoA; 2.5% O&M security thereafter', 'ca:28:§9.1'], ['Bid security (EMD)', '₹12.6 Cr bank guarantee, 180 days', 'itb:2:NIT'], ['Delay damages', '0.1% of BPC per day, capped at 10%', 'ca:88:§34'], ['Performance damages', '₹1.2 Cr per year for each 0.01 kWh/m³ over 0.21', 'v2:302:§11.4'], ['Liability cap', '100% of BPC (excluding fraud and wilful default)', ''], ['Defects liability', '12 months after COD, then O&M period obligations', ''], ['Price adjustment', 'WPI-linked escalation on construction support', ''], ['Governing law', 'Indian law; arbitration seat Mumbai', '']], ['k', 'v', 'src']),
    docs: deep(DOCS).map(d => ({ ...d, type: TYPE_OF[d.id] || 'Other' })), cov: { ...COVERAGE }, covItems: COV_ITEMS.map(c => ({ id: c[0], doc: c[1], pages: c[2], reason: c[3], st: c[4] })),
    reqs: REQS.map((r, i) => ({ ...r, wbs: WBS_OF[r.cat] || '—', ev: [3, 4, 8].includes(i) ? 'medium' : 'high' })),
    basis: BASIS.map(b => ({ id: uid(), f: b[0], v: b[1], src: b[2], st: b[3] })),
    quality: R_(PROCESS, ['p', 'raw', 'tr', 'norm']),
    rules: RULES.map(r => ({ ...r })),
    elig: PREQUAL.map(p => ({ id: uid(), c: p[0], need: p[1], ours: p[2], res: p[3], src: p[4] })),
    risks: [
      { id: 'R-01', risk: RISKS[0].risk, cat: 'Design basis', l: 4, i: 5, impact: 18, treat: 'Clarify', owner: 'process', src: RISKS[0].src, mit: 'PBQ-03 at pre-bid; size blowers with 18% headroom' },
      { id: 'R-02', risk: RISKS[1].risk, cat: 'Interface', l: 4, i: 4, impact: 22, treat: 'Clarify', owner: 'pipeline', src: RISKS[1].src, mit: 'PBQ-04; programme assumes ROW by Month 4; seek time extension clause' },
      { id: 'R-03', risk: RISKS[2].risk, cat: 'Site', l: 4, i: 3, impact: 12, treat: 'Price', owner: 'estimator', src: RISKS[2].src, mit: 'Price 18,400 m³ rock; rock breakers, no blasting near housing' },
      { id: 'R-04', risk: RISKS[3].risk, cat: 'Performance', l: 3, i: 4, impact: 12, treat: 'Price', owner: 'ei', src: RISKS[3].src, mit: 'VFD blowers, IE4 motors, DO control; PBQ-05 on IPS boundary' },
      { id: 'R-05', risk: RISKS[4].risk, cat: 'Commercial', l: 3, i: 4, impact: 24.4, treat: 'Price', owner: 'commercial', src: RISKS[4].src, mit: 'Negotiate bank rate + 2%; working-capital line' },
      { id: 'R-06', risk: RISKS[5].risk, cat: 'Design', l: 2, i: 3, impact: 3.7, treat: 'Accept', owner: 'process', src: RISKS[5].src, mit: 'Place filters between SBR and CCT' }],
    clars: CLARS.map(c => ({ ...c, disc: { 'PBQ-03': 'Process', 'PBQ-04': 'Pipeline', 'PBQ-05': 'Electrical', 'PBQ-07': 'Process', 'PBQ-01': 'Commercial' }[c.id], req: { 'PBQ-04': 'REQ-0144', 'PBQ-05': 'REQ-0131', 'PBQ-07': 'REQ-0124' }[c.id] || '' })),
    addenda: ADDENDA.map(a => ({ id: uid(), no: a.no, date: a.date, doc: a.doc, title: a.title, impact: a.impact.join('\n') })),
    devs: DEVS.map(d => ({ ...d, why: d.id === 'DEV-02' ? 'Lower energy, meets 20% DS' : 'Avoids monsoon open-cut delay and ROW disruption' })),
    g1: { rows: [['Strategic fit', 15, 'Municipal HAM STP in home state; AMRUT-funded', 4], ['Eligibility', 10, '5 of 6 criteria pass; solvency pending', 4], ['Technical capability', 15, 'Vadodara 150 MLD SBR delivered and operated', 4], ['Capacity (bid team & execution)', 10, 'Rajkot peaks Q2 2027; pipeline crew free', 3], ['Margin potential', 15, 'Peer awards ₹5.9–6.6 Cr/MLD', 3], ['Contract risk', 10, 'Annuity delay at bank rate; ROW unassigned', 2], ['Long-lead feasibility', 10, 'MS pipe 2 months short unless pre-ordered', 2], ['Competition', 10, 'Vishwa Aqua L1 in 4 of 9', 2], ['Client relationship', 5, 'First bid with Indrayani MC', 3]].map(r => ({ id: uid(), c: r[0], w: r[1], ev: r[2], s: r[3], ov: null })), ko: [], dec: 'Conditional bid', memo: '', similar: G1.similar.join('\n') },
    calc: { mld: 200, bod: 200, pf: 2.25, basins: 4 }, runs: [],
    takeoff: TAKEOFF.map(t => ({ id: uid(), sym: t[0], item: t[1], qty: t[2], sheet: 'L-201', st: t[3] })),
    boq: XL['D-05'].flatMap(s => s.rows.map(r => ({ id: uid(), grp: s.name, code: r[0], desc: r[1], unit: r[2], client: r[3], ours: r[4], src: r[6], acc: r[5] === null ? 80 : Math.abs(r[5]) > 10 ? 75 : r[6] === 'Calculator' || r[6].startsWith('Vol') ? 100 : 92 }))),
    pkgs: PKGS.map(p => ({ id: uid(), pkg: p[0], lines: p[1], sup: p[2], st: p[3], due: p[4] })),
    rfq: { pkg: '', inc: {}, sel: {}, due: '2026-11-22' },
    vendors: [['Aerzen-Kirloskar', 'Blowers, diffusers', 4.4, 92, 1], ['Hydrotech Blowers', 'Blowers', 3.6, 81, 2], ['Turbomax Air', 'Blowers', 4.0, 88, 1], ['Kirloskar Pumps', 'Pumps', 4.0, 84, 3], ['Xylem India', 'Pumps', 4.3, 90, 1], ['Welspun', 'MS pipe', 4.2, 86, 2], ['Electrosteel', 'DI pipe', 4.1, 89, 1], ['Filtrex', 'Disc filters', 3.8, 90, 1], ['Deccan Trenchless', 'Microtunnelling', 4.1, 88, 0]].map(v => ({ id: uid(), name: v[0], cat: v[1], rating: v[2], otd: v[3], ncr: v[4] })),
    lev: { pkg: LEV.pkg, sups: LEV.sup.map((s, i) => ({ id: 's' + i, name: s[0], quoted: s[1], cov: s[2], lead: s[3], terms: s[4], comp: s[5] })), adders: LEV.adders.map(a => ({ id: uid(), name: a[0], vals: { s0: a[1][0], s1: a[1][1], s2: a[1][2] } })), award: null },
    market: [['Ductile iron pipe', '₹78,400/t', '+3.8% in 90 days', 'Trunk sewer 14.2 km', 1.2], ['Steel plate (MS pipe)', '₹61,900/t', '−1.2%', 'Trunk sewer 14.2 km', -0.4], ['Cement and rebar', 'DSR 2026 + 4%', '+2.1%', 'Civil and structural', 0.8], ['Stainless steel 316', '₹268/kg', '+1.9%', 'Tertiary and disinfection', 0.2], ['Copper (cables, motors)', 'LME $9,840/t', '+5.2%', 'Electrical (22 kV, MCC, VFD)', 1.1]].map(m => ({ id: uid(), f: m[0], basis: m[1], move: m[2], wp: m[3], adj: m[4] })),
    longlead: LONGLEAD.map(l => ({ id: uid(), item: l[0], lead: l[1], need: +l[2].replace('Month ', ''), order: +l[3].replace('Month ', '') })),
    awards: [['Air blowers and diffusers', 'Aerzen-Kirloskar', 'Lowest levelled cost after diffuser filler and energy pass-through', '₹2.0 Cr vs Turbomax', 'Proposed'], ['DI and MS pipes', 'Electrosteel DI + Welspun MS', 'Split award secures MS lead time', '₹3.2 Cr', 'Approved']].map(a => ({ id: uid(), pkg: a[0], rec: a[1], why: a[2], save: a[3], st: a[4] })),
    est: EST.map(e => ({ id: uid(), wp: e[0], lab: e[1], mat: e[2], sub: e[3], src: ['Rate library', 'Quotes + rates', 'Quotes (3)', 'Quotes (3)', 'DSR 2026', 'Quotes (4)', 'Takeoff + quotes', 'Quotes (3)', 'Allowance', 'Norms'][EST.indexOf(e)] })),
    adders: ADDERS.slice(1).map(a => ({ id: uid(), name: a[0], val: a[1] })),
    scen: 'Competitive', margin: null,
    om: OM.rows.map(r => ({ id: uid(), item: r[0], cost: r[1] })), omEsc: 5,
    nego: { bids: POST.outcome.comp.map((c, i) => ({ id: uid(), name: c[0], bpc: c[1], us: i === 0 })), pos: POST.nego.map((n, i) => ({ id: uid(), topic: n[0], tender: n[1], ask: n[2], walk: ['Bank rate', 'In BPC up to 12,000 m³', 'Shared, time extension'][i], agreed: n[3] })), result: 'Won', reasons: POST.outcome.reasons.join('\n') },
    bafo: [{ id: uid(), round: 'Envelope B opened', price: 1260.0 }, { id: uid(), round: 'Negotiation (L1 call)', price: 1249.2 }],
    contract: {
      ver: 3, sel: 'c1', versions: [{ v: 1, by: 'Indrayani MC', ts: '12 Jan 2027', note: 'Draft concession agreement issued with LoA' }, { v: 2, by: 'Rohit Bansal (us)', ts: '19 Jan 2027', note: 'Our redline: 6 clauses' }, { v: 3, by: 'Indrayani MC', ts: '28 Jan 2027', note: 'Authority response: 3 agreed, 3 open' }],
      clauses: [
        { id: 'c1', ref: '§23.6', title: 'Delayed payment of annuity', orig: 'Annuities not paid within 30 days of the due date shall carry interest at the bank rate.', prop: 'Annuities not paid within 30 days of the due date shall carry interest at the bank rate plus 1%, compounded quarterly.', bid: 'Bank rate + 1% (agreed at negotiation)', st: 'Negotiating', cm: [['Rohit Bansal', '19 Jan', 'Negotiated position from 14 Jan minutes, item 2.'], ['Indrayani MC', '28 Jan', 'Authority can accept +1% simple, not compounded.']] },
        { id: 'c2', ref: '§10.3', title: 'Right of way', orig: 'The Authority shall make reasonable efforts to procure right of way for the trunk sewer.', prop: 'The Authority shall procure right of way for the trunk sewer by Month 4. Any delay shall entitle the Concessionaire to an extension of time and costs.', bid: 'Authority + time extension', st: 'Negotiating', cm: [['Indrayani MC', '28 Jan', 'Time extension accepted; costs not accepted.']] },
        { id: 'c3', ref: 'Sch. K', title: 'Performance guarantee test', orig: '90-day performance test at not less than 80% of design flow; BOD < 10 mg/l.', prop: '90-day performance test at not less than 80% of design flow; BOD < 10 mg/l.', bid: '90 days, BOD < 10', st: 'Agreed', cm: [] },
        { id: 'c4', ref: 'Sch. O', title: 'Minimum O&M staffing', orig: 'The Concessionaire shall deploy not less than 52 personnel.', prop: 'The Concessionaire shall deploy not less than 46 personnel, as stated in the bid.', bid: '46 personnel', st: 'Negotiating', cm: [['Indrayani MC', '28 Jan', '52 required by the state O&M norm 2026.']] },
        { id: 'c5', ref: '§34', title: 'Damages for delay', orig: 'Damages for delay in COD shall be 0.1% of BPC per day, subject to a maximum of 10%.', prop: 'Damages for delay in COD shall be 0.1% of BPC per day, subject to a maximum of 10%.', bid: '0.1%/day, cap 10%', st: 'Agreed', cm: [] },
        { id: 'c6', ref: '§11.4', title: 'Energy guarantee boundary', orig: 'Energy shall be measured at the 22 kV incomer.', prop: 'Energy shall be measured at the 22 kV incomer of the STP, excluding the intermediate pumping stations (per reply to PBQ-05).', bid: 'Excludes IPS', st: 'Agreed', cm: [['Indrayani MC', '28 Jan', 'Agreed.']] }]
    },
    drift: POST.drift.map(d => ({ id: uid(), clause: d[0], bid: d[1], con: d[2], sev: d[3] })),
    b2b: [['Performance guarantee', '0.21 kWh/m³ for 15 years', 'Blower OEM: efficiency guaranteed 2 years', 'Gap: 13 years uncovered'], ['Delay damages', '0.1%/day, cap 10%', 'Pipe supplier: 0.5%/week, cap 5%', 'Gap: 5% of cap'], ['Defects liability', '12 months after COD', 'Pump OEM: 18 months from dispatch', 'Gap: may expire before COD'], ['Payment terms', 'Annuity, 30 bi-annual', 'Microtunnelling sub: 30 days from invoice', 'Cash-flow gap']].map(b => ({ id: uid(), clause: b[0], main: b[1], sub: b[2], gap: b[3] })),
    obl: POST.obl.map(b => ({ id: b[0], ob: b[1], party: b[2], due: b[3], bar: b[4], done: b[3] === 'Done' })),
    baseline: BASELINE.map(t => ({ id: uid(), t, ok: true })),
    bills: [['RA-10', 'Aug 2027', 38.4, 38.4, 36.5, 'Paid'], ['RA-11', 'Sep 2027', 42.6, 40.1, 0, 'Certified by IE'], ['RA-12', 'Oct 2027', 47.9, 0, 0, 'Submitted']].map(b => ({ id: b[0], period: b[1], claimed: b[2], cert: b[3], paid: b[4], st: b[5] })),
    claims: [{ id: 'CL-01', event: 'ROW not handed over, ch 4+200–8+000', notice: '2027-08-04', days: 150, val: 11.8, st: 'Submitted to IE' }, { id: 'CL-02', event: 'Rock beyond 12,000 m³ (measured)', notice: '2027-09-20', days: 0, val: 4.6, st: 'Draft' }],
    bgs: [['EMD / bid security', 12.6, 'Bank of Baroda', '2027-06-05', 'Released'], ['Performance security (5%)', 63.8, 'SBI', '2029-12-31', 'Active'], ['Mobilisation advance', 25.5, 'Union Bank', '2027-12-15', 'Reducing']].map(b => ({ id: uid(), type: b[0], val: b[1], bank: b[2], exp: b[3], st: b[4] })),
    deliv: POST.deliv.map(d => ({ id: uid(), doc: d[0], title: d[1], disc: d[2], status: d[3], rev: d[4], pct: d[5] })),
    tqs: [['TQ-011', 'Confirm SBR decanter elevation vs hydraulic profile', 'Answered'], ['TQ-016', 'MPCB analyser protocol for server link', 'Open'], ['TQ-019', 'Outfall flap gate type and material', 'Open']].map(t => ({ id: t[0], q: t[1], st: t[2] })),
    po: POST.pos.map(p => ({ id: p[0], item: p[1], sup: p[2], need: +p[3].replace('Month ', ''), fc: +p[4].replace('Month ', ''), exp: p[5] === 'bad' ? 'Escalated' : p[5] === 'warn' ? 'Chasing' : 'On track' })),
    vdocs: [['VD-BLW-003', 'Aerzen-Kirloskar', 'Blower performance curve', 'Code 1', 'Duty point meets 0.21 kWh/m³'], ['VD-PMP-008', 'Kirloskar Pumps', 'Pump curves IPS-1', 'Code 2', 'Efficiency 2% below datasheet'], ['VD-FLT-002', 'Filtrex', 'Disc filter GA', 'Under review', 'Cloth pore size not stated']].map(v => ({ id: v[0], vendor: v[1], title: v[2], code: v[3], note: v[4] })),
    fat: [['Blowers 1–4 performance test', 'Month 13', 'IE + Narmada', 'Passed'], ['Pumps IPS-1 (4) performance test', 'Month 13', 'Narmada', 'Failed'], ['Centrifuge 1 dryness test', 'Month 14', 'IE', 'Scheduled']].map(f => ({ id: uid(), item: f[0], date: f[1], wit: f[2], res: f[3] })),
    logi: [['SH-104', 'MS pipe lot 3 (1.2 km)', 'Road, 24 trailers', 'Arrived'], ['SH-109', 'Blowers 1–4', 'Road', 'In transit'], ['SH-112', 'DI pipe lot 6', 'Rail + road', 'Dispatched']].map(l => ({ id: l[0], what: l[1], mode: l[2], st: l[3] })),
    wps: POST.wps.map((w, i) => ({ id: uid(), wp: w[0], pct: w[1], plan: [380, 110, 0, 0][i] || 0, act: [410, 96, 0, 0][i] || 0, unit: ['m³/day', 'm/day', '', ''][i], note: w[2] })),
    diary: [['2027-10-22', 'Clear, 31 °C', 368, 'Pipe laying ch 2+340 to 2+460; rock met at 2.1 m'], ['2027-10-21', 'Clear, 30 °C', 352, 'SBR basin 3 wall pour, 186 m³; cube samples taken']].map(d => ({ id: uid(), date: d[0], weather: d[1], lab: d[2], entry: d[3] })),
    sched: [['SBR basins structure complete', 16, 17], ['Sewer ch 4+200 to 8+000 (ROW)', 14, 19], ['Trial run start', 27, 28], ['COD (after PG test)', 30, 31]].map(s => ({ id: uid(), ms: s[0], base: s[1], fc: s[2] })),
    row: POST.row.map(r => ({ id: uid(), ch: r[0], land: r[1], owner: r[2], status: r[3] })),
    itp: [['ITP-C-04', 'SBR basin water-tightness test', 'Hold', 'Open'], ['ITP-P-07', 'Sewer hydrostatic test per section', 'Witness', 'In progress'], ['ITP-E-02', '22 kV switchgear pre-commissioning', 'Hold', 'Planned']].map(r => ({ id: r[0], act: r[1], pt: r[2], st: r[3] })),
    ncr: [['NCR-018', 'Honeycombing in basin 2 wall', 'Civil subcontractor', 'Closed'], ['NCR-024', 'MS pipe weld radiography reject (3 joints)', 'Welspun / pipeline sub', 'Open']].map(r => ({ id: r[0], desc: r[1], party: r[2], st: r[3] })),
    permits: [['PTW-0410', 'Confined space', 'IPS-1 wet well', 'Active', ''], ['PTW-0415', 'Excavation > 3 m', 'Ch 2+400', 'Requested', 'Blasting window the same day']].map(r => ({ id: r[0], type: r[1], area: r[2], st: r[3], conflict: r[4] })),
    weld: [['MS-J-0412', 'WPS-07 (SMAW)', 'RT 10%', 'Accepted'], ['MS-J-0418', 'WPS-07 (SMAW)', 'RT 10%', 'Rejected'], ['MS-J-0433', 'WPS-09 (SAW)', 'UT 100%', 'Accepted']].map(r => ({ id: r[0], wps: r[1], ndt: r[2], res: r[3] })),
    incidents: [['2027-10-02', 'Near miss', 'Excavator swing near open trench edge, ch 2+300', 'Closed'], ['2027-09-18', 'First aid', 'Hand cut while handling rebar, basin 3', 'Closed']].map(r => ({ id: uid(), date: r[0], type: r[1], desc: r[2], st: r[3] })),
    hse: { mh: 1840000 },
    ctrl: POST.ctrl.map(c => ({ id: uid(), wp: c[0], bud: c[1], com: c[2], act: c[3], fc: c[4] })),
    changes: POST.changes.map(c => ({ id: c[0], desc: c[1], val: c[2], st: c[3] })),
    cx: { levels: CX_LEVELS.slice(), systems: POST.cx.systems.map(s => ({ id: uid(), sys: s[0], p: s[1].slice() })) },
    punch: POST.punch.map(p => ({ id: p[0], sys: p[1], cat: p[2], desc: p[3], st: p[4] })),
    ptest: [{ id: uid(), par: 'Treated BOD', unit: 'mg/l', dir: 'max', lim: 10, meas: 7.8 }, { id: uid(), par: 'Treated TSS', unit: 'mg/l', dir: 'max', lim: 10, meas: 8.6 }, { id: uid(), par: 'Fecal coliform', unit: 'MPN/100 ml', dir: 'max', lim: 100, meas: 64 }, { id: uid(), par: 'Specific energy', unit: 'kWh/m³', dir: 'max', lim: 0.21, meas: 0.214 }, { id: uid(), par: 'Sludge dryness', unit: '% DS', dir: 'min', lim: 20, meas: 21.4 }],
    ptlog: Array.from({ length: 34 }, (_, i) => ({ id: uid(), day: i + 1, val: +(0.226 - i * 0.00036 + Math.sin(i * 1.7) * 0.0022).toFixed(3) })),
    ptDay: 34,
    consents: POST.consents.map(c => ({ id: uid(), name: c[0], st: c[1] })),
    turn: POST.turn.map(t => ({ id: uid(), area: t[0], pct: t[1] })),
    assets: [['BLW-101', 'Air blower 1', 'Blower house', 'Aerzen-Kirloskar GM 90S', 'A'], ['PMP-101', 'Raw sewage pump 1', 'RSPS wet well 1', 'Kirloskar KPDS 300', 'A'], ['FLT-201', 'Disc filter 1', 'Tertiary building', 'Filtrex DF-50', 'B'], ['CEN-301', 'Centrifuge 1', 'Centrifuge house', 'Alfa Laval ALDEC G3', 'A'], ['TRF-001', 'Transformer TR-1 2.5 MVA', '22 kV substation', 'Voltamp', 'A']].map(a => ({ id: a[0], asset: a[1], loc: a[2], make: a[3], crit: a[4] })),
    warr: [['Air blowers', 'Aerzen-Kirloskar', '24 months', 'Month 54', 0], ['Raw sewage pumps', 'Kirloskar Pumps', '24 months', 'Month 54', 1], ['Disc filters', 'Filtrex', '36 months', 'Month 66', 0]].map(w => ({ id: uid(), item: w[0], sup: w[1], period: w[2], exp: w[3], open: w[4] })),
    staff: [['Plant manager', 1, 1], ['Process engineers', 3, 2], ['Shift operators', 18, 14], ['Electricians and fitters', 12, 9], ['Lab chemists', 4, 4], ['Helpers and security', 8, 8]].map(s => ({ id: uid(), role: s[0], req: s[1], mob: s[2] })),
    bva: POST.ctrl.length ? [['Trunk sewer 14.2 km (₹ Cr)', 275, 294, 'Rock +64%, ROW delay'], ['Secondary process SBR (₹ Cr)', 194, 191, 'Buyout saving'], ['Pipe laying (m/day)', 110, 96, 'Norm updated for rock'], ['O&M power (kWh/m³)', 0.21, 0.214, 'Blower tuning planned']].map(b => ({ id: uid(), item: b[0], bid: b[1], act: b[2], note: b[3] })) : [],
    lessons: 'Price rock from bore logs, not the client BOQ.\nPre-order MS pipe plate at LoA.\nGet ROW responsibility in the contract before G4.',
    prop: null
  };
  o.mail = seedMail(o);
  return o;
}
function seedMail(o) {
  const m = (thread, dir, from, to, subject, body, ts, attach) => ({ id: uid(), thread, dir, from, to, subject, body, ts, attach: attach || [] });
  return [
    m('clar:PBQ-01', 'out', 'Kavya Menon', 'City Engineer, Indrayani MC', 'Pre-bid query PBQ-01: reuse pipeline scope', 'Please confirm whether the treated water reuse pipeline to MIDC Bhosari is excluded from this contract (ITB §2.4).', '20 Oct 2026'),
    m('clar:PBQ-01', 'in', 'City Engineer, Indrayani MC', 'Kavya Menon', 'RE: Pre-bid query PBQ-01', 'Confirmed. The reuse pipeline is excluded and will be tendered separately (pre-bid minutes, item 4).', '29 Oct 2026'),
    m('contract', 'in', 'Indrayani MC Legal', 'Rohit Bansal', 'Draft concession agreement (v1) with Letter of Award', 'Please find the draft concession agreement for review. Comments within 7 days.', '12 Jan 2027', ['Concession Agreement v1.pdf']),
    m('contract', 'out', 'Rohit Bansal', 'Indrayani MC Legal', 'Concession agreement: our redline (v2)', 'Our redline covers six clauses, each tied to the negotiation minutes of 14 Jan. Summary attached.', '19 Jan 2027', ['Concession Agreement v2 redline.pdf', 'Clause summary.xlsx']),
    m('contract', 'in', 'Indrayani MC Legal', 'Rohit Bansal', 'RE: Concession agreement redline (v3)', 'Authority accepts §11.4, §34 and Sch. K. §23.6: +1% simple only. §10.3: time extension yes, costs no. Sch. O: 52 personnel per state norm.', '28 Jan 2027', ['Concession Agreement v3.pdf']),
    m('notice', 'out', 'Ravi Kumar', 'Independent Engineer', 'Notice NWW-IMC-0231: ROW not handed over', 'Notice under §10.3: right of way between ch 4+200 and 8+000 has not been handed over. We reserve our rights to an extension of time.', '04 Aug 2027')
  ];
}

function blankOpp(m) {
  return {
    meta: { id: m.id, name: m.name, client: m.client, loc: m.loc || '', types: [m.type], model: m.model, value: num(m.value), submission: m.submission, fit: null, snapshot: 'snap-' + m.id.slice(-4) + '-01', desc: '', seed: null, owner: S.role, mld: num(m.mld) || null, contact: '', size: [] },
    pos: 1, signed: {}, checks: {}, mail: [],
    sigs: [], gateRet: {}, ungated: {}, closed: null, guardOvr: [],
    dates: [{ id: uid(), k: 'Technical bid due', d: m.submission, st: '' }], stake: [], comp: [], brief: { summary: '', facts: [] }, scope: [], terms: [],
    docs: [], cov: { processed: 0, excluded: 0, review: 0, failed: 0, total: 0 }, covItems: [],
    reqs: [], basis: [], quality: [], rules: [], elig: [], risks: [], clars: [], addenda: [], devs: [],
    g1: { rows: G1_ROWS.map(r => ({ id: uid(), c: r[0], w: r[1], ev: '', s: 3, ov: null })), ko: [], dec: '', memo: '', similar: '' },
    calc: { mld: num(m.mld) || 50, bod: 200, pf: 2.25, basins: 4 }, runs: [],
    takeoff: [], boq: [], pkgs: [], rfq: { pkg: '', inc: {}, sel: {}, due: '' }, vendors: [], lev: { pkg: '', sups: [], adders: [], award: null }, market: [], longlead: [], awards: [],
    est: [], adders: [{ id: uid(), name: 'Bonds and insurance', val: 0 }, { id: uid(), name: 'Escalation', val: 0 }, { id: uid(), name: 'Financing during construction', val: 0 }], scen: 'Competitive', margin: null, om: [], omEsc: 5,
    nego: { bids: [], pos: [], result: 'Pending', reasons: '' }, bafo: [], contract: { ver: 0, sel: null, versions: [], clauses: [] }, drift: [], b2b: [], obl: [], baseline: BASELINE.map(t => ({ id: uid(), t, ok: false })),
    bills: [], claims: [], bgs: [], deliv: [], tqs: [], po: [], vdocs: [], fat: [], logi: [], wps: [], diary: [], sched: [], row: [], itp: [], ncr: [], permits: [], weld: [], incidents: [], hse: { mh: 0 }, ctrl: [], changes: [],
    cx: { levels: CX_LEVELS.slice(), systems: [] }, punch: [], ptest: [], ptlog: [], ptDay: 0, consents: [], turn: [], assets: [], warr: [], staff: [], bva: [], lessons: '', prop: null
  };
}
/* fill any field a saved record lacks (older saves, new modules) */
function ensureShape(o) { const ref = seedFor(o.meta.seed, o.meta); Object.keys(ref).forEach(k => { if (o[k] === undefined) o[k] = ref[k]; }); return o; }

/* ---------------- role permissions: who may edit each area ---------------- */
const TECH = ['process', 'ei', 'pipeline'];
const PERM = {
  meta: { l: 'Opportunity, brief and scope', r: ['bid_manager', 'bd_head'] },
  docs: { l: 'Upload and classify documents', r: ['bid_manager', 'estimator', ...TECH] },
  reqs: { l: 'Requirements', r: ['bid_manager', 'om', ...TECH] },
  basis: { l: 'Design basis and rules', r: ['process', 'ei', 'bid_manager'] },
  elig: { l: 'Eligibility, terms and deviations', r: ['bid_manager', 'commercial', 'contracts'] },
  risks: { l: 'Risk register', r: ['bid_manager', 'estimator', 'commercial', 'pd', ...TECH] },
  clar: { l: 'Clarifications and addenda', r: ['bid_manager', ...TECH] },
  g1: { l: 'Bid / no-bid scoring', r: ['bd_head', 'exec', 'bid_manager'] },
  eng: { l: 'Engineering sizing and deviations', r: ['process', 'ei'] },
  boq: { l: 'Takeoff and BOQ', r: ['estimator', 'pipeline', 'process'] },
  quotes: { l: 'Procurement: packages, RFQs, quotes, awards', r: ['procurement'] },
  est: { l: 'Estimate build-up', r: ['estimator', 'commercial'] },
  margin: { l: 'Margin and scenario', r: ['commercial', 'exec'] },
  prop: { l: 'Proposal structure and all sections', r: ['bid_manager'] },
  envB: { l: 'View envelope B (prices)', r: ['bid_manager', 'commercial', 'estimator', 'exec'] },
  nego: { l: 'Negotiation and outcome', r: ['commercial', 'bd_head', 'contracts'] },
  contract: { l: 'Contract documents, redlines and client correspondence', r: ['contracts', 'commercial', 'pd'] },
  cadmin: { l: 'Contract administration: bills, claims, notices, BGs', r: ['contracts', 'commercial', 'pd'] },
  engd: { l: 'Engineering delivery', r: ['process', 'ei', 'pipeline', 'pd'] },
  psupply: { l: 'Procurement & supply: POs, vendor docs, FAT, logistics', r: ['procurement', 'pd'] },
  construct: { l: 'Construction: progress, diary, schedule, ROW', r: ['site', 'pd', 'pipeline'] },
  qhse: { l: 'Quality & HSE', r: ['qhse', 'site', 'pd'] },
  cost: { l: 'Project controls: cost and changes', r: ['pd', 'commercial'] },
  cx: { l: 'Testing, PG test and punch', r: ['process', 'ei', 'pd'] },
  om: { l: 'Handover and O&M', r: ['om', 'pd'] },
  admin: { l: 'Admin console: users, permissions, approvals, AI governance', r: ['admin'] }
};
/* Fail closed: an area the active pack does not define is not open to everyone.
   Packs drop permissions deliberately (an O&M pack has no margin, an EPCM pack no BOQ),
   so a missing key means "not in this pack", never "allow all". */
const can = area => !!PERM[area] && PERM[area].r.includes(S.role);

/* ---------------- envelope guard ----------------
   A real scan, not a label. Anything that reads as a price is reported, with the
   matched text, so the guard can block envelope A content and outbound messages. */
const GUARD_RULES = [
  { k: 'currency', re: () => /(?:₹|\bRs\.?|\bINR\b|\bAED\b|\bSAR\b|\bQAR\b|\bOMR\b|\bKWD\b|\bBHD\b|\bUSD\b|\bEUR\b|\$|€)\s*-?[\d,]*\d(?:\.\d+)?/gi },
  { k: 'money scale', re: () => /\b[\d,]*\d(?:\.\d+)?\s*(?:cr\b|crore|lakh|lakhs|lac\b|million\b|billion\b|\bmn\b|\bbn\b)(?!\s*(?:litre|liter|l\b|m3|m³|cum|gal|kl\b|ml\b))/gi },
  { k: 'unit rate', re: () => /\b[\d,]*\d(?:\.\d+)?\s*(?:per|\/)\s*(?:m3|m³|cum|mld|km\b|kg\b|mt\b|ton|tonne|sqm|m2|m²|rm\b|lm\b|nos?\b|unit|month|day|hour|hr\b|man-month)/gi },
  { k: 'priced field', re: () => /\b(?:rate|rates|price|priced|cost|amount|margin|fee|quote|quotation|bpc)\b[^.\n]{0,30}?\b(?:\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+\.\d{1,2}|\d{4,})\b/gi },
  { k: 'margin %', re: () => /\b(?:margin|mark-?up)\b[^.\n]{0,20}?\d+(?:\.\d+)?\s*%/gi }
];
function guardScan(text) {
  if (!text) return [];
  const plain = String(text).replace(/<[^>]*>/g, ' ');
  const out = [];
  GUARD_RULES.forEach(({ k, re }) => { const r = re(); let m; while ((m = r.exec(plain)) && out.length < 120) out.push({ kind: k, hit: m[0].trim(), at: m.index, end: m.index + m[0].length }); });
  /* Several rules match the same price. Report it once, keeping the longest match. */
  const kept = [];
  out.sort((a, b) => a.at - b.at || (b.end - b.at) - (a.end - a.at))
    .forEach(f => { if (!kept.some(k => f.at < k.end && k.at < f.end)) kept.push(f); });
  return kept.slice(0, 40);
}
/* Envelope A is the whole technical proposal: the commercial volume is a separate
   volume rendered from the estimate, so every proposal paragraph belongs to envelope A.
   Reads through draftParas, which is what the draft tab renders, so the scan sees the
   text that would actually be submitted. Cached for the length of one render. */
let _envACache = null;
const clearGuardCache = () => { _envACache = null; };
function envelopeAScan() {
  if (_envACache) return _envACache;
  const pr = typeof ensureProp === 'function' && O() ? ensureProp() : null;
  if (!pr) return { findings: [], paras: 0, sections: 0 };
  let paras = 0, sections = 0; const findings = [];
  allNodes(pr.tree).forEach(n => {
    let ps = null;
    try { ps = typeof draftParas === 'function' ? draftParas(n) : (pr.paras[n.id] || null); } catch (e) { ps = pr.paras[n.id] || null; }
    if (!ps || !ps.length) return;
    sections++;
    ps.forEach((p, i) => { paras++; guardScan(p.t || p.table).forEach(f => findings.push({ ...f, section: n.title, para: i + 1, nodeId: n.id })); });
  });
  return (_envACache = { findings, paras, sections });
}

/* collections: path resolver + id prefix */
const COLL = {
  size: { get: o => o.meta.size }, facts: { get: o => o.brief.facts }, sups: { get: o => o.lev.sups }, levadd: { get: o => o.lev.adders },
  bids: { get: o => o.nego.bids }, npos: { get: o => o.nego.pos }, cxsys: { get: o => o.cx.systems }, g1rows: { get: o => o.g1.rows }, ko: { get: o => o.g1.ko }, clauses: { get: o => o.contract.clauses },
  reqs: { pre: 'REQ-0', pad: 3 }, risks: { pre: 'R-' }, clars: { pre: 'PBQ-' }, devs: { pre: 'DEV-' }, obl: { pre: 'OB-0' }, changes: { pre: 'CoS-' }, punch: { pre: 'PL-' }, po: { pre: 'PO-', pad: 4 }, rules: { pre: 'RU-' },
  bills: { pre: 'RA-' }, claims: { pre: 'CL-' }, tqs: { pre: 'TQ-0' }, vdocs: { pre: 'VD-0' }, logi: { pre: 'SH-' }, itp: { pre: 'ITP-' }, ncr: { pre: 'NCR-0' }, permits: { pre: 'PTW-0' }, weld: { pre: 'J-' }, assets: { pre: 'TAG-' }
};
const coll = (o, k) => (COLL[k] && COLL[k].get ? COLL[k].get(o) : o[k]);

/* ---------------- record forms: [field, label, type, required, options] ---------------- */
const ST_REC = [['proposed', 'Proposed'], ['accepted', 'Accepted'], ['rejected', 'Rejected']];
const sel = a => a.map(x => [x, x]);
const FORMS = {
  size: { t: 'Size metric', perm: 'meta', f: [['k', 'Metric', 'text', 1], ['v', 'Value', 'text', 1], ['n', 'Note', 'text']] },
  dates: { t: 'Key date', perm: 'meta', f: [['k', 'Milestone', 'text', 1], ['d', 'Date', 'text', 1], ['st', 'Status', 'select', 0, [['', 'Upcoming'], ['next', 'Next'], ['done', 'Done']]]] },
  stake: { t: 'Stakeholder', perm: 'meta', f: [['name', 'Name or position', 'text', 1], ['org', 'Organisation', 'text'], ['role', 'Role in this tender', 'text'], ['stance', 'Stance', 'select', 0, sel(['Supportive', 'Neutral', 'Process-focused', 'Regulator', 'Opposed'])]] },
  comp: { t: 'Competitor', perm: 'meta', f: [['name', 'Competitor', 'text', 1], ['record', 'Track record', 'text'], ['price', 'Last known price', 'text'], ['note', 'Note', 'text']] },
  facts: { t: 'Key fact', perm: 'meta', f: [['k', 'Fact', 'text', 1], ['v', 'Value', 'text', 1], ['src', 'Source', 'src']] },
  scope: { t: 'Scope item', perm: 'meta', f: [['wbs', 'WBS', 'select', 0, [['—', '—'], ...WBS.map(w => [w[0], w[0] + ' ' + w[1]])]], ['wp', 'Scope item', 'text', 1], ['split', 'Responsibility', 'select', 0, sel(['In scope', 'Unclear', 'Owner-supplied', 'Excluded'])], ['note', 'Note', 'text'], ['src', 'Source', 'src']], d: { split: 'In scope', wbs: '—' } },
  terms: { t: 'Commercial term', perm: 'elig', f: [['k', 'Term', 'text', 1], ['v', 'What the tender says', 'textarea', 1], ['src', 'Source', 'src']] },
  reqs: { t: 'Requirement', perm: 'reqs', f: [['text', 'Requirement', 'textarea', 1], ['cat', 'Category', 'select', 0, sel(['Process', 'Performance', 'Hydraulics', 'Energy', 'Pipeline', 'Sludge', 'SCADA', 'O&M', 'Testing', 'Programme', 'Format', 'Civil', 'Commercial'])], ['wbs', 'WBS', 'select', 0, [['—', '—'], ...WBS.map(w => [w[0], w[0] + ' ' + w[1]])]], ['mand', 'Mandatory', 'check'], ['src', 'Source', 'src'], ['ev', 'Evidence quality', 'select', 0, [['high', 'High'], ['medium', 'Medium'], ['low', 'Low']]], ['owner', 'Owner', 'role'], ['sec', 'Answered in proposal section', 'sec'], ['st', 'Status', 'select', 0, ST_REC]], d: { cat: 'Process', wbs: '—', mand: true, ev: 'high', st: 'proposed', owner: 'bid_manager' } },
  basis: { t: 'Design basis field', perm: 'basis', f: [['f', 'Field', 'text', 1], ['v', 'Value', 'text', 1], ['src', 'Source', 'src'], ['st', 'Status', 'select', 0, ST_REC]], d: { st: 'proposed' } },
  quality: { t: 'Quality parameter', perm: 'eng', f: [['p', 'Parameter', 'text', 1], ['raw', 'Raw', 'text'], ['tr', 'Treated (design)', 'text', 1], ['norm', 'Norm / standard', 'text']] },
  rules: { t: 'Rule / precedence check', perm: 'basis', f: [['rule', 'Rule', 'text', 1], ['check', 'Result of the check', 'textarea'], ['state', 'State', 'select', 0, [['open', 'Open'], ['pass', 'Pass']]], ['src', 'Source', 'src']], d: { state: 'open' } },
  elig: { t: 'Eligibility criterion', perm: 'elig', f: [['c', 'Criterion', 'text', 1], ['need', 'Required', 'text'], ['ours', 'Our evidence', 'text'], ['res', 'Result', 'select', 0, [['pass', 'Pass'], ['review', 'Evidence needed'], ['fail', 'Fail']]], ['src', 'Source', 'src']], d: { res: 'review' } },
  risks: { t: 'Risk', perm: 'risks', f: [['risk', 'Risk', 'textarea', 1], ['cat', 'Category', 'select', 0, sel(['Design basis', 'Design', 'Interface', 'Site', 'Performance', 'Commercial', 'Contract', 'Schedule', 'Supply chain', 'Resource', 'Regulatory'])], ['l', 'Likelihood (1–5)', 'range', 0, [1, 5, 1]], ['i', 'Impact (1–5)', 'range', 0, [1, 5, 1]], ['impact', 'Cost impact if it happens (₹ Cr)', 'num'], ['treat', 'Treatment', 'select', 0, sel(['Price', 'Clarify', 'Transfer', 'Accept', 'Avoid'])], ['mit', 'Mitigation', 'textarea'], ['owner', 'Owner', 'role'], ['src', 'Source', 'src']], d: { cat: 'Design', l: 3, i: 3, impact: 0, treat: 'Price', owner: 'bid_manager' } },
  clars: { t: 'Pre-bid query', perm: 'clar', f: [['q', 'Question to the client', 'textarea', 1], ['disc', 'Discipline', 'select', 0, sel(['Process', 'Pipeline', 'Electrical', 'Civil', 'Commercial', 'Contract'])], ['req', 'Linked requirement (ID)', 'text'], ['src', 'Source', 'src'], ['status', 'Status', 'select', 0, [['draft', 'Draft'], ['open', 'Sent, awaiting answer'], ['answered', 'Answered']]], ['a', 'Answer received', 'textarea']], d: { status: 'draft', disc: 'Process' } },
  addenda: { t: 'Addendum / corrigendum', perm: 'clar', f: [['no', 'Number', 'text', 1], ['date', 'Date', 'text'], ['title', 'What changed', 'text', 1], ['impact', 'Impact (one per line)', 'textarea']] },
  devs: { t: 'Technical deviation', perm: 'eng', f: [['clause', 'Clause', 'text', 1], ['text', 'Proposed deviation', 'textarea', 1], ['why', 'Reason', 'text'], ['status', 'Status', 'select', 0, ST_REC]], d: { status: 'proposed' } },
  g1rows: { t: 'Criterion', perm: 'g1', f: [['c', 'Criterion', 'text', 1], ['w', 'Weight %', 'num', 1], ['ev', 'Evidence', 'text'], ['s', 'Suggested score (1–5)', 'range', 0, [1, 5, 1]]], d: { w: 10, s: 3 } },
  takeoff: { t: 'Takeoff mark', perm: 'boq', f: [['sym', 'Mark', 'text', 1], ['item', 'Item', 'text', 1], ['qty', 'Quantity', 'num', 1], ['sheet', 'Drawing sheet', 'text'], ['st', 'Status', 'select', 0, ST_REC]], d: { st: 'proposed' } },
  boq: { t: 'BOQ line', perm: 'boq', f: [['grp', 'Schedule', 'text'], ['code', 'Item no.', 'text', 1], ['desc', 'Description', 'text', 1], ['unit', 'Unit', 'text'], ['client', 'Client quantity', 'num'], ['ours', 'Our quantity', 'num'], ['src', 'Quantity source', 'text'], ['acc', 'Accepted %', 'range', 0, [0, 100, 5]]], d: { grp: 'Schedule B', client: 0, ours: 0, acc: 0 } },
  pkgs: { t: 'RFQ package', perm: 'quotes', f: [['pkg', 'Package', 'text', 1], ['lines', 'Lines', 'num'], ['sup', 'Suppliers invited', 'num'], ['st', 'Status', 'select', 0, sel(['Planned', 'RFQ out', 'Quotes in', 'Levelling', 'Levelled', 'Awarded'])], ['due', 'Quotes due', 'text']], d: { st: 'Planned', lines: 1, sup: 3 } },
  vendors: { t: 'Supplier', perm: 'quotes', f: [['name', 'Supplier', 'text', 1], ['cat', 'Category', 'text', 1], ['rating', 'Rating (1–5)', 'num'], ['otd', 'On-time delivery %', 'num'], ['ncr', 'Open NCRs', 'num']], d: { rating: 4, otd: 90, ncr: 0 } },
  sups: { t: 'Supplier quote', perm: 'quotes', f: [['name', 'Supplier', 'text', 1], ['quoted', 'Quoted price (₹ Cr)', 'num', 1], ['cov', 'Scope coverage', 'text'], ['lead', 'Lead time (weeks)', 'num'], ['terms', 'Delivery terms', 'select', 0, sel(['FOR site', 'Ex-works', 'CIF port'])], ['comp', 'Technical compliance', 'text']], d: { cov: 'Covered', terms: 'FOR site', comp: 'Compliant' } },
  levadd: { t: 'Levelling adjustment', perm: 'quotes', f: [['name', 'Adjustment', 'text', 1]] },
  market: { t: 'Market factor', perm: 'quotes', f: [['f', 'Commodity / factor', 'text', 1], ['basis', 'Index basis', 'text'], ['move', 'Movement', 'text'], ['wp', 'Applies to work package', 'text', 1], ['adj', 'Adjustment (% of that package)', 'num', 1]] },
  longlead: { t: 'Long-lead item', perm: 'quotes', f: [['item', 'Item', 'text', 1], ['lead', 'Lead time (weeks)', 'num', 1], ['need', 'Need-by (project month)', 'num', 1], ['order', 'Planned order (project month)', 'num', 1]] },
  awards: { t: 'Award recommendation', perm: 'quotes', f: [['pkg', 'Package', 'text', 1], ['rec', 'Recommended supplier', 'text', 1], ['why', 'Reason', 'textarea'], ['save', 'Saving', 'text'], ['st', 'Status', 'select', 0, sel(['Proposed', 'Approved', 'Overridden'])]], d: { st: 'Proposed' } },
  est: { t: 'Work package', perm: 'est', f: [['wp', 'Work package', 'text', 1], ['lab', 'Labour (₹ Cr)', 'num'], ['mat', 'Material (₹ Cr)', 'num'], ['sub', 'Subcontract (₹ Cr)', 'num'], ['src', 'Basis', 'text']], d: { lab: 0, mat: 0, sub: 0 } },
  adders: { t: 'Adder', perm: 'est', f: [['name', 'Adder', 'text', 1], ['val', 'Value (₹ Cr)', 'num']] },
  om: { t: 'O&M cost line (year 1)', perm: 'est', f: [['item', 'Cost item', 'text', 1], ['cost', '₹ Cr per year', 'num', 1]] },
  bids: { t: 'Envelope B result', perm: 'nego', f: [['name', 'Bidder', 'text', 1], ['bpc', 'Bid Project Cost (₹ Cr)', 'num', 1], ['us', 'This is our bid', 'check']] },
  npos: { t: 'Negotiation point', perm: 'nego', f: [['topic', 'Item', 'text', 1], ['tender', 'Tender position', 'text'], ['ask', 'Our bid', 'text'], ['walk', 'Walk-away', 'text'], ['agreed', 'Agreed', 'text']] },
  bafo: { t: 'BAFO round', perm: 'nego', f: [['round', 'Round', 'text', 1], ['price', 'Price (₹ Cr)', 'num', 1]] },
  clauses: { t: 'Contract clause', perm: 'contract', f: [['ref', 'Clause ref', 'text', 1], ['title', 'Title', 'text', 1], ['orig', 'Client draft text', 'textarea', 1], ['prop', 'Our proposed text', 'textarea'], ['bid', 'Bid / negotiated position', 'text'], ['st', 'Status', 'select', 0, sel(['Negotiating', 'Agreed', 'Accepted as drafted', 'Escalated'])]], d: { st: 'Negotiating' } },
  drift: { t: 'Contract clause check', perm: 'contract', f: [['clause', 'Clause', 'text', 1], ['bid', 'Bid / negotiated', 'text'], ['con', 'Contract draft', 'text'], ['sev', 'Severity', 'select', 0, sel(['None', 'Low', 'Medium', 'High'])]], d: { sev: 'Medium' } },
  b2b: { t: 'Back-to-back check', perm: 'contract', f: [['clause', 'Topic', 'text', 1], ['main', 'Main contract', 'text'], ['sub', 'Subcontract / PO', 'text'], ['gap', 'Gap', 'text']] },
  obl: { t: 'Obligation', perm: 'contract', f: [['ob', 'Obligation', 'text', 1], ['party', 'Party', 'select', 0, [['Concessionaire', 'Concessionaire (us)'], ['Authority', 'Authority'], ['Independent Engineer', 'Independent Engineer']]], ['due', 'Due / trigger', 'text'], ['bar', 'Time-barred if missed', 'check'], ['done', 'Done', 'check']], d: { party: 'Concessionaire' } },
  bills: { t: 'Running-account bill', perm: 'cadmin', f: [['period', 'Period', 'text', 1], ['claimed', 'Claimed (₹ Cr)', 'num', 1], ['cert', 'Certified by IE (₹ Cr)', 'num'], ['paid', 'Paid (₹ Cr)', 'num'], ['st', 'Status', 'select', 0, sel(['Draft', 'Submitted', 'Certified by IE', 'Paid', 'Disputed'])]], d: { st: 'Draft', cert: 0, paid: 0 } },
  claims: { t: 'Claim / extension of time', perm: 'cadmin', f: [['event', 'Event', 'text', 1], ['notice', 'Notice date', 'date', 1], ['days', 'Extension sought (days)', 'num'], ['val', 'Cost claimed (₹ Cr)', 'num'], ['st', 'Status', 'select', 0, sel(['Draft', 'Notice served', 'Submitted to IE', 'Agreed', 'Rejected', 'Disputed'])]], d: { st: 'Draft', days: 0, val: 0 } },
  bgs: { t: 'Bank guarantee', perm: 'cadmin', f: [['type', 'Type', 'text', 1], ['val', 'Value (₹ Cr)', 'num', 1], ['bank', 'Bank', 'text'], ['exp', 'Expiry', 'date', 1], ['st', 'Status', 'select', 0, sel(['Active', 'Reducing', 'Extended', 'Released'])]], d: { st: 'Active' } },
  deliv: { t: 'Engineering deliverable', perm: 'engd', f: [['doc', 'Document no.', 'text', 1], ['title', 'Title', 'text', 1], ['disc', 'Discipline', 'select', 0, sel(['Process', 'Civil', 'Mechanical', 'Electrical', 'I&C', 'Pipeline'])], ['status', 'Status', 'select', 0, sel(['IFR', 'IFA', 'IFC'])], ['rev', 'Revision', 'text'], ['pct', 'Progress %', 'range', 0, [0, 100, 5]]], d: { status: 'IFR', rev: 'A', pct: 0, disc: 'Process' } },
  tqs: { t: 'Technical query', perm: 'engd', f: [['q', 'Query', 'textarea', 1], ['st', 'Status', 'select', 0, sel(['Open', 'Answered', 'Closed'])]], d: { st: 'Open' } },
  po: { t: 'Purchase order', perm: 'psupply', f: [['item', 'Item', 'text', 1], ['sup', 'Supplier', 'text', 1], ['need', 'Need on site (month)', 'num', 1], ['fc', 'Forecast delivery (month)', 'num', 1], ['exp', 'Expediting', 'select', 0, sel(['On track', 'Chasing', 'Escalated', 'Delivered'])]], d: { exp: 'On track' } },
  vdocs: { t: 'Vendor document', perm: 'psupply', f: [['vendor', 'Vendor', 'text', 1], ['title', 'Document', 'text', 1], ['code', 'Review code', 'select', 0, sel(['Under review', 'Code 1', 'Code 2', 'Code 3'])], ['note', 'Review comment', 'text']], d: { code: 'Under review' } },
  fat: { t: 'FAT / inspection', perm: 'psupply', f: [['item', 'Equipment and test', 'text', 1], ['date', 'Date', 'text'], ['wit', 'Witness', 'text'], ['res', 'Result', 'select', 0, sel(['Scheduled', 'Passed', 'Failed', 'Re-test'])]], d: { res: 'Scheduled' } },
  logi: { t: 'Shipment', perm: 'psupply', f: [['what', 'Contents', 'text', 1], ['mode', 'Mode', 'text'], ['st', 'Status', 'select', 0, sel(['Booked', 'Dispatched', 'In transit', 'Arrived', 'Damaged'])]], d: { st: 'Booked' } },
  wps: { t: 'Work package progress', perm: 'construct', f: [['wp', 'Work package', 'text', 1], ['pct', 'Progress %', 'range', 0, [0, 100, 1]], ['plan', 'Planned rate', 'num'], ['act', 'Actual rate', 'num'], ['unit', 'Rate unit', 'text'], ['note', 'Note', 'text']], d: { pct: 0, plan: 0, act: 0 } },
  diary: { t: 'Site diary entry', perm: 'construct', f: [['date', 'Date', 'date', 1], ['weather', 'Weather', 'text'], ['lab', 'Labour on site', 'num'], ['entry', 'Work done and events', 'textarea', 1]] },
  sched: { t: 'Milestone', perm: 'construct', f: [['ms', 'Milestone', 'text', 1], ['base', 'Baseline (project month)', 'num', 1], ['fc', 'Forecast (project month)', 'num', 1]] },
  row: { t: 'Right-of-way reach', perm: 'construct', f: [['ch', 'Chainage', 'text', 1], ['land', 'Land type', 'text'], ['owner', 'Owner / agency', 'text'], ['status', 'Status', 'text', 1]] },
  itp: { t: 'ITP activity', perm: 'qhse', f: [['act', 'Activity', 'text', 1], ['pt', 'Inspection point', 'select', 0, sel(['Hold', 'Witness', 'Review'])], ['st', 'Status', 'select', 0, sel(['Planned', 'Open', 'In progress', 'Released', 'Failed'])]], d: { pt: 'Witness', st: 'Planned' } },
  ncr: { t: 'Non-conformance', perm: 'qhse', f: [['desc', 'Description', 'textarea', 1], ['party', 'Responsible party', 'text'], ['st', 'Status', 'select', 0, sel(['Open', 'Corrective action', 'Closed'])]], d: { st: 'Open' } },
  permits: { t: 'Permit to work', perm: 'qhse', f: [['type', 'Type', 'select', 0, sel(['Confined space', 'Excavation > 3 m', 'Hot work', 'Working at height', 'Electrical isolation', 'Lifting'])], ['area', 'Area', 'text', 1], ['st', 'Status', 'select', 0, sel(['Requested', 'Active', 'Closed', 'Suspended'])], ['conflict', 'Conflict found', 'text']], d: { st: 'Requested', type: 'Confined space' } },
  weld: { t: 'Weld joint record', perm: 'qhse', f: [['wps', 'WPS', 'text', 1], ['ndt', 'NDT', 'text'], ['res', 'Result', 'select', 0, sel(['Pending', 'Accepted', 'Rejected', 'Repaired'])]], d: { res: 'Pending' } },
  incidents: { t: 'HSE event', perm: 'qhse', f: [['date', 'Date', 'date', 1], ['type', 'Type', 'select', 0, sel(['Near miss', 'First aid', 'Medical treatment', 'LTI', 'Environmental'])], ['desc', 'What happened', 'textarea', 1], ['st', 'Status', 'select', 0, sel(['Open', 'Investigating', 'Closed'])]], d: { type: 'Near miss', st: 'Open' } },
  ctrl: { t: 'Cost line', perm: 'cost', f: [['wp', 'Work package', 'text', 1], ['bud', 'Budget', 'num'], ['com', 'Committed', 'num'], ['act', 'Actual', 'num'], ['fc', 'Forecast at completion', 'num']] },
  changes: { t: 'Change of scope', perm: 'cadmin', f: [['desc', 'Description', 'text', 1], ['val', 'Value (₹ Cr)', 'num'], ['st', 'Status', 'select', 0, sel(['Draft', 'Priced', 'Under review', 'Approved', 'Rejected'])]], d: { st: 'Draft' } },
  cxsys: { t: 'System', perm: 'cx', f: [['sys', 'System', 'text', 1]], d: { p: [0, 0, 0, 0, 0] } },
  punch: { t: 'Punch item', perm: 'cx', f: [['sys', 'System', 'text', 1], ['cat', 'Category', 'select', 0, [['A', 'A: blocks taking-over'], ['B', 'B: before final handover']]], ['desc', 'Description', 'text', 1], ['st', 'Status', 'select', 0, sel(['Open', 'Closed'])]], d: { cat: 'A', st: 'Open' } },
  ptest: { t: 'Guarantee parameter', perm: 'cx', f: [['par', 'Parameter', 'text', 1], ['unit', 'Unit', 'text'], ['dir', 'Guarantee is a', 'select', 0, [['max', 'Maximum'], ['min', 'Minimum']]], ['lim', 'Guaranteed value', 'num', 1], ['meas', 'Latest measured value', 'num']], d: { dir: 'max' } },
  consents: { t: 'Consent', perm: 'cx', f: [['name', 'Consent', 'text', 1], ['st', 'Status', 'text', 1]] },
  turn: { t: 'Turnover area', perm: 'om', f: [['area', 'Area', 'text', 1], ['pct', 'Complete %', 'range', 0, [0, 100, 1]]], d: { pct: 0 } },
  assets: { t: 'Asset', perm: 'om', f: [['asset', 'Asset', 'text', 1], ['loc', 'Location', 'text'], ['make', 'Make / model', 'text'], ['crit', 'Criticality', 'select', 0, sel(['A', 'B', 'C'])]], d: { crit: 'B' } },
  warr: { t: 'Warranty', perm: 'om', f: [['item', 'Item', 'text', 1], ['sup', 'Supplier', 'text'], ['period', 'Period', 'text'], ['exp', 'Expires', 'text'], ['open', 'Open defects', 'num']], d: { open: 0 } },
  staff: { t: 'O&M staffing line', perm: 'om', f: [['role', 'Category', 'text', 1], ['req', 'Required (Sch. O)', 'num', 1], ['mob', 'Mobilised', 'num']], d: { mob: 0 } },
  bva: { t: 'Bid vs actual line', perm: 'om', f: [['item', 'Package / norm', 'text', 1], ['bid', 'Bid', 'num'], ['act', 'Actual', 'num'], ['note', 'Note', 'text']] }
};
