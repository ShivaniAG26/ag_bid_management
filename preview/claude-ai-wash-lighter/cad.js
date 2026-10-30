// Sample tender drawings as layered SVG. Sheet space is 1400 × 990 (A1 landscape); the title block sits bottom right.
// Layers: L-grid (frame), L-struct (structures), L-proc (process piping), L-water (water levels), L-dim (dimensions), L-text (annotation), L-ai (bidPlan markups).

const CAD_LAYERS = [['struct', 'Structures', 'var(--cad-ink)'], ['proc', 'Process piping', 'var(--cad-pipe)'], ['water', 'Water levels', 'var(--cad-water)'], ['dim', 'Dimensions', 'var(--cad-dim)'], ['text', 'Annotation', 'var(--cad-thin)'], ['ai', 'bidPlan markups', 'var(--cad-ai)']];

(function cadStyles() {
  const s = document.createElement('style');
  s.textContent = `
  .cadsvg{background:var(--cad-bg);font-family:var(--f-mono)}
  .cadsvg .s{stroke:var(--cad-ink);stroke-width:1.6;fill:none}
  .cadsvg .s2{stroke:var(--cad-ink);stroke-width:.8;fill:none}
  .cadsvg .sf{stroke:var(--cad-ink);stroke-width:1.6;fill:var(--cad-fill)}
  .cadsvg .hz{stroke:var(--cad-thin);stroke-width:.8;fill:none;stroke-dasharray:6 4}
  .cadsvg .th{stroke:var(--cad-thin);stroke-width:.6;fill:none}
  .cadsvg .hatch{stroke:var(--cad-hatch);stroke-width:.7;fill:none}
  .cadsvg .p{stroke:var(--cad-pipe);stroke-width:2.4;fill:none}
  .cadsvg .pd{stroke:var(--cad-pipe);stroke-width:1.6;fill:none;stroke-dasharray:7 4}
  .cadsvg .w{stroke:var(--cad-water);stroke-width:1.4;fill:none}
  .cadsvg .wf{fill:var(--cad-fill2);stroke:none}
  .cadsvg .wl{stroke:var(--cad-water);stroke-width:1.2;fill:none;stroke-dasharray:10 3 2 3}
  .cadsvg .d{stroke:var(--cad-dim);stroke-width:.8;fill:none}
  .cadsvg .dt{fill:var(--cad-dim);font-size:11px}
  .cadsvg .t{fill:var(--cad-ink);font-size:11px}
  .cadsvg .tb{fill:var(--cad-ink);font-size:13px;font-weight:600}
  .cadsvg .tl{fill:var(--cad-ink);font-size:16px;font-weight:600}
  .cadsvg .tx{fill:var(--cad-ink);font-size:30px;font-weight:600}
  .cadsvg .ts{fill:var(--cad-thin);font-size:9px}
  .cadsvg .tw{fill:var(--cad-water);font-size:10.5px}
  .cadsvg .tp{fill:var(--cad-pipe);font-size:10.5px}
  .cadsvg .ink{fill:var(--cad-ink)}
  .cadsvg .ai{stroke:var(--cad-ai);stroke-width:2.2;fill:none;stroke-dasharray:9 5}
  .cadsvg .aif{fill:var(--cad-ai)}
  .cadsvg .ait{fill:#fff;font-size:11px;font-weight:600;font-family:var(--f-body)}
  .cadsvg .ms{stroke:var(--cad-ai);stroke-width:2;fill:none}
  .cadsvg .msd{fill:var(--cad-ai)}
  .cadsvg.raster{filter:contrast(.92) blur(.25px)}`;
  document.head.appendChild(s);
})();

const cx = {
  R: (x, y, w, h, c = 's', rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${c}"${rx ? ` rx="${rx}"` : ''}/>`,
  L: (x1, y1, x2, y2, c = 's') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${c}"/>`,
  C: (x, y, r, c = 's') => `<circle cx="${x}" cy="${y}" r="${r}" class="${c}"/>`,
  P: (d, c = 's') => `<path d="${d}" class="${c}"/>`,
  T: (x, y, s, c = 't', a = 'start', rot) => `<text x="${x}" y="${y}" class="${c}" text-anchor="${a}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}>${s}</text>`,
  dimH(x1, x2, y, lbl) { return `<g>${this.L(x1, y, x2, y, 'd')}${this.L(x1, y - 6, x1, y + 6, 'd')}${this.L(x2, y - 6, x2, y + 6, 'd')}${this.P(`M${x1} ${y}l8 -3v6z M${x2} ${y}l-8 -3v6z`, 'd')}${this.T((x1 + x2) / 2, y - 5, lbl, 'dt', 'middle')}</g>`; },
  dimV(x, y1, y2, lbl) { return `<g>${this.L(x, y1, x, y2, 'd')}${this.L(x - 6, y1, x + 6, y1, 'd')}${this.L(x - 6, y2, x + 6, y2, 'd')}${this.T(x - 6, (y1 + y2) / 2, lbl, 'dt', 'middle', -90)}</g>`; },
  ai(x, y, w, h, n, lbl, side = 'top') {
    const tw = lbl.length * 6.2 + 26, ly = side === 'top' ? y - 22 : y + h + 4;
    return `<g>${this.R(x, y, w, h, 'ai', 6)}<rect x="${x}" y="${ly}" width="${tw}" height="18" rx="3" class="aif"/><text x="${x + 6}" y="${ly + 13}" class="ait">${n} · ${lbl}</text></g>`;
  },
  lvl(x, y, rl, c = 'tw') { return `<g>${this.P(`M${x} ${y}l-6 -9h12z`, c === 'tw' ? 'w' : 's2')}${this.T(x + 10, y - 2, rl, c)}</g>`; },
  valve(x, y, v) { return v ? this.P(`M${x - 7} ${y - 6}L${x + 7} ${y + 6}V${y - 6}L${x - 7} ${y + 6}Z`, 's2') : this.P(`M${x - 6} ${y - 7}L${x + 6} ${y + 7}H${x - 6}L${x + 6} ${y - 7}Z`, 's2'); },
  bubble(x, y, a, b, shared) { return `<g>${this.C(x, y, 19, 'sf')}${shared ? this.R(x - 19, y - 19, 38, 38, 's2') + this.L(x - 19, y, x + 19, y, 's2') : this.L(x - 19, y, x + 19, y, 's2')}${this.T(x, y - 5, a, 't', 'middle')}${this.T(x, y + 13, b, 't', 'middle')}</g>`; },
  north(x, y) { return `<g>${this.C(x, y, 26, 's2')}${this.P(`M${x} ${y - 34}L${x + 9} ${y + 12}L${x} ${y + 4}L${x - 9} ${y + 12}Z`, 'sf')}${this.T(x, y - 40, 'N', 'tb', 'middle')}</g>`; },
  scale(x, y, unit, n, lbl) { let s = ''; for (let i = 0; i < n; i++) s += this.R(x + i * unit, y, unit, 8, i % 2 ? 's2' : 'sf'); for (let i = 0; i <= n; i++) s += this.T(x + i * unit, y + 22, lbl[i] || '', 'ts', 'middle'); return `<g>${s}</g>`; }
};

function cadFrame(sh, body, notes) {
  const cols = 'ABCDEFGH', W = 1400, H = 990;
  let g = cx.R(20, 20, 1360, 950, 'th') + cx.R(40, 40, 1320, 910, 's');
  for (let i = 0; i < 8; i++) { const x = 40 + i * 165; g += cx.L(x, 20, x, 40, 'th') + cx.T(x + 82, 34, cols[i], 'ts', 'middle') + cx.L(x, 950, x, 970, 'th') + cx.T(x + 82, 964, cols[i], 'ts', 'middle'); }
  for (let j = 0; j < 6; j++) { const y = 40 + j * 151.7; g += cx.L(20, y, 40, y, 'th') + cx.T(30, y + 78, j + 1, 'ts', 'middle') + cx.L(1360, y, 1380, y, 'th') + cx.T(1370, y + 78, j + 1, 'ts', 'middle'); }
  const revs = { A: [['A', '15.08.26', 'Issued for tender review']], B: [['A', '15.08.26', 'Issued for tender review'], ['B', sh.date.slice(0, 6).replace(' ', '.') + '26', 'Issued with NIT']], C: [['A', '15.08.26', 'Issued for tender review'], ['B', '05.09.26', 'Levels revised'], ['C', sh.date.slice(0, 6).replace(' ', '.') + '26', 'Issued with NIT']] }[sh.rev] || [];
  let rt = cx.R(900, 790 - revs.length * 16 - 16, 460, revs.length * 16 + 16, 's2') + cx.T(906, 790 - revs.length * 16 - 4, 'REV   DATE       DESCRIPTION                          BY  CHK', 'ts');
  revs.forEach((r, i) => { rt += cx.T(906, 790 - (revs.length - i - 1) * 16 - 4, `${r[0]}     ${r[1]}   ${r[2].padEnd(36, ' ')} ${sh.by}  ${sh.chk}`.replace(/ /g, '&#160;'), 'ts'); });
  const tb = `<g>${cx.R(900, 790, 460, 160, 's')}${cx.L(900, 830, 1360, 830, 's2')}${cx.L(900, 870, 1360, 870, 's2')}${cx.L(1190, 870, 1190, 950, 's2')}${cx.L(1280, 870, 1280, 950, 's2')}${cx.L(1190, 910, 1360, 910, 's2')}
    ${cx.T(908, 806, 'CLIENT', 'ts')}${cx.T(908, 823, 'INDRAYANI MUNICIPAL CORPORATION', 'tb')}${cx.T(1352, 806, 'PMC: HYDROPLAN ASSOCIATES', 'ts', 'end')}
    ${cx.T(908, 846, 'PROJECT', 'ts')}${cx.T(908, 863, '200 MLD STP AND TRUNK SEWER (HAM) · PIMPRI', 'tb')}
    ${cx.T(908, 886, 'TITLE', 'ts')}${cx.T(908, 905, sh.title.toUpperCase().slice(0, 34), 'tb')}${cx.T(908, 922, sh.title.length > 34 ? sh.title.toUpperCase().slice(34, 68) : '', 'tb')}${cx.T(908, 942, 'TENDER DRAWING · NOT FOR CONSTRUCTION', 'ts')}
    ${cx.T(1198, 886, 'SHEET NO.', 'ts')}${cx.T(1198, 905, 'IMC-STP-' + sh.no, 'tb')}${cx.T(1288, 886, 'REV', 'ts')}${cx.T(1320, 908, sh.rev, 'tx', 'middle')}
    ${cx.T(1198, 926, 'SCALE', 'ts')}${cx.T(1198, 942, sh.scale.length > 12 ? sh.scale.slice(0, 13) : sh.scale, 't')}${cx.T(1288, 926, 'DATE', 'ts')}${cx.T(1288, 942, sh.date, 'ts')}</g>`;
  const nt = notes ? `<g class="L-text">${cx.T(910, 60, 'NOTES', 'tb')}${notes.map((n, i) => cx.T(910, 80 + i * 15, `${i + 1}. ${n}`, 'ts')).join('')}</g>` : '';
  return `<svg class="cadsvg${sh.fmt.startsWith('Raster') ? ' raster' : ''}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Drawing ${sh.no}: ${sh.title}"><g class="L-grid">${g}${rt}${tb}</g>${nt}${body}</svg>`;
}

const DRAW = {
  'P-001'() {
    let s = '', p = '', t = '', d = '', a = '', w = '';
    s += cx.P('M70 90H870V590H70Z', 's') + cx.P('M70 90H870V590H70Z', 'hz');
    s += cx.R(82, 102, 776, 476, 'th');
    // river
    w += cx.P('M50 640 C200 620 320 660 470 640 S760 615 890 640', 'w') + cx.P('M50 690 C220 670 340 705 500 688 S760 668 890 690', 'w');
    t += cx.T(470, 672, 'INDRAYANI RIVER', 'tw', 'middle') + cx.T(470, 700, 'HFL 545.80 m (100-yr)', 'tw', 'middle');
    // internal road
    s += cx.P('M90 375H850 M90 390H850', 's2') + cx.P('M215 110V560 M230 110V560', 's2');
    // inlet works
    s += cx.R(100, 130, 95, 62, 'sf'); for (let i = 0; i < 4; i++) s += cx.L(112 + i * 14, 136, 112 + i * 14, 186, 's2');
    s += cx.R(160, 138, 28, 46, 's2'); t += cx.T(147, 124, '1 INLET WORKS', 't', 'middle');
    // pumping station
    s += cx.C(150, 260, 30, 'sf') + cx.C(150, 260, 22, 's2'); t += cx.T(150, 305, '2 RSPS', 't', 'middle');
    // SBR basins (6 drawn)
    for (let i = 0; i < 6; i++) { const x = 250 + i * 70; s += cx.R(x, 130, 62, 112, 'sf') + cx.R(x + 4, 134, 54, 104, 's2'); s += cx.L(x + 8, 228, x + 54, 228, 's') ; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) s += cx.C(x + 16 + c * 15, 152 + r * 18, 2.2, 's2'); t += cx.T(x + 31, 258, 'SBR-' + (i + 1), 't', 'middle'); }
    t += cx.T(458, 274, '3 SBR BASINS (50 × 90 m, SWD 6.0 m)', 't', 'middle');
    // blower house
    s += cx.R(690, 140, 82, 52, 'sf'); for (let i = 0; i < 7; i++) s += cx.C(702 + i * 10, 166, 3.5, 's2'); t += cx.T(731, 132, '4 BLOWER HOUSE', 't', 'middle');
    // CCT serpentine
    s += cx.R(620, 300, 110, 62, 'sf'); for (let i = 1; i < 5; i++) s += cx.L(620 + i * 22, i % 2 ? 300 : 316, 620 + i * 22, i % 2 ? 346 : 362, 's2'); t += cx.T(675, 292, '6 CHLORINE CONTACT', 't', 'middle');
    // treated sump + outfall
    s += cx.R(760, 318, 54, 44, 'sf'); t += cx.T(787, 310, '7 TW SUMP', 't', 'middle');
    s += cx.R(795, 600, 40, 24, 'sf'); t += cx.T(842, 616, '8 OUTFALL', 't');
    // sludge
    s += cx.C(300, 340, 18, 'sf'); t += cx.T(300, 314, '9 SLUDGE SUMP', 't', 'middle');
    s += cx.C(300, 445, 36, 'sf') + cx.C(300, 445, 6, 's2'); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; s += cx.L(300 + 8 * Math.cos(an), 445 + 8 * Math.sin(an), 300 + 34 * Math.cos(an), 445 + 34 * Math.sin(an), 'th'); } t += cx.T(300, 498, '10 GRAVITY THICKENER', 't', 'middle');
    s += cx.R(372, 415, 92, 56, 'sf'); t += cx.T(418, 486, '11 CENTRIFUGES', 't', 'middle');
    s += cx.R(500, 420, 70, 46, 'sf'); t += cx.T(535, 486, '12 CAKE SHED', 't', 'middle');
    // buildings
    s += cx.R(100, 455, 100, 64, 'sf'); t += cx.T(150, 491, '13 ADMIN + LAB', 't', 'middle');
    s += cx.R(250, 520, 80, 40, 'sf') + cx.L(250, 520, 330, 560, 's2') + cx.L(330, 520, 250, 560, 's2'); t += cx.T(290, 575, '14 22 kV S/S', 't', 'middle');
    s += cx.R(640, 420, 62, 42, 'sf'); t += cx.T(671, 476, '15 Cl₂ SHED', 't', 'middle');
    s += cx.R(352, 520, 50, 32, 'sf'); t += cx.T(377, 567, '16 DG', 't', 'middle');
    s += cx.R(740, 420, 90, 60, 'sf'); t += cx.T(785, 494, '17 WORKSHOP', 't', 'middle');
    for (let i = 0; i < 26; i++) s += cx.C(96 + i * 30, 580, 6, 'th');
    // process piping
    p += cx.P('M40 160H100', 'p') + cx.T(44, 152, 'FROM TRUNK SEWER Ø1600', 'tp');
    p += cx.P('M147 192V230', 'p') + cx.P('M180 260H240V250', 'p') + cx.P('M240 250H660', 'pd');
    p += cx.P('M660 250V280H700V300', 'p') + cx.P('M730 331H760', 'p') + cx.P('M787 362V600H815', 'p');
    p += cx.P('M281 242V322 M300 358V409', 'pd') + cx.P('M336 445H372 M464 443H500', 'pd');
    p += cx.P('M690 166H660V140H250', 'pd') + cx.T(560, 136, 'AIR HEADER Ø800', 'tp');
    // dims
    d += cx.dimH(70, 870, 74, '640.0 m') + cx.dimV(56, 90, 590, '400.0 m') + cx.dimH(250, 662, 280, '330.0 m (6 basins)');
    // ai markups
    a += cx.ai(244, 112, 424, 160, 'CONTRA-01', '6 basins drawn · Vol II §3.2.1 requires 4');
    a += cx.ai(480, 296, 120, 70, 'R-06', 'No tertiary filter footprint (Corr-01)', 'bottom');
    const legend = ['Site boundary per land records; area 25.6 ha.', 'All levels in m above MSL (GTS benchmark).', 'Basins: SWD 6.0 m, freeboard 0.8 m.', 'Outfall to be designed for 100-yr HFL.', 'Roads 7.5 m wide, 2-lane, PCC.', 'Green belt 15 m along boundary.', 'Layout indicative; bidder to optimise.'];
    const extra = `<g class="L-text">${cx.north(1280, 520)}${cx.scale(920, 560, 25, 4, ['0', '20', '40', '60', '80 m'])}${cx.T(920, 545, 'SCALE 1:1000', 'ts')}</g>`;
    return cadFrame(SHEETS[0], `<g class="L-struct">${s}</g><g class="L-water">${w}</g><g class="L-proc">${p}</g><g class="L-dim">${d}</g><g class="L-text">${t}</g>${extra}<g class="L-ai">${a}</g>`, legend);
  },
  'P-010'() {
    const Y = rl => 600 - (rl - 543) * 40;
    let s = '', w = '', t = '', d = '', a = '', p = '';
    const U = [['INLET CHAMBER', 70, 70, 549.0, 552.40, 553.0], ['SCREENS', 165, 80, 550.5, 552.10, 552.9], ['GRIT CHAMBER', 270, 70, 548.5, 551.85, 552.6], ['DISTRIBUTION', 365, 60, 549.5, 551.50, 552.3], ['SBR BASIN', 450, 180, 545.2, 551.20, 552.0], ['DISC FILTERS', 665, 80, 546.5, 548.90, 549.6], ['CCT', 775, 110, 545.5, 548.20, 549.0], ['TW SUMP', 910, 70, 544.5, 547.90, 548.8], ['OUTFALL', 1010, 70, 545.6, 546.10, 547.2]];
    s += cx.P(`M50 ${Y(550)}H1340`, 'hz') + cx.T(54, Y(550) - 4, 'GL 550.00', 'ts');
    U.forEach(([n, x, wd, fl, twl, top], i) => {
      const dashed = n === 'DISC FILTERS';
      w += `<rect x="${x}" y="${Y(twl)}" width="${wd}" height="${Y(fl) - Y(twl)}" class="wf"/>`;
      s += cx.P(`M${x} ${Y(top)}V${Y(fl)}H${x + wd}V${Y(top)}`, dashed ? 'hz' : 's');
      w += cx.L(x, Y(twl), x + wd, Y(twl), 'w') + cx.lvl(x + wd / 2, Y(twl), twl.toFixed(2));
      t += cx.T(x + wd / 2, Y(fl) + 18, n, 't', 'middle') + cx.T(x + wd / 2, Y(fl) + 32, 'FL ' + fl.toFixed(2), 'ts', 'middle');
      if (i) { const pv = U[i - 1]; p += cx.L(pv[1] + pv[2], Y(pv[4]) + 6, x, Y(twl) + 6, 'p'); }
    });
    w += cx.L(450, Y(547.0), 630, Y(547.0), 'wl') + cx.T(540, Y(547.0) + 14, 'BWL 547.00', 'tw', 'middle');
    t += cx.T(705, Y(549.6) - 24, 'ADDED BY CORR-01', 'ts', 'middle');
    // river
    w += cx.P(`M1100 ${Y(545.8)}H1340`, 'w') + cx.P(`M1100 ${Y(543.6)}H1340`, 'wl') + `<rect x="1100" y="${Y(545.8)}" width="240" height="${Y(542.6) - Y(545.8)}" class="wf"/>`;
    w += cx.lvl(1200, Y(545.8), 'HFL 545.80') + cx.T(1210, Y(543.6) + 14, 'LWL 543.60', 'tw');
    s += cx.P(`M1080 ${Y(546.1)}L1100 ${Y(546.1)} M1100 ${Y(547.5)}V${Y(542.6)}`, 's');
    t += cx.T(1220, Y(548) , 'INDRAYANI RIVER', 'tw', 'middle');
    // HGL
    const hg = U.map(u => `${u[1] + u[2] / 2},${Y(u[5 - 1])}`).join(' ');
    p += `<polyline points="${hg}" class="pd"/>` + cx.T(80, Y(553.4), 'HYDRAULIC GRADE LINE', 'tp');
    // level scale
    for (let rl = 543; rl <= 554; rl++) d += cx.L(1340, Y(rl), 1350, Y(rl), 'd') + cx.T(1336, Y(rl) + 4, rl, 'dt', 'end');
    d += cx.dimV(1094, Y(546.1), Y(545.8), '0.30');
    // table
    let tb = cx.R(60, 650, 830, 66, 's2') + cx.L(60, 672, 890, 672, 'th') + cx.L(60, 694, 890, 694, 'th');
    tb += cx.T(66, 665, 'UNIT', 'ts') + cx.T(66, 687, 'TWL (m)', 'ts') + cx.T(66, 709, 'LOSS (m)', 'ts');
    U.forEach((u, i) => { const x = 160 + i * 81; tb += cx.T(x, 665, u[0].split(' ')[0], 'ts') + cx.T(x, 687, u[4].toFixed(2), 'ts') + cx.T(x, 709, i ? (U[i - 1][4] - u[4]).toFixed(2) : '—', 'ts'); });
    a += cx.ai(1060, Y(547.6), 64, Y(545.3) - Y(547.6), 'R-04', 'Free fall 0.30 m · min 0.5 m (§3.2.4)', 'top');
    a += cx.ai(655, Y(549.9), 100, Y(546.2) - Y(549.9), 'Corr-01', 'Filter loss 0.50 m allowed', 'bottom');
    const notes = ['All levels in m RL (GTS).', 'Profile at average flow 200 MLD.', 'Peak flow check: 2.25 × average.', 'SBR level varies TWL ↔ BWL over cycle.', 'Disc filter step added after Corr-01.'];
    return cadFrame(SHEETS[1], `<g class="L-struct">${s}</g><g class="L-water">${w}</g><g class="L-proc">${p}</g><g class="L-dim">${d}</g><g class="L-text">${t}${tb}</g><g class="L-ai">${a}</g>`, notes);
  },
  'P-020'() {
    let s = '', p = '', t = '', a = '';
    const box = (x, y, w, h, l1, l2) => cx.R(x, y, w, h, 'sf', 4) + cx.T(x + w / 2, y + h / 2 - (l2 ? 3 : -4), l1, 'tb', 'middle') + (l2 ? cx.T(x + w / 2, y + h / 2 + 13, l2, 'ts', 'middle') : '');
    const strm = (x, y, n) => `<g>${cx.P(`M${x} ${y - 11}L${x + 11} ${y}L${x} ${y + 11}L${x - 11} ${y}Z`, 'sf')}${cx.T(x, y + 4, n, 't', 'middle')}</g>`;
    const arrow = (x1, y1, x2, y2, c = 'p') => cx.L(x1, y1, x2, y2, c) + cx.P(`M${x2} ${y2}l-9 -4v8z`, c === 'p' ? 'p' : 'pd');
    s += box(60, 180, 100, 60, 'SCREENS', '6 mm, 3W+1S') + box(200, 180, 100, 60, 'GRIT', 'vortex 2W+1S') + box(340, 180, 100, 60, 'RSPS', '12W + 1S') + box(480, 160, 130, 100, 'SBR × 4', '27,000 m³ each') + box(650, 180, 100, 60, 'DISC FILTERS', '4 × 50 MLD') + box(790, 180, 90, 60, 'CCT', '30 min HRT');
    s += box(480, 340, 130, 54, 'BLOWERS', '6W + 1S, VFD') + box(330, 460, 110, 54, 'SLUDGE SUMP') + box(480, 460, 120, 54, 'THICKENER', 'gravity Ø24 m') + box(650, 460, 120, 54, 'CENTRIFUGES', '2W + 1S') + box(810, 460, 70, 54, 'CAKE');
    p += cx.L(20, 210, 60, 210, 'p') + arrow(160, 210, 200, 210) + arrow(300, 210, 340, 210) + arrow(440, 210, 480, 210) + arrow(610, 210, 650, 210) + arrow(750, 210, 790, 210) + arrow(880, 210, 890, 210);
    p += cx.L(545, 340, 545, 260, 'pd') + cx.L(545, 260, 545, 262, 'pd') + cx.T(552, 310, 'AIR', 'tp');
    p += cx.P('M520 260V430H385V460', 'pd') + arrow(440, 487, 480, 487, 'pd') + arrow(600, 487, 650, 487, 'pd') + arrow(770, 487, 810, 487, 'pd');
    p += cx.P('M710 514V560H110V240', 'pd') + cx.T(300, 576, 'CENTRATE + SUPERNATANT RETURN', 'tp');
    t += cx.T(700, 452, 'POLYMER 8 kg/t DS', 'ts') + cx.T(812, 168, 'Cl₂ 4 mg/l', 'ts') + cx.T(24, 200, 'RAW', 'ts');
    [[40, 210, 1], [180, 210, 2], [460, 210, 3], [630, 210, 4], [770, 210, 5], [885, 230, 6], [520, 400, 7], [625, 487, 8], [790, 487, 9]].forEach(q => s += strm(...q));
    const rows = [[1, 'Raw sewage', '200,000', '200', '300'], [2, 'After grit', '199,600', '198', '285'], [3, 'SBR feed + return', '202,400', '205', '290'], [4, 'SBR decant', '198,800', '15', '22'], [5, 'Filtered', '198,600', '8', '6'], [6, 'Treated', '198,600', '8', '6'], [7, 'Waste sludge', '3,800', '—', '0.8% DS'], [8, 'Thickened', '760', '—', '4% DS'], [9, 'Cake (t/day)', '150', '—', '20% DS']];
    let tb = cx.R(910, 250, 440, 30 + rows.length * 20, 's2') + cx.T(918, 268, 'STREAM   DESCRIPTION          FLOW m³/d   BOD    TSS'.replace(/ /g, '&#160;'), 'ts');
    rows.forEach((r, i) => tb += cx.T(918, 290 + i * 20, `${String(r[0]).padEnd(8)} ${r[1].padEnd(20)} ${r[2].padStart(9)}   ${r[3].padEnd(5)}  ${r[4]}`.replace(/ /g, '&#160;'), 't'));
    tb += cx.T(910, 240, 'MASS BALANCE AT AVERAGE FLOW', 'tb');
    a += cx.ai(14, 188, 52, 46, 'R-01', 'Raw BOD 200 · site data 271 mg/l', 'top');
    const notes = ['Mass balance at 200 MLD average.', 'Return streams included in stream 3.', 'Sludge yield 0.75 kg DS/kg BOD.'];
    return cadFrame(SHEETS[2], `<g class="L-struct">${s}</g><g class="L-proc">${p}</g><g class="L-text">${t}${tb}</g><g class="L-ai">${a}</g>`, notes);
  },
  'C-120'() {
    let s = '', w = '', t = '', d = '', a = '', p = '';
    const X = 90, Yp = 110, L = 450, B = 250;
    s += cx.R(X - 3, Yp - 3, L + 6, B + 6, 's') + cx.R(X, Yp, L, B, 's2');
    for (let i = 1; i < 12; i++) for (let j = 1; j < 7; j++) s += cx.C(X + i * 36, Yp + j * 34, 2.4, 's2');
    for (let j = 1; j < 7; j++) p += cx.L(X + 20, Yp + j * 34, X + 420, Yp + j * 34, 'pd');
    p += cx.L(X - 40, Yp + 20, X, Yp + 20, 'p') + cx.T(X - 40, Yp + 12, 'INLET', 'tp');
    s += cx.R(X + L - 30, Yp + 40, 14, 170, 'sf') + cx.C(X + L - 23, Yp + 30, 6, 's2'); t += cx.T(X + L - 40, Yp + 230, 'DECANTER', 't', 'end');
    p += cx.L(X + L, Yp + 125, X + L + 40, Yp + 125, 'p') + cx.T(X + L + 4, Yp + 117, 'DECANT', 'tp');
    s += cx.L(X - 20, Yp + 140, X + L + 20, Yp + 140, 'hz') + cx.T(X - 26, Yp + 144, 'A', 'tb', 'end') + cx.T(X + L + 26, Yp + 144, 'A', 'tb');
    d += cx.dimH(X, X + L, Yp - 22, '90.00 m') + cx.dimV(X - 30, Yp, Yp + B, '50.00 m');
    t += cx.T(X, Yp + B + 34, 'PLAN · SBR BASIN 1 (TYP. FOR 4)', 'tb') + cx.T(X, Yp + B + 50, 'SCALE 1:200 · DIFFUSER GRID 7.2 × 6.8 m', 'ts');
    // section
    const SX = 90, SY = 520, SW = 500, Yr = rl => SY + (552.0 - rl) * 12;
    s += cx.P(`M${SX} ${Yr(552)}V${Yr(545.2)} M${SX + SW} ${Yr(552)}V${Yr(545.2)}`, 's');
    s += cx.R(SX - 6, Yr(552), 6, Yr(545.2) - Yr(552), 'sf') + cx.R(SX + SW, Yr(552), 6, Yr(545.2) - Yr(552), 'sf');
    s += cx.R(SX - 30, Yr(545.2), SW + 66, 8, 'sf');
    for (let i = 0; i < 40; i++) s += cx.L(SX - 30 + i * 14, Yr(544.6) + 2, SX - 22 + i * 14, Yr(544.6) + 12, 'hatch');
    w += `<rect x="${SX}" y="${Yr(551.2)}" width="${SW}" height="${Yr(545.2) - Yr(551.2)}" class="wf"/>` + cx.L(SX, Yr(551.2), SX + SW, Yr(551.2), 'w') + cx.L(SX, Yr(547), SX + SW, Yr(547), 'wl');
    w += cx.lvl(SX + 60, Yr(551.2), 'TWL 551.20') + cx.lvl(SX + 200, Yr(547), 'BWL 547.00');
    t += cx.T(SX + SW + 14, Yr(552) + 4, 'TOW 552.00', 't') + cx.T(SX + SW + 14, Yr(545.2) + 4, 'FL 545.20', 't') + cx.T(SX + SW + 40, Yr(544.6) + 8, 'RAFT 600', 'ts');
    d += cx.dimV(SX + SW + 70, Yr(551.2), Yr(545.2), 'SWD 6.00');
    t += cx.T(SX, Yr(544.6) + 42, 'SECTION A-A · SCALE 1:100', 'tb') + cx.T(SX, Yr(544.6) + 58, 'WALL 450 THK · M35 · Fe 500D · IS 3370 CRACK WIDTH 0.2 mm', 'ts');
    // calc box
    t += cx.R(660, 120, 210, 120, 's2') + cx.T(670, 140, 'BASIN VOLUME', 'tb') + cx.T(670, 162, 'L × B × SWD', 't') + cx.T(670, 182, '90.0 × 50.0 × 6.0', 't') + cx.T(670, 202, '= 27,000 m³', 'tb') + cx.T(670, 226, '× 4 basins = 108,000 m³', 't');
    a += cx.ai(654, 112, 222, 136, 'CHECK', 'Volume matches BOQ B-1.04', 'bottom');
    const notes = ['Concrete M35, cover 45 mm.', 'Water-tightness test per IS 6494.', 'Expansion joints at 30 m c/c.', 'Diffusers: membrane EPDM, 9 in.'];
    return cadFrame(SHEETS[3], `<g class="L-struct">${s}</g><g class="L-water">${w}</g><g class="L-proc">${p}</g><g class="L-dim">${d}</g><g class="L-text">${t}</g><g class="L-ai">${a}</g>`, notes);
  },
  'M-301'() {
    let s = '', p = '', w = '', t = '', d = '', a = '';
    s += cx.R(100, 160, 380, 200, 's') + cx.R(108, 168, 364, 184, 's2') + cx.R(30, 220, 70, 80, 'sf'); t += cx.T(65, 314, 'SCREEN CH.', 't', 'middle');
    p += cx.L(30, 260, 100, 260, 'p');
    for (let i = 0; i < 5; i++) { const x = 150 + i * 70; s += cx.C(x, 260, 20, 'sf') + cx.C(x, 260, 8, 's2'); p += cx.L(x, 240, x, 110, 'p') + cx.valve(x, 140, true) + cx.valve(x, 185, false); t += cx.T(x, 298, 'P-10' + (i + 1), 't', 'middle') + cx.T(x, 312, i === 4 ? 'STANDBY' : 'DUTY', 'ts', 'middle'); }
    p += cx.L(130, 110, 520, 110, 'p') + cx.T(526, 114, 'Ø900 RISING MAIN TO INLET CH.', 'tp');
    t += cx.T(150, 128, 'NRV', 'ts') + cx.T(150, 176, 'SV', 'ts');
    d += cx.dimH(100, 480, 380, '19.00 m') + cx.dimV(84, 160, 360, '10.00 m');
    t += cx.T(100, 410, 'PLAN · WET WELL 1 OF 3 · SCALE 1:100', 'tb');
    // section
    const Y = rl => 470 + (553 - rl) * 22;
    s += cx.P(`M110 ${Y(553)}V${Y(543.8)}H470V${Y(553)}`, 's') + cx.L(90, Y(553), 490, Y(553), 's') + cx.L(110, Y(551.4), 470, Y(551.4), 'hz') + cx.T(476, Y(551.4) + 4, 'EOT CRANE 5 t', 'ts');
    w += `<rect x="110" y="${Y(548.2)}" width="360" height="${Y(543.8) - Y(548.2)}" class="wf"/>` + cx.L(110, Y(548.2), 470, Y(548.2), 'w') + cx.L(110, Y(544.6), 470, Y(544.6), 'wl') + cx.lvl(140, Y(548.2), 'TWL 548.20') + cx.lvl(300, Y(544.6), 'LWL 544.60');
    for (let i = 0; i < 5; i++) { const x = 150 + i * 70; s += cx.R(x - 12, Y(544.6), 24, 30, 'sf'); p += cx.L(x, Y(544.6), x, Y(553) - 20, 'p'); }
    t += cx.T(476, Y(543.8) + 4, 'FL 543.80', 't') + cx.T(476, Y(553) + 4, 'TOP 553.00', 't') + cx.T(100, Y(543.8) + 34, 'SECTION B-B · SCALE 1:100', 'tb');
    const rows = [['TAG', 'DUTY', 'Q m³/h', 'H m', 'kW'], ['P-101', 'Duty', '1,800', '18.0', '132'], ['P-102', 'Duty', '1,800', '18.0', '132'], ['P-103', 'Duty', '1,800', '18.0', '132'], ['P-104', 'Duty', '1,800', '18.0', '132'], ['P-105', 'Standby', '1,800', '18.0', '132']];
    let tb = cx.T(600, 160, 'PUMP SCHEDULE', 'tb') + cx.R(600, 170, 270, rows.length * 20 + 8, 's2');
    rows.forEach((r, i) => tb += cx.T(608, 188 + i * 20, r.map((v, j) => String(v).padEnd([7, 9, 8, 6, 4][j])).join('').replace(/ /g, '&#160;'), i ? 't' : 'ts'));
    a += cx.ai(124, 228, 352, 64, 'NOTE', '4 + 1 here · 12 + 1 across 3 wet wells', 'top');
    const notes = ['Submersible non-clog pumps, VFD on 2.', 'Delivery valves: NRV + sluice.', 'Ventilation 12 air changes/hour.'];
    return cadFrame(SHEETS[4], `<g class="L-struct">${s}</g><g class="L-water">${w}</g><g class="L-proc">${p}</g><g class="L-dim">${d}</g><g class="L-text">${t}${tb}</g><g class="L-ai">${a}</g>`, notes);
  },
  'I-401'() {
    let s = '', p = '', t = '', a = '';
    s += cx.R(330, 200, 340, 260, 's') + cx.T(500, 480, 'SBR BASIN 1  ·  27,000 m³', 'tb', 'middle');
    for (let i = 0; i < 9; i++) s += cx.C(360 + i * 35, 430, 4, 's2');
    p += cx.P('M60 430H300V430H360', 'p') + cx.L(360, 430, 640, 430, 'pd') + cx.T(70, 422, 'AIR FROM BLOWER HEADER Ø800', 'tp');
    s += cx.valve(200, 430, true) + cx.R(192, 404, 16, 12, 's2');
    p += cx.L(620, 260, 760, 260, 'p') + cx.T(770, 264, 'DECANT TO DISC FILTERS', 'tp') + cx.L(450, 470, 450, 560, 'p') + cx.L(450, 560, 600, 560, 'p') + cx.T(606, 564, 'WAS TO SLUDGE SUMP', 'tp');
    s += cx.valve(700, 260, true) + cx.R(692, 234, 16, 12, 's2') + cx.C(520, 560, 15, 'sf');
    s += cx.bubble(200, 340, 'FCV', '1101', true) + cx.bubble(120, 380, 'FIT', '1101') + cx.bubble(420, 150, 'AIT', '1102', true) + cx.bubble(560, 150, 'LIT', '1103', true) + cx.bubble(700, 180, 'ZT', '1104') + cx.bubble(780, 120, 'XV', '1104', true) + cx.bubble(520, 640, 'FIT', '1105') + cx.bubble(360, 640, 'M', '1105', true) + cx.bubble(860, 340, 'DIC', '1102', true);
    t += cx.L(200, 359, 200, 404, 'hz') + cx.L(120, 399, 120, 430, 'hz') + cx.L(139, 380, 181, 340, 'hz') + cx.L(420, 169, 420, 260, 'hz') + cx.L(560, 169, 560, 200, 'hz') + cx.L(439, 150, 841, 340, 'hz') + cx.L(841, 340, 219, 340, 'hz');
    t += cx.L(700, 199, 700, 248, 'hz') + cx.L(761, 120, 708, 234, 'hz') + cx.L(520, 621, 520, 575, 'hz') + cx.L(379, 640, 505, 560, 'hz');
    t += cx.T(860, 380, 'DO SETPOINT 2.0 mg/l', 'ts', 'middle') + cx.T(60, 700, 'SIGNAL ─ ─ ─ ELECTRONIC   ━━ PROCESS LINE   ○ FIELD   ⊟ SHARED DISPLAY / PLC', 'ts');
    a += cx.ai(300, 100, 330, 90, 'REQ-0171', 'No NH₄-N analyser in basin (Vol III §10.2)', 'top');
    const notes = ['Instrument symbols per ISA 5.1.', 'All loops to PLC-1, Modbus TCP.', 'Typical for basins 1 to 4.'];
    return cadFrame(SHEETS[5], `<g class="L-struct">${s}</g><g class="L-proc">${p}</g><g class="L-text">${t}</g><g class="L-ai">${a}</g>`, notes);
  },
  'E-001'() {
    let s = '', t = '', a = '';
    const brk = (x, y) => cx.R(x - 8, y - 8, 16, 16, 'sf');
    const tx = (x, y) => cx.C(x, y - 12, 15, 's') + cx.C(x, y + 8, 15, 's');
    [200, 600].forEach((x, i) => { s += cx.L(x, 70, x, 210, 's') + brk(x, 120) + brk(x, 180) + cx.P(`M${x - 14} 90l14 -14l14 14`, 's2'); t += cx.T(x + 14, 66, `22 kV INCOMER-${i + 1} (MSEDCL)`, 't') + cx.T(x + 14, 124, 'VCB 630 A', 'ts') + cx.T(x + 14, 184, 'CT/PT METERING', 'ts'); });
    s += cx.L(120, 210, 680, 210, 's') + cx.L(120, 213, 680, 213, 's') + cx.T(690, 214, '22 kV HT PANEL', 't');
    [200, 600].forEach((x, i) => { s += cx.L(x, 213, x, 260, 's') + brk(x, 240) + tx(x, 290) + cx.L(x, 312, x, 380, 's') + brk(x, 350); t += cx.T(x + 22, 292, `TR-${i + 1} 2.5 MVA`, 't') + cx.T(x + 22, 306, '22/0.433 kV Dyn11', 'ts') + cx.T(x + 14, 354, 'ACB 4000 A', 'ts'); });
    s += cx.L(100, 380, 380, 380, 's') + cx.L(420, 380, 700, 380, 's') + cx.L(100, 383, 380, 383, 's') + cx.L(420, 383, 700, 383, 's') + brk(400, 381); t += cx.T(400, 404, 'BUS COUPLER', 'ts', 'middle') + cx.T(710, 384, '433 V PCC', 't');
    const out = [['MCC-1', 'BLOWERS 7 × 250 kW VFD'], ['MCC-2', 'RSPS 13 × 132 kW'], ['MCC-3', 'SLUDGE + POLYMER'], ['MCC-4', 'TERTIARY FILTERS'], ['PDB', 'LIGHTING + HVAC'], ['APFC', '1,200 kVAr']];
    out.forEach(([n, d], i) => { const x = 130 + i * 100 + (i > 2 ? 40 : 0); s += cx.L(x, 383, x, 470, 's') + brk(x, 420) + cx.R(x - 34, 470, 68, 30, 'sf'); t += cx.T(x, 489, n, 'tb', 'middle') + cx.T(x, 518, d.split(' ').slice(0, 2).join(' '), 'ts', 'middle') + cx.T(x, 530, d.split(' ').slice(2).join(' '), 'ts', 'middle'); });
    s += cx.C(820, 300, 24, 'sf') + cx.T(820, 305, 'G', 'tb', 'middle') + cx.L(820, 324, 820, 383, 's') + cx.L(700, 383, 820, 383, 's2'); t += cx.T(850, 296, 'DG 2 × 1,010 kVA', 't') + cx.T(850, 310, 'AMF PANEL', 'ts');
    const load = [['LOAD', 'kW'], ['Blowers (6 duty)', '1,500'], ['Raw sewage pumps', '1,580'], ['Sludge handling', '310'], ['Tertiary filters', '120'], ['Utilities, lighting', '390'], ['CONNECTED', '3,900']];
    let tb = cx.T(1000, 300, 'LOAD SUMMARY', 'tb') + cx.R(1000, 310, 260, load.length * 20 + 8, 's2');
    load.forEach((r, i) => tb += cx.T(1008, 328 + i * 20, r[0].padEnd(24).replace(/ /g, '&#160;') + r[1], i === 0 || i === load.length - 1 ? 'tb' : 't'));
    a += cx.ai(116, 462, 300, 76, 'R-04', 'Blower kW drives 0.21 kWh/m³ guarantee', 'bottom');
    const notes = ['Two independent 22 kV feeders.', 'Fault level 25 kA at 433 V.', 'Energy meters class 0.2S.'];
    return cadFrame(SHEETS[6], `<g class="L-struct">${s}</g><g class="L-text">${t}${tb}</g><g class="L-ai">${a}</g>`, notes);
  },
  'L-201'() {
    let s = '', p = '', t = '', d = '', a = '', w = '';
    const KX = km => 60 + km * 180;
    // plan
    s += cx.P(`M60 140 C300 120 520 190 ${KX(4.2)} 170 S1200 150 ${KX(7.1)} 175`, 'hz') + cx.P(`M60 220 C300 200 520 270 ${KX(4.2)} 250 S1200 230 ${KX(7.1)} 255`, 'hz');
    s += `<rect x="${KX(4.2)}" y="150" width="${KX(7.1) - KX(4.2)}" height="120" class="hatch" style="fill:none"/>`;
    for (let i = 0; i < 30; i++) s += cx.L(KX(4.2) + i * 18, 150, KX(4.2) + i * 18 + 40, 270, 'hatch');
    t += cx.T(KX(5.6), 140, 'STATE HIGHWAY 55 (MSRDC) · ROW', 't', 'middle');
    p += cx.P(`M60 180 C300 160 520 230 ${KX(4.2)} 210 S1200 190 ${KX(7.1)} 215`, 'p');
    for (let i = 0; i <= 70; i++) { const km = i * 0.1, x = KX(km), y = 180 + (km < 4.2 ? Math.sin(km * 1.1) * 18 + km * 7 : 210 - 180 + (km - 4.2) * 1.5 + 180 - 0); const yy = km < 4.2 ? 180 + (km / 4.2) * 30 + Math.sin(km * 1.4) * 12 : 210 + (km - 4.2) * 1.8; s += cx.C(x, yy, i % 10 ? 2.6 : 4, i % 10 ? 's2' : 'sf'); }
    for (let k = 0; k <= 7; k++) { t += cx.T(KX(k), 118, `CH ${k}+000`, 'ts', 'middle') + cx.L(KX(k), 122, KX(k), 128, 'th'); }
    [[1.35, 'NALA-1'], [3.9, 'NALA-2'], [6.2, 'NALA-3']].forEach(([k, n]) => { w += cx.P(`M${KX(k) - 10} 100 C${KX(k)} 150 ${KX(k) - 20} 220 ${KX(k)} 300`, 'w'); t += cx.T(KX(k) + 6, 300, n + ' (TRENCHLESS)', 'tw'); });
    t += cx.T(60, 96, 'PLAN · H 1:2500', 'tb') + cx.T(KX(7.1), 300, 'MATCH LINE L-202 →', 'ts', 'end');
    // profile
    const Y = rl => 600 - (rl - 540) * 11;
    const gl = []; for (let i = 0; i <= 71; i++) { const km = i * 0.1; gl.push([KX(km), Y(556.2 + Math.sin(km * 1.3) * 1.8 - km * 0.35)]); }
    s += `<polyline points="${gl.map(q => q.join(',')).join(' ')}" class="s"/>`;
    const inv = km => 551.6 - km * 1.0;
    p += cx.L(KX(0), Y(inv(0) + 1.2), KX(7.1), Y(inv(7.1) + 1.2), 'p') + cx.L(KX(0), Y(inv(0)), KX(7.1), Y(inv(7.1)), 'p');
    for (let i = 0; i < 26; i++) { const k = 2.1 + i * 0.05; s += cx.L(KX(k), Y(553.3 - k * 0.2), KX(k) + 9, Y(550.5 - k * 0.3), 'hatch'); }
    s += cx.P(`M${KX(2.1)} ${Y(553.4)}L${KX(3.4)} ${Y(552.6)}`, 'hz');
    ['BH-07', 'BH-08', 'BH-09', 'BH-10', 'BH-11'].forEach((b, i) => { const k = 2.2 + i * 0.28; s += cx.L(KX(k), Y(557) - 8, KX(k), Y(549), 's2'); t += cx.T(KX(k), Y(557) - 12, b, 'ts', 'middle'); });
    for (let rl = 542; rl <= 560; rl += 2) d += cx.L(50, Y(rl), 58, Y(rl), 'd') + cx.T(46, Y(rl) + 4, rl, 'dt', 'end');
    t += cx.T(60, Y(560) - 6, 'LONGITUDINAL SECTION · H 1:2500 · V 1:250', 'tb') + cx.T(KX(5.5), Y(inv(5.5)) + 26, 'MS Ø1600 EPOXY · GRADIENT 1 IN 1000', 'tp', 'middle') + cx.T(KX(1), Y(inv(1)) + 26, 'DI K9 Ø1200', 'tp', 'middle');
    // table
    let tb = cx.R(60, 640, 1280, 80, 's2'); ['CHAINAGE', 'GROUND LEVEL', 'INVERT LEVEL', 'DEPTH (m)'].forEach((r, i) => { tb += cx.T(66, 656 + i * 20, r, 'ts'); if (i) tb += cx.L(60, 640 + i * 20, 1340, 640 + i * 20, 'th'); });
    for (let k = 1; k <= 7; k++) { const g = 556.2 + Math.sin(k * 1.3) * 1.8 - k * 0.35; tb += cx.T(KX(k), 656, `${k}+000`, 'ts', 'middle') + cx.T(KX(k), 676, g.toFixed(2), 'ts', 'middle') + cx.T(KX(k), 696, inv(k).toFixed(2), 'ts', 'middle') + cx.T(KX(k), 716, (g - inv(k)).toFixed(2), 'ts', 'middle'); }
    a += cx.ai(KX(2.05), Y(557.6), KX(3.45) - KX(2.05), Y(549) - Y(557.6), 'R-03', 'Rock 2.1–2.8 m bgl · BH-07 to BH-11', 'top');
    a += cx.ai(KX(4.2) - 4, 146, KX(7.1) - KX(4.2) + 8, 128, 'PBQ-04', 'ROW along SH-55 not assigned (Vol II §7.6)', 'bottom');
    return cadFrame(SHEETS[7], `<g class="L-struct">${s}</g><g class="L-water">${w}</g><g class="L-proc">${p}</g><g class="L-dim">${d}</g><g class="L-text">${t}${tb}</g><g class="L-ai">${a}</g>`, null);
  }
};
const cadCache = {};
function drawSheet(no) { if (!cadCache[no]) cadCache[no] = DRAW[no](); return cadCache[no]; }

function boreLog() {
  const st = [[0, 0.6, 'Filled-up soil', 'var(--cad-fill)'], [0.6, 2.1, 'Black cotton soil, stiff, CH', '#c9c2b2'], [2.1, 3.4, 'Weathered basalt, RQD 42%', '#9aa6ad'], [3.4, 6.0, 'Moderately weathered basalt, RQD 68%', '#7d8a91']];
  const Y = m => 20 + m * 42;
  let g = st.map(s => `<rect x="70" y="${Y(s[0])}" width="70" height="${Y(s[1]) - Y(s[0])}" style="fill:${s[3]};stroke:#1d2b2e"/><text x="152" y="${(Y(s[0]) + Y(s[1])) / 2 + 4}" style="font:12px var(--f-body);fill:#1f2a2c">${s[2]}</text><text x="62" y="${Y(s[1]) + 4}" text-anchor="end" style="font:11px var(--f-mono);fill:#1f2a2c">${s[1].toFixed(1)}</text>`).join('');
  g += `<line x1="60" x2="150" y1="${Y(2.4)}" y2="${Y(2.4)}" style="stroke:#2470b8;stroke-dasharray:4 3"/><text x="430" y="${Y(2.4) + 4}" style="font:11px var(--f-mono);fill:#2470b8" text-anchor="end">GWT 2.4 m</text>`;
  g += `<line x1="40" x2="430" y1="${Y(4.6)}" y2="${Y(4.6)}" style="stroke:#bd3a2c;stroke-width:1.5"/><text x="430" y="${Y(4.6) - 4}" style="font:11px var(--f-mono);fill:#bd3a2c" text-anchor="end">Trench invert 4.6 m</text>`;
  return `<svg viewBox="0 0 440 290" style="width:100%;max-width:440px;display:block;margin:8px 0" role="img" aria-label="Bore log BH-07 strata column">${g}</svg>`;
}
