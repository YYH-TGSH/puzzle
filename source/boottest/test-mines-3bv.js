// 驗收（v1.50.0 規格報告第八節 3+4）：顯示切換 DOM 斷言（5.2 鐵則）＋雙人競速里程碑改 eff 逐格補報
// 里程碑判準：來賓連挖兩個空白區後，雙邊道具總增量（max 觀測值）必須恰等於 floor(eff×20) 段——舊制「只發 1 次其餘吞掉」會少於此數。
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
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole(); const errors = [];
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(stamp(m, e.detail && e.detail.stack)); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { window.__SHARED_REG__ = sharedReg; window.scrollTo = () => {}; window.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errors.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
const setSel = (p, el, v) => { if (!el) return; el.value = v; el.dispatchEvent(new p.window.Event('change', { bubbles: true })); el.dispatchEvent(new p.window.Event('input', { bubbles: true })); };

// ---------- A. 單機顯示切換 ----------
async function soloPart() {
  const P = loadPage('S');
  const dbg = () => P.window.__PLAT_HOOKS_mines && P.window.__PLAT_HOOKS_mines.debug();
  await waitFor(() => (typeof P.window.PLAT_show === 'function' && P.window.PlatBar) ? true : null, 120000, 'shell');
  P.window.PLAT_show('mines');
  await waitFor(() => !!P.window.__PLAT_HOOKS_mines, 120000, 'mines hooks');
  await sleep(500);
  const clickBtn = pred => { const b = [...P.document.querySelectorAll('button')].find(pred); if (b) { b.click(); return true; } return false; }; // 文件層級：PlatSetup overlay 在 body 層（F2）
  clickBtn(b => b.textContent.includes('單機挑戰')); await sleep(250);
  clickBtn(b => b.textContent.includes('9×9'));
  ok(!!(await waitFor(() => P.document.querySelectorAll('#mines-root button[data-cell]').length === 81 ? true : null, 30000, 'cells')), '單機開局');
  const progEl = () => [...P.document.querySelectorAll('#mines-root div')].find(x => x.children.length <= 2 && (x.textContent.startsWith('進度（3BV）') || x.textContent.startsWith('開格 ')));
  const el0 = await waitFor(() => progEl() || null, 20000, 'prog text'); // v1.71.0：進度字在 PlatTopCard 槽 portal 內（外框→頂欄→槽三段 state 同步，須等）
  ok(!!el0, '進度文字存在且預設 3BV', el0 ? el0.textContent : 'none');
  ok(el0 && el0.tagName !== 'BUTTON' && !/border|bg-/.test(el0.className), '鐵則：進度文字不是按鈕、無邊框/底色 class', el0 ? el0.tagName + '/' + el0.className : '');
  // 挖一個空白區（洪水）
  const snap = dbg();
  const zeroIdx = snap.nums.findIndex((n, i) => n === 0 && !snap.layout[i]);
  P.document.querySelectorAll('#mines-root button[data-cell]')[zeroIdx].click();
  await sleep(400);
  const s2 = dbg();
  ok(s2.effProgress > 0 && s2.effProgress < s2.progress, '洪水後 eff 明顯小於開格 %（3BV 折價）', 'eff=' + s2.effProgress.toFixed(3) + ' open=' + s2.progress.toFixed(3));
  ok(s2.bv >= 2 && s2.progMode === 'bv', 'dbg 有 bv/progMode', 'bv=' + s2.bv);
  const el1 = progEl();
  ok(!!el1 && el1.textContent.startsWith('進度（3BV）') && el1.querySelector('.plat-count') && el1.querySelector('.plat-count').getAttribute('aria-label') === Math.floor(s2.effProgress * 100) + '%', '顯示數字 = 3BV eff（滾輪 aria-label 語意值）', el1 ? el1.textContent.slice(0, 30) : '');
  el1.click(); await sleep(250);
  const el2 = progEl();
  ok(!!el2 && el2.textContent.startsWith('開格 ') && el2.querySelector('.plat-count') && el2.querySelector('.plat-count').getAttribute('aria-label') === Math.floor(s2.progress * 100) + '%', '點一下 → 開格 %（滾輪語意值）', el2 ? el2.textContent.slice(0, 30) : '');
  el2.click(); await sleep(250);
  const el3 = progEl();
  ok(!!el3 && el3.textContent.includes('進度（3BV）'), '再點一下 → 回 3BV');
  ok(P.errors.length === 0, '單機段零錯誤', P.errors[0] || '');
  P.window.close();
}

// ---------- B. 競速里程碑逐格補報 ----------
async function raceAttempt(n) {
  const H = loadPage('H' + n), G = loadPage('G' + n);
  const dbg = p => p.window.__PLAT_HOOKS_mines.debug();
  for (const p of [H, G]) await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, 'shell');
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
  for (const p of [H, G]) { p.window.PLAT_show('mines'); await waitFor(() => !!p.window.__PLAT_HOOKS_mines, 300000, 'preboot'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="mines"]'));
  await waitFor(() => (G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === 'mines') ? true : null, 30000, 'armed');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="race"][data-hub-game="mines"]'));
  await sleep(500);
  setSel(H, H.document.querySelector('#lob-step-room [data-hub-key="itemStartTime"][data-hub-game="mines"]'), '0');
  await sleep(300);
  for (const p of [H, G]) { const rb = p.document.querySelector('#lob-step-room [data-pr="ready"]'); if (rb && !rb.textContent.includes('已準備')) clickEl(p, rb); }
  const startB = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return (b && !b.disabled) ? b : null; }, 30000, 'start');
  clickEl(H, startB);
  const playing = await waitFor(() => { const a = dbg(H), b = dbg(G); return (a.mp.phase === 'playing' && b.mp.phase === 'playing') ? true : null; }, 90000, 'playing');
  if (!playing) { H.window.close(); G.window.close(); return { setupFail: true }; }
  const itemsTotal = () => { let t = 0; for (const p of [H, G]) { const it = dbg(p).items; t += (it.question || 0) + (it.backfill || 0) + (it.gift || 0); } return t; };
  const base = itemsTotal();
  const cellsG = () => G.document.querySelectorAll('#mines-root button[data-cell]');
  // 來賓連挖兩個不同的空白區
  for (let d = 0; d < 2; d++) {
    const gs = dbg(G);
    const zi = gs.nums.findIndex((v, i) => v === 0 && !gs.layout[i] && gs.cells[i] === 'h');
    if (zi < 0) break;
    cellsG()[zi].click();
    await sleep(350);
  }
  const gs2 = dbg(G);
  const bands = Math.floor(gs2.effProgress * 20);
  // 快速輪詢取道具總增量最大值（自動連發要 550ms/發，1.2 秒內取 max 可避開消耗干擾）
  let maxGain = 0; const t0 = Date.now();
  while (Date.now() - t0 < 1200) { maxGain = Math.max(maxGain, itemsTotal() - base); await sleep(40); }
  const errs = H.errors.length + G.errors.length;
  const res = { bands, maxGain, milestones: gs2.milestones, eff: gs2.effProgress, errs };
  H.window.close(); G.window.close();
  return res;
}

(async () => {
  await soloPart();
  let sawJump = false, allEq = true, lastInfo = '';
  for (let a = 1; a <= 4; a++) {
    const r = await raceAttempt(a);
    if (r.setupFail) { allEq = false; lastInfo = 'attempt ' + a + ' setup fail'; break; }
    console.log('  attempt ' + a + ': eff=' + r.eff.toFixed(3) + ' bands=' + r.bands + ' grantsMax=' + r.maxGain + ' milestoneRef=' + r.milestones + ' errs=' + r.errs);
    if (r.errs > 0) { allEq = false; lastInfo = 'errors'; break; }
    if (r.maxGain !== r.bands || r.milestones !== r.bands) { allEq = false; lastInfo = 'bands=' + r.bands + ' grants=' + r.maxGain + ' ref=' + r.milestones; break; }
    if (r.bands >= 2) { sawJump = true; break; }
  }
  ok(allEq, '里程碑逐格補報：發放數恰等於 eff 段數（不吞段）', lastInfo);
  ok(sawJump, '至少一場出現跨 ≥2 段的跳升並全數補報', lastInfo);
  console.log('\nRESULT mines-3bv: ' + pass + ' pass / ' + fail + ' fail' + (fails.length ? ' FAILS: ' + fails.join('；') : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
