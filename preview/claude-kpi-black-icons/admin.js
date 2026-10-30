// Admin console (tenant admin) and Reports & analytics with actionable insights.

let DEF_GATES = deep(Object.fromEntries(Object.entries(GATES).map(([g, G]) => [g, G.roles])));
let DEF_PERM = deep(Object.fromEntries(Object.entries(PERM).map(([k, p]) => [k, p.r])));
const PACK_ITEMS = [
  ['Evaluation criteria (two-envelope)', 'Shown', 'Shown', 'Optional'], ['Redundancy / topology view', 'Shown', 'Hidden', 'Hidden'], ['Process design basis (flow, quality, recovery)', 'Hidden', 'Shown', 'Hidden'],
  ['Guaranteed technical particulars / data-sheet builder', 'Optional', 'Optional', 'Shown'], ['Owner-furnished equipment register', 'Shown', 'Optional', 'Hidden'], ['Factory slots and module transport', 'Optional', 'Hidden', 'Shown'],
  ['O&M period pricing', 'Optional', 'Shown', 'Hidden'], ['Land and right-of-way register', 'Hidden', 'Shown', 'Hidden'], ['Welding and NDT', 'Hidden', 'Shown', 'Optional'], ['Hydraulic surge analysis', 'Hidden', 'Optional', 'Hidden'], ['Membrane autopsy and CIP plan', 'Hidden', 'Optional', 'Hidden']
];
const MODELS = [['qwen3-32b-instruct', 'Drafting, Q&A, reasoning', 'v2026.08', 'gpu-01 (on-prem)', 'Active'], ['text-vision-eval-01', 'Drawing and table reading', 'v1.6', 'gpu-01 (on-prem)', 'Active'], ['bge-m3', 'Embeddings for search', 'v1.0', 'gpu-02', 'Active'], ['ww-adapter-narmada-v3', 'Tenant adapter (34 past bids)', 'v3', 'gpu-01', 'Active'], ['ww-adapter-narmada-v4', 'Tenant adapter retrain (41 bids)', 'v4-rc', 'gpu-01', 'In evaluation']];
const INTEG = [['MahaTenders / CPPP portal feed', 'Tender intake', true], ['GeM', 'Tender intake', true], ['Microsoft 365 mail', 'Project mailbox, clarifications, RFQs', true], ['Azure AD SSO (SAML)', 'Sign-in and MFA', true], ['SAP S/4HANA', 'POs, vendors, cost actuals', false], ['Primavera P6 (XER)', 'Schedule sync', true], ['SharePoint', 'Document archive', false], ['MPCB online monitoring', 'Effluent data at O&M', false]];
function ensureAdmin() {
  if (!S.cfg) return null;
  if (!S.cfg.admin) S.cfg.admin = {
    users: Object.entries(ROLES).map(([k, r], i) => ({ id: 'u' + i, name: r.name, email: r.name.toLowerCase().replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '.') + '@' + (S.auth ? S.auth.email.split('@')[1] : 'narmadawater.in'), role: k, status: 'Active', mfa: i !== 7, last: ['Today 09:12', 'Today 08:40', 'Yesterday', 'Today 09:01', 'Today 07:55', 'Today 09:05', 'Yesterday', 'Today 08:30', '2 days ago', 'Today 08:10', '3 days ago', 'Today 07:20', 'Yesterday', 'Today 08:00', 'Today 09:15'][i] || 'Today' })),
    gates: deep(DEF_GATES), perm: deep(DEF_PERM), g2limit: 1000, g1limit: 500, vis: {}, agents: Object.fromEntries(AGENTS.map(a => [a[0], { on: true, mode: 'Human review required' }])), egress: 'Default-deny', retention: 365, region: 'India (Mumbai)', seats: 25, integ: Object.fromEntries(INTEG.map(i => [i[0], i[2]])), sso: true, mfa: 'Required for all users',
    credits: { included: 250000, balance: 182400, topups: [] }
  };
  if (!S.cfg.admin.credits) S.cfg.admin.credits = { included: 250000, balance: 182400, topups: [] };
  return S.cfg.admin;
}
function applyAdmin() { const A = ensureAdmin(); if (!A) return; Object.entries(A.gates).forEach(([g, r]) => { if (GATES[g]) GATES[g].roles = r; }); Object.entries(A.perm).forEach(([k, r]) => { if (PERM[k]) PERM[k].r = r; }); if (!PERM.admin.r.includes('admin')) PERM.admin.r.push('admin'); }
const isAdmin = () => can('admin');

/* ---------------- AI credits ----------------
   Every AI action in the workspace spends credits. What an admin needs to see
   is where they are going, how long the balance lasts at that rate, and a way
   to buy more; everyone else sees the same picture without the buy button,
   because topping up is a billing action and only the Tenant Admin holds it. */
const CREDIT_BURN = [
  ['Document reading', 26800, '--brand-solid', 'tender packs, drawings, addenda'],
  ['Proposal drafting', 19400, '--ai-teal', 'sections, compliance matrix, annexures'],
  ['Drawings & takeoff', 12900, '--ai-sky', 'vector reads, quantity extraction'],
  ['Search & embeddings', 5200, '--ai-lav', 'knowledge library indexing'],
  ['Agent runs', 3300, '--ai-ochre', 'the nine specialists']
];
const CREDIT_PACKS = [
  ['s', 50000, 42000], ['m', 200000, 150000], ['l', 500000, 340000]
];
const crBurn = () => CREDIT_BURN.reduce((a, r) => a + r[1], 0);
/* days of cover at the current monthly rate */
const crDays = bal => Math.max(0, Math.round(bal / (crBurn() / 30)));
function crRunsOut(bal) {
  const d = new Date(); d.setDate(d.getDate() + crDays(bal));
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function crCover(n) {
  const d = crDays(n);
  return d >= 60 ? `about ${Math.round(d / 30)} months of cover` : d >= 21 ? `about ${Math.round(d / 7)} weeks of cover` : `about ${d} days of cover`;
}
function creditsTab(A, ed) {
  const C = A.credits, burn = crBurn(), used = Math.max(0, C.included - C.balance);
  const pct = Math.min(100, Math.round(used / C.included * 100));
  const low = C.balance < burn;                       /* under a month left */
  return `<div class="agrid2">
    <section class="panel acr-lead">
      <div class="ph"><div><h3>AI credits</h3><span class="sub">Enterprise plan · renews 1 Jan 2027</span></div>
        ${low ? '<span class="chip warn">Running low</span>' : '<span class="chip ok">Healthy</span>'}</div>
      <div class="pb stack">
        <div class="acr-fig"><span class="v">${fmtN(C.balance, 0)}</span><span class="u">credits left</span>
          <span class="acr-note">${crCover(C.balance)} — on this rate they run out around <b>${crRunsOut(C.balance)}</b></span></div>
        <div class="acr-rail" role="img" aria-label="${pct}% of the included allowance used"><i style="width:${pct}%" class="${low ? 'warn' : ''}"></i></div>
        <span class="sub">${fmtN(used, 0)} of ${fmtN(C.included, 0)} included used this period${C.topups.length ? ` · ${C.topups.length} top-up${C.topups.length === 1 ? '' : 's'} added` : ''}</span>
        ${ed ? `<div class="row" style="gap:var(--space-8)"><button class="btn pri" data-a="crbuy">${IC.plus}Buy credits</button>
            <button class="btn sm ghost" data-a="toast" data-msg="Usage export is simulated: a CSV of every AI action, who ran it and what it cost.">${IC.dl}Export usage</button></div>`
      : `<div class="note"><div>${IC.lock} Only the Tenant Admin can buy credits. Ask ${esc(ROLES.admin.name)} to top up.</div></div>`}
      </div>
    </section>
    <section class="panel"><div class="ph"><div><h3>Where they went</h3><span class="sub">This month · ${fmtN(burn, 0)} credits</span></div></div>
      <div class="pb stack">
        <div class="acr-bar">${CREDIT_BURN.map(r => `<i style="flex:${r[1]};background:var(${r[2]})" title="${esc(r[0])}"></i>`).join('')}</div>
        <ul class="acr-key">${CREDIT_BURN.map(r => `<li><i style="background:var(${r[2]})"></i><div><b>${esc(r[0])}</b><span>${esc(r[3])}</span></div><em>${fmtN(r[1], 0)}</em></li>`).join('')}</ul>
      </div></section>
    ${C.topups.length ? `<section class="panel" style="grid-column:1/-1"><div class="ph"><h3>Top-ups</h3><span class="sub">Added to this period</span></div>
      <div class="tw"><table class="t"><thead><tr><th>When</th><th>Pack</th><th class="num">Credits</th><th class="num">Amount</th><th>Bought by</th></tr></thead>
      <tbody>${C.topups.slice().reverse().map(t => `<tr><td class="mono sub">${esc(t.at)}</td><td>${esc(t.name)}</td><td class="num mono">${fmtN(t.n, 0)}</td><td class="num mono">₹${fmtN(t.rs, 0)}</td><td>${esc(t.by)}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
  </div>`;
}
function creditsModal() {
  const A = ensureAdmin(), pick = S.ui.crPack || 'm';
  const P = CREDIT_PACKS.find(p => p[0] === pick) || CREDIT_PACKS[1];
  return `<div class="scrim" data-a="closemodal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="crt">
    <div class="mh"><div><span class="eyebrow">Billing · Tenant Admin only</span><h2 id="crt">Buy AI credits</h2></div>
      <button class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
    <div class="mb stack">
      <div class="acr-packs">${CREDIT_PACKS.map(([k, n, rs]) => `<button class="acr-pack ${k === pick ? 'on' : ''}" data-a="crpack" data-v="${k}">
        <span class="n">${fmtN(n, 0)}</span><span class="l">credits</span><span class="p">₹${fmtN(rs, 0)}</span>
        <span class="c">${crCover(n)}</span><span class="r">₹${(rs / n).toFixed(2)} per credit</span></button>`).join('')}</div>
      <div class="note"><div>Adding <b>${fmtN(P[1], 0)}</b> credits takes the balance to <b>${fmtN(A.credits.balance + P[1], 0)}</b>, ${crCover(A.credits.balance + P[1])}. Credits never expire while the plan is active.</div></div>
    </div>
    <div class="mf"><button class="btn" data-a="closemodal">Cancel</button>
      <button class="btn pri" data-a="crconfirm">Buy for ₹${fmtN(P[2], 0)}</button></div></div></div>`;
}

/* ---------------- grouped console navigation ----------------
   Nine settings screens in one flat row is a wall of words. Grouping them
   under what they are about means a reader scans three short lists. */
const ADMIN_GROUPS = [
  ['Workspace', [['tenant', 'Tenant & licence'], ['credits', 'Plan & AI credits'], ['pack', 'Pack configuration']]],
  ['People & access', [['users', 'Users & roles'], ['perm', 'Permissions'], ['appr', 'Approval matrix']]],
  ['Platform & governance', [['integ', 'Integrations'], ['ai', 'AI governance'], ['audit', 'Audit log']]]
];
/* Buying is gated on the role, not on the button being hidden: a non-admin who
   reaches the action another way is still refused. */
Object.assign(ACT, {
  crbuy: () => { if (!isAdmin()) { toast('Only the Tenant Admin can buy credits.'); return 'skip'; } S.ui.crPack = S.ui.crPack || 'm'; S.modal = { credits: true }; },
  crpack: d => { S.ui.crPack = d.v; },
  crconfirm: () => {
    if (!isAdmin()) { toast('Only the Tenant Admin can buy credits.'); return 'skip'; }
    const A = ensureAdmin(), P = CREDIT_PACKS.find(p => p[0] === (S.ui.crPack || 'm')) || CREDIT_PACKS[1];
    A.credits.balance += P[1];
    A.credits.topups.push({ at: nowTs(), name: fmtN(P[1], 0) + ' credits', n: P[1], rs: P[2], by: R().name });
    log('Bought AI credits', `${fmtN(P[1], 0)} credits for ₹${fmtN(P[2], 0)}`);
    S.modal = null;
    toast(`${fmtN(P[1], 0)} credits added. Balance is now ${fmtN(A.credits.balance, 0)}.`);
  },
  appredit: () => { S.ui.apprEdit = !S.ui.apprEdit; },
  apprall: () => { S.ui.apprAll = !S.ui.apprAll; }
});

function adminTabs(badge) {
  S.ui.sub = S.ui.sub || {};
  const flat = ADMIN_GROUPS.reduce((a, g) => a.concat(g[1]), []);
  const cur = flat.some(t => t[0] === S.ui.sub.admin) ? S.ui.sub.admin : flat[0][0];
  const html = `<nav class="atabs3" aria-label="Admin sections">${ADMIN_GROUPS.map(([label, tabs]) =>
    `<div class="atg"><span class="atg-l">${esc(label)}</span><div class="atg-b">${tabs.map(([k, l]) => {
      const b = badge[k];
      return `<button class="${k === cur ? 'on' : ''}" data-a="sub" data-t="admin" data-v="${k}" ${k === cur ? 'aria-current="page"' : ''}>${esc(l)}${b != null && b !== '' ? `<span class="ct2">${b}</span>` : ''}</button>`;
    }).join('')}</div></div>`).join('')}</nav>`;
  return { cur, html };
}

function vAdmin() {
  const A = ensureAdmin(), ed = isAdmin(), roles = Object.keys(ROLES);
  const T = adminTabs({ users: A.users.length, audit: S.audit.length });
  let x = '';
  const lock = ed ? '' : `<div class="permbar">${IC.lock}<span>View only as ${esc(R().title)}. The admin console is managed by the Tenant Admin.</span><button class="btn sm" data-a="role" data-r="admin">Act as ${esc(ROLES.admin.name)}</button></div>`;
  if (T.cur === 'tenant') { x = `<div class="grid g2"><div class="panel"><div class="ph"><h3>Tenant</h3></div><div class="pb"><dl class="kv"><dt>Company</dt><dd>${esc(S.cfg.company)}</dd><dt>Head office</dt><dd>${esc(S.cfg.hq)}</dd><dt>Industry pack</dt><dd>Water & Wastewater v2.0</dd><dt>Plan</dt><dd>Enterprise · on-premise inference</dd><dt>Reporting currency</dt><dd>${esc(S.cfg.currency)}</dd><dt>Tenant ID</dt><dd class="mono">${esc(S.auth ? S.auth.tenant : 'tn-narmada-ww-0042')}</dd></dl>${ed ? `<div class="row" style="margin-top:12px"><button class="btn sm" data-a="wizard">Revisit setup wizard</button></div>` : ''}</div></div>
     <div class="panel"><div class="ph"><h3>Licence and security</h3></div><div class="pb stack">${ed ? `<label class="fld" for="ad-seats">Licensed seats<input type="number" id="ad-seats" data-c="adset" data-k="seats" value="${A.seats}"></label><label class="fld" for="ad-region">Data region<select id="ad-region" data-c="adset" data-k="region">${['India (Mumbai)', 'India (Hyderabad)', 'UAE (Dubai)', 'On-premise only'].map(r => `<option ${r === A.region ? 'selected' : ''}>${r}</option>`).join('')}</select></label><label class="fld" for="ad-mfa">Multi-factor authentication<select id="ad-mfa" data-c="adset" data-k="mfa">${['Required for all users', 'Required for approvers', 'Optional'].map(r => `<option ${r === A.mfa ? 'selected' : ''}>${r}</option>`).join('')}</select></label><label class="chk" for="ad-sso"><input type="checkbox" id="ad-sso" data-c="adchk" data-k="sso" ${A.sso ? 'checked' : ''}><span>Single sign-on through Azure AD (SAML)</span></label>` : `<dl class="kv"><dt>Seats</dt><dd>${A.seats}</dd><dt>Region</dt><dd>${esc(A.region)}</dd><dt>MFA</dt><dd>${esc(A.mfa)}</dd><dt>SSO</dt><dd>${A.sso ? 'On' : 'Off'}</dd></dl>`}</div></div></div>`; }
  if (T.cur === 'users') x = `<div class="panel"><div class="ph"><div><h3>Users</h3><span class="sub">${A.users.filter(u => u.status === 'Active').length} active · ${A.users.filter(u => u.status === 'Invited').length} invited · ${A.seats - A.users.filter(u => u.status !== 'Deactivated').length} seat${A.seats - A.users.filter(u => u.status !== 'Deactivated').length === 1 ? '' : 's'} left</span></div>${ed ? `<button class="btn pri" data-a="uinvopen">${IC.plus}Invite user</button>` : ''}</div><div class="tw"><table class="t"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>MFA</th><th>Last active</th><th>Status</th><th></th></tr></thead><tbody>${A.users.map(u => `<tr><td><b>${esc(u.name)}</b></td><td class="mono sub">${esc(u.email)}</td><td>${ed ? `<select id="ur-${u.id}" data-c="urole" data-id="${u.id}" style="width:auto" aria-label="Role for ${esc(u.name)}">${roles.map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${esc(ROLES[r].title)}</option>`).join('')}</select>` : esc(ROLES[u.role].title)}</td><td>${u.mfa ? '<span class="chip ok">On</span>' : '<span class="chip warn">Not set up</span>'}</td><td class="sub">${esc(u.last)}</td><td><span class="chip ${u.status === 'Active' ? 'ok' : u.status === 'Invited' ? 'info' : ''}">${u.status}</span></td><td style="white-space:nowrap">${ed ? (u.status === 'Deactivated' ? `<button class="btn sm" data-a="ustat" data-id="${u.id}" data-v="Active">Reactivate</button>` : `${u.status === 'Invited' ? `<button class="btn sm ghost" data-a="ustat" data-id="${u.id}" data-v="Invited">Resend invite</button>` : ''}${u.role !== 'admin' ? `<button class="btn sm ghost" data-a="ustat" data-id="${u.id}" data-v="Deactivated">Deactivate</button>` : ''}${!u.mfa ? `<button class="btn sm ghost" data-a="umfa" data-id="${u.id}">Reset MFA</button>` : ''}`) : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
  if (T.cur === 'perm') x = `<div class="panel"><div class="ph"><h3>Edit rights by role</h3><span class="sub">Everyone can view every screen except envelope B prices. ${ed ? 'Tick to grant; changes apply immediately.' : ''}</span></div><div class="tw"><table class="t permtab"><thead><tr><th>Area</th>${roles.map(r => `<th class="${r === S.role ? 'me' : ''}" title="${esc(ROLES[r].name)}">${esc(ROLES[r].title.replace(' Lead', '').replace(' Manager', ' Mgr').replace('QA/QC & HSE Mgr', 'QHSE'))}</th>`).join('')}</tr></thead><tbody>${Object.entries(PERM).map(([k, p]) => `<tr><td>${esc(p.l)}${JSON.stringify(p.r.slice().sort()) !== JSON.stringify((DEF_PERM[k] || []).slice().sort()) ? ' <span class="chip warn">changed</span>' : ''}</td>${roles.map(r => `<td class="${r === S.role ? 'me' : ''}">${ed && !(k === 'admin' && r === 'admin') ? `<input type="checkbox" data-c="permset" data-k="${k}" data-r="${r}" ${p.r.includes(r) ? 'checked' : ''} aria-label="${esc(ROLES[r].title)}: ${esc(p.l)}" style="accent-color:var(--pack)">` : p.r.includes(r) ? '<span style="color:var(--ok);font-weight:600">✓</span>' : '<span class="muted">·</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${ed ? '<div class="pb"><button class="btn sm" data-a="permreset">Restore pack defaults</button></div>' : ''}</div>`;
  /* The matrix used to spread all fifteen roles across the page, so a reader
     scanned a wall of mostly-empty cells to find the three that matter. Each
     gate is now a row that says in words who signs it, with the ticks kept
     behind "Change who signs" for the roles that actually appear. */
  if (T.cur === 'appr') {
    const signing = roles.filter(r => Object.values(GATES).some(G => G.roles.includes(r)));
    const showAll = !!S.ui.apprAll, cols = showAll ? roles : signing;
    const ttl = r => ROLES[r].title.replace(' Lead', '').replace(' Manager', ' Mgr').replace('QA/QC & HSE Mgr', 'QHSE');
    x = `<section class="panel"><div class="ph"><div><h3>Who signs each gate</h3><span class="sub">Every role listed must sign before the gate passes. A gate with nobody behind it cannot be signed at all.</span></div>
       ${ed ? `<button class="btn sm ${S.ui.apprEdit ? 'pri' : ''}" data-a="appredit">${S.ui.apprEdit ? 'Done' : 'Change who signs'}</button>` : ''}</div>
      <div class="pb"><ul class="agate">${Object.entries(GATES).map(([g, G]) => {
      const held = G.roles.filter(r => A.users.some(u => u.role === r && u.status !== 'Deactivated'));
      const gap = G.roles.length - held.length;
      return `<li><span class="gchip pend">${g}</span>
          <div class="agate-tx"><b>${esc(G.name)}</b><span class="sub">Stage ${G.stage}</span></div>
          <div class="agate-who">${G.roles.length ? G.roles.map(r => `<span class="agate-r" title="${esc(ROLES[r].name)}"><i>${esc(ROLES[r].ini)}</i>${esc(ttl(r))}</span>`).join('') : '<span class="chip bad">Nobody signs this</span>'}</div>
          ${gap ? `<span class="chip warn">${gap} seat${gap === 1 ? '' : 's'} vacant</span>` : `<span class="chip ok">Covered</span>`}</li>`;
    }).join('')}</ul></div>
      ${ed && S.ui.apprEdit ? `<div class="tw"><table class="t permtab"><thead><tr><th>Gate</th>${cols.map(r => `<th title="${esc(ROLES[r].name)}">${esc(ttl(r))}</th>`).join('')}</tr></thead><tbody>${Object.entries(GATES).map(([g, G]) => `<tr><td><span class="gchip pend">${g}</span> ${esc(G.name)}</td>${cols.map(r => `<td><input type="checkbox" data-c="gateset" data-g="${g}" data-r="${r}" ${G.roles.includes(r) ? 'checked' : ''} aria-label="${g} ${esc(ROLES[r].title)}" style="accent-color:var(--brand)"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="pb row between"><span class="sub">${showAll ? `All ${roles.length} roles` : `${signing.length} roles that sign today`}</span><button class="btn sm ghost" data-a="apprall">${showAll ? 'Show only roles that sign' : `Show all ${roles.length} roles`}</button></div>` : ''}
    </section>
    <div class="panel"><div class="ph"><h3>Delegation of authority</h3></div><div class="pb stack">${[['g1limit', 'G1: Managing Director signs bids above (₹ Cr)'], ['g2limit', 'G2: Managing Director signs prices above (₹ Cr)']].map(([k, l]) => `<div class="row between"><span>${l}</span>${ed ? `<input type="number" id="ad-${k}" data-c="adset" data-k="${k}" value="${A[k]}" style="width:120px">` : `<b class="mono">${A[k]}</b>`}</div>`).join('')}<p class="sub">Below these values the BD head (G1) or commercial manager (G2) signs alone. Current tenders: ${liveOpps().map(o => `${esc(o.meta.name)} ₹${fmtN(o.meta.value)} Cr → ${num(o.meta.value) > A.g2limit ? 'MD signs G2' : 'commercial signs G2'}`).join('; ')}.</p></div></div>`;
  }
  if (T.cur === 'pack') x = `<div class="note pk"><div>${IC.layers} Each client sees only its own pack. Hidden items are removed from menus, search and reports. Switch an <b>Optional</b> item on for your own projects here. Your tenant: <b>Water & Wastewater</b>.</div></div>
    <div class="panel"><div class="ph"><h3>Visibility map (default per pack + your overrides)</h3></div><div class="tw"><table class="t"><thead><tr><th>Stage / tab</th><th>Data centre</th><th>Water & wastewater</th><th>Electrical & modular</th><th>Your tenant</th></tr></thead><tbody>${PACK_ITEMS.map(p => { const c = v => `<span style="font-weight:600;color:${v === 'Shown' ? 'var(--ok)' : v === 'Optional' ? 'var(--warn)' : 'var(--muted)'}">${v}</span>`; const ww = p[2], onv = A.vis[p[0]]; return `<tr><td>${esc(p[0])}</td><td>${c(p[1])}</td><td>${c(p[2])}</td><td>${c(p[3])}</td><td>${ww === 'Optional' ? (ed ? `<button class="btn sm ${onv ? 'ok' : ''}" data-a="vis" data-k="${esc(p[0])}">${onv ? 'On · switch off' : 'Switch on'}</button>` : onv ? '<span class="chip ok">On</span>' : '<span class="chip">Off</span>') : `<span class="sub">${ww} by pack</span>`}</td></tr>`; }).join('')}</tbody></table></div></div>
    <div class="panel"><div class="ph"><h3>What each pack changes on shared screens</h3></div><div class="tw"><table class="t"><thead><tr><th>Element</th><th>Data centre</th><th>Water & wastewater</th><th>Electrical & modular</th></tr></thead><tbody>${[['Capture header', 'MW, facility type, tier', 'MLD, plant type, O&M years', 'MVA/kVA, modules'], ['Pre-qualification depth', 'Standard', 'Extended: similar works by value and date, JV shares, solvency', 'Type tests and OEM authorisations'], ['Sizing calculator', 'Power and cooling blocks', 'Process and hydraulics', 'Single-line → panels and modules'], ['Commissioning tracker', 'L1–L5 with integrated systems test', 'Hydraulic tests → trial run → PG test', 'FAT → SAT → energisation'], ['Certification file', 'Uptime TCDD / TCCF', 'Statutory consents and discharge approvals', 'Type-test certificates'], ['Asset data at handover', 'COBie', 'Asset register for O&M', 'Module dossier']].map(r => `<tr>${r.map((v, i) => `<td>${i ? esc(v) : `<b>${esc(v)}</b>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
  /* The governance tab used to open with four metric cards and then repeat the
     gold set as a table under the same numbers charted above it. The facts now
     sit in one strip, the gold set is stated once, and the two things an admin
     actually sets — egress and retention — come first. */
  if (T.cur === 'ai') x = `${strip([['Egress policy', esc(A.egress), 'nothing leaves the tenant', 'ok'], ['Model runs', '14,820', 'this month'], ['Accepted with light edits', '64%', 'target ≥ 60%', 'ok'], ['Retention', A.retention + ' days', 'prompts and outputs']])}
    ${(() => { const G = [['Mandatory requirement recall', 96.2, 95], ['Citations that resolve', 100, 100], ['Pages with a final state', 100, 100], ['Takeoff count accuracy', 97.1, 95], ['Title-block field accuracy', 99.1, 98]];
      return `<section class="panel"><div class="ph"><div><h3>Release gates on the gold set</h3><span class="sub">The bar is the current model; the dark tick is the threshold it must clear before release</span></div><span class="chip ${G.every(g => g[1] >= g[2]) ? 'ok' : 'warn'}">${G.filter(g => g[1] >= g[2]).length} of ${G.length} pass</span></div><div class="pb">${chart({ type: 'hbar', min: 90, max: 100, unit: '%', gate: true, labelW: 200, data: G.map(g => ({ k: g[0], v: g[1], g: g[2], c: g[1] >= g[2] ? '--brand-solid' : '--danger-fg' })) }, 230, 'Release gates: ' + G.map(g => `${g[0]} ${g[1]}% against ${g[2]}%`).join('; '))}</div></section>`; })()}
    <div class="panel"><div class="ph"><div><h3>Policy</h3><span class="sub">What the models may reach, and how long anything is kept</span></div></div><div class="pb stack">${ed ? `<div class="aform">${`<label class="fld" for="ad-egress">Network egress<select id="ad-egress" data-c="adset" data-k="egress">${['Default-deny', 'Allow-list (licensed indices only)'].map(r => `<option ${r === A.egress ? 'selected' : ''}>${r}</option>`).join('')}</select></label><label class="fld" for="ad-ret">Keep prompts and outputs for (days)<input type="number" id="ad-ret" data-c="adset" data-k="retention" value="${A.retention}"></label>`}</div>` : `<dl class="kv"><dt>Egress</dt><dd>${esc(A.egress)}</dd><dt>Retention</dt><dd>${A.retention} days</dd></dl>`}<div class="note"><div>Agents act with the signed-in user's permissions and can never approve a section or sign a gate.</div></div></div></div>
    <div class="panel"><div class="ph"><h3>Agents</h3></div><div class="tw"><table class="t"><thead><tr><th>Agent</th><th>Enabled</th><th>Review mode</th><th class="num">Gold-set accuracy</th></tr></thead><tbody>${AGENTS.map(a => { const s = A.agents[a[0]] || { on: true, mode: 'Human review required' }, guard = a[0] === 'Envelope guard'; return `<tr><td><b>${a[0]}</b><div class="sub">${esc(a[1])}</div></td><td>${ed && !guard ? `<input type="checkbox" data-c="agon" data-k="${esc(a[0])}" ${s.on ? 'checked' : ''} aria-label="Enable ${esc(a[0])}" style="accent-color:var(--pack);width:16px;height:16px">` : s.on ? '<span class="chip ok">On</span>' : '<span class="chip">Off</span>'}${guard ? ' <span class="sub">always on</span>' : ''}</td><td>${ed && !guard ? `<select data-c="agmode" data-k="${esc(a[0])}" style="width:auto" aria-label="Review mode">${['Human review required', 'Auto-accept high evidence only'].map(m => `<option ${m === s.mode ? 'selected' : ''}>${m}</option>`).join('')}</select>` : esc(guard ? 'Cannot be overridden' : s.mode)}</td><td class="num mono">${a[5]}%</td></tr>`; }).join('')}</tbody></table></div></div>
    <div class="panel"><div class="ph"><h3>Model registry</h3></div><div class="tw"><table class="t"><thead><tr><th>Model</th><th>Used for</th><th>Version</th><th>Hosted on</th><th>Status</th></tr></thead><tbody>${MODELS.map(m => `<tr><td class="mono">${m[0]}</td><td>${m[1]}</td><td class="mono">${m[2]}</td><td>${m[3]}</td><td>${m[4] === 'Active' ? '<span class="chip ok">Active</span>' : `<span class="chip ai">${m[4]}</span>${ed ? ' <button class="btn sm" data-a="toast" data-msg="Promotion requires every release gate to pass on the new adapter. Evaluation run queued.">Evaluate for promotion</button>' : ''}`}</td></tr>`).join('')}</tbody></table></div></div>`;
  if (T.cur === 'credits') x = creditsTab(A, ed);
  if (T.cur === 'integ') x = integTab(A, ed);
  /* The log is the page, so the controls belong in its header rather than
     floating above it on a bare row. */
  if (T.cur === 'audit') {
    const q = (S.ui.aq || '').toLowerCase(), who = S.ui.aw || 'all';
    const rows = S.audit.filter(a => (who === 'all' || a[1] === who) && (!q || a.join(' ').toLowerCase().includes(q)));
    const people = [...new Set(S.audit.map(a => a[1]))];
    x = `<section class="panel"><div class="ph aud-h">
       <div><h3>Audit log</h3><span class="sub">${rows.length} of ${S.audit.length} entries · append-only, hash-chained</span></div>
       <div class="aud-ctl"><input type="search" id="aq" data-i="aq" value="${esc(S.ui.aq || '')}" placeholder="Search the log" aria-label="Search the audit log">
         <select id="aw" data-c="aw" aria-label="Filter by person"><option value="all">Everyone</option>${people.map(w => `<option ${who === w ? 'selected' : ''}>${esc(w)}</option>`).join('')}</select>
         <button class="btn sm" data-a="toast" data-msg="Export is simulated: signed CSV of ${rows.length} entries with SHA-256 chain.">${IC.dl}Export</button></div></div>
      <div class="tw"><table class="t"><thead><tr><th style="width:150px">When</th><th style="width:190px">Who</th><th>What</th></tr></thead><tbody>${rows.slice(0, 200).map(a => `<tr><td class="mono sub" style="white-space:nowrap">${esc(a[0])}</td><td>${esc(a[1])}</td><td>${esc(a[2])}</td></tr>`).join('') || '<tr><td colspan="3" class="sub">No entries match.</td></tr>'}</tbody></table></div>
      ${rows.length > 200 ? `<div class="pb"><span class="sub">Showing the most recent 200. Narrow with search or export the full log.</span></div>` : ''}</section>`;
  }
  const noMfa = A.users.filter(u => u.status !== 'Deactivated' && !u.mfa), active = A.users.filter(u => u.status !== 'Deactivated').length;
  const changed = Object.entries(PERM).filter(([k, p]) => JSON.stringify(p.r.slice().sort()) !== JSON.stringify((DEF_PERM[k] || []).slice().sort()));
  const offAgents = AGENTS.filter(a => A.agents[a[0]] && !A.agents[a[0]].on);
  const unlinked = Object.entries(A.integ).filter(([, v]) => !v);
  const issues = [
    noMfa.length && ['high', `${noMfa.length} user${noMfa.length > 1 ? 's have' : ' has'} no MFA`, `MFA policy is “${A.mfa}”. ${noMfa.map(u => u.name).slice(0, 3).join(', ')}${noMfa.length > 3 ? ' and others' : ''}.`, 'users'],
    active > A.seats && ['high', `${active} active users against ${A.seats} seats`, 'Deactivate someone or raise the licence before the next invite.', 'tenant'],
    active > A.seats * 0.9 && active <= A.seats && ['medium', `${A.seats - active} seat${A.seats - active === 1 ? '' : 's'} left`, 'Close to the licence limit.', 'tenant'],
    changed.length && ['medium', `${changed.length} permission${changed.length > 1 ? 's differ' : ' differs'} from the pack default`, changed.map(c => c[1].l).slice(0, 3).join(', ') + '.', 'perm'],
    offAgents.length && ['medium', `${offAgents.length} agent${offAgents.length > 1 ? 's are' : ' is'} switched off`, offAgents.map(a => a[0]).join(', ') + '. Their step falls back to manual work.', 'ai'],
    unlinked.length && ['low', `${unlinked.length} integration${unlinked.length > 1 ? 's are' : ' is'} not connected`, unlinked.map(u => u[0]).slice(0, 3).join(', ') + '.', 'integ']
  ].filter(Boolean);
  const postureTone = issues.some(i => i[0] === 'high') ? 'bad' : issues.length ? 'warn' : 'ok';
  const posture = issues.some(i => i[0] === 'high') ? 'Attention' : issues.length ? 'Settled' : 'All clear';
  const head = `<div class="tiles">${kpi('Posture', posture, `${issues.length} open item${issues.length === 1 ? '' : 's'}`, postureTone)}${kpi('Seats used', `${active} / ${A.seats}`, esc(S.cfg.company), active > A.seats ? 'bad' : '')}${kpi('Sign-in', A.sso ? 'SSO + MFA' : 'Password + MFA', esc(A.mfa))}${kpi('Data region', esc(A.region.replace(/^(.*) \((.*)\)$/, '$2')), esc(A.region.replace(/ \(.*$/, '')) + ' · ' + esc(A.egress) + ' egress', 'ok')}</div>
   ${issues.length ? `<div class="panel"><div class="ph"><div><h3>What needs attention</h3><span class="sub">Read from this tenant's own settings, not a checklist</span></div></div><div class="pb flush">${issues.map(i => `<div class="flag"><div class="sev ${i[0] === 'high' ? 'high' : i[0] === 'medium' ? 'medium' : 'ai'}"></div><div class="body"><b style="font-size:13.5px">${esc(i[1])}</b><span class="sub">${esc(i[2])}</span></div><button class="btn sm" data-a="sub" data-t="admin" data-v="${i[3]}">Open →</button></div>`).join('')}</div></div>` : `<div class="note ok"><div>Nothing outstanding: every active user has MFA, permissions match the pack default, and every agent is on.</div></div>`}`;
  if (adminLayout() === 'b') return adminB({ A, ed, T, x, issues, active, noMfa, lock });
  return `${sh('Admin · ' + esc(S.cfg.company), 'Admin console', 'Tenant settings, users and roles, edit rights, who signs each gate, pack visibility, AI governance, integrations and the audit log.', layoutSwitch())}${lock}${head}${T.html}${x}`;
}

/* ---------------- Admin console, layout B ----------------
   Same data and tabs as layout A; a calmer header (hero, four icon cards,
   tinted issue cards) and charts where a table was doing a chart's job. */
const adminLayout = () => S.ui.adminLayout || 'b';
const layoutSwitch = () => `<div class="seg alay" role="group" aria-label="Admin layout">${[['a', 'Layout A'], ['b', 'Layout B']].map(([k, l]) => `<button class="${adminLayout() === k ? 'on' : ''}" data-a="adlay" data-v="${k}" aria-pressed="${adminLayout() === k}">${l}</button>`).join('')}</div>`;
const AIC = {
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4.5 6v5.6c0 4.4 3.1 8.2 7.5 9.4 4.4-1.2 7.5-5 7.5-9.4V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5"/><path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.2 2.6 3.5 5.2"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.3-8.3M17 6l2.5 2.5M14.5 8.5 16.5 10.5"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19.5 8.5a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
};
const chart = (spec, h, label) => `<div class="chartbox" style="height:${h}px" data-chart='${JSON.stringify(spec).replace(/'/g, '&#39;')}' role="img" aria-label="${esc(label)}"></div>`;
const heroArt = () => `<svg class="ahero-svg" viewBox="0 0 360 220" aria-hidden="true">
  <defs>
    <linearGradient id="hg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--ai-lime)" stop-opacity=".95"/><stop offset="1" stop-color="var(--brand-solid)" stop-opacity=".9"/></linearGradient>
    <linearGradient id="hg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--ai-lime)" stop-opacity=".45"/><stop offset="1" stop-color="var(--ai-teal)" stop-opacity=".35"/></linearGradient>
    <linearGradient id="hg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity=".15"/></linearGradient>
    <filter id="hblur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <ellipse cx="200" cy="190" rx="130" ry="18" fill="var(--brand-solid)" opacity=".14" filter="url(#hblur)"/>
  <circle cx="250" cy="70" r="60" fill="var(--ai-lime)" opacity=".28" filter="url(#hblur)"/>
  <g transform="translate(200 150) skewY(-12)">
    <rect x="-120" y="-10" width="200" height="34" rx="12" fill="url(#hg2)" stroke="url(#hg3)"/>
    <rect x="-100" y="-46" width="200" height="34" rx="12" fill="url(#hg2)" stroke="url(#hg3)" opacity=".9"/>
    <rect x="-80" y="-120" width="190" height="66" rx="14" fill="url(#hg1)" stroke="url(#hg3)"/>
    <rect x="-64" y="-104" width="70" height="8" rx="4" fill="#fff" opacity=".7"/>
    <rect x="-64" y="-88" width="110" height="6" rx="3" fill="#fff" opacity=".4"/>
    <rect x="-64" y="-76" width="90" height="6" rx="3" fill="#fff" opacity=".4"/>
  </g>
  <g transform="translate(258 40)">
    <path d="M0 0 -22 9v17c0 13 9 24 22 28 13-4 22-15 22-28V9z" fill="url(#hg1)" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/>
    <path d="m-8 26 6 6 11-12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <circle cx="96" cy="58" r="4" fill="var(--ai-teal)" opacity=".7"/><circle cx="330" cy="120" r="3" fill="var(--ai-lime)"/><circle cx="120" cy="28" r="2.5" fill="var(--brand-solid)" opacity=".5"/>
</svg>`;

function adminB({ A, ed, T, x, issues, active, noMfa, lock }) {
  const sev = k => issues.filter(i => i[0] === k).length, hi = sev('high'), md = sev('medium'), lo = sev('low');
  const tone = hi ? 'bad' : issues.length ? 'warn' : 'ok';
  const nAct = issues.filter(i => i[0] !== 'low').length;
  const bars = [['high', hi], ['medium', md], ['low', lo]], mx = Math.max(1, hi, md, lo);
  const pct = Math.min(100, Math.round(active / A.seats * 100));
  const city = A.region.replace(/^(.*) \((.*)\)$/, '$2'), country = A.region.replace(/ \(.*$/, '');
  const card = (ic, cls, l, v, d, go, viz) => `<article class="akpi ${cls}"><div class="akpi-h"><span class="akpi-ic">${ic}</span><span class="akpi-l">${l}</span><button class="akpi-go" ${go === '@att' ? 'data-a="adattshow"' : `data-a="sub" data-t="admin" data-v="${go}"`} aria-label="${go === '@att' ? 'Show what needs attention' : 'Open ' + l}">${AIC.next}</button></div><div class="akpi-v">${v}</div><div class="akpi-f"><span class="akpi-d">${d}</span>${viz || ''}</div></article>`;
  const kpis = `<div class="akpis">
    ${card(AIC.shield, tone, 'Posture', hi ? 'Attention' : issues.length ? 'Settled' : 'All clear', nAct ? `${nAct} item${nAct === 1 ? '' : 's'} need${nAct === 1 ? 's' : ''} action` : issues.length ? 'Only low items open' : 'Nothing outstanding', S.ui.adAttnHide && issues.length ? '@att' : issues[0] ? issues[0][3] : 'tenant', `<span class="minibars" role="img" aria-label="${hi} high, ${md} medium, ${lo} low">${bars.map(([k, n]) => `<i class="${k}" style="height:${Math.round(6 + n / mx * 22)}px"></i>`).join('')}</span>`)}
    ${card(AIC.users, active > A.seats ? 'bad' : '', 'Seats used', `${active} <small>/ ${A.seats}</small>`, `${Math.max(0, A.seats - active)} available`, 'users', `<span class="meter" role="img" aria-label="${pct}% of seats in use"><i style="width:${pct}%"></i></span>`)}
    ${card(AIC.key, '', 'Sign-in', A.sso ? 'SSO + MFA' : 'Password + MFA', esc(A.mfa), 'tenant')}
    ${card(AIC.globe, '', 'Data region', esc(city), `${esc(country)} · ${esc(A.egress)} egress`, 'ai')}
  </div>`;
  const all = S.ui.adIssAll, shown = all ? issues : issues.slice(0, 3);
  const iss = S.ui.adAttnHide ? '' : issues.length ? `<section class="panel aatt"><div class="ph"><div><h3>What needs attention</h3><span class="sub">Read from this tenant's own settings</span></div><div class="row" style="gap:var(--space-4)">${issues.length > 3 ? `<button class="btn sm ghost" data-a="adissall">${all ? 'Show fewer' : `View all ${issues.length} →`}</button>` : ''}<button class="aatt-x" data-a="adatthide" aria-label="Close what needs attention" title="Close">${IC.x}</button></div></div><div class="aiss-grid">${shown.map(i => `<article class="aiss ${i[0]}"><span class="aiss-ic">${i[0] === 'high' ? '!' : i[0] === 'medium' ? AIC.warn : AIC.info}</span><div class="aiss-tx"><h4>${esc(i[1])}</h4><p>${esc(i[2])}</p></div><button class="aiss-go" data-a="sub" data-t="admin" data-v="${i[3]}">Open →</button></article>`).join('')}</div></section>` : `<div class="note ok"><div>Nothing outstanding: every active user has MFA, permissions match the pack default, and every agent is on.</div></div>`;
  let body = x;
  if (T.cur === 'tenant') {
    const co = S.cfg.company || 'Tenant', ini = co.split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const manage = S.ui.adLic && ed;
    body = `<div class="agrid2">
      <section class="panel acard2"><div class="ph"><h3>Tenant details</h3>${ed ? `<button class="btn sm" data-a="wizard">${AIC.edit}Edit</button>` : ''}</div><div class="pb">
        <div class="aten"><span class="aten-av">${esc(ini)}</span><div><b>${esc(co)}</b><span class="sub">Water & Wastewater pack v2.0 · Enterprise</span></div></div>
        <dl class="akv">${[['Company', esc(co)], ['Head office', esc(S.cfg.hq)], ['Industry', 'Water & wastewater EPC'], ['Data region', esc(A.region)], ['Environment', '<span class="chip ok">Production</span>'], ['Created on', '12 Jan 2024'], ['Reporting currency', esc(S.cfg.currency)], ['Tenant ID', `<span class="mono">${esc(S.auth ? S.auth.tenant : 'tn-narmada-ww-0042')}</span>`]].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      </div></section>
      <section class="panel acard2"><div class="ph"><h3>Licence and security</h3>${ed ? `<button class="btn sm ${manage ? 'pri' : ''}" data-a="adlic">${manage ? 'Done' : 'Manage'}</button>` : ''}</div><div class="pb stack">
        <div class="astats">${[[A.seats, 'Licensed seats', 'Total seats'], [active, 'In use', `${pct}% of licence`], [Math.max(0, A.seats - active), 'Available', 'Ready to invite']].map(([v, l, d], i) => `<div class="astat ${i === 2 ? 'brand' : ''}"><span class="l">${l}</span><span class="v">${v}</span><span class="d">${d}</span></div>`).join('')}</div>
        ${manage ? `<div class="aform"><label class="fld" for="ad-seats">Licensed seats<input type="number" id="ad-seats" data-c="adset" data-k="seats" value="${A.seats}"></label><label class="fld" for="ad-region">Data region<select id="ad-region" data-c="adset" data-k="region">${['India (Mumbai)', 'India (Hyderabad)', 'UAE (Dubai)', 'On-premise only'].map(r => `<option ${r === A.region ? 'selected' : ''}>${r}</option>`).join('')}</select></label><label class="fld" for="ad-mfa">Multi-factor authentication<select id="ad-mfa" data-c="adset" data-k="mfa">${['Required for all users', 'Required for approvers', 'Optional'].map(r => `<option ${r === A.mfa ? 'selected' : ''}>${r}</option>`).join('')}</select></label><label class="chk" for="ad-sso"><input type="checkbox" id="ad-sso" data-c="adchk" data-k="sso" ${A.sso ? 'checked' : ''}><span>Single sign-on through Azure AD (SAML)</span></label></div>`
        : `<div class="arows">${[[AIC.key, 'Authentication', `${A.sso ? 'SSO + MFA' : 'Password + MFA'} <span class="sub">(${esc(A.mfa)})</span>`], [AIC.globe, 'Data residency', `${esc(A.region)} <span class="sub">· ${esc(A.egress)} egress</span>`], [AIC.shield, 'MFA coverage', `${active - noMfa.length} of ${active} users${noMfa.length ? ` <span class="chip warn">${noMfa.length} missing</span>` : ' <span class="chip ok">Complete</span>'}`]].map(([ic, l, v]) => `<div class="arow"><span class="arow-ic">${ic}</span><div><span class="l">${l}</span><span class="v">${v}</span></div>${ed ? '<button class="btn sm ghost" data-a="adlic">Manage</button>' : ''}</div>`).join('')}</div>`}
      </div></section></div>`;
  }
  if (T.cur === 'users') {
    const st = k => A.users.filter(u => u.status === k).length, live = A.users.filter(u => u.status !== 'Deactivated');
    /* No donut here. A donut of "15 active, 0 invited, 0 deactivated" draws a
       complete circle and tells nobody anything, and 93% MFA is a sentence,
       not a chart. What an admin can act on is who is missing a second factor,
       which gate signatures have nobody behind them, and who has gone quiet. */
    const nm = live.filter(u => !u.mfa), stale = live.filter(u => /days? ago/i.test(u.last));
    const held = new Set(live.map(u => u.role));
    const gaps = [...new Set(Object.values(GATES).flatMap(g => g.roles))].filter(r => !held.has(r));
    const nameList = us => us.map(u => esc(u.name)).join(', ');
    const todo = [];
    if (nm.length) todo.push(`${nameList(nm)} ${nm.length > 1 ? 'have' : 'has'} no second factor, against a tenant policy of <b>${esc(A.mfa)}</b>.`);
    if (gaps.length) todo.push(`No active user holds ${gaps.map(r => `<b>${esc((ROLES[r] || {}).title || r)}</b>`).join(' or ')} — a gate that needs that signature cannot be signed.`);
    if (stale.length) todo.push(`${stale.length === 1 ? 'One seat has' : `${stale.length} seats have`} been idle two days or more: ${nameList(stale)}.`);
    body = `<section class="panel"><div class="ph"><div><h3>Access health</h3><span class="sub">Read from this tenant's own users — only what someone would act on</span></div>
        <span class="chip ${todo.length ? 'warn' : 'ok'}">${todo.length ? `${todo.length} to look at` : 'All clear'}</span></div>
      <div class="pb stack">
        ${strip([['Seats in use', `${live.length} of ${A.seats}`, `${Math.max(0, A.seats - live.length)} left to invite`],
      ['Without MFA', nm.length, nm.length ? 'policy not met' : 'every active user covered', nm.length ? 'warn' : ''],
      ['Gate roles covered', `${[...new Set(Object.values(GATES).flatMap(g => g.roles))].length - gaps.length} of ${[...new Set(Object.values(GATES).flatMap(g => g.roles))].length}`, gaps.length ? 'a signature has nobody behind it' : 'every gate can be signed', gaps.length ? 'warn' : ''],
      ['Invited, not joined', st('Invited'), st('Invited') ? 'awaiting first sign-in' : 'nothing pending']])}
        ${todo.length ? `<ul class="an-list">${todo.map(t => `<li>${t}</li>`).join('')}</ul>`
        : `<div class="note ok"><div>Every active user has a second factor, every gate role is held by someone, and no seat has gone quiet.</div></div>`}
      </div></section>${x}`;
  }
  /* AI governance and the audit log are defined once above, so both layouts
     show the same page rather than one stacking a chart on top of the other. */
  if (T.cur === 'audit' && new Set(S.audit.map(a => a[1])).size >= 2) {
    const by = {}; S.audit.forEach(a => { by[a[1]] = (by[a[1]] || 0) + 1; });
    const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const spread = top.length > 1 ? `${top[0][0]} made ${Math.round(top[0][1] / S.audit.length * 100)}% of the ${S.audit.length} recorded changes.` : '';
    body = `<section class="panel"><div class="ph"><div><h3>Changes by person</h3><span class="sub">${esc(spread)}</span></div><span class="chip">${Object.keys(by).length} people</span></div><div class="pb">${chart({ type: 'col', data: top.map(([k, v]) => ({ k: k.split(' ')[0], v })) }, 170, 'Audit entries by person: ' + top.map(([k, v]) => `${k} ${v}`).join(', '))}</div></section>${x}`;
  }
  return `<section class="ahero"><div class="ahero-tx"><span class="eyebrow">Admin · ${esc(S.cfg.company)}</span><h1>Admin console</h1><p>Manage your tenant settings, users, security, integrations and platform governance.</p></div><div class="ahero-art">${heroArt()}<div class="ahero-note"><span class="ahero-dot">${AIC.shield}</span><div><b>Your workspace</b><span>Secure. Controlled. AI-powered.</span></div></div></div></section>${lock}${kpis}${iss}<div class="atabs">${T.html}${layoutSwitch()}</div>${body}`;
}

/* ---------------- Reports & analytics ---------------- */
const HIST = {
  12: { won: 10, lostPrice: 14, dq: 3, nobid: 7, margin: 7.2, estVar: 3.9, gap: 1.8, cycle: [['Capture → G1', 2.4, 2], ['G1 → G2 (engineering, pricing)', 19, 16], ['G2 → G3 (proposal)', 6, 5], ['Submission → award', 64, 60]], byType: [['Sewage treatment', 13, 5], ['Drinking-water treatment', 9, 3], ['Industrial effluent', 6, 1], ['Pumping & conveyance', 4, 1], ['Desalination', 1, 0]], byBand: [['< ₹250 Cr', 9, 4], ['₹250–750 Cr', 13, 4], ['₹750–1,500 Cr', 8, 2], ['> ₹1,500 Cr', 4, 0]], loss: [['Price (L2/L3)', 14], ['Technical disqualification', 3], ['O&M NPV higher', 4], ['Late or incomplete submission', 1]], comp: [['Vishwa Aqua Infra', 9, 4, '−1.6%'], ['Ganga Enviro JV', 6, 2, '+2.1%'], ['Deccan Hydro Projects', 5, 1, '+0.8%']] },
  24: { won: 19, lostPrice: 25, dq: 5, nobid: 12, margin: 7.6, estVar: 4.6, gap: 2.1, cycle: [['Capture → G1', 4.8, 2], ['G1 → G2 (engineering, pricing)', 22, 16], ['G2 → G3 (proposal)', 7, 5], ['Submission → award', 71, 60]], byType: [['Sewage treatment', 24, 9], ['Drinking-water treatment', 17, 6], ['Industrial effluent', 11, 3], ['Pumping & conveyance', 8, 1], ['Desalination', 1, 0]], byBand: [['< ₹250 Cr', 17, 8], ['₹250–750 Cr', 24, 7], ['₹750–1,500 Cr', 14, 4], ['> ₹1,500 Cr', 6, 0]], loss: [['Price (L2/L3)', 25], ['Technical disqualification', 5], ['O&M NPV higher', 7], ['Late or incomplete submission', 2]], comp: [['Vishwa Aqua Infra', 17, 7, '−1.4%'], ['Ganga Enviro JV', 11, 4, '+1.9%'], ['Deccan Hydro Projects', 9, 2, '+0.6%']] }
};
function insights(H) {
  const out = [], live = liveOpps();
  live.forEach(o => {
    const d = daysTo(o.meta.submission), pr = o.prop, notAppr = pr ? pr.tree.filter(s => s.st !== 'approved').length : 0;
    if (o.pos <= 8 && d <= 45 && notAppr) out.push(['high', `${o.meta.name}: ${notAppr} proposal sections not approved, ${d} days to submission`, 'Assign owners and push sections into review this week.', 'pown', o.meta.id]);
    const oc = o.clars.filter(c => c.status !== 'answered'); if (o.pos <= 8 && oc.length) out.push(['medium', `${o.meta.name}: ${oc.length} clarifications unanswered`, `Chase by email; ${oc.filter(c => c.status === 'draft').length} are still drafts.`, 'clar', o.meta.id]);
    const late = o.longlead.filter(l => llFloat(l) < 0); if (late.length) out.push(['high', `${o.meta.name}: ${late.map(l => l.item).join(', ')} arrive late`, 'Pre-order at LoA or offer as owner-furnished equipment.', 'proc', o.meta.id]);
    const hr = o.risks.filter(r => r.l * r.i >= 16 && r.treat !== 'Price'); if (hr.length) out.push(['medium', `${o.meta.name}: ${hr.length} high risks not priced (${cr(hr.reduce((a, r) => a + expo(r), 0))} exposure)`, 'Price them or close them through clarification before G2.', 'risks', o.meta.id]);
    o.bgs.filter(b => b.st !== 'Released' && daysTo(b.exp) < 60).forEach(b => out.push(['high', `${o.meta.name}: ${b.type} expires in ${daysTo(b.exp)} days`, 'Request extension from the bank now.', 'cadmin', o.meta.id]));
    o.claims.filter(c => !/submitted|agreed|rejected|disputed/i.test(c.st)).forEach(c => { const dl = Math.round((new Date(c.notice).getTime() + 42 * 864e5 - TODAY) / 864e5); if (dl < 15) out.push(['high', `${o.meta.name}: claim ${c.id} particulars due in ${dl} days`, 'File particulars with the IE before the time bar.', 'cadmin', o.meta.id]); });
  });
  out.push(['ai', `Lost on price ${H.lostPrice} of the ${H.lostPrice + H.won} bids that reached a price, by ${H.gap}% on average`, 'Test the value-engineered scenario on bids above ₹750 Cr, where win rate is lowest.', 'est', OPP.id]);
  out.push(['ai', `Estimate overrun +${H.estVar}% on delivered projects, mostly trunk sewers`, 'Update the rock and pipe-laying norms in the rate library from bid vs actual.', 'est', OPP.id]);
  out.push(['ai', `${H.byType[0][0]} wins ${Math.round(H.byType[0][2] / H.byType[0][1] * 100)}%; desalination ${H.byType.find(t => t[0] === 'Desalination')[2]} of ${H.byType.find(t => t[0] === 'Desalination')[1]}`, 'Partner with a SWRO licensor before bidding Bhavnagar alone.', 'g1', OPP.id]);
  return out;
}
function vAnalytics() {
  S.ui.ap = S.ui.ap || 12; const H = HIST[S.ui.ap], dec = H.won + H.lostPrice + H.dq, wr = Math.round(H.won / dec * 100), live = liveOpps(), ins = insights(H);
  const T = subtabs('an', [['ins', 'Actionable insights', ins.length], ['win', 'Win / loss'], ['pipe', 'Pipeline & forecast'], ['eff', 'Bid efficiency'], ['est', 'Estimate accuracy'], ['ai', 'AI usage & quality'], ['aud', 'Audit trail', S.audit.length]]);
  const hb = (rows, mx, cls) => `<div class="hbar">${rows.map(r => `<div class="r"><span>${esc(r[0])}</span><div class="bar" style="height:12px"><i class="${cls ? cls(r) : ''}" style="width:${r[1] / mx * 100}%"></i></div><b class="mono num">${r[2] != null ? r[2] : r[1]}</b></div>`).join('')}</div>`;
  let x = '';
  if (T.cur === 'ins') x = `<div class="panel"><div class="ph"><h3>What to act on now</h3><span class="sub">Live records plus ${S.ui.ap}-month history · each insight links to the screen that fixes it</span></div><div class="pb flush">${ins.map(i => `<div class="flag"><div class="sev ${i[0] === 'ai' ? 'ai' : i[0]}"></div><div class="body"><b style="font-size:13.5px">${esc(i[1])}</b><span class="sub">${esc(i[2])}</span></div><button class="btn sm" data-a="taskgo" data-t="${i[3]}" data-id="${i[4]}">Open →</button></div>`).join('')}</div></div>`;
  if (T.cur === 'win') { const tot = H.won + H.lostPrice + H.dq + H.nobid; x = `<div class="grid g2"><div class="panel"><div class="ph"><h3>Outcomes</h3></div><div class="pb">${hb([['Won', H.won], ['Lost on price (L2/L3)', H.lostPrice], ['Disqualified', H.dq], ['No-bid', H.nobid]], Math.max(H.won, H.lostPrice, H.nobid), r => r[0] === 'Won' ? 'ok' : r[0].startsWith('Lost') ? 'warn' : r[0] === 'Disqualified' ? 'bad' : 'mut')}<p class="sub" style="margin-top:8px">${tot} opportunities; win rate ${wr}% of decided bids.</p></div></div>
    <div class="panel"><div class="ph"><h3>Why we lost</h3></div><div class="pb">${hb(H.loss, Math.max(...H.loss.map(l => l[1])), () => 'warn')}</div></div>
    <div class="panel"><div class="ph"><h3>Win rate by project type</h3></div><div class="pb">${hb(H.byType.map(t => [t[0], t[2] / t[1] * 100, `${t[2]}/${t[1]}`]), 100)}</div></div>
    <div class="panel"><div class="ph"><h3>Win rate by contract value</h3></div><div class="pb">${hb(H.byBand.map(t => [t[0], t[2] / t[1] * 100, `${t[2]}/${t[1]}`]), 100)}</div></div></div>
    <div class="panel"><div class="ph"><h3>Competitors</h3></div><div class="tw"><table class="t"><thead><tr><th>Competitor</th><th class="num">Met</th><th class="num">They won</th><th class="num">Their price vs ours</th></tr></thead><tbody>${H.comp.map(c => `<tr><td><b>${c[0]}</b></td><td class="num mono">${c[1]}</td><td class="num mono">${c[2]}</td><td class="num"><span class="chip ${c[3].startsWith('−') ? 'bad' : 'ok'}">${c[3]}</span></td></tr>`).join('')}</tbody></table></div></div>`; }
  if (T.cur === 'pipe') { const all = [...live.map(o => ({ s: o.pos, v: num(o.meta.value), fit: o.meta.fit || 60, name: o.meta.name, due: o.meta.submission })), ...PIPE.filter(p => !p.main).map(p => ({ s: p.stage, v: p.value, fit: p.fit, name: p.name }))]; const funnel = COLS.map(c => [c[0], all.filter(p => p.s >= c[1] && p.s <= c[2]).reduce((a, p) => a + p.v, 0), all.filter(p => p.s >= c[1] && p.s <= c[2]).length]); const wtd = all.reduce((a, p) => a + p.v * p.fit / 100 * wr / 100 * 2, 0);
    x = `<div class="grid g4">${kpi('Pipeline value', cr(all.reduce((a, p) => a + p.v, 0), 0))}${kpi('Expected awards (12 mo)', cr(wtd, 0), 'value × fit × win rate')}${kpi('Due in 30 days', live.filter(o => daysTo(o.meta.submission) <= 30 && daysTo(o.meta.submission) >= 0).length)}${kpi('Bid team load', live.filter(o => o.pos <= 8).length + ' live bids', 'capacity 4')}</div>
    <div class="grid g2"><div class="panel"><div class="ph"><h3>Value by stage (₹ Cr)</h3></div><div class="pb">${hb(funnel.map(f => [f[0], f[1], `${fmtN(f[1])} · ${f[2]}`]), Math.max(1, ...funnel.map(f => f[1])))}</div></div>
    <div class="panel"><div class="ph"><h3>Upcoming submissions</h3></div><div class="tw"><table class="t"><tbody>${live.filter(o => o.pos <= 8).sort((a, b) => new Date(a.meta.submission) - new Date(b.meta.submission)).map(o => `<tr class="click" data-a="opp" data-id="${o.meta.id}"><td><b>${esc(o.meta.name)}</b></td><td>${fmtDate(o.meta.submission)}</td><td><span class="chip ${daysTo(o.meta.submission) < 30 ? 'warn' : ''}">${daysTo(o.meta.submission)} d</span></td></tr>`).join('') || '<tr><td class="sub">No live bids.</td></tr>'}${PIPE.filter(p => !p.main && p.stage <= 8).map(p => `<tr><td>${esc(p.name)} <span class="sub">(sample)</span></td><td>${p.due}</td><td></td></tr>`).join('')}</tbody></table></div></div></div>`; }
  if (T.cur === 'eff') x = `<div class="grid g4">${kpi('Days to G1', H.cycle[0][1], 'target ' + H.cycle[0][2], H.cycle[0][1] <= H.cycle[0][2] ? 'ok' : 'warn')}${kpi('Bid cost per win', S.ui.ap === 12 ? '₹2.6 Cr' : '₹2.9 Cr')}${kpi('Proposal reuse', '41%', 'content from approved blocks')}${kpi('No-bid rate', Math.round(H.nobid / (dec + H.nobid) * 100) + '%', 'healthy 15–25%')}</div>
    <div class="panel"><div class="ph"><h3>Cycle time by stage (days)</h3><span class="sub">bar = actual · line = target</span></div><div class="pb"><div class="hbar">${H.cycle.map(c => `<div class="r"><span>${c[0]}</span><div class="bar" style="height:12px;position:relative"><i class="${c[1] > c[2] ? 'warn' : 'ok'}" style="width:${c[1] / 80 * 100}%"></i><span style="position:absolute;left:${c[2] / 80 * 100}%;top:-3px;width:2px;height:18px;background:var(--ink)"></span></div><b class="mono num">${c[1]}</b></div>`).join('')}</div></div></div>
    <div class="panel"><div class="ph"><h3>Live bids: readiness</h3></div><div class="tw"><table class="t"><thead><tr><th>Tender</th><th class="num">Reqs reviewed</th><th class="num">Sections approved</th><th class="num">Open queries</th><th class="num">Days left</th></tr></thead><tbody>${live.filter(o => o.pos <= 8).map(o => `<tr class="click" data-a="opp" data-id="${o.meta.id}"><td><b>${esc(o.meta.name)}</b></td><td class="num mono">${o.reqs.filter(r => r.st !== 'proposed').length}/${o.reqs.length}</td><td class="num mono">${o.prop ? o.prop.tree.filter(s => s.st === 'approved').length + '/' + o.prop.tree.length : '—'}</td><td class="num mono">${o.clars.filter(c => c.status !== 'answered').length}</td><td class="num mono">${daysTo(o.meta.submission)}</td></tr>`).join('')}</tbody></table></div></div>`;
  if (T.cur === 'est') { const rows = live.flatMap(o => o.bva.map(b => [o.meta.name, b])); x = `<div class="grid g3">${kpi('Estimate vs final cost', '+' + H.estVar + '%', 'delivered projects', 'warn')}${kpi('Packages over 5%', rows.filter(r => num(r[1].bid) && (num(r[1].act) - num(r[1].bid)) / num(r[1].bid) > 0.05).length)}${kpi('Avg margin at G2', H.margin + '%')}</div><div class="panel"><div class="ph"><h3>Bid vs actual by package</h3><span class="sub">From Handover → Close-out on each project</span></div><div class="tw"><table class="t"><thead><tr><th>Project</th><th>Package / norm</th><th class="num">Bid</th><th class="num">Actual</th><th class="num">Δ</th><th>Note</th></tr></thead><tbody>${rows.map(([n, b]) => { const dd = num(b.bid) ? (num(b.act) - num(b.bid)) / num(b.bid) * 100 : 0; return `<tr><td class="sub">${esc(n)}</td><td>${esc(b.item)}</td><td class="num mono">${b.bid}</td><td class="num mono">${b.act}</td><td class="num"><span class="chip ${Math.abs(dd) > 5 ? 'bad' : dd > 0 ? 'warn' : 'ok'}">${dd > 0 ? '+' : ''}${dd.toFixed(1)}%</span></td><td class="sub">${esc(b.note)}</td></tr>`; }).join('') || '<tr><td colspan="6" class="sub">No close-out data yet.</td></tr>'}</tbody></table></div></div>`; }
  if (T.cur === 'ai') x = `<div class="grid g4">${kpi('Model runs (month)', '14,820')}${kpi('Accepted with light edits', '64%', 'target ≥ 60%', 'ok')}${kpi('Hours saved per bid', '310', 'vs 2025 baseline')}${kpi('External AI calls', '0', 'egress default-deny', 'ok')}</div>
    <div class="panel"><div class="ph"><h3>AI usage and quality</h3></div><div class="tw"><table class="t"><thead><tr><th>Measure</th><th class="num">Value</th><th>Release gate</th></tr></thead><tbody>${[['Mandatory requirement recall (gold set)', '96.2%', '≥ 95%'], ['Citations that resolve', '100%', '100%'], ['Pages with a final state', '100%', '100% accounted for'], ['Takeoff count accuracy after review', '97.1%', '≥ 95%'], ['Proposal paragraphs accepted without edit', '58%', '—'], ['Assistant answers marked "not found"', '7%', 'honest refusals']].map(r => `<tr><td>${r[0]}</td><td class="num mono">${r[1]}</td><td class="mono">${r[2]}</td></tr>`).join('')}</tbody></table></div></div>`;
  if (T.cur === 'aud') { const who = S.ui.anw && S.audit.some(a => a[1] === S.ui.anw) ? S.ui.anw : null, rows = who ? S.audit.filter(a => a[1] === who) : S.audit, people = [...new Set(S.audit.map(a => a[1]))];
    x = `<div class="grid g3">${kpi('Entries logged', S.audit.length, 'this browser, append-only')}${kpi('People active', people.length)}${kpi('Changes today', S.audit.filter(a => a[0].startsWith(nowTs().slice(0, 6))).length)}</div>
    <div class="panel"><div class="ph"><div><h3>Who changed what</h3><span class="sub">${who ? `${rows.length} of ${S.audit.length} entries` : 'Newest first'}</span></div><div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm ${who ? '' : 'pri'}" data-a="anwho" data-v="">Everyone</button>${people.slice(0, 6).map(n => `<button class="btn sm ${who === n ? 'pri' : ''}" data-a="anwho" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div></div>
     <div class="tw"><table class="t"><thead><tr><th style="width:150px">When</th><th style="width:190px">Who</th><th>What</th></tr></thead><tbody>${rows.slice(0, 120).map(a => `<tr><td class="mono sub" style="white-space:nowrap">${esc(a[0])}</td><td>${esc(a[1])}</td><td>${esc(a[2])}</td></tr>`).join('') || '<tr><td colspan="3"><div class="empty">Nothing logged yet. Change a record and it appears here.</div></td></tr>'}</tbody></table></div>
     <div class="pb row between"><span class="sub">The full log, with search and export, is in the Admin console.</span><button class="btn sm" data-a="go" data-v="admin">Admin console →</button></div></div>`; }
  return `${sh('Reports & analytics · Water & wastewater', 'Pipeline, win/loss and estimate vs actual', 'Headline metrics, then the insights that need action. Every insight links to the screen where it is fixed.', `<div class="seg"><button class="${S.ui.ap === 12 ? 'on' : ''}" data-a="aperiod" data-v="12">12 months</button><button class="${S.ui.ap === 24 ? 'on' : ''}" data-a="aperiod" data-v="24">24 months</button></div>`)}
  <div class="tiles tiles5">${kpi('Win rate', wr + '%', `${H.won} of ${dec} decided`)}${kpi('Bids decided', dec)}${kpi('Avg margin at G2', H.margin + '%')}${kpi('Estimate vs final', '+' + H.estVar + '%', 'trend improving', 'warn')}${kpi('AI accepted with light edits', '64%', 'target ≥ 60%', 'ok')}</div>${T.html}${x}`;
}

/* Inviting a user is a modal off the Users table, not a form parked below it. */
function inviteModal() {
  const A = ensureAdmin(), roles = Object.keys(ROLES), left = A.seats - A.users.filter(u => u.status !== 'Deactivated').length;
  return `<div class="scrim" data-a="closemodal"><form class="modal" id="inviteform" role="dialog" aria-modal="true" aria-labelledby="ivt">
   <div class="mh"><div><span class="eyebrow">Users & roles · ${esc(S.cfg.company)}</span><h2 id="ivt">Invite a user</h2></div><button type="button" class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
   <div class="mb stack">
    <p class="sub">The role decides edit rights and which gates the person signs. They can be changed afterwards from the table.</p>
    <div class="grid g2">
     <label class="fld" for="iv-name"><span class="fldl">Name<i aria-hidden="true">*</i><span class="vh"> (required)</span></span><input type="text" id="iv-name" placeholder="e.g. Asha Varma"></label>
     <label class="fld" for="iv-mail"><span class="fldl">Work email<i aria-hidden="true">*</i><span class="vh"> (required)</span></span><input type="text" id="iv-mail" placeholder="asha.varma@narmadawater.in"></label>
    </div>
    <label class="fld" for="iv-role">Role<select id="iv-role">${roles.map(r => `<option value="${r}">${esc(ROLES[r].title)}</option>`).join('')}</select></label>
    <div class="note ${left > 0 ? '' : 'bad'}"><div>${left > 0 ? `${left} of ${A.seats} seat${left === 1 ? '' : 's'} free on the licence.` : `No seats left on the licence of ${A.seats}. Deactivate someone or raise the licence first.`} Invites are simulated in this prototype.</div></div>
   </div>
   <div class="mf"><button type="button" class="btn" data-a="closemodal">Cancel</button><button type="button" class="btn pri" data-a="uinvite">Send invite</button></div></form></div>`;
}

Object.assign(ACT, {
  adlay: d => { S.ui.adminLayout = d.v; },
  adissall: () => { S.ui.adIssAll = !S.ui.adIssAll; },
  adatthide: () => { S.ui.adAttnHide = true; },
  adattshow: () => { S.ui.adAttnHide = false; },
  adlic: () => { if (!isAdmin()) return 'skip'; S.ui.adLic = !S.ui.adLic; },
  uinvopen: () => { if (!isAdmin()) return 'skip'; S.modal = { invite: true }; },
  aperiod: d => { S.ui.ap = +d.v; },
  anwho: d => { S.ui.anw = d.v || null; },
  ustat: d => { if (!isAdmin()) return 'skip'; const u = ensureAdmin().users.find(x => x.id === d.id); u.status = d.v; log(`User ${d.v === 'Invited' ? 'invite resent' : d.v.toLowerCase()}`, u.email); toast(`${u.name}: ${d.v === 'Invited' ? 'invite resent' : d.v.toLowerCase()}.`); },
  umfa: d => { if (!isAdmin()) return 'skip'; const u = ensureAdmin().users.find(x => x.id === d.id); log('MFA reset link sent', u.email); toast(`MFA set-up link sent to ${u.email}.`); },
  uinvite: () => { if (!isAdmin()) return 'skip'; const n = document.getElementById('iv-name').value.trim(), m = document.getElementById('iv-mail').value.trim(), r = document.getElementById('iv-role').value; if (!n || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) { toast('Enter a name and a valid work email.'); return 'skip'; } const A = ensureAdmin(); if (A.users.some(u => u.email.toLowerCase() === m.toLowerCase())) { toast(`${m} is already on this tenant.`); return 'skip'; } A.users.push({ id: 'u' + Date.now(), name: n, email: m, role: r, status: 'Invited', mfa: false, last: '—' }); S.modal = null; log('Invited user', `${m} as ${ROLES[r].title}`); toast(`Invite sent to ${m} as ${ROLES[r].title}.`); },
  permreset: () => { if (!isAdmin()) return 'skip'; const A = ensureAdmin(); A.perm = deep(DEF_PERM); applyAdmin(); log('Restored default permissions'); },
  vis: d => { if (!isAdmin()) return 'skip'; const A = ensureAdmin(); A.vis[d.k] = !A.vis[d.k]; log(A.vis[d.k] ? 'Switched pack item on' : 'Switched pack item off', d.k); toast(`${d.k}: ${A.vis[d.k] ? 'now shown' : 'hidden again'} on your projects.`); },
  integ: d => { if (!isAdmin()) return 'skip'; const A = ensureAdmin(); A.integ[d.k] = !A.integ[d.k]; log(A.integ[d.k] ? 'Connected integration' : 'Disconnected integration', d.k); }
});
document.addEventListener('change', e => {
  const t = e.target, c = t.dataset.c; if (!c || !S.cfg) return; const A = ensureAdmin();
  const F = {
    adset: () => { A[t.dataset.k] = t.type === 'number' ? num(t.value) : t.value; log('Changed tenant setting', `${t.dataset.k} → ${t.value}`); },
    adchk: () => { A[t.dataset.k] = t.checked; log('Changed tenant setting', `${t.dataset.k} → ${t.checked ? 'on' : 'off'}`); },
    urole: () => { const u = A.users.find(x => x.id === t.dataset.id); u.role = t.value; log('Changed user role', `${u.email} → ${ROLES[t.value].title}`); toast(`${u.name} is now ${ROLES[t.value].title}.`); },
    permset: () => { const l = A.perm[t.dataset.k] = A.perm[t.dataset.k] || []; const i = l.indexOf(t.dataset.r); if (t.checked && i < 0) l.push(t.dataset.r); if (!t.checked && i >= 0) l.splice(i, 1); applyAdmin(); log('Changed edit rights', `${PERM[t.dataset.k].l}: ${ROLES[t.dataset.r].title} ${t.checked ? 'granted' : 'removed'}`); },
    gateset: () => { const l = A.gates[t.dataset.g]; const i = l.indexOf(t.dataset.r); if (t.checked && i < 0) l.push(t.dataset.r); if (!t.checked && i >= 0) { if (l.length === 1) { toast('A gate needs at least one signer.'); t.checked = true; return; } l.splice(i, 1); } applyAdmin(); log('Changed gate signers', `${t.dataset.g}: ${ROLES[t.dataset.r].title} ${t.checked ? 'added' : 'removed'}`); },
    agon: () => { A.agents[t.dataset.k].on = t.checked; log(t.checked ? 'Enabled agent' : 'Disabled agent', t.dataset.k); },
    agmode: () => { A.agents[t.dataset.k].mode = t.value; log('Changed agent review mode', `${t.dataset.k} → ${t.value}`); },
    aw: () => { S.ui.aw = t.value; }
  };
  if (F[c]) { if (!['aw'].includes(c) && !isAdmin()) return; F[c](); render(); }
});
document.addEventListener('input', e => { const t = e.target; if (t.dataset.i !== 'aq') return; S.ui.aq = t.value; const pos = t.selectionStart; render(); const n = document.getElementById('aq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { } } });

/* boot: apply saved admin overrides (permissions, gate signers) */

