// Q2 設定入口（v1.43 modal 化；F2/F3 v1.71–1.72 改殼 PlatSetup 後同形驗證）：
// 數橋/地雷對局內點規格籤 → 殼 PlatSetup 列出難度/尺寸 → 換選後盤面重開（數橋 10x10→5x5 變小；地雷 9x9→16x16、sizeId=16、256 格）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
const html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8')
  .replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0; const fails = [];
function ok(cond, label) { if (cond) { pass++; console.log('✅', label); } else { fail++; fails.push(label); console.log('❌', label); } }
async function waitFor(fn, ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await new Promise(r => setTimeout(r, 120)); }
  console.log('⏱ timeout:', label); return null;
}
const errors = [];
async function main() {
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errors.push(stamp(String(m))));
  const dom = new JSDOM(html, {
    url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) {
      window.__SHARED_REG__ = {};
      window.scrollTo = () => {};
      window.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errors.push(stamp(e.message, e.error && e.error.stack)); });
    }
  });
  const w = dom.window, d = w.document;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clickBtn = (pred, scope) => { const b = [...(scope || d).querySelectorAll('button')].find(pred); if (b) { b.click(); return true; } return false; };
  const clickEl = (el) => { if (el) { el.click(); return true; } return false; };
  await waitFor(() => typeof w.PLAT_show === 'function' && w.PlatDock && d.querySelector('#view-home button'), 120000, 'shell ready');

  // ---------- 數橋 ----------
  w.PLAT_show('hashi');
  await waitFor(() => d.querySelector('#hashi-root [data-phome-card]'), 60000, 'hashi home');
  ok(clickBtn(b => b.textContent.includes('單機挑戰'), d.querySelector('#view-hashi')), '數橋：點單機挑戰');
  await waitFor(() => d.querySelector('#plat-setup [data-pse-card]'), 20000, 'hashi PlatSetup');
  ok(clickEl(d.querySelector('#plat-setup [data-pse-opt="2"]')), '數橋：選 10x10 標準開局');
  const svgW0 = await waitFor(() => { const svg = d.querySelector('#view-hashi svg'); return svg ? parseFloat(svg.style.width) || svg.viewBox.baseVal.width : null; }, 30000, 'hashi board');
  ok(!!svgW0, '數橋：盤面出現');
  ok(!d.querySelector('#view-hashi select'), '數橋：標頭已無原生 select');
  ok(clickEl(d.querySelector('#hashi-root [data-ptc="spec"]')), '數橋：點規格籤（設定鈕）');
  const hSetup = await waitFor(() => d.querySelector('#plat-setup [data-pse-card]'), 15000, 'hashi in-game PlatSetup');
  ok(!!hSetup && (hSetup.textContent || '').includes('設定難度') && (hSetup.textContent || '').includes('魔王'), '數橋：設定 PlatSetup 列出難度');
  ok(clickEl(d.querySelector('#plat-setup [data-pse-opt="1"]')), '數橋：選 5x5 幼幼班');
  const shrunk = await waitFor(() => { const svg = d.querySelector('#view-hashi svg'); const wdt = svg ? parseFloat(svg.style.width) || 0 : 0; return (svgW0 && wdt && wdt < svgW0) ? wdt : null; }, 30000, 'hashi board shrink');
  ok(!!shrunk, '數橋：換 5x5 後盤面變小（' + svgW0 + ' → ' + shrunk + '）');

  // ---------- 踩地雷 ----------
  w.PLAT_show('mines');
  await waitFor(() => d.querySelector('#mines-root [data-phome="1"]'), 120000, 'mines home'); // 比照 mines-framework：等殼 PlatHome mount 標記（第二款 boot 較慢）
  const dbg = () => w.__PLAT_HOOKS_mines && w.__PLAT_HOOKS_mines.debug && w.__PLAT_HOOKS_mines.debug();
  ok(clickBtn(b => b.textContent.includes('單機挑戰'), d.querySelector('#mines-root')), '地雷：點單機挑戰');
  await waitFor(() => d.querySelector('#plat-setup [data-pse-card]'), 20000, 'mines PlatSetup');
  ok(clickEl(d.querySelector('#plat-setup [data-pse-opt="9"]')), '地雷：選 9x9');
  await waitFor(() => dbg() && dbg().cells, 10000, 'mines board');
  ok(clickEl(d.querySelector('#mines-root [data-ptc="spec"]')), '地雷：點規格籤（設定鈕）');
  const mSetup = await waitFor(() => d.querySelector('#plat-setup [data-pse-card]'), 15000, 'mines in-game PlatSetup');
  ok(!!mSetup && (mSetup.textContent || '').includes('設定盤面') && !!mSetup.querySelector('[data-pse-cust]'), '地雷：設定 PlatSetup 出現（含自訂區塊）');
  ok(clickEl(d.querySelector('#plat-setup [data-pse-opt="16"]')), '地雷：選 16×16');
  const grown = await waitFor(() => { const g = dbg(); return g && g.sizeId === 16 && g.cells && g.cells.length === 256 ? true : null; }, 15000, 'mines 16x16');
  ok(!!grown, '地雷：換成 16×16（256 格）');

  ok(errors.length === 0, '零錯誤' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  console.log('\nRESULT settings-modal: ' + pass + ' pass / ' + fail + ' fail' + (fails.length ? ' FAILS: ' + fails.join('；') : ''));
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('FATAL', e); process.exit(2); });
