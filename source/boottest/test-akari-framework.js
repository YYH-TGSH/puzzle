// 框架層 F1 驗收：美術燈六介面由殼元件渲染（PlatHome/PlatTopCard/PlatLeaveMenu/PlatTutorial/PlatSetup）
// ＋關鍵 computed style 與他款（地雷）一致＋狀態抽查（每日已完成、多人晶片/觀戰）
// 斷言只對 #view-<game> 子樹與殼 overlay 子樹，不碰 body.textContent（AGENTS.md 鐵則）
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
  // ===== A 頁：美術燈主畫面（PlatHome） =====
  const A = loadPage('A');
  await waitFor(() => typeof A.window.PLAT_show === 'function' && A.window.PlatDock, 300000, 'A shell');
  // 每日已完成狀態抽查：進遊戲前先種入今日紀錄/連勝（app 掛載時即讀入 state）
  const todayA = new A.window.Date(); const padA = n => String(n).padStart(2, '0');
  const tstrA = todayA.getFullYear() + '-' + padA(todayA.getMonth() + 1) + '-' + padA(todayA.getDate());
  A.window.PlatSave.write('akari_daily_records', { [tstrA]: 125 });
  A.window.PlatSave.write('akari_daily_streak', { last: tstrA, count: 3 });
  A.window.PLAT_show('akari');
  const homeRoot = await waitFor(() => A.document.querySelector('#akari-root [data-phome="1"]'), 120000, 'akari PlatHome mount');
  check('主畫面：PlatHome 掛載標記 [data-phome]', !!homeRoot);
  const aCard = A.document.querySelector('#akari-root [data-phome-card]');
  check('主畫面：紙卡由殼渲染 [data-phome-card]', !!aCard);
  check('主畫面：字磚標題三磚', !!aCard && aCard.querySelectorAll('h1 span').length === 3);
  check('主畫面：每日列（◀/日期/▶/連續）齊備', !!aCard && !!aCard.querySelector('[data-ph="prev"]') && !!aCard.querySelector('[data-ph="cal"]') && !!aCard.querySelector('[data-ph="next"]') && (aCard.textContent || '').includes('連續'));
  const dailyBtn = aCard && aCard.querySelector('[data-ph="daily"]');
  check('主畫面：每日已完成狀態（✓＋最佳 02:05＋連續 3 天）', !!dailyBtn && dailyBtn.textContent.includes('✓') && (aCard.textContent || '').includes('最佳 02:05') && (aCard.textContent || '').includes('連續 3 天'), aCard ? (aCard.textContent || '').slice(0, 120) : '');
  // 頁面底紙（v1.70.0 熱修＋F2 收編殼）：.plat-view 點陣圖樣＋per-view 色調變數（藍系 #b9cfee，隨改藍裁示）
  const viewA = A.document.querySelector('#view-akari');
  check('底紙：主畫面 view 點陣（radial-gradient＋12px＋--plat-dot 藍系）', !!viewA && cs(A, viewA, 'backgroundImage').includes('radial-gradient') && cs(A, viewA, 'backgroundSize').includes('12px') && A.window.getComputedStyle(viewA).getPropertyValue('--plat-dot').trim() === '#b9cfee', viewA && (cs(A, viewA, 'backgroundImage') + '|' + A.window.getComputedStyle(viewA).getPropertyValue('--plat-dot')));
  // ===== M 頁：數獨主畫面（PlatHome 的 canonical 來源；地雷卡底色 #fff7ed 是已知舊漂移、待 F2 遷移，不作基準） =====
  const M = loadPage('M');
  await waitFor(() => typeof M.window.PLAT_show === 'function' && M.window.PlatDock, 300000, 'M shell');
  M.window.PLAT_show('sudoku');
  const mCard = await waitFor(() => { const c = [...M.document.querySelectorAll('#sudoku-root div')].find(el => (el.className || '').includes('bg-[#fffaf0]') && (el.className || '').includes('-rotate-1')); return c || null; }, 120000, 'sudoku home card');
  check('對照：數獨主畫面紙卡存在', !!mCard);
  if (aCard && mCard) {
    const props = ['backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderRadius', 'boxShadow'];
    const same = props.filter(pr => cs(A, aCard, pr) === cs(M, mCard, pr));
    check('主畫面 computed style 與數獨一致（' + same.length + '/5：' + props.join('/') + '）', same.length === 5, props.map(pr => pr + ': akari=' + cs(A, aCard, pr) + ' sudoku=' + cs(M, mCard, pr)).join(' | '));
    check('主畫面 class tokens 同款（bg-[#fffaf0]/border-4/rounded-xl/10px 影）', ['bg-[#fffaf0]', 'border-4', 'rounded-xl', 'shadow-[10px_10px_0px_rgba(30,41,59,1)]'].every(t => (aCard.className || '').includes(t) && (mCard.className || '').includes(t)));
  }
  // ===== S 頁：數獨對局（外框/PlatBar computed 對照基準，v1.70.0；獨立頁，M 頁保持主畫面供教學對照） =====
  const findBarWrap = (p, rootSel) => { const pb = p.document.querySelector(rootSel + ' [data-pb]'); let n = pb; while (n && n !== p.document.body) { if (cs(p, n, 'position') === 'fixed') return n; n = n.parentElement; } return null; };
  const S = loadPage('S');
  await waitFor(() => typeof S.window.PLAT_show === 'function' && S.window.PlatDock, 300000, 'S shell');
  S.window.PLAT_show('sudoku');
  await waitFor(() => S.document.querySelector('#sudoku-root h1'), 120000, 'sudoku home S');
  clickEl(S, [...S.document.querySelectorAll('#sudoku-root button')].find(b => (b.textContent || '').includes('單機挑戰')));
  const sStart = await waitFor(() => [...S.document.querySelectorAll('#sudoku-root button')].find(b => (b.textContent || '').includes('開始挑戰')) || null, 30000, 'sudoku start btn');
  clickEl(S, sStart);
  const sFrame = await waitFor(() => { const f = [...S.document.querySelectorAll('#sudoku-root div')].find(el => (el.className || '').includes('max-w-[1200px]') && (el.className || '').includes('border-4')); return f || null; }, 90000, 'sudoku frame');
  check('對照：數獨對局外框存在', !!sFrame);
  const sBarWrap = findBarWrap(S, '#sudoku-root');
  check('對照：數獨 PlatBar fixed 容器（left/right/bottom=0）', !!sBarWrap && cs(S, sBarWrap, 'left') === '0px' && cs(S, sBarWrap, 'right') === '0px' && cs(S, sBarWrap, 'bottom') === '0px', sBarWrap && (cs(S, sBarWrap, 'left') + '/' + cs(S, sBarWrap, 'right') + '/' + cs(S, sBarWrap, 'bottom')));
  // ===== A 頁：單機設定（PlatSetup）＋頂欄單機（PlatTopCard）＋離開選單（PlatLeaveMenu） =====
  clickEl(A, A.document.querySelector('#akari-root [data-ph="solo"]'));
  const setupCard = await waitFor(() => A.document.querySelector('#plat-setup [data-pse-card]'), 30000, 'PlatSetup');
  check('單機設定：PlatSetup 殼 overlay 渲染', !!setupCard);
  check('單機設定：三尺寸選項', !!setupCard && setupCard.querySelectorAll('[data-pse-opt]').length === 3);
  clickEl(A, setupCard && setupCard.querySelector('[data-pse-opt="7"]'));
  const band = await waitFor(() => A.document.querySelector('#akari-root [data-ptc-band]'), 60000, 'akari top band');
  check('頂欄單機：PlatTopCard band 渲染', !!band);
  check('底紙：對局畫面 view 點陣仍在', !!viewA && cs(A, viewA, 'backgroundImage').includes('radial-gradient'));
  check('頂欄：band 底色＝主題色 #3b82f6（2026-11-21 改藍）', !!band && cs(A, band, 'backgroundColor') === 'rgb(59, 130, 246)', band && cs(A, band, 'backgroundColor'));
  const timerChip = band && [...band.querySelectorAll('div')].filter(el => (el.textContent || '').trim().startsWith('⏱')).sort((x, y) => x.textContent.length - y.textContent.length)[0];
  check('頂欄：計時晶片深底（#1e293b）', !!timerChip && /30[ ,]41[ ,]59/.test(cs(A, timerChip, 'backgroundColor')), timerChip && cs(A, timerChip, 'backgroundColor'));
  // ===== 對局外框（PlatFrame，v1.70.0）＋PlatBar 幾何 =====
  const frame = A.document.querySelector('#akari-root [data-pframe]');
  check('外框：PlatFrame 對局外框渲染', !!frame);
  check('外框：頂欄 band 在外框頂區內（同框）', !!frame && !!band && band.closest('[data-pframe]') === frame);
  check('外框：盤面在外框內容區內（同框同寬）', !!frame && !!frame.querySelector('[data-pframe-body] [data-cell]'));
  check('外框：band 不再是獨立浮卡（無自身陰影，邊框由外框持有）', !!band && cs(A, band, 'boxShadow') === 'none', band && cs(A, band, 'boxShadow'));
  if (frame && sFrame) {
    const fprops = ['borderTopWidth', 'borderTopColor', 'borderRadius', 'boxShadow', 'maxWidth'];
    const fsame = fprops.filter(pr => cs(A, frame, pr) === cs(S, sFrame, pr));
    check('外框 computed style 與數獨一致（' + fsame.length + '/5：' + fprops.join('/') + '）', fsame.length === 5, fprops.map(pr => pr + ': akari=' + cs(A, frame, pr) + ' sudoku=' + cs(S, sFrame, pr)).join(' | '));
  }
  const aBarWrap = findBarWrap(A, '#akari-root');
  check('PlatBar：專屬 fixed 容器（數獨同款形狀）', !!aBarWrap);
  check('PlatBar 幾何：left/right/bottom 皆 0（全寬貼底）', !!aBarWrap && cs(A, aBarWrap, 'left') === '0px' && cs(A, aBarWrap, 'right') === '0px' && cs(A, aBarWrap, 'bottom') === '0px', aBarWrap && (cs(A, aBarWrap, 'left') + '/' + cs(A, aBarWrap, 'right') + '/' + cs(A, aBarWrap, 'bottom')));
  check('PlatBar：不在外框內（寬度不受框限制）', !!aBarWrap && !!frame && !frame.contains(aBarWrap));
  const aBarDiv = aBarWrap && [...aBarWrap.querySelectorAll('div')].find(d => d.style && d.style.width === '100%');
  check('PlatBar：內容寬 100%＋justify-between（左中右分布）', !!aBarDiv && (aBarDiv.className || '').includes('justify-between'));
  const slotOk = await waitFor(() => { const b2 = A.document.querySelector('#akari-root [data-ptc-band]'); return b2 && b2.querySelector('[data-ptc-slot]') && (b2.querySelector('[data-ptc-slot]').textContent || '').includes('進度') ? 1 : null; }, 15000, 'ptc slot content');
  check('頂欄：遊戲槽有進度條（portal 內容）', !!slotOk);
  check('頂欄：規則 Collapse 預設收合', !!band && !band.querySelector('[data-ptc-region="ruleswrap"]').classList.contains('open'));
  clickEl(A, band.querySelector('[data-ptc="rules"]'));
  await sleep(200);
  check('頂欄：點展開規則→Collapse 開', A.document.querySelector('#akari-root [data-ptc-region="ruleswrap"]').classList.contains('open'));
  // 離開選單（單機文案）
  clickEl(A, A.document.querySelector('#akari-root [data-ptc="leave"]'));
  const lm = await waitFor(() => A.document.querySelector('#plat-leave-menu [data-plm-card]'), 15000, 'PlatLeaveMenu solo');
  check('離開選單：PlatLeaveMenu 渲染（單機）', !!lm);
  check('離開選單：單機只有「回主選單」（無回等待室/結束本局）', !!lm && (lm.textContent || '').includes('回主選單') && !(lm.textContent || '').includes('回等待室') && !(lm.textContent || '').includes('結束本局'), lm && (lm.textContent || '').slice(0, 80));
  clickEl(A, lm && [...lm.querySelectorAll('button')].find(b => (b.textContent || '').includes('取消')));
  await sleep(300);
  check('離開選單：取消後關閉、仍在對局', !A.window.PlatLeaveMenu.isShown() && !!A.document.querySelector('#akari-root [data-ptc-band]'));
  // ===== 教學（PlatTutorial） =====
  clickEl(A, A.document.querySelector('#akari-root [data-ptc="leave"]'));
  await waitFor(() => A.document.querySelector('#plat-leave-menu [data-plm-card]'), 15000, 'lm2');
  clickEl(A, [...A.document.querySelectorAll('#plat-leave-menu button')].find(b => (b.textContent || '').includes('回主選單')));
  await waitFor(() => A.document.querySelector('#akari-root [data-phome-card]'), 30000, 'back home');
  clickEl(A, A.document.querySelector('#akari-root [data-ph="tutorial"]'));
  const tutCard = await waitFor(() => A.document.querySelector('#plat-tutorial [data-ptu-card]'), 15000, 'PlatTutorial');
  check('教學：PlatTutorial 殼 overlay 渲染', !!tutCard);
  const stepEl = tutCard && tutCard.querySelector('[data-ptu-step="0"]');
  check('教學：步進區 h-[400px] token（與數獨同）＋頁點 3', !!stepEl && (stepEl.className || '').includes('h-[400px]') && tutCard.querySelectorAll('.rounded-full').length >= 3, stepEl && stepEl.className);
  // 教學卡底色與數獨教學卡 computed 一致（同走 TW 管線、比字串值）
  clickEl(M, [...M.document.querySelectorAll('#sudoku-root button')].find(b => (b.textContent || '').includes('玩法教學')));
  const sTutCard = await waitFor(() => [...M.document.querySelectorAll('#sudoku-root div')].find(el => (el.className || '').includes('bg-[#fffaf0]') && (el.className || '').includes('max-w-lg')) || null, 30000, 'sudoku tutorial card');
  check('教學：卡底色 computed 與數獨教學卡一致', !!tutCard && !!sTutCard && cs(A, tutCard, 'backgroundColor') === cs(M, sTutCard, 'backgroundColor'), 'akari=' + (tutCard && cs(A, tutCard, 'backgroundColor')) + ' sudoku=' + (sTutCard && cs(M, sTutCard, 'backgroundColor')));
  clickEl(A, tutCard && [...tutCard.querySelectorAll('button')].find(b => (b.textContent || '').includes('跳過')));
  await sleep(300);
  check('教學：跳過後關閉', !A.window.PlatTutorial.isShown());
  check('A 頁零錯誤', A.errors.length === 0, A.errors[0] || '');
  check('M 頁零錯誤', M.errors.length === 0, M.errors[0] || '');
  check('S 頁零錯誤', S.errors.length === 0, S.errors[0] || '');

  // ===== 多人頂欄（PlatTopCard MP）＋離開選單 MP 文案＋觀戰抽查 =====
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
  for (const p of [H, G]) { p.window.PLAT_show('akari'); await waitFor(() => !!p.window.__PLAT_HOOKS_akari, 300000, 'preboot akari'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="akari"]'));
  await sleep(600);
  await waitFor(() => (H.document.querySelector('#lob-step-room [data-pr="ready"]') && G.document.querySelector('#lob-step-room [data-pr="ready"]')) ? true : null, 30000, 'both ready btns');
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const startBtn = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return b && !b.disabled ? b : null; }, 60000, 'hub start');
  clickEl(H, startBtn);
  const dbgH = () => H.window.__PLAT_HOOKS_akari.debug();
  const dbgG = () => G.window.__PLAT_HOOKS_akari.debug();
  const playing = await waitFor(() => dbgH().mp.phase === 'playing' && dbgG().mp.phase === 'playing' ? 1 : null, 90000, 'mp playing');
  check('多人：開局 playing', !!playing);
  const bandH = H.document.querySelector('#akari-root [data-ptc-band]');
  const viewH = H.document.querySelector('#view-akari');
  check('底紙：多人畫面 view 點陣仍在', !!viewH && cs(H, viewH, 'backgroundImage').includes('radial-gradient'));
  const chipsH = H.document.querySelector('#akari-root [data-ptc-region="chips"]');
  check('頂欄多人：PlatTopCard band＋晶片列含雙人名', !!bandH && !!chipsH && (chipsH.textContent || '').includes('阿主') && (chipsH.textContent || '').includes('阿客'), chipsH && (chipsH.textContent || '').slice(0, 60));
  check('頂欄多人：模式晶片「競速對戰」', !!bandH && (bandH.textContent || '').includes('競速對戰'));
  // 離開選單 MP 文案（非錦標賽：無結束本局）
  clickEl(H, bandH.querySelector('[data-ptc="leave"]'));
  const lmMp = await waitFor(() => H.document.querySelector('#plat-leave-menu [data-plm-card]'), 15000, 'lm mp');
  check('離開選單 MP：回等待室＋退出（回大廳）、無結束本局', !!lmMp && (lmMp.textContent || '').includes('回等待室') && (lmMp.textContent || '').includes('退出（回大廳）') && !(lmMp.textContent || '').includes('結束本局'), lmMp && (lmMp.textContent || '').slice(0, 80));
  clickEl(H, lmMp && [...lmMp.querySelectorAll('button')].find(b => (b.textContent || '').includes('取消')));
  await sleep(300);
  // 觀戰抽查：來賓完賽 → 房主晶片顯示 🏁、房主完賽後轉觀戰面板
  const solG = dbgG().puzzle.solution;
  const cellG = (p, i) => p.document.querySelector('#akari-root button[data-cell="' + i + '"]');
  for (const i of solG) { if (dbgG().cells[i] !== 1) { const el = cellG(G, i); if (el) el.click(); await sleep(30); } }
  await waitFor(() => dbgG().myOutcome === 'finished', 30000, 'guest finished');
  await sleep(1200);
  const chipsH2 = H.document.querySelector('#akari-root [data-ptc-region="chips"]');
  check('觀戰抽查：房主端晶片顯示來賓 🏁', !!chipsH2 && (chipsH2.textContent || '').includes('🏁'), chipsH2 && (chipsH2.textContent || '').slice(0, 60));
  check('H/G 零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  console.log('==== AKARI-FRAMEWORK: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
