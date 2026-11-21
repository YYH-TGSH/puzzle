// v1.11.0 驗收：房間框架（進房不載入遊戲／分頁＋各款設定表單／準備同步／開始才載入+自動開局／回房間頁／錦標賽從房間頁開賽）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
const marker = '<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>';
if (!html.includes(marker)) { console.log('MARKER MISSING'); process.exit(2); }
html = html.replace(marker, () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { ms = Math.min(ms || 60000, (typeof WAITFOR_CAP_MS !== 'undefined' ? WAITFOR_CAP_MS : 60000)); const t0 = Date.now(); /* 2026-11-21 甲案後半：waitFor 上限預設 60 秒快速失敗；慢案以 WAITFOR_CAP_MS 個別放寬、檔頭註明理由 */ while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(300); } console.log('  (waitFor timeout: ' + label + ')'); return null; }
const SHARED_REG = {};
function loadPage(label) {
  const errs = [];
  const vc = new VirtualConsole();
  const t0 = Date.now();
  const stamp = (m, stack) => '[+' + ((Date.now() - t0) / 1000).toFixed(1) + 's] ' + m + (stack ? '\nSTACK: ' + stack : '\nSTACK: (none)');
  vc.on('jsdomError', e => { const m = String((e.detail && e.detail.message) || e.message || e); if (!/scrollTo|getContext|Not implemented|Could not parse CSS|Could not load/i.test(m)) errs.push(stamp(m, e.detail && e.detail.stack)); });
  vc.on('error', m => errs.push(stamp(String(m))));
  const dom = new JSDOM(html, {
    url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__SHARED_REG__ = SHARED_REG; w.scrollTo = () => {}; w.addEventListener('error', e => { if (e.message && !/Script error/.test(e.message)) errs.push(stamp(e.message, e.error && e.error.stack)); }); }
  });
  return { window: dom.window, document: dom.window.document, errors: errs, label };
}
async function main() {
  const H = loadPage('H'); const G = loadPage('G');
  const clickEl = (p, el) => { if (el) el.dispatchEvent(new p.window.MouseEvent('click', { bubbles: true })); return !!el; };
  const click = (p, sel) => clickEl(p, p.document.querySelector(sel));
  const hubRoom = (p) => { const rm = p.document.querySelector('#lob-step-room'); return rm && rm.style.display === 'block' ? rm : null; };
  const hubRoster = (p) => p.document.querySelector('#view-lobby [data-pr-region="roster"]');
  for (const p of [H, G]) { const ok = await waitFor(() => (typeof p.window.PLAT_show === 'function' && p.window.__PLAT_NET) ? true : null, 120000, p.label + ' shell ready'); if (!ok) { console.log('SHELL NOT READY ' + p.label, p.errors.slice(0, 3)); process.exit(2); } }

  // 0) v1.12.1：數獨首頁不再有「正在檢查連線/恢復上次對局」（多人重連是平台層功能，移到主頁）
  try { H.window.localStorage.setItem('sudoku_last_session', JSON.stringify({ rid: '9999', uid: 'x', time: Date.now(), name: '房主甲', isHost: false, sid: 's1' })); } catch (e) {}
  H.window.PLAT_show('sudoku');
  const sudokuHome = await waitFor(() => { const v = H.document.querySelector('#view-sudoku'); return (v && [...v.querySelectorAll('button')].some(b => (b.textContent || '').includes('單機挑戰'))) ? v : null; }, 90000, 'sudoku home');
  check('數獨首頁已載入', !!sudokuHome);
  const probeBtn = sudokuHome ? [...sudokuHome.querySelectorAll('button')].find(b => /正在檢查連線|恢復上次對局|房間已失效/.test(b.textContent || '')) : null;
  check('數獨首頁沒有連線檢查/恢復對局鈕', !probeBtn);
  H.window.PLAT_show('lobby');

  // 1) 建房 → 房間框架頁（不載入遊戲）
  click(H, '#lob-go-create'); await waitFor(() => H.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'H nick');
  H.document.querySelector('#lob-name').value = '房主甲'; click(H, '#lob-confirm');
  const hHub = await waitFor(() => hubRoom(H), 60000, 'H hub room');
  check('房主建房 → 進房間框架頁', !!hHub);
  check('進房時代表色自動拉霸決定（colorPicked）', H.window.__PLAT_NET.colorPicked === true, String(H.window.__PLAT_NET.colorPicked));
  check('房間頁不載入遊戲（房主 inMatch 為空）', H.window.__PLAT_NET.inMatch === null, String(H.window.__PLAT_NET.inMatch));
  check('房間頁停在大廳畫面（未切去遊戲）', H.document.body.getAttribute('data-view') === 'lobby', H.document.body.getAttribute('data-view'));
  const code = H.window.__PLAT_NET.code;
  check('房間頁名單有房主', (hubRoster(H) || {}).textContent && hubRoster(H).textContent.includes('房主甲'));

  // 2) 來賓入房 → 同樣進房間框架頁
  click(G, '#lob-go-join'); await waitFor(() => G.document.querySelector('#lob-step-nick').style.display !== 'none', 30000, 'G nick');
  G.document.querySelector('#lob-name').value = '來賓乙';
  G.document.querySelector('#lob-code').value = code; click(G, '#lob-confirm');
  const gHub = await waitFor(() => hubRoom(G), 60000, 'G hub room');
  check('來賓入房 → 進房間框架頁', !!gHub);
  check('來賓進房時代表色也自動拉霸決定', G.window.__PLAT_NET.colorPicked === true, String(G.window.__PLAT_NET.colorPicked));
  check('來賓也沒載入遊戲', G.window.__PLAT_NET.inMatch === null, String(G.window.__PLAT_NET.inMatch));
  const two = await waitFor(() => { const r = hubRoster(H); return (r && r.textContent.includes('來賓乙')) ? r : null; }, 30000, 'H roster 2 players');
  check('房間頁名單有兩人', !!two);

  // 2.5) v1.12.2：主畫面不要有回到房間鈕（重連鈕只在大廳、進多人連線時才探測顯示）
  H.window.PLAT_show('home');
  check('主畫面沒有回到房間鈕', !H.document.querySelector('#home-rejoin'));
  H.window.PLAT_show('lobby');
  const backRoom = await waitFor(() => hubRoom(H), 30000, 'H back to room page');
  check('從主頁回房間頁正常', !!backRoom);

  // 3) 設定表單：預設數獨分頁；房主切數橋分頁，來賓同步；數橋表單沒有去第幾名
  const slotH = () => H.document.querySelector('#lob-step-room [data-pr-slot="settings"]');
  const slotTxt = await waitFor(() => { const s = slotH(); return (s && s.textContent.includes('對局設定')) ? s.textContent : null; }, 30000, 'H settings form');
  check('房間頁有數獨設定表單', !!slotTxt && slotTxt.includes('題目'));
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="hashi"]'));
  const gTabSync = await waitFor(() => G.window.__PLAT_NET.roomTab === 'hashi' ? true : null, 15000, 'G tab sync hashi');
  check('房主切數橋分頁 → 來賓同步', !!gTabSync);
  const hSlotHashi = await waitFor(() => { const s = slotH(); return (s && s.textContent.includes('關卡')) ? s : null; }, 15000, 'H hashi form');
  check('數橋分頁顯示數橋自己的設定（關卡）', !!hSlotHashi);
  check('數橋設定沒有「前 N 名結束／去第幾名」', !!hSlotHashi && !hSlotHashi.textContent.includes('名結束'));
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="race"]'));
  const gCfg = await waitFor(() => { const s = G.document.querySelector('#lob-step-room [data-pr-slot="settings"]'); return (s && s.querySelector('[data-hub-key="itemsEnabled"]')) ? s : null; }, 15000, 'G hashi race cfg sync');
  check('房主把數橋切大亂鬥 → 來賓同步看到道具開關', !!gCfg);
  check('房主端模式已存進 hub cfg', H.window.__PLAT_NET.hub.cfg.hashi.mode === 'race', H.window.__PLAT_NET.hub.cfg.hashi.mode);

  // 4) 切回數獨、大亂鬥、雙邊準備 → 開始鈕解鎖 → 按開始：載入遊戲且房主自動開局（倒數出現）
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await waitFor(() => H.window.__PLAT_NET.roomTab === 'sudoku' ? true : null, 15000, 'H tab back sudoku');
  clickEl(H, H.document.querySelector('#lob-step-room [data-hub-mode="brawl"]'));
  await sleep(800);
  const startBtn = () => H.document.querySelector('#lob-step-room [data-pr="start"]');
  check('未準備前開始鈕鎖住', !!startBtn() && startBtn().disabled === true);
  clickEl(H, H.document.querySelector('#lob-step-room [data-pr="ready"]'));
  clickEl(G, G.document.querySelector('#lob-step-room [data-pr="ready"]'));
  const unlocked = await waitFor(() => { const b = startBtn(); return (b && !b.disabled) ? b : null; }, 30000, 'start unlocked');
  check('雙邊準備後開始鈕解鎖', !!unlocked);
  clickEl(H, startBtn());
  const inMatch = await waitFor(() => (H.window.__PLAT_NET.inMatch === 'sudoku' && G.window.__PLAT_NET.inMatch === 'sudoku') ? true : null, 60000, 'both inMatch sudoku');
  check('按開始才載入遊戲（雙邊進數獨）', !!inMatch);
  const cd = await waitFor(() => (H.window.PlatCountdown && H.window.PlatCountdown._visible()) || (G.window.PlatCountdown && G.window.PlatCountdown._visible()) ? true : null, 90000, 'auto-start countdown');
  check('房主自動開局（倒數出現，不經遊戲等待室）', !!cd);

  // 5) 房主結束回房間 → 雙邊回房間框架頁
  H.window.__PLAT_NOTIFY('game-exit');
  const backHub = await waitFor(() => (hubRoom(H) && hubRoom(G) && !H.window.__PLAT_NET.inMatch) ? true : null, 60000, 'back to hub');
  check('對局結束 → 回房間框架頁（不是遊戲等待室）', !!backHub);

  // 5.5) v1.12.0 設定完整度：數獨表單補齊快速填答/循環模式/陷害道具延遲；數橋關卡有自訂尺寸＋寬高欄位
  const slotNow = () => H.document.querySelector('#lob-step-room [data-pr-slot="settings"]');
  const sudokuFull = await waitFor(() => { const s = slotNow(); return (s && s.querySelector('[data-hub-key="allowQuickFill"]') && s.querySelector('[data-hub-key="allowTraversal"]') && s.querySelector('[data-hub-key="weaponStartTime"]')) ? s : null; }, 30000, 'sudoku full settings');
  check('數獨等候室設定補齊（快速填答/循環模式/陷害道具延遲）', !!sudokuFull);
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="hashi"]'));
  const hashiCustomOpt = await waitFor(() => { const s = slotNow(); const sel = s && s.querySelector('[data-hub-key="sizeId"]'); return (sel && sel.querySelector('option[value="custom"]')) ? sel : null; }, 30000, 'hashi custom option');
  check('數橋關卡有自訂尺寸選項', !!hashiCustomOpt);
  if (hashiCustomOpt) { const setter = Object.getOwnPropertyDescriptor(H.window.HTMLSelectElement.prototype, 'value').set; setter.call(hashiCustomOpt, 'custom'); hashiCustomOpt.dispatchEvent(new H.window.Event('change', { bubbles: true })); }
  const customWH = await waitFor(() => { const s = slotNow(); return (s && s.querySelector('[data-hub-key="customW"]') && s.querySelector('[data-hub-key="customH"]')) ? s : null; }, 15000, 'custom W/H inputs');
  check('選自訂後出現寬/高欄位', !!customWH);
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="sudoku"]'));
  await waitFor(() => H.window.__PLAT_NET.roomTab === 'sudoku' ? true : null, 15000, 'H tab sudoku again');

  // 5.6) 房間頁改暱稱/代表色：直接在名單列點名字編輯（v1.12.1 起沒有獨立身份卡）；房主可改任何人、玩家可改自己
  check('沒有獨立的暱稱/代表色卡片', !H.document.querySelector('#hub-identity'));
  const gUid = G.window.__PLAT_NET.myUid;
  const rosterRegion = () => H.document.querySelector('#lob-step-room [data-pr-region="roster"]');
  clickEl(H, H.document.querySelector('#lob-step-room [data-id-edit="' + gUid + '"]'));
  const idNameInput = await waitFor(() => H.document.querySelector('#hub-id-name'), 15000, 'H id editor');
  check('房主點來賓名字 → 名單列內展開編輯器', !!idNameInput && !!rosterRegion() && rosterRegion().contains(idNameInput));
  if (idNameInput) idNameInput.value = '來賓改名';
  clickEl(H, H.document.querySelector('#lob-step-room [data-id-wheel]'));
  const pickOpen = await waitFor(() => H.document.querySelector('#plat-pick').style.display === 'flex' ? true : null, 10000, 'pick overlay open');
  check('編輯器改色 → 開摩天輪覆蓋層（無色票）', !!pickOpen && !H.document.querySelector('#lob-step-room [data-id-color]'));
  clickEl(H, H.document.querySelector('#plat-pick-spin'));
  const pickDone = await waitFor(() => H.document.querySelector('#plat-pick').style.display === 'none' ? true : null, 20000, 'pick settle');
  check('摩天輪定色 → 覆蓋層關閉', !!pickDone);
  clickEl(H, H.document.querySelector('#lob-step-room [data-id-save="' + gUid + '"]'));
  const renamed = await waitFor(() => { const e = (G.window.__PLAT_NET.roster || []).find(p => (p.uid || p.pid) === gUid); return (e && e.name === '來賓改名' && G.window.__PLAT_NET.me.name === '來賓改名') ? e : null; }, 30000, 'guest renamed by host');
  check('房主改來賓暱稱 → 來賓名單與本人身份同步', !!renamed);
  const colorSync = await waitFor(() => { const eh = (H.window.__PLAT_NET.roster || []).find(p => (p.uid || p.pid) === gUid); const eg = (G.window.__PLAT_NET.roster || []).find(p => (p.uid || p.pid) === gUid); return (eh && eg && eh.color === eg.color && G.window.__PLAT_NET.me.color === eg.color) ? eg : null; }, 15000, 'guest color sync');
  check('摩天輪改色 → 雙邊名單與來賓本人顏色一致', !!colorSync, colorSync ? colorSync.color : '');
  clickEl(G, G.document.querySelector('#lob-step-room [data-id-edit="' + gUid + '"]'));
  const gIdInput = await waitFor(() => G.document.querySelector('#hub-id-name'), 15000, 'G id editor');
  if (gIdInput) gIdInput.value = '來賓再改';
  clickEl(G, G.document.querySelector('#lob-step-room [data-id-save="' + gUid + '"]'));
  const renamed2 = await waitFor(() => { const e = (H.window.__PLAT_NET.roster || []).find(p => (p.uid || p.pid) === gUid); return (e && e.name === '來賓再改') ? e : null; }, 30000, 'guest renamed self');
  check('來賓改自己暱稱 → 房主名單同步', !!renamed2);

  // 6) 錦標賽：房間頁錦標賽分頁開賽（3 局數橋先），設定來自房間表單、兩款設定都在
  clickEl(H, H.document.querySelector('#lob-step-room [data-rtab="tourn"]'));
  const tSetup = await waitFor(() => { const el = H.document.querySelector('#lob-tourn-setup'); return (el && el.closest('[data-pr-region="tourn"]')) ? el : null; }, 30000, 'tourn setup in hub');
  check('錦標賽設定卡在房間頁內', !!tSetup);
  check('錦標賽卡有兩款大亂鬥設定', !!tSetup && !!H.document.querySelector('#ts-size') && !!H.document.querySelector('#th-size'));
  // v1.12.5：錦標賽分頁也要有卡片內聊天/視訊膠囊＋離開房間（不被分頁隱藏）；下方正方形 dock 條已刪
  const dkT = H.document.querySelector('#lob-step-room [data-pr-region="dock"]');
  check('錦標賽分頁有聊天/視訊膠囊', !!dkT && dkT.style.display !== 'none' && !!dkT.querySelector('[data-pr="dock-chat"]') && !!dkT.querySelector('[data-pr="dock-video"]'));
  const lvT = H.document.querySelector('#lob-step-room [data-pr="leave"]');
  check('錦標賽分頁有離開房間鈕', !!lvT && lvT.style.display !== 'none');
  check('下方 dock 條已刪除', !H.document.querySelector('#plat-dock'));
  // v1.74.0 卡片式選關：局數 3＋第 1 關換數橋（原 select 寫法已退役）
  H.document.querySelector('[data-tcount="3"]').click();
  H.document.querySelector('#t-cards [data-tpick="0:hashi"]').click();
  // v1.48.0：開賽改走房間卡準備閘門（兩邊準備好了 → 房主按名單卡開賽鈕）
  await waitFor(() => (H.document.querySelector('#lob-step-room [data-pr="ready"]') && G.document.querySelector('#lob-step-room [data-pr="ready"]')) ? true : null, 30000, 'tourn ready btns');
  for (const p of [H, G]) { const rb = p.document.querySelector('#lob-step-room [data-pr="ready"]'); if (rb && !rb.textContent.includes('已準備')) clickEl(p, rb); } // 前一場大亂鬥的準備狀態會留著，已準備就不要再點（會變取消）
  const tCardStartH = await waitFor(() => { const b = H.document.querySelector('#lob-step-room [data-pr="start"]'); return (b && !b.disabled && b.textContent.includes('開賽')) ? b : null; }, 30000, 'tourn card start');
  clickEl(H, tCardStartH);
  const tIn = await waitFor(() => (H.window.__PLAT_NET.tourn && H.window.__PLAT_NET.inMatch === 'hashi') ? true : null, 90000, 'tourn round1 hashi');
  check('錦標賽開賽 → 第 1 局數橋載入', !!tIn);
  const tCfg = H.window.__PLAT_NET.tourn;
  check('賽程帶著兩款設定（數獨尺寸/數橋關卡）', !!tCfg && !!tCfg.sudoku && !!tCfg.hashi && Number(tCfg.hashi.sizeId) >= 1, JSON.stringify(tCfg && tCfg.hashi));
  const gTourn = await waitFor(() => (G.window.__PLAT_NET.tourn && G.window.__PLAT_NET.inMatch === 'hashi') ? true : null, 60000, 'G tourn round1');
  check('來賓也進錦標賽第 1 局', !!gTourn);

  check('H 零頁面錯誤', H.errors.length === 0, H.errors.slice(0, 2).join(' | '));
  check('G 零頁面錯誤', G.errors.length === 0, G.errors.slice(0, 2).join(' | '));
  console.log('RESULT: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.log('FATAL', e && e.message); process.exit(2); });
