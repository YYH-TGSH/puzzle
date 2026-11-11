// 回歸（v1.55.0，訊息呈現 P1＋P2）：
// P1 聊天訊息進場（升入 class、結束後不殘留）＋列表平滑捲動；Toast 升起進場、連續通知 PlatLite 滾換、置中不跑位。
// P2 小框通則：表情面板/聊天面板/PlatBar 子選單經 popover helper——關閉有淡出緩衝（斷言可見性「時序」，不只終值，v1.54.1 教訓）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0; const fails = [];
function ok(cond, label, extra) { if (cond) { pass++; console.log('✅', label); } else { fail++; fails.push(label); console.log('❌', label, extra !== undefined ? '— ' + extra : ''); } }
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await new Promise(r => setTimeout(r, 100)); } console.log('⏱ timeout:', label); return null; }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shellSrc = fs.readFileSync('/home/hatch/workspace/platform/shell.js', 'utf8');
const shellCss = fs.readFileSync('/home/hatch/workspace/platform/shell.css', 'utf8');
// --- 靜態：施工形狀 ---
ok(/--plat-toast-rise:\s*10px/.test(shellCss), 'CSS 有 --plat-toast-rise 參數');
ok(/function platPopOpen/.test(shellSrc) && /function platPopClose/.test(shellSrc), 'popover 共用 helper 存在');
ok(!/\$\('plat-speak'\)\.style\.display/.test(shellSrc), 'plat-speak 不再直接切 display（全走 speakShow/speakHide）');
ok(/function speakShow/.test(shellSrc) && /function speakHide/.test(shellSrc), 'speakShow/speakHide 包裝存在');
ok(/PlatLite\(span, msg\)/.test(shellSrc) && /plat-toast-in/.test(shellSrc), 'toast 換字走 PlatLite＋升起 class');
ok((shellSrc.match(/data-pbmenu=/g) || []).length >= 3, 'PlatBar 三個子選單帶 data-pbmenu');
ok(/PLAT_VERSION = '1\.63\.0'/.test(shellSrc), '版本 1.63.0');

const sharedReg = {};
function loadPage(label) {
  const html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8')
    .replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
  const vc = new VirtualConsole(); const errors = [];
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(m); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { window.__SHARED_REG__ = sharedReg; window.scrollTo = () => {}; window.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errors.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors, label };
}
(async () => {
  const H = loadPage('H'), G = loadPage('G');
  const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
  for (const p of [H, G]) await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell');
  H.window.PLAT_show('lobby');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '阿主'; clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; }, 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  G.window.PLAT_show('lobby');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '阿客';
  const ci = G.document.querySelector('#lob-code'); if (ci) ci.value = code;
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => (H.window.__PLAT_NET.roster.length >= 2 && G.window.__PLAT_NET.roster.length >= 2) ? true : null, 60000, 'roster2');

  // --- 聊天面板本體經 popover（同步斷言進場 class） ---
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="dock-chat"]'));
  const panel = H.document.querySelector('#plat-chat-panel');
  ok(panel.classList.contains('plat-pop-in-x'), '聊天面板開啟帶 popover 進場 class（-x 合併置中）');
  ok(H.document.querySelector('#plat-chat').style.display === 'block', '聊天外層顯示');

  // --- 對方訊息進場 ---
  const gInp = G.document.querySelector('#plat-chat-input'); gInp.value = '哈囉測試';
  clickEl(G, G.document.querySelector('#plat-chat-send'));
  const hList = H.document.querySelector('#plat-chat-list');
  const node = await waitFor(() => { const ns = [...hList.querySelectorAll('.plat-msg')]; const n = ns[ns.length - 1]; return (n && n.textContent.includes('哈囉測試')) ? n : null; }, 15000, 'H got msg');
  ok(!!node, '房主收到來賓訊息');
  ok(node && node.classList.contains('plat-msg-in'), '新訊息帶進場 class plat-msg-in');
  await sleep(600);
  ok(node && !node.classList.contains('plat-msg-in') && !node.style.transform, '進場結束後 class 移除、無殘留 transform');

  // --- 自己的訊息：mine 變體（rise 較大） ---
  const hInp = H.document.querySelector('#plat-chat-input'); hInp.value = '我的一則';
  clickEl(H, H.document.querySelector('#plat-chat-send'));
  const nodes2 = [...hList.querySelectorAll('.plat-msg')]; const mine = nodes2[nodes2.length - 1];
  ok(mine && mine.textContent.includes('我的一則') && mine.classList.contains('plat-msg-in') && mine.classList.contains('mine'), '自己的訊息帶 mine 進場變體');

  // --- 表情面板：開經 helper、關有淡出緩衝（時序斷言） ---
  clickEl(H, H.document.querySelector('#plat-chat-emoji'));
  const ep = H.document.querySelector('#plat-chat-emojis');
  ok(ep.style.display === 'grid' && ep.classList.contains('plat-pop-in'), '表情面板開啟：display grid＋pop-in');
  clickEl(H, H.document.querySelector('#plat-chat-emoji'));
  ok(ep.style.display === 'grid' && ep.classList.contains('plat-pop-out'), '表情面板關閉當下：仍可見＋pop-out 淡出中（非瞬間消失）');
  await sleep(350);
  ok(ep.style.display === 'none', '表情面板淡出完成後才 display:none');

  // --- Toast：升起＋滾換＋置中 ---
  const T = H.window.__PLAT_TOAST;
  T('第一則通知');
  const toast = H.document.querySelector('#plat-toast');
  ok(toast && toast.style.display === 'block' && toast.classList.contains('plat-toast-in'), 'toast 首次：升起進場 class');
  ok(toast && toast.querySelector('span') && toast.querySelector('span').textContent === '第一則通知', 'toast 文字在內層 span');
  ok(toast && /translateX\(-50%\)/.test(toast.style.cssText || toast.style.transform), 'toast 置中 transform  intact'.replace(' intact', '未被弄壞'));
  T('第二則通知');
  const sp2 = toast.querySelector('span');
  ok(sp2.textContent === '第二則通知' && sp2.classList.contains('plat-lite-in'), 'toast 連續通知：PlatLite 滾換（非瞬換）');

  // --- PlatBar 子選單（獨立單機頁） ---
  const S = loadPage('S');
  await waitFor(() => (typeof S.window.PLAT_show === 'function' && S.window.PlatDock) ? true : null, 120000, 'S shell');
  S.window.PLAT_show('mines');
  await waitFor(() => S.document.querySelector('#mines-root h1'), 60000, 'S mines home');
  const clickBtn = pred => { const b = [...S.document.querySelectorAll('#mines-root button')].find(pred); if (b) { b.click(); return true; } return false; };
  clickBtn(b => b.textContent.includes('單機挑戰')); await sleep(250);
  clickBtn(b => b.textContent.includes('9×9'));
  await waitFor(() => S.document.querySelectorAll('#mines-root button[data-cell]').length === 81, 15000, 'S cells');
  await waitFor(() => S.document.querySelector('[data-pb="zoom-toggle"]'), 10000, 'S bar');
  clickEl(S, S.document.querySelector('[data-pb="zoom-toggle"]'));
  const zm = S.document.querySelector('[data-pbmenu="zoom"]');
  ok(!!zm && zm.classList.contains('plat-pop-in'), '縮放子選單開啟：plat-pop-in 進場');
  clickEl(S, S.document.querySelector('[data-pb="zoom-toggle"]'));
  const zm2 = S.document.querySelector('[data-pbmenu="zoom"]');
  ok(!!zm2 && zm2.classList.contains('plat-pop-out'), '縮放子選單關閉當下：屍體以 pop-out 姿態仍在（淡出中）');
  await sleep(450);
  ok(!S.document.querySelector('[data-pbmenu="zoom"]'), '縮放子選單淡出完成後才移除');

  ok(H.errors.length === 0 && G.errors.length === 0 && S.errors.length === 0, '零錯誤', (H.errors[0] || '') + '|' + (G.errors[0] || '') + '|' + (S.errors[0] || ''));
  console.log('\nRESULT msgfx: ' + pass + ' pass / ' + fail + ' fail' + (fails.length ? ' FAILS: ' + fails.join('；') : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
