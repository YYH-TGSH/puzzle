// 美術燈回座接續：來賓對局中跳出（game-exit）→ 房間頁「回到對局」→ 回座後盤面/進度還原、可繼續玩
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
  const itChk = H.document.querySelector('#lob-step-room [data-hub-key="allowItems"][data-hub-game="akari"]');
  if (itChk && itChk.checked) itChk.click();
  await sleep(500);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(600);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 90000, 'start');
  clickEl(H, en);
  await waitFor(() => dbg(G).mp.phase === 'playing', 90000, 'playing');
  // 來賓先放 3 盞解答燈＋1 個叉
  const sol = dbg(G).puzzle.solution;
  for (let k = 0; k < 3; k++) { cellEl(G, sol[k]).click(); await sleep(60); }
  const crossCell = dbg(G).puzzle.walls.length ? sol[3] : null;
  const freeCell = (() => { const d = dbg(G); const ws = new Set(d.puzzle.walls); const ss = new Set(d.puzzle.solution); for (let i = 0; i < d.cells.length; i++) if (!ws.has(i) && !ss.has(i) && d.cells[i] === 0) return i; return -1; })();
  if (freeCell >= 0) { // 切塗叉模式畫一個叉
    const pb = G.document.querySelector('#view-akari [data-pb="mode-press"]'); if (pb) { pb.click(); await sleep(250); }
    cellEl(G, freeCell).click(); await sleep(150);
    const pb2 = G.document.querySelector('#view-akari [data-pb="mode-press"]'); if (pb2) { pb2.click(); await sleep(200); }
  }
  await sleep(1200); // 等 STATE 節流把盤面送到房主 god（快照備援）＋本地存檔落盤
  const before = dbg(G).cells.slice();
  const bulbsBefore = before.filter(c => c === 1).length;
  check('離開前有進度（燈 ≥3）', bulbsBefore >= 3, 'bulbs=' + bulbsBefore);
  // 跳出 → 房間頁 → 回到對局
  G.window.__PLAT_NOTIFY('game-exit');
  const btn = await waitFor(() => G.document.querySelector('#hub-resume-btn'), 30000, 'resume btn');
  check('房間頁有「回到對局」鈕', !!btn);
  if (btn) clickEl(G, btn);
  const back = await waitFor(() => dbg(G).mp.phase === 'playing' ? 1 : null, 60000, 'resumed playing');
  check('回座後 phase=playing', !!back);
  await sleep(800);
  const after = dbg(G).cells.slice();
  check('盤面還原（離開前的燈/叉都在）', JSON.stringify(after) === JSON.stringify(before), 'before bulbs=' + bulbsBefore + ' after=' + JSON.stringify(after.filter(c => c === 1).length));
  // 能繼續玩：再放一盞
  const nxt = sol.find(i => dbg(G).cells[i] === 0);
  if (nxt != null) { cellEl(G, nxt).click(); await sleep(200); check('回座後能繼續放燈', dbg(G).cells[nxt] === 1); }
  else check('回座後能繼續放燈', false, 'no free solution cell');
  check('零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  console.log('==== AKARI-RESUME: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
