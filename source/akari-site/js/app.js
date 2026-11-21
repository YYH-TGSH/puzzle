// 美術燈 Akari（平台第四款）：React 單一 app。P1 範圍＝引擎＋單機＋每日；多人（大亂鬥/道具/錦標賽/回座）為 P2。
// 框架比照既有三款：PlatSave/PlatAudio/PlatTap/PlatBar/PlatCalendar/PlatGenerating 全走殼接點；
// 輸入管線比照地雷 v1.54.2＋v1.66.1：pointerup 在按下格結算（22px 漂移內）、尾隨 click 全域抑制窗（不帶 tag）。
const { useState, useEffect, useRef } = React;
// PlatPct：進度 % 滾字（v1.53.0 物理感規格）——殼層 PlatCount 的 React 包裝；獨立版（無 PlatCount）退回純文字（比照數獨/數橋/地雷同款元件，v1.72.0 追補接入）
function PlatPct(props) {
  var ref = useRef(null);
  var hRef = useRef(null);
  var v = Math.max(0, Math.min(100, Math.round(props.value) || 0));
  useEffect(function () {
    if (window.PlatCount && ref.current) {
      if (!hRef.current) hRef.current = window.PlatCount.mount(ref.current, { value: v, suffix: '%' });
      else window.PlatCount.set(hRef.current, v);
    }
  }, [v]);
  if (!window.PlatCount) return <span>{v}%</span>;
  return <span ref={ref}></span>;
}

// ---------- 小工具 ----------
function sGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
function sSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
// PlatSave facade（同地雷形：平台模式委派 window.PlatSave、獨立開啟用同語意本地後備）
var __psFacade = null;
function platSave() {
  if (__psFacade) return __psFacade;
  var regs = [];
  function findV(key) { var best = null; for (var i = 0; i < regs.length; i++) { if (key.indexOf(regs[i].p) === 0 && (!best || regs[i].p.length > best.p.length)) best = regs[i]; } return best ? best.fn : null; }
  function g(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function rm(k) { try { window.localStorage.removeItem(k); } catch (e) {} }
  var local = {
    getStr: function (k, fb) { var v = g(k); return (v === null || v === undefined) ? (fb || '') : v; },
    setStr: function (k, v) { try { window.localStorage.setItem(k, String(v)); } catch (e) {} },
    remove: rm,
    write: function (k, data) { try { window.localStorage.setItem(k, JSON.stringify({ __psv: 1, t: Date.now(), data: data })); } catch (e) {} },
    read: function (k, opts) {
      opts = opts || {}; var fb = ('fallback' in opts) ? opts.fallback : null;
      var raw = g(k); if (raw === null || raw === undefined) return fb;
      var parsed; try { parsed = JSON.parse(raw); } catch (e) { rm(k); return fb; }
      var data = parsed;
      if (parsed && typeof parsed === 'object' && parsed.__psv === 1 && 'data' in parsed) data = parsed.data;
      var fn = opts.validate;
      if (fn) { var ok = false; try { ok = !!fn(data, k); } catch (e) { ok = false; } if (!ok) { rm(k); return fb; } }
      return data;
    }
  };
  function impl() { return window.PlatSave || local; }
  __psFacade = {
    register: function (p, fn) { regs.push({ p: p, fn: fn }); if (window.PlatSave) window.PlatSave.register(p, fn); },
    getStr: function (k, fb) { return impl().getStr(k, fb); },
    setStr: function (k, v) { impl().setStr(k, v); },
    remove: function (k) { impl().remove(k); },
    write: function (k, data) { impl().write(k, data); },
    read: function (k, opts) {
      opts = opts || {};
      var fn = opts.validate || findV(k);
      var o = { fallback: ('fallback' in opts) ? opts.fallback : null };
      if (fn) o.validate = fn;
      return impl().read(k, o);
    }
  };
  return __psFacade;
}
platSave().register('akari_daily_records', function (p) { return !!p && typeof p === 'object' && !Array.isArray(p); });
platSave().register('akari_daily_streak', function (p) { return !!p && typeof p === 'object' && typeof p.count === 'number'; });
platSave().register('akari_resume', function (p) { return !!p && typeof p === 'object' && typeof p.cells === 'string' && typeof p.ts === 'number' && (Date.now() - p.ts) <= 3 * 3600 * 1000; });

// ---------- 多人（比照地雷競速架構：殼 Peer 連線 shim＋遊戲層 uid） ----------
const MP_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#06b6d4', '#f97316'];
function akariUid() { let u = sGet('plat_uid_akari'); if (!u) { u = 'a' + Math.random().toString(36).slice(2, 10); sSet('plat_uid_akari', u); } return u; }
function normName(n) { return String(n || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
function fmtMS(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
// PlatAudio：平台模式用殼的 window.PlatAudio；獨立開啟退化為靜音 no-op（配方由殼統一持有、不另抄一份避免漂移）
function platAudio() {
  if (typeof window !== 'undefined' && window.PlatAudio) return window.PlatAudio;
  return { play: function () {}, isMuted: function () { return false; }, toggleMuted: function () { return false; }, setMuted: function () {} };
}
function platTapNew(opts) {
  if (typeof window !== 'undefined' && window.PlatTap) return window.PlatTap(opts);
  // 後備（獨立開啟）：最小語意——tap 判定＋suppress 窗
  var downPt = null, supT = 0;
  return {
    down: function (x, y, t) { downPt = { x: x, y: y, t: t }; },
    move: function () { return { dragging: false }; },
    up: function (x, y) { var d = downPt ? Math.hypot(x - downPt.x, y - downPt.y) : 0; downPt = null; return { type: d <= (opts && opts.slop || 22) ? 'tap' : 'cancel' }; },
    poll: function () { return 'none'; },
    active: function () { return !!downPt; },
    cancel: function () { downPt = null; },
    markSuppress: function (t) { supT = t; },
    shouldSuppressClick: function (t) { return t - supT <= ((opts && opts.suppressMs) || 500); },
    clearSuppress: function () { supT = 0; }
  };
}

// ---------- 常數 ----------
const ACCENT = '#3b82f6'; // 主題色（2026-11-21 使用者裁示改藍：原琥珀與數獨黃太近）
const SIZES = {
  7: { id: 7, w: 7, h: 7, wallTarget: 0.20, stripRatio: 0.5, name: '7×7・小', short: '7×7' },
  10: { id: 10, w: 10, h: 10, wallTarget: 0.22, stripRatio: 0.5, name: '10×10・中', short: '10×10' },
  12: { id: 12, w: 12, h: 12, wallTarget: 0.24, stripRatio: 0.5, name: '12×12・大', short: '12×12' }
};
const SIZE_IDS = [7, 10, 12];
const DAILY_SIZE = 10;
function todayStr() { const t = new Date(), p = n => String(n).padStart(2, '0'); return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()); }
function shiftDate(ds, delta) { const d = new Date(ds + 'T12:00:00'); d.setDate(d.getDate() + delta); const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
function readDailyRecords() { return platSave().read('akari_daily_records', { fallback: {} }); }
function readDailyStreak() { return platSave().read('akari_daily_streak', { fallback: { last: '', count: 0 } }); }
function puzzleArrays(p) {
  return {
    w: p.w, h: p.h,
    walls: Array.from(p.walls).sort((a, b) => a - b),
    numbers: Array.from(p.numbers.entries()).map(([k, v]) => [k, v]),
    solution: Array.from(p.solution).sort((a, b) => a - b)
  };
}
function arraysToSets(a) {
  return { w: a.w, h: a.h, walls: new Set(a.walls), numbers: new Map(a.numbers), solution: new Set(a.solution) };
}

function AkariGame() {
  const [screen, setScreen] = useState('home'); // home | game
  const [sizeId, setSizeId] = useState(() => { const v = parseInt(platSave().getStr('akari_last_size', '10'), 10); return SIZES[v] ? v : 10; });
  const [puzzle, setPuzzle] = useState(null); // arrays 形
  const [cells, setCells] = useState([]); // 0 空 1 燈 2 叉 3 禮物鎖定燈 4 草稿燈（純假設層：不發光/不擋光/不計進度里程碑額度完賽/牆數字不計）
  const [status, setStatus] = useState('ready'); // ready | playing | won
  const [isDaily, setIsDaily] = useState(false);
  const [dailyDate, setDailyDate] = useState(null);
  const [dailySel, setDailySel] = useState(todayStr());
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState('tap'); // tap 鉛筆 | draft 草稿 | cross 塗叉（PlatBar 模式循環，比照數橋三模式）
  const [zoom, setZoom] = useState(1);
  // 適應模式循環（2026-11-21 項2：比照數獨/數橋補齊；0=手動 1=適應寬度 2=適應高度 3=自動）。預設手動、zoom=1 基線不變
  const [zoomModeIdx, setZoomModeIdx] = useState(0);
  const zoomModeIdxRef = useRef(0);
  const boardScrollRef = useRef(null);
  const ZOOM_GLYPHS = ['1X', '↔️', '↕️', '🔲'];
  const recalcRef = useRef(null);
  recalcRef.current = function (modeIdx) { // 只碰 ref/DOM/setState（PlatBar cfg 只建一次，閉包必須 ref 安全）
    var cont = boardScrollRef.current; if (!cont) return;
    var grid = cont.querySelector('.inline-grid'); if (!grid) return;
    var z0 = zoomRef.current || 1;
    var natW = grid.offsetWidth / z0, natH = grid.offsetHeight / z0;
    if (!natW || !natH) return;
    var availW = cont.clientWidth;
    var cr = cont.getBoundingClientRect();
    var visB = window.innerHeight;
    var barEl = platBarRef.current && platBarRef.current.firstElementChild;
    if (barEl) { var br = barEl.getBoundingClientRect(); if (br.height > 0 && br.top > cr.top) visB = Math.min(visB, br.top); }
    var availH = visB - cr.top - 4; // 可視下緣（PlatBar 頂）到盤面頂，扣 4px 守衛——同數獨項1修正後算式
    var z = null;
    if (modeIdx === 1) z = availW / natW;
    else if (modeIdx === 2) z = availH / natH;
    else if (modeIdx === 3) z = Math.min(availW / natW, availH / natH) * 0.95;
    if (z === null || !isFinite(z)) return;
    // 格長是整數 px：直接除法會被 Math.round(cellPx) 放大溢出（實測適應寬度 363 > 容器 350）→ 量化到整格邊界（只縮不漲）
    var gm = /repeat\((\d+),\s*([\d.]+)px\)/.exec(grid.style.gridTemplateColumns || '');
    if (gm) {
      var cols = parseInt(gm[1], 10), cellNow = parseFloat(gm[2]), cellBase = cellNow / z0;
      var rows = Math.round(grid.children.length / cols);
      var zCell = null;
      if (modeIdx === 1) zCell = Math.floor((availW - (cols - 1) * 3 - 18) / cols) / cellBase;
      else if (modeIdx === 2) zCell = Math.floor((availH - (rows - 1) * 3 - 18) / rows) / cellBase;
      else if (modeIdx === 3) zCell = Math.floor(z * cellBase) / cellBase;
      if (zCell && isFinite(zCell) && zCell > 0) z = Math.min(z, zCell);
    }
    z = Math.max(0.3, Math.round(z * 100) / 100);
    zoomRef.current = z; setZoom(z);
  };
  const cycleRef = useRef(null);
  cycleRef.current = function () {
    var next = (zoomModeIdxRef.current + 1) % 4;
    zoomModeIdxRef.current = next; setZoomModeIdx(next);
    if (next !== 0) { setTimeout(function () { if (recalcRef.current) recalcRef.current(next); }, 300); setTimeout(function () { if (recalcRef.current && zoomModeIdxRef.current === next) recalcRef.current(next); }, 900); } // 版面未定時先量會失真（實測 cont top 暫態差 54px）→ 300ms 主算＋900ms 定版重算
  };
  useEffect(() => { // 進對局/換題時適應模式重算（手動不動）
    if (screen === 'game' && zoomModeIdxRef.current !== 0) { var t = setTimeout(function () { if (recalcRef.current) recalcRef.current(zoomModeIdxRef.current); }, 300); return () => clearTimeout(t); }
  }, [screen, puzzle]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    var onR = function () { if (zoomModeIdxRef.current !== 0 && recalcRef.current) recalcRef.current(zoomModeIdxRef.current); };
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  const [winInfo, setWinInfo] = useState(null); // {secs, isDaily, dateStr}
  const [muted, setMuted] = useState(() => { try { return platAudio().isMuted(); } catch (e) { return false; } });
  const [streakInfo, setStreakInfo] = useState(() => readDailyStreak());

  const screenRef = useRef(screen); screenRef.current = screen;
  const sizeIdRef = useRef(sizeId); sizeIdRef.current = sizeId;
  const puzzleRef = useRef(null);
  const cellsRef = useRef(cells); cellsRef.current = cells;
  const statusRef = useRef(status); statusRef.current = status;
  const modeRef = useRef(mode); modeRef.current = mode;
  const startedAtRef = useRef(null);
  const isDailyRef = useRef(false); isDailyRef.current = isDaily;
  const dailySelRef = useRef(dailySel); dailySelRef.current = dailySel;
  const dailyDateRef = useRef(null); dailyDateRef.current = dailyDate;
  const zoomRef = useRef(1); zoomRef.current = zoom;
  const genTokenRef = useRef(0);
  const preGenRef = useRef(null); // {sizeId, job, puzzle}
  const preGenStatsRef = useRef({ jobs: 0, hits: 0 });
  const supTrkRef = useRef(null);
  const supTrk = () => { if (!supTrkRef.current) supTrkRef.current = platTapNew({ suppressMs: 500 }); return supTrkRef.current; };
  const downRef = useRef(null); // {idx, trk, painting:bool}
  // ---------- 上一步/下一步歷史（v1.73.0 項1：比照數獨/數橋；單位＝點按一步、拖曳一程一步；只存 cells 快照，里程碑/額度計數器單調不回退＝防 undo 農場） ----------
  const histRef = useRef({ past: [], future: [] });
  const [histVer, setHistVer] = useState(0);
  // ---------- 合作模式（v1.74.0 項5，比照地雷 ACT/DO 房主權威）：共用盤面、owners 標記者、本地草稿不外同步 ----------
  const ownersRef = useRef([]); const [owners, setOwners] = useState([]);
  const coopDraftRef = useRef(new Set()); const [coopDraftVer, setCoopDraftVer] = useState(0);
  const coopHistRef = useRef({ past: [], future: [] }); // 條目 {gid, idx, prev, v} 或 {gid, draft:true, idx, prev}；同 gid＝一手勢一步
  const actGidRef = useRef(0);
  const coopWonRef = useRef(0); const [coopWonMs, setCoopWonMs] = useState(0);
  function isCoop() { return mpRef.current.on && mpRef.current.mode === 'coop'; }
  function bumpCoop() { setCoopDraftVer(v => v + 1); setHistVer(v => v + 1); }
  function histPush(prevCells) { const H = histRef.current; H.past.push(prevCells.slice()); if (H.past.length > 200) H.past.shift(); H.future = []; setHistVer(v => v + 1); }
  function histReset() { histRef.current = { past: [], future: [] }; setHistVer(v => v + 1); }
  function histRestore(target) {
    const cur = cellsRef.current, next = target.slice();
    for (let i = 0; i < next.length; i++) if (cur[i] === 3) next[i] = 3; // 禮物鎖定燈不可被歷史覆寫（鎖定語意優先於 undo/redo）
    applyCells(next);
  }
  function canPlayNow() {
    if (statusRef.current === 'won') return false;
    if (mpRef.current.on && (mpRef.current.phase !== 'playing' || iAmSpecRef.current || outcomeRef.current)) return false;
    return true;
  }
  function doUndo() {
    if (isCoop()) { coopUndo(); return; } if (!canPlayNow()) return; const H = histRef.current; if (!H.past.length) return; const prev = H.past.pop(); H.future.push(cellsRef.current.slice()); setHistVer(v => v + 1); histRestore(prev); }
  function doRedo() {
    if (isCoop()) { coopRedo(); return; } if (!canPlayNow()) return; const H = histRef.current; if (!H.future.length) return; const nxt = H.future.pop(); H.past.push(cellsRef.current.slice()); setHistVer(v => v + 1); histRestore(nxt); }
  const platBarRef = useRef(null);
  const platHomeRef = useRef(null); // PlatHome 掛載點（框架層 F1）
  const platFrameRef = useRef(null); // PlatFrame 掛載點（框架修正批 v1.70.0：對局外框改殼持有）
  const [frameBody, setFrameBody] = useState(null); // PlatFrame 內容區節點（盤面 portal 用）
  const [ptcEl, setPtcEl] = useState(null); // PlatTopCard 掛載點＝外框頂區節點
  const [ptcSlot, setPtcSlot] = useState(null); // PlatTopCard 遊戲槽節點（portal 用）
  const newBulbRef = useRef(-1);
  // ---------- 多人狀態 ----------
  const myId = akariUid();
  const [mpOn, setMpOn] = useState(false);
  const [mpPhase, setMpPhase] = useState('waiting'); // waiting | countdown | playing | done
  const [players, setPlayers] = useState([]);
  const [godBoards, setGodBoards] = useState({});
  const [raceFinal, setRaceFinal] = useState(null);
  const [myOutcome, setMyOutcome] = useState(null); // 'finished'
  const [cdNum, setCdNum] = useState(null);
  const [itemToast, setItemToast] = useState(null);
  const [myItems, setMyItems] = useState({ trap: 0 });
  const [outageUntil, setOutageUntil] = useState(0);
  const [specUid, setSpecUid] = useState(null);
  const [myReadySt, setMyReadySt] = useState(false);
  const [leaveArm, setLeaveArm] = useState(false);
  const [waitTick, setWaitTick] = useState(0);
  const mpRef = useRef({ on: false, isHost: false, mode: 'race', tourn: null, tournInfo: null, hub: false, code: '', sizeId: 10, seed: 0, startAt: 0, phase: 'waiting', itemsAllow: true, itemDelay: 60 });
  const playersRef = useRef([]); playersRef.current = players;
  const godRef = useRef({});
  const finalRef = useRef(null);
  const outcomeRef = useRef(null);
  const sessRef = useRef(null);
  const hubColorRef = useRef(null);
  const peerRef = useRef(null), connsRef = useRef([]), hostConnRef = useRef(null);
  const itemsRef = useRef({ trap: 0 });
  const giftCreditRef = useRef(0);
  const milestoneRef = useRef(0);
  const countedWallsRef = useRef({});
  const lastProgRef = useRef(-1);
  const lastStateRef = useRef(0);
  const dismissRef = useRef(null);
  const cdIvRef = useRef(null);
  const autoIvRef = useRef(null);
  const autoFireIvRef = useRef(null);
  const lastOneDoneRef = useRef(false);
  const iAmSpecRef = useRef(false);
  const myReadyRef = useRef(false);
  const waitSinceRef = useRef(0);
  const itemToastTimerRef = useRef(null);
  const outageRef = useRef(0);
  function setPlayersBoth(list) { playersRef.current = list; setPlayers(list); }
  function godSet(uid, patch) { const g = Object.assign({}, godRef.current); g[uid] = Object.assign({}, g[uid] || { progress: 0, state: 'playing' }, patch); godRef.current = g; setGodBoards(g); }
  function itemSay(msg) { setItemToast(msg); if (itemToastTimerRef.current) clearTimeout(itemToastTimerRef.current); itemToastTimerRef.current = setTimeout(() => setItemToast(null), 4200); }

  const P = puzzle ? arraysToSets(puzzle) : null;

  // ---------- 計時 ----------
  useEffect(() => {
    if (status !== 'playing') return;
    const iv = setInterval(() => { if (startedAtRef.current) setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000)); }, 500);
    return () => clearInterval(iv);
  }, [status]);

  // ---------- 產生（job 分片＋PlatGenerating） ----------
  function runJob(job, key, onDone, onAbort) {
    const token = ++genTokenRef.current;
    let shown = false;
    if (window.PlatGenerating) { window.PlatGenerating.begin(key, () => { if (genTokenRef.current === token) { genTokenRef.current++; if (onAbort) onAbort(); } }); shown = true; }
    const slice = () => {
      if (genTokenRef.current !== token) { if (shown) window.PlatGenerating.end(); return; }
      const t0 = Date.now();
      let done = false;
      while (Date.now() - t0 < 40) { if (job.step()) { done = true; break; } }
      if (done) {
        if (shown) window.PlatGenerating.end();
        if (job.result) onDone(job.result); else if (onAbort) onAbort();
        return;
      }
      setTimeout(slice, 0);
    };
    setTimeout(slice, 0);
  }
  function applyPuzzle(p, daily, dateStr) {
    histReset();
    const arr = puzzleArrays(p);
    puzzleRef.current = arraysToSets(arr);
    setPuzzle(arr);
    setCells(new Array(p.w * p.h).fill(0));
    setIsDaily(!!daily); setDailyDate(dateStr || null);
    setStatus('ready'); setElapsed(0); startedAtRef.current = null;
    setWinInfo(null); setZoom(1); zoomRef.current = 1; zoomModeIdxRef.current = 0; setZoomModeIdx(0);
    setScreen('game');
  }
  function startSolo(szId) {
    const spec = SIZES[szId] || SIZES[10];
    const slot = preGenRef.current;
    if (slot && slot.sizeId === spec.id && slot.puzzle) { preGenRef.current = null; preGenStatsRef.current.hits++; applyPuzzle(slot.puzzle, false, null); return; }
    if (slot && slot.sizeId === spec.id && slot.job) {
      // 認領在飛的預生成 job 續跑
      preGenRef.current = null; preGenStatsRef.current.hits++;
      runJob(slot.job, 'akari-gen', (p) => applyPuzzle(p, false, null), () => setScreen('home'));
      return;
    }
    if (slot) preGenRef.current = null;
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    const job = window.Akari.createGenerateJob(spec.w, spec.h, { wallTarget: spec.wallTarget, stripRatio: spec.stripRatio }, seed, 40);
    runJob(job, 'akari-gen', (p) => applyPuzzle(p, false, null), () => setScreen('home'));
  }
  function startDaily(ds) {
    const spec = SIZES[DAILY_SIZE];
    const seed = window.Akari.hashSeed('akari-daily-' + ds);
    const job = window.Akari.createGenerateJob(spec.w, spec.h, { wallTarget: spec.wallTarget, stripRatio: spec.stripRatio }, seed, 40);
    runJob(job, 'akari-daily', (p) => applyPuzzle(p, true, ds), () => setScreen('home'));
  }
  // 閒置預生成：主畫面停留 ≥1.5s 為「上次選的尺寸」預生一題（記憶體一格、命中即用、換尺寸作廢；對局中不跑）
  useEffect(() => {
    if (screen !== 'home') return;
    const t = setTimeout(() => {
      if (screenRef.current !== 'home') return;
      const spec = SIZES[sizeIdRef.current] || SIZES[10];
      const slot = preGenRef.current;
      if (slot && slot.sizeId === spec.id && (slot.puzzle || slot.job)) return;
      const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
      const job = window.Akari.createGenerateJob(spec.w, spec.h, { wallTarget: spec.wallTarget, stripRatio: spec.stripRatio }, seed, 40);
      preGenRef.current = { sizeId: spec.id, job: job, puzzle: null };
      preGenStatsRef.current.jobs++;
      const drive = () => {
        const s2 = preGenRef.current;
        if (!s2 || s2.job !== job) return;
        if (screenRef.current !== 'home') { setTimeout(drive, 500); return; } // 對局中暫停（不 step）
        const t0 = Date.now();
        let done = false;
        while (Date.now() - t0 < 40) { if (job.step()) { done = true; break; } }
        if (done) { if (job.result && preGenRef.current && preGenRef.current.job === job) preGenRef.current = { sizeId: spec.id, job: null, puzzle: job.result }; return; }
        setTimeout(drive, 0);
      };
      setTimeout(drive, 0);
    }, 1500);
    return () => clearTimeout(t);
  }, [screen, sizeId]);

  // ---------- 遊玩 ----------
  function placedBulbs(cs) { const s = new Set(); for (let i = 0; i < cs.length; i++) if (cs[i] === 1 || cs[i] === 3) s.add(i); return s; } // 3＝禮物鎖定燈（計入放燈）
  function doWin(secs) {
    try { platAudio().play('complete'); } catch (e) {}
    setTimeout(() => { try { platAudio().play('win'); } catch (e) {} }, 350);
    if (isDaily && dailyDate) {
      const rec = readDailyRecords();
      if (rec[dailyDate] == null || secs < rec[dailyDate]) { rec[dailyDate] = secs; platSave().write('akari_daily_records', rec); }
      if (dailyDate === todayStr()) {
        const st = readDailyStreak();
        if (st.last !== dailyDate) {
          const next = (st.last === shiftDate(dailyDate, -1)) ? { last: dailyDate, count: (st.count || 0) + 1 } : { last: dailyDate, count: 1 };
          platSave().write('akari_daily_streak', next); setStreakInfo(next);
        }
      }
    }
    setWinInfo({ secs: secs, isDaily: isDaily, dateStr: dailyDate });
  }
  // ---------- 合作模式核心：ACT（來賓→房主）/ DO（房主→全場）逐動作同步 ----------
  function coopAct(idx, v, noHist) {
    if (mpRef.current.isHost) coopApply(idx, v, myId, false, noHist);
    else mpSend({ type: 'AKARI_ACT', idx: idx, v: v, uid: myId, noHist: noHist ? 1 : 0 });
  }
  function coopApply(idx, v, uid, remote, noHist) {
    const pz = puzzleRef.current; if (!pz || pz.walls.has(idx)) return;
    if (v !== 0 && v !== 1 && v !== 2) return;
    if (mpRef.current.phase !== 'playing' || coopWonRef.current) return;
    const prev = cellsRef.current[idx];
    if (prev === v) return;
    const next = cellsRef.current.slice(); next[idx] = v;
    cellsRef.current = next; setCells(next);
    const no = ownersRef.current.slice(); while (no.length < next.length) no.push('');
    no[idx] = v === 0 ? '' : uid; ownersRef.current = no; setOwners(no);
    if (uid === myId && !noHist) { coopHistRef.current.past.push({ gid: actGidRef.current, idx: idx, prev: prev, v: v }); if (coopHistRef.current.past.length > 400) coopHistRef.current.past.splice(0, 100); coopHistRef.current.future = []; }
    if (mpRef.current.isHost && !remote) hostBroadcast({ type: 'AKARI_DO', idx: idx, v: v, uid: uid, noHist: noHist ? 1 : 0 });
    setHistVer(x => x + 1);
    if (window.Akari.isSolved(pz.w, pz.h, pz.walls, pz.numbers, placedBulbs(next))) coopWin();
    else if (mpRef.current.isHost) saveResume();
  }
  function coopWin() {
    if (coopWonRef.current) return;
    const ms = Math.max(0, Date.now() - mpRef.current.startAt);
    coopWonRef.current = ms; setCoopWonMs(ms);
    if (!iAmSpecRef.current) { setStatus('won'); statusRef.current = 'won'; }
    if (mpRef.current.isHost) { hostBroadcast({ type: 'AKARI_COOP_WIN', ms: ms }); saveResume(); }
    try { platAudio().play('win'); } catch (e) {};
  }
  function coopTap(idx) {
    if (mpRef.current.phase !== 'playing' || coopWonRef.current || iAmSpecRef.current) return;
    const cur = cellsRef.current[idx];
    const md = modeRef.current;
    actGidRef.current++;
    if (md === 'draft') {
      if (cur !== 0) return;
      const has = coopDraftRef.current.has(idx);
      if (has) coopDraftRef.current.delete(idx); else coopDraftRef.current.add(idx);
      coopHistRef.current.past.push({ gid: actGidRef.current, draft: true, idx: idx, prev: has }); coopHistRef.current.future = [];
      bumpCoop();
      return;
    }
    let v;
    if (md === 'cross') { if (cur === 0) v = 2; else if (cur === 2) v = 0; else return; }
    else if (coopDraftRef.current.has(idx) && cur === 0) { coopDraftRef.current.delete(idx); bumpCoop(); v = 1; }
    else v = (cur + 1) % 3;
    coopAct(idx, v);
  }
  function coopUndo() {
    const H = coopHistRef.current; if (!H.past.length) return;
    const gid = H.past[H.past.length - 1].gid;
    const group = [];
    while (H.past.length && H.past[H.past.length - 1].gid === gid) group.push(H.past.pop());
    const applied = [];
    group.forEach(en => {
      if (en.draft) { if (en.prev) coopDraftRef.current.add(en.idx); else coopDraftRef.current.delete(en.idx); applied.push(en); return; }
      if (cellsRef.current[en.idx] === en.v) { coopAct(en.idx, en.prev, true); applied.push(en); } // 被夥伴改過的動作跳過（只撤自己的、且現值仍是自己放的）
    });
    if (applied.length) H.future.push({ gid: gid, entries: applied });
    bumpCoop();
  }
  function coopRedo() {
    const H = coopHistRef.current; if (!H.future.length) return;
    const g = H.future.pop();
    actGidRef.current++;
    g.entries.forEach(en => {
      if (en.draft) { if (en.prev) coopDraftRef.current.delete(en.idx); else coopDraftRef.current.add(en.idx); H.past.push({ gid: actGidRef.current, draft: true, idx: en.idx, prev: en.prev }); return; }
      if (cellsRef.current[en.idx] === en.prev) { coopAct(en.idx, en.v, true); H.past.push({ gid: actGidRef.current, idx: en.idx, prev: en.prev, v: en.v }); }
    });
    bumpCoop();
  }
  function applyCells(next) {
    const pz = puzzleRef.current; if (!pz) return;
    setCells(next); cellsRef.current = next;
    if (mpRef.current.on) { mpAfterCells(next); return; } // 多人：同步/里程碑/禮物/完賽走 MP 路徑
    if (statusRef.current === 'ready') { setStatus('playing'); statusRef.current = 'playing'; startedAtRef.current = Date.now(); }
    if (statusRef.current === 'playing') {
      const bulbs = placedBulbs(next);
      if (window.Akari.isSolved(pz.w, pz.h, pz.walls, pz.numbers, bulbs)) {
        setStatus('won'); statusRef.current = 'won';
        const secs = startedAtRef.current ? Math.floor((Date.now() - startedAtRef.current) / 1000) : 0;
        setElapsed(secs);
        doWin(secs);
      }
    }
  }
  function cycleCell(idx) {
    if (statusRef.current === 'won') return;
    if (mpRef.current.on && (mpRef.current.phase !== 'playing' || iAmSpecRef.current || outcomeRef.current)) return;
    const pz = puzzleRef.current; if (!pz || pz.walls.has(idx)) return;
    const cur = cellsRef.current[idx];
    if (isCoop()) { coopTap(idx); return; }
    if (cur === 3) return; // 鎖定燈不可點掉
    let nv;
    if (modeRef.current === 'draft') {
      // 草稿模式只動草稿層：空格→草稿燈、草稿燈→移除；真燈/叉不動（叉經塗叉模式或鉛筆循環處理）
      if (cur === 0) nv = 4; else if (cur === 4) nv = 0; else return;
    } else if (modeRef.current === 'cross') nv = (cur === 2) ? 0 : (cur === 0 ? 2 : cur);
    else if (cur === 4) nv = 1; // 鉛筆模式點草稿燈→一擊直接轉真燈（數橋「切回鉛筆點虛線變實線」刻意設計，比照保留）
    else nv = (cur + 1) % 3;
    if (nv === cur) return;
    histPush(cellsRef.current);
    const next = cellsRef.current.slice();
    next[idx] = nv;
    if (nv === 1) {
      newBulbRef.current = idx;
      const bulbs = placedBulbs(next);
      const conf = window.Akari.conflicts(pz.w, pz.h, pz.walls, pz.numbers, bulbs);
      try { platAudio().play(conf.badBulbs.has(idx) ? 'error' : 'place'); } catch (e) {}
    }
    applyCells(next);
  }
  function paintCross(idx) { // 拖曳塗記：草稿模式塗草稿燈（4）、其餘模式塗叉（2）；只塗空格
    if (statusRef.current === 'won') return;
    if (mpRef.current.on && (mpRef.current.phase !== 'playing' || iAmSpecRef.current || outcomeRef.current)) return;
    const pz = puzzleRef.current; if (!pz || pz.walls.has(idx)) return;
    if (cellsRef.current[idx] !== 0) return; // 燈/叉/鎖定燈/草稿都不覆寫
    if (isCoop()) { // 合作拖曳：草稿塗本地層、叉走 ACT 同步（同手勢同 gid，undo 一程一步）
      if (modeRef.current === 'draft') { if (!coopDraftRef.current.has(idx)) { coopDraftRef.current.add(idx); coopHistRef.current.past.push({ gid: actGidRef.current, draft: true, idx: idx, prev: false }); coopHistRef.current.future = []; bumpCoop(); } }
      else coopAct(idx, 2);
      return;
    }
    const next = cellsRef.current.slice(); next[idx] = (modeRef.current === 'draft') ? 4 : 2;
    applyCells(next);
  }
  // 輸入管線（比照地雷）：down 記格＋tracker；move 超 slop 且起手為空格 → 轉塗叉拖曳（elementFromPoint 命中格）；
  // up 在按下格結算 tap（漂移 ≤22px）；click 為鍵盤/程式備援（先過全域抑制窗）
  function onCellDown(idx, e) {
    const trk = platTapNew({ slop: 22, suppressMs: 500 });
    if (e && typeof e.clientX === 'number') trk.down(e.clientX, e.clientY, Date.now());
    downRef.current = { idx: idx, trk: trk, painting: false, scrollIntent: false, downT: Date.now(), downX: e && typeof e.clientX === 'number' ? e.clientX : 0, downY: e && typeof e.clientY === 'number' ? e.clientY : 0, lastX: e && typeof e.clientX === 'number' ? e.clientX : 0, lastY: e && typeof e.clientY === 'number' ? e.clientY : 0, lastT: Date.now(), isMouse: !!(e && e.pointerType === 'mouse') };
  }
  // 塗叉 vs 捲動分流（2026-11-21 項3，比照數橋「拖曳絕不能和捲動衝突」站規）：
  // 觸控手勢在越過 slop 的那一刻用「按下時長＋瞬時速度」判定意圖——快滑（<90ms 已越 slop、或速度 ≥0.55px/ms）
  // 視為捲動意圖，本次手勢整程不塗、放行容器原生捲動；慢速刻意拖曳才開始塗。滑鼠不分流（無拖曳捲動語意）。
  // 瀏覽器接管捲動會發 pointercancel → 清 downRef，防殘留手勢在下一次觸碰前誤塗（onBoardMove 另有 buttons 守衛）。
  function onBoardCancel() { downRef.current = null; }
  function onBoardMove(e) {
    const d = downRef.current; if (!d || !e || typeof e.clientX !== 'number') return;
    if (e.buttons === 0) { downRef.current = null; return; }
    const now = Date.now();
    let vel = 0;
    if (d.lastT && now > d.lastT) vel = Math.hypot(e.clientX - d.lastX, e.clientY - d.lastY) / (now - d.lastT);
    const dx = e.clientX - d.lastX, dy = e.clientY - d.lastY;
    d.lastX = e.clientX; d.lastY = e.clientY; d.lastT = now;
    if (d.scrollIntent) { // 格子是 touch-none、瀏覽器不代勞捲動 → 比照數橋手動 pan：以指標位移直接捲容器
      const cont = e.currentTarget;
      if (cont) { cont.scrollLeft -= dx; cont.scrollTop -= dy; }
      return;
    }
    if (!d.painting) {
      const r = d.trk.move ? d.trk.move(e.clientX, e.clientY) : { dragging: false };
      if (!r.dragging) return;
      if (!d.isMouse && (now - d.downT < 90 || vel >= 0.55)) { // 判定捲動意圖：先把累積位移一次捲掉（手感不跳），之後逐幀跟隨
        d.scrollIntent = true;
        const cont = e.currentTarget;
        if (cont) { cont.scrollLeft -= (e.clientX - d.downX); cont.scrollTop -= (e.clientY - d.downY); }
        return;
      }
      const pz = puzzleRef.current;
      if (pz && cellsRef.current[d.idx] === 0 && !pz.walls.has(d.idx)) { d.painting = true; if (isCoop()) actGidRef.current++; else histPush(cellsRef.current); paintCross(d.idx); } // 一整程拖曳＝一個歷史單位：起手推一次（coop 改開新 gid 分組）
      else return;
    }
    if (d.painting) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && el.dataset && el.dataset.cell != null) paintCross(Number(el.dataset.cell));
    }
  }
  function onCellUp(idx, e) {
    const d = downRef.current; downRef.current = null;
    if (!d) return;
    if (d.painting) { supTrk().markSuppress(Date.now()); return; }
    let isTap = true;
    if (d.trk && d.trk.active() && e && typeof e.clientX === 'number') { const r = d.trk.up(e.clientX, e.clientY, Date.now()); isTap = (r.type === 'tap'); }
    if (!isTap) return;
    supTrk().markSuppress(Date.now());
    cycleCell(d.idx);
  }
  function onCellClick(idx) {
    if (supTrk().shouldSuppressClick(Date.now(), idx)) { supTrk().clearSuppress(); return; }
    cycleCell(idx);
  }

  // ---------- 多人競速（比照地雷：房主權威名單/里程碑仲裁、來賓中繼） ----------
  function platTimeOffset() { try { return (window.__PLAT_NET && window.__PLAT_NET.timeOffset) || 0; } catch (e) { return 0; } }
  function myPlayer() { return playersRef.current.find(p => p.id === myId) || null; }
  function iAmSpec() { const mp = myPlayer(); return !!mp && !!mp.spectator; }
  function itemsLive() { return mpRef.current.on && mpRef.current.itemsAllow; }
  function progOf(uid) { const g = godRef.current[uid]; return g ? (g.progress || 0) : 0; }
  function unfinishedRacers() { return playersRef.current.filter(p => { if (p.spectator || p.pending) return false; if (p.id === myId) return !outcomeRef.current; const g = godRef.current[p.id]; return !g || g.state === 'playing'; }); }
  function amLastOne() { const u = unfinishedRacers(); return u.length === 1 && u[0].id === myId && playersRef.current.filter(p => !p.spectator && !p.pending).length > 1; }
  function pickWeighted(list, wfn) { let tot = 0; const ws = list.map(p => { const w = Math.max(0.0001, wfn(p)); tot += w; return w; }); let r = Math.random() * tot; for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; } return list[list.length - 1]; }
  function hostBroadcast(msg, exceptConn) { connsRef.current.forEach(c => { if (c !== exceptConn && c.open) { try { c.send(msg); } catch (e) {} } }); }
  function mpSend(msg) { if (mpRef.current.isHost) hostBroadcast(msg); else if (hostConnRef.current && hostConnRef.current.open) { try { hostConnRef.current.send(msg); } catch (e) {} } }
  function sendItemMsg(m) { if (mpRef.current.isHost) { hostBroadcast(m); processItemMsg(m); } else mpSend(m); }
  function cleanupMp() {
    histReset(); ownersRef.current = []; setOwners([]); coopDraftRef.current = new Set(); coopHistRef.current = { past: [], future: [] }; coopWonRef.current = 0; setCoopWonMs(0);
    if (cdIvRef.current) { clearInterval(cdIvRef.current); cdIvRef.current = null; }
    if (autoIvRef.current) { clearInterval(autoIvRef.current); autoIvRef.current = null; }
    if (autoFireIvRef.current) { clearInterval(autoFireIvRef.current); autoFireIvRef.current = null; }
    if (peerRef.current) { try { peerRef.current.destroy(); } catch (e) {} peerRef.current = null; }
    connsRef.current = []; hostConnRef.current = null;
    mpRef.current.on = false; mpRef.current.phase = 'waiting';
    setMpOn(false); setMpPhase('waiting'); setPlayersBoth([]); godRef.current = {}; setGodBoards({});
    setRaceFinal(null); finalRef.current = null; setMyOutcome(null); outcomeRef.current = null;
    setCdNum(null); iAmSpecRef.current = false; itemsRef.current = { trap: 0 }; setMyItems({ trap: 0 });
    giftCreditRef.current = 0; milestoneRef.current = 0; countedWallsRef.current = {}; lastOneDoneRef.current = false;
    setOutageUntil(0); outageRef.current = 0; dismissRef.current = null; setSpecUid(null);
  }
  // 數字牆「正確滿足」：相鄰燈數＝數字，且相鄰燈全是解答燈（規格第 5 節禮物額度來源）
  function correctWallsNow(cs) {
    const pz = puzzleRef.current; if (!pz) return [];
    const bulbs = placedBulbs(cs), out = [];
    pz.numbers.forEach((num, wi) => {
      const x = wi % pz.w, y = Math.floor(wi / pz.w);
      const nb = [];
      if (x > 0) nb.push(wi - 1); if (x < pz.w - 1) nb.push(wi + 1);
      if (y > 0) nb.push(wi - pz.w); if (y < pz.h - 1) nb.push(wi + pz.w);
      let cnt = 0, allSol = true;
      nb.forEach(j => { if (bulbs.has(j)) { cnt++; if (!pz.solution.has(j)) allSol = false; } });
      if (cnt === num && allSol) out.push(wi);
    });
    return out;
  }
  function akariResumeKey() { return 'akari_resume_' + (mpRef.current.code || '') + '_' + myId; }
  function saveResume() {
    if (!mpRef.current.on || iAmSpecRef.current || outcomeRef.current || mpRef.current.phase !== 'playing') return;
    if (!puzzleRef.current || !mpRef.current.seed) return;
    platSave().write(akariResumeKey(), { seed: mpRef.current.seed, sizeId: mpRef.current.sizeId, startAt: mpRef.current.startAt, cells: cellsRef.current.join(''), items: { trap: itemsRef.current.trap || 0 }, giftCredit: giftCreditRef.current, milestone: milestoneRef.current, countedWalls: Object.keys(countedWallsRef.current).map(Number), ts: Date.now(), mode: isCoop() ? 'coop' : 'race', owners: isCoop() ? ownersRef.current : undefined, drafts: isCoop() ? Array.from(coopDraftRef.current) : undefined });
  }
  function loadResumeAny() {
    try { return platSave().read(akariResumeKey(), { fallback: null, validate: (p) => !!p && typeof p.seed === 'number' && typeof p.cells === 'string' }); } catch (e) { return null; }
  }
  // ----- 競速同步：進度小訊息＋god 快照節流＋里程碑逐格補報＋禮物額度 -----
  function raceSync(next) {
    const pz = puzzleRef.current; if (!pz) return;
    const bulbs = placedBulbs(next);
    const prog = window.Akari.progressOf(pz.solution, bulbs);
    godSet(myId, { progress: prog });
    const pi = Math.floor(prog * 100);
    if (pi !== lastProgRef.current) { lastProgRef.current = pi; mpSend({ type: 'AKARI_PROGRESS', uid: myId, progress: prog }); }
    // 里程碑只認「自己放的」正確燈（不含禮物鎖定燈）：一盞燈≈10% 進度（7×7），禮物燈若也鑄里程碑會自我連鎖（禮物→里程碑→禮物…數秒完賽雙邊，實測抓到）；官方進度/完賽仍計全部正確燈
    let selfCorrect = 0; for (let si = 0; si < next.length; si++) if (next[si] === 1 && pz.solution.has(si)) selfCorrect++;
    const selfProg = pz.solution.size ? selfCorrect / pz.solution.size : 0;
    const band = Math.floor(selfProg * 20); // 每 5% 一格
    while (milestoneRef.current < band) { milestoneRef.current++; if (mpRef.current.isHost) hostHandleMilestone(myId); else mpSend({ type: 'AKARI_MILESTONE', uid: myId }); }
    if (itemsLive()) {
      let gained = false;
      correctWallsNow(next).forEach(wi => { if (!countedWallsRef.current[wi]) { countedWallsRef.current[wi] = 1; giftCreditRef.current += 0.5; gained = true; } });
      if (gained) trySendGift();
    }
    const now = Date.now();
    if (now - lastStateRef.current > 800) { lastStateRef.current = now; const cs = next.map(v => v === 4 ? 0 : v).join(''); godSet(myId, { cells: cs }); mpSend({ type: 'AKARI_STATE', uid: myId, cells: cs, progress: prog }); } // 草稿不同步給對手：同步字串剝 4→0（本地 saveResume 保留原值）
    saveResume();
  }
  function mpAfterCells(next) {
    if (mpRef.current.phase !== 'playing' || iAmSpecRef.current || outcomeRef.current) return;
    const pz = puzzleRef.current; if (!pz) return;
    const bulbs = placedBulbs(next);
    if (window.Akari.isSolved(pz.w, pz.h, pz.walls, pz.numbers, bulbs)) { mpFinish(next); return; }
    raceSync(next);
  }
  function mpFinish(next) {
    outcomeRef.current = 'finished'; setMyOutcome('finished');
    setStatus('won'); statusRef.current = 'won';
    const tms = Math.max(0, Date.now() - mpRef.current.startAt);
    setElapsed(Math.floor(tms / 1000));
    try { platAudio().play('complete'); } catch (e) {}
    setTimeout(() => { try { platAudio().play('win'); } catch (e) {} }, 350);
    const cs = next.map(v => v === 4 ? 0 : v).join('');
    godSet(myId, { state: 'finished', timeMs: tms, progress: 1, cells: cs });
    mpSend({ type: 'AKARI_STATE', uid: myId, cells: cs, progress: 1 });
    mpSend({ type: 'AKARI_FINISH', uid: myId, timeMs: tms });
    itemSay('🏁 你完賽了！自動轉觀戰，看大家的盤面');
    checkRaceEnd();
  }
  // ----- 道具（房主仲裁里程碑；禮物即時生效；斷電純視覺） -----
  function hostHandleMilestone(fromUid) {
    if (!mpRef.current.isHost || !itemsLive()) return;
    if (Date.now() - (mpRef.current.startAt || 0) < (mpRef.current.itemDelay || 0) * 1000) return; // 延遲內跨的里程碑不發（比照地雷/數獨）
    const pool = unfinishedRacers(); if (!pool.length) return;
    if (pool.length === 1) { sendItemMsg({ type: 'AKARI_GIFT', uid: myId, fromUid: fromUid, fromName: '里程碑', toUid: pool[0].id }); return; } // 只剩一人：里程碑直接發禮物
    // 種類以「里程碑達成者」自己的進度 p 擲骰（定版公式：禮物 (1−p)²+0.1／陷阱 p²+0.1）——落後者多拿禮物線、領先者多拿陷阱（與數獨武器/禮物同語意；若以收禮者 p 擲，收禮者恆為弱者、陷阱永遠擲不出）
    const pe = progOf(fromUid);
    const giftW = Math.pow(1 - pe, 2) + 0.1, trapW = Math.pow(pe, 2) + 0.1;
    if (Math.random() < giftW / (giftW + trapW)) {
      const tgt = pickWeighted(pool, p => Math.pow(1 - progOf(p.id), 2) + 0.1); // 禮物送給較弱者（扶弱加權；可為達成者自己）
      sendItemMsg({ type: 'AKARI_GIFT', uid: myId, fromUid: fromUid, fromName: '里程碑', toUid: tgt.id });
    } else {
      sendItemMsg({ type: 'AKARI_GRANT', uid: myId, toUid: fromUid, item: 'trap' }); // 陷阱進達成者的庫存，由他發動
    }
  }
  function processItemMsg(m) {
    if (m.type === 'AKARI_GRANT' && m.toUid === myId) applyItemGrant(m.item);
    else if (m.type === 'AKARI_GIFT' && m.toUid === myId) { applyGiftEffect(m.fromName || ''); try { if (window.PlatFly) window.PlatFly.fly(window.PlatFly.byUid('akari', m.fromUid), window.PlatFly.me('akari'), '🎁'); } catch (e) {} }
    else if (m.type === 'AKARI_HIT' && m.toUid === myId) applyOutage(m.fromName || '');
    saveResume();
  }
  function applyItemGrant(item) {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current) return;
    if (item === 'gift') { applyGiftEffect('里程碑'); return; }
    if (amLastOne()) { applyGiftEffect(''); itemSay('🏁 只剩你一人，里程碑陷阱自動轉成禮物！'); return; }
    const ni = { trap: (itemsRef.current.trap || 0) + 1 }; itemsRef.current = ni; setMyItems(ni);
    try { platAudio().play('star'); } catch (e) {}
    itemSay('🎁 里程碑道具：⚡ 斷電陷阱 ×' + ni.trap + (ni.trap >= 3 ? '（集滿 3 自動發動！）' : ''));
    maybeAutoFire();
  }
  function giftCandidates() { const pz = puzzleRef.current; if (!pz) return []; const out = []; pz.solution.forEach(i => { const c = cellsRef.current[i]; if (c === 0 || c === 2) out.push(i); }); return out; }
  function applyGiftEffect(fromName) {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current || mpRef.current.phase !== 'playing') return;
    const cand = giftCandidates();
    if (!cand.length) { itemSay('🎁 禮物落空：正確位置都已經放好燈了'); return; }
    const idx = cand[Math.floor(Math.random() * cand.length)];
    const next = cellsRef.current.slice(); next[idx] = 3; // 鎖定燈（不可移除）
    try { platAudio().play('gift'); } catch (e) {}
    itemSay(fromName === '里程碑' ? '🎁 里程碑禮物：一盞燈已幫你放好並鎖定！' : ('🎁 ' + (fromName ? fromName + ' 送的禮物' : '禮物') + '：一盞燈已幫你放好並鎖定！'));
    applyCells(next);
  }
  function trySendGift() {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current || mpRef.current.phase !== 'playing') return;
    if (Date.now() - (mpRef.current.startAt || 0) < (mpRef.current.itemDelay || 0) * 1000) return; // 延遲內先存額度
    while (giftCreditRef.current >= 1) {
      const myP = progOf(myId);
      const weaker = unfinishedRacers().filter(p => p.id !== myId && progOf(p.id) < myP);
      if (!weaker.length) return; // 沒有較弱的對象就存著
      const tgt = pickWeighted(weaker, p => Math.sqrt((myP - progOf(p.id)) * 100 + 1));
      giftCreditRef.current -= 1;
      sendItemMsg({ type: 'AKARI_GIFT', uid: myId, fromUid: myId, fromName: (myPlayer() || {}).name || '', toUid: tgt.id });
      try { if (window.PlatFly) window.PlatFly.fly(window.PlatFly.me('akari'), window.PlatFly.byUid('akari', tgt.id), '🎁'); } catch (e) {}
      // 送出不提示（比照地雷：避免間接洩漏自己剛滿足了數字牆）
    }
  }
  function fireTrap() {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current) return;
    if ((itemsRef.current.trap || 0) <= 0) return;
    const tgts = unfinishedRacers().filter(p => p.id !== myId);
    if (!tgts.length) { itemSay('目前沒有可斷電的對手'); return; }
    const tgt = pickWeighted(tgts, p => Math.pow(progOf(p.id), 2) + 0.1); // 攻擊權重（打強者）定版公式
    const ni = { trap: itemsRef.current.trap - 1 }; itemsRef.current = ni; setMyItems(ni);
    sendItemMsg({ type: 'AKARI_HIT', uid: myId, fromUid: myId, fromName: (myPlayer() || {}).name || '', toUid: tgt.id, kind: 'outage' });
    itemSay('⚡ 已讓 ' + tgt.name + ' 斷電 5 秒！');
  }
  function maybeAutoFire() {
    if (autoFireIvRef.current) return;
    if ((itemsRef.current.trap || 0) < 3) return;
    try { platAudio().play('star'); } catch (e) {}
    autoFireIvRef.current = setInterval(() => {
      const hasTgt = unfinishedRacers().some(p => p.id !== myId);
      if ((itemsRef.current.trap || 0) <= 0 || !hasTgt || outcomeRef.current || !itemsLive()) { clearInterval(autoFireIvRef.current); autoFireIvRef.current = null; return; }
      fireTrap();
    }, 550);
  }
  function tryConvertLastOne() {
    if (lastOneDoneRef.current || !itemsLive()) return;
    if (!amLastOne()) return;
    lastOneDoneRef.current = true;
    const held = itemsRef.current.trap || 0;
    if (held > 0) {
      itemsRef.current = { trap: 0 }; setMyItems({ trap: 0 });
      itemSay('🏁 只剩你一人，未用的斷電陷阱全部轉成禮物！');
      for (let i = 0; i < held; i++) setTimeout(() => applyGiftEffect(''), 550 * (i + 1));
    }
  }
  function applyOutage(fromName) {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current) return;
    if (amLastOne()) { applyGiftEffect(''); itemSay('🏁 只剩你一人，' + (fromName || '對手') + ' 的斷電自動轉成禮物！'); return; }
    const until = Date.now() + 5000;
    outageRef.current = until; setOutageUntil(until);
    try { platAudio().play('error'); } catch (e) {}
    itemSay('⚡ ' + (fromName || '對手') + ' 讓你斷電 5 秒！燈都還在，只是光暈暫時消失');
  }
  function checkRaceEnd() {
    if (finalRef.current || !mpRef.current.on) return;
    const racers = playersRef.current.filter(p => !p.spectator && !p.pending);
    if (!racers.length) return;
    const allDone = racers.every(p => { if (p.offline) return true; const g = godRef.current[p.id]; return g && g.state === 'finished'; });
    if (!allDone) return;
    const fins = [], rest = [];
    racers.forEach(p => {
      const g = godRef.current[p.id] || { progress: 0, state: 'playing' };
      const e = { key: p.id, name: p.name, color: p.color, isMe: p.id === myId, uid: p.id, g: g, offline: !!p.offline };
      if (g.state === 'finished') fins.push(e); else rest.push(e);
    });
    fins.sort((a, b) => (a.g.timeMs || 0) - (b.g.timeMs || 0));
    rest.sort((a, b) => (b.g.progress || 0) - (a.g.progress || 0));
    const entries = fins.concat(rest).map(e => ({
      key: e.key, name: e.name, color: e.color, isMe: e.isMe,
      right: e.g.state === 'finished' ? ('⏱ ' + fmtMS(e.g.timeMs || 0)) : ('未完成・' + Math.floor((e.g.progress || 0) * 100) + '%')
    }));
    const fin = { entries: entries, winnerUid: fins.length ? fins[0].key : null };
    finalRef.current = fin; setRaceFinal(fin);
    mpRef.current.phase = 'done'; setMpPhase('done');
  }

  // ----- 開局／連線（房主種子開局；同 seed 全端同題——引擎確定性） -----
  function derivePuzzle(seed, szId) {
    const spec = SIZES[szId] || SIZES[10];
    let sd = seed >>> 0;
    for (let t = 0; t < 6; t++) { const p = window.Akari.generate(spec.w, spec.h, { wallTarget: spec.wallTarget, stripRatio: spec.stripRatio }, sd); if (p) return { puzzle: p, seed: sd }; sd = (sd + 1) >>> 0; }
    return null;
  }
  function applyMpPuzzle(p, startAt) {
    histReset();
    const arr = puzzleArrays(p);
    puzzleRef.current = arraysToSets(arr);
    setPuzzle(arr);
    setCells(new Array(p.w * p.h).fill(0)); cellsRef.current = new Array(p.w * p.h).fill(0);
    setIsDaily(false); setDailyDate(null);
    setStatus('ready'); statusRef.current = 'ready';
    startedAtRef.current = startAt; setElapsed(0);
    setWinInfo(null); setZoom(1); zoomRef.current = 1; zoomModeIdxRef.current = 0; setZoomModeIdx(0);
    setScreen('game');
  }
  function startMatchLocal(seed, szId, startAt) {
    startAt = startAt - platTimeOffset();
    const d = derivePuzzle(seed, szId); if (!d) return;
    mpRef.current.seed = d.seed; mpRef.current.sizeId = szId; mpRef.current.startAt = startAt; mpRef.current.phase = 'countdown';
    setRaceFinal(null); finalRef.current = null; setMyOutcome(null); outcomeRef.current = null;
    godRef.current = {}; setGodBoards({}); dismissRef.current = null; setSpecUid(null);
    itemsRef.current = { trap: 0 }; setMyItems({ trap: 0 }); giftCreditRef.current = 0; milestoneRef.current = 0; countedWallsRef.current = {}; lastOneDoneRef.current = false; lastProgRef.current = -1; lastStateRef.current = 0;
    ownersRef.current = []; setOwners([]); coopDraftRef.current = new Set(); coopHistRef.current = { past: [], future: [] }; coopWonRef.current = 0; setCoopWonMs(0);
    setOutageUntil(0); outageRef.current = 0;
    setMyReadySt(false); myReadyRef.current = false;
    const spec2 = iAmSpec(); iAmSpecRef.current = spec2;
    if (!spec2) applyMpPuzzle(d.puzzle, startAt);
    else { const arrS = puzzleArrays(d.puzzle); puzzleRef.current = arraysToSets(arrS); setPuzzle(arrS); setCells([]); cellsRef.current = []; setScreen('game'); } // 觀戰者留題目給觀戰盤面渲染（自己不下場）
    setMpPhase('countdown');
    if (cdIvRef.current) clearInterval(cdIvRef.current);
    cdIvRef.current = setInterval(() => {
      const rem = startAt - Date.now();
      if (rem <= 0) {
        clearInterval(cdIvRef.current); cdIvRef.current = null;
        setCdNum('GO!'); setTimeout(() => setCdNum(null), 650);
        mpRef.current.phase = 'playing'; setMpPhase('playing');
        if (!iAmSpecRef.current) { setStatus('playing'); statusRef.current = 'playing'; }
      } else setCdNum(Math.ceil(rem / 1000));
    }, 100);
  }
  function startMatch() {
    if (!mpRef.current.isHost) return;
    if (mpRef.current.phase !== 'waiting' && mpRef.current.phase !== 'done') return;
    if (autoIvRef.current) { clearInterval(autoIvRef.current); autoIvRef.current = null; }
    const seed = (Math.random() * 4294967296) >>> 0, startAt = Date.now() + 3500;
    const szId = mpRef.current.sizeId;
    if (!derivePuzzle(seed, szId)) return;
    setPlayersBoth(playersRef.current.filter(p => !p.pending).map(p => Object.assign({}, p, { ready: false })));
    hostBroadcast({ type: 'PLAYERS_UPDATE', players: playersRef.current });
    hostBroadcast({ type: 'AKARI_START', seed: seed, sizeId: szId, startAt: startAt });
    startMatchLocal(seed, szId, startAt);
  }
  function hostOnJoin(m, conn) {
    conn.__uid = m.uid;
    const phase = mpRef.current.phase;
    const lateSpec = (phase === 'countdown' || phase === 'playing');
    let list = playersRef.current.slice();
    const ex = list.find(p => p.id === m.uid);
    if (ex) list = list.map(p => p.id === m.uid ? Object.assign({}, p, { name: m.pName, offline: false }) : p);
    else {
      const pend = list.findIndex(p => p.pending && normName(p.name) === normName(m.pName || ''));
      const color = (typeof m.color === 'string' && m.color) ? m.color : MP_COLORS[list.filter(p => !p.pending).length % MP_COLORS.length];
      const entry = { id: m.uid, name: m.pName || '玩家', color: pend >= 0 ? list[pend].color : color, isHost: false, spectator: lateSpec, ready: false, offline: false };
      if (pend >= 0) list[pend] = entry; else list.push(entry);
    }
    setPlayersBoth(list);
    hostBroadcast({ type: 'PLAYERS_UPDATE', players: list }, conn);
    const myEntry = list.find(p => p.id === m.uid);
    try { conn.send({ type: 'INIT', players: list, sizeId: mpRef.current.sizeId, phase: phase, seed: (myEntry && myEntry.spectator) ? undefined : mpRef.current.seed, startAt: mpRef.current.startAt, god: godRef.current, youSpec: !!(myEntry && myEntry.spectator), puzzle: (myEntry && myEntry.spectator && puzzleRef.current) ? { w: puzzleRef.current.w, h: puzzleRef.current.h, walls: Array.from(puzzleRef.current.walls), numbers: Array.from(puzzleRef.current.numbers.entries()), solution: Array.from(puzzleRef.current.solution) } : undefined, coopSnap: (isCoop() && (phase === 'countdown' || phase === 'playing')) ? { cells: cellsRef.current.join(''), owners: ownersRef.current } : undefined }); } catch (e) {}
  }
  function guestOnInit(m) {
    setPlayersBoth(m.players || []);
    mpRef.current.sizeId = m.sizeId || mpRef.current.sizeId;
    setSizeId(m.sizeId || 10);
    iAmSpecRef.current = !!m.youSpec;
    if (m.god) { godRef.current = m.god; setGodBoards(m.god); }
    if (m.phase === 'countdown' || m.phase === 'playing') {
      mpRef.current.seed = m.seed; mpRef.current.startAt = m.startAt;
      if (m.youSpec) {
        if (m.puzzle) { puzzleRef.current = arraysToSets(m.puzzle); setPuzzle(m.puzzle); }
        setCells([]); cellsRef.current = [];
        if (isCoop() && m.coopSnap && typeof m.coopSnap.cells === 'string') { const arrSp = m.coopSnap.cells.split('').map(Number); if (!arrSp.some(v => !(v >= 0 && v <= 2))) { setCells(arrSp); cellsRef.current = arrSp; if (m.coopSnap.owners) { ownersRef.current = m.coopSnap.owners; setOwners(m.coopSnap.owners); } } }
        mpRef.current.phase = m.phase; setMpPhase(m.phase); setScreen('game');
        if (m.phase === 'countdown' && m.startAt) {
          const specDelay = Math.max(0, m.startAt - Date.now()) + 60;
          setTimeout(() => { if (mpRef.current.phase === 'countdown' && iAmSpecRef.current) { mpRef.current.phase = 'playing'; setMpPhase('playing'); } }, specDelay);
        }
      } else {
        startMatchLocal(m.seed, m.sizeId, m.startAt);
        resumeRestore(m);
      }
    }
  }
  function resumeRestore(m) {
    const sp = SIZES[m.sizeId] || SIZES[10], total = sp.w * sp.h;
    let save = null;
    try { save = platSave().read(akariResumeKey(), { fallback: null, validate: (p) => !!p && p.seed === m.seed && p.sizeId === m.sizeId && !!p.cells && p.cells.length === total }); } catch (e) {}
    if (isCoop()) { // 合作回座：房主 INIT 的 coopSnap 優先、本地存檔備援；不走競速 raceSync
      let arrC = null, ownC = null, drC = null;
      if (m.coopSnap && typeof m.coopSnap.cells === 'string' && m.coopSnap.cells.length === total) { arrC = m.coopSnap.cells.split('').map(Number); ownC = m.coopSnap.owners || null; }
      else if (save && save.mode === 'coop') { arrC = save.cells.split('').map(Number); ownC = save.owners || null; drC = save.drafts || null; }
      if (!arrC || arrC.some(v => !(v >= 0 && v <= 2))) return;
      setCells(arrC); cellsRef.current = arrC;
      if (ownC) { ownersRef.current = ownC; setOwners(ownC); }
      if (drC) { coopDraftRef.current = new Set(drC); bumpCoop(); }
      itemSay('↩ 已接續合作盤面');
      return;
    }
    let cellsArr = null;
    if (save) cellsArr = save.cells.split('').map(Number);
    else if (m.god && m.god[myId] && typeof m.god[myId].cells === 'string' && m.god[myId].cells.length === total) cellsArr = m.god[myId].cells.split('').map(Number);
    if (!cellsArr || cellsArr.some(v => !(v >= 0 && v <= 4))) return;
    if (save) {
      itemsRef.current = { trap: (save.items && save.items.trap) || 0 }; setMyItems(itemsRef.current);
      giftCreditRef.current = save.giftCredit || 0; milestoneRef.current = save.milestone || 0;
      countedWallsRef.current = {}; (save.countedWalls || []).forEach(wi => { countedWallsRef.current[wi] = 1; });
    }
    setCells(cellsArr); cellsRef.current = cellsArr;
    const myGod = m.god && m.god[myId];
    if (myGod && myGod.state === 'finished') {
      outcomeRef.current = 'finished'; setMyOutcome('finished');
      setStatus('won'); statusRef.current = 'won';
      godSet(myId, { state: 'finished', timeMs: myGod.timeMs, progress: 1 });
      return;
    }
    lastStateRef.current = 0;
    raceSync(cellsArr);
    itemSay('↩ 已接續中斷前的對局進度');
  }
  function onMpData(m, conn) {
    if (!m || !m.type) return;
    const H = mpRef.current.isHost;
    if (H && conn && conn.__uid && m.uid && m.uid !== conn.__uid && ['AKARI_FINISH', 'AKARI_STATE', 'AKARI_PROGRESS', 'AKARI_MILESTONE', 'AKARI_GIFT', 'AKARI_HIT', 'AKARI_ACT', 'READY', 'REQ_REMATCH'].indexOf(m.type) >= 0) return; // 房主驗寄件者（比照地雷）
    switch (m.type) {
      case 'JOIN': if (H) hostOnJoin(m, conn); break;
      case 'INIT': if (!H) guestOnInit(m); break;
      case 'PLAYERS_UPDATE': if (!H) { setPlayersBoth(m.players || []); const mp2 = myPlayer(); if (mp2) iAmSpecRef.current = !!mp2.spectator; } break;
      case 'READY': if (H) { setPlayersBoth(playersRef.current.map(p => p.id === m.uid ? Object.assign({}, p, { ready: !!m.ready }) : p)); hostBroadcast({ type: 'PLAYERS_UPDATE', players: playersRef.current }); } break;
      case 'AKARI_START': if (!H) startMatchLocal(m.seed, m.sizeId, m.startAt); break;
      case 'AKARI_ACT': if (H && isCoop()) { const plA = playersRef.current.find(p => p.id === m.uid); if (plA && !plA.spectator && mpRef.current.phase === 'playing') coopApply(m.idx, m.v, m.uid, false, !!m.noHist); } break; // 房主權威：觀戰者/非進行中的 ACT 不受理（比照地雷）
      case 'AKARI_DO': if (!H && isCoop()) coopApply(m.idx, m.v, m.uid, true, !!m.noHist); break;
      case 'AKARI_COOP_WIN': if (isCoop() && !coopWonRef.current) { coopWonRef.current = m.ms || 1; setCoopWonMs(m.ms || 1); if (!iAmSpecRef.current) { setStatus('won'); statusRef.current = 'won'; } try { platAudio().play('win'); } catch (e) {}; } break;
      case 'AKARI_PROGRESS': godSet(m.uid, { progress: m.progress || 0 }); if (H) hostBroadcast(m, conn); break;
      case 'AKARI_STATE': godSet(m.uid, { cells: m.cells, progress: m.progress || 0 }); if (H) hostBroadcast(m, conn); break;
      case 'AKARI_FINISH': godSet(m.uid, { state: 'finished', timeMs: m.timeMs, progress: 1 }); if (H) hostBroadcast(m, conn); checkRaceEnd(); tryConvertLastOne(); break;
      case 'AKARI_MILESTONE': if (H) hostHandleMilestone(m.uid); break;
      case 'AKARI_GRANT': if (!H) processItemMsg(m); break; // 房主發出時已在 sendItemMsg 本地處理；來賓鍛造的 GRANT 房主不受理
      case 'AKARI_GIFT': if (H) hostBroadcast(m, conn); processItemMsg(m); break;
      case 'AKARI_HIT': if (H) hostBroadcast(m, conn); processItemMsg(m); break;
      case 'REQ_LOBBY': if (H) { if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY('game-exit'); } break;
      case 'REQ_REMATCH': if (H) startMatch(); break;
      case 'HOST_LEFT': if (!H) onHostLeft(m); break;
    }
  }
  function onHostLeft(m) {
    const racers = playersRef.current.filter(p => !p.isHost && !p.offline && !p.spectator && !p.pending);
    const pool = racers.length ? racers : playersRef.current.filter(p => !p.isHost && !p.offline && !p.pending);
    if (pool.length && pool[0].id === myId) becomeHost(true);
  }
  function onConnClose(conn) {
    if (!mpRef.current.isHost) return;
    const uid = conn.__uid; if (!uid) return;
    setPlayersBoth(playersRef.current.map(p => p.id === uid ? Object.assign({}, p, { offline: true }) : p));
    hostBroadcast({ type: 'PLAYERS_UPDATE', players: playersRef.current });
    godSet(uid, {});
    checkRaceEnd();
  }
  function onHostConnClose() {
    if (!mpRef.current.on || mpRef.current.isHost) return;
    setTimeout(() => { if (mpRef.current.on && !mpRef.current.isHost && sessRef.current) guestSetup(sessRef.current); }, 1500);
  }
  function becomeHost(promoting) {
    mpRef.current.isHost = true;
    if (peerRef.current) { try { peerRef.current.destroy(); } catch (e) {} peerRef.current = null; }
    connsRef.current = [];
    const p = new Peer(mpRef.current.code + '-host');
    peerRef.current = p;
    p.on('connection', (c) => {
      connsRef.current.push(c);
      c.on('data', (m) => onMpData(m, c));
      c.on('close', () => onConnClose(c));
    });
    p.on('error', () => {});
    if (promoting) setPlayersBoth(playersRef.current.map(pl => Object.assign({}, pl, { isHost: pl.id === myId })));
  }
  function guestSetup(sess) {
    if (peerRef.current) { try { peerRef.current.destroy(); } catch (e) {} peerRef.current = null; }
    const p = new Peer();
    peerRef.current = p;
    p.on('open', () => {
      const c = p.connect(sess.code + '-host');
      hostConnRef.current = c;
      c.on('open', () => { try { const jm = { type: 'JOIN', uid: myId, pName: sess.name }; if (hubColorRef.current) jm.color = hubColorRef.current; c.send(jm); } catch (e) {} });
      c.on('data', (m) => onMpData(m, c));
      c.on('close', () => onHostConnClose());
    });
    p.on('error', () => {});
  }
  function setupMp(sess) {
    const st = sess.settings || {};
    let itemDelayS = Number(st.itemStartTime); if (isNaN(itemDelayS)) itemDelayS = 60; itemDelayS = Math.max(0, Math.min(600, itemDelayS));
    const szId = [7, 10, 12].indexOf(Number(st.sizeId)) >= 0 ? Number(st.sizeId) : 10;
    mpRef.current = { on: true, isHost: !!sess.isHost, mode: (sess.mode === 'coop' || st.mode === 'coop') ? 'coop' : 'race', tourn: !!sess.tourn, tournInfo: sess.tourn || null, hub: !!sess.hub, code: sess.code, sizeId: szId, seed: 0, startAt: 0, phase: 'waiting', itemsAllow: st.allowItems !== false, itemDelay: itemDelayS };
    setMpOn(true); setMpPhase('waiting'); waitSinceRef.current = Date.now();
    setScreen('mp');
    if (sess.isHost) {
      const list = [{ id: myId, name: sess.name, color: (sess.hub && hubColorRef.current) ? hubColorRef.current : MP_COLORS[0], isHost: true, spectator: false, ready: false, offline: false }];
      if (sess.tourn && sess.tourn.roster) sess.tourn.roster.forEach(e => { if (e && e.name && normName(e.name) !== normName(sess.name)) list.push({ id: 'pending:' + e.name, name: e.name, color: e.color || MP_COLORS[list.length % MP_COLORS.length], isHost: false, spectator: false, ready: false, offline: false, pending: true }); });
      setPlayersBoth(list);
      becomeHost(false);
      if (sess.resume) { // 房主回座：本地存檔有同場種子就接續（來賓重 JOIN 後 INIT 帶 phase/seed/god）
        const save = loadResumeAny();
        if (save && save.seed && save.sizeId === szId) {
          startMatchLocal(save.seed, szId, save.startAt || Date.now());
          if (typeof save.cells === 'string' && save.cells.length === (SIZES[szId].w * SIZES[szId].h)) {
            const arr = save.cells.split('').map(Number);
            if (!arr.some(v => !(v >= 0 && v <= 4))) { setCells(arr); cellsRef.current = arr; itemsRef.current = { trap: (save.items && save.items.trap) || 0 }; setMyItems(itemsRef.current); giftCreditRef.current = save.giftCredit || 0; milestoneRef.current = save.milestone || 0; countedWallsRef.current = {}; (save.countedWalls || []).forEach(wi => { countedWallsRef.current[wi] = 1; }); lastStateRef.current = 0; }
          }
          return;
        }
      }
      if (sess.hub && !sess.tourn) {
        if (autoIvRef.current) clearInterval(autoIvRef.current);
        autoIvRef.current = setInterval(() => {
          if (!mpRef.current.on || !mpRef.current.isHost || mpRef.current.phase !== 'waiting') return;
          const N = window.__PLAT_NET; if (!N || !N.roster || N.roster.length < 2) return;
          const joined = playersRef.current.filter(p => !p.pending);
          const okAll = N.roster.every(r => joined.some(p => normName(p.name) === normName(r.name)));
          if (okAll) startMatch();
        }, 800);
      }
    } else {
      setPlayersBoth([]);
      guestSetup(sess);
    }
  }
  function requestLobby() {
    if (typeof window !== 'undefined' && window.__PLAT_PLATFORM) { if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY('game-exit'); return; }
    if (mpRef.current.isHost) { if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY('game-exit'); }
    else mpSend({ type: 'REQ_LOBBY', uid: myId });
  }
  function leaveMatch() {
    if (typeof window !== 'undefined' && window.__PLAT_NOTIFY) window.__PLAT_NOTIFY('player-leave');
    if (mpRef.current.isHost) mpSend({ type: 'HOST_LEFT', uid: myId });
    cleanupMp();
    setScreen('home');
  }
  function toggleMyReady() {
    const v = !myReadyRef.current; myReadyRef.current = v; setMyReadySt(v);
    if (mpRef.current.isHost) { setPlayersBoth(playersRef.current.map(p => p.id === myId ? Object.assign({}, p, { ready: v }) : p)); hostBroadcast({ type: 'PLAYERS_UPDATE', players: playersRef.current }); }
    else mpSend({ type: 'READY', uid: myId, ready: v });
  }

  // ---------- PlatBar（只掛對局畫面；自我修復 attach 比照 v1.55.1） ----------
  const platBarCfgStable = useRef(null);
  if (!platBarCfgStable.current) platBarCfgStable.current = {
    accent: ACCENT,
    onAction: (name) => {
      if (name === 'mode-press') setMode(m => (m === 'tap' ? 'draft' : (m === 'draft' ? 'cross' : 'tap')));
      else if (name === 'zoom-in') { zoomModeIdxRef.current = 0; setZoomModeIdx(0); setZoom(z => Math.min(2, Math.round((z + 0.25) * 100) / 100)); }
      else if (name === 'zoom-out') { zoomModeIdxRef.current = 0; setZoomModeIdx(0); setZoom(z => Math.max(z < 1 ? 0.5 : 1, Math.round((z - 0.25) * 100) / 100)); }
      else if (name === 'zoom-cycle') { if (cycleRef.current) cycleRef.current(); }
    }
  };
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.PlatBar === 'undefined') return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return; // 底部列主人是另一款時不搶
    const el = platBarRef.current;
    if (el) {
      if (window.PlatBar._el() !== el || !window.PlatBar._elConnected()) window.PlatBar.attach(el, platBarCfgStable.current);
    } else if (window.PlatBar.isAttached() && !window.PlatBar._elConnected()) {
      window.PlatBar.detach(window.PlatBar._el());
    }
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.PlatBar === 'undefined' || !window.PlatBar.isAttached()) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return;
    if (screen !== 'game') return;
    window.PlatBar.update({
      mode: mode === 'draft' ? 1 : (mode === 'cross' ? 2 : 0),
      modes: [{ icon: '💡', label: '點按' }, { icon: '✏️', label: '草稿' }, { icon: '✖️', label: '塗叉' }],
      modeTitle: '切換模式（點按／草稿／塗叉）',
      zoomLabel: zoomModeIdx === 0 ? (zoom > 1 ? Math.round(zoom * 100) + '%' : '🔍') : ZOOM_GLYPHS[zoomModeIdx],
      zoomGlyph: ZOOM_GLYPHS[zoomModeIdx],
      showInput: false, inputMode: 'num', showDraw: false
    });
  });

  // ---------- 框架層 F1：PlatHome / PlatTopCard / PlatSetup / PlatTutorial（殼單一實作、本款只給 config 與內容） ----------
  function openAkariSetup() {
    if (!window.PlatSetup) return;
    window.PlatSetup.show({
      accent: ACCENT, title: '🎮 選盤面大小', subtitle: '選好就直接開局', instant: true, mode: 'list',
      options: SIZE_IDS.map(id => ({ id: id, label: SIZES[id].name + (id === sizeIdRef.current ? '（上次選的）' : '') })),
      selectedId: sizeIdRef.current,
      onStart: (id) => { const nid = Number(id); setSizeId(nid); platSave().setStr('akari_last_size', String(nid)); startSolo(nid); }
    });
  }
  function openAkariTutorial() {
    if (!window.PlatTutorial) return;
    const cell = 'w-8 h-8 flex items-center justify-center rounded-[4px] border border-blue-200 bg-[#f1f5f9] text-base';
    const steps = [
      { html: '<div class="font-black text-slate-700 mb-2">1️⃣ 燈照直線，撞牆就停</div><div class="flex gap-[3px] justify-center"><div class="' + cell + ' akari-teach-cell" style="animation-delay:0.5s"></div><div class="' + cell + ' akari-teach-cell" style="animation-delay:0.35s"></div><div class="' + cell + '" style="background:#60a5fa">💡</div><div class="' + cell + ' akari-teach-cell" style="animation-delay:0.35s"></div><div class="' + cell + ' akari-teach-cell" style="animation-delay:0.5s"></div><div class="w-8 h-8 flex items-center justify-center rounded-[4px] bg-slate-800"></div><div class="' + cell + '"></div></div>',
        caption: '在空格放燈泡，整行整列都會亮起來，直到被黑牆擋住。目標是讓每一格都被照亮。' },
      { html: '<div class="font-black text-slate-700 mb-2">2️⃣ 兩盞燈不能互相照到</div><div class="flex gap-[3px] justify-center"><div class="' + cell + ' akari-teach-clash" style="background:#60a5fa">💡</div><div class="' + cell + '" style="background:#fee2e2"></div><div class="' + cell + '" style="background:#fee2e2"></div><div class="' + cell + ' akari-teach-clash" style="background:#60a5fa">💡</div></div>',
        caption: '同一行／列、中間沒有牆隔開的兩盞燈會互相照到——不行。要用牆把燈隔開。' },
      { html: '<div class="font-black text-slate-700 mb-2">3️⃣ 數字牆：旁邊的燈要剛剛好</div><div class="flex gap-[3px] justify-center items-center"><div class="' + cell + '" style="background:#dbeafe"></div><div class="' + cell + '" style="background:#60a5fa">💡</div><div class="' + cell + '" style="background:#dbeafe"></div></div><div class="flex gap-[3px] justify-center items-center mt-[3px]"><div class="' + cell + '" style="background:#60a5fa">💡</div><div class="' + cell + ' akari-teach-ok font-black" style="background:#1e293b;color:#60a5fa">2</div><div class="' + cell + '"></div></div>',
        caption: '牆上的數字是它上下左右緊鄰的燈數。剛好等於時數字會變綠。點按格子循環：燈 → 叉（先做記號）→ 空白。' }
    ];
    window.PlatTutorial.show({ accent: ACCENT, title: '💡 怎麼玩美術燈', steps: steps });
  }
  const platHomeCfgStable = useRef(null);
  if (!platHomeCfgStable.current) platHomeCfgStable.current = {
    accent: ACCENT, titleChars: ['美', '術', '燈'], enName: 'Akari Light Up',
    onAction: (name) => {
      if (name === 'solo') openAkariSetup();
      else if (name === 'daily') startDaily(dailySelRef.current);
      else if (name === 'prev') setDailySel(shiftDate(dailySelRef.current, -1));
      else if (name === 'next') setDailySel(shiftDate(dailySelRef.current, 1));
      else if (name === 'cal') openDailyCal();
      else if (name === 'tutorial') openAkariTutorial();
      else if (name === 'lobby') { if (window.PLAT_show) window.PLAT_show('home'); }
    }
  };
  useEffect(() => { // PlatHome 自我修復 attach（比照 PlatBar v1.55.1：無依賴、每次 render 檢查）
    if (typeof window === 'undefined' || typeof window.PlatHome === 'undefined') return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return;
    if (screen !== 'home') { if (window.PlatHome.isAttached() && window.PlatHome._el() === platHomeRef.current) window.PlatHome.detach(platHomeRef.current); return; }
    const el = platHomeRef.current;
    if (el) { if (window.PlatHome._el() !== el || !window.PlatHome._elConnected()) window.PlatHome.attach(el, platHomeCfgStable.current); }
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.PlatHome === 'undefined' || !window.PlatHome.isAttached()) return;
    if (screen !== 'home') return;
    const recs = readDailyRecords();
    const secs = recs[dailySel];
    window.PlatHome.update({
      dailyDate: dailySel, dailyIsToday: dailySel === todayStr(), dailyDone: !!secs,
      canPrev: dailySel > '2026-01-01', canNext: dailySel < todayStr(),
      streak: streakInfo.count || 0,
      bestText: secs ? (String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0')) : null,
      inPlatform: !!window.__PLAT_PLATFORM
    });
  });
  const platTopCfgStable = useRef(null);
  if (!platTopCfgStable.current) platTopCfgStable.current = {
    accent: ACCENT, logo: '💡', name: '美術燈', frame: false, // v1.70.0：band 併入 PlatFrame 外框（只剩 border-b），不再是獨立浮卡
    rulesHtml: '① 在空格放燈，燈會照亮同行同列、直到撞牆。② 所有空格都要被照亮。③ 任何兩盞燈不能互相照到。④ 數字牆上下左右的燈數要剛好等於數字。點按循環：燈 → 叉（記號）→ 空白；按住拖曳可連續塗叉。',
    onAction: (name) => {
      if (name === 'mute') { const m = platAudio().toggleMuted(); setMuted(!!m); }
      else if (name === 'leave-home') { genTokenRef.current++; if (window.PlatGenerating) window.PlatGenerating.end(); setScreen('home'); setPuzzle(null); puzzleRef.current = null; }
      else if (name === 'leave-lobby') requestLobby();
      else if (name === 'leave-leave') leaveMatch();
      else if (name === 'leave-forceend') { if (window.__PLAT_TOURN_FORCEEND) window.__PLAT_TOURN_FORCEEND(); }
    }
  };
  const platFrameCfgStable = useRef(null);
  if (!platFrameCfgStable.current) platFrameCfgStable.current = { paper: '#f4f9ff' }; // 外框紙色（藍調紙面，隨改藍裁示）
  useEffect(() => { // PlatFrame 自我修復 attach（先於 PlatTopCard effect 宣告：同輪先建框、再掛頂欄）
    if (typeof window === 'undefined' || typeof window.PlatFrame === 'undefined') return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return;
    if (screen !== 'game') { if (window.PlatFrame.isAttached() && (window.PlatFrame._el() === platFrameRef.current || !window.PlatFrame._elConnected())) window.PlatFrame.detach(window.PlatFrame._el()); if (frameBody) setFrameBody(null); if (ptcEl) setPtcEl(null); return; } // detach 只清自己的或已斷線的：無條件 detach() 會誤殺他款對局中的外框（同 PlatHome 誤殺案，v1.72.0 一併修）
    const el = platFrameRef.current;
    if (el) {
      if (window.PlatFrame._el() !== el || !window.PlatFrame._elConnected()) window.PlatFrame.attach(el, platFrameCfgStable.current);
      const b = window.PlatFrame.getBody(); if (b !== frameBody) setFrameBody(b);
      const t = window.PlatFrame.getTop(); if (t !== ptcEl) setPtcEl(t);
    }
  });
  useEffect(() => { // PlatTopCard 自我修復 attach＋槽位同步（掛載點＝外框頂區）
    if (typeof window === 'undefined' || typeof window.PlatTopCard === 'undefined') return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return;
    if (screen !== 'game') { if (window.PlatTopCard.isAttached() && window.PlatTopCard._el() === ptcEl) window.PlatTopCard.detach(ptcEl); if (ptcSlot) setPtcSlot(null); return; }
    const el = ptcEl;
    if (el) {
      if (window.PlatTopCard._el() !== el || !window.PlatTopCard._elConnected()) window.PlatTopCard.attach(el, platTopCfgStable.current);
      const slot = window.PlatTopCard.getSlot();
      if (slot !== ptcSlot) setPtcSlot(slot);
    }
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.PlatTopCard === 'undefined' || !window.PlatTopCard.isAttached()) return;
    if (screen !== 'game') return;
    const P2 = puzzleRef.current ? arraysToSets(puzzleRef.current) : null;
    const total = P2 ? P2.solution.size : 0;
    let placed = 0; // 放燈制（v1.71.1）：自己看得到的計數只計盤面燈數（1 自放＋3 鎖定）、不分對錯——correct 制會洩漏正解（放對才跳＝可逐格試探）
    if (P2) { cellsRef.current.forEach((cv) => { if (cv === 1 || cv === 3) placed++; }); }
    window.PlatTopCard.update({
      leaveIcon: mpOn ? '🔌' : '🏠', leaveLabel: mpOn ? '退出' : '主選單',
      modeChip: mpOn ? (mpRef.current.mode === 'coop' ? '🤝 合作模式' : '⚔️ 競速對戰') : null,
      dailyChip: (!mpOn && isDaily && dailyDate) ? ('每日 ' + dailyDate.slice(5) + (dailyDate !== todayStr() ? ' 補玩' : '')) : null,
      specLabel: '⚙️ ' + (isDaily ? '每日一題 ' + (puzzle ? SIZES[puzzle.w].short : '') : (puzzle ? SIZES[puzzle.w].name : '')),
      specClickable: false,
      statText: '💡 ' + placed + '/' + total,
      timerText: String(Math.floor(elapsed / 60)).padStart(2, '0') + ':' + String(elapsed % 60).padStart(2, '0'),
      muted: muted,
      players: mpOn ? players.filter(p => !p.pending).map(p => {
        const g = godBoards[p.id] || { progress: p.id === myId ? 0 : 0, state: 'playing' };
        const pct = Math.floor(((p.id === myId || mpRef.current.mode === 'coop') ? (total ? placed / total : 0) : (g.progress || 0)) * 100);
        return { key: p.id, name: p.name, color: p.color, isMe: p.id === myId, text: p.spectator ? '👁️' : (mpRef.current.mode === 'coop' ? pct + '%' : (g.state === 'finished' ? '🏁' : pct + '%')) };
      }) : null,
      leaveMenu: { mode: mpOn ? 'mp' : 'solo', canForceEnd: !!(mpOn && typeof window.__PLAT_TOURN_CAN_FORCEEND === 'function' && window.__PLAT_TOURN_CAN_FORCEEND()) }
    });
  });

  // ---------- 斷電到期（復電提示＋重繪） ----------
  useEffect(() => {
    if (!outageUntil) return;
    const left = outageUntil - Date.now();
    if (left <= 0) return;
    const t = setTimeout(() => { outageRef.current = 0; setOutageUntil(0); itemSay('💡 復電了！光暈回來了'); }, left + 30);
    return () => clearTimeout(t);
  }, [outageUntil]);
  // ---------- 等待室秒針 ----------
  useEffect(() => { if (screen !== 'mp') return; const iv = setInterval(() => setWaitTick(t => t + 1), 1000); return () => clearInterval(iv); }, [screen]);
  // ---------- 平台倒數（PlatCountdown） ----------
  useEffect(() => {
    if (typeof window === 'undefined' || !window.PlatCountdown) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return;
    if (cdNum != null) window.PlatCountdown.show(cdNum); else window.PlatCountdown.hide();
  }, [cdNum]);
  // ---------- 平台結算（PlatResults，比照地雷：等待卡可關、關後觀戰面板常駐） ----------
  useEffect(() => {
    if (typeof window === 'undefined' || !window.PlatResults) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return;
    let stage = null;
    if (mpOn && raceFinal) stage = 'fin';
    else if (mpOn && myOutcome && mpPhase === 'playing') stage = 'wait';
    if (!stage) { window.PlatResults.hide(); if (dismissRef.current) dismissRef.current = null; if (leaveArm) setLeaveArm(false); return; }
    if (dismissRef.current === stage) { window.PlatResults.hide(); return; }
    const acts = (id) => {
      if (id === 'watch') { dismissRef.current = stage; setLeaveArm(false); try { window.PlatResults.hide(); } catch (e) {} }
      else if (id === 'rematch') { dismissRef.current = null; try { window.PlatResults.hide(); } catch (e) {} if (mpRef.current.isHost) startMatch(); else mpSend({ type: 'REQ_REMATCH', uid: myId }); }
      else if (id === 'lobby') { try { window.PlatResults.hide(); } catch (e) {} requestLobby(); }
      else if (id === 'home') {
        if (!leaveArm) { setLeaveArm(true); return; }
        setLeaveArm(false); dismissRef.current = null; try { window.PlatResults.hide(); } catch (e) {} leaveMatch();
      }
    };
    const homeBtn = leaveArm ? { id: 'home', label: '⚠️ 確定離開？', kind: 'danger' } : { id: 'home', label: '離開' };
    const inTourn = !!mpRef.current.tourn;
    const stdBtns = [{ id: 'watch', label: '👁️ 看盤面' }].concat(inTourn ? [{ id: 'lobby', label: '🏁 回等待室', kind: 'primary' }] : [{ id: 'rematch', label: '🔁 再來一局', kind: 'primary' }, { id: 'lobby', label: '🏁 回等待室' }]).concat([homeBtn]);
    let specR = null;
    if (stage === 'fin') {
      specR = { accent: ACCENT, title: '競速結果', entries: raceFinal.entries,
        verdict: raceFinal.winnerUid === myId ? '🎉 你贏了！' : (myOutcome === 'finished' ? '完賽了，本場名次如上！' : '本場比賽結束，名次如上。'),
        buttons: stdBtns, onAction: acts };
    } else {
      const res2 = playersRef.current.filter(p => !p.spectator && !p.pending).map(p => ({ p: p, g: godRef.current[p.id] || { progress: 0, state: 'playing' } })).filter(e => e.g.state === 'finished');
      res2.sort((a, b) => (a.g.timeMs || 0) - (b.g.timeMs || 0));
      specR = { accent: ACCENT, title: '本場成績', waitingText: '等待其他玩家完成…',
        entries: res2.map(e => ({ key: e.p.id, name: e.p.name, color: e.p.color, isMe: e.p.id === myId, right: '⏱ ' + fmtMS(e.g.timeMs || 0) })),
        verdict: '🏁 你已完賽，先看看大家的盤面吧',
        buttons: [{ id: 'watch', label: '👁️ 轉變為上帝模式（觀戰）', kind: 'primary' }, homeBtn], onAction: acts };
    }
    window.PlatResults.show(specR);
  });

  // ---------- 平台 hooks ----------
  useEffect(() => {
    window.__PLAT_HOOKS_akari = {
      enter: (sess) => {
        sessRef.current = sess || null;
        hubColorRef.current = (sess && typeof sess.color === 'string' && sess.color) ? sess.color : null;
        cleanupMp(); // 開新局先清掉上一局的結算暫存（站規）
        setRaceFinal(null); finalRef.current = null; setMyOutcome(null); outcomeRef.current = null;
        godRef.current = {}; setGodBoards({});
        setStatus('ready'); statusRef.current = 'ready'; setPuzzle(null); puzzleRef.current = null; setCells([]); cellsRef.current = [];
        setIsDaily(false); setDailyDate(null);
        if (sess) setupMp(sess);
      },
      exit: () => { cleanupMp(); sessRef.current = null; hubColorRef.current = null; setScreen('home'); },
      identity: (d) => {
        if (!d || typeof d.color !== 'string' || !d.color) return;
        if (d.self) setPlayersBoth(playersRef.current.map(p => p.id === myId ? Object.assign({}, p, { color: d.color }) : p));
        else setPlayersBoth(playersRef.current.map(p => normName(p.name) === normName(d.name || '') ? Object.assign({}, p, { color: d.color }) : p));
        if (mpRef.current.isHost) hostBroadcast({ type: 'PLAYERS_UPDATE', players: playersRef.current });
      },
      migrate: () => { if (mpRef.current.on && !mpRef.current.isHost && typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.isHost) becomeHost(true); },
      debug: () => ({
        screen: screenRef.current, sizeId: sizeIdRef.current, status: statusRef.current,
        isDaily: isDailyRef.current, dailyDate: dailyDateRef.current,
        puzzle: puzzleRef.current ? { w: puzzleRef.current.w, h: puzzleRef.current.h, walls: Array.from(puzzleRef.current.walls), numbers: Array.from(puzzleRef.current.numbers.entries()), solution: Array.from(puzzleRef.current.solution) } : null,
        cells: cellsRef.current.slice(),
        mode: modeRef.current, zoom: zoomRef.current,
        mp: { on: mpRef.current.on, isHost: mpRef.current.isHost, mode: mpRef.current.mode, phase: mpRef.current.phase, tourn: mpRef.current.tourn, seed: mpRef.current.seed, sizeId: mpRef.current.sizeId },
        players: playersRef.current, god: godRef.current, final: finalRef.current,
        items: Object.assign({}, itemsRef.current), giftCredit: giftCreditRef.current, milestone: milestoneRef.current, owners: ownersRef.current.slice(), coopWonMs: coopWonRef.current, coopDrafts: Array.from(coopDraftRef.current),
        outageUntil: outageRef.current, myOutcome: outcomeRef.current
      })
    };
    window.__AKARI_PREGEN_STATS = preGenStatsRef.current;
    window.__AKARI_PREGEN_SLOT = () => { const s = preGenRef.current; return s ? { sizeId: s.sizeId, hasPuzzle: !!s.puzzle, hasJob: !!s.job } : null; };
  }, []);

  // ---------- 衍生狀態 ----------
  let litSet = new Set(), confBad = new Set(), numState = new Map(), progress = 0, correct = 0, litPct = 0, dispProgress = 0;
  if (P && cells.length) {
    const bulbs = placedBulbs(cells);
    litSet = window.Akari.litCells(P.w, P.h, P.walls, bulbs);
    const conf = window.Akari.conflicts(P.w, P.h, P.walls, P.numbers, bulbs);
    confBad = conf.badBulbs; numState = conf.numState;
    progress = window.Akari.progressOf(P.solution, bulbs);
    dispProgress = P.solution.size ? bulbs.size / P.solution.size : 0; // 顯示用放燈制（v1.71.1 使用者實機抓洩漏：correct 制計數＝逐格試探正解的作弊通道）；progress/correct 僅供系統邏輯（同步/里程碑/完賽），顯示一律用 dispProgress/放燈數
    P.solution.forEach(b => { if (bulbs.has(b)) correct++; });
    let nonWall = 0; for (let i = 0; i < P.w * P.h; i++) if (!P.walls.has(i)) nonWall++;
    litPct = nonWall ? Math.round(100 * litSet.size / nonWall) : 0;
  }
  const outaged = mpOn && outageUntil > Date.now();
  const litVis = outaged ? new Set() : litSet; // 斷電：光暈視覺消失（狀態不變）
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0'), ss = String(elapsed % 60).padStart(2, '0');
  const spec = puzzle ? SIZES[puzzle.w] : SIZES[sizeId];
  const openDailyCal = () => { if (window.PlatCalendar) window.PlatCalendar.show({ accent: ACCENT, records: readDailyRecords(), selected: dailySel, onPick: (ds) => { setDailySel(ds); startDaily(ds); } }); };

  // ---------- 畫面 ----------
  if (screen === 'home') {
    // 主畫面由殼 PlatHome 單一實作渲染（框架層 F1）；無殼環境（獨立開啟）才用下方最小備援
    return (
      <div key="akari-home" className="min-h-screen flex flex-col items-center p-4">
        <div ref={platHomeRef} className="contents"></div>
        {typeof window !== 'undefined' && !window.PlatHome && (
          <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 p-4">
            <div className="text-6xl">💡</div>
            <div className="font-black text-3xl text-slate-800">美術燈 Akari</div>
            <button onClick={() => startSolo(sizeId)} className="plat-btn-hard px-6 py-3 bg-blue-400 border-4 border-slate-800 rounded-xl font-black text-xl">🎮 單機挑戰</button>
            <button onClick={() => startDaily(todayStr())} className="plat-btn-hard px-6 py-3 bg-white border-4 border-slate-800 rounded-xl font-black text-xl">📅 每日一題</button>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'mp') {
    const M = mpRef.current;
    const szName = (SIZES[M.sizeId] || SIZES[10]).name;
    if (!M.tourn) {
      return (
        <div key="akari-mp" className="min-h-screen w-full flex flex-col items-center p-4 relative">
          <div className="flex-1 flex items-center justify-center w-full">
            <div className="bg-white border-4 border-slate-800 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,1)] p-8 text-center max-w-sm w-full animate-fadeIn">
              <div className="text-5xl mb-3">⏳</div>
              <div className="font-black text-2xl text-slate-800 animate-pulse">等房主開始對局…</div>
              <div className="font-semibold text-slate-400 text-sm mt-2">準備和設定都在房間頁完成了，馬上開始</div>
              <button onClick={leaveMatch} className="plat-btn-hard mt-5 px-4 py-2 bg-slate-100 border-[3px] border-slate-800 rounded-xl font-black text-slate-600 shadow-[2px_2px_0px_rgba(30,41,59,1)]">離開</button>
            </div>
          </div>
        </div>
      );
    }
    const racersW = players.filter(p => !p.spectator && !p.pending);
    const pendW = players.filter(p => p.pending);
    const allReadyW = racersW.length > 0 && racersW.every(p => p.ready);
    const waitedW = waitSinceRef.current ? Date.now() - waitSinceRef.current : 0;
    const canStartW = M.isHost && racersW.length >= 2 && ((pendW.length === 0 && allReadyW) || waitedW >= 60000);
    const startNoteW = !M.isHost ? '' : (racersW.length < 2 ? '等待選手加入（至少 2 位）…' : (canStartW ? (pendW.length ? '未到的選手將以觀戰身分加入' : '') : (pendW.length ? '等待全員到齊…' : '等待全員準備（或 ' + Math.max(0, 60 - Math.floor(waitedW / 1000)) + ' 秒後開放開始）')));
    const myEntryW = players.find(p => p.id === myId);
    const tInfo = M.tournInfo || {};
    return (
      <div key="akari-mp" className="min-h-screen w-full flex flex-col items-center p-4 relative">
        <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-full max-w-md bg-[#fffaf0] border-4 border-slate-800 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,1)] p-6 z-10 animate-fadeIn">
          <div className="text-center text-4xl mb-1">🏆</div>
          <div className="font-black text-2xl text-slate-800 text-center">錦標賽・第 {tInfo.round || '?'} 局</div>
          <div className="font-semibold text-slate-400 text-sm text-center mt-1 mb-4">本局：美術燈競速・{szName}・全員準備好房主才能開始，或等滿 1 分鐘強制開始</div>
          <div className="flex flex-col gap-2 mb-4">
            {players.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-slate-50 border-2 border-slate-800 rounded-xl px-3 py-2 font-black text-slate-800">
                <span className="w-4 h-4 rounded-full border-2 border-slate-800 shrink-0" style={{ background: p.color }}></span>
                <span className="truncate">{p.name}{p.isHost ? ' 👑' : ''}{p.id === myId ? '（你）' : ''}</span>
                <span className="ml-auto shrink-0">{p.pending ? <span className="text-[10px] bg-slate-100 border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded-md">未到</span> : p.offline ? <span className="text-[10px] bg-rose-100 border border-rose-400 text-rose-600 px-1.5 py-0.5 rounded-md">離線</span> : p.spectator ? <span className="text-[10px] bg-sky-100 border border-sky-400 text-sky-700 px-1.5 py-0.5 rounded-md">👁️ 觀戰</span> : (p.ready ? <span className="text-[10px] bg-emerald-100 border border-emerald-500 text-emerald-700 px-1.5 py-0.5 rounded-md">✅ 準備好了</span> : <span className="text-[10px] bg-slate-100 border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded-md">未準備</span>)}</span>
              </div>
            ))}
            {!players.length && <p className="font-bold text-slate-400 text-center py-2">連線中…</p>}
          </div>
          {myEntryW && !myEntryW.pending && !myEntryW.spectator && (
            <button onClick={toggleMyReady} className={"plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 rounded-xl border-[3px] border-slate-800 font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)]" + (myReadySt ? ' bg-blue-400 text-slate-900' : ' bg-white text-slate-500')}>{myReadySt ? '✅ 已準備（點擊取消）' : '✋ 準備好了'}</button>
          )}
          {M.isHost ? (
            <div>
              <button disabled={!canStartW} onClick={startMatch} className="plat-btn-hard plat-btn-hard-3 w-full py-3 bg-red-500 text-white border-[3px] border-slate-800 rounded-xl font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)] disabled:opacity-40 disabled:shadow-none">🏁 開始本局</button>
              {startNoteW && <p className="text-xs text-slate-500 font-semibold text-center mt-2">{startNoteW}</p>}
            </div>
          ) : (
            <p className="font-black text-slate-700 animate-pulse text-center">等待房主開始...</p>
          )}
        </div>
        </div>
      </div>
    );
  }

  // game 畫面
  const cellPxBase = puzzle ? Math.max(24, Math.min(52, Math.floor((Math.min(window.innerWidth || 400, 560) - 24) / puzzle.w))) : 36;
  const cellPx = Math.round(cellPxBase * zoom);
  return (
    <div key="akari-game" className="min-h-screen flex flex-col items-center p-2 md:p-4 pb-28">
      {/* 對局外框：殼 PlatFrame 單一實作（v1.70.0）——頂欄 PlatTopCard 掛外框頂區（band 併入外框）、盤面 portal 進外框內容區；頂欄與盤面同框同寬 */}
      <div ref={platFrameRef} className="w-full"></div>
      {ptcSlot && ReactDOM.createPortal((
          <div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3.5 bg-white/80 border-2 border-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-800 transition-all duration-300 plat-pbar" style={{ width: Math.round(dispProgress * 100) + '%' }}></div>
              </div>
              <span className="font-black text-xs text-slate-900 whitespace-nowrap">進度 <PlatPct value={Math.round(dispProgress * 100)} />・照亮 <PlatPct value={litPct} /></span>
            </div>
            {!(mpOn && (iAmSpecRef.current || myOutcome)) && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <button data-akari-undo onClick={doUndo} disabled={!(mpRef.current.mode === 'coop' ? coopHistRef.current.past.length : histRef.current.past.length) || !canPlayNow()} className="plat-btn-hard px-2 py-0.5 bg-white border-2 border-slate-800 rounded font-bold text-[11px] shadow-[1px_1px_0px_rgba(30,41,59,1)] disabled:opacity-40 disabled:shadow-none text-slate-800" title="上一步（復原）">↩️ 上一步</button>
                <button data-akari-redo onClick={doRedo} disabled={!(mpRef.current.mode === 'coop' ? coopHistRef.current.future.length : histRef.current.future.length) || !canPlayNow()} className="plat-btn-hard px-2 py-0.5 bg-white border-2 border-slate-800 rounded font-bold text-[11px] shadow-[1px_1px_0px_rgba(30,41,59,1)] disabled:opacity-40 disabled:shadow-none text-slate-800" title="下一步（重做）">↪ 下一步</button>
                <span className="hidden">{histVer}</span>
              </div>
            )}
            {mpOn && itemsLive() && !iAmSpecRef.current && !myOutcome && mpPhase === 'playing' && (
              <div className="flex items-center gap-1.5 mt-1.5 justify-end">
                <span className="font-black text-[11px] text-slate-900" title="數字牆正確滿足累積的禮物額度（滿 1 自動送較弱的對手）">🎁 額度 {giftCreditRef.current.toFixed(1)}</span>
                <button onClick={fireTrap} disabled={(myItems.trap || 0) <= 0} className="plat-btn-hard px-2 py-0.5 bg-violet-100 border-2 border-slate-800 rounded-full font-black text-[11px] text-violet-800 shadow-[1px_1px_0px_rgba(30,41,59,1)] disabled:opacity-40 disabled:shadow-none" title="斷電陷阱：讓一位對手的燈光暈消失 5 秒">⚡ 斷電 ×{myItems.trap || 0}</button>
              </div>
            )}
            {outaged && <div className="mt-2 bg-slate-800 text-blue-300 font-black text-sm rounded-lg px-3 py-1.5 text-center animate-pulse">⚡ 斷電中…光暈暫時消失（燈都還在）</div>}
            {itemToast && <div className="mt-2 bg-white/90 border-2 border-slate-800 text-slate-800 font-black text-sm rounded-lg px-3 py-1.5 text-center">{itemToast}</div>}
          </div>
        ), ptcSlot)}
      {frameBody && ReactDOM.createPortal((
        <div className="w-full flex flex-col items-center">
        {/* 盤面 */}
        <div ref={boardScrollRef} className={"akari-board-scroll overflow-auto flex justify-center w-full" + (mpOn && iAmSpecRef.current ? " hidden" : "")} onPointerMove={onBoardMove} onPointerCancel={onBoardCancel}>
          <div className="inline-grid gap-[3px] p-[6px] bg-blue-100 border-[3px] border-slate-800 rounded-2xl" style={{ gridTemplateColumns: 'repeat(' + (puzzle ? puzzle.w : 10) + ', ' + cellPx + 'px)' }}>
            {puzzle && cells.map((cv, i) => {
              const isWall = P.walls.has(i);
              if (isWall) {
                const n = P.numbers.has(i) ? P.numbers.get(i) : null;
                const nst = n != null ? numState.get(i) : null;
                return (
                  <div key={i} className="flex items-center justify-center bg-slate-800 rounded-[4px] font-black select-none" style={{ width: cellPx, height: cellPx, fontSize: Math.round(cellPx * 0.5) }}>
                    {n != null ? <span style={{ color: nst === 'ok' ? '#4ade80' : (nst === 'over' ? '#f87171' : '#60a5fa') }}>{n}</span> : null}
                  </div>
                );
              }
              const isBulb = cv === 1, isLocked = cv === 3, isCross = cv === 2, isDraft = cv === 4, lit = litVis.has(i), bad = confBad.has(i);
              const ownUid = mpRef.current.mode === 'coop' ? (owners[i] || '') : '';
              const partner = ownUid && ownUid !== myId ? players.find(p => p.id === ownUid) : null;
              const coopDraft = mpRef.current.mode === 'coop' && cv === 0 && coopDraftRef.current.has(i);
              return (
                <button key={i} data-cell={i}
                  onPointerDown={e => onCellDown(i, e)} onPointerUp={e => onCellUp(i, e)} onClick={() => onCellClick(i)}
                  className={"relative flex items-center justify-center rounded-[4px] border select-none touch-none" + (bad ? " border-red-500" : " border-blue-200") + (isBulb && newBulbRef.current === i ? " akari-bulb-new" : "")}
                  style={{ width: cellPx, height: cellPx, fontSize: Math.round(cellPx * 0.52), background: (isBulb || isLocked) ? '#60a5fa' : (lit ? '#dbeafe' : '#ffffff'), boxShadow: bad ? 'inset 0 0 0 2px #ef4444' : (isLocked ? 'inset 0 0 0 2px #1d4ed8, 0 0 10px 2px rgba(59,130,246,0.55)' : (partner && isBulb ? 'inset 0 0 0 3px ' + partner.color + ', 0 0 10px 2px rgba(59,130,246,0.55)' : (isBulb && !outaged ? '0 0 10px 2px rgba(59,130,246,0.55)' : 'none'))) }}>
                  {(isBulb || isLocked) ? '💡' : (isCross ? <span className="font-black" style={{ color: partner ? partner.color : '#94a3b8' }}>✕</span> : ((isDraft || coopDraft) ? <span data-draft="1" className="flex items-center justify-center rounded-full" style={{ width: '82%', height: '82%', border: '2px dashed #2563eb', opacity: 0.8 }}><span style={{ fontSize: Math.round(cellPx * 0.34), opacity: 0.55, filter: 'grayscale(0.3)' }}>💡</span></span> : ''))}
                  {isLocked && <span className="absolute bottom-0 right-0 leading-none" style={{ fontSize: Math.max(9, Math.round(cellPx * 0.3)) }}>🔒</span>}
                  {partner && isBulb && <span data-partner-dot="1" className="absolute top-0 right-0 rounded-full border border-white" style={{ width: Math.max(8, Math.round(cellPx * 0.26)), height: Math.max(8, Math.round(cellPx * 0.26)), background: partner.color }}></span>}
                </button>
              );
            })}
          </div>
        </div>
        {mpOn && mpRef.current.mode !== 'coop' && (myOutcome || iAmSpecRef.current) && puzzle && (
          <div className="mt-4 w-full max-w-[560px] bg-white border-[3px] border-slate-800 rounded-2xl shadow-[3px_3px_0px_rgba(30,41,59,1)] p-4">
            <div className="font-black text-slate-800 mb-2">👁️ 觀戰（點選手看他的盤面）</div>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {players.filter(p => !p.spectator && !p.pending && p.id !== myId).map(p => {
                const g = godBoards[p.id] || { progress: 0, state: 'playing' };
                return (
                  <button key={p.id} onClick={() => setSpecUid(p.id)} className={"plat-btn-hard px-2.5 py-1 rounded-full border-2 border-slate-800 font-black text-xs shadow-[1px_1px_0px_rgba(30,41,59,1)]" + (specUid === p.id ? " bg-blue-400 text-slate-900" : " bg-white text-slate-700")}>
                    <span className="inline-block w-2.5 h-2.5 rounded-full border border-slate-800 mr-1" style={{ background: p.color }}></span>{p.name}・{g.state === 'finished' ? '🏁' : <PlatPct value={Math.floor((g.progress || 0) * 100)} />}
                  </button>
                );
              })}
            </div>
            {specUid && godBoards[specUid] && typeof godBoards[specUid].cells === 'string' && P && (
              <div className="flex justify-center">
                <div className="inline-grid gap-[2px] p-[4px] bg-blue-100 border-2 border-slate-800 rounded-xl" style={{ gridTemplateColumns: 'repeat(' + puzzle.w + ', 18px)' }}>
                  {godBoards[specUid].cells.split('').map((ch, i) => {
                    if (P.walls.has(i)) { const n = P.numbers.has(i) ? P.numbers.get(i) : null; return <div key={i} className="flex items-center justify-center bg-slate-800 rounded-[3px] font-black text-blue-300" style={{ width: 18, height: 18, fontSize: 10 }}>{n != null ? n : ''}</div>; }
                    const v = Number(ch);
                    return <div key={i} className="flex items-center justify-center rounded-[3px] border border-blue-200" style={{ width: 18, height: 18, fontSize: 11, background: (v === 1 || v === 3) ? '#60a5fa' : '#ffffff', boxShadow: v === 3 ? 'inset 0 0 0 2px #1d4ed8' : 'none' }}>{v === 1 || v === 3 ? '💡' : (v === 2 ? <span className="text-slate-400 font-black">✕</span> : '')}</div>;
                  })}
                </div>
              </div>
            )}
            {specUid && !(godBoards[specUid] && typeof godBoards[specUid].cells === 'string') && <p className="text-center font-bold text-slate-400 text-sm">等他的盤面同步過來…</p>}
          </div>
        )}
        {mpOn && mpRef.current.mode === 'coop' && coopWonMs > 0 && (
          <div data-coop-won="1" className="mt-4 w-full max-w-[560px] bg-emerald-50 border-[3px] border-emerald-600 rounded-2xl shadow-[3px_3px_0px_rgba(30,41,59,1)] p-4 text-center">
            <div className="font-black text-emerald-800 text-lg">🤝 共同完賽！</div>
            <div className="font-bold text-emerald-700 text-sm mt-1">全隊一起點亮了整盤・用時 {String(Math.floor(coopWonMs / 60000)).padStart(2, '0')}:{String(Math.floor(coopWonMs / 1000) % 60).padStart(2, '0')}</div>
          </div>
        )}
        {status === 'won' && winInfo && !mpOn && (
          <div className="mt-4 w-full max-w-[560px] bg-white border-[3px] border-slate-800 rounded-2xl shadow-[3px_3px_0px_rgba(30,41,59,1)] p-4 text-center">
            <div className="text-3xl font-black text-slate-800 mb-1">🎉 全盤點亮！</div>
            <div className="font-bold text-slate-500 mb-3">{winInfo.isDaily ? '每日一題 ' + (winInfo.dateStr || '') + ' ' : ''}用時 {String(Math.floor(winInfo.secs / 60)).padStart(2, '0')}:{String(winInfo.secs % 60).padStart(2, '0')}{winInfo.isDaily && winInfo.dateStr === todayStr() && streakInfo.count > 0 ? '・🔥 連勝 ' + streakInfo.count + ' 天' : ''}</div>
            <div className="flex gap-2 justify-center">
              {!winInfo.isDaily && <button onClick={() => startSolo(sizeId)} className="plat-btn-hard px-5 py-2.5 bg-blue-400 border-[3px] border-slate-800 rounded-xl font-black shadow-[2px_2px_0px_rgba(30,41,59,1)]">🔁 再來一局</button>}
              <button onClick={() => { setScreen('home'); setPuzzle(null); puzzleRef.current = null; }} className="plat-btn-hard px-5 py-2.5 bg-white border-[3px] border-slate-800 rounded-xl font-black shadow-[2px_2px_0px_rgba(30,41,59,1)]">🏠 回主選單</button>
            </div>
          </div>
        )}
        </div>
      ), frameBody)}
      {/* PlatBar 掛載點（只在對局畫面）：數獨同款——專屬 fixed 全寬容器包掛載點，不把定位押在掛載點自身（v1.70.0 幾何修正：舊法在 flex 置中根容器裡一旦 utility 未生效就縮成置中窄盒） */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] pb-safe"><div ref={platBarRef}></div></div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AkariGame />);
