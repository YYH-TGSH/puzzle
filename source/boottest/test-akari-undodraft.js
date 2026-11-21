// 美術燈 v1.73.0 項1+項2：上一步/下一步＋草稿模式
// 單機：點按一步、拖曳一程一步、redo 清除、草稿不發光/不計數/牆數字不計、鉛筆一擊轉真燈、草稿不完賽、undo 涵蓋草稿
// 多人：undo 後重放同一批正確燈——里程碑計數與禮物額度皆不重複計（防農場，計數器單調）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
let mock = require('./mockpeer.js');
mock = mock.replace("R.__msglog = R.__msglog || [];", "R.__msglog = R.__msglog || []; R.__fullog = R.__fullog || [];")
           .replace("if (pl && pl.type) R.__msglog.push({", "if (pl && pl.type) { try { R.__fullog.push(pl); } catch (e) {} R.__msglog.push({")
           .replace(": undefined }); } } catch (e) {}", ": undefined }); } } } catch (e) {}");
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
const undoBtn = (p) => p.document.querySelector('[data-akari-undo]');
const redoBtn = (p) => p.document.querySelector('[data-akari-redo]');
const modeBtn = (p) => p.document.querySelector('#view-akari [data-pb="mode-press"]');
async function cycleModeTo(p, target) { // PlatBar 模式循環 tap→draft→cross→tap
  for (let k = 0; k < 4 && dbg(p).mode !== target; k++) { clickEl(p, modeBtn(p)); await sleep(200); }
  return dbg(p).mode === target;
}
function neighborsOf(w, h, i) { const x = i % w, y = Math.floor(i / w), out = []; if (x > 0) out.push(i - 1); if (x < w - 1) out.push(i + 1); if (y > 0) out.push(i - w); if (y < h - 1) out.push(i + w); return out; }

(async () => {
  // ================= 單機 =================
  const S = loadPage('S');
  await waitFor(() => typeof S.window.PLAT_show === 'function' && S.window.PlatDock, 60000, 'S shell');
  S.window.PLAT_show('akari');
  await waitFor(() => S.document.querySelector('#akari-root h1'), 60000, 'S home');
  clickEl(S, [...S.document.querySelectorAll('#akari-root button')].find(b => (b.textContent || '').includes('單機挑戰')));
  await sleep(300);
  clickEl(S, [...S.document.querySelectorAll('#plat-setup [data-pse-opt]')].find(b => (b.textContent || '').includes('10×10')));
  await waitFor(() => dbg(S) && dbg(S).puzzle && cellEl(S, 0), 60000, 'S board');
  const pz = dbg(S).puzzle, W = pz.w, walls = new Set(pz.walls), sol = pz.solution;
  check('單機：上一步/下一步鈕存在且初始 disabled', !!undoBtn(S) && !!redoBtn(S) && undoBtn(S).disabled && redoBtn(S).disabled);
  // 點按一步：放燈 → undo → redo
  const s0 = sol[0];
  cellEl(S, s0).click(); await sleep(150);
  check('點按放燈', dbg(S).cells[s0] === 1 && !undoBtn(S).disabled);
  clickEl(S, undoBtn(S)); await sleep(150);
  check('undo 一步還原空格', dbg(S).cells[s0] === 0 && !redoBtn(S).disabled);
  clickEl(S, redoBtn(S)); await sleep(150);
  check('redo 重放燈', dbg(S).cells[s0] === 1);
  // 新動作清除 redo
  clickEl(S, undoBtn(S)); await sleep(120);
  const other = sol.find(i => i !== s0);
  cellEl(S, other).click(); await sleep(120);
  check('undo 後新動作 → redo 清除（disabled）', redoBtn(S).disabled && dbg(S).cells[other] === 1);
  clickEl(S, undoBtn(S)); await sleep(120); // 回到全空

  // ---- 草稿模式 ----
  check('切到草稿模式', await cycleModeTo(S, 'draft'));
  const dTarget = sol[1];
  cellEl(S, dTarget).click(); await sleep(150);
  check('草稿模式點空格 → 草稿燈（4）', dbg(S).cells[dTarget] === 4);
  check('草稿燈渲染虛線標記 [data-draft]', !!cellEl(S, dTarget).querySelector('[data-draft="1"]'));
  // 不發光：草稿所在段的另一格不應被照亮（底色維持白）
  const segMate = (() => { const y = Math.floor(dTarget / W); for (let x = 0; x < W; x++) { const i = y * W + x; if (!walls.has(i) && i !== dTarget) return i; } return -1; })();
  const mateBg = segMate >= 0 ? (cellEl(S, segMate).style.background || '') : '';
  check('草稿不發光：同段格底色未亮', segMate >= 0 && !/219|dbeafe/i.test(mateBg) && mateBg !== 'rgb(219, 234, 254)', 'bg=' + mateBg);
  // 不計進度/計數：頂欄 💡 計數（PlatCount aria-label）維持 0
  const band = S.document.querySelector('#view-akari [data-ptc-band]');
  const cntPc = band && band.querySelector('.plat-count');
  check('草稿不計放燈數（頂欄計數 0）', !!cntPc && cntPc.getAttribute('aria-label') === '0', cntPc && cntPc.getAttribute('aria-label'));
  // 牆數字不計草稿：找數字牆、在其鄰格放滿草稿（數量＝數字）→ 數字不得轉綠(ok)
  const numWall = pz.numbers.map(([wi, n]) => ({ wi, n, nb: neighborsOf(W, pz.h, wi).filter(j => !walls.has(j)) })).find(x => x.n >= 1 && x.nb.length >= x.n && x.nb.every(j => dbg(S).cells[j] === 0 || j === dTarget));
  let wallOk = false;
  if (numWall) {
    let placed = 0;
    for (const j of numWall.nb) { if (placed >= numWall.n) break; if (dbg(S).cells[j] === 0) { cellEl(S, j).click(); await sleep(60); placed++; } else if (dbg(S).cells[j] === 4) placed++; }
    await sleep(200);
    const wallEl = [...S.document.querySelectorAll('#akari-root div')].find(el => el.children.length === 1 && el.textContent === String(numWall.n) && el.querySelector('span'));
    const col = wallEl ? (wallEl.querySelector('span').style.color || '') : '';
    wallOk = col !== 'rgb(74, 222, 128)' && col !== '#4ade80';
    check('牆數字不計草稿燈（放滿草稿數字不轉綠）', wallOk, 'color=' + col);
    // 清掉這些草稿（逐格點掉，再連同 dTarget）
    for (const j of numWall.nb) if (dbg(S).cells[j] === 4) { cellEl(S, j).click(); await sleep(50); }
  } else check('牆數字不計草稿燈（找到可測數字牆）', false, 'no wall');
  // 草稿點按移除＋undo 涵蓋草稿
  cellEl(S, dTarget).click(); await sleep(120);
  check('草稿模式再點草稿 → 移除', dbg(S).cells[dTarget] === 0);
  clickEl(S, undoBtn(S)); await sleep(120);
  check('undo 涵蓋草稿移除（草稿回來）', dbg(S).cells[dTarget] === 4);
  // 鉛筆一擊轉真燈
  check('切回鉛筆模式', await cycleModeTo(S, 'tap'));
  cellEl(S, dTarget).click(); await sleep(150);
  check('鉛筆點草稿 → 一擊轉真燈（不經循環）', dbg(S).cells[dTarget] === 1);
  clickEl(S, undoBtn(S)); await sleep(120);
  check('undo 涵蓋轉換（回草稿）', dbg(S).cells[dTarget] === 4);
  clickEl(S, undoBtn(S)); await sleep(120); // 回到放草稿前（全空基線附近）

  // ---- 拖曳塗草稿一程一步 ----
  check('切草稿模式（拖曳）', await cycleModeTo(S, 'draft'));
  const snap2 = dbg(S); let segStart = -1;
  for (let y = 0; y < snap2.puzzle.h && segStart < 0; y++) { let run = 0; for (let x = 0; x < W; x++) { const i = y * W + x; if (!walls.has(i) && snap2.cells[i] === 0) { run++; if (run >= 5) { segStart = i - 4; break; } } else run = 0; } }
  check('找到連續空格段（拖曳）', segStart >= 0);
  const CELL = 30, OX = 100, OY = 200;
  const rectOf = i => { const x = OX + (i % W) * CELL, y = OY + Math.floor(i / W) * CELL; return { left: x, top: y, right: x + CELL, bottom: y + CELL, width: CELL, height: CELL, x, y }; };
  S.document.querySelectorAll('button[data-cell]').forEach(el => { const i = Number(el.dataset.cell); el.getBoundingClientRect = () => rectOf(i); });
  S.document.elementFromPoint = (x, y) => { const cx = Math.floor((x - OX) / CELL), cy = Math.floor((y - OY) / CELL); if (cx < 0 || cy < 0 || cx >= W || cy >= snap2.puzzle.h) return null; return cellEl(S, cy * W + cx) || null; };
  const pev = (type, el, x, y) => { const ev = new S.window.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, buttons: type === 'pointerup' ? 0 : 1 }); ev.pointerType = 'touch'; el.dispatchEvent(ev); };
  const p0 = { x: OX + (segStart % W) * CELL + CELL / 2, y: OY + Math.floor(segStart / W) * CELL + CELL / 2 };
  pev('pointerdown', cellEl(S, segStart), p0.x, p0.y);
  await sleep(150);
  for (let k = 1; k <= 8; k++) { pev('pointermove', cellEl(S, segStart), p0.x + k * 8, p0.y); await sleep(40); }
  pev('pointerup', cellEl(S, segStart), p0.x + 64, p0.y); await sleep(200);
  const painted = [0, 1, 2].filter(o => dbg(S).cells[segStart + o] === 4).length;
  check('草稿模式慢拖 → 沿路塗草稿（≥2 格）', painted >= 2, 'painted=' + painted);
  clickEl(S, undoBtn(S)); await sleep(150);
  const afterUndo = [0, 1, 2].filter(o => dbg(S).cells[segStart + o] === 4).length;
  check('拖曳一程＝一步：一次 undo 全程草稿清除', afterUndo === 0, 'remain=' + afterUndo);
  clickEl(S, redoBtn(S)); await sleep(150);
  const afterRedo = [0, 1, 2].filter(o => dbg(S).cells[segStart + o] === 4).length;
  check('redo 一次重現整程草稿', afterRedo === painted, 'redo=' + afterRedo);

  // ---- 草稿不完賽 → 轉真燈才完賽 ----
  const S2 = loadPage('S2');
  await waitFor(() => typeof S2.window.PLAT_show === 'function' && S2.window.PlatDock, 60000, 'S2 shell');
  S2.window.PLAT_show('akari');
  await waitFor(() => S2.document.querySelector('#akari-root h1'), 60000, 'S2 home');
  clickEl(S2, [...S2.document.querySelectorAll('#akari-root button')].find(b => (b.textContent || '').includes('單機挑戰')));
  await sleep(300);
  clickEl(S2, [...S2.document.querySelectorAll('#plat-setup [data-pse-opt]')].find(b => (b.textContent || '').includes('7×7')));
  await waitFor(() => dbg(S2) && dbg(S2).puzzle && cellEl(S2, 0), 60000, 'S2 board');
  check('S2 切草稿模式', await cycleModeTo(S2, 'draft'));
  for (const i of dbg(S2).puzzle.solution) { cellEl(S2, i).click(); await sleep(35); }
  await sleep(300);
  check('全解答格放草稿 → 不完賽', dbg(S2).status !== 'won' && dbg(S2).puzzle.solution.every(i => dbg(S2).cells[i] === 4));
  check('S2 切回鉛筆', await cycleModeTo(S2, 'tap'));
  for (const i of dbg(S2).puzzle.solution) { if (dbg(S2).cells[i] === 4) { cellEl(S2, i).click(); await sleep(35); } }
  const won = await waitFor(() => dbg(S2).status === 'won' ? 1 : null, 15000, 'S2 won');
  check('草稿逐格轉真燈 → 完賽', !!won);
  check('S 頁零錯誤', S.errors.length === 0, S.errors[0] || '');
  check('S2 頁零錯誤', S2.errors.length === 0, S2.errors[0] || '');

  // ================= 多人：防農場 =================
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
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="race"][data-hub-game="akari"]')); // v1.74.0：預設改合作，測競速須明示選 race
  await sleep(500);
  setSel(H.window, H.document.querySelector('#lob-step-room [data-hub-key="sizeId"][data-hub-game="akari"]'), 7);
  setSel(H.window, H.document.querySelector('#lob-step-room [data-hub-key="itemStartTime"][data-hub-game="akari"]'), 0);
  await sleep(500);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(600);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 60000, 'start');
  clickEl(H, en);
  await waitFor(() => dbg(H).mp.phase === 'playing' && dbg(G).mp.phase === 'playing', 60000, 'playing');
  const gpz = dbg(G).puzzle, gsol = new Set(gpz.solution);
  const fullog = (p) => (p.window.__SHARED_REG__ && p.window.__SHARED_REG__.__fullog) || [];
  const guestUid = dbg(H).players.find(p => !p.isHost).id;
  const giftMsgs = () => fullog(H).filter(m => m.type === 'AKARI_GIFT' && m.fromUid === guestUid && m.fromName !== '里程碑').length;
  const creditAcct = () => dbg(G).giftCredit + giftMsgs();
  // 禮物額度防農場：滿足一面數字牆（+0.5）→ undo 最後一燈 → 重放 → 額度不得再增
  const wallCand = gpz.numbers.map(([wi, n]) => ({ wi, n, solNb: neighborsOf(gpz.w, gpz.h, wi).filter(j => gsol.has(j)) })).find(x => x.n > 0 && x.solNb.length === x.n);
  check('MP：找到可滿足數字牆', !!wallCand);
  if (wallCand) {
    for (const b of wallCand.solNb) { if (dbg(G).cells[b] === 0) { cellEl(G, b).click(); await sleep(60); } }
    await waitFor(() => creditAcct() >= 0.5, 15000, 'credit 0.5');
    const base = creditAcct();
    check('MP：滿足數字牆額度 +0.5', base >= 0.5, 'acct=' + base);
    const lastBulb = wallCand.solNb[wallCand.solNb.length - 1];
    clickEl(G, undoBtn(G)); await sleep(250);
    check('MP：undo 撤下最後一燈', dbg(G).cells[lastBulb] === 0);
    cellEl(G, lastBulb).click(); await sleep(400);
    check('MP：重放同一燈 → 額度不重複計（防農場）', Math.abs(creditAcct() - base) < 0.001, 'acct=' + creditAcct() + ' base=' + base);
    // 里程碑防農場：記目前 milestone → undo → 重放 → milestone 不增
    const msBase = dbg(G).milestone;
    clickEl(G, undoBtn(G)); await sleep(250);
    cellEl(G, lastBulb).click(); await sleep(400);
    check('MP：undo/重放 → 里程碑計數不增（防農場）', dbg(G).milestone === msBase, 'ms=' + dbg(G).milestone + ' base=' + msBase);
    // 進度同步有隨 undo 下降再回升（房主 god 視角）
    const gView = () => { const g = dbg(H).god[guestUid]; return g ? g.progress : null; };
    clickEl(G, undoBtn(G));
    const dropped = await waitFor(() => { const pv = gView(); return pv != null && pv < 1 ? pv : null; }, 15000, 'prog drop');
    check('MP：undo 後房主端進度同步下降', dropped != null, 'prog=' + dropped);
  }
  check('H 頁零錯誤', H.errors.length === 0, H.errors[0] || '');
  check('G 頁零錯誤', G.errors.length === 0, G.errors[0] || '');
  console.log('==== AKARI-UNDODRAFT: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
