// 回歸（v1.54.2）：地雷點按管線——舊版動作只靠 click：手指抬起滾到鄰格（真機常態）時 click 被漂移檢查吞掉，
// 出現「按鈕有壓感反應、卻不插旗/不打開/不和弦」（使用者實機回報）。
// 新版：pointerup 在按下那格執行（漂移 ≤22px 照算）；滑太遠（捲動）取消；pointerup 後的 click 不得重複觸發。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0; const errors = [];
function ok(c, l) { if (c) { pass++; console.log('✅', l); } else { fail++; console.log('❌', l); } }
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await new Promise(r => setTimeout(r, 120)); } console.log('⏱', label); return null; }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function main() {
  const html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8')
    .replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(m); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { window.__SHARED_REG__ = {}; window.scrollTo = () => {}; window.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errors.push(e.message); }); } });
  const w = dom.window, d = w.document;
  await waitFor(() => typeof w.PLAT_show === 'function' && w.PlatDock && d.querySelector('#view-home button'), 120000, 'shell');
  w.PLAT_show('mines');
  await waitFor(() => d.querySelector('#mines-root h1'), 60000, 'mines home');
  const dbg = () => w.__PLAT_HOOKS_mines && w.__PLAT_HOOKS_mines.debug && w.__PLAT_HOOKS_mines.debug();
  await waitFor(() => dbg(), 10000, 'debug');
  const clickBtn = pred => { const b = [...d.querySelectorAll('button')].find(pred); if (b) { b.click(); return true; } return false; }; // 文件層級：PlatSetup overlay 在 body 層（F2）
  clickBtn(b => b.textContent.includes('單機挑戰'));
  await sleep(250);
  clickBtn(b => b.textContent.includes('9×9'));
  const cellEls = () => [...d.querySelectorAll('#mines-root button[data-cell]')];
  await waitFor(() => cellEls().length === 81, 15000, '81 cells');
  const pev = (el, type, x, y) => { const e = new w.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }); el.dispatchEvent(e); };
  const snap = () => dbg();
  // 情景 1：按下後滾到鄰格放開（12px 漂移）→ 仍要對「按下那格」執行
  let s0 = snap();
  const iSafe = s0.cells.findIndex((c, i) => c === 'h' && !s0.layout[i] && i % 9 !== 8);
  pev(cellEls()[iSafe], 'pointerdown', 100, 100);
  pev(cellEls()[iSafe + 1], 'pointerup', 112, 100);
  await sleep(150);
  ok(snap().cells[iSafe] === 'o', '滾到鄰格放開（12px）：按下那格照樣打開 (' + snap().cells[iSafe] + ')');
  // 情景 2：滑太遠（60px）放開 = 捲動意圖 → 不執行
  s0 = snap();
  const iFar = s0.cells.findIndex((c, i) => c === 'h' && !s0.layout[i]);
  pev(cellEls()[iFar], 'pointerdown', 100, 100);
  pev(cellEls()[iFar], 'pointerup', 160, 100);
  await sleep(150);
  ok(snap().cells[iFar] === 'h', '滑 60px 放開：不執行（捲動）');
  // 情景 3：完整點按（down/up 同格＋緊接 click）→ 只執行一次（切插旗模式驗切換次數）
  const modeBtn = await waitFor(() => d.querySelector('#mines-root [data-pb="mode-press"]'), 10000, 'mode btn');
  modeBtn.click(); await sleep(200);
  ok(snap().inputMode === 'flag', '已切到插旗模式 (' + snap().inputMode + ')');
  s0 = snap();
  const iFlag = s0.cells.findIndex((c, i) => c === 'h');
  pev(cellEls()[iFlag], 'pointerdown', 100, 100);
  pev(cellEls()[iFlag], 'pointerup', 102, 101);
  cellEls()[iFlag].click(); // click 尾巴：不得再切換一次
  await sleep(150);
  ok(snap().cells[iFlag] === 'f', '完整點按＋click 尾巴：旗只插一次 (' + snap().cells[iFlag] + ')');
  pev(cellEls()[iFlag], 'pointerdown', 100, 100);
  pev(cellEls()[iFlag], 'pointerup', 100, 100);
  cellEls()[iFlag].click();
  await sleep(150);
  ok(snap().cells[iFlag] === 'h', '再點一次：旗拔掉（同樣只切換一次） (' + snap().cells[iFlag] + ')');
  // 情景 4：純 click（無 pointer 前置，鍵盤/程式路徑）→ 照常執行
  cellEls()[iFlag].click();
  await sleep(150);
  ok(snap().cells[iFlag] === 'f', '純 click 備援路徑照常插旗 (' + snap().cells[iFlag] + ')');
  ok(errors.length === 0, '零頁面錯誤 ' + JSON.stringify(errors.slice(0, 2)));
  console.log('RESULT mines-tap: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR', e); process.exit(2); });
