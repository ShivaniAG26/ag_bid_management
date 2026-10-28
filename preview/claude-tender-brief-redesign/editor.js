// A block editor for the proposal draft: rich text, tables, images, and the
// drawings and record tables that already exist on this tender.
//
// Blocks keep the shape the drafting code already produces, so a generated
// paragraph and a hand-written one are the same kind of thing:
//   {t, src, kb, st, flag}        a paragraph · t is plain text, h is rich text
//   {table: html}                 a table the draft generator built
//   {kind:'h3'|'quote'|'callout'} a heading or a set-apart passage
//   {kind:'ul'|'ol', h}           a list
//   {kind:'div'}                  a divider
//   {kind:'tbl', head, rows}      a table the writer fills in
//   {kind:'img', key, cap}        an uploaded image, held in IndexedDB
//   {kind:'dwg', sheet, cap}      a drawing from this tender, drawn live
//   {kind:'rec', rec, cap}        a record table, read from the records now
// A record table and a drawing are never copied: they are rendered from the
// record each time, so the proposal cannot drift from what the tender holds.

/* ---------- what survives an edit or a paste ---------- */
const ED_KEEP = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, STRIKE: 1, CODE: 1, MARK: 1, SUP: 1, SUB: 1, BR: 1, A: 1, UL: 1, OL: 1, LI: 1, P: 1, DIV: 1 };
function edClean(el) {
  el.querySelectorAll('*').forEach(x => {
    if (!ED_KEEP[x.tagName]) { x.replaceWith(...x.childNodes); return; }
    [...x.attributes].forEach(a => { if (!(x.tagName === 'A' && a.name === 'href')) x.removeAttribute(a.name); });
    if (x.tagName === 'A') { x.setAttribute('target', '_blank'); x.setAttribute('rel', 'noopener noreferrer'); }
    if (x.tagName === 'P' || x.tagName === 'DIV') { if (x.closest('li')) x.replaceWith(...x.childNodes); }
  });
  return el.innerHTML.replace(/<div>/g, '<br>').replace(/<\/div>/g, '').replace(/(<br>\s*)+$/, '');
}
const edHTML = p => p.h != null ? p.h : esc(p.t || '');
const edText = h => { const d = document.createElement('div'); d.innerHTML = h || ''; return d.textContent; };

/* ---------- images live in IndexedDB; the block keeps only its key ---------- */
const IMGS = {};
let edImgBusy = false;
function edImgWant(key) {
  if (IMGS[key] !== undefined || edImgBusy) return;
  edImgBusy = true;
  IDB.get(key).then(v => { IMGS[key] = v || null; edImgBusy = false; render(); });
}
/* Downscaled on the way in so a photograph does not bloat the saved state. */
function edImgRead(file, cb) {
  const fr = new FileReader();
  fr.onload = () => {
    const im = new Image();
    im.onload = () => {
      const max = 1400, sc = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      let out; try { out = c.toDataURL(/png/i.test(file.type) ? 'image/png' : 'image/jpeg', 0.82); } catch (e) { out = fr.result; }
      cb(out.length > fr.result.length ? fr.result : out);
    };
    im.onerror = () => cb(fr.result);
    im.src = fr.result;
  };
  fr.readAsDataURL(file);
}

/* ---------- record tables, read from the records every time ---------- */
const ED_REC = {
  boq: ['BOQ', o => [['Code', 'Description', 'Unit', 'Quantity', 'Source'], o.boq.map(r => [r.code, r.desc, r.unit, fmtN(r.ours), r.src || ''])]],
  risks: ['Risk register', o => [['ID', 'Risk', 'L×I', 'Exposure', 'Treatment'], o.risks.map(r => [r.id, r.risk, `${r.l}×${r.i}`, cr(expo(r)), r.treat])]],
  reqs: ['Requirements', o => [['ID', 'Requirement', 'Category'], o.reqs.map(r => [r.id, r.text, r.cat])]],
  basis: ['Design basis', o => [['Field', 'Value'], o.basis.map(r => [r.f, r.v])]],
  elig: ['Eligibility', o => [['Criterion', 'Required', 'Our evidence', 'Result'], o.elig.map(r => [r.c, r.need, r.ours, r.res === 'pass' ? 'Pass' : r.res === 'fail' ? 'Fail' : 'Evidence needed'])]],
  scope: ['Scope by package', o => [['WBS', 'Scope item', 'Responsibility', 'Note'], o.scope.map(r => [r.wbs, r.wp, r.split, r.note || ''])]],
  facts: ['Key facts', o => [['Fact', 'Value'], (o.brief.facts || []).map(r => [r.k, r.v])]],
  quality: ['Raw and treated quality', o => [['Parameter', 'Raw', 'Treated', 'Norm'], (o.quality || []).map(r => [r.p, r.raw, r.tr, r.norm])]],
  om: ['O&M cost lines', o => [['Line', '₹ Cr / year'], (o.om || []).map(r => [r.item, r.cost])]],
  crew: ['Crew', o => [['Position', 'Number', '₹ lakh / person / yr'], (o.crew || []).map(r => [r.role, r.n, r.rate])]],
  cond: ['Asset condition', o => [['Asset', 'Area', 'Condition', 'Rectification ₹ Cr', 'Payer'], (o.cond || []).map(r => [r.asset, r.area, r.cond, r.rect, r.payer])]],
  longlead: ['Long-lead items', o => [['Item', 'Lead (weeks)', 'Need by', 'Order by'], (o.longlead || []).map(r => [r.item, r.lead, r.need, r.order])]]
};
function edRecRows(k) { const o = O(), d = ED_REC[k]; if (!d) return null; try { return d[1](o); } catch (e) { return null; } }

/* ---------- the insert menu ---------- */
function edItems() {
  const out = [], g = (grp, l) => l.forEach(x => out.push({ grp, ...x }));
  g('Basic', [
    { t: 'Text', d: 'A plain paragraph', k: 'p' },
    { t: 'Heading', d: 'A heading inside the section', k: 'h3' },
    { t: 'Bulleted list', d: 'A list of points', k: 'ul' },
    { t: 'Numbered list', d: 'A list in order', k: 'ol' },
    { t: 'Quote', d: 'Set a passage apart', k: 'quote' },
    { t: 'Callout', d: 'A box the evaluator cannot miss', k: 'callout' },
    { t: 'Divider', d: 'A rule across the page', k: 'div' },
    { t: 'Table', d: 'Three by three, type in any cell', k: 'tbl' },
    { t: 'Image', d: 'Upload a photograph or a diagram', k: 'img' }
  ]);
  /* Only the sheets that belong to this tender's own drawing set. */
  const hasDwg = O().meta.seed === 'indrayani' && O().docs.some(x => x.kind === 'dwg' || x.kind === 'img' || x.disc === 'Drawings');
  if (hasDwg && typeof SHEETS !== 'undefined' && typeof DRAW !== 'undefined') {
    const dw = SHEETS.filter(s => DRAW[s.no]);
    if (dw.length) g('Drawings on this tender', dw.map(s => ({ t: `${s.no} · ${s.title}`, d: 'Drawn from the tender set', k: 'dwg', v: s.no })));
  }
  /* sections of past winning bids that match the one being written */
  if (typeof paReusable === 'function') {
    const pr = ensureProp(), sel = findNode(pr.tree, pr.sel) || findNode(pr.tree, pr.tree[0].id);
    const reuse = sel ? paReusable(topOf(sel.n)) : [];
    if (reuse.length) g('From a bid that won', reuse.map(x => ({ t: x.b.title, d: `${x.b.sec} · used in ${x.b.used} bids${x.old ? ' · over a year old' : ''}`, k: 'reuse', v: x.b.id })));
  }
  const rec = Object.keys(ED_REC).map(k => [k, edRecRows(k)]).filter(x => x[1] && x[1][1].length);
  if (rec.length) g('Tables from the records', rec.map(([k, r]) => ({ t: ED_REC[k][0], d: `${r[1].length} row${r[1].length === 1 ? '' : 's'} · stays in step with the record`, k: 'rec', v: k })));
  return out;
}
function edNew(k, v) {
  if (k === 'p') return { t: '', h: '', src: [], kb: [], st: 'edited', flag: '' };
  if (k === 'tbl') return { kind: 'tbl', head: ['', '', ''], rows: [['', '', ''], ['', '', '']] };
  if (k === 'dwg') return { kind: 'dwg', sheet: v, cap: (SHEETS.find(s => s.no === v) || {}).title || '' };
  if (k === 'rec') return { kind: 'rec', rec: v, cap: ED_REC[v][0] };
  if (k === 'img') return { kind: 'img', key: '', cap: '' };
  if (k === 'reuse') { const r = typeof paInsertBlock === 'function' ? paInsertBlock(v) : null; if (r) return r; }
  if (k === 'div') return { kind: 'div' };
  return { kind: k, h: '' };
}

/* ---------- rendering ---------- */
function edTable(p, n, i, edit) {
  const cell = (v, r, c, h) => `<${h ? 'th' : 'td'} ${edit ? `contenteditable="true" data-i="edcell" data-n="${n.id}" data-ix="${i}" data-r="${r}" data-c="${c}"` : ''}>${v == null ? '' : esc(v)}</${h ? 'th' : 'td'}>`;
  return `<div class="tw"><table class="t edtbl"><thead><tr>${p.head.map((v, c) => cell(v, -1, c, 1)).join('')}</tr></thead>
   <tbody>${p.rows.map((row, r) => `<tr>${row.map((v, c) => cell(v, r, c, 0)).join('')}</tr>`).join('')}</tbody></table></div>
   ${edit ? `<div class="row" style="gap:6px;margin-top:6px"><button class="btn sm ghost" data-a="edtrow" data-n="${n.id}" data-ix="${i}" data-v="1">${IC.plus}Row</button><button class="btn sm ghost" data-a="edtcol" data-n="${n.id}" data-ix="${i}" data-v="1">${IC.plus}Column</button>${p.rows.length > 1 ? `<button class="btn sm ghost" data-a="edtrow" data-n="${n.id}" data-ix="${i}" data-v="-1">Remove row</button>` : ''}${p.head.length > 1 ? `<button class="btn sm ghost" data-a="edtcol" data-n="${n.id}" data-ix="${i}" data-v="-1">Remove column</button>` : ''}</div>` : ''}`;
}
function edFigure(inner, p, n, i, edit, note) {
  return `<figure class="edfig">${inner}<figcaption ${edit ? `contenteditable="true" data-i="edcap" data-n="${n.id}" data-ix="${i}"` : ''} data-ph="Add a caption">${esc(p.cap || '')}</figcaption>${note ? `<span class="edsrc">${note}</span>` : ''}</figure>`;
}
function edBody(p, n, i, edit) {
  const ed = a => edit ? `contenteditable="true" data-i="${a}" data-n="${n.id}" data-ix="${i}"` : '';
  if (p.table) return p.table;
  const k = p.kind;
  if (!k) return `<div class="dpara ${p.st}" ${ed('ppara')} ${edit ? 'role="textbox"' : ''} data-ph="Write, or press / to insert">${edHTML(p)}</div>`;
  if (k === 'h3') return `<h4 class="edh" ${ed('edrich')} data-ph="Heading">${edHTML(p)}</h4>`;
  if (k === 'quote') return `<blockquote class="edq" ${ed('edrich')} data-ph="Quote">${edHTML(p)}</blockquote>`;
  if (k === 'callout') return `<div class="edcall" ${ed('edrich')} data-ph="Something the evaluator must not miss">${edHTML(p)}</div>`;
  if (k === 'ul' || k === 'ol') return `<${k} class="edlist" ${ed('edrich')} data-ph="A point">${p.h || '<li></li>'}</${k}>`;
  if (k === 'div') return '<hr class="eddiv">';
  if (k === 'tbl') return edTable(p, n, i, edit);
  if (k === 'dwg') { const svg = typeof drawSheet === 'function' && typeof DRAW !== 'undefined' && DRAW[p.sheet] ? drawSheet(p.sheet) : '<div class="empty"><p>That drawing is not in this tender.</p></div>'; return edFigure(`<div class="edwg">${svg}</div>`, p, n, i, edit, `<button class="src" data-a="ref" data-ref="dwg:${esc(p.sheet)}">${IC.drawing}${esc(p.sheet)}</button> <span class="sub">drawn from the tender set</span>`); }
  if (k === 'rec') { const r = edRecRows(p.rec); const t = !r ? '<div class="empty"><p>That record is empty.</p></div>' : `<div class="tw"><table class="t"><thead><tr>${r[0].map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${r[1].map(row => `<tr>${row.map(v => `<td>${esc(v == null ? '' : v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; return edFigure(t, p, n, i, edit, `${typeof aiMk === 'function' ? aiMk('Read from the records now') : ''}<span class="sub">From ${esc(ED_REC[p.rec] ? ED_REC[p.rec][0] : p.rec)} · ${r ? r[1].length : 0} rows, re-read each time this page opens</span>`); }
  if (k === 'img') {
    if (!p.key) return edit ? `<label class="edrop" for="edimg-${n.id}-${i}">${IC.up2}<b>Choose an image</b><span class="sub">PNG or JPEG · it is stored in this browser</span><input type="file" id="edimg-${n.id}-${i}" accept="image/*" hidden data-c="edimg" data-n="${n.id}" data-ix="${i}"></label>` : '';
    if (IMGS[p.key] === undefined) { edImgWant(p.key); return '<div class="edrop"><span class="sub">Loading the image…</span></div>'; }
    if (!IMGS[p.key]) return '<div class="edrop"><span class="sub">This image is not in this browser’s storage.</span></div>';
    return edFigure(`<img class="edimg" src="${IMGS[p.key]}" alt="${esc(p.cap || 'Image in the proposal')}">`, p, n, i, edit, '');
  }
  return '';
}
/* Citations, the Accept button and the drafting flag stay with a paragraph. */
function edMeta(p, n, i, edit) {
  if (p.kind || p.table) return '';
  const show = edit || p.st !== 'accepted';
  const chk = typeof paResponsive === 'function' ? paResponsive(p, n) + paNumbers(p) : '';
  return `${chk}${show ? `<div class="dmeta">${(p.src || []).map(src).join('')}${(p.kb || []).map(kbBtn).join('')}${p.st === 'proposed' ? `<span class="chip ai">Proposed</span>${edit ? `<button class="btn sm ok" data-a="pacc" data-n="${n.id}" data-ix="${i}">Accept</button>` : ''}` : p.st === 'edited' ? '<span class="chip info">Edited</span>' : ''}</div>` : ''}${p.flag ? `<div class="note warn" style="padding:6px 10px;font-size:12.5px"><div>${esc(p.flag)}</div></div>` : ''}`;
}
function edBlocks(n, ps, edit) {
  const open = S.ui.edmenu;
  return ps.map((p, i) => `<div class="edb ${p.kind ? 'k-' + p.kind : ''}" data-n="${n.id}" data-ix="${i}">
   ${edit ? `<div class="edb-ctl"><button class="ibtn" data-a="edins" data-n="${n.id}" data-ix="${i}" aria-label="Insert a block below" title="Insert below">${IC.plus}</button><button class="ibtn" data-a="edblk" data-n="${n.id}" data-ix="${i}" aria-label="Block actions" title="Move or delete">${IC.dots}</button>${open === n.id + ':' + i ? `<div class="mlist edblk" role="menu">${i ? `<button data-a="edmv" data-n="${n.id}" data-ix="${i}" data-v="-1">Move up</button>` : ''}${i < ps.length - 1 ? `<button data-a="edmv" data-n="${n.id}" data-ix="${i}" data-v="1">Move down</button>` : ''}<button data-a="eddup" data-n="${n.id}" data-ix="${i}">Duplicate</button><button data-a="eddel" data-n="${n.id}" data-ix="${i}">Delete</button></div>` : ''}</div>` : ''}
   <div class="edb-in">${edBody(p, n, i, edit)}${edMeta(p, n, i, edit)}</div></div>`).join('')
    + (edit ? `<button class="edadd" data-a="edins" data-n="${n.id}" data-ix="${ps.length - 1}">${IC.plus}Add a block</button>${typeof edHint === 'function' ? edHint() : ''}` : '');
}

/* ---------- the formatting bar, shown on a selection ---------- */
let edBar = null;
const ED_FMT = [['bold', '<b>B</b>', 'Bold'], ['italic', '<i>I</i>', 'Italic'], ['underline', '<u>U</u>', 'Underline'], ['strikeThrough', '<s>S</s>', 'Strikethrough'], ['edlink', '🔗', 'Link'], ['removeFormat', '⨯', 'Clear formatting']];
function edBarEl() {
  if (edBar) return edBar;
  edBar = document.createElement('div'); edBar.className = 'edbar'; edBar.hidden = true;
  edBar.innerHTML = ED_FMT.map(f => `<button data-fmt="${f[0]}" title="${f[2]}" aria-label="${f[2]}">${f[1]}</button>`).join('');
  edBar.addEventListener('mousedown', e => {
    const b = e.target.closest('[data-fmt]'); if (!b) return;
    e.preventDefault(); const f = b.dataset.fmt;
    if (f === 'edlink') { const u = prompt('Link to'); if (u) document.execCommand('createLink', false, u); }
    else document.execCommand(f, false, null);
    edSaveFocused();
  });
  document.body.appendChild(edBar); return edBar;
}
function edShowBar() {
  const s = window.getSelection(), bar = edBarEl();
  if (!s || s.isCollapsed || !s.rangeCount) { bar.hidden = true; return; }
  const host = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement);
  const box = host && host.closest('[contenteditable=true]');
  if (!box || !box.closest('.edb-in') || box.dataset.i === 'edcell' || box.dataset.i === 'edcap') { bar.hidden = true; return; }
  const r = s.getRangeAt(0).getBoundingClientRect();
  if (!r.width && !r.height) { bar.hidden = true; return; }
  bar.hidden = false;
  bar.style.left = Math.max(8, Math.min(window.innerWidth - bar.offsetWidth - 8, r.left + r.width / 2 - bar.offsetWidth / 2)) + 'px';
  bar.style.top = (r.top > bar.offsetHeight + 10 ? r.top - bar.offsetHeight - 8 : r.bottom + 8) + 'px';
}
document.addEventListener('selectionchange', () => { if (S.tab === 'pdraft') edShowBar(); });
window.addEventListener('scroll', () => { if (edBar && !edBar.hidden) edShowBar(); }, true);

/* ---------- the insert menu ---------- */
let edMenu = null, edAt = null, edQ = '';
function edMenuEl() {
  if (edMenu) return edMenu;
  edMenu = document.createElement('div'); edMenu.className = 'edpop'; edMenu.hidden = true;
  edMenu.innerHTML = '<input type="search" class="edpop-q" placeholder="Search blocks, drawings and tables…" aria-label="Search blocks"><div class="edpop-l" role="listbox"></div>';
  edMenu.querySelector('input').addEventListener('input', e => { edQ = e.target.value; edFill(); });
  edMenu.addEventListener('mousedown', e => {
    const b = e.target.closest('[data-k]'); if (!b) return; e.preventDefault();
    edPick(b.dataset.k, b.dataset.v || '');
  });
  edMenu.addEventListener('keydown', e => { if (e.key === 'Escape') edHide(); });
  document.body.appendChild(edMenu); return edMenu;
}
function edFill() {
  const q = edQ.trim().toLowerCase(), all = edItems();
  const hit = !q ? all : all.filter(x => (x.t + ' ' + (x.d || '') + ' ' + x.grp).toLowerCase().includes(q));
  const el = edMenuEl().querySelector('.edpop-l');
  let grp = '';
  el.innerHTML = hit.length ? hit.map(x => { const h = x.grp !== grp ? `<div class="edpop-g">${esc(x.grp)}</div>` : ''; grp = x.grp; return h + `<button data-k="${x.k}" data-v="${esc(x.v || '')}" role="option"><b>${esc(x.t)}</b>${x.d ? `<span class="sub">${esc(x.d)}</span>` : ''}</button>`; }).join('')
    : '<div class="edpop-g">Nothing matches that.</div>';
}
function edOpen(n, ix, rect, slash) {
  edAt = { n, ix, slash }; edQ = ''; const m = edMenuEl(); m.hidden = false;
  m.querySelector('input').value = ''; edFill();
  const w = m.offsetWidth || 320, h = m.offsetHeight || 360;
  m.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, rect.left)) + 'px';
  m.style.top = (rect.bottom + h + 12 > window.innerHeight ? Math.max(8, rect.top - h - 8) : rect.bottom + 8) + 'px';
  setTimeout(() => m.querySelector('input').focus(), 0);
}
function edHide() { if (edMenu) edMenu.hidden = true; edAt = null; }
function edPick(k, v) {
  if (!edAt) return;
  const pr = PR(), list = pr.paras[edAt.n]; if (!list) return edHide();
  const cur = list[edAt.ix];
  /* A slash on an otherwise empty paragraph turns that paragraph into the block. */
  if (edAt.slash && cur && !cur.kind && !edText(edHTML(cur)).replace(/\/$/, '').trim()) list.splice(edAt.ix, 1, edNew(k, v));
  else list.splice(edAt.ix + 1, 0, edNew(k, v));
  log('Added a block to the proposal', `${k}${v ? ' · ' + v : ''}`);
  edHide(); save(); render();
}
document.addEventListener('mousedown', e => { if (edMenu && !edMenu.hidden && !e.target.closest('.edpop') && !e.target.closest('[data-a="edins"]')) edHide(); });

/* ---------- saving what was typed ---------- */
/* A blur can arrive after a re-render has moved the blocks under it, so the
   index on the element is checked against the block it claims to be. */
function edSave(el) {
  if (!el.isConnected) return;
  const pr = PR(), list = pr.paras[el.dataset.n]; if (!list) return;
  const p = list[+el.dataset.ix]; if (!p) return;
  const w = el.dataset.i;
  if (w === 'edcap') { if (!p.kind) return; p.cap = el.textContent.trim(); save(); return; }
  if (w === 'edcell') {
    if (p.kind !== 'tbl' || !p.head || !p.rows) return;
    const r = +el.dataset.r, c = +el.dataset.c;
    if (r < 0) { if (c >= p.head.length) return; p.head[c] = el.textContent; }
    else { if (!p.rows[r] || c >= p.rows[r].length) return; p.rows[r][c] = el.textContent; }
    save(); return;
  }
  if (w === 'ppara' && p.kind) return;
  if (w === 'edrich' && !p.kind) return;
  const h = edClean(el);
  if (w === 'ppara') { p.h = h; p.t = edText(h); if (p.st !== 'edited') p.st = 'edited'; }
  else { p.h = h; }
  save();
}
function edSaveFocused() { const el = document.activeElement; if (el && el.dataset && ['ppara', 'edrich', 'edcap', 'edcell'].includes(el.dataset.i)) edSave(el); }
document.addEventListener('input', e => {
  const el = e.target;
  if (!el.dataset || !['ppara', 'edrich', 'edcap', 'edcell'].includes(el.dataset.i)) return;
  edSave(el);
  /* "/" on its own opens the insert menu at the caret. */
  if ((el.dataset.i === 'ppara' || el.dataset.i === 'edrich') && /\/$/.test(el.textContent)) {
    const s = window.getSelection(); if (!s.rangeCount) return;
    const r = s.getRangeAt(0).getBoundingClientRect(), b = el.getBoundingClientRect();
    edOpen(el.dataset.n, +el.dataset.ix, r.width || r.height ? r : b, true);
  }
}, true);
document.addEventListener('blur', e => { const el = e.target; if (el.dataset && ['ppara', 'edrich', 'edcap', 'edcell'].includes(el.dataset.i)) edSave(el); }, true);
/* Paste arrives as plain text with its line breaks kept. */
document.addEventListener('paste', e => {
  const el = e.target.closest && e.target.closest('[contenteditable=true]');
  if (!el || !el.dataset || !['ppara', 'edrich', 'edcap', 'edcell'].includes(el.dataset.i)) return;
  e.preventDefault();
  const t = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertHTML', false, esc(t).replace(/\n/g, el.dataset.i === 'ppara' || el.dataset.i === 'edrich' ? '<br>' : ' '));
  edSave(el);
});
/* Enter in a paragraph starts a new one, as it would in a document. */
document.addEventListener('keydown', e => {
  const el = e.target;
  if (!el.dataset || el.dataset.i !== 'ppara' || e.key !== 'Enter' || e.shiftKey) return;
  e.preventDefault(); edSave(el);
  const pr = PR(), list = pr.paras[el.dataset.n], ix = +el.dataset.ix;
  list.splice(ix + 1, 0, edNew('p')); save(); render();
  setTimeout(() => { const nx = document.querySelector(`[data-i="ppara"][data-n="${el.dataset.n}"][data-ix="${ix + 1}"]`); if (nx) nx.focus(); }, 0);
});

/* ---------- actions ---------- */
Object.assign(ACT, {
  edins: d => { const b = document.querySelector(`.edb[data-n="${d.n}"][data-ix="${d.ix}"]`) || document.querySelector('.dbd'); edOpen(d.n, +d.ix, b.getBoundingClientRect(), false); return 'skip'; },
  edblk: d => { const k = d.n + ':' + d.ix; S.ui.edmenu = S.ui.edmenu === k ? null : k; },
  edmv: d => { const l = PR().paras[d.n], i = +d.ix, j = i + (+d.v); if (j < 0 || j >= l.length) return 'skip'; const [x] = l.splice(i, 1); l.splice(j, 0, x); S.ui.edmenu = null; },
  eddup: d => { const l = PR().paras[d.n], i = +d.ix; l.splice(i + 1, 0, JSON.parse(JSON.stringify(l[i]))); S.ui.edmenu = null; },
  eddel: d => { const l = PR().paras[d.n], i = +d.ix; l.splice(i, 1); if (!l.length) l.push(edNew('p')); S.ui.edmenu = null; log('Deleted a block from the proposal', d.n); },
  edtrow: d => { const p = PR().paras[d.n][+d.ix]; if (+d.v > 0) p.rows.push(p.head.map(() => '')); else if (p.rows.length > 1) p.rows.pop(); },
  edtcol: d => { const p = PR().paras[d.n][+d.ix]; if (+d.v > 0) { p.head.push(''); p.rows.forEach(r => r.push('')); } else if (p.head.length > 1) { p.head.pop(); p.rows.forEach(r => r.pop()); } }
});
document.addEventListener('change', e => {
  const t = e.target; if (!t.dataset || t.dataset.c !== 'edimg') return;
  const f = t.files[0]; if (!f) return;
  edImgRead(f, data => {
    const p = PR().paras[t.dataset.n][+t.dataset.ix], key = 'pimg:' + S.oppId + ':' + uid();
    IMGS[key] = data; IDB.put(key, data); p.key = key; p.cap = p.cap || f.name.replace(/\.[^.]+$/, '');
    log('Added an image to the proposal', f.name); save(); render();
  });
});

/* ============================================================================
   The three things that make it feel like a document, not a form
   ----------------------------------------------------------------------------
   The blocks, the insert menu, the tables, the drawings and the images were all
   here already. What was missing was the muscle memory: the shortcuts your
   hands already know, a slash that works wherever the caret is, and markdown
   shorthand that turns into the block you meant.
   ========================================================================== */
const ED_RICH = ['ppara', 'edrich', 'edcap', 'edcell'];
const edIsRich = el => el && el.dataset && ED_RICH.includes(el.dataset.i);

/* ---- 1. the shortcuts ---- */
const ED_KEYS = { b: 'bold', i: 'italic', u: 'underline' };
document.addEventListener('keydown', e => {
  const el = e.target; if (!edIsRich(el)) return;
  const mod = e.metaKey || e.ctrlKey; if (!mod) return;
  const k = (e.key || '').toLowerCase();
  if (k === 'x' && e.shiftKey) { e.preventDefault(); document.execCommand('strikeThrough'); edSaveFocused(); return; }
  if (k === 'k') {
    e.preventDefault();
    const s = window.getSelection();
    if (!s || s.isCollapsed) { toast('Select the words the link should sit on.'); return; }
    const u = prompt('Link to'); if (u) { document.execCommand('createLink', false, u); edSaveFocused(); }
    return;
  }
  if (ED_KEYS[k] && !e.shiftKey && !e.altKey) { e.preventDefault(); document.execCommand(ED_KEYS[k]); edSaveFocused(); }
});

/* ---- 2. a slash that reads the caret, not the end of the block ----
   Typing "/" mid-paragraph should offer the menu too, and only when it starts
   a word — so a date or a fraction is left alone. */
function edSlashHere(el) {
  const s = window.getSelection();
  if (!s || !s.rangeCount || !s.isCollapsed) return false;
  const n = s.anchorNode; if (!n || n.nodeType !== 3) return false;
  const before = n.textContent.slice(0, s.anchorOffset);
  if (!/\/$/.test(before)) return false;
  const prev = before.slice(-2, -1);
  return prev === '' || /\s/.test(prev);
}
document.addEventListener('input', e => {
  const el = e.target;
  if (!el.dataset || !['ppara', 'edrich'].includes(el.dataset.i)) return;
  if (!edSlashHere(el)) return;
  const s = window.getSelection(), r = s.getRangeAt(0).getBoundingClientRect(), b = el.getBoundingClientRect();
  edOpen(el.dataset.n, +el.dataset.ix, r.width || r.height ? r : b, true);
}, true);

/* ---- 3. markdown shorthand ----
   At the head of a paragraph: "- " or "* " makes a bulleted list, "1. " a
   numbered one, "# ".."### " a heading, "> " a quote, "--- " a divider, and
   "| " a three-column table. The block becomes what you typed and the
   shorthand disappears, the way it does in a document editor. */
const ED_MD = [
  [/^\s*[-*]\s$/, 'ul'], [/^\s*1[.)]\s$/, 'ol'], [/^\s*#{1,3}\s$/, 'h3'],
  [/^\s*>\s$/, 'quote'], [/^\s*(---|___|\*\*\*)\s?$/, 'div'], [/^\s*\|\s$/, 'tbl'],
  [/^\s*!\s$/, 'callout']
];
document.addEventListener('input', e => {
  const el = e.target;
  if (!el.dataset || el.dataset.i !== 'ppara') return;
  const txt = el.textContent;
  const hit = ED_MD.find(m => m[0].test(txt)); if (!hit) return;
  const pr = PR(), list = pr.paras[el.dataset.n], ix = +el.dataset.ix;
  if (!list || !list[ix]) return;
  /* The pattern is anchored to the whole block, so a match means the block holds
     the shorthand and nothing else. "Rates are 1. " never matches, and the
     paragraph is left alone. The earlier guard read the saved value, which the
     first input handler had already overwritten with the shorthand itself. */
  list[ix] = edNew(hit[1]);
  log('Turned shorthand into a block in the proposal', hit[1]);
  save(); render();
  setTimeout(() => {
    const sel = `.edb[data-n="${el.dataset.n}"][data-ix="${ix}"] [contenteditable=true]`;
    const nx = document.querySelector(sel); if (nx) { nx.focus(); }
  }, 0);
}, true);

/* ---- a hint, once, where the hands look for it ---- */
function edHint() {
  return `<div class="edhint"><b>/</b> for blocks · <b>⌘B</b> bold · <b>⌘I</b> italic · <b>⌘K</b> link · <b>-</b> or <b>1.</b> for a list · <b>|</b> for a table</div>`;
}
