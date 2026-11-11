// v1.62.0 PlatSave 存檔層驗收（技能對照改造第 1 項・save-systems）：
// A) 行為矩陣：envelope 寫入形狀、roundtrip、無值 fallback、v0 舊格式相容、壞資料（損壞 JSON／錯形狀／過期）自癒清除、純量 safe 存取、註冊 validator 生效（含 sudoku classic 早於 shell 的登記時序）
// B) v0 fixture 消費端相容：三款以 v1.61.3 舊格式種入的每日紀錄/連勝，開主畫面後不被清、語意不變
// C) localStorage 被封鎖（getter throw）環境：殼 shim 兜底、三款開局不崩
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name + (extra ? ' — ' + extra : '')); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(100); } console.log('  (timeout: ' + label + ')'); return null; }
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const errors = [];
function loadPage(label, opts) {
  opts = opts || {};
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String(e.detail && e.detail.message || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(label + ': ' + m); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.__SHARED_REG__ = {}; w.scrollTo = () => {};
      w.addEventListener('error', ev => { if (ev.message && !/Script error/.test(ev.message)) errors.push(label + ': ' + ev.message); });
      if (opts.blockStorage) { try { Object.defineProperty(w, 'localStorage', { get() { throw new Error('SecurityError: The operation is insecure.'); } }); } catch (e) {} }
      if (opts.seed) { try { opts.seed(w.localStorage); } catch (e) { errors.push(label + ' seed: ' + e.message); } }
    } });
  return { window: dom.window, document: dom.window.document, label };
}
function dataOf(w, key) { const raw = w.localStorage.getItem(key); if (raw === null) return null; const p = JSON.parse(raw); return (p && p.__psv === 1 && 'data' in p) ? p.data : p; }

(async () => {
  // ---------- A) 行為矩陣 ----------
  const P = loadPage('A');
  const w = P.window;
  await waitFor(() => typeof w.PLAT_show === 'function' && w.PlatSave, 90000, 'A shell');
  const PS = w.PlatSave;
  check('A1 PlatSave API 齊全', !!PS && ['read', 'write', 'getStr', 'setStr', 'remove', 'register'].every(k => typeof PS[k] === 'function'));
  PS.write('test_ps_obj', { a: 1, b: [1, 2, 3] });
  const rawEnv = JSON.parse(w.localStorage.getItem('test_ps_obj'));
  check('A2 寫入為 envelope 形狀', !!rawEnv && rawEnv.__psv === 1 && typeof rawEnv.t === 'number' && rawEnv.data && rawEnv.data.a === 1);
  const rt = PS.read('test_ps_obj', { fallback: null });
  check('A3 roundtrip 一致', !!rt && rt.a === 1 && Array.isArray(rt.b) && rt.b.length === 3);
  check('A4 無值回 fallback', PS.read('test_ps_missing', { fallback: 'FB' }) === 'FB');
  w.localStorage.setItem('test_ps_v0', JSON.stringify({ x: 9 }));
  check('A5 v0 舊格式（無 envelope）照讀', (PS.read('test_ps_v0', { fallback: null }) || {}).x === 9);
  w.localStorage.setItem('test_ps_bad', '{broken json');
  check('A6 損壞 JSON → fallback 且清除自癒', PS.read('test_ps_bad', { fallback: 'FB' }) === 'FB' && w.localStorage.getItem('test_ps_bad') === null);
  // 註冊 validator（sudoku classic 先行登記＋DCL 補登記 → 殼中央表也要有效）
  w.localStorage.setItem('sudoku_daily_streak', JSON.stringify({ nope: true }));
  check('A7 錯形狀（streak 缺 count）→ fallback 且清除', JSON.stringify(PS.read('sudoku_daily_streak', { fallback: { count: 0, lastDate: '' } })) === '{"count":0,"lastDate":""}' && w.localStorage.getItem('sudoku_daily_streak') === null);
  w.localStorage.setItem('sudoku_prog_TST1_u1', JSON.stringify({ d: [{ x: 0, y: 0 }], t: Date.now(), sid: 's1' }));
  const progOk = PS.read('sudoku_prog_TST1_u1', { fallback: null });
  check('A8 v0 合法 sudoku_prog 照讀（語意不變）', !!progOk && Array.isArray(progOk.d) && progOk.sid === 's1');
  w.localStorage.setItem('sudoku_prog_TST2_u1', JSON.stringify({ d: [{ x: 0, y: 0 }], t: Date.now() - 25 * 3600 * 1000, sid: 's2' }));
  check('A9 過期 sudoku_prog（>24h）→ null 且清除', PS.read('sudoku_prog_TST2_u1', { fallback: null }) === null && w.localStorage.getItem('sudoku_prog_TST2_u1') === null);
  w.localStorage.setItem('sudoku_prog_TST3_u1', JSON.stringify({ d: 'not-an-array', t: Date.now() }));
  check('A10 錯形狀 sudoku_prog（d 非陣列）→ null 且清除', PS.read('sudoku_prog_TST3_u1', { fallback: null }) === null && w.localStorage.getItem('sudoku_prog_TST3_u1') === null);
  PS.write('sudoku_daily_records', { '2026-11-10': 321 });
  const envRec = JSON.parse(w.localStorage.getItem('sudoku_daily_records'));
  check('A11 envelope 內 data 不被 validator 誤判（t 在殼層）', envRec.__psv === 1 && envRec.data['2026-11-10'] === 321 && (PS.read('sudoku_daily_records', { fallback: {} })['2026-11-10'] === 321));
  PS.setStr('test_ps_scalar', 'hello');
  check('A12 純量裸值存取（不包 envelope）', w.localStorage.getItem('test_ps_scalar') === 'hello' && PS.getStr('test_ps_scalar', '') === 'hello' && PS.getStr('test_ps_none', 'dflt') === 'dflt');
  PS.remove('test_ps_scalar');
  check('A13 remove 生效', w.localStorage.getItem('test_ps_scalar') === null);

  // ---------- B) v0 fixture 消費端相容 ----------
  const seedB = (ls) => {
    ls.setItem('sudoku_daily_records', JSON.stringify({ '2026-11-10': 321 }));
    ls.setItem('sudoku_daily_streak', JSON.stringify({ count: 3, lastDate: '2026-11-10' }));
    ls.setItem('hashi_daily_map', JSON.stringify({ v: 1, days: { '2026-11-10': { time: 222 } } }));
    ls.setItem('hashi_daily_streak', JSON.stringify({ count: 2, lastDate: '2026-11-10' }));
    ls.setItem('mines_daily_records', JSON.stringify({ '2026-11-10': 111 }));
    ls.setItem('mines_daily_streak', JSON.stringify({ last: '2026-11-10', count: 4 }));
  };
  const B = loadPage('B', { seed: seedB });
  const bw = B.window;
  await waitFor(() => typeof bw.PLAT_show === 'function' && bw.PlatDock, 90000, 'B shell');
  for (const g of ['sudoku', 'hashi', 'mines']) {
    bw.PLAT_show(g);
    const view = await waitFor(() => { const v = bw.document.querySelector('#view-' + g); return (v && v.querySelectorAll('button').length > 2) ? v : null; }, 60000, 'B ' + g + ' home');
    check('B ' + g + ' 主畫面渲染（v0 種子在場）', !!view);
    bw.PLAT_show('hub');
    await sleep(300);
  }
  const sRec = dataOf(bw, 'sudoku_daily_records'), sStr = dataOf(bw, 'sudoku_daily_streak');
  check('B 數獨 v0 每日紀錄/連勝語意不變', !!sRec && sRec['2026-11-10'] === 321 && !!sStr && sStr.count === 3 && sStr.lastDate === '2026-11-10');
  const hMap = dataOf(bw, 'hashi_daily_map'), hStr = dataOf(bw, 'hashi_daily_streak');
  check('B 數橋 v0 每日 map/連勝語意不變', !!hMap && hMap.days && hMap.days['2026-11-10'] && hMap.days['2026-11-10'].time === 222 && !!hStr && hStr.count === 2);
  const mRec = dataOf(bw, 'mines_daily_records'), mStr = dataOf(bw, 'mines_daily_streak');
  check('B 地雷 v0 每日紀錄/連勝語意不變', !!mRec && mRec['2026-11-10'] === 111 && !!mStr && mStr.count === 4 && mStr.last === '2026-11-10');

  // ---------- C) 儲存被封鎖 ----------
  const C = loadPage('C', { blockStorage: true });
  const cw = C.window;
  const shellOk = await waitFor(() => typeof cw.PLAT_show === 'function', 90000, 'C shell');
  check('C1 封鎖環境殼照常啟動（shim 兜底）', !!shellOk);
  let cGames = 0;
  for (const g of ['sudoku', 'hashi', 'mines']) {
    try { cw.PLAT_show(g); } catch (e) {}
    const view = await waitFor(() => { const v = cw.document.querySelector('#view-' + g); return (v && v.querySelectorAll('button').length > 2) ? v : null; }, 60000, 'C ' + g);
    if (view) cGames++;
    try { cw.PLAT_show('hub'); } catch (e) {}
    await sleep(300);
  }
  check('C2 封鎖環境三款主畫面皆渲染不崩', cGames === 3, 'rendered ' + cGames + '/3');
  let threw = false;
  try { cw.PlatSave.write('x', { a: 1 }); cw.PlatSave.read('x', { fallback: null }); cw.PlatSave.setStr('y', '1'); cw.PlatSave.getStr('y', ''); } catch (e) { threw = true; }
  check('C3 封鎖環境 PlatSave 全 API 不 throw', !threw);

  check('全程無未捕捉錯誤', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log('\n=== test-platsave: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
