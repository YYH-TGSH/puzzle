// WAITFOR_CAP_MS 放寬理由（甲案後半）：本套件含 1.3MB bundle 的 jsdom 開機等待（600s 寫法），上限放寬至 240 秒防解析尖峰誤殺；其餘 in-flow 等待仍受此上限快速失敗。
const WAITFOR_CAP_MS = 240000;
// 踩地雷第二段（多人）驗證：
// 競速：雙頁同題面、進度廣播、踩雷出局照進度排、完賽自動上帝面板、PlatResults 正式名次、god 不洩雷
// 合作：房主定序、雙邊盤面一致、踩雷全隊敗北（顯示是誰踩的）
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
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const dbg = (p) => p.window.__PLAT_HOOKS_mines.debug();
const platStatus = (p) => { const el = p.document.querySelector('#plat-status-body'); return el ? el.textContent : ''; };

async function makeRoom(mode) {
  const H = loadPage('H'); H.label = 'H';
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 600000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' && H.window.__PLAT_NET && H.window.__PLAT_NET.code; }, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G'); G.label = 'G';
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 600000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 90000, 'G in room');
  for (const p of [H, G]) {
    p.window.PLAT_show('mines');
    await waitFor(() => !!p.window.__PLAT_HOOKS_mines, 300000, 'preboot mines');
    p.window.PLAT_show('lobby');
  }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="mines"]'));
  await waitFor(() => G.window.__PLAT_NET && G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === 'mines', 30000, 'guest armed mines');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="' + mode + '"][data-hub-game="mines"]'));
  await sleep(600);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  await sleep(700);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 90000, 'start enabled');
  if (en) clickEl(H, en);
  await waitFor(() => H.window.__PLAT_NET.inMatch === 'mines' && G.window.__PLAT_NET.inMatch === 'mines', 120000, 'inMatch mines');
  await sleep(800);
  return { H, G };
}
function clickCell(p, idx) {
  const el = p.document.querySelector('#view-mines [data-cell="' + idx + '"]');
  if (!el) return false;
  el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true }));
  return true;
}

(async () => {
  // ================= 競速 =================
  console.log('--- 競速場 ---');
  const { H, G } = await makeRoom('race');
  const bothPlaying = await waitFor(() => { const a = dbg(H), b = dbg(G); return a.mp.phase === 'playing' && b.mp.phase === 'playing' ? true : null; }, 60000, 'both playing');
  check('競速：雙邊進場自動開局+倒數完進入 playing', !!bothPlaying, 'H=' + dbg(H).mp.phase + ' G=' + dbg(G).mp.phase);
  check('競速：雙邊同 seed 同題面', JSON.stringify(dbg(H).layout) === JSON.stringify(dbg(G).layout));
  check('競速：名單雙邊一致（2 人）', dbg(H).players.length === 2 && dbg(G).players.length === 2, 'H' + dbg(H).players.length + ' G' + dbg(G).players.length);

  // 來賓：先挖一個安全格（避開首點搬雷），再挖一顆雷出局
  let gl = dbg(G).layout.slice();
  const gSafe = gl.findIndex(v => !v);
  clickCell(G, gSafe); await sleep(700);
  gl = dbg(G).layout.slice(); // 首點後 layout 為準（可能搬雷）
  const gMine = gl.findIndex(v => v);
  // 先多挖兩格安全格讓進度 > 0（出局照進度排才看得出）
  const moreSafe = gl.map((v, i) => (!v && dbg(G).cells[i] === 'h') ? i : -1).filter(i => i >= 0).slice(0, 2);
  for (const i of moreSafe) { clickCell(G, i); await sleep(400); }
  const gProgBefore = dbg(G).progress;
  clickCell(G, gMine); await sleep(900);
  // 容錯（使用者定案：雷數 10%＝1 次）：第一顆照樣引爆但記 ✗ 續玩，第二顆才出局
  check('競速：來賓第一顆雷被容錯（記 ✗、未出局）', dbg(G).cells[gMine] === 'x' && dbg(G).status !== 'lost' && dbg(G).mistakes === 1, 'cell=' + dbg(G).cells[gMine] + ' status=' + dbg(G).status + ' mistakes=' + dbg(G).mistakes);
  const chipG = [...G.document.querySelectorAll('#view-mines div')].find(d => (d.textContent || '').includes('💣') && (d.textContent || '').includes('❤️'));
  check('容錯愛心：10 雷共 2 顆心、按錯一次後 1 顆變灰', !!chipG && (chipG.textContent.split('❤️').length - 1) === 2 && (chipG.innerHTML || '').includes('grayscale'), chipG ? chipG.textContent.trim() : 'no chip');
  const gMine2 = dbg(G).layout.findIndex((v, i) => v && dbg(G).cells[i] === 'h');
  clickCell(G, gMine2); await sleep(900);
  const gAfter = dbg(G);
  check('競速：來賓第二顆雷出局 status=lost', gAfter.status === 'lost', 'status=' + gAfter.status);
  check('競速：來賓出局進度 >0 且 <1', gProgBefore > 0 && gProgBefore < 1, 'prog=' + gProgBefore);
  // 房主端應收到來賓 💥（god 條目 state=boom）
  const hGodOfG = await waitFor(() => { const ps = dbg(H).players; const gp = ps.find(p => p.name === '阿客'); const g = gp && dbg(H).god[gp.id]; return g && g.state === 'boom' ? g : null; }, 30000, 'host sees guest boom');
  check('競速：房主收到來賓出局（god state=boom、進度吻合）', !!hGodOfG && Math.abs((hGodOfG.progress || 0) - gProgBefore) < 0.02, hGodOfG ? 'prog=' + hGodOfG.progress : 'none');
  // 來賓出局後：上帝面板常駐 + 等待結算卡
  await sleep(600);
  const gViewTxt = G.document.querySelector('#view-mines').textContent;
  check('競速：來賓出局後自動上帝面板（已出局・觀戰中）', gViewTxt.includes('已出局・觀戰中'));
  check('滾字：觀戰面板對手晶片 % 為 PlatCount 滾輪（.plat-count，v1.72.0 追補）', !!G.document.querySelector('#view-mines .plat-count'));
  const gResTxt = (G.document.querySelector('#plat-results') || { textContent: '' }).textContent;
  check('競速：來賓出局後先出等待結算卡（等待其他玩家完成）', gResTxt.includes('等待其他玩家完成'), gResTxt.slice(0, 80));

  // 房主：把安全格全挖完
  let guard = 0;
  while (guard++ < 90) {
    const d = dbg(H); if (d.status === 'won') break;
    const L = d.layout, C = d.cells;
    const nxt = L.findIndex((v, i) => !v && C[i] === 'h');
    if (nxt < 0) break;
    clickCell(H, nxt); await sleep(220);
  }
  check('競速：房主完賽 status=won', dbg(H).status === 'won', 'status=' + dbg(H).status + ' prog=' + dbg(H).progress);
  const finOk = await waitFor(() => (dbg(H).mp.phase === 'done' && dbg(G).mp.phase === 'done') ? true : null, 30000, 'both done');
  check('競速：全場了結雙邊 phase=done', !!finOk, 'H=' + dbg(H).mp.phase + ' G=' + dbg(G).mp.phase);
  const finH = dbg(H).final, finG = dbg(G).final;
  check('競速：名次一致（房主 1、來賓 2 踩雷照進度）', !!finH && !!finG && finH.entries[0].name === '阿主' && finH.entries[1].name === '阿客' && finG.entries[0].name === '阿主' && String(finH.entries[1].right).includes('💥'), JSON.stringify(finH && finH.entries));
  const gGodLeak = (() => { const ps = dbg(G).players; const hp = ps.find(p => p.name === '阿主'); const g = hp && dbg(G).god[hp.id]; if (!g || !g.cells) return 'no-god'; const keys = Object.keys(g.nums || {}); return keys.every(k => g.cells[+k] === 'o') ? 'ok' : 'LEAK'; })();
  check('競速：god 快照不洩雷（nums 只含已開格）', gGodLeak === 'ok', gGodLeak);
  await sleep(800);
  const hResTxt = (H.document.querySelector('#plat-results') || { textContent: '' }).textContent;
  check('競速：房主畫面出現結算卡（競速結果+你贏了）', hResTxt.includes('競速結果') && hResTxt.includes('你贏了'), hResTxt.slice(0, 80));
  // 房主完賽後上帝面板（看得到來賓盤面）
  const hViewTxt = H.document.querySelector('#view-mines').textContent;
  check('競速：房主完賽後自動上帝面板', hViewTxt.includes('已完賽・觀戰中'));
  check('競速場零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || '') + '|' + platStatus(H) + '|' + platStatus(G));
  H.window.close(); G.window.close();

  // ================= 合作 =================
  console.log('--- 合作場 ---');
  const R2 = await makeRoom('coop');
  const H2 = R2.H, G2 = R2.G;
  const bothPlaying2 = await waitFor(() => { const a = dbg(H2), b = dbg(G2); return a.mp.phase === 'playing' && b.mp.phase === 'playing' ? true : null; }, 60000, 'coop both playing');
  check('合作：雙邊進場開局', !!bothPlaying2, 'H=' + dbg(H2).mp.phase + ' G=' + dbg(G2).mp.phase);
  const L0 = dbg(H2).layout.slice();
  const safe1 = L0.findIndex(v => !v);
  clickCell(H2, safe1); await sleep(900);
  check('合作：房主挖格→雙邊盤面一致', JSON.stringify(dbg(H2).cells) === JSON.stringify(dbg(G2).cells), 'opened H=' + dbg(H2).openedSafe + ' G=' + dbg(G2).openedSafe);
  const idxH2 = dbg(H2).players.findIndex(p => p.name === '阿主'), idxG2 = dbg(H2).players.findIndex(p => p.name === '阿客');
  const ownOK = (pg) => { const d = dbg(pg); if (!d.owners) return false; for (let i = 0; i < d.cells.length; i++) if (d.cells[i] === 'o' && d.owners[i] !== idxH2) return false; return d.openedSafe > 0; };
  check('合作貢獻：房主開的格 owners 全標房主（雙邊一致）', ownOK(H2) && ownOK(G2) && JSON.stringify(dbg(H2).owners) === JSON.stringify(dbg(G2).owners), 'H own=' + JSON.stringify(dbg(H2).owners || []).slice(0, 60));
  const L1 = dbg(H2).layout.slice();
  const safe2 = L1.findIndex((v, i) => !v && dbg(H2).cells[i] === 'h');
  clickCell(G2, safe2); await sleep(900);
  check('合作：來賓挖格→雙邊盤面一致', JSON.stringify(dbg(H2).cells) === JSON.stringify(dbg(G2).cells) && dbg(H2).openedSafe > dbg(G2).openedSafe - 1 && dbg(G2).openedSafe >= 1, 'H=' + dbg(H2).openedSafe + ' G=' + dbg(G2).openedSafe);
  const cntOwn = (d, ix) => (d.owners || []).reduce((a, o) => a + (o === ix ? 1 : 0), 0);
  check('合作貢獻：來賓開的格標來賓、兩人合計＝已開安全格、雙邊 owners 一致', cntOwn(dbg(H2), idxG2) >= 1 && cntOwn(dbg(H2), idxH2) + cntOwn(dbg(H2), idxG2) === dbg(H2).openedSafe && JSON.stringify(dbg(H2).owners) === JSON.stringify(dbg(G2).owners), 'cntH=' + cntOwn(dbg(H2), idxH2) + ' cntG=' + cntOwn(dbg(H2), idxG2) + ' opened=' + dbg(H2).openedSafe);
  const minesViewTxt = H2.document.querySelector('#view-mines') ? H2.document.querySelector('#view-mines').textContent : '';
  check('合作貢獻：畫面出現貢獻統計（阿主/阿客 開了 N 格）', minesViewTxt.includes('開了') && minesViewTxt.includes('阿主') && minesViewTxt.includes('阿客'), minesViewTxt.slice(0, 120));
  const mineIdx = dbg(H2).layout.findIndex(v => v);
  clickCell(G2, mineIdx); await sleep(1000);
  // v1.49.0：合作也有 10% 共用容錯（10 雷→1 次）——第一顆雷全隊被原諒：記 ✗、雙邊愛心同步、續玩
  check('合作：來賓踩第一顆雷→容錯原諒（雙邊記 ✗、續玩）', dbg(H2).status === 'playing' && dbg(G2).status === 'playing' && dbg(H2).cells[mineIdx] === 'x' && dbg(G2).cells[mineIdx] === 'x' && dbg(H2).mistLeft === 0 && dbg(G2).mistLeft === 0, 'H=' + dbg(H2).status + '/' + dbg(H2).cells[mineIdx] + ' G=' + dbg(G2).status + '/' + dbg(G2).cells[mineIdx]);
  const mine2 = dbg(H2).layout.findIndex((v, i) => v && dbg(H2).cells[i] === 'h');
  clickCell(G2, mine2); await sleep(1000);
  check('合作：來賓踩第二顆雷→雙邊同敗 status=lost', dbg(H2).status === 'lost' && dbg(G2).status === 'lost', 'H=' + dbg(H2).status + ' G=' + dbg(G2).status);
  check('合作：雙邊 phase=done', dbg(H2).mp.phase === 'done' && dbg(G2).mp.phase === 'done');
  await sleep(800);
  const h2ResTxt = (H2.document.querySelector('#plat-results') || { textContent: '' }).textContent;
  check('合作：結算卡點名是來賓踩的', h2ResTxt.includes('合作結果') && h2ResTxt.includes('阿客') && h2ResTxt.includes('踩到地雷'), h2ResTxt.slice(0, 100));
  check('合作場零錯誤', H2.errors.length === 0 && G2.errors.length === 0, (H2.errors[0] || '') + '|' + (G2.errors[0] || ''));
  H2.window.close(); G2.window.close();

  console.log('\n=== mines-mp: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
