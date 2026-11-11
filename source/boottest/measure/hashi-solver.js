// ============================================================
// HASHI_SOLVER — 數橋求解器（純邏輯，無 DOM 依賴）
//
// 用途：
//   1. 生成器產題後驗證「唯一解」（找到第 2 個解就停）
//   2. 未來可做「提示一條橋」「顯示解答」
//
// 題目格式：{ width, height, islands: [{ id, x, y, req }] }
//   req = 該島需要的橋數（相容 num 欄位）
// ============================================================
window.HASHI_SOLVER = (function () {
  'use strict';

  function islNeed(isl) {
    return (isl.req != null) ? isl.req : isl.num;
  }

  // 建立可架橋的槽位：與 generateEmptyBridges 完全一致的定義
  // （每座島找正右方最近、正下方最近的島）
  function buildSlots(islands) {
    const slots = [];
    const seen = new Set();
    for (let i = 0; i < islands.length; i++) {
      const a = islands[i];
      let rN = null, bN = null;
      for (let j = 0; j < islands.length; j++) {
        if (j === i) continue;
        const b = islands[j];
        if (b.y === a.y && b.x > a.x && (!rN || b.x < rN.x)) rN = b;
        if (b.x === a.x && b.y > a.y && (!bN || b.y < bN.y)) bN = b;
      }
      [[rN, 'h'], [bN, 'v']].forEach(([o, type]) => {
        if (!o) return;
        const key = a.id < o.id ? a.id + '-' + o.id : o.id + '-' + a.id;
        if (seen.has(key)) return;
        seen.add(key);
        slots.push({
          a: i,
          b: islands.indexOf(o),
          ax: a.x, ay: a.y, bx: o.x, by: o.y,
          horiz: type === 'h'
        });
      });
    }
    return slots;
  }

  // 預先算出互相交叉的槽位對（交叉的兩條橋不能同時 > 0）
  function buildCrossings(slots) {
    const cross = slots.map(() => []);
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const s1 = slots[i], s2 = slots[j];
        if (s1.horiz === s2.horiz) continue;
        const h = s1.horiz ? s1 : s2;
        const v = s1.horiz ? s2 : s1;
        const hx1 = Math.min(h.ax, h.bx), hx2 = Math.max(h.ax, h.bx);
        const vy1 = Math.min(v.ay, v.by), vy2 = Math.max(v.ay, v.by);
        if (v.ax > hx1 && v.ax < hx2 && h.ay > vy1 && h.ay < vy2) {
          cross[i].push(j);
          cross[j].push(i);
        }
      }
    }
    return cross;
  }

  // 核心：數解，最多數到 limit 個（唯一解檢查用 limit=2）
  // 回傳 { count, first } — first 是找到的第一組解（bridge 陣列）或 null
  function countSolutions(puzzle, limit) {
    limit = limit || 2;
    const islands = puzzle.islands;
    const n = islands.length;
    if (n === 0) return { count: 0, first: null };
    const slots = buildSlots(islands);
    const m = slots.length;
    const cross = buildCrossings(slots);
    const need = islands.map(islNeed);

    // 島 -> 關聯槽位
    const incident = islands.map(() => []);
    slots.forEach((s, si) => { incident[s.a].push(si); incident[s.b].push(si); });

    const val = new Array(m).fill(-1);
    let count = 0;
    let first = null;
    let nodes = 0;
    const NODE_BUDGET = 120000; // 節點預算（稽核 D-03）：極端題面不讓 solver 無限遞迴凍結主執行緒；超預算視為「未驗證」回 count:-1，生成器會換一題重抽

    function connected() {
      const seenV = new Array(n).fill(false);
      const stack = [0];
      seenV[0] = true;
      let reached = 1;
      while (stack.length) {
        const cur = stack.pop();
        for (const si of incident[cur]) {
          if (val[si] <= 0) continue;
          for (const nb of [slots[si].a, slots[si].b]) {
            if (!seenV[nb]) { seenV[nb] = true; reached++; stack.push(nb); }
          }
        }
      }
      return reached === n;
    }

    // 槽位 s 在目前狀態下可填的值
    function options(s) {
      const sl = slots[s];
      const out = [];
      for (let b = 0; b <= 2; b++) {
        if (need[sl.a] < b || need[sl.b] < b) continue;
        let ok = true;
        if (b > 0) {
          for (const c of cross[s]) {
            if (val[c] > 0) { ok = false; break; }
          }
        }
        if (ok) out.push(b);
      }
      return out;
    }

    // 島 i 是否還有可能補滿（剩餘需求 <= 未定槽位最大供給）
    function islandFeasible(i) {
      let un = 0;
      for (const si of incident[i]) if (val[si] === -1) un++;
      return need[i] >= 0 && need[i] <= un * 2;
    }

    function dfs(done) {
      if (++nodes > NODE_BUDGET) throw new Error('solver-budget');
      if (count >= limit) return true;
      if (done === m) {
        if (need.every(x => x === 0) && connected()) {
          count++;
          if (!first) {
            first = slots.map((s, si) => ({
              from: islands[s.a].id, to: islands[s.b].id,
              type: s.horiz ? 'h' : 'v', count: val[si]
            })).filter(b => b.count > 0);
          }
        }
        return count >= limit;
      }
      // MRV：選可填值最少的槽位
      let bi = -1, bopts = null;
      for (let s = 0; s < m; s++) {
        if (val[s] !== -1) continue;
        const o = options(s);
        if (o.length === 0) return false;
        if (!bopts || o.length < bopts.length) {
          bi = s; bopts = o;
          if (o.length === 1) break;
        }
      }
      const sl = slots[bi];
      for (const b of bopts) {
        val[bi] = b;
        need[sl.a] -= b; need[sl.b] -= b;
        let feas = islandFeasible(sl.a) && islandFeasible(sl.b);
        if (feas) {
          if (dfs(done + 1)) return true;
        }
        need[sl.a] += b; need[sl.b] += b;
        val[bi] = -1;
      }
      return false;
    }

    try { dfs(0); } catch (e) { if (e && e.message === 'solver-budget') return { count: -1, first: null, aborted: true }; throw e; }
    return { count: count, first: first };
  }

  // 找一組解（給未來的提示／解答功能用）
  function solve(puzzle) {
    const r = countSolutions(puzzle, 1);
    return r.first;
  }

  return {
    buildSlots: buildSlots,
    countSolutions: countSolutions,
    solve: solve
  };
})();