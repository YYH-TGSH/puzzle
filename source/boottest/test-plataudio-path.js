// PlatAudio 路徑級測試（v1.65.3）：嚴格 iOS 語意 AudioContext mock——ctx 建立即 suspended、resume 只在手勢派發中生效、
// 中斷態 'interrupted' 需被明確 resume；排程當下非 running 的音列為 dead（不發聲）。
// 驅動真實 UI 路徑（pointer 事件→handler→applyCharToCell/架橋/挖雷），斷言 live oscillator：
//   A 數獨單機數字先行 place｜B 數獨單機格子先行 place｜C 衝突 error｜D 4x4 完賽 complete｜E iOS 中斷後恢復（本批修復點）
//   F 數橋單機架橋 place｜G 地雷單機挖開 place｜H 數獨多人（brawl）格子先行 place
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(250); } console.log('  (timeout: ' + label + ')'); return null; }
function mockACStrict(w) {
  w.__AC = { instances: 0, ctxs: [], live: [], dead: [] };
  class P { constructor() { this.value = 0; this.calls = []; } setValueAtTime(v, t) { this.calls.push(['set', v, t]); this.value = v; } linearRampToValueAtTime(v, t) { this.calls.push(['lin', v, t]); } exponentialRampToValueAtTime(v, t) { this.calls.push(['exp', v, t]); } }
  class O { constructor(ctx) { this._ctx = ctx; this.type = ''; this.frequency = new P(); } connect() {} start(t) { this.startedAt = t; (this._ctx.state === 'running' ? w.__AC.live : w.__AC.dead).push(this); } stop() {} }
  class G { constructor() { this.gain = new P(); } connect() {} }
  w.AudioContext = class { constructor() { w.__AC.instances++; this.state = 'suspended'; this.currentTime = 0; this.destination = {}; w.__AC.ctxs.push(this); } createOscillator() { return new O(this); } createGain() { return new G(); } resume() { if (w.__IN_GESTURE) this.state = 'running'; return Promise.resolve(); } };
}
function loadPage(reg, seed) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.__SHARED_REG__ = reg; w.scrollTo = () => {}; mockACStrict(w);
      if (seed) for (const k in seed) { try { w.localStorage.setItem(k, seed[k]); } catch (e) {} }
      if (w.SVGSVGElement) {
        w.SVGSVGElement.prototype.createSVGPoint = function () { return { x: 0, y: 0, matrixTransform: function () { return { x: this.x, y: this.y }; } }; };
        w.SVGSVGElement.prototype.getScreenCTM = function () { return { inverse: function () { return {}; } }; };
      }
      w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); });
    } });
  return { window: dom.window, document: dom.window.document, errors: errs };
}
// 手勢派發：__IN_GESTURE 包住 dispatch（mock resume 只在此窗口生效，模擬 WebKit 使用者啟用）
function disp(p, el, ev) { if (!el) return; p.window.__IN_GESTURE = true; try { el.dispatchEvent(ev); } finally { p.window.__IN_GESTURE = false; } }
function pev(p, el, type, x, y, buttons) {
  if (!el) return;
  const ev = new p.window.MouseEvent(type, { bubbles: true, clientX: x || 0, clientY: y || 0, button: 0, buttons: buttons != null ? buttons : (type === 'pointerup' ? 0 : 1) });
  Object.defineProperty(ev, 'isPrimary', { value: true });
  Object.defineProperty(ev, 'pointerType', { value: 'touch' });
  Object.defineProperty(ev, 'pointerId', { value: 7 });
  disp(p, el, ev);
}
const clickEl = (p, el) => { if (el) disp(p, el, new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function readBoard(D) { const cells = {}; D.querySelectorAll('#view-sudoku g[id^="cell-"]').forEach(g => { const id = g.getAttribute('id').slice(5); const t = (g.textContent || '').trim(); cells[id] = t ? parseInt(t, 10) : 0; }); return cells; }
function solveN(board) {
  const ids = Object.keys(board); const N = Math.round(Math.sqrt(ids.length)); const B = N === 4 ? 2 : Math.round(Math.sqrt(N));
  const grid = {}; ids.forEach(id => { grid[id] = board[id]; });
  const ok = (id, v) => { const [x, y] = id.split('-').map(Number); for (const o of ids) { if (o === id) continue; const [ox, oy] = o.split('-').map(Number); if (grid[o] === v && (ox === x || oy === y || (Math.floor(ox / B) === Math.floor(x / B) && Math.floor(oy / B) === Math.floor(y / B)))) return false; } return true; };
  const empties = ids.filter(id => !grid[id]);
  const bt = (i) => { if (i === empties.length) return true; const id = empties[i]; for (let v = 1; v <= N; v++) { if (ok(id, v)) { grid[id] = v; if (bt(i + 1)) return true; grid[id] = 0; } } return false; };
  bt(0); return grid;
}
const cellCenter = (id) => { const [x, y] = id.split('-').map(Number); return [50 + x * 60, 50 + y * 60]; };
const cellEl = (p, id) => p.document.querySelector('#view-sudoku g[id="cell-' + id + '"]');
const padBtn = (p, d) => [...p.document.querySelectorAll('#view-sudoku button')].find(b => (b.textContent || '').trim() === String(d) && (b.className || '').includes('key-btn')) || [...p.document.querySelectorAll('#view-sudoku button')].find(b => (b.textContent || '').trim() === String(d));
async function tapCell(p, id) { const [cx, cy] = cellCenter(id); const el = cellEl(p, id); pev(p, el, 'pointerdown', cx, cy, 1); await sleep(40); pev(p, el, 'pointerup', cx, cy, 0); await sleep(120); }
async function tapPad(p, d) { const b = padBtn(p, d); pev(p, b, 'pointerdown', 100, 100, 1); await sleep(40); pev(p, b, 'pointerup', 100, 100, 0); await sleep(120); }
const liveFreqs = (p) => p.window.__AC.live.map(o => o.frequency.calls[0] && o.frequency.calls[0][1]);
async function startSudokuSolo(p, sizeText, diffText) {
  p.window.PLAT_show('sudoku');
  const view = () => p.document.querySelector('#view-sudoku');
  const soloBtn = await waitFor(() => [...view().querySelectorAll('button')].find(b => (b.textContent || '').includes('單機挑戰')) || null, 60000, 'sudoku main');
  clickEl(p, soloBtn); await sleep(600);
  if (sizeText) { clickEl(p, [...view().querySelectorAll('button')].find(b => (b.textContent || '').includes(sizeText))); await sleep(300); }
  if (diffText) { clickEl(p, [...view().querySelectorAll('button')].find(b => (b.textContent || '').includes(diffText))); await sleep(300); }
  clickEl(p, [...view().querySelectorAll('button')].find(b => (b.textContent || '').includes('開始挑戰')));
  const okCells = await waitFor(() => p.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? true : null, 60000, 'cells');
  await sleep(800);
  return !!okCells;
}
(async () => {
  // ===== A/B/C/E：數獨單機（同一頁跑 A 數字先行 → C 衝突 → E 中斷恢復） =====
  {
    const reg = {};
    const p = loadPage(reg, null);
    await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.PlatDock) ? 1 : null, 60000, 'shell A');
    const started = await startSudokuSolo(p, '9x9', '簡單');
    check('A 前置：數獨單機 9x9 開局', started);
    const board = readBoard(p.document); const sol = solveN(board);
    const empties = Object.keys(board).filter(id => !board[id]);
    const E1 = empties[0];
    // 數字先行（預設 num）：點數字鍵選數字 → 點格填入
    await tapPad(p, sol[E1]);
    await tapCell(p, E1);
    check('A 數字先行填入 → place 有 live oscillator（880Hz）', liveFreqs(p).includes(880), 'live=' + JSON.stringify(liveFreqs(p)) + ' dead=' + p.window.__AC.dead.length);
    check('A 填入後盤面已落子', readBoard(p.document)[E1] === sol[E1]);
    // C 衝突：找一格空格，其列已有某個 given 數字 D，填 D → error
    let clashCell = null, clashDigit = null;
    for (const id of empties.slice(1)) {
      const [x, y] = id.split('-').map(Number);
      const rowDigits = Object.keys(board).filter(o => Number(o.split('-')[1]) === y && board[o] !== 0).map(o => board[o]);
      const d = rowDigits.find(v => v !== sol[id]);
      if (d) { clashCell = id; clashDigit = d; break; }
    }
    check('C 前置：找到可衝突的格與數字', !!clashCell, clashCell + '/' + clashDigit);
    if (clashCell) {
      const before = liveFreqs(p).filter(f => f === 170).length;
      await tapPad(p, clashDigit);
      await tapCell(p, clashCell);
      check('C 衝突填入 → error 有 live oscillator（170Hz）', liveFreqs(p).filter(f => f === 170).length > before, 'live170=' + liveFreqs(p).filter(f => f === 170).length);
    }
    // E iOS 中斷恢復：把所有 ctx 打入 interrupted → 下一個填入（其 pointerdown 即手勢）必須恢復並出聲、且不得排死音
    const E2 = empties.find(id => id !== E1 && id !== clashCell && !readBoard(p.document)[id]);
    p.window.__AC.ctxs.forEach(c => { c.state = 'interrupted'; });
    const liveBefore = p.window.__AC.live.length, deadBefore = p.window.__AC.dead.length;
    await tapPad(p, sol[E2]);
    await tapCell(p, E2);
    check('E 中斷（interrupted）後填入 → 恢復出聲（live 新增）', p.window.__AC.live.length > liveBefore, 'live ' + liveBefore + '->' + p.window.__AC.live.length);
    check('E 中斷後填入 → 無 dead 排程', p.window.__AC.dead.length === deadBefore, 'dead ' + deadBefore + '->' + p.window.__AC.dead.length);
    check('A/C/E 全程零錯誤', p.errors.length === 0, p.errors.slice(0, 2).join(' | '));
  }
  // ===== B：數獨單機格子先行 =====
  {
    const reg = {};
    const p = loadPage(reg, { sudoku_input_mode: 'cell' });
    await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.PlatDock) ? 1 : null, 60000, 'shell B');
    const started = await startSudokuSolo(p, '9x9', '簡單');
    check('B 前置：數獨單機（格子先行）開局', started);
    const board = readBoard(p.document); const sol = solveN(board);
    const E1 = Object.keys(board).find(id => !board[id]);
    await tapCell(p, E1);           // 先點格選格
    await tapPad(p, sol[E1]);       // 再點數字鍵寫入
    check('B 格子先行填入 → place 有 live oscillator', liveFreqs(p).includes(880), 'live=' + JSON.stringify(liveFreqs(p)));
    check('B 填入後盤面已落子', readBoard(p.document)[E1] === sol[E1]);
  }
  // ===== D：4x4 完賽 complete =====
  {
    const reg = {};
    const p = loadPage(reg, { sudoku_input_mode: 'cell' });
    await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.PlatDock) ? 1 : null, 60000, 'shell D');
    const started = await startSudokuSolo(p, '4x4', '簡單');
    check('D 前置：4x4 開局', started);
    const sol = solveN(readBoard(p.document));
    for (let passN = 0; passN < 4; passN++) {
      const cur = readBoard(p.document);
      const todo = Object.keys(cur).filter(id => !cur[id]);
      if (!todo.length) break;
      for (const id of todo) { await tapCell(p, id); await tapPad(p, sol[id]); }
      await sleep(300);
    }
    await sleep(600);
    const lf = liveFreqs(p);
    check('D 完賽 → complete 琶音 live（523/659/784/1046）', [523, 659, 784, 1046].every(f => lf.includes(f)), 'live=' + JSON.stringify(lf));
  }
  // ===== F：數橋單機架橋 place（快拖路徑） =====
  {
    const reg = {};
    const p = loadPage(reg, null);
    await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.PlatDock) ? 1 : null, 60000, 'shell F');
    p.window.PLAT_show('hashi');
    const view = () => p.document.querySelector('#view-hashi');
    const soloBtn = await waitFor(() => [...view().querySelectorAll('button')].find(b => (b.textContent || '').includes('單機挑戰')) || null, 60000, 'hashi main');
    clickEl(p, soloBtn); await sleep(600);
    clickEl(p, [...view().querySelectorAll('button')].find(b => (b.textContent || '').includes('10x10')));
    const board = await waitFor(() => { const s = [...view().querySelectorAll('svg')].find(x => [...x.querySelectorAll('text')].some(t => /^[1-8]$/.test((t.textContent || '').trim()))); return s || null; }, 60000, 'hashi board');
    check('F 前置：數橋盤面', !!board);
    if (board) {
      board.createSVGPoint = () => { const pt = { x: 0, y: 0, matrixTransform: () => ({ x: pt.x, y: pt.y }) }; return pt; };
      board.getScreenCTM = () => ({ inverse: () => ({}) });
      const isl = []; board.querySelectorAll('g').forEach(g => { const t = [...g.querySelectorAll('text')].find(x => /^[1-8]$/.test((x.textContent || '').trim())); if (t) isl.push({ g, cx: parseFloat(t.getAttribute('x')), cy: parseFloat(t.getAttribute('y')) - 2 }); });
      const rows = {}; isl.forEach(i => { const k = Math.round(i.cy); (rows[k] = rows[k] || []).push(i); });
      let pair = null; for (const k of Object.keys(rows)) { const r = rows[k].sort((a, b) => a.cx - b.cx); if (r.length > 1) { pair = [r[0], r[1]]; break; } }
      const liveBefore = p.window.__AC.live.length;
      pev(p, pair[0].g, 'pointerdown', pair[0].cx, pair[0].cy, 1);
      pev(p, board, 'pointermove', (pair[0].cx + pair[1].cx) / 2, pair[0].cy, 1);
      pev(p, board, 'pointermove', pair[1].cx, pair[1].cy, 1);
      pev(p, board, 'pointerup', pair[1].cx, pair[1].cy, 0);
      await sleep(400);
      check('F 數橋快拖架橋 → place 有 live oscillator', p.window.__AC.live.length > liveBefore, 'live ' + liveBefore + '->' + p.window.__AC.live.length);
    }
  }
  // ===== G：地雷單機挖開 place =====
  {
    const reg = {};
    const p = loadPage(reg, null);
    await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.PlatDock) ? 1 : null, 60000, 'shell G');
    p.window.PLAT_show('mines');
    const view = () => p.document.querySelector('#view-mines');
    const soloBtn = await waitFor(() => [...view().querySelectorAll('button')].find(b => (b.textContent || '').includes('單機挑戰')) || null, 60000, 'mines main');
    clickEl(p, soloBtn); await sleep(600);
    const lvBtn = [...view().querySelectorAll('button')].find(b => /9x9|9×9|簡單|初級/.test(b.textContent || ''));
    if (lvBtn) { clickEl(p, lvBtn); await sleep(600); }
    const dbg = await waitFor(() => { const h = p.window.__PLAT_HOOKS_mines; return h && h.debug ? h.debug() : null; }, 60000, 'mines debug');
    check('G 前置：地雷開局', !!dbg);
    if (dbg) {
      const cells = [...view().querySelectorAll('button')].filter(b => /cell|格/.test(b.className || '') || b.dataset.idx !== undefined);
      const allBtns = cells.length ? cells : [...view().querySelectorAll('[data-cell], button')];
      const target = allBtns[40] || allBtns[0];
      const liveBefore = p.window.__AC.live.length;
      pev(p, target, 'pointerdown', 10, 10, 1); await sleep(40);
      pev(p, target, 'pointerup', 10, 10, 0); await sleep(400);
      check('G 地雷挖開 → place 有 live oscillator', p.window.__AC.live.length > liveBefore, 'live ' + liveBefore + '->' + p.window.__AC.live.length);
    }
  }
  // ===== H：數獨多人（brawl）格子先行 place——房主頁 =====
  {
    const reg = {};
    const H = loadPage(reg, { sudoku_input_mode: 'cell' }), G = loadPage(reg, { sudoku_input_mode: 'cell' });
    const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
    const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
    for (const p of [H, G]) await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? 1 : null, 90000, 'H shell');
    click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
    H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
    await waitFor(() => hubRoom(H), 60000, 'H room');
    const code = H.window.__PLAT_NET.code;
    click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
    G.document.querySelector('#lob-name').value = '來賓乙'; G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
    await waitFor(() => hubRoom(G), 60000, 'G room');
    await waitFor(() => H.window.__PLAT_NET.roster.length === 2 ? 1 : null, 30000, 'roster 2');
    clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]')); await sleep(500);
    clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="brawl"]')); await sleep(600);
    clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
    clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
    const startBtn = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return b && !b.disabled ? b : null; }, 30000, 'start unlocked');
    check('H 前置：房間開局流程', !!startBtn);
    if (startBtn) {
      clickEl(H, startBtn);
      const inGame = await waitFor(() => H.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? 1 : null, 90000, 'H cells');
      await waitFor(() => { const cd = H.document.querySelector('#plat-countdown'); return !cd || cd.style.display !== 'flex' ? 1 : null; }, 60000, 'H countdown over');
      await sleep(1500);
      check('H 前置：多人盤面', !!inGame);
      const board = readBoard(H.document); const sol = solveN(board);
      const E1 = Object.keys(board).find(id => !board[id]);
      // 倒數期間填入會被 matchPhase 閘門吞掉：重試直到 live 新增（上限 ~15s）
      let filled = false;
      for (let attempt = 0; attempt < 12 && !filled; attempt++) {
        const liveBefore = H.window.__AC.live.length;
        await tapCell(H, E1);
        await tapPad(H, sol[E1]);
        await sleep(500);
        if (H.window.__AC.live.length > liveBefore && readBoard(H.document)[E1] === sol[E1]) filled = true;
        else await sleep(800);
      }
      check('H 多人 brawl 格子先行填入 → place 有 live oscillator', filled && liveFreqs(H).includes(880), 'filled=' + filled + ' live880=' + liveFreqs(H).filter(f => f === 880).length);
    }
  }
  console.log(`\n=== plataudio-path: ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
