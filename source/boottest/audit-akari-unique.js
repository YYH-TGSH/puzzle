// 美術燈唯一解壓力稽核（v1.73.0 項3）：獨立 solver（exact-cover 式回溯，與引擎 solveCount 的傳播式求解不同路徑）
// 樣本：三尺寸×隨機種子 300、多人 derive 路徑 200、2026 全年每日種子 365。判定：獨立 solver 數解（上限 2）＋引擎 isSolved 驗產生器自帶解
const fs = require('fs');
const Akari = require('/home/hatch/workspace/akari-site/js/engine.js');
if (!Akari || !Akari.generate) { console.error('engine load failed'); process.exit(1); }

const SIZES = { 7: { w: 7, h: 7, wallTarget: 0.22, stripRatio: 0.5 }, 10: { w: 10, h: 10, wallTarget: 0.23, stripRatio: 0.5 }, 12: { w: 12, h: 12, wallTarget: 0.24, stripRatio: 0.5 } };
// 尺寸參數以 app.js SIZES 為準（稽核時讀 app 源碼核對）
const appSrc = fs.readFileSync('/home/hatch/workspace/akari-site/js/app.js', 'utf8');
for (const id of [7, 10, 12]) {
  const m = new RegExp(id + ": \\{ id: " + id + ", w: " + id + ", h: " + id + ", wallTarget: ([\\d.]+), stripRatio: ([\\d.]+)").exec(appSrc);
  if (m) { SIZES[id].wallTarget = parseFloat(m[1]); SIZES[id].stripRatio = parseFloat(m[2]); }
}
console.log('SIZES:', JSON.stringify(SIZES));

// ---------- 獨立 solver：exact-cover 式回溯（選未照亮格→枚舉能照它的候選放燈；數字牆界限剪枝；數解上限 cap） ----------
function independentCount(w, h, walls, numbers, cap, nodeCap) {
  const N = w * h, wall = new Uint8Array(N);
  walls.forEach(i => { wall[i] = 1; });
  const num = new Int8Array(N).fill(-1);
  numbers.forEach((n, i) => { num[i] = n; });
  // 每格的段（同行/列被牆切開的連續段）與能照到它的位置集合
  const segOf = new Array(N);
  for (let i = 0; i < N; i++) {
    if (wall[i]) { segOf[i] = null; continue; }
    const set = new Set([i]);
    let x = i % w, y = (i / w) | 0, j;
    for (j = i - 1; j >= 0 && (j / w | 0) === y && !wall[j]; j--) set.add(j);
    for (j = i + 1; j < N && (j / w | 0) === y && !wall[j]; j++) set.add(j);
    for (j = i - w; j >= 0 && !wall[j]; j -= w) set.add(j);
    for (j = i + w; j < N && !wall[j]; j += w) set.add(j);
    segOf[i] = [...set];
  }
  const numWalls = [];
  numbers.forEach((n, wi) => { numWalls.push({ wi, n, nb: [] }); });
  const nbOf = i => { const x = i % w, y = (i / w) | 0, o = []; if (x > 0) o.push(i - 1); if (x < w - 1) o.push(i + 1); if (y > 0) o.push(i - w); if (y < h - 1) o.push(i + w); return o; };
  numWalls.forEach(e => { e.nb = nbOf(e.wi).filter(j => !wall[j]); });
  let nodes = 0, solutions = 0, aborted = false;
  const bulb = new Uint8Array(N), forb = new Uint8Array(N);
  function numOk() {
    for (const e of numWalls) {
      let c = 0, open = 0;
      for (const j of e.nb) { if (bulb[j]) c++; else if (!forb[j]) open++; }
      if (c > e.n || c + open < e.n) return false;
    }
    return true;
  }
  function dfs() {
    if (solutions >= cap || aborted) return;
    if (++nodes > nodeCap) { aborted = true; return; }
    // 找第一個未照亮格
    let target = -1;
    const lit = new Uint8Array(N);
    for (let i = 0; i < N; i++) if (bulb[i]) { lit[i] = 1; for (const j of segOf[i]) lit[j] = 1; }
    for (let i = 0; i < N; i++) if (!wall[i] && !lit[i]) { target = i; break; }
    if (target < 0) { // 全照亮：再驗數字牆恰等（numOk 只驗界限，結尾驗恰等）
      for (const e of numWalls) { let c = 0; for (const j of e.nb) if (bulb[j]) c++; if (c !== e.n) return; }
      solutions++; return;
    }
    // 候選：能照到 target、未禁、放了不互斥（其段內無既有燈）。
    // 序位分割（防同解重複計數）：依序試候選，第 k 分支＝「前 k-1 個候選全排除＋第 k 個放燈」——分支互斥且完備，每組解恰計一次。
    const savedForb = [];
    for (const c of segOf[target]) {
      if (forb[c] || bulb[c]) continue;
      let clash = false;
      for (const j of segOf[c]) if (bulb[j]) { clash = true; break; }
      if (clash) continue;
      bulb[c] = 1;
      const newly = [];
      for (const j of segOf[c]) if (j !== c && !forb[j]) { forb[j] = 1; newly.push(j); }
      if (numOk()) dfs();
      bulb[c] = 0;
      for (const j of newly) forb[j] = 0;
      if (solutions >= cap || aborted) { for (const j of savedForb) forb[j] = 0; return; }
      forb[c] = 1; savedForb.push(c); // 後續分支排除此候選
    }
    for (const j of savedForb) forb[j] = 0;
  }
  dfs();
  return { count: solutions, nodes, aborted };
}

// solver 自驗（先有牙齒才准下結論）：已知唯一題（seed 722562122，引擎 solveCount=1）必回 1；3x3 全空盤（多解）必回 cap=2
{
  const p = Akari.generate(7, 7, { wallTarget: SIZES[7].wallTarget, stripRatio: SIZES[7].stripRatio }, 722562122);
  const r1 = independentCount(7, 7, p.walls, p.numbers, 2, 300000);
  const r2 = independentCount(3, 3, new Set(), new Map(), 2, 300000);
  console.log('solver self-test: unique puzzle count =', r1.count, '| empty 3x3 count =', r2.count);
  if (r1.count !== 1 || r2.count !== 2) { console.error('SOLVER SELF-TEST FAILED — 稽核中止'); process.exit(2); }
}
let total = 0, nonUnique = [], inconclusive = [], badSelfSolution = [], genNull = 0;
const t0 = Date.now();
function auditOne(p, tag) {
  total++;
  if (!p) { genNull++; return; }
  const walls = p.walls instanceof Set ? p.walls : new Set(p.walls);
  const numbers = p.numbers instanceof Map ? p.numbers : new Map(p.numbers);
  const sol = p.solution instanceof Set ? p.solution : new Set(p.solution);
  if (!Akari.isSolved(p.w, p.h, walls, numbers, sol)) badSelfSolution.push(tag);
  const r = independentCount(p.w, p.h, walls, numbers, 2, 300000);
  if (r.aborted) inconclusive.push(tag + ' nodes>' + 300000);
  else if (r.count !== 1) nonUnique.push(tag + ' count=' + r.count);
}

// A) 三尺寸 × 隨機種子 300（generate 直呼，同單機/多人產生函數）
for (const id of [7, 10, 12]) {
  const sp = SIZES[id];
  for (let k = 0; k < 300; k++) {
    const seed = (0x9e3779b9 ^ (id * 1000003) ^ (k * 2654435761)) >>> 0;
    auditOne(Akari.generate(sp.w, sp.h, { wallTarget: sp.wallTarget, stripRatio: sp.stripRatio }, seed), 'gen-' + id + '-seed' + seed);
  }
  console.log('A size', id, 'done, total', total, 'elapsed', ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
// B) 多人 derive 路徑：種子失敗 +1 重試（同 app derivePuzzle，最多 6 次）
for (let k = 0; k < 200; k++) {
  const id = [7, 10, 12][k % 3], sp = SIZES[id];
  let sd = (1234567 + k * 98765431) >>> 0, p = null;
  for (let t = 0; t < 6 && !p; t++) { p = Akari.generate(sp.w, sp.h, { wallTarget: sp.wallTarget, stripRatio: sp.stripRatio }, sd); if (!p) sd = (sd + 1) >>> 0; }
  auditOne(p, 'mp-' + id + '-seed' + sd);
}
console.log('B mp done, total', total);
// C) 2026 全年每日種子（10×10 每日規格）
{
  const sp = SIZES[10];
  const d = new Date('2026-01-01T12:00:00');
  for (let k = 0; k < 365; k++) {
    const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const seed = Akari.hashSeed('akari-daily-' + ds);
    auditOne(Akari.generate(sp.w, sp.h, { wallTarget: sp.wallTarget, stripRatio: sp.stripRatio }, seed), 'daily-' + ds);
    d.setDate(d.getDate() + 1);
  }
}
console.log('C daily done, total', total);
console.log('==== AUDIT RESULT ====');
console.log('total puzzles:', total, '| gen null:', genNull, '| elapsed:', ((Date.now() - t0) / 1000).toFixed(1) + 's');
console.log('non-unique:', nonUnique.length, nonUnique.slice(0, 10));
console.log('inconclusive (node cap):', inconclusive.length, inconclusive.slice(0, 10));
console.log('self-solution invalid:', badSelfSolution.length, badSelfSolution.slice(0, 5));
process.exit(nonUnique.length || inconclusive.length || badSelfSolution.length ? 1 : 0);
