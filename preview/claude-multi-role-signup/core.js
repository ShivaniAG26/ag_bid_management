// State, persistence, permissions UI, editable tables, record forms, wizard and shell.

const STORE = 'bidplan-ww2-v2';
const S = {
  view: 'wizard', wz: { step: 1, cfg: fullConfig() }, cfg: null, role: 'bid_manager',
  db: { opps: {}, order: [] }, oppId: OPP.id, phase: 'pre', tab: 'brief',
  v: { doc: null, page: null, sheet: 'P-001', z: 0, x: 0, y: 0, off: {}, dark: false, mode: 'pan', m: [], flash: null, list: 'pages', q: '', xtab: 0, back: null, ai: true },
  asst: false, msgs: [], modal: null, drawer: null, toast: null, sel: null, ui: {}, pipeMode: 'board', pipeType: 'all',
  sid: 's' + Math.random().toString(36).slice(2, 8),
  audit: [['25 Oct 09:05', 'Envelope guard', 'Scanned 14 draft sections: no prices found'], ['25 Oct 08:31', 'Drawing reader', 'Read 96 sheets; 4 flags raised']]
};
const O = () => S.db.opps[S.oppId];
function save() { try { localStorage.setItem(STORE, JSON.stringify({ cfg: S.cfg, wz: S.wz.cfg, role: S.role, db: S.db, oppId: S.oppId, audit: S.audit.slice(0, 60) })); } catch (e) { /* storage full or blocked: session only */ } }
function load() {
  try { const d = JSON.parse(localStorage.getItem(STORE) || 'null'); if (d) { S.cfg = d.cfg; if (d.wz) S.wz.cfg = d.wz; S.role = d.role || S.role; if (d.db && d.db.order.length) S.db = d.db; S.oppId = d.oppId || S.oppId; if (d.audit) S.audit = d.audit; if (S.cfg) S.view = 'overview'; } } catch (e) { /* ignore */ }
  if (!S.db.opps[OPP.id]) { S.db.opps[OPP.id] = seedIndrayani(); S.db.order.unshift(OPP.id); }
  if (!S.db.opps[S.oppId]) S.oppId = OPP.id;
  Object.values(S.db.opps).forEach(ensureShape);
}

/* file blobs live in IndexedDB so uploads survive a reload when the browser allows it */
const IDB = {
  db: null,
  open() { return this.db || (this.db = new Promise((res, rej) => { try { const r = indexedDB.open('bidplan-ww2-files', 1); r.onupgradeneeded = () => r.result.createObjectStore('f'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } })); },
  async put(k, v) { try { const d = await this.open(); d.transaction('f', 'readwrite').objectStore('f').put(v, k); } catch (e) { } },
  async get(k) { try { const d = await this.open(); return await new Promise(r => { const q = d.transaction('f').objectStore('f').get(k); q.onsuccess = () => r(q.result); q.onerror = () => r(null); }); } catch (e) { return null; } }
};
const FILES = {}; // doc id → Blob (in memory)

/* ---------------- helpers ---------------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtN = (n, d = 0) => Number(n || 0).toLocaleString(S.cfg && !/INR/.test(S.cfg.currency || 'INR') ? 'en-IE' : 'en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const I = p => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const IC = {
  home: I('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'), pipe: I('<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/>'),
  check: I('<path d="M4 12l5 5L20 6"/>'), map: I('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'), book: I('<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>'),
  bot: I('<rect x="4" y="8" width="16" height="11" rx="2"/><path d="M12 4v4M9 13h.01M15 13h.01"/>'), chart: I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'), gear: I('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
  spark: I('<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.6L12 15l-1.8-4.4L5.5 9l4.7-1.4z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>'), doc: I('<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>'),
  lock: I('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>'), plus: I('<path d="M12 5v14M5 12h14"/>'), search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  zin: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6M11 8v6"/>'), zout: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6"/>'), fit: I('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  hand: I('<path d="M8 13V5a1.5 1.5 0 013 0v6M11 11V4a1.5 1.5 0 013 0v7M14 11V6a1.5 1.5 0 013 0v8a6 6 0 01-6 6h-1a6 6 0 01-5-3l-2-4a1.5 1.5 0 012.6-1.5L8 13"/>'),
  ruler: I('<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>'), pin: I('<path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'), moon: I('<path d="M20 14A8 8 0 019 3a8 8 0 1011 11z"/>'),
  back: I('<path d="M15 6l-6 6 6 6"/>'), next: I('<path d="M9 6l6 6-6 6"/>'), dl: I('<path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 20h16"/>'), up2: I('<path d="M12 20V9M7 14l5-5 5 5"/><path d="M4 4h16"/>'), eye: I('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  pen: I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'), trash: I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>'),
  up: I('<path d="M12 19V5M6 11l6-6 6 6"/>'), down: I('<path d="M12 5v14M6 13l6 6 6-6"/>'), dots: I('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
  grip: I('<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>'),
  x: I('<path d="M6 6l12 12M18 6L6 18"/>'), alert: I('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>'), chat: I('<path d="M4 5h16v11H9l-5 4z"/>'), user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>'),
  drop: I('<path d="M12 3s7 7.6 7 12a7 7 0 01-14 0c0-4.4 7-12 7-12z"/><path d="M9 15a3 3 0 003 3"/>'), drawing: I('<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M14 14h7M14 14v6M6 8h6v6H6z"/>')
};
const STCH = { accepted: ['Accepted', 'ok'], proposed: ['Proposed', 'ai'], rejected: ['Rejected', 'bad'], pass: ['Pass', 'ok'], review: ['Review', 'warn'], fail: ['Fail', 'bad'], open: ['Open', 'warn'], answered: ['Answered', 'ok'], draft: ['Draft', ''], not_started: ['Not started', ''], in_review: ['In review', 'warn'], approved: ['Approved', 'ok'], compliant: ['Compliant', 'ok'], clarification: ['Clarification pending', 'warn'], unmapped: ['Unmapped', 'bad'], drafting: ['Drafting', 'ai'] };
const st = s => { const c = STCH[s] || [s, '']; return `<span class="chip ${c[1]}">${esc(c[0])}</span>`; };
const roleChip = r => ROLES[r] ? `<span class="chip" title="${esc(ROLES[r].title)}">${esc(ROLES[r].name)}</span>` : '';
const R = () => ROLES[S.role];
const typeName = id => (CATALOG.types.find(t => t[0] === id) || [, id])[1];
const modelName = id => (CATALOG.delivery.find(t => t[0] === id) || [, id])[1];
function nowTs() { const d = new Date(); return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
function log(act, obj) { S.audit.unshift([nowTs(), R().name, `${act}${obj ? ': ' + obj : ''}`]); }
const daysTo = iso => Math.round((new Date(iso) - TODAY) / 864e5);
const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };

/* citations: "code:page:section" or "dwg:SHEET" */
function parseRef(ref) {
  const [code, a, b] = String(ref).split(':'); const doc = (O() ? O().docs : DOCS).find(d => d.code === code);
  if (code === 'dwg') return { doc, sheet: a, label: `${a}${SHEETS.find(s => s.no === a) ? ' rev ' + SHEETS.find(s => s.no === a).rev : ''}` };
  if (doc && doc.kind === 'xls') return { doc, page: +a, sec: b, label: `${doc.short} ${b || ''}`.trim() };
  if (doc && doc.kind === 'img') return { doc, page: 1, sec: b, label: `${doc.short}${b ? ' ' + b : ''}` };
  return { doc, page: +a || 1, sec: b, label: `${doc ? doc.short : code}${b ? ' ' + b : ''} p.${a}` };
}
const src = ref => { if (!ref) return ''; const r = parseRef(ref); if (!r.doc) return `<span class="src" style="cursor:default;color:var(--muted)">${esc(ref)}</span>`; return `<button class="src" data-a="ref" data-ref="${esc(ref)}" title="Open ${esc(r.doc.name)}">${IC.doc}${esc(r.label)}</button>`; };

/* config */
const on = (k, id) => !S.cfg || S.cfg[k].includes(id);
const tabOn = t => { if (!t[3]) return true; if (!on('workflows', t[3])) return false; if (t[0] === 'om' && !on('scope', 'om')) return false; return true; };
function visiblePhases() { return PHASES.map(p => ({ ...p, tabs: p.tabs.filter(t => t[0] === '~' || t[0] === '|' || tabOn(t)) })).filter(p => p.tabs.some(t => t[0] !== '~' && t[0] !== '|')); }
/* A tab's wording as this tenant has it, for every place that names one. */
function tabLabel(id) { const ti = tabInfo(id); return ti ? (typeof label === 'function' ? label('tab', ti.t[0], ti.t[1]) : ti.t[1]) : id; }
function tabInfo(id) { for (const p of PHASES) { const t = p.tabs.find(x => x[0] === id); if (t) return { phase: p, t }; } return null; }

/* stages and gates (per opportunity) */
const stageState = n => n < O().pos ? 'done' : n === O().pos ? 'cur' : 'future';
/* A gate is signed only when every named signatory has signed it. Position alone is not
   sign-off: a tender advanced without the gate is "bypassed", and says so everywhere. */
const gateSigned = g => !!GATES[g] && GATES[g].roles.every(r => (O().signed || {})[g + r]);
const gateBypassed = g => !!GATES[g] && !gateSigned(g) && GATES[g].stage < O().pos;
const gatePassed = g => !!GATES[g] && (gateSigned(g) || GATES[g].stage < O().pos);
const gateRet = g => (O().gateRet || {})[g];
const gateReturned = g => !!(gateRet(g) || {}).open;
const canAdvance = () => can('meta') || S.role === 'pd';
const gateSigs = g => (O().sigs || []).filter(s => s.g === g);
/* One browser signing every signature is a demo convenience, not segregation of duties. Say so. */
const oneSession = g => { const l = gateSigs(g); return l.length > 1 && l.every(s => s.sid && s.sid === l[0].sid); };
function gatePanel(g, ready, hint) {
  const G = GATES[g], o = O(), signed = gateSigned(g), bypassed = gateBypassed(g), cur = G.stage === o.pos, ret = gateRet(g), isRet = gateReturned(g);
  const rows = G.roles.map(r => {
    const s = (o.signed || {})[g + r], sig = gateSigs(g).find(x => x.role === r);
    return `<div class="row between"><span>${esc(ROLES[r].name)} <span class="muted">· ${esc(ROLES[r].title)}</span></span>${s ? `<span class="chip ok">Signed${sig ? ' · ' + esc(sig.ts) : ''}</span>` : '<span class="chip">Waiting</span>'}</div>`;
  }).join('');
  const notes = [];
  if (bypassed) { const u = (o.ungated || {})[g] || {}; notes.push(`<div class="note warn"><div>${IC.lock} <b>Advanced without sign-off.</b> This tender moved past stage ${G.stage} on ${esc(u.ts || '—')}${u.by ? ` by ${esc(u.by)}` : ''} while ${g} was unsigned. It is recorded in the audit log and ${g} is still open for signature.</div></div>`); }
  if (isRet) notes.push(`<div class="note warn"><div>${IC.lock} <b>Returned with comments</b> by ${esc(ret.by)} on ${esc(ret.ts)}. “${esc(ret.comment)}”${G.roles.includes(S.role) || can('meta') ? ` <button class="btn sm" data-a="gateresolve" data-g="${g}">Mark resolved</button>` : ''}</div></div>`);
  if (signed && oneSession(g)) notes.push(`<div class="note"><div>${IC.lock} Both signatures were recorded from one session by switching “Acting as”. In production each signatory signs as themselves.</div></div>`);
  let act = '';
  if (signed) act = `<span class="chip ok">${g} signed by ${G.roles.length} of ${G.roles.length}</span>`;
  else if (!cur && !bypassed) act = `<span class="sub">Opens when the opportunity reaches stage ${G.stage}. Pass the earlier gates first.</span>`;
  else if (isRet) act = `<span class="sub">Resolve the returned comment before signing again.</span>`;
  else if (!ready) act = `<span class="sub">${esc(hint)}</span>`;
  else if (G.roles.includes(S.role) && !o.signed[g + S.role]) act = `<button class="btn pri" data-a="gate" data-g="${g}">Review and sign ${g}</button>`;
  else { const nx = G.roles.find(r => !o.signed[g + r]); act = nx ? `<button class="btn" data-a="role" data-r="${nx}">Act as ${esc(ROLES[nx].name)} to sign</button>` : ''; }
  const bypass = !signed && cur && canAdvance() ? `<button class="btn sm ghost" data-a="advance" title="Recorded against this tender and in the audit log">Advance without ${g}</button>` : '';
  const chip = signed ? '<span class="chip ok">Signed</span>' : bypassed ? '<span class="chip bad">Bypassed</span>' : isRet ? '<span class="chip bad">Returned</span>' : cur ? (ready ? '<span class="chip brand">Ready for sign-off</span>' : '<span class="chip warn">Not ready</span>') : '<span class="chip">Later stage</span>';
  return `<div class="panel" style="border-color:var(--brand)"><div class="ph"><h3>${g} · ${esc(G.name)}</h3>${chip}</div><div class="pb stack" style="gap:8px">${rows}${notes.join('')}<div class="row" style="margin-top:4px;gap:8px">${act}${bypass}</div></div></div>`;
}

/* ---------------- permissions UI ---------------- */
const LOCK = { est: 'G2', adders: 'G2', om: 'G2', g1rows: 'G1' };
/* Records lock on sign-off, not on position: a gate that was bypassed never approved anything. */
const canEdit = k => can(FORMS[k].perm) && !(LOCK[k] && O() && gateSigned(LOCK[k]));
const whoCan = area => (PERM[area] ? PERM[area].r : []).map(r => ROLES[r].name).join(', ');
function permBar(area) {
  const P = PERM[area];
  if (!P) return `<div class="permbar">${IC.lock}<span>This record is not part of the configured pack, so no role can edit it here.</span></div>`;
  if (can(area)) return `<div class="permbar ok">${IC.pen}<span>You can edit <b>${esc(P.l.toLowerCase())}</b> as ${esc(R().name)}, ${esc(R().title)}.</span></div>`;
  const first = P.r[0];
  return `<div class="permbar">${IC.lock}<span>View only as ${esc(R().title)}. <b>${esc(P.l)}</b> is edited by ${esc(P.r.map(r => ROLES[r].title).join(', '))}.</span><button class="btn sm" data-a="role" data-r="${first}">Act as ${esc(ROLES[first].name)}</button></div>`;
}

/* ---------------- editable table ---------------- */
function ctable(k, cols, opt = {}) {
  const o = O(), list = coll(o, k), F = FORMS[k], ed = canEdit(k) && !opt.ro;
  const rows = opt.filter ? list.filter(opt.filter) : list;
  const addBtn = ed && opt.add !== false ? `<button class="btn sm pri" data-a="fadd" data-k="${k}">${IC.plus}Add ${esc(F.t.toLowerCase())}</button>` : '';
  const head = `<div class="ph"><div class="row" style="gap:8px"><h3>${opt.title || F.t + 's'}</h3><span class="chip">${rows.length}</span></div><div class="row">${opt.right || ''}${addBtn}</div></div>`;
  const tr = r => S.ui.del === k + ':' + r.id
    ? `<tr><td colspan="${cols.length + 1}" style="background:var(--bad-soft)"><div class="row between"><span>Delete this ${esc(F.t.toLowerCase())}? Linked records keep their text.</span><span class="row"><button class="btn sm bad" data-a="fdelok" data-k="${k}" data-id="${esc(r.id)}">Delete</button><button class="btn sm" data-a="fdelno">Cancel</button></span></div></td></tr>`
    : `<tr class="${opt.hl && opt.hl(r) ? 'hl' : ''} ${S.ui.flashRow === r.id ? 'newrow' : ''} ${opt.rowCls ? opt.rowCls(r) : ''}">${cols.map(c => `<td class="${c.num ? 'num' : ''} ${c.cls || ''}">${c.v(r, ed)}</td>`).join('')}${ed ? `<td class="rowact"><button class="ibtn" data-a="fedit" data-k="${k}" data-id="${esc(r.id)}" aria-label="Edit" title="Edit">${IC.pen}</button><button class="ibtn del" data-a="fdel" data-k="${k}" data-id="${esc(r.id)}" aria-label="Delete" title="Delete">${IC.trash}</button></td>` : ''}</tr>`;
  /* opt.pre: suggested rows shown above the record's own rows; opt.after: a detail row that opens beneath a row */
  const nc = cols.length + (ed ? 1 : 0), pre = opt.pre ? opt.pre(nc, ed) : '';
  const body = rows.length || pre ? `<div class="tw"><table class="t"><thead><tr>${cols.map(c => `<th class="${c.num ? 'num' : ''} ${c.cls || ''}">${c.l}</th>`).join('')}${ed ? '<th></th>' : ''}</tr></thead><tbody>${pre}${rows.map(r => tr(r) + (opt.after ? opt.after(r, nc) : '')).join('')}${!rows.length ? `<tr><td colspan="${nc}"><div class="empty"><p>${esc(opt.empty || 'Nothing recorded yet.')}</p>${addBtn ? `<button class="btn pri" data-a="fadd" data-k="${k}">${IC.plus}Add the first ${esc(F.t.toLowerCase())}</button>` : ''}</div></td></tr>` : ''}</tbody>${opt.foot || ''}</table></div>`
    : `<div class="empty"><p>${esc(opt.empty || 'Nothing recorded yet.')}</p>${addBtn ? `<button class="btn pri" data-a="fadd" data-k="${k}">${IC.plus}Add the first ${esc(F.t.toLowerCase())}</button>` : `<span class="sub">${esc(PERM[F.perm].r.map(r => ROLES[r].title).join(', '))} can add these.</span>`}</div>`;
  return `<div class="panel">${head}${body}</div>`;
}
/* quick inline controls inside tables */
function qsel(k, r, f, opts, chipFn) { if (!canEdit(k)) return chipFn ? chipFn(r[f]) : esc(r[f]); return `<select class="qs" id="q-${k}-${esc(r.id)}-${f}" data-c="qset" data-k="${k}" data-id="${esc(r.id)}" data-f="${f}" aria-label="${f}">${opts.map(x => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}" ${String(r[f]) === String(v) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`; }
function qrange(k, r, f, min, max, step, unit) { const v = r[f]; if (!canEdit(k)) return `<div class="bar"><i style="width:${(v - min) / (max - min) * 100}%"></i></div><span class="mono sub">${v}${unit || ''}</span>`; return `<label class="row" style="gap:8px;flex-wrap:nowrap" for="q-${k}-${esc(r.id)}-${f}"><input type="range" id="q-${k}-${esc(r.id)}-${f}" min="${min}" max="${max}" step="${step}" value="${v}" data-c="qset" data-k="${k}" data-id="${esc(r.id)}" data-f="${f}" style="min-width:90px"><b class="mono" style="min-width:42px">${v}${unit || ''}</b></label>`; }
function qnum(k, r, f, w) { if (!canEdit(k)) return `<span class="mono">${fmtN(r[f], String(r[f]).includes('.') ? 1 : 0)}</span>`; return `<input type="number" class="qn" step="any" id="q-${k}-${esc(r.id)}-${f}" value="${r[f]}" data-c="qset" data-k="${k}" data-id="${esc(r.id)}" data-f="${f}" style="width:${w || 86}px" aria-label="${f}">`; }
function qchk(k, r, f, label) { const d = !canEdit(k); return `<label class="row" style="gap:6px;flex-wrap:nowrap" for="q-${k}-${esc(r.id)}-${f}"><input type="checkbox" id="q-${k}-${esc(r.id)}-${f}" data-c="qset" data-k="${k}" data-id="${esc(r.id)}" data-f="${f}" ${r[f] ? 'checked' : ''} ${d ? 'disabled' : ''} style="accent-color:var(--pack);width:16px;height:16px">${label || ''}</label>`; }

/* ---------------- record form (modal) ---------------- */
function srcOptions() { const o = O(); return [...o.docs.map(d => [d.code, `${d.id} · ${d.short}`]), ...(o.meta.seed === 'indrayani' ? [['dwg', 'Drawing sheet (DWG)']] : [])]; }
function fieldHtml(f, r) {
  const [k, l, type, req, opts] = f, v = r[k], id = 'ff-' + k, lab = `<span class="fldl">${esc(l)}${req ? '<i aria-hidden="true">*</i><span class="vh"> (required)</span>' : ''}</span>`;
  if (type === 'textarea') return `<label class="fld" for="${id}">${lab}<textarea id="${id}" data-f="${k}">${esc(v)}</textarea></label>`;
  if (type === 'num') return `<label class="fld" for="${id}">${lab}<input type="number" step="any" id="${id}" data-f="${k}" value="${v == null ? '' : esc(v)}"></label>`;
  if (type === 'check') return `<label class="chk" for="${id}" style="border:0"><input type="checkbox" id="${id}" data-f="${k}" ${v ? 'checked' : ''}><span>${esc(l)}</span></label>`;
  if (type === 'select') return `<label class="fld" for="${id}">${lab}<select id="${id}" data-f="${k}">${opts.map(([a, b]) => `<option value="${esc(a)}" ${String(v) === String(a) ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></label>`;
  if (type === 'role') return `<label class="fld" for="${id}">${lab}<select id="${id}" data-f="${k}">${Object.entries(ROLES).map(([a, b]) => `<option value="${a}" ${v === a ? 'selected' : ''}>${esc(b.name)} · ${esc(b.title)}</option>`).join('')}</select></label>`;
  if (type === 'range') { const [mn, mx, sp] = opts; return `<label class="fld" for="${id}"><span class="row between">${lab}<b class="mono" id="${id}-o">${v == null ? mn : v}</b></span><input type="range" id="${id}" data-f="${k}" min="${mn}" max="${mx}" step="${sp}" value="${v == null ? mn : v}" oninput="document.getElementById('${id}-o').textContent=this.value"></label>`; }
  if (type === 'sec') { const tree = ensureProp().tree; return `<label class="fld" for="${id}">${lab}<select id="${id}" data-f="${k}"><option value="">Not mapped yet</option>${tree.map((n, i) => `<option value="${esc(n.k || n.id)}" ${v === (n.k || n.id) ? 'selected' : ''}>${i + 1}. ${esc(n.title)}</option>`).join('')}</select></label>`; }
  if (type === 'src') {
    const p = v ? String(v).split(':') : ['', '', ''], opts2 = srcOptions();
    return `<fieldset class="fld" style="border:0;padding:0;margin:0"><legend style="padding:0;margin-bottom:5px">${lab}</legend><div class="row" style="flex-wrap:nowrap;gap:6px"><select id="${id}-d" aria-label="Source document" style="flex:2"><option value="">No source</option>${opts2.map(([a, b]) => `<option value="${a}" ${p[0] === a ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select><input type="text" id="${id}-p" placeholder="Page / sheet" value="${esc(p[1] || '')}" aria-label="Page or sheet" style="flex:1"><input type="text" id="${id}-s" placeholder="Clause, e.g. §3.2" value="${esc(p[2] || '')}" aria-label="Clause" style="flex:1"></div></fieldset>`;
  }
  return `<label class="fld" for="${id}">${lab}<input type="text" id="${id}" data-f="${k}" value="${v == null ? '' : esc(v)}"></label>`;
}
function readForm(k) {
  const F = FORMS[k], out = {}; let miss = null;
  F.f.forEach(([f, l, type, req]) => {
    if (type === 'src') { const d = document.getElementById('ff-' + f + '-d').value, p = document.getElementById('ff-' + f + '-p').value.trim(), s = document.getElementById('ff-' + f + '-s').value.trim(); out[f] = !d ? '' : d === 'dwg' ? 'dwg:' + (p || 'P-001') : `${d}:${p || 1}${s ? ':' + s : ''}`; return; }
    const el = document.getElementById('ff-' + f); if (!el) return;
    out[f] = type === 'check' ? el.checked : type === 'num' || type === 'range' ? (el.value === '' ? null : num(el.value)) : el.value.trim();
    if (req && (out[f] === '' || out[f] == null) && !miss) miss = l;
  });
  return { out, miss };
}
function formModal() {
  const m = S.modal, F = FORMS[m.k], ed = canEdit(m.k);
  return `<div class="scrim" data-a="closemodal"><form class="modal" id="recform" role="dialog" aria-modal="true" aria-labelledby="ft"><div class="mh"><div><span class="eyebrow">${m.id ? 'Edit' : 'New'} record · ${esc(O().meta.name)}</span><h2 id="ft">${m.id ? 'Edit' : 'Add'} ${esc(F.t.toLowerCase())}</h2></div><button type="button" class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
   <div class="mb">${m.note ? `<div class="note ai"><div>${IC.spark} ${esc(m.note)}</div></div>` : ''}${m.fromSel ? `<div class="note ai"><div>${IC.spark} Captured from <b>${esc(parseRef(m.rec.src || m.rec.ref || '').label)}</b>. Review the wording before saving.</div></div>` : ''}${F.f.map(f => fieldHtml(f, m.rec)).join('')}${m.err ? `<div class="note bad" role="alert"><div>${esc(m.err)}</div></div>` : ''}<p class="sub">Saved as ${esc(R().name)} · ${esc(R().title)} · recorded in the audit trail.</p></div>
   <div class="mf"><button type="button" class="btn" data-a="closemodal">Cancel</button>${ed ? `<button type="submit" class="btn pri">${m.id ? 'Save changes' : 'Add ' + esc(F.t.toLowerCase())}</button>` : `<span class="chip">View only</span>`}</div></form></div>`;
}

/* ---------------- setup wizard ---------------- */
const WZ_STEPS = ['Industry & company', 'Business profile', 'Project types', 'Delivery & scope', 'Technical scope', 'Workflows', 'Review & activate'];
function optBox(key, id, label, small, extra) { const c = S.wz.cfg[key].includes(id); return `<label class="opt ${c ? 'on' : ''}" for="wz-${key}-${id}"><input type="checkbox" id="wz-${key}-${id}" data-c="wzopt" data-k="${key}" data-id="${id}" ${c ? 'checked' : ''}><span style="min-width:0"><b>${esc(label)}</b>${small ? `<small>${esc(small)}</small>` : ''}</span>${extra || ''}</label>`; }
function grpHead(key, title, sub) { const n = S.wz.cfg[key].length, tot = CATALOG[key].length; return `<div class="grp-h"><div><h3>${title}</h3>${sub ? `<span class="sub">${sub}</span>` : ''}</div><div class="row"><span class="mono sub">${n} / ${tot}</span><button class="linkbtn" data-a="wzall" data-k="${key}" data-v="${n === tot ? 'none' : 'all'}">${n === tot ? 'Clear all' : 'Select all'}</button></div></div>`; }
function wizard() {
  const s = S.wz.step, c = S.wz.cfg;
  const head = (h, sub) => `<div class="stack" style="gap:8px"><span class="wz-eb">SETUP ${s} / 7</span><h1>${h}</h1><p class="sub" style="font-size:15px">${sub}</p></div>`;
  let body = '';
  if (s === 1) body = head('Your water-sector workspace', 'This walkthrough starts fully selected so you can explore the complete product. Change anything; every choice can be revisited later.') + `
    <div class="note pk"><div><b>Master selection: Water & wastewater.</b> Every project type, delivery arrangement, technical module and workflow is switched on.</div></div>
    <div class="grid g2"><label class="fld" for="wz-company">Company name<input type="text" id="wz-company" data-i="wzf" data-k="company" value="${esc(c.company)}"></label>
    <label class="fld" for="wz-ind">Industry<select id="wz-ind"><option selected>Water & wastewater</option><option disabled>Data centres (separate pack)</option><option disabled>Power & energy (separate pack)</option></select></label>
    <label class="fld" for="wz-country">Country of operation<input type="text" id="wz-country" data-i="wzf" data-k="country" value="${esc(c.country)}"></label>
    <label class="fld" for="wz-hq">Head office<input type="text" id="wz-hq" data-i="wzf" data-k="hq" value="${esc(c.hq)}"></label>
    <label class="fld" for="wz-cur">Reporting currency<select id="wz-cur" data-c="wzsel" data-k="currency">${['INR (₹ Cr)', 'USD (million)', 'AED (million)', 'EUR (million)'].map(o => `<option ${o === c.currency ? 'selected' : ''}>${o}</option>`).join('')}</select></label></div>`;
  if (s === 2) body = head('How your company bids', 'Your role decides which risks and documents bidPlan prioritises. Client types tune eligibility rules and contract templates.') + `
    <h3>Roles you bid on water projects</h3><div class="opts">${CATALOG.roles.map(r => `<label class="opt ${c.role === r[0] ? 'on' : ''}" for="wz-role-${r[0]}"><input type="radio" name="wzrole" id="wz-role-${r[0]}" data-c="wzrole" value="${r[0]}" ${c.role === r[0] ? 'checked' : ''}><span><b>${r[1]}</b><small>${r[2]}</small></span></label>`).join('')}</div>
    ${grpHead('clients', 'Clients you bid for')}<div class="opts">${CATALOG.clients.map(x => optBox('clients', x[0], x[1])).join('')}</div>`;
  if (s === 3) body = head('Every water project type', 'Project types set the process templates, calculators, standards and past-bid comparisons available on each opportunity.') + grpHead('types', 'Project types') + `<div class="opts">${CATALOG.types.map(x => optBox('types', x[0], x[1], x[2])).join('')}</div>`;
  if (s === 4) body = head('Enable delivery arrangements', 'All models are available to the account. Each opportunity selects its actual arrangement; these are not simultaneous contracts.') + grpHead('delivery', 'Available delivery arrangements') + `<div class="opts">${CATALOG.delivery.map(x => optBox('delivery', x[0], x[1])).join('')}</div>` + grpHead('scope', 'Our contracted scope may include') + `<div class="opts">${CATALOG.scope.map(x => optBox('scope', x[0], x[1])).join('')}</div>`;
  if (s === 5) body = head('Enable technical capabilities', 'Technical modules decide which calculators, drawing readers and specialist agents run on each tender.') + grpHead('tech', 'Technical modules') + `<div class="opts">${CATALOG.tech.map(x => optBox('tech', x[0], x[1], x[2])).join('')}</div>`;
  if (s === 6) { const grp = (k, h) => `<h3>${h}</h3><div class="opts">${CATALOG.workflows.filter(w => w[3] === k).map(w => optBox('workflows', w[0], w[1], w[2], w[4] ? `<span class="gt gchip pend">${w[4]}</span>` : '')).join('')}</div>`; body = head('Enable bid and delivery workflows', 'Each workflow adds screens to every opportunity. Workflows marked with a gate add an approval that named roles must sign.') + grpHead('workflows', 'Workflows') + grp('pre', 'Tender Intelligence') + grp('prop', 'Proposal') + grp('post', 'Post-award'); }
  if (s === 7) {
    const chips = (k, gate) => `<div class="row" style="gap:6px">${CATALOG[k].filter(x => c[k].includes(x[0])).map(x => `<span class="chip ${gate && x[4] ? 'brand' : 'pk'}">${esc(x[1])}${gate && x[4] ? ' · ' + x[4] : ''}</span>`).join('') || '<span class="chip bad">None selected</span>'}</div>`;
    body = head('Your master configuration', 'Review the full capability profile before entering your workspace.') + `<div><div class="sumrow"><span>Company / role</span><b>${esc(c.company)} · ${esc(CATALOG.roles.find(r => r[0] === c.role)[1])}</b></div><div class="sumrow"><span>Project types</span>${chips('types')}</div><div class="sumrow"><span>Delivery profiles</span>${chips('delivery')}</div><div class="sumrow"><span>Contracted scope</span>${chips('scope')}</div><div class="sumrow"><span>Technical modules</span>${chips('tech')}</div><div class="sumrow"><span>Workflows</span>${chips('workflows', true)}</div></div>`;
  }
  const nav = `<div class="wz-nav"><button class="btn lg" data-a="wzstep" data-v="${s - 1}" ${s === 1 ? 'disabled' : ''}>Back</button>${s < 7 ? `<button class="btn lg pri" data-a="wzstep" data-v="${s + 1}">Continue →</button>` : `<button class="btn lg pri" data-a="activate" ${c.types.length ? '' : 'disabled'}>Activate workspace →</button>`}</div>`;
  return `<div class="wz"><header class="wz-top"><span class="wordmark">${logoSvg('wordmark',28)}</span><div class="row"><span class="chip pk">Water & Wastewater</span><button class="btn ghost" data-a="activate">Open workspace</button></div></header>
  <div class="wz-body"><nav class="wz-steps" aria-label="Setup steps">${WZ_STEPS.map((n, i) => `<button class="${i + 1 === s ? 'on' : i + 1 < s ? 'done' : ''}" data-a="wzstep" data-v="${i + 1}"><span class="n">${i + 1 < s ? '✓' : i + 1}</span>${n}</button>`).join('')}<div class="tag">One platform.<br>Every water-sector capability.<br><br>Configure broadly.<br>Confirm scope per opportunity.</div></nav>
  <main class="wz-main"><div class="wz-inner">${body}${nav}</div></main></div></div>`;
}

/* ---------------- shell ---------------- */
/* Live means open: a tender closed at G1 as No bid, or lost, leaves the live list. */
function liveOpps() { return S.db.order.map(id => S.db.opps[id]).filter(o => on('types', o.meta.types[0]) && !o.closed); }
function closedOpps() { return S.db.order.map(id => S.db.opps[id]).filter(o => o.closed); }
function shell(content, crumbs) {
  const mini = !!S.ui.railMin;
  const nb = (v, ic, l, ct) => `<button class="${S.view === v ? 'on' : ''}" data-a="go" data-v="${v}" title="${esc(l)}">${ic}<span class="ot">${l}</span>${ct != null ? `<span class="ct">${ct}</span>` : ''}</button>`;
  const opps = liveOpps();
  return `<div class="app ${mini ? 'rail-min' : ''}"><aside class="rail" aria-label="Main menu">
   <div class="railhd"><div class="logo"><span class="mk">${logoSvg('mark',48)}</span><span class="lk">${logoSvg('lockup',30)}</span></div></div>
   <div class="tenant" title="${esc(S.cfg.company)}"><span class="tini">${esc(S.cfg.company.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join(''))}</span><div class="tnm"><b>${esc(S.cfg.company)}</b><span>Water & wastewater · ${esc(CATALOG.roles.find(r => r[0] === S.cfg.role)[1])}</span></div></div>
   <nav class="nav"><h6>Workspace</h6>${nb('overview', IC.home, 'Overview')}${nb('pipeline', IC.pipe, 'Opportunities', opps.length + PIPE.filter(p => !p.main && on('types', p.type)).length)}${nb('tasks', IC.check, 'My work', myTasks().length)}</nav>
   <nav class="nav opps"><h6>Live opportunities</h6>${opps.map(o => `<button class="${S.view === 'opp' && S.oppId === o.meta.id ? 'on' : ''}" data-a="opp" data-id="${o.meta.id}" title="${esc(o.meta.name)}"><span class="oid">${o.meta.id.slice(-4)}</span><span class="ot">${esc(o.meta.name)}</span></button>`).join('')}<button data-a="newopp" title="New tender">${IC.plus}<span class="ot">New tender</span></button></nav>
   <nav class="nav"><h6>Platform</h6>${nb('kb', IC.book, 'Knowledge library')}${nb('agents', IC.bot, 'Agents & specialists')}${nb('analytics', IC.chart, 'Analytics & audit')}${nb('admin', IC.gear, 'Admin console')}</nav>
   <div class="rail-foot"><button class="railtog" data-a="railtog" aria-label="${mini ? 'Expand menu' : 'Collapse menu'}" aria-expanded="${!mini}" title="${mini ? 'Expand menu' : 'Collapse menu'}">${mini ? IC.next : IC.back}<span class="ot">Collapse menu</span></button></div></aside>
  <div class="main"><header class="top"><div class="crumbs">${crumbs}</div><div class="topr">${roleBtn()}${userBtn()}</div></header>
   <main class="content">${content}</main></div>${aiDock()}</div>`;
}

/* Two controls on the top bar, both icon-only: the role being acted as, and
   the account. Theme, the assistant and profile settings live in the account menu. */
function roleBtn() {
  const r = R(), open = !!S.ui.rmenu;
  return `<div class="profile">
   <button class="rolebtn" data-a="rmenu" aria-haspopup="menu" aria-expanded="${open}" aria-label="Acting as ${esc(r.name)}, ${esc(r.title)}" title="Acting as ${esc(r.name)}, ${esc(r.title)}">
    <span class="av sm">${esc(r.ini)}</span><span class="rolebtn__tx"><small>Acting as</small><b>${esc(r.title)}</b></span>${IC.down}</button>
   ${open ? `<div class="menu menu--roles" role="menu" aria-label="Acting as">
    <div class="menu__lbl">Acting as</div>
    <div class="proto__scen menu__scen">${Object.entries(ROLES).map(([k, x]) => `<button role="menuitemradio" aria-checked="${k === S.role}" class="${k === S.role ? 'is-now' : ''}" data-a="role" data-r="${k}">${esc(x.title)}${k === S.role ? '<span class="proto__badge">Current role</span>' : ''}<small>${esc(x.name)}</small></button>`).join('')}</div>
    <div class="menu__foot">Every screen, queue and permission follows this role.</div></div>` : ''}</div>`;
}
function userBtn() {
  const r = R(), open = !!S.ui.umenu;
  return `<div class="profile">
   <button class="avatar-btn" data-a="umenu" aria-haspopup="menu" aria-expanded="${open}" aria-label="Your account" title="${esc(r.name)} — ${esc(r.title)}"><span class="av">${esc(r.ini)}</span></button>
   ${open ? userMenu() : ''}</div>`;
}
function userMenu() {
  const r = R(), dark = (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
  const sw = on => `<span class="mini-switch${on ? ' is-on' : ''}" aria-hidden="true"><i></i></span>`;
  return `<div class="menu" role="menu" aria-label="Your account">
   <div class="menu__head"><span class="av lg">${esc(r.ini)}</span><span class="stack" style="gap:1px;min-width:0"><strong>${esc(r.name)}</strong><span class="muted menu__mail">${esc(S.auth ? S.auth.email : '')}</span><span class="muted" style="font-size:12px">${esc(r.title)}</span></span></div>
   <hr class="menu__rule">
   <button role="menuitemcheckbox" aria-checked="${S.asstOn !== false}" class="menu__item" data-a="asston">${IC.spark}<span class="grow">AI assistant</span>${sw(S.asstOn !== false)}</button>
   <button role="menuitemcheckbox" aria-checked="${dark}" class="menu__item" data-a="theme">${IC.moon}<span class="grow">Dark mode</span>${sw(dark)}</button>
   <button role="menuitem" class="menu__item" data-a="go" data-v="admin">${IC.gear}<span class="grow">Profile settings</span></button>
   <hr class="menu__rule">
   <button role="menuitem" class="menu__item" data-a="reset">${IC.trash}<span class="grow">Reset sample data</span></button>
   ${S.auth ? `<button role="menuitem" class="menu__item" data-a="signout">${IC.lock}<span class="grow">Sign out</span></button>` : ''}</div>`;
}

const crumb = (...p) => [`<button data-a="go" data-v="overview">${esc(S.cfg.company.replace(/ Pvt Ltd$/, ''))}</button>`, ...p].join(' <span>/</span> ');

/* role work queue: built from live records */
/* Key dates are written for people ("29 Oct 2026"); tasks compare them as dates.
   ai.js owns the parser (dateIn); it is loaded later, so this is read at call time. */
const isoOf = label => typeof dateIn === 'function' ? dateIn(String(label || '')) : '';
function myTasks() {
  const out = [];
  S.db.order.forEach(id => {
    const o = S.db.opps[id], n = o.meta.name;
    o.reqs.filter(r => r.st === 'proposed' && r.owner === S.role).forEach(r => out.push([`Review proposed requirement ${r.id}`, 'Review', n, 'reqs', id]));
    o.risks.filter(r => r.owner === S.role && r.l * r.i >= 16).forEach(r => out.push([`High risk ${r.id}: ${r.risk.slice(0, 50)}`, 'Alert', n, 'risks', id]));
    const cut = (o.dates || []).find(d => /pre-bid|corrigendum|quer/i.test(d.k || ''));
    o.clars.filter(c => c.status === 'draft' && S.role === 'bid_manager').forEach(c => out.push([`Send draft query ${c.id}`, 'Task', n, 'clar', id, cut ? isoOf(cut.d) : '']));
    if (o.prop) o.prop.tree.forEach(s => { if (s.own === S.role && ['not_started', 'draft'].includes(s.st)) out.push([`Draft section: ${s.title}`, 'Task', n, 'pdraft', id, s.due || '']); if (s.rev === S.role && s.st === 'in_review') out.push([`Review section: ${s.title}`, 'Approval', n, 'pown', id, s.due || '']); });
    Object.entries(GATES).forEach(([g, G]) => { if (G.stage === o.pos && G.roles.includes(S.role) && !o.signed[g + S.role]) out.push([`Sign ${g} ${G.name.toLowerCase()}`, 'Approval', n, G.tab, id]); });
    if (S.role === 'procurement') o.longlead.filter(l => llFloat(l) < 0).forEach(l => out.push([`Long-lead late: ${l.item}`, 'Alert', n, 'proc', id]));
    if (S.role === 'estimator' && !o.est.length && TABV.est && tabInfo('est')) out.push(['Build the estimate', 'Task', n, 'est', id, o.meta.submission || '']);
    if (['contracts', 'commercial'].includes(S.role)) (o.contract.clauses || []).filter(c => c.st === 'Negotiating').forEach(c => out.push(['Contract clause open: ' + c.ref + ' ' + c.title, 'Task', n, 'contract', id]));
    if (S.role === 'contracts') o.bgs.filter(b => b.st !== 'Released' && (new Date(b.exp) - TODAY) / 864e5 < 60).forEach(b => out.push(['BG expiring: ' + b.type, 'Alert', n, 'cadmin', id, b.exp || '']));
    if (S.role === 'qhse') o.ncr.filter(x => x.st !== 'Closed').forEach(x => out.push(['Close ' + x.id + ': ' + x.desc, 'Task', n, 'qhse', id]));
    if (S.role === 'site' && o.pos >= 11) out.push(['Write today\'s site diary', 'Task', n, 'construct', id]);
  });
  return out;
}
const llFloat = l => num(l.need) - num(l.order) - Math.ceil(num(l.lead) / 4.33);

/* ---------------- assistant: answers from this opportunity's records ---------------- */
/* The assistant is a floating dock, not a column: it rests as a pill at the
   bottom of the stage, opens into a panel, and can be dragged anywhere. */
/* The assistant exists only while its toggle (profile menu) is on. It rests as
   one floating bar wrapped in a border beam; the conversation opens above it.
   Voice turns the bar into a listening pill that glows with the speaker's level. */
/* One mark for a step in any AI run: done, running (the globe), or waiting.
   Every processing list in the app uses this, so they all look like one thing. */
const aiGlobe = () => `<span class="aiglobe" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg></span>`;
const aiMark = st => st === 'done' ? IC.check : st === 'now' ? aiGlobe() : '<span class="aiwait" aria-hidden="true"></span>';

/* The orb is hand-tuned at two sizes only, 20 and 64; any other value falls
   back to the thin inline drawing, which is why a 56px scan orb looked like a
   20px one. Ask for the tuned size and scale it into whatever slot it has. */
function orbFit(opts, cls) {
  const px = +opts.size || 20;
  if (px <= 22) return { opts: Object.assign({}, opts, { size: 20 }), cls, style: '' };
  return { opts: Object.assign({}, opts, { size: 64 }), cls: (cls || '') + ' lv-orbfit',
    style: `--k:${(px / 64).toFixed(4)}` };
}

const AI_STEPS = [['searching', 'Searching this tender’s records'], ['connecting', 'Checking requirements, risks and queries'], ['composing', 'Writing the answer']];
function aiDock() {
  /* Three states: switched off in the account menu, resting as a button, or out. */
  if (!S.auth || S.asstOn === false) return '';
  const o = O(); if (!o) return '';
  /* Closed, the assistant is a button at the right edge; the bar grows out of it. */
  if (!S.asst) return `<button class="lv-fab" data-a="asst" aria-label="Open the assistant" title="Ask about this tender">
   <span class="lv-orb lv-orbfit" style="--k:0.72" data-fx="orb" data-fxo='{"state":"breathing","size":64}' data-fxid="lv-fab" aria-hidden="true"></span></button>`;
  const pos = S.ui.aid, busy = !!S.ui.aiThinking, voice = S.ui.voice, open = busy || !!voice || !!S.ui.aidOpen;
  const step = S.ui.aiStep || 0;
  const sugg = ['What are the highest risks?', 'Which requirements are still proposed?', 'Which clarifications are still open?', 'What is the current price?'];
  /* a dragged dock is pinned by its bottom edge, so opening the conversation grows it upward */
  const placed = pos && pos.b != null, style = placed ? `left:${pos.x}px;bottom:${pos.b}px;top:auto;right:auto;--lvb:${pos.b}px` : '';
  const fx = (kind, opts, cls, id) => { const f = kind === 'orb' ? orbFit(opts, cls) : { opts, cls, style: '' };
    return `<span class="${f.cls || 'fx-host'}" style="${f.style}" data-fx="${kind}" data-fxid="${id}" data-fxo='${JSON.stringify(f.opts)}' aria-hidden="true"></span>`; };
  const orb = (state, size, id) => fx('orb', { state, size }, 'lv-orb lv-orb' + size, 'lv-' + id);
  const enter = open && !aiDock.wasOpen; aiDock.wasOpen = open;
  const grew = !aiDock.wasOut; aiDock.wasOut = true;
  const panel = open ? `<section class="lv-panel ${enter ? 'is-enter' : ''}" aria-label="Assistant">
    <header class="lv-head">${orb(busy ? AI_STEPS[step][0] : voice ? 'listening' : 'breathing', 32, 'head')}<div class="lv-ttl"><b>Assistant</b><span>${busy ? 'Thinking…' : voice ? 'Listening' : 'Answers from this tender’s records'}</span></div>
      ${S.msgs.length ? `<button class="lv-ic" data-a="aidclear" aria-label="Clear conversation" title="Clear">${IC.trash}</button>` : ''}<button class="lv-ic" data-a="aidmin" aria-label="Close conversation" title="Close">${IC.x}</button></header>
    <div class="lv-body" id="aidbody">
      ${S.msgs.length ? '' : `<div class="lv-hello">${orb('breathing', 64, 'hello')}<p>Ask about <b>${esc(o.meta.name)}</b>. I answer only from its records and say so when none supports an answer.</p></div>`}
      ${S.msgs.map(m => m.u ? `<div class="lv-m is-me">${esc(m.u)}</div>` : `<div class="lv-m is-ai"><div class="lv-a">${m.a}</div>${(m.c || []).length ? `<div class="lv-src">${(m.c || []).map(src).join('')}</div>` : ''}<span class="lv-at">${esc(m.st)}</span></div>`).join('')}
      ${busy ? `<div class="lv-think" role="status">${orb(AI_STEPS[step][0], 32, 'think')}<ol>${AI_STEPS.map(([, l], i) => `<li class="${i < step ? 'done' : i === step ? 'now' : ''}">${aiMark(i < step ? 'done' : i === step ? 'now' : '')}<span>${l}</span></li>`).join('')}</ol></div>` : ''}
      ${!busy && !voice ? `<div class="lv-sug">${sugg.map(q => `<button class="lv-chip" data-a="askq" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : ''}
    </div></section>` : '';
  const bar = voice
    ? `<div class="lv-bar is-voice">${fx('voice', { processing: voice === 'processing', mic: S.ui.voiceLive, type: 'default', strength: 1.3 }, '', 'lv-voice')}${orb(voice === 'processing' ? 'composing' : 'listening', 32, 'vorb')}
        <div class="lv-vtx" aria-live="polite"><b>${voice === 'processing' ? 'Got it' : 'Listening…'}</b><span>${esc(S.ui.voiceText || (S.ui.voiceLive ? 'Ask your question out loud' : 'Voice preview: speaking a sample question'))}</span></div>
        <button class="lv-ic" data-a="voicecancel" aria-label="Cancel voice">${IC.x}</button><button class="lv-stop" data-a="voicestop" aria-label="Stop and ask"><i></i></button></div>`
    : `<div class="lv-bar">${busy ? fx('beam', { size: 'md', strength: 1, active: true }, 'fx-host lv-rim', 'lv-beam') : ''}<span class="lv-grip" aria-hidden="true">${IC.grip}</span>
        <button class="lv-orbbtn" data-a="aidopen" aria-label="${open ? 'Hide' : 'Show'} conversation">${orb(busy ? AI_STEPS[step][0] : 'breathing', 20, 'bar')}</button>
        <form id="askform" class="lv-form"><input class="lv-in" type="text" id="askin" placeholder="${busy ? 'Thinking…' : 'Ask anything about this tender'}" aria-label="Ask the assistant" ${busy ? 'disabled' : ''} autocomplete="off">
        <button type="button" class="lv-ic lv-mic" data-a="voice" aria-label="Ask by voice" ${busy ? 'disabled' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></button>
        <button class="lv-go" type="submit" aria-label="Send" ${busy ? 'disabled' : ''}>${IC.up || '↑'}</button></form>
        <button class="lv-ic lv-close" data-a="asst" aria-label="Close the assistant" title="Close">${IC.x}</button></div>`;
  return `<div class="lvd ${open ? 'is-open' : ''} ${voice ? 'is-voice' : ''} ${busy ? 'is-busy' : ''} ${placed ? 'is-placed' : ''} ${grew ? 'is-grow' : ''}" id="aid" style="${style}">${panel}${bar}</div>`;
}
/* Asking takes a beat: the question shows, the orb walks through searching,
   checking and writing, then the answer replaces the thinking card. */
function askAI(q) {
  if (S.ui.aiThinking || !q) return;
  S.asst = true; S.ui.aidOpen = true; S.msgs.push({ u: q }); S.ui.aiThinking = true; S.ui.aiStep = 0; render(); aidScroll();
  setTimeout(() => { S.ui.aiStep = 1; render(); aidScroll(); }, 650);
  setTimeout(() => { S.ui.aiStep = 2; render(); aidScroll(); }, 1300);
  setTimeout(() => { S.msgs.pop(); answer(q); S.ui.aiThinking = false; S.ui.aiStep = 0; render(); aidScroll(); const i = document.getElementById('askin'); if (i) i.focus(); }, 1950);
}
/* Voice: the live microphone drives the glow; the browser's speech recognition
   writes the words. Where either is missing (the preview frame may block the
   mic), a sample question is spoken into the bar so the flow can still be seen. */
let VOICE = null;
async function voiceStart() {
  if (S.ui.aiThinking || S.ui.voice) return;
  S.ui.voice = 'listening'; S.ui.voiceText = ''; S.ui.voiceLive = false; S.ui.aidOpen = true; render();
  const stream = window.BPFX && BPFX.mic ? await BPFX.mic.start() : null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!S.ui.voice) { if (window.BPFX) BPFX.mic.stop(); return; }
  if (stream && SR) {
    S.ui.voiceLive = true; render();
    const r = new SR(); r.lang = 'en-IN'; r.interimResults = true; r.continuous = false;
    VOICE = { r, final: '' };
    r.onresult = e => { let t = ''; for (const x of e.results) t += x[0].transcript; VOICE.final = t; S.ui.voiceText = t; render(); };
    r.onend = () => voiceFinish(VOICE && VOICE.final);
    r.onerror = () => voiceFallback();
    try { r.start(); } catch (e) { voiceFallback(); }
  } else voiceFallback();
}
function voiceFallback() {
  if (window.BPFX) BPFX.mic.stop();
  S.ui.voiceLive = false; if (!S.ui.voice) return;
  const q = 'What are the highest risks on this tender?', words = q.split(' ');
  /* a speech-like level: syllable pulses every ~90ms, a word every ~300ms */
  let i = 0, t = 0; VOICE = { sim: setInterval(() => {
    if (!S.ui.voice) return clearInterval(VOICE.sim);
    t++; if (window.BPFX) BPFX.bump(0.4 + 0.5 * Math.abs(Math.sin(t * 1.7)) * Math.random() + 0.1);
    if (t % 3) return;
    if (i < words.length) { i++; S.ui.voiceText = words.slice(0, i).join(' '); render(); }
    else if (t > words.length * 3 + 6) { clearInterval(VOICE.sim); voiceFinish(q); }
  }, 95) };
  render();
}
function voiceFinish(text) {
  if (!S.ui.voice) return;
  if (window.BPFX) BPFX.mic.stop();
  if (VOICE && VOICE.sim) clearInterval(VOICE.sim);
  VOICE = null; const q = (text || '').trim();
  S.ui.voice = q ? 'processing' : null; render();
  setTimeout(() => { S.ui.voice = null; S.ui.voiceText = ''; render(); if (q) askAI(q); }, q ? 450 : 0);
}
function voiceStop() { if (VOICE && VOICE.r) { try { VOICE.r.stop(); } catch (e) { voiceFinish(VOICE.final); } } else voiceFinish(S.ui.voiceText); }
function voiceCancel() { if (VOICE && VOICE.r) { VOICE.r.onend = null; try { VOICE.r.abort(); } catch (e) { } } if (VOICE && VOICE.sim) clearInterval(VOICE.sim); VOICE = null; if (window.BPFX) BPFX.mic.stop(); S.ui.voice = null; S.ui.voiceText = ''; render(); }
function aidScroll() { const ab = document.getElementById('aidbody'); if (ab) ab.scrollTop = ab.scrollHeight; }
document.addEventListener('input', e => { if (e.target && e.target.id === 'askin' && window.BPFX) BPFX.bump(0.55 + Math.random() * 0.4); });
/* focusing the bar opens the conversation above it */
document.addEventListener('focusin', e => { if (e.target && e.target.id === 'askin' && !S.ui.aidOpen) { S.ui.aidOpen = true; render(); const i = document.getElementById('askin'); if (i) i.focus(); } });
/* dragging the dock: the grip, or the whole bar while it is resting */
(function () {
  let drag = null;
  const pt = e => e.touches ? e.touches[0] : e;
  document.addEventListener('pointerdown', e => {
    const dock = e.target.closest && e.target.closest('.lvd'); if (!dock) return;
    if (!e.target.closest('.lv-grip')) return;
    const r = dock.getBoundingClientRect(); const p = pt(e);
    drag = { dock, dx: p.clientX - r.left, dy: p.clientY - r.top, w: r.width, h: r.height, moved: false };
    dock.classList.add('is-drag'); e.preventDefault();
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return; const p = pt(e);
    const x = Math.min(Math.max(8, p.clientX - drag.dx), innerWidth - drag.w - 8);
    const y = Math.min(Math.max(8, p.clientY - drag.dy), innerHeight - drag.h - 8);
    const b = Math.max(8, Math.min(Math.round(innerHeight - y - drag.h), innerHeight - 320));
    drag.dock.classList.add('is-placed');
    drag.dock.style.cssText = `left:${x}px;bottom:${b}px;top:auto;right:auto;--lvb:${b}px`;
    drag.moved = true; S.ui.aid = { x, b };
  });
  document.addEventListener('pointerup', () => { if (drag) { drag.dock.classList.remove('is-drag'); drag = null; } });
})();
function answer(q) {
  const o = O(), ql = q.toLowerCase(); S.msgs.push({ u: q });
  const R2 = (a, c, s) => S.msgs.push({ a, c: c || [], st: s });
  if (/proposed|accept/.test(ql)) { const l = o.reqs.filter(r => r.st === 'proposed'); return R2(l.length ? `${l.length} requirements await acceptance: <ul>${l.slice(0, 5).map(r => `<li><b>${r.id}</b> ${esc(r.text)}</li>`).join('')}</ul>` : 'Every requirement has been accepted or rejected.', l.slice(0, 3).map(r => r.src), 'From ' + o.reqs.length + ' requirements'); }
  if (/risk/.test(ql)) { const l = o.risks.slice().sort((a, b) => b.l * b.i - a.l * a.i).slice(0, 3), eb = can('envB'); return R2(l.length ? `<ul>${l.map(r => `<li><b>${r.id}</b> (score ${r.l * r.i}) ${esc(r.risk)} · ${r.treat}${eb ? `, exposure ₹${fmtN(expo(r), 1)} Cr` : ''}</li>`).join('')}</ul>${eb ? '' : '<p class="sub">Priced exposure sits in envelope B; your role cannot view it.</p>'}` : 'No risks recorded yet. Add them in Tender Intelligence → Risks.', l.map(r => r.src), 'From the risk register'); }
  if (/clarif|query|open/.test(ql)) { const l = o.clars.filter(c => c.status !== 'answered'); return R2(l.length ? `<ul>${l.map(c => `<li><b>${c.id}</b> (${c.status}) ${esc(c.q.slice(0, 120))}</li>`).join('')}</ul>` : 'No open clarifications.', l.slice(0, 3).map(c => c.src), 'From ' + o.clars.length + ' queries'); }
  if (/price|cost|estimate|bpc/.test(ql)) { if (!o.est.length) return R2('No estimate yet. The estimator builds it in Tender Intelligence → Estimate.', [], 'Not found'); if (!can('envB')) return R2('Prices sit in envelope B. Your role cannot view them.', [], 'Restricted'); const e = estTotals(); return R2(`Bid Project Cost ₹${fmtN(e.price, 1)} Cr: direct ₹${fmtN(e.direct, 1)} Cr, adders ₹${fmtN(e.add, 1)} Cr (including ₹${fmtN(e.cont, 1)} Cr priced risk) and ${e.m}% margin.`, [], 'From the estimate'); }
  const words = ql.split(/\W+/).filter(w => w.length > 3);
  const pool = [...o.reqs.map(r => [r.id, r.text, r.src]), ...o.risks.map(r => [r.id, r.risk, r.src]), ...o.clars.map(c => [c.id, c.q, c.src]), ...o.basis.map(b => [b.f, b.f + ': ' + b.v, b.src]), ...o.brief.facts.map(f => [f.k, f.k + ': ' + f.v, f.src])];
  const hits = pool.map(p => [p, words.filter(w => p[1].toLowerCase().includes(w)).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
  R2(hits.length ? `Closest records: <ul>${hits.map(h => `<li><b>${esc(h[0])}</b> ${esc(h[1])}</li>`).join('')}</ul>` : 'No record on this opportunity answers that. Add the requirement, risk or design basis and ask again.', hits.map(h => h[2]).filter(Boolean), hits.length ? 'Searched ' + pool.length + ' records' : 'Not found');
}

/* ---------------- overlays ---------------- */
function overlays() {
  let h = '';
  if (S.ui && S.ui.ren && typeof renameOverlay === 'function') h += renameOverlay();
  if (S.modal && (S.modal.find != null || S.modal.win != null) && typeof dashModal === 'function') h += dashModal();
  if (S.modal && S.modal.k) h += formModal();
  if (S.modal && S.modal.mail) h += composeModal();
  if (S.modal && S.modal.integ && typeof integModal === 'function') h += integModal();
  if (S.modal && S.modal.invite && typeof inviteModal === 'function') h += inviteModal();
  if (S.modal && S.modal.gate) {
    const g = S.modal.gate, G = GATES[g], o = O();
    const sum = { G1: [['Weighted score', g1Score() + ' / 100'], ['Decision', o.g1.dec || '—'], ['Knock-outs met', o.g1.ko.filter(k => k.ok).length + ' / ' + o.g1.ko.length]], G2: () => { const e = estTotals(), om = omSchedule(); return [['Bid Project Cost', `₹${fmtN(e.price, 1)} Cr`], ['Margin', `${e.m}%`], ['Priced risk in contingency', `₹${fmtN(e.cont, 1)} Cr`], ['O&M NPV at 10%', `₹${fmtN(om.npv, 1)} Cr`]]; }, G3: () => [['Sections approved', ensureProp().tree.filter(n => n.st === 'approved').length + ' / ' + ensureProp().tree.length], ['Requirements compliant', compliance().filter(c => c.s === 'compliant').length + ' / ' + compliance().length]], G4: [['Result', o.nego.result], ['Baseline items ready', o.baseline.filter(b => b.ok).length + ' / ' + o.baseline.length]], G5: [['Guarantees within limit', o.ptest.filter(ptPass).length + ' / ' + o.ptest.length], ['Category A punch open', o.punch.filter(p => p.cat === 'A' && p.st !== 'Closed').length]], G6: [['Turnover complete', o.turn.filter(t => t.pct >= 100).length + ' / ' + o.turn.length]] }[g];
    const rs = typeof roleGateSum === 'function' && roleGateSum(g), rows = rs || (typeof sum === 'function' ? sum() : sum);
    h += `<div class="scrim" data-a="closemodal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="gt"><div class="mh"><div><span class="eyebrow">Approval gate · ${esc(o.meta.name)}</span><h2 id="gt">${g} · ${esc(G.name)}</h2></div><button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
     <div class="mb"><dl class="kv">${rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>${g === 'G1' && o.g1.dec === 'No bid' ? `<div class="note warn"><div>${IC.lock} <b>The decision is No bid.</b> Signing closes this tender and moves it out of the live pipeline. It does not advance to engineering.</div></div>` : ''}<label class="fld" for="gatecomment">Comment for the record<textarea id="gatecomment" placeholder="Conditions, if any"></textarea></label><p class="sub">You sign as <b>${esc(R().name)}</b>, ${esc(R().title)}. A comment is required to return the gate.</p></div>
     <div class="mf"><button class="btn" data-a="closemodal">Cancel</button><button class="btn bad" data-a="gatereturn" data-g="${g}">Return with comments</button><button class="btn pri" data-a="gatesign" data-g="${g}">Sign ${g}</button></div></div></div>`;
  }
  if (S.modal && S.modal.newopp) {
    h += `<div class="scrim" data-a="closemodal"><form class="modal" id="oppform" role="dialog" aria-modal="true" aria-labelledby="nt"><div class="mh"><div><span class="eyebrow">Stage 1 · Capture</span><h2 id="nt">Start a new tender</h2></div><button type="button" class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
     <div class="mb"><p class="sub">The new opportunity starts empty. Upload its documents, then build requirements, risks, the estimate and the proposal stage by stage.</p><div class="grid g2"><label class="fld" for="no-name">Opportunity name *<input type="text" id="no-name" required placeholder="e.g. Kolhapur 85 MLD STP"></label><label class="fld" for="no-client">Client *<input type="text" id="no-client" required placeholder="e.g. Kolhapur Municipal Corporation"></label>
     <label class="fld" for="no-loc">Location<input type="text" id="no-loc" placeholder="City, state"></label><label class="fld" for="no-type">Project type<select id="no-type">${CATALOG.types.filter(t => on('types', t[0])).map(t => `<option value="${t[0]}">${t[1]}</option>`).join('')}</select></label>
     <label class="fld" for="no-model">Delivery arrangement<select id="no-model">${CATALOG.delivery.filter(t => on('delivery', t[0])).map(t => `<option value="${t[0]}">${t[1]}</option>`).join('')}</select></label><label class="fld" for="no-value">Estimated value (₹ Cr)<input type="number" id="no-value" step="any" placeholder="e.g. 480"></label>
     <label class="fld" for="no-due">Technical bid due *<input type="date" id="no-due" required value="2026-12-18"></label>
     <label class="fld" for="no-owner">Bid manager<select id="no-owner">${Object.entries(ROLES).map(([k, r]) => `<option value="${k}"${k === (S.modal.owner || 'bid_manager') ? ' selected' : ''}>${esc(r.name)} · ${esc(r.title)}</option>`).join('')}</select></label></div>
     ${can('docs') ? `<div class="fld"><span>Tender documents <span class="muted">· optional, you can add them later</span></span>
      <div class="dropzone" id="ntdrop"><b>${IC.up}Drop the tender pack here</b><span class="sub">PDF, DWG or XLS · or click to choose files</span><input type="file" id="ntfiles" data-c="ntfiles" multiple accept=".pdf,.dwg,.dxf,.xls,.xlsx,.csv" aria-label="Choose tender documents"></div>
      ${(S.modal.files || []).length ? `<div class="ntfl">${S.modal.files.map((f, i) => `<span class="ntf"><span class="ntf-n">${esc(f.name)}</span><span class="muted">${f.size < 1048576 ? Math.max(1, Math.round(f.size / 1024)) + ' KB' : (f.size / 1048576).toFixed(1) + ' MB'}</span><button type="button" class="ibtn" data-a="ntdrop" data-i="${i}" aria-label="Remove ${esc(f.name)}">${IC.x}</button></span>`).join('')}<span class="sub">${S.modal.files.length} file${S.modal.files.length > 1 ? 's' : ''} will be read as soon as the tender is created.</span></div>` : ''}</div>` : ''}
     ${S.modal.err ? `<div class="note bad" role="alert"><div>${esc(S.modal.err)}</div></div>` : ''}</div>
     <div class="mf"><button type="button" class="btn" data-a="closemodal">Cancel</button><button type="submit" class="btn pri">Create tender</button></div></form></div>`;
  }
  if (S.sel) h += `<div class="selbar" style="left:${S.sel.x}px;top:${S.sel.y}px" role="toolbar" aria-label="Create a record from the selected text"><span>${IC.spark}Create from selection</span>${[['reqs', 'Requirement'], ['risks', 'Risk'], ['clars', 'Query'], ['basis', 'Design basis'], ['facts', 'Key fact']].map(([k, l]) => `<button data-a="selrec" data-k="${k}">${l}</button>`).join('')}</div>`;
  if (S.drawer) h += `<div class="scrim" data-a="closedrawer" style="background:rgba(8,16,18,.3)"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(S.drawer.title)}"><div class="mh"><div><span class="eyebrow">${esc(S.drawer.eb || '')}</span><h3>${esc(S.drawer.title)}</h3></div><button class="ibtn" data-a="closedrawer" aria-label="Close">${IC.x}</button></div><div class="mb">${S.drawer.html}</div></aside>`;
  if (S.sheet && typeof docSheet === 'function') h += docSheet();
  if (S.toast) h += `<div class="toast" role="status">${esc(S.toast)}</div>`;
  return h;
}

/* ---------------- sub-tabs ---------------- */
function subtabs(tab, list) {
  S.ui.sub = S.ui.sub || {}; const cur = list.find(x => x[0] === S.ui.sub[tab]) ? S.ui.sub[tab] : list[0][0];
  const nm = (k, l) => typeof label === 'function' ? label('sub', `${tab}/${k}`, l) : l;
  const ra = (k, l) => typeof renAttr === 'function' ? ' ' + renAttr('sub', `${tab}/${k}`, l) + (canRename() ? ' title="Right-click to rename this tab"' : '') : '';
  return { cur, html: `<nav class="subtabs" aria-label="Sections">${list.map(([k, l, b]) => `<button class="${k === cur ? 'on' : ''}" data-a="sub" data-t="${tab}" data-v="${k}"${ra(k, l)}>${nm(k, l)}${b != null && b !== '' ? ` <span class="ct2">${b}</span>` : ''}</button>`).join('')}</nav>` };
}

/* ---------------- email (simulated: nothing leaves the browser) ---------------- */
function threadOf(t) { return (O().mail || []).filter(m => m.thread === t || (t.endsWith('*') && m.thread.startsWith(t.slice(0, -1)))); }
function mailThread(t, opt = {}) {
  const ms = threadOf(t);
  if (!ms.length) return `<p class="sub">${esc(opt.empty || 'No emails yet.')}</p>`;
  return `<div class="thread">${ms.map(m => `<div class="mail ${m.dir}"><div class="row between"><b>${esc(m.dir === 'out' ? 'To ' + m.to : 'From ' + m.from)}</b><span class="mono sub">${esc(m.ts)}</span></div><div class="sub" style="font-weight:600">${esc(m.subject)}</div><div class="mbody">${esc(m.body)}</div>${m.attach.length ? `<div class="row" style="gap:4px">${m.attach.map(a => `<span class="chip">${IC.doc}${esc(a)}</span>`).join('')}</div>` : ''}${opt.record && m.dir === 'in' ? `<div><button class="btn sm ok" data-a="mailrec" data-id="${esc(opt.record)}" data-m="${m.id}">Record as the answer</button></div>` : ''}</div>`).join('')}</div>`;
}
function openMail(o) { S.modal = { mail: { to: '', cc: '', subject: '', body: '', attach: [], ...o } }; }
function composeModal() {
  const m = S.modal.mail;
  return `<div class="scrim" data-a="closemodal"><form class="modal" id="mailform" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="mh"><div><span class="eyebrow">Email · ${esc(O().meta.name)}</span><h2 id="mt">${esc(m.title || 'New email')}</h2></div><button type="button" class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
   <div class="mb">${(() => {
      const f = m.guard || []; if (!f.length) return `<div class="note"><div>Sent from the project mailbox and filed to this record. Outgoing text is scanned by the envelope guard. In this prototype nothing leaves your browser.</div></div>`;
      const hard = !!(m.after && (m.after.rfq || m.after.clar));
      return `<div class="note warn"><div>${IC.lock} <b>Envelope guard stopped this message.</b> ${hard ? 'Prices must not go to a supplier or the Authority.' : 'Check this is meant to carry a price.'} Found: ${f.slice(0, 6).map(x => `<b>${esc(x.hit)}</b>`).join(', ')}${f.length > 6 ? ` and ${f.length - 6} more` : ''}.
       <div class="row" style="gap:8px;margin-top:6px"><button type="button" class="btn sm" data-a="mailguardfix">Edit the message</button>${can('envB') ? `<button type="button" class="btn sm bad" data-a="mailguardovr">Override and send as ${esc(R().title)}</button>` : `<span class="sub">Only ${esc(whoCan('envB'))} can override.</span>`}</div></div></div>`;
    })()}
   <label class="fld" for="ml-to">To<input type="text" id="ml-to" value="${esc(m.to)}"></label><label class="fld" for="ml-cc">Cc<input type="text" id="ml-cc" value="${esc(m.cc)}"></label>
   <label class="fld" for="ml-sub">Subject<input type="text" id="ml-sub" value="${esc(m.subject)}"></label><label class="fld" for="ml-body">Message<textarea id="ml-body" style="min-height:170px">${esc(m.body)}</textarea></label>
   ${m.attach.length ? `<div class="row" style="gap:4px"><span class="sub">Attachments</span>${m.attach.map(a => `<span class="chip">${IC.doc}${esc(a)}</span>`).join('')}</div>` : ''}</div>
   <div class="mf"><button type="button" class="btn" data-a="mailcopy">Copy text</button><button type="button" class="btn" data-a="closemodal">Cancel</button><button type="submit" class="btn pri">Send</button></div></form></div>`;
}
const REPLIES = {
  'clar:PBQ-03': 'The design raw BOD of 200 mg/l in Vol II §3.1 governs. Bidders may state any additional headroom in their technical bid.',
  'clar:PBQ-04': 'The Authority will obtain right of way along SH-55 from MSRDC. A time extension will apply for delays beyond 90 days.',
  'clar:PBQ-05': 'The energy guarantee is measured at the STP 22 kV incomer and excludes the intermediate pumping stations.',
  'clar:PBQ-07': 'Bidders may raise the outfall level and provide a flap gate to achieve 0.5 m free fall over HFL.',
  clar: 'Noted. The tender provision governs; please price accordingly. This reply will be included in the next corrigendum.',
  rfq: 'Thank you for the enquiry. Our quotation is attached, valid for 90 days, FOR site.',
  contract: 'The Authority has reviewed your redline. Agreed items are reflected in the attached revision; open items will be discussed at the meeting on Friday.',
  notice: 'The Independent Engineer acknowledges receipt of your notice and will respond within 14 days.'
};
