// 孤兒裁示批（v1.65.5）驗收：①倒數 count/go（PlatCountdown 單元驅動）②PlatResults 星星逐顆 star
// ③數橋多人獲得道具 gift（房主經真連線注入 BRAWL_GRANT 給來賓）④數獨多人收到武器 gift（RECEIVE_WEAPON 注入）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(250); } console.log('  (timeout: ' + label + ')'); return null; }
function mockAC(w) {
  w.__AC = { oscs: [] };
  class P { constructor() { this.value = 0; this.calls = []; } setValueAtTime(v, t) { this.calls.push(['set', v, t]); this.value = v; } linearRampToValueAtTime(v, t) { this.calls.push(['lin', v, t]); } exponentialRampToValueAtTime(v, t) { this.calls.push(['exp', v, t]); } }
  class O { constructor() { this.type = ''; this.frequency = new P(); } connect() {} start() {} stop() {} }
  class G { constructor() { this.gain = new P(); } connect() {} }
  w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { const o = new O(); w.__AC.oscs.push(o); return o; } createGain() { return new G(); } resume() { this.state = 'running'; return Promise.resolve(); } };
}
function loadPage(reg) {
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {}); vc.on('error', () => {});
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = reg; w.scrollTo = () => {}; mockAC(w); } });
  return { window: dom.window, document: dom.window.document };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
const freqs = (p) => p.window.__AC.oscs.map(o => o.frequency.calls[0] && o.frequency.calls[0][1]);
const countF = (p, f) => freqs(p).filter(x => x === f).length;
async function makeRoom(H, G, game, mode) {
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
  for (const p of [H, G]) await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? 1 : null, 90000, 'shell');
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  await waitFor(() => hubRoom(H), 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙'; G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  await waitFor(() => hubRoom(G), 60000, 'G room');
  await waitFor(() => H.window.__PLAT_NET.roster.length === 2 ? 1 : null, 30000, 'roster2');
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="' + game + '"]')); await sleep(500);
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="' + mode + '"]')); await sleep(600);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const sb = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return b && !b.disabled ? b : null; }, 30000, 'start');
  if (!sb) return false;
  clickEl(H, sb);
  const inMatch = await waitFor(() => (H.window.__PLAT_NET.inMatch === game && G.window.__PLAT_NET.inMatch === game) ? 1 : null, 90000, 'inMatch ' + game);
  await sleep(2500);
  return !!inMatch;
}
function sendGameMsg(H, msg) { const cs = Object.values(H.window.__PLAT_NET.conns); if (cs.length) cs[0].send(msg); }
(async () => {
  // ① 倒數 count/go
  {
    const p = loadPage({});
    await waitFor(() => p.window.PlatCountdown && p.window.PlatAudio ? 1 : null, 60000, 'shell cd');
    p.window.document.dispatchEvent(new p.window.Event('pointerdown')); // 解鎖
    const CD = p.window.PlatCountdown;
    // 逐秒間隔（PlatAudio 同名 60ms 節流是真實引擎行為；真倒數本來就 1 秒一跳）
    CD.show(3); await sleep(120); CD.show(3); await sleep(120); CD.show(2); await sleep(120); CD.show(1); await sleep(120);
    check('① 倒數 3/2/1 → count×3（660 triangle、重複 show 同值不重播）', countF(p, 660) === 3, 'count660=' + countF(p, 660));
    CD.hide();
    check('① 數獨式收尾（1 之後 hide）→ go×1（complete 前兩音 523→659）', countF(p, 523) === 1 && countF(p, 659) === 1, 'go523=' + countF(p, 523));
    await sleep(120); CD.show(2); await sleep(120); CD.hide();
    check('① 中途 hide（未到 1）→ 不補 go', countF(p, 523) === 1);
    await sleep(120); CD.show('GO!');
    check('① 明示 GO! → go 再 +1', countF(p, 523) === 2 && countF(p, 659) === 2);
    // ② 星星 cascade
    const g523 = countF(p, 523);
    p.window.PlatResults.show({ title: '測試結算', accent: '#ffcc00', entries: [], stars: 2, buttons: [] });
    await sleep(1300);
    check('② PlatResults 2 星 → gift×2 逐顆（523 各 +2）', countF(p, 523) === g523 + 2, 'gift523 ' + g523 + '->' + countF(p, 523));
    p.window.PlatResults.hide();
  }
  // ③ 數橋獲得道具 star
  {
    const reg = {};
    const H = loadPage(reg), G = loadPage(reg);
    const okRoom = await makeRoom(H, G, 'hashi', 'race');
    check('③ 前置：數橋競速房間開局', okRoom);
    if (okRoom) {
      const gUid = G.window.localStorage.getItem('plat_uid_hashi');
      const before = countF(G, 523);
      sendGameMsg(H, { type: 'BRAWL_GRANT', toUid: gUid, item: 'bomb', fromUid: H.window.localStorage.getItem('plat_uid_hashi') });
      await sleep(900);
      check('③ 來賓收到道具 → gift +1（523）', countF(G, 523) === before + 1, 'gift523 ' + before + '->' + countF(G, 523));
    }
  }
  // ④ 數獨收到武器 star
  {
    const reg = {};
    const H = loadPage(reg), G = loadPage(reg);
    const okRoom = await makeRoom(H, G, 'sudoku', 'brawl');
    check('④ 前置：數獨大亂鬥房間開局', okRoom);
    if (okRoom) {
      const gUid = G.window.localStorage.getItem('plat_uid_sudoku');
      const before = countF(G, 523);
      // 來賓可能還在倒數/生成（matchPhase 未 playing 時守衛會擋）→ 重送直到進包（比照 plataudio-path H 的重試模式）
      let got = false;
      for (let t = 0; t < 10 && !got; t++) { sendGameMsg(H, { type: 'RECEIVE_WEAPON', targetUid: gUid, weaponType: 'balloon', id: 'wtest' + t, timestamp: Date.now() }); await sleep(1500); got = countF(G, 523) > before; }
      check('④ 來賓收到武器 → gift +1（523）', got, 'gift523 ' + before + '->' + countF(G, 523));
    }
  }
  console.log(`\n=== orphan-rulings: ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
