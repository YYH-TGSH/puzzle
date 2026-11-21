// 輸入修正專項（v1.29.0）：
// 數獨——觸控筆快點時瀏覽器手勢仲裁會吃掉 click（水波紋有出、數字沒填）：點按改由 pointerup 直接處理。
//   驗：①全程不發 click、只用 pointerdown/up 也能吸取＋填入 ②pointerup 處理後跟來的 click 不得把剛填的數字切掉（dedupe）
//       ③長按清除仍有效，且長按放開後的 click 不得把格子填回去
// 踩地雷——誤觸三主因：長按計時器在 pointercancel（捲動接管）時漏清、移動不取消、門檻 380ms 太短。
//   驗：①長按 500ms 插旗仍有效 ②短按不插旗 ③按住移動 >10px 取消長按 ④pointercancel 後不插旗 ⑤一般 click 挖開仍正常
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
html = html.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (timeout: ' + label + ')'); return null; }
function loadPage(reg, label, sudokuGeom) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.__SHARED_REG__ = reg; w.scrollTo = () => {};
      if (sudokuGeom && w.SVGSVGElement) {
        // jsdom 沒有 SVG 幾何 API：給恆等映射，讓測試能用 SVG 座標（PADDING 20 + 格 60）直接點格子
        w.SVGSVGElement.prototype.createSVGPoint = function () { return { x: 0, y: 0, matrixTransform: function () { return { x: this.x, y: this.y }; } }; };
        w.SVGSVGElement.prototype.getScreenCTM = function () { return { inverse: function () { return {}; } }; };
      }
      w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); });
    } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function pev(p, el, type, x, y) {
  if (!el) return;
  el.dispatchEvent(new p.window.MouseEvent(type, { bubbles: true, clientX: x || 0, clientY: y || 0, button: 0 }));
}
async function openRoom(H, G, game, mode) {
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell'); if (!ok) throw new Error('SHELL NOT READY ' + p.label); }
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  await waitFor(() => hubRoom(H), 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙'; G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  await waitFor(() => hubRoom(G), 60000, 'G room');
  await waitFor(() => H.window.__PLAT_NET.roster.length === 2 ? true : null, 30000, 'roster 2');
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="' + game + '"]'));
  await sleep(600);
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="' + mode + '"]'));
  await sleep(800);
  const readyBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="ready"]');
  const startBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="start"]');
  await waitFor(() => readyBtn(G) && readyBtn(H), 20000, 'ready btns');
  clickEl(G, readyBtn(G)); clickEl(H, readyBtn(H));
  const unlocked = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
  clickEl(H, unlocked);
}
function readBoard(D) {
  const cells = {};
  D.querySelectorAll('#view-sudoku g[id^="cell-"]').forEach(g => { const id = g.getAttribute('id').slice(5); const t = (g.textContent || '').trim(); cells[id] = t ? parseInt(t, 10) : 0; });
  return cells;
}
(async () => {
  let pass = 0, fail = 0;
  const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
  // 建房到 hashi/coop 房間頁（不點準備，留給 G3 操作）
  async function openRoomNoReady(H, G, game, mode) {
    const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
    const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
    for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell'); if (!ok) throw new Error('SHELL NOT READY ' + p.label); }
    click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
    H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
    await waitFor(() => hubRoom(H), 60000, 'H room');
    const code = H.window.__PLAT_NET.code;
    click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
    G.document.querySelector('#lob-name').value = '來賓乙'; G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
    await waitFor(() => hubRoom(G), 60000, 'G room');
    await waitFor(() => H.window.__PLAT_NET.roster.length === 2 ? true : null, 30000, 'roster 2');
    clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="' + game + '"]'));
    await sleep(600);
    clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="' + mode + '"]'));
    await sleep(800);
    // 模式切換要廣播到來賓頁才會長出準備鈕：等雙邊 ready 鈕都出現再放行（實測 800ms 有時不夠，會打到空節點）
    await waitFor(() => (H.document.querySelector('#lob-step-room [data-pr="ready"]') && G.document.querySelector('#lob-step-room [data-pr="ready"]')) ? true : null, 20000, 'ready btns');
  }
  const reg = {};
  const H = loadPage(reg, 'H', true), G = loadPage(reg, 'G', true);
  await openRoomNoReady(H, G, 'hashi', 'race'); // race：名單 badge 才有「未準備/✅ 已準備」（coop 下非房主無 badge）
  const readyBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="ready"]');
  const findBadge = (p, name) => {
    const roster = p.document.querySelector('[data-pr-region="roster"]');
    if (!roster) return null;
    // 名單列是 roster 下的 plain div（無 data-pr-player）：以名字定位列，再取列內最內層的狀態字 span
    for (const r of roster.children) {
      if ((r.textContent || '').includes(name)) {
        const spans = [...r.querySelectorAll('span')].filter(s => /已準備|未準備|觀戰|房主/.test(s.textContent || ''));
        return spans[spans.length - 1] || null;
      }
    }
    return null;
  };
  // ===== G3：房間頁名單狀態字 Roll =====
  let gb = findBadge(H, '來賓乙');
  check('G3 前置：房主名單看到來賓 badge', !!gb, gb ? gb.textContent : 'none');
  check('G3 前置：來賓初始為未準備', !!gb && gb.textContent.includes('未準備'));
  clickEl(G, readyBtn(G));
  // 換字渲染與下一輪重渲染（每秒 waitLeft 推進）之間只有短暫窗口：輪詢必須同時抓「文字＋class」
  const gb2 = await waitFor(() => { const b = findBadge(H, '來賓乙'); return b && b.textContent.includes('已準備') && b.classList.contains('plat-lite-in') ? b : null; }, 20000, 'guest badge ready+roll');
  check('G3：來賓準備後名單 badge 變「✅ 已準備」且帶滾換', !!gb2, gb2 ? gb2.innerHTML.slice(0, 140) : 'none');
  clickEl(H, readyBtn(H)); // 房主再點準備（另一位玩家換字 → 名單重渲染）
  await sleep(1500);
  const gb3 = findBadge(H, '來賓乙');
  check('G3：房主準備後來賓 badge 仍是已準備', !!gb3 && gb3.textContent.includes('已準備'));
  // 強制一次名單重渲染（點房主名字開編輯 → roster 重畫；來賓 badge 同字，換字窗口早已過期，不得重帶 class）
  const nameBtn = [...H.document.querySelectorAll('[data-pr-region="roster"] [data-id-edit]')].find(b => (b.textContent || '').includes('房主甲'));
  if (nameBtn) { clickEl(H, nameBtn); await sleep(600); }
  const gb4 = findBadge(H, '來賓乙');
  check('G3：同字重渲染不重播（無 plat-lite-in）', !!gb4 && !gb4.classList.contains('plat-lite-in'), gb4 ? gb4.outerHTML.slice(0, 140) : '');
  check('G3 段零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));

  // ===== G1＋G2：開局進數橋對局 =====
  const startBtn = H.document.querySelector('#lob-step-room [data-pr="start"]');
  if (startBtn && !startBtn.disabled) clickEl(H, startBtn);
  const freshBoard = () => [...H.document.querySelectorAll('#view-hashi svg')].find(x => [...x.querySelectorAll('text')].some(t => /^[1-8]$/.test((t.textContent || '').trim()))) || null;
  const board0 = await waitFor(() => freshBoard(), 90000, 'hashi board');
  check('G1/G2 前置：數橋盤面在', !!board0);
  await sleep(6500);
  // 倒數結束→開賽會讓 React 重建盤面 svg 節點：G2 讀取前務必重查（舊節點寬度永遠停在 755px，實測踩過）
  const board = freshBoard();
  const panel = H.document.querySelector('#view-hashi .plat-collapse-y');
  check('G1：數橋規則面板已用 plat-collapse-y', !!panel);
  check('G1：面板不再用 max-h 猜高', !!panel && !/max-h/.test(panel.className), panel ? panel.className : '');
  const toggleBtn = [...H.document.querySelectorAll('#view-hashi button')].find(b => (b.textContent || '').includes('展開規則'));
  check('G1 前置：找到「展開規則」鈕', !!toggleBtn);
  if (toggleBtn) {
    clickEl(H, toggleBtn); await sleep(600);
    check('G1：點展開後面板帶 open（精確高過渡）', panel.classList.contains('open'));
    const cs = H.window.getComputedStyle(panel);
    check('G1：過渡屬性含 grid-template-rows（300ms）', /grid-template-rows/.test(cs.transition || ''), cs.transition);
    const toggleBtn2 = H.document.querySelector('#view-hashi [data-ptc="rules"]'); // F3：PTC band 每次 update 整段重繪，舊鈕節點已 detach，第二次點擊必須重查現行 [data-ptc=rules] 鈕（真機使用者點的永遠是現行鈕）
    clickEl(H, toggleBtn2 || toggleBtn); await sleep(600);
    const panel2 = H.document.querySelector('#view-hashi .plat-collapse-y');
    check('G1：點縮小後面板收合（open 卸下）', !!panel2 && !panel2.classList.contains('open'));
  }
  const zoomToggle = H.document.querySelector('#view-hashi [data-pb="zoom-toggle"]');
  if (zoomToggle) { clickEl(H, zoomToggle); await sleep(500); }
  const zoomIn = H.document.querySelector('#view-hashi [data-pb="zoom-in"]'); // 平台上縮放走 PlatBar 子選單（卡片內 ＋ 鈕僅獨立版），共用同一 handleZoomIn
  check('G2 前置：找到放大鈕', !!zoomIn);
  if (zoomIn) {
    // 注意：對局中計時每秒觸發 PlatBar 重畫（innerHTML 整組換節點）——點按前務必即時重查，否則會打到已卸載的舊節點而無效（真機點的是活節點，不受影響）
    const freshZoomIn = () => H.document.querySelector('#view-hashi [data-pb="zoom-in"]');
    const w0 = board.style.width;
    clickEl(H, freshZoomIn()); await sleep(60);
    if (!/200ms/.test(board.style.transition || '')) console.log('  (G2 diag: freshBoard=' + !!freshBoard() + ' sameNode=' + (freshBoard() === board) + ' w=' + board.style.width + ')');
    check('G2：按鈕縮放當下掛 200ms transition', /200ms/.test(board.style.transition || ''), board.style.transition);
    check('G2：按鈕縮放寬度真的變了', board.style.width !== w0, w0 + ' -> ' + board.style.width);
    clickEl(H, freshZoomIn()); await sleep(60);
    await sleep(400);
    check('G2：過渡結束後 transition 卸下（捏合跟手不受拖）', board.style.transition === '', board.style.transition);
    check('G2：連按兩次後寬度維持在新值', board.style.width !== w0, board.style.width);
  }
  try {
    const Touch = H.window.Touch, TE = H.window.TouchEvent;
    if (Touch && TE) {
      const container = board.parentElement;
      const t1 = new Touch({ identifier: 1, target: container, clientX: 100, clientY: 100 });
      const t2 = new Touch({ identifier: 2, target: container, clientX: 200, clientY: 100 });
      container.dispatchEvent(new TE('touchstart', { bubbles: true, touches: [t1, t2], changedTouches: [t1, t2] }));
      const t2b = new Touch({ identifier: 2, target: container, clientX: 240, clientY: 100 });
      container.dispatchEvent(new TE('touchmove', { bubbles: true, touches: [t1, t2b], changedTouches: [t2b] }));
      await sleep(200);
      check('G2：捏合縮放不掛 transition（即時跟手）', board.style.transition === '', board.style.transition);
    } else {
      console.log('(skip pinch: jsdom 無 Touch/TouchEvent)');
    }
  } catch (e) { console.log('(skip pinch: ' + e.message + ')'); }
  check('G1/G2 段零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
  console.log('\nRESULT round2: ' + pass + ' pass / ' + fail + ' fail');
  H.window.close(); G.window.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
