// 踩地雷第一段：單機全流程（jsdom）
// 驗：平台首頁第三張卡 → 進遊戲 → 9×9 開局/首點保護/挖開/插旗/踩雷出局/全清獲勝 → 16×16 開局
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
  const ready = await waitFor(() => typeof w.PLAT_show === 'function' && w.PlatDock && d.querySelector('#view-home button'), 120000, 'shell ready');
  ok(!!ready, '殼就緒');

  // 首頁第三張卡存在
  const homeBtns = [...d.querySelectorAll('#view-home button')].map(b => b.textContent);
  ok(homeBtns.some(t => t.includes('踩地雷')), '首頁有踩地雷卡片: ' + homeBtns.join(' | '));

  w.PLAT_show('mines');
  const root = await waitFor(() => d.querySelector('#mines-root h1'), 60000, 'mines home');
  ok(!!root && root.textContent.includes('踩地雷'), '踩地雷主畫面渲染');
  const dbg = () => w.__PLAT_HOOKS_mines && w.__PLAT_HOOKS_mines.debug && w.__PLAT_HOOKS_mines.debug();
  ok(!!(await waitFor(() => dbg(), 10000, 'debug hook')), 'debug 快照可用');

  const clickBtn = (pred, scope) => { const b = [...(scope || d).querySelectorAll('button')].find(pred); if (b) { b.click(); return true; } return false; };
  const cellEls = () => [...d.querySelectorAll('#mines-root button[data-cell]')];
  const specLabel = () => { const el = d.querySelector('#mines-root [data-ptc-spec], #mines-root [data-ptc="spec"]'); return el ? (el.textContent || '').trim() : ''; }; // 規格籤已收編殼 PlatTopCard（F2；可點版是 button[data-ptc=spec]）
  const labelOk = (want) => { const t = specLabel(); return t.includes(want) && (t.match(/雷/g) || []).length === 1; }; // v1.66.2：雷數只印一次

  // --- 主畫面同款結構：四顆鈕、難度不在主畫面 ---
  const homeTexts = [...d.querySelectorAll('#mines-root button')].map(b => b.textContent);
  ok(homeTexts.some(t => t.includes('單機挑戰')) && homeTexts.some(t => t.includes('每日一題')) && homeTexts.some(t => t.includes('玩法教學')) && homeTexts.some(t => t.includes('回大廳')), '主畫面四顆鈕齊全（單機挑戰/每日一題/玩法教學/回大廳）');
  ok(!homeTexts.some(t => t.includes('16×16')), '主畫面不直接露出難度');
  // 框架一致性（使用者 2026-10-28 截圖糾正）：底部列只掛對局畫面——主畫面不得出現 PlatBar 工具鈕，靜音鈕也不在主畫面
  ok(d.querySelectorAll('#mines-root [data-pb]').length === 0, '主畫面沒有底部列工具鈕（縮放/模式）');
  ok(!homeTexts.some(t => t.includes('🔊') || t.includes('🔇')), '主畫面沒有靜音鈕');
  ok(clickBtn(b => b.textContent.includes('玩法教學'), d.querySelector('#mines-root')), '點玩法教學');
  await new Promise(r => setTimeout(r, 200));
  // 教學已收編殼 PlatTutorial（F2）：overlay 在 body 層、逐頁只渲染當前步——逐步斷言（demo 格/mtut 動畫/首點保護文案各在其頁）
  const tut = () => d.querySelector('#plat-tutorial');
  ok(!!(tut() && tut().querySelector('[data-ptu-card]')), '教學 overlay 出現（殼 PlatTutorial）');
  ok(tut() && tut().querySelectorAll('[data-mtut-cell]').length === 9, '卡1 互動 demo 9 格可點');
  // 互動 demo 真的能玩：點一格安全格 → 洪水展開（至少 3 格打開）
  if (tut()) { const c = tut().querySelector('[data-mtut-cell="0"]'); if (c) c.click(); }
  await new Promise(r => setTimeout(r, 200));
  ok(tut() && tut().querySelectorAll('[data-mtut-grid] > div').length >= 3, 'demo 點格洪水展開');
  ok(clickBtn(b => b.textContent.includes('下一步'), tut()), '教學步進：下一步');
  await new Promise(r => setTimeout(r, 200));
  ok(!!(tut() && tut().querySelector('.mtut-flag')), '卡2 插旗動畫（mtut-flag）');
  ok(clickBtn(b => b.textContent.includes('下一步'), tut()), '教學步進：下一步 2');
  await new Promise(r => setTimeout(r, 200));
  ok(!!(tut() && tut().querySelector('.mtut-chord-num')), '卡3 和弦動畫（mtut-chord）');
  ok(clickBtn(b => b.textContent.includes('下一步'), tut()), '教學步進：下一步 3');
  await new Promise(r => setTimeout(r, 200));
  ok(!!(tut() && tut().querySelector('.mtut-boom')) && (tut().textContent || '').includes('周圍 8 格保證沒有雷'), '卡4 爆炸動畫＋首點整圈保護文案');
  ok(clickBtn(b => b.textContent.includes('開始遊戲'), tut()), '關教學（步進末頁開始遊戲）');

  // --- 9×9 開局（先進單機挑戰才選難度；設定已收編殼 PlatSetup overlay） ---
  ok(clickBtn(b => b.textContent.includes('單機挑戰'), d.querySelector('#mines-root')), '點單機挑戰');
  await new Promise(r => setTimeout(r, 250));
  ok(clickBtn(b => b.textContent.includes('9×9'), d.querySelector('#plat-setup')), '設定 overlay 點 9×9');
  ok(!!(await waitFor(() => cellEls().length === 81, 15000, '81 cells')), '9×9 盤面 81 格');
  ok(labelOk('9×9・10 雷'), '頂欄標籤 9×9・10 雷（雷數只印一次）: ' + specLabel());
  ok(!!(await waitFor(() => d.querySelector('#mines-root [data-pb="mode-press"]'), 10000, 'bar on game')), '對局畫面有底部列（模式鈕）');
  ok([...d.querySelectorAll('#mines-root button')].some(b => b.textContent.includes('🔊') || b.textContent.includes('🔇')), '對局畫面頂欄有靜音鈕');
  let snap = dbg();
  ok(snap && snap.layout.filter(Boolean).length === 10, '雷數 = 10');
  ok(snap && snap.status === 'ready', '初始狀態 ready');

  // --- 首點保護：第一下就點雷也不能輸 ---
  const mineIdx = snap.layout.indexOf(true);
  cellEls()[mineIdx].click();
  await new Promise(r => setTimeout(r, 300));
  snap = dbg();
  ok(snap.status === 'playing', '首點點到雷 → 已搬雷、狀態 playing（不判輸）');
  ok(snap.cells[mineIdx] === 'o', '首點格已挖開');
  // 新規（2026-10-29 使用者定案）：第一下保護圈（點格＋周圍 8 格）整圈無雷、點格數字必為 0
  const ZW = 9, zx = mineIdx % ZW, zy = Math.floor(mineIdx / ZW); let zoneClear = true;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = zx + dx, ny = zy + dy; if (nx < 0 || ny < 0 || nx >= ZW || ny >= ZW) continue; if (snap.layout[ny * ZW + nx]) zoneClear = false; }
  ok(zoneClear && snap.nums[mineIdx] === 0, '首點保護圈整圈無雷（點格數字＝0）');

  // --- 插旗（模式鈕） ---
  ok(clickBtn(b => b.getAttribute('data-mode') === 'flag', d.querySelector('#mines-root')), '切插旗模式');
  await new Promise(r => setTimeout(r, 250)); // 等 React 把 inputMode 狀態沖刷完（同 tick 連點是 harness 假象，真人點不到）
  snap = dbg();
  const mine2 = snap.layout.indexOf(true, mineIdx + 1) >= 0 ? snap.layout.indexOf(true, mineIdx + 1) : snap.layout.indexOf(true);
  const mine2Real = snap.layout.findIndex((v, i) => v && snap.cells[i] === 'h');
  cellEls()[mine2Real].click();
  await new Promise(r => setTimeout(r, 200));
  snap = dbg();
  ok(snap.cells[mine2Real] === 'f' && cellEls()[mine2Real].textContent.includes('🚩'), '插旗成功（狀態 f＋🚩）');
  // --- 插旗模式點數字格也要和弦揭露（2026-10-30 使用者指示） ---
  {
    const S = dbg(); const W = 9;
    const nbs = i => { const x = i % W, y = (i / W) | 0, r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < W && ny >= 0 && ny < W) r.push(ny * W + nx); } return r; };
    let chordCell = -1, chordMines = [];
    for (let i = 0; i < 81 && chordCell < 0; i++) {
      if (S.cells[i] !== 'o' || !S.nums[i]) continue;
      const nb = nbs(i), hm = nb.filter(j => S.cells[j] === 'h' && S.layout[j]), hs = nb.filter(j => S.cells[j] === 'h' && !S.layout[j]), fl = nb.filter(j => S.cells[j] === 'f').length;
      if (hm.length && hs.length && fl + hm.length === S.nums[i]) { chordCell = i; chordMines = hm; }
    }
    ok(chordCell >= 0, '找到可和弦的數字格');
    for (const m of chordMines) { cellEls()[m].click(); await new Promise(r => setTimeout(r, 60)); }
    const before = dbg().cells.filter(c => c === 'o').length;
    cellEls()[chordCell].click();
    await new Promise(r => setTimeout(r, 250));
    const after = dbg().cells.filter(c => c === 'o').length;
    ok(after > before, '插旗模式點數字格和弦揭露（' + before + '→' + after + '）');
  }
  ok(clickBtn(b => b.getAttribute('data-mode') === 'dig', d.querySelector('#mines-root')), '切回挖開模式');

  // --- 踩雷出局（新一局，第一下點安全格、第二下點雷） ---
  ok(clickBtn(b => b.textContent.includes('重開'), d.querySelector('#mines-root')), '重開一局');
  await waitFor(() => dbg() && dbg().status === 'ready', 5000, 'ready again');
  snap = dbg();
  const safe1 = snap.layout.findIndex(v => !v);
  cellEls()[safe1].click();
  await new Promise(r => setTimeout(r, 200));
  snap = dbg();
  const aMine = snap.layout.findIndex((v, i) => v && snap.cells[i] === 'h');
  cellEls()[aMine].click();
  await new Promise(r => setTimeout(r, 300));
  snap = dbg();
  // v1.49.0：單機也有 10% 容錯（10 雷→1 次）——第一顆雷被原諒：記 ✗、愛心少一顆、續玩
  ok(snap.status === 'playing' && snap.cells[aMine] === 'x' && snap.mistakes === 1 && snap.mistLeft === 0, '單機第一顆雷被容錯原諒（記 ✗、續玩）');
  ok((d.querySelector('#mines-root').textContent.match(/❤️/g) || []).length >= 1, '單機狀態列有愛心顯示');
  const bMine = snap.layout.findIndex((v, i) => v && snap.cells[i] === 'h');
  cellEls()[bMine].click();
  await new Promise(r => setTimeout(r, 300));
  snap = dbg();
  ok(snap.status === 'lost', '容錯用完再踩雷 → lost');
  ok(!![...d.querySelectorAll('#mines-root div')].find(x => x.textContent.includes('踩到地雷')), '出局結算卡出現');

  // --- 全清獲勝（再來一局，照 layout 把安全格全點開） ---
  ok(clickBtn(b => b.textContent.includes('再來一局'), d.querySelector('#mines-root')), '再來一局');
  await waitFor(() => dbg() && dbg().status === 'ready', 5000, 'ready3');
  let won = false;
  for (let round = 0; round < 12 && !won; round++) {
    snap = dbg();
    if (!snap) break;
    if (snap.status === 'won') { won = true; break; }
    const targets = [];
    snap.cells.forEach((c, i) => { if (c === 'h' && !snap.layout[i]) targets.push(i); });
    if (!targets.length) break;
    // 每點一格前重讀盤面：首點整圈保護會搬雷，預算清單立刻過期——照舊清單點會踩到剛搬走的雷（真人一格一格看盤面點，不會發生）
    for (const t of targets) { const s2 = dbg(); if (!s2 || (s2.status !== 'playing' && s2.status !== 'ready') || s2.cells[t] !== 'h' || s2.layout[t]) continue; cellEls()[t].click(); await new Promise(r => setTimeout(r, 15)); }
    await new Promise(r => setTimeout(r, 200));
  }
  snap = dbg();
  ok(snap && snap.status === 'won', '安全格全開 → won（進度 ' + Math.round((snap ? snap.progress : 0) * 100) + '%）');
  ok(snap && snap.progress === 1, '進度 100%');

  // --- 16×16 ---
  ok(clickBtn(b => b.textContent.includes('回主選單'), d.querySelector('#mines-root')), '回主選單');
  await waitFor(() => d.querySelector('#mines-root h1'), 5000, 'home again');
  ok(clickBtn(b => b.textContent.includes('單機挑戰'), d.querySelector('#mines-root')), '再點單機挑戰');
  await new Promise(r => setTimeout(r, 250));
  ok(clickBtn(b => b.textContent.includes('16×16'), d.querySelector('#plat-setup')), '設定 overlay 點 16×16');
  ok(!!(await waitFor(() => cellEls().length === 256, 15000, '256 cells')), '16×16 盤面 256 格');
  ok(labelOk('16×16・40 雷'), '頂欄標籤 16×16・40 雷（雷數只印一次）: ' + specLabel());
  snap = dbg();
  ok(snap && snap.layout.filter(Boolean).length === 40, '16×16 雷數 = 40');

  // --- 每日一題：月曆 + 開局 + 完成紀錄/連勝/亮燈 ---
  // 對局中離開走殼 PlatLeaveMenu（F2）：先點頂欄離開鈕開選單、再點選單的回主選單
  ok(clickBtn(b => b.textContent.includes('主選單'), d.querySelector('#mines-root [data-ptc]')), '點頂欄離開鈕（每日前）');
  await new Promise(r => setTimeout(r, 250));
  ok(clickBtn(b => b.textContent.includes('回主選單'), d.querySelector('#plat-leave-menu')), '離開選單點回主選單（每日前）');
  await waitFor(() => d.querySelector('#mines-root h1'), 5000, 'home3');
  const today = (() => { const t = new Date(), p = n => String(n).padStart(2, '0'); return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()); })();
  ok(clickBtn(b => b.textContent.includes('📅 ' + today), d.querySelector('#mines-root')), '點日期列開月曆');
  await new Promise(r => setTimeout(r, 300));
  const calOverlay = d.querySelector('#plat-calendar'); // 月曆已統一為殼端 PlatCalendar overlay（v1.16）
  const calGrid = calOverlay ? [...calOverlay.querySelectorAll('.grid')].pop() : null;
  ok(calGrid && calGrid.children.length === 42, '月曆固定 42 格（' + (calGrid ? calGrid.children.length : 0) + '）');
  const calBtns = calGrid ? [...calGrid.querySelectorAll('button')] : [];
  const futureBtn = calBtns.find(b => b.disabled && b.textContent.trim() !== '');
  ok(!!futureBtn, '未來的日子反灰 disabled');
  ok(clickBtn(b => b.textContent.includes('關閉'), d.querySelector('#plat-calendar')), '關月曆');
  ok(clickBtn(b => b.textContent.includes('每日一題'), d.querySelector('#mines-root')), '點每日一題開局');
  ok(!!(await waitFor(() => cellEls().length === 81, 15000, 'daily cells')), '每日一題 9×9 盤面');
  ok(labelOk('9×9・10 雷'), '每日一題頂欄標籤 9×9・10 雷（雷數只印一次）: ' + specLabel());
  // 逐格重讀盤面點安全格（不可用整批舊快照：第一下整圈保護會搬雷，舊快照會踩到剛搬走的雷——AGENTS.md 測試假象備註）
  for (let step = 0; step < 90; step++) {
    snap = dbg(); if (!snap || snap.status === 'won' || snap.status === 'lost') break;
    const t = snap.cells.findIndex((c, i) => c === 'h' && !snap.layout[i]);
    if (t < 0) break;
    cellEls()[t].click(); await new Promise(r => setTimeout(r, 12));
  }
  ok(dbg() && dbg().status === 'won', '每日一題完成');
  // 讀法須走遊戲自己的 PlatSave.read（S1 起落盤是 envelope {__psv,t,data}；裸 JSON.parse 讀到的是外殼、值在 .data 裡——2026-11-15 診斷定案：產品寫入正確、舊測試裸讀法自 v1.62.0 起脫節）
  const rec = w.PlatSave.read('mines_daily_records', { fallback: {} });
  ok(typeof rec[today] === 'number', '今日紀錄寫入（' + rec[today] + ' 秒）');
  const streak = w.PlatSave.read('mines_daily_streak', { fallback: { last: '', count: 0 } });
  ok(streak.last === today && streak.count >= 1, '連勝紀錄（' + streak.count + ' 天）');
  ok(clickBtn(b => b.textContent.includes('回主選單'), d.querySelector('#mines-root')), '每日後回主選單');
  await waitFor(() => d.querySelector('#mines-root h1'), 5000, 'home4');
  await new Promise(r => setTimeout(r, 200));
  ok([...d.querySelectorAll('#mines-root button')].some(b => b.textContent.includes('每日一題') && b.textContent.includes('✓')), '主畫面每日一題顯示 ✓（PlatHome 殼版式）');

  const realErrs = errors.filter(e => !/scrollTo/.test(e));
  ok(realErrs.length === 0, '零錯誤' + (realErrs.length ? '：' + realErrs.slice(0, 3).join(' | ') : ''));
  console.log(`\nRESULT mines-solo: ${pass} pass / ${fail} fail`);
  if (fails.length) console.log('FAILS:', fails.join(' ; '));
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
