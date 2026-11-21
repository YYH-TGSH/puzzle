// 錦標賽卡片式選關（v1.74.0 項4）：局數段位、每關一卡四款一點即換、改局數保留既有選擇、
// 四款輪替預設鈕、來賓唯讀同步、開賽賽程＝卡片選擇
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('/home/hatch/workspace/boottest/mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, 60000); const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(200); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
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
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const pick = (p) => p.window.__PLAT_NET.hub && p.window.__PLAT_NET.hub.tournPick;

(async () => {
  const H = loadPage('H');
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 60000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET && H.window.__PLAT_NET.code; }, 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G');
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 60000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 60000, 'G in room');
  // 房主切錦標賽分頁
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  await waitFor(() => H.document.querySelector('#t-cards') && H.document.querySelectorAll('#t-cards [data-tpick]').length === 20, 30000, 'host cards');
  check('房主：5 關卡片渲染（20 顆選項）', true);
  check('預設賽程＝四款輪替 5 局（數獨起頭）', JSON.stringify(pick(H).rounds) === JSON.stringify(['sudoku', 'hashi', 'mines', 'akari', 'sudoku']) && pick(H).count === 5, JSON.stringify(pick(H)));
  // 來賓同步＋唯讀
  clickEl(G, G.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  const gSync = await waitFor(() => pick(G) && pick(G).rounds && pick(G).rounds.length === 5 ? 1 : null, 30000, 'guest pick sync');
  check('來賓收到賽程同步', !!gSync, JSON.stringify(pick(G)));
  const guestCards = await waitFor(() => { const el = G.document.querySelector('#t-cards-guest'); return el && el.style.display !== 'none' && el.querySelectorAll('[data-tpick]').length === 20 ? el : null; }, 30000, 'guest cards visible');
  check('來賓：唯讀賽程卡片可見', !!guestCards);
  check('來賓：卡片鈕全 disabled', !!guestCards && [...guestCards.querySelectorAll('[data-tpick]')].every(b => b.disabled));
  // 房主改第 2 關為美術燈
  clickEl(H, H.document.querySelector('#t-cards [data-tpick="1:akari"]'));
  await sleep(300);
  check('房主點卡換關：第 2 關 → 美術燈', pick(H).rounds[1] === 'akari', JSON.stringify(pick(H).rounds));
  const gSync2 = await waitFor(() => pick(G).rounds[1] === 'akari' ? 1 : null, 15000, 'guest sync round2');
  check('來賓即時同步第 2 關變更', !!gSync2);
  // 改局數：5→3 保留前綴；3→7 輪替補齊
  clickEl(H, H.document.querySelector('[data-tcount="3"]'));
  await sleep(300);
  check('局數 5→3：前綴保留、尾端截斷', pick(H).count === 3 && JSON.stringify(pick(H).rounds) === JSON.stringify(['sudoku', 'akari', 'mines']), JSON.stringify(pick(H)));
  clickEl(H, H.document.querySelector('[data-tcount="7"]'));
  await sleep(300);
  check('局數 3→7：新增關以輪替接續補齊', pick(H).count === 7 && JSON.stringify(pick(H).rounds) === JSON.stringify(['sudoku', 'akari', 'mines', 'akari', 'sudoku', 'hashi', 'mines']), JSON.stringify(pick(H)));
  // 預設鈕：回到四款輪替（數獨起頭、目前局數）
  clickEl(H, H.document.querySelector('#t-rotate'));
  await sleep(300);
  check('四款輪替預設鈕：賽程回預設排列', JSON.stringify(pick(H).rounds) === JSON.stringify(['sudoku', 'hashi', 'mines', 'akari', 'sudoku', 'hashi', 'mines']), JSON.stringify(pick(H).rounds));
  // 來賓點卡片無效（disabled＋房主權威）
  const gChip = G.document.querySelector('#t-cards-guest [data-tpick="0:mines"]');
  if (gChip) { gChip.click(); await sleep(300); }
  check('來賓點卡不改賽程', pick(G).rounds[0] === 'sudoku' && pick(H).rounds[0] === 'sudoku');
  // 設定自訂賽程 [數橋, 美術燈, 數獨] 並開賽（局數 3）
  clickEl(H, H.document.querySelector('[data-tcount="3"]')); await sleep(200);
  clickEl(H, H.document.querySelector('#t-cards [data-tpick="0:hashi"]')); await sleep(200);
  clickEl(H, H.document.querySelector('#t-cards [data-tpick="1:akari"]')); await sleep(200);
  clickEl(H, H.document.querySelector('#t-cards [data-tpick="2:sudoku"]')); await sleep(300);
  check('自訂賽程成形 [數橋,美術燈,數獨]', JSON.stringify(pick(H).rounds) === JSON.stringify(['hashi', 'akari', 'sudoku']), JSON.stringify(pick(H).rounds));
  for (const p of [H, G]) { const rb = p.document.querySelector('#lob-step-room [data-pr="ready"]'); if (rb && !rb.textContent.includes('已準備')) clickEl(p, rb); }
  const startBtn = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return b && !b.disabled ? b : null; }, 30000, 'start enabled');
  clickEl(H, startBtn);
  const tIn = await waitFor(() => (H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.inMatch === 'hashi') ? 1 : null, 60000, 'round1 hashi');
  check('開賽：第 1 關＝卡片選的數橋', !!tIn);
  const t = H.window.__PLAT_NET.tourn;
  check('賽程帶入錦標賽狀態（3 局、自訂順序）', !!t && t.totalRounds === 3 && JSON.stringify(t.rounds) === JSON.stringify(['hashi', 'akari', 'sudoku']), t && JSON.stringify(t.rounds));
  const gIn = await waitFor(() => (G.window.__PLAT_NET.tourn && G.window.__PLAT_NET.inMatch === 'hashi') ? 1 : null, 60000, 'G round1');
  check('來賓進第 1 關數橋', !!gIn);
  check('H 頁零錯誤', H.errors.length === 0, H.errors[0] || '');
  check('G 頁零錯誤', G.errors.length === 0, G.errors[0] || '');
  console.log('==== TOURN-CARDS: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
