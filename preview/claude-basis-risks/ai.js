// AI capabilities placed in the stage where the work happens: capture (stage 1),
// ingest (stage 2) and the bid / no-bid review (stage 4).
//
// Three rules hold everywhere in this file:
//   1. Every value carries its source (document, page, section) or a record id.
//   2. Nothing changes the record until a named person accepts it.
//   3. Where the AI and the record disagree, both are shown; the person decides.
// Wherever the data allows, a capability reads the live records rather than a
// seed, so what it says stays true as the tender changes.

const aiTag = () => `<span class="aitag" role="img" aria-label="Suggested by bidPlan">${IC.spark}</span>`;
const aiS = o => { o.ai = o.ai || {}; ['f', 'cls', 'chg'].forEach(k => { o.ai[k] = o.ai[k] || {}; }); return o.ai; };
const isSeed = () => O().meta.seed === 'indrayani';
const fmtD = v => /^\d{4}-\d{2}-\d{2}$/.test(v) ? fmtDate(v) : v;

/* =====================================================================
   Stage 1 · Capture — brief from the pack, fit score explained, seen before
   ===================================================================== */

/* What the tender pack says, field by field, with the page it says it on.
   kind 'meta' maps to an opportunity field; 'fact' to the key-facts register. */
const AI_PACK = [
  { k: 'client', l: 'Client', v: 'Indrayani Municipal Corporation', src: 'itb:1:§1.1', kind: 'meta' },
  { k: 'loc', l: 'Location', v: 'Moshi, Pimpri-Chinchwad, Pune district', src: 'itb:1:§1.1', kind: 'meta' },
  { k: 'value', l: 'Tender estimate', v: 1260, show: '₹1,260 Cr', src: 'itb:3:§1.4', kind: 'meta' },
  { k: 'submission', l: 'Technical bid due', v: '2026-12-05', src: 'itb:2:NIT', kind: 'meta' },
  { k: 'mld', l: 'Design flow', v: 200, show: '200 MLD', src: 'v2:14:§3.1', kind: 'meta' },
  { k: 'Treated BOD', l: 'Treated BOD', v: '< 10 mg/l', src: 'c1:1:§1', kind: 'size', was: '< 20 mg/l', wasSrc: 'v2:17:§3.4', why: 'Corrigendum 01' },
  { k: 'Energy guarantee', l: 'Energy guarantee', v: '0.21 kWh/m³', src: 'v2:296:§11.1', kind: 'size' },
  { k: 'Bid security (EMD)', l: 'Bid security (EMD)', v: '₹12.6 Cr BG, 180 days', src: 'itb:2:NIT', kind: 'fact' },
  { k: 'Performance security', l: 'Performance security', v: '5% of BPC', src: 'ca:28:§9.1', kind: 'fact' },
  { k: 'Bid validity', l: 'Bid validity', v: '180 days from technical opening', src: 'itb:13:§13.1', kind: 'fact' },
  { k: 'Integrity pact', l: 'Integrity pact', v: 'Required, signed by the authorised signatory', src: 'itb:15:§16.2', kind: 'fact' }
];
function packState(p) {
  const o = O(), m = o.meta, A = aiS(o);
  if (A.f[p.k] === 'kept') return 'kept';
  if (p.kind === 'meta') {
    const cur = m[p.k];
    if (cur == null || cur === '') return 'new';
    return String(cur).trim().toLowerCase() === String(p.v).trim().toLowerCase() ? 'match' : 'conflict';
  }
  if (p.kind === 'size') { const s = (m.size || []).find(x => x.k === p.k); return !s ? 'new' : s.v === p.v ? 'match' : 'conflict'; }
  const f = (o.brief.facts || []).find(x => x.k.toLowerCase() === p.k.toLowerCase());
  return !f ? 'new' : f.v === p.v ? 'match' : 'conflict';
}
function packCur(p) {
  const o = O(), m = o.meta;
  if (p.kind === 'meta') return p.k === 'value' ? (m.value != null ? '₹' + fmtN(m.value) + ' Cr' : '') : p.k === 'mld' ? (m.mld ? m.mld + ' MLD' : '') : fmtD(m[p.k] || '');
  if (p.kind === 'size') { const s = (m.size || []).find(x => x.k === p.k); return s ? s.v : ''; }
  const f = (o.brief.facts || []).find(x => x.k.toLowerCase() === p.k.toLowerCase()); return f ? f.v : '';
}
function packApply(p) {
  const o = O(), m = o.meta;
  if (p.kind === 'meta') m[p.k] = p.v;
  else if (p.kind === 'size') { const s = (m.size || []).find(x => x.k === p.k); if (s) s.v = p.v; else (m.size = m.size || []).push({ id: uid(), k: p.k, v: p.v, n: p.why ? 'after ' + p.why : '' }); }
  else { const f = o.brief.facts.find(x => x.k.toLowerCase() === p.k.toLowerCase()); if (f) { f.v = p.v; f.src = p.src; } else o.brief.facts.push({ id: uid(), k: p.k, v: p.v, src: p.src }); }
  delete aiS(o).f[p.k];
  log('Accepted from the tender pack', `${p.l}: ${p.show || p.v} (${p.src})`);
}

/* Fit score, with the factors behind it. Computed from the records where it can be. */
function fitFactors() {
  const o = O(), m = o.meta, out = [];
  const past = Object.entries(PAST).map(([k, p]) => ({ k, ...p, ...((typeof KB_PROJ !== 'undefined' && KB_PROJ[k]) || {}) }));
  const bigger = past.filter(p => p.res === 'Won' && m.mld && p.mld >= m.mld * 0.7).sort((a, b) => b.mld - a.mld)[0];
  if (bigger) out.push([bigger.mld >= m.mld ? 12 : 8, `Delivered ${bigger.name}`, `${bigger.mld} MLD against ${m.mld} MLD here`, bigger.k]);
  else out.push([-6, 'No comparable plant delivered', m.mld ? `Nothing won at ${Math.round(m.mld * 0.7)} MLD or more` : 'Design flow not set', '']);
  const pass = o.elig.filter(e => e.res === 'pass').length;
  if (o.elig.length) out.push([pass === o.elig.length ? 8 : 4, `${pass} of ${o.elig.length} eligibility criteria pass`, o.elig.filter(e => e.res !== 'pass').map(e => e.c.split(' ')[0] + ' ' + e.res).join(', ') || 'none open', 'elig']);
  const ham = past.find(p => /HAM/.test(p.name));
  if (m.model === 'ham' && ham) out.push([ham.res === 'Won' ? 6 : 2, 'Hybrid annuity bid before', `${ham.name} · ${ham.res.toLowerCase()}`, ham.k]);
  const sameClient = past.some(p => p.client && p.client === m.client);
  out.push([sameClient ? 4 : -4, sameClient ? 'Delivered for this client before' : 'First bid with this client', sameClient ? m.client : 'no reference contact yet', '']);
  if (isSeed()) out.push([4, 'Home state, AMRUT-funded', 'Maharashtra municipal STP with central funding', '']);
  if (isSeed()) out.push([-2, 'Strong incumbent competitor', 'Vishwa Aqua L1 in 4 of the last 9 comparable bids', '']);
  return out;
}
function aiFit() {
  const o = O(), m = o.meta, F = fitFactors(), sug = Math.max(0, Math.min(100, 50 + F.reduce((a, f) => a + f[0], 0))), ed = can('meta');
  const diff = m.fit != null && m.fit !== '' && +m.fit !== sug;
  return `<div class="panel aip"><div class="ph"><h3>${aiTag()} Fit score, explained</h3></div><div class="pb stack" style="gap:10px">
   <div class="aifit"><span><small>Suggested</small><b>${sug}</b></span><span><small>On the record</small><b>${m.fit != null && m.fit !== '' ? m.fit : '—'}</b></span>${ed && diff ? `<button class="btn sm ghost" data-a="aifit" data-v="${sug}">Use ${sug}</button>` : ''}</div>
   <div class="aifx">${F.map(f => `<div class="${f[0] >= 0 ? 'up' : 'dn'}"><span class="mono">${f[0] > 0 ? '+' : ''}${f[0]}</span><span><b>${esc(f[1])}</b><span class="sub">${esc(f[2])}${f[3] && PAST[f[3]] ? ` · <span class="kbsrc">${esc(f[3])}</span>` : ''}</span></span></div>`).join('')}</div>
   <span class="sub">Starts at 55 and moves by each factor. A person sets the score on the record; this is advice.</span></div></div>`;
}

/* Seen before: the past bids nearest to this one, and why they matched. */
const SEEN_NOTE = { 'PB-2025-01': 'Lost at L2 by 1.8% — same model, same competitor', 'PB-2021-04': 'Same process (SBR) and a 10-year O&M', 'PB-2023-02': 'STP with a trunk sewer, as here' };
function aiSeen() {
  const m = O().meta;
  const near = Object.entries(PAST).map(([k, p]) => ({ k, ...p, d: Math.abs((p.mld || 0) - (m.mld || 0)) + (/HAM/.test(p.name) && m.model === 'ham' ? -60 : 0) })).sort((a, b) => a.d - b.d).slice(0, 3);
  return `<div class="panel aip"><div class="ph"><h3>${aiTag()} Seen before</h3><span class="sub">From the knowledge library</span></div><div class="pb flush">${near.map(p => `<div class="flag"><div class="sev ${p.res === 'Won' ? 'pass' : 'high'}"></div><div class="body"><b style="font-size:13px">${esc(p.name)}</b><span class="sub">${p.res} · ${p.yr}${SEEN_NOTE[p.k] && isSeed() ? ' · ' + esc(SEEN_NOTE[p.k]) : ` · ${p.mld} MLD`}</span></div><span class="kbsrc">${esc(p.k)}</span></div>`).join('')}</div></div>`;
}

/* Key dates: the page each date was read from. */
const AI_DATESRC = { 'NIT published': 'itb:1:NIT', 'Pre-bid meeting': 'itb:2:NIT', 'Corrigendum cut-off': 'itb:2:NIT', 'Technical bid (envelope A)': 'itb:2:NIT', 'Technical bid due': 'itb:2:NIT', 'Financial bid opening': 'itb:2:NIT', COD: 'ca:18:§4.1' };
const aiDateSrc = d => isSeed() && AI_DATESRC[d.k] ? ` ${src(AI_DATESRC[d.k])}` : '';

/* =====================================================================
   Stage 2 · Ingest — ask the pack, routing, classification, what changed,
   and what the pack refers to but does not contain
   ===================================================================== */

const AI_ASK = [
  { q: 'What is the treated BOD limit?', re: /bod|effluent|biochemical/i, a: 'BOD below 10 mg/l, with TSS below 10 mg/l and faecal coliform below 100 MPN/100 ml.', src: ['c1:1:§1'], note: ['Superseded', 'Vol II §3.4 said below 20 mg/l. Corrigendum 01 replaces it; the older figure is kept in history, not deleted.', 'v2:17:§3.4'] },
  { q: 'How many SBR basins are required?', re: /sbr|basin/i, a: 'At least four basins in parallel, each sized for 25% of the design flow.', src: ['v2:44:§3.2.1'] },
  { q: 'What is the outfall freeboard?', re: /freeboard|outfall/i, a: 'Vol II asks for at least 0.50 m of freeboard at the outfall chamber at peak flow.', src: ['v2:52:§3.6'], note: ['Conflict', 'Drawing P-010 shows 0.30 m. The two disagree; precedence is settled on the Rules tab, by a person.', 'dwg:1:P-010'] },
  { q: 'What is the energy guarantee?', re: /energy|kwh|power/i, a: '0.21 kWh/m³ at most, proved over the 90-day performance test before COD. Each 0.01 above it costs ₹1.2 Cr a year.', src: ['v2:296:§11.1', 'v2:302:§11.4'] },
  { q: 'What counts as a similar work?', re: /similar|eligib|threshold|works/i, a: 'One work of 80%, two of 50% or three of 40% of the estimated cost, completed in the last seven years.', src: ['itb:9:§4.2(a)'], note: ['Amended', 'Corrigendum 02 raised the three-works threshold from 35% to 40%.', 'c2:1:§1'] }
];
function askPack(q) { const hit = isSeed() ? AI_ASK.find(x => x.re.test(q)) : null; S.ui.ask = { q, hit }; log('Asked the tender pack', q); }

/* Each unresolved page goes to the person whose discipline it is. */
const DISC_OWNER = { Engineering: 'process', 'E&I': 'ei', Contract: 'contracts', Quantities: 'estimator', Survey: 'pipeline', Process: 'process', Commercial: 'bid_manager', Addendum: 'bid_manager', Forms: 'bid_manager' };
function aiOwner(c) {
  const d = O().docs.find(x => x.id === c.doc); if (!d) return '';
  const r = d.disc === 'Drawings' ? (/\bL-\d/.test(c.pages) ? 'pipeline' : /\bI-\d/.test(c.pages) ? 'ei' : 'process') : DISC_OWNER[d.disc] || 'bid_manager';
  return `<span class="aiown" title="Routed by discipline: ${esc(d.disc)}">${aiMk('Routed by discipline: ' + d.disc)}${esc(ROLES[r].name)}</span>`;
}

/* Classification: proposed from the file itself, confirmed by a person. */
function guessType(d) {
  const n = (d.fname || d.name || '').toLowerCase();
  const T = [[/corr|addend|amend/, 'Addendum', 'Addendum', 94], [/\bboq\b|bill of quant|schedule.?b|rate/, 'BOQ', 'Quantities', 92], [/itb|nit|instruction|rfp|tender notice/, 'RFP / ITB', 'Commercial', 91], [/agreement|contract|gcc|concession/, 'Contract / GCC', 'Contract', 89], [/geotech|survey|soil|topo/, 'Report', 'Survey', 88], [/form|format|annex/, 'Form', 'Forms', 84], [/spec|vol|technical/, 'Specification', 'Engineering', 82]];
  const h = T.find(t => t[0].test(n)); if (h) return { type: h[1], disc: h[2], conf: h[3] };
  return d.kind === 'dwg' || d.kind === 'img' ? { type: 'Drawing', disc: 'Drawings', conf: 86 } : d.kind === 'xls' ? { type: 'BOQ', disc: 'Quantities', conf: 70 } : { type: 'Other', disc: 'General', conf: 40 };
}

/* What changed: each corrigendum, and every record it touches — counted live. */
function aiChanges() {
  const o = O(), A = aiS(o), ed = can('docs');
  return `<div class="panel aip"><div class="ph"><h3>${aiTag()} What changed</h3><span class="sub">Old values are superseded, never overwritten</span></div><div class="pb flush">${o.addenda.map(a => {
    const d = o.docs.find(x => x.id === a.doc), code = d ? d.code : '';
    const reqs = code ? o.reqs.filter(r => String(r.src || '').startsWith(code + ':')) : [], bas = code ? o.basis.filter(b => String(b.src || '').startsWith(code + ':')) : [], el = /similar|threshold/i.test(a.title) ? o.elig.filter(e => /similar/i.test(e.c)) : [];
    const touch = [reqs.length ? [`${reqs.length} requirement${reqs.length > 1 ? 's' : ''} now cite it`, reqs.map(r => r.id).join(', '), 'reqs'] : null, bas.length ? [`${bas.length} design basis value${bas.length > 1 ? 's' : ''} re-opened`, bas.map(b => b.f).join(', '), 'eng'] : null, el.length ? ['Eligibility re-run', el.map(e => `${e.c.split(':')[0]} → ${e.res}`).join('; '), 'elig'] : null, ...String(a.impact || '').split('\n').filter(x => x && !(el.length && /eligibility/i.test(x)) && !(bas.length && /design basis/i.test(x))).map(x => [x, '', /BOQ/.test(x) ? 'est' : /proposal/i.test(x) ? 'pdraft' : /filter/i.test(x) ? 'eng' : ''])].filter(Boolean);
    return `<div class="aichg"><div class="row between" style="gap:8px"><span><b>${esc(a.no)}</b> <span class="sub">${esc(a.date)}</span></span>${A.chg[a.no] ? '<span class="chip ok">Impact reviewed</span>' : ed ? `<button class="btn sm" data-a="chgok" data-v="${esc(a.no)}">Mark reviewed</button>` : '<span class="chip warn">Not reviewed</span>'}</div>
     <span class="sub">${esc(a.title)}</span><ul>${touch.map(t => `<li>${t[2] ? `<button class="linkbtn" data-a="tab" data-t="${t[2]}">${esc(t[0])}</button>` : esc(t[0])}${t[1] ? `<span class="sub"> · ${esc(t[1])}</span>` : ''}</li>`).join('')}</ul></div>`;
  }).join('')}</div></div>`;
}

/* What the pack refers to but does not contain. */
const AI_REFS = [['Vol I · Instructions to bidders', 'itb'], ['Vol II · Process, civil, mechanical', 'v2'], ['Vol III · Electrical, I&C, SCADA', 'v3'], ['Draft concession agreement', 'ca'], ['Tender drawings', 'dwg'], ['Schedule B · BOQ', 'boq'], ['Geotechnical and survey report', 'geo'], ['Bid formats', 'frm'], ['Schedule H · O&M performance standards', '', 'ca:61:§18.2'], ['Annexure F · Performance security format', '', 'itb:24:§34.2']];
function aiMissing() {
  const o = O(), have = new Set(o.docs.map(d => d.code)), miss = AI_REFS.filter(r => !have.has(r[1]) || !r[1]);
  return `<div class="panel aip"><div class="ph"><h3>${aiTag()} Missing from the pack</h3><span class="sub">${AI_REFS.length - miss.length} of ${AI_REFS.length} referenced documents present</span></div><div class="pb flush">${miss.length ? miss.map(r => `<div class="flag"><div class="sev medium"></div><div class="body"><b style="font-size:13px">${esc(r[0])}</b><span class="sub">Referenced ${r[2] ? 'in ' + src(r[2]) : 'by the ITB'}, not uploaded</span></div><button class="btn sm" data-a="tab" data-t="clar">Raise a query</button></div>`).join('') : '<div class="pb"><p class="sub">Every document the tender refers to is here.</p></div>'}</div></div>`;
}

/* =====================================================================
   Stage 4 · Bid / no-bid — a suggested score with the reasoning behind it
   ===================================================================== */

// [+/-, statement, source]. A source is a citation, a record id or a knowledge-library id.
const AI_G1 = {
  'Strategic fit': { conf: 'High', why: [['+', 'Municipal STP under hybrid annuity in the home state', 'itb:1:§1.1'], ['+', 'AMRUT-funded, so annuity payments are backed beyond the corporation', 'ca:61:§23.1'], ['−', 'The 15-year O&M ties the operations team up to 2044', 'ca:61:§18.1']], move: 'A second HAM award in Maharashtra would make this a 5.' },
  'Technical capability': { conf: 'High', why: [['+', 'Vadodara 150 MLD SBR delivered and operated since 2021', 'PB-2021-04'], ['+', 'Four-basin SBR matches the tender’s own configuration', 'v2:44:§3.2.1'], ['−', 'Largest SBR delivered is 150 MLD; this is 200 MLD, a third larger', 'v2:14:§3.1']], move: 'A 200 MLD reference, or a JV partner holding one, makes this a 5.' },
  'Capacity (bid team & execution)': { conf: 'Medium', why: [['+', 'Pipeline crew is free from Q1 2027', ''], ['−', 'Rajkot peaks in Q2 2027, the same months as this tender’s civil works', 'PB-2023-02'], ['−', 'The bid team is carrying nine live tenders', '']], move: 'Moving Rajkot’s peak, or naming a second site manager, makes this a 4.' },
  'Margin potential': { conf: 'Medium', why: [['+', 'Peer awards at ₹5.9–6.6 Cr/MLD put this at ₹1,180–1,320 Cr; the estimate sits inside', ''], ['−', 'Tertiary filtration added by Corrigendum 01 may not be in the client’s estimate', 'c1:1:§2'], ['−', 'Annuity interest at bank rate compresses the return', 'ca:61:§23.1']], move: 'The client confirming the estimate was revised for Corr-01 makes this a 4.' },
  Competition: { conf: 'Medium', why: [['−', 'Vishwa Aqua was L1 in 4 of the last 9 comparable bids', ''], ['−', 'Nashik was lost at L2 by 1.8% against the same field', 'PB-2025-01'], ['+', 'Corrigendum 02 raised the threshold, which should thin the field', 'c2:1:§1']], move: 'Fewer than four qualified bidders at the technical opening makes this a 3.' },
  'Client relationship': { conf: 'Low', why: [['−', 'First bid with Indrayani MC', ''], ['+', 'Attended the pre-bid meeting and filed queries on the record', 'clar'], ['−', 'No reference contact at the client yet', '']], move: 'A meeting with the city engineer before submission makes this a 4.' }
};
/* Three criteria are worked out from live records rather than written down. */
function g1Reason(r) {
  const o = O();
  if (r.c === 'Eligibility') {
    if (!o.elig.length) return { conf: 'None', why: [['?', 'No eligibility criteria on the record yet', '']], move: 'List the criteria on the Eligibility tab and this is worked out from them.' };
    const why = o.elig.map(e => [e.res === 'pass' ? '+' : e.res === 'fail' ? '−' : '?', `${e.c.split('(')[0].trim()}: ${e.res === 'pass' ? 'passes' : e.res === 'fail' ? 'fails' : 'not yet shown'} — ${e.ours}`, e.src]);
    /* Cross-check the claimed values against the knowledge library: the source of truth. */
    const clash = [];
    if (typeof KB_PROJ !== 'undefined') Object.entries(KB_PROJ).forEach(([k, p]) => { const city = (p.client || '').split(' ')[0]; o.elig.forEach(e => { const m = new RegExp(city + '[^₹]*₹([\\d,]+) Cr').exec(e.ours || ''); if (city && m && p.value && num(m[1]) !== p.value) clash.push(['!', `${city}: the claim says ₹${m[1]} Cr; the knowledge library holds ₹${fmtN(p.value)} Cr`, k]); }); });
    return { conf: clash.length ? 'Low' : o.elig.some(e => e.res !== 'pass') ? 'Medium' : 'High', why: [...why, ...clash], move: clash.length ? 'Reconcile the project values with the knowledge library before relying on this score.' : o.elig.some(e => e.res !== 'pass') ? 'Closing the open criteria makes this a 5.' : 'Already the maximum.' };
  }
  if (r.c === 'Long-lead feasibility') {
    const late = o.longlead.filter(x => llFloat(x) < 0);
    if (!o.longlead.length) return { conf: 'None', why: [['?', 'No long-lead plan on the record yet', '']], move: 'Add the long-lead items on the Procurement tab.' };
    return { conf: 'High', why: o.longlead.length ? o.longlead.map(l => [llFloat(l) < 0 ? '−' : '+', `${l.item}: ${llFloat(l) < 0 ? `${-llFloat(l)} month${llFloat(l) < -1 ? 's' : ''} late unless ordered early` : 'arrives in time'}`, '']) : [['?', 'No long-lead plan yet', '']], move: late.length ? `An early order for the ${late[0].item} makes this a 5.` : 'Already on time.' };
  }
  if (r.c === 'Contract risk') {
    const hi = o.risks.filter(x => x.l * x.i >= 16);
    if (!o.risks.length) return { conf: 'None', why: [['?', 'No risks on the record yet', '']], move: 'Build the risk register and this is worked out from it.' };
    return { conf: 'High', why: hi.length ? hi.map(x => ['−', `${x.id}: ${x.risk}`, x.src || '']) : [['+', 'No risk scores 16 or more', '']], move: hi.length ? `Pricing or transferring ${hi[0].id} lifts this by a point.` : 'Already low.' };
  }
  if (AI_G1[r.c] && isSeed()) return AI_G1[r.c];
  return { conf: r.ev ? 'Low' : 'None', why: [['?', r.ev ? `Based only on the note: ${r.ev}` : 'No evidence on the record yet', '']], move: 'Add evidence to the record and the suggestion is worked out again.' };
}
const whySrc = s => !s ? '' : PAST[s] ? `<span class="kbsrc">${esc(s)}</span>` : s === 'clar' ? `<button class="src" data-a="tab" data-t="clar">${IC.doc}Clarifications</button>` : src(s);
function aiWhyRow(r) {
  if (S.ui.g1why !== r.id && S.ui.g1why !== 'all') return '';
  const R_ = g1Reason(r), sug = g1Sug(r), ov = r.ov != null && r.ov !== '';
  return `<tr class="g1why"><td colspan="6"><div class="aiwhy"><div class="aiwhy-h">${aiMk()}<b>Why ${sug} out of 5</b><span class="chip ${R_.conf === 'High' ? 'ok' : R_.conf === 'Low' || R_.conf === 'None' ? 'warn' : ''}">${R_.conf === 'None' ? 'No evidence' : R_.conf + ' confidence'}</span>${ov ? `<span class="sub">You set ${r.ov}; the suggestion stays visible beside it.</span>` : ''}</div>
   <ul>${R_.why.map(w => `<li class="w-${w[0] === '+' ? 'up' : w[0] === '−' ? 'dn' : w[0] === '!' ? 'bad' : 'q'}"><span class="mk">${w[0] === '!' ? '!' : w[0]}</span><span>${esc(w[1])}</span>${whySrc(w[2])}</li>`).join('')}</ul>
   <span class="sub"><b>What would move it:</b> ${esc(R_.move)}</span></div></td></tr>`;
}
const aiWhyBtn = r => `<button class="btn sm ghost aiwhybtn" data-a="g1why" data-id="${r.id}" aria-expanded="${S.ui.g1why === r.id || S.ui.g1why === 'all'}">${S.ui.g1why === r.id || S.ui.g1why === 'all' ? 'Hide' : 'Why?'}</button>`;

/* ---------------- actions ---------------- */
Object.assign(ACT, {
  aiacc: d => { if (!can('meta')) return 'skip'; const p = AI_PACK.find(x => x.k === d.k); if (p) { packApply(p); toast(`${p.l} written to the record, with its source.`); } },
  aikeep: d => { if (!can('meta')) return 'skip'; const p = AI_PACK.find(x => x.k === d.k); aiS(O()).f[d.k] = 'kept'; log('Kept the record over the tender pack', p ? p.l : d.k); },
  aiaccall: () => { if (!can('meta')) return 'skip'; const l = AI_PACK.filter(p => packState(p) === 'new'); l.forEach(packApply); toast(`${l.length} value${l.length === 1 ? '' : 's'} written to the record, each with its source.`); },
  aifit: d => { if (!can('meta')) return 'skip'; O().meta.fit = +d.v; log('Set fit score from the AI suggestion', d.v); },
  askpk: d => { askPack(d.q); },
  clsok: d => { if (!can('docs')) return 'skip'; const o = O(), x = o.docs.find(y => y.id === d.id); if (!x) return 'skip'; x.type = d.t; x.disc = d.d; aiS(o).cls[d.id] = true; log('Confirmed document classification', `${d.id} · ${d.t}`); },
  chgok: d => { if (!can('docs')) return 'skip'; aiS(O()).chg[d.v] = true; log('Reviewed corrigendum impact', d.v); },
  g1why: d => { S.ui.g1why = S.ui.g1why === d.id ? null : d.id; }
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'askpackform') return; e.preventDefault();
  const v = (document.getElementById('askpack') || {}).value || ''; if (!v.trim()) return;
  askPack(v.trim()); render();
});

/* =====================================================================
   Stage 3 · Intelligence — eligibility matcher and evidence verifier;
   the conflict → precedence → query chain, with the strategy-leak check
   ===================================================================== */

const ymd = s => { const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(String(s || '')); return m ? new Date(+m[1], +m[2] - 1, +(m[3] || 1)) : null; };
const yrsBetween = (a, b) => (b - a) / (365.25 * 864e5);
const crN = v => '₹' + (Math.abs(v) < 10 ? (+v).toFixed(1) : fmtN(Math.round(v))) + ' Cr';
const isoL = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/* ---------- eligibility matcher: the claim against the knowledge library ---------- */
function simWorks() {
  const o = O(), m = o.meta, row = o.elig.find(e => /similar/i.test(e.c));
  if (!row) return null;
  const routes = [...row.c.matchAll(/(\d)\s*≥\s*(\d+)\s*%/g)].map(x => [+x[1], +x[2]]);
  const yrs = +((/(\d+)\s*yrs?/i.exec(row.c) || [])[1] || 7), est = num(m.value), sub = ymd(m.submission) || new Date();
  const lib = typeof KB_PROJ === 'undefined' ? [] : Object.entries(KB_PROJ).map(([k, p]) => ({ k, name: (PAST[k] || {}).name || p.client, ...p }));
  const why = p => !p.certHeld ? (/part/i.test(p.cert) ? 'Part completion only' : 'Not awarded') : !ymd(p.done) ? 'No completion date' : yrsBetween(ymd(p.done), sub) > yrs ? `Completed over ${yrs} years before submission` : '';
  const cands = lib.filter(p => !why(p)), out = lib.filter(p => why(p)).map(p => ({ ...p, why: why(p) }));
  const esc7 = p => p.value * Math.pow(1.07, Math.max(0, yrsBetween(ymd(p.done), sub)));
  const res = routes.map(([n, pct]) => { const thr = est * pct / 100, q = cands.filter(p => p.value >= thr), q7 = cands.filter(p => esc7(p) >= thr); return { n, pct, thr, q, met: q.length >= n, met7: q7.length >= n }; });
  return { row, routes: res, cands: cands.sort((a, b) => b.value - a.value), out, est, yrs, esc7, met: res.some(r => r.met), met7: res.some(r => r.met7) };
}

/* ---------- credentials, checked against submission and bid validity ---------- */

/* ---------- evidence verifier: an attachment is read, never simply trusted ---------- */
function aiEvid(r) {
  const v = r.vfy; if (!v) return '';
  const ed = can('elig');
  return `<div class="aivfy">${aiMk('Read by bidPlan')}<b>${esc(v.file)}</b>${v.state === 'reading' ? '<span class="sub">Reading…</span>' : `<ul>${v.find.map(f => `<li class="w-${f[0] === '+' ? 'up' : f[0] === '−' ? 'dn' : 'q'}"><span class="mk">${f[0]}</span><span>${esc(f[1])}</span></li>`).join('')}</ul><span class="sub"><b>${esc(v.verdict)}</b></span>${ed && r.res !== 'pass' ? `<div class="row" style="gap:6px"><button class="btn sm ok" data-a="evok" data-id="${r.id}">Accept as pass</button><button class="btn sm ghost" data-a="evno" data-id="${r.id}">Not sufficient</button></div>` : ''}`}</div>`;
}
async function aiVerify(r, f) {
  const need = num((/₹\s*([\d,]+)/.exec(r.need) || [])[1]), key = (r.c.match(/[A-Za-z]{5,}/) || [''])[0].toLowerCase();
  let txt = '';
  try { if (/\.pdf$/i.test(f.name)) { const k = 'EV' + Date.now(); FILES[k] = f; const pdf = await loadPdf(k); for (let p = 1; p <= Math.min(pdf.numPages, 4); p++) txt += '\n' + await pageText(k, p); } else if (/\.(txt|csv)$/i.test(f.name)) txt = await f.text(); } catch (e) { txt = ''; }
  const find = [];
  if (!txt.trim()) { r.vfy = { file: f.name, state: 'done', find: [['?', 'No readable text in this file — it may be a scan. A person has to read it.']], verdict: 'Left for review: nothing could be checked automatically.' }; render(); return; }
  find.push(new RegExp(key, 'i').test(txt) ? ['+', `Mentions “${key}”, matching the criterion`] : ['−', `Does not mention “${key}”; this may be the wrong document`]);
  const amts = [...txt.matchAll(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)\s*(crore|cr\b|lakh|lac)?/gi)].map(x => num(x[1]) * (/lakh|lac/i.test(x[2] || '') ? 0.01 : /cr/i.test(x[2] || '') ? 1 : 1e-7));
  if (need) { const mx = Math.max(0, ...amts); find.push(!amts.length ? ['?', 'No amount found'] : mx >= need ? ['+', `States ₹${fmtN(+mx.toFixed(1))} Cr against ₹${fmtN(need)} Cr required`] : ['−', `States ₹${fmtN(+mx.toFixed(1))} Cr; ₹${fmtN(need)} Cr is required`]); }
  const dts = [...txt.matchAll(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})\b/g)].map(x => new Date(+x[3], +x[2] - 1, +x[1])).filter(d => !isNaN(d)), sub = ymd(O().meta.submission) || new Date();
  if (dts.length) { const d = new Date(Math.max(...dts)), mo = Math.round(yrsBetween(d, sub) * 12); find.push(mo <= 12 ? ['+', `Dated ${fmtDate(isoL(d))}, ${mo} month${mo === 1 ? '' : 's'} before submission`] : ['−', `Dated ${fmtDate(isoL(d))}, ${mo} months before submission — likely too old`]); } else find.push(['?', 'No date found']);
  const issuer = (txt.split('\n').find(l => /bank|limited|ltd|chartered/i.test(l)) || '').trim();
  if (issuer) find.push(['+', `Issued by: ${issuer.slice(0, 80)}`]);
  const bad = find.some(x => x[0] === '−');
  r.vfy = { file: f.name, state: 'done', find, verdict: bad ? 'Does not appear sufficient. A person decides.' : 'Looks sufficient. A person confirms before it counts.' };
  log('Read eligibility evidence', `${f.name}: ${bad ? 'issues found' : 'no issues found'}`); render();
}

/* ---------- conflicts: found, checked against precedence, carried to a query ---------- */
// settles: true when the tender's own order of precedence decides it; then no query is needed.
const AI_CONFLICTS = [
  { id: 'C1', topic: 'Raw sewage BOD', a: ['Vol II design basis: 200 mg/l', 'v2:42:§3.1'], b: ['Site data, 12-month mean: 271 mg/l', 'raw:1:Summary'], settles: false, why: 'Not a precedence question. Site data is not a contract document, so 200 mg/l governs the contract — and 271 mg/l governs the risk of missing the guarantee.', rule: 'R-01', query: 'PBQ-03', risk: 'R-01', disc: 'Process' },
  { id: 'C2', topic: 'Outfall free fall', a: ['Vol II: at least 0.5 m over HFL', 'v2:44:§3.2.4'], b: ['Drawing P-010: 0.30 m', 'dwg:P-010'], settles: true, why: 'Vol II governs over drawings. Design to 0.5 m and price raising the outfall; a query is only needed to ask for an alternative.', rule: 'R-04', query: 'PBQ-07', disc: 'Process' },
  { id: 'C3', topic: 'Number of SBR basins', a: ['Vol II: four basins in parallel', 'v2:44:§3.2.1'], b: ['Drawings: six-basin layout', 'dwg:P-001'], settles: true, why: 'Vol II governs over drawings. Priced at 4 × 50 MLD; the six-basin layout is kept as an alternate.', rule: 'R-03', disc: 'Process' },
  { id: 'C4', topic: 'Treated BOD', a: ['Vol II guarantee table: below 20 mg/l', 'v2:298:§11.2'], b: ['Corrigendum 01: below 10 mg/l', 'c1:1:§1'], settles: true, why: 'Corrigenda govern, the later prevailing. 10 mg/l is applied to the basis, calculator and proposal.', rule: 'R-02', disc: 'Process' },
  { id: 'C5', topic: 'NH₄-N analyser at the outlet', a: ['Vol III: online NH₄-N monitoring', 'v3:88:§4.2'], b: ['Drawing I-401: no NH₄-N analyser', 'dwg:I-401'], settles: true, why: 'The specification governs over drawings. Add the analyser to the E&I scope and the BOQ; no query needed.', disc: 'Electrical' },
  { id: 'C6', topic: 'Where the energy guarantee is measured', a: ['Vol II: guarantee at the plant', 'v2:302:§11.4'], b: ['Scope includes two intermediate pumping stations', 'itb:4:§2.3'], settles: false, why: 'The order of precedence cannot settle a silence. Whether the pumping stations count changes the guarantee, so it has to be asked.', query: 'PBQ-05', risk: 'R-04', disc: 'Electrical' },
  { id: 'C7', topic: 'O&M performance standards', a: ['Concession agreement: “as per Schedule H”', 'ca:61:§18.2'], b: ['Schedule H: not in the tender pack', ''], settles: false, why: 'A referenced schedule is missing, so there is nothing to apply precedence to.', draft: 'The draft concession agreement (§18.2) refers to Schedule H for the O&M performance standards. Schedule H is not included in the tender documents. Please issue Schedule H.', disc: 'Commercial' }
];
const cQuery = c => { const A = aiS(O()); return (A.cq || {})[c.id] || c.query || ''; };

/* ---------- clarifications: what each query reveals, and whether it is already answered ---------- */
const LEAK = /\b(may|can|could) the (bidder|contractor)\b|\balternative\b|\binstead of\b|\bin place of\b|\bflap gate\b|\bwe (propose|intend|plan|would)\b|\bvalue engineering\b|\bdeviat|\bour (design|approach|method|solution)\b/i;
const sentences = t => String(t).split(/(?<=[.?!])\s+/).filter(Boolean);
const leakOf = c => sentences(c.q).filter(s => LEAK.test(s));
const neutralOf = c => { const keep = sentences(c.q).filter(s => !LEAK.test(s)).join(' '); return (keep || c.q).replace(/\s*$/, '') + ' Please confirm which requirement governs.'; };
const STOP = new Set('please confirm whether which there their about between against the this that with from have will shall would could should into where when also only than then they them other given gives shows show'.split(' '));
const words = t => new Set(String(t).toLowerCase().match(/[a-z0-9₹.]{4,}/g)?.filter(w => !STOP.has(w)) || []);
function answeredBy(c) {
  const o = O(), w = words(c.q), hits = [];
  o.clars.filter(x => x.id !== c.id && x.status === 'answered').forEach(x => { const n = [...words(x.q)].filter(t => w.has(t)).length; if (n >= 3) hits.push([x.id, x.a]); });
  o.addenda.forEach(a => { const n = [...words(a.title + ' ' + (a.impact || ''))].filter(t => w.has(t)).length; if (n >= 3) hits.push([a.no, a.title]); });
  return hits;
}
const qPriority = c => /design basis|right.of.way|guarantee|eligib|liabil|payment|schedule h/i.test(c.q) ? 'High' : 'Medium';
function aiClarCheck(c) {
  const from = AI_CONFLICTS.find(x => cQuery(x) === c.id), lk = c.status === 'draft' ? leakOf(c) : [], ans = c.status !== 'answered' ? answeredBy(c) : [];
  const bits = [from ? `<button class="aich" data-a="tab" data-t="basis"><span class="sub">From conflict</span> <b>${esc(from.topic)}</b></button>` : '', c.status !== 'answered' ? `<span class="chip ${qPriority(c) === 'High' ? 'bad' : ''}">${qPriority(c)} impact</span>` : ''].filter(Boolean);
  return `${bits.length ? `<div class="row" style="gap:6px;margin-top:4px">${aiMk()}${bits.join('')}</div>` : ''}
   ${lk.length ? `<div class="note warn aileak"><div><span><b>Strategy check.</b> Pre-bid answers are published to every bidder, and this sentence tells them what we intend: “${esc(lk.join(' '))}”</span><div class="aileak-n"><span class="sub">Neutral wording</span><span>${esc(neutralOf(c))}</span></div>${can('clar') ? `<div class="row" style="gap:6px"><button class="btn sm" data-a="clneutral" data-id="${c.id}">Use neutral wording</button><span class="sub">or send as written — you will be asked once more.</span></div>` : ''}</div></div>` : ''}
   ${ans.length ? `<div class="note"><div><b>May already be answered:</b> ${ans.map(h => `${esc(h[0])} — ${esc(String(h[1]).slice(0, 90))}`).join('; ')}. Check before sending.</div></div>` : ''}`;
}

/* ---------- stage 3 actions ---------- */
Object.assign(ACT, {
  elrev: d => { if (!can('elig')) return 'skip'; const r = O().elig.find(e => e.id === d.id); if (!r) return 'skip'; r.res = 'review'; log('Set eligibility to evidence needed', `${r.c.split(':')[0]}: claim disagrees with the knowledge library`); toast('Marked as evidence needed. Gate readiness now shows it.'); },
  evok: d => { if (!can('elig')) return 'skip'; const r = O().elig.find(e => e.id === d.id); r.res = 'pass'; log('Verified eligibility evidence', `${r.c.split(':')[0]} · ${r.vfy ? r.vfy.file : ''}`); toast('Criterion passes on your verification. It is logged against your name.'); },
  evno: d => { if (!can('elig')) return 'skip'; const r = O().elig.find(e => e.id === d.id); r.res = 'review'; r.vfy = null; log('Rejected eligibility evidence', r.c.split(':')[0]); },
  precok: d => { if (!can('basis')) return 'skip'; const A = aiS(O()); A.prec = A.prec || {}; const c = AI_CONFLICTS.find(x => x.id === d.id); A.prec[d.id] = { by: R().name, ts: nowTs() }; log('Confirmed precedence resolution', `${c.topic}: ${c.why.split('.')[0]}`); },
  cfq: d => { if (!can('clar')) return 'skip'; const o = O(), c = AI_CONFLICTS.find(x => x.id === d.id), A = aiS(o); A.cq = A.cq || {}; const id = nextId(o.clars, 'PBQ-'); o.clars.push({ id, q: c.draft || `${c.a[0]} (${c.a[1]}) differs from ${c.b[0]}. Please confirm which governs.`, src: c.a[1], status: 'draft', disc: c.disc, req: '' }); A.cq[c.id] = id; log('Drafted query from conflict', `${id} · ${c.topic}`); toast(`${id} drafted on the Clarifications tab. Nothing is sent until a person sends it.`); },
  clneutral: d => { if (!can('clar')) return 'skip'; const c = O().clars.find(x => x.id === d.id); c.qWas = c.q; c.q = neutralOf(c); log('Reworded query to reveal less', c.id); }
});
/* Sending is gated on the strategy check: once warned, a second press sends as written. */
const _clarsend = ACT.clarsend, _clarall = ACT.clarall;
ACT.clarsend = d => { const o = O(), c = o.clars.find(x => x.id === d.id), A = aiS(o); A.lk = A.lk || {}; if (c && leakOf(c).length && !A.lk[c.id]) { A.lk[c.id] = 1; toast(`${c.id} reveals what we intend to every bidder. Use the neutral wording, or press Send again to send it as written.`); return; } if (c && A.lk[c.id]) log('Sent query despite the strategy check', c.id); return _clarsend(d); };
ACT.clarall = d => { const o = O(), A = aiS(o); A.lk = A.lk || {}; const l = o.clars.filter(c => c.status === 'draft' && leakOf(c).length && !A.lk[c.id]); if (l.length) { l.forEach(c => { A.lk[c.id] = 1; }); toast(`${l.map(c => c.id).join(', ')} reveal${l.length === 1 ? 's' : ''} our approach to every bidder. Reword, or press Send again to send everything as written.`); return; } return _clarall(d); };

/* =====================================================================
   Stage 3 · Intelligence (continued) — requirements read and routed;
   risks raised from the other tabs; the impact of every addendum
   ===================================================================== */

/* A small, inspectable text matcher. Words are cut to a four-letter stem so
   "filters" meets "filtration"; domain terms weigh double. It is deliberately
   simple: every match it reports can be checked by eye. */
const AI_STOPW = new Set('the and for with from that this which shall must will been have into upon such than then also only each other more less over under above below their there where when what whom been being were added please confirm whether given gives shows show tender bidder bidders client contractor authority clause section volume page'.split(' '));
const AI_DOMAIN = new Set(['bod', 'tss', 'cod', 'tert', 'filt', 'guar', 'outf', 'slud', 'sbr', 'ener', 'row', 'high', 'solv', 'simi', 'thre', 'elig', 'turn', 'exte', 'subm', 'dead', 'pump', 'anal', 'annu', 'paym', 'secu', 'liqu', 'dama', 'sche', 'scop', 'free', 'trea', 'rock', 'kwh']);
const stemsOf = t => new Set((String(t).toLowerCase().match(/[a-z0-9&]+/g) || []).filter(w => w.length >= 3 && !AI_STOPW.has(w) && !/^\d+$/.test(w)).map(w => w.length >= 4 ? w.slice(0, 4) : w));
const matchScore = (set, text) => [...stemsOf(text)].reduce((a, w) => a + (set.has(w) ? (AI_DOMAIN.has(w) ? 2 : 1) : 0), 0);

/* ---------- requirements: read, routed to their owner, tied to what proves them ---------- */
const AI_EVID = { Process: ['Process design report', 'General arrangement drawing'], Performance: ['Guarantee schedule', 'Process calculations'], Hydraulics: ['Hydraulic profile drawing'], Energy: ['Energy calculation', 'Equipment datasheets'], Pipeline: ['Pipe material schedule', 'Manufacturer certificates'], Sludge: ['Sludge mass balance', 'Centrifuge datasheet'], SCADA: ['I/O list', 'Analyser datasheets'], 'O&M': ['O&M organisation chart', 'Staffing plan'], Testing: ['PG test procedure'], Format: ['Envelope guard report'], Programme: ['L1 programme from Primavera'] };
const reqLang = r => /\b(shall|must)\b/i.test(r.text) ? 'obligation' : /minimum|at least|not less than|no more than|not exceed|≥|≤|<|>|within|\bno\b/i.test(r.text) ? 'limit' : 'statement';
function addDocOf(r) { const o = O(), code = String(r.src || '').split(':')[0]; const d = o.docs.find(x => x.code === code); return d ? o.addenda.find(a => a.doc === d.id) : null; }

/* ---------- risks: raised from what the other tabs found, and checked for a route ---------- */
function riskCands() {
  const o = O(), A = aiS(o), out = [], has = k => A.rdis && A.rdis[k] || o.risks.some(r => r.aiKey === k);
  const W = typeof simWorks === 'function' ? simWorks() : null;
  if (W && W.est && !W.met) out.push({ key: 'elig-sim', risk: 'Similar-works criterion not met on certified values; the bid may be disqualified at the technical opening', cat: 'Regulatory', l: 4, i: 5, impact: 0, treat: 'Avoid', owner: 'bid_manager', src: W.row.src, mit: 'Reconcile project values with the knowledge library; bring the JV partner’s certificates in before submission', from: ['Eligibility matcher', 'elig'] });
  if (typeof KB_CRED !== 'undefined') { const sub = ymd(o.meta.submission), today = typeof TODAY !== 'undefined' ? TODAY : new Date(), lap = sub ? KB_CRED.filter(c => { const e = ymd(c.exp); return e && e < sub; }) : []; if (lap.length) out.push({ key: 'cred-lapse', risk: `${lap.map(c => c.item).join(' and ')} ${lap.length > 1 ? 'lapse' : 'lapses'} before submission`, cat: 'Regulatory', l: 5, i: 5, impact: 0, treat: 'Avoid', owner: 'bid_manager', src: '', mit: 'Renew before the bid is uploaded; ' + lap.filter(c => ymd(c.exp) < today).length + ' already expired', from: ['Credentials check', 'elig'] }); }
  o.longlead.filter(l => llFloat(l) < 0).forEach(l => { const k = 'll-' + l.item; if (!o.risks.some(r => r.risk.toLowerCase().includes(l.item.toLowerCase().split(' ')[0]))) out.push({ key: k, risk: `${l.item} arrives ${-llFloat(l)} month${llFloat(l) < -1 ? 's' : ''} late unless ordered before award`, cat: 'Supply chain', l: 3, i: 3, impact: 2.5, treat: 'Price', owner: 'procurement', src: '', mit: 'Price an early order or a supplier reservation fee', from: ['Long-lead plan', 'proc'] }); });
  if (isSeed() && typeof AI_CONFLICTS !== 'undefined') AI_CONFLICTS.filter(c => !c.settles && !c.risk).forEach(c => out.push({ key: 'cf-' + c.id, risk: `${c.topic} unknown until the client answers (${c.b[0]})`, cat: 'Contract', l: 3, i: 4, impact: 0, treat: 'Clarify', owner: 'om', src: c.a[1], mit: 'Query raised from the conflict; price the O&M on the most onerous reading until answered', from: ['Conflict ' + c.id, 'basis'] }));
  if (isSeed()) out.push({ key: 'cf-C2', risk: 'Raising the outfall to give the 0.5 m free fall that drawing P-010 does not show', cat: 'Design', l: 4, i: 2, impact: 1.5, treat: 'Price', owner: 'process', src: 'v2:44:§3.2.4', mit: 'Price the raised outfall; the query asks only whether an alternative is acceptable', from: ['Conflict C2', 'basis'] });
  return out.filter(c => !has(c.key));
}
function riskGaps() {
  const o = O();
  return o.risks.map(r => {
    const g = [], q = (/PBQ-\d+/.exec(r.mit || '') || [])[0], qq = q && o.clars.find(c => c.id === q);
    if (!r.owner) g.push('No owner');
    if (r.treat === 'Clarify') { if (!qq) g.push('Treated as Clarify, but no query is linked'); else if (qq.status === 'answered') g.push(`${qq.id} has been answered — re-score this risk or close it`); }
    if (r.treat === 'Price' && !num(r.impact)) g.push('Treated as Price with no cost, so it adds nothing to the contingency');
    if (r.l * r.i >= 16 && r.treat === 'Accept') g.push('A high risk accepted without a price');
    return g.length ? { r, g } : null;
  }).filter(Boolean);
}
/* A lesson applies when it shares a domain term with the risk (rock, solvency, guarantee…). */
function lessonFor(text) {
  if (typeof KB_LESSON === 'undefined') return null;
  const s = stemsOf(text), best = KB_LESSON.map(x => { const t = stemsOf(x.lesson + ' ' + x.theme), dom = [...s].some(w => AI_DOMAIN.has(w) && t.has(w)); return [x, dom ? matchScore(s, x.lesson + ' ' + x.theme) : 0]; }).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] >= 2 ? best[0] : null;
}
function riskLessons() { return O().risks.map(r => { const l = lessonFor(r.risk + ' ' + (r.mit || '')); return l ? [r, l] : null; }).filter(Boolean); }

/* ---------- addenda and corrigenda: what each one touches, read the moment it is recorded ---------- */
const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function dateIn(t) {
  let m = /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(20\d{2})\b/i.exec(t);
  if (m) return isoL(new Date(+m[3], MON[m[2].toLowerCase()], +m[1]));
  m = /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})\b/.exec(t); return m ? isoL(new Date(+m[3], +m[2] - 1, +m[1])) : '';
}
function addImpact(a) {
  const o = O(), t = a.title || '', s = stemsOf(t), hit = (list, f, min = 3) => list.filter(x => matchScore(s, f(x)) >= min);
  const reqs = hit(o.reqs, r => r.text), bas = hit(o.basis, b => b.f + ' ' + b.v), elig = hit(o.elig, e => e.c, 3), risks = hit(o.risks, r => r.risk), qs = hit(o.clars.filter(c => c.status !== 'answered'), c => c.q), secs = hit(ensureProp().tree, n => n.title, 2);
  const fig = /from\s+([\d.,]+\s*%?)\s*(?:to|→)\s*([\d.,]+\s*%?)\s*([a-z/%³]*)/i.exec(t), when = dateIn(t), sched = /extend|extension|postpon|deadline|due date|submission|opening/i.test(t);
  const sev = elig.length || risks.length || /guarant|liabil|damage|securit|payment/i.test(t) || (sched && when) ? 'High' : reqs.length || bas.length ? 'Medium' : 'Low';
  const todo = [];
  if (reqs.length) todo.push([`Re-open ${reqs.length} requirement${reqs.length > 1 ? 's' : ''}`, reqs.map(r => r.id).join(', '), 'reqs']);
  if (bas.length) todo.push([`Re-check ${bas.length} design basis value${bas.length > 1 ? 's' : ''}`, bas.map(b => b.f).join(', '), 'eng']);
  if (reqs.length || bas.length) todo.push(['Re-price the affected work packages', 'the estimate draws on these values', 'est']);
  if (elig.length) todo.push(['Re-run eligibility', elig.map(e => e.c.split(':')[0]).join(', '), 'elig']);
  if (risks.length) todo.push([`Re-score ${risks.length} risk${risks.length > 1 ? 's' : ''}`, risks.map(r => r.id).join(', '), 'risks']);
  if (secs.length) todo.push([`Redraft ${secs.length} proposal section${secs.length > 1 ? 's' : ''}`, secs.map(n => n.title).join(', '), 'pdraft']);
  if (sched && when) todo.push(['Update the key dates and the bid calendar', `everything planned back from ${fmtDate(o.meta.submission)}`, 'brief']);
  if (sched && !when) todo.push(['Check the key dates', 'the text mentions the timetable but gives no date that could be read', 'brief']);
  return { reqs, bas, elig, risks, qs, secs, fig, when: sched ? when : '', sev, todo };
}

/* ---------- actions ---------- */
Object.assign(ACT, {
  rown: d => { S.ui.rown = S.ui.rown === d.v ? '' : d.v; },
  raiadd: d => { if (!can('risks')) return 'skip'; const o = O(), c = riskCands().find(x => x.key === d.k); if (!c) return 'skip'; const id = nextId(o.risks, 'R-'); o.risks.push({ id, risk: c.risk, cat: c.cat, l: c.l, i: c.i, impact: c.impact, treat: c.treat, owner: c.owner, src: c.src, mit: c.mit, aiKey: c.key }); S.ui.flashRow = id; log('Added a risk raised by AI', `${id} · from ${c.from[0]}`); toast(`${id} added to the register. Re-score it if you see it differently.`); },
  raidis: d => { if (!can('risks')) return 'skip'; const A = aiS(O()); A.rdis = A.rdis || {}; A.rdis[d.k] = R().name; log('Dismissed a risk raised by AI', d.k); },
  adans: d => { if (!can('clar')) return 'skip'; const o = O(), c = o.clars.find(x => x.id === d.id), a = o.addenda.find(x => x.no === d.no); if (!c || !a) return 'skip'; c.a = `${a.no}: ${a.title}`; c.status = 'answered'; if (typeof dropDependentDrafts === 'function') dropDependentDrafts(c.id); log('Recorded an addendum as the answer', `${c.id} ← ${a.no}`); toast(`${c.id} answered by ${a.no}. Paragraphs that depended on it will be redrafted.`); },
  adapply: d => { if (!can('meta')) { toast('Only the bid manager or BD head can move the bid date.'); return 'skip'; } const o = O(), was = o.meta.submission; o.meta.submission = d.d; const r = o.dates.find(x => /technical bid/i.test(x.k)); if (r) r.d = fmtDate(d.d); log('Moved the technical bid date', `${was} → ${d.d} (${d.no})`); toast(`Technical bid now due ${fmtDate(d.d)}, per ${d.no}.`); },
  adimp: d => { if (!can('clar')) return 'skip'; const a = O().addenda.find(x => x.no === d.no); if (!a) return 'skip'; a.impact = addImpact(a).todo.map(x => `${x[0]}: ${x[1]}`).join('\n'); log('Wrote AI impact notes to the record', a.no); }
});

/* =====================================================================
   Stage 4 · Before you decide — duplicate or re-tender, this client,
   this state, who else will bid, and what we are already carrying
   ===================================================================== */

/* Which state a client sits in, read from its name. Small and explicit on purpose. */
const AI_STATE = [[/indrayani|pimpri|chinchwad|pune|nashik|solapur|satara|mumbai|thane|nagpur|aurangabad|midc|maharashtra/i, 'Maharashtra'], [/vadodara|rajkot|surat|ahmedabad|bhavnagar|ankleshwar|gwssb|gujarat/i, 'Gujarat']];
const stateOf = t => (AI_STATE.find(s => s[0].test(t || '')) || [])[1] || '';
const firstWord = t => String(t || '').split(/\s+/)[0].toLowerCase();
function g1Context() {
  const o = O(), m = o.meta, me = m.id, cw = firstWord(m.client), st = stateOf(m.client + ' ' + (m.loc || ''));
  const past = Object.entries(PAST).map(([k, p]) => ({ k, ...p, ...((typeof KB_PROJ !== 'undefined' && KB_PROJ[k]) || {}) }));
  const live = (typeof PIPE !== 'undefined' ? PIPE : []).filter(p => p.id !== me);
  const ownOpps = Object.values(S.db.opps).filter(x => x.meta.id !== me).map(x => ({ id: x.meta.id, name: x.meta.name, client: x.meta.client, value: num(x.meta.value), due: x.meta.submission, stage: x.pos, closed: x.closed }));
  const all = [...ownOpps, ...live.filter(p => !ownOpps.some(x => x.id === p.id))];
  const words = stemsOf(m.name);
  /* duplicate: same client and most of the name; re-tender: same client and scope, earlier and closed */
  const dup = all.filter(p => firstWord(p.client) === cw && matchScore(words, p.name) >= 4);
  const retender = past.filter(p => firstWord(p.client) === cw && matchScore(words, p.name) >= 3);
  const sameClientLive = all.filter(p => firstWord(p.client) === cw && !dup.includes(p));
  const sameClientPast = past.filter(p => firstWord(p.client) === cw);
  const inState = st ? past.filter(p => stateOf(p.client + ' ' + p.name) === st) : [];
  const sub = ymd(m.submission), near = sub ? all.filter(p => { const d = ymd(p.due) || (/^\d{1,2} [A-Z][a-z]{2}$/.test(p.due || '') ? new Date(`${p.due} ${sub.getFullYear()}`) : null); return d && Math.abs(d - sub) <= 21 * 864e5 && !p.closed; }) : [];
  return { o, m, st, past, dup, retender, sameClientLive, sameClientPast, inState, near, comp: o.comp || [] };
}
function aiG1Context() {
  const C = g1Context(), m = C.m, cap = typeof KB_CRED !== 'undefined' ? KB_CRED.find(c => /bid capacity/i.test(c.item)) : null, capV = cap ? num((/₹([\d,]+)/.exec(cap.detail) || [])[1]) : 0;
  const lessonOf = p => typeof KB_LESSON !== 'undefined' ? KB_LESSON.find(l => l.proj === p.name) : null;
  const sig = (ok, t) => `<span class="chip ${ok === 1 ? 'ok' : ok === 0 ? 'warn' : 'bad'}">${t}</span>`;
  const sameClientValue = C.sameClientLive.reduce((a, p) => a + num(p.value), 0);
  const wonSt = C.inState.filter(p => p.res === 'Won').length;
  /* Two figures for the same loss is a source-of-truth problem worth showing. */
  const nashT = typeof TASKS !== 'undefined' ? Object.values(TASKS).flat().map(t => t[0]).find(t => /nashik/i.test(t) && /%/.test(t)) : '', nashL = typeof KB_LESSON !== 'undefined' ? KB_LESSON.find(l => /nashik/i.test(l.proj)) : null;
  const nT = nashT ? (/[−-]?([\d.]+)%/.exec(nashT) || [])[1] : '', nL = nashL ? (/by ([\d.]+)%/.exec(nashL.lesson) || [])[1] : '';
  const row = (h, chip, body) => `<div class="aictx"><div class="row between" style="gap:8px"><b>${h}</b>${chip}</div>${body}</div>`;
  return `<div class="panel aip"><div class="ph"><div><h3>${aiTag()} Before you decide</h3><span class="sub">What the BD Head would otherwise have to look up: is this new, who is the client to us, how we have done nearby, who else will bid, and what we are already carrying.</span></div></div><div class="pb flush">
   ${row('Duplicate or re-tender', C.dup.length ? sig(-1, 'Possible duplicate') : C.retender.length ? sig(0, 'Re-tender') : sig(1, 'New tender'), C.dup.length ? `<span class="sub">${C.dup.map(p => `${esc(p.id)} · ${esc(p.name)}`).join('; ')} is already in the pipeline for the same client. Merge before anyone works on both.</span>` : C.retender.length ? `<span class="sub">The same client tendered similar work before: ${C.retender.map(p => `${esc(p.name)} (${p.yr}, ${esc(p.res.toLowerCase())})`).join('; ')}. Find out why the first tender did not proceed.</span>` : `<span class="sub">No earlier tender for this work in the pipeline or the knowledge library, and the NIT carries no re-tender number. ${src('itb:1:NIT')}</span>`)}
   ${row('This client and us', C.sameClientPast.length ? sig(1, `${C.sameClientPast.length} past`) : sig(0, 'No history'), `<span class="sub">${C.sameClientPast.length ? C.sameClientPast.map(p => `${esc(p.name)} · ${esc(p.res)}`).join('; ') : `We have never delivered for or bid to ${esc(m.client)}.`}</span>${C.sameClientLive.length ? `<span class="aiwarn"><b>Bidding them ${C.sameClientLive.length + 1} times at once.</b> ${C.sameClientLive.map(p => `${esc(p.name)} (${crN(num(p.value))}, due ${esc(p.due)})`).join('; ')} — ${crN(num(m.value) + sameClientValue)} with one client. Use one relationship lead and one set of references for both.</span>` : ''}`)}
   ${C.st ? row(`Our record in ${esc(C.st)}`, sig(wonSt ? 1 : -1, `${wonSt} won of ${C.inState.length}`), `<ul class="aidrv">${C.inState.map(p => { const l = lessonOf(p); return `<li><span><b>${esc(p.name)}</b> <span class="sub">· ${esc(p.res)}${l ? ` — ${esc(l.lesson)}` : ''}</span></span><span class="kbsrc">${esc(p.k)}</span></li>`; }).join('') || '<li class="sub">No bids in this state yet.</li>'}</ul>${nT && nL && nT !== nL ? `<span class="aiwarn"><b>Two figures for the Nashik loss:</b> ${esc(nT)}% on the BD task list and ${esc(nL)}% in the loss review. The loss review is the record; correct the task.</span>` : ''}`) : ''}
   ${C.comp.length ? row('Who else is likely to bid', sig(C.comp.some(c => /L1/.test(c.record || '')) ? 0 : 1, `${C.comp.length} known`), `<ul class="aidrv">${C.comp.map(c => `<li><span><b>${esc(c.name)}</b> <span class="sub">· ${esc(c.record || '')}</span></span><span class="mono sub">${esc(c.price || '')}</span></li>`).join('')}</ul>`) : ''}
   ${row('What we are already carrying', C.near.length >= 2 ? sig(0, `${C.near.length} bids within 3 weeks`) : sig(1, 'Room in the team'), `<ul class="aidrv">${C.near.map(p => `<li><span><b>${esc(p.name)}</b> <span class="sub">· ${esc(p.client)} · stage ${p.stage}</span></span><span class="mono sub">due ${esc(p.due)}</span></li>`).join('') || '<li class="sub">No other bid due within three weeks of this one.</li>'}</ul>${capV ? `<span class="sub">Certified bid capacity ${crN(capV)} ${C.sameClientLive.length ? `· winning this and ${C.sameClientLive.length > 1 ? 'the others' : 'the other'} for this client adds ${crN(num(m.value) + sameClientValue)} of commitments` : ''}</span>` : ''}`)}
  </div></div>`;
}

/* =====================================================================
   Stages 9–10 · Award and contract — every concession priced for both
   sides, give-and-get pairs, the margin floor, "agreed then reverted",
   and the back-to-back gaps with the suppliers
   ===================================================================== */

/* The arithmetic is kept in view: each figure carries the line it was worked from. */
function concessions() {
  const o = O(), bpc = num((o.bafo.slice(-1)[0] || {}).price) || num(o.meta.value), risk = id => o.risks.find(r => r.id === id) || {};
  const staff = (o.om || []).find(r => /staff/i.test(r.item)), heads = staff ? +((/\((\d+)/.exec(staff.item) || [])[1] || 46) : 46, perHead = staff ? num(staff.cost) / heads : 0, af = (1 - Math.pow(1.1, -15)) / 0.1;
  const annuity = bpc * 0.6 / 30, perPct = annuity * 0.01 * 90 / 365 * 15;
  const r3 = risk('R-03'), rockRate = r3.impact ? num(r3.impact) / 18400 : 0, r2 = risk('R-02');
  const cl = id => ((o.contract || {}).clauses || []).find(c => c.id === id);
  const c4 = cl('c4'), want = c4 ? +((/(\d+)\s*personnel/.exec(c4.orig) || [])[1] || 0) : 0, extra = want > heads ? want - heads : 0;
  return [
    { k: 'annuity', topic: 'Interest on late annuities', us: 'Bank rate + 2%', them: 'Bank rate', where: 'Bank rate + 1% (agreed)', cost: +(perPct).toFixed(1), costWhy: `Each 1% over bank rate is worth about ₹${perPct.toFixed(1)} Cr to us: annuity ₹${annuity.toFixed(1)} Cr (60% of ₹${fmtN(bpc)} Cr over 30), if half of them are 90 days late`, val: 0, valWhy: 'Costs the Authority nothing if it pays on time — the easiest thing it can give', give: 'Interest starts after the 30-day grace in their draft, not from the due date', get: 'Bank rate + 1%, compounded quarterly', src: 'ca:64:§23.6' },
    { k: 'staff', topic: 'Minimum O&M staffing', us: `${heads} staff, as bid`, them: `${want} staff, citing the state O&M norm 2026`, where: c4 ? c4.st : 'Open', cost: +(extra * perHead * af).toFixed(1), costWhy: `${extra} more staff at ₹${(perHead * 100).toFixed(1)} lakh a year each (₹${num(staff && staff.cost)} Cr for ${heads}) for 15 years, in today’s money at 10%`, val: 2, valWhy: 'Compliance with a state norm its auditors will check', give: `${want} staff from Year 3, when flows reach 80% of design`, get: 'If the 2026 norm was issued after the bid date, it is a change in law: the extra posts are paid through the O&M fee', src: 'ca:131:Sch. O' },
    { k: 'row', topic: 'Right of way along SH-55', us: 'Authority procures, time and costs for delay', them: '“Reasonable efforts” by the Authority', where: 'Authority + time extension (agreed)', cost: +(PROB[num(r2.l)] * num(r2.impact) * 0.4).toFixed(1), costWhy: `Time-only relief leaves prolongation costs with us: about 40% of R-02’s ₹${num(r2.impact)} Cr exposure at ${Math.round(PROB[num(r2.l)] * 100)}% likelihood`, val: 3, valWhy: 'A firm Month 4 date it can plan its land acquisition around', give: 'Time-only extension for the first 60 days of delay', get: 'Time and costs after 60 days', src: 'v2:214:§7.6' },
    { k: 'rock', topic: 'Rock excavation', us: 'Measured at the BOQ rate', them: 'Included in BPC', where: 'Measured above 12,000 m³ (agreed)', cost: +(12000 * rockRate).toFixed(1), costWhy: `We carry the first 12,000 m³ at about ₹${fmtN(Math.round(rockRate * 1e7))} per m³ (R-03: ₹${num(r3.impact)} Cr for 18,400 m³)`, val: 2, valWhy: 'Cost certainty for most of the rock it expects', give: 'Carry the first 12,000 m³ in BPC', get: 'Measured at the BOQ rate above it', balanced: true, src: 'geo:66:BH-07' }
  ];
}

/* ---------- agreed at negotiation, then reverted in the draft ---------- */
const keyTerms = t => String(t).match(/\d+(?:\.\d+)?\s*%|\b\d{2,}\b|time extension|authority|excluding/gi) || [];
const flat = t => String(t).toLowerCase().replace(/\s+/g, '');
function reverted() {
  const o = O(), cls = (o.contract || {}).clauses || [], out = [];
  cls.filter(c => !/agreed|accepted/i.test(c.st)).forEach(c => {
    const pos = o.nego.pos.find(p => matchScore(stemsOf(p.topic + ' ' + p.tender), c.title + ' ' + c.orig) >= 2);
    const agreed = pos && pos.agreed ? pos.agreed : /agreed/i.test(c.bid || '') ? c.bid.replace(/\s*\(agreed[^)]*\)/i, '') : '';
    const draft = c.orig.toLowerCase().replace(/\s+/g, ''), bidT = (c.bid || '').replace(/\s*\(.*\)/, '');
    const lost = agreed ? keyTerms(agreed).filter(k => !draft.includes(flat(k))) : [];
    if (agreed && lost.length) out.push({ c, kind: 'Agreed at negotiation', was: agreed, from: pos ? `Negotiating position: ${pos.topic}` : 'Bid record', lost });
    else if (!agreed && bidT) { const nb = (bidT.match(/\d+/g) || []), nd = (c.orig.match(/\d+/g) || []); if (nb.length && nb.some(n => !nd.includes(n))) out.push({ c, kind: 'Stated in the bid', was: bidT, from: 'Bid record', lost: nb.filter(n => !nd.includes(n)) }); }
  });
  return out;
}

/* ---------- back-to-back: what we promise the client against what suppliers promise us ---------- */
function b2bClose(b) {
  const o = O(), f = k => ((o.brief.facts || []).find(x => new RegExp(k, 'i').test(x.k)) || {}).v || '', bpc = num((o.bafo.slice(-1)[0] || {}).price) || num(o.meta.value);
  const yrs = (t, unit) => +((new RegExp('(\\d+)\\s*' + unit, 'i').exec(t) || [])[1] || 0);
  if (/performance guarantee/i.test(b.clause)) { const ld = num((/₹([\d.]+)/.exec(f('energy ld')) || [])[1]) || 1.2, gap = yrs(b.main, 'years') - yrs(b.sub, 'years'); return { exp: +(ld * gap).toFixed(1), expWhy: `₹${ld} Cr a year per 0.01 kWh/m³ over the guarantee (Energy LD) for the ${gap} uncovered years`, fix: `Buy a 5-year efficiency guarantee from the blower OEM as a paid extension; carry the remaining ${yrs(b.main, 'years') - 5} years as a priced O&M reserve, with annual efficiency testing` }; }
  if (/delay damages/i.test(b.clause)) { const ourCap = bpc * 0.10; return { exp: +(ourCap * 0.05).toFixed(1), expWhy: `Our cap is 10% of BPC (${crN(ourCap)}); the supplier’s 5% cap leaves the difference with us if its delay causes ours — shown here at 5% of our cap`, fix: 'Match the supplier’s cap to 10% of its order value for delays on the critical path, in return for a firmer delivery window' }; }
  if (/defects liability/i.test(b.clause)) { const p = o.longlead.find(l => /pump/i.test(l.item)), need = p ? num(p.need) : 14, cod = 30, endsAt = need - 1 + 18, cover = Math.max(0, endsAt - cod); return { exp: null, expWhy: `Pumps arrive about Month ${need}; 18 months from dispatch ends around Month ${endsAt}. COD is Month ${cod}, so only ${cover} of the 12 months after COD ${cover === 1 ? 'is' : 'are'} covered`, fix: '“18 months from dispatch or 12 months from COD, whichever is later” — a standard ask that costs the OEM little' }; }
  if (/payment/i.test(b.clause)) return { exp: null, expWhy: 'We are paid in bi-annual annuities after COD; the subcontractor expects 30 days from invoice during construction', fix: 'Pay the microtunnelling subcontract against the construction-support milestones (40% of BPC), not monthly invoices' };
  return { exp: null, expWhy: '', fix: 'Align the supplier term with the main contract term' };
}

Object.assign(ACT, {
  aicite: d => { if (!can('contract')) return 'skip'; const x = reverted().find(y => y.c.id === d.id); if (!x) return 'skip'; x.c.cm.push([R().name, nowTs(), `${x.kind}: “${x.was}” (${x.from}). The draft omits ${x.lost.join(', ')}.`]); log('Cited the record against a reverted clause', `${x.c.ref} ${x.c.title}`); toast('Evidence added to the clause discussion. It goes to the client with the next redline.'); },
  aib2b: d => { if (!can('risks')) return 'skip'; const o = O(), b = o.b2b.find(x => x.id === d.id), x = b2bClose(b), id = nextId(o.risks, 'R-'); o.risks.push({ id, risk: `Back-to-back gap: ${b.clause} — ${b.gap}`, cat: 'Contract', l: 3, i: x.exp && x.exp >= 10 ? 4 : 3, impact: x.exp || 0, treat: x.exp ? 'Price' : 'Transfer', owner: 'contracts', src: '', mit: x.fix, aiKey: 'b2b-' + b.id }); log('Put a back-to-back gap on the risk register', `${id} · ${b.clause}`); toast(`${id} added to the risk register.`); }
});


/* =====================================================================
   THE INTELLIGENCE LAYER
   AI output lives inside the screen it serves, never stacked above it:
     · a note inside the cell it is about
     · a suggested row in the same table as the record's own rows
     · reasoning that opens beneath the row it explains
     · a card only where the screen already has a side column
   The three rules at the top of this file still hold everywhere below.
   ===================================================================== */
const aiMk = (t = '') => `<span class="aimk" title="${esc(t || 'Read or suggested by bidPlan')}" role="img" aria-label="Suggested by bidPlan">${IC.spark}</span>`;
const aiHint = (html, cls = '') => `<div class="aihint ${cls}">${aiMk()}<span>${html}</span></div>`;
const aiIn = (html, cls = '') => `<span class="aihint inl ${cls}">${aiMk()}<span>${html}</span></span>`;
const stamp = () => ({ by: R().name, ts: nowTs() });
const r1 = v => Math.round(v * 10) / 10;

/* ---------------- Stage 1 · Brief: the pack's values sit on the tiles and in the tables they belong to ---------------- */
const TILE_KEY = { Client: 'client', 'Design flow': 'mld', Submission: 'submission', 'Tender estimate': 'value' };
function aiTile(label) {
  if (!isSeed()) return '';
  const p = AI_PACK.find(x => x.k === TILE_KEY[label]) || AI_PACK.find(x => x.kind === 'size' && x.k === label); if (!p) return '';
  const s = packState(p), ed = can('meta');
  if (s === 'match' || s === 'kept') return `<span class="aitile">${src(p.src)}</span>`;
  return `<span class="aitile ${s}">${aiMk()}<span>${s === 'new' ? 'Pack:' : 'Pack says'} <b>${esc(p.show || fmtD(p.v))}</b></span>${src(p.src)}${ed ? `<button class="linkbtn" data-a="aiacc" data-k="${esc(p.k)}">Use</button>${s === 'conflict' ? `<button class="linkbtn" data-a="aikeep" data-k="${esc(p.k)}">Keep mine</button>` : ''}` : ''}</span>`;
}
function aiPackHead() {
  const o = O();
  if (!isSeed()) return aiIn(o.docs.length ? 'Once the ITB is read, its values are proposed here with their pages' : 'Upload the ITB and its values are proposed here, each with its page');
  const st = AI_PACK.map(packState), n = k => st.filter(s => s === k).length, ed = can('meta');
  return `${aiIn(`${AI_PACK.length} values read from the pack · ${n('match')} match${n('new') ? ` · <b>${n('new')} to accept</b>` : ''}${n('conflict') ? ` · <b>${n('conflict')} differ${n('conflict') === 1 ? 's' : ''}</b>` : ''}`)}${ed && n('new') ? ` <button class="btn sm" data-a="aiaccall">Accept ${n('new')}</button>` : ''}`;
}
/* Suggested rows inside Key facts (kind 'fact') and Size metrics (kind 'size'). */
function aiPackRows(kind) {
  return nc => {
    if (!isSeed()) return '';
    const o = O(), shown = new Set((o.meta.size || []).slice(1, 4).map(s => s.k)), ed = can('meta'), dc = kind === 'size' ? 2 : 3;
    return AI_PACK.filter(p => kind === 'size' ? p.kind === 'size' && !shown.has(p.k) : p.kind === 'fact' || p.k === 'loc').map(p => ({ p, s: packState(p) })).filter(x => x.s === 'new' || x.s === 'conflict').map(({ p, s }) => {
      const act = ed ? `<div class="row" style="gap:4px;margin-top:4px"><button class="btn sm ok" data-a="aiacc" data-k="${esc(p.k)}">${s === 'conflict' ? 'Use the pack' : 'Accept'}</button>${s === 'conflict' ? `<button class="btn sm ghost" data-a="aikeep" data-k="${esc(p.k)}">Keep mine</button>` : ''}</div>` : '';
      const val = `<b>${esc(p.show || fmtD(p.v))}</b>${s === 'conflict' ? `<div class="aihist">record says ${esc(packCur(p))}</div>` : ''}${p.was ? `<div class="aihist">was <s>${esc(p.was)}</s> · ${esc(p.why)}</div>` : ''}`;
      return `<tr class="aiprop"><td>${aiMk('Read from the tender pack')}<span class="sub">${esc(p.l)}</span></td>${kind === 'size' ? `<td>${val} ${src(p.src)}${act}</td>` : `<td>${val}</td><td>${src(p.src)}${act}</td>`}${nc > dc ? '<td></td>' : ''}</tr>`;
    }).join('');
  };
}

/* ---------------- Stage 2 · Documents: ask the register; classification proposed in the row ---------------- */
function aiAskBar() {
  const o = O(), A = S.ui.ask;
  if (!o.docs.length) return '';
  const ans = !A ? '' : !A.hit ? `<div class="aians none"><b>Not found in this pack.</b> <span class="sub">Answers come only from the ${o.docs.length} documents of this tender, and say so when they are silent. Try the term the tender itself uses.</span></div>`
    : `<div class="aians"><p>${esc(A.hit.a)}</p><div class="row" style="gap:6px">${A.hit.src.map(src).join('')}</div>${A.hit.note ? `<div class="aihist ${A.hit.note[0] === 'Conflict' ? 'warnt' : ''}"><b>${esc(A.hit.note[0])}.</b> ${esc(A.hit.note[1])} ${src(A.hit.note[2])}</div>` : ''}</div>`;
  return `<div class="aiask"><form id="askpackform" class="row" style="gap:8px;flex-wrap:nowrap">${aiMk()}<input type="search" id="askpack" placeholder="Ask the pack, e.g. what is the outfall freeboard?" value="${esc(A ? A.q : '')}" aria-label="Ask the tender pack" style="flex:1"><button class="btn sm" type="submit">Ask</button>${A ? '<button class="btn sm ghost" type="button" data-a="askclr">Clear</button>' : ''}</form>${!A && isSeed() ? `<div class="aisug">${AI_ASK.slice(0, 4).map(x => `<button type="button" data-a="askpk" data-q="${esc(x.q)}">${esc(x.q)}</button>`).join('')}</div>` : ''}${ans}</div>`;
}
function aiDocType(d) {
  if (!d.up || aiS(O()).cls[d.id]) return '';
  const g = guessType(d);
  return aiHint(`${esc(g.type)} · ${esc(g.disc)} · ${g.conf}%${g.conf < 75 ? ', check it' : ''}${can('docs') ? ` <button class="linkbtn" data-a="clsok" data-id="${d.id}" data-t="${esc(g.type)}" data-d="${esc(g.disc)}">Confirm</button>` : ''}`, g.conf < 75 ? 'warnt' : '');
}

/* ---------------- Stage 3 · Requirements: owner, duplicates and corrigenda in the row ---------------- */
let _dupK = '', _dupV = {};
function reqDups() {
  const o = O(), k = o.reqs.map(r => r.id + ':' + r.text.length).join('|');
  if (k === _dupK) return _dupV;
  const out = {}; o.reqs.forEach((a, i) => o.reqs.slice(i + 1).forEach(b => { const A_ = stemsOf(a.text), B = stemsOf(b.text), n = [...A_].filter(w => B.has(w)).length; if (n / Math.max(1, Math.min(A_.size, B.size)) >= 0.7) { (out[a.id] = out[a.id] || []).push(b.id); (out[b.id] = out[b.id] || []).push(a.id); } }));
  _dupK = k; _dupV = out; return out;
}
function aiReqOwnerSel() {
  const o = O(); if (!o.reqs.length) return '';
  const own = {}; o.reqs.forEach(r => { const k = r.owner || 'none'; own[k] = (own[k] || 0) + 1; });
  return `<select id="rown" data-c="rownsel" style="width:auto" aria-label="Owner"><option value="">All owners</option>${own[S.role] ? `<option value="${S.role}" ${S.ui.rown === S.role ? 'selected' : ''}>Mine (${own[S.role]})</option>` : ''}${Object.entries(own).filter(([k]) => k !== S.role).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<option value="${k}" ${S.ui.rown === k ? 'selected' : ''}>${k === 'none' ? 'No owner' : esc(ROLES[k] ? ROLES[k].name : k)} (${n})</option>`).join('')}</select>`;
}
function aiReqStats() {
  const o = O(); if (!o.reqs.length) return '';
  const wait = o.reqs.filter(r => r.st === 'proposed').length, nd = Object.keys(reqDups()).length, lim = o.reqs.filter(r => reqLang(r) === 'limit').length, chg = o.reqs.filter(r => addDocOf(r)).length, mine = o.reqs.filter(r => r.owner === S.role).length;
  const p = [mine ? `${mine} routed to you` : '', wait ? `${wait} waiting for their owner` : '', chg ? `${chg} set by a corrigendum` : '', nd ? `${nd} read like duplicates` : '', lim ? `${lim} written as limits, kept mandatory` : ''].filter(Boolean);
  return p.length ? aiIn(p.join(' · ')) : '';
}
function aiReqOwner(r) {
  if (!r.owner || !ROLES[r.owner]) return '<span class="chip warn">None</span>';
  return `<span class="aiown">${r.st === 'proposed' ? aiMk('Routed by discipline. Accepting the requirement confirms it.') : ''}${esc(ROLES[r.owner].name)}</span>`;
}
function aiReqNote(r) {
  const D = reqDups()[r.id], a = addDocOf(r);
  return `${D ? aiHint(`Reads like ${D.join(', ')}. Merge into one record with both sources.`, 'warnt') : ''}${a ? aiHint(`Set by ${esc(a.no)}`) : ''}`;
}
const aiReqMD = r => reqLang(r) === 'limit' ? ` <span class="aimkr" title="Written as a limit (minimum, at least, ≥, <) rather than shall or must. Kept mandatory, so it stays in the compliance matrix.">limit</span>` : '';
function aiReqDetail(r) {
  const a = addDocOf(r), ev = AI_EVID[r.cat] || ['Supporting document'], E = (O().brief.facts || []).find(f => /evaluation/i.test(f.k));
  return `<span class="eyebrow">${aiMk()} Read by bidPlan</span><dl class="kv"><dt>Owner</dt><dd>${r.owner && ROLES[r.owner] ? esc(ROLES[r.owner].name + ' · ' + ROLES[r.owner].title) : '<span class="chip warn">None</span>'}</dd><dt>Reads as</dt><dd>${({ obligation: 'An obligation (shall / must)', limit: 'A limit, so mandatory', statement: 'A statement; check whether it binds' })[reqLang(r)]}</dd><dt>What proves it</dt><dd>${ev.map(x => `<span class="chip">${esc(x)}</span>`).join(' ')}</dd>${a ? `<dt>Set by</dt><dd><b>${esc(a.no)}</b> <span class="sub">${esc(a.date)} · ${esc(a.title)}</span></dd>` : ''}${E && /lowest/i.test(E.v) ? `<dt>Marks</dt><dd><span class="sub">None: the award goes to the lowest evaluated price ${src(E.src)}, so this is pass or fail. Prove it; going beyond it wins nothing.</span></dd>` : ''}</dl>`;
}

/* ---------------- Stage 3 · Rules: conflicts are a register, each row with both sources ---------------- */
function aiConflicts() {
  if (!isSeed()) return O().docs.length ? '' : aiHint('Figures that disagree between volumes and drawings are listed here once the documents are read, with the clause that settles each one.');
  const o = O(), A = aiS(o); A.prec = A.prec || {};
  const ruleOf = id => o.rules.find(r => r.id === id), qOf = id => o.clars.find(c => c.id === id), riskOf = id => o.risks.find(r => r.id === id);
  const set = AI_CONFLICTS.filter(c => c.settles).length, needQ = AI_CONFLICTS.length - set, noQ = AI_CONFLICTS.filter(c => !c.settles && !cQuery(c)).length;
  const link = (t, kind, id, s) => `<button class="aich" data-a="tab" data-t="${t}"><span class="sub">${kind}</span> <b>${esc(id)}</b>${s ? ' ' + s : ''}</button>`;
  return `<div class="panel"><div class="ph"><div class="row" style="gap:8px"><h3>Conflicts between documents</h3><span class="chip">${AI_CONFLICTS.length}</span></div><span class="sub">${aiMk()}${set} settled by precedence · ${needQ} need the client${noQ ? ` · <b>${noQ} without a query</b>` : ''}</span></div>
   <div class="tw"><table class="t aicft"><thead><tr><th>Topic</th><th>One source says</th><th>The other says</th><th>How it resolves</th><th>On the record</th><th></th></tr></thead><tbody>
   ${AI_CONFLICTS.map(c => { const r = c.rule && ruleOf(c.rule), q = cQuery(c) && qOf(cQuery(c)), k = c.risk && riskOf(c.risk), done = A.prec[c.id];
    return `<tr><td>${aiMk('Found by comparing the documents')}<b>${esc(c.topic)}</b></td><td>${esc(c.a[0])}<div>${src(c.a[1])}</div></td><td>${esc(c.b[0])}<div>${c.b[1] ? src(c.b[1]) : '<span class="chip warn">Missing document</span>'}</div></td><td><span class="chip ${c.settles ? 'ok' : 'warn'}">${c.settles ? 'Precedence settles it' : 'Needs the client'}</span><div class="sub" style="margin-top:4px">${esc(c.why)}</div></td><td><div class="aichs">${r ? link('basis', 'Rule', r.id, st(r.state)) : ''}${q ? link('clar', 'Query', q.id, st(q.status)) : ''}${k ? link('risks', 'Risk', k.id, `<span class="chip ${k.l * k.i >= 16 ? 'bad' : 'warn'}">${k.l}×${k.i}</span>`) : ''}</div></td>
     <td style="white-space:nowrap">${c.settles ? (done ? `<span class="sub">Confirmed by ${esc(done.by)}</span>` : can('basis') ? `<button class="btn sm" data-a="precok" data-id="${c.id}">Confirm</button>` : '') : !q && can('clar') ? `<button class="btn sm" data-a="cfq" data-id="${c.id}">Draft the query</button>` : ''}</td></tr>`; }).join('')}
   </tbody></table></div></div>`;
}

/* ---------------- Stage 3 · Eligibility: the library check inside the criterion it tests ---------------- */
function credFor(e) {
  if (typeof KB_CRED === 'undefined') return null;
  const t = e.c.toLowerCase();
  return KB_CRED.find(c => /solvency/.test(t) && /solvency/i.test(c.item) || /bid capacity/.test(t) && /bid capacity/i.test(c.item) || /turnover/.test(t) && /audited/i.test(c.item)) || null;
}
function credState(c) {
  const o = O(), sub = ymd(o.meta.submission), e = ymd(c.exp); if (!sub || !e) return null;
  const vf = (o.brief.facts || []).find(f => /bid validity/i.test(f.k)), days = +((/(\d+)\s*days/.exec(vf ? vf.v : '') || [])[1] || 180), vEnd = new Date(sub.getTime() + days * 864e5), today = TODAY instanceof Date ? TODAY : new Date();
  return e < today ? ['bad', `Expired ${fmtDate(c.exp)}`] : e < sub ? ['bad', `Expires ${fmtDate(c.exp)}, before submission`] : e < vEnd ? ['warn', `Expires ${fmtDate(c.exp)}, during the ${days}-day bid validity`] : ['ok', `Valid to ${fmtDate(c.exp)}`];
}
function aiEligCell(r) {
  const ed = can('elig');
  if (/similar/i.test(r.c)) {
    const W = simWorks(); if (!W || !W.routes.length) return '';
    if (!W.est) return aiHint('Add the tender estimate to the brief and this is tested against every completed project in the knowledge library.');
    const claim = [...String(r.ours).matchAll(/([A-Z][a-z]+)[^₹;]*₹([\d,]+)\s*Cr/g)].map(x => [x[1], num(x[2])]);
    const clash = claim.map(([city, v]) => { const p = W.cands.concat(W.out).find(q => (q.client || '').startsWith(city)); return p && p.value !== v ? [city, v, p] : null; }).filter(Boolean);
    return aiHint(`${clash.length ? `The library holds ${clash.map(c => `${esc(c[0])} at <b>${crN(c[2].value)}</b> <span class="kbsrc">${esc(c[2].k)}</span>`).join(' and ')}, not ${clash.map(c => '₹' + fmtN(c[1])).join(' / ')} Cr. ` : ''}On certified values the criterion is <b>${W.met ? 'met' : 'not met'}</b>. <button class="linkbtn" data-a="elx" data-id="${r.id}">${S.ui.elx === r.id ? 'Hide the working' : 'Show the working'}</button>${ed && clash.length && r.res === 'pass' ? ` <button class="linkbtn" data-a="elrev" data-id="${r.id}">Set to evidence needed</button>` : ''}`, W.met ? '' : 'badt');
  }
  if (/bid capacity/i.test(r.c)) { const c = credFor(r), lib = c ? num((/₹([\d,]+)/.exec(c.detail) || [])[1]) : 0, ours = num((/₹([\d,]+)/.exec(r.ours) || [])[1]); if (lib && ours && lib !== ours) return aiHint(`The CA certificate says <b>₹${fmtN(lib)} Cr</b>, not ₹${fmtN(ours)} Cr. Use the certified figure.`, 'warnt'); }
  const c = credFor(r); if (c) { const s = credState(c); if (s) return aiHint(`On file: ${esc(c.item)} · ${esc(c.ref)} · ${esc(s[1])}`, s[0] === 'ok' ? '' : s[0] + 't'); }
  return '';
}
function aiEligAfter(r, nc) {
  if (S.ui.elx !== r.id || !/similar/i.test(r.c)) return '';
  const o = O(), W = simWorks(); if (!W || !W.est) return '';
  const reach = x => ((W.cands[x.n - 1] || {}).value || 0) / x.thr, best = W.routes.slice().sort((a, b) => reach(b) - reach(a))[0], bestN = W.cands.slice(0, best.n);
  const jv = (o.elig.find(e => /JV/i.test(e.c)) || {}).ours || '', partner = (/\/\s*([A-Z][A-Za-z ]+?)\s+\d+%/.exec(jv) || [])[1];
  return `<tr class="aiexp"><td colspan="${nc}"><div class="aiexp-in">
   <table class="t mini"><thead><tr><th>Route</th><th class="num">Each work at least</th><th>Qualifying works in the library</th><th>Result</th></tr></thead><tbody>${W.routes.map(x => `<tr><td><b>${x.n} work${x.n > 1 ? 's' : ''} at ${x.pct}%</b></td><td class="num mono">${crN(x.thr)}</td><td>${x.q.length ? x.q.map(p => `${esc(p.name)} <span class="mono sub">${crN(p.value)}</span>`).join(', ') : '<span class="sub">None</span>'}</td><td><span class="chip ${x.met ? 'ok' : 'bad'}">${x.met ? 'Met' : `${x.q.length} of ${x.n}`}</span></td></tr>`).join('')}</tbody></table>
   <div class="grid g2" style="gap:14px;margin-top:10px"><div><span class="eyebrow">Counted</span><ul class="aidrv">${W.cands.map(p => `<li><span><b>${esc(p.name)}</b> <span class="sub">· completed ${esc(p.done)} · ${esc(p.cert)}</span></span><span class="mono">${crN(p.value)}</span></li>`).join('') || `<li class="sub">Nothing completed with a certificate in the last ${W.yrs} years</li>`}</ul></div><div><span class="eyebrow">Not counted</span><ul class="aidrv">${W.out.map(p => `<li><span><b>${esc(p.name)}</b> <span class="sub">· ${esc(p.why)}</span></span><span class="mono">${crN(p.value)}</span></li>`).join('')}</ul></div></div>
   ${!W.met ? `<p class="sub" style="margin:10px 0 0"><b>Closest route: ${best.n} at ${best.pct}%</b>, ${crN(best.thr)} per work. ${bestN.length ? `Our best certified ${bestN.length > 1 ? 'works are' : 'work is'} ${bestN.map(p => crN(p.value)).join(' and ')}${bestN.length < best.n ? `, with no ${['', 'first', 'second', 'third'][best.n]}` : ''}.` : ''} ${W.cands[0] ? `If §4.2 lets past values be updated at 7% a year, ${esc(W.cands[0].name.split(' ')[0])} becomes ${crN(W.esc7(W.cands[0]))}, which ${W.met7 ? 'would meet a route' : 'still falls short of every route'}.` : ''}${partner ? ` ${esc(partner.trim())}, the JV partner, has no works in the library; the JV route needs their certificates.` : ''}</p>` : ''}</div></td></tr>`;
}
function aiEligRight() {
  if (typeof KB_CRED === 'undefined') return '';
  const o = O(), tied = new Set(o.elig.map(credFor).filter(Boolean)), L = KB_CRED.filter(c => !tied.has(c)).map(c => [c, credState(c)]).filter(x => x[1] && x[1][0] !== 'ok'), bad = L.filter(x => x[1][0] === 'bad'), warn = L.length - bad.length;
  return L.length ? aiIn(`${bad.map(x => `${esc(x[0].item)}: ${esc(x[1][1].toLowerCase())}`).join('; ')}${bad.length && warn ? ' · ' : ''}${warn ? `${warn} more credential${warn > 1 ? 's' : ''} expire during bid validity` : ''}`, bad.length ? 'badt' : 'warnt') : '';
}

/* ---------------- Stage 3 · Risks: raised risks wait as rows in the register ---------------- */
function aiRiskPre(nc, ed) {
  const C = riskCands(); if (!C.length) return '';
  return C.map(c => { const l = lessonFor(c.risk + ' ' + c.mit);
    return `<tr class="aiprop"><td>${aiMk('Raised from ' + c.from[0])}</td><td>${esc(c.risk)}${aiHint(`From <button class="linkbtn" data-a="tab" data-t="${c.from[1]}">${esc(c.from[0])}</button>${c.src ? ' ' + src(c.src) : ''}`)}${l ? aiHint(`History: ${esc(l.proj)}. ${esc(l.lesson)}`) : ''}</td><td>${esc(c.cat)}</td><td class="mono">${c.l}</td><td class="mono">${c.i}</td><td class="num mono">${c.impact ? fmtN(c.impact, 1) : '—'}</td><td class="num mono">${cr(PROB[c.l] * num(c.impact))}</td><td>${esc(ROLES[c.owner] ? ROLES[c.owner].name : c.owner)}</td><td>${esc(c.treat)}</td><td><span class="sub">${esc(c.mit)}</span></td>${ed ? `<td class="rowact"><button class="btn sm ok" data-a="raiadd" data-k="${esc(c.key)}">Add</button><button class="ibtn" data-a="raidis" data-k="${esc(c.key)}" aria-label="Dismiss" title="Dismiss">${IC.x}</button></td>` : ''}</tr>`; }).join('');
}
function aiRiskCell(r) {
  const g = riskGaps().find(x => x.r === r), l = lessonFor(r.risk + ' ' + (r.mit || ''));
  return `${g ? aiHint(esc(g.g.join('; ')), 'warnt') : ''}${l ? aiHint(`History: ${esc(l.proj)}. ${esc(l.lesson)}`) : ''}`;
}
function aiRiskRight() { const n = riskCands().length, g = riskGaps().length; return n || g ? aiIn([n ? `${n} raised from other tabs, shown first` : '', g ? `${g} without a clear route` : ''].filter(Boolean).join(' · ')) : ''; }

/* ---------------- Stage 3 · Clarifications and the addenda register ---------------- */
function aiClarStats() {
  const o = O(), lk = o.clars.filter(c => c.status === 'draft' && leakOf(c).length).length, ans = o.clars.filter(c => c.status !== 'answered' && answeredBy(c).length).length, hi = o.clars.filter(c => c.status !== 'answered' && qPriority(c) === 'High').length;
  const p = [hi ? `${hi} high impact` : '', lk ? `<b>${lk} reveal${lk === 1 ? 's' : ''} our approach</b>` : '', ans ? `${ans} may already be answered` : ''].filter(Boolean);
  return p.length ? aiIn(p.join(' · ')) : '';
}
function aiAddChanged(a) {
  const I = addImpact(a), ed = can('clar'), cur = O().meta.submission, u = x => esc(I.fig[3] && !/%/.test(x) ? ' ' + I.fig[3] : '');
  return `${I.fig ? `<div class="aihist">${aiMk()}<span>Changes a figure: <s>${esc(I.fig[1].trim())}${u(I.fig[1])}</s> → <b>${esc(I.fig[2].trim())}${u(I.fig[2])}</b></span></div>` : ''}${I.when ? aiHint(`Moves the bid date to ${fmtDate(I.when)}${I.when === cur ? '. Already on the record.' : `; the record says ${fmtDate(cur)}.`}${I.when !== cur && can('meta') ? ` <button class="linkbtn" data-a="adapply" data-d="${I.when}" data-no="${esc(a.no)}">Move the bid date</button>` : ''}`, I.when === cur ? '' : 'warnt') : ''}${I.qs.length ? aiHint(`May answer ${I.qs.map(q => `${esc(q.id)}${ed ? ` <button class="linkbtn" data-a="adans" data-id="${q.id}" data-no="${esc(a.no)}">Record as its answer</button>` : ''}`).join(', ')}`) : ''}`;
}
function impLines(a) {
  const rec = String(a.impact || '').split('\n').filter(Boolean), I = addImpact(a);
  const fresh = I.todo.filter(x => !rec.some(r => r.toLowerCase().startsWith(x[0].toLowerCase())));
  return { rec, fresh, I };
}
function aiAddImpact(a) {
  const A = aiS(O()), { rec, fresh, I } = impLines(a), done = A.chg[a.no], ok = can('clar') || can('docs');
  return `<ul class="aiimp">${rec.map(i => `<li>${esc(i)}</li>`).join('')}${done ? '' : fresh.map(x => `<li class="prop">${aiMk('Proposed impact. Mark reviewed to write it to the record.')}<span><button class="linkbtn" data-a="tab" data-t="${x[2]}">${esc(x[0])}</button><span class="sub"> · ${esc(x[1])}</span></span></li>`).join('')}</ul>
   <div class="row" style="gap:6px;margin-top:6px">${done ? `<span class="chip ok">Reviewed</span>${done.by ? `<span class="sub">${esc(done.by)} · ${esc(done.ts)}</span>` : ''}` : `<span class="chip ${I.sev === 'High' ? 'bad' : I.sev === 'Medium' ? 'warn' : ''}">${I.sev} impact</span>${ok ? `<button class="btn sm" data-a="chgok" data-v="${esc(a.no)}">${fresh.length ? `Mark reviewed · add ${fresh.length}` : 'Mark reviewed'}</button>` : ''}${!fresh.length && !rec.length ? '<span class="sub">Nothing on the record matches. Read it in full.</span>' : ''}`}</div>`;
}

/* ---------------- Stage 4 · Bid / no-bid: the suggestion in the scorecard header and footer ---------------- */
function g1Sum() {
  const rows = O().g1.rows, sugOnly = +rows.reduce((a, r) => a + num(r.w) * g1Sug(r) / 5, 0).toFixed(1), confs = rows.map(r => g1Reason(r).conf);
  const contrib = rows.map(r => ({ r, d: num(r.w) * (g1Sug(r) - 3) / 5 })).sort((a, b) => b.d - a.d);
  return { sugOnly, dec: sugOnly >= 65 ? 'Bid' : sugOnly >= 55 ? 'Conditional bid' : 'No bid', conf: confs.includes('None') || confs.includes('Low') ? 'Low' : confs.includes('Medium') ? 'Medium' : 'High', low: confs.filter(c => c === 'Low').length, blind: confs.filter(c => c === 'None').length * 2 >= rows.length ? confs.filter(c => c === 'None').length : 0, n: rows.length, up: contrib.filter(x => x.d > 0).slice(0, 2), dn: contrib.filter(x => x.d < 0).reverse().slice(0, 3) };
}
function aiG1Head() {
  const G = g1Sum();
  if (G.blind) return aiIn('Too little on the record to suggest a decision', 'warnt');
  return `${aiIn(`Suggests <b>${G.dec}</b> at ${G.sugOnly} · ${G.conf.toLowerCase()} confidence`)} <button class="linkbtn" data-a="g1why" data-id="all">${S.ui.g1why === 'all' ? 'Hide reasoning' : 'Show reasoning'}</button>`;
}
function aiG1Foot() {
  const G = g1Sum();
  if (G.blind) return `<div class="aifoot">${aiHint(`${G.blind} of ${G.n} criteria have no evidence yet. Fill in eligibility, risks and the long-lead plan and the suggestion is worked out from them; until then the scores are placeholders, not advice.`, 'warnt')}</div>`;
  return `<div class="aifoot">${aiHint(`Holding it up: ${G.up.map(x => `${esc(x.r.c)} <span class="mono">+${x.d.toFixed(1)}</span>`).join(', ') || 'nothing above average'}. Pulling it down: ${G.dn.map(x => `${esc(x.r.c)} <span class="mono">${x.d.toFixed(1)}</span>`).join(', ') || 'nothing below average'}.${G.conf === 'Low' ? ` <b>Low confidence:</b> ${G.low} criteri${G.low === 1 ? 'on rests' : 'a rest'} on thin or conflicting evidence. Open the reasoning before signing.` : ''}`, G.conf === 'Low' ? 'warnt' : '')}</div>`;
}
const aiG1Seg = d => { const G = g1Sum(); return !G.blind && G.dec === d ? ` ${aiMk('Suggested from the records')}` : ''; };

/* ---------------- Stage 5 · Engineering: takeoff writes to the BOQ; the gap report decides ---------------- */
const TO_BOQ = { MH: 'B-7.11', DI: 'B-7.03', MS: 'B-7.08', ROCK: 'B-7.15' };
const unitOf = t => /\(m³\)|\bm3\b/i.test(t) ? 'm³' : /\(m\)/i.test(t) ? 'm' : 'no';
function boqFor(t) {
  const o = O(), code = TO_BOQ[t.sym]; let b = code && o.boq.find(x => x.code === code);
  if (!b) { const s = stemsOf(t.item), u = unitOf(t.item); b = o.boq.filter(x => x.unit === u).map(x => [x, matchScore(s, x.desc)]).filter(x => x[1] >= 2).sort((a, c) => c[1] - a[1]).map(x => x[0])[0]; }
  return b || null;
}
function aiTakeoffCell(t) {
  const b = boqFor(t);
  if (!b) { const alt = /trench|tunnel/i.test(t.item) ? O().boq.find(x => /tunnel/i.test(x.desc)) : null; return aiIn(`No BOQ line counts this in ${unitOf(t.item) === 'no' ? 'numbers' : unitOf(t.item)}${alt ? `; ${esc(alt.code)} measures it in ${esc(alt.unit)}` : ''}`, 'warnt'); }
  const same = num(b.ours) === num(t.qty), from = b.prov && b.prov.mark === t.id;
  if (t.st === 'accepted') return same ? aiIn(`<b class="mono">${esc(b.code)}</b> = ${fmtN(b.ours)} ${esc(b.unit)}${from ? ', set from this mark' : ''}`) : aiIn(`<b class="mono">${esc(b.code)}</b> has ${fmtN(b.ours)} ${esc(b.unit)}, not ${fmtN(t.qty)}${can('boq') ? ` <button class="linkbtn" data-a="tosync" data-id="${t.id}">Write ${fmtN(t.qty)} to the BOQ</button>` : ''}`, 'warnt');
  return aiIn(`Accepting sets <b class="mono">${esc(b.code)}</b> ${same ? `(already ${fmtN(b.ours)} ${esc(b.unit)})` : `from ${fmtN(b.ours)} to <b>${fmtN(t.qty)}</b> ${esc(b.unit)}`}`);
}
function takeoffToBoq(t) {
  const b = boqFor(t); if (!b) return null;
  const was = b.ours; b.prov = { kind: 'takeoff', mark: t.id, sym: t.sym, sheet: t.sheet || 'L-201', v: num(t.qty), was, ...stamp() }; b.ours = num(t.qty); b.src = `Takeoff ${b.prov.sheet}`;
  log('Wrote takeoff quantity to the BOQ', `${t.sym} → ${b.code}: ${fmtN(was)} → ${fmtN(t.qty)} ${b.unit}`); return b;
}
const evidSrc = b => /geotech|bh-0/i.test(b.src || '') ? src('geo:66:BH-07') : /corr-01/i.test(b.src || '') ? src('c1:1:§2') : /§7\.6/.test(b.src || '') ? src('v2:214:§7.6') : '';
function aiBoqSrc(r) {
  const p = r.prov;
  if (p) { const typed = num(r.ours) !== num(p.v); return `<span class="chip info">Takeoff ${esc(p.sheet)}</span>${aiHint(typed ? `Typed over the takeoff; mark ${esc(p.sym)} measured ${fmtN(p.v)}` : `From mark ${esc(p.sym)}, accepted by ${esc(p.by)}`, typed ? 'warnt' : '')}`; }
  const k = /calc/i.test(r.src) ? 'ok' : /geotech|bh-/i.test(r.src) ? 'info' : /corr/i.test(r.src) ? 'warn' : /vol|§/i.test(r.src) ? 'acc' : r.src ? 'info' : '';
  return `<span class="chip ${k}">${esc(r.src || 'Typed')}</span>${evidSrc(r) ? ' ' + evidSrc(r) : ''}`;
}
/* Rates the gap report can price with; each one carries where it came from. */
const RATE_LIB = { 'B-7.15': [6522, 'Rate library RL-2026 §P-14'] };
function gapStake(g) {
  const v = num(g.ours) - num(g.client), r = RATE_LIB[g.code];
  if (r) return [v * r[0] / 1e7, `${fmtN(v)} ${g.unit} × ₹${fmtN(r[0])} · ${r[1]}`];
  const it = isSeed() ? Object.values(EST_EVID).flat().find(x => x[5] === g.code) : null;
  return it && !num(g.client) ? [it[3], `${it[1]} · ${it[4]}`] : [null, ''];
}
function gapSug(g) {
  const v = num(g.client) ? (num(g.ours) - num(g.client)) / num(g.client) * 100 : null;
  if (v === null) return /corr/i.test(g.src) ? ['query', `${esc(g.src)} added it but Schedule B was not revised. Ask for the line to be issued; price it inside BPC until then.`] : ['query', `The specification (${esc(g.src)}) requires it and Schedule B is silent. Ask how it is paid.`];
  if (Math.abs(v) > 10) return /geotech|bh/i.test(g.src) ? ['price', `The bore logs support ${fmtN(g.ours)} ${esc(g.unit)}. BPC is a lump sum, so the quantity risk is ours: price it. A pre-bid query would tell every bidder what we found.`] : ['query', `${v.toFixed(0)}% off the client quantity with no survey behind ours. Ask before pricing.`];
  return ['price', v < 0 ? `Ours is ${Math.abs(v).toFixed(1)}% lower, within takeoff tolerance. Price ours.` : `Within takeoff tolerance (+${v.toFixed(1)}%). Price ours.`];
}
const GAP_D = { price: 'Price it', query: 'Query', dev: 'Deviation' };
function aiGapTable(gaps) {
  const o = O(), A = aiS(o); A.gap = A.gap || {}; const ed = can('boq') || can('est');
  if (!gaps.length) return '<div class="panel"><div class="empty"><p>No gaps above 3%.</p></div></div>';
  const open = gaps.filter(g => !A.gap[g.code]), stake = gaps.reduce((a, g) => a + (gapStake(g)[0] || 0), 0);
  return `<div class="panel"><div class="ph"><div class="row" style="gap:8px"><h3>Gaps, variances and unit mismatches</h3><span class="chip">${gaps.length}</span></div><span class="sub">${aiMk()}${open.length} to decide · ${crN(stake)} at stake where a rate is known</span></div>
   <div class="tw"><table class="t aigap"><thead><tr><th>Item</th><th class="num">Client BOQ</th><th class="num">Ours</th><th>Issue</th><th>Evidence</th><th class="num">At stake</th><th>Decision</th></tr></thead><tbody>
   ${gaps.map(g => { const v = num(g.client) ? (num(g.ours) - num(g.client)) / num(g.client) * 100 : null, [sk, skWhy] = gapStake(g), sg = gapSug(g), d = A.gap[g.code];
    return `<tr><td><span class="mono">${esc(g.code)}</span> ${esc(g.desc)}</td><td class="num mono">${num(g.client) ? fmtN(g.client) + ' ' + esc(g.unit) : '<span class="sub">Not in BOQ</span>'}</td><td class="num mono">${fmtN(g.ours)} ${esc(g.unit)}</td><td>${v === null ? '<span class="chip bad">Missing</span>' : `<span class="chip ${Math.abs(v) > 10 ? 'warn' : 'acc'}">${v > 0 ? '+' : ''}${v.toFixed(0)}%</span>`}</td><td><span class="sub">${esc(g.src || '—')}</span>${evidSrc(g) ? '<div>' + evidSrc(g) + '</div>' : ''}</td><td class="num">${sk != null ? `<b class="mono">${crN(sk)}</b><div class="sub">${esc(skWhy)}</div>` : '<span class="sub">No rate</span>'}</td>
     <td class="dec">${d ? `<span class="chip ok">${GAP_D[d.d]}${d.ref ? ' · ' + esc(d.ref) : ''}</span><div class="sub">${esc(d.by)} · ${esc(d.ts)}</div>` : `${aiHint(`Suggests <b>${GAP_D[sg[0]].toLowerCase()}</b>. ${sg[1]}`)}${ed ? `<div class="row" style="gap:4px;margin-top:6px">${['price', 'query', 'dev'].map(k => `<button class="btn sm ${k === sg[0] ? 'pri' : ''}" data-a="gapdec" data-code="${esc(g.code)}" data-v="${k}">${GAP_D[k]}</button>`).join('')}</div>` : ''}`}</td></tr>`; }).join('')}
   </tbody></table></div></div>`;
}

/* ---------------- Stage 6 · Procurement: an approved award points at the estimate line it changes ---------------- */
const AW_VAL = { 'DI and MS pipes': [118.2, 'Electrosteel Q-114 + Welspun Q-097, levelled'] };
function awardVal(a) {
  const L = O().lev;
  if (L.pkg && L.pkg.startsWith(a.pkg)) { const s = L.sups.find(x => x.name === a.rec); if (s) return [num(s.quoted) + L.adders.reduce((t, ad) => t + num(ad.vals[s.id]), 0), 'levelled total']; }
  return isSeed() && AW_VAL[a.pkg] ? AW_VAL[a.pkg] : [null, ''];
}
function aiAwardCell(a) {
  const o = O(), hit = o.est.map(r => [r, estEvid(r).items.find(i => i.pkg === a.pkg)]).find(x => x[1]);
  if (!hit) return '';
  const [r, i] = hit, [v] = awardVal(a); if (v == null) return '';
  const base = i.award && i.award.applied ? null : i.val, dv = base == null ? 0 : v - base;
  if (a.st === 'Approved') return i.award && i.award.applied ? aiHint(`In the estimate (${esc(r.wp)})`) : aiHint(`Not yet in the estimate: ${dv >= 0 ? '+' : '−'}${crN(Math.abs(dv))} on ${esc(r.wp)} <button class="linkbtn" data-a="tab" data-t="est">Open the estimate</button>`, 'warnt');
  return aiHint(`On approval, ${esc(r.wp)} can move by ${dv >= 0 ? '+' : '−'}${crN(Math.abs(dv))} (estimate carries ${fmtN(base, 1)}; ${esc(a.rec)} levelled ${fmtN(v, 1)})`);
}

/* ---------------- Stage 7 · Estimate: each line shows what its number rests on ---------------- */
// [key, what, kind, ₹ Cr, record, BOQ line, award package, rate ₹/unit (value then follows the BOQ quantity)]
const EST_EVID = {
  'Inlet works and pretreatment': [['in-scr', 'Fine screens and grit removal, 3 quotes', 'quote', 11.6, 'Q-031 Huber, levelled'], ['in-civ', 'Inlet civil at rate-library rates', 'rate', 19.0, 'RL-2026 §C-02']],
  'Secondary process (SBR)': [['blowers', 'Air blowers and diffusers', 'quote', 24.9, 'Turbomax Air as quoted, the conservative basis before levelling', '', 'Air blowers and diffusers'], ['sbr-dec', 'Decanters and mixers, 3 quotes', 'quote', 31.2, 'Q-044 Invent, levelled'], ['sbr-civ', 'Basin civil: takeoff × rate library', 'takeoff', 92.0, 'C-120 · B-1.04 21,600 m³']],
  'Tertiary and disinfection': [['ter-df', 'Disc filters, 3 quotes', 'quote', 29.4, 'Q-052 Filtrex, levelled', 'B-3.02'], ['ter-uv', 'Chlorination and UV quote', 'quote', 7.1, 'Q-055'], ['ter-bld', 'Filter building 1,450 m² at DSR rates', 'rate', 4.6, 'DSR 2026 · Corr-01', 'B-1.15']],
  'Sludge handling': [['sl-cen', 'Centrifuges, 4 quotes', 'quote', 18.6, 'Q-061 Alfa Laval, levelled']],
  'Civil and structural': [['civ-dsr', 'DSR 2026 rates × BOQ B-1 quantities', 'rate', 212.0, 'DSR 2026 · B-1.01 to B-1.20']],
  'Pumping stations (2 IPS)': [['ps-pmp', 'Raw sewage pumps, 4 quotes', 'quote', 22.8, 'Q-070 Xylem, levelled']],
  'Trunk sewer 14.2 km': [['pipes', 'DI and MS pipes', 'quote', 121.4, 'Q-114 Electrosteel + Q-097 Welspun as quoted', '', 'DI and MS pipes'], ['rock', 'Rock in trench: takeoff × rate', 'takeoff', 12.0, '', 'B-7.15', '', 6522], ['tunnel', 'Microtunnelling 210 m at SH-55, subcontract quote', 'quote', 14.7, 'Q-121 Tunnelline', 'B-7.21'], ['sew-lay', 'Trenching and laying at rate-library rates', 'rate', 98.0, 'RL-2026 §P']],
  'Electrical (22 kV, MCC, VFD)': [['el-mcc', 'Transformers, HT panels and MCCs, 3 quotes', 'quote', 38.5, 'Q-081 Schneider, levelled']],
  'Preliminaries and design': [['pre-nrm', 'Site staff and overheads at company norms', 'rate', 41.0, 'Norms 2026 · 30-month programme']]
};
function estEvid(r) {
  const o = O(), A = aiS(o); A.ea = A.ea || {}; A.eb = A.eb || {};
  const items = (isSeed() ? EST_EVID[r.wp] || [] : []).map(x => {
    const it = { k: x[0], label: x[1], kind: x[2], val: x[3], ref: x[4], boq: x[5], pkg: x[6] };
    if (x[7]) { const b = o.boq.find(y => y.code === x[5]); if (b) { it.val = num(b.ours) * x[7] / 1e7; it.ref = `${b.code} ${fmtN(b.ours)} ${b.unit} × ₹${fmtN(x[7])} · ${b.prov ? 'takeoff ' + b.prov.sheet : esc(b.src)}`; } }
    const aw = it.pkg && o.awards.find(a => a.pkg === it.pkg && a.st === 'Approved');
    if (aw) { const [v, how] = awardVal(aw); if (v != null) { it.award = { a: aw, v, how, applied: A.ea[it.k] }; if (A.ea[it.k]) { it.kind = 'award'; it.val = v; it.ref = `${aw.rec} · ${how}`; } } }
    return it;
  });
  const tot = wpTotal(r), der = Math.min(tot, items.reduce((a, i) => a + num(i.val), 0));
  if (A.eb[r.id] == null) A.eb[r.id] = tot;
  return { items, tot, der, pct: tot ? der / tot * 100 : 0, typed: r1(tot - A.eb[r.id]), pend: items.filter(i => i.award && !i.award.applied) };
}
function aiEstCell(r) {
  const E = estEvid(r), c = E.pct >= 70 ? 'ok' : E.pct >= 40 ? 'warn' : 'bad';
  return `<button class="aiev" data-a="estx" data-id="${r.id}" aria-expanded="${S.ui.estx === r.id}" title="What this number rests on">${aiMk()}<span class="aiev-bar"><i class="${c}" style="width:${E.pct.toFixed(0)}%"></i></span><span class="mono">${E.pct.toFixed(0)}%</span><span class="sub">${E.items.length ? 'traced' : 'typed'}</span></button>${E.pend.length ? aiHint(`${E.pend.length === 1 ? 'An approved award is' : E.pend.length + ' approved awards are'} not yet in this line`, 'warnt') : ''}${E.typed ? aiHint(`${E.typed > 0 ? '+' : ''}${E.typed} typed since the evidence`) : ''}`;
}
function aiEstAfter(r, nc) {
  if (S.ui.estx !== r.id) return '';
  const E = estEvid(r), ed = can('est') && !gateSigned('G2'), kl = { award: ['Approved award', 'ok'], takeoff: ['Takeoff × rate', 'info'], quote: ['Quotes', 'acc'], rate: ['Rate library', ''] };
  return `<tr class="aiexp"><td colspan="${nc}"><div class="aiexp-in"><table class="t mini"><thead><tr><th>What the number rests on</th><th>Record</th><th class="num">₹ Cr</th><th></th></tr></thead><tbody>
   ${E.items.map(i => `<tr><td>${esc(i.label)} <span class="chip ${kl[i.kind][1]}">${kl[i.kind][0]}</span></td><td class="mono sub">${esc(i.ref)}</td><td class="num mono">${fmtN(i.val, 1)}</td><td>${i.award && !i.award.applied ? `${aiIn(`${esc(i.award.a.rec)} approved at ${fmtN(i.award.v, 1)}: ${i.award.v - i.val >= 0 ? '+' : '−'}${crN(Math.abs(i.award.v - i.val))}`, 'warnt')}${ed ? ` <button class="btn sm" data-a="estapply" data-id="${r.id}" data-k="${i.k}">Apply to the estimate</button>` : ''}` : i.kind === 'award' ? `<span class="sub">Applied by ${esc(i.award.applied.by)}</span>` : ''}</td></tr>`).join('')}
   <tr class="grp"><td>Not traced to a quote, takeoff or rate</td><td class="sub">${E.items.length ? (E.typed ? `includes ${E.typed > 0 ? '+' : ''}${E.typed} typed since the evidence` : 'allowance or typed') : 'the whole line is typed or an allowance'}</td><td class="num mono">${fmtN(E.tot - E.der, 1)}</td><td></td></tr></tbody></table></div></td></tr>`;
}
function estTrace() { const o = O(), L = o.est.map(estEvid), direct = L.reduce((a, e) => a + e.tot, 0), der = L.reduce((a, e) => a + e.der, 0); return { pct: direct ? der / direct * 100 : 0, pend: L.reduce((a, e) => a + e.pend.length, 0), none: o.est.filter((r, i) => !L[i].items.length).map(r => r.wp) }; }
function aiEstFoot() { const T = estTrace(); return O().est.length ? aiIn(`${T.pct.toFixed(0)}% traced to quotes, takeoff or rates${T.pend ? ` · ${T.pend} award${T.pend > 1 ? 's' : ''} to apply` : ''}`) : ''; }
function aiG2Rows() { const T = estTrace(); return O().est.length ? `<dt>${aiMk()} Traced to evidence</dt><dd>${T.pct.toFixed(0)}% of direct cost${T.pend ? ` · <b>${T.pend} approved award${T.pend > 1 ? 's' : ''} not applied</b>` : ''}${T.none.length ? ` · no evidence behind ${esc(T.none.join(', '))}` : ''}</dd>` : ''; }

/* Price to win, on the basis the client evaluates: BPC + NPV of the 15-year O&M at 10%. */
function ptw() {
  const o = O(), e = estTotals(), om = omSchedule(), mld = num(o.meta.mld);
  if (!mld || !e.price || !om.base) return null;
  const field = (o.comp || []).map(c => { const r = num((/₹\s*([\d.]+)\s*Cr\/MLD/.exec(c.price || '') || [])[1]); return r ? { name: c.name, rate: r, bpc: r * mld, ev: r * mld + om.npv, om: /o&m/i.test(c.note || ''), from: c.price } : null; }).filter(Boolean).sort((a, b) => a.ev - b.ev);
  if (!field.length) return null;
  const us = e.price + om.npv, rank = [...field.map(f => f.ev), us].sort((a, b) => a - b).indexOf(us) + 1;
  const tgt = field[0].ev * 0.995, bpcMax = tgt - om.npv, mAt = bpcMax > 0 ? (1 - e.cost / bpcMax) * 100 : -100, floor = Math.min(...SCENS.map(s => s[1]));
  const perOm1 = om.npv / om.base, bpcFloor = e.cost / (1 - floor / 100), omNeed = bpcFloor + om.npv - tgt, base1 = om.base - Math.max(0, omNeed) / perOm1;
  const npvAt = esc => Array.from({ length: 15 }, (_, i) => om.base * Math.pow(1 + esc / 100, i) / Math.pow(1.1, i + 1)).reduce((a, b) => a + b, 0), escPt = om.npv - npvAt(num(o.omEsc) - 1);
  const big = o.om.slice().sort((a, b) => num(b.cost) - num(a.cost))[0], ev = (o.brief.facts || []).find(f => /evaluation/i.test(f.k));
  return { e, om, field, us, rank, tgt, bpcMax, mAt, floor, perOm1, omNeed, base1, escPt, big, ev };
}
function aiPtw() {
  if (!can('envB')) return '';
  const P = ptw(); if (!P) return '';
  const ed = can('margin') && !gateSigned('G2'), aggr = P.field.find(f => f.om), nash = typeof KB_LESSON !== 'undefined' ? KB_LESSON.find(l => /back-solve/i.test(l.lesson)) : null, c1 = v => '₹' + v.toFixed(1) + ' Cr';
  const rows = [...P.field.map(f => ({ n: f.name, bpc: f.bpc, ev: f.ev, from: f.from })), { n: 'Us, as estimated', bpc: P.e.price, ev: P.us, us: 1 }].sort((a, b) => a.ev - b.ev);
  return `<div class="panel aip"><div class="ph"><h3>${aiTag()} Price to win</h3><span class="sub">L${P.rank} of ${rows.length} today</span></div><div class="pb stack" style="gap:10px">
   <span class="sub">Ranked on what the client evaluates: BPC + NPV of the 15-year O&M at 10%${P.ev ? ' ' + src(P.ev.src) : ''}.</span>
   <table class="t mini"><thead><tr><th>Bidder</th><th class="num">BPC</th><th class="num">Evaluated</th></tr></thead><tbody>${rows.map((x, i) => `<tr class="${x.us ? 'hl' : ''}"><td><span class="mono sub">L${i + 1}</span> ${x.us ? '<b>' + esc(x.n) + '</b>' : esc(x.n)}${x.from ? `<div class="sub">${esc(x.from)} last award</div>` : ''}</td><td class="num mono">${fmtN(x.bpc, 0)}</td><td class="num mono">${fmtN(x.ev, 0)}</td></tr>`).join('')}</tbody></table>
   <span class="sub">Their O&M prices are not public, so each is taken as equal to ours (${crN(P.om.npv)} NPV).${aggr ? ` ${esc(aggr.name)} is noted as aggressive on O&M; at 10% below ours they would be at ${fmtN(aggr.ev - P.om.npv * 0.1, 0)}.` : ''}</span>
   <div class="aihint ${P.mAt >= P.floor ? '' : 'warnt'}">${aiMk()}<span>${P.mAt >= P.floor ? `To be L1 by 0.5%, BPC can be up to <b>${crN(P.bpcMax)}</b>: a <b>${P.mAt.toFixed(1)}%</b> margin.${ed ? ` <button class="linkbtn" data-a="ptwm" data-v="${P.mAt.toFixed(1)}">Use ${P.mAt.toFixed(1)}%</button>` : ''}` : `Capex alone cannot win. L1 by 0.5% needs BPC at or below <b>${crN(P.bpcMax)}</b>, a ${P.mAt.toFixed(1)}% margin, under the ${P.floor}% floor.`}</span></div>
   ${P.omNeed > 0 ? `<div class="aihint">${aiMk()}<span><b>Price the O&M first.</b> At the ${P.floor}% floor, ${crN(P.omNeed)} has to come off the O&M NPV: year-1 O&M from ${c1(P.om.base)} to ${c1(P.base1)} a year. Each ₹1 Cr a year is ${crN(P.perOm1)} of NPV; each 1% of escalation is ${crN(P.escPt)}.${P.big ? ` The largest line is ${esc(P.big.item.split('(')[0].trim().toLowerCase())} at ${crN(num(P.big.cost))} a year.` : ''}${nash ? ` The ${esc(nash.proj.split(' ')[0])} loss review: “${esc(nash.lesson)}”` : ''}</span></div>` : ''}
  </div></div>`;
}
function aiScenLine(pr) { const P = can('envB') ? ptw() : null; if (!P) return ''; const ev = pr + P.om.npv, rank = [...P.field.map(f => f.ev), ev].sort((a, b) => a - b).indexOf(ev) + 1; return ` · evaluated ${cr(ev)}, L${rank}`; }
function aiOmHint() {
  const l = typeof KB_LESSON !== 'undefined' ? KB_LESSON.find(x => /back-solve/i.test(x.lesson)) : null, P = can('envB') ? ptw() : null;
  return l ? aiHint(`<b>${esc(l.proj.split(' (')[0])}:</b> ${esc(l.lesson)}${P ? ` Here the O&M is ${Math.round(P.om.npv / P.us * 100)}% of the evaluated price.` : ''} <button class="linkbtn" data-a="tab" data-t="est" data-sub="scen">See price to win</button>`) : '';
}

/* ---------------- Stage 9 · Negotiation: each position priced for both sides, in its own row ---------------- */
function concFor(p) { return isSeed() ? concessions().find(c => matchScore(stemsOf(c.topic), p.topic) >= 2) : null; }
function aiNegoCols() {
  return [{ l: 'Cost to us · worth to them', v: r => { const c = concFor(r); return c ? `${aiMk()}<b class="mono">${crN(c.cost)}</b> <span class="aival v${c.val}">${['Nothing', 'Low', 'Medium', 'High'][c.val]}</span><div class="sub aicw">${esc(c.costWhy)}</div><div class="sub">${esc(c.valWhy)}</div>` : ''; } },
  { l: 'Give · get', v: r => { const c = concFor(r); return c ? `<div class="aigg"><span class="g">Give</span> ${esc(c.give)}</div><div class="aigg"><span class="t">Get</span> ${esc(c.get)}</div>${c.k === 'annuity' ? aiHint('The pattern for next time: ask for what costs the client nothing if it keeps its own promises.') : ''}` : ''; } }];
}
/* Points the contract draft raises that are not yet a negotiating position. */
function aiNegoPre(nc) {
  const o = O(); if (!isSeed()) return '';
  return concessions().filter(c => !o.nego.pos.some(p => matchScore(stemsOf(c.topic), p.topic) >= 2)).map(c => `<tr class="aiprop"><td>${aiMk('Raised from the contract draft')}<b>${esc(c.topic)}</b> ${src(c.src)}</td><td>${esc(c.them)}</td><td>${esc(c.us)}</td><td></td><td><span class="sub">${esc(c.where)}</span></td><td><b class="mono">${crN(c.cost)}</b> <span class="aival v${c.val}">${['Nothing', 'Low', 'Medium', 'High'][c.val]}</span><div class="sub aicw">${esc(c.costWhy)}</div></td><td><div class="aigg"><span class="g">Give</span> ${esc(c.give)}</div><div class="aigg"><span class="t">Get</span> ${esc(c.get)}</div>${c.k === 'staff' ? aiHint('Check the date of the 2026 O&M norm first. Issued after the bid date, it is a change in law to be paid for, not a concession.') : ''}${can('nego') ? `<button class="btn sm" style="margin-top:6px" data-a="negoadd" data-k="${c.k}">Add as a position</button>` : ''}</td>${nc > 7 ? '<td></td>' : ''}</tr>`).join('');
}
function aiNegoRight() {
  const o = O(), e = estTotals(), bpc = num((o.bafo.slice(-1)[0] || {}).price); if (!can('envB') || !bpc || !e.cost) return '';
  const m = (bpc - e.cost) / bpc * 100, C = isSeed() ? concessions().filter(c => !/agreed/i.test(c.where)) : [];
  return aiIn(`Margin after BAFO <b>${m.toFixed(1)}%</b> against ${e.m}% approved at G2${C.length ? ` · ${crN(C.reduce((a, c) => a + c.cost, 0))} more if every open point is conceded` : ''}`, m < e.m ? 'warnt' : '');
}
function aiBafoRight() {
  const o = O(), bids = o.nego.bids.slice().sort((a, b) => num(a.bpc) - num(b.bpc)), us = bids.findIndex(b => b.us), next = us === 0 && bids[1] ? num(bids[1].bpc) - num(bids[0].bpc) : null, given = o.bafo.length > 1 ? num(o.bafo[0].price) - num(o.bafo.slice(-1)[0].price) : 0;
  return next != null && given > next ? aiIn(`Won by ₹${next.toFixed(1)} Cr over L2; the rounds gave ₹${given.toFixed(1)} Cr, so about ₹${(given - next).toFixed(1)} Cr was not needed to win. Any further concession needs G2 re-approval.`, 'warnt') : '';
}

/* ---------------- Stage 10 · Contract: reverted positions on the clause; supplier gaps in the back-to-back table ---------------- */
const aiClauseChip = c => reverted().some(y => y.c.id === c.id) ? ` <span class="chip warn" title="A position agreed at negotiation or stated in the bid is missing from the draft">${aiMk()}Reverted</span>` : '';
function aiClauseNote(c) {
  const x = reverted().find(y => y.c.id === c.id); if (!x) return '';
  const ed = can('contract'), cited = (c.cm || []).some(m => /agreed at negotiation|stated in the bid/i.test(m[2])), restores = c.prop && keyTerms(x.was).every(k => flat(c.prop).includes(flat(k)));
  return aiHint(`<b>${esc(x.kind)}, then dropped.</b> “${esc(x.was)}” (${esc(x.from)}). Draft v${O().contract.ver} leaves out <b>${x.lost.map(esc).join(', ')}</b>. ${restores ? 'Our redline restores it; the client has not accepted it yet.' : 'Our redline does not restore it yet.'}${ed ? (cited ? ' The evidence is in the discussion.' : ` <button class="linkbtn" data-a="aicite" data-id="${c.id}">Cite the record in the discussion</button>`) : ''}`, 'warnt');
}
function aiB2BCols() {
  return [{ l: 'Exposure', v: r => { if (!r.gap) return ''; const x = b2bClose(r); return `${aiMk()}${x.exp != null ? `<b class="mono">${crN(x.exp)}</b>` : '<span class="chip warn">Unpriced</span>'}<div class="sub aicw">${esc(x.expWhy)}</div>`; } },
  { l: 'Ask the supplier for', v: r => { if (!r.gap) return ''; const x = b2bClose(r), has = O().risks.some(k => k.aiKey === 'b2b-' + r.id); return `${esc(x.fix)}<div style="margin-top:4px">${has ? '<span class="sub">On the risk register</span>' : can('risks') ? `<button class="linkbtn" data-a="aib2b" data-id="${r.id}">Put on the risk register</button>` : ''}</div>`; } }];
}

/* ---------------- actions ---------------- */
Object.assign(ACT, {
  askclr: () => { S.ui.ask = null; },
  elx: d => { S.ui.elx = S.ui.elx === d.id ? null : d.id; },
  estx: d => { S.ui.estx = S.ui.estx === d.id ? null : d.id; },
  /* Mark reviewed writes the impacts to the addendum's record, where the register shows them. */
  chgok: d => {
    if (!can('clar') && !can('docs')) return 'skip';
    const o = O(), a = o.addenda.find(x => x.no === d.v); if (!a) return 'skip';
    const { rec, fresh } = impLines(a); a.impact = [...rec, ...fresh.map(x => `${x[0]}: ${x[1]}`)].join('\n');
    aiS(o).chg[a.no] = stamp(); log('Reviewed addendum impact', `${a.no}${fresh.length ? ` · ${fresh.length} impact${fresh.length > 1 ? 's' : ''} written to the record` : ''}`);
    toast(`${a.no} reviewed${fresh.length ? `; ${fresh.length} impact${fresh.length > 1 ? 's' : ''} added to its record` : ''}.`);
  },
  tosync: d => { if (!can('boq')) return 'skip'; const t = O().takeoff.find(x => x.id === d.id); if (!t) return 'skip'; const b = takeoffToBoq(t); if (b) toast(`${b.code} now ${fmtN(b.ours)} ${b.unit}, from mark ${t.sym}.`); },
  gapdec: d => {
    if (!can('boq') && !can('est')) return 'skip';
    const o = O(), A = aiS(o), g = o.boq.find(x => x.code === d.code); if (!g) return 'skip'; A.gap = A.gap || {};
    let ref = '';
    if (d.v === 'query') { ref = nextId(o.clars, 'PBQ-'); const q = num(g.client) ? `Schedule B item ${g.code} (${g.desc}) gives ${fmtN(g.client)} ${g.unit}. Please confirm whether this quantity will be re-measured on execution.` : `Schedule B has no item for ${g.desc.replace(/\s*\(.*\)$/, '').toLowerCase()}. Please issue the item or confirm how this work will be paid.`; o.clars.push({ id: ref, q, src: (/corr/i.test(g.src) ? 'c1:1:§2' : /§7\.6/.test(g.src) ? 'v2:214:§7.6' : 'boq:1:Schedule B'), status: 'draft', disc: 'Commercial', req: '' }); }
    if (d.v === 'dev') { ref = nextId(o.devs, 'DEV-'); o.devs.push({ id: ref, clause: `Schedule B ${g.code}`, text: `Priced on ${fmtN(g.ours)} ${g.unit} against ${num(g.client) ? fmtN(g.client) + ' ' + g.unit : 'no item'} in Schedule B.`, why: g.src ? `Evidence: ${g.src}` : '', status: 'proposed' }); }
    A.gap[g.code] = { d: d.v, ref, ...stamp() }; log('Decided a client-BOQ gap', `${g.code}: ${GAP_D[d.v]}${ref ? ' · ' + ref : ''}`);
    toast(d.v === 'query' ? `${ref} drafted on Clarifications. It goes through the strategy check before sending.` : d.v === 'dev' ? `${ref} added to the deviation register.` : `${g.code} priced on our quantity.`);
  },
  estapply: d => {
    if (!can('est') || gateSigned('G2')) return 'skip';
    const o = O(), r = o.est.find(x => x.id === d.id); if (!r) return 'skip';
    const i = estEvid(r).items.find(x => x.k === d.k); if (!i || !i.award) return 'skip';
    const dv = r1(i.award.v - i.val), A = aiS(o); r.mat = r1(num(r.mat) + dv); A.eb[r.id] = r1(num(A.eb[r.id]) + dv); A.ea[i.k] = stamp();
    log('Applied an approved award to the estimate', `${r.wp}: ${i.label} ${fmtN(i.val, 1)} → ${fmtN(i.award.v, 1)} (${i.award.a.rec})`);
    toast(`${r.wp} material ${dv >= 0 ? '+' : '−'}${crN(Math.abs(dv))}, from the approved ${i.award.a.rec} award.`);
  },
  ptwm: d => { if (!can('margin') || gateSigned('G2')) return 'skip'; O().margin = num(d.v); log('Set margin from price to win', d.v + '%'); toast(`Margin set to ${d.v}%. G2 approves the price.`); },
  negoadd: d => { if (!can('nego')) return 'skip'; const c = concessions().find(x => x.k === d.k); if (!c) return 'skip'; O().nego.pos.push({ id: uid(), topic: c.topic, tender: c.them, ask: c.us, walk: '', agreed: '' }); log('Added a negotiating position raised from the draft', c.topic); }
});
const _qaccAI = ACT.qacc;
ACT.qacc = d => { const r = _qaccAI(d); if (d.k === 'takeoff') { const t = O().takeoff.find(x => x.id === d.id); if (t && t.st === 'accepted') { const b = takeoffToBoq(t); if (b) toast(`Accepted. ${b.code} now ${fmtN(b.ours)} ${b.unit}, linked to mark ${t.sym}.`); } } return r; };
document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.c === 'rownsel') { S.ui.rown = t.value; render(); } });

/* Stage 4 · the suggested decision, with its score, confidence and reasons (restored at the user's request) */
function aiG1Summary() {
  const o = O(), rows = o.g1.rows, sc = g1Score(), sugOnly = +rows.reduce((a, r) => a + num(r.w) * g1Sug(r) / 5, 0).toFixed(1);
  const dec = sugOnly >= 65 ? 'Bid' : sugOnly >= 55 ? 'Conditional bid' : 'No bid';
  const contrib = rows.map(r => ({ r, d: num(r.w) * (g1Sug(r) - 3) / 5 })).sort((a, b) => b.d - a.d);
  const up = contrib.filter(x => x.d > 0).slice(0, 2), dn = contrib.filter(x => x.d < 0).reverse().slice(0, 3);
  const confs = rows.map(r => g1Reason(r).conf), conf = confs.includes('None') || confs.includes('Low') ? 'Low' : confs.includes('Medium') ? 'Medium' : 'High';
  const ovN = rows.filter(r => r.ov != null && r.ov !== '').length;
  const blind = confs.filter(c => c === 'None').length;
  if (blind * 2 >= rows.length) return `<div class="panel aip"><div class="ph"><h3>${aiTag()} Suggested decision</h3></div><div class="pb stack" style="gap:8px"><b>Not enough on the record to suggest a decision.</b><span class="sub">${blind} of ${rows.length} criteria have no evidence yet. Fill in eligibility, risks and the long-lead plan, and the suggestion is worked out from them. The scores below are placeholders, not advice.</span></div></div>`;
  return `<div class="panel aip"><div class="ph"><div><h3>${aiTag()} Suggested decision</h3><span class="sub">Worked out from the records. The BD Head and the Managing Director decide.</span></div><button class="btn sm ghost" data-a="g1why" data-id="all">${S.ui.g1why === 'all' ? 'Hide all reasoning' : 'Show all reasoning'}</button></div><div class="pb stack" style="gap:12px">
   <div class="aidec"><span><small>Suggests</small><b>${dec}</b></span><span><small>Suggested score</small><b>${sugOnly}<i> / 100</i></b></span><span><small>Confidence</small><b>${conf}</b></span>${ovN ? `<span><small>With your ${ovN} override${ovN > 1 ? 's' : ''}</small><b>${sc}<i> / 100</i></b></span>` : ''}</div>
   <div class="grid g2" style="gap:12px"><div><span class="eyebrow">Holding it up</span><ul class="aidrv">${up.map(x => `<li class="w-up"><b>${esc(x.r.c)}</b> <span class="mono">+${x.d.toFixed(1)}</span></li>`).join('') || '<li class="sub">Nothing above average</li>'}</ul></div>
   <div><span class="eyebrow">Pulling it down</span><ul class="aidrv">${dn.map(x => `<li class="w-dn"><b>${esc(x.r.c)}</b> <span class="mono">${x.d.toFixed(1)}</span></li>`).join('') || '<li class="sub">Nothing below average</li>'}</ul></div></div>
   ${conf === 'Low' ? `<div class="note warn"><div><b>Low confidence.</b> ${confs.filter(c => c === 'Low').length} criteri${confs.filter(c => c === 'Low').length > 1 ? 'a rest' : 'on rests'} on thin or conflicting evidence. Open the reasoning before signing.</div></div>` : ''}</div></div>`;
}

/* ---------------- Addenda and corrigenda: a modal for recording one by hand ----------------
   The person types what the notice says; bidPlan reads it while they type and shows what it
   would touch. Nothing is written beyond what the person saves; impacts are reviewed in the
   register afterwards. */
const AD_PFX = { Corrigendum: 'Corr-', Addendum: 'Add-' };
function adNext(type) { const p = AD_PFX[type] || 'Corr-', n = O().addenda.map(a => (new RegExp('^' + p + '(\\d+)', 'i').exec(a.no) || [])[1]).filter(Boolean).map(Number); return p + String((n.length ? Math.max(...n) : 0) + 1).padStart(2, '0'); }
function adPreview(title) {
  if (!String(title || '').trim()) return `<span class="sub">Type what the notice changes and bidPlan shows what it touches here.</span>`;
  const I = addImpact({ title, impact: '' }), cur = O().meta.submission;
  return `<div class="row" style="gap:6px"><span class="chip ${I.sev === 'High' ? 'bad' : I.sev === 'Medium' ? 'warn' : ''}">${I.sev} impact</span>${I.fig ? `<span class="aihist">Changes a figure: <s>${esc(I.fig[1].trim())}</s> → <b>${esc(I.fig[2].trim())}</b></span>` : ''}</div>
   ${I.when ? aiHint(`Moves the bid date to ${fmtDate(I.when)}${I.when === cur ? ', which is already on the record' : `; the record says ${fmtDate(cur)}`}. You can apply it from the register.`, I.when === cur ? '' : 'warnt') : ''}
   ${I.qs.length ? aiHint(`May answer ${I.qs.map(q => esc(q.id)).join(', ')}`) : ''}
   ${I.todo.length ? `<ul class="aiimp">${I.todo.map(x => `<li class="prop">${aiMk()}<span><b>${esc(x[0])}</b><span class="sub"> · ${esc(x[1])}</span></span></li>`).join('')}</ul>` : '<span class="sub">Nothing on the record matches yet. It will still be listed for review.</span>'}`;
}
function addModal() {
  const m = S.modal, o = O(), a = m.id ? o.addenda.find(x => x.id === m.id) : null, r = m.rec, ed = canEdit('addenda');
  const type = r.type || (/^add/i.test(r.no || '') ? 'Addendum' : 'Corrigendum'), iso = /^\d{4}-\d{2}-\d{2}$/.test(r.date || '') ? r.date : dateIn(r.date || '') || isoL(TODAY instanceof Date ? TODAY : new Date());
  return `<div class="scrim" data-a="closemodal"><form class="modal" id="addform" role="dialog" aria-modal="true" aria-labelledby="adt-h"><div class="mh"><div><span class="eyebrow">${a ? 'Edit' : 'Record'} by hand · ${esc(o.meta.name)}</span><h2 id="adt-h">${a ? 'Edit ' + esc(a.no) : 'Add addendum or corrigendum'}</h2></div><button type="button" class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
   <div class="mb">
    <div class="fld"><span>Type</span><div class="seg" role="radiogroup" aria-label="Type">${['Corrigendum', 'Addendum'].map(t => `<button type="button" class="${type === t ? 'on' : ''}" data-a="adtype" data-v="${t}" role="radio" aria-checked="${type === t}">${t}</button>`).join('')}</div></div>
    <div class="grid g2"><label class="fld" for="ad-no">Number<input type="text" id="ad-no" value="${esc(r.no || adNext(type))}" required></label>
     <label class="fld" for="ad-date">Issued on<input type="date" id="ad-date" value="${esc(iso)}"></label></div>
    <label class="fld" for="ad-doc">Notice document<select id="ad-doc"><option value="">Not uploaded yet</option>${o.docs.map(d => `<option value="${d.id}" ${r.doc === d.id ? 'selected' : ''}>${esc(d.id)} · ${esc(d.name.slice(0, 60))}</option>`).join('')}</select><span class="sub">Upload the PDF on the Documents tab to read it page by page.</span></label>
    <label class="fld" for="ad-title">What it changes<textarea id="ad-title" style="min-height:76px" placeholder="e.g. Last date for submission extended to 19 Dec 2026" required>${esc(r.title || '')}</textarea></label>
    <div class="adprev"><span class="eyebrow">${aiMk()} What it touches</span><div id="adprev">${adPreview(r.title)}</div></div>
    <label class="fld" for="ad-imp">Impact notes (optional, one per line)<textarea id="ad-imp" style="min-height:60px" placeholder="Leave blank: the impacts above are proposed in the register for review">${esc(r.impact || '')}</textarea></label>
    ${m.err ? `<div class="note bad" role="alert"><div>${esc(m.err)}</div></div>` : ''}<p class="sub">Saved as ${esc(R().name)} · ${esc(R().title)} · recorded in the audit trail.</p></div>
   <div class="mf"><button type="button" class="btn" data-a="closemodal">Cancel</button>${ed ? `<button type="submit" class="btn pri">${a ? 'Save changes' : 'Add to the register'}</button>` : '<span class="chip">View only</span>'}</div></form></div>`;
}
const adGrab = () => { const v = id => (document.getElementById(id) || {}).value || ''; return { no: v('ad-no').trim(), date: v('ad-date'), doc: v('ad-doc'), title: v('ad-title').trim(), impact: v('ad-imp').trim() }; };
const _formModalAI = formModal;
formModal = function () { return S.modal && S.modal.k === 'addenda' ? addModal() : _formModalAI(); };
Object.assign(ACT, {
  /* Switching the type renumbers only a number bidPlan suggested, never one the person typed. */
  adtype: d => { const m = S.modal; if (!m) return 'skip'; const g = adGrab(), was = m.rec.type || (/^add/i.test(g.no) ? 'Addendum' : 'Corrigendum'), auto = !g.no || g.no === adNext(was); m.rec = { ...m.rec, ...g, type: d.v }; if (auto && !m.id) m.rec.no = adNext(d.v); }
});
document.addEventListener('input', e => { if (e.target.id === 'ad-title') { const p = document.getElementById('adprev'); if (p) p.innerHTML = adPreview(e.target.value); } });
document.addEventListener('submit', e => {
  if (e.target.id !== 'addform') return; e.preventDefault();
  if (!canEdit('addenda')) return;
  const o = O(), m = S.modal, g = adGrab();
  if (!g.no || !g.title) { m.rec = { ...m.rec, ...g }; m.err = 'Give the number and what it changes.'; render(); return; }
  if (o.addenda.some(a => a.no.toLowerCase() === g.no.toLowerCase() && a.id !== m.id)) { m.rec = { ...m.rec, ...g }; m.err = `${g.no} is already in the register.`; render(); return; }
  const date = g.date ? fmtDate(g.date) : '';
  if (m.id) { const a = o.addenda.find(x => x.id === m.id); Object.assign(a, { no: g.no, date, doc: g.doc, title: g.title, impact: g.impact }); log('Edited addendum', g.no); S.ui.flashRow = a.id; }
  else { const id = uid(); o.addenda.push({ id, no: g.no, date, doc: g.doc, title: g.title, impact: g.impact }); log('Recorded addendum by hand', `${g.no} · ${g.title.slice(0, 60)}`); S.ui.flashRow = id; }
  S.modal = null; toast(`${g.no} recorded. Its impacts are proposed in the register for review.`); render();
});
