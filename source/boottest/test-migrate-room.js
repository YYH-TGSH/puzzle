// 殼稽核修 [1]：房主在「房間頁」（非對局中）斷線 → 來賓A接管、來賓B接管重連 → Net.restored 不可殘留
// 否則新房主開下一局時，B 收到 launch 只切畫面不 enter，永遠進不了局（v1.14.2 修：restored 只在對局中才設 + 回房間/結束場次一律清）
// 注意：mockpeer 已改深拷貝訊息（對齊真實 PeerJS 序列化）；舊版傳參照會讓跨頁共用 roster 物件、選舉被污染成雙房主
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
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block'; };
async function joinAs(G, code, name) {
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, G.label + ' nick');
  setInput(G.window, G.document.querySelector('#lob-name'), name);
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
}
(async () => {
  const H = loadPage('H'), A = loadPage('A'), B = loadPage('B');
  for (const p of [H, A, B]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.PlatDock) ? true : null, 120000, p.label + ' shell'); if (!ok) { console.log('SHELL NOT READY ' + p.label, p.errors.slice(0, 3)); process.exit(2); } }
  // 建房 + 兩位來賓（A 先入房＝接管順位第一）
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '原房主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => hubRoom(H) && H.window.__PLAT_NET.code, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;
  await joinAs(A, code, '接管者');
  await waitFor(() => H.window.__PLAT_NET.roster.length >= 2 && hubRoom(A), 90000, 'A in');
  await joinAs(B, code, '重連者');
  await waitFor(() => H.window.__PLAT_NET.roster.length >= 3 && hubRoom(B), 90000, 'B in');
  check('前置：三人房間頁就緒', H.window.__PLAT_NET.roster.length >= 3);

  // 房主在房間頁離開（host-leaving 廣播 → 全員走接管選舉；mock 的 peer.destroy 不斷連線，不能用來模擬斷線）
  H.window.__PLAT_NOTIFY('player-leave');
  const promoted = await waitFor(() => A.window.__PLAT_NET.isHost && A.window.__PLAT_NET.active ? true : null, 90000, 'A promoted');
  check('A 接管成為新房主', !!promoted);
  const bBack = await waitFor(() => B.window.__PLAT_NET.active && !B.window.__PLAT_NET.migrating && hubRoom(B) ? true : null, 90000, 'B reconnected');
  check('B 接管重連回房間頁', !!bBack);
  check('B 的 restored 旗標未殘留（房間頁接管不該設）', B.window.__PLAT_NET.restored === false, 'restored=' + B.window.__PLAT_NET.restored);
  await sleep(1500);

  // 新房主開數獨合作 → B 必須真的進局（舊 bug：只切畫面不 enter，inMatch 有值但遊戲沒開始）
  clickEl(A, A.document.querySelector('#lob-step-room [data-pr="ready"]'));
  clickEl(B, B.document.querySelector('#lob-step-room [data-pr="ready"]'));
  await sleep(600);
  const sb = await waitFor(() => { const b = A.document.querySelector('#lob-step-room [data-pr="start"]'); return b && !b.disabled ? b : null; }, 90000, 'A start enabled');
  check('新房主開始鈕啟用（合作）', !!sb);
  if (sb) clickEl(A, sb);
  const inM = await waitFor(() => A.window.__PLAT_NET.inMatch === 'sudoku' && B.window.__PLAT_NET.inMatch === 'sudoku' ? true : null, 60000, 'both inMatch');
  check('雙邊 inMatch=sudoku', !!inM);
  const liveB = await waitFor(() => { const v = B.document.querySelector('#view-sudoku'); return v && v.textContent.includes('合作模式') && v.textContent.includes('玩家') ? true : null; }, 90000, 'B board live');
  check('B 數獨合作盤面真的出現（有 enter，不是只有切畫面）', !!liveB);
  const liveA = await waitFor(() => { const v = A.document.querySelector('#view-sudoku'); return v && v.textContent.includes('合作模式') ? true : null; }, 60000, 'A board live');
  check('A 數獨合作盤面出現', !!liveA);
  check('零錯誤', A.errors.length === 0 && B.errors.length === 0, (A.errors[0] || '') + '|' + (B.errors[0] || ''));
  console.log('\n=== migrate-room: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
