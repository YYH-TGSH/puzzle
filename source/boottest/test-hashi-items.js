// v1.23.0 數橋道具批（使用者 2026-11-01 定案）：
// - 移除數字幻影（與迷霧功能重複）→ 道具剩炸橋/迷霧/禮物
// - 迷霧改「迷霧方框」：整區框起虛化、連橋帶數字全遮（.fog-box-in 覆蓋層）
// - 道具列固定順序、禮物放正中間
// - 集滿 3 個同種道具 → 自動連續發動 3 次並歸零（禮物也同規，取代舊「禮物無上限/其他上限 3」）
// - 禮物補橋（黑色實線 locked、誤觸/被炸不掉）沿用 v1.18.0 行為
// 驗法：雙頁大亂鬥（race）開局後，用 mock 連線的 data handler 注入 BRAWL_GRANT/BRAWL_ITEM（與真網路訊息同路徑、JSON 深拷貝）。
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
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(m); });
  vc.on('error', m => errs.push(String(m)));
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(e.message); }); } });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
function pev(w, el, type, x, y) { const e = new w.Event(type, { bubbles: true, cancelable: true }); e.clientX = x; e.clientY = y; e.isPrimary = true; e.pointerId = 7; e.pointerType = 'mouse'; e.button = 0; e.buttons = (type === 'pointerup' ? 0 : 1); el.dispatchEvent(e); }
(async () => {
  // v1.27.1（使用者 2026-11-01 糾正）：里程碑道具種類只抽炸橋/迷霧各半；禮物不進里程碑彩券，只走島嶼完成 1/20 系統
  const hsrc = fs.readFileSync('/home/hatch/workspace/hashi-site/js/app.js', 'utf8');
  const prm = hsrc.slice(hsrc.indexOf('const pickRandomItem'), hsrc.indexOf('const platProgWeights'));
  check('出貨碼：里程碑種類池只有炸橋/迷霧', prm.includes("x.key === 'bomb' || x.key === 'fog'") && !prm.includes("'gift'"));
  check('出貨碼：里程碑種類等機率（Math.random 直抽池內）', prm.includes('Math.floor(Math.random() * pool.length)'));
  const H = loadPage('H'); const G = loadPage('G');
  const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell'); if (!ok) { console.log('SHELL NOT READY', p.label); process.exit(2); } }
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  await waitFor(() => hubRoom(H), 60000, 'H room');
  const code = H.window.__PLAT_NET.code;
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙'; G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  await waitFor(() => hubRoom(G), 60000, 'G room');
  await waitFor(() => H.window.__PLAT_NET.roster.length === 2 ? true : null, 30000, 'roster 2');
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="hashi"]'));
  await sleep(600);
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="race"]'));
  await sleep(800);
  const readyBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="ready"]');
  const startBtn = (p) => p.document.querySelector('#lob-step-room [data-pr="start"]');
  await waitFor(() => readyBtn(G) && readyBtn(H), 20000, 'ready btns');
  clickEl(G, readyBtn(G)); clickEl(H, readyBtn(H));
  const unlocked = await waitFor(() => { const b = startBtn(H); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
  clickEl(H, unlocked);
  const inGame = await waitFor(() => { const v = G.document.querySelector('#view-hashi'); return (v && v.classList.contains('active')) ? true : null; }, 60000, 'G in hashi');
  check('來賓進入數橋競速', !!inGame);
  // 注入工具：把訊息打進來賓的殼連線 data handler（等同房主遊戲經真連線送達）
  const hostPid = H.window.__PLAT_NET.myPid, gUid = G.window.localStorage.getItem('plat_uid_hashi'), hUid = H.window.localStorage.getItem('plat_uid_hashi'); // 遊戲層身份是各遊戲自己的持久 uid（plat_uid_hashi），不是殼的 Net.myUid
  function inject(pd) {
    const conn = G.window.__PLAT_NET.conns[hostPid];
    if (!conn || !conn._h || !conn._h.data) return false;
    const copy = JSON.parse(JSON.stringify({ __pg: 'hashi', __pd: pd }));
    conn._h.data.slice().forEach(f => { try { f(copy); } catch (e) {} });
    return true;
  }
  const grant = (item) => inject({ type: 'BRAWL_GRANT', toUid: gUid, item: item, fromUid: hUid });
  const dockBtn = (icon) => { const bs = [...G.document.querySelectorAll('#view-hashi button')]; return bs.find(b => (b.textContent || '').includes(icon) && b.className.includes('rounded-full')) || null; };
  const badge = (btn) => { if (!btn) return null; const s = [...btn.querySelectorAll('span')].map(x => x.textContent.trim()).find(t => /^[0-9]+$/.test(t)); return s ? parseInt(s, 10) : (btn ? 1 : null); };
  const blackLines = () => [...G.document.querySelectorAll('#view-hashi line')].filter(l => l.getAttribute('stroke') === '#000000');
  // 先送一件禮物，等競速開始後道具列出現（道具列只在 racing 顯示，出現即代表已開賽，後續自動發動才不會落空）
  let dockGift = null;
  for (let i = 0; i < 4 && !dockGift; i++) { grant('gift'); dockGift = await waitFor(() => dockBtn('🎁'), 25000, 'dock gift try' + i); }
  check('禮物進道具列（🎁 按鈕出現）', !!dockGift);
  check('道具鈕有浮動動畫 class（anim-item）', !!dockGift && dockGift.className.includes('anim-item'));
  // 數字幻影已移除：grant phantom 應被忽略（meta 不存在），不出現 ❓ 鈕
  grant('phantom'); await sleep(1800);
  check('數字幻影已移除（grant phantom 無反應、無 ❓ 鈕）', !dockBtn('❓'));
  // 炸橋集滿 3 → 自動發動歸零（來賓背包炸橋鈕消失；自動發動打向房主、不影響來賓盤面）
  for (let i = 0; i < 3; i++) { grant('bomb'); await sleep(300); }
  const bombGone = await waitFor(() => !dockBtn('💣') ? true : null, 20000, 'bomb autofire clears');
  check('炸橋集滿 3 自動發動並歸零', !!bombGone);
  // 自動發動後重新累積：第 4 顆炸橋留在背包
  grant('bomb');
  const bombOne = await waitFor(() => { const b = dockBtn('💣'); return (b && badge(b) === 1) ? b : null; }, 15000, 'bomb recount 1');
  check('自動發動後同種重新累積（炸橋 =1）', !!bombOne);
  // 禮物集滿 3（已有 1，再送 2）→ 自動連發補橋：黑色鎖定橋出現、禮物歸零
  grant('gift'); await sleep(300); grant('gift');
  const giftAuto = await waitFor(() => (blackLines().length >= 2 && !dockBtn('🎁')) ? true : null, 25000, 'gift autofire');
  check('禮物集滿 3 自動連發補橋並歸零', !!giftAuto, '黑線=' + blackLines().length);
  await sleep(3000); // 等自動連發三發全數落地（每發間隔 550ms）再抓鎖定橋數量，避免把還在飛的第三發誤判成誤觸新增
  const L = blackLines().length;
  // 道具列順序：補上迷霧與禮物各 1（炸橋已有 1）→ 三鈕齊全時順序應為 💣 🎁 🌫️（禮物正中間）
  grant('fog'); await sleep(300); grant('gift');
  const barOrder = await waitFor(() => {
    const bs = [...G.document.querySelectorAll('#view-hashi button')].filter(b => b.className.includes('rounded-full') && /💣|🎁|🌫️/.test(b.textContent || ''));
    if (bs.length < 3) return null;
    return bs.map(b => (b.textContent.includes('💣') ? 'bomb' : b.textContent.includes('🎁') ? 'gift' : 'fog'));
  }, 20000, 'bar order');
  check('道具列固定順序：炸橋・禮物（中）・迷霧', !!barOrder && barOrder.join(',') === 'bomb,gift,fog', barOrder ? barOrder.join(',') : 'n/a');
  // 雲霧（v1.28.0 使用者定案：不要方框虛化，要一團團的雲）：房主對來賓放迷霧 → 來賓盤面出現雲團（多個 puff 圓、無 rect 方框），且雲團面積 ≤ 盤面 1/5
  inject({ type: 'BRAWL_ITEM', item: 'fog', fromUid: hUid, fromName: '房主甲', targetUid: gUid });
  const fogG = await waitFor(() => { const g = G.document.querySelector('#view-hashi .fog-box-in'); return (g && g.querySelectorAll('circle').length >= 6 && !g.querySelector('rect')) ? g : null; }, 15000, 'fog cloud');
  check('雲霧出現（一團雲 puff、無方框）', !!fogG, fogG ? 'puffs=' + fogG.querySelectorAll('circle').length : '');
  if (fogG) {
    const svg = fogG.closest('svg');
    const vb = (svg.getAttribute('viewBox') || '0 0 0 0').split(/\s+/).map(Number);
    const boardArea = vb[2] * vb[3];
    let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
    fogG.querySelectorAll('circle').forEach(c => { const x = +c.getAttribute('cx'), y = +c.getAttribute('cy'), r = +c.getAttribute('r'); mnx = Math.min(mnx, x - r); mxx = Math.max(mxx, x + r); mny = Math.min(mny, y - r); mxy = Math.max(mxy, y + r); });
    const cloudArea = Math.PI * Math.pow(Math.max(mxx - mnx, mxy - mny) / 2, 2); // 以雲團外接圓估面積（壓扁 0.84 後實際更小，估值偏保守）
    check('雲霧面積 ≤ 盤面 1/5', cloudArea <= boardArea * 0.21, 'ratio=' + (cloudArea / boardArea).toFixed(3));
    check('雲霧有實心核心（ellipse 保證遮蔽）', !!fogG.querySelector('ellipse'));
  }
  // 鎖定橋保護（沿用 v1.18.0）：誤觸不變、被炸不掉
  if (L >= 1) {
    const locked = blackLines();
    const gEl = locked[0].closest('g');
    const svg = G.document.querySelector('#view-hashi svg');
    if (svg) { svg.createSVGPoint = () => { const p = { x: 0, y: 0, matrixTransform: () => ({ x: p.x, y: p.y }) }; return p; }; svg.getScreenCTM = () => ({ inverse: () => ({}) }); }
    pev(G.window, gEl, 'pointerdown', 10, 10); pev(G.window, gEl, 'pointerup', 10, 10);
    await sleep(1500);
    check('誤觸鎖定橋：黑線數量不變（刪不掉）', blackLines().length === L, 'now=' + blackLines().length);
    inject({ type: 'BRAWL_ITEM', item: 'bomb', fromUid: hUid, fromName: '房主甲', targetUid: gUid });
    await sleep(1500);
    check('被炸橋：鎖定橋不受影響', blackLines().length === L, 'now=' + blackLines().length);
  } else {
    check('誤觸鎖定橋：黑線數量不變（刪不掉）', false, '無鎖定橋可測');
    check('被炸橋：鎖定橋不受影響', false, '無鎖定橋可測');
  }
  check('雙邊零錯誤', H.errors.length === 0 && G.errors.length === 0, (H.errors[0] || '') + ' | ' + (G.errors[0] || ''));
  console.log('\n=== hashi-items: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(2); });
