// Akari P1 jsdom：主畫面四鈕/PlatBar 只掛對局、預生成命中、光暈與解答一致（不溢牆）、互照標紅、
// 點按三態循環、PlatBar 塗叉模式、照解答完賽、每日同題確定性＋紀錄/連勝落盤（PlatSave.read）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const A = require('/home/hatch/workspace/akari-site/js/engine.js');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('/home/hatch/workspace/boottest/mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(150); } console.log('timeout', label); return null; }
let pass = 0, fail = 0; const fails = [];
function ok(c, label) { if (c) { pass++; console.log('✅', label); } else { fail++; fails.push(label); console.log('❌', label); } }
(async () => {
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {}); vc.on('error', () => {});
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.scrollTo = () => {}; w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } resume() { return Promise.resolve(); } }; } });
  const w = dom.window, d = w.document;
  await waitFor(() => (typeof w.PLAT_show === 'function' && w.PlatDock) ? 1 : null, 120000, 'shell');
  w.PLAT_show('akari');
  const root = () => d.querySelector('#akari-root');
  const clickBtn = (pred, scope) => { const b = [...(scope || root()).querySelectorAll('button')].find(pred); if (b) { b.click(); return true; } return false; };
  await waitFor(() => root().querySelector('h1'), 60000, 'akari home');
  const homeBtns = [...root().querySelectorAll('button')].map(b => b.textContent);
  ok(homeBtns.some(t => t.includes('單機挑戰')) && homeBtns.some(t => t.includes('每日一題')) && homeBtns.some(t => t.includes('玩法教學')) && homeBtns.some(t => t.includes('回大廳')), '主畫面四鈕同款（單機/每日/教學/回大廳）');
  ok(!root().querySelector('[data-pb]'), '主畫面無 PlatBar（只掛對局畫面）');
  // 預生成：閒置後 slot 有題
  const slotReady = await waitFor(() => { const s = w.__AKARI_PREGEN_SLOT && w.__AKARI_PREGEN_SLOT(); return s && s.hasPuzzle ? s : null; }, 60000, 'pregen slot');
  ok(!!slotReady, '主畫面閒置預生成完成（slot hasPuzzle）');
  // 單機（預設/上次尺寸 10×10＝預生成尺寸）→ 命中
  ok(clickBtn(b => b.textContent.includes('單機挑戰')), '點單機挑戰');
  await sleep(300);
  ok(clickBtn(b => b.textContent.includes('10×10'), d.querySelector('#plat-setup')), '選 10×10（PlatSetup 殼 overlay）');
  const cellEls = () => [...root().querySelectorAll('button[data-cell]')];
  const cellEl = i => root().querySelector('button[data-cell="' + i + '"]'); // 以 data-cell 定位（牆是 div、button 序≠格序）
  const boardCells = () => { const g = [...root().querySelectorAll('div')].find(el => (el.className || '').includes('inline-grid')); return g ? g.childElementCount : 0; }; // 牆是 div、空格是 button：以盤面格總數計
  ok(!!(await waitFor(() => boardCells() === 100, 20000, '100 cells')), '10×10 盤面 100 格');
  ok(w.__AKARI_PREGEN_STATS && w.__AKARI_PREGEN_STATS.hits >= 1, '預生成命中（hits>=1）');
  const dbg = () => w.__PLAT_HOOKS_akari.debug();
  let snap = dbg();
  ok(snap && snap.puzzle && snap.puzzle.solution.length >= 10, '題目已生成（解答燈數 ' + (snap && snap.puzzle.solution.length) + '）');
  ok(!!root().querySelector('[data-pb="mode-press"]'), '對局畫面有 PlatBar 模式鈕');
  const P = { w: snap.puzzle.w, h: snap.puzzle.h, walls: new Set(snap.puzzle.walls), numbers: new Map(snap.puzzle.numbers), solution: new Set(snap.puzzle.solution) };
  const bgOf = i => { const el = cellEl(i); return el ? (el.style.background || '') : ''; };
  // 光暈實測：放解答第一盞燈，逐格比對渲染底色 vs 引擎 litCells
  const b0 = snap.puzzle.solution[0];
  cellEl(b0).click(); await sleep(200);
  const lit = A.litCells(P.w, P.h, P.walls, new Set([b0]));
  let glowOk = true, beyondWallChecked = false;
  for (let i = 0; i < 100; i++) {
    if (P.walls.has(i)) continue;
    const should = lit.has(i);
    const isLit = bgOf(i).includes('219, 234, 254') || bgOf(i).includes('96, 165, 250'); // 亮格 #dbeafe／燈格 #60a5fa（2026-11-21 主題改藍）
    if (should !== isLit) { glowOk = false; console.log('  glow mismatch at', i, 'should', should, 'bg', bgOf(i)); break; }
  }
  // 牆後不溢：找一盞解答燈其同列有牆、牆後有格 → 該格必不在 lit 且渲染未亮（已含在逐格比對；此處顯式記錄）
  for (const b of P.solution) { const rc = A.rayCells(P.w, P.h, P.walls, b); const x = b % P.w; let wx = -1; for (let xx = x + 1; xx < P.w; xx++) if (P.walls.has(b + (xx - x))) { wx = xx; break; } if (wx > 0 && wx < P.w - 1) { beyondWallChecked = !lit.has(b + (wx - x) + 1) || P.walls.has(b + (wx - x) + 1); break; } }
  ok(glowOk, '光暈渲染與引擎 litCells 逐格一致（亮/暗判定正確）');
  ok(beyondWallChecked, '光暈不溢出牆後（牆後格未亮）');
  // 互照標紅：找與 b0 同列段的另一空格放第二盞（必互照）
  const seg = A.rayCells(P.w, P.h, P.walls, b0).filter(i => i !== b0 && !P.solution.has(i));
  const other = seg.find(i => cells0Free(i));
  function cells0Free(i) { return dbg().cells[i] === 0; }
  if (other != null) { cellEl(other).click(); await sleep(200); const el = cellEl(b0); ok((el.style.boxShadow || '').includes('239, 68, 68') || el.className.includes('border-red'), '兩燈互照 → 標紅警示'); cellEl(other).click(); await sleep(100); cellEl(other).click(); await sleep(100); } // 點兩下回到空白（燈→叉→空）
  else ok(false, '找不到互照測試格');
  // 三態循環：找一個空格
  snap = dbg();
  const free = snap.cells.findIndex((c, i) => c === 0 && !P.walls.has(i) && !P.solution.has(i));
  cellEl(free).click(); await sleep(120); ok(dbg().cells[free] === 1, '點按 1：放燈');
  cellEl(free).click(); await sleep(120); ok(dbg().cells[free] === 2, '點按 2：變叉');
  cellEl(free).click(); await sleep(120); ok(dbg().cells[free] === 0, '點按 3：清空');
  // PlatBar 塗叉模式：點模式鈕 → 點空格直接變叉
  const pb = d.querySelector('#view-akari [data-pb="mode-press"]'); pb.click(); await sleep(250);
  ok(dbg().mode === 'cross', 'PlatBar 切換塗叉模式');
  cellEl(free).click(); await sleep(120); ok(dbg().cells[free] === 2, '塗叉模式點按直接畫叉');
  cellEl(free).click(); await sleep(120); ok(dbg().cells[free] === 0, '塗叉模式再點清除');
  d.querySelector('#view-akari [data-pb="mode-press"]').click(); await sleep(250);
  // 完賽：照解答放滿（b0 已放）
  snap = dbg();
  for (const sIdx of snap.puzzle.solution) { if (dbg().cells[sIdx] !== 1) { cellEl(sIdx).click(); await sleep(30); } }
  ok(!!(await waitFor(() => dbg().status === 'won' ? 1 : null, 10000, 'won')), '照解答放滿 → 完賽');
  ok([...root().querySelectorAll('div')].some(el => (el.textContent || '').includes('全盤點亮')), '完賽卡出現');
  // 回主畫面 → 教學
  ok(clickBtn(b => b.textContent.includes('回主選單')), '完賽後回主選單');
  await waitFor(() => root().querySelector('h1'), 5000, 'home2');
  ok(clickBtn(b => b.textContent.includes('玩法教學')), '開教學');
  await sleep(300);
  const tut = () => d.querySelector('#plat-tutorial');
  ok(!!(tut() && (tut().textContent || '').includes('燈照直線')), '教學第 1 頁（PlatTutorial 殼 overlay）');
  ok(clickBtn(b => b.textContent.includes('下一步'), tut()), '教學下一步→第 2 頁');
  ok(!!(tut() && (tut().textContent || '').includes('互相照到')), '教學第 2 頁');
  ok(clickBtn(b => b.textContent.includes('下一步'), tut()), '教學下一步→第 3 頁');
  ok(!!(tut() && (tut().textContent || '').includes('數字牆')), '教學第 3 頁');
  ok(clickBtn(b => b.textContent.includes('開始遊戲'), tut()), '關教學');
  await sleep(200);
  // 每日：開局 → 同題確定性（重進比對）→ 完賽 → 紀錄/連勝
  ok(clickBtn(b => b.textContent.includes('每日一題')), '點每日一題');
  ok(!!(await waitFor(() => boardCells() === 100, 20000, 'daily cells')), '每日 10×10 盤面');
  const d1 = dbg(); ok(d1.isDaily === true, '每日模式旗標');
  const key1 = JSON.stringify(d1.puzzle.walls) + '|' + JSON.stringify(d1.puzzle.solution);
  for (const sIdx of d1.puzzle.solution) { cellEl(sIdx).click(); await sleep(25); }
  ok(!!(await waitFor(() => dbg().status === 'won' ? 1 : null, 10000, 'daily won')), '每日完賽');
  const today = (() => { const t = new Date(), p = n => String(n).padStart(2, '0'); return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()); })();
  const rec = w.PlatSave.read('akari_daily_records', { fallback: {} });
  ok(typeof rec[today] === 'number', '每日紀錄落盤（' + rec[today] + ' 秒）');
  const streak = w.PlatSave.read('akari_daily_streak', { fallback: { last: '', count: 0 } });
  ok(streak.last === today && streak.count >= 1, '每日連勝落盤（' + streak.count + ' 天）');
  ok(clickBtn(b => b.textContent.includes('回主選單')), '每日後回主選單');
  await waitFor(() => root().querySelector('h1'), 5000, 'home3');
  ok(clickBtn(b => b.textContent.includes('每日一題')), '再進每日');
  await waitFor(() => boardCells() === 100, 20000, 'daily cells 2');
  const d2 = dbg();
  ok(JSON.stringify(d2.puzzle.walls) + '|' + JSON.stringify(d2.puzzle.solution) === key1, '每日同日同題（確定性）');
  console.log('==== AKARI-SOLO: ' + pass + ' passed, ' + fail + ' failed ====');
  if (fails.length) console.log('fails:', fails.join(' | '));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
