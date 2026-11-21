// Akari 項3（2026-11-21）：拖曳塗叉 vs 捲動分流驗收——
// (a) 快速長滑（<90ms 越 slop）→ 判定捲動意圖、整程不塗任何叉
// (b) 慢速刻意拖曳（按下 >90ms、速度 <0.55px/ms）→ 照舊沿路塗叉
// (c) 點按循環（空→燈→叉→空）行為不變
// jsdom 無 layout：以合成 rect 餵 elementFromPoint（只影響本測試的命中判定）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('/home/hatch/workspace/boottest/mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(150); } console.log('timeout', label); return null; }
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
  await waitFor(() => root().querySelector('h1'), 60000, 'akari home');
  const clickBtn = (pred, scope) => { const b = [...(scope || root()).querySelectorAll('button')].find(pred); if (b) { b.click(); return true; } return false; };
  ok(clickBtn(b => b.textContent.includes('單機挑戰')), '點單機挑戰');
  await sleep(300);
  ok(clickBtn(b => b.textContent.includes('10×10'), d.querySelector('#plat-setup')), '選 10×10');
  const cellEl = i => root().querySelector('button[data-cell="' + i + '"]');
  const dbg = () => w.__PLAT_HOOKS_akari.debug();
  ok(!!(await waitFor(() => { const s = dbg(); return s && s.puzzle && cellEl(0) ? 1 : null; }, 30000, 'board')), '10×10 盤面就緒');
  const snap = dbg(); const W = snap.puzzle.w, walls = new Set(snap.puzzle.walls);
  // 找一列連續 ≥5 個空格的段
  let segStart = -1;
  for (let y = 0; y < snap.puzzle.h && segStart < 0; y++) { let run = 0; for (let x = 0; x < W; x++) { const i = y * W + x; if (!walls.has(i)) { run++; if (run >= 5) { segStart = i - 4; break; } } else run = 0; } }
  ok(segStart >= 0, '找到連續 5 格空格段 @' + segStart);
  // 合成 layout：格 30px、原點 (100, 200)
  const CELL = 30, OX = 100, OY = 200;
  const rectOf = i => { const x = OX + (i % W) * CELL, y = OY + Math.floor(i / W) * CELL; return { left: x, top: y, right: x + CELL, bottom: y + CELL, width: CELL, height: CELL, x, y }; };
  d.querySelectorAll('button[data-cell]').forEach(el => { const i = Number(el.dataset.cell); el.getBoundingClientRect = () => rectOf(i); });
  d.elementFromPoint = (x, y) => { const cx = Math.floor((x - OX) / CELL), cy = Math.floor((y - OY) / CELL); if (cx < 0 || cy < 0 || cx >= W || cy >= snap.puzzle.h) return null; return cellEl(cy * W + cx) || null; };
  const pt = (i, off) => { const r = rectOf(i); return { x: r.left + CELL / 2 + (off || 0), y: r.top + CELL / 2 }; };
  const pev = (type, el, x, y) => { const ev = new w.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, buttons: type === 'pointerup' ? 0 : 1 }); ev.pointerType = 'touch'; el.dispatchEvent(ev); };
  const crosses = () => dbg().cells.filter(c => c === 2).length;

  // (a) 快速長滑：down 後 6 步 ×30px、步間無等待（總時長遠 <90ms）
  { const p0 = pt(segStart); pev('pointerdown', cellEl(segStart), p0.x, p0.y);
    for (let k = 1; k <= 6; k++) pev('pointermove', cellEl(segStart), p0.x + k * 30, p0.y);
    pev('pointerup', cellEl(segStart), p0.x + 180, p0.y); await sleep(150);
    ok(crosses() === 0, '(a) 快速長滑不塗任何叉（捲動意圖）crosses=' + crosses()); }

  // (b) 慢速刻意拖曳：按住 150ms 後 8px/40ms 慢移 8 步（橫越約 3 格）
  { const p0 = pt(segStart); pev('pointerdown', cellEl(segStart), p0.x, p0.y);
    await sleep(150);
    for (let k = 1; k <= 8; k++) { pev('pointermove', cellEl(segStart), p0.x + k * 8, p0.y); await sleep(40); }
    pev('pointerup', cellEl(segStart), p0.x + 64, p0.y); await sleep(150);
    const cs = dbg().cells; const painted = [0, 1, 2].filter(o => cs[segStart + o] === 2).length;
    ok(painted >= 2, '(b) 慢速拖曳沿路塗叉（起始段 3 格中塗 ' + painted + ' 格）'); }

  // (c) 點按循環：找一個空格 tap 三次 空→燈→叉→空
  { let target = -1; const cs0 = dbg().cells; for (let i = 0; i < cs0.length; i++) if (!walls.has(i) && cs0[i] === 0) { target = i; break; }
    const p = pt(target); const seq = [];
    for (let t = 0; t < 3; t++) { pev('pointerdown', cellEl(target), p.x, p.y); await sleep(30); pev('pointerup', cellEl(target), p.x, p.y); await sleep(120); seq.push(dbg().cells[target]); }
    ok(seq[0] === 1 && seq[1] === 2 && seq[2] === 0, '(c) 點按循環 空→燈(1)→叉(2)→空(0)：' + seq.join('→')); }

  console.log('\n=== akari-dragscroll: ' + pass + ' passed, ' + fail + ' failed ===');
  if (fails.length) console.log('FAILED:', fails.join(' | '));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
