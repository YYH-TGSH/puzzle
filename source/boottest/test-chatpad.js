// v1.61.3 聊天浮動列遮擋修復驗收：聊天可見時捲動內容底部留白（body.plat-chat-vis 驅動），關閉歸零。
// 幾何：聊天面板 bottom:96px＋縮小標題列約 46px → 留白 156px＋安全區（CSS 數值以靜態規則斷言，jsdom 不算 layout）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name + (extra ? ' — ' + extra : '')); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(100); } console.log('  (timeout: ' + label + ')'); return null; }
// ---- 靜態：CSS 規則與 marker ----
const css = fs.readFileSync('/home/hatch/workspace/platform/shell.css', 'utf8');
check('CSS：房間頁/地雷 view 留白規則（156px＋安全區）', /body\.plat-chat-vis #view-lobby, body\.plat-chat-vis #view-mines \{ padding-bottom: calc\(156px \+ env\(safe-area-inset-bottom/.test(css));
check('CSS：plat-chat-clear 容器留白規則（156px＋安全區）', /body\.plat-chat-vis \.plat-chat-clear \{ padding-bottom: calc\(156px \+ env\(safe-area-inset-bottom/.test(css));
const sud = fs.readFileSync('/home/hatch/workspace/sudoku-site/js/app.js', 'utf8');
const has = fs.readFileSync('/home/hatch/workspace/hashi-site/js/app.js', 'utf8');
check('數獨 zoom 容器有 plat-chat-clear marker', (sud.match(/plat-chat-clear/g) || []).length === 1);
check('數橋兩個捲動容器有 plat-chat-clear marker（對局＋觀戰等待）', (has.match(/plat-chat-clear/g) || []).length === 2);
const shell = fs.readFileSync('/home/hatch/workspace/platform/shell.js', 'utf8');
check('shell：openChat/closeChat 同步 body class', (shell.match(/syncChatVis\(\)/g) || []).length >= 3);
// ---- 行為 ----
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const REG = {}; const errors = [];
function loadPage(label) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String(e.detail && e.detail.message || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(label + ': ' + m); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = REG; w.scrollTo = () => {}; w.addEventListener('error', ev => { if (ev.message && !/Script error/.test(ev.message)) errors.push(label + ': ' + ev.message); }); } });
  return { window: dom.window, document: dom.window.document, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true, cancelable: true })); return !!el; };
function setInput(w, el, v) { if (!el) return; const st = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; st.call(el, v); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
(async () => {
  const H = loadPage('H');
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 90000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 30000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => H.window.__PLAT_NET && H.window.__PLAT_NET.code, 60000, 'H room');
  check('初始 body 無 plat-chat-vis', !H.document.body.classList.contains('plat-chat-vis'));
  // 開聊天（房間頁 dock 鈕）
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="dock-chat"]'));
  await sleep(400);
  check('開聊天 → body 有 plat-chat-vis', H.document.body.classList.contains('plat-chat-vis'));
  const pbOpen = H.window.getComputedStyle(H.document.querySelector('#view-lobby')).paddingBottom;
  console.log('  [info] jsdom computed #view-lobby paddingBottom（開啟時）:', JSON.stringify(pbOpen));
  // 縮小 → 仍可見、class 保留
  clickEl(H, H.document.querySelector('#plat-chat-min'));
  await sleep(300);
  check('縮小後 body 仍有 plat-chat-vis（縮小態也要留白）', H.document.body.classList.contains('plat-chat-vis'));
  check('縮小態面板 body 隱藏、標題列在', H.document.querySelector('#plat-chat-body').style.display === 'none' && H.document.querySelector('#plat-chat').style.display === 'block');
  // 關聊天 → class 移除（留白歸零）
  H.window.PlatDock.toggleChat();
  await sleep(300);
  check('關聊天 → body 無 plat-chat-vis（留白歸零）', !H.document.body.classList.contains('plat-chat-vis'));
  // 對局中（數獨）：容器 marker 在 DOM、開聊天 class 同步
  H.window.PLAT_show('sudoku');
  const soloBtn = await waitFor(() => [...H.document.querySelectorAll('#view-sudoku button')].find(b => (b.textContent || '').includes('單機挑戰')), 60000, 'sudoku home');
  clickEl(H, soloBtn);
  await sleep(500);
  const startBtn = await waitFor(() => H.document.querySelector('#plat-setup [data-pse="start"]'), 30000, 'sudoku setup start'); // F3：單機難度改殼 PlatSetup（seg 選版型/難度→開始）
  clickEl(H, startBtn);
  const zc = await waitFor(() => H.document.querySelector('#view-sudoku .custom-scrollbar.plat-chat-clear'), 60000, 'sudoku container marker');
  check('數獨對局容器 DOM 帶 plat-chat-clear', !!zc);
  H.window.PlatDock.toggleChat();
  await sleep(300);
  check('對局中開聊天 → body class 同步', H.document.body.classList.contains('plat-chat-vis'));
  H.window.PlatDock.toggleChat();
  await sleep(300);
  check('全程零頁面錯誤', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log('RESULT chatpad: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
