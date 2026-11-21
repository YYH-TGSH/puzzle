// 審查循環第 3 輪（v1.59.0）：H1 錦標賽狀態列 Roll、H2 錯誤橫幅進退場、H3 禮物 Fly（數獨收禮實測＋PlatFly 行為）。
// jsdom 無版面引擎：只替 [data-fly-uid]／[data-fly-me]／#btn-open-gift 錨點捏造 getBoundingClientRect（其餘元素走原實作），驗的是 Fly 的建立/上限/移除與接線，不是幾何。
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
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
function patchRects(p) { // 只給 Fly 錨點捏造尺寸/位置（依 uid 雜湊錯開，讓起訖點不同）
  const proto = p.window.Element.prototype; const orig = proto.getBoundingClientRect;
  proto.getBoundingClientRect = function () {
    const uid = this.getAttribute && (this.getAttribute('data-fly-uid') || (this.id === 'btn-open-gift' ? 'giftbtn' : this.getAttribute('data-fly-me')));
    if (uid) { let h = 0; for (const ch of uid) h = (h * 31 + ch.charCodeAt(0)) % 400; return { width: 90, height: 26, left: 40 + h, top: 60 + (h % 120), right: 130 + h, bottom: 86 + (h % 120), x: 40 + h, y: 60 + (h % 120) }; }
    return orig.call(this);
  };
}
(async () => {
  const H = loadPage('H'); const G = loadPage('G');
  const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell'); if (!ok) { console.log('SHELL NOT READY', p.label); process.exit(2); } }

  // ---------- H2 錯誤橫幅 ----------
  H.window.__PLAT_ERRBAR.show('❌ 測試錯誤：SomethingBad happened');
  await sleep(60);
  const bar = H.document.querySelector('#plat-errbar');
  check('H2 橫幅顯示（display flex）', !!bar && bar.style.display === 'flex');
  check('H2 進場帶滑入 class', !!bar && bar.classList.contains('plat-err-in'));
  check('H2 文字第一幀即完整', !!bar && bar.querySelector('#plat-errbar-text').textContent === '❌ 測試錯誤：SomethingBad happened');
  H.window.__PLAT_ERRBAR.hide();
  await sleep(40);
  check('H2 退場先帶淡出 class（尚未 display:none）', !!bar && bar.classList.contains('plat-err-out') && bar.style.display === 'flex');
  await sleep(300);
  check('H2 淡出後才 display:none', !!bar && bar.style.display === 'none');

  // ---------- PlatFly 行為（殼首頁兩顆鈕當錨點） ----------
  patchRects(H);
  const a1 = H.document.querySelector('#lob-go-create'), a2 = H.document.querySelector('#lob-go-join');
  // 用 data-fly-uid 臨時標記（patchRects 只認錨點屬性）
  a1.setAttribute('data-fly-uid', 'anchorA'); a2.setAttribute('data-fly-uid', 'anchorB');
  H.window.PlatFly.fly(a1, a2, '🎁');
  await sleep(50);
  check('H3 Fly 圖示建立', !!H.document.querySelector('.plat-fly-icon'));
  for (let i = 0; i < 5; i++) H.window.PlatFly.fly(a1, a2, '🎁');
  await sleep(30);
  const flying = H.document.querySelectorAll('.plat-fly-icon').length;
  check('H3 同時最多 3 顆在飛（合併上限）', flying <= 3, 'flying=' + flying);
  await sleep(900);
  check('H3 Fly 播完自動移除', H.document.querySelectorAll('.plat-fly-icon').length === 0);
  a1.removeAttribute('data-fly-uid'); a2.removeAttribute('data-fly-uid');

  // ---------- 建房（給 H1/H3 用） ----------
  const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
  H.window.PLAT_show('lobby'); G.window.PLAT_show('lobby');
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  await waitFor(() => hubRoom(H), 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙'; G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  await waitFor(() => hubRoom(G), 60000, 'G room');
  await waitFor(() => H.window.__PLAT_NET.roster.length === 2 ? true : null, 30000, 'roster 2');

  // ---------- H1 錦標賽狀態列 ----------
  H.document.querySelector('#t-rounds').value = '3';
  clickEl(H, H.document.querySelector('[data-rtab="tourn"]'));
  await sleep(1200);
  const readyBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="ready"]');
  const startBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="start"]');
  await waitFor(() => readyBtn(G) && readyBtn(H), 20000, 'ready btns');
  clickEl(G, readyBtn(G)); clickEl(H, readyBtn(H));
  const sb = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled && b.textContent.includes('開賽')) ? b : null; }, 30000, 'tourn start enabled');
  check('H1 錦標賽開賽鈕啟用', !!sb);
  clickEl(H, sb);
  const statusSpan = (p) => { const spans = [...p.document.querySelectorAll('#lob-tourn span')]; return spans.find(x => /進行中：|局結束，下一局|總冠軍：|加賽一局數橋決勝/.test(x.textContent)) || null; }; // 狀態 span 本人（prLiteSpan 輸出）；回合晶片文字不含這些字樣，不會誤中
  const playing = await waitFor(() => { const sp = statusSpan(H); return (sp && /第 1 局進行中/.test(sp.textContent)) ? sp : null; }, 60000, 'tourn playing status');
  check('H1 第 1 局狀態列文字正確', !!playing, playing && playing.textContent);
  await waitFor(() => (H.window.__PLAT_NET.inMatch && G.window.__PLAT_NET.inMatch) ? true : null, 90000, 'both in match');
  await sleep(9000); // 等倒數/開局完成，force-end 才有局可結
  H.window.__PLAT_TOURN_FORCEEND();
  const rolled = await waitFor(() => { const sp = statusSpan(H); return (sp && /局結束/.test(sp.textContent) && sp.classList.contains('plat-lite-in')) ? sp : null; }, 45000, 'standings roll');
  check('H1 跨局狀態列換字帶滾換 class', !!rolled, rolled && rolled.textContent);
  await sleep(900); // 先退出 400ms 續滾窗口
  clickEl(H, H.document.querySelector('[data-rtab="sudoku"]')); await sleep(400);
  clickEl(H, H.document.querySelector('[data-rtab="tourn"]')); await sleep(500); // 切分頁會觸發 renderTourn 重渲染（同字 → 不得重播）
  const settledSpan = statusSpan(H);
  check('H1 同局重渲染不重播滾換', !!settledSpan && /局結束/.test(settledSpan.textContent) && !settledSpan.classList.contains('plat-lite-in'), settledSpan && settledSpan.textContent);
  // 中止賽程回房間（給 H3 騰場）
  const abort = await waitFor(() => H.document.querySelector('#t-abort'), 20000, 'abort btn');
  if (abort) clickEl(H, abort);
  await sleep(1500);

  // ---------- H3 數獨收禮 Fly（注入與真網路同路徑） ----------
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await sleep(600);
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="brawl"]'));
  await sleep(800);
  await waitFor(() => readyBtn(G) && readyBtn(H), 20000, 'ready btns 2');
  for (const p of [H, G]) { const rb = readyBtn(p); if (rb && !rb.textContent.includes('已準備')) clickEl(p, rb); }
  const sb2 = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled) ? b : null; }, 30000, 'start 2');
  clickEl(H, sb2);
  const inGame = await waitFor(() => { const v = G.document.querySelector('#view-sudoku'); return (v && v.classList.contains('active')) ? true : null; }, 90000, 'G in sudoku');
  check('H3 來賓進入數獨大亂鬥', !!inGame);
  await waitFor(() => G.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? true : null, 90000, 'G cells');
  patchRects(G);
  await sleep(8000);
  const hostPid = H.window.__PLAT_NET.myPid, gUid = G.window.localStorage.getItem('plat_uid_sudoku'), hUid = H.window.localStorage.getItem('plat_uid_sudoku');
  function inject(pd) {
    const conn = G.window.__PLAT_NET.conns[hostPid];
    if (!conn || !conn._h || !conn._h.data) return false;
    const copy = JSON.parse(JSON.stringify({ __pg: 'sudoku', __pd: pd }));
    conn._h.data.slice().forEach(f => { try { f(copy); } catch (e) {} });
    return true;
  }
  inject({ type: 'RECEIVE_GIFT', targetUid: gUid, senderUid: hUid, id: 'fly1', timestamp: Date.now() });
  const flySeen = await waitFor(() => G.document.querySelector('.plat-fly-icon') ? true : null, 5000, 'G fly icon');
  check('H3 數獨收禮：來賓頁出現 Fly 圖示', !!flySeen);
  const giftBtn = await waitFor(() => G.document.querySelector('#btn-open-gift'), 15000, 'G gift btn');
  check('H3 禮物狀態照常入帳（禮物鈕出現，Fly 不影響數值）', !!giftBtn);
  await sleep(900);
  check('H3 Fly 播完移除（不留殘節點）', G.document.querySelectorAll('.plat-fly-icon').length === 0);

  check('H 零頁面錯誤', H.errors.length === 0, H.errors.slice(0, 2).join(' | '));
  check('G 零頁面錯誤', G.errors.length === 0, G.errors.slice(0, 2).join(' | '));
  console.log('RESULT round3: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
