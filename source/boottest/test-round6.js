// 審查循環第 6 輪（v1.61.0）：K1 段位滑動指示片、K2 聊天泡泡、K3 展開收編盤點、K4 地雷對手進度對齊
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const mock = require('./mockpeer.js');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const REG = {}; const errors = [];
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name + (extra ? ' — ' + extra : '')); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(120); } console.log('  (timeout: ' + label + ')'); return null; }
function loadPage(label) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String(e.detail && e.detail.message || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(label + ': ' + m); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = REG; w.scrollTo = () => {}; w.addEventListener('error', ev => { if (ev.message && !/Script error/.test(ev.message)) errors.push(label + ': ' + ev.message); }); } });
  return { window: dom.window, document: dom.window.document, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true, cancelable: true })); return !!el; };
function setInput(w, el, v) { if (!el) return; const st = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; st.call(el, v); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
function setSel(w, el, v) { if (!el) return; const st = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value').set; st.call(el, v); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
// rect 替身：rule = { sel, rect(el, idxAmongMatches) }；容器與按鈕給不同座標，驗 PlatSeg 量測/滑動（jsdom 無版面引擎，同 round3 手法）
function patchRects(w, rules) {
  const orig = w.Element.prototype.getBoundingClientRect;
  w.Element.prototype.getBoundingClientRect = function () {
    for (const r of rules) { if (this.matches && this.matches(r.sel)) { const all = [...this.ownerDocument.querySelectorAll(r.sel)]; return r.rect(this, all.indexOf(this)); } }
    return orig.call(this);
  };
}
const R = (x, y, wd, ht) => ({ left: x, top: y, right: x + wd, bottom: y + ht, width: wd, height: ht, x, y });

// ---------- A: 雙頁房間（K1 分頁 pill＋K2 泡泡＋sys） ----------
async function makeRoom() {
  const H = loadPage('H');
  await waitFor(() => typeof H.window.PLAT_show === 'function' && H.window.PlatDock, 90000, 'H shell');
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 30000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), '阿主');
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => H.window.__PLAT_NET && H.window.__PLAT_NET.code, 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  const G = loadPage('G');
  await waitFor(() => typeof G.window.PLAT_show === 'function' && G.window.PlatDock, 90000, 'G shell');
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 30000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), '阿客');
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => { const r = G.document.querySelector('#view-lobby [data-pr-region="roster"]'); return r && (r.textContent || '').includes('阿主'); }, 60000, 'G in room');
  return { H, G };
}
(async () => {
  const shellCss = fs.readFileSync('/home/hatch/workspace/platform/shell.css', 'utf8');
  const shellSrc = fs.readFileSync('/home/hatch/workspace/platform/shell.js', 'utf8');
  // ===== K2 靜態 =====
  check('K2 泡泡 CSS 在位（max-width 78%、圓角 14px）', /\.plat-bubble \{[^}]*max-width: 78%[^}]*border-radius: 14px/.test(shellCss));
  check('K2 方向進場 keyframes（左下/右下）', /@keyframes platMsgInL/.test(shellCss) && /@keyframes platMsgInR/.test(shellCss));
  check('K1 PlatSeg 已定義並掛 window', /window\.PlatSeg = function/.test(shellSrc));
  check('K3 mines 自訂區改 plat-collapse-y（殼 PlatSetup 持有，原始碼）', /plat-collapse-y/.test(shellSrc)); // F2 起自訂區由殼 PlatSetup 渲染（mines app 不再自有）

  const { H, G } = await makeRoom();
  await sleep(600);
  // ===== K1 房間分頁 pill =====
  patchRects(H.window, [
    { sel: '[data-seg="roomtabs"]', rect: () => R(0, 0, 400, 44) },
    { sel: '[data-rtab]', rect: (el, i) => R(i * 100, 2, 92, 40) },
  ]);
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="hashi"]')); // 觸發重渲染→以替身 rect 重新量測
  await sleep(400);
  const segC = H.document.querySelector('[data-seg="roomtabs"]');
  const pill = segC && segC.querySelector('.plat-seg-pill');
  check('K1 分頁容器有指示片 pill', !!pill);
  check('K1 pill 底色沿用選取色（slate-800）', !!pill && /rgb\(30, 41, 59\)|#1e293b/.test(pill.style.background || ''), pill && pill.style.background);
  check('K1 pill 對準選中分頁位置（hashi=第 2 顆 x=100）', !!pill && /translate\(100px/.test(pill.style.transform || ''), pill && pill.style.transform);
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="mines"]'));
  await sleep(400);
  const pill2 = H.document.querySelector('[data-seg="roomtabs"] .plat-seg-pill');
  check('K1 換分頁 pill 滑到新位置（mines x=200）', !!pill2 && /translate\(200px/.test(pill2.style.transform || ''), pill2 && pill2.style.transform);
  check('K1 換分頁 pill 帶滑動 transition（200ms）', !!pill2 && /200ms/.test(pill2.style.transition || ''), pill2 && pill2.style.transition);

  // ===== K2 聊天泡泡（雙頁） =====
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="dock-chat"]'));
  await sleep(400);
  const sysNode = [...H.document.querySelectorAll('#plat-chat-list .plat-msg.sys')].find(n => (n.textContent || '').includes('加入了房間'));
  check('K2 系統訊息置中膠囊（.plat-bubble-sys）', !!sysNode && !!sysNode.querySelector('.plat-bubble-sys'));
  const gInp = G.document.querySelector('#plat-chat-input'); gInp.value = '泡泡測試一句話';
  clickEl(G, G.document.querySelector('#plat-chat-send'));
  const other = await waitFor(() => { const ns = [...H.document.querySelectorAll('#plat-chat-list .plat-msg')]; const n = ns[ns.length - 1]; return (n && n.textContent.includes('泡泡測試')) ? n : null; }, 15000, 'H recv');
  check('K2 他人訊息：列非 mine＋白泡 .plat-bubble', !!other && !other.classList.contains('mine') && !!other.querySelector('.plat-bubble'));
  const who = other && other.querySelector('.plat-bubble .who');
  check('K2 他人泡泡內含名字（玩家色）', !!who && who.textContent.includes('阿客') && !!who.style.color, who && who.style.color);
  const hInp = H.document.querySelector('#plat-chat-input'); hInp.value = '我自己的泡泡';
  clickEl(H, H.document.querySelector('#plat-chat-send'));
  await sleep(300);
  const mineNodes = [...H.document.querySelectorAll('#plat-chat-list .plat-msg.mine')];
  const mine = mineNodes[mineNodes.length - 1];
  const mb = mine && mine.querySelector('.plat-bubble.mine-b');
  check('K2 自己訊息：mine 列＋淡色泡 .mine-b（不顯示名字）', !!mine && !!mb && !mb.querySelector('.who'));
  check('K2 自己泡泡底色為玩家色淡版（inline rgb）', !!mb && /rgb\(/.test(mb.style.background || ''), mb && mb.style.background);
  await sleep(700);
  check('K2 進場結束後 mine 對齊 class 保留（不隨進場移除）', !!mine && mine.classList.contains('mine') && !mine.classList.contains('plat-msg-in'));
  const gOther = await waitFor(() => { const ns = [...G.document.querySelectorAll('#plat-chat-list .plat-msg')]; const n = ns[ns.length - 1]; return (n && n.textContent.includes('我自己的泡泡')) ? n : null; }, 15000, 'G recv host msg');
  check('K2 來賓端看房主訊息為他人泡（who=阿主）', !!gOther && !gOther.classList.contains('mine') && !!(gOther.querySelector('.plat-bubble .who') || {}).textContent?.includes('阿主'));

  // ===== B: 數獨單頁（K1 難度 pill＋PlatBar 輸入組 pill） =====
  const S = loadPage('S');
  await waitFor(() => typeof S.window.PLAT_show === 'function' && S.window.PlatDock, 90000, 'S shell');
  patchRects(S.window, [
    { sel: '[data-seg="pse-diff"]', rect: () => R(0, 0, 230, 110) },
    { sel: '[data-seg="pse-diff"] > button', rect: (el, i) => R((i % 2) * 115, Math.floor(i / 2) * 55, 105, 48) },
    { sel: '[data-pbseg="input"]', rect: () => R(0, 0, 260, 44) },
    { sel: '[data-pb="input-num"]', rect: () => R(4, 4, 120, 36) },
    { sel: '[data-pb="input-cell"]', rect: () => R(130, 4, 120, 36) },
  ]);
  S.window.PLAT_show('sudoku');
  const toSetup = await waitFor(() => [...S.document.querySelectorAll('#view-sudoku button')].find(b => (b.textContent || '').includes('單機')), 60000, 'sudoku home');
  clickEl(S, toSetup);
  const diffGrid = await waitFor(() => S.document.querySelector('[data-seg="pse-diff"]'), 30000, 'diff grid'); // F3：數獨難度 seg 改殼 PlatSetup groups（data-seg="pse-diff"）
  check('K1 數獨難度格存在（plat-seg）', !!diffGrid && diffGrid.classList.contains('plat-seg'));
  const dPill = await waitFor(() => { const p = diffGrid.querySelector('.plat-seg-pill'); return (p && p.style.transform && p.style.transform !== 'translate(0px, 0px)') || (p && diffGrid.querySelector('[data-seg-on="1"]') === diffGrid.querySelectorAll('button')[0]) ? p : (p && p.style.transform ? p : null); }, 15000, 'diff pill placed');
  await sleep(200);
  check('K1 難度 pill 首次掛載直接定位（transition none）', !!dPill && (dPill.style.transition === 'none' || dPill.style.transition === ''), dPill && dPill.style.transition);
  const diffBtns = [...diffGrid.querySelectorAll('button')];
  const other1 = diffBtns.find(b => !b.hasAttribute('data-seg-on'));
  const beforeT = dPill ? dPill.style.transform : '';
  clickEl(S, other1);
  const dPill2 = await waitFor(() => { const p = diffGrid.querySelector('.plat-seg-pill'); return (p && p.style.transform && p.style.transform !== beforeT) ? p : null; }, 15000, 'diff pill moved');
  await sleep(200);
  check('K1 換難度 pill 滑動（transition 含 200ms 且位置改變）', !!dPill2 && /200ms/.test(dPill2.style.transition || '') && dPill2.style.transform !== beforeT, beforeT + ' -> ' + (dPill2 && dPill2.style.transform));
  const startBtn = S.document.querySelector('#plat-setup [data-pse="start"]'); // F3：開始鈕改殼 PlatSetup
  clickEl(S, startBtn);
  const inputGrp = await waitFor(() => S.document.querySelector('[data-pbseg="input"]'), 30000, 'pb input group');
  check('K1 PlatBar 輸入組存在（plat-seg）', !!inputGrp);
  await sleep(600);
  clickEl(S, S.document.querySelector('[data-pb="input-cell"]'));
  await sleep(600);
  const iPill = S.document.querySelector('[data-pbseg="input"] .plat-seg-pill');
  check('K1 輸入組 pill 滑到格子先行（x=130）', !!iPill && /translate\(130px/.test(iPill.style.transform || ''), iPill && iPill.style.transform);
  check('K1 輸入組 pill 有滑動 transition', !!iPill && /200ms/.test(iPill.style.transition || ''));

  // ===== D: 地雷單頁 setup（K3） =====
  const M = loadPage('M');
  await waitFor(() => typeof M.window.PLAT_show === 'function' && M.window.PlatDock, 90000, 'M shell');
  M.window.PLAT_show('mines');
  const mSolo = await waitFor(() => [...M.document.querySelectorAll('#view-mines button')].find(b => (b.textContent || '').includes('單機挑戰')), 60000, 'mines home');
  clickEl(M, mSolo);
  await sleep(600);
  const custWrap = await waitFor(() => M.document.querySelector('#plat-setup .plat-collapse-y'), 15000, 'cust collapse'); // F2：自訂區在殼 PlatSetup overlay 內
  check('K3 自訂區為 plat-collapse-y 常駐掛載（收合時無 open）', !!custWrap && !custWrap.classList.contains('open'));
  const custInputs = custWrap ? custWrap.querySelectorAll('input[type="number"]') : [];
  check('K3 收合狀態下輸入框已在 DOM（常駐、值不重置）', custInputs.length === 3, 'n=' + custInputs.length);
  const custToggle = M.document.querySelector('#plat-setup [data-pse="cust-toggle"]');
  clickEl(M, custToggle);
  await sleep(300);
  const custWrap2 = M.document.querySelector('#plat-setup .plat-collapse-y'); // PlatSetup 點擊後整卡重繪，須重查（舊節點已脫離）
  check('K3 展開後 wrapper 帶 open', !!custWrap2 && custWrap2.classList.contains('open'));
  const custInputs2 = custWrap2 ? custWrap2.querySelectorAll('input[type="number"]') : [];
  setInput(M.window, custInputs2[0], '20');
  await sleep(300);
  const startCust = [...M.document.querySelectorAll('#plat-setup button')].find(b => (b.textContent || '').includes('開始：'));
  check('K3 展開後改寬度，開始鈕即時顯示 20×', !!startCust && (startCust.textContent || '').includes('20×'), startCust && startCust.textContent);

  check('全程零頁面錯誤', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log('RESULT round6(A/B/D): ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
