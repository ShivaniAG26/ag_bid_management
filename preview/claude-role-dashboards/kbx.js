/* ============================================================================
   Knowledge Library — a file manager over connected storage.
   ----------------------------------------------------------------------------
   An EPC team's documents already live in SharePoint, OneDrive, Aconex or a
   shared drive. So this is a file manager first: a tree of the places files
   live, a list with the operations a file manager has (open, lock, share,
   download, rename, delete), and an assistant that answers from the contents.

   Indexing is machinery, not a page: it sits in one small indicator that
   opens when you want it.

   Everything is prefixed kx / KX_ — the app loads classic scripts, and one
   duplicate top-level const kills a whole file.
   ========================================================================== */

const kxFx = (kind, opts, cls, id) => { const f = kind === 'orb' ? orbFit(opts, cls) : { opts, cls, style: '' };
  return `<span class="${f.cls || 'fx-host'}" style="${f.style}" data-fx="${kind}" data-fxid="${id}" data-fxo='${JSON.stringify(f.opts)}' aria-hidden="true"></span>`; };

/* ---------------- where files live ---------------- */
const KX_SRC = {
  local: { n: 'This device', sub: 'Uploaded by hand' },
  sharepoint: { n: 'SharePoint', sub: 'Narmada Waterworks EPC' },
  onedrive: { n: 'OneDrive', sub: 'Personal uploads' },
  gdrive: { n: 'Google Drive', sub: 'Shared drives' },
  box: { n: 'Box', sub: 'Enterprise governance' },
  dropbox: { n: 'Dropbox', sub: 'Consultants and suppliers' },
  aconex: { n: 'Oracle Aconex', sub: 'Document control' },
  projectwise: { n: 'ProjectWise', sub: 'Engineering documents' }
};
const KX_STORAGE = ['sharepoint', 'onedrive', 'gdrive', 'box', 'dropbox', 'aconex', 'projectwise'];
const kxOn = k => k === 'local' || !!(integState()[k] || {}).on;
const kxConnected = () => KX_STORAGE.filter(kxOn);

/* ---------------- file kinds ---------------- */
const KX_KIND = {
  pdf: { l: 'PDF', c: '--danger-fg', ext: ['pdf'] },
  doc: { l: 'Document', c: '--info-fg', ext: ['docx', 'doc', 'odt', 'rtf'] },
  xls: { l: 'Spreadsheet', c: '--success-fg', ext: ['xlsx', 'xls', 'csv', 'ods'] },
  ppt: { l: 'Presentation', c: '--warning-fg', ext: ['pptx', 'ppt', 'key'] },
  dwg: { l: 'Drawing', c: '--ai-sky', ext: ['dwg', 'dxf', 'rvt', 'ifc', 'step'] },
  vid: { l: 'Video', c: '--ai-lav', ext: ['mp4', 'mov', 'avi', 'mkv', 'webm'] },
  aud: { l: 'Audio', c: '--ai-teal', ext: ['mp3', 'wav', 'm4a', 'aac', 'flac'] },
  img: { l: 'Image', c: '--ai-ochre', ext: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tif', 'svg', 'heic'] },
  zip: { l: 'Archive', c: '--text-muted', ext: ['zip', 'rar', '7z', 'tar', 'gz'] },
  txt: { l: 'Text', c: '--text-secondary', ext: ['txt', 'md', 'json', 'xml', 'log'] },
  file: { l: 'File', c: '--text-muted', ext: [] }
};
const KX_EXT2KIND = (() => { const m = {}; Object.entries(KX_KIND).forEach(([k, v]) => v.ext.forEach(e => m[e] = k)); return m; })();
const kxExt = n => (String(n).match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
const kxKind = n => KX_EXT2KIND[kxExt(n)] || 'file';
const kxIsMedia = f => f.kind === 'vid' || f.kind === 'aud';
const kxHasPreview = f => ['pdf', 'doc', 'xls', 'ppt', 'txt'].includes(f.kind);

/* ---------------- the corpus ---------------- */
function kxF(src, path, n, size, mod, by, idx, extra) {
  return Object.assign({ id: 'f' + (kxF._i = (kxF._i || 0) + 1), src, path, n, kind: kxKind(n), size, mod, by, idx: idx || 'done' }, extra || {});
}
const KX_FILES = [
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/01 Tender pack', 'RFP Volume I — Instructions to bidders.pdf', 4_180_000, 13, 'Kavya Menon', 'done',
    { pages: 86, text: 'Two-envelope evaluation. Technical envelope A and priced envelope B are opened separately. Bid security of ₹12.6 Cr by bank guarantee valid 180 days. Design flow 200 MLD average with a peak factor of 2.25. Hybrid annuity: 40% construction grant, 60% annuity over 15 years with O&M.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/01 Tender pack', 'RFP Volume II — Technical specifications.pdf', 11_400_000, 13, 'Kavya Menon', 'done',
    { pages: 243, text: 'Sequencing batch reactor process. Treated effluent BOD under 10 mg/l, TSS under 10 mg/l, total nitrogen under 10 mg/l. Retention time 6 hours. Four SBR basins plus one standby. Standard IS 4200 for sewerage works. The waste water pipeline from the collection network to the inlet works is a 1,600 mm MS trunk main.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/01 Tender pack', 'RFP Volume III — Bill of quantities.xlsx', 2_240_000, 13, 'Kavya Menon', 'done',
    { rows: 1840, text: 'Civil works, mechanical works, electrical and instrumentation, waste water pipeline 22 km, pumping stations 3 nos, O&M 15 years.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/01 Tender pack', 'Corrigendum 02 — extension and clarifications.pdf', 680_000, 6, 'Kavya Menon', 'done',
    { pages: 9, text: 'Submission extended to 05 December 2026. The 200 MLD design flow is the average dry weather flow, not the peak. Phase two to 300 MLD is outside this contract.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/02 Drawings', 'Site layout — Indrayani STP.dwg', 18_900_000, 12, 'Meera Shah', 'done',
    { layers: 46, text: 'Plant boundary, inlet chamber, screening, grit removal, SBR basins 1 to 4, sludge handling, administration block, access road.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/02 Drawings', 'P and ID — SBR train.dwg', 9_600_000, 12, 'Dev Nair', 'done',
    { layers: 31, text: 'Piping and instrumentation for one SBR train: influent valve, decanter, blower header, DO probe, sludge draw-off.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/02 Drawings', 'Waste water pipeline — alignment Ch 0 to 22 km.dxf', 24_300_000, 11, 'Rohit Bansal', 'done',
    { layers: 52, text: 'Alignment of the 22 km waste water pipeline with chainage, manhole locations, road crossings and three rising mains.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/02 Drawings', 'Drawing pack Rev C.zip', 86_400_000, 11, 'Rohit Bansal', 'done', { files: 34, text: 'All issued drawings at revision C.' }),

  /* the video the assistant is asked about */
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/03 Site and meetings', 'Waste water pipeline — route survey.mp4', 684_000_000, 8, 'Rohit Bansal', 'done',
    {
      secs: 2640, text: 'Drive-along survey of the 22 km waste water pipeline route, from the collection network to the inlet works.',
      marks: [
        { t: 118, q: 'This is chainage zero. The waste water pipeline starts at the existing collection chamber and runs north along the service road.' },
        { t: 640, q: 'Between chainage four and seven the pipeline crosses the canal. That is a jacking section, about ninety metres.' },
        { t: 1285, q: 'Here the alignment leaves the road reserve and runs through private land. Right of way is not acquired on this stretch yet.' },
        { t: 1870, q: 'The 1,600 mm MS main needs a thrust block at every bend. We have counted eleven on this route.' },
        { t: 2402, q: 'Last three kilometres into the plant. The pipeline drops two point four metres, so it is gravity from here.' }
      ]
    }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/03 Site and meetings', 'Pre-bid meeting — recording.mp4', 742_000_000, 9, 'Kavya Menon', 'done',
    {
      secs: 3420, text: 'Pre-bid meeting at the Indrayani Municipal Corporation office. Design flow, phasing, land and the annuity mechanism.',
      marks: [
        { t: 142, q: 'The design flow is 200 MLD average dry weather flow, with a peak factor of 2.25 on the inlet works.' },
        { t: 388, q: 'Phase two takes the plant to 300 MLD, but that is a separate procurement and is outside this contract.' },
        { t: 1104, q: 'Land for the sludge drying beds is still under acquisition. Possession is expected within four months of award.' },
        { t: 1960, q: 'The annuity is sixty per cent, paid half-yearly over fifteen years, linked to the effluent meeting the consent conditions.' },
        { t: 2715, q: 'Bidders should note the waste water pipeline is in our scope from the collection chamber, not from the ward network.' }
      ]
    }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/03 Site and meetings', 'Site walkthrough — existing works.mp4', 418_000_000, 10, 'Meera Shah', 'learning',
    {
      secs: 1860, text: 'Walkthrough of the existing inlet works and the land for the new plant.',
      marks: [
        { t: 96, q: 'This is the existing inlet chamber. It takes about 60 MLD today and it is already surcharging in the monsoon.' },
        { t: 735, q: 'The new SBR basins would sit on this parcel. It is level, which saves a lot of cut and fill.' },
        { t: 1402, q: 'The outfall goes to the river about 900 metres downstream of where we are standing.' }
      ]
    }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/03 Site and meetings', 'Site photographs — October 2026.zip', 212_000_000, 10, 'Meera Shah', 'done', { files: 148, text: 'Site photographs of the existing works, the land parcel and the outfall.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/03 Site and meetings', 'Existing inlet chamber.jpg', 6_800_000, 10, 'Meera Shah', 'done', { text: 'Photograph of the existing inlet chamber during the site visit.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/04 Estimate', 'Estimate build-up v4.xlsx', 3_900_000, 4, 'Arjun Rao', 'done',
    { rows: 2460, text: 'Direct cost, preliminaries, overheads and margin. Base price ₹842 Cr against an evaluated bid price of ₹1,260 Cr including O&M NPV.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/04 Estimate', 'Unit rates — civil works.csv', 410_000, 4, 'Arjun Rao', 'done',
    { rows: 620, text: 'Unit rates for excavation, RCC M30, shuttering, backfill and reinforcement, with the productivity each rate assumes.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/05 Proposal', 'Technical proposal — draft.docx', 7_100_000, 2, 'Kavya Menon', 'learning',
    { pages: 118, text: 'Our understanding of the works, process design basis, construction methodology, quality plan and O&M approach.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/05 Proposal', 'Compliance matrix.xlsx', 980_000, 2, 'Priya Das', 'queued', { rows: 412, text: 'Clause by clause compliance against Volume II.' }),
  kxF('sharepoint', 'Tenders/Indrayani 200 MLD STP/05 Proposal', 'Client presentation — technical.pptx', 24_600_000, 1, 'Kavya Menon', 'queued', { slides: 34, text: 'Technical presentation for the evaluation committee.' }),
  kxF('sharepoint', 'Past bids/Nashik 150 MLD WTP', 'Bid outcome letter.pdf', 420_000, 96, 'Sanjay Kulkarni', 'done',
    { pages: 3, text: 'Evaluated bid prices: Vishwa Aqua Infra ₹404.2 Cr (L1), Narmada Waterworks EPC ₹410.1 Cr (L2), Ganga Enviro JV ₹431.8 Cr (L3).' }),
  kxF('sharepoint', 'Past bids/Nashik 150 MLD WTP', 'Bid submission — as submitted.zip', 318_000_000, 98, 'Sanjay Kulkarni', 'done', { files: 62, text: 'The full submitted package for Nashik.' }),
  kxF('sharepoint', 'Past bids/Pimpri CETP', 'Lessons learned.docx', 340_000, 180, 'Vikram Patil', 'done',
    { pages: 11, text: 'We lost on O&M NPV. Our power figure assumed 0.42 kWh per cubic metre where the winner bid 0.36.' }),

  kxF('aconex', 'Projects/Ankleshwar CETP ZLD/Reports', 'Monthly progress report — September 2026.pdf', 8_200_000, 27, 'Rohit Bansal', 'done',
    { pages: 42, text: 'Civil 78% complete, mechanical erection 41%, RO skids delivered, commissioning planned for January.' }),
  kxF('aconex', 'Projects/Ankleshwar CETP ZLD/Commissioning', 'RO skid commissioning.mp4', 586_000_000, 21, 'Dev Nair', 'done',
    {
      secs: 2280, text: 'Commissioning of the reverse osmosis skids including the CIP sequence.',
      marks: [
        { t: 210, q: 'Feed conductivity is 4,200 microsiemens and we are holding 94 per cent recovery across the two stages.' },
        { t: 1330, q: 'The CIP sequence runs alkaline first, then citric. Thirty minutes each with a fifteen minute soak.' },
        { t: 1895, q: 'Permeate is at 180 microsiemens, which is inside the ZLD feed specification.' }
      ]
    }),
  kxF('aconex', 'Projects/Ankleshwar CETP ZLD/Commissioning', 'Client call — ZLD recovery target.mp3', 46_000_000, 19, 'Meera Shah', 'done',
    {
      secs: 1680, text: 'Call with the client on the recovery guarantee and brine handling.',
      marks: [
        { t: 305, q: 'The guarantee is ninety-five per cent recovery at design feed. We are measuring ninety-four today.' },
        { t: 980, q: 'If the feed TDS rises above six thousand the guarantee is renegotiated. That is clause 14.3.' }
      ]
    }),
  kxF('aconex', 'Projects/Ankleshwar CETP ZLD/Drawings', 'ZLD block flow — as built.dwg', 12_100_000, 24, 'Dev Nair', 'done', { layers: 28, text: 'As-built block flow for the zero liquid discharge train.' }),

  kxF('projectwise', 'Standards/Process', 'IS 4200 — Sewerage works.pdf', 5_600_000, 420, 'Library', 'done',
    { pages: 164, text: 'Indian Standard for sewerage works: design flows, peak factors, self-cleansing velocity 0.6 m/s for a waste water pipeline, manhole spacing and testing.' }),
  kxF('projectwise', 'Standards/Process', 'Design basis — SBR process.docx', 1_240_000, 310, 'Meera Shah', 'done',
    { pages: 38, text: 'Our standard SBR design basis: cycle time, decanter sizing, DO setpoints, sludge age and the aeration energy figure carried at bid stage, 0.38 kWh per cubic metre.' }),
  kxF('projectwise', 'Standards/CAD', 'CAD layer standard.dwg', 2_800_000, 365, 'Library', 'done', { layers: 64, text: 'The company drawing layer standard used for takeoff.' }),
  kxF('projectwise', 'Standards/Process', 'Process design handbook.pdf', 31_000_000, 500, 'Library', 'queued', { pages: 612, text: 'Internal process handbook covering screening through sludge handling.' })
];

/* ---------------- state ---------------- */
function kxS() {
  S.kx = S.kx || { q: '', folder: '', sel: null, view: 'list', msgs: [], busy: false, step: 0, play: null, t: 0, open: { sharepoint: 1 }, locks: {}, added: [], menu: null };
  return S.kx;
}
const kxFiles = () => KX_FILES.concat(kxS().added || []).filter(f => kxOn(f.src) && !f.gone);
const kxById = id => kxFiles().find(f => f.id === id);

/* ---------------- formatting ---------------- */
function kxSize(b) {
  if (b == null) return '';
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0, v = b;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return (v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)) + ' ' + u[i];
}
const kxAgo = d => d == null ? '' : d === 0 ? 'Today' : d === 1 ? 'Yesterday' : d < 30 ? d + ' days ago' : d < 365 ? Math.round(d / 30) + ' months ago' : Math.round(d / 365) + ' years ago';
const kxClock = s => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return (m < 10 ? '0' : '') + m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); };
const kxUnit = f => kxIsMedia(f) ? kxClock(f.secs) : f.pages ? `${f.pages} pages` : f.rows ? `${fmtN(f.rows, 0)} rows` : f.layers ? `${f.layers} layers` : f.slides ? `${f.slides} slides` : f.files ? `${f.files} files` : '';
function kxMark(f, big) {
  const k = KX_KIND[f.kind] || KX_KIND.file, e = kxExt(f.n).toUpperCase().slice(0, 4);
  return `<span class="kx-mark ${big ? 'is-lg' : ''}" style="--kc:var(${k.c})" aria-hidden="true"><i>${esc(e || '?')}</i></span>`;
}
const kxLogo = k => (typeof ILOGO !== 'undefined' && ILOGO[k]) ? ILOGO[k] : '';

/* ============================================================================
   The tree: the places files live
   ========================================================================== */
function kxKids(prefix) {
  const out = {};
  kxFiles().forEach(f => {
    const full = f.src + '/' + f.path;
    if (!full.startsWith(prefix)) return;
    const rest = full.slice(prefix.length).replace(/^\//, '');
    if (!rest) return;
    const name = rest.split('/')[0];
    const key = prefix + '/' + name;
    (out[key] = out[key] || { key, name, n: 0 }); out[key].n++;
  });
  return Object.values(out).sort((a, b) => a.name.localeCompare(b.name));
}
function kxNode(node, depth) {
  const s = kxS(), open = !!s.open[node.key], kids = open ? kxKids(node.key) : [];
  return `<li><div class="kx-tn ${s.folder === node.key ? 'on' : ''}" style="--d:${depth}">
      <button class="kx-tw ${kids.length || kxKids(node.key).length ? '' : 'is-leaf'}" data-a="kxtoggle" data-v="${esc(node.key)}" aria-label="${open ? 'Collapse' : 'Expand'}" aria-expanded="${open}">${IC.next}</button>
      <button class="kx-tb" data-a="kxfolder" data-v="${esc(node.key)}">${IC.layers}<span>${esc(node.name)}</span><em>${node.n}</em></button></div>
    ${open && kids.length ? `<ul>${kids.map(k => kxNode(k, depth + 1)).join('')}</ul>` : ''}</li>`;
}
function kxTree() {
  const s = kxS(), roots = ['local'].concat(kxConnected());
  const off = KX_STORAGE.filter(k => !kxOn(k));
  const row = k => {
    const open = !!s.open[k], kids = open ? kxKids(k) : [];
    const n = kxFiles().filter(f => f.src === k).length;
    return `<li><div class="kx-dr ${s.folder === k ? 'on' : ''}">
      <button class="kx-tw" data-a="kxtoggle" data-v="${k}" aria-label="${open ? 'Collapse' : 'Expand'}" aria-expanded="${open}">${IC.next}</button>
      <button class="kx-db" data-a="kxfolder" data-v="${k}">
        <span class="kx-dlogo">${kxLogo(k) || IC.up}</span>
        <span class="kx-dtx"><b>${esc(KX_SRC[k].n)}</b><small>${n} file${n === 1 ? '' : 's'}</small></span>
        ${k === 'local' ? '' : '<span class="kx-dot" title="Connected"></span>'}</button></div>
      ${open && kids.length ? `<ul class="kx-sub">${kids.map(x => kxNode(x, 0)).join('')}</ul>` : ''}</li>`;
  };
  return `<nav class="kx-tree" aria-label="Places">
    <header class="kx-th"><b>Places</b>
      <button class="kx-tall ${s.folder === '' ? 'on' : ''}" data-a="kxfolder" data-v="">All files<em>${kxFiles().length}</em></button></header>
    <div class="kx-tscroll">
      <div class="kx-sect">Connected drives<span>${kxConnected().length}</span></div>
      <ul class="kx-drives">${roots.map(row).join('')}</ul>
      ${off.length ? `<button class="kx-add" data-a="kxconnect">${IC.plus}Connect storage<em>${off.length}</em></button>` : ''}
    </div>
    <footer class="kx-tfoot">${kxIndexing().length ? `<button class="linkbtn" data-a="kxlearn">${kxIndexing().length} file${kxIndexing().length === 1 ? '' : 's'} indexing</button>` : 'Everything indexed'}</footer>
  </nav>`;
}

/* ============================================================================
   Indexing, demoted to an indicator
   ========================================================================== */
const kxIndexing = () => kxFiles().filter(f => f.idx !== 'done');
const KX_STEP = {
  vid: ['Transcribing the audio', 'Marking what is said', 'Writing embeddings'], aud: ['Transcribing the audio', 'Marking what is said', 'Writing embeddings'],
  dwg: ['Opening layers', 'Reading the title block', 'Counting symbols'], xls: ['Reading sheets', 'Typing the columns', 'Writing embeddings'],
  ppt: ['Reading slides', 'Pulling out figures', 'Writing embeddings'], file: ['Reading the file', 'Pulling out figures', 'Writing embeddings']
};
const kxSteps = k => KX_STEP[k] || KX_STEP.file;
function kxLearnModal() {
  const s = kxS(), live = kxFiles().filter(f => f.idx === 'learning'), q = kxFiles().filter(f => f.idx === 'queued');
  const done = kxFiles().filter(f => f.idx === 'done'), tick = s.tick || 0;
  return `<div class="scrim" data-a="closemodal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="kxlt">
    <div class="mh"><div><span class="eyebrow">Knowledge library</span><h2 id="kxlt">Indexing</h2></div>
      <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
    <div class="mb stack">
      <p class="sub">${done.length} of ${kxFiles().length} files are read and answerable. Reading happens inside the tenant.</p>
      ${live.length || q.length ? `<ul class="kx-queue">
        ${live.map((f, i) => { const st = kxSteps(f.kind), n = (tick + i) % st.length, p = 18 + ((tick * 17 + i * 29) % 70);
    return `<li class="is-live">${kxMark(f)}<div class="kx-qtx"><b>${esc(f.n)}</b><span>${esc(st[n])}</span></div>
            <div class="kx-qbar"><i style="width:${p}%"></i></div></li>`; }).join('')}
        ${q.map(f => `<li>${kxMark(f)}<div class="kx-qtx"><b>${esc(f.n)}</b><span>Queued</span></div><span class="chip">Waiting</span></li>`).join('')}
      </ul>` : '<div class="note ok"><div>Everything is indexed. New files are picked up as they arrive.</div></div>'}
    </div><div class="mf"><button class="btn" data-a="closemodal">Close</button></div></div></div>`;
}

/* ============================================================================
   Connecting a drive: the scan the AI runs on arrival
   ========================================================================== */
const KX_SCAN = [
  ['working', 'Listing the folders'], ['searching', 'Reading the files'],
  ['shaping', 'Working out what each one is'], ['weaving', 'Writing them into the index']
];
function kxScanModal() {
  const s = kxS(), sc = s.scan;
  if (!sc) return '';
  const src = KX_SRC[sc.k] || { n: sc.k }, done = sc.step >= KX_SCAN.length;
  return `<div class="scrim" ${done ? 'data-a="closemodal"' : ''}><div class="modal" role="dialog" aria-modal="true" aria-labelledby="kxst">
    <div class="mh"><div class="row" style="gap:12px;flex-wrap:nowrap"><span class="kx-slogo lg">${kxLogo(sc.k) || ''}</span>
      <div><span class="eyebrow">Connecting</span><h2 id="kxst">${esc(src.n)}</h2></div></div>
      ${done ? `<button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button>` : ''}</div>
    <div class="mb stack">
      ${done
      ? `<div class="kx-scanok">${kxFx('orb', { state: 'breathing', size: 44 }, 'kx-orb', 'kxscan')}
          <div><b>${esc(src.n)} is connected.</b>
            <p class="sub">${sc.found} files found across ${sc.folders} folders. ${sc.read} are read and answerable; the rest are indexing in the background.</p></div></div>
        <ul class="kx-found">${sc.sample.map(x => `<li>${kxMark({ n: x[0], kind: kxKind(x[0]) })}<div><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div><span class="chip ok">Read</span></li>`).join('')}</ul>`
      : `<div class="kx-scan">${kxFx('orb', { state: KX_SCAN[sc.step][0], size: 56 }, 'kx-orb', 'kxscan')}
          <ol>${KX_SCAN.map(([, l], i) => `<li class="${i < sc.step ? 'done' : i === sc.step ? 'now' : ''}">${aiMark(i < sc.step ? 'done' : i === sc.step ? 'now' : '')}<span>${esc(l)}</span>${i < sc.step && sc.counts[i] ? `<em>${esc(sc.counts[i])}</em>` : ''}</li>`).join('')}</ol></div>`}
    </div>
    <div class="mf">${done ? `<button class="btn" data-a="closemodal">Close</button><button class="btn pri" data-a="kxfolder" data-v="${sc.k}">Open ${esc(src.n)} →</button>` : '<span class="sub">This takes a moment.</span>'}</div></div></div>`;
}
function kxRunScan(k) {
  const s = kxS();
  const n = { onedrive: 412, gdrive: 268, box: 190, dropbox: 141 }[k] || 300;
  s.scan = { k, step: 0, found: n, folders: Math.round(n / 9), read: Math.round(n * 0.72), counts: [], sample: KX_SCAN_SAMPLE[k] || KX_SCAN_SAMPLE.def };
  const counts = [`${Math.round(n / 9)} folders`, `${n} files`, `${Math.round(n * 0.72)} classified`, 'index updated'];
  KX_SCAN.forEach((_, i) => setTimeout(() => {
    if (!s.scan || s.scan.k !== k) return;
    s.scan.counts[i] = counts[i]; s.scan.step = i + 1; render();
  }, 700 * (i + 1)));
}
const KX_SCAN_SAMPLE = {
  onedrive: [['Indrayani — site notes.docx', 'Tenders / Indrayani / Notes'], ['Blower sizing check.xlsx', 'Engineering / Calculations'], ['Client meeting 14 Oct.m4a', 'Tenders / Indrayani / Calls']],
  def: [['Tender summary.pdf', 'Tenders'], ['Rates 2026.xlsx', 'Commercial'], ['Site survey.mp4', 'Projects']]
};

/* ============================================================================
   Bulk upload, with the AI choosing where each file goes
   ========================================================================== */
const KX_DEST = [
  [/\.(mp4|mov|mp3|wav|m4a)$/i, 'Tenders/Indrayani 200 MLD STP/03 Site and meetings', 'Media from site and meetings is filed here'],
  [/\.(dwg|dxf|rvt|ifc)$/i, 'Tenders/Indrayani 200 MLD STP/02 Drawings', 'Drawings go to the drawing folder'],
  [/(boq|rate|estimate|cost|quantit)/i, 'Tenders/Indrayani 200 MLD STP/04 Estimate', 'It reads as a priced or quantity document'],
  [/(proposal|compliance|annexure|method)/i, 'Tenders/Indrayani 200 MLD STP/05 Proposal', 'It reads as proposal content'],
  [/(spec|rfp|tender|volume|corrigend|addend)/i, 'Tenders/Indrayani 200 MLD STP/01 Tender pack', 'It reads as part of the tender pack'],
  [/(lesson|outcome|debrief)/i, 'Past bids/Pimpri CETP', 'It reads as a bid outcome or lesson'],
  [/(is ?\d{3,}|standard|handbook|basis)/i, 'Standards/Process', 'It reads as a standard or design basis']
];
function kxWhere(name) {
  for (const [re, path, why] of KX_DEST) if (re.test(name)) return { path, why };
  return { path: 'Tenders/Indrayani 200 MLD STP/01 Tender pack', why: 'No stronger signal, so it goes to the live tender' };
}
function kxUploadModal() {
  const s = kxS(), u = s.up || { from: 'local', files: [] };
  const srcs = ['local'].concat(kxConnected());
  return `<div class="scrim" data-a="closemodal"><div class="modal kx-upmodal" role="dialog" aria-modal="true" aria-labelledby="kxut">
    <div class="mh"><div><span class="eyebrow">Knowledge library</span><h2 id="kxut">Add files</h2></div>
      <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
    <div class="mb stack">
      <div class="kx-from"><span class="eyebrow">Bring them from</span>
        <div class="kx-fromrow">${srcs.map(k => `<button class="kx-fb ${u.from === k ? 'on' : ''}" data-a="kxfrom" data-v="${k}">
          <i class="kx-slogo">${k === 'local' ? IC.up : (kxLogo(k) || IC.layers)}</i>${esc(KX_SRC[k].n)}</button>`).join('')}</div></div>
      ${u.from === 'local'
      ? `<label class="dropzone" id="kxdrop"><b>${IC.up}Drop files here, or choose them</b>
          <span class="sub">Any format — documents, drawings, spreadsheets, video, audio, archives</span>
          <input type="file" multiple data-c="kxpick" aria-label="Choose files"></label>`
      : `<div class="kx-browse"><p class="sub">Pick a folder from ${esc(KX_SRC[u.from].n)} and everything in it comes across.</p>
          <div class="kx-fromrow">${kxKids(u.from).map(d => `<button class="kx-fb" data-a="kxpickfolder" data-v="${esc(d.key)}">${IC.layers}${esc(d.name)} <em>${d.n}</em></button>`).join('') || '<span class="sub">Nothing to browse yet.</span>'}</div></div>`}
      ${u.files.length ? `<div class="kx-uplist"><div class="row between"><span class="eyebrow">${u.files.length} file${u.files.length === 1 ? '' : 's'} · the AI has chosen where each one goes</span>
          <button class="btn sm ghost" data-a="kxupclear">Clear</button></div>
        <ul>${u.files.map((f, i) => `<li>${kxMark({ n: f.n, kind: kxKind(f.n) })}
          <div class="kx-utx"><b>${esc(f.n)}</b><span>${kxSize(f.size)} · ${esc((KX_KIND[kxKind(f.n)] || {}).l)}</span></div>
          <label class="kx-udest"><small>Goes to</small>
            <select data-c="kxdest" data-i="${i}">${[...new Set(KX_DEST.map(d => d[1]).concat([f.path]))].map(p => `<option ${p === f.path ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>
            <em>${esc(f.why)}</em></label></li>`).join('')}</ul></div>` : ''}
    </div>
    <div class="mf"><button class="btn" data-a="closemodal">Cancel</button>
      <button class="btn pri" data-a="kxupgo" ${u.files.length ? '' : 'disabled'}>Add ${u.files.length || ''} file${u.files.length === 1 ? '' : 's'}</button></div></div></div>`;
}

/* ============================================================================
   The file list
   ========================================================================== */
function kxMatch(f) {
  const s = kxS(), q = (s.q || '').toLowerCase().trim();
  if (s.folder && !(f.src + '/' + f.path).startsWith(s.folder)) return false;
  if (!q) return true;
  return (f.n + ' ' + f.path + ' ' + (f.text || '') + ' ' + (f.marks || []).map(m => m.q).join(' ')).toLowerCase().includes(q);
}
/* A deep path cannot fit a narrow bar, so the middle collapses: the root, an
   ellipsis that goes back one level, and where you actually are. */
function kxCrumbs() {
  const s = kxS(), parts = s.folder ? s.folder.split('/') : [];
  const label = (p, i) => i === 0 ? (KX_SRC[p] || { n: p }).n : p;
  const btn = (path, text, on) => `<button data-a="kxfolder" data-v="${esc(path)}" ${on ? 'class="on"' : ''} title="${esc(text)}">${esc(text)}</button>`;
  const sep = '<span aria-hidden="true">›</span>';
  let items;
  if (parts.length <= 3) items = parts.map((p, i) => btn(parts.slice(0, i + 1).join('/'), label(p, i), i === parts.length - 1));
  else {
    const upto = parts.slice(0, parts.length - 1).join('/');
    items = [btn(parts[0], label(parts[0], 0)), `<button data-a="kxfolder" data-v="${esc(upto)}" title="${esc(parts.slice(1, -1).join(' › '))}">…</button>`,
      btn(s.folder, label(parts[parts.length - 1], parts.length - 1), true)];
  }
  return `<nav class="kx-crumbs" aria-label="Folder"><button data-a="kxfolder" data-v="" ${parts.length ? '' : 'class="on"'}>All files</button>${items.map(x => sep + x).join('')}</nav>`;
}
function kxRowActs(f) {
  const s = kxS(), lk = s.locks[f.id];
  return `<td class="kx-acts" data-stop="1">
    <button class="kx-ia ${f.idx === 'learning' ? 'is-busy' : ''}" data-a="kxtrain" data-id="${f.id}" title="${f.idx === 'learning' ? 'Reading this file now' : f.idx === 'done' ? 'Retrain on this file' : 'Train on this file'}" aria-label="Train">${IC.spark}</button>
    <button class="kx-ia ${lk ? 'on' : ''}" data-a="kxlock" data-id="${f.id}" title="${lk ? `Locked by ${esc(lk.by)} · click to unlock` : 'Lock for editing'}" aria-label="${lk ? 'Unlock' : 'Lock'}">${IC.lock}</button>
    <button class="kx-ia" data-a="kxdl" data-id="${f.id}" title="Download" aria-label="Download">${IC.dl}</button>
    <button class="kx-ia" data-a="kxmenu" data-id="${f.id}" title="More" aria-label="More">${IC.dots}</button>
    ${s.menu === f.id ? `<div class="kx-menu">
      <button data-a="kxopen" data-id="${f.id}">${IC.eye}Open</button>
      <button data-a="kxshare" data-id="${f.id}">${IC.chat}Share link</button>
      <button data-a="kxrename" data-id="${f.id}">${IC.pen}Rename</button>
      <button data-a="kxtrain" data-id="${f.id}">${IC.spark}${f.idx === 'done' ? 'Retrain on this file' : 'Train on this file'}</button>
      <button data-a="kxaskfile" data-id="${f.id}">${IC.chat}Ask about this</button>
      <button class="is-bad" data-a="kxdelete" data-id="${f.id}">${IC.trash}Delete</button></div>` : ''}</td>`;
}
function kxRow(f) {
  const s = kxS(), lk = s.locks[f.id];
  return `<tr class="click ${s.sel === f.id ? 'hl' : ''} ${f.idx === 'learning' ? 'is-learning' : ''}" data-a="kxopen" data-id="${f.id}" data-ctx="${f.id}">
    <td class="kx-ncell">${kxMark(f)}<div class="kx-ntx"><b>${esc(f.n)}${lk ? ` <span class="kx-lk" title="Locked by ${esc(lk.by)}">${IC.lock}</span>` : ''}</b>
      <span>${esc(kxUnit(f))}${f.idx === 'learning' ? ' · <i class="kx-tr">training…</i>' : f.idx === 'queued' ? ' · queued' : ''}</span></div></td>
    <td class="kx-path kx-when"><span title="${esc(f.path)}">${esc(f.path.split('/').slice(-1)[0])}</span></td>
    <td class="num mono">${kxSize(f.size)}</td>
    <td class="sub kx-when">${esc(kxAgo(f.mod))}</td>
    ${kxRowActs(f)}</tr>`;
}
/* Right-clicking a row is how a file manager is used, so the same operations
   are there: train or retrain, lock, and the rest. */
function kxCtxMenu() {
  const s = kxS(), f = kxById((s.ctx || {}).id); if (!f) return '';
  const lk = s.locks[f.id], x = Math.min(s.ctx.x, innerWidth - 230), y = Math.min(s.ctx.y, innerHeight - 280);
  return `<div class="kx-ctxwrap" data-a="kxctxclose"><div class="kx-menu is-ctx" style="left:${x}px;top:${y}px" role="menu">
    <div class="kx-ctxh">${kxMark(f)}<b>${esc(f.n)}</b></div>
    <button data-a="kxtrain" data-id="${f.id}">${IC.spark}${f.idx === 'learning' ? 'Reading now…' : f.idx === 'done' ? 'Retrain on this file' : 'Train on this file'}</button>
    <button data-a="kxlock" data-id="${f.id}">${IC.lock}${lk ? `Unlock (held by ${esc(lk.by)})` : 'Lock for editing'}</button>
    <hr>
    <button data-a="kxopen" data-id="${f.id}">${IC.eye}Open</button>
    <button data-a="kxaskfile" data-id="${f.id}">${IC.chat}Ask about this</button>
    <button data-a="kxdl" data-id="${f.id}">${IC.dl}Download</button>
    <button data-a="kxshare" data-id="${f.id}">${IC.chat}Share link</button>
    <button data-a="kxrename" data-id="${f.id}">${IC.pen}Rename</button>
    <button data-a="kxgofolder" data-id="${f.id}">${IC.layers}Go to folder</button>
    <hr>
    <button class="is-bad" data-a="kxdelete" data-id="${f.id}">${IC.trash}Delete</button></div></div>`;
}
function kxList() {
  const s = kxS(), list = kxFiles().filter(kxMatch);
  const here = s.q ? [] : (s.folder ? kxKids(s.folder) : []);
  return `<section class="panel kx-panel">
    <header class="kx-bar">
      <div class="kx-barl">${kxCrumbs()}<span class="kx-count">${list.length} file${list.length === 1 ? '' : 's'}</span></div>
      <div class="kx-hact">
        <div class="kx-search">${IC.search}<input type="search" id="kxq" data-i="kxq" value="${esc(s.q)}" placeholder="Search files and what is said inside them" aria-label="Search"></div>
        <button class="btn sm" data-a="kxupopen">${IC.up}Upload files</button>
        <button class="btn sm pri kx-askbtn" data-a="kxaiopen">${kxFx('orb', { state: 'breathing', size: 18 }, 'kx-orb', 'kxaskb')}Ask the library</button></div></header>
    ${here.length ? `<div class="kx-folders">${here.map(d => `<button class="kx-folder" data-a="kxfolder" data-v="${esc(d.key)}">${IC.layers}<b>${esc(d.name)}</b><em>${d.n}</em></button>`).join('')}</div>` : ''}
    <div class="tw"><table class="t kx-table">
      <thead><tr><th>Name</th><th class="kx-when" style="width:120px">Folder</th><th class="num" style="width:78px">Size</th><th class="kx-when" style="width:104px">Modified</th><th style="width:96px"></th></tr></thead>
      <tbody>${list.map(kxRow).join('') || `<tr><td colspan="5"><div class="empty"><p>${s.q ? 'Nothing matches that.' : 'This folder is empty.'}</p></div></td></tr>`}</tbody></table></div>
  </section>`;
}

/* ============================================================================
   Viewing a file: a document reads, a video plays
   ========================================================================== */
function kxPoster(f) {
  const seed = f.id.length + f.n.length;
  return `<svg class="kx-poster" viewBox="0 0 640 360" role="img" aria-label="${esc(f.n)}">
    <defs><linearGradient id="kxg${f.id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="var(--brand-solid)" stop-opacity=".9"/><stop offset="1" stop-color="var(--ai-teal)" stop-opacity=".75"/></linearGradient></defs>
    <rect width="640" height="360" fill="url(#kxg${f.id})"/>
    <g fill="#fff" opacity=".18">${[...Array(7)].map((_, i) => `<rect x="${40 + i * 84}" y="${120 + ((seed * (i + 3)) % 70)}" width="54" height="${60 + ((seed * (i + 5)) % 90)}" rx="6"/>`).join('')}</g></svg>`;
}
function kxPlayer(f, small) {
  const s = kxS(), t = s.t || 0, pct = Math.min(100, t / Math.max(1, f.secs) * 100);
  const now = (f.marks || []).slice().reverse().find(m => t >= m.t);
  return `<div class="kx-player ${small ? 'is-sm' : ''}">
    <div class="kx-stage">${f.kind === 'vid' ? kxPoster(f) : `<div class="kx-wave">${[...Array(40)].map((_, i) => `<i style="height:${18 + ((i * 37 + f.n.length * 11) % 70)}%"></i>`).join('')}</div>`}
      ${s.play === f.id ? '' : `<button class="kx-big" data-a="kxplay" data-id="${f.id}" aria-label="Play"><i class="kx-tri"></i></button>`}
      <div class="kx-cap" aria-live="polite">${now ? `<span class="kx-capt">${kxClock(now.t)}</span>${esc(now.q)}` : `<span class="sub">${esc(f.text || '')}</span>`}</div></div>
    <div class="kx-ctl">
      <button class="kx-play" data-a="kxplay" data-id="${f.id}" aria-label="${s.play === f.id ? 'Pause' : 'Play'}">${s.play === f.id ? '<i class="kx-pause"></i>' : '<i class="kx-tri"></i>'}</button>
      <span class="mono kx-time">${kxClock(t)}</span>
      <div class="kx-track" data-id="${f.id}" role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="${f.secs}" aria-valuenow="${Math.round(t)}" tabindex="0">
        <i class="kx-fill" style="width:${pct}%"></i>
        ${(f.marks || []).map((m, i) => `<button class="kx-pin ${now && now.t === m.t ? 'on' : ''}" style="left:${m.t / f.secs * 100}%" data-a="kxseekto" data-id="${f.id}" data-t="${m.t}" title="${esc(kxClock(m.t))} · ${esc(m.q.slice(0, 70))}" aria-label="Jump to ${kxClock(m.t)}"><span>${i + 1}</span></button>`).join('')}</div>
      <span class="mono kx-time">${kxClock(f.secs)}</span></div>
    ${!small && (f.marks || []).length ? `<ol class="kx-marks">${f.marks.map(m => `<li class="${now && now.t === m.t ? 'on' : ''}"><button data-a="kxseekto" data-id="${f.id}" data-t="${m.t}"><span class="kx-mt">${kxClock(m.t)}</span><span>${esc(m.q)}</span></button></li>`).join('')}</ol>` : ''}</div>`;
}
/* a readable facsimile so a document can be read, not just described */
function kxPaper(f) {
  const body = (f.text || '').split(/(?<=\.)\s+/);
  return `<div class="kx-paperwrap"><div class="kx-paper">
    <div class="kx-phd"><span>${esc(KX_SRC[f.src].n)}</span><span>${esc(f.n)}</span></div>
    <h4>${esc(f.n.replace(/\.[a-z0-9]+$/i, ''))}</h4>
    ${body.map(p => `<p>${esc(p)}</p>`).join('')}
    ${f.kind === 'xls' ? `<table><thead><tr><th>Item</th><th>Unit</th><th>Qty</th><th>Rate</th></tr></thead><tbody>${[['Excavation in ordinary soil', 'cum', '48,200', '186'], ['RCC M30 in basins', 'cum', '12,640', '7,240'], ['MS pipe 1,600 mm', 'm', '22,000', '18,900'], ['Shuttering', 'sqm', '31,800', '412']].map(r => `<tr>${r.map((c, i) => `<td${i > 1 ? ' style="text-align:right"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}
    <div class="kx-pft"><span>${f.pages ? `Page 1 of ${f.pages}` : f.rows ? `${fmtN(f.rows, 0)} rows` : ''}</span><span>${esc(kxAgo(f.mod))}</span></div>
  </div></div>`;
}
function kxDetail(f) {
  const s = kxS(), lk = s.locks[f.id];
  const ex = typeof kbExtract === 'function' ? kbExtract(f.text || '') : [];
  return `<div class="scrim" data-a="closemodal"><div class="modal kx-modal" role="dialog" aria-modal="true" aria-labelledby="kxdt">
    <div class="mh"><div class="row" style="gap:12px;flex-wrap:nowrap;min-width:0">${kxMark(f, true)}
      <div style="min-width:0"><span class="eyebrow">${esc((KX_KIND[f.kind] || {}).l)} · ${esc(KX_SRC[f.src].n)} · ${esc(f.path)}</span><h2 id="kxdt">${esc(f.n)}</h2></div></div>
      <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
    <div class="mb stack">
      ${kxIsMedia(f) ? kxPlayer(f) : kxHasPreview(f) ? kxPaper(f) : `<div class="kx-noprev">${kxMark(f, true)}<p class="sub">${esc((KX_KIND[f.kind] || {}).l)} · ${kxSize(f.size)}. ${esc(f.text || 'No preview for this format.')}</p></div>`}
      ${ex.length ? `<div class="kx-sec"><span class="eyebrow">Figures the library pulled out</span><div class="kx-vals">${ex.map(e => `<span class="kx-val"><small>${esc(e.k)}</small>${e.vals.slice(0, 3).map(v => esc(v.v)).join(', ')}</span>`).join('')}</div></div>` : ''}
      ${lk ? `<div class="note warn"><div>${IC.lock} Locked by ${esc(lk.by)} ${esc(lk.at)}. Others cannot edit it until it is unlocked.</div></div>` : ''}
    </div>
    <div class="mf"><button class="btn ${lk ? 'bad' : ''}" data-a="kxlock" data-id="${f.id}">${IC.lock}${lk ? 'Unlock' : 'Lock'}</button>
      <button class="btn" data-a="kxdl" data-id="${f.id}">${IC.dl}Download</button>
      <button class="btn" data-a="kxgofolder" data-id="${f.id}">Go to folder</button>
      <button class="btn pri" data-a="kxaskfile" data-id="${f.id}">${IC.spark}Ask about this</button></div></div></div>`;
}

/* ============================================================================
   Knowledge AI
   ========================================================================== */
const KX_STOP = new Set('the and for are was were what when where which who why how did does our their that this with from about into out there here you your say said tell show find file files document documents video play'.split(' '));
const kxWords = q => q.toLowerCase().split(/[^a-z0-9.]+/).filter(w => w.length > 2 && !KX_STOP.has(w));
function kxScore(f, q) {
  const words = kxWords(q); if (!words.length) return 0;
  const name = f.n.toLowerCase(), path = (f.path || '').toLowerCase(), text = (f.text || '').toLowerCase();
  const spoken = (f.marks || []).map(m => m.q).join(' ').toLowerCase();
  let sc = 0;
  words.forEach(w => { if (spoken.includes(w)) sc += 5; if (text.includes(w)) sc += 3; if (name.includes(w)) sc += 2; if (path.includes(w)) sc += 1; });
  return sc;
}
function kxHits(f, q) {
  const words = kxWords(q);
  return (f.marks || []).map(m => ({ m, n: words.filter(w => m.q.toLowerCase().includes(w)).length }))
    .filter(x => x.n > 0).sort((a, b) => b.n - a.n || a.m.t - b.m.t).map(x => x.m);
}
function kxAnswer(q) {
  const ranked = kxFiles().map(f => ({ f, s: kxScore(f, q) })).filter(x => x.s >= 3).sort((a, b) => b.s - a.s);
  if (!ranked.length) return { a: `Nothing in the library matches that. It holds ${kxFiles().length} files across ${kxConnected().length} connected drive${kxConnected().length === 1 ? '' : 's'} — try a word that would appear in the document, the folder, or in what someone said.`, cites: [] };
  let cites = ranked.slice(0, 3).map(x => ({ f: x.f, hits: kxIsMedia(x.f) ? kxHits(x.f, q) : [] }));
  cites.sort((a, b) => b.hits.length - a.hits.length);
  const lead = cites[0];
  let a;
  if (lead.hits.length) a = `It is in <b>${esc(lead.f.n)}</b>, ${lead.hits.length === 1 ? 'once' : lead.hits.length + ' times'}. At <b>${kxClock(lead.hits[0].t)}</b>: “${esc(lead.hits[0].q)}”`;
  else if (lead.f.text) {
    const sentences = lead.f.text.split(/(?<=\.)\s+/), words = kxWords(q);
    const best = sentences.map(x => ({ x, n: words.filter(w => x.toLowerCase().includes(w)).length })).sort((m, n) => n.n - m.n)[0];
    a = `From <b>${esc(lead.f.n)}</b>: ${esc(best && best.n ? best.x : sentences[0])}`;
  } else a = `The closest match is <b>${esc(lead.f.n)}</b>, in ${esc(lead.f.path)}.`;
  const rest = cites.slice(1);
  if (rest.length) a += `<br><span class="sub">Also in ${rest.map(c => esc(c.f.n)).join(' and ')}.</span>`;
  return { a, cites };
}
/* a citation: the file, where it is, and for media the preview at the moment */
function kxCite(c, lead) {
  const f = c.f, s = kxS(), live = lead && kxIsMedia(f) && c.hits.length;
  return `<div class="kx-cite">
    ${live ? kxPlayer(f, true) : ''}
    <div class="kx-crow">${kxMark(f)}<div class="kx-ctx"><b>${esc(f.n)}</b>
      <span><i class="kx-slogo">${kxLogo(f.src) || ''}</i>${esc(KX_SRC[f.src].n)} <span class="mono">${esc(f.path)}</span></span></div></div>
    ${c.hits && c.hits.length ? `<ul class="kx-chits">${c.hits.map(m => `<li><button data-a="kxseekto" data-id="${f.id}" data-t="${m.t}"><span class="kx-mt">${kxClock(m.t)}</span><span>${esc(m.q)}</span></button></li>`).join('')}</ul>` : ''}
    <div class="kx-cact"><button class="btn sm" data-a="kxopen" data-id="${f.id}">${kxIsMedia(f) ? 'Open full player' : 'Open file'}</button>
      <button class="btn sm ghost" data-a="kxgofolder" data-id="${f.id}">Go to folder</button></div></div>`;
}
const KX_THINK = [['searching', 'Searching every connected drive'], ['connecting', 'Reading the files and transcripts'], ['composing', 'Writing the answer']];
function kxAI() {
  const s = kxS(), busy = s.busy, step = s.step || 0;
  if (!s.ai) return '';
  const sug = ['Show me the waste water pipeline video', 'Where is the compliance matrix?', 'What is the specific power we carry?', 'Why did we lose Pimpri CETP?'];
  return `<aside class="kx-ai" role="complementary" aria-label="Knowledge AI">
    <header class="kx-aih">${kxFx('orb', { state: busy ? KX_THINK[step][0] : 'breathing', size: 24 }, 'kx-orb', 'kxai')}
      <div><b>Knowledge AI</b><span>Answers from the ${kxFiles().length} files here</span></div>
      ${s.msgs.length ? `<button class="ibtn" data-a="kxclear" aria-label="Clear conversation">${IC.trash}</button>` : ''}
      <button class="ibtn" data-a="kxaiclose" aria-label="Close Brix">${IC.x}</button></header>
    <div class="kx-aib" id="kxaib">
      ${s.msgs.length ? '' : `<div class="kx-hello"><p>Ask where something is, what a document says, or what was said on a call. Answers come back with the file and, for video and audio, the exact moment — playable here.</p></div>`}
      ${s.msgs.map(m => m.u ? `<div class="kx-m is-me">${esc(m.u)}</div>`
    : `<div class="kx-m is-ai"><div class="kx-a">${m.a}</div>${(m.cites || []).map((c, i) => kxCite(c, i === 0)).join('')}</div>`).join('')}
      ${busy ? `<div class="kx-think">${kxFx('orb', { state: KX_THINK[step][0], size: 22 }, 'kx-orb', 'kxth')}<ol>${KX_THINK.map(([, l], i) => `<li class="${i < step ? 'done' : i === step ? 'now' : ''}">${aiMark(i < step ? 'done' : i === step ? 'now' : '')}<span>${esc(l)}</span></li>`).join('')}</ol></div>` : ''}
      ${!busy ? `<div class="kx-sug">${sug.map(x => `<button data-a="kxask" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
    </div>
    <form class="kx-aif" id="kxaiform"><input id="kxai-in" placeholder="${busy ? 'Thinking…' : 'Ask the library'}" aria-label="Ask the library" ${busy ? 'disabled' : ''} autocomplete="off">
      <button class="kx-go" type="submit" aria-label="Ask" ${busy ? 'disabled' : ''}>${IC.up}</button></form></aside>`;
}

/* ============================================================================
   The page
   ========================================================================== */
function vKB() {
  kxS(); if (!S.kb) S.kb = kbState();
  return `${sh('Knowledge library', 'Files', 'Everything the company knows, read where it already lives.',
    `<button class="btn sm ghost" data-a="kxrecords">Bids, projects &amp; know-how →</button>`)}
    <div class="kx-shell ${kxS().ai ? 'is-ai' : ''}"><div class="kx-side">${kxTree()}</div>
      <div class="kx-body">${typeof kbTray === 'function' ? kbTray() : ''}${kxList()}</div></div>`;
}

/* ============================================================================
   Actions
   ========================================================================== */
Object.assign(ACT, {
  kxtoggle: d => { const s = kxS(); s.open[d.v] = !s.open[d.v]; },
  kxfolder: d => { const s = kxS(); s.folder = d.v || ''; s.q = ''; s.menu = null; if (d.v) { let p = ''; d.v.split('/').forEach(x => { p = p ? p + '/' + x : x; s.open[p] = true; }); } if (S.modal) S.modal = null; },
  kxconnect: () => { S.modal = { kxconn: true }; },
  kxconnon: d => {
    if (typeof isAdmin === 'function' && !isAdmin()) { toast('Only the Tenant Admin can connect storage.'); return 'skip'; }
    const c = integState()[d.k]; if (!c) return 'skip';
    c.on = true; c.at = nowTs(); kxS().open[d.k] = true;
    log('Connected storage from the knowledge library', KX_SRC[d.k].n);
    S.modal = { kxscan: true }; kxRunScan(d.k);
  },
  kxlearn: () => { S.modal = { kxlearn: true }; },
  kxrecords: () => { S.modal = { kxrec: true }; },
  kxopen: d => { const f = kxById(d.id); if (!f) return 'skip'; const s = kxS(); s.sel = f.id; s.menu = null; s.ctx = null; if (kxIsMedia(f) && s.playing !== f.id) { s.t = s.seek === f.id ? s.t : 0; } S.modal = { kxfile: f.id }; },
  kxgofolder: d => { const f = kxById(d.id); if (!f) return 'skip'; ACT.kxfolder({ v: f.src + '/' + f.path }); kxS().sel = f.id; toast(`Opened ${f.path.split('/').slice(-1)[0]}`); },
  kxmenu: d => { const s = kxS(); s.menu = s.menu === d.id ? null : d.id; },
  kxlock: d => { const s = kxS(), f = kxById(d.id); if (!f) return 'skip'; s.menu = null; s.ctx = null;
    if (s.locks[f.id]) { delete s.locks[f.id]; log('Unlocked file', f.n); toast(`${f.n} unlocked.`); }
    else { s.locks[f.id] = { by: R().name, at: nowTs() }; log('Locked file', f.n); toast(`${f.n} locked for editing. Others can read it but not change it.`); } },
  kxtrain: d => {
    const s = kxS(), f = kxById(d.id); if (!f) return 'skip'; s.menu = null; s.ctx = null;
    if (f.idx === 'learning') { toast(`${f.n} is already being read.`); return 'skip'; }
    const again = f.idx === 'done';
    f.idx = 'learning'; f.trainAt = nowTs();
    log(again ? 'Retrained a file' : 'Trained a file', f.n);
    toast(`${again ? 'Retraining' : 'Training'} on ${f.n}. ${kxSteps(f.kind)[0].toLowerCase()}…`);
    /* it finishes on its own, the way the queue does */
    setTimeout(() => { const g = kxById(d.id); if (g && g.idx === 'learning') { g.idx = 'done'; render(); toast(`${g.n} is indexed and answerable.`); } }, 4200);
  },
  kxctx: d => { const s = kxS(); s.ctx = { id: d.id, x: +d.x, y: +d.y }; s.menu = null; },
  kxctxclose: () => { kxS().ctx = null; },
  kxdl: d => { const f = kxById(d.id); if (!f) return 'skip'; kxS().menu = null; kxS().ctx = null; toast(`Download is simulated: ${f.n} (${kxSize(f.size)}) from ${KX_SRC[f.src].n}.`); },
  kxshare: d => { const f = kxById(d.id); if (!f) return 'skip'; kxS().menu = null; kxS().ctx = null; toast(`Share link copied (simulated). It inherits the permissions on ${KX_SRC[f.src].n}.`); },
  kxrename: d => { const s = kxS(), f = kxById(d.id); if (!f) return 'skip'; s.menu = null; s.ctx = null;
    if (s.locks[f.id] && s.locks[f.id].by !== R().name) { toast(`${f.n} is locked by ${s.locks[f.id].by}.`); return 'skip'; }
    const v = prompt('Rename file', f.n); if (!v || v === f.n) return 'skip';
    f.n = v; f.kind = kxKind(v); log('Renamed file', v); },
  kxdelete: d => { const s = kxS(), f = kxById(d.id); if (!f) return 'skip'; s.menu = null; s.ctx = null;
    if (s.locks[f.id]) { toast(`${f.n} is locked. Unlock it first.`); return 'skip'; }
    f.gone = true; log('Deleted file', f.n); toast(`${f.n} removed from the library.`); },
  kxupopen: () => { const s = kxS(); s.up = s.up || { from: 'local', files: [] }; S.modal = { kxup: true }; },
  kxfrom: d => { const s = kxS(); s.up = s.up || { files: [] }; s.up.from = d.v; },
  kxpickfolder: d => { const s = kxS(); const got = kxFiles().filter(f => (f.src + '/' + f.path).startsWith(d.v)).slice(0, 6);
    s.up.files = got.map(f => { const w = kxWhere(f.n); return { n: f.n, size: f.size, path: w.path, why: w.why }; });
    toast(`${got.length} files picked up. The AI has chosen a folder for each.`); },
  kxupclear: () => { kxS().up.files = []; },
  kxupgo: () => {
    const s = kxS(); if (!s.up || !s.up.files.length) return 'skip';
    s.added = s.added || [];
    s.up.files.forEach(f => s.added.push(kxF(s.up.from === 'local' ? 'local' : s.up.from, f.path, f.n, f.size, 0, R().name, 'learning', { text: '' })));
    const n = s.up.files.length; log('Added files to the library', n + ' files');
    s.up.files = []; S.modal = null; toast(`${n} file${n === 1 ? '' : 's'} added and queued for indexing.`);
  },
  kxplay: d => { const s = kxS(), f = kxById(d.id); if (!f) return 'skip'; if (s.play === f.id) { s.play = null; clearInterval(kxTimer); kxTimer = null; } else { s.play = f.id; kxRun(f); } },
  kxseekto: d => { const s = kxS(); s.t = +d.t; s.sel = d.id; s.seek = d.id; },
  kxclear: () => { kxS().msgs = []; },
  kxaiopen: () => { kxS().ai = true; setTimeout(() => { const i = document.getElementById('kxai-in'); if (i) i.focus(); }, 60); },
  kxaiclose: () => { const s = kxS(); s.ai = false; s.play = null; clearInterval(kxTimer); kxTimer = null; },
  kxask: d => kxAsk(d.q),
  kxaskfile: d => { const f = kxById(d.id); if (!f) return 'skip'; S.modal = null; kxAsk(f.n.replace(/\.[a-z0-9]+$/i, '')); }
});

let kxTimer = null;
function kxRun(f) {
  clearInterval(kxTimer);
  kxTimer = setInterval(() => {
    const s = kxS();
    if (s.play !== f.id) { clearInterval(kxTimer); kxTimer = null; return; }
    s.t = (s.t || 0) + 1;
    if (s.t >= f.secs) { s.t = f.secs; s.play = null; clearInterval(kxTimer); kxTimer = null; }
    render();
  }, 240);
}
function kxAsk(q) {
  const s = kxS(); if (s.busy || !q) return;
  s.ai = true;
  s.msgs.push({ u: q }); s.busy = true; s.step = 0; render(); kxScroll();
  setTimeout(() => { s.step = 1; render(); kxScroll(); }, 520);
  setTimeout(() => { s.step = 2; render(); kxScroll(); }, 1060);
  setTimeout(() => {
    const r = kxAnswer(q); s.msgs.push(r); s.busy = false; s.step = 0;
    /* the question also moves the file manager to what it found */
    const lead = (r.cites || [])[0];
    if (lead) { s.folder = lead.f.src + '/' + lead.f.path; s.sel = lead.f.id; let p = ''; s.folder.split('/').forEach(x => { p = p ? p + '/' + x : x; s.open[p] = true; }); if (lead.hits && lead.hits.length) { s.t = lead.hits[0].t; s.seek = lead.f.id; } }
    render(); kxScroll();
  }, 1600);
}
function kxScroll() { const b = document.getElementById('kxaib'); if (b) b.scrollTop = b.scrollHeight; }

function kxRecModal() {
  if (!S.kb) S.kb = kbState();
  const items = typeof kbAll === 'function' ? kbAll() : [];
  return `<div class="scrim" data-a="closemodal"><div class="modal kx-modal" role="dialog" aria-modal="true" aria-labelledby="kxrt">
    <div class="mh"><div><span class="eyebrow">Knowledge library</span><h2 id="kxrt">Bids, projects and know-how</h2></div>
      <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
    <div class="mb">${typeof kbTable === 'function' ? kbTable(items, '') : ''}</div>
    <div class="mf"><button class="btn" data-a="closemodal">Close</button></div></div></div>`;
}
function kxConnectModal() {
  const off = KX_STORAGE.filter(k => !kxOn(k));
  return `<div class="scrim" data-a="closemodal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="kxct">
    <div class="mh"><div><span class="eyebrow">Knowledge library</span><h2 id="kxct">Connect storage</h2></div>
      <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
    <div class="mb stack"><p class="sub">The library reads from where the documents already are. This is the same connection the admin console manages.</p>
      <div class="kx-pick">${off.map(k => `<button class="kx-pk" data-a="kxconnon" data-k="${k}">
        <span class="kx-slogo lg">${kxLogo(k) || ''}</span><span class="kx-pktx"><b>${esc(KX_SRC[k].n)}</b><small>${esc(KX_SRC[k].sub)}</small></span>
        <span class="kx-pkgo">${IC.plus}</span></button>`).join('') || '<p class="sub">Everything supported is already connected.</p>'}</div></div>
    <div class="mf"><button class="btn" data-a="closemodal">Done</button></div></div></div>`;
}

const _kxOverlays = overlays;
overlays = function () {
  let h = _kxOverlays();
  if (S.modal && S.modal.kxconn) h += kxConnectModal();
  if (S.modal && S.modal.kxscan) h += kxScanModal();
  if (S.modal && S.modal.kxlearn) h += kxLearnModal();
  if (S.modal && S.modal.kxup) h += kxUploadModal();
  if (S.modal && S.modal.kxrec) h += kxRecModal();
  if (S.modal && S.modal.kxfile) { const f = kxById(S.modal.kxfile); if (f) h += kxDetail(f); }
  if (S.view === 'kb' && S.kx && S.kx.ai) h += kxAI();
  if (S.view === 'kb' && S.kx && S.kx.ctx) h += kxCtxMenu();
  return h;
};
const _kxClose = ACT.closemodal;
ACT.closemodal = () => { const s = S.kx; if (s) { s.play = null; s.scan = null; clearInterval(kxTimer); kxTimer = null; } return _kxClose(); };

document.addEventListener('input', e => {
  const t = e.target; if (t.dataset.i !== 'kxq') return;
  kxS().q = t.value; const pos = t.selectionStart; render();
  const n = document.getElementById('kxq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (err) { } }
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'kxaiform') return; e.preventDefault();
  const i = document.getElementById('kxai-in'), v = i && i.value.trim();
  if (v) { i.value = ''; kxAsk(v); }
});
document.addEventListener('change', e => {
  const t = e.target, s = S.kx; if (!s) return;
  if (t.dataset.c === 'kxdest') { s.up.files[+t.dataset.i].path = t.value; s.up.files[+t.dataset.i].why = 'Chosen by you'; render(); }
  if (t.dataset.c === 'kxpick') {
    s.up = s.up || { from: 'local', files: [] };
    s.up.files = [...t.files].map(f => { const w = kxWhere(f.name); return { n: f.name, size: f.size, path: w.path, why: w.why }; });
    render();
  }
});
document.addEventListener('contextmenu', e => {
  const row = e.target.closest && e.target.closest('[data-ctx]');
  if (!row || S.view !== 'kb') return;
  e.preventDefault();
  ACT.kxctx({ id: row.dataset.ctx, x: e.clientX, y: e.clientY }); render();
});
document.addEventListener('click', e => {
  const tr = e.target.closest && e.target.closest('.kx-track');
  if (tr && !e.target.closest('.kx-pin')) {
    const f = kxById(tr.dataset.id); if (!f) return;
    const r = tr.getBoundingClientRect();
    kxS().t = Math.max(0, Math.min(f.secs, (e.clientX - r.left) / r.width * f.secs)); render(); return;
  }
  if (S.kx && S.kx.menu && !(e.target.closest && e.target.closest('.kx-acts'))) { S.kx.menu = null; render(); }
});
setInterval(() => { const s = S.kx; if (!s || !S.modal || !S.modal.kxlearn) return; s.tick = (s.tick || 0) + 1; render(); }, 2400);
