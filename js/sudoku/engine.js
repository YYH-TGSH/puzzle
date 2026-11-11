// 數獨引擎：常數、題目生成（唯一解驗證）、求解器、本地存檔
// 由 sudoku-v3.13.4.html 拆出，純邏輯無 JSX，以一般 script 先於 app.js 載入

const COLORS = ['#E3002B', '#F35B00', '#FFC90E', '#D7157A', '#E895C0', '#007A61', '#87D300', '#C4D600', '#8DD1BF', '#616130', '#00538A', '#008CC1', '#00C1D5', '#79C8ED', '#CDBB79', '#41136A', '#935CB9', '#BCA8D1', '#7A0026', '#BC7B70'];
const SUDOKU_SLOT_NAMES = ['柴犬', '柯基', '虎斑貓', '橘貓', '倉鼠', '兔兔', '刺蝟', '龍貓', '水豚', '樹懶', '狐獴', '羊駝', '企鵝', '海獺', '貓頭鷹', '松鼠', '無尾熊', '台灣黑熊', '石虎', '穿山甲', '梅花鹿', '台灣藍鵲', '帝雉', '獼猴', '山羌', '綠蠵龜', '櫻花鉤吻鮭', '飛魚', '螢火蟲', '獨角仙'];
const getAvailableColor = (currentPlayers) => { const usedColors = currentPlayers.map(p => p.color); const available = COLORS.filter(c => !usedColors.includes(c)); return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : COLORS[Math.floor(Math.random() * COLORS.length)]; };

const SIZES = [
    { id: 4, name: "4x4 幼幼班", size: 4, boxW: 2, boxH: 2, chars: ['1', '2', '3', '4'] },
    { id: 9, name: "9x9 標準", size: 9, boxW: 3, boxH: 3, chars: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
    { id: 16, name: "16x16 史詩", size: 16, boxW: 4, boxH: 4, chars: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'] }
];
const DIFFICULTIES = [
    { id: 'easy', name: "🟢 簡單", targets: { 4: [9, 12], 9: [40, 45], 16: [140, 150] } },
    { id: 'medium', name: "🟡 普通", targets: { 4: [6, 7], 9: [27, 32], 16: [105, 120] } },
    // 16×16 困難原訂 70–85 格：隨機挖洞＋唯一解驗證在 30 秒內不可達（實測高原 ~104 格），每局必磨滿 30 秒；校準到 98–108（仍有 148+ 洞）
    { id: 'hard', name: "🔴 困難", targets: { 4: [3, 4], 9: [20, 22], 16: [98, 108] } }
];

const BASE_4 = [[0, 1, 2, 3], [2, 3, 0, 1], [1, 0, 3, 2], [3, 2, 1, 0]];
const BASE_9 = [[0, 1, 2, 3, 4, 5, 6, 7, 8], [3, 4, 5, 6, 7, 8, 0, 1, 2], [6, 7, 8, 0, 1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6, 7, 8, 0], [4, 5, 6, 7, 8, 0, 1, 2, 3], [7, 8, 0, 1, 2, 3, 4, 5, 6], [2, 3, 4, 5, 6, 7, 8, 0, 1], [5, 6, 7, 8, 0, 1, 2, 3, 4], [8, 0, 1, 2, 3, 4, 5, 6, 7]];
const BASE_16 = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3], [8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7], [12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], [1, 2, 3, 0, 5, 6, 7, 4, 9, 10, 11, 8, 13, 14, 15, 12], [5, 6, 7, 4, 9, 10, 11, 8, 13, 14, 15, 12, 1, 2, 3, 0], [9, 10, 11, 8, 13, 14, 15, 12, 1, 2, 3, 0, 5, 6, 7, 4], [13, 14, 15, 12, 1, 2, 3, 0, 5, 6, 7, 4, 9, 10, 11, 8], [2, 3, 0, 1, 6, 7, 4, 5, 10, 11, 8, 9, 14, 15, 12, 13], [6, 7, 4, 5, 10, 11, 8, 9, 14, 15, 12, 13, 2, 3, 0, 1], [10, 11, 8, 9, 14, 15, 12, 13, 2, 3, 0, 1, 6, 7, 4, 5], [14, 15, 12, 13, 2, 3, 0, 1, 6, 7, 4, 5, 10, 11, 8, 9], [3, 0, 1, 2, 7, 4, 5, 6, 11, 8, 9, 10, 15, 12, 13, 14], [7, 4, 5, 6, 11, 8, 9, 10, 15, 12, 13, 14, 3, 0, 1, 2], [11, 8, 9, 10, 15, 12, 13, 14, 3, 0, 1, 2, 7, 4, 5, 6], [15, 12, 13, 14, 3, 0, 1, 2, 7, 4, 5, 6, 11, 8, 9, 10]];
const transpose = (matrix) => matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));

function getSolutionGrid(puzzleCells, sizeDef) {
    const { size, boxW, boxH, chars } = sizeDef;
    const grid = Array(size).fill(null).map(() => Array(size).fill(null));
    puzzleCells.forEach(c => { if (c.isGiven && c.y < size && c.x < size) grid[c.y][c.x] = chars.indexOf(c.value); }); // 邊界守衛：匯入/殘檔格子越界不可寫爆 grid（2026-11-01）

    function getCandidates(y, x, g) {
        let used = Array(size).fill(false);
        for (let i = 0; i < size; i++) { if (g[y][i] !== null) used[g[y][i]] = true; if (g[i][x] !== null) used[g[i][x]] = true; }
        const by = Math.floor(y / boxH) * boxH, bx = Math.floor(x / boxW) * boxW;
        for (let dy = 0; dy < boxH; dy++) for (let dx = 0; dx < boxW; dx++) { let v = g[by + dy][bx + dx]; if (v !== null) used[v] = true; }
        let cands = []; for (let v = 0; v < size; v++) if (!used[v]) cands.push(v); return cands;
    }

    const solveGrid = grid.map(r => [...r]);
    function backtrack(g) {
        let bestY = -1, bestX = -1, minCands = size + 1, bestCands = null;
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
            if (g[y][x] === null) {
                const cands = getCandidates(y, x, g);
                if (cands.length === 0) return false;
                if (cands.length < minCands) { minCands = cands.length; bestY = y; bestX = x; bestCands = cands; if (minCands === 1) break; }
            }
        }
        if (bestY === -1) return true;
        for (let c of bestCands) { g[bestY][bestX] = c; if (backtrack(g)) return true; g[bestY][bestX] = null; }
        return false;
    }

    if (backtrack(solveGrid)) return solveGrid.map(row => row.map(v => chars[v]));
    return null;
}

// 唯一解驗證（位元遮罩版）：budget = { deadline } 時，超過期限中止並回傳 -1（未知）——
// 16×16 稀疏盤面單次驗證曾卡住主執行緒 100+ 秒（連線心跳全凍結＝雙方斷線），
// 呼叫端把 -1 當「不是唯一解」處理（補回洞口），題目正確性不受影響、只是少挖一點。
function countSolutions(grid, size, boxW, boxH, limit = 2, budget = null) {
    let count = 0;
    const fullMask = (1 << size) - 1;
    const rowMask = new Array(size).fill(0), colMask = new Array(size).fill(0), boxMask = new Array(size).fill(0);
    const boxesPerRow = size / boxW;
    const boxIdx = (y, x) => Math.floor(y / boxH) * boxesPerRow + Math.floor(x / boxW);
    const empties = [];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const v = grid[y][x];
        if (v === null || v === undefined) empties.push(y * size + x);
        else { const bit = 1 << v; rowMask[y] |= bit; colMask[x] |= bit; boxMask[boxIdx(y, x)] |= bit; }
    }
    let nodes = 0, aborted = false;
    const popcount = (m) => { let c = 0; while (m) { m &= m - 1; c++; } return c; };

    const solve = () => {
        if (budget) { if ((++nodes & 511) === 0 && Date.now() > budget.deadline) { aborted = true; return true; } }
        // MRV：挑候選最少的空格
        let bestI = -1, bestMask = 0, bestCount = size + 1;
        for (let i = 0; i < empties.length; i++) {
            const pos = empties[i]; if (pos < 0) continue;
            const y = (pos / size) | 0, x = pos % size;
            const mask = fullMask & ~(rowMask[y] | colMask[x] | boxMask[boxIdx(y, x)]);
            const c = popcount(mask);
            if (c === 0) return false;
            if (c < bestCount) { bestCount = c; bestI = i; bestMask = mask; if (c === 1) break; }
        }
        if (bestI === -1) { count++; return count >= limit; }
        const pos = empties[bestI], y = (pos / size) | 0, x = pos % size, b = boxIdx(y, x);
        empties[bestI] = -1;
        let m = bestMask;
        while (m) {
            const bit = m & -m; m &= m - 1;
            rowMask[y] |= bit; colMask[x] |= bit; boxMask[b] |= bit;
            const done = solve();
            rowMask[y] &= ~bit; colMask[x] &= ~bit; boxMask[b] &= ~bit;
            if (done) { empties[bestI] = pos; return true; }
            if (aborted) { empties[bestI] = pos; return true; }
        }
        empties[bestI] = pos;
        return false;
    };
    solve();
    return aborted ? -1 : count;
}

function shuffleRng(arr, rng) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; } // Fisher-Yates（稽核 D-04：取代有偏的 sort 隨機比較器；rng 可注入種子版，跨引擎結果一致）
async function generateSudokuAsync(sizeId, diffId, onProgress, rng) {
    rng = rng || Math.random; // 每日題傳入種子 rng（稽核 D-02：不再覆寫全域 Math.random，避免非同步生成期間污染其他呼叫端）
    const sizeDef = SIZES.find(s => s.id === sizeId);
    const diffDef = DIFFICULTIES.find(d => d.id === diffId);
    const targetRange = diffDef.targets[sizeId];
    const targetClues = Math.floor(rng() * (targetRange[1] - targetRange[0] + 1)) + targetRange[0];
    const targetMax = targetRange[1];
    const { size, boxW, boxH, chars } = sizeDef;

    let bestResult = null;
    let grid = null; // 宣告在迴圈外：結尾兜底 bestResult=grid 要引用最後一次嘗試的盤（原本宣告在迴圈內，原生 ES 作用域下會 ReferenceError、只靠 Babel 轉 var 偶然可達）
    let minCluesAchieved = Infinity;
    const maxAttempts = size === 16 ? 8 : 40;
    const generationStartTime = Date.now();
    let isTimedOut = false; let lastTick = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (isTimedOut) break;
        // 16×16 單次嘗試上限 8 秒：挖到高原期（怎麼挖都破壞唯一解）就換新盤重挖，別把全域 30 秒磨在一張盤上
        const attemptDeadline = Date.now() + 8000;

        grid = (size === 4 ? BASE_4 : size === 9 ? BASE_9 : BASE_16).map(row => [...row]);
        const charPool = [...chars]; shuffleRng(charPool, rng);
        grid = grid.map(row => row.map(val => charPool[val]));

        for (let i = 0; i < size; i += boxH) { const block = grid.slice(i, i + boxH); shuffleRng(block, rng); grid.splice(i, boxH, ...block); }
        grid = transpose(grid);
        for (let i = 0; i < size; i += boxW) { const block = grid.slice(i, i + boxW); shuffleRng(block, rng); grid.splice(i, boxW, ...block); }
        grid = transpose(grid);
        const bands = []; for (let i = 0; i < size; i += boxH) bands.push(grid.slice(i, i + boxH)); shuffleRng(bands, rng); grid = bands.flat();
        grid = transpose(grid);
        const stacks = []; for (let i = 0; i < size; i += boxW) stacks.push(grid.slice(i, i + boxW)); shuffleRng(stacks, rng); grid = transpose(stacks.flat());

        let puzzle = grid.map(r => [...r]);
        const positions = [];
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) positions.push({ x, y });
        shuffleRng(positions, rng);

        let currentClues = size * size; let failCount = 0; const maxCheckHoles = positions.length;
        const testGrid = puzzle.map(r => [...r]);

        for (let i = 0; i < maxCheckHoles; i++) {
            const now = Date.now();
            if (size === 16 && now > attemptDeadline) break; // 本次嘗試放棄，交給下一次嘗試（bestResult 已保留最佳盤）
            const elapsedSecs = Math.floor((now - generationStartTime) / 1000);

            if (elapsedSecs >= 20) {
                const remainingSecs = 30 - elapsedSecs;
                if (remainingSecs <= 0) { isTimedOut = true; break; }
                if (now - lastTick >= 1000) { lastTick = now; if (onProgress) onProgress(`題目生成不超過 ${remainingSecs} 秒...`); await new Promise(r => setTimeout(r, 15)); }
            }
            if (currentClues <= targetClues) break;

            const p1 = positions[i]; const p2 = { x: size - 1 - p1.x, y: size - 1 - p1.y };

            if (puzzle[p1.y][p1.x] !== null) {
                const backup1 = puzzle[p1.y][p1.x]; const backup2 = puzzle[p2.y][p2.x];
                puzzle[p1.y][p1.x] = null; testGrid[p1.y][p1.x] = null;
                let removed = 1;
                if (p1.x !== p2.x || p1.y !== p2.y) { puzzle[p2.y][p2.x] = null; testGrid[p2.y][p2.x] = null; removed = 2; }
                const testNumGrid = testGrid.map(row => row.map(v => v === null ? null : chars.indexOf(v)));

                // 單次驗證預算（超時回 -1（≠1）→ 補回洞口；主執行緒不再被單次驗證長卡，連線心跳不中斷）：
                // 淺處 300ms 求快，深處（接近目標格數）放寬到 2 秒把驗證算完，避免困難 16×16 永遠挖不到底
                const holesLeft = currentClues - targetClues;
                const checkBudgetMs = size !== 16 ? 300 : (holesLeft > 40 ? 250 : (holesLeft > 15 ? 600 : 1200));
                if (countSolutions(testNumGrid, size, boxW, boxH, 2, { deadline: Date.now() + checkBudgetMs }) !== 1) {
                    puzzle[p1.y][p1.x] = backup1; testGrid[p1.y][p1.x] = backup1;
                    if (removed === 2) { puzzle[p2.y][p2.x] = backup2; testGrid[p2.y][p2.x] = backup2; }
                    failCount++;
                } else {
                    currentClues -= removed; failCount = 0;
                    if (currentClues < minCluesAchieved) { minCluesAchieved = currentClues; bestResult = puzzle.map(r => [...r]); if (elapsedSecs < 20 && onProgress) { onProgress(`挑戰極限難度... (目標: ${targetClues}格, 目前最佳: ${minCluesAchieved}格)`); } }
                }
                if (currentClues <= targetMax && failCount > 25) break;
            }
            if (size === 16 || i % 15 === 0) await new Promise(r => setTimeout(r, 0));
        }
        if (currentClues <= targetMax || isTimedOut) break;
    }

    if (!bestResult) bestResult = grid;

    const cells = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const isGiven = bestResult[y][x] !== null;
            cells.push({
                id: `${x}-${y}`, x: x, y: y, boxId: Math.floor(x / boxW) + Math.floor(y / boxH) * (size / boxW),
                value: isGiven ? bestResult[y][x] : null, isGiven: isGiven, drafts: [], owner: null, isSystemRevealed: false
            });
        }
    }
    return { sizeDef, diffDef, cells };
}

// ===== 每日一題：日期種子生成（全員同題、跨裝置一致） =====
function mulberry32(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashDateStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
async function generateDailySudoku(dateStr, onProgress) {
    // 種子 rng 以參數注入（照數橋 puzzle.js 的正確寫法）：生成期間不再覆寫全域 Math.random，其他程式（uid/道具/特效）的隨機不再被種子污染、每日題也不受操作時序影響
    return generateSudokuAsync(9, 'medium', onProgress, mulberry32(hashDateStr('sudoku-daily-' + dateStr)));
}

function formatTime(secs) { return String(Math.floor(secs / 60)).padStart(2, '0') + ":" + String(secs % 60).padStart(2, '0'); }

// ===== PlatSave 接點（facade）：平台模式委派殼的 window.PlatSave、獨立開啟時用同語意本地後備；validator 在此集中登記、read 時統一帶入 =====
var __psFacade = null;
function platSave() {
  if (__psFacade) return __psFacade;
  var regs = [];
  function findV(key) { var best = null; for (var i = 0; i < regs.length; i++) { if (key.indexOf(regs[i].p) === 0 && (!best || regs[i].p.length > best.p.length)) best = regs[i]; } return best ? best.fn : null; }
  function g(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function rm(k) { try { window.localStorage.removeItem(k); } catch (e) {} }
  var local = {
    getStr: function (k, fb) { var v = g(k); return (v === null || v === undefined) ? (fb || '') : v; },
    setStr: function (k, v) { try { window.localStorage.setItem(k, String(v)); } catch (e) {} },
    remove: rm,
    write: function (k, data) { try { window.localStorage.setItem(k, JSON.stringify({ __psv: 1, t: Date.now(), data: data })); } catch (e) {} },
    read: function (k, opts) {
      opts = opts || {}; var fb = ('fallback' in opts) ? opts.fallback : null;
      var raw = g(k); if (raw === null || raw === undefined) return fb;
      var parsed; try { parsed = JSON.parse(raw); } catch (e) { rm(k); return fb; }
      var data = parsed;
      if (parsed && typeof parsed === 'object' && parsed.__psv === 1 && 'data' in parsed) data = parsed.data;
      var fn = opts.validate;
      if (fn) { var ok = false; try { ok = !!fn(data, k); } catch (e) { ok = false; } if (!ok) { rm(k); return fb; } }
      return data;
    }
  };
  function impl() { return window.PlatSave || local; }
  __psFacade = {
    register: function (p, fn) { regs.push({ p: p, fn: fn }); if (window.PlatSave) window.PlatSave.register(p, fn); },
    getStr: function (k, fb) { return impl().getStr(k, fb); },
    setStr: function (k, v) { impl().setStr(k, v); },
    remove: function (k) { impl().remove(k); },
    write: function (k, data) { impl().write(k, data); },
    read: function (k, opts) {
      opts = opts || {};
      var fn = opts.validate || findV(k);
      var o = { fallback: ('fallback' in opts) ? opts.fallback : null };
      if (fn) o.validate = fn;
      return impl().read(k, o);
    }
  };
  return __psFacade;
}

// validator 集中登記（收編既有守衛、行為等價）：prog＝形狀＋24 小時年齡上限（v1.19.1 loadLocalProgress 原邏輯；盤面尺寸比對需本局尺寸、留在 app.js 消費端）
// 注意：平台 bundle 裡 engine.js（classic）比 shell.js 先執行，此刻 window.PlatSave 還不存在——先登記進 facade 自己的表（消費端全走 facade 不受影響），DOMContentLoaded 後再補登記進殼的中央表。
function regSudokuPlatSave() {
  platSave().register('sudoku_prog', function (p) { return !!p && Array.isArray(p.d) && typeof p.t === 'number' && (Date.now() - p.t) <= 24 * 3600 * 1000; });
  platSave().register('sudoku_last_session', function (p) { return !!p && typeof p === 'object'; });
  platSave().register('sudoku_daily_records', function (p) { return !!p && typeof p === 'object' && !Array.isArray(p); });
  platSave().register('sudoku_daily_streak', function (p) { return !!p && typeof p === 'object' && typeof p.count === 'number'; });
}
regSudokuPlatSave();
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('DOMContentLoaded', regSudokuPlatSave);
// === PlatTap/PlatZoom 接點（數獨：engine.js 與殼同為 classic 載入，app.js 直接取用）（共用手勢判定＋縮放持有，v1.63.0）：平台模式用殼的 window.PlatTap/PlatZoom；獨立開啟用同語意本地後備（與殼同碼） ===
function platTapFactoryLocal(opts) {
  opts = opts || {};
  var slop = (opts.slop != null) ? opts.slop : 22;
  var tapMaxMs = (opts.tapMaxMs != null) ? opts.tapMaxMs : 0;
  var lpMs = (opts.longpressMs != null) ? opts.longpressMs : 0;
  var supMs = (opts.suppressMs != null) ? opts.suppressMs : 0;
  var g = null;
  var supT = -1, supTag;
  function drift(x, y) { return g ? Math.hypot(x - g.x0, y - g.y0) : 0; }
  function settle(x, y, t, isCancel) {
    if (!g) return { type: isCancel ? 'cancel' : 'none', dx: 0, dy: 0, drift: 0, dur: 0, longpress: false };
    t = (t != null ? t : Date.now());
    var hasXY = (typeof x === 'number' && typeof y === 'number');
    var d = hasXY ? drift(x, y) : 0, dur = t - g.t0, lp = g.lpFired, type;
    if (isCancel) type = 'cancel';
    else if (lp) type = 'longpress';
    else if (d > slop) type = 'drag';
    else if (tapMaxMs > 0 && dur >= tapMaxMs) type = 'cancel';
    else type = 'tap';
    var r = { type: type, dx: hasXY ? x - g.x0 : 0, dy: hasXY ? y - g.y0 : 0, drift: d, dur: dur, longpress: lp };
    g = null;
    return r;
  }
  return {
    down: function (x, y, t) { g = { x0: x, y0: y, t0: (t != null ? t : Date.now()), lpFired: false }; },
    move: function (x, y) { if (!g) return { dragging: false, drift: 0 }; var d = drift(x, y); return { dragging: d > slop, drift: d }; },
    poll: function (t) { if (g && lpMs > 0 && !g.lpFired && (t != null ? t : Date.now()) - g.t0 >= lpMs) { g.lpFired = true; return 'longpress'; } return null; },
    up: function (x, y, t) { return settle(x, y, t, false); },
    cancel: function (x, y, t) { return settle(x, y, t, true); },
    markSuppress: function (t, tag) { supT = (t != null ? t : Date.now()); supTag = tag; },
    shouldSuppressClick: function (t, tag) { if (supMs <= 0 || supT < 0) return false; if ((t != null ? t : Date.now()) - supT >= supMs) return false; return (supTag === undefined || tag === undefined || supTag === tag); },
    clearSuppress: function () { supT = -1; },
    active: function () { return !!g; }
  };
}
function platZoomFactoryLocal(opts) {
  opts = opts || {};
  var min = (opts.min != null) ? opts.min : 0.1;
  var max = (opts.max != null) ? opts.max : 5;
  var val = (opts.value != null) ? opts.value : 1;
  var clean2 = !!opts.cleanup2dp;
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  var api = {
    value: function () { return val; },
    set: function (v, range) { var lo = range ? range[0] : min, hi = range ? range[1] : max; val = clamp(v, lo, hi); return val; },
    setRaw: function (v) { val = v; return val; },
    add: function (d) { var v = val + d; if (clean2) v = Math.round(v * 100) / 100; return api.set(v); },
    reset: function () { val = 1; return val; },
    min: function () { return min; }, max: function () { return max; }
  };
  return api;
}
function platTapNew(opts) { return (window.PlatTap || platTapFactoryLocal)(opts); }
function platZoomNew(opts) { return (window.PlatZoom || platZoomFactoryLocal)(opts); }
function platArmZoom(el) {
  if (!el) return;
  if (window.PlatZoom && window.PlatZoom.armTransition) { window.PlatZoom.armTransition(el); return; }
  el.style.transition = 'width 200ms cubic-bezier(0.22, 1, 0.36, 1), height 200ms cubic-bezier(0.22, 1, 0.36, 1)';
  if (el.__pzArmTimer) clearTimeout(el.__pzArmTimer);
  el.__pzArmTimer = setTimeout(function () { el.style.transition = ''; el.__pzArmTimer = null; }, 260);
}
// === PlatAudio 接點（技能對照改造第 3 項，v1.64.0）：平台模式用殼的 window.PlatAudio；獨立開啟用同配方（v1.64.2 A 清脆＋華麗版）本地後備——靜音同走 plat_muted、首次讀取保守合併舊三鍵 ===
var __paLocal = null;
function platAudio() {
  if (typeof window !== 'undefined' && window.PlatAudio) return window.PlatAudio;
  if (__paLocal) return __paLocal;
  var RECIPES = {
    place:    { notes: [[880, 0, 0.07, 1, 'triangle']] },
    error:    { notes: [[170, 0, 0.13, 1, 'triangle']] },
    boom:     { notes: [[140, 0, 0.22, 1, 'triangle']] },
    gift:     { notes: [[523, 0, 0.14, 0.7, 'triangle'], [659, 0.07, 0.18, 0.7, 'triangle']] },
    complete: { notes: [[523, 0, 0.16, 1, 'triangle'], [659, 0.07, 0.16, 1, 'triangle'], [784, 0.14, 0.16, 1, 'triangle'], [1046, 0.21, 0.30, 1, 'triangle'], [262, 0, 0.75, 0.22, 'sine'], [330, 0, 0.75, 0.22, 'sine'], [392, 0, 0.75, 0.22, 'sine']] },
    win:      { notes: [[523, 0, 0.16, 1, 'triangle'], [587, 0.08, 0.16, 1, 'triangle'], [659, 0.16, 0.16, 1, 'triangle'], [784, 0.24, 0.16, 1, 'triangle'], [880, 0.32, 0.16, 1, 'triangle'], [1046, 0.40, 0.24, 1, 'triangle'], [1046, 0.48, 1.0, 0.45, 'sine'], [1318, 0.48, 1.0, 0.45, 'sine'], [1568, 0.48, 1.0, 0.45, 'sine'], [262, 0, 1.2, 0.22, 'sine'], [330, 0, 1.2, 0.22, 'sine'], [392, 0, 1.2, 0.22, 'sine']] }
  };
  var ctx = null, master = null, unlocked = false, lastPlay = {}, mutedCache = null;
  function sGet(k) { try { var v = platSave().getStr(k, ''); return v === null || v === undefined ? '' : v; } catch (e) { return ''; } }
  function sSet(k, v) { try { platSave().setStr(k, v); } catch (e) {} }
  function readMuted() {
    if (mutedCache !== null) return mutedCache;
    var v = sGet('plat_muted');
    if (!v) {
      var legacy = sGet('sudoku_muted') === '1' || sGet('hashi_muted') === '1' || sGet('mines_muted') === '1';
      v = legacy ? '1' : '0';
      sSet('plat_muted', v);
    }
    mutedCache = (v === '1');
    return mutedCache;
  }
  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); } catch (e) { ctx = null; return null; }
    return ctx;
  }
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('pointerdown', function () {
      unlocked = true;
      var c = ensureCtx();
      if (c && c.state === 'suspended') { try { var p = c.resume(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
    }, true);
  }
  function tone(freq, at, dur, vol, type) {
    var t = ctx.currentTime + at;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  __paLocal = {
    play: function (name) {
      try {
        if (readMuted()) return;
        var r = RECIPES[name]; if (!r) return;
        var vib = { place: 10, error: [30, 30, 30], complete: [50, 50, 100], win: [50, 50, 100], gift: 10 }[name];
        if (vib !== undefined) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(vib); } catch (e) {} }
        if (!unlocked || !ctx || ctx.state === 'suspended') return;
        var now = Date.now();
        if (lastPlay[name] && now - lastPlay[name] < 60) return;
        lastPlay[name] = now;
        for (var i = 0; i < r.notes.length; i++) { var n = r.notes[i]; tone(n[0], n[1], n[2], n[3], n[4]); }
      } catch (e) {}
    },
    isMuted: function () { return readMuted(); },
    setMuted: function (m) { mutedCache = !!m; sSet('plat_muted', m ? '1' : '0'); },
    toggleMuted: function () { var m = !readMuted(); mutedCache = m; sSet('plat_muted', m ? '1' : '0'); return m; }
  };
  return __paLocal;
}

// 本地進度恢復系統核心函數 (v3.8.0)
// 存檔清掃（稽核 G-01）：讀寫時順手掃掉全部過期/損毀的 sudoku_prog_*（原本只清「下次同房號被讀到」的那筆，沒再進的房間會永久殘留無界成長）；每頁只掃一次
let _progSwept = false;
function sweepSudokuProg() {
    if (_progSwept) return; _progSwept = true;
    try {
        const dead = [];
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('sudoku_prog_') === 0) dead.push(k); }
        dead.forEach(k => { let kill = false; try { const p = JSON.parse(localStorage.getItem(k)); if (!p || !p.t || (Date.now() - p.t) > 24 * 3600 * 1000) kill = true; } catch (e) { kill = true; } if (kill) { try { localStorage.removeItem(k); } catch (e) {} } });
    } catch (e) {}
}
const saveLocalProgress = (rid, uid, name, isHost, data, sessionId, extra) => {
    sweepSudokuProg();
    if (!rid || !uid) return;
    try {
        const payload = { d: data, t: Date.now(), sid: sessionId };
        if (extra) Object.assign(payload, extra); // 存入 solutionGrid, playersList 等
        platSave().write(`sudoku_prog_${rid}_${uid}`, payload);
        platSave().write('sudoku_last_session', { rid, uid, time: Date.now(), name, isHost, sid: sessionId });
    } catch (e) { /* 儲存空間被瀏覽器封鎖時（如預覽環境）靜默略過，不可讓遊戲崩潰 */ }
};
// 存檔衛生（2026-11-01 立、v1.62.0 收編 PlatSave）：超過 24 小時或形狀不對的殘檔由登錄 validator 判定、讀取層清除自癒。房號只有 4 碼、會撞號，陳年殘檔被別場比賽撈到會污染新局（實機事故：16×16 殘檔毒死 9×9 新房的房主開局）。
const loadLocalProgress = (rid, uid) => { sweepSudokuProg(); return platSave().read(`sudoku_prog_${rid}_${uid}`, { fallback: null }); };