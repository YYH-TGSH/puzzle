// WAITFOR_CAP_MS 放寬理由（甲案後半）：本套件含 1.3MB bundle 的 jsdom 開機等待（600s 寫法），上限放寬至 240 秒防解析尖峰誤殺；其餘 in-flow 等待仍受此上限快速失敗。
const WAITFOR_CAP_MS = 240000;
// 踩地雷競速道具/禮物（v1.30）驗證：
// 里程碑發放、回填（3×3＋連鎖整片）、問號干擾（未定數字 3–6 格變 ？）、正確插旗送禮物（鎖定旗 'L' 不可拔/不可挖）、最後一位持有道具轉禮物
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
let mock = require('./mockpeer.js'); // mockpeer.js 是 module.exports 字串，必須 require，不能 readFileSync（會把 wrapper 一起注入頁面）
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
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
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
function setSel(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const dbg = (p) => p.window.__PLAT_HOOKS_mines.debug();
const itemSum = (p) => { const it = dbg(p).items || {}; return (it.question || 0) + (it.backfill || 0); };

async function makeRoom() {
  const H = loadPage('H'); H.label = 'H';
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 600000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET && H.window.__PLAT_NET.code; }, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G'); G.label = 'G';
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 600000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 90000, 'G in room');
  for (const p of [H, G]) {
    p.window.PLAT_show('mines');
    await waitFor(() => !!p.window.__PLAT_HOOKS_mines, 300000, 'preboot mines');
    p.window.PLAT_show('lobby');
  }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="mines"]'));
  await waitFor(() => G.window.__PLAT_NET && G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === 'mines', 30000, 'guest armed mines');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="race"][data-hub-game="mines"]'));
  await sleep(600);
  const sel = H.document.querySelector('#lob-step-room [data-hub-key="itemStartTime"][data-hub-game="mines"]');
  check('大廳競速設定有道具延遲選項', !!sel);
  if (sel) setSel(H.window, sel, '0'); // 延遲 0：里程碑立刻發放
  await sleep(400);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  await sleep(700);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 90000, 'start enabled');
  if (en) clickEl(H, en);
  await waitFor(() => H.window.__PLAT_NET.inMatch === 'mines' && G.window.__PLAT_NET.inMatch === 'mines', 120000, 'inMatch mines');
  await sleep(800);
  return { H, G };
}
function cellEl(p, idx) { return p.document.querySelector('#view-mines [data-cell="' + idx + '"]'); }
function clickCell(p, idx) { const el = cellEl(p, idx); if (!el) return false; el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return true; }
function flagCell(p, idx) { const el = cellEl(p, idx); if (!el) return false; el.dispatchEvent(new p.window.MouseEvent('contextmenu', { bubbles: true })); return true; }
// 測試端自算連鎖揭露範圍（與遊戲 doReveal 同規則：空格 BFS＋邊界數字）
function revealSet(d, start) {
  const W = 9, Hh = 9, out = new Set();
  if (d.layout[start]) return out;
  if (d.nums[start] > 0) { out.add(start); return out; }
  const q = [start], zeros = new Set([start]);
  const nb = (i) => { const x = i % W, y = Math.floor(i / W), r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < Hh && (dx || dy)) r.push(ny * W + nx); } return r; };
  while (q.length) { const z = q.pop(); out.add(z); for (const n of nb(z)) { if (!d.layout[n] && d.nums[n] === 0 && !zeros.has(n)) { zeros.add(n); q.push(n); } } }
  for (const z of zeros) for (const n of nb(z)) if (!d.layout[n]) out.add(n);
  return out;
}
function pickFlood(p, maxReveal) { // 找一個連鎖範圍 ≤ maxReveal 的未開空格
  const d = dbg(p);
  for (let i = 0; i < 81; i++) { if (!d.layout[i] && d.nums[i] === 0 && d.cells[i] === 'h') { const s = revealSet(d, i); if (s.size >= 4 && s.size <= maxReveal) return { idx: i, size: s.size }; } }
  return null;
}
function injectToGuest(G, H, pd) {
  const conn = G.window.__PLAT_NET.conns[H.window.__PLAT_NET.myPid];
  if (!conn || !conn._h || !conn._h.data) return false;
  const copy = JSON.parse(JSON.stringify({ __pg: 'mines', __pd: pd }));
  conn._h.data.slice().forEach(f => { try { f(copy); } catch (e) {} });
  return true;
}

(async () => {
  const { H, G } = await makeRoom();
  const bothPlaying = await waitFor(() => { const a = dbg(H), b = dbg(G); return a.mp.phase === 'playing' && b.mp.phase === 'playing' ? true : null; }, 60000, 'both playing');
  check('競速開局 playing（道具場）', !!bothPlaying);
  const gUid = G.window.localStorage.getItem('plat_uid_mines');

  // ---------- Phase A：里程碑發放 + 回填（連鎖整片） ----------
  const fA = pickFlood(H, 45);
  check('房主找得到適中連鎖區', !!fA, fA ? 'size=' + fA.size : 'none');
  clickCell(H, fA.idx);
  await waitFor(() => dbg(H).openedSafe >= fA.size - 1, 20000, 'H flood opened');
  check('房主連鎖打開', dbg(H).openedSafe >= 4, 'opened=' + dbg(H).openedSafe);
  const mile = await waitFor(() => (itemSum(H) + itemSum(G) >= 1) ? true : null, 30000, 'milestone grant');
  check('里程碑：跨 5% 後房主發出道具（雙邊合計 ≥1）', !!mile, 'H=' + itemSum(H) + ' G=' + itemSum(G));
  const gBackBefore = (dbg(G).items || {}).backfill || 0;
  injectToGuest(G, H, { type: 'MINE_GRANT', toUid: gUid, item: 'backfill' });
  await waitFor(() => ((dbg(G).items || {}).backfill || 0) === gBackBefore + 1, 15000, 'G backfill +1');
  check('注入 GRANT：來賓回填 +1', ((dbg(G).items || {}).backfill || 0) === gBackBefore + 1);
  const bfBtn = await waitFor(() => { const b = G.document.querySelector('#view-mines button[title^="回填"]'); return b && !b.disabled ? b : null; }, 20000, 'G backfill btn');
  check('來賓道具列有回填鈕可按', !!bfBtn);
  if (bfBtn) clickEl(G, bfBtn);
  const covered = await waitFor(() => dbg(H).openedSafe === 0 ? true : null, 25000, 'H backfilled to 0');
  check('回填：3×3 命中連鎖區 → 整片空格＋邊界數字全蓋回（openedSafe 歸 0）', !!covered, 'opened=' + dbg(H).openedSafe);

  // ---------- Phase B：問號干擾 ----------
  const fB = pickFlood(H, 45);
  clickCell(H, fB.idx);
  await waitFor(() => dbg(H).openedSafe >= 4, 20000, 'H flood B');
  const gQBefore = (dbg(G).items || {}).question || 0;
  injectToGuest(G, H, { type: 'MINE_GRANT', toUid: gUid, item: 'question' });
  await waitFor(() => ((dbg(G).items || {}).question || 0) === gQBefore + 1, 15000, 'G question +1');
  const qBtn = await waitFor(() => { const b = G.document.querySelector('#view-mines button[title^="問號干擾"]'); return b && !b.disabled ? b : null; }, 20000, 'G question btn');
  check('來賓道具列有問號鈕可按', !!qBtn);
  if (qBtn) clickEl(G, qBtn);
  const qfx = await waitFor(() => { const q = dbg(H).qfx || {}; const ks = Object.keys(q); return ks.length >= 3 && ks.length <= 6 ? ks : null; }, 25000, 'H qfx 3-6');
  check('問號干擾：房主 3–6 個未定數字變問號', !!qfx, 'n=' + (qfx ? qfx.length : 0));
  if (qfx) {
    const idx0 = Number(qfx[0]);
    check('問號格在房主畫面上真的顯示 ？', (cellEl(H, idx0) || {}).textContent === '?', 'text=' + ((cellEl(H, idx0) || {}).textContent || ''));
    check('問號只是顯示層：盤面狀態仍是已開', dbg(H).cells[idx0] === 'o', 'st=' + dbg(H).cells[idx0]);
  }

  // ---------- Phase C：正確插旗 → 禮物 → 鎖定旗 ----------
  check('送禮前提：房主進度 > 來賓進度', dbg(H).progress > dbg(G).progress, 'H=' + dbg(H).progress.toFixed(2) + ' G=' + dbg(G).progress.toFixed(2));
  const hd = dbg(H);
  const minesH = []; for (let i = 0; i < 81; i++) if (hd.layout[i] && hd.cells[i] === 'h') minesH.push(i);
  flagCell(H, minesH[0]); await sleep(900);
  console.log('  [C診斷] flag1 idx=' + minesH[0] + ' Hcell=' + dbg(H).cells[minesH[0]] + ' credit=' + dbg(H).giftCredit);
  flagCell(H, minesH[1]); await sleep(900);
  console.log('  [C診斷] flag2 idx=' + minesH[1] + ' Hcell=' + dbg(H).cells[minesH[1]] + ' credit=' + dbg(H).giftCredit);
  const giftHeld = await waitFor(() => ((dbg(G).items || {}).gift || 0) >= 1 ? true : null, 25000, 'G gift held');
  check('禮物改持有制：來賓收到禮物進禮物鈕（尚未發動、盤面無 L）', !!giftHeld && (dbg(G).cells || '').indexOf('L') < 0, 'gift=' + ((dbg(G).items || {}).gift || 0));
  const giftBtn = await waitFor(() => { const b = G.document.querySelector('#view-mines button[title^="禮物"]'); return b && !b.disabled ? b : null; }, 15000, 'G gift btn');
  check('來賓禮物鈕可按', !!giftBtn);
  if (giftBtn) clickEl(G, giftBtn);
  const gotL = await waitFor(() => { const c = dbg(G).cells; for (let i = 0; i < 81; i++) if (c[i] === 'L') return i; return null; }, 25000, 'G locked flag');
  check('禮物：來賓按下禮物鈕後盤面出現鎖定旗 L', gotL !== null && gotL !== undefined, 'idx=' + gotL);
  if (gotL !== null && gotL !== undefined) {
    check('鎖定旗標在真雷上', !!dbg(G).layout[gotL]);
    clickCell(G, gotL); await sleep(500);
    check('鎖定旗點了不會被挖開', dbg(G).cells[gotL] === 'L', 'st=' + dbg(G).cells[gotL]);
    flagCell(G, gotL); await sleep(500);
    check('鎖定旗拔不掉', dbg(G).cells[gotL] === 'L', 'st=' + dbg(G).cells[gotL]);
  }

  // ---------- Phase D：最後一位轉禮物（改測來賓：道具可用注入確定給到、房主踩雷出局） ----------
  if (itemSum(G) === 0) injectToGuest(G, H, { type: 'MINE_GRANT', toUid: gUid, item: 'backfill' });
  const gHolds = await waitFor(() => itemSum(G) >= 1 ? true : null, 20000, 'G holds item');
  check('最後一位前置：來賓持有道具', !!gHolds, 'items=' + JSON.stringify(dbg(G).items));
  const countL = (p) => { const c = dbg(p).cells || ''; let n = 0; for (let i = 0; i < c.length; i++) if (c[i] === 'L') n++; return n; };
  const heldAtk = itemSum(G), giftBefore = (dbg(G).items || {}).gift || 0, lBefore = countL(G);
  const hd2 = dbg(H);
  let hMine = -1; for (let i = 0; i < 81; i++) if (hd2.layout[i] && hd2.cells[i] === 'h') { hMine = i; break; }
  clickCell(H, hMine); // 第一顆雷：被容錯擋下（記 ✗ 續玩）
  await sleep(800);
  check('容錯：房主第一顆雷記 ✗ 續玩（未出局）', dbg(H).cells[hMine] === 'x' && dbg(H).status !== 'lost' && dbg(H).mistakes === 1, 'cell=' + dbg(H).cells[hMine] + ' status=' + dbg(H).status);
  const hd3 = dbg(H);
  let hMine2 = -1; for (let i = 0; i < 81; i++) if (hd3.layout[i] && hd3.cells[i] === 'h') { hMine2 = i; break; }
  clickCell(H, hMine2); // 第二顆雷：容錯用完 → 房主出局 → 來賓成為最後一位
  await sleep(500);
  const conv = await waitFor(() => itemSum(G) === 0 && ((dbg(G).items || {}).gift || 0) === giftBefore + heldAtk ? true : null, 30000, 'G converted');
  check('最後一位：房主出局後，來賓攻擊道具全轉禮物庫存（攻擊歸 0、禮物 += 持有數）', !!conv, 'items=' + JSON.stringify(dbg(G).items) + ' want gift=' + (giftBefore + heldAtk));
  const giftBtn2 = await waitFor(() => { const b = G.document.querySelector('#view-mines button[title^="禮物"]'); return b && !b.disabled ? b : null; }, 15000, 'G gift btn 2');
  if (giftBtn2) clickEl(G, giftBtn2);
  const lAfter = await waitFor(() => countL(G) === lBefore + 1 ? true : null, 15000, 'G L +1 after gift use');
  check('轉換後的禮物可由玩家自己按下發動（L +1）', !!lAfter, 'L ' + lBefore + '->' + countL(G));

  // ---------- Phase E：禮物先到、首點搬雷不得孤兒化鎖定旗（使用者實機截圖 bug） ----------
  const R2 = await makeRoom();
  const H2 = R2.H, G2 = R2.G;
  const play2 = await waitFor(() => { const a = dbg(H2), b = dbg(G2); return a.mp.phase === 'playing' && b.mp.phase === 'playing' ? true : null; }, 60000, 'room2 playing');
  check('第二場開局 playing（搬雷場景）', !!play2);
  const g2Uid = G2.window.localStorage.getItem('plat_uid_mines');
  for (let k = 0; k < 3; k++) injectToGuest(G2, H2, { type: 'MINE_GRANT', toUid: g2Uid, item: 'gift' });
  const threeL = await waitFor(() => { const c = dbg(G2).cells || ''; let n = 0; for (let i = 0; i < c.length; i++) if (c[i] === 'L') n++; return n >= 3 ? true : null; }, 30000, 'G2 3 locks');
  check('禮物集滿 3 自動使用：來賓未動手先有 3 支鎖定旗', !!threeL);
  const d2 = dbg(G2);
  const nbOf = (i) => { const x = i % 9, y = Math.floor(i / 9), r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < 9 && ny < 9 && (dx || dy)) r.push(ny * 9 + nx); } return r; };
  let lIdx = -1, clickIdx = -1;
  for (let i = 0; i < 81 && clickIdx < 0; i++) if (d2.cells[i] === 'L') { for (const n of nbOf(i)) if (!d2.layout[n] && d2.cells[n] === 'h') { lIdx = i; clickIdx = n; break; } }
  check('找得到鎖定旗的安全鄰格當首挖', clickIdx >= 0, 'L=' + lIdx + ' click=' + clickIdx);
  clickCell(G2, clickIdx); // 第一挖：zone 蓋住鎖定旗的雷 → 觸發首點搬雷
  await sleep(1500);
  const d3 = dbg(G2);
  check('首點搬雷後：鎖定旗還標在真雷上（雷沒被搬走）', d3.layout[lIdx] === true && d3.cells[lIdx] === 'L', 'layout=' + d3.layout[lIdx] + ' cell=' + d3.cells[lIdx]);
  check('首挖格維持正確數字（鄰雷 ≥1 且畫面顯示該數字）', d3.nums[clickIdx] >= 1 && (cellEl(G2, clickIdx) || {}).textContent === String(d3.nums[clickIdx]), 'num=' + d3.nums[clickIdx] + ' text=' + ((cellEl(G2, clickIdx) || {}).textContent || ''));
  const allLTrue = (() => { const d = dbg(G2); for (let i = 0; i < 81; i++) if (d.cells[i] === 'L' && !d.layout[i]) return false; return true; })();
  check('三支鎖定旗全標在真雷上（無孤兒旗）', allLTrue);
  // ---------- Phase F：盤面縮放（比照數獨，使用者要求 40 雷手機太小可調） ----------
  const wBefore = parseInt(((cellEl(H2, 0) || {}).style || {}).width || '0', 10);
  const zoomBtn = H2.document.querySelector('#view-mines button[title^="調整盤面大小"]');
  check('縮放鈕存在（控制卡）', !!zoomBtn);
  if (zoomBtn) clickEl(H2, zoomBtn);
  await sleep(400);
  const plusBtn = H2.document.querySelector('#view-mines button[title="放大"]');
  check('展開後有放大鈕', !!plusBtn);
  if (plusBtn) clickEl(H2, plusBtn);
  await sleep(500);
  const wAfter = parseInt(((cellEl(H2, 0) || {}).style || {}).width || '0', 10);
  check('放大後格子變大（zoom=1.25）', dbg(H2).zoom === 1.25 && wAfter > wBefore, 'zoom=' + dbg(H2).zoom + ' w ' + wBefore + '->' + wAfter);
  check('第二場雙邊零錯誤', H2.errors.length === 0 && G2.errors.length === 0, (H2.errors[0] || '') + ' | ' + (G2.errors[0] || ''));

  check('雙邊零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
  console.log('\n=== mines-items: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FATAL', e && e.stack || e); process.exit(2); });
