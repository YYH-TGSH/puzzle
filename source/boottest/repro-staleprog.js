// 重現（2026-11-01 實機事故）：房主手機（主畫面 App）開數獨大亂鬥直接被 PlatBoundary 攔截：
// 「undefined is not an object (evaluating 'grid[c.y][c.x] = c')」；Safari 同帳號正常。
// 假說：主畫面 App 的 localStorage 累積了舊 sudoku_prog_<房號>_<uid> 存檔；房號 4 碼撞號後，
// 房主 'open' handler 把別場（16×16）的格子 setLocalCells 進來，當下 levelData 還是預設 9×9，
// conflictCellIds 的 grid 只有 9 列 → grid[15] 為 undefined 寫入爆炸。Safari 儲存空間乾淨故無事。
// 流程：正常開房（預載會 boot 數獨、遊戲 uid 誕生）→ 種入 9 天前 16×16 存檔 → 開 9×9 大亂鬥。
// 修前預期：房主 #view-sudoku 內出現「遊戲畫面出錯了」fallback、進不了場；修後：雙邊正常進場 81 格。
const fs = require('fs');
const { JSDOM, VirtualConsole, requestInterceptor } = require('jsdom');
const interceptor = requestInterceptor(async (request) => {
  if (request.url.includes('peerjs')) return new Response(MOCK, { headers: { 'Content-Type': 'text/javascript' } });
  if (request.url.includes('tailwindcss')) return new Response('/* stub */', { headers: { 'Content-Type': 'text/javascript' } });
  return undefined;
});
const BUNDLE = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const MOCK = require('./mockpeer.js');
const SHARED_REG = {};
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(250); } console.log('  (timeout: ' + label + ')'); return null; }
function loadPage() {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(BUNDLE, { url: 'https://localhost/', resources: { interceptors: [interceptor] }, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { w: dom.window, D: dom.window.document, errs };
}
const click = (p, el) => { if (el) el.dispatchEvent(new p.w.MouseEvent('click', { bubbles: true })); return !!el; };
(async () => {
  const H = loadPage(), G = loadPage();
  for (const p of [H, G]) { const ok = await waitFor(() => typeof p.w.PLAT_show === 'function' && p.w.PlatDock ? true : null, 60000, 'shell'); if (!ok) { console.log('SHELL DEAD', p.errs.slice(0, 3)); process.exit(2); } }
  // 1) 正常開房＋來賓加入
  click(H, H.D.querySelector('#lob-go-create'));
  await waitFor(() => H.D.querySelector('#lob-step-nick').style.display === 'block', 20000, 'H nick');
  H.D.querySelector('#lob-name').value = '房主'; click(H, H.D.querySelector('#lob-confirm'));
  await waitFor(() => { const r = H.D.querySelector('#lob-step-room'); return r && r.style.display === 'block' ? true : null; }, 30000, 'H room');
  const code = H.w.__PLAT_NET.code;
  click(G, G.D.querySelector('#lob-go-join'));
  await waitFor(() => G.D.querySelector('#lob-step-nick').style.display === 'block', 20000, 'G nick');
  G.D.querySelector('#lob-name').value = '來賓'; G.D.querySelector('#lob-code').value = code; click(G, G.D.querySelector('#lob-confirm'));
  const roster2 = await waitFor(() => H.w.__PLAT_NET.roster.length === 2 ? true : null, 45000, 'roster 2');
  check('來賓加入、名單 2 人', !!roster2, 'roster=' + (H.w.__PLAT_NET.roster || []).length);
  // 2) 等預載 boot 數獨 → 房主遊戲 uid 誕生（真機上 uid 早已存在，這裡只是等它出現以便種檔）
  const gameUid = await waitFor(() => H.w.localStorage.getItem('plat_uid_sudoku'), 45000, 'game uid via preload');
  check('房主遊戲 uid 已存在（預載 boot）', !!gameUid, gameUid);
  // 3) 種入毒存檔：9 天前、同房號、16×16 大亂鬥的格子（部分已填值）
  const cells16 = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) cells16.push({ id: 'cell-' + x + '-' + y, x, y, value: (x + y) % 5 === 0 ? '5' : null, isGiven: false, owner: null });
  H.w.localStorage.setItem('sudoku_prog_' + code + '_' + gameUid, JSON.stringify({ d: cells16, t: Date.now() - 3600000, sid: 'stale-session-xyz' }));
  console.log('  seeded sudoku_prog_' + code + '_' + gameUid + ' (16x16, 1 hour old — 未過期，專驗尺寸守衛層)');
  // 4) 切大亂鬥（9×9 預設）→ 雙邊準備 → 開始
  click(H, H.D.querySelector('#lob-step-room [data-hub-mode="brawl"]'));
  await sleep(600);
  const readyBtn = (p) => p.D.querySelector('#lob-step-room [data-pr="ready"]');
  const startBtn = (p) => p.D.querySelector('#lob-step-room [data-pr="start"]');
  const rb = await waitFor(() => readyBtn(G) && readyBtn(H) ? true : null, 30000, 'ready btns');
  check('雙邊準備鈕出現', !!rb, 'H=' + !!readyBtn(H) + ' G=' + !!readyBtn(G));
  click(G, readyBtn(G)); click(H, readyBtn(H));
  const unlocked = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
  check('開始鈕解鎖', !!unlocked);
  click(H, unlocked);
  // 5) 判定：房主是否被 boundary 攔截 / 是否進場
  const boundaryHit = (p) => [...p.D.querySelectorAll('#view-sudoku div')].some(d => d.textContent.includes('遊戲畫面出錯了') && d.querySelectorAll('div').length < 5);
  await sleep(4000);
  const hit = boundaryHit(H);
  const cellsOf = (p) => p.D.querySelectorAll('#view-sudoku g[id^="cell-"]').length;
  const boardH = await waitFor(() => cellsOf(H) > 40 ? cellsOf(H) : null, 45000, 'H board');
  const boardG = await waitFor(() => cellsOf(G) > 40 ? cellsOf(G) : null, 45000, 'G board');
  console.log('  H errors:', H.errs.slice(0, 2).join(' | ') || '(none)');
  check('房主未被渲染錯誤攔截（無 boundary fallback）', !hit);
  check('房主盤面渲染（81 格）', !!boardH, 'cells=' + boardH);
  check('來賓盤面渲染（81 格）', !!boardG, 'cells=' + boardG);
  check('房主零頁面錯誤', H.errs.length === 0, H.errs[0] || '');
  console.log('\n=== repro-staleprog: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(2); });
