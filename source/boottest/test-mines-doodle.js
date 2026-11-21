// 回歸（v1.49.0）：踩地雷塗鴉模式（比照數獨/數橋補上，之前獨缺）
// 單機：切塗鴉模式→在覆蓋層上拖一筆→strokes=1；切回挖開可正常挖格（覆蓋層不擋）。
// 合作：來賓畫一筆→房主同步看到；來賓清除自己的→房主同步歸零。競速不測同步（本地制、防偷看）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0; const fails = [];
function ok(cond, label, extra) { if (cond) { pass++; console.log('✅', label); } else { fail++; fails.push(label); console.log('❌', label, extra !== undefined ? '— ' + extra : ''); } }
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await new Promise(r => setTimeout(r, 120)); } console.log('⏱ timeout:', label); return null; }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sharedReg = {};
function loadPage(label) {
  const html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8')
    .replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
  const vc = new VirtualConsole(); const errors = [];
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(m); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { window.__SHARED_REG__ = sharedReg; window.scrollTo = () => {}; window.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errors.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors, label };
}
function drawStroke(p) {
  const svg = p.document.querySelector('#view-mines svg');
  if (!svg) return false;
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400, x: 0, y: 0 }); // jsdom 無 layout：給覆蓋層一個假幾何，handler 的正規化才算得出來
  const r = svg.getBoundingClientRect();
  const cx = x => r.left + r.width * x, cy = y => r.top + r.height * y;
  const fire = (type, x, y) => { const ev = new p.window.MouseEvent(type, { bubbles: true, clientX: cx(x), clientY: cy(y) }); Object.defineProperty(ev, 'pointerId', { value: 1 }); svg.dispatchEvent(ev); };
  fire('pointerdown', 0.2, 0.2); fire('pointermove', 0.45, 0.45); fire('pointermove', 0.7, 0.3); fire('pointerup', 0.7, 0.3);
  return true;
}
(async () => {
  // ---------- 單機塗鴉 ----------
  const P = loadPage('S');
  const dbgS = () => P.window.__PLAT_HOOKS_mines && P.window.__PLAT_HOOKS_mines.debug();
  await waitFor(() => (typeof P.window.PLAT_show === 'function' && P.window.PlatBar) ? true : null, 120000, 'shell');
  P.window.PLAT_show('mines');
  await waitFor(() => !!P.window.__PLAT_HOOKS_mines, 120000, 'mines hooks');
  await sleep(600);
  const clickBtnS = (pred) => { const b = [...P.document.querySelectorAll('button')].find(pred); if (b) { b.click(); return true; } return false; }; // 文件層級：PlatSetup overlay 在 body 層（F2）
  clickBtnS(b => b.textContent.includes('單機挑戰')); await sleep(250);
  clickBtnS(b => b.textContent.includes('9×9'));
  ok(!!(await waitFor(() => P.document.querySelectorAll('#mines-root button[data-cell]').length === 81 ? true : null, 30000, 'solo cells')), '單機 9×9 開局');
  ok(!P.document.querySelector('#mines-root [data-mode="draw"]'), '上方模式鈕組沒有塗鴉（使用者指示：塗鴉走右下角模式鈕）');
  const mpS = () => P.document.querySelector('#view-mines [data-pb="mode-press"]');
  ok(!!mpS(), '右下角有 PlatBar 模式鈕');
  mpS().click(); await sleep(200); mpS().click(); await sleep(300); // 挖開→插旗→塗鴉
  ok(dbgS().inputMode === 'draw', '模式鈕循環切到塗鴉模式', 'mode=' + (dbgS() && dbgS().inputMode));
  ok(drawStroke(P), '在覆蓋層拖一筆');
  await sleep(300);
  ok(dbgS().strokes === 1, '單機塗鴉留下一筆', 'strokes=' + (dbgS() && dbgS().strokes));
  ok(P.document.querySelectorAll('#view-mines svg path').length >= 1, '盤面上有塗鴉路徑渲染');
  clickBtnS(b => b.getAttribute('data-mode') === 'dig'); await sleep(200);
  const safeIdx = dbgS().layout.findIndex(v => !v);
  P.document.querySelectorAll('#mines-root button[data-cell]')[safeIdx].click(); await sleep(300);
  ok(dbgS().cells[safeIdx] === 'o', '切回挖開可正常挖格（覆蓋層不擋）');
  ok(P.errors.length === 0, '單機段零錯誤', P.errors[0] || '');

  // ---------- 合作同步 ----------
  const H = loadPage('H'), G = loadPage('G');
  const dbg = p => p.window.__PLAT_HOOKS_mines.debug();
  const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
  for (const p of [H, G]) { await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell'); p.window.PLAT_show('mines'); await waitFor(() => !!p.window.__PLAT_HOOKS_mines, 300000, p.label + ' preboot'); p.window.PLAT_show('lobby'); }
  H.window.PLAT_show('lobby');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '阿主'; clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; }, 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  G.window.PLAT_show('lobby');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '阿客';
  const ci = G.document.querySelector('#lob-code'); if (ci) ci.value = code;
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => (H.window.__PLAT_NET.roster.length >= 2 && G.window.__PLAT_NET.roster.length >= 2) ? true : null, 60000, 'roster2');
  // 房主切地雷分頁、合作模式（預設合作）、兩邊準備、開始
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="mines"]'));
  await sleep(800);
  for (const p of [H, G]) { const rb = p.document.querySelector('#lob-step-room [data-pr="ready"]'); if (rb && !rb.textContent.includes('已準備')) clickEl(p, rb); }
  const startB = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return (b && !b.disabled) ? b : null; }, 30000, 'host start');
  clickEl(H, startB);
  const playing = await waitFor(() => { const a = dbg(H), b = dbg(G); return (a.mp && a.mp.phase === 'playing' && b.mp && b.mp.phase === 'playing') ? true : null; }, 90000, 'coop playing');
  ok(!!playing, '合作開局雙邊 playing');
  // 來賓切塗鴉（右下角模式鈕循環兩下）、畫一筆
  const mpG = () => G.document.querySelector('#view-mines [data-pb="mode-press"]');
  if (mpG()) { mpG().click(); await sleep(200); mpG().click(); }
  await sleep(300);
  ok(dbg(G).inputMode === 'draw', '來賓切到塗鴉模式');
  drawStroke(G); await sleep(300);
  ok(dbg(G).strokes === 1, '來賓本地一筆');
  const synced = await waitFor(() => dbg(H).strokes === 1 ? true : null, 15000, 'host sees stroke');
  ok(!!synced, '房主同步看到來賓的塗鴉', 'H strokes=' + (dbg(H) && dbg(H).strokes));
  // 來賓清除自己的（透過 PlatBar 塗鴉子選單的橡皮擦雙擊＝清除自己全部）
  const eraser = G.document.querySelector('#view-mines [data-pb="draw-eraser"]');
  ok(!!eraser, '來賓 PlatBar 有塗鴉子選單（橡皮擦）');
  if (eraser) eraser.dispatchEvent(new G.window.MouseEvent('dblclick', { bubbles: true }));
  const cleared = await waitFor(() => (dbg(G).strokes === 0 && dbg(H).strokes === 0) ? true : null, 15000, 'clear synced');
  ok(!!cleared, '來賓清除自己的塗鴉 → 雙邊歸零', 'G=' + (dbg(G) && dbg(G).strokes) + ' H=' + (dbg(H) && dbg(H).strokes));
  ok(H.errors.length === 0 && G.errors.length === 0, '合作段零錯誤', (H.errors[0] || '') + '|' + (G.errors[0] || ''));

  console.log('\nRESULT mines-doodle: ' + pass + ' pass / ' + fail + ' fail' + (fails.length ? ' FAILS: ' + fails.join('；') : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
