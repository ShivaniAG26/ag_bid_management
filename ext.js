// Actions for sub-tabs, email, sub-RFPs, quote reading, contract redlines, testing logs and evidence uploads.

const sig = () => `\n\nRegards,\n${R().name}\n${R().title}, ${S.cfg.company}`;
const clientTo = () => O().meta.contact || `${O().meta.client} (tender cell)`;
function pushMail(m) { O().mail.push({ id: uid(), dir: 'out', from: R().name, ts: nowTs(), attach: [], ...m }); }

Object.assign(ACT, {
  tab: d => { if (S.tab === 'docs' && d.t !== 'docs') S.v.back = null; if (d.sub) { S.ui.sub = S.ui.sub || {}; S.ui.sub[d.t] = d.sub; } setTab(d.t); },
  sub: d => { S.ui.sub = S.ui.sub || {}; S.ui.sub[d.t] = d.v; },
  pipemode: d => { S.pipeMode = d.v; },
  ohall: () => { S.ui.ohAll = !S.ui.ohAll; },
  ptype: d => { S.pipeType = d.v; },
  reqsel: d => { S.ui.reqSel = d.id; },
  rejreq: d => { const r = O().reqs.find(x => x.id === d.id); if (r && can('reqs')) { r.st = 'rejected'; log('Rejected requirement', r.id); } },
  acchq: () => { let n = 0; O().reqs.forEach(r => { if (r.st === 'proposed' && r.ev === 'high') { r.st = 'accepted'; n++; } }); log('Accepted high-quality requirements', String(n)); toast(`${n} high-quality requirements accepted. Medium and low evidence stay for review.`); },
  qacc: d => { const r = coll(O(), d.k).find(x => x.id === d.id); if (r && canEdit(d.k)) { r.st = 'accepted'; log(`Accepted ${FORMS[d.k].t.toLowerCase()}`, r.f || r.sym || ''); } },
  qrej: d => { const r = coll(O(), d.k).find(x => x.id === d.id); if (r && canEdit(d.k)) { r.st = 'rejected'; log(`Rejected ${FORMS[d.k].t.toLowerCase()}`, r.f || r.sym || ''); } },
  metaedit: () => { S.ui.editMeta = !S.ui.editMeta; S.ui.teamDraft = null; S.ui.teamOpen = false; },
  metasave: () => { const m = O().meta; document.querySelectorAll('[data-mf]').forEach(el => { const k = el.dataset.mf; if (k === 'type') m.types[0] = el.value; else if (['value', 'fit', 'mld'].includes(k)) m[k] = el.value === '' ? null : num(el.value); else m[k] = el.value; }); if (S.ui.teamDraft) m.team = S.ui.teamDraft.slice(); S.ui.teamDraft = null; S.ui.teamOpen = false; S.ui.editMeta = false; log('Updated opportunity', m.name); toast('Opportunity saved. Header, insights, pipeline and value estimate now use the new values.'); },
  /* clarifications */
  thread: d => { S.ui.thread = S.ui.thread === d.id ? null : d.id; },
  clarmail: d => { const c = O().clars.find(x => x.id === d.id); openMail({ title: 'Email clarification ' + c.id, to: clientTo(), subject: `Pre-bid query ${c.id}: ${O().meta.name}`, body: `Dear Sir/Madam,\n\nWith reference to ${c.src ? parseRef(c.src).label : 'the tender documents'}:\n\n${c.q}${sig()}`, thread: 'clar:' + c.id, after: { clar: c.id } }); },
  clarall: () => { const l = O().clars.filter(c => c.status === 'draft'); l.forEach(c => c.status = 'open'); log('Sent queries via portal', l.map(c => c.id).join(', ')); toast(`${l.length} queries submitted through the tender portal query form.`); },
  mailreply: d => { const th = d.th, base = th.split(':')[0], o = O(), last = threadOf(th).slice(-1)[0] || {}; const body = REPLIES[th] || REPLIES[base] || 'Noted.';
    const m = { id: uid(), thread: th, dir: 'in', from: base === 'rfq' ? (last.to || 'Supplier').split(',')[0] : base === 'notice' ? 'Independent Engineer' : base === 'contract' ? `${o.meta.client} Legal` : o.meta.client, to: R().name, subject: 'RE: ' + (last.subject || ''), body, ts: nowTs(), attach: base === 'rfq' ? [`Quotation_${(last.to || 'supplier').split(',')[0].replace(/\W+/g, '_')}.pdf`] : base === 'contract' ? [`Contract v${o.contract.ver + 1}.pdf`] : [] };
    o.mail.push(m);
    if (base === 'contract') { const c = o.contract.clauses.find(x => x.st === 'Negotiating'); o.contract.ver++; o.contract.versions.push({ v: o.contract.ver, by: o.meta.client, ts: nowTs(), note: c ? `Response: ${c.ref} agreed` : 'Response: no change' }); if (c) { c.st = 'Agreed'; c.cm.push([o.meta.client, nowTs(), `Accepted in v${o.contract.ver}.`]); } }
    toast(base === 'rfq' ? 'Supplier quote received. Read it in AI quote comparison.' : base === 'clar' ? 'Reply received. Use “Record as the answer” to close the query.' : 'Reply filed to the record.'); },
  mailrec: d => { const o = O(), c = o.clars.find(x => x.id === d.id), m = o.mail.find(x => x.id === d.m); if (!c || !m) return 'skip'; c.a = m.body; c.status = 'answered'; dropDependentDrafts(c.id); log('Recorded answer from email', c.id); toast(`${c.id} answered. Dependent proposal paragraphs will regenerate.`); },
  mailcopy: () => { const t = `Subject: ${document.getElementById('ml-sub').value}\n\n${document.getElementById('ml-body').value}`; try { navigator.clipboard.writeText(t).then(() => toast('Email text copied'), () => toast('Copy blocked: select the text and copy it manually.')); } catch (e) { toast('Copy blocked: select the text and copy it manually.'); } return 'skip'; },
  /* bid / no-bid */
  g1save: () => { const t = document.getElementById('g1memo'); O().g1.memo = t ? t.value : ''; log('Saved decision memo'); toast('Decision memo saved'); },
  g1regen: () => { O().g1.memo = ''; toast('Memo regenerated from the current records'); },
  /* procurement */
  rfqpick: d => { O().rfq.pkg = d.id; S.ui.sub = S.ui.sub || {}; S.ui.sub.proc = 'rfq'; },
  rfqsend: d => { const o = O(), p = o.pkgs.find(x => x.id === d.id), rx = pkgMatch(p), sups = o.vendors.filter(v => (rx[2].test(v.cat) || rx[2].test(v.name)) && o.rfq.sel[p.id + v.id] !== false);
    openMail({ title: 'Send sub-RFP: ' + p.pkg, to: sups.map(s => s.name).join(', '), subject: `RFQ: ${p.pkg} · ${o.meta.name}`, body: `Dear supplier,\n\nPlease quote for ${p.pkg.toLowerCase()} for ${o.meta.name}. Requirements, specification extract and drawings are attached. Quotes are due by ${o.rfq.due || 'the date in the RFQ'}, FOR site, valid 90 days. Please confirm compliance line by line and list any exclusions.${sig()}`, attach: [`Sub-RFP ${p.pkg}.pdf`, 'Specification extract.pdf', 'Drawings.zip'], thread: 'rfq:' + p.id, after: { rfq: p.id } }); },
  awardadd: () => { const o = O(), L = o.lev, tot = L.sups.map(s => num(s.quoted) + L.adders.reduce((a, ad) => a + num(ad.vals[s.id]), 0)), i = tot.indexOf(Math.min(...tot)), sorted = tot.slice().sort((a, b) => a - b); o.awards.push({ id: uid(), pkg: L.pkg, rec: L.sups[i].name, why: 'Lowest levelled cost after scope gaps, freight and energy pass-through', save: sorted[1] != null ? cr(sorted[1] - sorted[0]) + ' vs next' : '', st: 'Proposed' }); log('Added award recommendation', L.pkg); },
  awardok: d => { const a = O().awards.find(x => x.id === d.id); a.st = 'Approved'; const p = O().pkgs.find(x => x.pkg === a.pkg); if (p) p.st = 'Awarded'; log('Approved award', `${a.pkg} → ${a.rec}`); toast(`${a.rec} approved for ${a.pkg}.`); },
  /* contract */
  clsel: d => { O().contract.sel = d.id; if (d.go) { S.ui.sub = S.ui.sub || {}; S.ui.sub.contract = 'docs'; } },
  clf: d => { S.ui.clf = d.v; },
  clsave: d => { const c = O().contract.clauses.find(x => x.id === d.id), t = document.getElementById('clprop'); c.prop = t.value.trim(); if (c.prop !== c.orig && /agreed|accepted/i.test(c.st)) c.st = 'Negotiating'; log('Edited redline', c.ref); toast(`Redline saved on ${c.ref}. It goes to the client with the next revision.`); },
  clrevert: d => { const c = O().contract.clauses.find(x => x.id === d.id); c.prop = c.orig; c.st = 'Accepted as drafted'; log('Accepted client text', c.ref); },
  clcm: d => { const t = document.getElementById('clcm'), v = t && t.value.trim(); if (!v) return 'skip'; O().contract.clauses.find(x => x.id === d.id).cm.push([R().name, nowTs(), v]); },
  redline: () => { const o = O(), open = o.contract.clauses.filter(c => !/agreed|accepted/i.test(c.st)); openMail({ title: `Issue redline v${o.contract.ver + 1}`, to: `${o.meta.client} Legal`, subject: `Concession agreement: our redline v${o.contract.ver + 1}`, body: `Dear Sir/Madam,\n\nPlease find our redline of the concession agreement. Open clauses:\n${open.map(c => `• ${c.ref} ${c.title}: ${c.prop}`).join('\n')}\n\nEach change follows the negotiated positions recorded at award.${sig()}`, attach: [`Concession Agreement v${o.contract.ver + 1} redline.pdf`, 'Clause summary.xlsx'], thread: 'contract', after: { redline: open.length } }); },
  contractmail: () => openMail({ title: 'Email the client', to: `${O().meta.client} Legal`, subject: 'Concession agreement: ', body: sig().trim(), thread: 'contract' }),
  noticemail: () => { const n = threadOf('notice').length + 232; openMail({ title: 'New notice / letter', to: 'Independent Engineer', cc: O().meta.client, subject: `Notice NWW-IMC-0${n}: `, body: `Dear Sir,\n\nUnder clause __ of the concession agreement, we give notice that${sig()}`, thread: 'notice' }); },
  nreason: () => { O().nego.reasons = document.getElementById('nreason').value; toast('Reason codes saved'); },
  nkb: () => { O().nego.kb = true; log('Wrote outcome to Knowledge Bank', O().nego.result); toast('Competitor prices and reason codes written to the Knowledge Bank.'); },
  /* testing, handover */
  ptadd: () => { const o = O(), d = num(document.getElementById('ptd').value), v = num(document.getElementById('ptv').value); if (!d || !v) { toast('Enter the day and the reading.'); return 'skip'; } o.ptlog = o.ptlog.filter(r => r.day !== d); o.ptlog.push({ id: uid(), day: d, val: v }); o.ptDay = Math.max(o.ptDay, d); const p = o.ptest.find(x => /energy/i.test(x.par)); if (p) p.meas = v; log('PG test reading', `day ${d}: ${v}`); toast(`Day ${d} recorded. ${p ? (ptPass(p) ? 'Within the guarantee.' : 'Above the guarantee.') : ''}`); },
  lessons: () => { O().lessons = document.getElementById('lessonsin').value; toast('Lessons saved to the Knowledge Bank'); },
  covact: d => { const o = O(), c = o.covItems.find(x => x.id === d.id), was = c.st; c.st = d.v; if (/review/i.test(was)) o.cov.review = Math.max(0, o.cov.review - 1); if (was === 'Failed') o.cov.failed = Math.max(0, o.cov.failed - 1); if (d.v === 'Excluded') o.cov.excluded++; else o.cov.processed++; log('Coverage item ' + d.v.toLowerCase(), c.id); }
});

/* new change and input handlers */
document.addEventListener('change', e => {
  const t = e.target, c = t.dataset.c, o = O(); if (!c || !o) return;
  const A = {
    rfc: () => { S.ui.rfc = t.value; }, rfs: () => { S.ui.rfs = t.value; },
    g1ov: () => { const r = o.g1.rows.find(x => x.id === t.dataset.id); r.ov = t.value === '' ? null : num(t.value); log('Overrode score', `${r.c} → ${t.value || 'suggested'}`); },
    rfqpkg: () => { o.rfq.pkg = t.value; }, rfqline: () => { o.rfq.inc[t.dataset.k] = t.checked; }, rfqsup: () => { o.rfq.sel[t.dataset.k] = t.checked; }, rfqdue: () => { o.rfq.due = t.value; },
    tosh: () => { S.ui.toSheet = t.value; }, doctype: () => { o.docs.find(d => d.id === t.dataset.id).type = t.value; },
    mh: () => { o.hse.mh = num(t.value); },
    evid: () => { const f = t.files[0], r = o.elig.find(x => x.id === t.dataset.id); if (!f || !r) return; r.res = 'review'; r.vfy = { file: f.name, state: 'reading' }; IDB.put(S.oppId + ':ev:' + r.id, f); log('Attached eligibility evidence', f.name); toast(`${f.name} attached. Reading it now; a person decides whether the criterion passes.`); if (typeof aiVerify === 'function') aiVerify(r, f); },
    quoteup: () => { readQuote(t.files[0]); }
  };
  if (A[c]) { A[c](); if (c !== 'quoteup') render(); }
});
document.addEventListener('input', e => { const t = e.target; if (t.dataset.i !== 'rq') return; S.ui.rq = t.value; const pos = t.selectionStart; render(); const n = document.getElementById('rq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { } } });
document.addEventListener('submit', e => {
  if (e.target.id !== 'mailform') return; e.preventDefault();
  const m = S.modal.mail, o = O(), g = id => document.getElementById(id).value.trim();
  /* Keep what was typed, then run the envelope guard over the outgoing text. */
  m.to = g('ml-to'); m.cc = g('ml-cc'); m.subject = g('ml-sub'); m.body = g('ml-body');
  if (!m.guardAck) {
    const found = guardScan(m.subject + '\n' + m.body);
    if (found.length) { m.guard = found; renderLayer(); toast('Envelope guard: a price was found in this message.'); return; }
  }
  if (m.guardAck) { (o.guardOvr = o.guardOvr || []).push({ by: R().name, role: S.role, ts: nowTs(), subject: m.subject, hits: (m.guard || []).map(f => f.hit) }); log('Overrode the envelope guard on an outgoing message', `${m.subject} · ${(m.guard || []).map(f => f.hit).join(', ').slice(0, 60)}`); }
  pushMail({ thread: m.thread || 'general', to: m.to, subject: m.subject, body: m.body, attach: m.attach, guardOvr: !!m.guardAck });
  const a = m.after || {};
  if (a.clar) { const c = o.clars.find(x => x.id === a.clar); if (c.status === 'draft') c.status = 'open'; }
  if (a.rfq) { const p = o.pkgs.find(x => x.id === a.rfq); p.st = 'RFQ out'; p.due = o.rfq.due || p.due; p.sup = g('ml-to').split(',').length; }
  if (a.redline != null) { o.contract.ver++; o.contract.versions.push({ v: o.contract.ver, by: R().name + ' (us)', ts: nowTs(), note: `Our redline: ${a.redline} open clause(s)` }); }
  log('Sent email', g('ml-sub')); S.modal = null; render(); toast('Email sent and filed to this record. (Simulated: nothing left your browser.)');
});
async function readQuote(f) {
  if (!f) return; let total = null, txt = '';
  try { if (/\.pdf$/i.test(f.name)) { const k = 'Q' + Date.now(); FILES[k] = f; const pdf = await loadPdf(k); for (let p = 1; p <= Math.min(pdf.numPages, 6); p++) txt += ' ' + (await pageText(k, p)); } else txt = await f.text(); } catch (e) { txt = ''; }
  const m = txt.match(/(grand\s*total|total\s*price|total\s*amount|total)[^0-9]{0,40}([0-9][0-9,]*\.?[0-9]*)/i);
  if (m) { total = num(m[2]); if (total > 1e5) total = +(total / 1e7).toFixed(2); else if (total > 1e3) total = +(total / 100).toFixed(2); }
  const name = f.name.replace(/\.[^.]+$/, '').replace(/quot(e|ation)|rfq|offer|[_-]+/gi, ' ').replace(/\s+/g, ' ').trim() || 'Supplier';
  S.modal = { k: 'sups', rec: { ...FORMS.sups.d, name, quoted: total, cov: 'Read from ' + f.name }, note: total != null ? `Read from ${f.name}: total ₹${total} Cr. Check the scope coverage and terms before saving.` : `Read ${f.name}, but no total was found. Enter the quoted price.` };
  render();
}

/* Team members multiselect on the opportunity form: updates only its own box, so other unsaved fields keep their values. */
function teamRefresh() { const b = document.querySelector('#mf-team .tm-box'); if (b) b.innerHTML = teamWidget(); }
document.addEventListener('click', e => {
  const t = e.target;
  if (!S.ui.editMeta) return;
  if (t.closest('[data-tm-toggle]')) { S.ui.teamOpen = !S.ui.teamOpen; teamRefresh(); return; }
  const o = t.closest('[data-tm]');
  if (o) { const d = S.ui.teamDraft || (S.ui.teamDraft = []), k = o.dataset.tm, i = d.indexOf(k); if (i < 0) d.push(k); else d.splice(i, 1); teamRefresh(); const n = document.querySelector(`#mf-team [data-tm="${k}"]`); if (n) n.focus(); return; }
  if (S.ui.teamOpen && !t.closest('#mf-team')) { S.ui.teamOpen = false; teamRefresh(); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.ui.teamOpen && S.ui.editMeta) { S.ui.teamOpen = false; teamRefresh(); const b = document.querySelector('#mf-team [data-tm-toggle]'); if (b) b.focus(); }
});

/* Dashboard: the ask box and its chips hand the question to the assistant, which renders itself. */
ACT.dashask = d => { if (typeof askAI === 'function') askAI(d.q); return 'skip'; };
ACT.dashfind = d => { S.modal = { find: +d.i }; };
ACT.dashopt = d => { S.ui.dashOpt = d.v; };
/* Leaving a dashboard modal always closes it first, so no scrim is left behind. */
ACT.dashgo = d => { S.modal = null; if (d.v) { ACT.go(d); return; } ACT.taskgo(d); };
ACT.dashwin = d => { S.modal = { win: { head: d.h, tip: d.tip, tab: d.t, id: d.id } }; };
document.addEventListener('submit', e => {
  if (e.target.id !== 'dashaskform') return;
  e.preventDefault();
  const i = document.getElementById('dashq'), v = i && i.value.trim();
  if (v && typeof askAI === 'function') { i.value = ''; askAI(v); }
});
