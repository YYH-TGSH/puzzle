// v1.23.0 數獨道具批（使用者 2026-11-01 定案）：集滿 3 個同種道具 → 自動連續發動並歸零。
// - 武器（水球/橡皮擦）：持有達 3 自動連發 3 次（沿用既有自動選目標），背包歸零
// - 未拆禮物：累積達 3 自動拆開（拆禮物本來就是一次全拆；防囤禮物最後逆轉）
// 驗法：雙頁 hub→數獨 brawl 開局，經 mock 連線 data handler 注入 RECEIVE_WEAPON / RECEIVE_GIFT（與真網路同路徑）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
html = html.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errs.push(stamp(String(m))));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
(async () => {
  const H = loadPage('H'); const G = loadPage('G');
  const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell'); if (!ok) { console.log('SHELL NOT READY', p.label); process.exit(2); } }
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  await waitFor(() => hubRoom(H), 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙'; G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  await waitFor(() => hubRoom(G), 60000, 'G room');
  await waitFor(() => H.window.__PLAT_NET.roster.length === 2 ? true : null, 30000, 'roster 2');
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await sleep(600);
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="brawl"]'));
  await sleep(800);
  const readyBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="ready"]');
  const startBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="start"]');
  await waitFor(() => readyBtn(G) && readyBtn(H), 20000, 'ready btns');
  clickEl(G, readyBtn(G)); clickEl(H, readyBtn(H));
  const unlocked = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
  clickEl(H, unlocked);
  const inGame = await waitFor(() => { const v = G.document.querySelector('#view-sudoku'); return (v && v.classList.contains('active')) ? true : null; }, 90000, 'G in sudoku');
  check('來賓進入數獨競賽', !!inGame);
  const cellsReady = await waitFor(() => G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? true : null, 90000, 'G cells');
  check('來賓盤面生成', !!cellsReady);
  await sleep(8000); // 等倒數結束進 playing（武器/禮物接收都有 matchPhase 守衛）
  const hostPid = H.window.__PLAT_NET.myPid, gUid = G.window.localStorage.getItem('plat_uid_sudoku'), hUid = H.window.localStorage.getItem('plat_uid_sudoku');
  function inject(pd) {
    const conn = G.window.__PLAT_NET.conns[hostPid];
    if (!conn || !conn._h || !conn._h.data) return false;
    const copy = JSON.parse(JSON.stringify({ __pg: 'sudoku', __pd: pd }));
    conn._h.data.slice().forEach(f => { try { f(copy); } catch (e) {} });
    return true;
  }
  const weaponBtn = (icon) => { const bs = [...G.document.querySelectorAll('#view-sudoku button')]; return bs.find(b => (b.textContent || '').includes(icon)) || null; };
  // 水球 ×3 → 自動連發：來賓水球鈕消失（歸零），且房主盤面出現水球霧化遮罩（3 發都打唯一對手＝房主）
  for (let i = 0; i < 3; i++) { inject({ type: 'RECEIVE_WEAPON', targetUid: gUid, weaponType: 'balloon', id: 'wb' + i, timestamp: Date.now() }); await sleep(400); }
  const balloonGone = await waitFor(() => !weaponBtn('💧') ? true : null, 25000, 'balloon autofire clears');
  check('水球集滿 3 自動連發並歸零（💧 鈕消失）', !!balloonGone);
  const hostFog = await waitFor(() => [...H.document.querySelectorAll('#view-sudoku rect')].some(r => (r.getAttribute('fill') || '').includes('frostGrad')) ? true : null, 15000, 'host fogged');
  check('自動連發命中房主（房主盤面出現水球霧化宮格）', !!hostFog);
  // 橡皮擦 ×3 → 自動連發歸零
  for (let i = 0; i < 3; i++) { inject({ type: 'RECEIVE_WEAPON', targetUid: gUid, weaponType: 'eraser', id: 'we' + i, timestamp: Date.now() }); await sleep(400); }
  const eraserGone = await waitFor(() => !weaponBtn('🧹') ? true : null, 25000, 'eraser autofire clears');
  check('橡皮擦集滿 3 自動連發並歸零（🧹 鈕消失）', !!eraserGone);
  // 未拆禮物 ×3 → 自動拆開：禮物鈕出現後自動消失，且來賓盤面被系統揭露的格子增加
  const filledCount = () => [...G.document.querySelectorAll('#view-sudoku g[id^="cell-"] text')].filter(t => /^[1-9]$/.test((t.textContent || '').trim())).length;
  const filledBefore = filledCount();
  for (let i = 0; i < 3; i++) { inject({ type: 'RECEIVE_GIFT', targetUid: gUid, senderUid: hUid, id: 'gf' + i, timestamp: Date.now() }); await sleep(400); }
  const giftBtnGone = await waitFor(() => !G.document.querySelector('#btn-open-gift') ? true : null, 25000, 'gift auto-open clears');
  check('未拆禮物集滿 3 自動拆開（禮物鈕自動消失）', !!giftBtnGone);
  check('自動拆禮物有實際揭露格子', filledCount() >= filledBefore + 2, 'before=' + filledBefore + ' after=' + filledCount());
  check('雙邊零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
  console.log('\n=== sudoku-items: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(2); });
