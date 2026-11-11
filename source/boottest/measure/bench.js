// 量測前基準：每組合 3 樣本計時（決定正式 N）
const fs = require('fs');
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
(async () => {
  const S = loadSudoku();
  for (const sizeId of [4, 9, 16]) for (const diffId of ['easy', 'medium', 'hard']) {
    const ts = [];
    for (let i = 0; i < 3; i++) {
      const rng = S.mulberry32(1234567 + sizeId * 1000 + i);
      const t0 = Date.now();
      const r = await S.generateSudokuAsync(sizeId, diffId, null, rng);
      ts.push(Date.now() - t0);
      if (i === 0) console.log(`sudoku ${sizeId} ${diffId}: givens=${r.cells.filter(c => c.isGiven).length}`);
    }
    console.log(`sudoku ${sizeId} ${diffId}: avg ${Math.round(ts.reduce((a, b) => a + b, 0) / ts.length)}ms [${ts.join(',')}]`);
  }
  const H = loadHashi();
  const LEVELS = [{ id: 1, width: 5, height: 5 }, { id: 2, width: 10, height: 10 }, { id: 3, width: 10, height: 20 }, { id: 4, width: 15, height: 15 }, { id: 5, width: 20, height: 20 }];
  for (const lv of LEVELS) {
    const ts = []; let att = [];
    for (let i = 0; i < 3; i++) {
      const rng = H.HASHI_PUZZLE.mulberry32(7654321 + lv.id * 1000 + i);
      const t0 = Date.now(); let a = 0, p = null;
      while (a < 300) { a++; p = H.HASHI_PUZZLE.generateRandomHashi(lv, rng); if (H.HASHI_SOLVER.countSolutions(p, 2).count === 1) break; }
      ts.push(Date.now() - t0); att.push(a);
    }
    console.log(`hashi L${lv.id} ${lv.width}x${lv.height}: avg ${Math.round(ts.reduce((a, b) => a + b, 0) / ts.length)}ms attempts [${att.join(',')}]`);
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
