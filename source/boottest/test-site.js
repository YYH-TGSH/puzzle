// 正式站模式回歸（v1.19.0 改版）：部署＝單一 index.html（殼＋三款預編譯遊戲＋全部函式庫 inline）。
// 病史：多檔案部署被快取分開計時→混版（v1.14.1/v1.18.0 兩次實機事故）；v1.18.0 的 fetch 懶載入版
// 本測試前身驗的是「進房預載、開局不抓」。單檔化後改驗：①index 本體即完整包（>900KB、含 code-* 與
// vendor 區塊）②全程零遊戲檔案請求（/js/、/css/ 一個都不該出現）③進房間 hooks 即就緒（預載＝inline
// 直接執行）④雙邊照常進數獨對局。伺服器送檔時剝除 data-vendor="peerjs"/"tailwind" 兩塊（比照舊版
// 攔截 stub：mock Peer 走 beforeParse 注入、Tailwind 不影響功能斷言），其餘 vendor（React 等）用真碼。
const http = require('http');
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole, requestInterceptor } = require('jsdom');
const SITE = '/home/hatch/workspace/platform-site';
const mock = require('./mockpeer.js');
const fetchLog = [];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
function stripForTest(html) {
  return html
    .replace(/<script data-vendor="peerjs">[\s\S]*?<\/script>/, '<script>/* peerjs stripped: mock via beforeParse */</script>')
    .replace(/<script data-vendor="tailwind">[\s\S]*?<\/script>/, '<script>/* tailwind stripped in tests */</script>');
}
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname === '/' ? '/index.html' : u.pathname;
  fetchLog.push(p);
  const file = path.join(SITE, p);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    if (p === '/index.html') res.end(stripForTest(data.toString('utf8'))); else res.end(data);
  });
});
const interceptor = requestInterceptor(async (request) => {
  // 單檔部署不該有任何外部請求；真出現就 stub 掉並讓 fetchLog/主控台留痕（jsdom 只抓資源、不含 fetch API）
  fetchLog.push('EXT:' + request.url);
  return new Response('/* ext stub */', { headers: { 'Content-Type': 'text/javascript' } });
});
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(origin, label) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  return { errors: errs, label, vc, opts: { resources: { interceptors: [interceptor] }, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.eval(mock); w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } } };
}
(async () => {
  // ① 單檔完整性（直接讀部署檔）
  const rawIndex = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  check('index 單一檔案 > 900KB', rawIndex.length > 900 * 1024, Math.round(rawIndex.length / 1024) + 'KB');
  check('index 內含三款遊戲程式與 vendor 區塊', ['id="code-sudoku"', 'id="code-hashi"', 'id="code-mines"', 'data-vendor="react"', 'data-vendor="peerjs"', 'data-vendor="tailwind"'].every(s => rawIndex.includes(s)));
  check('index 無外部 script 參照', !/<script[^>]+src="http/.test(rawIndex));
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + server.address().port + '/';
  async function loadReal(label) {
    const p = loadPage(origin, label);
    const htmlText = await (await fetch(origin)).text();
    const dom = new JSDOM(htmlText, Object.assign({ url: origin }, p.opts));
    p.window = dom.window; p.document = dom.window.document; p.dom = dom;
    return p;
  }
  const H = await loadReal('H'); const G = await loadReal('G');
  const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 90000, p.label + ' shell'); if (!ok) { console.log('SHELL NOT READY', p.label, p.errors.slice(0, 3)); process.exit(2); } }
  check('正式站雙頁殼就緒（單檔 index）', true);
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  await waitFor(() => hubRoom(H), 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙'; G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  await waitFor(() => hubRoom(G), 60000, 'G room');
  await waitFor(() => H.window.__PLAT_NET.roster.length === 2 ? true : null, 30000, 'roster 2');
  // ③ 預載＝inline 直接執行：進房間後 hooks 應已就緒，且伺服器沒收過任何遊戲檔案請求
  const hooksReady = await waitFor(() => (H.window.__PLAT_HOOKS_sudoku && G.window.__PLAT_HOOKS_sudoku) ? true : null, 30000, 'preload hooks');
  check('進房間即預載完成（雙邊 hooks 就緒）', !!hooksReady);
  const fileReqs = fetchLog.filter(x => x.startsWith('/js/') || x.startsWith('/css/') || x.startsWith('EXT:'));
  check('全程零遊戲檔案/外部請求（只有 index 本體）', fileReqs.length === 0, fileReqs.join(',') || 'requests=' + fetchLog.join(','));
  // 分頁反灰（來賓）
  const gTab = G.document.querySelector('#lob-step-room [data-rtab="sudoku"]');
  check('來賓分頁反灰（opacity .45）', !!gTab && (gTab.getAttribute('style') || '').includes('opacity:.45'), gTab && gTab.getAttribute('style'));
  const hTab = H.document.querySelector('#lob-step-room [data-rtab="sudoku"]');
  check('房主分頁不反灰', !!hTab && !(hTab.getAttribute('style') || '').includes('opacity:.45'));
  // 切大亂鬥 → 雙邊準備 → 開始
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="brawl"]'));
  await sleep(800);
  const readyBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="ready"]');
  const startBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="start"]');
  await waitFor(() => readyBtn(G) && readyBtn(H), 20000, 'ready btns');
  clickEl(G, readyBtn(G)); clickEl(H, readyBtn(H));
  const unlocked = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
  check('全員準備後開始鈕解鎖', !!unlocked);
  clickEl(H, unlocked);
  const rosterGone = (p) => { const r = p.document.querySelector('[data-pr-region="roster"]'); return !r || r.style.display === 'none' || !p.document.querySelector('#lob-step-room') || p.document.querySelector('#lob-step-room').style.display === 'none'; };
  const inGameH = await waitFor(() => rosterGone(H) && H.document.querySelector('#view-sudoku').classList.contains('active') ? true : null, 60000, 'H in game');
  const inGameG = await waitFor(() => rosterGone(G) && G.document.querySelector('#view-sudoku').classList.contains('active') ? true : null, 60000, 'G in game');
  check('房主進場（離開房間頁、數獨畫面啟用）', !!inGameH);
  check('來賓進場（離開房間頁、數獨畫面啟用）', !!inGameG);
  const cellsOf = (p) => p.document.querySelectorAll('#view-sudoku g[id^="cell-"]').length;
  const boardH = await waitFor(() => cellsOf(H) > 40 ? cellsOf(H) : null, 30000, 'H board cells');
  const boardG = await waitFor(() => cellsOf(G) > 40 ? cellsOf(G) : null, 30000, 'G board cells');
  check('房主盤面渲染（格子 > 40）', !!boardH, 'cells=' + boardH);
  check('來賓盤面渲染（格子 > 40）', !!boardG, 'cells=' + boardG);
  check('雙邊零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
  console.log('\n=== site: ' + pass + ' passed, ' + fail + ' failed ===');
  server.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); try { server.close(); } catch (x) {} process.exit(2); });
