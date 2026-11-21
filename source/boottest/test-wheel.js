// 代表色摩天輪回歸（v1.22.0 工廠版；v1.29.0 改造）：大廳與選色覆蓋層共用 createFerris——
// ①進暱稱步未決定：圓心無問號、跟著指針下車廂變色、colorPicked=false、idle 慢轉中；有底座（兩腳＋底板）
// ②20 台車廂顏色依序，決定後靜止時每台車廂保持正立
// ③轉完：指針下車廂色 == Net.me.color、落點對齊車廂正中心（不壓線）、colorPicked=true
// ④連按 5 次：彩虹模式（color=rainbow、rainbow-mode/is-rainbow class、plat_rainbow 已存）
// ⑤彩虹中再按一次：退出並轉到一般色（落點同樣對齊正中心）
// ⑥覆蓋層 __PLAT_PICK_COLOR：開得起來、轉完回傳顏色並同步 Net.me.color、覆蓋層關閉
// ⑦同色避讓：名單占滿 19 色時，轉盤只能停在唯一剩下的顏色
const fs = require('fs');
const { JSDOM, VirtualConsole, requestInterceptor } = require('jsdom');
const BUNDLE = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const MOCK = require('./mockpeer.js');
const interceptor = requestInterceptor(async (request) => {
  if (request.url.includes('peerjs')) return new Response(MOCK, { headers: { 'Content-Type': 'text/javascript' } });
  if (request.url.includes('tailwindcss')) return new Response('/* stub */', { headers: { 'Content-Type': 'text/javascript' } });
  return undefined;
});
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(200); } console.log('  (timeout: ' + label + ')'); return null; }
const errs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
const dom = new JSDOM(BUNDLE, { url: 'https://localhost/', resources: { interceptors: [interceptor] }, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) { w.__SHARED_REG__ = {}; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
const w = dom.window, D = w.document;
const click = (el) => { if (el) el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); return !!el; };
const COLORS = ['#E3002B', '#F35B00', '#FFC90E', '#D7157A', '#E895C0', '#007A61', '#87D300', '#C4D600', '#8DD1BF', '#616130', '#00538A', '#008CC1', '#00C1D5', '#79C8ED', '#CDBB79', '#41136A', '#935CB9', '#BCA8D1', '#7A0026', '#BC7B70'];
const rotorEl = () => D.querySelector('#lob-wheel-wrap .fw-rotor');
function rotorDeg() { const t = rotorEl().style.transform || ''; const m = /rotate\((-?[\d.]+)deg\)/.exec(t); return m ? parseFloat(m[1]) : 0; }
function topSeg() { const seg = 360 / 20; const mod = ((rotorDeg() % 360) + 360) % 360; return Math.floor(((360 - mod) % 360) / seg) % 20; }
function cabDeg(scope, i) { const cab = scope.querySelectorAll('.wseg')[i].querySelector('.cab'); const m = /rotate\((-?[\d.]+)deg\)/.exec(cab.style.transform || ''); return m ? parseFloat(m[1]) : null; }
(async () => {
  await waitFor(() => typeof w.PLAT_show === 'function' && w.PlatDock ? true : null, 60000, 'shell');
  click(D.querySelector('#lob-go-create'));
  await waitFor(() => D.querySelector('#lob-step-nick').style.display === 'block', 20000, 'nick step');
  await sleep(300);
  const net = () => w.__PLAT_NET;
  const hexRgb = (h) => 'rgb(' + parseInt(h.slice(1, 3), 16) + ', ' + parseInt(h.slice(3, 5), 16) + ', ' + parseInt(h.slice(5, 7), 16) + ')';
  check('未決定：colorPicked=false', net().colorPicked === false);
  check('未決定：圓心無問號', D.querySelector('#lob-wheel-wrap .fw-hub').textContent === '', JSON.stringify(D.querySelector('#lob-wheel-wrap .fw-hub').textContent));
  // 圓心跟色（v1.29.0 使用者定案：旋轉時圓心跟著指針下車廂變色，不要問號）：idle 旋轉中取樣，
  // 任一瞬間圓心底色 == 該瞬間指針下車廂色（車廂中心對齊制 cabinIdxAt）即算跟上
  let hubFollow = false;
  for (let k = 0; k < 10 && !hubFollow; k++) {
    const deg = rotorDeg();
    const idx = Math.round((((-(deg) % 360) + 360) % 360) / 18) % 20;
    if (D.querySelector('#lob-wheel-wrap .fw-hub').style.background === hexRgb(COLORS[idx])) hubFollow = true;
    else await sleep(150);
  }
  check('未決定：圓心跟著指針下車廂變色', hubFollow);
  const dotEl = D.querySelector('#lob-color-dot');
  check('未決定：色票是問號（每次打開暱稱步都未決定，不拿指針色冒充已選定）', dotEl.textContent === '?' && dotEl.style.background === 'rgb(226, 232, 240)', 'text=' + JSON.stringify(dotEl.textContent) + ' bg=' + dotEl.style.background);
  check('摩天輪有底座（兩腳＋底板）', !!D.querySelector('#lob-wheel-wrap .fw-stand .fw-leg.l') && !!D.querySelector('#lob-wheel-wrap .fw-stand .fw-leg.r') && !!D.querySelector('#lob-wheel-wrap .fw-base'));
  const tA = rotorEl().style.transform; await sleep(900); const tB = rotorEl().style.transform;
  check('未決定：摩天輪 idle 慢轉中', tA !== tB, tA + ' -> ' + tB);
  const segs = D.querySelectorAll('#lob-wheel-wrap .wseg');
  check('20 台車廂', segs.length === 20, 'n=' + segs.length);
  check('車廂顏色齊全且依序', [...segs].every((s, i) => { const cab = s.querySelector('.cab'); return cab && cab.style.background === hexRgb(COLORS[i]); }));
  // 一般轉一次
  click(D.querySelector('#lob-color-spin'));
  const picked = await waitFor(() => net().colorPicked === true ? true : null, 15000, 'spin done');
  check('轉完 colorPicked=true', !!picked);
  await sleep(300);
  check('指針下車廂 == 選到的顏色', COLORS[topSeg()] === net().me.color, 'top=' + COLORS[topSeg()] + ' me=' + net().me.color);
  check('圓心顯示選到的顏色', D.querySelector('#lob-wheel-wrap .fw-hub').textContent === '' && D.querySelector('#lob-wheel-wrap .fw-hub').style.background === hexRgb(net().me.color), 'bg=' + D.querySelector('#lob-wheel-wrap .fw-hub').style.background);
  // 落點對齊車廂正中心（v1.29.0：舊版多加半格，指針停在車廂頭、壓線有爭議）
  const centerOff1 = (((COLORS.indexOf(net().me.color) * 18 + rotorDeg()) % 360) + 360) % 360;
  check('落點對齊車廂正中心（不壓線）', centerOff1 < 0.6 || centerOff1 > 359.4, 'off=' + centerOff1.toFixed(2));
  check('車廂保持正立（轉後靜止）', [...segs].every((s, i) => { const d = cabDeg(D.querySelector('#lob-wheel-wrap'), i); return d !== null && (((rotorDeg() + i * 18 + d) % 360) + 360) % 360 < 0.01; }), 'rotor=' + rotorDeg());
  // 彩虹：等連按計數窗過期後快速連按 5 次
  await sleep(3000);
  const btn = D.querySelector('#lob-color-spin');
  for (let k = 0; k < 5; k++) { click(btn); await sleep(60); }
  await sleep(300);
  check('連按 5 次觸發彩虹', net().me.color === 'rainbow', 'me=' + net().me.color);
  check('彩虹：轉子自轉標記', rotorEl().classList.contains('is-rainbow'));
  check('彩虹：全車廂彩虹 class', D.querySelector('#lob-wheel-wrap .fw-wrap').classList.contains('rainbow-mode'));
  check('彩虹：圓心動態彩虹 class', D.querySelector('#lob-wheel-wrap .fw-hub').classList.contains('plat-rainbow-anim'));
  check('彩虹：plat_rainbow 已存', w.localStorage.getItem('plat_rainbow') === '1');
  // 退出彩虹：再按一次
  click(btn);
  const exited = await waitFor(() => net().me.color !== 'rainbow' && !rotorEl().classList.contains('is-rainbow') ? true : null, 15000, 'exit rainbow');
  check('再按一次退出彩虹並轉到一般色', !!exited, 'me=' + net().me.color);
  check('退出後指針下車廂 == 顏色', COLORS[topSeg()] === net().me.color, 'top=' + COLORS[topSeg()] + ' me=' + net().me.color);
  const centerOff2 = (((COLORS.indexOf(net().me.color) * 18 + rotorDeg()) % 360) + 360) % 360;
  check('退出彩虹落點也對齊車廂正中心', centerOff2 < 0.6 || centerOff2 > 359.4, 'off=' + centerOff2.toFixed(2));
  // 覆蓋層：遊戲名條用的 __PLAT_PICK_COLOR
  let pickResult = 'PENDING';
  w.__PLAT_PICK_COLOR(net().me.color, (c) => { pickResult = c; });
  await sleep(200);
  check('覆蓋層開啟', D.querySelector('#plat-pick').style.display === 'flex');
  check('覆蓋層有自己的摩天輪（20 台車廂）', D.querySelectorAll('#plat-pick-wheel .wseg').length === 20);
  click(D.querySelector('#plat-pick-spin'));
  const got = await waitFor(() => pickResult !== 'PENDING' ? true : null, 15000, 'pick settle');
  check('覆蓋層轉完回傳顏色', !!got && COLORS.includes(pickResult), 'got=' + pickResult);
  check('覆蓋層定色同步 Net.me.color', net().me.color === pickResult, 'me=' + net().me.color);
  check('覆蓋層已關閉', D.querySelector('#plat-pick').style.display === 'none');
  // 同色避讓（v1.29.0 使用者定案：名稱與顏色都不可重複）：假名單占滿 19 色，
  // 覆蓋層轉盤照跑、但只能停在唯一剩下的顏色（20 人時最後一人就只剩最後一色）
  const FREE = COLORS[13];
  const savedActive = net().active, savedRoster = net().roster;
  net().active = true;
  net().roster = COLORS.filter(c => c !== FREE).map((c, i) => ({ uid: 'fake' + i, name: '假占位' + i, color: c }));
  let avoidResult = 'PENDING';
  w.__PLAT_PICK_COLOR(net().me.color === FREE ? COLORS[0] : net().me.color, (c) => { avoidResult = c; });
  await sleep(200);
  click(D.querySelector('#plat-pick-spin'));
  const gotAvoid = await waitFor(() => avoidResult !== 'PENDING' ? true : null, 15000, 'avoid settle');
  check('19 色被占用：轉盤只停在剩下的顏色', !!gotAvoid && avoidResult === FREE, 'got=' + avoidResult + ' free=' + FREE);
  net().active = savedActive; net().roster = savedRoster;
  check('零頁面錯誤', errs.length === 0, errs[0] || '');
  console.log('\n=== wheel: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(2); });
