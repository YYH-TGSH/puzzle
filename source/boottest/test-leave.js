// v1.12.0 驗收：連線模式退出改版（標頭退出選單→個人退出回大廳/他人繼續、房主選單回等待室、來賓重連、房主退房由來賓接管）
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
  const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
  // 退出選單：F3 起離開選單是殼 PlatLeaveMenu（body 層 #plat-leave-menu，不在 #view-* 內）——全文件找標題浮層（2026-11-21 修：舊版只搜 #view 內、永遠找不到，整支連鎖假失敗）
  const menuBtn = (p, view, text) => {
    const root = p.document; if (!root) return null;
    const menus = [...root.querySelectorAll('div')].filter(d => (d.textContent || '').includes('要離開對局嗎？') && (d.className || '').includes('inset-0'));
    for (const m of menus) { const b = [...m.querySelectorAll('button')].find(x => (x.textContent || '').includes(text)); if (b) return b; }
    return null;
  };
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell ready'); if (!ok) { console.log('SHELL NOT READY ' + p.label, p.errors.slice(0, 3)); process.exit(2); } }

  // 1) 建房/入房 → 房間頁
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  check('房主建房 → 房間頁', !!await waitFor(() => hubRoom(H), 60000, 'H hub room'));
  const code = H.window.__PLAT_NET.code;
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙';
  G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  check('來賓入房 → 房間頁', !!await waitFor(() => hubRoom(G), 60000, 'G hub room'));

  // 2) 數獨大亂鬥：雙邊準備 → 開始 → 自動開局
  const startMatch = async (tag) => {
    const startBtn = () => H.document.querySelector('#lob-step-room [data-pr="start"]');
    const hUid = H.window.__PLAT_NET.myUid, gUid = G.window.__PLAT_NET.myUid;
    if (!H.window.__PLAT_NET.hub.ready[hUid]) clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
    if (!(G.window.__PLAT_NET.hub.ready || {})[gUid] && !H.window.__PLAT_NET.hub.ready[gUid]) clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
    const un = await waitFor(() => { const b = startBtn(); return (b && !b.disabled) ? b : null; }, 30000, tag + ' start unlocked');
    if (un) clickEl(H, un);
    return waitFor(() => (H.window.__PLAT_NET.inMatch === 'sudoku' && G.window.__PLAT_NET.inMatch === 'sudoku') ? true : null, 60000, tag + ' both inMatch');
  };
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="brawl"]'));
  await sleep(600);
  check('開局一：雙邊進數獨', !!await startMatch('m1'));
  const cd = await waitFor(() => (H.window.PlatCountdown && H.window.PlatCountdown._visible()) || (G.window.PlatCountdown && G.window.PlatCountdown._visible()) ? true : null, 90000, 'm1 countdown');
  check('開局一：倒數出現（對局進行中）', !!cd);
  await sleep(1500);

  // 3) 來賓從標頭退出選單個人退出 → 回大廳；房主繼續對局
  clickEl(G, G.document.querySelector('#view-sudoku [data-ptc="leave"]'));
  const gLeave = await waitFor(() => menuBtn(G, 'sudoku', '退出（回大廳）'), 30000, 'G exit menu');
  check('來賓退出選單出現（含退出（回大廳））', !!gLeave);
  if (gLeave) clickEl(G, gLeave);
  const gOut = await waitFor(() => !G.window.__PLAT_NET.active ? true : null, 30000, 'G left');
  check('來賓個人退出 → 離房回大廳', !!gOut);
  await sleep(1200);
  check('房主不受影響、還在對局中', H.window.__PLAT_NET.inMatch === 'sudoku' && H.window.__PLAT_NET.active, String(H.window.__PLAT_NET.inMatch));

  // 4) 房主用選單回等待室 → 回房間頁
  clickEl(H, H.document.querySelector('#view-sudoku [data-ptc="leave"]'));
  const hBack = await waitFor(() => menuBtn(H, 'sudoku', '回等待室'), 30000, 'H exit menu');
  check('房主退出選單有「回等待室」', !!hBack);
  if (hBack) clickEl(H, hBack);
  const hRoom = await waitFor(() => (hubRoom(H) && !H.window.__PLAT_NET.inMatch) ? true : null, 60000, 'H back room');
  check('房主回等待室 → 回房間頁', !!hRoom);

  // 5) 來賓一鍵重連回房間（沒有重連鈕就手動入房）
  // v1.12.2：重連鈕是探測式——先等它探測到房間還在、亮藍可點（找房中是 disabled 的灰鈕）
  let rejoinBtn = await waitFor(() => { const b = G.document.querySelector('#lob-rejoin'); return (b && b.style.display !== 'none' && !b.disabled && (b.textContent || '').includes('回到房間')) ? b : null; }, 30000, 'G rejoin btn alive');
  check('重連鈕探測到房間還在 → 亮藍可點', !!rejoinBtn);
  if (rejoinBtn) { clickEl(G, rejoinBtn); }
  else {
    click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick2');
    G.document.querySelector('#lob-name').value = '來賓乙';
    G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  }
  const gBackIn = await waitFor(() => (hubRoom(G) && H.window.__PLAT_NET.roster.length >= 2) ? true : null, 60000, 'G rejoined');
  check('來賓回到房間（名單恢復兩人）', !!gBackIn, rejoinBtn ? '一鍵重連' : '手動入房');

  // 6) 再開一局 → 房主個人退出 → 來賓接管成新房主、對局由新房主延續
  check('開局二：雙邊進數獨', !!await startMatch('m2'));
  await sleep(2500);
  clickEl(H, H.document.querySelector('#view-sudoku [data-ptc="leave"]'));
  const hLeave = await waitFor(() => menuBtn(H, 'sudoku', '退出（回大廳）'), 30000, 'H exit menu leave');
  check('房主退出選單出現', !!hLeave);
  if (hLeave) clickEl(H, hLeave);
  const promoted = await waitFor(() => (G.window.__PLAT_NET.isHost && G.window.__PLAT_NET.active) ? true : null, 90000, 'G promoted');
  check('房主退出 → 來賓接管成為新房主', !!promoted);
  const hOut = await waitFor(() => !H.window.__PLAT_NET.active ? true : null, 30000, 'H left');
  check('原房主已離房回大廳', !!hOut);
  await sleep(2000);
  check('新房主仍在對局中（接管延續）', G.window.__PLAT_NET.inMatch === 'sudoku', String(G.window.__PLAT_NET.inMatch));

  check('H 零頁面錯誤', H.errors.length === 0, H.errors.slice(0, 2).join(' | '));
  check('G 零頁面錯誤', G.errors.length === 0, G.errors.slice(0, 2).join(' | '));
  console.log('RESULT: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.log('FATAL', e && e.message); process.exit(2); });
