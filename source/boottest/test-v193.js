// v1.11.0 驗收：房間頁分頁同步／回主頁 dock／PlatBar 不翻跳（數橋局中）／來賓頒獎台存活（局間回房間頁）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
if (!html.includes(marker)) { console.log('MARKER MISSING'); process.exit(2); }
html = html.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errs.push(stamp(String(m))));
  const dom = new JSDOM(html, {
    url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); }
  });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
async function main() {
  const H = loadPage('H'); const G = loadPage('G');
  const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  const hubShown = (p) => { const rm = p.document.querySelector('#lob-step-room'); return !!rm && rm.style.display === 'block'; };
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell ready'); if (!ok) { console.log('SHELL NOT READY ' + p.label, p.errors.slice(0, 3)); process.exit(2); } }

  // 建房/入房 → 房間頁
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  await waitFor(() => hubShown(H) ? true : null, 60000, 'H hub');
  check('房主進房間頁（不載入遊戲）', hubShown(H) && H.window.__PLAT_NET.inMatch === null);
  const code = H.window.__PLAT_NET.code;
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙';
  G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  await waitFor(() => hubShown(G) ? true : null, 60000, 'G hub');
  check('來賓進房間頁', hubShown(G) && G.window.__PLAT_NET.inMatch === null);

  // 修6（v1.12.5 改版）：下方正方形 dock 條已整條刪除（聊天/視訊/離開改在 PlatRoom 卡片內）；回房間頁正常
  H.window.PLAT_show('home'); await sleep(300);
  check('修6 H 無 #plat-dock 元素（dock 條已刪）', !H.document.querySelector('#plat-dock'));
  G.window.PLAT_show('home'); await sleep(300);
  check('修6 G 無 #plat-dock 元素（dock 條已刪）', !G.document.querySelector('#plat-dock'));
  H.window.PLAT_show('lobby'); G.window.PLAT_show('lobby');
  const back = await waitFor(() => hubShown(H) && hubShown(G) ? true : null, 30000, 'back to hub');
  check('回房間頁正常（PLAT_show lobby → 房間頁）', !!back);

  // 修1（房內）：房主切錦標賽分頁，來賓跟著切；切回也跟
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  const gTab = await waitFor(() => G.window.__PLAT_NET.roomTab === 'tourn' ? true : null, 15000, 'G roomTab=tourn');
  check('修1 房主切錦標賽→來賓跟著切', !!gTab, String(G.window.__PLAT_NET.roomTab));
  const gTournVis = await waitFor(() => { const r = G.document.querySelector('#lob-step-room [data-pr-region="tourn"]'); return (r && r.style.display !== 'none') ? r : null; }, 15000, 'G tourn region visible');
  check('修1 來賓錦標賽面板可見', !!gTournVis);
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  const gBack = await waitFor(() => G.window.__PLAT_NET.roomTab === 'sudoku' ? true : null, 15000, 'G roomTab back');
  check('修1 房主切回數獨→來賓跟著切回', !!gBack, String(G.window.__PLAT_NET.roomTab));

  // 錦標賽 3 局、數橋先 → 第 1 局數橋自動開賽
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  await waitFor(() => H.document.querySelector('#t-start'), 15000, 't-start');
  H.document.querySelector('#t-rounds').value = '3';
  H.document.querySelector('#t-order').value = 'alt-h';
  H.document.querySelector('#t-order').dispatchEvent(new H.window.Event('change', { bubbles: true }));
  click(H, '#t-start');
  const inH = await waitFor(() => (H.window.__PLAT_NET.inMatch === 'hashi' && G.window.__PLAT_NET.inMatch === 'hashi') ? true : null, 90000, 'round1 hashi both');
  check('錦標賽第1局（數橋）雙邊載入', !!inH);
  // v1.11.1：錦標賽每局要全員在等待卡確認準備，房主才能開始
  const btnByText = (doc, view, text) => { const root = doc.querySelector('#view-' + view) || doc; return [...root.querySelectorAll('button')].find(b => (b.textContent || '').includes(text)) || null; };
  const gRdy = await waitFor(() => btnByText(G.document, 'hashi', '準備好了'), 30000, 'G tourn ready btn');
  if (gRdy) clickEl(G, gRdy);
  const hRdy = await waitFor(() => btnByText(H.document, 'hashi', '準備好了'), 30000, 'H tourn ready btn');
  if (hRdy) clickEl(H, hRdy);
  const hStart = await waitFor(() => { const b = btnByText(H.document, 'hashi', '開始本局'); return (b && !b.disabled) ? b : null; }, 60000, 'H tourn start enabled');
  check('全員準備後房主可開始本局', !!hStart);
  if (hStart) clickEl(H, hStart);
  const cd = await waitFor(() => (H.window.PlatCountdown && H.window.PlatCountdown._visible()) || (G.window.PlatCountdown && G.window.PlatCountdown._visible()) ? true : null, 120000, 'hashi tourn start countdown');
  check('數橋局全員準備後房主開始（倒數出現）', !!cd);
  await sleep(4500); // 等 GO + 棋盤穩定

  // 修4：賽中取樣底部列（房主＋來賓）恆為數橋模式不翻跳
  for (const [p, tag] of [[H, 'H'], [G, 'G']]) {
    const ready = await waitFor(() => p.window.PlatBar._debug().mode0 ? true : null, 30000, tag + ' bar state');
    let flips = 0, last = null; const modes = [];
    for (let i = 0; i < 8; i++) { await sleep(450); const m = p.window.PlatBar._debug().mode0; modes.push(m); if (last !== null && m !== last) flips++; last = m; }
    check('修4 ' + tag + ' 底部列恆為數橋模式不翻跳', !!ready && last === '畫筆' && flips === 0, 'modes=' + modes.join(',') + ' flips=' + flips);
  }

  // 修3：結束本局（v1.11.1 改走標頭「退出」選單）→ 來賓頒獎台跳出且存活（回房間頁不弄消失）
  const hExit = H.document.querySelector('#view-hashi button[title="回首頁/斷線"]');
  if (hExit) clickEl(H, hExit);
  const feBtn = await waitFor(() => btnByText(H.document, 'hashi', '結束本局'), 30000, 'exit menu forceend');
  check('結束本局藏在退出選單裡（無浮動鈕）', !!feBtn && !H.document.querySelector('#plat-forceend'));
  if (feBtn) clickEl(H, feBtn);
  const gPod = await waitFor(() => { const el = G.document.querySelector('#plat-podium'); return (el && el.style.display === 'flex') ? true : null; }, 30000, 'G podium');
  check('修3 來賓跳出小局結算（頒獎台）', !!gPod);
  await sleep(1800);
  const gPodEl = G.document.querySelector('#plat-podium');
  check('修3 來賓頒獎台存活（未被回房間頁弄消失）', !!gPodEl && gPodEl.style.display === 'flex', gPodEl ? gPodEl.style.display : 'no-el');
  const hPodEl = H.document.querySelector('#plat-podium');
  check('房主頒獎台也在', !!hPodEl && hPodEl.style.display === 'flex');
  const gTab2 = await waitFor(() => G.window.__PLAT_NET.roomTab === 'tourn' ? true : null, 15000, 'G back tourn tab');
  check('結算後來賓回到錦標賽分頁（房間頁）', !!gTab2 && hubShown(G));

  const errs = H.errors.concat(G.errors);
  check('零頁面錯誤', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log('RESULT: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.log('FATAL', e && e.message); console.log('RESULT: ' + pass + ' pass, ' + fail + ' fail'); process.exit(2); });
