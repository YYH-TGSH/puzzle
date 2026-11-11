// S6 效能量測（jsdom、真 bundle）：①數獨 16 困難/普通「點開始→盤面可玩」端到端 ④三款大盤節點數＋單次操作 handler 同步耗時
// 結果逐段 checkpoint 寫入 perf-results.json。jsdom 慢於真機——數字只作相對熱點判讀。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const OUT = __dirname + '/perf-results.json';
let R = { meta: { item: 'S6', bundleVersion: 'v1.65.9', startedAt: new Date().toISOString(), env: 'jsdom (相對判讀用、非真機絕對值)' } };
try { const prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); if (prev && prev.meta && prev.meta.bundleVersion === 'v1.65.9') R = prev; } catch (e) {}
function save() { R.meta.updatedAt = new Date().toISOString(); fs.writeFileSync(OUT, JSON.stringify(R, null, 1)); }
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('../mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(200); } console.log('  (timeout: ' + label + ')'); return null; }
function loadPage(seedLS) {
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {}); vc.on('error', () => {});
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = {}; w.scrollTo = () => {}; if (seedLS) for (const k in seedLS) try { w.localStorage.setItem(k, seedLS[k]); } catch (e) {}
      w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } resume() { return Promise.resolve(); } }; } });
  return { window: dom.window, document: dom.window.document };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
const byText = (p, root, txt) => [...root.querySelectorAll('button')].find(b => (b.textContent || '').includes(txt)) || null;
async function shellReady(p) { return waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.PlatDock) ? 1 : null, 120000, 'shell'); }
async function sudokuRun(diffLabel) {
  const p = loadPage();
  await shellReady(p);
  p.window.PLAT_show('sudoku');
  const solo = await waitFor(() => byText(p, p.document.querySelector('#view-sudoku'), '單機挑戰'), 60000, 'sudoku main');
  clickEl(p, solo); await sleep(800);
  clickEl(p, byText(p, p.document.querySelector('#view-sudoku'), '16x16')); await sleep(300);
  clickEl(p, [...p.document.querySelectorAll('#view-sudoku [data-seg="sudoku-diff"] button')].find(b => (b.textContent || '').includes(diffLabel))); await sleep(300);
  const startBtn = byText(p, p.document.querySelector('#view-sudoku'), '開始挑戰');
  const t0 = Date.now();
  clickEl(p, startBtn);
  const ok = await waitFor(() => p.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length === 256 ? 1 : null, 120000, 'board 256');
  const dt = Date.now() - t0;
  const nodes = p.document.querySelector('#view-sudoku').querySelectorAll('*').length;
  // handler 代理：數字先行填一格（找第一個空格、點數字盤同值鈕再點格——量測點格 dispatch 同步耗時）
  let handlerMs = null;
  try {
    const cells = [...p.document.querySelectorAll('#view-sudoku g[id^="cell-"]')];
    const empty = cells.find(g => !(g.textContent || '').trim());
    if (empty) {
      const tev = new p.window.MouseEvent('pointerdown', { bubbles: true });
      const tH = performance.now(); empty.dispatchEvent(tev); handlerMs = +(performance.now() - tH).toFixed(1);
    }
  } catch (e) {}
  p.window.close();
  return { ms: ok ? dt : null, nodes, handlerMs };
}
(async () => {
  const stats = a => { const v = a.filter(x => x != null); if (!v.length) return null; const s = [...v].sort((x, y) => x - y); return { runs: v, mean: Math.round(v.reduce((x, y) => x + y, 0) / v.length), min: s[0], max: s[s.length - 1] }; };
  if (!R.sudoku16) {
    R.sudoku16 = {};
    for (const diff of ['困難', '普通']) {
      const rs = [];
      for (let i = 0; i < 3; i++) { const r = await sudokuRun(diff); rs.push(r); console.log('sudoku16', diff, JSON.stringify(r)); }
      R.sudoku16[diff] = { e2e: stats(rs.map(r => r.ms)), nodes: rs[0] && rs[0].nodes, cellTapHandlerMs: rs.map(r => r.handlerMs) };
      save();
    }
  }
  if (!R.hashi20) {
    const p = loadPage();
    await shellReady(p);
    p.window.PLAT_show('hashi');
    const solo = await waitFor(() => byText(p, p.document.querySelector('#view-hashi'), '單機挑戰'), 60000, 'hashi main');
    clickEl(p, solo); await sleep(800);
    const t0 = Date.now();
    clickEl(p, byText(p, p.document.querySelector('#view-hashi'), '史詩'));
    const ok = await waitFor(() => p.document.querySelectorAll('#view-hashi circle').length > 150 ? p.document.querySelectorAll('#view-hashi circle').length : null, 120000, 'hashi islands');
    const dt = Date.now() - t0;
    const nodes = p.document.querySelector('#view-hashi').querySelectorAll('*').length;
    let tapMs = null;
    try { const c = p.document.querySelector('#view-hashi circle'); const g = c && c.closest('g'); const tH = performance.now(); (g || c).dispatchEvent(new p.window.MouseEvent('pointerdown', { bubbles: true })); tapMs = +(performance.now() - tH).toFixed(1); } catch (e) {}
    R.hashi20 = { e2eMs: ok ? dt : null, islandCircles: ok, approxIslands: ok ? Math.round(ok / 3) : null, nodes, islandTapHandlerMs: tapMs };
    save(); console.log('hashi20', JSON.stringify(R.hashi20));
    p.window.close();
  }
  if (!R.mines30x24) {
    const env = JSON.stringify({ __psv: 1, t: Date.now(), data: { w: 30, h: 24, mines: 150 } });
    const p = loadPage({ mines_custom_cfg: env });
    await shellReady(p);
    p.window.PLAT_show('mines');
    const solo = await waitFor(() => byText(p, p.document.querySelector('#view-mines'), '單機挑戰'), 60000, 'mines main');
    clickEl(p, solo); await sleep(1000);
    const cust = byText(p, p.document.querySelector('#view-mines'), '自訂');
    if (cust) { clickEl(p, cust); await sleep(600); }
    const startB = byText(p, p.document.querySelector('#view-mines'), '開始');
    const t0 = Date.now();
    if (startB) clickEl(p, startB);
    const ok = await waitFor(() => p.document.querySelectorAll('#view-mines [data-cell]').length >= 700 ? p.document.querySelectorAll('#view-mines [data-cell]').length : null, 120000, 'mines cells');
    const dt = Date.now() - t0;
    const nodes = p.document.querySelector('#view-mines').querySelectorAll('*').length;
    let revealMs = null;
    try { const c = p.document.querySelector('#view-mines [data-cell="360"]') || p.document.querySelector('#view-mines [data-cell]'); const tH = performance.now(); c.dispatchEvent(new p.window.MouseEvent('pointerdown', { bubbles: true })); c.dispatchEvent(new p.window.MouseEvent('pointerup', { bubbles: true })); revealMs = +(performance.now() - tH).toFixed(1); } catch (e) {}
    R.mines30x24 = { e2eMs: ok ? dt : null, cells: ok, nodes, revealHandlerMs: revealMs };
    save(); console.log('mines30x24', JSON.stringify(R.mines30x24));
    p.window.close();
  }
  R.meta.doneAt = new Date().toISOString(); save();
  console.log('PERF-E2E DONE');
  process.exit(0);
})().catch(e => { console.error('FATAL', e); save(); process.exit(2); });
