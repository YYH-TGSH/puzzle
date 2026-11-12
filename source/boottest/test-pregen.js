// D2 驗收（v1.66.0）：甲預生成（同種子等價/命中不呼叫產生器/換組合不誤用/對局中 0 執行）＋乙 PlatGenerating（300ms 顯示/跳秒/退場/5 秒放棄：單機＋房主）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('  ok', name); } else { fail++; console.log('  FAIL', name, extra || ''); } }
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(150); } console.log('  (timeout: ' + label + ')'); return null; }
function loadPage(reg) {
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {}); vc.on('error', () => {});
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { if (reg) w.__SHARED_REG__ = reg; w.scrollTo = () => {};
      w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } resume() { return Promise.resolve(); } }; } });
  return { window: dom.window, document: dom.window.document };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
const byText = (p, root, txt) => [...root.querySelectorAll('button')].find(b => (b.textContent || '').includes(txt)) || null;
async function shellReady(p) { return waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.PlatDock) ? 1 : null, 120000, 'shell'); }

(async () => {
  // ===== A. 同種子等價（數橋 job vs 直生；數獨種子決定性＋abortRef）=====
  {
    const p = loadPage();
    await shellReady(p);
    p.window.PLAT_show('hashi');
    await waitFor(() => p.window.HASHI_PUZZLE ? 1 : null, 60000, 'HASHI_PUZZLE');
    const H = p.window.HASHI_PUZZLE;
    let same = 0, total = 0;
    for (const lv of [{ id: 2, width: 10, height: 10 }, { id: 5, width: 20, height: 20 }]) {
      for (let seed = 1; seed <= 6; seed++) {
        total++;
        const a = H.generateUniqueHashi(lv, H.mulberry32(7000 + seed * 13 + lv.id));
        const job = H.createUniqueJob(lv, H.mulberry32(7000 + seed * 13 + lv.id));
        while (!job.step()) {}
        if (JSON.stringify(a.islands) === JSON.stringify(job.result().islands)) same++;
      }
    }
    check('A1 數橋 job vs 直生 同種子逐題相同（12 抽樣）', same === total, same + '/' + total);
    p.window.PLAT_show('sudoku');
    const W = p.window;
    const g1 = await W.generateSudokuAsync(9, 'hard', null, W.mulberry32(W.hashDateStr('pregen-eq-1')));
    const g2 = await W.generateSudokuAsync(9, 'hard', null, W.mulberry32(W.hashDateStr('pregen-eq-1')));
    const ser = g => g.cells.map(c => c.value || '.').join('');
    const givens = g1.cells.filter(c => c.isGiven).length;
    check('A2 數獨 9 困難同種子決定性＋落帶 22–25', ser(g1) === ser(g2) && givens >= 22 && givens <= 25, 'givens=' + givens);
    const abortRef = { aborted: false };
    const pr = W.generateSudokuAsync(16, 'hard', null, undefined, abortRef);
    setTimeout(() => { abortRef.aborted = true; }, 30);
    const abr = await pr;
    check('A3 數獨 abortRef 中止回 null（預生成守衛）', abr === null);
    p.window.close();
  }
  // ===== B. 數獨預生成命中＋換組合不誤用 =====
  {
    const p = loadPage();
    await shellReady(p);
    p.window.PLAT_show('sudoku');
    await waitFor(() => byText(p, p.document.querySelector('#view-sudoku'), '單機挑戰'), 60000, 'sudoku home');
    let genCalls = 0;
    const origGen = p.window.generateSudokuAsync;
    p.window.generateSudokuAsync = function (...a) { genCalls++; return origGen.apply(null, a); };
    const jobs = await waitFor(() => (p.window.__SUDOKU_PREGEN_STATS && p.window.__SUDOKU_PREGEN_STATS.jobs >= 1) ? 1 : null, 30000, 'pregen job started');
    check('B1 主畫面閒置 ≥1.5s 觸發預生成', !!jobs);
    // 等預生成完成（result 落格）：以「開始後 hits」間接驗太慢——改等 9x9 medium 生成完（輪詢：把 genCalls 歸零後開局，若命中則不再呼叫）
    await sleep(4000);
    clickEl(p, byText(p, p.document.querySelector('#view-sudoku'), '單機挑戰'));
    await sleep(600);
    const callsBeforeStart = genCalls;
    const t0 = Date.now();
    clickEl(p, byText(p, p.document.querySelector('#view-sudoku'), '開始挑戰'));
    const board = await waitFor(() => p.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length === 81 ? 1 : null, 30000, 'sudoku board');
    const dt = Date.now() - t0;
    check('B2 命中開局不再呼叫產生器', !!board && genCalls === callsBeforeStart, 'genCalls ' + callsBeforeStart + '->' + genCalls);
    check('B3 命中且 __SUDOKU_PREGEN_STATS.hits ≥ 1', p.window.__SUDOKU_PREGEN_STATS.hits >= 1);
    console.log('    (hit start->board ms:', dt + ')');
    p.window.close();
  }
  // ===== C. 數橋預生成命中＋對局中 0 執行 =====
  {
    const p = loadPage();
    await shellReady(p);
    p.window.PLAT_show('hashi');
    await waitFor(() => byText(p, p.document.querySelector('#view-hashi'), '單機挑戰'), 60000, 'hashi home');
    const jobs = await waitFor(() => (p.window.__HASHI_PREGEN_STATS && p.window.__HASHI_PREGEN_STATS.jobs >= 1) ? 1 : null, 30000, 'hashi pregen job');
    check('C1 數橋主畫面閒置觸發預生成（預設 L2）', !!jobs);
    // 等 job 跑完：steps 穩定 800ms
    let lastSteps = -1, stableSince = Date.now();
    await waitFor(() => { const st = p.window.__HASHI_PREGEN_STATS; if (st.steps !== lastSteps) { lastSteps = st.steps; stableSince = Date.now(); return null; } return (Date.now() - stableSince > 800) ? 1 : null; }, 60000, 'pregen settled');
    clickEl(p, byText(p, p.document.querySelector('#view-hashi'), '單機挑戰'));
    const lvlBtns = await waitFor(() => { const bs = [...p.document.querySelectorAll('#view-hashi button')].filter(b => (b.textContent || '').includes('10x10 標準')); return bs.length >= 2 ? bs : null; }, 20000, 'level modal');
    clickEl(p, lvlBtns && lvlBtns[lvlBtns.length - 1]);
    const board = await waitFor(() => (p.window.__HASHI_PREGEN_STATS.hits >= 1 && p.document.querySelectorAll('#view-hashi circle').length > 30) ? 1 : null, 30000, 'hashi board+hit');
    check('C2 數橋命中開局（hits ≥ 1）', !!board && p.window.__HASHI_PREGEN_STATS.hits >= 1, 'hits=' + (p.window.__HASHI_PREGEN_STATS || {}).hits);
    const stepsInGame0 = p.window.__HASHI_PREGEN_STATS.steps, jobsInGame0 = p.window.__HASHI_PREGEN_STATS.jobs;
    await sleep(2500);
    check('C3 對局中預生成 0 執行（steps/jobs 凍結）', p.window.__HASHI_PREGEN_STATS.steps === stepsInGame0 && p.window.__HASHI_PREGEN_STATS.jobs === jobsInGame0,
      'steps ' + stepsInGame0 + '->' + p.window.__HASHI_PREGEN_STATS.steps + ', jobs ' + jobsInGame0 + '->' + p.window.__HASHI_PREGEN_STATS.jobs);
    p.window.close();
  }
  // ===== D. PlatGenerating 單機：顯示/退場/5 秒放棄 =====
  {
    const p = loadPage();
    await shellReady(p);
    p.window.PLAT_show('sudoku');
    await waitFor(() => byText(p, p.document.querySelector('#view-sudoku'), '單機挑戰'), 60000, 'sudoku home D');
    const realPuzzle = await p.window.generateSudokuAsync(9, 'medium', null);
    const origGenD = p.window.generateSudokuAsync;
    p.window.generateSudokuAsync = function () { return new Promise(res => setTimeout(() => res(realPuzzle), 6500)); }; // 假慢產生器：保證逾 5 秒（D2 規格的假慢驗收法）
    clickEl(p, byText(p, p.document.querySelector('#view-sudoku'), '單機挑戰'));
    await sleep(600);
    clickEl(p, byText(p, p.document.querySelector('#view-sudoku'), '開始挑戰'));
    const chip = await waitFor(() => (p.window.PlatGenerating && p.window.PlatGenerating._visible()) ? 1 : null, 30000, 'chip visible');
    check('D1 生成逾 300ms → PlatGenerating 晶片顯示', !!chip);
    const secShown = await waitFor(() => { const el = p.document.querySelector('#plat-generating'); return el && /\ds/.test(el.textContent) ? el.textContent : null; }, 5000, 'seconds ticking');
    check('D2 晶片含已等秒數', !!secShown, String(secShown));
    // 等滿 5 秒出現返回 → 放棄
    const aborted = await waitFor(() => { const el = p.document.querySelector('#plat-generating'); if (!el) return null; const b = [...el.querySelectorAll('button')].find(x => x.textContent.includes('返回')); return (b && p.window.getComputedStyle(b).display !== 'none') ? b : null; }, 30000, 'abort btn');
    let backToSettings = false;
    if (aborted) { aborted.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); await sleep(800);
      backToSettings = !!byText(p, p.document.querySelector('#view-sudoku'), '開始挑戰') && p.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length === 0 && !p.window.PlatGenerating._visible();
    }
    check('D3 滿 5 秒出返回、放棄後回設定且無半開局殘留', backToSettings);
    p.window.close();
  }
  // ===== E. 換組合不誤用（紅線）：預生成 9 普通就緒後改選困難、立刻開始 → 出的必須是困難題 =====
  {
    const p = loadPage();
    await shellReady(p);
    p.window.PLAT_show('sudoku');
    await waitFor(() => byText(p, p.document.querySelector('#view-sudoku'), '單機挑戰'), 60000, 'sudoku home E');
    const ready = await waitFor(() => { const sl = p.window.__SUDOKU_PREGEN_SLOT && p.window.__SUDOKU_PREGEN_SLOT(); return sl && sl.key === '9xmedium' && sl.hasResult ? 1 : null; }, 60000, 'medium pregen ready');
    check('E1 9x普通預生成就緒', !!ready);
    clickEl(p, byText(p, p.document.querySelector('#view-sudoku'), '單機挑戰'));
    await sleep(600);
    clickEl(p, [...p.document.querySelectorAll('#view-sudoku [data-seg="sudoku-diff"] button')].find(b => (b.textContent || '').includes('困難')));
    await sleep(200);
    clickEl(p, byText(p, p.document.querySelector('#view-sudoku'), '開始挑戰'));
    const board = await waitFor(() => p.window.__PLAT_HOOKS_sudoku && p.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length === 81 ? 1 : null, 60000, 'hard board');
    let givens = -1;
    if (board) givens = [...p.document.querySelectorAll('#view-sudoku g[id^="cell-"]')].filter(g => (g.textContent || '').trim()).length;
    check('E2 換困難後出困難題（給定數 22–25、非舊普通題 27–32）', givens >= 22 && givens <= 25, 'givens=' + givens);
    p.window.close();
  }
  // ===== F. PlatGenerating 房主放棄：launch 後生成中放棄 → 不發 INIT、全員回房間頁、房間不變 =====
  {
    const reg = {};
    const H = loadPage(reg), G = loadPage(reg);
    await shellReady(H); await shellReady(G);
    const clickSel = (p, sel) => clickEl(p, p.document.querySelector(sel));
    const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
    H.window.PLAT_show('lobby'); G.window.PLAT_show('lobby');
    clickSel(H, '#lob-go-create');
    await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
    H.document.querySelector('#lob-name').value = 'HostA'; clickSel(H, '#lob-confirm');
    await waitFor(() => hubRoom(H), 60000, 'H room');
    const code = H.window.__PLAT_NET.code;
    clickSel(G, '#lob-go-join');
    await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
    G.document.querySelector('#lob-name').value = 'GuestB'; G.document.querySelector('#lob-code').value = code; clickSel(G, '#lob-confirm');
    await waitFor(() => hubRoom(G), 60000, 'G room');
    const roster2 = await waitFor(() => H.window.__PLAT_NET.roster.length >= 2 ? 1 : null, 30000, 'roster 2');
    check('F0 雙頁進房完成', !!roster2);
    if (roster2) {
      const realPuzzle = await H.window.generateSudokuAsync(9, 'medium', null);
      H.window.generateSudokuAsync = function () { return new Promise(res => setTimeout(() => res(realPuzzle), 6500)); }; // 房主假慢生成
      clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
      await sleep(600);
      clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="brawl"]'));
      await sleep(800);
      clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
      clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
      const startBtn = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
      if (startBtn) startBtn.dispatchEvent(new H.window.MouseEvent('click', { bubbles: true }));
      const chipH = await waitFor(() => (H.window.PlatGenerating && H.window.PlatGenerating._visible()) ? 1 : null, 45000, 'host chip');
      check('F1 房主生成逾 300ms → 晶片顯示', !!chipH);
      const abBtn = await waitFor(() => { const el = H.document.querySelector('#plat-generating'); if (!el) return null; const b = [...el.querySelectorAll('button')].find(x => x.textContent.includes('返回')); return (b && H.window.getComputedStyle(b).display !== 'none') ? b : null; }, 30000, 'host abort btn');
      let okF = false;
      if (abBtn) { abBtn.dispatchEvent(new H.window.MouseEvent('click', { bubbles: true })); await sleep(1500);
        okF = !H.window.__PLAT_NET.inMatch && !G.window.__PLAT_NET.inMatch && !H.window.PlatGenerating._visible()
          && H.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length === 0 && G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length === 0
          && (H.window.__PLAT_NET.roster || []).length >= 2 && !!hubRoom(H);
      }
      check('F2 房主放棄 → 無 INIT/盤面、雙頁回房間頁、房間名單不變', okF, 'H.inMatch=' + H.window.__PLAT_NET.inMatch + ' G.inMatch=' + G.window.__PLAT_NET.inMatch + ' roster=' + (H.window.__PLAT_NET.roster || []).length);
    }
    H.window.close(); G.window.close();
  }
  console.log('\nPREGEN: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
