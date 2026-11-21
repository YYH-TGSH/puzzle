// 真引擎排版寬度回歸（headless Chromium CDP、真 window-size＋DSF 模擬手機 CSS 寬；不用 jsdom——jsdom 沒有排版引擎，量不到溢出）
// 斷言：四款主畫面 scrollWidth ≤ innerWidth 且無元素 rect 超出 viewport（left<-1 或 right>iw+1）。
// 對局/教學/設定畫面同法量測列入 log（僅主畫面為硬斷言；對局盤面可縮放捲動、屬設計內）。
// 執行：node test-layout-width.js（需 /opt/meta-chromium/chrome；ws 模組借學霸 tests 的 node_modules）
const base = require('/home/hatch/workspace/boottest/cdp/frame-lib.js');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = '/home/hatch/workspace';
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('#')[0].split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); res.end(d); } }); });
server.on('error', () => {}); server.listen(8913, '127.0.0.1');
const BUNDLE = 'file:///home/hatch/workspace/platform/platform-v1-test.html';
let pass = 0, fail = 0; const failed = [];
function check(name, ok, extra) { if (ok) { pass++; console.log('✅ ' + name); } else { fail++; failed.push(name); console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const MEASURE = `(function(){
  var iw = window.innerWidth; var out = { iw: iw, sw: document.documentElement.scrollWidth, offenders: [] };
  var scopes = [];
  var view = document.querySelector('.plat-view.active'); if (view) scopes.push(view);
  out.phBtns = document.querySelectorAll('[data-ph]').length;
  document.querySelectorAll('#plat-tutorial, #plat-setup, #plat-leave-menu').forEach(function(el){ if (el.offsetParent !== null || getComputedStyle(el).position === 'fixed') scopes.push(el); });
  var seen = new Set();
  scopes.forEach(function(sc){ sc.querySelectorAll('*').forEach(function(el){ if (seen.has(el)) return; seen.add(el); var r = el.getBoundingClientRect(); if (r.width > 0 && (r.right > iw + 1 || r.left < -1)) out.offenders.push({ cls: String(el.className).slice(0, 60), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) }); }); });
  out.offenders = out.offenders.slice(0, 5);
  return out;
})()`;
async function runWidth(cssW) {
  const { ev, done } = await base.startFrame(cssW, BUNDLE);
  try {
    const iw0 = await ev('window.innerWidth');
    console.log('--- viewport cssW=' + cssW + ' innerWidth=' + iw0 + ' ---');
    for (const g of ['sudoku', 'hashi', 'mines', 'akari']) {
      await ev(`window.PLAT_show('${g}'); 1`); await base.sleep(3200);
      const home = await ev(MEASURE);
      console.log('WIDTH ' + g + ' home ' + JSON.stringify(home));
      check(g + ' 主畫面 @' + cssW + ' 無橫向溢出', home.phBtns > 0 && home.sw <= home.iw && home.offenders.length === 0, 'phBtns=' + home.phBtns + ' ' + JSON.stringify(home.offenders));
      // 教學 overlay
      await ev(`(function(){ var b = document.querySelector('.plat-view.active [data-ph="tutorial"]'); if (b) b.click(); return !!b; })()`);
      await base.sleep(1200);
      console.log('WIDTH ' + g + ' tutorial ' + JSON.stringify(await ev(MEASURE)));
      await ev(`(function(){ var b = document.querySelector('#plat-tutorial [data-ptu="close"]'); if (b) b.click(); return 1; })()`);
      await base.sleep(600);
      // 單機設定 overlay + 對局畫面
      await ev(`(function(){ var b = document.querySelector('.plat-view.active [data-ph="solo"]'); if (b) b.click(); return !!b; })()`);
      await base.sleep(1200);
      console.log('WIDTH ' + g + ' setup ' + JSON.stringify(await ev(MEASURE)));
      await ev(`(function(){ var c = document.querySelector('#plat-setup [data-pse-card]'); if (c) c.click(); var s = document.querySelector('#plat-setup [data-pse="start"]'); if (s) s.click(); return 1; })()`);
      await base.sleep(4500);
      console.log('WIDTH ' + g + ' game ' + JSON.stringify(await ev(MEASURE)));
      await ev(`(function(){ var l = document.querySelector('[data-ptc="leave"]'); if (l) l.click(); return 1; })()`);
      await base.sleep(700);
      await ev(`(function(){ var h = document.querySelector('[data-plm="home"]'); if (h) h.click(); return 1; })()`);
      await base.sleep(1200);
    }
  } finally { done(); }
}
(async () => {
  await runWidth(390);
  await runWidth(430);
  server.close();
  console.log('\nRESULT layout-width: ' + pass + ' pass / ' + fail + ' fail' + (failed.length ? ' → ' + failed.join('; ') : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
