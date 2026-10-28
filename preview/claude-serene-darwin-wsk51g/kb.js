// Knowledge library: one list, no tabs. Everything the company knows — past bids,
// projects, credentials, people, plant, rates, approved content, lessons and the
// documents themselves — is one set of items, found by search and narrowed by facets.
// Opening an item gives a viewer canvas with an assistant that reads that item.

/* ---------------- domain extraction (wastewater / EPC) ----------------
   Real patterns over the item's own text, so an insight can be traced back to a
   sentence rather than asserted. Each rule yields {k, v, unit}. */
const KBX_RULES = [
  { k: 'Design flow', re: () => /\b(\d[\d.,]*)\s*(MLD|ML\/d|m³\/d|cum\/day)\b/gi, v: m => `${m[1]} ${m[2].toUpperCase().replace('M³/D', 'm³/d')}` },
  { k: 'Water quality', re: () => /\b(BOD|COD|TSS|TN|TP|NH3-N|FC)\b\s*[:=≤<]?\s*(\d+[\d.]*)\s*(mg\/l|MPN\/100ml)?/g, v: m => `${m[1]} ${m[2]}${m[3] ? ' ' + m[3] : ' mg/l'}` },
  { k: 'Energy', re: () => /\b(\d*\.?\d+)\s*kWh\s*\/\s*m³?\b/gi, v: m => `${m[1]} kWh/m³` },
  { k: 'Retention time', re: () => /\b(?:HRT|SRT|retention)\b[^.\d]{0,16}(\d+[\d.]*)\s*(h|hr|hrs|hours|days?)\b/gi, v: m => `${m[1]} ${m[2].replace(/^h(r|rs)?$/, 'h')}` },
  { k: 'Pipe', re: () => /\b(?:DN\s?(\d{2,4})|(\d{2,4})\s*mm\s*(?:dia|diameter|Ø))/gi, v: m => `DN ${m[1] || m[2]}` },
  { k: 'Chainage', re: () => /\bch(?:ainage)?\.?\s*(\d+[\d.+]*)\s*(km|m)\b/gi, v: m => `Ch. ${m[1]} ${m[2]}` },
  { k: 'Pump duty', re: () => /\b(\d[\d.,]*)\s*m³\s*\/\s*h\b[^.]{0,24}?\b(\d+[\d.]*)\s*m\b/gi, v: m => `${m[1]} m³/h @ ${m[2]} m head` },
  { k: 'Units', re: () => /\b(\d{1,3})\s*(?:nos?\.?\s*)?(aeration tanks?|SBR basins?|clarifiers?|digesters?|filters?|blowers?|pumps?|screens?|decanters?)\b/gi, v: m => `${m[1]} × ${m[2].toLowerCase()}` },
  { k: 'Drawing', re: () => /\b([A-Z]-\d{3})\b(?:\s*rev\.?\s*([A-Z]?\d))?/g, v: m => m[1] + (m[2] ? ` rev ${m[2]}` : '') },
  /* case-sensitive, so "blower duty is 4200" is not read as standard IS 4200 */
  { k: 'Standard', re: () => /\b(IS[:\s]?\d{3,5}|EN\s?\d{3,5}|ISO\s?\d{3,5}|CPHEEO|NBC\s?\d{4}|MoEF&?CC)\b/g, v: m => m[1].replace(/\s+/g, ' ') },
  { k: 'Duration', re: () => /\b(\d{1,3})\s*(months?|years?|weeks?)\b/gi, v: m => `${m[1]} ${m[2].toLowerCase()}` },
  { k: 'Value', re: () => /(?:₹|\bRs\.?\s?|\bINR\s?)\s*([\d,]*\d(?:\.\d+)?)\s*(Cr|crore|lakh|L)?\b/gi, v: m => `₹${m[1]}${m[2] ? ' ' + m[2] : ''}` }
];
function kbExtract(text) {
  if (!text) return [];
  const plain = String(text).replace(/<[^>]*>/g, ' ');
  const byKey = {};
  KBX_RULES.forEach(({ k, re, v }) => {
    const r = re(); let m;
    while ((m = r.exec(plain))) {
      const val = v(m); if (!val) continue;
      (byKey[k] = byKey[k] || []);
      if (!byKey[k].some(x => x.v.toLowerCase() === val.toLowerCase())) byKey[k].push({ v: val, at: m.index });
      if (byKey[k].length > 8) break;
    }
  });
  return Object.keys(byKey).map(k => ({ k, vals: byKey[k] }));
}
/* The sentence a value came from, so an insight can show its evidence. */
function kbEvidence(text, value) {
  if (!text) return '';
  const plain = String(text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const needle = value.replace(/^[₹×]\s*/, '').split(/[\s@]/)[0];
  const i = plain.indexOf(needle);
  if (i < 0) return '';
  const from = plain.lastIndexOf('. ', i), to = plain.indexOf('. ', i);
  return plain.slice(from < 0 ? 0 : from + 2, to < 0 ? Math.min(plain.length, i + 160) : to + 1).trim();
}

/* ---------------- document classification ----------------
   A signature of words decides the class. Shown as Proposed on upload, so the
   guess is reviewed rather than presented as fact. */
const KB_CLASSES = [
  /* "P and ID" too: an ampersand rarely survives a filename */
  ['P&ID', /\bP&ID\b|\bP\s*and\s*ID\b|piping and instrumentation/i, 'Drawings'],
  ['Process flow diagram', /process flow|\bPFD\b|flow diagram|mass flow/i, 'Process'],
  ['General arrangement', /general arrangement|\bGA\b drawing|elevation and section/i, 'Drawings'],
  ['Plant layout', /plant layout|site layout|site plan|plot plan/i, 'Drawings'],
  ['Single line diagram', /single line diagram|\bSLD\b|power distribution/i, 'E&I'],
  ['Mass balance', /mass balance|load balance|solids balance/i, 'Process'],
  ['Hydraulic profile', /hydraulic profile|head loss|freeboard/i, 'Process'],
  ['Completion certificate', /completion certificate|virtual completion|work done certificate/i, 'Credentials'],
  ['Technical specification', /technical specification|specification for|particular specification/i, 'Engineering'],
  ['Datasheet', /datasheet|data sheet|technical particulars/i, 'Engineering'],
  ['Bill of quantities', /bill of quantities|\bBOQ\b|schedule of rates|schedule of quantities/i, 'Quantities'],
  ['Method statement', /method statement|construction methodology|erection procedure/i, 'Engineering'],
  ['O&M manual', /operation and maintenance manual|O&M manual|operating instructions/i, 'O&M'],
  ['Proposal', /technical proposal|our proposal|technical bid|submission for/i, 'Proposals'],
  ['Bid outcome', /bid opening|letter of award|regret letter|evaluation result/i, 'Proposals'],
  ['Capability statement', /capability|company profile|about us|our strengths/i, 'Corporate'],
  ['Report', /\breport\b|findings|survey/i, 'Reports']
];
function kbClassify(name, text) {
  /* filenames separate words with hyphens, underscores and dots, so normalise them
     to spaces — otherwise "process-flow-diagram.pdf" matches nothing */
  const fn = String(name || '').replace(/\.[a-z0-9]+$/i, '').replace(/[-_.]+/g, ' ');
  const hay = fn + ' ' + (text || '').slice(0, 4000);
  const hit = KB_CLASSES.find(c => c[1].test(hay));
  if (!hit) return { cls: 'Document', disc: 'General', why: '' };
  const m = hay.match(hit[1]);
  return { cls: hit[0], disc: hit[2], why: m ? m[0].trim().toLowerCase() : '' };
}
const KB_KIND = n => /\.pdf$/i.test(n) ? 'pdf' : /\.(png|jpe?g|webp|gif|svg)$/i.test(n) ? 'img' : /\.(xlsx|xls|csv)$/i.test(n) ? 'xls' : /\.(dwg|dxf)$/i.test(n) ? 'dwg' : 'other';

/* ---------------- seeded documents ----------------
   Real sentences, so the extractors and the assistant have something to read. */
const KB_DOCS = [
  {
    id: 'K-D01', title: 'Narmada Waterworks capability statement 2026', kind: 'pdf', cls: 'Capability statement', disc: 'Corporate',
    date: '2026-03-18', src: 'Marketing', tags: ['profile', 'corporate'],
    text: `Narmada Waterworks EPC Pvt Ltd designs, builds and operates municipal water and wastewater infrastructure across Gujarat and Maharashtra. Since 2014 the company has delivered 11 sewage treatment plants with a combined capacity of 940 MLD and 196 km of trunk sewer. In-house disciplines cover process, civil, mechanical and E&I design, with a 60-strong engineering team at Ahmedabad. Current bid capacity is ₹2,940 Cr. The company holds ISO 9001, ISO 14001 and ISO 45001 certification and is registered with GWSSB and MJP as a Class I contractor. Treatment technologies delivered include SBR, MBBR, extended aeration and tertiary filtration to MoEF&CC norms of BOD ≤ 10 mg/l and TSS ≤ 10 mg/l.`
  },
  {
    id: 'K-D02', title: 'Vadodara 150 MLD STP — completion certificate', kind: 'pdf', cls: 'Completion certificate', disc: 'Credentials',
    date: '2024-02-11', src: 'Vadodara Municipal Corporation', tags: ['certificate', 'reference', 'vadodara'],
    text: `This is to certify that M/s Narmada Waterworks EPC Pvt Ltd has satisfactorily completed the design, construction and commissioning of a 150 MLD sewage treatment plant at Vadodara, together with 18 km of trunk sewer, under contract VMC/SEW/2019/04 valued at ₹412 Cr. The works were taken over on 11 February 2024 after a successful 90 day performance guarantee test. The plant achieved BOD 7 mg/l and TSS 8 mg/l against a guarantee of BOD ≤ 10 mg/l. Specific energy consumption was measured at 0.19 kWh/m³ against a guarantee of 0.21 kWh/m³. The contractor is presently engaged in the operation and maintenance of the plant for a period of 10 years.`
  },
  {
    id: 'K-D03', title: 'Process flow diagram — 150 MLD SBR plant', kind: 'dwg', sheet: 'P-001', cls: 'Process flow diagram', disc: 'Process',
    date: '2025-07-02', src: 'Engineering', tags: ['pfd', 'sbr', 'standard design'],
    text: `Process flow diagram for a 150 MLD sewage treatment plant on the SBR process. Raw sewage enters through a coarse screen chamber with 2 nos screens at 25 mm, followed by grit removal with 2 nos detritors. Flow passes to 6 nos SBR basins operating on a 4 hour cycle with an HRT of 18 hours. Decanted effluent is dosed with sodium hypochlorite and passes through 4 nos disc filters before discharge. Waste activated sludge is thickened and dewatered on 3 nos screw presses. Design basis is BOD 250 mg/l and TSS 300 mg/l at inlet, treated to BOD ≤ 10 mg/l, TSS ≤ 10 mg/l and FC ≤ 230 MPN/100ml per MoEF&CC. Blower duty is 4200 m³/h at 7 m head. Drawing P-001 rev B.`
  },
  {
    id: 'K-D04', title: 'Rajkot 120 MLD STP — plant general arrangement', kind: 'dwg', sheet: 'P-010', cls: 'General arrangement', disc: 'Drawings',
    date: '2025-11-20', src: 'Engineering', tags: ['ga', 'rajkot', 'layout'],
    text: `General arrangement of the Rajkot 120 MLD sewage treatment plant on a 14.2 hectare site. The inlet works sit at chainage 0.0 m with the administration block to the north. 4 nos aeration tanks are arranged in two banks with 2 nos clarifiers each of 38 m diameter. Sludge handling occupies the south-east corner with 2 nos digesters. The treated effluent outfall runs DN 1400 to the Aji river at chainage 1.8 km. Finished floor level is 134.50 m with a flood level of 133.10 m. Drawing P-010 rev C.`
  },
  {
    id: 'K-D05', title: 'Nashik 90 MLD HAM — technical proposal as submitted', kind: 'pdf', cls: 'Proposal', disc: 'Proposals',
    date: '2025-09-30', src: 'Bid team', tags: ['nashik', 'ham', 'lost'], bid: 'PB-2025-01',
    text: `Technical proposal for the design, build, finance, operation and transfer of a 90 MLD sewage treatment plant at Nashik under the hybrid annuity model. Our offer is based on the SBR process with 4 nos basins at an HRT of 16 hours, treating to BOD ≤ 10 mg/l and TSS ≤ 10 mg/l. The construction period is 24 months followed by an operation period of 15 years. Guaranteed specific energy consumption is 0.22 kWh/m³. Our bid project cost is ₹842 Cr with an O&M price of ₹14.2 Cr in year one escalating at 5 per cent. The plant is designed to CPHEEO manual norms and IS 456 for structural works.`
  },
  {
    id: 'K-D06', title: 'Nashik 90 MLD HAM — bid opening and evaluation result', kind: 'pdf', cls: 'Bid outcome', disc: 'Proposals',
    date: '2026-01-14', src: 'Nashik Municipal Corporation', tags: ['nashik', 'outcome', 'lost'], bid: 'PB-2025-01',
    text: `Record of bid opening for the Nashik 90 MLD STP under the hybrid annuity model. Three bidders were found technically responsive. Evaluated bid values on net present value of annuity and operation payments were: Suvarna Infra Projects ₹1,186 Cr, Narmada Waterworks EPC ₹1,203 Cr, Pragati Enviro JV ₹1,241 Cr. The lowest evaluated bidder was recommended for award. Technical scores were 82, 82 and 76 respectively. The difference between L1 and L2 arose almost entirely on the operation and maintenance component, where the successful bidder offered a lower annual charge over the 15 year operation period.`
  },
  {
    id: 'K-D07', title: 'Solapur 75 MLD STP — regret letter and bid checklist', kind: 'pdf', cls: 'Bid outcome', disc: 'Proposals',
    date: '2025-11-04', src: 'Solapur Municipal Corporation', tags: ['solapur', 'outcome', 'lost', 'disqualification'], bid: 'PB-2025-07',
    text: `The technical bid of M/s Narmada Waterworks EPC Pvt Ltd for the Solapur 75 MLD sewage treatment plant has not been considered for further evaluation. The solvency certificate submitted at Annexure 4 was issued on 12 February 2025, which is outside the six month validity window required by clause 2.3.1 of the instructions to bidders as reckoned from the bid due date of 3 September 2025. The bid was therefore declared non responsive at the qualification stage and the financial envelope was returned unopened.`
  },
  {
    id: 'K-D08', title: 'Mass balance workbook — 200 MLD SBR', kind: 'xls', cls: 'Mass balance', disc: 'Process',
    date: '2026-09-12', src: 'Process team', tags: ['mass balance', 'sbr', 'calculation'],
    rows: [['Stream', 'Flow m³/d', 'BOD mg/l', 'TSS mg/l', 'Load kg/d'],
    ['Raw sewage', '200000', '250', '300', '50000'],
    ['After screening', '200000', '245', '255', '49000'],
    ['After grit removal', '199200', '242', '210', '48206'],
    ['SBR effluent', '198400', '9', '9', '1786'],
    ['After disc filtration', '198000', '7', '5', '1386'],
    ['Waste activated sludge', '1600', '—', '12000', '19200']],
    text: `Mass balance for a 200 MLD SBR plant. Raw sewage of 200000 m³/d at BOD 250 mg/l and TSS 300 mg/l is screened and degritted before treatment in 6 nos SBR basins at an HRT of 18 hours. SBR effluent is 9 mg/l BOD, reduced to 7 mg/l after disc filtration, within the consent of BOD ≤ 10 mg/l. Waste activated sludge is 1600 m³/d at 12000 mg/l. Specific energy consumption at design flow is 0.203 kWh/m³.`
  },
  {
    id: 'K-D09', title: 'Fine bubble diffuser datasheet — 9 inch disc', kind: 'pdf', cls: 'Datasheet', disc: 'Engineering',
    date: '2026-05-21', src: 'Supplier', tags: ['diffuser', 'aeration', 'datasheet'],
    text: `Technical particulars for a 9 inch EPDM membrane fine bubble disc diffuser. Nominal air flow is 4 m³/h per disc with a working range of 2 to 8 m³/h. Standard oxygen transfer efficiency is 7.2 per cent per metre of submergence at 4.5 m. The membrane is perforated EPDM with a design life of 8 years. Material of the retaining ring is polypropylene to EN 12255. Connection is DN 80 to the drop pipe. Maximum operating temperature is 60 degrees celsius.`
  },
  {
    id: 'K-D10', title: 'Vadodara STP — completed plant photograph', kind: 'img', cls: 'Report', disc: 'Corporate',
    date: '2024-03-02', src: 'Site', tags: ['vadodara', 'photo', 'reference'],
    text: `Aerial photograph of the completed Vadodara 150 MLD sewage treatment plant showing 6 nos SBR basins, the blower house and the sludge handling area. Taken one month after taking over.`
  },
  {
    id: 'K-D11', title: 'Hard rock excavation — rate analysis and productivity', kind: 'xls', cls: 'Bill of quantities', disc: 'Quantities',
    date: '2026-02-08', src: 'Estimating', tags: ['rates', 'rock', 'excavation'],
    rows: [['Item', 'Unit', 'Bid rate', 'Actual', 'Variance'],
    ['Excavation in ordinary soil', 'm³', '182', '176', '-3.3%'],
    ['Excavation in hard rock (blasting)', 'm³', '1240', '1685', '+35.9%'],
    ['Excavation in hard rock (chiselling)', 'm³', '1980', '2410', '+21.7%'],
    ['PCC M10 backfill', 'm³', '5400', '5610', '+3.9%'],
    ['DN 1200 RCC NP4 pipe laid', 'm', '9850', '10240', '+4.0%']],
    text: `Rate analysis for excavation on the Rajkot trunk sewer. Hard rock was met from chainage 3.2 km rather than the 5 km assumed at bid stage, and the blasting rate over-ran by 35.9 per cent against a bid rate of ₹1240 per m³. Chiselling in built-up reaches cost ₹2410 per m³. The geotechnical investigation report covered only 9 boreholes over 14 km.`
  },
  {
    id: 'K-D12', title: 'Aeration and blower system P&ID', kind: 'dwg', sheet: 'M-301', cls: 'P&ID', disc: 'Drawings',
    date: '2026-06-14', src: 'Engineering', tags: ['p&id', 'blower', 'aeration'],
    text: `Piping and instrumentation diagram for the aeration and blower system. 3 nos positive displacement blowers rated 4200 m³/h at 7 m head operate on a duty-duty-standby arrangement with variable frequency drives. Air headers are DN 400 reducing to DN 200 at the drop pipes. Dissolved oxygen is controlled at 2.0 mg/l by a cascade loop from the DO analyser to the blower VFD. Pressure relief is set at 0.8 bar. All instruments are to IS 2147 ingress protection IP 65.`
  }
];

/* ---------------- one item list ----------------
   The records that used to be seven tabs become item types, so nothing is lost
   and the navigation disappears. */
function kbDate(s) { if (!s) return ''; const d = new Date(s); return isNaN(d) ? s : `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`; }
function kbAll() {
  if (S.kb && S.kb.cache) return S.kb.cache;
  const out = [];
  /* "added" is when the item entered the library, which is not the same as the date on
     its face — a credential's date is its expiry — so the two are kept apart. */
  const add = o => out.push({ st: 'accepted', tags: [], added: o.added || o.date || '', cat: o.cat || o.disc || 'General', ...o });

  Object.entries(PAST).forEach(([k, p]) => {
    const extra = KB_PROJ[k] || {};
    add({
      id: 'K-B' + k.slice(-4), ref: k, title: p.name, type: 'bid', kind: 'rec',
      cls: p.res === 'Won' ? 'Won bid' : 'Lost bid', disc: 'Proposals', cat: 'Bids', outcome: p.res,
      date: `${p.yr}-06-30`, src: 'Bid record', tags: [p.res.toLowerCase(), 'bid'],
      meta: { Result: p.res, 'Technical score': p.score, Capacity: p.mld + ' MLD', Year: p.yr, ...(extra.client ? { Client: extra.client } : {}), ...(extra.value ? { Value: '₹' + extra.value + ' Cr' } : {}), ...(extra.scope ? { Scope: extra.scope } : {}) },
      text: `${p.name}${extra.client ? ' for ' + extra.client : ''}. ${p.res === 'Won' ? 'Awarded' : 'Not awarded'} in ${p.yr}. Capacity ${p.mld} MLD. Technical score ${p.score}.${extra.scope ? ' Scope: ' + extra.scope + '.' : ''}${extra.value ? ' Value ₹' + extra.value + ' Cr.' : ''}`
    });
  });
  /* A bid that was never awarded is not a reference project: its record belongs to
     the bid above, not to a second item claiming work we never did. */
  Object.entries(KB_PROJ || {}).forEach(([k, p]) => {
    if (/not awarded/i.test(p.done || '')) return;
    const nm = (PAST[k] || {}).name || k;
    add({
      id: 'K-P' + k.slice(-4), ref: k, title: nm, type: 'project', kind: 'rec', cls: 'Reference project', disc: 'Credentials', cat: 'Projects',
      date: /^\d{4}-\d{2}$/.test(p.done || '') ? p.done + '-01' : '', src: p.client || 'Project record', tags: ['reference', p.certHeld ? 'certificate held' : 'no certificate'],
      meta: { Client: p.client || '—', Value: p.value ? '₹' + p.value + ' Cr' : '—', Scope: p.scope || '—', Period: `${p.start || '—'} to ${p.done || '—'}`, 'Completion certificate': p.certHeld ? 'Held' : 'Not held', 'PG test': p.perf ? 'Passed' : '—', 'Defects liability': p.dlp || '—', Reference: p.ref || '—' },
      certHeld: !!p.certHeld, value: p.value,
      text: `${nm} for ${p.client || 'the client'}. Scope: ${p.scope || '—'}. Contract value ₹${p.value || '—'} Cr, executed ${p.start || ''} to ${p.done || ''}. ${p.certHeld ? 'The completion certificate is held, so this may be claimed as completed work in a similar-works clause.' : 'No completion certificate is held, so this cannot be claimed as completed work.'} ${p.perf ? 'The performance guarantee test was passed.' : ''} Defects liability: ${p.dlp || '—'}. Client reference: ${p.ref || '—'}.`
    });
  });
  (KB_PEOPLE || []).forEach((p, i) => add({
    id: 'K-N' + String(i + 1).padStart(2, '0'), title: p.name, type: 'person', kind: 'rec', cls: 'CV', disc: 'Corporate', cat: 'People',
    date: p.cv || '', src: 'HR', tags: ['cv', 'key personnel'],
    meta: { Position: p.role || '—', Qualification: p.qual || '—', Experience: p.yrs ? p.yrs + ' years' : '—', 'Similar projects': p.similar != null ? p.similar : '—', 'CV signed': p.cv || '—', Availability: p.avail || '—' },
    cvDays: typeof kbDays === 'function' ? kbDays(p.cv) : null,
    text: `${p.name}, ${p.role || 'key person'}. ${p.qual || ''}, ${p.yrs || '—'} years of experience on ${p.similar != null ? p.similar : '—'} similar projects. CV last signed ${p.cv || 'unknown'}. ${p.avail || ''}. Named in the team schedule and scored on qualification, years and similar projects.`
  }));
  (KB_PLANT || []).forEach((p, i) => add({
    id: 'K-M' + String(i + 1).padStart(2, '0'), title: p.item, type: 'plant', kind: 'rec', cls: 'Plant item', disc: 'Engineering', cat: 'Plant',
    date: '', src: 'Plant register', tags: ['plant', (p.own || '').toLowerCase()],
    meta: { Ownership: p.own || '—', Quantity: p.qty != null ? p.qty : '—', Capacity: p.cap || '—', Age: p.age || '—' },
    text: `${p.item}. ${p.own || ''}, ${p.qty != null ? p.qty + ' units' : ''}${p.cap ? ', ' + p.cap : ''}${p.age ? ', ' + p.age + ' old' : ''}. Declared in the pre-qualification plant schedule. ${/lease/i.test(p.own || '') ? 'Leased items need the framework letter attached to the bid.' : ''}`
  }));
  (KB_RATE || []).forEach((r, i) => {
    const gap = r.bid ? (r.act - r.bid) / r.bid : 0;
    add({
      id: 'K-R' + String(i + 1).padStart(2, '0'), ref: r.code, title: r.item, type: 'rate', kind: 'rec', cls: 'Unit rate', disc: 'Quantities', cat: 'Rates',
      date: r.upd ? r.upd + '-01' : '', src: r.src || 'Close-out', tags: ['rate', Math.abs(gap) > 0.1 ? 'over-ran' : 'held'],
      meta: { Code: r.code || '—', Unit: r.unit || '—', 'Bid rate': '₹' + r.bid, 'Actual cost': '₹' + r.act, Variance: (gap > 0 ? '+' : '') + Math.round(gap * 100) + '%', From: r.src || '—', Updated: r.upd || '—' },
      gap,
      text: `${r.item} (${r.code || 'rate'}). Bid rate ₹${r.bid} per ${r.unit || 'unit'}, actual cost ₹${r.act} per ${r.unit || 'unit'}, a variance of ${Math.round(gap * 100)} per cent, from ${r.src || 'close-out'}. The estimator starts from the actual, not the bid.`
    });
  });
  (KB_BLOCK || []).forEach((b, i) => add({
    id: 'K-A' + String(i + 1).padStart(2, '0'), ref: b.id, title: b.title, type: 'content', kind: 'rec', cls: 'Content block', disc: 'Proposals', cat: 'Approved content',
    date: b.appr || '', src: ROLES[b.own] ? ROLES[b.own].name : (b.own || 'Proposals'), tags: ['approved content', (b.sec || '').toLowerCase()],
    meta: { Reference: b.id || '—', Section: b.sec || '—', Owner: ROLES[b.own] ? ROLES[b.own].name : (b.own || '—'), Approved: b.appr || '—', 'Times used': b.used != null ? b.used : '—', Words: b.w != null ? b.w : '—' },
    apprDays: typeof kbDays === 'function' ? kbDays(b.appr) : null,
    text: `${b.title} (${b.id || ''}). Approved content for the ${b.sec || 'proposal'} section, owned by ${ROLES[b.own] ? ROLES[b.own].name : (b.own || 'the proposals team')}, approved ${b.appr || 'unknown'} and used ${b.used != null ? b.used : '—'} times. The proposal writer may reuse this without re-approval.`
  }));
  (KB_LESSON || []).forEach((l, i) => add({
    id: 'K-L' + String(i + 1).padStart(2, '0'), title: `${l.theme}: ${l.proj}`, type: 'lesson', kind: 'rec', cls: 'Lesson learned', disc: 'Proposals', cat: 'Lessons',
    date: l.date || '', src: l.by || 'Close-out', tags: ['lesson', l.theme.toLowerCase()],
    meta: { Theme: l.theme, Project: l.proj, 'Written by': l.by || '—', Date: l.date || '—' },
    text: `${l.theme} on ${l.proj}. ${l.lesson} Written by ${l.by || 'the team'}.`
  }));
  KB_DOCS.forEach(d => add({ ...d, type: 'document', meta: d.meta || { Class: d.cls, Discipline: d.disc, Source: d.src, Date: kbDate(d.date) } }));
  (S.kbAdded || []).forEach(d => add(d));

  if (!S.kb) S.kb = kbState();
  S.kb.cache = out;
  return out;
}
const kbState = () => ({ q: '', tab: 'all', doc: null, msgs: [], busy: false, step: 0, cache: null, intake: [], paste: false, drag: false });
const kbBust = () => { if (S.kb) S.kb.cache = null; };
const kbItem = id => kbAll().find(i => i.id === id);

/* ---------------- search and facets ---------------- */
const KB_TYPES = [['document', 'Documents'], ['bid', 'Bids'], ['project', 'Projects'], ['credential', 'Credentials'], ['person', 'People'], ['plant', 'Plant'], ['rate', 'Rates'], ['content', 'Content'], ['lesson', 'Lessons']];
function kbHaystack(i) { return [i.title, i.cls, i.cat, i.disc, i.src, i.st, (i.tags || []).join(' '), i.text, Object.entries(i.meta || {}).map(([k, v]) => k + ' ' + v).join(' ')].join(' ').toLowerCase(); }
function kbFind(q, facets) {
  const all = kbAll(), f = facets || {};
  const terms = (q || '').toLowerCase().split(/\s+/).filter(Boolean);
  return all.filter(i => {
    if (f.type && f.type.length && !f.type.includes(i.type)) return false;
    if (f.outcome && f.outcome.length && !f.outcome.includes(i.outcome)) return false;
    if (f.disc && f.disc.length && !f.disc.includes(i.disc)) return false;
    if (f.status && f.status.length && !f.status.includes(i.st)) return false;
    if (!terms.length) return true;
    const h = kbHaystack(i);
    return terms.every(t => h.includes(t));
  }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title));
}
function kbSnippet(i, q) {
  const t = (i.text || '').replace(/\s+/g, ' ');
  const term = (q || '').toLowerCase().split(/\s+/).filter(Boolean)[0];
  if (!term) return t.slice(0, 150);
  const at = t.toLowerCase().indexOf(term);
  if (at < 0) return t.slice(0, 150);
  const from = Math.max(0, at - 60);
  return (from ? '…' : '') + t.slice(from, from + 170);
}
const kbMark = (s, q) => { const term = (q || '').split(/\s+/).filter(Boolean)[0]; if (!term) return esc(s); try { return esc(s).replace(new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); } catch (e) { return esc(s); } };

/* ---------------- lost bid analysis ----------------
   Attribution computed from the evidence that exists: the evaluated-bid gap, the
   technical score, where the gap arose, qualification validity and the lessons. */
function kbLoss(item) {
  const text = kbAll().filter(i => i.bid === item.ref).map(i => i.text).join(' ') + ' ' + item.text;
  const lesson = kbAll().find(i => i.type === 'lesson' && i.meta && i.meta.Project === item.title);
  const factors = [];

  const dq = /non responsive|not been considered|declared non|disqualif|returned unopened/i.test(text);
  const cred = /solvency|certificate|validity window|clause \d/i.test(text) && dq;
  if (dq) factors.push({ k: 'Disqualified before evaluation', w: 100, hard: true, why: cred ? 'A qualification document fell outside its validity window, so the financial envelope was never opened. Price had no bearing on this loss.' : 'The bid was ruled non-responsive at the qualification stage.', ev: kbEvidence(text, 'solvency') || kbEvidence(text, 'non') });

  /* Only the outcome letter carries comparable evaluated bids. Our own proposal states
     a bid project cost on a different basis, so reading both together would compare
     unlike figures and invent a gap that was never there. */
  const outcome = kbAll().find(x => x.bid === item.ref && x.cls === 'Bid outcome');
  const otext = outcome ? outcome.text : '';
  const bids = [...otext.matchAll(/([A-Z][A-Za-z&.\s]{3,38}?)\s*₹\s*([\d,]+)\s*Cr/g)].map(m => ({ who: m[1].trim(), v: num(m[2].replace(/,/g, '')) })).filter(b => b.v > 0);
  const us = bids.find(b => /narmada/i.test(b.who)), low = bids.slice().sort((a, b) => a.v - b.v)[0];
  if (!dq && us && low && low.v < us.v) {
    const pct = (us.v - low.v) / low.v * 100;
    factors.push({ k: 'Evaluated bid above L1', w: 100, hard: true, why: `The award went to the lowest evaluated bid. Ours was ₹${fmtN(us.v)} Cr against ₹${fmtN(low.v)} Cr, a gap of ₹${fmtN(us.v - low.v, 1)} Cr or ${pct.toFixed(1)}%. That gap is the loss; the factors below are where it came from.`, ev: kbEvidence(otext, String(us.v)) });
  }
  const scores = [...text.matchAll(/scores?\s+were\s+([\d,\s and]+)/gi)].map(m => m[1].match(/\d+/g) || []).flat().map(Number);
  if (!dq && scores.length > 1) {
    const best = Math.max(...scores), ours = item.meta && item.meta['Technical score'];
    if (ours && ours >= best) factors.push({ k: 'Technical score was not the cause', w: 0, why: `Our technical score of ${ours} matched or beat the field (${scores.join(', ')}), so the loss did not come from the technical proposal.` });
    else if (ours) factors.push({ k: 'Technical score below the best', w: Math.round((best - ours) * 4), why: `Our technical score of ${ours} against a best of ${best}.` });
  }
  if (!dq && /operation and maintenance component|O&M|operation period/i.test(text)) {
    factors.push({ k: 'O&M pricing over the operation period', w: 62, why: 'The gap arose on the operation and maintenance component rather than capex, over a long operation period where a small annual difference compounds.', ev: kbEvidence(otext, 'operation and maintenance component') || kbEvidence(otext, 'difference between L1') });
  }
  const expired = kbAll().filter(i => i.type === 'credential' && i.expDays != null && i.expDays < 0);
  if (dq && expired.length) factors.push({ k: 'Credential still expired today', w: 40, why: `${expired.length} credential${expired.length > 1 ? 's remain' : ' remains'} expired in the library now, so the same cause is live for the next submission.`, ev: expired.map(e => e.title).join('; ') });

  factors.sort((a, b) => b.w - a.w);
  const actions = [];
  if (cred) { actions.push('Make credential validity a computed check at G3, reckoned from the bid due date rather than today.'); actions.push('Re-issue the expired credentials in the library before the next qualification submission.'); }
  if (factors.some(f => /O&M/.test(f.k))) { actions.push('Price the operation years first and back-solve the capex on annuity models.'); actions.push('Use the client\'s own escalation clause in the O&M NPV rather than a flat assumption.'); }
  if (factors.some(f => /Evaluated bid above L1/.test(f.k))) actions.push('Review the margin and contingency set at G2 against the evaluated-bid gap, not the capex gap.');
  if (lesson) actions.push(`From the loss review: ${(lesson.meta && lesson.meta.Theme) || 'lesson'} — ${lesson.text.split('. ').slice(1).join('. ').trim()}`);
  return { factors, actions, lesson, docs: kbAll().filter(i => i.bid === item.ref) };
}
function kbLostAll() {
  const lost = kbAll().filter(i => i.type === 'bid' && i.outcome === 'Lost');
  const each = lost.map(b => ({ bid: b, ...kbLoss(b) }));
  const causes = {};
  each.forEach(e => e.factors.filter(f => f.w > 30).forEach(f => { causes[f.k] = (causes[f.k] || 0) + 1; }));
  return { each, causes, lost };
}

/* ---------------- the one list ---------------- */
/* Five tabs, not twenty filter pills. Everything narrower than this is the job of
   search, and every row still carries its own type on the right. */
const KB_TABS = [
  ['all', 'All', () => true],
  ['docs', 'Documents', i => i.type === 'document'],
  ['bids', 'Bids', i => i.type === 'bid'],
  ['lost', 'Lost bids', i => i.type === 'bid' && i.outcome === 'Lost'],
  ['projects', 'Projects', i => i.type === 'project'],
  ['team', 'People & plant', i => i.type === 'person' || i.type === 'plant'],
  ['know', 'Know-how', i => i.type === 'rate' || i.type === 'content' || i.type === 'lesson']
];
const KB_TAB_NOTE = {
  all: 'Everything the company knows, newest first.',
  docs: 'The files themselves — drawings, datasheets, proposals, certificates and reports.',
  bids: 'Every bid on record, won and lost.',
  lost: 'What was lost and why, read from the outcome letters and the loss reviews.',
  projects: 'Completed works that can answer a similar-works clause, and whether the certificate is held.',
  team: 'Key personnel named in the team schedule, and the plant declared in the PQ schedule.',
  know: 'Unit rates against what the work really cost, approved proposal content and lessons learned.'
};
const kbTab = () => (S.kb && S.kb.tab) || 'all';
const kbTabDef = () => KB_TABS.find(t => t[0] === kbTab()) || KB_TABS[0];
const KB_ICON = { document: IC.doc, bid: IC.chart, project: IC.pipe, credential: IC.lock, person: IC.user, plant: IC.factory, rate: IC.chart, content: IC.book, lesson: IC.alert };

function kbTypeChip(i) { return `<span class="kb-k">${KB_ICON[i.type] || IC.doc}${esc(i.cls || i.type)}</span>`; }
/* the only status worth carrying into a scan of the table */
function kbFlag(i) {
  return i.expDays != null && i.expDays < 0 ? '<span class="chip bad">Expired</span>'
    : i.expDays != null && i.expDays < 90 ? '<span class="chip warn">Expires soon</span>'
      : i.outcome === 'Lost' ? '<span class="chip bad">Lost</span>'
        : i.outcome === 'Won' ? '<span class="chip ok">Won</span>'
          : i.type === 'project' && !i.certHeld ? '<span class="chip warn">No certificate</span>'
            : i.gap != null && Math.abs(i.gap) > 0.1 ? `<span class="chip warn">${i.gap > 0 ? '+' : ''}${Math.round(i.gap * 100)}%</span>` : '';
}
const KB_FMT = { pdf: 'PDF', dwg: 'Drawing', xls: 'Spreadsheet', img: 'Image', rec: 'Record', other: 'File' };
const kbFmt = i => KB_FMT[i.kind] || 'File';
function kbTable(items, q) {
  return `<div class="panel kb-list"><div class="tw"><table class="t kb-t">
   <thead><tr><th>Document name</th><th>Document type</th><th>Category</th><th>Date uploaded</th></tr></thead>
   <tbody>${items.map(i => `<tr data-a="kbopen" data-id="${i.id}" tabindex="0">
     <td><span class="kb-nm">${KB_ICON[i.type] || IC.doc}<b>${kbMark(i.title, q)}</b>${i.st === 'proposed' ? '<span class="chip ai">Proposed</span>' : ''}${kbFlag(i)}</span></td>
     <td>${esc(i.cls || '—')}${i.kind !== 'rec' ? `<span class="kb-fmt">${esc(kbFmt(i))}</span>` : ''}</td>
     <td>${esc(i.cat || i.disc || '—')}</td>
     <td class="kb-dt">${i.added || i.date ? kbDate(i.added || i.date) : '—'}</td></tr>`).join('')}</tbody>
  </table></div></div>`;
}
function vKB() {
  if (S.kb && S.kb.doc) return kbCanvas();
  if (!S.kb) S.kb = kbState();
  const K = S.kb, all = kbAll(), def = kbTabDef();
  const hits = kbFind(K.q, {}).filter(def[2]);

  const tabs = KB_TABS.map(([v, label, pred]) => {
    const n = all.filter(pred).length;
    return `<button class="${v === kbTab() ? 'on' : ''}" data-a="kbtab" data-v="${v}">${esc(label)}<span class="ct2">${n}</span></button>`;
  }).join('');


  return `<div class="kb-page ${S.kb.drag ? 'is-drag' : ''}">
  ${sh('Platform', 'Knowledge library', 'Everything the company knows, in one place. Search it, pick a tab, or drop a document anywhere on this page.',
    `<button class="btn" data-a="kbpaste">Paste text</button>`)}
  <input type="file" id="kbfilein" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.svg,.xlsx,.xls,.csv,.dwg,.dxf,.txt,.md" hidden>
  <div class="kb-search"><label class="agsearch" style="flex:1">${IC.search}<input type="search" id="kbq" data-i="kbq" value="${esc(K.q)}" placeholder="Search everything: a plant, a rate, a clause, a drawing number…" aria-label="Search the knowledge library" autocomplete="off"></label>
   <span class="agcount">${hits.length} of ${all.length}</span>${K.q ? `<button class="btn sm" data-a="kbclear">Clear</button>` : ''}</div>
  <nav class="modtabs kb-tabs" aria-label="Knowledge library sections">${tabs}</nav>
  ${KB_TAB_NOTE[kbTab()] ? `<p class="kb-tabnote">${esc(KB_TAB_NOTE[kbTab()])}</p>` : ''}
  ${kbDropBar()}
  ${kbTab() === 'lost' ? kbLostPanel() : ''}
  ${hits.length ? kbTable(hits, K.q)
      : `<div class="panel"><div class="empty"><h3>Nothing here</h3><p>${K.q ? `Nothing matches “${esc(K.q)}” in ${esc(def[1])}.` : `There is nothing in ${esc(def[1])} yet. Drop a document anywhere on this page to add one.`}</p>${K.q ? '<button class="btn" data-a="kbclear">Clear the search</button>' : ''}</div></div>`}
  <div class="kb-drop" aria-hidden="true"><div><span>${IC.up}</span><b>Drop to add to the library</b><span class="sub">It is read, classified and shown to you before anything is filed.</span></div></div>
  </div>`;
}

/* ---------------- lost bids, inside the library ---------------- */
function kbLostPanel() {
  const L = kbLostAll();
  if (!L.lost.length) return '';
  const causes = Object.entries(L.causes).sort((a, b) => b[1] - a[1]);
  return `<div class="panel kb-lost"><div class="ph"><div><h3>Lost bid analysis</h3><span class="sub">Read from the bid records, the outcome letters and the loss reviews. Each cause below is drawn from evidence in the library, not assumed.</span></div><span class="chip bad">${L.lost.length} lost</span></div>
   <div class="pb stack" style="gap:14px">
    ${causes.length ? `<div><span class="eyebrow">Recurring causes</span><div class="kb-causes">${causes.map(([c, n]) => `<span class="kb-cause"><b>${n}</b> ${esc(c)}</span>`).join('')}</div></div>` : ''}
    ${L.each.map(e => `<div class="kb-lossc">
      <div class="row between"><div><b>${esc(e.bid.title)}</b><div class="sub">${esc(e.bid.meta.Year)} · ${esc(e.bid.meta.Capacity)} · technical score ${esc(String(e.bid.meta['Technical score']))}</div></div><button class="btn sm" data-a="kbopen" data-id="${e.bid.id}">Open analysis</button></div>
      <div class="kb-bars">${e.factors.slice(0, 3).map(f => `<div class="kb-bar"><div class="row between"><span>${esc(f.k)}</span><span class="mono sub">${f.hard ? 'decisive' : f.w === 0 ? 'ruled out' : f.w + '%'}</span></div><div class="kb-track"><i style="width:${Math.max(3, f.w)}%;background:${f.hard ? 'var(--bad)' : f.w === 0 ? 'var(--ok)' : 'var(--brand)'}"></i></div><span class="sub">${esc(f.why)}</span></div>`).join('')}</div>
     </div>`).join('')}
   </div></div>`;
}

/* ---------------- document canvas ----------------
   The item on the left, an assistant that reads that item on the right. */
function kbBody(i) {
  if (i.kind === 'dwg' && typeof drawSheet === 'function') {
    const sh = (typeof SHEETS !== 'undefined' && SHEETS.find(s => s.no === i.sheet)) || null;
    return `<div class="kb-dwg">${drawSheet(i.sheet || 'P-001')}</div>${sh ? `<div class="kb-cap">${esc(i.sheet)} · ${esc(sh.title)}</div>` : ''}`;
  }
  if (i.kind === 'img') {
    const art = typeof AGENT_ART !== 'undefined' ? null : null;
    return `<div class="kb-img"><div class="kb-imgph">${IC.drawing || IC.doc}<span>${esc(i.title)}</span><span class="sub">Photograph · the prototype does not ship the image file</span></div></div>`;
  }
  if (i.kind === 'xls' && i.rows) {
    return `<div class="tw"><table class="t"><thead><tr>${i.rows[0].map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${i.rows.slice(1).map(r => `<tr>${r.map((c, n) => `<td class="${n ? 'num mono' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  if (i.kind === 'rec') {
    return `<div class="paper kb-paper"><dl class="kv">${Object.entries(i.meta || {}).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(String(v))}</dd>`).join('')}</dl><p>${esc(i.text)}</p></div>`;
  }
  const paras = (i.text || '').split(/(?<=\.)\s+(?=[A-Z])/).reduce((a, s, n) => { const g = Math.floor(n / 3); (a[g] = a[g] || []).push(s); return a; }, []);
  return `<div class="paper kb-paper">${paras.map(p => `<p>${esc(p.join(' '))}</p>`).join('')}</div>`;
}
function kbInsights(i) {
  const ex = kbExtract(i.text + ' ' + Object.values(i.meta || {}).join(' '));
  if (!ex.length) return '<p class="sub">Nothing to extract from this item.</p>';
  return `<div class="kb-ins">${ex.map(g => `<div class="kb-insg"><span class="eyebrow">${esc(g.k)}</span><div class="kb-insv">${g.vals.slice(0, 6).map(v => `<span title="${esc(kbEvidence(i.text, v.v) || '')}">${esc(v.v)}</span>`).join('')}</div></div>`).join('')}</div>`;
}
/* What the assistant can answer, computed from this item rather than scripted. */
function kbSummary(i) {
  const ex = kbExtract(i.text);
  const facts = ex.slice(0, 5).map(g => `${g.k.toLowerCase()} ${g.vals.slice(0, 3).map(v => v.v).join(', ')}`);
  const first = (i.text || '').split(/(?<=\.)\s+/)[0] || i.title;
  return `<p>${esc(first)}</p>${facts.length ? `<p>It records ${facts.map(f => esc(f)).join('; ')}.</p>` : ''}<p class="sub">Read from ${esc(i.cls)}${i.src ? ' · ' + esc(i.src) : ''}${i.date ? ' · ' + kbDate(i.date) : ''}.</p>`;
}
function kbAnswer(i, q) {
  const ql = (q || '').toLowerCase(), push = (a, note) => S.kb.msgs.push({ a, note });
  if (/summar|what is this|about|overview|tell me about/.test(ql)) return push(kbSummary(i), 'Summarised from the item');
  if (/spec|parameter|figure|number|extract|key info|detail/.test(ql)) {
    const ex = kbExtract(i.text);
    return push(ex.length ? `<p>Everything I can read as a specification in this item:</p>${kbInsights(i)}` : '<p>I cannot read any specification figures in this item.</p>', `${ex.reduce((a, g) => a + g.vals.length, 0)} values found`);
  }
  if (/flow|mld|capacity|size/.test(ql)) {
    const f = kbExtract(i.text).find(g => g.k === 'Design flow');
    return push(f ? `<p>The design flow given is <b>${esc(f.vals.map(v => v.v).join(', '))}</b>.</p><p class="sub">${esc(kbEvidence(i.text, f.vals[0].v))}</p>` : '<p>No design flow is stated in this item.</p>', 'From the item text');
  }
  if (/effluent|bod|cod|tss|quality|consent|limit/.test(ql)) {
    const f = kbExtract(i.text).find(g => g.k === 'Water quality');
    return push(f ? `<p>The quality figures stated are <b>${esc(f.vals.map(v => v.v).join(', '))}</b>.</p><p class="sub">${esc(kbEvidence(i.text, f.vals[0].v))}</p>` : '<p>No effluent limits are stated in this item.</p>', 'From the item text');
  }
  if (/energy|power|kwh/.test(ql)) {
    const f = kbExtract(i.text).find(g => g.k === 'Energy');
    return push(f ? `<p>Specific energy consumption: <b>${esc(f.vals.map(v => v.v).join(', '))}</b>.</p><p class="sub">${esc(kbEvidence(i.text, f.vals[0].v))}</p>` : '<p>No energy figure is stated in this item.</p>', 'From the item text');
  }
  if (/why.*(lost|lose)|loss|reason/.test(ql) && i.type === 'bid' && i.outcome === 'Lost') {
    const L = kbLoss(i);
    return push(`<p>On the evidence in the library:</p><ul>${L.factors.map(f => `<li><b>${esc(f.k)}</b>${f.hard ? ' — decisive' : f.w ? ` — ${f.w}%` : ' — ruled out'}. ${esc(f.why)}</li>`).join('')}</ul>`, `${L.docs.length} related documents`);
  }
  if (/related|other|similar|link/.test(ql)) {
    const rel = kbRelated(i);
    return push(rel.length ? `<p>Related items in the library:</p><ul>${rel.map(r => `<li><b>${esc(r.title)}</b> · ${esc(r.cls)}</li>`).join('')}</ul>` : '<p>Nothing else in the library references this.</p>', `${rel.length} items`);
  }
  /* otherwise: find the sentences that actually answer it */
  const terms = ql.split(/\W+/).filter(w => w.length > 3);
  const sents = (i.text || '').split(/(?<=\.)\s+/).map(s => ({ s, n: terms.filter(t => s.toLowerCase().includes(t)).length })).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 3);
  if (sents.length) return push(`<p>From this item:</p>${sents.map(x => `<p>${esc(x.s)}</p>`).join('')}`, 'Matched in the item text');
  const elsewhere = kbFind(terms.join(' '), {}).filter(x => x.id !== i.id).slice(0, 4);
  return push(elsewhere.length
    ? `<p>Nothing in this item answers that. Elsewhere in the library:</p><ul>${elsewhere.map(x => `<li><b>${esc(x.title)}</b> · ${esc(x.cls)}</li>`).join('')}</ul>`
    : '<p>I cannot find anything on that, here or elsewhere in the library.</p>', 'Searched the whole library');
}
function kbRelated(i) {
  const all = kbAll();
  return all.filter(x => x.id !== i.id && (
    (i.bid && x.bid === i.bid) || (i.ref && x.bid === i.ref) || (x.ref && i.bid === x.ref) ||
    (i.tags || []).some(t => t.length > 4 && (x.tags || []).includes(t))
  )).slice(0, 6);
}
function kbAsk(q) {
  const K = S.kb; if (!K || K.busy || !q) return;
  const i = kbItem(K.doc); if (!i) return;
  K.msgs.push({ u: q }); K.busy = true; K.step = 0; render();
  setTimeout(() => { K.step = 1; render(); }, 600);
  setTimeout(() => { K.step = 2; render(); }, 1200);
  setTimeout(() => { K.busy = false; K.step = 0; kbAnswer(i, q); render(); const el = document.getElementById('kbask'); if (el) el.focus(); }, 1800);
}
const KB_STEPS = [['searching', 'Reading the document'], ['solving', 'Pulling out the figures'], ['composing', 'Writing the answer']];
function kbPanel(i) {
  const K = S.kb, fx = (kind, opts, cls, id) => `<span class="${cls}" data-fx="${kind}" data-fxid="${id}" data-fxo='${JSON.stringify(opts)}' aria-hidden="true"></span>`;
  const orb = (state, size, id) => fx('orb', { state, size }, 'lv-orb lv-orb' + size, 'kb-' + id);
  const step = K.step || 0;
  const sugg = i.type === 'bid' && i.outcome === 'Lost' ? ['Why did we lose this?', 'What should we do differently?', 'Show the related documents']
    : i.kind === 'dwg' ? ['What are the key specifications?', 'What is the design flow?', 'Summarise this drawing']
      : ['Summarise this', 'What are the key specifications?', 'What related items are there?'];
  return `<aside class="kb-ai" aria-label="Assistant for this document">
   <div class="kb-aih">${orb(K.busy ? KB_STEPS[step][0] : 'breathing', 32, 'head')}<div class="stack" style="gap:2px"><b>Assistant</b><span class="sub">${K.busy ? esc(KB_STEPS[step][1]) + '…' : S.ui.kbVoice ? 'Listening' : 'Reads this item only'}</span></div>${K.msgs.length ? `<button class="ibtn" data-a="kbclearchat" aria-label="Clear">${IC.trash}</button>` : ''}</div>
   <div class="kb-aib" id="kbaib">
    <div class="kb-sec"><span class="eyebrow">What this is</span><div class="kb-meta2">${Object.entries(i.meta || {}).slice(0, 6).map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(String(v))}</b></div>`).join('')}</div></div>
    <div class="kb-sec"><span class="eyebrow">Extracted</span>${kbInsights(i)}</div>
    ${i.type === 'bid' && i.outcome === 'Lost' ? `<div class="kb-sec"><span class="eyebrow">Why it was lost</span>${kbLossBody(i)}</div>` : ''}
    ${K.msgs.map(m => m.u ? `<div class="kb-u">${esc(m.u)}</div>` : `<div class="kb-a">${m.a}${m.note ? `<span class="kb-note">${esc(m.note)}</span>` : ''}</div>`).join('')}
    ${K.busy ? `<div class="kb-a kb-think">${orb(KB_STEPS[step][0], 32, 'think')}<div class="stack" style="gap:4px">${KB_STEPS.map((s, n) => `<span class="kb-step ${n === step ? 'on' : n < step ? 'done' : ''}">${n < step ? IC.check : ''}${esc(s[1])}</span>`).join('')}</div></div>` : ''}
   </div>
   <div class="kb-aif">
    <div class="kb-sugg">${sugg.map(s => `<button data-a="kbsugg" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    <form class="kb-askf" id="kbaskf"><input id="kbask" placeholder="Ask about this document…" aria-label="Ask about this document" autocomplete="off" ${K.busy ? 'disabled' : ''}>
     <button type="button" class="ibtn ${S.ui.kbVoice ? 'on' : ''}" data-a="kbvoice" aria-label="Ask by voice">${IC.chat}</button>
     <button type="submit" class="kb-go" aria-label="Send" ${K.busy ? 'disabled' : ''}>${IC.up || '↑'}</button></form>
   </div></aside>`;
}
function kbLossBody(i) {
  const L = kbLoss(i);
  return `<div class="kb-bars">${L.factors.map(f => `<div class="kb-bar"><div class="row between"><span>${esc(f.k)}</span><span class="mono sub">${f.hard ? 'decisive' : f.w === 0 ? 'ruled out' : f.w + '%'}</span></div><div class="kb-track"><i style="width:${Math.max(3, f.w)}%;background:${f.hard ? 'var(--bad)' : f.w === 0 ? 'var(--ok)' : 'var(--brand)'}"></i></div><span class="sub">${esc(f.why)}</span>${f.ev ? `<span class="kb-ev">“${esc(String(f.ev).slice(0, 180))}”</span>` : ''}</div>`).join('')}</div>
   ${L.actions.length ? `<div style="margin-top:10px"><span class="eyebrow">Do differently</span><ul class="kb-acts">${L.actions.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}`;
}
function kbCanvas() {
  const i = kbItem(S.kb.doc);
  if (!i) { S.kb.doc = null; return vKB(); }
  const rel = kbRelated(i);
  return `<div class="kb-canvas">
   <div class="kb-doc">
    <div class="row between" style="align-items:flex-start;margin-bottom:12px"><div class="stack" style="gap:6px">
      <div class="row" style="gap:6px"><button class="btn sm" data-a="kbback">${IC.back}Knowledge library</button>${kbTypeChip(i)}${i.st === 'proposed' ? '<span class="chip ai">Proposed</span>' : ''}</div>
      <h1 style="font-size:24px;margin:0">${esc(i.title)}</h1>
      <div class="meta"><span>${esc(i.cls)}</span>${i.src ? `<span>Source <b>${esc(i.src)}</b></span>` : ''}${i.date ? `<span>${kbDate(i.date)}</span>` : ''}${i.ref ? `<span class="mono">${esc(i.ref)}</span>` : ''}</div></div>
     ${i.st === 'proposed' ? `<div class="row"><button class="btn sm ok" data-a="kbaccept" data-id="${i.id}">${IC.check}Accept</button><button class="btn sm" data-a="kbreject" data-id="${i.id}">Reject</button></div>` : ''}</div>
    ${kbViewer(i)}
    ${rel.length ? `<div class="panel" style="margin-top:14px"><div class="ph"><h3>Related in the library</h3></div><div class="pb flush">${rel.map(r => `<button class="kb-row" data-a="kbopen" data-id="${r.id}"><span class="kb-main"><span class="kb-t">${esc(r.title)}</span><span class="kb-s">${esc(kbSnippet(r, ''))}</span></span><span class="kb-meta">${kbTypeChip(r)}</span></button>`).join('')}</div></div>` : ''}
   </div>
   ${kbPanel(i)}</div>`;
}

/* ---------------- upload, analysed then reviewed ----------------
   The AI proposes a class, a discipline and the figures it can read. The item
   lands as Proposed, so nothing enters the library as fact without a person. */
Object.assign(ACT, {
  kbopen: d => { if (!S.kb) S.kb = kbState(); S.kb.doc = d.id; S.kb.msgs = []; S.kb.v = { page: 1, zoom: 100 }; S.view = 'kb'; S.scrollTop = true; },
  kbback: () => { S.kb.doc = null; S.kb.msgs = []; S.scrollTop = true; },
  kbclear: () => { S.kb.q = ''; },
  kbtab: d => { S.kb.tab = d.v; S.kb.q = ''; S.scrollTop = true; },
  /* the attention line searches rather than adding another filter control */
  /* Intake: dropped or picked files are read, classified and reviewed in the page.
     Nothing enters the library until a person accepts the classification. */
  kbupload: () => { const f = document.getElementById('kbfilein'); if (f) f.click(); return 'skip'; },
  kbpaste: () => { S.kb.paste = !S.kb.paste; },
  kbpastego: () => {
    const ta = document.getElementById('kbpastebox'), t = ta ? ta.value.trim() : '';
    if (!t) { toast('Paste the text first.'); return 'skip'; }
    S.kb.paste = false;
    kbIntake([{ name: (t.split('\n')[0] || 'Pasted text').slice(0, 70), kind: 'pdf', text: t }]);
  },
  kbtraycat: d => { const it = (S.kb.intake || []).find(x => x.id === d.id); if (it) it.cat = d.v; },
  kbaccept: d => {
    const it = (S.kb.intake || []).find(x => x.id === d.id);
    if (!it || it.state !== 'ready') return 'skip';
    const id = 'K-U' + String((S.kbAdded || []).length + 1).padStart(2, '0');
    if (it.file) { try { IDB.put(id, it.file); FILES[id] = it.file; } catch (e) { } }
    const today = new Date().toISOString().slice(0, 10);
    (S.kbAdded = S.kbAdded || []).push({
      id, title: it.name.replace(/\.[a-z0-9]+$/i, ''), type: 'document', kind: it.kind,
      cls: it.cls, cat: it.cat, disc: it.disc, date: today, added: today, src: R().name,
      tags: ['uploaded', (it.cls || '').toLowerCase()], st: 'accepted',
      text: it.text, fname: it.fname, pdfPages: it.pdfPages,
      meta: { Class: it.cls, Category: it.cat, ...(it.fname ? { File: it.fname } : {}), ...(it.pdfPages ? { Pages: it.pdfPages } : {}), 'Added by': R().name, Added: kbDate(today) }
    });
    S.kb.intake = S.kb.intake.filter(x => x.id !== it.id);
    kbBust(); log('Added to the knowledge library', `${it.name} · ${it.cls}`);
    toast(`${it.name} filed under ${it.cat}.`);
  },
  kbreject: d => {
    const it = (S.kb.intake || []).find(x => x.id === d.id);
    if (it) { S.kb.intake = S.kb.intake.filter(x => x.id !== it.id); log('Rejected an intake item', it.name); toast(`${it.name} discarded.`); return; }
    S.kbAdded = (S.kbAdded || []).filter(x => x.id !== d.id);
    kbBust(); S.kb.doc = null; log('Removed from the knowledge library', d.id); toast('Removed from the library.');
  },
  kbsugg: d => kbAsk(d.q),
  kbclearchat: () => { S.kb.msgs = []; },
  kbvoice: () => {
    if (S.ui.kbVoice) { S.ui.kbVoice = false; return; }
    S.ui.kbVoice = true; render();
    const done = q => { S.ui.kbVoice = false; kbAsk(q); };
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setTimeout(() => done('Summarise this'), 1400); return 'skip'; }
    try {
      const r = new SR(); r.lang = 'en-IN'; r.interimResults = false; r.continuous = false;
      r.onresult = e => done(e.results[0][0].transcript);
      r.onerror = () => { S.ui.kbVoice = false; toast('The microphone is blocked in this frame. Type the question instead.'); render(); };
      r.onend = () => { if (S.ui.kbVoice) { S.ui.kbVoice = false; render(); } };
      r.start();
    } catch (e) { setTimeout(() => done('Summarise this'), 1400); }
    return 'skip';
  }
});

document.addEventListener('submit', e => {
  if (e.target.id !== 'kbaskf') return; e.preventDefault();
  const el = document.getElementById('kbask'), q = el ? el.value.trim() : '';
  if (q) { el.value = ''; kbAsk(q); }
});
document.addEventListener('input', e => {
  if (e.target.id !== 'kbq') return;
  if (!S.kb) S.kb = kbState();
  S.kb.q = e.target.value;
  const at = e.target.selectionStart; render();
  const n = document.getElementById('kbq'); if (n) { n.focus(); try { n.setSelectionRange(at, at); } catch (x) { } }
});
/* the library's own modal rides on the shared overlay layer */
const _kbOverlays = overlays;
overlays = function () { return _kbOverlays(); };

/* The library has its own assistant for the item on screen. The floating tender dock
   would sit on top of it offering to answer about a tender that is not in view, so it
   stands down while the library is open. */
const _kbAiDock = aiDock;
aiDock = function () { return S.view === 'kb' ? '' : _kbAiDock(); };

/* ---------------- document preview ----------------
   A real viewer: page rail, page navigation, zoom and download. An uploaded PDF is
   rendered by pdf.js from the stored file; everything else is laid out as pages. */
const kbV = () => (S.kb.v = S.kb.v || { page: 1, zoom: 100 });
const KB_PPW = 560;   /* words a laid-out page holds before it breaks */

function kbPages(i) {
  if (i.pdfPages) return Array.from({ length: i.pdfPages }, (_, n) => ({ n: n + 1, pdf: true }));
  if (i.kind === 'dwg') return [{ n: 1, dwg: true }];
  if (i.kind === 'img') return [{ n: 1, img: true }];
  if (i.kind === 'xls' && i.rows) return [{ n: 1, rows: i.rows }];
  const sents = (i.text || '').split(/(?<=\.)\s+(?=[A-Z0-9])/).filter(Boolean);
  const pages = []; let cur = [], words = 0;
  sents.forEach(s => {
    const w = s.split(/\s+/).length;
    if (words + w > (pages.length ? 150 : 95) && cur.length) { pages.push({ n: pages.length + 1, paras: cur }); cur = []; words = 0; }
    cur.push(s); words += w;
  });
  if (cur.length || !pages.length) pages.push({ n: pages.length + 1, paras: cur });
  if (i.kind === 'rec') pages[0].fields = i.meta;
  return pages;
}
function kbPaper(i, pg, pages) {
  const head = pg.n === 1 ? `<div class="kbp-head">
    <div class="kbp-brand"><b>NARMADA WATERWORKS EPC</b><span>${esc((i.disc || '').toUpperCase())}</span></div>
    <h1>${esc(i.title)}</h1>
    <p class="kbp-sub">${esc(i.cls)}${i.src ? ' · ' + esc(i.src) : ''}${i.date ? ' · ' + kbDate(i.date) : ''}</p></div>` : '';
  let body = '';
  if (pg.rows) body = `<table class="kbp-t"><thead><tr>${pg.rows[0].map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${pg.rows.slice(1).map(r => `<tr>${r.map((c, n) => `<td class="${n ? 'num' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  else if (pg.img) body = `<div class="kbp-fig">${IC.drawing || IC.doc}<span>${esc(i.title)}</span><small>Photograph · the prototype ships the record, not the image file</small></div>`;
  else {
    if (pg.fields) body += `<table class="kbp-t kbp-kv"><tbody>${Object.entries(pg.fields).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(String(v))}</td></tr>`).join('')}</tbody></table>`;
    body += (pg.paras || []).map(p => `<p>${esc(p)}</p>`).join('');
  }
  return `<div class="kbp-page">${head}${body}<div class="kbp-foot"><span>${esc(i.ref || i.id)}</span><span>Page ${pg.n} of ${pages.length}</span></div></div>`;
}
function kbViewer(i) {
  const V = kbV(), pages = kbPages(i), pg = pages[Math.min(V.page, pages.length) - 1] || pages[0];
  const z = V.zoom / 100;
  const rail = pages.length > 1 ? `<div class="kbv-rail" aria-label="Pages">${pages.map(p => `<button class="${p.n === pg.n ? 'on' : ''}" data-a="kbpage" data-p="${p.n}" aria-label="Page ${p.n}"><span class="kbv-th">${p.n === 1 ? `<i></i><i class="w"></i><i class="w"></i>` : `<i class="w"></i><i class="w"></i><i class="w"></i>`}</span><small>${p.n}</small></button>`).join('')}</div>` : '';
  const stage = pg.dwg && typeof drawSheet === 'function'
    ? `<div class="kbp-page kbp-wide">${drawSheet(i.sheet || 'P-001')}</div>`
    : pg.pdf ? `<canvas id="kbpdfc" class="kbp-canvas" aria-label="Page ${pg.n}"></canvas>`
      : kbPaper(i, pg, pages);
  return `<div class="kbv">
   <div class="kbv-bar">
    <button class="ibtn" data-a="kbpage" data-p="${Math.max(1, pg.n - 1)}" ${pg.n > 1 ? '' : 'disabled'} aria-label="Previous page">${IC.back}</button>
    <span class="kbv-pg">${pg.n} <small>/ ${pages.length}</small></span>
    <button class="ibtn" data-a="kbpage" data-p="${Math.min(pages.length, pg.n + 1)}" ${pg.n < pages.length ? '' : 'disabled'} aria-label="Next page">${IC.next}</button>
    <span class="kbv-sep"></span>
    <button class="ibtn" data-a="kbzoom" data-v="-10" ${V.zoom > 50 ? '' : 'disabled'} aria-label="Zoom out">${IC.zout}</button>
    <span class="kbv-z">${V.zoom}%</span>
    <button class="ibtn" data-a="kbzoom" data-v="10" ${V.zoom < 200 ? '' : 'disabled'} aria-label="Zoom in">${IC.zin}</button>
    <button class="btn sm" data-a="kbzoom" data-v="fit">Fit</button>
    <span style="margin-left:auto"></span>
    <button class="btn sm" data-a="kbdl" data-id="${i.id}">${IC.dl}Download</button>
   </div>
   <div class="kbv-body">${rail}<div class="kbv-stage"><div class="kbv-zoom" style="--kbz:${z}">${stage}</div></div></div></div>`;
}
/* an uploaded PDF really is rendered, from the file kept in the browser's store */
let kbPdfTok = 0;
async function kbRenderPdf() {
  const cvs = document.getElementById('kbpdfc'); if (!cvs || !S.kb || !S.kb.doc) return;
  const tok = ++kbPdfTok, i = kbItem(S.kb.doc); if (!i) return;
  try {
    const pdf = await loadPdf(i.id), V = kbV(), p = Math.min(V.page || 1, pdf.numPages), pg = await pdf.getPage(p);
    if (tok !== kbPdfTok) return;
    const wrap = cvs.parentElement, fit = Math.max(240, (wrap ? wrap.clientWidth : 700) - 8) / pg.getViewport({ scale: 1 }).width;
    const vp = pg.getViewport({ scale: fit * (V.zoom / 100) }), ratio = window.devicePixelRatio || 1;
    cvs.width = vp.width * ratio; cvs.height = vp.height * ratio;
    cvs.style.width = vp.width + 'px'; cvs.style.height = vp.height + 'px';
    await pg.render({ canvasContext: cvs.getContext('2d'), viewport: vp, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : null }).promise;
  } catch (e) {
    if (tok !== kbPdfTok) return;
    const c = document.getElementById('kbpdfc'); if (!c) return;
    c.replaceWith(Object.assign(document.createElement('div'), { className: 'kbp-page', innerHTML: `<p class="sub">This page could not be rendered: ${esc(e.message)}. The text the assistant reads was taken on upload and is still available.</p>` }));
  }
}
Object.assign(ACT, {
  kbpage: d => { kbV().page = +d.p; },
  kbzoom: d => { const V = kbV(); V.zoom = d.v === 'fit' ? 100 : Math.max(50, Math.min(200, V.zoom + (+d.v))); },
  kbdl: async d => {
    const i = kbItem(d.id); if (!i) return 'skip';
    let blob = null, name = i.title.replace(/[^\w .-]/g, '') || 'document';
    try { blob = await IDB.get(i.id); } catch (e) { }
    if (blob) name = i.fname || name;
    else { blob = new Blob([`${i.title}\n${'='.repeat(i.title.length)}\n\n${i.cls}${i.src ? ' · ' + i.src : ''}${i.date ? ' · ' + kbDate(i.date) : ''}\n\n${Object.entries(i.meta || {}).map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${i.text || ''}\n`], { type: 'text/plain' }); name += '.txt'; }
    const u = URL.createObjectURL(blob), a = Object.assign(document.createElement('a'), { href: u, download: name });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
    log('Downloaded from the knowledge library', i.title);
    return 'skip';
  }
});
/* the canvas only exists after a render, so the page is painted on the way out */
const _kbRender = render;
render = function () { _kbRender(); if (document.getElementById('kbpdfc')) kbRenderPdf(); };

/* ---------------- intake: drop, read, classify, review ----------------
   Files go straight onto the page. Each is read for real — a PDF through pdf.js,
   text files as text — then classified and measured, and waits for a person. */
const KB_STATES = [['searching', 'Reading the file'], ['shaping', 'Working out what it is'], ['weaving', 'Pulling out the figures']];
function kbIntake(list) {
  if (!S.kb) S.kb = kbState();
  S.kb.intake = S.kb.intake || [];
  list.forEach(f => S.kb.intake.push({
    id: 'in' + Math.random().toString(36).slice(2, 8),
    name: f.name, fname: f.file ? f.file.name : null, file: f.file || null,
    kind: f.kind || (f.file ? KB_KIND(f.file.name) : 'pdf'),
    text: f.text || null, state: 'queued', step: 0
  }));
  S.kb.doc = null; S.scrollTop = true; render(); kbIntakeNext();
}
let kbBusyIntake = false;
async function kbIntakeNext() {
  if (kbBusyIntake) return;
  const it = (S.kb.intake || []).find(x => x.state === 'queued');
  if (!it) return;
  kbBusyIntake = true; it.state = 'reading'; it.step = 0; render();
  const tick = (ms, step) => new Promise(r => setTimeout(() => { it.step = step; render(); r(); }, ms));
  try {
    await tick(550, 0);
    if (!it.text && it.file) it.text = await kbReadFile(it);
    await tick(600, 1);
    const c = kbClassify(it.name + ' ' + (it.fname || ''), it.text || '');
    it.cls = c.cls; it.disc = c.disc; it.cat = c.disc; it.why = c.why;
    it.ex = kbExtract(it.text || '');
    it.values = it.ex.reduce((a, g) => a + g.vals.length, 0);
    await tick(500, 2);
    if (!it.text) it.note = 'No text could be read from this file, so it is filed on its name alone.';
    it.state = 'ready';
  } catch (e) { it.state = 'ready'; it.cls = 'Document'; it.cat = it.disc = 'General'; it.ex = []; it.values = 0; it.note = 'Could not be read: ' + e.message; }
  kbBusyIntake = false; render(); kbIntakeNext();
}
async function kbReadFile(it) {
  const f = it.file; if (!f) return '';
  if (/\.(txt|md|csv)$/i.test(f.name)) return await f.text();
  if (it.kind !== 'pdf') return '';
  const key = 'kbin:' + it.id;
  try {
    await IDB.put(key, f); FILES[key] = f;
    const pdf = await loadPdf(key);
    it.pdfPages = pdf.numPages;
    let txt = '';
    for (let p = 1; p <= Math.min(pdf.numPages, 12); p++) txt += (await pageText(key, p)) + '\n';
    return txt.trim();
  } finally { delete PDFS['kbin:' + it.id]; delete FILES[key]; }
}
const KB_CATS = ['Corporate', 'Credentials', 'Drawings', 'E&I', 'Engineering', 'O&M', 'Process', 'Proposals', 'Quantities', 'Reports', 'General'];
const kbFx = (kind, opts, cls, id) => { const f = kind === 'orb' ? orbFit(opts, cls) : { opts, cls, style: '' };
  return `<span class="${f.cls}" style="${f.style}" data-fx="${kind}" data-fxid="${id}" data-fxo='${JSON.stringify(f.opts)}' aria-hidden="true"></span>`; };
/* the AI says what it thinks the document is and where it belongs, in a sentence */
function kbSuggest(it) {
  const known = it.cls && it.cls !== 'Document';
  const head = known
    ? `This looks like a <b>${esc(it.cls.toLowerCase())}</b>. I'd file it under <b>${esc(it.cat)}</b>.`
    : `I can't tell what kind of document this is. I'd file it under <b>${esc(it.cat)}</b> until someone says otherwise.`;
  const why = [];
  if (known && it.why) why.push(`it reads “${esc(it.why)}”`);
  if (it.pdfPages) why.push(`${it.pdfPages} page${it.pdfPages > 1 ? 's' : ''} read`);
  if (it.values) why.push(`${it.values} figure${it.values > 1 ? 's' : ''} pulled out`);
  return `<p class="kb-sug">${head}</p>${why.length ? `<p class="kb-why">Because ${why.join(', ')}.</p>` : ''}`;
}
function kbTray() {
  const tray = (S.kb.intake || []);
  if (!tray.length && !S.kb.paste) return '';
  const card = it => {
    if (it.state !== 'ready') {
      const step = it.step || 0;
      return `<div class="kb-in kb-work">${kbFx('beam', { size: 'md', strength: 1, active: true }, 'fx-host', 'in-' + it.id)}
       <div class="kb-workb">
        ${kbFx('orb', { state: KB_STATES[step][0], size: 32 }, 'lv-orb lv-orb32', 'orb-' + it.id)}
        <div class="stack" style="gap:8px;min-width:0;flex:1">
         <b>${esc(it.name)}</b>
         <div class="kb-steps">${KB_STATES.map((st2, n) => `<span class="kb-stp ${n === step ? 'on' : n < step ? 'done' : ''}">${aiMark(n < step ? 'done' : n === step ? 'now' : '')}${esc(st2[1])}</span>`).join('')}</div>
        </div></div></div>`;
    }
    return `<div class="kb-in ready">
      <div class="kb-inh">${kbFx('orb', { state: 'breathing', size: 32 }, 'lv-orb lv-orb32', 'orb-' + it.id)}
       <div class="stack" style="gap:5px;min-width:0;flex:1"><b>${esc(it.name)}</b>${kbSuggest(it)}</div></div>
      ${it.ex && it.ex.length ? `<div class="kb-inx">${it.ex.slice(0, 6).map(g => `<div><span class="eyebrow">${esc(g.k)}</span><div class="kb-insv">${g.vals.slice(0, 4).map(v => `<span>${esc(v.v)}</span>`).join('')}</div></div>`).join('')}</div>` : ''}
      ${it.note ? `<div class="kb-innote">${esc(it.note)}</div>` : ''}
      <div class="kb-ina"><label class="kb-insel" for="cat-${it.id}"><span>File under</span><select id="cat-${it.id}" data-c="kbtraycat" data-id="${it.id}">${KB_CATS.map(c => `<option ${c === it.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
       <span class="kb-inspace"></span>
       <button class="btn sm ok" data-a="kbaccept" data-id="${it.id}">${IC.check}Add to library</button>
       <button class="btn sm" data-a="kbreject" data-id="${it.id}">Discard</button></div></div>`;
  };
  return `<div class="kb-tray">
   ${S.kb.paste ? `<div class="kb-in"><label class="fld" for="kbpastebox">Paste the text<textarea id="kbpastebox" style="min-height:110px" placeholder="Paste a specification, a datasheet or a letter…"></textarea></label><div class="row" style="gap:8px"><button class="btn sm pri" data-a="kbpastego">${IC.spark}Analyse</button><button class="btn sm" data-a="kbpaste">Cancel</button></div></div>` : ''}
   ${tray.map(card).join('')}</div>`;
}
/* The drop target is visible before anyone drags anything, and whatever lands
   is read in place — the intake never moves off down the page. */
function kbDropBar() {
  const tray = (S.kb.intake || []), open = tray.length || S.kb.paste;
  return `<div class="kb-zone ${open ? 'is-open' : ''}">
   <button class="kb-dropbar" data-a="kbupload">
    <span class="kb-dbi">${IC.up}</span>
    <span class="stack" style="gap:2px;align-items:flex-start;min-width:0"><b>Drag documents here, or click to browse</b>
     <span class="sub">Drawings, datasheets, proposals, reports. Each one is read and classified, and you decide where it goes.</span></span>
    ${tray.length ? `<span class="kb-zc">${tray.length} in intake</span>` : ''}</button>
   ${open ? kbTray() : ''}</div>`;
}
/* dropping anywhere on the library picks the files up */
document.addEventListener('dragover', e => {
  if (S.view !== 'kb' || !S.kb || S.kb.doc) return;
  if (!(e.dataTransfer && [...e.dataTransfer.types].includes('Files'))) return;
  e.preventDefault();
  if (!S.kb.drag) { S.kb.drag = true; render(); }
});
document.addEventListener('dragleave', e => {
  if (!S.kb || !S.kb.drag) return;
  if (e.relatedTarget && document.documentElement.contains(e.relatedTarget)) return;
  S.kb.drag = false; render();
});
document.addEventListener('drop', e => {
  if (S.view !== 'kb' || !S.kb || S.kb.doc) return;
  const files = e.dataTransfer && e.dataTransfer.files;
  if (!files || !files.length) return;
  e.preventDefault(); S.kb.drag = false;
  kbIntake([...files].slice(0, 8).map(f => ({ name: f.name, file: f, kind: KB_KIND(f.name) })));
});
document.addEventListener('change', e => {
  if (e.target.dataset && e.target.dataset.c === 'kbtraycat') {
    const it = (S.kb.intake || []).find(x => x.id === e.target.dataset.id);
    if (it) it.cat = e.target.value;
    return;
  }
  if (e.target.id !== 'kbfilein') return;
  const files = [...(e.target.files || [])];
  e.target.value = '';
  if (files.length) kbIntake(files.slice(0, 8).map(f => ({ name: f.name, file: f, kind: KB_KIND(f.name) })));
});
