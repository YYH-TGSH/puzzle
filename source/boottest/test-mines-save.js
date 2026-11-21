// 踩地雷存檔/讀檔（v1.42，Q1 拍板：比照數獨/數橋代碼式）
// 驗：單機開局挖幾格+插旗 → 開存檔 modal → 產生代碼 → 重開新局（盤面清空）→ 貼碼載入 → 盤面/旗/計時還原；壞代碼被拒
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
const html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8')
  .replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0; const fails = [];
function ok(cond, label) { if (cond) { pass++; console.log('✅', label); } else { fail++; fails.push(label); console.log('❌', label); } }
async function waitFor(fn, ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await new Promise(r => setTimeout(r, 120)); }
  console.log('⏱ timeout:', label); return null;
}
const errors = [];
async function main() {
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errors.push(stamp(String(m))));
  const dom = new JSDOM(html, {
    url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) {
      window.__SHARED_REG__ = {};
      window.scrollTo = () => {};
      window.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errors.push(stamp(e.message, e.error && e.error.stack)); });
    }
  });
  const w = dom.window, d = w.document;
  await waitFor(() => typeof w.PLAT_show === 'function' && w.PlatDock && d.querySelector('#view-home button'), 120000, 'shell ready');
  w.PLAT_show('mines');
  await waitFor(() => d.querySelector('#mines-root h1'), 60000, 'mines home');
  const dbg = () => w.__PLAT_HOOKS_mines && w.__PLAT_HOOKS_mines.debug && w.__PLAT_HOOKS_mines.debug();
  await waitFor(() => dbg(), 10000, 'debug hook');
  const clickBtn = (pred, scope) => { const b = [...(scope || d).querySelectorAll('button')].find(pred); if (b) { b.click(); return true; } return false; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // 開局：單機挑戰 → 9x9
  ok(clickBtn(b => b.textContent.includes('單機挑戰'), d.querySelector('#mines-root')), '點單機挑戰');
  await sleep(300);
  ok(clickBtn(b => b.textContent.includes('9×9') || b.textContent.includes('9x9'), d.querySelector('#plat-setup')), '選 9x9'); // 設定已收編殼 PlatSetup（F2）
  await waitFor(() => dbg() && dbg().cells, 10000, 'board ready');

  // 挖開幾格安全格（每挖一格都重讀目前 layout：首點保護會搬雷，舊 layout 的安全格可能被搬進雷）
  for (let k = 0; k < 3; k++) {
    const g = dbg();
    const ix = g.layout.findIndex((v, i) => !v && g.cells[i] === 'h');
    if (ix < 0) break;
    const el = d.querySelector('#mines-root button[data-cell="' + ix + '"]');
    if (el) el.click();
    await sleep(250);
  }
  // 插一支旗（切插旗模式點一顆雷）
  const mineIx = dbg().layout.findIndex(v => v);
  clickBtn(b => b.getAttribute('data-mode') === 'flag', d.querySelector('#mines-root'));
  await sleep(150);
  { const el = d.querySelector('#mines-root button[data-cell="' + mineIx + '"]'); if (el) el.click(); }
  await sleep(300);
  const snap = dbg();
  const snapCells = (snap.cells || []).join('');
  ok(snapCells.includes('o') && snapCells.includes('f'), '已挖開+已插旗（存檔前狀態）', );

  // 開存檔 modal → 產生代碼
  ok(clickBtn(b => b.textContent.includes('存檔'), d.querySelector('#mines-root')), '點存檔鈕');
  await sleep(300);
  ok(!!d.querySelector('#saveCodeTextarea'), '存檔 modal 出現');
  ok(clickBtn(b => b.textContent.includes('產生進度代碼'), d.querySelector('#mines-root')), '點產生代碼');
  await sleep(300);
  const code = d.querySelector('#saveCodeTextarea').value;
  ok(code.length > 40, '代碼已產生（len=' + code.length + '）');
  ok(clickBtn(b => b.textContent.includes('關閉'), d.querySelector('#mines-root')), '關閉 modal');
  await sleep(200);

  // 重開新局 → 盤面應清空
  ok(clickBtn(b => b.textContent.includes('重開'), d.querySelector('#mines-root')), '點重開');
  await sleep(400);
  const fresh = dbg();
  ok((fresh.cells || []).every(c => c === 'h'), '重開後盤面清空');

  // 再開存檔 modal → 貼碼 → 載入
  ok(clickBtn(b => b.textContent.includes('存檔'), d.querySelector('#mines-root')), '再點存檔鈕');
  await sleep(300);
  const ta = d.querySelector('#saveCodeTextarea');
  const setter = Object.getOwnPropertyDescriptor(w.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(ta, code);
  ta.dispatchEvent(new w.Event('input', { bubbles: true }));
  ta.dispatchEvent(new w.Event('change', { bubbles: true }));
  await sleep(200);
  ok(clickBtn(b => b.textContent.includes('載入代碼'), d.querySelector('#mines-root')), '點載入代碼');
  await sleep(400);
  const back = dbg();
  ok((back.cells || []).join('') === snapCells, '載入後盤面與存檔時一致');
  ok(back.seed === snap.seed, '種子一致');

  // 壞代碼被拒（盤面不變）
  ok(clickBtn(b => b.textContent.includes('存檔'), d.querySelector('#mines-root')), '三點存檔鈕');
  await sleep(300);
  const ta2 = d.querySelector('#saveCodeTextarea');
  setter.call(ta2, 'not-a-real-code!!!');
  ta2.dispatchEvent(new w.Event('input', { bubbles: true }));
  await sleep(200);
  clickBtn(b => b.textContent.includes('載入代碼'), d.querySelector('#mines-root'));
  await sleep(300);
  ok((dbg().cells || []).join('') === snapCells, '壞代碼被拒、盤面不變');

  ok(errors.length === 0, '零錯誤' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  console.log('\nRESULT mines-save: ' + pass + ' pass / ' + fail + ' fail' + (fails.length ? ' FAILS: ' + fails.join('；') : ''));
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('FATAL', e); process.exit(2); });
