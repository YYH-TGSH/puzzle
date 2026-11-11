// 帶值守衛（v1.65.0 D1/D3/D4）：三項驗收帶的單元守衛（完整 N=300 協議由 boottest/measure 重跑負責）
// D1：9 困難目標帶 = [22,25] 且生成結果集中於新帶；D3：L1–L3 出貨題 100% 落帶、L5 不套帶仍可生成；
// D4：finalizeFirstClick 最終盤面 3BV 落帶（或達上限取近似）、首擊圈安全、雷數守恆、自訂 tries=1。
const fs = require('fs');
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
function loadSudoku() {
  const code = fs.readFileSync(__dirname + '/../sudoku-site/js/engine.js', 'utf8');
  const m = { exports: {} };
  new Function('window', 'module', 'exports', code + '\n;module.exports = { generateSudokuAsync, DIFFICULTIES, mulberry32 };')({ localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } }, m, m.exports);
  return m.exports;
}
function loadHashi() {
  const w = {};
  new Function('window', fs.readFileSync(__dirname + '/../hashi-site/js/solver.js', 'utf8'))(w);
  new Function('window', fs.readFileSync(__dirname + '/../hashi-site/js/puzzle.js', 'utf8'))(w);
  return w;
}
function loadMines() {
  const s = fs.readFileSync(__dirname + '/../mines-site/js/app.js', 'utf8');
  function grab(name) {
    const i = s.indexOf('function ' + name); const j = s.indexOf('{', i); let d = 0, k = j;
    while (true) { if (s[k] === '{') d++; else if (s[k] === '}') { d--; if (d === 0) break; } k++; }
    return s.slice(i, k + 1);
  }
  const bi = s.indexOf('var BV_BANDS');
  const bands = s.slice(bi, s.indexOf('};', bi) + 2);
  const parts = ['mulberry32', 'neighborsOf', 'makeLayout', 'computeNums', 'makeFirstSafe', 'computeBVWeights', 'bv3OfLayout', 'finalizeFirstClick'].map(grab);
  const m = { exports: {} };
  new Function('module', 'exports', bands + '\n' + parts.join('\n') + '\n;module.exports = { BV_BANDS, makeLayout, neighborsOf, finalizeFirstClick, bv3OfLayout };')(m, m.exports);
  return m.exports;
}
(async () => {
  // ===== D1 =====
  const S = loadSudoku();
  const hard = S.DIFFICULTIES.find(d => d.id === 'hard');
  ok('D1：9 困難目標帶 = [22,25]', JSON.stringify(hard.targets[9]) === '[22,25]');
  ok('D1：其餘帶不動（4 困難 [3,4]、16 困難 [98,108]、9 普通 [27,32]）', JSON.stringify(hard.targets[4]) === '[3,4]' && JSON.stringify(hard.targets[16]) === '[98,108]' && JSON.stringify(S.DIFFICULTIES.find(d => d.id === 'medium').targets[9]) === '[27,32]');
  let inBand = 0; const GN = 40;
  for (let i = 0; i < GN; i++) {
    const r = await S.generateSudokuAsync(9, 'hard', null, S.mulberry32(555000 + i));
    const gv = r.cells.filter(c => c.isGiven).length;
    if (gv >= 22 && gv <= 25) inBand++;
  }
  ok(`D1：9 困難生成落新帶率（守衛樣本 ${GN}）≥ 70%`, inBand / GN >= 0.7, inBand + '/' + GN);
  // ===== D3 =====
  const H = loadHashi();
  ok('D3：GEN_BANDS 僅 L1–L3（無 daily/custom/4/5）', JSON.stringify(Object.keys(H.HASHI_PUZZLE.GEN_BANDS)) === '["1","2","3"]');
  const LEVELS = { 1: { id: 1, width: 5, height: 5 }, 2: { id: 2, width: 10, height: 10 }, 3: { id: 3, width: 10, height: 20 } };
  for (const id of [1, 2, 3]) {
    let allIn = true, att = [];
    for (let i = 0; i < 30; i++) {
      const p = H.HASHI_PUZZLE.generateUniqueHashi(LEVELS[id], H.HASHI_PUZZLE.mulberry32(777000 + id * 1000 + i));
      if (!H.HASHI_PUZZLE.puzzleInBand(p, LEVELS[id])) allIn = false;
      att.push(H.HASHI_PUZZLE.lastGenStats.attempts);
    }
    ok(`D3：L${id} 出貨題 100% 落帶（30 題）`, allIn, 'attempts 均值 ' + (att.reduce((a, b) => a + b, 0) / att.length).toFixed(2));
  }
  const p5 = H.HASHI_PUZZLE.generateUniqueHashi({ id: 5, width: 20, height: 20 }, H.HASHI_PUZZLE.mulberry32(424242));
  ok('D3：L5 不套帶仍可生成且 stats 有記錄', !!p5 && H.HASHI_PUZZLE.lastGenStats && H.HASHI_PUZZLE.lastGenStats.outOfBand === 0);
  const pd = H.HASHI_PUZZLE.generateUniqueHashi({ id: 'daily', width: 10, height: 10 }, H.HASHI_PUZZLE.mulberry32(999));
  ok('D3：每日（id daily）不套帶、正常生成', !!pd && H.HASHI_PUZZLE.lastGenStats.outOfBand === 0);
  // ===== D4 =====
  const M = loadMines();
  ok('D4：BV_BANDS = {9:[10,22], 16:[52,81]}', JSON.stringify(M.BV_BANDS) === '{"9":[10,22],"16":[52,81]}');
  for (const [sid, w, h, mines, band] of [[9, 9, 9, 10, [10, 22]], [16, 16, 16, 40, [52, 81]]]) {
    let inB = 0, capped = 0, safeOk = 0, minesOk = 0, maxTries = 0; const TN = 60;
    for (let i = 0; i < TN; i++) {
      const seed = 20261111 + i * 131;
      const L0 = M.makeLayout(w, h, mines, seed);
      const click = Math.floor(w * h / 2);
      const fin = M.finalizeFirstClick(w, h, mines, sid, seed, L0, click, null);
      if (fin.dist === 0) inB++; else capped++;
      if (fin.tries > maxTries) maxTries = fin.tries;
      const zone = [click, ...M.neighborsOf(w, h, click)];
      if (zone.every(z => !fin.layout[z])) safeOk++;
      if (fin.layout.filter(Boolean).length === mines) minesOk++;
    }
    ok(`D4：${w}×${h} 最終盤 3BV 落帶 ≥97%（上限取近似 <3%）`, inB / TN >= 0.97, inB + '/' + TN + '、maxTries ' + maxTries);
    ok(`D4：${w}×${h} 首擊圈安全 100%＋雷數守恆 100%`, safeOk === TN && minesOk === TN);
  }
  const Lc = M.makeLayout(12, 12, 20, 777);
  const finC = M.finalizeFirstClick(12, 12, 20, 'custom', 777, Lc, 66, null);
  ok('D4：自訂盤不套帶（tries=1、直接採用首擊安全結果）', finC.tries === 1 && finC.seedUsed === 777);
  console.log(`\n=== genbands: ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
