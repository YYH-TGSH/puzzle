// 審查循環第 6 輪 K4（雙頁）：地雷對手晶片固定 eff（3BV）語意——切換觀看者 progMode 不影響對手 %；晶片改共用玩家列同款。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const REG = {}; const errors = [];
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name + (extra ? ' — ' + extra : '')); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(120); } console.log('  (timeout: ' + label + ')'); return null; }
function loadPage(label) {
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String(e.detail && e.detail.message || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(stamp(label + ': ' + m, e.detail && e.detail.stack)); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = REG; w.scrollTo = () => {}; w.addEventListener('error', ev => { if (ev.message && !/Script error/.test(ev.message)) errors.push(stamp(label + ': ' + ev.message, ev.error && ev.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true, cancelable: true })); return !!el; };
function setInput(w, el, v) { if (!el) return; const st = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; st.call(el, v); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
function setSel(w, el, v) { if (!el) return; const st = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value').set; st.call(el, v); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
const dbg = (p) => p.window.__PLAT_HOOKS_mines && p.window.__PLAT_HOOKS_mines.debug && p.window.__PLAT_HOOKS_mines.debug();
async function makeRace() {
  const H = loadPage('H');
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 90000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 30000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => H.window.__PLAT_NET && H.window.__PLAT_NET.code, 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G');
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 90000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 30000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 60000, 'G in room');
  for (const p of [H, G]) { p.window.PLAT_show('mines'); await waitFor(() => !!p.window.__PLAT_HOOKS_mines, 90000, 'preboot'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="mines"]'));
  await waitFor(() => G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === 'mines', 30000, 'armed');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="race"][data-hub-game="mines"]'));
  await sleep(500);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  await sleep(600);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 60000, 'start');
  if (en) clickEl(H, en);
  await waitFor(() => H.window.__PLAT_NET.inMatch === 'mines' && G.window.__PLAT_NET.inMatch === 'mines', 90000, 'inMatch');
  return { H, G };
}
(async () => {
  const { H, G } = await makeRace();
  // 等兩邊盤面可玩（倒數結束）
  const ready = await waitFor(() => { const a = dbg(H), b = dbg(G); return (a && b && a.cells && a.cells.length > 20 && b.cells && b.cells.length > 20) ? true : null; }, 90000, 'boards');
  check('競速雙頁盤面就緒', !!ready);
  await sleep(3500); // 倒數
  // 來賓點一個 0 格（洪水連鎖：開格% 與 3BV eff 會分岔）
  const gd = dbg(G);
  const zeroIdx = gd.cells.findIndex((c, i) => c === 'h' && !gd.layout[i] && gd.nums[i] === 0);
  check('找到來賓可點的 0 格', zeroIdx >= 0, 'idx=' + zeroIdx);
  const cellEl = G.document.querySelector('#view-mines [data-cell="' + zeroIdx + '"]');
  clickEl(G, cellEl);
  const guestId = (() => { const hd = dbg(H); const pl = (hd.players || []).find(p => p.name === '阿客'); return pl && pl.id; })();
  const godG = await waitFor(() => { const hd = dbg(H); const g = hd.god && hd.god[guestId]; return (g && typeof g.effProgress === 'number' && g.effProgress > 0) ? g : null; }, 30000, 'host god eff>0');
  check('房主端收到來賓 eff 進度 > 0', !!godG, godG && ('eff=' + godG.effProgress + ' prog=' + godG.progress));
  await sleep(600);
  const chip = () => H.document.querySelector('#view-mines [data-fly-uid="' + guestId + '"]');
  const c0 = chip();
  check('K4 對手晶片存在（data-fly-uid 錨點保留）', !!c0);
  check('K4 晶片改共用款（border-slate-800、無 slate-300）', !!c0 && (c0.className || '').includes('border-slate-800') && !(c0.className || '').includes('border-slate-300'), c0 && c0.className);
  check('K4 晶片含 plat-pbar 進度條與左色邊', !!c0 && !!c0.querySelector('.plat-pbar') && [...c0.querySelectorAll('div')].some(d => (d.className || '').includes('absolute left-0')));
  const effPct = Math.floor((godG ? godG.effProgress : 0) * 100);
  const openPct = Math.floor((godG ? (godG.progress || 0) : 0) * 100);
  // PlatPct 是滾字元件：可讀值在 .plat-count 的 aria-label（textContent 是整條數字帶，不能拿來比）
  const chipPct = () => { const c = chip(); const pc = c && c.querySelector('.plat-count'); return pc ? pc.getAttribute('aria-label') : null; };
  check('K4 晶片 % ＝ eff（3BV）語意', chipPct() === effPct + '%', 'chip=' + chipPct() + ' eff=' + effPct + '% open=' + openPct + '%');
  if (openPct !== effPct) check('K4 晶片 % ≠ 開格%（兩語意確實分岔且顯示取 eff）', chipPct() !== openPct + '%');
  // 切換房主（觀看者）自己的 progMode → 對手晶片不得變
  const progEl = [...H.document.querySelectorAll('#view-mines div')].find(dv => /^(進度（3BV）|開格)/.test((dv.textContent || '').trim()) && dv.className.includes('cursor-pointer'));
  check('找到房主自己的進度切換文字', !!progEl);
  const beforeMode = dbg(H).progMode;
  clickEl(H, progEl);
  await sleep(700);
  check('房主 progMode 已切換', dbg(H).progMode !== beforeMode, beforeMode + ' -> ' + dbg(H).progMode);
  check('K4 切換觀看者 progMode 後對手晶片 % 不變', chipPct() === effPct + '%', 'chip=' + chipPct());
  check('全程零頁面錯誤', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log('RESULT round6b(K4): ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
