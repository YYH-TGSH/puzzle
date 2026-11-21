// v1.61.1 缺陷防再犯：class 字串拼接少空格（token 黏連）——靜態掃描（class 屬性內三種拼接形式）＋三處行為斷言。
// 事故：數獨觀戰膠囊選取態 "…1)]" + "bg-slate-800" 黏成無效 token＋text-white 生效 → 白字白底隱形（使用者截圖）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name + (extra ? ' — ' + extra : '')); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(120); } console.log('  (timeout: ' + label + ')'); return null; }

// ---------- 掃描器（與稽核指定形式同型＋template literal＋混引號） ----------
function scanJoins(src) {
  const hits = [];
  const forms = [
    /class(?:Name)?=\{\s*(["'])([^"']*)\1 \+ \([^?]*?\? (["'])([^"']*)\3 : (["'])([^"']*)\5\)/g,
    /class="([^"]*)" \+ \([^?]*?\? (["'])([^"']*)\2 : (["'])([^"']*)\4\)/g,
    /class(?:Name)?=\{`([^`]*?)\$\{[^}]*?\? (["'])([^"']*)\2 : (["'])([^"']*)\4\}/g,
  ];
  forms.forEach((re, fi) => {
    let m;
    while ((m = re.exec(src))) {
      const head = fi === 0 ? m[2] : m[1];
      const A = fi === 0 ? m[4] : m[3], B = fi === 0 ? m[6] : m[5];
      const headLast = head.length ? head[head.length - 1] : ' ';
      if (headLast !== ' ' && ((A && A[0] !== ' ') || (B && B[0] !== ' '))) hits.push(fi + '@' + m.index);
    }
  });
  return hits;
}
// 掃描器牙齒自驗：三種有 bug 的片段必須被抓、安全片段不得誤報
check('掃描器自驗：字串拼接黏連被抓', scanJoins('className={"a b-c] "}').length === 0 && scanJoins('<button className={"x shadow-[1px_1px_0px_rgba(0,0,0,1)]" + (c ? "bg-red-500 t" : "bg-white t")}>').length === 1);
check('掃描器自驗：混引號（單引號分支）黏連被抓', scanJoins('<button className={"x shadow-[1px_1px_0px_rgba(0,0,0,1)]" + (c ? \'bg-amber-400 t\' : \'bg-white t\')}>').length === 1);
check('掃描器自驗：template literal 黏連被抓', scanJoins('<div className={`x y${c ? \'bg-red-500\' : \'bg-white\'}`}>').length === 1);
check('掃描器自驗：安全片段不誤報（前導空格/空分支/head 空）', scanJoins('<button className={"x y" + (c ? " bg-red-500" : "")}>').length === 0 && scanJoins('<div className={`${c ? \'bg-red-500\' : \'bg-white\'}`}>').length === 0 && scanJoins('<button className={"x y " + (c ? "bg-red-500" : "bg-white")}>').length === 0);
// 四份原始碼同型 junction 為零
const SRC = { shell: '/home/hatch/workspace/platform/shell.js', sudoku: '/home/hatch/workspace/sudoku-site/js/app.js', hashi: '/home/hatch/workspace/hashi-site/js/app.js', mines: '/home/hatch/workspace/mines-site/js/app.js' };
for (const [n, p] of Object.entries(SRC)) check('靜態掃描 ' + n + ' 黏連為零', scanJoins(fs.readFileSync(p, 'utf8')).length === 0);

// ---------- 行為 ----------
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const REG = {}; const errors = [];
function loadPage(label) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String(e.detail && e.detail.message || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(label + ': ' + m); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = REG; w.scrollTo = () => {}; try { w.localStorage.setItem('sudoku_input_mode', 'cell'); } catch (e) {} w.addEventListener('error', ev => { if (ev.message && !/Script error/.test(ev.message)) errors.push(label + ': ' + ev.message); }); } });
  return { window: dom.window, document: dom.window.document, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true, cancelable: true })); return !!el; };
function setInput(w, el, v) { if (!el) return; const st = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; st.call(el, v); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
const tokens = (el) => (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
function visibleChain(el) { let n = el; while (n && n !== el.ownerDocument.body) { if (n.style && n.style.display === 'none') return false; n = n.parentElement; } return true; }
function readBoard(D) { const cells = {}; D.querySelectorAll('#view-sudoku g[id^="cell-"]').forEach(g => { const id = g.getAttribute('id').slice(5); const t = (g.textContent || '').trim(); cells[id] = t ? parseInt(t, 10) : 0; }); return cells; }
function solveN(board) {
  const ids = Object.keys(board); const N = Math.round(Math.sqrt(ids.length)); const B = N === 4 ? 2 : 3;
  const grid = {}; ids.forEach(id => { grid[id] = board[id]; });
  const ok = (id, v) => { const [x, y] = id.split('-').map(Number); for (const o of ids) { if (o === id) continue; const [ox, oy] = o.split('-').map(Number); if (grid[o] === v && (ox === x || oy === y || (Math.floor(ox / B) === Math.floor(x / B) && Math.floor(oy / B) === Math.floor(y / B)))) return false; } return true; };
  const empties = ids.filter(id => !grid[id]);
  const bt = (i) => { if (i === empties.length) return true; const id = empties[i]; for (let v = 1; v <= N; v++) { if (ok(id, v)) { grid[id] = v; if (bt(i + 1)) return true; grid[id] = 0; } } return false; };
  bt(0); return grid;
}
async function fillCells(p) {
  const sol = solveN(readBoard(p.document));
  for (let passN = 0; passN < 5; passN++) {
    const cur = readBoard(p.document);
    const todo = Object.keys(cur).filter(id => !cur[id]);
    if (!todo.length) break;
    for (const id of todo) {
      const g = p.document.querySelector('#view-sudoku g[id="cell-' + id + '"]');
      if (!g) continue;
      clickEl(p, g); await sleep(80);
      const btns = [...p.document.querySelectorAll('#view-sudoku button')].filter(b => (b.textContent || '').trim() === String(sol[id]));
      if (btns.length) clickEl(p, btns[0]);
      await sleep(80);
    }
    await sleep(300);
  }
}
(async () => {
  // ===== 數獨雙頁：房主完賽 → 觀戰膠囊選取態 token =====
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
  for (const p of [H, G]) { p.window.PLAT_show('sudoku'); await waitFor(() => !!p.window.__PLAT_HOOKS_sudoku, 90000, 'preboot'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await waitFor(() => G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === 'sudoku', 30000, 'armed');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="brawl"][data-hub-game="sudoku"]'));
  await sleep(500);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  await sleep(600);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 60000, 'start');
  if (en) clickEl(H, en);
  await waitFor(() => H.window.__PLAT_NET.inMatch === 'sudoku' && G.window.__PLAT_NET.inMatch === 'sudoku', 90000, 'inMatch');
  await waitFor(() => Object.keys(readBoard(H.document)).length > 10, 60000, 'H board');
  await sleep(3600); // 倒數
  await fillCells(H);
  const capsule = await waitFor(() => { const bs = [...H.document.querySelectorAll('#view-sudoku button')].filter(b => (b.textContent || '').includes('阿客') && (b.textContent || '').includes('%')); return bs.length ? bs[0] : null; }, 60000, 'god capsule');
  const zc = H.document.querySelector('#view-sudoku .custom-scrollbar');
  check('數獨內容容器底部留白蓋過固定底列（pb-28／md:pb-24）', !!zc && tokens(zc).includes('pb-28') && tokens(zc).includes('md:pb-24'), zc && zc.getAttribute('class'));
  check('數獨觀戰膠囊出現（阿客＋%）', !!capsule, capsule && capsule.textContent.trim());
  if (capsule) {
    const tk = tokens(capsule);
    check('選取中膠囊含獨立 token bg-slate-800', tk.includes('bg-slate-800'), tk.join(' '));
    check('選取中膠囊含獨立 token text-white', tk.includes('text-white'));
    check('膠囊無黏連殘渣（無 )]bg token）', !tk.some(t => t.includes(')]bg')));
    check('膠囊在可見層級（祖先無 display:none）', visibleChain(capsule));
  }
  // ===== 數橋單頁：PlatSetup 難度選取鈕（F3 起難度改殼 PlatSetup、遊戲內 modal 已刪；選取態＝inline background accent） =====
  const P = loadPage('P');
  await waitFor(() => typeof P.window.PLAT_show === 'function' && P.window.PlatDock, 90000, 'P shell');
  P.window.PLAT_show('hashi');
  const soloBtn = await waitFor(() => [...P.document.querySelectorAll('#view-hashi button')].find(b => (b.textContent || '').includes('單機')), 60000, 'hashi home');
  clickEl(P, soloBtn);
  const lvBtns = await waitFor(() => { const bs = [...P.document.querySelectorAll('#plat-setup [data-pse-opt]')].filter(b => /幼幼班|標準|魔王|史詩|直式/.test(b.textContent || '')); return bs.length >= 3 ? bs : null; }, 30000, 'hashi setup');
  check('數橋 PlatSetup 難度選項開啟（殼 overlay）', !!lvBtns, lvBtns && String(lvBtns.length));
  if (lvBtns) {
    const sel = lvBtns.filter(b => (b.getAttribute('style') || '').includes('background:#4ade80'));
    check('數橋選中難度恰一顆（inline background=accent #4ade80）', sel.length === 1, 'sel=' + sel.length);
    check('數橋 PlatSetup 無黏連殘渣', !lvBtns.some(b => tokens(b).some(t => t.includes(')]bg'))));
  }
  // ===== 地雷單頁：PlatSetup 尺寸選取鈕（F2 起設定改殼 PlatSetup、遊戲內 modal 已刪） =====
  const M = loadPage('M');
  await waitFor(() => typeof M.window.PLAT_show === 'function' && M.window.PlatDock, 90000, 'M shell');
  M.window.PLAT_show('mines');
  const mSolo = await waitFor(() => [...M.document.querySelectorAll('#view-mines button')].find(b => (b.textContent || '').includes('單機挑戰')), 60000, 'mines home');
  clickEl(M, mSolo);
  const mOpt9 = await waitFor(() => M.document.querySelector('#plat-setup [data-pse-opt="9"]'), 30000, 'mines setup');
  clickEl(M, mOpt9);
  await waitFor(() => M.document.querySelectorAll('#view-mines [data-cell]').length === 81, 30000, 'mines board');
  await sleep(500);
  clickEl(M, M.document.querySelector('#mines-root [data-ptc="spec"]'));
  const szBtns = await waitFor(() => { const bs = [...M.document.querySelectorAll('#plat-setup [data-pse-opt]')]; return bs.length >= 2 ? bs : null; }, 20000, 'mines in-game setup'); // 局內尺寸預設 2 顆（9/16）＋自訂區，實測形狀
  check('地雷 PlatSetup 尺寸選項出現（局內）', !!szBtns, szBtns && String(szBtns.length));
  if (szBtns) {
    const sel = szBtns.filter(b => (b.getAttribute('style') || '').includes('background:#f97316'));
    check('地雷選中尺寸恰一顆（inline background=accent #f97316）', sel.length === 1, 'sel=' + sel.length);
    check('地雷 PlatSetup 無黏連殘渣', !szBtns.some(b => tokens(b).some(t => t.includes(')]bg'))));
  }
  check('全程零頁面錯誤', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log('RESULT classjoin: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
