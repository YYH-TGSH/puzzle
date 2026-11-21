// 重現「混版」：新殼 shell.js + 舊 index.html（沒有 #view-mines）→ 房主開數獨局是否空白
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const before = html.length;
html = html.replace(/<div id="view-mines" class="plat-view">[\s\S]*?<\/div>\s*<\/div>/, '');
console.log('stripped view-mines:', before - html.length, 'bytes; still has view-mines?', html.includes('view-mines'));
let mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block'; };
(async () => {
  const H = loadPage('H'), G = loadPage('G');
  for (const p of [H, G]) await waitFor(() => typeof p.window.PLAT_show === 'function' && p.window.PlatDock, 600000, p.label + ' shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => hubRoom(H) && H.window.__PLAT_NET.code, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => H.window.__PLAT_NET.roster.length >= 2, 90000, 'roster2');
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(400);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const sb = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return b && !b.disabled ? b : null; }, 90000, 'start enabled');
  console.log('start btn:', !!sb);
  clickEl(H, sb);
  await sleep(12000);
  for (const p of [H, G]) {
    const root = p.document.querySelector('#sudoku-root');
    const v = p.document.querySelector('#view-sudoku');
    console.log(p.label + ': inMatch=' + p.window.__PLAT_NET.inMatch + ' data-view=' + p.document.body.getAttribute('data-view') + ' viewActive=' + (v && v.classList.contains('active')) + ' sudokuRootKids=' + (root ? root.childElementCount : -1) + ' hooks=' + !!p.window.__PLAT_HOOKS_sudoku + ' errors=' + JSON.stringify(p.errors.slice(0, 2)));
  }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
