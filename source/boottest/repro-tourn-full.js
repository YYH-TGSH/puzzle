// 複現（使用者 2026-10-23 實機）：錦標賽結束（最後一局數橋）後
// (1) 房主再開數橋大亂鬥 → 進去看到舊的大亂鬥結果畫面
// (2) 房間頁合作模式的遊戲設定沒出現
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
html = html.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
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
const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
function slotInfo(p, label) {
  const slot = p.document.querySelector('#lob-step-room [data-pr-slot="settings"]');
  console.log(label + ': slotLen=' + (slot ? slot.innerHTML.length : -1) + ' display=' + (slot ? JSON.stringify(slot.style.display) : '?') + ' text=' + (slot ? slot.textContent.replace(/\s+/g, ' ').slice(0, 60) : ''));
  return slot;
}
function resultsVisible(p) {
  const el = p.document.querySelector('#plat-results');
  return !!(el && el.style.display !== 'none' && el.innerHTML.length > 50);
}
async function joinRoomFlow(H, G) {
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
  return code;
}
async function forceEndRound(H, game, label) {
  // 在對局遊戲畫面裡開標頭退出選單 → ⏹️ 結束本局（錦標賽房主）
  const view = H.document.querySelector('#view-' + game);
  const exitBtn = [...view.querySelectorAll('button')].find(b => (b.textContent || '').includes('退出'));
  clickEl(H, exitBtn);
  await sleep(700);
  const endBtn = [...H.document.querySelectorAll('button')].find(b => (b.textContent || '').includes('結束本局'));
  console.log(label + ': 結束本局 btn found=' + !!endBtn);
  clickEl(H, endBtn);
  await sleep(1500);
}
async function main() {
  const H = loadPage('H'); const G = loadPage('G');
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' ready'); if (!ok) { console.log('NOT READY', p.label, p.errors.slice(0, 3)); process.exit(2); } }
  await joinRoomFlow(H, G);
  console.log('room ready');
  // 錦標賽：3 局、數橋先（v1.14.0 三款輪替 alt-h → 數橋,地雷,數獨）
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  await waitFor(() => H.document.querySelector('#lob-tourn-setup'), 30000, 'tourn setup');
  const roundsSel = H.document.querySelector('#t-rounds'); if (roundsSel) roundsSel.value = '3';
  const orderSel = H.document.querySelector('#t-order'); if (orderSel) orderSel.value = 'alt-h';
  console.log('t-rounds=', roundsSel && roundsSel.value, 't-order=', orderSel && orderSel.value);
  // v1.48.0：開賽改走房間卡準備閘門——兩邊按「準備好了」，房主按名單卡上的開賽鈕
  await waitFor(() => (H.document.querySelector('#lob-step-room [data-pr="ready"]') && G.document.querySelector('#lob-step-room [data-pr="ready"]')) ? true : null, 30000, 'both ready btns');
  for (const p of [H, G]) clickEl(p, p.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const tCardStart = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return (b && !b.disabled && b.textContent.includes('開賽')) ? b : null; }, 30000, 'tourn card start');
  clickEl(H, tCardStart);
  const seq = ['hashi', 'mines', 'sudoku'];
  for (let r = 0; r < 3; r++) {
    const g = seq[r];
    const inRound = await waitFor(() => (H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.inMatch === g) ? true : null, 90000, 'round ' + (r + 1) + ' ' + g);
    console.log('round', r + 1, g, 'entered:', !!inRound, 'phase:', H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.tourn.phase);
    if (!inRound) break;
    await sleep(2500);
    if (g === 'mines') { H.window.__PLAT_TOURN_FORCEEND(); await sleep(1500); } // 地雷無退出選單，直接走殼的結束本局 hook
    else await forceEndRound(H, g, 'round ' + (r + 1));
    if (r < 2) {
      // 回到房間頁 standings → 下一局
      const back = await waitFor(() => hubRoom(H), 60000, 'back room after round ' + (r + 1));
      console.log('back to room:', !!back, 'tourn phase:', H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.tourn.phase);
      const nextBtn = await waitFor(() => { const b = H.document.querySelector('#t-next'); return (b && !b.disabled) ? b : null; }, 30000, 't-next');
      console.log('next btn:', !!nextBtn);
      clickEl(H, nextBtn);
    }
  }
  // 錦標賽結束 → 回房間頁
  const endRoom = await waitFor(() => { const t = H.window.__PLAT_NET.tourn; return (hubRoom(H) && (!t || t.phase === 'ended')) ? true : null; }, 90000, 'tourn ended + room');
  console.log('tournament ended, at room:', !!endRoom, 'phase:', H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.tourn.phase);
  await sleep(2000);
  // === BUG 2 檢查：切數橋分頁 → 合作設定 ===
  clickEl(H, H.document.querySelector('[data-rtab="hashi"]'));
  await sleep(1500);
  const s1 = slotInfo(H, 'BUG2 hashi tab after tourn');
  console.log('BUG2 hashi/coop settings present:', !!(s1 && s1.innerHTML.length > 200 && s1.style.display !== 'none'));
  // === BUG 1 檢查：房主開數橋大亂鬥 → 進去不該看到舊結算 ===
  const raceBtn = [...H.document.querySelectorAll('[data-hub-mode]')].find(b => b.getAttribute('data-hub-mode') === 'race');
  console.log('race mode btn:', !!raceBtn);
  clickEl(H, raceBtn);
  await sleep(800);
  const HN = H.window.__PLAT_NET;
  console.log('DIAG roster:', HN.roster.length, 'enteredAt age(ms):', HN.hub && HN.hub.enteredAt ? Date.now() - HN.hub.enteredAt : -1, 'ready:', JSON.stringify(HN.hub && HN.hub.ready), 'cfg hashi mode:', HN.hub && HN.hub.cfg.hashi.mode);
  const sb0 = H.document.querySelector('#lob-step-room [data-pr="start"]');
  console.log('DIAG start btn:', !!sb0, sb0 && sb0.disabled, sb0 && sb0.textContent, '| note:', (() => { const n = H.document.querySelector('#lob-step-room [data-pr-region="controls"]'); return n ? n.textContent.replace(/\s+/g, ' ').slice(0, 120) : ''; })());
  // 真實操作：兩邊都在房間頁按「準備好了」
  for (const p of [H, G]) { const rb = p.document.querySelector('#lob-step-room [data-pr="ready"]'); console.log(p.label + ' ready btn:', !!rb); clickEl(p, rb); }
  await sleep(1500);
  console.log('DIAG2 ready:', JSON.stringify(HN.hub && HN.hub.ready));
  const sb1 = H.document.querySelector('#lob-step-room [data-pr="start"]');
  console.log('DIAG2 start btn:', !!sb1, sb1 && sb1.disabled, sb1 && sb1.textContent);
  const startBtn = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return (b && !b.disabled) ? b : null; }, 30000, 'start btn');
  console.log('start btn:', !!startBtn, startBtn && startBtn.textContent);
  clickEl(H, startBtn);
  const inMatch = await waitFor(() => H.window.__PLAT_NET.inMatch === 'hashi' ? true : null, 90000, 'in hashi brawl');
  console.log('in hashi brawl:', !!inMatch);
  await sleep(4000);
  const rv = resultsVisible(H);
  const resEl = H.document.querySelector('#plat-results');
  console.log('BUG1 PlatResults visible at new match start:', rv, '| text:', resEl ? resEl.textContent.replace(/\s+/g, ' ').slice(0, 80) : '');
  console.log('H errors:', H.errors.length, H.errors.slice(0, 4));
  console.log('G errors:', G.errors.length, G.errors.slice(0, 4));
  process.exit(0);
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
