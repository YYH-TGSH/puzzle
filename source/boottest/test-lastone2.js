// 數獨競賽「只剩自己（最後一人）」時，里程碑應改發系統禮物給他（v1.27.0 設計）。
// 使用者實機回報（2026-11-01）：只剩自己時什麼都拿不到。病根：里程碑 effect 把已是百分比的
// ghostProgress 又除了一次 totalEmpty，進度約 45% 時 19 格里程碑就全部報完——後半場再也跨不到格。
// 情景：A/B＝對手先完賽、最後一人從 0 開始打；A2/B2＝最後一人先打到約 50%，對手才完賽（實機真實情景，
// 修前必失敗：里程碑已耗盡）。斷言對「集滿 3 自動拆」免疫：填格期間全程輪詢禮物鈕徽章，見過 ≥1 即算收到。
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
function loadPage(reg, label) {
  const errs = [];
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errs.push(stamp(String(m))));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = reg; w.scrollTo = () => {}; try { w.localStorage.setItem('sudoku_input_mode', 'cell'); } catch (e) {} w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
async function openRoom(H, G, game, mode) {
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell'); if (!ok) throw new Error('SHELL NOT READY ' + p.label); }
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  await waitFor(() => hubRoom(H), 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙'; G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  await waitFor(() => hubRoom(G), 60000, 'G room');
  await waitFor(() => H.window.__PLAT_NET.roster.length === 2 ? true : null, 30000, 'roster 2');
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="' + game + '"]'));
  await sleep(600);
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="' + mode + '"]'));
  await sleep(800);
  // 道具延遲設 0：里程碑發放有 weaponStartTime 閘門（預設 60 秒），測試跑不到 60 秒會被擋下、測不到發放路徑
  const wtSel = H.document.querySelector('#lob-step-room select[data-hub-key="weaponStartTime"]');
  if (wtSel) { const setter = Object.getOwnPropertyDescriptor(H.window.HTMLSelectElement.prototype, 'value').set; setter.call(wtSel, '0'); wtSel.dispatchEvent(new H.window.Event('change', { bubbles: true })); await sleep(500); }
  const readyBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="ready"]');
  const startBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="start"]');
  await waitFor(() => readyBtn(G) && readyBtn(H), 20000, 'ready btns');
  clickEl(G, readyBtn(G)); clickEl(H, readyBtn(H));
  const unlocked = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
  clickEl(H, unlocked);
}
function makeInject(page, fromPid, game) {
  return (pd) => {
    const conn = page.window.__PLAT_NET.conns[fromPid];
    if (!conn || !conn._h || !conn._h.data) return false;
    const copy = JSON.parse(JSON.stringify({ __pg: game, __pd: pd }));
    conn._h.data.slice().forEach(f => { try { f(copy); } catch (e) {} });
    return true;
  };
}
function readBoard(D) {
  const cells = {};
  D.querySelectorAll('#view-sudoku g[id^="cell-"]').forEach(g => { const id = g.getAttribute('id').slice(5); const t = (g.textContent || '').trim(); cells[id] = t ? parseInt(t, 10) : 0; });
  return cells;
}
function solveN(board) {
  const ids = Object.keys(board);
  const N = Math.round(Math.sqrt(ids.length));
  const B = N === 4 ? 2 : 3;
  const grid = {}; ids.forEach(id => { grid[id] = board[id]; });
  const ok = (id, v) => { const [x, y] = id.split('-').map(Number); for (const o of ids) { if (o === id) continue; const [ox, oy] = o.split('-').map(Number); if (grid[o] === v && (ox === x || oy === y || (Math.floor(ox / B) === Math.floor(x / B) && Math.floor(oy / B) === Math.floor(y / B)))) return false; } return true; };
  const empties = ids.filter(id => !grid[id]);
  const bt = (i) => { if (i === empties.length) return true; const id = empties[i]; for (let v = 1; v <= N; v++) { if (ok(id, v)) { grid[id] = v; if (bt(i + 1)) return true; grid[id] = 0; } } return false; };
  bt(0); return grid;
}
async function fillIds(p, ids, sol) {
  for (const id of ids) {
    const g = p.document.querySelector('#view-sudoku g[id="cell-' + id + '"]');
    if (!g) continue;
    clickEl(p, g); await sleep(110);
    const btn = [...p.document.querySelectorAll('#view-sudoku button')].find(b => (b.textContent || '').trim() === String(sol[id]));
    if (btn) clickEl(p, btn);
    await sleep(110);
  }
}
const filledCount = (p) => Object.values(readBoard(p.document)).filter(v => v).length;
const giftBadge = (p) => { const el = p.document.querySelector('#btn-open-gift'); if (!el) return 0; const m = (el.textContent || '').match(/(\d+)/); return m ? parseInt(m[1], 10) : 1; };
// 填格期間全程盯禮物徽章：集滿 3 會自動拆掉、鈕會消失，所以「曾經出現過」才是收到禮物的證據
async function fillWatched(p, ids, sol, watch) {
  const iv = setInterval(() => { const b = giftBadge(p); if (b > watch.max) watch.max = b; }, 200);
  await fillIds(p, ids, sol);
  await sleep(2600);
  const b = giftBadge(p); if (b > watch.max) watch.max = b;
  clearInterval(iv);
}
// 把禮物佇列清空（武器轉換的存量禮物先拆掉），讓後續斷言只算新收到的
async function drainGifts(p) {
  for (let i = 0; i < 6; i++) {
    if (!p.document.querySelector('#btn-open-gift')) return;
    clickEl(p, p.document.querySelector('#btn-open-gift'));
    await sleep(900);
  }
}
async function setup(H, G) {
  await openRoom(H, G, 'sudoku', 'brawl');
  await waitFor(() => { const v = G.document.querySelector('#view-sudoku'); return (v && v.classList.contains('active')) ? true : null; }, 90000, 'in sudoku');
  await waitFor(() => G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? true : null, 90000, 'cells');
  await sleep(8000);
  return {
    hostPid: H.window.__PLAT_NET.myPid, guestPid: G.window.__PLAT_NET.myPid,
    gUid: G.window.localStorage.getItem('plat_uid_sudoku'), hUid: H.window.localStorage.getItem('plat_uid_sudoku'),
  };
}
// 在 lastPage 上把 nextRows 列填滿（跨里程碑），watch 記錄禮物徽章最大值
async function playRows(lastPage, sol, y0, rows, watch) {
  for (let y = y0; y < y0 + rows; y++) {
    const ids = Object.keys(sol).filter(id => id.split('-')[1] === String(y) && !readBoard(lastPage.document)[id]);
    await fillWatched(lastPage, ids, sol, watch);
  }
}
(async () => {
  // ===== A：來賓先完賽 → 房主最後一人，從 0 跨里程碑應收到系統禮物 =====
  {
    const reg = {};
    const H = loadPage(reg, 'HA'), G = loadPage(reg, 'GA');
    const ids = await setup(H, G);
    const injectH = makeInject(H, ids.guestPid, 'sudoku');
    injectH({ type: 'GHOST_I_WON', senderUid: ids.gUid, id: 'wa1', time: Date.now(), winInfo: { id: ids.gUid, name: '來賓乙', color: '#3498db', time: '01:00' } });
    await sleep(2500);
    const sol = solveN(readBoard(H.document));
    const watch = { max: 0 };
    await playRows(H, sol, 0, 2, watch);
    check('A 房主最後一人（從零）：跨里程碑收到系統禮物', watch.max >= 1, 'maxBadge=' + watch.max);
    check('A 零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
    H.window.close(); G.window.close();
  }
  // ===== A2：房主先打到約 50%，來賓才完賽 → 後半場跨里程碑仍應收到禮物（實機情景，修前必失敗） =====
  {
    const reg = {};
    const H = loadPage(reg, 'HA2'), G = loadPage(reg, 'GA2');
    const ids = await setup(H, G);
    const sol = solveN(readBoard(H.document));
    const board0 = readBoard(H.document);
    const totalEmpty = Object.values(board0).filter(v => !v).length;
    const target = filledCount(H) + Math.ceil(totalEmpty * 0.5);
    for (let y = 0; y < 9 && filledCount(H) < target; y++) {
      const row = Object.keys(sol).filter(id => id.split('-')[1] === String(y) && !readBoard(H.document)[id]);
      await fillIds(H, row, sol);
    }
    console.log('  A2 房主預打進度 filled=' + filledCount(H) + '/' + Object.keys(board0).length);
    const injectH = makeInject(H, ids.guestPid, 'sudoku');
    injectH({ type: 'GHOST_I_WON', senderUid: ids.gUid, id: 'wa2', time: Date.now(), winInfo: { id: ids.gUid, name: '來賓乙', color: '#3498db', time: '01:00' } });
    await sleep(2500);
    await drainGifts(H);
    const watch = { max: 0 };
    await playRows(H, sol, 5, 2, watch);
    check('A2 房主最後一人（已打 50%）：後半場跨里程碑仍收到系統禮物', watch.max >= 1, 'maxBadge=' + watch.max);
    check('A2 零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
    H.window.close(); G.window.close();
  }
  // ===== B：房主先完賽 → 來賓最後一人，從 0 跨里程碑應收到系統禮物 =====
  {
    const reg = {};
    const H = loadPage(reg, 'HB'), G = loadPage(reg, 'GB');
    const ids = await setup(H, G);
    const injectH = makeInject(H, ids.guestPid, 'sudoku');
    injectH({ type: 'GHOST_I_WON', senderUid: ids.hUid, id: 'wb1', time: Date.now(), winInfo: { id: ids.hUid, name: '房主甲', color: '#e74c3c', time: '01:00' } });
    await sleep(2500);
    const sol = solveN(readBoard(G.document));
    const watch = { max: 0 };
    await playRows(G, sol, 0, 2, watch);
    check('B 來賓最後一人（從零）：跨里程碑收到系統禮物', watch.max >= 1, 'maxBadge=' + watch.max);
    check('B 零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
    H.window.close(); G.window.close();
  }
  // ===== B2：來賓先打到約 50%，房主才完賽 → 後半場跨里程碑仍應收到禮物（實機情景，修前必失敗） =====
  {
    const reg = {};
    const H = loadPage(reg, 'HB2'), G = loadPage(reg, 'GB2');
    const ids = await setup(H, G);
    const sol = solveN(readBoard(G.document));
    const board0 = readBoard(G.document);
    const totalEmpty = Object.values(board0).filter(v => !v).length;
    const target = filledCount(G) + Math.ceil(totalEmpty * 0.5);
    for (let y = 0; y < 9 && filledCount(G) < target; y++) {
      const row = Object.keys(sol).filter(id => id.split('-')[1] === String(y) && !readBoard(G.document)[id]);
      await fillIds(G, row, sol);
    }
    console.log('  B2 來賓預打進度 filled=' + filledCount(G) + '/' + Object.keys(board0).length);
    const injectH = makeInject(H, ids.guestPid, 'sudoku');
    injectH({ type: 'GHOST_I_WON', senderUid: ids.hUid, id: 'wb2', time: Date.now(), winInfo: { id: ids.hUid, name: '房主甲', color: '#e74c3c', time: '01:00' } });
    await sleep(2500);
    await drainGifts(G);
    const watch = { max: 0 };
    await playRows(G, sol, 5, 2, watch);
    check('B2 來賓最後一人（已打 50%）：後半場跨里程碑仍收到系統禮物', watch.max >= 1, 'maxBadge=' + watch.max);
    check('B2 零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
    H.window.close(); G.window.close();
  }
  console.log('\n=== lastone2: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})();
