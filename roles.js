// Role profiles (EPC, design-builder, O&M operator, EPCM / consultant), their screens and sample records,
// plus login, sign-up through the wizard and storage per account. Loaded last; boots the app.

let PROFILE = 'epc';
const snapPerm = () => Object.fromEntries(Object.entries(PERM).map(([k, p]) => [k, { l: p.l, r: p.r.slice() }]));
const EPC_DEF = { stages: deep(STAGES), phases: deep(PHASES), gates: deep(GATES), roles: deep(ROLES), perm: snapPerm(), pipe: deep(PIPE), delivery: deep(CATALOG.delivery), scope: deep(CATALOG.scope), workflows: deep(CATALOG.workflows) };
const POOL = { ...deep(ROLES), design: { name: 'Aditi Rao', title: 'Design Manager', ini: 'AR' }, opsmgr: { name: 'Karthik Reddy', title: 'Operations Manager', ini: 'KR' }, maint: { name: 'Joseph Mathew', title: 'Maintenance Manager', ini: 'JM' }, lab: { name: 'Sneha Pawar', title: 'Lab Chemist', ini: 'SP' }, teamlead: { name: 'Dr. Anil Bhat', title: 'Team Leader', ini: 'AB' }, resident: { name: 'Mohammed Ansari', title: 'Resident Engineer', ini: 'MA' } };
const NEWPERM = {
  design: { l: 'Design development and design changes', r: ['design', 'process', 'ei', 'pipeline', 'pd'] },
  survey: { l: 'Site and asset condition survey', r: ['opsmgr', 'process', 'maint'] },
  opex: { l: 'Opex model, crew and KPI deductions', r: ['estimator', 'commercial', 'opsmgr'] },
  ops: { l: 'Operations logs, compliance and monthly reports', r: ['opsmgr', 'om', 'lab', 'process'] },
  maint: { l: 'Maintenance work orders and asset renewal', r: ['maint', 'opsmgr'] },
  takeover: { l: 'Mobilisation, takeover and handback', r: ['opsmgr', 'contracts', 'om'] },
  team: { l: 'Key experts and CVs', r: ['bid_manager', 'teamlead'] },
  fee: { l: 'Fee estimate and QCBS', r: ['estimator', 'commercial'] },
  cdel: { l: 'Consultancy deliverables', r: ['teamlead', 'process', 'pipeline', 'ei'] },
  oproc: { l: 'Owner-side procurement and bid evaluation', r: ['procurement', 'teamlead'] },
  superv: { l: 'Construction supervision and certification', r: ['resident', 'qhse', 'teamlead'] },
  tsheet: { l: 'Man-months, timesheets and invoices', r: ['commercial', 'teamlead'] }
};
const PROP_TABS = st => [['~', 'Tech'], ['pstruct', 'Proposal structure', st, 'prop'], ['pown', 'Ownership & review', st, 'prop'], ['pdraft', 'Proposal draft', st, 'prop'], ['pcomp', 'Compliance matrix', st, 'prop'], ['pann', 'Technical annexures', st, 'prop'], ['~', 'Commercial'], ['pcomm', 'Commercial volume', st, 'prop'], ['psub', 'Submission', st, 'prop', 'G3']];
const PRE = [['brief', 'Tender intelligence', 1, 'intel'], ['docs', 'Documents', 2, 'intel'], ['reqs', 'Requirements', 3, 'intel'], ['basis', 'Rules & precedence', 3, 'intel'], ['elig', 'Eligibility & terms', 3, 'intel'], ['risks', 'Risks', 3, 'risk'], ['clar', 'Clarifications', 3, 'risk'], ['|']];
const WF = (k, l, d, ph, g) => [k, l, d, ph, g];
const PROFILES = {
  epc: { label: 'EPC / main contractor', hero: ['Win the public tender, then prove the effluent on the PG test.', 'Extended pre-qualification, a mandatory two-envelope guard, process and hydraulic sizing, land and right-of-way, 15 years of O&M priced, and a trial run to performance guarantee test.', ['200 MLD STP', 'HAM + 15 yr O&M', 'BOD < 10 mg/l', 'Two envelopes', 'PG test']] },
  db: {
    label: 'Design-builder', hero: ['Own the design, agree the target price, build to it.', 'Concept design and sizing, an open-book GMP in a paid preconstruction phase, owner design reviews at 30, 60 and 90%, and one point of responsibility through taking-over and defects liability.', ['85 MLD STP', 'Progressive design-build', 'Open-book GMP', '30/60/90 reviews', '12-month DLP']],
    stages: [[1, 'Capture', 'brief'], [2, 'Ingest', 'docs'], [3, 'Intelligence', 'reqs'], [4, 'Bid / No-bid', 'g1'], [5, 'Concept design', 'eng'], [6, 'Procurement', 'proc'], [7, 'Target price', 'est'], [8, 'Proposal', 'pstruct'], [9, 'Negotiation', 'nego'], [10, 'Contract', 'contract'], [11, 'Design & build', 'design'], [12, 'Taking-over', 'testing'], [13, 'Defects liability', 'omh']],
    phases: [{ id: 'pre', name: 'Tender Intelligence', tabs: [...PRE, ['g1', 'Bid / No-bid', 4, 'bnb', 'G1'], ['eng', 'Concept design', 5, 'eng'], ['proc', 'Procurement', 6, 'sup'], ['est', 'Target price & GMP', 7, 'est', 'G2']] }, { id: 'prop', name: 'Proposal', tabs: PROP_TABS(8) }, { id: 'award', name: 'Award & contract', tabs: [['nego', 'Negotiation & award', 9, 'contract'], ['contract', 'Contract', 10, 'contract'], ['handover', 'Handover to delivery', 10, 'contract', 'G4']] }, { id: 'deliv', name: 'Design & delivery', tabs: [['design', 'Design development', 11, 'delivery'], ['cadmin', 'Contract administration', 11, 'delivery'], ['psupply', 'Procurement & supply', 11, 'delivery'], ['construct', 'Construction', 11, 'delivery'], ['qhse', 'Quality & HSE', 11, 'delivery'], ['controls', 'Project controls', 11, 'delivery']] }, { id: 'cx', name: 'Taking-over & DLP', tabs: [['testing', 'Testing & taking-over', 12, 'commission', 'G5'], ['omh', 'Handover & defects liability', 13, 'commission', 'G6']] }],
    gates: { G1: { stage: 4, name: 'Bid / no-bid decision', roles: ['bd_head', 'exec'], tab: 'g1' }, G2: { stage: 7, name: 'Target price and fee approval', roles: ['commercial', 'exec'], tab: 'est', sub: 'approve' }, G3: { stage: 8, name: 'Proposal release', roles: ['bid_manager', 'commercial'], tab: 'psub' }, G4: { stage: 10, name: 'Contract baseline', roles: ['pd', 'contracts'], tab: 'handover' }, G5: { stage: 12, name: 'Taking-over certificate', roles: ['pd', 'design'], tab: 'testing', sub: 'pg' }, G6: { stage: 13, name: 'End of defects liability', roles: ['pd', 'contracts'], tab: 'omh', sub: 'close' } },
    roles: ['bid_manager', 'bd_head', 'design', 'process', 'ei', 'pipeline', 'estimator', 'procurement', 'commercial', 'contracts', 'pd', 'site', 'qhse', 'exec', 'admin'], titles: {},
    perm: { design: NEWPERM.design, est: { l: 'Estimate, cost of work and GMP', r: ['estimator', 'commercial'] }, om: { l: 'Handover and defects liability', r: ['pd', 'contracts'] } }, drop: [],
    delivery: [['pdb', 'Progressive Design-Build'], ['db', 'Design-Build (lump sum)'], ['dbo', 'Design-Build-Operate'], ['cmar', 'Construction Management at Risk'], ['epc', 'EPC / turnkey']],
    scope: [['eng', 'Design (all disciplines)'], ['precon', 'Preconstruction services'], ['supply', 'Equipment supply'], ['inst', 'Construction'], ['cx', 'Testing & commissioning'], ['om', 'Operations (DBO only)']],
    wf: [WF('intel', 'Tender intelligence', 'Documents, requirements, rules', 'pre'), WF('bnb', 'Bid / no-bid review', 'Scoring and the G1 decision', 'pre', 'G1'), WF('eng', 'Concept design & sizing', 'Design basis, calculators, takeoff', 'pre'), WF('boq', 'Takeoff & BOQ', 'Quantities and gap report', 'pre'), WF('sup', 'Procurement for the bid', 'Sub-RFPs, quotes, long-lead', 'pre'), WF('risk', 'Risk & clarifications', 'Risk register, queries', 'pre'), WF('est', 'Target price & GMP', 'Cost of work, fee and GMP (G2)', 'pre', 'G2'), WF('prop', 'Proposal workspace', 'Structure to submission', 'prop', 'G3'), WF('contract', 'Contract & handover', 'Redlines, obligations', 'post', 'G4'), WF('delivery', 'Design development & construction', '30/60/90/IFC, site, QHSE', 'post'), WF('commission', 'Taking-over & defects liability', 'Tests, taking-over, DLP', 'post', 'G5 · G6')],
    pipe: [['OPP-DB-0431', 'Satara 40 MLD STP (Design-Build)', 'Satara MC', 'stp', 'Design-Build', '40 MLD', 210, 3, '19 Jan', 71], ['OPP-DB-0435', 'Sangli 60 MLD WTP', 'Sangli-Miraj MC', 'dw', 'Design-Build', '60 MLD', 165, 5, '22 Dec', 74], ['OPP-DB-0440', 'Navi Mumbai Tertiary Reuse (PDB)', 'NMMC', 'reuse', 'Progressive DB', '45 MLD', 290, 2, '08 Feb', 68], ['OPP-DB-0442', 'Solapur Sludge Drying (DBO)', 'Solapur MC', 'sludge', 'DBO', '120 t/day', 140, 1, '15 Feb', 62]]
  },
  om: {
    label: 'O&M operator', hero: ['Price the plant you will run, then hit the KPIs every month.', 'An asset condition survey, an opex model with KPI deductions, takeover of the existing plant, daily operations logs against the discharge consent, CMMS work orders, monthly invoices and handback.', ['150 MLD STP', '7-year O&M', 'KPI deductions', 'CMMS', 'Handback']],
    stages: [[1, 'Capture', 'brief'], [2, 'Ingest', 'docs'], [3, 'Intelligence', 'reqs'], [4, 'Bid / No-bid', 'g1'], [5, 'Asset survey', 'survey'], [6, 'Opex model', 'opex'], [7, 'Proposal', 'pstruct'], [8, 'Negotiation', 'nego'], [9, 'Contract', 'contract'], [10, 'Takeover', 'takeover'], [11, 'Operations', 'ops'], [12, 'Maintenance', 'maint'], [13, 'Handback', 'handback']],
    phases: [{ id: 'pre', name: 'Tender Intelligence', tabs: [...PRE, ['g1', 'Bid / No-bid', 4, 'bnb', 'G1'], ['survey', 'Site & asset survey', 5, 'eng'], ['opex', 'Opex model & price', 6, 'est', 'G2']] }, { id: 'prop', name: 'Proposal', tabs: PROP_TABS(7) }, { id: 'award', name: 'Award & contract', tabs: [['nego', 'Negotiation & award', 8, 'contract'], ['contract', 'Contract', 9, 'contract'], ['handover', 'Contract baseline', 9, 'contract', 'G4']] }, { id: 'deliv', name: 'Mobilisation & operations', tabs: [['takeover', 'Mobilisation & takeover', 10, 'delivery', 'G5'], ['ops', 'Operations', 11, 'delivery'], ['maint', 'Maintenance', 12, 'delivery'], ['cadmin', 'Invoices & contract admin', 11, 'delivery'], ['qhse', 'HSE & compliance', 11, 'delivery']] }, { id: 'cx', name: 'Handback', tabs: [['handback', 'Asset renewal & handback', 13, 'commission', 'G6']] }],
    gates: { G1: { stage: 4, name: 'Bid / no-bid decision', roles: ['bd_head', 'exec'], tab: 'g1' }, G2: { stage: 6, name: 'Annual fee approval', roles: ['commercial', 'exec'], tab: 'opex', sub: 'price' }, G3: { stage: 7, name: 'Proposal release', roles: ['bid_manager', 'commercial'], tab: 'psub' }, G4: { stage: 9, name: 'Contract signature', roles: ['contracts', 'exec'], tab: 'handover' }, G5: { stage: 10, name: 'Takeover of the plant', roles: ['opsmgr', 'contracts'], tab: 'takeover' }, G6: { stage: 13, name: 'Handback to the owner', roles: ['opsmgr', 'exec'], tab: 'handback' } },
    roles: ['bid_manager', 'bd_head', 'opsmgr', 'om', 'process', 'maint', 'lab', 'ei', 'estimator', 'commercial', 'contracts', 'qhse', 'exec', 'admin'], titles: { om: 'Plant Manager', process: 'Process Engineer', ei: 'E&I Engineer', estimator: 'Cost Analyst', qhse: 'HSE & Compliance Manager' },
    perm: { survey: NEWPERM.survey, opex: NEWPERM.opex, ops: NEWPERM.ops, maint: NEWPERM.maint, takeover: NEWPERM.takeover, cadmin: { l: 'Monthly invoices, notices and guarantees', r: ['contracts', 'commercial', 'opsmgr'] }, qhse: { l: 'HSE and discharge compliance', r: ['qhse', 'opsmgr'] }, est: { l: 'Cost lines in the opex model', r: ['estimator', 'commercial', 'opsmgr'] }, om: { l: 'Operating cost lines', r: ['estimator', 'commercial', 'opsmgr'] }, envB: { l: 'View the financial bid (fee)', r: ['bid_manager', 'commercial', 'estimator', 'opsmgr', 'exec'] } },
    drop: ['eng', 'boq', 'quotes', 'engd', 'psupply', 'construct', 'cost', 'cx', 'margin'],
    delivery: [['omk', 'O&M with KPIs and deductions'], ['om', 'O&M contract (fixed fee)'], ['dbo', 'O&M part of DBO'], ['ham', 'O&M under a HAM concession'], ['boot', 'BOOT / PPP operations']],
    scope: [['ops', 'Plant operation'], ['maint', 'Maintenance and CMMS'], ['lab', 'Laboratory and compliance monitoring'], ['renew', 'Asset renewal and replacement'], ['sludge', 'Sludge disposal'], ['networks', 'Network and pumping station O&M']],
    wf: [WF('intel', 'Tender intelligence', 'Documents, requirements, rules', 'pre'), WF('bnb', 'Bid / no-bid review', 'Scoring and the G1 decision', 'pre', 'G1'), WF('risk', 'Risk & clarifications', 'Risk register, queries', 'pre'), WF('eng', 'Site & asset survey', 'Condition, remaining life, rectification', 'pre'), WF('est', 'Opex model & pricing', 'Cost lines, crew, KPI deductions (G2)', 'pre', 'G2'), WF('prop', 'Proposal workspace', 'Structure to submission', 'prop', 'G3'), WF('contract', 'Contract & baseline', 'Redlines, obligations', 'post', 'G4'), WF('delivery', 'Takeover & operations', 'Takeover, logs, CMMS, invoices', 'post', 'G5'), WF('commission', 'Asset renewal & handback', 'Renewal plan and handback', 'post', 'G6')],
    pipe: [['OPP-OM-0211', 'Surat 100 MLD STP O&M (5 years)', 'Surat MC', 'stp', 'O&M with KPIs', '100 MLD', 58, 3, '14 Jan', 77], ['OPP-OM-0215', 'Rajkot 80 MLD WTP O&M (3 years)', 'Rajkot MC', 'dw', 'O&M contract', '80 MLD', 24, 2, '30 Jan', 72], ['OPP-OM-0219', 'Ankleshwar CETP O&M', 'Ankleshwar Enviro Infra', 'etp', 'O&M with KPIs', '40 MLD', 31, 4, '18 Dec', 69], ['OPP-OM-0223', 'Ahmedabad SPS Cluster O&M', 'AMC', 'pump', 'O&M contract', '22 stations', 19, 1, '20 Feb', 64]]
  },
  epcm: {
    label: 'EPCM / consultant', hero: ['Win on quality, staff it right, supervise to completion.', 'Expression of interest to a QCBS proposal scored on key-expert CVs, a man-month fee model, owner-side procurement of the contractors, and construction supervision through taking-over.', ['QCBS 80:20', '9 key experts', '₹780 Cr works', 'Owner-side evaluation', 'Supervision']],
    stages: [[1, 'EOI & capture', 'brief'], [2, 'Ingest', 'docs'], [3, 'Intelligence', 'reqs'], [4, 'Go / no-go', 'g1'], [5, 'Team & CVs', 'team'], [6, 'Fee estimate', 'fee'], [7, 'Proposal', 'pstruct'], [8, 'Negotiation', 'nego'], [9, 'Contract', 'contract'], [10, 'Studies & design', 'cdel'], [11, 'Owner procurement', 'oproc'], [12, 'Supervision', 'superv'], [13, 'Close-out', 'closeout']],
    phases: [{ id: 'pre', name: 'Tender Intelligence', tabs: [['brief', 'EOI & brief', 1, 'intel'], ['docs', 'Documents', 2, 'intel'], ['reqs', 'TOR requirements', 3, 'intel'], ['basis', 'Rules & precedence', 3, 'intel'], ['elig', 'Eligibility & terms', 3, 'intel'], ['risks', 'Risks', 3, 'risk'], ['clar', 'Clarifications', 3, 'risk'], ['|'], ['g1', 'Go / no-go', 4, 'bnb', 'G1'], ['team', 'Team & CVs', 5, 'eng'], ['fee', 'Fee estimate', 6, 'est', 'G2']] }, { id: 'prop', name: 'Proposal (QCBS)', tabs: PROP_TABS(7).map(t => t[0] === 'pcomm' ? ['pcomm', 'Financial proposal', 7, 'prop'] : t) }, { id: 'award', name: 'Award & contract', tabs: [['nego', 'Negotiation & award', 8, 'contract'], ['contract', 'Contract', 9, 'contract'], ['handover', 'Mobilisation', 9, 'contract', 'G4']] }, { id: 'deliv', name: 'Services delivery', tabs: [['cdel', 'Studies & design deliverables', 10, 'delivery'], ['oproc', 'Owner-side procurement', 11, 'delivery'], ['superv', 'Construction supervision', 12, 'delivery', 'G5'], ['tsheet', 'Man-months & invoices', 10, 'delivery'], ['qhse', 'Quality assurance', 12, 'delivery']] }, { id: 'cx', name: 'Close-out', tabs: [['closeout', 'Assignment close-out', 13, 'commission', 'G6']] }],
    gates: { G1: { stage: 4, name: 'Go / no-go decision', roles: ['bd_head', 'exec'], tab: 'g1' }, G2: { stage: 6, name: 'Fee approval', roles: ['commercial', 'exec'], tab: 'fee', sub: 'approve' }, G3: { stage: 7, name: 'Proposal release', roles: ['bid_manager', 'teamlead'], tab: 'psub' }, G4: { stage: 9, name: 'Contract signature', roles: ['commercial', 'exec'], tab: 'handover' }, G5: { stage: 12, name: 'Taking-over recommendation', roles: ['resident', 'teamlead'], tab: 'superv', sub: 'gate' }, G6: { stage: 13, name: 'Assignment close-out', roles: ['teamlead', 'exec'], tab: 'closeout' } },
    roles: ['bid_manager', 'bd_head', 'teamlead', 'process', 'pipeline', 'ei', 'estimator', 'procurement', 'commercial', 'resident', 'qhse', 'exec', 'admin'], titles: { bid_manager: 'Proposal Manager', process: 'Process Design Lead', pipeline: 'Network Design Lead', ei: 'E&I Design Lead', estimator: 'Fee & Cost Estimator', procurement: 'Procurement Specialist', commercial: 'Finance & Contracts Manager', qhse: 'QA/QC Expert' },
    perm: { team: NEWPERM.team, fee: NEWPERM.fee, cdel: NEWPERM.cdel, oproc: NEWPERM.oproc, superv: NEWPERM.superv, tsheet: NEWPERM.tsheet, qhse: { l: 'Quality assurance and inspections', r: ['qhse', 'resident', 'teamlead'] }, om: { l: 'Assignment close-out', r: ['teamlead', 'commercial'] }, envB: { l: 'View the financial proposal (fee)', r: ['bid_manager', 'commercial', 'estimator', 'teamlead', 'exec'] }, nego: { l: 'Negotiation and outcome', r: ['commercial', 'bd_head', 'teamlead'] } },
    drop: ['eng', 'boq', 'quotes', 'est', 'margin', 'engd', 'psupply', 'construct', 'cost', 'cx', 'cadmin'],
    delivery: [['qcbs', 'QCBS consultancy (World Bank / ADB / national)'], ['pmc', 'Project management consultancy (PMC)'], ['oe', "Owner's engineer"], ['epcm', 'EPCM'], ['tpi', 'Third-party inspection'], ['dpr', 'Feasibility / DPR studies']],
    scope: [['study', 'Feasibility and DPR'], ['design', 'Detailed design and tender documents'], ['bpm', 'Bid process management (owner side)'], ['sup', 'Construction supervision'], ['cxs', 'Commissioning support'], ['tpqa', 'Third-party quality assurance']],
    wf: [WF('intel', 'EOI & tender intelligence', 'TOR, data sheet, requirements', 'pre'), WF('bnb', 'Go / no-go review', 'Scoring and the G1 decision', 'pre', 'G1'), WF('risk', 'Risk & clarifications', 'Risk register, queries', 'pre'), WF('eng', 'Team & CVs', 'Key experts and compliance', 'pre'), WF('est', 'Fee estimate & QCBS', 'Man-months, rates, combined score (G2)', 'pre', 'G2'), WF('prop', 'QCBS proposal', 'Technical and financial proposals', 'prop', 'G3'), WF('contract', 'Contract & mobilisation', 'Redlines, obligations', 'post', 'G4'), WF('delivery', 'Services delivery', 'Deliverables, owner procurement, supervision', 'post', 'G5'), WF('commission', 'Close-out', 'Final report and close-out', 'post', 'G6')],
    pipe: [['OPP-PMC-0122', 'Pune 24×7 Water Supply PMC', 'Pune MC', 'dist', 'PMC', '₹1,100 Cr works', 44, 3, '10 Jan', 75], ['OPP-PMC-0126', 'DPRs for 12 Towns (World Bank)', 'GUDM', 'stp', 'QCBS', '12 towns', 9, 2, '25 Jan', 70], ['OPP-PMC-0129', "Bhavnagar Desalination Owner's Engineer", 'GWSSB', 'desal', "Owner's engineer", '100 MLD', 21, 1, '12 Feb', 66], ['OPP-PMC-0131', 'Kolhapur STP Third-party Inspection', 'Kolhapur MC', 'stp', 'TPI', '85 MLD', 4, 4, '05 Dec', 72]]
  }
};
const ROLE_LABEL = { epc: 'EPC / main contractor', db: 'Design-builder', om: 'O&M operator', epcm: 'EPCM / consultant' };

function applyCatalog(role) {
  const P = PROFILES[role], put = (arr, src) => { arr.length = 0; deep(src).forEach(x => arr.push(x)); };
  if (role === 'epc') { put(CATALOG.delivery, EPC_DEF.delivery); put(CATALOG.scope, EPC_DEF.scope); put(CATALOG.workflows, EPC_DEF.workflows); }
  else { put(CATALOG.delivery, P.delivery); put(CATALOG.scope, P.scope); put(CATALOG.workflows, P.wf); }
}
function applyProfile(role) {
  PROFILE = PROFILES[role] ? role : 'epc'; const P = PROFILES[PROFILE], put = (arr, src) => { arr.length = 0; deep(src).forEach(x => arr.push(x)); };
  put(STAGES, P.stages || EPC_DEF.stages); put(PHASES, P.phases || EPC_DEF.phases);
  Object.keys(GATES).forEach(k => delete GATES[k]); Object.assign(GATES, deep(P.gates || EPC_DEF.gates));
  Object.keys(ROLES).forEach(k => delete ROLES[k]);
  if (PROFILE === 'epc') Object.assign(ROLES, deep(EPC_DEF.roles)); else P.roles.forEach(k => { const nm = (P.names || {})[k]; ROLES[k] = { ...POOL[k], title: (P.titles || {})[k] || POOL[k].title, ...(nm ? { name: nm, ini: nm.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() } : {}) }; });
  Object.keys(PERM).forEach(k => delete PERM[k]); const base = deep(EPC_DEF.perm); (P.drop || []).forEach(k => delete base[k]); Object.assign(PERM, base, deep(P.perm || {}));
  Object.values(PERM).forEach(p => { p.r = p.r.filter(r => ROLES[r]); if (!p.r.length) p.r = ['bid_manager']; });
  put(PIPE, PROFILE === 'epc' ? EPC_DEF.pipe : P.pipe.map(r => ({ id: r[0], name: r[1], client: r[2], type: r[3], model: r[4], size: r[5], value: r[6], stage: r[7], due: r[8], fit: r[9], mkt: r[10], owner: 'bid_manager' })));
  applyCatalog(PROFILE);
  DEF_GATES = deep(Object.fromEntries(Object.entries(GATES).map(([g, G]) => [g, G.roles]))); DEF_PERM = deep(Object.fromEntries(Object.entries(PERM).map(([k, p]) => [k, p.r])));
  if (!ROLES[S.role]) S.role = 'bid_manager';
}

/* ---------------- shared helpers for role screens ---------------- */
Object.assign(LOCK, { crew: 'G2', kpis: 'G2', fee: 'G2', reimb: 'G2' });
const STG = ['30%', '60%', '90%', 'IFC'];
const ROLE_BLANK = () => ({
  dpk: [], dchg: [], gmp: { prefee: 0, fee: 8, cont: 4, share: 50, st: 'Draft' },
  cond: [], crew: [], kpis: [], omx: { years: 7, margin: 12, overhead: 6 }, logs: [], wo: [], renew: [],
  tchk: ['Joint inspection with the owner', 'Asset register and spares inventory signed', 'O&M manuals and as-builts received', 'Baseline effluent sampling (7 days)', 'Statutory permits transferred', 'Staff mobilised and inducted', 'Takeover certificate issued'].map(t => ({ id: uid(), item: t, st: 'Open' })),
  hb: ['Joint handback inspection', 'Asset condition at or above the agreed grade', 'Spares at contract levels', 'Records, logs and CMMS history handed over', 'Staff transition plan agreed', 'Handback certificate issued'].map(t => ({ id: uid(), item: t, st: 'Open' })),
  team: [], fee: [], reimb: [], qcbs: { tw: 80, cw: 20, comps: [] }, cdeliv: [], obids: [], opkg: '', cbills: [], insp: [], cvar: [], mmuse: [], inv: [],
  clo: ['Final report submitted', 'As-built verification complete', 'All contractor bills certified', 'Variations closed', 'Records archived to the owner', 'Completion certificate received'].map(t => ({ id: uid(), item: t, st: 'Open' }))
});
const _blankOpp = blankOpp;
const ROLE_BASELINE = {
  db: ['Design basis and owner requirements accepted', 'GMP or target price agreed', 'Risk register with owners', 'Obligations register', 'Design programme and review periods agreed', 'Proposal commitments carried into the contract'],
  om: ['Opex model locked at G2 + negotiated changes', 'KPI and deduction schedule agreed', 'Owner rectification list agreed from the survey', 'Staffing plan and mobilisation dates', 'Obligations register', 'Proposal commitments carried into the contract'],
  epcm: ['Fee and man-months locked at G2', 'Key experts confirmed with mobilisation dates', 'Deliverables schedule agreed', 'Obligations register', 'Invoicing and attendance procedure agreed', 'Proposal commitments carried into the contract']
};
blankOpp = function (m) { const o = Object.assign(_blankOpp(m), ROLE_BLANK()); if (ROLE_BASELINE[PROFILE]) o.baseline = ROLE_BASELINE[PROFILE].map(t => ({ id: uid(), t, ok: false })); return o; };

/* shared EPC screens reused by the other roles: stage numbers, wording and sub-tabs follow the profile */
const ROLE_SCREENS = ['design', 'survey', 'opex', 'takeover', 'ops', 'maint', 'handback', 'team', 'fee', 'cdel', 'oproc', 'superv', 'tsheet', 'closeout'];
const HIDE_SUB = { om: { qhse: ['itp', 'weld'], cadmin: ['claims'] }, epcm: { qhse: ['ptw'] } };
const WORDS = {
  db: [[/concession agreement/gi, 'Design-build agreement'], [/Concessionaire/g, 'Design-Builder']],
  om: [[/concession agreement/gi, 'O&M contract'], [/Running-account bills/g, 'Monthly invoices'], [/Running-account bill/g, 'Monthly invoice'], [/Handover to delivery/g, 'Contract baseline'], [/Concessionaire/g, 'Operator']],
  epcm: [[/concession agreement/gi, 'Consultancy contract'], [/Handover to delivery/g, 'Mobilisation'], [/Concessionaire/g, 'Consultant']]
};
const _subtabs = subtabs;
subtabs = function (tab, list) { const h = (HIDE_SUB[PROFILE] || {})[tab]; return _subtabs(tab, h ? list.filter(x => !h.includes(x[0])) : list); };
function adaptShared(id, html) {
  if (PROFILE === 'epc' || ROLE_SCREENS.includes(id)) return html;
  const ti = tabInfo(id), stg = ti && STAGES.find(s => s[0] === ti.t[2]);
  if (stg) html = html.replace(/(<span class="eyebrow">)Stage [\d–-]+ · [^<]*/, `$1Stage ${stg[0]} · ${stageName(stg[0])}`);
  (WORDS[PROFILE] || []).forEach(([re, to]) => { html = html.replace(re, m => m === m.toUpperCase() ? to.toUpperCase() : to); });
  return html;
}
function seedFor(seed, meta) { const f = { indrayani: seedIndrayani, db: seedDB, om: seedOM, epcm: seedEPCM }[seed]; return f ? Object.assign(ROLE_BLANK(), f()) : blankOpp({ ...meta, type: meta.types[0] }); }
const sum = (l, f) => l.reduce((a, r) => a + num(typeof f === 'function' ? f(r) : r[f]), 0);
const chk = (k, r) => qsel(k, r, 'st', ['Open', 'In progress', 'Done'], v => `<span class="chip ${v === 'Done' ? 'ok' : v === 'In progress' ? 'warn' : ''}">${v}</span>`);
Object.assign(COLL, { comps: { get: o => o.qcbs.comps }, wo: { pre: 'WO-0', pad: 3 }, dchg: { pre: 'DC-' }, cdeliv: { pre: 'DL-' }, cbills: { pre: 'CB-' }, cvar: { pre: 'VA-' }, inv: { pre: 'INV-' } });
const ST4 = ['Open', 'In progress', 'Done'];
Object.assign(FORMS, {
  dpk: { t: 'Design package', perm: 'design', f: [['disc', 'Discipline', 'select', 0, sel(['Process', 'Civil', 'Mechanical', 'Electrical', 'I&C', 'Architecture', 'Pipeline'])], ['pkg', 'Package', 'text', 1], ['stage', 'Design stage', 'select', 0, sel(STG)], ['pct', 'Progress in stage %', 'range', 0, [0, 100, 5]], ['review', 'Owner review', 'select', 0, sel(['Not submitted', 'Under owner review', 'Comments', 'Approved'])], ['due', 'Next submission', 'text']], d: { disc: 'Process', stage: '30%', pct: 0, review: 'Not submitted' } },
  dchg: { t: 'Design change', perm: 'design', f: [['desc', 'Change', 'text', 1], ['cost', 'Cost impact (₹ Cr)', 'num'], ['days', 'Time impact (days)', 'num'], ['st', 'Status', 'select', 0, sel(['Draft', 'Under owner review', 'Approved', 'Rejected'])]], d: { st: 'Draft', cost: 0, days: 0 } },
  cond: { t: 'Asset condition', perm: 'survey', f: [['asset', 'Asset', 'text', 1], ['area', 'Area', 'text'], ['cond', 'Condition (1 poor – 5 good)', 'range', 0, [1, 5, 1]], ['life', 'Remaining life (years)', 'num'], ['rect', 'Rectification (₹ Cr)', 'num'], ['payer', 'Who pays', 'select', 0, sel(['Owner', 'Operator', 'Shared'])]], d: { cond: 3, life: 5, rect: 0, payer: 'Owner' } },
  crew: { t: 'Crew line', perm: 'opex', f: [['role', 'Position', 'text', 1], ['n', 'Number', 'num', 1], ['rate', 'Cost per person (₹ lakh / year)', 'num', 1], ['mob', 'Mobilised', 'num']], d: { n: 1, rate: 5, mob: 0 } },
  kpis: { t: 'KPI and deduction', perm: 'opex', f: [['kpi', 'KPI', 'text', 1], ['target', 'Target / measure', 'text'], ['ded', 'Deduction per breach (% of monthly fee)', 'num', 1], ['exp', 'Expected breaches per year', 'num']], d: { ded: 0.5, exp: 1 } },
  logs: { t: 'Daily log', perm: 'ops', f: [['date', 'Date', 'date', 1], ['flow', 'Inflow (MLD)', 'num', 1], ['bodIn', 'Raw BOD (mg/l)', 'num'], ['bodOut', 'Treated BOD (mg/l)', 'num', 1], ['tssOut', 'Treated TSS (mg/l)', 'num'], ['kwh', 'Energy (MWh/day)', 'num']] },
  wo: { t: 'Work order', perm: 'maint', f: [['asset', 'Asset', 'text', 1], ['type', 'Type', 'select', 0, sel(['Planned', 'Breakdown', 'Corrective', 'Statutory'])], ['desc', 'Work', 'text', 1], ['due', 'Due', 'date'], ['st', 'Status', 'select', 0, sel(['Open', 'In progress', 'Done'])]], d: { type: 'Planned', st: 'Open' } },
  renew: { t: 'Renewal item', perm: 'maint', f: [['asset', 'Asset', 'text', 1], ['year', 'Contract year', 'num', 1], ['cost', 'Cost (₹ Cr)', 'num'], ['payer', 'Paid by', 'select', 0, sel(['Owner', 'Operator'])]], d: { year: 1, payer: 'Operator' } },
  tchk: { t: 'Takeover item', perm: 'takeover', f: [['item', 'Item', 'text', 1], ['st', 'Status', 'select', 0, sel(ST4)]], d: { st: 'Open' } },
  hb: { t: 'Handback item', perm: 'takeover', f: [['item', 'Item', 'text', 1], ['st', 'Status', 'select', 0, sel(ST4)]], d: { st: 'Open' } },
  team: { t: 'Key expert', perm: 'team', f: [['pos', 'Position', 'text', 1], ['name', 'Name', 'text'], ['req', 'Required experience (years)', 'num'], ['yrs', 'Actual experience (years)', 'num'], ['similar', 'Similar assignments', 'num'], ['cv', 'CV status', 'select', 0, sel(['Missing', 'Draft', 'Final'])], ['key', 'Key expert (scored)', 'check'], ['score', 'Expected score (0–100)', 'num']], d: { cv: 'Missing', key: true, score: 0 } },
  fee: { t: 'Fee line', perm: 'fee', f: [['pos', 'Position', 'text', 1], ['mm', 'Man-months', 'num', 1], ['rate', 'Billing rate (₹ lakh per man-month)', 'num', 1]] },
  reimb: { t: 'Reimbursable', perm: 'fee', f: [['item', 'Item', 'text', 1], ['amt', 'Amount (₹ lakh)', 'num', 1]] },
  comps: { t: 'Competitor', perm: 'fee', f: [['name', 'Firm', 'text', 1], ['tech', 'Expected technical score', 'num', 1], ['fee', 'Expected fee (₹ Cr)', 'num', 1]] },
  cdeliv: { t: 'Deliverable', perm: 'cdel', f: [['title', 'Deliverable', 'text', 1], ['due', 'Due', 'text'], ['st', 'Status', 'select', 0, sel(['Not started', 'Draft', 'Submitted', 'Client comments', 'Accepted'])], ['comments', 'Client comments', 'text']], d: { st: 'Not started' } },
  obids: { t: 'Contractor bid', perm: 'oproc', f: [['bidder', 'Bidder', 'text', 1], ['resp', 'Responsiveness', 'select', 0, sel(['Responsive', 'Non-responsive'])], ['tech', 'Technical score', 'num'], ['price', 'Bid price (₹ Cr)', 'num', 1]], d: { resp: 'Responsive', tech: 75 } },
  cbills: { t: 'Contractor bill', perm: 'superv', f: [['contractor', 'Contractor', 'text', 1], ['period', 'Period', 'text'], ['claimed', 'Claimed (₹ Cr)', 'num', 1], ['cert', 'Certified (₹ Cr)', 'num'], ['st', 'Status', 'select', 0, sel(['Received', 'Under check', 'Certified', 'Returned'])]], d: { st: 'Received', cert: 0 } },
  insp: { t: 'Inspection', perm: 'superv', f: [['date', 'Date', 'date', 1], ['act', 'Activity', 'text', 1], ['res', 'Result', 'select', 0, sel(['Passed', 'Passed with comments', 'Failed'])]], d: { res: 'Passed' } },
  cvar: { t: 'Variation claim', perm: 'superv', f: [['desc', 'Variation', 'text', 1], ['claimed', 'Claimed by contractor (₹ Cr)', 'num'], ['assessed', 'Our assessment (₹ Cr)', 'num'], ['st', 'Status', 'select', 0, sel(['Under assessment', 'Recommended', 'Rejected'])]], d: { st: 'Under assessment' } },
  mmuse: { t: 'Man-month line', perm: 'tsheet', f: [['pos', 'Position', 'text', 1], ['budget', 'Budget (man-months)', 'num', 1], ['used', 'Used to date', 'num']] },
  inv: { t: 'Invoice', perm: 'tsheet', f: [['milestone', 'Milestone / period', 'text', 1], ['amt', 'Amount (₹ Cr)', 'num', 1], ['st', 'Status', 'select', 0, sel(['Draft', 'Submitted', 'Approved', 'Paid'])]], d: { st: 'Draft' } },
  clo: { t: 'Close-out item', perm: 'om', f: [['item', 'Item', 'text', 1], ['st', 'Status', 'select', 0, sel(ST4)]], d: { st: 'Open' } }
});

/* ---------------- pricing per role ---------------- */
const _estEPC = estTotals;
function omPrice() {
  const o = O(), X = o.omx, lines = sum(o.om, 'cost'), crew = sum(o.crew, r => num(r.n) * num(r.rate)) / 100, base = lines + crew, ovh = base * num(X.overhead) / 100;
  const fee0 = (base + ovh) / (1 - num(X.margin) / 100), kpi = sum(o.kpis, r => fee0 / 12 * num(r.ded) / 100 * num(r.exp)), cost = base + ovh + kpi, fee = cost / (1 - num(X.margin) / 100);
  const yrs = Array.from({ length: Math.max(1, num(X.years)) }, (_, i) => fee * Math.pow(1 + num(o.omEsc) / 100, i));
  return { direct: base, cont: kpi, mkt: 0, add: ovh + kpi, cost, m: num(X.margin), price: fee, lines, crew, ovh, kpi, yrs, total: yrs.reduce((a, v) => a + v, 0), npv: yrs.reduce((a, v, i) => a + v / Math.pow(1.1, i + 1), 0) };
}
function feeTotals() { const o = O(), remun = sum(o.fee, r => num(r.mm) * num(r.rate)) / 100, reimb = sum(o.reimb, 'amt') / 100; return { direct: remun, cont: 0, mkt: 0, add: reimb, cost: remun + reimb, m: 0, price: remun + reimb, remun, reimb }; }
estTotals = function () { return PROFILE === 'om' ? omPrice() : PROFILE === 'epcm' ? feeTotals() : _estEPC(); };
const ourTech = () => { const k = O().team.filter(t => t.key); return k.length ? +(sum(k, 'score') / k.length).toFixed(1) : 0; };
function qcbs() { const o = O(), Q = o.qcbs, us = { name: S.cfg.company + ' (us)', tech: ourTech(), fee: feeTotals().price, us: true }, all = [us, ...Q.comps.map(c => ({ ...c, fee: num(c.fee), tech: num(c.tech) }))], minF = Math.min(...all.map(a => a.fee || Infinity)); return all.map(a => ({ ...a, fs: a.fee ? minF / a.fee * 100 : 0, comb: num(a.tech) * num(Q.tw) / 100 + (a.fee ? minF / a.fee * 100 : 0) * num(Q.cw) / 100 })).sort((a, b) => b.comb - a.comb); }

/* ---------------- design-builder screens ---------------- */
function drStatus(i) { const ps = O().dpk; if (!ps.length) return 'Not started'; const ok = ps.every(p => STG.indexOf(p.stage) > i || (STG.indexOf(p.stage) === i && p.review === 'Approved')); const any = ps.some(p => STG.indexOf(p.stage) >= i); return ok ? 'Passed' : any ? 'In review' : 'Not started'; }
function tDesign() {
  const o = O(), T = subtabs('design', [['pk', 'Design packages', o.dpk.length], ['dr', 'Owner design reviews'], ['dc', 'Design changes', o.dchg.length]]); let x = '';
  if (T.cur === 'pk') x = ctable('dpk', [{ l: 'Discipline', v: r => esc(r.disc) }, { l: 'Package', v: r => `<b>${esc(r.pkg)}</b>` }, { l: 'Stage', v: r => qsel('dpk', r, 'stage', STG, v => `<span class="chip info">${v}</span>`) }, { l: 'Progress', v: r => qrange('dpk', r, 'pct', 0, 100, 5, '%') }, { l: 'Owner review', v: r => qs('dpk', r, 'review', ['Not submitted', 'Under owner review', 'Comments', 'Approved']) }, { l: 'Next submission', v: r => esc(r.due) }], { title: 'Design packages', empty: 'Add each discipline package and move it through 30, 60, 90% and IFC.' });
  if (T.cur === 'dr') x = `<div class="grid g4">${['DR1 · 30%', 'DR2 · 60%', 'DR3 · 90%', 'IFC release'].map((l, i) => { const s = drStatus(i); return kpi(l, s, `${o.dpk.filter(p => STG.indexOf(p.stage) >= i).length}/${o.dpk.length} packages reached`, s === 'Passed' ? 'ok' : s === 'In review' ? 'warn' : ''); }).join('')}</div>
    <div class="panel"><div class="ph"><h3>Review status by package</h3></div><div class="tw"><table class="t"><thead><tr><th>Package</th>${STG.map(s => `<th>${s}</th>`).join('')}</tr></thead><tbody>${o.dpk.map(p => `<tr><td><b>${esc(p.pkg)}</b><div class="sub">${esc(p.disc)}</div></td>${STG.map((s, i) => { const k = STG.indexOf(p.stage); return `<td>${k > i ? '<span class="chip ok">Approved</span>' : k === i ? `<span class="chip ${p.review === 'Approved' ? 'ok' : p.review === 'Comments' ? 'bad' : 'warn'}">${esc(p.review)}</span>` : '<span class="muted">·</span>'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div></div><div class="note"><div>Owner reviews are hold points: a package is built only after its IFC release. Comments at 60% feed the GMP through design changes.</div></div>`;
  if (T.cur === 'dc') x = `<div class="grid g3">${kpi('Approved cost impact', cr(sum(o.dchg.filter(c => c.st === 'Approved'), 'cost')))}${kpi('Pending cost impact', cr(sum(o.dchg.filter(c => /draft|review/i.test(c.st)), 'cost')), '', 'warn')}${kpi('Time impact (approved)', sum(o.dchg.filter(c => c.st === 'Approved'), 'days') + ' days')}</div>` + ctable('dchg', [{ l: 'ID', v: r => `<span class="mono">${esc(r.id)}</span>`, cls: 'id' }, { l: 'Change', v: r => esc(r.desc) }, { l: '₹ Cr', v: r => qnum('dchg', r, 'cost', 70), num: 1 }, { l: 'Days', v: r => qnum('dchg', r, 'days', 60), num: 1 }, { l: 'Status', v: r => qs('dchg', r, 'st', ['Draft', 'Under owner review', 'Approved', 'Rejected']) }], { title: 'Design change register', right: '<span class="sub">Approved changes adjust the GMP</span>' });
  return `${sh('Stage 11 · Design & build', 'Design development', 'Design packages move through 30, 60 and 90% to IFC with an owner review at each stage. Design changes are priced and carried to the GMP.')}${permBar('design')}${T.html}${x}`;
}
function tGmp() {
  const o = O(), G = o.gmp, e = _estEPC(), ed = can('est') && !gateSigned('G2'), cw = e.cost, chg = sum(o.dchg.filter(c => c.st === 'Approved'), 'cost'), gmp = (cw + chg) * (1 + num(G.cont) / 100) * (1 + num(G.fee) / 100);
  const inp = (k, l, u) => `<label class="fld" for="gmp-${k}">${l}<input type="number" step="any" id="gmp-${k}" data-c="gmpset" data-k="${k}" value="${G[k]}" ${ed ? '' : 'disabled'}></label>`;
  const sc = [0.9, 0.95, 1, 1.05].map(f => { const final = (cw + chg) * f * (1 + num(G.fee) / 100), sav = gmp - final; return [Math.round(f * 100) + '% of cost of work', final, sav > 0 ? sav * num(G.share) / 100 : 0, sav > 0 ? sav * (100 - num(G.share)) / 100 : 0, sav < 0 ? -sav : 0]; });
  return `<div class="grid g-side"><div class="stack"><div class="panel"><div class="ph"><h3>Open-book GMP build-up</h3><span class="chip ${G.st === 'Agreed' ? 'ok' : G.st === 'Submitted to owner' ? 'warn' : ''}">${esc(G.st)}</span></div><div class="pb">${can('envB') ? `<dl class="kv"><dt>Cost of work (estimate incl. adders)</dt><dd>${cr(cw)}</dd><dt>Approved design changes</dt><dd>${cr(chg)}</dd><dt>Contractor contingency (${G.cont}%)</dt><dd>${cr((cw + chg) * num(G.cont) / 100)}</dd><dt>Fee (${G.fee}%)</dt><dd>${cr((cw + chg) * (1 + num(G.cont) / 100) * num(G.fee) / 100)}</dd><dt><b>Guaranteed maximum price</b></dt><dd><b>${cr(gmp)}</b></dd><dt>Phase 1 preconstruction fee</dt><dd>${cr(G.prefee)}</dd></dl>` : '<p class="sub">Envelope B figures are restricted for your role.</p>'}</div></div>
   <div class="panel"><div class="ph"><h3>Shared savings at different final costs</h3><span class="sub">${G.share}% of savings below the GMP to the contractor</span></div>${can('envB') ? `<div class="tw"><table class="t"><thead><tr><th>Outturn</th><th class="num">Final cost + fee</th><th class="num">Our share</th><th class="num">Owner share</th><th class="num">Overrun we absorb</th></tr></thead><tbody>${sc.map(r => `<tr><td>${r[0]}</td><td class="num mono">${fmtN(r[1], 1)}</td><td class="num mono">${fmtN(r[2], 1)}</td><td class="num mono">${fmtN(r[3], 1)}</td><td class="num mono" style="${r[4] ? 'color:var(--bad)' : ''}">${fmtN(r[4], 1)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="pb"><div class="permbar">${IC.lock}<span>The savings model carries the final cost and fee, so it sits in envelope B. Viewed by ${esc(whoCan('envB'))}.</span></div></div>`}</div></div>
  <div class="panel"><div class="ph"><h3>Terms</h3></div><div class="pb stack">${inp('prefee', 'Preconstruction fee (₹ Cr)')}${inp('cont', 'Contingency %')}${inp('fee', 'Fee %')}${inp('share', 'Our share of savings %')}${can('est') || can('margin') ? `<div class="row"><button class="btn sm" data-a="gmpst" data-v="Submitted to owner">Submit GMP to owner</button><button class="btn sm ok" data-a="gmpst" data-v="Agreed">Record agreement</button></div>` : ''}<p class="sub">The GMP is agreed at 60% design. Cost of work comes from Cost build-up; approved design changes come from Design development.</p></div></div></div>`;
}

/* ---------------- O&M operator screens ---------------- */
function tSurvey() {
  const o = O(), T = subtabs('survey', [['cond', 'Asset condition', o.cond.length], ['base', 'Performance baseline', o.quality.length]]);
  const by = p => sum(o.cond.filter(c => c.payer === p), 'rect');
  let x = T.cur === 'cond' ? `<div class="grid g4">${kpi('Assets surveyed', o.cond.length)}${kpi('Poor condition (1–2)', o.cond.filter(c => num(c.cond) <= 2).length, '', o.cond.some(c => num(c.cond) <= 2) ? 'bad' : 'ok')}${kpi('Rectification: owner', cr(by('Owner'), 2))}${kpi('Rectification: ours', cr(by('Operator') + by('Shared') / 2, 2), 'priced into the opex', 'warn')}</div>` + ctable('cond', [{ l: 'Asset', v: r => `<b>${esc(r.asset)}</b><div class="sub">${esc(r.area)}</div>` }, { l: 'Condition', v: r => qsel('cond', r, 'cond', [1, 2, 3, 4, 5].map(n => [n, n + ' · ' + ['', 'Very poor', 'Poor', 'Fair', 'Good', 'Very good'][n]]), v => `<span class="chip ${v <= 2 ? 'bad' : v === 3 ? 'warn' : 'ok'}">${v}</span>`) }, { l: 'Remaining life (yrs)', v: r => qnum('cond', r, 'life', 60), num: 1 }, { l: 'Rectification ₹ Cr', v: r => qnum('cond', r, 'rect', 70), num: 1 }, { l: 'Who pays', v: r => qs('cond', r, 'payer', ['Owner', 'Operator', 'Shared']) }, { l: '', v: r => r.payer !== 'Operator' && can('clar') ? `<button class="btn sm ghost" data-a="condq" data-id="${r.id}">Raise query</button>` : '' }], { title: 'Asset condition survey', empty: 'Walk the plant and record each major asset.' })
    : ctable('quality', [{ l: 'Parameter', v: r => esc(r.p) }, { l: 'Inflow', v: r => esc(r.raw), num: 1 }, { l: 'Current outflow / target', v: r => `<b>${esc(r.tr)}</b>`, num: 1 }, { l: 'Consent', v: r => esc(r.norm) }], { title: 'Plant performance baseline' });
  return `${sh('Stage 5 · Asset survey', 'Site and asset condition survey', 'What you will take over: condition, remaining life and who pays to put it right. Owner-paid items become clarifications; our share is priced into the opex model.')}${permBar('survey')}${T.html}${x}`;
}
function tOpex() {
  const o = O(), p = omPrice(), X = o.omx, ed = can('opex') && !gateSigned('G2');
  const T = subtabs('opex', [['lines', 'Cost lines', o.om.length], ['crew', 'Crew & staffing', sum(o.crew, 'n')], ['kpi', 'KPIs & deductions', o.kpis.length], ['price', 'Fee & approval (G2)']]); let x = '';
  if (T.cur === 'lines') x = ctable('om', [{ l: 'Cost line (year 1)', v: r => esc(r.item) }, { l: '₹ Cr / year', v: r => qnum('om', r, 'cost', 80), num: 1 }], { title: 'Operating cost lines', foot: `<tfoot><tr><td>Total excluding crew</td><td class="num mono">${fmtN(p.lines, 2)}</td><td></td></tr></tfoot>` });
  if (T.cur === 'crew') x = ctable('crew', [{ l: 'Position', v: r => esc(r.role) }, { l: 'Number', v: r => qnum('crew', r, 'n', 60), num: 1 }, { l: '₹ lakh / person / yr', v: r => qnum('crew', r, 'rate', 70), num: 1 }, { l: '₹ Cr / yr', v: r => `<b class="mono">${fmtN(num(r.n) * num(r.rate) / 100, 2)}</b>`, num: 1 }], { title: 'Crew', right: `<span class="sub">${sum(o.crew, 'n')} people · ${cr(p.crew, 2)} / yr</span>` });
  if (T.cur === 'kpi') { const eb = can('envB'); x = ctable('kpis', [{ l: 'KPI', v: r => `<b>${esc(r.kpi)}</b><div class="sub">${esc(r.target)}</div>` }, { l: 'Deduction %', v: r => qnum('kpis', r, 'ded', 60), num: 1 }, { l: 'Expected breaches / yr', v: r => qnum('kpis', r, 'exp', 60), num: 1 }, ...(eb ? [{ l: 'Expected deduction ₹ Cr / yr', v: r => `<span class="mono">${fmtN(p.price / 12 * num(r.ded) / 100 * num(r.exp), 2)}</span>`, num: 1 }] : [])], { title: 'KPI regime', right: eb ? `<span class="sub">Allowance priced in: ${cr(p.kpi, 2)} / yr</span>` : `<span class="sub">Deduction values are derived from the fee, so they sit in envelope B.</span>` }); }
  if (T.cur === 'price') { const mx = Math.max(1, ...p.yrs), inp = (k, l) => `<label class="fld" for="omx-${k}">${l}<input type="number" step="any" id="omx-${k}" data-c="omxset" data-k="${k}" value="${X[k]}" ${ed ? '' : 'disabled'}></label>`;
    x = `<div class="grid g-side"><div class="stack">${can('envB') ? `<div class="grid g4">${kpi('Annual cost', cr(p.direct, 2))}${kpi('Year-1 fee', cr(p.price, 2), p.m + '% margin')}${kpi('Contract value', cr(p.total, 1), X.years + ' years')}${kpi('NPV at 10%', cr(p.npv, 1))}</div>
     <div class="panel"><div class="ph"><h3>Build-up (year 1)</h3></div><div class="pb"><dl class="kv"><dt>Cost lines</dt><dd>${cr(p.lines, 2)}</dd><dt>Crew</dt><dd>${cr(p.crew, 2)}</dd><dt>Overhead (${X.overhead}%)</dt><dd>${cr(p.ovh, 2)}</dd><dt>KPI deduction allowance</dt><dd>${cr(p.kpi, 2)}</dd><dt>Margin</dt><dd>${X.margin}%</dd><dt><b>Annual fee</b></dt><dd><b>${cr(p.price, 2)}</b> · ₹${o.meta.mld ? fmtN(p.price / o.meta.mld, 3) : '—'} Cr per MLD</dd></dl></div></div>
     <div class="panel"><div class="ph"><h3>Fee by contract year</h3><span class="sub">Escalation ${o.omEsc}% a year</span></div><div class="pb"><svg viewBox="0 0 600 150" style="width:100%;max-width:860px;display:block" role="img" aria-label="Fee by year">${p.yrs.map((v, i) => { const h = v / mx * 110, w = 520 / p.yrs.length; return `<rect x="${30 + i * w}" y="${125 - h}" width="${w * 0.7}" height="${h}" rx="2" style="fill:var(--pack)"/><text x="${30 + i * w + w * 0.35}" y="142" text-anchor="middle" style="font:10px var(--f-mono);fill:var(--muted)">Y${i + 1}</text>`; }).join('')}</svg></div></div>` : '<div class="note warn"><div>Prices are restricted for your role.</div></div>'}</div>
     <div class="stack"><div class="panel"><div class="ph"><h3>Terms</h3></div><div class="pb stack">${inp('years', 'Contract years')}${inp('overhead', 'Overhead %')}${inp('margin', 'Margin %')}<label class="fld" for="omesc2">Escalation % a year<input type="number" id="omesc2" data-c="omesc" value="${o.omEsc}" step="0.5" ${ed ? '' : 'disabled'}></label></div></div>${gatePanel('G2', o.om.length > 0 || o.crew.length > 0, 'Add cost lines or crew first.')}</div></div>`; }
  return `${sh('Stage 6 · Opex model', 'Opex model and O&M fee', 'Cost lines, crew and the KPI deduction regime build the annual fee, escalated over the contract term. The fee flows to the financial bid.')}${permBar('opex')}${T.html}${x}`;
}
function tTakeover() {
  const o = O(), done = o.tchk.filter(t => t.st === 'Done').length, n = sum(o.crew, 'n'), mob = sum(o.crew, 'mob'), ready = o.tchk.length > 0 && done === o.tchk.length;
  return `${sh('Stage 10 · Mobilisation & takeover', 'Mobilisation and takeover', 'Mobilise the crew, inspect the plant jointly with the owner, take baseline samples and transfer permits. The takeover certificate (G5) starts the operating period.')}${permBar('takeover')}
  <div class="grid g3">${kpi('Takeover checklist', `${done}/${o.tchk.length}`, '', ready ? 'ok' : 'warn')}${kpi('Crew mobilised', `${mob}/${n}`, '', mob >= n && n ? 'ok' : 'warn')}${kpi('Owner-paid rectification', cr(sum(o.cond.filter(c => c.payer === 'Owner'), 'rect'), 2), 'agree before takeover')}</div>
  <div class="grid g-side"><div class="stack">${ctable('tchk', [{ l: 'Item', v: r => esc(r.item) }, { l: 'Status', v: r => chk('tchk', r) }], { title: 'Takeover checklist' })}${ctable('crew', [{ l: 'Position', v: r => esc(r.role) }, { l: 'Required', v: r => r.n, num: 1 }, { l: 'Mobilised', v: r => qnum('crew', r, 'mob', 60), num: 1 }], { title: 'Crew mobilisation', ro: false, add: false })}</div>${gatePanel('G5', ready, 'Complete every takeover item.')}</div>`;
}
function tOps() {
  const o = O(), L = o.logs.slice().sort((a, b) => a.date < b.date ? -1 : 1), br = L.filter(l => num(l.bodOut) > 10 || num(l.tssOut) > 10), ok = L.length ? Math.round((L.length - br.length) / L.length * 100) : 0, en = L.length ? sum(L, 'kwh') / sum(L, 'flow') : 0, p = omPrice();
  const T = subtabs('ops', [['logs', 'Daily logs', L.length], ['report', 'Monthly KPI report & invoice']]); let x = '';
  if (T.cur === 'logs') { const lo = 0, hi = Math.max(14, ...L.map(l => num(l.bodOut))), X = i => 40 + i / Math.max(1, L.length - 1) * 510, Y = v => 15 + (hi - v) / (hi - lo) * 120;
    x = `<div class="grid g4">${kpi('Days compliant', ok + '%', `${br.length} breach day(s)`, br.length ? 'warn' : 'ok')}${kpi('Avg treated BOD', L.length ? fmtN(sum(L, 'bodOut') / L.length, 1) + ' mg/l' : '—')}${kpi('Avg inflow', L.length ? fmtN(sum(L, 'flow') / L.length, 1) + ' MLD' : '—')}${kpi('Specific energy', en ? en.toFixed(3) + ' kWh/m³' : '—', 'cap 0.18', en > 0.18 ? 'bad' : 'ok')}</div>
     ${L.length > 1 ? `<div class="panel"><div class="ph"><h3>Treated BOD against the consent limit</h3></div><div class="pb"><svg viewBox="0 0 570 160" style="width:100%;max-width:860px;display:block" role="img" aria-label="Daily treated BOD"><line x1="40" x2="550" y1="${Y(10)}" y2="${Y(10)}" style="stroke:var(--bad);stroke-dasharray:6 4"/><text x="548" y="${Y(10) - 5}" text-anchor="end" style="font:10.5px var(--f-body);fill:var(--bad)">Consent 10 mg/l</text><polyline points="${L.map((l, i) => X(i) + ',' + Y(num(l.bodOut))).join(' ')}" style="fill:none;stroke:var(--pack);stroke-width:2"/>${L.map((l, i) => num(l.bodOut) > 10 ? `<circle cx="${X(i)}" cy="${Y(num(l.bodOut))}" r="4" style="fill:var(--bad)"/>` : '').join('')}<text x="40" y="155" style="font:10px var(--f-mono);fill:var(--muted)">${esc(L[0].date)}</text><text x="550" y="155" text-anchor="end" style="font:10px var(--f-mono);fill:var(--muted)">${esc(L[L.length - 1].date)}</text></svg></div></div>` : ''}
     ${ctable('logs', [{ l: 'Date', v: r => `<span class="mono">${esc(r.date)}</span>` }, { l: 'Inflow MLD', v: r => r.flow, num: 1 }, { l: 'Raw BOD', v: r => r.bodIn, num: 1 }, { l: 'Treated BOD', v: r => `<span class="chip ${num(r.bodOut) > 10 ? 'bad' : 'ok'}">${r.bodOut}</span>`, num: 1 }, { l: 'Treated TSS', v: r => `<span class="chip ${num(r.tssOut) > 10 ? 'bad' : 'ok'}">${r.tssOut}</span>`, num: 1 }, { l: 'MWh', v: r => r.kwh, num: 1 }], { title: 'Daily log sheet', empty: 'Record the day\'s flow, lab results and energy.' })}`; }
  if (T.cur === 'report') { const k = o.kpis, dedBOD = (k.find(z => /bod/i.test(z.kpi)) || { ded: 0.5 }).ded, dedE = (k.find(z => /energy/i.test(z.kpi)) || { ded: 0.5 }).ded, monthly = p.price / 12, d1 = monthly * num(dedBOD) / 100 * br.length, d2 = en > 0.18 ? monthly * num(dedE) / 100 : 0, cap = monthly * 0.1, ded = Math.min(cap, d1 + d2);
    x = `<div class="grid g-side"><div class="panel"><div class="ph"><h3>KPI report for the period</h3><span class="sub">${L.length} days logged</span></div><div class="tw"><table class="t"><thead><tr><th>KPI</th><th>Result</th><th class="num">Deduction ₹ Cr</th></tr></thead><tbody><tr><td>Treated BOD / TSS within consent</td><td>${br.length} breach day(s)</td><td class="num mono">${fmtN(d1, 3)}</td></tr><tr><td>Specific energy ≤ 0.18 kWh/m³</td><td>${en.toFixed(3)} kWh/m³</td><td class="num mono">${fmtN(d2, 3)}</td></tr><tr><td>Monthly report by the 7th</td><td>On time</td><td class="num mono">0.000</td></tr><tr class="grp"><td>Total (capped at 10% of monthly fee)</td><td></td><td class="num mono">${fmtN(ded, 3)}</td></tr></tbody></table></div></div>
     <div class="panel"><div class="ph"><h3>Invoice</h3></div><div class="pb stack">${can('envB') ? `<dl class="kv"><dt>Monthly fee</dt><dd>${cr(monthly, 3)}</dd><dt>Deductions</dt><dd>− ${cr(ded, 3)}</dd><dt><b>Net invoice</b></dt><dd><b>${cr(monthly - ded, 3)}</b></dd></dl>` : '<p class="sub">Restricted.</p>'}${can('ops') || can('cadmin') ? `<button class="btn pri" data-a="ominv" data-v="${(monthly - ded).toFixed(3)}">Raise this month's invoice</button>` : ''}<p class="sub">Invoices go to Invoices & contract admin for submission and payment tracking.</p></div></div></div>`; }
  return `${sh('Stage 11 · Operations', 'Operations', 'Daily logs against the discharge consent, then the monthly KPI report and the invoice with deductions worked out from the logs.')}${permBar('ops')}${T.html}${x}`;
}
function tMaint() {
  const o = O(), T = subtabs('maint', [['wo', 'Work orders', o.wo.filter(w => w.st !== 'Done').length], ['renew', 'Asset renewal plan', o.renew.length]]), pm = o.wo.filter(w => w.type === 'Planned'), od = o.wo.filter(w => w.st !== 'Done' && w.due && new Date(w.due) < TODAY);
  const x = T.cur === 'wo' ? `<div class="grid g4">${kpi('Open work orders', o.wo.filter(w => w.st !== 'Done').length)}${kpi('Overdue', od.length, '', od.length ? 'bad' : 'ok')}${kpi('Planned maintenance done', pm.length ? Math.round(pm.filter(w => w.st === 'Done').length / pm.length * 100) + '%' : '—')}${kpi('Breakdowns', o.wo.filter(w => w.type === 'Breakdown').length)}</div>` + ctable('wo', [{ l: 'WO', v: r => `<span class="mono">${esc(r.id)}</span>`, cls: 'id' }, { l: 'Asset', v: r => esc(r.asset) }, { l: 'Type', v: r => `<span class="chip ${r.type === 'Breakdown' ? 'bad' : r.type === 'Planned' ? 'info' : ''}">${esc(r.type)}</span>` }, { l: 'Work', v: r => esc(r.desc) }, { l: 'Due', v: r => `<span class="mono ${od.includes(r) ? '' : ''}">${esc(r.due)}</span>${od.includes(r) ? ' <span class="chip bad">Overdue</span>' : ''}` }, { l: 'Status', v: r => qs('wo', r, 'st', ['Open', 'In progress', 'Done']) }], { title: 'CMMS work orders' })
    : ctable('renew', [{ l: 'Asset', v: r => esc(r.asset) }, { l: 'Year', v: r => qnum('renew', r, 'year', 56), num: 1 }, { l: '₹ Cr', v: r => qnum('renew', r, 'cost', 70), num: 1 }, { l: 'Paid by', v: r => qs('renew', r, 'payer', ['Owner', 'Operator']) }], { title: 'Asset renewal plan', right: `<span class="sub">Operator share ${cr(sum(o.renew.filter(r => r.payer === 'Operator'), 'cost'), 2)}</span>` });
  return `${sh('Stage 12 · Maintenance', 'Maintenance', 'Planned and breakdown work orders, and the renewal plan that keeps assets at the handback grade.')}${permBar('maint')}${T.html}${x}`;
}
function tHandback() {
  const o = O(), ready = o.hb.length > 0 && o.hb.every(h => h.st === 'Done');
  return `${sh('Stage 13 · Handback', 'Asset renewal and handback', 'Hand the plant back at the agreed condition grade with spares, records and CMMS history. Condition at takeover is the reference.')}${permBar('takeover')}
  <div class="grid g-side"><div class="stack">${ctable('hb', [{ l: 'Item', v: r => esc(r.item) }, { l: 'Status', v: r => chk('hb', r) }], { title: 'Handback checklist' })}<div class="panel"><div class="ph"><h3>Condition at takeover (reference)</h3></div><div class="tw"><table class="t"><tbody>${o.cond.map(c => `<tr><td>${esc(c.asset)}</td><td><span class="chip ${num(c.cond) <= 2 ? 'bad' : num(c.cond) === 3 ? 'warn' : 'ok'}">${c.cond}</span></td><td class="sub">${esc(c.payer)} rectification</td></tr>`).join('') || '<tr><td class="sub">No survey recorded.</td></tr>'}</tbody></table></div></div></div>${gatePanel('G6', ready, 'Complete every handback item.')}</div>`;
}

/* ---------------- EPCM / consultant screens ---------------- */
function tTeam() {
  const o = O(), k = o.team.filter(t => t.key), below = o.team.filter(t => num(t.yrs) < num(t.req));
  return `${sh('Stage 5 · Team & CVs', 'Key experts and CVs', 'Key experts carry most of the technical score. Each position is checked against the TOR minimum experience; missing CVs block proposal release.')}${permBar('team')}
  <div class="grid g4">${kpi('Key experts', k.length)}${kpi('CVs final', `${o.team.filter(t => t.cv === 'Final').length}/${o.team.length}`, '', o.team.every(t => t.cv === 'Final') ? 'ok' : 'warn')}${kpi('Below TOR minimum', below.length, below.map(t => t.pos).join(', ').slice(0, 60), below.length ? 'bad' : 'ok')}${kpi('Expected technical score', ourTech() + ' / 100')}</div>
  ${ctable('team', [{ l: 'Position', v: r => `<b>${esc(r.pos)}</b>${r.key ? ' <span class="chip pk">Key</span>' : ''}` }, { l: 'Proposed expert', v: r => esc(r.name) || '<span class="chip bad">Not identified</span>' }, { l: 'Experience', v: r => `<span class="chip ${num(r.yrs) >= num(r.req) ? 'ok' : 'bad'}">${r.yrs}/${r.req} yrs</span>` }, { l: 'Similar', v: r => r.similar, num: 1 }, { l: 'CV', v: r => qs('team', r, 'cv', ['Missing', 'Draft', 'Final']) }, { l: 'Expected score', v: r => qnum('team', r, 'score', 60), num: 1 }], { title: 'Key experts' })}`;
}
function tFee() {
  const o = O(), f = feeTotals(), ed = can('fee') && !gateSigned('G2'), Q = qcbs(), me = Q.findIndex(q => q.us);
  const T = subtabs('fee', [['mm', 'Man-months & rates', o.fee.length], ['reimb', 'Reimbursables', o.reimb.length], ['qcbs', 'QCBS score', me >= 0 && can('envB') ? 'rank ' + (me + 1) : ''], ['approve', 'Fee approval (G2)']]); let x = '';
  if (T.cur === 'mm') x = ctable('fee', [{ l: 'Position', v: r => esc(r.pos) }, { l: 'Man-months', v: r => qnum('fee', r, 'mm', 66), num: 1 }, { l: '₹ lakh / man-month', v: r => qnum('fee', r, 'rate', 66), num: 1 }, { l: '₹ Cr', v: r => `<b class="mono">${fmtN(num(r.mm) * num(r.rate) / 100, 2)}</b>`, num: 1 }], { title: 'Remuneration', foot: `<tfoot><tr><td>Total</td><td class="num mono">${fmtN(sum(o.fee, 'mm'))}</td><td></td><td class="num mono">${fmtN(f.remun, 2)}</td><td></td></tr></tfoot>` });
  if (T.cur === 'reimb') x = ctable('reimb', [{ l: 'Item', v: r => esc(r.item) }, { l: '₹ lakh', v: r => qnum('reimb', r, 'amt', 80), num: 1 }], { title: 'Reimbursable expenses', right: `<span class="sub">${cr(f.reimb, 2)}</span>` });
  /* The financial score is lowest fee ÷ firm fee, so publishing it alongside the combined
     score lets our own fee be worked back out. Without envelope B, only technical shows. */
  if (T.cur === 'qcbs') { const eb = can('envB'); x = `<div class="grid g-side"><div class="panel"><div class="ph"><h3>Combined score (technical ${o.qcbs.tw} : financial ${o.qcbs.cw})</h3>${eb ? '' : '<span class="chip">Technical only</span>'}</div><div class="tw"><table class="t"><thead><tr>${eb ? '<th>Rank</th>' : ''}<th>Firm</th><th class="num">Technical</th>${eb ? '<th class="num">Fee ₹ Cr</th><th class="num">Financial score</th><th class="num">Combined</th>' : ''}</tr></thead><tbody>${Q.map((q, i) => `<tr class="${q.us ? 'hl' : ''}">${eb ? `<td><span class="chip ${i === 0 ? 'ok' : ''}">${i + 1}</span></td>` : ''}<td><b>${esc(q.name)}</b></td><td class="num mono">${fmtN(q.tech, 1)}</td>${eb ? `<td class="num mono">${fmtN(q.fee, 2)}</td><td class="num mono">${fmtN(q.fs, 1)}</td><td class="num mono"><b>${fmtN(q.comb, 2)}</b></td>` : ''}</tr>`).join('')}</tbody></table></div><div class="pb sub">${eb ? "Financial score = lowest fee ÷ firm fee × 100. Our technical score comes from the key experts' expected scores." : `The fee, the financial score, the combined score and the resulting rank all sit in envelope B, because our fee can be derived from them. Viewed by ${esc(whoCan('envB'))}.`}</div></div>
    <div class="stack"><div class="panel"><div class="ph"><h3>Weights</h3></div><div class="pb stack"><label class="fld" for="q-tw">Technical weight %<input type="number" id="q-tw" data-c="qcbsw" data-k="tw" value="${o.qcbs.tw}" ${ed ? '' : 'disabled'}></label><label class="fld" for="q-cw">Financial weight %<input type="number" id="q-cw" data-c="qcbsw" data-k="cw" value="${o.qcbs.cw}" ${ed ? '' : 'disabled'}></label></div></div>${ctable('comps', [{ l: 'Competitor', v: r => esc(r.name) }, { l: 'Tech', v: r => qnum('comps', r, 'tech', 56), num: 1 }, { l: 'Fee', v: r => qnum('comps', r, 'fee', 64), num: 1 }], { title: 'Competitors' })}</div></div>`; }
  if (T.cur === 'approve') x = `<div class="grid g-side"><div class="panel"><div class="ph"><h3>Fee summary</h3></div><div class="pb">${can('envB') ? `<dl class="kv"><dt>Remuneration</dt><dd>${cr(f.remun, 2)} (${fmtN(sum(o.fee, 'mm'))} man-months)</dd><dt>Reimbursables</dt><dd>${cr(f.reimb, 2)}</dd><dt><b>Total fee</b></dt><dd><b>${cr(f.price, 2)}</b></dd><dt>Fee as % of works</dt><dd>${o.meta.works ? (f.price / o.meta.works * 100).toFixed(2) + '% of ₹' + fmtN(o.meta.works) + ' Cr' : '—'}</dd><dt>QCBS rank</dt><dd>${me + 1} of ${Q.length}</dd></dl>` : '<p class="sub">Restricted.</p>'}</div></div>${gatePanel('G2', o.fee.length > 0, 'Add man-month lines first.')}</div>`;
  return `${sh('Stage 6 · Fee estimate', 'Fee estimate and QCBS', 'Man-months × billing rates plus reimbursables make the fee. The combined score shows where it lands against expected competitors.')}${permBar('fee')}${T.html}${x}`;
}
function tCdel() {
  const o = O(), d = o.cdeliv;
  return `${sh('Stage 10 · Studies & design', 'Deliverables to the client', 'Inception, design vetting, tender documents and reports, each tracked to acceptance by the client.')}${permBar('cdel')}
  <div class="grid g4">${kpi('Deliverables', d.length)}${kpi('Accepted', d.filter(x => x.st === 'Accepted').length, '', 'ok')}${kpi('With client comments', d.filter(x => x.st === 'Client comments').length, '', 'warn')}${kpi('Submitted, awaiting', d.filter(x => x.st === 'Submitted').length)}</div>
  ${ctable('cdeliv', [{ l: 'ID', v: r => `<span class="mono">${esc(r.id)}</span>`, cls: 'id' }, { l: 'Deliverable', v: r => `<b>${esc(r.title)}</b>${r.comments ? `<div class="sub">${esc(r.comments)}</div>` : ''}` }, { l: 'Due', v: r => esc(r.due) }, { l: 'Status', v: r => qs('cdeliv', r, 'st', ['Not started', 'Draft', 'Submitted', 'Client comments', 'Accepted']) }], { title: 'Deliverables register' })}`;
}
function tOproc() {
  const o = O(), R2 = o.obids.filter(b => b.resp === 'Responsive' && num(b.tech) >= 70).sort((a, b) => num(a.price) - num(b.price)), ed = can('oproc');
  return `${sh('Stage 11 · Owner-side procurement', 'Contractor bid evaluation', 'We run the contractor tender for the owner: responsiveness, technical qualification (70 minimum), then the lowest evaluated price. The recommendation goes to the owner by email.')}${permBar('oproc')}
  <div class="panel"><div class="ph"><h3>Package</h3>${ed ? `<input type="text" id="opkg" data-c="opkg" value="${esc(o.opkg)}" style="width:340px" aria-label="Package">` : `<b>${esc(o.opkg)}</b>`}</div></div>
  <div class="grid g-side">${ctable('obids', [{ l: 'Bidder', v: r => `<b>${esc(r.bidder)}</b>` }, { l: 'Responsive', v: r => qs('obids', r, 'resp', ['Responsive', 'Non-responsive']) }, { l: 'Technical', v: r => qnum('obids', r, 'tech', 60), num: 1 }, { l: 'Price ₹ Cr', v: r => qnum('obids', r, 'price', 76), num: 1 }, { l: 'Rank', v: r => { const i = R2.indexOf(r); return i >= 0 ? `<span class="chip ${i === 0 ? 'ok' : ''}">L${i + 1}</span>` : '<span class="chip bad">Out</span>'; } }], { title: 'Bids received' })}
  <div class="panel"><div class="ph"><h3>Recommendation</h3></div><div class="pb stack">${R2.length ? `<p>Award <b>${esc(o.opkg)}</b> to <b>${esc(R2[0].bidder)}</b> at ${cr(R2[0].price, 2)}, the lowest evaluated responsive bid${R2[1] ? `, ${((num(R2[1].price) - num(R2[0].price)) / num(R2[0].price) * 100).toFixed(1)}% below the next` : ''}.</p>${ed ? `<button class="btn pri" data-a="oprocmail">${IC.chat}Send evaluation report to the owner</button>` : ''}` : '<p class="sub">No responsive bid above the technical minimum yet.</p>'}<div>${mailThread('oproc', { empty: 'No report sent yet.' })}</div></div></div></div>`;
}
function tSuperv() {
  const o = O(), T = subtabs('superv', [['bills', 'Contractor bills', o.cbills.filter(b => b.st !== 'Certified').length], ['insp', 'Inspections', o.insp.length], ['var', 'Variations', o.cvar.filter(v => v.st === 'Under assessment').length], ['gate', 'Taking-over (G5)']]); let x = '';
  if (T.cur === 'bills') x = `<div class="grid g3">${kpi('Claimed', cr(sum(o.cbills, 'claimed'), 2))}${kpi('Certified', cr(sum(o.cbills, 'cert'), 2))}${kpi('Pending certification', o.cbills.filter(b => b.st !== 'Certified').length)}</div>` + ctable('cbills', [{ l: 'Bill', v: r => `<span class="mono">${esc(r.id)}</span>`, cls: 'id' }, { l: 'Contractor', v: r => esc(r.contractor) }, { l: 'Period', v: r => esc(r.period) }, { l: 'Claimed', v: r => `<span class="mono">${fmtN(r.claimed, 2)}</span>`, num: 1 }, { l: 'Certified', v: r => qnum('cbills', r, 'cert', 76), num: 1 }, { l: 'Status', v: r => qs('cbills', r, 'st', ['Received', 'Under check', 'Certified', 'Returned']) }], { title: 'Contractor running bills to certify (₹ Cr)' });
  if (T.cur === 'insp') x = ctable('insp', [{ l: 'Date', v: r => `<span class="mono">${esc(r.date)}</span>` }, { l: 'Activity', v: r => esc(r.act) }, { l: 'Result', v: r => qs('insp', r, 'res', ['Passed', 'Passed with comments', 'Failed']) }], { title: 'Inspections and witness tests' });
  if (T.cur === 'var') x = ctable('cvar', [{ l: 'ID', v: r => `<span class="mono">${esc(r.id)}</span>`, cls: 'id' }, { l: 'Variation', v: r => esc(r.desc) }, { l: 'Claimed', v: r => `<span class="mono">${fmtN(r.claimed, 2)}</span>`, num: 1 }, { l: 'Assessed', v: r => qnum('cvar', r, 'assessed', 70), num: 1 }, { l: 'Status', v: r => qs('cvar', r, 'st', ['Under assessment', 'Recommended', 'Rejected']) }], { title: 'Contractor variations assessed for the owner' });
  if (T.cur === 'gate') { const failed = o.insp.filter(i => i.res === 'Failed').length, pend = o.cvar.filter(v => v.st === 'Under assessment').length; x = `<div class="grid g-side"><div class="panel"><div class="ph"><h3>Readiness for taking-over</h3></div><div class="pb stack" style="gap:8px"><div class="row between"><span>Failed inspections open</span><span class="chip ${failed ? 'bad' : 'ok'}">${failed}</span></div><div class="row between"><span>Variations under assessment</span><span class="chip ${pend ? 'warn' : 'ok'}">${pend}</span></div><div class="row between"><span>Bills awaiting certification</span><span class="chip">${o.cbills.filter(b => b.st !== 'Certified').length}</span></div></div></div>${gatePanel('G5', !failed && !pend, 'Close failed inspections and assess every variation first.')}</div>`; }
  return `${sh('Stage 12 · Supervision', 'Construction supervision', 'On the owner\'s behalf: certify contractor bills, witness inspections, assess variations, then recommend taking-over.')}${permBar('superv')}${T.html}${x}`;
}
function tTsheet() {
  const o = O(), T = subtabs('tsheet', [['mm', 'Man-month burn', o.mmuse.length], ['inv', 'Invoices', o.inv.length]]), bud = sum(o.mmuse, 'budget'), used = sum(o.mmuse, 'used');
  const x = T.cur === 'mm' ? `<div class="grid g3">${kpi('Budget', fmtN(bud) + ' man-months')}${kpi('Used', fmtN(used), bud ? Math.round(used / bud * 100) + '% of budget' : '')}${kpi('Over budget', o.mmuse.filter(m => num(m.used) > num(m.budget)).length, 'positions', o.mmuse.some(m => num(m.used) > num(m.budget)) ? 'bad' : 'ok')}</div>` + ctable('mmuse', [{ l: 'Position', v: r => esc(r.pos) }, { l: 'Budget', v: r => r.budget, num: 1 }, { l: 'Used', v: r => qnum('mmuse', r, 'used', 60), num: 1 }, { l: 'Burn', v: r => bar(num(r.budget) ? num(r.used) / num(r.budget) * 100 : 0, num(r.used) > num(r.budget) ? 'bad' : '') }], { title: 'Man-months by position' })
    : `<div class="grid g3">${kpi('Invoiced', cr(sum(o.inv, 'amt'), 2))}${kpi('Paid', cr(sum(o.inv.filter(i => i.st === 'Paid'), 'amt'), 2))}${kpi('Fee remaining', cr(feeTotals().price - sum(o.inv, 'amt'), 2))}</div>` + ctable('inv', [{ l: 'Invoice', v: r => `<span class="mono">${esc(r.id)}</span>`, cls: 'id' }, { l: 'Milestone / period', v: r => esc(r.milestone) }, { l: '₹ Cr', v: r => qnum('inv', r, 'amt', 70), num: 1 }, { l: 'Status', v: r => qs('inv', r, 'st', ['Draft', 'Submitted', 'Approved', 'Paid']) }], { title: 'Invoices' });
  return `${sh('Stage 10–12 · Commercial', 'Man-months and invoices', 'Time spent by each expert against the man-months in the contract, and invoices against milestones.')}${permBar('tsheet')}${T.html}${x}`;
}
function tCloseout() {
  const o = O(), ready = o.clo.length > 0 && o.clo.every(c => c.st === 'Done');
  return `${sh('Stage 13 · Close-out', 'Assignment close-out', 'Final report, as-built verification, all bills certified, records to the owner, and the completion certificate.')}${permBar('om')}<div class="grid g-side"><div class="stack">${ctable('clo', [{ l: 'Item', v: r => esc(r.item) }, { l: 'Status', v: r => chk('clo', r) }], { title: 'Close-out checklist' })}<div class="panel"><div class="ph"><h3>Lessons learned</h3>${can('om') ? '<button class="btn sm" data-a="lessons">Save</button>' : ''}</div><div class="pb">${can('om') ? `<textarea id="lessonsin" style="min-height:90px" aria-label="Lessons learned">${esc(o.lessons)}</textarea>` : `<p>${esc(o.lessons)}</p>`}</div></div></div>${gatePanel('G6', ready, 'Complete every close-out item.')}</div>`;
}

/* ---------------- proposal templates and commercial volume per role ---------------- */
function rolePropTemplate() {
  if (PROFILE === 'db') return [['exec', 'Executive Summary', 'bid_manager', 'rfp', [['exec-obj', "Owner's objectives and our understanding"], ['exec-offer', 'Our offer at a glance', 'table'], ['exec-why', 'Win themes']]], ['comp', 'Compliance Statement and Deviations', 'bid_manager', 'rfp', [['comp-matrix', 'Compliance matrix', 'table'], ['comp-clar', 'Clarifications and assumptions', 'table'], ['comp-dev', 'Proposed deviations', 'table']]], ['basis', 'Design Basis', 'process', 'rfp', [['basis-crit', 'Design criteria', 'table'], ['basis-eff', 'Treated effluent standards', 'table']]], ['proc', 'Process Design Concept', 'process', 'rfp', [['proc-train', 'Treatment train'], ['proc-tert', 'Tertiary filtration and disinfection']]], ['design', 'Design Management and Development', 'design', 'rfp', [['design-plan', 'Design programme: 30, 60, 90% and IFC'], ['design-rev', 'Owner reviews and design freeze']]], ['gmp', 'Preconstruction Services and GMP Approach', 'commercial', 'rfp', [['gmp-open', 'Open-book cost reporting'], ['gmp-share', 'Shared savings and risk allocation']]], ['eic', 'Electrical, Automation and SCADA', 'ei', 'pack', []], ['prog', 'Construction Methodology and Programme', 'pd', 'rfp', [['prog-ms', 'Master programme'], ['prog-ll', 'Long-lead procurement', 'table']]], ['cx', 'Testing, Commissioning and Taking-over', 'process', 'learned', []], ['hse', 'HSE and Quality Management', 'bid_manager', 'rfp', []], ['org', 'Organisation and Key Personnel', 'bid_manager', 'rfp', []], ['exp', 'Relevant Experience', 'bd_head', 'learned', [['exp-tab', 'Similar projects', 'table']]]];
  if (PROFILE === 'om') return [['exec', 'Executive Summary', 'bid_manager', 'rfp', [['exec-obj', "Owner's objectives and our understanding"], ['exec-why', 'Why us: operating record']]], ['comp', 'Compliance Statement and Deviations', 'bid_manager', 'rfp', [['comp-matrix', 'Compliance matrix', 'table'], ['comp-clar', 'Clarifications and assumptions', 'table']]], ['plant', 'Understanding of the Plant and Condition Survey', 'opsmgr', 'rfp', [['plant-cond', 'Asset condition findings', 'table'], ['plant-base', 'Performance baseline']]], ['ops', 'Operations Methodology', 'opsmgr', 'rfp', [['ops-shift', 'Shift operation and process control'], ['ops-lab', 'Laboratory and discharge compliance']]], ['maint', 'Maintenance Strategy and CMMS', 'maint', 'rfp', [['maint-pm', 'Planned and predictive maintenance'], ['maint-renew', 'Asset renewal plan', 'table']]], ['om', 'Staffing and Organisation', 'opsmgr', 'rfp', [['om-staff', 'Staffing schedule', 'table']]], ['energy', 'Energy and Chemical Optimisation', 'process', 'learned', []], ['takeover', 'Transition and Takeover Plan', 'opsmgr', 'learned', []], ['hse', 'HSE and Quality', 'qhse', 'rfp', []], ['exp', 'Relevant O&M Experience', 'bd_head', 'learned', [['exp-tab', 'Similar O&M contracts', 'table']]]];
  if (PROFILE === 'epcm') return [['exec', 'Executive Summary', 'bid_manager', 'rfp', []], ['comp', 'Comments on the Terms of Reference', 'teamlead', 'rfp', [['comp-matrix', 'TOR compliance matrix', 'table'], ['comp-clar', 'Clarifications', 'table']]], ['under', 'Understanding of the Assignment', 'teamlead', 'rfp', [['under-site', 'Project context and existing systems'], ['under-risk', 'Key issues and risks']]], ['method', 'Approach and Methodology', 'teamlead', 'rfp', [['method-design', 'Design review and vetting'], ['method-proc', 'Bid process management'], ['method-sup', 'Construction supervision and quality assurance']]], ['prog', 'Work Plan and Deliverables', 'teamlead', 'rfp', [['prog-del', 'Deliverables schedule', 'table']]], ['team', 'Team Composition and Key Experts', 'bid_manager', 'rfp', [['team-tab', 'Key experts', 'table'], ['team-staff', 'Staffing schedule (man-months)', 'table']]], ['hse', 'Quality Assurance Plan', 'qhse', 'rfp', []], ['exp', 'Experience of the Firm', 'bd_head', 'rfp', [['exp-tab', 'Similar assignments', 'table']]]];
  return null;
}
function roleRecTables(k) {
  const o = O();
  const m = {
    'plant-cond': () => TB(['Asset', 'Condition', 'Remaining life', 'Rectification by'], o.cond.map(c => [esc(c.asset), `${c.cond}/5`, `${c.life} yrs`, esc(c.payer)])),
    'maint-renew': () => TB(['Asset', 'Year', 'Paid by'], o.renew.map(r => [esc(r.asset), 'Y' + r.year, esc(r.payer)])),
    'team-tab': () => TB(['Position', 'Expert', 'Experience', 'CV'], o.team.map(t => [esc(t.pos), esc(t.name || 'To be named'), `${t.yrs} yrs`, esc(t.cv)])),
    'team-staff': () => TB(['Position', 'Man-months'], o.fee.map(f => [esc(f.pos), f.mm])),
    'prog-del': () => TB(['Deliverable', 'Due'], o.cdeliv.map(d => [esc(d.title), esc(d.due)]))
  };
  if (PROFILE === 'om' && k === 'om-staff') return TB(['Position', 'Number'], o.crew.map(c => [esc(c.role), c.n]));
  if (PROFILE === 'om' && k === 'exp-tab') return TB(['Contract', 'Capacity', 'Years operated'], [['Atladara-type SBR STP, Surat', '100 MLD', 6], ['Rajkot Raiya STP', '56 MLD', 4], ['Ahmedabad Pirana STP', '180 MLD', 3]]);
  if (PROFILE === 'epcm' && k === 'exp-tab') return TB(['Assignment', 'Client', 'Works value'], [['PMC, Solapur sewerage Phase II', 'Solapur MC', '₹620 Cr'], ['DPR and supervision, Aurangabad STPs', 'AMC', '₹540 Cr'], ["Owner's engineer, Navi Mumbai tertiary reuse", 'NMMC', '₹290 Cr']]);
  return m[k] ? m[k]() : null;
}
function roleComm() {
  if (PROFILE !== 'om' && PROFILE !== 'epcm') return null;
  if (!can('envB')) return `${propHead('Financial bid', 'Proposal workspace · commercial', '', '')}<div class="panel"><div class="empty">${IC.lock}<h3>Prices are restricted</h3><p>${esc(R().title)} cannot open the financial bid.</p></div></div>`;
  if (PROFILE === 'om') { const p = omPrice(); return `${propHead('Financial bid: O&M fee', 'Proposal workspace · commercial', 'Rendered from the opex model; locked when G2 is signed.', `<button class="btn" data-a="tab" data-t="opex">Open opex model</button>`)}<div class="panel envelope"><div class="ph"><h3>Annual O&M fee by contract year (₹ Cr)</h3>${gateSigned('G2') ? '<span class="chip ok">Locked to G2</span>' : '<span class="chip warn">Live</span>'}</div><div class="tw"><table class="t"><tbody>${p.yrs.map((v, i) => `<tr><td>Year ${i + 1}</td><td class="num mono">${fmtN(v, 2)}</td></tr>`).join('')}<tr class="grp"><td>Contract value</td><td class="num mono">${fmtN(p.total, 2)}</td></tr><tr><td>NPV at 10%</td><td class="num mono">${fmtN(p.npv, 2)}</td></tr></tbody></table></div></div>`; }
  const o = O(), f = feeTotals(); return `${propHead('Financial proposal', 'Proposal workspace · commercial', 'Remuneration and reimbursables in the client\'s financial forms; opened only for firms that pass the technical threshold.', `<button class="btn" data-a="tab" data-t="fee">Open fee estimate</button>`)}<div class="grid g2"><div class="panel envelope"><div class="ph"><h3>Form FIN-3 · Remuneration</h3>${gateSigned('G2') ? '<span class="chip ok">Locked to G2</span>' : '<span class="chip warn">Live</span>'}</div><div class="tw"><table class="t"><thead><tr><th>Position</th><th class="num">Man-months</th><th class="num">₹ Cr</th></tr></thead><tbody>${o.fee.map(r => `<tr><td>${esc(r.pos)}</td><td class="num mono">${r.mm}</td><td class="num mono">${fmtN(num(r.mm) * num(r.rate) / 100, 2)}</td></tr>`).join('')}<tr class="grp"><td>Total remuneration</td><td></td><td class="num mono">${fmtN(f.remun, 2)}</td></tr></tbody></table></div></div><div class="panel envelope"><div class="ph"><h3>Form FIN-4 · Reimbursables</h3></div><div class="tw"><table class="t"><tbody>${o.reimb.map(r => `<tr><td>${esc(r.item)}</td><td class="num mono">${fmtN(num(r.amt) / 100, 2)}</td></tr>`).join('')}<tr class="grp"><td>Total fee (FIN-2)</td><td class="num mono">${fmtN(f.price, 2)}</td></tr></tbody></table></div></div></div>`;
}
const _valueEstimate = valueEstimate;
valueEstimate = function () { const o = O(); if (PROFILE === 'om' && o.meta.mld) { const lo = 0.55, hi = 0.7, y = num(o.omx.years) || 7; return `<b style="font-family:var(--f-display);font-size:24px">₹${fmtN(o.meta.mld * lo * y)} Cr – ${fmtN(o.meta.mld * hi * y)} Cr</b><p class="sub">${o.meta.mld} MLD × ₹${lo}–${hi} Cr per MLD per year × ${y} years from 7 recent STP O&M awards. Confidence: moderate.</p>`; } if (PROFILE === 'epcm' && o.meta.works) return `<b style="font-family:var(--f-display);font-size:24px">₹${fmtN(o.meta.works * 0.035)} Cr – ${fmtN(o.meta.works * 0.055)} Cr</b><p class="sub">3.5–5.5% of ₹${fmtN(o.meta.works)} Cr works value, from 6 recent PMC awards. Confidence: moderate.</p>`; return _valueEstimate(); };

function roleGateSum(g) {
  const o = O(), done = l => `${l.filter(x => x.st === 'Done').length} / ${l.length}`;
  if (PROFILE === 'db') return { G2: () => { const e = _estEPC(); return [['Cost of work', cr(e.cost)], ['GMP status', o.gmp.st], ['Fee', o.gmp.fee + '%'], ['Approved design changes', cr(sum(o.dchg.filter(c => c.st === 'Approved'), 'cost'))]]; }, G5: () => [['Guarantees within limit', o.ptest.filter(ptPass).length + ' / ' + o.ptest.length], ['Design packages at IFC', o.dpk.filter(p => p.stage === 'IFC').length + ' / ' + o.dpk.length]] }[g]?.() || null;
  if (PROFILE === 'om') return { G2: () => { const p = omPrice(); return [['Year-1 fee', cr(p.price, 2)], ['Margin', p.m + '%'], ['KPI deduction allowance', cr(p.kpi, 2)], ['Contract value', cr(p.total, 1)], ['NPV at 10%', cr(p.npv, 1)]]; }, G5: () => [['Takeover checklist', done(o.tchk)], ['Crew mobilised', sum(o.crew, 'mob') + ' / ' + sum(o.crew, 'n')]], G6: () => [['Handback checklist', done(o.hb)]] }[g]?.() || null;
  if (PROFILE === 'epcm') return { G2: () => { const f = feeTotals(), q = qcbs(); return [['Total fee', cr(f.price, 2)], ['Man-months', fmtN(sum(o.fee, 'mm'))], ['Expected technical score', ourTech()], ['QCBS rank', (q.findIndex(x => x.us) + 1) + ' of ' + q.length]]; }, G5: () => [['Failed inspections', o.insp.filter(i => i.res === 'Failed').length], ['Variations under assessment', o.cvar.filter(v => v.st === 'Under assessment').length]], G6: () => [['Close-out checklist', done(o.clo)]] }[g]?.() || null;
  return null;
}
Object.assign(TABV, { design: tDesign, survey: tSurvey, opex: tOpex, takeover: tTakeover, ops: tOps, maint: tMaint, handback: tHandback, team: tTeam, fee: tFee, cdel: tCdel, oproc: tOproc, superv: tSuperv, tsheet: tTsheet, closeout: tCloseout });
Object.keys(TABV).forEach(k => { const f = TABV[k]; TABV[k] = () => adaptShared(k, f()); });
Object.assign(AREA, { design: 'design', survey: 'survey', opex: 'opex', takeover: 'takeover', ops: 'ops', maint: 'maint', handback: 'takeover', team: 'team', fee: 'fee', cdel: 'cdel', oproc: 'oproc', superv: 'superv', tsheet: 'tsheet', closeout: 'om' });

/* ---------------- sample opportunities ---------------- */
const DOCS_ = (code, list) => list.map((d, i) => ({ id: 'D-0' + (i + 1), code: code + (i + 1), short: d[0], name: d[1], kind: 'pdf', pages: d[2], rev: 'R0', disc: d[3], type: d[4], recv: d[5] || '10 Oct', state: 'Processed', found: Math.round(d[2] / 4), flags: 0 }));
const rq = (rows, sec) => rows.map((r, i) => ({ id: 'REQ-' + String(i + 1).padStart(4, '0'), cat: r[0], text: r[1], mand: true, src: r[2], st: r[3] || 'accepted', sec: r[4], owner: r[5], wbs: '—', ev: r[6] || 'high' }));
const rk = rows => rows.map((r, i) => ({ id: 'R-0' + (i + 1), risk: r[0], cat: r[1], l: r[2], i: r[3], impact: r[4], treat: r[5], owner: r[6], src: r[7] || '', mit: r[8] || '' }));
const cq = rows => rows.map((r, i) => ({ id: 'PBQ-0' + (i + 1), q: r[0], src: r[1], status: r[2], disc: r[3], req: '', a: r[4] || '' }));
const g1r = rows => rows.map(r => ({ id: uid(), c: r[0], w: r[1], ev: r[2], s: r[3], ov: null }));
const ccl = rows => rows.map((r, i) => ({ id: 'c' + (i + 1), ref: r[0], title: r[1], orig: r[2], prop: r[3], bid: r[4], st: r[5] || 'Negotiating', cm: [] }));
function base(meta, extra) { const o = Object.assign(blankOpp(meta), extra); Object.assign(o.meta, meta.metaX); delete o.meta.metaX; o.quality = R_(PROCESS, ['p', 'raw', 'tr', 'norm']); return o; }

function seedDB() {
  const o = base({ id: 'OPP-DB-0412', name: 'Kolhapur 85 MLD STP (Progressive Design-Build)', client: 'Kolhapur Municipal Corporation', loc: 'Kolhapur, Maharashtra', type: 'stp', model: 'pdb', value: 520, submission: '2026-12-12', mld: 85 }, { pos: 7 });
  Object.assign(o.meta, { seed: 'db', fit: 76, owner: 'bid_manager', contact: 'ee.stp@kolhapurcorp.gov.in', desc: 'Progressive design-build of an 85 MLD STP with MBBR and tertiary filtration. Phase 1: paid preconstruction services to 60% design and an open-book GMP. Phase 2: complete design, build and commission, then 12 months of defects liability.', size: R_([['Design flow', '85 MLD', 'MBBR + tertiary'], ['Delivery', 'Progressive DB', '2 phases'], ['Phase 1', '6 months', 'to 60% design + GMP'], ['Treated BOD', '< 10 mg/l', 'NGT']], ['k', 'v', 'n']) });
  o.dates = R_([['RFP published', '10 Oct 2026', 'done'], ['Pre-proposal meeting', '04 Nov 2026', 'next'], ['Proposal due', '12 Dec 2026', ''], ['Phase 1 start', 'Feb 2027', '']], ['k', 'd', 'st']);
  o.brief.summary = 'Two-phase progressive design-build. The owner selects on qualifications, the preconstruction fee and the fee percentage; the GMP is agreed open-book at 60% design. Design liability sits with us; savings below the GMP are shared 50:50.';
  o.docs = DOCS_('k', [['RFP', 'RFP and instructions to proposers', 64, 'Commercial', 'RFP / ITB'], ['OPR', "Owner's project requirements", 96, 'Engineering', 'Specification'], ['PDB agreement', 'Draft progressive design-build agreement', 88, 'Contract', 'Contract / GCC'], ['Survey', 'Topographic and geotechnical survey', 54, 'Survey', 'Report']]); o.cov = { processed: 302, excluded: 0, review: 0, failed: 0, total: 302 };
  o.reqs = rq([['Process', 'Secondary treatment by MBBR with at least three parallel streams.', 'k2:22:§3.2', 'accepted', 'proc', 'process'], ['Performance', 'Treated BOD < 10 mg/l, TSS < 10 mg/l, FC < 100 MPN/100 ml.', 'k2:18:§2.4', 'accepted', 'basis', 'process'], ['Commercial', 'Open-book cost reporting in Phase 1; GMP submitted at 60% design.', 'k1:31:§6.3', 'accepted', 'gmp', 'bid_manager'], ['Programme', 'Owner design reviews at 30, 60 and 90% before IFC.', 'k3:22:§5.4', 'proposed', 'design', 'design', 'medium'], ['Commercial', 'Professional indemnity insurance of ₹25 Cr for design.', 'k3:40:§14.2', 'accepted', 'comp', 'bid_manager'], ['Programme', 'Completion within 24 months of the Phase 2 notice to proceed.', 'k1:12:§2.3', 'accepted', 'prog', 'pd']]);
  o.risks = rk([['Owner design reviews take longer than 21 days', 'Schedule', 3, 3, 4, 'Price', 'design', 'k3:22:§5.4', 'Deemed approval after 21 days in the agreement'], ['GMP agreed before the geotechnical survey is complete', 'Commercial', 3, 4, 9, 'Price', 'estimator', 'k4:6:§1', 'Additional bore holes in Phase 1'], ['Design liability for owner-supplied inflow data', 'Design', 2, 4, 6, 'Clarify', 'process', 'k2:18:§2.4', 'PBQ-03 for 12-month data'], ['Steel and cement escalation between phases', 'Commercial', 4, 3, 7, 'Price', 'commercial', 'k1:33:§6.5', 'Index-linked GMP adjustment']]);
  o.clars = cq([['Does the fee percentage apply to subcontracted design?', 'k1:33:§6.4', 'open', 'Commercial'], ['Is deemed approval acceptable for design submissions not reviewed within 21 days?', 'k3:22:§5.4', 'draft', 'Contract'], ['Please provide the 12-month inflow data used in the OPR.', 'k2:18:§2.4', 'draft', 'Process']]);
  o.elig = R_([['Similar DB or EPC STP ≥ 50 MLD in 7 years', '1 project', 'Satara 60 MLD (2023)', 'pass', 'k1:9:§4.1'], ['Average turnover', '≥ ₹200 Cr', '₹410 Cr', 'pass', 'k1:10:§4.2'], ['In-house design team', '≥ 15 engineers', '22 engineers', 'pass', 'k1:10:§4.3'], ['PI insurance', '₹25 Cr', 'Quote from insurer pending', 'review', 'k3:40:§14.2']], ['c', 'need', 'ours', 'res', 'src']);
  o.terms = R_([['Phase 1 price', 'Lump-sum preconstruction fee', 'k1:31:§6.2'], ['Phase 2 price', 'Cost of work + fee %, capped by the GMP', 'k1:31:§6.3'], ['GMP', 'Open-book, agreed at 60% design', 'k3:30:§9.2'], ['Shared savings', '50:50 below the GMP', 'k3:31:§9.4'], ['Design liability', 'Limited to PI cover', 'k3:40:§14.2'], ['Delay damages', '0.1% per day, cap 10%', 'k3:44:§17'], ['Defects liability', '12 months after taking-over', 'k3:48:§19']], ['k', 'v', 'src']);
  o.scope = R_([['WW-02', 'Process design and MBBR', 'In scope', '', 'k2:22:§3.2'], ['—', 'Preconstruction services', 'In scope', 'Phase 1, paid', 'k1:31:§6.2'], ['WW-06', 'Civil and structures', 'In scope', '', ''], ['WW-07', '11 kV power supply to site', 'Unclear', 'OPR silent on the incoming line', 'k2:60:§7.1'], ['WW-06', 'Land', 'Owner-supplied', '', 'k1:8:§2.1']], ['wbs', 'wp', 'split', 'note', 'src']);
  o.basis = R_([['Average design flow', '85 MLD', 'k2:18:§2.4', 'accepted'], ['Raw BOD', '220 mg/l', 'k2:18:§2.4', 'proposed'], ['Process', 'MBBR, 3 streams', 'k2:22:§3.2', 'accepted'], ['Treated BOD / TSS', '< 10 / < 10 mg/l', 'k2:18:§2.4', 'accepted']], ['f', 'v', 'src', 'st']);
  o.calc = { mld: 90, bod: 220, pf: 2.25, basins: 3 };
  o.est = R_([['Inlet works and pretreatment', 6, 18, 4, 'Rate library'], ['MBBR process', 18, 74, 10, 'Quotes'], ['Tertiary and disinfection', 4, 26, 2, 'Quotes'], ['Sludge handling', 3, 17, 2, 'Quotes'], ['Civil and structural', 32, 88, 12, 'DSR 2026'], ['Electrical and SCADA', 5, 34, 4, 'Quotes'], ['Preliminaries and design', 30, 4, 2, 'Norms']], ['wp', 'lab', 'mat', 'sub', 'src']);
  o.adders = R_([['Bonds and insurance (incl. PI)', 4.2], ['Escalation', 7.2], ['Financing during construction', 5.1]], ['name', 'val']);
  o.pkgs = R_([['MBBR media and aeration', 8, 3, 'Quotes in', '20 Nov'], ['Disc filters', 5, 3, 'RFQ out', '25 Nov'], ['Pumps', 10, 4, 'Quotes in', '20 Nov']], ['pkg', 'lines', 'sup', 'st', 'due']);
  o.vendors = R_([['Veolia Water Tech', 'MBBR media', 4.2, 90, 0], ['Xylem India', 'Pumps', 4.3, 90, 1], ['Filtrex', 'Disc filters', 3.8, 90, 1]], ['name', 'cat', 'rating', 'otd', 'ncr']);
  o.longlead = R_([['MBBR media', 18, 10, 4], ['Blowers', 24, 12, 5]], ['item', 'lead', 'need', 'order']);
  o.g1.rows = g1r([['Strategic fit', 15, 'Progressive DB: first in Maharashtra', 5], ['Eligibility', 10, '3 of 4 pass; PI cover pending', 4], ['Design capability', 15, '22 in-house engineers', 4], ['Capacity', 10, 'Phase 1 team available', 4], ['Margin potential', 15, 'Fee 8% on cost of work', 3], ['Contract risk', 10, 'Design liability limited to PI', 3], ['Long-lead feasibility', 10, 'Media lead 18 weeks', 4], ['Competition', 10, '3 shortlisted', 3], ['Client relationship', 5, 'Delivered Satara for a sister body', 3]]); o.g1.dec = 'Bid';
  o.dpk = R_([['Process', 'P&IDs and process layouts', '90%', 80, 'Under owner review', '15 Dec'], ['Civil', 'MBBR tanks and buildings', '60%', 70, 'Comments', '10 Jan'], ['Electrical', 'SLD and cable schedules', '60%', 55, 'Approved', '12 Jan'], ['I&C', 'Control philosophy and I/O list', '30%', 100, 'Approved', '20 Jan'], ['Mechanical', 'Equipment layouts and data sheets', '60%', 60, 'Under owner review', '15 Jan'], ['Architecture', 'Admin and lab building', '90%', 90, 'Approved', '05 Jan']], ['disc', 'pkg', 'stage', 'pct', 'review', 'due']);
  o.dchg = [{ id: 'DC-01', desc: 'Add odour control at the inlet works', cost: 2.4, days: 0, st: 'Approved' }, { id: 'DC-02', desc: 'Relocate the outfall 120 m downstream', cost: 1.1, days: 15, st: 'Under owner review' }];
  o.gmp = { prefee: 6.5, fee: 8, cont: 4, share: 50, st: 'Draft' };
  o.contract = { ver: 1, sel: 'c1', versions: [{ v: 1, by: 'Kolhapur MC', ts: '10 Oct 2026', note: 'Draft PDB agreement issued with RFP' }], clauses: ccl([['§5.4', 'Design review periods', 'The Owner shall review design submissions within a reasonable time.', 'The Owner shall review design submissions within 21 days; submissions not commented on within 21 days are deemed approved.', 'Deemed approval after 21 days'], ['§9.2', 'GMP timing', 'The GMP shall be agreed at 90% design.', 'The GMP shall be agreed at 60% design, open-book, with a 4% contingency held by the Contractor.', 'GMP at 60%'], ['§14.2', 'Design liability', 'The Contractor shall be liable for all design defects without limit.', 'Design liability is limited to the professional indemnity cover of ₹25 Cr.', 'Limited to PI cover']]) };
  o.wps = R_([['MBBR tanks structure', 35, 260, 240, 'm³/day', ''], ['Inlet works', 60, 0, 0, '', '']], ['wp', 'pct', 'plan', 'act', 'unit', 'note']);
  o.sched = R_([['Phase 2 notice to proceed', 7, 7], ['IFC complete', 11, 12], ['Taking-over', 31, 32]], ['ms', 'base', 'fc']);
  o.ptest = [{ id: uid(), par: 'Treated BOD', unit: 'mg/l', dir: 'max', lim: 10, meas: null }, { id: uid(), par: 'Treated TSS', unit: 'mg/l', dir: 'max', lim: 10, meas: null }, { id: uid(), par: 'Specific energy', unit: 'kWh/m³', dir: 'max', lim: 0.2, meas: null }];
  o.turn = R_([['Design records and as-builts', 20], ['O&M manuals', 10], ['Training', 0]], ['area', 'pct']);
  return o;
}
function seedOM() {
  const o = base({ id: 'OPP-OM-0207', name: 'Atladara 150 MLD STP O&M (7 years)', client: 'Vadodara Municipal Corporation', loc: 'Vadodara, Gujarat', type: 'stp', model: 'omk', value: 96, submission: '2026-12-02', mld: 150 }, { pos: 6 });
  Object.assign(o.meta, { seed: 'om', fit: 81, owner: 'bid_manager', contact: 'ee.drainage@vmc.gov.in', desc: 'Operation and maintenance of the 150 MLD Atladara SBR plant for seven years, with a fixed monthly fee, KPI deductions capped at 10%, and handback at condition grade 3 or better.', size: R_([['Capacity', '150 MLD', 'SBR'], ['Term', '7 years', '+ 3 option'], ['Minimum staff', '44', 'three shifts'], ['Deduction cap', '10%', 'of monthly fee']], ['k', 'v', 'n']) });
  o.dates = R_([['RFP published', '06 Oct 2026', 'done'], ['Site visit', '22 Oct 2026', 'done'], ['Bid due', '02 Dec 2026', 'next'], ['Takeover', 'Apr 2027', '']], ['k', 'd', 'st']);
  o.brief.summary = 'Seven-year O&M of an existing 150 MLD SBR plant. Lowest evaluated annual fee wins among technically qualified bidders. Deductions apply for effluent breaches, downtime and energy above 0.18 kWh/m³. Major equipment replacement above ₹5 lakh per item is the owner\'s.';
  o.docs = DOCS_('m', [['RFP', 'RFP and instructions to bidders', 72, 'Commercial', 'RFP / ITB'], ['O&M contract', 'Draft O&M contract and KPI schedule', 58, 'Contract', 'Contract / GCC'], ['Asset list', 'Plant as-builts and asset list', 140, 'Engineering', 'Data'], ['Plant data', '12-month plant performance data', 24, 'Process', 'Data']]); o.cov = { processed: 294, excluded: 0, review: 0, failed: 0, total: 294 };
  o.reqs = rq([['O&M', 'Deploy at least 44 staff across three shifts, including 3 lab chemists.', 'm2:31:Sch. B', 'accepted', 'om', 'opsmgr'], ['Performance', 'Treated BOD < 10, TSS < 10 mg/l on every day.', 'm2:40:Sch. D', 'accepted', 'ops', 'process'], ['SCADA', 'Keep the online analysers reporting to the GPCB server at all times.', 'm2:42:Sch. D', 'accepted', 'ops', 'lab'], ['O&M', 'Respond to breakdowns within 4 hours.', 'm2:44:Sch. D', 'proposed', 'maint', 'maint', 'medium'], ['Energy', 'Specific energy not above 0.18 kWh/m³ monthly.', 'm2:45:Sch. D', 'accepted', 'energy', 'process'], ['O&M', 'Hand back assets at condition grade 3 or better.', 'm2:52:§22', 'accepted', 'takeover', 'opsmgr']]);
  o.risks = rk([['Asset condition worse than the asset list states (decanters, diffusers)', 'Design basis', 4, 3, 4.5, 'Price', 'maint', 'm3:12:§2', 'Owner rectification before takeover'], ['Power tariff increase', 'Commercial', 3, 4, 3.2, 'Price', 'commercial', 'm2:28:§9', 'Seek tariff pass-through'], ['Raw BOD above design on weekends (industrial discharges)', 'Performance', 3, 4, 2.0, 'Clarify', 'process', 'm4:3:Summary', 'PBQ-02 and trade-effluent control'], ['Operator turnover in year 1', 'Resource', 3, 2, 0.6, 'Accept', 'opsmgr', '', 'Redeploy 12 staff from Surat']]);
  o.clars = cq([['Is major equipment replacement above ₹5 lakh per item the owner\'s responsibility?', 'm2:33:§12', 'open', 'Contract'], ['Raw BOD exceeds 300 mg/l on weekends in the plant data. Will deductions apply on those days?', 'm4:3:Summary', 'draft', 'Process'], ['Is power cost a pass-through or included in the fee?', 'm2:28:§9', 'draft', 'Commercial']]);
  o.elig = R_([['O&M of STP ≥ 100 MLD for 3 years', '1 contract', 'Surat 100 MLD since 2020', 'pass', 'm1:9:§4.1'], ['Average turnover', '≥ ₹30 Cr', '₹86 Cr', 'pass', 'm1:9:§4.2'], ['GPCB-registered operator', 'Valid', 'Valid to 2028', 'pass', 'm1:10:§4.3'], ['ISO 9001 / 45001', 'Both', 'ISO 45001 renewal due', 'review', 'm1:10:§4.4']], ['c', 'need', 'ours', 'res', 'src']);
  o.terms = R_([['Price basis', 'Fixed monthly fee, escalated yearly', 'm2:26:§8'], ['Price variation', '5% a year or WPI, whichever is lower', 'm2:27:§8.3'], ['Deductions', 'Per KPI schedule, capped at 10% of the monthly fee', 'm2:40:Sch. D'], ['Power cost', 'Included in the fee (to clarify)', 'm2:28:§9'], ['Major replacement', 'Owner above ₹5 lakh per item (to clarify)', 'm2:33:§12'], ['Performance security', '5% of annual fee', 'm2:20:§6'], ['Payment', '30 days from invoice', 'm2:29:§10'], ['Handback', 'Condition grade 3 or better', 'm2:52:§22']], ['k', 'v', 'src']);
  o.scope = R_([['WW-09', 'Plant operation, three shifts', 'In scope', '', 'm2:12:§3'], ['WW-09', 'Routine maintenance and spares', 'In scope', '', 'm2:12:§3'], ['WW-09', 'Major equipment replacement', 'Unclear', 'Threshold ₹5 lakh per item', 'm2:33:§12'], ['WW-09', 'Power supply cost', 'Unclear', '', 'm2:28:§9'], ['WW-03', 'Sludge disposal (14 km)', 'In scope', '', 'm2:14:§3.6']], ['wbs', 'wp', 'split', 'note', 'src']);
  o.cond = R_([['Inlet screens (4)', 'Inlet works', 3, 6, 0.35, 'Operator'], ['SBR decanters (8)', 'SBR basins', 2, 3, 1.2, 'Owner'], ['Air blowers (6)', 'Blower house', 3, 8, 0.6, 'Shared'], ['Fine-bubble diffusers', 'SBR basins', 2, 1, 0.9, 'Owner'], ['Centrifuges (3)', 'Sludge house', 4, 10, 0.1, 'Operator'], ['Chlorination system', 'Contact tank', 3, 7, 0.2, 'Operator'], ['SCADA and analysers', 'Control room', 2, 2, 0.8, 'Owner'], ['HT/LT panels', 'Substation', 4, 12, 0.15, 'Operator']], ['asset', 'area', 'cond', 'life', 'rect', 'payer']);
  o.quality = R_([['BOD (mg/l)', 245, '8.2', 'GPCB 10'], ['TSS (mg/l)', 310, '7.6', 'GPCB 10'], ['COD (mg/l)', 520, '42', 'GPCB 50'], ['NH₄-N (mg/l)', 38, '4.1', 'GPCB 5']], ['p', 'raw', 'tr', 'norm']);
  o.om = R_([['Power (0.17 kWh/m³)', 7.8], ['Chemicals (polymer, chlorine)', 1.9], ['Spares and repairs', 1.1], ['Sludge disposal (14 km)', 0.9], ['Lab and consumables', 0.3], ['Insurance', 0.2]], ['item', 'cost']);
  o.crew = R_([['Plant manager', 1, 24, 1], ['Shift engineers', 4, 12, 2], ['Operators', 16, 4.8, 10], ['Electricians', 6, 5.4, 4], ['Fitters', 6, 5.4, 4], ['Lab chemists', 3, 6, 2], ['Helpers and security', 8, 3, 8]], ['role', 'n', 'rate', 'mob']);
  o.kpis = R_([['Treated BOD and TSS within consent', 'Every day', 0.5, 4], ['Plant availability ≥ 98%', 'Monthly', 1, 1], ['Specific energy ≤ 0.18 kWh/m³', 'Monthly', 0.5, 2], ['Monthly report by the 7th', 'Monthly', 0.2, 1], ['Breakdown response ≤ 4 hours', 'Per event', 0.1, 6]], ['kpi', 'target', 'ded', 'exp']);
  o.omx = { years: 7, margin: 12, overhead: 6 }; o.omEsc = 5;
  const days = Array.from({ length: 20 }, (_, i) => '2027-04-' + String(i + 1).padStart(2, '0'));
  o.logs = days.map((d, i) => ({ id: uid(), date: d, flow: 138 + (i * 7) % 15, bodIn: 210 + (i * 13) % 55, bodOut: [7.2, 8.1, 6.9, 7.5, 8.8, 11.2, 7.9, 7.1, 6.8, 7.7, 8.2, 9.1, 7.4, 6.9, 10.6, 8.0, 7.3, 7.0, 7.8, 8.4][i], tssOut: 5 + (i * 3) % 5, kwh: +(24 + (i * 5) % 4 + 0.5).toFixed(1) }));
  o.wo = [['Blower 3', 'Planned', 'Replace inlet filters', '2027-04-10', 'Done'], ['Decanter 5', 'Breakdown', 'Actuator failure', '2027-04-12', 'In progress'], ['Centrifuge 2', 'Planned', 'Bearing inspection', '2027-04-15', 'Open'], ['Screen 1', 'Corrective', 'Rake chain tension', '2027-04-08', 'Done'], ['Chlorinator', 'Statutory', 'Factory licence inspection', '2027-05-20', 'Open'], ['Analyser panel', 'Planned', 'Calibrate NH₄-N probe', '2027-04-05', 'Open']].map((w, i) => ({ id: 'WO-' + String(i + 1).padStart(4, '0'), asset: w[0], type: w[1], desc: w[2], due: w[3], st: w[4] }));
  o.renew = R_([['Diffuser membranes', 2, 1.4, 'Operator'], ['Decanter actuators', 1, 0.6, 'Owner'], ['Blower VFDs', 5, 0.9, 'Operator'], ['Analysers', 3, 0.5, 'Owner'], ['Centrifuge overhaul', 4, 0.4, 'Operator']], ['asset', 'year', 'cost', 'payer']);
  o.bills = [{ id: 'INV-01', period: 'Apr 2027', claimed: 1.62, cert: 1.62, paid: 0, st: 'Certified by IE' }];
  o.g1.rows = g1r([['Strategic fit', 15, 'Home-state municipal O&M', 4], ['Eligibility', 10, '3 of 4 pass', 4], ['Operating experience', 15, '3 similar SBR plants operated', 5], ['Staffing availability', 10, '12 staff from Surat', 3], ['Margin potential', 15, 'Peer fees ₹0.55–0.70 Cr/MLD/yr', 3], ['Contract risk', 10, 'Deductions capped at 10%', 3], ['Asset condition', 10, 'Decanters and diffusers poor', 2], ['Competition', 10, 'Incumbent bidding', 2], ['Client relationship', 5, 'Existing VMC client', 4]]); o.g1.dec = 'Bid';
  o.contract = { ver: 1, sel: 'c1', versions: [{ v: 1, by: 'Vadodara MC', ts: '06 Oct 2026', note: 'Draft O&M contract issued with RFP' }], clauses: ccl([['Sch. D', 'Deduction cap', 'Deductions shall not exceed 15% of the monthly fee.', 'Deductions shall not exceed 10% of the monthly fee.', 'Cap 10%'], ['§12', 'Major equipment replacement', 'The Operator shall replace any equipment that fails.', 'The Owner shall replace any equipment item costing more than ₹5 lakh.', 'Owner above ₹5 lakh'], ['§9', 'Power cost', 'Power cost is included in the fee.', 'Power cost is passed through at actual tariff against the 0.18 kWh/m³ cap.', 'Pass-through within cap']]) };
  return o;
}
function seedEPCM() {
  const o = base({ id: 'OPP-PMC-0118', name: 'PMC for Nashik Sewerage Phase III (AMRUT 2.0)', client: 'Nashik Municipal Corporation', loc: 'Nashik, Maharashtra', type: 'pump', model: 'pmc', value: 22, submission: '2026-11-28', mld: null }, { pos: 5 });
  Object.assign(o.meta, { seed: 'epcm', fit: 79, owner: 'bid_manager', works: 780, contact: 'pmc.cell@nmc.gov.in', desc: 'Project management consultancy for three sewerage packages (trunk sewers, pumping stations, a 60 MLD STP): DPR review, design vetting, bid process management for the owner, and construction supervision over 48 months.', size: R_([['Works value', '₹780 Cr', '3 packages'], ['Duration', '48 months', ''], ['Key experts', '9', 'scored'], ['Evaluation', 'QCBS 80:20', 'tech minimum 70']], ['k', 'v', 'n']) });
  o.dates = R_([['EOI shortlist', '02 Oct 2026', 'done'], ['RFP issued', '14 Oct 2026', 'done'], ['Pre-proposal meeting', '30 Oct 2026', 'next'], ['Proposal due', '28 Nov 2026', '']], ['k', 'd', 'st']);
  o.brief.summary = 'Shortlisted from the EOI. QCBS 80:20: technical score from firm experience, methodology and nine key-expert CVs (minimum 70), financial score from the total fee. Time-based contract paid monthly on expert attendance.';
  o.docs = DOCS_('c', [['RFP & TOR', 'RFP and terms of reference', 88, 'Commercial', 'RFP / ITB'], ['Data sheet', 'Data sheet and evaluation criteria', 14, 'Commercial', 'RFP / ITB'], ['Contract', 'Draft consultancy contract', 46, 'Contract', 'Contract / GCC'], ['DPR', 'DPR summary, Phase III', 120, 'Engineering', 'Report']]); o.cov = { processed: 268, excluded: 0, review: 0, failed: 0, total: 268 };
  o.reqs = rq([['Format', 'Team Leader with at least 20 years and 3 sewerage PMC assignments.', 'c1:41:TOR §7.1', 'accepted', 'team', 'bid_manager'], ['Format', 'One resident engineer per package, on site at least 80% of the time.', 'c1:42:TOR §7.2', 'accepted', 'team', 'teamlead'], ['Programme', 'Monthly progress report to the client by the 10th.', 'c1:36:TOR §5.3', 'accepted', 'prog', 'teamlead'], ['Testing', 'Third-party QA testing of pipes and concrete on each package.', 'c1:38:TOR §6.2', 'proposed', 'method', 'teamlead', 'medium'], ['Process', 'Vet contractor designs within 15 days of submission.', 'c1:34:TOR §4.4', 'accepted', 'method', 'process'], ['Commercial', 'Key experts may be replaced only with equal or better CVs.', 'c3:18:§4.5', 'accepted', 'comp', 'bid_manager']]);
  o.risks = rk([['Resident engineer for Package 2 not yet identified', 'Resource', 4, 3, 0.8, 'Price', 'teamlead', 'c1:42:TOR §7.2', 'Shortlist two candidates before submission'], ['Works delays extend our services without additional fee', 'Contract', 3, 4, 2.4, 'Clarify', 'commercial', 'c3:22:§6.2', 'PBQ-01; pro-rata extension at the same rates'], ['Liability equal to the fee', 'Contract', 2, 3, 1, 'Accept', 'commercial', 'c3:30:§8.1', ''], ['Payment delays from AMRUT funding releases', 'Commercial', 3, 3, 1.2, 'Price', 'commercial', 'c3:26:§7', '']]);
  o.clars = cq([['If the works are delayed beyond 48 months, will services be extended pro-rata at the same rates?', 'c3:22:§6.2', 'open', 'Contract'], ['Is third-party QA testing a reimbursable or part of remuneration?', 'c1:38:TOR §6.2', 'draft', 'Commercial'], ['Can a resident engineer cover two packages during the first six months?', 'c1:42:TOR §7.2', 'draft', 'Contract']]);
  o.elig = R_([['Similar PMC assignments (7 years)', '3 of ≥ ₹300 Cr works', '5 assignments', 'pass', 'c2:4:§2.1'], ['Average turnover', '≥ ₹15 Cr', '₹64 Cr', 'pass', 'c2:4:§2.2'], ['ISO 9001', 'Valid', 'Valid to 2027', 'pass', 'c2:5:§2.4'], ['CV certification by experts', 'All 9', '7 signed', 'review', 'c1:44:§7.5']], ['c', 'need', 'ours', 'res', 'src']);
  o.terms = R_([['Contract type', 'Time-based', 'c3:6:§1.2'], ['Payment', 'Monthly on expert attendance; 10% held until final report', 'c3:26:§7'], ['Liability cap', 'Equal to the contract price', 'c3:30:§8.1'], ['PI insurance', 'Equal to the contract price', 'c3:31:§8.3'], ['Key expert replacement', '10% reduction in remuneration for replacements', 'c3:18:§4.5'], ['Extension of services', 'Not stated (to clarify)', 'c3:22:§6.2']], ['k', 'v', 'src']);
  o.scope = R_([['—', 'DPR review and updating', 'In scope', '', 'c1:30:TOR §3'], ['—', 'Design vetting', 'In scope', '15-day turnaround', 'c1:34:TOR §4.4'], ['—', 'Bid process management for 3 packages', 'In scope', '', 'c1:35:TOR §4.6'], ['—', 'Construction supervision', 'In scope', '48 months', 'c1:36:TOR §5'], ['—', 'Land acquisition', 'Excluded', 'Client', 'c1:30:TOR §3.4']], ['wbs', 'wp', 'split', 'note', 'src']);
  o.team = R_([['Team Leader', 'Dr. Anil Bhat', 20, 26, 6, 'Final', true, 88], ['Deputy Team Leader / Sewerage', 'Rohini Kale', 15, 18, 4, 'Final', true, 84], ['Structural Expert', 'Vivek Shenoy', 12, 14, 3, 'Draft', true, 78], ['Pumping Station Expert', 'Farah Khan', 12, 11, 3, 'Final', true, 70], ['Resident Engineer, Package 1', 'Mohammed Ansari', 10, 13, 3, 'Final', true, 80], ['Resident Engineer, Package 2', '', 10, 0, 0, 'Missing', true, 0], ['Resident Engineer, Package 3', 'Pranav Gokhale', 10, 10, 2, 'Draft', true, 72], ['QA/QC Expert', 'Lakshmi Iyer', 10, 12, 4, 'Final', true, 82], ['Contracts Specialist', 'Rohit Bansal', 12, 15, 5, 'Final', true, 85]], ['pos', 'name', 'req', 'yrs', 'similar', 'cv', 'key', 'score']);
  o.fee = R_([['Team Leader', 48, 4.5], ['Deputy Team Leader / Sewerage', 48, 3.6], ['Structural Expert', 18, 3.0], ['Pumping Station Expert', 18, 3.0], ['Resident Engineer, Package 1', 42, 2.4], ['Resident Engineer, Package 2', 42, 2.4], ['Resident Engineer, Package 3', 42, 2.4], ['QA/QC Expert', 36, 2.6], ['Contracts Specialist', 24, 2.8], ['Support staff (12)', 480, 0.9]], ['pos', 'mm', 'rate']);
  o.reimb = R_([['Site offices (3 packages)', 180], ['Vehicles', 240], ['Third-party QA testing', 120], ['Travel', 60], ['Reports and printing', 15]], ['item', 'amt']);
  o.qcbs = { tw: 80, cw: 20, comps: R_([['Tata Consulting Engineers', 86, 22.4], ['WAPCOS', 82, 18.9], ['Mott MacDonald', 89, 25.6]], ['name', 'tech', 'fee']) };
  o.cdeliv = [['Inception report', 'Month 1', 'Accepted', ''], ['DPR review report', 'Month 3', 'Client comments', 'Update flow projections to 2056'], ['Bid documents, Package 1', 'Month 4', 'Submitted', ''], ['Design vetting log, Package 1', 'Monthly', 'Draft', ''], ['Monthly progress report', 'Monthly', 'Not started', '']].map((d, i) => ({ id: 'DL-0' + (i + 1), title: d[0], due: d[1], st: d[2], comments: d[3] }));
  o.opkg = 'Package 2: trunk sewers 42 km';
  o.obids = R_([['Deccan Hydro Projects', 'Responsive', 78, 312.4], ['Vishwa Aqua Infra', 'Responsive', 82, 318.9], ['Ganga Enviro JV', 'Responsive', 68, 296.0], ['Konkan Pipelines', 'Non-responsive', 0, 301.5]], ['bidder', 'resp', 'tech', 'price']);
  o.cbills = [{ id: 'CB-01', contractor: 'Deccan Hydro Projects', period: 'RA-4 Aug 2027', claimed: 18.6, cert: 17.9, st: 'Certified' }, { id: 'CB-02', contractor: 'Deccan Hydro Projects', period: 'RA-5 Sep 2027', claimed: 21.2, cert: 0, st: 'Under check' }];
  o.insp = R_([['2027-09-12', 'Pipe hydro test ch 3+200–3+800', 'Passed'], ['2027-09-18', 'Manhole concrete cubes, Package 2', 'Passed with comments'], ['2027-09-25', 'Bedding and haunching ch 4+100', 'Failed']], ['date', 'act', 'res']);
  o.cvar = [{ id: 'VA-01', desc: 'Rock excavation beyond BOQ, Package 2', claimed: 4.2, assessed: 3.1, st: 'Recommended' }, { id: 'VA-02', desc: 'Additional manholes at road crossings', claimed: 0.9, assessed: 0, st: 'Under assessment' }];
  o.mmuse = R_([['Team Leader', 48, 9], ['Deputy Team Leader / Sewerage', 48, 9], ['Resident Engineer, Package 1', 42, 8], ['Resident Engineer, Package 2', 42, 6], ['QA/QC Expert', 36, 8]], ['pos', 'budget', 'used']);
  o.inv = [{ id: 'INV-01', milestone: 'Inception report', amt: 1.9, st: 'Paid' }, { id: 'INV-02', milestone: 'Months 2–3 attendance', amt: 2.4, st: 'Approved' }, { id: 'INV-03', milestone: 'Months 4–5 attendance', amt: 2.5, st: 'Submitted' }];
  o.g1.rows = g1r([['Strategic fit', 15, 'AMRUT 2.0 sewerage in Maharashtra', 4], ['Eligibility', 10, '3 of 4 pass', 4], ['Similar assignments', 15, '5 sewerage PMC assignments', 4], ['Key expert availability', 15, 'RE Package 2 not identified', 2], ['Fee competitiveness', 15, 'WAPCOS usually lowest', 2], ['Contract risk', 10, 'Extension without fee if works delayed', 2], ['Workload', 10, 'Two assignments close in Q1', 4], ['Client relationship', 10, 'DPR consultant for Phase II', 5]]); o.g1.dec = 'Bid';
  o.contract = { ver: 1, sel: 'c1', versions: [{ v: 1, by: 'Nashik MC', ts: '14 Oct 2026', note: 'Draft consultancy contract issued with RFP' }], clauses: ccl([['§6.2', 'Extension of services', 'No additional payment shall be made for any extension of the works period.', 'Services extended because of works delays are paid pro-rata at the contract rates.', 'Pro-rata extension'], ['§8.1', 'Liability', 'The Consultant shall be liable for all losses arising from the services.', "The Consultant's total liability is limited to the contract price.", 'Cap = contract price'], ['§4.5', 'Key expert replacement', 'Replacement of a key expert reduces remuneration by 20%.', 'Replacement of a key expert reduces remuneration by 10%, except for death, illness or resignation.', '10% with exceptions']]) };
  return o;
}

/* ---------------- sample records for every screen of each role's sample project ---------------- */
const MAP = (rows, keys) => rows.map(r => { const x = { id: uid() }; keys.forEach((k, i) => { if (k) x[k] = r[i]; }); return x; });
const MAPID = (rows, keys) => rows.map(r => { const x = {}; keys.forEach((k, i) => x[k] = r[i]); return x; });
const ML = (thread, dir, from, to, subject, body, ts, attach) => ({ id: uid(), thread, dir, from, to, subject, body, ts, attach: attach || [] });
const LEVS = (pkg, sups, adders) => ({ pkg, sups: sups.map((s, i) => ({ id: 's' + i, name: s[0], quoted: s[1], cov: s[2], lead: s[3], terms: s[4], comp: s[5] })), adders: adders.map(a => ({ id: uid(), name: a[0], vals: { s0: a[1][0], s1: a[1][1], s2: a[1][2] } })), award: null });
function enrichCommon(o, d) {
  o.stake = MAP(d.stake, ['name', 'org', 'role', 'stance']);
  o.comp = MAP(d.comp, ['name', 'record', 'price', 'note']);
  o.brief.facts = MAP(d.facts, ['k', 'v', 'src']);
  o.rules = MAPID(d.rules.map((r, i) => ['R-0' + (i + 1), ...r]), ['id', 'rule', 'check', 'state', 'src']);
  o.addenda = MAP(d.addenda, ['no', 'date', 'doc', 'title', 'impact']);
  o.lev = LEVS(d.lev[0], d.lev[1], d.lev[2]);
  o.nego = { bids: d.bids.map((b, i) => ({ id: uid(), name: b[0], bpc: b[1], us: i === 0 })), pos: MAP(d.pos, ['topic', 'tender', 'ask', 'walk', 'agreed']), result: d.result[0], reasons: d.result[1] };
  o.bafo = MAP(d.bafo, ['round', 'price']);
  o.drift = MAP(d.drift, ['clause', 'bid', 'con', 'sev']);
  o.b2b = MAP(d.b2b, ['clause', 'main', 'sub', 'gap']);
  o.obl = d.obl.map(b => ({ id: b[0], ob: b[1], party: b[2], due: b[3], bar: b[4], done: b[3] === 'Done' }));
  o.baseline.forEach((b, i) => { b.ok = i < 4; });
  o.mail = d.mail.map(m => ML(...m));
  o.contract.ver = 3; o.contract.versions.push({ v: 2, by: d.redlineBy + ' (us)', ts: d.redlineTs[0], note: 'Our redline: ' + o.contract.clauses.length + ' clauses' }, { v: 3, by: o.meta.client, ts: d.redlineTs[1], note: 'Client response: 1 agreed, 2 open' });
  o.contract.clauses[0].st = 'Agreed'; o.contract.clauses[1].cm = [[o.meta.client, d.redlineTs[1], d.clauseComment]];
  if (d.itp) o.itp = MAPID(d.itp, ['id', 'act', 'pt', 'st']);
  o.ncr = MAPID(d.ncr, ['id', 'desc', 'party', 'st']);
  if (d.ptw) o.permits = MAPID(d.ptw, ['id', 'type', 'area', 'st', 'conflict']);
  if (d.weld) o.weld = MAPID(d.weld, ['id', 'wps', 'ndt', 'res']);
  o.incidents = MAP(d.inc, ['date', 'type', 'desc', 'st']); o.hse = { mh: d.mh };
  if (d.changes) o.changes = MAPID(d.changes, ['id', 'desc', 'val', 'st']);
  if (d.bgs) o.bgs = MAP(d.bgs, ['type', 'val', 'bank', 'exp', 'st']);
  if (d.claims) o.claims = MAPID(d.claims, ['id', 'event', 'notice', 'days', 'val', 'st']);
  return o;
}
function enrichDB(o) {
  const C = 'Kolhapur MC', us = 'Rohit Bansal';
  enrichCommon(o, {
    stake: [['Executive Engineer (Drainage)', C, 'Owner representative and design reviewer', 'Neutral'], ["Owner's Advisor", 'Tata Consulting Engineers', 'Reviews 30/60/90% design and GMP', 'Detail-focused'], ['Regional Officer', 'MPCB', 'Consent to establish and operate', 'Regulator'], ['AMRUT 2.0 cell', 'Urban Development Dept', 'Funding agency', 'Supportive']],
    comp: [['Vishwa Aqua Infra', 'Lowest fee % on 2 PDB bids', 'Fee 6.5% (Nagpur, 2026)', 'Weak in-house design'], ['Ganga Enviro JV', 'Shortlisted', 'Fee 9% (Surat, 2025)', 'Foreign MBBR licensor'], ['Deccan Hydro Projects', 'Shortlisted', 'Fee 7.5% (Solapur, 2025)', 'Strong civil, outsourced design']],
    facts: [['Selection', 'Qualifications 60, preconstruction fee 20, fee % 20', 'k1:18:§5.1'], ['Phase 1 duration', '6 months to 60% design and GMP', 'k1:31:§6.2'], ['Off-ramp', 'Owner may tender Phase 2 if GMP not agreed', 'k3:30:§9.6'], ['Treated effluent', 'BOD < 10, TSS < 10, FC < 100 MPN', 'k2:18:§2.4'], ['Completion', '24 months from Phase 2 NTP', 'k1:12:§2.3']],
    rules: [['Agreement governs over the OPR', 'Design liability clause checked against OPR §2.4 targets', 'pass', 'k3:4:§1.3'], ['Raw BOD design value 220 mg/l', 'Survey composite samples average 248 mg/l', 'open', 'k2:18:§2.4'], ['GMP at 60% design, not 90%', 'Redline submitted; owner draft says 90%', 'open', 'k3:30:§9.2'], ['No fee on owner-directed allowances', 'Allowances excluded from fee base in GMP sheet', 'pass', 'k1:33:§6.4']],
    addenda: [['Add-01', '28 Oct 2026', 'D-01', 'Preconstruction fee cap raised to ₹8 Cr', 'Phase 1 fee re-priced at ₹6.5 Cr'], ['Add-02', '10 Nov 2026', 'D-02', 'Odour control added at inlet works', 'Design change DC-01 raised\nGMP cost of work +₹2.4 Cr']],
    lev: ['MBBR media and aeration · 3 streams', [['Veolia Water Tech', 24.6, 'Covered', 18, 'FOR site', 'Compliant'], ['Headworks India', 21.9, 'Excludes sieves', 16, 'Ex-works', '1 deviation'], ['Ovivo', 26.8, 'Covered', 22, 'FOR site', 'Compliant']], [['Missing media sieves (filler)', [0, 1.3, 0]], ['Freight to site', [0, 0.4, 0]], ['Aeration energy at duty point', [0, 0.9, -0.5]], ['Performance bond', [0.2, 0.2, 0.2]]]],
    bids: [['Sahyadri Design-Build (us)', 477.7], ['Vishwa Aqua Infra', 482.3], ['Deccan Hydro Projects', 495.0]],
    pos: [['GMP timing', '90% design', '60% design', '75% design', '60% design'], ['Design review period', 'Reasonable time', '21 days, deemed approval', '28 days', '21 days, deemed approval'], ['Shared savings', '30:70', '50:50', '40:60', '50:50']],
    result: ['Won', 'Highest qualification score (in-house design team)\nLowest GMP at 60% design'],
    bafo: [['Initial GMP (60% design)', 489.2], ['Value engineering round', 481.0], ['Agreed GMP', 477.7]],
    drift: [['§5.4 Design review', '21 days, deemed approval', '21 days, deemed approval', 'None'], ['§9.2 GMP timing', '60% design', '60% design', 'None'], ['§14.2 Design liability', 'Limited to PI cover', 'Unlimited for latent defects', 'High']],
    b2b: [['Design liability', 'Limited to ₹25 Cr PI', 'Structural sub-consultant: PI ₹5 Cr', 'Gap: ₹20 Cr uncovered'], ['Delay damages', '0.1%/day, cap 10%', 'MBBR supplier: 0.5%/week, cap 5%', 'Gap: 5% of cap'], ['Defects liability', '12 months after taking-over', 'Blower OEM: 18 months from dispatch', 'May expire before DLP ends']],
    obl: [['OB-004', 'Submit 30% design package', 'Design-Builder', 'Done', false], ['OB-009', 'Owner review of 60% package', 'Owner', 'Within 21 days', true], ['OB-012', 'Open-book cost report', 'Design-Builder', 'Monthly, by the 10th', true], ['OB-017', 'Submit GMP with backup', 'Design-Builder', 'Month 6', false]],
    mail: [['contract', 'in', 'Kolhapur MC Legal', us, 'Draft PDB agreement (v1)', 'Please find the draft progressive design-build agreement. Comments within 7 days.', '12 Jan 2027', ['PDB Agreement v1.pdf']], ['contract', 'out', us, 'Kolhapur MC Legal', 'PDB agreement: our redline (v2)', 'Our redline covers three clauses: review periods, GMP timing and design liability.', '18 Jan 2027', ['PDB Agreement v2 redline.pdf']], ['contract', 'in', 'Kolhapur MC Legal', us, 'RE: PDB agreement (v3)', '§5.4 accepted. §9.2: GMP at 60% acceptable subject to owner advisor review. §14.2: unlimited liability for latent defects remains.', '27 Jan 2027', ['PDB Agreement v3.pdf']], ['notice', 'out', 'Ravi Kumar', "Owner's Advisor", 'Notice DB-KMC-011: 60% review overdue', 'The 60% civil package was submitted on 02 Jun. Under §5.4 it is deemed approved after 21 days; we will proceed on that basis.', '25 Jun 2027']],
    redlineBy: us, redlineTs: ['18 Jan 2027', '27 Jan 2027'], clauseComment: 'Acceptable subject to owner advisor review.',
    itp: [['ITP-C-02', 'MBBR tank water-tightness test', 'Hold', 'Open'], ['ITP-M-05', 'Blower performance at site', 'Witness', 'Planned'], ['ITP-E-03', '11 kV panel pre-commissioning', 'Hold', 'Planned']],
    ncr: [['NCR-006', 'Cover to rebar below 40 mm in MBBR tank 2 base', 'Civil subcontractor', 'Closed'], ['NCR-011', 'Media retention sieve gap above spec', 'MBBR supplier', 'Open']],
    ptw: [['PTW-0212', 'Hot work', 'Blower house', 'Active', ''], ['PTW-0218', 'Excavation > 3 m', 'Outfall', 'Requested', 'Dewatering pumps not yet installed']],
    weld: [['SS-J-0102', 'WPS-03 (GTAW)', 'DP 100%', 'Accepted'], ['SS-J-0109', 'WPS-03 (GTAW)', 'DP 100%', 'Rejected'], ['MS-J-0204', 'WPS-07 (SMAW)', 'RT 10%', 'Accepted']],
    inc: [['2027-09-14', 'Near miss', 'Unsecured formwork panel at MBBR tank 3', 'Closed'], ['2027-08-30', 'First aid', 'Eye irritation during cement handling', 'Closed']], mh: 620000,
    changes: [['CoS-01', 'Odour control at inlet works (DC-01)', 2.4, 'Approved'], ['CoS-02', 'Outfall relocation 120 m (DC-02)', 1.1, 'Priced']],
    bgs: [['Bid security', 5.2, 'SBI', '2027-04-30', 'Released'], ['Performance security (5% of GMP)', 23.9, 'Bank of Baroda', '2029-09-30', 'Active'], ['Advance payment', 9.5, 'HDFC Bank', '2028-01-31', 'Reducing']],
    claims: [['CL-01', 'Owner review of 60% civil package overdue by 18 days', '2027-06-25', 18, 0.6, 'Submitted to owner']]
  });
  o.devs = [{ id: 'DEV-01', clause: 'OPR §3.2', text: 'Two MBBR streams of 50% with a third in civil only, deferring media for the third until flows exceed 60 MLD.', status: 'proposed', why: 'Defers ₹6 Cr of media; meets current flows' }, { id: 'DEV-03', clause: 'OPR §4.1', text: 'Cloth-media disc filters in place of sand filters.', status: 'accepted', why: 'Smaller footprint and lower backwash' }];
  o.runs = [{ n: 2, sum: '90 MLD · BOD 240 · 3 streams → 0.192 kWh/m³', by: 'Vikram Shah', ts: '12 Nov 10:20' }, { n: 1, sum: '85 MLD · BOD 220 · 3 streams → 0.183 kWh/m³', by: 'Vikram Shah', ts: '05 Nov 16:05' }];
  o.takeoff = MAP([['MBBR', 'MBBR tanks 3 × 6,800 m³', 3, 'C-110', 'accepted'], ['CONC', 'Structural concrete M35 (m³)', 14800, 'C-110', 'accepted'], ['PIPE', 'Process piping DI/SS (m)', 2650, 'P-210', 'proposed'], ['OUT', 'Outfall pipe 1,200 mm (m)', 480, 'P-210', 'proposed']], ['sym', 'item', 'qty', 'sheet', 'st']);
  o.boq = MAP([['Civil', 'C-1.01', 'Excavation in all soils', 'm³', 42000, 46800, 'Survey + takeoff', 92], ['Civil', 'C-2.04', 'RCC M35 for MBBR tanks', 'm³', 13500, 14800, 'Takeoff', 92], ['Mechanical', 'M-3.02', 'MBBR media (K3)', 'm³', 9600, 9600, 'Quotes', 100], ['Mechanical', 'M-3.07', 'Air blowers 4,200 Nm³/h', 'no', 5, 6, 'Calculator', 100], ['Mechanical', 'M-4.01', 'Disc filters 30 MLD', 'no', 3, 3, 'Quotes', 100], ['Electrical', 'E-1.02', '11 kV switchgear', 'set', 1, 1, 'Quotes', 92]], ['grp', 'code', 'desc', 'unit', 'client', 'ours', 'src', 'acc']);
  o.market = MAP([['Stainless steel 316', '₹272/kg', '+2.4%', 'Process piping', 0.3], ['Cement and rebar', 'DSR 2026 + 4%', '+2.1%', 'Civil and structural', 1.1], ['Copper (cables, motors)', 'LME $9,840/t', '+5.2%', 'Electrical and SCADA', 0.4]], ['f', 'basis', 'move', 'wp', 'adj']);
  o.awards = MAP([['MBBR media and aeration', 'Veolia Water Tech', 'Lowest levelled after sieve filler and energy', '₹1.4 Cr vs Headworks', 'Proposed'], ['Pumps', 'Xylem India', 'Best efficiency at duty point', '₹0.6 Cr', 'Approved']], ['pkg', 'rec', 'why', 'save', 'st']);
  o.om = MAP([['Operation support during taking-over trial (3 months)', 0.9], ['Defects liability attendance crew (12 months)', 1.2], ['Spares for defects liability period', 0.6]], ['item', 'cost']);
  o.bills = MAPID([['IPC-03', 'Jul 2027', 31.2, 30.6, 29.1, 'Paid'], ['IPC-04', 'Aug 2027', 36.8, 35.9, 0, 'Certified by IE'], ['IPC-05', 'Sep 2027', 39.4, 0, 0, 'Submitted']], ['id', 'period', 'claimed', 'cert', 'paid', 'st']);
  o.deliv = MAP([['KMC-P-DWG-010', 'Process flow diagram', 'Process', 'IFC', 'C', 100], ['KMC-C-DWG-112', 'MBBR tank reinforcement', 'Civil', 'IFA', 'B', 80], ['KMC-E-SLD-001', '11 kV single-line diagram', 'Electrical', 'IFC', 'B', 100]], ['doc', 'title', 'disc', 'status', 'rev', 'pct']);
  o.tqs = MAPID([['TQ-004', 'Confirm outfall invert after relocation', 'Answered'], ['TQ-007', 'MPCB analyser protocol', 'Open']], ['id', 'q', 'st']);
  o.po = MAPID([['PO-KMC-1102', 'MBBR media 9,600 m³', 'Veolia Water Tech', 9, 10, 'Chasing'], ['PO-KMC-1105', 'Air blowers × 6', 'Aerzen-Kirloskar', 12, 12, 'On track'], ['PO-KMC-1109', 'Disc filters × 3', 'Filtrex', 14, 13, 'On track']], ['id', 'item', 'sup', 'need', 'fc', 'exp']);
  o.vdocs = MAPID([['VD-MED-002', 'Veolia Water Tech', 'Media specific surface certificate', 'Code 1', '500 m²/m³ confirmed'], ['VD-BLW-004', 'Aerzen-Kirloskar', 'Blower curves', 'Code 2', 'Turndown 45%, spec 40%']], ['id', 'vendor', 'title', 'code', 'note']);
  o.fat = MAP([['Blowers 1–3 performance test', 'Month 11', 'Owner advisor', 'Passed'], ['Disc filter 1 cloth test', 'Month 12', 'Sahyadri', 'Scheduled']], ['item', 'date', 'wit', 'res']);
  o.logi = MAPID([['SH-021', 'MBBR media lot 1 (3,200 m³)', 'Road, 18 trucks', 'Arrived'], ['SH-024', 'Blowers 1–6', 'Road', 'In transit']], ['id', 'what', 'mode', 'st']);
  o.diary = MAP([['2027-10-22', 'Clear, 29 °C', 214, 'MBBR tank 3 wall pour 142 m³; media lot 2 unloaded'], ['2027-10-21', 'Light rain, 26 °C', 198, 'Outfall excavation stopped 3 h for dewatering']], ['date', 'weather', 'lab', 'entry']);
  o.row = MAP([['Outfall corridor 0–480 m', 'Irrigation department land', 'WRD', 'Permission granted'], ['Access road', 'Municipal road', C, 'Handed over']], ['ch', 'land', 'owner', 'status']);
  o.ctrl = MAP([['MBBR process', 98, 92, 54, 99], ['Civil and structural', 152, 148, 96, 155], ['Electrical and SCADA', 38, 33, 9, 38], ['Preliminaries and design', 36, 36, 24, 37]], ['wp', 'bud', 'com', 'act', 'fc']);
  o.cx = { levels: CX_LEVELS.slice(), systems: MAP([['Inlet works and odour control', [100, 60, 0, 0, 0]], ['MBBR streams 1–3', [100, 40, 0, 0, 0]], ['Disc filters', [60, 0, 0, 0, 0]], ['Sludge handling', [80, 20, 0, 0, 0]]], ['sys', 'p']) };
  o.punch = MAPID([['PL-A-002', 'MBBR streams 1–3', 'A', 'Media sieve gap stream 2', 'Open'], ['PL-B-014', 'Inlet works', 'B', 'Odour duct support missing', 'Open']], ['id', 'sys', 'cat', 'desc', 'st']);
  o.ptest.forEach((p, i) => { p.meas = [8.1, 7.4, 0.19][i]; });
  o.ptlog = Array.from({ length: 21 }, (_, i) => ({ id: uid(), day: i + 1, val: +(8.9 - i * 0.04 + Math.sin(i * 1.3) * 0.4).toFixed(2) })); o.ptDay = 21;
  o.consents = MAP([['MPCB consent to establish', 'Granted'], ['MPCB consent to operate', 'Applied'], ['CEIG approval 11 kV', 'Granted']], ['name', 'st']);
  o.assets = MAPID([['BLW-101', 'Air blower 1', 'Blower house', 'Aerzen-Kirloskar GM 50L', 'A'], ['MBR-201', 'MBBR stream 1 media', 'MBBR tank 1', 'Veolia AnoxKaldnes K3', 'A'], ['FLT-301', 'Disc filter 1', 'Tertiary building', 'Filtrex DF-30', 'B']], ['id', 'asset', 'loc', 'make', 'crit']);
  o.warr = MAP([['Air blowers', 'Aerzen-Kirloskar', '24 months', 'Month 36', 0], ['MBBR media', 'Veolia Water Tech', '60 months', 'Month 72', 0], ['Disc filters', 'Filtrex', '36 months', 'Month 48', 1]], ['item', 'sup', 'period', 'exp', 'open']);
  o.bva = MAP([['MBBR process (₹ Cr)', 98, 99, 'Media price +2%'], ['Civil and structural (₹ Cr)', 152, 155, 'Outfall relocation'], ['Design hours', 42000, 44600, 'Owner comments at 60%']], ['item', 'bid', 'act', 'note']);
  o.lessons = 'Fix the owner review period and deemed approval before Phase 1.\nRun the geotechnical survey in Phase 1, before the GMP.\nPrice the PI gap with sub-consultants.';
  return o;
}
function enrichOM(o) {
  const us = 'Rohit Bansal';
  enrichCommon(o, {
    stake: [['Executive Engineer (Drainage)', 'Vadodara MC', 'Contract manager', 'Neutral'], ['Independent Engineer', 'WAPCOS', 'Certifies monthly KPIs', 'Strict on data'], ['Regional Officer', 'GPCB', 'Discharge consent', 'Regulator'], ['Incumbent operator', 'Enviro Infra Services', 'Hands over the plant', 'Bidding against us']],
    comp: [['Enviro Infra Services (incumbent)', 'Operating Atladara since 2019', '₹0.62 Cr/MLD/yr (current)', 'Knows the plant; poor energy record'], ['Vishwa Aqua Infra', '3 O&M wins in Gujarat', '₹0.58 Cr/MLD/yr (Surat, 2025)', 'Aggressive on staffing'], ['Ion Exchange Services', '2 O&M wins', '₹0.66 Cr/MLD/yr (Rajkot, 2026)', 'Strong lab and chemicals']],
    facts: [['Evaluation', 'Lowest evaluated annual fee among technically qualified bidders', 'm1:18:§5.2'], ['Deduction cap', '10% of the monthly fee', 'm2:40:Sch. D'], ['Major replacement', 'Owner above ₹5 lakh per item', 'm2:33:§12'], ['Takeover', 'Joint inspection, then 30-day transition', 'm2:12:§3.2'], ['Handback grade', 'Condition 3 or better', 'm2:52:§22']],
    rules: [['KPI schedule governs over the scope text', 'Deduction rates priced from Sch. D only', 'pass', 'm2:4:§1.4'], ['Power cost included in the fee', 'Clarification PBQ-03 pending; priced at 0.17 kWh/m³', 'open', 'm2:28:§9'], ['Minimum 44 staff', 'Crew plan has 44, including 3 chemists', 'pass', 'm2:31:Sch. B'], ['No price in the technical bid', 'Scanned 10 sections: 0 prices found', 'pass', 'm1:22:§8.4']],
    addenda: [['Corr-01', '04 Nov 2026', 'D-02', 'Energy KPI changed from 0.20 to 0.18 kWh/m³', 'KPI deduction allowance re-priced\nEnergy section of the proposal redrafted']],
    lev: ['Chemicals and sludge haulage · 7 years', [['Gujarat Alkalies (chlorine)', 6.8, 'Covered', 2, 'FOR plant', 'Compliant'], ['SNF India (polymer)', 5.9, 'Excludes dosing support', 3, 'FOR plant', '1 deviation'], ['Jay Logistics (sludge haulage)', 6.3, 'Covered', 1, '14 km round trip', 'Compliant']], [['Dosing support (filler)', [0, 0.4, 0]], ['Price variation clause', [0.2, 0.3, 0.2]], ['Performance bond', [0.1, 0.1, 0.1]]]],
    bids: [['AquaCare O&M (us)', 96.4], ['Enviro Infra Services', 98.1], ['Vishwa Aqua Infra', 94.9]],
    pos: [['Power cost', 'Included', 'Pass-through within cap', 'Shared above 0.18', 'Pass-through within cap'], ['Deduction cap', '15%', '10%', '12%', '10%'], ['Major replacement', 'Operator', 'Owner above ₹5 lakh', 'Owner above ₹10 lakh', 'Owner above ₹5 lakh']],
    result: ['Won', 'L1 after Vishwa Aqua was disqualified on staffing (38 vs 44)\nStrongest condition-survey response'],
    bafo: [['Financial bid opened', 96.4], ['Negotiation (L1 call)', 95.8]],
    drift: [['Sch. D Deduction cap', '10%', '10%', 'None'], ['§12 Major replacement', 'Owner above ₹5 lakh', 'Owner above ₹5 lakh', 'None'], ['§9 Power cost', 'Pass-through within cap', 'Included in fee', 'High']],
    b2b: [['Response time', '4 hours for breakdowns', 'Instrument service contractor: 24 hours', 'Gap: 20 hours'], ['Sludge disposal', 'Daily removal', 'Haulage contractor: 6 days a week', 'Gap: Sundays'], ['Payment terms', '30 days from invoice', 'Chemical suppliers: 15 days', 'Cash-flow gap']],
    obl: [['OB-003', 'Monthly KPI report to IE', 'Operator', '7th of each month', true], ['OB-006', 'Rectify decanters before takeover', 'Owner', 'Done', false], ['OB-010', 'Quarterly GPCB returns', 'Operator', 'Quarterly', true], ['OB-015', 'Annual asset condition report', 'Operator', 'Each April', false]],
    mail: [['contract', 'in', 'Vadodara MC Legal', us, 'Draft O&M contract (v1)', 'Please review the draft O&M contract with the Letter of Award.', '08 Jan 2027', ['O&M Contract v1.pdf']], ['contract', 'out', us, 'Vadodara MC Legal', 'O&M contract: our redline (v2)', 'Our redline covers the deduction cap, major replacement and power cost.', '14 Jan 2027', ['O&M Contract v2 redline.pdf']], ['contract', 'in', 'Vadodara MC Legal', us, 'RE: O&M contract (v3)', 'Deduction cap at 10% accepted. Major replacement threshold under review. Power stays in the fee.', '22 Jan 2027', ['O&M Contract v3.pdf']], ['notice', 'out', 'Karthik Reddy', 'Independent Engineer', 'Notice OM-VMC-004: industrial discharge on 06 Apr', 'Raw BOD exceeded 380 mg/l on 06 Apr from an industrial discharge. We request that the day be excluded from KPI deductions.', '07 Apr 2027']],
    redlineBy: us, redlineTs: ['14 Jan 2027', '22 Jan 2027'], clauseComment: 'Threshold under review by the finance committee.',
    ncr: [['NCR-003', 'Analyser calibration record missing for 2 days', 'Lab', 'Closed'], ['NCR-005', 'Chlorine residual below 0.5 mg/l at outlet', 'Operations shift B', 'Open']],
    ptw: [['PTW-0031', 'Confined space', 'SBR decanter pit 5', 'Active', ''], ['PTW-0034', 'Electrical isolation', 'Blower 3 panel', 'Closed', '']],
    inc: [['2027-04-12', 'Near miss', 'Chlorine tonner valve leak detected by sensor', 'Closed'], ['2027-04-03', 'First aid', 'Slip on wet walkway at SBR 2', 'Closed']], mh: 96000,
    changes: [['CoS-01', 'Additional sampling for GPCB online audit', 0.12, 'Approved']],
    bgs: [['Bid security', 1.0, 'SBI', '2027-03-31', 'Released'], ['Performance security (5% of annual fee)', 0.7, 'Bank of Baroda', '2034-06-30', 'Active']]
  });
  return o;
}
function enrichEPCM(o) {
  const us = 'Dr. Anil Bhat';
  enrichCommon(o, {
    stake: [['Additional City Engineer', 'Nashik MC', 'Client and contract manager', 'Supportive'], ['AMRUT 2.0 cell', 'Urban Development Dept', 'Funding and approvals', 'Neutral'], ['Package 2 contractor', 'Deccan Hydro Projects', 'Contractor we supervise', 'Claims-focused'], ['Regional Officer', 'MPCB', 'Consent for the STP', 'Regulator']],
    comp: [['Tata Consulting Engineers', 'PMC on 4 AMRUT sewerage projects', 'Fee 2.9% of works', 'Strong CVs'], ['WAPCOS', 'Lowest fee in 3 of 5 QCBS bids', 'Fee 2.4% of works', 'Thin site team'], ['Mott MacDonald', 'Highest technical scores', 'Fee 3.3% of works', 'Expensive key experts']],
    facts: [['Evaluation', 'QCBS 80:20, technical minimum 70', 'c2:2:§3'], ['Key experts', '9 scored positions, CVs 60 of 100 marks', 'c2:3:§3.2'], ['Contract type', 'Time-based, paid on attendance', 'c3:6:§1.2'], ['Duration', '48 months', 'c1:30:TOR §2'], ['Works value', '₹780 Cr in 3 packages', 'c4:4:Summary']],
    rules: [['Data sheet governs over the TOR', 'Technical minimum 70 taken from the data sheet', 'pass', 'c2:1:§1'], ['Key expert CVs signed by the expert', '7 of 9 signed', 'open', 'c1:44:§7.5'], ['No financial data in the technical proposal', 'Scanned 8 sections: 0 prices found', 'pass', 'c1:20:§4.3'], ['Resident engineers on site ≥ 80%', 'Staffing schedule shows 85%', 'pass', 'c1:42:TOR §7.2']],
    addenda: [['Add-01', '06 Nov 2026', 'D-01', 'Third-party QA testing moved to reimbursables', 'Reimbursables +₹1.2 Cr\nFinancial form FIN-4 updated']],
    lev: ['Sub-consultants · surveys and testing', [['Survey Pro (topography)', 0.42, 'Covered', 6, 'Lump sum', 'Compliant'], ['GeoTech Labs (geotechnical)', 0.38, 'Excludes 4 boreholes', 8, 'Per borehole', '1 deviation'], ['Accurate Testing (NABL lab)', 1.15, 'Covered', 0, 'Per test', 'Compliant']], [['Missing boreholes (filler)', [0, 0.06, 0]], ['Mobilisation to site', [0.02, 0.03, 0.04]]]],
    bids: [['Hydroplan Associates (us)', 20.1], ['WAPCOS', 18.9], ['Tata Consulting Engineers', 22.4], ['Mott MacDonald', 25.6]],
    pos: [['Extension of services', 'No additional payment', 'Pro-rata at contract rates', 'Pro-rata up to 6 months', 'Pro-rata at contract rates'], ['Key expert replacement', '20% reduction', '10% with exceptions', '15%', '10% with exceptions'], ['Liability cap', 'Unlimited', 'Contract price', '1.5 × contract price', 'Contract price']],
    result: ['Won', 'Highest combined score after key-expert CV upgrade\nResident engineer for Package 2 named before negotiation'],
    bafo: [['Financial proposal opened', 20.1], ['Negotiation (man-month review)', 19.6]],
    drift: [['§6.2 Extension of services', 'Pro-rata at contract rates', 'Pro-rata at contract rates', 'None'], ['§8.1 Liability', 'Cap = contract price', 'Cap = contract price', 'None'], ['§4.5 Key expert replacement', '10% with exceptions', '15% without exceptions', 'Medium']],
    b2b: [['Survey accuracy', 'Client liability for design errors', 'Survey sub-consultant: liability capped at fee', 'Gap above ₹0.42 Cr'], ['Testing turnaround', '7 days for test results', 'NABL lab: 10 days', 'Gap: 3 days'], ['Payment terms', '30 days from attendance invoice', 'Sub-consultants: 15 days', 'Cash-flow gap']],
    obl: [['OB-002', 'Inception report', 'Consultant', 'Done', false], ['OB-005', 'Vet contractor designs', 'Consultant', 'Within 15 days', true], ['OB-008', 'Monthly progress report', 'Consultant', '10th of each month', true], ['OB-011', 'Provide site office', 'Client', 'Month 1', false]],
    mail: [['contract', 'in', 'Nashik MC Legal', us, 'Draft consultancy contract (v1)', 'Please review the draft consultancy contract.', '10 Jan 2027', ['Consultancy Contract v1.pdf']], ['contract', 'out', us, 'Nashik MC Legal', 'Consultancy contract: our comments (v2)', 'Our comments cover extension of services, liability and key expert replacement.', '15 Jan 2027', ['Consultancy Contract v2 redline.pdf']], ['contract', 'in', 'Nashik MC Legal', us, 'RE: Consultancy contract (v3)', 'Extension of services accepted. Liability cap accepted. Replacement: 15% stays.', '24 Jan 2027', ['Consultancy Contract v3.pdf']], ['oproc', 'out', us, 'pmc.cell@nmc.gov.in', 'Bid evaluation report: Package 1 (STP 60 MLD)', 'We evaluated 5 bids for Package 1. We recommend award to Deccan Hydro Projects at ₹268.4 Cr, the lowest evaluated responsive bid.', '14 Jun 2027', ['Package 1 evaluation report.pdf']], ['oproc', 'in', 'Nashik MC', us, 'RE: Bid evaluation report: Package 1', 'The standing committee approved the award on 28 Jun. Please issue the Letter of Acceptance draft.', '29 Jun 2027']],
    redlineBy: us, redlineTs: ['15 Jan 2027', '24 Jan 2027'], clauseComment: 'Accepted.',
    itp: [['ITP-S-01', 'Sewer pipe hydro test per 300 m section', 'Witness', 'In progress'], ['ITP-S-04', 'Manhole concrete cube tests', 'Review', 'Open'], ['ITP-S-07', 'CCTV survey before handover', 'Hold', 'Planned']],
    ncr: [['NCR-C-012', 'Bedding thickness below 150 mm at ch 4+100', 'Deccan Hydro Projects', 'Open'], ['NCR-C-009', 'Manhole cover grade below D400', 'Deccan Hydro Projects', 'Closed']],
    weld: [['HDPE-J-0211', 'Butt fusion 630 mm', 'Bead check + data log', 'Accepted'], ['HDPE-J-0219', 'Butt fusion 630 mm', 'Bead check + data log', 'Rejected'], ['HDPE-J-0224', 'Electrofusion 315 mm', 'Data log', 'Accepted']],
    inc: [['2027-09-20', 'Near miss', 'Trench without shoring at ch 4+300 (contractor)', 'Closed'], ['2027-09-05', 'Observation', 'Missing barricades on road crossing', 'Closed']], mh: 210000
  });
  return o;
}
const _seedDB = seedDB, _seedOM = seedOM, _seedEPCM = seedEPCM, _seedInd = seedIndrayani;
seedDB = () => enrichDB(_seedDB()); seedOM = () => enrichOM(_seedOM()); seedEPCM = () => enrichEPCM(_seedEPCM());
seedIndrayani = () => { const o = _seedInd(); o.runs = [{ n: 2, sum: '200 MLD · BOD 270 · 4 basins → 0.238 kWh/m³', by: 'Vikram Shah', ts: '03 Nov 15:40' }, { n: 1, sum: '200 MLD · BOD 200 · 4 basins → 0.203 kWh/m³', by: 'Vikram Shah', ts: '28 Oct 11:15' }]; return o; };

/* ---------------- accounts, storage, login ---------------- */
const REG_KEY = 'bidplan-ww3-tenants', SES_KEY = 'bidplan-ww3-session', TKEY = id => 'bidplan-ww3:' + id;
const DEMOS = { 'demo-epc': { company: 'Narmada Waterworks EPC Pvt Ltd', role: 'epc', email: 'bids@narmadawater.in', hq: 'Ahmedabad, Gujarat', name: 'Kavya Menon' }, 'demo-db': { company: 'Sahyadri Design-Build Pvt Ltd', role: 'db', email: 'bids@sahyadridb.in', hq: 'Pune, Maharashtra', name: 'Kavya Menon' }, 'demo-om': { company: 'AquaCare O&M Services Pvt Ltd', role: 'om', email: 'tenders@aquacareom.in', hq: 'Vadodara, Gujarat', name: 'Kavya Menon' }, 'demo-epcm': { company: 'Hydroplan Associates', role: 'epcm', email: 'proposals@hydroplan.in', hq: 'Mumbai, Maharashtra', name: 'Kavya Menon' } };
function registry() { let r = {}; try { r = JSON.parse(localStorage.getItem(REG_KEY) || '{}'); } catch (e) { } return { ...DEMOS, ...r }; }
function saveRegistry(id, t) { try { const r = JSON.parse(localStorage.getItem(REG_KEY) || '{}'); r[id] = t; localStorage.setItem(REG_KEY, JSON.stringify(r)); } catch (e) { } }
/* The stage line and the sentence under it, for one role. Swapped in place as
   the pointer moves over the list, so hovering a role shows what it would do. */
function wzPrevHtml(role) {
  const r = PROFILES[role] ? role : 'epc';
  return `<div class="ph"><h3>What changes for ${esc(ROLE_LABEL[r] || r)}</h3></div><div class="pb">${heroStages(r).replace('lgstages', 'lgstages light')}<p class="sub" style="margin-top:8px">${esc(PROFILES[r].hero[1])}</p></div>`;
}
/* Hovering or tabbing a role previews it; leaving the list puts the lead back. */
function wzPrevArm() {
  const box = document.getElementById('wzRoles'), panel = document.getElementById('wzPrev');
  if (!box || !panel || box.dataset.b) return;
  box.dataset.b = '1';
  const show = r => { panel.innerHTML = wzPrevHtml(r || S.wz.cfg.role); };
  const roleOf = e => { const l = e.target.closest && e.target.closest('.opt'); const i = l && l.querySelector('input[data-c="wzrole2"]'); return i ? i.value : null; };
  box.addEventListener('mouseover', e => { const r = roleOf(e); if (r) show(r); });
  box.addEventListener('mouseleave', () => { if (!box.contains(document.activeElement)) show(); });
  box.addEventListener('focusin', e => { const r = roleOf(e); if (r) show(r); });
  box.addEventListener('focusout', e => { if (!box.contains(e.relatedTarget) && !box.matches(':hover')) show(); });
}

/* Changing the lead role rebuilds every default from it, as picking a
   different radio used to; the roles ticked alongside it are carried over. */
function wzSetRoles(list, lead) {
  const w = S.wz, keep = { company: w.cfg.company, country: w.cfg.country, hq: w.cfg.hq, currency: w.cfg.currency };
  const led = list.includes(lead) ? lead : list[0];
  if (led !== w.cfg.role) w.cfg = Object.assign(configFor(led, w.cfg.sector), keep);
  w.cfg.role = led;
  w.cfg.roles = [led, ...list.filter(r => r !== led)];
}

/* The roles an account bids in; the lead one leads the list. */
function wzRoles(c) {
  const l = (c.roles || []).filter(r => CATALOG.roles.some(x => x[0] === r));
  if (c.role && !l.includes(c.role)) l.unshift(c.role);
  return l.length ? l : (c.role ? [c.role] : []);
}
function configFor(role, sector) { const sec = sector || ROLE_SECTOR[role] || 'ww'; applySector(sec); applyCatalog(role); const c = Object.assign(fullConfig(), SECTOR_TXT[sec].defaults); c.role = role; c.roles = [role]; c.sector = sec; return c; }
function seedDb(role, sample) { if (!sample) return { opps: {}, order: [] }; const o = seedFor({ epc: 'indrayani', db: 'db', om: 'om', epcm: 'epcm', mfr: 'mfr' }[role], {}); return { opps: { [o.meta.id]: o }, order: [o.meta.id] }; }
save = function () { if (!S.auth) return; try { localStorage.setItem(TKEY(S.auth.tenant), JSON.stringify({ cfg: S.cfg, role: S.role, db: S.db, oppId: S.oppId, audit: S.audit.slice(0, 80) })); } catch (e) { /* storage blocked: session only */ } };
load = function () { try { const s = JSON.parse(localStorage.getItem(SES_KEY) || 'null'); if (s && s.keep && registry()[s.tenant]) signIn(s.tenant, s.email, true, true); } catch (e) { } };
function signIn(id, email, keep, quiet) {
  const t = registry()[id]; let st = null; try { st = JSON.parse(localStorage.getItem(TKEY(id)) || 'null'); } catch (e) { }
  S.auth = { tenant: id, email };
  if (st && st.cfg) { S.cfg = st.cfg; S.db = st.db; S.role = st.role || 'bid_manager'; S.oppId = st.oppId; S.audit = st.audit || []; applySector(S.cfg.sector || ROLE_SECTOR[S.cfg.role] || 'ww'); applyProfile(S.cfg.role); }
  else { S.cfg = t.cfg ? deep(t.cfg) : Object.assign(configFor(t.role, t.sector), { company: t.company, hq: t.hq }, t.currency ? { currency: t.currency, country: t.country } : {}); applySector(S.cfg.sector || 'ww'); applyProfile(S.cfg.role); S.db = seedDb(S.cfg.role, t.sample !== false); S.role = 'bid_manager'; S.audit = [[nowTs(), t.name || 'System', 'Account created']]; S.oppId = S.db.order[0]; }
  Object.values(S.db.opps).forEach(ensureShape); if (!S.db.opps[S.oppId]) S.oppId = S.db.order[0];
  if (t.owner && S.cfg.admin == null) { const A = ensureAdmin(); A.users.unshift({ id: 'u-owner', name: t.name, email: t.email, role: 'admin', status: 'Active', mfa: true, last: 'Now' }); }
  applyAdmin();
  try { localStorage.setItem(SES_KEY, JSON.stringify({ tenant: id, email, keep })); } catch (e) { }
  S.view = 'overview'; S.phase = 'pre'; S.tab = 'brief'; S.v.doc = null; S.msgs = []; S.ui = {}; S.modal = null; S.scrollTop = true;
  if (!quiet) log('Signed in', email);
}
function heroStages(role) { const P = role === 'epc' ? EPC_DEF : PROFILES[role], G = role === 'epc' ? EPC_DEF.gates : PROFILES[role].gates, at = n => Object.entries(G).find(([g, x]) => x.stage === n); return `<div class="lgstages">${(P.stages || EPC_DEF.stages).map(([n, name]) => `<div class="lgst"><span class="lgg">${at(n) ? at(n)[0] : ''}</span><i class="${n <= 8 ? 'on' : ''}"></i><span class="lgn">${n}</span><span class="lgl">${esc(name)}</span></div>`).join('')}</div>`; }
/* The account picker on sign-in: the dark pill with an icon, the account name and
   a role chip, kept as it is in the Tracklivo control Srivi supplied. */
const ROLE_SHORT = { epc: 'EPC', db: 'Design-build', om: 'O&M', epcm: 'EPCM', mfr: 'Modular',
  gepc: 'EPC', gdb: 'Design-build', gco: 'Construct-only', gpmc: 'PMC' };
const acctPill = (d, mine) => `<button type="button" class="demo" data-a="lgfill" data-e="${esc(d.email)}" data-r="${d.role}" title="${esc(ROLE_LABEL[d.role] || d.role)}"><span class="dgl">${IC.account}</span><span class="dtx"><b>${esc(d.company)}</b><span>${esc(d.email)}${mine ? ' · your account' : ''}</span></span><span class="drole">${esc(ROLE_SHORT[d.role] || ROLE_LABEL[d.role] || d.role)}</span></button>`;
function loginPage() {
  const reg = registry(), mine = Object.entries(reg).filter(([k]) => !DEMOS[k]);
  const all = [...Object.entries(DEMOS).map(([k, d]) => [k, d, false]), ...mine.map(([k, d]) => [k, d, true])];
  const cur = (all.find(([, d]) => d.email === S.ui.lgEmail) || all[0])[1];
  return `<div class="login auth"><div class="auth__main">
   <div class="logo auth__brand">${logoSvg('lockup',34)}</div>
   <form class="form auth__form" id="loginform" novalidate>
    <div class="stack" style="gap:4px"><h1>Sign in to bidPlan</h1><span class="sub">Pick an account at the bottom right to try a different industry pack and role.</span></div>
    <label class="fld" for="lg-email">Work email<input type="email" id="lg-email" value="${esc(S.ui.lgEmail || 'bids@narmadawater.in')}" autocomplete="username"></label>
    <label class="fld" for="lg-pw">Password<input type="password" id="lg-pw" placeholder="Any password works in this prototype" autocomplete="current-password"></label>
    <div class="row between"><label class="chk" for="lg-keep" style="border:0;padding:0"><input type="checkbox" id="lg-keep" checked><span>Keep me signed in</span></label><button type="button" class="linkbtn" data-a="forgot">Forgot password?</button></div>
    <div id="lgerr" role="alert" class="sub" style="color:var(--danger-fg)">${esc(S.ui.lgErr || '')}</div>
    <button type="submit" class="btn pri lg" style="width:100%">Sign in</button>
    <div class="or">or</div>
    <button type="button" class="btn lg" data-a="sso" style="width:100%">Continue with company SSO (Entra ID)</button>
    <button type="button" class="btn ghost" data-a="signup" style="width:100%">Create a new account</button>
    <p class="sub lgfoot">Prototype: any password works. Type “wrong” to see the error.</p>
   </form></div>
  ${authAside()}${acctDock(all, cur)}</div>`;
}

/* The right half of the sign-in screen, as Tracklivo has it: what the product
   is, over a small, real-looking glimpse of the board you sign in to. */
const GLIMPSE_UNUSED = [
  ['Capture', [['200 MLD STP + trunk sewer', 'Indrayani Municipal Corp', '₹1,260 Cr'], ['Sewerage network, Zone 4', 'GUDC', '₹310 Cr']]],
  ['Engineering & pricing', [['Water treatment plant, 90 MLD', 'MJP Nashik', '₹640 Cr']]],
  ['Proposal', [['CETP upgrade, Phase 2', 'GIDC Ankleshwar', '₹185 Cr']]]
];

/* ---------------------------------------------------------------------------
   The film on the sign-in screen. Three cuts of the same story; the switch
   under the frame swaps the source in place rather than re-rendering the page,
   so picking one does not restart the sign-in form or lose what was typed.
   ------------------------------------------------------------------------- */
const FILMS = [
  ['a', 'On the record', 'films/bidplan-film-30s', '0:30', 'Scores a bid against your own history, in the open.', '#5C6D2E'],
  ['b', 'In the product', 'films/bidplan-film-b-30s', '0:30', 'The same moment, seen inside the workspace.', '#F1F2EB', 1],
  ['c', 'The process', 'films/bidplan-process-35s', '0:35', 'Thirteen stages and six gates on one line.', '#5C6D2E']
];
const filmPick = () => { let k = S.ui.lgFilm; if (!k) { try { k = localStorage.getItem('bpFilm'); } catch (e) { } } return FILMS.some(f => f[0] === k) ? k : 'a'; };
function filmBar(k) {
  return `<div class="lgfilm__bar" role="group" aria-label="Choose a film">
   ${FILMS.map(x => `<button type="button" class="${x[0] === k ? 'on' : ''}" data-a="lgfilm" data-v="${x[0]}" aria-pressed="${x[0] === k}" aria-label="${esc(x[1])} \u00b7 ${esc(x[3])}" title="${esc(x[1])} \u00b7 ${esc(x[3])}">${x[0].toUpperCase()}</button>`).join('')}</div>`;
}

ACT.lgfilm = d => {
  const f = FILMS.find(x => x[0] === d.v); if (!f) return 'skip';
  S.ui.lgFilm = d.v; try { localStorage.setItem('bpFilm', d.v); } catch (e) { }
  const v = document.getElementById('lgFilmV'); if (!v) return;
  const as = document.getElementById('lgAside');
  if (as) { as.style.setProperty('--film-bg', f[5]); as.classList.toggle('is-light', !!f[6]); }
  if (d.v === 'c') v.setAttribute('poster', 'films/bidplan-process-poster.jpg'); else v.removeAttribute('poster');
  v.setAttribute('aria-label', f[4]);
  v.querySelectorAll('source').forEach(sx => { sx.src = f[2] + (sx.type === 'video/webm' ? '.webm' : '.mp4'); });
  v.load(); const pr = v.play(); if (pr && pr.catch) pr.catch(() => { });
  document.querySelectorAll('.lgfilm__bar button').forEach(b => { const on = b.dataset.v === d.v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  return 'skip';
};

function authAside() {
  const k = filmPick(), f = FILMS.find(x => x[0] === k) || FILMS[0];
  return `<aside class="auth__aside${f[6] ? ' is-light' : ''}" id="lgAside" style="--film-bg:${f[5]}" aria-label="bidPlan in motion">
   <video id="lgFilmV" class="auth__film" autoplay muted loop playsinline preload="auto"${k === 'c' ? ' poster="films/bidplan-process-poster.jpg"' : ''} aria-label="${esc(f[4])}">
    <source src="${f[2]}.webm" type="video/webm"><source src="${f[2]}.mp4" type="video/mp4"></video>
   ${filmBar(k)}</aside>`;
}

/* The account picker, as it is in Tracklivo: a dark pill at the bottom right
   that opens the list of accounts and the role each one signs in as. */
function acctDock(all, cur) {
  const open = !!S.ui.proto;
  return `<div class="proto">
   ${open ? `<div class="proto__panel" role="dialog" aria-label="Choose an account">
    <div class="stack" style="gap:2px"><span class="eyebrow">Prototype · bidPlan</span><strong>Choose an account</strong><span class="proto__node muted">Each one opens a different industry pack and role.</span></div>
    <div class="proto__scen">${all.map(([, d, own]) => `<button data-a="lgfill" data-e="${esc(d.email)}" data-r="${d.role}" aria-current="${d.email === cur.email}" class="${d.email === cur.email ? 'is-now' : ''}">${esc(ROLE_LABEL[d.role] || d.role)}${own ? ' · your account' : ''}${d.email === cur.email ? '<span class="proto__badge">Current role</span>' : ''}<small>${esc(d.company)}</small><small class="mono">${esc(d.email)}</small></button>`).join('')}</div></div>` : ''}
   <button class="proto__toggle" data-a="proto" aria-expanded="${open}">${IC.account}${open ? 'Close' : `Accounts<span class="proto__now">${esc(ROLE_SHORT[cur.role] || cur.role)}</span>`}</button></div>`;
}
/* sign-in hero: one slide per role, advancing on its own; hover, focus or Pause holds it */
const HERO_MS = 2000;
let heroTimer = null, heroHold = false;
if (S.ui.heroPaused == null) try { S.ui.heroPaused = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
function heroInner(hr) {
  const H = PROFILES[hr].hero, ks = Object.keys(PROFILES), paused = S.ui.heroPaused;
  return `<div class="slide" aria-live="${paused ? 'polite' : 'off'}"><span class="eb">— ${esc(SECTOR_NAME[ROLE_SECTOR[hr] || 'ww'].toUpperCase())} · ${esc(ROLE_LABEL[hr].toUpperCase())}</span><h2>${esc(H[0])}</h2><p>${esc(H[1])}</p><div class="facts">${H[2].map(f => `<span>${esc(f)}</span>`).join('')}</div>${heroStages(hr)}</div>
   <div class="herosw"><span>See the workflow for</span>${SECTORS.map(sx => `<span class="hsec">${esc(SECTOR_NAME[sx[0]])}</span>` + ks.filter(r => (ROLE_SECTOR[r] || 'ww') === sx[0]).map(r => { const pin = S.ui.heroPin && r === hr; return `<button class="${r === hr ? 'on' : ''}${pin ? ' pin' : ''}" data-a="hero" data-v="${r}" aria-pressed="${pin}" title="${pin ? 'Click again to resume the slides' : 'Show this workflow and hold it'}">${pin ? '❚❚ ' : ''}${ROLE_LABEL[r]}</button>`; }).join('')).join('')}</div>`;
}
function heroSet(r) { S.ui.hero = r; const el = document.getElementById('lgHero'); if (el) el.innerHTML = heroInner(r); }
function heroArm() {
  clearTimeout(heroTimer); const el = document.getElementById('lgHero'); if (!el) return;
  if (!el.dataset.b) {
    el.dataset.b = '1';
    const hold = on => { if (heroHold === on) return; heroHold = on; el.classList.toggle('hold', on); if (!on) { heroSet(S.ui.hero || 'epc'); heroArm(); } };
    el.addEventListener('mouseenter', () => hold(true)); el.addEventListener('mouseleave', () => { if (!el.contains(document.activeElement)) hold(false); });
    el.addEventListener('focusin', () => { if (el.querySelector(':focus-visible')) hold(true); }); el.addEventListener('focusout', e => { if (!el.contains(e.relatedTarget) && !el.matches(':hover')) hold(false); });
  }
  if (S.ui.heroPaused || S.ui.heroPin || heroHold) return;
  heroTimer = setTimeout(() => { const ks = Object.keys(PROFILES); heroSet(ks[(ks.indexOf(S.ui.hero || 'epc') + 1) % ks.length]); heroArm(); }, HERO_MS);
}
const _renderHero = render;
render = function () { _renderHero(); if (!S.auth && S.view !== 'wizard') heroArm(); else clearTimeout(heroTimer); if (S.view === 'wizard') wzPrevArm(); };

/* wizard: sign-up (new account) or edit (existing account; sector and role fixed) */
WZ_STEPS.splice(0, WZ_STEPS.length, 'Industry sector', 'Company & account', 'Business profile', 'Project types', 'Delivery & scope', 'Technical scope', 'Workflows', 'Review & create');
const WZ_N = 8;
wizard = function () {
  const c = S.wz.cfg, signup = S.wz.mode === 'signup', sec = c.sector || 'ww', SX = SECTOR_TXT[sec], ORDER = (SX.steps || [1, 2, 3, 4, 5, 6, 7, 8]);
  if (!ORDER.includes(S.wz.step)) S.wz.step = ORDER.find(n => n > S.wz.step) || ORDER[ORDER.length - 1];
  const st = S.wz.step, pos = ORDER.indexOf(st);
  const head = (h, sub) => `<div class="stack" style="gap:8px"><span class="wz-eb">${signup ? 'SIGN UP' : 'SETUP'} ${pos + 1} / ${ORDER.length}</span><h1>${h}</h1><p class="sub" style="font-size:15px">${sub}</p></div>`;
  let body = '';
  if (st === 1) body = head('Choose your industry sector', signup ? 'The sector decides the project types, roles, stages, screens and calculators in your workspace. It is fixed once the account is created.' : 'The sector of this account. It is fixed because every record follows its workflow.') + `
    <div class="secgrid">${SECTORS.map(x => { const live = x[3] === 'active', onx = sec === x[0]; return `<label class="sec ${onx ? 'on' : ''} ${live ? '' : 'off'}" for="wz-sec-${x[0]}"><input type="radio" name="wzsec" id="wz-sec-${x[0]}" data-c="wzsector" value="${x[0]}" ${onx ? 'checked' : ''} ${live && signup ? '' : 'disabled'}><span class="row between" style="width:100%"><b>${esc(x[1])}</b><span class="chip ${live ? 'ok' : ''}">${live ? 'Available' : 'Coming soon'}</span></span><small>${esc(x[2])}</small><span class="mono sub">${esc(x[4])}</span></label>`; }).join('')}</div>`;
  if (st === 2) body = head(signup ? 'Create your account' : 'Your company', signup ? 'You become the Tenant Admin of this account. Everything after this step is pre-selected so you can explore the complete product; change anything.' : 'Company details for this account.') + `
    <div class="grid g2"><label class="fld" for="wz-company">Company name *<input type="text" id="wz-company" data-i="wzf" data-k="company" value="${esc(c.company)}" placeholder="${esc(SX.placeholder)}"></label>
    <label class="fld" for="wz-ind">Industry sector<input type="text" id="wz-ind" value="${esc(SECTOR_NAME[sec])}" disabled></label>
    ${signup ? `<label class="fld" for="wz-oname">Your name *<input type="text" id="wz-oname" data-i="wzo" data-k="name" value="${esc(S.wz.owner.name)}" autocomplete="name"></label><label class="fld" for="wz-oemail">Work email *<input type="email" id="wz-oemail" data-i="wzo" data-k="email" value="${esc(S.wz.owner.email)}" autocomplete="email"></label><label class="fld" for="wz-opw">Password *<input type="password" id="wz-opw" data-i="wzo" data-k="pw" placeholder="Any password works in this prototype" autocomplete="new-password"></label>` : ''}
    <label class="fld" for="wz-country">Country of operation<input type="text" id="wz-country" data-i="wzf" data-k="country" value="${esc(c.country)}"></label>
    <label class="fld" for="wz-hq">Head office<input type="text" id="wz-hq" data-i="wzf" data-k="hq" value="${esc(c.hq)}"></label>
    <label class="fld" for="wz-cur">Reporting currency<select id="wz-cur" data-c="wzsel" data-k="currency">${['INR (₹ Cr)', 'USD (million)', 'AED (million)', 'SAR (million)', 'EUR (million)'].map(o => `<option ${o === c.currency ? 'selected' : ''}>${o}</option>`).join('')}</select></label></div>${S.wz.err ? `<div class="note bad" role="alert"><div>${esc(S.wz.err)}</div></div>` : ''}`;
  if (st === 3) body = head('How your company bids', 'Your role reshapes the whole workspace: the stage line, screens, gates, team roles, pricing model and proposal template.') + `
    <h3>${esc(SX.roleHead)}</h3>
    <p class="sub" style="margin:-4px 0 0">Pick every role you bid in. The first one you pick is the <b>lead</b>: it configures this workspace — its stage line, screens and gates — and the rest are recorded on the account. Point at any role to see what it would do.</p>
    <div class="opts" id="wzRoles">${CATALOG.roles.filter(r => SECTOR_ROLES[sec].includes(r[0])).map(r => { const on = wzRoles(c).includes(r[0]), lead = c.role === r[0], only = on && wzRoles(c).length === 1;
      return `<label class="opt ${on ? 'on' : ''}" for="wz-role-${r[0]}"><input type="checkbox" id="wz-role-${r[0]}" data-c="wzrole2" value="${r[0]}" ${on ? 'checked' : ''} ${signup && !only ? '' : 'disabled'}><span><b>${r[1]}${lead ? '<span class="rolelead">Lead</span>' : ''}</b><small>${r[2]}</small></span></label>`; }).join('')}</div>
    ${signup ? '' : '<div class="note"><div>The role is fixed for an existing account because its records follow that workflow. Sign up again to try another role.</div></div>'}
    <div class="panel wz-prev" id="wzPrev">${wzPrevHtml(c.role)}</div>
    ${grpHead('clients', SX.clients, SX.clientsSub)}<div class="opts">${CATALOG.clients.map(x => optBox('clients', x[0], x[1])).join('')}</div>`;
  if (st === 4) body = head(SX.types[0], SX.types[1]) + grpHead('types', 'Project types') + `<div class="opts">${CATALOG.types.map(x => optBox('types', x[0], x[1], x[2])).join('')}</div>`;
  const dl = { epc: ['Enable delivery arrangements', 'Available delivery arrangements', 'Our contracted scope may include'], db: ['Design-build arrangements', 'Arrangements you bid', 'Our scope may include'], om: ['O&M contract forms', 'Contract forms you bid', 'Services in scope'], epcm: ['Consultancy assignments', 'Assignment types you bid', 'Services you provide'], mfr: ['How you contract and what you supply', 'Commercial arrangements', 'Your scope of supply'] }[c.role] || ['Delivery arrangements and scope', 'Delivery arrangements you bid', 'Our contracted scope may include'];
  if (st === 5) body = head(dl[0], 'All options are available to the account. Each opportunity selects its own.') + grpHead('delivery', dl[1]) + `<div class="opts">${CATALOG.delivery.map(x => optBox('delivery', x[0], x[1])).join('')}</div>` + grpHead('scope', dl[2]) + `<div class="opts">${CATALOG.scope.map(x => optBox('scope', x[0], x[1])).join('')}</div>`;
  if (st === 6) body = head('Enable technical capabilities', 'Technical modules decide which calculators, readers and specialist agents run on each opportunity.') + grpHead('tech', 'Technical modules') + `<div class="opts">${CATALOG.tech.map(x => optBox('tech', x[0], x[1], x[2])).join('')}</div>`;
  if (st === 7) { const grp =(k, h) => { const l = CATALOG.workflows.filter(w => w[3] === k); return l.length ? `<h3>${h}</h3><div class="opts">${l.map(w => optBox('workflows', w[0], w[1], w[2], w[4] ? `<span class="gt gchip pend">${w[4]}</span>` : '')).join('')}</div>` : ''; }; body = head('Enable workflows', `Workflows for ${esc(ROLE_LABEL[c.role])}. Each adds screens to every opportunity; those marked with a gate add a signed approval.`) + grpHead('workflows', 'Workflows') + grp('pre', 'Tender Intelligence') + grp('prop', 'Proposal') + grp('post', 'Post-award'); }
  if (st === 8) { const chips = (k, gate) => `<div class="row" style="gap:6px">${CATALOG[k].filter(x => c[k].includes(x[0])).map(x => `<span class="chip ${gate && x[4] ? 'brand' : 'pk'}">${esc(x[1])}${gate && x[4] ? ' · ' + x[4] : ''}</span>`).join('') || '<span class="chip bad">None selected</span>'}</div>`;
    body = head(signup ? 'Review and create your account' : 'Your configuration', 'Review the capability profile.') + `<div><div class="sumrow"><span>Sector</span><b>${esc(SECTOR_NAME[sec])}</b></div><div class="sumrow"><span>${esc(SX.clients)}</span>${chips('clients')}</div><div class="sumrow"><span>Company</span><b>${esc(c.company || '—')}</b></div><div class="sumrow"><span>${esc(SX.roleHead)}</span><div class="row" style="gap:6px">${wzRoles(c).map(r => `<span class="chip ${r === c.role ? 'brand' : 'pk'}">${esc(ROLE_LABEL[r] || r)}${r === c.role ? ' · lead' : ''}</span>`).join('')}</div></div>${signup ? `<div class="sumrow"><span>Tenant Admin</span><b>${esc(S.wz.owner.name || '—')} · ${esc(S.wz.owner.email || '—')}</b></div>` : ''}<div class="sumrow"><span>Project types</span>${chips('types')}</div><div class="sumrow"><span>${esc(dl[1])}</span>${chips('delivery')}</div><div class="sumrow"><span>${esc(dl[2])}</span>${chips('scope')}</div><div class="sumrow"><span>Workflows</span>${chips('workflows', true)}</div></div>
    ${signup ? `<label class="chk" for="wz-sample"><input type="checkbox" id="wz-sample" data-c="wzsample" ${S.wz.sample ? 'checked' : ''}><span>Include a sample ${esc(ROLE_LABEL[c.role].toLowerCase())} opportunity with records to explore</span></label>` : ''}${S.wz.err ? `<div class="note bad" role="alert"><div>${esc(S.wz.err)}</div></div>` : ''}`; }
  const nav = `<div class="wz-nav"><button class="btn lg" data-a="wzstep" data-v="${ORDER[pos - 1] || 1}" ${pos === 0 ? 'disabled' : ''}>Back</button>${pos < ORDER.length - 1 ? `<button class="btn lg pri" data-a="wzstep" data-v="${ORDER[pos + 1]}">Continue →</button>` : `<button class="btn lg pri" data-a="activate" ${c.types.length ? '' : 'disabled'}>${signup ? 'Create account →' : 'Save changes →'}</button>`}</div>`;
  return `<div class="wz"><header class="wz-top"><span class="wordmark">${logoSvg('wordmark',28)}</span><div class="row"><span class="chip pk">${esc(SECTOR_NAME[sec])} · ${esc(ROLE_LABEL[c.role])}</span>${signup ? '<button class="btn ghost" data-a="wizexit">Already have an account? Sign in</button>' : '<button class="btn ghost" data-a="wizexit">Back to workspace</button>'}</div></header>
  <div class="wz-body"><nav class="wz-steps" aria-label="Setup steps">${ORDER.map((n, i) => `<button class="${i === pos ? 'on' : i < pos ? 'done' : ''}" data-a="wzstep" data-v="${n}"><span class="n">${i < pos ? '✓' : i + 1}</span>${WZ_STEPS[n - 1]}</button>`).join('')}<div class="tag">One platform.<br>Every sector pack.<br><br>Configure broadly.<br>Confirm scope per opportunity.</div></nav>
  <main class="wz-main"><div class="wz-inner">${body}${nav}</div></main></div></div>`;
};

/* shell with account and sign-out */
const _shell = shell;
shell = function (content, crumbs) {
  return _shell(content, crumbs).replace(/<div class="tnm">[\s\S]*?<\/div>/,
    `<div class="tnm"><b>${esc(S.cfg.company)}</b><span>${esc(SECTOR_NAME[SECTOR])} · ${esc(ROLE_LABEL[PROFILE])}</span></div>`);
};

Object.assign(ACT, {
  hero: d => { const again = S.ui.heroPin && S.ui.hero === d.v; S.ui.heroPin = !again; if (again) { heroHold = false; const el = document.getElementById('lgHero'); if (el) el.classList.remove('hold'); } heroSet(d.v); heroArm(); return 'skip'; },
  lgfill: d => { S.ui.lgEmail = d.e; S.ui.hero = d.r; S.ui.lgErr = ''; S.ui.proto = false; },
  proto: () => { S.ui.proto = !S.ui.proto; },
  forgot: () => { toast('A reset link would be emailed. In this prototype any password works.'); return 'skip'; },
  sso: () => { const e = (document.getElementById('lg-email').value || '').trim().toLowerCase(), hit = Object.entries(registry()).find(([k, t]) => t.email.toLowerCase() === e); if (!hit) { S.ui.lgErr = 'No account uses that email. Choose a demo account or Sign up.'; return; } signIn(hit[0], hit[1].email, true); toast('Signed in with company SSO (simulated).'); },
  signup: () => { S.wz = { step: 1, mode: 'signup', cfg: Object.assign(configFor('epc', 'ww'), { company: '' }), owner: { name: '', email: '', pw: '' }, sample: true, err: '' }; S.view = 'wizard'; S.scrollTop = true; },
  wizard: () => { S.wz = { step: 2, mode: 'edit', cfg: deep(S.cfg), err: '' }; applyCatalog(S.cfg.role); S.view = 'wizard'; S.scrollTop = true; },
  wizexit: () => { if (S.auth) { applySector(S.cfg.sector || 'ww'); applyProfile(S.cfg.role); } S.view = S.auth ? 'overview' : 'login'; S.scrollTop = true; },
  wzsector: d => { const sec = d.v, keep = { company: S.wz.cfg.company }; S.wz.cfg = Object.assign(configFor(SECTOR_ROLES[sec][0], sec), keep); S.wz.err = ''; },
  wzstep: d => { const v = +d.v; if (S.wz.mode === 'signup' && v > 2 && S.wz.step === 2) { const o = S.wz.owner; if (!S.wz.cfg.company.trim() || !o.name.trim() || !/^\S+@\S+\.\S+$/.test(o.email)) { S.wz.err = 'Enter the company name, your name and a valid work email.'; return; } if (Object.values(registry()).some(t => t.email.toLowerCase() === o.email.toLowerCase())) { S.wz.err = 'An account already uses this email. Sign in instead.'; return; } } S.wz.err = ''; S.wz.step = Math.max(1, Math.min(WZ_N, v)); if (S.wz.mode === 'signup' && S.wz.step > 2 && !S.wz.owner.email && v > 2) S.wz.step = 2; S.scrollTop = true; },
  activate: () => {
    const w = S.wz, c = w.cfg;
    if (w.mode !== 'signup') { const keepAdmin = S.cfg.admin; S.cfg = deep(c); S.cfg.admin = keepAdmin; applyProfile(S.cfg.role); applyAdmin(); S.view = 'overview'; S.scrollTop = true; log('Updated account configuration'); toast('Configuration saved.'); return; }
    if (!c.types.length) { w.err = 'Select at least one project type.'; return; }
    const id = 'tn-' + Date.now().toString(36), t = { company: c.company.trim(), role: c.role, roles: wzRoles(c), sector: c.sector || 'ww', email: w.owner.email.trim(), hq: c.hq, name: w.owner.name.trim(), owner: true, sample: w.sample, cfg: deep(c) };
    saveRegistry(id, t); signIn(id, t.email, true, true); log('Created account', `${t.company} as ${ROLE_LABEL[t.role]}`);
    toast(`Account created for ${t.company}. You are its Tenant Admin; you are working as Bid Manager.`);
  },
  signout: () => { log('Signed out', S.auth.email); save(); try { localStorage.removeItem(SES_KEY); } catch (e) { } S.auth = null; S.cfg = null; S.db = { opps: {}, order: [] }; S.view = 'login'; S.ui = {}; S.modal = null; S.scrollTop = true; },
  reset: () => { if (!S.ui.reset) { S.ui.reset = 1; return; } const id = S.auth.tenant, e = S.auth.email; try { localStorage.removeItem(TKEY(id)); } catch (er) { } signIn(id, e, true, true); toast('Account data reset to the sample.'); },
  gmpst: d => { O().gmp.st = d.v; log('GMP status', d.v); },
  condq: d => { const o = O(), c = o.cond.find(x => x.id === d.id); o.clars.push({ id: nextId(o.clars, 'PBQ-'), q: `Please confirm the owner will rectify ${c.asset} (condition ${c.cond}/5, ₹${c.rect} Cr) before takeover.`, src: '', status: 'draft', disc: 'Contract', req: '', a: '' }); log('Raised query from survey', c.asset); toast('Query drafted in Clarifications.'); },
  ominv: d => { const o = O(); o.bills.push({ id: nextId(o.bills, 'INV-'), period: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), claimed: num(d.v), cert: 0, paid: 0, st: 'Submitted' }); log('Raised monthly invoice', '₹' + d.v + ' Cr'); toast('Invoice raised. Track it in Invoices & contract admin.'); },
  oprocmail: () => { const o = O(), R2 = o.obids.filter(b => b.resp === 'Responsive' && num(b.tech) >= 70).sort((a, b) => num(a.price) - num(b.price)); openMail({ title: 'Send evaluation report', to: o.meta.contact || o.meta.client, subject: `Bid evaluation report: ${o.opkg}`, body: `Dear Sir/Madam,\n\nWe have evaluated ${o.obids.length} bids for ${o.opkg}. ${o.obids.filter(b => b.resp !== 'Responsive').length} were non-responsive; ${o.obids.filter(b => b.resp === 'Responsive' && num(b.tech) < 70).length} fell below the technical minimum.\n\nWe recommend award to ${R2[0].bidder} at ₹${R2[0].price} Cr, the lowest evaluated responsive bid.\n\nRegards,\n${R().name}\n${R().title}`, attach: ['Bid evaluation report.pdf', 'Evaluation matrix.xlsx'], thread: 'oproc' }); }
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'loginform') return; e.preventDefault();
  const em = document.getElementById('lg-email').value.trim(), pw = document.getElementById('lg-pw').value, keep = document.getElementById('lg-keep').checked;
  S.ui.lgEmail = em;
  if (pw.trim().toLowerCase() === 'wrong') { S.ui.lgErr = "That email and password don't match. Check the password, or sign in with company SSO."; render(); return; }
  const hit = Object.entries(registry()).find(([k, t]) => t.email.toLowerCase() === em.toLowerCase());
  if (!hit) { S.ui.lgErr = 'No account uses that email. Choose a demo account below, or Sign up to create one.'; render(); return; }
  signIn(hit[0], hit[1].email, keep); render();
});
document.addEventListener('change', e => {
  const t = e.target, c = t.dataset.c; if (!c) return;
  if (c === 'wzrole2' && S.wz.mode === 'signup') {
    const w = S.wz.cfg, list = wzRoles(w), v = t.value;
    if (t.checked) { if (!list.includes(v)) list.push(v); wzSetRoles(list, w.role); }
    else { const left = list.filter(r => r !== v); if (!left.length) { t.checked = true; return; } wzSetRoles(left, w.role === v ? left[0] : w.role); }
    render();
  }
  if (c === 'wzsector' && S.wz.mode === 'signup') { ACT.wzsector({ v: t.value }); render(); }
  if (c === 'wzsample') S.wz.sample = t.checked;
  if (c === 'gmpset' && can('est')) { O().gmp[t.dataset.k] = num(t.value); render(); }
  if (c === 'omxset' && can('opex')) { O().omx[t.dataset.k] = num(t.value); render(); }
  if (c === 'qcbsw' && can('fee')) { O().qcbs[t.dataset.k] = num(t.value); render(); }
  if (c === 'opkg' && can('oproc')) { O().opkg = t.value; render(); }
});
document.addEventListener('input', e => { const t = e.target; if (t.dataset.i === 'wzo') S.wz.owner[t.dataset.k] = t.value; });

/* boot: run from gen.js on DOMContentLoaded, once every script has defined its
   views, sector packs and render wrappers. */
function bootApp() {
  load();
  const h = (location.hash || '').slice(1);
  if (!S.auth) { S.view = 'login'; if (h === 'signup' || h === 'setup') ACT.signup(); }

  window.addEventListener('resize', () => { if (document.getElementById('cadstage') && S.v.z) cadApply(); });
  render();
  if (S.auth && Object.values(S.db.opps).some(o => o.docs.some(d => d.state === 'Processing'))) runLanes();
}
