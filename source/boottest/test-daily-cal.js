// 每日一題月曆（使用者 2026-10-26）：兩款同款——玩過亮燈、未來反灰不可選、點日期直接開局
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
let mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (timeout: ' + label + ')'); return null; }
const fmt = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const now = new Date();
const todayDs = fmt(now);
const yest = new Date(now); yest.setDate(yest.getDate() - 1);
const yestDs = fmt(yest);
const past = new Date(now); past.setDate(past.getDate() - 6);
const pastDs = fmt(past);
const tom = new Date(now); tom.setDate(tom.getDate() + 1);
const tomDs = fmt(tom);
const sameMonth = tomDs.slice(0, 7) === todayDs.slice(0, 7);
console.log('today=' + todayDs + ' done=' + yestDs + ' past=' + pastDs + ' future=' + tomDs);
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); } }
function loadPage(game) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = {}; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); });
      if (game === 'hashi') w.localStorage.setItem('hashi_daily_' + yestDs, JSON.stringify({ time: 321 }));
      else { w.localStorage.setItem('sudoku_daily_records', JSON.stringify({ [yestDs]: 234 })); w.localStorage.setItem('sudoku_input_mode', 'number'); }
    } });
  return { window: dom.window, document: dom.window.document, errors: errs };
}
const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
async function testGame(game, litClass) {
  console.log('--- ' + game + ' ---');
  const p = loadPage(game);
  await waitFor(() => typeof p.window.PLAT_show === 'function' ? true : null, 60000, 'shell ready');
  p.window.PLAT_show(game);
  const view = () => p.document.querySelector('#view-' + game);
  const homeReady = await waitFor(() => { const v = view(); return (v && (v.textContent || '').includes('每日一題') && (v.textContent || '').includes('單機挑戰')) ? v : null; }, 90000, game + ' home');
  check(game + ' 主頁載入', !!homeReady);
  if (!homeReady) return;
  // 開月曆：點日期按鈕（文字含 📅 與今天日期）
  const dateBtn = [...view().querySelectorAll('button')].find(b => (b.textContent || '').includes('📅') && (b.textContent || '').includes(todayDs));
  check(game + ' 日期按鈕存在（取代原生 date input）', !!dateBtn);
  check(game + ' 原生 date input 已移除', !view().querySelector('input[type="date"]'));
  clickEl(p, dateBtn);
  const cal = await waitFor(() => { const els = [...p.document.querySelectorAll('div')].filter(d => /年.+月/.test(d.textContent || '') && (d.textContent || '').includes('亮燈＝已完成')); return els.length ? els[els.length - 1] : null; }, 15000, game + ' calendar');
  check(game + ' 月曆有開', !!cal);
  if (!cal) return;
  const calRoot = cal.closest('div.fixed') || cal.parentElement.parentElement;
  const dayBtn = (ds) => { const day = Number(ds.slice(8)); return [...calRoot.querySelectorAll('button')].find(b => (b.textContent || '').trim().startsWith(String(day)) && !/年|關閉/.test(b.textContent || '')); };
  const yestBtn = dayBtn(yestDs), todayBtn = dayBtn(todayDs), pastBtn = dayBtn(pastDs);
  check(game + ' 昨天（已完成）亮燈', !!yestBtn && (yestBtn.className || '').includes(litClass), yestBtn && yestBtn.className);
  check(game + ' 昨天格有 ✓', !!yestBtn && (yestBtn.textContent || '').includes('✓'));
  check(game + ' 今天可選（未 disabled）', !!todayBtn && !todayBtn.disabled);
  if (sameMonth) {
    const tomBtn = dayBtn(tomDs);
    check(game + ' 明天（未來）反灰 disabled', !!tomBtn && tomBtn.disabled === true, tomBtn && tomBtn.className);
  }
  // 月份往後鈕 disabled（不能翻到未來月份）
  const navBtns = [...calRoot.querySelectorAll('button')].filter(b => ['◀', '▶'].includes((b.textContent || '').trim()));
  check(game + ' 月曆 ▶ 在本月 disabled', navBtns.length === 2 && navBtns[1].disabled === true);
  // 固定 6 列：本月格數 42；翻到 2026-02（28 天、最矮月份）格數也要 42、空格同高
  const gridsOf = () => { const gs = calRoot.querySelectorAll('.grid.grid-cols-7'); return gs[gs.length - 1]; };
  check(game + ' 本月格數 42（6 列）', gridsOf().children.length === 42, 'n=' + gridsOf().children.length);
  // 翻月次數依當月動態計算（舊版寫死 8 次是 2026-10 當月視角，11 月跑就差一個月——v1.60.0 修：算到 2026-02 的實際月距；每擊間隔 330ms 等切月過渡完成）
  const titleNow = (calRoot.textContent || '').match(/(\d{4}) 年 (\d{1,2}) 月/);
  const flips = titleNow ? (Number(titleNow[1]) * 12 + Number(titleNow[2])) - (2026 * 12 + 2) : 8;
  for (let k = 0; k < flips; k++) { const pv = [...calRoot.querySelectorAll('button')].filter(b => (b.textContent || '').trim() === '◀')[0]; clickEl(p, pv); await sleep(330); }
  check(game + ' 翻到 2026 年 2 月', (calRoot.textContent || '').includes('2026 年 2 月'));
  check(game + ' 2 月格數也是 42（高度固定）', gridsOf().children.length === 42, 'n=' + gridsOf().children.length);
  const febBlanks = [...gridsOf().children].filter(el => el.tagName === 'DIV');
  check(game + ' 2 月空格同高 h-11', febBlanks.length > 0 && febBlanks.every(el => (el.className || '').includes('h-11')), 'blanks=' + febBlanks.length);
  // 關掉重開（回到所選日期的月份）再驗開局
  const closeBtn = [...calRoot.querySelectorAll('button')].find(b => (b.textContent || '').trim() === '關閉');
  clickEl(p, closeBtn); await sleep(400);
  clickEl(p, [...view().querySelectorAll('button')].find(b => (b.textContent || '').includes('📅') && (b.textContent || '').includes(todayDs)));
  const cal2 = await waitFor(() => { const els = [...p.document.querySelectorAll('div')].filter(d => /年.+月/.test(d.textContent || '') && (d.textContent || '').includes('亮燈＝已完成')); return els.length ? els[els.length - 1] : null; }, 15000, game + ' calendar reopen');
  const calRoot2 = cal2.closest('div.fixed') || cal2.parentElement.parentElement;
  const pastBtn2 = [...calRoot2.querySelectorAll('button')].find(b => (b.textContent || '').trim().startsWith(String(Number(pastDs.slice(8)))) && !/年|關閉/.test(b.textContent || ''));
  // 點過去未玩日期 → 直接開那天的每日題
  clickEl(p, pastBtn2);
  const started = await waitFor(() => { const v = view(); const t = v ? (v.textContent || '') : ''; return (t.includes(pastDs.slice(5)) && (t.includes('每日') || t.includes('補玩'))) || t.includes(pastDs) ? true : null; }, 30000, game + ' daily started');
  check(game + ' 點過去日期直接開局（' + pastDs + '）', !!started);
  check(game + ' 零錯誤', p.errors.length === 0, p.errors.slice(0, 2).join(' | '));
}
(async () => {
  await testGame('hashi', 'bg-[#4ade80]');
  await testGame('sudoku', 'bg-[#ffcc00]');
  console.log('RESULT: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
