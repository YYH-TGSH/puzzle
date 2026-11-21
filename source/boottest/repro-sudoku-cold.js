// 重現：雙邊全冷啟動（不預啟動任何遊戲）→ 建房/入房 → 數獨合作 → 開始 → 是否真的進到數獨對局
// 再回房間頁 → 數獨大亂鬥 → 開始 → 同樣檢查。印出殼的 status 面板內容協助判讀。
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
const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block'; };
const statusTxt = (p) => { const el = p.document.querySelector('#plat-status-body'); return el ? el.textContent.replace(/\s+/g, ' ').slice(-400) : '(no status el)'; };
const sudokuLive = (p) => { const v = p.document.querySelector('#view-sudoku'); const root = p.document.querySelector('#sudoku-root'); return { view: p.document.body.getAttribute('data-view'), rootKids: root ? root.childElementCount : -1, btns: v ? v.querySelectorAll('button').length : 0 }; };

(async () => {
  const H = loadPage('H'), G = loadPage('G');
  for (const p of [H, G]) await waitFor(() => typeof p.window.PLAT_show === 'function' && p.window.PlatDock, 600000, p.label + ' shell');
  check('冷啟動：兩頁都沒 boot 過數獨', !H.window.__PLAT_HOOKS_sudoku && !G.window.__PLAT_HOOKS_sudoku);
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
  await waitFor(() => H.window.__PLAT_NET.roster.length >= 2 && hubRoom(G), 90000, 'roster2');
  check('冷啟動：雙邊進房間頁（未載入遊戲）', hubRoom(H) && hubRoom(G) && !H.window.__PLAT_HOOKS_sudoku);

  async function startAndCheck(modeLabel) {
    clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(400);
    clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
    const sb = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return b && !b.disabled ? b : null; }, 90000, 'start enabled ' + modeLabel);
    check(modeLabel + '：房主開始鈕啟用', !!sb, sb ? '' : 'start btn missing/disabled');
    if (!sb) { console.log('H status:', statusTxt(H)); return false; }
    clickEl(H, sb);
    const inM = await waitFor(() => H.window.__PLAT_NET.inMatch === 'sudoku' && G.window.__PLAT_NET.inMatch === 'sudoku' ? true : null, 60000, 'inMatch ' + modeLabel);
    check(modeLabel + '：雙邊 inMatch=sudoku', !!inM, 'H=' + H.window.__PLAT_NET.inMatch + ' G=' + G.window.__PLAT_NET.inMatch);
    const live = await waitFor(() => { const s = sudokuLive(H); return (s.view === 'sudoku' && s.rootKids > 0 && s.btns > 30) ? s : null; }, 90000, 'sudoku live H ' + modeLabel);
    check(modeLabel + '：房主數獨對局畫面活著', !!live, JSON.stringify(sudokuLive(H)));
    const liveG = await waitFor(() => { const s = sudokuLive(G); return (s.view === 'sudoku' && s.rootKids > 0 && s.btns > 30) ? s : null; }, 60000, 'sudoku live G ' + modeLabel);
    check(modeLabel + '：來賓數獨對局畫面活著', !!liveG, JSON.stringify(sudokuLive(G)));
    console.log('H status tail:', statusTxt(H));
    console.log('G status tail:', statusTxt(G));
    return !!live && !!liveG;
  }

  // 合作（預設模式）
  await startAndCheck('合作');
  // 回房間頁 → 切大亂鬥 → 再開
  for (const p of [H, G]) { if (p.window.__PLAT_NET.inMatch) { /* 用殼的回房間：點遊戲內回大廳類按鈕太脆弱，直接呼叫 doReturn 路徑的公開入口 */ } }
  H.window.__PLAT_NET && H.document.querySelector('#view-sudoku');
  // 經由遊戲標頭「回等待室/回房間」流程太長，改用殼提供的方式：房主廣播 return —— 直接調 hooks exit + Net 層沒有公開 API，改走 UI：點數獨畫面裡的退出/回房間按鈕
  const backBtn = [...H.document.querySelectorAll('#view-sudoku button')].find(b => /回房間|回等待室|回大廳/.test(b.textContent || ''));
  console.log('back btn found:', !!backBtn, backBtn && backBtn.textContent.trim().slice(0, 20));
  if (backBtn) { clickEl(H, backBtn); await sleep(1500); const leave1 = [...H.document.querySelectorAll('button')].find(b => /回房間頁|回等待室/.test(b.textContent || '')); if (leave1) { clickEl(H, leave1); } }
  const backRoom = await waitFor(() => hubRoom(H) ? true : null, 30000, 'back to room');
  console.log('回到房間頁:', !!backRoom, 'H inMatch=', H.window.__PLAT_NET.inMatch);
  if (backRoom) {
    const brawlBtn = H.document.querySelector('#lob-step-room [data-hub-mode="brawl"][data-hub-game="sudoku"]');
    check('大亂鬥模式鈕存在', !!brawlBtn);
    clickEl(H, brawlBtn); await sleep(600);
    await startAndCheck('大亂鬥');
  }
  check('零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  console.log('\n=== sudoku-cold: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
