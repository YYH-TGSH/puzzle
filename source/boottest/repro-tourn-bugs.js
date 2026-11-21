// 複現/驗證（使用者 2026-10-24 01:15 實機，v1.12.2）：
// Bug1 錦標賽分數對錯人（舊完賽補送/舊贏家名單污染新局計分）
// Bug2 第二次數獨大亂鬥按攻擊道具跳「沒有可以攻擊的對手」（舊 brawlWinners 擋光目標）
// 流程：S（來賓先贏）→ H（不動 force-end）→ S（查補送 tripwire → 武器可用 → 房主贏）
// 期望（v1.12.3；v1.14.0 起三款輪替改 5 局，#t-rounds 只有 3/5/7/10）：R4 數獨（第二次）開局 finishOrder 恆空、武器可打、總冠軍=房主（47:38）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
let mock = require('./mockpeer.js');
mock = mock.replace("R.__msglog = R.__msglog || [];", "R.__msglog = R.__msglog || []; R.__fullog = R.__fullog || [];")
           .replace("if (pl && pl.type) R.__msglog.push({", "if (pl && pl.type) { try { R.__fullog.push(pl); } catch (e) {} R.__msglog.push({")
           .replace(": undefined }); } } catch (e) {}", ": undefined }); } } } catch (e) {}");
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
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.localStorage.setItem('sudoku_input_mode', 'number'); w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }

function sudokuSave(p) {
  const ls = p.window.localStorage;
  for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.indexOf('sudoku_prog_') === 0) { try { const v = JSON.parse(ls.getItem(k)); if (v && Array.isArray(v.d) && v.d.length) return v; } catch (e) {} } }
  return null;
}
function getSolution() {
  const log = SHARED_REG.__fullog || [];
  for (let i = log.length - 1; i >= 0; i--) {
    const d = log[i];
    if (!d || !d.data) continue;
    if (d.data.solutionGrid) return d.data.solutionGrid;
    if (d.data.levelData && d.data.levelData.solutionGrid) return d.data.levelData.solutionGrid;
  }
  return null;
}
async function fillCells(p, count, tag) {
  const sol = getSolution();
  if (!sol) { console.log(tag + ': NO SOL'); return 0; }
  let totalDone = 0;
  for (let passN = 0; passN < 4; passN++) {
    const save = sudokuSave(p);
    if (!save) { console.log(tag + ': NO SAVE'); return totalDone; }
    const wrong = save.d.filter(c => !c.isGiven && String(c.value) !== String(sol[c.y][c.x]));
    const todoCells = count == null ? wrong : wrong.slice(0, Math.max(0, count - totalDone));
    if (!todoCells.length) break;
    for (const c of todoCells) {
      const ans = sol[c.y][c.x];
      const view = p.document.querySelector('#view-sudoku');
      const pad = [...view.querySelectorAll('button')].find(b => (b.textContent || '').trim() === String(ans));
      if (!pad) { console.log(tag + ': no pad ' + ans); return totalDone; }
      clickEl(p, pad);
      await sleep(110); // 等 selectedChar 狀態落地（不等待會位移一格）
      const g = view.querySelector('g[id="cell-' + c.id + '"]');
      if (!g) { console.log(tag + ': no cell ' + c.id); return totalDone; }
      clickEl(p, g);
      totalDone++;
      await sleep(60);
    }
    await sleep(400);
  }
  console.log(tag + ': filled total ' + totalDone);
  return totalDone;
}
async function startSudokuRound(H, G) {
  for (const p of [H, G]) {
    const rb = await waitFor(() => [...p.document.querySelectorAll('#view-sudoku button')].find(x => (x.textContent || '').trim() === '✋ 準備好了') || null, 45000, p.label + ' ready btn');
    clickEl(p, rb);
    await sleep(600);
  }
  const sb = await waitFor(() => { const b = [...H.document.querySelectorAll('#view-sudoku button')].find(x => (x.textContent || '').includes('開始本局')); return (b && !b.disabled) ? b : null; }, 45000, 'host start enabled');
  clickEl(H, sb);
  const playing = await waitFor(() => { const b = [...H.document.querySelectorAll('#view-sudoku button')].find(x => (x.textContent || '').includes('準備好了') || (x.textContent || '').includes('已準備（點擊取消）')); return !b ? true : null; }, 45000, 'sudoku playing');
  await sleep(6500); // 倒數 5 秒走完
  const sv = await waitFor(() => sudokuSave(H), 30000, 'host save ready');
  return !!playing && !!sv;
}
function weaponBtn(p) {
  const view = p.document.querySelector('#view-sudoku');
  if (!view) return null;
  return [...view.querySelectorAll('button')].find(b => /水球|橡皮擦|💧|🧹/.test(b.textContent || '')) || null;
}
function toastNoTarget(p) {
  const view = p.document.querySelector('#view-sudoku');
  return !!(view && view.textContent.includes('沒有可以攻擊的對手'));
}
async function main() {
  const H = loadPage('H'); const G = loadPage('G');
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' ready'); if (!ok) { console.log('NOT READY', p.label, p.errors.slice(0, 3)); process.exit(2); } }
  H.window.localStorage.setItem('plat_name', '房主甲');
  click(H, '#lob-go-create');
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲';
  click(H, '#lob-confirm');
  await waitFor(() => hubRoom(H), 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  G.window.localStorage.setItem('plat_name', '來賓乙');
  click(G, '#lob-go-join');
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙';
  G.document.querySelector('#lob-code').value = code;
  click(G, '#lob-confirm');
  await waitFor(() => hubRoom(G), 60000, 'G room');
  await waitFor(() => H.window.__PLAT_NET.roster.length >= 2, 30000, 'roster2');
  const hostUid = H.window.__PLAT_NET.myUid, guestUid = G.window.__PLAT_NET.myUid;
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  await waitFor(() => H.document.querySelector('#lob-tourn-setup'), 30000, 'tourn setup');
  const set = (id, v) => { const el = H.document.querySelector(id); if (el) { el.value = v; el.dispatchEvent(new H.window.Event('change', { bubbles: true })); } };
  set('#t-rounds', '5'); set('#t-order', 'alt-s'); set('#ts-size', '9'); set('#ts-diff', 'easy'); set('#ts-wtime', '0'); // alt-s 5 局 = [數獨, 數橋, 地雷, 數獨, 數橋]（v1.14.0 三款輪替）
  click(H, '#t-start');

  // ===== Round 1 數獨：來賓先贏 =====
  const r1 = await waitFor(() => (H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.inMatch === 'sudoku') ? true : null, 90000, 'R1 sudoku');
  check('R1 進數獨', !!r1);
  check('R1 開賽', await startSudokuRound(H, G));
  console.log('R1 solution found:', !!getSolution(), 'blanks:', sudokuSave(G) ? sudokuSave(G).d.filter(c => !c.isGiven).length : -1);
  await fillCells(G, 12, 'R1 G partial');
  await sleep(2500);
  let wb1 = weaponBtn(G), holder1 = wb1 ? G : null;
  if (!wb1) { wb1 = weaponBtn(H); holder1 = wb1 ? H : null; }
  console.log('R1 weapon btn:', !!wb1, holder1 && holder1.label, wb1 && wb1.textContent.trim().slice(0, 24));
  if (wb1) { clickEl(holder1, wb1); await sleep(1200); check('R1 武器可用（不跳沒對手）', !toastNoTarget(holder1)); }
  await fillCells(G, null, 'R1 G solve');
  await sleep(1500);
  await fillCells(H, null, 'R1 H solve');
  const st1 = await waitFor(() => { const t = H.window.__PLAT_NET.tourn; return (t && t.phase === 'standings') ? t : null; }, 90000, 'R1 standings');
  check('R1 結算 standings', !!st1);
  if (st1) { const h1 = st1.history[0]; console.log('R1 placements:', JSON.stringify(h1.placements.map(p => [p.name, p.rank, p.pts])), 'totals:', JSON.stringify(st1.totals)); check('R1 第1名=來賓（先解完）', h1.placements[0].uid === guestUid); check('R1 分數 來賓10/房主7', st1.totals[guestUid] === 10 && st1.totals[hostUid] === 7); }
  await waitFor(() => hubRoom(H), 30000, 'room after R1');
  const nb1 = await waitFor(() => { const b = H.document.querySelector('#t-next'); return (b && !b.disabled) ? b : null; }, 30000, 't-next 1');
  clickEl(H, nb1);

  // ===== Round 2 數橋：force-end（0:0 entrants 序 → 房主第1） =====
  const r2 = await waitFor(() => (H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.inMatch === 'hashi') ? true : null, 90000, 'R2 hashi');
  check('R2 進數橋', !!r2);
  await sleep(2000);
  const view2 = H.document.querySelector('#view-hashi');
  clickEl(H, [...view2.querySelectorAll('button')].find(b => (b.textContent || '').includes('退出')));
  await sleep(700);
  clickEl(H, [...H.document.querySelectorAll('button')].find(b => (b.textContent || '').includes('結束本局')));
  const st2 = await waitFor(() => { const t = H.window.__PLAT_NET.tourn; return (t && t.phase === 'standings' && t.history.length === 2) ? t : null; }, 60000, 'R2 standings');
  check('R2 結算', !!st2);
  if (st2) console.log('R2 placements:', JSON.stringify(st2.history[1].placements.map(p => [p.name, p.rank, p.pts])), 'totals:', JSON.stringify(st2.totals));
  await waitFor(() => hubRoom(H), 30000, 'room after R2');
  const nb2 = await waitFor(() => { const b = H.document.querySelector('#t-next'); return (b && !b.disabled) ? b : null; }, 30000, 't-next 2');
  clickEl(H, nb2);

  // ===== Round 3 踩地雷（三款輪替新成員）：force-end（0:0 entrants 序 → 房主第1） =====
  const r3m = await waitFor(() => (H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.inMatch === 'mines') ? true : null, 90000, 'R3 mines');
  check('R3 進踩地雷（三款輪替）', !!r3m);
  await sleep(2000);
  H.window.__PLAT_TOURN_FORCEEND();
  const st3m = await waitFor(() => { const t = H.window.__PLAT_NET.tourn; return (t && t.phase === 'standings' && t.history.length === 3) ? t : null; }, 60000, 'R3 mines standings');
  check('R3 地雷結算', !!st3m);
  if (st3m) console.log('R3 placements:', JSON.stringify(st3m.history[2].placements.map(p => [p.name, p.rank, p.pts])), 'totals:', JSON.stringify(st3m.totals));
  await waitFor(() => hubRoom(H), 30000, 'room after R3');
  const nb3 = await waitFor(() => { const b = H.document.querySelector('#t-next'); return (b && !b.disabled) ? b : null; }, 30000, 't-next 3');
  clickEl(H, nb3);

  // ===== Round 4 數獨（第二次） =====
  const r3 = await waitFor(() => (H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.inMatch === 'sudoku') ? true : null, 90000, 'R4 sudoku');
  check('R4 進數獨（第二次）', !!r3);
  check('R4 開賽', await startSudokuRound(H, G));
  const logStart = (SHARED_REG.__fullog || []).length;
  await sleep(7000);
  const t3 = H.window.__PLAT_NET.tourn;
  const staleWin = (SHARED_REG.__fullog || []).slice(logStart).filter(m => m && (m.type === 'GHOST_I_WON' || m.type === 'RACE_FINISH'));
  check('Bug1: R4 開局無舊完賽重送', staleWin.length === 0, JSON.stringify(staleWin.map(m => m.type)));
  check('Bug1: R4 開局 finishOrder 為空', !!t3 && t3.finishOrder.length === 0, t3 && JSON.stringify(t3.finishOrder));
  await fillCells(G, 12, 'R4 G partial');
  await sleep(2500);
  let wb3 = weaponBtn(G), holder3 = wb3 ? G : null;
  if (!wb3) { wb3 = weaponBtn(H); holder3 = wb3 ? H : null; }
  console.log('R4 weapon btn:', !!wb3, holder3 && holder3.label);
  if (wb3) { clickEl(holder3, wb3); await sleep(1500); check('Bug2: R4 武器可攻擊（不跳沒對手）', !toastNoTarget(holder3)); }
  else console.log('（R4 無人持有武器，Bug2 以程式證據為準）');
  await fillCells(H, null, 'R4 H solve');
  await sleep(1500);
  await fillCells(G, null, 'R4 G solve');
  const st4 = await waitFor(() => { const t = H.window.__PLAT_NET.tourn; return (t && t.phase === 'standings' && t.history.length === 4) ? t : null; }, 90000, 'R4 standings');
  check('R4 結算', !!st4);
  if (st4) { console.log('R4 placements:', JSON.stringify(st4.history[3].placements.map(p => [p.name, p.rank, p.pts])), 'totals:', JSON.stringify(st4.totals)); check('Bug1: R4 第1名=房主（真的先解完）', st4.history[3].placements[0].uid === hostUid); }
  await waitFor(() => hubRoom(H), 30000, 'room after R4');
  const nb4 = await waitFor(() => { const b = H.document.querySelector('#t-next'); return (b && !b.disabled) ? b : null; }, 30000, 't-next 4');
  clickEl(H, nb4);

  // ===== Round 5 數橋：force-end（0:0 entrants 序 → 房主第1） =====
  const r5 = await waitFor(() => (H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.inMatch === 'hashi') ? true : null, 90000, 'R5 hashi');
  check('R5 進數橋', !!r5);
  await sleep(2000);
  const view5 = H.document.querySelector('#view-hashi');
  clickEl(H, [...view5.querySelectorAll('button')].find(b => (b.textContent || '').includes('退出')));
  await sleep(700);
  clickEl(H, [...H.document.querySelectorAll('button')].find(b => (b.textContent || '').includes('結束本局')));
  const endT = await waitFor(() => { const t = H.window.__PLAT_NET.tourn; return (t && t.phase === 'ended') ? t : null; }, 90000, 'tourn ended');
  check('錦標賽結束', !!endT);
  if (endT) {
    console.log('R5 placements:', JSON.stringify(endT.history[4].placements.map(p => [p.name, p.rank, p.pts])), 'totals:', JSON.stringify(endT.totals), 'champion:', endT.champion && endT.champion.name);
    check('Bug1: 總分 房主47/來賓38', endT.totals[hostUid] === 47 && endT.totals[guestUid] === 38, JSON.stringify(endT.totals));
    check('Bug1: 總冠軍=房主', !!endT.champion && endT.champion.uid === hostUid, endT.champion && endT.champion.name);
  }
  await sleep(1500);
  const pod = H.document.querySelector('#plat-podium');
  console.log('podium:', pod ? pod.textContent.replace(/\s+/g, ' ').slice(0, 100) : 'none');
  console.log('H errors:', H.errors.length, H.errors.slice(0, 3));
  console.log('G errors:', G.errors.length, G.errors.slice(0, 3));
  console.log('RESULT: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('FATAL', e); process.exit(2); });
