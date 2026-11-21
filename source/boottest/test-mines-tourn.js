// WAITFOR_CAP_MS 放寬理由（甲案後半）：本套件含 1.3MB bundle 的 jsdom 開機等待（600s 寫法），上限放寬至 240 秒防解析尖峰誤殺；其餘 in-flow 等待仍受此上限快速失敗。
const WAITFOR_CAP_MS = 240000;
// 踩地雷第三段（錦標賽輪替）驗證：
// - 出局順序 alt-m → 局序 [mines, akari, sudoku]（v1.68 起四款循環：數獨→數橋→地雷→美術燈）
// - 地雷局真打：來賓踩雷出局、房主完賽 → 結算名次/分數：房主 10 分、來賓 7 分且 progress=出局當時進度（不是 100）
// - 美術燈/數獨局用房主「結束本局」帶過 → 全程結束、總冠軍正確、頒獎台標籤是「💣 踩地雷競速」
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
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
const btnByText = (p, scope, txt) => [...scope.querySelectorAll('button')].find(b => (b.textContent || '').includes(txt));
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const dbgM = (p) => p.window.__PLAT_HOOKS_mines.debug();
const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block'; };

(async () => {
  const H = loadPage('H'), G = loadPage('G');
  for (const p of [H, G]) await waitFor(() => typeof p.window.PLAT_show === 'function' && p.window.PlatDock, 600000, p.label + ' shell');
  // 建房/入房（比照 makeRoom）
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
  for (const p of [H, G]) { p.window.PLAT_show('mines'); await waitFor(() => !!p.window.__PLAT_HOOKS_mines, 300000, 'preboot mines'); p.window.PLAT_show('lobby'); }

  // 開錦標賽：3 局、地雷先
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  await waitFor(() => H.document.querySelector('#lob-tourn-setup'), 30000, 'tourn setup');
  H.document.querySelector('#t-rounds').value = '3';
  H.document.querySelector('#t-order').value = 'alt-m';
  await waitFor(() => (H.document.querySelector('#lob-step-room [data-pr="ready"]') && G.document.querySelector('#lob-step-room [data-pr="ready"]')) ? true : null, 30000, 'both ready btns');
  for (const p of [H, G]) clickEl(p, p.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const tCardStart = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return (b && !b.disabled && b.textContent.includes('開賽')) ? b : null; }, 30000, 'tourn card start');
  clickEl(H, tCardStart);
  const t0 = await waitFor(() => H.window.__PLAT_NET.tourn, 30000, 'tourn created');
  check('錦標賽建立', !!t0);
  check('局序四款輪替 [mines,akari,sudoku]', JSON.stringify(H.window.__PLAT_NET.tourn.rounds) === JSON.stringify(['mines', 'akari', 'sudoku']), JSON.stringify(H.window.__PLAT_NET.tourn.rounds));
  const gTourn = await waitFor(() => (G.window.__PLAT_NET.tourn && G.window.__PLAT_NET.tourn.mines) ? G.window.__PLAT_NET.tourn : null, 30000, 'guest tourn cfg');
  check('來賓端也有 mines 設定（tourn cfg）', !!gTourn && gTourn.mines.sizeId === 9, JSON.stringify(gTourn && gTourn.mines));

  // ===== 第 1 局：踩地雷（真打） =====
  await waitFor(() => H.window.__PLAT_NET.inMatch === 'mines' && G.window.__PLAT_NET.inMatch === 'mines', 120000, 'round1 inMatch');
  await waitFor(() => dbgM(H).players.length === 2 && dbgM(G).players.length === 2, 60000, 'round1 rosters');
  check('地雷局：雙邊進等待室、名單 2 人', dbgM(H).players.length === 2);
  const hv = H.document.querySelector('#view-mines'), gv = G.document.querySelector('#view-mines');
  clickEl(G, btnByText(G, gv, '準備好了')); await sleep(600);
  clickEl(H, btnByText(H, hv, '準備好了')); await sleep(600);
  const startBtn = await waitFor(() => { const b = btnByText(H, hv, '開始本局'); return b && !b.disabled ? b : null; }, 30000, 'mines tourn start enabled');
  check('地雷局：全員準備後房主可開始', !!startBtn);
  clickEl(H, startBtn);
  const playing = await waitFor(() => dbgM(H).mp.phase === 'playing' && dbgM(G).mp.phase === 'playing' ? true : null, 60000, 'round1 playing');
  check('地雷局：倒數後開打', !!playing);
  // 來賓先挖幾格安全格再踩雷
  let gl = dbgM(G).layout.slice();
  clickEl(G, G.document.querySelector('#view-mines [data-cell="' + gl.findIndex(v => !v) + '"]')); await sleep(700);
  gl = dbgM(G).layout.slice();
  const more = gl.map((v, i) => (!v && dbgM(G).cells[i] === 'h') ? i : -1).filter(i => i >= 0).slice(0, 2);
  for (const i of more) { clickEl(G, G.document.querySelector('#view-mines [data-cell="' + i + '"]')); await sleep(400); }
  const gProg = dbgM(G).progress;
  const gMine1 = gl.findIndex(v => v);
  clickEl(G, G.document.querySelector('#view-mines [data-cell="' + gMine1 + '"]')); await sleep(900);
  // 容錯（雷數 10%＝1 次）：第一顆記 ✗ 續玩，第二顆才出局
  check('地雷局：來賓第一顆雷被容錯（記 ✗、未出局）', dbgM(G).status !== 'lost' && dbgM(G).cells[gMine1] === 'x', 'cell=' + dbgM(G).cells[gMine1] + ' status=' + dbgM(G).status);
  const gMine2 = dbgM(G).layout.findIndex((v, i) => v && dbgM(G).cells[i] === 'h');
  clickEl(G, G.document.querySelector('#view-mines [data-cell="' + gMine2 + '"]')); await sleep(900);
  check('地雷局：來賓第二顆雷出局', dbgM(G).status === 'lost' && gProg > 0 && gProg < 1, 'prog=' + gProg);
  // 房主解完
  let guard = 0;
  while (guard++ < 90) { const d = dbgM(H); if (d.status === 'won') break; const nx = d.layout.findIndex((v, i) => !v && d.cells[i] === 'h'); if (nx < 0) break; clickEl(H, H.document.querySelector('#view-mines [data-cell="' + nx + '"]')); await sleep(200); }
  check('地雷局：房主完賽', dbgM(H).status === 'won');
  const back1 = await waitFor(() => hubRoom(H) && H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.tourn.history.length === 1 ? true : null, 90000, 'round1 settled');
  check('地雷局：結算回房間頁', !!back1);
  const hist = H.window.__PLAT_NET.tourn.history[0];
  check('地雷局：history.game=mines', hist && hist.game === 'mines');
  const pHost = hist && hist.placements.find(x => x.name === '阿主'), pGuest = hist && hist.placements.find(x => x.name === '阿客');
  check('地雷局：房主第 1 名 10 分且 finished', !!pHost && pHost.rank === 1 && pHost.pts === 10 && pHost.finished === true, JSON.stringify(pHost));
  check('地雷局：來賓第 2 名 7 分、出局照進度（非 100）', !!pGuest && pGuest.rank === 2 && pGuest.pts === 7 && pGuest.finished === false && pGuest.progress === Math.round(gProg * 100) && pGuest.progress < 100, JSON.stringify(pGuest) + ' expectProg=' + Math.round(gProg * 100));
  await sleep(1200);
  const podTxt = (H.document.querySelector('#plat-podium') || { textContent: '' }).textContent;
  check('地雷局：頒獎台標籤「💣 踩地雷競速」', podTxt.includes('踩地雷競速'), podTxt.slice(0, 60));

  // ===== 第 2、3 局：美術燈/數獨（房主結束本局帶過；v1.68 起四款輪替，alt-m 三局＝地雷→美術燈→數獨） =====
  const seq = ['akari', 'sudoku'];
  for (let r = 0; r < 2; r++) {
    const g = seq[r];
    const nb = await waitFor(() => { const b = H.document.querySelector('#t-next'); return b && !b.disabled ? b : null; }, 60000, 't-next ' + g);
    clickEl(H, nb);
    const inR = await waitFor(() => H.window.__PLAT_NET.inMatch === g && G.window.__PLAT_NET.inMatch === g ? true : null, 120000, 'inMatch ' + g);
    check('第 ' + (r + 2) + ' 局進場：' + g, !!inR);
    await sleep(3000);
    if (g === 'sudoku') { // 數獨走它自己的退出選單（比照 repro-tourn-full）
      const view = H.document.querySelector('#view-sudoku');
      clickEl(H, [...view.querySelectorAll('button')].find(b => (b.textContent || '').includes('退出')));
      await sleep(800);
      clickEl(H, [...H.document.querySelectorAll('button')].find(b => (b.textContent || '').includes('結束本局')));
    } else {
      H.window.__PLAT_TOURN_FORCEEND();
    }
    const back = await waitFor(() => hubRoom(H) && H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.tourn.history.length === r + 2 ? true : null, 90000, 'settled ' + g);
    check('第 ' + (r + 2) + ' 局結算（' + g + '）', !!back, 'hist=' + (H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.tourn.history.length));
  }

  // ===== 全程結束 =====
  const ended = await waitFor(() => { const t = H.window.__PLAT_NET.tourn; return t && t.phase === 'ended' ? true : null; }, 60000, 'tourn ended');
  check('錦標賽結束 phase=ended', !!ended);
  const tEnd = H.window.__PLAT_NET.tourn;
  check('總冠軍是房主阿主', !!tEnd.champion && tEnd.champion.name === '阿主', JSON.stringify(tEnd.champion));
  const totals = tEnd.totals, uids = Object.keys(totals);
  check('總分房主 > 來賓', uids.length === 2 && totals[uids[0]] !== totals[uids[1]] && Math.max(totals[uids[0]], totals[uids[1]]) === 30, JSON.stringify(totals));
  const gEnded = await waitFor(() => (G.window.__PLAT_NET.tourn && G.window.__PLAT_NET.tourn.phase === 'ended') ? true : null, 60000, 'guest ended');
  check('來賓端同步 ended', !!gEnded, 'G phase=' + (G.window.__PLAT_NET.tourn && G.window.__PLAT_NET.tourn.phase));
  check('零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  console.log('\n=== mines-tourn: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
