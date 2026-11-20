// 美術燈 Akari（平台第四款）：React 單一 app。P1 範圍＝引擎＋單機＋每日；多人（大亂鬥/道具/錦標賽/回座）為 P2。
// 框架比照既有三款：PlatSave/PlatAudio/PlatTap/PlatBar/PlatCalendar/PlatGenerating 全走殼接點；
// 輸入管線比照地雷 v1.54.2＋v1.66.1：pointerup 在按下格結算（22px 漂移內）、尾隨 click 全域抑制窗（不帶 tag）。
const { useState, useEffect, useRef } = React;

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
const ACCENT = '#f59e0b';
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
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [sizeId, setSizeId] = useState(() => { const v = parseInt(platSave().getStr('akari_last_size', '10'), 10); return SIZES[v] ? v : 10; });
  const [puzzle, setPuzzle] = useState(null); // arrays 形
  const [cells, setCells] = useState([]); // 0 空 1 燈 2 叉
  const [status, setStatus] = useState('ready'); // ready | playing | won
  const [isDaily, setIsDaily] = useState(false);
  const [dailyDate, setDailyDate] = useState(null);
  const [dailySel, setDailySel] = useState(todayStr());
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState('tap'); // tap | cross（PlatBar 模式）
  const [zoom, setZoom] = useState(1);
  const [showRules, setShowRules] = useState(false);
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
  const dailyDateRef = useRef(null); dailyDateRef.current = dailyDate;
  const zoomRef = useRef(1); zoomRef.current = zoom;
  const genTokenRef = useRef(0);
  const preGenRef = useRef(null); // {sizeId, job, puzzle}
  const preGenStatsRef = useRef({ jobs: 0, hits: 0 });
  const supTrkRef = useRef(null);
  const supTrk = () => { if (!supTrkRef.current) supTrkRef.current = platTapNew({ suppressMs: 500 }); return supTrkRef.current; };
  const downRef = useRef(null); // {idx, trk, painting:bool}
  const platBarRef = useRef(null);
  const newBulbRef = useRef(-1);

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
    const arr = puzzleArrays(p);
    puzzleRef.current = arraysToSets(arr);
    setPuzzle(arr);
    setCells(new Array(p.w * p.h).fill(0));
    setIsDaily(!!daily); setDailyDate(dateStr || null);
    setStatus('ready'); setElapsed(0); startedAtRef.current = null;
    setWinInfo(null); setShowRules(false); setZoom(1);
    setScreen('game');
  }
  function startSolo(szId) {
    const spec = SIZES[szId] || SIZES[10];
    setShowSizeModal(false);
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
  function placedBulbs(cs) { const s = new Set(); for (let i = 0; i < cs.length; i++) if (cs[i] === 1) s.add(i); return s; }
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
  function applyCells(next) {
    const pz = puzzleRef.current; if (!pz) return;
    setCells(next); cellsRef.current = next;
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
    const pz = puzzleRef.current; if (!pz || pz.walls.has(idx)) return;
    const next = cellsRef.current.slice();
    const cur = next[idx];
    let nv;
    if (modeRef.current === 'cross') nv = (cur === 2) ? 0 : (cur === 0 ? 2 : cur);
    else nv = (cur + 1) % 3;
    if (nv === cur) return;
    next[idx] = nv;
    if (nv === 1) {
      newBulbRef.current = idx;
      const bulbs = placedBulbs(next);
      const conf = window.Akari.conflicts(pz.w, pz.h, pz.walls, pz.numbers, bulbs);
      try { platAudio().play(conf.badBulbs.has(idx) ? 'error' : 'place'); } catch (e) {}
    }
    applyCells(next);
  }
  function paintCross(idx) {
    if (statusRef.current === 'won') return;
    const pz = puzzleRef.current; if (!pz || pz.walls.has(idx)) return;
    if (cellsRef.current[idx] !== 0) return;
    const next = cellsRef.current.slice(); next[idx] = 2;
    applyCells(next);
  }
  // 輸入管線（比照地雷）：down 記格＋tracker；move 超 slop 且起手為空格 → 轉塗叉拖曳（elementFromPoint 命中格）；
  // up 在按下格結算 tap（漂移 ≤22px）；click 為鍵盤/程式備援（先過全域抑制窗）
  function onCellDown(idx, e) {
    const trk = platTapNew({ slop: 22, suppressMs: 500 });
    if (e && typeof e.clientX === 'number') trk.down(e.clientX, e.clientY, Date.now());
    downRef.current = { idx: idx, trk: trk, painting: false };
  }
  function onBoardMove(e) {
    const d = downRef.current; if (!d || !e || typeof e.clientX !== 'number') return;
    if (!d.painting) {
      const r = d.trk.move ? d.trk.move(e.clientX, e.clientY) : { dragging: false };
      const pz = puzzleRef.current;
      if (r.dragging && pz && cellsRef.current[d.idx] === 0 && !pz.walls.has(d.idx)) { d.painting = true; paintCross(d.idx); }
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

  // ---------- PlatBar（只掛對局畫面；自我修復 attach 比照 v1.55.1） ----------
  const platBarCfgStable = useRef(null);
  if (!platBarCfgStable.current) platBarCfgStable.current = {
    accent: ACCENT,
    onAction: (name) => {
      if (name === 'mode-press') setMode(m => (m === 'tap' ? 'cross' : 'tap'));
      else if (name === 'zoom-in') setZoom(z => Math.min(2, Math.round((z + 0.25) * 100) / 100));
      else if (name === 'zoom-out') setZoom(z => Math.max(1, Math.round((z - 0.25) * 100) / 100));
      else if (name === 'zoom-cycle') setZoom(z => (z >= 2 ? 1 : Math.round((z + 0.25) * 100) / 100));
    }
  };
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.PlatBar === 'undefined') return;
    const el = platBarRef.current;
    if (el) {
      if (window.PlatBar._el() !== el || !window.PlatBar._elConnected()) window.PlatBar.attach(el, platBarCfgStable.current);
    } else if (window.PlatBar.isAttached() && !window.PlatBar._elConnected()) {
      window.PlatBar.detach(window.PlatBar._el());
    }
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.PlatBar === 'undefined' || !window.PlatBar.isAttached()) return;
    if (screen !== 'game') return;
    window.PlatBar.update({
      mode: mode === 'cross' ? 1 : 0,
      modes: [{ icon: '💡', label: '點按' }, { icon: '✖️', label: '塗叉' }],
      modeTitle: '切換模式（點按循環／塗叉）',
      zoomLabel: zoom > 1 ? Math.round(zoom * 100) + '%' : '🔍',
      zoomGlyph: zoom > 1 ? Math.round(zoom * 100) + '%' : '🔲',
      showInput: false, inputMode: 'num', showDraw: false
    });
  });

  // ---------- hooks（測試探針＋P2 多人接點預留） ----------
  useEffect(() => {
    window.__PLAT_HOOKS_akari = {
      debug: () => ({
        screen: screenRef.current, sizeId: sizeIdRef.current, status: statusRef.current,
        isDaily: isDailyRef.current, dailyDate: dailyDateRef.current,
        puzzle: puzzleRef.current ? { w: puzzleRef.current.w, h: puzzleRef.current.h, walls: Array.from(puzzleRef.current.walls), numbers: Array.from(puzzleRef.current.numbers.entries()), solution: Array.from(puzzleRef.current.solution) } : null,
        cells: cellsRef.current.slice(),
        mode: modeRef.current, zoom: zoomRef.current
      }),
      notify: () => {} // P2 多人接點（本批未接線）
    };
    window.__AKARI_PREGEN_STATS = preGenStatsRef.current;
    window.__AKARI_PREGEN_SLOT = () => { const s = preGenRef.current; return s ? { sizeId: s.sizeId, hasPuzzle: !!s.puzzle, hasJob: !!s.job } : null; };
  }, []);

  // ---------- 衍生狀態 ----------
  let litSet = new Set(), confBad = new Set(), numState = new Map(), progress = 0, correct = 0, litPct = 0;
  if (P && cells.length) {
    const bulbs = placedBulbs(cells);
    litSet = window.Akari.litCells(P.w, P.h, P.walls, bulbs);
    const conf = window.Akari.conflicts(P.w, P.h, P.walls, P.numbers, bulbs);
    confBad = conf.badBulbs; numState = conf.numState;
    progress = window.Akari.progressOf(P.solution, bulbs);
    P.solution.forEach(b => { if (bulbs.has(b)) correct++; });
    let nonWall = 0; for (let i = 0; i < P.w * P.h; i++) if (!P.walls.has(i)) nonWall++;
    litPct = nonWall ? Math.round(100 * litSet.size / nonWall) : 0;
  }
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0'), ss = String(elapsed % 60).padStart(2, '0');
  const spec = puzzle ? SIZES[puzzle.w] : SIZES[sizeId];
  const openDailyCal = () => { if (window.PlatCalendar) window.PlatCalendar.show({ accent: ACCENT, records: readDailyRecords(), selected: dailySel, onPick: (ds) => { setDailySel(ds); startDaily(ds); } }); };

  // ---------- 畫面 ----------
  if (screen === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-7xl mb-3">💡</div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-wider mb-2">美術燈</h1>
            <p className="text-amber-600 font-bold">Akari — 點亮每一格，一盞燈都不能照到另一盞</p>
          </div>
          <div className="space-y-4">
            <button onClick={() => setShowSizeModal(true)} className="plat-btn-hard w-full py-4 bg-amber-400 border-4 border-slate-800 rounded-2xl font-black text-2xl text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)]">🎮 單機挑戰</button>
            <button onClick={() => startDaily(todayStr())} className="plat-btn-hard w-full py-4 bg-white border-4 border-slate-800 rounded-2xl font-black text-2xl text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)]">☀️ 每日一題{streakInfo.count > 0 && streakInfo.last && (streakInfo.last === todayStr() || streakInfo.last === shiftDate(todayStr(), -1)) ? '　🔥 ' + streakInfo.count + ' 天' : ''}</button>
            <button onClick={openDailyCal} className="plat-btn-hard w-full py-2.5 bg-amber-50 border-[3px] border-slate-800 rounded-xl font-black text-base text-slate-600 shadow-[3px_3px_0px_rgba(30,41,59,1)]">📅 {todayStr()}（點開月曆回補）</button>
            <button onClick={() => setShowTutorial(true)} className="plat-btn-hard w-full py-4 bg-white border-4 border-slate-800 rounded-2xl font-black text-2xl text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)]">📖 玩法教學</button>
            <button onClick={() => { if (window.PLAT_show) window.PLAT_show('home'); }} className="plat-btn-hard w-full py-4 bg-[#60a5fa] border-4 border-slate-800 rounded-2xl font-black text-2xl text-white shadow-[4px_4px_0px_rgba(30,41,59,1)]">🏠 回大廳</button>
          </div>
          <p className="text-center text-slate-400 text-xs mt-8">三磚益智{window.PLAT_VERSION ? ' v' + window.PLAT_VERSION : ''}・美術燈</p>
        </div>
        {showSizeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSizeModal(false)}>
            <div className="bg-white rounded-3xl border-4 border-slate-800 p-6 w-full max-w-sm shadow-[6px_6px_0px_rgba(30,41,59,1)]" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-black text-slate-800 mb-1 text-center">選盤面大小</h2>
              <p className="text-center text-slate-500 text-sm font-bold mb-4">選好就直接開局</p>
              <div className="space-y-3">
                {SIZE_IDS.map(id => (
                  <button key={id} onClick={() => { setSizeId(id); platSave().setStr('akari_last_size', String(id)); startSolo(id); }} className={"plat-btn-hard w-full py-3.5 border-[3px] border-slate-800 rounded-xl font-black text-xl shadow-[3px_3px_0px_rgba(30,41,59,1)]" + (sizeId === id ? " bg-amber-400 text-slate-900" : " bg-white text-slate-800")}>{SIZES[id].name}{sizeId === id ? '（上次選的）' : ''}</button>
                ))}
              </div>
              <button onClick={() => setShowSizeModal(false)} className="plat-btn-hard w-full mt-4 py-2.5 bg-slate-100 border-[3px] border-slate-800 rounded-xl font-black text-slate-600">取消</button>
            </div>
          </div>
        )}
        {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      </div>
    );
  }

  // game 畫面
  const cellPxBase = puzzle ? Math.max(24, Math.min(52, Math.floor((Math.min(window.innerWidth || 400, 560) - 24) / puzzle.w))) : 36;
  const cellPx = Math.round(cellPxBase * zoom);
  return (
    <div className="min-h-screen flex flex-col items-center p-2 md:p-4 pb-28">
      <div className="w-full" style={{ maxWidth: puzzle ? (cellPx * puzzle.w + 24) + 'px' : '560px' }}>
        {/* 頂欄控制卡（整張有邊框、比照他款） */}
        <div className="bg-white border-[3px] border-slate-800 rounded-2xl shadow-[3px_3px_0px_rgba(30,41,59,1)] px-3 py-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { genTokenRef.current++; if (window.PlatGenerating) window.PlatGenerating.end(); setScreen('home'); setPuzzle(null); puzzleRef.current = null; }} className="plat-btn-hard bg-slate-100 px-2.5 py-1 rounded-lg border-2 border-slate-800 font-black text-sm shadow-[1px_1px_0px_rgba(30,41,59,1)]">← 主選單</button>
            <span className="bg-white px-1.5 py-0.5 rounded border-2 border-slate-800 font-black text-[10px] md:text-sm shadow-[1px_1px_0px_rgba(30,41,59,1)] whitespace-nowrap shrink-0">⚙️ {isDaily ? '每日一題 ' + spec.short : spec.name}</span>
            <span className="font-black text-slate-700 text-sm md:text-base tabular-nums">⏱ {mm}:{ss}</span>
            <span className="font-black text-amber-600 text-sm md:text-base">💡 {correct}/{P ? P.solution.size : 0}</span>
            <button onClick={() => { const m = platAudio().toggleMuted(); setMuted(!!m); }} className="plat-btn-hard bg-white w-8 h-8 rounded-lg border-2 border-slate-800 shadow-[1px_1px_0px_rgba(30,41,59,1)]" title="靜音切換">{muted ? '🔇' : '🔊'}</button>
            <button onClick={() => setShowRules(r => !r)} className="plat-btn-hard bg-white px-2.5 py-1 rounded-lg border-2 border-slate-800 font-black text-sm shadow-[1px_1px_0px_rgba(30,41,59,1)] ml-auto">📖 規則{showRules ? ' ▴' : ' ▾'}</button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-3.5 bg-slate-100 border-2 border-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: Math.round(progress * 100) + '%' }}></div>
            </div>
            <span className="font-black text-xs text-slate-500 whitespace-nowrap">進度 {Math.round(progress * 100)}%・照亮 {litPct}%</span>
          </div>
          {showRules && (
            <div className="mt-2 pt-2 border-t-2 border-dashed border-slate-200 text-sm font-bold text-slate-600 leading-relaxed">
              ① 在空格放燈，燈會照亮同行同列、直到撞牆。② 所有空格都要被照亮。③ 任何兩盞燈不能互相照到。④ 數字牆上下左右的燈數要剛好等於數字。點按循環：燈 → 叉（記號）→ 空白；按住拖曳可連續塗叉。
            </div>
          )}
        </div>
        {/* 盤面 */}
        <div className="akari-board-scroll overflow-auto flex justify-center" onPointerMove={onBoardMove}>
          <div className="inline-grid gap-[3px] p-[6px] bg-amber-100 border-[3px] border-slate-800 rounded-2xl" style={{ gridTemplateColumns: 'repeat(' + (puzzle ? puzzle.w : 10) + ', ' + cellPx + 'px)' }}>
            {puzzle && cells.map((cv, i) => {
              const isWall = P.walls.has(i);
              if (isWall) {
                const n = P.numbers.has(i) ? P.numbers.get(i) : null;
                const nst = n != null ? numState.get(i) : null;
                return (
                  <div key={i} className="flex items-center justify-center bg-slate-800 rounded-[4px] font-black select-none" style={{ width: cellPx, height: cellPx, fontSize: Math.round(cellPx * 0.5) }}>
                    {n != null ? <span style={{ color: nst === 'ok' ? '#4ade80' : (nst === 'over' ? '#f87171' : '#fbbf24') }}>{n}</span> : null}
                  </div>
                );
              }
              const isBulb = cv === 1, isCross = cv === 2, lit = litSet.has(i), bad = confBad.has(i);
              return (
                <button key={i} data-cell={i}
                  onPointerDown={e => onCellDown(i, e)} onPointerUp={e => onCellUp(i, e)} onClick={() => onCellClick(i)}
                  className={"flex items-center justify-center rounded-[4px] border select-none touch-none" + (bad ? " border-red-500" : " border-amber-200") + (isBulb && newBulbRef.current === i ? " akari-bulb-new" : "")}
                  style={{ width: cellPx, height: cellPx, fontSize: Math.round(cellPx * 0.52), background: isBulb ? '#fbbf24' : (lit ? '#fef3c7' : '#ffffff'), boxShadow: bad ? 'inset 0 0 0 2px #ef4444' : (isBulb ? '0 0 10px 2px rgba(245,158,11,0.55)' : 'none') }}>
                  {isBulb ? '💡' : (isCross ? <span className="text-slate-400 font-black">✕</span> : '')}
                </button>
              );
            })}
          </div>
        </div>
        {status === 'won' && winInfo && (
          <div className="mt-4 bg-white border-[3px] border-slate-800 rounded-2xl shadow-[3px_3px_0px_rgba(30,41,59,1)] p-4 text-center">
            <div className="text-3xl font-black text-slate-800 mb-1">🎉 全盤點亮！</div>
            <div className="font-bold text-slate-500 mb-3">{winInfo.isDaily ? '每日一題 ' + (winInfo.dateStr || '') + ' ' : ''}用時 {String(Math.floor(winInfo.secs / 60)).padStart(2, '0')}:{String(winInfo.secs % 60).padStart(2, '0')}{winInfo.isDaily && winInfo.dateStr === todayStr() && streakInfo.count > 0 ? '・🔥 連勝 ' + streakInfo.count + ' 天' : ''}</div>
            <div className="flex gap-2 justify-center">
              {!winInfo.isDaily && <button onClick={() => startSolo(sizeId)} className="plat-btn-hard px-5 py-2.5 bg-amber-400 border-[3px] border-slate-800 rounded-xl font-black shadow-[2px_2px_0px_rgba(30,41,59,1)]">🔁 再來一局</button>}
              <button onClick={() => { setScreen('home'); setPuzzle(null); puzzleRef.current = null; }} className="plat-btn-hard px-5 py-2.5 bg-white border-[3px] border-slate-800 rounded-xl font-black shadow-[2px_2px_0px_rgba(30,41,59,1)]">🏠 回主選單</button>
            </div>
          </div>
        )}
      </div>
      {/* PlatBar 掛載點（只在對局畫面） */}
      <div ref={platBarRef} className="fixed bottom-0 left-0 right-0 z-40"></div>
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}

// 教學（卡片式動畫、只教三件事）
function Tutorial(props) {
  const cell = 'w-8 h-8 flex items-center justify-center rounded-[4px] border border-amber-200 bg-[#f1f5f9] text-base';
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={props.onClose}>
      <div className="bg-white rounded-3xl border-4 border-slate-800 p-5 w-full max-w-md shadow-[6px_6px_0px_rgba(30,41,59,1)] max-h-[92vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-black text-slate-800 text-center mb-4">💡 怎麼玩美術燈</h2>
        <div className="space-y-4">
          <div className="bg-amber-50 border-2 border-slate-200 rounded-2xl p-3">
            <div className="font-black text-slate-700 mb-2">1️⃣ 燈照直線，撞牆就停</div>
            <div className="flex gap-[3px] justify-center">
              <div className={cell + ' akari-teach-cell'} style={{ animationDelay: '0.5s' }}></div>
              <div className={cell + ' akari-teach-cell'} style={{ animationDelay: '0.35s' }}></div>
              <div className={cell} style={{ background: '#fbbf24' }}>💡</div>
              <div className={cell + ' akari-teach-cell'} style={{ animationDelay: '0.35s' }}></div>
              <div className={cell + ' akari-teach-cell'} style={{ animationDelay: '0.5s' }}></div>
              <div className="w-8 h-8 flex items-center justify-center rounded-[4px] bg-slate-800"></div>
              <div className={cell}></div>
            </div>
            <p className="text-sm font-bold text-slate-500 mt-2">在空格放燈泡，整行整列都會亮起來，直到被黑牆擋住。目標是讓每一格都被照亮。</p>
          </div>
          <div className="bg-amber-50 border-2 border-slate-200 rounded-2xl p-3">
            <div className="font-black text-slate-700 mb-2">2️⃣ 兩盞燈不能互相照到</div>
            <div className="flex gap-[3px] justify-center">
              <div className={cell + ' akari-teach-clash'} style={{ background: '#fbbf24' }}>💡</div>
              <div className={cell} style={{ background: '#fee2e2' }}></div>
              <div className={cell} style={{ background: '#fee2e2' }}></div>
              <div className={cell + ' akari-teach-clash'} style={{ background: '#fbbf24' }}>💡</div>
            </div>
            <p className="text-sm font-bold text-slate-500 mt-2">同一行／列、中間沒有牆隔開的兩盞燈會互相照到——不行。要用牆把燈隔開。</p>
          </div>
          <div className="bg-amber-50 border-2 border-slate-200 rounded-2xl p-3">
            <div className="font-black text-slate-700 mb-2">3️⃣ 數字牆：旁邊的燈要剛剛好</div>
            <div className="flex gap-[3px] justify-center items-center">
              <div className={cell} style={{ background: '#fef3c7' }}></div>
              <div className={cell} style={{ background: '#fbbf24' }}>💡</div>
              <div className={cell} style={{ background: '#fef3c7' }}></div>
            </div>
            <div className="flex gap-[3px] justify-center items-center mt-[3px]">
              <div className={cell} style={{ background: '#fbbf24' }}>💡</div>
              <div className={cell + ' akari-teach-ok font-black'} style={{ background: '#1e293b', color: '#fbbf24' }}>2</div>
              <div className={cell}></div>
            </div>
            <p className="text-sm font-bold text-slate-500 mt-2">牆上的數字是它上下左右緊鄰的燈數。剛好等於時數字會變綠。點按格子循環：燈 → 叉（先做記號）→ 空白。</p>
          </div>
        </div>
        <button onClick={props.onClose} className="plat-btn-hard w-full mt-4 py-3 bg-amber-400 border-[3px] border-slate-800 rounded-xl font-black text-lg text-slate-900 shadow-[3px_3px_0px_rgba(30,41,59,1)]">開始玩！</button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AkariGame />);
