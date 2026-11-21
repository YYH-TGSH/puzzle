// 重現（使用者 2026-11-01 實機）：數獨競賽（brawl）完賽後按「再來一局」，雙邊倒數一直 6→5→6→5 跳、進不了盤面；
// 且自己的進度條恆滿。用法：RAINBOW=host|guest|none node repro-sudoku-rematch.js
// 流程：雙頁 hub 房 → sudoku brawl 4x4 easy → 雙邊完賽 → 房主按再來一局 → 取樣倒數序列 14 秒 + 量測進度條
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
const RAINBOW = process.env.RAINBOW || 'none';
function loadPage(label) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; try { w.localStorage.setItem('sudoku_input_mode', 'cell'); } catch (e) {} w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }

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
async function fillCells(p, tag, maxCells) {
  const sol = solveN(readBoard(p.document));
  let done = 0;
  for (let passN = 0; passN < 5; passN++) {
    const cur = readBoard(p.document);
    const todo = Object.keys(cur).filter(id => !cur[id]);
    if (!todo.length) break;
    for (const id of todo) {
      if (maxCells && done >= maxCells) return done;
      const g = p.document.querySelector('#view-sudoku g[id="cell-' + id + '"]');
      if (!g) continue;
      clickEl(p, g);
      await sleep(80);
      const btns = [...p.document.querySelectorAll('#view-sudoku button')].filter(b => (b.textContent || '').trim() === String(sol[id]));
      if (!btns.length) continue;
      clickEl(p, btns[0]);
      done++;
      await sleep(80);
    }
    await sleep(300);
  }
  console.log(tag + ': filled ' + done);
  return done;
}
// 量測自己的進度條：回傳 {pctText, barWidth}（在玩家條裡找含自己名字的卡片）
function myProgress(p, myName) {
  const cards = [...p.document.querySelectorAll('#view-sudoku div')].filter(d => (d.textContent || '').includes(myName) && (d.textContent || '').includes('%'));
  cards.sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length);
  for (const c of cards) {
    const m = /(\d+)%/.exec(c.textContent || '');
    const bar = [...c.querySelectorAll('div')].find(d => (d.style.width || '').includes('%'));
    if (m && bar) return { pctText: parseInt(m[1], 10), barWidth: bar.style.width };
  }
  return null;
}
function cdText(p) { const cd = p.document.querySelector('#plat-countdown'); if (!cd || cd.style.display === 'none') return '-'; const m = /\d+/.exec(cd.textContent || ''); return m ? m[0] : 'on'; }

(async () => {
  const H = loadPage('H');
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 600000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  if (RAINBOW === 'host') { H.window.__PLAT_NET.me.color = 'rainbow'; H.window.__PLAT_NET.colorPicked = true; }
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET && H.window.__PLAT_NET.code; }, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G');
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 600000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  if (RAINBOW === 'guest') { G.window.__PLAT_NET.me.color = 'rainbow'; G.window.__PLAT_NET.colorPicked = true; }
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 90000, 'G in room');
  for (const p of [H, G]) { p.window.PLAT_show('sudoku'); await waitFor(() => !!p.window.__PLAT_HOOKS_sudoku, 300000, 'preboot'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await waitFor(() => G.window.__PLAT_NET && G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === 'sudoku', 30000, 'guest armed');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="brawl"][data-hub-game="sudoku"]'));
  await sleep(600);
  const setSel = (w, s, v) => { const setter = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value').set; setter.call(s, v); s.dispatchEvent(new w.Event('change', { bubbles: true })); };
  const sels = H.document.querySelectorAll('#lob-step-room [data-pr-slot="settings"] select');
  for (const s of sels) { const vals = [...s.options].map(o => o.value); if (vals.includes('4')) setSel(H.window, s, '4'); if (vals.includes('easy')) setSel(H.window, s, 'easy'); }
  await sleep(800);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  await sleep(700);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 90000, 'start enabled');
  if (en) clickEl(H, en);
  await waitFor(() => H.window.__PLAT_NET.inMatch === 'sudoku' && G.window.__PLAT_NET.inMatch === 'sudoku', 120000, 'inMatch');
  await sleep(7000); // 過第一局倒數
  check('第一局雙邊有盤面', H.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 && G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0);
  // 進度條量測：房主只填 2 格，自己的進度不該滿
  await fillCells(H, 'H partial', 2);
  await sleep(1500);
  const progH = myProgress(H, '阿主');
  const progG = myProgress(G, '阿客');
  console.log('進度條 H看自己(填2格):', JSON.stringify(progH), '| G看自己(未填):', JSON.stringify(progG));
  check('房主填 2 格後自己進度條不是滿的', !!progH && progH.pctText < 100, JSON.stringify(progH));
  check('來賓未填時自己進度條不是滿的', !!progG && progG.pctText < 100, JSON.stringify(progG));
  if (RAINBOW !== 'none') { // 彩虹漸層層必須被定位+裁切在填色層內，否則視覺恆滿（jsdom 無 layout，用 class 結構斷言）
    const who = RAINBOW === 'host' ? [H, '阿主'] : [G, '阿客'];
    const cards = [...who[0].document.querySelectorAll('#view-sudoku div')].filter(d => (d.textContent || '').includes(who[1]) && (d.textContent || '').includes('%'));
    cards.sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length);
    let fillCls = null;
    for (const c of cards) { const f = [...c.querySelectorAll('div')].find(d => (d.style.width || '').includes('%')); if (f) { fillCls = f.className; break; } }
    check('彩虹進度填色層有 relative+overflow-hidden', !!fillCls && fillCls.includes('relative') && fillCls.includes('overflow-hidden'), String(fillCls));
  }
  // 雙邊完賽
  await fillCells(H, 'H solve');
  await fillCells(G, 'G solve');
  const resH = await waitFor(() => { const pr = H.document.querySelector('#plat-results'); return pr && pr.style.display !== 'none' && [...pr.querySelectorAll('button')].some(b => (b.textContent || '').includes('再來一局')) ? pr : null; }, 90000, 'H results+rematch');
  check('第一局結算出現（房主，含再來一局）', !!resH);
  const resG = await waitFor(() => { const pr = G.document.querySelector('#plat-results'); return pr && pr.style.display !== 'none' ? pr : null; }, 30000, 'G results');
  check('第一局結算出現（來賓）', !!resG);
  // 按再來一局（房主端 PlatResults 的 rematch）
  const rematchBtn = resH ? [...resH.querySelectorAll('button')].find(b => (b.textContent || '').includes('再來一局')) : null;
  check('找到再來一局按鈕', !!rematchBtn);
  clickEl(H, rematchBtn);
  // 取樣 16 秒倒數序列
  const seqH = [], seqG = [];
  const t0 = Date.now();
  let lastH = '', lastG = '';
  while (Date.now() - t0 < 16000) {
    const a = cdText(H), b = cdText(G);
    if (a !== lastH) { seqH.push(a); lastH = a; }
    if (b !== lastG) { seqG.push(b); lastG = b; }
    await sleep(150);
  }
  console.log('RAINBOW=' + RAINBOW + ' 倒數序列 H:', seqH.join(','), '| G:', seqG.join(','));
  const cellsH2 = H.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length;
  const cellsG2 = G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length;
  console.log('16 秒後盤面 cells H=' + cellsH2 + ' G=' + cellsG2 + ' cdH=' + cdText(H) + ' cdG=' + cdText(G));
  const looped = (seq) => { const nums = seq.filter(s => /^\d+$/.test(s)).map(Number); let resets = 0; for (let i = 1; i < nums.length; i++) if (nums[i] > nums[i - 1]) resets++; return resets >= 2; };
  check('第二局倒數沒有反覆重設（H）', !looped(seqH), seqH.join(','));
  check('第二局倒數沒有反覆重設（G）', !looped(seqG), seqG.join(','));
  check('第二局已進盤面（雙邊）', cellsH2 > 0 && cellsG2 > 0 && cdText(H) === '-' && cdText(G) === '-', 'cellsH=' + cellsH2 + ' cellsG=' + cellsG2);
  check('零錯誤', H.errors.length === 0 && G.errors.length === 0, JSON.stringify(H.errors.slice(0, 2)) + JSON.stringify(G.errors.slice(0, 2)));
  console.log('RESULT(RAINBOW=' + RAINBOW + '): ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
