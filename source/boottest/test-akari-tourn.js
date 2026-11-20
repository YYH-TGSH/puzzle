// 美術燈錦標賽：alt-a 局序四款輪替、akari 回合進等待室→開打→完賽計分（嗅探 AKARI_FINISH/PROGRESS）、history/points
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(250); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } resume() { return Promise.resolve(); } }; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
function setSel(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value').set; setter.call(el, String(val)); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const dbg = (p) => p.window.__PLAT_HOOKS_akari.debug();
const cellEl = (p, i) => p.document.querySelector('#akari-root button[data-cell="' + i + '"]');
(async () => {
  const H = loadPage('H');
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 300000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET && H.window.__PLAT_NET.code; }, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G');
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 300000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 90000, 'G in room');
  for (const p of [H, G]) { p.window.PLAT_show('akari'); await waitFor(() => !!p.window.__PLAT_HOOKS_akari, 300000, 'preboot akari'); p.window.PLAT_show('lobby'); }
  // 錦標賽分頁：美術燈 7×7、3 局、alt-a
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  await sleep(800);
  setSel(H.window, H.document.querySelector('#ta-size'), 7);
  setSel(H.window, H.document.querySelector('#t-rounds'), 3);
  H.document.querySelector('#t-order').value = 'alt-a';
  check('錦標賽設定區有美術燈盤面', !!H.document.querySelector('#ta-size'));
  // 開賽走房間卡流程（比照 test-mines-tourn）：雙邊按準備 → 房主 [data-pr="start"] 亮起才點
  await waitFor(() => (H.document.querySelector('#lob-step-room [data-pr="ready"]') && G.document.querySelector('#lob-step-room [data-pr="ready"]')) ? true : null, 30000, 'both ready btns');
  for (const p of [H, G]) clickEl(p, p.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const tStart = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return (b && !b.disabled && b.textContent.includes('開賽')) ? b : null; }, 30000, 'tourn card start');
  check('房主開賽鈕亮起', !!tStart);
  clickEl(H, tStart);
  const t0 = await waitFor(() => H.window.__PLAT_NET.tourn ? H.window.__PLAT_NET.tourn : null, 30000, 'tourn created');
  check('錦標賽建立', !!t0);
  if (t0) check('局序四款輪替 [akari,sudoku,hashi]', JSON.stringify(t0.rounds) === JSON.stringify(['akari', 'sudoku', 'hashi']), JSON.stringify(t0.rounds));
  const gT = await waitFor(() => G.window.__PLAT_NET.tourn ? G.window.__PLAT_NET.tourn : null, 30000, 'guest tourn');
  check('來賓端同步 akari 設定', !!gT && gT.akari && gT.akari.sizeId === 7, JSON.stringify(gT && gT.akari));
  // 第 1 局 akari：雙邊進遊戲等待室
  const inRoom = await waitFor(() => dbg(H).players.length === 2 && dbg(G).players.length === 2 ? 1 : null, 90000, 'tourn waiting room');
  check('akari 局：雙邊進等待室、名單 2 人', !!inRoom);
  for (const p of [H, G]) { const b = [...p.document.querySelectorAll('#view-akari button')].find(x => (x.textContent || '').includes('準備好了')); if (b) clickEl(p, b); }
  await sleep(800);
  const startBtn = await waitFor(() => { const b = [...H.document.querySelectorAll('#view-akari button')].find(x => (x.textContent || '').includes('開始本局')); return b && !b.disabled ? b : null; }, 90000, 'host start enabled');
  check('akari 局：全員準備後房主可開始', !!startBtn);
  clickEl(H, startBtn);
  const playing = await waitFor(() => dbg(H).mp.phase === 'playing' && dbg(G).mp.phase === 'playing' ? 1 : null, 90000, 'tourn playing');
  check('akari 局：倒數後開打', !!playing);
  // 房主放一半、來賓完賽
  const solH = dbg(H).puzzle.solution;
  for (let k = 0; k < Math.floor(solH.length / 2); k++) { cellEl(H, solH[k]).click(); await sleep(40); }
  const solG = dbg(G).puzzle.solution;
  for (const i of solG) { if (dbg(G).cells[i] !== 1) { cellEl(G, i).click(); await sleep(35); } }
  await waitFor(() => dbg(G).myOutcome === 'finished', 30000, 'guest finished');
  // 房主結束本局（以目前進度結算）
  H.window.__PLAT_TOURN_FORCEEND();
  const back = await waitFor(() => { const t = H.window.__PLAT_NET.tourn; return t && t.history.length >= 1 ? t : null; }, 60000, 'round settled');
  check('akari 局結算回房間頁', !!back);
  if (back) {
    const hist = back.history[0];
    check('history.game=akari', hist && hist.game === 'akari', JSON.stringify(hist && hist.game));
    const pGuest = hist && hist.placements && hist.placements.find(r => r.name === '阿客');
    const pHost = hist && hist.placements && hist.placements.find(r => r.name === '阿主');
    check('來賓第 1 名 10 分且 finished', !!pGuest && pGuest.rank === 1 && pGuest.pts === 10 && pGuest.finished === true, JSON.stringify(pGuest));
    check('房主第 2 名 7 分、照進度', !!pHost && pHost.rank === 2 && pHost.pts === 7 && pHost.finished === false && pHost.progress > 0 && pHost.progress < 100, JSON.stringify(pHost));
    await sleep(1200);
    const pod = (H.document.querySelector('#plat-podium') || {}).textContent || '';
    check('頒獎台標籤「💡 美術燈競速」', pod.includes('美術燈競速'), pod.slice(0, 80));
  }
  check('零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  console.log('==== AKARI-TOURN: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
