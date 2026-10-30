/* ============================================================================
   Terminology — every house calls these screens something different.
   ----------------------------------------------------------------------------
   Right-click (or press the menu key, or long-press on a touch screen) a phase,
   a stage, a module tab, a group heading or an inner tab, and rename it to the
   wording your own team uses.

   A rename is an overlay, never a rewrite: it is stored against the built-in id,
   scoped to the industry pack in use, so ids, routing, permissions and audit
   entries are untouched and "Reset to the default" always restores the original
   wording. Renames live in the tenant config, so they persist and apply to every
   tender in this browser.
   ========================================================================== */

function labelStore() {
  S.cfg = S.cfg || {};
  const all = S.cfg.labels = S.cfg.labels || {};
  const pack = typeof PROFILE === 'string' ? PROFILE : 'epc';
  return all[pack] = all[pack] || {};
}
const labelKey = (kind, id) => `${kind}:${id}`;
/* The one reader every render site goes through. */
function label(kind, id, dflt) {
  const v = labelStore()[labelKey(kind, id)];
  return v == null || v === '' ? dflt : v;
}
const isRenamed = (kind, id) => labelStore()[labelKey(kind, id)] != null;
function setLabel(kind, id, v) {
  const L = labelStore(), k = labelKey(kind, id);
  if (v == null) delete L[k]; else L[k] = v;
}
/* Terminology is tenant-wide wording, so it sits with the people who own the
   tender record or the tenant itself. */
const canRename = () => (typeof isAdmin === 'function' && isAdmin()) || can('meta');

const REN_KIND = {
  phase: 'Phase',
  stage: 'Stage',
  tab: 'Tab',
  grp: 'Group heading',
  sub: 'Inner tab'
};

/* Which element was right-clicked, and what it stands for. Each render site
   carries data-ren="<kind>|<id>|<default wording>" so this stays one lookup. */
function renTarget(el) {
  const n = el && el.closest && el.closest('[data-ren]');
  if (!n) return null;
  const [kind, id, ...rest] = n.dataset.ren.split('|');
  if (!REN_KIND[kind] || !id) return null;
  return { kind, id, dflt: rest.join('|') };
}
const renAttr = (kind, id, dflt) => `data-ren="${esc(kind)}|${esc(String(id))}|${esc(dflt)}"`;

document.addEventListener('contextmenu', e => {
  const t = renTarget(e.target);
  if (!t) return;
  e.preventDefault();
  if (!canRename()) { toast(`${R().title} cannot rename the workspace. Ask a Bid Manager or the Tenant Admin.`); return; }
  const r = (e.target.closest('[data-ren]')).getBoundingClientRect();
  /* A keyboard menu key reports 0,0: fall back to the element itself. */
  const x = e.clientX || r.left, y = e.clientY || r.bottom;
  S.ui.ren = { ...t, x, y, edit: false };
  renderLayer();
});

Object.assign(ACT, {
  renedit: () => { if (S.ui.ren) S.ui.ren.edit = true; renderLayer(); return 'skip'; },
  renclose: () => { S.ui.ren = null; renderLayer(); return 'skip'; },
  renreset: () => {
    const r = S.ui.ren; if (!r) return 'skip';
    if (!canRename()) return 'skip';
    setLabel(r.kind, r.id, null);
    log('Reset terminology', `${REN_KIND[r.kind]} ${r.id} back to “${r.dflt}”`);
    S.ui.ren = null; save(); render();
    toast(`Back to “${r.dflt}”.`);
    return 'skip';
  }
});

document.addEventListener('submit', e => {
  if (e.target.id !== 'renform') return;
  e.preventDefault();
  const r = S.ui.ren; if (!r) return;
  if (!canRename()) { toast('Your role cannot rename the workspace.'); return; }
  const v = (document.getElementById('renname') || {}).value || '';
  const name = v.trim().replace(/\s+/g, ' ');
  if (!name) { toast('Give it a name, or reset it to the default.'); return; }
  if (name.length > 48) { toast('Keep it under 48 characters so the tab still fits.'); return; }
  if (name === r.dflt) setLabel(r.kind, r.id, null);
  else setLabel(r.kind, r.id, name);
  log('Renamed terminology', `${REN_KIND[r.kind]} ${r.id}: “${r.dflt}” → “${name}”`);
  S.ui.ren = null; save(); render();
  toast(`Now called “${name}”.`);
});

/* The menu, and the rename panel it opens. Both render into the overlay layer. */
function renameOverlay() {
  const r = S.ui.ren; if (!r) return '';
  const cur = label(r.kind, r.id, r.dflt), changed = isRenamed(r.kind, r.id);
  if (!r.edit) {
    const top = Math.min(Math.max(8, r.y + 6), Math.max(8, innerHeight - 150));
    const left = Math.min(Math.max(8, r.x), Math.max(8, innerWidth - 248));
    return `<div class="scrim scrim--bare" data-a="renclose"><div class="renmenu" role="menu" style="top:${top}px;left:${left}px" aria-label="Rename ${esc(cur)}">
      <div class="renmenu__h"><span class="eyebrow">${esc(REN_KIND[r.kind])}</span><b>${esc(cur)}</b></div>
      <button role="menuitem" data-a="renedit">${IC.pen}Rename…</button>
      ${changed ? `<button role="menuitem" data-a="renreset">${IC.back}Reset to “${esc(r.dflt)}”</button>` : ''}
     </div></div>`;
  }
  return `<div class="scrim" data-a="renclose"><div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="rent">
    <form id="renform">
     <div class="mh"><div><span class="eyebrow">Terminology · ${esc(REN_KIND[r.kind])}</span><h2 id="rent">Rename “${esc(cur)}”</h2></div>
      <button type="button" class="ibtn" data-a="renclose" aria-label="Close">${IC.x}</button></div>
     <div class="mb stack">
      <label class="fld" for="renname">What your team calls it
       <input id="renname" type="text" value="${esc(cur)}" maxlength="48" autocomplete="off" spellcheck="false"></label>
      <p class="sub">Only the wording changes. The screen, its records, who may open it and everything already logged stay as they are${changed ? `, and the built-in name is “${esc(r.dflt)}”` : ''}.</p>
     </div>
     <div class="mf">
      ${changed ? `<button type="button" class="btn" data-a="renreset">Reset to the default</button>` : ''}
      <button type="button" class="btn" data-a="renclose">Cancel</button>
      <button type="submit" class="btn pri">Save the name</button>
     </div></form></div></div>`;
}
