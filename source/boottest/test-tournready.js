// 回歸（v1.48.0）：錦標賽開賽比照其他競速模式——準備在房間名單卡（同顆按鈕）、房主開始鈕同閘門（全員準備或 60 秒）
// 過去錦標賽在設定面板有自己的開賽鈕、完全沒有準備步驟，跟其他模式不一樣（使用者指示統一）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0; const fails = [];
function ok(cond, label) { if (cond) { pass++; console.log('✅', label); } else { fail++; fails.push(label); console.log('❌', label); } }
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await new Promise(r => setTimeout(r, 120)); } console.log('⏱ timeout:', label); return null; }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sharedReg = {};
function loadPage(label) {
  const html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8')
    .replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole(); const errors = [];
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(stamp(m, e.detail && e.detail.stack)); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { window.__SHARED_REG__ = sharedReg; window.scrollTo = () => {}; window.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errors.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors, label };
}
(async () => {
  const H = loadPage('H'), G = loadPage('G');
  const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
  for (const p of [H, G]) await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell');
  // 建房＋來賓加入（比照 test-hub 流程）
  H.window.PLAT_show('lobby');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; }, 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  G.window.PLAT_show('lobby');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙';
  const codeInput = G.document.querySelector('#lob-code'); if (codeInput) codeInput.value = code;
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => (H.window.__PLAT_NET.roster.length >= 2 && G.window.__PLAT_NET.roster.length >= 2) ? true : null, 60000, 'roster 2');
  // 房主切錦標賽分頁
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  await sleep(1000);
  const readyBtn = p => p.document.querySelector('#lob-step-room [data-pr="ready"]');
  const startBtn = p => p.document.querySelector('#lob-step-room [data-pr="start"]');
  ok(!!(await waitFor(() => (readyBtn(H) && readyBtn(G)) ? true : null, 30000, 'ready btns')), '錦標賽分頁：兩邊名單卡都有「準備好了」鈕（與其他競速模式同位置）');
  ok(!H.document.querySelector('#t-start'), '設定面板不再有自己的開賽鈕');
  const sb0 = startBtn(H);
  ok(!!sb0 && sb0.textContent.includes('開賽') && sb0.disabled, '房主開始鈕是錦標賽開賽、未全員準備時 disabled');
  clickEl(G, readyBtn(G)); await sleep(900);
  ok(startBtn(H).disabled, '只有來賓準備 → 房主仍不能開賽');
  clickEl(H, readyBtn(H));
  const sb1 = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled) ? b : null; }, 30000, 'start enabled');
  ok(!!sb1, '全員準備 → 房主可開賽');
  clickEl(H, sb1);
  const t = await waitFor(() => (H.window.__PLAT_NET.tourn && G.window.__PLAT_NET.tourn) ? true : null, 30000, 'tourn both');
  ok(!!t, '開賽後錦標賽建立（雙邊同步）');
  const inR1 = await waitFor(() => (H.window.__PLAT_NET.inMatch === 'sudoku' && G.window.__PLAT_NET.inMatch === 'sudoku') ? true : null, 90000, 'round1 sudoku');
  ok(!!inR1, '第 1 局（數獨）雙邊進場');
  ok(H.errors.length === 0 && G.errors.length === 0, '零錯誤' + (H.errors.length + G.errors.length ? ': ' + (H.errors[0] || G.errors[0]) : ''));
  console.log('\nRESULT tournready: ' + pass + ' pass / ' + fail + ' fail' + (fails.length ? ' FAILS: ' + fails.join('；') : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
