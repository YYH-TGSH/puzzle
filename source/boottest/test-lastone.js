// v1.27.0 最後一位規則＋數獨經濟改版（使用者 2026-11-01 定案）：
// 最後一位：只剩一位未完賽時，庫存攻擊道具全轉禮物、飛來的也轉、房主里程碑對他只發禮物（兩款）。
// 數獨經濟：禮物改計量制（每完成行/列/宮/數字 +0.5，滿 1 才送；36 次＝18 個）、里程碑改每 5% 逐格補報不跳過。
// 驗法：雙頁開局、mock 連線注入真路徑訊息、真解題跨里程碑/完成行，斷言 DOM。
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
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = reg; w.scrollTo = () => {}; try { w.localStorage.setItem('sudoku_input_mode', 'cell'); } catch (e) {} w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
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
const dockBtn = (p, view, icon) => { const bs = [...p.document.querySelectorAll(view + ' button')]; return bs.find(b => (b.textContent || '').includes(icon) && b.className.includes('rounded-full')) || null; };
const badge = (btn) => { if (!btn) return null; const s = [...btn.querySelectorAll('span')].map(x => x.textContent.trim()).find(t => /^[0-9]+$/.test(t)); return s ? parseInt(s, 10) : 1; };
// ---------- 數獨解題（讀 DOM 題面→回溯解→格子先行填指定格） ----------
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
    clickEl(p, g); await sleep(120);
    const btn = [...p.document.querySelectorAll('#view-sudoku button')].find(b => (b.textContent || '').trim() === String(sol[id]));
    if (btn) clickEl(p, btn);
    await sleep(120);
  }
}

(async () => {
  // ================= 數橋：最後一位 =================
  {
    const reg = {};
    const H = loadPage(reg, 'H1'), G = loadPage(reg, 'G1');
    await openRoom(H, G, 'hashi', 'race');
    const inGame = await waitFor(() => { const v = G.document.querySelector('#view-hashi'); return (v && v.classList.contains('active')) ? true : null; }, 60000, 'G in hashi');
    check('數橋：來賓進入競速', !!inGame);
    const hostPid = H.window.__PLAT_NET.myPid, guestPid = G.window.__PLAT_NET.myPid;
    const gUid = G.window.localStorage.getItem('plat_uid_hashi'), hUid = H.window.localStorage.getItem('plat_uid_hashi');
    const injectG = makeInject(G, hostPid, 'hashi');
    const injectH = makeInject(H, guestPid, 'hashi');
    // 來賓備齊炸橋＋迷霧（缺哪個補哪個，重試到道具列出現——注入太早會被遊戲掛載前的路由丟掉）
    let stocked = null;
    for (let r = 0; r < 8 && !stocked; r++) {
      if (!dockBtn(G, '#view-hashi', '💣')) injectG({ type: 'BRAWL_GRANT', toUid: gUid, item: 'bomb', fromUid: hUid });
      if (!dockBtn(G, '#view-hashi', '🌫️')) injectG({ type: 'BRAWL_GRANT', toUid: gUid, item: 'fog', fromUid: hUid });
      stocked = await waitFor(() => (dockBtn(G, '#view-hashi', '💣') && dockBtn(G, '#view-hashi', '🌫️')) ? true : null, 12000, 'G stock try' + r);
    }
    check('數橋：來賓持有炸橋＋迷霧', !!stocked, 'bomb badge=' + badge(dockBtn(G, '#view-hashi', '💣')) + ' fog badge=' + badge(dockBtn(G, '#view-hashi', '🌫️')));
    // 房主完賽 → 來賓變最後一位 → 庫存全轉禮物（🎁 badge = 炸+霧的數量）
    const expectConv = (badge(dockBtn(G, '#view-hashi', '💣')) || 0) + (badge(dockBtn(G, '#view-hashi', '🌫️')) || 0);
    injectG({ type: 'RACE_FINISH', uid: hUid, name: '房主甲', color: '#e74c3c', timeMs: 61000 });
    const converted = await waitFor(() => { const g = dockBtn(G, '#view-hashi', '🎁'); return (!dockBtn(G, '#view-hashi', '💣') && !dockBtn(G, '#view-hashi', '🌫️') && g && badge(g) === expectConv) ? true : null; }, 30000, 'G converted');
    check('數橋：剩最後一位 → 炸橋/迷霧轉成禮物', !!converted, 'expected gifts=' + expectConv);
    // 飛來的炸橋直接轉禮物：若湊滿 3 會自動連發歸零；未滿 3 則禮物 badge +1——兩種都算轉換成功（以 badge 變化或消失判定，不接受假通過）
    const beforeG = badge(dockBtn(G, '#view-hashi', '🎁'));
    injectG({ type: 'BRAWL_GRANT', toUid: gUid, item: 'bomb', fromUid: hUid });
    const inflight = await waitFor(() => { const g = dockBtn(G, '#view-hashi', '🎁'); return (!g || badge(g) === beforeG + 1) && !dockBtn(G, '#view-hashi', '💣') ? true : null; }, 30000, 'G inflight convert');
    check('數橋：最後一位收到炸橋直接轉禮物（不進炸橋庫存）', !!inflight, 'gift badge ' + beforeG + ' -> ' + badge(dockBtn(G, '#view-hashi', '🎁')));
    // 房主端真路徑：來賓完賽進房主視角 → 里程碑（來賓跨格）唯一候選＝房主 → 強制禮物
    injectH({ type: 'RACE_FINISH', uid: gUid, name: '來賓乙', color: '#3498db', timeMs: 62000 });
    await sleep(1500);
    injectH({ type: 'BRAWL_MILESTONE', uid: gUid, threshold: 5 });
    const hGift1 = await waitFor(() => { const g = dockBtn(H, '#view-hashi', '🎁'); return (g && badge(g) >= 1) ? true : null; }, 30000, 'H forced gift 1');
    check('數橋：里程碑對最後一位（房主）強制發禮物', !!hGift1);
    injectH({ type: 'BRAWL_MILESTONE', uid: gUid, threshold: 10 });
    injectH({ type: 'BRAWL_MILESTONE', uid: gUid, threshold: 15 });
    const blackLines = () => [...H.document.querySelectorAll('#view-hashi line')].filter(l => l.getAttribute('stroke') === '#000000').length;
    const giftFired = await waitFor(() => blackLines() >= 1 ? true : null, 40000, 'H gifts autofire');
    check('數橋：強制禮物湊滿 3 自動發動補橋（黑線）', !!giftFired, 'blackLines=' + blackLines());
    check('數橋：雙邊零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
    H.window.close(); G.window.close();
  }
  // ================= 數獨 A：最後一位轉換 =================
  {
    const reg = {};
    const H = loadPage(reg, 'H2'), G = loadPage(reg, 'G2');
    await openRoom(H, G, 'sudoku', 'brawl');
    const inGame = await waitFor(() => { const v = G.document.querySelector('#view-sudoku'); return (v && v.classList.contains('active')) ? true : null; }, 90000, 'G in sudoku');
    check('數獨：來賓進入競賽', !!inGame);
    await waitFor(() => G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? true : null, 90000, 'G cells');
    await sleep(8000);
    const hostPid = H.window.__PLAT_NET.myPid, guestPid = G.window.__PLAT_NET.myPid;
    const gUid = G.window.localStorage.getItem('plat_uid_sudoku'), hUid = H.window.localStorage.getItem('plat_uid_sudoku');
    const injectG = makeInject(G, hostPid, 'sudoku');
    const injectH = makeInject(H, guestPid, 'sudoku');
    const weaponBtn = (icon) => { const bs = [...G.document.querySelectorAll('#view-sudoku button')]; return bs.find(b => (b.textContent || '').includes(icon)) || null; };
    injectG({ type: 'RECEIVE_WEAPON', targetUid: gUid, weaponType: 'balloon', id: 'lb1', timestamp: Date.now() });
    injectG({ type: 'RECEIVE_WEAPON', targetUid: gUid, weaponType: 'eraser', id: 'le1', timestamp: Date.now() });
    const stocked = await waitFor(() => (weaponBtn('💧') && weaponBtn('🧹')) ? true : null, 30000, 'G weapons stocked');
    check('數獨：來賓持有水球＋橡皮擦', !!stocked);
    injectH({ type: 'GHOST_I_WON', senderUid: gUid, id: 'w1', time: Date.now(), winInfo: { id: hUid, name: '房主甲', color: '#e74c3c', time: '01:00' } });
    const converted = await waitFor(() => (!weaponBtn('💧') && !weaponBtn('🧹') && G.document.querySelector('#btn-open-gift')) ? true : null, 30000, 'G converted');
    check('數獨：剩最後一位 → 武器全轉禮物（武器鈕消失、禮物鈕出現）', !!converted);
    const filledCount = () => [...G.document.querySelectorAll('#view-sudoku g[id^="cell-"] text')].filter(t => /^[1-9]$/.test((t.textContent || '').trim())).length;
    const filledBefore = filledCount();
    injectG({ type: 'RECEIVE_GIFT', targetUid: gUid, senderUid: hUid, id: 'lg1', timestamp: Date.now() });
    const opened = await waitFor(() => (!G.document.querySelector('#btn-open-gift') && filledCount() >= filledBefore + 2) ? true : null, 30000, 'G gifts auto-open');
    check('數獨：轉換的禮物是真禮物（湊滿 3 自動拆開並揭露格子）', !!opened, 'filled ' + filledBefore + '->' + filledCount());
    injectG({ type: 'RECEIVE_WEAPON', targetUid: gUid, weaponType: 'balloon', id: 'lb2', timestamp: Date.now() });
    const inflight = await waitFor(() => (!weaponBtn('💧') && G.document.querySelector('#btn-open-gift')) ? true : null, 20000, 'G inflight weapon converts');
    check('數獨：最後一位收到武器直接轉禮物', !!inflight);
    check('數獨 A：雙邊零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
    H.window.close(); G.window.close();
  }
  // ================= 數獨 B：經濟改版（0.5 計量） =================
  {
    const src = fs.readFileSync('/home/hatch/workspace/sudoku-site/js/app.js', 'utf8');
    check('數獨出貨碼：里程碑每 5%（floor(pct/5)）', src.includes('Math.floor(myEffectivePct / 5)'));
    check('數獨出貨碼：禮物 +0.5 計量', src.includes('giftCreditRef.current += newComps * 0.5'));
    const reg = {};
    const H = loadPage(reg, 'H3'), G = loadPage(reg, 'G3');
    await openRoom(H, G, 'sudoku', 'brawl');
    await waitFor(() => { const v = G.document.querySelector('#view-sudoku'); return (v && v.classList.contains('active')) ? true : null; }, 90000, 'G3 in sudoku');
    await waitFor(() => G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? true : null, 90000, 'G3 cells');
    await sleep(8000);
    const sol = solveN(readBoard(G.document));
    const rowIds = (y) => Object.keys(sol).filter(id => id.split('-')[1] === String(y) && !readBoard(G.document)[id]);
    // 來賓解完第 0 列（恰好完成 1 個區域＝ +0.5 禮物額度）→ 房主不應收到禮物
    await fillIds(G, rowIds(0), sol);
    await sleep(4000);
    check('數獨經濟：完成 1 個區域（0.5）→ 不發禮物', !H.document.querySelector('#btn-open-gift'));
    // 再解完第 1 列（額度湊滿 1）→ 房主收到 1 個禮物
    await fillIds(G, rowIds(1), sol);
    const giftArrived = await waitFor(() => H.document.querySelector('#btn-open-gift') ? true : null, 30000, 'H gift after 1.0 credit');
    check('數獨經濟：累積滿 1 個 → 送出禮物給較弱的房主', !!giftArrived);
    check('數獨 B：雙邊零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
    H.window.close(); G.window.close();
  }
  console.log('\n=== lastone: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})();
