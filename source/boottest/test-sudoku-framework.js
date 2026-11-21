// 框架層 F3 驗收：數獨六介面由殼元件渲染（PlatHome/PlatSetup groups seg/PlatTutorial mount demo/PlatTopCard+PlatFrame/PlatLeaveMenu）
// ＋底紙收歸殼（--plat-dot #d3c5ab）＋狀態矩陣抽查（單機規則預設展開/多人收合、房主規格籤可點/來賓不可點、seg 滑動片）
// 斷言只對 #view-sudoku 子樹與殼 overlay 子樹，不碰 body.textContent（AGENTS.md 鐵則）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(250); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errs.push(stamp(String(m))));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } resume() { return Promise.resolve(); } }; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const cs = (p, el, prop) => el ? p.window.getComputedStyle(el)[prop] : '(none)';
(async () => {
  // ===== A 頁：數獨主畫面（PlatHome）＋每日已完成狀態 =====
  const A = loadPage('A');
  await waitFor(() => typeof A.window.PLAT_show === 'function' && A.window.PlatDock, 300000, 'A shell');
  const todayA = new A.window.Date(); const padA = n => String(n).padStart(2, '0');
  const tstrA = todayA.getFullYear() + '-' + padA(todayA.getMonth() + 1) + '-' + padA(todayA.getDate());
  A.window.PlatSave.write('sudoku_daily_records', { [tstrA]: 125 });
  A.window.PlatSave.write('sudoku_daily_streak', { count: 3, lastDate: tstrA });
  A.window.PLAT_show('sudoku');
  const homeRoot = await waitFor(() => A.document.querySelector('#sudoku-root [data-phome="1"]'), 120000, 'sudoku PlatHome mount');
  check('主畫面：PlatHome 掛載標記 [data-phome]', !!homeRoot);
  const aCard = A.document.querySelector('#sudoku-root [data-phome-card]');
  check('主畫面：紙卡由殼渲染 [data-phome-card]', !!aCard);
  check('主畫面：字磚標題兩磚（數獨）', !!aCard && aCard.querySelectorAll('h1 span').length === 2);
  const dailyBtn = aCard && aCard.querySelector('[data-ph="daily"]');
  check('主畫面：每日已完成狀態（✓＋最佳＋連續 3 天）', !!dailyBtn && dailyBtn.textContent.includes('✓') && (aCard.textContent || '').includes('最佳') && (aCard.textContent || '').includes('連續 3 天'), aCard ? (aCard.textContent || '').slice(0, 120) : '');
  const viewA = A.document.querySelector('#view-sudoku');
  check('底紙：view 點陣（radial-gradient＋12px＋--plat-dot #d3c5ab）', !!viewA && cs(A, viewA, 'backgroundImage').includes('radial-gradient') && cs(A, viewA, 'backgroundSize').includes('12px') && A.window.getComputedStyle(viewA).getPropertyValue('--plat-dot').trim() === '#d3c5ab', viewA && (cs(A, viewA, 'backgroundImage') + '|' + A.window.getComputedStyle(viewA).getPropertyValue('--plat-dot')));
  // ===== 單機設定（PlatSetup groups：版型/難度 seg＋滑動片） =====
  clickEl(A, A.document.querySelector('#sudoku-root [data-ph="solo"]'));
  const setupCard = await waitFor(() => A.document.querySelector('#plat-setup [data-pse-card]'), 30000, 'PlatSetup');
  check('單機設定：PlatSetup 殼 overlay 渲染', !!setupCard);
  const gSize = setupCard && setupCard.querySelector('[data-pse-group="size"]');
  const gDiff = setupCard && setupCard.querySelector('[data-pse-group="diff"]');
  check('單機設定：版型/難度兩組 seg（data-seg 容器）', !!gSize && !!gDiff && gSize.getAttribute('data-seg') === 'pse-size' && gDiff.getAttribute('data-seg') === 'pse-diff');
  check('單機設定：兩組各 ≥2 選項', !!gSize && gSize.querySelectorAll('[data-pse-gopt]').length >= 2 && !!gDiff && gDiff.querySelectorAll('[data-pse-gopt]').length >= 2, gSize ? ('size=' + gSize.querySelectorAll('[data-pse-gopt]').length + ' diff=' + (gDiff ? gDiff.querySelectorAll('[data-pse-gopt]').length : -1)) : '');
  check('單機設定：預設各一選取（data-seg-on）', !!gSize && gSize.querySelectorAll('[data-seg-on="1"]').length === 1 && !!gDiff && gDiff.querySelectorAll('[data-seg-on="1"]').length === 1);
  const pill = await waitFor(() => gDiff && gDiff.querySelector('.plat-seg-pill'), 10000, 'seg pill');
  check('單機設定：PlatSeg 滑動片存在（.plat-seg-pill）', !!pill);
  const diffOpts = gDiff ? [...gDiff.querySelectorAll('[data-pse-gopt]')] : [];
  const other = diffOpts.find(b => !b.hasAttribute('data-seg-on'));
  const otherGid = other ? other.getAttribute('data-pse-gid') : null;
  clickEl(A, other);
  await sleep(300);
  const gDiff2 = A.document.querySelector('#plat-setup [data-pse-group="diff"]'); // PlatSetup 點擊後整卡重繪，須重查 DOM（舊節點已脫離）
  const otherNow = gDiff2 && otherGid ? gDiff2.querySelector('[data-pse-gid="' + otherGid + '"]') : null;
  check('單機設定：點其他難度→選取移位', !!otherNow && otherNow.hasAttribute('data-seg-on') && gDiff2.querySelectorAll('[data-seg-on="1"]').length === 1);
  // ===== 開始→對局（PlatFrame＋PlatTopCard；單機規則預設展開） =====
  clickEl(A, A.document.querySelector('#plat-setup [data-pse="start"]'));
  const band = await waitFor(() => A.document.querySelector('#sudoku-root [data-ptc-band]'), 90000, 'sudoku top band');
  check('頂欄單機：PlatTopCard band 渲染', !!band);
  const frame = A.document.querySelector('#sudoku-root [data-pframe]');
  check('外框：PlatFrame 對局外框渲染', !!frame);
  check('外框：頂欄 band 在外框頂區內（同框）', !!frame && !!band && band.closest('[data-pframe]') === frame);
  check('外框：盤面在外框內容區內', !!frame && !!frame.querySelector('[data-pframe-body]'));
  check('底紙：對局畫面 view 點陣仍在', !!viewA && cs(A, viewA, 'backgroundImage').includes('radial-gradient'));
  check('頂欄：band 底色＝主題色 #ffcc00', !!band && cs(A, band, 'backgroundColor') === 'rgb(255, 204, 0)', band && cs(A, band, 'backgroundColor'));
  check('頂欄單機：規則預設展開（start setRulesOpen(true)）', !!band && band.querySelector('[data-ptc-region="ruleswrap"]').classList.contains('open'));
  clickEl(A, band.querySelector('[data-ptc="rules"]'));
  await sleep(200);
  check('頂欄：點縮小面板→Collapse 合', !A.document.querySelector('#sudoku-root [data-ptc-region="ruleswrap"]').classList.contains('open'));
  check('頂欄單機：規格籤可點（data-ptc=spec）', !!band && !!band.querySelector('[data-ptc="spec"]'));
  clickEl(A, band.querySelector('[data-ptc="spec"]'));
  const setup2 = await waitFor(() => A.document.querySelector('#plat-setup [data-pse-card]'), 15000, 'in-game setup');
  check('對局設定：規格籤點開 PlatSetup（局內版）', !!setup2);
  clickEl(A, A.document.querySelector('#plat-setup [data-pse="cancel"]'));
  await sleep(300);
  check('對局設定：取消後關閉、仍在對局', !A.window.PlatSetup.isShown() && !!A.document.querySelector('#sudoku-root [data-ptc-band]'));
  // ===== 離開選單（單機文案） =====
  clickEl(A, A.document.querySelector('#sudoku-root [data-ptc="leave"]'));
  const lm = await waitFor(() => A.document.querySelector('#plat-leave-menu [data-plm-card]'), 15000, 'PlatLeaveMenu solo');
  check('離開選單：PlatLeaveMenu 渲染（單機只有回主選單）', !!lm && (lm.textContent || '').includes('回主選單') && !(lm.textContent || '').includes('回等待室') && !(lm.textContent || '').includes('結束本局'));
  clickEl(A, lm && [...lm.querySelectorAll('button')].find(b => (b.textContent || '').includes('取消')));
  await sleep(300);
  check('離開選單：取消後仍在對局', !A.window.PlatLeaveMenu.isShown() && !!A.document.querySelector('#sudoku-root [data-ptc-band]'));
  // ===== 教學（PlatTutorial＋mount 互動 demo：答錯→答對） =====
  clickEl(A, A.document.querySelector('#sudoku-root [data-ptc="leave"]'));
  await waitFor(() => A.document.querySelector('#plat-leave-menu [data-plm-card]'), 15000, 'lm2');
  clickEl(A, [...A.document.querySelectorAll('#plat-leave-menu button')].find(b => (b.textContent || '').includes('回主選單')));
  await waitFor(() => A.document.querySelector('#sudoku-root [data-phome-card]'), 30000, 'back home');
  clickEl(A, A.document.querySelector('#sudoku-root [data-ph="tutorial"]'));
  const tutCard = await waitFor(() => A.document.querySelector('#plat-tutorial [data-ptu-card]'), 15000, 'PlatTutorial');
  check('教學：PlatTutorial 殼 overlay 渲染', !!tutCard);
  check('教學：mount 步互動 demo 9 格＋3 數字鍵', !!tutCard && tutCard.querySelectorAll('[data-stut-cell]').length === 9 && tutCard.querySelectorAll('[data-stut-num]').length === 3);
  clickEl(A, tutCard && tutCard.querySelector('[data-stut-num="7"]'));
  await sleep(250);
  const cap1 = A.document.querySelector('#plat-tutorial [data-ptu-cap]');
  check('教學：點 7→答錯字幕', !!cap1 && (cap1.textContent || '').includes('不對'), cap1 && cap1.textContent);
  clickEl(A, A.document.querySelector('#plat-tutorial [data-stut-num="8"]'));
  await sleep(250);
  const mid = A.document.querySelector('#plat-tutorial [data-stut-mid]');
  const cap2 = A.document.querySelector('#plat-tutorial [data-ptu-cap]');
  check('教學：點 8→中格變 8＋答對字幕', !!mid && mid.textContent === '8' && !!cap2 && (cap2.textContent || '').includes('答對了'), (mid && mid.textContent) + '|' + (cap2 && cap2.textContent));
  clickEl(A, tutCard && [...tutCard.querySelectorAll('button')].find(b => (b.textContent || '').includes('下一步')));
  await sleep(250);
  const tutCard2 = A.document.querySelector('#plat-tutorial [data-ptu-card]');
  check('教學：第 2 步草稿動畫（tut-draft-a）', !!tutCard2 && !!tutCard2.querySelector('.tut-draft-a'));
  clickEl(A, tutCard2 && [...tutCard2.querySelectorAll('button')].find(b => (b.textContent || '').includes('跳過')));
  await sleep(300);
  check('教學：跳過後關閉', !A.window.PlatTutorial.isShown());
  check('A 頁零錯誤', A.errors.length === 0, A.errors[0] || '');

  // ===== 多人（房主/來賓狀態矩陣）：規則收合、房主規格籤可點/來賓不可點、離開選單 MP 文案 =====
  const H = loadPage('H');
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 300000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET && H.window.__PLAT_NET.code; }, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G');
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 300000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 90000, 'G in room');
  for (const p of [H, G]) { p.window.PLAT_show('sudoku'); await waitFor(() => !!p.window.__PLAT_HOOKS_sudoku, 300000, 'preboot sudoku'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await sleep(600);
  await waitFor(() => H.document.querySelector('#lob-step-room [data-pr="ready"]'), 30000, 'H ready btn');
  await waitFor(() => G.document.querySelector('#lob-step-room [data-pr="ready"]'), 30000, 'G ready btn');
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const startBtn = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return b && !b.disabled ? b : null; }, 60000, 'hub start');
  clickEl(H, startBtn);
  const bandH = await waitFor(() => H.document.querySelector('#sudoku-root [data-ptc-band]'), 90000, 'host band');
  const bandG = await waitFor(() => G.document.querySelector('#sudoku-root [data-ptc-band]'), 90000, 'guest band');
  check('多人：房主/來賓皆進對局（band 渲染）', !!bandH && !!bandG);
  check('頂欄多人：規則預設收合（房主）', !!bandH && !bandH.querySelector('[data-ptc-region="ruleswrap"]').classList.contains('open'));
  check('頂欄多人：規則預設收合（來賓）', !!bandG && !bandG.querySelector('[data-ptc-region="ruleswrap"]').classList.contains('open'));
  check('頂欄多人：房主規格籤可點', !!bandH && !!bandH.querySelector('[data-ptc="spec"]'));
  check('頂欄多人：來賓規格籤不可點（無 data-ptc=spec 按鈕）', !!bandG && !bandG.querySelector('[data-ptc="spec"]'));
  check('頂欄多人：模式晶片（大亂鬥/合作）', !!bandH && ((bandH.textContent || '').includes('大亂鬥') || (bandH.textContent || '').includes('合作')), bandH && (bandH.textContent || '').slice(0, 80));
  check('滾字承接：數獨自有玩家列 PlatPct 滾輪仍在（.plat-count，F3 遷移未失滾字）', !!H.document.querySelector('#sudoku-root .plat-count'));
  clickEl(H, bandH.querySelector('[data-ptc="leave"]'));
  const lmMp = await waitFor(() => H.document.querySelector('#plat-leave-menu [data-plm-card]'), 15000, 'lm mp');
  check('離開選單 MP：回等待室＋退出（回大廳）', !!lmMp && (lmMp.textContent || '').includes('回等待室') && (lmMp.textContent || '').includes('退出（回大廳）'), lmMp && (lmMp.textContent || '').slice(0, 80));
  clickEl(H, lmMp && [...lmMp.querySelectorAll('button')].find(b => (b.textContent || '').includes('取消')));
  await sleep(300);
  check('H/G 零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  console.log('==== SUDOKU-FRAMEWORK: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
