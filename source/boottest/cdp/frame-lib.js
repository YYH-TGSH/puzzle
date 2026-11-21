// 在 iframe（390/430 CSS 寬）內以主世界 context 執行——真排版、真 innerWidth
const WebSocket = require('/home/hatch/workspace/xueba/tests/node_modules/ws');
const http = require('http');
const { spawn } = require('child_process');
const crypto = require('crypto'); const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function getJson(port, path) { return new Promise((resolve, reject) => { http.get({ host: '127.0.0.1', port, path }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); }).on('error', reject); }); }
async function startFrame(cssW, url) {
  const port = 9227;
  const polPath = '/tmp/webgl-policy.txt'; if (!fs.existsSync(polPath)) fs.writeFileSync(polPath, 'hatch-webgl-all-origins-v1\n');
  const polSha = crypto.createHash('sha256').update(fs.readFileSync(polPath)).digest('hex');
  const wrapPath = '/tmp/plat-wrap-' + cssW + '-' + Date.now() + '.html';
  fs.writeFileSync(wrapPath, '<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}iframe{border:0;display:block;width:' + cssW + 'px;height:844px}</style></head><body><iframe src="file:///home/hatch/workspace/platform-site/index.html"></iframe></body></html>');
  const chrome = spawn('/opt/meta-chromium/chrome', ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server', '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks', '--hatch-webgl-allowed-domains-file=' + polPath, '--hatch-webgl-allowed-domains-sha256=' + polSha, '--remote-debugging-port=' + port, '--user-data-dir=/tmp/chrome-plat-frame-' + cssW + '-' + Date.now(), '--window-size=560,960', 'about:blank'], { stdio: 'ignore', env: Object.assign({}, process.env, { DBUS_SESSION_BUS_ADDRESS: '/dev/null' }) });
  let targets = null;
  for (let i = 0; i < 40; i++) { try { targets = await getJson(port, '/json/list'); if (targets && targets.length) break; } catch (e) {} await sleep(500); }
  const target = targets.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  let id = 0; const pending = new Map(); const contexts = [];
  const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
  ws.on('message', raw => { const msg = JSON.parse(raw); if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result); } else if (msg.method === 'Runtime.executionContextCreated') contexts.push(msg.params.context); });
  await new Promise(r => ws.on('open', r));
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: 'file://' + wrapPath });
  let childFrame = null;
  for (let i = 0; i < 30 && !childFrame; i++) { await sleep(500); const tree = await send('Page.getFrameTree'); childFrame = tree.frameTree.childFrames && tree.frameTree.childFrames[0] && tree.frameTree.childFrames[0].frame; }
  if (!childFrame) throw new Error('no child frame');
  let ctx = null;
  for (let i = 0; i < 40 && !ctx; i++) { ctx = contexts.find(c => c.auxData && c.auxData.frameId === childFrame.id && c.auxData.isDefault); if (!ctx) await sleep(400); }
  if (!ctx) throw new Error('no frame context');
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, contextId: ctx.id, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result.value; };
  await ev(`new Promise(res => { const t = setInterval(() => { if (window.PLAT_show && window.PlatDock) { clearInterval(t); res(1); } }, 300); setTimeout(() => res(0), 30000); })`);
  return { ev, sleep, done: () => { try { chrome.kill('SIGKILL'); } catch (e) {} } };
}
module.exports = { startFrame, sleep };
