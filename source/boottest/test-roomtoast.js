// 回歸：房主自己一人在房間頁時，不該跳「只剩你一人」里程碑轉換 toast（2026-11-05 實機回報）
// 數獨 amLastPlayer 原本沒有「選手至少 2 位」的守衛：遊戲被背景預載後 playersList 只有房主一人，remaining==1 誤判成立。
// 流程比照 test-hub 的建房步驟。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0; const fails = [];
function ok(cond, label) { if (cond) { pass++; console.log('✅', label); } else { fail++; fails.push(label); console.log('❌', label); } }
async function waitFor(fn, ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await new Promise(r => setTimeout(r, 120)); }
  console.log('⏱ timeout:', label); return null;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function main() {
  const html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8')
    .replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errors.push(stamp(String(m))));
  const dom = new JSDOM(html, {
    url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { window.__SHARED_REG__ = {}; window.scrollTo = () => {}; window.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errors.push(stamp(e.message, e.error && e.error.stack)); }); }
  });
  const w = dom.window, d = dom.window.document;
  const clickEl = (el) => { if (el) el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); return !!el; };
  const click = (sel) => clickEl(d.querySelector(sel));
  await waitFor(() => (typeof w.PLAT_show === 'function' && w.__PLAT_NET) ? true : null, 120000, 'shell ready');
  w.PLAT_show('lobby');
  click('#lob-go-create');
  await waitFor(() => d.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'nick step');
  d.querySelector('#lob-name').value = '房主甲';
  click('#lob-confirm');
  const hubRoom = await waitFor(() => { const rm = d.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; }, 60000, 'hub room');
  ok(!!hubRoom, '房主建房 → 進房間頁');
  // 在房間頁停留並操作（切分頁），全程收集 toast
  const seen = [];
  const collect = () => { const t = d.querySelector('#plat-toast'); if (t && t.style.display !== 'none' && t.textContent && t.textContent.trim()) seen.push(t.textContent.trim()); };
  for (let i = 0; i < 16; i++) {
    await sleep(800); collect();
    if (i === 6) { const tab = [...d.querySelectorAll('#lob-step-room button')].find(b => b.textContent.includes('數橋')); if (tab) clickEl(tab); }
    if (i === 10) { const tab = [...d.querySelectorAll('#lob-step-room button')].find(b => b.textContent.includes('數獨')); if (tab) clickEl(tab); }
  }
  const bad = seen.filter(t => t.includes('只剩你一人'));
  ok(bad.length === 0, '房間頁（房主一人）不跳「只剩你一人」toast' + (bad.length ? '，實際跳了：' + bad[0] : ''));
  ok(errors.length === 0, '零錯誤' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ') : ''));
  console.log('\nRESULT roomtoast: ' + pass + ' pass / ' + fail + ' fail' + (fails.length ? ' FAILS: ' + fails.join('；') : ''));
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('FATAL', e); process.exit(2); });
