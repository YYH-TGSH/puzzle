"use strict";

function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : String(i); }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// 踩地雷 Minesweeper（平台第三款遊戲）
// 架構比照數獨/數橋：React 單一 app、平台模式走殼的 Peer 連線（PlatPeer shim）與共用元件（PlatBar/PlatRoom/PlatResults/PlatCountdown）。
// 規則（使用者 2026-10-28 拍板）：多人競速踩到雷直接出局、照當時進度%排名；盤面 9×9・10雷（預設）/16×16・40雷；
// 第一版不做大亂鬥道具（純競速）；第一次點擊永遠不踩雷；觀戰只看已挖開/插旗狀態、不洩漏雷位。
var _React = React,
  useState = _React.useState,
  useEffect = _React.useEffect,
  useRef = _React.useRef,
  useMemo = _React.useMemo,
  useCallback = _React.useCallback;
// PlatPct：進度 % 滾字（v1.53.0 物理感規格）——殼層 PlatCount 的 React 包裝；獨立版（無 PlatCount）退回純文字
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

// PlatNum：小數字 Roll-lite 包裝（v1.54.0，B 批）——有殼 PlatLite 時新值 spring 彈入換字；無殼（獨立版）退純文字。寫法比照 PlatPct。
function PlatNum(props) {
  var ref = useRef(null);
  var v = String(props.value);
  useEffect(function () {
    if (window.PlatLite && ref.current) window.PlatLite(ref.current, v);
  }, [v]);
  if (!window.PlatLite) return /*#__PURE__*/React.createElement("span", null, v);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref
  });
}

// ---------- 小工具（storage 一律 try/catch：iOS 預覽 webview 會封鎖 localStorage） ----------
function platTimeOffset() {
  try {
    return window.__PLAT_NET && window.__PLAT_NET.timeOffset || 0;
  } catch (e) {
    return 0;
  }
} // 房主時鐘偏移（稽核 D-05）：殼以 roster 時間戳估計，房主/單機恆 0
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
// ===== PlatSave 接點（facade）：平台模式委派殼的 window.PlatSave、獨立開啟時用同語意本地後備；validator 在此集中登記、read 時統一帶入 =====
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

// validator 集中登記（收編既有守衛、行為等價）：resume＝形狀＋3 小時 TTL（種子/尺寸/長度比對在 loadResume 以 opts.validate 帶入）；custom_cfg＝三數值欄位
platSave().register('mines_resume', function (p) {
  return !!p && _typeof(p) === 'object' && typeof p.cells === 'string' && typeof p.ts === 'number' && Date.now() - p.ts <= 3 * 3600 * 1000;
});
platSave().register('mines_daily_records', function (p) {
  return !!p && _typeof(p) === 'object' && !Array.isArray(p);
});
platSave().register('mines_daily_streak', function (p) {
  return !!p && _typeof(p) === 'object' && typeof p.count === 'number';
});
platSave().register('mines_custom_cfg', function (p) {
  return !!p && _typeof(p) === 'object' && typeof p.w === 'number' && typeof p.h === 'number' && typeof p.mines === 'number';
});
// === PlatAudio 接點（技能對照改造第 3 項，v1.64.0）：平台模式用殼的 window.PlatAudio；獨立開啟用同配方（v1.64.2 A 清脆＋華麗版）本地後備——靜音同走 plat_muted、首次讀取保守合併舊三鍵 ===
var __paLocal = null;
function platAudio() {
  if (typeof window !== 'undefined' && window.PlatAudio) return window.PlatAudio;
  if (__paLocal) return __paLocal;
  var RECIPES = {
    place: {
      notes: [[880, 0, 0.07, 1, 'triangle']]
    },
    count: {
      notes: [[880, 0, 0.09, 0.5, 'square']]
    },
    go: {
      notes: [[1320, 0, 0.25, 0.55, 'square']]
    },
    star: {
      notes: [[1568, 0, 0.18, 0.35, 'sine']]
    },
    error: {
      notes: [[170, 0, 0.13, 1, 'triangle']]
    },
    boom: {
      notes: [[140, 0, 0.22, 1, 'triangle']]
    },
    gift: {
      notes: [[523, 0, 0.14, 0.7, 'triangle'], [659, 0.07, 0.18, 0.7, 'triangle']]
    },
    complete: {
      notes: [[523, 0, 0.16, 1, 'triangle'], [659, 0.07, 0.16, 1, 'triangle'], [784, 0.14, 0.16, 1, 'triangle'], [1046, 0.21, 0.30, 1, 'triangle'], [262, 0, 0.75, 0.22, 'sine'], [330, 0, 0.75, 0.22, 'sine'], [392, 0, 0.75, 0.22, 'sine']]
    },
    win: {
      notes: [[523, 0, 0.16, 1, 'triangle'], [587, 0.08, 0.16, 1, 'triangle'], [659, 0.16, 0.16, 1, 'triangle'], [784, 0.24, 0.16, 1, 'triangle'], [880, 0.32, 0.16, 1, 'triangle'], [1046, 0.40, 0.24, 1, 'triangle'], [1046, 0.48, 1.0, 0.45, 'sine'], [1318, 0.48, 1.0, 0.45, 'sine'], [1568, 0.48, 1.0, 0.45, 'sine'], [262, 0, 1.2, 0.22, 'sine'], [330, 0, 1.2, 0.22, 'sine'], [392, 0, 1.2, 0.22, 'sine']]
    }
  };
  var ctx = null,
    master = null,
    unlocked = false,
    lastPlay = {},
    mutedCache = null;
  function sGet(k) {
    try {
      var v = platSave().getStr(k, '');
      return v === null || v === undefined ? '' : v;
    } catch (e) {
      return '';
    }
  }
  function sSet(k, v) {
    try {
      platSave().setStr(k, v);
    } catch (e) {}
  }
  function readMuted() {
    if (mutedCache !== null) return mutedCache;
    var v = sGet('plat_muted');
    if (!v) {
      var legacy = sGet('sudoku_muted') === '1' || sGet('hashi_muted') === '1' || sGet('mines_muted') === '1';
      v = legacy ? '1' : '0';
      sSet('plat_muted', v);
    }
    mutedCache = v === '1';
    return mutedCache;
  }
  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
      return null;
    }
    return ctx;
  }
  if (typeof document !== 'undefined' && document.addEventListener) {
    // 解鎖/恢復（v1.65.3）：iOS 中斷（通知/Siri/切 App/主畫面 App 凍結解凍）會把 ctx 打入 'interrupted'（iOS 17+）或 'suspended'；
    // 舊版只 resume 'suspended' → interrupted 永不恢復、音排進凍結的 currentTime、整場靜音（實機「數獨全程沒聲音」根因）。
    // pointerdown/touchend/click 三路手勢都嘗試恢復；回前景（visibilitychange）也補一次 resume 嘗試（不設 unlocked、手勢外未必生效、下一個 pointerdown 會再補）。
    var __paUnlock = function __paUnlock() {
      unlocked = true;
      var c = ensureCtx();
      if (c && (c.state === 'suspended' || c.state === 'interrupted')) {
        try {
          var p = c.resume();
          if (p && p["catch"]) p["catch"](function () {});
        } catch (e) {}
      }
    };
    document.addEventListener('pointerdown', __paUnlock, true);
    document.addEventListener('touchend', __paUnlock, true);
    document.addEventListener('click', __paUnlock, true);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      var c = ensureCtx();
      if (c && (c.state === 'suspended' || c.state === 'interrupted')) {
        try {
          var p = c.resume();
          if (p && p["catch"]) p["catch"](function () {});
        } catch (e) {}
      }
    });
  }
  function tone(freq, at, dur, vol, type) {
    var t = ctx.currentTime + at;
    var o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  __paLocal = {
    play: function play(name) {
      try {
        if (readMuted()) return;
        var r = RECIPES[name];
        if (!r) return;
        var vib = {
          place: 10,
          error: [30, 30, 30],
          complete: [50, 50, 100],
          win: [50, 50, 100],
          gift: 10
        }[name];
        if (vib !== undefined) {
          try {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(vib);
          } catch (e) {}
        }
        if (!unlocked || !ctx) return;
        if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
          try {
            var rp = ctx.resume();
            if (rp && rp["catch"]) rp["catch"](function () {});
          } catch (e) {}
          return;
        } // 非 running 不排音：排進凍結時鐘永遠不出聲、復原後還會爆出陳舊音（v1.65.3）
        var now = Date.now();
        if (lastPlay[name] && now - lastPlay[name] < 60) return;
        lastPlay[name] = now;
        for (var i = 0; i < r.notes.length; i++) {
          var n = r.notes[i];
          tone(n[0], n[1], n[2], n[3], n[4]);
        }
      } catch (e) {}
    },
    isMuted: function isMuted() {
      return readMuted();
    },
    setMuted: function setMuted(m) {
      mutedCache = !!m;
      sSet('plat_muted', m ? '1' : '0');
    },
    toggleMuted: function toggleMuted() {
      var m = !readMuted();
      mutedCache = m;
      sSet('plat_muted', m ? '1' : '0');
      return m;
    }
  };
  return __paLocal;
}
// === PlatTap/PlatZoom 接點（共用手勢判定＋縮放持有，v1.63.0）：平台模式用殼的 window.PlatTap/PlatZoom；獨立開啟用同語意本地後備（與殼同碼） ===
function platTapFactoryLocal(opts) {
  opts = opts || {};
  var slop = opts.slop != null ? opts.slop : 22;
  var tapMaxMs = opts.tapMaxMs != null ? opts.tapMaxMs : 0;
  var lpMs = opts.longpressMs != null ? opts.longpressMs : 0;
  var supMs = opts.suppressMs != null ? opts.suppressMs : 0;
  var g = null;
  var supT = -1,
    supTag;
  function drift(x, y) {
    return g ? Math.hypot(x - g.x0, y - g.y0) : 0;
  }
  function settle(x, y, t, isCancel) {
    if (!g) return {
      type: isCancel ? 'cancel' : 'none',
      dx: 0,
      dy: 0,
      drift: 0,
      dur: 0,
      longpress: false
    };
    t = t != null ? t : Date.now();
    var hasXY = typeof x === 'number' && typeof y === 'number';
    var d = hasXY ? drift(x, y) : 0,
      dur = t - g.t0,
      lp = g.lpFired,
      type;
    if (isCancel) type = 'cancel';else if (lp) type = 'longpress';else if (d > slop) type = 'drag';else if (tapMaxMs > 0 && dur >= tapMaxMs) type = 'cancel';else type = 'tap';
    var r = {
      type: type,
      dx: hasXY ? x - g.x0 : 0,
      dy: hasXY ? y - g.y0 : 0,
      drift: d,
      dur: dur,
      longpress: lp
    };
    g = null;
    return r;
  }
  return {
    down: function down(x, y, t) {
      g = {
        x0: x,
        y0: y,
        t0: t != null ? t : Date.now(),
        lpFired: false
      };
    },
    move: function move(x, y) {
      if (!g) return {
        dragging: false,
        drift: 0
      };
      var d = drift(x, y);
      return {
        dragging: d > slop,
        drift: d
      };
    },
    poll: function poll(t) {
      if (g && lpMs > 0 && !g.lpFired && (t != null ? t : Date.now()) - g.t0 >= lpMs) {
        g.lpFired = true;
        return 'longpress';
      }
      return null;
    },
    up: function up(x, y, t) {
      return settle(x, y, t, false);
    },
    cancel: function cancel(x, y, t) {
      return settle(x, y, t, true);
    },
    markSuppress: function markSuppress(t, tag) {
      supT = t != null ? t : Date.now();
      supTag = tag;
    },
    shouldSuppressClick: function shouldSuppressClick(t, tag) {
      if (supMs <= 0 || supT < 0) return false;
      if ((t != null ? t : Date.now()) - supT >= supMs) return false;
      return supTag === undefined || tag === undefined || supTag === tag;
    },
    clearSuppress: function clearSuppress() {
      supT = -1;
    },
    active: function active() {
      return !!g;
    }
  };
}
function platZoomFactoryLocal(opts) {
  opts = opts || {};
  var _min = opts.min != null ? opts.min : 0.1;
  var _max = opts.max != null ? opts.max : 5;
  var val = opts.value != null ? opts.value : 1;
  var clean2 = !!opts.cleanup2dp;
  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }
  var api = {
    value: function value() {
      return val;
    },
    set: function set(v, range) {
      var lo = range ? range[0] : _min,
        hi = range ? range[1] : _max;
      val = clamp(v, lo, hi);
      return val;
    },
    setRaw: function setRaw(v) {
      val = v;
      return val;
    },
    add: function add(d) {
      var v = val + d;
      if (clean2) v = Math.round(v * 100) / 100;
      return api.set(v);
    },
    reset: function reset() {
      val = 1;
      return val;
    },
    min: function min() {
      return _min;
    },
    max: function max() {
      return _max;
    }
  };
  return api;
}
function platTapNew(opts) {
  return (window.PlatTap || platTapFactoryLocal)(opts);
}
function platZoomNew(opts) {
  return (window.PlatZoom || platZoomFactoryLocal)(opts);
}
function platArmZoom(el) {
  if (!el) return;
  if (window.PlatZoom && window.PlatZoom.armTransition) {
    window.PlatZoom.armTransition(el);
    return;
  }
  el.style.transition = 'width 200ms cubic-bezier(0.22, 1, 0.36, 1), height 200ms cubic-bezier(0.22, 1, 0.36, 1)';
  if (el.__pzArmTimer) clearTimeout(el.__pzArmTimer);
  el.__pzArmTimer = setTimeout(function () {
    el.style.transition = '';
    el.__pzArmTimer = null;
  }, 260);
}
function mulberry32(a) {
  return function () {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  var m = Math.floor(sec / 60),
    s = sec % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}
function todayStr(d) {
  d = d || new Date();
  var m = d.getMonth() + 1,
    day = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
}
// ---------- 每日一題（日期種子，全員同題；規則比照數獨/數橋） ----------
function dailySeed(dateStr) {
  return hashStr('mines-daily-' + dateStr);
}
function readDailyRecords() {
  return platSave().read('mines_daily_records', {
    fallback: {}
  });
}
function readDailyStreak() {
  return platSave().read('mines_daily_streak', {
    fallback: {
      last: '',
      count: 0
    }
  });
}
function shiftDate(dateStr, days) {
  var p = dateStr.split('-');
  var d = new Date(+p[0], +p[1] - 1, +p[2]);
  d.setDate(d.getDate() + days);
  return todayStr(d);
}
var DAILY_MIN = '2026-01-01';

// ---------- 盤面引擎（純函式，可獨立驗證） ----------
var SIZES = {
  9: {
    id: 9,
    w: 9,
    h: 9,
    mines: 10,
    name: '9×9・10 雷',
    "short": '9×9'
  },
  16: {
    id: 16,
    w: 16,
    h: 16,
    mines: 40,
    name: '16×16・40 雷',
    "short": '16×16'
  }
};
// 自訂盤面（使用者 2026-11-04 指示：單機/多人都能自選 寬×高＋雷數）：引擎函式本來就吃 w/h/mines 參數，
// 自訂規格註冊進 SIZES.custom、sizeId='custom' 貫穿單機/多人/回座（比照數橋 hub 自訂尺寸的貫穿方式）。
// 上下限在此統一 clamp：寬 8–30、高 8–24、雷至少 5 且 ≤ 總格數−9——首點保護圈（點格＋鄰 8 格）必須留空，
// 雷數超過這個上限時 makeFirstSafe 沒地方搬雷、首點保護會失效，所以這是硬上限不是偏好。
function clampCustomSpec(w, h, mines) {
  var W = Math.max(8, Math.min(30, Math.round(Number(w) || 16)));
  var H = Math.max(8, Math.min(24, Math.round(Number(h) || 16)));
  var M = Math.max(5, Math.min(W * H - 9, Math.round(Number(mines) || 40)));
  return {
    w: W,
    h: H,
    mines: M
  };
}
function regCustomSpec(c) {
  if (!c) return SIZES.custom || null;
  var cl = clampCustomSpec(c.w, c.h, c.mines);
  SIZES.custom = {
    id: 'custom',
    w: cl.w,
    h: cl.h,
    mines: cl.mines,
    name: cl.w + '×' + cl.h + '・' + cl.mines + ' 雷',
    "short": cl.w + '×' + cl.h
  };
  return SIZES.custom;
}
function neighborsOf(w, h, i) {
  var x = i % w,
    y = Math.floor(i / w),
    out = [];
  for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    var nx = x + dx,
      ny = y + dy;
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) out.push(ny * w + nx);
  }
  return out;
}
// 以 seed 決定性生成雷位（同 seed 全員同一盤）
function makeLayout(w, h, mines, seed) {
  var rnd = mulberry32(seed),
    n = w * h,
    idx = [],
    i,
    j,
    t;
  for (i = 0; i < n; i++) idx.push(i);
  for (i = n - 1; i > 0; i--) {
    j = Math.floor(rnd() * (i + 1));
    t = idx[i];
    idx[i] = idx[j];
    idx[j] = t;
  }
  var L = new Array(n).fill(false);
  for (i = 0; i < mines; i++) L[idx[i]] = true;
  return L;
}
function computeNums(w, h, L) {
  var N = new Array(w * h).fill(0),
    i;
  for (i = 0; i < w * h; i++) {
    if (L[i]) {
      N[i] = -1;
      continue;
    }
    var nb = neighborsOf(w, h, i),
      c = 0;
    for (var k = 0; k < nb.length; k++) if (L[nb[k]]) c++;
    N[i] = c;
  }
  return N;
}
// 第一次點擊保護（2026-10-29 使用者定案）：點的格子＋周圍 8 格整圈都不能有雷——把保護圈內的雷
// 依編號序移到圈外「最低編號的非雷格」（圈內格不可當落點）。確定性：全員同 seed＋同首點 → 同結果；競速時各人只影響自己的盤
// 回傳 { layout: 新盤面, moves: [[from, to], ...] }（moves 空陣列＝本來就安全、盤面不變）
function makeFirstSafe(L, w, h, clickIdx, cells) {
  var zone = {};
  zone[clickIdx] = true;
  neighborsOf(w, h, clickIdx).forEach(function (i) {
    zone[i] = true;
  });
  var NL = L.slice(),
    moves = [];
  Object.keys(zone).map(Number).filter(function (i) {
    return NL[i];
  }).sort(function (a, b) {
    return a - b;
  }).forEach(function (from) {
    if (cells && cells[from] === 'L') return; // 禮物鎖定旗標住的雷不搬家：搬走會讓旗子孤兒化標在安全格上——鄰格數字全亂、該格永遠開不了（使用者實機截圖回報）
    NL[from] = false;
    var placed = false;
    for (var i = 0; i < NL.length; i++) {
      if (!zone[i] && !NL[i]) {
        NL[i] = true;
        moves.push([from, i]);
        placed = true;
        break;
      }
    }
    if (!placed) NL[from] = true; // 圈外無空格（本遊戲的雷密度不會發生）：退回原位，不吃掉雷
  });
  return {
    layout: NL,
    moves: moves
  };
}
// 從 from 挖開：回傳 {cells: 新狀態陣列, hit: 踩到的雷 index 或 -1, opened: 本次新開的安全格數}
// cells 狀態：'h' 未開 / 'o' 已開 / 'f' 插旗
function revealFrom(w, h, L, N, cells, from) {
  var NC = cells.slice(),
    opened = 0;
  if (NC[from] !== 'h') return {
    cells: NC,
    hit: -1,
    opened: 0
  };
  if (L[from]) {
    NC[from] = 'o';
    return {
      cells: NC,
      hit: from,
      opened: 0
    };
  }
  var stack = [from];
  while (stack.length) {
    var i = stack.pop();
    if (NC[i] !== 'h' || L[i]) continue;
    NC[i] = 'o';
    opened++;
    if (N[i] === 0) {
      var nb = neighborsOf(w, h, i);
      for (var k = 0; k < nb.length; k++) if (NC[nb[k]] === 'h') stack.push(nb[k]);
    }
  }
  return {
    cells: NC,
    hit: -1,
    opened: opened
  };
}
function countOpened(cells) {
  var c = 0;
  for (var i = 0; i < cells.length; i++) if (cells[i] === 'o') c++;
  return c;
}
// 3BV 加權（v1.50.0 規格報告）：一個數字 0 連通區＋其邊界數字格＝1 單位（洪水一下領滿）、孤立數字格各 1 單位；單位格權重＝1/單位格數，雷格 0
function computeBVWeights(w, h, L, N) {
  var total = w * h,
    unitOf = new Array(total).fill(-1),
    sizes = [];
  for (var s0 = 0; s0 < total; s0++) {
    if (L[s0] || N[s0] !== 0 || unitOf[s0] >= 0) continue;
    var uid = sizes.length,
      cnt = 1,
      q = [s0],
      head = 0;
    unitOf[s0] = uid;
    while (head < q.length) {
      var c = q[head++],
        nb = neighborsOf(w, h, c);
      for (var j = 0; j < nb.length; j++) {
        var m = nb[j];
        if (!L[m] && unitOf[m] < 0) {
          unitOf[m] = uid;
          cnt++;
          if (N[m] === 0) q.push(m);
        }
      }
    }
    sizes.push(cnt);
  }
  for (var i2 = 0; i2 < total; i2++) if (!L[i2] && unitOf[i2] < 0) {
    unitOf[i2] = sizes.length;
    sizes.push(1);
  }
  var weights = new Array(total);
  for (var i3 = 0; i3 < total; i3++) weights[i3] = L[i3] ? 0 : 1 / sizes[unitOf[i3]];
  return {
    weights: weights,
    bv: sizes.length
  };
}
function effProgressOf(cellsArr, weights, bv) {
  if (!bv || !weights) return 0;
  var sm = 0;
  for (var i = 0; i < cellsArr.length; i++) if (cellsArr[i] === 'o') sm += weights[i];
  var e = sm / bv;
  return e > 1 ? 1 : e;
}
// 3BV 驗收帶（v1.65.0 D4，規格 platform-generator-tuning-spec-2026-11-11；帶值＝題目量測實測 P10–P90）：
// 出貨盤以「首擊安全處理後的最終盤面」3BV 驗收；帶外換 seed（seed+k）重生、上限 40 次、達上限取最接近帶的一張（dist 最小）。
// 套用範圍：預設 9×9 與 16×16（每日固定 9×9 比照）；自訂盤面不套（玩家自定參數）。全程確定性：同 seed＋同首點 → 同結果。
var BV_BANDS = {
  9: [10, 22],
  16: [52, 81]
};
function bv3OfLayout(w, h, L) {
  return computeBVWeights(w, h, L, computeNums(w, h, L)).bv;
}
function finalizeFirstClick(w, h, mines, sizeId, seed, L0, clickIdx, cells) {
  var band = BV_BANDS[sizeId] || null;
  var hasLock = false;
  if (cells) {
    for (var li = 0; li < cells.length; li++) if (cells[li] === 'L') {
      hasLock = true;
      break;
    }
  }
  var best = null;
  for (var k = 0; k < 40; k++) {
    if (k > 0 && hasLock) break; // 禮物鎖定旗綁定 L0 的雷位：換 seed 候選盤會讓旗孤兒化（makeFirstSafe 的 L 豁免只對 L0 成立）——有鎖定旗時只准用 L0、3BV 帶讓位（v1.72.0 修：test-mines-items Phase E 種子相依失敗的真因）
    var cand = k === 0 ? L0 : makeLayout(w, h, mines, seed + k >>> 0);
    var fs = makeFirstSafe(cand, w, h, clickIdx, cells);
    var bv = bv3OfLayout(w, h, fs.layout);
    var dist = !band ? 0 : bv < band[0] ? band[0] - bv : bv > band[1] ? bv - band[1] : 0;
    if (!best || dist < best.dist) best = {
      layout: fs.layout,
      moves: fs.moves,
      seedUsed: seed + k >>> 0,
      bv: bv,
      dist: dist,
      tries: k + 1
    };
    if (dist === 0) break;
  }
  return best;
}
function countFlags(cells) {
  var c = 0;
  for (var i = 0; i < cells.length; i++) if (cells[i] === 'f' || cells[i] === 'L' || cells[i] === 'x') c++;
  return c;
} // 'L'＝禮物鎖定旗、'x'＝容錯踩雷格（皆計入旗數/剩餘雷數扣減）

// ---------- 音效已全面收編 PlatAudio（v1.64.1：自有 beep/SFX 引擎刪除；未遷移音效經稽核裁示全數處理完畢） ----------
var NUM_COLORS = {
  1: '#2563eb',
  2: '#16a34a',
  3: '#dc2626',
  4: '#1e3a8a',
  5: '#7f1d1d',
  6: '#0d9488',
  7: '#111827',
  8: '#6b7280'
};
var ACCENT = '#f97316';
var MP_COLORS = ['#E3002B', '#F35B00', '#b58900', '#D7157A', '#007A61', '#87D300', '#00538A', '#008CC1', '#935CB9', '#7A0026'];
function myGameId() {
  var u = sGet('plat_uid_mines');
  if (!u) {
    u = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
    sSet('plat_uid_mines', u);
  }
  return u;
}
function normName(s) {
  return (s || '').trim().toLowerCase();
}
function MinesGame() {
  var isPlat = typeof window !== 'undefined' && !!window.__PLAT_PLATFORM;
  // ---------- 畫面/單機狀態 ----------
  var _useState = useState('home'),
    _useState2 = _slicedToArray(_useState, 2),
    screen = _useState2[0],
    setScreen = _useState2[1]; // home | game
  var _useState3 = useState(false),
    _useState4 = _slicedToArray(_useState3, 2),
    showSaveModal = _useState4[0],
    setShowSaveModal = _useState4[1]; // 存檔/讀檔（v1.42 補齊：比照數獨/數橋代碼式）
  var _useState5 = useState(''),
    _useState6 = _slicedToArray(_useState5, 2),
    saveCode = _useState6[0],
    setSaveCode = _useState6[1];
  var _useState7 = useState(platAudio().isMuted()),
    _useState8 = _slicedToArray(_useState7, 2),
    muted = _useState8[0],
    setMuted = _useState8[1];
  var _useState9 = useState(9),
    _useState10 = _slicedToArray(_useState9, 2),
    sizeId = _useState10[0],
    setSizeId = _useState10[1];
  var _useState11 = useState(null),
    _useState12 = _slicedToArray(_useState11, 2),
    layout = _useState12[0],
    setLayout = _useState12[1]; // bool[] 雷位（目前這一局）
  var _useState13 = useState(null),
    _useState14 = _slicedToArray(_useState13, 2),
    nums = _useState14[0],
    setNums = _useState14[1]; // int[] 鄰雷數（-1=雷）
  var _useState15 = useState(null),
    _useState16 = _slicedToArray(_useState15, 2),
    cells = _useState16[0],
    setCells = _useState16[1]; // 'h'|'o'|'f'
  var _useState17 = useState(null),
    _useState18 = _slicedToArray(_useState17, 2),
    ownArr = _useState18[0],
    setOwnArr = _useState18[1]; // 合作專用：每格由哪位玩家開啟（players 索引，-1=未開）→ 染玩家色算貢獻
  var _useState19 = useState(function () {
      return typeof window !== 'undefined' && window.innerWidth || 390;
    }),
    _useState20 = _slicedToArray(_useState19, 2),
    vpW = _useState20[0],
    setVpW = _useState20[1]; // 視窗寬（盤面響應式放大用）
  var _useState21 = useState(0),
    _useState22 = _slicedToArray(_useState21, 2),
    curSeed = _useState22[0],
    setCurSeed = _useState22[1];
  var _useState23 = useState('ready'),
    _useState24 = _slicedToArray(_useState23, 2),
    status = _useState24[0],
    setStatus = _useState24[1]; // ready | playing | won | lost
  var _useState25 = useState(-1),
    _useState26 = _slicedToArray(_useState25, 2),
    hitIdx = _useState26[0],
    setHitIdx = _useState26[1];
  var _useState27 = useState('dig'),
    _useState28 = _slicedToArray(_useState27, 2),
    inputMode = _useState28[0],
    setInputMode = _useState28[1]; // dig | flag | draw（v1.49.0 塗鴉比照數獨/數橋補上——之前獨缺，使用者指示）
  var _useState29 = useState([]),
    _useState30 = _slicedToArray(_useState29, 2),
    strokes = _useState30[0],
    setStrokes = _useState30[1]; // 塗鴉筆跡 [{id, uid, color, pts:[[x,y],...]}]：座標正規化 x 0..1000、y 0..1000*h/w（縮放/捲動都不跑位）
  var strokesRef = useRef([]);
  var _useState31 = useState('pen'),
    _useState32 = _slicedToArray(_useState31, 2),
    drawTool = _useState32[0],
    setDrawTool = _useState32[1]; // pen | eraser（PlatBar 塗鴉子選單控制，比照數獨 drawSubMode）
  var _useState33 = useState('bv'),
    _useState34 = _slicedToArray(_useState33, 2),
    progMode = _useState34[0],
    setProgMode = _useState34[1]; // 進度顯示：'bv'（3BV，預設）| 'open'（開格 %）；只存 session、不持久化（v1.50.0 規格 5.1）
  var progModeRef = useRef('bv');
  var bvCacheRef = useRef(null); // {layout, weights, bv}：以 layout 陣列參照為 cache key（規格 7.2：不逐開局路徑掛計算）
  var _useState35 = useState(null),
    _useState36 = _slicedToArray(_useState35, 2),
    livePts = _useState36[0],
    setLivePts = _useState36[1]; // 正在畫的這一筆（即時預覽）
  var drawStateRef = useRef(null); // 手勢中的一筆 {pts} 或 {erasing:true}
  var doodleSvgRef = useRef(null);
  var _useState37 = useState(null),
    _useState38 = _slicedToArray(_useState37, 2),
    startedAt = _useState38[0],
    setStartedAt = _useState38[1];
  var _useState39 = useState(0),
    _useState40 = _slicedToArray(_useState39, 2),
    elapsed = _useState40[0],
    setElapsed = _useState40[1];
  var _useState41 = useState(null),
    _useState42 = _slicedToArray(_useState41, 2),
    dailyDate = _useState42[0],
    setDailyDate = _useState42[1]; // 非 null = 每日一題模式（日期字串）
  var _useState43 = useState(todayStr()),
    _useState44 = _slicedToArray(_useState43, 2),
    dailySel = _useState44[0],
    setDailySel = _useState44[1]; // 主畫面每日一題目前選取日期
  var firstRef = useRef(true); // 本局是否還沒挖第一下（首點保護/計時起點）
  var statusRef = useRef('ready');
  statusRef.current = status;
  var lpRef = useRef(null); // 長按計時器（長按插旗）
  var lpPtRef = useRef(null); // 長按起點座標（移動超過容錯取消長按：滑動/捲動不是長按）
  var downPtRef = useRef(null); // v1.56.0 修：漂移判定的按下座標專用——onCellMove 取消長按時會清 lpPtRef，舊版連漂移基準一起清掉，放開時無從判漂移、滑出 40px 也照挖（test-inputfix ③ 抓到）
  var cellTrkRef = useRef(null); // 本次按壓的 PlatTap 實例（每按新建：計時器閉包各 poll 自己那顆，跨按不互擾，v1.63.0）
  var supTrkRef = useRef(null); // 尾隨 click 抑制（PlatTap suppress 500ms、同格 tag——舊 upGuardRef 語意收編）
  var supTrk = function supTrk() {
    if (!supTrkRef.current) supTrkRef.current = platTapNew({
      suppressMs: 500
    });
    return supTrkRef.current;
  };
  var spec = SIZES[sizeId] || SIZES[9];
  var specRef = useRef(spec);
  specRef.current = spec; // 事件處理器讀這份（不吃 setSizeId 的 state 更新時序；自訂盤面不能再用「格數 256 推規格」的舊推斷）
  var totalSafe = spec.w * spec.h - spec.mines;
  var openedSafe = useMemo(function () {
    if (!cells) return 0;
    var c = 0;
    for (var i = 0; i < cells.length; i++) if (cells[i] === 'o' && (!layout || !layout[i])) c++;
    return c;
  }, [cells, layout]); // layout 為 null（合作來賓看不到雷位）時直接數已開格：'o' 恆為安全格，進度才不會恆 0%
  var flagsUsed = useMemo(function () {
    return cells ? countFlags(cells) : 0;
  }, [cells]);
  // ----- 競速道具/禮物狀態（v1.30：僅 race；經濟比照數獨/數橋定版）——必須宣告在 dbgRef 快照之前（快照在 render 期讀這些值，TDZ 會讓整個 root 掛掉） -----
  var _useState45 = useState({
      question: 0,
      backfill: 0,
      gift: 0
    }),
    _useState46 = _slicedToArray(_useState45, 2),
    myItems = _useState46[0],
    setMyItems = _useState46[1];
  var itemsRef = useRef({
    question: 0,
    backfill: 0,
    gift: 0
  });
  var _useState47 = useState({}),
    _useState48 = _slicedToArray(_useState47, 2),
    questionFx = _useState48[0],
    setQuestionFx = _useState48[1]; // idx -> 到期時間戳（問號干擾，本地渲染狀態、不同步）
  var questionFxRef = useRef({});
  var _useState49 = useState(null),
    _useState50 = _slicedToArray(_useState49, 2),
    itemToast = _useState50[0],
    setItemToast = _useState50[1];
  var itemToastTimerRef = useRef(null);
  var _useState51 = useState(0),
    _useState52 = _slicedToArray(_useState51, 2),
    mistLeft = _useState52[0],
    setMistLeft = _useState52[1]; // 競速容錯剩餘次數（顯示用）
  var mistakesRef = useRef(0); // 競速已用掉的容錯次數
  var _useState53 = useState(1),
    _useState54 = _slicedToArray(_useState53, 2),
    zoom = _useState54[0],
    setZoom = _useState54[1];
  var pzRef = useRef(null); // 共用縮放持有（PlatZoom，v1.63.0）：1–2.5、0.25 步進（cleanup2dp 守恆舊 Math.round 淨化）；FLIP 動畫本體不動、僅狀態與上下限收編
  var pz = function pz() {
    if (!pzRef.current) pzRef.current = platZoomNew({
      min: 1,
      max: 2.5,
      value: 1,
      cleanup2dp: true
    });
    return pzRef.current;
  }; // 盤面縮放（比照數獨：1=適應螢幕，展開後 －/＋/適應）——卡片內 🔍 與殼 PlatBar 左下角縮放組共用這一顆 state（單一真相）
  var _useState55 = useState(false),
    _useState56 = _slicedToArray(_useState55, 2),
    zoomOpen = _useState56[0],
    setZoomOpen = _useState56[1];
  // 適應模式循環（2026-11-21 項2：比照數獨/數橋補齊；0=手動 1=適應寬度 2=適應高度 3=自動）。預設手動、地雷 zoom=1 適應基線不變（使用者拍板前不默默改起始行為）
  var _useState57 = useState(0),
    _useState58 = _slicedToArray(_useState57, 2),
    zoomModeIdx = _useState58[0],
    setZoomModeIdx = _useState58[1];
  var zoomModeIdxRef = useRef(0);
  var ZOOM_GLYPHS = ['1X', '↔️', '↕️', '🔲'];
  function recalculateZoom(modeIdx) {
    var el = boardScrollRef.current;
    if (!el) return;
    var natW = spec.w * cellPx + (spec.w - 1) * gapPx + 26; // zoom=1 基線的盤面自然寬高（含盤框 padding/邊框 26，與 colW 同口徑）
    var natH = spec.h * cellPx + (spec.h - 1) * gapPx + 26;
    if (!natW || !natH) return;
    var cs = window.getComputedStyle(el);
    var padL = parseFloat(cs.paddingLeft) || 0,
      padR = parseFloat(cs.paddingRight) || 0,
      padT = parseFloat(cs.paddingTop) || 0;
    var availW = el.clientWidth - padL - padR;
    var cr = el.getBoundingClientRect();
    var visB = window.innerHeight;
    var barEl = platBarRef.current && platBarRef.current.firstElementChild;
    if (barEl) {
      var br = barEl.getBoundingClientRect();
      if (br.height > 0 && br.top > cr.top) visB = Math.min(visB, br.top);
    }
    var availH = visB - cr.top - padT - 4; // 可視下緣（PlatBar 頂）到盤面頂，扣 4px 守衛——同數獨項1修正後算式
    var z = null;
    if (modeIdx === 1) z = availW / natW;else if (modeIdx === 2) z = availH / natH;else if (modeIdx === 3) z = Math.min(availW / natW, availH / natH) * 0.95;
    if (z === null || !isFinite(z)) return;
    z = Math.max(0.3, Math.round(z * 100) / 100);
    pz().setRaw(z);
    setZoom(z);
  }
  function handleCycleZoom() {
    var next = (zoomModeIdxRef.current + 1) % 4;
    zoomModeIdxRef.current = next;
    setZoomModeIdx(next);
    if (next !== 0) {
      setTimeout(function () {
        recalculateZoom(next);
      }, 300);
      setTimeout(function () {
        if (zoomModeIdxRef.current === next) recalculateZoom(next);
      }, 900);
    } // 版面未定時先量會失真→300ms 主算＋900ms 定版重算（同美術燈）
  }
  function stepZoom(d) {
    // 手動步進：切回手動模式；適應值 <1 時下限放寬 0.5 讓使用者能逐步回來（≥1 時維持既有 [1, 2.5]）
    zoomModeIdxRef.current = 0;
    setZoomModeIdx(0);
    var cur = pz().value();
    var nz = Math.min(2.5, Math.max(cur < 1 ? 0.5 : 1, Math.round((cur + d) * 100) / 100));
    pz().setRaw(nz);
    setZoom(nz);
  }
  useEffect(function () {
    // 切換盤面/進對局時，適應模式要重算（手動模式不動）
    if (screen === 'game' && zoomModeIdxRef.current !== 0) {
      var t = setTimeout(function () {
        recalculateZoom(zoomModeIdxRef.current);
      }, 300);
      return function () {
        return clearTimeout(t);
      };
    }
  }, [screen, spec]);
  useEffect(function () {
    if (typeof window === 'undefined') return;
    var onR = function onR() {
      if (zoomModeIdxRef.current !== 0) recalculateZoom(zoomModeIdxRef.current);
    };
    window.addEventListener('resize', onR);
    return function () {
      return window.removeEventListener('resize', onR);
    };
  }, []);
  var _useState59 = useState(function () {
      var c0 = platSave().read('mines_custom_cfg', {
        fallback: null
      });
      if (c0) return clampCustomSpec(c0.w, c0.h, c0.mines);
      return {
        w: 16,
        h: 16,
        mines: 40
      };
    }),
    _useState60 = _slicedToArray(_useState59, 2),
    custCfg = _useState60[0],
    setCustCfg = _useState60[1]; // 單機自訂盤面（寬/高/雷），持久化
  // ---------- 框架層 F2：PlatHome / PlatTopCard 掛載點（殼單一實作、本款只給 config 與內容） ----------
  var platHomeRef = useRef(null);
  var platFrameRef = useRef(null); // PlatFrame 掛載點（v1.71.0：對局外框改殼持有，比照美術燈 v1.70.0）
  var _useState61 = useState(null),
    _useState62 = _slicedToArray(_useState61, 2),
    frameBody = _useState62[0],
    setFrameBody = _useState62[1]; // PlatFrame 內容區節點（盤面/底部列 portal 用）
  var _useState63 = useState(null),
    _useState64 = _slicedToArray(_useState63, 2),
    ptcEl = _useState64[0],
    setPtcEl = _useState64[1]; // PlatTopCard 掛載點＝外框頂區節點
  var _useState65 = useState(null),
    _useState66 = _slicedToArray(_useState65, 2),
    ptcSlot = _useState66[0],
    setPtcSlot = _useState66[1]; // PlatTopCard 遊戲槽節點（portal 用）
  var dailySelRef = useRef(dailySel);
  dailySelRef.current = dailySel;
  var boardScrollRef = useRef(null);
  var boardZoomRef = useRef(null); // F3：縮放 FLIP 過渡的盤面包裝層（盤面＋塗鴉一起縮放）
  var prevZoomRef = useRef(1);
  var prevZoomSpecRef = useRef(''); // 盤面捲動容器（邊緣虛化/自製卷軸指示條依它的捲動量更新）
  var fadeRRef = useRef(null),
    fadeBRef = useRef(null),
    fadeLRef = useRef(null),
    fadeTRef = useRef(null);
  var indVTrackRef = useRef(null),
    indHTrackRef = useRef(null),
    indVRef = useRef(null),
    indHRef = useRef(null);
  var giftCreditRef = useRef(0); // 禮物額度（正確插旗 +0.5，滿 1 送弱者）
  var creditedMinesRef = useRef({}); // 已計入額度的雷格（防拔插重刷）
  var milestoneRef = useRef(0); // 已通報的里程碑段數（每 5% 一段，只增不減——被回填打回去也不重報）
  var lastOneDoneRef = useRef(false); // 最後一位轉換只做一次
  var autoItemIvRef = useRef(null);
  var autoGiftIvRef = useRef(null);
  function itemSay(msg) {
    if (typeof window !== 'undefined' && window.__PLAT_TOAST) {
      window.__PLAT_TOAST(msg);
      return;
    }
    setItemToast(msg);
    if (itemToastTimerRef.current) clearTimeout(itemToastTimerRef.current);
    itemToastTimerRef.current = setTimeout(function () {
      return setItemToast(null);
    }, 3400);
  } // 平台內統一走殼 toast（美學稽核 V-07：三款一式）；獨立版才用本地 pill
  // ---------- 塗鴉（v1.49.0，比照數獨/數橋）：合作模式同步共享（溝通畫圖）、競速/錦標賽/單機只留本地（防偷看） ----------
  function myStrokeColor() {
    var me = playersRef.current.find(function (pp) {
      return pp.id === myId;
    });
    if (me && me.color) return me.color === 'rainbow' ? '#e879f9' : me.color;
    return '#f97316';
  }
  function doodleSync(msg) {
    if (!(mpRef.current.on && mpRef.current.mode === 'coop')) return;
    if (mpRef.current.isHost) hostBroadcast(msg);else mpSend(msg);
  }
  function setStrokesBoth(ns) {
    strokesRef.current = ns;
    setStrokes(ns);
  }
  function addStroke(pts) {
    if (!pts || !pts.length) return;
    var pp = pts.length === 1 ? [pts[0], pts[0]] : pts;
    var st = {
      id: Date.now() + '-' + myId,
      uid: myId,
      color: myStrokeColor(),
      pts: pp
    };
    setStrokesBoth(strokesRef.current.concat([st]));
    doodleSync({
      type: 'MINE_DOODLE',
      op: 'add',
      uid: myId,
      stroke: st
    });
  }
  function clearOwnStrokes() {
    var ns = strokesRef.current.filter(function (sv) {
      return sv.uid !== myId;
    });
    if (ns.length === strokesRef.current.length) return;
    setStrokesBoth(ns);
    doodleSync({
      type: 'MINE_DOODLE',
      op: 'clearUid',
      uid: myId
    });
    itemSay('🗑️ 已清除你所有的塗鴉');
  }
  function clearAllStrokes() {
    if (!strokesRef.current.length) return;
    setStrokesBoth([]);
    doodleSync({
      type: 'MINE_DOODLE',
      op: 'clearAll',
      uid: myId
    });
    itemSay('🗑️ 已清空塗鴉');
  }
  function applyDoodleMsg(m) {
    if (m.op === 'add' && m.stroke && m.stroke.pts) setStrokesBoth(strokesRef.current.concat([m.stroke]));else if (m.op === 'clearUid') setStrokesBoth(strokesRef.current.filter(function (sv) {
      return sv.uid !== m.uid;
    }));else if (m.op === 'clearAll') setStrokesBoth([]);else if (m.op === 'erase' && m.ids) setStrokesBoth(strokesRef.current.filter(function (sv) {
      return m.ids.indexOf(sv.id) < 0;
    }));
  }
  function doodlePoint(e) {
    var el = doodleSvgRef.current;
    if (!el) return null;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    var sp = specRef.current || SIZES[9];
    var vbH = 1000 * sp.h / sp.w;
    return {
      x: Math.round((e.clientX - r.left) / r.width * 1000 * 10) / 10,
      y: Math.round((e.clientY - r.top) / r.height * vbH * 10) / 10
    };
  }
  function eraseAtDoodle(p) {
    var removed = [];
    var ns = strokesRef.current.filter(function (sv) {
      if (sv.uid !== myId) return true;
      for (var i = 0; i < sv.pts.length; i++) {
        if (Math.hypot(sv.pts[i][0] - p.x, sv.pts[i][1] - p.y) < 26) {
          removed.push(sv.id);
          return false;
        }
      }
      return true;
    });
    if (removed.length) {
      setStrokesBoth(ns);
      doodleSync({
        type: 'MINE_DOODLE',
        op: 'erase',
        uid: myId,
        ids: removed
      });
    }
  }
  function onDoodleDown(e) {
    if (inputMode !== 'draw') return;
    if (statusRef.current === 'won' || statusRef.current === 'lost') return;
    if (mpRef.current.on && iAmSpecRef.current) return;
    if (e && e.preventDefault) e.preventDefault();
    var p = doodlePoint(e);
    if (!p) return;
    if (drawTool === 'eraser') {
      eraseAtDoodle(p);
      drawStateRef.current = {
        erasing: true
      };
    } else {
      drawStateRef.current = {
        pts: [[p.x, p.y]]
      };
      setLivePts([[p.x, p.y]]);
    }
    if (e.target && e.target.setPointerCapture && e.pointerId != null) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
  }
  function onDoodleMove(e) {
    var ds = drawStateRef.current;
    if (!ds) return;
    var p = doodlePoint(e);
    if (!p) return;
    if (ds.erasing) {
      eraseAtDoodle(p);
      return;
    }
    var last = ds.pts[ds.pts.length - 1];
    if (Math.hypot(p.x - last[0], p.y - last[1]) >= 6) {
      ds.pts.push([p.x, p.y]);
      setLivePts(ds.pts.slice());
    }
  }
  function onDoodleUp() {
    var ds = drawStateRef.current;
    drawStateRef.current = null;
    setLivePts(null);
    if (ds && ds.pts && ds.pts.length) addStroke(ds.pts);
  }
  function resetItems() {
    itemsRef.current = {
      question: 0,
      backfill: 0,
      gift: 0
    };
    setMyItems({
      question: 0,
      backfill: 0,
      gift: 0
    });
    questionFxRef.current = {};
    setQuestionFx({});
    giftCreditRef.current = 0;
    creditedMinesRef.current = {};
    milestoneRef.current = 0;
    lastOneDoneRef.current = false;
    if (autoItemIvRef.current) {
      clearInterval(autoItemIvRef.current);
      autoItemIvRef.current = null;
    }
    if (autoGiftIvRef.current) {
      clearInterval(autoGiftIvRef.current);
      autoGiftIvRef.current = null;
    }
  }
  var progress = totalSafe ? openedSafe / totalSafe : 0;
  var bvDisp = layout && cells ? bvOfLayout(layout, nums) : null; // 合作來賓無 layout → null → eff fallback 開格（規格 5.3 註記）
  var effProg = bvDisp ? effProgressOf(cells, bvDisp.weights, bvDisp.bv) : progress;
  var dbgRef = useRef(null); // 唯讀狀態快照（測試/除錯用，掛在 hooks.debug）
  dbgRef.current = {
    layout: layout,
    cells: cells,
    nums: nums,
    owners: ownArr,
    status: status,
    sizeId: sizeId,
    progress: progress,
    openedSafe: openedSafe,
    seed: curSeed,
    screen: screen,
    items: {
      question: myItems.question,
      backfill: myItems.backfill,
      gift: myItems.gift
    },
    strokes: strokes.length,
    inputMode: inputMode,
    effProgress: effProg,
    bv: bvDisp ? bvDisp.bv : 0,
    progMode: progMode,
    giftCredit: giftCreditRef.current,
    qfx: questionFx,
    milestones: milestoneRef.current,
    mistakes: mistakesRef.current,
    mistLeft: mistLeft,
    zoom: zoom
  };
  useEffect(function () {
    if (typeof window === 'undefined') return;
    var f = function f() {
      return setVpW(window.innerWidth || 390);
    };
    window.addEventListener('resize', f);
    return function () {
      return window.removeEventListener('resize', f);
    };
  }, []);
  // ---------- 計時 ----------
  useEffect(function () {
    if (!startedAt) return;
    if (status !== 'playing' && !(mpRef.current.on && mpPhase === 'playing')) return; // 多人：首點前 status 還停在 ready，計時靠 mpPhase 驅動
    var iv = setInterval(function () {
      return setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return function () {
      return clearInterval(iv);
    };
  }, [status, startedAt, mpPhase]);
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

  // ---------- 開局 ----------
  function newGame(szId, seed, daily) {
    if (typeof window !== 'undefined' && window.PlatTopCard) window.PlatTopCard.setRulesOpen(true); // 單機/每日開始：標頭規則面板展開（比照數獨）
    var sp = SIZES[szId] || SIZES[9];
    var sd = seed != null ? seed : Math.random() * 4294967296 >>> 0;
    var L = makeLayout(sp.w, sp.h, sp.mines, sd);
    setSizeId(sp.id);
    setCurSeed(sd);
    setLayout(L);
    setNums(computeNums(sp.w, sp.h, L));
    setCells(new Array(sp.w * sp.h).fill('h'));
    mistakesRef.current = 0;
    setMistLeft(Math.floor(sp.mines / 10)); // 容錯重置（v1.49.0 單機/每日也有愛心）
    setStrokesBoth([]); // 新局清塗鴉（比照數獨/數橋開局 strokes 清空）
    setStatus('ready');
    statusRef.current = 'ready';
    setHitIdx(-1);
    setInputMode('dig');
    setStartedAt(null);
    setElapsed(0);
    setDailyDate(daily || null);
    firstRef.current = true;
    setScreen('game');
  }

  // 挖一格（含首點保護、和弦、勝負判定）——單機與多人共用核心
  function doReveal(from, baseCells, baseLayout, baseNums) {
    var sp = specRef.current; // 目前盤面規格（含自訂）：舊版用格數 256/81 推斷，自訂尺寸會推錯，改讀 render 期同步的 specRef
    var L = baseLayout,
      N = baseNums,
      C = baseCells;
    if (firstRef.current) {
      var seedBase = mpRef.current.on ? mpRef.current.seed || 0 : curSeed;
      var fin = finalizeFirstClick(sp.w, sp.h, sp.mines, sp.id, seedBase, L, from, baseCells);
      if (fin.tries > 1 || fin.moves.length) {
        L = fin.layout;
        N = computeNums(sp.w, sp.h, L);
        setLayout(L);
        setNums(N);
        if (!mpRef.current.on && fin.seedUsed !== curSeed >>> 0) setCurSeed(fin.seedUsed);
      }
      firstRef.current = false;
      if (!mpRef.current.on) {
        setStartedAt(Date.now());
        startedAtRef.current = Date.now();
      } // 多人：計時起點是 MINE_START 的 startAt（setupBoardFromSeed 已設定）
      setStatus('playing');
      statusRef.current = 'playing';
    }
    var r = revealFrom(sp.w, sp.h, L, N, C, from);
    if (r.hit >= 0) {
      // 容錯（使用者定案：容錯次數＝雷數 10%，10 雷 1 次、40 雷 4 次）：額度內踩雷不算出局——
      // 照樣引爆，但那格改記 'x'（✗、確認是雷），玩家續玩；和弦與旗數都把 'x' 當已知雷。全模式適用（v1.49.0 起單機/每日/合作比照競速；合作走 processCoopAct 的共用額度）。
      var allow = mistakeAllowance();
      if (allow > 0 && !outcomeRef.current && mistakesRef.current < allow) {
        mistakesRef.current += 1;
        var xc = r.cells.slice();
        xc[r.hit] = 'x';
        setCells(xc);
        setMistLeft(allow - mistakesRef.current);
        platAudio().play('boom');
        itemSay('💥 踩到雷！這格記 ✗——愛心還剩 ' + (allow - mistakesRef.current + 1) + ' 顆');
        return {
          hit: -1,
          cells: xc,
          layout: L,
          nums: N,
          forgiven: r.hit
        };
      }
      setCells(r.cells);
      setHitIdx(r.hit);
      setStatus('lost');
      statusRef.current = 'lost';
      platAudio().play('boom');
      return {
        hit: r.hit,
        cells: r.cells,
        layout: L,
        nums: N
      };
    }
    if (r.opened > 0) platAudio().play('place'); // 挖開＝place
    setCells(r.cells);
    var opened = 0;
    for (var i = 0; i < r.cells.length; i++) if (r.cells[i] === 'o' && !L[i]) opened++;
    if (opened >= sp.w * sp.h - sp.mines) {
      setStatus('won');
      statusRef.current = 'won';
      platAudio().play('complete'); // 個人完賽＝complete
      if (!mpRef.current.on) onSoloWin(); // 多人場不寫單機最佳紀錄（競速由 afterRaceAction 處理）
    }
    return {
      hit: -1,
      cells: r.cells,
      layout: L,
      nums: N
    };
  }
  function onSoloWin() {
    var t = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : elapsed;
    if (dailyDate) {
      // 每日一題：完成才寫該日最佳；連勝只有今天的題目會動（回補不影響）
      var rec = readDailyRecords();
      if (rec[dailyDate] == null || t < rec[dailyDate]) {
        rec[dailyDate] = t;
        platSave().write('mines_daily_records', rec);
      }
      if (dailyDate === todayStr()) {
        var st = readDailyStreak();
        if (st.last === dailyDate) {/* 同日重玩不重複計 */} else if (st.last === shiftDate(dailyDate, -1)) platSave().write('mines_daily_streak', {
          last: dailyDate,
          count: (st.count || 0) + 1
        });else platSave().write('mines_daily_streak', {
          last: dailyDate,
          count: 1
        });
      }
      return;
    }
    var spk = specRef.current;
    var key = 'mines_best_' + (sizeId === 'custom' ? 'c' + spk.w + 'x' + spk.h + '_' + spk.mines : sizeId); // 自訂盤最佳紀錄依形狀分開存，不同形狀不互相覆蓋
    var prev = parseInt(platSave().getStr(key, '0'), 10);
    if (!prev || t < prev) platSave().setStr(key, String(t));
  }
  function startDaily(ds) {
    newGame(9, dailySeed(ds), ds);
  }

  // ---------- 存檔/讀檔（比照數獨/數橋：進度代碼產生＋貼上還原，v1.42 補齊 Q1） ----------
  function handleSaveCode() {
    if (!layout || !cells) return;
    if (status !== 'ready' && status !== 'playing') {
      itemSay('⚠️ 這局已結束，不能存檔');
      return;
    }
    var sp = specRef.current;
    var data = {
      g: 'mines',
      v: 1,
      sz: sizeId,
      seed: curSeed,
      lay: layout.map(function (b) {
        return b ? '1' : '0';
      }).join(''),
      cells: cells.join(''),
      t: elapsed,
      daily: dailyDate || null
    };
    if (sizeId === 'custom') data.cust = {
      w: sp.w,
      h: sp.h,
      mines: sp.mines
    };
    try {
      var code = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      setSaveCode(code);
      var ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        itemSay('✅ 已產生並複製代碼！');
      } catch (e) {}
      document.body.removeChild(ta);
    } catch (e) {
      itemSay('❌ 產生代碼失敗');
    }
  }
  function handleQuickPaste() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function (text) {
          if (text) {
            setSaveCode(text);
            itemSay('✅ 貼上成功！');
          }
        })["catch"](function () {
          var t2 = document.getElementById('saveCodeTextarea');
          if (t2) t2.focus();
          itemSay('⚠️ 瀏覽器阻擋自動貼上，請手動貼上');
        });
      } else throw new Error();
    } catch (e) {
      var t3 = document.getElementById('saveCodeTextarea');
      if (t3) t3.focus();
      itemSay('⚠️ 瀏覽器阻擋自動貼上，請手動貼上');
    }
  }
  function handleLoadCode() {
    if (!saveCode.trim()) return itemSay('⚠️ 請先貼上代碼');
    try {
      var data = JSON.parse(decodeURIComponent(escape(atob(saveCode.trim()))));
      if (!data || data.g !== 'mines') throw new Error('bad');
      var sp;
      if (data.sz === 'custom') {
        if (!data.cust) throw new Error('bad');
        sp = regCustomSpec(data.cust);
      } else sp = SIZES[data.sz];
      if (!sp) throw new Error('bad');
      var n = sp.w * sp.h;
      if (typeof data.lay !== 'string' || data.lay.length !== n || typeof data.cells !== 'string' || data.cells.length !== n) throw new Error('bad');
      var L = [],
        opened = 0,
        mc = 0;
      for (var i = 0; i < n; i++) {
        var isM = data.lay[i] === '1';
        L.push(isM);
        if (isM) mc++;
        var ch = data.cells[i];
        if ('hofx'.indexOf(ch) < 0) throw new Error('bad'); // x＝容錯記號（v1.49.0 單機也有容錯後補上）
        if (ch === 'o') opened++;
      }
      if (mc !== sp.mines) throw new Error('bad');
      setSizeId(sp.id);
      setCurSeed((data.seed || 0) >>> 0);
      setLayout(L);
      setNums(computeNums(sp.w, sp.h, L));
      setCells(data.cells.split(''));
      var mistLd = 0;
      for (var mi2 = 0; mi2 < n; mi2++) if (data.cells[mi2] === 'x') mistLd++;
      mistakesRef.current = mistLd;
      setMistLeft(Math.max(0, Math.floor(sp.mines / 10) - mistLd)); // 載入代碼：容錯用量照盤面 ✗ 數還原
      var st = opened > 0 ? 'playing' : 'ready';
      setStatus(st);
      statusRef.current = st;
      firstRef.current = opened === 0;
      setHitIdx(-1);
      setInputMode('dig');
      setElapsed(data.t || 0);
      if (opened > 0) {
        var base = Date.now() - (data.t || 0) * 1000;
        setStartedAt(base);
        startedAtRef.current = base;
      } else {
        setStartedAt(null);
        startedAtRef.current = null;
      }
      setDailyDate(data.daily || null);
      setShowSaveModal(false);
      setScreen('game');
      itemSay('✅ 進度載入成功！');
    } catch (e) {
      itemSay('❌ 無效的進度代碼');
    }
  }
  function startCustom(vals) {
    // 單機自訂盤面：clamp→持久化→註冊規格→以 sizeId 'custom' 開局（與預設盤走同一條 newGame 路徑）；vals 可由 PlatSetup 自訂欄位帶入
    var src = vals || custCfg;
    var cl = clampCustomSpec(src.w, src.h, src.mines);
    setCustCfg(cl);
    platSave().write('mines_custom_cfg', cl);
    regCustomSpec(cl);
    newGame('custom');
  }
  function chord(idx) {
    if (!layout || !cells || nums[idx] <= 0) return;
    var sp = specRef.current,
      nb = neighborsOf(sp.w, sp.h, idx),
      f = 0,
      i;
    for (i = 0; i < nb.length; i++) if (cells[nb[i]] === 'f' || cells[nb[i]] === 'L' || cells[nb[i]] === 'x') f++; // 鎖定旗與容錯 ✗ 也算已知雷（和弦判定）
    if (f !== nums[idx]) return;
    var C = cells,
      L = layout,
      N = nums,
      last = {
        cells: C,
        layout: L,
        nums: N
      };
    for (i = 0; i < nb.length; i++) {
      var t = nb[i];
      if (C[t] !== 'h') continue;
      var r = doReveal(t, C, L, N);
      C = r.cells;
      L = r.layout;
      N = r.nums;
      last = r;
      if (r.hit >= 0) return last;
      if (statusRef.current === 'won') return last;
    }
    return last;
  }
  function mpSendAct(kind, idx) {
    // 合作動作：房主自己走定序佇列，來賓送給房主
    if (mpRef.current.isHost) {
      var pl = myPlayer();
      processCoopAct(kind, idx, myId, pl ? pl.name : '');
    } else mpSend({
      type: 'MINE_ACT',
      uid: myId,
      kind: kind,
      idx: idx
    });
  }
  function toggleFlag(idx) {
    if (mpRef.current.on) {
      if (mpRef.current.phase !== 'playing' || iAmSpecRef.current) return;
      if (mpRef.current.mode === 'coop') {
        if (status !== 'won' && status !== 'lost') mpSendAct('flag', idx);
        return;
      }
      if (!cells || outcomeRef.current || cells[idx] === 'o' || cells[idx] === 'L' || cells[idx] === 'x') return; // 'L' 禮物鎖定旗不可拔、'x' 容錯踩雷格已定案不可動
      var NC2 = cells.slice();
      NC2[idx] = NC2[idx] === 'f' ? 'h' : 'f';
      if (NC2[idx] === 'f' && layout && layout[idx] && mpRef.current.itemsAllow && !creditedMinesRef.current[idx]) {
        creditedMinesRef.current[idx] = 1;
        giftCreditRef.current += 0.5;
        trySendGift();
      } // 正確插旗 +0.5 禮物額度（同一顆雷只計一次）
      setCells(NC2); // 插旗/拔旗不播（規格明定，v1.64.0）
      raceSendState(NC2, nums, layout, false);
      return;
    }
    if (!cells || status !== 'ready' && status !== 'playing') return;
    if (cells[idx] === 'o') return;
    var NC = cells.slice();
    NC[idx] = NC[idx] === 'f' ? 'h' : 'f';
    setCells(NC); // 插旗/拔旗不播（規格明定，v1.64.0）
  }
  function onCellAction(idx) {
    if (lpFiredRef.current) {
      lpFiredRef.current = false;
      return;
    } // 這次 click 是長按插旗的尾巴
    // （舊「click 落點≠按下格」lc 守衛已移除：onCellUp 結算前即清空 lpCellRef、此處永遠讀到 null 的死碼——跨格尾隨 click 由 onCellUp 的全域抑制窗處理，v1.66.1）
    if (mpRef.current.on) {
      if (mpRef.current.phase !== 'playing' || iAmSpecRef.current || !cells) return;
      if (mpRef.current.mode === 'coop') {
        if (status === 'won' || status === 'lost') return;
        if (inputMode === 'flag' && cells[idx] !== 'o') {
          mpSendAct('flag', idx);
          return;
        } // 插旗模式點已開的數字格：照樣和弦揭露（使用者 2026-10-30 指示，三路徑同規）
        if (cells[idx] === 'f') return;
        if (cells[idx] === 'o') {
          // 合作和弦：把鄰格挖開拆成單格動作依序送出（房主定序，踩雷後後續的會被擋下）
          if (!nums || nums[idx] <= 0) return;
          var sp2 = specRef.current,
            nb2 = neighborsOf(sp2.w, sp2.h, idx),
            f2 = 0,
            j2;
          for (j2 = 0; j2 < nb2.length; j2++) if (cells[nb2[j2]] === 'f' || cells[nb2[j2]] === 'L' || cells[nb2[j2]] === 'x') f2++; // 對齊單機/競速 chord：鎖定旗與容錯 ✗ 也算已知雷（v1.66.1）
          if (f2 !== nums[idx]) return;
          for (j2 = 0; j2 < nb2.length; j2++) if (cells[nb2[j2]] === 'h') mpSendAct('reveal', nb2[j2]);
          return;
        }
        mpSendAct('reveal', idx);
        return;
      }
      // 競速：本地盤面 + 廣播
      if (outcomeRef.current || status === 'won' || status === 'lost') return;
      if (inputMode === 'flag' && cells[idx] !== 'o') {
        toggleFlag(idx);
        return;
      } // 插旗模式點已開格 → 下方 chord 揭露
      if (cells[idx] === 'f' || cells[idx] === 'L') return;
      var res = cells[idx] === 'o' ? chord(idx) : doReveal(idx, cells, layout, nums);
      if (res) afterRaceAction(res.cells, res.nums, res.layout);
      return;
    }
    if (!cells || status === 'won' || status === 'lost') return;
    if (inputMode === 'flag' && cells[idx] !== 'o') {
      toggleFlag(idx);
      return;
    } // 插旗模式點已開格 → 下方 chord 揭露
    if (cells[idx] === 'f' || cells[idx] === 'L') return;
    if (cells[idx] === 'o') {
      chord(idx);
      return;
    }
    doReveal(idx, cells, layout, nums);
  }
  var lpFiredRef = useRef(false); // 長按已觸發插旗時，隨後的 pointerup/click 不能再挖
  var lpCellRef = useRef(null); // 本次按壓的起點格 {idx, t}：動作一律對「按下時的那一格」執行
  var upGuardRef = useRef(null); // pointerup 已執行過的那一下 {idx, t}：擋掉緊接著的 click 重複觸發；鍵盤 click 沒有 pointer 前置、不在此列（放行）
  var lpLeftRef = useRef(false); // 按壓途中曾滑出起點格（滑鼠路徑）：之後若在「別格」放開＝取消（滑出去再回來原格放開則照常）；觸控有 implicit capture，leave 在 up 之後、不受影響
  var TAP_DRIFT_PX = 22; // 放開點離按壓點的容許漂移：手指抬起本來就會滾動數 px、小格子更明顯，22px 內仍算同一個點按；超過視為捲動/滑開 → 整下取消
  // v1.54.2 輸入管線改版（使用者實機回報：按下去按鈕有反應、卻常常不插旗/不打開/數字不和弦，像累格）：
  // 舊版動作只靠 click 觸發——手指抬起時只要滾到鄰格，瀏覽器就把 click 發給鄰格或共同祖先（整下消失），
  // 或被「click 落點≠按下格就忽略」的防滑檢查吞掉；按下時的壓感動畫卻照樣播，才會「有反應、沒動作」。
  // 改成 pointerup 就在按下那格執行（漂移 22px 內照算），click 退居鍵盤/程式觸發的備援並用 upGuard 防重複。
  function onCellDown(idx, e) {
    if (lpRef.current) clearTimeout(lpRef.current);
    lpFiredRef.current = false;
    lpLeftRef.current = false;
    lpCellRef.current = {
      idx: idx,
      t: Date.now()
    };
    lpPtRef.current = e && typeof e.clientX === 'number' ? {
      x: e.clientX,
      y: e.clientY
    } : null;
    downPtRef.current = lpPtRef.current;
    var cellTrk = platTapNew({
      slop: TAP_DRIFT_PX,
      longpressMs: 500
    });
    if (lpPtRef.current) cellTrk.down(lpPtRef.current.x, lpPtRef.current.y, Date.now());
    cellTrkRef.current = cellTrk;
    // 已定案的格（已開數字、容錯 ✗、禮物鎖定旗）不需要長按插旗計時器：不起計時器，按住數字想事情不會有任何副作用
    if (!cells || cells[idx] === 'o' || cells[idx] === 'x' || cells[idx] === 'L') return;
    // 500ms 與數獨的長按清除一致（舊 380ms 太短：稍用力、稍慢的一般點按就被誤判成長按插旗——誤觸主因之一）
    lpRef.current = setTimeout(function () {
      if (cellTrk.poll(Date.now()) !== 'longpress') return;
      lpRef.current = null;
      lpPtRef.current = null;
      lpFiredRef.current = true;
      toggleFlag(idx);
    }, 500); // 共用判定：到時才算長按、只觸發一次（PlatTap，v1.63.0）
  }
  function onCellMove(e) {
    // 防誤觸：按住後移動超過 TAP_DRIFT_PX（想捲動頁面）就取消長按判定——舊版 10px 太嚴：手指自然抖動就把長按照消，
    // 放開後只剩 click 路徑、又被漂移檢查吞掉（v1.54.2 與 pointerup 容許漂移統一為 22px）。漂移基準讀 downPtRef、且不清它（放開時還要用）。
    if (!lpRef.current || !e || typeof e.clientX !== 'number') return;
    var mvTrk = cellTrkRef.current;
    if (!mvTrk || !mvTrk.active()) return; // 無座標起手（downPtRef 為空的舊路徑）同舊版直接返回
    if (mvTrk.move(e.clientX, e.clientY).dragging) {
      clearTimeout(lpRef.current);
      lpRef.current = null;
      lpPtRef.current = null;
    }
  }
  function onCellUp(e, commit) {
    var fired = lpFiredRef.current; // 長按已插旗：這次放開不再挖（lpFiredRef 留給隨後的 click 做最後一道吞嚥）
    if (lpRef.current) {
      clearTimeout(lpRef.current);
      lpRef.current = null;
    }
    if (!commit) {
      lpLeftRef.current = true;
      return;
    } // pointerleave：只停長按計時＋記下曾滑出；tracker 不結算（等真正的 up/cancel）
    var lc = lpCellRef.current;
    lpCellRef.current = null;
    var leftOut = lpLeftRef.current;
    lpLeftRef.current = false;
    if (leftOut && e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.cell != null && Number(e.currentTarget.dataset.cell) !== (lc && lc.idx)) {
      if (cellTrkRef.current) {
        cellTrkRef.current.cancel();
        cellTrkRef.current = null;
      }
      return;
    } // 滑出起點格又在別格放開（滑鼠式取消）
    downPtRef.current = null;
    lpPtRef.current = null;
    if (fired || !lc) {
      if (cellTrkRef.current) {
        cellTrkRef.current.cancel();
        cellTrkRef.current = null;
      }
      return;
    }
    // 點按判定收編 PlatTap（v1.63.0，守恆 v1.54.2/v1.56.0 語意）：漂移 ≤22 對按下那格執行、超過＝捲動意圖整下取消；無座標起手（tracker 未啟動）比照舊版 pt 為空直接放行
    var upTrk = cellTrkRef.current;
    cellTrkRef.current = null;
    if (upTrk && upTrk.active() && e && typeof e.clientX === 'number') {
      var res = upTrk.up(e.clientX, e.clientY, Date.now());
      if (res.type !== 'tap') return;
    } else if (upTrk) upTrk.cancel();
    supTrk().markSuppress(Date.now()); // 不帶 tag（v1.66.1）：放開點偏進鄰格時尾隨 click 落在別格也要吞——帶 tag 只吞同格，跨格 click 會對旗子格再執行一次完整動作（拔旗/誤挖）；比照數獨全域窗
    onCellAction(lc.idx);
  }
  function onCellCancel() {
    if (lpRef.current) {
      clearTimeout(lpRef.current);
      lpRef.current = null;
    }
    lpPtRef.current = null;
    downPtRef.current = null;
    lpCellRef.current = null;
    if (cellTrkRef.current) {
      cellTrkRef.current.cancel();
      cellTrkRef.current = null;
    }
  } // pointercancel：瀏覽器接管手勢（捲動）→ 整下作廢；tracker 只清本次、不污染下次基準
  function onCellClick(idx) {
    if (supTrk().shouldSuppressClick(Date.now(), idx)) {
      supTrk().clearSuppress();
      return;
    } // pointerup 已做完這一下，click 是尾巴（一次性吞嚥，舊 upGuard 語意）
    onCellAction(idx);
  }

  // ---------- 多人（平台模式）：星型拓撲（來賓只連房主、房主轉發全場） ----------
  var myId = myGameId();
  var _useState67 = useState(false),
    _useState68 = _slicedToArray(_useState67, 2),
    mpOn = _useState68[0],
    setMpOn = _useState68[1];
  var _useState69 = useState('off'),
    _useState70 = _slicedToArray(_useState69, 2),
    mpPhase = _useState70[0],
    setMpPhase = _useState70[1]; // off|waiting|countdown|playing|done
  var _useState71 = useState([]),
    _useState72 = _slicedToArray(_useState71, 2),
    players = _useState72[0],
    setPlayers = _useState72[1];
  var _useState73 = useState(false),
    _useState74 = _slicedToArray(_useState73, 2),
    myReadySt = _useState74[0],
    setMyReadySt = _useState74[1];
  var _useState75 = useState({}),
    _useState76 = _slicedToArray(_useState75, 2),
    godBoards = _useState76[0],
    setGodBoards = _useState76[1];
  var _useState77 = useState(null),
    _useState78 = _slicedToArray(_useState77, 2),
    godUid = _useState78[0],
    setGodUid = _useState78[1];
  var _useState79 = useState(null),
    _useState80 = _slicedToArray(_useState79, 2),
    raceFinal = _useState80[0],
    setRaceFinal = _useState80[1];
  useEffect(function () {
    if (raceFinal && raceFinal.winnerUid && raceFinal.winnerUid === myId) {
      try {
        platAudio().play('win');
      } catch (e) {}
    }
  }, [raceFinal]); // 競速奪冠＝win（PlatAudio，v1.64.0）
  var _useState81 = useState(null),
    _useState82 = _slicedToArray(_useState81, 2),
    myOutcome = _useState82[0],
    setMyOutcome = _useState82[1]; // 'finished'|'boom'
  var _useState83 = useState(false),
    _useState84 = _slicedToArray(_useState83, 2),
    leaveArm = _useState84[0],
    setLeaveArm = _useState84[1];
  // 離開選單與標頭規則開合已收編殼 PlatTopCard/PlatLeaveMenu（框架層 F2）：規則預設開合以 PlatTopCard.setRulesOpen 設定（單機/每日展開、多人收合）
  var _useState85 = useState(''),
    _useState86 = _slicedToArray(_useState85, 2),
    coopBoomBy = _useState86[0],
    setCoopBoomBy = _useState86[1];
  var _useState87 = useState(null),
    _useState88 = _slicedToArray(_useState87, 2),
    cdNum = _useState88[0],
    setCdNum = _useState88[1];
  var _useState89 = useState(0),
    _useState90 = _slicedToArray(_useState89, 2),
    waitTick = _useState90[0],
    setWaitTick = _useState90[1];
  var mpRef = useRef({
    on: false,
    isHost: false,
    mode: 'coop',
    tourn: false,
    hub: false,
    code: '',
    sizeId: 9,
    custom: null,
    seed: 0,
    startAt: 0,
    phase: 'off'
  });
  var playersRef = useRef([]);
  var peerRef = useRef(null),
    connsRef = useRef([]),
    hostConnRef = useRef(null);
  var godRef = useRef({}),
    outcomeRef = useRef(null),
    finalRef = useRef(null);
  var boardRef = useRef({
    layout: null,
    nums: null,
    cells: null,
    owners: null
  });
  var waitSinceRef = useRef(0),
    autoIvRef = useRef(null),
    cdIvRef = useRef(null);
  var stateAtRef = useRef(0),
    lastProgRef = useRef(-1),
    dismissRef = useRef(null);
  var stateArgsRef = useRef(null),
    stateTrailRef = useRef(null); // MINE_STATE 節流的尾隨補送（純插旗不改 progress，沒補送對手永遠看不到最後一支旗）
  var startedAtRef = useRef(null),
    myReadyRef = useRef(false),
    leaveArmTimerRef = useRef(null);
  var iAmSpecRef = useRef(false);
  function setPlayersBoth(p) {
    playersRef.current = p;
    setPlayers(p);
  }
  function myPlayer() {
    return playersRef.current.find(function (p) {
      return p.id === myId;
    }) || null;
  }
  function iAmSpec() {
    var p = myPlayer();
    return !!(p && p.spectator);
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
    // 來賓→房主；房主→全場
    if (mpRef.current.isHost) hostBroadcast(msg);else if (hostConnRef.current && hostConnRef.current.open) {
      try {
        hostConnRef.current.send(msg);
      } catch (e) {}
    }
  }
  function godSet(uid, patch) {
    var cur = godRef.current[uid] || {
      progress: 0,
      state: 'playing',
      cells: '',
      nums: {}
    };
    godRef.current = Object.assign({}, godRef.current, _defineProperty({}, uid, Object.assign({}, cur, patch)));
    setGodBoards(godRef.current);
  }
  function openedSafeOf(cellsArr, layoutArr) {
    var c = 0;
    if (!cellsArr || !layoutArr) return 0;
    for (var i = 0; i < cellsArr.length; i++) if (cellsArr[i] === 'o' && !layoutArr[i]) c++;
    return c;
  }
  function cleanupMp() {
    if (autoIvRef.current) {
      clearInterval(autoIvRef.current);
      autoIvRef.current = null;
    }
    if (cdIvRef.current) {
      clearInterval(cdIvRef.current);
      cdIvRef.current = null;
    }
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {}
      peerRef.current = null;
    }
    connsRef.current = [];
    hostConnRef.current = null;
    mpRef.current = {
      on: false,
      isHost: false,
      mode: 'coop',
      tourn: false,
      tournInfo: null,
      hub: false,
      code: '',
      sizeId: 9,
      custom: null,
      seed: 0,
      startAt: 0,
      phase: 'off'
    };
    setMpOn(false);
    setMpPhase('off');
    setPlayersBoth([]);
    setMyReadySt(false);
    myReadyRef.current = false;
    setGodBoards({});
    godRef.current = {};
    setRaceFinal(null);
    finalRef.current = null;
    setMyOutcome(null);
    outcomeRef.current = null;
    setCdNum(null);
    iAmSpecRef.current = false;
    resetItems();
    setItemToast(null);
    boardRef.current = {
      layout: null,
      nums: null,
      cells: null,
      owners: null
    }; // 上一場的權威盤面不可殘留到新場次（新 session 的 waiting 期若收到 ACT 會拿舊盤運算，稽核修）
  }

  // ----- 競速回座存檔（不小心跳出/重整後回來接續；比照數獨 sudoku_prog 的在地保存＋形狀/種子/年齡驗證） -----
  function minesResumeKey() {
    return 'mines_resume_' + (mpRef.current.code || '') + '_' + myId;
  }
  function saveResume() {
    if (!mpRef.current.on || mpRef.current.mode !== 'race' || iAmSpecRef.current || outcomeRef.current) return;
    var a = stateArgsRef.current;
    if (!a || !a[0] || !a[2] || !mpRef.current.seed) return;
    var spSv = SIZES[mpRef.current.sizeId] || SIZES[9];
    platSave().write(minesResumeKey(), {
      seed: mpRef.current.seed,
      sizeId: mpRef.current.sizeId,
      cw: spSv.w,
      ch: spSv.h,
      cm: spSv.mines,
      startAt: mpRef.current.startAt,
      cells: a[0].join(''),
      items: itemsRef.current,
      giftCredit: giftCreditRef.current,
      milestone: milestoneRef.current,
      ts: Date.now()
    }); // cw/ch/cm：自訂盤的形狀指紋，回座時對不上就不還原（陳年存檔鐵則）
  }
  function loadResume(seed, sizeId, total) {
    try {
      // 種子/尺寸/盤面長度不符＝別場的存檔，不准還原（陳年存檔鐵則）；驗證收編為 validator，不合由讀取層清除自癒
      return platSave().read(minesResumeKey(), {
        fallback: null,
        validate: function validate(p) {
          return !!p && p.seed === seed && p.sizeId === sizeId && !!p.cells && p.cells.length === total && !!p.ts && Date.now() - p.ts <= 3 * 3600 * 1000;
        }
      });
    } catch (e) {
      return null;
    }
  }
  function resumeRestore(m) {
    // guestOnInit 回座：還原中斷前的盤面/犯錯/道具（本地存檔優先，房主 god 快照備援）
    if (m.sizeId === 'custom' && m.custom) regCustomSpec(m.custom); // 保險：不論呼叫順序，先註冊規格再查表
    var sp = SIZES[m.sizeId] || SIZES[9],
      total = sp.w * sp.h;
    var L = makeLayout(sp.w, sp.h, sp.mines, m.seed),
      N = computeNums(sp.w, sp.h, L);
    var save = loadResume(m.seed, m.sizeId, total);
    if (save && save.cw != null && (save.cw !== sp.w || save.ch !== sp.h || save.cm !== sp.mines)) save = null; // 自訂形狀對不上＝別場的存檔
    var cellsArr = null;
    if (save) cellsArr = save.cells.split('');else if (m.god && m.god[myId] && typeof m.god[myId].cells === 'string' && m.god[myId].cells.length === total) cellsArr = m.god[myId].cells.split('');
    if (!cellsArr) return; // 無存檔可用：維持 startMatchLocal 的新盤（至少回座繼續打）
    if (save && save.items) {
      itemsRef.current = {
        question: save.items.question || 0,
        backfill: save.items.backfill || 0,
        gift: save.items.gift || 0
      };
      setMyItems(itemsRef.current);
      giftCreditRef.current = save.giftCredit || 0;
      milestoneRef.current = save.milestone || 0;
    }
    var mist = 0,
      touched = false;
    creditedMinesRef.current = {};
    for (var i = 0; i < total; i++) {
      if (cellsArr[i] === 'x') mist++;
      if (cellsArr[i] !== 'h') touched = true;
      if (cellsArr[i] === 'f' && L[i]) creditedMinesRef.current[i] = 1;
    } // 已計額度的正確旗：還原後重插同雷不重複計
    mistakesRef.current = mist;
    setMistLeft(Math.max(0, Math.floor(sp.mines / 10) - mist));
    if (touched) firstRef.current = false; // 已動過的盤不能再觸發首點保護（會把雷搬走、跟還原盤面打架）
    setCells(cellsArr);
    boardRef.current = {
      layout: L,
      nums: N,
      cells: cellsArr,
      owners: boardRef.current.owners
    };
    var myGod = m.god && m.god[myId];
    if (myGod && (myGod.state === 'finished' || myGod.state === 'boom')) {
      // 離開前已完賽/出局：回到等待結算狀態
      outcomeRef.current = myGod.state;
      setMyOutcome(myGod.state);
      if (myGod.state === 'finished') {
        setStatus('won');
        statusRef.current = 'won';
        godSet(myId, {
          state: 'finished',
          timeMs: myGod.timeMs,
          progress: 1
        });
      } else {
        setStatus('lost');
        statusRef.current = 'lost';
        godSet(myId, {
          state: 'boom',
          progress: myGod.progress || 0,
          boomAt: myGod.boomAt || Date.now()
        });
      }
      return;
    }
    raceSendState(cellsArr, N, L, true); // 立刻把還原盤面同步回去（房主 god/觀戰即時更新）
    itemSay('↩ 已接續中斷前的對局進度');
  }

  // ----- 競速：本地狀態送出（progress 小訊息 + god 用盤面快照節流） -----
  function raceSendState(cellsArr, numsArr, layoutArr, force) {
    var opened = openedSafeOf(cellsArr, layoutArr);
    var total = layoutArr.length - (SIZES[mpRef.current.sizeId] || SIZES[9]).mines;
    var prog = total ? opened / total : 0;
    var bvI = bvOfLayout(layoutArr, numsArr);
    var eff = bvI ? effProgressOf(cellsArr, bvI.weights, bvI.bv) : prog;
    godSet(myId, {
      progress: prog,
      effProgress: eff
    });
    var pi = Math.floor(prog * 100);
    if (pi !== lastProgRef.current) {
      lastProgRef.current = pi;
      mpSend({
        type: 'MINE_PROGRESS',
        uid: myId,
        progress: prog,
        eff: eff
      });
    }
    stateArgsRef.current = [cellsArr, numsArr, layoutArr];
    boardRef.current = {
      layout: layoutArr,
      nums: numsArr,
      cells: cellsArr,
      owners: boardRef.current.owners
    }; // 競速本地盤面鏡像（道具效果/禮物在本機盤面運算，靠它拿最新盤面）
    var now = Date.now();
    if (!force && now - stateAtRef.current < 250) {
      if (!stateTrailRef.current) stateTrailRef.current = setTimeout(function () {
        stateTrailRef.current = null;
        if (stateArgsRef.current) raceSendState(stateArgsRef.current[0], stateArgsRef.current[1], stateArgsRef.current[2], true);
      }, 270);
      return;
    }
    stateAtRef.current = now;
    var sparse = {};
    for (var i = 0; i < cellsArr.length; i++) if (cellsArr[i] === 'o') sparse[i] = numsArr[i];
    mpSend({
      type: 'MINE_STATE',
      uid: myId,
      cells: cellsArr.join(''),
      nums: sparse,
      progress: prog,
      eff: eff
    });
    godSet(myId, {
      cells: cellsArr.join(''),
      nums: sparse,
      progress: prog,
      effProgress: eff
    });
    saveResume(); // 回座存檔跟著每次狀態送出更新（節流後實際寫入頻率與 MINE_STATE 同步）
    // 里程碑（3BV eff 每 5% 一段）：逐格補報（v1.50.0 比照數獨/數橋定版，取代舊「只發 1 次其餘吞掉」）；被回填打回去再重跨不重報（milestoneRef 只增不減）
    if (mpRef.current.itemsAllow && mpRef.current.phase === 'playing' && !outcomeRef.current && !iAmSpecRef.current) {
      var band = Math.floor(eff * 20);
      if (band > milestoneRef.current) {
        var mFrom = milestoneRef.current;
        milestoneRef.current = band;
        for (var mb = mFrom + 1; mb <= band; mb++) {
          if (mpRef.current.isHost) hostHandleMilestone(myId);else mpSend({
            type: 'MINE_MILESTONE',
            uid: myId
          });
        }
      }
    }
  }
  function afterRaceAction(cellsArr, numsArr, layoutArr) {
    if (!mpRef.current.on || mpRef.current.mode !== 'race') return;
    if (outcomeRef.current) return;
    if (statusRef.current === 'won') {
      outcomeRef.current = 'finished';
      setMyOutcome('finished');
      var tms = Date.now() - mpRef.current.startAt;
      raceSendState(cellsArr, numsArr, layoutArr, true);
      godSet(myId, {
        state: 'finished',
        timeMs: tms,
        progress: 1
      });
      mpSend({
        type: 'MINE_FINISH',
        uid: myId,
        timeMs: tms
      });
      checkRaceEnd();
    } else if (statusRef.current === 'lost') {
      outcomeRef.current = 'boom';
      setMyOutcome('boom');
      var opened = openedSafeOf(cellsArr, layoutArr),
        total = layoutArr.length - (SIZES[mpRef.current.sizeId] || SIZES[9]).mines;
      var prog = total ? opened / total : 0;
      raceSendState(cellsArr, numsArr, layoutArr, true);
      var effB = effOfCells(cellsArr, layoutArr, numsArr);
      godSet(myId, {
        state: 'boom',
        progress: prog,
        effProgress: effB != null ? effB : prog,
        boomAt: Date.now()
      });
      mpSend({
        type: 'MINE_BOOM',
        uid: myId,
        progress: prog,
        eff: effB != null ? effB : prog
      });
      checkRaceEnd();
    } else {
      raceSendState(cellsArr, numsArr, layoutArr, false);
    }
  }
  // ----- 競速道具/禮物核心（v1.30） -----
  function progOfMine(uid) {
    var g = godRef.current[uid];
    return g ? g.progress || 0 : 0;
  }
  function bvOfLayout(layoutArr, numsArr) {
    if (!layoutArr) return null;
    var c = bvCacheRef.current;
    if (c && c.layout === layoutArr) return c;
    var sp = specRef.current || SIZES[9];
    var N = numsArr || computeNums(sp.w, sp.h, layoutArr);
    var r = computeBVWeights(sp.w, sp.h, layoutArr, N);
    bvCacheRef.current = {
      layout: layoutArr,
      weights: r.weights,
      bv: r.bv
    };
    return bvCacheRef.current;
  }
  function effOfCells(cellsArr, layoutArr, numsArr) {
    var b = bvOfLayout(layoutArr, numsArr);
    if (!b || !cellsArr) return null;
    return effProgressOf(cellsArr, b.weights, b.bv);
  }
  function effOfGod(g) {
    if (!g) return 0;
    return typeof g.effProgress === 'number' && isFinite(g.effProgress) ? g.effProgress : g.progress || 0;
  } // 混版 fallback：舊版來賓無 eff → 用開格 %（不得 NaN）
  function effOfMine(uid) {
    return effOfGod(godRef.current[uid]);
  }
  // v1.61.0 K4：對外顯示（對手晶片／觀戰面板／結算條目）一律 effOfGod（3BV 官方進度，與排名排序同語意），不再隨觀看者 progMode 切換；progMode 只管「自己的」進度文字顯示。
  function toggleProgMode() {
    var nx = progModeRef.current === 'bv' ? 'open' : 'bv';
    progModeRef.current = nx;
    setProgMode(nx);
  } // 點進度文字切換（規格 5.1/5.2：純文字、不做成按鈕）
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
  function pickWeightedMine(list, wfn) {
    var tot = 0,
      ws = list.map(function (p) {
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
  function itemsLive() {
    return mpRef.current.on && mpRef.current.mode === 'race' && mpRef.current.itemsAllow;
  }
  function mistakeAllowance() {
    var sp = specRef.current || SIZES[9];
    return Math.floor((sp.mines || 0) / 10);
  } // 容錯＝雷數 10%（10 雷→1、40 雷→4），全模式適用（v1.49.0 使用者指示：單機/每日/合作比照競速）
  function sendItemMsg(m) {
    if (mpRef.current.isHost) {
      hostBroadcast(m);
      processItemMsg(m);
    } else mpSend(m);
  } // 房主：廣播＋本地處理（自己也可能是目標）；來賓：送房主中繼
  function processItemMsg(m) {
    if (m.type === 'MINE_GRANT' && m.toUid === myId) applyItemGrant(m.item);else if (m.type === 'MINE_GIFT' && m.toUid === myId) {
      holdGift(m.fromName);
      try {
        if (window.PlatFly) PlatFly.fly(PlatFly.byUid('mines', m.fromUid), PlatFly.me('mines'), '🎁');
      } catch (e) {}
    } // H3 禮物 Fly（純顯示層）
    else if (m.type === 'MINE_HIT' && m.toUid === myId) applyItemHit(m.kind, m.fromName);
    saveResume(); // 道具庫存變動也刷新回座存檔（盤面沒變時 raceSendState 不會觸發）
  }
  function hostHandleMilestone(fromUid) {
    if (!mpRef.current.isHost || !itemsLive()) return;
    if (Date.now() - (mpRef.current.startAt || 0) < (mpRef.current.itemDelay || 0) * 1000) return; // 道具延遲（比照數獨 weaponStartTime：延遲內跨的里程碑不發）
    var pool = unfinishedRacers();
    if (!pool.length) return;
    if (pool.length === 1) {
      sendItemMsg({
        type: 'MINE_GRANT',
        uid: myId,
        toUid: pool[0].id,
        item: 'gift'
      });
      return;
    } // 只剩一人：里程碑直接發禮物
    var rec = pickWeightedMine(pool, function (p) {
      return Math.pow(1 - effOfMine(p.id), 2) + 0.1;
    }); // 發放權重（扶弱）定版公式（v1.50.0 改用 3BV eff）
    var item = Math.random() < 0.5 ? 'question' : 'backfill';
    sendItemMsg({
      type: 'MINE_GRANT',
      uid: myId,
      toUid: rec.id,
      item: item
    });
  }
  function applyItemGrant(item) {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current) return;
    if (item === 'gift') {
      holdGift('');
      return;
    }
    if (amLastOne()) {
      holdGift('');
      itemSay('🏁 只剩你一人，里程碑道具自動轉成禮物（在禮物鈕裡）！');
      return;
    }
    var ni = Object.assign({}, itemsRef.current);
    ni[item] = (ni[item] || 0) + 1;
    itemsRef.current = ni;
    setMyItems(ni);
    itemSay(item === 'question' ? '🎁 里程碑道具：❓ 問號干擾 ×' + ni[item] : '🎁 里程碑道具：⏪ 回填 ×' + ni[item]);
    try {
      platAudio().play('star');
    } catch (e) {} // 獲得道具（孤兒裁示鎖定形：三款統一 star 舊制叮聲、v1.65.9 定死）
    maybeAutoFire();
  }
  function giftCandidates() {
    var B = boardRef.current;
    if (!B || !B.cells || !B.layout) return [];
    var cand = [];
    for (var i = 0; i < B.cells.length; i++) if (B.layout[i] && B.cells[i] === 'h') cand.push(i);
    return cand;
  }
  function holdGift(fromName) {
    // 禮物持有制：進禮物鈕、玩家自己按才發動（使用者 2026-11-02 指示，比照數獨禮物鈕）
    try {
      platAudio().play('star');
    } catch (e) {} // 收到禮物（star、v1.65.9 鎖定）
    var ni = Object.assign({}, itemsRef.current);
    ni.gift = (ni.gift || 0) + 1;
    itemsRef.current = ni;
    setMyItems(ni);
    itemSay(fromName ? '🎁 ' + fromName + ' 送你一個禮物！點 🎁 按鈕使用' : '🎁 收到一個禮物！點 🎁 按鈕使用');
    maybeAutoGift();
  }
  function useGift() {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current) return;
    if ((itemsRef.current.gift || 0) <= 0) return;
    if (!giftCandidates().length) {
      itemSay('🎁 所有地雷都已標記，禮物先留著');
      return;
    }
    var ni = Object.assign({}, itemsRef.current);
    ni.gift -= 1;
    itemsRef.current = ni;
    setMyItems(ni);
    applyGiftEffect('');
  }
  function maybeAutoGift() {
    // 禮物集滿 3 自動使用（觸發後一路用到歸零，比照數獨/數橋「滿 3 自動連發歸零」；停止條件是歸零，不是掉回 2）
    if (autoGiftIvRef.current) return;
    if ((itemsRef.current.gift || 0) < 3) return;
    autoGiftIvRef.current = setInterval(function () {
      if ((itemsRef.current.gift || 0) < 1 || outcomeRef.current || !itemsLive() || !giftCandidates().length) {
        clearInterval(autoGiftIvRef.current);
        autoGiftIvRef.current = null;
        return;
      }
      var ni = Object.assign({}, itemsRef.current);
      ni.gift -= 1;
      itemsRef.current = ni;
      setMyItems(ni);
      applyGiftEffect('');
    }, 550);
  }
  function applyGiftEffect(fromName) {
    // 禮物效果：隨機一顆未標記的真雷 → 自動插旗並鎖死（'L'）
    var B = boardRef.current;
    if (!B || !B.cells || !B.layout) return;
    var cand = giftCandidates();
    if (!cand.length) {
      itemSay('🎁 禮物：所有地雷都已標記，禮物落空');
      return;
    }
    var idx = cand[Math.floor(Math.random() * cand.length)];
    var NC = B.cells.slice();
    NC[idx] = 'L';
    setCells(NC);
    platAudio().play('gift'); // 禮物效果落地（收到禮物）＝gift
    raceSendState(NC, B.nums, B.layout, true);
    itemSay('🎁 ' + (fromName ? fromName + ' 送的禮物' : '禮物') + '：一顆地雷已被標記並鎖定！');
  }
  function trySendGift() {
    // 禮物額度滿 1：送給比自己弱的未完賽對手（sqrt 差距加權，比照數獨）；沒有對象就存著
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current || mpRef.current.phase !== 'playing') return;
    while (giftCreditRef.current >= 1) {
      var myP = effOfMine(myId);
      var weaker = unfinishedRacers().filter(function (p) {
        return p.id !== myId && effOfMine(p.id) < myP;
      });
      if (!weaker.length) return;
      var tgt = pickWeightedMine(weaker, function (p) {
        return Math.sqrt((myP - effOfMine(p.id)) * 100 + 1);
      });
      giftCreditRef.current -= 1;
      sendItemMsg({
        type: 'MINE_GIFT',
        uid: myId,
        fromUid: myId,
        fromName: (myPlayer() || {}).name || '',
        toUid: tgt.id
      });
      try {
        if (window.PlatFly) PlatFly.fly(PlatFly.me('mines'), PlatFly.byUid('mines', tgt.id), '🎁');
      } catch (e) {} // H3 禮物 Fly（純顯示層）
      // 不提示送出：跳「你送了禮物」等於間接告訴送禮者他剛才那支旗插對了（使用者 2026-11-02 指示）——額度消耗與送禮都靜默進行
    }
  }
  function fireItem(kind) {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current) return;
    if ((itemsRef.current[kind] || 0) <= 0) return;
    var tgts = unfinishedRacers().filter(function (p) {
      return p.id !== myId;
    });
    if (!tgts.length) {
      itemSay('目前沒有可攻擊的對手');
      return;
    }
    var tgt = pickWeightedMine(tgts, function (p) {
      return Math.pow(effOfMine(p.id), 2) + 0.1;
    }); // 攻擊權重（打強者）定版公式（v1.50.0 改用 3BV eff）
    var ni = Object.assign({}, itemsRef.current);
    ni[kind] -= 1;
    itemsRef.current = ni;
    setMyItems(ni);
    sendItemMsg({
      type: 'MINE_HIT',
      uid: myId,
      fromUid: myId,
      fromName: (myPlayer() || {}).name || '',
      toUid: tgt.id,
      kind: kind
    });
    itemSay(kind === 'question' ? '❓ 已對 ' + tgt.name + ' 發動問號干擾！' : '⏪ 已對 ' + tgt.name + ' 發動回填！');
  }
  function maybeAutoFire() {
    // 集滿 3 自動連發（每 550ms 一發、每發重新挑目標；觸發的那種一路打到歸零——定版「滿 3 連發歸零」；沒有目標就停下）
    if (autoItemIvRef.current) return;
    var startKind = itemsRef.current.question >= 3 ? 'question' : itemsRef.current.backfill >= 3 ? 'backfill' : null;
    if (!startKind) return;
    try {
      platAudio().play('star');
    } catch (e) {} // 集滿自動發動（star、v1.65.9 鎖定）
    autoItemIvRef.current = setInterval(function () {
      var kind = (itemsRef.current[startKind] || 0) > 0 ? startKind : itemsRef.current.question >= 3 ? 'question' : itemsRef.current.backfill >= 3 ? 'backfill' : null;
      var hasTgt = unfinishedRacers().some(function (p) {
        return p.id !== myId;
      });
      if (!kind || !hasTgt || outcomeRef.current || !itemsLive()) {
        clearInterval(autoItemIvRef.current);
        autoItemIvRef.current = null;
        return;
      }
      fireItem(kind);
    }, 550);
  }
  function tryConvertLastOne() {
    // 剛變成最後一位：手上未用的攻擊道具全部轉禮物（逐個發動）
    if (lastOneDoneRef.current || !itemsLive()) return;
    if (!amLastOne()) return;
    lastOneDoneRef.current = true;
    var held = (itemsRef.current.question || 0) + (itemsRef.current.backfill || 0);
    if (held > 0) {
      var ni = Object.assign({}, itemsRef.current);
      ni.question = 0;
      ni.backfill = 0;
      ni.gift = (ni.gift || 0) + held;
      itemsRef.current = ni;
      setMyItems(ni);
      itemSay('🏁 只剩你一人，未用的道具全部轉成禮物（在禮物鈕裡）！');
      maybeAutoGift();
    }
  }
  function applyItemHit(kind, fromName) {
    if (!itemsLive() || outcomeRef.current || iAmSpecRef.current) return;
    if (amLastOne()) {
      holdGift('');
      itemSay('🏁 只剩你一人，' + (fromName || '對手') + ' 的攻擊自動轉成禮物（在禮物鈕裡）！');
      return;
    }
    var B = boardRef.current;
    if (!B || !B.cells || !B.layout || !B.nums) return;
    var sp = SIZES[mpRef.current.sizeId] || SIZES[9];
    if (kind === 'question') {
      // 未確定的數字：已開、數字 >0、且周圍還有「未打開也未標記」的格子
      var cand = [];
      for (var i = 0; i < B.cells.length; i++) {
        if (B.cells[i] !== 'o' || !(B.nums[i] > 0)) continue;
        var nb = neighborsOf(sp.w, sp.h, i),
          und = false;
        for (var j = 0; j < nb.length; j++) if (B.cells[nb[j]] === 'h') {
          und = true;
          break;
        }
        if (und) cand.push(i);
      }
      if (!cand.length) {
        itemSay('❓ ' + (fromName || '對手') + ' 的問號干擾落空了（沒有未確定的數字）');
        return;
      }
      var c0 = cand[Math.floor(Math.random() * cand.length)],
        cx = c0 % sp.w,
        cy = Math.floor(c0 / sp.w);
      var cluster = cand.filter(function (i2) {
        return Math.max(Math.abs(i2 % sp.w - cx), Math.abs(Math.floor(i2 / sp.w) - cy)) <= 2;
      }); // 中心鄰近（切比雪夫距離 ≤2）
      for (var s = cluster.length - 1; s > 0; s--) {
        var r2 = Math.floor(Math.random() * (s + 1));
        var tmp = cluster[s];
        cluster[s] = cluster[r2];
        cluster[r2] = tmp;
      }
      var n = cluster.length <= 3 ? cluster.length : 3 + Math.floor(Math.random() * (Math.min(6, cluster.length) - 3 + 1)); // 範圍 3–6 格
      var fx = Object.assign({}, questionFxRef.current),
        exp = Date.now() + 10000;
      cluster.slice(0, n).forEach(function (i3) {
        fx[i3] = exp;
      });
      questionFxRef.current = fx;
      setQuestionFx(fx);
      platAudio().play('error');
      itemSay('❓ ' + (fromName || '對手') + ' 把你 ' + n + ' 個數字變成了問號（10 秒）！');
    } else {
      // 回填：隨機已開格為中心 3×3；碰到連鎖空格 → 整片相連空格＋其邊界數字一併蓋回
      var opened = [];
      for (var k = 0; k < B.cells.length; k++) if (B.cells[k] === 'o') opened.push(k);
      if (!opened.length) {
        itemSay('⏪ ' + (fromName || '對手') + ' 的回填落空了（還沒有打開的格子）');
        return;
      }
      var ctr = opened[Math.floor(Math.random() * opened.length)],
        ox = ctr % sp.w,
        oy = Math.floor(ctr / sp.w);
      var cover = {},
        zeros = [],
        bq = [];
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var nx = ox + dx,
          ny = oy + dy;
        if (nx < 0 || ny < 0 || nx >= sp.w || ny >= sp.h) continue;
        var ii = ny * sp.w + nx;
        if (B.cells[ii] === 'o' && !cover[ii]) {
          cover[ii] = 1;
          if (B.nums[ii] === 0) {
            zeros.push(ii);
            bq.push(ii);
          }
        }
      }
      while (bq.length) {
        var z = bq.pop(),
          znb = neighborsOf(sp.w, sp.h, z);
        for (var a = 0; a < znb.length; a++) {
          var w2 = znb[a];
          if (B.cells[w2] === 'o' && B.nums[w2] === 0 && !cover[w2]) {
            cover[w2] = 1;
            zeros.push(w2);
            bq.push(w2);
          }
        }
      }
      zeros.forEach(function (z2) {
        neighborsOf(sp.w, sp.h, z2).forEach(function (w3) {
          if (B.cells[w3] === 'o') cover[w3] = 1;
        });
      }); // 連鎖空格的邊界數字也一起蓋回
      var NC = B.cells.slice(),
        cnt = 0;
      for (var key in cover) {
        NC[key] = 'h';
        cnt++;
      }
      var fx2 = Object.assign({}, questionFxRef.current),
        fxChanged = false;
      for (var key2 in cover) if (fx2[key2]) {
        delete fx2[key2];
        fxChanged = true;
      }
      if (fxChanged) {
        questionFxRef.current = fx2;
        setQuestionFx(fx2);
      }
      setCells(NC);
      platAudio().play('error');
      raceSendState(NC, B.nums, B.layout, true);
      itemSay('⏪ ' + (fromName || '對手') + ' 回填了你 ' + cnt + ' 格！');
    }
  }
  function checkRaceEnd() {
    if (finalRef.current || !mpRef.current.on || mpRef.current.mode !== 'race') return;
    var racers = playersRef.current.filter(function (p) {
      return !p.spectator && !p.pending;
    });
    if (!racers.length) return;
    var allDone = racers.every(function (p) {
      if (p.offline) return true;
      var g = godRef.current[p.id];
      return g && (g.state === 'finished' || g.state === 'boom');
    });
    if (!allDone) return;
    var fins = [],
      booms = [],
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
      if (g.state === 'finished') fins.push(e);else if (g.state === 'boom') booms.push(e);else rest.push(e);
    });
    fins.sort(function (a, b) {
      return (a.g.timeMs || 0) - (b.g.timeMs || 0);
    });
    booms.sort(function (a, b) {
      return effOfGod(b.g) - effOfGod(a.g) || (a.g.boomAt || 0) - (b.g.boomAt || 0);
    }); // 爆雷/未完賽排名改用 3BV（規格 5.4）
    rest.sort(function (a, b) {
      return effOfGod(b.g) - effOfGod(a.g);
    });
    var entries = fins.concat(booms, rest).map(function (e) {
      return {
        key: e.key,
        name: e.name,
        color: e.color,
        isMe: e.isMe,
        right: e.g.state === 'finished' ? '⏱ ' + fmtTime(Math.floor((e.g.timeMs || 0) / 1000)) : e.g.state === 'boom' ? '💥 ' + Math.floor(effOfGod(e.g) * 100) + '%' : '未完成・' + Math.floor(effOfGod(e.g) * 100) + '%'
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

  // ----- 合作：房主權威定序（MINE_DO 帶權威盤面，全員照抄，保證一致） -----
  function encOwners(O) {
    return O ? O.map(function (o) {
      return o < 0 ? '-' : o.toString(36);
    }).join('') : undefined;
  }
  function decOwners(s) {
    return s ? s.split('').map(function (ch) {
      return ch === '-' ? -1 : parseInt(ch, 36);
    }) : null;
  }
  function coopSparse(cellsArr, numsArr) {
    var s = {};
    for (var i = 0; i < cellsArr.length; i++) if (cellsArr[i] === 'o') s[i] = numsArr[i];
    return s;
  }
  function processCoopAct(kind, idx, byUid, byName) {
    if (statusRef.current === 'won' || statusRef.current === 'lost') return; // 本局結束後的動作一律擋下（和弦拆送的後續格靠這裡截斷）
    var B = boardRef.current;
    if (!B.layout || !B.cells) return;
    var sp = SIZES[mpRef.current.sizeId] || SIZES[9];
    var L = B.layout,
      N = B.nums,
      C = B.cells.slice(),
      hit = -1,
      stAfter = 'playing';
    var OWN = B.owners ? B.owners.slice() : new Array(C.length).fill(-1);
    if (kind === 'flag') {
      if (C[idx] === 'h') C[idx] = 'f';else if (C[idx] === 'f') C[idx] = 'h';else return;
    } else {
      if (C[idx] !== 'h') return;
      var reloc = null,
        layoutFull = null;
      if (firstRef.current) {
        var fin2 = finalizeFirstClick(sp.w, sp.h, sp.mines, mpRef.current.sizeId, mpRef.current.seed || 0, L, idx, C); // cells 傳 C（原傳 null）：合作盤首挖也要吃到鎖定旗 L 豁免與 hasLock 守衛，否則同型孤兒旗
        if (fin2.tries > 1) {
          L = fin2.layout;
          N = computeNums(sp.w, sp.h, L);
          layoutFull = L;
        } else if (fin2.moves.length) {
          L = fin2.layout;
          N = computeNums(sp.w, sp.h, L);
          reloc = fin2.moves;
        }
        firstRef.current = false;
      }
      var r = revealFrom(sp.w, sp.h, L, N, C, idx);
      var prevC = C;
      C = r.cells;
      hit = r.hit;
      var forgivenAt = -1; // 合作共用容錯（v1.49.0）：全隊共用雷數 10% 額度，額度以盤面 'x' 數為準（房主權威計算、隨 cells 同步）
      if (hit >= 0) {
        var allowC = mistakeAllowance(),
          xCnt0 = 0;
        for (var xi0 = 0; xi0 < prevC.length; xi0++) if (prevC[xi0] === 'x') xCnt0++;
        if (allowC > 0 && xCnt0 < allowC) {
          C = C.slice();
          C[hit] = 'x';
          forgivenAt = hit;
          hit = -1;
        } else stAfter = 'lost';
      } else if (openedSafeOf(C, L) >= sp.w * sp.h - sp.mines) stAfter = 'won';
      var aIdx = playersRef.current.findIndex(function (p) {
        return p.id === byUid;
      }); // 貢獻歸屬：這次動作新開的格（含洪泛展開＋踩到的雷）都算動作玩家開啟
      if (aIdx >= 0) {
        for (var oi = 0; oi < C.length; oi++) if (prevC[oi] !== 'o' && C[oi] === 'o') OWN[oi] = aIdx;
      }
    }
    boardRef.current = {
      layout: L,
      nums: N,
      cells: C,
      owners: OWN
    };
    var msg = {
      type: 'MINE_DO',
      kind: kind,
      idx: idx,
      uid: byUid,
      byName: byName || '',
      cells: C.join(''),
      sparse: coopSparse(C, N),
      hit: hit,
      statusAfter: stAfter,
      forgivenAt: forgivenAt >= 0 ? forgivenAt : undefined,
      reloc: reloc || undefined,
      layoutFull: layoutFull ? layoutFull.map(function (v) {
        return v ? '1' : '0';
      }).join('') : undefined,
      own: kind === 'flag' ? undefined : encOwners(OWN),
      mines: stAfter === 'lost' ? L.map(function (v, i) {
        return v ? i : -1;
      }).filter(function (v) {
        return v >= 0;
      }) : undefined
    };
    hostBroadcast(msg);
    adoptCoopDo(msg);
  }
  function adoptCoopDo(m) {
    var arr = (m.cells || '').split('');
    // boardRef 必須跟著 MINE_DO 同步：來賓的 boardRef 原本整場停在開局快照，房主中途離開、來賓接任後 processCoopAct 會拿舊盤面定序、把全場進度洗掉（稽核修・高）
    var bL = boardRef.current.layout,
      bN = boardRef.current.nums;
    if (m.layoutFull) {
      var LF = m.layoutFull.split('').map(function (ch) {
        return ch === '1';
      });
      if (!bL || LF.length === bL.length) {
        bL = LF;
        var spF = SIZES[mpRef.current.sizeId] || SIZES[9];
        bN = computeNums(spF.w, spF.h, bL);
        if (mpRef.current.isHost) {
          setLayout(bL);
          setNums(bN);
        }
      }
    } else if (m.reloc && bL) {
      var NL2 = bL.slice();
      var pairs = typeof m.reloc[0] === 'number' ? [m.reloc] : m.reloc;
      pairs.forEach(function (pr) {
        NL2[pr[0]] = false;
        NL2[pr[1]] = true;
      });
      bL = NL2;
      var spR = SIZES[mpRef.current.sizeId] || SIZES[9];
      bN = computeNums(spR.w, spR.h, bL);
      if (mpRef.current.isHost) {
        setLayout(bL);
        setNums(bN);
      }
    }
    if (m.statusAfter === 'lost' && m.mines) {
      var LL = new Array(arr.length).fill(false);
      m.mines.forEach(function (i) {
        LL[i] = true;
      });
      bL = LL;
    }
    var OA = m.own ? decOwners(m.own) : boardRef.current.owners;
    boardRef.current = {
      layout: bL,
      nums: bN,
      cells: arr.slice(),
      owners: OA
    };
    if (m.own) setOwnArr(OA);
    setCells(arr);
    var xCnt2 = 0;
    for (var xj2 = 0; xj2 < arr.length; xj2++) if (arr[xj2] === 'x') xCnt2++; // 合作愛心＝盤面 ✗ 數推導，全員一致
    mistakesRef.current = xCnt2;
    setMistLeft(Math.max(0, mistakeAllowance() - xCnt2));
    if (m.forgivenAt != null && m.forgivenAt >= 0) {
      platAudio().play('boom');
      itemSay('💥 ' + (m.byName || '有人') + ' 踩到雷！這格記 ✗——愛心還剩 ' + (mistakeAllowance() - xCnt2 + 1) + ' 顆');
    }
    setNums(function (prev) {
      var N = prev ? prev.slice() : new Array(arr.length).fill(0);
      for (var k in m.sparse) N[+k] = m.sparse[k];
      return N;
    });
    if (m.hit >= 0) setHitIdx(m.hit);
    if (m.statusAfter === 'lost') {
      if (m.mines) {
        var L = new Array(arr.length).fill(false);
        m.mines.forEach(function (i) {
          L[i] = true;
        });
        setLayout(L);
      }
      setStatus('lost');
      statusRef.current = 'lost';
      setCoopBoomBy(m.byName || '');
      platAudio().play('boom');
      mpRef.current.phase = 'done';
      setMpPhase('done');
    } else if (m.statusAfter === 'won') {
      setStatus('won');
      statusRef.current = 'won';
      platAudio().play('complete');
      mpRef.current.phase = 'done';
      setMpPhase('done');
    } else {
      setStatus('playing');
      statusRef.current = 'playing';
      if (m.forgivenAt != null && m.forgivenAt >= 0) {/* 引爆音效已在上方播 */} else if (m.kind === 'reveal') platAudio().play('place');
    }
  }

  // ----- 開局 -----
  function setupBoardFromSeed(seed, szId, startAt) {
    var sp = SIZES[szId] || SIZES[9];
    var L = makeLayout(sp.w, sp.h, sp.mines, seed);
    var N = computeNums(sp.w, sp.h, L);
    var C = new Array(sp.w * sp.h).fill('h');
    setSizeId(sp.id);
    setCurSeed(seed);
    setLayout(L);
    setNums(N);
    setCells(C);
    var OW0 = new Array(sp.w * sp.h).fill(-1);
    setOwnArr(OW0);
    boardRef.current = {
      layout: L,
      nums: N,
      cells: C,
      owners: OW0
    };
    setStatus('ready');
    statusRef.current = 'ready';
    setHitIdx(-1);
    setInputMode('dig');
    setStartedAt(startAt);
    startedAtRef.current = startAt;
    setElapsed(0);
    firstRef.current = true;
    lastProgRef.current = -1;
  }
  function startMatchLocal(seed, szId, startAt) {
    startAt = startAt - platTimeOffset(); // 房主給的絕對開賽時刻換算回本地時鐘（D-05）：下游倒數/計時/完賽/回座存檔全用本地版，房主 offset=0 不受影響
    mpRef.current.seed = seed;
    mpRef.current.sizeId = szId;
    mpRef.current.startAt = startAt;
    mpRef.current.phase = 'countdown';
    setRaceFinal(null);
    finalRef.current = null;
    setMyOutcome(null);
    outcomeRef.current = null;
    setGodBoards({});
    godRef.current = {};
    dismissRef.current = null;
    setGodUid(null);
    setCoopBoomBy('');
    resetItems();
    mistakesRef.current = 0;
    setMistLeft(Math.floor((SIZES[szId] || SIZES[9]).mines / 10)); // 容錯額度＝雷數 10%
    setStrokesBoth([]); // 新比賽清塗鴉
    setMyReadySt(false);
    myReadyRef.current = false;
    var spec2 = iAmSpec();
    iAmSpecRef.current = spec2;
    if (!spec2) setupBoardFromSeed(seed, szId, startAt);else {
      setCells(null);
      setLayout(null);
      setNums(null);
    }
    setMpPhase('countdown');
    setScreen('game');
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
      } else setCdNum(Math.ceil(rem / 1000));
    }, 100);
  }
  function startMatch() {
    // 房主
    if (!mpRef.current.isHost) return;
    if (mpRef.current.phase !== 'waiting' && mpRef.current.phase !== 'done') return;
    if (autoIvRef.current) {
      clearInterval(autoIvRef.current);
      autoIvRef.current = null;
    }
    var seed = Math.random() * 4294967296 >>> 0,
      startAt = Date.now() + 3500;
    var szId = mpRef.current.sizeId;
    setPlayersBoth(playersRef.current.filter(function (p) {
      return !p.pending;
    }).map(function (p) {
      return Object.assign({}, p, {
        ready: false
      });
    })); // 開賽清未到席位（比照數獨；殼端結算另有「未到不擋結算」規則）
    hostBroadcast({
      type: 'PLAYERS_UPDATE',
      players: playersRef.current
    });
    hostBroadcast({
      type: 'MINE_START',
      seed: seed,
      sizeId: szId,
      startAt: startAt,
      custom: mpRef.current.custom || undefined
    }); // 自訂盤：規格隨開局訊息給來賓註冊（種子只決定雷位，尺寸不帶就會開成預設盤）
    startMatchLocal(seed, szId, startAt);
  }

  // ----- 訊息分派 -----
  function onMpData(m, conn) {
    if (!m || !m.type) return;
    var H = mpRef.current.isHost;
    // 房主端驗寄件者：連線在 JOIN 時已綁 conn.__uid，之後帶 uid 的訊息必須相符，冒名把對手打成出局/完賽一律丟棄（稽核修）
    if (H && conn && conn.__uid && m.uid && m.uid !== conn.__uid && ['MINE_FINISH', 'MINE_BOOM', 'MINE_STATE', 'MINE_PROGRESS', 'MINE_ACT', 'READY', 'SPEC', 'REQ_REMATCH', 'MINE_MILESTONE', 'MINE_GRANT', 'MINE_GIFT', 'MINE_HIT', 'MINE_DOODLE'].indexOf(m.type) >= 0) return;
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
      case 'SPEC':
        if (H) {
          setPlayersBoth(playersRef.current.map(function (p) {
            return p.id === m.uid ? Object.assign({}, p, {
              spectator: !!m.spectator
            }) : p;
          }));
          hostBroadcast({
            type: 'PLAYERS_UPDATE',
            players: playersRef.current
          });
        }
        break;
      case 'MINE_START':
        if (!H) {
          if (m.sizeId === 'custom') regCustomSpec(m.custom);
          startMatchLocal(m.seed, m.sizeId, m.startAt);
        }
        break;
      case 'MINE_PROGRESS':
        {
          var pp1 = {
            progress: m.progress || 0
          };
          if (typeof m.eff === 'number') pp1.effProgress = m.eff;
          godSet(m.uid, pp1);
          if (H) hostBroadcast(m, conn);
          checkRaceEnd();
          break;
        }
      case 'MINE_STATE':
        {
          var pp2 = {
            cells: m.cells,
            nums: m.nums || {},
            progress: m.progress || 0
          };
          if (typeof m.eff === 'number') pp2.effProgress = m.eff;
          godSet(m.uid, pp2);
          if (H) hostBroadcast(m, conn);
          break;
        }
      case 'MINE_FINISH':
        godSet(m.uid, {
          state: 'finished',
          timeMs: m.timeMs,
          progress: 1,
          effProgress: 1
        });
        if (H) hostBroadcast(m, conn);
        checkRaceEnd();
        tryConvertLastOne();
        break;
      case 'MINE_BOOM':
        {
          var pp3 = {
            state: 'boom',
            progress: m.progress || 0,
            boomAt: Date.now()
          };
          if (typeof m.eff === 'number') pp3.effProgress = m.eff;
          godSet(m.uid, pp3);
          if (H) hostBroadcast(m, conn);
          checkRaceEnd();
          tryConvertLastOne();
          break;
        }
      case 'MINE_MILESTONE':
        if (H) hostHandleMilestone(m.uid);
        break;
      case 'MINE_GRANT':
        if (!H) processItemMsg(m);
        break;
      // 房主發出時已在 sendItemMsg 內本地處理；來賓鍛造的 GRANT 房主不受理
      case 'MINE_GIFT':
        if (H) hostBroadcast(m, conn);
        processItemMsg(m);
        break;
      case 'MINE_HIT':
        if (H) hostBroadcast(m, conn);
        processItemMsg(m);
        break;
      case 'MINE_ACT':
        if (H && mpRef.current.mode === 'coop') {
          var pl = playersRef.current.find(function (p) {
            return p.id === m.uid;
          });
          if (pl && !pl.spectator && mpRef.current.phase === 'playing') processCoopAct(m.kind, m.idx, m.uid, pl.name);
        }
        break;
      // 觀戰者/倒數期間的 ACT 不受理：adoptCoopDo 會把全員 status 設成 playing 偷跑盤面（稽核修）
      case 'MINE_DO':
        if (!H && mpRef.current.mode === 'coop') adoptCoopDo(m);
        break;
      case 'MINE_DOODLE':
        if (mpRef.current.mode === 'coop') {
          applyDoodleMsg(m);
          if (H) hostBroadcast(m, conn);
        }
        break;
      // 塗鴉只在合作同步；房主套用後轉發全場
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
  function hostOnJoin(m, conn) {
    conn.__uid = m.uid;
    var phase = mpRef.current.phase;
    var lateSpec = (phase === 'countdown' || phase === 'playing') && mpRef.current.mode === 'race' || phase === 'playing' && mpRef.current.mode === 'coop';
    var list = playersRef.current.slice();
    var ex = list.find(function (p) {
      return p.id === m.uid;
    });
    if (ex) {
      list = list.map(function (p) {
        return p.id === m.uid ? Object.assign({}, p, {
          name: m.pName,
          offline: false
        }) : p;
      });
    } else {
      var pend = list.findIndex(function (p) {
        return p.pending && normName(p.name) === normName(m.pName || '');
      });
      var color = typeof m.color === 'string' && m.color ? m.color : MP_COLORS[list.filter(function (p) {
        return !p.pending;
      }).length % MP_COLORS.length]; // 來賓 JOIN 帶來的殼代表色優先（非空字串才用）；沒有才依座位配色（pending 席位仍沿用種子的殼名單色，不在此覆寫）
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
        mode: mpRef.current.mode,
        sizeId: mpRef.current.sizeId,
        custom: mpRef.current.custom || undefined,
        phase: phase,
        seed: myEntry && myEntry.spectator ? undefined : mpRef.current.seed,
        startAt: mpRef.current.startAt,
        god: godRef.current,
        youSpec: !!(myEntry && myEntry.spectator),
        coopSnap: mpRef.current.mode === 'coop' && boardRef.current.cells ? {
          cells: boardRef.current.cells.join(''),
          sparse: coopSparse(boardRef.current.cells, boardRef.current.nums),
          status: statusRef.current,
          own: encOwners(boardRef.current.owners)
        } : null
      });
    } catch (e) {}
  }
  function guestOnInit(m) {
    setPlayersBoth(m.players || []);
    mpRef.current.mode = m.mode || mpRef.current.mode;
    if (m.sizeId === 'custom') {
      regCustomSpec(m.custom);
      mpRef.current.custom = m.custom ? {
        w: SIZES.custom.w,
        h: SIZES.custom.h,
        mines: SIZES.custom.mines
      } : null;
    } // 先註冊再 startMatchLocal/回座還原，查表才不會落回 9×9
    mpRef.current.sizeId = m.sizeId || mpRef.current.sizeId;
    setSizeId(m.sizeId || 9);
    iAmSpecRef.current = !!m.youSpec;
    if (m.god) {
      godRef.current = m.god;
      setGodBoards(m.god);
    }
    if (m.phase === 'countdown' || m.phase === 'playing') {
      mpRef.current.seed = m.seed;
      mpRef.current.startAt = m.startAt;
      if (m.youSpec) {
        setCells(null);
        setLayout(null);
        setNums(null);
        mpRef.current.phase = m.phase;
        setMpPhase(m.phase);
        setScreen('game');
        if (m.phase === 'countdown' && m.startAt) {
          // 倒數中進場的觀戰者：MINE_START 已廣播完不會重送，自己排程在 startAt 切成 playing，否則整場卡在空白畫面（稽核修）
          var specDelay = Math.max(0, m.startAt - Date.now()) + 60;
          setTimeout(function () {
            if (mpRef.current.phase === 'countdown' && iAmSpecRef.current) {
              mpRef.current.phase = 'playing';
              setMpPhase('playing');
            }
          }, specDelay);
        }
        if (m.coopSnap) adoptCoopDo({
          cells: m.coopSnap.cells,
          sparse: m.coopSnap.sparse,
          hit: -1,
          statusAfter: m.coopSnap.status === 'won' ? 'won' : m.coopSnap.status === 'lost' ? 'lost' : 'playing',
          kind: 'reveal',
          own: m.coopSnap.own
        });
      } else {
        // 比賽進行中回座：同 seed 重建盤面＋還原中斷前進度（resumeRestore：本地存檔優先、房主 god 快照備援）
        startMatchLocal(m.seed, m.sizeId, m.startAt);
        resumeRestore(m);
      }
    }
  }
  function onHostLeft(m) {
    // 房主個人離開：名單第一位「在線的非觀戰選手」接手當房主（全端同一份名單、同一個篩法，結論一致；原寫法挑到離線者會無人接任、挑到觀戰者會帶觀戰旗標主持，稽核修）
    var racers = playersRef.current.filter(function (p) {
      return !p.isHost && !p.offline && !p.spectator && !p.pending;
    });
    if (!racers.length) racers = playersRef.current.filter(function (p) {
      return !p.isHost && !p.offline && !p.pending;
    });
    if (racers.length && racers[0].id === myId) becomeHost(true);
  }
  function onConnClose(conn) {
    // 房主端：某來賓連線斷了
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
    godSet(uid, {}); // 確保有條目
    checkRaceEnd();
  }
  function onHostConnClose() {
    // 來賓端：房主連線斷了 → 等殼接管/房主端重組後重新加入
    if (!mpRef.current.on || mpRef.current.isHost) return;
    setTimeout(function () {
      if (mpRef.current.on && !mpRef.current.isHost && sessRef.current) guestSetup(sessRef.current);
    }, 1500);
  }

  // ----- 連線建立 -----
  function becomeHost(promoting) {
    mpRef.current.isHost = true;
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {}
      peerRef.current = null;
    }
    connsRef.current = [];
    hostConnRef.current = null;
    var code = mpRef.current.code;
    var p = new Peer(code + '-host');
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
    p.on('open', function () {
      if (promoting) {
        var oldHost = playersRef.current.find(function (pl) {
          return pl.isHost && pl.id !== myId;
        });
        setPlayersBoth(playersRef.current.map(function (pl) {
          return pl.id === myId ? Object.assign({}, pl, {
            isHost: true,
            offline: false
          }) : Object.assign({}, pl, {
            isHost: false,
            offline: oldHost && pl.id === oldHost.id ? true : pl.offline
          });
        }));
        hostBroadcast({
          type: 'PLAYERS_UPDATE',
          players: playersRef.current
        });
        if (boardRef.current.layout && mpRef.current.mode === 'coop') {
          setLayout(boardRef.current.layout);
          if (boardRef.current.nums) setNums(boardRef.current.nums);
        } // 接任房主補上自己的 layout state（boardRef 已由 MINE_DO 同步成真盤面）
        checkRaceEnd(); // 已離開的原房主標了 offline：若其他人都完賽/出局，本局可能就此可結算（原房主不標 offline 會永遠卡住結算，稽核修）
      }
    });
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
      }); // hub 模式把殼代表色帶給房主，房主名單用對顏色、PLAYERS_UPDATE 回來全員一致
      c.on('data', function (m) {
        return onMpData(m, c);
      });
      c.on('close', function () {
        return onHostConnClose();
      });
    });
  }
  function setupMp(sess) {
    var st = sess.settings || {};
    var itemDelayS = Number(st.itemStartTime);
    if (isNaN(itemDelayS)) itemDelayS = 60;
    itemDelayS = Math.max(0, Math.min(600, itemDelayS));
    var mpSizeId = st.sizeId === 'custom' ? 'custom' : Number(st.sizeId) || 9; // 'custom' 是字串：Number('custom')=NaN 會被 || 9 吞掉（舊寫法），自訂盤會變 9×9，必須先分流
    var mpCustom = null;
    if (mpSizeId === 'custom') {
      var rcS = regCustomSpec(st.custom);
      if (rcS) mpCustom = {
        w: rcS.w,
        h: rcS.h,
        mines: rcS.mines
      };else mpSizeId = 9;
    } // 房主/來賓都在進場時先註冊規格，後續所有 SIZES[sizeId] 查表才查得到
    mpRef.current = {
      on: true,
      isHost: !!sess.isHost,
      mode: sess.mode === 'coop' ? 'coop' : 'race',
      tourn: !!sess.tourn,
      tournInfo: sess.tourn || null,
      hub: !!sess.hub,
      code: sess.code,
      sizeId: mpSizeId,
      custom: mpCustom,
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
      }]; // hub 模式：房主代表色以殼帶入的為準；單機/獨立維持座位色
      if (sess.tourn && sess.tourn.roster) {
        sess.tourn.roster.forEach(function (e) {
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
      }
      setPlayersBoth(list);
      becomeHost(false);
      if (sess.hub && !sess.tourn) {
        // 房間框架一般對局：全員到齊自動開局
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
    // 平台房間框架：回等待室＝回殼的房間頁（比照數獨 handleBackToLobby/數橋 requestLobby：不分房主來賓一律通知殼，房主由殼廣播 return 帶全員、來賓只回自己）
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
    // 個人離開（其他人繼續）：先通知殼離房（endSession 清 inMatch/名單並切回多人入口），再做遊戲層清理——舊版只做本地清理、沒通知殼，殼還以為在對局中，人會卡在地雷頁、之後按多人連線又被 inMatch 劫回地雷頁
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

  // ---------- 平台底部列（PlatBar）：挖開/插旗模式切換（與遊戲內切換鈕同步） ----------
  var platBarRef = useRef(null);
  var platBarCfgRef = useRef(null);
  platBarCfgRef.current = {
    accent: ACCENT,
    onAction: function onAction(name) {
      if (name === 'mode-press') {
        setInputMode(function (m) {
          return m === 'dig' ? 'flag' : m === 'flag' ? 'draw' : 'dig';
        });
      } else if (name === 'draw-tool') {
        setDrawTool(payload);
      } else if (name === 'draw-erase-dbl') {
        clearOwnStrokes();
      } else if (name === 'draw-clear') {
        clearAllStrokes();
      }
      // 殼 PlatBar 左下角縮放組（＋/－/循環）：v1.31 只做了卡片內 🔍 那組、這組沒人接線 → 按了沒反應（使用者 2026-11-04 截圖回報）。
      // 接到與卡片內 🔍 相同的 zoom state，兩組永遠同步；數獨/數橋的 PlatBar 本來就有接，只有地雷漏了。
      else if (name === 'zoom-in') {
        stepZoom(0.25);
      } else if (name === 'zoom-out') {
        stepZoom(-0.25);
      } else if (name === 'zoom-cycle') {
        handleCycleZoom();
      }
    }
  };
  // F3（v1.56.0）：縮放過渡（FLIP 式）——版面直接跳到新尺寸，視覺先以 transform 從舊比例開始、200ms travel 曲線收回 1；
  // 不逐格動 layout、盤面與塗鴉層一起縮放；動畫中再按會以目前視覺比例為新起點 retarget；換盤面（spec 變）不播。
  useEffect(function () {
    pz().setRaw(zoom); // PlatZoom 持有同步（狀態真源仍是 zoom state，FLIP 動畫本體不動）
    var w = boardZoomRef.current;
    if (!w) {
      prevZoomRef.current = zoom;
      return;
    }
    var specKey = spec.w + 'x' + spec.h + '/' + spec.mines;
    if (prevZoomSpecRef.current !== specKey) {
      prevZoomSpecRef.current = specKey;
      prevZoomRef.current = zoom;
      w.style.transition = 'none';
      w.style.transform = '';
      return;
    }
    if (prevZoomRef.current === zoom) return;
    var cur = 1;
    var m = /matrix\(([^)]+)\)/.exec(w.style.transform || '');
    var cs = null;
    try {
      cs = window.getComputedStyle(w).transform;
    } catch (e) {}
    var mm = /matrix\(([^)]+)\)/.exec(cs || '');
    if (mm) cur = parseFloat(mm[1].split(',')[0]) || 1;else if (m) cur = parseFloat(m[1].split(',')[0]) || 1;
    var from = cur * (prevZoomRef.current / zoom);
    prevZoomRef.current = zoom;
    if (Math.abs(from - 1) < 0.01) {
      w.style.transform = '';
      return;
    }
    w.style.transition = 'none';
    w.style.transformOrigin = '50% 50%';
    w.style.transform = 'scale(' + from + ')';
    window.requestAnimationFrame(function () {
      w.style.transition = 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)';
      w.style.transform = 'scale(1)';
    });
  }, [zoom]);
  var platBarCfgStable = useRef(null);
  if (!platBarCfgStable.current) platBarCfgStable.current = {
    accent: ACCENT,
    onAction: function onAction(n, p) {
      if (platBarCfgRef.current) platBarCfgRef.current.onAction(n, p);
    }
  };
  useEffect(function () {
    if (typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'mines') return; // 底部列主人是另一款遊戲時不搶（錦標賽輪替時防翻跳）
    if (typeof window === 'undefined' || typeof window.PlatBar === 'undefined') return;
    var el = platBarRef.current;
    if (el) {
      // 自我修復（v1.55.1）：掛載節點被換掉/拆掉時自動重新 attach——完賽轉觀戰會把整個底部列連掛載點一起卸載，
      // 再來一局時 React 用新節點重建、screen 卻沒變，舊的 [screen] effect 永遠不重跑、殼抱著死節點整場沒工具列（使用者實機回報）
      if (window.PlatBar._el() !== el || !window.PlatBar._elConnected()) window.PlatBar.attach(el, platBarCfgStable.current);
    } else if (window.PlatBar.isAttached() && !window.PlatBar._elConnected()) {
      window.PlatBar.detach(window.PlatBar._el());
    }
  });
  useEffect(function () {
    if (typeof window === 'undefined' || typeof window.PlatBar === 'undefined' || !window.PlatBar.isAttached()) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'mines') return;
    window.PlatBar.update({
      mode: inputMode === 'flag' ? 1 : inputMode === 'draw' ? 2 : 0,
      modes: [{
        icon: '⛏️',
        label: '挖開'
      }, {
        icon: '🚩',
        label: '插旗'
      }, {
        icon: '🖌️',
        label: '塗鴉'
      }],
      modeTitle: '切換模式（挖開/插旗/塗鴉）',
      zoomLabel: zoomModeIdx === 0 ? zoom > 1 ? Math.round(zoom * 100) + '%' : '🔍' : ZOOM_GLYPHS[zoomModeIdx],
      zoomGlyph: ZOOM_GLYPHS[zoomModeIdx],
      showInput: false,
      inputMode: 'num',
      showDraw: inputMode === 'draw',
      drawTool: drawTool,
      showHostClear: !!(mpOn && mpRef.current.mode === 'coop' && mpRef.current.isHost)
    });
  });

  // ---------- 框架層 F2：PlatHome / PlatTopCard / PlatSetup / PlatTutorial（殼單一實作、本款只給 config 與內容） ----------
  function openMinesSetup(fromGame) {
    if (!window.PlatSetup) return;
    window.PlatSetup.show({
      accent: ACCENT,
      title: fromGame ? '⚙️ 設定盤面' : '👤 單機挑戰',
      subtitle: fromGame ? '選一個盤面大小，會立刻重開一局。' : '選一個盤面大小開始',
      options: [9, 16].map(function (sz) {
        return {
          id: sz,
          label: (sz === 9 ? '🌱 ' : '🔥 ') + SIZES[sz].name,
          sub: bestText(sz)
        };
      }),
      selectedId: sizeId === 9 || sizeId === 16 ? sizeId : null,
      mode: 'list',
      instant: true,
      custom: {
        label: '⚙️ 自訂盤面',
        fields: [{
          key: 'w',
          label: '寬度（左右格數）',
          min: 8,
          max: 30
        }, {
          key: 'h',
          label: '高度（上下格數）',
          min: 8,
          max: 24
        }, {
          key: 'mines',
          label: '地雷數',
          min: 5
        }],
        values: custCfg,
        validate: function validate(vals) {
          var cl = clampCustomSpec(vals.w, vals.h, vals.mines);
          return {
            values: cl,
            note: '範圍：寬 8–30、高 8–24、雷 5–' + (cl.w * cl.h - 9) + '（依目前寬高；首點保護需留 9 格空白）。超出範圍會自動修正，開始鈕顯示的就是實際會開的盤。',
            startText: '▶ 開始：' + cl.w + '×' + cl.h + '・' + cl.mines + ' 雷'
          };
        }
      },
      onStart: function onStart(id, vals) {
        if (id === 'custom') startCustom(vals);else newGame(Number(id));
      }
    });
  }
  // 教學第 1 步互動 demo（3×3 挖開練習）：PlatTutorial 的 mount 步，由本款以原生 DOM 渲染（行為與舊 React 版一致：洪水展開/踩雷/再試一次/音效/字幕）
  function mountTutDemo(el, api) {
    var VALS = [0, 1, -1, 0, 1, 1, 0, 0, 0];
    var open = new Array(9).fill(false),
      boom = false;
    el.innerHTML = '<div class="flex justify-center mb-3"><div class="grid grid-cols-3 gap-[3px]" data-mtut-grid="1"></div></div><div class="text-center" data-mtut-retry="1"></div>';
    var grid = el.querySelector('[data-mtut-grid]'),
      retryBox = el.querySelector('[data-mtut-retry]');
    function caption() {
      if (boom) return '💥 踩到地雷了！先看數字推理，避開最可疑的格子';
      if (open.filter(Boolean).length >= 8) return '✅ 全部挖開了！數字就是周圍 8 格的地雷數，你學會了';
      return '動手試試：點格子把安全的格子全部挖開——其中有一顆地雷，數字會給你提示';
    }
    function render() {
      grid.innerHTML = '';
      VALS.forEach(function (n, i) {
        var isOpen = open[i] || boom && n === -1;
        if (!isOpen) {
          var b = document.createElement('button');
          b.className = 'w-11 h-11 rounded-[4px] border border-orange-900/20';
          b.style.background = 'linear-gradient(145deg,#fdba74,#fb923c)';
          b.setAttribute('data-mtut-cell', String(i));
          b.addEventListener('click', function () {
            tap(i);
          });
          grid.appendChild(b);
        } else {
          var d = document.createElement('div');
          d.className = 'w-11 h-11 flex items-center justify-center font-black text-lg rounded-[4px] border border-orange-900/20';
          d.style.background = n === -1 ? '#fecaca' : '#f8fafc';
          if (n > 0) {
            d.style.color = NUM_COLORS[n];
            d.textContent = n;
          }
          if (n === -1) d.textContent = '💣';
          grid.appendChild(d);
        }
      });
      retryBox.innerHTML = '';
      if (boom) {
        var rb = document.createElement('button');
        rb.className = 'plat-btn-hard plat-btn-hard-2 px-4 py-1.5 bg-white border-2 border-slate-800 rounded-lg font-black text-sm text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)]';
        rb.textContent = '↺ 再試一次';
        rb.addEventListener('click', function () {
          open = new Array(9).fill(false);
          boom = false;
          render();
        });
        retryBox.appendChild(rb);
      }
      if (api && api.setCaption) api.setCaption(caption());
    }
    function tap(i) {
      if (VALS[i] === -1) {
        boom = true;
        platAudio().play('boom');
        render();
        return;
      }
      var stack = [i];
      while (stack.length) {
        var c = stack.pop();
        if (open[c]) continue;
        open[c] = true;
        if (VALS[c] === 0) {
          var cx = c % 3,
            cy = Math.floor(c / 3);
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
            var nx = cx + dx,
              ny = cy + dy;
            if (nx >= 0 && nx < 3 && ny >= 0 && ny < 3) stack.push(ny * 3 + nx);
          }
        }
      }
      platAudio().play('place');
      render();
    }
    render();
  }
  function openMinesTutorial() {
    if (!window.PlatTutorial) return;
    var chordCell = function chordCell(inner, cover) {
      return '<div class="w-11 h-11 relative flex items-center justify-center font-black text-lg rounded-[4px] border border-orange-900/20 overflow-hidden" style="background:#f8fafc">' + (inner || '') + (cover ? '<div class="mtut-chord-cover absolute inset-0" style="background:linear-gradient(145deg,#fdba74,#fb923c)"></div>' : '') + '</div>';
    };
    var steps = [{
      mount: mountTutDemo,
      caption: '動手試試：點格子把安全的格子全部挖開——其中有一顆地雷，數字會給你提示'
    }, {
      html: '<div class="flex justify-center mb-3"><div class="w-14 h-14 flex items-center justify-center rounded-[4px] border border-orange-900/20" style="background:linear-gradient(145deg,#fdba74,#fb923c)"><span class="mtut-flag text-3xl">🚩</span></div></div><div class="flex justify-center gap-2 mb-3"><span class="px-3 py-2 bg-white border-[3px] border-slate-800 rounded-xl font-black text-sm shadow-[2px_2px_0px_rgba(30,41,59,1)]">⛏️ 挖開</span><span class="mtut-chip px-3 py-2 border-[3px] border-slate-800 rounded-xl font-black text-sm shadow-[2px_2px_0px_rgba(30,41,59,1)]">🚩 插旗</span></div>',
      caption: '懷疑是地雷？切到「插旗」模式點它，或長按格子做記號'
    }, {
      html: '<div class="flex justify-center mb-3"><div class="relative"><div class="grid grid-cols-3 gap-[3px]">' + '<div class="w-11 h-11 flex items-center justify-center text-xl rounded-[4px] border border-orange-900/20" style="background:linear-gradient(145deg,#fdba74,#fb923c)">🚩</div>' + chordCell('<span class="mtut-chord-num" style="color:' + NUM_COLORS[2] + '">2</span>', true) + chordCell('<span class="mtut-chord-num" style="color:' + NUM_COLORS[1] + '">1</span>', true) + chordCell('<span class="mtut-chord-num" style="color:' + NUM_COLORS[1] + '">1</span>', true) + '<div class="w-11 h-11 flex items-center justify-center font-black text-lg rounded-[4px] border border-orange-900/20" style="background:#f8fafc;color:' + NUM_COLORS[1] + '">1</div>' + chordCell('', true) + chordCell('', true) + chordCell('<span class="mtut-chord-num" style="color:' + NUM_COLORS[1] + '">1</span>', true) + chordCell('<span class="mtut-chord-num" style="color:' + NUM_COLORS[2] + '">2</span>', true) + '</div><span class="mtut-finger2 absolute text-3xl pointer-events-none" style="left:63px;top:62px">👆</span></div></div>',
      caption: '數字旁的旗子數剛好等於數字時，再點數字格，周圍剩下的格子一次挖開'
    }, {
      html: '<div class="flex justify-center gap-8 mb-3"><div class="flex flex-col items-center gap-1"><div class="mtut-boom w-14 h-14 flex items-center justify-center text-3xl rounded-[4px] border border-orange-900/20" style="background:#e2e8f0">💣</div><span class="text-xs font-semibold text-slate-400">踩到雷</span></div><div class="flex flex-col items-center gap-1"><div class="w-14 h-14 flex items-center justify-center rounded-[4px] border border-orange-900/20" style="background:#f8fafc"><span class="mtut-trophy text-3xl">🏆</span></div><span class="text-xs font-semibold text-slate-400">全部挖開</span></div></div><div class="mt-3 pt-3 border-t-2 border-slate-200 font-bold text-slate-600 leading-relaxed text-left flex flex-col gap-2"><p>📅 每日一題：每天同一題（9×9），可以回補今年的舊題目，只有今天的會累積連續天數。</p><p>👥 多人競速：同一個盤面各玩各的，最快清完的人贏；踩到雷先扣 ❤️、愛心用完才出局，照當時進度排名。</p></div>',
      caption: '第一下點的格子跟周圍 8 格保證沒有雷；不是雷的格子全挖開就贏；挖到雷先扣一顆 ❤️，愛心用完才結束'
    }];
    window.PlatTutorial.show({
      accent: ACCENT,
      title: '❓ 玩法教學',
      steps: steps
    });
  }
  var platHomeCfgStable = useRef(null);
  if (!platHomeCfgStable.current) platHomeCfgStable.current = {
    accent: ACCENT,
    titleChars: ['踩', '地', '雷'],
    enName: 'Minesweeper',
    onAction: function onAction(name) {
      if (name === 'solo') openMinesSetup(false);else if (name === 'daily') startDaily(dailySelRef.current);else if (name === 'prev') setDailySel(shiftDate(dailySelRef.current, -1));else if (name === 'next') setDailySel(shiftDate(dailySelRef.current, 1));else if (name === 'cal') openDailyCal();else if (name === 'tutorial') openMinesTutorial();else if (name === 'lobby') {
        if (window.PLAT_show) window.PLAT_show('home');
      }
    }
  };
  useEffect(function () {
    // PlatHome 自我修復 attach（無依賴、每次 render 自我檢查，理由同 PlatBar v1.55.1）
    if (typeof window === 'undefined' || typeof window.PlatHome === 'undefined') return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'mines') return;
    if (screen !== 'home') {
      if (window.PlatHome.isAttached() && !window.PlatHome._elConnected()) window.PlatHome.detach(window.PlatHome._el());
      return;
    }
    var el = platHomeRef.current;
    if (el && (window.PlatHome._el() !== el || !window.PlatHome._elConnected())) window.PlatHome.attach(el, platHomeCfgStable.current);
  });
  useEffect(function () {
    if (typeof window === 'undefined' || typeof window.PlatHome === 'undefined' || !window.PlatHome.isAttached()) return;
    if (screen !== 'home') return;
    var recs = readDailyRecords(),
      streak = readDailyStreak();
    var done = recs[dailySel] != null;
    window.PlatHome.update({
      dailyDate: dailySel,
      dailyIsToday: dailySel === todayStr(),
      dailyDone: done,
      canPrev: dailySel > DAILY_MIN,
      canNext: dailySel < todayStr(),
      streak: streak.count || 0,
      bestText: done ? fmtTime(recs[dailySel]) : '',
      inPlatform: isPlat
    });
  });
  var platTopCfgStable = useRef(null);
  if (!platTopCfgStable.current) platTopCfgStable.current = {
    accent: ACCENT,
    logo: '💣',
    name: '踩地雷',
    frame: false,
    rulesHtml: '<ol class="list-decimal list-outside ml-4 space-y-1"><li>點格子挖開：數字代表周圍 8 格的地雷數，空白格會自動展開。</li><li>第一下點的格子＋周圍 8 格保證沒有地雷，放心開始。</li><li>覺得是雷就插旗：切到 🚩 插旗模式再點格子，或長按格子直接插旗。</li><li>數字和周圍的旗數一樣時，再點那個數字，可一次挖開周圍剩下的格子（挖開／插旗模式都可以）。</li></ol>',
    onAction: function onAction(name) {
      if (name === 'mute') {
        var m = platAudio().toggleMuted();
        setMuted(!!m);
      } else if (name === 'spec') openMinesSetup(true);else if (name === 'leave-home') setScreen('home');else if (name === 'leave-lobby') requestLobby();else if (name === 'leave-leave') leaveMatch();else if (name === 'leave-forceend') {
        if (window.__PLAT_TOURN_FORCEEND) window.__PLAT_TOURN_FORCEEND();
      }
    }
  };
  var platFrameCfgStable = useRef(null);
  if (!platFrameCfgStable.current) platFrameCfgStable.current = {
    paper: '#fff7ed',
    bodyCls: 'flex-1 w-full flex flex-col min-h-0'
  }; // 框紙色＝本款原外框色；bodyCls：捲動欄＋底部列要無 padding 的 flex 欄
  useEffect(function () {
    // PlatFrame 自我修復 attach（先於 PlatTopCard effect 宣告：同輪先建框、再掛頂欄）
    if (typeof window === 'undefined' || typeof window.PlatFrame === 'undefined') return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'mines') return;
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
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'mines') return;
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
    window.PlatTopCard.update({
      leaveIcon: mpOn ? '🔌' : '🏠',
      leaveLabel: mpOn ? '退出' : '主選單',
      modeChip: mpOn ? mpRef.current.mode === 'race' ? '⚔️ 競速對戰' : '🤝 合作模式' : null,
      dailyChip: dailyDate && !mpOn ? '每日 ' + dailyDate.slice(5) + (dailyDate !== todayStr() ? ' 補玩' : '') : null,
      specLabel: '⚙️ ' + spec["short"] + '・' + spec.mines + ' 雷',
      specClickable: !mpOn,
      statText: null,
      timerText: fmtTime(elapsed),
      muted: muted,
      players: [],
      leaveMenu: {
        mode: mpOn ? 'mp' : 'solo',
        canForceEnd: !!(mpOn && typeof window.__PLAT_TOURN_CAN_FORCEEND === 'function' && window.__PLAT_TOURN_CAN_FORCEEND())
      }
    });
  });

  // ---------- 盤面邊緣虛化＋自製卷軸指示條（使用者 2026-11-04 指示） ----------
  // 四邊（上下左右）都虛化：哪一邊還有沒看到的題目，那一邊就漸層虛化；捲到那一邊的邊緣（到底/到頂/到左/到右）就不用虛化、自動消失。
  // 另有細指示條（滑塊長度=可視比例、位置=捲動進度）；完全沒溢出時全部都不出現——玩家一眼就知道「現在看到的是全部還是部分」。
  // iOS 不顯示原生 scrollbar，所以指示條自己畫（桌面/Android 另有 CSS 原生 scrollbar 染色，見 style.css 的 .mines-board-scroll）。
  function updScrollUi() {
    var el = boardScrollRef.current;
    if (!el) return;
    var maxL = el.scrollWidth - el.clientWidth,
      maxT = el.scrollHeight - el.clientHeight;
    if (fadeRRef.current) fadeRRef.current.style.opacity = maxL - el.scrollLeft > 2 ? '1' : '0'; // 右邊還有題目
    if (fadeBRef.current) fadeBRef.current.style.opacity = maxT - el.scrollTop > 2 ? '1' : '0'; // 下邊還有題目
    if (fadeLRef.current) fadeLRef.current.style.opacity = el.scrollLeft > 2 ? '1' : '0'; // 左邊還有題目（已向右捲走）
    if (fadeTRef.current) fadeTRef.current.style.opacity = el.scrollTop > 2 ? '1' : '0'; // 上邊還有題目（已向下捲走）
    var tv = indVTrackRef.current,
      pv = indVRef.current;
    if (tv && pv) {
      var showV = maxT > 2;
      tv.style.display = showV ? 'block' : 'none';
      if (showV) {
        var thV = Math.max(18, Math.round(tv.clientHeight * el.clientHeight / el.scrollHeight));
        pv.style.height = thV + 'px';
        pv.style.top = Math.round((maxT > 0 ? el.scrollTop / maxT : 0) * Math.max(0, tv.clientHeight - thV)) + 'px';
      }
    }
    var th = indHTrackRef.current,
      ph = indHRef.current;
    if (th && ph) {
      var showH = maxL > 2;
      th.style.display = showH ? 'block' : 'none';
      if (showH) {
        var twH = Math.max(18, Math.round(th.clientWidth * el.clientWidth / el.scrollWidth));
        ph.style.width = twH + 'px';
        ph.style.left = Math.round((maxL > 0 ? el.scrollLeft / maxL : 0) * Math.max(0, th.clientWidth - twH)) + 'px';
      }
    }
  }
  useEffect(function () {
    updScrollUi();
  }); // 每次 render 後依實際捲動幾何校正（開局/縮放/換盤都會走到）

  // ---------- 平台倒數（PlatCountdown）：殼端共用元件，照數橋用法（cdNum 有值 show、null hide） ----------
  useEffect(function () {
    if (typeof window === 'undefined' || !window.PlatCountdown) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch !== 'mines') return;
    if (cdNum != null) window.PlatCountdown.show(cdNum);else window.PlatCountdown.hide();
  }, [cdNum]);

  // ---------- 平台結算（PlatResults）：多人競速/合作共用殼端結算卡（比照數橋：等待卡可關、關後觀戰面板常駐） ----------
  useEffect(function () {
    if (typeof window === 'undefined' || !window.PlatResults) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch !== 'mines') return;
    if (!mpRef.current.on) return;
    var M = mpRef.current,
      stage = null,
      specR = null;
    if (M.mode === 'race') {
      if (mpPhase === 'done' && raceFinal) stage = 'fin';else if (mpPhase === 'playing' && myOutcome) stage = 'wait';
    } else if (mpPhase === 'done' && (status === 'won' || status === 'lost')) stage = 'coop';
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
    var inTourn = !!M.tourn;
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
          if (leaveArmTimerRef.current) clearTimeout(leaveArmTimerRef.current);
          leaveArmTimerRef.current = setTimeout(function () {
            return setLeaveArm(false);
          }, 3500);
          return;
        }
        if (leaveArmTimerRef.current) clearTimeout(leaveArmTimerRef.current);
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
    }]).concat([homeBtn]); // 結算按鈕三款統一（美學稽核 V-11：同文案、同主次——看盤面／再來一局(primary)／回等待室／離開；錦標賽比照數獨數橋以回等待室為 primary）
    if (stage === 'fin') {
      specR = {
        accent: ACCENT,
        title: '競速結果',
        entries: raceFinal.entries,
        verdict: raceFinal.winnerUid === myId ? '🎉 你贏了！' : myOutcome === 'finished' ? '完賽了，本場名次如上！' : myOutcome === 'boom' ? '💥 你踩到雷出局了，名次照當時進度排。' : '本場比賽結束，名次如上。',
        buttons: stdBtns,
        onAction: acts
      };
    } else if (stage === 'wait') {
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
        return e.g.state === 'finished' || e.g.state === 'boom';
      });
      res2.sort(function (a, b) {
        return (a.g.state === 'finished' ? 0 : 1) - (b.g.state === 'finished' ? 0 : 1) || (a.g.state === 'finished' ? (a.g.timeMs || 0) - (b.g.timeMs || 0) : effOfGod(b.g) - effOfGod(a.g));
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
            right: e.g.state === 'finished' ? '⏱ ' + fmtTime(Math.floor((e.g.timeMs || 0) / 1000)) : '💥 ' + Math.floor(effOfGod(e.g) * 100) + '%'
          };
        }),
        verdict: myOutcome === 'finished' ? '🏁 你已完賽，先看看大家的盤面吧' : '💥 你踩到雷出局了，先看看大家的盤面吧',
        buttons: [{
          id: 'watch',
          label: '👁️ 轉變為上帝模式（觀戰）',
          kind: 'primary'
        }, homeBtn],
        onAction: acts
      };
    } else {
      specR = {
        accent: ACCENT,
        title: '合作結果',
        entries: playersRef.current.filter(function (p) {
          return !p.pending;
        }).map(function (p) {
          return {
            key: p.id,
            name: p.name,
            color: p.color,
            isMe: p.id === myId,
            right: ''
          };
        }),
        verdict: status === 'won' ? '🎉 合作成功！用時 ' + fmtTime(elapsed) : '💥 ' + (coopBoomBy || '有人') + ' 踩到地雷了，全隊出局',
        buttons: stdBtns,
        onAction: acts
      };
    }
    window.PlatResults.show(specR);
  });

  // ---------- 平台 hooks ----------
  var sessRef = useRef(null);
  var hubColorRef = useRef(null); // 殼帶入的代表色（大廳摩天輪選色；enter 時存下，hub 模式配色以它為準）
  useEffect(function () {
    if (typeof window === 'undefined' || !window.__PLAT_PLATFORM) return;
    window.__PLAT_HOOKS_mines = {
      enter: function enter(sess) {
        sessRef.current = sess || null;
        hubColorRef.current = sess && typeof sess.color === 'string' && sess.color ? sess.color : null; // 只驗非空字串：地雷 MP_COLORS 與殼色票是不同集合，不拿來驗
        // 開新局先清掉上一局的結算暫存（站規：新局絕不能重播上一局的結算）
        cleanupMp();
        if (typeof window !== 'undefined' && window.PlatTopCard) window.PlatTopCard.setRulesOpen(false); // 多人進場：規則面板收合
        setRaceFinal(null);
        finalRef.current = null;
        setMyOutcome(null);
        outcomeRef.current = null;
        setGodBoards({});
        godRef.current = {};
        dismissRef.current = null;
        setStatus('ready');
        statusRef.current = 'ready';
        setHitIdx(-1);
        setCells(null);
        setLayout(null);
        setNums(null);
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
        // 殼端身分同步（名條改色）：self 改自己那筆、非 self 以名字找 entry；房主改完廣播一次讓全員一致，來賓只改本地不送訊息
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
        // 殼端房主接管：我升格成房主就接手主持（名單保留、來賓會重新 JOIN）
        if (mpRef.current.on && !mpRef.current.isHost && typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.isHost) becomeHost(true);
      },
      debug: function debug() {
        return Object.assign({}, dbgRef.current, {
          mp: {
            on: mpRef.current.on,
            isHost: mpRef.current.isHost,
            mode: mpRef.current.mode,
            phase: mpRef.current.phase,
            tourn: mpRef.current.tourn
          },
          players: playersRef.current,
          god: godRef.current,
          "final": finalRef.current
        });
      }
    };
  }, []);

  // 問號干擾到期清除（500ms 掃一次過期的 fx，讓數字恢復顯示）
  useEffect(function () {
    if (!Object.keys(questionFx).length) return;
    var iv = setInterval(function () {
      var now = Date.now(),
        cur = questionFxRef.current,
        nxt = null;
      for (var k in cur) if (cur[k] <= now) {
        if (!nxt) nxt = Object.assign({}, cur);
        delete nxt[k];
      }
      if (nxt) {
        questionFxRef.current = nxt;
        setQuestionFx(nxt);
      }
    }, 500);
    return function () {
      return clearInterval(iv);
    };
  }, [questionFx]);

  // ---------- 渲染 ----------
  var gapPx = spec.w >= 14 ? 2 : 3; // 舊版以 sizeId===16 二分；改依盤寬通式（自訂尺寸同規：寬盤間隔 2、窄盤 3）
  // 盤面隨視窗放大（iPad/大螢幕不再縮成手機尺寸）：可用寬 = min(視窗, 720) − 根層 padding 24 − 卡片 padding/邊框 26
  var cellPx = Math.max(spec.w <= 10 ? 28 : 22, Math.min(spec.w <= 10 ? 64 : 38, Math.floor((Math.min(vpW, 720) - 50 - (spec.w - 1) * gapPx) / spec.w))); // 格長上下限舊版以 9/16 二分，改依盤寬通式（窄盤 28–64、寬盤 22–38，與舊 9×9/16×16 完全等值）；16×16 舊下限 18px 在手機上只剩 19px 一格、間隔 2px，手指/觸控筆必沾鄰格（誤觸主因之一）→ 下限拉到 22，超出螢幕時靠盤面橫向捲動
  var zCellPx = Math.max(14, Math.round(cellPx * zoom)); // 使用者縮放後的實際格長（zoom=1 即適應螢幕原尺寸）
  var colW = spec.w * cellPx + (spec.w - 1) * gapPx + 26; // 對局畫面所有欄位（標頭列/狀態列/進度/貢獻/PlatBar）與盤同寬，不再各寬各的
  function renderCell(i) {
    var st = cells[i],
      isMine = layout ? !!layout[i] : false,
      num = nums ? nums[i] : 0; // 合作觀戰者可能沒有完整 layout（只收已開格數字），要能容忍 null
    var content = '',
      bg = '',
      color = '',
      extra = {};
    if (st === 'x') {
      content = '✗';
      color = '#dc2626';
      bg = '#fecaca';
    } // 容錯踩雷格：引爆過、確認是雷，記 ✗ 續玩（任何狀態下都顯示 ✗，與最終出局的 💥 區分）
    else if (status === 'lost') {
      if (isMine && st !== 'f' && st !== 'L') {
        content = i === hitIdx ? '💥' : '💣';
        bg = i === hitIdx ? '#fca5a5' : '#e2e8f0';
      } else if (st === 'f' && !isMine) {
        content = '❌';
        bg = '#e2e8f0';
      } else if (st === 'f' || st === 'L') {
        content = '🚩';
        bg = '#e2e8f0';
      } else if (st === 'o') {
        content = num > 0 ? String(num) : '';
        color = NUM_COLORS[num] || '';
        bg = '#f1f5f9';
      } else {
        bg = 'linear-gradient(145deg,#fdba74,#fb923c)';
      }
    } else if (status === 'won' && isMine && st !== 'o') {
      content = '🚩';
      bg = '#e2e8f0';
    } else if (st === 'o') {
      content = num > 0 ? String(num) : '';
      color = NUM_COLORS[num] || '';
      bg = '#f8fafc';
      if (mpRef.current.on && mpRef.current.mode === 'coop' && ownArr && ownArr[i] >= 0) {
        var opC = players[ownArr[i]];
        if (opC) {
          bg = opC.color + '2e';
          extra = Object.assign({}, extra, {
            boxShadow: 'inset 0 0 0 2px ' + opC.color
          });
        }
      } // 合作貢獻著色：誰開的格就染誰的顏色
      var qfx = questionFx[i];
      if (qfx && qfx > Date.now() && num > 0) {
        content = '?';
        color = '#7c3aed';
        bg = '#ede9fe';
      } // 問號干擾：數字被蓋成問號（本地效果、到期自動恢復）
    } else if (st === 'f' || st === 'L') {
      content = '🚩';
      bg = st === 'L' ? 'linear-gradient(145deg,#bbf7d0,#4ade80)' : 'linear-gradient(145deg,#fdba74,#fb923c)';
      if (st === 'L') extra = Object.assign({}, extra, {
        boxShadow: 'inset 0 0 0 2px #16a34a'
      }); // 禮物鎖定旗：綠底＋綠環，跟一般旗區分
    } else {
      bg = 'linear-gradient(145deg,#fdba74,#fb923c)';
    }
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      "data-cell": i,
      className: "mine-cell flex items-center justify-center font-black rounded-[4px] border border-orange-900/20",
      style: Object.assign({
        width: zCellPx,
        height: zCellPx,
        background: bg,
        color: color,
        fontSize: zCellPx <= 22 ? 12 : Math.round(zCellPx * 0.5),
        lineHeight: 1
      }, extra),
      onClick: function onClick() {
        return onCellClick(i);
      },
      onPointerDown: function onPointerDown(e) {
        return onCellDown(i, e);
      },
      onPointerMove: onCellMove,
      onPointerUp: function onPointerUp(e) {
        return onCellUp(e, true);
      },
      onPointerLeave: function onPointerLeave(e) {
        return onCellUp(e, false);
      },
      onPointerCancel: onCellCancel,
      onContextMenu: function onContextMenu(e) {
        e.preventDefault();
        toggleFlag(i);
      }
    }, content);
  }
  function renderBoard() {
    if (!cells) return null;
    var rows = [];
    for (var y = 0; y < spec.h; y++) {
      var rowCells = [];
      for (var x = 0; x < spec.w; x++) rowCells.push(renderCell(y * spec.w + x));
      rows.push( /*#__PURE__*/React.createElement("div", {
        key: y,
        className: "flex",
        style: {
          gap: gapPx
        }
      }, rowCells));
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col items-center",
      style: {
        gap: gapPx
      }
    }, rows);
  }
  function bestText(sz) {
    var b = platSave().getStr('mines_best_' + sz, '');
    return b ? '最佳 ' + fmtTime(parseInt(b, 10)) : '';
  }

  // ---------- 上帝模式觀戰：只渲染對手已公開的盤面（已開格數字+插旗），不含雷位 ----------
  function renderGodBoard(g, szId) {
    var sp = SIZES[szId] || SIZES[9];
    var arr = (g.cells || '').split('');
    var px = sp.w >= 14 ? 21 : 38,
      gp = sp.w >= 14 ? 2 : 3; // 舊版以 szId===16 二分，改依規格寬度（自訂寬盤同規）
    var rows = [];
    for (var y = 0; y < sp.h; y++) {
      var rc = [];
      for (var x = 0; x < sp.w; x++) {
        var i = y * sp.w + x,
          st = arr[i];
        var content = '',
          bg = 'linear-gradient(145deg,#fdba74,#fb923c)',
          color = '';
        if (st === 'o') {
          var n = g.nums ? g.nums[i] : 0;
          if (n === -1) {
            content = '💣';
            bg = '#fecaca';
          } else {
            content = n > 0 ? String(n) : '';
            color = NUM_COLORS[n] || '';
            bg = '#f8fafc';
          }
        } else if (st === 'x') {
          content = '✗';
          color = '#dc2626';
          bg = '#fecaca';
        } // 容錯踩雷格（觀戰同步顯示）
        else if (st === 'f' || st === 'L') {
          content = '🚩';
        }
        rc.push( /*#__PURE__*/React.createElement("div", {
          key: i,
          className: "flex items-center justify-center font-black rounded-[4px] border border-orange-900/20",
          style: {
            width: px,
            height: px,
            background: bg,
            color: color,
            fontSize: sp.w >= 14 ? 12 : 19,
            lineHeight: 1
          }
        }, content));
      }
      rows.push( /*#__PURE__*/React.createElement("div", {
        key: y,
        className: "flex",
        style: {
          gap: gp
        }
      }, rc));
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col items-center",
      style: {
        gap: gp
      }
    }, rows);
  }
  function renderGodPanel() {
    if (!mpOn || mpRef.current.mode !== 'race') return null;
    if (mpPhase !== 'playing' && mpPhase !== 'done') return null;
    var specMode = iAmSpec();
    if (!myOutcome && !specMode) return null; // 還在比賽中：只顯示進度條，不開上帝面板
    var opps = players.filter(function (p) {
      return !p.spectator && !p.pending && p.id !== myId;
    });
    if (!opps.length) return null;
    var sel = godUid && opps.some(function (p) {
      return p.id === godUid;
    }) ? godUid : opps[0].id;
    var selP = opps.find(function (p) {
      return p.id === sel;
    });
    var g = godBoards[sel] || {
      progress: 0,
      state: 'playing',
      cells: '',
      nums: {}
    };
    var title = myOutcome === 'boom' ? '💥 已出局・觀戰中' : myOutcome === 'finished' ? '🏁 已完賽・觀戰中' : '👁️ 觀戰中';
    return /*#__PURE__*/React.createElement("div", {
      className: "w-full max-w-md mt-3 bg-white border-[3px] border-slate-800 rounded-xl p-3 shadow-[4px_4px_0px_rgba(30,41,59,1)] animate-fadeIn"
    }, /*#__PURE__*/React.createElement("div", {
      className: "font-black text-xl text-slate-800 mb-2"
    }, /*#__PURE__*/React.createElement("span", {
      key: title,
      className: "plat-lite-in",
      style: {
        display: 'inline-block'
      }
    }, title)), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-1.5 mb-2"
    }, opps.map(function (p) {
      var gg = godBoards[p.id] || {
        progress: 0,
        state: 'playing'
      };
      return /*#__PURE__*/React.createElement("button", {
        key: p.id,
        onClick: function onClick() {
          return setGodUid(p.id);
        },
        className: "text-xs font-black px-2 py-1 rounded-full border-2 flex items-center gap-1 active:translate-y-[1px]",
        style: p.id === sel ? {
          background: '#1e293b',
          color: '#fff',
          borderColor: '#1e293b'
        } : {
          background: '#fff',
          color: '#334155',
          borderColor: '#cbd5e1'
        }
      }, /*#__PURE__*/React.createElement("span", {
        className: "w-2.5 h-2.5 rounded-full border border-slate-800",
        style: {
          background: p.color
        }
      }), p.name, " ", gg.state === 'finished' ? '⏱ ' + fmtTime(Math.floor((gg.timeMs || 0) / 1000)) : gg.state === 'boom' ? /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCA5 ", /*#__PURE__*/React.createElement(PlatPct, {
        value: Math.floor(effOfGod(gg) * 100)
      })) : /*#__PURE__*/React.createElement(PlatPct, {
        value: Math.floor(effOfGod(gg) * 100)
      }));
    })), g.cells ? /*#__PURE__*/React.createElement("div", {
      style: {
        overflowX: 'auto',
        maxWidth: '100%'
      }
    }, renderGodBoard(g, mpRef.current.sizeId)) : /*#__PURE__*/React.createElement("p", {
      className: "font-bold text-slate-400 text-center py-3"
    }, "\u7B49\u5F85 ", selP ? selP.name : '對手', " \u7684\u76E4\u9762\u2026"));
  }

  // ---------- 每日一題月曆（規格比照數獨/數橋：固定 6 列、完成亮燈、未來反灰） ----------
  function openDailyCal() {
    if (window.PlatCalendar) window.PlatCalendar.show({
      accent: '#f97316',
      records: readDailyRecords(),
      selected: dailySel,
      onPick: function onPick(ds) {
        setDailySel(ds);
        startDaily(ds);
      }
    });
  } // 每日月曆已統一為殼端 PlatCalendar（v1.16）

  if (screen === 'home') {
    // 主畫面由殼 PlatHome 單一實作渲染（框架層 F2）；無殼環境（獨立開啟）才用下方最小備援
    return /*#__PURE__*/React.createElement("div", {
      key: "home",
      className: "min-h-screen w-full flex flex-col items-center p-4"
    }, /*#__PURE__*/React.createElement("div", {
      ref: platHomeRef,
      className: "contents"
    }), typeof window !== 'undefined' && !window.PlatHome && /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 flex flex-col items-center justify-center gap-4 p-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-6xl"
    }, "\uD83D\uDCA3"), /*#__PURE__*/React.createElement("div", {
      className: "font-black text-3xl text-slate-800"
    }, "\u8E29\u5730\u96F7 Minesweeper"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return newGame(sizeId === 16 ? 16 : 9);
      },
      className: "plat-btn-hard px-6 py-3 bg-[#f97316] border-4 border-slate-800 rounded-xl font-black text-xl"
    }, "\uD83D\uDC64 \u55AE\u6A5F\u6311\u6230"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return startDaily(todayStr());
      },
      className: "plat-btn-hard px-6 py-3 bg-white border-4 border-slate-800 rounded-xl font-black text-xl"
    }, "\uD83D\uDCC5 \u6BCF\u65E5\u4E00\u984C")));
  }
  if (screen === 'mp') {
    var M = mpRef.current;
    var szName = (SIZES[M.sizeId] || SIZES[9]).name;
    if (!M.tourn) {
      return /*#__PURE__*/React.createElement("div", {
        key: "mp",
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
      }, "\u6E96\u5099\u548C\u8A2D\u5B9A\u90FD\u5728\u623F\u9593\u9801\u5B8C\u6210\u4E86\uFF0C\u99AC\u4E0A\u958B\u59CB"))));
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
    var canStartW = M.isHost && racersW.length >= 2 && (pendW.length === 0 && allReadyW || waitedW >= 60000); // 錦標賽閘門比照數獨：全員到齊+全員準備，或等滿 60 秒（未到者開賽清席、遲到觀戰加入）
    var startNoteW = !M.isHost ? '' : racersW.length < 2 ? '等待選手加入（至少 2 位）…' : canStartW ? pendW.length ? '未到的選手將以觀戰身分加入' : '' : pendW.length ? '等待全員到齊…' : '等待全員準備（或 ' + Math.max(0, 60 - Math.floor(waitedW / 1000)) + ' 秒後開放開始）';
    var myEntryW = players.find(function (p) {
      return p.id === myId;
    });
    var tInfo = M.tournInfo || {};
    return /*#__PURE__*/React.createElement("div", {
      key: "mp",
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
    }, "\u672C\u5C40\uFF1A\u8E29\u5730\u96F7\u7AF6\u901F\u30FB", szName, "\u30FB\u5168\u54E1\u6E96\u5099\u597D\u623F\u4E3B\u624D\u80FD\u958B\u59CB\uFF0C\u6216\u7B49\u6EFF 1 \u5206\u9418\u5F37\u5236\u958B\u59CB"), /*#__PURE__*/React.createElement("div", {
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
      className: "plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 rounded-xl border-[3px] border-slate-800 font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)]" + (myReadySt ? ' bg-amber-400 text-slate-900' : ' bg-white text-slate-500')
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

  // ---------- 對局畫面（外框＋標頭帶比照數獨/數橋：點點外層＋1200px 邊框卡＋主題色標頭帶（列1 logo/計時/模式＋展開規則、列2 尺寸/功能鈕）＋狀態條＋盤面區＋PlatBar） ----------
  var over = status === 'won' || status === 'lost';
  var hbtn = "plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-white border-2 border-slate-800 rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_rgba(30,41,59,1)] flex items-center gap-1 text-slate-800 shrink-0";
  return /*#__PURE__*/React.createElement("div", {
    key: "game",
    className: "h-screen w-screen p-1 md:p-4 flex flex-col items-center font-sans relative",
    style: {
      backgroundColor: '#fdf3e7',
      backgroundImage: 'radial-gradient(#f7ddba 2px, transparent 2px)',
      backgroundSize: '12px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: platFrameRef,
    className: "w-full h-full"
  }), ptcSlot && ReactDOM.createPortal( /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-end gap-1 md:gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1 items-center shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setZoomOpen(!zoomOpen);
    },
    className: hbtn,
    title: "\u8ABF\u6574\u76E4\u9762\u5927\u5C0F\uFF08\u6BD4\u7167\u6578\u7368\u7684\u7E2E\u653E\uFF09"
  }, "\uD83D\uDD0D", zoom > 1 && /*#__PURE__*/React.createElement("span", {
    className: "ml-0.5 text-[10px]"
  }, Math.round(zoom * 100), "%")), /*#__PURE__*/React.createElement("span", {
    className: "plat-collapse-x" + (zoomOpen ? " open" : "")
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex gap-1 items-center whitespace-nowrap"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return stepZoom(-0.25);
    },
    className: hbtn,
    title: "\u7E2E\u5C0F",
    tabIndex: zoomOpen ? 0 : -1
  }, "\uFF0D"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return stepZoom(0.25);
    },
    className: hbtn,
    title: "\u653E\u5927",
    tabIndex: zoomOpen ? 0 : -1
  }, "\uFF0B"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      zoomModeIdxRef.current = 0;
      setZoomModeIdx(0);
      setZoom(pz().reset());
    },
    className: hbtn,
    title: "\u56DE\u5230\u9069\u61C9\u87A2\u5E55",
    tabIndex: zoomOpen ? 0 : -1
  }, "\u9069\u61C9"), /*#__PURE__*/React.createElement("button", {
    onClick: handleCycleZoom,
    className: hbtn,
    title: "\u5FAA\u74B0\u5207\u63DB\u7E2E\u653E\u6A21\u5F0F\uFF08\u81EA\u52D5\u9069\u61C9\uFF09",
    tabIndex: zoomOpen ? 0 : -1
  }, ZOOM_GLYPHS[zoomModeIdx])))), !mpOn && /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      if (dailyDate) startDaily(dailyDate);else newGame(sizeId);
    },
    className: hbtn,
    title: "\u91CD\u958B\u4E00\u5C40"
  }, "\uD83D\uDD04", /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline ml-1"
  }, "\u91CD\u958B")), !mpOn && /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setSaveCode('');
      setShowSaveModal(true);
    },
    className: hbtn,
    title: "\u5B58\u6A94/\u8B80\u6A94\uFF08\u9032\u5EA6\u4EE3\u78BC\uFF09"
  }, "\uD83D\uDCBE", /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline ml-1"
  }, "\u5B58\u6A94"))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center justify-between px-2 md:px-3 py-1.5 bg-white/60 border-b-2 border-slate-200 gap-x-2 gap-y-1 -mx-2 md:-mx-4 -mb-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-black text-base md:text-lg text-slate-800 bg-white border-2 border-slate-800 rounded-lg px-2 md:px-3 py-1 shrink-0"
  }, "\uD83D\uDCA3 ", spec.mines - flagsUsed, Math.floor(spec.mines / 10) > 0 && /*#__PURE__*/React.createElement("span", {
    className: "ml-1",
    style: {
      fontSize: 13
    },
    title: "\u611B\u5FC3\uFF1D\u9084\u80FD\u8E29\u932F\u7684\u547D\uFF08\u5BB9\u932F\u6B21\u6578\uFF0B1\uFF09\uFF1A\u8E29\u5230\u96F7\u5C11\u4E00\u9846\u3001\u8B8A\u7070\uFF0C\u6B78\u96F6\u5F8C\u518D\u8E29\u5C31\u51FA\u5C40"
  }, Array.from({
    length: Math.floor(spec.mines / 10) + 1
  }).map(function (_, hi) {
    return /*#__PURE__*/React.createElement("span", {
      key: hi,
      style: hi < mistLeft + 1 ? undefined : {
        filter: 'grayscale(1)',
        opacity: 0.35
      }
    }, "\u2764\uFE0F");
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex bg-white border-2 border-slate-800 rounded-lg overflow-hidden font-black shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    "data-mode": "dig",
    onClick: function onClick() {
      return setInputMode('dig');
    },
    className: "px-2.5 md:px-4 py-1.5 text-sm md:text-base",
    style: inputMode === 'dig' ? {
      background: ACCENT,
      color: '#fff'
    } : {
      color: '#64748b'
    }
  }, "\u26CF\uFE0F \u6316\u958B"), /*#__PURE__*/React.createElement("button", {
    "data-mode": "flag",
    onClick: function onClick() {
      return setInputMode('flag');
    },
    className: "px-2.5 md:px-4 py-1.5 text-sm md:text-base",
    style: inputMode === 'flag' ? {
      background: '#dc2626',
      color: '#fff'
    } : {
      color: '#64748b'
    }
  }, "\uD83D\uDEA9 \u63D2\u65D7")), /*#__PURE__*/React.createElement("div", {
    className: "font-black text-slate-500 text-sm whitespace-nowrap shrink-0 cursor-pointer select-none ml-auto",
    onClick: toggleProgMode
  }, progMode === 'bv' ? '進度（3BV）' : '開格 ', /*#__PURE__*/React.createElement(PlatPct, {
    value: Math.floor((progMode === 'bv' ? effProg : progress) * 100)
  }), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, status === 'ready' ? '・點任意格開始' : status === 'playing' ? '・排雷中…' : '')))), ptcSlot), showSaveModal && !mpOn && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#fff7ed] border-[4px] border-[#1e293b] rounded-2xl p-6 shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full max-w-md animate-popIn"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-slate-800 mb-2 border-b-4 border-blue-500 inline-block pb-1"
  }, "\uD83D\uDCBE \u5B58\u6A94\u8207\u8B80\u6A94"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-bold text-slate-600 mb-4"
  }, "\u5C07\u9032\u5EA6\u8F49\u63DB\u70BA\u4EE3\u78BC\uFF0C\u4E0B\u6B21\u8CBC\u4E0A\u4EE3\u78BC\u5373\u53EF\u6062\u5FA9\uFF01"), /*#__PURE__*/React.createElement("div", {
    className: "mb-6"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleSaveCode,
    className: "plat-btn-hard w-full py-3 bg-blue-500 text-white border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] mb-3 text-base md:text-lg"
  }, "\u7522\u751F\u9032\u5EA6\u4EE3\u78BC (\u81EA\u52D5\u8907\u88FD)"), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("textarea", {
    id: "saveCodeTextarea",
    value: saveCode,
    onChange: function onChange(e) {
      return setSaveCode(e.target.value);
    },
    placeholder: "\u9EDE\u64CA\u4E0A\u65B9\u6309\u9215\u751F\u6210\uFF0C\u6216\u662F\u624B\u52D5\u8CBC\u4E0A\u820A\u4EE3\u78BC\u81F3\u6B64\u8655",
    rows: "4",
    className: "w-full border-4 border-slate-800 rounded-xl p-3 pb-12 font-mono text-sm shadow-inner outline-none focus:bg-blue-50 break-all bg-white"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: handleQuickPaste,
    className: "plat-btn-hard plat-btn-hard-2 absolute bottom-3 right-3 bg-[#f97316] text-slate-900 px-3 py-1.5 rounded-lg text-sm font-black border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)]"
  }, "\uD83D\uDCCB \u5FEB\u901F\u8CBC\u4E0A"))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setShowSaveModal(false);
    },
    className: "plat-btn-hard flex-1 py-3 bg-white border-4 border-slate-800 rounded-xl font-black text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)]"
  }, "\u95DC\u9589"), /*#__PURE__*/React.createElement("button", {
    onClick: handleLoadCode,
    className: "plat-btn-hard flex-1 py-3 bg-emerald-400 text-slate-900 border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)]"
  }, "\u8F09\u5165\u4EE3\u78BC")))), frameBody && ReactDOM.createPortal( /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto min-h-0 flex flex-col items-center px-2 py-2 w-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative shrink-0",
    style: {
      maxWidth: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: boardScrollRef,
    onScroll: updScrollUi,
    className: "mines-board-scroll bg-white/70 border-[3px] border-slate-800 rounded-xl p-2.5 shadow-[4px_4px_0px_rgba(30,41,59,1)] animate-fadeIn",
    style: {
      maxWidth: '100%',
      overflowX: 'auto',
      overflowY: zoom > 1 ? 'auto' : 'visible',
      maxHeight: zoom > 1 ? '68vh' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: boardZoomRef,
    style: {
      width: 'max-content',
      margin: '0 auto',
      position: 'relative'
    }
  }, renderBoard(), /*#__PURE__*/React.createElement("svg", {
    ref: doodleSvgRef,
    viewBox: '0 0 1000 ' + 1000 * spec.h / spec.w,
    preserveAspectRatio: "none",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      pointerEvents: inputMode === 'draw' ? 'auto' : 'none',
      touchAction: 'none',
      zIndex: 5
    },
    onPointerDown: onDoodleDown,
    onPointerMove: onDoodleMove,
    onPointerUp: onDoodleUp,
    onPointerCancel: onDoodleUp
  }, strokes.map(function (sv) {
    return /*#__PURE__*/React.createElement("path", {
      key: sv.id,
      d: 'M ' + sv.pts.map(function (pt) {
        return pt[0] + ' ' + pt[1];
      }).join(' L '),
      fill: "none",
      stroke: sv.color,
      strokeOpacity: mpOn && sv.uid !== myId ? 0.55 : 0.9,
      strokeWidth: "18",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    });
  }), livePts && livePts.length > 1 && /*#__PURE__*/React.createElement("path", {
    d: 'M ' + livePts.map(function (pt) {
      return pt[0] + ' ' + pt[1];
    }).join(' L '),
    fill: "none",
    stroke: myStrokeColor(),
    strokeOpacity: "0.9",
    strokeWidth: "18",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })))), /*#__PURE__*/React.createElement("div", {
    ref: fadeRRef,
    style: {
      position: 'absolute',
      top: 3,
      right: 3,
      bottom: 3,
      width: 30,
      pointerEvents: 'none',
      opacity: 0,
      transition: 'opacity .25s',
      background: 'linear-gradient(to right, rgba(255,251,243,0), rgba(255,251,243,.96))',
      borderTopRightRadius: 9,
      borderBottomRightRadius: 9
    }
  }), /*#__PURE__*/React.createElement("div", {
    ref: fadeBRef,
    style: {
      position: 'absolute',
      left: 3,
      right: 3,
      bottom: 3,
      height: 30,
      pointerEvents: 'none',
      opacity: 0,
      transition: 'opacity .25s',
      background: 'linear-gradient(to bottom, rgba(255,251,243,0), rgba(255,251,243,.96))',
      borderBottomLeftRadius: 9,
      borderBottomRightRadius: 9
    }
  }), /*#__PURE__*/React.createElement("div", {
    ref: fadeLRef,
    style: {
      position: 'absolute',
      top: 3,
      left: 3,
      bottom: 3,
      width: 30,
      pointerEvents: 'none',
      opacity: 0,
      transition: 'opacity .25s',
      background: 'linear-gradient(to left, rgba(255,251,243,0), rgba(255,251,243,.96))',
      borderTopLeftRadius: 9,
      borderBottomLeftRadius: 9
    }
  }), /*#__PURE__*/React.createElement("div", {
    ref: fadeTRef,
    style: {
      position: 'absolute',
      left: 3,
      right: 3,
      top: 3,
      height: 30,
      pointerEvents: 'none',
      opacity: 0,
      transition: 'opacity .25s',
      background: 'linear-gradient(to top, rgba(255,251,243,0), rgba(255,251,243,.96))',
      borderTopLeftRadius: 9,
      borderTopRightRadius: 9
    }
  }), /*#__PURE__*/React.createElement("div", {
    ref: indVTrackRef,
    style: {
      position: 'absolute',
      top: 8,
      bottom: 8,
      right: 5,
      width: 6,
      borderRadius: 3,
      background: 'rgba(30,41,59,.14)',
      display: 'none',
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: indVRef,
    style: {
      position: 'absolute',
      left: 0,
      width: '100%',
      borderRadius: 3,
      background: '#f97316',
      border: '1px solid rgba(30,41,59,.55)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    ref: indHTrackRef,
    style: {
      position: 'absolute',
      left: 8,
      right: 8,
      bottom: 5,
      height: 6,
      borderRadius: 3,
      background: 'rgba(30,41,59,.14)',
      display: 'none',
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: indHRef,
    style: {
      position: 'absolute',
      top: 0,
      height: '100%',
      borderRadius: 3,
      background: '#f97316',
      border: '1px solid rgba(30,41,59,.55)'
    }
  }))), mpOn && mpRef.current.mode === 'race' && mpRef.current.itemsAllow && mpPhase === 'playing' && !myOutcome && !iAmSpec() && /*#__PURE__*/React.createElement("div", {
    className: "w-full mt-2 flex items-center justify-center gap-2 shrink-0",
    style: {
      width: colW,
      maxWidth: '100%'
    }
  }, /*#__PURE__*/React.createElement("button", {
    "data-fly-me": "gift",
    onClick: function onClick() {
      return useGift();
    },
    disabled: myItems.gift <= 0,
    className: "plat-btn-hard plat-btn-hard-3 relative w-14 h-14 shrink-0 rounded-full bg-white border-[3px] border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] disabled:opacity-40 text-2xl",
    title: "\u79AE\u7269\uFF1A\u5E6B\u81EA\u5DF1\u628A\u4E00\u9846\u5730\u96F7\u6A19\u4E0A\u65D7\u5B50\u4E26\u9396\u5B9A\uFF08\u81EA\u5DF1\u6309\u624D\u767C\u52D5\uFF09"
  }, "\uD83C\uDF81", myItems.gift > 0 && /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-emerald-500 text-white text-xs font-black border-2 border-slate-800 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(PlatNum, {
    value: myItems.gift
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return fireItem('question');
    },
    disabled: myItems.question <= 0,
    className: "plat-btn-hard plat-btn-hard-3 relative w-14 h-14 shrink-0 rounded-full bg-white border-[3px] border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] disabled:opacity-40 text-2xl",
    title: "\u554F\u865F\u5E72\u64FE\uFF1A\u628A\u5C0D\u624B 3\u20136 \u500B\u9084\u6C92\u78BA\u5B9A\u7684\u6578\u5B57\u8B8A\u6210\u554F\u865F\uFF0810 \u79D2\uFF09"
  }, "\u2753", myItems.question > 0 && /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-violet-600 text-white text-xs font-black border-2 border-slate-800 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(PlatNum, {
    value: myItems.question
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return fireItem('backfill');
    },
    disabled: myItems.backfill <= 0,
    className: "plat-btn-hard plat-btn-hard-3 relative w-14 h-14 shrink-0 rounded-full bg-white border-[3px] border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] disabled:opacity-40 text-2xl",
    title: "\u56DE\u586B\uFF1A\u628A\u5C0D\u624B\u5DF2\u6253\u958B\u7684\u4E00\u7247\u683C\u5B50\uFF083\xD73\uFF0C\u9023\u9396\u7A7A\u683C\u6574\u7247\uFF09\u84CB\u56DE\u53BB"
  }, "\u23EA", myItems.backfill > 0 && /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-amber-500 text-white text-xs font-black border-2 border-slate-800 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(PlatNum, {
    value: myItems.backfill
  })))), itemToast && /*#__PURE__*/React.createElement("div", {
    className: "fixed left-1/2 bottom-24 z-[96] -translate-x-1/2 bg-slate-900/90 text-white font-black text-sm px-4 py-2 rounded-full shadow-lg animate-popIn text-center",
    style: {
      maxWidth: '92vw'
    }
  }, itemToast), mpOn && mpRef.current.mode === 'coop' && ownArr && function () {
    var cc = players.map(function (p, ix) {
      return {
        p: p,
        n: ownArr.reduce(function (a, o) {
          return a + (o === ix ? 1 : 0);
        }, 0)
      };
    }).filter(function (c) {
      return !c.p.spectator && !c.p.pending;
    });
    var tot = cc.reduce(function (a, c) {
      return a + c.n;
    }, 0);
    return /*#__PURE__*/React.createElement("div", {
      className: "w-full mt-2",
      style: {
        width: colW,
        maxWidth: '100%'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex h-3.5 rounded-full overflow-hidden border-2 border-slate-800 bg-white"
    }, tot > 0 && cc.map(function (c) {
      return c.n > 0 ? /*#__PURE__*/React.createElement("div", {
        key: c.p.id,
        style: {
          width: c.n / tot * 100 + '%',
          background: c.p.color
        }
      }) : null;
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-1.5 mt-1.5"
    }, cc.map(function (c) {
      return /*#__PURE__*/React.createElement("span", {
        key: c.p.id,
        className: "text-xs font-black px-2 py-1 rounded-full border-2 border-slate-300 bg-white flex items-center gap-1"
      }, /*#__PURE__*/React.createElement("span", {
        className: "w-2.5 h-2.5 rounded-full border border-slate-800",
        style: {
          background: c.p.color
        }
      }), c.p.name, " \u958B\u4E86 ", c.n, " \u683C", tot > 0 ? '・' + Math.round(c.n / tot * 100) + '%' : '');
    })));
  }(), mpOn && mpRef.current.mode === 'race' && mpPhase === 'playing' && !myOutcome && !iAmSpec() && /*#__PURE__*/React.createElement("div", {
    className: "w-full mt-2 flex flex-wrap gap-1.5",
    style: {
      width: colW,
      maxWidth: "100%"
    }
  }, players.filter(function (p) {
    return !p.spectator && !p.pending && p.id !== myId;
  }).map(function (p) {
    var g = godBoards[p.id] || {
      progress: 0,
      state: 'playing'
    };
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      "data-fly-uid": p.id,
      className: "shrink-0 flex flex-col gap-0.5 border-2 border-slate-800 rounded px-1.5 py-0.5 relative bg-white"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute left-0 top-0 bottom-0 w-1 rounded-l-[1px]",
      style: {
        background: p.color
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-1 text-[10px] md:text-xs font-bold text-slate-800 pl-1.5 whitespace-nowrap"
    }, p.name, " ", g.state === 'finished' ? /*#__PURE__*/React.createElement("span", null, "\uD83C\uDFC1") : g.state === 'boom' ? /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCA5") : /*#__PURE__*/React.createElement("span", {
      className: "text-emerald-600 font-mono ml-1"
    }, /*#__PURE__*/React.createElement(PlatPct, {
      value: Math.floor(effOfGod(g) * 100)
    }))), /*#__PURE__*/React.createElement("div", {
      className: "w-24 md:w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-1.5 relative border border-slate-300"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full plat-pbar",
      style: {
        width: Math.floor(effOfGod(g) * 100) + '%',
        background: p.color
      }
    })));
  })), renderGodPanel()), /*#__PURE__*/React.createElement("div", {
    ref: platBarRef,
    className: "h-16 shrink-0 w-full"
  })), frameBody), over && !mpOn && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border-4 border-slate-800 rounded-xl shadow-[10px_10px_0px_rgba(30,41,59,1)] max-w-sm w-full p-6 text-center animate-popIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-5xl mb-2"
  }, status === 'won' ? '🎉' : '💥'), /*#__PURE__*/React.createElement("h3", {
    className: "font-black text-2xl text-slate-800 mb-1"
  }, status === 'won' ? '全部排完了！' : '踩到地雷！'), /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-slate-500 mb-4"
  }, status === 'won' ? '用時 ' + fmtTime(elapsed) + (dailyDate ? '・🔥 連續 ' + (readDailyStreak().count || 0) + ' 天' : '') : progMode === 'bv' ? '進度（3BV）' + Math.floor(effProg * 100) + '%' : '開格 ' + Math.floor(progress * 100) + '%'), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      if (dailyDate) startDaily(dailyDate);else newGame(sizeId);
    },
    className: "plat-btn-hard plat-btn-hard-3 w-full py-3 bg-[#f97316] border-[3px] border-slate-800 rounded-xl font-black text-lg text-slate-900 shadow-[3px_3px_0px_rgba(30,41,59,1)]"
  }, "\uD83D\uDD01 \u518D\u4F86\u4E00\u5C40"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setScreen('home');
    },
    className: "plat-btn-hard plat-btn-hard-3 w-full py-2.5 bg-white border-[3px] border-slate-800 rounded-xl font-black text-slate-700 shadow-[3px_3px_0px_rgba(30,41,59,1)]"
  }, "\u56DE\u4E3B\u9078\u55AE")))));
}
ReactDOM.createRoot(document.getElementById('mines-root')).render(React.createElement(window.PlatBoundary, null, React.createElement(MinesGame)));