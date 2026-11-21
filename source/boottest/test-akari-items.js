// 美術燈道具：里程碑 GRANT、禮物額度（數字牆正確滿足 +0.5、防重複計、滿 1 送較弱者）、鎖定燈不可移除、
// 斷電（純視覺、狀態不變、約 5 秒復電）、最後一位陷阱轉禮物
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
let mock = require('./mockpeer.js');
mock = mock.replace("R.__msglog = R.__msglog || [];", "R.__msglog = R.__msglog || []; R.__fullog = R.__fullog || [];")
           .replace("if (pl && pl.type) R.__msglog.push({", "if (pl && pl.type) { try { R.__fullog.push(pl); } catch (e) {} R.__msglog.push({")
           .replace(": undefined }); } } catch (e) {}", ": undefined }); } } } catch (e) {}");
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(250); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
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
const fullog = (p) => (p.window.__SHARED_REG__ && p.window.__SHARED_REG__.__fullog) || [];
function neighborsOf(w, h, i) { const x = i % w, y = Math.floor(i / w), out = []; if (x > 0) out.push(i - 1); if (x < w - 1) out.push(i + 1); if (y > 0) out.push(i - w); if (y < h - 1) out.push(i + w); return out; }
async function placeBulb(p, i) { if (dbg(p).cells[i] === 0) { cellEl(p, i).click(); await sleep(45); } }
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
  await waitFor(() => G.window.__PLAT_NET.armed.game === 'akari', 30000, 'armed');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="race"][data-hub-game="akari"]')); // v1.74.0：道具列只在競速模式顯示，先切 race
  await sleep(500);
  setSel(H.window, H.document.querySelector('#lob-step-room [data-hub-key="sizeId"][data-hub-game="akari"]'), 7);
  setSel(H.window, H.document.querySelector('#lob-step-room [data-hub-key="itemStartTime"][data-hub-game="akari"]'), 0);
  await sleep(500);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(600);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 90000, 'start');
  clickEl(H, en);
  await waitFor(() => dbg(H).mp.phase === 'playing' && dbg(G).mp.phase === 'playing', 90000, 'playing');
  const hostUid = dbg(G).players.find(p => p.isHost).id, guestUid = dbg(H).players.find(p => !p.isHost).id;
  // 斷電證據蒐集（背景輪詢：抓到作用中就立刻存時長/渲染/狀態快照，避免 5 秒窗錯過）
  const outageCap = { seen: null };
  const capIv = setInterval(() => {
    if (outageCap.seen) return;
    for (const p of [H, G]) {
      try {
        const u = dbg(p).outageUntil;
        if (u && u > Date.now()) {
          const d = dbg(p);
          const litIdx = d.puzzle.solution.find(i => d.cells[i] === 0) != null ? d.puzzle.solution[0] : 0;
          const el = cellEl(p, d.puzzle.solution[0]);
          outageCap.seen = { page: p, until: u, remain: u - Date.now(), bg: el ? el.style.background : '', cells: JSON.stringify(d.cells), bulbs: d.cells.filter(c => c === 1 || c === 3).length };
          return;
        }
      } catch (e) {}
    }
  }, 200);
  // ---- Phase A：禮物額度（來賓先滿足兩面數字牆；房主進度 0＝較弱 → 禮物送房主） ----
  const pz = dbg(G).puzzle, W = pz.w, Hh = pz.h;
  const solSet = new Set(pz.solution);
  const allWalls = pz.numbers.map(([wi, n]) => ({ wi, n, solNb: neighborsOf(W, Hh, wi).filter(j => solSet.has(j)) })).filter(x => x.n > 0 && x.solNb.length === x.n);
  const sub = (a, b) => a.every(x => b.includes(x));
  let walls = null;
  for (let i = 0; i < allWalls.length && !walls; i++) for (let j = 0; j < allWalls.length; j++) { if (i === j) continue; if (!sub(allWalls[i].solNb, allWalls[j].solNb) && !sub(allWalls[j].solNb, allWalls[i].solNb)) { walls = [allWalls[i], allWalls[j]]; break; } }
  if (!walls && allWalls.length >= 2) walls = [allWalls[0], allWalls[1]];
  check('題目有可滿足的數字牆', !!walls, 'walls=' + allWalls.length);
  const giftCount = () => fullog(H).filter(m => m.type === 'AKARI_GIFT' && m.fromUid === guestUid && m.fromName !== '里程碑').length; // 只計額度禮物（里程碑禮物 fromName='里程碑'、會連鎖抬進度，不在此列）
  for (const b of walls[0].solNb) await placeBulb(G, b);
  // 記帳不變量：earned = 目前額度 + 已送出禮物數（每送 1 個扣 1.0）；同批放燈可能連帶滿足第三面牆，故不盯瞬時 0.5
  await waitFor(() => dbg(G).giftCredit + giftCount() >= 0.5, 15000, 'credit earned');
  check('滿足數字牆 → 禮物額度 +0.5（記帳：額度＋已送出 ≥0.5）', dbg(G).giftCredit + giftCount() >= 0.5, 'credit=' + dbg(G).giftCredit + ' gifts=' + giftCount());
  for (const b of walls[1].solNb) await placeBulb(G, b);
  const sent = await waitFor(() => giftCount() >= 1 ? 1 : null, 20000, 'gift sent');
  check('額度滿 1 → AKARI_GIFT 送出（給較弱的房主）', !!sent && fullog(H).find(m => m.type === 'AKARI_GIFT' && m.fromUid === guestUid && m.fromName !== '里程碑').toUid === hostUid);
  check('送出後額度扣 1（<1）', dbg(G).giftCredit < 1, 'credit=' + dbg(G).giftCredit);
  const hostLocked = await waitFor(() => dbg(H).cells.filter(c => c === 3).length >= 1 ? 1 : null, 20000, 'host locked bulb');
  check('房主收到禮物 → 鎖定燈出現', !!hostLocked);
  // ---- Phase C：鎖定燈不可點掉 ----
  const li = dbg(H).cells.findIndex(c => c === 3);
  if (li >= 0) { cellEl(H, li).click(); await sleep(200); check('鎖定燈點不掉', dbg(H).cells[li] === 3); }
  else check('鎖定燈點不掉', false, 'no locked bulb on host');
  // ---- Phase D：逐步推進，陷阱庫存一出現就發動斷電（避免禮物連鎖先把雙方完賽） ----
  async function nextBulb(p) { const d = dbg(p); const sol = d.puzzle.solution; const cand = sol.find(i => d.cells[i] === 0); if (cand != null) { cellEl(p, cand).click(); await sleep(60); return true; } return false; }
  let fired = false;
  for (let step = 0; step < 160 && !outageCap.seen; step++) {
    if (dbg(H).myOutcome || dbg(G).myOutcome) break;
    const hT = dbg(H).items.trap, gT = dbg(G).items.trap;
    if (hT >= 1 || gT >= 1) {
      const holder = hT >= 1 ? H : G;
      const btn = [...holder.document.querySelectorAll('#akari-root button')].find(b => (b.textContent || '').includes('斷電'));
      if (btn && !btn.disabled) { btn.click(); fired = true; await sleep(600); }
    }
    if (outageCap.seen) break;
    await nextBulb(step % 2 ? G : H);
    await sleep(90);
  }
  check('里程碑產出陷阱並發動（庫存/自動/手動其一）', !!outageCap.seen || fired, 'H trap=' + dbg(H).items.trap + ' G trap=' + dbg(G).items.trap);
  const grantSeen = fullog(H).filter(m => m.type === 'AKARI_GRANT').length;
  check('里程碑 GRANT 有發出（房主仲裁）', grantSeen >= 1, 'grants=' + grantSeen);
  // ---- Phase E：斷電雙端行為（證據由背景輪詢蒐集） ----
  const cap = outageCap.seen;
  check('斷電生效（一端被斷電）', !!cap);
  if (cap) {
    check('斷電時長約 5 秒', cap.remain > 2500 && cap.remain <= 5200, 'remain=' + cap.remain);
    check('斷電中光暈消失（解答燈格不再亮底）', !String(cap.bg).includes('254, 243, 199'), 'bg=' + cap.bg);
    const tp = cap.page;
    const after = await waitFor(() => dbg(tp).outageUntil === 0 ? 1 : null, 12000, 'outage expires');
    check('約 5 秒後自動復電', !!after);
    check('斷電不改狀態（過期後盤面與斷電當下一致）', JSON.stringify(dbg(tp).cells) === cap.cells, 'bulbs cap=' + cap.bulbs);
  }
  clearInterval(capIv);
  check('零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  console.log('==== AKARI-ITEMS: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
