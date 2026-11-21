// 【已退休 2026-11-21】核心斷言（Peer 必須帶 metered openrelay TURN 中繼）已被使用者零伺服器成本政策淘汰（Metered TURN 明拒），不再列入回歸清單（run-all.js 已移除）。連線流程本身由 test-hub/test-roomui 覆蓋。本檔保留作歷史紀錄，勿再跑。
// v1.6.1 驗證：殼建立 RealPeer（房主/來賓）時有帶上 ICE 設定（STUN + TURN 中繼）
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
let mockSrc = require('./mockpeer.js');
// 幫 mock Peer 加上建構參數記錄（只在本測試）
mockSrc = mockSrc.replace('function Peer(id) {', 'function Peer(id, opts) { (window.__peerArgs = window.__peerArgs || []).push([id, opts]);');
const { sleep, waitFor, click, check, report } = require('./harness');
const SHARED_REG = {};
function loadPageShared(htmlPath) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/<script[^>]+src="[^"]*peerjs[^"]*"[^>]*><\/script>/, '<script>' + mockSrc + '</script>');
  const errors = [];
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', (m) => errors.push(stamp(String(m))));
  const dom = new JSDOM(html, {
    url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) {
      window.__SHARED_REG__ = SHARED_REG;
      window.fetch = (url, opts) => fetch(new URL(url, window.location.href).href, opts);
      window.scrollTo = () => {};
    },
  });
  const w = dom.window;
  w.addEventListener('error', (e) => { if (e.message && !/Script error/.test(e.message)) errors.push(stamp(e.message, e.error && e.error.stack)); });
  return { w, D: w.document, errors };
}
function setInput(w, el, val) {
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set;
  setter.call(el, val);
  el.dispatchEvent(new w.Event('input', { bubbles: true }));
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
  return true;
}
const HTML = '/home/hatch/workspace/platform/platform-v1-test.html';
function hasTurn(pg) {
  const args = pg.w.__peerArgs || [];
  return args.some(a => a[1] && a[1].config && Array.isArray(a[1].config.iceServers) && a[1].config.iceServers.some(s => String(s.urls).includes('turn:openrelay.metered.ca')));
}
function hasStun(pg) {
  const args = pg.w.__peerArgs || [];
  return args.some(a => a[1] && a[1].config && Array.isArray(a[1].config.iceServers) && a[1].config.iceServers.some(s => String(s.urls).includes('stun:')));
}
(async () => {
  const host = loadPageShared(HTML);
  await waitFor(() => typeof host.w.PLAT_show === 'function' && host.w.PlatDock, 600000, 'host shell');
  click(host.w, host.D.querySelector('#lob-go-create'));
  await waitFor(() => host.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'host nick step');
  setInput(host.w, host.D.querySelector('#lob-name'), '阿主');
  click(host.w, host.D.querySelector('#lob-confirm'));
  await waitFor(() => host.w.__PLAT_NET && host.w.__PLAT_NET.code, 60000, 'host room code'); // 2026-11-21 修：#lob-room-code 已隨舊大廳退役，房號改讀 __PLAT_NET.code
  const code = host.w.__PLAT_NET.code;
  check('房主 Peer 有帶 TURN 中繼設定', hasTurn(host));
  check('房主 Peer 有帶 STUN 設定', hasStun(host));
  const guest = loadPageShared(HTML);
  await waitFor(() => typeof guest.w.PLAT_show === 'function' && guest.w.PlatDock, 600000, 'guest shell');
  click(guest.w, guest.D.querySelector('#lob-go-join'));
  await waitFor(() => guest.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'guest nick step');
  setInput(guest.w, guest.D.querySelector('#lob-code'), code);
  setInput(guest.w, guest.D.querySelector('#lob-name'), '阿客');
  click(guest.w, guest.D.querySelector('#lob-confirm'));
  await waitFor(() => (guest.D.querySelector('#lob-roster') || { textContent: '' }).textContent.includes('阿主'), 60000, 'guest sees host');
  check('來賓 Peer 有帶 TURN 中繼設定', hasTurn(guest));
  check('來賓 Peer 有帶 STUN 設定', hasStun(guest));
  check('加了 ICE 設定後連線流程仍正常（來賓看到房主）', true);
  check('零頁面錯誤（host+guest）', host.errors.length === 0 && guest.errors.length === 0);
  report([...host.errors, ...guest.errors]); host.w.close(); guest.w.close();
})().catch((e) => { console.error('FATAL', e); report([]); process.exitCode = 1; });
