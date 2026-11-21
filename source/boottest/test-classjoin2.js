// v1.61.2 補充驗收（稽核加嚴第 2 點）：數橋（三人）與地雷觀戰對象鈕「選取態」渲染斷言。
// 數橋：head 有尾隨空格、分支 token 應完整——選中鈕含獨立 bg-slate-800＋text-white、未選含 bg-white。
// 地雷：inline style 配對——選中鈕 background #1e293b＋color #fff（jsdom 序列化為 rgb()）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name + (extra ? ' — ' + extra : '')); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(120); } console.log('  (timeout: ' + label + ')'); return null; }
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const REG = {}; const errors = [];
function loadPage(label) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String(e.detail && e.detail.message || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(label + ': ' + m); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = REG; w.scrollTo = () => {}; w.addEventListener('error', ev => { if (ev.message && !/Script error/.test(ev.message)) errors.push(label + ': ' + ev.message); }); } });
  return { window: dom.window, document: dom.window.document, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true, cancelable: true })); return !!el; };
function setInput(w, el, v) { if (!el) return; const st = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; st.call(el, v); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
const tokens = (el) => (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
function setSel(w, el, v) { if (!el) return; const st = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value').set; st.call(el, v); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
function pev(w, el, type, x, y) { const e = new w.Event(type, { bubbles: true, cancelable: true }); e.clientX = x; e.clientY = y; e.isPrimary = true; e.pointerId = 7; e.pointerType = 'mouse'; e.button = 0; e.buttons = (type === 'pointerup' ? 0 : 1); el.dispatchEvent(e); }
function solveHashi(islands) {
  const pairs = [];
  for (let i = 0; i < islands.length; i++) for (let j = i + 1; j < islands.length; j++) {
    const a = islands[i], b = islands[j];
    if (a.gx !== b.gx && a.gy !== b.gy) continue;
    const between = islands.some(k => k !== a && k !== b && ((a.gx === b.gx && k.gx === a.gx && k.gy > Math.min(a.gy, b.gy) && k.gy < Math.max(a.gy, b.gy)) || (a.gy === b.gy && k.gy === a.gy && k.gx > Math.min(a.gx, b.gx) && k.gx < Math.max(a.gx, b.gx))));
    if (!between) pairs.push([i, j]);
  }
  const crosses = (p, q) => { const [a, b] = [islands[p[0]], islands[p[1]]], [c, d] = [islands[q[0]], islands[q[1]]]; const h1 = a.gy === b.gy, h2 = c.gy === d.gy; if (h1 === h2) return false; const H = h1 ? [a, b] : [c, d], V = h1 ? [c, d] : [a, b]; return V[0].gx > Math.min(H[0].gx, H[1].gx) && V[0].gx < Math.max(H[0].gx, H[1].gx) && H[0].gy > Math.min(V[0].gy, V[1].gy) && H[0].gy < Math.max(V[0].gy, V[1].gy); };
  const counts = new Array(pairs.length).fill(0);
  const sums = islands.map(() => 0);
  const connected = () => { const adj = islands.map(() => []); pairs.forEach(([i, j], pi) => { if (counts[pi] > 0) { adj[i].push(j); adj[j].push(i); } }); const seen = new Set([0]); const q = [0]; while (q.length) { const u = q.shift(); adj[u].forEach(v => { if (!seen.has(v)) { seen.add(v); q.push(v); } }); } return seen.size === islands.length; };
  const dfs = (pi) => { if (pi === pairs.length) return sums.every((s, i) => s === islands[i].req) && connected(); const [i, j] = pairs[pi]; for (let c = 0; c <= 2; c++) { if (sums[i] + c > islands[i].req || sums[j] + c > islands[j].req) continue; if (c > 0) { let bad = false; for (let q = 0; q < pi; q++) if (counts[q] > 0 && crosses(pairs[pi], pairs[q])) { bad = true; break; } if (bad) continue; } counts[pi] = c; sums[i] += c; sums[j] += c; if (dfs(pi + 1)) return true; counts[pi] = 0; sums[i] -= c; sums[j] -= c; } return false; };
  if (!dfs(0)) return null;
  return pairs.map(([i, j], pi) => ({ a: islands[i], b: islands[j], count: counts[pi] })).filter(x => x.count > 0);
}
async function joinGuest(code, name, game) {
  const G = loadPage(name);
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 90000, name + ' shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 30000, name + ' nick');
  setInput(G.window, G.document.querySelector('#lob-name'), name);
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 60000, name + ' in room');
  return G;
}
async function makeHost() {
  const H = loadPage('H');
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 90000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 30000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => H.window.__PLAT_NET && H.window.__PLAT_NET.code, 60000, 'H room');
  return H;
}
async function startGame(H, guests, game, mode, preStart) {
  for (const p of [H, ...guests]) { p.window.PLAT_show(game); await waitFor(() => !!p.window['__PLAT_HOOKS_' + game], 90000, 'preboot ' + game); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="' + game + '"]'));
  await waitFor(() => guests[0].window.__PLAT_NET.armed && guests[0].window.__PLAT_NET.armed.game === game, 30000, 'armed');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="' + mode + '"][data-hub-game="' + game + '"]'));
  await sleep(500);
  if (preStart) await preStart(H);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  for (const g of guests) { await sleep(600); clickEl(g, g.document.querySelector('#lob-step-room [data-pr="ready"]')); }
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 60000, 'start');
  if (en) clickEl(H, en);
  await waitFor(() => H.window.__PLAT_NET.inMatch === game && guests.every(g => g.window.__PLAT_NET.inMatch === game), 90000, 'inMatch ' + game);
}
(async () => {
  // ===== 數橋三人：來賓 1 解完（比照 test-autogod 已驗證路徑）→ 觀戰鈕選取態 =====
  {
    const H = await makeHost();
    const code = H.window.__PLAT_NET.code;
    const G1 = await joinGuest(code, '阿客', 'hashi');
    const G2 = await joinGuest(code, '阿丙', 'hashi');
    await startGame(H, [G1, G2], 'hashi', 'race');
    await sleep(4000);
    const P = G1;
    const freshBoard = () => { const s = [...P.document.querySelectorAll('#view-hashi svg')].find(x => [...x.querySelectorAll('text')].some(t => /^[1-8]$/.test((t.textContent || '').trim()))); if (s) { s.createSVGPoint = () => { const p = { x: 0, y: 0, matrixTransform: () => ({ x: p.x, y: p.y }) }; return p; }; s.getScreenCTM = () => ({ inverse: () => ({}) }); } return s; };
    const readIslands = () => { const bd = freshBoard(); if (!bd) return []; const out = []; bd.querySelectorAll('g').forEach(g => { const t = [...g.querySelectorAll('text')].find(x => /^[1-8]$/.test((x.textContent || '').trim())); if (!t) return; const cx = parseFloat(t.getAttribute('x')), cy = parseFloat(t.getAttribute('y')) - 2; out.push({ g, cx, cy, gx: Math.round((cx - 85) / 65), gy: Math.round((cy - 85) / 65), req: parseInt(t.textContent, 10) }); }); return out; };
    const islands = await waitFor(() => { const r = readIslands(); return r.length >= 4 ? r : null; }, 30000, 'G1 islands');
    check('數橋三人：來賓讀到島嶼', !!islands, islands && String(islands.length));
    const sol = islands && solveHashi(islands);
    check('數橋三人：解出解法', !!sol);
    if (sol) {
      const freshG = (isl) => { const f = readIslands().find(x => x.gx === isl.gx && x.gy === isl.gy); return f ? f.g : null; };
      for (const br of sol) for (let k = 0; k < br.count; k++) {
        const bd = freshBoard(); const gA = freshG(br.a);
        if (!bd || !gA) continue;
        pev(P.window, gA, 'pointerdown', br.a.cx, br.a.cy); await sleep(250);
        pev(P.window, bd, 'pointermove', (br.a.cx + br.b.cx) / 2, (br.a.cy + br.b.cy) / 2); await sleep(50);
        pev(P.window, bd, 'pointermove', br.b.cx, br.b.cy); await sleep(50);
        pev(P.window, bd, 'pointerup', br.b.cx, br.b.cy); await sleep(200);
      }
      await sleep(1500);
      const segCounts = () => { const bd = freshBoard(); const counts = {}; if (!bd) return counts; const isl = readIslands(); const nearest = (x, y) => { let best = null, bd2 = 1e9; isl.forEach(i => { const d = (i.cx - x) * (i.cx - x) + (i.cy - y) * (i.cy - y); if (d < bd2) { bd2 = d; best = i; } }); return best; }; bd.querySelectorAll('line').forEach(L => { const x1 = parseFloat(L.getAttribute('x1')), y1 = parseFloat(L.getAttribute('y1')), x2 = parseFloat(L.getAttribute('x2')), y2 = parseFloat(L.getAttribute('y2')); if (isNaN(x1) || (x1 === x2 && y1 === y2)) return; const a = nearest(x1, y1), b = nearest(x2, y2); if (!a || !b || a === b) return; const key = [a.gx + ',' + a.gy, b.gx + ',' + b.gy].sort().join('|'); counts[key] = (counts[key] || 0) + 1; }); return counts; };
      const have = segCounts();
      for (const br of sol) {
        const key = [br.a.gx + ',' + br.a.gy, br.b.gx + ',' + br.b.gy].sort().join('|');
        let missing = br.count - (have[key] || 0);
        while (missing > 0) { const gA = freshG(br.a), gB = freshG(br.b); if (!gA || !gB) break; pev(P.window, gA, 'pointerdown', br.a.cx, br.a.cy); pev(P.window, gA, 'pointerup', br.a.cx, br.a.cy); await sleep(220); pev(P.window, gB, 'pointerdown', br.b.cx, br.b.cy); pev(P.window, gB, 'pointerup', br.b.cx, br.b.cy); await sleep(300); missing--; }
      }
      await sleep(1200);
    }
    const btns = await waitFor(() => { const bs = [...P.document.querySelectorAll('#view-hashi button')].filter(b => /阿主|阿丙/.test(b.textContent || '') && tokens(b).some(t => t === 'rounded-lg')); return bs.length >= 2 ? bs : null; }, 45000, 'hashi god btns');
    if (!btns) { const all = [...P.document.querySelectorAll('#view-hashi button')].filter(b => /阿主|阿丙/.test(b.textContent || '')); console.log('  [diag] name buttons:', all.map(b => (b.textContent || '').trim().slice(0, 16) + '|' + (b.getAttribute('class') || '').slice(0, 40)).join(' ;; ')); console.log('  [diag] panel text present:', [...P.document.querySelectorAll('#view-hashi div')].some(d => (d.textContent || '').includes('已完賽・觀戰中'))); }
    check('數橋觀戰鈕出現（兩位對手）', !!btns, btns && String(btns.length));
    if (btns) {
      const sel = btns.filter(b => tokens(b).includes('bg-slate-800'));
      check('數橋選中觀戰鈕含獨立 token bg-slate-800＋text-white（恰一顆）', sel.length === 1 && tokens(sel[0]).includes('text-white'), 'sel=' + sel.length);
      const unsel = btns.filter(b => !tokens(b).includes('bg-slate-800'));
      check('數橋未選觀戰鈕為 bg-white', unsel.length === 1 && tokens(unsel[0]).includes('bg-white'));
      check('數橋觀戰鈕無黏連殘渣', !btns.some(b => tokens(b).some(t => t.includes(')]bg'))));
    }
  }
  // ===== 地雷雙人：房主開完安全格 → 觀戰鈕 inline style 配對 =====
  {
    const H = await makeHost();
    const code = H.window.__PLAT_NET.code;
    const G = await joinGuest(code, '阿客', 'mines');
    await startGame(H, [G], 'mines', 'race');
    const dbg = (p) => p.window.__PLAT_HOOKS_mines.debug();
    await waitFor(() => { try { return dbg(H).mp.phase === 'playing' && dbg(G).mp.phase === 'playing'; } catch (e) { return false; } }, 60000, 'mines playing');
    await sleep(3600);
    const cellEl = (idx) => H.document.querySelector('#view-mines [data-cell="' + idx + '"]');
    for (let round = 0; round < 40; round++) {
      const d = dbg(H);
      if (d.mp.phase !== 'playing') break;
      let clicked = 0;
      for (let i = 0; i < d.layout.length; i++) {
        if (!d.layout[i] && d.cells[i] === 'h') { const el = cellEl(i); if (el) { el.dispatchEvent(new H.window.MouseEvent('click', { bubbles: true })); clicked++; await sleep(30); } }
        if (clicked >= 12) break;
      }
      await sleep(500);
      if (!clicked) break;
    }
    const mBtns = await waitFor(() => { const bs = [...H.document.querySelectorAll('#view-mines button')].filter(b => (b.textContent || '').includes('阿客') && (b.getAttribute('style') || '').includes('background')); return bs.length ? bs : null; }, 45000, 'mines god btns');
    check('地雷觀戰鈕出現（阿客）', !!mBtns, mBtns && String(mBtns.length));
    if (mBtns) {
      const st = mBtns[0].getAttribute('style') || '';
      check('地雷選中觀戰鈕 inline style 配對（底 #1e293b＋字 #fff）', st.includes('rgb(30, 41, 59)') && st.includes('rgb(255, 255, 255)'), st);
      check('地雷觀戰鈕文字含名字與 %', /阿客/.test(mBtns[0].textContent || '') && /%/.test(mBtns[0].textContent || ''), (mBtns[0].textContent || '').trim());
    }
  }
  check('全程零頁面錯誤', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log('RESULT classjoin2: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
