// 數橋觸控拖曳時序（v1.65.1 緊急修復重現）：真機快拖（起點不停留、總時長 <220ms hold 武裝）放開必須成橋。
// 既有套件的拖曳都帶 250ms 停留（autogod）或以無 isPrimary 的 MouseEvent 派發（手勢根本沒啟動、靠點按補橋完賽），快拖路徑從未被覆蓋。
// 本檔以 touch 語意派發（isPrimary/pointerType/buttons 齊全）：
//   ①快拖（down→moves→up 全程 <220ms）鄰島 → 成橋  ②慢拖（停留 300ms）→ 成橋（不得退化）
//   ③快拖但位移未達 dragCommitInfo 門檻 → 不成橋  ④快拖朝無鄰島方向 → 不成橋  ⑤快拖進行中預覽虛線可見（症狀對照）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
html = html.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(250); } console.log('  (timeout: ' + label + ')'); return null; }
function loadPage() {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs };
}
// touch 語意 pointer 事件：MouseEvent 補 isPrimary/pointerType（jsdom 無 PointerEvent 建構子）
function pev(p, el, type, x, y, buttons) {
  if (!el) return;
  const ev = new p.window.MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, buttons: buttons != null ? buttons : (type === 'pointerup' ? 0 : 1) });
  Object.defineProperty(ev, 'isPrimary', { value: true });
  Object.defineProperty(ev, 'pointerType', { value: 'touch' });
  Object.defineProperty(ev, 'pointerId', { value: 7 });
  el.dispatchEvent(ev);
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
(async () => {
  const p = loadPage();
  const D = p.document;
  await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.PlatDock) ? true : null, 60000, 'shell');
  p.window.PLAT_show('hashi');
  const view = () => D.querySelector('#view-hashi');
  const soloBtn = await waitFor(() => [...view().querySelectorAll('button')].find(b => (b.textContent || '').includes('單機挑戰')) || null, 60000, 'hashi main');
  check('前置：數橋主畫面', !!soloBtn);
  clickEl(p, soloBtn); await sleep(700);
  const lvBtn = [...view().querySelectorAll('button')].find(b => (b.textContent || '').includes('10x10') || (b.textContent || '').includes('10×10'));
  check('前置：難度選單有 10x10', !!lvBtn);
  clickEl(p, lvBtn);
  const board = await waitFor(() => { const s = [...view().querySelectorAll('svg')].find(x => [...x.querySelectorAll('text')].some(t => /^[1-8]$/.test((t.textContent || '').trim()))); return s || null; }, 60000, 'board');
  check('前置：盤面渲染', !!board);
  board.createSVGPoint = () => { const pt = { x: 0, y: 0, matrixTransform: () => ({ x: pt.x, y: pt.y }) }; return pt; };
  board.getScreenCTM = () => ({ inverse: () => ({}) });
  const readIslands = () => { const out = []; board.querySelectorAll('g').forEach(g => { const t = [...g.querySelectorAll('text')].find(x => /^[1-8]$/.test((x.textContent || '').trim())); if (!t) return; const cx = parseFloat(t.getAttribute('x')), cy = parseFloat(t.getAttribute('y')) - 2; out.push({ g, cx, cy, gx: Math.round((cx - 85) / 65), gy: Math.round((cy - 85) / 65) }); }); return out; };
  const islands = readIslands();
  check('前置：島嶼 ≥6', islands.length >= 6, 'n=' + islands.length);
  console.log('  islands sample:', islands.slice(0, 5).map(i => i.cx + ',' + i.cy).join(' '));
  const segCount = (a, b) => {
    const isl = readIslands();
    const nearest = (x, y) => { let best = null, bd = 1e9; isl.forEach(i => { const d = (i.cx - x) * (i.cx - x) + (i.cy - y) * (i.cy - y); if (d < bd) { bd = d; best = i; } }); return best; };
    let n = 0;
    if (process.env.DEBUG) console.log('  segCount isl sample:', isl.slice(0, 3).map(i => i.cx + ',' + i.cy).join(' '), 'target:', a.cx + ',' + a.cy, b.cx + ',' + b.cy);
    board.querySelectorAll('line').forEach(L => {
      const dash = L.getAttribute('stroke-dasharray'); if ((dash && dash !== 'none') || (L.getAttribute('class') || '').includes('solution-line')) return; // 預覽線不算（實橋的 dash 是字串 'none'、預覽線 class=solution-line）
      if (L.style && L.style.display === 'none') return;
      const x1 = parseFloat(L.getAttribute('x1')), y1 = parseFloat(L.getAttribute('y1')), x2 = parseFloat(L.getAttribute('x2')), y2 = parseFloat(L.getAttribute('y2'));
      if (isNaN(x1) || (x1 === x2 && y1 === y2)) return;
      const A = nearest(x1, y1), B = nearest(x2, y2);
      if (A && B && ((A.cx === a.cx && A.cy === a.cy && B.cx === b.cx && B.cy === b.cy) || (A.cx === b.cx && A.cy === b.cy && B.cx === a.cx && B.cy === a.cy))) n++;
    });
    return n;
  };
  const freshG = (isl) => { const f = readIslands().find(x => x.cx === isl.cx && x.cy === isl.cy); return f ? f.g : null; };
  // 找兩組水平鄰島（快拖組、慢拖組）與一座上方無鄰島的島（無效方向組）
  const pairs = [];
  { const rows = {}; islands.forEach(i => { const k = Math.round(i.cy); (rows[k] = rows[k] || []).push(i); });
    for (const k of Object.keys(rows)) { const r = rows[k].sort((a, b) => a.cx - b.cx); for (let j = 0; j + 1 < r.length; j++) pairs.push([r[j], r[j + 1]]); } }
  check('前置：水平鄰島 ≥2 組', pairs.length >= 2, 'pairs=' + pairs.length);
  const [fastPair, slowPair] = pairs;
  // ① 快拖：全程不等待（真實時間 << 220ms）
  {
    const [a, b] = fastPair;
    pev(p, freshG(a), 'pointerdown', a.cx, a.cy, 1);
    pev(p, board, 'pointermove', (a.cx + b.cx) / 2, a.cy, 1);
    const preview = [...board.querySelectorAll('line')].find(L => L.style.display === 'block' && Math.abs(parseFloat(L.getAttribute('x1')) - a.cx) < 2 && Math.abs(parseFloat(L.getAttribute('y1')) - a.cy) < 2 && parseFloat(L.getAttribute('x2')) !== parseFloat(L.getAttribute('x1')));
    check('⑤ 快拖進行中預覽虛線可見（症狀對照）', !!preview);
    pev(p, board, 'pointermove', b.cx, b.cy, 1);
    pev(p, board, 'pointerup', b.cx, b.cy, 0);
    await sleep(300);
    check('① 快拖（<220ms）放開成橋', segCount(a, b) >= 1, 'count=' + segCount(a, b));
  }
  // ② 慢拖：down 後停留 300ms（hold 武裝）再拖
  {
    const [a, b] = slowPair;
    pev(p, freshG(a), 'pointerdown', a.cx, a.cy, 1);
    await sleep(300);
    pev(p, board, 'pointermove', (a.cx + b.cx) / 2, a.cy, 1);
    pev(p, board, 'pointermove', b.cx, b.cy, 1);
    pev(p, board, 'pointerup', b.cx, b.cy, 0);
    await sleep(300);
    if (process.env.DEBUG) console.log('  SLOW pair', a.cx, a.cy, '->', b.cx, b.cy, 'lines:', [...board.querySelectorAll('line')].map(L => L.getAttribute('x1') + ',' + L.getAttribute('y1') + '->' + L.getAttribute('x2') + ',' + L.getAttribute('y2') + '/' + (L.style.display || 'def') + '/dash=' + L.getAttribute('stroke-dasharray') + '/cls=' + (L.getAttribute('class') || '')).join(' ; '));
    check('② 慢拖（停留 ≥220ms）放開成橋', segCount(a, b) >= 1, 'count=' + segCount(a, b));
  }
  // ③ 快拖短位移（未達門檻）：從 fastPair 的 b 往回拖 15 單位就放開（該段已有 1 橋、不得變 2）
  {
    const [a, b] = fastPair;
    const before = segCount(a, b);
    pev(p, freshG(b), 'pointerdown', b.cx, b.cy, 1);
    pev(p, board, 'pointermove', b.cx - 15, b.cy, 1);
    pev(p, board, 'pointerup', b.cx - 15, b.cy, 0);
    await sleep(300);
    check('③ 快拖未達門檻不成橋', segCount(a, b) === before, 'before=' + before + ' after=' + segCount(a, b));
  }
  // ④ 快拖朝無鄰島方向（最上列的島往上拖）
  {
    const top = islands.reduce((m, i) => (i.cy < m.cy ? i : m), islands[0]);
    const solidCount = () => [...board.querySelectorAll('line')].filter(L => L.style.display !== 'none' && !(parseFloat(L.getAttribute('x1')) === 0 && parseFloat(L.getAttribute('x2')) === 0)).length;
    const anyBefore = solidCount();
    pev(p, freshG(top), 'pointerdown', top.cx, top.cy, 1);
    pev(p, board, 'pointermove', top.cx, top.cy - 90, 1);
    pev(p, board, 'pointerup', top.cx, top.cy - 90, 0);
    await sleep(300);
    check('④ 快拖朝無鄰島方向不成橋', solidCount() === anyBefore, 'lines before=' + anyBefore + ' after=' + solidCount());
  }
  check('全程零錯誤', p.errors.length === 0, p.errors.slice(0, 2).join(' | '));
  console.log(`\n=== hashi-fastdrag: ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
