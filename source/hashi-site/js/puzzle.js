// ============================================================
// HASHI_PUZZLE — 題目引擎（純邏輯，無 DOM / React 依賴）
// 產生題目、空橋槽位、seeded RNG；保證唯一解（重抽迴圈＋solver）
// ============================================================
window.HASHI_PUZZLE = (function () {
  'use strict';

      function mulberry32(seed) {
    let a = seed >>> 0;
    return function() {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashDateStr(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function getDailyDateStr(d) {
    const dt = d || new Date();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return dt.getFullYear() + '-' + m + '-' + day;
  }
  function shiftDateStr(dateStr, deltaDays) {
    const parts = dateStr.split('-').map(Number);
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    dt.setDate(dt.getDate() + deltaDays);
    return getDailyDateStr(dt);
  }
  function getDailySeed(dateStr) {
    return mulberry32(hashDateStr(dateStr));
  }
  function generateRandomHashi(levelDef, rng) {
    rng = rng || Math.random;
    const W = levelDef.width, H = levelDef.height;
    let grid = Array(H).fill(null).map(() => Array(W).fill(null));
  
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            let hasNeighbor = false;
            if (x > 0 && grid[y][x-1]) hasNeighbor = true;
            if (y > 0 && grid[y-1][x]) hasNeighbor = true;
            if (x < W-1 && grid[y][x+1]) hasNeighbor = true;
            if (y < H-1 && grid[y+1][x]) hasNeighbor = true;
  
            if (!hasNeighbor) {
                if (rng() < 0.45) grid[y][x] = true;
            }
        }
    }
  
    for (let y = 0; y <= H - 3; y++) {
        for (let x = 0; x <= W - 3; x++) {
            let hasIsland = false;
            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 3; dx++) {
                    if (grid[y+dy][x+dx]) hasIsland = true;
                }
            }
            if (!hasIsland) {
                let emptyCells = [];
                for (let dy = 0; dy < 3; dy++) {
                    for (let dx = 0; dx < 3; dx++) {
                        let cy = y + dy, cx = x + dx;
                        let hasNeighbor = false;
                        if (cx > 0 && grid[cy][cx-1]) hasNeighbor = true;
                        if (cy > 0 && grid[cy-1][cx]) hasNeighbor = true;
                        if (cx < W-1 && grid[cy][cx+1]) hasNeighbor = true;
                        if (cy < H-1 && grid[cy+1][cx]) hasNeighbor = true;
                        if (!hasNeighbor) emptyCells.push({x: cx, y: cy});
                    }
                }
                if (emptyCells.length > 0) {
                    let pick = emptyCells[Math.floor(rng() * emptyCells.length)];
                    grid[pick.y][pick.x] = true;
                }
            }
        }
    }
  
    let islands = [];
    let islandId = 1;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (grid[y][x]) {
                let isl = { id: islandId++, x: x, y: y, req: 0 };
                islands.push(isl);
                grid[y][x] = isl;
            }
        }
    }
  
    let potentialBridges = [];
    for (let i = 0; i < islands.length; i++) {
        let island = islands[i];
        for (let x = island.x + 1; x < W; x++) {
            if (grid[island.y][x]) {
                potentialBridges.push({ from: island.id, to: grid[island.y][x].id, type: 'h', minX: island.x, maxX: x, y: island.y, len: x - island.x });
                break;
            }
        }
        for (let y = island.y + 1; y < H; y++) {
            if (grid[y][island.x]) {
                potentialBridges.push({ from: island.id, to: grid[y][island.x].id, type: 'v', minY: island.y, maxY: y, x: island.x, len: y - island.y });
                break;
            }
        }
    }
  
    const _rk = new Map(); potentialBridges.forEach(b => _rk.set(b, rng()));
    potentialBridges.sort((a, b) => (a.len - b.len) || (_rk.get(a) - _rk.get(b))); // 先以長度排序、同長度以預抽的隨機序號打破平手（稽核 D-04：原寫法把隨機擾動混進比較器，排序結果不一致且有偏）
  
    let uf = new Map();
    islands.forEach(i => uf.set(i.id, i.id));
    function find(i) { if (uf.get(i) === i) return i; let root = find(uf.get(i)); uf.set(i, root); return root; }
    function union(i, j) { let rootI = find(i), rootJ = find(j); if (rootI !== rootJ) { uf.set(rootI, rootJ); return true; } return false; }
  
    let acceptedBridges = [];
  
    function doesIntersect(b) {
        for (let i = 0; i < acceptedBridges.length; i++) {
            let a = acceptedBridges[i];
            if (a.type === 'h' && b.type === 'v') {
                if (b.x > a.minX && b.x < a.maxX && a.y > b.minY && a.y < b.maxY) return true;
            } else if (a.type === 'v' && b.type === 'h') {
                if (a.x > b.minX && a.x < b.maxX && b.y > a.minY && b.y < a.maxY) return true;
            }
        }
        return false;
    }
  
    let rejectedBridges = [];
    for (let i=0; i<potentialBridges.length; i++) {
        let b = potentialBridges[i];
        if (doesIntersect(b)) continue;
        if (union(b.from, b.to)) {
            acceptedBridges.push(b);
        } else {
            rejectedBridges.push(b);
        }
    }
  
    for (let i=0; i<rejectedBridges.length; i++) {
        let b = rejectedBridges[i];
        if (!doesIntersect(b) && rng() < 0.4) {
            acceptedBridges.push(b);
        }
    }
  
    let islandDegree = {};
    islands.forEach(i => islandDegree[i.id] = 0);
  
    acceptedBridges.forEach(b => {
        b.count = rng() < 0.5 ? 1 : 2;
        islandDegree[b.from] += b.count;
        islandDegree[b.to] += b.count;
    });
  
    islands = islands.filter(i => islandDegree[i.id] > 0);
    islands.forEach(i => i.req = islandDegree[i.id]);
  
    if (islands.length > 0) {
        let adj = {};
        islands.forEach(i => adj[i.id] = []);
        acceptedBridges.forEach(b => {
            if (adj[b.from] && adj[b.to]) {
                adj[b.from].push(b.to);
                adj[b.to].push(b.from);
            }
        });
  
        let visited = new Set();
        let components = [];
        for (let i=0; i<islands.length; i++) {
            let island = islands[i];
            if (!visited.has(island.id)) {
                let comp = [];
                let q = [island.id];
                visited.add(island.id);
                while(q.length > 0) {
                    let curr = q.shift();
                    comp.push(curr);
                    for (let j=0; j<adj[curr].length; j++) {
                        let n = adj[curr][j];
                        if (!visited.has(n)) {
                            visited.add(n);
                            q.push(n);
                        }
                    }
                }
                components.push(comp);
            }
        }
  
        components.sort((a, b) => b.length - a.length);
        let largestCompSet = new Set(components[0]);
  
        islands = islands.filter(i => largestCompSet.has(i.id));
        acceptedBridges = acceptedBridges.filter(b => largestCompSet.has(b.from) && largestCompSet.has(b.to));
    }
  
    return {
      id: levelDef.id, name: levelDef.name, width: W, height: H,
      description: levelDef.description, isRandom: true, islands: islands, solution: acceptedBridges
    };
  }
  function generateEmptyBridges(level) {
    let pb = []; let bridgeId = 1;
    const isl = (level && level.islands) ? level.islands : [];
    for (let i = 0; i < isl.length; i++) {
      let a = isl[i]; let rN = null, bN = null;
      for (let j = 0; j < isl.length; j++) {
        let b = isl[j];
        if (b.y === a.y && b.x > a.x) if (!rN || b.x < rN.x) rN = b;
        if (b.x === a.x && b.y > a.y) if (!bN || b.y < bN.y) bN = b;
      }
      if (rN) pb.push({ id: bridgeId++, from: a.id, to: rN.id, type: 'h', count: 0, draftCount: 0 });
      if (bN) pb.push({ id: bridgeId++, from: a.id, to: bN.id, type: 'v', count: 0, draftCount: 0 });
    }
    return pb;
  }

  // 驗收帶（v1.65.0 D3，規格 platform-generator-tuning-spec-2026-11-11；帶值＝題目量測實測分布裁剪）：
  // L1–L3 的出貨題除唯一解外還須島數/總橋數（Σreq/2）落帶，帶外視同一次失敗 attempt 續抽（沿用 300 上限、另計帶外次數）。
  // L4/L5、自訂（id 'custom'）與每日（id 'daily'，改演算法會追溯改變歷史每日題）不套帶。
  var GEN_BANDS = { 1: { isl: [3, 8], br: [3, 10] }, 2: { isl: [10, 28], br: [16, 40] }, 3: { isl: [25, 52], br: [38, 82] } };
  function puzzleInBand(puzzle, levelDef) {
    var b = GEN_BANDS[levelDef && levelDef.id];
    if (!b) return true;
    var isl = puzzle.islands.length, br = 0;
    for (var i = 0; i < puzzle.islands.length; i++) br += puzzle.islands[i].req;
    br = br / 2;
    return isl >= b.isl[0] && isl <= b.isl[1] && br >= b.br[0] && br <= b.br[1];
  }
  var lastGenStats = null; // 最近一次 generateUniqueHashi 的 { attempts, outOfBand, capped }（量測/守衛測試讀取）

  // 產生「唯一解」題目：每一題都先經 solver 確認只有一組解才回傳。
  // rng 可傳 seeded（每日一題）— 同一個 seed 的重抽序列完全確定，所以每日題目不會亂跳。
  // 上限 300 次只是安全網：實測每題毫秒級、一次抽中唯一的機率高，正常 1~3 次就中。
  function generateUniqueHashi(levelDef, rng, maxAttempts) {
    rng = rng || Math.random;
    const cap = maxAttempts || 300;
    let puzzle = null;
    let outOfBand = 0;
    for (let attempts = 0; attempts < cap; attempts++) {
      puzzle = generateRandomHashi(levelDef, rng);
      let unique = false;
      try {
        unique = window.HASHI_SOLVER.countSolutions(puzzle, 2).count === 1;
      } catch (e) { break; }
      if (unique) {
        if (!puzzleInBand(puzzle, levelDef)) { outOfBand++; continue; }
        lastGenStats = { attempts: attempts + 1, outOfBand: outOfBand, capped: false };
        return puzzle;
      }
    }
    lastGenStats = { attempts: cap, outOfBand: outOfBand, capped: true };
    return puzzle; // 理論上的最後防線（實務上到不了這裡）
  }

  return {
    get lastGenStats() { return lastGenStats; },
    GEN_BANDS: GEN_BANDS,
    puzzleInBand: puzzleInBand,
    mulberry32: mulberry32,
    hashDateStr: hashDateStr,
    getDailyDateStr: getDailyDateStr,
    shiftDateStr: shiftDateStr,
    getDailySeed: getDailySeed,
    generateRandomHashi: generateRandomHashi,
    generateEmptyBridges: generateEmptyBridges,
    generateUniqueHashi: generateUniqueHashi
  };
})();