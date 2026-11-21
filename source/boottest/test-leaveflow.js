// WAITFOR_CAP_MS 放寬理由（甲案後半）：本套件含 1.3MB bundle 的 jsdom 開機等待（600s 寫法），上限放寬至 240 秒防解析尖峰誤殺；其餘 in-flow 等待仍受此上限快速失敗。
const WAITFOR_CAP_MS = 240000;
// 驗證（使用者 2026-10-28）：多人對戰我完賽後，畫面自動轉上帝模式（不用按鈕、不怕關掉打不開）
// 數獨：房主先解完 → 主盤面自動變上帝視角（自己的格子消失、god 總覽出現），成績卡關掉後仍在
// 數橋：來賓先解完 → 常駐觀戰面板自動出現（🏁 已完賽・觀戰中），成績卡關掉後仍在
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
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; try { w.localStorage.setItem('sudoku_input_mode', 'cell'); } catch (e) {} w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }

async function makeRoom(game, preStart) {
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
  // 現行開局（v1.11+ 房間頁，抄 test-v190）：切分頁 → 選大亂鬥 → 雙邊準備 → 房主開始 → 自動載入開賽
  const gname = game.startsWith('sudoku') ? 'sudoku' : 'hashi';
  const view = '#' + 'view-' + gname;
  for (const p of [H, G]) { // preboot：先載好遊戲，開始時才不卡
    p.window.PLAT_show(gname);
    await waitFor(() => !!p.window['__PLAT_HOOKS_' + gname], 300000, 'preboot ' + gname);
    p.window.PLAT_show('lobby');
  }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="' + gname + '"]'));
  await waitFor(() => G.window.__PLAT_NET && G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === gname, 30000, 'guest armed');
  const modeVal = gname === 'sudoku' ? 'brawl' : 'race'; // 數獨模式值叫 brawl、數橋叫 race（殼 hubModeBtn）
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="' + modeVal + '"][data-hub-game="' + gname + '"]'));
  await sleep(600);
  if (preStart) await preStart(H, G, view);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  await sleep(700);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 90000, 'start enabled');
  if (en) clickEl(H, en);
  await waitFor(() => H.window.__PLAT_NET.inMatch === gname && G.window.__PLAT_NET.inMatch === gname, 120000, 'inMatch');
  await sleep(1000);
  return { H, G, view };
}
const dbgM = (p) => p.window.__PLAT_HOOKS_mines.debug();
const btnByText = (root, txt) => [...root.querySelectorAll('button')].find(b => (b.textContent || '').includes(txt));
async function makeRoomMines(mode) {
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
  for (const p of [H, G]) { p.window.PLAT_show('mines'); await waitFor(() => !!p.window.__PLAT_HOOKS_mines, 300000, 'preboot mines'); p.window.PLAT_show('lobby'); }
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="mines"]'));
  await waitFor(() => G.window.__PLAT_NET && G.window.__PLAT_NET.armed && G.window.__PLAT_NET.armed.game === 'mines', 30000, 'guest armed mines');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="' + mode + '"][data-hub-game="mines"]'));
  await sleep(600);
  return { H, G };
}
async function roomStart(H, G) {
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  await sleep(700);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = H.document.querySelector('#lob-step-room [data-pr="start"]'); return sb && !sb.disabled ? sb : null; }, 90000, 'start enabled');
  if (en) clickEl(H, en);
  await waitFor(() => H.window.__PLAT_NET.inMatch === 'mines' && G.window.__PLAT_NET.inMatch === 'mines', 120000, 'inMatch mines');
}
function clickCell(p, idx) { const el = p.document.querySelector('#view-mines [data-cell="' + idx + '"]'); if (!el) return false; el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return true; }

(async () => {
  // ===== A：數橋房主開局後離開（回大廳）→ 房主落多人入口、來賓接管續局 =====
  console.log('--- A 數橋房主離開 ---');
  {
    const { H, G } = await makeRoom('hashi-brawl');
    await waitFor(() => { const cd = H.document.querySelector('#plat-countdown'); return !cd || cd.style.display !== 'flex'; }, 30000, 'cd over');
    await sleep(1500);
    clickEl(H, btnByText(H.document.querySelector('#view-hashi'), '退出'));
    await sleep(800);
    clickEl(H, btnByText(H.document, '退出（回大廳）'));
    await sleep(2500);
    check('A 房主離開後回到多人入口且連線已斷', H.document.body.getAttribute('data-view') === 'lobby' && H.window.__PLAT_NET.active === false, 'view=' + H.document.body.getAttribute('data-view') + ' active=' + H.window.__PLAT_NET.active);
    const mig = await waitFor(() => G.window.__PLAT_NET.isHost === true ? true : null, 60000, 'G takeover');
    check('A 來賓接管成新房主、仍在數橋局中', !!mig && G.window.__PLAT_NET.inMatch === 'hashi', 'isHost=' + G.window.__PLAT_NET.isHost + ' inMatch=' + G.window.__PLAT_NET.inMatch);
    check('A 零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
    H.window.close(); G.window.close();
  }
  // ===== B/C/D：地雷一房三幕 =====
  console.log('--- B/C/D 地雷離開全流程 ---');
  {
    const { H, G } = await makeRoomMines('race');
    // C：開局過程取樣——地雷畫面不許出現自家等候室元素（開始鈕/觀戰切換）
    let sawWaitingRoom = '';
    const sampler = setInterval(() => {
      for (const p of [H, G]) {
        const root = p.document.querySelector('#mines-root'); if (!root) continue;
        const txt = [...root.querySelectorAll('button')].map(b => b.textContent || '').join('|');
        if (/開始競速|開始合作|改觀戰|改參賽/.test(txt)) sawWaitingRoom = txt.slice(0, 80);
      }
    }, 120);
    await roomStart(H, G);
    const playing = await waitFor(() => (dbgM(H).mp.phase === 'playing' && dbgM(G).mp.phase === 'playing') ? true : null, 90000, 'mines playing');
    clearInterval(sampler);
    check('C 開局全程沒出現地雷自家等候室（無開始/觀戰切換鈕）', !sawWaitingRoom, sawWaitingRoom);
    check('C 雙邊開局 playing', !!playing, 'H=' + dbgM(H).mp.phase + ' G=' + dbgM(G).mp.phase);
    // D：來賓開離開選單（同款項目）→ 取消；房主開選單 → 回等待室（全員回房間頁）
    clickEl(G, btnByText(G.document.querySelector('#view-mines'), '退出'));
    await sleep(700);
    const menuItems = [...G.document.querySelectorAll('button')].map(b => b.textContent || '');
    check('D 來賓離開選單項目與另兩款同款（回等待室/退出（回大廳））', menuItems.some(t => t.includes('回等待室')) && menuItems.some(t => t.includes('退出（回大廳）')), menuItems.join('|').slice(0, 100));
    clickEl(G, btnByText(G.document, '取消'));
    await sleep(400);
    clickEl(H, btnByText(H.document.querySelector('#view-mines'), '退出'));
    await sleep(700);
    clickEl(H, btnByText(H.document, '回等待室'));
    const backRoom = await waitFor(() => { const rm = H.document.querySelector('#lob-step-room'); const rmG = G.document.querySelector('#lob-step-room'); return (H.document.body.getAttribute('data-view') === 'lobby' && rm && rm.style.display === 'block' && rmG && rmG.style.display === 'block' && !H.window.__PLAT_NET.inMatch) ? true : null; }, 60000, 'both back to room page');
    check('D 房主按回等待室→雙邊回殼房間頁、inMatch 清除', !!backRoom, 'view=' + H.document.body.getAttribute('data-view') + ' inMatch=' + H.window.__PLAT_NET.inMatch);
    // B：重開一局打完，來賓在結算卡按離開（兩段確認）→ 落多人入口；回大廳→多人連線→看到建立/加入畫面而不是地雷頁
    await roomStart(H, G);
    await waitFor(() => (dbgM(H).mp.phase === 'playing' && dbgM(G).mp.phase === 'playing') ? true : null, 90000, 'mines playing 2');
    const digSafeThenBoom = async (p) => { const d0 = dbgM(p); const s = d0.layout.findIndex((v, i) => !v && d0.cells[i] === 'h'); clickCell(p, s); await sleep(800); for (let k = 0; k < 4 && dbgM(p).status !== 'lost'; k++) { const dd = dbgM(p); const m = dd.layout.findIndex((v, i) => v && dd.cells[i] === 'h'); if (m < 0) break; clickCell(p, m); await sleep(800); } }; // 容錯制（v1.49 定案：雷數 10% 次內踩雷記 'x' 續玩）：挖雷到出局為止（2026-11-21 修：舊版只挖一顆、被容錯吃掉，比賽永遠不結束、結算卡永遠不出現）
    await digSafeThenBoom(G); // 第一下有整圈保護炸不到雷：先挖安全格、再點雷（重讀盤面挑雷）
    await digSafeThenBoom(H);
    const resShown = await waitFor(() => { const pr = G.document.querySelector('#plat-results'); return pr && pr.style.display !== 'none' ? pr : null; }, 60000, 'G results');
    check('B 競速結束來賓看到結算卡', !!resShown);
    const leaveBtn = [...G.document.querySelectorAll('#plat-results button')].find(b => (b.textContent || '').includes('離開'));
    clickEl(G, leaveBtn); await sleep(500);
    const armBtn = [...G.document.querySelectorAll('#plat-results button')].find(b => (b.textContent || '').includes('確定離開'));
    clickEl(G, armBtn || leaveBtn);
    const leftOk = await waitFor(() => (G.document.body.getAttribute('data-view') === 'lobby' && G.window.__PLAT_NET.active === false && !G.window.__PLAT_NET.inMatch) ? true : null, 60000, 'G left session');
    check('B 來賓結算卡離開→回多人入口、連線狀態全清（不再卡地雷頁）', !!leftOk, 'view=' + G.document.body.getAttribute('data-view') + ' active=' + G.window.__PLAT_NET.active + ' inMatch=' + G.window.__PLAT_NET.inMatch);
    G.window.PLAT_show('home');
    await sleep(600);
    const mpBtn = [...G.document.querySelectorAll('#view-home button, #view-home a')].find(b => (b.textContent || '').includes('多人連線'));
    clickEl(G, mpBtn);
    await sleep(800);
    const entry = G.document.querySelector('#lob-step-entry');
    check('B 回大廳→多人連線→看到建立/加入房間畫面（不是地雷頁）', G.document.body.getAttribute('data-view') === 'lobby' && !!entry && entry.style.display === 'block', 'view=' + G.document.body.getAttribute('data-view') + ' entry=' + (entry ? entry.style.display : 'none'));
    check('B/C/D 零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  }
  console.log('\n=== leaveflow: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
