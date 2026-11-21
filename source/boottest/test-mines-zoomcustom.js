// 踩地雷 v1.35 驗證：PlatBar 縮放接線、自訂盤面（單機＋多人）、盤面邊緣虛化/卷軸指示條
// 背景：v1.31 只做了卡片內 🔍 縮放，殼 PlatBar 左下角縮放組（＋/－/循環）在地雷沒人接 onAction → 按了沒反應（使用者截圖回報）。
// 自訂盤面：sizeId='custom'＋regCustomSpec 註冊規格貫穿；多人由房主 hub 表單設定、INIT/MINE_START 帶 custom 給來賓。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
const html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8')
  .replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(200); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
let pass = 0, fail = 0; const fails = [];
function ok(cond, label, extra) { if (cond) { pass++; console.log('✅', label); } else { fail++; fails.push(label); console.log('❌', label, extra || ''); } }
const SHARED_REG = {};
function loadPage() {
  const errs = [];
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errs.push(stamp(String(m))));
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs };
}
function setInput(w, el, val) { if (!el) return false; const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); return true; }
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
const dbg = (p) => p.window.__PLAT_HOOKS_mines && p.window.__PLAT_HOOKS_mines.debug && p.window.__PLAT_HOOKS_mines.debug();

async function soloPart() {
  console.log('--- 單機：自訂盤面＋縮放＋捲動 UI ---');
  const P = loadPage(); const w = P.window, d = P.document;
  ok(!!(await waitFor(() => typeof w.PLAT_show === 'function' && w.PlatDock && d.querySelector('#view-home button'), 180000, 'shell')), '殼就緒');
  w.PLAT_show('mines');
  ok(!!(await waitFor(() => d.querySelector('#mines-root h1'), 90000, 'mines home')), '地雷主畫面');
  const clickBtn = (pred, scope) => { const b = [...(scope || d).querySelectorAll('button')].find(pred); if (b) { b.click(); return true; } return false; };
  ok(clickBtn(b => b.textContent.includes('單機挑戰'), d.querySelector('#mines-root')), '點單機挑戰');
  await sleep(300);
  // 自訂盤面已收編殼 PlatSetup 的 custom 區塊（F2）：overlay 在 body 層
  ok(clickBtn(b => b.textContent.includes('自訂盤面'), d.querySelector('#plat-setup')), 'PlatSetup 有自訂盤面區、點展開');
  await sleep(300);
  const inputs = [...d.querySelectorAll('#plat-setup [data-pse-field]')];
  ok(inputs.length === 3, '自訂欄位 3 個（寬/高/雷）', 'n=' + inputs.length);
  setInput(w, inputs[0], '12'); setInput(w, inputs[1], '10'); setInput(w, inputs[2], '20');
  const startBtn = await waitFor(() => [...d.querySelectorAll('#plat-setup button')].find(b => b.textContent.includes('開始：12×10・20 雷')) || null, 10000, 'start label');
  ok(!!startBtn, '開始鈕顯示 clamp 後規格 12×10・20 雷');
  if (startBtn) startBtn.click();
  const cellEls = () => [...d.querySelectorAll('#mines-root button[data-cell]')];
  ok(!!(await waitFor(() => cellEls().length === 120, 20000, '120 cells')), '自訂盤面 120 格（12×10）');
  let snap = dbg(P);
  ok(snap && snap.sizeId === 'custom', 'sizeId = custom', snap && String(snap.sizeId));
  ok(snap && snap.layout && snap.layout.filter(Boolean).length === 20, '雷數 = 20');
  ok([...d.querySelectorAll('#mines-root [data-ptc-spec], #mines-root [data-ptc="spec"]')].some(s => { const t = s.textContent || ''; return t.includes('12×10・20 雷') && (t.match(/雷/g) || []).length === 1; }), '頂欄規格標籤顯示 12×10・20 雷（雷數只印一次）'); // 規格籤已收編殼 PlatTopCard（F2）；v1.66.2 雷數不得重複印
  let saved = null; try { saved = w.PlatSave.read('mines_custom_cfg', { fallback: null }); } catch (e) {}
  ok(saved && saved.w === 12 && saved.h === 10 && saved.mines === 20, '自訂設定已持久化', JSON.stringify(saved)); // 走 PlatSave.read 解 envelope（同 test-mines-solo 診斷，2026-11-15）

  // --- PlatBar 縮放（左下角，本次修復主角） ---
  const cellW = () => parseFloat((cellEls()[0] && cellEls()[0].style.width) || '0');
  const w0 = cellW();
  ok(w0 > 0, '初始格寬有值', w0 + 'px');
  ok(clickEl(P, d.querySelector('#view-mines [data-pb="zoom-toggle"]')), '點 PlatBar 縮放開關');
  await sleep(250);
  ok(clickEl(P, d.querySelector('#view-mines [data-pb="zoom-in"]')), '點 PlatBar ＋');
  await sleep(250);
  ok(clickEl(P, d.querySelector('#view-mines [data-pb="zoom-in"]')), '再點 PlatBar ＋');
  ok(!!(await waitFor(() => { const s = dbg(P); return s && s.zoom === 1.5 ? true : null; }, 10000, 'zoom 1.5')), 'PlatBar ＋×2 → zoom = 1.5', 'zoom=' + (dbg(P) || {}).zoom);
  const w1 = cellW();
  ok(w1 > w0 * 1.4, '格寬隨縮放變大（' + w0 + ' → ' + w1 + 'px）');
  const tog = d.querySelector('#view-mines [data-pb="zoom-toggle"]');
  ok(!!tog && tog.textContent.includes('150%'), 'PlatBar 縮放鈕顯示 150%');
  // v1.72.3 項2：循環鈕改適應模式循環（手動→適應寬度↔️→適應高度↕️→自動🔲）——jsdom 無 layout、適應值只驗「已離開手動值且 glyph 換段」，真值由 CDP fit-mines.log 驗
  ok(clickEl(P, d.querySelector('#view-mines [data-pb="zoom-cycle"]')), '點 PlatBar 循環鈕');
  ok(!!(await waitFor(() => { const b = d.querySelector('#view-mines [data-pb="zoom-cycle"]'); return b && b.textContent.includes('↔️') ? true : null; }, 10000, 'glyph fit-w')), '循環 → 適應寬度模式（glyph ↔️）');
  ok(!!(await waitFor(() => { const s = dbg(P); return s && s.zoom !== 1.5 ? true : null; }, 10000, 'zoom fit')), '循環 → zoom 改為適應值（離開手動 1.5）', 'zoom=' + (dbg(P) || {}).zoom);
  // 卡片內 🔍 那組與 PlatBar 共用同一顆 zoom：開卡片組、按「適應」應回到 1＋手動模式
  const hdrZoom = [...d.querySelectorAll('#view-mines button')].find(b => (b.getAttribute('title') || '').includes('調整盤面大小'));
  ok(!!hdrZoom, '卡片內 🔍 鈕存在'); if (hdrZoom) hdrZoom.click();
  await sleep(250);
  ok(clickBtn(b => b.textContent.trim() === '適應', d.querySelector('#view-mines')), '卡片內「適應」鈕');
  ok(!!(await waitFor(() => { const s = dbg(P); return s && s.zoom === 1 ? true : null; }, 10000, 'zoom back 1')), '適應 → zoom 回 1（兩組同步）');
  // 手動步進回歸（原斷言改走 ＋/－ 達成）：＋×4 → 2、－ → 1.75
  if (!d.querySelector('#view-mines [data-pb="zoom-in"]')) { ok(clickEl(P, d.querySelector('#view-mines [data-pb="zoom-toggle"]')), '重開 PlatBar 縮放選單'); await sleep(250); }
  for (let k = 0; k < 4; k++) { ok(clickEl(P, d.querySelector('#view-mines [data-pb="zoom-in"]')), '點 PlatBar ＋(' + (k + 1) + ')'); await sleep(200); }
  ok(!!(await waitFor(() => { const s = dbg(P); return s && s.zoom === 2 ? true : null; }, 10000, 'zoom 2')), '＋×4 → zoom = 2');
  ok(clickEl(P, d.querySelector('#view-mines [data-pb="zoom-out"]')), '點 PlatBar －');
  ok(!!(await waitFor(() => { const s = dbg(P); return s && s.zoom === 1.75 ? true : null; }, 10000, 'zoom 1.75')), '－ → zoom = 1.75');

  // --- 邊緣虛化＋指示條（jsdom 無 layout：stub 捲動幾何後觸發 scroll/render 更新） ---
  const scroller = d.querySelector('#view-mines .mines-board-scroll');
  ok(!!scroller, '盤面捲動容器存在（.mines-board-scroll）');
  if (scroller) {
    let SL = 0, ST = 0;
    Object.defineProperty(scroller, 'scrollWidth', { configurable: true, get: () => 600 });
    Object.defineProperty(scroller, 'clientWidth', { configurable: true, get: () => 300 });
    Object.defineProperty(scroller, 'scrollHeight', { configurable: true, get: () => 900 });
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, get: () => 400 });
    Object.defineProperty(scroller, 'scrollLeft', { configurable: true, get: () => SL, set: v => { SL = v; } });
    Object.defineProperty(scroller, 'scrollTop', { configurable: true, get: () => ST, set: v => { ST = v; } });
    scroller.dispatchEvent(new w.Event('scroll', { bubbles: true }));
    await sleep(400);
    const wrap = scroller.parentElement;
    const fadeR = [...wrap.querySelectorAll('div')].find(x => (x.style.background || '').includes('to right'));
    const fadeB = [...wrap.querySelectorAll('div')].find(x => { const bg = x.style.background || ''; return bg.includes('255, 251, 243') && !bg.includes('to right') && !bg.includes('to left') && !bg.includes('to top'); }); // jsdom 序列化會把預設方向 'to bottom' 吃掉，改以顏色指紋＋排除其他三邊辨識
    const fadeL = [...wrap.querySelectorAll('div')].find(x => (x.style.background || '').includes('to left'));
    const fadeT = [...wrap.querySelectorAll('div')].find(x => (x.style.background || '').includes('to top'));
    ok(!!fadeR && fadeR.style.opacity === '1', '右邊還有題目 → 右緣虛化顯示');
    ok(!!fadeB && fadeB.style.opacity === '1', '下邊還有題目 → 下緣虛化顯示');
    ok(!!fadeL && fadeL.style.opacity === '0', '在最左緣 → 左緣不虛化');
    ok(!!fadeT && fadeT.style.opacity === '0', '在最上緣 → 上緣不虛化');
    const trackV = [...wrap.children].find(x => x.style && x.style.width === '6px');
    const trackH = [...wrap.children].find(x => x.style && x.style.height === '6px');
    ok(!!trackV && trackV.style.display === 'block', '直向卷軸指示條顯示');
    ok(!!trackH && trackH.style.display === 'block', '橫向卷軸指示條顯示');
    SL = 150; ST = 200; // 捲到中間：四邊都有沒看到的題目
    scroller.dispatchEvent(new w.Event('scroll', { bubbles: true }));
    await sleep(400);
    ok(!!fadeL && fadeL.style.opacity === '1', '向右捲走 → 左緣虛化顯示');
    ok(!!fadeT && fadeT.style.opacity === '1', '向下捲走 → 上緣虛化顯示');
    ok(!!fadeR && fadeR.style.opacity === '1' && !!fadeB && fadeB.style.opacity === '1', '中間位置 → 右/下緣仍虛化');
    SL = 300; ST = 500; // 捲到最右下
    scroller.dispatchEvent(new w.Event('scroll', { bubbles: true }));
    await sleep(400);
    ok(!!fadeR && fadeR.style.opacity === '0', '捲到最右 → 右緣虛化消失');
    ok(!!fadeB && fadeB.style.opacity === '0', '捲到最下 → 下緣虛化消失');
  }
  ok(P.errors.length === 0, '單機段零頁面錯誤', P.errors.slice(0, 3).join(' | '));
}

async function mpPart() {
  console.log('--- 多人：房主自訂盤面同步來賓 ---');
  const H = loadPage(); const G = loadPage();
  for (const p of [H, G]) await waitFor(() => typeof p.window.PLAT_show === 'function' && p.window.PlatDock, 180000, 'shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET && H.window.__PLAT_NET.code; }, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 90000, 'G in room');
  for (const p of [H, G]) { p.window.PLAT_show('mines'); await waitFor(() => !!p.window.__PLAT_HOOKS_mines, 300000, 'preboot mines'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="mines"]'));
  await waitFor(() => G.window.__PLAT_NET && G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === 'mines', 30000, 'guest armed mines');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="race"][data-hub-game="mines"]'));
  await sleep(600);
  const sizeSel = H.document.querySelector('#lob-step-room select[data-hub-game="mines"][data-hub-key="sizeId"]');
  ok(!!sizeSel, '房主表單有盤面 select');
  if (sizeSel) { sizeSel.value = 'custom'; sizeSel.dispatchEvent(new H.window.Event('change', { bubbles: true })); }
  const setHubNum = async (key, val) => { const el = await waitFor(() => H.document.querySelector('#lob-step-room input[data-hub-game="mines"][data-hub-key="' + key + '"]'), 15000, 'hubnum ' + key); if (el) { el.value = String(val); el.dispatchEvent(new H.window.Event('change', { bubbles: true })); await sleep(350); } return !!el; };
  ok(await setHubNum('customW', 12), '自訂寬度欄位出現並可填');
  ok(await setHubNum('customH', 10), '自訂高度欄位出現並可填');
  ok(await setHubNum('customMines', 20), '自訂雷數欄位出現並可填');
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  await sleep(700);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 90000, 'start enabled');
  ok(!!en, '開始鈕可按'); if (en) clickEl(H, en);
  await waitFor(() => H.window.__PLAT_NET.inMatch === 'mines' && G.window.__PLAT_NET.inMatch === 'mines', 120000, 'inMatch');
  const bothPlaying = await waitFor(() => { const a = dbg(H), b = dbg(G); return a && b && a.mp.phase === 'playing' && b.mp.phase === 'playing' ? true : null; }, 60000, 'both playing');
  ok(!!bothPlaying, '雙邊進入 playing');
  const hCells = H.document.querySelectorAll('#view-mines [data-cell]').length;
  const gCells = G.document.querySelectorAll('#view-mines [data-cell]').length;
  ok(hCells === 120 && gCells === 120, '雙邊盤面皆 120 格（12×10）', 'H=' + hCells + ' G=' + gCells);
  ok(dbg(H).sizeId === 'custom' && dbg(G).sizeId === 'custom', '雙邊 sizeId = custom');
  ok(JSON.stringify(dbg(H).layout) === JSON.stringify(dbg(G).layout), '雙邊同 seed 同盤面');
  ok(dbg(G).layout.filter(Boolean).length === 20, '來賓盤雷數 = 20');
  ok((G.document.querySelector('#view-mines').textContent || '').includes('12×10・20 雷'), '來賓頂欄顯示自訂規格');
  ok(H.errors.length === 0 && G.errors.length === 0, '多人段零頁面錯誤', (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
}

(async () => {
  await soloPart();
  await mpPart();
  console.log('\n==== RESULT: ' + pass + ' passed, ' + fail + ' failed ====');
  if (fails.length) console.log('fails:', fails.join(' ;; '));
  process.exit(fail ? 1 : 0);
})();
