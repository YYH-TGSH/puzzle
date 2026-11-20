// Akari 難度帶守恆（node）：出貨參數（wallTarget/strip 0.5）× N=60/尺寸（akari-bands-* 種子，與量測種子分開）
// 斷言：唯一解 100%、生成成功 100%、牆密度/數字牆比均值在帶內、guesses p50 不超上限、T1 占比不超上限（大盤防太易）、生成 p90 ≤2s
const A = require('/home/hatch/workspace/akari-site/js/engine.js');
let pass = 0, fail = 0; const fails = [];
function ok(c, label, extra) { if (c) { pass++; console.log('✅', label); } else { fail++; fails.push(label); console.log('❌', label, extra || ''); } }
const BANDS = {
  7: { wallTarget: 0.20, wallMean: [0.19, 0.27], numMeanMin: 0.50, g50Max: 4, t1Max: 1.0, t3Max: 0.25 },
  10: { wallTarget: 0.22, wallMean: [0.20, 0.28], numMeanMin: 0.45, g50Max: 10, t1Max: 0.25, t3Max: 1.0 },
  12: { wallTarget: 0.24, wallMean: [0.21, 0.29], numMeanMin: 0.40, g50Max: 16, t1Max: 0.15, t3Max: 1.0 }
};
for (const sz of [7, 10, 12]) {
  const B = BANDS[sz], N = 60;
  let okN = 0, uniq = 0; const wallD = [], numR = [], guess = [], ms = [];
  for (let s = 1; s <= N; s++) {
    const seed = A.hashSeed('akari-bands-' + sz + '-' + s);
    const t0 = Date.now();
    const p = A.generate(sz, sz, { wallTarget: B.wallTarget, stripRatio: 0.5 }, seed);
    ms.push(Date.now() - t0);
    if (!p) continue;
    okN++;
    if (A.solveCount(sz, sz, p.walls, p.numbers, 2).count === 1) uniq++;
    wallD.push(p.walls.size / (sz * sz));
    numR.push(p.numbers.size / Math.max(1, p.walls.size));
    guess.push(A.solveCount(sz, sz, p.walls, p.numbers, 2).guesses);
  }
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const sorted = [...guess].sort((a, b) => a - b), g50 = sorted[Math.floor(sorted.length / 2)];
  const t1 = guess.filter(g => g === 0).length / N, t3 = guess.filter(g => g > 10).length / N;
  const msS = [...ms].sort((a, b) => a - b), p90 = msS[Math.floor(msS.length * 0.9)];
  ok(okN === N, sz + '×' + sz + ' 生成成功 100%（' + okN + '/' + N + '）');
  ok(uniq === N, sz + '×' + sz + ' 唯一解 100%（' + uniq + '/' + N + '）');
  ok(mean(wallD) >= B.wallMean[0] && mean(wallD) <= B.wallMean[1], sz + '×' + sz + ' 牆密度均值在帶內（' + mean(wallD).toFixed(3) + '）');
  ok(mean(numR) >= B.numMeanMin, sz + '×' + sz + ' 數字牆比均值 ≥' + B.numMeanMin + '（' + mean(numR).toFixed(3) + '）');
  ok(g50 <= B.g50Max, sz + '×' + sz + ' guesses p50 ≤' + B.g50Max + '（' + g50 + '）');
  ok(t1 <= B.t1Max, sz + '×' + sz + ' T1 占比 ≤' + B.t1Max + '（' + t1.toFixed(2) + '）');
  ok(t3 <= B.t3Max, sz + '×' + sz + ' T3 占比 ≤' + B.t3Max + '（' + t3.toFixed(2) + '）');
  ok(p90 <= 2000, sz + '×' + sz + ' 生成 p90 ≤2s（' + p90 + 'ms）');
  // 同 seed 同題
  const pa = A.generate(sz, sz, { wallTarget: B.wallTarget, stripRatio: 0.5 }, 777);
  const pb = A.generate(sz, sz, { wallTarget: B.wallTarget, stripRatio: 0.5 }, 777);
  ok(JSON.stringify([...pa.walls]) === JSON.stringify([...pb.walls]) && JSON.stringify([...pa.numbers]) === JSON.stringify([...pb.numbers]), sz + '×' + sz + ' 同 seed 同題');
}
console.log('==== AKARI-BANDS: ' + pass + ' passed, ' + fail + ' failed ====');
if (fails.length) console.log('fails:', fails.join(' | '));
process.exit(fail ? 1 : 0);
