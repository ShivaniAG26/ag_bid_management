// The proposal phase, read by bidPlan.
//
// The award here goes to the lowest evaluated price and the technical bid is
// pass or fail (ITB §31.1). Nothing in this volume earns marks, so every check
// below serves one of two ends: do not get the bid rejected, or spend less
// effort proving the same thing twice.
//
// The rules from the earlier stages still hold. Every finding carries the clause
// or the record it came from, nothing is rewritten without a person, and where
// the evidence is thin the check says so instead of guessing.

const paMk = (t) => typeof aiMk === 'function' ? aiMk(t) : '';
const paTag = () => typeof aiTag === 'function' ? aiTag() + ' ' : '';
const paHint = (h, c) => typeof aiHint === 'function' ? aiHint(h, c) : `<div class="aihint ${c || ''}"><span>${h}</span></div>`;
const paIn = (h, c) => typeof aiIn === 'function' ? aiIn(h, c) : `<span class="aihint inl ${c || ''}"><span>${h}</span></span>`;
const paTxt = h => String(h == null ? '' : h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const paPage = w => Math.max(1, Math.round(w / 450));   /* a tabbed A4 page of proposal prose */

/* ---------------------------------------------------------------- 8.1 structure
   The ITB prescribes the contents of envelope A, in order. The template is
   longer than the list, which is allowed, but the mandated sections must still
   appear and must still run in the prescribed order. */
function paMandated() {
  const o = O(), d = o.docs.find(x => x.code === 'itb');
  if (!d || typeof PAGES === 'undefined' || !PAGES[d.id]) return null;
  const P = PAGES[d.id];
  for (const [pg, html] of Object.entries(P.pages)) {
    const t = paTxt(html);
    if (!/in this order/i.test(t)) continue;
    const items = [...t.matchAll(/\((\d{1,2})\)\s*([^;.()]{3,80})/g)].map(m => ({ n: +m[1], title: m[2].trim() }));
    if (items.length < 4) continue;
    const cap = /not exceed\s+([\d,]+)\s*pages/i.exec(t), form = /Form\s+([A-Z]-?\d+)/i.exec(t);
    return { page: +pg, src: `itb:${pg}:§6.1`, items, cap: cap ? num(cap[1]) : 0, capWhat: cap ? t.slice(cap.index, cap.index + 90) : '', form: form ? form[1] : '' };
  }
  return null;
}
/* Match a mandated title to a section of the tree by its own words. A single
   shared word is enough — "Experience" and "Relevant Experience" are the same
   section — so the pairing is assigned greedily, best first, each section
   claimed once, rather than letting two titles both grab the same section. */
function paMatchSection(title, tree) {
  if (typeof stemsOf !== 'function') return null;
  const s = stemsOf(title);
  const best = tree.map(n => [n, matchScore(s, n.title)]).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] >= 1 ? best[0] : null;
}
function paPair(items, tree) {
  if (typeof stemsOf !== 'function') return items.map(it => ({ ...it, node: null }));
  const pairs = [];
  items.forEach(it => tree.forEach(n => { const v = matchScore(stemsOf(it.title), n.title); if (v >= 1) pairs.push({ it, n, v }); }));
  pairs.sort((a, b) => b.v - a.v);
  const tookItem = new Set(), tookNode = new Set(), map = {};
  pairs.forEach(x => { if (tookItem.has(x.it.n) || tookNode.has(x.n.id)) return; tookItem.add(x.it.n); tookNode.add(x.n.id); map[x.it.n] = x.n; });
  return items.map(it => ({ ...it, node: map[it.n] || null }));
}
function paFormat() {
  const M = paMandated(); if (!M) return null;
  const pr = ensureProp(), tree = pr.tree, nos = numbering(tree);
  const rows = paPair(M.items, tree).map(r => ({ ...r, at: r.node ? tree.indexOf(r.node) + 1 : null }));
  const missing = rows.filter(r => !r.node);
  const placed = rows.filter(r => r.node);
  /* Out of order when a mandated section sits before the one that precedes it. */
  const out = placed.filter((r, i) => i && placed[i - 1].at > r.at);
  const mapped = new Set(placed.map(r => r.node.id));
  const extra = tree.filter(n => !mapped.has(n.id));
  const words = tree.reduce((a, n) => a + nodeWords(n), 0), pages = paPage(words);
  return { M, rows, missing, out, extra, pages, over: M.cap && pages > M.cap, nos };
}
function paStructure() {
  const F = paFormat(), pr = ensureProp(), cm = compliance();
  void F;
  const F0 = paFormat(), mand = new Set(F0 ? F0.rows.filter(r => r.node).map(r => r.node.id) : []);
  /* a section the ITB names stays even when it answers no requirement */
  const orphan = pr.tree.filter(n => !mand.has(n.id) && !cm.some(c => c.sec && c.sec.node.id === n.id));
  const unmapped = cm.filter(c => !c.sec);
  if (!F && !orphan.length && !unmapped.length) return '';
  const ok = F && !F.missing.length && !F.out.length && !F.over;
  return `<div class="panel aip"><div class="ph"><div class="row" style="gap:8px"><h3>${paTag()}Checked against the ITB</h3>${F ? `<span class="chip ${ok ? 'ok' : 'warn'}">${ok ? 'Format matches' : (F.missing.length + F.out.length + (F.over ? 1 : 0)) + ' to settle'}</span>` : ''}</div>${F ? src(F.M.src) : ''}</div><div class="pb stack" style="gap:10px">
   ${!F ? paHint('The ITB does not state a required order for envelope A in the pages held here, so the structure is checked against the compliance matrix only.') : `
    <span class="sub">${paMk()}§6.1 lists ${F.M.items.length} sections “in this order, with each section tabbed and page-numbered”${F.M.cap ? `, and caps the volume at ${fmtN(F.M.cap)} pages excluding annexures` : ''}.</span>
    ${F.missing.length ? paHint(`<b>Not in the proposal:</b> ${F.missing.map(r => `(${r.n}) ${esc(r.title)}`).join('; ')}. A mandated section with nowhere to live is a rejection risk.`, 'badt') : paHint(`All ${F.M.items.length} mandated sections are present.`)}
    ${F.out.length ? paHint(`<b>Out of the mandated order:</b> ${F.out.map(r => `${esc(r.node.title)} sits at ${F.nos[r.node.id]}, after a section the ITB puts later`).join('; ')}. <button class="linkbtn" data-a="pafix">Reorder to §6.1</button>`, 'warnt') : ''}
    ${F.extra.length ? paHint(`<b>${F.extra.length} section${F.extra.length > 1 ? 's are' : ' is'} not in the ITB list:</b> ${F.extra.map(n => esc(n.title)).join(', ')}. Keeping them is allowed; they must not displace the mandated order.`) : ''}
    ${F.M.cap ? paHint(`About ${fmtN(F.pages)} page${F.pages === 1 ? '' : 's'} drafted against the ${fmtN(F.M.cap)}-page cap${F.over ? ' — over it' : ''}.`, F.over ? 'badt' : '') : ''}`}
   ${orphan.length ? paHint(`<b>${orphan.length} section${orphan.length > 1 ? 's answer' : ' answers'} no mandatory requirement:</b> ${orphan.map(n => esc(n.title)).join(', ')}. Nothing here earns marks, so either map a requirement to each or cut them.`, 'warnt') : ''}
   ${unmapped.length ? paHint(`<b>${unmapped.length} mandatory requirement${unmapped.length > 1 ? 's have' : ' has'} no section:</b> ${unmapped.slice(0, 4).map(c => `${esc(c.r.id)} → ${paSuggestSection(c.r) ? 'suggest ' + esc(paSuggestSection(c.r).title) : 'no obvious home'}`).join('; ')}${unmapped.length > 4 ? ` and ${unmapped.length - 4} more` : ''}. <button class="linkbtn" data-a="tab" data-t="pcomp">Map them</button>`, 'badt') : ''}
  </div></div>`;
}
const paSuggestSection = r => typeof stemsOf === 'function' ? paMatchSection(r.text, ensureProp().tree) : null;

/* ---------------------------------------------------------------- 8.2 ownership
   What a section still needs before a reviewer should be asked to read it, and
   whether its owner can realistically get to it. */
function paReady(n) {
  const o = O(), pr = ensureProp(), gaps = [];
  const paras = (pr.paras[n.id] || []).concat(...n.kids.map(k => pr.paras[k.id] || []));
  const txt = paras.map(p => p.table ? '' : paTxt(p.h != null ? p.h : p.t)).join(' ');
  if (!paras.length) gaps.push(['Not drafted yet', '']);
  const unsourced = paras.filter(p => !p.table && !p.kind && !(p.src || []).length && paTxt(p.h != null ? p.h : p.t).length > 40);
  if (unsourced.length) gaps.push([`${unsourced.length} paragraph${unsourced.length > 1 ? 's carry' : ' carries'} no source`, 'an evaluator cannot check it']);
  const cm = compliance().filter(c => c.sec && c.sec.node.id === n.id);
  const notSaid = cm.filter(c => !paAnswered(c, txt));
  if (notSaid.length) gaps.push([`${notSaid.length} requirement${notSaid.length > 1 ? 's are' : ' is'} mapped here but not answered in the text`, notSaid.map(c => c.r.id).join(', ')]);
  const prop = o.basis.filter(b => b.st === 'proposed' && txt && matchScore(stemsOf(b.f), txt) >= 2);
  if (prop.length) gaps.push([`${prop.length} design basis value${prop.length > 1 ? 's are' : ' is'} still proposed`, prop.map(b => b.f).join(', ')]);
  const qs = o.clars.filter(c => c.status !== 'answered' && txt && matchScore(stemsOf(c.q), txt) >= 4);
  if (qs.length) gaps.push([`Depends on ${qs.length} unanswered quer${qs.length > 1 ? 'ies' : 'y'}`, qs.map(c => c.id).join(', ')]);
  const flags = paras.filter(p => p.flag);
  if (flags.length) gaps.push([`${flags.length} drafting flag${flags.length > 1 ? 's' : ''} unresolved`, '']);
  return gaps;
}
function paOwnRow(n) {
  const g = paReady(n);
  if (n.st === 'approved') return '';
  if (!g.length) return paIn('Ready for review');
  return paHint(g.map(x => `<b>${x[0]}</b>${x[1] ? ` <span class="sub">· ${esc(x[1])}</span>` : ''}`).join(' · '), 'warnt');
}
/* Due dates planned back from the submission, newest work first. */
function paPlan() {
  const o = O(), pr = ensureProp(), sub = typeof ymd === 'function' ? ymd(o.meta.submission) : null;
  if (!sub) return null;
  const open = pr.tree.filter(n => n.st !== 'approved');
  if (!open.length) return null;
  const today = typeof TODAY !== 'undefined' && TODAY instanceof Date ? TODAY : new Date();
  /* assemble and check the volume in the last week; review takes the week before */
  const release = new Date(sub.getTime() - 7 * 864e5), reviewBy = new Date(release.getTime() - 7 * 864e5);
  const days = Math.max(1, Math.round((reviewBy - today) / 864e5));
  const per = days / open.length;
  return open.map((n, i) => ({ n, by: new Date(today.getTime() + Math.round(per * (i + 1)) * 864e5), late: per < 1 })).map(x => ({ ...x, byS: typeof isoL === 'function' ? isoL(x.by) : '' }));
}
function paOwnSummary() {
  const pr = ensureProp(), P = paPlan(), o = O();
  const notReady = pr.tree.filter(n => n.st !== 'approved' && paReady(n).length).length;
  /* an owner carrying sections here and bids elsewhere due within three weeks */
  const sub = typeof ymd === 'function' ? ymd(o.meta.submission) : null;
  const others = Object.values(S.db.opps).filter(x => x.meta.id !== o.meta.id && !x.closed);
  const load = {};
  pr.tree.filter(n => n.st !== 'approved').forEach(n => secOwners(n).forEach(r => { load[r] = (load[r] || 0) + 1; }));
  const busy = Object.entries(load).map(([r, c]) => {
    const near = sub ? others.filter(x => { const d = ymd(x.meta.submission); return d && Math.abs(d - sub) <= 21 * 864e5; }) : [];
    return c >= 3 && near.length ? { r, c, near } : null;
  }).filter(Boolean);
  const bits = [
    notReady ? `<b>${notReady} section${notReady > 1 ? 's are' : ' is'} not ready for review</b>` : 'Every open section is ready for review',
    P && P[0] ? `next due ${fmtDate(P[0].byS)} if the volume is to be checked in the week before submission` : '',
    busy.length ? busy.map(b => `${esc(ROLES[b.r] ? ROLES[b.r].name : b.r)} owns ${b.c} here and ${b.near.length} other bid${b.near.length > 1 ? 's' : ''} close${b.near.length > 1 ? '' : 's'} within three weeks`).join('; ') : ''
  ].filter(Boolean);
  return paIn(bits.join(' · '), notReady ? 'warnt' : '');
}
const paDue = n => { const P = paPlan(); const x = P && P.find(y => y.n.id === n.id); return x ? paIn(fmtDate(x.byS)) : ''; };

/* ---------------------------------------------------------------- 8.3 draft
   Wording that can make a bid non-responsive, and figures that disagree with
   the records they are supposed to come from. */
const PA_COND = [
  [/\bsubject to\b/i, 'reads as a condition on our offer'],
  [/\bwe (propose|intend|would prefer)\b/i, 'offers an alternative rather than complying'],
  [/\bassum(e|es|ed|ing|ption)\b/i, 'prices an assumption the client has not confirmed'],
  [/\bto be confirmed\b|\bTBC\b/i, 'leaves a term open'],
  [/\bif the (authority|client|employer)\b/i, 'makes the offer conditional on the client'],
  [/\bwhere (possible|practicable)\b|\bbest endeavours?\b/i, 'weakens an obligation into an endeavour'],
  [/\bprovided that\b/i, 'attaches a proviso to a requirement']
];
function paResponsive(p, n) {
  if (p.table || p.kind) return '';
  const t = paTxt(p.h != null ? p.h : p.t); if (t.length < 25) return '';
  const hits = PA_COND.map(([re, why]) => { const m = re.exec(t); return m ? { word: m[0], why } : null; }).filter(Boolean);
  if (!hits.length) return '';
  const o = O();
  /* a condition is safe when it is already on the record as a query or a deviation */
  const q = o.clars.find(c => c.status !== 'answered' && matchScore(stemsOf(c.q), t) >= 4);
  const dev = (o.devs || []).find(d => matchScore(stemsOf(d.text + ' ' + d.clause), t) >= 3);
  const where = q ? `<button class="aich" data-a="tab" data-t="clar"><span class="sub">Query</span> <b>${esc(q.id)}</b></button>`
    : dev ? `<button class="aich" data-a="tab" data-t="eng" data-sub="devs"><span class="sub">Deviation</span> <b>${esc(dev.id)}</b></button>` : '';
  return paHint(`<b>Reads as conditional:</b> “${esc(hits[0].word)}” ${esc(hits[0].why)}. Envelope A is judged pass or fail ${src('itb:22:§31.1')}, so a condition in the prose can make the bid non-responsive. ${where ? `It is on the record — ${where} — so state it there and keep this paragraph unconditional.` : '<b>It is not on the record.</b> Raise it as a query or enter it in the deviation register, then word this plainly.'}`, where ? 'warnt' : 'badt');
}
/* Figures in the prose against the figures in the records. */
function paNumbers(p) {
  if (p.table || p.kind) return '';
  const o = O(), t = paTxt(p.h != null ? p.h : p.t); if (!t) return '';
  const out = [];
  o.basis.forEach(b => {
    const v = String(b.v).match(/[\d.]+/); if (!v) return;
    if (matchScore(stemsOf(b.f), t) < 2) return;
    /* Slice the unit first, then escape it: escaping first and cutting after can
       sever an escape sequence and leave a trailing backslash, which throws. */
    const unit = String(b.v).replace(/[\d.,\s]/g, '').slice(0, 4);
    const esc_ = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let near = [];
    try { near = [...t.matchAll(new RegExp('([\\d,]+(?:\\.\\d+)?)\\s*' + esc_, 'gi'))].map(m => m[1].replace(/,/g, '')); } catch (e) { return; }
    if (!near.length) return;
    if (!near.some(x => Math.abs(parseFloat(x) - parseFloat(v[0])) < 0.001)) out.push([b.f, b.v, near[0], b.src]);
  });
  if (!out.length) return '';
  return paHint(out.map(x => `<b>${esc(x[0])}</b>: the text says ${esc(x[2])}, the accepted design basis says ${esc(x[1])} ${x[3] ? src(x[3]) : ''}`).join(' · '), 'badt');
}
/* Reusable content that has gone stale since it was approved. */
function paStale(p) {
  if (typeof KB_BLOCK === 'undefined' || !(p.kb || []).length) return '';
  return '';
}
function paDraftSummary(n) {
  const pr = ensureProp(), paras = (pr.paras[n.id] || []).concat(...n.kids.map(k => pr.paras[k.id] || []));
  const cond = paras.filter(p => paResponsive(p, n)).length, num_ = paras.filter(p => paNumbers(p)).length;
  const bits = [cond ? `<b>${cond} conditional paragraph${cond > 1 ? 's' : ''}</b>` : '', num_ ? `<b>${num_} figure mismatch${num_ > 1 ? 'es' : ''}</b>` : ''].filter(Boolean);
  return bits.length ? paIn(bits.join(' · ') + ' in this section', 'warnt') : '';
}
/* Stale blocks in the knowledge library, surfaced where they would be inserted. */
function paStaleBlocks() {
  if (typeof KB_BLOCK === 'undefined' || typeof kbDays !== 'function') return [];
  return KB_BLOCK.filter(b => kbDays(b.appr) < -365);
}

/* ---------------------------------------------------------------- 8.4 compliance
   Mapping is not answering. A requirement can point at an approved section that
   never mentions it. */
function paAnswered(c, txt) {
  const pr = ensureProp();
  if (!c.sec) return false;
  if (txt == null) {
    const n = c.sec.node;
    const paras = (pr.paras[n.id] || []).concat(...n.kids.map(k => pr.paras[k.id] || []));
    txt = paras.map(p => p.table ? paTxt(p.table) : paTxt(p.h != null ? p.h : p.t)).join(' ');
  }
  if (!txt.trim()) return false;
  const s = stemsOf(c.r.text), words = [...s];
  if (!words.length) return true;
  const hit = words.filter(w => stemsOf(txt).has(w)).length;
  const dom = words.filter(w => AI_DOMAIN.has(w));
  /* when the requirement carries subject terms, at least one must appear */
  if (dom.length && !dom.some(w => stemsOf(txt).has(w))) return false;
  return hit / words.length >= 0.34;
}
const PA_PROOF = { Process: 'Process design report', Performance: 'Guarantee schedule', Hydraulics: 'Hydraulic profile drawing', Energy: 'Energy calculation', Pipeline: 'Pipe material schedule', Sludge: 'Sludge mass balance', SCADA: 'I/O list', 'O&M': 'O&M staffing plan', Testing: 'PG test procedure', Programme: 'L1 programme', Format: 'Bid forms' };
function paCompCell(c) {
  if (!c.sec) return '';
  if (!paAnswered(c)) {
    const pr = ensureProp(), n = c.sec.node;
    const drafted = (pr.paras[n.id] || []).length || n.kids.some(k => (pr.paras[k.id] || []).length);
    return paHint(drafted
      ? `Mapped to <b>${esc(c.sec.title)}</b>, which is drafted but never says it. An evaluator checks the words, not the matrix. <button class="linkbtn" data-a="psel" data-id="${n.id}" data-go="1">Open the section</button>`
      : `Mapped to <b>${esc(c.sec.title)}</b>, which is not drafted yet.`, drafted ? 'badt' : 'warnt');
  }
  const proof = PA_PROOF[c.r.cat];
  if (proof) { const have = (O().docs || []).some(d => matchScore(stemsOf(proof), d.name) >= 2); if (!have) return paHint(`Answered in the text. Its proof — <b>${esc(proof)}</b> — is not in the annexures yet.`, 'warnt'); }
  return paIn('Answered in the text');
}
function paCompSummary() {
  const cm = compliance(), mapped = cm.filter(c => c.sec), notSaid = mapped.filter(c => !paAnswered(c));
  if (!cm.length) return '';
  return paIn(`${paMk()}${notSaid.length ? `<b>${notSaid.length} of ${mapped.length} mapped requirements are not answered in their section</b>` : `All ${mapped.length} mapped requirements are answered in their section`}`, notSaid.length ? 'badt' : '');
}

/* ---------------------------------------------------------------- 8.5 annexures
   The people named in the bid, and the data sheets the guarantees rest on. */
function paCvs() {
  if (typeof KB_PEOPLE === 'undefined' || typeof kbDays !== 'function') return null;
  const o = O(), sub = typeof ymd === 'function' ? ymd(o.meta.submission) : null;
  const stale = KB_PEOPLE.filter(p => kbDays(p.cv) < -365);
  const held = KB_PEOPLE.filter(p => /^On /i.test(p.avail || ''));
  return (stale.length || held.length) ? { stale, held, sub } : null;
}
function paAnnex() {
  const o = O(), C = paCvs(), M = paMandated();
  const lev = o.lev || { sups: [] }, award = lev.sups.find(s => s.id === lev.award);
  const eg = (o.brief.facts || []).find(f => /energy/i.test(f.k));
  const parts = [];
  if (C && C.stale.length) parts.push(paHint(`<b>${C.stale.length} CV${C.stale.length > 1 ? 's are' : ' is'} over a year old:</b> ${C.stale.map(p => `${esc(p.name)} (${fmtDate(p.cv)})`).join(', ')}. Many ITBs reject a CV older than twelve months.`, 'badt'));
  if (C && C.held.length) parts.push(paHint(`<b>Committed elsewhere:</b> ${C.held.map(p => `${esc(p.name)} — ${esc(p.avail)}`).join('; ')}. Naming a key person who is not free is a commitment we may not be able to keep.`, 'warnt'));
  if (award) parts.push(paHint(`The guarantees rest on <b>${esc(award.name)}</b>’s particulars${eg ? ` — the ${esc(eg.v)} energy guarantee is proved from the blower data sheet, not from the prose` : ''}. Check the data sheet matches what the draft claims before release.${M && M.form ? ` §6.1 wants them annexed in <b>Form ${esc(M.form)}</b>.` : ''}`));
  else if (lev.sups.length) parts.push(paHint('No supplier is selected yet, so the guaranteed particulars cannot be annexed. Select one in Procurement → levelling.', 'warnt'));
  if (!parts.length) return '';
  return `<div class="panel aip"><div class="ph"><div class="row" style="gap:8px"><h3>${paTag()}Before these annexures go out</h3></div>${M ? src(M.src) : ''}</div><div class="pb stack" style="gap:8px">${parts.join('')}</div></div>`;
}

/* ---------------------------------------------------------------- 8.6 commercial
   The price has to read the same everywhere it appears. */
function paPrice() {
  if (!can('envB')) return '';
  const o = O(), e = estTotals(), om = omSchedule(), g2 = gateSigned('G2');
  const out = [];
  const words = n => { /* the figure as a bid form would write it out */
    const u = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const cr = Math.floor(n); return `${cr >= 1000 ? 'one thousand ' : ''}${cr} crore`.replace(/\s+/g, ' ');
  };
  if (!o.est.length) return '';
  out.push(['Bid Project Cost', cr(e.price), `${fmtN(e.price, 2)} crore in figures — the financial form must carry the same amount in words`]);
  out.push(['O&M NPV at 10%', cr(om.npv), `${o.omEsc}% escalation over ${om.yrs.length} years; the year-wise schedule in the commercial volume must sum to this`]);
  out.push(['Evaluated bid', cr(e.price + om.npv), 'BPC plus the O&M NPV — what the client ranks the bids on']);
  const lock = g2 ? '' : 'G2 is not signed, so this price can still move. Anything already drafted into the commercial volume will be out of date the moment it does.';
  return `<div class="panel aip"><div class="ph"><div class="row" style="gap:8px"><h3>${paTag()}The price, as it must read everywhere</h3><span class="chip ${g2 ? 'ok' : 'warn'}">${g2 ? 'Locked to G2' : 'Not yet approved'}</span></div></div><div class="pb stack" style="gap:8px">
   <ul class="aidrv">${out.map(x => `<li><span><b>${esc(x[0])}</b> <span class="sub">${esc(x[2])}</span></span><span class="mono">${esc(x[1])}</span></li>`).join('')}</ul>
   ${lock ? paHint(lock, 'warnt') : ''}
   ${paHint(`Any indication of price in envelope A makes the bid non-responsive ${src('itb:22:§31.5')}. The envelope guard scans the drafted paragraphs; data sheets and file names are not scanned, so check those by eye.`, 'warnt')}
  </div></div>`;
}

/* ---------------------------------------------------------------- 8.7 submission
   One last read of the whole bid: does every fact say the same thing, has
   anything been reopened since it was approved, and will the portal take it. */
function paFacts() {
  const o = O(), f = k => ((o.brief.facts || []).find(x => new RegExp(k, 'i').test(x.k)) || {});
  const jv = (o.elig.find(e => /JV/i.test(e.c)) || {}).ours || '';
  const basin = (o.basis.find(b => /basin/i.test(b.f)) || {});
  const out = [];
  const add = (label, value, re, src_) => { if (value) out.push({ label, value, re, src: src_ }); };
  add('JV share', (/(\d+)\s*%/.exec(jv) || [])[1], /(\d{2})\s*[:%]\s*\/?\s*(\d{2})?\s*%?\s*(?:joint venture|JV)|JV[^.]{0,30}?(\d{2})\s*%/i, 'itb:12:§4.5');
  add('Bid validity', (/(\d+)\s*days/.exec(f('bid validity').v || '') || [])[1], /validity[^.]{0,30}?(\d{2,3})\s*days|(\d{2,3})\s*days[^.]{0,20}validity/i, (f('bid validity') || {}).src);
  add('Design flow', o.meta.mld ? String(o.meta.mld) : '', /(\d{2,4})\s*MLD/i, 'v2:14:§3.1');
  const bod = (o.meta.size || []).find(s => /treated bod/i.test(s.k));
  add('Treated BOD', bod ? (/([\d.]+)/.exec(bod.v) || [])[1] : '', /BOD[^.]{0,24}?([\d.]+)\s*mg\/l/i, 'c1:1:§1');
  add('SBR basins', basin.v ? (/(\d+)/.exec(basin.v) || [])[1] : '', /(\w+|\d+)\s+(?:SBR\s+)?basins/i, basin.src);
  return out;
}
const PA_WORD = { four: '4', six: '6', three: '3', two: '2', five: '5', eight: '8' };
/* A number that differs is usually not a contradiction. It is a past project, a
   per-unit figure, the raw value rather than the treated one, or a sentence
   deliberately contrasting the two. Each of those is excluded, because a check
   that cries wolf at submission is worse than no check at all. */
const paSentences = t => String(t).split(/(?<=[.?!])\s+/).filter(Boolean);
const PA_NUM = { '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight' };
function paIsAside(sentence, para, F, matched) {
  const s = sentence.toLowerCase(), whole = String(para).toLowerCase();
  if (typeof PAST !== 'undefined' && Object.values(PAST).some(p => p.name && s.includes(p.name.split(' ')[0].toLowerCase()))) return 'names a past project';
  /* "Four disc filters of 50 MLD" is a unit size, not the plant's design flow */
  if (/×\s*[\d.]+|\beach\b|\bper (unit|basin|stream|filter|train)\b/.test(s)) return 'a per-unit figure';
  if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+[a-z][a-z ]{2,26}?\s+of\s+[\d.,]+\s*(mld|m³|mg\/l)/.test(s)) return 'a per-unit figure';
  if (String(F.label).toLowerCase().includes('treated') && /\braw\b|\binfluent\b|\bincoming\b/.test(s)) return 'the raw value, not the treated one';
  /* A paragraph that states both figures is contrasting them on purpose — but
     only when the record's figure is not there wearing a different unit. "180
     MLD" in a sentence about 90-day validity is a coincidence, not a contrast. */
  const v = String(F.value).toLowerCase(), word = PA_NUM[v];
  /* the unit of the figure that was matched, not of the first number in the line */
  const unit = (/[\d.,]+\s*([a-z³/%]{1,6})/i.exec(matched || sentence) || [])[1] || '';
  const sameUse = x => {
    const re = new RegExp('\\b' + String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b\\s*([a-z³/%]{1,6})?', 'gi');
    let m; while ((m = re.exec(whole))) { const u = (m[1] || '').toLowerCase(); if (!u || !unit || u === unit.toLowerCase()) return true; }
    return false;
  };
  if (sameUse(v) || (word && sameUse(word))) return 'the paragraph names the record’s own figure too';
  return '';
}
function paSweep() {
  const pr = ensureProp(), facts = paFacts(), out = [];
  const nodes = [...pr.tree, ...pr.tree.flatMap(n => n.kids)];
  facts.forEach(F => {
    const seen = [], skipped = [];
    nodes.forEach(n => {
      (pr.paras[n.id] || []).forEach(p => {
        const t = p.table ? paTxt(p.table) : paTxt(p.h != null ? p.h : p.t); if (!t) return;
        paSentences(t).forEach(sen => {
          const m = new RegExp(F.re.source, F.re.flags.replace('g', '')).exec(sen); if (!m) return;
          const got = (m.slice(1).find(Boolean) || '').toLowerCase();
          const norm = PA_WORD[got] || got;
          if (!norm || norm === String(F.value).toLowerCase()) return;
          const why = paIsAside(sen, t, F, m[0]);
          (why ? skipped : seen).push({ n, said: m[0].trim(), got: norm, why, sen });
        });
      });
    });
    if (seen.length || skipped.length) out.push({ F, seen, skipped });
  });
  return { hits: out.filter(x => x.seen.length), asides: out.filter(x => !x.seen.length && x.skipped.length) };
}
function paReopened() {
  const o = O(), pr = ensureProp(), A = (typeof aiS === 'function' ? aiS(o) : { chg: {} });
  if (!o.addenda.length || typeof addImpact !== 'function') return [];
  const out = [];
  o.addenda.forEach(a => {
    const I = addImpact(a); if (!I.secs.length) return;
    const hit = I.secs.map(sn => pr.tree.find(n => n.id === sn.id || n.title === sn.title)).filter(n => n && n.st === 'approved');
    if (hit.length) out.push({ a, hit, reviewed: !!(A.chg || {})[a.no] });
  });
  return out;
}
const PA_PORTAL = [
  ['Searchable PDF', 'Scanned pages without text cannot be read by the evaluation portal', o => (o.docs || []).some(d => d.up && d.kind === 'pdf')],
  ['One file per envelope', 'Envelope A and envelope B are uploaded separately; a price in A voids the bid', () => true],
  ['Digital signature on every file', 'Class II or III, in the authorised signatory’s name', () => true],
  ['File size and count within the portal limit', 'MahaTenders rejects an oversized file without telling you why', () => true]
];
function paSubmission() {
  const o = O(), SW = paSweep(), sweep = SW.hits, reop = paReopened(), M = paMandated(), F = paFormat();
  const stale = paStaleBlocks();
  const clean = !sweep.length && !reop.length;
  return `<div class="panel aip"><div class="ph"><div class="row" style="gap:8px"><h3>${paTag()}One last read of the whole bid</h3><span class="chip ${clean ? 'ok' : 'bad'}">${clean ? 'Nothing contradicts' : sweep.length + reop.length + ' to settle'}</span></div>${M ? src(M.src) : ''}</div><div class="pb stack" style="gap:10px">
   ${sweep.length ? sweep.map(x => paHint(`<b>${esc(x.F.label)} reads two ways.</b> The record says <b>${esc(x.F.value)}</b>${x.F.src ? ' ' + src(x.F.src) : ''}; ${x.seen.map(s => `${esc(s.n.title)} says “${esc(s.said)}”`).join('; ')}. A contradiction inside the bid is grounds to disqualify.`, 'badt')).join('')
    : paHint(`Every key fact reads the same across the volume: ${paFacts().map(f => esc(f.label)).join(', ')}.`)}
   ${SW.asides.length ? paHint(`Read past, not flagged: ${SW.asides.map(x => `${esc(x.F.label)} (${esc(x.skipped[0].why)})`).join(', ')}. A different figure is only a contradiction when it is meant to be the same one.`) : ''}
   ${reop.length ? reop.map(x => paHint(`<b>${esc(x.a.no)} touches ${x.hit.length} approved section${x.hit.length > 1 ? 's' : ''}:</b> ${x.hit.map(n => esc(n.title)).join(', ')}. ${x.reviewed ? 'Its impact was reviewed; the sections were not reopened.' : 'Its impact has not been reviewed yet.'} <button class="linkbtn" data-a="pareopen" data-no="${esc(x.a.no)}">Send ${x.hit.length > 1 ? 'them' : 'it'} back for review</button>`, 'badt')).join('') : ''}
   ${F && F.over ? paHint(`About ${fmtN(F.pages)} pages against the ${fmtN(F.M.cap)}-page cap.`, 'badt') : ''}
   ${stale.length ? paHint(`${stale.length} reusable block${stale.length > 1 ? 's' : ''} in the knowledge library ${stale.length > 1 ? 'are' : 'is'} over a year old: ${stale.map(b => esc(b.title)).join(', ')}. If any of this was pulled into the draft, read it again.`, 'warnt') : ''}
   <div><span class="eyebrow">${paMk()} Before you upload</span><ul class="aidrv">${PA_PORTAL.map(r => `<li><span><b>${esc(r[0])}</b> <span class="sub">${esc(r[1])}</span></span></li>`).join('')}</ul></div>
  </div></div>`;
}

/* ---------------------------------------------------------------- actions */
Object.assign(ACT, {
  /* Reorder the tree to the ITB's own list, keeping sections it does not name. */
  pafix: () => {
    if (!can('prop')) return 'skip';
    const F = paFormat(); if (!F) return 'skip';
    const pr = ensureProp(), order = F.rows.filter(r => r.node).map(r => r.node);
    const rest = pr.tree.filter(n => !order.includes(n));
    pr.tree = [...order, ...rest]; pr.dirty = true;
    log('Reordered the proposal to the ITB', `§6.1 · ${order.length} mandated sections`);
    toast('Reordered to §6.1. Sections the ITB does not name follow it; save as a new version to keep this.');
  },
  pareopen: d => {
    if (!can('prop')) return 'skip';
    const pr = ensureProp(), x = paReopened().find(y => y.a.no === d.no); if (!x) return 'skip';
    x.hit.forEach(n => { n.st = 'in_review'; });
    log('Reopened approved sections after an addendum', `${d.no} · ${x.hit.map(n => n.title).join(', ')}`);
    toast(`${x.hit.length} section${x.hit.length > 1 ? 's' : ''} sent back for review after ${d.no}.`);
  }
});

/* ---------------------------------------------------------------- 8.3 reuse
   A section from a bid that won, adapted to this tender, with what changed
   shown rather than quietly swapped. The evaluator's score comes with it, so
   the writer knows whether the source is worth copying at all. */
function paReusable(node) {
  if (typeof KB_BLOCK === 'undefined' || typeof stemsOf !== 'function') return [];
  /* A section title is a label, not a subject. What the section is about comes
     from the requirements mapped to it and whatever is drafted in it. */
  const pr = ensureProp(), reqs = compliance().filter(c => c.sec && c.sec.node.id === node.id).map(c => c.r.text);
  const drafted = [node, ...node.kids].flatMap(n => (pr.paras[n.id] || []).map(p => paTxt(p.h != null ? p.h : p.t))).join(' ');
  const s = stemsOf(`${node.title} ${node.kids.map(k => k.title).join(' ')} ${reqs.join(' ')} ${drafted}`);
  return KB_BLOCK.map(b => {
    const n = matchScore(s, b.title + ' ' + b.sec);
    return n >= 3 ? { b, n, old: typeof kbDays === 'function' && kbDays(b.appr) < -365 } : null;
  }).filter(Boolean).sort((a, b) => b.n - a.n).slice(0, 4);
}
/* What the past text says that this tender contradicts. */
function paAdapt(text) {
  const o = O(), out = [];
  const past = Object.entries(typeof KB_PROJ !== 'undefined' ? KB_PROJ : {}).map(([k, p]) => ({ k, ...p, ...(PAST[k] || {}) }));
  const big = past.filter(p => p.mld).sort((a, b) => b.mld - a.mld)[0];
  if (big && o.meta.mld && big.mld !== o.meta.mld) out.push([`${big.mld} MLD`, `${o.meta.mld} MLD`, 'this tender’s design flow']);
  const bod = (o.meta.size || []).find(x => /treated bod/i.test(x.k));
  if (bod) out.push(['< 20 mg/l', bod.v, 'the treated standard after Corrigendum 01']);
  return out;
}
function paInsertBlock(id, nodeId) {
  const b = (typeof KB_BLOCK !== 'undefined' ? KB_BLOCK : []).find(x => x.id === id); if (!b) return null;
  const o = O(), A = paAdapt(), adapted = A.map(x => `${esc(x[1])} <span class="sub">(was ${esc(x[0])} — ${esc(x[2])})</span>`);
  const prov = typeof kbDays === 'function' && kbDays(b.appr) < -365 ? ` It was approved ${fmtDate(b.appr)}, over a year ago; read it again before you rely on it.` : '';
  return {
    kind: 'callout',
    h: `<b>${esc(b.title)}</b> — reused from the content library, used in ${b.used} bids, approved ${esc(b.appr)}.${prov} ` +
       (adapted.length ? `Adapted to this tender: ${adapted.join('; ')}.` : 'Nothing in it contradicts this tender’s records.') +
       ` Rewrite this in your own words before release; it is a starting point, not an answer.`
  };
}


/* ============================================================================
   Export the proposal, and the negotiation reading behind one chip
   ========================================================================== */

/* The draft as a single self-contained HTML file: the volume as it would read,
   every citation kept so a reviewer can still trace a sentence to its page. */
function paExportHtml() {
  const o = O(), pr = ensureProp(), nos = numbering(pr.tree);
  /* draftParas returns null for a section nobody has generated yet; the export
     says so rather than dropping the heading, so the volume's gaps stay visible. */
  const body = pr.tree.map(n => {
    const sec = k => {
      const ps = draftParas(k);
      return `<h2>${esc(nos[k.id])} ${esc(k.title)}</h2>` + (ps && ps.length
        ? ps.map(x => x.table ? x.table : `<p>${esc(String(x.t || x.h || '').replace(/<[^>]*>/g, '').trim())}</p>`).join('')
        : '<p class="m">Not drafted yet.</p>');
    };
    return sec(n) + n.kids.map(sec).join('');
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(o.meta.name)} — technical proposal</title>
<style>body{font:15px/1.65 -apple-system,Segoe UI,sans-serif;max-width:46em;margin:48px auto;padding:0 24px;color:#1a1d14}
h1{font-size:26px;margin:0 0 4px}h2{font-size:17px;margin:28px 0 8px}.m{color:#666;font-size:13px}
table{border-collapse:collapse;width:100%;margin:10px 0}td,th{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:13px}</style>
</head><body><h1>${esc(o.meta.name)}</h1>
<p class="m">Technical proposal to ${esc(o.meta.client)} · ${esc(S.cfg.company)}<br>Envelope A · exported ${esc(nowTs())}</p>
${body}</body></html>`;
}
Object.assign(ACT, {
  pexport: () => {
    try {
      const blob = new Blob([paExportHtml()], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${O().meta.id}-technical-proposal.html`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      log('Exported the technical proposal', O().meta.id);
      toast('Technical volume exported. Open it in a browser or print to PDF.');
    } catch (e) { toast('This browser blocked the download.'); }
  },
  panego: () => { S.ui.paNego = true; S.modal = { paNego: true }; }
});

/* --- the negotiation reading, folded behind one chip --- */
function paNegoChip() {
  const o = O(), e = estTotals(), bpc = num((o.bafo.slice(-1)[0] || {}).price);
  if (!can('envB') || !bpc || !e.cost) return '';
  const m = (bpc - e.cost) / bpc * 100, thin = m < e.m;
  return `<button class="an-sug${thin ? ' is-pending' : ''}" data-a="panego">
   <span class="an-sugo" aria-hidden="true">${IC.spark}</span>
   <span class="an-sugb"><b>Margin and concessions</b><span>${m.toFixed(1)}% after BAFO against ${e.m}% at G2</span></span>
   <span class="an-sugc" aria-hidden="true">${IC.next}</span></button>`;
}
function paNegoModal() {
  if (!S.ui.paNego) return '';
  const o = O(), e = estTotals(), bpc = num((o.bafo.slice(-1)[0] || {}).price);
  const m = bpc && e.cost ? (bpc - e.cost) / bpc * 100 : 0;
  const C = typeof concessions === 'function' && isSeed() ? concessions().filter(c => !/agreed/i.test(c.where)) : [];
  const open = C.reduce((a, c) => a + c.cost, 0);
  const VAL = ['Nothing', 'Low', 'Medium', 'High'];
  return `<div class="scrim" data-a="closemodal"><div class="modal lg" role="dialog" aria-modal="true" aria-labelledby="pnt">
   <div class="mh"><div class="row" style="gap:10px;flex-wrap:nowrap;min-width:0"><span class="an-pill lg ico-only" role="img" aria-label="Suggested by bidPlan">${IC.spark}</span>
     <div style="min-width:0"><h2 id="pnt">Margin and concessions</h2><span class="sub">Read against the last BAFO round and the G2 approval</span></div></div>
    <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
   <div class="mb"><div class="stack" style="gap:16px">
    <ol class="an-steps">
     <li><span>Price after the last round</span><b>${cr(bpc, 1)}</b><em>${esc((o.bafo.slice(-1)[0] || {}).round || '')}</em></li>
     <li><span>Cost carried at G2</span><b>${cr(e.cost, 1)}</b><em>Direct cost plus contingency, market movement and adders</em></li>
     <li class="is-ask"><span>Margin now</span><b>${m.toFixed(1)}%</b><em>Against ${e.m}% approved at G2 — ${m < e.m ? `${(e.m - m).toFixed(1)} points thinner than the mandate` : 'inside the mandate'}</em></li>
    </ol>
    ${C.length ? `<div class="an-sec"><span class="eyebrow">Still open, and what each one costs</span>
      <div class="tw"><table class="t"><thead><tr><th>Point</th><th class="num">Cost to us</th><th>Worth to them</th><th>Give · get</th></tr></thead>
      <tbody>${C.map(c => `<tr><td><b>${esc(c.topic)}</b></td><td class="num mono">${cr(c.cost, 1)}</td>
        <td><span class="aival v${c.val}">${esc(VAL[c.val] || '')}</span></td>
        <td><div class="aigg"><span class="g">Give</span> ${esc(c.give)}</div><div class="aigg"><span class="t">Get</span> ${esc(c.get)}</div></td></tr>`).join('')}</tbody></table></div>
      <div class="note"><div>Concede every open point and the margin falls to <b>${((bpc - e.cost - open) / bpc * 100).toFixed(1)}%</b>. ${open > 0 ? `That is ${cr(open, 1)} of give still on the table.` : ''}</div></div></div>` : ''}
   </div></div>
   <div class="mf an-mf"><button class="btn" data-a="closemodal">Close</button>
    <button class="btn sm ghost" data-a="sub" data-t="nego" data-v="bafo">Open the BAFO rounds →</button>
    ${o.nego.pos.some(x => !x.walk) ? `<button class="btn pri" data-a="panegohold">Set the walk-away at ${cr(e.cost / (1 - e.m / 100), 1)}</button>` : '<span class="sub">Every position already carries a walk-away.</span>'}</div></div></div>`;
}
Object.assign(ACT, {
  panegohold: () => {
    const o = O(), e = estTotals(), floor = e.cost / (1 - e.m / 100);
    const bare = o.nego.pos.filter(p => !p.walk);
    if (!bare.length) { toast('Every position already carries a walk-away.'); return; }
    bare.forEach(p => { p.walk = `Not below ${cr(floor, 1)} overall`; });
    log('Recorded the negotiation walk-away from the G2 mandate',
      `${o.meta.id} · ${cr(floor, 1)} · ${bare.map(p => p.topic).join(', ')}`);
    toast(`Walk-away set at ${cr(floor, 1)} on ${bare.length} position${bare.length === 1 ? '' : 's'}.`);
  }

});
const _paOverlays = overlays;
overlays = function () { return _paOverlays() + (S.modal && S.modal.paNego ? paNegoModal() : ''); };
const _paClose = ACT.closemodal;
ACT.closemodal = () => { S.ui.paNego = false; return _paClose(); };


/* --- the outcome, stated once and drawn once ---
   An isometric of the award: the three bids as stacked plinths, ours lit. The
   drawing is read from the opening sheet, so it cannot say Won when the record
   says otherwise. */
function paOutcomeCard() {
  const o = O(), res = o.nego.result;
  const bids = o.nego.bids.slice().sort((a, b) => num(a.bpc) - num(b.bpc));
  const us = bids.findIndex(b => b.us), mx = Math.max(1, ...bids.map(b => num(b.bpc)));
  const lead = us === 0 && bids[1] ? num(bids[1].bpc) - num(bids[0].bpc) : null;
  const won = res === 'Won', lost = res === 'Lost';
  const plinth = (i, b) => {
    const h = 26 + (num(b.bpc) / mx) * 54, x = 18 + i * 62, y = 150 - h;
    const mine = b.us, f = mine ? 'var(--brand-solid)' : 'var(--border-strong)';
    return `<g opacity="${mine ? 1 : .42}">
      <path d="M${x} ${y + 14} l26 -14 l26 14 l-26 14 Z" fill="${f}" opacity=".9"/>
      <path d="M${x} ${y + 14} l26 14 v${h} l-26 -14 Z" fill="${f}" opacity=".58"/>
      <path d="M${x + 26} ${y + 28} l26 -14 v${h} l-26 14 Z" fill="${f}" opacity=".75"/>
      ${mine ? `<path d="M${x} ${y + 14} l26 -14 l26 14 l-26 14 Z" fill="none" stroke="var(--brand-solid)" stroke-width="1.5"/>` : ''}
    </g><text x="${x + 26}" y="166" text-anchor="middle" font-size="10" fill="var(--text-muted)">L${i + 1}</text>`;
  };
  return `<section class="panel paout ${won ? 'is-won' : lost ? 'is-lost' : ''}">
   <div class="pb paout-b">
    <div class="paout-t">
     <span class="eyebrow">Outcome</span>
     <h3>${won ? `Won${us >= 0 ? ` as L${us + 1}` : ''}` : lost ? 'Lost' : res === 'Cancelled' ? 'Cancelled' : 'Not decided yet'}</h3>
     ${won && lead != null ? `<p>Ahead of L2 by <b>${cr(lead, 1)}</b> on bid project cost.</p>`
      : lost ? `<p>${esc(String(o.nego.reasons || '').split('\n')[0] || 'No reason recorded.')}</p>`
      : '<p>The opening sheet is filed; the result has not been set.</p>'}
     ${o.nego.kb ? '<span class="chip ok">Written to the Knowledge Bank</span>' : ''}
    </div>
    <svg class="paout-iso" viewBox="0 0 220 176" role="img" aria-label="${esc(bids.length)} bids compared, ours ${won ? 'lowest' : 'not lowest'}">
     <ellipse cx="110" cy="158" rx="96" ry="12" fill="var(--bg-subtle)"/>
     ${bids.slice(0, 3).map((b, i) => plinth(i, b)).join('')}
    </svg>
   </div></section>`;
}
