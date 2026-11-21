// v1.27.0 數橋島嶼禮物（使用者 2026-11-01 定案）：完成進度每跨 5%（= 總島數的 1/20）產生 1 個禮物，
// 送給比自己弱的未完賽對手（扶弱、差距平方根加權）；沒有較弱對手時額度存著。全場最多 20 個。
// 驗法：雙頁 race 開局（最小盤面），來賓用解題＋拖曳真架橋，跨過數格後房主（0% 較弱）應收到禮物——
// 禮物數量級（≥2 或湊滿自動發動的黑線）可排除里程碑彩券隨機給禮物的干擾（彩券給中禮物兩次的機率僅約 2%）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
html = html.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function pev(w, el, type, x, y) { const e = new w.Event(type, { bubbles: true, cancelable: true }); e.clientX = x; e.clientY = y; e.isPrimary = true; e.pointerId = 7; e.pointerType = 'mouse'; e.button = 0; e.buttons = (type === 'pointerup' ? 0 : 1); el.dispatchEvent(e); }
function solveHashi(islands) {
  const pairs = [];
  for (let i = 0; i < islands.length; i++) for (let j = i + 1; j < islands.length; j++) {
    const a = islands[i], b = islands[j];
    if (a.gx !== b.gx && a.gy !== b.gy) continue;
    const between = islands.some(k => k !== a && k !== b && ((a.gx === b.gx && k.gx === a.gx && k.gy > Math.min(a.gy, b.gy) && k.gy < Math.max(a.gy, b.gy)) || (a.gy === b.gy && k.gy === a.gy && k.gx > Math.min(a.gx, b.gx) && k.gx < Math.max(a.gx, b.gx))));
    if (!between) pairs.push([i, j]);
  }
  const crosses = (p, q) => {
    const [a, b] = [islands[p[0]], islands[p[1]]], [c, d] = [islands[q[0]], islands[q[1]]];
    const h1 = a.gy === b.gy, h2 = c.gy === d.gy;
    if (h1 === h2) return false;
    const H = h1 ? [a, b] : [c, d], V = h1 ? [c, d] : [a, b];
    return V[0].gx > Math.min(H[0].gx, H[1].gx) && V[0].gx < Math.max(H[0].gx, H[1].gx) && H[0].gy > Math.min(V[0].gy, V[1].gy) && H[0].gy < Math.max(V[0].gy, V[1].gy);
  };
  const counts = new Array(pairs.length).fill(0);
  const sums = islands.map(() => 0);
  const connected = () => {
    const adj = islands.map(() => []);
    pairs.forEach(([i, j], pi) => { if (counts[pi] > 0) { adj[i].push(j); adj[j].push(i); } });
    const seen = new Set([0]); const q = [0];
    while (q.length) { const u = q.shift(); adj[u].forEach(v => { if (!seen.has(v)) { seen.add(v); q.push(v); } }); }
    return seen.size === islands.length;
  };
  const dfs = (pi) => {
    if (pi === pairs.length) return sums.every((s, i) => s === islands[i].req) && connected();
    const [i, j] = pairs[pi];
    for (let c = 0; c <= 2; c++) {
      if (sums[i] + c > islands[i].req || sums[j] + c > islands[j].req) continue;
      if (c > 0) { let bad = false; for (let q = 0; q < pi; q++) if (counts[q] > 0 && crosses(pairs[pi], pairs[q])) { bad = true; break; } if (bad) continue; }
      counts[pi] = c; sums[i] += c; sums[j] += c;
      if (dfs(pi + 1)) return true;
      counts[pi] = 0; sums[i] -= c; sums[j] -= c;
    }
    return false;
  };
  if (!dfs(0)) return null;
  return pairs.map(([i, j], pi) => ({ a: islands[i], b: islands[j], count: counts[pi] })).filter(x => x.count > 0);
}
(async () => {
  const H = loadPage('H'), G = loadPage('G');
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell'); if (!ok) { console.log('SHELL NOT READY'); process.exit(2); } }
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  await waitFor(() => hubRoom(H), 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙'; G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  await waitFor(() => hubRoom(G), 60000, 'G room');
  await waitFor(() => H.window.__PLAT_NET.roster.length === 2 ? true : null, 30000, 'roster 2');
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="hashi"]'));
  await sleep(600);
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="race"]'));
  await sleep(800);
  // 最小盤面（islands 少，跨格快）
  const setSel = (w, s, v) => { const setter = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value').set; setter.call(s, v); s.dispatchEvent(new w.Event('change', { bubbles: true })); };
  const lvSel = [...H.document.querySelectorAll('#lob-step-room [data-pr-slot="settings"] select')].find(s => [...s.options].some(o => String(o.value) === '1'));
  if (lvSel) { setSel(H.window, lvSel, '1'); await sleep(800); }
  const readyBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="ready"]');
  const startBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="start"]');
  await waitFor(() => readyBtn(G) && readyBtn(H), 20000, 'ready btns');
  clickEl(G, readyBtn(G)); clickEl(H, readyBtn(H));
  const unlocked = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
  clickEl(H, unlocked);
  // 先等倒數「出現」再等它「結束」——只等結束會在倒數尚未開始時立刻通過，讀到未開局的盤面（開局重置會把先架的橋清空）
  await waitFor(() => { const cd = G.document.querySelector('#plat-countdown'); return (cd && cd.style.display === 'flex') ? true : null; }, 60000, 'cd appears');
  await waitFor(() => { const cd = G.document.querySelector('#plat-countdown'); return !cd || cd.style.display !== 'flex'; }, 60000, 'cd over');
  await sleep(1500);
  const dockBtn = (p, icon) => { const bs = [...p.document.querySelectorAll('#view-hashi button')]; return bs.find(b => (b.textContent || '').includes(icon) && b.className.includes('rounded-full')) || null; };
  const badge = (btn) => { if (!btn) return 0; const s = [...btn.querySelectorAll('span')].map(x => x.textContent.trim()).find(t => /^[0-9]+$/.test(t)); return s ? parseInt(s, 10) : 1; };
  const blackLines = (p) => [...p.document.querySelectorAll('#view-hashi line')].filter(l => l.getAttribute('stroke') === '#000000').length;
  check('前置：房主尚無禮物', !dockBtn(H, '🎁'));
  const freshBoard = () => { const s = [...G.document.querySelectorAll('#view-hashi svg')].find(x => [...x.querySelectorAll('text')].some(t => /^[1-8]$/.test((t.textContent || '').trim()))); if (s) { s.createSVGPoint = () => { const pt = { x: 0, y: 0, matrixTransform: () => ({ x: pt.x, y: pt.y }) }; return pt; }; s.getScreenCTM = () => ({ inverse: () => ({}) }); } return s; };
  const readIslands = () => { const bd = freshBoard(); if (!bd) return []; const out = []; bd.querySelectorAll('g').forEach(g => { const t = [...g.querySelectorAll('text')].find(x => /^[1-8]$/.test((x.textContent || '').trim())); if (!t) return; const cx = parseFloat(t.getAttribute('x')), cy = parseFloat(t.getAttribute('y')) - 2; out.push({ g, cx, cy, gx: Math.round((cx - 85) / 65), gy: Math.round((cy - 85) / 65), req: parseInt(t.textContent, 10) }); }); return out; };
  let islands = readIslands();
  if (islands.length < 3) { const full = await waitFor(() => { const r = readIslands(); return r.length >= 3 ? r : null; }, 30000, 'G islands'); if (full) islands = full; }
  // 盤面穩定性：隔 1.2 秒再讀一次，島數與座標需一致（防讀到開局重置前的舊盤）
  await sleep(1200);
  const islands2 = readIslands();
  const stable = islands.length === islands2.length && islands.every((v, i) => islands2[i] && v.gx === islands2[i].gx && v.gy === islands2[i].gy && v.req === islands2[i].req);
  check('前置：來賓讀到島嶼（且盤面穩定）', islands.length >= 3 && stable, 'n=' + islands.length + ' stable=' + stable); // 最小盤面島數隨機 3 起（2026-11-01 實測）
  const sol = solveHashi(islands);
  check('前置：解出解法', !!sol);
  if (sol) {
    // 逐對架橋，直到完成島數 ≥ 25%（至少跨 4 格島嶼禮物）或橋架完
    const drawn = {}; // pairKey -> count drawn
    const keyOf = (a, b) => [a.gx + ',' + a.gy, b.gx + ',' + b.gy].sort().join('|');
    const doneCount = () => { const sums = {}; islands.forEach(i => { sums[i.gx + ',' + i.gy] = 0; }); sol.forEach(br => { const c = drawn[keyOf(br.a, br.b)] || 0; sums[br.a.gx + ',' + br.a.gy] += c; sums[br.b.gx + ',' + br.b.gy] += c; }); return islands.filter(i => sums[i.gx + ',' + i.gy] === i.req).length; };
    const target = Math.max(2, Math.ceil(islands.length * 0.25));
    const freshIslandG = (isl) => { const list = readIslands(); const f = list.find(x => x.gx === isl.gx && x.gy === isl.gy); return f ? f.g : null; };
    for (const br of sol) {
      if (doneCount() >= target) break;
      for (let k = 0; k < br.count; k++) {
        const bd = freshBoard(); const gA = freshIslandG(br.a);
        if (!bd || !gA) continue;
        pev(G.window, gA, 'pointerdown', br.a.cx, br.a.cy);
        await sleep(250);
        pev(G.window, bd, 'pointermove', (br.a.cx + br.b.cx) / 2, (br.a.cy + br.b.cy) / 2);
        await sleep(50);
        pev(G.window, bd, 'pointermove', br.b.cx, br.b.cy);
        await sleep(50);
        pev(G.window, bd, 'pointerup', br.b.cx, br.b.cy);
        await sleep(200);
        drawn[keyOf(br.a, br.b)] = (drawn[keyOf(br.a, br.b)] || 0) + 1;
      }
      await sleep(400);
    }
    check('來賓完成島數達標', doneCount() >= target, 'done=' + doneCount() + '/' + islands.length);
    // 房主（0%，唯一較弱者）應收到島嶼禮物：badge ≥2，或湊滿 3 自動發動留下黑線證據
    const evidence = await waitFor(() => (badge(dockBtn(H, '🎁')) >= 2 || blackLines(H) >= 1) ? true : null, 40000, 'H island gifts');
    check('島嶼禮物：較弱的房主收到來賓產生的禮物', !!evidence, 'host gift badge=' + badge(dockBtn(H, '🎁')) + ' blackLines=' + blackLines(H));
  }
  check('雙邊零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
  console.log('\n=== islandgift: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})();
