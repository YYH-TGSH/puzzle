// 複現：開過一局（PlatRoom 被遊戲接管）回房間頁後，合作設定是否還在
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
  const anySlot = p.document.querySelector('[data-pr-slot="settings"]');
  console.log(label + ': roomSlot len=' + (slot ? slot.innerHTML.length : -1) + ' display=' + (slot ? slot.style.display : '?') + ' | anySlotInDoc=' + (anySlot ? (anySlot.closest('[id^="view-"]') || {}).id : 'none'));
}
async function enterRoom(p, name) {
  p.window.localStorage.setItem('plat_name', name);
}
async function main() {
  const H = loadPage('H'); const G = loadPage('G');
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' ready'); if (!ok) { console.log('NOT READY', p.label, p.errors.slice(0, 3)); process.exit(2); } }
  // H 建房
  await enterRoom(H, '房主甲');
  click(H, '#lob-go-create');
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲';
  click(H, '#lob-confirm');
  await waitFor(() => hubRoom(H), 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  console.log('room code:', code);
  // G 入房
  await enterRoom(G, '來賓乙');
  click(G, '#lob-go-join');
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙';
  G.document.querySelector('#lob-code').value = code;
  click(G, '#lob-confirm');
  await waitFor(() => hubRoom(G), 60000, 'G room');
  await waitFor(() => H.window.__PLAT_NET.roster.length >= 2, 30000, 'H roster 2');
  slotInfo(H, 'fresh room H');
  // 切數橋分頁（預設合作）→ 房主按開始
  clickEl(H, H.document.querySelector('[data-rtab="hashi"]'));
  await sleep(1000);
  slotInfo(H, 'hashi tab H');
  const startBtn = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return (b && !b.disabled) ? b : null; }, 30000, 'H start btn');
  console.log('start btn:', !!startBtn, startBtn ? startBtn.textContent : '');
  clickEl(H, startBtn);
  // 等兩邊進數橋對局（名單從等待卡消失或遊戲畫面出現）
  const inGame = await waitFor(() => { const v = H.document.querySelector('#view-hashi'); return (v && v.style.display !== 'none' && H.window.__PLAT_NET.inMatch === 'hashi') ? true : null; }, 90000, 'H in hashi match');
  console.log('in hashi match:', !!inGame);
  await sleep(3000);
  // 房主：標頭退出選單 → 回等待室
  const hashiView = H.document.querySelector('#view-hashi');
  const exitBtn = [...hashiView.querySelectorAll('button')].find(b => (b.textContent || '').includes('退出'));
  console.log('hashi exit btn:', !!exitBtn);
  clickEl(H, exitBtn);
  await sleep(800);
  const menuLobby = [...H.document.querySelectorAll('div')].filter(d => (d.className || '').includes('inset-0')).flatMap(d => [...d.querySelectorAll('button')]).find(b => (b.textContent || '').includes('回等待室'));
  console.log('menu lobby btn:', !!menuLobby);
  clickEl(H, menuLobby);
  const backRoom = await waitFor(() => hubRoom(H), 60000, 'H back to room page');
  console.log('back to room page:', !!backRoom);
  await sleep(1500);
  slotInfo(H, 'AFTER MATCH H (armed tab)');
  // 各分頁/模式巡一遍
  clickEl(H, H.document.querySelector('[data-rtab="sudoku"]'));
  await sleep(1200);
  slotInfo(H, 'AFTER MATCH H sudoku/coop');
  clickEl(H, H.document.querySelector('[data-rtab="hashi"]'));
  await sleep(1200);
  slotInfo(H, 'AFTER MATCH H hashi/coop');
  const raceBtn = [...H.document.querySelectorAll('[data-hub-mode]')].find(b => b.getAttribute('data-hub-mode') === 'race');
  if (raceBtn) { clickEl(H, raceBtn); await sleep(1200); slotInfo(H, 'AFTER MATCH H hashi/race'); }
  const coopBtn = [...H.document.querySelectorAll('[data-hub-mode]')].find(b => b.getAttribute('data-hub-mode') === 'coop');
  if (coopBtn) { clickEl(H, coopBtn); await sleep(1200); slotInfo(H, 'AFTER MATCH H hashi/coop again'); }
  slotInfo(G, 'AFTER MATCH G (current tab)');
  console.log('G room visible:', !!hubRoom(G));
  console.log('H errors:', H.errors.length, H.errors.slice(0, 4));
  console.log('G errors:', G.errors.length, G.errors.slice(0, 4));
  process.exit(0);
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
