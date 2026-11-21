// 回歸（v1.49.0）：聊天室表情符號鍵盤（聊天室朋友建議新增）
// 😊 開面板 → 點表情插入輸入框 → 送出 → 對方聊天室看得到。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0; const fails = [];
function ok(cond, label, extra) { if (cond) { pass++; console.log('✅', label); } else { fail++; fails.push(label); console.log('❌', label, extra !== undefined ? '— ' + extra : ''); } }
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
  H.window.PLAT_show('lobby');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '阿主'; clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; }, 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  G.window.PLAT_show('lobby');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '阿客';
  const ci = G.document.querySelector('#lob-code'); if (ci) ci.value = code;
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => (H.window.__PLAT_NET.roster.length >= 2 && G.window.__PLAT_NET.roster.length >= 2) ? true : null, 60000, 'roster2');
  // 房主開聊天室
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="dock-chat"]'));
  const chatOpen = await waitFor(() => H.document.querySelector('#plat-chat').style.display === 'block' ? true : null, 15000, 'chat open');
  ok(!!chatOpen, '聊天室開啟');
  ok(!!H.document.querySelector('#plat-chat-emoji'), '輸入列有 😊 表情鈕');
  clickEl(H, H.document.querySelector('#plat-chat-emoji'));
  await sleep(300);
  const panel = H.document.querySelector('#plat-chat-emojis');
  ok(panel && panel.style.display === 'grid' && panel.querySelectorAll('.plat-emoji-btn').length >= 40, '表情面板展開（≥40 個表情）', panel ? String(panel.querySelectorAll('.plat-emoji-btn').length) : 'no panel');
  const fireBtn = [...panel.querySelectorAll('.plat-emoji-btn')].find(b => b.textContent === '🔥');
  clickEl(H, fireBtn);
  const trophyBtn = [...panel.querySelectorAll('.plat-emoji-btn')].find(b => b.textContent === '🏆');
  clickEl(H, trophyBtn);
  await sleep(200);
  const inp = H.document.querySelector('#plat-chat-input');
  ok(inp.value.includes('🔥') && inp.value.includes('🏆'), '點表情插入輸入框（可連點）', inp.value);
  inp.value = '打得好' + inp.value; inp.dispatchEvent(new H.window.Event('input', { bubbles: true }));
  clickEl(H, H.document.querySelector('#plat-chat-send'));
  const got = await waitFor(() => G.document.querySelector('#plat-chat-list') && G.document.querySelector('#plat-chat-list').textContent.includes('🔥') ? true : null, 15000, 'guest sees msg');
  ok(!!got, '來賓聊天室收到帶表情的訊息');
  ok(H.errors.length === 0 && G.errors.length === 0, '零錯誤', (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  console.log('\nRESULT chat-emoji: ' + pass + ' pass / ' + fail + ' fail' + (fails.length ? ' FAILS: ' + fails.join('；') : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
