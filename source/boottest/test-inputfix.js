// 輸入修正專項（v1.29.0）：
// 數獨——觸控筆快點時瀏覽器手勢仲裁會吃掉 click（水波紋有出、數字沒填）：點按改由 pointerup 直接處理。
//   驗：①全程不發 click、只用 pointerdown/up 也能吸取＋填入 ②pointerup 處理後跟來的 click 不得把剛填的數字切掉（dedupe）
//       ③長按清除仍有效，且長按放開後的 click 不得把格子填回去
// 踩地雷——誤觸三主因：長按計時器在 pointercancel（捲動接管）時漏清、移動不取消、門檻 380ms 太短。
//   驗：①長按 500ms 插旗仍有效 ②短按不插旗 ③按住移動 >10px 取消長按 ④pointercancel 後不插旗 ⑤一般 click 挖開仍正常
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
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (timeout: ' + label + ')'); return null; }
function loadPage(reg, label, sudokuGeom) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.__SHARED_REG__ = reg; w.scrollTo = () => {};
      if (sudokuGeom && w.SVGSVGElement) {
        // jsdom 沒有 SVG 幾何 API：給恆等映射，讓測試能用 SVG 座標（PADDING 20 + 格 60）直接點格子
        w.SVGSVGElement.prototype.createSVGPoint = function () { return { x: 0, y: 0, matrixTransform: function () { return { x: this.x, y: this.y }; } }; };
        w.SVGSVGElement.prototype.getScreenCTM = function () { return { inverse: function () { return {}; } }; };
      }
      w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); });
    } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function pev(p, el, type, x, y) {
  if (!el) return;
  el.dispatchEvent(new p.window.MouseEvent(type, { bubbles: true, clientX: x || 0, clientY: y || 0, button: 0 }));
}
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
function readBoard(D) {
  const cells = {};
  D.querySelectorAll('#view-sudoku g[id^="cell-"]').forEach(g => { const id = g.getAttribute('id').slice(5); const t = (g.textContent || '').trim(); cells[id] = t ? parseInt(t, 10) : 0; });
  return cells;
}
(async () => {
  // ===== 數獨：pointer-only 點按（模擬 click 被吃掉的觸控筆快點） =====
  {
    const reg = {};
    const H = loadPage(reg, 'HS', true), G = loadPage(reg, 'GS', true);
    await openRoom(H, G, 'sudoku', 'brawl');
    await waitFor(() => { const v = H.document.querySelector('#view-sudoku'); return (v && v.classList.contains('active')) ? true : null; }, 90000, 'in sudoku');
    await waitFor(() => H.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? true : null, 90000, 'cells');
    await sleep(7000); // 等倒數結束
    const board = readBoard(H.document);
    const givenId = Object.keys(board).find(id => board[id] !== 0);
    const emptyId = Object.keys(board).find(id => board[id] === 0);
    const v = board[givenId];
    const cellEl = (p, id) => p.document.querySelector('#view-sudoku g[id="cell-' + id + '"]');
    const center = (id) => { const [x, y] = id.split('-').map(Number); return [50 + x * 60, 50 + y * 60]; };
    const tapPtr = async (id) => { const [cx, cy] = center(id); pev(H, cellEl(H, id), 'pointerdown', cx, cy); await sleep(60); pev(H, cellEl(H, id), 'pointerup', cx, cy); await sleep(250); };
    // ① 吸取（點已填格）＋填入（點空格），全程沒有 click
    await tapPtr(givenId);
    await tapPtr(emptyId);
    check('數獨：只用 pointer 事件（無 click）也能填入數字', readBoard(H.document)[emptyId] === v, 'cell=' + readBoard(H.document)[emptyId] + ' want=' + v);
    // ② 之後跟來的 click 不得重複觸發（同一格再被 applyCharToCell 會切成清除）
    clickEl(H, cellEl(H, emptyId));
    await sleep(300);
    check('數獨：pointerup 處理後的 click 被 dedupe、不誤清剛填的數字', readBoard(H.document)[emptyId] === v, 'cell=' + readBoard(H.document)[emptyId]);
    // ③ 長按清除仍有效；長按放開的 click 不得填回
    const [fx, fy] = center(emptyId);
    pev(H, cellEl(H, emptyId), 'pointerdown', fx, fy);
    await sleep(750); // > 500ms 長按門檻
    pev(H, cellEl(H, emptyId), 'pointerup', fx, fy);
    await sleep(300);
    check('數獨：長按 500ms 清除仍有效', readBoard(H.document)[emptyId] === 0, 'cell=' + readBoard(H.document)[emptyId]);
    clickEl(H, cellEl(H, emptyId));
    await sleep(300);
    check('數獨：長按放開後的 click 不會把格子填回去', readBoard(H.document)[emptyId] === 0, 'cell=' + readBoard(H.document)[emptyId]);
    // ⑤ 手勢仲裁補償：pointerdown 後只收到 pointercancel（同點、筆尖沒動）也要算一次點按——觸控筆同點連點的第二下正是這樣被吞
    const boardNow = readBoard(H.document);
    const empties2 = Object.keys(boardNow).filter(id => boardNow[id] === 0 && id !== emptyId);
    const e2 = empties2[0];
    const [c2x, c2y] = center(e2);
    pev(H, cellEl(H, e2), 'pointerdown', c2x, c2y); await sleep(60);
    pev(H, cellEl(H, e2), 'pointercancel', c2x, c2y); await sleep(300);
    check('數獨：點按被手勢仲裁 claim（pointercancel、同點）仍補填', readBoard(H.document)[e2] === v, 'cell=' + readBoard(H.document)[e2] + ' want=' + v);
    // ⑥ 捲動起手防護：按下後移動 20 單位才被 cancel → 是捲動、不是點按，不得補填
    const e3 = empties2[1];
    const [c3x, c3y] = center(e3);
    pev(H, cellEl(H, e3), 'pointerdown', c3x, c3y); await sleep(60);
    pev(H, cellEl(H, e3), 'pointermove', c3x + 20, c3y); await sleep(60);
    pev(H, cellEl(H, e3), 'pointercancel', c3x + 20, c3y); await sleep(300);
    check('數獨：移動後被 cancel（捲動起手）不補填', readBoard(H.document)[e3] === 0, 'cell=' + readBoard(H.document)[e3]);
    check('數獨段零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
    H.window.close(); G.window.close();
  }
  // ===== 踩地雷：長按插旗的取消衞生 =====
  {
    const M = loadPage({}, 'M', false);
    const w = M.window, d = M.document;
    await waitFor(() => typeof w.PLAT_show === 'function' && w.PlatDock ? true : null, 120000, 'shell');
    w.PLAT_show('mines');
    await waitFor(() => d.querySelector('#mines-root h1'), 60000, 'mines home');
    const clickBtn = (txt) => { const b = [...d.querySelectorAll('#mines-root button')].find(x => x.textContent.includes(txt)); if (b) { b.click(); return true; } return false; };
    clickBtn('單機挑戰'); await sleep(300);
    clickBtn('9×9');
    await waitFor(() => d.querySelectorAll('#mines-root button[data-cell]').length === 81 ? true : null, 30000, '81 cells');
    const dbg = () => w.__PLAT_HOOKS_mines.debug();
    const snap0 = dbg();
    const safe = []; snap0.layout.forEach((m, i) => { if (!m) safe.push(i); });
    const [iA, iB] = safe;
    const cellEl = (i) => d.querySelector('#mines-root button[data-cell="' + i + '"]');
    // v1.54.2 後的語意：短按在 pointerup 就挖開（不再等 click）——②的舊前提「短按不挖」已隨該版作廢；
    // ③④改為動態挑「當下仍未開」的安全格，避免②的洪泛連鎖開格污染後續斷言（實測踩過：iC/iD 被②洪泛掃到變 'o'）。
    const freshHidden = () => { const dd = dbg(); const cs = dd.cells; for (let i = 0; i < dd.layout.length; i++) if (!dd.layout[i] && cs[i] === 'h') return i; return -1; }; // 挑格改用當下 layout 重算（稽核裁決 2026-11-11）：首挖觸發版面重生後舊 safe 快照失效、會挑到已變雷的格——僅修挑格、斷言本體不動
    // ① 長按 500ms+ 插旗有效
    pev(M, cellEl(iA), 'pointerdown', 100, 100); await sleep(700); pev(M, cellEl(iA), 'pointerup', 100, 100); await sleep(200);
    check('地雷：長按插旗仍有效（500ms）', dbg().cells[iA] === 'f', 'cell=' + dbg().cells[iA]);
    // ② 短按：不插旗（v1.54.2 起短按在 pointerup 挖開 → 期望 'o'）
    pev(M, cellEl(iB), 'pointerdown', 100, 100); await sleep(150); pev(M, cellEl(iB), 'pointerup', 100, 100); await sleep(700);
    check('地雷：短按不插旗（pointerup 挖開）', dbg().cells[iB] === 'o', 'cell=' + dbg().cells[iB]);
    // ③ 按住移動 >22px → 長按取消、點按作廢（挑當下仍隱藏的格）
    const iC = freshHidden();
    pev(M, cellEl(iC), 'pointerdown', 100, 100); await sleep(60); pev(M, cellEl(iC), 'pointermove', 140, 100); await sleep(700); pev(M, cellEl(iC), 'pointerup', 140, 100); await sleep(200);
    check('地雷：按住移動後不插旗也不挖（移動取消＋漂移作廢）', dbg().cells[iC] === 'h', 'cell=' + dbg().cells[iC]);
    // ④ pointercancel（捲動接管）→ 計時器清掉、不插旗不挖
    const iD = freshHidden();
    pev(M, cellEl(iD), 'pointerdown', 100, 100); await sleep(60); pev(M, cellEl(iD), 'pointercancel', 100, 100); await sleep(800);
    check('地雷：pointercancel 後不插旗（捲動不誤觸）', dbg().cells[iD] === 'h', 'cell=' + dbg().cells[iD]);
    const iDig = freshHidden();
    // ⑤ 一般 click 挖開正常
    cellEl(iDig).click(); await sleep(300);
    check('地雷：一般 click 挖開正常', dbg().cells[iDig] === 'o', 'cell=' + dbg().cells[iDig]);
    check('地雷段零錯誤', M.errors.length === 0, M.errors[0] || '');
    M.window.close();
  }
  console.log('\n=== inputfix: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})();
