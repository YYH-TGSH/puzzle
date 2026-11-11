// 第 5 項量測・調校後重跑（v1.65.0 驗收）：同種子協議（seedBase 20261111、N=300/組）。
// 數獨：與 run-measure.js 完全相同（帶值由引擎 DIFFICULTIES 讀取、自動套新帶）。
// 數橋：改呼叫出貨本體 generateUniqueHashi＋lastGenStats（attempts/帶外次數），驗出貨題落帶。
// 地雷：改呼叫出貨本體 finalizeFirstClick（3 探針點擊/盤），驗最終盤 3BV 落帶/重生次數/首擊安全。
const fs = require('fs');
const OUT = __dirname + '/results2.json';
let results = { meta: { n: 300, seedBase: 20261111, round: 2, startedAt: new Date().toISOString() }, sudoku: {}, hashi: {}, mines: {} };
try { const prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); if (prev && prev.sudoku) { results = prev; console.log('resume: skip done combos', Object.keys(prev.sudoku).length, Object.keys(prev.hashi || {}).length, Object.keys(prev.mines || {}).length); } } catch (e) {}
function save() { results.meta.updatedAt = new Date().toISOString(); fs.writeFileSync(OUT, JSON.stringify(results, null, 1)); }
function stats(a) {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const mean = a.reduce((x, y) => x + y, 0) / a.length;
  const varr = a.reduce((x, y) => x + (y - mean) * (y - mean), 0) / a.length;
  const q = p => s[Math.min(s.length - 1, Math.max(0, Math.floor(p * s.length)))];
  return { mean: +mean.toFixed(2), std: +Math.sqrt(varr).toFixed(2), p10: q(0.10), p50: q(0.50), p90: q(0.90), min: s[0], max: s[s.length - 1] };
}
function loadSudoku() {
  const code = fs.readFileSync(__dirname + '/sudoku-engine.js', 'utf8');
  const m = { exports: {} };
  new Function('window', 'module', 'exports', code + '\n;module.exports = { generateSudokuAsync, DIFFICULTIES, SIZES, countSolutions, mulberry32 };')({ localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } }, m, m.exports);
  return m.exports;
}
function loadHashi() {
  const w = {};
  new Function('window', fs.readFileSync(__dirname + '/hashi-solver.js', 'utf8'))(w);
  new Function('window', fs.readFileSync(__dirname + '/hashi-puzzle.js', 'utf8'))(w);
  return w;
}
function singlesSolve(g0, size, boxW, boxH) {
  const g = g0.map(r => r.slice());
  function cands(y, x) {
    const used = new Set();
    for (let i = 0; i < size; i++) { if (g[y][i] !== null) used.add(g[y][i]); if (g[i][x] !== null) used.add(g[i][x]); }
    const by = Math.floor(y / boxH) * boxH, bx = Math.floor(x / boxW) * boxW;
    for (let dy = 0; dy < boxH; dy++) for (let dx = 0; dx < boxW; dx++) { const v = g[by + dy][bx + dx]; if (v !== null) used.add(v); }
    const out = []; for (let v = 0; v < size; v++) if (!used.has(v)) out.push(v); return out;
  }
  const units = [];
  for (let i = 0; i < size; i++) { units.push(Array.from({ length: size }, (_, j) => [i, j])); units.push(Array.from({ length: size }, (_, j) => [j, i])); }
  for (let by = 0; by < size; by += boxH) for (let bx = 0; bx < size; bx += boxW) { const u = []; for (let dy = 0; dy < boxH; dy++) for (let dx = 0; dx < boxW; dx++) u.push([by + dy, bx + dx]); units.push(u); }
  let progress = true, guard = 0;
  while (progress && guard++ < 1000) {
    progress = false;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (g[y][x] === null) {
      const c = cands(y, x);
      if (c.length === 0) return { solved: false, contradiction: true };
      if (c.length === 1) { g[y][x] = c[0]; progress = true; }
    }
    for (const u of units) for (let v = 0; v < size; v++) {
      let spot = null, cnt = 0, has = false;
      for (const [y, x] of u) { if (g[y][x] === v) { has = true; break; } if (g[y][x] === null && cands(y, x).includes(v)) { spot = [y, x]; cnt++; } }
      if (!has && cnt === 1 && spot) { g[spot[0]][spot[1]] = v; progress = true; }
    }
  }
  return { solved: g.every(r => r.every(v => v !== null)), contradiction: false };
}
(async () => {
  const N = 300, BASE = 20261111;
  const S = loadSudoku();
  let gi = 0;
  for (const sizeId of [4, 9, 16]) {
    const sizeDef = S.SIZES.find(s => s.id === sizeId);
    for (const diff of S.DIFFICULTIES) {
      const key = `${sizeId}-${diff.id}`;
      if (results.sudoku[key]) { console.log('skip sudoku', key); gi++; continue; }
      const givens = [], genMs = [];
      let singles = 0, inRange = 0;
      const [tMin, tMax] = diff.targets[sizeId];
      for (let i = 0; i < N; i++) {
        const rng = S.mulberry32(BASE + gi * 100003 + i);
        const t0 = Date.now();
        const r = await S.generateSudokuAsync(sizeId, diff.id, null, rng);
        genMs.push(Date.now() - t0);
        const gv = r.cells.filter(c => c.isGiven).length;
        givens.push(gv);
        if (gv >= tMin && gv <= tMax) inRange++;
        const grid = Array(sizeDef.size).fill(null).map(() => Array(sizeDef.size).fill(null));
        r.cells.forEach(c => { if (c.isGiven) grid[c.y][c.x] = sizeDef.chars.indexOf(c.value); });
        if (singlesSolve(grid, sizeDef.size, sizeDef.boxW, sizeDef.boxH).solved) singles++;
      }
      results.sudoku[key] = { size: sizeId, diff: diff.id, targetGivens: [tMin, tMax], n: N, givens: stats(givens), givensInTargetRangePct: +(100 * inRange / N).toFixed(1), singlesOnlySolvedPct: +(100 * singles / N).toFixed(1), genMs: stats(genMs) };
      console.log('sudoku', key, JSON.stringify(results.sudoku[key].givens), 'inRange%', results.sudoku[key].givensInTargetRangePct, 'singles%', results.sudoku[key].singlesOnlySolvedPct);
      save(); gi++;
    }
  }
  const H = loadHashi();
  const LEVELS = [{ id: 1, name: '5x5 幼幼班', width: 5, height: 5 }, { id: 2, name: '10x10 標準', width: 10, height: 10 }, { id: 3, name: '10x20 手機直式', width: 10, height: 20 }, { id: 4, name: '15x15 魔王', width: 15, height: 15 }, { id: 5, name: '20x20 史詩', width: 20, height: 20 }];
  let li = 0;
  for (const lv of LEVELS) {
    if (results.hashi['L' + lv.id]) { console.log('skip hashi L' + lv.id); li++; continue; }
    const attempts = [], islands = [], bridges = [], genMs = [];
    let outOfBand = 0, capped = 0, inBandOk = 0;
    for (let i = 0; i < N; i++) {
      const rng = H.HASHI_PUZZLE.mulberry32(BASE + (100 + li) * 100003 + i);
      const t0 = Date.now();
      const p = H.HASHI_PUZZLE.generateUniqueHashi(lv, rng);
      genMs.push(Date.now() - t0);
      const st = H.HASHI_PUZZLE.lastGenStats;
      attempts.push(st.attempts); outOfBand += st.outOfBand; if (st.capped) capped++;
      if (H.HASHI_PUZZLE.puzzleInBand(p, lv)) inBandOk++;
      islands.push(p.islands.length);
      bridges.push(p.islands.reduce((s2, isl) => s2 + isl.req, 0) / 2);
    }
    results.hashi['L' + lv.id] = { level: lv.id, name: lv.name, size: `${lv.width}x${lv.height}`, n: N, attempts: stats(attempts), totalOutOfBandRejects: outOfBand, cappedFallback: capped, shippedInBandPct: +(100 * inBandOk / N).toFixed(1), islands: stats(islands), totalBridgesInSolution: stats(bridges), genMs: stats(genMs) };
    console.log('hashi L' + lv.id, 'attempts', JSON.stringify(results.hashi['L' + lv.id].attempts), 'oob', outOfBand, 'inBand%', results.hashi['L' + lv.id].shippedInBandPct);
    save(); li++;
  }
  const M = require('./mines-engine.js');
  const PRESETS = [{ id: 9, w: 9, h: 9, mines: 10, name: '9×9・10 雷' }, { id: 16, w: 16, h: 16, mines: 40, name: '16×16・40 雷' }];
  let pi = 0;
  for (const sp of PRESETS) {
    if (results.mines['S' + sp.id]) { console.log('skip mines', sp.name); pi++; continue; }
    const bv = [], tries = [];
    let probes = 0, inBand = 0, cappedApprox = 0, safeOk = 0, minesOk = 0;
    for (let i = 0; i < N; i++) {
      const seed = BASE + (200 + pi) * 100003 + i;
      const L0 = M.makeLayout(sp.w, sp.h, sp.mines, seed);
      for (const probe of [0, Math.floor(sp.w * sp.h / 2), sp.w * sp.h - 1]) {
        probes++;
        const fin = M.finalizeFirstClick(sp.w, sp.h, sp.mines, sp.id, seed, L0, probe, null);
        bv.push(fin.bv); tries.push(fin.tries);
        if (fin.dist === 0) inBand++; else cappedApprox++;
        const zone = [probe, ...M.neighborsOf(sp.w, sp.h, probe)];
        if (zone.every(z => !fin.layout[z])) safeOk++;
        if (fin.layout.filter(Boolean).length === sp.mines) minesOk++;
      }
    }
    results.mines['S' + sp.id] = { preset: sp.name, n: N, probes, band: M.BV_BANDS[sp.id], shippedBv3: stats(bv), inBandPct: +(100 * inBand / probes).toFixed(1), cappedApproxPct: +(100 * cappedApprox / probes).toFixed(2), tries: stats(tries), zoneSafePct: +(100 * safeOk / probes).toFixed(1), minesPreservedPct: +(100 * minesOk / probes).toFixed(1) };
    console.log('mines', sp.name, 'inBand%', results.mines['S' + sp.id].inBandPct, 'tries', JSON.stringify(results.mines['S' + sp.id].tries));
    save(); pi++;
  }
  console.log('DONE');
  process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
