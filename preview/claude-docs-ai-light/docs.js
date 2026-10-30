// Documents: upload, processing, register, and viewers for tender PDFs, uploaded PDFs, CAD sheets, uploaded drawings and spreadsheets.

(function () { const s = document.createElement('style'); s.textContent = CAD_LAYERS.map(l => `.cad.h-${l[0]} .L-${l[0]}{display:none}`).join(''); document.head.appendChild(s); })();

function allRecords() {
  const o = O();
  return [
    ...o.reqs.map(r => ['Requirement', r.id, r.text, r.st, r.src, 'reqs']),
    ...o.rules.map(r => ['Rule', r.id, r.rule + '. ' + (r.check || ''), r.state, r.src, 'basis']),
    ...o.risks.map(r => ['Risk', r.id, r.risk, 'open', r.src, 'risks']),
    ...o.clars.map(c => ['Clarification', c.id, c.q, c.status, c.src, 'clar']),
    ...o.brief.facts.map(f => ['Key fact', f.k, f.v, 'accepted', f.src, 'brief']),
    ...o.elig.map(p => ['Eligibility', 'ELG', p.c + ': ' + p.ours, p.res, p.src, 'elig']),
    ...o.basis.map(b => ['Design basis', b.f, b.v, b.st, b.src, 'basis'])
  ].filter(r => r[4]);
}
function recordsAt(code, page, sheet) { return allRecords().filter(r => { const p = parseRef(r[4]); return p.doc && p.doc.code === code && (sheet ? p.sheet === sheet : p.page === page); }); }

function openRef(ref) {
  const r = parseRef(ref); if (!r.doc) return;
  if (S.view !== 'opp' || S.tab !== 'docs') S.v.back = S.view === 'opp' ? { phase: S.phase, tab: S.tab, label: tabLabel(S.tab) } : null;
  S.view = 'opp'; S.phase = 'pre'; S.tab = 'docs'; S.v.doc = r.doc.id; S.v.flash = r.sec || r.sheet || null; S.v.m = []; S.v.q = ''; S.v.pin = null; S.v.cal = null;
  if (r.sheet) { S.v.sheet = r.sheet; S.v.z = 0; } else if (r.doc.kind === 'xls') S.v.xtab = Math.max(0, r.page - 1); else { S.v.page = r.page; S.v.z = 0; }
  S.scrollTop = true;
}
function openDoc(id) { const d = O().docs.find(x => x.id === id); S.v.doc = id; S.v.flash = null; S.v.m = []; S.v.q = ''; S.v.back = null; S.v.xtab = 0; S.v.z = 0; S.v.pin = null; S.v.cal = null; S.v.mode = 'pan'; if (d.kind === 'pdf') { const pg = PAGES[id]; S.v.page = !d.up && pg ? +Object.keys(pg.pages)[0] : 1; } S.scrollTop = true; }

/* ---------------- upload and processing ---------------- */
const KIND = n => /\.pdf$/i.test(n) ? 'pdf' : /\.(png|jpe?g|webp|gif|svg)$/i.test(n) ? 'img' : /\.(xlsx|xls|csv)$/i.test(n) ? 'xls' : 'other';
const DISC = n => /draw|dwg|layout|sheet|plan|section|p&id|sld/i.test(n) ? 'Drawings' : /boq|bill|quantit|schedule.?b/i.test(n) ? 'Quantities' : /spec|technical|vol/i.test(n) ? 'Engineering' : /agreement|contract|concession|gcc|scc/i.test(n) ? 'Contract' : /corrig|addend/i.test(n) ? 'Addendum' : /nit|itb|instruction|rfp|tender/i.test(n) ? 'Commercial' : 'General';
async function uploadFiles(files) {
  const o = O(); if (!can('docs')) { toast('Your role cannot upload documents.'); return; }
  for (const f of files) {
    const n = o.docs.length + 1, id = 'D-' + String(n).padStart(2, '0') + (o.docs.find(d => d.id === 'D-' + String(n).padStart(2, '0')) ? 'u' : '');
    const kind = KIND(f.name);
    const d = { id, code: 'u' + id.replace(/\W/g, '').toLowerCase(), short: f.name.replace(/\.[^.]+$/, '').slice(0, 18), name: f.name.replace(/\.[^.]+$/, ''), fname: f.name, size: f.size, kind, pages: kind === 'img' ? 1 : kind === 'pdf' ? 0 : 1, rev: 'R0', disc: kind === 'img' ? 'Drawings' : DISC(f.name), type: kind === 'img' ? 'Drawing' : kind === 'xls' ? (/boq|bill|quant/i.test(f.name) ? 'BOQ' : 'Data') : ({ Drawings: 'Drawing', Quantities: 'BOQ', Engineering: 'Specification', Contract: 'Contract / GCC', Addendum: 'Addendum', Commercial: 'RFP / ITB' }[DISC(f.name)] || 'Other'), recv: nowTs(), state: 'Processing', lane: 0, found: 0, flags: 0, up: true, by: S.role, pins: [], mpu: null };
    o.docs.push(d); FILES[id] = f; IDB.put(S.oppId + ':' + id, f);
    if (kind === 'xls') { try { d.grid = await parseSheet(f); d.pages = d.grid.length; } catch (e) { d.note = 'Could not read this workbook: ' + e.message; } }
    if (kind === 'pdf') { try { const pdf = await loadPdf(id); d.pages = pdf.numPages; } catch (e) { d.note = 'Could not open this PDF: ' + e.message; } }
    log('Uploaded document', f.name);
  }
  o.cov.total = o.docs.reduce((a, d) => a + (d.pages || 1), 0);
  render(); runLanes();
}
let laneTimer = null;
function runLanes() {
  if (laneTimer) return;
  laneTimer = setInterval(() => {
    let busy = false;
    Object.values(S.db.opps).forEach(o => o.docs.forEach(d => { if (d.state !== 'Processing') return; busy = true; d.lane++; if (d.lane >= LANES.length) { d.state = d.kind === 'other' ? 'Excluded' : d.kind === 'img' ? 'Review needed' : 'Processed'; if (d.state === 'Processed') o.cov.processed += d.pages || 1; else if (d.state === 'Excluded') o.cov.excluded += 1; else o.cov.review += 1; } }));
    if (!busy) { clearInterval(laneTimer); laneTimer = null; }
    const a = document.activeElement; if (!S.modal && !(a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName))) render(); else save();
  }, 700);
}
async function blobOf(id) { if (FILES[id]) return FILES[id]; const b = await IDB.get(S.oppId + ':' + id); if (b) FILES[id] = b; return b; }

/* pdf.js (loaded on first use from cdnjs; worker runs on the main thread) */
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
let pdfReady = null; const PDFS = {};
const loadScript = u => new Promise((res, rej) => { const s = document.createElement('script'); s.src = u; s.onload = res; s.onerror = () => rej(new Error('script blocked')); document.head.appendChild(s); });
function ensurePdfJs() { return pdfReady || (pdfReady = loadScript(PDFJS + 'pdf.min.js').then(() => loadScript(PDFJS + 'pdf.worker.min.js')).then(() => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; })); }
async function loadPdf(id) { if (PDFS[id]) return PDFS[id]; await ensurePdfJs(); const b = await blobOf(id); if (!b) throw new Error('file content not available after reload'); const buf = await b.arrayBuffer(); PDFS[id] = await window.pdfjsLib.getDocument({ data: buf }).promise; return PDFS[id]; }
async function pageText(id, p) { const pdf = await loadPdf(id), pg = await pdf.getPage(p), tc = await pg.getTextContent(); let out = '', lastY = null; tc.items.forEach(it => { const y = it.transform[5]; out += (lastY !== null && Math.abs(y - lastY) > 4 ? '\n' : (out && !out.endsWith(' ') ? ' ' : '')) + it.str; lastY = y; }); return out.replace(/[ \t]+/g, ' ').trim(); }
let pdfTok = 0;
async function renderPdfPage() {
  const tok = ++pdfTok, d = O().docs.find(x => x.id === S.v.doc); if (!d || !document.getElementById('pdfc')) return;
  try {
    const pdf = await loadPdf(d.id), p = Math.min(S.v.page || 1, pdf.numPages), pg = await pdf.getPage(p), z = (S.v.fs || 100) / 100;
    const t = await pageText(d.id, p); if (tok !== pdfTok) return;
    const tx = document.getElementById('ptext'), cvs = document.getElementById('pdfc'); if (tx) tx.textContent = t || 'No text layer on this page (scanned image). OCR would run in production.'; if (!cvs) return;
    const wrap = cvs.parentElement, fitW = Math.max(240, (wrap ? wrap.clientWidth : 700) - 44) / pg.getViewport({ scale: 1 }).width;
    const vp = pg.getViewport({ scale: fitW * z }), ratio = window.devicePixelRatio || 1;
    cvs.width = vp.width * ratio; cvs.height = vp.height * ratio; cvs.style.width = vp.width + 'px'; cvs.style.height = vp.height + 'px';
    await pg.render({ canvasContext: cvs.getContext('2d'), viewport: vp, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : null }).promise;
  } catch (e) { const cvs = document.getElementById('pdfc'); if (tok !== pdfTok || !cvs || /canvas/i.test(e.message)) return; cvs.replaceWith(Object.assign(document.createElement('div'), { className: 'empty', innerHTML: `<p>${esc(e.message === 'script blocked' ? 'The PDF viewer library could not load in this browser.' : 'This file is not available: ' + e.message + '. Upload it again to view pages.')}</p>` })); }
}
const REQ_RX = /\b(shall|must|minimum|not less than|not exceed|at least|required to|is required)\b/i;
function catOf(t) { const s = t.toLowerCase(); return /energy|kwh/.test(s) ? 'Energy' : /bod|cod|tss|effluent|coliform/.test(s) ? 'Performance' : /pipe|sewer|manhole|trench/.test(s) ? 'Pipeline' : /sludge|dewater/.test(s) ? 'Sludge' : /scada|analy[sz]er|plc|instrument/.test(s) ? 'SCADA' : /o&m|staff|operat/.test(s) ? 'O&M' : /test|commission/.test(s) ? 'Testing' : /month|completion|programme|schedule/.test(s) ? 'Programme' : /turnover|net worth|experience|eligib|bank/.test(s) ? 'Commercial' : 'Process'; }
async function extractReqs(id) {
  const o = O(), d = o.docs.find(x => x.id === id); if (!can('reqs')) { toast('Your role cannot create requirements.'); return; }
  toast('Reading every page for obligations…'); let added = 0;
  try {
    const pdf = await loadPdf(id);
    for (let p = 1; p <= pdf.numPages && added < 40; p++) {
      const t = (await pageText(id, p)).replace(/\n/g, ' ');
      t.split(/(?<=[.;:])\s+(?=[A-Z(0-9])/).forEach(sn => { sn = sn.trim(); if (added >= 40 || sn.length < 30 || sn.length > 420 || !REQ_RX.test(sn) || o.reqs.some(r => r.text === sn)) return; o.reqs.push({ id: nextId(o.reqs, 'REQ-0', 3), cat: catOf(sn), text: sn, mand: /shall|must/i.test(sn), src: `${d.code}:${p}`, st: 'proposed', sec: '', owner: 'bid_manager' }); added++; });
    }
    d.found = (d.found || 0) + added; log('Extracted requirements', `${added} from ${d.fname}`);
    toast(added ? `${added} requirements proposed from ${d.fname}. Review them in Requirements.` : 'No sentences with shall / must / minimum found.');
  } catch (e) { toast('Could not read the PDF: ' + e.message); }
  render();
}
/* spreadsheets via SheetJS (loaded on first use) */
let xlsxReady = null;
async function parseSheet(f) {
  if (/\.csv$/i.test(f.name)) { const t = await f.text(); return [{ name: 'Sheet 1', rows: t.split(/\r?\n/).filter(Boolean).slice(0, 300).map(l => l.split(',').map(c => c.replace(/^"|"$/g, ''))) }]; }
  await (xlsxReady || (xlsxReady = loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')));
  const wb = window.XLSX.read(await f.arrayBuffer(), { type: 'array' });
  return wb.SheetNames.slice(0, 8).map(n => ({ name: n, rows: window.XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, blankrows: false }).slice(0, 300).map(r => r.map(c => c == null ? '' : c)) }));
}
function importBoq(id) {
  const o = O(), d = o.docs.find(x => x.id === id), T = d.grid[S.v.xtab || 0]; if (!can('boq')) { toast('Only the estimator or engineering leads can import BOQ lines.'); return; }
  const hdr = T.rows.findIndex(r => r.some(c => /desc/i.test(String(c)))); if (hdr < 0) { toast('No header row with a "Description" column found.'); return; }
  const H = T.rows[hdr].map(c => String(c).toLowerCase()), col = rx => H.findIndex(h => rx.test(h));
  const ci = col(/item|s\.?\s?no|code/), cd = col(/desc/), cu = col(/unit/), cq = col(/qty|quantit/);
  let n = 0; T.rows.slice(hdr + 1).forEach(r => { if (!r[cd]) return; o.boq.push({ id: uid(), grp: T.name, code: String(ci >= 0 ? r[ci] : '') || 'L' + (n + 1), desc: String(r[cd]), unit: String(cu >= 0 ? r[cu] : ''), client: num(cq >= 0 ? r[cq] : 0), ours: num(cq >= 0 ? r[cq] : 0), src: d.fname }); n++; });
  log('Imported BOQ lines', `${n} from ${d.fname}`); toast(`${n} lines imported into Takeoff & BOQ. Enter our quantities there.`);
}

/* ---------------- register ---------------- */
/* Read top to bottom: what is in the pack (stats) → what the AI read in it (one marked band) → the register → coverage → how the pipeline works.
   Anything the AI proposed carries the spark mark or the gradient edge; everything else is the record. */
function mDocs() {
  if (S.v.doc && O().docs.find(d => d.id === S.v.doc)) return viewer();
  S.v.doc = null;
  const o = O(), C = o.cov, tot = Math.max(1, C.total || o.docs.reduce((a, d) => a + (d.pages || 1), 0)), pc = n => (n / tot * 100).toFixed(2) + '%';
  const kindTag = d => `<span class="dtype ${d.kind === 'img' ? 'dwg' : d.kind}">${{ dwg: 'DWG', img: 'IMG', xls: 'XLS', pdf: 'PDF', other: 'FILE' }[d.kind]}</span>`;
  const stc = s => s === 'Processed' || s === 'Impact reviewed' ? 'ok' : s === 'Review needed' ? 'warn' : s === 'Processing' ? 'ai' : '';
  const busy = o.docs.filter(d => d.state === 'Processing');
  const aiCls = d => d.up && typeof aiS === 'function' && !aiS(o).cls[d.id];
  const open = o.covItems.filter(c => /review|fail/i.test(c.st)), done = o.covItems.filter(c => !/review|fail/i.test(c.st));
  const recs = o.docs.reduce((a, d) => a + (+d.found || 0), 0), flags = o.docs.reduce((a, d) => a + (+d.flags || 0), 0), ups = o.docs.filter(d => d.up).length;
  const anl = Math.floor((C.processed + C.excluded) / tot * 100);
  const attn = d => d.flags || /review|processing/i.test(d.state) || aiCls(d);
  const F = S.ui.dxf || 'all', list = F === 'attn' ? o.docs.filter(attn) : F === 'up' ? o.docs.filter(d => d.up) : o.docs;
  const drop = can('docs') ? `<label class="dropzone dx-drop" id="dropzone" for="upl"><input type="file" id="upl" data-c="upload" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.svg,.xlsx,.xls,.csv,.docx,.dwg"><span class="dx-drop-ic">${IC.up2}</span><span class="dx-drop-tx"><b>Drop tender files here or choose files</b><span class="sub">PDF volumes and corrigenda · drawings as PDF or images · BOQ as Excel or CSV. Files stay in this browser.</span></span><span class="btn sm dx-drop-btn">Choose files</span></label>` : permBar('docs');
  const covRow = c => `<tr><td class="id">${c.id}</td><td class="mono"><button class="linkbtn" data-a="opendoc" data-id="${c.doc}">${c.doc}</button></td><td class="mono" style="white-space:nowrap">${esc(c.pages)}</td><td>${esc(c.reason)}</td><td>${typeof aiOwner === 'function' ? aiOwner(c) : ''}</td><td><span class="chip ${c.st === 'Processed' || c.st === 'Reviewed' ? 'ok' : c.st === 'Excluded' ? '' : c.st === 'Failed' ? 'bad' : 'warn'}">${c.st}</span></td><td class="rowact">${can('docs') && /review/i.test(c.st) ? `<button class="btn sm ok" data-a="covact" data-id="${c.id}" data-v="Reviewed">Mark reviewed</button> <button class="btn sm" data-a="covact" data-id="${c.id}" data-v="Excluded">Exclude</button>` : can('docs') && c.st === 'Failed' ? `<button class="btn sm" data-a="covact" data-id="${c.id}" data-v="Processed">Retry with OCR fallback</button>` : ''}</td></tr>`;
  const covHead = '<thead><tr><th>Item</th><th>Document</th><th>Pages</th><th>Reason</th><th>Routed to</th><th>State</th><th></th></tr></thead>';
  const hasAi = o.docs.length && (typeof aiAskBar === 'function' || (o.addenda.length && typeof aiChanges === 'function'));
  const aiCards = [o.addenda.length && typeof aiChanges === 'function' ? aiChanges() : '', o.meta.seed === 'indrayani' && typeof aiMissing === 'function' ? aiMissing() : ''].filter(Boolean);

  return `<div class="dx">
  <div class="stagehead"><div class="stagehead__top"><div class="stack" style="gap:4px"><span class="eyebrow">Stage 2 · Ingest · snapshot ${esc(o.meta.snapshot)}</span><h2>Tender documents and drawings</h2></div>${o.meta.seed === 'indrayani' ? `<div class="row stagehead__act"><button class="btn pri" data-a="opendoc" data-id="D-04">${IC.drawing}Open drawing set</button></div>` : ''}</div><span class="sub">Upload the tender. Each file is parsed, classified and read; open it to view pages and drawings and turn any passage into a record.</span></div>

  ${o.docs.length ? `<div class="dx-stats">
   <div class="dx-stat"><span class="l">Documents</span><b>${o.docs.length}</b><span class="d">${ups ? `${ups} uploaded · ` : ''}${o.addenda.length} addend${o.addenda.length === 1 ? 'um' : 'a'}</span></div>
   <div class="dx-stat"><span class="l">Pages and sheets</span><b>${fmtN(tot)}</b><span class="d">${fmtN(C.processed)} processed · ${C.excluded} excluded</span></div>
   <div class="dx-stat"><span class="l">Analysed</span><b>${anl}%</b><div class="dx-meter"><i style="width:${anl}%"></i></div></div>
   <div class="dx-stat"><span class="l">Records extracted</span><b>${fmtN(recs)}</b><span class="d">Each anchored to its page</span></div>
   <div class="dx-stat ${open.length || flags ? 'warn' : ''}"><span class="l">Needs attention</span><b>${open.length + flags}</b><span class="d">${open.length} unresolved item${open.length === 1 ? '' : 's'} · ${flags} flag${flags === 1 ? '' : 's'}</span></div>
  </div>` : ''}

  ${drop}
  ${busy.length ? `<div class="panel"><div class="ph"><h3>Processing ${busy.length} file${busy.length > 1 ? 's' : ''}</h3><span class="chip ai">Running</span></div><div class="pb stack">${busy.map(d => `<div class="stack" style="gap:6px"><b style="font-size:13px">${esc(d.fname || d.name)}</b><div class="lanes">${LANES.map((l, i) => `<span class="${i < d.lane ? 'done' : i === d.lane ? 'run' : ''}">${l[0]}</span>`).join('')}</div></div>`).join('')}</div></div>` : ''}

  ${hasAi ? `<section class="dx-ai" aria-label="AI suggestions">
   <div class="dx-ai-h"><div class="row" style="gap:10px">${aiTag()}<h3>What bidPlan read in this pack</h3></div><span class="dx-ai-k">${typeof aiMk === 'function' ? aiMk() : ''}Suggested · cited to its page · nothing changes a record until a person accepts it</span></div>
   ${typeof aiAskBar === 'function' ? aiAskBar() : ''}
   ${aiCards.length ? `<div class="dx-ai-g ${aiCards.length === 1 ? 'one' : ''}">${aiCards.join('')}</div>` : ''}
  </section>` : ''}

  <div class="panel dx-reg"><div class="ph"><div class="stack" style="gap:2px"><h3>Document register</h3><span class="sub">${o.docs.length} documents · open one to read pages, drawings and sheets</span></div>${o.docs.length ? `<div class="seg" role="group" aria-label="Filter documents"><button class="${F === 'all' ? 'on' : ''}" data-a="dxf" data-v="all">All <span class="ct">${o.docs.length}</span></button><button class="${F === 'attn' ? 'on' : ''}" data-a="dxf" data-v="attn">Needs attention <span class="ct">${o.docs.filter(attn).length}</span></button>${ups ? `<button class="${F === 'up' ? 'on' : ''}" data-a="dxf" data-v="up">Uploaded <span class="ct">${ups}</span></button>` : ''}</div>` : ''}</div>
   ${o.docs.length ? `<div class="tw"><table class="t"><thead><tr><th>Document</th><th>Type</th><th>Discipline</th><th class="num">Pages</th><th>Rev</th><th>Received</th><th class="num">Records</th><th>State</th><th></th></tr></thead><tbody>
    ${list.map(d => `<tr class="click ${aiCls(d) ? 'aiprop' : ''}" data-a="opendoc" data-id="${d.id}"><td><div class="dx-doc">${kindTag(d)}<div class="dx-doc-tx"><b>${esc(d.name)}</b><span class="sub"><span class="mono">${d.id}</span>${d.up ? ` · ${esc(d.fname)} · ${fmtN(d.size / 1024)} KB · ${esc(ROLES[d.by].name)}` : ''}${d.flags ? ` · <span class="dx-flag">${d.flags} flag${d.flags > 1 ? 's' : ''}</span>` : ''}</span>${d.note ? `<span class="sub" style="color:var(--bad)">${esc(d.note)}</span>` : ''}</div></div></td><td>${can('docs') ? `<select id="dt-${d.id}" data-c="doctype" data-id="${d.id}" style="width:auto" aria-label="Type">${DOC_TYPES.map(x => `<option ${x === d.type ? 'selected' : ''}>${x}</option>`).join('')}</select>` : `<span class="chip">${esc(d.type || 'Other')}</span>`}${typeof aiDocType === 'function' ? aiDocType(d) : ''}</td><td>${can('docs') && d.up ? `<select id="dd-${d.id}" data-c="docdisc" data-id="${d.id}" style="width:auto" aria-label="Discipline">${['Commercial', 'Engineering', 'Contract', 'Drawings', 'Quantities', 'Addendum', 'Survey', 'General'].map(x => `<option ${x === d.disc ? 'selected' : ''}>${x}</option>`).join('')}</select>` : `<span class="dx-disc">${esc(d.disc)}</span>`}</td><td class="num mono">${d.pages || '—'}</td><td class="mono">${d.rev}</td><td class="sub" style="white-space:nowrap">${esc(d.recv)}</td><td class="num mono">${fmtN(d.found)}</td><td><span class="chip ${stc(d.state)}">${d.state}</span></td><td class="rowact"><button class="btn sm ghost" data-a="opendoc" data-id="${d.id}">${IC.eye}View</button></td></tr>`).join('') || `<tr><td colspan="9"><p class="sub" style="padding:12px 0;text-align:center">Nothing needs attention.</p></td></tr>`}</tbody></table></div>` : '<div class="empty"><p>The register fills as you upload files.</p></div>'}</div>

  ${o.meta.seed === 'indrayani' ? `<div class="panel"><div class="ph"><h3>Drawing sheets</h3><span class="sub">8 of 96 shown</span></div><div class="pb"><div class="sheetgrid">${SHEETS.map(s => `<button class="sheetcard" data-a="opensheet" data-no="${s.no}"><span class="th">${drawSheet(s.no)}</span><span class="cap"><span class="row between"><b class="mono">${s.no}</b><span class="mono sub">rev ${s.rev}</span></span><span>${esc(s.title)}</span></span></button>`).join('')}</div></div></div>` : ''}

  <div class="panel"><div class="ph"><div class="stack" style="gap:2px"><h3>Coverage accounting</h3><span class="sub">Every page needs a terminal state before analysis is complete</span></div>${o.docs.length ? `<span class="mono sub">Total ${fmtN(tot)} pages and sheets</span>` : ''}</div><div class="pb stack">
    ${o.docs.length ? `<div class="cov"><i style="width:${pc(C.processed)};background:var(--ok)"></i><i style="width:${pc(C.excluded)};background:var(--muted)"></i><i style="width:${pc(C.review)};background:var(--warn)"></i></div>
    <div class="legend"><span><i style="background:var(--ok)"></i>Processed ${fmtN(C.processed)}</span><span><i style="background:var(--muted)"></i>Excluded ${C.excluded}</span><span><i style="background:var(--warn)"></i>Needs review ${C.review}</span><span><i style="background:var(--bad)"></i>Failed ${C.failed}</span></div>` : '<p class="sub">No documents yet. Upload the tender to start.</p>'}
    ${o.covItems.length ? `${open.length ? `<div class="note warn"><div><b>100% accounted for is not 100% analysed.</b> ${open.length} item${open.length === 1 ? '' : 's'} remain unresolved, so outputs that depend on them are labelled partial.</div></div><div class="tw"><table class="t">${covHead}<tbody>${open.map(covRow).join('')}</tbody></table></div>` : '<div class="note pk"><div><b>Complete.</b> Every page and sheet has a terminal state.</div></div>'}
    ${done.length ? `<details class="dx-more"><summary>${done.length} resolved item${done.length === 1 ? '' : 's'}</summary><div class="tw"><table class="t">${covHead}<tbody>${done.map(covRow).join('')}</tbody></table></div></details>` : ''}` : ''}</div></div>

  <div class="dx-how">
   <div class="panel"><div class="ph"><h3>Pipeline lanes</h3><span class="sub">What happens to every file</span></div><div class="pb"><ol class="dx-steps">${LANES.map((l, i) => `<li><span class="n">${i + 1}</span><b>${l[0]}</b><span class="sub">${l[1]}</span></li>`).join('')}</ol></div></div>
   <div class="panel"><div class="ph"><h3>From documents to records</h3></div><div class="pb"><ul class="dx-tips"><li><span class="n">${IC.doc}</span><span>Open a PDF and select a passage: create a requirement, risk, query or design-basis value anchored to that page.</span></li><li><span class="n ai">${IC.spark}</span><span>On an uploaded PDF, <b>Extract requirements</b> proposes every “shall / must / minimum” sentence.</span></li><li><span class="n">${IC.ruler}</span><span>On a drawing, calibrate the scale, measure, and pin findings.</span></li><li><span class="n">${IC.layers}</span><span>On an Excel BOQ, import the lines into Takeoff & BOQ.</span></li></ul></div></div>
  </div>
  ${o.addenda.length && typeof aiChanges !== 'function' ? `<div class="panel"><div class="ph"><h3>Addenda</h3></div><div class="pb flush">${o.addenda.map(a => `<div class="flag"><div class="sev medium"></div><div class="body"><b>${esc(a.no)} · ${esc(a.date)}</b><span class="sub">${esc(a.title)}</span></div></div>`).join('')}</div></div>` : ''}
  </div>`;
}

/* ---------------- viewer ---------------- */
function viewer() {
  const o = O(), d = o.docs.find(x => x.id === S.v.doc);
  const back = S.v.back ? `<button class="btn" data-a="vback">${IC.back}Back to ${esc(S.v.back.label)}</button>` : '';
  const head = `<div class="row between" style="align-items:flex-start"><div class="stack" style="gap:6px"><div class="row" style="gap:6px"><button class="btn sm" data-a="closedoc">${IC.back}Document register</button>${back}</div><div class="row" style="gap:10px"><span class="dtype ${d.kind === 'img' ? 'dwg' : d.kind}">${{ dwg: 'DWG', img: 'IMG', xls: 'XLS', pdf: 'PDF', other: 'FILE' }[d.kind]}</span><div><span class="eyebrow">${d.id} · ${esc(d.disc)} · rev ${esc(d.rev)}${d.up ? ' · uploaded' : ''}</span><h2>${esc(d.name)}</h2></div></div></div>
   <div class="row"><select id="vdoc" data-c="vdoc" style="width:auto;max-width:280px" aria-label="Switch document">${o.docs.map(x => `<option value="${x.id}" ${x.id === d.id ? 'selected' : ''}>${x.id} · ${esc(x.name.slice(0, 44))}</option>`).join('')}</select>${d.up && d.kind === 'pdf' && can('reqs') ? `<button class="btn ai" data-a="extract" data-id="${d.id}">${IC.spark}Extract requirements</button>` : ''}</div></div>`;
  if (d.kind === 'dwg') return head + cadViewer(d);
  if (d.kind === 'img') return head + imgViewer(d);
  if (d.kind === 'xls') return head + xlViewer(d);
  if (d.kind === 'pdf' && d.up) return head + upPdfViewer(d);
  if (d.kind === 'pdf') return head + pdfViewer(d);
  return head + `<div class="panel"><div class="empty"><h3>${esc(d.fname)}</h3><p>Preview is not available for this file type in the prototype. Production converts DOCX and DWG to PDF on ingest.</p></div></div>`;
}
function extCard(r) {
  const cls = r[3] === 'proposed' ? 'ai' : r[0] === 'Risk' || r[3] === 'open' ? 'bad' : '', canAcc = r[3] === 'proposed' && r[0] === 'Requirement' && can('reqs');
  return `<div class="ext ${cls}"><div class="row between"><span class="mono muted" style="font-size:11.5px">${esc(r[0])} · ${esc(r[1])}</span><span class="row" style="gap:6px">${r[3] === 'proposed' && typeof aiTag === 'function' ? aiTag() : ''}${st(r[3])}</span></div><span>${esc(r[2])}</span><div class="row" style="gap:6px">${canAcc ? `<button class="btn sm ok" data-a="accreq" data-id="${esc(r[1])}">Accept</button>` : ''}<button class="btn sm ghost" data-a="tab" data-t="${r[5]}">Open in ${esc(tabLabel(r[5]))} →</button></div></div>`;
}
const selHint = () => can('reqs') || can('risks') ? `<div class="note ai" style="margin:0"><div>${IC.spark} Select any passage on the page to create a requirement, risk, query or design-basis value anchored here.</div></div>` : '';

function pdfViewer(d) {
  const P = (O().meta.seed === 'indrayani' && PAGES[d.id]) || { toc: [], pages: {} }, keys = Object.keys(P.pages).map(Number).sort((a, b) => a - b), pg = S.v.page || keys[0] || 1, recs = recordsAt(d.code, pg);
  let left;
  if (S.v.q) { const q = S.v.q.toLowerCase(), hits = keys.filter(k => P.pages[k].replace(/<[^>]+>/g, ' ').toLowerCase().includes(q)); left = `<div class="vlist">${hits.map(k => { const tx = P.pages[k].replace(/<[^>]+>/g, ' '), i = tx.toLowerCase().indexOf(q); return `<button class="${k === pg ? 'on' : ''}" data-a="vpage" data-p="${k}"><span class="pg">p.${k}</span><span>…${esc(tx.slice(Math.max(0, i - 30), i + 50))}…</span></button>`; }).join('') || `<p class="sub" style="padding:10px">No match.</p>`}</div>`; }
  else if (S.v.list === 'outline') left = `<div class="vlist">${P.toc.map(t => `<button class="${t[2] === pg ? 'on' : ''}" data-a="vpage" data-p="${t[2]}"><span class="pg">§${t[0]}</span><span>${esc(t[1])} <span class="muted mono">p.${t[2]}</span></span></button>`).join('')}</div>`;
  else left = `<div class="vlist">${keys.map(k => { const n = recordsAt(d.code, k).length; return `<button class="${k === pg ? 'on' : ''}" data-a="vpage" data-p="${k}"><span class="pg">p.${k}</span><span style="flex:1">${esc((P.pages[k].match(/<h4>(.*?)<\/h4>/) || [, 'Page ' + k])[1].replace(/<[^>]+>/g, '').slice(0, 46))}${n ? `<span class="row" style="margin-top:3px"><span class="chip ai">${n} records</span></span>` : ''}</span></button>`; }).join('')}<p class="sub" style="padding:8px 10px">${d.pages - keys.length} other pages processed with no findings.</p></div>`;
  const body = P.pages[pg] ? P.pages[pg].replace('{BORELOG}', boreLog()) : `<h4>Page ${pg}</h4>${Array.from({ length: 22 }, (_, i) => `<div class="ghost" style="width:${70 + (i * 37) % 30}%"></div>`).join('')}`;
  const idx = keys.indexOf(pg), prev = keys[idx - 1], next = keys[idx + 1], fs = S.v.fs || 100;
  return `<div class="viewer"><div class="vside"><div class="vh"><div class="seg" style="display:flex"><button class="${S.v.list !== 'outline' ? 'on' : ''}" data-a="vlist" data-v="pages" style="flex:1;text-align:center">Pages</button><button class="${S.v.list === 'outline' ? 'on' : ''}" data-a="vlist" data-v="outline" style="flex:1;text-align:center">Outline</button></div><input type="search" id="vq" data-i="vq" placeholder="Search this document…" value="${esc(S.v.q)}" aria-label="Search this document"></div>${left}</div>
   <div class="vcenter"><div class="vtool"><button class="ibtn" data-a="vpage" data-p="${prev || pg}" ${prev ? '' : 'disabled'} aria-label="Previous page">${IC.back}</button><span class="sub">Page ${pg} of ${d.pages}</span><button class="ibtn" data-a="vpage" data-p="${next || pg}" ${next ? '' : 'disabled'} aria-label="Next page">${IC.next}</button><span class="sep"></span><button class="ibtn" data-a="vfs" data-v="-10" aria-label="Zoom out">${IC.zout}</button><span class="zl">${fs}%</span><button class="ibtn" data-a="vfs" data-v="10" aria-label="Zoom in">${IC.zin}</button><span class="sep"></span><button class="btn sm ${S.v.ai ? 'ai' : ''}" data-a="vai">${IC.spark}Highlights ${S.v.ai ? 'on' : 'off'}</button></div>
    <div class="pagewrap"><article class="paper" data-selsrc="${d.code}:${pg}" style="font-size:${13.5 * fs / 100}px"><div class="phd"><span>${esc(d.short)}</span><span>${d.id} rev ${esc(d.rev)}</span></div>${S.v.ai ? body : body.replace(/<mark[^>]*>/g, '').replace(/<\/mark>/g, '')}<div class="pft"><span>${esc(O().meta.client)}</span><span>Page ${pg} of ${d.pages}</span></div></article></div></div>
   <div class="vright"><div class="sec">${selHint()}<div class="row between"><h4>Records anchored to page ${pg}</h4><span class="chip ${recs.length ? 'ai' : ''}">${recs.length}</span></div>${recs.length ? recs.map(extCard).join('') : '<p class="sub">No records anchored to this page yet.</p>'}</div>
    <div class="sec"><h4>Document</h4><dl class="kv"><dt>Pages</dt><dd>${d.pages}</dd><dt>Revision</dt><dd>${esc(d.rev)}</dd><dt>Received</dt><dd>${esc(d.recv)}</dd><dt>Parser</dt><dd>PyMuPDF + Docling</dd></dl></div></div></div>`;
}
function upPdfViewer(d) {
  const pg = Math.min(S.v.page || 1, d.pages || 1), recs = recordsAt(d.code, pg), fs = S.v.fs || 100;
  return `<div class="viewer"><div class="vside"><div class="vh"><span class="eyebrow">${d.pages} pages</span></div><div class="vlist">${Array.from({ length: d.pages || 0 }, (_, i) => i + 1).map(k => { const n = recordsAt(d.code, k).length; return `<button class="${k === pg ? 'on' : ''}" data-a="vpage" data-p="${k}"><span class="pg">p.${k}</span><span>${n ? `<span class="chip ai">${n} records</span>` : '<span class="muted">—</span>'}</span></button>`; }).join('')}</div></div>
   <div class="vcenter"><div class="vtool"><button class="ibtn" data-a="vpage" data-p="${Math.max(1, pg - 1)}" ${pg > 1 ? '' : 'disabled'} aria-label="Previous page">${IC.back}</button><span class="sub">Page ${pg} of ${d.pages}</span><button class="ibtn" data-a="vpage" data-p="${Math.min(d.pages, pg + 1)}" ${pg < d.pages ? '' : 'disabled'} aria-label="Next page">${IC.next}</button><span class="sep"></span><button class="ibtn" data-a="vfs" data-v="-10" aria-label="Zoom out">${IC.zout}</button><span class="zl">${fs}%</span><button class="ibtn" data-a="vfs" data-v="10" aria-label="Zoom in">${IC.zin}</button></div>
    <div class="pagewrap"><canvas id="pdfc" style="box-shadow:0 2px 10px rgba(0,0,0,.18);background:#fff;align-self:flex-start;max-width:none" aria-label="Page ${pg}"></canvas></div></div>
   <div class="vright"><div class="sec">${selHint()}<h4>Text on page ${pg}</h4><div class="ptext" id="ptext" data-selsrc="${d.code}:${pg}">Reading page…</div></div>
    <div class="sec"><div class="row between"><h4>Records anchored to page ${pg}</h4><span class="chip ${recs.length ? 'ai' : ''}">${recs.length}</span></div>${recs.length ? recs.map(extCard).join('') : '<p class="sub">Select text above or run Extract requirements.</p>'}</div>
    <div class="sec"><h4>File</h4><dl class="kv"><dt>File</dt><dd>${esc(d.fname)}</dd><dt>Size</dt><dd>${fmtN(d.size / 1024)} KB</dd><dt>Rendered by</dt><dd>pdf.js 3.11</dd><dt>Uploaded</dt><dd>${esc(d.recv)} · ${esc(ROLES[d.by].name)}</dd></dl></div></div></div>`;
}

/* CAD: shared stage for vector sheets and uploaded drawing images */
function stageTools(mpu, canPin) {
  return `<div class="seg"><button class="${S.v.mode === 'pan' ? 'on' : ''}" data-a="vmode" data-v="pan">${IC.hand} Pan</button><button class="${S.v.mode === 'measure' ? 'on' : ''}" data-a="vmode" data-v="measure" ${mpu ? '' : 'disabled title="Calibrate the scale first"'}>${IC.ruler} Measure</button>${canPin ? `<button class="${S.v.mode === 'pin' ? 'on' : ''}" data-a="vmode" data-v="pin">${IC.pin} Pin finding</button>` : ''}</div><span class="sep"></span>
   <button class="ibtn" data-a="vzoom" data-v="0.8" aria-label="Zoom out">${IC.zout}</button><span class="zl" id="zl">${Math.round(S.v.z * 100)}%</span><button class="ibtn" data-a="vzoom" data-v="1.25" aria-label="Zoom in">${IC.zin}</button><button class="ibtn" data-a="vfit" aria-label="Fit" title="Fit">${IC.fit}</button>`;
}
function pinsKey() { return S.v.doc === 'D-04' ? S.v.sheet : S.v.doc; }
function pinsOf() { const o = O(); o.pins = o.pins || {}; return o.pins[pinsKey()] = o.pins[pinsKey()] || []; }
function overlaySvg(w, h) {
  const pins = pinsOf().map((p, i) => `<g><circle cx="${p.x}" cy="${p.y}" r="13" style="fill:var(--cad-ai);stroke:#fff;stroke-width:2"/><text x="${p.x}" y="${p.y + 4}" text-anchor="middle" style="fill:#fff;font:600 12px var(--f-mono)">${i + 1}</text></g>`).join('');
  const pend = S.v.pin ? `<circle cx="${S.v.pin[0]}" cy="${S.v.pin[1]}" r="13" style="fill:none;stroke:var(--cad-ai);stroke-width:3;stroke-dasharray:4 3"/>` : '';
  const cal = S.v.cal && S.v.cal.b ? `<line x1="${S.v.cal.a[0]}" y1="${S.v.cal.a[1]}" x2="${S.v.cal.b[0]}" y2="${S.v.cal.b[1]}" style="stroke:#e0a100;stroke-width:3"/>` : S.v.cal && S.v.cal.a ? `<circle cx="${S.v.cal.a[0]}" cy="${S.v.cal.a[1]}" r="5" style="fill:#e0a100"/>` : '';
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="position:absolute;left:0;top:0;pointer-events:none" id="mlay">${measureSvg()}${pins}${pend}${cal}</svg>`;
}
function pinPanel(code) {
  const pins = pinsOf(), ed = can('docs') || can('risks');
  return `<div class="sec"><div class="row between"><h4>Pinned findings</h4><span class="chip">${pins.length}</span></div>
   ${S.v.pin ? `<div class="ext ai"><label class="fld" for="pinnote">Finding at the new pin<textarea id="pinnote" placeholder="e.g. Outfall level below HFL — check with hydraulic profile"></textarea></label><div class="row" style="gap:6px"><button class="btn sm pri" data-a="pinsave">Save pin</button><button class="btn sm" data-a="pinsave" data-also="risks">Save + create risk</button><button class="btn sm" data-a="pinsave" data-also="clars">Save + create query</button><button class="btn sm ghost" data-a="pincancel">Cancel</button></div></div>` : ''}
   ${pins.map((p, i) => `<div class="ext"><div class="row between"><b class="mono">Pin ${i + 1}</b><span class="row" style="gap:4px"><span class="sub">${esc(ROLES[p.by] ? ROLES[p.by].name : '')}</span>${ed ? `<button class="ibtn del" data-a="pindel" data-i="${i}" aria-label="Delete pin ${i + 1}">${IC.trash}</button>` : ''}</span></div><span>${esc(p.note)}</span></div>`).join('') || (S.v.pin ? '' : `<p class="sub">${ed ? 'Choose Pin finding, then click the drawing.' : 'No pins on this drawing.'}</p>`)}</div>`;
}
function cadViewer(d) {
  const sh = SHEETS.find(s => s.no === S.v.sheet) || SHEETS[0], f = SHEET_FINDINGS[sh.no] || [];
  const offc = Object.keys(S.v.off).filter(k => S.v.off[k]).map(k => 'h-' + k).join(' ');
  return `<div class="viewer"><div class="vside"><div class="vh"><input type="search" id="vq" data-i="vq" placeholder="Find sheet…" value="${esc(S.v.q)}" aria-label="Find sheet"></div>
    <div class="vlist">${SHEETS.filter(s => !S.v.q || (s.no + s.title).toLowerCase().includes(S.v.q.toLowerCase())).map(s => `<button class="sheetbtn ${s.no === sh.no ? 'on' : ''}" data-a="opensheet" data-no="${s.no}"><span class="mini">${drawSheet(s.no)}</span><span class="row between" style="width:100%"><b class="mono">${s.no}</b><span class="mono muted" style="font-size:11px">rev ${s.rev}</span></span><span style="font-weight:400">${esc(s.title)}</span></button>`).join('')}</div></div>
   <div class="vcenter"><div class="vtool">${stageTools(sh.mpu, true)}<span class="sep"></span><button class="btn sm ${S.v.dark ? 'pri' : ''}" data-a="vdark">${S.v.dark ? 'Model space' : 'Paper'}</button><button class="btn sm ${S.v.off.ai ? '' : 'ai'}" data-a="vlayer" data-k="ai">${IC.spark}Markups</button><span class="sub" style="margin-left:auto">${sh.scale}</span></div>
    <div class="vtool" style="padding-block:6px"><span class="eyebrow">Layers</span><div class="layers">${CAD_LAYERS.filter(l => l[0] !== 'ai').map(l => `<button class="${S.v.off[l[0]] ? 'off' : ''}" data-a="vlayer" data-k="${l[0]}"><i style="background:${l[2]}"></i>${l[1]}</button>`).join('')}</div></div>
    <div class="cad ${S.v.dark ? 'dark' : ''} ${offc}" style="flex:1;display:flex;min-height:0"><div class="cadstage ${S.v.mode !== 'pan' ? 'measure' : ''}" id="cadstage" data-mpu="${sh.mpu || ''}" data-w="1400" data-h="990"><div class="cv" id="cv" style="width:1400px;height:990px">${drawSheet(sh.no)}${overlaySvg(1400, 990)}</div><div class="cadhud" id="hud">${sh.no} · drag to pan · wheel to zoom</div></div></div></div>
   <div class="vright"><div class="sec"><div class="row between"><h4>Title block</h4>${typeof aiTag === 'function' ? aiTag() : '<span class="chip ai">Read by drawing reader</span>'}</div><dl class="kv"><dt>Sheet</dt><dd class="mono">IMC-STP-${sh.no}</dd><dt>Title</dt><dd>${esc(sh.title)}</dd><dt>Revision</dt><dd>${sh.rev} · ${sh.date}</dd><dt>Scale</dt><dd>${sh.scale}</dd></dl></div>
    ${pinPanel()}${measurePanel(sh.mpu)}
    <div class="sec"><div class="row between"><h4>${typeof aiMk === 'function' ? aiMk('Found by the drawing reader') : ''}Drawing reader findings</h4><span class="chip ai">${f.length}</span></div>${f.map(x => `<div class="ext ${x[0] === 'bad' ? 'bad' : x[0] === 'ai' ? 'ai' : ''}"><b style="font-size:13px">${esc(x[1])}</b><span class="sub">${esc(x[2])}</span>${x[3] ? `<div>${src(x[3])}</div>` : ''}</div>`).join('')}</div></div></div>`;
}
function measurePanel(mpu) { return `<div class="sec"><div class="row between"><h4>Measurements</h4>${S.v.m.length ? '<button class="linkbtn" data-a="mclear">Clear</button>' : ''}</div>${S.v.m.map((m, i) => `<div class="row between" style="font-size:12.5px"><span class="mono">M${i + 1}</span><b class="mono">${m.len}</b><button class="ibtn" data-a="mdel" data-i="${i}" aria-label="Delete M${i + 1}">${IC.x}</button></div>`).join('') || `<p class="sub">${mpu ? 'Choose Measure, then click two points.' : 'Calibrate the scale to measure.'}</p>`}</div>`; }
function imgViewer(d) {
  const w = d.w || 1600, h = d.h || 1100, ed = can('docs');
  const cal = `<div class="sec"><div class="row between"><h4>Scale</h4>${d.mpu ? `<span class="chip ok">1 px = ${(d.mpu * 1000).toFixed(1)} mm</span>` : '<span class="chip warn">Not calibrated</span>'}</div>
   ${S.v.mode === 'calibrate' ? (S.v.cal && S.v.cal.b ? `<label class="fld" for="calm">Real length of the line you drew (m)<input type="number" step="any" id="calm" placeholder="e.g. 50"></label><div class="row" style="gap:6px"><button class="btn sm pri" data-a="calsave">Apply scale</button><button class="btn sm ghost" data-a="vmode" data-v="pan">Cancel</button></div>` : '<p class="sub">Click both ends of a known dimension on the drawing.</p>') : ed ? `<button class="btn sm" data-a="vmode" data-v="calibrate">${IC.ruler}${d.mpu ? 'Recalibrate' : 'Calibrate from a known dimension'}</button>` : ''}</div>`;
  return `<div class="viewer"><div class="vside"><div class="vh"><span class="eyebrow">Uploaded drawing</span></div><div class="vlist"><button class="sheetbtn on"><span class="mini" style="background:#fff"><img id="thumbimg" alt="" style="width:100%;height:100%;object-fit:contain"></span><b class="mono">${esc(d.id)}</b><span style="font-weight:400">${esc(d.name)}</span></button></div></div>
   <div class="vcenter"><div class="vtool">${stageTools(d.mpu, true)}</div>
    <div class="cad" style="flex:1;display:flex;min-height:0"><div class="cadstage ${S.v.mode !== 'pan' ? 'measure' : ''}" id="cadstage" data-mpu="${d.mpu || ''}" data-w="${w}" data-h="${h}" style="background:#fff"><div class="cv" id="cv" style="width:${w}px;height:${h}px"><img id="dwgimg" alt="${esc(d.name)}" style="width:${w}px;height:${h}px;display:block;max-width:none">${overlaySvg(w, h)}</div><div class="cadhud" id="hud">${esc(d.id)} · drag to pan · wheel to zoom</div></div></div></div>
   <div class="vright">${cal}${pinPanel()}${measurePanel(d.mpu)}<div class="sec"><h4>File</h4><dl class="kv"><dt>File</dt><dd>${esc(d.fname)}</dd><dt>Pixels</dt><dd>${w} × ${h}</dd><dt>Uploaded</dt><dd>${esc(d.recv)}</dd></dl></div></div></div>`;
}
async function loadImg() {
  const d = O().docs.find(x => x.id === S.v.doc); if (!d || d.kind !== 'img') return;
  const b = await blobOf(d.id), im = document.getElementById('dwgimg'), th = document.getElementById('thumbimg');
  if (!b) { const st = document.getElementById('cadstage'); if (st) st.innerHTML = '<div class="empty"><p>File content is not available after reload in this browser. Upload the drawing again.</p></div>'; return; }
  const url = URL.createObjectURL(b);
  if (!d.w) { const t = new Image(); t.onload = () => { d.w = t.naturalWidth; d.h = t.naturalHeight; S.v.z = 0; render(); }; t.src = url; return; }
  if (im) im.src = url; if (th) th.src = url;
}
function measureSvg() { return S.v.m.map((m, i) => `<line x1="${m.a[0]}" y1="${m.a[1]}" x2="${m.b[0]}" y2="${m.b[1]}" style="stroke:var(--cad-ai);stroke-width:2.5"/><circle cx="${m.a[0]}" cy="${m.a[1]}" r="4" style="fill:var(--cad-ai)"/><circle cx="${m.b[0]}" cy="${m.b[1]}" r="4" style="fill:var(--cad-ai)"/><rect x="${(m.a[0] + m.b[0]) / 2 - 4}" y="${(m.a[1] + m.b[1]) / 2 - 24}" width="${m.len.length * 7.5 + 34}" height="18" rx="3" style="fill:var(--cad-ai)"/><text x="${(m.a[0] + m.b[0]) / 2 + 2}" y="${(m.a[1] + m.b[1]) / 2 - 11}" style="fill:#fff;font:600 11px var(--f-mono)">M${i + 1} ${m.len}</text>`).join('') + (S.v.mA ? `<circle cx="${S.v.mA[0]}" cy="${S.v.mA[1]}" r="5" style="fill:var(--cad-ai)"/>` : ''); }

function xlViewer(d) {
  const o = O(), letters = 'ABCDEFGHIJKLMNOP';
  let tabs;
  if (d.id === 'D-05' && o.meta.seed === 'indrayani') { const g = [...new Set(o.boq.map(b => b.grp))]; tabs = g.map(n => ({ name: n, rows: [['Item', 'Description', 'Unit', 'Qty (client)', 'Qty (our takeoff)', 'Δ %', 'Source'], ...o.boq.filter(b => b.grp === n).map(b => [b.code, b.desc, b.unit, b.client, b.ours, b.client ? +((b.ours - b.client) / b.client * 100).toFixed(1) : 'NEW', b.src])] })); }
  else if (d.grid) tabs = d.grid;
  else if (XL[d.id]) tabs = XL[d.id].map(t => ({ name: t.name, rows: [t.head, ...t.rows] }));
  else return `<div class="panel"><div class="empty"><p>${esc(d.note || 'Workbook could not be read.')}</p></div></div>`;
  const T = tabs[S.v.xtab] || tabs[0];
  const live = d.id === 'D-05' && o.meta.seed === 'indrayani';
  return `<div class="viewer" style="grid-template-columns:200px minmax(0,1fr) 300px"><div class="vside"><div class="vh"><span class="eyebrow">Sheets</span></div><div class="vlist">${tabs.map((t, i) => `<button class="${i === (S.v.xtab || 0) ? 'on' : ''}" data-a="xtab" data-i="${i}"><span class="pg">${i + 1}</span><span>${esc(t.name)}<br><span class="muted mono" style="font-size:11px">${t.rows.length - 1} rows</span></span></button>`).join('')}</div></div>
   <div class="vcenter" style="background:var(--surface)"><div class="sheetx"><table class="xl"><thead><tr><th></th>${(T.rows[0] || []).map((_, j) => `<th>${letters[j] || j}</th>`).join('')}</tr></thead><tbody>${T.rows.map((r, i) => `<tr class="${i === 0 ? 'h' : ''} ${S.v.flash && r[0] === S.v.flash ? 'hl' : ''}"><td class="rn">${i + 1}</td>${r.map((v, j) => `<td class="${typeof v === 'number' ? 'n' : ''} ${live && j === 5 && i && (v === 'NEW' || Math.abs(v) > 10) ? (v === 'NEW' ? 'flag-c' : 'bad-c') : ''}">${typeof v === 'number' ? fmtN(v, v % 1 ? 1 : 0) : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
   <div class="vright"><div class="sec"><h4>${live ? 'Live from Takeoff & BOQ' : 'Workbook'}</h4><p class="sub">${live ? 'This schedule reflects the BOQ lines and our quantities as edited by the team.' : d.up ? 'Read in the browser. Import turns rows with a Description column into BOQ lines.' : 'Read-only source data.'}</p>${d.up && can('boq') ? `<button class="btn pri" data-a="importboq" data-id="${d.id}">Import this sheet into Takeoff & BOQ</button>` : ''}${live ? `<button class="btn" data-a="tab" data-t="boq">Edit in Takeoff & BOQ</button>` : ''}</div>
    <div class="sec"><h4>File</h4><dl class="kv"><dt>Sheets</dt><dd>${tabs.length}</dd><dt>Received</dt><dd>${esc(d.recv)}</dd>${d.fname ? `<dt>File</dt><dd>${esc(d.fname)}</dd>` : ''}</dl></div></div></div>`;
}

/* stage interaction: pan, zoom, measure, calibrate, pin */
function cadApply() { const cv = document.getElementById('cv'); if (cv) cv.style.transform = `translate(${S.v.x}px,${S.v.y}px) scale(${S.v.z})`; const zl = document.getElementById('zl'); if (zl) zl.textContent = Math.round(S.v.z * 100) + '%'; }
function cadFit() { const st = document.getElementById('cadstage'); if (!st) return; const W = +st.dataset.w, H = +st.dataset.h, w = st.clientWidth, h = st.clientHeight; S.v.z = Math.min(w / W, h / H) * 0.97; S.v.x = (w - W * S.v.z) / 2; S.v.y = (h - H * S.v.z) / 2; cadApply(); }
function cadZoom(f, cxp, cyp) { const st = document.getElementById('cadstage'); if (!st) return; cxp = cxp == null ? st.clientWidth / 2 : cxp; cyp = cyp == null ? st.clientHeight / 2 : cyp; const nz = Math.max(0.05, Math.min(8, S.v.z * f)); S.v.x = cxp - (cxp - S.v.x) * nz / S.v.z; S.v.y = cyp - (cyp - S.v.y) * nz / S.v.z; S.v.z = nz; cadApply(); }
function cadInit() {
  const st = document.getElementById('cadstage'); if (!st || st.dataset.ready) return; st.dataset.ready = 1;
  if (!S.v.z) cadFit(); else cadApply();
  const mpu = +st.dataset.mpu || 0, hud = document.getElementById('hud');
  const toSvg = e => { const r = st.getBoundingClientRect(); return [(e.clientX - r.left - S.v.x) / S.v.z, (e.clientY - r.top - S.v.y) / S.v.z].map(v => Math.round(v * 10) / 10); };
  let drag = null;
  st.addEventListener('wheel', e => { e.preventDefault(); const r = st.getBoundingClientRect(); cadZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  st.addEventListener('pointerdown', e => { if (S.v.mode !== 'pan') return; drag = [e.clientX, e.clientY, S.v.x, S.v.y]; st.classList.add('drag'); st.setPointerCapture(e.pointerId); });
  st.addEventListener('pointermove', e => { if (drag) { S.v.x = drag[2] + e.clientX - drag[0]; S.v.y = drag[3] + e.clientY - drag[1]; cadApply(); } const p = toSvg(e); if (hud) hud.textContent = mpu ? `E ${(p[0] * mpu).toFixed(1)} m  N ${(p[1] * mpu).toFixed(1)} m` : `x ${p[0]} · y ${p[1]} · ${S.v.mode === 'calibrate' ? 'calibrating' : 'not to scale'}`; });
  st.addEventListener('pointerup', () => { drag = null; st.classList.remove('drag'); });
  st.addEventListener('click', e => {
    const p = toSvg(e), lay = () => { const ml = document.getElementById('mlay'); if (ml) ml.outerHTML = overlaySvg(+st.dataset.w, +st.dataset.h); };
    if (S.v.mode === 'measure' && mpu) { if (!S.v.mA) { S.v.mA = p; lay(); return; } const len = Math.hypot(p[0] - S.v.mA[0], p[1] - S.v.mA[1]) * mpu; S.v.m.push({ a: S.v.mA, b: p, len: len.toFixed(len < 10 ? 2 : 1) + ' m' }); S.v.mA = null; render(); }
    else if (S.v.mode === 'calibrate') { if (!S.v.cal || S.v.cal.b) { S.v.cal = { a: p }; lay(); return; } S.v.cal.b = p; S.v.cal.px = Math.hypot(p[0] - S.v.cal.a[0], p[1] - S.v.cal.a[1]); render(); const i = document.getElementById('calm'); if (i) i.focus(); }
    else if (S.v.mode === 'pin') { S.v.pin = p; render(); const i = document.getElementById('pinnote'); if (i) i.focus(); }
  });
}
