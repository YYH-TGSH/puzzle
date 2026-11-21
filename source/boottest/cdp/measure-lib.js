const WebSocket = require('/home/hatch/workspace/xueba/tests/node_modules/ws');
const http = require('http');
const { spawn } = require('child_process');
const crypto = require('crypto'); const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function getJson(port, path) { return new Promise((resolve, reject) => { http.get({ host: '127.0.0.1', port, path }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); }).on('error', reject); }); }
async function start(w, h, url, port, dsf) {
  port = port || 9224;
  const polPath = '/tmp/webgl-policy.txt'; if (!fs.existsSync(polPath)) fs.writeFileSync(polPath, 'hatch-webgl-all-origins-v1\n');
  const polSha = crypto.createHash('sha256').update(fs.readFileSync(polPath)).digest('hex');
  const chrome = spawn('/opt/meta-chromium/chrome', ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server', '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks', '--hatch-webgl-allowed-domains-file=' + polPath, '--hatch-webgl-allowed-domains-sha256=' + polSha, '--remote-debugging-port=' + port, '--user-data-dir=/tmp/chrome-plat-lib-' + w + '-' + port, '--window-size=' + w + ',' + h].concat(dsf ? ['--force-device-scale-factor=' + dsf] : [], ['about:blank']), { stdio: 'ignore', env: Object.assign({}, process.env, { DBUS_SESSION_BUS_ADDRESS: '/dev/null' }) });
  let targets = null;
  for (let i = 0; i < 40; i++) { try { targets = await getJson(port, '/json/list'); if (targets && targets.length) break; } catch (e) {} await sleep(500); }
  const target = targets.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  let id = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
  ws.on('message', raw => { const msg = JSON.parse(raw); if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result); } });
  await new Promise(r => ws.on('open', r));
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400)); return r.result.value; };
  await ev(`new Promise(res => { const t = setInterval(() => { if (window.PLAT_show && window.PlatDock) { clearInterval(t); res(1); } }, 300); setTimeout(() => res(0), 25000); })`);
  return { ev, send, sleep, done: () => { try { chrome.kill('SIGKILL'); } catch (e) {} } };
}
module.exports = { start, sleep };
