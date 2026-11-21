// v1.11.0 驗收：房間框架流程（建/入房進殼房間頁不載入遊戲／分頁只切換表單不載入／各款自己的設定／準備閘門／開始才載入+自動開局／錦標賽在房間頁開賽・局間回房間頁錦標賽分頁／強制結束・頒獎台）
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
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', (m) => errors.push(stamp(String(m))));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { window.__SHARED_REG__ = REG; window.scrollTo = () => {}; if (seed) { try { for (const k in seed) window.localStorage.setItem(k, seed[k]); } catch (e) {} } } });
  const w = dom.window;
  w.addEventListener('error', (e) => { if (e.message && !/Script error/.test(e.message)) errors.push(stamp(e.message, e.error && e.error.stack)); });
  return { w, D: w.document, errors };
}
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
const HTML = '/home/hatch/workspace/platform/platform-v1-test.html';
const bundle = fs.readFileSync(HTML, 'utf8');
const hubRoster = (pg) => pg.D.querySelector('#view-lobby [data-pr-region="roster"]');
const hubShown = (pg) => { const rm = pg.D.querySelector('#lob-step-room'); return !!rm && rm.style.display === 'block'; };
(async () => {
  check('版本 1.13+（bundle）', /PLAT_VERSION = '1\.1[3-9]\.\d+'/.test(bundle));
  check('藍色回大廳鈕改回主頁（bundle 靜態）', (bundle.match(/PLAT_show\('home'\)/g) || []).length >= 2);

  // === 房主建房 → 殼房間頁（不載入遊戲） ===
  const host = loadPage(HTML);
  await waitFor(() => typeof host.w.PLAT_show === 'function' && host.w.PlatDock, 600000, 'host shell');
  host.w.PLAT_show('lobby');
  click(host.w, host.D.querySelector('#lob-go-create'));
  await waitFor(() => host.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'host nick');
  setInput(host.w, host.D.querySelector('#lob-name'), '阿主');
  click(host.w, host.D.querySelector('#lob-confirm'));
  await waitFor(() => hubShown(host), 90000, 'host hub room');
  check('建房後進殼房間頁（不是遊戲等待室）', hubShown(host) && host.w.__PLAT_NET.inMatch === null, String(host.w.__PLAT_NET.inMatch));
  check('房間頁停在大廳畫面', host.D.body.getAttribute('data-view') === 'lobby', host.D.body.getAttribute('data-view'));
  const code = host.w.__PLAT_NET.code;
  check('房號取得', code.length === 4, code);
  const hTabs = host.D.querySelector('#lob-step-room [data-pr-region="tabs"]');
  check('房間頁有分頁列（四個分頁：數獨/數橋/地雷/錦標賽）', !!hTabs && hTabs.querySelectorAll('[data-rtab]').length === 4);
  check('進房後 body 掛 plat-room-on（多人深藍底色）', host.D.body.classList.contains('plat-room-on'));
  check('錦標賽分頁名稱', !!hTabs && (hTabs.textContent || '').includes('錦標賽'));
  await waitFor(() => (hubRoster(host).textContent || '').includes('阿主'), 30000, 'host roster self');
  check('房主在房間頁名單中', true);

  // === 來賓入房 → 同一個房間頁 ===
  const guest = loadPage(HTML);
  await waitFor(() => typeof guest.w.PLAT_show === 'function' && guest.w.PlatDock, 600000, 'guest shell');
  guest.w.PLAT_show('lobby');
  click(guest.w, guest.D.querySelector('#lob-go-join'));
  await waitFor(() => guest.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'guest nick');
  setInput(guest.w, guest.D.querySelector('#lob-name'), '阿客');
  setInput(guest.w, guest.D.querySelector('#lob-code'), code);
  click(guest.w, guest.D.querySelector('#lob-confirm'));
  await waitFor(() => hubShown(guest), 120000, 'guest hub room');
  check('來賓入房進殼房間頁', hubShown(guest) && guest.w.__PLAT_NET.inMatch === null);
  await waitFor(() => (hubRoster(host).textContent || '').includes('阿客'), 60000, 'host sees guest');
  check('房主名單有來賓', true);
  await waitFor(() => (hubRoster(guest).textContent || '').includes('阿主'), 60000, 'guest sees host');
  check('來賓名單有房主', true);
  const gTabs = guest.D.querySelector('#lob-step-room [data-pr-region="tabs"]');
  check('來賓房間頁也看得到分頁列', !!gTabs && gTabs.querySelectorAll('[data-rtab]').length === 4);

  // === 分頁只是切換：按數橋不載入任何遊戲、人還在房間頁 ===
  click(host.w, host.D.querySelector('#lob-step-room [data-rtab="hashi"]'));
  await sleep(1500);
  check('按數橋後還在房間頁（沒載入遊戲）', hubShown(host) && host.w.__PLAT_NET.inMatch === null && host.D.body.getAttribute('data-view') === 'lobby');
  check('選定遊戲=數橋（房主）', !!(host.w.__PLAT_NET && host.w.__PLAT_NET.armed.game === 'hashi'));
  await waitFor(() => guest.w.__PLAT_NET && guest.w.__PLAT_NET.armed.game === 'hashi', 30000, 'guest arm sync');
  check('選定遊戲同步給來賓', true);
  const hForm = host.D.querySelector('#lob-step-room [data-pr-slot="settings"]');
  check('數橋分頁是數橋自己的設定（關卡）', !!hForm && (hForm.textContent || '').includes('關卡'));
  check('數橋設定沒有去第幾名', !!hForm && !(hForm.textContent || '').includes('名結束'));

  // === 切回數獨 + 大亂鬥 + 雙邊準備 → 開始 → 載入且自動開局 ===
  click(host.w, host.D.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await waitFor(() => guest.w.__PLAT_NET.armed.game === 'sudoku', 30000, 'guest arm back');
  click(host.w, host.D.querySelector('#lob-step-room [data-hub-mode="brawl"]'));
  await sleep(600);
  const startB = () => host.D.querySelector('#lob-step-room [data-pr="start"]');
  check('未準備前開始鈕鎖住', !!startB() && startB().disabled === true);
  click(host.w, host.D.querySelector('#lob-step-room [data-pr="ready"]'));
  click(guest.w, guest.D.querySelector('#lob-step-room [data-pr="ready"]'));
  const startBtn = await waitFor(() => { const b = startB(); return (b && !b.disabled) ? b : null; }, 90000, 'start enabled');
  check('全員準備後開始鈕亮起', !!startBtn);
  if (startBtn) click(host.w, startBtn);
  const inM = await waitFor(() => host.w.__PLAT_NET.inMatch === 'sudoku' && guest.w.__PLAT_NET.inMatch === 'sudoku' ? true : null, 90000, 'both in sudoku');
  check('按開始才載入數獨（雙邊）', !!inM);
  const cd = await waitFor(() => (host.w.PlatCountdown && host.w.PlatCountdown._visible()) || (guest.w.PlatCountdown && guest.w.PlatCountdown._visible()) ? true : null, 120000, 'auto-start countdown');
  check('房主自動開局（倒數出現）', !!cd);

  // === 結束回房間頁 → 錦標賽分頁開賽 ===
  host.w.__PLAT_NOTIFY('game-exit');
  const backHub = await waitFor(() => hubShown(host) && hubShown(guest) && !host.w.__PLAT_NET.inMatch ? true : null, 90000, 'back to hub');
  check('對局結束回房間頁', !!backHub);
  click(host.w, host.D.querySelector('#lob-step-room [data-rtab="tourn"]'));
  await sleep(800);
  const tRg = host.D.querySelector('#lob-step-room [data-pr-region="tourn"]');
  check('錦標賽分頁區顯示（在房間頁內）', !!tRg && tRg.style.display !== 'none');
  const setupEl = host.D.querySelector('#lob-tourn-setup');
  check('賽程設定在房間頁錦標賽分頁裡', !!setupEl && !!tRg && tRg.contains(setupEl));
  check('有局數選擇', !!host.D.querySelector('#t-rounds'));
  check('錦標賽卡有兩款大亂鬥設定（ts/th）', !!host.D.querySelector('#ts-size') && !!host.D.querySelector('#th-size'));
  check('錦標賽沒有去第幾名欄位', !setupEl.querySelector('[data-hub-key="winnersCount"]') && !(setupEl.textContent || '').includes('名結束'));
  const setSel = (w, el, v) => { const setter = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value').set; setter.call(el, v); el.dispatchEvent(new w.Event('change', { bubbles: true })); };
  setSel(host.w, host.D.querySelector('#t-rounds'), '3');
  const createBtn = host.D.querySelector('#t-start');
  check('找到開始賽程鈕', !!createBtn);
  if (createBtn) click(host.w, createBtn);
  await sleep(3000);
  check('賽程建立（房主 Net.tourn）', !!(host.w.__PLAT_NET && host.w.__PLAT_NET.tourn));
  check('局數=3 已套用', !!(host.w.__PLAT_NET && host.w.__PLAT_NET.tourn && host.w.__PLAT_NET.tourn.totalRounds === 3 && host.w.__PLAT_NET.tourn.rounds.length === 3), JSON.stringify(host.w.__PLAT_NET && host.w.__PLAT_NET.tourn && host.w.__PLAT_NET.tourn.totalRounds));
  const tIn = await waitFor(() => host.w.__PLAT_NET.inMatch === 'sudoku' && guest.w.__PLAT_NET.inMatch === 'sudoku' ? true : null, 120000, 'tourn round1 in sudoku');
  check('開賽後雙邊進第 1 局（數獨先）', !!tIn);
  const gEnt2 = (host.w.__PLAT_NET.tourn.entrants || []).find(e => e.name === '阿客');
  await waitFor(() => gEnt2 && host.w.__PLAT_NET.tourn.acks && host.w.__PLAT_NET.tourn.acks[gEnt2.uid] && host.w.__PLAT_NET.tourn.acks[gEnt2.uid].entered === 1, 90000, 'guest entered ack');
  check('房主收到來賓進場 ack', true);
  // v1.11.1：錦標賽每局要全員在等待卡確認準備，房主才能開始（不再自動開局）
  check('浮動結束本局鈕已移除', !host.D.querySelector('#plat-forceend'));
  const btnByText = (D, view, text) => { const root = D.querySelector('#view-' + view) || D; return [...root.querySelectorAll('button')].find(b => (b.textContent || '').includes(text)) || null; };
  const gReady = await waitFor(() => btnByText(guest.D, 'sudoku', '準備好了'), 30000, 'guest tourn ready btn');
  check('來賓等待卡有準備鈕', !!gReady);
  if (gReady) click(guest.w, gReady);
  const hReady = await waitFor(() => btnByText(host.D, 'sudoku', '準備好了'), 30000, 'host tourn ready btn');
  if (hReady) click(host.w, hReady);
  const tStartBtn = await waitFor(() => { const b = btnByText(host.D, 'sudoku', '開始本局'); return (b && !b.disabled) ? b : null; }, 60000, 'host tourn start enabled');
  check('全員準備後房主開始鈕解鎖', !!tStartBtn);
  if (tStartBtn) click(host.w, tStartBtn);
  const cd2 = await waitFor(() => (host.w.PlatCountdown && host.w.PlatCountdown._visible()) || (guest.w.PlatCountdown && guest.w.PlatCountdown._visible()) ? true : null, 120000, 'round1 host start');
  check('錦標賽第 1 局房主開始（倒數出現）', !!cd2);
  await sleep(1500);
  // v1.11.1：結束本局改藏在標頭「退出」選單裡（防誤觸）→ 結算 → 回房間頁（錦標賽分頁）
  const exitBtn = host.D.querySelector('#view-sudoku button[title="回首頁/斷線"]');
  check('房主標頭有退出鈕', !!exitBtn);
  if (exitBtn) click(host.w, exitBtn);
  const fe = await waitFor(() => btnByText(host.D, 'sudoku', '結束本局'), 30000, 'exit menu forceend');
  check('退出選單裡有結束本局', !!fe);
  if (fe) click(host.w, fe);
  const pod = await waitFor(() => { const p = host.D.querySelector('#plat-podium'); return (p && p.style.display !== 'none') ? p : null; }, 60000, 'podium host');
  check('結算後頒獎台出現（房主）', !!pod);
  const backHub2 = await waitFor(() => hubShown(host), 90000, 'back to hub after round');
  check('結算後回到房間頁', !!backHub2 && host.D.body.getAttribute('data-view') === 'lobby', host.D.body.getAttribute('data-view'));
  check('回房間頁自動停在錦標賽分頁', host.w.__PLAT_NET.roomTab === 'tourn', String(host.w.__PLAT_NET.roomTab));
  const tRg2 = host.D.querySelector('#lob-step-room [data-pr-region="tourn"]');
  check('錦標賽分頁有第 1 局結果', !!tRg2 && (tRg2.textContent || '').includes('第 1 局'));

  const errs = [...host.errors, ...guest.errors].filter(e => !/scrollTo/.test(e));
  check('零頁面錯誤', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\nRESULT: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FATAL', e && e.stack || e); process.exit(2); });
