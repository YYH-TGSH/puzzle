// v1.6.0 驗證：數橋大亂鬥進度條改數獨款晶片條（玩家色細條）＋點晶片開個人設定（改名/改色；房主可改全員）
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const mockSrc = require('./mockpeer.js');
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
// 找進度晶片：最小的、含名字與 % 且內有 width:% 進度條的 div
function findChip(D, name) {
  const divs = [...D.querySelectorAll('#view-hashi div')];
  const cands = divs.filter(d => d.textContent.includes(name) && d.textContent.includes('%') && [...d.querySelectorAll('div')].some(x => (x.getAttribute('style') || '').includes('width:')));
  cands.sort((a, b) => a.textContent.length - b.textContent.length);
  return cands[0] || null;
}
function chipBar(D, name) {
  const chip = findChip(D, name);
  if (!chip) return null;
  const bars = [...chip.querySelectorAll('div')].filter(x => (x.getAttribute('style') || '').includes('width:'));
  return bars[bars.length - 1] || null;
}
function findModal(D) {
  const divs = [...D.querySelectorAll('div')];
  return divs.find(d => d.textContent.includes('個人設定') && d.querySelector('input[type="text"]')) || null;
}
(async () => {
  const host = loadPageShared(HTML);
  await waitFor(() => typeof host.w.PLAT_show === 'function' && host.w.PlatDock, 600000, 'host shell');
  click(host.w, host.D.querySelector('#lob-go-create'));
  await waitFor(() => host.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'host nick step');
  setInput(host.w, host.D.querySelector('#lob-name'), '阿主');
  click(host.w, host.D.querySelector('#lob-confirm'));
  await waitFor(() => (host.D.querySelector('#lob-room-code') || { textContent: '' }).textContent.trim().length === 4, 60000, 'host room code');
  const code = host.D.querySelector('#lob-room-code').textContent.trim();
  const guest = loadPageShared(HTML);
  await waitFor(() => typeof guest.w.PLAT_show === 'function' && guest.w.PlatDock, 600000, 'guest shell');
  click(guest.w, guest.D.querySelector('#lob-go-join'));
  await waitFor(() => guest.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'guest nick step');
  setInput(guest.w, guest.D.querySelector('#lob-code'), code);
  setInput(guest.w, guest.D.querySelector('#lob-name'), '阿客');
  click(guest.w, guest.D.querySelector('#lob-confirm'));
  await waitFor(() => (guest.D.querySelector('#lob-roster') || { textContent: '' }).textContent.includes('阿主'), 60000, 'guest sees host');
  click(host.w, host.D.querySelector('[data-launch="hashi-brawl"]'));
  await waitFor(() => host.D.querySelector('#view-hashi [data-pr-region="roster"]'), 120000, 'host hashi room');
  await waitFor(() => guest.D.querySelector('#view-hashi [data-pr-region="roster"]'), 120000, 'guest hashi room');
  click(guest.w, guest.D.querySelector('#view-hashi [data-pr="ready"]'));
  await sleep(600);
  click(host.w, host.D.querySelector('#view-hashi [data-pr="ready"]'));
  // 等開始鈕亮起並點擊，等競速晶片條出現
  const stripUp = await waitFor(() => {
    const hStart = host.D.querySelector('#view-hashi [data-pr="start"]');
    if (hStart && !hStart.disabled) click(host.w, hStart);
    return findChip(guest.D, '阿客') && findChip(guest.D, '阿主');
  }, 90000, 'race strip up');
  check('競速開始：來賓端出現數獨款進度晶片（阿主＋阿客）', !!stripUp);
  check('房主端也有進度晶片', !!findChip(host.D, '阿客'));
  const barH = chipBar(guest.D, '阿主'), barG = chipBar(guest.D, '阿客');
  console.log('bar backgrounds: host=', barH && barH.style.background, 'guest=', barG && barG.style.background);
  check('進度條是玩家代表色（兩人不同色，非統一綠）', !!barH && !!barG && barH.style.background !== barG.style.background && barH.style.background !== '' && barG.style.background !== '');
  // 來賓點自己的晶片 → modal → 改名
  click(guest.w, findChip(guest.D, '阿客'));
  const modal1 = await waitFor(() => findModal(guest.D), 15000, 'guest edit modal');
  check('來賓點自己晶片：個人設定 modal 開啟', !!modal1);
  setInput(guest.w, modal1.querySelector('input[type="text"]'), '阿客改');
  click(guest.w, [...modal1.querySelectorAll('button')].find(b => b.textContent.includes('儲存')));
  const renamedSelf = await waitFor(() => findChip(guest.D, '阿客改') && findChip(host.D, '阿客改'), 20000, 'rename propagates');
  check('來賓改自己的名：雙邊晶片同步新名', !!renamedSelf);
  // 房主點來賓晶片 → modal → 改名（房主可改全員）
  click(host.w, findChip(host.D, '阿客改'));
  const modal2 = await waitFor(() => findModal(host.D), 15000, 'host edit modal for guest');
  check('房主點來賓晶片：個人設定 modal 開啟', !!modal2);
  setInput(host.w, modal2.querySelector('input[type="text"]'), '羊駝');
  click(host.w, [...modal2.querySelectorAll('button')].find(b => b.textContent.includes('儲存')));
  const renamedByHost = await waitFor(() => findChip(host.D, '羊駝') && findChip(guest.D, '羊駝'), 20000, 'host rename propagates');
  check('房主改來賓的名：雙邊晶片同步新名', !!renamedByHost);
  // 房主點來賓晶片 → 改色
  const beforeBar = chipBar(host.D, '羊駝');
  const beforeBg = beforeBar && beforeBar.style.background;
  click(host.w, findChip(host.D, '羊駝'));
  const modal3 = await waitFor(() => findModal(host.D), 15000, 'host edit modal recolor');
  const colorBtns = [...modal3.querySelectorAll('button')].filter(b => (b.getAttribute('title') || '').startsWith('#'));
  const hexToRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return 'rgb(' + ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ')'; };
  const pick = colorBtns.find(b => hexToRgb(b.getAttribute('title')) !== beforeBg) || colorBtns[0];
  const pickColor = pick.getAttribute('title');
  const pickRgb = hexToRgb(pickColor);
  click(host.w, pick);
  const recolored = await waitFor(() => { const b = chipBar(host.D, '羊駝'); return b && b.style.background === pickRgb; }, 20000, 'recolor applies');
  console.log('recolor: before=', beforeBg, 'picked=', pickColor, 'applied=', !!recolored);
  check('房主改來賓的代表色：晶片進度條變色', !!recolored);
  const recolorGuest = await waitFor(() => { const b = chipBar(guest.D, '羊駝'); return b && b.style.background === pickRgb; }, 20000, 'recolor syncs to guest');
  check('改色同步到來賓端', !!recolorGuest);
  check('零頁面錯誤（host+guest）', host.errors.length === 0 && guest.errors.length === 0);
  report([...host.errors, ...guest.errors]); host.w.close(); guest.w.close();
})().catch((e) => { console.error('FATAL', e); report([]); process.exitCode = 1; });
