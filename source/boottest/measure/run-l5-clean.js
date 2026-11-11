// S6 補量：數橋 L5 genMs 乾淨值（同 Round 2 種子協議、僅跑 L5、無並行負載、checkpoint 逐 50 題落盤）
const fs = require('fs');
const OUT = __dirname + '/perf-l5.json';
const w = {};
new Function('window', fs.readFileSync(__dirname + '/hashi-solver.js', 'utf8'))(w);
new Function('window', fs.readFileSync(__dirname + '/hashi-puzzle.js', 'utf8'))(w);
const H = w.HASHI_PUZZLE;
const lv = { id: 5, name: '20x20 史詩', width: 20, height: 20 };
const BASE = 20261111, N = 300;
let out = { meta: { combo: 'hashi-L5-clean', n: N, startedAt: new Date().toISOString() }, genMs: [] };
try { const prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); if (prev && Array.isArray(prev.genMs)) out = prev; } catch (e) {}
function stats(a) { const s = [...a].sort((x, y) => x - y); const q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))]; const mean = a.reduce((x, y) => x + y, 0) / a.length; return { mean: +mean.toFixed(1), p50: q(0.5), p90: q(0.9), max: s[s.length - 1], min: s[0] }; }
for (let i = out.genMs.length; i < N; i++) {
  const rng = H.mulberry32(BASE + (100 + 4) * 100003 + i); // li=4 → L5（與 run-measure2 同協議）
  const t0 = process.hrtime.bigint();
  H.generateUniqueHashi(lv, rng);
  out.genMs.push(Number(process.hrtime.bigint() - t0) / 1e6);
  if (i % 50 === 49) { out.stats = stats(out.genMs); out.meta.updatedAt = new Date().toISOString(); fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); console.log('checkpoint', i + 1, JSON.stringify(out.stats)); }
}
out.stats = stats(out.genMs); out.meta.doneAt = new Date().toISOString();
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('DONE L5 clean', JSON.stringify(out.stats));
