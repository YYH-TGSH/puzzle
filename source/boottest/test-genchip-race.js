// PlatGenerating tick 競態決定性重現（2026-11-21 定性：begin 起 interval 250ms、el 惰性建立於 300ms show）
// 全新頁首次 begin＋強制持續 >300ms → 修前必爆 null.style（TEETH=1 跑 v1.72.3 正式站驗牙齒）、修後零錯誤＋晶片正常＋end 後無殘留 interval
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const TEETH = !!process.env.TEETH;
let html = fs.readFileSync(TEETH ? '/home/hatch/workspace/platform-site/index.html' : '/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
if (!TEETH) { const mock = require('./mockpeer.js'); html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>'); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, 60000); const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(150); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
(async () => {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m + ((e.detail && e.detail.stack) ? '\nSTACK: ' + e.detail.stack : '')); });
  vc.on('error', m => errs.push(String(m)));
  let liveIntervals = 0;
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.scrollTo = () => {}; w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } resume() { return Promise.resolve(); } };
      const si = w.setInterval.bind(w), ci = w.clearInterval.bind(w);
      w.setInterval = (...a) => { liveIntervals++; return si(...a); };
      w.clearInterval = (id) => { if (id != null) liveIntervals--; ci(id); };
      w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message + ((e.error && e.error.stack) ? '\nSTACK: ' + e.error.stack : '')); }); } });
  const w = dom.window, d = w.document;
  await waitFor(() => (typeof w.PLAT_show === 'function' && w.PlatDock && w.PlatGenerating) ? 1 : null, 120000, 'shell');
  check('全新頁：晶片元素尚未建立', !d.querySelector('#plat-generating'));
  const baseIntervals = liveIntervals;
  w.PlatGenerating.begin('repro-key', null); // 首次 begin；不出 end、強制跨越 250ms tick 與 300ms show
  await sleep(200);
  check('begin 後 interval +1', liveIntervals === baseIntervals + 1, 'live=' + liveIntervals + ' base=' + baseIntervals);
  await sleep(500); // t≈700ms：250/500ms tick 已跑（修前在此爆）、show 已於 300ms 顯示
  const chip = d.querySelector('#plat-generating');
  check('晶片已顯示（逾 300ms）', !!chip && chip.style.display === 'flex' && w.PlatGenerating._visible(), chip ? chip.style.display : '(none)');
  await sleep(700); // t≈1400ms：秒數應由 tick 更新至 1s
  const secTxt = chip ? (chip.textContent || '') : '';
  check('tick 正常更新秒數（1s）', /1s/.test(secTxt), secTxt.slice(0, 30));
  if (TEETH) {
    check('牙齒：修前版本必現 null.style 錯誤', errs.some(e => /reading 'style'/.test(e)), errs[0] || '(no errors)');
  } else {
    check('全程零頁面錯誤', errs.length === 0, errs[0] || '');
  }
  w.PlatGenerating.end();
  await sleep(100);
  check('end 後晶片隱藏', !!chip && chip.style.display === 'none' && !w.PlatGenerating._visible());
  check('end 後無殘留 interval（回基線）', liveIntervals === baseIntervals, 'live=' + liveIntervals + ' base=' + baseIntervals);
  await sleep(600);
  check('end 後靜默期仍零錯誤', TEETH ? true : errs.length === 0, errs[0] || '');
  console.log('==== GENCHIP-RACE' + (TEETH ? ' (TEETH vs v1.72.3 site)' : '') + ': ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
