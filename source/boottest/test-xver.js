// 跨版本互通：v1.13.0 站台樹 × v1.14.1 站台樹（兩支手機更新時間不同的真實情境）
// A) 舊房主 × 新來賓：數獨合作開局  B) 新房主 × 舊來賓：數獨合作開局（新殼會對舊來賓送 hubcfg mines）
// C) 舊房主 × 新來賓：錦標賽 3 局（force-end 帶過）→ 正常結束
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const http = require('http');
const path = require('path');
const mock = require('./mockpeer.js');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
function serve(root, port) {
  return new Promise(res => {
    const srv = http.createServer((req, resp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      const fp = path.join(root, p);
      fs.readFile(fp, (e, data) => { if (e) { resp.writeHead(404); resp.end('nf'); } else { resp.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); resp.end(data); } });
    });
    srv.listen(port, '127.0.0.1', () => res(srv));
  });
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
async function loadPage(port, label) {
  const html0 = await (await fetch('http://127.0.0.1:' + port + '/index.html')).text();
  const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
  if (!html0.includes(marker)) { console.log('PEER MARKER MISSING on port ' + port); process.exit(2); }
  const html = html0.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
  const errs = [];
  const __errT0 = Date.now(); const stamp = (m, stack) => '[+' + ((Date.now() - __errT0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errs.push(stamp(String(m))));
  const dom = new JSDOM(html, { url: 'http://127.0.0.1:' + port + '/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {};
      w.fetch = (u, o) => fetch(new URL(u, 'http://127.0.0.1:' + port + '/').href, o).then(r => ({ ok: r.ok, status: r.status, text: () => r.text() }));
      w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); });
    } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block'; };
async function makeRoom(H, G, hn, gn) {
  clickEl(H, H.document.querySelector('#lob-go-create'));
  await waitFor(() => H.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'H nick');
  setInput(H.window, H.document.querySelector('#lob-name'), hn);
  clickEl(H, H.document.querySelector('#lob-confirm'));
  await waitFor(() => hubRoom(H) && H.window.__PLAT_NET.code, 150000, 'H room');
  const code = H.window.__PLAT_NET.code;
  clickEl(G, G.document.querySelector('#lob-go-join'));
  await waitFor(() => G.document.querySelector('#lob-step-nick').style.display === 'block', 60000, 'G nick');
  setInput(G.window, G.document.querySelector('#lob-name'), gn);
  setInput(G.window, G.document.querySelector('#lob-code'), code);
  clickEl(G, G.document.querySelector('#lob-confirm'));
  await waitFor(() => H.window.__PLAT_NET.roster.length >= 2 && hubRoom(G), 90000, 'roster2');
  return code;
}
async function sudokuCoop(H, G, tag) {
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]')); await sleep(400);
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const sb = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return b && !b.disabled ? b : null; }, 90000, 'start ' + tag);
  check(tag + ' 房主開始鈕啟用', !!sb);
  if (!sb) return;
  clickEl(H, sb);
  const inM = await waitFor(() => H.window.__PLAT_NET.inMatch === 'sudoku' && G.window.__PLAT_NET.inMatch === 'sudoku' ? true : null, 60000, 'inMatch ' + tag);
  check(tag + ' 雙邊 inMatch=sudoku', !!inM, 'H=' + H.window.__PLAT_NET.inMatch + ' G=' + G.window.__PLAT_NET.inMatch);
  const liveH = await waitFor(() => { const v = H.document.querySelector('#view-sudoku'); return v && v.textContent.includes('合作模式') && v.textContent.includes('玩家') ? true : null; }, 90000, 'H board ' + tag);
  const liveG = await waitFor(() => { const v = G.document.querySelector('#view-sudoku'); return v && v.textContent.includes('合作模式') && v.textContent.includes('玩家') ? true : null; }, 90000, 'G board ' + tag);
  check(tag + ' 房主數獨合作盤面出現', !!liveH);
  check(tag + ' 來賓數獨合作盤面出現', !!liveG);
}
(async () => {
  const sOld = await serve('/tmp/site-v1130', 8901);
  const sNew = await serve('/home/hatch/workspace/platform-site', 8902);
  // ===== A) 舊房主 × 新來賓 =====
  {
    const H = await loadPage(8901, 'H-old'), G = await loadPage(8902, 'G-new');
    for (const p of [H, G]) await waitFor(() => typeof p.window.PLAT_show === 'function' && p.window.PlatDock, 600000, p.label + ' shell');
    await makeRoom(H, G, '舊主', '新客');
    check('A 跨版建房/入房成功', H.window.__PLAT_NET.roster.length >= 2);
    await sudokuCoop(H, G, 'A');
    check('A 零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
    H.window.close(); G.window.close(); await sleep(500);
  }
  // ===== B) 新房主 × 舊來賓 =====
  {
    const H = await loadPage(8902, 'H-new'), G = await loadPage(8901, 'G-old');
    for (const p of [H, G]) await waitFor(() => typeof p.window.PLAT_show === 'function' && p.window.PlatDock, 600000, p.label + ' shell');
    await makeRoom(H, G, '新主', '舊客');
    check('B 跨版建房/入房成功（舊來賓收到 mines hubcfg 沒壞）', H.window.__PLAT_NET.roster.length >= 2);
    await sudokuCoop(H, G, 'B');
    check('B 零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
    H.window.close(); G.window.close(); await sleep(500);
  }
  // ===== C) 舊房主 × 新來賓：錦標賽 3 局 =====
  {
    const H = await loadPage(8901, 'H-old'), G = await loadPage(8902, 'G-new');
    for (const p of [H, G]) await waitFor(() => typeof p.window.PLAT_show === 'function' && p.window.PlatDock, 600000, p.label + ' shell');
    await makeRoom(H, G, '舊主', '新客');
    clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
    await waitFor(() => H.document.querySelector('#lob-tourn-setup'), 30000, 'tourn setup');
    H.document.querySelector('#t-rounds').value = '3';
    H.document.querySelector('#t-order').value = 'alt-s';
    clickEl(H, H.document.querySelector('#t-start'));
    const seq = ['sudoku', 'hashi', 'sudoku'];
    let okAll = true;
    for (let r = 0; r < 3; r++) {
      const inR = await waitFor(() => H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.inMatch === seq[r] ? true : null, 120000, 'C round ' + (r + 1));
      if (!inR) { okAll = false; check('C 第 ' + (r + 1) + ' 局進場 ' + seq[r], false); break; }
      await sleep(2500);
      H.window.__PLAT_TOURN_FORCEEND();
      if (r < 2) {
        const back = await waitFor(() => hubRoom(H) && H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.tourn.history.length === r + 1 ? true : null, 90000, 'C settle ' + (r + 1));
        if (!back) { okAll = false; check('C 第 ' + (r + 1) + ' 局結算', false); break; }
        const nb = await waitFor(() => { const b = H.document.querySelector('#t-next'); return b && !b.disabled ? b : null; }, 60000, 'C next');
        clickEl(H, nb);
      }
    }
    if (okAll) {
      const ended = await waitFor(() => { const t = H.window.__PLAT_NET.tourn; return t && t.phase === 'ended' ? true : null; }, 90000, 'C ended');
      check('C 跨版錦標賽完整結束', !!ended && !!H.window.__PLAT_NET.tourn.champion);
      const gEnd = await waitFor(() => { const t = G.window.__PLAT_NET.tourn; return t && t.phase === 'ended' ? true : null; }, 60000, 'C guest ended');
      check('C 新來賓端同步結束', !!gEnd);
    }
    check('C 零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + '|' + (G.errors[0] || ''));
    H.window.close(); G.window.close();
  }
  console.log('\n=== xver: ' + pass + ' passed, ' + fail + ' failed ===');
  sOld.close(); sNew.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
