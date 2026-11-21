// 回歸：數獨大亂鬥開局韌性（使用者 2026-10-31 回報：房主卡等待盤面、來賓永遠等房主連線）
// 情景 A：來賓的第一個 JOIN 在傳輸中遺失 → 來賓必須重送 JOIN 才能進局
// 情景 B：來賓的殼連線在開局前斷掉、開局時重建且 open 延遲 3 秒 → VirtualConn 的 open 回呼必須在實體連線 open 時補發，JOIN 才送得出去
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

async function scenario(name, setup) {
  const SHARED_REG = {};
  function loadPage(label, openDelay) {
    const errs = [];
    const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
    vc.on('error', m => errs.push(stamp(String(m))));
    const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; if (openDelay) w.__MOCK_OPEN_DELAY__ = openDelay; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); } });
    return { window: dom.window, document: dom.window.document, errors: errs, label };
  }
  const T0 = Date.now();
  const H = loadPage('H', 0); const G = loadPage('G', setup.guestOpenDelay || 0);
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
  if (setup.dropJoin) SHARED_REG.__dropOnce = 'JOIN';
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await sleep(600);
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="brawl"]'));
  await sleep(800);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const startBtn = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
  check(name + '：開始鈕解鎖', !!startBtn);
  if (setup.killGuestConn) {
    // 開始前一刻才刪來賓端連線條目（不 close）：房主端連線還在、launch 照樣送達；來賓的遊戲層 connect() 將被迫新建實體連線（open 延遲 3 秒，涵蓋整個遊戲啟動窗）
    const N = G.window.__PLAT_NET;
    for (const pid in N.conns) { delete N.conns[pid]; }
  }
  clickEl(H, startBtn);
  const digits = (p) => { const v = p.document.querySelector('#view-sudoku'); return v ? [...v.querySelectorAll('svg text')].filter(t => /[1-9]/.test(t.textContent || '')).length : 0; };
  const timerRunning = (p) => { const v = p.document.querySelector('#view-sudoku'); const m = v && (v.textContent || '').match(/⏱ 00:(\d\d)/); return m ? +m[1] : -1; };
  const started = await waitFor(() => (digits(H) > 10 && digits(G) > 10 && timerRunning(H) >= 2 && timerRunning(G) >= 2) ? true : null, 90000, name + ' both playing');
  check(name + '：雙邊盤面有題目且計時在跑（房主 ' + digits(H) + ' 數字/來賓 ' + digits(G) + ' 數字）', !!started);
  check(name + '：雙邊零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + (G.errors[0] || ''));
  const log = (SHARED_REG.__msglog || []).filter(m => m.type === 'JOIN' || m.type === 'INIT');
  console.log('  [' + name + '] msglog JOIN/INIT:', JSON.stringify(log.map(m => m.type + '@' + (m.t - T0) + 'ms')));
  const logAll = (SHARED_REG.__msglog || []).slice(0, 8);
  console.log('  [' + name + '] first msgs:', JSON.stringify(logAll.map(m => m.type + '/' + (m.stamp || '-'))));
  H.window.close(); G.window.close();
}
(async () => {
  await scenario('A 遺失第一個JOIN', { dropJoin: true });
  await scenario('B 連線重建+open延遲', { killGuestConn: true, guestOpenDelay: 3000 });
  console.log('\n=== brawl-start: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(2); });
