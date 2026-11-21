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
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (timeout: ' + label + ')'); return null; }
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
  // ===== 數獨：格子＋數字鍵的「滾到鄰格放開」 =====
  {
    const reg = {};
    const H = loadPage(reg, 'HS', true), G = loadPage(reg, 'GS', true);
    await waitFor(() => (typeof H.window.PLAT_show === 'function' && H.window.__PLAT_NET) ? true : null, 120000, 'H shell');
    H.window.localStorage.setItem('sudoku_input_mode', 'cell'); // 格子先行：點格選格 → 點數字鍵填入
    await openRoom(H, G, 'sudoku', 'brawl');
    await waitFor(() => H.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length > 0 ? true : null, 90000, 'cells');
    await sleep(7000);
    const board = readBoard(H.document);
    const cellEl = (id) => H.document.querySelector('#view-sudoku g[id="cell-' + id + '"]');
    const center = (id) => { const [x, y] = id.split('-').map(Number); return [50 + x * 60, 50 + y * 60]; };
    const empties = Object.keys(board).filter(id => board[id] === 0);
    const E = empties.find(id => Number(id.split('-')[0]) < 8);
    const E2 = empties.find(id => id !== E);
    const F = empties.find(id => id !== E && id !== E2);
    const givenId = Object.keys(board).find(id => board[id] !== 0);
    const padBtn = (d) => [...H.document.querySelectorAll('#view-sudoku button')].find(b => (b.textContent || '').trim() === d && b.className.indexOf('key-btn') >= 0);
    const DIG = ['5', '3', '7', '1', '9', '2', '4', '6', '8'].find(d => padBtn(d));
    check('前置：找到空格與數字鍵', !!E && !!DIG, 'E=' + E + ' DIG=' + DIG);
    // S1 格子正例：E 右緣內側按下、滾進右鄰格 14px 放開 → 必須選中 E（舊制：被丟掉且 click 誤選鄰格）
    {
      const [cx, cy] = center(E); const nb = (Number(E.split('-')[0]) + 1) + '-' + E.split('-')[1];
      pev(H, cellEl(E), 'pointerdown', cx + 24, cy); await sleep(60);
      pev(H, cellEl(nb), 'pointerup', cx + 38, cy); await sleep(300);
      const pb = padBtn(DIG); pev(H, pb, 'pointerdown', 100, 100); await sleep(50); pev(H, pb, 'pointerup', 114, 100); await sleep(350);
      const b2 = readBoard(H.document);
      check('數獨格：滾到鄰格放開（14px）→ 作用在按下格（填入成功）', b2[E] === Number(DIG), 'E=' + b2[E] + ' want=' + DIG);
      check('數獨格：鄰格沒有被誤填', b2[nb] === board[nb], 'nb=' + b2[nb] + ' orig=' + board[nb]);
    }
    // S2 格子負例：F 中心按下、滑 46px 放開 → 作廢（先點題目格把選取移走，再點數字鍵不得填 F）
    {
      clickEl(H, cellEl(givenId)); await sleep(300);
      const [cx, cy] = center(F);
      pev(H, cellEl(F), 'pointerdown', cx, cy); await sleep(60);
      pev(H, cellEl(F), 'pointerup', cx + 46, cy); await sleep(300);
      const pb = padBtn(DIG); pev(H, pb, 'pointerdown', 100, 100); await sleep(50); pev(H, pb, 'pointerup', 100, 100); await sleep(350);
      check('數獨格：滑太遠（46px）放開 → 作廢、F 未被填', readBoard(H.document)[F] === 0, 'F=' + readBoard(H.document)[F]);
    }
    // S3 數字鍵負例＋正例：先乾淨點選 E2；數字鍵滑 46px → 不填；滑 12px → 填入
    {
      const [cx, cy] = center(E2);
      pev(H, cellEl(E2), 'pointerdown', cx, cy); await sleep(60); pev(H, cellEl(E2), 'pointerup', cx, cy); await sleep(300);
      const pb = padBtn(DIG); pev(H, pb, 'pointerdown', 100, 100); await sleep(50); pev(H, pb, 'pointerup', 100, 146); await sleep(350);
      check('數獨鍵：滑太遠（46px）→ 不填入', readBoard(H.document)[E2] === 0, 'E2=' + readBoard(H.document)[E2]);
      const pb2 = padBtn(DIG); pev(H, pb2, 'pointerdown', 100, 100); await sleep(50); pev(H, pb2, 'pointerup', 112, 100); await sleep(350);
      check('數獨鍵：滾 12px 放開 → 照常填入按下鍵', readBoard(H.document)[E2] === Number(DIG), 'E2=' + readBoard(H.document)[E2]);
    }
    check('數獨段零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
    H.window.close(); G.window.close();
  }
  // ===== 數橋：橋樑點按的 22px 容錯（舊制 12 SVG 單位在手機只值約 6–12 實體 px） =====
  {
    const reg = {};
    const H = loadPage(reg, 'HH', true), G = loadPage(reg, 'GH', true);
    await openRoom(H, G, 'hashi', 'coop');
    const svg = await waitFor(() => { const s = [...H.document.querySelectorAll('#view-hashi svg')].find(x => [...x.querySelectorAll('text')].some(t => /^[1-8]$/.test((t.textContent || '').trim()))); return s || null; }, 90000, 'hashi board');
    await sleep(6500);
    const pevP = (el, type, x, y) => { const ev = new H.window.PointerEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, pointerId: 1, isPrimary: true }); el.dispatchEvent(ev); };
    const lines = () => svg.querySelectorAll('line.pointer-events-none').length;
    const zones = [...svg.querySelectorAll('rect.bridge-hotzone')];
    check('數橋前置：有可點的橋樑熱區', zones.length > 1, 'zones=' + zones.length);
    const ctr = (r) => [Number(r.getAttribute('x')) + Number(r.getAttribute('width')) / 2, Number(r.getAttribute('y')) + Number(r.getAttribute('height')) / 2];
    const L0 = lines();
    {
      const [zx, zy] = ctr(zones[0]);
      pevP(zones[0], 'pointerdown', zx, zy); await sleep(60); pevP(zones[0], 'pointerup', zx + 18, zy); await sleep(400);
      check('數橋：點橋滾 18px 放開 → 橋架起來了（22px 容錯）', lines() === L0 + 1, 'lines ' + L0 + '->' + lines());
    }
    {
      const z2 = zones.find(z => z !== zones[0]); const [zx, zy] = ctr(z2); const L1 = lines();
      pevP(z2, 'pointerdown', zx, zy); await sleep(60); pevP(z2, 'pointerup', zx + 42, zy); await sleep(400);
      check('數橋：點橋滑 42px 放開 → 作廢、沒有新橋', lines() === L1, 'lines ' + L1 + '->' + lines());
    }
    check('數橋段零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
    H.window.close(); G.window.close();
  }
  console.log('\nRESULT tap-drift: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
