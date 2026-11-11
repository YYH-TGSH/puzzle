// 殼級功能音效（v1.65.4）：拉霸＋摩天輪 spinSound 遷移 PlatAudio 後的路徑測試（嚴格 iOS mock 同 plataudio-path）。
// A 拉霸完整流程（點拉霸→tick 群＋落地叮噹 live）｜B 中斷（interrupted）後拉霸仍出聲（platAC 舊洞）｜
// C 摩天輪 spin（大廳）tick＋落地 live｜D 中斷後摩天輪仍出聲｜E 靜音時拉霸零 oscillator（遷移後跟隨 plat_muted）
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
function mockACStrict(w) {
  w.__AC = { instances: 0, ctxs: [], live: [], dead: [] };
  class P { constructor() { this.value = 0; this.calls = []; } setValueAtTime(v, t) { this.calls.push(['set', v, t]); this.value = v; } linearRampToValueAtTime(v, t) { this.calls.push(['lin', v, t]); } exponentialRampToValueAtTime(v, t) { this.calls.push(['exp', v, t]); } }
  class O { constructor(ctx) { this._ctx = ctx; this.type = ''; this.frequency = new P(); } connect() {} start(t) { this.startedAt = t; (this._ctx.state === 'running' ? w.__AC.live : w.__AC.dead).push(this); } stop() {} }
  class G { constructor() { this.gain = new P(); } connect() {} }
  w.AudioContext = class { constructor() { w.__AC.instances++; this.state = 'suspended'; this.currentTime = 0; this.destination = {}; w.__AC.ctxs.push(this); } createOscillator() { return new O(this); } createGain() { return new G(); } resume() { if (w.__IN_GESTURE) this.state = 'running'; return Promise.resolve(); } };
}
function loadPage(reg) {
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {}); vc.on('error', () => {});
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = reg; w.scrollTo = () => {}; mockACStrict(w); } });
  return { window: dom.window, document: dom.window.document };
}
function disp(p, el, ev) { if (!el) return; p.window.__IN_GESTURE = true; try { el.dispatchEvent(ev); } finally { p.window.__IN_GESTURE = false; } }
const clickEl = (p, el) => { if (el) { disp(p, el, new p.window.MouseEvent('pointerdown', { bubbles: true })); disp(p, el, new p.window.MouseEvent('click', { bubbles: true })); } return !!el; };
const liveFreqs = (p) => p.window.__AC.live.map(o => o.frequency.calls[0] && o.frequency.calls[0][1]);
(async () => {
  const reg = {};
  const p = loadPage(reg);
  await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? 1 : null, 60000, 'shell');
  clickEl(p, p.document.querySelector('#lob-go-create'));
  await waitFor(() => p.document.querySelector('#lob-step-nick').style.display !== 'none' ? 1 : null, 30000, 'nick step');
  // A 拉霸
  const liveA0 = p.window.__AC.live.length;
  clickEl(p, p.document.querySelector('#slot-spin'));
  await sleep(500);
  const newA = liveFreqs(p).slice(liveA0);
  check('A 拉霸 → tick 群（620/820）live', newA.includes(620) && newA.includes(820), JSON.stringify(newA.slice(0, 6)));
  check('A 拉霸 → 落地叮噹（880/1318）live', newA.includes(880) && newA.includes(1318));
  await sleep(1400); // 等拉霸停輪
  // C 摩天輪（大廳選色輪；基本鏈、在任何中斷之前）
  const wheel = await waitFor(() => p.document.querySelector('#lob-wheel-wrap button.wseg'), 30000, 'wheel');
  const liveC0 = p.window.__AC.live.length;
  clickEl(p, wheel);
  await sleep(600);
  const newC = liveFreqs(p).slice(liveC0);
  check('C 摩天輪轉動 → tick＋落地 live', (newC.includes(620) || newC.includes(820)) && newC.includes(880), JSON.stringify(newC.slice(0, 6)));
  await sleep(3200); // 等摩天輪停輪
  // E 靜音跟隨（ctx 健康態下驗靜音閘門本身）
  p.window.__AC.ctxs.forEach(c => { c.state = 'running'; });
  p.window.PlatAudio.setMuted(true);
  const liveE0 = p.window.__AC.live.length;
  clickEl(p, p.document.querySelector('#slot-spin'));
  await sleep(500);
  check('E 靜音（plat_muted）時拉霸零新 oscillator', p.window.__AC.live.length === liveE0);
  p.window.PlatAudio.setMuted(false);
  await sleep(1200);
  // B 中斷後拉霸
  p.window.__AC.ctxs.forEach(c => { c.state = 'interrupted'; });
  const liveB0 = p.window.__AC.live.length, deadB0 = p.window.__AC.dead.length;
  clickEl(p, p.document.querySelector('#slot-spin'));
  await sleep(500);
  check('B 中斷後拉霸 → 恢復出聲（live 新增）', p.window.__AC.live.length > liveB0, 'live ' + liveB0 + '->' + p.window.__AC.live.length);
  check('B 中斷後拉霸 → 無 dead 排程', p.window.__AC.dead.length === deadB0, 'dead ' + deadB0 + '->' + p.window.__AC.dead.length);
  await sleep(1400);
  // D 中斷後摩天輪
  p.window.__AC.ctxs.forEach(c => { c.state = 'interrupted'; });
  const liveD0 = p.window.__AC.live.length, deadD0 = p.window.__AC.dead.length;
  clickEl(p, p.document.querySelector('#lob-wheel-wrap button.wseg'));
  await sleep(600);
  check('D 中斷後摩天輪 → 恢復出聲', p.window.__AC.live.length > liveD0, 'live ' + liveD0 + '->' + p.window.__AC.live.length);
  check('D 中斷後摩天輪 → 無 dead 排程', p.window.__AC.dead.length === deadD0);
  console.log(`\n=== shell-sounds: ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
