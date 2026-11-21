// v1.8.0 驗收：分頁大廳 / 一鍵重連 / 主畫面藍色回大廳鈕（無左上角平台鈕）/ 五戰名單帶入 / 頒獎台
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const mockSrc = require('./mockpeer.js');
const { sleep, waitFor, click } = require('./harness');
let pass = 0, fail = 0;
const check = (name, ok, extra) => { if (ok) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗ FAIL:', name, extra || ''); } };
const SHARED_REG = {};
function loadPageShared(htmlPath, seed) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/<script[^>]+src="[^"]*peerjs[^"]*"[^>]*><\/script>/, '<script>' + mockSrc + '</script>');
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errors.push(m); });
  vc.on('error', (m) => errors.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { window.__SHARED_REG__ = SHARED_REG; window.fetch = (url, opts) => fetch(new URL(url, window.location.href).href, opts); window.scrollTo = () => {}; if (seed) { try { for (const k in seed) window.localStorage.setItem(k, seed[k]); } catch (e) {} } } });
  const w = dom.window;
  w.addEventListener('error', (e) => { if (e.message && !/Script error/.test(e.message)) errors.push(e.message); });
  return { w, D: w.document, errors };
}
function setInput(w, el, val) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; setter.call(el, val); el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
const HTML = '/home/hatch/workspace/platform/platform-v1-test.html';
(async () => {
  // === A. 房主建房 + 分頁大廳 ===
  const host = loadPageShared(HTML);
  await waitFor(() => typeof host.w.PLAT_show === 'function' && host.w.PlatDock, 600000, 'host shell');
  check('版本 1.8.0', host.w.PLAT_VERSION === '1.8.0', host.w.PLAT_VERSION);
  check('左上角平台鈕已移除', !host.D.querySelector('#plat-back'));
  host.w.PLAT_show('sudoku');
  await waitFor(() => !!host.w.__PLAT_HOOKS_sudoku, 300000, 'host sudoku boot');
  const sHome = host.D.querySelector('#view-sudoku');
  check('數獨主畫面有藍色回大廳鈕（無連線時也顯示）', [...sHome.querySelectorAll('button')].some(b => (b.textContent || '').includes('🏠 回大廳')));
  host.w.PLAT_show('lobby');
  click(host.w, host.D.querySelector('#lob-go-create'));
  await waitFor(() => host.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'host nick');
  setInput(host.w, host.D.querySelector('#lob-name'), '阿主');
  click(host.w, host.D.querySelector('#lob-confirm'));
  await waitFor(() => host.w.__PLAT_NET && host.w.__PLAT_NET.code, 60000, 'host room code'); // 2026-11-21 修：#lob-room-code 已隨舊大廳退役，房號改讀 __PLAT_NET.code
  const code = host.w.__PLAT_NET.code;
  check('分頁列存在', !!host.D.querySelector('#lob-tabsbar'));
  check('預設數獨分頁顯示、數橋隱藏', host.D.querySelector('#lob-panel-sudoku').style.display !== 'none' && host.D.querySelector('#lob-panel-hashi').style.display === 'none');
  click(host.w, host.D.querySelector('[data-lobtab="hashi"]'));
  await sleep(300);
  check('切數橋分頁', host.D.querySelector('#lob-panel-hashi').style.display !== 'none' && host.D.querySelector('#lob-panel-sudoku').style.display === 'none');
  click(host.w, host.D.querySelector('[data-lobtab="tourn"]'));
  await sleep(300);
  check('切五戰分頁＋設定卡顯示（房主）', host.D.querySelector('#lob-panel-tourn').style.display !== 'none' && host.D.querySelector('#lob-tourn-setup').style.display !== 'none');
  click(host.w, host.D.querySelector('[data-lobtab="sudoku"]'));
  await sleep(200);
  // === B. 來賓加入（一般流程）===
  const guest = loadPageShared(HTML);
  await waitFor(() => typeof guest.w.PLAT_show === 'function' && guest.w.PlatDock, 600000, 'guest shell');
  click(guest.w, guest.D.querySelector('#lob-go-join'));
  await waitFor(() => guest.D.querySelector('#lob-step-nick').style.display === 'block', 60000, 'guest nick');
  setInput(guest.w, guest.D.querySelector('#lob-name'), '阿客');
  setInput(guest.w, guest.D.querySelector('#lob-code'), code);
  click(guest.w, guest.D.querySelector('#lob-confirm'));
  await waitFor(() => (guest.D.querySelector('#lob-roster') || { textContent: '' }).textContent.includes('阿主'), 60000, 'guest in room');
  check('來賓看到五戰分頁的等待說明', (() => { click(guest.w, guest.D.querySelector('[data-lobtab="tourn"]')); return true; })() && guest.D.querySelector('#lob-tourn-note').style.display !== 'none');
  check('來賓的開始類按鈕被禁用（data-launch disabled）', guest.D.querySelector('[data-launch="sudoku-brawl"]').disabled === true);
  // === C. 一鍵重連（原來賓先離開，種子身份的新頁面以同名回房——真實的「跳出再回來」情境）===
  click(guest.w, guest.D.querySelector('#lob-leave'));
  await waitFor(() => !(host.D.querySelector('#lob-roster') || { textContent: '' }).textContent.includes('阿客'), 30000, 'orig guest left');
  const re = loadPageShared(HTML, { plat_name: '阿客', plat_color: '#22c55e', plat_room: code, plat_room_role: 'guest', plat_last_code: code });
  await waitFor(() => typeof re.w.PLAT_show === 'function' && re.w.PlatDock, 600000, 're shell');
  await waitFor(() => re.D.querySelector('#lob-rejoin') && re.D.querySelector('#lob-rejoin').style.display !== 'none', 30000, 'rejoin btn');
  check('回到房間鈕出現且帶房號', (re.D.querySelector('#lob-rejoin-code') || { textContent: '' }).textContent === code);
  click(re.w, re.D.querySelector('#lob-rejoin'));
  const rejoined = await waitFor(() => (re.D.querySelector('#lob-roster') || { textContent: '' }).textContent.includes('阿主') && re.D.querySelector('#lob-room').style.display === 'block', 60000, 'rejoined');
  check('一鍵重連直接進房（不經暱稱步）', !!rejoined && re.D.querySelector('#lob-step-nick').style.display !== 'block');
  // === D. 五戰：名單帶入 + 頒獎台（host + re 兩人）===
  click(host.w, host.D.querySelector('[data-lobtab="tourn"]'));
  await sleep(300);
  const setSel = (w, el, v) => { const setter = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value').set; setter.call(el, v); el.dispatchEvent(new w.Event('change', { bubbles: true })); };
  setSel(host.w, host.D.querySelector('#t-s-size'), '4');
  click(host.w, host.D.querySelector('#t-start'));
  // 房主等待室取樣：來賓未到前應看到灰色未到席位且開始鈕禁用
  let sawPending = false, sawStartDisabled = false, arrived = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 90000) {
    const ro = host.D.querySelector('#view-sudoku [data-pr-region="roster"]');
    if (ro) {
      if (ro.textContent.includes('未到')) sawPending = true;
      const sb = host.D.querySelector('#view-sudoku [data-pr="start"]');
      if (sb && sb.disabled && ro.textContent.includes('未到')) sawStartDisabled = true;
      if (ro.textContent.includes('阿客') && !ro.textContent.includes('未到')) { arrived = true; break; }
    }
    await sleep(150);
  }
  check('五戰等待室先帶入名單（看得到未到席位）', sawPending);
  check('未到齊時房主開始鈕禁用', sawStartDisabled);
  check('來賓到場後未到席位被真人替換', arrived);
  const gRo = await waitFor(() => re.D.querySelector('#view-sudoku [data-pr-region="roster"]'), 60000, 'guest room');
  check('來賓等待室也看到兩人', !!gRo && gRo.textContent.includes('阿主') && gRo.textContent.includes('阿客'));
  // 開賽 → 縮短時限 → 結算 → 頒獎台
  host.w.__PLAT_NET.tourn.roundSecs = 7;
  click(host.w, host.D.querySelector('#view-sudoku [data-pr="ready"]')); await sleep(400);
  click(re.w, re.D.querySelector('#view-sudoku [data-pr="ready"]'));
  const en = await waitFor(() => { const sb = host.D.querySelector('#view-sudoku [data-pr="start"]'); return sb && !sb.disabled; }, 60000, 'start enabled');
  if (en) click(host.w, host.D.querySelector('#view-sudoku [data-pr="start"]'));
  const settled = await waitFor(() => host.w.__PLAT_NET.tourn && host.w.__PLAT_NET.tourn.phase === 'standings', 120000, 'settle');
  check('第 1 局結算進 standings', !!settled);
  const podH = await waitFor(() => { const p = host.D.querySelector('#plat-podium'); return (p && p.style.display === 'flex') ? p : null; }, 30000, 'podium host');
  check('房主看到頒獎台', !!podH && podH.textContent.includes('第 1 局結果'));
  const podG = await waitFor(() => { const p = re.D.querySelector('#plat-podium'); return (p && p.style.display === 'flex') ? p : null; }, 30000, 'podium guest');
  check('來賓看到頒獎台', !!podG);
  if (podH) {
    const sc = podH.querySelector('.pod-score');
    check('頒獎台分數列（data-to 為結算後總分）', !!sc && Number(sc.getAttribute('data-to')) >= 0 && podH.textContent.includes('阿主') && podH.textContent.includes('阿客'));
    click(host.w, podH);
    await sleep(300);
    check('點一下可跳過頒獎台', podH.style.display === 'none');
  }
  check('errors', host.errors.length === 0 && re.errors.length === 0, JSON.stringify(host.errors.slice(0, 2)) + JSON.stringify(re.errors.slice(0, 2)));
  console.log('RESULT v180: ' + pass + '/' + (pass + fail));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); console.log('RESULT v180: ' + pass + '/' + (pass + fail + 1)); process.exit(1); });
