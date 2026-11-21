// 框架層 F2 驗收：踩地雷六介面由殼元件渲染（PlatHome/PlatTopCard/PlatLeaveMenu/PlatTutorial/PlatSetup 含自訂欄位）
// ＋關鍵 computed style 與數獨一致＋狀態矩陣抽查（每日已完成/單機規則預設展開/多人規則收合/模式切換走槽位）
// 斷言只對 #view-mines 子樹與殼 overlay 子樹，不碰 body.textContent（AGENTS.md 鐵則）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(250); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } resume() { return Promise.resolve(); } }; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const cs = (p, el, prop) => el ? p.window.getComputedStyle(el)[prop] : '(none)';
(async () => {
  // ===== A 頁：地雷主畫面（PlatHome）＋每日已完成狀態 =====
  const A = loadPage('A');
  await waitFor(() => typeof A.window.PLAT_show === 'function' && A.window.PlatDock, 300000, 'A shell');
  const todayA = new A.window.Date(); const padA = n => String(n).padStart(2, '0');
  const tstrA = todayA.getFullYear() + '-' + padA(todayA.getMonth() + 1) + '-' + padA(todayA.getDate());
  A.window.PlatSave.write('mines_daily_records', { [tstrA]: 125 });
  A.window.PlatSave.write('mines_daily_streak', { last: tstrA, count: 3 });
  A.window.PLAT_show('mines');
  const homeRoot = await waitFor(() => A.document.querySelector('#mines-root [data-phome="1"]'), 120000, 'mines PlatHome mount');
  check('主畫面：PlatHome 掛載標記 [data-phome]', !!homeRoot);
  const aCard = A.document.querySelector('#mines-root [data-phome-card]');
  check('主畫面：紙卡由殼渲染 [data-phome-card]', !!aCard);
  check('主畫面：字磚標題三磚（踩地雷）', !!aCard && aCard.querySelectorAll('h1 span').length === 3);
  const dailyBtn = aCard && aCard.querySelector('[data-ph="daily"]');
  check('主畫面：每日已完成狀態（✓＋最佳 2:05＋連續 3 天）', !!dailyBtn && dailyBtn.textContent.includes('✓') && (aCard.textContent || '').includes('最佳 2:05') && (aCard.textContent || '').includes('連續 3 天'), aCard ? (aCard.textContent || '').slice(0, 120) : ''); // 地雷 fmtTime 為 m:ss 形（2:05），與美術燈 02:05 是各款既有格式、非框架差異
  // 頁面底紙（F2 收編殼）：.plat-view 點陣圖樣＋per-view 色調變數（地雷 #f7ddba，與原 body 規則同色）
  const viewA = A.document.querySelector('#view-mines');
  check('底紙：主畫面 view 點陣（radial-gradient＋12px＋--plat-dot #f7ddba）', !!viewA && cs(A, viewA, 'backgroundImage').includes('radial-gradient') && cs(A, viewA, 'backgroundSize').includes('12px') && A.window.getComputedStyle(viewA).getPropertyValue('--plat-dot').trim() === '#f7ddba', viewA && (cs(A, viewA, 'backgroundImage') + '|' + A.window.getComputedStyle(viewA).getPropertyValue('--plat-dot')));
  // ===== M 頁：數獨主畫面紙卡（computed 對照基準） =====
  const M = loadPage('M');
  await waitFor(() => typeof M.window.PLAT_show === 'function' && M.window.PlatDock, 300000, 'M shell');
  M.window.PLAT_show('sudoku');
  const mCard = await waitFor(() => { const c = [...M.document.querySelectorAll('#sudoku-root div')].find(el => (el.className || '').includes('bg-[#fffaf0]') && (el.className || '').includes('-rotate-1')); return c || null; }, 120000, 'sudoku home card');
  check('對照：數獨主畫面紙卡存在', !!mCard);
  if (aCard && mCard) {
    const props = ['backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderRadius', 'boxShadow'];
    const same = props.filter(pr => cs(A, aCard, pr) === cs(M, mCard, pr));
    check('主畫面 computed style 與數獨一致（' + same.length + '/5）', same.length === 5, props.map(pr => pr + ': mines=' + cs(A, aCard, pr) + ' sudoku=' + cs(M, mCard, pr)).join(' | '));
    check('主畫面 class tokens 同款', ['bg-[#fffaf0]', 'border-4', 'rounded-xl', 'shadow-[10px_10px_0px_rgba(30,41,59,1)]'].every(t => (aCard.className || '').includes(t) && (mCard.className || '').includes(t)));
  }
  // ===== S 頁：數獨對局（外框 computed 對照基準，v1.71.0；獨立頁，M 頁保持主畫面） =====
  const S = loadPage('S');
  await waitFor(() => typeof S.window.PLAT_show === 'function' && S.window.PlatDock, 300000, 'S shell');
  S.window.PLAT_show('sudoku');
  await waitFor(() => S.document.querySelector('#sudoku-root h1'), 120000, 'sudoku home S');
  clickEl(S, [...S.document.querySelectorAll('#sudoku-root button')].find(b => (b.textContent || '').includes('單機挑戰')));
  const sStart = await waitFor(() => [...S.document.querySelectorAll('#sudoku-root button')].find(b => (b.textContent || '').includes('開始挑戰')) || null, 30000, 'sudoku start btn');
  clickEl(S, sStart);
  const sFrame = await waitFor(() => { const f = [...S.document.querySelectorAll('#sudoku-root div')].find(el => (el.className || '').includes('max-w-[1200px]') && (el.className || '').includes('border-4')); return f || null; }, 90000, 'sudoku frame');
  check('對照：數獨對局外框存在', !!sFrame);
  // ===== 單機設定（PlatSetup＋自訂欄位） =====
  clickEl(A, A.document.querySelector('#mines-root [data-ph="solo"]'));
  const setupCard = await waitFor(() => A.document.querySelector('#plat-setup [data-pse-card]'), 30000, 'PlatSetup');
  check('單機設定：PlatSetup 殼 overlay 渲染', !!setupCard);
  check('單機設定：兩尺寸選項＋自訂區塊', !!setupCard && setupCard.querySelectorAll('[data-pse-opt]').length === 2 && !!setupCard.querySelector('[data-pse-cust]'));
  clickEl(A, setupCard && setupCard.querySelector('[data-pse="cust-toggle"]'));
  await sleep(300);
  const fields = A.document.querySelectorAll('#plat-setup [data-pse-field]');
  check('單機設定：自訂欄位 3 個（寬/高/雷）', fields.length === 3, 'n=' + fields.length);
  clickEl(A, A.document.querySelector('#plat-setup [data-pse="cancel"]'));
  await sleep(300);
  check('單機設定：取消後關閉', !A.window.PlatSetup.isShown());
  // ===== 對局頂欄（PlatTopCard）＋槽位模式列＋規則預設展開（單機） =====
  clickEl(A, A.document.querySelector('#mines-root [data-ph="solo"]'));
  await waitFor(() => A.document.querySelector('#plat-setup [data-pse-card]'), 15000, 'setup2');
  clickEl(A, A.document.querySelector('#plat-setup [data-pse-opt="9"]'));
  const band = await waitFor(() => A.document.querySelector('#mines-root [data-ptc-band]'), 60000, 'mines top band');
  check('頂欄單機：PlatTopCard band 渲染', !!band);
  check('底紙：對局畫面 view 點陣仍在', !!viewA && cs(A, viewA, 'backgroundImage').includes('radial-gradient'));
  // ===== 對局外框（PlatFrame，v1.71.0）＋底部列在框內 =====
  const frame = A.document.querySelector('#mines-root [data-pframe]');
  check('外框：PlatFrame 對局外框渲染', !!frame);
  check('外框：頂欄 band 在外框頂區內（同框）', !!frame && !!band && band.closest('[data-pframe]') === frame);
  check('外框：盤面在外框內容區內（同框同寬）', !!frame && !!frame.querySelector('[data-pframe-body] [data-cell]'));
  check('外框：PlatBar 在外框內底部（框內 in-flow 列、地雷既有形狀）', !!frame && !!frame.querySelector('[data-pframe-body] [data-pb]'));
  if (frame && sFrame) {
    const fprops = ['borderTopWidth', 'borderTopColor', 'borderRadius', 'boxShadow', 'maxWidth'];
    const fsame = fprops.filter(pr => cs(A, frame, pr) === cs(S, sFrame, pr));
    check('外框 computed style 與數獨一致（' + fsame.length + '/5）', fsame.length === 5, fprops.map(pr => pr + ': mines=' + cs(A, frame, pr) + ' sudoku=' + cs(S, sFrame, pr)).join(' | '));
  }
  check('頂欄：band 底色＝主題色 #f97316', !!band && cs(A, band, 'backgroundColor') === 'rgb(249, 115, 22)', band && cs(A, band, 'backgroundColor'));
  const timerChip = band && [...band.querySelectorAll('div')].filter(el => (el.textContent || '').trim().startsWith('⏱')).sort((x, y) => x.textContent.length - y.textContent.length)[0];
  check('頂欄：計時晶片深底（#1e293b）', !!timerChip && /30[ ,]41[ ,]59/.test(cs(A, timerChip, 'backgroundColor')), timerChip && cs(A, timerChip, 'backgroundColor'));
  const slot = band && band.querySelector('[data-ptc-slot]');
  check('頂欄槽：模式切換（挖開/插旗）＋進度字（3BV）在槽內', !!slot && !!slot.querySelector('[data-mode="dig"]') && !!slot.querySelector('[data-mode="flag"]') && (slot.textContent || '').includes('進度（3BV）'));
  check('頂欄槽：💣 剩雷數＋愛心在槽內', !!slot && (slot.textContent || '').includes('💣') && (slot.textContent || '').includes('❤️'));
  check('頂欄單機：規則預設展開（newGame setRulesOpen(true)）', !!band && band.querySelector('[data-ptc-region="ruleswrap"]').classList.contains('open'));
  clickEl(A, band.querySelector('[data-ptc="rules"]'));
  await sleep(200);
  check('頂欄：點縮小面板→Collapse 合', !A.document.querySelector('#mines-root [data-ptc-region="ruleswrap"]').classList.contains('open'));
  // 模式切換真的生效（走槽位 portal 的按鈕）
  const dbgA = () => A.window.__PLAT_HOOKS_mines.debug();
  clickEl(A, slot.querySelector('[data-mode="flag"]'));
  await sleep(300);
  check('槽位模式鈕：點插旗 → inputMode=flag', dbgA().inputMode === 'flag', dbgA().inputMode);
  clickEl(A, slot.querySelector('[data-mode="dig"]'));
  await sleep(200);
  // 規格籤點開＝對局內 PlatSetup（設定盤面）
  clickEl(A, band.querySelector('[data-ptc="spec"]'));
  const setup2 = await waitFor(() => A.document.querySelector('#plat-setup [data-pse-card]'), 15000, 'in-game setup');
  check('對局設定：規格籤點開 PlatSetup（設定盤面）', !!setup2 && (setup2.textContent || '').includes('設定盤面'));
  clickEl(A, A.document.querySelector('#plat-setup [data-pse="cancel"]'));
  await sleep(300);
  // ===== 離開選單（單機文案） =====
  clickEl(A, A.document.querySelector('#mines-root [data-ptc="leave"]'));
  const lm = await waitFor(() => A.document.querySelector('#plat-leave-menu [data-plm-card]'), 15000, 'PlatLeaveMenu solo');
  check('離開選單：PlatLeaveMenu 渲染（單機只有回主選單）', !!lm && (lm.textContent || '').includes('回主選單') && !(lm.textContent || '').includes('回等待室') && !(lm.textContent || '').includes('結束本局'));
  clickEl(A, lm && [...lm.querySelectorAll('button')].find(b => (b.textContent || '').includes('取消')));
  await sleep(300);
  check('離開選單：取消後仍在對局', !A.window.PlatLeaveMenu.isShown() && !!A.document.querySelector('#mines-root [data-ptc-band]'));
  // ===== 教學（PlatTutorial＋mount 互動 demo） =====
  clickEl(A, A.document.querySelector('#mines-root [data-ptc="leave"]'));
  await waitFor(() => A.document.querySelector('#plat-leave-menu [data-plm-card]'), 15000, 'lm2');
  clickEl(A, [...A.document.querySelectorAll('#plat-leave-menu button')].find(b => (b.textContent || '').includes('回主選單')));
  await waitFor(() => A.document.querySelector('#mines-root [data-phome-card]'), 30000, 'back home');
  clickEl(A, A.document.querySelector('#mines-root [data-ph="tutorial"]'));
  const tutCard = await waitFor(() => A.document.querySelector('#plat-tutorial [data-ptu-card]'), 15000, 'PlatTutorial');
  check('教學：PlatTutorial 殼 overlay 渲染', !!tutCard);
  check('教學：mount 步互動 demo 9 格', !!tutCard && tutCard.querySelectorAll('[data-mtut-cell]').length === 9);
  clickEl(A, tutCard && tutCard.querySelector('[data-mtut-cell="0"]'));
  await sleep(250);
  check('教學：demo 點格洪水展開（≥3 格打開）', !!tutCard && tutCard.querySelectorAll('[data-mtut-grid] > div').length >= 3);
  clickEl(A, tutCard && [...tutCard.querySelectorAll('button')].find(b => (b.textContent || '').includes('下一步')));
  await sleep(250);
  const tutCard2 = A.document.querySelector('#plat-tutorial [data-ptu-card]');
  check('教學：第 2 步插旗動畫（mtut-flag）', !!tutCard2 && !!tutCard2.querySelector('.mtut-flag'));
  check('教學：卡底色 computed 與數獨教學卡同色系（#fffaf0）', !!tutCard && /255[ ,]250[ ,]240/.test(cs(A, tutCard, 'backgroundColor')), tutCard && cs(A, tutCard, 'backgroundColor'));
  clickEl(A, tutCard2 && [...tutCard2.querySelectorAll('button')].find(b => (b.textContent || '').includes('跳過')));
  await sleep(300);
  check('教學：跳過後關閉', !A.window.PlatTutorial.isShown());
  check('A 頁零錯誤', A.errors.length === 0, A.errors[0] || '');
  check('M 頁零錯誤', M.errors.length === 0, M.errors[0] || '');
  check('S 頁零錯誤', S.errors.length === 0, S.errors[0] || '');

  // ===== 多人頂欄（PlatTopCard MP）：規則預設收合＋離開選單 MP 文案 =====
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
  for (const p of [H, G]) { p.window.PLAT_show('mines'); await waitFor(() => !!p.window.__PLAT_HOOKS_mines, 300000, 'preboot mines'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="mines"]'));
  await sleep(600);
  await waitFor(() => (H.document.querySelector('#lob-step-room [data-pr="ready"]') && G.document.querySelector('#lob-step-room [data-pr="ready"]')) ? true : null, 30000, 'both ready btns');
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const startBtn = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return b && !b.disabled ? b : null; }, 60000, 'hub start');
  clickEl(H, startBtn);
  const dbgH = () => H.window.__PLAT_HOOKS_mines.debug();
  const playing = await waitFor(() => dbgH().mp.phase === 'playing' ? 1 : null, 90000, 'mp playing');
  check('多人：開局 playing', !!playing);
  const bandH = H.document.querySelector('#mines-root [data-ptc-band]');
  check('頂欄多人：PlatTopCard band 渲染', !!bandH);
  const viewH = H.document.querySelector('#view-mines');
  check('底紙：多人畫面 view 點陣仍在', !!viewH && cs(H, viewH, 'backgroundImage').includes('radial-gradient'));
  check('頂欄多人：模式晶片與模式一致（' + (dbgH().mp.mode || '?') + '）', !!bandH && (bandH.textContent || '').includes(dbgH().mp.mode === 'race' ? '競速對戰' : '合作模式'), bandH && (bandH.textContent || '').slice(0, 80));
  check('頂欄多人：規則預設收合（enter setRulesOpen(false)）', !!bandH && !bandH.querySelector('[data-ptc-region="ruleswrap"]').classList.contains('open'));
  check('頂欄多人：規格籤不可點（無 data-ptc=spec 按鈕）', !!bandH && !bandH.querySelector('[data-ptc="spec"]'));
  clickEl(H, bandH.querySelector('[data-ptc="leave"]'));
  const lmMp = await waitFor(() => H.document.querySelector('#plat-leave-menu [data-plm-card]'), 15000, 'lm mp');
  check('離開選單 MP：回等待室＋退出（回大廳）、無結束本局', !!lmMp && (lmMp.textContent || '').includes('回等待室') && (lmMp.textContent || '').includes('退出（回大廳）') && !(lmMp.textContent || '').includes('結束本局'), lmMp && (lmMp.textContent || '').slice(0, 80));
  clickEl(H, lmMp && [...lmMp.querySelectorAll('button')].find(b => (b.textContent || '').includes('取消')));
  await sleep(300);
  check('H/G 零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  console.log('==== MINES-FRAMEWORK: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
