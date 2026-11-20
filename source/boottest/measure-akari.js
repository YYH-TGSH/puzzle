// Akari S5 式量測：固定種子 N=300/尺寸，量牆密度、數字牆比例、求解 guesses（技巧層級代理）、生成時間
const A = require('/home/hatch/workspace/akari-site/js/engine.js');
function stats(arr) { const s = [...arr].sort((a, b) => a - b); const q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))]; const mean = s.reduce((a, b) => a + b, 0) / (s.length || 1); return { mean: +mean.toFixed(2), p50: q(0.5), p90: q(0.9), max: s[s.length - 1] }; }
function tier(g) { return g === 0 ? 'T1' : (g <= 10 ? 'T2' : 'T3'); }
const out = {};
for (const cfg of [
  { size: 7, wallTarget: 0.20, strips: [0.3, 0.5, 0.7] },
  { size: 10, wallTarget: 0.22, strips: [0.3, 0.5, 0.7] },
  { size: 12, wallTarget: 0.24, strips: [0.3, 0.5, 0.7] },
]) {
  for (const strip of cfg.strips) {
    const N = 300; let ok = 0; const wallD = [], numR = [], guess = [], ms = [], bulbs = [];
    for (let s = 1; s <= N; s++) {
      const seed = A.hashSeed('akari-measure-' + cfg.size + '-' + s);
      const t0 = process.hrtime.bigint();
      const p = A.generate(cfg.size, cfg.size, { wallTarget: cfg.wallTarget, stripRatio: strip }, seed);
      ms.push(Number(process.hrtime.bigint() - t0) / 1e6);
      if (!p) continue;
      ok++;
      wallD.push(p.walls.size / (cfg.size * cfg.size));
      numR.push(p.numbers.size / Math.max(1, p.walls.size));
      bulbs.push(p.solution.size);
      guess.push(A.solveCount(cfg.size, cfg.size, p.walls, p.numbers, 2).guesses);
    }
    const tiers = { T1: 0, T2: 0, T3: 0 }; guess.forEach(g => tiers[tier(g)]++);
    const key = cfg.size + 'x' + cfg.size + ' strip' + strip;
    out[key] = { success: ok + '/' + N, wallDensity: stats(wallD), numRatio: stats(numR), bulbs: stats(bulbs), guesses: stats(guess), tiers, genMs: stats(ms) };
    console.log(key, JSON.stringify(out[key]));
  }
}
require('fs').writeFileSync('/home/hatch/workspace/boottest/akari-measure.json', JSON.stringify(out, null, 2));
