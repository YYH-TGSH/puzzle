// 第 5 項題目品質量測（純量測、不改遊戲程式）：三款實際產生器副本＋固定種子、每款每難度 N=300。
// 種子規則：seed = 20261111 + groupIdx*100003 + i（i=0..N-1），可完全重現。
// 數獨 16×16 唯一解 sanity 只抽前 30 題（產生器內部挖洞時已逐洞驗唯一；sanity 為交叉核對，單題預算 3s）。
const fs = require('fs');
const OUT = __dirname + '/results.json';
const results = { meta: { n: 300, seedBase: 20261111, startedAt: new Date().toISOString() }, sudoku: {}, hashi: {}, mines: {} };
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
// 基本技巧 solver：naked singles + hidden singles 迭代至不動點（通用 N）
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
  // ===== 數獨 =====
  const S = loadSudoku();
  let gi = 0;
  for (const sizeId of [4, 9, 16]) {
    const sizeDef = S.SIZES.find(s => s.id === sizeId);
    for (const diff of S.DIFFICULTIES) {
      const key = `${sizeId}-${diff.id}`;
      const givens = [], genMs = [];
      let singles = 0, uniqChecked = 0, uniqOk = 0, uniqUnknown = 0, inRange = 0;
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
        const doSanity = sizeId !== 16 || i < 30;
        if (doSanity) {
          uniqChecked++;
          const cnt = S.countSolutions(grid, sizeDef.size, sizeDef.boxW, sizeDef.boxH, 2, { deadline: Date.now() + 3000 });
          if (cnt === 1) uniqOk++; else if (cnt === -1) uniqUnknown++;
        }
      }
      results.sudoku[key] = { size: sizeId, diff: diff.id, label: diff.name, targetGivens: [tMin, tMax], n: N,
        givens: stats(givens), givensInTargetRangePct: +(100 * inRange / N).toFixed(1),
        singlesOnlySolvedPct: +(100 * singles / N).toFixed(1), needsAdvancedPct: +(100 * (N - singles) / N).toFixed(1),
        uniqueSanity: { checked: uniqChecked, uniquePct: uniqChecked ? +(100 * uniqOk / uniqChecked).toFixed(1) : null, unknownBudgetPct: uniqChecked ? +(100 * uniqUnknown / uniqChecked).toFixed(1) : null },
        genMs: stats(genMs) };
      console.log('sudoku', key, JSON.stringify(results.sudoku[key].givens), 'singles%', results.sudoku[key].singlesOnlySolvedPct);
      save(); gi++;
    }
  }
  // ===== 數橋 =====
  const H = loadHashi();
  const LEVELS = [{ id: 1, name: '5x5 幼幼班', width: 5, height: 5 }, { id: 2, name: '10x10 標準', width: 10, height: 10 }, { id: 3, name: '10x20 手機直式', width: 10, height: 20 }, { id: 4, name: '15x15 魔王', width: 15, height: 15 }, { id: 5, name: '20x20 史詩', width: 20, height: 20 }];
  let li = 0;
  for (const lv of LEVELS) {
    const attempts = [], islands = [], bridges = [];
    let firstTryUnique = 0, abortedChecks = 0, capped = 0;
    for (let i = 0; i < N; i++) {
      const rng = H.HASHI_PUZZLE.mulberry32(BASE + (100 + li) * 100003 + i);
      let a = 0, p = null, okUnique = false;
      while (a < 300) {
        a++;
        p = H.HASHI_PUZZLE.generateRandomHashi(lv, rng);
        const cs = H.HASHI_SOLVER.countSolutions(p, 2);
        if (cs.aborted) abortedChecks++;
        if (cs.count === 1) { okUnique = true; break; }
      }
      if (!okUnique) capped++;
      if (a === 1) firstTryUnique++;
      attempts.push(a);
      islands.push(p.islands.length);
      bridges.push(p.islands.reduce((s2, isl) => s2 + isl.req, 0) / 2);
    }
    results.hashi['L' + lv.id] = { level: lv.id, name: lv.name, size: `${lv.width}x${lv.height}`, n: N,
      rawUniqueFirstAttemptPct: +(100 * firstTryUnique / N).toFixed(1),
      attemptsToUnique: stats(attempts), retriedPct: +(100 * attempts.filter(a => a > 1).length / N).toFixed(1),
      hitAttemptCap: capped, solverAbortedChecks: abortedChecks,
      islands: stats(islands), totalBridgesInSolution: stats(bridges) };
    console.log('hashi L' + lv.id, 'firstUnique%', results.hashi['L' + lv.id].rawUniqueFirstAttemptPct, 'attempts', JSON.stringify(results.hashi['L' + lv.id].attemptsToUnique));
    save(); li++;
  }
  // ===== 踩地雷 =====
  const M = require('./mines-engine.js');
  const PRESETS = [{ id: 9, w: 9, h: 9, mines: 10, name: '9×9・10 雷' }, { id: 16, w: 16, h: 16, mines: 40, name: '16×16・40 雷' }];
  let pi = 0;
  const pooled = [];
  for (const sp of PRESETS) {
    const bv = [];
    let safeProbes = 0, safeOk = 0, minesPreserved = 0;
    for (let i = 0; i < N; i++) {
      const seed = BASE + (200 + pi) * 100003 + i;
      const L = M.makeLayout(sp.w, sp.h, sp.mines, seed);
      const Nn = M.computeNums(sp.w, sp.h, L);
      // 3BV：零區 openings（相連 0 區每區 1）＋未與任何 0 格相鄰的數字格
      const seen = new Array(L.length).fill(false);
      let openings = 0;
      for (let c = 0; c < L.length; c++) {
        if (L[c] || Nn[c] !== 0 || seen[c]) continue;
        openings++;
        const stack = [c]; seen[c] = true;
        while (stack.length) { const cur = stack.pop(); for (const nb of M.neighborsOf(sp.w, sp.h, cur)) if (!seen[nb] && !L[nb] && Nn[nb] === 0) { seen[nb] = true; stack.push(nb); } }
      }
      let isolated = 0;
      for (let c = 0; c < L.length; c++) {
        if (L[c] || Nn[c] === 0) continue;
        if (!M.neighborsOf(sp.w, sp.h, c).some(nb => !L[nb] && Nn[nb] === 0)) isolated++;
      }
      const bv3 = openings + isolated;
      bv.push(bv3); pooled.push([sp.mines, bv3]);
      // 首擊安全：三個探針點（左上/中心/右下）過 makeFirstSafe 後保護圈無雷且雷數守恆
      const probes = [0, Math.floor(L.length / 2), L.length - 1];
      for (const probe of probes) {
        safeProbes++;
        const r = M.makeFirstSafe(L, sp.w, sp.h, probe, null);
        const zone = [probe, ...M.neighborsOf(sp.w, sp.h, probe)];
        if (zone.every(z => !r.layout[z])) safeOk++;
        if (r.layout.filter(Boolean).length === sp.mines) minesPreserved++;
      }
    }
    const st = stats(bv);
    results.mines['S' + sp.id] = { preset: sp.name, w: sp.w, h: sp.h, mines: sp.mines, n: N, bv3: st,
      bv3Cv: st ? +(st.std / st.mean).toFixed(3) : null,
      firstClickSafety: { probes: safeProbes, zoneSafePct: +(100 * safeOk / safeProbes).toFixed(1), minesPreservedPct: +(100 * minesPreserved / safeProbes).toFixed(1) } };
    console.log('mines', sp.name, '3BV', JSON.stringify(st));
    save(); pi++;
  }
  // pooled Pearson r（雷數 vs 3BV）
  const mx = pooled.reduce((s2, p) => s2 + p[0], 0) / pooled.length, my = pooled.reduce((s2, p) => s2 + p[1], 0) / pooled.length;
  let num = 0, dx = 0, dy = 0;
  for (const [x, y] of pooled) { num += (x - mx) * (y - my); dx += (x - mx) * (x - mx); dy += (y - my) * (y - my); }
  results.mines.correlation = { pooledPearsonMinesVs3BV: +(num / Math.sqrt(dx * dy)).toFixed(3), pooledN: pooled.length,
    note: '兩預設各自雷數固定（10/40），pooled r 由預設間差異主導；預設內難度變異完全由 3BV 決定（雷數變異為 0）。' };
  save();
  console.log('DONE');
  process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
