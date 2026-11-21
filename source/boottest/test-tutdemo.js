// Q6 教學互動 demo（v1.46）：數獨卡1 可點數字鍵試填（對/錯回饋）、地雷卡1 可真的挖 3×3（踩雷/全清回饋）
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
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clickBtn = (pred, scope) => { const b = [...(scope || d).querySelectorAll('button')].find(pred); if (b) { b.click(); return true; } return false; };
  await waitFor(() => typeof w.PLAT_show === 'function' && w.PlatDock && d.querySelector('#view-home button'), 120000, 'shell ready');

  // ---------- 數獨 ----------
  w.PLAT_show('sudoku');
  await waitFor(() => d.querySelector('#view-sudoku h1'), 60000, 'sudoku home');
  ok(clickBtn(b => b.textContent.includes('玩法教學'), d.querySelector('#view-sudoku')), '數獨：開教學');
  await sleep(400);
  ok([...d.querySelectorAll('#view-sudoku p')].some(x => x.textContent.includes('動手試試')), '數獨：卡1 是互動 demo（有邀請文案）');
  ok(clickBtn(b => b.textContent.trim() === '9', d.querySelector('#view-sudoku')), '數獨：按數字鍵 9（錯）');
  await sleep(300);
  ok([...d.querySelectorAll('#view-sudoku p')].some(x => x.textContent.includes('不對喔')), '數獨：填錯有回饋');
  ok(clickBtn(b => b.textContent.trim() === '8', d.querySelector('#view-sudoku')), '數獨：按數字鍵 8（對）');
  await sleep(300);
  ok([...d.querySelectorAll('#view-sudoku p')].some(x => x.textContent.includes('答對了')), '數獨：答對有回饋');
  ok(clickBtn(b => b.textContent.includes('跳過'), d.querySelector('#view-sudoku')), '數獨：關教學');
  // 框框等高（v1.46.3）：四張卡都帶固定高度 class、按鈕列在第 1 頁有佔位（3 格）
  ok(clickBtn(b => b.textContent.includes('玩法教學'), d.querySelector('#view-sudoku')), '數獨：重開教學驗等高');
  await sleep(300);
  ok([...d.querySelectorAll('#view-sudoku div')].filter(x => (x.className || '').includes('h-[400px]')).length === 4, '數獨：四張教學卡同高（h-[400px]）');
  ok(clickBtn(b => b.textContent.includes('跳過'), d.querySelector('#view-sudoku')), '數獨：再關教學');

  // ---------- 踩地雷 ----------
  w.PLAT_show('mines');
  await waitFor(() => d.querySelector('#mines-root h1'), 60000, 'mines home');
  const root = d.querySelector('#mines-root');
  const demoCells = () => [...root.querySelectorAll('button')].filter(b => b.textContent === '');
  ok(clickBtn(b => b.textContent.includes('玩法教學'), root), '地雷：開教學');
  await sleep(400);
  const modeCardHidden = () => { const p = [...root.querySelectorAll('p')].find(x => x.textContent.includes('多人競速')); const card = p && p.closest('div.bg-white'); return card ? card.className.includes('hidden') : null; };
  ok([...root.querySelectorAll('div')].filter(x => (x.className || '').includes('h-[400px]')).length === 4, '地雷：四張教學卡同高（h-[400px]，模式介紹已併入末卡）');
  ok(modeCardHidden() === true, '地雷：模式介紹卡在第 1 頁不出現（只出現一次）');
  ok(demoCells().length === 9, '地雷：卡1 有 9 格可點的 demo 盤（實際 ' + demoCells().length + '）');
  // 踩雷路徑：點第 3 格（index 2 = 雷）
  demoCells()[2].click();
  await sleep(300);
  ok([...root.querySelectorAll('p')].some(x => x.textContent.includes('踩到地雷了')), '地雷：踩雷有回饋');
  ok(clickBtn(b => b.textContent.includes('再試一次'), root), '地雷：再試一次');
  await sleep(300);
  ok(demoCells().length === 9, '地雷：重置後又是 9 格');
  // 全清路徑：依序點所有安全格（每次重抓清單，點第一個未開的）
  for (let k = 0; k < 10; k++) {
    const cellsNow = demoCells();
    if (cellsNow.length <= 1) break;
    // 安全格是除了 index 對應雷位以外的；demoCells 會隨開啟縮減，雷永遠是剩下的其中一格——用位置判斷不可靠，改點「非第3個位置」：初始順序固定時雷在第 3 格
    const target = cellsNow.length === 9 ? cellsNow[0] : cellsNow[0];
    target.click();
    await sleep(150);
  }
  await sleep(300);
  const doneP = [...root.querySelectorAll('p')].some(x => x.textContent.includes('全部挖開了'));
  ok(doneP, '地雷：挖完安全格有完成回饋（剩餘未開格=' + demoCells().length + '）');
  // 步進器還能走完
  for (let s2 = 0; s2 < 3; s2++) { clickBtn(b => b.textContent.includes('下一步'), root); await sleep(200); }
  ok(modeCardHidden() === false, '地雷：模式介紹卡只在最後一頁出現');
  ok(clickBtn(b => b.textContent.includes('開始遊戲'), root), '地雷：步進走到開始遊戲關閉');

  // ---------- 數橋（v1.47.0 與另兩款同骨架：奶油紙面＋標題＋白卡＋同款點/鈕） ----------
  w.PLAT_show('hashi');
  await waitFor(() => d.querySelector('#view-hashi h1'), 60000, 'hashi home');
  ok(clickBtn(b => b.textContent.includes('玩法教學'), d.querySelector('#view-hashi')), '數橋：開教學');
  await sleep(400);
  const hTut = [...d.querySelectorAll('#view-hashi h2')].find(x => x.textContent.includes('玩法教學'));
  ok(!!hTut && (hTut.className || '').includes('border-[#4ade80]'), '數橋：教學有同款標題（❓ 玩法教學＋代表色底線）');
  ok([...d.querySelectorAll('#view-hashi div')].some(x => (x.className || '').includes('h-[400px]') && (x.className || '').includes('bg-white')), '數橋：教學步驟是同款白卡（h-[400px]）');
  ok([...d.querySelectorAll('#view-hashi button')].some(b => b.textContent.trim() === '✕'), '數橋：教學有同款 ✕ 關閉鈕');
  let stepsOk = true;
  for (let i = 0; i < 5; i++) { if (!clickBtn(b => b.textContent.includes('下一步'), d.querySelector('#view-hashi'))) { stepsOk = false; break; } await sleep(200); }
  ok(stepsOk, '數橋：教學可翻完 6 步');
  ok(clickBtn(b => b.textContent.includes('開始遊戲'), d.querySelector('#view-hashi')), '數橋：末步開始遊戲關教學');

  ok(errors.length === 0, '零錯誤' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  console.log('\nRESULT tutdemo: ' + pass + ' pass / ' + fail + ' fail' + (fails.length ? ' FAILS: ' + fails.join('；') : ''));
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('FATAL', e); process.exit(2); });
