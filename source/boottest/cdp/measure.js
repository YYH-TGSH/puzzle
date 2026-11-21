// 真引擎排版量測（headless Chromium CDP、真 window-size、不用 Emulation override——學霸 AGENTS 教訓：override 會引進假位移）
// 用法: NODE_PATH=~/workspace/xueba/tests/node_modules node measure.js <width> <height> [url]
const WebSocket = require('ws');
const http = require('http');
const { spawn } = require('child_process');
const W = parseInt(process.argv[2] || '390'), H = parseInt(process.argv[3] || '844');
const URL = process.argv[4] || 'file:///home/hatch/workspace/platform-site/index.html';
const PORT = 9223;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function getJson(path) { return new Promise((resolve, reject) => { http.get({ host: '127.0.0.1', port: PORT, path }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); }).on('error', reject); }); }
(async () => {
  const crypto = require('crypto'); const fs2 = require('fs');
  const polPath = '/tmp/webgl-policy.txt'; if (!fs2.existsSync(polPath)) fs2.writeFileSync(polPath, 'hatch-webgl-all-origins-v1\n');
  const polSha = crypto.createHash('sha256').update(fs2.readFileSync(polPath)).digest('hex');
  const chrome = spawn('/opt/meta-chromium/chrome', ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server', '--hatch-webgl-allowed-domains-file=' + polPath, '--hatch-webgl-allowed-domains-sha256=' + polSha, '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/chrome-plat-' + W, '--window-size=' + W + ',' + H, 'about:blank'], { stdio: 'ignore', env: Object.assign({}, process.env, { DBUS_SESSION_BUS_ADDRESS: '/dev/null' }) });
  try {
    let targets = null;
    for (let i = 0; i < 30; i++) { try { targets = await getJson('/json/list'); if (targets) break; } catch (e) { await sleep(500); } }
    let target = targets.find(t => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
    let id = 0; const pending = new Map();
    const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
    ws.on('message', raw => { const msg = JSON.parse(raw); if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result); } });
    await new Promise(r => ws.on('open', r));
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.navigate', { url: URL });
    const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400)); return r.result.value; };
    await ev(`new Promise(res => { const t = setInterval(() => { if (window.PLAT_show && window.PlatDock) { clearInterval(t); res(1); } }, 300); setTimeout(() => res(0), 25000); })`);
    const MEASURE = `(function(){
      var iw = window.innerWidth;
      var de = document.documentElement;
      var out = { innerWidth: iw, scrollWidth: de.scrollWidth, bodyScrollWidth: document.body ? document.body.scrollWidth : -1, offenders: [] };
      var view = document.querySelector('.plat-view.active') || document.querySelector('[id^="view-"].active');
      out.viewId = view ? view.id : null;
      if (view) {
        var els = view.querySelectorAll('*');
        for (var i = 0; i < els.length; i++) {
          var el = els[i]; var r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > iw + 1 || r.left < -1)) {
            out.offenders.push({ tag: el.tagName, cls: String(el.className && el.className.baseVal !== undefined ? '' : el.className).slice(0, 70), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), txt: (el.textContent || '').replace(/\\s+/g, ' ').slice(0, 40) });
          }
        }
        out.offenders.sort(function(a, b){ return (b.right - iw) - (a.right - iw); });
        out.offenders = out.offenders.slice(0, 6);
        var card = view.querySelector('[data-ph-card]') || view.querySelector('.plat-home-card');
        out.cardAttr = card ? 'data-ph-card' : null;
        if (card) { var cr = card.getBoundingClientRect(); out.card = { left: Math.round(cr.left), right: Math.round(cr.right), w: Math.round(cr.width) }; }
      }
      return out;
    })()`;
    for (const g of ['home', 'sudoku', 'hashi', 'mines', 'akari']) {
      await ev(`window.PLAT_show('${g}'); 1`);
      await sleep(3000);
      const m = await ev(MEASURE);
      console.log('MEASURE ' + g + ' ' + JSON.stringify(m));
    }
    process.exit(0);
  } finally { try { chrome.kill('SIGKILL'); } catch (e) {} }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
