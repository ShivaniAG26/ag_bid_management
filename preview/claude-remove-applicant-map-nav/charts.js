/* bidPlan charts — a small inline-SVG renderer.
 *
 * This replaces the third-party chart bundle that used to live here. The app
 * only ever drew three shapes (a nested open arc, horizontal bars against a
 * threshold, and columns), none of which needs 440 kB of library, and the
 * bundle painted its own attribution mark on every chart unless a commercial
 * licence key was registered. Drawing them ourselves removes the mark the
 * honest way: there is no longer anything to attribute.
 *
 * The contract is unchanged, so no caller had to move: put a JSON spec on a
 * [data-chart] element and call BPCH.sync(). Colours are written as
 * var(--token) straight into the SVG, so light and dark follow the theme with
 * no re-render and no colour bookkeeping.
 */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const col = c => (c && String(c).charAt(0) === '-' ? `var(${c})` : (c || 'var(--border-strong)'));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const num = n => (Math.round(n * 10) / 10).toLocaleString('en-IN');

  /* a step a reader would pick: 1, 2, 2.5 or 5 times a power of ten */
  function niceStep(range, target) {
    const raw = (range || 1) / (target || 5);
    const mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }

  /* a point on a circle: 0° points right, −90° straight up */
  const pt = (cx, cy, r, deg) => {
    const a = deg * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  /* one slice of a ring, from angle a0 to a1, between radii ri and ro */
  function ring(cx, cy, ri, ro, a0, a1) {
    const big = Math.abs(a1 - a0) > 180 ? 1 : 0, sw = a1 > a0 ? 1 : 0;
    const [x1, y1] = pt(cx, cy, ro, a0), [x2, y2] = pt(cx, cy, ro, a1);
    const [x3, y3] = pt(cx, cy, ri, a1), [x4, y4] = pt(cx, cy, ri, a0);
    return `M${x1} ${y1}A${ro} ${ro} 0 ${big} ${sw} ${x2} ${y2}L${x3} ${y3}A${ri} ${ri} 0 ${big} ${sw ? 0 : 1} ${x4} ${y4}Z`;
  }

  const svg = (w, h, body, cls) =>
    `<svg class="bpch ${cls || ''}" viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="presentation" focusable="false">${body}</svg>`;
  const text = (x, y, s, o) => {
    o = o || {};
    return `<text x="${x}" y="${y}" fill="${o.fill || 'var(--text-muted)'}" font-size="${o.size || 11}"${o.weight ? ` font-weight="${o.weight}"` : ''} text-anchor="${o.anchor || 'start'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''} dominant-baseline="${o.base || 'auto'}" style="font-family:inherit">${esc(s)}</text>`;
  };

  /* ---------- nested open arc (the win/loss chart) ----------
     A thin inner ring and a wide outer ring drawn over the top half, with the
     total in the middle. Ratios are of the outer radius, so the proportions
     hold at any size. */
  /* ---------- the nested open arc ----------
     Interactive the way the old library was: a slice lifts and names itself on
     hover, the legend isolates a ring, and the arc sweeps in on first draw. */
  function donut2(el, t) {
    const b = el.getBoundingClientRect(), w = Math.max(220, b.width || 520), h = Math.max(140, b.height || 260);
    const a0 = t.start != null ? t.start : -180, a1 = t.end != null ? t.end : 0;
    const half = Math.abs(a1 - a0) <= 185;
    const cx = w / 2, cy = half ? h - 10 : h / 2;
    const R = Math.min(w / 2 - 6, half ? h - 20 : h / 2 - 6);
    const only = el.__only || null;                 /* a slice isolated from the legend */
    const rings = [
      { key: 'in', rows: t.inner_data || [], ri: R * 0.457, ro: R * 0.587, unit: t.unit1 || '' },
      { key: 'out', rows: t.data || [], ri: R * 0.696, ro: R, unit: t.unit2 || '' }
    ];
    let out = '', idx = 0;
    rings.forEach((g, gi) => {
      const tot = g.rows.reduce((a, r) => a + (+r.v || 0), 0) || 1;
      let a = a0;
      out += g.rows.map((r, i) => {
        const span = (+r.v || 0) / tot * (a1 - a0), s = a, e = a + span; a = e;
        if (Math.abs(span) < 0.01) return '';
        const id = g.key + ':' + i, dim = only && only !== id;
        const mid = (s + e) / 2, lift = 4;
        const [dx, dy] = [Math.cos(mid * Math.PI / 180) * lift, Math.sin(mid * Math.PI / 180) * lift];
        const pct = Math.round((+r.v || 0) / tot * 100);
        return `<g class="bpch-sl bpch-hit${dim ? ' is-dim' : ''}" data-sl="${id}" data-lift="${dx.toFixed(2)},${dy.toFixed(2)}" style="animation-delay:${(gi * 120 + i * 50)}ms" tabindex="0" role="button"
            aria-label="${esc(r.k)}: ${num(r.v)}${esc(g.unit)}, ${pct} percent"
            data-tip="${esc(r.k)}|${num(r.v)}${esc(g.unit)} · ${pct}%">
          <path d="${ring(cx, cy, g.ri, g.ro, s, e)}" fill="${col(r.c)}" stroke="var(--bg-surface)" stroke-width="2.5" stroke-linejoin="round"/></g>`;
      }).join('');
    });
    const centre = only ? (() => {
      const [k, i] = only.split(':'); const g = rings.find(x => x.key === k); const r = g && g.rows[+i];
      return r ? { big: num(r.v), sub: r.k } : null;
    })() : null;
    if (t.center) {
      out += `<g class="bpch-mid">${text(cx, cy - 26, centre ? String(centre.big) : t.center, { anchor: 'middle', size: 30, weight: '500', fill: 'var(--text-primary)', ls: '-0.5' })}
        ${text(cx, cy - 8, centre ? centre.sub : (t.sub || ''), { anchor: 'middle', size: 12 })}</g>`;
    }
    el.innerHTML = svg(w, h, out) + tipHtml();
    wire(el);
  }

  /* a plain ring, kept so an older spec still draws */
  function donut(el, t) {
    donut2(el, Object.assign({}, t, { start: t.start != null ? t.start : -90, end: t.end != null ? t.end : 270, inner_data: [], data: t.data }));
  }

  /* ---------- horizontal bars, optionally against a threshold ---------- */
  function hbar(el, t) {
    const b = el.getBoundingClientRect(), w = Math.max(320, b.width || 800), h = Math.max(120, b.height || 230);
    const rows = t.data || [], lw = t.labelW || 160, pad = 10, axis = 26;
    const x0 = lw + pad, x1 = w - pad, plot = x1 - x0;
    const mn = t.min != null ? t.min : 0, mx = t.max != null ? t.max : Math.max(...rows.map(r => +r.v || 0), 1);
    const sx = v => x0 + (Math.min(mx, Math.max(mn, v)) - mn) / (mx - mn || 1) * plot;
    const band = (h - axis) / (rows.length || 1), bh = Math.min(20, band * 0.56);
    let out = '';
    /* gridlines first, so the bars sit over them. The step is rounded to
       something a reader would choose (1, 2, 2.5, 5 × a power of ten) rather
       than the range divided by a fixed count, which gives labels like 91.7%. */
    const step = niceStep(mx - mn, 6);
    for (let v = Math.ceil(mn / step) * step; v <= mx + 1e-9; v += step) {
      const x = sx(v), first = Math.abs(v - mn) < 1e-9, last = Math.abs(v - mx) < 1e-9;
      out += `<line x1="${x}" y1="0" x2="${x}" y2="${h - axis}" stroke="var(--border-subtle)" stroke-width="1"${first ? '' : ' stroke-dasharray="2 3"'}/>`;
      out += text(x, h - axis + 15, num(v) + (t.unit || ''), { anchor: last ? 'end' : first ? 'start' : 'middle', base: 'hanging' });
    }
    rows.forEach((r, i) => {
      const cy = i * band + band / 2, y = cy - bh / 2, xv = sx(+r.v || 0);
      out += text(lw, cy, r.k, { anchor: 'end', base: 'middle', size: 12, fill: 'var(--text-secondary)' });
      out += `<g class="bpch-sl" style="animation-delay:${i * 60}ms"><title>${esc(r.k)}: ${num(r.v)}${esc(t.unit || '')}${r.g != null ? ` (gate ${num(r.g)}${esc(t.unit || '')})` : ''}</title>`
        + `<rect x="${x0}" y="${y}" width="${Math.max(1, xv - x0)}" height="${bh}" rx="3" fill="${col(r.c)}"/></g>`;
      if (t.gate && r.g != null) {
        const xg = sx(+r.g);
        out += `<line x1="${xg}" y1="${y - 2}" x2="${xg}" y2="${y + bh + 2}" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round"/>`;
      }
    });
    out += `<line x1="${x0}" y1="${h - axis}" x2="${x1}" y2="${h - axis}" stroke="var(--border-default)" stroke-width="1"/>`;
    el.innerHTML = svg(w, h, out);
  }

  /* ---------- columns ---------- */
  function col_(el, t) {
    const b = el.getBoundingClientRect(), w = Math.max(240, b.width || 700), h = Math.max(120, b.height || 190);
    const rows = t.data || [], pad = 8, axis = 24, top = 20;
    const plotH = h - axis - top, band = (w - pad * 2) / (rows.length || 1), bw = Math.min(54, band * 0.52);
    const mx = Math.max(...rows.map(r => +r.v || 0), 1);
    let out = `<line x1="${pad}" y1="${h - axis}" x2="${w - pad}" y2="${h - axis}" stroke="var(--border-default)" stroke-width="1"/>`;
    rows.forEach((r, i) => {
      const cx = pad + band * i + band / 2, bh = Math.max(2, (+r.v || 0) / mx * plotH), y = h - axis - bh;
      out += `<g class="bpch-sl" style="animation-delay:${i * 55}ms"><title>${esc(r.k)}: ${num(r.v)}</title>`
        + `<rect x="${cx - bw / 2}" y="${y}" width="${bw}" height="${bh}" rx="4" fill="${col(r.c || '--brand-solid')}"/></g>`;
      out += text(cx, y - 6, num(r.v), { anchor: 'middle', size: 11.5, weight: '500', fill: 'var(--text-primary)' });
      out += text(cx, h - axis + 15, r.k, { anchor: 'middle', base: 'hanging', size: 11.5, fill: 'var(--text-secondary)' });
    });
    el.innerHTML = svg(w, h, out);
  }

  /* ---------- interaction ----------
     One tooltip per chart, moved to the pointer; hover and focus both drive it,
     so a keyboard reaches every slice. */
  const tipHtml = () => `<div class="bpch-tip" role="status" aria-live="polite"></div>`;
  function wire(el) {
    const tip = el.querySelector('.bpch-tip'); if (!tip) return;
    const show = (g, x, y) => {
      const [k, v] = (g.dataset.tip || '').split('|');
      tip.innerHTML = `<b>${k}</b><span>${v || ''}</span>`;
      const r = el.getBoundingClientRect();
      tip.style.left = Math.max(4, Math.min(r.width - 8, x - r.left)) + 'px';
      tip.style.top = Math.max(4, y - r.top - 12) + 'px';
      tip.classList.add('is-on');
    };
    el.querySelectorAll('.bpch-hit').forEach(g => {
      const lift = (g.dataset.lift || '0,0').split(',').map(Number);
      g.addEventListener('pointerenter', e => { g.style.transform = `translate(${lift[0]}px,${lift[1]}px)`; show(g, e.clientX, e.clientY); });
      g.addEventListener('pointermove', e => show(g, e.clientX, e.clientY));
      g.addEventListener('pointerleave', () => { g.style.transform = ''; tip.classList.remove('is-on'); });
      g.addEventListener('focus', () => { const r = g.getBoundingClientRect(); show(g, r.left + r.width / 2, r.top); });
      g.addEventListener('blur', () => tip.classList.remove('is-on'));
      g.addEventListener('click', () => { el.__only = el.__only === g.dataset.sl ? null : g.dataset.sl; redraw(el); });
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.click(); } });
    });
  }
  /* the legend outside the chart can isolate a slice too */
  function isolate(host, key) { host.__only = host.__only === key ? null : key; redraw(host); }
  function redraw(el) {
    let spec; try { spec = JSON.parse(el.getAttribute('data-chart')); } catch (e) { return; }
    const fn = BUILD[spec.type]; if (fn) { fn(el, spec); markLegend(el); }
  }
  function markLegend(el) {
    const id = el.getAttribute('data-legend'); if (!id) return;
    document.querySelectorAll(`[data-legend-for="${id}"]`).forEach(b => b.classList.toggle('is-on', b.dataset.sl === el.__only));
  }

  const BUILD = { donut: donut, donut2: donut2, hbar: hbar, col: col_ };

  /* ---------- mounting ----------
     Each host keeps the spec it last drew plus the width it drew it at, so a
     re-render only happens when the data or the box actually changed. */
  const drawn = new WeakMap();
  function sync(force) {
    document.querySelectorAll('[data-chart]').forEach(el => {
      const raw = el.getAttribute('data-chart');
      const w = Math.round(el.getBoundingClientRect().width);
      const key = raw + '|' + w;
      const was = drawn.get(el);
      if (!force && was === key) return;
      if (!w) return;                       /* not laid out yet; a later sync catches it */
      let spec; try { spec = JSON.parse(raw); } catch (e) { return; }
      const fn = BUILD[spec.type]; if (!fn) return;
      el.classList.toggle('bpch-still', RM.matches);
      fn(el, spec);
      markLegend(el);
      drawn.set(el, key);
    });
  }

  /* redraw when the DOM is replaced by a render, and when the window resizes */
  let pending = 0;
  const soon = () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(() => sync(false)); };
  new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('resize', soon, { passive: true });
  if (document.readyState !== 'loading') soon(); else addEventListener('DOMContentLoaded', soon);

  /* a legend button anywhere on the page can isolate a slice */
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-legend-for]'); if (!b) return;
    const host = document.querySelector(`[data-legend="${b.dataset.legendFor}"]`); if (!host) return;
    isolate(host, b.dataset.sl);
  });
  window.BPCH = { sync: sync, draw: BUILD, isolate: isolate };
})();
