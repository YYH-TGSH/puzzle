// 美術燈 Akari 引擎（平台第四款）：產生器（解答先行＋唯一解驗證＋冗餘移除）、求解器（限制傳播＋回溯、計數封頂）、
// 光照/進度計算。純邏輯、無 DOM；瀏覽器以 classic script 載入掛 window.Akari，node 測試以 module.exports 取用。
// 確定性：所有隨機來自種子 RNG（mulberry32）；同 seed＋同尺寸＋同參數 → 同題。
(function () {
  'use strict';
  function hashSeed(str) { var h = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function makeRng(seed) { var a = (seed >>> 0) || 1; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(arr, rng) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function idx(x, y, w) { return y * w + x; }
  function xy(i, w) { return [i % w, Math.floor(i / w)]; }
  // 從一格沿四方向走到撞牆為止（含起點）的所有格
  function rayCells(w, h, walls, i) {
    var p = xy(i, w), x = p[0], y = p[1], out = [i], d, nx, ny, ni;
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (d = 0; d < 4; d++) { nx = x; ny = y; for (;;) { nx += dirs[d][0]; ny += dirs[d][1]; if (nx < 0 || ny < 0 || nx >= w || ny >= h) break; ni = idx(nx, ny, w); if (walls.has(ni)) break; out.push(ni); } }
    return out;
  }
  function neighbors4(w, h, i) { var p = xy(i, w), x = p[0], y = p[1], out = []; if (x > 0) out.push(i - 1); if (x < w - 1) out.push(i + 1); if (y > 0) out.push(i - w); if (y < h - 1) out.push(i + w); return out; }
  // bulbs(Set) 在 walls(Set) 下照亮的格集合（含燈本身）
  function litCells(w, h, walls, bulbs) {
    var lit = new Set();
    bulbs.forEach(function (b) { if (walls.has(b)) return; var rc = rayCells(w, h, walls, b); for (var k = 0; k < rc.length; k++) lit.add(rc[k]); });
    return lit;
  }
  // 完整驗證一組放燈是否合法完賽（①全照亮 ②互不照 ③數字牆吻合）
  function isSolved(w, h, walls, numbers, bulbs) {
    var i, lit = litCells(w, h, walls, bulbs);
    for (i = 0; i < w * h; i++) { if (walls.has(i)) continue; if (!lit.has(i)) return false; }
    var seen = new Set();
    var ok = true;
    bulbs.forEach(function (b) { var rc = rayCells(w, h, walls, b); for (var k = 1; k < rc.length; k++) { if (bulbs.has(rc[k])) ok = false; } });
    if (!ok) return false;
    numbers.forEach(function (n, wi) { var nb = neighbors4(w, h, wi), c = 0; for (var k = 0; k < nb.length; k++) if (bulbs.has(nb[k])) c++; if (c !== n) return; });
    // numbers.forEach 無法中斷：改用顯式檢查
    var bad = false;
    numbers.forEach(function (n, wi) { var nb = neighbors4(w, h, wi), c = 0; for (var k = 0; k < nb.length; k++) if (bulbs.has(nb[k])) c++; if (c !== n) bad = true; });
    return !bad;
  }
  // ---- 求解器：狀態 0=未定 1=燈 2=禁放（叉）；傳播：數字牆界限、燈互斥（同線禁放）、覆蓋強制（某格只剩一個能照它的位置→必放） ----
  function solveCount(w, h, walls, numbers, cap) {
    var N = w * h;
    var wallArr = new Uint8Array(N);
    walls.forEach(function (i) { wallArr[i] = 1; });
    var numArr = new Int8Array(N).fill(-1);
    numbers.forEach(function (n, i) { numArr[i] = n; });
    // 預算每格的 ray（不含牆）
    var rays = new Array(N), i, j;
    for (i = 0; i < N; i++) rays[i] = wallArr[i] ? null : rayCells(w, h, walls, i);
    // 能照到 i 的候選位置（含 i 本人）＝ i 所在行列段
    var coverers = new Array(N);
    for (i = 0; i < N; i++) { if (wallArr[i]) { coverers[i] = null; continue; } var set = new Set(); for (j = 0; j < rays[i].length; j++) set.add(rays[i][j]); coverers[i] = Array.from(set); }
    var guesses = 0, solutions = 0, firstSolution = null, solList = [];
    function propagate(st) {
      // 回傳 false=矛盾
      var changed = true, i2, k2;
      while (changed) {
        changed = false;
        // 燈互斥：燈的 ray 上其他格全禁放
        for (i2 = 0; i2 < N; i2++) {
          if (st[i2] !== 1) continue;
          var rc = rays[i2];
          for (k2 = 0; k2 < rc.length; k2++) { var t = rc[k2]; if (t !== i2 && st[t] === 0) { st[t] = 2; changed = true; } else if (t !== i2 && st[t] === 1) return false; }
        }
        // 數字牆
        for (i2 = 0; i2 < N; i2++) {
          if (numArr[i2] < 0) continue;
          var nb = neighbors4(w, h, i2), bulbs = 0, unk = [];
          for (k2 = 0; k2 < nb.length; k2++) { if (wallArr[nb[k2]]) continue; if (st[nb[k2]] === 1) bulbs++; else if (st[nb[k2]] === 0) unk.push(nb[k2]); }
          if (bulbs > numArr[i2] || bulbs + unk.length < numArr[i2]) return false;
          if (bulbs === numArr[i2]) { for (k2 = 0; k2 < unk.length; k2++) { st[unk[k2]] = 2; changed = true; } }
          else if (bulbs + unk.length === numArr[i2]) { for (k2 = 0; k2 < unk.length; k2++) { st[unk[k2]] = 1; changed = true; } }
        }
        // 覆蓋：每格至少要被照亮——算「還能照到 i 的未定/燈位置」
        for (i2 = 0; i2 < N; i2++) {
          if (wallArr[i2]) continue;
          var cov = coverers[i2], lit = false, cand = [];
          for (k2 = 0; k2 < cov.length; k2++) { var c = cov[k2]; if (st[c] === 1) { lit = true; break; } if (st[c] === 0) cand.push(c); }
          if (lit) continue;
          if (!cand.length) return false;
          if (cand.length === 1 && st[cand[0]] === 0) { st[cand[0]] = 1; changed = true; }
        }
      }
      return true;
    }
    function search(st) {
      if (solutions >= cap) return;
      if (!propagate(st)) return;
      // 找未定格（挑候選最少的未照格優先：用第一個未定格即可，傳播已強）
      var pick = -1;
      for (var i2 = 0; i2 < N; i2++) { if (!wallArr[i2] && st[i2] === 0) { pick = i2; break; } }
      if (pick < 0) {
        // 全部定案：驗證全照亮
        var bulbs = new Set(); for (var i3 = 0; i3 < N; i3++) if (st[i3] === 1) bulbs.add(i3);
        if (isSolved(w, h, walls, numbers, bulbs)) { solutions++; if (!firstSolution) firstSolution = bulbs; solList.push(bulbs); }
        return;
      }
      guesses++;
      var s1 = Uint8Array.from(st); s1[pick] = 1; search(s1);
      if (solutions >= cap) return;
      var s2 = Uint8Array.from(st); s2[pick] = 2; search(s2);
    }
    var st0 = new Uint8Array(N);
    search(st0);
    return { count: solutions, solution: firstSolution, solutions: solList, guesses: guesses };
  }
  // ---- 產生器（解答先行）----
  // opts: { wallTarget: 牆數目標, numRatio: 數字牆比例 0..1, stripPasses: 冗餘移除積極度（嘗試移除的牆/數字比例上限） }
  function generateCore(w, h, opts, rng) {
    var N = w * h, i;
    // 1) 先佈牆（隨機抽到目標密度；不需驗覆蓋——燈在牆之後才放）
    var walls = new Set();
    var candAll = shuffle(Array.from({ length: N }, function (_, k) { return k; }), rng);
    var want = Math.round(N * opts.wallTarget);
    for (i = 0; i < candAll.length && walls.size < want; i++) walls.add(candAll[i]);
    // 2) 牆間隨機極大佈燈（ray 被牆截斷）：極大性保證全覆蓋（未亮格放燈必合法、除非它看得到燈＝已被照亮），且各行列段可多燈、燈數自然多樣
    var bulbs = new Set(), blocked = new Uint8Array(N);
    var order = shuffle(Array.from({ length: N }, function (_, k) { return k; }).filter(function (k) { return !walls.has(k); }), rng);
    for (i = 0; i < order.length; i++) {
      var c = order[i];
      if (blocked[c]) continue;
      bulbs.add(c);
      var rc0 = rayCells(w, h, walls, c);
      for (var k = 0; k < rc0.length; k++) blocked[rc0[k]] = 1;
    }
    // 3) 數字牆：先全數賦予（數字由解答相鄰燈數決定）；要減少靠後段冗餘移除（改素牆）
    var numbers = new Map();
    walls.forEach(function (wi) { var nb = neighbors4(w, h, wi), cnt = 0; for (var m = 0; m < nb.length; m++) if (bulbs.has(nb[m])) cnt++; numbers.set(wi, cnt); });
    // 4) 唯一化修復：求解器找到別解時，在「別解有燈、解答沒燈」的格上加牆（解答須仍合法），迭代到唯一
    var repaired = false;
    for (var rep = 0; rep < 40; rep++) {
      var chk = solveCount(w, h, walls, numbers, 3);
      if (chk.count === 1) { repaired = true; break; }
      if (chk.count === 0) return null;
      var alt = null;
      for (var si = 0; si < chk.solutions.length; si++) { var cand = chk.solutions[si]; var same = cand.size === bulbs.size; if (same) { cand.forEach(function (b) { if (!bulbs.has(b)) same = false; }); } if (!same) { alt = cand; break; } }
      if (!alt) return null; // count>=2 卻找不到別解（不應發生）
      var diffCells = [];
      alt.forEach(function (b) { if (!bulbs.has(b)) diffCells.push(b); });
      diffCells = shuffle(diffCells, rng);
      var fixed = false;
      for (var di = 0; di < diffCells.length; di++) {
        var dc = diffCells[di];
        walls.add(dc);
        var nb2 = neighbors4(w, h, dc), cnt2 = 0; for (var m2 = 0; m2 < nb2.length; m2++) if (bulbs.has(nb2[m2])) cnt2++;
        numbers.set(dc, cnt2);
        if (isSolved(w, h, walls, numbers, bulbs)) { fixed = true; break; }
        walls.delete(dc); numbers.delete(dc);
      }
      if (!fixed) return null;
    }
    if (!repaired) return null;
    // 5) 冗餘移除：隨機順序試移除數字（改素牆）與移除牆（改空格）；仍唯一才保留移除
    var stripBudget = Math.floor((numbers.size + walls.size) * (opts.stripRatio != null ? opts.stripRatio : 0.5));
    var tries = [];
    numbers.forEach(function (_, wi2) { tries.push(['n', wi2]); });
    walls.forEach(function (wi2) { if (!numbers.has(wi2)) tries.push(['w', wi2]); });
    tries = shuffle(tries, rng);
    for (i = 0; i < tries.length && stripBudget > 0; i++) {
      var kind = tries[i][0], cell = tries[i][1];
      if (kind === 'n') {
        if (!numbers.has(cell)) continue;
        var savedN = numbers.get(cell); numbers.delete(cell);
        if (solveCount(w, h, walls, numbers, 2).count !== 1) numbers.set(cell, savedN); else stripBudget--;
      } else {
        if (!walls.has(cell)) continue;
        walls.delete(cell);
        if (!isSolved(w, h, walls, numbers, bulbs) || solveCount(w, h, walls, numbers, 2).count !== 1) walls.add(cell); else stripBudget--;
      }
    }
    return { w: w, h: h, walls: walls, numbers: numbers, solution: bulbs };
  }
  // 分片 job：attempt 為片（每次 step 跑一個完整 attempt；attempt 內部以求解次數為主成本，12×12 實測足夠細）
  function createGenerateJob(w, h, opts, seed, maxAttempts) {
    var rng = makeRng(seed >>> 0);
    var attempts = 0, cap = maxAttempts || 40, result = null;
    return {
      step: function () {
        if (result) return true;
        attempts++;
        var p = generateCore(w, h, opts, rng);
        if (p) { p.attempts = attempts; result = p; return true; }
        return attempts >= cap;
      },
      get result() { return result; },
      get attempts() { return attempts; },
      get exhausted() { return !result && attempts >= cap; }
    };
  }
  function generate(w, h, opts, seed, maxAttempts) {
    var job = createGenerateJob(w, h, opts, seed, maxAttempts);
    while (!job.step()) {}
    return job.result;
  }
  // 進度（嚴格制）：正確燈數 ÷ 解答總燈數
  function progressOf(solution, placed) {
    if (!solution || !solution.size) return 0;
    var c = 0; placed.forEach(function (b) { if (solution.has(b)) c++; });
    return c / solution.size;
  }
  // 即時規則回饋：互照的燈集合、數字牆狀態（'ok'|'over'|'under' 以目前燈數 vs 數字）
  function conflicts(w, h, walls, numbers, bulbs) {
    var bad = new Set();
    bulbs.forEach(function (b) { var rc = rayCells(w, h, walls, b); for (var k = 1; k < rc.length; k++) if (bulbs.has(rc[k])) { bad.add(b); bad.add(rc[k]); } });
    var numState = new Map();
    numbers.forEach(function (n, wi) { var nb = neighbors4(w, h, wi), c = 0; for (var k = 0; k < nb.length; k++) if (bulbs.has(nb[k])) c++; numState.set(wi, c === n ? 'ok' : (c > n ? 'over' : 'under')); });
    return { badBulbs: bad, numState: numState };
  }
  var Akari = { hashSeed: hashSeed, makeRng: makeRng, rayCells: rayCells, neighbors4: neighbors4, litCells: litCells, isSolved: isSolved, solveCount: solveCount, generate: generate, createGenerateJob: createGenerateJob, progressOf: progressOf, conflicts: conflicts };
  if (typeof window !== 'undefined') window.Akari = Akari;
  if (typeof module !== 'undefined' && module.exports) module.exports = Akari;
})();
