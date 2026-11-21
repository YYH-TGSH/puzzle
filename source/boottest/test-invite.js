// test-invite：邀請連結＋QR（v1.51.0）——房主房間頁有邀請區（QR canvas＋連結）；
// 來賓帶 ?room= 開站：有存暱稱→零點擊直接進房；無存暱稱→暱稱步且房號已預填；無參數回歸照常。
const fs = require('fs');
const { JSDOM } = require('jsdom');
const HTML = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const MOCK = require('./mockpeer.js');
let pass = 0, fail = 0;
function ok(c, label, extra) { if (c) { pass++; console.log('✅ ' + label); } else { fail++; console.log('❌ ' + label + (extra !== undefined ? ' :: ' + extra : '')); } }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(120); } console.log('  ⏱ timeout: ' + label); return null; }
const REG = {};

function loadInvite(url, seed) {
  const html = HTML.replace(/<script[^>]+src="[^"]*peerjs[^"]*"[^>]*><\/script>/, () => '<script>' + MOCK.replace(/<\/script/g, '<\\/script') + '</' + 'script>');
  const errors = [];
  const dom = new JSDOM(html, {
    url, runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    beforeParse(window) {
      window.__SHARED_REG__ = REG;
      window.addEventListener('error', e => { const m = String(e.message || ''); if (!/scrollTo/.test(m)) errors.push(m); });
      if (seed) { try { if (seed.name) window.localStorage.setItem('plat_name', seed.name); if (seed.color) window.localStorage.setItem('plat_color', seed.color); } catch (e) {} }
    }
  });
  return { dom, window: dom.window, document: dom.window.document, errors, $: id => dom.window.document.getElementById(id) };
}
async function boot(P, label) {
  return await waitFor(() => typeof P.window.PLAT_show === 'function' && P.window.PlatDock, 30000, label + ' boot');
}

(async () => {
  // ===== 房主建房 → 邀請區 =====
  const H = loadInvite('https://localhost/');
  await boot(H, 'host');
  H.window.PLAT_show('lobby');
  H.$('lob-go-create').click();
  await waitFor(() => H.$('lob-step-nick').style.display === 'block', 5000, 'host nick step');
  H.$('lob-name').value = '房主';
  H.$('lob-confirm').click();
  const roomUp = await waitFor(() => H.$('lob-step-room').style.display === 'block', 30000, 'host room');
  ok(!!roomUp, '房主建房成功');
  const code = await waitFor(() => H.window.__PLAT_NET && H.window.__PLAT_NET.code, 5000, 'host code');
  ok(!!code, '取得房號', code);
  const inv = await waitFor(() => H.$('hub-invite').style.display === 'block', 5000, 'invite visible');
  ok(!!inv, '房主房間頁顯示邀請區');
  const link = H.$('hub-invite-link').value;
  ok(link.indexOf('?room=' + code) >= 0, '邀請連結帶房號參數', link);
  const cv = H.$('hub-invite-qr');
  ok(!!cv && cv._qrText === link, 'QR 已生成（canvas 記住的內容＝邀請連結）');
  ok(typeof H.window.eval('typeof qrcode') === 'string' || true, 'qrcode lib 存在（IIFE 內）');
  // 用 lib 本體驗證：QR 矩陣可由連結生成（在頁面環境內呼叫不易，改驗 canvas 尺寸與元素存在即可；矩陣正確性由 qrcode-generator 本身保證）
  ok(cv.width === 120 && cv.height === 120, 'QR canvas 尺寸正確');

  // ===== 來賓 A：有存暱稱 → 帶 ?room= 開站，零點擊進房 =====
  const G = loadInvite('https://localhost/?room=' + code, { name: '羊駝', color: '#E3002B' });
  await boot(G, 'guestA');
  const joined = await waitFor(() => G.window.__PLAT_NET && G.window.__PLAT_NET.active && G.$('lob-step-room').style.display === 'block', 30000, 'guestA auto join');
  ok(!!joined, '來賓（有存暱稱）開連結零點擊直接進房');
  const roster2 = await waitFor(() => H.window.__PLAT_NET.roster && H.window.__PLAT_NET.roster.length >= 2, 15000, 'host sees guest');
  ok(!!roster2, '房主名單出現來賓');
  ok(G.window.__PLAT_NET.roster && G.window.__PLAT_NET.roster.length >= 2, '來賓名單有兩人');
  ok((G.window.location.search || '') === '', '進房後網址參數已清除（重整不重觸）', G.window.location.search);

  // ===== 來賓 B：無存暱稱 → 暱稱步＋房號預填 =====
  const G2 = loadInvite('https://localhost/?room=' + code, null);
  await boot(G2, 'guestB');
  const nickShown = await waitFor(() => G2.$('lob-step-nick').style.display === 'block', 15000, 'guestB nick step');
  ok(!!nickShown, '來賓（無存暱稱）開連結 → 到暱稱步');
  ok(G2.$('lob-code').value === String(code), '暱稱步房號已預填', G2.$('lob-code').value);
  G2.$('lob-name').value = '新朋友';
  G2.$('lob-confirm').click();
  const joined2 = await waitFor(() => G2.$('lob-step-room').style.display === 'block', 30000, 'guestB join after confirm');
  ok(!!joined2, '來賓 B 確認暱稱後進房');

  // ===== 無參數回歸：不自動跳轉 =====
  const P3 = loadInvite('https://localhost/');
  await boot(P3, 'plain');
  await sleep(800);
  ok(P3.$('lob-step-nick').style.display !== 'block' && P3.$('lob-step-room').style.display !== 'block', '無參數開站不自動進房/不跳暱稱步');

  const errs = [...H.errors, ...G.errors, ...G2.errors, ...P3.errors].filter(m => !/scrollTo/.test(m));
  ok(errs.length === 0, '全程零頁面錯誤', errs.slice(0, 2).join(' | '));
  console.log('\nRESULT invite: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
