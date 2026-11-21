// 診斷版：數獨 A 情景（來賓先完賽、房主最後一人）分段探針。
// 探針：①房主填格是否真的進 localCells（盤面讀回）②武器列/禮物鈕 DOM ③直接注入 MILESTONE_REACHED(uid=房主) 切分 effect vs handleMilestone
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
html = html.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
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
function probe(H, tag) {
  const D = H.document;
  const gift = D.querySelector('#btn-open-gift');
  const view = D.querySelector('#view-sudoku');
  const btns = view ? [...view.querySelectorAll('button')].map(b => (b.textContent || '').trim()).filter(t => /💧|🧹|🎁/.test(t)) : [];
  const board = readBoard(D);
  const filled = Object.values(board).filter(v => v).length;
  console.log('  [probe ' + tag + '] giftBtn=' + (gift ? 'YES badge=' + gift.textContent.trim() : 'no') + ' itemBtns=' + JSON.stringify(btns) + ' filledCells=' + filled);
}
(async () => {
  const reg = {};
  const H = loadPage(reg, 'HA'), G = loadPage(reg, 'GA');
  await openRoom(H, G, 'sudoku', 'brawl');
  await waitFor(() => { const v = G.document.querySelector('#view-sudoku'); return (v && v.classList.contains('active')) ? true : null; }, 90000, 'in sudoku');
  await waitFor(() => G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? true : null, 90000, 'cells');
  await sleep(8000);
  const ids = { hostPid: H.window.__PLAT_NET.myPid, guestPid: G.window.__PLAT_NET.myPid, gUid: G.window.localStorage.getItem('plat_uid_sudoku'), hUid: H.window.localStorage.getItem('plat_uid_sudoku') };
  console.log('uids: hUid=' + ids.hUid + ' gUid=' + ids.gUid);
  const injectH = makeInject(H, ids.guestPid, 'sudoku');
  injectH({ type: 'GHOST_I_WON', senderUid: ids.gUid, id: 'wa1', time: Date.now(), winInfo: { id: ids.gUid, name: '來賓乙', color: '#3498db', time: '01:00' } });
  await sleep(2500);
  probe(H, 'after guest win');
  const sol = solveN(readBoard(H.document));
  const rowIds = (y) => Object.keys(sol).filter(id => id.split('-')[1] === String(y) && !readBoard(H.document)[id]);
  await fillIds(H, rowIds(0), sol);
  probe(H, 'after row0');
  await fillIds(H, rowIds(1), sol);
  await sleep(3000);
  probe(H, 'after row1 +3s');
  // 切分：直接注入 MILESTONE_REACHED（觸發者=房主）→ 若禮物出現，病灶在房主自己的里程碑 effect；若仍無，病灶在 handleMilestone/入包
  const okInj = injectH({ type: 'MILESTONE_REACHED', uid: ids.hUid, completionPct: 50, id: 'msdbg1', timestamp: Date.now() });
  console.log('  injected MILESTONE_REACHED for host: ' + okInj);
  await sleep(3000);
  probe(H, 'after direct milestone inject');
  console.log('errors H: ' + JSON.stringify(H.errors.slice(0, 3)) + ' G: ' + JSON.stringify(G.errors.slice(0, 3)));
  H.window.close(); G.window.close();
  process.exit(0);
})();
