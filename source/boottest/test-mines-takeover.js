// WAITFOR_CAP_MS 放寬理由（甲案後半）：本套件含 1.3MB bundle 的 jsdom 開機等待（600s 寫法），上限放寬至 240 秒防解析尖峰誤殺；其餘 in-flow 等待仍受此上限快速失敗。
const WAITFOR_CAP_MS = 240000;
// 地雷稽核修 [1]（高）：合作進行中房主消失 → 來賓接任房主續挖，盤面進度不可被洗掉
// 舊 bug：來賓 boardRef 整場停在開局快照（adoptCoopDo 只更新畫面 state），接任後第一個 processCoopAct 就用舊盤定序
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
let mock = require('./mockpeer.js');
mock = mock.replace('R.__msglog = R.__msglog || [];', 'R.__msglog = R.__msglog || []; R.__fullog = R.__fullog || []; try { R.__fullog.push(JSON.stringify(payload)); } catch (e) {}');
const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
if (!html.includes(marker)) { console.log('MARKER MISSING'); process.exit(2); }
html = html.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errs.push(stamp(String(m))));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
const dbg = (p) => p.window.__PLAT_HOOKS_mines.debug();
function clickCell(p, idx) { const el = p.document.querySelector('#view-mines [data-cell="' + idx + '"]'); if (!el) return false; el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return true; }

(async () => {
  const H = loadPage('H');
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 600000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET.code; }, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G');
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 600000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 90000, 'G in room');
  for (const p of [H, G]) { p.window.PLAT_show('mines'); await waitFor(() => !!p.window.__PLAT_HOOKS_mines, 300000, 'preboot'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="mines"]'));
  await waitFor(() => G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === 'mines', 30000, 'armed');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="coop"][data-hub-game="mines"]'));
  await sleep(600);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(700);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 90000, 'start en');
  if (en) clickEl(H, en);
  const playing = await waitFor(() => { const a = dbg(H), b = dbg(G); return a.mp.phase === 'playing' && b.mp.phase === 'playing' ? true : null; }, 90000, 'coop playing');
  check('合作開局雙邊 playing', !!playing);

  // 房主先挖一格、來賓再挖一格，建立可辨識的進度
  const safeH = dbg(H).layout.findIndex(v => !v);
  clickCell(H, safeH); await sleep(900);
  const after1 = dbg(G).openedSafe;
  check('房主挖後來賓有進度', after1 >= 1, 'G opened=' + after1);
  const safeG = dbg(H).layout.findIndex((v, i) => !v && dbg(H).cells[i] === 'h');
  clickCell(G, safeG); await sleep(900);
  const before = dbg(G).openedSafe;
  const cellsBefore = JSON.stringify(dbg(G).cells);
  const cellsBeforeArr = JSON.parse(cellsBefore); // 注意：cellsBefore 是 JSON 字串，逐格比對必須 parse 回陣列（曾直接索引字串字元，整段 keptDiffs 都是垃圾值）
  check('來賓挖後雙邊盤面一致', JSON.stringify(dbg(H).cells) === cellsBefore && before > after1, 'opened=' + before);

  // 房主離開（殼 host-leaving → 來賓殼接管 + 遊戲 migrate → 來賓升房主；mock 的 peer.destroy 不斷連線，不能用來模擬）
  const layH = dbg(H).layout.slice();
  { const layGd = dbg(G).layout; const ld = []; for (let i = 0; i < layH.length; i++) if (!!layH[i] !== !!layGd[i]) ld.push(i + ':H=' + layH[i] + '/G=' + layGd[i]); console.log('  layoutDiff before leave:', ld.length ? ld.join(' ') : '(identical)', 'seedH=' + dbg(H).seed, 'seedG=' + dbg(G).seed); }
  H.window.__PLAT_NOTIFY('player-leave');
  const promoted = await waitFor(() => dbg(G).mp.isHost === true ? true : null, 90000, 'G mines host');
  check('來賓接任地雷房主（migrate）', !!promoted, 'isHost=' + dbg(G).mp.isHost);
  check('接管後仍在對局中', dbg(G).mp.phase === 'playing', 'phase=' + dbg(G).mp.phase);
  check('接管後盤面未被洗掉', JSON.stringify(dbg(G).cells) === cellsBefore, 'opened=' + dbg(G).openedSafe + ' before=' + before);

  // 新房主續挖一格：挑「鄰居有雷的數字格」（只開 1 格），boardRef 缺哪些格就能精確枚舉
  const layG = dbg(G).layout;
  const W9 = 9;
  const hasMineNb = (i) => { const x = i % W9, y = Math.floor(i / W9); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W9 || ny >= 9) continue; if (layG[ny * W9 + nx]) return true; } return false; };
  let target = -1;
  for (let i = 0; i < layG.length; i++) { if (!layG[i] && !(layH && layH[i]) && dbg(G).cells[i] === 'h' && hasMineNb(i)) { target = i; break; } }
  if (target < 0) for (let i = 0; i < layG.length; i++) { if (!layG[i] && !(layH && layH[i]) && dbg(G).cells[i] === 'h') { target = i; break; } }
  check('找到續挖的安全格', target >= 0);
  if (target >= 0) {
    const logN = (G.window.__SHARED_REG__.__msglog || []).length;
    clickCell(G, target); await sleep(1000);
    const lg = (G.window.__SHARED_REG__.__msglog || []).slice(logN);
    console.log('  msglog after dig:', lg.map(m => m.type + '(' + String(m.from).slice(-4) + '->' + String(m.to).slice(-4) + ')').join(' '));
    const after2 = dbg(G).openedSafe;
    check('新房主續挖成功、進度只增不減', after2 > before && dbg(G).status === 'playing', 'opened ' + before + ' → ' + after2 + ' status=' + dbg(G).status);
    const keptDiffs = [];
    dbg(G).cells.forEach((c, i) => { if (cellsBeforeArr[i] === 'o' && c !== 'o') keptDiffs.push(i + '->' + c + '(lay=' + dbg(G).layout[i] + ')'); });
    if (keptDiffs.length) console.log('  keptDiffs:', keptDiffs.join(' '));
    const gained = [];
    dbg(G).cells.forEach((c, i) => { if (cellsBeforeArr[i] !== 'o' && c === 'o') gained.push(i); });
    const layDiffF = [];
    dbg(G).layout.forEach((v, i) => { if (!!v !== !!layH[i]) layDiffF.push(i + ':' + layH[i] + '->' + v); });
    console.log('  gained:', gained.join(' '), '| layoutDiffFinal:', layDiffF.join(' ') || '(none)', '| target was', target);
    const fl = (G.window.__SHARED_REG__.__fullog || []).map(s => { try { const o = JSON.parse(s); const d = o.__pd || o; return d && d.type ? d : null; } catch (e) { return null; } }).filter(Boolean);
    const dos = fl.filter(d => d.type === 'MINE_DO');
    console.log('  MINE_DO count=' + dos.length);
    dos.forEach((d, i) => { const open = (d.cells || '').split('').filter(c => c === 'o').length; console.log('   DO#' + i, 'kind=' + d.kind, 'idx=' + d.idx, 'opens=' + open, 'reloc=' + JSON.stringify(d.reloc || null), 'hit=' + d.hit, 'by=' + (d.byName || '')); });
    console.log('  cellsBefore opens=' + cellsBefore.split('').filter(c => c === 'o').length, 'layH mines=' + layH.filter(Boolean).length);
    check('先前已開格全部保留（MINE_DO 沒回退盤面）', keptDiffs.length === 0);
  }
  check('零錯誤（來賓端）', G.errors.length === 0, G.errors[0] || '');
  console.log('\n=== mines-takeover: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
