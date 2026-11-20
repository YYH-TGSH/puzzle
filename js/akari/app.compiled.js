"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// 美術燈 Akari（平台第四款）：React 單一 app。P1 範圍＝引擎＋單機＋每日；多人（大亂鬥/道具/錦標賽/回座）為 P2。
// 框架比照既有三款：PlatSave/PlatAudio/PlatTap/PlatBar/PlatCalendar/PlatGenerating 全走殼接點；
// 輸入管線比照地雷 v1.54.2＋v1.66.1：pointerup 在按下格結算（22px 漂移內）、尾隨 click 全域抑制窗（不帶 tag）。
var _React = React,
  useState = _React.useState,
  useEffect = _React.useEffect,
  useRef = _React.useRef;

// ---------- 小工具 ----------
function sGet(k) {
  try {
    return window.localStorage.getItem(k);
  } catch (e) {
    return null;
  }
}
function sSet(k, v) {
  try {
    window.localStorage.setItem(k, v);
  } catch (e) {}
}
// PlatSave facade（同地雷形：平台模式委派 window.PlatSave、獨立開啟用同語意本地後備）
var __psFacade = null;
function platSave() {
  if (__psFacade) return __psFacade;
  var regs = [];
  function findV(key) {
    var best = null;
    for (var i = 0; i < regs.length; i++) {
      if (key.indexOf(regs[i].p) === 0 && (!best || regs[i].p.length > best.p.length)) best = regs[i];
    }
    return best ? best.fn : null;
  }
  function g(k) {
    try {
      return window.localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function rm(k) {
    try {
      window.localStorage.removeItem(k);
    } catch (e) {}
  }
  var local = {
    getStr: function getStr(k, fb) {
      var v = g(k);
      return v === null || v === undefined ? fb || '' : v;
    },
    setStr: function setStr(k, v) {
      try {
        window.localStorage.setItem(k, String(v));
      } catch (e) {}
    },
    remove: rm,
    write: function write(k, data) {
      try {
        window.localStorage.setItem(k, JSON.stringify({
          __psv: 1,
          t: Date.now(),
          data: data
        }));
      } catch (e) {}
    },
    read: function read(k, opts) {
      opts = opts || {};
      var fb = 'fallback' in opts ? opts.fallback : null;
      var raw = g(k);
      if (raw === null || raw === undefined) return fb;
      var parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        rm(k);
        return fb;
      }
      var data = parsed;
      if (parsed && _typeof(parsed) === 'object' && parsed.__psv === 1 && 'data' in parsed) data = parsed.data;
      var fn = opts.validate;
      if (fn) {
        var ok = false;
        try {
          ok = !!fn(data, k);
        } catch (e) {
          ok = false;
        }
        if (!ok) {
          rm(k);
          return fb;
        }
      }
      return data;
    }
  };
  function impl() {
    return window.PlatSave || local;
  }
  __psFacade = {
    register: function register(p, fn) {
      regs.push({
        p: p,
        fn: fn
      });
      if (window.PlatSave) window.PlatSave.register(p, fn);
    },
    getStr: function getStr(k, fb) {
      return impl().getStr(k, fb);
    },
    setStr: function setStr(k, v) {
      impl().setStr(k, v);
    },
    remove: function remove(k) {
      impl().remove(k);
    },
    write: function write(k, data) {
      impl().write(k, data);
    },
    read: function read(k, opts) {
      opts = opts || {};
      var fn = opts.validate || findV(k);
      var o = {
        fallback: 'fallback' in opts ? opts.fallback : null
      };
      if (fn) o.validate = fn;
      return impl().read(k, o);
    }
  };
  return __psFacade;
}
platSave().register('akari_daily_records', function (p) {
  return !!p && _typeof(p) === 'object' && !Array.isArray(p);
});
platSave().register('akari_daily_streak', function (p) {
  return !!p && _typeof(p) === 'object' && typeof p.count === 'number';
});
// PlatAudio：平台模式用殼的 window.PlatAudio；獨立開啟退化為靜音 no-op（配方由殼統一持有、不另抄一份避免漂移）
function platAudio() {
  if (typeof window !== 'undefined' && window.PlatAudio) return window.PlatAudio;
  return {
    play: function play() {},
    isMuted: function isMuted() {
      return false;
    },
    toggleMuted: function toggleMuted() {
      return false;
    },
    setMuted: function setMuted() {}
  };
}
function platTapNew(opts) {
  if (typeof window !== 'undefined' && window.PlatTap) return window.PlatTap(opts);
  // 後備（獨立開啟）：最小語意——tap 判定＋suppress 窗
  var downPt = null,
    supT = 0;
  return {
    down: function down(x, y, t) {
      downPt = {
        x: x,
        y: y,
        t: t
      };
    },
    move: function move() {
      return {
        dragging: false
      };
    },
    up: function up(x, y) {
      var d = downPt ? Math.hypot(x - downPt.x, y - downPt.y) : 0;
      downPt = null;
      return {
        type: d <= (opts && opts.slop || 22) ? 'tap' : 'cancel'
      };
    },
    poll: function poll() {
      return 'none';
    },
    active: function active() {
      return !!downPt;
    },
    cancel: function cancel() {
      downPt = null;
    },
    markSuppress: function markSuppress(t) {
      supT = t;
    },
    shouldSuppressClick: function shouldSuppressClick(t) {
      return t - supT <= (opts && opts.suppressMs || 500);
    },
    clearSuppress: function clearSuppress() {
      supT = 0;
    }
  };
}

// ---------- 常數 ----------
var ACCENT = '#f59e0b';
var SIZES = {
  7: {
    id: 7,
    w: 7,
    h: 7,
    wallTarget: 0.20,
    stripRatio: 0.5,
    name: '7×7・小',
    "short": '7×7'
  },
  10: {
    id: 10,
    w: 10,
    h: 10,
    wallTarget: 0.22,
    stripRatio: 0.5,
    name: '10×10・中',
    "short": '10×10'
  },
  12: {
    id: 12,
    w: 12,
    h: 12,
    wallTarget: 0.24,
    stripRatio: 0.5,
    name: '12×12・大',
    "short": '12×12'
  }
};
var SIZE_IDS = [7, 10, 12];
var DAILY_SIZE = 10;
function todayStr() {
  var t = new Date(),
    p = function p(n) {
      return String(n).padStart(2, '0');
    };
  return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
}
function shiftDate(ds, delta) {
  var d = new Date(ds + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  var p = function p(n) {
    return String(n).padStart(2, '0');
  };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function readDailyRecords() {
  return platSave().read('akari_daily_records', {
    fallback: {}
  });
}
function readDailyStreak() {
  return platSave().read('akari_daily_streak', {
    fallback: {
      last: '',
      count: 0
    }
  });
}
function puzzleArrays(p) {
  return {
    w: p.w,
    h: p.h,
    walls: Array.from(p.walls).sort(function (a, b) {
      return a - b;
    }),
    numbers: Array.from(p.numbers.entries()).map(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
        k = _ref2[0],
        v = _ref2[1];
      return [k, v];
    }),
    solution: Array.from(p.solution).sort(function (a, b) {
      return a - b;
    })
  };
}
function arraysToSets(a) {
  return {
    w: a.w,
    h: a.h,
    walls: new Set(a.walls),
    numbers: new Map(a.numbers),
    solution: new Set(a.solution)
  };
}
function AkariGame() {
  var _useState = useState('home'),
    _useState2 = _slicedToArray(_useState, 2),
    screen = _useState2[0],
    setScreen = _useState2[1]; // home | game
  var _useState3 = useState(false),
    _useState4 = _slicedToArray(_useState3, 2),
    showSizeModal = _useState4[0],
    setShowSizeModal = _useState4[1];
  var _useState5 = useState(false),
    _useState6 = _slicedToArray(_useState5, 2),
    showTutorial = _useState6[0],
    setShowTutorial = _useState6[1];
  var _useState7 = useState(function () {
      var v = parseInt(platSave().getStr('akari_last_size', '10'), 10);
      return SIZES[v] ? v : 10;
    }),
    _useState8 = _slicedToArray(_useState7, 2),
    sizeId = _useState8[0],
    setSizeId = _useState8[1];
  var _useState9 = useState(null),
    _useState10 = _slicedToArray(_useState9, 2),
    puzzle = _useState10[0],
    setPuzzle = _useState10[1]; // arrays 形
  var _useState11 = useState([]),
    _useState12 = _slicedToArray(_useState11, 2),
    cells = _useState12[0],
    setCells = _useState12[1]; // 0 空 1 燈 2 叉
  var _useState13 = useState('ready'),
    _useState14 = _slicedToArray(_useState13, 2),
    status = _useState14[0],
    setStatus = _useState14[1]; // ready | playing | won
  var _useState15 = useState(false),
    _useState16 = _slicedToArray(_useState15, 2),
    isDaily = _useState16[0],
    setIsDaily = _useState16[1];
  var _useState17 = useState(null),
    _useState18 = _slicedToArray(_useState17, 2),
    dailyDate = _useState18[0],
    setDailyDate = _useState18[1];
  var _useState19 = useState(todayStr()),
    _useState20 = _slicedToArray(_useState19, 2),
    dailySel = _useState20[0],
    setDailySel = _useState20[1];
  var _useState21 = useState(0),
    _useState22 = _slicedToArray(_useState21, 2),
    elapsed = _useState22[0],
    setElapsed = _useState22[1];
  var _useState23 = useState('tap'),
    _useState24 = _slicedToArray(_useState23, 2),
    mode = _useState24[0],
    setMode = _useState24[1]; // tap | cross（PlatBar 模式）
  var _useState25 = useState(1),
    _useState26 = _slicedToArray(_useState25, 2),
    zoom = _useState26[0],
    setZoom = _useState26[1];
  var _useState27 = useState(false),
    _useState28 = _slicedToArray(_useState27, 2),
    showRules = _useState28[0],
    setShowRules = _useState28[1];
  var _useState29 = useState(null),
    _useState30 = _slicedToArray(_useState29, 2),
    winInfo = _useState30[0],
    setWinInfo = _useState30[1]; // {secs, isDaily, dateStr}
  var _useState31 = useState(function () {
      try {
        return platAudio().isMuted();
      } catch (e) {
        return false;
      }
    }),
    _useState32 = _slicedToArray(_useState31, 2),
    muted = _useState32[0],
    setMuted = _useState32[1];
  var _useState33 = useState(function () {
      return readDailyStreak();
    }),
    _useState34 = _slicedToArray(_useState33, 2),
    streakInfo = _useState34[0],
    setStreakInfo = _useState34[1];
  var screenRef = useRef(screen);
  screenRef.current = screen;
  var sizeIdRef = useRef(sizeId);
  sizeIdRef.current = sizeId;
  var puzzleRef = useRef(null);
  var cellsRef = useRef(cells);
  cellsRef.current = cells;
  var statusRef = useRef(status);
  statusRef.current = status;
  var modeRef = useRef(mode);
  modeRef.current = mode;
  var startedAtRef = useRef(null);
  var isDailyRef = useRef(false);
  isDailyRef.current = isDaily;
  var dailyDateRef = useRef(null);
  dailyDateRef.current = dailyDate;
  var zoomRef = useRef(1);
  zoomRef.current = zoom;
  var genTokenRef = useRef(0);
  var preGenRef = useRef(null); // {sizeId, job, puzzle}
  var preGenStatsRef = useRef({
    jobs: 0,
    hits: 0
  });
  var supTrkRef = useRef(null);
  var supTrk = function supTrk() {
    if (!supTrkRef.current) supTrkRef.current = platTapNew({
      suppressMs: 500
    });
    return supTrkRef.current;
  };
  var downRef = useRef(null); // {idx, trk, painting:bool}
  var platBarRef = useRef(null);
  var newBulbRef = useRef(-1);
  var P = puzzle ? arraysToSets(puzzle) : null;

  // ---------- 計時 ----------
  useEffect(function () {
    if (status !== 'playing') return;
    var iv = setInterval(function () {
      if (startedAtRef.current) setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 500);
    return function () {
      return clearInterval(iv);
    };
  }, [status]);

  // ---------- 產生（job 分片＋PlatGenerating） ----------
  function runJob(job, key, onDone, onAbort) {
    var token = ++genTokenRef.current;
    var shown = false;
    if (window.PlatGenerating) {
      window.PlatGenerating.begin(key, function () {
        if (genTokenRef.current === token) {
          genTokenRef.current++;
          if (onAbort) onAbort();
        }
      });
      shown = true;
    }
    var slice = function slice() {
      if (genTokenRef.current !== token) {
        if (shown) window.PlatGenerating.end();
        return;
      }
      var t0 = Date.now();
      var done = false;
      while (Date.now() - t0 < 40) {
        if (job.step()) {
          done = true;
          break;
        }
      }
      if (done) {
        if (shown) window.PlatGenerating.end();
        if (job.result) onDone(job.result);else if (onAbort) onAbort();
        return;
      }
      setTimeout(slice, 0);
    };
    setTimeout(slice, 0);
  }
  function applyPuzzle(p, daily, dateStr) {
    var arr = puzzleArrays(p);
    puzzleRef.current = arraysToSets(arr);
    setPuzzle(arr);
    setCells(new Array(p.w * p.h).fill(0));
    setIsDaily(!!daily);
    setDailyDate(dateStr || null);
    setStatus('ready');
    setElapsed(0);
    startedAtRef.current = null;
    setWinInfo(null);
    setShowRules(false);
    setZoom(1);
    setScreen('game');
  }
  function startSolo(szId) {
    var spec = SIZES[szId] || SIZES[10];
    setShowSizeModal(false);
    var slot = preGenRef.current;
    if (slot && slot.sizeId === spec.id && slot.puzzle) {
      preGenRef.current = null;
      preGenStatsRef.current.hits++;
      applyPuzzle(slot.puzzle, false, null);
      return;
    }
    if (slot && slot.sizeId === spec.id && slot.job) {
      // 認領在飛的預生成 job 續跑
      preGenRef.current = null;
      preGenStatsRef.current.hits++;
      runJob(slot.job, 'akari-gen', function (p) {
        return applyPuzzle(p, false, null);
      }, function () {
        return setScreen('home');
      });
      return;
    }
    if (slot) preGenRef.current = null;
    var seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    var job = window.Akari.createGenerateJob(spec.w, spec.h, {
      wallTarget: spec.wallTarget,
      stripRatio: spec.stripRatio
    }, seed, 40);
    runJob(job, 'akari-gen', function (p) {
      return applyPuzzle(p, false, null);
    }, function () {
      return setScreen('home');
    });
  }
  function startDaily(ds) {
    var spec = SIZES[DAILY_SIZE];
    var seed = window.Akari.hashSeed('akari-daily-' + ds);
    var job = window.Akari.createGenerateJob(spec.w, spec.h, {
      wallTarget: spec.wallTarget,
      stripRatio: spec.stripRatio
    }, seed, 40);
    runJob(job, 'akari-daily', function (p) {
      return applyPuzzle(p, true, ds);
    }, function () {
      return setScreen('home');
    });
  }
  // 閒置預生成：主畫面停留 ≥1.5s 為「上次選的尺寸」預生一題（記憶體一格、命中即用、換尺寸作廢；對局中不跑）
  useEffect(function () {
    if (screen !== 'home') return;
    var t = setTimeout(function () {
      if (screenRef.current !== 'home') return;
      var spec = SIZES[sizeIdRef.current] || SIZES[10];
      var slot = preGenRef.current;
      if (slot && slot.sizeId === spec.id && (slot.puzzle || slot.job)) return;
      var seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
      var job = window.Akari.createGenerateJob(spec.w, spec.h, {
        wallTarget: spec.wallTarget,
        stripRatio: spec.stripRatio
      }, seed, 40);
      preGenRef.current = {
        sizeId: spec.id,
        job: job,
        puzzle: null
      };
      preGenStatsRef.current.jobs++;
      var drive = function drive() {
        var s2 = preGenRef.current;
        if (!s2 || s2.job !== job) return;
        if (screenRef.current !== 'home') {
          setTimeout(drive, 500);
          return;
        } // 對局中暫停（不 step）
        var t0 = Date.now();
        var done = false;
        while (Date.now() - t0 < 40) {
          if (job.step()) {
            done = true;
            break;
          }
        }
        if (done) {
          if (job.result && preGenRef.current && preGenRef.current.job === job) preGenRef.current = {
            sizeId: spec.id,
            job: null,
            puzzle: job.result
          };
          return;
        }
        setTimeout(drive, 0);
      };
      setTimeout(drive, 0);
    }, 1500);
    return function () {
      return clearTimeout(t);
    };
  }, [screen, sizeId]);

  // ---------- 遊玩 ----------
  function placedBulbs(cs) {
    var s = new Set();
    for (var i = 0; i < cs.length; i++) if (cs[i] === 1) s.add(i);
    return s;
  }
  function doWin(secs) {
    try {
      platAudio().play('complete');
    } catch (e) {}
    setTimeout(function () {
      try {
        platAudio().play('win');
      } catch (e) {}
    }, 350);
    if (isDaily && dailyDate) {
      var rec = readDailyRecords();
      if (rec[dailyDate] == null || secs < rec[dailyDate]) {
        rec[dailyDate] = secs;
        platSave().write('akari_daily_records', rec);
      }
      if (dailyDate === todayStr()) {
        var st = readDailyStreak();
        if (st.last !== dailyDate) {
          var next = st.last === shiftDate(dailyDate, -1) ? {
            last: dailyDate,
            count: (st.count || 0) + 1
          } : {
            last: dailyDate,
            count: 1
          };
          platSave().write('akari_daily_streak', next);
          setStreakInfo(next);
        }
      }
    }
    setWinInfo({
      secs: secs,
      isDaily: isDaily,
      dateStr: dailyDate
    });
  }
  function applyCells(next) {
    var pz = puzzleRef.current;
    if (!pz) return;
    setCells(next);
    cellsRef.current = next;
    if (statusRef.current === 'ready') {
      setStatus('playing');
      statusRef.current = 'playing';
      startedAtRef.current = Date.now();
    }
    if (statusRef.current === 'playing') {
      var bulbs = placedBulbs(next);
      if (window.Akari.isSolved(pz.w, pz.h, pz.walls, pz.numbers, bulbs)) {
        setStatus('won');
        statusRef.current = 'won';
        var secs = startedAtRef.current ? Math.floor((Date.now() - startedAtRef.current) / 1000) : 0;
        setElapsed(secs);
        doWin(secs);
      }
    }
  }
  function cycleCell(idx) {
    if (statusRef.current === 'won') return;
    var pz = puzzleRef.current;
    if (!pz || pz.walls.has(idx)) return;
    var next = cellsRef.current.slice();
    var cur = next[idx];
    var nv;
    if (modeRef.current === 'cross') nv = cur === 2 ? 0 : cur === 0 ? 2 : cur;else nv = (cur + 1) % 3;
    if (nv === cur) return;
    next[idx] = nv;
    if (nv === 1) {
      newBulbRef.current = idx;
      var bulbs = placedBulbs(next);
      var conf = window.Akari.conflicts(pz.w, pz.h, pz.walls, pz.numbers, bulbs);
      try {
        platAudio().play(conf.badBulbs.has(idx) ? 'error' : 'place');
      } catch (e) {}
    }
    applyCells(next);
  }
  function paintCross(idx) {
    if (statusRef.current === 'won') return;
    var pz = puzzleRef.current;
    if (!pz || pz.walls.has(idx)) return;
    if (cellsRef.current[idx] !== 0) return;
    var next = cellsRef.current.slice();
    next[idx] = 2;
    applyCells(next);
  }
  // 輸入管線（比照地雷）：down 記格＋tracker；move 超 slop 且起手為空格 → 轉塗叉拖曳（elementFromPoint 命中格）；
  // up 在按下格結算 tap（漂移 ≤22px）；click 為鍵盤/程式備援（先過全域抑制窗）
  function onCellDown(idx, e) {
    var trk = platTapNew({
      slop: 22,
      suppressMs: 500
    });
    if (e && typeof e.clientX === 'number') trk.down(e.clientX, e.clientY, Date.now());
    downRef.current = {
      idx: idx,
      trk: trk,
      painting: false
    };
  }
  function onBoardMove(e) {
    var d = downRef.current;
    if (!d || !e || typeof e.clientX !== 'number') return;
    if (!d.painting) {
      var r = d.trk.move ? d.trk.move(e.clientX, e.clientY) : {
        dragging: false
      };
      var pz = puzzleRef.current;
      if (r.dragging && pz && cellsRef.current[d.idx] === 0 && !pz.walls.has(d.idx)) {
        d.painting = true;
        paintCross(d.idx);
      } else return;
    }
    if (d.painting) {
      var el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && el.dataset && el.dataset.cell != null) paintCross(Number(el.dataset.cell));
    }
  }
  function onCellUp(idx, e) {
    var d = downRef.current;
    downRef.current = null;
    if (!d) return;
    if (d.painting) {
      supTrk().markSuppress(Date.now());
      return;
    }
    var isTap = true;
    if (d.trk && d.trk.active() && e && typeof e.clientX === 'number') {
      var r = d.trk.up(e.clientX, e.clientY, Date.now());
      isTap = r.type === 'tap';
    }
    if (!isTap) return;
    supTrk().markSuppress(Date.now());
    cycleCell(d.idx);
  }
  function onCellClick(idx) {
    if (supTrk().shouldSuppressClick(Date.now(), idx)) {
      supTrk().clearSuppress();
      return;
    }
    cycleCell(idx);
  }

  // ---------- PlatBar（只掛對局畫面；自我修復 attach 比照 v1.55.1） ----------
  var platBarCfgStable = useRef(null);
  if (!platBarCfgStable.current) platBarCfgStable.current = {
    accent: ACCENT,
    onAction: function onAction(name) {
      if (name === 'mode-press') setMode(function (m) {
        return m === 'tap' ? 'cross' : 'tap';
      });else if (name === 'zoom-in') setZoom(function (z) {
        return Math.min(2, Math.round((z + 0.25) * 100) / 100);
      });else if (name === 'zoom-out') setZoom(function (z) {
        return Math.max(1, Math.round((z - 0.25) * 100) / 100);
      });else if (name === 'zoom-cycle') setZoom(function (z) {
        return z >= 2 ? 1 : Math.round((z + 0.25) * 100) / 100;
      });
    }
  };
  useEffect(function () {
    if (typeof window === 'undefined' || typeof window.PlatBar === 'undefined') return;
    var el = platBarRef.current;
    if (el) {
      if (window.PlatBar._el() !== el || !window.PlatBar._elConnected()) window.PlatBar.attach(el, platBarCfgStable.current);
    } else if (window.PlatBar.isAttached() && !window.PlatBar._elConnected()) {
      window.PlatBar.detach(window.PlatBar._el());
    }
  });
  useEffect(function () {
    if (typeof window === 'undefined' || typeof window.PlatBar === 'undefined' || !window.PlatBar.isAttached()) return;
    if (screen !== 'game') return;
    window.PlatBar.update({
      mode: mode === 'cross' ? 1 : 0,
      modes: [{
        icon: '💡',
        label: '點按'
      }, {
        icon: '✖️',
        label: '塗叉'
      }],
      modeTitle: '切換模式（點按循環／塗叉）',
      zoomLabel: zoom > 1 ? Math.round(zoom * 100) + '%' : '🔍',
      zoomGlyph: zoom > 1 ? Math.round(zoom * 100) + '%' : '🔲',
      showInput: false,
      inputMode: 'num',
      showDraw: false
    });
  });

  // ---------- hooks（測試探針＋P2 多人接點預留） ----------
  useEffect(function () {
    window.__PLAT_HOOKS_akari = {
      debug: function debug() {
        return {
          screen: screenRef.current,
          sizeId: sizeIdRef.current,
          status: statusRef.current,
          isDaily: isDailyRef.current,
          dailyDate: dailyDateRef.current,
          puzzle: puzzleRef.current ? {
            w: puzzleRef.current.w,
            h: puzzleRef.current.h,
            walls: Array.from(puzzleRef.current.walls),
            numbers: Array.from(puzzleRef.current.numbers.entries()),
            solution: Array.from(puzzleRef.current.solution)
          } : null,
          cells: cellsRef.current.slice(),
          mode: modeRef.current,
          zoom: zoomRef.current
        };
      },
      notify: function notify() {} // P2 多人接點（本批未接線）
    };
    window.__AKARI_PREGEN_STATS = preGenStatsRef.current;
    window.__AKARI_PREGEN_SLOT = function () {
      var s = preGenRef.current;
      return s ? {
        sizeId: s.sizeId,
        hasPuzzle: !!s.puzzle,
        hasJob: !!s.job
      } : null;
    };
  }, []);

  // ---------- 衍生狀態 ----------
  var litSet = new Set(),
    confBad = new Set(),
    numState = new Map(),
    progress = 0,
    correct = 0,
    litPct = 0;
  if (P && cells.length) {
    var bulbs = placedBulbs(cells);
    litSet = window.Akari.litCells(P.w, P.h, P.walls, bulbs);
    var conf = window.Akari.conflicts(P.w, P.h, P.walls, P.numbers, bulbs);
    confBad = conf.badBulbs;
    numState = conf.numState;
    progress = window.Akari.progressOf(P.solution, bulbs);
    P.solution.forEach(function (b) {
      if (bulbs.has(b)) correct++;
    });
    var nonWall = 0;
    for (var i = 0; i < P.w * P.h; i++) if (!P.walls.has(i)) nonWall++;
    litPct = nonWall ? Math.round(100 * litSet.size / nonWall) : 0;
  }
  var mm = String(Math.floor(elapsed / 60)).padStart(2, '0'),
    ss = String(elapsed % 60).padStart(2, '0');
  var spec = puzzle ? SIZES[puzzle.w] : SIZES[sizeId];
  var openDailyCal = function openDailyCal() {
    if (window.PlatCalendar) window.PlatCalendar.show({
      accent: ACCENT,
      records: readDailyRecords(),
      selected: dailySel,
      onPick: function onPick(ds) {
        setDailySel(ds);
        startDaily(ds);
      }
    });
  };

  // ---------- 畫面 ----------
  if (screen === 'home') {
    return /*#__PURE__*/React.createElement("div", {
      className: "min-h-screen flex flex-col items-center justify-center p-4 py-10"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-full max-w-md"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-center mb-8"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-7xl mb-3"
    }, "\uD83D\uDCA1"), /*#__PURE__*/React.createElement("h1", {
      className: "text-4xl md:text-5xl font-black text-slate-800 tracking-wider mb-2"
    }, "\u7F8E\u8853\u71C8"), /*#__PURE__*/React.createElement("p", {
      className: "text-amber-600 font-bold"
    }, "Akari \u2014 \u9EDE\u4EAE\u6BCF\u4E00\u683C\uFF0C\u4E00\u76DE\u71C8\u90FD\u4E0D\u80FD\u7167\u5230\u53E6\u4E00\u76DE")), /*#__PURE__*/React.createElement("div", {
      className: "space-y-4"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setShowSizeModal(true);
      },
      className: "plat-btn-hard w-full py-4 bg-amber-400 border-4 border-slate-800 rounded-2xl font-black text-2xl text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)]"
    }, "\uD83C\uDFAE \u55AE\u6A5F\u6311\u6230"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return startDaily(todayStr());
      },
      className: "plat-btn-hard w-full py-4 bg-white border-4 border-slate-800 rounded-2xl font-black text-2xl text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)]"
    }, "\u2600\uFE0F \u6BCF\u65E5\u4E00\u984C", streakInfo.count > 0 && streakInfo.last && (streakInfo.last === todayStr() || streakInfo.last === shiftDate(todayStr(), -1)) ? '　🔥 ' + streakInfo.count + ' 天' : ''), /*#__PURE__*/React.createElement("button", {
      onClick: openDailyCal,
      className: "plat-btn-hard w-full py-2.5 bg-amber-50 border-[3px] border-slate-800 rounded-xl font-black text-base text-slate-600 shadow-[3px_3px_0px_rgba(30,41,59,1)]"
    }, "\uD83D\uDCC5 ", todayStr(), "\uFF08\u9EDE\u958B\u6708\u66C6\u56DE\u88DC\uFF09"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setShowTutorial(true);
      },
      className: "plat-btn-hard w-full py-4 bg-white border-4 border-slate-800 rounded-2xl font-black text-2xl text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)]"
    }, "\uD83D\uDCD6 \u73A9\u6CD5\u6559\u5B78"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        if (window.PLAT_show) window.PLAT_show('home');
      },
      className: "plat-btn-hard w-full py-4 bg-[#60a5fa] border-4 border-slate-800 rounded-2xl font-black text-2xl text-white shadow-[4px_4px_0px_rgba(30,41,59,1)]"
    }, "\uD83C\uDFE0 \u56DE\u5927\u5EF3")), /*#__PURE__*/React.createElement("p", {
      className: "text-center text-slate-400 text-xs mt-8"
    }, "\u4E09\u78DA\u76CA\u667A", window.PLAT_VERSION ? ' v' + window.PLAT_VERSION : '', "\u30FB\u7F8E\u8853\u71C8")), showSizeModal && /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
      onClick: function onClick() {
        return setShowSizeModal(false);
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-3xl border-4 border-slate-800 p-6 w-full max-w-sm shadow-[6px_6px_0px_rgba(30,41,59,1)]",
      onClick: function onClick(e) {
        return e.stopPropagation();
      }
    }, /*#__PURE__*/React.createElement("h2", {
      className: "text-2xl font-black text-slate-800 mb-1 text-center"
    }, "\u9078\u76E4\u9762\u5927\u5C0F"), /*#__PURE__*/React.createElement("p", {
      className: "text-center text-slate-500 text-sm font-bold mb-4"
    }, "\u9078\u597D\u5C31\u76F4\u63A5\u958B\u5C40"), /*#__PURE__*/React.createElement("div", {
      className: "space-y-3"
    }, SIZE_IDS.map(function (id) {
      return /*#__PURE__*/React.createElement("button", {
        key: id,
        onClick: function onClick() {
          setSizeId(id);
          platSave().setStr('akari_last_size', String(id));
          startSolo(id);
        },
        className: "plat-btn-hard w-full py-3.5 border-[3px] border-slate-800 rounded-xl font-black text-xl shadow-[3px_3px_0px_rgba(30,41,59,1)]" + (sizeId === id ? " bg-amber-400 text-slate-900" : " bg-white text-slate-800")
      }, SIZES[id].name, sizeId === id ? '（上次選的）' : '');
    })), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setShowSizeModal(false);
      },
      className: "plat-btn-hard w-full mt-4 py-2.5 bg-slate-100 border-[3px] border-slate-800 rounded-xl font-black text-slate-600"
    }, "\u53D6\u6D88"))), showTutorial && /*#__PURE__*/React.createElement(Tutorial, {
      onClose: function onClose() {
        return setShowTutorial(false);
      }
    }));
  }

  // game 畫面
  var cellPxBase = puzzle ? Math.max(24, Math.min(52, Math.floor((Math.min(window.innerWidth || 400, 560) - 24) / puzzle.w))) : 36;
  var cellPx = Math.round(cellPxBase * zoom);
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex flex-col items-center p-2 md:p-4 pb-28"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full",
    style: {
      maxWidth: puzzle ? cellPx * puzzle.w + 24 + 'px' : '560px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border-[3px] border-slate-800 rounded-2xl shadow-[3px_3px_0px_rgba(30,41,59,1)] px-3 py-2 mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      genTokenRef.current++;
      if (window.PlatGenerating) window.PlatGenerating.end();
      setScreen('home');
      setPuzzle(null);
      puzzleRef.current = null;
    },
    className: "plat-btn-hard bg-slate-100 px-2.5 py-1 rounded-lg border-2 border-slate-800 font-black text-sm shadow-[1px_1px_0px_rgba(30,41,59,1)]"
  }, "\u2190 \u4E3B\u9078\u55AE"), /*#__PURE__*/React.createElement("span", {
    className: "bg-white px-1.5 py-0.5 rounded border-2 border-slate-800 font-black text-[10px] md:text-sm shadow-[1px_1px_0px_rgba(30,41,59,1)] whitespace-nowrap shrink-0"
  }, "\u2699\uFE0F ", isDaily ? '每日一題 ' + spec["short"] : spec.name), /*#__PURE__*/React.createElement("span", {
    className: "font-black text-slate-700 text-sm md:text-base tabular-nums"
  }, "\u23F1 ", mm, ":", ss), /*#__PURE__*/React.createElement("span", {
    className: "font-black text-amber-600 text-sm md:text-base"
  }, "\uD83D\uDCA1 ", correct, "/", P ? P.solution.size : 0), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      var m = platAudio().toggleMuted();
      setMuted(!!m);
    },
    className: "plat-btn-hard bg-white w-8 h-8 rounded-lg border-2 border-slate-800 shadow-[1px_1px_0px_rgba(30,41,59,1)]",
    title: "\u975C\u97F3\u5207\u63DB"
  }, muted ? '🔇' : '🔊'), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setShowRules(function (r) {
        return !r;
      });
    },
    className: "plat-btn-hard bg-white px-2.5 py-1 rounded-lg border-2 border-slate-800 font-black text-sm shadow-[1px_1px_0px_rgba(30,41,59,1)] ml-auto"
  }, "\uD83D\uDCD6 \u898F\u5247", showRules ? ' ▴' : ' ▾')), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 h-3.5 bg-slate-100 border-2 border-slate-800 rounded-full overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-amber-400 transition-all duration-300",
    style: {
      width: Math.round(progress * 100) + '%'
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "font-black text-xs text-slate-500 whitespace-nowrap"
  }, "\u9032\u5EA6 ", Math.round(progress * 100), "%\u30FB\u7167\u4EAE ", litPct, "%")), showRules && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 pt-2 border-t-2 border-dashed border-slate-200 text-sm font-bold text-slate-600 leading-relaxed"
  }, "\u2460 \u5728\u7A7A\u683C\u653E\u71C8\uFF0C\u71C8\u6703\u7167\u4EAE\u540C\u884C\u540C\u5217\u3001\u76F4\u5230\u649E\u7246\u3002\u2461 \u6240\u6709\u7A7A\u683C\u90FD\u8981\u88AB\u7167\u4EAE\u3002\u2462 \u4EFB\u4F55\u5169\u76DE\u71C8\u4E0D\u80FD\u4E92\u76F8\u7167\u5230\u3002\u2463 \u6578\u5B57\u7246\u4E0A\u4E0B\u5DE6\u53F3\u7684\u71C8\u6578\u8981\u525B\u597D\u7B49\u65BC\u6578\u5B57\u3002\u9EDE\u6309\u5FAA\u74B0\uFF1A\u71C8 \u2192 \u53C9\uFF08\u8A18\u865F\uFF09\u2192 \u7A7A\u767D\uFF1B\u6309\u4F4F\u62D6\u66F3\u53EF\u9023\u7E8C\u5857\u53C9\u3002")), /*#__PURE__*/React.createElement("div", {
    className: "akari-board-scroll overflow-auto flex justify-center",
    onPointerMove: onBoardMove
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-grid gap-[3px] p-[6px] bg-amber-100 border-[3px] border-slate-800 rounded-2xl",
    style: {
      gridTemplateColumns: 'repeat(' + (puzzle ? puzzle.w : 10) + ', ' + cellPx + 'px)'
    }
  }, puzzle && cells.map(function (cv, i) {
    var isWall = P.walls.has(i);
    if (isWall) {
      var n = P.numbers.has(i) ? P.numbers.get(i) : null;
      var nst = n != null ? numState.get(i) : null;
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        className: "flex items-center justify-center bg-slate-800 rounded-[4px] font-black select-none",
        style: {
          width: cellPx,
          height: cellPx,
          fontSize: Math.round(cellPx * 0.5)
        }
      }, n != null ? /*#__PURE__*/React.createElement("span", {
        style: {
          color: nst === 'ok' ? '#4ade80' : nst === 'over' ? '#f87171' : '#fbbf24'
        }
      }, n) : null);
    }
    var isBulb = cv === 1,
      isCross = cv === 2,
      lit = litSet.has(i),
      bad = confBad.has(i);
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      "data-cell": i,
      onPointerDown: function onPointerDown(e) {
        return onCellDown(i, e);
      },
      onPointerUp: function onPointerUp(e) {
        return onCellUp(i, e);
      },
      onClick: function onClick() {
        return onCellClick(i);
      },
      className: "flex items-center justify-center rounded-[4px] border select-none touch-none" + (bad ? " border-red-500" : " border-amber-200") + (isBulb && newBulbRef.current === i ? " akari-bulb-new" : ""),
      style: {
        width: cellPx,
        height: cellPx,
        fontSize: Math.round(cellPx * 0.52),
        background: isBulb ? '#fbbf24' : lit ? '#fef3c7' : '#ffffff',
        boxShadow: bad ? 'inset 0 0 0 2px #ef4444' : isBulb ? '0 0 10px 2px rgba(245,158,11,0.55)' : 'none'
      }
    }, isBulb ? '💡' : isCross ? /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400 font-black"
    }, "\u2715") : '');
  }))), status === 'won' && winInfo && /*#__PURE__*/React.createElement("div", {
    className: "mt-4 bg-white border-[3px] border-slate-800 rounded-2xl shadow-[3px_3px_0px_rgba(30,41,59,1)] p-4 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-slate-800 mb-1"
  }, "\uD83C\uDF89 \u5168\u76E4\u9EDE\u4EAE\uFF01"), /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-slate-500 mb-3"
  }, winInfo.isDaily ? '每日一題 ' + (winInfo.dateStr || '') + ' ' : '', "\u7528\u6642 ", String(Math.floor(winInfo.secs / 60)).padStart(2, '0'), ":", String(winInfo.secs % 60).padStart(2, '0'), winInfo.isDaily && winInfo.dateStr === todayStr() && streakInfo.count > 0 ? '・🔥 連勝 ' + streakInfo.count + ' 天' : ''), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 justify-center"
  }, !winInfo.isDaily && /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return startSolo(sizeId);
    },
    className: "plat-btn-hard px-5 py-2.5 bg-amber-400 border-[3px] border-slate-800 rounded-xl font-black shadow-[2px_2px_0px_rgba(30,41,59,1)]"
  }, "\uD83D\uDD01 \u518D\u4F86\u4E00\u5C40"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setScreen('home');
      setPuzzle(null);
      puzzleRef.current = null;
    },
    className: "plat-btn-hard px-5 py-2.5 bg-white border-[3px] border-slate-800 rounded-xl font-black shadow-[2px_2px_0px_rgba(30,41,59,1)]"
  }, "\uD83C\uDFE0 \u56DE\u4E3B\u9078\u55AE")))), /*#__PURE__*/React.createElement("div", {
    ref: platBarRef,
    className: "fixed bottom-0 left-0 right-0 z-40"
  }), showTutorial && /*#__PURE__*/React.createElement(Tutorial, {
    onClose: function onClose() {
      return setShowTutorial(false);
    }
  }));
}

// 教學（卡片式動畫、只教三件事）
function Tutorial(props) {
  var cell = 'w-8 h-8 flex items-center justify-center rounded-[4px] border border-amber-200 bg-[#f1f5f9] text-base';
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
    onClick: props.onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border-4 border-slate-800 p-5 w-full max-w-md shadow-[6px_6px_0px_rgba(30,41,59,1)] max-h-[92vh] overflow-auto",
    onClick: function onClick(e) {
      return e.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-slate-800 text-center mb-4"
  }, "\uD83D\uDCA1 \u600E\u9EBC\u73A9\u7F8E\u8853\u71C8"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-50 border-2 border-slate-200 rounded-2xl p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-black text-slate-700 mb-2"
  }, "1\uFE0F\u20E3 \u71C8\u7167\u76F4\u7DDA\uFF0C\u649E\u7246\u5C31\u505C"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-[3px] justify-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: cell + ' akari-teach-cell',
    style: {
      animationDelay: '0.5s'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: cell + ' akari-teach-cell',
    style: {
      animationDelay: '0.35s'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: cell,
    style: {
      background: '#fbbf24'
    }
  }, "\uD83D\uDCA1"), /*#__PURE__*/React.createElement("div", {
    className: cell + ' akari-teach-cell',
    style: {
      animationDelay: '0.35s'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: cell + ' akari-teach-cell',
    style: {
      animationDelay: '0.5s'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 flex items-center justify-center rounded-[4px] bg-slate-800"
  }), /*#__PURE__*/React.createElement("div", {
    className: cell
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-bold text-slate-500 mt-2"
  }, "\u5728\u7A7A\u683C\u653E\u71C8\u6CE1\uFF0C\u6574\u884C\u6574\u5217\u90FD\u6703\u4EAE\u8D77\u4F86\uFF0C\u76F4\u5230\u88AB\u9ED1\u7246\u64CB\u4F4F\u3002\u76EE\u6A19\u662F\u8B93\u6BCF\u4E00\u683C\u90FD\u88AB\u7167\u4EAE\u3002")), /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-50 border-2 border-slate-200 rounded-2xl p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-black text-slate-700 mb-2"
  }, "2\uFE0F\u20E3 \u5169\u76DE\u71C8\u4E0D\u80FD\u4E92\u76F8\u7167\u5230"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-[3px] justify-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: cell + ' akari-teach-clash',
    style: {
      background: '#fbbf24'
    }
  }, "\uD83D\uDCA1"), /*#__PURE__*/React.createElement("div", {
    className: cell,
    style: {
      background: '#fee2e2'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: cell,
    style: {
      background: '#fee2e2'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: cell + ' akari-teach-clash',
    style: {
      background: '#fbbf24'
    }
  }, "\uD83D\uDCA1")), /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-bold text-slate-500 mt-2"
  }, "\u540C\u4E00\u884C\uFF0F\u5217\u3001\u4E2D\u9593\u6C92\u6709\u7246\u9694\u958B\u7684\u5169\u76DE\u71C8\u6703\u4E92\u76F8\u7167\u5230\u2014\u2014\u4E0D\u884C\u3002\u8981\u7528\u7246\u628A\u71C8\u9694\u958B\u3002")), /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-50 border-2 border-slate-200 rounded-2xl p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-black text-slate-700 mb-2"
  }, "3\uFE0F\u20E3 \u6578\u5B57\u7246\uFF1A\u65C1\u908A\u7684\u71C8\u8981\u525B\u525B\u597D"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-[3px] justify-center items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: cell,
    style: {
      background: '#fef3c7'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: cell,
    style: {
      background: '#fbbf24'
    }
  }, "\uD83D\uDCA1"), /*#__PURE__*/React.createElement("div", {
    className: cell,
    style: {
      background: '#fef3c7'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-[3px] justify-center items-center mt-[3px]"
  }, /*#__PURE__*/React.createElement("div", {
    className: cell,
    style: {
      background: '#fbbf24'
    }
  }, "\uD83D\uDCA1"), /*#__PURE__*/React.createElement("div", {
    className: cell + ' akari-teach-ok font-black',
    style: {
      background: '#1e293b',
      color: '#fbbf24'
    }
  }, "2"), /*#__PURE__*/React.createElement("div", {
    className: cell
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-bold text-slate-500 mt-2"
  }, "\u7246\u4E0A\u7684\u6578\u5B57\u662F\u5B83\u4E0A\u4E0B\u5DE6\u53F3\u7DCA\u9130\u7684\u71C8\u6578\u3002\u525B\u597D\u7B49\u65BC\u6642\u6578\u5B57\u6703\u8B8A\u7DA0\u3002\u9EDE\u6309\u683C\u5B50\u5FAA\u74B0\uFF1A\u71C8 \u2192 \u53C9\uFF08\u5148\u505A\u8A18\u865F\uFF09\u2192 \u7A7A\u767D\u3002"))), /*#__PURE__*/React.createElement("button", {
    onClick: props.onClose,
    className: "plat-btn-hard w-full mt-4 py-3 bg-amber-400 border-[3px] border-slate-800 rounded-xl font-black text-lg text-slate-900 shadow-[3px_3px_0px_rgba(30,41,59,1)]"
  }, "\u958B\u59CB\u73A9\uFF01")));
}
ReactDOM.createRoot(document.getElementById('akari-root')).render( /*#__PURE__*/React.createElement(window.PlatBoundary, null, React.createElement(AkariGame, null)));