// 美術燈合作回座（v1.74.0 項5）：來賓中途離開→回座，房主 INIT 的 coopSnap 還原共用盤面（cells+owners），回座後能繼續合作
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, 60000); const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(200); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errs.push(stamp(String(m))));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } resume() { return Promise.resolve(); } }; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
function setSel(w, el, val) { el.value = String(val); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const dbg = (p) => p.window.__PLAT_HOOKS_akari.debug();
const cellEl = (p, i) => p.document.querySelector('#akari-root button[data-cell="' + i + '"]');

(async () => {
  const H = loadPage('H');
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 60000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET && H.window.__PLAT_NET.code; }, 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G');
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 60000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 60000, 'G in room');
  for (const p of [H, G]) { p.window.PLAT_show('akari'); await waitFor(() => !!p.window.__PLAT_HOOKS_akari, 60000, 'preboot'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="akari"]'));
  await waitFor(() => G.window.__PLAT_NET.armed.game === 'akari', 30000, 'armed');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="coop"][data-hub-game="akari"]'));
  await sleep(400);
  setSel(H.window, H.document.querySelector('#lob-step-room [data-hub-key="sizeId"][data-hub-game="akari"]'), 7);
  await sleep(400);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(500);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 60000, 'start');
  clickEl(H, en);
  await waitFor(() => dbg(H).mp.phase === 'playing' && dbg(G).mp.phase === 'playing', 60000, 'playing');
  const sol = dbg(G).puzzle.solution;
  cellEl(G, sol[0]).click();
  await waitFor(() => dbg(H).cells[sol[0]] === 1, 15000, 'sync guest bulb');
  cellEl(H, sol[1]).click();
  await waitFor(() => dbg(G).cells[sol[1]] === 1, 15000, 'sync host bulb');
  await sleep(600);
  const beforeCells = JSON.stringify(dbg(H).cells), beforeOwners = JSON.stringify(dbg(H).owners);
  // 來賓跳出 → 房間頁 → 回到對局
  G.window.__PLAT_NOTIFY('game-exit');
  const btn = await waitFor(() => G.document.querySelector('#hub-resume-btn'), 30000, 'resume btn');
  check('房間頁有「回到對局」鈕', !!btn);
  if (btn) clickEl(G, btn);
  const back = await waitFor(() => dbg(G).mp.phase === 'playing' && dbg(G).mp.mode === 'coop' ? 1 : null, 60000, 'resumed');
  check('回座後 phase=playing、mode=coop', !!back);
  await sleep(800);
  check('回座還原共用盤面（cells 與房主一致）', JSON.stringify(dbg(G).cells) === beforeCells, 'guest=' + JSON.stringify(dbg(G).cells.filter(c => c > 0).length) + ' host=' + JSON.stringify(dbg(H).cells.filter(c => c > 0).length));
  check('回座還原 owners（夥伴標記一致）', JSON.stringify(dbg(G).owners) === beforeOwners);
  // 回座後能繼續合作
  cellEl(G, sol[2]).click();
  const cont = await waitFor(() => dbg(H).cells[sol[2]] === 1 ? 1 : null, 15000, 'post-resume sync');
  check('回座後放燈 → 房主同步', !!cont);
  check('H 頁零錯誤', H.errors.length === 0, H.errors[0] || '');
  check('G 頁零錯誤', G.errors.length === 0, G.errors[0] || '');
  console.log('==== AKARI-COOPRESUME: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
