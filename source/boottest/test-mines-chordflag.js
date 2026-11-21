// 回歸（v1.66.1，稽核報告 mines-chord-flag-vanish-audit-2026-11-15）：
// 地雷尾隨 click 抑制原帶「按下格」tag——放開點偏進鄰格時 click 落在旗子格不被吞，多執行一次動作（拔旗/誤挖）。
// 修法：markSuppress 改不帶 tag（全域 500ms 窗，比照數獨）。本測全程真實事件順序（down→up 結算→鄰格 click）。
// 次項：合作和弦計數對齊 'f'+'L'+'x'（原只算 'f'，旁邊有容錯 ✗ 時和弦拒發）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(150); } console.log('  (timeout: ' + label + ')'); return null; }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
function loadPage(reg) {
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {}); vc.on('error', () => {});
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { if (reg) w.__SHARED_REG__ = reg; w.scrollTo = () => {}; w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } resume() { return Promise.resolve(); } }; } });
  return { window: dom.window, document: dom.window.document };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
const NB9 = (i) => { const x = i % 9, y = (i / 9) | 0, r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) r.push(ny * 9 + nx); } return r; };
function soloPage() { return loadPage(null); }
async function startSolo9(p) {
  await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.PlatDock) ? 1 : null, 120000, 'shell');
  p.window.PLAT_show('mines');
  const clickBtn = pred => { const b = [...p.document.querySelectorAll('button')].find(pred); if (b) { b.click(); return true; } return false; }; // 文件層級：單機設定已收編殼 PlatSetup overlay（body 層，F2）
  await waitFor(() => p.document.querySelector('#mines-root h1'), 60000, 'mines home');
  clickBtn(b => b.textContent.includes('單機挑戰')); await sleep(250);
  clickBtn(b => b.textContent.includes('9×9'));
  await waitFor(() => p.document.querySelectorAll('#mines-root button[data-cell]').length === 81, 20000, '81 cells');
  return clickBtn;
}
const cellEls = p => [...p.document.querySelectorAll('#mines-root button[data-cell]')];
const pev = (p, el, type, x, y) => el.dispatchEvent(new p.window.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }));
const tap = async (p, idx, x, y) => { pev(p, cellEls(p)[idx], 'pointerdown', x || 100, y || 100); pev(p, cellEls(p)[idx], 'pointerup', (x || 100) + 2, (y || 100) + 1); await sleep(160); };
const dbg = p => p.window.__PLAT_HOOKS_mines.debug();
async function setMode(p, clickBtn, want) { // 模式鈕是 dig→flag→draw 三段循環：點到目標為止
  for (let k = 0; k < 3 && dbg(p).inputMode !== want; k++) {
    const mb = p.document.querySelector('#mines-root [data-pb="mode-press"]'); if (!mb) break;
    mb.click(); await sleep(220);
  }
}
(async () => {
  // ===== 單機 ①：插旗模式和弦後、尾隨 click 落旗子格 → 旗還在 =====
  {
    const p = soloPage(); const clickBtn = await startSolo9(p);
    await tap(p, 40); // 首擊開局（安全）
    const s0 = dbg(p);
    check('①0 首擊後盤面生成', !!s0.layout && s0.cells.some(c => c === 'o'));
    // 找數字格 N：鄰雷全未插旗、且有 ≥1 未開安全鄰格
    let N = -1, mines = [];
    for (let i = 0; i < 81 && N < 0; i++) {
      if (s0.cells[i] !== 'o' || !s0.nums[i]) continue;
      const nb = NB9(i), ms = nb.filter(j => s0.layout[j]);
      if (ms.length !== s0.nums[i] || !ms.length) continue;
      if (!nb.some(j => s0.cells[j] === 'h' && !s0.layout[j])) continue;
      N = i; mines = ms;
    }
    check('①0 找到可和弦數字格', N >= 0);
    if (N >= 0) {
      await setMode(p, clickBtn, 'flag');
      for (const m of mines) await tap(p, m);
      const sF = dbg(p);
      check('①0 鄰雷全插旗', mines.every(m => sF.cells[m] === 'f'), mines.map(m => sF.cells[m]).join(','));
      const openedBefore = sF.cells.filter(c => c === 'o').length;
      await tap(p, N); // 插旗模式點已開數字格 → 和弦
      const sC = dbg(p);
      const openedAfterChord = sC.cells.filter(c => c === 'o').length;
      check('①1 和弦有開格', openedAfterChord > openedBefore, openedBefore + '->' + openedAfterChord);
      cellEls(p)[mines[0]].click(); // 尾隨 click 落在旗子格（無 pointer 前置、窗內）
      await sleep(200);
      const sA = dbg(p);
      check('①2 尾隨 click 落旗子格 → 旗還在', sA.cells[mines[0]] === 'f', 'cell=' + sA.cells[mines[0]]);
      check('①3 開格數不變（無多餘動作）', sA.cells.filter(c => c === 'o').length === openedAfterChord);
    }
    p.window.close();
  }
  // ===== 單機 ②：挖開模式、和弦未觸發、尾隨 click 落未開鄰格 → 不得誤挖；③ 純 click 照常；④ 同格尾巴；⑤ 長按 =====
  {
    const p = soloPage(); const clickBtn = await startSolo9(p);
    await tap(p, 40);
    const s0 = dbg(p);
    let N = -1, mines = [], safe = -1;
    for (let i = 0; i < 81 && N < 0; i++) {
      if (s0.cells[i] !== 'o' || !s0.nums[i] || s0.nums[i] < 2) continue;
      const nb = NB9(i), ms = nb.filter(j => s0.layout[j]);
      if (ms.length !== s0.nums[i]) continue;
      const sf = nb.find(j => s0.cells[j] === 'h' && !s0.layout[j]);
      if (sf == null) continue;
      N = i; mines = ms; safe = sf;
    }
    check('②0 找到部分插旗候選數字格', N >= 0);
    if (N >= 0) {
      await setMode(p, clickBtn, 'flag');
      await tap(p, mines[0]); // 只插一支（< nums → 和弦不觸發）
      await setMode(p, clickBtn, 'dig');
      await tap(p, N); // 和弦拒發（計數不足）、但抑制窗已設
      cellEls(p)[safe].click(); // 尾隨 click 落未開安全鄰格
      await sleep(200);
      check('②1 尾隨 click 落未開鄰格 → 未被誤挖', dbg(p).cells[safe] === 'h', 'cell=' + dbg(p).cells[safe]);
      // ③ 純 click（鍵盤路徑、無 pointer 前置）照常挖
      await sleep(600); // 等抑制窗過期（500ms）
      cellEls(p)[safe].click();
      await sleep(200);
      check('③ 純 click 照常執行（挖開）', dbg(p).cells[safe] === 'o', 'cell=' + dbg(p).cells[safe]);
      // ④ 同格尾隨 click：down/up 挖一格後 click 同格 → 不重複（開格數不變）
      const s1 = dbg(p);
      const h1 = s1.cells.findIndex((c, j) => c === 'h' && !s1.layout[j]);
      if (h1 >= 0) {
        await tap(p, h1);
        const opened = dbg(p).cells.filter(c => c === 'o').length;
        cellEls(p)[h1].click(); await sleep(150);
        check('④ 同格尾隨 click 照舊吞嚥', dbg(p).cells.filter(c => c === 'o').length === opened);
      }
      // ⑤ 長按插旗不受影響
      const s2 = dbg(p);
      const h2 = s2.cells.findIndex(c => c === 'h');
      if (h2 >= 0) {
        pev(p, cellEls(p)[h2], 'pointerdown', 100, 100);
        await sleep(700); // 長按 500ms 觸發
        pev(p, cellEls(p)[h2], 'pointerup', 100, 100);
        await sleep(150);
        check('⑤ 長按插旗照常', dbg(p).cells[h2] === 'f', 'cell=' + dbg(p).cells[h2]);
        cellEls(p)[h2].click(); await sleep(150);
        check('⑤1 長按後 click 尾巴不拔旗', dbg(p).cells[h2] === 'f', 'cell=' + dbg(p).cells[h2]);
      }
    }
    p.window.close();
  }
  // ===== 合作 ⑥：數字旁有容錯 'x'＋旗 → 和弦計數含 x 可觸發 =====
  {
    const reg = {};
    const H = loadPage(reg), G = loadPage(reg);
    const setInput = (w, el, val) => { const st = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; st.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); };
    for (const p of [H, G]) await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.PlatDock) ? 1 : null, 120000, 'shell coop');
    clickEl(H, H.document.querySelector('#lob-go-create'));
    await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 30000, 'H nick');
    setInput(H.window, H.document.querySelector('#lob-name'), '阿主'); clickEl(H, H.document.querySelector('#lob-confirm'));
    await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET.code; }, 60000, 'H room');
    const code = H.window.__PLAT_NET.code;
    clickEl(G, G.document.querySelector('#lob-go-join'));
    await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 30000, 'G nick');
    setInput(G.window, G.document.querySelector('#lob-name'), '阿客'); setInput(G.window, G.document.querySelector('#lob-code'), code); clickEl(G, G.document.querySelector('#lob-confirm'));
    await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 60000, 'G in room');
    for (const p of [H, G]) { p.window.PLAT_show('mines'); await waitFor(() => !!p.window.__PLAT_HOOKS_mines, 60000, 'preboot'); p.window.PLAT_show('lobby'); }
    clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="mines"]'));
    await waitFor(() => G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === 'mines', 30000, 'armed');
    clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="coop"][data-hub-game="mines"]'));
    await sleep(600);
    clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(700);
    clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
    const sb = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return b && !b.disabled ? b : null; }, 60000, 'start');
    if (sb) sb.dispatchEvent(new H.window.MouseEvent('click', { bubbles: true }));
    const playing = await waitFor(() => { const a = dbg(H), b = dbg(G); return a.mp.phase === 'playing' && b.mp.phase === 'playing' ? 1 : null; }, 60000, 'coop playing');
    check('⑥0 合作雙邊開局', !!playing);
    if (playing) {
      const tapH = async idx => { const els = [...H.document.querySelectorAll('#mines-root button[data-cell]')]; pev(H, els[idx], 'pointerdown', 100, 100); pev(H, els[idx], 'pointerup', 102, 101); await sleep(250); };
      await tapH(40); // 首擊
      // 找三元組：安全格 S0 鄰雷恰 2 顆 {M1,M2}、且另有未開安全鄰格（和弦要有東西可開）；找不到就擴大開局再找
      let M1 = -1, M2 = -1, S0 = -1, S = -1;
      const findTriple = () => { const s = dbg(H);
        for (let i = 0; i < 81; i++) {
          if (s.layout[i]) continue;
          if (s.cells[i] !== 'h' && s.cells[i] !== 'o') continue;
          const nb = NB9(i), ms = nb.filter(j => s.layout[j]);
          if (ms.length !== 2 || s.nums[i] !== 2) continue;
          const sf = nb.filter(j => s.cells[j] === 'h' && !s.layout[j] && j !== i);
          if (!sf.length) continue;
          return { s0: i, m1: ms[0], m2: ms[1], sf: sf[0] };
        } return null; };
      let tri = null;
      for (let extra = 0; extra < 15 && !tri; extra++) {
        tri = findTriple();
        if (tri) break;
        const s = dbg(H);
        const cand = s.cells.findIndex((c, j) => c === 'h' && !s.layout[j] && NB9(j).some(k => s.cells[k] === 'o'));
        if (cand < 0) break;
        await tapH(cand);
      }
      check('⑥1a 找到雙雷鄰接三元組', !!tri);
      if (tri) {
        M1 = tri.m1; M2 = tri.m2; S0 = tri.s0; S = tri.sf;
        await tapH(M1); // 踩第一顆 → 容錯記 'x'
        const sH = dbg(H);
        check('⑥1 踩雷記 x（容錯）且續玩', sH.cells[M1] === 'x' && sH.mp.phase === 'playing', 'cell=' + sH.cells[M1] + ' phase=' + sH.mp.phase);
        if (dbg(H).cells[S0] === 'h') await tapH(S0); // 開出數字格 S0（nums=2）
        check('⑥2 數字格 S0 已開且 nums=2', dbg(H).cells[S0] === 'o' && dbg(H).nums[S0] === 2, 'cell=' + dbg(H).cells[S0] + ' nums=' + dbg(H).nums[S0]);
        const others = [M2];
        for (let k = 0; k < 3 && dbg(H).inputMode !== 'flag'; k++) { const mb = H.document.querySelector('#mines-root [data-pb="mode-press"]'); if (!mb) break; mb.click(); await sleep(220); }
        for (const m of others) await tapH(m);
        for (let k = 0; k < 3 && dbg(H).inputMode !== 'dig'; k++) { const mb = H.document.querySelector('#mines-root [data-pb="mode-press"]'); if (!mb) break; mb.click(); await sleep(220); }
        check('⑥3 其他鄰雷已插旗', others.every(m => dbg(H).cells[m] === 'f'), others.map(m => dbg(H).cells[m]).join(','));
        const sPre = dbg(H);
        const target = NB9(S0).find(j => sPre.cells[j] === 'h' && !sPre.layout[j]);
        await tapH(S0); // 合作和弦：計數須含 x＋f ＝nums 才觸發
        const opened = await waitFor(() => dbg(H).cells[target] === 'o' ? 1 : null, 8000, 'chord opens target');
        check('⑥4 合作和弦計入 x → 觸發開格', !!opened, 'target=' + dbg(H).cells[target]);
      }
    }
    H.window.close(); G.window.close();
  }
  console.log('\nMINES-CHORDFLAG: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
