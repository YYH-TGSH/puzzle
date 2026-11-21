// 複現（使用者 2026-10-26）：錦標賽數獨選 16×16 → 斷線進不去
// 根因：16×16 普通/困難的唯一解驗證單次可卡主執行緒 30–100+ 秒，殼與遊戲心跳全凍結
// 修復驗證：16×16 普通局雙頁進場、生成不長卡、開局、來賓填格同步（DOM/互動判定，不用存檔格式）
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
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.localStorage.setItem('sudoku_input_mode', 'number'); w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
function getSolution() { const log = SHARED_REG.__fullog || []; for (let i = log.length - 1; i >= 0; i--) { const d = log[i]; if (d && d.data) { if (d.data.solutionGrid) return d.data.solutionGrid; if (d.data.levelData && d.data.levelData.solutionGrid) return d.data.levelData.solutionGrid; } } return null; }
async function joinAs(p, name, code) {
  p.window.localStorage.setItem('plat_name', name);
  if (code) { click(p, '#lob-go-join'); } else { click(p, '#lob-go-create'); }
  await waitFor(() => p.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, p.label + ' nick');
  p.document.querySelector('#lob-name').value = name;
  if (code) p.document.querySelector('#lob-code').value = code;
  click(p, '#lob-confirm');
  await waitFor(() => hubRoom(p), 60000, p.label + ' room');
}
async function main() {
  const H = loadPage('H'); const G = loadPage('G');
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' ready'); if (!ok) { console.log('NOT READY', p.label); process.exit(2); } }
  await joinAs(H, '房主甲', null);
  const code = H.window.__PLAT_NET.code;
  await joinAs(G, '來賓乙', code);
  await waitFor(() => H.window.__PLAT_NET.roster.length >= 2, 30000, 'roster2');
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  await waitFor(() => H.document.querySelector('#lob-tourn-setup'), 30000, 'tourn setup');
  const set = (id, v) => { const el = H.document.querySelector(id); if (el) { el.value = v; el.dispatchEvent(new H.window.Event('change', { bubbles: true })); } };
  set('#t-rounds', '3'); set('#t-order', 'alt-s'); set('#ts-size', '16'); set('#ts-diff', 'medium'); set('#ts-wtime', '0');
  click(H, '#t-start');
  const r1 = await waitFor(() => (H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.inMatch === 'sudoku') ? true : null, 90000, 'R1 sudoku');
  check('R1 進數獨（16×16）', !!r1);
  for (const p of [H, G]) { const rb = await waitFor(() => [...p.document.querySelectorAll('#view-sudoku button')].find(x => (x.textContent || '').trim() === '✋ 準備好了') || null, 90000, p.label + ' ready btn'); clickEl(p, rb); await sleep(600); }
  // 等待期間定期重點準備鈕（jsdom 時序：太早點的 REQ_READY 可能沒送達；真人流程等待卡出現時連線已就緒）
  const sb = await waitFor(() => {
    const b = [...H.document.querySelectorAll('#view-sudoku button')].find(x => (x.textContent || '').includes('開始本局'));
    if (b && !b.disabled) return b;
    for (const p of [H, G]) { const rb = [...p.document.querySelectorAll('#view-sudoku button')].find(x => (x.textContent || '').trim() === '✋ 準備好了'); if (rb) clickEl(p, rb); }
    return null;
  }, 100000, 'start enabled');
  check('房主可開始本局', !!sb);
  // 頁面內探針：量房主頁面事件迴圈最大間隔（修前生成會凍結 30–100+ 秒）
  H.window.__gapMax = 0; H.window.__gapLast = Date.now();
  H.window.__gapTimer = H.window.setInterval(() => { const n = Date.now(); if (n - H.window.__gapLast > H.window.__gapMax) H.window.__gapMax = n - H.window.__gapLast; H.window.__gapLast = n; }, 100);
  const tGen = Date.now();
  clickEl(H, sb);
  const playing = await waitFor(() => {
    const cells = H.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length;
    const txt = H.document.querySelector('#view-sudoku').textContent || '';
    return (cells === 256 && txt.includes('16x16') && !txt.includes('準備好了')) ? true : null;
  }, 120000, 'playing 16x16');
  const genSecs = ((Date.now() - tGen) / 1000).toFixed(1);
  H.window.clearInterval(H.window.__gapTimer);
  const gapMax = H.window.__gapMax || 0;
  check('16×16 開局完成（房主盤面 256 格渲染）', !!playing, 'genSecs=' + genSecs);
  console.log('  生成+開局 ' + genSecs + 's，房主頁面最大事件間隔 ' + (gapMax / 1000).toFixed(2) + 's');
  check('生成期間頁面未長卡（最大間隔 < 5s）', gapMax < 5000, (gapMax / 1000).toFixed(2) + 's');
  const gCells = G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length;
  check('來賓盤面 256 格（沒斷線、進得去）', gCells === 256, 'cells=' + gCells);
  const sol = getSolution();
  check('取得解答（同步流量正常）', !!sol);
  await sleep(7000); // 等開局倒數（5.5s）結束，格子才解鎖
  if (sol) {
    const before = (SHARED_REG.__msglog || []).length;
    const cells = [...G.document.querySelectorAll('#view-sudoku g[id^="cell-"]')];
    const empty = cells.find(g => !(g.textContent || '').trim());
    const id = empty.getAttribute('id').replace('cell-', '');
    const [cx, cy] = id.split('-').map(Number);
    const pad = [...G.document.querySelectorAll('#view-sudoku button')].find(b => (b.textContent || '').trim() === String(sol[cy][cx]));
    clickEl(G, pad); await sleep(150);
    clickEl(G, empty); await sleep(1000);
    const flowed = (SHARED_REG.__msglog || []).slice(before).some(m => m.type === 'GHOST_SOLVED');
    check('來賓填格成功且同步到房主（GHOST_SOLVED）', (empty.textContent || '').trim() === String(sol[cy][cx]) && flowed, 'cell=' + (empty.textContent || '').trim());
    check('雙邊仍在賽局中', H.window.__PLAT_NET.inMatch === 'sudoku' && G.window.__PLAT_NET.inMatch === 'sudoku');
  }
  console.log('H errors:', H.errors.length, H.errors.slice(0, 3));
  console.log('G errors:', G.errors.length, G.errors.slice(0, 3));
  check('雙邊零錯誤', H.errors.length === 0 && G.errors.length === 0);
  console.log('RESULT: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('FATAL', e); process.exit(2); });
