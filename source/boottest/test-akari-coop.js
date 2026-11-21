// 美術燈合作模式（v1.74.0 項5）：共用盤面 ACT/DO 同步、owners 夥伴色呈現、草稿不外同步、
// undo 只撤自己的（夥伴改過的跳過）、共同完賽、合作無道具（里程碑/額度不動）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, 60000); const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(200); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errs.push(stamp(String(m))));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } resume() { return Promise.resolve(); } }; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
function setSel(w, el, val) { el.value = String(val); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const dbg = (p) => p.window.__PLAT_HOOKS_akari.debug();
const cellEl = (p, i) => p.document.querySelector('#akari-root button[data-cell="' + i + '"]');

(async () => {
  const H = loadPage('H');
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 60000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET && H.window.__PLAT_NET.code; }, 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G');
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 60000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 60000, 'G in room');
  for (const p of [H, G]) { p.window.PLAT_show('akari'); await waitFor(() => !!p.window.__PLAT_HOOKS_akari, 60000, 'preboot'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="akari"]'));
  await waitFor(() => G.window.__PLAT_NET.armed.game === 'akari', 30000, 'armed');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="coop"][data-hub-game="akari"]'));
  await sleep(400);
  setSel(H.window, H.document.querySelector('#lob-step-room [data-hub-key="sizeId"][data-hub-game="akari"]'), 7);
  await sleep(400);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(500);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 60000, 'start');
  clickEl(H, en);
  const playing = await waitFor(() => dbg(H).mp.phase === 'playing' && dbg(G).mp.phase === 'playing' ? 1 : null, 60000, 'playing');
  check('合作開局：兩頁 playing', !!playing);
  check('兩頁 mode=coop', dbg(H).mp.mode === 'coop' && dbg(G).mp.mode === 'coop', dbg(H).mp.mode + '/' + dbg(G).mp.mode);
  check('同題（解答集合一致）', JSON.stringify(dbg(H).puzzle.solution) === JSON.stringify(dbg(G).puzzle.solution));
  const hostUid = dbg(G).players.find(p => p.isHost).id, guestUid = dbg(H).players.find(p => !p.isHost).id;
  const sol = dbg(G).puzzle.solution;
  // 來賓放燈 → 房主盤面同步＋owner=來賓
  cellEl(G, sol[0]).click();
  const sync1 = await waitFor(() => dbg(H).cells[sol[0]] === 1 ? 1 : null, 15000, 'host sees guest bulb');
  check('來賓放燈 → 房主共用盤面同步', !!sync1);
  check('owner 標記=來賓（兩頁一致）', dbg(H).owners[sol[0]] === guestUid && dbg(G).owners[sol[0]] === guestUid, dbg(H).owners[sol[0]]);
  const dotH = await waitFor(() => cellEl(H, sol[0]).querySelector('[data-partner-dot]') ? 1 : null, 10000, 'partner dot on host');
  check('房主端：夥伴燈有顏色圓點標記', !!dotH);
  check('來賓端：自己的燈無夥伴圓點', !cellEl(G, sol[0]).querySelector('[data-partner-dot]'));
  // 房主放燈 → 來賓同步
  cellEl(H, sol[1]).click();
  const sync2 = await waitFor(() => dbg(G).cells[sol[1]] === 1 && dbg(G).owners[sol[1]] === hostUid ? 1 : null, 15000, 'guest sees host bulb');
  check('房主放燈 → 來賓同步＋owner=房主', !!sync2);
  const dotG = await waitFor(() => cellEl(G, sol[1]).querySelector('[data-partner-dot]') ? 1 : null, 10000, 'partner dot on guest');
  check('來賓端：夥伴燈有顏色圓點標記', !!dotG);
  // 房主畫叉同步
  const freeCell = (() => { const d = dbg(H); const ws = new Set(d.puzzle.walls); const ss = new Set(d.puzzle.solution); for (let i = 0; i < d.cells.length; i++) if (!ws.has(i) && !ss.has(i) && d.cells[i] === 0) return i; return -1; })();
  const pbH = H.document.querySelector('#view-akari [data-pb="mode-press"]'); pbH.click(); await sleep(200);
  H.document.querySelector('#view-akari [data-pb="mode-press"]').click(); await sleep(250); // tap→draft→cross
  cellEl(H, freeCell).click();
  const sync3 = await waitFor(() => dbg(G).cells[freeCell] === 2 ? 1 : null, 15000, 'guest sees cross');
  check('房主畫叉 → 來賓同步', !!sync3);
  H.document.querySelector('#view-akari [data-pb="mode-press"]').click(); await sleep(250); // cross→tap
  // 草稿不外同步：來賓切草稿、放草稿 → 房主盤面不變、來賓 cells 不含草稿
  const draftCell = (() => { const d = dbg(G); const ws = new Set(d.puzzle.walls); for (let i = 0; i < d.cells.length; i++) if (!ws.has(i) && d.cells[i] === 0 && i !== freeCell) return i; return -1; })();
  G.document.querySelector('#view-akari [data-pb="mode-press"]').click(); await sleep(250); // tap→draft
  cellEl(G, draftCell).click(); await sleep(400);
  check('來賓草稿：本地草稿層有、cells 不含', dbg(G).coopDrafts.includes(draftCell) && dbg(G).cells[draftCell] === 0);
  check('來賓草稿：房主盤面完全不受影響', dbg(H).cells[draftCell] === 0 && !dbg(H).coopDrafts.includes(draftCell));
  check('來賓草稿：本地有虛線標記', !!cellEl(G, draftCell).querySelector('[data-draft="1"]'));
  G.document.querySelector('#view-akari [data-pb="mode-press"]').click(); await sleep(200);
  G.document.querySelector('#view-akari [data-pb="mode-press"]').click(); await sleep(250); // draft→cross→tap
  // undo 只撤自己的：最近一步是草稿（先撤草稿）、再一步才是放燈
  clickEl(G, G.document.querySelector('[data-akari-undo]'));
  const unD = await waitFor(() => !dbg(G).coopDrafts.includes(draftCell) ? 1 : null, 10000, 'undo draft');
  check('來賓 undo 第一步：先撤自己的草稿', !!unD);
  clickEl(G, G.document.querySelector('[data-akari-undo]'));
  const un = await waitFor(() => dbg(G).cells[sol[0]] === 0 && dbg(H).cells[sol[0]] === 0 ? 1 : null, 15000, 'undo sync');
  check('來賓 undo：自己的燈撤掉（兩頁同步）', !!un);
  check('來賓 undo：房主的燈與叉不動', dbg(G).cells[sol[1]] === 1 && dbg(G).cells[freeCell] === 2);
  clickEl(G, G.document.querySelector('[data-akari-redo]'));
  const re = await waitFor(() => dbg(H).cells[sol[0]] === 1 ? 1 : null, 15000, 'redo sync');
  check('來賓 redo：燈回來（兩頁同步）', !!re);
  // 夥伴改過的動作 undo 跳過：房主把來賓的燈點成叉（cycle 1→2），來賓 undo 其放燈動作 → 不得復原
  cellEl(H, sol[0]).click();
  const ow = await waitFor(() => dbg(G).cells[sol[0]] === 2 && dbg(G).owners[sol[0]] === hostUid ? 1 : null, 15000, 'host overwrote');
  check('房主把來賓的燈改成叉（owner 轉房主）', !!ow);
  clickEl(G, G.document.querySelector('[data-akari-undo]'));
  await sleep(1200);
  check('來賓 undo：被夥伴改過的動作跳過（叉維持）', dbg(G).cells[sol[0]] === 2 && dbg(H).cells[sol[0]] === 2);
  cellEl(H, sol[0]).click(); await sleep(300); // 房主再點：叉→空
  cellEl(H, sol[0]).click(); // 空→燈（補回正解）
  await waitFor(() => dbg(G).cells[sol[0]] === 1, 15000, 'bulb restored');
  // 合作無道具：里程碑/禮物額度維持 0（放了正確燈也不發）
  check('合作無道具：來賓 milestone=0、額度=0', dbg(G).milestone === 0 && dbg(G).giftCredit === 0, 'ms=' + dbg(G).milestone + ' credit=' + dbg(G).giftCredit);
  // 共同完賽：輪流放滿剩下解答
  const rest = sol.slice(2);
  for (let k = 0; k < rest.length; k++) { const p = k % 2 === 0 ? H : G; if (dbg(p).cells[rest[k]] === 0) { cellEl(p, rest[k]).click(); await sleep(120); } }
  const wonH = await waitFor(() => dbg(H).coopWonMs > 0 ? 1 : null, 20000, 'host coop won');
  const wonG = await waitFor(() => dbg(G).coopWonMs > 0 ? 1 : null, 20000, 'guest coop won');
  check('共同完賽：房主端成立', !!wonH);
  check('共同完賽：來賓端成立', !!wonG);
  check('共同完賽橫幅（兩頁）', !!H.document.querySelector('[data-coop-won]') && !!G.document.querySelector('[data-coop-won]'));
  check('H 頁零錯誤', H.errors.length === 0, H.errors[0] || '');
  check('G 頁零錯誤', G.errors.length === 0, G.errors[0] || '');
  console.log('==== AKARI-COOP: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
