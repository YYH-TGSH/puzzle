// 美術燈多人競速：雙頁同題（種子同步）、進度廣播、完賽轉觀戰＋PlatResults 名次、晚加入自動觀戰
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(250); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } resume() { return Promise.resolve(); } }; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
function setSel(w, el, val) { el.value = String(val); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const dbg = (p) => p.window.__PLAT_HOOKS_akari.debug();
const cellEl = (p, i) => p.document.querySelector('#akari-root button[data-cell="' + i + '"]');
async function solveSome(p, frac) {
  const d = dbg(p); const sol = d.puzzle.solution;
  const n = Math.max(1, Math.floor(sol.length * frac));
  for (let k = 0; k < n; k++) { if (dbg(p).cells[sol[k]] !== 1) { cellEl(p, sol[k]).click(); await sleep(40); } }
}
(async () => {
  const H = loadPage('H');
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 300000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET && H.window.__PLAT_NET.code; }, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G');
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 300000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 90000, 'G in room');
  for (const p of [H, G]) { p.window.PLAT_show('akari'); await waitFor(() => !!p.window.__PLAT_HOOKS_akari, 300000, 'preboot akari'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="akari"]'));
  await waitFor(() => G.window.__PLAT_NET && G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === 'akari', 30000, 'guest armed akari');
  // 房間表單：7×7 小盤＋道具延遲 0（測試用）
  const szSel = H.document.querySelector('#lob-step-room [data-hub-key="sizeId"][data-hub-game="akari"]');
  check('房間頁有美術燈分頁＋盤面設定', !!szSel);
  if (szSel) setSel(H.window, szSel, 7);
  const dlSel = H.document.querySelector('#lob-step-room [data-hub-key="itemStartTime"][data-hub-game="akari"]');
  if (dlSel) setSel(H.window, dlSel, 0);
  const itChk = H.document.querySelector('#lob-step-room [data-hub-key="allowItems"][data-hub-game="akari"]');
  if (itChk && itChk.checked) itChk.click(); // 本套件驗純競速語意：關道具（禮物會幫對手補完盤面、污染名次時序）；道具另有專套
  await sleep(500);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  await sleep(600);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 90000, 'start enabled');
  check('雙人準備後房主可開始', !!en);
  clickEl(H, en);
  // 雙邊進場、倒數後開打
  const playing = await waitFor(() => { const a = dbg(H), b = dbg(G); return a.mp.phase === 'playing' && b.mp.phase === 'playing' ? 1 : null; }, 90000, 'both playing');
  check('雙邊進入競速 playing', !!playing);
  const dH = dbg(H), dG = dbg(G);
  check('雙頁同題（種子同步）', JSON.stringify(dH.puzzle.walls) === JSON.stringify(dG.puzzle.walls) && JSON.stringify(dH.puzzle.solution) === JSON.stringify(dG.puzzle.solution) && dH.puzzle.w === 7, 'H seed ' + dH.mp.seed + ' G seed ' + dG.mp.seed);
  check('雙邊名單 2 人', dH.players.length === 2 && dG.players.length === 2);
  const hostUid = dG.players.find(p => p.isHost).id, guestUid = dH.players.find(p => !p.isHost).id;
  // 進度廣播：房主放一半解答燈 → 來賓端 god 進度 >0
  await solveSome(H, 0.5);
  const gSeen = await waitFor(() => { const g = dbg(G).god[hostUid]; return g && g.progress > 0.3 ? g : null; }, 30000, 'guest sees host progress');
  check('進度廣播（來賓看到房主進度）', !!gSeen, JSON.stringify(dbg(G).god[hostUid] || null));
  // 晚加入觀戰：第三人中途加入房間
  const L = loadPage('L');
  await waitFor(() => typeof L.window.PLAT_show === 'function' && L.window.PlatDock, 300000, 'L shell');
  clickEl(L, L.document.querySelector('#lob-go-join'));
  await waitFor(() => L.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'L nick');
  setInput(L.window, L.document.querySelector('#lob-name'), '阿晚');
  setInput(L.window, L.document.querySelector('#lob-code'), code);
  clickEl(L, L.document.querySelector('#lob-confirm'));
  const specIn = await waitFor(() => { const d = dbg(L); const me = d.players.find(p => p.name === '阿晚'); return me && me.spectator ? 1 : null; }, 90000, 'L spectator');
  check('晚加入自動觀戰（spectator）', !!specIn);
  const lCellsBefore = dbg(L).cells.slice();
  const anyCellBtn = L.document.querySelector('#akari-root button[data-cell]');
  if (anyCellBtn) { anyCellBtn.click(); await sleep(300); }
  check('觀戰者不能下場放燈', JSON.stringify(dbg(L).cells) === JSON.stringify(lCellsBefore));
  // 來賓完賽 → 自動觀戰＋等待卡；房主完賽 → 結算名次（來賓先完賽＝第 1）
  await solveSome(G, 1);
  const gFin = await waitFor(() => dbg(G).myOutcome === 'finished' ? 1 : null, 30000, 'guest finished');
  check('來賓完賽', !!gFin);
  const hSeesFin = await waitFor(() => { const g = dbg(H).god[guestUid]; return g && g.state === 'finished' ? 1 : null; }, 30000, 'host sees guest finished');
  check('房主端收到來賓完賽', !!hSeesFin);
  check('結算未被未完賽者擋住前不出現 final（房主未完賽）', dbg(H).final === null && dbg(G).final === null);
  await solveSome(H, 1);
  const finBoth = await waitFor(() => dbg(H).final && dbg(G).final ? 1 : null, 30000, 'final both');
  check('雙邊結算出現', !!finBoth);
  if (finBoth) {
    const f = dbg(H).final;
    check('名次：第 1 名是先完賽的來賓', f.entries[0] && f.entries[0].key === guestUid && f.winnerUid === guestUid, JSON.stringify(f.entries));
    check('結算條目含完賽時間', /⏱/.test(f.entries[0].right), f.entries[0].right);
  }
  check('零錯誤', H.errors.length === 0 && G.errors.length === 0 && L.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || '') + '|' + (L.errors[0] || ''));
  console.log('==== AKARI-MP: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
