// v1.63.0 新增：PlatTap 判定矩陣＋PlatZoom clamp/武裝單元測試（直接對殼的 window.PlatTap/PlatZoom 餵合成事件，不經遊戲接線）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name + (extra ? ' — ' + extra : '')); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(120); } console.log('  (timeout: ' + label + ')'); return null; }
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc, beforeParse(w) { w.__SHARED_REG__ = {}; w.scrollTo = () => {}; } });
const w = dom.window;
(async () => {
  await waitFor(() => typeof w.PlatTap === 'function' && typeof w.PlatZoom === 'function', 60000, 'shell factories');
  const T = w.PlatTap;
  // --- PlatTap 判定矩陣（注入時間，確定性） ---
  { const t = T({ slop: 22, tapMaxMs: 350, longpressMs: 220 }); t.down(100, 100, 1000); const r = t.up(121, 100, 1200); check('PlatTap：漂移 21px（≤22）→ tap', r.type === 'tap' && Math.abs(r.drift - 21) < 0.01, JSON.stringify(r)); }
  { const t = T({ slop: 22, tapMaxMs: 350, longpressMs: 220 }); t.down(100, 100, 1000); const r = t.up(122, 100, 1200); check('PlatTap：漂移恰 22px → tap（邊界含等號）', r.type === 'tap'); }
  { const t = T({ slop: 22, tapMaxMs: 350, longpressMs: 220 }); t.down(100, 100, 1000); const r = t.up(123, 100, 1200); check('PlatTap：漂移 23px（>22）→ drag', r.type === 'drag'); }
  { const t = T({ slop: 22, tapMaxMs: 350, longpressMs: 220 }); t.down(100, 100, 1000); check('PlatTap：poll 未到 220ms → null', t.poll(1219) === null); check('PlatTap：poll 到 220ms → longpress', t.poll(1220) === 'longpress'); check('PlatTap：longpress 只觸發一次', t.poll(1400) === null); const r = t.up(100, 100, 1500); check('PlatTap：longpress 後 up → type longpress＋旗標', r.type === 'longpress' && r.longpress === true); }
  { const t = T({ slop: 22, tapMaxMs: 350, longpressMs: 220 }); t.down(100, 100, 1000); const r = t.up(100, 100, 1349); check('PlatTap：dur 349（<350）→ tap', r.type === 'tap'); }
  { const t = T({ slop: 22, tapMaxMs: 350, longpressMs: 220 }); t.down(100, 100, 1000); const r = t.up(100, 100, 1350); check('PlatTap：dur 350（≥tapMax）→ cancel（數橋舊 <350 語意）', r.type === 'cancel'); }
  { const t = T({ slop: 22, longpressMs: 500 }); t.down(0, 0, 0); const c = t.cancel(3, 4, 100); check('PlatTap：cancel 結算 type=cancel＋保留漂移', c.type === 'cancel' && Math.abs(c.drift - 5) < 0.01); t.down(500, 500, 1000); const r = t.up(510, 500, 1100); check('PlatTap：cancel 後下一次 down 基準乾淨（對新原點量漂移）', r.type === 'tap' && Math.abs(r.drift - 10) < 0.01, JSON.stringify(r)); check('PlatTap：結算後 active=false', t.active() === false); }
  { const t = T({ slop: 22 }); t.down(0, 0, 0); check('PlatTap：move 漂移 ≤22 → dragging=false', t.move(22, 0).dragging === false); check('PlatTap：move 漂移 >22 → dragging=true', t.move(23, 0).dragging === true); t.cancel(); }
  { const t = T({ suppressMs: 700 }); t.markSuppress(1000); check('PlatTap：suppress 窗內（+699）→ 擋', t.shouldSuppressClick(1699) === true); check('PlatTap：suppress 窗外（+700）→ 放行', t.shouldSuppressClick(1700) === false); }
  { const t = T({ suppressMs: 500 }); t.markSuppress(1000, 7); check('PlatTap：suppress 同 tag → 擋', t.shouldSuppressClick(1100, 7) === true); check('PlatTap：suppress 不同 tag → 放行', t.shouldSuppressClick(1100, 8) === false); t.clearSuppress(); check('PlatTap：clearSuppress 後立即放行（一次性吞嚥）', t.shouldSuppressClick(1100, 7) === false); }
  { const t = T({}); const r = t.up(0, 0, 0); check('PlatTap：無手勢 up → none（不 throw）', r.type === 'none'); }
  // --- PlatZoom ---
  const Z = w.PlatZoom;
  { const z = Z({ min: 0.4, max: 3.5, value: 1 }); check('PlatZoom：add 步進＋clamp 上限', z.add(0.3) === 1.3 && z.add(99) === 3.5); check('PlatZoom：clamp 下限', z.add(-99) === 0.4); check('PlatZoom：reset 回 1', z.reset() === 1); check('PlatZoom：set 單次 range（適應 [0.2,3.5]）', z.set(0.25, [0.2, 3.5]) === 0.25 && z.set(0.1, [0.2, 3.5]) === 0.2); check('PlatZoom：setRaw 不夾', z.setRaw(9) === 9 && z.value() === 9); }
  { const z = Z({ min: 1, max: 2.5, value: 1, cleanup2dp: true }); check('PlatZoom：cleanup2dp 步進淨化（地雷 0.25）', z.add(0.25) === 1.25 && z.add(0.25) === 1.5 && z.add(-0.25) === 1.25); }
  { const el = w.document.createElement('div'); Z.armTransition(el); check('PlatZoom：armTransition 掛 200ms 過渡', /200ms/.test(el.style.transition || ''), el.style.transition); await sleep(320); check('PlatZoom：armTransition 260ms 後自動卸下', (el.style.transition || '') === ''); }
  console.log('\nRESULT plattap: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})();
