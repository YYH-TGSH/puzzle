// v1.17.6 房間頁 UI：準備/開始懸浮底列＋飄動狀態＋來賓設定反灰（使用者 2026-10-31 指示）
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

  // 切數獨大亂鬥（合作模式沒有準備機制、沒有準備鈕可驗）
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await sleep(600);
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="brawl"]'));
  await sleep(1000);

  const slotCard = (p) => { const s = p.document.querySelector('#lob-step-room [data-pr-slot="settings"]'); return s && s.firstElementChild ? s.firstElementChild : null; };
  const hCard = await waitFor(() => slotCard(H), 15000, 'H settings card');
  const gCard = await waitFor(() => slotCard(G), 15000, 'G settings card');
  check('房主端設定卡不反灰', !!hCard && !hCard.classList.contains('hub-locked'));
  check('來賓端設定卡整卡反灰（hub-locked）', !!gCard && gCard.classList.contains('hub-locked'));
  const gModeBtn = gCard && gCard.querySelector('[data-hub-mode]');
  check('來賓模式鈕 disabled', !!gModeBtn && gModeBtn.disabled === true);

  const controls = (p) => p.document.querySelector('#lob-step-room [data-pr-region="controls"]');
  const hCtl = controls(H), gCtl = controls(G);
  check('controls 是懸浮列（pr-actionbar）', !!hCtl && hCtl.classList.contains('pr-actionbar') && !!gCtl && gCtl.classList.contains('pr-actionbar'));
  let posFixed = false; try { posFixed = G.window.getComputedStyle(gCtl).position === 'fixed'; } catch (e) {}
  check('懸浮列 computed position=fixed', posFixed);

  const readyBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="ready"]');
  const startBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="start"]');
  const rdyG = await waitFor(() => readyBtn(G), 20000, 'G ready btn exists');
  check('大亂鬥模式有準備鈕（雙邊）', !!rdyG && !!readyBtn(H));
  check('來賓未準備：準備鈕帶飄動標記', !!readyBtn(G) && readyBtn(G).getAttribute('data-pr-bob') === '1');
  check('房主未準備：準備鈕帶飄動標記', !!readyBtn(H) && readyBtn(H).getAttribute('data-pr-bob') === '1');

  clickEl(G, readyBtn(G));
  const gReady = await waitFor(() => { const b = readyBtn(G); return (b && b.getAttribute('data-pr-bob') === null) ? b : null; }, 20000, 'G bob off');
  check('來賓按下準備後：飄動標記消失', !!gReady);

  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  const gTourn = await waitFor(() => { const el = G.document.querySelector('#lob-tourn-setup'); return (el && el.classList.contains('hub-locked')) ? el : null; }, 20000, 'G tourn locked');
  check('來賓錦標賽表單反灰（hub-locked）', !!gTourn);
  const hTourn = H.document.querySelector('#lob-tourn-setup');
  check('房主錦標賽表單不反灰', !!hTourn && !hTourn.classList.contains('hub-locked'));
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await sleep(800);

  clickEl(H, readyBtn(H));
  const unlocked = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
  check('全員準備後：房主開始鈕解鎖（CSS :not(:disabled) 開始飄）', !!unlocked);
  check('雙邊零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + (G.errors[0] || ''));
  console.log('\n=== roomui: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(2); });
