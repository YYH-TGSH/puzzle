// 數橋 undo/redo（v1.75.0）：單機快照 redo、競速多人 undo/redo＋進度同步、防農場實測
// （里程碑 milestonesRef 記憶集合＋禮物額度 hashiGiftUnitsRef 高水位：undo 後重放同批橋，計帳不增）、
// 合作逐橋只撤自己（夥伴改過跳過）
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
function pev(p, el, type, x, y, buttons) {
  if (!el) return;
  const ev = new p.window.MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, buttons: buttons != null ? buttons : (type === 'pointerup' ? 0 : 1) });
  Object.defineProperty(ev, 'isPrimary', { value: true });
  Object.defineProperty(ev, 'pointerType', { value: 'touch' });
  Object.defineProperty(ev, 'pointerId', { value: 7 });
  el.dispatchEvent(ev);
}
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const dbg = (p) => p.window.__PLAT_HOOKS_hashi.debug();
function boardSvg(p) {
  const view = p.document.querySelector('#view-hashi');
  const s = [...view.querySelectorAll('svg')].find(x => [...x.querySelectorAll('text')].some(t => /^[1-8]$/.test((t.textContent || '').trim())));
  if (s && !s.__mocked) { s.__mocked = true; s.createSVGPoint = () => { const pt = { x: 0, y: 0, matrixTransform: () => ({ x: pt.x, y: pt.y }) }; return pt; }; s.getScreenCTM = () => ({ inverse: () => ({}) }); }
  return s || null;
}
function readIslands(p) { // 以座標 rank 推格位（與縮放無關），對上 level.islands 的 x/y
  const board = boardSvg(p); if (!board) return [];
  const raw = [];
  board.querySelectorAll('g').forEach(g => { const t = [...g.querySelectorAll('text')].find(x => /^[1-8]$/.test((x.textContent || '').trim())); if (!t) return; raw.push({ g, cx: parseFloat(t.getAttribute('x')), cy: parseFloat(t.getAttribute('y')) - 2 }); });
  const xs = [...new Set(raw.map(r => Math.round(r.cx)))].sort((a, b) => a - b), ys = [...new Set(raw.map(r => Math.round(r.cy)))].sort((a, b) => a - b);
  raw.forEach(r => { r.gx = xs.indexOf(Math.round(r.cx)); r.gy = ys.indexOf(Math.round(r.cy)); });
  return raw;
}
function islDom(p, islId) {
  const lv = dbg(p).level; if (!lv) return null;
  const isl = (lv.islands || []).find(i => i.id === islId); if (!isl) return null;
  // 兩邊都用「有島的列/行」rank 對齊（絕對格位 vs DOM rank 直接比會在空格位錯位）
  const xs = [...new Set((lv.islands || []).map(i => i.x))].sort((a, b) => a - b), ys = [...new Set((lv.islands || []).map(i => i.y))].sort((a, b) => a - b);
  return readIslands(p).find(r => r.gx === xs.indexOf(isl.x) && r.gy === ys.indexOf(isl.y)) || null;
}
function bridgeBetween(p, aId, bId) {
  return (dbg(p).bridges || []).find(b => (b.from === aId && b.to === bId) || (b.from === bId && b.to === aId)) || null;
}
async function dragBuild(p, aId, bId) {
  const board = boardSvg(p);
  const A = islDom(p, aId), B = islDom(p, bId);
  if (!board || !A || !B) { if (!dragBuild._logged) { dragBuild._logged = true; console.log('  [dragBuild diag] board=' + !!board + ' A=' + !!A + ' B=' + !!B + ' islands=' + readIslands(p).length + ' screen=' + dbg(p).screen); } return false; }
  const aFresh = readIslands(p).find(r => r.gx === A.gx && r.gy === A.gy);
  pev(p, aFresh.g, 'pointerdown', A.cx, A.cy, 1);
  pev(p, board, 'pointermove', (A.cx + B.cx) / 2, (A.cy + B.cy) / 2, 1);
  pev(p, board, 'pointermove', B.cx, B.cy, 1);
  pev(p, board, 'pointerup', B.cx, B.cy, 0);
  await sleep(300);
  return true;
}
async function buildTo(p, aId, bId, target) { // 拖到目標 count：每次拖完等 count 真的變化才決定下一步（負載下 state 更新會遲到，盲拖會蓋成雙橋/循環歸零）
  for (let i = 0; i < 5; i++) {
    const b = bridgeBetween(p, aId, bId); if (b && b.count >= target) return true;
    const before = b ? b.count : 0;
    await dragBuild(p, aId, bId);
    await waitFor(() => { const bb = bridgeBetween(p, aId, bId); return bb && bb.count !== before ? true : null; }, 2500, 'bridge change');
  }
  const b = bridgeBetween(p, aId, bId); return !!b && b.count >= target;
}
async function tapBridge(p, aId, bId) { // 點按既有橋（cycle）：在橋中點對命中線 pointerdown/up
  const board = boardSvg(p); const A = islDom(p, aId), B = islDom(p, bId); if (!board || !A || !B) return false;
  const mx = (A.cx + B.cx) / 2, my = (A.cy + B.cy) / 2;
  const lines = [...board.querySelectorAll('line')];
  const hit = lines.find(L => { const x1 = parseFloat(L.getAttribute('x1')), y1 = parseFloat(L.getAttribute('y1')), x2 = parseFloat(L.getAttribute('x2')), y2 = parseFloat(L.getAttribute('y2')); return Math.abs((x1 + x2) / 2 - mx) < 3 && Math.abs((y1 + y2) / 2 - my) < 3 && Math.hypot(x2 - x1, y2 - y1) > 5; });
  if (!hit) return false;
  pev(p, hit, 'pointerdown', mx, my, 1);
  pev(p, board, 'pointerup', mx, my, 0);
  await sleep(300);
  return true;
}
async function makeRoom() {
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
  for (const p of [H, G]) { p.window.PLAT_show('hashi'); await waitFor(() => !!p.window.__PLAT_HOOKS_hashi, 60000, 'preboot'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="hashi"]'));
  await waitFor(() => G.window.__PLAT_NET.armed.game === 'hashi', 30000, 'armed');
  return { H, G };
}
async function startHub(H, G, mode) {
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="' + mode + '"][data-hub-game="hashi"]'));
  await sleep(500);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(500);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 60000, 'start');
  clickEl(H, en);
}

(async () => {
  // ===== S1 單機 =====
  const A = loadPage('A');
  await waitFor(() => typeof A.window.PLAT_show === 'function' && A.window.PlatDock, 60000, 'A shell');
  A.window.PLAT_show('hashi');
  await waitFor(() => !!A.window.__PLAT_HOOKS_hashi, 60000, 'A hooks');
  const soloBtn = await waitFor(() => [...A.document.querySelectorAll('#view-hashi button')].find(b => (b.textContent || '').includes('單機挑戰')) || null, 60000, 'solo btn');
  clickEl(A, soloBtn); await sleep(700);
  const lvBtn = await waitFor(() => A.document.querySelector('#plat-setup [data-pse-opt="2"]'), 30000, 'setup 10x10');
  clickEl(A, lvBtn); // 數橋 PlatSetup 是 list+instant 型：點 opt 即開局（原始碼 openHashiSetup 實證）
  const boardOk = await waitFor(() => dbg(A).screen === 'game' && boardSvg(A) ? 1 : null, 60000, 'solo board');
  check('單機開局（10x10）', !!boardOk);
  const solA = dbg(A).level.solution;
  const s0 = solA[0], s1 = solA[1];
  check('單機拖曳架橋', await buildTo(A, s0.from, s0.to, 1));
  clickEl(A, A.document.querySelector('[data-hashi-undo]'));
  const unA = await waitFor(() => bridgeBetween(A, s0.from, s0.to).count === 0 ? 1 : null, 8000, 'solo undo');
  check('單機 undo：橋撤掉', !!unA);
  check('單機 undo 後 hist=0/future=1', dbg(A).hist === 0 && dbg(A).future === 1, 'hist=' + dbg(A).hist + ' future=' + dbg(A).future);
  clickEl(A, A.document.querySelector('[data-hashi-redo]'));
  const reA = await waitFor(() => bridgeBetween(A, s0.from, s0.to).count === 1 ? 1 : null, 8000, 'solo redo');
  check('單機 redo：橋回來', !!reA);
  await buildTo(A, s1.from, s1.to, 1);
  check('新動作清 redo（future=0）', dbg(A).future === 0);
  check('A 頁零錯誤', A.errors.length === 0, A.errors[0] || '');

  // ===== S2 競速＋防農場 =====
  const R = await makeRoom();
  await startHub(R.H, R.G, 'race');
  const racing = await waitFor(() => dbg(R.G).raceState === 'racing' && dbg(R.H).raceState === 'racing' ? 1 : null, 60000, 'racing');
  check('競速開局 racing', !!racing);
  const gUid = R.G.window.localStorage.getItem('plat_uid_hashi');
  const solR = dbg(R.G).level.solution;
  // 依解答逐橋蓋：直到里程碑 ≥1 且禮物額度 ≥1（完成 ≥2 座島的嚴格判定）
  const seq = []; // {from,to} 拖曳序列（重放用）
  // 逐島完成策略：先挑解答橋最少的島、把它的橋全蓋完（嚴格完成），依序推進到里程碑 ≥1 且額度 ≥1
  const islDeg = {};
  solR.forEach(sb => { islDeg[sb.from] = (islDeg[sb.from] || 0) + sb.count; islDeg[sb.to] = (islDeg[sb.to] || 0) + sb.count; });
  const islOrder = Object.keys(islDeg).sort((a, b) => islDeg[a] - islDeg[b]).map(Number);
  let drags = 0;
  outer: for (const islId of islOrder) {
    const mine = solR.filter(sb => sb.from === islId || sb.to === islId);
    for (const sb of mine) {
      while ((bridgeBetween(R.G, sb.from, sb.to) || {}).count < sb.count && drags < 24) {
        await dragBuild(R.G, sb.from, sb.to); seq.push({ from: sb.from, to: sb.to }); drags++;
        if (Object.keys(dbg(R.G).milestones).length >= 1 && dbg(R.G).giftUnits >= 1) break outer;
      }
      if (Object.keys(dbg(R.G).milestones).length >= 1 && dbg(R.G).giftUnits >= 1) break outer;
    }
  }
  await sleep(600);
  const M1 = Object.keys(dbg(R.G).milestones).length, C1 = dbg(R.G).giftUnits;
  check('競速：蓋解答橋跨里程碑 ≥1', M1 >= 1, 'M=' + M1 + ' seq=' + seq.length);
  check('競速：嚴格完成島嶼累積禮物單位 ≥1（額度會即時送弱者花掉，計帳看高水位 giftUnits）', C1 >= 1, 'units=' + C1);
  const peakBridges = (dbg(R.G).bridges || []).filter(b => b.count > 0).map(b => ({ from: b.from, to: b.to, count: b.count }));
  const progPeak = ((dbg(R.H).raceProgress || {})[gUid] || {}).progress || 0;
  check('房主端看到來賓進度 >0', progPeak > 0, 'prog=' + progPeak);
  let ug = 0;
  while (dbg(R.G).hist > 0 && ug++ < 30) { clickEl(R.G, R.G.document.querySelector('[data-hashi-undo]')); await sleep(250); }
  const zeroed = await waitFor(() => (((dbg(R.H).raceProgress || {})[gUid] || {}).progress || 0) === 0 ? 1 : null, 20000, 'progress zeroed');
  check('競速 undo 全部：房主端來賓進度歸零（進度隨還原同步）', !!zeroed);
  check('undo 後計帳不退（里程碑/禮物單位維持高水位）', Object.keys(dbg(R.G).milestones).length === M1 && dbg(R.G).giftUnits === C1);
  for (const pb of peakBridges) await buildTo(R.G, pb.from, pb.to, pb.count); // 重放＝把高峰時的橋逐座蓋回（逐座驗證，避免拖曳漏失）
  await sleep(600);
  check('防農場：重放同批橋，里程碑不增', Object.keys(dbg(R.G).milestones).length === M1, 'M=' + Object.keys(dbg(R.G).milestones).length + ' vs ' + M1);
  check('防農場：重放同批橋，禮物單位不增', dbg(R.G).giftUnits === C1, 'units=' + dbg(R.G).giftUnits + ' vs ' + C1);
  const progBack = await waitFor(() => (((dbg(R.H).raceProgress || {})[gUid] || {}).progress || 0) === progPeak ? 1 : null, 20000, 'progress restored');
  check('重放後房主端進度回到高峰', !!progBack, 'prog=' + (((dbg(R.H).raceProgress || {})[gUid] || {}).progress || 0));
  check('S2 雙邊零錯誤', R.H.errors.length === 0 && R.G.errors.length === 0, (R.H.errors[0] || '') + ' | ' + (R.G.errors[0] || ''));

  // ===== S3 合作 =====
  const C = await makeRoom();
  await startHub(C.H, C.G, 'coop');
  const coopReady = await waitFor(() => dbg(C.G).bridges && dbg(C.G).bridges.length > 0 && dbg(C.H).bridges && dbg(C.H).bridges.length > 0 ? 1 : null, 60000, 'coop boards');
  check('合作開局（雙邊盤面就緒）', !!coopReady);
  await sleep(2500); // 等 COOP_START 落地
  const solC = dbg(C.G).level.solution;
  const c0 = solC[0], c1 = solC[1];
  await buildTo(C.G, c0.from, c0.to, 1);
  const seenCoop = await waitFor(() => bridgeBetween(C.H, c0.from, c0.to) && bridgeBetween(C.H, c0.from, c0.to).count === 1 ? 1 : null, 15000, 'host sees coop build');
  check('合作：來賓架橋 → 房主共用盤同步', !!seenCoop);
  await buildTo(C.H, c1.from, c1.to, 1);
  await waitFor(() => bridgeBetween(C.G, c1.from, c1.to) && bridgeBetween(C.G, c1.from, c1.to).count === 1 ? 1 : null, 15000, 'guest sees host build');
  clickEl(C.G, C.G.document.querySelector('[data-hashi-undo]'));
  const unC = await waitFor(() => bridgeBetween(C.G, c0.from, c0.to).count === 0 && bridgeBetween(C.H, c0.from, c0.to).count === 0 ? 1 : null, 15000, 'coop undo sync');
  check('合作 undo：只撤自己的橋（兩頁同步）', !!unC);
  check('合作 undo：夥伴的橋不動', bridgeBetween(C.G, c1.from, c1.to).count === 1);
  clickEl(C.G, C.G.document.querySelector('[data-hashi-redo]'));
  const reC = await waitFor(() => bridgeBetween(C.H, c0.from, c0.to).count === 1 ? 1 : null, 15000, 'coop redo sync');
  check('合作 redo：橋回來（兩頁同步）', !!reC);
  // 夥伴改過 → undo 跳過：房主點按來賓的橋（1→2）
  await tapBridge(C.H, c0.from, c0.to);
  const ow = await waitFor(() => bridgeBetween(C.G, c0.from, c0.to).count === 2 ? 1 : null, 15000, 'host cycled to 2');
  check('房主把來賓的橋點成雙橋', !!ow);
  clickEl(C.G, C.G.document.querySelector('[data-hashi-undo]'));
  await sleep(1500);
  check('合作 undo：被夥伴改過的橋跳過（維持雙橋）', bridgeBetween(C.G, c0.from, c0.to).count === 2 && bridgeBetween(C.H, c0.from, c0.to).count === 2);
  check('S3 雙邊零錯誤', C.H.errors.length === 0 && C.G.errors.length === 0, (C.H.errors[0] || '') + ' | ' + (C.G.errors[0] || ''));
  console.log('==== HASHI-UNDOREDO: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
