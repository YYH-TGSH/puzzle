
    const { useState, useEffect, useMemo, useRef } = React;
// PlatPct：進度 % 滾字（v1.53.0 物理感規格）——殼層 PlatCount 的 React 包裝；獨立版（無 PlatCount）退回純文字
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

// PlatNum：小數字 Roll-lite 包裝（v1.54.0，B 批）——有殼 PlatLite 時新值 spring 彈入換字；無殼（獨立版）退純文字。寫法比照 PlatPct。
function PlatNum(props) {
  var ref = useRef(null);
  var v = String(props.value);
  useEffect(function () { if (window.PlatLite && ref.current) window.PlatLite(ref.current, v); }, [v]);
  if (!window.PlatLite) return <span>{v}</span>;
  return <span ref={ref}></span>;
}


    // === 20 色票 ===
    const COLORS = [
      '#E3002B', '#F35B00', '#FFC90E', '#D7157A', '#E895C0',
      '#007A61', '#87D300', '#C4D600', '#8DD1BF', '#616130',
      '#00538A', '#008CC1', '#00C1D5', '#79C8ED', '#CDBB79',
      '#41136A', '#935CB9', '#BCA8D1', '#7A0026', '#BC7B70'
    ];

    // === 關卡設定 ===
    const LEVELS = [
      { id: 1, name: "5x5 幼幼班", width: 5, height: 5, description: "最簡單的暖身關卡，試著連連看。" },
      { id: 2, name: "10x10 標準", width: 10, height: 10, description: "標準難度，注意所有島嶼都要連通喔！" },
      { id: 3, name: "10x20 手機直式", width: 10, height: 20, description: "適合手機滑動的長條形地圖。" },
      { id: 4, name: "15x15 魔王", width: 15, height: 15, description: "極具挑戰性！找尋角落的大數字作為突破口。" },
      { id: 5, name: "20x20 史詩", width: 20, height: 20, description: "超大地圖，請善用右下角的畫面縮放功能。" },
      { id: 'custom', name: "⚙️ 自訂尺寸", width: 30, height: 30, description: "自訂地圖長寬，適合多人合作挑戰！" }
    ];

    // === 首次教學導覽步驟 ===
    const TUTORIAL_STEPS = [
      { icon: "🌉", title: "歡迎來到數橋！", body: "每個圓圈是一座「島」，上面的數字代表這座島需要幾座橋。你的任務：用橋把所有島連成一張網！" },
      { icon: "👆", title: "怎麼架橋？", body: "從島嶼按住拖曳，會看到預覽線跟著手指，放開即架橋；也可以直接點擊兩座島之間的空白處：點一下架 1 座橋、點兩下架 2 座、點第三下取消。橋只能走直線或橫線，而且橋跟橋之間不能交叉喔！", demo: 'bridge' },
      { icon: "✏️", title: "草稿模式", body: "遊戲下方的工具列可以切換到 ✏️ 草稿模式，先用虛線記下不確定的橋，確定後再轉成實線。", demo: 'draft' },
      { icon: "🔍", title: "縮放與操作", body: "雙指開合可以縮放地圖，也可以用右下角的 ＋ － 按鈕。向下滑動畫布可以自動收合上方選單，爭取更多空間。" },
      { icon: "🌐", title: "多人合作", body: "從平台主畫面進入多人連線，一人按「建立房間」拿到 4 位數代碼，朋友按「加入房間」輸入代碼就能一起解題！每個人的橋會用不同顏色顯示。" },
      { icon: "🔌", title: "跟朋友連線", body: "房主建立房間拿代碼 → 把代碼傳給朋友 → 朋友輸入代碼加入 → 連線成功！", demo: 'connect' }
    ];

    const getAvailableColor = (currentPlayers) => {
        const usedColors = currentPlayers.map(p => p.color);
        const available = COLORS.filter(c => !usedColors.includes(c));
        if (available.length > 0) {
            return available[Math.floor(Math.random() * available.length)];
        }
        return COLORS[Math.floor(Math.random() * COLORS.length)];
    };

    function formatTime(secs) {
      const m = String(Math.floor(secs / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      return m + ":" + s;
    }

    // ⭐ 每局星級評分：timeSec 完成秒數、islandCount 島數、usedSolution 是否看過解答
    function computeStars(timeSec, islandCount, usedSolution) {
      if (usedSolution) return 1;
      if (timeSec <= islandCount * 6) return 3;
      if (timeSec <= islandCount * 15) return 2;
      return 1;
    }

    function GameTimer({ startTime, endTime, isRunning }) {
        const [now, setNow] = useState(Date.now());
        useEffect(() => {
            if (!isRunning) return;
            setNow(Date.now());
            const t = setInterval(() => setNow(Date.now()), 1000);
            return () => clearInterval(t);
        }, [isRunning, startTime]);

        const timeToUse = endTime ? endTime : now;
        const secs = Math.max(0, Math.floor((timeToUse - startTime) / 1000));
        return <span>⏱ {formatTime(secs)}</span>;
    }

    // ==========================================
    // 每日一題：確定性隨機（零伺服器，同一天全世界同一題）
    // ==========================================
    // 台灣可愛動物隨機暱稱（多人連線用，約30個）
    // ===== ANIMAL-NAMES-START =====
    const ANIMAL_NAMES = [
      '柴犬', '柯基', '虎斑貓', '橘貓', '倉鼠', '兔兔', '刺蝟', '龍貓', '水豚', '樹懶',
      '狐獴', '羊駝', '企鵝', '海獺', '貓頭鷹', '松鼠', '無尾熊', '台灣黑熊', '石虎', '穿山甲',
      '梅花鹿', '台灣藍鵲', '帝雉', '獼猴', '山羌', '綠蠵龜', '櫻花鉤吻鮭', '飛魚', '螢火蟲', '獨角仙'
    ];
    function normName(n) { return (n || '').trim().toLowerCase(); }
    // ===== ANIMAL-NAMES-END =====

    // ===== DAILY-CHALLENGE-START ===

    // (moved to js/puzzle.js: mulberry32)


    // (moved to js/puzzle.js: hashDateStr)


    // (moved to js/puzzle.js: getDailyDateStr)


    // (moved to js/puzzle.js: shiftDateStr)


    // (moved to js/puzzle.js: getDailySeed)

// ===== PlatSave 接點（facade）：平台模式委派殼的 window.PlatSave、獨立開啟時用同語意本地後備；validator 在此集中登記、read 時統一帶入 =====
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

// validator 集中登記（收編既有守衛、行為等價）：resume＝形狀＋3 小時 TTL（場次 startAt 比對在 loadHashiResume 以 opts.validate 帶入）；daily_map 沿用其自帶 v:1 檢查
platSave().register('hashi_resume', function (p) { return !!p && typeof p === 'object' && Array.isArray(p.bridges) && typeof p.ts === 'number' && (Date.now() - p.ts) <= 3 * 3600 * 1000; });
platSave().register('hashi_daily_map', function (p) { return !!p && p.v === 1 && !!p.days && typeof p.days === 'object'; });
platSave().register('hashi_daily_streak', function (p) { return !!p && typeof p === 'object' && typeof p.count === 'number'; });
platSave().register('hashi_solo_custom', function (p) { return !!p && typeof p === 'object' && typeof p.w === 'number' && typeof p.h === 'number'; });
// === PlatTap/PlatZoom 接點（共用手勢判定＋縮放持有，v1.63.0）：平台模式用殼的 window.PlatTap/PlatZoom；獨立開啟用同語意本地後備（與殼同碼） ===
function platTapFactoryLocal(opts) {
  opts = opts || {};
  var slop = (opts.slop != null) ? opts.slop : 22;
  var tapMaxMs = (opts.tapMaxMs != null) ? opts.tapMaxMs : 0;
  var lpMs = (opts.longpressMs != null) ? opts.longpressMs : 0;
  var supMs = (opts.suppressMs != null) ? opts.suppressMs : 0;
  var g = null;
  var supT = -1, supTag;
  function drift(x, y) { return g ? Math.hypot(x - g.x0, y - g.y0) : 0; }
  function settle(x, y, t, isCancel) {
    if (!g) return { type: isCancel ? 'cancel' : 'none', dx: 0, dy: 0, drift: 0, dur: 0, longpress: false };
    t = (t != null ? t : Date.now());
    var hasXY = (typeof x === 'number' && typeof y === 'number');
    var d = hasXY ? drift(x, y) : 0, dur = t - g.t0, lp = g.lpFired, type;
    if (isCancel) type = 'cancel';
    else if (lp) type = 'longpress';
    else if (d > slop) type = 'drag';
    else if (tapMaxMs > 0 && dur >= tapMaxMs) type = 'cancel';
    else type = 'tap';
    var r = { type: type, dx: hasXY ? x - g.x0 : 0, dy: hasXY ? y - g.y0 : 0, drift: d, dur: dur, longpress: lp };
    g = null;
    return r;
  }
  return {
    down: function (x, y, t) { g = { x0: x, y0: y, t0: (t != null ? t : Date.now()), lpFired: false }; },
    move: function (x, y) { if (!g) return { dragging: false, drift: 0 }; var d = drift(x, y); return { dragging: d > slop, drift: d }; },
    poll: function (t) { if (g && lpMs > 0 && !g.lpFired && (t != null ? t : Date.now()) - g.t0 >= lpMs) { g.lpFired = true; return 'longpress'; } return null; },
    up: function (x, y, t) { return settle(x, y, t, false); },
    cancel: function (x, y, t) { return settle(x, y, t, true); },
    markSuppress: function (t, tag) { supT = (t != null ? t : Date.now()); supTag = tag; },
    shouldSuppressClick: function (t, tag) { if (supMs <= 0 || supT < 0) return false; if ((t != null ? t : Date.now()) - supT >= supMs) return false; return (supTag === undefined || tag === undefined || supTag === tag); },
    clearSuppress: function () { supT = -1; },
    active: function () { return !!g; }
  };
}
function platZoomFactoryLocal(opts) {
  opts = opts || {};
  var min = (opts.min != null) ? opts.min : 0.1;
  var max = (opts.max != null) ? opts.max : 5;
  var val = (opts.value != null) ? opts.value : 1;
  var clean2 = !!opts.cleanup2dp;
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  var api = {
    value: function () { return val; },
    set: function (v, range) { var lo = range ? range[0] : min, hi = range ? range[1] : max; val = clamp(v, lo, hi); return val; },
    setRaw: function (v) { val = v; return val; },
    add: function (d) { var v = val + d; if (clean2) v = Math.round(v * 100) / 100; return api.set(v); },
    reset: function () { val = 1; return val; },
    min: function () { return min; }, max: function () { return max; }
  };
  return api;
}
function platTapNew(opts) { return (window.PlatTap || platTapFactoryLocal)(opts); }
function platZoomNew(opts) { return (window.PlatZoom || platZoomFactoryLocal)(opts); }
function platArmZoom(el) {
  if (!el) return;
  if (window.PlatZoom && window.PlatZoom.armTransition) { window.PlatZoom.armTransition(el); return; }
  el.style.transition = 'width 200ms cubic-bezier(0.22, 1, 0.36, 1), height 200ms cubic-bezier(0.22, 1, 0.36, 1)';
  if (el.__pzArmTimer) clearTimeout(el.__pzArmTimer);
  el.__pzArmTimer = setTimeout(function () { el.style.transition = ''; el.__pzArmTimer = null; }, 260);
}
// === PlatAudio 接點（技能對照改造第 3 項，v1.64.0）：平台模式用殼的 window.PlatAudio；獨立開啟用同配方（v1.64.2 A 清脆＋華麗版）本地後備——靜音同走 plat_muted、首次讀取保守合併舊三鍵 ===
var __paLocal = null;
function platAudio() {
  if (typeof window !== 'undefined' && window.PlatAudio) return window.PlatAudio;
  if (__paLocal) return __paLocal;
  var RECIPES = {
    place:    { notes: [[880, 0, 0.07, 1, 'triangle']] },
    error:    { notes: [[170, 0, 0.13, 1, 'triangle']] },
    boom:     { notes: [[140, 0, 0.22, 1, 'triangle']] },
    gift:     { notes: [[523, 0, 0.14, 0.7, 'triangle'], [659, 0.07, 0.18, 0.7, 'triangle']] },
    complete: { notes: [[523, 0, 0.16, 1, 'triangle'], [659, 0.07, 0.16, 1, 'triangle'], [784, 0.14, 0.16, 1, 'triangle'], [1046, 0.21, 0.30, 1, 'triangle'], [262, 0, 0.75, 0.22, 'sine'], [330, 0, 0.75, 0.22, 'sine'], [392, 0, 0.75, 0.22, 'sine']] },
    win:      { notes: [[523, 0, 0.16, 1, 'triangle'], [587, 0.08, 0.16, 1, 'triangle'], [659, 0.16, 0.16, 1, 'triangle'], [784, 0.24, 0.16, 1, 'triangle'], [880, 0.32, 0.16, 1, 'triangle'], [1046, 0.40, 0.24, 1, 'triangle'], [1046, 0.48, 1.0, 0.45, 'sine'], [1318, 0.48, 1.0, 0.45, 'sine'], [1568, 0.48, 1.0, 0.45, 'sine'], [262, 0, 1.2, 0.22, 'sine'], [330, 0, 1.2, 0.22, 'sine'], [392, 0, 1.2, 0.22, 'sine']] }
  };
  var ctx = null, master = null, unlocked = false, lastPlay = {}, mutedCache = null;
  function sGet(k) { try { var v = platSave().getStr(k, ''); return v === null || v === undefined ? '' : v; } catch (e) { return ''; } }
  function sSet(k, v) { try { platSave().setStr(k, v); } catch (e) {} }
  function readMuted() {
    if (mutedCache !== null) return mutedCache;
    var v = sGet('plat_muted');
    if (!v) {
      var legacy = sGet('sudoku_muted') === '1' || sGet('hashi_muted') === '1' || sGet('mines_muted') === '1';
      v = legacy ? '1' : '0';
      sSet('plat_muted', v);
    }
    mutedCache = (v === '1');
    return mutedCache;
  }
  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); } catch (e) { ctx = null; return null; }
    return ctx;
  }
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('pointerdown', function () {
      unlocked = true;
      var c = ensureCtx();
      if (c && c.state === 'suspended') { try { var p = c.resume(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
    }, true);
  }
  function tone(freq, at, dur, vol, type) {
    var t = ctx.currentTime + at;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  __paLocal = {
    play: function (name) {
      try {
        if (readMuted()) return;
        var r = RECIPES[name]; if (!r) return;
        var vib = { place: 10, error: [30, 30, 30], complete: [50, 50, 100], win: [50, 50, 100], gift: 10 }[name];
        if (vib !== undefined) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(vib); } catch (e) {} }
        if (!unlocked || !ctx || ctx.state === 'suspended') return;
        var now = Date.now();
        if (lastPlay[name] && now - lastPlay[name] < 60) return;
        lastPlay[name] = now;
        for (var i = 0; i < r.notes.length; i++) { var n = r.notes[i]; tone(n[0], n[1], n[2], n[3], n[4]); }
      } catch (e) {}
    },
    isMuted: function () { return readMuted(); },
    setMuted: function (m) { mutedCache = !!m; sSet('plat_muted', m ? '1' : '0'); },
    toggleMuted: function () { var m = !readMuted(); mutedCache = m; sSet('plat_muted', m ? '1' : '0'); return m; }
  };
  return __paLocal;
}

    // 每日紀錄收斂為單一 map key（稽核 G-01：原「一天一 key」無界成長）：第一次讀取時把全部舊 key 摺進 hashi_daily_map 並刪除舊 key，之後只讀寫 map（帶 schema 版本 v:1，G-02）
    let _dailyMapCache = null;
    function dailyMap() {
      if (_dailyMapCache) return _dailyMapCache;
      let m = platSave().read('hashi_daily_map', { fallback: null });
      if (!m) m = { v: 1, days: {} };
      try {
        const legacy = [];
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && /^hashi_daily_\d{4}-\d{2}-\d{2}$/.test(k)) legacy.push(k); }
        legacy.forEach(k => { const ds = k.slice('hashi_daily_'.length); if (!m.days[ds]) { try { const p = JSON.parse(localStorage.getItem(k)); if (p && typeof p.time === 'number' && isFinite(p.time)) m.days[ds] = { time: p.time }; } catch (e) {} } try { localStorage.removeItem(k); } catch (e) {} });
        if (legacy.length) platSave().write('hashi_daily_map', m);
      } catch (e) {}
      _dailyMapCache = m;
      return m;
    }
    function readDailyRecord(dateStr) {
      const p = dailyMap().days[dateStr];
      return (p && typeof p.time === 'number' && isFinite(p.time)) ? p : null; // 形狀不符（舊版/損毀資料）視同無紀錄：recordDailyWin 直接讀 prev.time 算 Math.min，NaN 會一路污染最佳時間（稽核修）
    }
    function readDailyStreak() {
      try {
        return platSave().read('hashi_daily_streak', { fallback: { count: 0, lastDate: '' } });
      } catch (e) { return { count: 0, lastDate: '' }; }
    }
    function getDailyStatus(dateStr) {
      const d = clampDailyDate(dateStr);
      return { dateStr: d, done: readDailyRecord(d), streak: readDailyStreak().count };
    }
    // 每日一題可玩的日期範圍：今天以前（含今天），未來不行
    const MIN_DAILY_DATE = '2026-01-01';
    function clampDailyDate(d) {
      const today = HASHI_PUZZLE.getDailyDateStr();
      if (!d) return today;
      if (d > today) return today;
      if (d < MIN_DAILY_DATE) return MIN_DAILY_DATE;
      return d;
    }
    // ===== DAILY-CHALLENGE-END =====

    // ==========================================
    // 全新高密度智慧演算法 (網格掃描 + Kruskal生成樹)
    // ==========================================

    // (moved to js/puzzle.js: generateRandomHashi)



    // (moved to js/puzzle.js: generateEmptyBridges)


    // ==========================================
    // React 主程式 (v2.0：移除雲端伺服器，僅保留 PeerJS 免費直連)
    // ==========================================

    function HashiGame() {
      const playerIdRef = useRef((() => { try {
        const K = 'plat_uid_hashi';
        let tab = sessionStorage.getItem(K + '_tab');
        if (!tab) { tab = Math.random().toString(36).substring(2, 8); try { sessionStorage.setItem(K + '_tab', tab); } catch (e) {} }
        let claim = null; try { claim = JSON.parse(localStorage.getItem(K + '_claim') || 'null'); } catch (e) {}
        if (claim && claim.tab !== tab && (Date.now() - claim.ts) < 8000) {
          // 同瀏覽器另一個分頁正在用正規 uid（雙分頁/同機雙開測試）：本分頁改用分頁專屬 uid，避免兩邊同 uid 撞成同一個人
          let alt = sessionStorage.getItem(K + '_alt');
          if (!alt) { alt = Math.random().toString(36).substring(2, 12); try { sessionStorage.setItem(K + '_alt', alt); } catch (e) {} }
          return alt;
        }
        const beat = () => { try { localStorage.setItem(K + '_claim', JSON.stringify({ tab: tab, ts: Date.now() })); } catch (e) {} };
        beat(); // interval id 存到 window 並先清舊的（稽核 D-06：平台 REBOOT 會重跑遊戲程式碼，原寫法 id 直接丟棄、舊 interval 永遠清不掉會疊加）
        var _ct = window.__platClaimTimers || (window.__platClaimTimers = {});
        if (_ct[K]) clearInterval(_ct[K]);
        _ct[K] = setInterval(beat, 3000);
        let u = localStorage.getItem(K);
        if (!u) { u = Math.random().toString(36).substring(2, 12); localStorage.setItem(K, u); }
        return u;
      } catch (e) { return Math.random().toString(36).substring(2, 12); } })()); // 持久 uid：同裝置重連同房間＝同座位（重連回座）；同瀏覽器多分頁僅第一個分頁用正規 uid
      const myId = playerIdRef.current;
      const platTimeOffset = () => { try { return (window.__PLAT_NET && window.__PLAT_NET.timeOffset) || 0; } catch (e) { return 0; } }; // 房主時鐘偏移（稽核 D-05）：殼以 roster 時間戳估計，房主/單機恆 0
      const myNameRef = useRef("");
      const lastSeenRef = useRef({}); // 在線心跳：uid → 最後收到其訊息的時間（房主端判定離線用）
      const hostSeenRef = useRef(0); // 來賓端：最後收到房主訊息的時間
      const lastPingRef = useRef(0);
      const myColorRef = useRef(COLORS[0]);

      const initialDataRef = useRef(null);
      if (!initialDataRef.current) {
        initialDataRef.current = HASHI_PUZZLE.generateUniqueHashi(LEVELS[1]);
      }

      const [screen, setScreen] = useState('home');
      const [engine, setEngine] = useState('none');
      const [currentLevelId, setCurrentLevelId] = useState(2);

      const [randomLevelData, setRandomLevelData] = useState(initialDataRef.current);
      const [bridges, setBridges] = useState(() => HASHI_PUZZLE.generateEmptyBridges(initialDataRef.current));
      const [strokes, setStrokes] = useState([]);

      const [history, setHistory] = useState([]);
      const [isWon, setIsWon] = useState(false);
      const isWonRef = useRef(false);
      useEffect(() => { isWonRef.current = isWon; }, [isWon]);
      const [hideVictoryModal, setHideVictoryModal] = useState(false);
      const [toastMsg, setToastMsg] = useState("");

      const [startTime, setStartTime] = useState(Date.now());
      const [endTime, setEndTime] = useState(null);

      const [zoomLevel, setZoomLevel] = useState(1);
      const [showSolution, setShowSolution] = useState(false);
      const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);

      const [showSaveModal, setShowSaveModal] = useState(false);
      const [showSettingsModal, setShowSettingsModal] = useState(false); // 設定難度 modal（v1.43 Q2：設定入口三款統一 modal 式，廢標頭 select）
      const [soloPick, setSoloPick] = useState(false); // 單機入口先選難度（v1.58.0 使用者要求，比照數獨設定畫面／地雷 setup）：由主畫面「單機挑戰」開 modal 時為 true，取消＝回主畫面、選定才開局
      const [saveCode, setSaveCode] = useState("");

      const [showCustomModal, setShowCustomModal] = useState(false);
      const [tempWidth, setTempWidth] = useState(30);
      const [tempHeight, setTempHeight] = useState(30);

      const [interactionMode, setInteractionMode] = useState(0);
      const [drawSubMode, setDrawSubMode] = useState('pen');

      const modeIcons = ['🖋️', '✏️', '🖌️'];
      const modeTitles = ['實線模式', '草稿模式', '繪圖作記號'];

      const [zoomModeIdx, setZoomModeIdx] = useState(0);
      const [isClosingModal, setIsClosingModal] = useState(false);
      const [isGenerating, setIsGenerating] = useState(false);
      const [boardFadeKey, setBoardFadeKey] = useState(0); // 新題目時棋盤淡入

      const [hoveredBridgeId, setHoveredBridgeId] = useState(null);
      const [hoveredIslandId, setHoveredIslandId] = useState(null);

      const [colorPickerTarget, setColorPickerTarget] = useState(null);
      const [colorSeq, setColorSeq] = useState([]);
      const [editTarget, setEditTarget] = useState(null); // 個人設定 modal（改名/改色，比照數獨進度條）：點自己（或房主點任何人）的選手晶片開啟
      const [editName, setEditName] = useState('');

      // 💾 記住暱稱與房號（同一裝置下次免重打；房主代碼固定不變）
      const loadSavedNickname = () => platSave().getStr('hashi_nickname', '');
      const saveNickname = (n) => { if (n) platSave().setStr('hashi_nickname', n); };
      const loadLastRoom = () => platSave().getStr('hashi_last_room', '');
      const saveLastRoom = (r) => { if (r) platSave().setStr('hashi_last_room', r); };
      const loadHostRoom = () => platSave().getStr('hashi_host_room', '');
      const saveHostRoom = (r) => { if (r) platSave().setStr('hashi_host_room', r); };
      const clearHostRoom = () => platSave().remove('hashi_host_room');

      const [roomId, setRoomId] = useState("");
      const [isHost, setIsHost] = useState(false);
      const [tempRoomId, setTempRoomId] = useState(() => loadLastRoom());
      const [tempPlayerName, setTempPlayerName] = useState("");
      const [namePlaceholderAnimal] = useState(() => ANIMAL_NAMES[(Math.random() * ANIMAL_NAMES.length) | 0]);
      const nameInputRef = useRef(null);
      const [joinStep, setJoinStep] = useState('choose'); // 'choose' | 'hostSetup' | 'guestSetup' | 'connecting' | 'nick'
      const [takenNames, setTakenNames] = useState([]);   // 來賓：房主回傳的已用名單快照
      const [nickError, setNickError] = useState("");      // nick 步輸入框下方 inline 錯誤
      const joinRoleRef = useRef(null);        // 'host' | 'guest'
      const joinActiveRef = useRef(false);     // 是否正在 join 流程中（供斷線／錯誤判斷）
      const suppressCloseRef = useRef(false);  // 主動清理連線時壓住 close 事件雜訊
      const autoNameRef = useRef(false); // 本次加入用的名字是否來自拉霸機（REQ_REJOIN 沿用）
      const myJoinNameRef = useRef(""); // 本次 JOIN 用的名字（名單自我修復重送 JOIN 用，不從 playersList 反推）
      const promotingRef = useRef(false); // 房主接管升格中（open handler 不洗名單）
      const hostRoomRetryRef = useRef(false); // 房主固定代碼衝突時只自動重試一次
      // 🎰 暱稱拉霸機
      const [showSlotMachine, setShowSlotMachine] = useState(false);
      const [slotMode, setSlotMode] = useState('host');
      const [slotPool, setSlotPool] = useState(ANIMAL_NAMES);
      const [slotName, setSlotName] = useState("");
      const [slotSpinning, setSlotSpinning] = useState(false);
      const [slotFinalName, setSlotFinalName] = useState("");
      const [slotWaiting, setSlotWaiting] = useState(false);
      const [slotRound, setSlotRound] = useState(0);
      const slotPoolRef = useRef(ANIMAL_NAMES);
      const slotFinalNameRef = useRef("");
      const slotTimerRef = useRef(null);
      const guestAutoNameRef = useRef(false);
      const guestJoinedRef = useRef(false);
      const guestNamesResolvedRef = useRef(false);
      const guestNamesTimeoutRef = useRef(null);
      const [playersList, setPlayersList] = useState([]);
      const [isConnecting, setIsConnecting] = useState(false);

      const [showOtherCursors, setShowOtherCursors] = useState(true);
      const [cursors, setCursors] = useState({});
      const [ripples, setRipples] = useState([]);

      // 💬 聊天室
      const [chatMsgs, setChatMsgs] = useState([]); // {id, uid, name, color, text, ts, mine}
      const [chatOpen, setChatOpen] = useState(false);
      const [chatInput, setChatInput] = useState('');
      const [unreadChat, setUnreadChat] = useState(0);
      const chatOpenRef = useRef(false);
      const chatListRef = useRef(null);
      const [chatMin, setChatMin] = useState(false); // 💬 聊天室收合

      // 💬 聊天室邏輯
      useEffect(function() { chatOpenRef.current = chatOpen; if (chatOpen) setUnreadChat(0); }, [chatOpen]);
      useEffect(function() { // 新訊息自動捲到底
        const el = chatListRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, [chatMsgs, chatOpen]);
      const appendChatMsg = (m) => {
        const msg = { id: 'c' + Date.now() + '_' + Math.floor(Math.random() * 1000000), uid: m.uid, name: m.name || '對手', color: m.color || '#3b82f6', text: String(m.text || '').slice(0, 200), ts: m.ts || Date.now(), mine: m.uid === myId };
        setChatMsgs(prev => [...prev.slice(-99), msg]);
        if (!msg.mine && !chatOpenRef.current) setUnreadChat(prev => prev + 1);
      };
      const sendChat = () => {
        const text = chatInput.trim();
        if (!text || engineRef.current !== 'peerjs') return;
        const msg = { type: 'CHAT', uid: myId, name: (myNameRef.current || '你'), color: myColorRef.current, text: text, ts: Date.now() };
        appendChatMsg(msg);
        setChatInput('');
        try {
          if (isHostRef.current) { connsRef.current.forEach(c => { if (c.open) c.send(msg); }); }
          else if (connRef.current && connRef.current.open) { connRef.current.send(msg); }
        } catch (e) {}
      };

      // 📹 圓形視訊（PeerJS MediaConnection，走 WebRTC 不經伺服器）
      const [videoOn, setVideoOn] = useState(false);
      const [micMuted, setMicMuted] = useState(false);
      const [localStream, setLocalStream] = useState(null);
      const [remoteVideos, setRemoteVideos] = useState({}); // uid -> MediaStream
      const localStreamRef = useRef(null);
      const videoCallsRef = useRef([]);
      const videoOnRef = useRef(false);
      useEffect(function() { videoOnRef.current = videoOn; }, [videoOn]);
      // 🔊 喇叭預設關閉；有人開麥發言時提示是否開音效
      const [speakerOn, setSpeakerOn] = useState(false);
      const [remoteMic, setRemoteMic] = useState({}); // uid -> muted(bool)
      const [speakPrompt, setSpeakPrompt] = useState(null); // {uid, name}
      const speakerOnRef = useRef(false);
      const speakPromptedRef = useRef({});
      useEffect(function() { speakerOnRef.current = speakerOn; }, [speakerOn]);
      useEffect(function() { // 喇叭開關即時套用到所有遠端視訊
        document.querySelectorAll('.remote-video-el').forEach(el => { try { el.muted = !speakerOn; } catch (e) {} });
        if (speakerOn) setSpeakPrompt(null);
      }, [speakerOn]);
      const broadcastMic = (muted) => {
        const msg = { type: 'MIC', uid: myId, name: (myNameRef.current || '你'), muted: muted };
        try {
          if (isHostRef.current) { connsRef.current.forEach(c => { if (c.open) c.send(msg); }); }
          else if (connRef.current && connRef.current.open) { connRef.current.send(msg); }
        } catch (e) {}
      };
      const handleMicMsg = (m) => {
        if (!m || m.uid === myId) return;
        setRemoteMic(prev => ({ ...prev, [m.uid]: !!m.muted }));
        if (m.muted) {
          speakPromptedRef.current[m.uid] = false;
          setSpeakPrompt(prev => (prev && prev.uid === m.uid) ? null : prev);
        } else if (!speakerOnRef.current && !speakPromptedRef.current[m.uid]) {
          speakPromptedRef.current[m.uid] = true;
          setSpeakPrompt({ uid: m.uid, name: m.name || '對手' });
        }
      };
      const handleIncomingCall = (call) => {
        try { call.answer(localStreamRef.current || undefined); } catch (e) { try { call.answer(); } catch (e2) {} }
        videoCallsRef.current.push(call);
        const remoteUid = (call.metadata && call.metadata.uid) || call.peer;
        call.on('stream', (rs) => {
          setRemoteVideos(prev => ({ ...prev, [remoteUid]: rs }));
          showToast('📹 對方開啟了視訊');
        });
        call.on('close', () => {
          setRemoteVideos(prev => { const n = { ...prev }; delete n[remoteUid]; return n; });
        });
      };
      const callAllPeers = (stream) => {
        const peer = peerRef.current;
        if (!peer) return;
        const doCall = (peerId, uid) => {
          try {
            const call = peer.call(peerId, stream, { metadata: { uid: myId, name: (myNameRef.current || '你') } });
            videoCallsRef.current.push(call);
            call.on('stream', (rs) => { setRemoteVideos(prev => ({ ...prev, [uid]: rs })); });
            call.on('close', () => { setRemoteVideos(prev => { const n = { ...prev }; delete n[uid]; return n; }); });
          } catch (e) {}
        };
        if (isHostRef.current) {
          connsRef.current.forEach(c => { if (c.uid && c.open) doCall(c.peer, c.uid); });
        } else if (connRef.current && connRef.current.open) {
          const hostEntry = playersListRef.current.find(p => p.isHost);
          doCall(connRef.current.peer, hostEntry ? hostEntry.id : connRef.current.peer);
        }
      };
      const stopVideo = () => {
        videoCallsRef.current.forEach(call => { try { call.close(); } catch (e) {} });
        videoCallsRef.current = [];
        const s = localStreamRef.current;
        if (s) { try { s.getTracks().forEach(t => t.stop()); } catch (e) {} }
        localStreamRef.current = null;
        setLocalStream(null); setRemoteVideos({}); setVideoOn(false); setMicMuted(false);
        setRemoteMic({}); setSpeakPrompt(null); speakPromptedRef.current = {};
      };
      const toggleVideo = async () => {
        if (videoOn) { stopVideo(); return; }
        if (engineRef.current !== 'peerjs') return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          showToast('⚠️ 目前的環境不支援相機（預覽器不算），請上線後用 Safari 開啟');
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 320 }, facingMode: 'user' }, audio: true });
          try { stream.getAudioTracks().forEach(t => { t.enabled = false; }); } catch (e) {} // 🎤 麥克風預設關閉，要講話再手動開
          localStreamRef.current = stream;
          setLocalStream(stream); setVideoOn(true); setMicMuted(true);
          callAllPeers(stream);
          broadcastMic(true);
        } catch (e) {
          showToast(e && e.name === 'NotAllowedError' ? '⚠️ 相機/麥克風權限被拒，請到瀏覽器設定中允許' : '⚠️ 無法開啟相機/麥克風');
        }
      };
      const toggleMic = () => {
        const newMuted = !micMuted;
        const s = localStreamRef.current;
        if (s) { try { s.getAudioTracks().forEach(t => { t.enabled = !newMuted; }); } catch (e) {} }
        setMicMuted(newMuted);
        broadcastMic(newMuted); // 通知其他玩家：我開麥/關麥了
      };

      // 首次教學導覽
      const [showTutorial, setShowTutorial] = useState(false);
      const [tutorialStep, setTutorialStep] = useState(0);

      // 靜音偏好（與全域音效引擎同步）
      const [muted, setMuted] = useState(() => platAudio().isMuted()); // 靜音統一殼級 plat_muted（PlatAudio，v1.64.0）

      // 🏁 競速模式
      const [mpMode, setMpMode] = useState('coop'); // 'coop' | 'race'
      const [raceState, setRaceState] = useState('idle'); // idle | lobby | countdown | racing | finished
      const [raceProgress, setRaceProgress] = useState({});
      // ⚔️ 大亂鬥擴充：盤面快照（上帝視角）+ 道具 + 特效
      const [brawlBoards, setBrawlBoards] = useState({});
      const brawlBoardsRef = useRef({});
      useEffect(() => { brawlBoardsRef.current = brawlBoards; }, [brawlBoards]);
      // 🎮 統一多人框架：等待室 + 大亂鬥設定 + 本局選手名單
      const [roomOpen, setRoomOpen] = useState(false);
      const [brawlSettings, setBrawlSettings] = useState({ sizeId: 2, itemsEnabled: true, godNumbers: true });
      const [raceRacers, setRaceRacers] = useState([]);
      const [godViewUid, setGodViewUid] = useState(null);
      const [myItems, setMyItems] = useState([]);
      const [fxFog, setFxFog] = useState({});
      const [fxFogBoxes, setFxFogBoxes] = useState([]); // 雲霧：[{id,minX,minY,maxX,maxY,until,cx,cy,R,puffs}]（命中島嶼外接矩形＋命中時算好的雲團幾何）
      const [fxMarks, setFxMarks] = useState([]); // 短暫特效標記：[{id,gx,gy,icon,until}]（💥炸橋／✨禮物補橋，格坐標中心）
      const [fxNow, setFxNow] = useState(Date.now());
      const [raceResult, setRaceResult] = useState(null);
      useEffect(() => { if (raceResult && raceResult.winnerUid && raceResult.winnerUid === myId) { try { platAudio().play('win'); } catch (e) {} } }, [raceResult]); // 奪冠（競速/大亂鬥冠軍是我）＝win（PlatAudio，v1.64.0）
      const [raceWaiting, setRaceWaiting] = useState(false);
      const resultsDismissRef = useRef(null); // PlatResults 關閉標記（記 raceState：同 state 內關了不再彈，state 變了——如結算——再彈）
      const [resultsDismissedUi, setResultsDismissedUi] = useState(false); // 結果卡被「看盤面」關掉後，畫面留一顆🏆結果鈕可隨時叫回
      const [leaveArm, setLeaveArm] = useState(false); // 結果卡「離開」兩段確認（防誤按就拆連線退場、結果再也叫不回）
      const leaveArmTimerRef = useRef(null);
      const [showExitMenu, setShowExitMenu] = useState(false); // 標頭「退出」選單（錦標賽房主進行中按退出才開，內含「結束本局」防誤觸）
      const [raceCountdown, setRaceCountdown] = useState(null);

      // ⭐ 星級評分
      const [stars, setStars] = useState(0);
      const [isNewBest, setIsNewBest] = useState(false);

      // ✨ 爽感：粒子與撒花
      const [bursts, setBursts] = useState([]);
      const [confetti, setConfetti] = useState([]);

      // 每日一題
      const [isDailyMode, setIsDailyMode] = useState(false);
      const [dailyDateStr, setDailyDateStr] = useState("");
      const [dailyStreak, setDailyStreak] = useState(0);
      const [dailyDone, setDailyDone] = useState(null);
      const isDailyModeRef = useRef(false);
      const dailyDateStrRef = useRef("");
      // 主選單選擇的每日題目日期（預設今天，可往前選以前的題目）
      const [dailyMenuDate, setDailyMenuDate] = useState(() => HASHI_PUZZLE.getDailyDateStr());

      const dailyStatus = useMemo(() => {
        if (screen !== 'home') return null;
        return getDailyStatus(dailyMenuDate);
      }, [screen, dailyMenuDate]);

      const isMultiplayer = engine !== 'none';
      const inRace = raceState !== 'idle';
      const spectateUid = (godViewUid && brawlBoards[godViewUid]) ? godViewUid : (raceRacers.find(u => brawlBoards[u]) || null);
      const myPlayerEntry = playersList.find(p => p.id === myId);
      const roomRacers = playersList.filter(p => !p.isSpectator);
      const roomRealRacers = playersList.filter(p => !p.isSpectator && !p.pending); // 已真人到場的選手（未到席位不算人數）
      const roomAllReady = roomRacers.length >= 2 && roomRacers.every(p => p.isReady);
      const svgRef = useRef(null);
      const lastCursorSend = useRef(0);
      const isDrawingRef = useRef(false);

      const engineRef = useRef('none');
      const isHostRef = useRef(false);
      const peerRef = useRef(null);
      const PLAT_MODE = typeof window !== 'undefined' && !!window.__PLAT_PLATFORM;

      const [zoomOpen, setZoomOpen] = useState(false);
      const [drawSubOpen, setDrawSubOpen] = useState(false);
      // 平台 dock 按鈕（💬/🎥/🎤/🔈）：平台模式＋連線中時畫進自己的底部列，與遊戲按鈕同排同款
      const [dockTick, setDockTick] = useState(0);
      useEffect(() => { if (window.PlatDock) return window.PlatDock.subscribe(() => setDockTick(t => t + 1)); }, []);
      const platDock = (PLAT_MODE && window.PlatDock && window.PlatDock.isActive()) ? window.PlatDock.getState() : null;
      const renderDockCapsule = (withLobby) => {
          if (!platDock) return null;
          const PD = window.PlatDock;
          const dbtn = (active) => "px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl font-black text-base md:text-lg flex items-center justify-center transition-all relative " + (active ? "bg-[#4ade80] text-slate-900 shadow-md" : "text-slate-400 hover:text-white");
          return (
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner">
                  {withLobby && (<button onClick={() => PD.goLobby()} className={dbtn(false)} title="回大廳選遊戲">🏠</button>)}
                  <button onClick={() => PD.toggleChat()} className={dbtn(platDock.chatOpen)} title="聊天室">💬{platDock.unread > 0 && (<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border border-white rounded-full text-[9px] text-white flex items-center justify-center font-black">{platDock.unread > 9 ? '9+' : platDock.unread}</span>)}</button>
                  <button onClick={() => PD.toggleVideo()} className={dbtn(platDock.videoOn)} title="視訊">{platDock.videoOn ? '📹' : '🎥'}</button>
                  {platDock.videoOn && (<button onClick={() => PD.toggleMic()} className={dbtn(!platDock.micMuted)} title="麥克風">{platDock.micMuted ? '🔇' : '🎤'}</button>)}
                  {(platDock.videoOn || platDock.remoteCount > 0) && (<button onClick={() => PD.toggleSpeaker()} className={dbtn(platDock.speakerOn)} title="喇叭">{platDock.speakerOn ? '🔊' : '🔈'}</button>)}
              </div>
          );
      };
      const platAutoRef = useRef(null);
      const platSessRef = useRef(null); // 平台 hub：殼 enter/migrate 最後帶入的 sess（hub 模式下代表色以 sess.color 為準、固定不亂配）
      const hubPlatColor = () => {
        const s = platSessRef.current;
        if (!s || !s.hub) return null;
        const c = s.color;
        return (c === 'rainbow' || COLORS.indexOf(c) >= 0) ? c : null;
      };
      const connRef = useRef(null);
      const connsRef = useRef([]);
      const zoomContainerRef = useRef(null);
      const lastPinchDist = useRef(null);
      const stateRef = useRef({ bridges: [], randomLevelData: null, showSolution: false, startTime: Date.now(), levelId: 2, strokes: [] });

      const zoomLevelRef = useRef(1);
      const zoomModeIdxRef = useRef(0);
      const levelDimRef = useRef({ w: 10, h: 10 }); // 最新題目尺寸（給 auto-fit 用）
      const userZoomedRef = useRef(false); // 使用者是否手動調整過縮放
      const lastBridgeTapRef = useRef({}); // 橋樑防連點時間戳
      const dragDrawRef = useRef(null); // 拖曳架橋手勢 {kind:'island'|'bridge', id, startX, startY, startT, dragging, targetId, holdTimer}
      const tapTrkRef = useRef(null); // 共用手勢判定（PlatTap，v1.63.0）：slop 22 client／tapMax＝TAP_MAX_MS／hold 武裝＝DRAG_HOLD_MS
      const tapTrk = () => { if (!tapTrkRef.current) tapTrkRef.current = platTapNew({ slop: 22, tapMaxMs: TAP_MAX_MS, longpressMs: DRAG_HOLD_MS }); return tapTrkRef.current; };
      const pzRef = useRef(null); // 共用縮放持有（PlatZoom）：按鈕/pinch 0.4–3.5；適應模式以單次 range [0.2,3.5] 守恆
      const pz = () => { if (!pzRef.current) pzRef.current = platZoomNew({ min: 0.4, max: 3.5, value: 1 }); return pzRef.current; };
      const panRef = useRef(null); // 空白處單指拖曳捲動 {lastX, lastY}（CSS px；svg 已 touch-action:none，需手動捲動）
      const currentPathDataRef = useRef("");
      const drawingPathRef = useRef(null);
      const eraserRef = useRef(null);
      const dragPreviewLineRef = useRef(null); // 拖曳架橋預覽線（ref 直寫 DOM，不走 React state）
      const dragPreviewTipRef = useRef(null);  // 拖曳預覽線末端圓點
      const lastEraseTimeRef = useRef(0);
      const mpModeRef = useRef('coop');
      const playersListRef = useRef([]);
      const raceStateRef = useRef('idle');
      const raceStartAtRef = useRef(null);
      const raceSeqRef = useRef(0);
      const raceResultsRef = useRef({});
      const myFinishTimeRef = useRef(null);
      const finishResentRef = useRef(0); // RACE_FINISH 補送次數（完賽回報補送用）
      const lastProgressSentRef = useRef(0);
      const lastProgressValRef = useRef(-1);
      const myItemsRef = useRef([]);
      const brawlAutoRef = useRef({}); // 集滿 3 自動發動進行中旗標（防重入）
      const raceProgressRef = useRef({});
      const hostMilestonesRef = useRef({});
      const brawlSettingsRef = useRef({ sizeId: 2, itemsEnabled: true, godNumbers: true });
      const customDimsRef = useRef(null); // 房間頁帶入的自訂尺寸 {w,h}（關卡選自訂時生成題目用）
      const racersRef = useRef([]);
      const milestonesRef = useRef({});
      const hashiGiftCreditRef = useRef(0); // 島嶼禮物額度：正確完成島數每跨總數 1/20 +1，送給較弱的對手；沒對象時存著
      const hashiGiftUnitsRef = useRef(0); // 已入帳的島嶼禮物單位（正確完成島數換算，只增不減——橋被拆掉重架不重複入帳）
      const lastBrawlSentRef = useRef(0);
      const fxRef = useRef({ fog: {}, boxes: [], marks: [] });
      const prevIslandDoneRef = useRef({});

      const MAX_SAFE_DIMENSION = 8500;

      // === 拖曳架橋手勢判定常數（方便微調手感） ===
      const TAP_MAX_MS = 350;   // 按下到放開 < 350ms 才算點擊
      const DRAG_HOLD_MS = 220; // 按住 220ms 不放 → 進入拖曳模式（預覽線現身）
      const TAP_MOVE_TOL = 12;  // 點擊容錯：移動 < 12px（SVG 單位）

      const cLevel = randomLevelData || { islands: [], description: "" };
      const islandsToRender = cLevel.islands || [];
      const maxGridX = islandsToRender.length > 0 ? Math.max.apply(Math, islandsToRender.map(i => i.x).concat([6])) : 6;
      const maxGridY = islandsToRender.length > 0 ? Math.max.apply(Math, islandsToRender.map(i => i.y).concat([6])) : 6;
      const gridWidth = (cLevel.width) ? cLevel.width : (maxGridX + 1);
      const gridHeight = (cLevel.height) ? cLevel.height : (maxGridY + 1);

      const SCALE = 65; const PADDING = 85; const ISLAND_RADIUS = 22;
      const svgW = (gridWidth - 1) * SCALE + PADDING * 2;
      const svgH = (gridHeight - 1) * SCALE + PADDING * 2;
      const hasSolution = cLevel.solution && cLevel.solution.length > 0;

      const getPlayerColor = (uid) => {
          const p = playersList.find(p => p.id === uid);
          return p ? p.color : COLORS[0];
      };

      const myCurrentColor = getPlayerColor(myId);
      const _mePlayer = playersList.find(p => p.id === myId);
      myNameRef.current = _mePlayer ? _mePlayer.name : "";
      myColorRef.current = myCurrentColor;

      useEffect(function() {
        if (engine !== 'peerjs' && interactionMode >= 2) {
            setInteractionMode(0);
        }
      }, [engine, interactionMode]);

      useEffect(() => { zoomLevelRef.current = zoomLevel; pz().setRaw(zoomLevel); }, [zoomLevel]);
      useEffect(() => { zoomModeIdxRef.current = zoomModeIdx; }, [zoomModeIdx]);

      // 首次進入遊戲時顯示教學導覽（localStorage 記錄）
      useEffect(function() {
        let seen = false;
        seen = platSave().getStr('hashi_tutorial_seen', '') === '1';
        if (!seen) {
            setTutorialStep(0);
            setShowTutorial(true);
        }
      }, []);

      useEffect(function() {
        stateRef.current = { bridges, randomLevelData, showSolution, startTime, levelId: currentLevelId, strokes };
        levelDimRef.current = { w: gridWidth, h: gridHeight };
      }, [bridges, randomLevelData, showSolution, startTime, currentLevelId, strokes]);

      useEffect(function() {
        if (screen !== 'game') return;
        const el = zoomContainerRef.current;
        if (!el) return;
        let touchStartY = null;

        const handleTouchStart = (e) => { if (e.touches.length === 1) { touchStartY = e.touches[0].clientY; } };
        const handleTouchMove = (e) => {
          if (interactionMode >= 2) return;

          if (e.touches.length === 2) {
            e.preventDefault();
            const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            if (lastPinchDist.current) {
              const delta = dist - lastPinchDist.current;
              let newZoom = pz().set(zoomLevelRef.current + delta * 0.005);

              if (svgW * newZoom > MAX_SAFE_DIMENSION || svgH * newZoom > MAX_SAFE_DIMENSION) {
                  newZoom = Math.min(MAX_SAFE_DIMENSION / svgW, MAX_SAFE_DIMENSION / svgH);
              }

              zoomLevelRef.current = newZoom;
              userZoomedRef.current = true;

              if (svgRef.current) {
                  svgRef.current.style.width = `${svgW * newZoom}px`;
                  svgRef.current.style.height = `${svgH * newZoom}px`;
              }

              if (zoomModeIdxRef.current !== 0) {
                  setZoomModeIdx(0);
                  zoomModeIdxRef.current = 0;
              }
            }
            lastPinchDist.current = dist;
          } else if (e.touches.length === 1 && touchStartY !== null) {
            const dy = e.touches[0].clientY - touchStartY;
            if (Math.abs(dy) > 30 && !isHeaderCollapsed) { setIsHeaderCollapsed(true); }
          }
        };
        const handleTouchEnd = () => {
            lastPinchDist.current = null;
            touchStartY = null;
            if (zoomLevel !== zoomLevelRef.current) {
                setZoomLevel(zoomLevelRef.current);
            }
        };
        const handleWheel = (e) => {
            if (interactionMode >= 2) return;
            if (Math.abs(e.deltaY) > 10 && !isHeaderCollapsed) { setIsHeaderCollapsed(true); }
            if (e.ctrlKey && zoomModeIdxRef.current !== 0) {
                 setZoomModeIdx(0);
                 zoomModeIdxRef.current = 0;
            }
        };

        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd);
        el.addEventListener('touchcancel', handleTouchEnd);
        el.addEventListener('wheel', handleWheel, { passive: true });

        return () => {
          el.removeEventListener('touchstart', handleTouchStart);
          el.removeEventListener('touchmove', handleTouchMove);
          el.removeEventListener('touchend', handleTouchEnd);
          el.removeEventListener('touchcancel', handleTouchEnd);
          el.removeEventListener('wheel', handleWheel);
        };
      }, [screen, isHeaderCollapsed, interactionMode, svgW, svgH, zoomLevel]);

      useEffect(function() {
        if (screen !== 'game') return;
        let t = null;
        const onWinResize = () => {
            if (userZoomedRef.current) return; // 使用者手動調過就不自動重算
            if (t) clearTimeout(t);
            t = setTimeout(() => { applyFitZoom(); }, 200);
        };
        window.addEventListener('resize', onWinResize);
        window.addEventListener('orientationchange', onWinResize);
        return () => {
            window.removeEventListener('resize', onWinResize);
            window.removeEventListener('orientationchange', onWinResize);
            if (t) clearTimeout(t);
        };
      }, [screen]);

      useEffect(function() {
        if (ripples.length === 0) return;
        const timer = setTimeout(() => {
            const now = Date.now();
            setRipples(prev => prev.filter(r => now - r.timestamp < 1000));
        }, 1000);
        return () => clearTimeout(timer);
      }, [ripples]);

      useEffect(function() { playersListRef.current = playersList; }, [playersList]);
      useEffect(() => { raceProgressRef.current = raceProgress; }, [raceProgress]);
      // （2026-10-18 使用者指示：準備只是打勾，不自動開賽——一律等房主按「開始」才開賽）

      // ✨ 島嶼完成粒子：偵測「未完成 → 完成」
      useEffect(function() {
        const islands = (randomLevelData && randomLevelData.islands) || [];
        if (islands.length === 0) return;
        const fresh = [];
        islands.forEach(isl => {
          const cc = islandCurrentCounts[isl.id];
          const done = !!(cc && cc.total === isl.req);
          const was = !!prevIslandDoneRef.current[isl.id];
          if (done && !was) fresh.push(isl);
          prevIslandDoneRef.current[isl.id] = done;
        });
        if (fresh.length > 0) {
          const col = myCurrentColor === 'rainbow' ? '#fbbf24' : myCurrentColor;
          const parts = fresh.map(isl => {
            const cx = isl.x * SCALE + PADDING, cy = isl.y * SCALE + PADDING;
            const arr = [];
            for (let k = 0; k < 8; k++) {
              const ang = (k / 8) * Math.PI * 2 + Math.random() * 0.6;
              const dist = 26 + Math.random() * 24;
              arr.push({ dx: Math.cos(ang) * dist, dy: Math.sin(ang) * dist });
            }
            return { id: 'b' + Date.now() + '_' + isl.id + '_' + Math.floor(Math.random() * 1000000), x: cx, y: cy, color: col, parts: arr };
          });
          setBursts(prev => [...prev, ...parts]);
          const ids = {};
          parts.forEach(p => { ids[p.id] = true; });
          setTimeout(() => { setBursts(prev => prev.filter(b => !ids[b.id])); }, 850);
        }
      }, [islandCurrentCounts]);

      // ✨ 勝利撒花
      useEffect(function() {
        if (isWon) {
          const colors = ['#4ade80', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#f97316'];
          const arr = [];
          for (let i = 0; i < 50; i++) {
            arr.push({ id: 'c' + i, left: Math.random() * 100, delay: Math.random() * 1.4, dur: 2.4 + Math.random() * 2.2, color: colors[i % colors.length], w: 6 + Math.random() * 6, h: 9 + Math.random() * 7 });
          }
          setConfetti(arr);
        } else {
          setConfetti([]);
        }
      }, [isWon]);

      // ----- 競速回座存檔（不小心跳出/重整後接續：房主 RACE_RESUME 有快照，但本地存檔更新更快、且含道具/里程碑狀態） -----
      const saveHashiResume = (bridgesArr) => {
        if (raceStateRef.current !== 'racing' && raceStateRef.current !== 'countdown') return;
        platSave().write('hashi_resume_' + myId, { startAt: raceStartAtRef.current, bridges: bridgesArr || stateRef.current.bridges || [], items: myItemsRef.current, milestones: milestonesRef.current, giftCredit: hashiGiftCreditRef.current, giftUnits: hashiGiftUnitsRef.current, ts: Date.now() });
      };
      const loadHashiResume = (startAt) => {
        try {
          // 不是同一場（startAt 不符）不准還原；形狀/TTL 與場次比對收編為 validator，不合由讀取層清除自癒
          return platSave().read('hashi_resume_' + myId, { fallback: null, validate: (p) => !!p && p.startAt === startAt && Array.isArray(p.bridges) && !!p.ts && (Date.now() - p.ts) <= 3 * 3600 * 1000 });
        } catch (e) { return null; }
      };

      // 🏁 競速進度分享：effect 版（安全網；主要推送走 raceAwareSync 內的 pushRaceProgress）
      useEffect(function() {
        pushRaceProgress(bridges);
      }, [islandCurrentCounts, raceState, randomLevelData]);

      const toastTimerRef = useRef(null);
      const showToast = (m) => { if (typeof window !== 'undefined' && window.__PLAT_TOAST) { window.__PLAT_TOAST(m); return; } setToastMsg(m); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); toastTimerRef.current = setTimeout(() => setToastMsg(""), 4000); }; // 平台內統一走殼 toast（美學稽核 V-07：三款一式）；獨立版才用本地 toast。計時器存 ref（稽核 D-06）

      const getSvgCoords = (clientX, clientY) => {
        const svg = svgRef.current;
        if (!svg) return null;
        let pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return null;
        return pt.matrixTransform(ctm.inverse());
      };

      const eraseAtPoint = (cx, cy) => {
          const offsets = [[0,0], [15,0], [-15,0], [0,15], [0,-15], [10,10], [-10,-10], [10,-10], [-10,10]];
          let hitIds = new Set();
          for (let off of offsets) {
              const els = document.elementsFromPoint(cx + off[0], cy + off[1]);
              for (let el of els) {
                  if (el.classList.contains('doodle-stroke')) {
                      const sid = el.getAttribute('data-stroke-id');
                      const strokeObj = stateRef.current.strokes.find(s => s.id === sid);
                      const strokeUid = (strokeObj && strokeObj.uid) || (strokeObj ? strokeObj.id.split('-')[1] : null);
                      if (strokeUid === myId) {
                          hitIds.add(sid);
                      }
                  }
              }
          }
          if (hitIds.size > 0) {
              const newStrokes = stateRef.current.strokes.filter(s => !hitIds.has(s.id));
              if (newStrokes.length !== stateRef.current.strokes.length) {
                  raceAwareSync({ strokes: newStrokes });
              }
          }
      };

      // === 拖曳架橋：手勢起始（時間＋距離雙條件判定） ===
      // 「同點或相近位置、快速按下放開」→ 點擊；「持續按住（長按）或移動」→ 拖曳模式
      const clearDragTimer = (dd) => {
        if (dd && dd.holdTimer) { clearTimeout(dd.holdTimer); dd.holdTimer = null; }
      };

      const startDragGesture = (e, kind, id) => {
        if (interactionMode >= 2 || !e.isPrimary || dragDrawRef.current || isWon) return;
        const pt = getSvgCoords(e.clientX, e.clientY);
        if (!pt) return;
        const dd = { kind, id, startX: pt.x, startY: pt.y, startCX: e.clientX, startCY: e.clientY, startT: Date.now(), dragging: false, targetId: null, holdTimer: null };
        dragDrawRef.current = dd;
        tapTrk().down(e.clientX, e.clientY, dd.startT);
        const pc = myCurrentColor === 'rainbow' ? '#fbbf24' : myCurrentColor;
        if (dragPreviewLineRef.current) dragPreviewLineRef.current.setAttribute('stroke', pc);
        if (dragPreviewTipRef.current) dragPreviewTipRef.current.setAttribute('fill', pc);
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
        // 長按進入拖曳：DRAG_HOLD_MS 後還按著 → 只顯示 tip 圓點在觸摸點（還沒方向，線保持隱藏）
        dd.holdTimer = setTimeout(() => {
            const cur = dragDrawRef.current;
            if (cur && cur.holdTimer === dd.holdTimer && !cur.dragging) {
                if (tapTrk().poll(Date.now()) !== 'longpress') return; // 共用判定：到時才武裝、只武裝一次（PlatTap，v1.63.0）
                cur.dragging = true;
                const tip = dragPreviewTipRef.current;
                if (tip) {
                    tip.setAttribute('cx', cur.startX); tip.setAttribute('cy', cur.startY);
                    tip.style.display = 'block';
                }
            }
        }, DRAG_HOLD_MS);
      };

      const handleIslandPointerDown = (e, island) => {
        if (interactionMode < 2) setHoveredIslandId(island.id);
        startDragGesture(e, 'island', island.id);
      };

      const handleBridgePointerDown = (e, b) => {
        startDragGesture(e, 'bridge', b.id);
      };

      // === 拖曳架橋：依拖曳方向判定目標橋樑 ===
      const resolveDragTarget = (d, dx, dy) => {
        const rlv = stateRef.current.randomLevelData;
        const islands = (rlv && rlv.islands) ? rlv.islands : [];
        const bridgesNow = stateRef.current.bridges || [];
        const islMap = {}; islands.forEach(i => { islMap[i.id] = i; });
        if (d.kind === 'island') {
          const from = islMap[d.id]; if (!from) return null;
          const fromX = from.x * SCALE + PADDING, fromY = from.y * SCALE + PADDING;
          const len = Math.hypot(dx, dy) || 1, nx = dx / len, ny = dy / len;
          let bestId = null, bestCos = 0.82; // 夾角 < ~35°
          bridgesNow.forEach(b => {
            if (b.from !== d.id && b.to !== d.id) return;
            const other = islMap[b.from === d.id ? b.to : b.from]; if (!other) return;
            let vx = (other.x * SCALE + PADDING) - fromX, vy = (other.y * SCALE + PADDING) - fromY;
            const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
            const cos = vx * nx + vy * ny;
            if (cos > bestCos) { bestCos = cos; bestId = b.id; }
          });
          return bestId;
        }
        // 從橋樑出發：拖曳以橋軸向為主才算數
        const b = bridgesNow.find(x => x.id === d.id); if (!b) return null;
        const f = islMap[b.from], t = islMap[b.to]; if (!f || !t) return null;
        const ax = t.x - f.x, ay = t.y - f.y;
        const axial = Math.abs(dx * ax + dy * ay), normal = Math.abs(dx * ay - dy * ax);
        return (axial > 0 && axial > normal * 1.5) ? d.id : null;
      };

      // === 拖曳架橋預覽線（ref 直寫 DOM，不走 React state，避免 pointermove 重渲染） ===
      const hideDragPreview = () => {
        if (dragPreviewLineRef.current) dragPreviewLineRef.current.style.display = 'none';
        if (dragPreviewTipRef.current) dragPreviewTipRef.current.style.display = 'none';
      };

      // 拖曳預覽線幾何：軸向取手指按下位置，法向取軸線位置（線「從手指開始」，貼在橋的線上）
      const islandCenter = (id) => {
        const rlv = stateRef.current.randomLevelData;
        const islands = (rlv && rlv.islands) ? rlv.islands : [];
        const isl = islands.find(i => i.id === id);
        return isl ? { x: isl.x * SCALE + PADDING, y: isl.y * SCALE + PADDING } : null;
      };
      const bridgeAxis = (id) => {
        const rlv = stateRef.current.randomLevelData;
        const islands = (rlv && rlv.islands) ? rlv.islands : [];
        const islMap = {}; islands.forEach(i => { islMap[i.id] = i; });
        const b = (stateRef.current.bridges || []).find(x => x.id === id);
        if (!b) return null;
        const f = islMap[b.from], t = islMap[b.to];
        if (!f || !t) return null;
        const fx = f.x * SCALE + PADDING, fy = f.y * SCALE + PADDING;
        const tx = t.x * SCALE + PADDING, ty = t.y * SCALE + PADDING;
        return { type: b.type, midX: (fx + tx) / 2, midY: (fy + ty) / 2 };
      };
      // 法向座標：島嶼出發 = 島中心在法向的分量；橋樑出發 = 橋中點在法向的分量
      const dragAxisNormal = (d, main) => {
        if (d.kind === 'island') {
          const c = islandCenter(d.id);
          return c ? (main === 'h' ? c.y : c.x) : null;
        }
        const ax = bridgeAxis(d.id);
        return ax ? (main === 'h' ? ax.midY : ax.midX) : null;
      };

      // 拖曳提交門檻：拉超過 max(24, 島間距×0.35) 才算數
      const dragCommitInfo = (d, dx, dy) => {
        const ax = Math.abs(dx), ay = Math.abs(dy);
        const main = ax >= ay ? 'h' : 'v';
        const len = main === 'h' ? ax : ay;
        let spacing = SCALE;
        if (d.targetId) {
          const rlv = stateRef.current.randomLevelData;
          const islands = (rlv && rlv.islands) ? rlv.islands : [];
          const islMap = {}; islands.forEach(i => { islMap[i.id] = i; });
          const b = (stateRef.current.bridges || []).find(x => x.id === d.targetId);
          if (b) {
            const f = islMap[b.from], t = islMap[b.to];
            if (f && t) spacing = Math.hypot(t.x - f.x, t.y - f.y) * SCALE;
          }
        }
        return { main, len, threshold: Math.max(24, spacing * 0.35) };
      };

      // 預覽線長度上限：有目標橋時 = 起點到拖曳方向那端島的距離，否則 120
      const dragPreviewMaxLen = (d, main, dir, sx, sy) => {
        const rlv = stateRef.current.randomLevelData;
        const islands = (rlv && rlv.islands) ? rlv.islands : [];
        const islMap = {}; islands.forEach(i => { islMap[i.id] = i; });
        if (d.targetId) {
          const b = (stateRef.current.bridges || []).find(x => x.id === d.targetId);
          if (b) {
            let targetIslandId = null;
            if (d.kind === 'island') {
              targetIslandId = (b.from === d.id) ? b.to : b.from;
            } else {
              const f = islMap[b.from], t = islMap[b.to];
              if (f && t) {
                const fx = f.x * SCALE + PADDING, fy = f.y * SCALE + PADDING;
                const tx = t.x * SCALE + PADDING, ty = t.y * SCALE + PADDING;
                const toF = main === 'h' ? (Math.sign(fx - sx) === dir) : (Math.sign(fy - sy) === dir);
                targetIslandId = toF ? b.from : b.to;
              }
            }
            const o = islMap[targetIslandId];
            if (o) {
              const ox = o.x * SCALE + PADDING, oy = o.y * SCALE + PADDING;
              return Math.max(0, Math.hypot(ox - sx, oy - sy));
            }
          }
        }
        return 120;
      };

      // 每幀更新預覽線：起點 = 手指按下點的軸向座標 × 軸線的法向座標（從手指開始、貼在橋線上）
      const updateDragPreview = (d, dx, dy) => {
        const line = dragPreviewLineRef.current, tip = dragPreviewTipRef.current;
        if (!line || !tip) return;
        const info = dragCommitInfo(d, dx, dy);
        const main = info.main;
        const fixed = dragAxisNormal(d, main);
        if (fixed === null) return;
        const sx = main === 'h' ? d.startX : fixed;
        const sy = main === 'h' ? fixed : d.startY;
        const dir = main === 'h' ? (Math.sign(dx) || 1) : (Math.sign(dy) || 1);
        const maxLen = dragPreviewMaxLen(d, main, dir, sx, sy);
        const cl = Math.min(info.len, maxLen);
        const ex = main === 'h' ? sx + dir * cl : sx;
        const ey = main === 'v' ? sy + dir * cl : sy;
        line.setAttribute('x1', sx); line.setAttribute('y1', sy);
        line.setAttribute('x2', ex); line.setAttribute('y2', ey);
        tip.setAttribute('cx', ex); tip.setAttribute('cy', ey);
        line.style.display = 'block'; tip.style.display = 'block';
      };

      const handlePointerDown = (e) => {
        // 雙指介入：取消拖曳架橋與空白捲動，讓 pinch 縮放接管
        if (e.isPrimary === false) {
            if (dragDrawRef.current) { clearDragTimer(dragDrawRef.current); dragDrawRef.current = null; hideDragPreview(); tapTrk().cancel(); }
            panRef.current = null;
            if (interactionMode < 2) { setHoveredIslandId(null); setHoveredBridgeId(null); }
        }
        if (interactionMode < 2 && e.target.tagName && e.target.tagName.toLowerCase() === 'svg') {
            setHoveredIslandId(null);
            setHoveredBridgeId(null);
            // 空白處單指按下 → 手動捲動（svg 已是 touch-action:none，瀏覽器不會代勞捲動）
            if (e.isPrimary && !dragDrawRef.current && !panRef.current) {
                panRef.current = { lastX: e.clientX, lastY: e.clientY };
            }
        }

        const pt = getSvgCoords(e.clientX, e.clientY);
        if (!pt) return;

        if (interactionMode === 2) {
            e.target.setPointerCapture(e.pointerId);
            if (drawSubMode === 'pen') {
                isDrawingRef.current = true;
                currentPathDataRef.current = `M ${pt.x} ${pt.y}`;
                if (drawingPathRef.current) {
                    drawingPathRef.current.setAttribute('d', currentPathDataRef.current);
                    drawingPathRef.current.style.display = 'block';
                }
            } else if (drawSubMode === 'eraser') {
                eraseAtPoint(e.clientX, e.clientY);
            }
            return;
        }

        if (engineRef.current !== 'peerjs' || !showOtherCursors) return;
        if (raceStateRef.current === 'racing' || raceStateRef.current === 'countdown') return; // 🏁 競速中停用游標分享（防作弊）
        const msg = { type: 'CLICK', uid: myId, x: pt.x, y: pt.y };
        setRipples(prev => [...prev, { id: Date.now() + Math.random(), uid: myId, x: pt.x, y: pt.y, timestamp: Date.now() }]);

        if (isHostRef.current) {
            connsRef.current.forEach(c => c.send(msg));
        } else if (connRef.current) {
            connRef.current.send(msg);
        }
      };

      const handlePointerMove = (e) => {
        // 拖曳架橋：方向判定 + 預覽線跟隨 + 即時高亮
        if (dragDrawRef.current && interactionMode < 2) {
            const dd = dragDrawRef.current;
            const pressed = (e.buttons > 0) || (e.pointerType === 'touch' && e.isPrimary);
            if (!pressed) {
                clearDragTimer(dd);
                dragDrawRef.current = null;
                hideDragPreview();
                tapTrk().cancel();
                setHoveredBridgeId(null);
            } else {
                const pt = getSvgCoords(e.clientX, e.clientY);
                if (pt) {
                    const dx = pt.x - dd.startX, dy = pt.y - dd.startY;
                    if (!dd.dragging && Math.hypot(dx, dy) > TAP_MOVE_TOL) {
                        clearDragTimer(dd);
                        dd.dragging = true;
                        // 預覽線起點改為每幀投影（updateDragPreview 內計算），不再快照島中心/橋中點
                    }
                    if (dd.dragging) {
                        const t = resolveDragTarget(dd, dx, dy);
                        if (t !== dd.targetId) {
                            const wasNull = !dd.targetId;
                            dd.targetId = t;
                            setHoveredBridgeId(t);
                            // 目標出現時輕 tick 一聲，加 150ms 遲滯避免抖動連播
                            if (t && wasNull && Date.now() - (dd.lastTick || 0) > 150) {
                                dd.lastTick = Date.now();
                            }
                        }
                        updateDragPreview(dd, dx, dy);
                    }
                }
            }
        }
        // 空白處單指拖曳 → 手動捲動棋盤（svg 為 touch-action:none 時的替代捲動）
        else if (panRef.current && interactionMode < 2 && e.isPrimary) {
            const pan = panRef.current;
            const zc = zoomContainerRef.current;
            if (zc && ((e.buttons > 0) || e.pointerType === 'touch')) {
                zc.scrollLeft -= (e.clientX - pan.lastX);
                zc.scrollTop -= (e.clientY - pan.lastY);
                pan.lastX = e.clientX; pan.lastY = e.clientY;
            }
        }
        if (interactionMode === 2) {
            const pt = getSvgCoords(e.clientX, e.clientY);
            if (drawSubMode === 'eraser') {
                if (pt && eraserRef.current) {
                    eraserRef.current.setAttribute('cx', pt.x);
                    eraserRef.current.setAttribute('cy', pt.y);
                    if (eraserRef.current.style.display === 'none') {
                        eraserRef.current.style.display = 'block';
                    }
                }
                if (e.buttons > 0 || e.pointerType === 'touch') {
                    if (Date.now() - lastEraseTimeRef.current > 50) {
                        eraseAtPoint(e.clientX, e.clientY);
                        lastEraseTimeRef.current = Date.now();
                    }
                }
            } else if (drawSubMode === 'pen' && isDrawingRef.current) {
                if (pt && currentPathDataRef.current) {
                    currentPathDataRef.current += ` L ${pt.x} ${pt.y}`;
                    if (drawingPathRef.current) {
                        drawingPathRef.current.setAttribute('d', currentPathDataRef.current);
                    }
                }
            }
            return;
        }

        if (engineRef.current !== 'peerjs' || !showOtherCursors) return;
        if (raceStateRef.current === 'racing' || raceStateRef.current === 'countdown') return; // 🏁 競速中停用游標分享（防作弊）
        if (Date.now() - lastCursorSend.current < 50) return;
        lastCursorSend.current = Date.now();
        const pt = getSvgCoords(e.clientX, e.clientY);
        if (pt) {
            const msg = { type: 'CURSOR', uid: myId, x: pt.x, y: pt.y };
            if (isHostRef.current) {
                connsRef.current.forEach(c => c.send(msg));
            } else if (connRef.current) {
                connRef.current.send(msg);
            }
        }
      };

      const handlePointerUp = (e) => {
        // 只處理真正的放開與取消；svg 的 onPointerLeave 不再經由這裡結算拖曳，
        // 避免邊界事件（特別是 iOS 上 pointer capture 相關的）誤殺進行中的手勢
        if (e.type !== 'pointerup' && e.type !== 'pointercancel') return;
        panRef.current = null;
        // 拖曳架橋手勢結算（pointercancel 只清空、不結算）
        const dd = dragDrawRef.current;
        if (dd) {
            clearDragTimer(dd);
            dragDrawRef.current = null;
            hideDragPreview();
            if (e.type !== 'pointercancel' && interactionMode < 2 && !isWon) {
                const pt = getSvgCoords(e.clientX, e.clientY);
                const dx = pt ? pt.x - dd.startX : 0, dy = pt ? pt.y - dd.startY : 0;
                // 判定收編 PlatTap（v1.63.0）：tap＝未武裝＋TAP_MAX_MS 內＋client 漂移 ≤22（v1.56.0 F1 守恆）；拖曳結算的武裝有兩路——hold DRAG_HOLD_MS（poll 旗標）或移動超過 TAP_MOVE_TOL（move 處理器設 dd.dragging、預覽線即由此顯示）——結算必須兩路都認，否則快拖看得到預覽卻永遠不成橋（v1.65.1 修：v1.63.0 結算只認 longpress 旗標，快拖被歸入「未武裝取消」）；成橋與否仍由 dragCommitInfo 門檻決定
                const res = tapTrk().up(e.clientX, e.clientY, Date.now());
                if (res.type === 'tap') {
                    // 點擊：快速按下放開（有容錯）→ 只有橋樑能點，島嶼不做事
                    if (dd.kind === 'bridge') handleBridgeClick(dd.id);
                } else if ((res.longpress || dd.dragging) && dd.targetId) {
                    // 拖曳：有目標且拉超過門檻才真正架橋
                    const info = dragCommitInfo(dd, dx, dy);
                    if (info.len > info.threshold) handleBridgeClick(dd.targetId);
                }
                // 其餘狀況（按住超時未動、拖曳未達門檻、快滑未武裝）→ 取消，什麼都不做
            } else {
                tapTrk().cancel(); // pointercancel/已完賽等：只清 tracker 本次狀態，不污染下一次 down 基準
            }
            if (interactionMode < 2) { setHoveredIslandId(null); setHoveredBridgeId(null); }
        }
        if (interactionMode === 2) {
            if (drawSubMode === 'pen' && isDrawingRef.current) {
                isDrawingRef.current = false;
                if (e.type === 'pointercancel') { currentPathDataRef.current = ""; if (drawingPathRef.current) drawingPathRef.current.style.display = 'none'; } // pointercancel 比照架橋手勢：作廢不結算，不可把半截筆觸送出（稽核修）
                else if (currentPathDataRef.current) {
                    const newStrokes = [...stateRef.current.strokes, { id: Date.now() + '-' + myId, uid: myId, path: currentPathDataRef.current }];
                    raceAwareSync({ strokes: newStrokes });
                    currentPathDataRef.current = "";
                    if (drawingPathRef.current) drawingPathRef.current.style.display = 'none';
                }
            }
            if (e.type === 'pointerleave' || e.type === 'pointercancel' || e.pointerType === 'touch') {
                 if (eraserRef.current) eraserRef.current.style.display = 'none';
            }
        }
      };

      const clearOwnStrokes = () => {
          const newStrokes = stateRef.current.strokes.filter(s => !s.id.endsWith('-' + myId));
          raceAwareSync({ strokes: newStrokes });
          showToast("🗑️ 已清除你所有的塗鴉");
      };

      const clearAllStrokes = () => {
          if (isHostRef.current) {
              raceAwareSync({ strokes: [] });
              showToast("🚨 房主已清空全場塗鴉");
          }
      };

      const purgeGhostPlayers = () => {
        if (!isHostRef.current) return;
        setPlayersList(prev => {
          const hostPlayer = prev.find(p => p.id === myId);
          if (!hostPlayer) return prev;
          const newList = [hostPlayer];

          if (engineRef.current === 'peerjs') {
            connsRef.current = connsRef.current.filter(c => c.open);
            connsRef.current.forEach(c => c.send({ type: 'PLAYERS_UPDATE', players: newList }));
            connsRef.current.forEach(c => c.send({ type: 'REQ_REJOIN' }));
          }
          return newList;
        });
      };

      const syncState = (partial, shouldBroadcast = true) => {
        if (partial.bridges !== undefined) setBridges(partial.bridges);
        if (partial.showSolution !== undefined) setShowSolution(partial.showSolution);
        if (partial.randomLevelData !== undefined) setRandomLevelData(partial.randomLevelData);
        if (partial.startTime !== undefined) setStartTime(partial.startTime);
        if (partial.levelId !== undefined) setCurrentLevelId(partial.levelId);
        if (partial.strokes !== undefined) setStrokes(partial.strokes);

        const updatedState = { ...stateRef.current, ...partial };
        stateRef.current = updatedState;

        if (shouldBroadcast) {
            if (engineRef.current === 'peerjs') {
              if (isHostRef.current) {
                 connsRef.current.forEach(c => c.send({ type: 'SYNC', data: updatedState }));
              } else if (connRef.current) {
                 connRef.current.send({ type: 'SYNC', data: updatedState });
              }
            }
        }
      };

      // ⚔️ 大亂鬥道具系統
      const BRAWL_ITEMS = [
        { key: 'bomb', icon: '💣', name: '炸橋', w: 3 },
        { key: 'fog', icon: '🌫️', name: '迷霧', w: 2 },
        { key: 'gift', icon: '🎁', name: '禮物', w: 2 }
      ];
      // 道具列固定順序：禮物放正中間（使用者定案）
      const BRAWL_BAR_ORDER = ['bomb', 'gift', 'fog'];
      const applyBrawlSettings = (settings, broadcast) => {
        if (!settings) return;
        brawlSettingsRef.current = settings;
        setBrawlSettings(settings);
        stateRef.current = { ...stateRef.current, brawlSettings: settings };
        if (broadcast && isHostRef.current) {
          connsRef.current.forEach(c => { if (c.open) c.send({ type: 'BRAWL_SETTINGS', settings: settings }); });
        }
      };
      const sendBrawlMsg = (msg) => {
        try {
          if (isHostRef.current) { connsRef.current.forEach(c => { if (c.open) c.send(msg); }); }
          else if (connRef.current && connRef.current.open) { connRef.current.send(msg); }
        } catch (e) {}
      };
      const pickRandomItem = () => {
        // 里程碑道具種類：炸橋／迷霧各半（使用者定案）——禮物不走里程碑彩券，禮物只由「完成總島數每 1/20」的島嶼系統發放
        const pool = BRAWL_ITEMS.filter(x => x.key === 'bomb' || x.key === 'fog');
        return pool[Math.floor(Math.random() * pool.length)];
      };
      // 道具機率公式（使用者定案，兩款同形、保底統一 0.1）：禮物權重 = (1 − p)² + 保底（平方扶弱）；
      // 陷阱：先取 1 − p 再套同一個禮物公式 → 權重 = (1 − (1 − p))² + 保底 = p² + 保底（越強越容易被打，分布明顯拉開）。
      // 抽選在候選集合內正規化；完賽者本來就被排除在候選之外（100% 即退出計算）。
      const platProgWeights = (progs, mode, floor) => {
        const f = (floor == null ? 0.1 : floor);
        if (mode === 'attack') return progs.map(x => { const q = Math.min(1, Math.max(0, x || 0)); return q * q + f; });
        return progs.map(x => { const d = 1 - Math.min(1, Math.max(0, x || 0)); return d * d + f; });
      };
      const platPickWeighted = (items, ws) => {
        const T = ws.reduce((a, b) => a + b, 0);
        if (!(T > 0) || !items.length) return items[Math.floor(Math.random() * items.length)];
        let r = Math.random() * T;
        for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
        return items[items.length - 1];
      };
      // 里程碑發放（房主執行，比照數獨）：抽一件道具，再依進度比例公式抽一位收件人
      const handleBrawlMilestone = (m) => {
        if (!isHostRef.current) return;
        if (!brawlSettingsRef.current.itemsEnabled) return;
        const key = m.uid + '@' + m.threshold;
        if (hostMilestonesRef.current[key]) return;
        hostMilestonesRef.current[key] = true;
        const racerIds = racersRef.current || [];
        const cands = playersListRef.current.filter(pl => pl.id && !raceResultsRef.current[pl.id] && !(pl.id === myId && myFinishTimeRef.current != null) && (racerIds.length === 0 || racerIds.indexOf(pl.id) >= 0));
        if (!cands.length) return;
        const item = cands.length === 1 ? BRAWL_ITEMS.find(x => x.key === 'gift') : pickRandomItem(); // 只剩最後一位：沒有對手可打，里程碑只發禮物加速他完賽（使用者定案）
        const progs = cands.map(pl => { const info = raceProgressRef.current[pl.id]; return info ? info.progress : 0; });
        const sel = platPickWeighted(cands, platProgWeights(progs, 'grant'));
        const grant = { type: 'BRAWL_GRANT', toUid: sel.id, item: item.key, fromUid: m.uid };
        sendBrawlMsg(grant);
        if (sel.id === myId) applyBrawlGrant(grant);
      };
      // 最後一位規則（使用者定案）：只剩我一人在場上（其他選手皆完賽或 DNF）時，攻擊道具沒有對手可用——
      // 手邊庫存全轉禮物、之後收到的也直接轉禮物、房主發放也只發禮物，讓最後一位加速完賽，其他人不用乾等。
      const lastOneRef = useRef(false);
      const amLastRacer = () => {
        if (raceStateRef.current !== 'racing' || myFinishTimeRef.current != null) return false;
        const racers = racersRef.current || [];
        if (racers.length < 2 || racers.indexOf(myId) < 0) return false;
        return racers.every(uid => uid === myId || raceResultsRef.current[uid]);
      };
      const maybeConvertLastOne = () => {
        if (lastOneRef.current || !amLastRacer()) return;
        lastOneRef.current = true;
        const cur = myItemsRef.current;
        const conv = cur.filter(x => x !== 'gift').length;
        if (conv > 0) {
          const ni = cur.map(() => 'gift');
          myItemsRef.current = ni; setMyItems(ni);
          showToast('🏁 只剩你一人！手邊 ' + conv + ' 個攻擊道具全部轉換成 🎁 禮物，加速完賽！');
          if (ni.length >= 3) setTimeout(() => autoFireBrawlItem('gift'), 650); // 禮物湊滿 3 個照舊自動連發（同規則一致）
        } else {
          showToast('🏁 只剩你一人！接下來的里程碑道具都會是 🎁 禮物');
        }
      };
      const applyBrawlGrant = (m) => {
        if (!m || m.toUid !== myId) return;
        if (!BRAWL_ITEMS.find(x => x.key === m.item)) return;
        if (myFinishTimeRef.current != null) return; // 已完賽不再獲得道具（盤面凍結）
        const effItem = (m.item !== 'gift' && amLastRacer()) ? 'gift' : m.item; // 已是最後一位：還在飛的攻擊道具入包時直接轉禮物
        const meta = BRAWL_ITEMS.find(x => x.key === effItem);
        if (myItemsRef.current.filter(x => x === effItem).length >= 3) return; // 已有 3 個且自動發動排程中（理論上不會發生），多的不收
        const ni = myItemsRef.current.concat([effItem]);
        myItemsRef.current = ni; setMyItems(ni);
        if (effItem === 'gift' && m.fromUid && m.fromUid !== myId) { try { if (window.PlatFly) PlatFly.fly(PlatFly.byUid('hashi', m.fromUid), PlatFly.me('hashi') || PlatFly.byUid('hashi', myId), '🎁'); } catch (e) {} } // H3 禮物 Fly（純顯示層）
        showToast('🎁 里程碑道具：你獲得 ' + meta.icon + ' ' + meta.name + '！');
        if (ni.filter(x => x === effItem).length >= 3) setTimeout(() => autoFireBrawlItem(effItem), 650); // 集滿 3 個 → 自動連續發動並歸零（禮物也同規，使用者定案）
      };
      // 短暫特效標記（💥炸橋／✨禮物補橋）：出現在盤面座標上、動畫播完自動消失，不進同步
      const pushFxMark = (gx, gy, icon, ms) => {
        const mk = { id: 'mk' + Date.now() + '-' + Math.floor(Math.random() * 100000), gx: gx, gy: gy, icon: icon, until: Date.now() + (ms || 800) };
        const nm = (fxRef.current.marks || []).concat([mk]);
        fxRef.current.marks = nm; setFxMarks(nm);
      };
      const applyGift = () => {
        const rld = stateRef.current.randomLevelData;
        const sol = (rld && rld.solution) || [];
        const mine = stateRef.current.bridges || [];
        const islMap = {}; ((rld && rld.islands) || []).forEach(i => { islMap[i.id] = i; });
        const segCross = (a, b) => {
          const af = islMap[a.from], at = islMap[a.to], bf = islMap[b.from], bt = islMap[b.to];
          if (!af || !at || !bf || !bt) return false;
          const aH = af.y === at.y, bH = bf.y === bt.y;
          if (aH === bH) return false;
          const hp = aH ? [af, at] : [bf, bt]; const vp = aH ? [bf, bt] : [af, at];
          const hx1 = Math.min(hp[0].x, hp[1].x), hx2 = Math.max(hp[0].x, hp[1].x);
          const vy1 = Math.min(vp[0].y, vp[1].y), vy2 = Math.max(vp[0].y, vp[1].y);
          return vp[0].x > hx1 && vp[0].x < hx2 && hp[0].y > vy1 && hp[0].y < vy2;
        };
        const samePair = (x, y) => (x.from === y.from && x.to === y.to) || (x.from === y.to && x.to === y.from);
        const cands = sol.filter(solB => {
          const cur = mine.find(b => samePair(b, solB));
          if (!cur || cur.locked) return false; // 禮物補過的橋已鎖定，不重複補
          if (cur.count >= solB.count) return false; // 實線已補滿
          if ((cur.count + (cur.draftCount || 0)) > solB.count) return false; // 草稿太多（總量超過解答量）先不補，避免衝破上限 2
          return !mine.some(b => (b.count + (b.draftCount || 0)) > 0 && !samePair(b, solB) && segCross(solB, b)); // 交叉阻擋也要算草稿橋，否則補出的實線會跨過既有草稿
        });
        if (!cands.length) { showToast('🎁 目前沒有能補上的正確橋'); return false; }
        const pickB = cands[Math.floor(Math.random() * cands.length)];
        // 禮物：直接把這對島的正確橋補滿（解答是雙橋就補兩條），草稿一併轉實線，並標 locked 鎖定——之後點按/拖曳/炸橋都不能改它
        const nb = mine.map(b => samePair(b, pickB) ? { ...b, count: pickB.count, draftCount: 0, owner: myId, locked: true } : b);
        raceAwareSync({ bridges: nb });
        const gf = islMap[pickB.from], gt = islMap[pickB.to];
        if (gf && gt) pushFxMark((gf.x + gt.x) / 2, (gf.y + gt.y) / 2, '✨', 900); // 補橋處閃光動畫（不閃現）
        showToast('🎁 禮物幫你把一對島的正確橋補滿並鎖定了！');
        try { platAudio().play('gift'); } catch (e) {}
        return true;
      };
      const applyBrawlItem = (m) => {
        if (!m || m.targetUid !== myId) return;
        // 完賽凍結（比照數獨 isSpectator 守衛）：已完賽者的盤面不再受任何道具影響
        if (myFinishTimeRef.current != null) { showToast('🏁 你已完賽，盤面凍結，' + (m.fromName || '對手') + ' 的道具對你無效！'); return; }
        const now = Date.now();
        if (m.item === 'bomb') {
          const cur = (stateRef.current.bridges || []).filter(b => b.count > 0 && !b.locked); // 禮物鎖定的橋炸不掉
          if (!cur.length) { showToast('💣 ' + (m.fromName || '對手') + ' 想炸你的橋，但你還沒架橋！'); return; }
          const victim = cur[Math.floor(Math.random() * cur.length)];
          const nb = stateRef.current.bridges.map(b => b.id === victim.id ? { ...b, count: b.count - 1, owner: (b.count - 1 > 0 || (b.draftCount || 0) > 0) ? b.owner : null } : b);
          raceAwareSync({ bridges: nb });
          const islMapB = {}; ((stateRef.current.randomLevelData || {}).islands || []).forEach(i => { islMapB[i.id] = i; });
          const bf = islMapB[victim.from], bt = islMapB[victim.to];
          if (bf && bt) pushFxMark((bf.x + bt.x) / 2, (bf.y + bt.y) / 2, '💥', 750); // 爆炸動畫蓋在被炸的橋上（不閃現消失）
          showToast('💣 ' + (m.fromName || '對手') + ' 炸掉了你一條橋！');
        } else if (m.item === 'fog') {
          const isls = (stateRef.current.randomLevelData || {}).islands || [];
          if (!isls.length) return;
          const c = isls[Math.floor(Math.random() * isls.length)];
          const fog = { ...fxRef.current.fog };
          const hit = [];
          isls.forEach(i => { if (Math.abs(i.x - c.x) <= 2 && Math.abs(i.y - c.y) <= 2) { fog[i.id] = now + 10000; hit.push(i); } });
          fxRef.current.fog = fog; setFxFog(fog);
          if (hit.length) {
            // 雲霧（使用者定案：不要方框虛化，要一團團的雲）：命中當下一次算好雲團幾何（中心／半徑／puff 配置），渲染只負責畫
            const box = { id: 'fog' + now + '-' + Math.floor(Math.random() * 100000), minX: Math.min.apply(null, hit.map(i => i.x)), minY: Math.min.apply(null, hit.map(i => i.y)), maxX: Math.max.apply(null, hit.map(i => i.x)), maxY: Math.max.apply(null, hit.map(i => i.y)), until: now + 10000 };
            const ccx0 = (box.minX + box.maxX) / 2 * SCALE + PADDING, ccy0 = (box.minY + box.maxY) / 2 * SCALE + PADDING;
            const natR = Math.sqrt(Math.pow((box.maxX - box.minX) * SCALE / 2, 2) + Math.pow((box.maxY - box.minY) * SCALE / 2, 2)) + ISLAND_RADIUS + 16;
            const capR = Math.sqrt(svgW * svgH * 0.2 / Math.PI); // 上限：雲團外接圓面積 ≤ 盤面面積的 1/5（使用者定案）
            box.R = Math.max(60, Math.min(natR, capR));
            box.cx = svgW >= box.R * 2 ? Math.min(Math.max(ccx0, box.R), svgW - box.R) : svgW / 2; // 中心夾回盤內，雲不飄出界
            box.cy = svgH >= box.R * 2 ? Math.min(Math.max(ccy0, box.R), svgH - box.R) : svgH / 2;
            let seed = (now % 2147483646) + 1;
            const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
            const puffTpl = [[0, 0, 0.60], [-0.38, 0.17, 0.46], [0.40, 0.15, 0.44], [-0.30, -0.28, 0.40], [0.06, -0.40, 0.48], [0.40, -0.24, 0.37], [-0.60, 0.03, 0.33], [0.62, 0.05, 0.32]];
            box.puffs = puffTpl.map(t => ({ x: box.cx + (t[0] + (rnd() - 0.5) * 0.06) * box.R, y: box.cy + (t[1] + (rnd() - 0.5) * 0.06) * box.R, r: t[2] * box.R * (0.92 + rnd() * 0.16) })); // 抖動收緊：任一 puff 的外緣都留在 R 內，上限才守得住
            const nbx = (fxRef.current.boxes || []).concat([box]);
            fxRef.current.boxes = nbx; setFxFogBoxes(nbx);
          }
          showToast('🌫️ ' + (m.fromName || '對手') + ' 放出一團雲霧罩住了你的一區，連橋都看不到了！');
        }
      };
      // 發動一次道具效果（不扣背包）：禮物用在自己、攻擊型自動打進度最高的未完賽對手；回傳是否真的發動
      const launchBrawlEffect = (key) => {
        const meta = BRAWL_ITEMS.find(x => x.key === key);
        if (!meta) return false;
        if (key === 'gift') return applyGift();
        // 攻擊目標：進度比例公式抽選（P(打 i) = p_i/Σp_候選）——越領先越容易中，但不是只有最強的會中
        const foes = playersListRef.current.filter(p => {
          if (p.id === myId) return false;
          if (raceResultsRef.current[p.id]) return false; // 已完賽者盤面凍結，不可攻擊
          if ((racersRef.current || []).length && racersRef.current.indexOf(p.id) < 0) return false; // 觀戰者不在場上
          return true;
        });
        if (!foes.length) return false;
        const foeProgs = foes.map(p => { const info = raceProgress[p.id]; return info ? info.progress : 0; });
        const sel = platPickWeighted(foes, platProgWeights(foeProgs, 'attack'));
        sendBrawlMsg({ type: 'BRAWL_ITEM', item: key, fromUid: myId, fromName: (myNameRef.current || '對手'), targetUid: sel.id });
        showToast(meta.icon + ' 已對 ' + (sel.name || '對手') + ' 使用 ' + meta.name + '！');
        return true;
      };
      const useBrawlItem = (key) => {
        if (raceStateRef.current !== 'racing') return;
        if (myFinishTimeRef.current != null) { showToast('🏁 你已完賽，不能再使用道具'); return; }
        const idx = myItemsRef.current.indexOf(key);
        if (idx < 0) return;
        if (!launchBrawlEffect(key)) { if (key !== 'gift') showToast('⚠️ 沒有對手可以攻擊'); return; } // 發動失敗不消耗（禮物無可補時 applyGift 已自己提示）
        const ni = myItemsRef.current.slice(); ni.splice(idx, 1);
        myItemsRef.current = ni; setMyItems(ni);
      };
      // 集滿 3 個同種道具 → 自動連續發動 3 次並歸零（使用者定案：防囤積到最後一次逆轉；未滿 3 仍可手動用）
      const autoFireBrawlItem = (key) => {
        if (brawlAutoRef.current[key]) return;
        if (myItemsRef.current.filter(x => x === key).length < 3) return;
        brawlAutoRef.current[key] = true;
        let removed = 0; const ni = [];
        myItemsRef.current.forEach(x => { if (x === key && removed < 3) removed++; else ni.push(x); });
        myItemsRef.current = ni; setMyItems(ni); // 先歸零，效果再逐發送出——期間新獲得的同種從 0 重新累積
        const meta = BRAWL_ITEMS.find(x => x.key === key);
        showToast('🎒 集滿 3 個 ' + (meta ? meta.icon + ' ' + meta.name : key) + '，自動連續發動！');
        let fired = 0;
        const step = () => {
          if (fired >= 3) { brawlAutoRef.current[key] = false; return; }
          fired++;
          if (raceStateRef.current === 'racing' && myFinishTimeRef.current == null) launchBrawlEffect(key); // 每發重選目標／重算可補的橋；無目標或無可補時該發落空
          setTimeout(step, 550);
        };
        setTimeout(step, 400);
      };
      // 👁️ 上帝視角盤面（唯讀）：modal 與觀戰面板共用；島數字受「上帝視角顯示數字」設定
      const renderGodBoard = (board) => {
        if (!board || !randomLevelData) return null;
        const isls = randomLevelData.islands || [];
        if (!isls.length) return null;
        const islMap = {}; isls.forEach(i => { islMap[i.id] = i; });
        const counts = {}; isls.forEach(i => { counts[i.id] = 0; });
        (board.bridges || []).forEach(b => { if (counts[b.from] !== undefined) counts[b.from] += b.count; if (counts[b.to] !== undefined) counts[b.to] += b.count; });
        const maxGX = Math.max.apply(Math, isls.map(i => i.x).concat([6]));
        const maxGY = Math.max.apply(Math, isls.map(i => i.y).concat([6]));
        const gw = (maxGX + 1) * SCALE + PADDING * 2;
        const gh = (maxGY + 1) * SCALE + PADDING * 2;
        return (
          <svg viewBox={`0 0 ${gw} ${gh}`} className="w-full h-auto bg-[#f6fdf6] rounded-xl border-2 border-slate-200">
            {(board.bridges || []).map(b => {
              const f = islMap[b.from], t = islMap[b.to];
              if (!f || !t || (b.count === 0 && !(b.draftCount > 0))) return null;
              const x1 = f.x * SCALE + PADDING, y1 = f.y * SCALE + PADDING, x2 = t.x * SCALE + PADDING, y2 = t.y * SCALE + PADDING;
              const horiz = f.y === t.y;
              const off = 4;
              const lines = [];
              if (b.count >= 1) {
                if (b.count === 2) {
                  lines.push(<line key={b.id + '-a'} x1={x1 + (horiz ? 0 : -off)} y1={y1 + (horiz ? -off : 0)} x2={x2 + (horiz ? 0 : -off)} y2={y2 + (horiz ? -off : 0)} stroke={b.locked ? '#000000' : '#1e293b'} strokeWidth="4" strokeLinecap="round" />);
                  lines.push(<line key={b.id + '-b'} x1={x1 + (horiz ? 0 : off)} y1={y1 + (horiz ? off : 0)} x2={x2 + (horiz ? 0 : off)} y2={y2 + (horiz ? off : 0)} stroke={b.locked ? '#000000' : '#1e293b'} strokeWidth="4" strokeLinecap="round" />);
                } else {
                  lines.push(<line key={b.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke={b.locked ? '#000000' : '#1e293b'} strokeWidth="4" strokeLinecap="round" />);
                }
              } else if (b.draftCount > 0) {
                lines.push(<line key={b.id + '-d'} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="4" strokeDasharray="6 5" strokeLinecap="round" />);
              }
              return <g key={'gb-' + b.id}>{lines}</g>;
            })}
            {isls.map(i => {
              const cx = i.x * SCALE + PADDING, cy = i.y * SCALE + PADDING;
              const done = counts[i.id] === i.req, over = counts[i.id] > i.req;
              return (
                <g key={'gi-' + i.id}>
                  <circle cx={cx} cy={cy} r={ISLAND_RADIUS} fill={done ? '#d1fae5' : (over ? '#fee2e2' : '#ffffff')} stroke={done ? '#059669' : (over ? '#dc2626' : '#1e293b')} strokeWidth="4" />
                  <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="central" className="text-xl font-black font-sans" fill="#1e293b">{brawlSettings.godNumbers ? i.req : '?'}</text>
                </g>
              );
            })}
          </svg>
        );
      };
      const renderGodModal = () => {
        if (!godViewUid) return null;
        const board = brawlBoards[godViewUid];
        if (!board || !randomLevelData) return null;
        const opps = Object.keys(brawlBoards);
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setGodViewUid(null)}>
            <div className="bg-white rounded-2xl border-[4px] border-[#1e293b] shadow-[10px_10px_0px_#1e293b] p-4 w-full max-w-[430px] max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-base md:text-lg text-[#1e293b]">👁️ 上帝視角 — {board.name}（{Math.round((board.progress || 0) * 100)}%）</h3>
                <button onClick={() => setGodViewUid(null)} className="w-8 h-8 shrink-0 bg-white border-2 border-slate-800 rounded-lg font-black shadow-[2px_2px_0px_rgba(30,41,59,1)]">✕</button>
              </div>
              {opps.length > 1 && (
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {opps.map(u => (
                    <button key={u} onClick={() => setGodViewUid(u)} className={"px-2.5 py-1 rounded-lg border-2 border-slate-800 font-black text-xs " + (u === godViewUid ? "bg-slate-800 text-white" : "bg-white text-slate-700")}>{brawlBoards[u].name}</button>
                  ))}
                </div>
              )}
              {renderGodBoard(board)}
              <p className="text-[11px] font-bold text-slate-400 mt-2 text-center">即時同步對手盤面（唯讀）・點外面或 ✕ 關閉</p>
            </div>
          </div>
        );
      };
      // 特效計時：到期自動清除（雲霧的淡出靠 fxNow 每 500ms 推進＋CSS transition 補間）
      useEffect(() => {
        const hasFx = Object.keys(fxFog).length > 0 || fxFogBoxes.length > 0 || fxMarks.length > 0;
        if (!hasFx) return;
        const iv = setInterval(() => {
          const now = Date.now(); setFxNow(now);
          const prune = (obj) => { const n = {}; let changed = false; Object.keys(obj).forEach(k => { if (obj[k] > now) n[k] = obj[k]; else changed = true; }); return changed ? n : obj; };
          const nf = prune(fxRef.current.fog); if (nf !== fxRef.current.fog) { fxRef.current.fog = nf; setFxFog(nf); }
          const nb = (fxRef.current.boxes || []).filter(b => b.until > now); if (nb.length !== (fxRef.current.boxes || []).length) { fxRef.current.boxes = nb; setFxFogBoxes(nb); }
          const nm = (fxRef.current.marks || []).filter(mk => mk.until > now); if (nm.length !== (fxRef.current.marks || []).length) { fxRef.current.marks = nm; setFxMarks(nm); }
        }, 500);
        return () => clearInterval(iv);
      }, [fxFog, fxFogBoxes, fxMarks]);

      // 🏁 競速進度推送：用最新的 bridges 直接計算並廣播（架橋當下同步呼叫，不依賴 effect 時序）
      const pushRaceProgress = (bridgesArr) => {
        if (raceStateRef.current !== 'racing') return;
        const rld = (stateRef.current && stateRef.current.randomLevelData) || randomLevelData;
        const islands = (rld && rld.islands) || [];
        if (islands.length === 0) return;
        const counts = {};
        islands.forEach(i => { counts[i.id] = 0; });
        (bridgesArr || []).forEach(b => {
          const t = (b.count || 0) + (b.draftCount || 0);
          if (counts[b.from] !== undefined) counts[b.from] += t;
          if (counts[b.to] !== undefined) counts[b.to] += t;
        });
        let done = 0;
        islands.forEach(isl => { if (counts[isl.id] === isl.req) done++; });
        const p = done / islands.length;
        if (brawlSettingsRef.current.itemsEnabled) {
          for (let t = 5; t <= 100; t += 5) { if (p * 100 >= t && !milestonesRef.current[t]) { milestonesRef.current[t] = true; const mm = { type: 'BRAWL_MILESTONE', uid: myId, threshold: t }; if (isHostRef.current) handleBrawlMilestone(mm); else sendBrawlMsg(mm); } } // 里程碑每 5% 一格（5→100 共 20 格）
          // 島嶼禮物額度（2026-11-02 使用者糾正，與里程碑脫鉤）：只有「對照解答、全實線」的島嶼完成才算——
          // 草稿虛線不算進完成（舊版 counts 把 draftCount 也加進去，虛線湊滿就亮綠燈照送）；只湊滿數字（橋架錯對象、條數分配錯）也不算。
          // 判定：該島牽涉的每一對（解答有的＋實線有的）其實線條數都必須與解答完全一致。額度以單位制只增不減（每完成總島數 1/20 入帳 1）。
          const solPairs = {};
          ((rld && rld.solution) || []).forEach(sb => { solPairs[sb.from < sb.to ? sb.from + '|' + sb.to : sb.to + '|' + sb.from] = sb.count; });
          const solidPairs = {};
          (bridgesArr || []).forEach(b => { if ((b.count || 0) > 0) solidPairs[b.from < b.to ? b.from + '|' + b.to : b.to + '|' + b.from] = b.count; });
          let strictDone = 0;
          islands.forEach(isl => {
            const sid = String(isl.id), rel = {};
            Object.keys(solPairs).forEach(k => { const ab = k.split('|'); if (ab[0] === sid || ab[1] === sid) rel[k] = true; });
            Object.keys(solidPairs).forEach(k => { const ab = k.split('|'); if (ab[0] === sid || ab[1] === sid) rel[k] = true; });
            let ok = true;
            Object.keys(rel).forEach(k => { if ((solidPairs[k] || 0) !== (solPairs[k] || 0)) ok = false; });
            if (ok) strictDone++;
          });
          const giftUnits = Math.floor(strictDone * 20 / islands.length);
          if (giftUnits > hashiGiftUnitsRef.current) { hashiGiftCreditRef.current += (giftUnits - hashiGiftUnitsRef.current); hashiGiftUnitsRef.current = giftUnits; }
          // 島嶼禮物（使用者定案，比照數獨扶弱）：額度逐一送給比自己弱的未完賽對手（差距平方根加權抽一位）；沒有較弱對手時額度存著，等下次進度推送再試
          while (hashiGiftCreditRef.current > 0) {
            const weaker = playersListRef.current.filter(pl => {
              if (!pl.id || pl.id === myId) return false;
              if (raceResultsRef.current[pl.id]) return false; // 已完賽者不收
              if ((racersRef.current || []).length && racersRef.current.indexOf(pl.id) < 0) return false; // 觀戰者不在場上
              const info = raceProgressRef.current[pl.id];
              return (info ? info.progress : 0) < p;
            });
            if (!weaker.length) break;
            const ws = weaker.map(pl => { const info = raceProgressRef.current[pl.id]; return Math.sqrt(Math.max(0.01, p - (info ? info.progress : 0))); });
            const sel = platPickWeighted(weaker, ws);
            sendBrawlMsg({ type: 'BRAWL_GRANT', toUid: sel.id, item: 'gift', fromUid: myId });
            try { if (window.PlatFly) PlatFly.fly(PlatFly.byUid('hashi', myId), PlatFly.byUid('hashi', sel.id), '🎁'); } catch (e) {} // H3 禮物 Fly（純顯示層）
            hashiGiftCreditRef.current -= 1;
          }
        }
        const nowB = Date.now();
        if (nowB - lastBrawlSentRef.current > 700) {
          lastBrawlSentRef.current = nowB;
          sendBrawlMsg({ type: 'BRAWL_STATE', uid: myId, name: (myNameRef.current || '你'), color: myColorRef.current, progress: p, bridges: bridgesArr });
        }
        saveHashiResume(bridgesArr);
        const now = Date.now();
        if (p === lastProgressValRef.current && now - lastProgressSentRef.current <= 1000) return; // 節流
        lastProgressValRef.current = p;
        lastProgressSentRef.current = now;
        const info = { progress: p, name: (myNameRef.current || '你'), color: myColorRef.current };
        setRaceProgress(prev => ({ ...prev, [myId]: info }));
        const msg = { type: 'RACE_PROGRESS', uid: myId, name: info.name, color: info.color, progress: p };
        try {
          if (isHostRef.current) { connsRef.current.forEach(c => { if (c.open) c.send(msg); }); }
          else if (connRef.current && connRef.current.open) { connRef.current.send(msg); }
        } catch (e) {}
      };

      // 🏁 競速中：橋樑/塗鴉只改本地，不廣播（防偷看、防互相覆蓋）
      const raceAwareSync = (partial) => {
        if (raceStateRef.current === 'countdown' || raceStateRef.current === 'racing' || raceStateRef.current === 'finished') {
          if (partial.bridges !== undefined) {
            setBridges(partial.bridges);
            pushRaceProgress(partial.bridges);
          }
          if (partial.strokes !== undefined) setStrokes(partial.strokes);
          if (partial.showSolution !== undefined) setShowSolution(partial.showSolution);
          stateRef.current = { ...stateRef.current, ...partial };
        } else {
          syncState(partial);
        }
      };

      // ⭐ 最佳紀錄：hashi_best_{W}x{H}
      const recordBest = (secs) => {
        try {
          const w = randomLevelData.width, h = randomLevelData.height;
          const key = 'hashi_best_' + w + 'x' + h;
          const prev = parseInt(platSave().getStr(key, '0'), 10);
          if (!prev || secs < prev) {
            platSave().setStr(key, String(secs));
            setIsNewBest(true);
          } else {
            setIsNewBest(false);
          }
        } catch (e) {}
      };

      const resetWinMeta = () => {
        setStars(0); setIsNewBest(false); setBursts([]);
        prevIslandDoneRef.current = {};
      };

      const islandCurrentCounts = useMemo(function() {
        const counts = {};
        const islands = (randomLevelData && randomLevelData.islands) ? randomLevelData.islands : [];
        islands.forEach(i => { counts[i.id] = { total: 0, real: 0 }; });
        (bridges || []).forEach(b => {
          if (counts[b.from] !== undefined) {
             counts[b.from].total += b.count + (b.draftCount || 0);
             counts[b.from].real += b.count;
          }
          if (counts[b.to] !== undefined) {
             counts[b.to].total += b.count + (b.draftCount || 0);
             counts[b.to].real += b.count;
          }
        });
        return counts;
      }, [bridges, randomLevelData]);

      const crossedBridgeIds = useMemo(() => {
          const crossed = new Set();
          const islMap = {};
          const bList = bridges || [];
          const islands = (randomLevelData && randomLevelData.islands) ? randomLevelData.islands : [];
          islands.forEach(i => { islMap[i.id] = i; });

          const activeV = bList.filter(b => (b.count + (b.draftCount || 0)) > 0 && b.type === 'v');
          const activeH = bList.filter(b => (b.count + (b.draftCount || 0)) > 0 && b.type === 'h');

          bList.forEach(target => {
              if ((target.count + (target.draftCount || 0)) > 0) return;

              const tFrom = islMap[target.from];
              const tTo = islMap[target.to];
              if (!tFrom || !tTo) return;

              let isCross = false;
              if (target.type === 'h') {
                  const y = tFrom.y;
                  const minX = Math.min(tFrom.x, tTo.x);
                  const maxX = Math.max(tFrom.x, tTo.x);
                  for (let i = 0; i < activeV.length; i++) {
                      const b = activeV[i];
                      const bFrom = islMap[b.from], bTo = islMap[b.to];
                      if (bFrom && bTo && bFrom.x > minX && bFrom.x < maxX && y > Math.min(bFrom.y, bTo.y) && y < Math.max(bFrom.y, bTo.y)) {
                          isCross = true; break;
                      }
                  }
              } else {
                  const x = tFrom.x;
                  const minY = Math.min(tFrom.y, tTo.y);
                  const maxY = Math.max(tFrom.y, tTo.y);
                  for (let i = 0; i < activeH.length; i++) {
                      const b = activeH[i];
                      const bFrom = islMap[b.from], bTo = islMap[b.to];
                      if (bFrom && bTo && bFrom.y > minY && bFrom.y < maxY && x > Math.min(bFrom.x, bTo.x) && x < Math.max(bFrom.x, bTo.x)) {
                          isCross = true; break;
                      }
                  }
              }
              if (isCross) crossed.add(target.id);
          });
          return crossed;
      }, [bridges, randomLevelData]);

      const highlightedIslandIds = useMemo(() => {
          const ids = new Set();
          const bList = bridges || [];
          if (hoveredIslandId) {
              ids.add(hoveredIslandId);
              bList.forEach(b => {
                  if (b.from === hoveredIslandId) ids.add(b.to);
                  if (b.to === hoveredIslandId) ids.add(b.from);
              });
          }
          if (hoveredBridgeId) {
              const hb = bList.find(b => b.id === hoveredBridgeId);
              if (hb) {
                  ids.add(hb.from);
                  ids.add(hb.to);
              }
          }
          return ids;
      }, [hoveredIslandId, hoveredBridgeId, bridges]);

      const activeHints = useMemo(() => {
          if (!hoveredIslandId || interactionMode >= 2) return [];
          return (bridges || []).filter(b => b.from === hoveredIslandId || b.to === hoveredIslandId);
      }, [hoveredIslandId, interactionMode, bridges]);

      const handleBridgeClick = (bId) => {
        if (isWon || interactionMode >= 2) return;
        if (raceStateRef.current === 'countdown') return; // 🏁 倒數中鎖定操作
        const nowTap = Date.now();
        if (nowTap - (lastBridgeTapRef.current[bId] || 0) < 150) return; // 防手機連點誤觸
        lastBridgeTapRef.current[bId] = nowTap;
        const cur = bridges || [];
        const target = cur.find(b => b.id === bId);
        if (!target) return;
        if (target.locked) { showToast('🎁 這是禮物補上的橋，已鎖定，不會被改掉'); try { platAudio().play('error'); } catch (e) {} return; } // 禮物橋鎖定拒絕＝error（v1.64.1 稽核裁示復原：主動操作被拒要有聲音回饋） // 禮物橋：誤觸不刪（點按/拖曳共用此入口）

        if (target.count + (target.draftCount || 0) === 0) {
          if (crossedBridgeIds.has(bId)) {
             try { platAudio().play('error'); } catch (e) {} // 交叉拒絕＝error（v1.64.1 稽核裁示復原：與數獨衝突同類——嘗試的落子不合法）
             return showToast("🚫 橋樑不能交叉喔！請先移除阻擋的橋。");
          }
        }

        if (engineRef.current === 'none') {
            setHistory(past => {
                const newPast = [...past, cur];
                if (newPast.length > 25) return newPast.slice(newPast.length - 25);
                return newPast;
            });
        }

        const oldTotal = target.count + (target.draftCount || 0);

        const nextBridges = cur.map(b => {
            if (b.id !== bId) return b;

            let newCount = b.count;
            let newDraftCount = b.draftCount || 0;

            if (interactionMode === 1) { // 草稿模式
               if (b.count === 1) {
                  newDraftCount = newDraftCount === 0 ? 1 : 0;
               } else if (b.count === 0) {
                  newDraftCount = (newDraftCount + 1) % 3;
               }
            } else { // 實線模式
               if (newDraftCount > 0) {
                  newCount = b.count + newDraftCount;
                  newDraftCount = 0;
               } else {
                  newCount = (b.count + 1) % 3;
               }
            }

            const newOwner = (newCount > 0 || newDraftCount > 0) ? myId : null;
            return { ...b, count: newCount, draftCount: newDraftCount, owner: newOwner };
        });

        const newB = nextBridges.find(b => b.id === bId);
        const newTotal = newB.count + (newB.draftCount || 0);
        if (newTotal !== oldTotal) {
            try { platAudio().play('place'); } catch (e) {} // 架橋 commit（新增/增減）＝place；草稿轉實線總數不變不播（守恆舊行為）（PlatAudio，v1.64.0）
        }

        raceAwareSync({ bridges: nextBridges });

        // ✨ 點擊漣漪：在橋樑中點（成功架橋或取消時）
        if (newTotal !== oldTotal) {
            const islMap2 = {};
            ((randomLevelData && randomLevelData.islands) || []).forEach(i => { islMap2[i.id] = i; });
            const bf = islMap2[target.from], bt = islMap2[target.to];
            if (bf && bt) {
                const mx = (bf.x + bt.x) / 2 * SCALE + PADDING;
                const myy = (bf.y + bt.y) / 2 * SCALE + PADDING;
                setRipples(prev => [...prev, { id: Date.now() + Math.random(), uid: myId, x: mx, y: myy, timestamp: Date.now() }]);
            }
        }

        setHoveredIslandId(null);
      };

      const handleShowSolution = () => { syncState({ showSolution: true }); };

      const switchMode = (m) => { setInteractionMode(m); showToast(`${modeIcons[m]} 已切換為 ${modeTitles[m]}`); };

      const toggleInteractionMode = () => {
        const maxModes = engineRef.current === 'peerjs' ? 3 : 2;
        const nextMode = (interactionMode + 1) % maxModes;
        setInteractionMode(nextMode);
        showToast(`${modeIcons[nextMode]} 已切換為 ${modeTitles[nextMode]}`);
      };
      const advanceHashiMode = () => {
        const nextMode = interactionMode === 0 ? 1 : interactionMode === 1 ? (engine === 'peerjs' ? 2 : 0) : 0;
        switchMode(nextMode);
        setDrawSubOpen(nextMode === 2);
      };
      // === 共用底部列 PlatBar（平台模式由殼渲染單一元件；獨立版走舊列） ===
      const platBarRef = useRef(null);
      const platBarCfgRef = useRef(null);
      platBarCfgRef.current = {
        accent: '#4ade80',
        onAction: (name, payload) => {
          if (name === 'zoom-in') handleZoomIn();
          else if (name === 'zoom-out') handleZoomOut();
          else if (name === 'zoom-cycle') handleCycleZoom();
          else if (name === 'mode-press') advanceHashiMode();
          else if (name === 'draw-tool') setDrawSubMode(payload);
          else if (name === 'draw-erase-dbl') clearOwnStrokes();
          else if (name === 'draw-clear') clearAllStrokes();
        }
      };
      const platBarCfgStable = useRef(null);
      if (!platBarCfgStable.current) platBarCfgStable.current = { accent: '#4ade80', onAction: (n, p) => { if (platBarCfgRef.current) platBarCfgRef.current.onAction(n, p); } };
      useEffect(() => {
    if (typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'hashi') return; // 底部列主人是另一款遊戲時不搶（錦標賽輪替時防翻跳）
    if (typeof window === 'undefined' || typeof window.PlatBar === 'undefined') return;
    const el = platBarRef.current;
    if (el) {
      // 自我修復（v1.55.1）：掛載節點被換掉/拆掉時自動重新 attach——完賽轉觀戰會把整個底部列連掛載點一起卸載，
      // 再來一局時 React 用新節點重建、screen 卻沒變，舊的 [screen] effect 永遠不重跑、殼抱著死節點整場沒工具列（使用者實機回報）
      if (window.PlatBar._el() !== el || !window.PlatBar._elConnected()) window.PlatBar.attach(el, platBarCfgStable.current);
    } else if (window.PlatBar.isAttached() && !window.PlatBar._elConnected()) {
      window.PlatBar.detach(window.PlatBar._el());
    }
  });
      useEffect(() => {
        if (typeof window.PlatBar === 'undefined' || !window.PlatBar.isAttached()) return;
        if (typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'hashi') return;
        const st = {
          mode: interactionMode,
          modes: engine === 'peerjs' ? [{ icon: '🖋️', label: '畫筆' }, { icon: '✏️', label: '草稿' }, { icon: '🖌️', label: '繪圖' }] : [{ icon: '🖋️', label: '畫筆' }, { icon: '✏️', label: '草稿' }],
          modeTitle: '切換模式（畫筆/草稿/繪圖）',
          zoomLabel: zoomLevel > 1 ? Math.round(zoomLevel * 100) + '%' : '🔍', // zoom 標示三款統一百分比（美學稽核 V-22）
          zoomGlyph: zoomModeIdx === 0 ? '1x' : zoomModeIdx === 1 ? '↔️' : zoomModeIdx === 2 ? '↕️' : '🔲',
          showInput: false, inputMode: 'num',
          showDraw: engine === 'peerjs', drawTool: drawSubMode,
          showHostClear: !!isHostRef.current
        };
        window.PlatBar.update(st);
      });


      useEffect(() => {
        if (typeof window === 'undefined' || !window.PlatCountdown) return;
        if (window.__PLAT_NET && window.__PLAT_NET.inMatch !== 'hashi') return; // 平台：背景遊戲不許碰殼的共用 overlay（會把前景那款的倒數/結算弄閃）
        if (raceCountdown !== null) window.PlatCountdown.show(raceCountdown === 0 ? 'GO!' : raceCountdown);
        else window.PlatCountdown.hide();
      }, [raceCountdown]);

      // 共用結算畫面（PlatResults，與數獨同框架）：大亂鬥結算改餵殼 spec，本地 modal/等待 pill 只作無殼時 fallback
      useEffect(() => {
        if (typeof window === 'undefined' || !window.PlatResults) return;
        if (window.__PLAT_NET && window.__PLAT_NET.inMatch !== 'hashi') return; // 平台：背景遊戲不許碰殼的共用 overlay（會把前景那款的倒數/結算弄閃）
        const fin = inRace && raceState === 'finished' && raceResult;
        const wait = inRace && raceWaiting && raceState === 'racing';
        if (!fin && !wait) { window.PlatResults.hide(); resultsDismissRef.current = null; if (resultsDismissedUi) setResultsDismissedUi(false); if (leaveArm) setLeaveArm(false); return; }
        if (resultsDismissRef.current === raceState) { window.PlatResults.hide(); return; }
        if (resultsDismissedUi) setResultsDismissedUi(false);
        const homeBtn = leaveArm ? { id: 'home', label: '⚠️ 確定離開？', kind: 'danger' } : { id: 'home', label: '離開' };
        const watchAction = () => {
          resultsDismissRef.current = raceState;
          setResultsDismissedUi(true);
          window.PlatResults.hide();
          // 等待態（我已完賽）：畫面已自動轉上帝視角面板（raceWaiting），關卡即可，不用再開 modal；
          // 全場結算態：維持開 modal 看盤面
          if (raceState === 'finished') { const opps = Object.keys(brawlBoards); if (opps.length) setGodViewUid(opps[0]); }
        };
        if (fin) {
          const iFinished = raceResult.entries.some(e => e.uid === myId && e.finished);
          window.PlatResults.show({
            accent: '#4ade80', title: '大亂鬥結果',
            entries: raceResult.entries.map(e => ({ key: String(e.uid), name: e.name, color: e.color, isMe: e.uid === myId, right: e.finished ? ('⏱ ' + formatTime(Math.floor(e.timeMs / 1000))) : ('未完成 · ' + Math.round((e.progress || 0) * 100) + '%') })),
            verdict: raceResult.winnerUid === myId ? '🎉 你贏了！' : (iFinished ? '完賽了，名次如上！' : '比賽結束，結果如上'),
            stars: iFinished ? stars : null,
            note: (typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.tourn) ? null : (!isHostRef.current ? '再來一局／回等待室都會帶全員一起' : null),
            buttons: (typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.tourn)
              ? [ // 錦標賽：下一局照賽程走，不給再來一局
                { id: 'watch', label: '👁️ 看盤面' },
                { id: 'lobby', label: '🏁 回等待室', kind: 'primary' },
                homeBtn
              ]
              : [
                { id: 'watch', label: '👁️ 看盤面' },
                { id: 'rematch', label: '🔁 再來一局', kind: 'primary' },
                { id: 'lobby', label: '🏁 回等待室' },
                homeBtn
              ],
            onAction: (id) => {
              if (id === 'watch') watchAction();
              else if (id === 'rematch') { window.PlatResults.hide(); playAgain(); }
              else if (id === 'lobby') { window.PlatResults.hide(); requestLobby(); }
              else if (id === 'home') {
                if (!leaveArm) { // 第一次按只是武裝確認（防誤按），3.5 秒內再按才真的離開
                  setLeaveArm(true);
                  if (leaveArmTimerRef.current) clearTimeout(leaveArmTimerRef.current);
                  leaveArmTimerRef.current = setTimeout(() => setLeaveArm(false), 3500);
                  return;
                }
                if (leaveArmTimerRef.current) clearTimeout(leaveArmTimerRef.current);
                setLeaveArm(false);
                window.PlatResults.hide(); handleGoHome();
              }
            }
          });
        } else {
          const fins = [];
          if (myFinishTimeRef.current != null) fins.push({ uid: myId, name: (myNameRef.current || '你'), color: myColorRef.current, timeMs: myFinishTimeRef.current });
          Object.keys(raceResultsRef.current).forEach(uid => {
            const r = raceResultsRef.current[uid];
            if (!r.dnf) fins.push({ uid: uid, name: r.name, color: r.color, timeMs: r.timeMs });
          });
          fins.sort((a, b) => a.timeMs - b.timeMs);
          window.PlatResults.show({
            accent: '#4ade80', title: '大亂鬥結果',
            entries: fins.map(f => ({ key: String(f.uid), name: f.name, color: f.color, isMe: f.uid === myId, right: '⏱ ' + formatTime(Math.floor(f.timeMs / 1000)) })),
            waitingText: '等待其他玩家完成…',
            buttons: [{ id: 'watch', label: '👁️ 轉變為上帝模式（觀戰）', kind: 'primary' }],
            onAction: (id) => { if (id === 'watch') watchAction(); }
          });
        }
      });

      const handleUndo = () => {
        if (history.length === 0 || isWon || engineRef.current !== 'none') return;
        const previousState = history[history.length - 1];
        syncState({ bridges: previousState });
        setHistory(past => past.slice(0, -1));
      };

      const handleReset = () => {
        const empty = HASHI_PUZZLE.generateEmptyBridges(randomLevelData);
        raceAwareSync({ bridges: empty, strokes: [], showSolution: false, startTime: Date.now() });
        if (engineRef.current === 'none') setHistory([]);
        setIsWon(false); setEndTime(null);
        resetWinMeta();
      };

      const handleRegenerateRandom = () => {
        if (isDailyModeRef.current) return;
        setIsGenerating(true);
        setTimeout(() => {
            purgeGhostPlayers();
            let targetLevelDef;
            if (currentLevelId === 'custom') {
               targetLevelDef = { id: 'custom', name: `⚙️ 自訂 (${randomLevelData.width}x${randomLevelData.height})`, width: randomLevelData.width, height: randomLevelData.height, description: "玩家自訂尺寸的大型地圖！" };
            } else {
               targetLevelDef = LEVELS.find(l => l.id === currentLevelId) || LEVELS[1];
            }
            const newRandomData = HASHI_PUZZLE.generateUniqueHashi(targetLevelDef);
            const empty = HASHI_PUZZLE.generateEmptyBridges(newRandomData);
            syncState({ levelId: currentLevelId, randomLevelData: newRandomData, bridges: empty, strokes: [], showSolution: false, startTime: Date.now() });
            setIsWon(false); setHistory([]); setEndTime(null); setHideVictoryModal(false);
            resetWinMeta();
            setBoardFadeKey(k => k + 1); scheduleFitZoom();
            setIsGenerating(false);
        }, 100);
      };

      const handleLevelChange = (newLevelId) => {
        if (isDailyModeRef.current) return;
        if (engineRef.current !== 'none' && !isHostRef.current) return;

        if (newLevelId === 'custom') {
            setShowCustomModal(true);
            return;
        }

        setIsGenerating(true);
        setTimeout(() => {
            purgeGhostPlayers();
            const targetLevelDef = LEVELS.find(l => l.id === newLevelId);
            if(!targetLevelDef) {
                setIsGenerating(false);
                return;
            }
            const newRandomData = HASHI_PUZZLE.generateUniqueHashi(targetLevelDef);
            const empty = HASHI_PUZZLE.generateEmptyBridges(newRandomData);
            syncState({ levelId: newLevelId, randomLevelData: newRandomData, bridges: empty, strokes: [], showSolution: false, startTime: Date.now() });
            setIsWon(false); setHistory([]); setEndTime(null);
            resetWinMeta();
            setBoardFadeKey(k => k + 1); scheduleFitZoom();
            setIsGenerating(false);
        }, 100);
      };

      const handleCustomGenerate = () => {
          let w = Math.max(5, Math.min(100, tempWidth));
          let h = Math.max(5, Math.min(100, tempHeight));
          if (soloPick) { platSave().setStr('hashi_solo_level', 'custom'); platSave().write('hashi_solo_custom', { w: w, h: h }); setSoloPick(false); }
          setTempWidth(w);
          setTempHeight(h);
          setShowCustomModal(false);

          setIsGenerating(true);
          setTimeout(() => {
              purgeGhostPlayers();
              const customLevelDef = { id: 'custom', name: `⚙️ 自訂 (${w}x${h})`, width: w, height: h, description: "玩家自訂尺寸的大型地圖！" };
              const newRandomData = HASHI_PUZZLE.generateUniqueHashi(customLevelDef);
              const empty = HASHI_PUZZLE.generateEmptyBridges(newRandomData);

              syncState({ levelId: 'custom', randomLevelData: newRandomData, bridges: empty, strokes: [], showSolution: false, startTime: Date.now() });
              setIsWon(false); setHistory([]); setEndTime(null);
            resetWinMeta();
              setBoardFadeKey(k => k + 1); scheduleFitZoom();
              setIsGenerating(false);
          }, 100);
      };

      const closeVictoryModal = () => {
        setIsClosingModal(true);
        setTimeout(() => {
          setHideVictoryModal(true);
          setIsClosingModal(false);
        }, 300);
      };

      const triggerRegenerate = () => {
        setIsClosingModal(true);
        setTimeout(() => {
          setIsClosingModal(false);
          handleRegenerateRandom();
        }, 300);
      };

      const triggerDailyHome = () => {
        setIsClosingModal(true);
        setTimeout(() => {
          setIsClosingModal(false);
          handleGoHome();
        }, 300);
      };

      const switchToOffline = () => {
        setEngine('none'); engineRef.current = 'none';
        setIsHost(false); isHostRef.current = false;
        setRoomId(""); setPlayersList([]);
        connsRef.current = []; connRef.current = null;
        setCursors({}); setRipples([]); setInteractionMode(0);
        setChatMsgs([]); setUnreadChat(0); setChatOpen(false); setChatInput('');
        stopVideo(); // 📹 關閉視訊
      };

      const startSinglePlayer = () => {
        setIsDailyMode(false); isDailyModeRef.current = false;
        resetWinMeta();
        switchToOffline();
        // v1.58.0：單機入口先選難度（不要直接開局）——還原上次單機選的難度供 modal 反綠，再開設定 modal；
        // 選定才生成題目（handleLevelChange/handleCustomGenerate），取消則回主畫面（closeSettingsModal 處理）
        try {
          var lastSolo = platSave().getStr('hashi_solo_level', '');
          if (lastSolo === 'custom') {
            var cd = platSave().read('hashi_solo_custom', { fallback: null });
            if (cd && cd.w && cd.h) { setTempWidth(cd.w); setTempHeight(cd.h); }
            setCurrentLevelId('custom');
          } else if (lastSolo && LEVELS.some(l => String(l.id) === String(lastSolo))) setCurrentLevelId(Number(lastSolo));
          else if (!LEVELS.some(l => String(l.id) === String(currentLevelId))) setCurrentLevelId(2); // 'daily' 等偽難度不可沿用
        } catch (e) {}
        setSoloPick(true);
        setScreen('game'); setIsHeaderCollapsed(true);
        setShowSettingsModal(true);
      };
      // 設定 modal 的關閉：單機選難度途中取消＝回主畫面（局還沒開）；局內開啟則只關 modal
      const closeSettingsModal = () => {
        setShowSettingsModal(false);
        if (soloPick) { setSoloPick(false); setScreen('home'); }
      };

      // 每日一題：紀錄過關（只在每日模式呼叫）
      const recordDailyWin = (secs) => {
        const d = dailyDateStrRef.current;
        if (!d) return;
        try {
          const prev = readDailyRecord(d);
          const best = prev ? Math.min(prev.time, secs) : secs;
          const dm = dailyMap(); dm.days[d] = { time: best }; platSave().write('hashi_daily_map', dm);
        } catch (e) {}
        // 連擊只算「今天」：補玩以前日期的題目只記成績，不影響連擊
        try {
          const today = HASHI_PUZZLE.getDailyDateStr();
          if (d === today) {
            const streak = readDailyStreak();
            const yesterday = HASHI_PUZZLE.shiftDateStr(d, -1);
            let newCount;
            if (streak.lastDate === d) newCount = streak.count;
            else if (streak.lastDate === yesterday) newCount = streak.count + 1;
            else newCount = 1;
            platSave().write('hashi_daily_streak', { count: newCount, lastDate: d });
            setDailyStreak(newCount);
          }
        } catch (e) {}
        setDailyDone(readDailyRecord(d));
      };

      const startDailyMode = (dateStr) => {
        const d = clampDailyDate(dateStr);
        const today = HASHI_PUZZLE.getDailyDateStr();
        const rng = HASHI_PUZZLE.getDailySeed(d);
        const dailyDef = { id: 'daily', name: `📅 每日一題 (${d})`, width: 10, height: 10, description: d < today ? `補玩 ${d} 的每日題目：全世界同一題！` : `每日挑戰（${d}）：全世界同一題，一天只有一次機會！` };
        const data = HASHI_PUZZLE.generateUniqueHashi(dailyDef, rng);
        const empty = HASHI_PUZZLE.generateEmptyBridges(data);
        const status = getDailyStatus(d);
        setIsDailyMode(true); isDailyModeRef.current = true;
        setDailyDateStr(d); dailyDateStrRef.current = d;
        setDailyStreak(status.streak);
        setDailyDone(status.done);
        setCurrentLevelId('daily');
        setRandomLevelData(data);
        setBridges(empty);
        setStrokes([]);
        setHistory([]);
        setShowSolution(false);
        setStartTime(Date.now());
        setIsWon(false); setEndTime(null); setHideVictoryModal(false);
        resetWinMeta();
        setBoardFadeKey(k => k + 1); scheduleFitZoom();
        setInteractionMode(0);
        switchToOffline();
        setScreen('game');
        setIsHeaderCollapsed(true);
      };

      // ===== 📅 每日一題月曆（亮燈=已完成、未來反灰不可選；點日期直接開那天的題目） =====
      const openDailyCal = () => { if (!window.PlatCalendar) return; var recs = {}; var dd = new Date(2026, 0, 1); var nowD = new Date(); while (dd <= nowD) { var ds2 = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0') + '-' + String(dd.getDate()).padStart(2, '0'); if (readDailyRecord(ds2)) recs[ds2] = 1; dd.setDate(dd.getDate() + 1); } window.PlatCalendar.show({ accent: '#4ade80', records: recs, selected: dailyMenuDate, onPick: (ds) => { setDailyMenuDate(ds); startDailyMode(ds); } }); }; // 每日月曆已統一為殼端 PlatCalendar（v1.16）

      // ===== 🎰 暱稱拉霸機（只給沒手動填暱稱的玩家） =====
      const spinSlot = (pool) => {
        if (slotTimerRef.current) { clearTimeout(slotTimerRef.current); slotTimerRef.current = null; }
        const list = (pool && pool.length > 0) ? pool : ANIMAL_NAMES;
        slotPoolRef.current = list;
        setSlotPool(list);
        setSlotRound(r => r + 1);
        setSlotSpinning(true);
        setSlotFinalName(""); slotFinalNameRef.current = "";
        const t0 = Date.now();
        let delay = 60;
        const tick = () => {
          setSlotName(list[(Math.random() * list.length) | 0]);
          if (Date.now() - t0 >= 1800) {
            const finalName = list[(Math.random() * list.length) | 0];
            setSlotName(finalName);
            setSlotFinalName(finalName); slotFinalNameRef.current = finalName;
            setSlotSpinning(false);
            slotTimerRef.current = null;
            return;
          }
          delay = Math.min(delay * 1.18, 420);
          slotTimerRef.current = setTimeout(tick, delay);
        };
        tick();
      };

      const openSlotMachine = (mode, pool) => {
        // 新流程：pool 在開拉霸機前就已算好（含已用名單排除），直接轉
        setSlotMode(mode);
        setSlotWaiting(false);
        setSlotName(""); setSlotFinalName(""); slotFinalNameRef.current = "";
        setSlotSpinning(false);
        if (pool) { slotPoolRef.current = pool; setSlotPool(pool); }
        setShowSlotMachine(true);
        spinSlot(pool);
      };

      // 只關拉霸機 modal（回到 nick 步，連線保持）
      const closeSlotModal = () => {
        if (slotTimerRef.current) { clearTimeout(slotTimerRef.current); slotTimerRef.current = null; }
        setShowSlotMachine(false);
        setSlotSpinning(false);
        setSlotWaiting(false);
      };

      // 完整清理 join 流程（回到 choose 步）
      const fullJoinCleanup = () => {
        if (guestNamesTimeoutRef.current) { clearTimeout(guestNamesTimeoutRef.current); guestNamesTimeoutRef.current = null; }
        if (slotTimerRef.current) { clearTimeout(slotTimerRef.current); slotTimerRef.current = null; }
        setShowSlotMachine(false);
        setSlotSpinning(false);
        setSlotWaiting(false);
        suppressCloseRef.current = true;
        if (connRef.current) { try { connRef.current.close(); } catch (e) {} connRef.current = null; }
        if (peerRef.current) { try { peerRef.current.destroy(); } catch (e) {} peerRef.current = null; }
        connsRef.current = [];
        setTimeout(() => { suppressCloseRef.current = false; }, 500);
        engineRef.current = 'none'; setEngine('none');
        setIsConnecting(false);
        setIsHost(false); isHostRef.current = false;
        setRoomId("");
        setPlayersList([]);
        setTakenNames([]);
        setNickError("");
        setTempPlayerName("");
        setJoinStep('choose');
        joinRoleRef.current = null;
        joinActiveRef.current = false;
        guestAutoNameRef.current = false;
        guestJoinedRef.current = false;
        guestNamesResolvedRef.current = false;
      };

      const backToChoose = () => { fullJoinCleanup(); setScreen('home'); };

      const confirmSlotName = () => {
        const name = slotFinalNameRef.current;
        if (!name || slotSpinning) return;
        if (slotTimerRef.current) { clearTimeout(slotTimerRef.current); slotTimerRef.current = null; }
        setShowSlotMachine(false);
        setTempPlayerName(name);
        autoNameRef.current = true;
        if (slotMode === 'host') {
          hostConfirmName(name);
        } else {
          guestSendJoin(name, true);
        }
      };

      const handleJoinRejected = (m) => {
        // 最終把關：連線保持開啟，不關閉
        setIsConnecting(false);
        guestJoinedRef.current = false;
        joinActiveRef.current = true;
        setScreen('home');
        setJoinStep('nick');
        if (guestAutoNameRef.current) {
          // 拉霸機自動名：用房主回傳的最新名單再轉一次
          showToast("🎰 剛好被選走了，再轉一次！");
          const taken = new Set((m.names || []).map(normName));
          const pool = ANIMAL_NAMES.filter(a => !taken.has(normName(a)));
          setTakenNames(m.names || []);
          setTimeout(() => { openSlotMachine('guest', pool.length > 0 ? pool : ANIMAL_NAMES); }, 700);
        } else {
          // 手動名：留在 nick 步，inline 錯誤
          setNickError("暱稱「" + (m.dupName || "這個名字") + "」已經有人用了，換一個吧！");
          setTimeout(() => { if (nameInputRef.current) nameInputRef.current.focus(); }, 350);
        }
      };

      // ===== 新流程：先選房間，進去再填暱稱（名字用參數傳遞） =====
      const excludeTakenNames = (pool, taken) => {
        const t = new Set((taken || []).map(normName));
        const rest = pool.filter(a => !t.has(normName(a)));
        return rest.length > 0 ? rest : pool.slice();
      };

      // 房主：建立房間（空名字先佔位）→ nick 步
      const hostCreateRoom = () => {
        mpModeRef.current = mpMode;
        setIsConnecting(true);
        setJoinStep('connecting');
        setNickError("");
        setTempPlayerName(loadSavedNickname());
        joinRoleRef.current = 'host';
        joinActiveRef.current = true;
        // 房主代碼固定不變：第一次隨機產生並存下，之後都用同一組，朋友不用每次重問代碼
        let rId = loadHostRoom();
        if (!rId) { rId = Math.floor(1000 + Math.random() * 9000).toString(); saveHostRoom(rId); }
        hostRoomRetryRef.current = false;
        setEngine('peerjs'); engineRef.current = 'peerjs';
        setupPeerJS(rId, true);
      };

      // 房主在 nick 步確認暱稱 → 進遊戲（競速則進大廳）
      const hostConfirmName = (pName) => {
        setRoomOpen(true);
        const name = (pName || "").trim();
        if (!name) return;
        // 房裡可能已有提早進來的來賓，本地即時檢查
        const clash = playersListRef.current.some(pl => pl.id !== myId && pl.name && normName(pl.name) === normName(name));
        if (clash) { setNickError("已經有人用這個名字了，換一個吧！"); return; }
        const entry = { id: myId, name: name, isHost: true, color: hubPlatColor() || getAvailableColor(playersListRef.current.filter(p => p.id !== myId)) }; // hub 模式：房主代表色用殼帶入的 sess.color，不亂配
        setPlayersList(prev => {
          const nList = [entry].concat(prev.filter(p => p.id !== myId));
          connsRef.current.forEach(c => { if (c.open) { try { c.send({ type: 'PLAYERS_UPDATE', players: nList }); } catch (e) {} } });
          return nList;
        });
        setTempPlayerName(name);
        saveNickname(name);
        joinActiveRef.current = false;
        setIsConnecting(false);
        setScreen('game'); setIsHeaderCollapsed(true);
        if (mpModeRef.current === 'race') { setRaceState('lobby'); raceStateRef.current = 'lobby'; }
      };

      // 來賓送出 JOIN（暱稱已在平台房間頁確認過，platAuto 自動呼叫）
      const guestSendJoin = (pName, auto) => {
        const name = (pName || "").trim();
        if (!name) return;
        setNickError("");
        setIsConnecting(true);
        guestAutoNameRef.current = auto;
        autoNameRef.current = auto;
        setTempPlayerName(name);
        saveNickname(name);
        if (connRef.current && connRef.current.open) {
          myJoinNameRef.current = name;
          guestJoinedRef.current = true;
          joinActiveRef.current = false;
          const joinMsg = { type: 'JOIN', pName: name, uid: myId, auto: auto };
          const hcJoin = hubPlatColor();
          if (hcJoin) { myColorRef.current = hcJoin; joinMsg.color = hcJoin; } // hub 模式：render 會用名單覆寫 myColorRef，故在送出點補釘並把殼的代表色帶進 JOIN（房主以 m.color 為準）；非 hub 不帶色、維持原行為
          connRef.current.send(joinMsg);
          setScreen('game'); setIsHeaderCollapsed(true); setIsConnecting(false);
        } else {
          setIsConnecting(false);
          showToast("⚠️ 連線已中斷，請重試");
          backToChoose();
        }
      };

      // 名單自我修復：來賓若發現自己不在房主名單裡（JOIN 在房主遊戲就緒前送達被漏接、
      // 或房主重進遊戲換了新 id），每 2.5 秒自動重送 JOIN，直到名單上有自己為止。
      useEffect(() => {
        const t = setInterval(() => {
          if (isHostRef.current || !guestJoinedRef.current) return;
          if (!connRef.current || !connRef.current.open) return;
          const list = playersListRef.current || [];
          if (list.some(pl => pl.id === myId)) return;
          const nm = myJoinNameRef.current || myNameRef.current;
          if (!nm) return;
          try { connRef.current.send({ type: 'JOIN', pName: nm, uid: myId, color: hubPlatColor() || myColorRef.current, auto: autoNameRef.current }); } catch (e) {}
        }, 2500);
        return () => clearInterval(t);
      }, []);

      // 完賽回報補送（與數獨 GHOST_I_WON 補送同款邏輯）：RACE_FINISH 原本只送一次，
      // 途中連線替換/掉包就永遠遺失、房主卡在等結果。完賽後仍在 racing 期間每 3 秒補送（上限 6 次），房主端以 uid 去重。
      useEffect(() => {
        const t = setInterval(() => {
          if (engineRef.current !== 'peerjs' || isHostRef.current) return;
          if (myFinishTimeRef.current == null) return;
          if (raceStateRef.current !== 'racing') return;
          if (finishResentRef.current >= 6) return;
          if (!connRef.current || !connRef.current.open) return;
          finishResentRef.current++;
          try { connRef.current.send({ type: 'RACE_FINISH', uid: myId, name: (myNameRef.current || '你'), color: myColorRef.current, timeMs: myFinishTimeRef.current }); } catch (e) {}
        }, 3000);
        return () => clearInterval(t);
      }, []);

      // 進度列以玩家名單為準：名單上沒有的 uid（舊連線殘留/重進前的殭屍列）直接修剪掉
      useEffect(() => {
        const ids = new Set(playersList.map(pl => String(pl.id)));
        ids.add(String(myId));
        (racersRef.current || []).forEach(uid => ids.add(String(uid)));
        setRaceProgress(prev => {
          const keys = Object.keys(prev);
          if (keys.every(k => ids.has(String(k)))) return prev;
          const next = {};
          keys.forEach(k => { if (ids.has(String(k))) next[k] = prev[k]; });
          return next;
        });
      }, [playersList]);

      const [platTournLock, setPlatTournLock] = useState(false);
      const [platHub, setPlatHub] = useState(false); // v1.11.0：本局由殼房間框架啟動（等待室改在殼端，本遊戲不顯示自己的等待室）
      const platHubRef = useRef(false);
      const hubStartTimerRef = useRef(null);
      const [tournRoundInfo, setTournRoundInfo] = useState(null); // 錦標賽本局資訊（第幾局/共幾局/加賽/應到人數），每局等待卡顯示與門檻用
      const tournWaitSinceRef = useRef(null); // 本局等待起點（等滿 1 分鐘房主可強制開始）
      const [, setTournTick] = useState(0);
      useEffect(() => {
        if (!(platHub && platTournLock)) return;
        const t = setInterval(() => setTournTick(x => x + 1), 1000);
        return () => clearInterval(t);
      }, [platHub, platTournLock]);
      const tournRosterRef = useRef(null); // 五戰名單帶入：本局預期選手（殼 sess.tourn.roster），等待室先種灰色未到席位（與數獨同款）
      // ===== 平台 Phase C 接入：殼 launch 時自動進多人（暱稱由殼帶入，跳過 nick 步） =====
      useEffect(() => {
        if (!PLAT_MODE) return;
        window.__PLAT_HOOKS_hashi = {
          enter: (sess) => {
            platSessRef.current = sess; // hub 模式：代表色以殼 sess.color 為準（enter 在連線建立前執行，先把我的顏色釘住，重複呼叫以最後一次為準）
            const hcEnter = hubPlatColor();
            if (hcEnter) myColorRef.current = hcEnter;
            // 開新局先清掉上一局的結算暫存：raceState 若停在 finished＋舊 raceResult，結算 effect 會在新局一進去就重播舊結果（錦標賽結束後再開大亂鬥實機踩到）
            setRaceState('idle'); raceStateRef.current = 'idle';
            setRaceWaiting(false); setRaceResult(null); setRaceCountdown(null); setRaceProgress({});
            raceResultsRef.current = {}; myFinishTimeRef.current = null; finishResentRef.current = 0;
            resultsDismissRef.current = null; setResultsDismissedUi(false); setLeaveArm(false);
            setBrawlBoards({}); setGodViewUid(null);
            setIsWon(false); setEndTime(null); resetWinMeta();
            setPlatTournLock(!!sess.tourn);
            tournRosterRef.current = (sess.tourn && sess.tourn.roster) || null;
            setPlatHub(!!sess.hub); platHubRef.current = !!sess.hub;
            setTournRoundInfo(sess.tourn ? { round: sess.tourn.round, total: sess.tourn.total, playoff: !!sess.tourn.playoff, entrants: sess.tourn.entrants } : null);
            tournWaitSinceRef.current = sess.tourn ? Date.now() : null;
            if (sess.settings) {
              // 房間框架帶入的設定（全員同一份）：大亂鬥設定＋關卡一次種下（數橋沒有「去第幾名」這種設定）
              const st = sess.settings;
              applyBrawlSettings({ ...brawlSettingsRef.current, ...(st.brawl || {}), sizeId: st.sizeId }, false);
              customDimsRef.current = (st.customW || st.customH) ? { w: Math.max(5, Math.min(100, Number(st.customW) || 15)), h: Math.max(5, Math.min(100, Number(st.customH) || 15)) } : null;
              if (st.sizeId === 'custom') setCurrentLevelId('custom');
              else { const lv = LEVELS.find(l => l.id === st.sizeId); if (lv) setCurrentLevelId(lv.id); } // 合作關卡：房主開房載入時照這個關卡走
              // 合作模式：房主照房間頁選的關卡先生成題目（原本沒生成、永遠是初始 10x10）；競速由 startRace 自己生成
              if (sess.isHost && sess.mode !== 'brawl' && sess.mode !== 'race') {
                const coopDef = st.sizeId === 'custom' ? { id: 'custom', name: '⚙️ 自訂', width: (customDimsRef.current || {}).w || 15, height: (customDimsRef.current || {}).h || 15 } : (LEVELS.find(l => l.id === st.sizeId) || null);
                if (coopDef) setTimeout(() => {
                  if (!isHostRef.current) return;
                  const data = HASHI_PUZZLE.generateUniqueHashi(coopDef);
                  const empty = HASHI_PUZZLE.generateEmptyBridges(data);
                  syncState({ levelId: coopDef.id, randomLevelData: data, bridges: empty, strokes: [], showSolution: false, startTime: Date.now() });
                }, 250);
              }
            } else if (sess.tourn && sess.isHost) {
              // 賽程預設：套用賽程的關卡
              applyBrawlSettings({ ...brawlSettingsRef.current, sizeId: sess.tourn.sizeId }, true);
            }
            platAutoRef.current = { name: sess.name };
            const mode = (sess.mode === 'brawl' || sess.mode === 'race') ? 'race' : 'coop';
            setMpMode(mode); mpModeRef.current = mode;
            setTempPlayerName(sess.name);
            try { myNameRef.current = sess.name; } catch (e) {}
            setNickError("");
            setEngine('peerjs'); engineRef.current = 'peerjs';
            setIsConnecting(true); setJoinStep('connecting');
            if (sess.isHost) {
              joinRoleRef.current = 'host'; joinActiveRef.current = true;
              setupPeerJS(sess.code, true);
            } else {
              joinRoleRef.current = 'guest'; joinActiveRef.current = true;
              guestJoinedRef.current = false; guestNamesResolvedRef.current = false; guestAutoNameRef.current = false;
              setTakenNames([]);
              setupPeerJS(sess.code, false);
            }
            // 房間框架流程：一般對局準備/人數在殼房間頁已經把關，房主端等人到齊就直接開局；
            // 錦標賽每一小局改走等待卡門檻（全員確認準備房主才能開始，或等滿 1 分鐘強制開始），不自動開局
            if (sess.hub && sess.isHost && !sess.tourn) {
              if (hubStartTimerRef.current) clearInterval(hubStartTimerRef.current);
              let tries = 0;
              hubStartTimerRef.current = setInterval(() => {
                tries++;
                const N = window.__PLAT_NET;
                const expected = N ? N.roster.length : 0;
                const present = (playersListRef.current || []).filter(p => !p.pending).length;
                if (expected >= 2 && present >= expected) {
                  clearInterval(hubStartTimerRef.current); hubStartTimerRef.current = null;
                  if (mpModeRef.current === 'race') startRace(); else startCoop();
                } else if (tries > 90) { clearInterval(hubStartTimerRef.current); hubStartTimerRef.current = null; }
              }, 500);
            }
          },
          exit: () => { platSessRef.current = null; setPlatTournLock(false); tournRosterRef.current = null; setPlatHub(false); platHubRef.current = false; setTournRoundInfo(null); tournWaitSinceRef.current = null; if (hubStartTimerRef.current) { clearInterval(hubStartTimerRef.current); hubStartTimerRef.current = null; } handleGoHome(); },
          migrate: (amHost, sess) => {
            platSessRef.current = sess; // 接管也以最後帶入的 sess 為準（hub 代表色同 enter）
            const hcMig = hubPlatColor();
            if (hcMig) myColorRef.current = hcMig;
            setEngine('peerjs'); engineRef.current = 'peerjs';
            if (amHost) {
              promotingRef.current = true;
              isHostRef.current = true; setIsHost(true);
              joinRoleRef.current = 'host'; joinActiveRef.current = true;
              setupPeerJS(sess.code, true);
            } else {
              joinRoleRef.current = 'guest'; joinActiveRef.current = true;
              guestJoinedRef.current = false; guestNamesResolvedRef.current = false;
              platAutoRef.current = { name: sess.name };
              setIsConnecting(true);
              setupPeerJS(sess.code, false);
            }
          },
          identity: (d) => {
            // 殼端身分同步（改名/改色）：殼已在它的名單同步好，這裡只把遊戲內名單對齊，不自創協議
            if (!d) return;
            if (d.self) {
              if (d.color !== 'rainbow' && COLORS.indexOf(d.color) < 0) return;
              myColorRef.current = d.color;
              setPlayersList(prev => {
                const nList = prev.map(p => p.id === myId ? { ...p, color: d.color } : p);
                // 我是房主：本地套用後用既有廣播管道送一次最新名單，讓來賓端一致（來賓身分只本地套用、不送訊息）
                if (isHostRef.current) connsRef.current.forEach(c => { if (c.open) { try { c.send({ type: 'PLAYERS_UPDATE', players: nList }); } catch (e) {} } });
                return nList;
              });
            } else {
              const p = (playersListRef.current || []).find(pl => normName(pl.name) === normName(d.name));
              if (p) handlePlayerColorChange(p.id, d.color); // 走原協議：房主直改廣播／來賓送 REQ_COLOR_CHANGE
            }
          }
        };
      }, []);

      // 在線心跳（與數獨同款）：來賓每 10 秒 ping 房主；房主記錄每人最後出現時間，25 秒標離線、等待中 60 秒無回應移除。
      // 底層連線的 close 訊號在 App 被直接關掉時可能拖很久，心跳負責即時性；房主把 isOffline 寫進名單條目，廣播自動帶給全場。
      useEffect(() => {
        const iv = setInterval(() => {
          if (engineRef.current !== 'peerjs') return;
          const now = Date.now();
          if (!isHostRef.current) {
            if (now - (lastPingRef.current || 0) >= 10000 && connRef.current && connRef.current.open) {
              lastPingRef.current = now;
              try { connRef.current.send({ type: 'PING', uid: myId }); } catch (e) {}
            }
            return;
          }
          const list = playersListRef.current || [];
          const waiting = raceStateRef.current === 'lobby' || (mpModeRef.current === 'coop' && !(stateRef.current && stateRef.current.coopStarted));
          let changed = false; let removed = null;
          const next = [];
          list.forEach(p => {
            if (p.id === myId) { next.push(p); return; }
            if (p.pending) { next.push(p); return; } // 未到席位不做離線判定/移除，等真 JOIN 替換或開賽時清掉
            if (!lastSeenRef.current[p.id]) { lastSeenRef.current[p.id] = now; next.push(p); return; }
            const silent = now - lastSeenRef.current[p.id];
            if (waiting && silent > 60000) { removed = p; changed = true; return; }
            const off = silent > 25000;
            if (!!p.isOffline !== off) { changed = true; next.push({ ...p, isOffline: off }); }
            else next.push(p);
          });
          if (changed) {
            setPlayersList(next);
            connsRef.current.forEach(c => { if (c.open) { try { c.send({ type: 'PLAYERS_UPDATE', players: next }); } catch (e) {} } });
            if (removed) showToast(`📴 ${removed.name || '玩家'} 已離線`);
          }
        }, 5000);
        return () => clearInterval(iv);
      }, []);

      const setupPeerJS = (rId, isCreating) => {
        // 冪等重設：重複 setup（接管/重入）先清掉舊 peer 與 conn refs，避免訊息送進死連線或重複綁定
        if (peerRef.current) { try { peerRef.current.destroy(); } catch (e) {} peerRef.current = null; }
        connsRef.current = []; connRef.current = null;
        if (isCreating) {
            const p = new Peer(rId + '-host');
            peerRef.current = p;
            p.on('call', handleIncomingCall); // 📹 視訊來電
            p.on('open', function() {
              setIsHost(true); isHostRef.current = true;
              setRoomId(rId); setIsConnecting(false);
              setJoinStep('nick');
              // 空名字先佔位，等 nick 步確認後再填上
              if (promotingRef.current) {
                // 接管升格：保留原名單（只移除舊房主、自己標房主），朋友以同 uid 回座
                promotingRef.current = false;
                setPlayersList(prev => {
                  const others = prev.filter(pl => !pl.isHost && pl.id !== myId);
                  const me = prev.find(pl => pl.id === myId) || { id: myId, name: myNameRef.current || '玩家', color: myColorRef.current };
                  return [{ ...me, isHost: true }, ...others];
                });
              } else {
                const seedListH = [{ id: myId, name: "", isHost: true, color: hubPlatColor() || getAvailableColor([]) }]; // hub 模式：種子名單的房主色也用 sess.color
                // 五戰名單帶入：還沒進遊戲的選手先種成灰色「未到」席位（真 JOIN 到達時以同名替換）
                if (tournRosterRef.current) {
                  const selfNameH = platAutoRef.current ? platAutoRef.current.name : null;
                  tournRosterRef.current.forEach(e => {
                    if (!e || !e.name || e.name === selfNameH) return;
                    seedListH.push({ id: 'pending:' + e.name, name: e.name, isHost: false, color: e.color || getAvailableColor(seedListH), isReady: false, isSpectator: false, pending: true });
                  });
                }
                setPlayersList(seedListH);
                if (platAutoRef.current) { const nmH = platAutoRef.current.name; platAutoRef.current = null; hostConfirmName(nmH); }
              }

              p.on('connection', function(c) {
                connsRef.current.push(c);
                c.on('data', function(m) {
                  if (c.uid || m.uid || m.targetId) lastSeenRef.current[c.uid || m.uid || m.targetId] = Date.now();
                  if (m.type === 'PING') { try { c.send({ type: 'PONG' }); } catch (e) {} return; }
                  if (m.type === 'JOIN') {
                      c.uid = m.uid; // 將玩家身分標籤綁定到這個連線上
                      // 撞名檢查：同 uid 重連允許；不同 uid 同名（大小寫不敏感）拒絕
                      const tryName = (m.pName || '').trim();
                      const clash = !!tryName && playersListRef.current.some(pl => pl.id !== m.uid && !pl.pending && normName(pl.name) === normName(tryName));
                      if (clash) {
                          // 連線保持開啟：拉霸機自動名會自動重轉，手動名回 nick 步重填
                          c.send({ type: 'JOIN_REJECTED', reason: 'name_taken', dupName: tryName, names: playersListRef.current.map(pl => pl.name) });
                          return;
                      }
                      setPlayersList(prev => {
                          const existingPlayer = prev.find(pl => pl.id === m.uid);
                          let nList;
                          if (existingPlayer) {
                              // 老玩家回歸，更新名字
                              nList = prev.map(pl => pl.id === m.uid ? { ...pl, name: m.pName } : pl);
                          } else {
                              // 新玩家加入（比賽進行中加入 → 自動觀戰，比照數獨）
                              const lateSpec = mpModeRef.current === 'race' && (raceStateRef.current === 'countdown' || raceStateRef.current === 'racing' || raceStateRef.current === 'finished');
                              const pendIdxH = prev.findIndex(pl => pl.pending && pl.name === m.pName);
                              if (pendIdxH >= 0) { // 五戰未到席位被真人頂上：沿用預期名單的顏色與位置
                                  nList = prev.slice();
                                  nList[pendIdxH] = { id: m.uid, name: m.pName, isHost: false, color: prev[pendIdxH].color, isReady: false, isSpectator: lateSpec };
                              } else {
                                  const newColor = (m.color === 'rainbow' || COLORS.indexOf(m.color) >= 0) ? m.color : getAvailableColor(prev); // 來賓有帶合法代表色（hub 模式＝殼的摩天輪色）就以他的為準，否則維持房主隨機配色
                                  nList = [...prev, { id: m.uid, name: m.pName, isHost: false, color: newColor, isReady: false, isSpectator: lateSpec }];
                              }
                          }
                          // 強制派發最新地圖與名單
                          connsRef.current.forEach(conn => {
                              if (conn === c) {
                                  conn.send({ type: 'INIT', data: stateRef.current, players: nList, mpMode: mpModeRef.current });
                              } else if (conn.open) {
                                  conn.send({ type: 'PLAYERS_UPDATE', players: nList });
                              }
                          });
                          return nList;
                      });
                      // 🏁 比賽進行中回座/加入：補發 RACE_RESUME（選手還原盤面快照、觀戰者進上帝視角）
                      if (mpModeRef.current === 'race' && (raceStateRef.current === 'countdown' || raceStateRef.current === 'racing')) {
                          // 重連回座先撤銷他斷線時被記的 DNF 並廣播，否則他之後的 RACE_FINISH 會被各端的 DNF 紀錄擋下、各端名次分歧（稽核修）
                          if (raceResultsRef.current[m.uid] && raceResultsRef.current[m.uid].dnf) {
                              delete raceResultsRef.current[m.uid];
                              connsRef.current.forEach(conn => { if (conn !== c && conn.open) conn.send({ type: 'RACE_UNDNF', uid: m.uid }); });
                          }
                          const snap = brawlBoardsRef.current[m.uid];
                          c.send({ type: 'RACE_RESUME', data: { randomLevelData: stateRef.current.randomLevelData, levelId: stateRef.current.levelId, showSolution: false, startTime: raceStartAtRef.current, strokes: [] }, startAt: raceStartAtRef.current, racers: racersRef.current, settings: brawlSettingsRef.current, bridges: snap ? snap.bridges : null, progress: raceProgressRef.current, results: raceResultsRef.current });
                      }
                      // 📹 若房主已開視訊，自動撥給新加入的玩家，並同步麥克風狀態
                      if (!PLAT_MODE && videoOnRef.current && localStreamRef.current && c.open) {
                        try {
                          const call = peerRef.current.call(c.peer, localStreamRef.current, { metadata: { uid: myId, name: (myNameRef.current || '你') } });
                          videoCallsRef.current.push(call);
                          const newUid = m.uid;
                          call.on('stream', (rs) => { setRemoteVideos(prev => ({ ...prev, [newUid]: rs })); });
                          call.on('close', () => { setRemoteVideos(prev => { const n = { ...prev }; delete n[newUid]; return n; }); });
                          c.send({ type: 'MIC', uid: myId, name: (myNameRef.current || '你'), muted: (function() { try { const at = localStreamRef.current.getAudioTracks()[0]; return at ? !at.enabled : true; } catch (e) { return true; } })() });
                        } catch (e) {}
                      }
                  } else if (m.type === 'GET_TAKEN_NAMES') {
                      // 只回給該連線：目前已使用的名字（排除空名字，給拉霸機／暱稱檢查用）
                      c.send({ type: 'TAKEN_NAMES', names: playersListRef.current.filter(pl => pl.name && pl.name.trim()).map(pl => pl.name) });
                  } else if (m.type === 'LEAVE') {
                      const inRaceNow = raceStateRef.current === 'countdown' || raceStateRef.current === 'racing';
                      if (inRaceNow) {
                          markRacerDnf(m.uid);
                          connsRef.current.forEach(conn => { if (conn !== c && conn.open) conn.send({ type: 'RACE_DNF', uid: m.uid }); });
                          showToast("👋 一位選手離開，以未完成計入名次");
                      } else {
                          setPlayersList(prev => {
                              const nList = prev.filter(pl => pl.id !== m.uid);
                              connsRef.current.forEach(conn => {
                                  if (conn !== c && conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: nList });
                              });
                              return nList;
                          });
                      }
                  } else if (m.type === 'SYNC') {
                      syncState(m.data, false);
                      connsRef.current.forEach(conn => { if(conn.peer !== c.peer) conn.send({ type: 'SYNC', data: m.data }); });
                  } else if (m.type === 'REQ_COLOR_CHANGE') {
                      setPlayersList(prev => {
                          const nList = prev.map(pl => {
                              if (pl.id === m.targetId) return { ...pl, color: m.color };
                              return pl;
                          });
                          connsRef.current.forEach(conn => conn.send({ type: 'PLAYERS_UPDATE', players: nList }));
                          return nList;
                      });
                  } else if (m.type === 'REQ_NAME_CHANGE') {
                      setPlayersList(prev => {
                          const nList = prev.map(pl => {
                              if (pl.id === m.targetId) return { ...pl, name: m.name };
                              return pl;
                          });
                          connsRef.current.forEach(conn => conn.send({ type: 'PLAYERS_UPDATE', players: nList }));
                          return nList;
                      });
                  } else if (m.type === 'CURSOR') {
                      connsRef.current.forEach(conn => { if(conn.peer !== c.peer) conn.send(m); });
                      setCursors(prev => ({ ...prev, [m.uid]: { x: m.x, y: m.y } }));
                  } else if (m.type === 'CLICK') {
                      connsRef.current.forEach(conn => { if(conn.peer !== c.peer) conn.send(m); });
                      setRipples(prev => [...prev, { id: Date.now() + Math.random(), uid: m.uid, x: m.x, y: m.y, timestamp: Date.now() }]);
                  } else if (m.type === 'CHAT') {
                      appendChatMsg(m);
                      connsRef.current.forEach(conn => { if(conn.peer !== c.peer && conn.open) conn.send(m); });
                  } else if (m.type === 'MIC') {
                      handleMicMsg(m);
                      connsRef.current.forEach(conn => { if(conn.peer !== c.peer && conn.open) conn.send(m); });
                  } else if (m.type === 'RACE_PROGRESS') {
                      setRaceProgress(prev => ({ ...prev, [m.uid]: { progress: m.progress, name: m.name, color: m.color } }));
                      connsRef.current.forEach(conn => { if(conn.peer !== c.peer && conn.open) conn.send(m); });
                  } else if (m.type === 'RACE_FINISH') {
                      onRaceOpponentFinish(m.uid, m);
                      connsRef.current.forEach(conn => { if(conn.peer !== c.peer && conn.open) conn.send(m); });
                  } else if (m.type === 'BRAWL_STATE') {
                      setBrawlBoards(prev => ({ ...prev, [m.uid]: { bridges: m.bridges, progress: m.progress, name: m.name, color: m.color } }));
                      connsRef.current.forEach(conn => { if(conn.peer !== c.peer && conn.open) conn.send(m); });
                  } else if (m.type === 'BRAWL_ITEM') {
                      applyBrawlItem(m);
                      connsRef.current.forEach(conn => { if(conn.peer !== c.peer && conn.open) conn.send(m); });
                  } else if (m.type === 'BRAWL_MILESTONE') {
                      handleBrawlMilestone(m);
                  } else if (m.type === 'BRAWL_GRANT') {
                      applyBrawlGrant(m); // 來賓產生的島嶼禮物：房主自己是收件人時入包（applyBrawlGrant 內部驗 toUid）
                      connsRef.current.forEach(conn => { if (conn.peer !== c.peer && conn.open) conn.send(m); }); // 轉發給其他來賓（收件人可能在別台；非收件人入包時會自行忽略）
                  } else if (m.type === 'REQ_READY') {
                      setPlayersList(prev => {
                          const nList = prev.map(pl => pl.id === m.uid ? { ...pl, isReady: !!m.ready } : pl);
                          connsRef.current.forEach(conn => { if (conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: nList }); });
                          return nList;
                      });
                  } else if (m.type === 'REQ_SPECTATE') {
                      setPlayersList(prev => {
                          const nList = prev.map(pl => pl.id === m.uid ? { ...pl, isSpectator: !!m.spectator, isReady: false } : pl);
                          connsRef.current.forEach(conn => { if (conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: nList }); });
                          return nList;
                      });
                  } else if (m.type === 'REQ_PLAY_AGAIN') {
                      if (mpModeRef.current === 'race') { if (raceStateRef.current === 'finished') startRace(); }
                      else if (isWonRef.current) { hostCoopAgain(); }
                  } else if (m.type === 'REQ_TO_LOBBY') {
                      returnToLobby();
                  }
                });

                c.on('close', function() {
                    if (suppressCloseRef.current) return;
                    const inRaceNow = raceStateRef.current === 'countdown' || raceStateRef.current === 'racing';
                    if (c.uid && inRaceNow) {
                        markRacerDnf(c.uid);
                        connsRef.current.forEach(conn => { if (conn !== c && conn.open) conn.send({ type: 'RACE_DNF', uid: c.uid }); });
                        showToast("👋 一位選手斷線，比賽繼續");
                    }
                    connsRef.current = connsRef.current.filter(conn => conn.peer !== c.peer);
                    if (c.uid && !inRaceNow) { // 非比賽期間斷線才拔除名單並廣播
                        const goneUid = c.uid;
                        setRemoteVideos(prev => { const n = { ...prev }; delete n[goneUid]; return n; }); // 📹 移除視訊
                        setPlayersList(prev => {
                            const nList = prev.filter(pl => pl.id !== c.uid);
                            connsRef.current.forEach(conn => {
                                if (conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: nList });
                            });
                            return nList;
                        });
                    }
                });
              });
            });
            p.on('error', function(err) {
              if (isCreating && err && err.type === 'unavailable-id' && !hostRoomRetryRef.current) {
                // 固定代碼被佔用（多半是上次連線殘留）：換一組新代碼重試一次
                hostRoomRetryRef.current = true;
                clearHostRoom();
                hostCreateRoom();
                return;
              }
              setIsConnecting(false); setJoinStep('choose'); joinActiveRef.current = false; joinRoleRef.current = null; switchToOffline(); showToast("⚠️ 無法建立對局大廳，請重試");
            });
        } else {
            const guestP = new Peer();
            peerRef.current = guestP;
            guestP.on('call', handleIncomingCall); // 📹 視訊來電
            guestP.on('open', function() {
                const c = guestP.connect(rId + '-host');
                connRef.current = c;
                c.on('open', function() {
                  setIsHost(false); isHostRef.current = false;
                  setRoomId(rId);
                  // 新流程：一律先跟房主要已用名單，進 nick 步填完暱稱才 JOIN
                  guestNamesResolvedRef.current = false;
                  c.send({ type: 'GET_TAKEN_NAMES', uid: myId });
                  if (guestNamesTimeoutRef.current) { clearTimeout(guestNamesTimeoutRef.current); }
                  guestNamesTimeoutRef.current = setTimeout(() => {
                    if (!guestNamesResolvedRef.current && !guestJoinedRef.current && joinActiveRef.current) {
                      setTakenNames([]);
                      setIsConnecting(false);
                      setJoinStep('nick');
                      if (platAutoRef.current) { const nmT = platAutoRef.current.name; platAutoRef.current = null; guestSendJoin(nmT, false); }
                    }
                  }, 5000);
                });
                c.on('data', function(m) {
                  hostSeenRef.current = Date.now();
                  if (m.type === 'PONG') { return; }
                  if (m.type === 'INIT') {
                      if (m.players) setPlayersList(m.players);
                      if (m.data) syncState(m.data, false);
                      if (m.data && m.data.brawlSettings) applyBrawlSettings(m.data.brawlSettings, false);
                      setRoomOpen(!(m.data && m.data.coopStarted));
                      if (m.mpMode === 'race') {
                          setMpMode('race'); mpModeRef.current = 'race';
                          setRaceState('lobby'); raceStateRef.current = 'lobby';
                      }
                  } else if (m.type === 'SYNC') {
                      syncState(m.data, false);
                  } else if (m.type === 'PLAYERS_UPDATE') {
                      if (m.players) setPlayersList(m.players);
                  } else if (m.type === 'RACE_START') {
                      beginRace(m.data, m.startAt, m.racers, m.settings);
                  } else if (m.type === 'RACE_RESUME') {
                      beginRace(m.data, m.startAt, m.racers, m.settings);
                      if (m.bridges) setBridges(m.bridges);
                      const hRes = loadHashiResume(m.startAt); // 本地存檔優先（比房主快照新，且含道具/里程碑/禮物額度）
                      if (hRes) {
                        if (hRes.bridges && hRes.bridges.length) setBridges(hRes.bridges);
                        if (Array.isArray(hRes.items)) { myItemsRef.current = hRes.items; setMyItems(hRes.items); }
                        if (hRes.milestones) milestonesRef.current = hRes.milestones;
                        hashiGiftCreditRef.current = hRes.giftCredit || 0; hashiGiftUnitsRef.current = hRes.giftUnits || 0;
                      }
                      if (m.progress) setRaceProgress(m.progress);
                      if (m.results) { // 房主端的既有成績（完賽/DNF）一併帶回：beginRace 剛把本地成績清空，不補回來可能永遠湊不滿結算人數（稽核修）
                          const rr = {};
                          Object.keys(m.results).forEach(k => { if (k !== myId) rr[k] = m.results[k]; });
                          raceResultsRef.current = rr;
                          if (m.results[myId] && m.results[myId].timeMs != null) myFinishTimeRef.current = m.results[myId].timeMs; // 自己重整頁面回座：恢復自己的完賽時間（自己的成績不進 raceResultsRef，maybeFinalize 是分開計的）
                      }
                  } else if (m.type === 'RACE_UNDNF') {
                      if (raceResultsRef.current[m.uid] && raceResultsRef.current[m.uid].dnf) delete raceResultsRef.current[m.uid]; // 對手斷線又回座：撤銷 DNF，他完賽時才會被承認
                  } else if (m.type === 'RACE_PROGRESS') {
                      setRaceProgress(prev => ({ ...prev, [m.uid]: { progress: m.progress, name: m.name, color: m.color } }));
                  } else if (m.type === 'RACE_FINISH') {
                      onRaceOpponentFinish(m.uid, m);
                  } else if (m.type === 'RACE_DNF') {
                      markRacerDnf(m.uid);
                  } else if (m.type === 'BRAWL_STATE') {
                      setBrawlBoards(prev => ({ ...prev, [m.uid]: { bridges: m.bridges, progress: m.progress, name: m.name, color: m.color } }));
                  } else if (m.type === 'BRAWL_ITEM') {
                      applyBrawlItem(m);
                  } else if (m.type === 'BRAWL_GRANT') {
                      applyBrawlGrant(m);
                  } else if (m.type === 'BRAWL_SETTINGS') {
                      applyBrawlSettings(m.settings, false);
                  } else if (m.type === 'MP_MODE') {
                      setMpMode(m.mode); mpModeRef.current = m.mode;
                      if (m.mode === 'race') { setRaceState('lobby'); raceStateRef.current = 'lobby'; } else { setRaceState('idle'); raceStateRef.current = 'idle'; }
                  } else if (m.type === 'COOP_START') {
                      setRoomOpen(false);
                  } else if (m.type === 'TO_LOBBY') {
                      returnToLobbyLocal();
                  } else if (m.type === 'CURSOR') {
                      setCursors(prev => ({ ...prev, [m.uid]: { x: m.x, y: m.y } }));
                  } else if (m.type === 'CLICK') {
                      setRipples(prev => [...prev, { id: Date.now() + Math.random(), uid: m.uid, x: m.x, y: m.y, timestamp: Date.now() }]);
                  } else if (m.type === 'CHAT') {
                      appendChatMsg(m);
                  } else if (m.type === 'MIC') {
                      handleMicMsg(m);
                  } else if (m.type === 'TAKEN_NAMES') {
                      if (!guestNamesResolvedRef.current && !guestJoinedRef.current && joinActiveRef.current) {
                          if (guestNamesTimeoutRef.current) { clearTimeout(guestNamesTimeoutRef.current); guestNamesTimeoutRef.current = null; }
                          guestNamesResolvedRef.current = true;
                          setTakenNames((m.names || []).filter(n => n && n.trim()));
                          setIsConnecting(false);
                          setJoinStep('nick');
                          if (platAutoRef.current) { const nmG = platAutoRef.current.name; platAutoRef.current = null; guestSendJoin(nmG, false); }
                      }
                  } else if (m.type === 'JOIN_REJECTED' && m.reason === 'name_taken') {
                      handleJoinRejected(m);
                  } else if (m.type === 'REQ_REJOIN') {
                      connRef.current.send({ type: 'JOIN', pName: myNameRef.current, uid: myId, color: hubPlatColor() || myColorRef.current, auto: autoNameRef.current });
                  }
                });
                c.on('close', function() {
                    if (suppressCloseRef.current) return;
                    if (PLAT_MODE) { showToast("📡 房主連線中斷，正在自動重連…"); return; }
                    if (joinActiveRef.current) {
                        // 還在 join 流程（connecting/nick/拉霸機）→ 回 choose 步
                        showToast("⚠️ 連線中斷，請重試");
                        fullJoinCleanup();
                        return;
                    }
                    if (raceStateRef.current !== 'idle') { showToast("⚠️ 對手斷線，大亂鬥結束"); exitRaceToSolo(); }
                    else { showToast("⚠️ 主機已離線，切換為單機模式"); switchToOffline(); }
                });
            });
            guestP.on('error', function() {
              if (joinActiveRef.current) {
                showToast("⚠️ 無法連線，請確認代碼是否正確");
                fullJoinCleanup();
              } else {
                setIsConnecting(false); switchToOffline();
                showToast("⚠️ 無法連線，請確認代碼是否正確");
              }
            });
        }
      };

      const handleGoHome = (platLeave) => {
        setRoomOpen(false);
        // platLeave==='leave'：連線模式個人退出（只有自己回大廳、其他人繼續、房主退出由殼接管）；其餘走舊語義（房主帶全員回等待室）
        if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY(platLeave === 'leave' ? 'player-leave' : 'game-exit');
        if (engineRef.current !== 'none') {
            if (!isHostRef.current && engineRef.current === 'peerjs' && connRef.current) {
               // 有禮貌地先傳送退出訊號給房主，再關閉連線
               connRef.current.send({ type: 'LEAVE', uid: myId });
               const pToKill = peerRef.current;
               setTimeout(() => {
                   if (pToKill) { try { pToKill.destroy(); } catch (e) {} }
                   if (peerRef.current === pToKill) peerRef.current = null;
               }, 100);
            } else {
               if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
            }
        }
        switchToOffline(); setScreen('home'); setIsWon(false); setEndTime(null); setHistory([]);
        setIsDailyMode(false); isDailyModeRef.current = false;
        setRaceState('idle'); raceStateRef.current = 'idle';
        setRaceWaiting(false); setRaceResult(null); setRaceCountdown(null); setRaceProgress({});
        raceResultsRef.current = {}; myFinishTimeRef.current = null;
        fxRef.current = { fog: {}, boxes: [], marks: [] }; setFxFog({}); setFxFogBoxes([]); setFxMarks([]); // 道具特效也要清：回主畫面後 8-10 秒內開單機/合作局，上一局的霧會直接漏進新局（其他離場路徑都有清，獨漏這條，稽核修）
        resetWinMeta();
      };

      // ==================== 🏁 競速模式 ====================
      const startRace = () => {
        if (!isHostRef.current) return;
        // 開賽時清掉仍未到的五戰預期席位（遲到者進場會以觀戰者加入，不卡結算）
        let curListH = playersListRef.current;
        if ((curListH || []).some(p => p.pending)) {
          curListH = curListH.filter(p => !p.pending);
          setPlayersList(curListH);
          connsRef.current.forEach(c => { if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: curListH }); });
        }
        const racers = curListH.filter(p => !p.isSpectator);
        if (racers.length < 2) return;
        const st = brawlSettingsRef.current;
        const def = LEVELS.find(l => l.id === st.sizeId) || LEVELS[1];
        const cdims = (st.sizeId === 'custom' && customDimsRef.current) ? customDimsRef.current : null;
        const targetLevelDef = { id: def.id, name: def.name, width: cdims ? cdims.w : def.width, height: cdims ? cdims.h : def.height, description: "🏁 大亂鬥專用題目，祝好運！" };
        const newRandomData = HASHI_PUZZLE.generateUniqueHashi(targetLevelDef);
        const empty = HASHI_PUZZLE.generateEmptyBridges(newRandomData);
        const startAt = Date.now() + 3500;
        const payload = { randomLevelData: newRandomData, bridges: empty, levelId: def.id, showSolution: false, startTime: startAt, strokes: [] };
        const racersIds = racers.map(p => p.id);
        connsRef.current.forEach(c => { if (c.open) c.send({ type: 'RACE_START', data: payload, startAt: startAt, racers: racersIds, settings: st }); });
        beginRace(payload, startAt, racersIds, st);
      };

      // 回等待室（房主廣播全員；來賓收到 TO_LOBBY 也走這支本地版）
      const returnToLobbyLocal = () => {
        // 回等待室先清除全員準備狀態（比照數獨），避免一回房就被自動開始拉走
        setPlayersList(prev => prev.map(pl => ({ ...pl, isReady: false })));
        if (isHostRef.current) {
          const nList = playersListRef.current.map(pl => ({ ...pl, isReady: false }));
          connsRef.current.forEach(c => { if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: nList }); });
        }
        setRaceState('lobby'); raceStateRef.current = 'lobby';
        setRaceWaiting(false); setRaceResult(null); setRaceCountdown(null);
        setRaceProgress({}); raceResultsRef.current = {}; myFinishTimeRef.current = null;
        myItemsRef.current = []; setMyItems([]); setBrawlBoards({}); setGodViewUid(null);
        fxRef.current = { fog: {}, boxes: [], marks: [] }; setFxFog({}); setFxFogBoxes([]); setFxMarks([]);
        setRoomOpen(true);
      };
      const returnToLobby = () => {
        if (isHostRef.current) connsRef.current.forEach(c => { if (c.open) c.send({ type: 'TO_LOBBY' }); });
        returnToLobbyLocal();
      };
      // 合作再來一局（房主）：同關卡重生成 + 廣播 COOP_START 讓全員一起重開
      const hostCoopAgain = () => {
        const lv = LEVELS.find(l => l.id === (stateRef.current.levelId || currentLevelId)) || LEVELS[1];
        applyCoopLevel(lv);
        stateRef.current = { ...stateRef.current, coopStarted: true };
        connsRef.current.forEach(c => { if (c.open) c.send({ type: 'COOP_START' }); });
        setRoomOpen(false);
      };
      // 結算「再來一局」：房主直接重開；來賓送請求給房主（全員同進退，不回等待室）
      const playAgain = () => {
        if (engineRef.current !== 'peerjs') { handleRegenerateRandom(); return; }
        if (isHostRef.current) {
          if (mpModeRef.current === 'race') startRace(); else hostCoopAgain();
        } else if (connRef.current && connRef.current.open) {
          connRef.current.send({ type: 'REQ_PLAY_AGAIN' });
          showToast('已向房主送出再來一局請求');
        }
      };
      // 結算「回等待室」：來賓送請求，房主帶全員一起回
      const requestLobby = () => {
        if (platHubRef.current) { if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY('game-exit'); return; } // 平台房間框架：回等待室＝回殼的房間頁（房主帶全員、來賓只回自己）
        if (isHostRef.current) { returnToLobby(); return; }
        if (connRef.current && connRef.current.open) {
          connRef.current.send({ type: 'REQ_TO_LOBBY' });
          showToast('已向房主送出回等待室請求');
        }
      };
      const startCoop = () => {
        if (!isHostRef.current) return;
        stateRef.current = { ...stateRef.current, coopStarted: true };
        connsRef.current.forEach(c => { if (c.open) c.send({ type: 'COOP_START' }); });
        setRoomOpen(false);
        showToast('🤝 合作開始！');
      };
      const applyCoopLevel = (levelDef) => {
        if (!isHostRef.current) return;
        const data = HASHI_PUZZLE.generateUniqueHashi(levelDef);
        const empty = HASHI_PUZZLE.generateEmptyBridges(data);
        syncState({ randomLevelData: data, bridges: empty, levelId: levelDef.id, showSolution: false, strokes: [], startTime: Date.now() });
        setIsWon(false); setEndTime(null); resetWinMeta();
      };
      const setMyReady = (v) => {
        setPlayersList(prev => prev.map(pl => pl.id === myId ? { ...pl, isReady: v } : pl));
        if (isHostRef.current) {
          const nList = playersListRef.current.map(pl => pl.id === myId ? { ...pl, isReady: v } : pl);
          connsRef.current.forEach(c => { if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: nList }); });
        } else if (connRef.current && connRef.current.open) {
          connRef.current.send({ type: 'REQ_READY', uid: myId, ready: v });
        }
      };
      const setMySpectator = (v) => {
        setPlayersList(prev => prev.map(pl => pl.id === myId ? { ...pl, isSpectator: v, isReady: false } : pl));
        if (isHostRef.current) {
          const nList = playersListRef.current.map(pl => pl.id === myId ? { ...pl, isSpectator: v, isReady: false } : pl);
          connsRef.current.forEach(c => { if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: nList }); });
        } else if (connRef.current && connRef.current.open) {
          connRef.current.send({ type: 'REQ_SPECTATE', uid: myId, spectator: v });
        }
      };
      const setMpModeHost = (mode) => {
        if (!isHostRef.current) return;
        setMpMode(mode); mpModeRef.current = mode;
        if (mode === 'race') { setRaceState('lobby'); raceStateRef.current = 'lobby'; } else { setRaceState('idle'); raceStateRef.current = 'idle'; }
        connsRef.current.forEach(c => { if (c.open) c.send({ type: 'MP_MODE', mode: mode }); });
      };

      const beginRace = (payload, startAt, racersIds, settings) => {
        if (settings) applyBrawlSettings(settings, false);
        const rIds = racersIds || playersListRef.current.filter(p => !p.isSpectator).map(p => p.id);
        racersRef.current = rIds;
        setRaceRacers(rIds);
        stateRef.current = { ...stateRef.current, racers: rIds };
        setRoomOpen(false);
        const seq = ++raceSeqRef.current;
        if (rIds.indexOf(myId) < 0) {
          // 👁️ 觀戰者：不進賽局，改看上帝視角面板
          setRandomLevelData(payload.randomLevelData);
          setCurrentLevelId(payload.levelId || 2);
          stateRef.current = { ...stateRef.current, ...payload };
          setBrawlBoards({}); setGodViewUid(null);
          setRaceResult(null); setRaceWaiting(false);
          raceResultsRef.current = {}; // 觀戰者也要清上一場成績/進度：不清的話新局第一筆 RACE_FINISH 會被舊紀錄擋下、maybeFinalize 還會拿舊成績提前結算（稽核修，選手分支本來就有清）
          const seedS = {};
          playersListRef.current.forEach(p => { seedS[p.id] = { progress: 0, name: p.name, color: p.color }; });
          if (!seedS[myId]) seedS[myId] = { progress: 0, name: (myNameRef.current || '你'), color: myColorRef.current };
          setRaceProgress(seedS);
          myItemsRef.current = []; setMyItems([]);
          setRaceState('spectating'); raceStateRef.current = 'spectating';
          levelDimRef.current = { w: payload.randomLevelData.width, h: payload.randomLevelData.height };
          return;
        }
        setRandomLevelData(payload.randomLevelData);
        setBridges(payload.bridges || HASHI_PUZZLE.generateEmptyBridges(payload.randomLevelData)); // RACE_RESUME 的 data 不含 bridges（在 m.bridges 兄弟欄位），缺值時先給空盤，後續 handler 會再覆蓋快照；不可 set undefined，render 的 useMemo 會炸
        setCurrentLevelId(payload.levelId || 2);
        setShowSolution(false);
        setStrokes([]);
        setHistory([]);
        setStartTime(startAt);
        setEndTime(null);
        setIsWon(false); setHideVictoryModal(false);
        resetWinMeta();
        setConfetti([]);
        raceStartAtRef.current = startAt;
        myFinishTimeRef.current = null;
        raceResultsRef.current = {};
        setRaceResult(null); setRaceWaiting(false); setRaceCountdown(null);
        lastProgressValRef.current = -1; lastProgressSentRef.current = 0;
        myItemsRef.current = []; setMyItems([]); milestonesRef.current = {}; hostMilestonesRef.current = {}; lastOneRef.current = false; hashiGiftCreditRef.current = 0; hashiGiftUnitsRef.current = 0;
        setBrawlBoards({}); setGodViewUid(null);
        fxRef.current = { fog: {}, boxes: [], marks: [] }; setFxFog({}); setFxFogBoxes([]); setFxMarks([]);
        stateRef.current = { ...stateRef.current, ...payload };
        const seed = {};
        playersListRef.current.forEach(p => { seed[p.id] = { progress: 0, name: p.name, color: p.color }; });
        if (!seed[myId]) seed[myId] = { progress: 0, name: (myNameRef.current || '你'), color: myColorRef.current };
        setRaceProgress(seed);
        setCursors({}); // 🏁 競速開始：清掉大廳殘留的游標（競速模式不顯示游標，防作弊）
        levelDimRef.current = { w: payload.randomLevelData.width, h: payload.randomLevelData.height };
        setBoardFadeKey(k => k + 1); scheduleFitZoom();
        setRaceState('countdown'); raceStateRef.current = 'countdown';
        const now = Date.now() + platTimeOffset(); // startAt 是房主時鐘的絕對時刻：以校正後時間排倒數（D-05）
        [3, 2, 1].forEach(n => {
          const delay = Math.max(0, (startAt - n * 1000) - now);
          setTimeout(() => {
            if (raceSeqRef.current !== seq || raceStateRef.current !== 'countdown') return;
            setRaceCountdown(n);
          }, delay);
        });
        setTimeout(() => {
          if (raceSeqRef.current !== seq || raceStateRef.current !== 'countdown') return;
          setRaceCountdown(0);
          setRaceState('racing'); raceStateRef.current = 'racing';
          setTimeout(() => { if (raceSeqRef.current === seq) setRaceCountdown(null); }, 900);
        }, Math.max(0, startAt - now));
      };

      const onRaceSelfFinish = (timeMs) => {
        sendBrawlMsg({ type: 'BRAWL_STATE', uid: myId, name: (myNameRef.current || '你'), color: myColorRef.current, progress: 1, bridges: stateRef.current.bridges });
        myFinishTimeRef.current = timeMs;
        finishResentRef.current = 0;
        const msg = { type: 'RACE_FINISH', uid: myId, name: (myNameRef.current || '你'), color: myColorRef.current, timeMs: timeMs };
        if (isHostRef.current) { connsRef.current.forEach(c => { if (c.open) c.send(msg); }); }
        else if (connRef.current && connRef.current.open) { connRef.current.send(msg); }
        if (!maybeFinalize()) {
          setRaceWaiting(true);
          showToast("🏁 你完成了！已自動轉為上帝模式觀戰");
        }
      };

      const onRaceOpponentFinish = (uid, m) => {
        if (raceResultsRef.current[uid]) return;
        raceResultsRef.current[uid] = { name: (m.name || '對手'), color: m.color, timeMs: m.timeMs };
        if (!maybeFinalize()) {
          if (myFinishTimeRef.current == null && raceStateRef.current === 'racing') showToast("🏁 " + (m.name || '對手') + " 已完成！加油！");
          maybeConvertLastOne(); // 對手完賽後若只剩我 → 庫存攻擊道具轉禮物
        }
      };

      // 選手中途離開/斷線：記為 DNF（未完成，保留最後進度），比賽繼續，其他人照常結算
      const markRacerDnf = (uid) => {
        if (!uid) return;
        if (raceStateRef.current !== 'countdown' && raceStateRef.current !== 'racing') return;
        if ((racersRef.current || []).indexOf(uid) < 0) return;
        if (raceResultsRef.current[uid]) return;
        const prog = raceProgressRef.current || {};
        const pl = (playersListRef.current || []).find(x => x.id === uid);
        raceResultsRef.current[uid] = { name: pl ? pl.name : (prog[uid] ? prog[uid].name : '玩家'), color: pl ? pl.color : (prog[uid] ? prog[uid].color : '#94a3b8'), timeMs: null, dnf: true, progress: prog[uid] ? prog[uid].progress : 0 };
        maybeFinalize();
        maybeConvertLastOne(); // 對手離場後若只剩我 → 同樣轉換（他若回座不追回，比照結算把 DNF 當出局）
      };

      // 數橋的結算：全員完賽或 DNF 才結算（沒有數獨那種「去第幾名」設定）；未完成者以進度排名
      const maybeFinalize = () => {
        if (raceStateRef.current === 'finished') return true;
        const racers = racersRef.current || [];
        if (!racers.length) return false;
        const finCount = (myFinishTimeRef.current != null && racers.indexOf(myId) >= 0 ? 1 : 0) + Object.keys(raceResultsRef.current).filter(uid => racers.indexOf(uid) >= 0).length;
        if (finCount >= racers.length) { finalizeRace(); return true; }
        return false;
      };

      const finalizeRace = () => {
        const prog = raceProgressRef.current || {};
        const nameOf = (uid) => { const p = playersListRef.current.find(x => x.id === uid); return p ? p.name : (prog[uid] ? prog[uid].name : '玩家'); };
        const colorOf = (uid) => { const p = playersListRef.current.find(x => x.id === uid); return p ? p.color : (prog[uid] ? prog[uid].color : '#94a3b8'); };
        const entries = [];
        if (myFinishTimeRef.current != null && racersRef.current.indexOf(myId) >= 0) entries.push({ uid: myId, name: (myNameRef.current || '你'), color: myColorRef.current, timeMs: myFinishTimeRef.current, finished: true });
        Object.keys(raceResultsRef.current).forEach(uid => {
          if (racersRef.current.indexOf(uid) < 0) return;
          const r = raceResultsRef.current[uid];
          if (r.dnf) return; // DNF 走下方未完成桶
          entries.push({ uid: uid, name: r.name, color: r.color, timeMs: r.timeMs, finished: true });
        });
        entries.sort((a, b) => a.timeMs - b.timeMs);
        const finUids = {}; entries.forEach(e => { finUids[e.uid] = true; });
        const dnf = racersRef.current.filter(uid => !finUids[uid]).map(uid => { const rr = raceResultsRef.current[uid]; return { uid: uid, name: nameOf(uid), color: colorOf(uid), progress: (rr && rr.progress != null) ? rr.progress : (prog[uid] ? prog[uid].progress : 0), finished: false }; });
        dnf.sort((a, b) => b.progress - a.progress);
        const all = entries.concat(dnf);
        if (myFinishTimeRef.current != null) {
          const islCount = ((stateRef.current.randomLevelData && stateRef.current.randomLevelData.islands) || []).length || 1;
          const s = computeStars(Math.floor(myFinishTimeRef.current / 1000), islCount, false);
          setStars(s);
        } else setStars(0);
        setRaceResult({ winnerUid: all.length ? all[0].uid : null, entries: all });
        setRaceWaiting(false);
        setRaceState('finished'); raceStateRef.current = 'finished';
      };

      const exitRaceToSolo = () => {
        setRoomOpen(false);
        myItemsRef.current = []; setMyItems([]); setBrawlBoards({}); setGodViewUid(null);
        fxRef.current = { fog: {}, boxes: [], marks: [] }; setFxFog({}); setFxFogBoxes([]); setFxMarks([]);
        setRaceState('idle'); raceStateRef.current = 'idle';
        setRaceWaiting(false); setRaceResult(null); setRaceCountdown(null); setRaceProgress({});
        raceResultsRef.current = {}; myFinishTimeRef.current = null;
        switchToOffline();
      };
      // ================== 🏁 競速模式結束 ==================

      const handlePlayerColorChange = (playerId, newColor) => {
        if (engineRef.current === 'none') return;

        if (engineRef.current === 'peerjs') {
            if (isHostRef.current) {
                setPlayersList(prev => {
                    const nList = prev.map(p => {
                        if (p.id === playerId) return { ...p, color: newColor };
                        return p;
                    });
                    connsRef.current.forEach(c => c.send({ type: 'PLAYERS_UPDATE', players: nList }));
                    return nList;
                });
            } else if (connRef.current) {
                connRef.current.send({ type: 'REQ_COLOR_CHANGE', targetId: playerId, color: newColor });
            }
        }
      };

      // 改名（比照數獨 handlePlayerNameChange）：房主直接改名單並廣播；來賓送 REQ_NAME_CHANGE 請房主改
      const handlePlayerNameChange = (playerId, newName) => {
        if (engineRef.current === 'none') { setPlayersList(prev => prev.map(p => p.id === playerId ? { ...p, name: newName } : p)); }
        else if (engineRef.current === 'peerjs') {
            if (isHostRef.current) { const nList = playersListRef.current.map(p => p.id === playerId ? { ...p, name: newName } : p); setPlayersList(nList); connsRef.current.forEach(c => { if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: nList }); }); }
            else if (connRef.current) connRef.current.send({ type: 'REQ_NAME_CHANGE', targetId: playerId, name: newName });
        }
        showToast("✅ 暱稱修改成功！");
      };

      useEffect(function() {
        const islands = (randomLevelData && randomLevelData.islands) ? randomLevelData.islands : [];
        if (islands.length === 0) {
            if (isWon) { setIsWon(false); setEndTime(null); }
            return;
        }

        let allCountsMatch = true;
        for (let i=0; i<islands.length; i++) {
           if (islandCurrentCounts[islands[i].id].real !== islands[i].req) { allCountsMatch = false; break; }
        }
        if (!allCountsMatch) {
            if (isWon) { setIsWon(false); setEndTime(null); }
            return;
        }

        const adjList = {}; islands.forEach(i => { adjList[i.id] = []; });
        (bridges || []).forEach(b => {
           if (b.count > 0 && adjList[b.from] && adjList[b.to]) {
               adjList[b.from].push(b.to); adjList[b.to].push(b.from);
           }
        });
        const visited = new Set(); const queue = [islands[0].id];
        if (queue.length > 0) visited.add(queue[0]);
        while (queue.length > 0) {
          const curr = queue.shift();
          if (adjList[curr]) {
            adjList[curr].forEach(neighbor => { if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); } });
          }
        }
        if (visited.size === islands.length && islands.length > 0) {
            if (!isWon) {
                setIsWon(true);
                setEndTime(Date.now());
                setHideVictoryModal(false);
                const secs = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
                if (raceStateRef.current === 'racing') {
                    // 🏁 競速完賽：記錄個人成績並通知對手，不播標準勝利音效
                    const timeMs = Math.max(0, Date.now() + platTimeOffset() - raceStartAtRef.current); // 以房主時鐘校正後計算（D-05：各裝置時鐘差不再系統性偏袒時鐘慢的一方）
                    recordBest(Math.max(0, Math.floor(timeMs / 1000)));
                    try { platAudio().play('complete'); } catch (e) {} // 競速個人完賽＝complete（新規格；舊制此處刻意不播勝利音，complete 為柔和兩音、非舊勝利 jingle）
                    onRaceSelfFinish(timeMs);
                } else {
                    try { platAudio().play('complete'); } catch (e) {} // 單機/合作個人完賽＝complete（PlatAudio，v1.64.0）
                    const s = computeStars(secs, islands.length, showSolution);
                    setStars(s);
                    recordBest(secs);
                    if (isDailyModeRef.current) {
                        recordDailyWin(secs);
                    }
                }
            }
        } else {
            if (isWon) { setIsWon(false); setEndTime(null); }
        }
      }, [bridges, randomLevelData, islandCurrentCounts, isWon]);

      const handleSaveCode = () => {
        const saveData = {
            lid: currentLevelId,
            r: randomLevelData,
            b: (bridges || []).filter(br => br.count > 0 || (br.draftCount || 0) > 0).map(br => ({ i: br.id, c: br.count, d: br.draftCount || 0, o: br.owner })),
            s: strokes
        };
        const code = btoa(encodeURIComponent(JSON.stringify(saveData)));
        setSaveCode(code);
        const textArea = document.createElement("textarea"); textArea.value = code; document.body.appendChild(textArea); textArea.select();
        try { document.execCommand('copy'); showToast("✅ 已產生並複製代碼！"); } catch (err) {}
        document.body.removeChild(textArea);
      };

      const handleQuickPaste = async () => {
        try { if (navigator.clipboard && navigator.clipboard.readText) { const text = await navigator.clipboard.readText(); if(text) { setSaveCode(text); showToast("✅ 貼上成功！"); } } else { throw new Error(); } }
        catch (err) { const ta = document.getElementById("saveCodeTextarea"); if (ta) ta.focus(); showToast("⚠️ 瀏覽器阻擋自動貼上，請手動貼上"); }
      };

      const handleLoadCode = () => {
        try {
          if (!saveCode.trim()) return showToast("⚠️ 請貼上代碼");
          const data = JSON.parse(decodeURIComponent(atob(saveCode.trim())));

          let baseLevel, newRandom;
          if (data.lid === 'custom' || data.lid === 'daily') {
              baseLevel = { id: data.lid, name: data.lid === 'daily' ? `📅 每日一題` : `⚙️ 自訂尺寸`, islands: (data.r && data.r.islands) ? data.r.islands : [] };
              newRandom = data.r;
          } else {
              baseLevel = LEVELS.find(l => l.id === data.lid);
              if (!baseLevel) return showToast("⚠️ 無效的代碼");
              newRandom = data.r;
          }

          const islandsToUse = newRandom && newRandom.islands ? newRandom.islands : baseLevel.islands;
          const emptyBridges = HASHI_PUZZLE.generateEmptyBridges({ islands: islandsToUse });

          data.b.forEach(savedBr => { let tb = emptyBridges.find(eb => eb.id === savedBr.i); if (tb) { tb.count = savedBr.c || 0; tb.draftCount = savedBr.d || 0; tb.owner = savedBr.o; } });
          setCurrentLevelId(data.lid);
          syncState({ randomLevelData: newRandom, bridges: emptyBridges, strokes: data.s || [], showSolution: false });
          setIsWon(false); setShowSaveModal(false); showToast("✅ 讀取成功！");
        } catch(e) { showToast("⚠️ 讀檔失敗！"); }
      };

      // G2（v1.57.0，比照數獨 F3）：按鈕觸發的縮放加 200ms travel 過渡——先在 svg 掛 transition 再改尺寸；
      // 260ms 後自動卸下，雙指捏合（handleTouchMove）走另一條路、維持即時跟手。連按重掛即可 retarget。
      const zoomAnimTimerRef = useRef(null);
      const armZoomTransition = () => { platArmZoom(svgRef.current); }; // 過渡武裝收編 PlatZoom.armTransition（v1.63.0，語意守恆）

      const handleZoomIn = () => {
          armZoomTransition();
          let newZoom = pz().add(0.3);
          userZoomedRef.current = true;

          if (svgW * newZoom > MAX_SAFE_DIMENSION || svgH * newZoom > MAX_SAFE_DIMENSION) {
              newZoom = Math.min(MAX_SAFE_DIMENSION / svgW, MAX_SAFE_DIMENSION / svgH);
              showToast("⚠️ 已達此設備顯示極限，無法再放大");
          }

          zoomLevelRef.current = newZoom;
          setZoomLevel(newZoom);
          setZoomModeIdx(0);
          zoomModeIdxRef.current = 0;
          if (svgRef.current) {
              svgRef.current.style.width = `${svgW * newZoom}px`;
              svgRef.current.style.height = `${svgH * newZoom}px`;
          }
      };
      const handleZoomOut = () => {
          armZoomTransition();
          let newZoom = pz().add(-0.3);
          userZoomedRef.current = true;
          zoomLevelRef.current = newZoom;
          setZoomLevel(newZoom);
          setZoomModeIdx(0);
          zoomModeIdxRef.current = 0;
          if (svgRef.current) {
              svgRef.current.style.width = `${svgW * newZoom}px`;
              svgRef.current.style.height = `${svgH * newZoom}px`;
          }
      };
      const handleZoomReset = () => {
          armZoomTransition();
          pz().reset();
          zoomLevelRef.current = 1;
          userZoomedRef.current = true;
          setZoomLevel(1);
          setZoomModeIdx(0);
          zoomModeIdxRef.current = 0;
          if (svgRef.current) {
              svgRef.current.style.width = `${svgW}px`;
              svgRef.current.style.height = `${svgH}px`;
          }
      };

      // === 題目自動適應螢幕（新題目 / 旋轉螢幕時呼叫） ===
      const applyFitZoom = () => {
        const container = zoomContainerRef.current;
        if (!container) return false;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        if (!cw || !ch) return false;
        const { w, h } = levelDimRef.current;
        const sW = (w - 1) * SCALE + PADDING * 2;
        const sH = (h - 1) * SCALE + PADDING * 2;
        // clientWidth 含容器 padding，盤面實際可用空間要扣掉容器與內層包裝的 padding，
        // 否則手機上盤面會比可視區寬一點點、最右欄被切掉（2026-10-17 修）
        const cs = window.getComputedStyle(container);
        const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
        const wrapEl = container.firstElementChild;
        let wrapPadR = 0, wrapPadB = 0;
        if (wrapEl) { const ws = window.getComputedStyle(wrapEl); wrapPadR = parseFloat(ws.paddingRight) || 0; wrapPadB = parseFloat(ws.paddingBottom) || 0; }
        const availW = Math.max(50, cw - padX - wrapPadR);
        const availH = Math.max(50, ch - padY - wrapPadB);
        const paddingFactor = 0.98;
        let newZoom = Math.min(availW / sW, availH / sH) * paddingFactor;
        newZoom = pz().set(newZoom, [0.2, 3.5]);
        if (sW * newZoom > MAX_SAFE_DIMENSION || sH * newZoom > MAX_SAFE_DIMENSION) {
            newZoom = Math.min(MAX_SAFE_DIMENSION / sW, MAX_SAFE_DIMENSION / sH);
        }
        userZoomedRef.current = false;
        zoomLevelRef.current = newZoom;
        setZoomLevel(newZoom);
        setZoomModeIdx(3);
        zoomModeIdxRef.current = 3;
        if (svgRef.current) {
            svgRef.current.style.width = `${sW * newZoom}px`;
            svgRef.current.style.height = `${sH * newZoom}px`;
        }
        // 保底：若實際捲動寬度仍大於可視寬度，依比例縮到剛好（只縮不放大）
        if (container.scrollWidth > container.clientWidth + 1 && sW * newZoom > 0) {
            const fix = container.clientWidth / container.scrollWidth;
            if (fix < 1) {
                newZoom = newZoom * fix;
                zoomLevelRef.current = newZoom;
                setZoomLevel(newZoom);
                if (svgRef.current) {
                    svgRef.current.style.width = `${sW * newZoom}px`;
                    svgRef.current.style.height = `${sH * newZoom}px`;
                }
            }
        }
        return true;
      };
      const scheduleFitZoom = () => {
        // 等 DOM 穩定再量測；量不到就 350ms 後重試一次
        setTimeout(() => {
            requestAnimationFrame(() => {
                if (!applyFitZoom()) {
                    setTimeout(() => requestAnimationFrame(() => { applyFitZoom(); }), 350);
                }
            });
        }, 60);
      };

      const handleCycleZoom = () => {
        armZoomTransition();
        const nextIdx = (zoomModeIdxRef.current + 1) % 4;
        setZoomModeIdx(nextIdx);
        zoomModeIdxRef.current = nextIdx;
        userZoomedRef.current = true; // 手動縮放

        const container = zoomContainerRef.current;
        if (!container) return;

        const paddingFactor = 0.95;
        const cw = container.clientWidth;
        const ch = container.clientHeight;

        let newZoom = 1;
        if (nextIdx === 0) {
          newZoom = 1;
          showToast("🔍 原始大小 (1x)");
        } else if (nextIdx === 1) {
          newZoom = (cw / svgW) * paddingFactor;
          showToast("↔️ 適應螢幕寬度");
        } else if (nextIdx === 2) {
          newZoom = (ch / svgH) * paddingFactor;
          showToast("↕️ 適應螢幕長度");
        } else if (nextIdx === 3) {
          newZoom = Math.min(cw / svgW, ch / svgH) * paddingFactor;
          showToast("🔲 長寬自動適應");
        }

        newZoom = pz().set(newZoom, [0.2, 3.5]);

        if (svgW * newZoom > MAX_SAFE_DIMENSION || svgH * newZoom > MAX_SAFE_DIMENSION) {
            newZoom = Math.min(MAX_SAFE_DIMENSION / svgW, MAX_SAFE_DIMENSION / svgH);
        }

        zoomLevelRef.current = newZoom;
        setZoomLevel(newZoom);

        if (svgRef.current) {
            svgRef.current.style.width = `${svgW * newZoom}px`;
            svgRef.current.style.height = `${svgH * newZoom}px`;
        }
      };

      // === 首次教學導覽 overlay（可在任何畫面開啟） ===
      const closeTutorial = () => {
        platSave().setStr('hashi_tutorial_seen', '1');
        setShowTutorial(false);
      };
      // ===== 👆 架橋教學動畫（兩幕：拖曳 → 點擊三連拍） =====
      const BridgeDemo = () => (
        <div className="bdemo mb-4" aria-hidden="true">
          <div className="bdemo-section bdemo-sec1">拖曳</div>
          <div className="bdemo-section bdemo-sec2">點擊</div>
          <div className="bdemo-label bdemo-l1">👆 按住拖曳，放開架橋</div>
          <div className="bdemo-label bdemo-l2">點一下：1 座橋</div>
          <div className="bdemo-label bdemo-l3">點兩下：2 座橋</div>
          <div className="bdemo-label bdemo-l4">點三下：取消</div>
          <div className="bdemo-scene">
            <div className="bdemo-island" style={{ left: '30px' }}>3</div>
            <div className="bdemo-island" style={{ left: '210px' }}>2</div>
            <div className="bdemo-preview"></div>
            <div className="bdemo-bridge bdemo-b1"></div>
            <div className="bdemo-bridge bdemo-bd1"></div>
            <div className="bdemo-bridge bdemo-bd2"></div>
            <div className="bdemo-finger">👆</div>
            <div className="bdemo-ripple"></div>
          </div>
        </div>
      );

      // ===== ✏️ 草稿教學動畫：虛線兩法 → 切畫筆一點變實線 =====
      const DraftDemo = () => (
        <div className="bdemo mb-4" aria-hidden="true">
          <div className="bdemo-label ddemo-l1">✏️ 草稿：拖曳畫出虛線</div>
          <div className="bdemo-label ddemo-l2">👆 點擊：點兩下 2 條虛線</div>
          <div className="bdemo-label ddemo-l3">切回畫筆模式 ✎</div>
          <div className="bdemo-label ddemo-l4">點一下：虛線直接變實線！</div>
          <div className="bdemo-scene">
            <div className="ddemo-mode"><span className="ddemo-m ddemo-m-draft">✏️ 草稿</span><span className="ddemo-m ddemo-m-pen">✎ 畫筆</span></div>
            <div className="bdemo-island" style={{ left: '30px' }}>3</div>
            <div className="bdemo-island" style={{ left: '210px' }}>2</div>
            <div className="bdemo-preview ddemo-preview"></div>
            <div className="ddemo-dash ddemo-db1"></div>
            <div className="ddemo-dash ddemo-dbA"></div>
            <div className="ddemo-dash ddemo-dbB"></div>
            <div className="bdemo-bridge ddemo-sbA"></div>
            <div className="bdemo-bridge ddemo-sbB"></div>
            <div className="bdemo-finger ddemo-finger">👆</div>
            <div className="bdemo-ripple ddemo-ripple"></div>
          </div>
        </div>
      );

      // ===== 🔌 連線教學動畫：房主建房拿代碼 → 代碼飛給朋友 → 朋友輸入加入 → 成功 =====
      const ConnectDemo = () => (
        <div className="conn-demo mb-4" aria-hidden="true">
          <div className="conn-phone conn-host">
            <div className="conn-ptitle">🏠 房主</div>
            <div className="conn-btn">建立房間</div>
            <div className="conn-code"><span>1</span><span>2</span><span>3</span><span>4</span></div>
          </div>
          <div className="conn-wire"><div className="conn-chip">1234</div></div>
          <div className="conn-phone conn-guest">
            <div className="conn-ptitle">🚪 朋友</div>
            <div className="conn-input"><span>1</span><span>2</span><span>3</span><span>4</span></div>
            <div className="conn-btn">加入房間</div>
          </div>
          <div className="conn-success">✅ 連線成功！</div>
        </div>
      );

      const openTutorial = () => {
        setTutorialStep(0);
        setShowTutorial(true);
      };

      const tutorialOverlay = showTutorial ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4" onClick={closeTutorial}>
          <div className="bg-[#fffaf0] border-4 border-slate-800 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,1)] max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeTutorial} className="absolute top-3 right-3 w-11 h-11 rounded-full bg-white border-4 border-slate-800 text-xl font-black text-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] z-20 flex items-center justify-center">✕</button>
            <h2 className="text-3xl font-black text-slate-800 border-b-8 border-[#4ade80] pb-2 inline-block mb-5 relative z-10">❓ 玩法教學</h2>
            <div className="bg-white border-[3px] border-slate-800 rounded-xl p-4 mb-4 shadow-[4px_4px_0px_rgba(30,41,59,1)] h-[400px] flex flex-col">
              <div className="h-[196px] shrink-0 flex items-center justify-center overflow-hidden w-full">
                {TUTORIAL_STEPS[tutorialStep].demo === 'connect' && <div className="w-full"><ConnectDemo /></div>}
                {TUTORIAL_STEPS[tutorialStep].demo === 'bridge' && <div className="w-full"><BridgeDemo /></div>}
                {TUTORIAL_STEPS[tutorialStep].demo === 'draft' && <div className="w-full"><DraftDemo /></div>}
                {!TUTORIAL_STEPS[tutorialStep].demo && <div className="text-7xl">{TUTORIAL_STEPS[tutorialStep].icon}</div>}
              </div>
              <h3 className="text-lg font-black text-slate-800 text-center mt-1">{TUTORIAL_STEPS[tutorialStep].title}</h3>
              <p className="text-[13px] font-bold text-slate-600 leading-relaxed text-center mt-1">{TUTORIAL_STEPS[tutorialStep].body}</p>
            </div>
            <div className="flex justify-center gap-2 mb-5">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div key={idx} className={`w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${idx === tutorialStep ? 'bg-[#4ade80]' : 'bg-white'}`} />
              ))}
            </div>
            <div className="flex gap-3">
              {tutorialStep > 0 ? (
                <button onClick={() => { setTutorialStep(tutorialStep - 1); }} className="flex-1 py-4 bg-white border-4 border-slate-800 rounded-xl font-black text-xl text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)]">上一步</button>
              ) : (<div className="flex-1"></div>)}
              <button onClick={closeTutorial} className="flex-1 py-4 bg-white border-4 border-slate-800 rounded-xl font-black text-xl text-slate-400 shadow-[4px_4px_0px_rgba(30,41,59,1)]">跳過</button>
              {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                <button onClick={() => { setTutorialStep(tutorialStep + 1); }} className="flex-1 py-4 bg-[#4ade80] border-4 border-slate-800 rounded-xl font-black text-xl text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)]">下一步</button>
              ) : (
                <button onClick={closeTutorial} className="flex-1 py-4 bg-[#34d399] border-4 border-slate-800 rounded-xl font-black text-xl text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)]">開始遊戲 🎮</button>
              )}
            </div>
          </div>
        </div>
      ) : null;

      if (screen === 'home') {
        return (
          <div className="h-screen w-screen flex flex-col items-center justify-center p-4 relative overflow-hidden animate-fadeIn">
            <div className="flex-1 flex flex-col justify-center w-full max-w-md items-center">
              <div className="bg-[#f6fdf6] border-4 border-slate-800 p-10 rounded-xl shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full text-center relative transform -rotate-1 z-10">
                 <h1 className="text-6xl font-black text-slate-800 mb-6 tracking-widest flex justify-center gap-3">
                    <span className="inline-block animate-float-slow bg-[#4ade80] px-4 py-2 border-4 border-slate-800 rounded-xl transform rotate-3 shadow-[4px_4px_0px_rgba(30,41,59,1)]">數</span>
                    <span className="inline-block animate-float-slow animate-float-slow-d bg-[#4ade80] px-4 py-2 border-4 border-slate-800 rounded-xl transform -rotate-2 shadow-[4px_4px_0px_rgba(30,41,59,1)]">橋</span>

                 </h1>
                 <div className="inline-block border-[3px] border-dashed border-slate-800 rounded-xl px-6 py-2 mb-8 bg-white shadow-[4px_4px_0px_rgba(30,41,59,1)] transform rotate-2">
                    <p className="text-slate-800 font-black text-xl tracking-widest uppercase italic">Hashi Puzzle</p>
                 </div>
                 <div className="flex flex-col gap-5">
                    <button onClick={startSinglePlayer} className="plat-btn-hard w-full py-4 bg-white border-4 border-slate-800 rounded-xl font-black text-xl text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)] transform rotate-1">👤 單機挑戰</button>
                    <button onClick={() => startDailyMode(dailyMenuDate)} className="plat-btn-hard w-full py-4 bg-[#4ade80] border-4 border-slate-800 rounded-xl font-black text-xl text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)] transform rotate-1">📅 每日一題</button>
                    <div className="-mt-2 flex items-center justify-center gap-1.5">
                      <span className="text-slate-500 font-semibold text-xs whitespace-nowrap">🕘 以前的題目</span>
                      <button onClick={() => setDailyMenuDate(d => clampDailyDate(HASHI_PUZZLE.shiftDateStr(d, -1)))} disabled={dailyMenuDate <= MIN_DAILY_DATE} className="plat-btn-hard plat-btn-hard-2 px-2 py-1 bg-white border-2 border-slate-800 rounded-md font-black text-xs text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-30 active:translate-y-0.5">◀</button>
                      <button onClick={openDailyCal} className="plat-btn-hard plat-btn-hard-2 border-2 border-slate-800 rounded-md px-2 py-1 font-bold text-sm bg-white text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] active:translate-y-0.5">📅 {dailyMenuDate}</button>
                      <button onClick={() => setDailyMenuDate(d => clampDailyDate(HASHI_PUZZLE.shiftDateStr(d, 1)))} disabled={dailyMenuDate >= HASHI_PUZZLE.getDailyDateStr()} className="plat-btn-hard plat-btn-hard-2 px-2 py-1 bg-white border-2 border-slate-800 rounded-md font-black text-xs text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-30 active:translate-y-0.5">▶</button>
                    </div>
                    {dailyStatus && (
                      <p className="text-slate-600 font-bold text-sm -mt-2">
                        {dailyStatus.done ? `✅ 已完成 ${formatTime(dailyStatus.done.time)}` : `📅 ${dailyStatus.dateStr}`}
                        {dailyStatus.streak > 1 ? `  🔥 連擊 x${dailyStatus.streak}` : ''}
                      </p>
                    )}
                    <button onClick={openTutorial} className="plat-btn-hard w-full py-4 bg-white border-4 border-slate-800 rounded-xl font-black text-xl text-slate-600 shadow-[4px_4px_0px_rgba(30,41,59,1)]">❓ 玩法教學</button>
                  {PLAT_MODE && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => { if (window.PLAT_show) window.PLAT_show('home'); }} className="plat-btn-hard flex-1 py-3 bg-sky-400 border-4 border-slate-800 rounded-xl font-black text-lg text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)]">🏠 回大廳</button>
                      {renderDockCapsule(false)}
                    </div>
                  )}
                 </div>
              </div>
            </div>
            <div className="shrink-0 pb-4 text-slate-800 font-black text-sm opacity-60 tracking-wider z-10">Copyright © 2026 葉大帥. All rights reserved.{' (v' + (window.PLAT_VERSION || '2.18') + ')'}</div>
            {tutorialOverlay}
            
          </div>
        );
      }


      const sortedBridges = [...bridges].sort((a, b) => {
          const aActive = (a.count + (a.draftCount || 0)) > 0 ? 1 : 0;
          const bActive = (b.count + (b.draftCount || 0)) > 0 ? 1 : 0;
          return aActive - bActive;
      });

      // 錦標賽每局開局門檻（房主）：全員到齊且全員準備才能開始；等滿 1 分鐘（且至少 2 人到齊）可強制開始
      const tournGatePresent = playersList.filter(p => !p.isSpectator && !p.pending);
      const tournExpected = (tournRoundInfo && tournRoundInfo.entrants) || tournGatePresent.length;
      const tournAllPresent = tournGatePresent.length >= Math.max(2, tournExpected);
      const tournAllReady = tournGatePresent.length > 0 && tournGatePresent.every(p => p.isReady);
      const tournWaitMs = tournWaitSinceRef.current ? Date.now() - tournWaitSinceRef.current : 0;
      const tournWaited = tournWaitMs >= 60000;
      const tournCanStart = tournGatePresent.length >= 2 && (tournWaited || (tournAllPresent && tournAllReady));
      const tournMyEntry = playersList.find(p => p.id === myId);
      const tournStartNote = (tournAllPresent && tournAllReady) ? '全員準備好了，等房主開始！' : (tournWaited ? '已等滿 1 分鐘，房主可強制開始' : (!tournAllPresent ? ('等待選手到齊…（或 ' + Math.max(0, 60 - Math.floor(tournWaitMs / 1000)) + ' 秒後可強制開始）') : ('等待全員準備（或 ' + Math.max(0, 60 - Math.floor(tournWaitMs / 1000)) + ' 秒後可強制開始）')));

      return (
        <div className="h-screen w-screen p-1 md:p-4 flex flex-col items-center font-sans relative" style={{ backgroundColor: '#e9f7e9', backgroundImage: 'radial-gradient(#b7ddb7 2px, transparent 2px)', backgroundSize: '12px 12px' }}>
          <div className="w-full max-w-[1200px] bg-[#f6fdf6] rounded-xl border-4 border-slate-800 shadow-[10px_10px_0px_rgba(30,41,59,1)] flex flex-col h-full relative z-10 overflow-hidden">

            <div className={`bg-gradient-to-b from-[#ffd633] to-[#4ade80] border-b-4 border-slate-800 shrink-0 z-50 relative transition-all duration-300 ease-in-out px-2 md:px-4 py-2 flex flex-col gap-2`}>
               <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                     <h1 className="font-black tracking-tight uppercase text-lg md:text-2xl text-[#1e293b] flex items-center gap-1">🌉<span className="hidden sm:inline">數橋</span></h1>
                     <div className="flex items-center gap-1 bg-[#1e293b] text-white px-2 py-1 rounded-md font-mono font-bold shadow-[2px_2px_0px_rgba(0,0,0,0.4)] text-xs md:text-sm whitespace-nowrap">
                        <GameTimer startTime={startTime} endTime={endTime} isRunning={!isWon && screen === 'game'} />
                     </div>
                     {isDailyMode && ( <span className="flex items-center gap-0.5 bg-[#4ade80] text-[#1e293b] pl-1 pr-1.5 py-1 rounded-md border-2 border-[#1e293b] font-black text-xs md:text-sm shadow-[2px_2px_0px_rgba(0,0,0,0.3)] whitespace-nowrap">
                       <button onClick={() => startDailyMode(HASHI_PUZZLE.shiftDateStr(dailyDateStr, -1))} disabled={dailyDateStr <= MIN_DAILY_DATE} className="disabled:opacity-30 px-1" title="前一天的題目">◀</button>
                       <span>📅 {dailyDateStr}</span>
                       <button onClick={() => startDailyMode(HASHI_PUZZLE.shiftDateStr(dailyDateStr, 1))} disabled={dailyDateStr >= HASHI_PUZZLE.getDailyDateStr()} className="disabled:opacity-30 px-1" title="後一天的題目">▶</button>
                     </span> )}
                     {isDailyMode && dailyStreak > 0 && ( <span className="bg-red-500 text-white px-2 py-1 rounded-md border-2 border-[#1e293b] font-black text-xs md:text-sm shadow-[2px_2px_0px_rgba(0,0,0,0.3)] whitespace-nowrap">🔥 x<PlatNum value={dailyStreak} /></span> )}
                     {!PLAT_MODE && (videoOn || Object.keys(remoteVideos).length > 0) && (
              <div className="px-4 py-2 bg-slate-800 flex gap-3 items-start overflow-x-auto shrink-0">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-[3px] border-[#4ade80] shadow relative bg-slate-600">
                    {localStream ? (
                      <video ref={el => { if (el) el.srcObject = localStream; }} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-black text-lg" style={{ backgroundColor: myColorRef.current === 'rainbow' ? '#a855f7' : (myColorRef.current || '#3b82f6') }}>{(myNameRef.current || '你').slice(0, 1)}</div>
                    )}
                  </div>
                  <span className="text-white text-[10px] font-bold mt-0.5">你{micMuted ? ' 🔇' : ''}</span>
                </div>
                {Object.entries(remoteVideos).map(entry => {
                  const uid = entry[0]; const stream = entry[1];
                  const pl = playersList.find(p => p.id === uid);
                  const nm = pl ? pl.name : '對手';
                  return (
                    <div key={uid} className="flex flex-col items-center shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-[3px] border-white shadow relative bg-slate-600">
                        <video ref={el => { if (el) { el.srcObject = stream; try { el.muted = !speakerOnRef.current; } catch (e) {} } }} autoPlay playsInline muted className="remote-video-el w-full h-full object-cover" />
                      </div>
                      <span className="text-white text-[10px] font-bold mt-0.5 max-w-[64px] truncate">{nm}{remoteMic[uid] === false ? ' 🎤' : ''}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {isMultiplayer && ( <span className="bg-emerald-400 text-slate-900 px-2 py-1 rounded-md border-2 border-slate-800 font-black text-xs md:text-sm shadow-[2px_2px_0px_rgba(30,41,59,1)] flex items-center gap-1 whitespace-nowrap">{isHostRef.current ? '👑 主機' : '👤 玩家'} | 代碼: {roomId}</span> )}
                  </div>
                  <button onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)} className="flex px-2 md:px-3 py-1 bg-[#1e293b] text-white border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:bg-slate-800 items-center gap-1 whitespace-nowrap">{isHeaderCollapsed ? '🔽 展開規則' : '🔼 縮小面板'}</button>
               </div>

               <div className={"plat-collapse-y w-full" + (isHeaderCollapsed ? "" : " open")}>
                  <div className="bg-white border-[3px] border-[#1e293b] rounded-xl p-3 text-[#1e293b] shadow-[4px_4px_0px_#1e293b] flex flex-col md:flex-row gap-3">
                     <div className="flex-1">
                        <h3 className="text-sm md:text-base font-black mb-1 border-b-[3px] border-[#4ade80] inline-block pb-0.5">📜 遊戲四大規則</h3>
                        <ol className="list-decimal list-outside ml-4 space-y-1 text-xs md:text-sm leading-relaxed font-bold">
                           <li>每個圓圈是一座「島」，數字代表需要幾座橋樑。</li>
                           <li>橋樑必須是垂直或水平方向。</li>
                           <li>橋樑之間絕對不能交叉或重疊。</li>
                           <li>兩座島之間最多架設 2 座橋，且完成時所有島嶼必須全部連通。</li>
                        </ol>
                     </div>
                     <div className="md:w-1/3 bg-[#4ade80]/20 p-2 md:p-3 rounded-xl border-[3px] border-dashed border-[#1e293b] flex flex-col justify-center">
                        <p className="text-[#1e293b] font-black text-xs md:text-sm mb-1 flex items-center gap-1"><span>💡</span> 提示與狀態：</p>
                        <p className="text-slate-700 text-xs md:text-sm font-bold leading-relaxed">{cLevel.description}</p>
                     </div>
                  </div>
               </div>

               <div className="flex flex-wrap gap-1.5 items-center justify-between w-full">
                  <button disabled={isDailyMode || inRace || (isMultiplayer && !isHostRef.current)} onClick={() => setShowSettingsModal(true)} title="設定難度" className="px-1 py-1 md:px-2 md:py-1.5 rounded-md border-2 border-[#1e293b] font-bold bg-white text-[#1e293b] text-xs md:text-sm outline-none shadow-[2px_2px_0px_#1e293b] w-auto cursor-pointer max-w-[150px] sm:max-w-none truncate disabled:opacity-60 disabled:cursor-not-allowed">{(currentLevelId === 'daily' || isDailyMode) ? ('📅 每日一題' + (cLevel && cLevel.width ? ' ' + cLevel.width + 'x' + cLevel.height : '')) : (currentLevelId === 'custom' && randomLevelData) ? `⚙️ 自訂 (${randomLevelData.width}x${randomLevelData.height})` : (((LEVELS.find(l => String(l.id) === String(currentLevelId)) || {}).name) || (cLevel && cLevel.width ? cLevel.width + 'x' + cLevel.height : '10x10 標準'))} ▾</button>

                  <div className="flex gap-1 md:gap-2 flex-wrap items-center ml-auto">
                     {!isWon && hasSolution && !showSolution && !inRace && ( <button onClick={handleShowSolution} className="plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-green-400 text-[#1e293b] border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1" title="解答">💡<span className="hidden sm:inline">解答</span></button> )}
                     {!isDailyMode && !inRace && ( <button onClick={handleRegenerateRandom} className="plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-blue-500 text-white border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1" title="新題">🎲<span className="hidden sm:inline">新題</span></button> )}
                     {!isMultiplayer && ( <button onClick={handleUndo} disabled={history.length === 0 || isWon} className="plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-white border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-50 disabled:shadow-none flex items-center gap-1 text-[#1e293b]" title="復原">↩️<span className="hidden sm:inline">復原</span></button> )}
                     <button onClick={handleReset} className="plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-red-500 text-white border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1" title="重置">🔄<span className="hidden sm:inline">重置</span></button>
                     <button onClick={() => setShowSaveModal(true)} className="plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-blue-500 text-white border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1" title="存檔/讀檔">💾<span className="hidden sm:inline">存檔</span></button>
                     <button onClick={() => { const m = platAudio().toggleMuted(); setMuted(m); }} className="plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-white border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1 text-[#1e293b]" title={muted ? "取消靜音" : "靜音"}>{muted ? '🔇' : '🔊'}</button>
                     <button onClick={() => { const N = typeof window !== 'undefined' ? window.__PLAT_NET : null; if ((N && N.inMatch === 'hashi') || (typeof window !== 'undefined' && window.__PLAT_TOURN_CAN_FORCEEND && window.__PLAT_TOURN_CAN_FORCEEND())) setShowExitMenu(true); else handleGoHome(); }} className="plat-btn-hard plat-btn-hard-2 bg-white text-[#1e293b] border-2 border-[#1e293b] px-2 py-1 md:px-3 md:py-1.5 rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1" title="回首頁/斷線">{!isMultiplayer ? '🏠' : '🔌'}<span className="hidden sm:inline ml-1">{!isMultiplayer ? '回首頁' : '退出'}</span></button>
                  </div>
               </div>
            </div>

            {isMultiplayer && !(inRace && raceState !== 'lobby') && (
              <div className="px-4 py-2 bg-[#f6fdf6] border-b-4 border-slate-800 flex flex-wrap gap-2 items-center relative z-[70] shadow-inner shrink-0">
                <span className="font-black text-slate-800 text-sm">👥 連線玩家：</span>
                {playersList.map((p, idx) => {
                  const isMe = p.id === myId;
                  const isRainbow = p.color === 'rainbow';
                  return (
                    <div key={idx} className="relative inline-flex">
                      <span
                            onClick={() => {
                              const sHub = platSessRef.current;
                              if (sHub && sHub.hub) {
                                // hub 模式：代表色由殼的摩天輪決定、遊戲內不自選——點自己的名條改呼叫殼的選色（結果走原改色協議同步），點別人無動作、不開色票
                                if (isMe && window.__PLAT_PICK_COLOR) window.__PLAT_PICK_COLOR(myCurrentColor, function (c) { if (c) handlePlayerColorChange(myId, c); });
                                return;
                              }
                              setColorPickerTarget(prev => prev === p.id ? null : p.id);
                            }}
                            title={isMe ? "點擊可切換你的代表色" : "點擊可為這位玩家更換顏色"}
                            className="px-2 py-0.5 rounded text-xs font-bold bg-white text-slate-800 flex items-center shadow-[1px_1px_0px_rgba(30,41,59,1)] cursor-pointer hover:bg-slate-100 transition-colors relative border-2 border-slate-800"
                            style={{ borderLeftWidth: '6px', borderLeftColor: isRainbow ? 'transparent' : p.color }}>
                        {isRainbow && (
                            <svg className="absolute top-[-2px] left-[-6px] w-[6px] pointer-events-none" style={{ height: 'calc(100% + 4px)', borderRadius: '2px 0 0 2px' }}>
                                <rect width="100%" height="100%" fill="url(#rainbowGrad)" />
                            </svg>
                        )}
                        {p.name} {p.isHost && '👑'} {isMe && '(你)'}
                      </span>

                      {colorPickerTarget === p.id && (
                        <div className="absolute top-full mt-2 left-0 sm:left-0 bg-[#f6fdf6] border-[3px] border-slate-800 rounded-xl p-3 shadow-[4px_4px_0px_rgba(30,41,59,1)] z-[100] w-[180px] animate-fadeIn">
                          <div className="flex justify-between items-center mb-2 border-b-2 border-slate-800 pb-1">
                            <h3 className="text-xs font-bold text-slate-800">🎨 選色</h3>
                            <button onClick={(e) => { e.stopPropagation(); setColorPickerTarget(null); setColorSeq([]); }} className="text-slate-400 hover:text-slate-800 font-black leading-none">✕</button>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5">
                            {COLORS.map(color => (
                              <button
                                key={color}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const colorIdx = COLORS.indexOf(color);
                                  let newSeq = [...colorSeq, colorIdx];
                                  const targetSeq = [0, 4, 15, 19];

                                  let isValid = true;
                                  for (let i = 0; i < newSeq.length; i++) {
                                      if (newSeq[i] !== targetSeq[i]) { isValid = false; break; }
                                  }

                                  if (isValid) {
                                      setColorSeq(newSeq);
                                      if (newSeq.length === 4) {
                                          handlePlayerColorChange(p.id, 'rainbow');
                                          setColorPickerTarget(null);
                                          showToast("🌈 解鎖隱藏彩色漸變！");
                                          setColorSeq([]);
                                      } else {
                                          handlePlayerColorChange(p.id, color);
                                      }
                                  } else {
                                      setColorSeq([]);
                                      handlePlayerColorChange(p.id, color);
                                      setColorPickerTarget(null);
                                  }
                                }}
                                className="plat-btn-hard plat-btn-hard-1 w-6 h-6 rounded-full border-[2px] border-slate-800 shadow-[1px_1px_0px_rgba(30,41,59,1)] hover:scale-110 active:scale-95"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {engineRef.current === 'peerjs' && !PLAT_MODE && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      onClick={() => { setChatOpen(prev => { if (!prev) setChatMin(false); return !prev; }); }}
                      className="relative flex items-center gap-1 text-xs md:text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border-2 border-slate-300 shadow-[1px_1px_0px_rgba(30,41,59,1)] hover:bg-slate-200 transition-colors"
                      title="聊天室"
                    >
                      💬 聊天
                      {unreadChat > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                          {unreadChat > 99 ? '99+' : unreadChat}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={toggleVideo}
                      className={"flex items-center gap-1 text-xs md:text-sm font-bold px-2 py-1 rounded-md border-2 shadow-[1px_1px_0px_rgba(30,41,59,1)] transition-colors " + (videoOn ? "text-white bg-slate-800 border-slate-800" : "text-slate-700 bg-slate-100 border-slate-300 hover:bg-slate-200")}
                      title={videoOn ? '關閉視訊' : '開啟視訊（圓形頭像）'}
                    >
                      {videoOn ? '📹' : '🎥'} 視訊
                    </button>
                    {videoOn && (
                      <button
                        onClick={toggleMic}
                        className="flex items-center text-xs md:text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border-2 border-slate-300 shadow-[1px_1px_0px_rgba(30,41,59,1)] hover:bg-slate-200 transition-colors"
                        title={micMuted ? '取消靜音' : '靜音'}
                      >
                        {micMuted ? '🔇' : '🎤'}
                      </button>
                    )}
                    {(videoOn || Object.keys(remoteVideos).length > 0) && (
                      <button
                        onClick={() => setSpeakerOn(prev => !prev)}
                        className={"flex items-center gap-1 text-xs md:text-sm font-bold px-2 py-1 rounded-md border-2 shadow-[1px_1px_0px_rgba(30,41,59,1)] transition-colors " + (speakerOn ? "text-white bg-slate-800 border-slate-800" : "text-slate-700 bg-slate-100 border-slate-300 hover:bg-slate-200")}
                        title={speakerOn ? '喇叭開啟中（點按關閉）' : '喇叭關閉中（點按開啟，才聽得到對方）'}
                      >
                        {speakerOn ? '🔊' : '🔈'} 喇叭
                      </button>
                    )}
                    <label title={mpMode === 'race' ? '大亂鬥模式停用顯示游標（防作弊）' : ''} className={"flex items-center gap-1.5 text-xs md:text-sm font-bold px-2 py-1 rounded-md border-2 shadow-[1px_1px_0px_rgba(30,41,59,1)] transition-colors " + (mpMode === 'race' ? "text-slate-400 bg-slate-200 border-slate-300 cursor-not-allowed opacity-70" : "cursor-pointer text-slate-700 hover:text-slate-900 bg-slate-100 border-slate-300 hover:bg-slate-200")}>
                      <input
                        type="checkbox"
                        checked={showOtherCursors}
                        disabled={mpMode === 'race'}
                        onChange={(e) => setShowOtherCursors(e.target.checked)}
                        className="w-3.5 h-3.5 md:w-4 md:h-4 accent-emerald-500"
                      />
                      顯示游標{mpMode === 'race' ? ' 🔒' : ''}
                    </label>
                  </div>
                )}
              </div>
            )}

            {inRace && raceState !== 'lobby' && (
              <div className="bg-[#f6fdf6] border-b-4 border-slate-800 shrink-0 relative z-40">
                {/* 大亂鬥進度條：改用數獨同款晶片條（左色條＋名字＋%＋玩家色細進度條）；點自己（或房主點任何人）開個人設定改名/改色 */}
                <div className="px-2 md:px-4 py-1.5 flex flex-nowrap gap-2 items-center shadow-inner overflow-x-auto hide-scrollbar w-full">
                  <span className="font-black text-slate-800 text-xs shrink-0 whitespace-nowrap">👥 玩家：</span>
                  {playersList.map((p, idx) => {
                    const isMe = p.id === myId;
                    const isRainbow = p.color === 'rainbow';
                    const rinfo = raceProgress[p.id];
                    const pct = rinfo ? Math.round(rinfo.progress * 100) : 0;
                    return (
                      <div key={idx} data-fly-uid={p.id} className={"shrink-0 flex flex-col gap-0.5 border-2 border-slate-800 rounded px-1.5 py-0.5 relative cursor-pointer hover:bg-slate-100 transition-colors " + (p.isSpectator ? 'opacity-60 bg-slate-100' : 'bg-white')}
                        onClick={() => {
                          if (isMe || isHostRef.current) { setEditName(p.name); setEditTarget(p.id); }
                          else { showToast("⚠️ 只有房主可以更改其他玩家的設定！"); }
                        }}
                        title={isMe ? "點擊修改設定" : (isHostRef.current ? "房主可修改他人設定" : "無法修改他人設定")}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[1px]" style={{ background: isRainbow ? 'linear-gradient(180deg, red, orange, yellow, green, blue, indigo, violet)' : p.color }}></div>
                        <div className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-slate-800 pl-1.5 whitespace-nowrap">
                          {p.name} {p.isHost && '👑'} {p.isSpectator && ' 👁️'} {isMe && '(你)'}
                          <span className="text-emerald-600 font-mono ml-1"><PlatPct value={pct} /></span>
                        </div>
                        <div className="w-24 md:w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-1.5 relative border border-slate-300">
                          <div className="h-full plat-pbar" style={{ width: pct + '%', background: isRainbow ? 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)' : p.color }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {raceState === 'finished' && (
                  <div className="px-4 pb-1.5 flex items-center gap-1.5 flex-wrap">
                    <button onClick={() => { const opps = Object.keys(brawlBoards); if (opps.length) setGodViewUid(opps[0]); }} disabled={Object.keys(brawlBoards).length === 0} className="plat-btn-hard plat-btn-hard-2 px-2 py-1 bg-slate-800 text-white border-2 border-slate-800 rounded-lg font-black text-xs shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-40">👁️ 上帝視角</button>
                  </div>
                )}
              </div>
            )}

            {renderGodModal()}

            {editTarget && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm pointer-events-auto animate-fadeIn" onClick={(e) => { e.stopPropagation(); setEditTarget(null); setColorSeq([]); }}>
                <div className="bg-[#f6fdf6] border-[3px] border-slate-800 rounded-xl p-4 shadow-[10px_10px_0px_rgba(30,41,59,1)] animate-popUpCenter max-w-[280px] w-full mx-4" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-3 border-b-2 border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-800">⚙️ 個人設定</h3>
                    <button onClick={() => { setEditTarget(null); setColorSeq([]); }} className="text-slate-400 hover:text-slate-800 font-black text-lg leading-none">✕</button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-1">修改暱稱：</label>
                    <div className="flex gap-2">
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="輸入新暱稱" className="w-full border-2 border-slate-800 rounded px-2 py-1 text-xs font-bold outline-none focus:ring-1 ring-emerald-400" />
                      <button onClick={(e) => {
                        e.stopPropagation();
                        const newName = editName.trim();
                        if (!newName) return showToast("⚠️ 暱稱不能為空");
                        if (playersList.some(p => p.name === newName && p.id !== editTarget)) return showToast("⚠️ 此暱稱已被其他人使用");
                        handlePlayerNameChange(editTarget, newName);
                        setEditTarget(null);
                        setColorSeq([]);
                      }} className="bg-blue-500 text-white font-bold text-[10px] md:text-xs px-3 rounded border-2 border-slate-800 hover:bg-blue-600 active:translate-y-[1px] whitespace-nowrap">儲存</button>
                    </div>
                  </div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-1">修改代表色：</label>
                  <div className="grid grid-cols-5 gap-2">
                    {COLORS.map(color => (
                      <button key={color} onClick={(e) => { e.stopPropagation(); const colorIdx = COLORS.indexOf(color); let newSeq = [...colorSeq, colorIdx]; const targetSeq = [0, 4, 15, 19]; let isValid = true; for (let i = 0; i < newSeq.length; i++) { if (newSeq[i] !== targetSeq[i]) { isValid = false; break; } } if (isValid) { setColorSeq(newSeq); if (newSeq.length === 4) { handlePlayerColorChange(editTarget, 'rainbow'); setEditTarget(null); showToast("🌈 解鎖隱藏彩色漸變！"); setColorSeq([]); } else handlePlayerColorChange(editTarget, color); } else { setColorSeq([]); handlePlayerColorChange(editTarget, color); setEditTarget(null); } }} className="plat-btn-hard plat-btn-hard-2 w-8 h-8 rounded-full border-[2px] border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] hover:scale-110 active:scale-95 mx-auto" style={{ backgroundColor: color }} title={color} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isHeaderCollapsed && (
              <div className="h-8 shrink-0 flex items-center justify-center bg-slate-800 text-white border-b-4 border-slate-800 relative z-30 font-bold tracking-wide">
                <span className="text-xs md:text-sm hidden md:inline">點擊或從島嶼拖曳架橋：一下1座、兩下2座、三下取消；滾輪縮放。</span>
                <span className="text-xs md:text-sm md:hidden">點擊或拖曳島嶼架橋：一下1座、兩下2座、三下取消。</span>
              </div>
            )}

            <div className={"relative z-0 flex-1 flex flex-col min-h-0 bg-[#f6fdf6]" + ((raceState === 'spectating' || (inRace && raceWaiting)) ? " hidden" : "")}>

              {isGenerating && (
                <div className="absolute inset-0 z-[40] flex items-center justify-center pointer-events-none">
                  <div className="text-slate-800/30 font-black text-3xl md:text-5xl tracking-widest flex items-center select-none animate-pulse">
                    地圖產生中<span className="animate-loading-dots inline-block w-[1.5em] text-left"></span>
                  </div>
                </div>
              )}

              {inRace && (raceState === 'racing' || raceState === 'finished') && myItems.length > 0 && (
                <div data-fly-me="items" className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[45] flex items-end gap-4">
                  {BRAWL_BAR_ORDER.filter(k => myItems.indexOf(k) >= 0).map(k => {
                    const meta = BRAWL_ITEMS.find(x => x.key === k);
                    const cnt = myItems.filter(x => x === k).length;
                    return (
                      <button key={k} onClick={() => useBrawlItem(k)} disabled={raceState !== 'racing'} className="plat-btn-hard plat-btn-hard-3 anim-item relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-white border-4 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] flex flex-col items-center justify-center disabled:opacity-40">
                        <span className="text-[22px] md:text-2xl leading-none">{meta.icon}</span>
                        <span className="text-[9px] font-black text-slate-600 leading-tight mt-0.5">{meta.name}</span>
                        {cnt > 1 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"><PlatNum value={cnt} /></span>}
                      </button>
                    );
                  })}
                </div>
              )}

              <div ref={zoomContainerRef} className="p-2 md:p-6 flex-1 overflow-auto custom-scrollbar plat-chat-clear relative z-0">
                <div key={boardFadeKey} className="flex justify-center items-center min-w-max min-h-max m-auto pb-2 pr-2 animate-boardFade" style={raceState === 'countdown' ? { filter: 'blur(18px)', pointerEvents: 'none' } : { transition: 'filter 0.3s' }}>
                  <svg
                    ref={svgRef}
                    onPointerMove={handlePointerMove}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={(e) => { if(eraserRef.current) eraserRef.current.style.display = 'none'; }}
                    onPointerCancel={handlePointerUp}
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    className="bg-transparent transition-transform duration-100 ease-out origin-center select-none"
                    style={{
                        width: `${svgW * zoomLevel}px`,
                        height: `${svgH * zoomLevel}px`,
                        // 全模式 touch-action:none：iOS 對 SVG 內層 <g> 的 touch-action 支援不可靠，
                        // 曾導致拖曳手勢被瀏覽器捲動劫持（pointercancel）而永遠觸發不了；
                        // 改由 svg 統一吃掉手勢，空白處捲動改走手動 pan（見 panRef）
                        touchAction: 'none',
                        WebkitTouchCallout: 'none' // iOS 長按不跳系統選單（拖曳需要長按）
                    }}>
                    <defs>
                      <pattern id="grid" width={SCALE} height={SCALE} patternUnits="userSpaceOnUse">
                        <path d={`M ${SCALE} 0 L 0 0 0 ${SCALE}`} fill="none" stroke="#d97706" strokeOpacity="0.28" strokeWidth="1"/>
                      </pattern>
                      <pattern id="warningStripe" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="16" stroke="#facc15" strokeWidth="8" strokeOpacity="0.7" />
                      </pattern>
                      <radialGradient id="fogPuff">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
                        <stop offset="55%" stopColor="#eef3f7" stopOpacity="0.92" />
                        <stop offset="82%" stopColor="#dde6ee" stopOpacity="0.55" />
                        <stop offset="100%" stopColor="#dde6ee" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="islandShine">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                      </radialGradient>
                      <linearGradient id="rainbowGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={svgW} y2={svgH}>
                          <stop offset="0%" className="rainbow-stop" />
                          <stop offset="100%" className="rainbow-stop" />
                      </linearGradient>
                    </defs>
                    <rect id="svg-bg" width={gridWidth * SCALE} height={gridHeight * SCALE} fill="url(#grid)" transform={`translate(${PADDING}, ${PADDING})`} className="pointer-events-none" />

                    {/* 解答線 */}
                    {showSolution && cLevel.solution && cLevel.solution.map((sol, idx) => {
                        const islandsMap = {}; islandsToRender.forEach(i => { islandsMap[i.id] = i; });
                        const f = islandsMap[sol.from], t = islandsMap[sol.to];
                        if (!f || !t) return null;
                        const x1 = f.x*SCALE+PADDING, y1 = f.y*SCALE+PADDING, x2 = t.x*SCALE+PADDING, y2 = t.y*SCALE+PADDING;

                        if (sol.count === 1) {
                            return <line key={`sol-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ef4444" strokeWidth="6" strokeOpacity="0.4" strokeDasharray="8,6" className="solution-line pointer-events-none" />;
                        } else if (sol.count === 2) {
                            if (sol.type === 'h') {
                                return (
                                    <g key={`sol-${idx}`} className="pointer-events-none">
                                        <line x1={x1} y1={y1-5} x2={x2} y2={y2-5} stroke="#ef4444" strokeWidth="5" strokeOpacity="0.4" strokeDasharray="8,6" className="solution-line" />
                                        <line x1={x1} y1={y1+5} x2={x2} y2={y2+5} stroke="#ef4444" strokeWidth="5" strokeOpacity="0.4" strokeDasharray="8,6" className="solution-line" />
                                    </g>
                                );
                            } else {
                                return (
                                    <g key={`sol-${idx}`} className="pointer-events-none">
                                        <line x1={x1-5} y1={y1} x2={x2-5} y2={y2} stroke="#ef4444" strokeWidth="5" strokeOpacity="0.4" strokeDasharray="8,6" className="solution-line" />
                                        <line x1={x1+5} y1={y1} x2={x2+5} y2={y2} stroke="#ef4444" strokeWidth="5" strokeOpacity="0.4" strokeDasharray="8,6" className="solution-line" />
                                    </g>
                                );
                            }
                        }
                        return null;
                    })}

                    {/* 塗鴉筆跡 */}
                    {strokes.map(s => {
                        const strokeUid = s.uid || s.id.split('-')[1];
                        const isOwnStroke = strokeUid === myId;

                        let strokeColor = s.color;
                        let strokeOpacity = 1;
                        let isRainbow = false;

                        if (isMultiplayer && strokeUid) {
                            strokeColor = getPlayerColor(strokeUid);
                            if (strokeColor === 'rainbow') isRainbow = true;
                            strokeOpacity = isOwnStroke ? 1 : 0.5;
                        }

                        return (
                            <path
                                key={s.id}
                                d={s.path}
                                fill="none"
                                stroke={isRainbow ? undefined : strokeColor}
                                strokeOpacity={strokeOpacity}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`doodle-stroke ${isRainbow ? 'rainbow-stroke' : ''}`}
                                data-stroke-id={s.id}
                                style={{ pointerEvents: (interactionMode === 2 && drawSubMode === 'eraser' && isOwnStroke) ? 'stroke' : 'none' }}
                            />
                        );
                    })}

                    {/* 直接由 JS 操控的畫筆 Ref (不觸發 React 重繪) */}
                    <path
                        ref={drawingPathRef}
                        fill="none"
                        stroke={myCurrentColor === 'rainbow' ? undefined : myCurrentColor}
                        strokeOpacity={1}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`pointer-events-none ${myCurrentColor === 'rainbow' ? 'rainbow-stroke' : ''}`}
                        style={{ display: 'none' }}
                    />

                    {/* 橋樑繪製 */}
                    {sortedBridges.map(b => {
                      const totalLines = b.count + (b.draftCount || 0);
                      const islMap = {}; islandsToRender.forEach(i => { islMap[i.id] = i; });
                      const f=islMap[b.from], t=islMap[b.to];
                      if (!f || !t) return null;
                      const x1=f.x*SCALE+PADDING, y1=f.y*SCALE+PADDING, x2=t.x*SCALE+PADDING, y2=t.y*SCALE+PADDING;

                      let lineStroke = "#1e293b";
                      let lineOpacity = 1;
                      let isRainbow = false;

                      if (isMultiplayer && totalLines > 0 && b.owner) {
                          lineStroke = getPlayerColor(b.owner);
                          if (lineStroke === 'rainbow') isRainbow = true;
                          lineOpacity = (b.owner === myId) ? 1 : 0.5;
                      }
                      if (b.locked) { lineStroke = '#000000'; lineOpacity = 1; isRainbow = false; } // 禮物橋：黑色實線鎖定

                      const isCrossed = crossedBridgeIds.has(b.id);
                      const isIslandHovered = (hoveredIslandId === b.from || hoveredIslandId === b.to) && interactionMode < 2;

                      const bridgeGroupClass = interactionMode >= 2 || (isCrossed && totalLines === 0) ? "pointer-events-none" : "cursor-pointer group";

                      const bridgeRectClass = interactionMode >= 2 ? "fill-transparent bridge-hotzone" : `transition-colors duration-300 bridge-hotzone ${isIslandHovered ? 'fill-yellow-300/40' : 'fill-transparent group-hover:fill-yellow-300/40'}`;
                      const bridgeLineClass = `pointer-events-none ${isRainbow ? 'rainbow-stroke' : 'transition-colors duration-300'}`;

                      if (totalLines === 0) {
                          return (
                            <g key={b.id}
                               onPointerDown={(e) => handleBridgePointerDown(e, b)}
                               style={interactionMode < 2 ? { touchAction: 'none' } : undefined}
                               onPointerEnter={(e) => { if(e.pointerType==='mouse' && interactionMode < 2) setHoveredBridgeId(b.id); }}
                               onPointerLeave={(e) => { if(e.pointerType==='mouse' && interactionMode < 2) setHoveredBridgeId(null); }}
                               className={bridgeGroupClass}>

                               {b.type === 'h' ? (
                                  <rect x={Math.min(x1, x2) + ISLAND_RADIUS} y={y1 - 20} width={Math.abs(x1 - x2) - ISLAND_RADIUS * 2} height={40} className={isCrossed ? 'fill-transparent' : bridgeRectClass} />
                                ) : (
                                  <rect x={x1 - 20} y={Math.min(y1, y2) + ISLAND_RADIUS} width={40} height={Math.abs(y1 - y2) - ISLAND_RADIUS * 2} className={isCrossed ? 'fill-transparent' : bridgeRectClass} />
                                )}

                               {isCrossed && isIslandHovered && (
                                    b.type === 'h' ? (
                                        <rect x={Math.min(x1, x2) + ISLAND_RADIUS} y={y1 - 8} width={Math.abs(x1 - x2) - ISLAND_RADIUS * 2} height={16} fill="url(#warningStripe)" className="pointer-events-none animate-fadeIn" />
                                    ) : (
                                        <rect x={x1 - 8} y={Math.min(y1, y2) + ISLAND_RADIUS} width={16} height={Math.abs(y1 - y2) - ISLAND_RADIUS * 2} fill="url(#warningStripe)" className="pointer-events-none animate-fadeIn" />
                                    )
                               )}
                            </g>
                          );
                      }

                      let linesToDraw = [];
                      if (totalLines === 1) {
                          linesToDraw.push({ isDraft: b.draftCount === 1, offset: 0 });
                      } else if (totalLines === 2) {
                          if (b.count === 2) {
                              linesToDraw.push({ isDraft: false, offset: -5 });
                              linesToDraw.push({ isDraft: false, offset: 5 });
                          } else if ((b.draftCount || 0) === 2) {
                              linesToDraw.push({ isDraft: true, offset: -5 });
                              linesToDraw.push({ isDraft: true, offset: 5 });
                          } else {
                              linesToDraw.push({ isDraft: false, offset: -5 });
                              linesToDraw.push({ isDraft: true, offset: 5 });
                          }
                      }

                      return (
                        <g key={b.id}
                           onPointerDown={(e) => handleBridgePointerDown(e, b)}
                           style={interactionMode < 2 ? { touchAction: 'none' } : undefined}
                           onPointerEnter={(e) => { if(e.pointerType==='mouse' && interactionMode < 2) setHoveredBridgeId(b.id); }}
                           onPointerLeave={(e) => { if(e.pointerType==='mouse' && interactionMode < 2) setHoveredBridgeId(null); }}
                           className={bridgeGroupClass}>
                          {b.type === 'h' ? (
                            <rect x={Math.min(x1, x2) + ISLAND_RADIUS} y={y1 - 20} width={Math.abs(x1 - x2) - ISLAND_RADIUS * 2} height={40} className={bridgeRectClass} />
                          ) : (
                            <rect x={x1 - 20} y={Math.min(y1, y2) + ISLAND_RADIUS} width={40} height={Math.abs(y1 - y2) - ISLAND_RADIUS * 2} className={bridgeRectClass} />
                          )}
                          {linesToDraw.map((lineObj, lIdx) => {
                              const isDraft = lineObj.isDraft;
                              const off = lineObj.offset;
                              const w = totalLines === 1 ? (isDraft ? "5" : "6") : (isDraft ? "4" : "5");
                              const op = isDraft ? (lineOpacity * 0.4) : lineOpacity;
                              const dash = isDraft ? "8,6" : "none";
                              if (b.type === 'h') {
                                 return <line key={lIdx} x1={x1} y1={y1+off} x2={x2} y2={y2+off} stroke={isRainbow ? undefined : lineStroke} strokeWidth={w} strokeLinecap="round" strokeOpacity={op} strokeDasharray={dash} className={bridgeLineClass} style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />;
                              } else {
                                 return <line key={lIdx} x1={x1+off} y1={y1} x2={x2+off} y2={y2} stroke={isRainbow ? undefined : lineStroke} strokeWidth={w} strokeLinecap="round" strokeOpacity={op} strokeDasharray={dash} className={bridgeLineClass} style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />;
                              }
                          })}
                        </g>
                      );
                    })}

                    {/* 拖曳架橋預覽線：跟著手指的直線預覽（ref 即時更新，不走 React state） */}
                    <line
                        ref={dragPreviewLineRef}
                        x1="0" y1="0" x2="0" y2="0"
                        stroke={myCurrentColor === 'rainbow' ? '#fbbf24' : myCurrentColor}
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeOpacity="0.9"
                        className="solution-line pointer-events-none"
                        style={{ display: 'none' }}
                    />
                    <circle
                        ref={dragPreviewTipRef}
                        cx="0" cy="0" r="9"
                        fill={myCurrentColor === 'rainbow' ? '#fbbf24' : myCurrentColor}
                        fillOpacity="0.9"
                        className="pointer-events-none animate-pulse"
                        style={{ display: 'none' }}
                    />

                    {islandsToRender.map(island => {
                      const cx = island.x * SCALE + PADDING; const cy = island.y * SCALE + PADDING; const current = islandCurrentCounts[island.id].total;
                      let strokeColor = "#1e293b"; let bgColor = "#ffffff"; let textColor = "#1e293b";
                      if (current === island.req) { strokeColor = "#059669"; bgColor = "#d1fae5"; textColor = "#065f46"; }
                      else if (current > island.req) { strokeColor = "#dc2626"; bgColor = "#fee2e2"; textColor = "#991b1b"; }

                      const showHighlight = highlightedIslandIds.has(island.id) && interactionMode < 2;
                      const isDirectlyHovered = hoveredIslandId === island.id && interactionMode < 2;

                      return (
                        <g key={`island-${island.id}`} className="hashi-island"
                           onPointerEnter={(e) => { if(e.pointerType==='mouse' && interactionMode < 2) setHoveredIslandId(island.id); }}
                           onPointerLeave={(e) => { if(e.pointerType==='mouse' && interactionMode < 2) setHoveredIslandId(null); }}
                           onPointerDown={(e) => handleIslandPointerDown(e, island)}
                           style={interactionMode < 2 ? { touchAction: 'none' } : undefined}
                        >
                          {showHighlight && (
                              <circle cx={cx} cy={cy} r={ISLAND_RADIUS + 8} fill="#fde047" fillOpacity="0.5" className="pointer-events-none transition-all duration-300" />
                          )}

                          <circle cx={cx + 3} cy={cy + 3} r={ISLAND_RADIUS} fill="rgba(30,41,59,0.2)" className="pointer-events-none" />
                          <circle cx={cx} cy={cy} r={ISLAND_RADIUS} fill={bgColor} stroke={strokeColor} strokeWidth="4" className="transition-colors duration-300" />
                          <circle cx={cx - 6} cy={cy - 7} r={ISLAND_RADIUS * 0.55} fill="url(#islandShine)" className="pointer-events-none" />
                          <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="central" className="text-xl font-black font-sans pointer-events-none select-none transition-colors duration-300" fill={textColor}>{island.req}</text>

                          {/* 只在被阻擋的路徑顯示紅色 X 提示，拔除原本的黃色提示點 */}
                          {isDirectlyHovered && activeHints.map(b => {
                             if (!crossedBridgeIds.has(b.id)) return null;

                             let dotCx = cx;
                             let dotCy = cy;
                             const offset = ISLAND_RADIUS + 14;
                             if (b.type === 'h') {
                                 if (b.from === island.id) dotCx += offset;
                                 else dotCx -= offset;
                             } else {
                                 if (b.from === island.id) dotCy += offset;
                                 else dotCy -= offset;
                             }

                             return (
                                 <g key={`hint-${b.id}`} className="pointer-events-none animate-pulse" transform={`translate(${dotCx}, ${dotCy})`}>
                                     <line x1="-5" y1="-5" x2="5" y2="5" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                                     <line x1="5" y1="-5" x2="-5" y2="5" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                                 </g>
                             );
                          })}
                        </g>
                      );
                    })}

                    {bursts.map(b => (
                      <g key={b.id} className="pointer-events-none">
                        {b.parts.map((pt, i) => (
                          <circle key={i} cx={b.x} cy={b.y} r="5" fill={b.color} className="burst-particle" style={{ '--bx': pt.dx + 'px', '--by': pt.dy + 'px' }} />
                        ))}
                      </g>
                    ))}

                    <circle
                        ref={eraserRef}
                        r="15"
                        fill={myCurrentColor === 'rainbow' ? undefined : myCurrentColor}
                        fillOpacity="0.4"
                        stroke={myCurrentColor === 'rainbow' ? undefined : myCurrentColor}
                        strokeWidth="2"
                        className={`pointer-events-none ${myCurrentColor === 'rainbow' ? 'rainbow-stroke rainbow-fill' : ''}`}
                        style={{ display: 'none' }}
                    />

                    {showOtherCursors && mpMode !== 'race' && engineRef.current === 'peerjs' && Object.entries(cursors).map(entry => {
                        const uid = entry[0]; const pos = entry[1];
                        if (uid === myId) return null;
                        const player = playersList.find(p => p.id === uid);
                        if (!player) return null;
                        const isRainbow = player.color === 'rainbow';
                        return (
                            <g key={`cursor-${uid}`} transform={`translate(${pos.x}, ${pos.y})`} className="pointer-events-none transition-transform duration-75 ease-linear">
                               <path d="M0,0 L16,6 L10,10 L15,19 L11,21 L6,12 L0,18 Z" fill={isRainbow ? undefined : player.color} stroke="white" strokeWidth="2" className={isRainbow ? 'rainbow-fill' : ''} />
                               <rect x="14" y="22" rx="4" ry="4" width={player.name.length * 14 + 12} height="22" fill="rgba(0,0,0,0.6)" />
                               <text x="20" y="37" fill="white" fontSize="13" fontWeight="bold">{player.name}</text>
                            </g>
                        );
                    })}

                    {(engineRef.current === 'peerjs' ? showOtherCursors : true) && ripples.map(r => {
                        const player = playersList.find(p => p.id === r.uid);
                        const color = player ? player.color : '#3b82f6';
                        const isRainbow = color === 'rainbow';
                        return (
                            <circle key={r.id} cx={r.x} cy={r.y} r="20" fill="none" stroke={isRainbow ? undefined : color} className={`pointer-events-none ${isRainbow ? 'rainbow-stroke' : ''}`} style={{ transformOrigin: `${r.x}px ${r.y}px`, animation: 'rippleAnim 0.8s ease-out forwards' }} />
                        );
                    })}

                    {/* ☁️ 雲霧（最上層）：一團團雲 puff 蓋住命中區，橋和數字全遮；雲團面積上限＝盤面 1/5（命中時已夾半徑）；fog-box-in 淡入進場、到期前淡出，內層緩慢漂移 */}
                    {fxFogBoxes.filter(b => b.until > fxNow).map(b => {
                        const remain = b.until - fxNow;
                        const op = remain > 1600 ? 1 : Math.max(0.12, remain / 1600);
                        const RR = b.R || 90, CCX = (b.cx != null ? b.cx : (b.minX + b.maxX) / 2 * SCALE + PADDING), CCY = (b.cy != null ? b.cy : (b.minY + b.maxY) / 2 * SCALE + PADDING);
                        return (
                          <g key={b.id} className="pointer-events-none fog-box-in" style={{ opacity: op, transition: 'opacity 0.5s ease', transformBox: 'fill-box', transformOrigin: 'center' }}>
                            <g className="fog-cloud-drift">
                              <g transform={`translate(${CCX} ${CCY}) scale(1 0.84) translate(${-CCX} ${-CCY})`}>
                                <ellipse cx={CCX} cy={CCY} rx={RR * 0.68} ry={RR * 0.62} fill="#f7fafc" fillOpacity="0.97" />
                                {(b.puffs || []).map((pf, i) => (
                                  <circle key={i} cx={pf.x} cy={pf.y} r={pf.r} fill="url(#fogPuff)" />
                                ))}
                              </g>
                            </g>
                          </g>
                        );
                    })}
                    {/* 💥／✨ 特效標記：被炸的橋與禮物補橋處的動畫（fx-mark-pop 放大淡出） */}
                    {fxMarks.filter(mk => mk.until > fxNow).map(mk => (
                      <text key={mk.id} x={mk.gx * SCALE + PADDING} y={mk.gy * SCALE + PADDING} textAnchor="middle" dominantBaseline="central" fontSize="30" className="pointer-events-none select-none fx-mark-pop" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>{mk.icon}</text>
                    ))}
                  </svg>
                </div>
              </div>

              {(raceState === 'spectating' || (inRace && raceWaiting)) && (
                <div className="relative z-0 flex-1 min-h-0 overflow-y-auto p-4 plat-chat-clear">
                  <div className="max-w-md mx-auto bg-white border-4 border-[#1e293b] rounded-2xl shadow-[10px_10px_0px_#1e293b] p-5 mt-2">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-black text-[#1e293b]"><span key={raceState === 'spectating' ? 'spec' : 'fin'} className="plat-lite-in" style={{ display: 'inline-block' }}>{raceState === 'spectating' ? '👁️ 觀戰中' : '🏁 已完賽・觀戰中'}</span></h2>
                      <span className="text-xs font-semibold text-slate-400">比賽結束後自動顯示結果</span>
                    </div>
                    <div className="flex gap-1.5 mb-3 flex-wrap">
                      {raceRacers.filter(uid => raceState === 'spectating' || uid !== myId).map(uid => {
                        const p = playersList.find(x => x.id === uid);
                        return <button key={uid} onClick={() => setGodViewUid(uid)} className={"px-2.5 py-1 rounded-lg border-2 border-slate-800 font-black text-xs " + (spectateUid === uid ? "bg-slate-800 text-white" : "bg-white text-slate-700")}>{p ? p.name : '選手'}</button>;
                      })}
                    </div>
                    {spectateUid && brawlBoards[spectateUid] ? renderGodBoard(brawlBoards[spectateUid]) : <p className="font-bold text-slate-400 text-center py-8">等待選手盤面同步…</p>}
                  </div>
                </div>
              )}

              {typeof window.PlatBar !== 'undefined' ? (<div ref={platBarRef} className="shrink-0 relative z-30"></div>) : (<React.Fragment>)}
              {/* 底部工具列（比照數獨排列：左縮放 / 右模式切換，繪圖子工具居中） */}
              <div className="shrink-0 bg-[#fffdfa]/95 backdrop-blur-md border-t-[4px] border-slate-800 min-h-[4rem] md:min-h-[5rem] flex flex-wrap items-center justify-between gap-x-2 gap-y-1 py-1 px-3 md:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] relative z-30">
                <div className="flex items-center gap-1.5 md:gap-3 bg-slate-100 p-1 rounded-xl border-2 border-slate-300 relative">
                  <button onClick={() => setZoomOpen(!zoomOpen)} title="縮放（點開/收合）" className="plat-btn-hard plat-btn-hard-2 w-11 h-11 md:w-14 md:h-14 bg-white border-[3px] border-slate-800 rounded-lg shadow-[2px_2px_0px_#1e293b] flex items-center justify-center text-base md:text-lg font-black hover:bg-[#4ade80]">🔍</button>
                  {zoomOpen && (
                    <div className="absolute bottom-full mb-3 left-0 flex flex-col gap-2 bg-white border-[3px] border-slate-800 p-2 rounded-2xl shadow-[6px_6px_0px_rgba(30,41,59,0.25)] animate-popUpCenter z-50">
                      <button onClick={handleZoomIn} title="放大" className="plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-white border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-xl font-black shadow-[2px_2px_0px_#1e293b]">＋</button>
                      <button onClick={handleZoomOut} title="縮小" className="plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-white border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-xl font-black shadow-[2px_2px_0px_#1e293b]">－</button>
                      <button onClick={handleCycleZoom} title="循環切換縮放模式（自動適應）" className="plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-slate-800 border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-[2px_2px_0px_#1e293b]">
                        {zoomModeIdx === 0 ? '1x' : zoomModeIdx === 1 ? '↔️' : zoomModeIdx === 2 ? '↕️' : '🔲'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 md:gap-2 ml-auto bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner relative">
                  <button onClick={() => { if (interactionMode === 2 && !drawSubOpen) { setDrawSubOpen(true); return; } advanceHashiMode(); }} title="切換模式（畫筆/草稿/繪圖）" className={`px-3 md:px-5 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-base flex items-center gap-1.5 md:gap-2 transition-all shadow-md ${interactionMode === 2 ? 'bg-emerald-400 text-slate-900' : 'bg-[#4ade80] text-slate-900'}`}>
                    <span>{interactionMode === 0 ? '🖋️' : interactionMode === 1 ? '✏️' : '🖌️'}</span>
                    <span className="hidden sm:inline">{interactionMode === 0 ? '畫筆' : interactionMode === 1 ? '草稿' : '繪圖'}</span>
                    <span className="text-[10px] opacity-60">▾</span>
                  </button>
                  {interactionMode === 2 && drawSubOpen && (
                    <div className="absolute bottom-full mb-6 right-0 flex flex-col gap-3 bg-white border-[3px] border-slate-800 p-2.5 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,0.2)] animate-popUpCenter pointer-events-auto">
                      <button onClick={() => setDrawSubMode('pen')} className={`w-12 h-12 border-[3px] border-slate-800 rounded-xl flex items-center justify-center transition-all shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-[2px] ${drawSubMode === 'pen' ? 'bg-emerald-100 scale-110 border-emerald-600' : 'bg-white hover:bg-slate-50'}`} title="畫筆模式">🖌️</button>
                      <button onClick={() => setDrawSubMode('eraser')} onDoubleClick={clearOwnStrokes} className={`w-12 h-12 border-[3px] border-slate-800 rounded-xl flex items-center justify-center transition-all shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-[2px] ${drawSubMode === 'eraser' ? 'bg-orange-100 scale-110 border-orange-600' : 'bg-white hover:bg-slate-50'}`} title="橡皮擦 (雙擊清除自己所有塗鴉)">🧽</button>
                      {isHostRef.current && (<button onClick={clearAllStrokes} className="plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-rose-50 border-[3px] border-rose-800 text-rose-800 rounded-xl flex items-center justify-center hover:bg-rose-100 shadow-[2px_2px_0px_#1e293b]" title="房主：清除全場塗鴉">🚮</button>)}
                    </div>
                  )}
                </div>
                {renderDockCapsule(false)}
              </div>
              </React.Fragment>)}

              {resultsDismissedUi && inRace && raceState === 'finished' && (
                <button onClick={() => { resultsDismissRef.current = null; setResultsDismissedUi(false); }} className="plat-btn-hard plat-btn-hard-3 fixed bottom-24 right-3 z-[56] bg-white border-[3px] border-slate-800 rounded-full px-4 py-2 font-black shadow-[3px_3px_0px_#1e293b]">🏆 結果</button>
              )}

              {showExitMenu && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4" onClick={() => setShowExitMenu(false)}>
                  <div className="bg-white border-4 border-[#1e293b] rounded-2xl shadow-[10px_10px_0px_#1e293b] p-6 w-full max-w-xs text-center animate-popUpCenter" onClick={e => e.stopPropagation()}>
                    <div className="font-black text-xl text-[#1e293b] mb-4">要離開對局嗎？</div>
                    {(typeof window !== 'undefined' && window.__PLAT_TOURN_CAN_FORCEEND && window.__PLAT_TOURN_CAN_FORCEEND()) && (
                      <button onClick={() => { setShowExitMenu(false); if (window.__PLAT_TOURN_FORCEEND) window.__PLAT_TOURN_FORCEEND(); }} className="plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 bg-rose-500 text-white border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_#1e293b]">⏹️ 結束本局（錦標賽）</button>
                    )}
                    <button onClick={() => { setShowExitMenu(false); requestLobby(); }} className="plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 bg-white text-slate-800 border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_#1e293b]">🏁 回等待室</button>
                    <button onClick={() => { setShowExitMenu(false); handleGoHome('leave'); }} className="plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 bg-white text-slate-800 border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_#1e293b]">🚪 退出（回大廳）</button>
                    <button onClick={() => setShowExitMenu(false)} className="w-full py-2 text-slate-400 font-bold hover:text-slate-700">取消</button>
                  </div>
                </div>
              )}

              {roomOpen && platHub && platTournLock ? (
                <div className="absolute inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-[2px] p-4 flex">
                  <div className="bg-[#fffaf0] border-4 border-[#1e293b] rounded-2xl shadow-[10px_10px_0px_#1e293b] p-6 max-w-md w-full my-auto mx-auto">
                    <div className="text-center text-4xl mb-1">🏆</div>
                    <div className="font-black text-2xl text-[#1e293b] text-center">錦標賽・{(tournRoundInfo && tournRoundInfo.playoff) ? '加賽' : ('第 ' + ((tournRoundInfo && tournRoundInfo.round) || '?') + ' 局')}</div>
                    <div className="font-semibold text-slate-400 text-sm text-center mt-1 mb-4">本局：數橋大亂鬥・全員準備好房主才能開始，或等滿 1 分鐘強制開始</div>
                    <div className="flex flex-col gap-2 mb-4">
                      {playersList.filter(p => !p.isSpectator).map(p => (
                        <div key={p.id} className="flex items-center gap-2 bg-slate-50 border-2 border-slate-800 rounded-xl px-3 py-2 font-black text-slate-800">
                          <span className="w-4 h-4 rounded-full border-2 border-slate-800 inline-block shrink-0" style={{ background: p.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : p.color }}></span>
                          <span className="truncate">{p.name}{p.isHost ? ' 👑' : ''}{p.id === myId ? '（你）' : ''}</span>
                          <span className="ml-auto shrink-0">{p.pending ? <span className="text-[10px] bg-slate-100 border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded-md">未到</span> : (p.isReady ? <span className="text-[10px] bg-emerald-100 border border-emerald-500 text-emerald-700 px-1.5 py-0.5 rounded-md">✅ 準備好了</span> : <span className="text-[10px] bg-slate-100 border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded-md">未準備</span>)}</span>
                        </div>
                      ))}
                    </div>
                    {tournMyEntry && !tournMyEntry.pending && (
                      <button onClick={() => setMyReady(!(tournMyEntry && tournMyEntry.isReady))} className={"plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 rounded-xl border-[3px] border-slate-800 font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)]" + (tournMyEntry.isReady ? ' bg-amber-400 text-slate-900' : ' bg-white text-slate-500')}>{tournMyEntry.isReady ? '✅ 已準備（點擊取消）' : '✋ 準備好了'}</button>
                    )}
                    {isHostRef.current ? (
                      <div>
                        <button onClick={() => { if (mpModeRef.current === 'race') startRace(); else startCoop(); }} disabled={!tournCanStart} className="w-full py-3 bg-red-500 text-white border-[3px] border-slate-800 rounded-xl font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed">🏁 開始本局</button>
                        <p className="text-xs text-slate-500 font-semibold text-center mt-2">{tournStartNote}</p>
                      </div>
                    ) : (
                      <p className="font-black text-slate-700 animate-pulse text-center">等待房主開始...</p>
                    )}
                  </div>
                </div>
              ) : roomOpen && platHub ? (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4">
                  <div className="bg-[#fffaf0] border-4 border-[#1e293b] rounded-2xl shadow-[10px_10px_0px_#1e293b] p-8 text-center max-w-sm w-full">
                    <div className="text-5xl mb-3">⏳</div>
                    <div className="font-black text-2xl text-[#1e293b] animate-pulse">等房主開始對局…</div>
                    <div className="font-semibold text-slate-400 text-sm mt-2">準備和設定都在房間頁完成了，馬上開始</div>
                  </div>
                </div>
              ) : null}


              {raceCountdown !== null && !(typeof window !== 'undefined' && window.PlatCountdown) && (
                <div className="absolute inset-0 z-[65] flex items-center justify-center pointer-events-none">
                  <div key={raceCountdown} className="animate-countdownPop text-8xl md:text-9xl font-black text-[#1e293b] bg-[#4ade80] border-4 border-slate-800 rounded-3xl px-10 py-6 shadow-[10px_10px_0px_rgba(30,41,59,1)]">
                    {raceCountdown === 0 ? 'GO!' : raceCountdown}
                  </div>
                </div>
              )}

              {/* 被放技能的狀態改浮動 overlay（比照數獨：不進版面流、不推移棋盤；被打到的通知另有 toast） */}
              {inRace && raceState === 'racing' && Object.keys(fxFog).some(id => fxFog[id] > fxNow) && (
                <div className="absolute top-2 left-2 z-[57] flex gap-1.5 pointer-events-none">
                  <span className="px-2 py-1 bg-slate-200/95 border-2 border-slate-400 text-slate-600 rounded-lg font-black text-xs shadow">🌫️ 迷霧中</span>
                </div>
              )}

              {inRace && raceState === 'finished' && raceResult && !(typeof window !== 'undefined' && window.PlatResults) && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
                  <div className="bg-white rounded-2xl p-6 md:p-8 border-[4px] border-[#1e293b] shadow-[10px_10px_0px_#1e293b] text-center min-w-[300px] max-w-md w-full animate-popUpCenter max-h-[92vh] overflow-y-auto">
                    <div className="text-5xl mb-2">🏆</div>
                    <h2 className="text-2xl font-black text-[#1e293b] mb-4">大亂鬥結果</h2>
                    {raceResult.entries.map((e, idx) => (
                      <div key={e.uid} className={'flex items-center justify-between gap-3 px-4 py-2 mb-2 rounded-xl border-[3px] ' + (idx === 0 ? 'bg-[#4ade80] border-slate-800' : 'bg-slate-50 border-slate-300')}>
                        <span className="font-black text-slate-800 truncate">{['🥇', '🥈', '🥉'][idx] || ((idx + 1) + '.')} {e.name}{e.uid === myId ? '(你)' : ''}</span>
                        <span className="font-mono font-black text-slate-800 shrink-0">{e.finished ? formatTime(Math.floor(e.timeMs / 1000)) : ('未完成 · ' + Math.round((e.progress || 0) * 100) + '%')}</span>
                      </div>
                    ))}
                    {raceResult.winnerUid === myId ? (
                      <p className="text-emerald-600 font-black text-lg my-2">🎉 你贏了！</p>
                    ) : (
                      <p className="text-slate-500 font-black text-lg my-2">{raceResult.entries.some(e => e.uid === myId && e.finished) ? '完賽了，名次如上！' : '比賽結束，結果如上'}</p>
                    )}
                    {raceResult.entries.some(e => e.uid === myId && e.finished) && (
                      <div className="flex justify-center gap-2 my-3">
                        {[0, 1, 2].map(i => (
                          <span key={i} className={i < stars ? "animate-starPop text-4xl inline-block" : "text-4xl inline-block opacity-20 grayscale"} style={i < stars ? { animationDelay: (i * 0.3) + 's' } : {}}>⭐</span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-center gap-2 mt-4 flex-wrap">
                      <button onClick={() => { const opps = Object.keys(brawlBoards); if (opps.length) setGodViewUid(opps[0]); }} disabled={Object.keys(brawlBoards).length === 0} className="px-4 py-3 bg-sky-200 text-slate-900 border-4 border-slate-800 font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all disabled:opacity-40">👁️ 看盤面</button>
                      <button onClick={playAgain} className="px-4 py-3 bg-[#4ade80] text-slate-900 border-4 border-slate-800 font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all">🔁 再來一局</button>
                      <button onClick={requestLobby} className="px-4 py-3 bg-red-400 text-slate-900 border-4 border-slate-800 font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all">🏁 回等待室</button>
                      <button onClick={handleGoHome} className="px-4 py-3 bg-white text-slate-800 border-4 border-slate-800 font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all">離開</button>
                    </div>
                    {!isHostRef.current && <p className="text-xs font-semibold text-slate-400 mt-3">再來一局／回等待室都會帶全員一起</p>}
                  </div>
                </div>
              )}

              {confetti.length > 0 && !hideVictoryModal && (
                <div className="absolute inset-0 z-[55] pointer-events-none overflow-hidden">
                  {confetti.map(c => (
                    <div key={c.id} className="confetti-piece absolute -top-4" style={{ left: c.left + '%', width: c.w + 'px', height: c.h + 'px', backgroundColor: c.color, animationDuration: c.dur + 's', animationDelay: c.delay + 's' }} />
                  ))}
                </div>
              )}

              {isWon && !hideVictoryModal && !inRace && (
                <div className={`absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] pointer-events-auto ${isClosingModal ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
                  <div className={`bg-white rounded-2xl p-6 md:p-8 border-[4px] border-[#1e293b] shadow-[10px_10px_0px_#1e293b] text-center min-w-[280px] md:min-w-[320px] relative ${isClosingModal ? 'animate-popOutCenter' : 'animate-popUpCenter'}`}>
                    <button onClick={closeVictoryModal} className="absolute top-2 right-4 text-slate-400 hover:text-[#1e293b] text-2xl font-black">✕</button>
                    <div className="text-5xl md:text-6xl mb-3">💥🏆</div>
                    <h2 className="text-2xl md:text-3xl font-black text-[#1e293b] mb-2 uppercase tracking-wide">PERFECT!</h2>
                    <p className="text-slate-600 mb-1 text-sm md:text-base font-bold">所有的島嶼都成功連結了！</p>
                    <p className="text-blue-600 mb-1 text-sm md:text-base font-bold">完成時間：{endTime ? formatTime(Math.floor((endTime - startTime) / 1000)) : "00:00"}</p>
                    <div className="flex justify-center gap-2 my-3">
                      {[0, 1, 2].map(i => (
                        <span key={i} className={i < stars ? "animate-starPop text-4xl md:text-5xl inline-block" : "text-4xl md:text-5xl inline-block opacity-20 grayscale"} style={i < stars ? { animationDelay: (i * 0.3) + 's' } : {}}>⭐</span>
                      ))}
                    </div>
                    {isNewBest && <p className="text-amber-600 font-black mb-2 animate-pulse">🎉 新紀錄！</p>}
                    {isDailyMode ? (
                      <p className="text-emerald-600 mb-6 text-sm md:text-base font-black border-b-[3px] border-dashed border-slate-300 pb-4">✅ 今日挑戰完成！明天再來</p>
                    ) : (
                      <div className="border-b-[3px] border-dashed border-slate-300 mb-6"></div>
                    )}
                    <div className="flex justify-center gap-3">
                      {isDailyMode ? (
                        <button onClick={triggerDailyHome} className="px-5 py-3 bg-[#4ade80] text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all text-base md:text-lg">回主選單 🏠</button>
                      ) : engine === 'peerjs' ? (
                        <React.Fragment>
                          <button onClick={playAgain} className="px-5 py-3 bg-[#4ade80] text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all text-base md:text-lg">再來一局 ➔</button>
                          <button onClick={requestLobby} className="px-5 py-3 bg-white text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all text-base md:text-lg">回等待室</button>
                        </React.Fragment>
                      ) : (
                        <button onClick={triggerRegenerate} className="px-5 py-3 bg-[#4ade80] text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all text-base md:text-lg">再來一局 ➔</button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isWon && hideVictoryModal && (
                <div className="absolute bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none">
                  <button onClick={() => setHideVictoryModal(false)} className="pointer-events-auto bg-[#4ade80] text-[#1e293b] border-[4px] border-[#1e293b] px-6 py-3 rounded-full shadow-[6px_6px_0px_#1e293b] hover:translate-y-[2px] transition-all font-black flex items-center gap-2 tracking-wide text-lg">🏆 顯示成績</button>
                </div>
              )}
            </div>
          </div>

          {/* 存檔彈窗 */}
          {showSaveModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
              <div className="bg-[#f6fdf6] border-[4px] border-[#1e293b] rounded-2xl p-6 shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full max-w-md animate-popUp">
                <h2 className="text-2xl font-black text-slate-800 mb-2 border-b-4 border-blue-500 inline-block pb-1">💾 存檔與讀檔</h2>
                <p className="text-sm font-bold text-slate-600 mb-4">將進度轉換為代碼，下次貼上代碼即可恢復！</p>
                <div className="mb-6">
                  <button onClick={handleSaveCode} className="plat-btn-hard w-full py-3 bg-blue-500 text-white border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] mb-3 text-base md:text-lg">產生進度代碼 (自動複製)</button>
                  <div className="relative">
                    <textarea id="saveCodeTextarea" value={saveCode} onChange={(e) => setSaveCode(e.target.value)} placeholder="點擊上方按鈕生成，或是手動貼上舊代碼至此處" rows="4" className="w-full border-4 border-slate-800 rounded-xl p-3 pb-12 font-mono text-sm shadow-inner outline-none focus:bg-blue-50 break-all bg-white" />
                    <button onClick={handleQuickPaste} className="plat-btn-hard plat-btn-hard-2 absolute bottom-3 right-3 bg-[#4ade80] text-slate-900 px-3 py-1.5 rounded-lg text-sm font-black border-2 border-slate-800 hover:bg-[#e6b800] shadow-[2px_2px_0px_rgba(30,41,59,1)]">📋 快速貼上</button>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowSaveModal(false)} className="plat-btn-hard flex-1 py-3 bg-white border-4 border-slate-800 rounded-xl font-black text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)]">關閉</button>
                  <button onClick={handleLoadCode} className="plat-btn-hard flex-1 py-3 bg-emerald-400 text-slate-900 border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)]">載入代碼</button>
                </div>
              </div>
            </div>
          )}

          {/* 設定難度彈窗（v1.43 Q2：比照數獨設定 modal 的入口形式） */}
          {showSettingsModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={closeSettingsModal}>
              <div className="bg-[#f6fdf6] border-[4px] border-[#1e293b] rounded-2xl p-6 shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full max-w-md animate-popUp" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-black text-slate-800 mb-2 border-b-4 border-[#4ade80] inline-block pb-1">⚙️ 設定難度</h2>
                <p className="text-sm font-bold text-slate-600 mb-4">{soloPick ? '選一個難度，開始一局新的挑戰。' : '選一個難度，立刻換一題新的。'}</p>
                <div className="flex flex-col gap-2 mb-4">
                  {LEVELS.map(level => (
                    <button key={level.id} onClick={() => { setShowSettingsModal(false); if (soloPick && level.id !== 'custom') { platSave().setStr('hashi_solo_level', String(level.id)); setSoloPick(false); } handleLevelChange(level.id === 'custom' ? 'custom' : level.id); }} className={"plat-btn-hard plat-btn-hard-3 w-full text-left px-4 py-3 border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_rgba(30,41,59,1)]" + (String(currentLevelId) === String(level.id) ? " bg-[#4ade80] text-slate-900" : " bg-white text-slate-800")}>
                      {level.name}
                      <span className="block text-xs font-bold opacity-70 mt-0.5">{level.description}</span>
                    </button>
                  ))}
                </div>
                <button onClick={closeSettingsModal} className="plat-btn-hard w-full py-3 bg-white border-4 border-slate-800 rounded-xl font-black text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)]">取消</button>
              </div>
            </div>
          )}

          {/* 自訂地圖彈窗 */}
          {showCustomModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
              <div className="bg-[#f6fdf6] border-[4px] border-[#1e293b] rounded-2xl p-6 shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full max-w-sm animate-popUpCenter">
                <div className="flex justify-between items-center mb-4 border-b-4 border-slate-800 pb-2">
                  <h2 className="text-xl font-black text-slate-800">⚙️ 自訂地圖尺寸</h2>
                  <button onClick={() => {
                      setShowCustomModal(false);
                      setCurrentLevelId(stateRef.current.levelId);
                      if (soloPick) { setSoloPick(false); setScreen('home'); }
                  }} className="text-slate-400 hover:text-slate-800 text-2xl font-black">✕</button>
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-4">輸入專屬長寬（5 ~ 100），生成超大型合作地圖：</p>
                <div className="flex flex-col gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1">寬度 (橫向島嶼數):</label>
                    <input type="number" min="5" max="100" value={tempWidth} onChange={(e) => setTempWidth(parseInt(e.target.value) || 5)} className="w-full border-2 border-slate-800 rounded-md p-2 font-bold focus:ring-2 ring-[#4ade80] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1">長度 (直向島嶼數):</label>
                    <input type="number" min="5" max="100" value={tempHeight} onChange={(e) => setTempHeight(parseInt(e.target.value) || 5)} className="w-full border-2 border-slate-800 rounded-md p-2 font-bold focus:ring-2 ring-[#4ade80] outline-none" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => {
                      setShowCustomModal(false);
                      setCurrentLevelId(stateRef.current.levelId);
                      if (soloPick) { setSoloPick(false); setScreen('home'); }
                  }} className="plat-btn-hard plat-btn-hard-2 flex-1 py-2 bg-slate-200 border-2 border-slate-800 rounded-xl font-black text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] hover:bg-slate-300">取消</button>
                  <button onClick={handleCustomGenerate} className="plat-btn-hard plat-btn-hard-2 flex-1 py-2 bg-[#4ade80] border-2 border-slate-800 rounded-xl font-black text-slate-900 shadow-[2px_2px_0px_rgba(30,41,59,1)] hover:bg-[#e6b800]">產生</button>
                </div>
              </div>
            </div>
          )}

          {toastMsg && <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full font-bold shadow-[0_4px_10px_rgba(0,0,0,0.3)] z-[100] border-[3px] border-white animate-slideUpFade">{toastMsg}</div>}
          {speakPrompt && !speakerOn && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[96] bg-slate-800 text-white pl-4 pr-2 py-2 rounded-full font-bold shadow-[0_4px_10px_rgba(0,0,0,0.35)] border-[3px] border-white flex items-center gap-2 whitespace-nowrap max-w-[calc(100%-16px)]">
              <span className="truncate">🔊 {speakPrompt.name} 發言中，開啟音效？</span>
              <button onClick={() => setSpeakerOn(true)} className="bg-[#4ade80] text-slate-900 px-3 py-1 rounded-full font-black border-2 border-slate-900 shrink-0">開啟</button>
              <button onClick={() => setSpeakPrompt(null)} className="bg-white/20 text-white px-2 py-1 rounded-full font-black shrink-0">✕</button>
            </div>
          )}

          {chatOpen && !PLAT_MODE && engineRef.current === 'peerjs' && (
            <div className="absolute inset-0 z-[95] flex items-end justify-center pointer-events-none p-3">
              <div className="pointer-events-auto w-full max-w-md bg-[#f6fdf6]/90 backdrop-blur-[2px] border-4 border-slate-800 rounded-2xl shadow-[4px_4px_0px_rgba(30,41,59,0.6)] flex flex-col overflow-hidden" style={chatMin ? {} : { height: '40vh', maxHeight: '380px' }}>
                <div onClick={() => setChatMin(prev => !prev)} className="flex items-center justify-between px-3 py-2 bg-[#4ade80] border-b-[3px] border-slate-800 shrink-0 cursor-pointer select-none">
                  <span className="font-black text-slate-900">💬 聊天室 {unreadChat > 0 && <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black inline-flex items-center justify-center border-2 border-white align-middle">{unreadChat > 99 ? '99+' : unreadChat}</span>}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800">{chatMin ? '🔼' : '🔽'}</span>
                    <button onClick={(e) => { e.stopPropagation(); setChatOpen(false); }} className="w-7 h-7 rounded-full bg-white border-2 border-slate-800 font-black text-slate-800 text-sm leading-none">✕</button>
                  </div>
                </div>
                {!chatMin && (
                <React.Fragment>
                <div ref={chatListRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                  {chatMsgs.length === 0 && <p className="text-center text-slate-400 text-xs font-semibold py-8">還沒有訊息，打個招呼吧！👋</p>}
                  {chatMsgs.map(m => (
                    <div key={m.id} className={"flex " + (m.mine ? "justify-end" : "justify-start")}>
                      <div className={"max-w-[82%] px-2.5 py-1.5 rounded-xl border-2 border-slate-800 " + (m.mine ? "bg-[#4ade80]" : "bg-white")}>
                        {!m.mine && <div className="text-[10px] font-black leading-tight" style={{ color: m.color === 'rainbow' ? '#a855f7' : m.color }}>{m.name}</div>}
                        <div className="break-words text-sm font-bold text-slate-900 leading-snug">{m.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 p-2 border-t-[3px] border-slate-800 shrink-0 bg-white">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
                    placeholder="輸入訊息…"
                    maxLength={200}
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-slate-800 text-sm font-bold outline-none focus:border-emerald-500"
                  />
                  <button onClick={sendChat} className="plat-btn-hard plat-btn-hard-2 px-4 py-2 bg-[#4ade80] border-2 border-slate-800 rounded-xl font-black text-slate-900 shadow-[2px_2px_0px_rgba(30,41,59,1)] shrink-0">送出</button>
                </div>
                </React.Fragment>
                )}
              </div>
            </div>
          )}

          {tutorialOverlay}
        </div>
      );
    }
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<HashiGame />);
  