// 踩地雷純函式抽取副本（v1.65.0 更新：逐字複製自 mines-site/js/app.js，僅供量測；來源檔未動）
var BV_BANDS = { 9: [10, 22], 16: [52, 81] };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function neighborsOf(w, h, i) {
  var x = i % w, y = Math.floor(i / w), out = [];
  for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    var nx = x + dx, ny = y + dy;
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) out.push(ny * w + nx);
  }
  return out;
}
function makeLayout(w, h, mines, seed) {
  var rnd = mulberry32(seed), n = w * h, idx = [], i, j, t;
  for (i = 0; i < n; i++) idx.push(i);
  for (i = n - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
  var L = new Array(n).fill(false);
  for (i = 0; i < mines; i++) L[idx[i]] = true;
  return L;
}
function computeNums(w, h, L) {
  var N = new Array(w * h).fill(0), i;
  for (i = 0; i < w * h; i++) {
    if (L[i]) { N[i] = -1; continue; }
    var nb = neighborsOf(w, h, i), c = 0;
    for (var k = 0; k < nb.length; k++) if (L[nb[k]]) c++;
    N[i] = c;
  }
  return N;
}
function makeFirstSafe(L, w, h, clickIdx, cells) {
  var zone = {}; zone[clickIdx] = true;
  neighborsOf(w, h, clickIdx).forEach(function (i) { zone[i] = true; });
  var NL = L.slice(), moves = [];
  Object.keys(zone).map(Number).filter(function (i) { return NL[i]; }).sort(function (a, b) { return a - b; }).forEach(function (from) {
    if (cells && cells[from] === 'L') return; // 禮物鎖定旗標住的雷不搬家：搬走會讓旗子孤兒化標在安全格上——鄰格數字全亂、該格永遠開不了（使用者實機截圖回報）
    NL[from] = false;
    var placed = false;
    for (var i = 0; i < NL.length; i++) { if (!zone[i] && !NL[i]) { NL[i] = true; moves.push([from, i]); placed = true; break; } }
    if (!placed) NL[from] = true; // 圈外無空格（本遊戲的雷密度不會發生）：退回原位，不吃掉雷
  });
  return { layout: NL, moves: moves };
}
function computeBVWeights(w, h, L, N) {
  var total = w * h, unitOf = new Array(total).fill(-1), sizes = [];
  for (var s0 = 0; s0 < total; s0++) {
    if (L[s0] || N[s0] !== 0 || unitOf[s0] >= 0) continue;
    var uid = sizes.length, cnt = 1, q = [s0], head = 0;
    unitOf[s0] = uid;
    while (head < q.length) {
      var c = q[head++], nb = neighborsOf(w, h, c);
      for (var j = 0; j < nb.length; j++) { var m = nb[j]; if (!L[m] && unitOf[m] < 0) { unitOf[m] = uid; cnt++; if (N[m] === 0) q.push(m); } }
    }
    sizes.push(cnt);
  }
  for (var i2 = 0; i2 < total; i2++) if (!L[i2] && unitOf[i2] < 0) { unitOf[i2] = sizes.length; sizes.push(1); }
  var weights = new Array(total);
  for (var i3 = 0; i3 < total; i3++) weights[i3] = L[i3] ? 0 : 1 / sizes[unitOf[i3]];
  return { weights: weights, bv: sizes.length };
}
function bv3OfLayout(w, h, L) { return computeBVWeights(w, h, L, computeNums(w, h, L)).bv; }
function finalizeFirstClick(w, h, mines, sizeId, seed, L0, clickIdx, cells) {
  var band = BV_BANDS[sizeId] || null;
  var best = null;
  for (var k = 0; k < 40; k++) {
    var cand = k === 0 ? L0 : makeLayout(w, h, mines, (seed + k) >>> 0);
    var fs = makeFirstSafe(cand, w, h, clickIdx, cells);
    var bv = bv3OfLayout(w, h, fs.layout);
    var dist = !band ? 0 : (bv < band[0] ? band[0] - bv : (bv > band[1] ? bv - band[1] : 0));
    if (!best || dist < best.dist) best = { layout: fs.layout, moves: fs.moves, seedUsed: (seed + k) >>> 0, bv: bv, dist: dist, tries: k + 1 };
    if (dist === 0) break;
  }
  return best;
}
module.exports = { mulberry32, neighborsOf, makeLayout, computeNums, makeFirstSafe, BV_BANDS, bv3OfLayout, finalizeFirstClick };
