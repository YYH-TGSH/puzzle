// v1.8.1 驗收：拿掉多人連線選單頁（建/入房直達等待室）/ 等待室內分頁切換 / 藍色回大廳鈕回主頁 / 五戰嚴格結算
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const mockSrc = require('./mockpeer.js');
const { sleep, waitFor, click } = require('./harness');
let pass = 0, fail = 0;
const check = (name, ok, extra) => { if (ok) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗ FAIL:', name, extra || ''); } };
const REG = {};
function loadPage(htmlPath, seed) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/<script[^>]+src="[^"]*peerjs[^"]*"[^>]*><\/script>/, '<script>' + mockSrc + '</script>');
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(m); });
  vc.on('error', (m) => errors.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { window.__SHARED_REG__ = REG; window.scrollTo = () => {}; if (seed) { try { for (const k in seed) window.localStorage.setItem(k, seed[k]); } catch (e) {} } } });
  const w = dom.window;
  w.addEventListener('error', (e) => { if (e.message && !/Script error/.test(e.message)) errors.push(e.message); });
  return { w, D: w.document, errors };
}
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
const HTML = '/home/hatch/workspace/platform/platform-v1-test.html';
const bundle = fs.readFileSync(HTML, 'utf8');
const rosterOf = (pg, game) => pg.D.querySelector('#view-' + game + ' [data-pr-region="roster"]');
(async () => {
  check('版本 1.8.1（bundle）', bundle.includes("PLAT_VERSION = '1.8.1'"));
  check('藍色回大廳鈕改回主頁（bundle 靜態）', (bundle.match(/PLAT_show\('home'\)/g) || []).length >= 2);

  // === 房主建房 → 直達數獨等待室 ===
  const host = loadPage(HTML);
  await waitFor(() => typeof host.w.PLAT_show === 'function' && host.w.PlatDock, 600000, 'host shell');
  host.w.PLAT_show('lobby');
  click(host.w, host.D.querySelector('#lob-go-create'));
  await waitFor(() => host.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'host nick');
  setInput(host.w, host.D.querySelector('#lob-name'), '阿主');
  click(host.w, host.D.querySelector('#lob-confirm'));
  const hRos = await waitFor(() => rosterOf(host, 'sudoku'), 90000, 'host auto-enter sudoku room');
  check('建房後直達數獨等待室（跳過多人連線選單）', !!hRos);
  check('直達時不在大廳畫面', host.D.body.getAttribute('data-view') === 'sudoku', host.D.body.getAttribute('data-view'));
  await waitFor(() => host.w.__PLAT_NET && host.w.__PLAT_NET.code, 60000, 'host room code'); // 2026-11-21 修：#lob-room-code 已退役，房號改讀 __PLAT_NET.code
  const code = host.w.__PLAT_NET.code;
  check('房號取得', code.length === 4, code);
  const hTabs = host.D.querySelector('#view-sudoku [data-pr-region="tabs"]');
  check('等待室有分頁列（三個分頁）', !!hTabs && hTabs.querySelectorAll('[data-rtab]').length === 3);
  check('等待室有合作/大亂鬥切換', !!hTabs && hTabs.querySelectorAll('[data-rmode]').length === 2);
  await waitFor(() => (rosterOf(host, 'sudoku').textContent || '').includes('阿主'), 30000, 'host roster self');
  check('房主在等待室名單中', true);

  // === 來賓入房 → 直達同一個等待室 ===
  const guest = loadPage(HTML);
  await waitFor(() => typeof guest.w.PLAT_show === 'function' && guest.w.PlatDock, 600000, 'guest shell');
  guest.w.PLAT_show('lobby');
  click(guest.w, guest.D.querySelector('#lob-go-join'));
  await waitFor(() => guest.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'guest nick');
  setInput(guest.w, guest.D.querySelector('#lob-name'), '阿客');
  setInput(guest.w, guest.D.querySelector('#lob-code'), code);
  click(guest.w, guest.D.querySelector('#lob-confirm'));
  const gRos = await waitFor(() => rosterOf(guest, 'sudoku'), 120000, 'guest auto-enter sudoku room');
  check('來賓入房直達數獨等待室', !!gRos);
  check('來賓畫面在數獨不在大廳', guest.D.body.getAttribute('data-view') === 'sudoku', guest.D.body.getAttribute('data-view'));
  await waitFor(() => (rosterOf(host, 'sudoku').textContent || '').includes('阿客'), 60000, 'host sees guest');
  check('房主名單有來賓', true);
  await waitFor(() => (rosterOf(guest, 'sudoku').textContent || '').includes('阿主'), 60000, 'guest sees host');
  check('來賓名單有房主', true);
  const gTabs = guest.D.querySelector('#view-sudoku [data-pr-region="tabs"]');
  check('來賓等待室也看得到分頁列', !!gTabs && gTabs.querySelectorAll('[data-rtab]').length === 3);

  // === 房主在等待室切數橋 → 全房跟著換 ===
  click(host.w, host.D.querySelector('#view-sudoku [data-rtab="hashi"]'));
  const hh = await waitFor(() => rosterOf(host, 'hashi'), 240000, 'host hashi room');
  check('房主切數橋 → 進數橋等待室', !!hh);
  const gh = await waitFor(() => rosterOf(guest, 'hashi'), 240000, 'guest hashi room');
  check('來賓自動跟到數橋等待室', !!gh);
  await waitFor(() => (rosterOf(guest, 'hashi').textContent || '').includes('阿主'), 60000, 'guest hashi roster');
  check('數橋等待室名單完整', true);

  // === 切回數獨 + 模式切大亂鬥 ===
  click(host.w, host.D.querySelector('#view-hashi [data-rtab="sudoku"]'));
  await waitFor(() => rosterOf(host, 'sudoku'), 90000, 'host back sudoku');
  await waitFor(() => rosterOf(guest, 'sudoku'), 90000, 'guest back sudoku');
  click(host.w, host.D.querySelector('#view-sudoku [data-rmode="brawl"]'));
  await sleep(2500);
  check('模式切換後仍在數獨等待室（房主）', !!rosterOf(host, 'sudoku') && !!(host.w.__PLAT_NET && host.w.__PLAT_NET.armed && host.w.__PLAT_NET.armed.mode === 'brawl'), JSON.stringify(host.w.__PLAT_NET && host.w.__PLAT_NET.armed));

  // === 五戰分頁：設定搬進等待室 → 開賽 → 第 1 局 → 強制結束 → 回等待室看五戰分頁 ===
  click(host.w, host.D.querySelector('#view-sudoku [data-rtab="tourn"]'));
  await sleep(800);
  const tRg = host.D.querySelector('#view-sudoku [data-pr-region="tourn"]');
  check('五戰分頁區顯示', !!tRg && tRg.style.display !== 'none');
  const setupEl = host.D.querySelector('#lob-tourn-setup');
  check('賽程設定已搬進等待室', !!setupEl && !!tRg && tRg.contains(setupEl));
  check('五戰分頁時遊戲名單區隱藏', rosterOf(host, 'sudoku').style.display === 'none');
  const createBtn = host.D.querySelector('#t-start');
  check('找到開始賽程鈕', !!createBtn);
  if (createBtn) click(host.w, createBtn);
  await sleep(3000);
  check('賽程建立（房主 Net.tourn）', !!(host.w.__PLAT_NET && host.w.__PLAT_NET.tourn));
  const HN = host.w.__PLAT_NET;
  if (HN.tourn) { HN.tourn.roundSecs = 300; }
  await waitFor(() => rosterOf(host, 'sudoku') && rosterOf(host, 'sudoku').style.display !== 'none', 90000, 'round1 waiting room');
  check('第 1 局等待室出現（名單區恢復）', true);
  // 雙邊準備 → 等開始鈕亮 → 開局
  const readyH = host.D.querySelector('#view-sudoku [data-pr="ready"]');
  const readyG = guest.D.querySelector('#view-sudoku [data-pr="ready"]');
  if (readyH) click(host.w, readyH);
  if (readyG) click(guest.w, readyG);
  const startBtn = await waitFor(() => { const b = host.D.querySelector('#view-sudoku [data-pr="start"]'); return (b && !b.disabled) ? b : null; }, 90000, 'start enabled');
  check('全員準備後開始鈕亮起', !!startBtn);
  let started = null;
  for (let i = 0; i < 30 && !started; i++) {
    const b2 = host.D.querySelector('#view-sudoku [data-pr="start"]');
    if (b2 && !b2.disabled) click(host.w, b2);
    started = await waitFor(() => !rosterOf(host, 'sudoku') && !rosterOf(guest, 'sudoku'), 4000, 'round started tick');
  }
  check('第 1 局開打（等待室消失）', !!started);
  await sleep(1500);
  // 房主強制結束本局 → 結算 → 回等待室（五戰分頁）
  const fe = host.D.querySelector('#t-forceend');
  check('有結束本局鈕', !!fe);
  if (fe) click(host.w, fe);
  const pod = await waitFor(() => { const p = host.D.querySelector('#plat-podium'); return (p && p.style.display !== 'none') ? p : null; }, 60000, 'podium host');
  check('結算後頒獎台出現（房主）', !!pod);
  const backRos = await waitFor(() => rosterOf(host, 'sudoku'), 90000, 'back to waiting room');
  check('結算後回到等待室（不是多人選單頁）', !!backRos && host.D.body.getAttribute('data-view') === 'sudoku', host.D.body.getAttribute('data-view'));
  const tRg2 = host.D.querySelector('#view-sudoku [data-pr-region="tourn"]');
  check('回等待室自動停在五戰分頁', !!tRg2 && tRg2.style.display !== 'none');
  check('五戰分頁有第 1 局結果', !!tRg2 && (tRg2.textContent || '').includes('第 1 局'));

  const errs = [...host.errors, ...guest.errors].filter(e => !/scrollTo/.test(e));
  check('零頁面錯誤', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\nRESULT: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FATAL', e && e.stack || e); process.exit(2); });
