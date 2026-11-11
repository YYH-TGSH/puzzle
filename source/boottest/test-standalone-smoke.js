// 獨立版開機 smoke（v1.64.1 新增）：三款脫離平台殼、以各自獨立入口開機到主畫面、零未捕捉錯誤。
// 數獨/數橋 serve 各自 site 目錄（CDN 以 platform/vendor 與 tools 的本地快照攔截替代）；
// 踩地雷無獨立 index——以最小宿主頁載入 build 產出的 app.compiled.js（等同獨立執行其程式本體）。
const fs = require('fs');
const path = require('path');
const http = require('http');
const { JSDOM, VirtualConsole, requestInterceptor } = require('jsdom');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(250); } console.log('  (timeout: ' + label + ')'); return null; }
const V = '/home/hatch/workspace/platform/vendor/', T = '/home/hatch/workspace/platform/tools/';
const CDN = [
  ['react.production.min.js', V + 'react.js'], ['react-dom.production.min.js', V + 'react-dom.js'],
  ['@babel/standalone', T + 'babel7.min.js'], ['babel-standalone@6', T + 'babel6.min.js'],
  ['peerjs', V + 'peerjs.js'], ['cdn.tailwindcss.com', V + 'tailwind.js'], ['regenerator', V + 'regenerator.js']
];
let ORIGIN = '';
const interceptor = requestInterceptor(async (request) => {
  if (ORIGIN && request.url.startsWith(ORIGIN)) return undefined; // 同源（本地 server）放行預設載入——不可 stub，否則遊戲檔案變空殼
  for (const [pat, file] of CDN) if (request.url.includes(pat)) return new Response(fs.readFileSync(file), { headers: { 'Content-Type': 'text/javascript' } });
  return new Response('/* ext stub */', { headers: { 'Content-Type': 'text/javascript' } });
});
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
const ROOTS = { '/sudoku': '/home/hatch/workspace/sudoku-site', '/hashi': '/home/hatch/workspace/hashi-site' };
const minesCompiled = '/home/hatch/workspace/platform/.build/plat-mines-compiled.js';
// 注意：platform 的 compile.js 會把地雷掛載點改為 #mines-root 並包 window.PlatBoundary（殼的錯誤邊界）——
// 宿主頁比照提供掛載點與一個直通 PlatBoundary，使被測的是遊戲本體的獨立開機路徑。
const minesHost = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div id="mines-root"></div>' +
  '<script src="/vendor/react.js"></script><script src="/vendor/react-dom.js"></script>' +
  '<script>window.PlatBoundary = function (p) { return p.children; };</script>' +
  '<script src="/mines/app.compiled.js"></script></body></html>';
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/mines/' || p === '/mines/index.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(minesHost); return; }
  if (p === '/mines/app.compiled.js') { res.writeHead(200, { 'Content-Type': 'text/javascript' }); res.end(fs.readFileSync(minesCompiled)); return; }
  if (p.startsWith('/vendor/')) { const f = V + path.basename(p); if (fs.existsSync(f)) { res.writeHead(200, { 'Content-Type': 'text/javascript' }); res.end(fs.readFileSync(f)); return; } }
  for (const pre of Object.keys(ROOTS)) if (p.startsWith(pre + '/')) {
    const f = path.join(ROOTS[pre], p.slice(pre.length + 1) || 'index.html');
    if (fs.existsSync(f)) { res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f)); return; }
  }
  res.writeHead(404); res.end('nf');
});
function loadPage(url, label) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(undefined, { url, resources: { interceptors: [interceptor] }, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { dom, errs };
}
(async () => {
  check('地雷 compiled 產物存在（先跑 build.py）', fs.existsSync(minesCompiled));
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port; ORIGIN = base;
  const cases = [
    ['/sudoku/index.html', '數獨', t => t.includes('單機挑戰') || t.includes('每日挑戰')],
    ['/hashi/index.html', '數橋', t => t.includes('數橋') && (t.includes('單機') || t.includes('開始'))],
    ['/mines/index.html', '踩地雷', t => t.includes('單機挑戰')]
  ];
  for (const [route, name, marker] of cases) {
    // 以 fetch 先取 HTML 再建 JSDOM（url 指回 server 供相對資源載入）
    const htmlText = await (await fetch(base + route)).text();
    const errs = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
    vc.on('error', m => errs.push(String(m)));
    const dom = new JSDOM(htmlText, { url: base + route, resources: { interceptors: [interceptor] }, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) { w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
    const w = dom.window;
    const root = await waitFor(() => { const el = w.document.getElementById('root') || w.document.getElementById('mines-root'); return el && marker(el.textContent || '') ? el : null; }, 45000, name + ' 主畫面');
    check(name + ' 獨立版開機到主畫面', !!root);
    check(name + ' 獨立版零未捕捉錯誤', errs.length === 0, errs.slice(0, 2).join(' | '));
    dom.window.close();
  }
  server.close();
  console.log(`\n=== standalone-smoke: ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
