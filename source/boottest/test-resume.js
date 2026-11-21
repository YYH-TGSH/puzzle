// 多人對戰「不小心跳出、回來接續」：來賓對局中離開遊戲（回房間頁）→ 房間頁出現「回到對局」鈕 →
// 點下去重回同一場，自己的盤面進度要還原（地雷：開格/旗幟；數橋：已架的橋；數獨：已填的數字）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
html = html.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (timeout: ' + label + ')'); return null; }
function loadPage(reg, label, sudokuGeom) {
  const errs = [];
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errs.push(stamp(String(m))));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = reg; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); });
      if (sudokuGeom) {
        w.SVGSVGElement.prototype.createSVGPoint = function () { return { x: 0, y: 0, matrixTransform: function () { return { x: this.x, y: this.y }; } }; };
        w.SVGSVGElement.prototype.getScreenCTM = function () { return { inverse: function () { return {}; } }; };
      }
    } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function pev(w, el, type, x, y) { const e = new w.Event(type, { bubbles: true, cancelable: true }); e.clientX = x; e.clientY = y; e.isPrimary = true; e.pointerId = 7; e.pointerType = 'mouse'; e.button = 0; e.buttons = (type === 'pointerup' ? 0 : 1); el.dispatchEvent(e); }
const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
async function openRoom(H, G, game, mode, smallest) {
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell'); if (!ok) throw new Error('SHELL NOT READY ' + p.label); }
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  await waitFor(() => hubRoom(H), 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙'; G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  await waitFor(() => hubRoom(G), 60000, 'G room');
  await waitFor(() => H.window.__PLAT_NET.roster.length === 2 ? true : null, 30000, 'roster 2');
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="' + game + '"]'));
  await sleep(600);
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="' + mode + '"]'));
  await sleep(800);
  if (smallest) {
    const setSel = (w, s, v) => { const setter = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value').set; setter.call(s, v); s.dispatchEvent(new w.Event('change', { bubbles: true })); };
    const lvSel = [...H.document.querySelectorAll('#lob-step-room [data-pr-slot="settings"] select')].find(s => [...s.options].some(o => String(o.value) === '1'));
    if (lvSel) { setSel(H.window, lvSel, '1'); await sleep(800); }
  }
  const readyBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="ready"]');
  const startBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="start"]');
  await waitFor(() => readyBtn(G) && readyBtn(H), 20000, 'ready btns');
  clickEl(G, readyBtn(G)); clickEl(H, readyBtn(H));
  const unlocked = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
  clickEl(H, unlocked);
}
async function exitAndResume(G, gameLabel) {
  G.window.__PLAT_NOTIFY('game-exit');
  const inRoom = await waitFor(() => hubRoom(G) ? true : null, 30000, gameLabel + ' back in room');
  check(gameLabel + '：跳出後回到房間頁', !!inRoom);
  const btn = await waitFor(() => G.document.querySelector('#hub-resume-btn'), 20000, gameLabel + ' resume btn');
  check(gameLabel + '：房間頁有「回到對局」鈕', !!btn);
  if (btn) clickEl(G, btn);
  return !!btn;
}
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

(async () => {
  // ================= 踩地雷 =================
  {
    const reg = {};
    const H = loadPage(reg, 'HM'), G = loadPage(reg, 'GM');
    const dbg = (p) => p.window.__PLAT_HOOKS_mines.debug();
    const cellsOf = (d) => Array.isArray(d.cells) ? d.cells : (d.cells || '').split('');
    await openRoom(H, G, 'mines', 'race', false);
    const playing = await waitFor(() => { try { return dbg(G).mp.phase === 'playing' && dbg(H).mp.phase === 'playing' ? true : null; } catch (e) { return null; } }, 90000, 'mines playing');
    check('地雷：開局 playing', !!playing);
    const cellEl = (p, idx) => p.document.querySelector('#view-mines [data-cell="' + idx + '"]');
    const clickCell = (p, idx) => { const el = cellEl(p, idx); if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); };
    // 來賓挖 3 格安全格＋插 1 支旗
    let d = dbg(G);
    const firstSafe = d.layout.findIndex(v => !v);
    clickCell(G, firstSafe); await sleep(700);
    d = dbg(G);
    const moreSafe = d.layout.map((v, i) => (!v && d.cells[i] === 'h') ? i : -1).filter(i => i >= 0).slice(0, 2);
    for (const i of moreSafe) { clickCell(G, i); await sleep(400); }
    const aMine = dbg(G).layout.findIndex(v => v);
    const flagEl = cellEl(G, aMine); if (flagEl) flagEl.dispatchEvent(new G.window.MouseEvent('contextmenu', { bubbles: true }));
    await sleep(600);
    const before = dbg(G);
    const openedB = cellsOf(before).filter(c => c === 'o').length;
    const flagsB = cellsOf(before).filter(c => c === 'f').length;
    check('地雷：離開前有進度（開格 ≥3、旗 1）', openedB >= 3 && flagsB === 1, 'opened=' + openedB + ' flags=' + flagsB + ' prog=' + before.progress);
    await exitAndResume(G, '地雷');
    const back = await waitFor(() => { try { return dbg(G).mp.phase === 'playing' ? true : null; } catch (e) { return null; } }, 60000, 'mines resumed');
    check('地雷：回到對局後 phase=playing', !!back);
    await sleep(800);
    const after = dbg(G);
    const openedA = cellsOf(after).filter(c => c === 'o').length;
    const flagsA = cellsOf(after).filter(c => c === 'f').length;
    check('地雷：盤面進度還原（開格/旗幟與離開前一致）', openedA === openedB && flagsA === flagsB, 'opened ' + openedB + '->' + openedA + ' flags ' + flagsB + '->' + flagsA);
    const nextSafe = after.layout.map((v, i) => (!v && after.cells[i] === 'h') ? i : -1).filter(i => i >= 0)[0];
    clickCell(G, nextSafe); await sleep(700);
    const openedA2 = cellsOf(dbg(G)).filter(c => c === 'o').length;
    check('地雷：回座後能繼續挖（開格增加）', openedA2 > openedA, 'opened ' + openedA + '->' + openedA2);
    check('地雷場零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
  }
  // ================= 數橋 =================
  {
    const reg = {};
    const H = loadPage(reg, 'HH'), G = loadPage(reg, 'GH');
    await openRoom(H, G, 'hashi', 'race', true);
    const freshBoard = () => { const s = [...G.document.querySelectorAll('#view-hashi svg')].find(x => [...x.querySelectorAll('text')].some(t => /^[1-8]$/.test((t.textContent || '').trim()))); if (s) { s.createSVGPoint = () => { const pt = { x: 0, y: 0, matrixTransform: () => ({ x: pt.x, y: pt.y }) }; return pt; }; s.getScreenCTM = () => ({ inverse: () => ({}) }); } return s; };
    const readIslands = () => { const bd = freshBoard(); if (!bd) return []; const raw = []; bd.querySelectorAll('g').forEach(g => { const t = [...g.querySelectorAll('text')].find(x => /^[1-8]$/.test((x.textContent || '').trim())); if (!t) return; raw.push({ g, cx: parseFloat(t.getAttribute('x')), cy: parseFloat(t.getAttribute('y')) - 2, req: parseInt(t.textContent, 10) }); }); const xs = [...new Set(raw.map(r => r.cx))].sort((a, b) => a - b), ys = [...new Set(raw.map(r => r.cy))].sort((a, b) => a - b); return raw.map(r => ({ ...r, gx: xs.indexOf(r.cx), gy: ys.indexOf(r.cy) })); }; // 2026-11-21 修：格座標改由島嶼座標排序推導——舊寫死 (cx-85)/65 只合特定尺寸，房間預設尺寸變了就整張解圖錯位、拖曳全被判無效
    // F3 後數橋首次進場會自動開殼 PlatTutorial（蓋在盤面上）；先關掉再操作盤面（真機使用者也會先關教學）
    { const tutClose = G.document.querySelector('#plat-tutorial [data-ptu="close"]'); if (tutClose) { clickEl(G, tutClose); await sleep(500); } const tutCloseH = H.document.querySelector('#plat-tutorial [data-ptu="close"]'); if (tutCloseH) { clickEl(H, tutCloseH); await sleep(300); } }
    const islands0 = await waitFor(() => { const r = readIslands(); return r.length >= 3 ? r : null; }, 90000, 'hashi islands');
    check('數橋：開局讀到島嶼', !!islands0, 'n=' + (islands0 || []).length);
    // 2026-11-21 決定性探針定版（logs/probe-hashi5.log）：來賓盤面開賽時會整盤換題，須等盤面穩定（連續兩讀相同）才解題/拖曳；
    // 橋的斷言改讀遊戲狀態（localStorage hashi_resume_* 的 bridges count>0），不讀過渡期 DOM 線數——探針證實：拖曳後狀態 count=1、定版盤面 DOM 線數與狀態一致、回座後狀態保留。
    let islands = readIslands(); let sigPrev = '';
    for (let i = 0; i < 20; i++) { const cur = readIslands(); const s = JSON.stringify(cur.map(x => [x.cx, x.cy, x.req])); islands = cur; if (s === sigPrev && cur.length >= 3) break; sigPrev = s; await sleep(2000); }
    const stateBridges = () => { try { for (let i = 0; i < G.window.localStorage.length; i++) { const k = G.window.localStorage.key(i); if (k && k.indexOf('hashi_resume_') === 0) { const v = JSON.parse(G.window.localStorage.getItem(k)); const b = (v && v.data && v.data.bridges) || []; return b.filter(x => x && x.count > 0).map(x => x.from + '-' + x.to + 'x' + x.count).sort().join(','); } } } catch (e) {} return ''; };
    if (islands) {
      const sol = solveHashi(islands);
      check('數橋：解出解法', !!sol);
      if (sol) {
        const freshG = (isl) => { const f = readIslands().find(x => x.gx === isl.gx && x.gy === isl.gy); return f ? f.g : null; };
        for (const br of sol.slice(0, 2)) {
          for (let k = 0; k < br.count; k++) {
            const bd = freshBoard(); const gA = freshG(br.a);
            if (!bd || !gA) continue;
            pev(G.window, gA, 'pointerdown', br.a.cx, br.a.cy); await sleep(250);
            pev(G.window, bd, 'pointermove', (br.a.cx + br.b.cx) / 2, (br.a.cy + br.b.cy) / 2); await sleep(50);
            pev(G.window, bd, 'pointermove', br.b.cx, br.b.cy); await sleep(50);
            pev(G.window, bd, 'pointerup', br.b.cx, br.b.cy); await sleep(250);
          }
          await sleep(300);
        }
      }
    }
    await sleep(800);
    const builtB = stateBridges();
    check('數橋：離開前已架實線橋', builtB.length > 0, 'state=' + builtB);
    await exitAndResume(G, '數橋');
    const backBoard = await waitFor(() => { const r = readIslands(); return r.length >= 3 ? true : null; }, 90000, 'hashi back');
    check('數橋：回到對局（盤面重現）', !!backBoard);
    await sleep(1500);
    const builtA = stateBridges();
    check('數橋：橋還原（狀態橋集合與離開前一致）', builtA === builtB && builtA.length > 0, 'state ' + builtB + '->' + builtA);
    check('數橋場零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
  }
  // ================= 數獨 =================
  {
    const reg = {};
    const H = loadPage(reg, 'HS', true), G = loadPage(reg, 'GS', true);
    await openRoom(H, G, 'sudoku', 'brawl', false);
    const cellEl = (p, id) => p.document.querySelector('#view-sudoku g[id="cell-' + id + '"]');
    const readBoard = (D) => { const cells = {}; D.querySelectorAll('#view-sudoku g[id^="cell-"]').forEach(g => { const id = g.getAttribute('id').slice(5); const t = (g.textContent || '').trim(); cells[id] = t ? parseInt(t, 10) : 0; }); return cells; };
    const cellsReady = await waitFor(() => G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? true : null, 90000, 'sudoku cells');
    check('數獨：開局盤面出現', !!cellsReady);
    await sleep(7000); // 等倒數結束
    const center = (id) => { const [x, y] = id.split('-').map(Number); return [50 + x * 60, 50 + y * 60]; };
    const tapPtr = async (p, id) => { const [cx, cy] = center(id); pev(p.window, cellEl(p, id), 'pointerdown', cx, cy); await sleep(60); pev(p.window, cellEl(p, id), 'pointerup', cx, cy); await sleep(250); };
    const b0 = readBoard(G.document);
    const givenIds = Object.keys(b0).filter(id => b0[id] !== 0);
    const emptyIds = Object.keys(b0).filter(id => b0[id] === 0);
    const filledByMe = {};
    for (let k = 0; k < 2 && k < emptyIds.length; k++) {
      await tapPtr(G, givenIds[k]); // 吸取一個題面數字
      await tapPtr(G, emptyIds[k]);  // 填進空格
      filledByMe[emptyIds[k]] = b0[givenIds[k]];
    }
    await sleep(600);
    const b1 = readBoard(G.document);
    const filledCount = Object.keys(filledByMe).filter(id => b1[id] === filledByMe[id]).length;
    check('數獨：離開前已填 2 格', filledCount === 2, JSON.stringify(filledByMe) + ' board=' + JSON.stringify(Object.keys(filledByMe).map(id => b1[id])));
    await exitAndResume(G, '數獨');
    const backCells = await waitFor(() => G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? true : null, 90000, 'sudoku back');
    check('數獨：回到對局（盤面重現）', !!backCells);
    await sleep(2000);
    const b2 = readBoard(G.document);
    const restored = Object.keys(filledByMe).filter(id => b2[id] === filledByMe[id]).length;
    check('數獨：填過的格子還原（2 格都在）', restored === 2, 'restored=' + restored + ' vals=' + JSON.stringify(Object.keys(filledByMe).map(id => b2[id])));
    check('數獨場零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
  }
  console.log('\n=== resume: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FATAL', e && e.stack || e); process.exit(2); });
