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
// PlatPct：進度 % 滾字（v1.53.0 物理感規格）——殼層 PlatCount 的 React 包裝；獨立版（無 PlatCount）退回純文字（比照數獨/數橋/地雷同款元件，v1.72.0 追補接入）
function PlatPct(props) {
  var ref = useRef(null);
  var hRef = useRef(null);
  var v = Math.max(0, Math.min(100, Math.round(props.value) || 0));
  useEffect(function () {
    if (window.PlatCount && ref.current) {
      if (!hRef.current) hRef.current = window.PlatCount.mount(ref.current, {
        value: v,
        suffix: '%'
      });else window.PlatCount.set(hRef.current, v);
    }
  }, [v]);
  if (!window.PlatCount) return /*#__PURE__*/React.createElement("span", null, v, "%");
  return /*#__PURE__*/React.createElement("span", {
    ref: ref
  });
}

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
platSave().register('akari_resume', function (p) {
  return !!p && _typeof(p) === 'object' && typeof p.cells === 'string' && typeof p.ts === 'number' && Date.now() - p.ts <= 3 * 3600 * 1000;
});

// ---------- 多人（比照地雷競速架構：殼 Peer 連線 shim＋遊戲層 uid） ----------
var MP_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#06b6d4', '#f97316'];
function akariUid() {
  var u = sGet('plat_uid_akari');
  if (!u) {
    u = 'a' + Math.random().toString(36).slice(2, 10);
    sSet('plat_uid_akari', u);
  }
  return u;
}
function normName(n) {
  return String(n || '').replace(/\s+/g, ' ').trim().toLowerCase();
}
function fmtMS(ms) {
  var s = Math.max(0, Math.floor(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
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
var ACCENT = '#3b82f6'; // 主題色（2026-11-21 使用者裁示改藍：原琥珀與數獨黃太近）
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
  var _useState3 = useState(function () {
      var v = parseInt(platSave().getStr('akari_last_size', '10'), 10);
      return SIZES[v] ? v : 10;
    }),
    _useState4 = _slicedToArray(_useState3, 2),
    sizeId = _useState4[0],
    setSizeId = _useState4[1];
  var _useState5 = useState(null),
    _useState6 = _slicedToArray(_useState5, 2),
    puzzle = _useState6[0],
    setPuzzle = _useState6[1]; // arrays 形
  var _useState7 = useState([]),
    _useState8 = _slicedToArray(_useState7, 2),
    cells = _useState8[0],
    setCells = _useState8[1]; // 0 空 1 燈 2 叉
  var _useState9 = useState('ready'),
    _useState10 = _slicedToArray(_useState9, 2),
    status = _useState10[0],
    setStatus = _useState10[1]; // ready | playing | won
  var _useState11 = useState(false),
    _useState12 = _slicedToArray(_useState11, 2),
    isDaily = _useState12[0],
    setIsDaily = _useState12[1];
  var _useState13 = useState(null),
    _useState14 = _slicedToArray(_useState13, 2),
    dailyDate = _useState14[0],
    setDailyDate = _useState14[1];
  var _useState15 = useState(todayStr()),
    _useState16 = _slicedToArray(_useState15, 2),
    dailySel = _useState16[0],
    setDailySel = _useState16[1];
  var _useState17 = useState(0),
    _useState18 = _slicedToArray(_useState17, 2),
    elapsed = _useState18[0],
    setElapsed = _useState18[1];
  var _useState19 = useState('tap'),
    _useState20 = _slicedToArray(_useState19, 2),
    mode = _useState20[0],
    setMode = _useState20[1]; // tap | cross（PlatBar 模式）
  var _useState21 = useState(1),
    _useState22 = _slicedToArray(_useState21, 2),
    zoom = _useState22[0],
    setZoom = _useState22[1];
  var _useState23 = useState(null),
    _useState24 = _slicedToArray(_useState23, 2),
    winInfo = _useState24[0],
    setWinInfo = _useState24[1]; // {secs, isDaily, dateStr}
  var _useState25 = useState(function () {
      try {
        return platAudio().isMuted();
      } catch (e) {
        return false;
      }
    }),
    _useState26 = _slicedToArray(_useState25, 2),
    muted = _useState26[0],
    setMuted = _useState26[1];
  var _useState27 = useState(function () {
      return readDailyStreak();
    }),
    _useState28 = _slicedToArray(_useState27, 2),
    streakInfo = _useState28[0],
    setStreakInfo = _useState28[1];
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
  var dailySelRef = useRef(dailySel);
  dailySelRef.current = dailySel;
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
  var platHomeRef = useRef(null); // PlatHome 掛載點（框架層 F1）
  var platFrameRef = useRef(null); // PlatFrame 掛載點（框架修正批 v1.70.0：對局外框改殼持有）
  var _useState29 = useState(null),
    _useState30 = _slicedToArray(_useState29, 2),
    frameBody = _useState30[0],
    setFrameBody = _useState30[1]; // PlatFrame 內容區節點（盤面 portal 用）
  var _useState31 = useState(null),
    _useState32 = _slicedToArray(_useState31, 2),
    ptcEl = _useState32[0],
    setPtcEl = _useState32[1]; // PlatTopCard 掛載點＝外框頂區節點
  var _useState33 = useState(null),
    _useState34 = _slicedToArray(_useState33, 2),
    ptcSlot = _useState34[0],
    setPtcSlot = _useState34[1]; // PlatTopCard 遊戲槽節點（portal 用）
  var newBulbRef = useRef(-1);
  // ---------- 多人狀態 ----------
  var myId = akariUid();
  var _useState35 = useState(false),
    _useState36 = _slicedToArray(_useState35, 2),
    mpOn = _useState36[0],
    setMpOn = _useState36[1];
  var _useState37 = useState('waiting'),
    _useState38 = _slicedToArray(_useState37, 2),
    mpPhase = _useState38[0],
    setMpPhase = _useState38[1]; // waiting | countdown | playing | done
  var _useState39 = useState([]),
    _useState40 = _slicedToArray(_useState39, 2),
    players = _useState40[0],
    setPlayers = _useState40[1];
  var _useState41 = useState({}),
    _useState42 = _slicedToArray(_useState41, 2),
    godBoards = _useState42[0],
    setGodBoards = _useState42[1];
  var _useState43 = useState(null),
    _useState44 = _slicedToArray(_useState43, 2),
    raceFinal = _useState44[0],
    setRaceFinal = _useState44[1];
  var _useState45 = useState(null),
    _useState46 = _slicedToArray(_useState45, 2),
    myOutcome = _useState46[0],
    setMyOutcome = _useState46[1]; // 'finished'
  var _useState47 = useState(null),
    _useState48 = _slicedToArray(_useState47, 2),
    cdNum = _useState48[0],
    setCdNum = _useState48[1];
  var _useState49 = useState(null),
    _useState50 = _slicedToArray(_useState49, 2),
    itemToast = _useState50[0],
    setItemToast = _useState50[1];
  var _useState51 = useState({
      trap: 0
    }),
    _useState52 = _slicedToArray(_useState51, 2),
    myItems = _useState52[0],
    setMyItems = _useState52[1];
  var _useState53 = useState(0),
    _useState54 = _slicedToArray(_useState53, 2),
    outageUntil = _useState54[0],
    setOutageUntil = _useState54[1];
  var _useState55 = useState(null),
    _useState56 = _slicedToArray(_useState55, 2),
    specUid = _useState56[0],
    setSpecUid = _useState56[1];
  var _useState57 = useState(false),
    _useState58 = _slicedToArray(_useState57, 2),
    myReadySt = _useState58[0],
    setMyReadySt = _useState58[1];
  var _useState59 = useState(false),
    _useState60 = _slicedToArray(_useState59, 2),
    leaveArm = _useState60[0],
    setLeaveArm = _useState60[1];
  var _useState61 = useState(0),
    _useState62 = _slicedToArray(_useState61, 2),
    waitTick = _useState62[0],
    setWaitTick = _useState62[1];
  var mpRef = useRef({
    on: false,
    isHost: false,
    mode: 'race',
    tourn: null,
    tournInfo: null,
    hub: false,
    code: '',
    sizeId: 10,
    seed: 0,
    startAt: 0,
    phase: 'waiting',
    itemsAllow: true,
    itemDelay: 60
  });
  var playersRef = useRef([]);
  playersRef.current = players;
  var godRef = useRef({});
  var finalRef = useRef(null);
  var outcomeRef = useRef(null);
  var sessRef = useRef(null);
  var hubColorRef = useRef(null);
  var peerRef = useRef(null),
    connsRef = useRef([]),
    hostConnRef = useRef(null);
  var itemsRef = useRef({
    trap: 0
  });
  var giftCreditRef = useRef(0);
  var milestoneRef = useRef(0);
  var countedWallsRef = useRef({});
  var lastProgRef = useRef(-1);
  var lastStateRef = useRef(0);
  var dismissRef = useRef(null);
  var cdIvRef = useRef(null);
  var autoIvRef = useRef(null);
  var autoFireIvRef = useRef(null);
  var lastOneDoneRef = useRef(false);
  var iAmSpecRef = useRef(false);
  var myReadyRef = useRef(false);
  var waitSinceRef = useRef(0);
  var itemToastTimerRef = useRef(null);
  var outageRef = useRef(0);
  function setPlayersBoth(list) {
    playersRef.current = list;
    setPlayers(list);
  }
  function godSet(uid, patch) {
    var g = Object.assign({}, godRef.current);
    g[uid] = Object.assign({}, g[uid] || {
      progress: 0,
      state: 'playing'
    }, patch);
    godRef.current = g;
    setGodBoards(g);
  }
  function itemSay(msg) {
    setItemToast(msg);
    if (itemToastTimerRef.current) clearTimeout(itemToastTimerRef.current);
    itemToastTimerRef.current = setTimeout(function () {
      return setItemToast(null);
    }, 4200);
  }
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
    setZoom(1);
    setScreen('game');
  }
  function startSolo(szId) {
    var spec = SIZES[szId] || SIZES[10];
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
    for (var i = 0; i < cs.length; i++) if (cs[i] === 1 || cs[i] === 3) s.add(i);
    return s;
  } // 3＝禮物鎖定燈（計入放燈）
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
    if (mpRef.current.on) {
      mpAfterCells(next);
      return;
    } // 多人：同步/里程碑/禮物/完賽走 MP 路徑
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
    if (mpRef.current.on && (mpRef.current.phase !== 'playing' || iAmSpecRef.current || outcomeRef.current)) return;
    var pz = puzzleRef.current;
    if (!pz || pz.walls.has(idx)) return;
    if (cellsRef.current[idx] === 3) return; // 鎖定燈不可點掉
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
    if (mpRef.current.on && (mpRef.current.phase !== 'playing' || iAmSpecRef.current || outcomeRef.current)) return;
    var pz = puzzleRef.current;
    if (!pz || pz.walls.has(idx)) return;
    if (cellsRef.current[idx] !== 0) return; // 燈/叉/鎖定燈都不覆寫
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

  // ---------- 多人競速（比照地雷：房主權威名單/里程碑仲裁、來賓中繼） ----------
  function platTimeOffset() {
    try {
      return window.__PLAT_NET && window.__PLAT_NET.timeOffset || 0;
    } catch (e) {
      return 0;
    }
  }
  function myPlayer() {
    return playersRef.current.find(function (p) {
      return p.id === myId;
    }) || null;
  }
  function iAmSpec() {
    var mp = myPlayer();
    return !!mp && !!mp.spectator;
  }
  function itemsLive() {
    return mpRef.current.on && mpRef.current.itemsAllow;
  }
  function progOf(uid) {
    var g = godRef.current[uid];
    return g ? g.progress || 0 : 0;
  }
  function unfinishedRacers() {
    return playersRef.current.filter(function (p) {
      if (p.spectator || p.pending) return false;
      if (p.id === myId) return !outcomeRef.current;
      var g = godRef.current[p.id];
      return !g || g.state === 'playing';
    });
  }
  function amLastOne() {
    var u = unfinishedRacers();
    return u.length === 1 && u[0].id === myId && playersRef.current.filter(function (p) {
      return !p.spectator && !p.pending;
    }).length > 1;
  }
  function pickWeighted(list, wfn) {
    var tot = 0;
    var ws = list.map(function (p) {
      var w = Math.max(0.0001, wfn(p));
      tot += w;
      return w;
    });
    var r = Math.random() * tot;
    for (var i = 0; i < list.length; i++) {
      r -= ws[i];
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }
  function hostBroadcast(msg, exceptConn) {
    connsRef.current.forEach(function (c) {
      if (c !== exceptConn && c.open) {
        try {
          c.send(msg);
        } catch (e) {}
      }
    });
  }
  function mpSend(msg) {
    if (mpRef.current.isHost) hostBroadcast(msg);else if (hostConnRef.current && hostConnRef.current.open) {
      try {
        hostConnRef.current.send(msg);
      } catch (e) {}
    }
  }
  function sendItemMsg(m) {
    if (mpRef.current.isHost) {
      hostBroadcast(m);
      processItemMsg(m);
    } else mpSend(m);
  }
  function cleanupMp() {
    if (cdIvRef.current) {
      clearInterval(cdIvRef.current);
      cdIvRef.current = null;
    }
    if (autoIvRef.current) {
      clearInterval(autoIvRef.current);
      autoIvRef.current = null;
    }
    if (autoFireIvRef.current) {
      clearInterval(autoFireIvRef.current);
      autoFireIvRef.current = null;
    }
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {}
      peerRef.current = null;
    }
    connsRef.current = [];
    hostConnRef.current = null;
    mpRef.current.on = false;
    mpRef.current.phase = 'waiting';
    setMpOn(false);
    setMpPhase('waiting');
    setPlayersBoth([]);
    godRef.current = {};
    setGodBoards({});
    setRaceFinal(null);
    finalRef.current = null;
    setMyOutcome(null);
    outcomeRef.current = null;
    setCdNum(null);
    iAmSpecRef.current = false;
    itemsRef.current = {
      trap: 0
    };
    setMyItems({
      trap: 0
    });
    giftCreditRef.current = 0;
    milestoneRef.current = 0;
    countedWallsRef.current = {};
    lastOneDoneRef.current = false;
    setOutageUntil(0);
    outageRef.current = 0;
    dismissRef.current = null;
    setSpecUid(null);
  }
  // 數字牆「正確滿足」：相鄰燈數＝數字，且相鄰燈全是解答燈（規格第 5 節禮物額度來源）
  function correctWallsNow(cs) {
    var pz = puzzleRef.current;
    if (!pz) return [];
    var bulbs = placedBulbs(cs),
      out = [];
    pz.numbers.forEach(function (num, wi) {
      var x = wi % pz.w,
        y = Math.floor(wi / pz.w);
      var nb = [];
      if (x > 0) nb.push(wi - 1);
      if (x < pz.w - 1) nb.push(wi + 1);
      if (y > 0) nb.push(wi - pz.w);
      if (y < pz.h - 1) nb.push(wi + pz.w);
      var cnt = 0,
        allSol = true;
      nb.forEach(function (j) {
        if (bulbs.has(j)) {
          cnt++;
          if (!pz.solution.has(j)) allSol = false;
        }
      });
      if (cnt === num && allSol) out.push(wi);
    });
    return out;
  }
  function akariResumeKey() {
    return 'akari_resume_' + (mpRef.current.code || '') + '_' + myId;
  }
  function saveResume() {
    if (!mpRef.current.on || iAmSpecRef.current || outcomeRef.current || mpRef.current.phase !== 'playing') return;
    if (!puzzleRef.current || !mpRef.current.seed) return;
    platSave().write(akariResumeKey(), {
      seed: mpRef.current.seed,
      sizeId: mpRef.current.sizeId,
      startAt: mpRef.current.startAt,
      cells: cellsRef.current.join(''),
      items: {
        trap: itemsRef.current.trap || 0
      },
      giftCredit: giftCreditRef.current,
      milestone: milestoneRef.current,
      countedWalls: Object.keys(countedWallsRef.current).map(Number),
      ts: Date.now()
    });
  }
  function loadResumeAny() {
    try {
      return platSave().read(akariResumeKey(), {
        fallback: null,
        validate: function validate(p) {
          return !!p && typeof p.seed === 'number' && typeof p.cells === 'string';
        }
      });
    } catch (e) {
      return null;
    }
  }
  // ----- 競速同步：進度小訊息＋god 快照節流＋里程碑逐格補報＋禮物額度 -----
  function raceSync(next) {
    var pz = puzzleRef.current;
    if (!pz) return;
    var bulbs = placedBulbs(next);
    var prog = window.Akari.progressOf(pz.solution, bulbs);
    godSet(myId, {
      progress: prog
    });
    var pi = Math.floor(prog * 100);
    if (pi !== lastProgRef.current) {
      lastProgRef.current = pi;
      mpSend({
        type: 'AKARI_PROGRESS',
        uid: myId,
        progress: prog
      });
    }
    // 里程碑只認「自己放的」正確燈（不含禮物鎖定燈）：一盞燈≈10% 進度（7×7），禮物燈若也鑄里程碑會自我連鎖（禮物→里程碑→禮物…數秒完賽雙邊，實測抓到）；官方進度/完賽仍計全部正確燈
    var selfCorrect = 0;
    for (var si = 0; si < next.length; si++) if (next[si] === 1 && pz.solution.has(si)) selfCorrect++;
    var selfProg = pz.solution.size ? selfCorrect / pz.solution.size : 0;
    var band = Math.floor(selfProg * 20); // 每 5% 一格
    while (milestoneRef.current < band) {
      milestoneRef.current++;
      if (mpRef.current.isHost) hostHandleMilestone(myId);else mpSend({
        type: 'AKARI_MILESTONE',
        uid: myId
      });
    }
    if (itemsLive()) {
      var gained = false;
      correctWallsNow(next).forEach(function (wi) {
        if (!countedWallsRef.current[wi]) {
          countedWallsRef.current[wi] = 1;
          giftCreditRef.current += 0.5;
          gained = true;
        }
      });
      if (gained) trySendGift();
    }
    var now = Date.now();
    if (now - lastStateRef.current > 800) {
      lastStateRef.current = now;
      var cs = next.join('');
      godSet(myId, {
        cells: cs
      });
      mpSend({
        type: 'AKARI_STATE',
        uid: myId,
        cells: cs,
        progress: prog
      });
    }
    saveResume();
  }
  function mpAfterCells(next) {
    if (mpRef.current.phase !== 'playing' || iAmSpecRef.current || outcomeRef.current) return;
    var pz = puzzleRef.current;
    if (!pz) return;
    var bulbs = placedBulbs(next);
    if (window.Akari.isSolved(pz.w, pz.h, pz.walls, pz.numbers, bulbs)) {
      mpFinish(next);
      return;
    }
    raceSync(next);
  }
  function mpFinish(next) {
    outcomeRef.current = 'finished';
    setMyOutcome('finished');
    setStatus('won');
    statusRef.current = 'won';
    var tms = Math.max(0, Date.now() - mpRef.current.startAt);
    setElapsed(Math.floor(tms / 1000));
    try {
      platAudio().play('complete');
    } catch (e) {}
    setTimeout(function () {
      try {
        platAudio().play('win');
      } catch (e) {}
    }, 350);
    var cs = next.join('');
    godSet(myId, {
      state: 'finished',
      timeMs: tms,
      progress: 1,
      cells: cs
    });
    mpSend({
      type: 'AKARI_STATE',
      uid: myId,
      cells: cs,
      progress: 1
    });
    mpSend({
      type: 'AKARI_FINISH',
      uid: myId,
      timeMs: tms
    });
    itemSay('🏁 你完賽了！自動轉觀戰，看大家的盤面');
    checkRaceEnd();
  }
  // ----- 道具（房主仲裁里程碑；禮物即時生效；斷電純視覺） -----
  function hostHandleMilestone(fromUid) {
    if (!mpRef.current.isHost || !itemsLive()) return;
    if (Date.now() - (mpRef.current.startAt || 0) < (mpRef.current.itemDelay || 0) * 1000) return; // 延遲內跨的里程碑不發（比照地雷/數獨）
    var pool = unfinishedRacers();
    if (!pool.length) return;
    if (pool.length === 1) {
      sendItemMsg({
        type: 'AKARI_GIFT',
        uid: myId,
        fromUid: fromUid,
        fromName: '里程碑',
        toUid: pool[0].id
      });
      return;
    } // 只剩一人：里程碑直接發禮物
    // 種類以「里程碑達成者」自己的進度 p 擲骰（定版公式：禮物 (1−p)²+0.1／陷阱 p²+0.1）——落後者多拿禮物線、領先者多拿陷阱（與數獨武器/禮物同語意；若以收禮者 p 擲，收禮者恆為弱者、陷阱永遠擲不出）
    var pe = progOf(fromUid);
    var giftW = Math.pow(1 - pe, 2) + 0.1,
      trapW = Math.pow(pe, 2) + 0.1;
    if (Math.random() < giftW / (giftW + trapW)) {
      var tgt = pickWeighted(pool, function (p) {
        return Math.pow(1 - progOf(p.id), 2) + 0.1;
      }); // 禮物送給較弱者（扶弱加權；可為達成者自己）
      sendItemMsg({
        type: 'AKARI_GIFT',
        uid: myId,
        fromUid: fromUid,
        fromName: '里程碑',
        toUid: tgt.id
      });
    } else {
      sendItemMsg({
        type: 'AKARI_GRANT',
        uid: myId,
        toUid: fromUid,
        item: 'trap'
      }); // 陷阱進達成者的庫存，由他發動
    }
  }
  function processItemMsg(m) {
    if (m.type === 'AKARI_GRANT' && m.toUid === myId) applyItemGrant(m.item);else if (m.type === 'AKARI_GIFT' && m.toUid === myId) {
      applyGiftEffect(m.fromName || '');
      try {
        if (window.PlatFly) window.PlatFly.fly(window.PlatFly.byUid('akari', m.fromUid), window.PlatFly.me('akari'), '🎁');
      } catch (e) {}
    } else if (m.type === 'AKARI_HIT' && m.toUid === myId) applyOutage(m.fromName || '');
    saveResume();
  }
  function applyItemGrant(item) {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current) return;
    if (item === 'gift') {
      applyGiftEffect('里程碑');
      return;
    }
    if (amLastOne()) {
      applyGiftEffect('');
      itemSay('🏁 只剩你一人，里程碑陷阱自動轉成禮物！');
      return;
    }
    var ni = {
      trap: (itemsRef.current.trap || 0) + 1
    };
    itemsRef.current = ni;
    setMyItems(ni);
    try {
      platAudio().play('star');
    } catch (e) {}
    itemSay('🎁 里程碑道具：⚡ 斷電陷阱 ×' + ni.trap + (ni.trap >= 3 ? '（集滿 3 自動發動！）' : ''));
    maybeAutoFire();
  }
  function giftCandidates() {
    var pz = puzzleRef.current;
    if (!pz) return [];
    var out = [];
    pz.solution.forEach(function (i) {
      var c = cellsRef.current[i];
      if (c === 0 || c === 2) out.push(i);
    });
    return out;
  }
  function applyGiftEffect(fromName) {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current || mpRef.current.phase !== 'playing') return;
    var cand = giftCandidates();
    if (!cand.length) {
      itemSay('🎁 禮物落空：正確位置都已經放好燈了');
      return;
    }
    var idx = cand[Math.floor(Math.random() * cand.length)];
    var next = cellsRef.current.slice();
    next[idx] = 3; // 鎖定燈（不可移除）
    try {
      platAudio().play('gift');
    } catch (e) {}
    itemSay(fromName === '里程碑' ? '🎁 里程碑禮物：一盞燈已幫你放好並鎖定！' : '🎁 ' + (fromName ? fromName + ' 送的禮物' : '禮物') + '：一盞燈已幫你放好並鎖定！');
    applyCells(next);
  }
  function trySendGift() {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current || mpRef.current.phase !== 'playing') return;
    if (Date.now() - (mpRef.current.startAt || 0) < (mpRef.current.itemDelay || 0) * 1000) return; // 延遲內先存額度
    var _loop = function _loop() {
        var myP = progOf(myId);
        var weaker = unfinishedRacers().filter(function (p) {
          return p.id !== myId && progOf(p.id) < myP;
        });
        if (!weaker.length) return {
          v: void 0
        }; // 沒有較弱的對象就存著
        var tgt = pickWeighted(weaker, function (p) {
          return Math.sqrt((myP - progOf(p.id)) * 100 + 1);
        });
        giftCreditRef.current -= 1;
        sendItemMsg({
          type: 'AKARI_GIFT',
          uid: myId,
          fromUid: myId,
          fromName: (myPlayer() || {}).name || '',
          toUid: tgt.id
        });
        try {
          if (window.PlatFly) window.PlatFly.fly(window.PlatFly.me('akari'), window.PlatFly.byUid('akari', tgt.id), '🎁');
        } catch (e) {}
        // 送出不提示（比照地雷：避免間接洩漏自己剛滿足了數字牆）
      },
      _ret;
    while (giftCreditRef.current >= 1) {
      _ret = _loop();
      if (_ret) return _ret.v;
    }
  }
  function fireTrap() {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current) return;
    if ((itemsRef.current.trap || 0) <= 0) return;
    var tgts = unfinishedRacers().filter(function (p) {
      return p.id !== myId;
    });
    if (!tgts.length) {
      itemSay('目前沒有可斷電的對手');
      return;
    }
    var tgt = pickWeighted(tgts, function (p) {
      return Math.pow(progOf(p.id), 2) + 0.1;
    }); // 攻擊權重（打強者）定版公式
    var ni = {
      trap: itemsRef.current.trap - 1
    };
    itemsRef.current = ni;
    setMyItems(ni);
    sendItemMsg({
      type: 'AKARI_HIT',
      uid: myId,
      fromUid: myId,
      fromName: (myPlayer() || {}).name || '',
      toUid: tgt.id,
      kind: 'outage'
    });
    itemSay('⚡ 已讓 ' + tgt.name + ' 斷電 5 秒！');
  }
  function maybeAutoFire() {
    if (autoFireIvRef.current) return;
    if ((itemsRef.current.trap || 0) < 3) return;
    try {
      platAudio().play('star');
    } catch (e) {}
    autoFireIvRef.current = setInterval(function () {
      var hasTgt = unfinishedRacers().some(function (p) {
        return p.id !== myId;
      });
      if ((itemsRef.current.trap || 0) <= 0 || !hasTgt || outcomeRef.current || !itemsLive()) {
        clearInterval(autoFireIvRef.current);
        autoFireIvRef.current = null;
        return;
      }
      fireTrap();
    }, 550);
  }
  function tryConvertLastOne() {
    if (lastOneDoneRef.current || !itemsLive()) return;
    if (!amLastOne()) return;
    lastOneDoneRef.current = true;
    var held = itemsRef.current.trap || 0;
    if (held > 0) {
      itemsRef.current = {
        trap: 0
      };
      setMyItems({
        trap: 0
      });
      itemSay('🏁 只剩你一人，未用的斷電陷阱全部轉成禮物！');
      for (var i = 0; i < held; i++) setTimeout(function () {
        return applyGiftEffect('');
      }, 550 * (i + 1));
    }
  }
  function applyOutage(fromName) {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current) return;
    if (amLastOne()) {
      applyGiftEffect('');
      itemSay('🏁 只剩你一人，' + (fromName || '對手') + ' 的斷電自動轉成禮物！');
      return;
    }
    var until = Date.now() + 5000;
    outageRef.current = until;
    setOutageUntil(until);
    try {
      platAudio().play('error');
    } catch (e) {}
    itemSay('⚡ ' + (fromName || '對手') + ' 讓你斷電 5 秒！燈都還在，只是光暈暫時消失');
  }
  function checkRaceEnd() {
    if (finalRef.current || !mpRef.current.on) return;
    var racers = playersRef.current.filter(function (p) {
      return !p.spectator && !p.pending;
    });
    if (!racers.length) return;
    var allDone = racers.every(function (p) {
      if (p.offline) return true;
      var g = godRef.current[p.id];
      return g && g.state === 'finished';
    });
    if (!allDone) return;
    var fins = [],
      rest = [];
    racers.forEach(function (p) {
      var g = godRef.current[p.id] || {
        progress: 0,
        state: 'playing'
      };
      var e = {
        key: p.id,
        name: p.name,
        color: p.color,
        isMe: p.id === myId,
        uid: p.id,
        g: g,
        offline: !!p.offline
      };
      if (g.state === 'finished') fins.push(e);else rest.push(e);
    });
    fins.sort(function (a, b) {
      return (a.g.timeMs || 0) - (b.g.timeMs || 0);
    });
    rest.sort(function (a, b) {
      return (b.g.progress || 0) - (a.g.progress || 0);
    });
    var entries = fins.concat(rest).map(function (e) {
      return {
        key: e.key,
        name: e.name,
        color: e.color,
        isMe: e.isMe,
        right: e.g.state === 'finished' ? '⏱ ' + fmtMS(e.g.timeMs || 0) : '未完成・' + Math.floor((e.g.progress || 0) * 100) + '%'
      };
    });
    var fin = {
      entries: entries,
      winnerUid: fins.length ? fins[0].key : null
    };
    finalRef.current = fin;
    setRaceFinal(fin);
    mpRef.current.phase = 'done';
    setMpPhase('done');
  }

  // ----- 開局／連線（房主種子開局；同 seed 全端同題——引擎確定性） -----
  function derivePuzzle(seed, szId) {
    var spec = SIZES[szId] || SIZES[10];
    var sd = seed >>> 0;
    for (var t = 0; t < 6; t++) {
      var p = window.Akari.generate(spec.w, spec.h, {
        wallTarget: spec.wallTarget,
        stripRatio: spec.stripRatio
      }, sd);
      if (p) return {
        puzzle: p,
        seed: sd
      };
      sd = sd + 1 >>> 0;
    }
    return null;
  }
  function applyMpPuzzle(p, startAt) {
    var arr = puzzleArrays(p);
    puzzleRef.current = arraysToSets(arr);
    setPuzzle(arr);
    setCells(new Array(p.w * p.h).fill(0));
    cellsRef.current = new Array(p.w * p.h).fill(0);
    setIsDaily(false);
    setDailyDate(null);
    setStatus('ready');
    statusRef.current = 'ready';
    startedAtRef.current = startAt;
    setElapsed(0);
    setWinInfo(null);
    setZoom(1);
    setScreen('game');
  }
  function startMatchLocal(seed, szId, startAt) {
    startAt = startAt - platTimeOffset();
    var d = derivePuzzle(seed, szId);
    if (!d) return;
    mpRef.current.seed = d.seed;
    mpRef.current.sizeId = szId;
    mpRef.current.startAt = startAt;
    mpRef.current.phase = 'countdown';
    setRaceFinal(null);
    finalRef.current = null;
    setMyOutcome(null);
    outcomeRef.current = null;
    godRef.current = {};
    setGodBoards({});
    dismissRef.current = null;
    setSpecUid(null);
    itemsRef.current = {
      trap: 0
    };
    setMyItems({
      trap: 0
    });
    giftCreditRef.current = 0;
    milestoneRef.current = 0;
    countedWallsRef.current = {};
    lastOneDoneRef.current = false;
    lastProgRef.current = -1;
    lastStateRef.current = 0;
    setOutageUntil(0);
    outageRef.current = 0;
    setMyReadySt(false);
    myReadyRef.current = false;
    var spec2 = iAmSpec();
    iAmSpecRef.current = spec2;
    if (!spec2) applyMpPuzzle(d.puzzle, startAt);else {
      var arrS = puzzleArrays(d.puzzle);
      puzzleRef.current = arraysToSets(arrS);
      setPuzzle(arrS);
      setCells([]);
      cellsRef.current = [];
      setScreen('game');
    } // 觀戰者留題目給觀戰盤面渲染（自己不下場）
    setMpPhase('countdown');
    if (cdIvRef.current) clearInterval(cdIvRef.current);
    cdIvRef.current = setInterval(function () {
      var rem = startAt - Date.now();
      if (rem <= 0) {
        clearInterval(cdIvRef.current);
        cdIvRef.current = null;
        setCdNum('GO!');
        setTimeout(function () {
          return setCdNum(null);
        }, 650);
        mpRef.current.phase = 'playing';
        setMpPhase('playing');
        if (!iAmSpecRef.current) {
          setStatus('playing');
          statusRef.current = 'playing';
        }
      } else setCdNum(Math.ceil(rem / 1000));
    }, 100);
  }
  function startMatch() {
    if (!mpRef.current.isHost) return;
    if (mpRef.current.phase !== 'waiting' && mpRef.current.phase !== 'done') return;
    if (autoIvRef.current) {
      clearInterval(autoIvRef.current);
      autoIvRef.current = null;
    }
    var seed = Math.random() * 4294967296 >>> 0,
      startAt = Date.now() + 3500;
    var szId = mpRef.current.sizeId;
    if (!derivePuzzle(seed, szId)) return;
    setPlayersBoth(playersRef.current.filter(function (p) {
      return !p.pending;
    }).map(function (p) {
      return Object.assign({}, p, {
        ready: false
      });
    }));
    hostBroadcast({
      type: 'PLAYERS_UPDATE',
      players: playersRef.current
    });
    hostBroadcast({
      type: 'AKARI_START',
      seed: seed,
      sizeId: szId,
      startAt: startAt
    });
    startMatchLocal(seed, szId, startAt);
  }
  function hostOnJoin(m, conn) {
    conn.__uid = m.uid;
    var phase = mpRef.current.phase;
    var lateSpec = phase === 'countdown' || phase === 'playing';
    var list = playersRef.current.slice();
    var ex = list.find(function (p) {
      return p.id === m.uid;
    });
    if (ex) list = list.map(function (p) {
      return p.id === m.uid ? Object.assign({}, p, {
        name: m.pName,
        offline: false
      }) : p;
    });else {
      var pend = list.findIndex(function (p) {
        return p.pending && normName(p.name) === normName(m.pName || '');
      });
      var color = typeof m.color === 'string' && m.color ? m.color : MP_COLORS[list.filter(function (p) {
        return !p.pending;
      }).length % MP_COLORS.length];
      var entry = {
        id: m.uid,
        name: m.pName || '玩家',
        color: pend >= 0 ? list[pend].color : color,
        isHost: false,
        spectator: lateSpec,
        ready: false,
        offline: false
      };
      if (pend >= 0) list[pend] = entry;else list.push(entry);
    }
    setPlayersBoth(list);
    hostBroadcast({
      type: 'PLAYERS_UPDATE',
      players: list
    }, conn);
    var myEntry = list.find(function (p) {
      return p.id === m.uid;
    });
    try {
      conn.send({
        type: 'INIT',
        players: list,
        sizeId: mpRef.current.sizeId,
        phase: phase,
        seed: myEntry && myEntry.spectator ? undefined : mpRef.current.seed,
        startAt: mpRef.current.startAt,
        god: godRef.current,
        youSpec: !!(myEntry && myEntry.spectator),
        puzzle: myEntry && myEntry.spectator && puzzleRef.current ? {
          w: puzzleRef.current.w,
          h: puzzleRef.current.h,
          walls: Array.from(puzzleRef.current.walls),
          numbers: Array.from(puzzleRef.current.numbers.entries()),
          solution: Array.from(puzzleRef.current.solution)
        } : undefined
      });
    } catch (e) {}
  }
  function guestOnInit(m) {
    setPlayersBoth(m.players || []);
    mpRef.current.sizeId = m.sizeId || mpRef.current.sizeId;
    setSizeId(m.sizeId || 10);
    iAmSpecRef.current = !!m.youSpec;
    if (m.god) {
      godRef.current = m.god;
      setGodBoards(m.god);
    }
    if (m.phase === 'countdown' || m.phase === 'playing') {
      mpRef.current.seed = m.seed;
      mpRef.current.startAt = m.startAt;
      if (m.youSpec) {
        if (m.puzzle) {
          puzzleRef.current = arraysToSets(m.puzzle);
          setPuzzle(m.puzzle);
        }
        setCells([]);
        cellsRef.current = [];
        mpRef.current.phase = m.phase;
        setMpPhase(m.phase);
        setScreen('game');
        if (m.phase === 'countdown' && m.startAt) {
          var specDelay = Math.max(0, m.startAt - Date.now()) + 60;
          setTimeout(function () {
            if (mpRef.current.phase === 'countdown' && iAmSpecRef.current) {
              mpRef.current.phase = 'playing';
              setMpPhase('playing');
            }
          }, specDelay);
        }
      } else {
        startMatchLocal(m.seed, m.sizeId, m.startAt);
        resumeRestore(m);
      }
    }
  }
  function resumeRestore(m) {
    var sp = SIZES[m.sizeId] || SIZES[10],
      total = sp.w * sp.h;
    var save = null;
    try {
      save = platSave().read(akariResumeKey(), {
        fallback: null,
        validate: function validate(p) {
          return !!p && p.seed === m.seed && p.sizeId === m.sizeId && !!p.cells && p.cells.length === total;
        }
      });
    } catch (e) {}
    var cellsArr = null;
    if (save) cellsArr = save.cells.split('').map(Number);else if (m.god && m.god[myId] && typeof m.god[myId].cells === 'string' && m.god[myId].cells.length === total) cellsArr = m.god[myId].cells.split('').map(Number);
    if (!cellsArr || cellsArr.some(function (v) {
      return !(v >= 0 && v <= 3);
    })) return;
    if (save) {
      itemsRef.current = {
        trap: save.items && save.items.trap || 0
      };
      setMyItems(itemsRef.current);
      giftCreditRef.current = save.giftCredit || 0;
      milestoneRef.current = save.milestone || 0;
      countedWallsRef.current = {};
      (save.countedWalls || []).forEach(function (wi) {
        countedWallsRef.current[wi] = 1;
      });
    }
    setCells(cellsArr);
    cellsRef.current = cellsArr;
    var myGod = m.god && m.god[myId];
    if (myGod && myGod.state === 'finished') {
      outcomeRef.current = 'finished';
      setMyOutcome('finished');
      setStatus('won');
      statusRef.current = 'won';
      godSet(myId, {
        state: 'finished',
        timeMs: myGod.timeMs,
        progress: 1
      });
      return;
    }
    lastStateRef.current = 0;
    raceSync(cellsArr);
    itemSay('↩ 已接續中斷前的對局進度');
  }
  function onMpData(m, conn) {
    if (!m || !m.type) return;
    var H = mpRef.current.isHost;
    if (H && conn && conn.__uid && m.uid && m.uid !== conn.__uid && ['AKARI_FINISH', 'AKARI_STATE', 'AKARI_PROGRESS', 'AKARI_MILESTONE', 'AKARI_GIFT', 'AKARI_HIT', 'READY', 'REQ_REMATCH'].indexOf(m.type) >= 0) return; // 房主驗寄件者（比照地雷）
    switch (m.type) {
      case 'JOIN':
        if (H) hostOnJoin(m, conn);
        break;
      case 'INIT':
        if (!H) guestOnInit(m);
        break;
      case 'PLAYERS_UPDATE':
        if (!H) {
          setPlayersBoth(m.players || []);
          var mp2 = myPlayer();
          if (mp2) iAmSpecRef.current = !!mp2.spectator;
        }
        break;
      case 'READY':
        if (H) {
          setPlayersBoth(playersRef.current.map(function (p) {
            return p.id === m.uid ? Object.assign({}, p, {
              ready: !!m.ready
            }) : p;
          }));
          hostBroadcast({
            type: 'PLAYERS_UPDATE',
            players: playersRef.current
          });
        }
        break;
      case 'AKARI_START':
        if (!H) startMatchLocal(m.seed, m.sizeId, m.startAt);
        break;
      case 'AKARI_PROGRESS':
        godSet(m.uid, {
          progress: m.progress || 0
        });
        if (H) hostBroadcast(m, conn);
        break;
      case 'AKARI_STATE':
        godSet(m.uid, {
          cells: m.cells,
          progress: m.progress || 0
        });
        if (H) hostBroadcast(m, conn);
        break;
      case 'AKARI_FINISH':
        godSet(m.uid, {
          state: 'finished',
          timeMs: m.timeMs,
          progress: 1
        });
        if (H) hostBroadcast(m, conn);
        checkRaceEnd();
        tryConvertLastOne();
        break;
      case 'AKARI_MILESTONE':
        if (H) hostHandleMilestone(m.uid);
        break;
      case 'AKARI_GRANT':
        if (!H) processItemMsg(m);
        break;
      // 房主發出時已在 sendItemMsg 本地處理；來賓鍛造的 GRANT 房主不受理
      case 'AKARI_GIFT':
        if (H) hostBroadcast(m, conn);
        processItemMsg(m);
        break;
      case 'AKARI_HIT':
        if (H) hostBroadcast(m, conn);
        processItemMsg(m);
        break;
      case 'REQ_LOBBY':
        if (H) {
          if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY('game-exit');
        }
        break;
      case 'REQ_REMATCH':
        if (H) startMatch();
        break;
      case 'HOST_LEFT':
        if (!H) onHostLeft(m);
        break;
    }
  }
  function onHostLeft(m) {
    var racers = playersRef.current.filter(function (p) {
      return !p.isHost && !p.offline && !p.spectator && !p.pending;
    });
    var pool = racers.length ? racers : playersRef.current.filter(function (p) {
      return !p.isHost && !p.offline && !p.pending;
    });
    if (pool.length && pool[0].id === myId) becomeHost(true);
  }
  function onConnClose(conn) {
    if (!mpRef.current.isHost) return;
    var uid = conn.__uid;
    if (!uid) return;
    setPlayersBoth(playersRef.current.map(function (p) {
      return p.id === uid ? Object.assign({}, p, {
        offline: true
      }) : p;
    }));
    hostBroadcast({
      type: 'PLAYERS_UPDATE',
      players: playersRef.current
    });
    godSet(uid, {});
    checkRaceEnd();
  }
  function onHostConnClose() {
    if (!mpRef.current.on || mpRef.current.isHost) return;
    setTimeout(function () {
      if (mpRef.current.on && !mpRef.current.isHost && sessRef.current) guestSetup(sessRef.current);
    }, 1500);
  }
  function becomeHost(promoting) {
    mpRef.current.isHost = true;
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {}
      peerRef.current = null;
    }
    connsRef.current = [];
    var p = new Peer(mpRef.current.code + '-host');
    peerRef.current = p;
    p.on('connection', function (c) {
      connsRef.current.push(c);
      c.on('data', function (m) {
        return onMpData(m, c);
      });
      c.on('close', function () {
        return onConnClose(c);
      });
    });
    p.on('error', function () {});
    if (promoting) setPlayersBoth(playersRef.current.map(function (pl) {
      return Object.assign({}, pl, {
        isHost: pl.id === myId
      });
    }));
  }
  function guestSetup(sess) {
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {}
      peerRef.current = null;
    }
    var p = new Peer();
    peerRef.current = p;
    p.on('open', function () {
      var c = p.connect(sess.code + '-host');
      hostConnRef.current = c;
      c.on('open', function () {
        try {
          var jm = {
            type: 'JOIN',
            uid: myId,
            pName: sess.name
          };
          if (hubColorRef.current) jm.color = hubColorRef.current;
          c.send(jm);
        } catch (e) {}
      });
      c.on('data', function (m) {
        return onMpData(m, c);
      });
      c.on('close', function () {
        return onHostConnClose();
      });
    });
    p.on('error', function () {});
  }
  function setupMp(sess) {
    var st = sess.settings || {};
    var itemDelayS = Number(st.itemStartTime);
    if (isNaN(itemDelayS)) itemDelayS = 60;
    itemDelayS = Math.max(0, Math.min(600, itemDelayS));
    var szId = [7, 10, 12].indexOf(Number(st.sizeId)) >= 0 ? Number(st.sizeId) : 10;
    mpRef.current = {
      on: true,
      isHost: !!sess.isHost,
      mode: 'race',
      tourn: !!sess.tourn,
      tournInfo: sess.tourn || null,
      hub: !!sess.hub,
      code: sess.code,
      sizeId: szId,
      seed: 0,
      startAt: 0,
      phase: 'waiting',
      itemsAllow: st.allowItems !== false,
      itemDelay: itemDelayS
    };
    setMpOn(true);
    setMpPhase('waiting');
    waitSinceRef.current = Date.now();
    setScreen('mp');
    if (sess.isHost) {
      var list = [{
        id: myId,
        name: sess.name,
        color: sess.hub && hubColorRef.current ? hubColorRef.current : MP_COLORS[0],
        isHost: true,
        spectator: false,
        ready: false,
        offline: false
      }];
      if (sess.tourn && sess.tourn.roster) sess.tourn.roster.forEach(function (e) {
        if (e && e.name && normName(e.name) !== normName(sess.name)) list.push({
          id: 'pending:' + e.name,
          name: e.name,
          color: e.color || MP_COLORS[list.length % MP_COLORS.length],
          isHost: false,
          spectator: false,
          ready: false,
          offline: false,
          pending: true
        });
      });
      setPlayersBoth(list);
      becomeHost(false);
      if (sess.resume) {
        // 房主回座：本地存檔有同場種子就接續（來賓重 JOIN 後 INIT 帶 phase/seed/god）
        var save = loadResumeAny();
        if (save && save.seed && save.sizeId === szId) {
          startMatchLocal(save.seed, szId, save.startAt || Date.now());
          if (typeof save.cells === 'string' && save.cells.length === SIZES[szId].w * SIZES[szId].h) {
            var arr = save.cells.split('').map(Number);
            if (!arr.some(function (v) {
              return !(v >= 0 && v <= 3);
            })) {
              setCells(arr);
              cellsRef.current = arr;
              itemsRef.current = {
                trap: save.items && save.items.trap || 0
              };
              setMyItems(itemsRef.current);
              giftCreditRef.current = save.giftCredit || 0;
              milestoneRef.current = save.milestone || 0;
              countedWallsRef.current = {};
              (save.countedWalls || []).forEach(function (wi) {
                countedWallsRef.current[wi] = 1;
              });
              lastStateRef.current = 0;
            }
          }
          return;
        }
      }
      if (sess.hub && !sess.tourn) {
        if (autoIvRef.current) clearInterval(autoIvRef.current);
        autoIvRef.current = setInterval(function () {
          if (!mpRef.current.on || !mpRef.current.isHost || mpRef.current.phase !== 'waiting') return;
          var N = window.__PLAT_NET;
          if (!N || !N.roster || N.roster.length < 2) return;
          var joined = playersRef.current.filter(function (p) {
            return !p.pending;
          });
          var okAll = N.roster.every(function (r) {
            return joined.some(function (p) {
              return normName(p.name) === normName(r.name);
            });
          });
          if (okAll) startMatch();
        }, 800);
      }
    } else {
      setPlayersBoth([]);
      guestSetup(sess);
    }
  }
  function requestLobby() {
    if (typeof window !== 'undefined' && window.__PLAT_PLATFORM) {
      if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY('game-exit');
      return;
    }
    if (mpRef.current.isHost) {
      if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY('game-exit');
    } else mpSend({
      type: 'REQ_LOBBY',
      uid: myId
    });
  }
  function leaveMatch() {
    if (typeof window !== 'undefined' && window.__PLAT_NOTIFY) window.__PLAT_NOTIFY('player-leave');
    if (mpRef.current.isHost) mpSend({
      type: 'HOST_LEFT',
      uid: myId
    });
    cleanupMp();
    setScreen('home');
  }
  function toggleMyReady() {
    var v = !myReadyRef.current;
    myReadyRef.current = v;
    setMyReadySt(v);
    if (mpRef.current.isHost) {
      setPlayersBoth(playersRef.current.map(function (p) {
        return p.id === myId ? Object.assign({}, p, {
          ready: v
        }) : p;
      }));
      hostBroadcast({
        type: 'PLAYERS_UPDATE',
        players: playersRef.current
      });
    } else mpSend({
      type: 'READY',
      uid: myId,
      ready: v
    });
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
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return; // 底部列主人是另一款時不搶
    var el = platBarRef.current;
    if (el) {
      if (window.PlatBar._el() !== el || !window.PlatBar._elConnected()) window.PlatBar.attach(el, platBarCfgStable.current);
    } else if (window.PlatBar.isAttached() && !window.PlatBar._elConnected()) {
      window.PlatBar.detach(window.PlatBar._el());
    }
  });
  useEffect(function () {
    if (typeof window === 'undefined' || typeof window.PlatBar === 'undefined' || !window.PlatBar.isAttached()) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return;
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

  // ---------- 框架層 F1：PlatHome / PlatTopCard / PlatSetup / PlatTutorial（殼單一實作、本款只給 config 與內容） ----------
  function openAkariSetup() {
    if (!window.PlatSetup) return;
    window.PlatSetup.show({
      accent: ACCENT,
      title: '🎮 選盤面大小',
      subtitle: '選好就直接開局',
      instant: true,
      mode: 'list',
      options: SIZE_IDS.map(function (id) {
        return {
          id: id,
          label: SIZES[id].name + (id === sizeIdRef.current ? '（上次選的）' : '')
        };
      }),
      selectedId: sizeIdRef.current,
      onStart: function onStart(id) {
        var nid = Number(id);
        setSizeId(nid);
        platSave().setStr('akari_last_size', String(nid));
        startSolo(nid);
      }
    });
  }
  function openAkariTutorial() {
    if (!window.PlatTutorial) return;
    var cell = 'w-8 h-8 flex items-center justify-center rounded-[4px] border border-blue-200 bg-[#f1f5f9] text-base';
    var steps = [{
      html: '<div class="font-black text-slate-700 mb-2">1️⃣ 燈照直線，撞牆就停</div><div class="flex gap-[3px] justify-center"><div class="' + cell + ' akari-teach-cell" style="animation-delay:0.5s"></div><div class="' + cell + ' akari-teach-cell" style="animation-delay:0.35s"></div><div class="' + cell + '" style="background:#60a5fa">💡</div><div class="' + cell + ' akari-teach-cell" style="animation-delay:0.35s"></div><div class="' + cell + ' akari-teach-cell" style="animation-delay:0.5s"></div><div class="w-8 h-8 flex items-center justify-center rounded-[4px] bg-slate-800"></div><div class="' + cell + '"></div></div>',
      caption: '在空格放燈泡，整行整列都會亮起來，直到被黑牆擋住。目標是讓每一格都被照亮。'
    }, {
      html: '<div class="font-black text-slate-700 mb-2">2️⃣ 兩盞燈不能互相照到</div><div class="flex gap-[3px] justify-center"><div class="' + cell + ' akari-teach-clash" style="background:#60a5fa">💡</div><div class="' + cell + '" style="background:#fee2e2"></div><div class="' + cell + '" style="background:#fee2e2"></div><div class="' + cell + ' akari-teach-clash" style="background:#60a5fa">💡</div></div>',
      caption: '同一行／列、中間沒有牆隔開的兩盞燈會互相照到——不行。要用牆把燈隔開。'
    }, {
      html: '<div class="font-black text-slate-700 mb-2">3️⃣ 數字牆：旁邊的燈要剛剛好</div><div class="flex gap-[3px] justify-center items-center"><div class="' + cell + '" style="background:#dbeafe"></div><div class="' + cell + '" style="background:#60a5fa">💡</div><div class="' + cell + '" style="background:#dbeafe"></div></div><div class="flex gap-[3px] justify-center items-center mt-[3px]"><div class="' + cell + '" style="background:#60a5fa">💡</div><div class="' + cell + ' akari-teach-ok font-black" style="background:#1e293b;color:#60a5fa">2</div><div class="' + cell + '"></div></div>',
      caption: '牆上的數字是它上下左右緊鄰的燈數。剛好等於時數字會變綠。點按格子循環：燈 → 叉（先做記號）→ 空白。'
    }];
    window.PlatTutorial.show({
      accent: ACCENT,
      title: '💡 怎麼玩美術燈',
      steps: steps
    });
  }
  var platHomeCfgStable = useRef(null);
  if (!platHomeCfgStable.current) platHomeCfgStable.current = {
    accent: ACCENT,
    titleChars: ['美', '術', '燈'],
    enName: 'Akari Light Up',
    onAction: function onAction(name) {
      if (name === 'solo') openAkariSetup();else if (name === 'daily') startDaily(dailySelRef.current);else if (name === 'prev') setDailySel(shiftDate(dailySelRef.current, -1));else if (name === 'next') setDailySel(shiftDate(dailySelRef.current, 1));else if (name === 'cal') openDailyCal();else if (name === 'tutorial') openAkariTutorial();else if (name === 'lobby') {
        if (window.PLAT_show) window.PLAT_show('home');
      }
    }
  };
  useEffect(function () {
    // PlatHome 自我修復 attach（比照 PlatBar v1.55.1：無依賴、每次 render 檢查）
    if (typeof window === 'undefined' || typeof window.PlatHome === 'undefined') return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return;
    if (screen !== 'home') {
      if (window.PlatHome.isAttached() && window.PlatHome._el() === platHomeRef.current) window.PlatHome.detach(platHomeRef.current);
      return;
    }
    var el = platHomeRef.current;
    if (el) {
      if (window.PlatHome._el() !== el || !window.PlatHome._elConnected()) window.PlatHome.attach(el, platHomeCfgStable.current);
    }
  });
  useEffect(function () {
    if (typeof window === 'undefined' || typeof window.PlatHome === 'undefined' || !window.PlatHome.isAttached()) return;
    if (screen !== 'home') return;
    var recs = readDailyRecords();
    var secs = recs[dailySel];
    window.PlatHome.update({
      dailyDate: dailySel,
      dailyIsToday: dailySel === todayStr(),
      dailyDone: !!secs,
      canPrev: dailySel > '2026-01-01',
      canNext: dailySel < todayStr(),
      streak: streakInfo.count || 0,
      bestText: secs ? String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0') : null,
      inPlatform: !!window.__PLAT_PLATFORM
    });
  });
  var platTopCfgStable = useRef(null);
  if (!platTopCfgStable.current) platTopCfgStable.current = {
    accent: ACCENT,
    logo: '💡',
    name: '美術燈',
    frame: false,
    // v1.70.0：band 併入 PlatFrame 外框（只剩 border-b），不再是獨立浮卡
    rulesHtml: '① 在空格放燈，燈會照亮同行同列、直到撞牆。② 所有空格都要被照亮。③ 任何兩盞燈不能互相照到。④ 數字牆上下左右的燈數要剛好等於數字。點按循環：燈 → 叉（記號）→ 空白；按住拖曳可連續塗叉。',
    onAction: function onAction(name) {
      if (name === 'mute') {
        var m = platAudio().toggleMuted();
        setMuted(!!m);
      } else if (name === 'leave-home') {
        genTokenRef.current++;
        if (window.PlatGenerating) window.PlatGenerating.end();
        setScreen('home');
        setPuzzle(null);
        puzzleRef.current = null;
      } else if (name === 'leave-lobby') requestLobby();else if (name === 'leave-leave') leaveMatch();else if (name === 'leave-forceend') {
        if (window.__PLAT_TOURN_FORCEEND) window.__PLAT_TOURN_FORCEEND();
      }
    }
  };
  var platFrameCfgStable = useRef(null);
  if (!platFrameCfgStable.current) platFrameCfgStable.current = {
    paper: '#f4f9ff'
  }; // 外框紙色（藍調紙面，隨改藍裁示）
  useEffect(function () {
    // PlatFrame 自我修復 attach（先於 PlatTopCard effect 宣告：同輪先建框、再掛頂欄）
    if (typeof window === 'undefined' || typeof window.PlatFrame === 'undefined') return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return;
    if (screen !== 'game') {
      if (window.PlatFrame.isAttached() && (window.PlatFrame._el() === platFrameRef.current || !window.PlatFrame._elConnected())) window.PlatFrame.detach(window.PlatFrame._el());
      if (frameBody) setFrameBody(null);
      if (ptcEl) setPtcEl(null);
      return;
    } // detach 只清自己的或已斷線的：無條件 detach() 會誤殺他款對局中的外框（同 PlatHome 誤殺案，v1.72.0 一併修）
    var el = platFrameRef.current;
    if (el) {
      if (window.PlatFrame._el() !== el || !window.PlatFrame._elConnected()) window.PlatFrame.attach(el, platFrameCfgStable.current);
      var b = window.PlatFrame.getBody();
      if (b !== frameBody) setFrameBody(b);
      var t = window.PlatFrame.getTop();
      if (t !== ptcEl) setPtcEl(t);
    }
  });
  useEffect(function () {
    // PlatTopCard 自我修復 attach＋槽位同步（掛載點＝外框頂區）
    if (typeof window === 'undefined' || typeof window.PlatTopCard === 'undefined') return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return;
    if (screen !== 'game') {
      if (window.PlatTopCard.isAttached() && window.PlatTopCard._el() === ptcEl) window.PlatTopCard.detach(ptcEl);
      if (ptcSlot) setPtcSlot(null);
      return;
    }
    var el = ptcEl;
    if (el) {
      if (window.PlatTopCard._el() !== el || !window.PlatTopCard._elConnected()) window.PlatTopCard.attach(el, platTopCfgStable.current);
      var slot = window.PlatTopCard.getSlot();
      if (slot !== ptcSlot) setPtcSlot(slot);
    }
  });
  useEffect(function () {
    if (typeof window === 'undefined' || typeof window.PlatTopCard === 'undefined' || !window.PlatTopCard.isAttached()) return;
    if (screen !== 'game') return;
    var P2 = puzzleRef.current ? arraysToSets(puzzleRef.current) : null;
    var total = P2 ? P2.solution.size : 0;
    var placed = 0; // 放燈制（v1.71.1）：自己看得到的計數只計盤面燈數（1 自放＋3 鎖定）、不分對錯——correct 制會洩漏正解（放對才跳＝可逐格試探）
    if (P2) {
      cellsRef.current.forEach(function (cv) {
        if (cv === 1 || cv === 3) placed++;
      });
    }
    window.PlatTopCard.update({
      leaveIcon: mpOn ? '🔌' : '🏠',
      leaveLabel: mpOn ? '退出' : '主選單',
      modeChip: mpOn ? '⚔️ 競速對戰' : null,
      dailyChip: !mpOn && isDaily && dailyDate ? '每日 ' + dailyDate.slice(5) + (dailyDate !== todayStr() ? ' 補玩' : '') : null,
      specLabel: '⚙️ ' + (isDaily ? '每日一題 ' + (puzzle ? SIZES[puzzle.w]["short"] : '') : puzzle ? SIZES[puzzle.w].name : ''),
      specClickable: false,
      statText: '💡 ' + placed + '/' + total,
      timerText: String(Math.floor(elapsed / 60)).padStart(2, '0') + ':' + String(elapsed % 60).padStart(2, '0'),
      muted: muted,
      players: mpOn ? players.filter(function (p) {
        return !p.pending;
      }).map(function (p) {
        var g = godBoards[p.id] || {
          progress: p.id === myId ? 0 : 0,
          state: 'playing'
        };
        var pct = Math.floor((p.id === myId ? total ? placed / total : 0 : g.progress || 0) * 100);
        return {
          key: p.id,
          name: p.name,
          color: p.color,
          isMe: p.id === myId,
          text: p.spectator ? '👁️' : g.state === 'finished' ? '🏁' : pct + '%'
        };
      }) : null,
      leaveMenu: {
        mode: mpOn ? 'mp' : 'solo',
        canForceEnd: !!(mpOn && typeof window.__PLAT_TOURN_CAN_FORCEEND === 'function' && window.__PLAT_TOURN_CAN_FORCEEND())
      }
    });
  });

  // ---------- 斷電到期（復電提示＋重繪） ----------
  useEffect(function () {
    if (!outageUntil) return;
    var left = outageUntil - Date.now();
    if (left <= 0) return;
    var t = setTimeout(function () {
      outageRef.current = 0;
      setOutageUntil(0);
      itemSay('💡 復電了！光暈回來了');
    }, left + 30);
    return function () {
      return clearTimeout(t);
    };
  }, [outageUntil]);
  // ---------- 等待室秒針 ----------
  useEffect(function () {
    if (screen !== 'mp') return;
    var iv = setInterval(function () {
      return setWaitTick(function (t) {
        return t + 1;
      });
    }, 1000);
    return function () {
      return clearInterval(iv);
    };
  }, [screen]);
  // ---------- 平台倒數（PlatCountdown） ----------
  useEffect(function () {
    if (typeof window === 'undefined' || !window.PlatCountdown) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return;
    if (cdNum != null) window.PlatCountdown.show(cdNum);else window.PlatCountdown.hide();
  }, [cdNum]);
  // ---------- 平台結算（PlatResults，比照地雷：等待卡可關、關後觀戰面板常駐） ----------
  useEffect(function () {
    if (typeof window === 'undefined' || !window.PlatResults) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'akari') return;
    var stage = null;
    if (mpOn && raceFinal) stage = 'fin';else if (mpOn && myOutcome && mpPhase === 'playing') stage = 'wait';
    if (!stage) {
      window.PlatResults.hide();
      if (dismissRef.current) dismissRef.current = null;
      if (leaveArm) setLeaveArm(false);
      return;
    }
    if (dismissRef.current === stage) {
      window.PlatResults.hide();
      return;
    }
    var acts = function acts(id) {
      if (id === 'watch') {
        dismissRef.current = stage;
        setLeaveArm(false);
        try {
          window.PlatResults.hide();
        } catch (e) {}
      } else if (id === 'rematch') {
        dismissRef.current = null;
        try {
          window.PlatResults.hide();
        } catch (e) {}
        if (mpRef.current.isHost) startMatch();else mpSend({
          type: 'REQ_REMATCH',
          uid: myId
        });
      } else if (id === 'lobby') {
        try {
          window.PlatResults.hide();
        } catch (e) {}
        requestLobby();
      } else if (id === 'home') {
        if (!leaveArm) {
          setLeaveArm(true);
          return;
        }
        setLeaveArm(false);
        dismissRef.current = null;
        try {
          window.PlatResults.hide();
        } catch (e) {}
        leaveMatch();
      }
    };
    var homeBtn = leaveArm ? {
      id: 'home',
      label: '⚠️ 確定離開？',
      kind: 'danger'
    } : {
      id: 'home',
      label: '離開'
    };
    var inTourn = !!mpRef.current.tourn;
    var stdBtns = [{
      id: 'watch',
      label: '👁️ 看盤面'
    }].concat(inTourn ? [{
      id: 'lobby',
      label: '🏁 回等待室',
      kind: 'primary'
    }] : [{
      id: 'rematch',
      label: '🔁 再來一局',
      kind: 'primary'
    }, {
      id: 'lobby',
      label: '🏁 回等待室'
    }]).concat([homeBtn]);
    var specR = null;
    if (stage === 'fin') {
      specR = {
        accent: ACCENT,
        title: '競速結果',
        entries: raceFinal.entries,
        verdict: raceFinal.winnerUid === myId ? '🎉 你贏了！' : myOutcome === 'finished' ? '完賽了，本場名次如上！' : '本場比賽結束，名次如上。',
        buttons: stdBtns,
        onAction: acts
      };
    } else {
      var res2 = playersRef.current.filter(function (p) {
        return !p.spectator && !p.pending;
      }).map(function (p) {
        return {
          p: p,
          g: godRef.current[p.id] || {
            progress: 0,
            state: 'playing'
          }
        };
      }).filter(function (e) {
        return e.g.state === 'finished';
      });
      res2.sort(function (a, b) {
        return (a.g.timeMs || 0) - (b.g.timeMs || 0);
      });
      specR = {
        accent: ACCENT,
        title: '本場成績',
        waitingText: '等待其他玩家完成…',
        entries: res2.map(function (e) {
          return {
            key: e.p.id,
            name: e.p.name,
            color: e.p.color,
            isMe: e.p.id === myId,
            right: '⏱ ' + fmtMS(e.g.timeMs || 0)
          };
        }),
        verdict: '🏁 你已完賽，先看看大家的盤面吧',
        buttons: [{
          id: 'watch',
          label: '👁️ 轉變為上帝模式（觀戰）',
          kind: 'primary'
        }, homeBtn],
        onAction: acts
      };
    }
    window.PlatResults.show(specR);
  });

  // ---------- 平台 hooks ----------
  useEffect(function () {
    window.__PLAT_HOOKS_akari = {
      enter: function enter(sess) {
        sessRef.current = sess || null;
        hubColorRef.current = sess && typeof sess.color === 'string' && sess.color ? sess.color : null;
        cleanupMp(); // 開新局先清掉上一局的結算暫存（站規）
        setRaceFinal(null);
        finalRef.current = null;
        setMyOutcome(null);
        outcomeRef.current = null;
        godRef.current = {};
        setGodBoards({});
        setStatus('ready');
        statusRef.current = 'ready';
        setPuzzle(null);
        puzzleRef.current = null;
        setCells([]);
        cellsRef.current = [];
        setIsDaily(false);
        setDailyDate(null);
        if (sess) setupMp(sess);
      },
      exit: function exit() {
        cleanupMp();
        sessRef.current = null;
        hubColorRef.current = null;
        setScreen('home');
      },
      identity: function identity(d) {
        if (!d || typeof d.color !== 'string' || !d.color) return;
        if (d.self) setPlayersBoth(playersRef.current.map(function (p) {
          return p.id === myId ? Object.assign({}, p, {
            color: d.color
          }) : p;
        }));else setPlayersBoth(playersRef.current.map(function (p) {
          return normName(p.name) === normName(d.name || '') ? Object.assign({}, p, {
            color: d.color
          }) : p;
        }));
        if (mpRef.current.isHost) hostBroadcast({
          type: 'PLAYERS_UPDATE',
          players: playersRef.current
        });
      },
      migrate: function migrate() {
        if (mpRef.current.on && !mpRef.current.isHost && typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.isHost) becomeHost(true);
      },
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
          zoom: zoomRef.current,
          mp: {
            on: mpRef.current.on,
            isHost: mpRef.current.isHost,
            phase: mpRef.current.phase,
            tourn: mpRef.current.tourn,
            seed: mpRef.current.seed,
            sizeId: mpRef.current.sizeId
          },
          players: playersRef.current,
          god: godRef.current,
          "final": finalRef.current,
          items: Object.assign({}, itemsRef.current),
          giftCredit: giftCreditRef.current,
          milestone: milestoneRef.current,
          outageUntil: outageRef.current,
          myOutcome: outcomeRef.current
        };
      }
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
    litPct = 0,
    dispProgress = 0;
  if (P && cells.length) {
    var bulbs = placedBulbs(cells);
    litSet = window.Akari.litCells(P.w, P.h, P.walls, bulbs);
    var conf = window.Akari.conflicts(P.w, P.h, P.walls, P.numbers, bulbs);
    confBad = conf.badBulbs;
    numState = conf.numState;
    progress = window.Akari.progressOf(P.solution, bulbs);
    dispProgress = P.solution.size ? bulbs.size / P.solution.size : 0; // 顯示用放燈制（v1.71.1 使用者實機抓洩漏：correct 制計數＝逐格試探正解的作弊通道）；progress/correct 僅供系統邏輯（同步/里程碑/完賽），顯示一律用 dispProgress/放燈數
    P.solution.forEach(function (b) {
      if (bulbs.has(b)) correct++;
    });
    var nonWall = 0;
    for (var i = 0; i < P.w * P.h; i++) if (!P.walls.has(i)) nonWall++;
    litPct = nonWall ? Math.round(100 * litSet.size / nonWall) : 0;
  }
  var outaged = mpOn && outageUntil > Date.now();
  var litVis = outaged ? new Set() : litSet; // 斷電：光暈視覺消失（狀態不變）
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
    // 主畫面由殼 PlatHome 單一實作渲染（框架層 F1）；無殼環境（獨立開啟）才用下方最小備援
    return /*#__PURE__*/React.createElement("div", {
      key: "akari-home",
      className: "min-h-screen flex flex-col"
    }, /*#__PURE__*/React.createElement("div", {
      ref: platHomeRef,
      className: "flex-1 flex flex-col min-h-screen"
    }), typeof window !== 'undefined' && !window.PlatHome && /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 flex flex-col items-center justify-center gap-4 p-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-6xl"
    }, "\uD83D\uDCA1"), /*#__PURE__*/React.createElement("div", {
      className: "font-black text-3xl text-slate-800"
    }, "\u7F8E\u8853\u71C8 Akari"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return startSolo(sizeId);
      },
      className: "plat-btn-hard px-6 py-3 bg-blue-400 border-4 border-slate-800 rounded-xl font-black text-xl"
    }, "\uD83C\uDFAE \u55AE\u6A5F\u6311\u6230"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return startDaily(todayStr());
      },
      className: "plat-btn-hard px-6 py-3 bg-white border-4 border-slate-800 rounded-xl font-black text-xl"
    }, "\uD83D\uDCC5 \u6BCF\u65E5\u4E00\u984C")));
  }
  if (screen === 'mp') {
    var M = mpRef.current;
    var szName = (SIZES[M.sizeId] || SIZES[10]).name;
    if (!M.tourn) {
      return /*#__PURE__*/React.createElement("div", {
        key: "akari-mp",
        className: "min-h-screen w-full flex flex-col items-center p-4 relative"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex-1 flex items-center justify-center w-full"
      }, /*#__PURE__*/React.createElement("div", {
        className: "bg-white border-4 border-slate-800 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,1)] p-8 text-center max-w-sm w-full animate-fadeIn"
      }, /*#__PURE__*/React.createElement("div", {
        className: "text-5xl mb-3"
      }, "\u23F3"), /*#__PURE__*/React.createElement("div", {
        className: "font-black text-2xl text-slate-800 animate-pulse"
      }, "\u7B49\u623F\u4E3B\u958B\u59CB\u5C0D\u5C40\u2026"), /*#__PURE__*/React.createElement("div", {
        className: "font-semibold text-slate-400 text-sm mt-2"
      }, "\u6E96\u5099\u548C\u8A2D\u5B9A\u90FD\u5728\u623F\u9593\u9801\u5B8C\u6210\u4E86\uFF0C\u99AC\u4E0A\u958B\u59CB"), /*#__PURE__*/React.createElement("button", {
        onClick: leaveMatch,
        className: "plat-btn-hard mt-5 px-4 py-2 bg-slate-100 border-[3px] border-slate-800 rounded-xl font-black text-slate-600 shadow-[2px_2px_0px_rgba(30,41,59,1)]"
      }, "\u96E2\u958B"))));
    }
    var racersW = players.filter(function (p) {
      return !p.spectator && !p.pending;
    });
    var pendW = players.filter(function (p) {
      return p.pending;
    });
    var allReadyW = racersW.length > 0 && racersW.every(function (p) {
      return p.ready;
    });
    var waitedW = waitSinceRef.current ? Date.now() - waitSinceRef.current : 0;
    var canStartW = M.isHost && racersW.length >= 2 && (pendW.length === 0 && allReadyW || waitedW >= 60000);
    var startNoteW = !M.isHost ? '' : racersW.length < 2 ? '等待選手加入（至少 2 位）…' : canStartW ? pendW.length ? '未到的選手將以觀戰身分加入' : '' : pendW.length ? '等待全員到齊…' : '等待全員準備（或 ' + Math.max(0, 60 - Math.floor(waitedW / 1000)) + ' 秒後開放開始）';
    var myEntryW = players.find(function (p) {
      return p.id === myId;
    });
    var tInfo = M.tournInfo || {};
    return /*#__PURE__*/React.createElement("div", {
      key: "akari-mp",
      className: "min-h-screen w-full flex flex-col items-center p-4 relative"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex-1 flex items-center justify-center w-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-full max-w-md bg-[#fffaf0] border-4 border-slate-800 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,1)] p-6 z-10 animate-fadeIn"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-center text-4xl mb-1"
    }, "\uD83C\uDFC6"), /*#__PURE__*/React.createElement("div", {
      className: "font-black text-2xl text-slate-800 text-center"
    }, "\u9326\u6A19\u8CFD\u30FB\u7B2C ", tInfo.round || '?', " \u5C40"), /*#__PURE__*/React.createElement("div", {
      className: "font-semibold text-slate-400 text-sm text-center mt-1 mb-4"
    }, "\u672C\u5C40\uFF1A\u7F8E\u8853\u71C8\u7AF6\u901F\u30FB", szName, "\u30FB\u5168\u54E1\u6E96\u5099\u597D\u623F\u4E3B\u624D\u80FD\u958B\u59CB\uFF0C\u6216\u7B49\u6EFF 1 \u5206\u9418\u5F37\u5236\u958B\u59CB"), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col gap-2 mb-4"
    }, players.map(function (p) {
      return /*#__PURE__*/React.createElement("div", {
        key: p.id,
        className: "flex items-center gap-2 bg-slate-50 border-2 border-slate-800 rounded-xl px-3 py-2 font-black text-slate-800"
      }, /*#__PURE__*/React.createElement("span", {
        className: "w-4 h-4 rounded-full border-2 border-slate-800 shrink-0",
        style: {
          background: p.color
        }
      }), /*#__PURE__*/React.createElement("span", {
        className: "truncate"
      }, p.name, p.isHost ? ' 👑' : '', p.id === myId ? '（你）' : ''), /*#__PURE__*/React.createElement("span", {
        className: "ml-auto shrink-0"
      }, p.pending ? /*#__PURE__*/React.createElement("span", {
        className: "text-[10px] bg-slate-100 border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded-md"
      }, "\u672A\u5230") : p.offline ? /*#__PURE__*/React.createElement("span", {
        className: "text-[10px] bg-rose-100 border border-rose-400 text-rose-600 px-1.5 py-0.5 rounded-md"
      }, "\u96E2\u7DDA") : p.spectator ? /*#__PURE__*/React.createElement("span", {
        className: "text-[10px] bg-sky-100 border border-sky-400 text-sky-700 px-1.5 py-0.5 rounded-md"
      }, "\uD83D\uDC41\uFE0F \u89C0\u6230") : p.ready ? /*#__PURE__*/React.createElement("span", {
        className: "text-[10px] bg-emerald-100 border border-emerald-500 text-emerald-700 px-1.5 py-0.5 rounded-md"
      }, "\u2705 \u6E96\u5099\u597D\u4E86") : /*#__PURE__*/React.createElement("span", {
        className: "text-[10px] bg-slate-100 border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded-md"
      }, "\u672A\u6E96\u5099")));
    }), !players.length && /*#__PURE__*/React.createElement("p", {
      className: "font-bold text-slate-400 text-center py-2"
    }, "\u9023\u7DDA\u4E2D\u2026")), myEntryW && !myEntryW.pending && !myEntryW.spectator && /*#__PURE__*/React.createElement("button", {
      onClick: toggleMyReady,
      className: "plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 rounded-xl border-[3px] border-slate-800 font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)]" + (myReadySt ? ' bg-blue-400 text-slate-900' : ' bg-white text-slate-500')
    }, myReadySt ? '✅ 已準備（點擊取消）' : '✋ 準備好了'), M.isHost ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
      disabled: !canStartW,
      onClick: startMatch,
      className: "plat-btn-hard plat-btn-hard-3 w-full py-3 bg-red-500 text-white border-[3px] border-slate-800 rounded-xl font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)] disabled:opacity-40 disabled:shadow-none"
    }, "\uD83C\uDFC1 \u958B\u59CB\u672C\u5C40"), startNoteW && /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-slate-500 font-semibold text-center mt-2"
    }, startNoteW)) : /*#__PURE__*/React.createElement("p", {
      className: "font-black text-slate-700 animate-pulse text-center"
    }, "\u7B49\u5F85\u623F\u4E3B\u958B\u59CB..."))));
  }

  // game 畫面
  var cellPxBase = puzzle ? Math.max(24, Math.min(52, Math.floor((Math.min(window.innerWidth || 400, 560) - 24) / puzzle.w))) : 36;
  var cellPx = Math.round(cellPxBase * zoom);
  return /*#__PURE__*/React.createElement("div", {
    key: "akari-game",
    className: "min-h-screen flex flex-col items-center p-2 md:p-4 pb-28"
  }, /*#__PURE__*/React.createElement("div", {
    ref: platFrameRef,
    className: "w-full"
  }), ptcSlot && ReactDOM.createPortal( /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 h-3.5 bg-white/80 border-2 border-slate-800 rounded-full overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-slate-800 transition-all duration-300 plat-pbar",
    style: {
      width: Math.round(dispProgress * 100) + '%'
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "font-black text-xs text-slate-900 whitespace-nowrap"
  }, "\u9032\u5EA6 ", /*#__PURE__*/React.createElement(PlatPct, {
    value: Math.round(dispProgress * 100)
  }), "\u30FB\u7167\u4EAE ", /*#__PURE__*/React.createElement(PlatPct, {
    value: litPct
  }))), mpOn && itemsLive() && !iAmSpecRef.current && !myOutcome && mpPhase === 'playing' && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 mt-1.5 justify-end"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-black text-[11px] text-slate-900",
    title: "\u6578\u5B57\u7246\u6B63\u78BA\u6EFF\u8DB3\u7D2F\u7A4D\u7684\u79AE\u7269\u984D\u5EA6\uFF08\u6EFF 1 \u81EA\u52D5\u9001\u8F03\u5F31\u7684\u5C0D\u624B\uFF09"
  }, "\uD83C\uDF81 \u984D\u5EA6 ", giftCreditRef.current.toFixed(1)), /*#__PURE__*/React.createElement("button", {
    onClick: fireTrap,
    disabled: (myItems.trap || 0) <= 0,
    className: "plat-btn-hard px-2 py-0.5 bg-violet-100 border-2 border-slate-800 rounded-full font-black text-[11px] text-violet-800 shadow-[1px_1px_0px_rgba(30,41,59,1)] disabled:opacity-40 disabled:shadow-none",
    title: "\u65B7\u96FB\u9677\u9631\uFF1A\u8B93\u4E00\u4F4D\u5C0D\u624B\u7684\u71C8\u5149\u6688\u6D88\u5931 5 \u79D2"
  }, "\u26A1 \u65B7\u96FB \xD7", myItems.trap || 0)), outaged && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 bg-slate-800 text-blue-300 font-black text-sm rounded-lg px-3 py-1.5 text-center animate-pulse"
  }, "\u26A1 \u65B7\u96FB\u4E2D\u2026\u5149\u6688\u66AB\u6642\u6D88\u5931\uFF08\u71C8\u90FD\u9084\u5728\uFF09"), itemToast && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 bg-white/90 border-2 border-slate-800 text-slate-800 font-black text-sm rounded-lg px-3 py-1.5 text-center"
  }, itemToast)), ptcSlot), frameBody && ReactDOM.createPortal( /*#__PURE__*/React.createElement("div", {
    className: "w-full flex flex-col items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "akari-board-scroll overflow-auto flex justify-center w-full" + (mpOn && iAmSpecRef.current ? " hidden" : ""),
    onPointerMove: onBoardMove
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-grid gap-[3px] p-[6px] bg-blue-100 border-[3px] border-slate-800 rounded-2xl",
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
          color: nst === 'ok' ? '#4ade80' : nst === 'over' ? '#f87171' : '#60a5fa'
        }
      }, n) : null);
    }
    var isBulb = cv === 1,
      isLocked = cv === 3,
      isCross = cv === 2,
      lit = litVis.has(i),
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
      className: "relative flex items-center justify-center rounded-[4px] border select-none touch-none" + (bad ? " border-red-500" : " border-blue-200") + (isBulb && newBulbRef.current === i ? " akari-bulb-new" : ""),
      style: {
        width: cellPx,
        height: cellPx,
        fontSize: Math.round(cellPx * 0.52),
        background: isBulb || isLocked ? '#60a5fa' : lit ? '#dbeafe' : '#ffffff',
        boxShadow: bad ? 'inset 0 0 0 2px #ef4444' : isLocked ? 'inset 0 0 0 2px #1d4ed8, 0 0 10px 2px rgba(59,130,246,0.55)' : isBulb && !outaged ? '0 0 10px 2px rgba(59,130,246,0.55)' : 'none'
      }
    }, isBulb || isLocked ? '💡' : isCross ? /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400 font-black"
    }, "\u2715") : '', isLocked && /*#__PURE__*/React.createElement("span", {
      className: "absolute bottom-0 right-0 leading-none",
      style: {
        fontSize: Math.max(9, Math.round(cellPx * 0.3))
      }
    }, "\uD83D\uDD12"));
  }))), mpOn && (myOutcome || iAmSpecRef.current) && puzzle && /*#__PURE__*/React.createElement("div", {
    className: "mt-4 w-full max-w-[560px] bg-white border-[3px] border-slate-800 rounded-2xl shadow-[3px_3px_0px_rgba(30,41,59,1)] p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-black text-slate-800 mb-2"
  }, "\uD83D\uDC41\uFE0F \u89C0\u6230\uFF08\u9EDE\u9078\u624B\u770B\u4ED6\u7684\u76E4\u9762\uFF09"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5 flex-wrap mb-3"
  }, players.filter(function (p) {
    return !p.spectator && !p.pending && p.id !== myId;
  }).map(function (p) {
    var g = godBoards[p.id] || {
      progress: 0,
      state: 'playing'
    };
    return /*#__PURE__*/React.createElement("button", {
      key: p.id,
      onClick: function onClick() {
        return setSpecUid(p.id);
      },
      className: "plat-btn-hard px-2.5 py-1 rounded-full border-2 border-slate-800 font-black text-xs shadow-[1px_1px_0px_rgba(30,41,59,1)]" + (specUid === p.id ? " bg-blue-400 text-slate-900" : " bg-white text-slate-700")
    }, /*#__PURE__*/React.createElement("span", {
      className: "inline-block w-2.5 h-2.5 rounded-full border border-slate-800 mr-1",
      style: {
        background: p.color
      }
    }), p.name, "\u30FB", g.state === 'finished' ? '🏁' : /*#__PURE__*/React.createElement(PlatPct, {
      value: Math.floor((g.progress || 0) * 100)
    }));
  })), specUid && godBoards[specUid] && typeof godBoards[specUid].cells === 'string' && P && /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-grid gap-[2px] p-[4px] bg-blue-100 border-2 border-slate-800 rounded-xl",
    style: {
      gridTemplateColumns: 'repeat(' + puzzle.w + ', 18px)'
    }
  }, godBoards[specUid].cells.split('').map(function (ch, i) {
    if (P.walls.has(i)) {
      var n = P.numbers.has(i) ? P.numbers.get(i) : null;
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        className: "flex items-center justify-center bg-slate-800 rounded-[3px] font-black text-blue-300",
        style: {
          width: 18,
          height: 18,
          fontSize: 10
        }
      }, n != null ? n : '');
    }
    var v = Number(ch);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "flex items-center justify-center rounded-[3px] border border-blue-200",
      style: {
        width: 18,
        height: 18,
        fontSize: 11,
        background: v === 1 || v === 3 ? '#60a5fa' : '#ffffff',
        boxShadow: v === 3 ? 'inset 0 0 0 2px #1d4ed8' : 'none'
      }
    }, v === 1 || v === 3 ? '💡' : v === 2 ? /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400 font-black"
    }, "\u2715") : '');
  }))), specUid && !(godBoards[specUid] && typeof godBoards[specUid].cells === 'string') && /*#__PURE__*/React.createElement("p", {
    className: "text-center font-bold text-slate-400 text-sm"
  }, "\u7B49\u4ED6\u7684\u76E4\u9762\u540C\u6B65\u904E\u4F86\u2026")), status === 'won' && winInfo && !mpOn && /*#__PURE__*/React.createElement("div", {
    className: "mt-4 w-full max-w-[560px] bg-white border-[3px] border-slate-800 rounded-2xl shadow-[3px_3px_0px_rgba(30,41,59,1)] p-4 text-center"
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
    className: "plat-btn-hard px-5 py-2.5 bg-blue-400 border-[3px] border-slate-800 rounded-xl font-black shadow-[2px_2px_0px_rgba(30,41,59,1)]"
  }, "\uD83D\uDD01 \u518D\u4F86\u4E00\u5C40"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setScreen('home');
      setPuzzle(null);
      puzzleRef.current = null;
    },
    className: "plat-btn-hard px-5 py-2.5 bg-white border-[3px] border-slate-800 rounded-xl font-black shadow-[2px_2px_0px_rgba(30,41,59,1)]"
  }, "\uD83C\uDFE0 \u56DE\u4E3B\u9078\u55AE")))), frameBody), /*#__PURE__*/React.createElement("div", {
    className: "fixed bottom-0 left-0 right-0 z-[100] pb-safe"
  }, /*#__PURE__*/React.createElement("div", {
    ref: platBarRef
  })));
}
ReactDOM.createRoot(document.getElementById('akari-root')).render( /*#__PURE__*/React.createElement(window.PlatBoundary, null, React.createElement(AkariGame, null)));