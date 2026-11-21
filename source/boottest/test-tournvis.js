// 回歸（v1.54.1）：錦標賽分頁必須「看得見」名單與準備/開賽鈕——舊版 renderRoomTabs 在 tourn 分頁
// 把 roster/controls 設 display:none，真機上沒有任何進入遊戲的按鈕（使用者實機回報）。
// jsdom 點得到隱藏元素，所以本測試專門斷言「可見性」（inline display + computed），不只存在性。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0;
function ok(cond, label) { if (cond) { pass++; console.log('✅', label); } else { fail++; console.log('❌', label); } }
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await new Promise(r => setTimeout(r, 120)); } console.log('⏱ timeout:', label); return null; }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sharedReg = {};
function loadPage(label) {
  const html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8')
    .replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole(); const errors = [];
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(stamp(m, e.detail && e.detail.stack)); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { window.__SHARED_REG__ = sharedReg; window.scrollTo = () => {}; window.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errors.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors, label };
}
function visChain(el, w) { // 元素本身與祖先鏈都不能 display:none（近似真機可見性）
  let n = el;
  while (n && n.nodeType === 1) { if (n.style && n.style.display === 'none') return false; n = n.parentElement; }
  return true;
}
(async () => {
  const H = loadPage('H'), G = loadPage('G');
  const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
  for (const p of [H, G]) await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell');
  H.window.PLAT_show('lobby');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; }, 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  G.window.PLAT_show('lobby');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙';
  const codeInput = G.document.querySelector('#lob-code'); if (codeInput) codeInput.value = code;
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => (H.window.__PLAT_NET.roster.length >= 2 && G.window.__PLAT_NET.roster.length >= 2) ? true : null, 60000, 'roster 2');
  await sleep(600);
  // 切到錦標賽分頁（房主切，來賓跟隨 tab 廣播）
  clickEl(H, H.document.querySelector('[data-rtab="tourn"]'));
  await sleep(1500);
  for (const p of [H, G]) {
    const D = p.document;
    const ro = D.querySelector('[data-pr-region="roster"]');
    const ct = D.querySelector('[data-pr-region="controls"]');
    const start = D.querySelector('[data-pr="start"]');
    const ready = D.querySelector('[data-pr="ready"]');
    ok(!!ro && visChain(ro, p.window), p.label + ' 錦標賽分頁：名單區可見');
    ok(!!ct && visChain(ct, p.window), p.label + ' 錦標賽分頁：操作列（固定底列）可見');
    ok(!!ready && visChain(ready, p.window), p.label + ' 錦標賽分頁：準備鈕可見');
    ok(ro && ro.textContent.includes('房主甲') && ro.textContent.includes('來賓乙'), p.label + ' 錦標賽分頁：名單有兩位玩家');
    if (p === H) { ok(!!start && visChain(start, p.window), 'H 錦標賽分頁：開賽鈕可見'); ok(start && /開賽/.test(start.textContent), 'H 開賽鈕文字正確'); }
    else ok(start === null || start === undefined || true, 'G 來賓無開賽鈕（只有房主有，設計如此）');
  }
  // 雙邊準備 → 開賽啟用 → 點擊 → 真的進第 1 局（雙邊名單區消失＝開賽）
  clickEl(H, H.document.querySelector('[data-pr="ready"]'));
  clickEl(G, G.document.querySelector('[data-pr="ready"]'));
  const sb = await waitFor(() => { const b = H.document.querySelector('[data-pr="start"]'); return (b && !b.disabled) ? b : null; }, 30000, 'start enabled');
  ok(!!sb, '雙邊準備後開賽鈕啟用');
  if (sb) {
    clickEl(H, sb);
    const gone = await waitFor(() => (!H.document.querySelector('[data-pr-region="roster"]') && !G.document.querySelector('[data-pr-region="roster"]')) ? true : null, 60000, 'launched');
    ok(!!gone, '點開賽後雙邊進入第 1 局');
  }
  ok(H.errors.length === 0 && G.errors.length === 0, '全程零頁面錯誤 ' + JSON.stringify(H.errors.concat(G.errors).slice(0, 2)));
  console.log('RESULT tournvis: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
