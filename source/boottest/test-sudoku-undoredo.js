// 數獨 undo/redo（v1.75.0）：單機快照 redo、多人 brawl 快照 undo/redo、合作逐格只撤自己、
// 防農場實測（里程碑 lastMilestoneRef＋禮物額度 completedRegionsRef：undo 後重放同批正確進度，計帳不增）
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
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const dbg = (p) => p.window.__PLAT_HOOKS_sudoku.debug();
function solveN(board) {
  const ids = Object.keys(board); const N = Math.round(Math.sqrt(ids.length)); const B = N === 4 ? 2 : 3;
  const grid = {}; ids.forEach(id => { grid[id] = board[id]; });
  const ok = (id, v) => { const [x, y] = id.split('-').map(Number); for (const o of ids) { if (o === id) continue; const [ox, oy] = o.split('-').map(Number); if (grid[o] === v && (ox === x || oy === y || (Math.floor(ox / B) === Math.floor(x / B) && Math.floor(oy / B) === Math.floor(y / B)))) return false; } return true; };
  const empties = ids.filter(id => !grid[id]);
  const bt = (i) => { if (i === empties.length) return true; const id = empties[i]; for (let v = 1; v <= N; v++) { if (ok(id, v)) { grid[id] = v; if (bt(i + 1)) return true; grid[id] = 0; } } return false; };
  bt(0); return grid;
}
function boardOf(p, brawl) {
  const d = dbg(p); const cells = brawl ? d.localCells : d.cells; const b = {};
  (cells || []).forEach(c => { b[c.id] = c.value ? parseInt(c.value, 10) : 0; }); // 格值是字串（chars），一律轉數值（wintime 前例）
  return b;
}
const cellValDbg = (p, id, brawl) => { const d = dbg(p); const cells = brawl ? d.localCells : d.cells; const c = (cells || []).find(c => c.id === id); return c ? (c.value ? parseInt(c.value, 10) : 0) : -1; };
const numBtn = (p, v) => [...p.document.querySelectorAll('#view-sudoku button')].find(b => { const t = (b.textContent || '').trim(); return t[0] === String(v) && !b.disabled; });
async function fillCell(p, id, v, brawl) {
  const mode = p.window.localStorage.getItem('sudoku_input_mode') || 'num'; // 遊戲預設數字先行（'num'），照 wintime 套件的前例分支
  for (let a = 0; a < 6; a++) {
    if (cellValDbg(p, id, brawl) === v) return true;
    const g = p.document.querySelector('#view-sudoku g[id="cell-' + id + '"]');
    if (!g) return false;
    if (mode === 'num') { const btn = numBtn(p, v); if (btn) clickEl(p, btn); await sleep(300); const g2 = p.document.querySelector('#view-sudoku g[id="cell-' + id + '"]'); clickEl(p, g2 || g); } // 選字後盤面 re-render 可能換節點，點格前重查（probe 實證）
    else { clickEl(p, g); await sleep(300); const btn = numBtn(p, v); if (btn) clickEl(p, btn); }
    const okv = await waitFor(() => cellValDbg(p, id, brawl) === v ? true : null, 1500, 'fill ' + id);
    if (okv) return true;
  }
  return cellValDbg(p, id, brawl) === v;
}
async function makeRoom() {
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
  for (const p of [H, G]) { p.window.PLAT_show('sudoku'); await waitFor(() => !!p.window.__PLAT_HOOKS_sudoku, 60000, 'preboot'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await waitFor(() => G.window.__PLAT_NET.armed.game === 'sudoku', 30000, 'armed');
  return { H, G };
}
async function startMatch(H, G, mode) {
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="' + mode + '"][data-hub-game="sudoku"]'));
  await sleep(500);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(500);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 60000, 'start');
  clickEl(H, en);
  return waitFor(() => dbg(H).phase === 'playing' && dbg(G).phase === 'playing' ? 1 : null, 60000, 'playing');
}

(async () => {
  // ===== S1 單機 =====
  const A = loadPage('A');
  await waitFor(() => typeof A.window.PLAT_show === 'function' && A.window.PlatDock, 60000, 'A shell');
  A.window.PLAT_show('sudoku');
  await waitFor(() => !!A.window.__PLAT_HOOKS_sudoku, 60000, 'A hooks');
  clickEl(A, A.document.querySelector('#sudoku-root [data-ph="solo"]'));
  const startBtn = await waitFor(() => A.document.querySelector('#plat-setup [data-pse="start"]'), 30000, 'setup');
  clickEl(A, startBtn);
  const soloReady = await waitFor(() => dbg(A).cells && dbg(A).cells.length >= 81 ? 1 : null, 60000, 'solo board');
  check('單機開局', !!soloReady);
  const solA = solveN(boardOf(A, false));
  const emptA = Object.keys(solA).filter(id => !boardOf(A, false)[id]);
  const cA = emptA[0], cB = emptA[1];
  check('單機填格', await fillCell(A, cA, solA[cA], false));
  check('單機 undo：格子清空', (clickEl(A, A.document.querySelector('[data-sudoku-undo]')), await waitFor(() => cellValDbg(A, cA, false) === 0 ? 1 : null, 8000, 'undo')) ? true : false);
  check('單機 undo 後 hist=0/future=1', dbg(A).hist === 0 && dbg(A).future === 1, 'hist=' + dbg(A).hist + ' future=' + dbg(A).future);
  check('單機 redo：格子回來', (clickEl(A, A.document.querySelector('[data-sudoku-redo]')), await waitFor(() => cellValDbg(A, cA, false) === solA[cA] ? 1 : null, 8000, 'redo')) ? true : false);
  await fillCell(A, cB, solA[cB], false);
  check('新動作清 redo（future=0、redo 鈕 disabled）', dbg(A).future === 0 && A.document.querySelector('[data-sudoku-redo]').disabled);
  check('A 頁零錯誤', A.errors.length === 0, A.errors[0] || '');

  // ===== S2 合作 =====
  const { H, G } = await makeRoom();
  const playing2 = await startMatch(H, G, 'coop');
  check('合作開局 playing', !!playing2);
  check('合作 mode（非 brawl）', dbg(G).brawl === false);
  const sol2 = solveN(boardOf(G, false));
  const empt2 = Object.keys(sol2).filter(id => !boardOf(G, false)[id]);
  const gA = empt2[0], gB = empt2[1];
  await fillCell(G, gA, sol2[gA], false);
  const seenH = await waitFor(() => cellValDbg(H, gA, false) === sol2[gA] ? 1 : null, 15000, 'host sees guest fill');
  check('合作：來賓填格 → 房主共用盤同步', !!seenH);
  await fillCell(H, gB, sol2[gB], false);
  await waitFor(() => cellValDbg(G, gB, false) === sol2[gB] ? 1 : null, 15000, 'guest sees host fill');
  clickEl(G, G.document.querySelector('[data-sudoku-undo]'));
  const un2 = await waitFor(() => cellValDbg(G, gA, false) === 0 && cellValDbg(H, gA, false) === 0 ? 1 : null, 15000, 'coop undo sync');
  check('合作 undo：只撤自己的格（兩頁同步）', !!un2);
  check('合作 undo：夥伴的格不動', cellValDbg(G, gB, false) === sol2[gB]);
  clickEl(G, G.document.querySelector('[data-sudoku-redo]'));
  const re2 = await waitFor(() => cellValDbg(H, gA, false) === sol2[gA] ? 1 : null, 15000, 'coop redo sync');
  check('合作 redo：格子回來（兩頁同步）', !!re2);
  // 夥伴改過 → undo 跳過：房主把來賓的格改成別的值
  const wrong = (sol2[gA] % 9) + 1;
  await fillCell(H, gA, wrong, false);
  await waitFor(() => cellValDbg(G, gA, false) === wrong ? 1 : null, 15000, 'host overwrote');
  clickEl(G, G.document.querySelector('[data-sudoku-undo]'));
  await sleep(1500);
  check('合作 undo：被夥伴改過的格跳過（維持夥伴的值）', cellValDbg(G, gA, false) === wrong && cellValDbg(H, gA, false) === wrong);
  check('S2 雙邊零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));

  // ===== S3 大亂鬥＋防農場 =====
  const R = await makeRoom();
  const playing3 = await startMatch(R.H, R.G, 'brawl');
  check('大亂鬥開局 playing', !!playing3);
  check('大亂鬥 mode', dbg(R.G).brawl === true);
  const sol3 = solveN(boardOf(R.G, true));
  const gUid = R.G.window.localStorage.getItem('plat_uid_sudoku');
  const fills = []; // {id, v} 依序重放用
  // 先填到里程碑 ≥1
  const empt3 = Object.keys(sol3).filter(id => !boardOf(R.G, true)[id]);
  let mi = 0;
  while (dbg(R.G).milestone < 1 && mi < empt3.length) { const id = empt3[mi++]; await fillCell(R.G, id, sol3[id], true); fills.push({ id, v: sol3[id] }); }
  check('大亂鬥：填正確格跨 5% 里程碑', dbg(R.G).milestone >= 1, 'milestone=' + dbg(R.G).milestone + ' fills=' + fills.length);
  // 補滿第 0 列（y=0）的空格 → 禮物額度（列完成 +0.5 起）
  const row0 = empt3.filter(id => id.split('-')[1] === '0' && !fills.some(f => f.id === id));
  for (const id of row0) { await fillCell(R.G, id, sol3[id], true); fills.push({ id, v: sol3[id] }); }
  await sleep(800);
  const M1 = dbg(R.G).milestone, C1 = dbg(R.G).giftCredit;
  check('大亂鬥：完成一列後禮物額度 ≥0.5', C1 >= 0.5, 'credit=' + C1);
  const progPeak = (dbg(R.H).ghostProgress || {})[gUid] || 0;
  check('房主端看到來賓進度 >0', progPeak > 0, 'prog=' + progPeak);
  // undo 全部 → 進度歸零
  let guard = 0;
  while (dbg(R.G).hist > 0 && guard++ < 40) { clickEl(R.G, R.G.document.querySelector('[data-sudoku-undo]')); await sleep(250); }
  const zeroed = await waitFor(() => ((dbg(R.H).ghostProgress || {})[gUid] || 0) === 0 ? 1 : null, 30000, 'progress zeroed');
  const gRemain = (dbg(R.G).localCells || []).filter(c => c.value && !c.isGiven && !c.isSystemRevealed).length;
  check('大亂鬥 undo 全部：房主端來賓進度歸零（進度隨還原同步）', !!zeroed, 'hostProg=' + ((dbg(R.H).ghostProgress || {})[gUid]) + ' guestRemain=' + gRemain + ' guestHist=' + dbg(R.G).hist);
  check('undo 後計帳不退（里程碑/額度維持高水位）', dbg(R.G).milestone === M1 && Math.abs(dbg(R.G).giftCredit - C1) < 0.001, 'M=' + dbg(R.G).milestone + '/' + M1 + ' C=' + dbg(R.G).giftCredit + '/' + C1);
  // 重放同一批 → 計帳不增（防農場核心斷言）
  for (const f of fills) await fillCell(R.G, f.id, f.v, true);
  await sleep(800);
  check('防農場：重放同批正確格，里程碑不增', dbg(R.G).milestone === M1, 'M=' + dbg(R.G).milestone + ' vs ' + M1);
  check('防農場：重放同批正確格，禮物額度不增', Math.abs(dbg(R.G).giftCredit - C1) < 0.001, 'C=' + dbg(R.G).giftCredit + ' vs ' + C1);
  const progBack = await waitFor(() => ((dbg(R.H).ghostProgress || {})[gUid] || 0) === progPeak ? 1 : null, 20000, 'progress restored');
  check('重放後房主端進度回到高峰', !!progBack);
  check('S3 雙邊零錯誤', R.H.errors.length === 0 && R.G.errors.length === 0, (R.H.errors[0] || '') + ' | ' + (R.G.errors[0] || ''));
  console.log('==== SUDOKU-UNDOREDO: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
