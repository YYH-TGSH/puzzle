// 數橋單機入口專項（v1.58.0 定案；F3 v1.72.0 改殼 PlatSetup 後同形驗證）：
// ①點單機挑戰先跳難度選擇（不直接開局）、副標為開始挑戰版 ②取消回主畫面 ③選難度才開局、規格籤顯示難度名
// ④每日模式規格籤顯示「每日一題」不空白 ⑤每日後再進單機，上次單機難度被還原反綠（不被每日污染）
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
    beforeParse(w) { w.__SHARED_REG__ = reg; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
(async () => {
  let pass = 0, fail = 0;
  const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
  const reg = {};
  const H = loadPage(reg, 'H');
  await waitFor(() => (typeof H.window.PLAT_show === 'function' && H.window.__PLAT_NET) ? true : null, 120000, 'shell');
  H.window.PLAT_show('hashi');
  const btnByText = (txt) => [...H.document.querySelectorAll('#view-hashi button')].find(b => (b.textContent || '').includes(txt));
  const modal = () => H.document.querySelector('#plat-setup [data-pse-card]'); // F3：難度選擇改殼 PlatSetup overlay
  const lvlBtn = () => H.document.querySelector('#hashi-root [data-ptc="spec"]'); // F3：規格籤改殼 PlatTopCard
  const goHome = async () => { // F3：離開走殼 PlatLeaveMenu
    clickEl(H, H.document.querySelector('#hashi-root [data-ptc="leave"]'));
    const lm = await waitFor(() => H.document.querySelector('#plat-leave-menu [data-plm-card]'), 15000, 'leave menu');
    clickEl(H, lm && [...lm.querySelectorAll('button')].find(b => (b.textContent || '').includes('回主選單')));
    await waitFor(() => btnByText('單機挑戰'), 30000, 'home again');
  };
  await waitFor(() => btnByText('單機挑戰'), 60000, 'hashi home');
  await sleep(800);
  // 首次自動教學（殼 PlatTutorial）若開著先跳過，避免干擾後續點擊目標判讀
  if (H.window.PlatTutorial && H.window.PlatTutorial.isShown()) {
    const tc = H.document.querySelector('#plat-tutorial [data-ptu-card]');
    clickEl(H, tc && [...tc.querySelectorAll('button')].find(b => (b.textContent || '').includes('跳過')));
    await sleep(400);
  }

  // ① 點單機挑戰 → 先開難度選擇（不直接開局）
  clickEl(H, btnByText('單機挑戰'));
  const m1 = await waitFor(() => modal(), 20000, 'PlatSetup');
  check('單機入口：點單機挑戰先跳難度選擇', !!m1);
  check('單機入口：modal 副標為開始挑戰版', !!m1 && (m1.textContent || '').includes('開始一局新的挑戰'), m1 ? (m1.textContent || '').slice(0, 60) : '');
  // ② 取消 → 回主畫面
  clickEl(H, H.document.querySelector('#plat-setup [data-pse="cancel"]'));
  await sleep(800);
  check('單機入口：取消回到主畫面', !!btnByText('單機挑戰') && !modal());
  // ③ 再進 → 選 5x5 幼幼班 → 開局且規格籤顯示 5x5 幼幼班
  clickEl(H, btnByText('單機挑戰'));
  await waitFor(() => modal(), 20000, 'PlatSetup 2');
  const opt5 = modal() && modal().querySelector('[data-pse-opt="1"]');
  check('單機入口：modal 有 5x5 幼幼班選項', !!opt5 && (opt5.textContent || '').includes('5x5 幼幼班'));
  clickEl(H, opt5);
  await sleep(2500);
  check('選難度後 modal 關閉', !H.window.PlatSetup.isShown());
  check('選難度後規格籤顯示「5x5 幼幼班」', !!lvlBtn() && (lvlBtn().textContent || '').includes('5x5 幼幼班'), lvlBtn() ? lvlBtn().textContent.trim() : 'none');
  // ④ 回主畫面 → 進每日一題 → 規格籤顯示每日一題（不空白）
  await goHome();
  const dailyBtn = btnByText('每日一題');
  check('回主畫面成功', !!dailyBtn);
  clickEl(H, dailyBtn); await sleep(3000);
  const bandDaily = H.document.querySelector('#hashi-root [data-ptc-band]');
  check('每日模式規格籤顯示「每日一題」不空白', !!bandDaily && (bandDaily.textContent || '').includes('每日一題') && !lvlBtn(), bandDaily ? (bandDaily.textContent || '').slice(0, 60) : 'no band'); // F3：每日模式 spec 不可點→殼以 span 顯示標籤（標籤仍在、非空白）
  // ⑤ 每日之後回主畫面 → 單機挑戰 → 上次單機難度（5x5）被還原反綠
  await goHome();
  clickEl(H, btnByText('單機挑戰'));
  await waitFor(() => modal(), 20000, 'PlatSetup 3');
  await sleep(400);
  const opt5b = modal() && modal().querySelector('[data-pse-opt="1"]');
  check('每日後單機入口：上次難度 5x5 被還原反綠', !!opt5b && H.window.getComputedStyle(opt5b).backgroundColor === 'rgb(74, 222, 128)', opt5b ? H.window.getComputedStyle(opt5b).backgroundColor : '');
  const opt10 = modal() && modal().querySelector('[data-pse-opt="2"]');
  clickEl(H, opt10); await sleep(2500);
  check('改選 10x10 後規格籤顯示「10x10 標準」', !!lvlBtn() && (lvlBtn().textContent || '').includes('10x10 標準'), lvlBtn() ? lvlBtn().textContent.trim() : 'none');
  check('零錯誤', H.errors.length === 0, H.errors[0] || '');
  console.log('\nRESULT solo-pick: ' + pass + ' pass / ' + fail + ' fail');
  H.window.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
