// WAITFOR_CAP_MS 放寬理由（甲案後半）：本套件含 1.3MB bundle 的 jsdom 開機等待（600s 寫法），上限放寬至 240 秒防解析尖峰誤殺；其餘 in-flow 等待仍受此上限快速失敗。
const WAITFOR_CAP_MS = 240000;
// 驗證（使用者 2026-10-28）：多人對戰我完賽後，畫面自動轉上帝模式（不用按鈕、不怕關掉打不開）
// 數獨：房主先解完 → 主盤面自動變上帝視角（自己的格子消失、god 總覽出現），成績卡關掉後仍在
// 數橋：來賓先解完 → 常駐觀戰面板自動出現（🏁 已完賽・觀戰中），成績卡關掉後仍在
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
let mock = require('./mockpeer.js');
mock = mock.replace("R.__msglog = R.__msglog || [];", "R.__msglog = R.__msglog || []; R.__fullog = R.__fullog || [];")
           .replace("if (pl && pl.type) R.__msglog.push({", "if (pl && pl.type) { try { R.__fullog.push(pl); } catch (e) {} R.__msglog.push({")
           .replace(": undefined }); } } catch (e) {}", ": undefined }); } } } catch (e) {}");
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errs.push(stamp(String(m))));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; try { w.localStorage.setItem('sudoku_input_mode', 'cell'); } catch (e) {} w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }

async function makeRoom(game, preStart) {
  const H = loadPage('H'); H.label = 'H';
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 600000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET && H.window.__PLAT_NET.code; }, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G'); G.label = 'G';
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 600000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 90000, 'G in room');
  // 現行開局（v1.11+ 房間頁，抄 test-v190）：切分頁 → 選大亂鬥 → 雙邊準備 → 房主開始 → 自動載入開賽
  const gname = game.startsWith('sudoku') ? 'sudoku' : 'hashi';
  const view = '#' + 'view-' + gname;
  for (const p of [H, G]) { // preboot：先載好遊戲，開始時才不卡
    p.window.PLAT_show(gname);
    await waitFor(() => !!p.window['__PLAT_HOOKS_' + gname], 300000, 'preboot ' + gname);
    p.window.PLAT_show('lobby');
  }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="' + gname + '"]'));
  await waitFor(() => G.window.__PLAT_NET && G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === gname, 30000, 'guest armed');
  const modeVal = gname === 'sudoku' ? 'brawl' : 'race'; // 數獨模式值叫 brawl、數橋叫 race（殼 hubModeBtn）
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="' + modeVal + '"][data-hub-game="' + gname + '"]'));
  await sleep(600);
  if (preStart) await preStart(H, G, view);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  await sleep(700);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 90000, 'start enabled');
  if (en) clickEl(H, en);
  await waitFor(() => H.window.__PLAT_NET.inMatch === gname && G.window.__PLAT_NET.inMatch === gname, 120000, 'inMatch');
  await sleep(1000);
  return { H, G, view };
}

// ---------- 數獨解題（抄 test-results：讀 DOM 題面→通用回溯解→格子先行填） ----------
function readBoard(D) {
  const cells = {};
  D.querySelectorAll('#view-sudoku g[id^="cell-"]').forEach(g => { const id = g.getAttribute('id').slice(5); const t = (g.textContent || '').trim(); cells[id] = t ? parseInt(t, 10) : 0; });
  return cells;
}
function solveN(board) {
  const ids = Object.keys(board);
  const N = Math.round(Math.sqrt(ids.length));
  const B = N === 4 ? 2 : 3;
  const grid = {}; ids.forEach(id => { grid[id] = board[id]; });
  const ok = (id, v) => { const [x, y] = id.split('-').map(Number); for (const o of ids) { if (o === id) continue; const [ox, oy] = o.split('-').map(Number); if (grid[o] === v && (ox === x || oy === y || (Math.floor(ox / B) === Math.floor(x / B) && Math.floor(oy / B) === Math.floor(y / B)))) return false; } return true; };
  const empties = ids.filter(id => !grid[id]);
  const bt = (i) => { if (i === empties.length) return true; const id = empties[i]; for (let v = 1; v <= N; v++) { if (ok(id, v)) { grid[id] = v; if (bt(i + 1)) return true; grid[id] = 0; } } return false; };
  bt(0); return grid;
}
async function fillCells(p, tag) {
  const sol = solveN(readBoard(p.document));
  let totalDone = 0;
  for (let passN = 0; passN < 5; passN++) {
    const cur = readBoard(p.document);
    const todo = Object.keys(cur).filter(id => !cur[id]);
    if (!todo.length) break;
    for (const id of todo) {
      const g = p.document.querySelector('#view-sudoku g[id="cell-' + id + '"]');
      if (!g) continue;
      clickEl(p, g);
      await sleep(90);
      const btns = [...p.document.querySelectorAll('#view-sudoku button')].filter(b => (b.textContent || '').trim() === String(sol[id]));
      if (!btns.length) { console.log(tag + ': no pad for ' + id); continue; }
      clickEl(p, btns[0]);
      totalDone++;
      await sleep(90);
    }
    await sleep(400);
  }
  console.log(tag + ': filled total ' + totalDone);
  return totalDone;
}

// ---------- 數橋解題（抄 probe-hashi-finish：solver + 拖曳，缺的用點按補） ----------
function solveHashi(islands) {
  const pairs = [];
  for (let i = 0; i < islands.length; i++) for (let j = i + 1; j < islands.length; j++) {
    const a = islands[i], b = islands[j];
    if (a.gx !== b.gx && a.gy !== b.gy) continue;
    const between = islands.some(k => k !== a && k !== b && ((a.gx === b.gx && k.gx === a.gx && k.gy > Math.min(a.gy, b.gy) && k.gy < Math.max(a.gy, b.gy)) || (a.gy === b.gy && k.gy === a.gy && k.gx > Math.min(a.gx, b.gx) && k.gx < Math.max(a.gx, b.gx))));
    if (!between) pairs.push([i, j]);
  }
  const crosses = (p, q) => {
    const [a, b] = [islands[p[0]], islands[p[1]]], [c, d] = [islands[q[0]], islands[q[1]]];
    const h1 = a.gy === b.gy, h2 = c.gy === d.gy;
    if (h1 === h2) return false;
    const H = h1 ? [a, b] : [c, d], V = h1 ? [c, d] : [a, b];
    return V[0].gx > Math.min(H[0].gx, H[1].gx) && V[0].gx < Math.max(H[0].gx, H[1].gx) && H[0].gy > Math.min(V[0].gy, V[1].gy) && H[0].gy < Math.max(V[0].gy, V[1].gy);
  };
  const counts = new Array(pairs.length).fill(0);
  const sums = islands.map(() => 0);
  const connected = () => {
    const adj = islands.map(() => []);
    pairs.forEach(([i, j], pi) => { if (counts[pi] > 0) { adj[i].push(j); adj[j].push(i); } });
    const seen = new Set([0]); const q = [0];
    while (q.length) { const u = q.shift(); adj[u].forEach(v => { if (!seen.has(v)) { seen.add(v); q.push(v); } }); }
    return seen.size === islands.length;
  };
  const dfs = (pi) => {
    if (pi === pairs.length) return sums.every((s, i) => s === islands[i].req) && connected();
    const [i, j] = pairs[pi];
    for (let c = 0; c <= 2; c++) {
      if (sums[i] + c > islands[i].req || sums[j] + c > islands[j].req) continue;
      if (c > 0) { let bad = false; for (let q = 0; q < pi; q++) if (counts[q] > 0 && crosses(pairs[pi], pairs[q])) { bad = true; break; } if (bad) continue; }
      counts[pi] = c; sums[i] += c; sums[j] += c;
      if (dfs(pi + 1)) return true;
      counts[pi] = 0; sums[i] -= c; sums[j] -= c;
    }
    return false;
  };
  if (!dfs(0)) return null;
  return pairs.map(([i, j], pi) => ({ a: islands[i], b: islands[j], count: counts[pi] })).filter(x => x.count > 0);
}
function pev(w, el, type, x, y) { const e = new w.Event(type, { bubbles: true, cancelable: true }); e.clientX = x; e.clientY = y; e.isPrimary = true; e.pointerId = 7; e.pointerType = 'mouse'; e.button = 0; e.buttons = (type === 'pointerup' ? 0 : 1); el.dispatchEvent(e); }


const barInfo = (p, gname) => { const dbg = p.window.PlatBar ? p.window.PlatBar._debug() : null; const n = p.document.querySelectorAll('#view-' + gname + ' [data-pb]').length; return { attached: !!(dbg && dbg.attached), mode0: dbg && dbg.mode0, pbBtns: n }; };
async function startAgain(H, G, gname, modeVal) {
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="' + gname + '"]'));
  await sleep(500);
  const en0 = H.document.querySelector('#lob-step-room [data-pr="start"]');
  if (!en0 || en0.disabled) {
    clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(500);
    clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  }
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 60000, 'start2 enabled');
  if (en) clickEl(H, en);
  await waitFor(() => H.window.__PLAT_NET.inMatch === gname && G.window.__PLAT_NET.inMatch === gname, 90000, 'inMatch2');
  await sleep(1000);
}


(async () => {
  let pass = 0, fail = 0; const fails = [];
  const ok = (c, l, x) => { if (c) { pass++; console.log('✅', l); } else { fail++; fails.push(l); console.log('❌', l, x !== undefined ? '— ' + x : ''); } };
  const setSelS = (w, s, v) => { const setter = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value').set; setter.call(s, v); s.dispatchEvent(new w.Event('change', { bubbles: true })); };
  const { H, G } = await makeRoom('sudoku-brawl', async (H2) => {
    const sels = H2.document.querySelectorAll('#lob-step-room [data-pr-slot="settings"] select');
    for (const s of sels) { const vals = [...s.options].map(o => o.value); if (vals.includes('4')) setSelS(H2.window, s, '4'); if (vals.includes('easy')) setSelS(H2.window, s, 'easy'); }
    await sleep(800);
  });
  await waitFor(() => { const cd = H.document.querySelector('#plat-countdown'); return !cd || cd.style.display !== 'flex'; }, 30000, 'cd over');
  await sleep(6500);
  ok(barInfo(H, 'sudoku').pbBtns > 0 && barInfo(G, 'sudoku').pbBtns > 0, '第一場：雙邊工具列在', JSON.stringify(barInfo(H, 'sudoku')));
  await fillCells(H, 'H solve');
  await fillCells(G, 'G solve');
  const res = await waitFor(() => { const pr = H.document.querySelector('#plat-results'); return pr && pr.style.display !== 'none' && [...pr.querySelectorAll('button')].some(b => (b.textContent || '').includes('再來一局')) ? pr : null; }, 60000, 'results with rematch');
  ok(!!res, '第一場結束：結算畫面有再來一局');
  const btn = [...res.querySelectorAll('button')].find(b => (b.textContent || '').includes('再來一局'));
  clickEl(H, btn);
  await sleep(1500);
  await waitFor(() => { const cd = H.document.querySelector('#plat-countdown'); return !cd || cd.style.display !== 'flex'; }, 30000, 'cd2 over');
  await sleep(6500);
  ok(H.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0, '第二場：房主新盤面在');
  const bH = barInfo(H, 'sudoku'), bG = barInfo(G, 'sudoku');
  ok(bH.attached && bH.pbBtns > 0, '第二場：房主工具列回來了（筆記/草稿/改大小那一欄）', JSON.stringify(bH));
  ok(bG.attached && bG.pbBtns > 0, '第二場：來賓工具列回來了', JSON.stringify(bG));
  // 工具列真的能用：點房主的模式鈕 → 模式往前跳一格
  const modeBtn = H.document.querySelector('#view-sudoku [data-pb="mode-press"]');
  ok(!!modeBtn, '第二場：模式鈕存在');
  if (modeBtn) { clickEl(H, modeBtn); await sleep(500); const mb2 = H.document.querySelector('#view-sudoku [data-pb="mode-press"]'); ok(!!mb2 && (mb2.textContent || '').includes('筆記'), '第二場：模式鈕可切到筆記', mb2 ? mb2.textContent : 'gone'); }
  ok(H.errors.length === 0 && G.errors.length === 0, '零錯誤', (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  console.log('\nRESULT rematch-bar: ' + pass + ' pass / ' + fail + ' fail' + (fails.length ? ' FAILS: ' + fails.join('；') : ''));
  H.window.close(); G.window.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
