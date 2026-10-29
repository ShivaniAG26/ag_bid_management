// Water & Wastewater pack: configuration catalogue, tenant, showcase tender and every record the screens render.

const TODAY = new Date('2026-10-25T09:00:00');

/* ---------------- setup catalogue (wizard) ---------------- */
const CATALOG = {
  roles: [
    ['epc', 'EPC / main contractor', 'Design, supply, build and commission under one contract'],
    ['db', 'Design-builder', 'Single point of design and construction responsibility'],
    ['om', 'O&M operator', 'Long-term operation, performance and asset care'],
    ['epcm', 'EPCM / consultant', 'Engineering and construction management for the owner']
  ],
  clients: [['muni', 'Municipal corporations'], ['state', 'State utilities and boards'], ['ind', 'Industrial owners'], ['ppp', 'PPP / HAM concessions'], ['intl', 'Multilateral-funded (ADB, World Bank, JICA)']],
  types: [
    ['dw', 'Drinking-water treatment', 'WTP, intake, clarifiers, filters, disinfection'],
    ['stp', 'Sewage treatment', 'STP: SBR, MBBR, ASP, MBR; tertiary and disinfection'],
    ['etp', 'Industrial effluent treatment', 'ETP, CETP, ZLD and evaporators'],
    ['desal', 'Desalination', 'SWRO and brackish RO, intake and outfall'],
    ['reuse', 'Water reuse / recycling', 'Tertiary treatment for industrial or urban reuse'],
    ['pump', 'Pumping & conveyance', 'Pumping stations, rising mains, trunk sewers'],
    ['dist', 'Distribution networks', '24×7 supply, DMAs, house connections, NRW'],
    ['sludge', 'Sludge & biosolids', 'Digestion, drying, biogas and energy recovery']
  ],
  delivery: [
    ['epc', 'EPC / turnkey'], ['db', 'Design-Build'], ['dbo', 'Design-Build-Operate'], ['ham', 'Hybrid annuity (HAM)'], ['epcm', 'EPCM'],
    ['dbb', 'Design-Bid-Build (item rate)'], ['pdb', 'Progressive Design-Build'], ['cmar', 'Construction Management at Risk'], ['boot', 'BOOT / PPP concession']
  ],
  scope: [['eng', 'Engineering / design'], ['supply', 'Equipment supply'], ['inst', 'Installation / construction'], ['cx', 'Testing & commissioning'], ['om', 'Operations & maintenance'], ['cm', 'Procurement / construction management']],
  tech: [
    ['proc', 'Treatment processes', 'Process sizing, mass balance, guarantees'], ['hyd', 'Hydraulics & pumping', 'Hydraulic profile, surge, pump selection'],
    ['pipe', 'Piping, valves & pipelines', 'Alignments, takeoff, trenchless'], ['civil', 'Civil & structural', 'Water-retaining structures, foundations'],
    ['elec', 'Electrical systems', 'HT/LT, SLD, energy'], ['ic', 'Instrumentation & SCADA', 'P&IDs, analysers, online monitoring'],
    ['memb', 'Membranes & filtration', 'UF, RO, disc and media filters'], ['sludge', 'Sludge handling', 'Thickening, dewatering, disposal'],
    ['tc', 'Testing & commissioning', 'Hydro tests, trial run, PG test'], ['omx', 'Operations & maintenance', 'Staffing, consumables, lifecycle cost'],
    ['geo', 'Geotechnical & survey', 'Bore logs, rock, groundwater'], ['env', 'Environmental & consents', 'SPCB consents, discharge norms']
  ],
  workflows: [
    ['intel', 'Tender intelligence', 'Documents, drawings, requirements, rules', 'pre'],
    ['bnb', 'Bid / no-bid review', 'Eligibility, scoring and the G1 decision', 'pre', 'G1'],
    ['eng', 'Engineering & sizing', 'Process and hydraulic calculators, design basis', 'pre'],
    ['boq', 'Takeoff & BOQ review', 'Quantities from drawings vs the client BOQ', 'pre'],
    ['sup', 'Supplier comparison', 'RFQs, quote levelling, long-lead plan', 'pre'],
    ['risk', 'Risk & deviation review', 'Risk register, deviations, clarifications', 'pre'],
    ['est', 'Estimate & pricing', 'Cost build-up, O&M NPV and the G2 price', 'pre', 'G2'],
    ['prop', 'Proposal workspace', 'Structure, drafting, review, compliance, submission', 'prop', 'G3'],
    ['contract', 'Contract & handover', 'Negotiation, contract drift, obligations', 'post', 'G4'],
    ['delivery', 'Delivery control', 'Engineering, procurement, construction, ROW', 'post'],
    ['commission', 'Testing, PG test & O&M', 'Trial run, PG test and O&M handover', 'post', 'G5 · G6']
  ]
};
function fullConfig() {
  const all = k => CATALOG[k].map(x => x[0]);
  return { company: 'Narmada Waterworks EPC Pvt Ltd', country: 'India', hq: 'Ahmedabad, Gujarat', currency: 'INR (₹ Cr)', role: 'epc', clients: all('clients'), size: '₹100–2,000 Cr', types: all('types'), delivery: all('delivery'), scope: all('scope'), tech: all('tech'), workflows: all('workflows') };
}

/* ---------------- people, gates, stages ---------------- */
/* ---------------- people, gates, stages ---------------- */
const ROLES = {
  bid_manager: { name: 'Kavya Menon', title: 'Bid Manager', ini: 'KM' },
  bd_head: { name: 'Sanjay Kulkarni', title: 'BD Head', ini: 'SK' },
  process: { name: 'Meera Shah', title: 'Process Lead', ini: 'MS' },
  ei: { name: 'Dev Nair', title: 'E&I / SCADA Lead', ini: 'DN' },
  pipeline: { name: 'Imran Shaikh', title: 'Pipeline Lead', ini: 'IS' },
  estimator: { name: 'Anita Desai', title: 'Estimator', ini: 'AD' },
  procurement: { name: 'Arun Rao', title: 'Procurement Lead', ini: 'AR' },
  commercial: { name: 'Priya Das', title: 'Commercial Manager', ini: 'PD' },
  contracts: { name: 'Rohit Bansal', title: 'Contracts Manager', ini: 'RB' },
  pd: { name: 'Ravi Kumar', title: 'Project Director', ini: 'RK' },
  site: { name: 'Vikram Patil', title: 'Site Manager', ini: 'VP' },
  qhse: { name: 'Lakshmi Iyer', title: 'QA/QC & HSE Manager', ini: 'LI' },
  om: { name: 'Farhan Qureshi', title: 'O&M Lead', ini: 'FQ' },
  exec: { name: 'Neha Joshi', title: 'Managing Director', ini: 'NJ' },
  admin: { name: 'Suresh Pillai', title: 'Tenant Admin', ini: 'SP' }
};
const GATES = {
  G1: { stage: 4, name: 'Bid / no-bid decision', roles: ['bd_head', 'exec'], tab: 'g1' },
  G2: { stage: 7, name: 'Price approval', roles: ['commercial', 'exec'], tab: 'est', sub: 'approve' },
  G3: { stage: 8, name: 'Submission release', roles: ['bid_manager', 'commercial'], tab: 'psub' },
  G4: { stage: 10, name: 'Contract baseline', roles: ['pd', 'contracts'], tab: 'handover' },
  G5: { stage: 12, name: 'Taking-over after PG test', roles: ['pd', 'process'], tab: 'testing', sub: 'pg' },
  G6: { stage: 13, name: 'Final O&M handover', roles: ['pd', 'om'], tab: 'omh', sub: 'close' }
};
const STAGES = [
  [1, 'Capture', 'brief'], [2, 'Ingest', 'docs'], [3, 'Intelligence', 'reqs'], [4, 'Bid / No-bid', 'g1'], [5, 'Engineering', 'eng'],
  [6, 'Procurement', 'proc'], [7, 'Estimate', 'est'], [8, 'Proposal', 'pstruct'], [9, 'Negotiation', 'nego'], [10, 'Contract', 'contract'],
  [11, 'Delivery', 'cadmin'], [12, 'Testing & PG', 'testing'], [13, 'Handover & O&M', 'omh']
];
// phase → tabs. [id, label, stage, workflow, gate]
const PHASES = [
  { id: 'pre', name: 'Tender Intelligence', tabs: [
    ['brief', 'Tender brief', 1, 'intel'], ['docs', 'Documents', 2, 'intel'], ['reqs', 'Requirements', 3, 'intel'], ['basis', 'Rules & precedence', 3, 'intel'],
    ['elig', 'Eligibility & terms', 3, 'intel'], ['risks', 'Risks', 3, 'risk'], ['clar', 'Clarifications', 3, 'risk'], ['|'],
    ['g1', 'Bid / No-bid', 4, 'bnb', 'G1'], ['eng', 'Engineering', 5, 'eng'], ['proc', 'Procurement', 6, 'sup'], ['est', 'Estimate', 7, 'est', 'G2']] },
  { id: 'prop', name: 'Proposal', tabs: [
    ['~', 'Tech'], ['pstruct', 'Proposal structure', 8, 'prop'], ['pown', 'Ownership & review', 8, 'prop'], ['pdraft', 'Proposal draft', 8, 'prop'],
    ['pcomp', 'Compliance matrix', 8, 'prop'], ['pann', 'Technical annexures', 8, 'prop'], ['~', 'Commercial'], ['pcomm', 'Commercial volume', 8, 'prop'], ['psub', 'Submission', 8, 'prop', 'G3']] },
  { id: 'award', name: 'Award & contract', tabs: [['nego', 'Negotiation & award', 9, 'contract'], ['contract', 'Contract', 10, 'contract'], ['handover', 'Handover to delivery', 10, 'contract', 'G4']] },
  { id: 'deliv', name: 'Delivery', tabs: [['cadmin', 'Contract administration', 11, 'delivery'], ['engd', 'Engineering delivery', 11, 'delivery'], ['psupply', 'Procurement & supply', 11, 'delivery'], ['construct', 'Construction', 11, 'delivery'], ['qhse', 'Quality & HSE', 11, 'delivery'], ['controls', 'Project controls', 11, 'delivery']] },
  { id: 'cx', name: 'Commission & handover', tabs: [['testing', 'Testing & commissioning', 12, 'commission', 'G5'], ['omh', 'Handover & O&M', 13, 'commission', 'G6']] }
];

/* ---------------- showcase opportunity ---------------- */
const OPP = {
  id: 'OPP-WW-0317', name: 'Indrayani 200 MLD STP and Trunk Sewer', short: 'Indrayani 200 MLD STP', client: 'Indrayani Municipal Corporation', loc: 'Pimpri, Maharashtra',
  type: 'stp', types: ['Sewage treatment', 'Pumping & conveyance'], model: 'Hybrid annuity (HAM) + 15 yr O&M', delivery: 'ham',
  value: '₹1,260 Cr', valueN: 1260, submission: '2026-12-05', subLabel: '05 Dec 2026', fit: 72, snapshot: 'snap-0317-03', jv: 'Narmada 74% / Aquaprocess Tech 26%',
  size: [['Design flow', '200 MLD', 'peak factor 2.25'], ['Treated BOD', '< 10 mg/l', 'after Corr-01'], ['O&M period', '15 years', 'after COD'], ['Trunk sewer', '14.2 km', 'DI / MS, 1,200–1,800 mm'], ['Energy guarantee', '0.21 kWh/m³', 'max']],
  desc: 'New 200 MLD sewage treatment plant (SBR with tertiary disc filtration and chlorination), 14.2 km trunk sewer, two intermediate pumping stations and 15 years of operation and maintenance under the hybrid annuity model: 40% construction support, 60% as annuities over the O&M period.',
  dates: [['NIT published', '08 Oct 2026', 'done'], ['Pre-bid meeting', '29 Oct 2026', 'next'], ['Corrigendum cut-off', '20 Nov 2026', ''], ['Technical bid (envelope A)', '05 Dec 2026', ''], ['Financial bid opening', 'Jan 2027', ''], ['COD', '30 months from appointed date', '']]
};

/* Document register. kind: pdf | dwg | xls. Short code is used in citations "code:page:section". */
const DOCS = [
  { id: 'D-01', code: 'itb', short: 'ITB', name: 'NIT and Instructions to Bidders (Vol I)', kind: 'pdf', pages: 48, rev: 'R0', disc: 'Commercial', recv: '08 Oct', state: 'Processed', found: 14, flags: 1 },
  { id: 'D-02', code: 'v2', short: 'Vol II', name: 'Technical specifications: process, civil, mechanical', kind: 'pdf', pages: 386, rev: 'R1', disc: 'Engineering', recv: '08 Oct · R1 30 Oct', state: 'Processed', found: 61, flags: 3 },
  { id: 'D-11', code: 'v3', short: 'Vol III', name: 'Electrical, instrumentation and SCADA specifications', kind: 'pdf', pages: 164, rev: 'R0', disc: 'E&I', recv: '08 Oct', state: 'Processed', found: 22, flags: 0 },
  { id: 'D-03', code: 'ca', short: 'CA', name: 'Draft HAM concession agreement and schedules', kind: 'pdf', pages: 142, rev: 'R0', disc: 'Contract', recv: '08 Oct', state: 'Processed', found: 19, flags: 2 },
  { id: 'D-04', code: 'dwg', short: 'DWG', name: 'Tender drawings: process, civil, E&I, sewer alignment', kind: 'dwg', pages: 96, rev: 'B/C', disc: 'Drawings', recv: '08 Oct', state: 'Review needed', found: 412, flags: 4 },
  { id: 'D-05', code: 'boq', short: 'BOQ', name: 'Schedule B: bill of quantities (percentage rate)', kind: 'xls', pages: 6, rev: 'R1', disc: 'Quantities', recv: '08 Oct · R1 30 Oct', state: 'Processed', found: 1186, flags: 3 },
  { id: 'D-06', code: 'geo', short: 'Geotech', name: 'Geotechnical and topographic survey report', kind: 'pdf', pages: 118, rev: 'R0', disc: 'Survey', recv: '08 Oct', state: 'Processed', found: 9, flags: 1 },
  { id: 'D-07', code: 'raw', short: 'Raw data', name: 'Raw sewage quality, existing Pimpri STP (12 months)', kind: 'xls', pages: 2, rev: '—', disc: 'Process', recv: '29 Oct (site visit)', state: 'Processed', found: 365, flags: 1 },
  { id: 'D-08', code: 'c1', short: 'Corr-01', name: 'Corrigendum 01: effluent standards and tertiary treatment', kind: 'pdf', pages: 3, rev: '01', disc: 'Addendum', recv: '30 Oct', state: 'Impact reviewed', found: 4, flags: 1 },
  { id: 'D-09', code: 'c2', short: 'Corr-02', name: 'Corrigendum 02: similar-work threshold', kind: 'pdf', pages: 2, rev: '02', disc: 'Addendum', recv: '12 Nov', state: 'Impact reviewed', found: 1, flags: 0 },
  { id: 'D-10', code: 'frm', short: 'Forms', name: 'Technical and financial bid formats', kind: 'pdf', pages: 36, rev: 'R0', disc: 'Forms', recv: '08 Oct', state: 'Processed', found: 21, flags: 0 }
];
const COVERAGE = { processed: 1004, excluded: 18, review: 4, failed: 0, total: 1026 };
const COV_ITEMS = [
  ['CV-01', 'D-04', 'Sheets L-201 – L-218 (18)', 'Raster scans at 200 dpi; chainage text OCR below threshold on 4 sheets', 'Needs review'],
  ['CV-02', 'D-02', 'pp. 296–299 (4)', 'Guarantee table spans pages with merged cells', 'Processed'],
  ['CV-03', 'D-05', 'Sheet B-7 rows 40–88', 'Merged header cells; unit column ambiguous (m vs Rm)', 'Processed'],
  ['CV-04', 'D-06', 'pp. 61–72 (12)', 'Bore logs as images; strata read by drawing reader', 'Processed'],
  ['CV-05', 'D-01', 'pp. 1–4 (4)', 'Cover, index and blank pages', 'Excluded'],
  ['CV-06', 'D-10', 'pp. 22–36 (14)', 'Blank formats to be filled; no requirements', 'Excluded']
];
const LANES = [['Parse', 'PyMuPDF + Docling; OCR only for raster sheets and scans'], ['Classify', 'Volume, discipline and section detection'], ['Read drawings', 'Title blocks, symbols, chainage and levels; vector sheets read directly'], ['Extract', 'Requirements, rules, dates, quantities with page anchors'], ['Verify', 'Gold-set checks and human review of low-confidence fields']];

/* Drawing sheets (D-04). mpu = metres per drawing unit, for the measure tool. */
const SHEETS = [
  { no: 'P-001', title: 'STP general layout plan', disc: 'Process', rev: 'B', scale: '1:1000', date: '22 Sep 2026', mpu: 0.8, by: 'RJ', chk: 'SP', fmt: 'Vector PDF' },
  { no: 'P-010', title: 'Hydraulic flow diagram and profile', disc: 'Process', rev: 'C', scale: 'NTS (levels in m RL)', date: '24 Sep 2026', mpu: null, by: 'RJ', chk: 'SP', fmt: 'Vector PDF' },
  { no: 'P-020', title: 'Process flow diagram and mass balance', disc: 'Process', rev: 'B', scale: 'NTS', date: '22 Sep 2026', mpu: null, by: 'AK', chk: 'SP', fmt: 'Vector PDF' },
  { no: 'C-120', title: 'SBR basin: plan and sections', disc: 'Civil', rev: 'A', scale: '1:200', date: '15 Sep 2026', mpu: 0.2, by: 'VG', chk: 'MT', fmt: 'Vector PDF' },
  { no: 'M-301', title: 'Raw sewage pumping station: general arrangement', disc: 'Mechanical', rev: 'A', scale: '1:100', date: '18 Sep 2026', mpu: 0.05, by: 'NS', chk: 'MT', fmt: 'Vector PDF' },
  { no: 'I-401', title: 'P&ID: SBR basin 1 aeration and decanting', disc: 'I&C', rev: 'A', scale: 'NTS', date: '19 Sep 2026', mpu: null, by: 'DK', chk: 'AB', fmt: 'Vector PDF' },
  { no: 'E-001', title: 'Single-line diagram: 22 kV intake and LT distribution', disc: 'Electrical', rev: 'A', scale: 'NTS', date: '19 Sep 2026', mpu: null, by: 'DK', chk: 'AB', fmt: 'Vector PDF' },
  { no: 'L-201', title: 'Trunk sewer plan and profile, ch 0+000 to 7+100', disc: 'Pipeline', rev: 'B', scale: 'H 1:2500 · V 1:250', date: '26 Sep 2026', mpu: 5.56, by: 'PK', chk: 'MT', fmt: 'Raster 200 dpi' }
];
const SHEET_INDEX = [['Process', 14], ['Civil & structural', 32], ['Mechanical', 12], ['Electrical', 11], ['Instrumentation & SCADA', 9], ['Pipeline & sewer', 18]];
const REV_MANIFEST = 'D-01@R0 · D-02@R1 · D-03@R0 · D-04@B · D-05@R1 · D-06@R0 · D-07@— · D-08@01 · D-09@02 · D-10@R0 · D-11@R0';

/* What the drawing reader found on each sheet. t: info | ai | bad. link: tab or ref. */
const SHEET_FINDINGS = {
  'P-001': [['bad', 'Six SBR basins drawn', 'Vol II §3.2.1 specifies four basins in parallel. Vol II governs under ITB §1.4.', 'v2:44:§3.2.1', 'CONTRA-01'], ['bad', 'Tertiary filters not shown', 'Corr-01 adds disc filtration ahead of chlorination; no footprint on rev B.', 'c1:1:§1', 'RISK R-06'], ['ai', 'Units identified: 17', 'Inlet works, IPS, SBR × 6, CCT, sludge sump, thickener, centrifuge house, blower house, admin/lab, 22 kV substation, chlorine shed, DG.', null], ['info', 'Site area 25.6 ha', 'Boundary 640 m × 400 m measured from scale 1:1000.', null]],
  'P-010': [['ai', 'Levels read: 11', 'Inlet TWL 552.40 to outfall 546.10 m RL; total head loss 6.30 m by gravity.', null], ['bad', 'Outfall freeboard 0.30 m over HFL', 'River HFL 545.80 m RL vs outfall 546.10 m. CPHEEO suggests ≥ 0.5 m; raise or add flap gate.', 'v2:44:§3.2.4', 'PBQ-07'], ['info', 'Filter loss allowed: 0.50 m', 'Disc filter step shown dashed: added after Corr-01.', 'c1:1:§1']],
  'P-020': [['ai', 'Mass balance: 9 streams', 'Matches design basis: 200 MLD, BOD 200 → 10 mg/l, sludge 30 t DS/day.', null], ['bad', 'Raw BOD 200 mg/l', 'Site data averages 280 mg/l (D-07). Clarification PBQ-03 open.', 'raw:1:Summary', 'R-01']],
  'C-120': [['ai', 'Basin volume check: 27,000 m³', '50.0 × 90.0 m × 6.0 m SWD = 27,000 m³ per basin; matches BOQ B-1.04 at 4 basins.', 'boq:1:B-1.04'], ['info', 'Wall 450 mm, raft 600 mm, M35', 'Read from section A-A notes.', null]],
  'M-301': [['ai', 'Pumps: 4 + 1 standby shown', 'Tender schedule asks 12 + 1 across inlet pumping (3 wet wells). This sheet covers wet well 1 of 3.', 'v2:44:§3.2.1'], ['info', 'Sump TWL 548.20 / LWL 544.60', 'Effective depth 3.6 m.', null]],
  'I-401': [['ai', 'Instruments read: 14', 'DO, level, flow, pressure and valve position loops; tag list exported to the I/O count.', null], ['bad', 'No NH4-N analyser at basin', 'Vol III §10.2 requires ammonia monitoring; outlet analyser only.', 'v3:274:§10.2', 'REQ-0171']],
  'E-001': [['ai', '2 × 22 kV incomers, 2 × 2.5 MVA', 'Transformers 22/0.433 kV, Dyn11; DG 2 × 1,010 kVA.', null], ['info', 'Connected load 3.9 MW', 'Matches 0.21 kWh/m³ envelope at average flow with 18% margin.', 'v2:302:§11.4']],
  'L-201': [['ai', 'Manholes counted: 71 on this sheet', '142 across L-201 and L-202; RCC 1,500 mm, spacing ≤ 100 m.', 'boq:2:B-7.03'], ['bad', 'Rock from ch 2+100 to 3+400', 'Bore logs BH-07 to BH-11 show weathered basalt at 2.1–2.8 m; BOQ carries 11,200 m³ rock vs 18,400 m³ measured.', 'geo:66:BH-07', 'R-03'], ['bad', 'State highway corridor ch 4+200 → 7+100', 'Right-of-way responsibility not stated in Vol II §7.6.', 'v2:214:§7.6', 'PBQ-04'], ['info', 'OCR confidence 91%', 'Raster sheet; 6 chainage labels sent to review.', null]]
};

/* Readable document pages. Highlights: <mark> (requirement), <mark class="ai"> (AI extraction), <mark class="bad"> (conflict). */
const PAGES = {
  'D-01': {
    toc: [['1', 'Notice inviting tender', 2], ['1.4', 'Order of precedence', 3], ['2', 'Scope of work', 4], ['4', 'Eligibility and qualification', 9], ['6', 'Preparation of bids', 26], ['31', 'Evaluation', 22]],
    pages: {
      2: `<h4>1. Notice Inviting Tender (NIT No. IMC/WSD/STP/2026/14)</h4><p>Indrayani Municipal Corporation invites online bids from eligible bidders for <mark>design, build, finance, operate and transfer of a 200 MLD sewage treatment plant, 14.2 km trunk sewer and two intermediate pumping stations under the Hybrid Annuity Model</mark>, including operation and maintenance for fifteen years after the Commercial Operation Date.</p><table><tr><th>Item</th><th>Detail</th></tr><tr><td>Estimated project cost</td><td>₹1,260.00 Crore</td></tr><tr><td>Bid security (EMD)</td><td><mark>₹12.60 Crore by bank guarantee valid 180 days</mark></td></tr><tr><td>Pre-bid meeting</td><td>29 October 2026, 11:00, Municipal Bhavan</td></tr><tr><td>Bid due date</td><td><mark class="ai">05 December 2026, 15:00 IST (envelope A)</mark></td></tr><tr><td>Bid validity</td><td>180 days</td></tr></table><p>Bids shall be submitted on the MahaTenders portal only. Physical bids will not be accepted.</p>`,
      3: `<h4>1.4 Order of Precedence</h4><p>In case of any conflict between documents forming the bid, the following order of precedence shall apply:</p><p>(a) Corrigenda issued by the Authority, the later prevailing; (b) the Concession Agreement; <mark>(c) Volume II Technical Specifications; (d) Drawings</mark>; (e) Schedule B; (f) other documents.</p><p>Where figured dimensions differ from scaled dimensions on drawings, figured dimensions shall prevail.</p>`,
      4: `<h4>2. Scope of Work</h4><p>2.1 The scope includes inlet works, primary screening and grit removal, secondary biological treatment, disinfection, sludge thickening and dewatering, all electrical, instrumentation and SCADA works, and the trunk sewer from Chikhali to the STP site.</p><p>2.4 <mark class="bad">The treated water reuse pipeline to MIDC Bhosari is excluded from this contract</mark> and will be tendered separately as a future phase.</p><p>2.6 Land for the STP shall be handed over free of encumbrances on the Appointed Date.</p>`,
      9: `<h4>4.2 Technical Qualification</h4><p>(a) <mark>Similar works: The bidder shall have completed, in the last seven years, at least one sewage treatment plant of value not less than 80% of the estimated cost, or two of value not less than 50%, or three of value not less than 35%.</mark></p><p>Similar work means design and construction of an STP of capacity not less than 50 MLD using SBR, ASP, MBBR or equivalent technology.</p><p><mark class="ai">Read with Corrigendum 02: the threshold for three works is now 40%.</mark></p>`,
      10: `<h4>4.2 (b) Financial Capacity</h4><p><mark>Average annual turnover in the last five financial years shall be not less than ₹504 Crore (40% of estimated cost).</mark></p><h4>4.2 (c) O&M Experience</h4><p><mark>The bidder shall have operated an STP of not less than 50 MLD for at least three years.</mark></p>`,
      11: `<h4>4.3 Bid Capacity</h4><p>Available bid capacity = 2.5 × A × N − B, where A is the maximum value of civil works executed in any one year in the last five years, N is the number of years for completion (2.5), and B is the value of existing commitments. <mark>The available bid capacity shall be not less than the estimated cost.</mark></p>`,
      12: `<h4>4.5 Joint Venture</h4><p><mark>A JV of not more than two members is permitted. The lead member shall hold not less than 51% and each other member not less than 26%.</mark> The lead member shall meet not less than 60% of the turnover requirement.</p>`,
      13: `<h4>4.6 Solvency</h4><p><mark>Solvency certificate of not less than ₹250 Crore from a scheduled commercial bank, issued not earlier than three months before the bid due date.</mark></p>`,
      22: `<h4>31. Evaluation of Bids</h4><p>31.1 Envelope A (technical) shall be evaluated on a pass/fail basis against Clause 4. Only bidders qualifying envelope A shall have envelope B opened.</p><p>31.3 <mark>The bidder quoting the lowest Bid Project Cost (BPC) plus the net present value of the O&M cost for fifteen years discounted at 10% shall be the preferred bidder.</mark></p><p>31.5 <mark class="bad">Any indication of price in envelope A shall render the bid non-responsive.</mark></p>`,
      26: `<h4>6.1 Contents of the Technical Bid (Envelope A)</h4><p>The technical bid shall contain the following, in this order, with each section tabbed and page-numbered:</p><p><mark class="ai">(1) Executive summary; (2) Compliance statement and deviations; (3) Design basis and influent characterisation; (4) Process design and guarantees; (5) Hydraulic design and pumping; (6) Trunk sewer methodology; (7) Construction methodology and programme; (8) O&M methodology and staffing; (9) HSE and quality; (10) Organisation and key personnel; (11) Experience.</mark></p><p>The technical bid shall not exceed 400 pages excluding annexures. Data sheets of major equipment shall be annexed in Form T-9.</p>`
    }
  },
  'D-02': {
    toc: [['2', 'Scope of work', 20], ['3.1', 'Design basis', 42], ['3.2', 'Secondary treatment (SBR)', 44], ['5.3', 'Sludge dewatering', 141], ['7.1', 'Pipe materials', 198], ['7.6', 'Highway crossings and ROW', 214], ['11.2', 'Process guarantees', 296], ['11.4', 'Energy guarantee', 302]],
    pages: {
      20: `<h4>2. Scope of Work: STP</h4><p>2.1 Inlet chamber, mechanical fine screens (3 working + 1 standby, 6 mm), vortex grit chambers (2 + 1), raw sewage pumping, SBR basins, decanters, air blowers and fine-bubble diffusers, <mark class="ai">tertiary filtration (added by Corrigendum 01)</mark>, chlorine contact tank, sludge sump, gravity thickener, centrifuges, polymer dosing, chlorination, admin building, laboratory and SCADA.</p><p>2.3 Treated effluent shall be discharged to the Indrayani river through an outfall structure designed for the 100-year high flood level.</p>`,
      42: `<h4>3.1 Design Basis</h4><p>The plant shall be designed for the following raw sewage characteristics:</p><table><tr><th>Parameter</th><th>Unit</th><th>Design value</th></tr><tr><td>Average flow</td><td>MLD</td><td><mark>200</mark></td></tr><tr><td>Peak factor</td><td>—</td><td>2.25</td></tr><tr><td>BOD₅</td><td>mg/l</td><td><mark class="bad">200</mark></td></tr><tr><td>COD</td><td>mg/l</td><td>450</td></tr><tr><td>TSS</td><td>mg/l</td><td>300</td></tr><tr><td>TKN / NH₄-N</td><td>mg/l</td><td>45 / 35</td></tr><tr><td>Total P</td><td>mg/l</td><td>7</td></tr></table><p>Bidders are advised to satisfy themselves of the raw sewage quality. No claim shall be entertained on account of variation within ±15% of the above values.</p>`,
      44: `<h4>3.2 Secondary Treatment</h4><p>3.2.1 <mark>Secondary treatment shall be by Sequential Batch Reactor (SBR) with a minimum of four basins operating in parallel</mark>, each capable of treating 25% of the design flow. Cycle time shall not exceed 4 hours at average flow.</p><p>3.2.2 Aeration shall be by fine-bubble membrane diffusers with dissolved-oxygen control in each basin. <mark class="ai">Air blowers shall be provided with n+1 redundancy and variable-frequency drives.</mark></p><p>3.2.3 Decanters shall be of the motorised, floating-weir type with a decant rate not exceeding 1.5 m/h.</p><p>3.2.4 The hydraulic profile shall maintain a minimum free fall of 0.5 m at the outfall over the 100-year HFL.</p>`,
      141: `<h4>5.3 Sludge Dewatering</h4><p><mark>Thickened sludge shall be dewatered by centrifuges to not less than 20% dry solids</mark>, with 2 working and 1 standby units sized for 20 hours of operation per day. Polymer consumption shall not exceed 8 kg per tonne of dry solids.</p><p>Dewatered cake shall be disposed of to the Authority's designated composting facility at Moshi, 11 km from the site.</p>`,
      198: `<h4>7.1 Pipe Materials</h4><p><mark>Trunk sewer up to 1,200 mm diameter shall be ductile iron K9 with internal high-alumina cement mortar lining; above 1,200 mm, MS with epoxy lining (min. 400 µm DFT).</mark></p><p>Manholes shall be RCC M30 of 1,500 mm internal diameter at not more than 100 m spacing and at every change of direction.</p>`,
      214: `<h4>7.6 Highway Crossings</h4><p>7.6.1 The alignment between ch 4+200 and 8+000 runs along State Highway 55. <mark class="bad">Necessary permissions for laying along and across the highway shall be obtained.</mark></p><p>7.6.2 Crossings of the highway shall be by trenchless methods. Open cutting of the carriageway is not permitted.</p>`,
      296: `<h4>11.2 Process Performance Guarantees</h4><table><tr><th>Parameter</th><th>Guaranteed value</th></tr><tr><td>BOD₅</td><td><mark class="bad">&lt; 20 mg/l</mark></td></tr><tr><td>TSS</td><td>&lt; 30 mg/l</td></tr><tr><td>Fecal coliform</td><td>&lt; 230 MPN/100 ml</td></tr><tr><td>Sludge dryness</td><td>≥ 20% DS</td></tr></table><p>Guarantees shall be demonstrated during a 90-day performance guarantee test after trial run.</p>`,
      302: `<h4>11.4 Energy Guarantee</h4><p><mark>The specific energy consumption of the plant shall not exceed 0.21 kWh per m³ of sewage treated</mark>, demonstrated over the 90-day performance guarantee test at not less than 80% of design flow.</p><p>Energy shall be measured at the 22 kV incomer. <mark class="ai">Whether the intermediate pumping stations are included is not stated.</mark></p><p>For every 0.01 kWh/m³ above the guarantee, liquidated damages of ₹1.2 Crore per year shall apply over the O&M period.</p>`
    }
  },
  'D-11': {
    toc: [['10.2', 'Online monitoring', 274]],
    pages: { 274: `<h4>10.2 Online Effluent Monitoring</h4><p><mark>Online analysers for BOD, COD, TSS, pH, NH₄-N and flow shall be installed at the STP outlet and linked to the MPCB/CPCB server</mark> through a secure gateway as per CPCB guidelines (2018).</p><p><mark class="ai">Ammonia (NH₄-N) shall also be monitored in each SBR basin for nitrification control.</mark></p><p>The SCADA shall use open protocols (Modbus TCP, OPC UA) and provide 1-second historian resolution.</p>` }
  },
  'D-03': {
    toc: [['9.1', 'Performance security', 28], ['10', 'Land and right of way', 31], ['23.1', 'Payment', 61], ['23.6', 'Annuity delay', 64], ['34', 'Damages', 88], ['Sch. O', 'Staffing', 131]],
    pages: {
      28: `<h4>9.1 Performance Security</h4><p><mark>The Concessionaire shall furnish a performance security of 5% of the Bid Project Cost</mark> within 30 days of the Letter of Award, valid until 60 days after COD, and thereafter an O&M security of 2.5% for the O&M period.</p>`,
      31: `<h4>10. Land and Right of Way</h4><p>10.1 The Authority shall hand over the STP site of 25.6 ha on the Appointed Date.</p><p>10.3 <mark class="bad">The Authority shall make reasonable efforts to procure right of way for the trunk sewer.</mark> Delay in right of way beyond 90 days shall entitle the Concessionaire to extension of time.</p>`,
      61: `<h4>23.1 Construction Support and Annuity</h4><p><mark>40% of the Bid Project Cost shall be paid as construction support in five milestone instalments; the balance 60% shall be paid as 30 bi-annual annuities over the O&M period</mark>, with interest at bank rate + 3% on the reducing balance.</p>`,
      64: `<h4>23.6 Delayed Payment</h4><p><mark class="bad">Annuities not paid within 30 days of the due date shall carry interest at the bank rate.</mark></p>`,
      88: `<h4>34. Damages for Delay</h4><p><mark>Damages for delay in COD shall be 0.1% of the Bid Project Cost per day, subject to a maximum of 10%.</mark></p>`,
      131: `<h4>Schedule O: Minimum O&M Staffing</h4><table><tr><th>Category</th><th>Nos</th></tr><tr><td>Plant manager</td><td>1</td></tr><tr><td>Process engineers</td><td>3</td></tr><tr><td>Shift operators (3 shifts)</td><td>18</td></tr><tr><td>Electricians / fitters</td><td>12</td></tr><tr><td>Lab chemists</td><td>4</td></tr><tr><td>Helpers and security</td><td>8</td></tr><tr><th>Total</th><th><mark>46</mark></th></tr></table>`
    }
  },
  'D-06': {
    toc: [['1', 'Summary of findings', 12], ['6', 'Bore logs BH-07 to BH-11', 66]],
    pages: {
      12: `<h4>1. Summary of Findings</h4><p>Twenty-two boreholes were drilled along the sewer alignment and six at the STP site. Groundwater was met between 1.8 m and 3.4 m below ground level in October 2026.</p><p><mark>Weathered to moderately weathered basalt was encountered between ch 2+100 and 3+400 at depths of 2.1 to 2.8 m</mark>, requiring controlled blasting or rock breakers.</p><p>Safe bearing capacity at the STP site is 250 kN/m² at 2.5 m depth.</p>`,
      66: `<h4>6. Bore Log BH-07 (ch 2+340)</h4><p>Ground level 556.20 m RL. Water table 2.4 m bgl.</p>{BORELOG}<p><mark class="bad">Rock (RQD 42%) from 2.1 m. Trench invert at this chainage is 4.6 m bgl, so 2.5 m of rock excavation is needed across the full trench width.</mark></p>`
    }
  },
  'D-08': {
    toc: [['1', 'Treated effluent standards', 1]],
    pages: { 1: `<h4>Corrigendum No. 01 (30 October 2026)</h4><p><b>1. Treated effluent standards.</b> In view of the National Green Tribunal order dated 30.04.2019, <mark>the treated effluent standards in Vol II §11 are revised to BOD &lt; 10 mg/l, TSS &lt; 10 mg/l, fecal coliform &lt; 100 MPN/100 ml</mark>.</p><p><b>2.</b> <mark class="ai">Tertiary filtration (disc or cloth media) shall be provided ahead of chlorination</mark> to meet the revised standards.</p><p><b>3.</b> Schedule B is revised accordingly. Bidders shall quote on the revised Schedule B (R1).</p>` }
  },
  'D-09': {
    toc: [['1', 'Qualification threshold', 1]],
    pages: { 1: `<h4>Corrigendum No. 02 (12 November 2026)</h4><p><mark>ITB Clause 4.2(a): for three similar works, the threshold is revised from 35% to 40% of the estimated cost each, completed in the last seven years.</mark> All other conditions remain unchanged.</p>` }
  },
  'D-10': {
    toc: [['T-1', 'Letter of technical bid', 3], ['F-1', 'Financial bid format (envelope B)', 30]],
    pages: {
      3: `<h4>Form T-1: Letter of Technical Bid</h4><p>To, The Commissioner, Indrayani Municipal Corporation. We, the undersigned, offer to design, build, finance, operate and transfer the Project in conformity with the Bidding Documents. <mark>We confirm that this envelope contains no price information.</mark></p>`,
      30: `<h4>Form F-1: Financial Bid (Envelope B)</h4><div class="stamp">ENVELOPE B · SEALED</div><p>Bid Project Cost (₹ Crore): ____________</p><p>O&M cost for years 1 to 15 (₹ Crore per year): ____________</p><p><mark class="bad">This format shall be submitted only in envelope B.</mark> bidPlan's envelope guard keeps priced content out of the technical volume and out of supplier RFQs.</p>`
    }
  }
};

/* Spreadsheet documents */
const XL = {
  'D-05': [
    { name: 'B-1 Process civil', head: ['Item', 'Description', 'Unit', 'Qty (client)', 'Qty (our takeoff)', 'Δ %', 'Source'], rows: [
      ['B-1.01', 'Excavation in all soils for STP structures', 'm³', 142000, 146800, 3.4, 'C-120, P-001'],
      ['B-1.04', 'RCC M35 for SBR basins incl. waterproofing', 'm³', 21600, 21600, 0, 'C-120'],
      ['B-1.06', 'Reinforcement Fe 500D', 't', 2810, 2865, 2.0, 'C-120 notes'],
      ['B-1.12', 'RCC chlorine contact tank', 'm³', 1840, 1840, 0, 'P-001'],
      ['B-1.15', 'Tertiary filter building (Corr-01)', 'm²', 0, 1450, null, 'Corr-01'],
      ['B-1.20', 'Outfall structure to river', 'LS', 1, 1, 0, 'P-010']] },
    { name: 'B-2 Mechanical', head: ['Item', 'Description', 'Unit', 'Qty (client)', 'Qty (our takeoff)', 'Δ %', 'Source'], rows: [
      ['B-2.01', 'Fine screens 6 mm, 3W + 1S', 'no', 4, 4, 0, 'Vol II §2.1'],
      ['B-2.11', 'Air blower 6,500 Nm³/h with VFD', 'no', 7, 7, 0, 'Calculator'],
      ['B-2.14', 'Fine-bubble diffusers', 'no', 15200, 15200, 0, 'C-120'],
      ['B-2.20', 'Raw sewage pumps 1,800 m³/h', 'no', 13, 13, 0, 'M-301'],
      ['B-3.02', 'Disc filter (tertiary), 50 MLD unit', 'no', 0, 4, null, 'Corr-01'],
      ['B-5.01', 'Centrifuge 60 m³/h', 'no', 3, 3, 0, 'Vol II §5.3']] },
    { name: 'B-7 Pipelines', head: ['Item', 'Description', 'Unit', 'Qty (client)', 'Qty (our takeoff)', 'Δ %', 'Source'], rows: [
      ['B-7.01', 'Excavation in soft soil for trench', 'm³', 212000, 204600, -3.5, 'L-201/202'],
      ['B-7.03', 'DI K9 pipe 1,200 mm laid and jointed', 'm', 8100, 8360, 3.2, 'L-201/202'],
      ['B-7.08', 'MS pipe 1,600 mm epoxy lined', 'm', 5840, 5840, 0, 'L-201/202'],
      ['B-7.11', 'RCC manhole 1,500 mm', 'no', 142, 142, 0, 'L-201/202'],
      ['B-7.15', 'Rock excavation in trench', 'm³', 11200, 18400, 64.3, 'Geotech BH-07–11'],
      ['B-7.21', 'Microtunnelling 1,600 mm at highway', 'm', 0, 210, null, 'Vol II §7.6.2']] }
  ],
  'D-07': [
    { name: 'Monthly averages', head: ['Month', 'Flow (MLD)', 'BOD (mg/l)', 'COD (mg/l)', 'TSS (mg/l)', 'NH₄-N (mg/l)', 'Samples'], rows: [
      ['Oct 2025', 142, 262, 540, 318, 38, 31], ['Nov 2025', 138, 271, 552, 309, 39, 30], ['Dec 2025', 135, 288, 590, 322, 41, 31], ['Jan 2026', 133, 296, 604, 330, 42, 31],
      ['Feb 2026', 131, 302, 611, 335, 43, 28], ['Mar 2026', 134, 298, 602, 331, 42, 31], ['Apr 2026', 136, 291, 588, 326, 41, 30], ['May 2026', 137, 294, 595, 328, 42, 31],
      ['Jun 2026', 158, 241, 498, 289, 34, 30], ['Jul 2026', 181, 214, 446, 262, 30, 31], ['Aug 2026', 176, 226, 470, 270, 31, 31], ['Sep 2026', 161, 274, 561, 312, 37, 30]] }
  ]
};

/* ---------------- tender intelligence records ---------------- */
const BRIEF = {
  summary: 'A public HAM tender with a two-envelope process: technical qualification first, then the lowest Bid Project Cost plus NPV of 15-year O&M wins. The plant must meet BOD < 10 mg/l (Corrigendum 01) and 0.21 kWh/m³ during a 90-day PG test before COD. Land is available; 3.8 km of the sewer runs along State Highway 55 with right-of-way responsibility unclear.',
  facts: [['Contract model', 'HAM: 40% construction support, 60% as 30 bi-annual annuities', 'ca:61:§23.1'], ['Evaluation', 'Lowest BPC + NPV of O&M at 10%', 'itb:22:§31.3'], ['Performance security', '5% of BPC', 'ca:28:§9.1'], ['Bid security (EMD)', '₹12.6 Cr BG, 180 days', 'itb:2:NIT'], ['Treated effluent', 'BOD < 10, TSS < 10, FC < 100 MPN', 'c1:1:§1'], ['Delay damages', '0.1% of BPC per day, cap 10%', 'ca:88:§34'], ['Energy LD', '₹1.2 Cr/yr per 0.01 kWh/m³ over', 'v2:302:§11.4'], ['Technical bid', '≤ 400 pages, 11 mandated sections', 'itb:26:§6.1']]
};
const STAKE = [
  ['City Engineer (Water Supply & Drainage)', 'Indrayani MC', 'Tender inviting authority', 'Neutral'],
  ['Project Management Consultant', 'Hydroplan Associates', 'Evaluates technical bids', 'Process-focused'],
  ['Regional Officer', 'Maharashtra Pollution Control Board', 'Consent to operate', 'Regulator'],
  ['AMRUT 2.0 cell', 'State Urban Development Dept', 'Funding agency', 'Supportive']
];
const COMP = [['Vishwa Aqua Infra', '4 of 9 recent STP tenders (L1)', '₹5.9 Cr/MLD (Nashik, 2025)', 'Aggressive on O&M annuity'], ['Ganga Enviro JV', '2 of 9', '₹6.4 Cr/MLD (Surat, 2026)', 'Foreign process licensor in JV'], ['Deccan Hydro Projects', '1 of 9', '₹6.1 Cr/MLD (Solapur, 2025)', 'Strong on pipelines']];

// sec = proposal section key that answers it
const REQS = [
  { id: 'REQ-0112', cat: 'Process', text: 'Secondary treatment by SBR with minimum 4 basins in parallel, each for 25% of flow.', mand: true, src: 'v2:44:§3.2.1', st: 'accepted', sec: 'proc', owner: 'process' },
  { id: 'REQ-0118', cat: 'Performance', text: 'Treated effluent BOD < 10 mg/l, TSS < 10 mg/l, FC < 100 MPN/100 ml.', mand: true, src: 'c1:1:§1', st: 'accepted', sec: 'basis', owner: 'process' },
  { id: 'REQ-0121', cat: 'Process', text: 'Tertiary disc or cloth-media filtration ahead of chlorination.', mand: true, src: 'c1:1:§2', st: 'accepted', sec: 'proc', owner: 'process' },
  { id: 'REQ-0124', cat: 'Hydraulics', text: 'Minimum free fall of 0.5 m at the outfall over the 100-year HFL.', mand: true, src: 'v2:44:§3.2.4', st: 'proposed', sec: 'hyd', owner: 'process', clar: 'PBQ-07' },
  { id: 'REQ-0131', cat: 'Energy', text: 'Specific energy ≤ 0.21 kWh/m³ over the 90-day PG test.', mand: true, src: 'v2:302:§11.4', st: 'proposed', sec: 'energy', owner: 'ei', clar: 'PBQ-05' },
  { id: 'REQ-0140', cat: 'Pipeline', text: 'DI K9 up to 1,200 mm; MS epoxy-lined above 1,200 mm.', mand: true, src: 'v2:198:§7.1', st: 'accepted', sec: 'sewer', owner: 'pipeline' },
  { id: 'REQ-0144', cat: 'Pipeline', text: 'Trenchless crossings of State Highway 55; no open cut of carriageway.', mand: true, src: 'v2:214:§7.6.2', st: 'accepted', sec: 'sewer', owner: 'pipeline' },
  { id: 'REQ-0156', cat: 'Sludge', text: 'Sludge dewatered to ≥ 20% DS by centrifuge (2W + 1S).', mand: true, src: 'v2:141:§5.3', st: 'accepted', sec: 'sludge', owner: 'process' },
  { id: 'REQ-0171', cat: 'SCADA', text: 'Online BOD, COD, TSS, pH, NH₄-N analysers at outlet linked to MPCB server.', mand: true, src: 'v3:274:§10.2', st: 'proposed', sec: 'eic', owner: 'ei' },
  { id: 'REQ-0188', cat: 'O&M', text: 'Minimum O&M staffing of 46 personnel across three shifts.', mand: true, src: 'ca:131:Sch. O', st: 'accepted', sec: 'om', owner: 'om' },
  { id: 'REQ-0192', cat: 'Testing', text: '90-day PG test at ≥ 80% design flow before COD.', mand: true, src: 'v2:296:§11.2', st: 'accepted', sec: 'cx', owner: 'process' },
  { id: 'REQ-0201', cat: 'Format', text: 'No price information anywhere in envelope A.', mand: true, src: 'itb:22:§31.5', st: 'accepted', sec: 'comp', owner: 'bid_manager' },
  { id: 'REQ-0205', cat: 'Programme', text: 'COD within 30 months of the Appointed Date.', mand: true, src: 'itb:2:NIT', st: 'accepted', sec: 'prog', owner: 'pd' }
];
const RULES = [
  { id: 'R-01', rule: 'Raw BOD design value 200 mg/l', check: 'Site data D-07: 12-month mean 271 mg/l, dry-season 295 mg/l', state: 'open', src: 'v2:42:§3.1' },
  { id: 'R-02', rule: 'Corr-01 governs over Vol II §11.2 guarantee table', check: 'BOD 10 mg/l applied in basis, calculator and proposal', state: 'pass', src: 'itb:3:§1.4' },
  { id: 'R-03', rule: 'Vol II governs over drawings (4 basins, not 6)', check: 'Priced at 4 × 50 MLD; 6-basin layout noted as alternate', state: 'pass', src: 'itb:3:§1.4' },
  { id: 'R-04', rule: 'Outfall free fall ≥ 0.5 m over HFL', check: 'P-010 shows 0.30 m', state: 'open', src: 'v2:44:§3.2.4' },
  { id: 'R-05', rule: 'Envelope A carries no price', check: 'Scanned 14 draft sections: 0 prices found', state: 'pass', src: 'itb:22:§31.5' }
];
const BASIS = [
  ['Average design flow', '200 MLD', 'v2:42:§3.1', 'accepted'], ['Peak factor', '2.25', 'v2:42:§3.1', 'accepted'], ['Raw BOD / COD / TSS', '200 / 450 / 300 mg/l', 'v2:42:§3.1', 'proposed'],
  ['Treated BOD / TSS / FC', '< 10 / < 10 / < 100 MPN', 'c1:1:§1', 'accepted'], ['SBR basins', '4 × 27,000 m³ (50 × 90 × 6.0 m)', 'v2:44:§3.2.1', 'accepted'],
  ['Sludge dryness', '≥ 20% DS', 'v2:141:§5.3', 'accepted'], ['Specific energy', '≤ 0.21 kWh/m³', 'v2:302:§11.4', 'proposed'], ['Outfall level vs HFL', '546.10 vs 545.80 m RL', 'dwg:P-010', 'proposed']
];
const PREQUAL = [
  ['Similar works: 1 ≥ 80%, 2 ≥ 50% or 3 ≥ 40% (7 yrs)', '2 × ₹630 Cr', 'Vadodara 150 MLD ₹690 Cr; Rajkot 120 MLD ₹642 Cr', 'pass', 'itb:9:§4.2(a)'],
  ['Average annual turnover (5 yrs)', '≥ ₹504 Cr', '₹1,120 Cr', 'pass', 'itb:10:§4.2(b)'],
  ['Bid capacity 2.5 × A × N − B', '≥ ₹1,260 Cr', '₹2,960 Cr', 'pass', 'itb:11:§4.3'],
  ['JV: lead ≥ 51%, other ≥ 26%', '51 / 26', 'Narmada 74% / Aquaprocess 26%', 'pass', 'itb:12:§4.5'],
  ['Solvency certificate', '≥ ₹250 Cr', 'Requested from Bank of Baroda', 'review', 'itb:13:§4.6'],
  ['O&M of STP ≥ 50 MLD for 3 years', '1 contract', 'Vadodara 150 MLD O&M since 2021', 'pass', 'itb:10:§4.2(c)']
];
const RISKS = [
  { id: 'R-01', risk: 'Raw sewage BOD 35–48% above design basis (site data)', l: 4, i: 5, treat: 'Clarify', val: 0, owner: 'process', src: 'raw:1:Summary' },
  { id: 'R-02', risk: 'Right-of-way along SH-55 (3.8 km) not in Authority scope', l: 4, i: 4, treat: 'Clarify', val: 0, owner: 'pipeline', src: 'v2:214:§7.6' },
  { id: 'R-03', risk: 'Rock excavation 64% above client BOQ (BH-07 to BH-11)', l: 4, i: 3, treat: 'Price', val: 8.4, owner: 'estimator', src: 'geo:66:BH-07' },
  { id: 'R-04', risk: 'Energy guarantee 0.21 kWh/m³ with tertiary filters added', l: 3, i: 4, treat: 'Price', val: 6.0, owner: 'ei', src: 'v2:302:§11.4' },
  { id: 'R-05', risk: 'Annuity payment delays: interest only at bank rate', l: 3, i: 4, treat: 'Price', val: 12.2, owner: 'commercial', src: 'ca:64:§23.6' },
  { id: 'R-06', risk: 'Tertiary filter footprint not on layout P-001 rev B', l: 2, i: 3, treat: 'Accept', val: 1.1, owner: 'process', src: 'dwg:P-001' }
];
const CLARS = [
  { id: 'PBQ-03', q: 'Vol II §3.1 gives raw BOD 200 mg/l; 12-month data at the existing Pimpri STP averages 271 mg/l (dry season 295 mg/l). Please confirm the design basis.', src: 'v2:42:§3.1', status: 'open' },
  { id: 'PBQ-04', q: 'Please confirm who obtains right-of-way along State Highway 55 between ch 4+200 and 8+000.', src: 'v2:214:§7.6', status: 'open' },
  { id: 'PBQ-05', q: 'Is the energy guarantee measured including or excluding the two intermediate pumping stations?', src: 'v2:302:§11.4', status: 'open' },
  { id: 'PBQ-07', q: 'P-010 shows outfall invert 0.30 m above HFL against the 0.5 m minimum in §3.2.4. May the bidder raise the outfall or provide a flap gate?', src: 'dwg:P-010', status: 'draft' },
  { id: 'PBQ-01', q: 'Confirm whether the reuse pipeline to MIDC is excluded.', src: 'itb:4:§2.4', status: 'answered', a: 'Excluded; future phase (pre-bid minutes item 4).' }
];
const ADDENDA = [
  { no: 'Corr-01', date: '30 Oct 2026', doc: 'D-08', title: 'Treated BOD tightened from 20 to 10 mg/l; tertiary filtration added', impact: ['Design basis re-opened (2 fields)', 'Tertiary disc filters added: 4 × 50 MLD', '11 BOQ lines changed; Schedule B R1', 'Proposal sections 3, 4 and 9 marked for redraft'] },
  { no: 'Corr-02', date: '12 Nov 2026', doc: 'D-09', title: 'Similar-work threshold for three works raised from 35% to 40%', impact: ['Eligibility re-run: still pass'] }
];
const DEVS = [
  { id: 'DEV-02', clause: 'Vol II §5.3', text: 'Screw press in place of centrifuge for one of three streams; meets 20% DS at 40% lower energy.', status: 'proposed' },
  { id: 'DEV-04', clause: 'Vol II §7.4', text: 'Microtunnelling at 3 nala crossings in addition to the highway, to avoid monsoon open-cut delay.', status: 'accepted' }
];
const G1 = { rows: [['Strategic fit', 20, 4], ['Technical capability', 20, 4], ['Commercial risk', 20, 2], ['Competition', 15, 2], ['Resource availability', 15, 3], ['Client relationship', 10, 3]], ko: [['Pre-qualification met (solvency pending)', true], ['JV agreement signed', true], ['No unlimited O&M liability', true]], bidCost: 0.9, similar: ['Vadodara 150 MLD STP: won (2021)', 'Nashik 90 MLD HAM: lost, L2 by 1.8% (2025)'] };

const CALC = {
  inputs: [['mld', 'Average flow', 'MLD', 200, 50, 400, 10], ['bod', 'Raw BOD', 'mg/l', 200, 150, 350, 10], ['pf', 'Peak factor', '', 2.25, 1.5, 3, 0.05], ['basins', 'SBR basins', 'no', 4, 2, 8, 1]],
  compute(v) {
    const flow = v.mld * 1000, peak = flow * v.pf / 24, load = flow * v.bod / 1e6;
    const vol = Math.round(flow / v.basins * (0.4 + v.bod / 1500));
    const air = Math.round(load * 1.5 * 1000 / 24 / 0.28 / 0.21 / 1.2);
    const blowers = Math.ceil(air / 6500) + 1, pumps = Math.ceil(peak / 1800) + 1;
    const kwh = 0.103 + v.bod / 2000, sludge = Math.round(load * 0.75);
    return {
      kpis: [['BOD load', load.toFixed(1) + ' t/day'], ['Peak flow', Math.round(peak).toLocaleString('en-IN') + ' m³/h'], ['Specific energy', kwh.toFixed(3) + ' kWh/m³', kwh <= 0.21 ? 'ok' : 'bad'], ['Dry sludge', sludge + ' t DS/day']],
      rows: [['SBR basin volume (each)', vol.toLocaleString('en-IN') + ' m³', 'Tender: 4 × 27,000 m³', Math.abs(vol - 27000) < 1500], ['Air blowers 6,500 Nm³/h (n+1)', blowers, 'Tender: 6 + 1 standby', blowers === 7], ['Raw sewage pumps 1,800 m³/h (n+1)', pumps, 'Tender: 12 + 1 standby', pumps === 13 || pumps === 12], ['Dry sludge produced', sludge + ' t/day', 'Tender: 30 t/day', Math.abs(sludge - 30) < 3], ['Energy guarantee check', kwh.toFixed(3) + ' kWh/m³', 'Guarantee ≤ 0.21', kwh <= 0.21]]
    };
  }
};
const PROCESS = [['BOD (mg/l)', 200, 10, 'NGT 10'], ['TSS (mg/l)', 300, 10, 'NGT 10'], ['COD (mg/l)', 450, 50, 'CPCB 50'], ['NH₄-N (mg/l)', 35, 5, 'CPCB 5'], ['Fecal coliform (MPN/100 ml)', '10⁷', '< 100', 'NGT 230'], ['Total P (mg/l)', 7, 1, 'MPCB 1']];
const TAKEOFF = [['MH', 'Manholes RCC 1,500 mm', 142, 'proposed'], ['DI', 'DI K9 1,200 mm (m)', 8360, 'accepted'], ['MS', 'MS 1,600 mm epoxy (m)', 5840, 'proposed'], ['XING', 'Trenchless crossings', 9, 'proposed'], ['ROCK', 'Rock in trench (m³)', 18400, 'proposed']];
const PKGS = [['Air blowers and diffusers', 12, 3, 'Levelled', '18 Nov'], ['Pumps (raw sewage, IPS)', 16, 4, 'Levelling', '18 Nov'], ['Tertiary disc filters', 8, 3, 'Quotes in', '22 Nov'], ['DI and MS pipes', 10, 4, 'Quotes in', '20 Nov'], ['Centrifuges and polymer', 9, 3, 'RFQ out', '22 Nov'], ['Microtunnelling (sub-contract)', 4, 2, 'RFQ out', '24 Nov']];
const LEV = {
  pkg: 'Air blowers and diffusers · 7 × 6,500 Nm³/h',
  sup: [['Aerzen-Kirloskar', 21.8, 'Covered', 26, 'FOR site', 'Compliant'], ['Hydrotech Blowers', 18.6, 'Excludes diffusers', 22, 'Ex-works', '2 deviations'], ['Turbomax Air', 24.9, 'Covered', 30, 'FOR site', 'Compliant']],
  adders: [['Missing diffusers (filler)', [0, 4.1, 0]], ['Freight to site', [0, 0.6, 0]], ['Energy pass-through at duty point', [0, 1.9, -0.8]], ['15-year O&M spares', [1.2, 2.0, 0.9]], ['Performance bond', [0.3, 0.3, 0.3]]]
};
const LONGLEAD = [['Air blowers (7)', 26, 'Month 16', 'Month 9', 3], ['Raw sewage pumps (13)', 30, 'Month 14', 'Month 6', 1], ['MS pipe 1,600 mm', 20, 'Month 5', 'Month 1', -2], ['Large valves and penstocks', 24, 'Month 15', 'Month 9', 2], ['Disc filters (4)', 28, 'Month 20', 'Month 12', 2], ['MCC / VFD panels', 22, 'Month 17', 'Month 11', 4]];
const EST = [['Inlet works and pretreatment', 9, 28, 6], ['Secondary process (SBR)', 34, 142, 18], ['Tertiary and disinfection', 6, 44, 3], ['Sludge handling', 5, 31, 4], ['Civil and structural', 61, 168, 22], ['Pumping stations (2 IPS)', 8, 36, 7], ['Trunk sewer 14.2 km', 48, 226, 41], ['Electrical (22 kV, MCC, VFD)', 7, 52, 5], ['I&C / SCADA and analysers', 3, 19, 6], ['Preliminaries and design', 57, 6, 4]];
const ADDERS = [['Priced contingency (risk register)', 27.7], ['Bonds and insurance', 7.1], ['Escalation (WPI-linked)', 14.0], ['Financing during construction', 18.4]];
const SCEN = [['Safe', 11, 18], ['Competitive', 7.5, 31], ['Aggressive', 4.5, 46], ['Value-engineered', 8, 38, 'Screw press + microtunnelling (−₹19 Cr)']];
const OM = { rows: [['Power (0.21 kWh/m³ × 73,000 ML/yr)', 9.6], ['Chemicals (polymer, chlorine)', 3.1], ['Staff (46, three shifts)', 4.2], ['Spares and repairs', 2.4], ['Sludge disposal (11 km)', 1.3], ['Analysers and lab', 0.6]], esc: 5, npv: 168.4 };

/* ---------------- knowledge: past proposals ---------------- */
const PAST = {
  'PB-2021-04': { name: 'Vadodara 150 MLD STP + O&M', res: 'Won', score: 89, yr: 2021, mld: 150 },
  'PB-2023-02': { name: 'Rajkot 120 MLD STP and sewer', res: 'Won', score: 86, yr: 2023, mld: 120 },
  'PB-2024-06': { name: 'Surat Intake and 80 MLD WTP', res: 'Won', score: 84, yr: 2024, mld: 80 },
  'PB-2025-01': { name: 'Nashik 90 MLD STP (HAM)', res: 'Lost', score: 82, yr: 2025, mld: 90 },
  'PB-2025-07': { name: 'Solapur 75 MLD STP', res: 'Lost', score: 74, yr: 2025, mld: 75 }
};

/* ---------------- post-award ---------------- */
const POST = {
  nego: [['Annuity delay interest', 'Bank rate', 'Bank rate + 2%', 'Bank rate + 1%'], ['Rock excavation', 'In BPC', 'Measured at rate', 'Measured above 12,000 m³'], ['Right-of-way', 'Contractor', 'Authority', 'Authority + time extension']],
  outcome: { result: 'Won (L1)', comp: [['Narmada + Aquaprocess JV (us)', 1249.2], ['Vishwa Aqua Infra', 1254.0], ['Ganga Enviro JV', 1290.4]], reasons: ['Lowest BPC + O&M NPV by 0.4%', 'Lowest O&M NPV through screw-press energy saving'] },
  drift: [['§23.6 Annuity delay', 'Bank rate + 1% (negotiated)', 'Bank rate', 'High'], ['§10.3 Right-of-way', 'Authority + time extension', 'Authority, no time extension stated', 'High'], ['Sch. K Performance test', '90 days, BOD < 10', '90 days, BOD < 10', 'None'], ['Sch. O Staffing', '46 personnel', '52 personnel', 'Medium']],
  obl: [['OB-008', 'Notice of Authority default (ROW)', 'Concessionaire', 'Within 15 days of ROW miss', true], ['OB-014', 'Submit trial-run plan to IE', 'Concessionaire', 'Month 26', false], ['OB-022', 'Hand over STP land', 'Authority', 'Done', false], ['OB-029', 'Monthly MPCB effluent report', 'Concessionaire', '7th of each month', true]],
  deliv: [['WW-P-DWG-010', 'Hydraulic flow diagram', 'Process', 'IFC', 'C', 100], ['WW-C-DWG-120', 'SBR basin reinforcement', 'Civil', 'IFC', 'B', 100], ['WW-P-CAL-021', 'Aeration demand calculation', 'Process', 'IFA', 'B', 85], ['WW-I-SPC-030', 'SCADA I/O list and MPCB link', 'I&C', 'IFR', 'A', 50], ['WW-L-DWG-201', 'Sewer alignment as-built ch 0–7.1 km', 'Pipeline', 'IFR', 'A', 40]],
  pos: [['PO-WW-2210', 'MS pipe 1,600 mm (5.8 km)', 'Welspun', 'Month 5', 'Month 6', 'warn'], ['PO-WW-2214', 'Air blowers × 7', 'Aerzen-Kirloskar', 'Month 16', 'Month 15', 'ok'], ['PO-WW-2218', 'Raw sewage pumps × 13', 'Kirloskar Pumps', 'Month 14', 'Month 15', 'bad'], ['PO-WW-2221', 'Disc filters × 4', 'Filtrex', 'Month 20', 'Month 19', 'ok']],
  wps: [['SBR basins 1–4 structure', 78, 'Concrete 410 m³/day vs 380 norm'], ['Trunk sewer laying', 52, '96 m/day vs 110 norm (rock)'], ['IPS-1 civil', 88, ''], ['Admin and lab building', 64, '']],
  row: [['Ch 0+000 – 4+200', 'Municipal road', 'Indrayani MC', 'Handed over', 'ok'], ['Ch 4+200 – 8+000', 'State Highway 55', 'MSRDC', 'NOC pending (5 months)', 'bad'], ['Ch 8+000 – 11+600', 'Private agricultural', '38 owners', 'Consent 34 / 38', 'warn'], ['Ch 11+600 – 14+200', 'Railway + MIDC', 'Central Railway / MIDC', 'Permission granted', 'ok']],
  ctrl: [['Secondary process (SBR)', 194, 176, 98, 199], ['Civil and structural', 211, 205, 151, 214], ['Trunk sewer 14.2 km', 275, 262, 133, 294], ['Pumping stations (2 IPS)', 51, 47, 18, 50], ['Electrical (22 kV, MCC, VFD)', 64, 58, 12, 63]],
  changes: [['CoS-03', 'Additional 2 km branch sewer, Chikhali', 18.6, 'Approved'], ['CoS-05', 'Microtunnelling at highway crossings', 9.4, 'Priced'], ['CoS-06', 'Extra staffing per Sch. O (52)', 0.9, 'Under review']],
  cx: { levels: ['Hydraulic and leak tests', 'Equipment tests', 'Trial run (wet)', 'PG test (90 days)', 'O&M handover'], systems: [['Inlet works and screens', [100, 100, 60, 0, 0], 0], ['SBR basins 1–4', [100, 90, 40, 0, 0], 1], ['Tertiary filters', [100, 70, 0, 0, 0], 0], ['Sludge handling', [100, 80, 20, 0, 0], 1], ['IPS-1 and IPS-2', [100, 100, 75, 0, 0], 0], ['SCADA and analysers', [80, 50, 0, 0, 0], 0]] },
  punch: [['PL-A-007', 'SBR basins 1–4', 'A', 'Decanter 3 actuator fault', 'Open'], ['PL-A-009', 'Sludge handling', 'A', 'Centrifuge vibration above limit', 'Open'], ['PL-B-061', 'Inlet works', 'B', 'Handrail gap at screen channel', 'Open']],
  ptest: [['Treated BOD', '< 10 mg/l', '7.8 mg/l (day 34)', true], ['Treated TSS', '< 10 mg/l', '8.6 mg/l', true], ['Fecal coliform', '< 100 MPN', '64 MPN', true], ['Specific energy', '≤ 0.21 kWh/m³', '0.214 kWh/m³', false], ['Sludge dryness', '≥ 20% DS', '21.4%', true]],
  consents: [['MPCB consent to establish', 'Granted'], ['MPCB consent to operate', 'Applied: awaiting PG test data'], ['CEIG approval 22 kV', 'Granted'], ['Factory licence (chlorine storage)', 'In progress']],
  turn: [['Process systems', 72], ['Civil and structures', 88], ['Pumping stations', 81], ['Electrical and SCADA', 59], ['As-built sewer alignment', 66], ['O&M asset register', 70]]
};

/* ---------------- portfolio ---------------- */
const PIPE = [
  { id: 'OPP-WW-0317', dueISO: '2026-12-05', loc: 'Pimpri, Maharashtra', name: 'Indrayani 200 MLD STP and Trunk Sewer', client: 'Indrayani MC', type: 'stp', model: 'HAM + 15 yr O&M', size: '200 MLD', value: 1260, stage: 8, due: '05 Dec', fit: 72, owner: 'bid_manager', main: true },
  { id: 'OPP-WW-0322', dueISO: '2027-01-18', loc: 'Bhavnagar, Gujarat', name: 'Bhavnagar 100 MLD SWRO Desalination', client: 'GWSSB', type: 'desal', model: 'DBO, 20 yr', size: '100 MLD', value: 1880, stage: 3, due: '18 Jan', fit: 61, owner: 'bd_head' },
  { id: 'OPP-WW-0326', dueISO: '2026-12-11', loc: 'Ankleshwar, Gujarat', name: 'Ankleshwar CETP ZLD Upgrade', client: 'Ankleshwar Enviro Infra', type: 'etp', model: 'EPC / turnkey', size: '40 MLD', value: 520, stage: 4, due: '11 Dec', fit: 69, owner: 'bid_manager' },
  { id: 'OPP-WW-0309', dueISO: '2026-11-20', loc: 'Nashik, Maharashtra', name: 'Nashik 150 MLD WTP', client: 'Nashik MC', type: 'dw', model: 'Item rate (DBB)', size: '150 MLD', value: 410, stage: 7, due: '20 Nov', fit: 74, owner: 'estimator' },
  { id: 'OPP-WW-0331', dueISO: '2027-01-22', loc: 'Pune, Maharashtra', name: 'Pune 60 MLD Tertiary Reuse for Industry', client: 'Pune MC / MIDC', type: 'reuse', model: 'DBO, 10 yr', size: '60 MLD', value: 465, stage: 2, due: '22 Jan', fit: 66, owner: 'bd_head' },
  { id: 'OPP-WW-0329', dueISO: '2027-02-04', loc: 'Satara, Maharashtra', name: '24×7 Water Supply, Wards 4–9', client: 'Satara MC', type: 'dist', model: 'Design-Build', size: '62 MLD', value: 330, stage: 1, due: '04 Feb', fit: 58, owner: 'bd_head' },
  { id: 'OPP-WW-0335', dueISO: '2027-01-29', loc: 'Surat, Gujarat', name: 'Surat Biosolids Drying and Biogas', client: 'Surat MC', type: 'sludge', model: 'EPC + 5 yr O&M', size: '180 t/day', value: 280, stage: 2, due: '29 Jan', fit: 63, owner: 'process' },
  { id: 'OPP-WW-0338', dueISO: '2026-12-14', loc: 'Chikhali, Maharashtra', name: 'Chikhali Raw Water Rising Main', client: 'Indrayani MC', type: 'pump', model: 'EPC / turnkey', size: '22 km', value: 214, stage: 5, due: '14 Dec', fit: 70, owner: 'pipeline' },
  { id: 'OPP-WW-0301', dueISO: '2026-10-09', loc: 'Jamnagar, Gujarat', name: 'Western Refineries ETP Retrofit', client: 'Western Refineries', type: 'etp', model: 'EPC / turnkey', size: '18 MLD', value: 240, stage: 9, due: 'Negotiation', fit: 66, owner: 'commercial' }
];
const PROJECTS = [['PRJ-WW-0211', 'Vadodara 150 MLD STP (O&M year 5)', 'Vadodara MC', 690, 100, 'ok', 'Low'], ['PRJ-WW-0236', 'Rajkot 120 MLD STP + sewer', 'Rajkot MC', 642, 71, 'warn', 'RA bills 94 days overdue'], ['PRJ-WW-0240', 'Surat Intake and WTP', 'Surat MC', 318, 34, 'ok', 'Low']];
const TASKS = {
  bid_manager: [['Solvency certificate still awaited from bank', 'Alert', 'Today', 'elig'], ['Assign section 12 O&M methodology', 'Task', 'Today', 'pown'], ['Pre-bid queries due to Indrayani MC', 'Deadline', '29 Oct', 'clar'], ['Review drawing reader flags on L-201', 'Review', 'Today', 'docs']],
  process: [['Raw BOD 271 mg/l vs 200 design: confirm basis', 'Review', 'Today', 'basis'], ['Approve section 4 Process design', 'Approval', '02 Nov', 'pdraft'], ['Outfall freeboard 0.30 m on P-010', 'Alert', 'This week', 'docs']],
  estimator: [['Rock excavation +64% vs client BOQ', 'Alert', 'Today', 'boq'], ['Accept sewer takeoff marks on L-201', 'Task', 'Today', 'boq'], ['Price 15-year O&M schedule', 'Task', '20 Nov', 'est']],
  procurement: [['Level pump quotes (4 received)', 'Task', 'Today', 'quotes'], ['MS pipe lead time 2 months short', 'Alert', 'Today', 'longlead']],
  commercial: [['Review deviations DEV-02, DEV-04', 'Task', '27 Oct', 'pcomm'], ['Annuity delay risk ₹12.2 Cr priced', 'Alert', 'This week', 'risks']],
  bd_head: [['G1 decision: Bhavnagar desalination', 'Approval', '28 Oct', 'g1'], ['Record L2 loss: Nashik 90 MLD (−1.8%)', 'Task', '30 Oct', 'g1']],
  pd: [['Rajkot STP: RA bills 94 days overdue', 'Alert', 'This week', 'cost']],
  ei: [['NH₄-N analyser missing on I-401', 'Alert', 'Today', 'docs'], ['Draft section 8 Electrical and SCADA', 'Task', '03 Nov', 'pdraft']],
  pipeline: [['ROW clarification PBQ-04 open', 'Alert', 'Today', 'clar'], ['Draft section 7 Trunk sewer', 'Task', '03 Nov', 'pdraft']],
  om: [['Draft section 12 O&M methodology', 'Task', '04 Nov', 'pdraft']],
  exec: [['Approve G2 price for Indrayani STP (above ₹1,000 Cr)', 'Approval', 'Done', 'est'], ['G1: Ankleshwar CETP ZLD', 'Approval', '30 Oct', 'g1']]
};
const AGENTS = [
  ['Tender analyst', 'Reads every volume; extracts requirements, dates, qualification criteria with page anchors.', 'Documents, corrigenda', 'Requirements, brief, key dates', 'All extractions start as Proposed', 97.8, '25 Oct 08:12'],
  ['Drawing reader', 'Reads title blocks, counts symbols, reads levels and chainages on vector and raster sheets.', 'Drawings (96 sheets)', 'Sheet index, findings, takeoff marks', 'Raster sheets below 95% go to review', 99.1, '25 Oct 08:31'],
  ['Process specialist', 'Checks the design basis, sizes process units, compares tender values with site data.', 'Design basis, raw data, calculator', 'Basis conflicts, sizing checks', 'Process lead accepts every value', 94.2, '24 Oct 17:40'],
  ['Hydraulics checker', 'Traces the hydraulic profile; checks freeboard, head losses and pump duty.', 'P-010, M-301, Vol II §3', 'Profile findings', 'Human review required', 93.5, '24 Oct 17:44'],
  ['Quantity surveyor', 'Takes off quantities from drawings and compares with the client BOQ.', 'Drawings, BOQ, geotech', 'Takeoff, BOQ gaps', 'Estimator accepts marks', 96.0, '24 Oct 18:02'],
  ['Supplier levelling', 'Normalises quotes for scope gaps, freight, energy and O&M spares.', 'Supplier quotes', 'Levelled comparison', 'Procurement lead approves award', 95.3, '23 Oct 12:10'],
  ['Contract reviewer', 'Finds onerous clauses and drafts deviations and clarifications.', 'Concession agreement', 'Risks, deviations, PBQs', 'Commercial manager approves', 92.7, '23 Oct 15:22'],
  ['Proposal writer', 'Drafts sections from verified records and past winning proposals, with citations.', 'Records, knowledge library', 'Draft paragraphs', 'Section owner accepts every paragraph', 91.8, '25 Oct 09:02'],
  ['Envelope guard', 'Blocks any price from envelope A, supplier RFQs and exports.', 'All outgoing content', 'Block / pass', 'Cannot be overridden by agents', 100, '25 Oct 09:05']
];

/* ---------------------------------------------------------------------------
   Knowledge library. What an EPC bid team actually has to produce again on
   every tender: proof of similar work, the financial and statutory evidence a
   PQ asks for, the CVs it names, the plant it owns, the rates it has learned
   from delivered work, the paragraphs it has had approved before, and what it
   got wrong last time. Dates are what drive the screen: most of this expires.
   ------------------------------------------------------------------------- */
const KB_PROJ = {
  'PB-2021-04': { client: 'Vadodara Municipal Corporation', value: 412, scope: 'Design, build, 10 yr O&M · SBR', start: '2021-06', done: '2024-02', cert: 'Completion certificate', certHeld: true, perf: true, dlp: 'Over', ref: 'Shri P. R. Mehta, City Engineer' },
  'PB-2023-02': { client: 'Rajkot Municipal Corporation', value: 318, scope: 'STP + 42 km sewer · MBBR', start: '2023-03', done: '2025-11', cert: 'Completion certificate', certHeld: true, perf: true, dlp: 'Runs to Nov 2026', ref: 'Smt. A. Joshi, Executive Engineer' },
  'PB-2024-06': { client: 'Surat Municipal Corporation', value: 260, scope: 'Intake, raw water main, 80 MLD WTP', start: '2024-08', done: 'In progress', cert: 'Part completion only', certHeld: false, perf: false, dlp: '—', ref: 'Shri D. Patel, Addl. City Engineer' },
  'PB-2025-01': { client: 'Nashik Municipal Corporation', value: 290, scope: 'HAM · STP with 15 yr O&M', start: '—', done: 'Not awarded', cert: '—', certHeld: false, perf: false, dlp: '—', ref: '—' },
  'PB-2025-07': { client: 'Solapur Municipal Corporation', value: 196, scope: 'STP, tertiary reuse block', start: '—', done: 'Not awarded', cert: '—', certHeld: false, perf: false, dlp: '—', ref: '—' }
};
const KB_CRED = [
  { g: 'Financial', item: 'Audited accounts FY 2025-26', detail: 'Turnover ₹1,842 Cr · net worth ₹486 Cr', ref: 'SRBC & Co LLP', issued: '2026-07-28', exp: '2027-09-30', st: 'Valid' },
  { g: 'Financial', item: 'Bid capacity working', detail: '₹2,940 Cr, A×N×2 − B basis', ref: 'CA certificate', issued: '2026-08-12', exp: '2027-08-11', st: 'Valid' },
  { g: 'Financial', item: 'Solvency certificate', detail: '₹250 Cr · Bank of Baroda, Ahmedabad', ref: 'BOB/AHM/2026/1184', issued: '2026-04-01', exp: '2026-10-01', st: 'Expired' },
  { g: 'Statutory', item: 'GST registration', detail: '24AABCN4412K1ZR · Gujarat', ref: 'GSTN', issued: '2017-07-01', exp: '—', st: 'Valid' },
  { g: 'Statutory', item: 'EPF and ESI compliance', detail: 'Returns filed to Aug 2026', ref: 'EPFO/ESIC', issued: '2026-09-15', exp: '2026-12-15', st: 'Valid' },
  { g: 'Statutory', item: 'Non-blacklisting declaration', detail: 'Affidavit on ₹100 stamp, notarised', ref: 'Form PQ-7', issued: '2026-08-01', exp: '2027-02-01', st: 'Valid' },
  { g: 'Statutory', item: 'Class I local supplier certificate', detail: 'Local content 62% · PPP-MII order', ref: 'CA certificate', issued: '2026-04-10', exp: '2027-03-31', st: 'Valid' },
  { g: 'Quality', item: 'ISO 9001:2015', detail: 'Design and construction of water and wastewater works', ref: 'TUV/IN/9001/8841', issued: '2024-05-20', exp: '2027-05-19', st: 'Valid' },
  { g: 'Quality', item: 'ISO 14001 / ISO 45001', detail: 'Environment and OH&S', ref: 'TUV/IN/14K-45K/8842', issued: '2024-05-20', exp: '2027-05-19', st: 'Valid' },
  { g: 'Registration', item: 'MahaTenders contractor class', detail: 'Class I-A, water supply and sewerage', ref: 'MH/WS/IA/2203', issued: '2023-11-04', exp: '2026-11-03', st: 'Expiring' },
  { g: 'Registration', item: 'GWSSB empanelment', detail: 'Category A, up to ₹1,500 Cr', ref: 'GWSSB/EMP/A/661', issued: '2025-02-18', exp: '2028-02-17', st: 'Valid' },
  { g: 'Licence', item: 'CPCB / GPCB consent handling experience', detail: 'Consent to operate obtained on 7 plants', ref: 'Project files', issued: '—', exp: '—', st: 'Valid' }
];
const KB_PEOPLE = [
  { name: 'Dr. Anil Bhat', role: 'Team Leader / Project Director', qual: 'PhD Env. Engg, IIT Bombay', yrs: 26, similar: 6, cv: '2026-09-04', avail: 'On Rajkot to Nov 2026' },
  { name: 'Meera Shah', role: 'Process Design Lead', qual: 'M.Tech Env. Engg, VJTI', yrs: 18, similar: 9, cv: '2026-10-02', avail: 'Available' },
  { name: 'Rohini Kale', role: 'Sewerage / Network Lead', qual: 'M.E. Civil (Public Health)', yrs: 15, similar: 5, cv: '2026-07-21', avail: 'Available' },
  { name: 'Vivek Shenoy', role: 'Structural Expert', qual: 'M.Tech Structures, NIT Surat', yrs: 14, similar: 4, cv: '2025-11-30', avail: 'Available' },
  { name: 'Farah Khan', role: 'Pumping Station Expert', qual: 'B.E. Mechanical', yrs: 13, similar: 4, cv: '2026-06-11', avail: 'Part time' },
  { name: 'Dev Nair', role: 'E&I / SCADA Lead', qual: 'B.E. Electrical, MIE', yrs: 16, similar: 7, cv: '2026-08-19', avail: 'Available' },
  { name: 'Lakshmi Iyer', role: 'QA/QC Expert', qual: 'B.E. Civil, NDT Level II', yrs: 12, similar: 5, cv: '2026-09-28', avail: 'Available' },
  { name: 'Mohammed Ansari', role: 'Resident Engineer', qual: 'B.E. Civil', yrs: 11, similar: 3, cv: '2025-08-14', avail: 'On Surat to Mar 2027' },
  { name: 'Rohit Bansal', role: 'Contracts Specialist', qual: 'B.E. Civil, LLB', yrs: 17, similar: 8, cv: '2026-10-09', avail: 'Available' }
];
const KB_PLANT = [
  { item: 'Hydraulic excavator, 20 t', own: 'Owned', qty: 6, cap: 'PC210 class', age: '2–7 yr' },
  { item: 'Trench shoring boxes, 6 m', own: 'Owned', qty: 14, cap: 'to 6 m depth', age: '3 yr' },
  { item: 'Well-point dewatering sets', own: 'Owned', qty: 9, cap: '120 m³/h', age: '4 yr' },
  { item: 'Microtunnelling boring machine', own: 'Leased', qty: 1, cap: 'DN 1200–1800', age: 'Framework with Rohan Trenchless' },
  { item: 'Batching plant, 30 m³/h', own: 'Owned', qty: 3, cap: '30 m³/h', age: '5 yr' },
  { item: 'Mobile crane, 50 t', own: 'Owned', qty: 2, cap: '50 t', age: '6 yr' },
  { item: 'Pipe pressure-testing rigs', own: 'Owned', qty: 5, cap: 'to 16 bar', age: '2 yr' }
];
const KB_RATE = [
  { code: 'R-EX-02', item: 'Excavation in ordinary soil, 0–3 m', unit: 'm³', bid: 182, act: 191, src: 'Rajkot, Vadodara', upd: '2026-02' },
  { code: 'R-EX-05', item: 'Excavation in hard rock, blasting barred', unit: 'm³', bid: 740, act: 905, src: 'Rajkot trunk sewer', upd: '2026-02' },
  { code: 'R-PP-11', item: 'DI K9 pipe laying, DN 600', unit: 'm', bid: 4150, act: 4310, src: 'Vadodara, Surat', upd: '2026-05' },
  { code: 'R-PP-18', item: 'RCC NP4 pipe laying, DN 1200', unit: 'm', bid: 9800, act: 10420, src: 'Rajkot', upd: '2026-05' },
  { code: 'R-CC-03', item: 'RCC M30 in water-retaining structures', unit: 'm³', bid: 9650, act: 9710, src: 'All three', upd: '2026-07' },
  { code: 'R-MT-01', item: 'Microtunnelling DN 1200, soft ground', unit: 'm', bid: 68000, act: 74500, src: 'Rajkot crossing', upd: '2026-03' },
  { code: 'R-OM-04', item: 'O&M, SBR plant, power and chemicals', unit: '₹/ML', bid: 3980, act: 4120, src: 'Vadodara, 3 yr run', upd: '2026-08' }
];
const KB_BLOCK = [
  { id: 'KB-METH-01', title: 'SBR process description and design basis', sec: 'Methodology', own: 'process', appr: '2026-09-12', used: 9, w: 1840 },
  { id: 'KB-METH-04', title: 'Trenchless crossing methodology (MTBM)', sec: 'Methodology', own: 'pipeline', appr: '2026-06-02', used: 5, w: 1210 },
  { id: 'KB-QA-02', title: 'Quality assurance plan and hold points', sec: 'Quality', own: 'qhse', appr: '2026-08-21', used: 12, w: 2260 },
  { id: 'KB-HSE-01', title: 'Confined-space and deep-trench safety plan', sec: 'HSE', own: 'qhse', appr: '2025-10-30', used: 11, w: 1680 },
  { id: 'KB-OM-03', title: 'O&M organisation, manning and spares philosophy', sec: 'O&M', own: 'resident', appr: '2026-07-14', used: 7, w: 1990 },
  { id: 'KB-ORG-02', title: 'Project organisation chart and reporting lines', sec: 'Organisation', own: 'bid_manager', appr: '2026-10-01', used: 14, w: 760 },
  { id: 'KB-ENV-05', title: 'Environmental management and consent compliance', sec: 'Environment', own: 'qhse', appr: '2025-05-18', used: 6, w: 1430 }
];
const KB_LESSON = [
  { proj: 'Rajkot 120 MLD STP and sewer', theme: 'Estimating', lesson: 'Rock was met from chainage 3.2 km, not 5 km. The rate library now carries a separate hard-rock line and the geotech read is a G2 hold point.', by: 'Anita Desai', date: '2026-02-19' },
  { proj: 'Vadodara 150 MLD STP + O&M', theme: 'O&M pricing', lesson: 'Power tariff escalation was priced flat for 10 years. O&M NPV now uses the client\'s own escalation clause, which cost us Nashik.', by: 'Rohit Bansal', date: '2025-12-03' },
  { proj: 'Nashik 90 MLD STP (HAM)', theme: 'Loss review', lesson: 'Lost by 1.4% on O&M NPV, not on capex. On HAM, price the O&M years first and back-solve the capex.', by: 'Sanjay Kulkarni', date: '2026-01-27' },
  { proj: 'Solapur 75 MLD STP', theme: 'Disqualification', lesson: 'Solvency certificate was 11 days past the tender\'s 6-month window. Credentials now carry an expiry watch on this screen.', by: 'Kavya Menon', date: '2026-03-08' },
  { proj: 'Surat Intake and 80 MLD WTP', theme: 'Execution', lesson: 'Intake cofferdam design was re-done after the monsoon survey. Build a survey window into the programme before fixing the intake level.', by: 'Dr. Anil Bhat', date: '2026-06-22' }
];
