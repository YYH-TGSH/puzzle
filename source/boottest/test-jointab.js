// 進房分頁同步：房主已切到踩地雷/錦標賽分頁時，新進房的來賓必須直接落在同一分頁
// 舊 bug：join 回應只送名單＋三款設定＋準備狀態，沒送房主目前選的遊戲 → 來賓停在預設數獨分頁
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
if (!html.includes(marker)) { console.log('MARKER MISSING'); process.exit(2); }
html = html.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; } });
  return { window: dom.window, document: dom.window.document, label, errors: errs };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block'; };
const tabOn = (p, id) => { const b = p.document.querySelector('[data-rtab="' + id + '"]'); return b ? b.className : ''; };
async function joinRoom(G, code, name) {
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, name + ' nick step');
  setInput(G.window, G.document.querySelector('#lob-name'), name);
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
}
(async () => {
  const H = loadPage('H'), G = loadPage('G'), G2 = loadPage('G2');
  for (const p of [H, G, G2]) await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.PlatDock) ? true : null, 120000, p.label + ' shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '房主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => hubRoom(H) && H.window.__PLAT_NET.code, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;

  // 房主先切到踩地雷分頁（還沒人進房）
  clickEl(H, H.document.querySelector('[data-rtab="mines"]'));
  await waitFor(() => H.window.__PLAT_NET.roomTab === 'mines' ? true : null, 30000, 'H on mines tab');
  check('前置：房主已在踩地雷分頁', H.window.__PLAT_NET.armed.game === 'mines');

  // 來賓 G 此時才進房 → 必須直接落在踩地雷分頁
  await joinRoom(G, code, '來賓甲');
  const gSync = await waitFor(() => (G.window.__PLAT_NET.armed.game === 'mines' && G.window.__PLAT_NET.roomTab === 'mines') ? true : null, 60000, 'G tab sync');
  check('來賓進房自動同步到踩地雷分頁', !!gSync, 'armed=' + G.window.__PLAT_NET.armed.game + ' roomTab=' + G.window.__PLAT_NET.roomTab);
  const gTabBtn = await waitFor(() => (tabOn(G, 'mines').includes('lob-tab-on') && !tabOn(G, 'sudoku').includes('lob-tab-on')) ? true : null, 30000, 'G tab btn');
  check('來賓分頁列 active 標在踩地雷（不是數獨）', !!gTabBtn, 'mines="' + tabOn(G, 'mines') + '" sudoku="' + tabOn(G, 'sudoku') + '"');

  // 房主改切錦標賽分頁：在房內的 G 要即時跟隨（既有廣播），之後才進房的 G2 也要直接落在錦標賽
  clickEl(H, H.document.querySelector('[data-rtab="tourn"]'));
  const gFollow = await waitFor(() => G.window.__PLAT_NET.roomTab === 'tourn' ? true : null, 30000, 'G follow tourn');
  check('已在房內的來賓即時跟隨切到錦標賽', !!gFollow);
  await joinRoom(G2, code, '來賓乙');
  const g2Sync = await waitFor(() => G2.window.__PLAT_NET.roomTab === 'tourn' ? true : null, 60000, 'G2 tab sync');
  check('後進房的來賓直接落在錦標賽分頁', !!g2Sync, 'roomTab=' + G2.window.__PLAT_NET.roomTab);
  const g2TabBtn = await waitFor(() => tabOn(G2, 'tourn').includes('lob-tab-on') ? true : null, 30000, 'G2 tab btn');
  check('來賓乙分頁列 active 標在錦標賽', !!g2TabBtn, 'tourn="' + tabOn(G2, 'tourn') + '"');

  check('零錯誤（來賓端）', G.errors.length === 0 && G2.errors.length === 0, (G.errors[0] || '') + (G2.errors[0] || ''));
  console.log('\n=== jointab: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
