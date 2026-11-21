// 審查循環第 4 輪（v1.60.0）J1：每日月曆切月過渡——舊月淡出→重建→新月入場、標題 PlatLite 滾換、連點 retarget、六列不跳、結束後樣式乾淨。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
html = html.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(120); } console.log('  (timeout: ' + label + ')'); return null; }
// 靜態：切月 keyframes 只動 opacity/transform（不碰高度/寬度，六列不跳的結構保證）
const cssSrc = fs.readFileSync('/home/hatch/workspace/platform/shell.css', 'utf8');
const kf = (cssSrc.match(/@keyframes pcal(Out|In)(Next|Prev) \{[^}]*\}/g) || []).join(' ');
check('J1 切月 keyframes 齊全（出入×方向 4 段）', (cssSrc.match(/@keyframes pcal/g) || []).length === 4);
check('J1 keyframes 只動 opacity/transform', /opacity/.test(kf) && /transform/.test(kf) && !/height|width|margin|padding/.test(kf));
(async () => {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = {}; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  const W = dom.window, D = W.document;
  const clickEl = (el) => { if (el) el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); return !!el; };
  const ok0 = await waitFor(() => (typeof W.PLAT_show === 'function' && W.PlatCalendar) ? true : null, 120000, 'shell');
  if (!ok0) { console.log('SHELL NOT READY'); process.exit(2); }
  const title = () => D.querySelector('.pcal-title');
  const titleText = () => { const t = title(); return t ? t.textContent.replace(/\s+/g, ' ').trim() : ''; };
  const cellsEl = () => D.querySelector('.pcal-cells');
  W.PlatCalendar.show({ accent: '#ffcc00', records: { '2026-11-05': 1 }, selected: '', onPick: function () {} });
  await sleep(300);
  check('月曆開啟可見', W.PlatCalendar._visible());
  check('初始標題為本月（2026 年 11 月）', /2026 年 11 月/.test(titleText()), titleText());
  check('初始格子 42 格（六列固定）', !!cellsEl() && cellsEl().children.length === 42, cellsEl() && String(cellsEl().children.length));

  // --- 切上個月：淡出 class → 重建 → 標題滾換＋入場 class → 結束後乾淨 ---
  clickEl(D.querySelector('[data-pcal="prev"]'));
  await sleep(40);
  check('切月淡出中：格子帶 pcal-out-prev', !!cellsEl() && cellsEl().classList.contains('pcal-out-prev'));
  check('淡出期間舊月仍在（無空白幀、標題未變）', /2026 年 11 月/.test(titleText()));
  const oct = await waitFor(() => /2026 年 10 月/.test(titleText()) ? true : null, 3000, 'oct title');
  check('重建後標題為 10 月', !!oct);
  const tSpan = title() && title().querySelector('span');
  check('標題月份字滾換（plat-lite-in）', !!tSpan && tSpan.classList.contains('plat-lite-in'));
  const inSeen = await waitFor(() => (cellsEl() && cellsEl().classList.contains('pcal-in-prev')) ? true : null, 1500, 'in class');
  check('新月入場帶 pcal-in-prev（由左入）', !!inSeen);
  await sleep(400);
  check('動畫結束後格子無殘留 class', !!cellsEl() && !/pcal-(in|out)/.test(cellsEl().className), cellsEl() && cellsEl().className);
  check('10 月格子仍 42 格', !!cellsEl() && cellsEl().children.length === 42);

  // --- 連點 retarget：淡出中連點 prev ×3 → 最終 7 月、只認最後目標 ---
  clickEl(D.querySelector('[data-pcal="prev"]'));
  await sleep(30); clickEl(D.querySelector('[data-pcal="prev"]'));
  await sleep(30); clickEl(D.querySelector('[data-pcal="prev"]'));
  const jul = await waitFor(() => /2026 年 7 月/.test(titleText()) ? true : null, 4000, 'july title');
  check('連點 3 次 prev 最終到 7 月（retarget 累計、不排隊不跳月）', !!jul, titleText());
  await sleep(500);
  check('連點後無殘留動畫 class', !!cellsEl() && !/pcal-(in|out)/.test(cellsEl().className));
  check('7 月格子仍 42 格', !!cellsEl() && cellsEl().children.length === 42);

  // --- 往下個月（next）方向入場 ---
  clickEl(D.querySelector('[data-pcal="next"]'));
  const inNext = await waitFor(() => (cellsEl() && cellsEl().classList.contains('pcal-in-next')) ? true : null, 3000, 'in next');
  check('往下個月新月由右入（pcal-in-next）', !!inNext);
  await waitFor(() => /2026 年 8 月/.test(titleText()) ? true : null, 3000, 'aug title');
  await sleep(400);

  // --- 邊界：回到 2026-01 時 prev 停用 ---
  for (let i = 0; i < 7; i++) { clickEl(D.querySelector('[data-pcal="prev"]')); await sleep(330); }
  check('到達下限 2026 年 1 月', /2026 年 1 月/.test(titleText()), titleText());
  const prevBtn = D.querySelector('[data-pcal="prev"]');
  check('下限時 prev 鈕 disabled', !!prevBtn && prevBtn.disabled);
  W.PlatCalendar.hide();
  await sleep(300);
  check('關閉後月曆隱藏', !W.PlatCalendar._visible());
  check('全程零頁面錯誤', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log('RESULT round4: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });
