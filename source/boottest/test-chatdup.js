// v1.61.2 聊天重複送出修復驗收：sendChat 800ms 同文去重鎖＋keydown repeat/組字 guard（使用者實機回報 Enter 連按送兩遍）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name + (extra ? ' — ' + extra : '')); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(100); } console.log('  (timeout: ' + label + ')'); return null; }
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
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G');
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 90000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 30000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 60000, 'G in room');
  const inp = H.document.querySelector('#plat-chat-input');
  const enter = (opts) => inp.dispatchEvent(new H.window.KeyboardEvent('keydown', Object.assign({ key: 'Enter', bubbles: true, cancelable: true }, opts || {})));
  const count = (p, t) => [...p.document.querySelectorAll('#plat-chat-list .plat-msg')].filter(n => (n.textContent || '').includes(t)).length;
  const send = (t, opts) => { inp.value = t; enter(opts); };
  // 1) 正常送出
  send('哈囉');
  await waitFor(() => count(H, '哈囉') === 1 && count(G, '哈囉') === 1, 15000, 'first delivered');
  check('正常 Enter 送出：自己與對方各一則', count(H, '哈囉') === 1 && count(G, '哈囉') === 1);
  // 2) 同文立即重入（模擬 webview 二次派發：值被重設後同 tick 再觸發）→ 去重鎖擋下
  send('哈囉'); await sleep(400);
  check('同文 800ms 內重入被去重鎖擋下（不 append、不 distribute）', count(H, '哈囉') === 1 && count(G, '哈囉') === 1, 'H=' + count(H, '哈囉') + ' G=' + count(G, '哈囉'));
  // 3) 不同文立即送 → 照常
  send('下一句');
  await waitFor(() => count(H, '下一句') === 1 && count(G, '下一句') === 1, 15000, 'diff text');
  check('不同文不受去重影響', count(H, '下一句') === 1 && count(G, '下一句') === 1);
  // 4) 組字中 Enter 不送、之後正常 Enter 照送
  send('組字', { isComposing: true }); await sleep(300);
  check('isComposing 的 Enter 不送出', count(H, '組字') === 0);
  enter(); await waitFor(() => count(H, '組字') === 1, 10000, 'after composing');
  check('組字結束後正常 Enter 照常送出', count(H, '組字') === 1);
  // 5) repeat Enter 不送、之後正常 Enter 照送
  send('連按', { repeat: true }); await sleep(300);
  check('repeat 的 Enter 不送出', count(H, '連按') === 0);
  enter(); await waitFor(() => count(H, '連按') === 1, 10000, 'after repeat');
  check('repeat 後正常 Enter 照常送出', count(H, '連按') === 1);
  // 6) 假時鐘：同文 300ms 擋、900ms 放行
  const origNow = H.window.Date.now;
  let fakeT = 5000000;
  H.window.Date.now = () => fakeT;
  send('重複句');
  check('假時鐘首送成功', count(H, '重複句') === 1);
  fakeT += 300; send('重複句');
  check('同文 +300ms 仍被擋', count(H, '重複句') === 1);
  fakeT += 600; send('重複句');
  check('同文 +900ms 放行（正常重複發言）', count(H, '重複句') === 2);
  H.window.Date.now = origNow;
  check('全程零頁面錯誤', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log('RESULT chatdup: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
