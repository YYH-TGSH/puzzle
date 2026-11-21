// v1.5.0 驗證：(A) 數獨來賓重入後不得出現開始鈕（isHost 未重置 bug）；(B) 開始按鈕門檻：全員準備或等待滿 PLAT_START_WAIT_MS 才亮
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
  const dom = new JSDOM(html, {
    url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) {
      window.__SHARED_REG__ = SHARED_REG;
      window.fetch = (url, opts) => fetch(new URL(url, window.location.href).href, opts);
      window.scrollTo = () => {};
    },
  });
  const w = dom.window;
  w.addEventListener('error', (e) => { if (e.message && !/Script error/.test(e.message)) errors.push(e.message); });
  return { w, D: w.document, errors };
}
function setInput(w, el, val) {
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set;
  setter.call(el, val);
  el.dispatchEvent(new w.Event('input', { bubbles: true }));
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
  return true;
}
const HTML = '/home/hatch/workspace/platform/platform-v1-test.html';
const startBtn = (pg) => pg.D.querySelector('[data-pr="start"]'); // 2026-11-21 修：PlatRoom 是 body 層 overlay，data-pr 元素不在 #view-sudoku 內（舊 scope 使 R1 全部讀空、斷言 vacuous）
const inSudokuRoom = (pg) => !!pg.D.querySelector('[data-pr-region="roster"]'); // 同上：roster 在殼房間頁 overlay
function exitToLobby(pg) {
  try { pg.w.__PLAT_HOOKS_sudoku.exit(); } catch (e) {}
  pg.w.PLAT_show('home');
}
(async () => {
  const host = loadPageShared(HTML);
  await waitFor(() => typeof host.w.PLAT_show === 'function' && host.w.PlatDock, 600000, 'host shell');
  click(host.w, host.D.querySelector('#lob-go-create'));
  await waitFor(() => host.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'host nick step');
  setInput(host.w, host.D.querySelector('#lob-name'), '阿主');
  click(host.w, host.D.querySelector('#lob-confirm'));
  await waitFor(() => host.w.__PLAT_NET && host.w.__PLAT_NET.code, 60000, 'host room code'); // 2026-11-21 修：#lob-room-code 已隨舊大廳退役，房號改讀 __PLAT_NET.code
  const code = host.w.__PLAT_NET.code;
  const guest = loadPageShared(HTML);
  await waitFor(() => typeof guest.w.PLAT_show === 'function' && guest.w.PlatDock, 600000, 'guest shell');
  click(guest.w, guest.D.querySelector('#lob-go-join'));
  await waitFor(() => guest.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'guest nick step');
  setInput(guest.w, guest.D.querySelector('#lob-code'), code);
  setInput(guest.w, guest.D.querySelector('#lob-name'), '阿客');
  click(guest.w, guest.D.querySelector('#lob-confirm'));
  await waitFor(() => (guest.D.querySelector('#lob-roster') || { textContent: '' }).textContent.includes('阿主'), 60000, 'guest sees host');

  // ===== 第一輪（新進房）=====
  click(host.w, host.D.querySelector('#lob-step-room [data-rtab="sudoku"]')); // 2026-11-21 修：data-launch 已不存在；房間頁即等待室，數獨分頁預設 coop
  await waitFor(() => inSudokuRoom(host), 180000, 'host sudoku room R1');
  await waitFor(() => inSudokuRoom(guest), 180000, 'guest sudoku room R1');
  check('R1 來賓沒有開始按鈕', !startBtn(guest));
  const hb1 = startBtn(host);
  check('R1 房主有開始按鈕', !!hb1);
  check('R1 未全員準備→房主開始鈕 disabled', !!hb1 && hb1.disabled === true);
  click(host.w, host.D.querySelector('[data-pr="ready"]'));
  await sleep(1500);
  check('R1 只有房主準備→仍 disabled', startBtn(host) && startBtn(host).disabled === true);
  click(guest.w, guest.D.querySelector('[data-pr="ready"]'));
  const en = await waitFor(() => { const b = startBtn(host); return b && !b.disabled; }, 30000, 'host start enabled after all ready');
  check('R1 全員準備→房主開始鈕亮起', !!en);
  click(host.w, startBtn(host));
  const gone1 = await waitFor(() => !inSudokuRoom(host), 30000, 'host leaves waiting after start');
  check('R1 房主按下開始→進入遊戲', !!gone1);

  // ===== 雙方退出回大廳（觸發 switchToOffline 的 isHost=true 污染）=====
  exitToLobby(host); exitToLobby(guest);
  await sleep(2500);

  // ===== 第二輪（重入——原 bug 在這裡讓來賓看到開始鈕）=====
  host.w.PLAT_START_WAIT_MS = 3000; // 測試用短閾值（產品預設 60000）
  click(host.w, host.D.querySelector('#lob-step-room [data-rtab="sudoku"]')); // 2026-11-21 修：data-launch 已不存在；房間頁即等待室，數獨分頁預設 coop
  await waitFor(() => inSudokuRoom(host), 180000, 'host sudoku room R2');
  await waitFor(() => inSudokuRoom(guest), 180000, 'guest sudoku room R2');
  await sleep(1500);
  check('R2 來賓沒有開始按鈕（原 bug 迴歸點）', !startBtn(guest));
  const gw = guest.D.querySelector('#view-sudoku').textContent;
  check('R2 來賓看到「等待房主開始」', gw.includes('等待房主開始'));
  check('R2 房主有開始按鈕', !!startBtn(host));
  check('R2 進房初期開始鈕 disabled（無人準備）', startBtn(host) && startBtn(host).disabled === true);
  const en2 = await waitFor(() => { const b = startBtn(host); return b && !b.disabled; }, 30000, 'host start enabled after wait threshold');
  check('R2 無人準備、等滿閾值→房主開始鈕亮起（防掛機）', !!en2);
  click(host.w, startBtn(host));
  const gone2 = await waitFor(() => !inSudokuRoom(host), 30000, 'host leaves waiting after waited start');
  check('R2 等待路徑按下開始→進入遊戲', !!gone2);
  check('零頁面錯誤（host+guest）', host.errors.length === 0 && guest.errors.length === 0);
  report([...host.errors, ...guest.errors]); host.w.close(); guest.w.close();
})().catch((e) => { console.error('FATAL', e); report([]); process.exitCode = 1; });
