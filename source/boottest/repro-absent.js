// 複現（使用者 2026-10-24）：3 人錦標賽，C 未進場，AB 完賽後卡住不結算
// C 的頁面留在房間（殼活著），但遊戲 hook 被封鎖＝從未 enter 任何一局（模擬未到）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
let mock = require('./mockpeer.js');
mock = mock.replace("R.__msglog = R.__msglog || [];", "R.__msglog = R.__msglog || []; R.__fullog = R.__fullog || [];")
           .replace("if (pl && pl.type) R.__msglog.push({", "if (pl && pl.type) { try { R.__fullog.push(pl); } catch (e) {} R.__msglog.push({")
           .replace(": undefined }); } } catch (e) {}", ": undefined }); } } } catch (e) {}");
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.localStorage.setItem('sudoku_input_mode', 'number'); w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
function sudokuSave(p) { const ls = p.window.localStorage; for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.indexOf('sudoku_prog_') === 0) { try { const v = JSON.parse(ls.getItem(k)); if (v && Array.isArray(v.d) && v.d.length) return v; } catch (e) {} } } return null; }
function getSolution() { const log = SHARED_REG.__fullog || []; for (let i = log.length - 1; i >= 0; i--) { const d = log[i]; if (d && d.data) { if (d.data.solutionGrid) return d.data.solutionGrid; if (d.data.levelData && d.data.levelData.solutionGrid) return d.data.levelData.solutionGrid; } } return null; }
async function fillAll(p, tag) {
  const sol = getSolution();
  for (let passN = 0; passN < 4; passN++) {
    const save = sudokuSave(p); if (!save) break;
    const wrong = save.d.filter(c => !c.isGiven && String(c.value) !== String(sol[c.y][c.x]));
    if (!wrong.length) break;
    for (const c of wrong) {
      const view = p.document.querySelector('#view-sudoku');
      const pad = [...view.querySelectorAll('button')].find(b => (b.textContent || '').trim() === String(sol[c.y][c.x]));
      clickEl(p, pad); await sleep(110);
      clickEl(p, view.querySelector('g[id="cell-' + c.id + '"]'));
      await sleep(60);
    }
    await sleep(400);
  }
  console.log(tag + ' solved');
}
async function joinAs(p, name, code) {
  p.window.localStorage.setItem('plat_name', name);
  if (code) { click(p, '#lob-go-join'); } else { click(p, '#lob-go-create'); }
  await waitFor(() => p.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, p.label + ' nick');
  p.document.querySelector('#lob-name').value = name;
  if (code) p.document.querySelector('#lob-code').value = code;
  click(p, '#lob-confirm');
  await waitFor(() => hubRoom(p), 60000, p.label + ' room');
}
async function main() {
  const H = loadPage('H'); const G = loadPage('G'); const C = loadPage('C');
  for (const p of [H, G, C]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' ready'); if (!ok) { console.log('NOT READY', p.label); process.exit(2); } }
  await joinAs(H, '房主甲', null);
  const code = H.window.__PLAT_NET.code;
  await joinAs(G, '來賓乙', code);
  await joinAs(C, '缺席丙', code);
  await waitFor(() => H.window.__PLAT_NET.roster.length >= 3, 30000, 'roster3');
  console.log('roster 3 ready, code', code);
  // C 未到：進房後人就消失（關頁）——從未 enter 任何一局、無進度；房主端 disc 旗標（遊戲連線）不存在，舊判定永遠等不到他
  try { C.window.close(); } catch (e) {}
  await sleep(2000);
  // 開錦標賽 3 局 數獨先
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  await waitFor(() => H.document.querySelector('#lob-tourn-setup'), 30000, 'tourn setup');
  const set = (id, v) => { const el = H.document.querySelector(id); if (el) { el.value = v; el.dispatchEvent(new H.window.Event('change', { bubbles: true })); } };
  set('#t-rounds', '3'); set('#t-order', 'alt-s'); set('#ts-size', '9'); set('#ts-diff', 'easy'); set('#ts-wtime', '0');
  click(H, '#t-start');
  const r1 = await waitFor(() => (H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.inMatch === 'sudoku') ? true : null, 90000, 'R1 sudoku');
  check('R1 進數獨', !!r1);
  const t0 = H.window.__PLAT_NET.tourn;
  console.log('entrants:', JSON.stringify(t0.entrants.map(e => e.name)));
  // AB 準備＋開始
  for (const p of [H, G]) { const rb = await waitFor(() => [...p.document.querySelectorAll('#view-sudoku button')].find(x => (x.textContent || '').trim() === '✋ 準備好了') || null, 45000, p.label + ' ready btn'); clickEl(p, rb); await sleep(600); }
  // 缺人時開賽閘門要等 60 秒（tournWaited）才放行——這是既有設計，不是 bug
  const sb = await waitFor(() => { const b = [...H.document.querySelectorAll('#view-sudoku button')].find(x => (x.textContent || '').includes('開始本局')); return (b && !b.disabled) ? b : null; }, 100000, 'start enabled');
  check('R1 房主可開始（等滿 60 秒後）', !!sb);
  clickEl(H, sb);
  await waitFor(() => { const b = [...H.document.querySelectorAll('#view-sudoku button')].find(x => (x.textContent || '').includes('準備好了')); return !b ? true : null; }, 45000, 'playing');
  await sleep(6500);
  await fillAll(G, 'G');
  await fillAll(H, 'H');
  // 關鍵斷言：不等 C，R1 也要結算
  const st = await waitFor(() => { const t = H.window.__PLAT_NET.tourn; return (t && t.phase === 'standings') ? t : null; }, 60000, 'R1 standings (absent C)');
  check('AB 完賽即結算（不等待未到的 C）', !!st);
  if (st) {
    const h1 = st.history[0];
    console.log('R1 placements:', JSON.stringify(h1.placements.map(p => [p.name, p.rank, p.pts])), 'totals:', JSON.stringify(st.totals));
    const cPl = h1.placements.find(p => p.name === '缺席丙');
    check('C 以最後一名結算（進度 0）', !!cPl && cPl.rank === 3 && !cPl.finished, JSON.stringify(cPl));
    check('AB 名次正確（來賓先解完=第1）', h1.placements[0].name === '來賓乙' && h1.placements[1].name === '房主甲');
  }
  console.log('H errors:', H.errors.length, H.errors.slice(0, 3));
  console.log('G errors:', G.errors.length, G.errors.slice(0, 3));
  console.log('C errors:', C.errors.length, C.errors.slice(0, 3));
  console.log('RESULT: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('FATAL', e); process.exit(2); });
