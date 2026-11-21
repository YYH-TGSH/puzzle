// 美術燈禮物額度防刷（隔離驗證）：道具延遲 180 秒 → 里程碑不發、禮物不送，額度純累積可觀察
// 滿足數字牆 +0.5；拆掉重滿足同一面牆不得重複計（countedWalls）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(250); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
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
function neighborsOf(w, h, i) { const x = i % w, y = Math.floor(i / w), out = []; if (x > 0) out.push(i - 1); if (x < w - 1) out.push(i + 1); if (y > 0) out.push(i - w); if (y < h - 1) out.push(i + w); return out; }
(async () => {
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
  await waitFor(() => G.window.__PLAT_NET.armed.game === 'akari', 30000, 'armed');
  setSel(H.window, H.document.querySelector('#lob-step-room [data-hub-key="sizeId"][data-hub-game="akari"]'), 7);
  setSel(H.window, H.document.querySelector('#lob-step-room [data-hub-key="itemStartTime"][data-hub-game="akari"]'), 180);
  await sleep(500);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(600);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 90000, 'start');
  clickEl(H, en);
  await waitFor(() => dbg(H).mp.phase === 'playing' && dbg(G).mp.phase === 'playing', 90000, 'playing');
  const pz = dbg(G).puzzle, W = pz.w, Hh = pz.h, solSet = new Set(pz.solution);
  const walls = pz.numbers.map(([wi, n]) => ({ wi, n, solNb: neighborsOf(W, Hh, wi).filter(j => solSet.has(j)) })).filter(x => x.n > 0 && x.solNb.length === x.n);
  check('有可滿足的數字牆', walls.length >= 1, 'walls=' + walls.length);
  const w0 = walls[0];
  for (const b of w0.solNb) { if (dbg(G).cells[b] === 0) { cellEl(G, b).click(); await sleep(50); } }
  await waitFor(() => dbg(G).giftCredit >= 0.5, 15000, 'credit 0.5');
  // 放 w0 的燈可能同時滿足鄰接的別面牆（同燈共鄰）——期望值照引擎 correctWallsNow 規則（鄰燈數==數字且全為解答燈）逐面算，不假設只有一面
  const correctWalls = (cells) => pz.numbers.filter(([wi, n]) => { const nb = neighborsOf(W, Hh, wi); let cnt = 0, allSol = true; nb.forEach(j => { if (cells[j] === 1 || cells[j] === 3) { cnt++; if (!solSet.has(j)) allSol = false; } }); return cnt === n && allSol; }).length;
  const expected = 0.5 * correctWalls(dbg(G).cells);
  const c1 = dbg(G).giftCredit;
  check('滿足數字牆 → 額度＝0.5×滿足面數（' + expected + '）', c1 === expected && expected >= 0.5, 'credit=' + c1 + ' expected=' + expected);
  // 拆掉一盞再放回（燈→叉→空→燈）：同一面牆重新滿足
  const b0 = w0.solNb[0];
  cellEl(G, b0).click(); await sleep(150);
  cellEl(G, b0).click(); await sleep(150);
  cellEl(G, b0).click(); await sleep(400);
  check('拆掉重滿足同一面牆 → 額度不變（防重複計）', dbg(G).giftCredit === expected, 'credit=' + dbg(G).giftCredit + ' expected=' + expected);
  check('延遲期間無禮物送出（雙邊無鎖定燈）', dbg(H).cells.every(c => c !== 3) && dbg(G).cells.every(c => c !== 3));
  check('零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  console.log('==== AKARI-CREDIT: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
