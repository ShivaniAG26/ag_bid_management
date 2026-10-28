// A citation opens the document beside the work instead of navigating away.
//
// Every figure in this prototype carries a citation, and following one used to
// mean leaving the screen you were on. The sheet keeps your place: it reads the
// page the citation points at, answers questions from that document alone, shows
// what the company already knows about the subject, and hands you off to the
// full viewer only when you ask for it.

const DS = () => S.sheet;
function dsDoc() { const s = DS(); if (!s) return null; const r = parseRef(s.ref); return r.doc ? { ...r, d: r.doc } : null; }
function dsPages(d) { return (O().meta.seed === 'indrayani' && typeof PAGES !== 'undefined' && PAGES[d.id]) || { toc: [], pages: {} }; }
const dsText = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/* Records anchored to this document, which is what makes it worth reading. */
function dsRecords(d, page) {
  const o = O(), hit = s => { const p = String(s || '').split(':'); return p[0] === d.code && (page == null || +p[1] === page); };
  return [
    ...o.reqs.filter(r => hit(r.src)).map(r => ({ k: 'Requirement', id: r.id, t: r.text, tab: 'reqs' })),
    ...o.risks.filter(r => hit(r.src)).map(r => ({ k: 'Risk', id: r.id, t: r.risk, tab: 'risks' })),
    ...o.clars.filter(c => hit(c.src)).map(c => ({ k: 'Query', id: c.id, t: c.q, tab: 'clar' })),
    ...o.basis.filter(b => hit(b.src)).map(b => ({ k: 'Design basis', id: b.f, t: `${b.f}: ${b.v}`, tab: 'eng' })),
    ...o.elig.filter(e => hit(e.src)).map(e => ({ k: 'Eligibility', id: e.c.split(/[:(]/)[0].trim(), t: `${e.c} — ${e.need}`, tab: 'elig' }))
  ];
}
/* What the document is about, read from the document itself rather than its
   title: the pages it holds, the rows of a spreadsheet, and every record
   anchored to it. A title alone matches almost nothing. */
function dsSubject(d) {
  const parts = [d.name, d.disc || '', d.type || ''];
  dsRecords(d).forEach(r => parts.push(r.t));
  const P = dsPages(d);
  Object.values(P.pages).forEach(h => parts.push(dsText(h).slice(0, 500)));
  P.toc.forEach(t => parts.push(t[1]));
  if (typeof XL !== 'undefined' && XL[d.id]) XL[d.id].forEach(sh => { parts.push(sh.name); sh.rows.slice(0, 60).forEach(r => parts.push(String(r[1] || ''))); });
  if (typeof SHEETS !== 'undefined' && d.disc === 'Drawings') SHEETS.forEach(x => parts.push(x.title));
  return parts.join(' ');
}

/* ---------- preview ---------- */
function dsPreview(R) {
  const d = R.d, s = DS(), P = dsPages(d), keys = Object.keys(P.pages).map(Number).sort((a, b) => a - b);
  if (R.sheet || d.kind === 'dwg') {
    const no = R.sheet || s.page;
    const ok = typeof DRAW !== 'undefined' && DRAW[no];
    return `<div class="ds-dwg">${ok ? drawSheet(no) : '<div class="empty"><p>This sheet is not drawn in the prototype. Open it in Documents to measure on it.</p></div>'}</div>
     ${typeof SHEETS !== 'undefined' ? `<div class="ds-pages">${SHEETS.filter(x => typeof DRAW !== 'undefined' && DRAW[x.no]).map(x => `<button class="${x.no === no ? 'on' : ''}" data-a="dspage" data-p="${x.no}">${esc(x.no)}</button>`).join('')}</div>` : ''}`;
  }
  if (d.kind === 'xls' && typeof XL !== 'undefined' && XL[d.id]) {
    const tab = Math.min(XL[d.id].length - 1, Math.max(0, (+s.page || 1) - 1)), sh = XL[d.id][tab];
    return `${XL[d.id].length > 1 ? `<div class="ds-pages">${XL[d.id].map((x, i) => `<button class="${i === tab ? 'on' : ''}" data-a="dspage" data-p="${i + 1}">${esc(x.name)}</button>`).join('')}</div>` : ''}
     <div class="tw"><table class="t"><thead><tr>${sh.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${sh.rows.map(r => `<tr>${r.map(v => `<td>${v == null ? '' : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  if (!keys.length) return `<div class="empty"><p>${d.up ? 'This file was uploaded in this browser. The full reader opens it page by page.' : 'No pages are held for this document in the prototype.'}</p><button class="btn" data-a="dsgo">Open in Documents</button></div>`;
  const pg = keys.includes(+s.page) ? +s.page : keys[0], i = keys.indexOf(pg);
  const recs = dsRecords(d, pg);
  return `<div class="ds-nav"><button class="ibtn" data-a="dspage" data-p="${keys[i - 1] || pg}" ${i > 0 ? '' : 'disabled'} aria-label="Previous page">${IC.back}</button>
    <span class="sub">Page <b>${pg}</b>${d.pages ? ' of ' + d.pages : ''}</span>
    <button class="ibtn" data-a="dspage" data-p="${keys[i + 1] || pg}" ${i < keys.length - 1 ? '' : 'disabled'} aria-label="Next page">${IC.next}</button>
    <span class="ds-sp"></span>${P.toc.length ? `<select data-c="dstoc" aria-label="Jump to a section" style="width:auto;max-width:190px">${P.toc.map(t => `<option value="${t[2]}" ${t[2] === pg ? 'selected' : ''}>§${esc(t[0])} ${esc(t[1])}</option>`).join('')}</select>` : ''}</div>
   <article class="ds-paper ${s.flash ? 'hl' : ''}">${P.pages[pg]}</article>
   ${recs.length ? `<div class="ds-rec"><span class="eyebrow">On this page</span>${recs.map(r => `<button class="ds-recr" data-a="dsrec" data-t="${r.tab}"><span class="mono sub">${esc(r.k)} ${esc(r.id)}</span><span>${esc(dsText(r.t).slice(0, 120))}</span></button>`).join('')}</div>` : ''}`;
}

/* ---------- ask, answered from this document only ---------- */
const DS_STOP = new Set('what which where when does the this that with from have will shall would could should into than then they them about tell show give'.split(' '));
function dsAnswer(q) {
  const R = dsDoc(); if (!R) return null;
  const P = dsPages(R.d), keys = Object.keys(P.pages).map(Number).sort((a, b) => a - b);
  const w = [...new Set(String(q).toLowerCase().match(/[a-z0-9₹.§]{3,}/g) || [])].filter(x => !DS_STOP.has(x));
  if (!w.length) return { q, hits: [], n: keys.length };
  const hits = [];
  keys.forEach(k => {
    const tx = dsText(P.pages[k]), lo = tx.toLowerCase();
    const n = w.filter(x => lo.includes(x)).length; if (!n) return;
    const at = lo.indexOf(w.find(x => lo.includes(x)));
    hits.push({ page: k, n, snip: tx.slice(Math.max(0, at - 90), at + 220), terms: w.filter(x => lo.includes(x)) });
  });
  return { q, hits: hits.sort((a, b) => b.n - a.n).slice(0, 5), n: keys.length, miss: w.filter(x => !keys.some(k => dsText(P.pages[k]).toLowerCase().includes(x))) };
}
/* The conversation lives at the foot of the sheet, where a chat belongs, and
   stays in view whichever tab is open. Each answer is the document's own
   passages: nothing is invented, and silence is reported as silence. */
function dsReply(q) {
  const A = dsAnswer(q), R = dsDoc();
  if (!A) return { role: 'ai', say: 'No document is open.', hits: [] };
  if (!A.hits.length) return { role: 'ai', say: `Not in this document. Nothing on ${A.n} page${A.n === 1 ? '' : 's'} of ${R.d.short} matches that. It may sit in another volume — Ask the pack on the Documents screen reads all of them.`, hits: [], none: 1 };
  const top = A.hits[0];
  return { role: 'ai', say: `Found on ${A.hits.length} page${A.hits.length === 1 ? '' : 's'} of ${R.d.short}. The closest is page ${top.page}.`, hits: A.hits, miss: A.miss };
}
/* The last question is put at the top of the view, not scrolled off above the
   answer: a long answer is read from its beginning, not its end. */
function dsScroll() {
  const t = document.getElementById('dsthread'); if (!t) return;
  const you = [...t.querySelectorAll('.ds-m.you')].pop();
  t.scrollTop = you ? Math.max(0, you.offsetTop - t.offsetTop - 4) : t.scrollHeight;
}
function dsThread() {
  const s = DS(), c = s.chat || [];
  if (!c.length) return '';
  const think = DS().think ? `<div class="ds-think" role="status">${dsOrb('connecting', 32, 'think')}<span>Reading ${esc(parseRef(DS().ref).doc.short)}…</span></div>` : '';
  return `<div class="ds-thread" id="dsthread">${c.map(m => m.role === 'you'
    ? `<div class="ds-m you"><span>${esc(m.say)}</span></div>`
    : `<div class="ds-m ai"><div class="ds-m-h">${dsOrb('breathing', 20, 'm' + m.n)}<span>${esc(m.say)}</span></div>
       ${m.hits.map(h => `<button class="ds-hit" data-a="dspage" data-p="${h.page}"><span class="row between"><span class="mono sub">Page ${h.page}</span><span class="sub">${h.terms.length} term${h.terms.length === 1 ? '' : 's'} match</span></span><span>…${esc(h.snip)}…</span></button>`).join('')}
       ${m.miss && m.miss.length ? `<span class="sub">Not found anywhere in this document: ${m.miss.map(esc).join(', ')}.</span>` : ''}
       ${m.hits.length ? '<span class="sub">These are the passages, not a summary. Read the page before you rely on it.</span>' : ''}</div>`).join('')}${think}</div>`;
}
/* The composer is the assistant's own bar: the border beam at rest, and the
   voice glow while listening. Same effects, same vocabulary, so the document
   sheet and the floating assistant are recognisably one assistant. */
const dsFx = (kind, opts, id, cls) => { const f = kind === 'orb' ? orbFit(opts, cls) : { opts, cls, style: '' };
  return `<span class="${f.cls || 'fx-host'}" style="${f.style}" data-fx="${kind}" data-fxo='${JSON.stringify(f.opts)}' data-fxid="${id}" aria-hidden="true"></span>`; };
/* An orb sits in the flow of the line it belongs to. The bare fx-host is
   absolutely positioned, which is right for a beam filling its bar and wrong
   for a face beside a sentence. */
const dsOrb = (state, size, id) => dsFx('orb', { state, size }, 'ds-' + id, 'lv-orb lv-orb' + size);
function dsComposer(R) {
  const s = DS(), has = Object.keys(dsPages(R.d).pages).length, c = s.chat || [], busy = !!s.think, v = s.voice;
  const sug = ['What does this say about the guarantee?', 'Which clause governs?', 'What are the deadlines?'];
  const bar = v
    ? `<div class="lv-bar is-voice">${dsFx('voice', { processing: v === 'processing', mic: !!s.voiceLive, type: 'default', strength: 1.3 }, 'ds-voice')}${dsOrb(v === 'processing' ? 'composing' : 'listening', 32, 'vorb')}
       <div class="lv-vtx" aria-live="polite"><b>${v === 'processing' ? 'Got it' : 'Listening…'}</b><span>${esc(s.voiceText || (s.voiceLive ? 'Ask about this document out loud' : 'Voice preview: speaking a sample question'))}</span></div>
       <button class="lv-ic" data-a="dsvcancel" aria-label="Cancel voice">${IC.x}</button><button class="lv-stop" data-a="dsvstop" aria-label="Stop and ask"><i></i></button></div>`
    : `<div class="lv-bar">${dsFx('beam', { size: 'md', strength: busy ? 1 : 0.85, active: true }, 'ds-beam')}
       <span class="lv-orbbtn" aria-hidden="true">${dsOrb(busy ? 'composing' : 'breathing', 20, 'bar')}</span>
       <form id="dsaskform" class="lv-form"><input class="lv-in" type="text" id="dsq" placeholder="${busy ? 'Reading the document…' : `Ask about ${esc(R.d.short)}…`}" value="${esc(s.q || '')}" aria-label="Ask about this document" ${busy ? 'disabled' : ''} autocomplete="off">
        <button type="button" class="lv-ic" data-a="dsspeak" aria-label="${s.speak ? 'Stop reading answers aloud' : 'Read answers aloud'}" title="${dsSpeakOk() ? (s.speak ? 'Answers are read aloud' : 'Read answers aloud') : 'This browser cannot speak'}" ${dsSpeakOk() ? '' : 'disabled'} style="${s.speak ? 'color:var(--text-brand)' : ''}">${IC.sound}</button>
        <button type="button" class="lv-ic lv-mic" data-a="dsmic" aria-label="Ask by voice" ${busy ? 'disabled' : ''}>${IC.mic}</button>
        <button class="lv-go" type="submit" aria-label="Send" ${busy ? 'disabled' : ''}>${IC.next}</button></form></div>`;
  return `<div class="ds-chat">
   ${dsThread()}
   ${!c.length && !busy && !v && has ? `<div class="aisug ds-sug">${sug.map(x => `<button data-a="dssend" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
   ${bar}
   <span class="ds-note">${has ? `Answers come from this document alone · ${has} page${has === 1 ? '' : 's'}` : 'No pages are held for this document'}${c.length ? ` · <button class="linkbtn" data-a="dsclear">Clear the chat</button>` : ''}</span>
  </div>`;
}

/* ---------- what the company already knows about this subject ----------
   Four-letter stems collide: "back-solve" is not "solvency", and "analyse" is
   not "analyser". These terms are only counted when the whole word agrees. */
const DS_STRICT = { solv: /solvenc/i, anal: /analys[ei]r|analyser|analyzer/i, scop: /scope/i, trea: /treat/i, free: /freeboard|free fall|free-fall/i, high: /highway/i };
function dsKB(R) {
  const o = O(), d = R.d;
  if (typeof stemsOf !== 'function' || typeof KB_BLOCK === 'undefined') return '<div class="empty"><p>The Knowledge Library is not loaded.</p></div>';
  const s = stemsOf(dsSubject(d));
  const out = [], seen = {};
  /* A shared subject term is required, not just any overlapping word. Without
     it every document matches every entry, which is noise wearing a tie. */
  const sub = dsSubject(d);
  const add = (grp, tab, list, f) => list.forEach(x => {
    const [t, m, txt] = f(x), ts = stemsOf(txt);
    const why = [...ts].filter(w => s.has(w) && AI_DOMAIN.has(w) && (!DS_STRICT[w] || (DS_STRICT[w].test(txt) && DS_STRICT[w].test(sub))));
    if (!why.length) return;
    const n = matchScore(s, txt); if (n < 3) return;
    const k = grp + '|' + t; if (seen[k] && seen[k].n >= n) return;
    if (seen[k]) out.splice(out.indexOf(seen[k]), 1);
    seen[k] = { grp, tab, t, m, n, why }; out.push(seen[k]);
  });
  add('Reusable content', 'blocks', KB_BLOCK, b => [b.title, `${b.sec} · used in ${b.used} bids · approved ${b.appr}`, b.title + ' ' + b.sec]);
  add('Rates', 'rate', KB_RATE, r => [r.item, `bid ₹${fmtN(r.bid)} vs actual ₹${fmtN(r.act)} per ${r.unit} · ${r.src}`, r.item]);
  add('Lessons', 'less', KB_LESSON, l => [`${l.proj} · ${l.theme}`, l.lesson, l.lesson + ' ' + l.theme]);
  add('Reference projects', 'proj', Object.entries(KB_PROJ), ([k, p]) => [(PAST[k] || {}).name || k, `${p.scope} · ${p.cert}`, p.scope + ' ' + ((PAST[k] || {}).name || '')]);
  add('Credentials', 'cred', KB_CRED, c => [c.item, `${c.detail} · ${c.ref}`, c.item + ' ' + c.detail]);
  const top = out.sort((a, b) => b.n - a.n).slice(0, 8);
  if (!top.length) return `<div class="empty"><p>Nothing in the Knowledge Library matches this document yet.</p><button class="btn" data-a="dskb" data-t="blocks">Open the Knowledge Library</button></div>`;
  let grp = '';
  return `<p class="sub">${typeof aiMk === 'function' ? aiMk() : ''}Matched on what this document says and the ${dsRecords(d).length} record${dsRecords(d).length === 1 ? '' : 's'} anchored to it. Opening one leaves this tender.</p>
   ${top.map(x => { const h = x.grp !== grp ? `<span class="eyebrow">${esc(x.grp)}</span>` : ''; grp = x.grp; return h + `<button class="ds-recr" data-a="dskb" data-t="${x.tab}"><span><b>${esc(x.t)}</b></span><span class="sub">${esc(dsText(x.m).slice(0, 150))}</span><span class="ds-why">matched on ${x.why.slice(0, 4).map(esc).join(', ')}</span></button>`; }).join('')}`;
}

/* ---------- the sheet ---------- */
function docSheet() {
  const R = dsDoc(); if (!R) return '';
  const s = DS(), d = R.d, tab = s.tab === 'kb' ? 'kb' : 'view';
  const n = dsRecords(d).length;
  return `<div class="scrim" data-a="dsclose" style="background:rgba(8,16,18,.26)"></div>
   <aside class="docsheet" role="dialog" aria-modal="true" aria-label="${esc(d.name)}">
    <div class="ds-h"><div class="stack" style="gap:3px;min-width:0">
      <span class="eyebrow">${esc(d.id)} · ${esc(d.disc || d.type || 'Document')}${R.label ? ' · ' + esc(R.label) : ''}</span>
      <h3 title="${esc(d.name)}">${esc(d.name)}</h3>
      <span class="sub">${d.pages ? d.pages + ' pages · ' : ''}rev ${esc(d.rev || '—')}${d.recv ? ' · received ' + esc(d.recv) : ''}${n ? ` · ${n} record${n === 1 ? '' : 's'} anchored here` : ''}</span>
     </div><div class="row" style="flex-wrap:nowrap;gap:4px"><button class="btn sm ghost" data-a="dsgo" title="Open the full reader">${IC.doc}Documents</button><button class="ibtn" data-a="dsclose" aria-label="Close">${IC.x}</button></div></div>
    <div class="ds-t" role="tablist">
     <button class="${tab === 'view' ? 'on' : ''}" role="tab" aria-selected="${tab === 'view'}" data-a="dstab" data-v="view">Document</button>
     <button class="${tab === 'kb' ? 'on' : ''}" role="tab" aria-selected="${tab === 'kb'}" data-a="dstab" data-v="kb">Knowledge Library</button>
    </div>
    <div class="ds-b">${tab === 'kb' ? dsKB(R) : dsPreview(R)}</div>
    ${dsComposer(R)}
   </aside>`;
}

/* ---------- voice ----------
   The same arrangement the floating assistant uses: the live microphone drives
   the glow and the browser writes the words. Where either is missing — a
   preview frame often blocks the microphone — a sample question is spoken into
   the bar so the effect can still be seen, and the bar says that is what it is. */
let dsRec = null;
const dsVoiceOk = () => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
const dsSpeakOk = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
function dsSay(t) {
  if (!dsSpeakOk() || !DS() || !DS().speak) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(t).slice(0, 400)); u.rate = 1.02; speechSynthesis.speak(u); } catch (e) { }
}
async function dsVoiceStart() {
  const s = DS(); if (!s || s.voice || s.think) return;
  s.voice = 'listening'; s.voiceText = ''; s.voiceLive = false; render();
  const stream = window.BPFX && BPFX.mic ? await BPFX.mic.start() : null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!DS() || !DS().voice) { if (window.BPFX) BPFX.mic.stop(); return; }
  if (stream && SR) {
    DS().voiceLive = true; render();
    const r = new SR(); r.lang = 'en-IN'; r.interimResults = true; r.continuous = false;
    dsRec = { r, final: '' };
    r.onresult = e => { let t = ''; for (const x of e.results) t += x[0].transcript; dsRec.final = t; if (DS()) { DS().voiceText = t; render(); } };
    r.onend = () => dsVoiceFinish(dsRec && dsRec.final);
    r.onerror = () => dsVoiceFallback();
    try { r.start(); } catch (e) { dsVoiceFallback(); }
  } else dsVoiceFallback();
}
function dsVoiceFallback() {
  if (window.BPFX) BPFX.mic.stop();
  const s = DS(); if (!s || !s.voice) return;
  s.voiceLive = false;
  const R = dsDoc(), q = `What does ${R ? R.d.short : 'this document'} say about the guarantee?`, words = q.split(' ');
  let i = 0, t = 0;
  dsRec = { sim: setInterval(() => {
    const cur = DS(); if (!cur || !cur.voice) return clearInterval(dsRec.sim);
    t++; if (window.BPFX) BPFX.bump(0.4 + 0.5 * Math.abs(Math.sin(t * 1.7)) * Math.random() + 0.1);
    if (t % 3) return;
    if (i < words.length) { i++; cur.voiceText = words.slice(0, i).join(' '); render(); }
    else if (t > words.length * 3 + 6) { clearInterval(dsRec.sim); dsVoiceFinish(q); }
  }, 95) };
  render();
}
function dsVoiceFinish(text) {
  const s = DS(); if (!s || !s.voice) return;
  if (window.BPFX) BPFX.mic.stop();
  if (dsRec && dsRec.sim) clearInterval(dsRec.sim);
  dsRec = null; const q = (text || '').trim();
  s.voice = q ? 'processing' : null; render();
  setTimeout(() => { const c = DS(); if (!c) return; c.voice = null; c.voiceText = ''; render(); if (q) dsSend(q); }, q ? 450 : 0);
}
function dsVoiceStop() { if (dsRec && dsRec.r) { try { dsRec.r.stop(); } catch (e) { dsVoiceFinish(dsRec.final); } } else dsVoiceFinish(DS() && DS().voiceText); }
function dsVoiceCancel() {
  if (dsRec && dsRec.r) { dsRec.r.onend = null; try { dsRec.r.abort(); } catch (e) { } }
  if (dsRec && dsRec.sim) clearInterval(dsRec.sim);
  dsRec = null; if (window.BPFX) BPFX.mic.stop();
  const s = DS(); if (s) { s.voice = null; s.voiceText = ''; } render();
}
/* Asking takes a beat, so the orb can show it is reading before it answers. */
function dsSend(q) {
  const s = DS(); if (!s || !q.trim() || s.think) return;
  s.chat = s.chat || [];
  s.chat.push({ role: 'you', say: q.trim(), n: s.chat.length });
  s.q = ''; s.think = 1; render(); dsScroll();
  setTimeout(() => {
    const c = DS(); if (!c) return;
    const r = dsReply(q.trim()); r.n = c.chat.length;
    c.chat.push(r); c.think = 0;
    log('Asked about a document', `${parseRef(c.ref).doc.short}: ${q.trim().slice(0, 70)}`);
    dsSay(r.say); render(); dsScroll();
    const i = document.getElementById('dsq'); if (i) i.focus();
  }, 620);
}

/* ---------- actions ---------- */
function dsOpen(ref) {
  const r = parseRef(ref); if (!r.doc) return;
  S.sheet = { ref, tab: 'view', page: r.sheet || r.page || 1, flash: r.sec || null, q: '', chat: [], speak: false, voice: null, voiceText: '', think: 0 };
}
Object.assign(ACT, {
  dsclose: () => { dsVoiceCancel(); S.sheet = null; if (dsSpeakOk()) { try { speechSynthesis.cancel(); } catch (e) { } } },
  dstab: d => { S.sheet.tab = d.v; },
  dspage: d => { S.sheet.page = /^\d+$/.test(d.p) ? +d.p : d.p; S.sheet.tab = 'view'; },
  dssend: d => { dsSend(d.q); return 'skip'; },
  dsmic: () => { dsVoiceStart(); return 'skip'; },
  dsvstop: () => { dsVoiceStop(); return 'skip'; },
  dsvcancel: () => { dsVoiceCancel(); return 'skip'; },
  dsspeak: () => { S.sheet.speak = !S.sheet.speak; if (!S.sheet.speak && dsSpeakOk()) { try { speechSynthesis.cancel(); } catch (e) { } } },
  dsclear: () => { S.sheet.chat = []; if (dsSpeakOk()) { try { speechSynthesis.cancel(); } catch (e) { } } },
  dsrec: d => { S.sheet = null; setTab(d.t); },
  dskb: d => { S.sheet = null; S.view = 'kb'; S.ui.sub = S.ui.sub || {}; S.ui.sub.kb = d.t; S.scrollTop = true; },
  /* The full reader, when the sheet is not enough. */
  dsgo: () => { const ref = S.sheet.ref; S.sheet = null; openRef(ref); }
});
/* A citation anywhere outside the Documents screen opens the sheet; inside it,
   the full reader is already the workflow, so nothing changes there. */
const _refNav = ACT.ref;
ACT.ref = d => { if (S.view === 'opp' && S.tab === 'docs') return _refNav(d); dsOpen(d.ref); };
const _openDocNav = ACT.opendoc;
ACT.opendoc = d => {
  if (S.view === 'opp' && S.tab === 'docs') return _openDocNav(d);
  const x = (O().docs || []).find(y => y.id === d.id); if (!x) return _openDocNav(d);
  dsOpen(`${x.code}:1`);
};
document.addEventListener('submit', e => {
  if (e.target.id !== 'dsaskform') return; e.preventDefault();
  dsSend((document.getElementById('dsq') || {}).value || '');
});
document.addEventListener('input', e => { if (e.target.id === 'dsq' && DS()) { DS().q = e.target.value; if (window.BPFX) BPFX.bump(0.55 + Math.random() * 0.4); } });
document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.c === 'dstoc') { S.sheet.page = +e.target.value; render(); } });
