// 代表色帶入對局回歸（v1.22.0）：大廳摩天輪定的顏色必須原封不動進遊戲——
// 房主色 #00538A（index 10）、來賓色 #87D300（index 6），故意不用 COLORS[0]，舊的座位/隨機配色一眼可辨。
// 用法：GAME=hashi|sudoku|mines node test-color.js（各跑一間房，斷言雙邊遊戲畫面中兩人的顏色）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const GAME = process.env.GAME || 'hashi';
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
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const HOST_COLOR = '#00538A', GUEST_COLOR = '#87D300';
const rgb = (h) => 'rgb(' + parseInt(h.slice(1, 3), 16) + ', ' + parseInt(h.slice(3, 5), 16) + ', ' + parseInt(h.slice(5, 7), 16) + ')';
const NAMES = ['房主甲', '來賓乙'];
function nameOf(el) { const t = el.textContent || ''; for (const n of NAMES) if (t.includes(n)) return n; return null; }
function playerColorIn(view, name) { // 各款精準讀法：數橋＝chip 左邊框色；數獨＝卡片左色條 div；地雷＝名字旁色點 span
  if (!view) return null;
  if (GAME === 'hashi') {
    const chips = [...view.querySelectorAll('span')].filter(s => s.style.borderLeftWidth === '6px' && (s.textContent || '').includes(name));
    return chips.length ? chips[0].style.borderLeftColor : null;
  }
  if (GAME === 'sudoku') {
    const bars = [...view.querySelectorAll('div')].filter(d => (d.className || '').includes('w-1') && d.style.backgroundColor);
    for (const b of bars) { let el = b; for (let k = 0; k < 4 && el; k++) { el = el.parentElement; if (el && nameOf(el) === name) return b.style.backgroundColor; } }
    return null;
  }
  // mines
  const dots = [...view.querySelectorAll('span')].filter(s => (s.className || '').includes('rounded-full') && s.style.background);
  for (const d of dots) { let el = d; for (let k = 0; k < 4 && el; k++) { el = el.parentElement; if (el && nameOf(el) === name) return d.style.backgroundColor || d.style.background; } }
  return null;
}
async function main() {
  const H = loadPage('H'); const G = loadPage('G');
  const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell'); if (!ok) { console.log('SHELL NOT READY', p.label, p.errors.slice(0, 3)); process.exit(2); } }
  // 建房（房主色釘 #00538A）
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲';
  H.window.__PLAT_NET.me.color = HOST_COLOR; H.window.__PLAT_NET.colorPicked = true;
  click(H, '#lob-confirm');
  check('房主進房間頁', !!await waitFor(() => hubRoom(H), 60000, 'H room'));
  const code = H.window.__PLAT_NET.code;
  // 來賓入房（色釘 #87D300）
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙';
  G.document.querySelector('#lob-code').value = code;
  G.window.__PLAT_NET.me.color = GUEST_COLOR; G.window.__PLAT_NET.colorPicked = true;
  click(G, '#lob-confirm');
  check('來賓進房間頁', !!await waitFor(() => hubRoom(G), 60000, 'G room'));
  await waitFor(() => (H.window.__PLAT_NET.roster || []).length >= 2 ? true : null, 30000, 'roster 2');
  // 切到目標遊戲分頁（數獨是預設，免切）
  if (GAME !== 'sudoku') clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="' + GAME + '"]'));
  await waitFor(() => H.window.__PLAT_NET.roomTab === GAME ? true : null, 20000, 'tab ' + GAME);
  // 雙邊準備 → 房主開始
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const startBtn = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return (b && !b.disabled) ? b : null; }, 30000, 'start enabled');
  check('房主開始鈕解鎖', !!startBtn);
  clickEl(H, startBtn);
  const inMatch = await waitFor(() => (H.window.__PLAT_NET.inMatch === GAME && G.window.__PLAT_NET.inMatch === GAME) ? true : null, 90000, 'both inMatch');
  check('雙邊進遊戲 ' + GAME, !!inMatch);
  // 等待畫面中兩人的顏色（雙邊視角各驗一次）
  const viewH = () => H.document.querySelector('#view-' + GAME);
  const viewG = () => G.document.querySelector('#view-' + GAME);
  const seenH = await waitFor(() => { const a = playerColorIn(viewH(), '房主甲'); const b = playerColorIn(viewH(), '來賓乙'); return (a && b) ? { a, b } : null; }, 60000, 'H view colors');
  check('房主畫面：房主色 = 大廳色', !!seenH && seenH.a === rgb(HOST_COLOR), seenH ? seenH.a + ' vs ' + rgb(HOST_COLOR) : 'none');
  check('房主畫面：來賓色 = 大廳色', !!seenH && seenH.b === rgb(GUEST_COLOR), seenH ? seenH.b + ' vs ' + rgb(GUEST_COLOR) : 'none');
  const seenG = await waitFor(() => { const a = playerColorIn(viewG(), '房主甲'); const b = playerColorIn(viewG(), '來賓乙'); return (a && b) ? { a, b } : null; }, 60000, 'G view colors');
  check('來賓畫面：房主色 = 大廳色', !!seenG && seenG.a === rgb(HOST_COLOR), seenG ? seenG.a : 'none');
  check('來賓畫面：來賓色 = 大廳色', !!seenG && seenG.b === rgb(GUEST_COLOR), seenG ? seenG.b : 'none');
  check('零頁面錯誤（房主）', H.errors.length === 0, H.errors[0] || '');
  check('零頁面錯誤（來賓）', G.errors.length === 0, G.errors[0] || '');
  console.log('\n=== color(' + GAME + '): ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('HARNESS', e); process.exit(2); });
