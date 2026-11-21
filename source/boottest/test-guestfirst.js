// Bug（v1.6.0 修）：數獨大亂鬥/五戰，來賓先完賽時房主被跳結算畫面（allDone 漏算房主自己）
// 流程：4x4 大亂鬥，來賓先解完 → 房主必須還在比賽中（無結果畫面）；房主再解完 → 雙方結算
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const mockSrc = require('./mockpeer.js');
const { sleep, waitFor, click, check, report } = require('./harness');
const SHARED_REG = {};
function loadPageShared(htmlPath) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/<script[^>]+src="[^"]*peerjs[^"]*"[^>]*><\/script>/, '<script>' + mockSrc + '</script>');
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(m); });
  vc.on('error', (m) => errors.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { window.__SHARED_REG__ = SHARED_REG; window.fetch = (url, opts) => fetch(new URL(url, window.location.href).href, opts); window.scrollTo = () => {}; try { window.localStorage.setItem('sudoku_input_mode', 'cell'); } catch (e) {} } });
  const w = dom.window;
  w.addEventListener('error', (e) => { if (e.message && !/Script error/.test(e.message)) errors.push(e.message); });
  return { w, D: w.document, errors };
}
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
const HTML = '/home/hatch/workspace/platform/platform-v1-test.html';
function readBoard(D) {
  const cells = {};
  D.querySelectorAll('g[id^="cell-"]').forEach(g => {
    const id = g.getAttribute('id').slice(5);
    const t = (g.textContent || '').trim();
    cells[id] = t ? parseInt(t, 10) : 0;
  });
  return cells;
}
function solve4(board) {
  const ids = Object.keys(board);
  const N = Math.round(Math.sqrt(ids.length));
  const B = N === 4 ? 2 : 3;
  const grid = {};
  ids.forEach(id => { grid[id] = board[id]; });
  const ok = (id, v) => {
    const [x, y] = id.split('-').map(Number);
    for (const o of ids) { if (o === id) continue; const [ox, oy] = o.split('-').map(Number); if (grid[o] === v && (ox === x || oy === y || (Math.floor(ox / B) === Math.floor(x / B) && Math.floor(oy / B) === Math.floor(y / B)))) return false; }
    return true;
  };
  const empties = ids.filter(id => !grid[id]);
  const bt = (i) => { if (i === empties.length) return true; const id = empties[i]; for (let v = 1; v <= N; v++) { if (ok(id, v)) { grid[id] = v; if (bt(i + 1)) return true; grid[id] = 0; } } return false; };
  bt(0);
  return grid;
}
async function fillBoard(pg, tag) {
  await waitFor(() => { const cd = pg.D.querySelector('#plat-countdown'); return !cd || cd.style.display !== 'flex'; }, 30000, tag + ' countdown over');
  await sleep(800);
  const board = readBoard(pg.D);
  const sol = solve4(board);
  for (let pass = 0; pass < 4; pass++) {
    const cur = readBoard(pg.D);
    const todo = Object.keys(cur).filter(id => !cur[id]);
    if (!todo.length) break;
    for (const id of todo) {
      const g = pg.D.querySelector('g[id="cell-' + id + '"]');
      if (!g) continue;
      click(pg.w, g);
      await sleep(80);
      const want = String(sol[id]);
      const btns = [...pg.D.querySelectorAll('#view-sudoku button')].filter(b => (b.textContent || '').trim() === want);
      if (!btns.length) continue;
      click(pg.w, btns[0]);
      await sleep(80);
    }
  }
}
(async () => {
  const host = loadPageShared(HTML), guest = loadPageShared(HTML);
  await waitFor(() => typeof host.w.PLAT_show === 'function' && host.w.PlatDock, 600000, 'host shell');
  await waitFor(() => typeof guest.w.PLAT_show === 'function' && guest.w.PlatDock, 600000, 'guest shell');
  // 現行開局（v1.11+ 殼房間頁；舊版 [data-launch]＋遊戲內等待室已刪——2026-11-21 改寫，抄 test-autogod makeRoom）
  click(host.w, host.D.querySelector('#lob-go-create'));
  await waitFor(() => host.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'host nick');
  setInput(host.w, host.D.querySelector('#lob-name'), '阿主');
  click(host.w, host.D.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = host.D.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && host.w.__PLAT_NET && host.w.__PLAT_NET.code; }, 150000, 'host room');
  const code = host.w.__PLAT_NET.code;
  click(guest.w, guest.D.querySelector('#lob-go-join'));
  await waitFor(() => guest.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'guest nick');
  setInput(guest.w, guest.D.querySelector('#lob-name'), '阿客');
  setInput(guest.w, guest.D.querySelector('#lob-code'), code);
  click(guest.w, guest.D.querySelector('#lob-confirm'));
  await waitFor(() => { const r = guest.D.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 90000, 'guest in room');
  for (const pg of [host, guest]) { pg.w.PLAT_show('sudoku'); await waitFor(() => !!pg.w.__PLAT_HOOKS_sudoku, 300000, 'preboot sudoku'); pg.w.PLAT_show('lobby'); }
  click(host.w, host.D.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await waitFor(() => guest.w.__PLAT_NET && guest.w.__PLAT_NET.armed && guest.w.__PLAT_NET.armed.game === 'sudoku', 30000, 'guest armed');
  click(host.w, host.D.querySelector('#lob-step-room [data-hub-mode="brawl"][data-hub-game="sudoku"]'));
  await sleep(600);
  const sels = host.D.querySelectorAll('#lob-step-room [data-pr-slot="settings"] select');
  const setSel = (s, v) => { const setter = Object.getOwnPropertyDescriptor(host.w.HTMLSelectElement.prototype, 'value').set; setter.call(s, v); s.dispatchEvent(new host.w.Event('change', { bubbles: true })); };
  for (const s of sels) { const vals = [...s.options].map(o => o.value); if (vals.includes('4')) setSel(s, '4'); if (vals.includes('easy')) setSel(s, 'easy'); }
  await sleep(1200);
  const presVisible = (pg) => { const el = pg.D.querySelector('#plat-results'); return !!el && el.style.display === 'flex'; };
  const presText = (pg) => { const el = pg.D.querySelector('#plat-results'); return el ? el.textContent : ''; };
  click(host.w, host.D.querySelector('#lob-step-room [data-pr="ready"]'));
  await sleep(600);
  click(guest.w, guest.D.querySelector('#lob-step-room [data-pr="ready"]'));
  const startEnabled = await waitFor(() => { const sb = host.D.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled; }, 90000, 'start enabled');
  if (startEnabled) click(host.w, host.D.querySelector('#lob-step-room [data-pr="start"]'));
  await waitFor(() => host.w.__PLAT_NET.inMatch === 'sudoku' && guest.w.__PLAT_NET.inMatch === 'sudoku', 120000, 'inMatch');
  const started = await waitFor(() => host.D.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 && guest.D.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0, 90000, 'boards');
  check('比賽開始、雙邊盤面出現', !!started);
  await sleep(1000);
  // ★ 來賓先完賽
  await fillBoard(guest, 'G');
  const guestDone = await waitFor(() => presVisible(guest), 30000, 'guest results');
  check('來賓先完賽：來賓看到自己的結果畫面', !!guestDone);
  await sleep(4000);
  check('★ 房主還在比賽中（沒有被跳出結算畫面）', !presVisible(host));
  // 房主再完賽 → 這時才結算
  await fillBoard(host, 'H');
  const hostDone = await waitFor(() => presVisible(host), 30000, 'host results');
  check('房主完賽後：房主看到結算畫面', !!hostDone);
  await sleep(2000);
  const hostText = presText(host);
  check('房主結算含來賓（第 1 名阿客）', hostText.includes('阿客') && hostText.indexOf('阿客') < hostText.indexOf('阿主'));
  check('房主結算不再卡等待', !hostText.includes('等待其他玩家完成'));
  check('零頁面錯誤（host+guest）', host.errors.length === 0 && guest.errors.length === 0);
  report([...host.errors, ...guest.errors]);
  process.exit(0);
})().catch((e) => { console.error('FATAL', e); report([]); process.exit(1); });
