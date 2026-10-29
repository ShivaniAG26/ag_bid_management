// Admin → Integrations: grouped connector cards with region tags, a region filter and a configure dialog (connections are simulated).
// Item: [key, name, description, badge, field set, regions (IN / GCC / GL), caveat]

const IN = 'IN', GCC = 'GCC', GL = 'GL', ALLR = [IN, GCC, GL];
const REGION = { IN: 'India', GCC: 'GCC', GL: 'Global' };
const IGROUPS = [
  ['Email', 'Project mailbox for clarifications, RFQs, contract correspondence and notices', [
    ['outlook', 'Outlook', 'Microsoft 365 email for tender intake and filing replies to records.', 'O', 'mail', ALLR],
    ['exchange', 'Exchange Server', 'On-premise Microsoft Exchange for clients that do not allow cloud mail.', 'EX', 'imap', [GCC, IN], 'For government and semi-government mail policies'],
    ['gmail', 'Gmail', 'Google Workspace email for proposal capture and correspondence.', 'G', 'mail', ALLR],
    ['zohomail', 'Zoho Mail', 'Business email widely used by Indian SMEs and suppliers.', 'ZM', 'mail', [IN]],
    ['imap', 'Custom email', 'Any mail server through IMAP and SMTP.', '@', 'imap', ALLR]]],
  ['Tenders', 'Feeds that bring new opportunities into the pipeline, de-duplicated', [
    ['cppp', 'CPPP / eProcure', 'Central Public Procurement Portal: notices, corrigenda, results.', 'eP', 'feed', [IN]],
    ['gem', 'GeM', 'Government e-Marketplace bids for packaged STPs and equipment.', 'GeM', 'feed', [IN]],
    ['gepnic', 'NIC GePNIC state portals', 'State e-procurement portals where most water boards and municipal bodies publish.', 'NIC', 'feed', [IN]],
    ['tendertiger', 'TenderTiger', 'Tender management and opportunity discovery.', 'TT', 'feed', [IN]],
    ['bidassist', 'BidAssist', 'A second tender discovery source alongside TenderTiger.', 'BA', 'feed', [IN]],
    ['tender247', 'Tender247', 'Aggregated Indian tenders with corrigendum tracking.', 'T24', 'feed', [IN]],
    ['tendersinfo', 'TendersInfo', 'Global tender aggregator covering India, the GCC and donor-funded projects.', 'TI', 'feed', ALLR],
    ['etimad', 'Etimad', 'Saudi Arabia government tenders and procurement.', 'ET', 'feed', [GCC]],
    ['esupply', 'Dubai eSupply', 'Dubai government procurement portal.', 'eS', 'feed', [GCC]],
    ['adgpg', 'Abu Dhabi Gov procurement', 'Abu Dhabi government procurement gateway.', 'AUH', 'feed', [GCC]],
    ['monaqasat', 'Monaqasat / Ashghal', 'Qatar government tenders, including Ashghal public works.', 'QA', 'feed', [GCC]],
    ['omantb', 'Oman Tender Board', 'Oman eTendering portal.', 'OM', 'feed', [GCC]],
    ['kuwaitctc', 'Kuwait CTC', 'Kuwait Central Tenders Committee.', 'KW', 'feed', [GCC]],
    ['bahraintb', 'Bahrain Tender Board', 'Bahrain government tenders.', 'BH', 'feed', [GCC]],
    ['wbstep', 'World Bank STEP / UNDB', 'Procurement notices for World Bank-funded water projects.', 'WB', 'feed', [GL]],
    ['adb', 'ADB procurement', 'Asian Development Bank tenders, often water and urban infrastructure.', 'ADB', 'feed', [GL, IN]],
    ['ted', 'EU TED', 'Tenders Electronic Daily for European public contracts.', 'TED', 'feed', [GL]]]],
  ['Project management & document control', 'Schedules, delivery progress and controlled documents after award', [
    ['primavera', 'Primavera P6', 'Schedules, baselines and look-ahead through XER or the P6 API.', 'P6', 'pm', ALLR],
    ['msproject', 'Microsoft Project', 'Schedules from Project Online or .mpp files.', 'MP', 'pm', ALLR],
    ['aconex', 'Oracle Aconex', 'Document control and correspondence; often mandated on GCC megaprojects.', 'ACX', 'pm', [GCC, GL]],
    ['projectwise', 'Bentley ProjectWise', 'Engineering document management used by water utilities and consultants.', 'PW', 'pm', ALLR],
    ['acc', 'Autodesk Construction Cloud', 'Drawings, issues and RFIs on site.', 'ACC', 'pm', [GL, GCC]],
    ['procore', 'Procore', 'Construction delivery: daily logs, submittals, punch lists.', 'PC', 'pm', [GL]],
    ['asite', 'Asite', 'Common data environment used in the UK and GCC.', 'AS', 'pm', [GCC, GL]],
    ['jira', 'Jira', 'Issue tracking for engineering teams.', 'JI', 'pm', [GL], 'Best for design deliverables and technical queries, not site progress'],
    ['openproject', 'OpenProject', 'Open-source project management that can be self-hosted in-country.', 'OP', 'pm', ALLR],
    ['tracklivo', 'TrackLivo', 'Project activity, delivery progress and coordination in one place.', 'TL', 'pm', [IN]]]],
  ['ERP & finance', 'Purchase orders, vendors, cost actuals and statutory filings', [
    ['sap', 'SAP S/4HANA', 'POs, vendor master and cost actuals for project controls.', 'S4', 'erp', ALLR],
    ['sapb1', 'SAP Business One', 'ERP for mid-size contractors and JV entities.', 'B1', 'erp', ALLR],
    ['oraclefusion', 'Oracle Fusion Cloud ERP', 'Finance and procurement, common among GCC contractors.', 'OF', 'erp', [GCC, GL]],
    ['jde', 'Oracle JD Edwards', 'On-premise ERP still widely used in the GCC.', 'JDE', 'erp', [GCC]],
    ['d365', 'Microsoft Dynamics 365', 'Business Central or Finance & Operations.', 'D365', 'erp', ALLR],
    ['tally', 'Tally Prime', 'Accounts and RA-bill receipts for smaller entities.', 'TP', 'erp', [IN]],
    ['zohobooks', 'Zoho Books', 'Accounting for Indian SMEs and subcontractors.', 'ZB', 'erp', [IN]],
    ['odoo', 'Odoo', 'Low-cost open-source ERP.', 'OD', 'erp', [IN, GCC, GL]],
    ['gst', 'GST e-invoicing & e-way bill', 'IRN generation for RA bills and e-way bills for site deliveries.', 'GST', 'gov', [IN]],
    ['nesl', 'NeSL e-Bank Guarantee', 'Electronic bank guarantees straight into the BG register.', 'eBG', 'gov', [IN]]]],
  ['Engineering & design', 'Models and drawings that feed the calculators and takeoff', [
    ['openflows', 'Bentley OpenFlows', 'WaterGEMS and SewerGEMS hydraulic models into process & hydraulics.', 'WG', 'eng', ALLR],
    ['autocad', 'AutoCAD / Civil 3D', 'Drawing intake for takeoff and sheet indexing.', 'CAD', 'eng', ALLR],
    ['arcgis', 'ArcGIS', 'Pipeline and sewer alignments, right-of-way and land data.', 'GIS', 'eng', ALLR],
    ['qgis', 'QGIS', 'Open-source GIS used by many municipal clients.', 'QG', 'eng', ALLR],
    ['epanet', 'EPANET', 'Free network model widely used by Indian municipal clients.', 'EN', 'eng', [IN, GL]]]],
  ['Estimating & cost', 'Quantity takeoff and estimating tools', [
    ['costx', 'CostX', 'Takeoff and estimating; quantities sync to the BOQ workbench.', 'CX', 'cost', [GCC, GL]],
    ['rib', 'RIB iTWO / Candy', 'Estimating and cost control, strong in the GCC.', 'RIB', 'cost', [GCC]]]],
  ['Documents', 'Where files live', [
    ['sharepoint', 'SharePoint', 'Document archive for snapshots, drawings and submissions.', 'SP', 'docs', ALLR],
    ['onedrive', 'OneDrive', 'Personal uploads that are filed to SharePoint.', '1D', 'docs', ALLR, 'Company records belong in SharePoint'],
    ['gdrive', 'Google Drive', 'Shared drives for tender documents.', 'GD', 'docs', ALLR],
    ['box', 'Box', 'Enterprise file sharing with strong governance.', 'BOX', 'docs', [GL]],
    ['dropbox', 'Dropbox', 'File sharing common with consultants and smaller suppliers.', 'DB', 'docs', [GL], 'No in-country data region for India or the GCC']]],
  ['Identity & signatures', 'How people sign in, and how bids and contracts are signed', [
    ['azuread', 'Microsoft Entra ID (Azure AD)', 'Single sign-on and MFA through SAML.', 'AD', 'sso', ALLR],
    ['okta', 'Okta', 'Single sign-on for enterprises outside Microsoft.', 'OK', 'sso', [GL]],
    ['googlesso', 'Google Workspace sign-in', 'Single sign-on through Google.', 'GS', 'sso', ALLR],
    ['emudhra', 'eMudhra / emSigner', 'Class 3 digital signatures required for CPPP and GeM submissions.', 'eM', 'sign', [IN, GCC]],
    ['uaepass', 'UAE Pass', 'UAE national digital identity for signing and government sign-in.', 'UP', 'sign', [GCC]],
    ['docusign', 'DocuSign', 'Contract and subcontract signatures.', 'DS', 'sign', [GL, GCC]],
    ['adobesign', 'Adobe Acrobat Sign', 'Electronic signatures for contracts and forms.', 'ASg', 'sign', [GL]]]],
  ['Communication', 'Where the team and suppliers already talk', [
    ['teams', 'Microsoft Teams', 'Meeting notes in, clarification and gate alerts out to channels.', 'MT', 'chat', ALLR],
    ['whatsapp', 'WhatsApp Business', 'Site diary entries and supplier expediting reminders.', 'WA', 'chat', [IN, GCC]],
    ['slack', 'Slack', 'Alerts and approvals in channels.', 'SL', 'chat', [GL]]]],
  ['Database & BI', 'Structured data in and reporting out', [
    ['sql', 'Custom SQL DB', 'SQL Server, PostgreSQL or MySQL tables and views.', 'SQL', 'db', ALLR],
    ['azure', 'Azure', 'Azure SQL and Synapse. In-country regions: UAE North, Central India.', 'Az', 'db', ALLR],
    ['aws', 'AWS', 'RDS and Redshift. In-country regions: UAE, Bahrain, Mumbai, Hyderabad.', 'AWS', 'db', ALLR],
    ['oraclecloud', 'Oracle Cloud', 'Autonomous database. In-country regions: Jeddah, Riyadh, Dubai, Mumbai.', 'OCI', 'db', [GCC, IN]],
    ['snowflake', 'Snowflake', 'Data warehouse for larger groups.', 'SF', 'db', [GL]],
    ['bigquery', 'Google BigQuery', 'Data warehouse on Google Cloud.', 'BQ', 'db', [GL]],
    ['powerbi', 'Power BI', 'Pipeline, win/loss and project dashboards.', 'BI', 'bi', ALLR]]],
  ['Regulatory & O&M', 'Statutory data and plant data during the PG test and O&M', [
    ['cpcb', 'CPCB / SPCB online monitoring', 'OCEMS effluent analyser data to the central and state pollution control boards.', 'PCB', 'reg', [IN]],
    ['avevapi', 'AVEVA PI', 'SCADA historian: PG test and O&M readings arrive automatically.', 'PI', 'scada', ALLR],
    ['ignition', 'Ignition', 'SCADA and historian platform used on newer plants.', 'IG', 'scada', ALLR]]]
];
const IFIELDS = {
  mail: [['account', 'Mailbox', 'bids@narmadawater.in'], ['folder', 'Folder to watch', 'Inbox/Tenders'], ['file', 'File replies to records by', 'Subject reference (PBQ-, RFQ-, NWW-)']],
  imap: [['imap', 'IMAP / Exchange host', 'mail.narmadawater.in:993'], ['smtp', 'SMTP host', 'smtp.narmadawater.in:587'], ['user', 'Username', 'bids@narmadawater.in'], ['secret', 'Password', '', 'password']],
  feed: [['key', 'API key or account', '', 'password'], ['region', 'Regions / states to watch', 'e.g. Maharashtra, Gujarat · Riyadh, Eastern Province'], ['filter', 'Keywords', 'STP, WTP, sewerage, desalination, CETP'], ['min', 'Minimum value', '₹100 Cr / SAR 40 m']],
  pm: [['url', 'Server or API URL', 'https://…'], ['project', 'Project mapping', 'One project per bidPlan project'], ['sync', 'Sync', 'Nightly']],
  erp: [['host', 'Host or tenant URL', ''], ['client', 'Company code', 'NWW1'], ['user', 'Service user', 'BIDPLAN_SVC'], ['secret', 'Password or token', '', 'password']],
  gov: [['gstin', 'GSTIN / entity ID', '24ABCDE1234F1Z5'], ['secret', 'API credentials', '', 'password'], ['use', 'Use for', 'RA bills, site deliveries, bank guarantees']],
  eng: [['path', 'Model or file location', '\\\\fileserver\\models'], ['link', 'Link to', 'Process & hydraulics calculator, drawing takeoff']],
  cost: [['url', 'Server or project URL', ''], ['link', 'Sync', 'Takeoff quantities → BOQ workbench']],
  docs: [['site', 'Site, drive or folder', 'https://…/Bids'], ['library', 'Library / folder', 'Tenders'], ['region', 'Data region', 'e.g. India, UAE']],
  sso: [['tenant', 'Directory / tenant ID', ''], ['entity', 'Entity ID', 'https://bidplan/narmada'], ['groups', 'Map groups to roles', 'BP-BidManagers → Bid Manager']],
  sign: [['org', 'Organisation account ID', ''], ['cert', 'Certificate / signature type', 'Class 3 DSC (signing + encryption)'], ['use', 'Use for', 'G3 submission package, contract signatures']],
  chat: [['workspace', 'Workspace or business number', ''], ['channels', 'Post to', 'Clarifications, gate alerts, site diary, expediting'], ['secret', 'Access token', '', 'password']],
  db: [['host', 'Host', ''], ['port', 'Port', '5432'], ['database', 'Database', 'projects'], ['region', 'Data region', 'e.g. UAE North, Mumbai'], ['user', 'Read-only user', 'bidplan_ro'], ['secret', 'Password', '', 'password']],
  bi: [['workspace', 'Workspace', 'Narmada Bids'], ['dataset', 'Dataset', 'bidPlan pipeline and projects'], ['refresh', 'Refresh', 'Daily']],
  reg: [['station', 'Station ID', 'MPCB-PIM-STP-01'], ['interval', 'Upload interval', '15 minutes']],
  scada: [['server', 'Historian server', ''], ['tags', 'Tag mapping', 'BOD, TSS, flow, kWh at incomer'], ['interval', 'Interval', '15 minutes']]
};
const IDEFAULT = { outlook: true, cppp: true, gem: true, primavera: true, azuread: true, sharepoint: true, aconex: true, projectwise: true };
const IALL = () => IGROUPS.flatMap(g => g[2]);
function integState() {
  const A = ensureAdmin(); A.conn = A.conn || {};
  IALL().forEach(i => { if (!A.conn[i[0]]) A.conn[i[0]] = { on: !!IDEFAULT[i[0]], cfg: {}, at: IDEFAULT[i[0]] ? '12 Oct 2026' : '' }; });
  return A.conn;
}
function integTab(A, ed) {
  const C = integState(), all = IALL(), q = (S.ui.iq || '').toLowerCase(), f = S.ui.if || 'all', rg = S.ui.ir || 'all';
  const inRegion = i => rg === 'all' || i[5].includes(rg);
  const match = i => inRegion(i) && (!q || (i[1] + ' ' + i[2]).toLowerCase().includes(q)) && (f === 'all' || (f === 'on') === C[i[0]].on);
  const logo = i => ILOGO[i[0]] ? `<span class="ic2-logo">${ILOGO[i[0]]}</span>` : `<span class="ic2-logo mono">${esc(i[3])}</span>`;
  const card = i => { const c = C[i[0]]; return `<article class="ic2 ${c.on ? 'on' : ''}">
    <div class="ic2-top">${logo(i)}<div class="ic2-tx"><h3>${esc(i[1])}</h3><span class="ic2-reg">${i[5].map(r => REGION[r]).join(' · ')}</span></div></div>
    <p class="ic2-desc">${esc(i[2])}</p>${i[6] ? `<span class="ic2-cav">${IC.alert}${esc(i[6])}</span>` : ''}
    <div class="ic2-foot"><span class="ic2-st ${c.on ? 'on' : ''}"><i></i>${c.on ? `Connected${c.at ? ' · ' + esc(c.at) : ''}` : 'Not connected'}</span><button class="btn sm ${c.on ? 'ghost' : ''}" data-a="iconf" data-k="${i[0]}">${ed ? (c.on ? 'Manage' : 'Connect') : 'View'}</button></div></article>`; };
  const shown = all.filter(inRegion);
  return `<div class="stack" style="gap:2px"><h3>Integrations</h3><span class="sub">${all.length} connectors for email, tender feeds, project and document control, ERP, engineering, signatures, communication, data and O&M.</span></div>
   <div class="row ifilters"><input type="search" id="iq" data-i="iq" value="${esc(S.ui.iq || '')}" placeholder="Search integrations" aria-label="Search integrations">
    <div class="seg">${[['all', 'All regions'], [IN, 'India'], [GCC, 'GCC'], [GL, 'Global']].map(([k, l]) => `<button class="${rg === k ? 'on' : ''}" data-a="iregion" data-v="${k}">${l} <span class="ct2">${k === 'all' ? all.length : all.filter(i => i[5].includes(k)).length}</span></button>`).join('')}</div>
    <div class="seg">${[['all', 'All', shown.length], ['on', 'Connected', shown.filter(i => C[i[0]].on).length], ['off', 'Available', shown.filter(i => !C[i[0]].on).length]].map(([k, l, n]) => `<button class="${f === k ? 'on' : ''}" data-a="ifilt" data-v="${k}">${l} <span class="ct2">${n}</span></button>`).join('')}</div></div>
  ${IGROUPS.map(g => { const l = g[2].filter(match); return l.length ? `<section class="igroup2"><div class="ig2-head"><h4>${esc(g[0])} <span>${l.length}</span></h4><p>${esc(g[1])}</p></div><div class="ig2-grid">${l.map(card).join('')}</div></section>` : ''; }).join('') || '<div class="panel"><div class="empty"><p>No integration matches.</p></div></div>'}
  <p class="sub">Connections are simulated in this prototype. Secrets are stored in the tenant vault and never shown again after saving. Region tags show where a connector is most used; any connector can be configured in any region.</p>`;
}
function integModal() {
  const k = S.modal.integ, i = IALL().find(x => x[0] === k), c = integState()[k], ed = isAdmin(), F = IFIELDS[i[4]];
  return `<div class="scrim" data-a="closemodal"><form class="modal" id="integform" role="dialog" aria-modal="true" aria-labelledby="it"><div class="mh"><div class="row" style="gap:12px;flex-wrap:nowrap"><span class="ilogo" aria-hidden="true">${esc(i[3])}</span><div><span class="eyebrow">Integration · ${i[5].map(r => REGION[r]).join(' · ')}</span><h2 id="it">${esc(i[1])}</h2></div></div><button type="button" class="ibtn" data-a="closemodal" aria-label="Close">${IC.x}</button></div>
   <div class="mb"><p class="sub">${esc(i[2])}</p>${i[6] ? `<div class="note warn"><div>${esc(i[6])}.</div></div>` : ''}${F.map(([f, l, ph, type]) => `<label class="fld" for="if-${f}">${esc(l)}<input type="${type || 'text'}" id="if-${f}" data-f="${f}" value="${type === 'password' ? '' : esc(c.cfg[f] || '')}" placeholder="${type === 'password' ? (c.cfg[f] ? 'Saved in the vault · enter to replace' : 'Stored in the tenant vault') : esc(ph)}" ${ed ? '' : 'disabled'} autocomplete="off"></label>`).join('')}
   <div id="itestout" role="status"></div>${!ed ? '<div class="note"><div>Only the Tenant Admin can change integrations.</div></div>' : ''}</div>
   <div class="mf">${ed && c.on ? `<button type="button" class="btn bad" data-a="idisc" data-k="${k}" style="margin-right:auto">Disconnect</button>` : ''}<button type="button" class="btn" data-a="closemodal">Cancel</button>${ed ? `<button type="button" class="btn" data-a="itest">Test connection</button><button type="submit" class="btn pri">${c.on ? 'Save changes' : 'Connect'}</button>` : ''}</div></form></div>`;
}
Object.assign(ACT, {
  iconf: d => { S.modal = { integ: d.k }; },
  ifilt: d => { S.ui.if = d.v; },
  iregion: d => { S.ui.ir = d.v; },
  itest: () => { const vals = [...document.querySelectorAll('#integform [data-f]')].filter(e => e.type !== 'password').map(e => e.value.trim() || e.placeholder); const ok = vals.every(Boolean), o = document.getElementById('itestout'); if (o) o.innerHTML = ok ? `<div class="note pk"><div>${IC.check} Connection test passed (simulated).</div></div>` : '<div class="note bad"><div>Fill in the empty fields first.</div></div>'; return 'skip'; },
  idisc: d => { if (!isAdmin()) return 'skip'; const c = integState()[d.k]; c.on = false; c.at = ''; S.modal = null; log('Disconnected integration', d.k); toast('Disconnected.'); }
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'integform') return; e.preventDefault(); if (!isAdmin()) return;
  const k = S.modal.integ, c = integState()[k], name = IALL().find(x => x[0] === k)[1];
  document.querySelectorAll('#integform [data-f]').forEach(el => { if (el.type === 'password') { if (el.value) c.cfg[el.dataset.f] = '••••'; } else c.cfg[el.dataset.f] = el.value.trim() || el.placeholder; });
  const was = c.on; c.on = true; if (!was) c.at = nowTs(); S.modal = null; log(was ? 'Updated integration' : 'Connected integration', name); render(); toast(`${name} ${was ? 'updated' : 'connected'} (simulated).`);
});
document.addEventListener('input', e => { const t = e.target; if (t.dataset.i !== 'iq') return; S.ui.iq = t.value; const pos = t.selectionStart; render(); const n = document.getElementById('iq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { } } });
