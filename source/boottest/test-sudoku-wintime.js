// 數獨大亂鬥完賽時間算錯（使用者 2026-11-04 實機回報：玩了快 10 分鐘，贏家時間顯示 00:51）：
// 來賓的完賽錨點 matchStartTime 會被房主 SYNC 帶來的「房主時鐘」startTime 原始覆寫（app.js syncState 直接採用、
// SYNC handler 又重設一次），沒做 D-05 時鐘偏移換算 → 完賽時間 = 真實時間 −（房主−來賓時鐘差）。
// 重現：來賓整頁時鐘慢房主 9 分鐘（-540s），開局後重播一則房主開局 SYNC（startTime=房主現在時間，形狀同真實生成 SYNC），
// 再把兩邊時鐘一起快轉 +600s 模擬長局，來賓填滿盤面 → 房主結算應顯示 ≈10 分鐘，而非 ≈1 分鐘。
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
function loadPage(label, skewMs) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); });
      const realNow = w.Date.now.bind(w.Date); let jump = 0;
      w.__clockJump = (ms) => { jump += ms; };
      w.Date.now = () => realNow() + skewMs + jump; } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
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
const parseClock = (s) => { const m = /(\d+):(\d{2})/.exec(s || ''); return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : -1; };

(async () => {
  const H = loadPage('H', 0);
  const G = loadPage('G', -540000); // 來賓時鐘慢 9 分鐘
  const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell'); if (!ok) { console.log('SHELL NOT READY', p.label); process.exit(2); } }
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  await waitFor(() => hubRoom(H), 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙'; G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  await waitFor(() => hubRoom(G), 60000, 'G room');
  await waitFor(() => H.window.__PLAT_NET.roster.length === 2 ? true : null, 30000, 'roster 2');
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await sleep(600);
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="brawl"]'));
  await sleep(800);
  // 結束條件改「前 1 名結束」，來賓完賽即結算（同使用者截圖情境）
  const wcSel = [...H.document.querySelectorAll('#lob-step-room select')].find(s => [...s.options].some(o => /名結束/.test(o.textContent || '')));
  if (wcSel) { const setter = Object.getOwnPropertyDescriptor(H.window.HTMLSelectElement.prototype, 'value').set; setter.call(wcSel, '1'); wcSel.dispatchEvent(new H.window.Event('change', { bubbles: true })); await sleep(400); }
  check('房主把結束條件設為前 1 名', !!wcSel);
  const readyBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="ready"]');
  const startBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="start"]');
  await waitFor(() => readyBtn(G) && readyBtn(H), 20000, 'ready btns');
  clickEl(G, readyBtn(G)); clickEl(H, readyBtn(H));
  const unlocked = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
  clickEl(H, unlocked);
  const inGame = await waitFor(() => { const v = G.document.querySelector('#view-sudoku'); return (v && v.classList.contains('active')) ? true : null; }, 90000, 'G in sudoku');
  check('來賓進入數獨大亂鬥', !!inGame);
  await waitFor(() => G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? true : null, 90000, 'G cells');
  await sleep(9000); // 等倒數結束、進 playing

  // 重播房主開局 SYNC（生成完成包的形狀：帶房主時鐘的 startTime）——真實流程裡這包在倒數結束後才到達來賓端
  const hostPid = H.window.__PLAT_NET.myPid;
  const conn = G.window.__PLAT_NET.conns[hostPid];
  check('來賓端有房主連線可注入', !!(conn && conn._h && conn._h.data));
  const pd = { type: 'SYNC', data: { isBrawlMode: true, startTime: H.window.Date.now() } };
  const copy = JSON.parse(JSON.stringify({ __pg: 'sudoku', __pd: pd }));
  conn._h.data.slice().forEach(f => { try { f(copy); } catch (e) {} });
  await sleep(600);

  // 模擬長局：兩邊時鐘一起快轉 10 分鐘
  H.window.__clockJump(600000); G.window.__clockJump(600000);
  await sleep(1500); // 讓 GameTimer tick
  const gTimer = [...G.document.querySelectorAll('#view-sudoku span, #view-sudoku div')].map(s => (s.textContent || '').trim()).filter(t => t.includes('⏱')).sort((a, b) => a.length - b.length)[0]; // F3：計時改殼 PlatTopCard 的 div 晶片（取最短者＝晶片本體）
  const gSecs = parseClock(gTimer);
  console.log('  來賓端計時器（快轉 10 分鐘後）:', gTimer);
  check('來賓計時器 ≈10 分鐘（未被房主時鐘污染）', gSecs >= 540, 'secs=' + gSecs);

  // 來賓填滿盤面完賽（多趟補填：jsdom 點擊偶爾被 re-render 吃掉）
  const board = readBoard(G.document);
  const sol = solveN(board);
  console.log('  待填格數:', Object.keys(board).filter(id => !board[id]).length);
  // 逐格填＋逐格驗證：點格→點數字後輪詢該格真的變成目標數字才往下，沒變就重試（避開 React 選格狀態落後把數字寫進別格）
  const cellVal = (id) => { const g = G.document.querySelector('#view-sudoku g[id="cell-' + id + '"]'); if (!g) return -1; const t = (g.textContent || '').trim(); return t ? parseInt(t, 10) : 0; };
  const numBtn = (v) => [...G.document.querySelectorAll('#view-sudoku button')].find(b => { const t = (b.textContent || '').trim(); return t[0] === String(v) && !b.disabled; });
  const inputMode = G.window.localStorage.getItem('sudoku_input_mode') || 'cell';
  console.log('  來賓輸入模式:', inputMode, '（num=數字先行：先點數字再點格；cell=格子先行：先點格再點數字）');
  async function fillCell(id) {
    for (let a = 0; a < 6; a++) {
      if (cellVal(id) === sol[id]) return true;
      const g = G.document.querySelector('#view-sudoku g[id="cell-' + id + '"]');
      if (!g) return false;
      if (inputMode === 'num') { const btn = numBtn(sol[id]); if (btn) clickEl(G, btn); await sleep(320); clickEl(G, g); }
      else { clickEl(G, g); await sleep(320); const btn = numBtn(sol[id]); if (btn) clickEl(G, btn); }
      const okv = await waitFor(() => cellVal(id) === sol[id] ? true : null, 1500, 'cell ' + id);
      if (okv) return true;
    }
    return cellVal(id) === sol[id];
  }
  const todoIds = Object.keys(board).filter(id => !board[id]);
  let filledOk = 0;
  for (const id of todoIds) { if (await fillCell(id)) filledOk++; }
  console.log('  逐格驗證填入成功:', filledOk, '/', todoIds.length);
  // 收尾：若有格被別格的落後寫入污染（值≠解），逐格修掉
  for (let round = 0; round < 3; round++) {
    const cur = readBoard(G.document);
    const bad = Object.keys(cur).filter(id => cur[id] !== sol[id]);
    if (!bad.length) break;
    console.log('  收尾第 ' + (round + 1) + ' 輪待修:', bad.length);
    for (const id of bad) await fillCell(id);
  }
  const after = readBoard(G.document);
  console.log('  填完後來賓盤面已填格數:', Object.values(after).filter(v => v).length, '/', Object.keys(after).length, '（完賽後盤面會切觀戰視角、讀不到格子屬正常，以房主結算為準）');
  // 房主端結算卡（PlatResults「大亂鬥結果」）裡贏家列的時間
  const result = await waitFor(() => {
    const txt = H.document.body.textContent || '';
    const m = /大亂鬥結果[\s\S]{0,800}?來賓乙[\s\S]{0,200}?⏱\s*(\d+):(\d{2})/.exec(txt);
    return m ? { raw: '⏱ ' + m[1] + ':' + m[2], secs: parseInt(m[1], 10) * 60 + parseInt(m[2], 10) } : null;
  }, 60000, 'host results time');
  console.log('  房主端贏家時間:', result && result.raw);
  check('房主結算顯示贏家時間 ≈10 分鐘', !!result && result.secs >= 540, result ? 'secs=' + result.secs : 'no result');
  check('兩頁零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + (G.errors[0] || ''));
  console.log(`\n==== RESULT: ${pass} passed, ${fail} failed ====`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FATAL', e && e.stack || e); process.exit(2); });
