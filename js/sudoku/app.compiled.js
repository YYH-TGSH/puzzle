"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw new Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw new Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : String(i); }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
// 數獨 App：React 元件（大廳、多人連線、對戰、道具）
// 由 sudoku-v3.13.4.html 拆出；引擎函數在 js/engine.js

var _React = React,
  useState = _React.useState,
  useEffect = _React.useEffect,
  useMemo = _React.useMemo,
  useRef = _React.useRef;
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
function GameTimer(_ref) {
  var startTime = _ref.startTime,
    endTime = _ref.endTime,
    isRunning = _ref.isRunning,
    matchPhase = _ref.matchPhase;
  var _useState = useState(Date.now()),
    _useState2 = _slicedToArray(_useState, 2),
    now = _useState2[0],
    setNow = _useState2[1];
  useEffect(function () {
    if (!isRunning) return;
    setNow(Date.now());
    var t = setInterval(function () {
      return setNow(Date.now());
    }, 1000);
    return function () {
      return clearInterval(t);
    };
  }, [isRunning, startTime]);
  var secs = 0;
  if (matchPhase === 'playing' || matchPhase === 'finished') {
    secs = Math.max(0, Math.floor(((endTime || now) - startTime) / 1000));
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      color: matchPhase === 'finished' ? '#ff4444' : 'white',
      fontWeight: 'bold',
      fontSize: '1.1em'
    }
  }, "\u23F1 ", formatTime(secs));
}
function platTimeOffset() {
  try {
    return window.__PLAT_NET && window.__PLAT_NET.timeOffset || 0;
  } catch (e) {
    return 0;
  }
} // 房主時鐘偏移（稽核 D-05）：殼以 roster 時間戳估計，房主/單機恆 0
function SudokuGame() {
  var _SIZES$find, _DIFFICULTIES$find;
  var playerIdRef = useRef(function () {
    try {
      var K = 'plat_uid_sudoku';
      var tab = sessionStorage.getItem(K + '_tab');
      if (!tab) {
        tab = Math.random().toString(36).substring(2, 8);
        try {
          sessionStorage.setItem(K + '_tab', tab);
        } catch (e) {}
      }
      var claim = null;
      try {
        claim = JSON.parse(localStorage.getItem(K + '_claim') || 'null');
      } catch (e) {}
      if (claim && claim.tab !== tab && Date.now() - claim.ts < 8000) {
        // 同瀏覽器另一個分頁正在用正規 uid（雙分頁/同機雙開測試）：本分頁改用分頁專屬 uid，避免兩邊同 uid 撞成同一個人
        var alt = sessionStorage.getItem(K + '_alt');
        if (!alt) {
          alt = Math.random().toString(36).substring(2, 12);
          try {
            sessionStorage.setItem(K + '_alt', alt);
          } catch (e) {}
        }
        return alt;
      }
      var beat = function beat() {
        try {
          localStorage.setItem(K + '_claim', JSON.stringify({
            tab: tab,
            ts: Date.now()
          }));
        } catch (e) {}
      };
      beat(); // interval id 存到 window 並先清舊的（稽核 D-06：平台 REBOOT 重跑程式碼時舊 interval 不會疊加）
      var _ct = window.__platClaimTimers || (window.__platClaimTimers = {});
      if (_ct[K]) clearInterval(_ct[K]);
      _ct[K] = setInterval(beat, 3000);
      var u = localStorage.getItem(K);
      if (!u) {
        u = Math.random().toString(36).substring(2, 12);
        localStorage.setItem(K, u);
      }
      return u;
    } catch (e) {
      return Math.random().toString(36).substring(2, 12);
    }
  }()); // 持久 uid：同裝置重連同房間＝同座位（重連回座）；同瀏覽器多分頁僅第一個分頁用正規 uid
  var myId = playerIdRef.current;
  var myNameRef = useRef("");
  var lastSeenRef = useRef({}); // 在線心跳：uid → 最後收到其訊息的時間（房主端判定離線用）
  var tournRosterRef = useRef(null); // 五戰名單帶入：本局預期選手（殼 sess.tourn.roster），等待室先種灰色未到席位
  var platTournLockRef = useRef(false); // 五戰鎖定（ref 版，完賽結算判定用）
  var hostSeenRef = useRef(0); // 來賓端：最後收到房主訊息的時間
  var lastPingRef = useRef(0);
  var myColorRef = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);
  var emptyLevelData = {
    sizeDef: SIZES[1],
    diffDef: DIFFICULTIES[1],
    cells: []
  };
  var initialDataRef = useRef(emptyLevelData);
  var _useState3 = useState('home'),
    _useState4 = _slicedToArray(_useState3, 2),
    screen = _useState4[0],
    setScreen = _useState4[1];
  var screenRef = useRef('home');
  useEffect(function () {
    screenRef.current = screen;
  }, [screen]);
  var _useState5 = useState('none'),
    _useState6 = _slicedToArray(_useState5, 2),
    engine = _useState6[0],
    setEngine = _useState6[1];
  var _useState7 = useState(9),
    _useState8 = _slicedToArray(_useState7, 2),
    sizeId = _useState8[0],
    setSizeId = _useState8[1];
  var _useState9 = useState('medium'),
    _useState10 = _slicedToArray(_useState9, 2),
    diffId = _useState10[0],
    setDiffId = _useState10[1];
  var _useState11 = useState(initialDataRef.current),
    _useState12 = _slicedToArray(_useState11, 2),
    levelData = _useState12[0],
    setLevelData = _useState12[1];
  var _useState13 = useState(initialDataRef.current.cells),
    _useState14 = _slicedToArray(_useState13, 2),
    cells = _useState14[0],
    setCells = _useState14[1];
  var _useState15 = useState([]),
    _useState16 = _slicedToArray(_useState15, 2),
    localCells = _useState16[0],
    setLocalCells = _useState16[1];
  var solutionGridRef = useRef(null);
  var _useState17 = useState({}),
    _useState18 = _slicedToArray(_useState17, 2),
    ghostHints = _useState18[0],
    setGhostHints = _useState18[1];
  var _useState19 = useState(false),
    _useState20 = _slicedToArray(_useState19, 2),
    isBrawlMode = _useState20[0],
    setIsBrawlMode = _useState20[1];
  var _useState21 = useState([]),
    _useState22 = _slicedToArray(_useState21, 2),
    brawlWinners = _useState22[0],
    setBrawlWinners = _useState22[1];
  var _useState23 = useState({
      winnersCount: 3,
      allowQuickFill: false,
      allowTraversal: false,
      allowYellowHint: false,
      hideAnswers: true,
      allowOthersToPlayAgain: true,
      allowGifts: true,
      showNumbersInGodMode: false,
      allowWeapons: true,
      weaponStartTime: 60
    }),
    _useState24 = _slicedToArray(_useState23, 2),
    brawlSettings = _useState24[0],
    setBrawlSettings = _useState24[1];
  var _useState25 = useState(false),
    _useState26 = _slicedToArray(_useState25, 2),
    showBrawlSettings = _useState26[0],
    setShowBrawlSettings = _useState26[1];
  var _useState27 = useState(null),
    _useState28 = _slicedToArray(_useState27, 2),
    winner = _useState28[0],
    setWinner = _useState28[1];
  var isWinnerDeclaredRef = useRef(false);
  var lastWinInfoRef = useRef(null); // 最近一次完賽資訊（GHOST_I_WON 補送用）
  var winResentRef = useRef(0);
  var _useState29 = useState(false),
    _useState30 = _slicedToArray(_useState29, 2),
    showSetupModal = _useState30[0],
    setShowSetupModal = _useState30[1];
  var _useState31 = useState(9),
    _useState32 = _slicedToArray(_useState31, 2),
    tempSizeId = _useState32[0],
    setTempSizeId = _useState32[1];
  var _useState33 = useState('medium'),
    _useState34 = _slicedToArray(_useState33, 2),
    tempDiffId = _useState34[0],
    setTempDiffId = _useState34[1];
  var _useState35 = useState('playing'),
    _useState36 = _slicedToArray(_useState35, 2),
    matchPhase = _useState36[0],
    setMatchPhase = _useState36[1];
  var _useState37 = useState(null),
    _useState38 = _slicedToArray(_useState37, 2),
    countdownTarget = _useState38[0],
    setCountdownTarget = _useState38[1];
  var _useState39 = useState(null),
    _useState40 = _slicedToArray(_useState39, 2),
    countdownValue = _useState40[0],
    setCountdownValue = _useState40[1];
  var _useState41 = useState(false),
    _useState42 = _slicedToArray(_useState41, 2),
    isSpectator = _useState42[0],
    setIsSpectator = _useState42[1];
  var _useState43 = useState([]),
    _useState44 = _slicedToArray(_useState43, 2),
    strokes = _useState44[0],
    setStrokes = _useState44[1];
  var _useState45 = useState([]),
    _useState46 = _slicedToArray(_useState45, 2),
    history = _useState46[0],
    setHistory = _useState46[1];
  var _useState47 = useState(false),
    _useState48 = _slicedToArray(_useState47, 2),
    isWon = _useState48[0],
    setIsWon = _useState48[1];
  var _useState49 = useState(false),
    _useState50 = _slicedToArray(_useState49, 2),
    hideVictoryModal = _useState50[0],
    setHideVictoryModal = _useState50[1];
  var resultsDismissRef = useRef(null); // PlatResults 關閉標記（記 matchPhase：同 phase 內關了不再彈，phase 變了——如結算——再彈）
  var _useState51 = useState(false),
    _useState52 = _slicedToArray(_useState51, 2),
    resultsDismissedUi = _useState52[0],
    setResultsDismissedUi = _useState52[1]; // 結果卡被「看盤面」關掉後，畫面留一顆🏆結果鈕可隨時叫回
  var _useState53 = useState(false),
    _useState54 = _slicedToArray(_useState53, 2),
    leaveArm = _useState54[0],
    setLeaveArm = _useState54[1]; // 結果卡「離開」兩段確認（防誤按就拆連線退場、結果再也叫不回）
  var leaveArmTimerRef = useRef(null);
  var _useState55 = useState(false),
    _useState56 = _slicedToArray(_useState55, 2),
    showExitMenu = _useState56[0],
    setShowExitMenu = _useState56[1]; // 標頭「退出」選單（錦標賽房主進行中按退出才開，內含「結束本局」防誤觸）
  var _useState57 = useState(""),
    _useState58 = _slicedToArray(_useState57, 2),
    toastMsg = _useState58[0],
    setToastMsg = _useState58[1];
  var _useState59 = useState(Date.now()),
    _useState60 = _slicedToArray(_useState59, 2),
    startTime = _useState60[0],
    setStartTime = _useState60[1];
  var _useState61 = useState(null),
    _useState62 = _slicedToArray(_useState61, 2),
    endTime = _useState62[0],
    setEndTime = _useState62[1];
  var _useState63 = useState(null),
    _useState64 = _slicedToArray(_useState63, 2),
    matchStartTime = _useState64[0],
    setMatchStartTime = _useState64[1];
  var _useState65 = useState(1),
    _useState66 = _slicedToArray(_useState65, 2),
    zoomLevel = _useState66[0],
    setZoomLevel = _useState66[1];
  var _useState67 = useState(true),
    _useState68 = _slicedToArray(_useState67, 2),
    isHeaderCollapsed = _useState68[0],
    setIsHeaderCollapsed = _useState68[1];
  var _useState69 = useState(false),
    _useState70 = _slicedToArray(_useState69, 2),
    showSaveModal = _useState70[0],
    setShowSaveModal = _useState70[1];
  var _useState71 = useState(""),
    _useState72 = _slicedToArray(_useState71, 2),
    saveCode = _useState72[0],
    setSaveCode = _useState72[1];
  var _useState73 = useState(0),
    _useState74 = _slicedToArray(_useState73, 2),
    interactionMode = _useState74[0],
    setInteractionMode = _useState74[1];
  var _useState75 = useState('pen'),
    _useState76 = _slicedToArray(_useState75, 2),
    drawSubMode = _useState76[0],
    setDrawSubMode = _useState76[1];
  var _useState77 = useState(null),
    _useState78 = _slicedToArray(_useState77, 2),
    selectedChar = _useState78[0],
    setSelectedChar = _useState78[1];
  // 輸入方式：'num' 數字先行（先點數字再點格子）｜'cell' 格子先行（先點格子再點數字）— 玩家可切換、記住選擇
  var _useState79 = useState(function () {
      return platSave().getStr('sudoku_input_mode', '') === 'cell' ? 'cell' : 'num';
    }),
    _useState80 = _slicedToArray(_useState79, 2),
    inputMode = _useState80[0],
    setInputMode = _useState80[1];
  var _useState81 = useState(null),
    _useState82 = _slicedToArray(_useState81, 2),
    selectedCellId = _useState82[0],
    setSelectedCellId = _useState82[1];
  useEffect(function () {
    platSave().setStr('sudoku_input_mode', inputMode);
  }, [inputMode]);
  // v1.61.0 K1：單機難度段位滑動指示片（殼 PlatSeg 共用；量測在 effect 內、選取變化才滑）
  useEffect(function () {
    if (window.PlatSeg) {
      var c = document.querySelector('#view-sudoku [data-seg="sudoku-diff"]');
      var b = c && c.querySelector('[data-seg-on="1"]');
      if (c && b) window.PlatSeg(c, 'sudoku-diff', b, '#ffcc00');
    }
  }, [diffId, screen]);
  // 靜音偏好（與全域音效引擎同步，同數橋）
  var _useState83 = useState(function () {
      return platSave().getStr('sudoku_muted', '') === '1';
    }),
    _useState84 = _slicedToArray(_useState83, 2),
    muted = _useState84[0],
    setMuted = _useState84[1];

  // 平台 dock 按鈕（💬/🎥/🎤/🔈）：平台模式＋連線中時畫進自己的底部列，與遊戲按鈕同排同款
  var _useState85 = useState(0),
    _useState86 = _slicedToArray(_useState85, 2),
    dockTick = _useState86[0],
    setDockTick = _useState86[1];
  useEffect(function () {
    if (window.PlatDock) return window.PlatDock.subscribe(function () {
      return setDockTick(function (t) {
        return t + 1;
      });
    });
  }, []);
  var platDock = window.__PLAT_PLATFORM && window.PlatDock && window.PlatDock.isActive() ? window.PlatDock.getState() : null;
  var renderDockCapsule = function renderDockCapsule(withLobby) {
    if (!platDock) return null;
    var PD = window.PlatDock;
    var dbtn = function dbtn(active) {
      return "px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl font-black text-base md:text-lg flex items-center justify-center transition-all relative " + (active ? "bg-[#ffcc00] text-slate-900 shadow-md" : "text-slate-400 hover:text-white");
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-1 bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner"
    }, withLobby && /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return PD.goLobby();
      },
      className: dbtn(false),
      title: "\u56DE\u5927\u5EF3\u9078\u904A\u6232"
    }, "\uD83C\uDFE0"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return PD.toggleChat();
      },
      className: dbtn(platDock.chatOpen),
      title: "\u804A\u5929\u5BA4"
    }, "\uD83D\uDCAC", platDock.unread > 0 && /*#__PURE__*/React.createElement("span", {
      className: "absolute -top-1 -right-1 w-4 h-4 bg-red-500 border border-white rounded-full text-[9px] text-white flex items-center justify-center font-black"
    }, platDock.unread > 9 ? '9+' : platDock.unread)), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return PD.toggleVideo();
      },
      className: dbtn(platDock.videoOn),
      title: "\u8996\u8A0A"
    }, platDock.videoOn ? '📹' : '🎥'), platDock.videoOn && /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return PD.toggleMic();
      },
      className: dbtn(!platDock.micMuted),
      title: "\u9EA5\u514B\u98A8"
    }, platDock.micMuted ? '🔇' : '🎤'), (platDock.videoOn || platDock.remoteCount > 0) && /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return PD.toggleSpeaker();
      },
      className: dbtn(platDock.speakerOn),
      title: "\u5587\u53ED"
    }, platDock.speakerOn ? '🔊' : '🔈'));
  };

  // 禮物與反擊機制 (盤面直接覆蓋)
  var _useState87 = useState({}),
    _useState88 = _slicedToArray(_useState87, 2),
    unopenedGifts = _useState88[0],
    setUnopenedGifts = _useState88[1];
  var _useState89 = useState(initialDataRef.current.sizeDef.chars),
    _useState90 = _slicedToArray(_useState89, 2),
    keyMapping = _useState90[0],
    setKeyMapping = _useState90[1];
  var _useState91 = useState([]),
    _useState92 = _slicedToArray(_useState91, 2),
    flippedKeys = _useState92[0],
    setFlippedKeys = _useState92[1];
  var _useState93 = useState([]),
    _useState94 = _slicedToArray(_useState93, 2),
    flares = _useState94[0],
    setFlares = _useState94[1];

  // === 道具系統：水球霧化 + 格子清除 ===
  var _useState95 = useState([]),
    _useState96 = _slicedToArray(_useState95, 2),
    myWeapons = _useState96[0],
    setMyWeapons = _useState96[1]; // ['balloon','eraser',...]
  var _useState97 = useState({}),
    _useState98 = _slicedToArray(_useState97, 2),
    foggedBoxes = _useState98[0],
    setFoggedBoxes = _useState98[1]; // { boxId: expiryTimestamp }
  var _useState99 = useState({}),
    _useState100 = _slicedToArray(_useState99, 2),
    erasingCells = _useState100[0],
    setErasingCells = _useState100[1]; // { cellId: { value, timestamp } }
  var _useState101 = useState('my'),
    _useState102 = _slicedToArray(_useState101, 2),
    finishViewMode = _useState102[0],
    setFinishViewMode = _useState102[1]; // 'my' | 'god'
  var _useState103 = useState(null),
    _useState104 = _slicedToArray(_useState103, 2),
    godUid = _useState104[0],
    setGodUid = _useState104[1]; // 上帝視角正在看的選手（v1.44 Q5：觀戰改單盤＋選手切換，比照數橋/地雷）
  var lastMilestoneRef = useRef(0); // 已跨越的 5% 里程碑數量（0~19，逐格補報不跳過）
  var giftCreditRef = useRef(0); // 禮物計量額度：每完成一個行/列/宮/數字 +0.5，湊滿 1 才送出

  var processedEventsRef = useRef(new Set());
  var completedRegionsRef = useRef(new Set());
  var scrambledCharsRef = useRef(new Set());
  var modeIcons = ['🖋️', '✏️', '🖌️'];
  var modeTitles = ['填答模式', '草稿模式', '畫筆作記號'];
  var _useState105 = useState(3),
    _useState106 = _slicedToArray(_useState105, 2),
    zoomModeIdx = _useState106[0],
    setZoomModeIdx = _useState106[1];
  var _useState107 = useState({
      value: 1.0,
      visible: false
    }),
    _useState108 = _slicedToArray(_useState107, 2),
    zoomIndicator = _useState108[0],
    setZoomIndicator = _useState108[1];
  var zoomIndicatorTimer = useRef(null);
  var _useState109 = useState(false),
    _useState110 = _slicedToArray(_useState109, 2),
    isClosingModal = _useState110[0],
    setIsClosingModal = _useState110[1];

  // --- 漂浮選單分身術 (Zoom 與 Mode 獨立系統) ---
  var _useState111 = useState(false),
    _useState112 = _slicedToArray(_useState111, 2),
    zoomMenuOpen = _useState112[0],
    setZoomMenuOpen = _useState112[1];
  var _useState113 = useState({
      x: -1,
      y: -1
    }),
    _useState114 = _slicedToArray(_useState113, 2),
    zoomMenuPos = _useState114[0],
    setZoomMenuPos = _useState114[1];
  var _useState115 = useState(false),
    _useState116 = _slicedToArray(_useState115, 2),
    isDraggingZoom = _useState116[0],
    setIsDraggingZoom = _useState116[1];
  var wasZoomDragged = useRef(false);
  var zoomDragTimer = useRef(null);
  var _useState117 = useState(false),
    _useState118 = _slicedToArray(_useState117, 2),
    modeSubOpen = _useState118[0],
    setModeSubOpen = _useState118[1];
  var _useState119 = useState(false),
    _useState120 = _slicedToArray(_useState119, 2),
    zoomOpen = _useState120[0],
    setZoomOpen = _useState120[1];
  var advanceInteractionMode = function advanceInteractionMode() {
    var next = (interactionMode + 1) % 3;
    setInteractionMode(next);
    setModeSubOpen(next === 2);
    showToast(next === 0 ? '🖋️ 填答模式' : next === 1 ? '✏️ 筆記模式' : '🖌️ 塗鴉模式');
  };
  var cycleInteractionMode = function cycleInteractionMode() {
    if (interactionMode === 2 && !modeSubOpen) {
      setModeSubOpen(true);
      return;
    }
    advanceInteractionMode();
  };
  var _useState121 = useState({
      x: -1,
      y: -1
    }),
    _useState122 = _slicedToArray(_useState121, 2),
    modeMenuPos = _useState122[0],
    setModeMenuPos = _useState122[1];
  var _useState123 = useState(false),
    _useState124 = _slicedToArray(_useState123, 2),
    isDraggingMode = _useState124[0],
    setIsDraggingMode = _useState124[1];
  var wasModeDragged = useRef(false);
  var modeDragTimer = useRef(null);
  var _useState125 = useState(true),
    _useState126 = _slicedToArray(_useState125, 2),
    menuVertical = _useState126[0],
    setMenuVertical = _useState126[1]; // 共用排列方向偏好
  var _useState127 = useState(false),
    _useState128 = _slicedToArray(_useState127, 2),
    isGenerating = _useState128[0],
    setIsGenerating = _useState128[1];
  var _useState129 = useState(""),
    _useState130 = _slicedToArray(_useState129, 2),
    genProgress = _useState130[0],
    setGenProgress = _useState130[1];
  var isAutoFillingRef = useRef(false);
  var _useState131 = useState(null),
    _useState132 = _slicedToArray(_useState131, 2),
    colorPickerTarget = _useState132[0],
    setColorPickerTarget = _useState132[1];
  var _useState133 = useState([]),
    _useState134 = _slicedToArray(_useState133, 2),
    colorSeq = _useState134[0],
    setColorSeq = _useState134[1];
  var _useState135 = useState(""),
    _useState136 = _slicedToArray(_useState135, 2),
    editName = _useState136[0],
    setEditName = _useState136[1];
  var _useState137 = useState(""),
    _useState138 = _slicedToArray(_useState137, 2),
    roomId = _useState138[0],
    setRoomId = _useState138[1];
  var _useState139 = useState(false),
    _useState140 = _slicedToArray(_useState139, 2),
    isHost = _useState140[0],
    setIsHost = _useState140[1];
  var isHostRef = useRef(false);
  var _useState141 = useState(""),
    _useState142 = _slicedToArray(_useState141, 2),
    tempRoomId = _useState142[0],
    setTempRoomId = _useState142[1];
  var _useState143 = useState(""),
    _useState144 = _slicedToArray(_useState143, 2),
    tempPlayerName = _useState144[0],
    setTempPlayerName = _useState144[1];
  // ===== 每日一題（比照數橋） =====
  var dailyTodayStr = function dailyTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  var shiftDateStr = function shiftDateStr(ds, delta) {
    var d = new Date(ds + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  var _useState145 = useState(function () {
      return dailyTodayStr();
    }),
    _useState146 = _slicedToArray(_useState145, 2),
    dailyPickDate = _useState146[0],
    setDailyPickDate = _useState146[1];
  var _useState147 = useState(null),
    _useState148 = _slicedToArray(_useState147, 2),
    dailyDate = _useState148[0],
    setDailyDate = _useState148[1]; // 進行中的每日題日期（null=非每日模式）
  var dailyRef = useRef(null);
  var dailyRecordedRef = useRef(false);
  var _useState149 = useState(function () {
      return platSave().read('sudoku_daily_records', {
        fallback: {}
      });
    }),
    _useState150 = _slicedToArray(_useState149, 2),
    dailyRecords = _useState150[0],
    setDailyRecords = _useState150[1];
  var _useState151 = useState(function () {
      return platSave().read('sudoku_daily_streak', {
        fallback: {
          count: 0,
          lastDate: ''
        }
      });
    }),
    _useState152 = _slicedToArray(_useState151, 2),
    dailyStreak = _useState152[0],
    setDailyStreak = _useState152[1];
  var _useState153 = useState(false),
    _useState154 = _slicedToArray(_useState153, 2),
    showTutorial = _useState154[0],
    setShowTutorial = _useState154[1];
  var _useState155 = useState(0),
    _useState156 = _slicedToArray(_useState155, 2),
    tutStep = _useState156[0],
    setTutStep = _useState156[1]; // 玩法教學步進（美學稽核 V-09：三款教學統一為數橋的步進骨架）
  var _useState157 = useState(null),
    _useState158 = _slicedToArray(_useState157, 2),
    tutDemoVal = _useState158[0],
    setTutDemoVal = _useState158[1]; // 教學互動 demo（v1.46 Q6）：已填入的數字
  var _useState159 = useState(null),
    _useState160 = _slicedToArray(_useState159, 2),
    tutDemoWrong = _useState160[0],
    setTutDemoWrong = _useState160[1]; // 教學互動 demo：剛填錯的數字

  var _useState161 = useState([{
      id: myId,
      name: "單機玩家",
      isHost: true,
      color: COLORS[11],
      isReady: false,
      isSpectator: false
    }]),
    _useState162 = _slicedToArray(_useState161, 2),
    playersList = _useState162[0],
    setPlayersList = _useState162[1];
  var _useState163 = useState(false),
    _useState164 = _slicedToArray(_useState163, 2),
    isConnecting = _useState164[0],
    setIsConnecting = _useState164[1];
  var _useState165 = useState(""),
    _useState166 = _slicedToArray(_useState165, 2),
    connectionStatus = _useState166[0],
    setConnectionStatus = _useState166[1];
  var _useState167 = useState(false),
    _useState168 = _slicedToArray(_useState167, 2),
    showCancelButton = _useState168[0],
    setShowCancelButton = _useState168[1];
  var _useState169 = useState(true),
    _useState170 = _slicedToArray(_useState169, 2),
    showOtherCursors = _useState170[0],
    setShowOtherCursors = _useState170[1];
  var _useState171 = useState(true),
    _useState172 = _slicedToArray(_useState171, 2),
    showGhostProgress = _useState172[0],
    setShowGhostProgress = _useState172[1];
  var _useState173 = useState({}),
    _useState174 = _slicedToArray(_useState173, 2),
    cursors = _useState174[0],
    setCursors = _useState174[1];
  var _useState175 = useState([]),
    _useState176 = _slicedToArray(_useState175, 2),
    ripples = _useState176[0],
    setRipples = _useState176[1];
  var _useState177 = useState(null),
    _useState178 = _slicedToArray(_useState177, 2),
    pressedCellId = _useState178[0],
    setPressedCellId = _useState178[1]; // C 類按壓回饋（v1.54.0）：純顯示層覆蓋，不碰選格/輸入/長按邏輯

  var isMultiplayer = engine === 'peerjs';
  var svgRef = useRef(null);
  var lastCursorSend = useRef(0);
  var isDrawingRef = useRef(false);
  var cellLongPressTimer = useRef(null);
  var isLongPressTriggered = useRef(false);
  var touchStartPt = useRef(null);
  var tapSeqRef = useRef(0); // 每次 pointerdown 的點按序號：長按標記只擋同一次點按的放開，不毒到下一次
  var longPressSeqRef = useRef(-1);
  var tapInfoRef = useRef(null); // 本次點按落在哪一格（pointerup 直接處理點按用，不單靠 click）
  var cellTrkRef = useRef(null); // 本次格點按的 PlatTap 實例（每按新建一顆：長按計時器閉包各 poll 自己那顆，跨按不互擾——守恆舊 seq 語意）
  var supTrkRef = useRef(null); // 格/數字鍵共用的尾隨 click 抑制（PlatTap suppress 700ms 全擋——舊 pointerTapDedupeRef 語意，v1.63.0 收編）
  var supTrk = function supTrk() {
    if (!supTrkRef.current) supTrkRef.current = platTapNew({
      suppressMs: 700
    });
    return supTrkRef.current;
  };
  var padTapRef = useRef(null); // F1：數字鍵 pointer 點按追蹤（按下鍵＋client 座標） // pointerup 已處理過的點按：擋掉隨後跟來的重複 click

  var engineRef = useRef('none');
  var peerRef = useRef(null);
  var connRef = useRef(null);
  var connsRef = useRef([]);
  var zoomContainerRef = useRef(null);
  var lastPinchDist = useRef(null);
  var stateRef = useRef({
    cells: [],
    localCells: [],
    levelData: null,
    startTime: Date.now(),
    sizeId: 9,
    diffId: 'medium',
    strokes: [],
    isGenerating: false,
    selectedChar: null,
    isBrawlMode: false,
    brawlWinners: [],
    brawlSettings: {
      winnersCount: 3,
      allowQuickFill: false,
      allowTraversal: false,
      allowYellowHint: false,
      hideAnswers: true,
      allowOthersToPlayAgain: true,
      allowGifts: true,
      showNumbersInGodMode: false
    },
    winner: null,
    isAutoFilling: false,
    matchPhase: 'playing',
    matchEndTime: null,
    countdownTarget: null,
    giftEvents: [],
    keyMapping: [],
    unopenedGifts: {},
    myWeapons: []
  });
  var playersListRef = useRef([]);
  var handleMultiplayerWinRef = useRef(null);
  handleMultiplayerWinRef.current = function (winInfo) {
    if (!stateRef.current.isBrawlMode) return;
    if (stateRef.current.brawlWinners.some(function (w) {
      return w.id === winInfo.id;
    })) return;
    var curWinners = stateRef.current.brawlWinners;
    var newWinners = [].concat(_toConsumableArray(curWinners), [winInfo]);
    var winnersIds = newWinners.map(function (w) {
      return w.id || w.uid;
    });
    var winnerNames = newWinners.map(function (w) {
      return w.name;
    });
    // 結算條件硬化：非房主玩家「已完賽（id 或名字對上）或觀戰中」都算了結。
    // 舊式只認「未觀戰選手全數在 winners」：名單旗標/uid 一旦分歧（觀戰旗標殘留、重連換 id），
    // allDone 永遠不成立，房主會永遠卡在「等待第 N 名完成」。
    var contenders = playersListRef.current.filter(function (p) {
      return !p.isHost;
    });
    var isDoneEntry = function isDoneEntry(p) {
      return p.isSpectator || winnersIds.includes(p.id) || p.name && winnerNames.includes(p.name);
    };
    // 房主自己也是選手，必須一併了結才能結算（五戰第三局來賓先贏、房主被跳結算的根因：
    // contenders 只算非房主，來賓一完賽 every() 就成立，房主還在玩就被拉去看成績、賽程斷掉）。
    // 數橋 maybeFinalize 本來就有把自己的完賽算進 finCount，數獨這裡對齊。
    var hostEntry = playersListRef.current.find(function (p) {
      return p.isHost;
    });
    var hostDone = !hostEntry || isDoneEntry(hostEntry);
    var winnersLimit = stateRef.current.isBrawlMode ? stateRef.current.brawlSettings.winnersCount || 1 : 1;
    var allDone = newWinners.length >= winnersLimit || hostDone && contenders.length > 0 && contenders.every(isDoneEntry);
    if (platTournLockRef.current) {
      // 五戰本局：必須等所有選手（含房主）都真的完賽才結算——名額到齊、觀戰旗標都不能提前觸發結算（使用者回報第五局被提前結算）
      var racers = playersListRef.current.filter(function (p) {
        return !p.pending;
      });
      allDone = racers.length > 0 && racers.every(function (p) {
        return winnersIds.includes(p.id) || p.name && winnerNames.includes(p.name);
      });
    }
    var winnerObj = stateRef.current.isBrawlMode ? newWinners[0] || winInfo : winInfo;
    stateRef.current.brawlWinners = newWinners;
    if (allDone) {
      var now = Date.now();
      stateRef.current.matchPhase = 'finished';
      stateRef.current.matchEndTime = now;
      stateRef.current.winner = winnerObj;
    }
    setBrawlWinners(newWinners);
    if (allDone) {
      setMatchPhase('finished');
      setWinner(winnerObj);
    }
    if (engineRef.current === 'peerjs' && isHostRef.current) {
      var syncData = {
        brawlWinners: newWinners
      };
      if (allDone) {
        syncData.matchPhase = 'finished';
        syncData.matchEndTime = stateRef.current.matchEndTime;
        syncData.winner = winnerObj;
      }
      syncState(syncData, true);
    }
  };
  var zoomLevelRef = useRef(1);
  var pzRef = useRef(null); // 共用縮放持有（PlatZoom，v1.63.0）：按鈕 0.1–5 步進 0.1；pinch 單次 range [0.4,3.5]；適應模式 setRaw（全守恆）
  var pz = function pz() {
    if (!pzRef.current) pzRef.current = platZoomNew({
      min: 0.1,
      max: 5,
      value: 1
    });
    return pzRef.current;
  };
  var zoomModeIdxRef = useRef(3);
  var currentPathDataRef = useRef("");
  var drawingPathRef = useRef(null);
  var eraserRef = useRef(null);
  var lastEraseTimeRef = useRef(0);
  var handleBrawlWinRef = useRef(null);
  var handleRegenerateRandomRef = useRef(null);
  var handleReceiveWeaponRef = useRef(null);
  var handleWeaponHitFogRef = useRef(null);
  var handleWeaponHitEraseRef = useRef(null);
  var handleReceiveCounterAttackRef = useRef(null);
  var handleMilestoneRef = useRef(null);
  handleBrawlWinRef.current = function (winInfo) {
    if (handleMultiplayerWinRef.current) handleMultiplayerWinRef.current(winInfo);
  };
  var cSizeDef = levelData.sizeDef;
  var CELL_SIZE = 60;
  var PADDING = 20;
  var svgW = cSizeDef.size * CELL_SIZE + PADDING * 2;
  var svgH = cSizeDef.size * CELL_SIZE + PADDING * 2;
  var MAX_SAFE_DIMENSION = 4000;
  var activeCells = isBrawlMode ? localCells : cells;
  useEffect(function () {
    playersListRef.current = playersList;
  }, [playersList]);

  // 定期清理過期的盤面禮物 (已經廢棄，禮物永久保存不用清理)

  useEffect(function () {
    if (matchPhase === 'countdown' && countdownTarget) {
      var checkTime = function checkTime() {
        var remaining = Math.ceil((countdownTarget - (Date.now() + platTimeOffset())) / 1000); // countdownTarget 是房主時鐘的絕對時刻（D-05 時鐘校正）
        if (remaining > 0) {
          setCountdownValue(remaining);
        } else {
          setCountdownValue(null);
          if (stateRef.current.matchPhase !== 'playing') {
            try {
              window.SUDOKU_SOUND.play('go');
            } catch (e) {}
            var localStart = countdownTarget - platTimeOffset(); // 換算回本地時鐘：下游計時/完賽/武器延遲全用本地版
            setMatchPhase('playing');
            setStartTime(localStart);
            setMatchStartTime(localStart);
            stateRef.current.matchPhase = 'playing';
            stateRef.current.matchEndTime = null;
            stateRef.current.startTime = localStart;
          }
        }
      };
      checkTime();
      var interval = setInterval(checkTime, 100);
      return function () {
        return clearInterval(interval);
      };
    } else {
      setCountdownValue(null);
    }
  }, [matchPhase, countdownTarget]);
  useEffect(function () {
    if (typeof window === 'undefined' || !window.PlatCountdown) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch !== 'sudoku') return; // 平台：背景遊戲不許碰殼的共用 overlay（會把前景那款的倒數/結算弄閃）
    if (countdownValue !== null && !isGenerating) window.PlatCountdown.show(countdownValue);else window.PlatCountdown.hide();
  }, [countdownValue, isGenerating]);

  // 共用結算畫面（PlatResults，與數橋同框架）：大亂鬥結算改餵殼 spec，本地 modal 只作無殼時 fallback
  useEffect(function () {
    if (typeof window === 'undefined' || !window.PlatResults) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch !== 'sudoku') return; // 平台：背景遊戲不許碰殼的共用 overlay（會把前景那款的倒數/結算弄閃）
    var showLocal = isBrawlMode && (isWon || winner);
    if (!showLocal) {
      window.PlatResults.hide();
      resultsDismissRef.current = null;
      if (resultsDismissedUi) setResultsDismissedUi(false);
      if (leaveArm) setLeaveArm(false);
      return;
    }
    if (resultsDismissRef.current === matchPhase) {
      window.PlatResults.hide();
      return;
    }
    if (resultsDismissedUi) setResultsDismissedUi(false);
    var homeBtn = leaveArm ? {
      id: 'home',
      label: '⚠️ 確定離開？',
      kind: 'danger'
    } : {
      id: 'home',
      label: '離開'
    };
    var finishedPhase = matchPhase === 'finished';
    var entries = brawlWinners.map(function (w) {
      return {
        key: String(w.id),
        name: w.name,
        color: w.color,
        isMe: w.id === myId,
        right: '⏱ ' + w.time
      };
    });
    if (finishedPhase) {
      var winIds = {};
      brawlWinners.forEach(function (w) {
        winIds[w.id] = true;
      });
      var rest = playersList.filter(function (p) {
        return !p.isSpectator && !winIds[p.id];
      }).map(function (p) {
        return {
          p: p,
          prog: ghostProgress[p.id] || 0
        };
      }).sort(function (a, b) {
        return b.prog - a.prog;
      }).map(function (x) {
        return {
          key: String(x.p.id),
          name: x.p.name,
          color: x.p.color,
          isMe: x.p.id === myId,
          isHost: !!x.p.isHost,
          right: '未完成 · ' + Math.round(x.prog) + '%'
        };
      });
      entries.push.apply(entries, rest);
    }
    var iWon = brawlWinners.length > 0 && brawlWinners[0].id === myId;
    var iFinished = brawlWinners.some(function (w) {
      return w.id === myId;
    });
    var canControl = isHostRef.current || brawlSettings.allowOthersToPlayAgain !== false;
    var watchAction = function watchAction() {
      resultsDismissRef.current = matchPhase;
      setResultsDismissedUi(true);
      window.PlatResults.hide();
      setHideVictoryModal(true);
      setFinishViewMode('god');
      toggleSpectator(myId, true, true);
      showToast("👁️ 已轉變為上帝模式，您可以繼續觀看其他玩家比賽");
    };
    window.PlatResults.show({
      accent: '#ffcc00',
      title: '大亂鬥結果',
      entries: entries,
      verdict: finishedPhase ? iWon ? '🎉 你贏了！' : iFinished ? '完賽了，名次如上！' : '比賽結束，結果如上' : null,
      waitingText: !finishedPhase ? '比賽尚未結束，等待其他玩家完成…' : null,
      note: finishedPhase && !canControl ? '⏳ 等待房主決定下一局...' : null,
      buttons: finishedPhase ? canControl ? typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.tourn ? [
      // 錦標賽：下一局照賽程走，不給再來一局
      {
        id: 'watch',
        label: '👁️ 看盤面'
      }, {
        id: 'lobby',
        label: '🏁 回等待室',
        kind: 'primary'
      }, homeBtn] : [{
        id: 'watch',
        label: '👁️ 看盤面'
      }, {
        id: 'rematch',
        label: '🔁 再來一局',
        kind: 'primary'
      }, {
        id: 'lobby',
        label: '🏁 回等待室'
      }, homeBtn] : [] : [{
        id: 'watch',
        label: '👁️ 轉變為上帝模式（觀戰）',
        kind: 'primary'
      }],
      onAction: function onAction(id) {
        if (id === 'watch') watchAction();else if (id === 'rematch') {
          window.PlatResults.hide();
          handlePlayAgain();
        } else if (id === 'lobby') {
          window.PlatResults.hide();
          handleBackToLobby();
        } else if (id === 'home') {
          if (!leaveArm) {
            // 第一次按只是武裝確認（防誤按），3.5 秒內再按才真的離開
            setLeaveArm(true);
            if (leaveArmTimerRef.current) clearTimeout(leaveArmTimerRef.current);
            leaveArmTimerRef.current = setTimeout(function () {
              return setLeaveArm(false);
            }, 3500);
            return;
          }
          if (leaveArmTimerRef.current) clearTimeout(leaveArmTimerRef.current);
          setLeaveArm(false);
          window.PlatResults.hide();
          handleGoHome();
        }
      }
    });
  });

  // --- 漂浮選單拖動邏輯 (通用) ---
  useEffect(function () {
    if (!isDraggingZoom && !isDraggingMode) return;
    var handleGlobalMove = function handleGlobalMove(e) {
      var margin = 20;
      var x = Math.max(margin, Math.min(window.innerWidth - margin, e.clientX));
      var y = Math.max(margin, Math.min(window.innerHeight - margin, e.clientY));
      if (isDraggingZoom) setZoomMenuPos({
        x: x,
        y: y
      });else if (isDraggingMode) setModeMenuPos({
        x: x,
        y: y
      });
    };
    var handleGlobalUp = function handleGlobalUp() {
      if (isDraggingZoom) {
        setIsDraggingZoom(false);
        wasZoomDragged.current = true;
        setTimeout(function () {
          return wasZoomDragged.current = false;
        }, 200);
      }
      if (isDraggingMode) {
        setIsDraggingMode(false);
        wasModeDragged.current = true;
        setTimeout(function () {
          return wasModeDragged.current = false;
        }, 200);
      }
      if (zoomDragTimer.current) clearTimeout(zoomDragTimer.current);
      if (modeDragTimer.current) clearTimeout(modeDragTimer.current);
    };
    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);
    return function () {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
    };
  }, [isDraggingZoom, isDraggingMode]);
  var handleZoomPointerDown = function handleZoomPointerDown(e) {
    zoomDragTimer.current = setTimeout(function () {
      setIsDraggingZoom(true);
      setZoomMenuOpen(false);
      setZoomMenuPos({
        x: e.clientX,
        y: e.clientY
      });
    }, 500);
  };
  var handleModePointerDown = function handleModePointerDown(e) {
    modeDragTimer.current = setTimeout(function () {
      setIsDraggingMode(true);
      setModeSubOpen(false);
      setModeMenuPos({
        x: e.clientX,
        y: e.clientY
      });
    }, 500);
  };
  var handleMenuPointerUpGlobal = function handleMenuPointerUpGlobal() {
    if (zoomDragTimer.current) {
      clearTimeout(zoomDragTimer.current);
      zoomDragTimer.current = null;
    }
    if (modeDragTimer.current) {
      clearTimeout(modeDragTimer.current);
      modeDragTimer.current = null;
    }
    setIsDraggingZoom(false);
    setIsDraggingMode(false);
  };

  // （2026-10-18 使用者指示：準備只是打勾，不自動開賽——一律等房主按「開始比賽」才倒數）

  useEffect(function () {
    setGhostHints({});
    completedRegionsRef.current.clear();
    setUnopenedGifts({});
    scrambledCharsRef.current.clear();
    processedEventsRef.current.clear();
    setMyWeapons([]);
    setFoggedBoxes({});
    setFinishViewMode('my');
    lastOneConvertedRef.current = false;
    giftCreditRef.current = 0;
    lastMilestoneRef.current = 0;
    autoGodRef.current = false; // 每場重置自動上帝旗標：原本只有房主的 generateAndSync 會清，來賓第二場起完賽不再自動轉上帝（v1.13.0 功能對來賓半殘，稽核修）
  }, [startTime]);
  useEffect(function () {
    if (selectedChar && completedChars.has(selectedChar)) setSelectedChar(null);
  }, [completedChars, selectedChar]);
  useEffect(function () {
    if (screen !== 'game' || isSpectator) return;
    var handleKeyDown = function handleKeyDown(e) {
      if (interactionMode >= 2 || isAutoFillingRef.current || matchPhase !== 'playing') return;
      var key = e.key.toUpperCase();
      var origIdx = cSizeDef.chars.indexOf(key);
      if (origIdx !== -1) {
        var mappedKey = keyMapping[origIdx];
        if (!completedChars.has(mappedKey)) setSelectedChar(function (prev) {
          return prev === mappedKey ? null : mappedKey;
        });
      } else if (e.key === 'q' || e.key === 'Q') toggleInteractionMode();
    };
    window.addEventListener('keydown', handleKeyDown);
    return function () {
      return window.removeEventListener('keydown', handleKeyDown);
    };
  }, [screen, cSizeDef.chars, interactionMode, completedChars, matchPhase, isSpectator, keyMapping]);
  var getPlayerColor = function getPlayerColor(uid) {
    var p = playersList.find(function (p) {
      return p.id === uid;
    });
    if (!p) return COLORS[11];
    var isOnline = engineRef.current === 'none' || p.id === myId || (isHostRef.current ? connsRef.current.some(function (c) {
      return (c.uid === p.id || c.peer === p.id) && c.open;
    }) : connRef.current && connRef.current.open);
    return isOnline ? p.color : '#94a3b8';
  };
  var myCurrentColor = getPlayerColor(myId);
  var _mePlayer = playersList.find(function (p) {
    return p.id === myId;
  });
  myNameRef.current = _mePlayer ? _mePlayer.name : "";
  myColorRef.current = myCurrentColor;
  useEffect(function () {
    zoomLevelRef.current = zoomLevel;
    pz().setRaw(zoomLevel);
  }, [zoomLevel]);
  useEffect(function () {
    zoomModeIdxRef.current = zoomModeIdx;
  }, [zoomModeIdx]);

  // 同步本地觀戰狀態與伺服器列表中的身分
  useEffect(function () {
    var me = playersList.find(function (p) {
      return p.id === myId;
    });
    if (me && me.isSpectator !== isSpectator) {
      setIsSpectator(me.isSpectator);
    }
  }, [playersList, myId]);
  useEffect(function () {
    stateRef.current = _objectSpread(_objectSpread({}, stateRef.current), {}, {
      cells: cells,
      localCells: localCells,
      levelData: levelData,
      startTime: startTime,
      sizeId: sizeId,
      diffId: diffId,
      strokes: strokes,
      isBrawlMode: isBrawlMode,
      brawlWinners: brawlWinners,
      brawlSettings: brawlSettings,
      winner: winner,
      matchPhase: matchPhase,
      matchEndTime: stateRef.current.matchEndTime,
      countdownTarget: countdownTarget,
      keyMapping: keyMapping,
      unopenedGifts: unopenedGifts,
      myWeapons: myWeapons,
      ghostHints: ghostHints,
      finishViewMode: finishViewMode
    });
  }, [cells, localCells, levelData, startTime, sizeId, diffId, strokes, isBrawlMode, brawlWinners, brawlSettings, winner, matchPhase, countdownTarget, keyMapping, unopenedGifts, myWeapons, ghostHints, finishViewMode]);

  // 🏁 我完賽 → 自動轉上帝模式（使用者 2026-10-28）：不用按鈕、不怕成績卡關掉就打不開；每場只自動切一次，之後手動切回「我的版面」不再強迫
  var autoGodRef = useRef(false);
  var matchTokenRef = useRef(null); // 對局世代代幣：房主每開新局鑄一個、隨每則 SYNC 廣播；收到代幣不符的 SYNC＝上一局遲到訊息，丟棄（原本 sessionId 從未賦值、世代守衛是死碼，稽核修）
  useEffect(function () {
    if (!isBrawlMode || finishViewMode !== 'my' || autoGodRef.current) return;
    if (!brawlWinners.some(function (w) {
      return w.id === myId;
    })) return;
    autoGodRef.current = true;
    setFinishViewMode('god');
    toggleSpectator(myId, true, true);
  }, [brawlWinners, isBrawlMode, finishViewMode]);

  // 連線超時處理 (v3.8.14)
  useEffect(function () {
    var timer;
    if (isConnecting) {
      timer = setTimeout(function () {
        setShowCancelButton(true);
      }, 20000);
    } else {
      setShowCancelButton(false);
      setConnectionStatus("");
    }
    return function () {
      return clearTimeout(timer);
    };
  }, [isConnecting]);
  var cancelConnection = function cancelConnection() {
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {}
      peerRef.current = null;
    }
    setIsConnecting(false);
    setScreen('home');
    showToast("已取消連線嘗試");
  };

  // 新增：多人模式分層自動同步機制 (v3.8.13)
  useEffect(function () {
    if (!isHost || engineRef.current !== 'peerjs') return;
    var interval = setInterval(function () {
      // 每 tick 重新驗證仍在連線模式：exit() 後 isHost/matchPhase 可能不變、effect 不會 cleanup，
      // 不擋下會變成殭屍廣播——切換到另一款遊戲後持續把舊名單蓋過去（五戰數獨→數橋來賓閃爍根因）
      if (!isHostRef.current || engineRef.current !== 'peerjs') return;
      var list = playersListRef.current;
      var phase = stateRef.current.matchPhase;

      // 1. 廣播最新名單 (包含在線燈號狀態)
      connsRef.current.forEach(function (c) {
        if (c.open) c.send({
          type: 'PLAYERS_UPDATE',
          players: list
        });
      });

      // 2. 遊戲中進行完整狀態 Heartbeat (補償掉包) (v3.8.32: 排除個人狀態以防覆蓋客端進度)
      if (phase === 'playing') {
        // 依照使用者要求，每 3 秒心跳僅檢查連線狀態，不再強制夾帶盤面覆寫客端進度 (v3.9.10)
        connsRef.current.forEach(function (c) {
          if (c.open) c.send({
            type: 'HEARTBEAT_PING',
            timestamp: Date.now()
          });
        });
      }
    }, matchPhase === 'waiting' ? 1000 : 3000);
    return function () {
      return clearInterval(interval);
    };
  }, [isHost, matchPhase]);
  var conflictCellIds = useMemo(function () {
    var conflicts = new Set();
    var grid = Array(cSizeDef.size).fill(null).map(function () {
      return Array(cSizeDef.size).fill(null);
    });
    activeCells.forEach(function (c) {
      if (c.value && c.y < cSizeDef.size && c.x < cSizeDef.size) grid[c.y][c.x] = c;
    }); // 邊界守衛：外來/殘檔格子越界只略過，渲染永不因資料形狀崩潰

    for (var i = 0; i < cSizeDef.size; i++) {
      var rowSeen = {};
      var colSeen = {};
      for (var j = 0; j < cSizeDef.size; j++) {
        var cr = grid[i][j];
        if (cr) {
          if (rowSeen[cr.value]) {
            conflicts.add(cr.id);
            conflicts.add(rowSeen[cr.value].id);
          } else rowSeen[cr.value] = cr;
        }
        var cc = grid[j][i];
        if (cc) {
          if (colSeen[cc.value]) {
            conflicts.add(cc.id);
            conflicts.add(colSeen[cc.value].id);
          } else colSeen[cc.value] = cc;
        }
      }
    }
    for (var by = 0; by < cSizeDef.size; by += cSizeDef.boxH) {
      for (var bx = 0; bx < cSizeDef.size; bx += cSizeDef.boxW) {
        var boxSeen = {};
        for (var dy = 0; dy < cSizeDef.boxH; dy++) {
          for (var dx = 0; dx < cSizeDef.boxW; dx++) {
            var cb = grid[by + dy][bx + dx];
            if (cb) {
              if (boxSeen[cb.value]) {
                conflicts.add(cb.id);
                conflicts.add(boxSeen[cb.value].id);
              } else boxSeen[cb.value] = cb;
            }
          }
        }
      }
    }
    return conflicts;
  }, [activeCells, cSizeDef]);
  var completedChars = useMemo(function () {
    var counts = {};
    activeCells.forEach(function (c) {
      if (c.value !== null && !conflictCellIds.has(c.id)) {
        counts[c.value] = (counts[c.value] || 0) + 1;
      }
    });
    var completed = new Set();
    if (cSizeDef && cSizeDef.chars) {
      var _iterator = _createForOfIteratorHelper(cSizeDef.chars),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _char = _step.value;
          if (counts[_char] >= cSizeDef.size) completed.add(_char);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    return completed;
  }, [activeCells, cSizeDef, conflictCellIds]);
  var highlightZones = useMemo(function () {
    var zones = new Set();
    if (selectedChar === null || interactionMode >= 2) return zones;
    activeCells.forEach(function (c) {
      if (c.value === selectedChar) {
        activeCells.forEach(function (target) {
          if (target.x === c.x || target.y === c.y || target.boxId === c.boxId) zones.add(target.id);
        });
      }
    });
    return zones;
  }, [activeCells, selectedChar, interactionMode]);
  var totalEmpty = useMemo(function () {
    var targetCells = isBrawlMode ? localCells : cells;
    if (!targetCells || targetCells.length === 0) return 1;
    return targetCells.filter(function (c) {
      return !c.isGiven;
    }).length || 1;
  }, [localCells, cells]);
  var playerProgress = useMemo(function () {
    if (isBrawlMode) return [];
    var counts = {};
    cells.forEach(function (c) {
      if (!c.isGiven && c.value !== null && c.owner) counts[c.owner] = (counts[c.owner] || 0) + 1;
    });
    return Object.entries(counts).map(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 2),
        uid = _ref3[0],
        count = _ref3[1];
      return {
        uid: uid,
        color: getPlayerColor(uid),
        pct: Math.round(count / totalEmpty * 100)
      };
    });
  }, [cells, totalEmpty, playersList, isBrawlMode]);

  // 為幽靈競速模式建立所有人的獨立進度
  var ghostProgress = useMemo(function () {
    if (!isBrawlMode) return {};
    var counts = {};
    playersList.forEach(function (p) {
      return counts[p.id] = 0;
    });
    Object.values(ghostHints).forEach(function (cellHints) {
      Object.keys(cellHints).forEach(function (uid) {
        if (counts[uid] !== undefined) counts[uid]++;
      });
    });
    // 自己精確的進度 (v3.13.3 移除衝突檢查，避免透過進度條洩漏答案)
    var myAccurateCount = localCells.filter(function (c) {
      return !c.isGiven && c.value !== null;
    }).length;
    counts[myId] = Math.max(counts[myId] || 0, myAccurateCount);
    var result = {};
    Object.keys(counts).forEach(function (uid) {
      result[uid] = totalEmpty > 0 ? Math.min(100, Math.round(counts[uid] / totalEmpty * 100)) : 0;
    });
    return result;
  }, [ghostHints, playersList, localCells, conflictCellIds, totalEmpty, myId]);

  // 區域完成判斷與禮物發送
  useEffect(function () {
    if (!isBrawlMode || isGenerating || !localCells.length || isSpectator || matchPhase !== 'playing') return;
    var solution = solutionGridRef.current;
    if (!solution) return;
    var newComps = 0;
    var s = cSizeDef.size;
    var chars = cSizeDef.chars;
    var _loop = function _loop(i) {
      if (s !== 4) {
        // 4x4 模式不發送行列宮的禮物
        if (!completedRegionsRef.current.has("R".concat(i))) {
          var rowCells = localCells.filter(function (c) {
            return c.y === i;
          });
          if (rowCells.length === s && rowCells.every(function (c) {
            return c.value === (solution[c.y] || [])[c.x];
          })) {
            completedRegionsRef.current.add("R".concat(i));
            if (!rowCells.every(function (c) {
              return c.isGiven;
            })) newComps++;
          }
        }
        if (!completedRegionsRef.current.has("C".concat(i))) {
          var colCells = localCells.filter(function (c) {
            return c.x === i;
          });
          if (colCells.length === s && colCells.every(function (c) {
            return c.value === (solution[c.y] || [])[c.x];
          })) {
            completedRegionsRef.current.add("C".concat(i));
            if (!colCells.every(function (c) {
              return c.isGiven;
            })) newComps++;
          }
        }
        if (!completedRegionsRef.current.has("B".concat(i))) {
          var boxCells = localCells.filter(function (c) {
            return c.boxId === i;
          });
          if (boxCells.length === s && boxCells.every(function (c) {
            return c.value === (solution[c.y] || [])[c.x];
          })) {
            completedRegionsRef.current.add("B".concat(i));
            if (!boxCells.every(function (c) {
              return c.isGiven;
            })) newComps++;
          }
        }
      }
    };
    for (var i = 0; i < s; i++) {
      _loop(i);
    }
    chars.forEach(function (_char2) {
      if (!completedRegionsRef.current.has("N".concat(_char2))) {
        var numCells = localCells.filter(function (c) {
          return c.value === _char2;
        });
        if (numCells.length === s && numCells.every(function (c) {
          return c.value === (solution[c.y] || [])[c.x];
        })) {
          completedRegionsRef.current.add("N".concat(_char2));
          if (!numCells.every(function (c) {
            return c.isGiven;
          })) newComps++;
        }
      }
    });
    if (newComps > 0 && stateRef.current.brawlSettings.allowGifts !== false) {
      // 禮物計量制（使用者定案）：每完成一個行/列/宮/數字累積 0.5 個禮物，湊滿 1 個才送出
      // （36 次完成 × 0.5 ＝ 一場最多 18 個禮物）；暫時沒有較弱的對手可送時，額度存著下次再湊
      giftCreditRef.current += newComps * 0.5;
      var _loop2 = function _loop2() {
        var winnersIds = stateRef.current.brawlWinners.map(function (w) {
          return w.id;
        });
        var validPlayers = playersList.filter(function (p) {
          return !p.isSpectator && !winnersIds.includes(p.id) && p.id !== myId;
        });

        // 計算自己的有效分數（正確格數 + 未拆禮物數）
        var myEffectiveScore = (ghostProgress[myId] || 0) + (stateRef.current.unopenedGifts[myId] ? stateRef.current.unopenedGifts[myId].length : 0);

        // 只送給比自己弱（有效分數更低）的玩家
        var weakerPlayers = validPlayers.filter(function (p) {
          var pScore = (ghostProgress[p.id] || 0) + (stateRef.current.unopenedGifts[p.id] ? stateRef.current.unopenedGifts[p.id].length : 0);
          return pScore < myEffectiveScore;
        });
        if (weakerPlayers.length === 0) return 1; // break
        // 沒有比自己弱的人：這 1 個先存著（額度不扣），等有對象再送

        // 加權隨機：差距越大機率越高
        var weights = weakerPlayers.map(function (p) {
          var pScore = (ghostProgress[p.id] || 0) + (stateRef.current.unopenedGifts[p.id] ? stateRef.current.unopenedGifts[p.id].length : 0);
          return Math.sqrt(myEffectiveScore - pScore + 1);
        });
        var totalWeight = weights.reduce(function (a, b) {
          return a + b;
        }, 0);
        var rand = Math.random() * totalWeight;
        var targetUid = weakerPlayers[weakerPlayers.length - 1].id;
        for (var _i = 0; _i < weakerPlayers.length; _i++) {
          rand -= weights[_i];
          if (rand <= 0) {
            targetUid = weakerPlayers[_i].id;
            break;
          }
        }
        var gid = Math.random().toString(36).substring(2, 10);
        var msg = {
          type: 'RECEIVE_GIFT',
          targetUid: targetUid,
          senderUid: myId,
          id: gid,
          timestamp: Date.now()
        };
        if (engineRef.current === 'peerjs') {
          if (isHostRef.current) connsRef.current.forEach(function (c) {
            return c.send(msg);
          });else if (connRef.current) connRef.current.send(msg);
          setUnopenedGifts(function (prev) {
            var q = prev[targetUid] || [];
            return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, targetUid, [].concat(_toConsumableArray(q), [myId])));
          });
        }
        giftCreditRef.current -= 1; // 送出 1 個，扣 1 額度（送出動作已完成；非連線模式不會進大亂鬥，這裡照扣避免迴圈卡死）
        try {
          if (window.PlatFly) PlatFly.fly(PlatFly.byUid('sudoku', myId), PlatFly.byUid('sudoku', targetUid), '🎁');
        } catch (e) {} // H3 禮物 Fly（純顯示層）
      };
      while (giftCreditRef.current >= 1) {
        if (_loop2()) break;
      }
    }
  }, [localCells, isGenerating, cSizeDef.size, cSizeDef.chars, ghostHints, isSpectator, matchPhase, conflictCellIds, ghostProgress, playersList, brawlWinners]);

  // === 里程碑偵測：自己每跨過 5% 就廣播給主機分配道具（逐格補報、不跳過） ===
  useEffect(function () {
    if (!isBrawlMode || isSpectator || matchPhase !== 'playing' || !isMultiplayer) return;
    if (totalEmpty === 0) return;

    // 計算自己的有效完成率（使用 ghostProgress 的自身值，最精確）
    // 注意：ghostProgress[myId] 本身已經是「百分比」（0–100），必須先換回格數才能加未拆禮物再除 totalEmpty。
    // 舊式直接把百分比再除一次 totalEmpty，等於進度被放大約 (100/totalEmpty) 倍——里程碑在真實進度約 45% 時
    // 就全部報完，後半場再也跨不到任何一格：只剩自己時什麼都拿不到（2026-11-01 使用者實機回報的病根）。
    var myCorrectCells = Math.round((ghostProgress[myId] || 0) / 100 * totalEmpty);
    var myGifts = (stateRef.current.unopenedGifts[myId] || []).length;
    var myEffectivePct = Math.min(99, Math.floor((myCorrectCells + myGifts) / totalEmpty * 100));

    // 目前應達到的里程碑級別（每 5% 一個，使用者定案；原每 10%）
    var currentMilestone = Math.floor(myEffectivePct / 5);
    if (currentMilestone > lastMilestoneRef.current) {
      // 逐格補報（使用者定案：里程碑不跳過）：一次暴衝跨過好幾個 5% 時，每一格各送一則給主機、各觸發一次發放
      for (var band = lastMilestoneRef.current + 1; band <= currentMilestone; band++) {
        var msg = {
          type: 'MILESTONE_REACHED',
          uid: myId,
          completionPct: Math.min(99, band * 5),
          id: Math.random().toString(36).substring(2, 10),
          timestamp: Date.now()
        };
        if (engineRef.current === 'peerjs') {
          if (isHostRef.current) {
            // 自己是主機，直接本地處理
            if (handleMilestoneRef.current) handleMilestoneRef.current(msg);
          } else if (connRef.current) {
            connRef.current.send(msg);
          }
        }
      }
      lastMilestoneRef.current = currentMilestone;
    }
  }, [ghostProgress, myId, isSpectator, matchPhase, isMultiplayer, totalEmpty]);
  useEffect(function () {
    if (!activeCells || activeCells.length === 0 || isGenerating || winner || matchPhase !== 'playing' || isSpectator) return;
    var isFull = activeCells.every(function (c) {
      return c.value !== null;
    });
    var hasNoConflicts = conflictCellIds.size === 0;
    if (isFull && hasNoConflicts) {
      if (isBrawlMode) {
        if (!isWinnerDeclaredRef.current) {
          isWinnerDeclaredRef.current = true;
          var finishTime = Date.now();
          var isBrawl = stateRef.current.isBrawlMode;
          setIsWon(true);
          setEndTime(finishTime);
          setHideVictoryModal(false);
          if (!isBrawl) {
            setMatchPhase('finished');
          } else {
            setIsSpectator(true);
            showToast("🏁 恭喜完成！已進入觀戰模式，觀察對手中...");
          }
          var me = playersList.find(function (p) {
            return p.id === myId;
          });
          var winInfo = {
            id: myId,
            name: me ? me.name : "玩家",
            color: me ? me.color : COLORS[0],
            time: formatTime(Math.floor((finishTime - (matchStartTime || startTime)) / 1000)),
            isBrawl: isBrawl
          };
          lastWinInfoRef.current = winInfo;
          winResentRef.current = 0;

          // 客戶端先本地同步一份獲勝名單，增加即時感 (v3.10.4)
          if (isBrawl) setBrawlWinners(function (prev) {
            if (prev.some(function (w) {
              return w.id === myId;
            })) return prev;
            return [].concat(_toConsumableArray(prev), [winInfo]);
          });
          var msgId = Math.random().toString(36).substring(2, 10);
          var msg = {
            type: 'GHOST_I_WON',
            senderUid: myId,
            id: msgId,
            time: finishTime,
            winInfo: winInfo
          };
          if (engineRef.current === 'peerjs') {
            if (isHostRef.current) {
              if (!isBrawl) {
                setWinner(winInfo);
                connsRef.current.forEach(function (c) {
                  return c.send({
                    type: 'GHOST_WINNER',
                    winner: winInfo
                  });
                });
              } else if (handleBrawlWinRef.current) handleBrawlWinRef.current(winInfo);
            } else if (connRef.current) connRef.current.send(msg);
          }
        }
      } else {
        if (!isWon) {
          setIsWon(true);
          setEndTime(Date.now());
          setHideVictoryModal(false);
          setMatchPhase('finished');
        }
      }
    } else {
      if (isWon) {
        setIsWon(false);
        setEndTime(null);
        setMatchPhase('playing');
      }
    }
  }, [activeCells, conflictCellIds.size, isWon, isGenerating, winner, matchStartTime, startTime, playersList, myId, matchPhase, isSpectator]);

  // 音效：完成題目（與數橋同款引擎/音色）
  useEffect(function () {
    if (isWon) {
      try {
        window.SUDOKU_SOUND.play('win');
      } catch (e) {}
    }
  }, [isWon]);
  // 音效：倒數每秒嗶聲（GO 在倒數 effect 轉 playing 時播）
  useEffect(function () {
    if (countdownValue !== null && countdownValue > 0) {
      try {
        window.SUDOKU_SOUND.play('countdown');
      } catch (e) {}
    }
  }, [countdownValue]);

  // 觸控縮放
  useEffect(function () {
    if (screen !== 'game') return;
    var el = zoomContainerRef.current;
    if (!el) return;
    var touchStartY = null;
    var handleTouchStart = function handleTouchStart(e) {
      if (e.touches.length === 1) touchStartY = e.touches[0].clientY;
    };
    var handleTouchMove = function handleTouchMove(e) {
      if (interactionMode >= 2 || isSpectator) return;
      if (e.touches.length === 2) {
        e.preventDefault();
        var dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (lastPinchDist.current) {
          var delta = dist - lastPinchDist.current;
          var newZoom = pz().set(zoomLevelRef.current + delta * 0.005, [0.4, 3.5]);
          if (svgW * newZoom > MAX_SAFE_DIMENSION || svgH * newZoom > MAX_SAFE_DIMENSION) newZoom = Math.min(MAX_SAFE_DIMENSION / svgW, MAX_SAFE_DIMENSION / svgH);
          zoomLevelRef.current = newZoom;
          if (svgRef.current) {
            svgRef.current.style.width = "".concat(svgW * newZoom, "px");
            svgRef.current.style.height = "".concat(svgH * newZoom, "px");
          }
          if (zoomModeIdxRef.current !== 0) {
            setZoomModeIdx(0);
            zoomModeIdxRef.current = 0;
          }
          showZoomIndicator(newZoom);
        }
        lastPinchDist.current = dist;
      } else if (e.touches.length === 1 && touchStartY !== null) {
        if (Math.abs(e.touches[0].clientY - touchStartY) > 30 && !isHeaderCollapsed) setIsHeaderCollapsed(true);
      }
    };
    var handleTouchEnd = function handleTouchEnd() {
      lastPinchDist.current = null;
      touchStartY = null;
      if (zoomLevel !== zoomLevelRef.current) setZoomLevel(zoomLevelRef.current);
    };
    var handleWheel = function handleWheel(e) {
      if (interactionMode >= 2 || isSpectator) return;
      if (Math.abs(e.deltaY) > 10 && !isHeaderCollapsed) setIsHeaderCollapsed(true);
      if (e.ctrlKey && zoomModeIdxRef.current !== 0) {
        setZoomModeIdx(0);
        zoomModeIdxRef.current = 0;
      }
    };
    el.addEventListener('touchstart', handleTouchStart, {
      passive: true
    });
    el.addEventListener('touchmove', handleTouchMove, {
      passive: false
    });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);
    el.addEventListener('wheel', handleWheel, {
      passive: true
    });
    return function () {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
      el.removeEventListener('wheel', handleWheel);
    };
  }, [screen, isHeaderCollapsed, interactionMode, svgW, svgH, zoomLevel, isSpectator]);

  // 觸控筆同點連點防護：不認 touch-action 的舊版 iOS Safari 會把「同位置的快速第二下點按」配對成雙擊縮放手勢、
  // 整下被仲裁吃掉（手指落點較飄移反而不會被配對——使用者實機回報：筆連點四下，第 2、4 下連水波紋都沒有）。
  // 在棋盤 svg 本體以非被動 touchend preventDefault 關掉雙擊配對（FastClick 世代的標準解法）：
  // 只掛 svg、不碰數字鍵（走 click）與頁面捲動（touchend 在捲動之後才發生，不擋捲動與縮放手勢）。
  useEffect(function () {
    if (screen !== 'game') return;
    var svg = svgRef.current;
    if (!svg) return;
    var killDblTap = function killDblTap(e) {
      if (e.cancelable) e.preventDefault();
    };
    svg.addEventListener('touchend', killDblTap, {
      passive: false
    });
    return function () {
      svg.removeEventListener('touchend', killDblTap);
    };
  }, [screen]);
  useEffect(function () {
    if (ripples.length === 0) return;
    var timer = setTimeout(function () {
      var now = Date.now();
      setRipples(function (prev) {
        return prev.filter(function (r) {
          return now - r.timestamp < 1000;
        });
      });
    }, 1000);
    return function () {
      return clearTimeout(timer);
    };
  }, [ripples]);

  // 霧化遮罩倒數 ticker：每 500ms 觸發一次重渲染以更新倒數秒數
  useEffect(function () {
    if (Object.keys(foggedBoxes).length === 0) return;
    var ticker = setInterval(function () {
      var now = Date.now();
      setFoggedBoxes(function (prev) {
        var next = _objectSpread({}, prev);
        var changed = false;
        Object.keys(next).forEach(function (k) {
          if (next[k] <= now) {
            delete next[k];
            changed = true;
          }
        });
        return changed ? next : prev; // 若有到期的才更新 state
      });
    }, 500);
    return function () {
      return clearInterval(ticker);
    };
  }, [foggedBoxes]);

  // ❄️ 水球凍結：被凍結宮格內的格子暫時不能填、不能清（不再只靠 emoji 遮數字）
  var frozenToastAtRef = useRef(0);
  var cellBoxIdOf = function cellBoxIdOf(cellId) {
    var parts = String(cellId).split('-');
    var cx = parseInt(parts[0], 10),
      cy = parseInt(parts[1], 10);
    if (isNaN(cx) || isNaN(cy)) return -1;
    return Math.floor(cy / cSizeDef.boxH) * (cSizeDef.size / cSizeDef.boxW) + Math.floor(cx / cSizeDef.boxW);
  };
  var isCellFrozen = function isCellFrozen(cellId) {
    var exp = foggedBoxes[cellBoxIdOf(cellId)];
    return !!exp && exp > Date.now();
  };
  var frozenToast = function frozenToast(what) {
    var now = Date.now();
    if (now - frozenToastAtRef.current < 1500) return;
    frozenToastAtRef.current = now;
    showToast('❄️ 這個宮格被水球凍結了，暫時不能' + what + '！');
  };

  // 清除特效清理 ticker：每 500ms 清理超過 1 秒的 erasingCells
  useEffect(function () {
    if (Object.keys(erasingCells).length === 0) return;
    var ticker = setInterval(function () {
      var now = Date.now();
      setErasingCells(function (prev) {
        var next = _objectSpread({}, prev);
        var changed = false;
        Object.keys(next).forEach(function (k) {
          if (now - next[k].timestamp > 1000) {
            delete next[k];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 500);
    return function () {
      return clearInterval(ticker);
    };
  }, [erasingCells]);
  var revealSystemCellRef = useRef();
  revealSystemCellRef.current = function (cellId) {
    var grid = solutionGridRef.current;
    var targetCell = stateRef.current.localCells.find(function (c) {
      return c.id === cellId;
    });
    if (!grid || !targetCell) return;
    var ansValue = grid[targetCell.y] ? grid[targetCell.y][targetCell.x] : null;
    if (ansValue === null || ansValue === undefined) return;
    setLocalCells(function (prev) {
      var nextCells = _toConsumableArray(prev);
      var targetIdx = nextCells.findIndex(function (c) {
        return c.id === cellId;
      });
      if (targetIdx === -1) return prev;
      var target = nextCells[targetIdx];
      nextCells[targetIdx] = _objectSpread(_objectSpread({}, target), {}, {
        value: ansValue,
        drafts: [],
        isSystemRevealed: true,
        owner: null
      });
      for (var i = 0; i < nextCells.length; i++) {
        if (i !== targetIdx) {
          var c = nextCells[i];
          if (c.x === target.x || c.y === target.y || c.boxId === target.boxId) {
            if (c.drafts.includes(ansValue)) {
              nextCells[i] = _objectSpread(_objectSpread({}, c), {}, {
                drafts: c.drafts.filter(function (d) {
                  return d !== ansValue;
                })
              });
            }
          }
        }
      }
      stateRef.current.localCells = nextCells;
      return nextCells;
    });
    var me = playersListRef.current.find(function (p) {
      return p.id === myId;
    });
    var msg = {
      type: 'GHOST_SOLVED',
      uid: myId,
      color: me ? me.color : myColorRef.current,
      cellId: cellId,
      id: Math.random().toString(36).substring(2, 11),
      value: ansValue
    };
    if (engineRef.current === 'peerjs') {
      if (isHostRef.current) connsRef.current.forEach(function (c) {
        return c.send(msg);
      });else if (connRef.current) connRef.current.send(msg);
    }
  };

  // 集滿 3 個未拆禮物 → 自動拆開（使用者定案：防囤禮物到最後一次全拆逆轉；拆禮物的使用方式本來就是一次全拆）
  // 注意：禮物入列的實際路徑是訊息 dispatch 兩個分支內聯的 setUnopenedGifts，入列後都要呼叫本函式檢查
  var maybeAutoOpenGift = function maybeAutoOpenGift(targetUid) {
    if (targetUid !== myId || isSpectator) return;
    if (stateRef.current.matchPhase !== 'playing') return;
    var q = (stateRef.current.unopenedGifts[myId] || []).length + 1;
    if (q >= 3) setTimeout(function () {
      showToast('🎁 禮物集滿 3 個，自動拆開！');
      try {
        handleOpenGift();
      } catch (e) {}
    }, 900);
  };
  var handleReceiveGiftRef = useRef();
  handleReceiveGiftRef.current = function (ev) {
    if (isSpectator) return;
    // 將收到的禮物的 senderUid 放入目標的 unopenedGifts 佇列
    setUnopenedGifts(function (prev) {
      var currentQueue = prev[ev.targetUid] || [];
      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, ev.targetUid, [].concat(_toConsumableArray(currentQueue), [ev.senderUid || 'system'])));
    });
    maybeAutoOpenGift(ev.targetUid);
  };
  var triggerRipple = function triggerRipple(pt) {
    var msg = {
      type: 'RIPPLE',
      x: pt.x,
      y: pt.y,
      color: myColorRef.current || COLORS[0],
      id: Math.random().toString(36).substring(2, 10)
    };
    if (engineRef.current === 'peerjs') {
      if (isHostRef.current) connsRef.current.forEach(function (c) {
        return c.send(msg);
      });else if (connRef.current) connRef.current.send(msg);
    }
  };
  var triggerCounterAttack = function triggerCounterAttack(targetUid) {
    var msg = {
      type: 'GIFT_COUNTER_ATTACK',
      targetUid: targetUid,
      id: Math.random().toString(36).substring(2, 10),
      timestamp: Date.now()
    };
    if (engineRef.current === 'peerjs') {
      if (isHostRef.current) connsRef.current.forEach(function (c) {
        return c.send(msg);
      });else if (connRef.current) connRef.current.send(msg);
    }
  };
  handleReceiveCounterAttackRef.current = function () {
    if (isSpectator) return;
    if (stateRef.current.matchPhase !== 'playing' || stateRef.current.brawlWinners.some(function (w) {
      return w.id === myId;
    })) return; // 非對局中/已完賽不受理：遲到訊息不可污染下一局或已完成的盤面（稽核修）
    showToast("💥 遭到反擊！數字按鍵順序大亂！");
    setKeyMapping(function (prev) {
      var newMap = _toConsumableArray(prev);
      if (newMap.length >= 2) {
        var idx1 = Math.floor(Math.random() * newMap.length);
        var idx2 = Math.floor(Math.random() * newMap.length);
        while (idx1 === idx2) idx2 = Math.floor(Math.random() * newMap.length);
        var temp = newMap[idx1];
        newMap[idx1] = newMap[idx2];
        newMap[idx2] = temp;

        // 記錄被打亂的數字
        scrambledCharsRef.current.add(newMap[idx1]);
        scrambledCharsRef.current.add(newMap[idx2]);

        // 觸發翻轉動畫
        setFlippedKeys([idx1, idx2]);
        setTimeout(function () {
          return setFlippedKeys([]);
        }, 600);
      }
      syncState({
        keyMapping: newMap
      }, false);
      return newMap;
    });
  };

  // ================================================================
  // 道具系統：主機里程碑分配 + 接收道具 + 水球霧化 + 格子清除
  // ================================================================

  // 道具機率公式（使用者定案，兩款同形、保底統一 0.1）：禮物權重 = (1 − p)² + 保底（平方扶弱）；
  // 陷阱：先取 1 − p 再套同一個禮物公式 → 權重 = p² + 保底（越強越容易被打，分布明顯拉開）。抽選在候選集合內正規化；完賽者本來就被排除在候選之外。
  var platProgWeights = function platProgWeights(progs, mode, floor) {
    var f = floor == null ? 0.1 : floor;
    if (mode === 'attack') return progs.map(function (x) {
      var q = Math.min(1, Math.max(0, x || 0));
      return q * q + f;
    });
    return progs.map(function (x) {
      var d = 1 - Math.min(1, Math.max(0, x || 0));
      return d * d + f;
    });
  };
  var platPickWeighted = function platPickWeighted(items, ws) {
    var T = ws.reduce(function (a, b) {
      return a + b;
    }, 0);
    if (!(T > 0) || !items.length) return items[Math.floor(Math.random() * items.length)];
    var r = Math.random() * T;
    for (var i = 0; i < items.length; i++) {
      r -= ws[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  };

  // 主機處理 MILESTONE_REACHED：依進度比例公式抽一位玩家獲得道具
  handleMilestoneRef.current = function (ev) {
    if (!isHostRef.current) return;
    if (stateRef.current.brawlSettings.allowGifts === false) return;
    if (stateRef.current.brawlSettings.allowWeapons === false) return;
    var delay = (stateRef.current.brawlSettings.weaponStartTime || 0) * 1000;
    if (Date.now() - stateRef.current.startTime < delay) return;
    var triggererUid = ev.uid;
    var triggererPct = ev.completionPct;

    // 找比觸發者有效分數更低的玩家（排除觀戰、已完成、觸發者本人）
    var winnersIds = stateRef.current.brawlWinners.map(function (w) {
      return w.id;
    });
    var candidates = playersListRef.current.filter(function (p) {
      return !p.isSpectator && !winnersIds.includes(p.id) && p.id !== triggererUid;
    });

    // 權重分配：越弱勢的人權重越高 (v3.13.0 加強公平性)
    var ghostHintsData = stateRef.current.ghostHints || {};
    var totalEmp = stateRef.current.cells.filter(function (c) {
      return !c.isGiven;
    }).length || 1;
    var getEffPct = function getEffPct(uid) {
      var corr = Object.values(ghostHintsData).filter(function (hints) {
        return hints && hints[uid];
      }).length;
      var gifts = (stateRef.current.unopenedGifts[uid] || []).length;
      return Math.floor((corr + gifts) / totalEmp * 100);
    };

    // 所有人（除了已過關者）都是候選人
    var brawlCandidates = playersListRef.current.filter(function (p) {
      return !p.isSpectator && !winnersIds.includes(p.id);
    });
    if (brawlCandidates.length === 0) return;
    var grantProgs = brawlCandidates.map(function (p) {
      return getEffPct(p.id);
    });
    var grantWs = platProgWeights(grantProgs.map(function (p) {
      return p / 100;
    }), 'grant'); // 禮物權重 = (1 − p)² + 保底 0.1（平方扶弱）
    var candidateWeights = brawlCandidates.map(function (p, i) {
      return {
        id: p.id,
        weight: grantWs[i]
      };
    });
    var totalWeight = candidateWeights.reduce(function (sum, w) {
      return sum + w.weight;
    }, 0);

    // 根據人數決定發放道具數量 (1~2 個)
    var weaponsToGive = brawlCandidates.length >= 3 ? 2 : 1;

    // 只剩最後一位：改發系統禮物給他（不發武器——沒有對手可打），拆開揭露正確格加速完賽
    if (brawlCandidates.length === 1) {
      var soleId = brawlCandidates[0].id;
      var _loop3 = function _loop3() {
        var gMsg = {
          type: 'RECEIVE_GIFT',
          targetUid: soleId,
          senderUid: 'system',
          id: Math.random().toString(36).substring(2, 10),
          timestamp: Date.now()
        };
        if (engineRef.current === 'peerjs') {
          connsRef.current.forEach(function (c) {
            return c.send(gMsg);
          });
          if (soleId === myId && handleReceiveGiftRef.current) handleReceiveGiftRef.current(gMsg);
        }
      };
      for (var i = 0; i < weaponsToGive; i++) {
        _loop3();
      }
      return;
    }
    var _loop4 = function _loop4() {
      var random = Math.random() * totalWeight;
      var selectedId = null;
      var _iterator2 = _createForOfIteratorHelper(candidateWeights),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var cw = _step2.value;
          random -= cw.weight;
          if (random <= 0) {
            selectedId = cw.id;
            break;
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      if (!selectedId) selectedId = candidateWeights[0].id;

      // 準備道具訊息
      var weaponType = Math.random() < 0.5 ? 'balloon' : 'eraser';
      var wid = Math.random().toString(36).substring(2, 10);
      var wMsg = {
        type: 'RECEIVE_WEAPON',
        targetUid: selectedId,
        weaponType: weaponType,
        id: wid,
        timestamp: Date.now()
      };

      // 廣播給所有人
      if (engineRef.current === 'peerjs') {
        var _playersListRef$curre;
        connsRef.current.forEach(function (c) {
          return c.send(wMsg);
        });
        // 自己也要接收（如果是主機自己落後）
        if (selectedId === myId && handleReceiveWeaponRef.current) {
          handleReceiveWeaponRef.current(wMsg);
        }
        // 房主上帝日誌：方便測試 (v3.10.12)
        var targetName = ((_playersListRef$curre = playersListRef.current.find(function (p) {
          return p.id === selectedId;
        })) === null || _playersListRef$curre === void 0 ? void 0 : _playersListRef$curre.name) || '玩家';
        if (isSpectator) showToast("\uD83D\uDEE1\uFE0F \u4E0A\u5E1D\u5075\u6E2C\u5230\u91CC\u7A0B\u7891\uFF1A\u767C\u9001\u6B66\u5668\u7D66 ".concat(targetName));
      }
    };
    for (var _i2 = 0; _i2 < weaponsToGive; _i2++) {
      _loop4();
    }
  };

  // 接收道具：各項道具上限 3 個；集滿 3 個 → 自動連續發動並歸零（使用者定案，防囤積逆轉）
  var weaponAutoRef = useRef({});
  var launchWeaponRef = useRef(null);
  var autoFireWeapon = function autoFireWeapon(weaponType) {
    if (weaponAutoRef.current[weaponType]) return;
    if (stateRef.current.matchPhase !== 'playing' || isSpectator) return;
    if ((stateRef.current.myWeapons || []).filter(function (w) {
      return w === weaponType;
    }).length < 3) return; // 觸發檢查時未滿 3（例如玩家搶先手動用掉）就不發動
    weaponAutoRef.current[weaponType] = true;
    setMyWeapons(function (prev) {
      var next = _toConsumableArray(prev);
      for (var i = 0; i < 3; i++) {
        var ix = next.indexOf(weaponType);
        if (ix === -1) break;
        next.splice(ix, 1);
      }
      stateRef.current.myWeapons = next;
      return next;
    });
    var weaponName = weaponType === 'balloon' ? '💧 水球' : '🧹 橡皮擦';
    showToast("\uD83C\uDF92 \u96C6\u6EFF 3 \u500B ".concat(weaponName, "\uFF0C\u81EA\u52D5\u9023\u7E8C\u767C\u52D5\uFF01"));
    var fired = 0;
    var step = function step() {
      if (fired >= 3) {
        weaponAutoRef.current[weaponType] = false;
        return;
      }
      fired++;
      if (stateRef.current.matchPhase === 'playing' && launchWeaponRef.current) {
        try {
          launchWeaponRef.current(weaponType);
        } catch (e) {}
      } // 每發重新選目標；無對手時該發落空
      setTimeout(step, 550);
    };
    setTimeout(step, 400);
  };
  // 最後一位規則（使用者定案）：只剩我一人未完賽時，武器沒有對手可打——庫存全轉禮物、飛來的武器也直接轉禮物、
  // 房主里程碑改發系統禮物。禮物拆開直接揭露正確格，加速最後一位完賽，其他人不用乾等。
  var lastOneConvertedRef = useRef(false);
  var amLastPlayer = function amLastPlayer() {
    if (isSpectator) return false;
    if (stateRef.current.brawlWinners.some(function (w) {
      return w.id === myId;
    })) return false;
    var entrants = playersListRef.current.filter(function (p) {
      return !p.isSpectator;
    });
    if (entrants.length < 2) return false; // 至少 2 位選手才有「最後一位」：房間頁遊戲被預載、名單只有房主一人時 remaining==1 會誤判（2026-11-05 實機回報；數橋 racers<2、地雷 entrants>1 本來就有這道守衛，數獨漏了）
    var remaining = entrants.filter(function (p) {
      return !stateRef.current.brawlWinners.some(function (w) {
        return w.id === p.id;
      });
    });
    return remaining.length === 1 && remaining[0].id === myId;
  };
  handleReceiveWeaponRef.current = function (ev) {
    if (ev.targetUid !== myId || isSpectator) return;
    if (stateRef.current.matchPhase !== 'playing') return; // 等待/倒數期收到的遲到道具不進背包（稽核修）
    if (amLastPlayer()) {
      // 已是最後一位：武器入包前直接轉成系統禮物
      setUnopenedGifts(function (prev) {
        return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, myId, [].concat(_toConsumableArray(prev[myId] || []), ['system'])));
      });
      showToast('🏁 只剩你一人，獲得的武器自動轉換成 🎁 禮物！');
      maybeAutoOpenGift(myId);
      return;
    }
    setMyWeapons(function (prev) {
      if (prev.filter(function (w) {
        return w === ev.weaponType;
      }).length >= 3) return prev; // 該項已有 3 個（自動發動排程中），多的不收
      var weaponName = ev.weaponType === 'balloon' ? '💧 水球' : '🧹 橡皮擦';
      showToast("\uD83C\uDFAF \u7372\u5F97\u9053\u5177\uFF1A".concat(weaponName, "\uFF01\u9EDE\u64CA\u9053\u5177\u6309\u9215\u653B\u64CA\u5C0D\u624B\uFF01"));
      return [].concat(_toConsumableArray(prev), [ev.weaponType]);
    });
    // 進包後檢查是否集滿 3（等 stateRef 同步後由 autoFireWeapon 覆核，未滿不發動）
    setTimeout(function () {
      return autoFireWeapon(ev.weaponType);
    }, 700);
  };

  // 收到水球霧化攻擊：隨機霧化自己的一個宮格 10 秒
  handleWeaponHitFogRef.current = function (ev) {
    var targetObj = playersListRef.current.find(function (p) {
      return p.id === ev.targetUid;
    });
    var senderObj = playersListRef.current.find(function (p) {
      return p.id === ev.senderUid;
    });
    if (ev.targetUid !== myId) {
      // 如果我是主機或觀戰者，顯示誰攻擊了誰 (v3.13.2)
      if ((isHostRef.current || isSpectator) && senderObj && targetObj) {
        showToast("\uD83D\uDCE2 ".concat(senderObj.name, " \u5411 ").concat(targetObj.name, " \u6254\u4E86\u6C34\u7403\uFF01"));
      }
      return;
    }
    if (isSpectator) return;
    if (stateRef.current.matchPhase !== 'playing' || stateRef.current.brawlWinners.some(function (w) {
      return w.id === myId;
    })) return; // 霧效以絕對時間計：非對局中受理會滲進下一局開頭（稽核修）
    // 選一個隨機宮格（從有數字的格子中選）
    var totalBoxes = cSizeDef.size; // 9x9 有 9 個宮格 (boxId 0~8)
    var randomBoxId = Math.floor(Math.random() * totalBoxes);
    var expiry = Date.now() + 10000; // 10 秒
    setFoggedBoxes(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, randomBoxId, expiry));
    });
    showToast("\uD83D\uDCA7 \u6C34\u7403\u547D\u4E2D\uFF01\u4E00\u500B\u5BAE\u683C\u88AB\u51CD\u7D50 10 \u79D2\uFF0C\u88E1\u9762\u7684\u683C\u5B50\u66AB\u6642\u4E0D\u80FD\u52D5\uFF01");
    // 10 秒後自動解除
    setTimeout(function () {
      setFoggedBoxes(function (prev) {
        var next = _objectSpread({}, prev);
        if (next[randomBoxId] === expiry) delete next[randomBoxId];
        return next;
      });
    }, 10000);
  };

  // 收到格子清除攻擊：清除自己隨機一格已填正確的格子
  handleWeaponHitEraseRef.current = function (ev) {
    var targetObj = playersListRef.current.find(function (p) {
      return p.id === ev.targetUid;
    });
    var senderObj = playersListRef.current.find(function (p) {
      return p.id === ev.senderUid;
    });
    if (ev.targetUid !== myId) {
      // 如果我是主機或觀戰者，顯示誰攻擊了誰 (v3.13.2)
      if ((isHostRef.current || isSpectator) && senderObj && targetObj) {
        showToast("\uD83D\uDCE2 ".concat(senderObj.name, " \u6B63\u5728\u6E05\u9664 ").concat(targetObj.name, " \u7684\u683C\u5B57\uFF01"));
      }
      return;
    }
    if (isSpectator) return;
    if (stateRef.current.matchPhase !== 'playing' || stateRef.current.brawlWinners.some(function (w) {
      return w.id === myId;
    })) return; // 已完賽的盤面不可被遲到的橡皮擦擦格（稽核修）
    var solution = solutionGridRef.current;
    if (!solution) return;
    // 找所有已填正確、非預填、非系統揭露的格子
    var correctCells = stateRef.current.localCells.filter(function (c) {
      return !c.isGiven && !c.isSystemRevealed && c.value !== null && c.value === (solution[c.y] || [])[c.x];
    });
    if (correctCells.length === 0) {
      showToast("\uD83E\uDDF9 \u6A61\u76AE\u64E6\u6C92\u6709\u6548\u679C\uFF0C\u4F60\u6C92\u6709\u53EF\u88AB\u6E05\u9664\u7684\u683C\u5B50\uFF01");
      return;
    }
    var target = correctCells[Math.floor(Math.random() * correctCells.length)];

    // 寫入 erasingCells 記錄發動特效
    setErasingCells(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, target.id, {
        value: target.value,
        timestamp: Date.now()
      }));
    });

    // 清除該格
    setLocalCells(function (prev) {
      var next = prev.map(function (c) {
        return c.id === target.id ? _objectSpread(_objectSpread({}, c), {}, {
          value: null,
          drafts: [],
          owner: null
        }) : c;
      });
      stateRef.current.localCells = next;
      return next;
    });
    // 廣播給其他人這格退步了
    var me = playersListRef.current.find(function (p) {
      return p.id === myId;
    });
    var ghostMsg = {
      type: 'GHOST_SOLVED',
      uid: myId,
      color: me ? me.color : myColorRef.current,
      cellId: target.id,
      value: null,
      id: Math.random().toString(36).substring(2, 11)
    };
    if (engineRef.current === 'peerjs') {
      if (isHostRef.current) connsRef.current.forEach(function (c) {
        return c.send(ghostMsg);
      });else if (connRef.current) connRef.current.send(ghostMsg);
    }
    showToast("\uD83E\uDDF9 \u4E00\u683C\u88AB\u6A61\u76AE\u64E6\u6E05\u9664\u4E86\uFF01\u518D\u60F3\u60F3\u770B...");
  };

  // 玩家主動使用道具：廣播攻擊
  // 發射一次武器（不扣背包）：自動選擇攻擊目標（優先打比自己強的）；回傳是否發射。手動使用與集滿 3 自動連發共用
  var launchWeapon = function launchWeapon(weaponType) {
    // 自動選擇攻擊目標（優先打比自己強的）
    var giftsData = stateRef.current.unopenedGifts || {};
    var hintsData = stateRef.current.ghostHints || {};
    var validPlayers = playersListRef.current.filter(function (p) {
      return !p.isSpectator && p.id !== myId && !stateRef.current.brawlWinners.some(function (w) {
        return w.id === p.id;
      });
    });
    if (validPlayers.length === 0) return false;

    // 攻擊目標：陷阱公式抽選（權重 = p² + 保底 0.1；進度口徑＝已解格數＋未拆禮物數，與進度條一致）
    var totalEmpW = (stateRef.current.cells || []).filter(function (c) {
      return !c.isGiven;
    }).length || 1;
    var foeProgs = validPlayers.map(function (p) {
      return (Object.values(hintsData).filter(function (h) {
        return h && h[p.id];
      }).length + (giftsData[p.id] ? giftsData[p.id].length : 0)) / totalEmpW;
    });
    var targetUid = platPickWeighted(validPlayers, platProgWeights(foeProgs, 'attack')).id;
    var hitType = weaponType === 'balloon' ? 'WEAPON_HIT_FOG' : 'WEAPON_HIT_ERASE';
    var wMsg = {
      type: hitType,
      targetUid: targetUid,
      senderUid: myId,
      id: Math.random().toString(36).substring(2, 10),
      timestamp: Date.now()
    };
    var sObj = playersListRef.current.find(function (p) {
      return p.id === myId;
    });
    var senderName = sObj ? sObj.name : '某人';
    if (engineRef.current === 'peerjs') {
      if (isHostRef.current) connsRef.current.forEach(function (c) {
        return c.send(wMsg);
      });else if (connRef.current) connRef.current.send(wMsg);
      // 如果攻擊目標是主機自己
      if (targetUid === myId) {
        if (weaponType === 'balloon' && handleWeaponHitFogRef.current) handleWeaponHitFogRef.current(wMsg);else if (weaponType === 'eraser' && handleWeaponHitEraseRef.current) handleWeaponHitEraseRef.current(wMsg);
      }
    }
    var tObj = playersListRef.current.find(function (p) {
      return p.id === targetUid;
    });
    var targetName = tObj ? tObj.name : '對手';
    var emoji = weaponType === 'balloon' ? '💧' : '🧹';
    showToast("".concat(emoji, " \u5411 ").concat(targetName, " \u767C\u5C04\u4E86\u653B\u64CA\uFF01"));
    return true;
  };
  launchWeaponRef.current = launchWeapon;

  // 手動使用武器：發射成功才扣 1 個（無對手時不消耗、給提示，比照舊行為）
  var handleUseWeapon = function handleUseWeapon(weaponType) {
    if (stateRef.current.matchPhase !== 'playing') return; // 發射端同守衛：等待/倒數期不可攻擊（稽核修）
    if (stateRef.current.myWeapons.indexOf(weaponType) === -1) return;
    if (!launchWeapon(weaponType)) {
      showToast("😅 目前沒有可以攻擊的對手");
      return;
    }
    // 移除已使用的道具 (修正連續點擊問題：在更新回調中找 index)
    setMyWeapons(function (prev) {
      var next = _toConsumableArray(prev);
      var realIdx = next.indexOf(weaponType);
      if (realIdx !== -1) {
        next.splice(realIdx, 1);
        stateRef.current.myWeapons = next;
      }
      return next;
    });
  };
  var handleOpenGift = function handleOpenGift() {
    if (interactionMode >= 2 || matchPhase !== 'playing' || isSpectator) return;
    var myQueue = stateRef.current.unopenedGifts[myId] || [];
    if (myQueue.length === 0) return;
    var emptyCells = stateRef.current.localCells.filter(function (c) {
      return !c.isGiven && !c.isSystemRevealed && c.value === null;
    });
    var incorrectCells = stateRef.current.localCells.filter(function (c) {
      return !c.isGiven && !c.isSystemRevealed && c.value !== null && solutionGridRef.current && c.value !== (solutionGridRef.current[c.y] || [])[c.x];
    });
    var giftsToOpenCount = Math.min(myQueue.length, emptyCells.length + incorrectCells.length);
    if (giftsToOpenCount === 0) {
      showToast("⚠️ 盤面已無可解鎖或錯誤的空格");
      return;
    }
    var giftsToOpen = myQueue.slice(0, giftsToOpenCount);
    var cellsToReveal = [];
    if (giftsToOpenCount <= emptyCells.length) {
      cellsToReveal = _toConsumableArray(emptyCells).sort(function () {
        return 0.5 - Math.random();
      }).slice(0, giftsToOpenCount);
    } else {
      var _cellsToReveal;
      cellsToReveal = _toConsumableArray(emptyCells);
      var remaining = giftsToOpenCount - emptyCells.length;
      var shuffledIncorrect = _toConsumableArray(incorrectCells).sort(function () {
        return 0.5 - Math.random();
      });
      (_cellsToReveal = cellsToReveal).push.apply(_cellsToReveal, _toConsumableArray(shuffledIncorrect.slice(0, remaining)));
    }
    var buttonEl = document.getElementById("btn-open-gift");
    var buttonRect = buttonEl ? buttonEl.getBoundingClientRect() : null;
    var counterAttackCount = 0;
    var newFlares = [];
    giftsToOpen.forEach(function (senderUid, index) {
      var targetCell = cellsToReveal[index];
      revealSystemCellRef.current(targetCell.id);
      if (senderUid !== 'system') {
        setTimeout(function () {
          triggerCounterAttack(senderUid);
        }, index * 150);
        counterAttackCount++;
      }
      if (buttonRect) {
        var cellEl = document.getElementById("cell-".concat(targetCell.id));
        if (cellEl) {
          var cellRect = cellEl.getBoundingClientRect();
          newFlares.push({
            id: Date.now() + '-' + index,
            startX: buttonRect.left + buttonRect.width / 2,
            startY: buttonRect.top + buttonRect.height / 2,
            endX: cellRect.left + cellRect.width / 2,
            endY: cellRect.top + cellRect.height / 2
          });
        }
      }
    });
    if (newFlares.length > 0) {
      setFlares(function (prev) {
        return [].concat(_toConsumableArray(prev), newFlares);
      });
      setTimeout(function () {
        setFlares(function (prev) {
          return prev.filter(function (f) {
            return !newFlares.find(function (nf) {
              return nf.id === f.id;
            });
          });
        });
      }, 600);
    }
    if (counterAttackCount > 0) {
      showToast("\u2694\uFE0F \u9023\u7E8C\u62C6\u958B ".concat(giftsToOpenCount, " \u500B\u79AE\u7269\uFF01\u5C0D\u6575\u4EBA\u767C\u52D5\u4E86 ").concat(counterAttackCount, " \u6B21\u5E72\u64FE\u53CD\u64CA\uFF01"));
    } else {
      showToast("\uD83C\uDF81 \u9023\u7E8C\u62C6\u958B ".concat(giftsToOpenCount, " \u500B\u7CFB\u7D71\u79AE\u7269\uFF01\u7372\u5F97 ").concat(giftsToOpenCount, " \u683C\u63D0\u793A\uFF01"));
    }
    var _loop5 = function _loop5() {
      var msg = {
        type: 'GIFT_OPENED',
        uid: myId,
        id: Math.random().toString(36).substring(2, 10),
        timestamp: Date.now()
      };
      if (engineRef.current === 'peerjs') {
        if (isHostRef.current) connsRef.current.forEach(function (c) {
          return c.send(msg);
        });else if (connRef.current) connRef.current.send(msg);
      }
    };
    for (var i = 0; i < giftsToOpenCount; i++) {
      _loop5();
    }
    setUnopenedGifts(function (prev) {
      var q = prev[myId] || [];
      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, myId, q.slice(giftsToOpenCount)));
    });
  };

  // 最後一位轉換：完賽名單一更新就檢查——只剩我時，手邊武器全數轉成系統禮物（湊滿 3 個照舊自動拆）
  var maybeConvertLastOne = function maybeConvertLastOne() {
    if (lastOneConvertedRef.current || !amLastPlayer()) return;
    if (stateRef.current.matchPhase !== 'playing') return;
    lastOneConvertedRef.current = true;
    var weapons = stateRef.current.myWeapons || [];
    if (!weapons.length) {
      showToast('🏁 只剩你一人！接下來的里程碑將改發 🎁 禮物給你');
      return;
    }
    setMyWeapons([]);
    setUnopenedGifts(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, myId, [].concat(_toConsumableArray(prev[myId] || []), _toConsumableArray(weapons.map(function () {
        return 'system';
      })))));
    });
    showToast('🏁 只剩你一人！' + weapons.length + ' 件武器全部轉換成 🎁 禮物，加速完賽！');
    setTimeout(function () {
      if ((stateRef.current.unopenedGifts[myId] || []).length >= 3) {
        showToast('🎁 禮物集滿 3 個，自動拆開！');
        try {
          handleOpenGift();
        } catch (e) {}
      }
    }, 950);
  };
  useEffect(function () {
    maybeConvertLastOne();
  }, [brawlWinners]);
  var syncState = function syncState(partial) {
    var shouldBroadcast = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var fromRemote = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    if (partial.matchToken) matchTokenRef.current = partial.matchToken;else if (isHostRef.current && partial.isGenerating === true) matchTokenRef.current = Math.random().toString(36).slice(2, 10); // 房主開新局鑄代幣
    if (partial.cells !== undefined) setCells(partial.cells);
    if (partial.localCells !== undefined) setLocalCells(partial.localCells);
    if (partial.levelData !== undefined) setLevelData(partial.levelData);
    if (partial.startTime !== undefined) {
      var stVal = fromRemote ? partial.startTime - platTimeOffset() : partial.startTime;
      setStartTime(stVal);
      setMatchStartTime(stVal);
    } // 遠端來的 startTime 是房主時鐘，須換算回本地時鐘（D-05）；否則兩台手機時鐘差會直接吃掉完賽時間（2026-11-04 實機：玩 10 分鐘顯示 00:51）
    if (partial.matchPhase !== undefined) setMatchPhase(partial.matchPhase);
    if (partial.matchEndTime !== undefined) stateRef.current.matchEndTime = partial.matchEndTime;
    if (partial.countdownTarget !== undefined) setCountdownTarget(partial.countdownTarget);
    if (partial.isGenerating !== undefined) {
      setIsGenerating(partial.isGenerating);
      if (partial.isGenerating) {
        setIsWon(false);
        setWinner(null);
        setEndTime(null);
        isWinnerDeclaredRef.current = false;
        setUnopenedGifts({});
        completedRegionsRef.current.clear();
        scrambledCharsRef.current.clear();
        setBrawlWinners([]);
        // 恢復大廳設定的觀戰狀態
        var me = playersListRef.current.find(function (p) {
          return p.id === myId;
        });
        setIsSpectator(me ? !!me.isLobbySpectator : false);
      }
    }
    if (partial.isBrawlMode !== undefined) setIsBrawlMode(partial.isBrawlMode);
    if (partial.brawlWinners !== undefined) setBrawlWinners(partial.brawlWinners);
    if (partial.brawlSettings !== undefined) setBrawlSettings(partial.brawlSettings);
    if (partial.winner !== undefined) setWinner(partial.winner);
    if (partial.keyMapping !== undefined) setKeyMapping(partial.keyMapping);
    if (partial.solutionGrid !== undefined) {
      var parsedGrid = typeof partial.solutionGrid === 'string' ? JSON.parse(partial.solutionGrid) : partial.solutionGrid;
      solutionGridRef.current = parsedGrid;
      partial.solutionGrid = parsedGrid;
    }

    // 題目一致性修復：收到新題目時同步初始化個人棋盤 (v3.8.33)
    if (partial.levelData && (partial.isBrawlMode || stateRef.current.isBrawlMode)) {
      setLocalCells(JSON.parse(JSON.stringify(partial.cells || partial.levelData.cells)));
    }
    if (partial.sizeId !== undefined) {
      setSizeId(partial.sizeId);
      setKeyMapping((SIZES.find(function (s) {
        return s.id === partial.sizeId;
      }) || SIZES[1] || SIZES[0]).chars); // 未知 sizeId（跨版/損毀 SYNC）要有 fallback，不可裸解引用丟例外中斷整段 handler
    }
    if (partial.diffId !== undefined) setDiffId(partial.diffId);
    if (partial.strokes !== undefined) setStrokes(partial.strokes);
    if (partial.selectedChar !== undefined) setSelectedChar(partial.selectedChar);
    if (partial.isAutoFilling !== undefined) isAutoFillingRef.current = partial.isAutoFilling;
    var updatedState = _objectSpread(_objectSpread({}, stateRef.current), partial);
    if (fromRemote && partial.startTime !== undefined) updatedState.startTime = partial.startTime - platTimeOffset(); // ref 鏡像也要本地時鐘版（武器延遲閘門讀 stateRef.startTime）
    stateRef.current = updatedState;
    if (shouldBroadcast && engineRef.current === 'peerjs') {
      var broadcastData = {};
      if (partial.levelData !== undefined) broadcastData.levelData = partial.levelData;
      if (partial.startTime !== undefined) broadcastData.startTime = partial.startTime;
      if (partial.isGenerating !== undefined) broadcastData.isGenerating = partial.isGenerating;
      if (partial.isBrawlMode !== undefined) broadcastData.isBrawlMode = partial.isBrawlMode;
      if (partial.brawlWinners !== undefined) broadcastData.brawlWinners = partial.brawlWinners;
      if (partial.brawlSettings !== undefined) broadcastData.brawlSettings = partial.brawlSettings;
      if (partial.winner !== undefined) broadcastData.winner = partial.winner;
      if (partial.solutionGrid !== undefined) broadcastData.solutionGrid = partial.solutionGrid ? JSON.stringify(partial.solutionGrid) : null;
      if (partial.sizeId !== undefined) broadcastData.sizeId = partial.sizeId;
      if (partial.diffId !== undefined) broadcastData.diffId = partial.diffId;
      if (partial.strokes !== undefined) broadcastData.strokes = partial.strokes;
      if (partial.matchPhase !== undefined) broadcastData.matchPhase = partial.matchPhase;
      if (partial.countdownTarget !== undefined) broadcastData.countdownTarget = partial.countdownTarget;
      if (partial.giftEvents !== undefined) broadcastData.giftEvents = partial.giftEvents;
      if (partial.keyMapping !== undefined) broadcastData.keyMapping = partial.keyMapping;
      if (!updatedState.isBrawlMode) {
        broadcastData.cells = updatedState.cells;
      } else if (partial.levelData !== undefined) {
        // 在競速/亂鬥模式中，只有在產生新題目時，才廣播初始的 cells
        broadcastData.cells = updatedState.cells;
      }
      // 注意：永遠不廣播 localCells 與 selectedChar 給其他玩家 (v3.8.32)

      if (matchTokenRef.current) broadcastData.matchToken = matchTokenRef.current; // 每則 SYNC 都蓋世代代幣
      if (isHostRef.current) connsRef.current.forEach(function (c) {
        return c.send({
          type: 'SYNC',
          data: broadcastData
        });
      });else if (connRef.current) connRef.current.send({
        type: 'SYNC',
        data: broadcastData
      });
    }

    // 本地進度持久化 (v3.8.21: 存入完整對局 DNA)
    if (roomId && !isSpectator) {
      saveLocalProgress(roomId, myId, myNameRef.current, isHostRef.current, isBrawlMode ? updatedState.localCells : updatedState.cells, updatedState.sessionId, {
        solution: solutionGridRef.current,
        players: playersListRef.current,
        sizeId: updatedState.sizeId,
        diffId: updatedState.diffId,
        isBrawl: updatedState.isBrawlMode,
        isGhost: updatedState.isBrawlMode
      });
    }
  };
  var toggleSpectator = function toggleSpectator(targetId) {
    var isTemp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var forceState = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    if (isHostRef.current) {
      var nList = playersListRef.current.map(function (p) {
        if (p.id === targetId) {
          var newState = forceState !== null ? forceState : !p.isSpectator;
          return _objectSpread(_objectSpread({}, p), {}, {
            isSpectator: newState,
            isLobbySpectator: isTemp ? p.isLobbySpectator : newState
          });
        }
        return p;
      });
      setPlayersList(nList);
      connsRef.current.forEach(function (c) {
        if (c.open) c.send({
          type: 'PLAYERS_UPDATE',
          players: nList
        });
      });
      if (targetId === myId) {
        var me = nList.find(function (p) {
          return p.id === myId;
        });
        if (me) setIsSpectator(me.isSpectator);
      }
    } else if (connRef.current && connRef.current.open && targetId === myId) {
      connRef.current.send({
        type: 'REQ_SPEC_TOGGLE',
        targetId: myId,
        isTemp: isTemp,
        forceState: forceState
      });
    }
  };

  // 強制開始邏輯 (v3.8.30)
  var handleForceStart = function handleForceStart() {
    if (!isHostRef.current) return;
    // 開賽時清掉仍未到的五戰預期席位（遲到者進場會以觀戰者加入，不卡結算）
    if ((playersListRef.current || []).some(function (p) {
      return p.pending;
    })) {
      var nList = playersListRef.current.filter(function (p) {
        return !p.pending;
      });
      setPlayersList(nList);
      connsRef.current.forEach(function (c) {
        if (c.open) c.send({
          type: 'PLAYERS_UPDATE',
          players: nList
        });
      });
    }
    var target = Date.now() + 5000;
    syncState({
      matchPhase: 'countdown',
      countdownTarget: target
    }, true);
    showToast("⚡ 房主已強制啟動對局！");
  };
  var handlePlayAgain = function handlePlayAgain() {
    if (isMultiplayer && !isHostRef.current && engineRef.current === 'peerjs') {
      if (connRef.current) connRef.current.send({
        type: 'REQ_PLAY_DIRECT'
      });
      showToast("已向主機發送強制開局請求...");
      return;
    }
    if (isHostRef.current && isMultiplayer) {
      // 房主直接本地生成新一盤並略過大廳
      generateAndSync(sizeId, diffId, undefined, true);
      return;
    }
    setIsWon(false);
    setIsClosingModal(true);
    setTimeout(function () {
      setIsClosingModal(false);
      if (handleRegenerateRandomRef.current) handleRegenerateRandomRef.current();
    }, 300);
  };
  var handleBackToLobby = function handleBackToLobby() {
    if (platHubRef.current) {
      if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY('game-exit');
      return;
    } // 平台房間框架：回等待室＝回殼的房間頁（房主帶全員、來賓只回自己）
    if (isMultiplayer && !isHostRef.current && engineRef.current === 'peerjs') {
      if (connRef.current) connRef.current.send({
        type: 'REQ_PLAY_AGAIN'
      });
      showToast("已向主機發送返回大廳請求...");
      return;
    }
    if (isHostRef.current && isMultiplayer) {
      generateAndSync(sizeId, diffId, undefined, false);
      return;
    }
  };
  var closeVictoryModal = function closeVictoryModal() {
    return setHideVictoryModal(true);
  };
  var toastTimerRef = useRef(null);
  var showToast = function showToast(m) {
    if (typeof window !== 'undefined' && window.__PLAT_TOAST) {
      window.__PLAT_TOAST(m);
      return;
    }
    setToastMsg(m);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(function () {
      return setToastMsg("");
    }, 4000);
  }; // 平台內統一走殼 toast（美學稽核 V-07：三款一式）；獨立版才用本地 toast。新 toast 先取消舊計時器，否則前一則的計時器會提早清掉後一則（稽核修）

  var getSvgCoords = function getSvgCoords(clientX, clientY) {
    var svg = svgRef.current;
    if (!svg) return null;
    var pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    var ctm = svg.getScreenCTM();
    return ctm ? pt.matrixTransform(ctm.inverse()) : null;
  };
  var eraseAtPoint = function eraseAtPoint(cx, cy) {
    var offsets = [[0, 0], [15, 0], [-15, 0], [0, 15], [0, -15], [10, 10], [-10, -10], [10, -10], [-10, 10]];
    var hitIds = new Set();
    for (var _i3 = 0, _offsets = offsets; _i3 < _offsets.length; _i3++) {
      var off = _offsets[_i3];
      var els = document.elementsFromPoint(cx + off[0], cy + off[1]);
      var _iterator3 = _createForOfIteratorHelper(els),
        _step3;
      try {
        var _loop6 = function _loop6() {
          var el = _step3.value;
          if (el.classList.contains('doodle-stroke')) {
            var sid = el.getAttribute('data-stroke-id');
            var strokeObj = stateRef.current.strokes.find(function (s) {
              return s.id === sid;
            });
            if ((strokeObj && strokeObj.uid || (strokeObj ? strokeObj.id.split('-')[1] : null)) === myId) hitIds.add(sid);
          }
        };
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          _loop6();
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
    if (hitIds.size > 0) {
      var newStrokes = stateRef.current.strokes.filter(function (s) {
        return !hitIds.has(s.id);
      });
      if (newStrokes.length !== stateRef.current.strokes.length) syncState({
        strokes: newStrokes
      });
    }
  };
  var clearCell = function clearCell(cellId) {
    if (isWon || interactionMode >= 2 || winner || matchPhase !== 'playing' || isSpectator) return;
    var cur = stateRef.current.isBrawlMode ? stateRef.current.localCells : stateRef.current.cells;
    var targetIdx = cur.findIndex(function (c) {
      return c.id === cellId;
    });
    if (targetIdx === -1) return;
    var target = cur[targetIdx];
    if (isCellFrozen(cellId)) {
      frozenToast('清除');
      return;
    }
    // 只有玩家自己填上的數字能被長按清除，題目或收禮系統填的不能清
    if (target.isGiven || target.isSystemRevealed || target.value === null) return;
    if (engineRef.current === 'none') setHistory(function (past) {
      return [].concat(_toConsumableArray(past.slice(past.length > 25 ? 1 : 0)), [cur]);
    });
    var nextCells = _toConsumableArray(cur);
    nextCells[targetIdx] = _objectSpread(_objectSpread({}, target), {}, {
      value: null,
      owner: null
    });
    if (stateRef.current.isBrawlMode) {
      syncState({
        localCells: nextCells
      }, false);
    } else {
      syncState({
        cells: nextCells
      });
    }
    showToast("🧽 已清除該格內容");
  };
  var handlePointerDown = function handlePointerDown(e) {
    if (matchPhase !== 'playing' || isSpectator) return;
    if (e.cancelable) e.preventDefault(); // 先宣示這次點按由遊戲處理：擋掉瀏覽器拿它去做手勢仲裁/滑鼠事件合成的起點（觸控筆同點連點時第二下被 claim 的主因之一）
    var pt = getSvgCoords(e.clientX, e.clientY);
    if (!pt) return;
    if (interactionMode === 2) {
      e.target.setPointerCapture(e.pointerId);
      if (drawSubMode === 'pen') {
        isDrawingRef.current = true;
        currentPathDataRef.current = "M ".concat(pt.x, " ").concat(pt.y);
        if (drawingPathRef.current) {
          drawingPathRef.current.setAttribute('d', currentPathDataRef.current);
          drawingPathRef.current.style.display = 'block';
        }
      } else if (drawSubMode === 'eraser') eraseAtPoint(e.clientX, e.clientY);
    } else {
      setRipples(function (prev) {
        return [].concat(_toConsumableArray(prev), [{
          id: Date.now() + Math.random(),
          uid: myId,
          x: pt.x,
          y: pt.y,
          timestamp: Date.now()
        }]);
      });

      // 設定長按清除偵測＋記錄本次點按：放開時改由 pointerup 直接處理點按，不再單靠 click——
      // 觸控筆快速連點時瀏覽器的手勢仲裁常把 click 吃掉（水波紋已渲染、數字卻沒填，使用者實機回報）
      var cx = Math.floor((pt.x - PADDING) / CELL_SIZE);
      var cy = Math.floor((pt.y - PADDING) / CELL_SIZE);
      if (cx >= 0 && cx < cSizeDef.size && cy >= 0 && cy < cSizeDef.size) {
        var cellId = "".concat(cx, "-").concat(cy);
        setPressedCellId(cellId);
        isLongPressTriggered.current = false;
        touchStartPt.current = pt;
        var seq = ++tapSeqRef.current;
        tapInfoRef.current = {
          cellId: cellId,
          seq: seq,
          x: pt.x,
          y: pt.y,
          cx: e.clientX,
          cy: e.clientY
        };
        var cellTrk = platTapNew({
          slop: 22,
          longpressMs: 500
        });
        cellTrk.down(e.clientX, e.clientY, Date.now());
        cellTrkRef.current = cellTrk;
        cellLongPressTimer.current = setTimeout(function () {
          if (cellTrk.poll(Date.now()) !== 'longpress') return; // 共用判定：到時才算長按、只觸發一次（PlatTap，v1.63.0）
          clearCell(cellId);
          isLongPressTriggered.current = true;
          longPressSeqRef.current = seq;
          if (navigator.vibrate) navigator.vibrate(50);
          cellLongPressTimer.current = null;
        }, 500); // 500毫秒視為長按
      } else {
        tapInfoRef.current = null;
      }
    }
    if (engineRef.current !== 'peerjs' || !showOtherCursors) return;
    var msg = {
      type: 'CLICK',
      uid: myId,
      x: pt.x,
      y: pt.y
    };
    if (isHostRef.current) connsRef.current.forEach(function (c) {
      return c.send(msg);
    });else if (connRef.current) connRef.current.send(msg);
  };
  var handlePointerMove = function handlePointerMove(e) {
    if (matchPhase !== 'playing' || isSpectator) return;
    var pt = getSvgCoords(e.clientX, e.clientY);
    if (interactionMode === 2) {
      if (drawSubMode === 'eraser') {
        if (pt && eraserRef.current) {
          eraserRef.current.setAttribute('cx', pt.x);
          eraserRef.current.setAttribute('cy', pt.y);
          if (eraserRef.current.style.display === 'none') eraserRef.current.style.display = 'block';
        }
        if ((e.buttons > 0 || e.pointerType === 'touch') && Date.now() - lastEraseTimeRef.current > 50) {
          eraseAtPoint(e.clientX, e.clientY);
          lastEraseTimeRef.current = Date.now();
        }
      } else if (drawSubMode === 'pen' && isDrawingRef.current && pt && currentPathDataRef.current) {
        currentPathDataRef.current += " L ".concat(pt.x, " ").concat(pt.y);
        if (drawingPathRef.current) {
          drawingPathRef.current.setAttribute('d', currentPathDataRef.current);
        }
      }
    } else {
      // 防手震：如果移動超過10px就取消長按判定
      if (cellLongPressTimer.current && touchStartPt.current && pt) {
        var dist = Math.hypot(pt.x - touchStartPt.current.x, pt.y - touchStartPt.current.y);
        if (dist > 10) {
          clearTimeout(cellLongPressTimer.current);
          cellLongPressTimer.current = null;
        }
      }
    }
    if (!showOtherCursors) return;
    if (Date.now() - lastCursorSend.current < 50) return;
    lastCursorSend.current = Date.now();
    if (pt) {
      var msg = {
        type: 'CURSOR',
        uid: myId,
        x: pt.x,
        y: pt.y
      };
      if (engineRef.current === 'peerjs') {
        if (isHostRef.current) connsRef.current.forEach(function (c) {
          return c.send(msg);
        });else if (connRef.current) connRef.current.send(msg);
      }
    }
  };
  var handlePointerUp = function handlePointerUp(e) {
    setPressedCellId(null);
    if (matchPhase !== 'playing' || isSpectator) return;
    if (cellLongPressTimer.current) {
      clearTimeout(cellLongPressTimer.current);
      cellLongPressTimer.current = null;
    }

    // 點按在 pointerup 直接處理（見 pointerdown 註解）：只認「放開時還在同一格、且這次點按沒觸發長按」。
    // 處理過就記 dedupe，跟隨其後的 click 不再重複觸發；長按放開也標記已消費，擋掉隨後的 click。
    // pointercancel 也進來：點按被瀏覽器手勢仲裁 claim 走時只補發 cancel（觸控筆同點連點的第二下最常見）——
    // 筆尖幾乎沒動（≤6 單位）才當點按補處理；捲動起手在被 claim 前早已移動超過這個量，不會被誤補成填數字。
    var tapInfo = tapInfoRef.current;
    tapInfoRef.current = null;
    var cellTrk = cellTrkRef.current;
    cellTrkRef.current = null;
    if (tapInfo && e.type === 'pointerleave') {
      // 手勢在盤面外結束：標記已結算，擋掉放開位置（可能是數字鍵）上的尾隨 click 誤觸
      supTrk().markSuppress(Date.now());
      if (cellTrk) cellTrk.cancel();
    }
    if ((e.type === 'pointerup' || e.type === 'pointercancel') && interactionMode < 2 && tapInfo) {
      // v1.63.0：點按判定收編 PlatTap（守恆 v1.56.0 語意）——client 漂移 ≤22 對按下那格執行、每次結算必標記抑制（尾隨 click 全擋）；長按以 seq 判定優先；cancel 的觸控筆救援（SVG ≤6）為有界例外、保留原判
      var gres = cellTrk ? e.type === 'pointercancel' ? cellTrk.cancel(e.clientX, e.clientY, Date.now()) : cellTrk.up(e.clientX, e.clientY, Date.now()) : {
        type: 'none'
      };
      if (longPressSeqRef.current === tapInfo.seq) {
        supTrk().markSuppress(Date.now());
      } else if (e.type === 'pointercancel') {
        // 觸控筆救援保留（有界例外）：cancel 且幾乎沒動（SVG ≤6 單位）視為點按補處理；捲動起手在被 claim 前早已移動超過此量。其餘 cancel 作廢。
        var upPt = getSvgCoords(e.clientX, e.clientY);
        supTrk().markSuppress(Date.now());
        if (upPt && Math.hypot(upPt.x - tapInfo.x, upPt.y - tapInfo.y) <= 6) handleCellClick(tapInfo.cellId);
      } else {
        supTrk().markSuppress(Date.now());
        if (gres.type === 'tap') handleCellClick(tapInfo.cellId);
      }
    }
    if (interactionMode === 2) {
      if (drawSubMode === 'pen' && isDrawingRef.current) {
        isDrawingRef.current = false;
        if (currentPathDataRef.current) {
          var newStroke = {
            id: Date.now() + '-' + myId,
            uid: myId,
            path: currentPathDataRef.current
          };
          syncState({
            strokes: [].concat(_toConsumableArray(stateRef.current.strokes), [newStroke])
          }, !isBrawlMode);
          currentPathDataRef.current = "";
          if (drawingPathRef.current) drawingPathRef.current.style.display = 'none';
        }
      }
      if (e.type === 'pointerleave' || e.type === 'pointercancel' || e.pointerType === 'touch') if (eraserRef.current) eraserRef.current.style.display = 'none';
    }
  };
  var clearOwnStrokes = function clearOwnStrokes() {
    var filtered = stateRef.current.strokes.filter(function (s) {
      return !s.id.endsWith('-' + myId);
    });
    syncState({
      strokes: filtered
    }, !isBrawlMode);
    showToast("🗑️ 已清除你所有的塗鴉");
  };
  var clearAllStrokes = function clearAllStrokes() {
    if (isHostRef.current) {
      syncState({
        strokes: []
      }, !isBrawlMode);
      if (!isBrawlMode) showToast("🚨 房主已清空全場塗鴉");else showToast("🗑️ 已清空塗鴉");
    }
  };
  var clearAllPlayers = function clearAllPlayers() {
    setPlayersList(function (prev) {
      var hostPlayer = prev.find(function (p) {
        return p.id === myId;
      });
      if (!hostPlayer) return prev;
      var newList = [hostPlayer];
      if (engineRef.current === 'peerjs') {
        connsRef.current = connsRef.current.filter(function (c) {
          return c.open;
        });
        connsRef.current.forEach(function (c) {
          c.send({
            type: 'PLAYERS_UPDATE',
            players: newList
          });
          c.send({
            type: 'REQ_REJOIN'
          });
        });
      }
      return newList;
    });
  };
  var autoFillHiddenSingles = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(_char3) {
      var changed, stateChanged, currentCells, isValid, fill, _loop7, y, _loop8, x, _loop9, b;
      return _regeneratorRuntime().wrap(function _callee2$(_context5) {
        while (1) switch (_context5.prev = _context5.next) {
          case 0:
            if (stateRef.current.brawlSettings.allowQuickFill) {
              _context5.next = 3;
              break;
            }
            showToast("⚠️ 已關閉快速填答功能");
            return _context5.abrupt("return");
          case 3:
            if (!isAutoFillingRef.current) {
              _context5.next = 5;
              break;
            }
            return _context5.abrupt("return");
          case 5:
            isAutoFillingRef.current = true;
            syncState({
              isAutoFilling: true,
              selectedChar: _char3
            }, !isBrawlMode);
            changed = false;
            stateChanged = false;
            currentCells = _toConsumableArray(isBrawlMode ? stateRef.current.localCells : stateRef.current.cells);
            isValid = function isValid(cell, gridCells) {
              if (cell.value !== null) return false;
              var _iterator4 = _createForOfIteratorHelper(gridCells),
                _step4;
              try {
                for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                  var other = _step4.value;
                  if (other.value === _char3) {
                    if (other.x === cell.x || other.y === cell.y || other.boxId === cell.boxId) return false;
                  }
                }
              } catch (err) {
                _iterator4.e(err);
              } finally {
                _iterator4.f();
              }
              return true;
            };
            fill = /*#__PURE__*/function () {
              var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(cellId) {
                var idx, targetCell, i, c, me, msg;
                return _regeneratorRuntime().wrap(function _callee$(_context) {
                  while (1) switch (_context.prev = _context.next) {
                    case 0:
                      idx = currentCells.findIndex(function (c) {
                        return c.id === cellId;
                      });
                      if (!(idx !== -1)) {
                        _context.next = 11;
                        break;
                      }
                      currentCells = _toConsumableArray(currentCells);
                      targetCell = currentCells[idx];
                      currentCells[idx] = _objectSpread(_objectSpread({}, targetCell), {}, {
                        value: _char3,
                        drafts: [],
                        owner: myId
                      });
                      changed = true;
                      stateChanged = true;
                      for (i = 0; i < currentCells.length; i++) {
                        if (i !== idx) {
                          c = currentCells[i];
                          if (c.x === targetCell.x || c.y === targetCell.y || c.boxId === targetCell.boxId) {
                            if (c.drafts.includes(_char3)) currentCells[i] = _objectSpread(_objectSpread({}, c), {}, {
                              drafts: c.drafts.filter(function (d) {
                                return d !== _char3;
                              })
                            });
                          }
                        }
                      }
                      if (isBrawlMode) {
                        syncState({
                          localCells: currentCells
                        }, false);
                        if (isMultiplayer) {
                          me = playersListRef.current.find(function (p) {
                            return p.id === myId;
                          });
                          msg = {
                            type: 'GHOST_SOLVED',
                            uid: myId,
                            color: me ? me.color : myColorRef.current,
                            cellId: cellId,
                            id: Math.random().toString(36).substring(2, 11),
                            value: _char3
                          };
                          if (engineRef.current === 'peerjs') {
                            if (isHostRef.current) connsRef.current.forEach(function (c) {
                              return c.send(msg);
                            });else if (connRef.current) connRef.current.send(msg);
                          }
                        }
                      } else {
                        syncState({
                          cells: currentCells
                        });
                      }
                      _context.next = 11;
                      return new Promise(function (r) {
                        return setTimeout(r, 100);
                      });
                    case 11:
                    case "end":
                      return _context.stop();
                  }
                }, _callee);
              }));
              return function fill(_x2) {
                return _ref5.apply(this, arguments);
              };
            }();
          case 12:
            changed = false;
            _loop7 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop7(y) {
              var rowCells, validEmpties;
              return _regeneratorRuntime().wrap(function _loop7$(_context2) {
                while (1) switch (_context2.prev = _context2.next) {
                  case 0:
                    rowCells = currentCells.filter(function (c) {
                      return c.y === y;
                    });
                    if (!rowCells.some(function (c) {
                      return c.value === _char3;
                    })) {
                      _context2.next = 3;
                      break;
                    }
                    return _context2.abrupt("return", 1);
                  case 3:
                    validEmpties = rowCells.filter(function (c) {
                      return isValid(c, currentCells);
                    });
                    if (!(validEmpties.length === 1)) {
                      _context2.next = 7;
                      break;
                    }
                    _context2.next = 7;
                    return fill(validEmpties[0].id);
                  case 7:
                  case "end":
                    return _context2.stop();
                }
              }, _loop7);
            });
            y = 0;
          case 15:
            if (!(y < cSizeDef.size)) {
              _context5.next = 22;
              break;
            }
            return _context5.delegateYield(_loop7(y), "t0", 17);
          case 17:
            if (!_context5.t0) {
              _context5.next = 19;
              break;
            }
            return _context5.abrupt("continue", 19);
          case 19:
            y++;
            _context5.next = 15;
            break;
          case 22:
            if (!changed) {
              _context5.next = 24;
              break;
            }
            return _context5.abrupt("continue", 44);
          case 24:
            _loop8 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop8(x) {
              var colCells, validEmpties;
              return _regeneratorRuntime().wrap(function _loop8$(_context3) {
                while (1) switch (_context3.prev = _context3.next) {
                  case 0:
                    colCells = currentCells.filter(function (c) {
                      return c.x === x;
                    });
                    if (!colCells.some(function (c) {
                      return c.value === _char3;
                    })) {
                      _context3.next = 3;
                      break;
                    }
                    return _context3.abrupt("return", 1);
                  case 3:
                    validEmpties = colCells.filter(function (c) {
                      return isValid(c, currentCells);
                    });
                    if (!(validEmpties.length === 1)) {
                      _context3.next = 7;
                      break;
                    }
                    _context3.next = 7;
                    return fill(validEmpties[0].id);
                  case 7:
                  case "end":
                    return _context3.stop();
                }
              }, _loop8);
            });
            x = 0;
          case 26:
            if (!(x < cSizeDef.size)) {
              _context5.next = 33;
              break;
            }
            return _context5.delegateYield(_loop8(x), "t1", 28);
          case 28:
            if (!_context5.t1) {
              _context5.next = 30;
              break;
            }
            return _context5.abrupt("continue", 30);
          case 30:
            x++;
            _context5.next = 26;
            break;
          case 33:
            if (!changed) {
              _context5.next = 35;
              break;
            }
            return _context5.abrupt("continue", 44);
          case 35:
            _loop9 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop9(b) {
              var boxCells, validEmpties;
              return _regeneratorRuntime().wrap(function _loop9$(_context4) {
                while (1) switch (_context4.prev = _context4.next) {
                  case 0:
                    boxCells = currentCells.filter(function (c) {
                      return c.boxId === b;
                    });
                    if (!boxCells.some(function (c) {
                      return c.value === _char3;
                    })) {
                      _context4.next = 3;
                      break;
                    }
                    return _context4.abrupt("return", 1);
                  case 3:
                    validEmpties = boxCells.filter(function (c) {
                      return isValid(c, currentCells);
                    });
                    if (!(validEmpties.length === 1)) {
                      _context4.next = 7;
                      break;
                    }
                    _context4.next = 7;
                    return fill(validEmpties[0].id);
                  case 7:
                  case "end":
                    return _context4.stop();
                }
              }, _loop9);
            });
            b = 0;
          case 37:
            if (!(b < cSizeDef.size)) {
              _context5.next = 44;
              break;
            }
            return _context5.delegateYield(_loop9(b), "t2", 39);
          case 39:
            if (!_context5.t2) {
              _context5.next = 41;
              break;
            }
            return _context5.abrupt("continue", 41);
          case 41:
            b++;
            _context5.next = 37;
            break;
          case 44:
            if (changed) {
              _context5.next = 12;
              break;
            }
          case 45:
            if (stateChanged) {
              if (engineRef.current === 'none') setHistory(function (past) {
                return [].concat(_toConsumableArray(past.slice(past.length > 25 ? 1 : 0)), [currentCells]);
              });
              if (currentCells.every(function (c) {
                return c.value !== null;
              })) syncState({
                selectedChar: null
              }, !isBrawlMode);else showToast("\u2705 \u81EA\u52D5\u586B\u5165 ".concat(_char3, " \u6210\u529F\uFF01"));
            } else {
              showToast("\uD83D\uDCA1 \u76EE\u524D\u627E\u4E0D\u5230\u5FC5\u5B9A\u70BA ".concat(_char3, " \u7684\u7A7A\u683C\u4E86"));
            }
            isAutoFillingRef.current = false;
            syncState({
              isAutoFilling: false,
              selectedChar: null
            }, !isBrawlMode);
          case 48:
          case "end":
            return _context5.stop();
        }
      }, _callee2);
    }));
    return function autoFillHiddenSingles(_x) {
      return _ref4.apply(this, arguments);
    };
  }();
  var autoFillDrafts = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(_char4) {
      var stateChanged, currentCells, isValid, _loop10, y;
      return _regeneratorRuntime().wrap(function _callee3$(_context8) {
        while (1) switch (_context8.prev = _context8.next) {
          case 0:
            if (stateRef.current.brawlSettings.allowQuickFill) {
              _context8.next = 3;
              break;
            }
            showToast("⚠️ 已關閉快速填答功能");
            return _context8.abrupt("return");
          case 3:
            if (!isAutoFillingRef.current) {
              _context8.next = 5;
              break;
            }
            return _context8.abrupt("return");
          case 5:
            isAutoFillingRef.current = true;
            syncState({
              isAutoFilling: true,
              selectedChar: _char4
            }, !isBrawlMode);
            stateChanged = false;
            currentCells = _toConsumableArray(isBrawlMode ? stateRef.current.localCells : stateRef.current.cells);
            isValid = function isValid(cell) {
              if (cell.value !== null) return false;
              var _iterator5 = _createForOfIteratorHelper(currentCells),
                _step5;
              try {
                for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                  var other = _step5.value;
                  if (other.value === _char4) {
                    if (other.x === cell.x || other.y === cell.y || other.boxId === cell.boxId) return false;
                  }
                }
              } catch (err) {
                _iterator5.e(err);
              } finally {
                _iterator5.f();
              }
              return true;
            };
            _loop10 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop10(y) {
              var rowChanged, newRowCells, _loop11, x;
              return _regeneratorRuntime().wrap(function _loop10$(_context7) {
                while (1) switch (_context7.prev = _context7.next) {
                  case 0:
                    rowChanged = false;
                    newRowCells = _toConsumableArray(currentCells);
                    _loop11 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop11(x) {
                      var cellIdx, cell;
                      return _regeneratorRuntime().wrap(function _loop11$(_context6) {
                        while (1) switch (_context6.prev = _context6.next) {
                          case 0:
                            cellIdx = newRowCells.findIndex(function (c) {
                              return c.x === x && c.y === y;
                            });
                            cell = newRowCells[cellIdx];
                            if (cell.value === null && isValid(cell)) {
                              if (!cell.drafts.includes(_char4)) {
                                newRowCells[cellIdx] = _objectSpread(_objectSpread({}, cell), {}, {
                                  drafts: [].concat(_toConsumableArray(cell.drafts), [_char4])
                                });
                                stateChanged = true;
                                rowChanged = true;
                              }
                            }
                          case 3:
                          case "end":
                            return _context6.stop();
                        }
                      }, _loop11);
                    });
                    x = 0;
                  case 4:
                    if (!(x < cSizeDef.size)) {
                      _context7.next = 9;
                      break;
                    }
                    return _context7.delegateYield(_loop11(x), "t0", 6);
                  case 6:
                    x++;
                    _context7.next = 4;
                    break;
                  case 9:
                    if (!rowChanged) {
                      _context7.next = 14;
                      break;
                    }
                    currentCells = newRowCells;
                    if (isBrawlMode) syncState({
                      localCells: currentCells
                    }, false);else syncState({
                      cells: currentCells
                    });
                    _context7.next = 14;
                    return new Promise(function (r) {
                      return setTimeout(r, 40);
                    });
                  case 14:
                  case "end":
                    return _context7.stop();
                }
              }, _loop10);
            });
            y = 0;
          case 12:
            if (!(y < cSizeDef.size)) {
              _context8.next = 17;
              break;
            }
            return _context8.delegateYield(_loop10(y), "t0", 14);
          case 14:
            y++;
            _context8.next = 12;
            break;
          case 17:
            if (stateChanged) {
              if (engineRef.current === 'none') setHistory(function (past) {
                return [].concat(_toConsumableArray(past.slice(past.length > 25 ? 1 : 0)), [currentCells]);
              });
              showToast("\u270F\uFE0F \u5DF2\u5C07 ".concat(_char4, " \u6A19\u8A18\u81F3\u6240\u6709\u5B89\u5168\u7684\u7A7A\u683C\u4E2D"));
            } else {
              showToast("\uD83D\uDCA1 \u6C92\u6709\u66F4\u591A\u5B89\u5168\u7684\u7A7A\u683C\u53EF\u4EE5\u6A19\u8A18 ".concat(_char4, " \u4E86"));
            }
            isAutoFillingRef.current = false;
            syncState({
              isAutoFilling: false,
              selectedChar: null
            }, !isBrawlMode);
          case 20:
          case "end":
            return _context8.stop();
        }
      }, _callee3);
    }));
    return function autoFillDrafts(_x3) {
      return _ref6.apply(this, arguments);
    };
  }();
  var runAutoFillCycle = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(startChar) {
      var changed, stateChanged, currentCells, totalFilled, chars, startIndex, isValid, isCharCompleted, fill, passChanged, _loop12, _ret, i;
      return _regeneratorRuntime().wrap(function _callee5$(_context14) {
        while (1) switch (_context14.prev = _context14.next) {
          case 0:
            if (stateRef.current.brawlSettings.allowTraversal) {
              _context14.next = 3;
              break;
            }
            showToast("⚠️ 已關閉循環功能");
            return _context14.abrupt("return");
          case 3:
            if (!isAutoFillingRef.current) {
              _context14.next = 5;
              break;
            }
            return _context14.abrupt("return");
          case 5:
            isAutoFillingRef.current = true;
            syncState({
              isAutoFilling: true
            }, !isBrawlMode);
            changed = false;
            stateChanged = false;
            currentCells = _toConsumableArray(isBrawlMode ? stateRef.current.localCells : stateRef.current.cells);
            totalFilled = 0;
            chars = cSizeDef.chars;
            startIndex = chars.indexOf(startChar);
            isValid = function isValid(cell, gridCells, checkChar) {
              if (cell.value !== null) return false;
              var _iterator6 = _createForOfIteratorHelper(gridCells),
                _step6;
              try {
                for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                  var other = _step6.value;
                  if (other.value === checkChar) {
                    if (other.x === cell.x || other.y === cell.y || other.boxId === cell.boxId) return false;
                  }
                }
              } catch (err) {
                _iterator6.e(err);
              } finally {
                _iterator6.f();
              }
              return true;
            };
            isCharCompleted = function isCharCompleted(checkChar, gridCells) {
              return gridCells.filter(function (c) {
                return c.value === checkChar;
              }).length === cSizeDef.size;
            };
            fill = /*#__PURE__*/function () {
              var _ref8 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(cellId, fillChar) {
                var idx, targetCell, i, c, me, msg;
                return _regeneratorRuntime().wrap(function _callee4$(_context9) {
                  while (1) switch (_context9.prev = _context9.next) {
                    case 0:
                      idx = currentCells.findIndex(function (c) {
                        return c.id === cellId;
                      });
                      if (!(idx !== -1)) {
                        _context9.next = 12;
                        break;
                      }
                      currentCells = _toConsumableArray(currentCells);
                      targetCell = currentCells[idx];
                      currentCells[idx] = _objectSpread(_objectSpread({}, targetCell), {}, {
                        value: fillChar,
                        drafts: [],
                        owner: myId
                      });
                      changed = true;
                      stateChanged = true;
                      totalFilled++;
                      for (i = 0; i < currentCells.length; i++) {
                        if (i !== idx) {
                          c = currentCells[i];
                          if (c.x === targetCell.x || c.y === targetCell.y || c.boxId === targetCell.boxId) {
                            if (c.drafts.includes(fillChar)) {
                              currentCells[i] = _objectSpread(_objectSpread({}, c), {}, {
                                drafts: c.drafts.filter(function (d) {
                                  return d !== fillChar;
                                })
                              });
                            }
                          }
                        }
                      }
                      if (isBrawlMode) {
                        syncState({
                          localCells: currentCells,
                          selectedChar: fillChar
                        }, false);
                        if (isMultiplayer) {
                          me = playersListRef.current.find(function (p) {
                            return p.id === myId;
                          });
                          msg = {
                            type: 'GHOST_SOLVED',
                            uid: myId,
                            color: me ? me.color : myColorRef.current,
                            cellId: cellId,
                            id: Math.random().toString(36).substring(2, 11),
                            value: fillChar
                          };
                          if (engineRef.current === 'peerjs') {
                            if (isHostRef.current) connsRef.current.forEach(function (c) {
                              return c.send(msg);
                            });else if (connRef.current) connRef.current.send(msg);
                          }
                        }
                      } else {
                        syncState({
                          cells: currentCells,
                          selectedChar: fillChar
                        });
                      }
                      _context9.next = 12;
                      return new Promise(function (r) {
                        return setTimeout(r, 100);
                      });
                    case 12:
                    case "end":
                      return _context9.stop();
                  }
                }, _callee4);
              }));
              return function fill(_x5, _x6) {
                return _ref8.apply(this, arguments);
              };
            }();
          case 16:
            passChanged = false;
            _loop12 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop12() {
              var charIdx, _char5, _loop13, y, _loop14, x, _loop15, b;
              return _regeneratorRuntime().wrap(function _loop12$(_context13) {
                while (1) switch (_context13.prev = _context13.next) {
                  case 0:
                    charIdx = (startIndex + i) % chars.length;
                    _char5 = chars[charIdx];
                    if (!currentCells.every(function (c) {
                      return c.value !== null;
                    })) {
                      _context13.next = 4;
                      break;
                    }
                    return _context13.abrupt("return", 0);
                  case 4:
                    if (!isCharCompleted(_char5, currentCells)) {
                      _context13.next = 6;
                      break;
                    }
                    return _context13.abrupt("return", 1);
                  case 6:
                    syncState({
                      selectedChar: _char5
                    }, !isBrawlMode);
                    _context13.next = 9;
                    return new Promise(function (r) {
                      return setTimeout(r, 50);
                    });
                  case 9:
                    changed = false;
                    _loop13 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop13(y) {
                      var rowCells, validEmpties;
                      return _regeneratorRuntime().wrap(function _loop13$(_context10) {
                        while (1) switch (_context10.prev = _context10.next) {
                          case 0:
                            rowCells = currentCells.filter(function (c) {
                              return c.y === y;
                            });
                            if (!rowCells.some(function (c) {
                              return c.value === _char5;
                            })) {
                              _context10.next = 3;
                              break;
                            }
                            return _context10.abrupt("return", 1);
                          case 3:
                            validEmpties = rowCells.filter(function (c) {
                              return isValid(c, currentCells, _char5);
                            });
                            if (!(validEmpties.length === 1)) {
                              _context10.next = 7;
                              break;
                            }
                            _context10.next = 7;
                            return fill(validEmpties[0].id, _char5);
                          case 7:
                          case "end":
                            return _context10.stop();
                        }
                      }, _loop13);
                    });
                    y = 0;
                  case 12:
                    if (!(y < cSizeDef.size)) {
                      _context13.next = 19;
                      break;
                    }
                    return _context13.delegateYield(_loop13(y), "t0", 14);
                  case 14:
                    if (!_context13.t0) {
                      _context13.next = 16;
                      break;
                    }
                    return _context13.abrupt("continue", 16);
                  case 16:
                    y++;
                    _context13.next = 12;
                    break;
                  case 19:
                    if (!changed) {
                      _context13.next = 22;
                      break;
                    }
                    passChanged = true;
                    return _context13.abrupt("continue", 44);
                  case 22:
                    _loop14 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop14(x) {
                      var colCells, validEmpties;
                      return _regeneratorRuntime().wrap(function _loop14$(_context11) {
                        while (1) switch (_context11.prev = _context11.next) {
                          case 0:
                            colCells = currentCells.filter(function (c) {
                              return c.x === x;
                            });
                            if (!colCells.some(function (c) {
                              return c.value === _char5;
                            })) {
                              _context11.next = 3;
                              break;
                            }
                            return _context11.abrupt("return", 1);
                          case 3:
                            validEmpties = colCells.filter(function (c) {
                              return isValid(c, currentCells, _char5);
                            });
                            if (!(validEmpties.length === 1)) {
                              _context11.next = 7;
                              break;
                            }
                            _context11.next = 7;
                            return fill(validEmpties[0].id, _char5);
                          case 7:
                          case "end":
                            return _context11.stop();
                        }
                      }, _loop14);
                    });
                    x = 0;
                  case 24:
                    if (!(x < cSizeDef.size)) {
                      _context13.next = 31;
                      break;
                    }
                    return _context13.delegateYield(_loop14(x), "t1", 26);
                  case 26:
                    if (!_context13.t1) {
                      _context13.next = 28;
                      break;
                    }
                    return _context13.abrupt("continue", 28);
                  case 28:
                    x++;
                    _context13.next = 24;
                    break;
                  case 31:
                    if (!changed) {
                      _context13.next = 34;
                      break;
                    }
                    passChanged = true;
                    return _context13.abrupt("continue", 44);
                  case 34:
                    _loop15 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop15(b) {
                      var boxCells, validEmpties;
                      return _regeneratorRuntime().wrap(function _loop15$(_context12) {
                        while (1) switch (_context12.prev = _context12.next) {
                          case 0:
                            boxCells = currentCells.filter(function (c) {
                              return c.boxId === b;
                            });
                            if (!boxCells.some(function (c) {
                              return c.value === _char5;
                            })) {
                              _context12.next = 3;
                              break;
                            }
                            return _context12.abrupt("return", 1);
                          case 3:
                            validEmpties = boxCells.filter(function (c) {
                              return isValid(c, currentCells, _char5);
                            });
                            if (!(validEmpties.length === 1)) {
                              _context12.next = 7;
                              break;
                            }
                            _context12.next = 7;
                            return fill(validEmpties[0].id, _char5);
                          case 7:
                          case "end":
                            return _context12.stop();
                        }
                      }, _loop15);
                    });
                    b = 0;
                  case 36:
                    if (!(b < cSizeDef.size)) {
                      _context13.next = 43;
                      break;
                    }
                    return _context13.delegateYield(_loop15(b), "t2", 38);
                  case 38:
                    if (!_context13.t2) {
                      _context13.next = 40;
                      break;
                    }
                    return _context13.abrupt("continue", 40);
                  case 40:
                    b++;
                    _context13.next = 36;
                    break;
                  case 43:
                    if (changed) passChanged = true;
                  case 44:
                    if (changed) {
                      _context13.next = 9;
                      break;
                    }
                  case 45:
                  case "end":
                    return _context13.stop();
                }
              }, _loop12);
            });
            i = 0;
          case 19:
            if (!(i < chars.length)) {
              _context14.next = 29;
              break;
            }
            return _context14.delegateYield(_loop12(), "t0", 21);
          case 21:
            _ret = _context14.t0;
            if (!(_ret === 0)) {
              _context14.next = 24;
              break;
            }
            return _context14.abrupt("break", 29);
          case 24:
            if (!(_ret === 1)) {
              _context14.next = 26;
              break;
            }
            return _context14.abrupt("continue", 26);
          case 26:
            i++;
            _context14.next = 19;
            break;
          case 29:
            if (passChanged && !currentCells.every(function (c) {
              return c.value !== null;
            })) {
              _context14.next = 16;
              break;
            }
          case 30:
            if (stateChanged) {
              if (engineRef.current === 'none') {
                setHistory(function (past) {
                  return [].concat(_toConsumableArray(past.slice(past.length > 25 ? 1 : 0)), [currentCells]);
                });
              }
              if (currentCells.every(function (c) {
                return c.value !== null;
              })) {
                syncState({
                  selectedChar: null
                }, !isBrawlMode);
              } else {
                showToast("\uD83D\uDE80 \u5168\u81EA\u52D5\u5FAA\u74B0\u586B\u5BEB\u5B8C\u7562\uFF01\n\u5171\u5E6B\u60A8\u586B\u5165\u4E86 ".concat(totalFilled, " \u683C\u3002"));
              }
            } else {
              showToast("\uD83D\uDCA1 \u76EE\u524D\u5DF2\u7D93\u627E\u4E0D\u5230\u5FC5\u5B9A\u80FD\u586B\u5BEB\u7684\u7A7A\u683C\u4E86");
              syncState({
                selectedChar: null
              }, !isBrawlMode);
            }
            isAutoFillingRef.current = false;
            syncState({
              isAutoFilling: false,
              selectedChar: null
            }, !isBrawlMode);
          case 33:
          case "end":
            return _context14.stop();
        }
      }, _callee5);
    }));
    return function runAutoFillCycle(_x4) {
      return _ref7.apply(this, arguments);
    };
  }();
  var clickTracker = useRef({
    "char": null,
    count: 0,
    time: 0
  });
  var onNumClick = function onNumClick(e, c) {
    e.preventDefault();
    if (isAutoFillingRef.current || winner || matchPhase !== 'playing' || isSpectator) return;
    if (inputMode === 'cell') {
      // 格子先行：數字鍵 = 寫入目前選取的格子（還沒選格子時，點數字只做同值高亮）
      if (!selectedCellId) {
        if (!completedChars.has(c)) setSelectedChar(function (prev) {
          return prev === c ? null : c;
        });
        return;
      }
      var cur = isBrawlMode ? localCells : cells;
      var t = cur.find(function (x) {
        return x.id === selectedCellId;
      });
      if (!t) return;
      if (t.isGiven || t.isSystemRevealed) {
        showToast("⚠️ 這格是題目給的，不能修改");
        return;
      }
      if (!isHeaderCollapsed) setIsHeaderCollapsed(true);
      applyCharToCell(selectedCellId, c);
      setSelectedChar(c);
      return;
    }
    if (!isHeaderCollapsed) setIsHeaderCollapsed(true);
    var now = Date.now();
    var tracker = clickTracker.current;
    if (tracker["char"] === c && now - tracker.time < 400) {
      tracker.count += 1;
    } else {
      tracker["char"] = c;
      tracker.count = 1;
    }
    tracker.time = now;
    var isCompleted = completedChars.has(c);
    if (tracker.count === 1) {
      if (!isCompleted) setSelectedChar(function (prev) {
        return prev === c ? null : c;
      });
    } else if (tracker.count === 2) {
      if (!isCompleted) {
        var isGhostBlocked = !stateRef.current.brawlSettings.allowQuickFill;
        if (isGhostBlocked) {
          tracker.count = 0;
        } else {
          if (interactionMode === 0) autoFillHiddenSingles(c);else if (interactionMode === 1) autoFillDrafts(c);
        }
      }
    } else if (tracker.count === 5) {
      var _isGhostBlocked = !stateRef.current.brawlSettings.allowTraversal;
      if (!_isGhostBlocked) {
        if (interactionMode === 0) runAutoFillCycle(c);else showToast("⚠️ 草稿模式不支援循環自動填寫\n請切換至一般模式使用");
      }
      tracker.count = 0;
    }
  };

  // F3（v1.56.0）：按鈕觸發的縮放加 200ms travel 過渡——先在 svg 上掛 transition 再改尺寸（inline style 變更同樣吃 transition）；
  // 260ms 後自動卸下，確保雙指捏合/捲動觸發的 recalculateZoom 維持即時跟手、不被過渡拖慢。連按時重掛即可 retarget（CSS transition 會從當前值續行）。
  var zoomAnimTimerRef = useRef(null);
  var armZoomTransition = function armZoomTransition() {
    var svg = svgRef.current;
    if (!svg) return;
    platArmZoom(svg); // 過渡武裝收編 PlatZoom.armTransition（v1.63.0，語意守恆）
  };
  var recalculateZoom = function recalculateZoom(modeIdx) {
    var container = zoomContainerRef.current;
    if (!container) return;
    var cw = container.clientWidth;
    var ch = container.clientHeight;
    var newZoom = 1;
    if (modeIdx === 0) {
      newZoom = zoomLevelRef.current;
    } else if (modeIdx === 1) {
      newZoom = cw / svgW;
    } else if (modeIdx === 2) {
      newZoom = ch / svgH;
    } else if (modeIdx === 3) {
      newZoom = Math.min(cw / svgW, ch / svgH) * 0.95;
    }

    // 增加防震：如果縮放比例變動微小，不更新 (避免手機虛擬鍵盤彈出導致的呼大呼小)
    if (Math.abs(newZoom - zoomLevelRef.current) < 0.001 && svgRef.current && svgRef.current.style.width) return;
    setZoomLevel(newZoom);
    zoomLevelRef.current = newZoom;
    pz().setRaw(newZoom);
    if (svgRef.current) {
      svgRef.current.style.width = "".concat(svgW * newZoom, "px");
      svgRef.current.style.height = "".concat(svgH * newZoom, "px");
    }
  };
  var handleSizeChange = function handleSizeChange(e) {
    var newSize = parseInt(e.target.value);
    if (isHostRef.current) generateAndSync(newSize, diffId);
  };
  var handleDiffChange = function handleDiffChange(e) {
    var newDiff = e.target.value;
    if (isHostRef.current) generateAndSync(sizeId, newDiff);
  };
  useEffect(function () {
    if (screen === 'game' && levelData && levelData.cells.length > 0) {
      var tid = setTimeout(function () {
        return recalculateZoom(zoomModeIdxRef.current);
      }, 100);
      return function () {
        return clearTimeout(tid);
      };
    }
  }, [levelData, screen]);
  var handleCellClick = function handleCellClick(cellId) {
    if (isLongPressTriggered.current) return; // 防長按後觸發點擊
    if (isWon || interactionMode >= 2 || winner || matchPhase !== 'playing' || isSpectator) return;
    var cur = isBrawlMode ? localCells : cells;
    var targetIdx = cur.findIndex(function (c) {
      return c.id === cellId;
    });
    if (targetIdx === -1) return;
    var target = cur[targetIdx];

    // 格子先行：點格子只是「選取」，等玩家再點數字鍵填入（同時以該格數字做同值高亮）
    if (inputMode === 'cell') {
      setSelectedCellId(cellId);
      setSelectedChar(target.value);
      return;
    }

    // 判斷按鍵是否已經被反擊打亂
    var isScrambled = keyMapping.join('') !== cSizeDef.chars.join('');
    if (selectedChar === null) {
      if (target.value !== null) {
        if (isBrawlMode && scrambledCharsRef.current.has(target.value)) {
          showToast("⚠️ 這個數字的按鍵已被打亂，無法使用智慧吸取！");
          return;
        }
        setSelectedChar(target.value);
      }
      return;
    }
    if (target.isGiven || target.isSystemRevealed) {
      if (isBrawlMode && target.value !== selectedChar && scrambledCharsRef.current.has(target.value)) {
        showToast("⚠️ 這個數字的按鍵已被打亂，無法使用智慧吸取！");
        return;
      }
      setSelectedChar(function (prev) {
        return prev === target.value ? null : target.value;
      });
      return;
    }
    applyCharToCell(cellId, selectedChar);
  };

  // 把字元 char 套用到指定格子（填答/草稿共用；數字先行與格子先行都走這裡）
  var applyCharToCell = function applyCharToCell(cellId, _char6) {
    var cur = isBrawlMode ? localCells : cells;
    var targetIdx = cur.findIndex(function (c) {
      return c.id === cellId;
    });
    if (targetIdx === -1) return;
    var target = cur[targetIdx];
    if (target.isGiven || target.isSystemRevealed) return;
    if (isCellFrozen(cellId)) {
      try {
        window.SUDOKU_SOUND.play('error');
      } catch (e) {}
      frozenToast('填');
      return;
    }
    if (engineRef.current === 'none') setHistory(function (past) {
      return [].concat(_toConsumableArray(past.slice(past.length > 25 ? 1 : 0)), [cur]);
    });
    var nextCells = _toConsumableArray(cur);
    var nextCell = _objectSpread({}, target);
    if (interactionMode === 1) {
      // 草稿模式
      if (nextCell.drafts.includes(_char6)) {
        nextCell.drafts = nextCell.drafts.filter(function (d) {
          return d !== _char6;
        });
      } else {
        nextCell.drafts = [].concat(_toConsumableArray(nextCell.drafts), [_char6]);
      }
      try {
        window.SUDOKU_SOUND.play('click');
      } catch (e) {}
    } else {
      // 一般填答模式
      var nextValue = target.value === _char6 ? null : _char6;
      nextCell.value = nextValue;
      nextCell.owner = nextValue !== null ? myId : null;
      nextCell.drafts = [];
      try {
        window.SUDOKU_SOUND.play(nextValue !== null ? 'place' : 'remove');
      } catch (e) {}

      // 幽靈競速/亂鬥模式：廣播玩家填答狀況（包含擦除，讓上帝模式與進度條能正確反映）
      if (isBrawlMode && isMultiplayer) {
        var me = playersListRef.current.find(function (p) {
          return p.id === myId;
        });
        var msg = {
          type: 'GHOST_SOLVED',
          uid: myId,
          color: me ? me.color : myColorRef.current,
          cellId: cellId,
          id: Math.random().toString(36).substring(2, 11),
          value: nextValue
        };
        if (engineRef.current === 'peerjs') {
          if (isHostRef.current) connsRef.current.forEach(function (c) {
            return c.send(msg);
          });else if (connRef.current) connRef.current.send(msg);
        }
      }
    }
    nextCells[targetIdx] = nextCell;
    if (interactionMode !== 1 && nextCell.value !== null) {
      var placed = nextCell.value;
      for (var i = 0; i < nextCells.length; i++) {
        if (i === targetIdx) continue;
        var c = nextCells[i];
        if ((c.x === target.x || c.y === target.y || c.boxId === target.boxId) && c.drafts && c.drafts.includes(placed)) {
          nextCells[i] = _objectSpread(_objectSpread({}, c), {}, {
            drafts: c.drafts.filter(function (d) {
              return d !== placed;
            })
          });
        }
      }
    }
    if (isBrawlMode) {
      syncState({
        localCells: nextCells
      }, false);
    } else {
      syncState({
        cells: nextCells
      });
    }
  };
  var handleReset = function handleReset() {
    if (isAutoFillingRef.current || matchPhase !== 'playing' || isSpectator) return;
    var currentActive = isBrawlMode ? localCells : cells;
    var resetCells = currentActive.map(function (c) {
      return _objectSpread(_objectSpread({}, c), {}, {
        value: c.isGiven || c.isSystemRevealed ? c.value : null,
        drafts: [],
        owner: null
      });
    });
    syncState({
      cells: resetCells,
      localCells: resetCells,
      strokes: [],
      startTime: Date.now()
    });
    if (engineRef.current === 'none') setHistory([]);
    setIsWon(false);
    setEndTime(null);
    setSelectedChar(null);
    showToast("🔄 盤面已重置！");
  };
  var switchToOffline = function switchToOffline() {
    setEngine('local');
    engineRef.current = 'local';
    setIsHost(true);
    isHostRef.current = true;
    setPlayersList([{
      id: myId,
      name: myNameRef.current || "單機玩家",
      isHost: true,
      color: myColorRef.current,
      isReady: false,
      isSpectator: false
    }]);
  };
  var handleGoHome = function handleGoHome(platLeave) {
    dailyRef.current = null;
    setDailyDate(null);
    // platLeave==='leave'：連線模式個人退出（只有自己回大廳、其他人繼續、房主退出由殼接管）；其餘走舊語義（房主帶全員回等待室）
    if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY(platLeave === 'leave' ? 'player-leave' : 'game-exit');
    if (engineRef.current === 'peerjs') {
      if (!isHostRef.current && connRef.current) {
        connRef.current.send({
          type: 'LEAVE',
          uid: myId
        });
        var pToKill = peerRef.current;
        setTimeout(function () {
          if (pToKill) {
            try {
              pToKill.destroy();
            } catch (e) {}
          }
          if (peerRef.current === pToKill) peerRef.current = null;
        }, 100);
      } else if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    }
    switchToOffline();
    setScreen('home');
    setIsWon(false);
    setEndTime(null);
    setHistory([]);
  };
  var handlePlayerColorChange = function handlePlayerColorChange(playerId, newColor) {
    var updateLogic = function updateLogic(prev) {
      var nList = prev.map(function (p) {
        return p.id === playerId ? _objectSpread(_objectSpread({}, p), {}, {
          color: newColor
        }) : p;
      });
      if (isHostRef.current) {
        // 連動更新盤面上該玩家填寫的格子顏色 (v3.8.33)
        setCells(function (cur) {
          return cur.map(function (c) {
            return c.owner === playerId ? _objectSpread(_objectSpread({}, c), {}, {
              ownerColor: newColor
            }) : c;
          });
        });
        setLocalCells(function (cur) {
          return cur.map(function (c) {
            return c.owner === playerId ? _objectSpread(_objectSpread({}, c), {}, {
              ownerColor: newColor
            }) : c;
          });
        });
        connsRef.current.forEach(function (c) {
          return c.send({
            type: 'PLAYERS_UPDATE',
            players: nList
          });
        });
      }
      return nList;
    };
    if (engineRef.current === 'none') {
      setPlayersList(updateLogic);
      return;
    }
    if (engineRef.current === 'peerjs') {
      if (isHostRef.current) setPlayersList(updateLogic);else if (connRef.current) connRef.current.send({
        type: 'REQ_COLOR_CHANGE',
        targetId: playerId,
        color: newColor
      });
    }
  };
  var handlePlayerNameChange = function handlePlayerNameChange(playerId, newName) {
    if (playerId === myId) setTempPlayerName(newName);
    if (engineRef.current === 'none') setPlayersList(function (prev) {
      return prev.map(function (p) {
        return p.id === playerId ? _objectSpread(_objectSpread({}, p), {}, {
          name: newName
        }) : p;
      });
    });else if (engineRef.current === 'peerjs') {
      if (isHostRef.current) {
        var nList = playersListRef.current.map(function (p) {
          return p.id === playerId ? _objectSpread(_objectSpread({}, p), {}, {
            name: newName
          }) : p;
        });
        setPlayersList(nList);
        connsRef.current.forEach(function (c) {
          return c.send({
            type: 'PLAYERS_UPDATE',
            players: nList
          });
        });
      } else if (connRef.current) connRef.current.send({
        type: 'REQ_NAME_CHANGE',
        targetId: playerId,
        name: newName
      });
    }
    showToast("✅ 暱稱修改成功！");
  };
  var handleUndo = function handleUndo() {
    if (history.length === 0 || isWon || engineRef.current !== 'none' && !isBrawlMode) return;
    setHistory(function (past) {
      var newPast = _toConsumableArray(past);
      var lastState = newPast.pop();
      if (isBrawlMode) {
        setLocalCells(lastState);
        syncState({
          localCells: lastState
        }, false);
      } else {
        setCells(lastState);
        syncState({
          cells: lastState
        });
      }
      return newPast;
    });
  };
  var handleCycleZoom = function handleCycleZoom() {
    armZoomTransition();
    var next = (zoomModeIdx + 1) % 4;
    setZoomModeIdx(next);
    zoomModeIdxRef.current = next;
    recalculateZoom(next);
  };
  var handleZoomIn = function handleZoomIn() {
    armZoomTransition();
    setZoomModeIdx(0);
    zoomModeIdxRef.current = 0;
    var next = pz().add(0.1);
    setZoomLevel(next);
    zoomLevelRef.current = next;
    if (svgRef.current) {
      svgRef.current.style.width = "".concat(svgW * next, "px");
      svgRef.current.style.height = "".concat(svgH * next, "px");
    }
  };
  var handleZoomOut = function handleZoomOut() {
    armZoomTransition();
    setZoomModeIdx(0);
    zoomModeIdxRef.current = 0;
    var next = pz().add(-0.1);
    setZoomLevel(next);
    zoomLevelRef.current = next;
    if (svgRef.current) {
      svgRef.current.style.width = "".concat(svgW * next, "px");
      svgRef.current.style.height = "".concat(svgH * next, "px");
    }
  };

  // === 共用底部列 PlatBar（平台模式由殼渲染單一元件；獨立版走舊列） ===
  var platBarRef = useRef(null);
  var platBarCfgRef = useRef(null);

  // 名單自我修復（比照數橋）：來賓的 JOIN 若在房主就緒前送達被漏接，每 2.5 秒重送，直到名單上有自己為止
  useEffect(function () {
    var t = setInterval(function () {
      if (engineRef.current !== 'peerjs' || isHostRef.current) return;
      if (!connRef.current || !connRef.current.open) return;
      if ((playersListRef.current || []).some(function (p) {
        return p.id === myId;
      })) return;
      try {
        connRef.current.send({
          type: 'JOIN',
          pName: myNameRef.current || "玩家",
          uid: myId,
          color: myColorRef.current
        });
      } catch (e) {}
    }, 2500);
    return function () {
      return clearInterval(t);
    };
  }, []);

  // 完賽回報補送（與數橋 RACE_FINISH 補送同款邏輯）：大亂鬥來賓的 GHOST_I_WON 原本只送一次，
  // 途中連線替換/掉包就永遠遺失、房主卡在等結果。房主宣布完賽前每 3 秒補送（上限 6 次），房主端以 winInfo.id 去重。
  useEffect(function () {
    var t = setInterval(function () {
      if (engineRef.current !== 'peerjs' || isHostRef.current) return;
      if (!isWinnerDeclaredRef.current || !lastWinInfoRef.current) return;
      if (!stateRef.current.isBrawlMode || stateRef.current.matchPhase === 'finished') return;
      if (winResentRef.current >= 6) return;
      if (!connRef.current || !connRef.current.open) return;
      winResentRef.current++;
      try {
        connRef.current.send({
          type: 'GHOST_I_WON',
          senderUid: myId,
          id: Math.random().toString(36).substring(2, 10),
          time: Date.now(),
          winInfo: lastWinInfoRef.current
        });
      } catch (e) {}
    }, 3000);
    return function () {
      return clearInterval(t);
    };
  }, []);
  platBarCfgRef.current = {
    accent: '#ffcc00',
    onAction: function onAction(name, payload) {
      if (name === 'zoom-in') handleZoomIn();else if (name === 'zoom-out') handleZoomOut();else if (name === 'zoom-cycle') handleCycleZoom();else if (name === 'input-set') setInputMode(payload);else if (name === 'mode-press') advanceInteractionMode();else if (name === 'draw-tool') setDrawSubMode(payload);else if (name === 'draw-erase-dbl') clearOwnStrokes();else if (name === 'draw-clear') clearAllStrokes();
    }
  };
  var platBarCfgStable = useRef(null);
  if (!platBarCfgStable.current) platBarCfgStable.current = {
    accent: '#ffcc00',
    onAction: function onAction(n, p) {
      if (platBarCfgRef.current) platBarCfgRef.current.onAction(n, p);
    }
  };
  useEffect(function () {
    if (typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'sudoku') return; // 底部列主人是另一款遊戲時不搶（錦標賽輪替時防翻跳）
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
    if (typeof window.PlatBar === 'undefined' || !window.PlatBar.isAttached()) return;
    if (typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'sudoku') return;
    var st = {
      mode: interactionMode,
      modes: [{
        icon: '🖋️',
        label: '填答'
      }, {
        icon: '✏️',
        label: '筆記'
      }, {
        icon: '🖌️',
        label: '塗鴉'
      }],
      modeTitle: '切換模式（填答/筆記/塗鴉）',
      zoomLabel: zoomIndicator.visible && zoomIndicator.value > 1 ? Math.round(zoomIndicator.value * 100) + '%' : '🔍',
      // zoom 標示三款統一百分比（美學稽核 V-22）
      zoomGlyph: zoomModeIdx === 0 ? '1X' : zoomModeIdx === 1 ? '↔️' : zoomModeIdx === 2 ? '↕️' : '🔲',
      showInput: true,
      inputMode: inputMode,
      showDraw: interactionMode === 2,
      drawTool: drawSubMode,
      showHostClear: !!(isHostRef.current && !isBrawlMode)
    };
    window.PlatBar.update(st);
  });
  var startDailyGame = function startDailyGame(dateStr) {
    switchToOffline();
    dailyRef.current = dateStr;
    setDailyDate(dateStr);
    dailyRecordedRef.current = false;
    setScreen('game');
    setMatchPhase('playing');
    setIsBrawlMode(false);
    setIsHeaderCollapsed(false);
    setIsGenerating(true);
    setWinner(null);
    isWinnerDeclaredRef.current = false;
    setTimeout(function () {
      generateDailySudoku(dateStr, setGenProgress).then(function (newData) {
        var initCells = JSON.parse(JSON.stringify(newData.cells));
        syncState({
          sizeId: 9,
          diffId: 'medium',
          levelData: newData,
          cells: initCells,
          localCells: initCells,
          strokes: [],
          startTime: Date.now(),
          isBrawlMode: false,
          winner: null,
          matchEndTime: null,
          solutionGrid: null,
          isGenerating: false,
          selectedChar: null,
          keyMapping: newData.sizeDef.chars,
          finishViewMode: 'my'
        }, true);
        setIsWon(false);
        setHistory([]);
        setEndTime(null);
        setHideVictoryModal(false);
        setSelectedChar(null);
        setGenProgress("");
      });
    }, 100);
  };

  // ===== 📅 每日一題月曆（亮燈=已完成、未來反灰不可選；點日期直接開那天的題目） =====
  var openDailyCal = function openDailyCal() {
    if (window.PlatCalendar) window.PlatCalendar.show({
      accent: '#ffcc00',
      records: dailyRecords,
      selected: dailyPickDate,
      onPick: function onPick(ds) {
        setDailyPickDate(ds);
        startDailyGame(ds);
      }
    });
  }; // 每日月曆已統一為殼端 PlatCalendar（v1.16）

  // 每日一題完賽記錄（連擊只認今天；補玩只記該日成績）
  useEffect(function () {
    if (!isWon || !dailyRef.current || dailyRecordedRef.current || !endTime) return;
    dailyRecordedRef.current = true;
    var dateStr = dailyRef.current;
    var secs = Math.max(1, Math.round((endTime - startTime) / 1000));
    setDailyRecords(function (prev) {
      var next = _objectSpread({}, prev);
      if (!next[dateStr] || secs < next[dateStr]) next[dateStr] = secs;
      platSave().write('sudoku_daily_records', next);
      return next;
    });
    if (dateStr === dailyTodayStr()) {
      setDailyStreak(function (prev) {
        var next = prev;
        if (prev.lastDate !== dateStr) {
          var count = prev.lastDate === shiftDateStr(dateStr, -1) ? prev.count + 1 : 1;
          next = {
            count: count,
            lastDate: dateStr
          };
          platSave().write('sudoku_daily_streak', next);
        }
        return next;
      });
    }
    showToast('📅 每日一題（' + dateStr + '）完成！用時 ' + formatTime(secs));
  }, [isWon, endTime]);
  var startSinglePlayer = function startSinglePlayer() {
    dailyRef.current = null;
    setDailyDate(null);
    switchToOffline();
    setScreen('game');
    setMatchPhase('waiting');
    setIsBrawlMode(false);
    setIsBrawlMode(false); // 確保是純單機模式
    setIsHeaderCollapsed(false);
  };
  var handleSaveCode = function handleSaveCode() {
    var targetCells = isBrawlMode ? localCells : cells;
    var data = {
      sId: sizeId,
      dId: diffId,
      cells: targetCells.map(function (c) {
        return {
          x: c.x,
          y: c.y,
          v: c.value,
          g: c.isGiven,
          d: c.drafts,
          o: c.owner
        };
      }),
      mode: isBrawlMode ? 'brawl' : 'coop'
    };
    try {
      var code = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      setSaveCode(code);
      navigator.clipboard.writeText(code).then(function () {
        return showToast("📋 進度代碼已複製到剪貼簿！");
      });
    } catch (e) {
      showToast("❌ 產生代碼失敗");
    }
  };
  var handleLoadCode = function handleLoadCode() {
    if (!saveCode.trim()) return showToast("⚠️ 請先貼上代碼");
    try {
      var data = JSON.parse(decodeURIComponent(escape(atob(saveCode))));
      setIsGenerating(true);
      generateSudokuAsync(data.sId, data.dId, setGenProgress).then(function (newData) {
        var loadedCells = newData.cells.map(function (c) {
          var saved = data.cells.find(function (sc) {
            return sc.x === c.x && sc.y === c.y;
          });
          if (saved) return _objectSpread(_objectSpread({}, c), {}, {
            value: saved.v,
            isGiven: saved.g,
            drafts: saved.d || [],
            owner: saved.o || null
          });
          return c;
        });
        var solution = null;
        if (data.mode === 'ghost' || data.mode === 'brawl') solution = getSolutionGrid(loadedCells, newData.sizeDef);
        syncState(_defineProperty(_defineProperty(_defineProperty({
          sizeId: data.sId,
          diffId: data.dId,
          levelData: newData,
          cells: loadedCells,
          localCells: loadedCells,
          isBrawlMode: data.mode === 'ghost' || data.mode === 'brawl'
        }, "isBrawlMode", data.mode === 'brawl'), "solutionGrid", solution), "isGenerating", false), true);
        setScreen('game');
        setShowSaveModal(false);
        showToast("✅ 進度載入成功！");
      });
    } catch (e) {
      showToast("❌ 無效的進度代碼");
    }
  };
  var handleQuickPaste = /*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
      var text;
      return _regeneratorRuntime().wrap(function _callee6$(_context15) {
        while (1) switch (_context15.prev = _context15.next) {
          case 0:
            _context15.prev = 0;
            _context15.next = 3;
            return navigator.clipboard.readText();
          case 3:
            text = _context15.sent;
            setSaveCode(text);
            showToast("📋 已貼上剪貼簿內容");
            _context15.next = 11;
            break;
          case 8:
            _context15.prev = 8;
            _context15.t0 = _context15["catch"](0);
            showToast("❌ 無法讀取剪貼簿，請手動貼上");
          case 11:
          case "end":
            return _context15.stop();
        }
      }, _callee6, null, [[0, 8]]);
    }));
    return function handleQuickPaste() {
      return _ref9.apply(this, arguments);
    };
  }();
  var generateAndSync = function generateAndSync(sId, dId, nextMode) {
    var skipLobby = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    if (isAutoFillingRef.current) return;
    setIsGenerating(true);
    setWinner(null);
    isWinnerDeclaredRef.current = false;
    setGhostHints({});
    setUnopenedGifts({});
    setBrawlWinners([]);
    var targetMode = nextMode;
    if (targetMode === undefined) {
      targetMode = stateRef.current.isBrawlMode ? 'brawl' : 'coop';
    }
    var isGR = targetMode === 'brawl';
    var isBrawl = targetMode === 'brawl';
    var newPhase = engineRef.current === 'peerjs' ? 'waiting' : 'playing';
    var cdTarget = null;
    if (skipLobby && engineRef.current === 'peerjs') {
      if (isGR) {
        newPhase = 'countdown';
        cdTarget = Date.now() + 5500;
      } else {
        newPhase = 'playing';
      }
    }
    setIsSpectator(false);
    autoGodRef.current = false; // 新局：重置「完賽自動轉上帝」的一次性旗標
    syncState({
      isGenerating: true,
      isBrawlMode: isBrawl,
      winner: null,
      matchPhase: newPhase,
      matchEndTime: null,
      countdownTarget: cdTarget,
      giftEvents: [],
      brawlWinners: [],
      finishViewMode: 'my'
    }, true);
    setPlayersList(function (prev) {
      var nList = prev.map(function (p) {
        return _objectSpread(_objectSpread({}, p), {}, {
          isReady: engineRef.current === 'none',
          isSpectator: !!p.isLobbySpectator
        });
      });
      if (engineRef.current === 'peerjs' && isHostRef.current) connsRef.current.forEach(function (c) {
        return c.send({
          type: 'PLAYERS_UPDATE',
          players: nList
        });
      });
      return nList;
    });
    setTimeout(function () {
      generateSudokuAsync(sId, dId, setGenProgress).then(function (newData) {
        var solution = null;
        if (isGR) solution = getSolutionGrid(newData.cells, newData.sizeDef);
        var initLocalCells = JSON.parse(JSON.stringify(newData.cells));
        syncState({
          sizeId: sId,
          diffId: dId,
          levelData: newData,
          cells: initLocalCells,
          localCells: initLocalCells,
          strokes: [],
          startTime: Date.now(),
          isBrawlMode: isBrawl,
          winner: null,
          matchEndTime: null,
          solutionGrid: solution,
          isGenerating: false,
          selectedChar: null,
          keyMapping: newData.sizeDef.chars,
          finishViewMode: 'my'
        }, true);
        setIsWon(false);
        setHistory([]);
        if (sId !== sizeId) {
          setZoomLevel(1);
          setZoomModeIdx(0);
        }
        setEndTime(null);
        setHideVictoryModal(false);
        setSelectedChar(null);
        setGenProgress("");
      });
    }, 100);
  };
  handleRegenerateRandomRef.current = function () {
    return generateAndSync(sizeId, diffId);
  };
  var _useState179 = useState(false),
    _useState180 = _slicedToArray(_useState179, 2),
    platTournLock = _useState180[0],
    setPlatTournLock = _useState180[1];
  var _useState181 = useState(false),
    _useState182 = _slicedToArray(_useState181, 2),
    platHub = _useState182[0],
    setPlatHub = _useState182[1]; // v1.11.0：本局由殼房間框架啟動（等待室改在殼端，本遊戲不顯示自己的等待室）
  var platHubRef = useRef(false);
  var platSessRef = useRef(null); // 殼 launch 的原始 sess（hub 判斷與代表色 sess.color 的來源；exit 時清空）
  var isShellColor = function isShellColor(c) {
    return !!c && (c === 'rainbow' || COLORS.indexOf(c) >= 0);
  }; // 殼代表色合法值：20 色之一或彩虹
  var hubStartTimerRef = useRef(null);
  var joinRetryRef = useRef(null); // 來賓 JOIN 重送計時器：JOIN 只送一次時，訊息一掉就永遠進不了局（2026-10-31 卡死案）
  var _useState183 = useState(null),
    _useState184 = _slicedToArray(_useState183, 2),
    tournRoundInfo = _useState184[0],
    setTournRoundInfo = _useState184[1]; // 錦標賽本局資訊（第幾局/共幾局/加賽/應到人數），每局等待卡顯示與門檻用
  var tournWaitSinceRef = useRef(null); // 本局等待起點（等滿 1 分鐘房主可強制開始）
  var _useState185 = useState(0),
    _useState186 = _slicedToArray(_useState185, 2),
    setTournTick = _useState186[1];
  useEffect(function () {
    if (!(platHub && platTournLock)) return;
    var t = setInterval(function () {
      return setTournTick(function (x) {
        return x + 1;
      });
    }, 1000);
    return function () {
      return clearInterval(t);
    };
  }, [platHub, platTournLock]);
  // 錦標賽每局等待卡的準備切換（與舊等待室同款訊息：來賓 REQ_READY/REQ_UNREADY、房主自切＋廣播）
  var handleTournReady = function handleTournReady() {
    if (isHostRef.current) {
      var nList = playersListRef.current.map(function (p) {
        return p.id === myId ? _objectSpread(_objectSpread({}, p), {}, {
          isReady: !p.isReady
        }) : p;
      });
      setPlayersList(nList);
      connsRef.current.forEach(function (c) {
        if (c.open) c.send({
          type: 'PLAYERS_UPDATE',
          players: nList
        });
      });
    } else if (connRef.current && connRef.current.open) {
      var me = playersListRef.current.find(function (p) {
        return p.id === myId;
      });
      if (me) connRef.current.send({
        type: me.isReady ? 'REQ_UNREADY' : 'REQ_READY',
        targetId: myId
      });
    }
  };
  // ===== 平台 Phase C 接入：殼 launch 時自動進多人（免重打暱稱/房號） =====
  useEffect(function () {
    if (!window.__PLAT_PLATFORM) return;
    window.__PLAT_HOOKS_sudoku = {
      enter: function enter(sess) {
        // 開新局先清掉上一局的結算暫存（同數橋）：贏家/完賽名單/比賽階段全歸零，免得舊結算在新局重播
        matchTokenRef.current = null; // 世代代幣歸零：新房間的第一則 SYNC 重新認領，避免舊房間的代幣把新局 SYNC 全擋掉
        setWinner(null);
        setIsWon(false);
        setEndTime(null);
        isWinnerDeclaredRef.current = false;
        lastWinInfoRef.current = null;
        winResentRef.current = 0; // 補送 effect 的彈藥也要清：舊 GHOST_I_WON 帶進新局會被殼記成新局完賽（錦標賽記錯分）
        setBrawlWinners([]);
        setHideVictoryModal(false);
        resultsDismissRef.current = null;
        setResultsDismissedUi(false);
        setLeaveArm(false);
        setMatchPhase('waiting');
        stateRef.current = _objectSpread(_objectSpread({}, stateRef.current), {}, {
          matchPhase: 'waiting'
        });
        setPlatTournLock(!!sess.tourn);
        platTournLockRef.current = !!sess.tourn;
        tournRosterRef.current = sess.tourn && sess.tourn.roster || null;
        setPlatHub(!!sess.hub);
        platHubRef.current = !!sess.hub;
        platSessRef.current = sess;
        // 平台 hub：代表色以殼摩天輪選定的 sess.color 為準——先寫 myColorRef，並同步自己在 playersList 的條目；
        // render 時 myColorRef 會由名單推導回寫（getPlayerColor），條目不先改色，JOIN/GHOST 送出前就會被蓋回預設色
        if (sess.hub && isShellColor(sess.color)) {
          myColorRef.current = sess.color;
          setPlayersList(function (prev) {
            return prev.map(function (p) {
              return p.id === myId ? _objectSpread(_objectSpread({}, p), {}, {
                color: sess.color
              }) : p;
            });
          });
        }
        setTournRoundInfo(sess.tourn ? {
          round: sess.tourn.round,
          total: sess.tourn.total,
          playoff: !!sess.tourn.playoff,
          entrants: sess.tourn.entrants
        } : null);
        tournWaitSinceRef.current = sess.tourn ? Date.now() : null;
        if (sess.settings) {
          // 房間框架帶入的設定（全員同一份，開賽前在殼房間頁設好）：一次種下尺寸/難度/大亂鬥設定
          var st = sess.settings;
          setSizeId(st.sizeId);
          setDiffId(st.diffId);
          setBrawlSettings(function (prev) {
            return _objectSpread(_objectSpread({}, prev), st.brawl || {});
          });
          stateRef.current = _objectSpread(_objectSpread({}, stateRef.current), {}, {
            sizeId: st.sizeId,
            diffId: st.diffId,
            brawlSettings: _objectSpread(_objectSpread({}, stateRef.current.brawlSettings), st.brawl || {})
          });
        } else if (sess.tourn && sess.isHost) {
          // 賽程預設：套用賽程的版型/難度，結束名次設為全員（不提前結束）
          setSizeId(sess.tourn.sizeId);
          setDiffId(sess.tourn.diffId);
          setBrawlSettings(function (prev) {
            return _objectSpread(_objectSpread({}, prev), {}, {
              winnersCount: Math.max(1, sess.tourn.entrants || 1)
            });
          });
          stateRef.current = _objectSpread(_objectSpread({}, stateRef.current), {}, {
            sizeId: sess.tourn.sizeId,
            diffId: sess.tourn.diffId,
            brawlSettings: _objectSpread(_objectSpread({}, stateRef.current.brawlSettings), {}, {
              winnersCount: Math.max(1, sess.tourn.entrants || 1)
            })
          });
        }
        myNameRef.current = sess.name;
        setTempPlayerName(sess.name);
        setEngine('peerjs');
        engineRef.current = 'peerjs';
        setIsConnecting(true);
        if (sess.isHost) {
          syncState({
            levelData: emptyLevelData,
            cells: [],
            localCells: [],
            matchPhase: 'waiting',
            matchEndTime: null,
            isBrawlMode: sess.mode === 'brawl'
          }, false);
          setupPeerJS(sess.code, sess.name, true);
        } else {
          setupPeerJS(sess.code, sess.name, false);
        }
        // 房間框架流程：一般對局準備/人數在殼房間頁已經把關，房主端等人到齊就直接開局；
        // 錦標賽每一小局改走等待卡門檻（全員確認準備房主才能開始，或等滿 1 分鐘強制開始），不自動開局
        if (sess.hub && sess.isHost && !sess.tourn) {
          if (hubStartTimerRef.current) clearInterval(hubStartTimerRef.current);
          var tries = 0;
          hubStartTimerRef.current = setInterval(function () {
            tries++;
            var N = window.__PLAT_NET;
            var expected = N ? N.roster.length : 0;
            var present = (playersListRef.current || []).filter(function (p) {
              return !p.pending;
            }).length;
            if (expected >= 2 && present >= expected && !stateRef.current.isGenerating) {
              clearInterval(hubStartTimerRef.current);
              hubStartTimerRef.current = null;
              handleForceStart();
            }
            // 不再等 45 秒就放棄：來賓裝置慢（載入/生成競態）時舊版會直接死局——房主永遠等不到開局、來賓永遠在等待。
            // 計時器活到 exit/開局為止（enter 的冪等重設與 exit 都會清），每 500ms 重查即可。
          }, 500);
        }
      },
      exit: function exit() {
        setPlatTournLock(false);
        platTournLockRef.current = false;
        tournRosterRef.current = null;
        setPlatHub(false);
        platHubRef.current = false;
        platSessRef.current = null;
        setTournRoundInfo(null);
        tournWaitSinceRef.current = null;
        if (hubStartTimerRef.current) {
          clearInterval(hubStartTimerRef.current);
          hubStartTimerRef.current = null;
        }
        handleGoHome();
      },
      migrate: function migrate(amHost, sess) {
        // 房主接管：以目前對局狀態原地重建連線（房主 open handler 有 isMigrating 續局邏輯）
        platSessRef.current = sess;
        if (sess && sess.hub && isShellColor(sess.color)) myColorRef.current = sess.color;
        setEngine('peerjs');
        engineRef.current = 'peerjs';
        setupPeerJS(sess.code, sess.name, !!amHost);
      },
      identity: function identity(d) {
        // 殼端身分同步（進遊戲後改色）：self=我——只改本地名單條目與 myColorRef，不送協議訊息；我是房主時用既有 PLAYERS_UPDATE 管道廣播最新名單一次
        // self=false=他人——以名字找人（與 JOIN 撞名檢查/五戰席位同款的完全比對），走既有 handlePlayerColorChange 管道
        if (!d || !isShellColor(d.color)) return;
        if (d.self) {
          myColorRef.current = d.color;
          var nList = (playersListRef.current || []).map(function (p) {
            return p.id === myId ? _objectSpread(_objectSpread({}, p), {}, {
              color: d.color
            }) : p;
          });
          setPlayersList(nList);
          if (isHostRef.current) connsRef.current.forEach(function (c) {
            if (c.open) {
              try {
                c.send({
                  type: 'PLAYERS_UPDATE',
                  players: nList
                });
              } catch (e) {}
            }
          });
        } else {
          var p = (playersListRef.current || []).find(function (pl) {
            return pl.name === d.name;
          });
          if (p) handlePlayerColorChange(p.id, d.color);
        }
      }
    };
  }, []);

  // 在線心跳（與數橋同款）：來賓每 10 秒 ping 房主；房主記錄每人最後出現時間，25 秒標離線、等待中 60 秒無回應移除。
  // 底層連線的 close 訊號在 App 被直接關掉時可能拖很久，心跳負責即時性；房主把 isOffline 寫進名單條目，廣播自動帶給全場。
  useEffect(function () {
    var iv = setInterval(function () {
      if (engineRef.current !== 'peerjs') return;
      var now = Date.now();
      if (!isHostRef.current) {
        if (now - (lastPingRef.current || 0) >= 10000 && connRef.current && connRef.current.open) {
          lastPingRef.current = now;
          try {
            connRef.current.send({
              type: 'PING',
              uid: myId
            });
          } catch (e) {}
        }
        return;
      }
      var list = playersListRef.current || [];
      var waiting = stateRef.current.matchPhase === 'waiting';
      var changed = false;
      var removed = null;
      var next = [];
      list.forEach(function (p) {
        if (p.id === myId) {
          next.push(p);
          return;
        }
        if (p.pending) {
          next.push(p);
          return;
        } // 未到席位不做離線判定/移除，等真 JOIN 替換或開賽時清掉
        if (!lastSeenRef.current[p.id]) {
          lastSeenRef.current[p.id] = now;
          next.push(p);
          return;
        }
        var silent = now - lastSeenRef.current[p.id];
        if (waiting && silent > 60000) {
          removed = p;
          changed = true;
          return;
        }
        var off = silent > 25000;
        if (!!p.isOffline !== off) {
          changed = true;
          next.push(_objectSpread(_objectSpread({}, p), {}, {
            isOffline: off
          }));
        } else next.push(p);
      });
      if (changed) {
        setPlayersList(next);
        connsRef.current.forEach(function (conn) {
          if (conn.open) {
            try {
              conn.send({
                type: 'PLAYERS_UPDATE',
                players: next
              });
            } catch (e) {}
          }
        });
        if (removed) showToast("\uD83D\uDCF4 ".concat(removed.name || '玩家', " \u5DF2\u96E2\u7DDA"));
      }
    }, 5000);
    return function () {
      return clearInterval(iv);
    };
  }, []);

  // 世代守衛：代幣不符的 SYNC 原則上是上一局遲到包、應丟棄；但「新局開局包」（isGenerating 或 countdown 階段）
  // 是房主在宣告新世代——同一條連線有序送達，舊開局包不可能越過新包遲到，此時必須放行（syncState 會認領新代幣）。
  // 否則再來一局的第一包（倒數包、尚無盤面）會被來賓整包丟棄，來賓永遠停在舊結算、進不了新局。
  var isStaleSync = function isStaleSync(data) {
    return !!(data && data.matchToken && matchTokenRef.current && data.matchToken !== matchTokenRef.current && !(data.levelData && data.startTime) && data.isGenerating !== true && data.matchPhase !== 'countdown');
  };

  // hub 模式專用：房主的心跳廣播（分層自動同步）會搶在來賓 JOIN 前把「只有房主」的名單推過來——
  // 名單裡還沒有我時整表採用，會把殼釘好代表色的自我條目洗掉（下一個 render 就把 myColorRef 蓋回預設色、JOIN 帶錯色）。
  // 故 hub 模式下來賓不採用「沒有我」的名單；正式 INIT 與 JOIN 後的更新必含我，不受影響。非 hub 回傳原名單。
  var adoptHubPlayers = function adoptHubPlayers(players) {
    if (players && platSessRef.current && platSessRef.current.hub && !players.some(function (p) {
      return p.id === myId;
    })) return playersListRef.current || players;
    return players;
  };
  var setupPeerJS = function setupPeerJS(rId, pName, isCreating) {
    // 冪等重設：重複 setup（接管/重入/launch 重播）先清掉舊 peer 與 conn refs，避免 SYNC 送進死連線或重複綁定
    if (joinRetryRef.current) {
      clearInterval(joinRetryRef.current);
      joinRetryRef.current = null;
    }
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {}
      peerRef.current = null;
    }
    connsRef.current = [];
    connRef.current = null;
    // 身份重置（關鍵）：isHost 必須在每次 setup 依角色重設。exit 時 switchToOffline 會把 isHost 設 true（單機＝房主），
    // 若來賓重入時不重置，state/ref 會一直是 true——來賓會看到房主的「開始比賽」鈕、還會誤跑房主邏輯（五戰第三局來賓出現開始鈕的根因；數橋在各分支都有重設，數獨漏了）
    setIsHost(!!isCreating);
    isHostRef.current = !!isCreating;
    var savedProg = loadLocalProgress(rId, myId);
    if (savedProg && Array.isArray(savedProg.d) && savedProg.d.length) {
      // 尺寸守衛：存檔盤面尺寸必須等於本局尺寸才准恢復。房號撞號／跨尺寸殘檔的格子一旦塞進
      // localCells，conflictCellIds 會拿大格子寫入小 grid 當場崩潰（2026-11-01 主畫面 App 實機事故：
      // Safari 儲存空間乾淨無事、主畫面 App 累積殘檔必爆）。不合就整筆清除，不留毒。
      var targetSize = (SIZES.find(function (s) {
        return s.id === stateRef.current.sizeId;
      }) || SIZES[1]).size;
      var maxDim = 0;
      var _iterator7 = _createForOfIteratorHelper(savedProg.d),
        _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var c = _step7.value;
          if (c && typeof c.x === 'number' && typeof c.y === 'number') {
            if (c.x + 1 > maxDim) maxDim = c.x + 1;
            if (c.y + 1 > maxDim) maxDim = c.y + 1;
          }
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      if (maxDim !== targetSize) {
        platSave().remove("sudoku_prog_".concat(rId, "_").concat(myId));
        savedProg = null;
      }
    }
    setConnectionStatus(isCreating ? "正在啟動通訊模組..." : "\u6B63\u5728\u5C0B\u627E\u623F\u9593 ".concat(rId, "..."));
    if (isCreating) {
      var p = new Peer('yyh-tgsh-' + rId + '-host');
      peerRef.current = p;
      p.on('open', function () {
        setConnectionStatus("房間已建立，等待進入...");
        var currentPhase = stateRef.current.matchPhase;
        var hasLevelData = stateRef.current.levelData !== null;
        var isMigrating = hasLevelData && (currentPhase === 'playing' || currentPhase === 'countdown');
        var targetPhase = isMigrating ? currentPhase : 'waiting';
        setIsHost(true);
        isHostRef.current = true;
        setIsSpectator(false);
        setRoomId(rId);
        setScreen('game');
        setIsHeaderCollapsed(true);
        setIsConnecting(false);
        syncState({
          matchPhase: targetPhase
        }, false);
        setPlayersList(function (prev) {
          var others = prev.filter(function (pl) {
            return pl.id !== myId && !pl.isHost;
          });
          var me = prev.find(function (pl) {
            return pl.id === myId;
          }) || {
            id: myId,
            color: getAvailableColor([])
          };
          var myEntry = _objectSpread(_objectSpread({}, me), {}, {
            name: pName,
            isHost: true,
            isReady: false,
            isSpectator: false
          });
          // 平台 hub：房主自己的代表色以殼 sess.color 為準（非 hub 照舊：沿用既有條目色，沒有條目才隨機分配）
          if (platSessRef.current && platSessRef.current.hub && isShellColor(platSessRef.current.color)) myEntry.color = platSessRef.current.color;
          var newList = [myEntry].concat(_toConsumableArray(others));
          // 五戰名單帶入：把還沒進遊戲的選手先種成灰色「未到」席位（真 JOIN 到達時以同名替換）
          if (tournRosterRef.current) {
            tournRosterRef.current.forEach(function (e) {
              if (!e || !e.name || e.name === pName) return;
              if (!newList.some(function (pl) {
                return pl.name === e.name;
              })) newList.push({
                id: 'pending:' + e.name,
                name: e.name,
                isHost: false,
                color: e.color || getAvailableColor(newList),
                isReady: false,
                isSpectator: false,
                pending: true
              });
            });
          }
          return newList;
        });
        saveLocalProgress(rId, myId, pName, true, savedProg ? savedProg.d : []);
        if (!isMigrating) {
          if (savedProg) {
            setLocalCells(savedProg.d);
            showToast("📦 已恢復上次對局進度");
          }
          generateAndSync(stateRef.current.sizeId, stateRef.current.diffId, stateRef.current.isBrawlMode ? 'brawl' : 'coop');
        }
        p.on('connection', function (c) {
          connsRef.current.push(c);
          c.on('data', function (m) {
            if (c.uid || m.uid || m.targetId) lastSeenRef.current[c.uid || m.uid || m.targetId] = Date.now();
            if (m.type === 'PING') {
              try {
                c.send({
                  type: 'PONG'
                });
              } catch (e) {}
              return;
            }
            if (m.type === 'JOIN') {
              var storedSid = null;
              {
                var ls = platSave().read('sudoku_last_session', {
                  fallback: null
                });
                storedSid = ls ? ls.sid : null;
              }
              var roomSessionId = stateRef.current.sessionId || storedSid;
              if (m.sid && roomSessionId && m.sid !== roomSessionId) {
                c.send({
                  type: 'JOIN_REJECTED',
                  reason: 'session_mismatch'
                });
                return;
              }
              if (playersListRef.current.some(function (p) {
                return p.name === m.pName && p.id !== m.uid && !p.pending;
              })) {
                c.send({
                  type: 'JOIN_REJECTED',
                  reason: 'name_conflict'
                });
                return;
              }
              connsRef.current = connsRef.current.filter(function (conn) {
                if (conn.uid === m.uid && conn !== c) {
                  try {
                    conn.close();
                  } catch (e) {}
                  return false;
                }
                return true;
              });
              c.uid = m.uid;
              var existingPlayer = playersListRef.current.find(function (pl) {
                return pl.id === m.uid;
              });
              var isSpec = existingPlayer ? existingPlayer.isSpectator : stateRef.current.isBrawlMode && stateRef.current.matchPhase === 'playing';
              setPlayersList(function (prev) {
                var nList;
                if (prev.find(function (pl) {
                  return pl.id === m.uid;
                })) nList = prev.map(function (pl) {
                  return pl.id === m.uid ? _objectSpread(_objectSpread({}, pl), {}, {
                    name: m.pName,
                    isSpectator: isSpec
                  }) : pl;
                });else {
                  var pendIdx = prev.findIndex(function (pl) {
                    return pl.pending && pl.name === m.pName;
                  });
                  if (pendIdx >= 0) {
                    // 五戰未到席位被真人頂上：沿用預期名單的顏色與位置
                    nList = prev.slice();
                    nList[pendIdx] = {
                      id: m.uid,
                      name: m.pName || "玩家",
                      isHost: false,
                      color: prev[pendIdx].color,
                      isReady: false,
                      isSpectator: isSpec
                    };
                  } else nList = [].concat(_toConsumableArray(prev), [{
                    id: m.uid,
                    name: m.pName || "玩家",
                    isHost: false,
                    color: platHubRef.current && isShellColor(m.color) ? m.color : getAvailableColor(prev),
                    isReady: false,
                    isSpectator: isSpec
                  }]);
                }
                connsRef.current.forEach(function (conn) {
                  if (conn === c) conn.send({
                    type: 'INIT',
                    data: _objectSpread(_objectSpread({}, stateRef.current), {}, {
                      solutionGrid: solutionGridRef.current
                    }),
                    players: nList,
                    isSpectator: isSpec
                  });else if (conn.open) conn.send({
                    type: 'PLAYERS_UPDATE',
                    players: nList
                  });
                });
                return nList;
              });
              if (!existingPlayer) showToast("\uD83D\uDC4B ".concat(m.pName || "玩家", " \u5DF2\u52A0\u5165\u5C0D\u5C40")); // 重送 JOIN 的冪等回應不再跳提示
            } else if (m.type === 'SYNC') {
              if (!isStaleSync(m.data)) {
                syncState(m.data, false, true);
                if (m.data.isBrawlMode && m.data.startTime) setMatchStartTime(m.data.startTime - platTimeOffset());
              }
            } else if (m.type === 'PLAYERS_UPDATE') {
              if (m.players) setPlayersList(m.players);
            } else if (m.type === 'REQ_READY') {
              setPlayersList(function (prev) {
                var nList = prev.map(function (p) {
                  return p.id === m.targetId ? _objectSpread(_objectSpread({}, p), {}, {
                    isReady: true
                  }) : p;
                });
                connsRef.current.forEach(function (conn) {
                  if (conn.open) conn.send({
                    type: 'PLAYERS_UPDATE',
                    players: nList
                  });
                });
                return nList;
              });
            } else if (m.type === 'REQ_UNREADY') {
              setPlayersList(function (prev) {
                var nList = prev.map(function (p) {
                  return p.id === m.targetId ? _objectSpread(_objectSpread({}, p), {}, {
                    isReady: false
                  }) : p;
                });
                connsRef.current.forEach(function (conn) {
                  if (conn.open) conn.send({
                    type: 'PLAYERS_UPDATE',
                    players: nList
                  });
                });
                return nList;
              });
            } else if (m.type === 'REQ_PLAY_DIRECT') {
              if (isHostRef.current) generateAndSync(stateRef.current.sizeId, stateRef.current.diffId, undefined, true);
            } else if (m.type === 'REQ_PLAY_AGAIN') {
              if (isHostRef.current) generateAndSync(stateRef.current.sizeId, stateRef.current.diffId, undefined, false);
            } else if (m.type === 'REQ_COLOR_CHANGE') handlePlayerColorChange(m.targetId, m.color);else if (m.type === 'REQ_NAME_CHANGE') handlePlayerNameChange(m.targetId, m.name);else if (m.type === 'REQ_SPEC_TOGGLE') {
              setPlayersList(function (prev) {
                var nList = prev.map(function (p) {
                  if (p.id === m.targetId) {
                    var newState = m.forceState !== undefined && m.forceState !== null ? m.forceState : !p.isSpectator;
                    return _objectSpread(_objectSpread({}, p), {}, {
                      isSpectator: newState,
                      isLobbySpectator: m.isTemp ? p.isLobbySpectator : newState
                    });
                  }
                  return p;
                });
                connsRef.current.forEach(function (conn) {
                  if (conn.open) conn.send({
                    type: 'PLAYERS_UPDATE',
                    players: nList
                  });
                });
                return nList;
              });
            } else if (m.type === 'GHOST_I_WON') {
              if (isHostRef.current && handleBrawlWinRef.current) handleBrawlWinRef.current(m.winInfo);
            } else if (m.type === 'GHOST_SOLVED') {
              setGhostHints(function (prev) {
                var newHints = _objectSpread({}, prev);
                if (m.value === null || m.value === undefined) {
                  if (newHints[m.cellId]) {
                    var cellHints = _objectSpread({}, newHints[m.cellId]);
                    delete cellHints[m.uid];
                    newHints[m.cellId] = cellHints;
                  }
                } else {
                  newHints[m.cellId] = _objectSpread(_objectSpread({}, prev[m.cellId] || {}), {}, _defineProperty({}, m.uid, {
                    color: m.color,
                    value: m.value
                  }));
                }
                return newHints;
              });
              connsRef.current.forEach(function (conn) {
                if (conn.open && conn !== c) conn.send(m);
              });
            } else if (m.type === 'GHOST_WINNER') {
              setWinner(m.winner);
              if (m.winner.id === myId) setEndTime(Date.now());
            } else if (m.type === 'CURSOR') {
              setCursors(function (prev) {
                return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, m.uid, {
                  x: m.x,
                  y: m.y
                }));
              });
              connsRef.current.forEach(function (conn) {
                if (conn.open && conn !== c) conn.send(m);
              });
            } else if (m.type === 'CLICK') {
              setRipples(function (prev) {
                return [].concat(_toConsumableArray(prev), [{
                  id: Date.now() + Math.random(),
                  uid: m.uid,
                  x: m.x,
                  y: m.y,
                  timestamp: Date.now()
                }]);
              });
              connsRef.current.forEach(function (conn) {
                if (conn.open && conn !== c) conn.send(m);
              });
            } else if (m.type === 'REQ_REJOIN') {/* 房主不處理 REQ_REJOIN：原寫法用房主恆為 null 的 connRef 會丟 TypeError；來賓自癒靠自己週期性重送 JOIN（稽核修） */} else if (m.type === 'RECEIVE_GIFT') {
              setUnopenedGifts(function (prev) {
                var q = prev[m.targetUid] || [];
                return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, m.targetUid, [].concat(_toConsumableArray(q), [m.senderUid || 'system'])));
              });
              if (m.targetUid === myId) {
                try {
                  if (window.PlatFly) PlatFly.fly(PlatFly.byUid('sudoku', m.senderUid), document.getElementById('btn-open-gift') || PlatFly.byUid('sudoku', myId), '🎁');
                } catch (e) {}
              } // H3 禮物 Fly（純顯示層）
              maybeAutoOpenGift(m.targetUid);
              connsRef.current.forEach(function (conn) {
                if (conn.open && conn !== c) conn.send(m);
              });
            } else if (m.type === 'GIFT_OPENED') {
              if (m.uid !== myId) {
                setUnopenedGifts(function (prev) {
                  var q = prev[m.uid] || [];
                  var nq = _toConsumableArray(q);
                  nq.shift();
                  return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, m.uid, nq));
                });
              }
              connsRef.current.forEach(function (conn) {
                if (conn.open && conn !== c) conn.send(m);
              });
            } else if (m.type === 'GIFT_COUNTER_ATTACK') {
              if (m.targetUid === myId) {
                if (handleReceiveCounterAttackRef.current) handleReceiveCounterAttackRef.current();
              }
              connsRef.current.forEach(function (conn) {
                if (conn.open && conn !== c) conn.send(m);
              });
            } else if (m.type === 'MILESTONE_REACHED') {
              if (handleMilestoneRef.current) handleMilestoneRef.current(m);
              connsRef.current.forEach(function (conn) {
                if (conn.open && conn !== c) conn.send(m);
              });
            } else if (m.type === 'RECEIVE_WEAPON') {
              if (handleReceiveWeaponRef.current) handleReceiveWeaponRef.current(m);
              connsRef.current.forEach(function (conn) {
                if (conn.open && conn !== c) conn.send(m);
              });
            } else if (m.type === 'WEAPON_HIT_FOG') {
              if (handleWeaponHitFogRef.current) handleWeaponHitFogRef.current(m);
              connsRef.current.forEach(function (conn) {
                if (conn.open && conn !== c) conn.send(m);
              });
            } else if (m.type === 'WEAPON_HIT_ERASE') {
              if (handleWeaponHitEraseRef.current) handleWeaponHitEraseRef.current(m);
              connsRef.current.forEach(function (conn) {
                if (conn.open && conn !== c) conn.send(m);
              });
            }
          });
          c.on('close', function () {
            if (c.uid) {
              setPlayersList(function (prev) {
                var newList = prev.filter(function (p) {
                  return p.id !== c.uid;
                });
                connsRef.current.forEach(function (conn) {
                  if (conn !== c && conn.open) conn.send({
                    type: 'PLAYERS_UPDATE',
                    players: newList
                  });
                });
                return newList;
              });
              showToast("👋 一位玩家已斷開連線");
            }
            connsRef.current = connsRef.current.filter(function (conn) {
              return conn !== c;
            });
          });
        });
        p.on('error', function (err) {
          if (err.type === 'unavailable-id') {
            showToast("⚠️ 房號已被佔用或正在釋放中，請稍候再試");
            setIsConnecting(false);
          }
        });
      });
    } else {
      var guestP = new Peer();
      peerRef.current = guestP;
      guestP.on('open', function (id) {
        setConnectionStatus("已啟動握手，建立加密通道...");
        var c = guestP.connect('yyh-tgsh-' + rId + '-host');
        connRef.current = c;
        c.on('open', function () {
          setConnectionStatus("已找到主機，同步遊戲資料中...");
          c.send({
            type: 'JOIN',
            pName: pName,
            uid: myId,
            color: myColorRef.current
          });
          // JOIN 重送保險：開局瞬間訊息遺失（連線重建/房主端 handler 晚註冊）時，單次 JOIN 一掉就永遠卡在同步畫面。
          // 房主的 JOIN handler 冪等（已在名單者只更新並回最新 INIT 快照），所以在 waiting 階段每 3 秒重送直到開局。
          if (joinRetryRef.current) clearInterval(joinRetryRef.current);
          var joinTries = 0;
          joinRetryRef.current = setInterval(function () {
            joinTries++;
            if (joinTries > 40 || connRef.current !== c || stateRef.current.matchPhase !== 'waiting') {
              clearInterval(joinRetryRef.current);
              joinRetryRef.current = null;
              return;
            }
            if (c.open) {
              try {
                c.send({
                  type: 'JOIN',
                  pName: pName,
                  uid: myId,
                  color: myColorRef.current
                });
              } catch (e) {}
            }
          }, 3000);
        });
        c.on('data', function (m) {
          hostSeenRef.current = Date.now();
          if (m.type === 'PONG') {
            return;
          }
          if (m.type === 'INIT') {
            setConnectionStatus("同步完成，進入遊戲！");
            setRoomId(rId);
            setScreen('game');
            setIsHeaderCollapsed(true);
            setIsConnecting(false);
            // 強制立刻儲存一次，避開 syncState 的狀態更新延遲 (v3.8.15)
            saveLocalProgress(rId, myId, pName, false, m.data.isBrawlMode ? m.data.localCells : m.data.cells);
            syncState(m.data, false, true);
            setPlayersList(adoptHubPlayers(m.players));
            setIsSpectator(m.isSpectator);
          } else if (m.type === 'SYNC') {
            if (isStaleSync(m.data)) {/* 上一局遲到的 SYNC：丟棄，不覆寫新局盤面（新局開局包不在此列，見 isStaleSync） */} else {
              syncState(m.data, false, true);
              if (m.data.isBrawlMode && m.data.startTime) setMatchStartTime(m.data.startTime - platTimeOffset());
              // 客端收到同步後也立刻存檔備援 (v3.8.21)
              if (roomId && !isSpectator) {
                saveLocalProgress(roomId, myId, pName, false, m.data.isBrawlMode ? m.data.localCells : m.data.cells, m.data.sessionId || stateRef.current.sessionId, {
                  solution: solutionGridRef.current,
                  players: playersListRef.current,
                  sizeId: m.data.sizeId,
                  diffId: m.data.diffId,
                  isBrawl: m.data.isBrawlMode,
                  isGhost: m.data.isBrawlMode
                });
              }
            }
          } else if (m.type === 'PLAYERS_UPDATE') {
            if (m.players) setPlayersList(adoptHubPlayers(m.players));
          } else if (m.type === 'GHOST_SOLVED') {
            setGhostHints(function (prev) {
              var newHints = _objectSpread({}, prev);
              if (m.value === null || m.value === undefined) {
                if (newHints[m.cellId]) {
                  var cellHints = _objectSpread({}, newHints[m.cellId]);
                  delete cellHints[m.uid];
                  newHints[m.cellId] = cellHints;
                }
              } else {
                newHints[m.cellId] = _objectSpread(_objectSpread({}, prev[m.cellId] || {}), {}, _defineProperty({}, m.uid, {
                  color: m.color,
                  value: m.value
                }));
              }
              return newHints;
            });
          } else if (m.type === 'GHOST_WINNER') {
            setWinner(m.winner);
            if (m.winner.id === myId) setEndTime(Date.now());
          } else if (m.type === 'CURSOR') setCursors(function (prev) {
            return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, m.uid, {
              x: m.x,
              y: m.y
            }));
          });else if (m.type === 'CLICK') setRipples(function (prev) {
            return [].concat(_toConsumableArray(prev), [{
              id: Date.now() + Math.random(),
              uid: m.uid,
              x: m.x,
              y: m.y,
              timestamp: Date.now()
            }]);
          });else if (m.type === 'JOIN_REJECTED') {
            if (joinRetryRef.current) {
              clearInterval(joinRetryRef.current);
              joinRetryRef.current = null;
            }
            setIsConnecting(false);
            showToast("⚠️ 無法加入：暱稱衝突");
          } else if (m.type === 'RECEIVE_GIFT') {
            setUnopenedGifts(function (prev) {
              var q = prev[m.targetUid] || [];
              return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, m.targetUid, [].concat(_toConsumableArray(q), [m.senderUid || 'system'])));
            });
            if (m.targetUid === myId) {
              try {
                if (window.PlatFly) PlatFly.fly(PlatFly.byUid('sudoku', m.senderUid), document.getElementById('btn-open-gift') || PlatFly.byUid('sudoku', myId), '🎁');
              } catch (e) {}
            } // H3 禮物 Fly（純顯示層）
            maybeAutoOpenGift(m.targetUid);
          } else if (m.type === 'GIFT_OPENED') {
            if (m.uid !== myId) {
              setUnopenedGifts(function (prev) {
                var q = prev[m.uid] || [];
                var nq = _toConsumableArray(q);
                nq.shift();
                return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, m.uid, nq));
              });
            }
          } else if (m.type === 'GIFT_COUNTER_ATTACK') {
            if (m.targetUid === myId) {
              if (handleReceiveCounterAttackRef.current) handleReceiveCounterAttackRef.current();
            }
          } else if (m.type === 'RECEIVE_WEAPON') {
            if (handleReceiveWeaponRef.current) handleReceiveWeaponRef.current(m);
          } else if (m.type === 'WEAPON_HIT_FOG') {
            if (handleWeaponHitFogRef.current) handleWeaponHitFogRef.current(m);
          } else if (m.type === 'WEAPON_HIT_ERASE') {
            if (handleWeaponHitEraseRef.current) handleWeaponHitEraseRef.current(m);
          }
        });
        c.on('close', function () {
          if (window.__PLAT_PLATFORM) {
            showToast("📡 房主連線中斷，正在自動重連…");
            return;
          }
          var list = playersListRef.current;
          var others = list.filter(function (p) {
            return !p.isHost && !p.isSpectator;
          });
          if (others.length === 0) {
            showToast("⚠️ 與主機連線中斷，轉為單機模式");
            switchToOffline();
          } else {
            var nextHost = others[0];
            if (myId === nextHost.id) {
              showToast("👑 原主機離線，您已被自動提升為新房主！正在重組對局...");
              // 稍微延遲以確保 PeerID 已釋放
              setTimeout(function () {
                setupPeerJS(rId, pName, true);
              }, 1500);
            } else {
              showToast("\uD83D\uDCE1 \u4E3B\u6A5F\u96E2\u7DDA\uFF0C\u6B63\u5728\u7B49\u5F85 ".concat(nextHost.name, " \u63A5\u7BA1\u623F\u9593..."));
              // 其它玩家嘗試連回新房主
              setTimeout(function () {
                setupPeerJS(rId, pName, false);
              }, 5000);
            }
          }
        });
      });
      guestP.on('error', function (err) {
        setIsConnecting(false);
        if (err.type === 'peer-unavailable') showToast("⚠️ 找不到對應房號，主機可能已離線");else showToast("⚠️ 連線發生錯誤：" + err.type);
      });
    }
  };
  var renderHostGodView = function renderHostGodView() {
    // v1.44 Q5 拍板：廢多盤面總覽，改單盤＋選手切換（與數橋/地雷觀戰同式：主欄白卡、標題統一）
    var activePlayers = playersList.filter(function (p) {
      return !p.isSpectator;
    });
    if (activePlayers.length === 0) return /*#__PURE__*/React.createElement("div", {
      className: "text-slate-500 text-2xl font-black flex items-center justify-center flex-1"
    }, "\u7B49\u5F85\u73A9\u5BB6\u52A0\u5165...");
    var others = activePlayers.filter(function (p) {
      return p.id !== myId;
    });
    var watchable = others.length ? others : activePlayers;
    var sel = watchable.find(function (p) {
      return p.id === godUid;
    }) || watchable[0];
    var iFinished = stateRef.current.brawlWinners.some(function (w) {
      return w.id === myId;
    }); // 大亂鬥的 winner 要等全場結束才設定；「我已完賽」看 brawlWinners 才準（標題與數橋/地雷同式）
    var size = cSizeDef.size;
    var CS = 40,
      pw = size * CS;
    return /*#__PURE__*/React.createElement("div", {
      className: "w-full max-w-md mx-auto bg-white border-4 border-slate-800 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,1)] p-4 md:p-5 animate-fadeIn my-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "font-black text-xl text-slate-800 text-center mb-3"
    }, /*#__PURE__*/React.createElement("span", {
      key: winner || iFinished ? 'fin' : 'spec',
      className: "plat-lite-in",
      style: {
        display: 'inline-block'
      }
    }, winner || iFinished ? '🏁 已完賽・觀戰中' : '👁️ 觀戰中')), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap justify-center gap-1.5 mb-3"
    }, watchable.map(function (p) {
      return /*#__PURE__*/React.createElement("button", {
        key: p.id,
        onClick: function onClick() {
          return setGodUid(p.id);
        },
        className: "plat-btn-hard plat-btn-hard-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-slate-800 font-black text-xs shadow-[2px_2px_0px_rgba(30,41,59,1)]" + (sel.id === p.id ? " bg-slate-800 text-white" : " bg-white text-slate-700")
      }, /*#__PURE__*/React.createElement("span", {
        className: "w-3 h-3 rounded-full border border-slate-800 shrink-0",
        style: {
          background: p.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : p.color
        }
      }), p.name, " ", p.isHost && '👑', " ", ghostProgress[p.id] || 0, "%");
    })), /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 ".concat(pw, " ").concat(pw),
      className: "w-full h-auto",
      style: {
        aspectRatio: '1/1',
        background: '#1e293b',
        borderRadius: '8px'
      }
    }, cells.map(function (cell) {
      var cx = cell.x * CS;
      var cy = cell.y * CS;
      var isFilled = false;
      var color = "rgba(255,255,255,0.05)";
      var val = "";
      if (cell.isGiven || cell.isSystemRevealed) {
        isFilled = true;
        color = "#475569";
        val = cell.value;
      } else if (ghostHints[cell.id] && ghostHints[cell.id][sel.id]) {
        isFilled = true;
        var hint = ghostHints[cell.id][sel.id];
        color = _typeof(hint) === 'object' ? hint.color : hint;
        val = _typeof(hint) === 'object' ? hint.value : "";
      }
      return /*#__PURE__*/React.createElement("g", {
        key: cell.id
      }, /*#__PURE__*/React.createElement("rect", {
        x: cx + 1,
        y: cy + 1,
        width: CS - 2,
        height: CS - 2,
        fill: color,
        fillOpacity: isFilled && (cell.isGiven || cell.isSystemRevealed || brawlSettings.showNumbersInGodMode) ? "0.3" : "1",
        rx: "3"
      }), isFilled && (cell.isGiven || cell.isSystemRevealed || brawlSettings.showNumbersInGodMode) && /*#__PURE__*/React.createElement("text", {
        x: cx + CS / 2,
        y: cy + CS / 2 + 7,
        textAnchor: "middle",
        fill: "white",
        className: "font-black",
        style: {
          fontSize: '20px'
        }
      }, val));
    }), Array.from({
      length: size + 1
    }).map(function (_, i) {
      var isThickX = i % cSizeDef.boxW === 0;
      var isThickY = i % cSizeDef.boxH === 0;
      return /*#__PURE__*/React.createElement("g", {
        key: "god-grid-".concat(i),
        className: "pointer-events-none"
      }, /*#__PURE__*/React.createElement("line", {
        x1: i * CS,
        y1: 0,
        x2: i * CS,
        y2: pw,
        stroke: "#94a3b8",
        strokeWidth: isThickX ? 3 : 1,
        strokeOpacity: isThickX ? 1 : 0.3,
        strokeLinecap: isThickX ? 'square' : 'butt'
      }), /*#__PURE__*/React.createElement("line", {
        x1: 0,
        y1: i * CS,
        x2: pw,
        y2: i * CS,
        stroke: "#94a3b8",
        strokeWidth: isThickY ? 3 : 1,
        strokeOpacity: isThickY ? 1 : 0.3,
        strokeLinecap: isThickY ? 'square' : 'butt'
      }));
    })), /*#__PURE__*/React.createElement("div", {
      className: "mt-3 flex items-center justify-center gap-2 font-black text-slate-700 text-sm"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-3.5 h-3.5 rounded-full border-2 border-slate-800",
      style: {
        background: sel.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : sel.color
      }
    }), sel.name, " ", sel.isHost && '👑', " \u7684\u76E4\u9762\u30FB\u9032\u5EA6 ", ghostProgress[sel.id] || 0, "%", stateRef.current.brawlWinners.some(function (w) {
      return w.id === sel.id;
    }) && /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] bg-yellow-400 text-slate-800 px-1.5 py-0.5 rounded font-black shadow-[1px_1px_0px_#000]"
    }, "\u5DF2\u5B8C\u6210")));
  };
  // ==========================================
  // 新增：連線狀態蓋板 (v3.8.14)
  // ==========================================
  if (isConnecting) {
    return /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-[#fffaf0] p-8 rounded-3xl border-4 border-slate-800 shadow-[10px_10px_0px_rgba(30,41,59,1)] text-center max-sm w-full transform rotate-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative w-20 h-20 mx-auto mb-8"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-0 border-8 border-slate-200 rounded-full"
    }), /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-0 border-8 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"
    }), /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-0 flex items-center justify-center text-3xl"
    }, "\uD83D\uDCE1")), /*#__PURE__*/React.createElement("h2", {
      className: "text-2xl font-black text-slate-800 mb-2"
    }, "\u6B63\u5728\u5EFA\u7ACB\u901A\u8A0A..."), /*#__PURE__*/React.createElement("p", {
      className: "text-slate-600 font-bold mb-8 h-12 flex items-center justify-center leading-relaxed"
    }, connectionStatus || "初始化連線模組中..."), /*#__PURE__*/React.createElement("div", {
      className: "space-y-4"
    }, showCancelButton ? /*#__PURE__*/React.createElement("button", {
      onClick: cancelConnection,
      className: "w-full py-4 bg-red-500 text-white border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_#1e293b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all animate-bounce"
    }, "\u274C \u53D6\u6D88\u9023\u7DDA\u4E26\u8FD4\u56DE") : /*#__PURE__*/React.createElement("div", {
      className: "py-4 text-slate-400 font-semibold text-sm animate-pulse italic"
    }, "\u8ACB\u7A0D\u5019\uFF0C\u6B63\u52AA\u529B\u5C0B\u627E\u4E3B\u6A5F\u4E2D..."), /*#__PURE__*/React.createElement("p", {
      className: "text-[10px] text-slate-400 font-semibold uppercase tracking-widest"
    }, "Connection ID: ", myId.substring(0, 6)))));
  }
  var tutorialOverlay = showTutorial ? /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4",
    onClick: function onClick() {
      return setShowTutorial(false);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#fffaf0] border-4 border-slate-800 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,1)] max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 relative",
    onClick: function onClick(e) {
      return e.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setShowTutorial(false);
    },
    className: "plat-btn-hard plat-btn-hard-2 absolute top-3 right-3 w-9 h-9 bg-white border-[3px] border-slate-800 rounded-full font-black shadow-[2px_2px_0px_rgba(30,41,59,1)] z-10"
  }, "\u2715"), /*#__PURE__*/React.createElement("h3", {
    className: "text-2xl font-black text-slate-800 border-b-4 border-[#ffcc00] inline-block pb-1 mb-5"
  }, "\u2753 \u73A9\u6CD5\u6559\u5B78"), /*#__PURE__*/React.createElement("div", {
    className: "h-[400px] flex flex-col justify-center bg-white border-[3px] border-slate-800 rounded-xl p-4 mb-4 shadow-[4px_4px_0px_rgba(30,41,59,1)]" + (tutStep !== 0 ? " hidden" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 border-[3px] border-slate-800 rounded-lg overflow-hidden w-40"
  }, ['5', '', '', '', null, '3', '', '', ''].map(function (v, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "relative aspect-square flex items-center justify-center font-black text-xl border border-slate-300 " + (v === null ? tutDemoVal === 8 ? 'bg-emerald-50' : tutDemoWrong ? 'bg-rose-50' : 'bg-amber-50' : 'bg-white text-slate-800')
    }, v === null ? tutDemoVal === 8 ? /*#__PURE__*/React.createElement("span", {
      className: "text-emerald-600"
    }, "8") : tutDemoWrong ? /*#__PURE__*/React.createElement("span", {
      className: "text-rose-500"
    }, tutDemoWrong) : /*#__PURE__*/React.createElement("span", {
      className: "text-amber-400"
    }, "?") : v);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center gap-2 mb-3"
  }, [7, 8, 9].map(function (n) {
    return /*#__PURE__*/React.createElement("button", {
      key: n,
      onClick: function onClick() {
        if (n === 8) {
          setTutDemoVal(8);
          setTutDemoWrong(null);
        } else {
          setTutDemoVal(null);
          setTutDemoWrong(n);
        }
      },
      className: "plat-btn-hard plat-btn-hard-3 w-12 h-12 bg-white border-[3px] border-slate-800 rounded-xl font-black text-xl text-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)]"
    }, n);
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-center font-bold text-slate-700"
  }, tutDemoVal === 8 ? '✅ 答對了！中間這格就是 8——先點格子、再按數字鍵，就是這樣填的' : tutDemoWrong ? '❌ ' + tutDemoWrong + ' 不對喔，再想想這一格該填多少' : '動手試試：中間發亮的格子該填哪個數字？點下面的數字鍵試試')), /*#__PURE__*/React.createElement("div", {
    className: "h-[400px] flex flex-col justify-center bg-white border-[3px] border-slate-800 rounded-xl p-4 mb-4 shadow-[4px_4px_0px_rgba(30,41,59,1)]" + (tutStep !== 1 ? " hidden" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative w-20 h-20 border-[3px] border-slate-800 rounded-lg bg-white"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tut-draft-a absolute top-1 left-2 font-black text-slate-400 text-lg"
  }, "2"), /*#__PURE__*/React.createElement("span", {
    className: "tut-draft-b absolute bottom-1 right-2 font-black text-slate-400 text-lg"
  }, "7"), /*#__PURE__*/React.createElement("span", {
    className: "absolute -bottom-3 -right-3 text-2xl"
  }, "\u270F\uFE0F"))), /*#__PURE__*/React.createElement("p", {
    className: "text-center font-bold text-slate-700"
  }, "\u9084\u4E0D\u78BA\u5B9A\uFF1F\u5148\u958B\u7B46\u8A18\uFF0C\u628A\u53EF\u80FD\u7684\u6578\u5B57\u8A18\u4E0B\u4F86")), /*#__PURE__*/React.createElement("div", {
    className: "h-[400px] flex flex-col justify-center bg-white border-[3px] border-slate-800 rounded-xl p-4 mb-4 shadow-[4px_4px_0px_rgba(30,41,59,1)]" + (tutStep !== 2 ? " hidden" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex border-[3px] border-slate-800 rounded-lg overflow-hidden"
  }, [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) {
    return /*#__PURE__*/React.createElement("div", {
      key: n,
      className: "tut-row-cell w-8 h-8 md:w-9 md:h-9 flex items-center justify-center font-black border-r border-slate-300 last:border-r-0",
      style: {
        animationDelay: n * 0.28 + 's'
      }
    }, n);
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-center font-bold text-slate-700"
  }, "\u6BCF\u4E00\u884C\u3001\u6BCF\u4E00\u5217\u3001\u6BCF\u500B 3\xD73 \u5BAE\uFF0C1~9 \u90FD\u4E0D\u80FD\u91CD\u8907")), /*#__PURE__*/React.createElement("div", {
    className: "h-[400px] flex flex-col justify-center bg-white border-[3px] border-slate-800 rounded-xl p-4 mb-5 shadow-[4px_4px_0px_rgba(30,41,59,1)]" + (tutStep !== 3 ? " hidden" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center gap-2 mb-3 flex-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "px-3 py-2 bg-[#ffcc00] border-[3px] border-slate-800 rounded-xl font-black text-sm shadow-[2px_2px_0px_rgba(30,41,59,1)]"
  }, "\uD83D\uDD22 \u5148\u9EDE\u6578\u5B57 \u2192 \u518D\u9EDE\u683C\u5B50"), /*#__PURE__*/React.createElement("span", {
    className: "px-3 py-2 bg-sky-300 border-[3px] border-slate-800 rounded-xl font-black text-sm shadow-[2px_2px_0px_rgba(30,41,59,1)]"
  }, "\uD83D\uDC46 \u5148\u9EDE\u683C\u5B50 \u2192 \u518D\u9EDE\u6578\u5B57")), /*#__PURE__*/React.createElement("p", {
    className: "text-center font-bold text-slate-700"
  }, "\u8F38\u5165\u65B9\u5F0F\u81EA\u5DF1\u9078\uFF0C\u904A\u6232\u4E2D\u5728\u76E4\u9762\u4E0B\u65B9\u96A8\u6642\u5207\u63DB")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center gap-2 mb-5"
  }, [0, 1, 2, 3].map(function (idx) {
    return /*#__PURE__*/React.createElement("div", {
      key: idx,
      className: "w-2.5 h-2.5 rounded-full border-2 border-slate-800 " + (idx === tutStep ? "bg-[#ffcc00]" : "bg-white")
    });
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3"
  }, tutStep > 0 ? /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setTutStep(tutStep - 1);
    },
    className: "plat-btn-hard flex-1 py-2.5 border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] bg-white text-slate-800"
  }, "\u4E0A\u4E00\u6B65") : /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setShowTutorial(false);
    },
    className: "plat-btn-hard flex-1 py-2.5 border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] bg-white text-slate-400"
  }, "\u8DF3\u904E"), tutStep < 3 ? /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setTutStep(tutStep + 1);
    },
    className: "plat-btn-hard flex-1 py-2.5 border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] bg-[#ffcc00] text-slate-900"
  }, "\u4E0B\u4E00\u6B65") : /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setShowTutorial(false);
    },
    className: "plat-btn-hard flex-1 py-2.5 border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] bg-emerald-400 text-slate-900"
  }, "\u958B\u59CB\u904A\u6232 \uD83C\uDFAE")))) : null;
  if (screen === 'home') {
    return /*#__PURE__*/React.createElement("div", {
      className: "h-screen w-screen flex flex-col items-center justify-center p-4 relative overflow-hidden animate-fadeIn"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex-1 flex flex-col justify-center w-full max-w-md items-center"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-[#fffaf0] border-4 border-slate-800 p-10 rounded-xl shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full text-center relative transform -rotate-1 z-10"
    }, /*#__PURE__*/React.createElement("h1", {
      className: "text-6xl font-black text-slate-800 mb-6 tracking-widest flex justify-center gap-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "inline-block bg-[#ffcc00] px-4 py-2 border-4 border-slate-800 rounded-xl transform rotate-3 shadow-[4px_4px_0px_rgba(30,41,59,1)]"
    }, "\u6578"), /*#__PURE__*/React.createElement("span", {
      className: "inline-block bg-[#ffcc00] px-4 py-2 border-4 border-slate-800 rounded-xl transform -rotate-2 shadow-[4px_4px_0px_rgba(30,41,59,1)]"
    }, "\u7368")), /*#__PURE__*/React.createElement("div", {
      className: "inline-block border-[3px] border-dashed border-slate-800 rounded-xl px-6 py-2 mb-8 bg-white shadow-[4px_4px_0px_rgba(30,41,59,1)] transform rotate-2"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-slate-800 font-black text-xl tracking-widest uppercase italic"
    }, "Sudoku Master")), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col gap-5"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: startSinglePlayer,
      className: "plat-btn-hard w-full py-4 bg-white border-4 border-slate-800 rounded-xl font-black text-xl text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)] transform rotate-1"
    }, "\uD83D\uDC64 \u55AE\u6A5F\u6311\u6230"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return startDailyGame(dailyPickDate);
      },
      className: "plat-btn-hard w-full py-4 bg-[#ffcc00] border-4 border-slate-800 rounded-xl font-black text-xl text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)] transform rotate-1"
    }, "\uD83D\uDCC5 \u6BCF\u65E5\u4E00\u984C", dailyPickDate !== dailyTodayStr() ? '（' + dailyPickDate.slice(5) + '）' : '', dailyRecords[dailyPickDate] ? ' ✓' : ''), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-center gap-2 flex-wrap"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setDailyPickDate(shiftDateStr(dailyPickDate, -1));
      },
      disabled: dailyPickDate <= '2026-01-01',
      className: "plat-btn-hard plat-btn-hard-2 w-9 h-9 bg-white border-[3px] border-slate-800 rounded-lg font-black shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-30"
    }, "\u25C0"), /*#__PURE__*/React.createElement("button", {
      onClick: openDailyCal,
      className: "plat-btn-hard plat-btn-hard-2 border-[3px] border-slate-800 rounded-lg px-2 py-1.5 font-black bg-white text-sm text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)]"
    }, "\uD83D\uDCC5 ", dailyPickDate), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setDailyPickDate(shiftDateStr(dailyPickDate, 1));
      },
      disabled: dailyPickDate >= dailyTodayStr(),
      className: "plat-btn-hard plat-btn-hard-2 w-9 h-9 bg-white border-[3px] border-slate-800 rounded-lg font-black shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-30"
    }, "\u25B6"), /*#__PURE__*/React.createElement("span", {
      className: "font-black text-sm text-orange-600"
    }, "\uD83D\uDD25 \u9023\u7E8C ", /*#__PURE__*/React.createElement(PlatNum, {
      value: dailyStreak.count || 0
    }), " \u5929"), dailyRecords[dailyPickDate] ? /*#__PURE__*/React.createElement("span", {
      className: "font-black text-sm text-emerald-600"
    }, "\u6700\u4F73 ", /*#__PURE__*/React.createElement(PlatNum, {
      value: formatTime(dailyRecords[dailyPickDate])
    })) : null), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        setTutStep(0);
        setTutDemoVal(null);
        setTutDemoWrong(null);
        setShowTutorial(true);
      },
      className: "plat-btn-hard w-full py-4 bg-white border-4 border-slate-800 rounded-xl font-black text-xl text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)] transform -rotate-1"
    }, "\u2753 \u73A9\u6CD5\u6559\u5B78"), typeof window !== 'undefined' && window.__PLAT_PLATFORM && /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        if (window.PLAT_show) window.PLAT_show('home');
      },
      className: "plat-btn-hard flex-1 py-3 bg-sky-400 border-4 border-slate-800 rounded-xl font-black text-lg text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)]"
    }, "\uD83C\uDFE0 \u56DE\u5927\u5EF3"), renderDockCapsule(false))))), /*#__PURE__*/React.createElement("div", {
      className: "shrink-0 pb-4 text-slate-800 font-black text-sm opacity-60 tracking-wider z-10"
    }, "Copyright \xA9 2026 \u8449\u5927\u5E25. All rights reserved.", ' (v' + (window.PLAT_VERSION || '3.13.4') + ')'), tutorialOverlay);
  }

  // 錦標賽每局開局門檻（房主）：全員到齊且全員準備才能開始；等滿 1 分鐘（且至少 2 人到齊）可強制開始
  var tournGatePresent = playersList.filter(function (p) {
    return !p.isSpectator && !p.pending;
  });
  var tournExpected = tournRoundInfo && tournRoundInfo.entrants || tournGatePresent.length;
  var tournAllPresent = tournGatePresent.length >= Math.max(2, tournExpected);
  var tournAllReady = tournGatePresent.length > 0 && tournGatePresent.every(function (p) {
    return p.isReady;
  });
  var tournWaitMs = tournWaitSinceRef.current ? Date.now() - tournWaitSinceRef.current : 0;
  var tournWaited = tournWaitMs >= 60000;
  var tournCanStart = tournGatePresent.length >= 2 && (tournWaited || tournAllPresent && tournAllReady);
  var tournMyEntry = playersList.find(function (p) {
    return p.id === myId;
  });
  var tournStartNote = tournAllPresent && tournAllReady ? '全員準備好了，等房主開始！' : tournWaited ? '已等滿 1 分鐘，房主可強制開始' : !tournAllPresent ? '等待選手到齊…（或 ' + Math.max(0, 60 - Math.floor(tournWaitMs / 1000)) + ' 秒後可強制開始）' : '等待全員準備（或 ' + Math.max(0, 60 - Math.floor(tournWaitMs / 1000)) + ' 秒後可強制開始）';
  return /*#__PURE__*/React.createElement("div", {
    className: "h-screen w-screen p-1 md:p-2 flex flex-col items-center font-sans relative",
    style: {
      backgroundColor: '#fdf5e6',
      backgroundImage: 'radial-gradient(#d3c5ab 2px, transparent 2px)',
      backgroundSize: '12px 12px'
    }
  }, matchPhase === 'waiting' && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 z-[65] flex items-center justify-center bg-slate-900/80 backdrop-blur-md pointer-events-auto p-4 overflow-y-auto"
  }, engine === 'local' ? /*#__PURE__*/React.createElement("div", {
    className: "bg-[#fffaf0] rounded-2xl p-6 md:p-8 border-4 border-slate-800 shadow-[10px_10px_0px_rgba(30,41,59,1)] text-center min-w-[320px] max-w-xl w-full my-auto animate-bounceIn"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl font-black text-slate-800 mb-2 tracking-widest"
  }, "\uD83E\uDDE9 \u55AE\u6A5F\u6311\u6230\u8A2D\u5B9A"), /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-6 mb-8 text-left"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border-[3px] border-slate-800 rounded-2xl p-5 shadow-[4px_4px_0px_#1e293b] transform rotate-1"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-400 text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 bg-amber-400 rounded-full animate-pulse"
  }), " \uD83D\uDCD0 \u9078\u64C7\u7248\u578B"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, SIZES.map(function (s) {
    return /*#__PURE__*/React.createElement("button", {
      key: s.id,
      onClick: function onClick() {
        return setSizeId(s.id);
      },
      className: "py-3 border-2 border-slate-800 rounded-xl font-black text-sm transition-all " + (sizeId === s.id ? 'bg-[#ffcc00] text-slate-900 shadow-[3px_3px_0px_#1e293b] -translate-y-0.5' : 'bg-slate-50 text-slate-400 hover:bg-white')
    }, s.name);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border-[3px] border-slate-800 rounded-2xl p-5 shadow-[4px_4px_0px_#1e293b] transform -rotate-1"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-400 text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
  }), " \uD83D\uDD25 \u6311\u6230\u96E3\u5EA6"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3 plat-seg",
    "data-seg": "sudoku-diff"
  }, DIFFICULTIES.map(function (d) {
    return /*#__PURE__*/React.createElement("button", {
      key: d.id,
      "data-seg-on": diffId === d.id ? '1' : undefined,
      onClick: function onClick() {
        return setDiffId(d.id);
      },
      className: "py-3 border-2 border-slate-800 rounded-xl font-black text-sm transition-all " + (diffId === d.id ? 'bg-[#ffcc00] seg-on text-slate-900 shadow-[3px_3px_0px_#1e293b] -translate-y-0.5' : 'bg-slate-50 text-slate-400 hover:bg-white')
    }, d.name);
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      generateAndSync(sizeId, diffId);
      setMatchPhase('playing');
    },
    className: "w-full py-5 bg-emerald-400 text-slate-900 border-4 border-slate-800 rounded-2xl font-black shadow-[6px_6px_0px_rgba(30,41,59,1)] text-2xl hover:translate-y-[2px] hover:shadow-none transition-all active:scale-[0.98]"
  }, "\uD83D\uDE80 \u958B\u59CB\u6311\u6230"))) : platHub && platTournLock ? /*#__PURE__*/React.createElement("div", {
    className: "bg-[#fffaf0] rounded-2xl p-6 border-4 border-slate-800 shadow-[10px_10px_0px_rgba(30,41,59,1)] max-w-xl w-full my-auto max-h-full overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center text-4xl mb-1"
  }, "\uD83C\uDFC6"), /*#__PURE__*/React.createElement("div", {
    className: "font-black text-2xl text-slate-800 text-center"
  }, "\u9326\u6A19\u8CFD\u30FB", tournRoundInfo && tournRoundInfo.playoff ? '加賽' : '第 ' + (tournRoundInfo && tournRoundInfo.round || '?') + ' 局'), /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-400 text-sm text-center mt-1 mb-4"
  }, "\u672C\u5C40\uFF1A\u6578\u7368\u5927\u4E82\u9B25\u30FB\u5168\u54E1\u6E96\u5099\u597D\u623F\u4E3B\u624D\u80FD\u958B\u59CB\uFF0C\u6216\u7B49\u6EFF 1 \u5206\u9418\u5F37\u5236\u958B\u59CB"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2 mb-4"
  }, playersList.filter(function (p) {
    return !p.isSpectator;
  }).map(function (p) {
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      className: "flex items-center gap-2 bg-white border-2 border-slate-800 rounded-xl px-3 py-2 font-black text-slate-800"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-4 h-4 rounded-full border-2 border-slate-800 inline-block shrink-0",
      style: {
        background: p.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : p.color
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "truncate"
    }, p.name, p.isHost ? ' 👑' : '', p.id === myId ? '（你）' : ''), /*#__PURE__*/React.createElement("span", {
      className: "ml-auto shrink-0"
    }, p.pending ? /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] bg-slate-100 border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded-md"
    }, "\u672A\u5230") : p.isReady ? /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] bg-emerald-100 border border-emerald-500 text-emerald-700 px-1.5 py-0.5 rounded-md"
    }, "\u2705 \u6E96\u5099\u597D\u4E86") : /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] bg-slate-100 border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded-md"
    }, "\u672A\u6E96\u5099")));
  })), tournMyEntry && !tournMyEntry.pending && /*#__PURE__*/React.createElement("button", {
    onClick: handleTournReady,
    className: "plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 border-[3px] border-slate-800 rounded-xl font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)]" + (tournMyEntry.isReady ? ' bg-amber-400 text-slate-900' : ' bg-white text-slate-500')
  }, tournMyEntry.isReady ? '✅ 已準備（點擊取消）' : '✋ 準備好了'), isHost ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: handleForceStart,
    disabled: !tournCanStart,
    className: "w-full py-3 bg-red-500 text-white border-[3px] border-slate-800 rounded-xl font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
  }, "\uD83C\uDFC1 \u958B\u59CB\u672C\u5C40"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 font-semibold text-center mt-2"
  }, tournStartNote)) : /*#__PURE__*/React.createElement("p", {
    className: "font-black text-slate-700 animate-pulse text-center"
  }, "\u7B49\u5F85\u623F\u4E3B\u958B\u59CB...")) : platHub ? /*#__PURE__*/React.createElement("div", {
    className: "bg-[#fffaf0] rounded-2xl p-8 border-4 border-slate-800 shadow-[10px_10px_0px_rgba(30,41,59,1)] text-center max-w-xl w-full my-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-5xl mb-3"
  }, "\u23F3"), /*#__PURE__*/React.createElement("div", {
    className: "font-black text-2xl text-slate-800 animate-pulse"
  }, "\u7B49\u623F\u4E3B\u958B\u59CB\u5C0D\u5C40\u2026"), /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-400 text-sm mt-2"
  }, "\u6E96\u5099\u548C\u8A2D\u5B9A\u90FD\u5728\u623F\u9593\u9801\u5B8C\u6210\u4E86\uFF0C\u99AC\u4E0A\u958B\u59CB")) : null), resultsDismissedUi && isBrawlMode && matchPhase === 'finished' && /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      resultsDismissRef.current = null;
      setResultsDismissedUi(false);
    },
    className: "plat-btn-hard plat-btn-hard-3 fixed bottom-24 right-3 z-[56] bg-white border-[3px] border-slate-800 rounded-full px-4 py-2 font-black shadow-[3px_3px_0px_#1e293b]"
  }, "\uD83C\uDFC6 \u7D50\u679C"), showExitMenu && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4",
    onClick: function onClick() {
      return setShowExitMenu(false);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border-4 border-[#1e293b] rounded-2xl shadow-[10px_10px_0px_#1e293b] p-6 w-full max-w-xs text-center animate-popUpCenter",
    onClick: function onClick(e) {
      return e.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-black text-xl text-[#1e293b] mb-4"
  }, "\u8981\u96E2\u958B\u5C0D\u5C40\u55CE\uFF1F"), typeof window !== 'undefined' && window.__PLAT_TOURN_CAN_FORCEEND && window.__PLAT_TOURN_CAN_FORCEEND() && /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setShowExitMenu(false);
      if (window.__PLAT_TOURN_FORCEEND) window.__PLAT_TOURN_FORCEEND();
    },
    className: "plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 bg-rose-500 text-white border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_#1e293b]"
  }, "\u23F9\uFE0F \u7D50\u675F\u672C\u5C40\uFF08\u9326\u6A19\u8CFD\uFF09"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setShowExitMenu(false);
      handleBackToLobby();
    },
    className: "plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 bg-white text-slate-800 border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_#1e293b]"
  }, "\uD83C\uDFC1 \u56DE\u7B49\u5F85\u5BA4"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setShowExitMenu(false);
      handleGoHome('leave');
    },
    className: "plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 bg-white text-slate-800 border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_#1e293b]"
  }, "\uD83D\uDEAA \u9000\u51FA\uFF08\u56DE\u5927\u5EF3\uFF09"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setShowExitMenu(false);
    },
    className: "w-full py-2 text-slate-400 font-bold hover:text-slate-700"
  }, "\u53D6\u6D88"))), countdownValue !== null && !isGenerating && !(typeof window !== 'undefined' && window.PlatCountdown) && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 z-[65] flex items-center justify-center bg-slate-900/50 backdrop-blur-md pointer-events-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[12rem] font-black text-red-500 drop-shadow-[0_0_30px_rgba(255,0,0,0.8)] animate-pulse",
    style: {
      textShadow: '6px 6px 0 #fff, -6px -6px 0 #fff, 6px -6px 0 #fff, -6px 6px 0 #fff'
    }
  }, countdownValue)), showSetupModal && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md pointer-events-auto animate-fadeIn p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#fffdfa] rounded-2xl p-6 border-[4px] border-[#1e293b] shadow-[10px_10px_0px_#1e293b] relative flex flex-col gap-4 min-w-[300px] max-w-md w-full mx-auto my-auto animate-popUpCenter"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-black mb-2 border-b-4 border-[#ffcc00] inline-block pb-1"
  }, "\u2699\uFE0F \u8A2D\u5B9A\u984C\u578B\u8207\u96E3\u5EA6"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-slate-600 mb-1"
  }, "\u76E4\u9762\u5C3A\u5BF8\uFF1A"), /*#__PURE__*/React.createElement("select", {
    value: tempSizeId,
    onChange: function onChange(e) {
      return setTempSizeId(parseInt(e.target.value));
    },
    className: "w-full px-3 py-2 rounded-xl border-2 border-slate-800 font-bold bg-white text-slate-800 outline-none shadow-[2px_2px_0px_#1e293b] cursor-pointer"
  }, SIZES.map(function (s) {
    return /*#__PURE__*/React.createElement("option", {
      key: s.id,
      value: s.id
    }, s.name);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "mb-2"
  }, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-slate-600 mb-1"
  }, "\u904A\u6232\u96E3\u5EA6\uFF1A"), /*#__PURE__*/React.createElement("select", {
    value: tempDiffId,
    onChange: function onChange(e) {
      return setTempDiffId(e.target.value);
    },
    className: "w-full px-3 py-2 rounded-xl border-2 border-slate-800 font-bold bg-white text-slate-800 outline-none shadow-[2px_2px_0px_#1e293b] cursor-pointer"
  }, DIFFICULTIES.map(function (d) {
    return /*#__PURE__*/React.createElement("option", {
      key: d.id,
      value: d.id
    }, d.name);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 mt-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setShowSetupModal(false);
    },
    className: "flex-1 py-3 bg-white border-2 border-slate-800 rounded-xl font-black text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] hover:translate-y-[2px] hover:shadow-none transition-all"
  }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setShowSetupModal(false);
      if (isHostRef.current && (sizeId !== tempSizeId || diffId !== tempDiffId)) {
        generateAndSync(tempSizeId, tempDiffId);
      }
    },
    className: "flex-1 py-3 bg-[#ffcc00] text-slate-900 border-2 border-slate-800 rounded-xl font-black shadow-[2px_2px_0px_rgba(30,41,59,1)] hover:translate-y-[2px] hover:shadow-none transition-all"
  }, "\u78BA\u8A8D\u7522\u751F")))), showBrawlSettings && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md pointer-events-auto animate-fadeIn p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-6 border-[4px] border-[#1e293b] shadow-[10px_10px_0px_#1e293b] relative flex flex-col gap-4 min-w-[300px] max-w-sm w-full mx-auto my-auto"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-black mb-2 border-b-4 ".concat(isBrawlMode ? 'border-purple-500' : 'border-sky-500', " inline-block pb-1")
  }, "\u2699\uFE0F ", isBrawlMode ? '大亂鬥設定' : '遊戲設定'), isBrawlMode && /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center justify-between font-bold text-slate-800"
  }, /*#__PURE__*/React.createElement("span", null, "\u7D50\u675F\u540D\u6B21 (1~5)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    max: "5",
    value: brawlSettings.winnersCount,
    onChange: function onChange(e) {
      var val = Math.max(1, Math.min(5, Number(e.target.value)));
      var newS = {};
      for (var k in brawlSettings) {
        newS[k] = brawlSettings[k];
      }
      newS.winnersCount = val;
      syncState({
        brawlSettings: newS
      });
    },
    className: "w-16 border-2 border-slate-800 rounded p-1 text-center font-black"
  })), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center justify-between font-bold text-slate-800 cursor-pointer"
  }, /*#__PURE__*/React.createElement("span", null, "\u4E0A\u5E1D\u8996\u89D2\u986F\u793A\u6578\u5B57"), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: brawlSettings.showNumbersInGodMode,
    onChange: function onChange(e) {
      var newS = _objectSpread({}, brawlSettings);
      newS.showNumbersInGodMode = e.target.checked;
      syncState({
        brawlSettings: newS
      });
    },
    className: "w-5 h-5 accent-purple-500"
  })), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center justify-between font-bold text-slate-800 cursor-pointer"
  }, /*#__PURE__*/React.createElement("span", null, "\u958B\u555F\u9677\u5BB3\u9053\u5177 (\u6C34\u7403/\u6A61\u76AE\u64E6)"), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: brawlSettings.allowWeapons !== false,
    onChange: function onChange(e) {
      var newS = _objectSpread({}, brawlSettings);
      newS.allowWeapons = e.target.checked;
      syncState({
        brawlSettings: newS
      });
    },
    className: "w-5 h-5 accent-purple-500"
  })), brawlSettings.allowWeapons !== false && /*#__PURE__*/React.createElement("label", {
    className: "flex items-center justify-between font-bold text-slate-800"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, "\u9677\u5BB3\u9053\u5177\u5EF6\u9072 (\u79D2)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    max: "600",
    value: brawlSettings.weaponStartTime,
    onChange: function onChange(e) {
      var val = Math.max(0, Math.min(600, Number(e.target.value)));
      var newS = _objectSpread({}, brawlSettings);
      newS.weaponStartTime = val;
      syncState({
        brawlSettings: newS
      });
    },
    className: "w-20 border-2 border-slate-800 rounded p-1 text-center font-black"
  }))), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center justify-between font-bold text-slate-800 cursor-pointer"
  }, /*#__PURE__*/React.createElement("span", null, "\u958B\u555F\u5FEB\u901F\u586B\u7B54"), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: brawlSettings.allowQuickFill,
    onChange: function onChange(e) {
      var newS = {};
      for (var k in brawlSettings) {
        newS[k] = brawlSettings[k];
      }
      newS.allowQuickFill = e.target.checked;
      syncState({
        brawlSettings: newS
      });
    },
    className: "w-5 h-5 " + (isBrawlMode ? 'accent-purple-600' : 'accent-red-600') + " cursor-pointer"
  })), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center justify-between font-bold text-slate-800 cursor-pointer"
  }, /*#__PURE__*/React.createElement("span", null, "\u958B\u555F\u5FAA\u74B0\u6A21\u5F0F"), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: brawlSettings.allowTraversal,
    onChange: function onChange(e) {
      var newS = {};
      for (var k in brawlSettings) {
        newS[k] = brawlSettings[k];
      }
      newS.allowTraversal = e.target.checked;
      syncState({
        brawlSettings: newS
      });
    },
    className: "w-5 h-5 " + (isBrawlMode ? 'accent-purple-600' : 'accent-red-600') + " cursor-pointer"
  })), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center justify-between font-bold text-slate-800 cursor-pointer"
  }, /*#__PURE__*/React.createElement("span", null, "\u958B\u555F\u5E95\u584A\u63D0\u793A"), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: brawlSettings.allowYellowHint,
    onChange: function onChange(e) {
      var newS = {};
      for (var k in brawlSettings) {
        newS[k] = brawlSettings[k];
      }
      newS.allowYellowHint = e.target.checked;
      syncState({
        brawlSettings: newS
      });
    },
    className: "w-5 h-5 " + (isBrawlMode ? 'accent-purple-600' : 'accent-red-600') + " cursor-pointer"
  })), isMultiplayer && /*#__PURE__*/React.createElement("label", {
    className: "flex items-center justify-between font-bold text-slate-800 cursor-pointer"
  }, /*#__PURE__*/React.createElement("span", null, "\u5141\u8A31\u5176\u4ED6\u73A9\u5BB6\u6309\u518D\u4F86\u4E00\u5C40"), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: brawlSettings.allowOthersToPlayAgain !== false,
    onChange: function onChange(e) {
      var newS = {};
      for (var k in brawlSettings) {
        newS[k] = brawlSettings[k];
      }
      newS.allowOthersToPlayAgain = e.target.checked;
      syncState({
        brawlSettings: newS
      });
    },
    className: "w-5 h-5 " + (isBrawlMode ? 'accent-purple-600' : 'accent-red-600') + " cursor-pointer"
  })), isMultiplayer && isBrawlMode && /*#__PURE__*/React.createElement("label", {
    className: "flex items-center justify-between font-bold text-slate-800 cursor-pointer"
  }, /*#__PURE__*/React.createElement("span", null, "\u958B\u555F\u7372\u5F97\u8207\u8D08\u9001\u79AE\u7269\u529F\u80FD"), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: brawlSettings.allowGifts !== false,
    onChange: function onChange(e) {
      var newS = {};
      for (var k in brawlSettings) {
        newS[k] = brawlSettings[k];
      }
      newS.allowGifts = e.target.checked;
      syncState({
        brawlSettings: newS
      });
    },
    className: "w-5 h-5 " + (isBrawlMode ? 'accent-purple-600' : 'accent-red-600') + " cursor-pointer"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setShowBrawlSettings(false);
    },
    className: "mt-4 px-4 py-3 bg-[#ffcc00] border-4 border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] hover:shadow-none transition-all"
  }, "\u95DC\u9589\u8A2D\u5B9A"))), /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-[1200px] bg-[#fffaf0] rounded-xl border-4 border-slate-800 shadow-[10px_10px_0px_rgba(30,41,59,1)] flex flex-col h-full relative z-10 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#ffcc00] border-b-[3px] border-slate-800 shrink-0 z-50 relative transition-all duration-300 ease-in-out px-2 md:px-4 py-1.5 flex flex-col gap-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between gap-2 w-full overflow-x-auto hide-scrollbar pb-0.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 flex-nowrap shrink-0"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "font-black tracking-tight uppercase text-base md:text-2xl text-[#1e293b] flex items-center gap-1 shrink-0"
  }, "\uD83D\uDD22", /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, "\u6578\u7368 - SUDOKU")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 bg-[#1e293b] text-white px-1.5 py-0.5 rounded font-mono font-bold shadow-[2px_2px_0px_rgba(0,0,0,0.4)] text-[10px] md:text-sm whitespace-nowrap shrink-0"
  }, /*#__PURE__*/React.createElement(GameTimer, {
    startTime: startTime,
    endTime: isBrawlMode ? matchPhase === 'finished' ? stateRef.current.matchEndTime || endTime : null : endTime || (winner ? matchStartTime : null),
    isRunning: (isBrawlMode ? matchPhase === 'playing' : !isWon) && !winner && screen === 'game',
    matchPhase: matchPhase
  })), dailyDate && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black shadow-[2px_2px_0px_rgba(0,0,0,0.4)] text-[10px] md:text-sm whitespace-nowrap shrink-0"
  }, "\uD83D\uDCC5 \u6BCF\u65E5 ", dailyDate.slice(5), dailyDate !== dailyTodayStr() ? ' 補玩' : ''), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 shrink-0"
  }, isMultiplayer && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "bg-emerald-400 text-slate-900 px-1.5 py-0.5 rounded border-2 border-slate-800 font-black text-[10px] md:text-sm shadow-[1px_1px_0px_rgba(30,41,59,1)] flex items-center gap-1 whitespace-nowrap shrink-0"
  }, "\u4EE3\u78BC: ", roomId), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      if (isHostRef.current) {
        var currentMode = stateRef.current.isBrawlMode ? 'brawl' : 'coop';
        var nextMode = currentMode === 'coop' ? 'ghost' : currentMode === 'ghost' ? 'brawl' : 'coop';
        generateAndSync(sizeId, diffId, nextMode);
      }
    },
    disabled: !isHostRef.current,
    className: "".concat(isBrawlMode ? 'bg-purple-600' : 'bg-sky-400', " text-white px-1.5 py-0.5 rounded border-2 border-slate-800 font-black text-[10px] md:text-sm shadow-[1px_1px_0px_rgba(30,41,59,1)] flex items-center gap-1 whitespace-nowrap shrink-0 ").concat(isHostRef.current ? 'cursor-pointer hover:translate-y-[1px] hover:shadow-none active:translate-y-[2px] transition-all' : 'opacity-90 cursor-default'),
    title: isHostRef.current ? "點擊切換競賽模式（將會重新出題）" : "僅房主可切換模式"
  }, isBrawlMode ? '⚔️ 大亂鬥' : '🌐 合作模式')), (!isMultiplayer || isHostRef.current) && /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setShowBrawlSettings(true);
    },
    className: "bg-slate-700 text-white px-1.5 py-0.5 rounded border-2 border-slate-800 font-black text-[10px] md:text-sm shadow-[1px_1px_0px_rgba(30,41,59,1)] hover:translate-y-[1px] hover:shadow-none active:translate-y-[2px] transition-all"
  }, "\u2699\uFE0F \u8A2D\u5B9A"))), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsHeaderCollapsed(!isHeaderCollapsed);
    },
    className: "shrink-0 flex px-1.5 py-0.5 bg-[#1e293b] text-white border-2 border-[#1e293b] rounded font-bold text-[10px] md:text-sm shadow-[1px_1px_0px_rgba(0,0,0,0.3)] hover:bg-slate-800 items-center gap-1 whitespace-nowrap"
  }, isHeaderCollapsed ? '🔽 展開規則' : '🔼 縮小面板')), /*#__PURE__*/React.createElement("div", {
    className: "plat-collapse-y w-full" + (isHeaderCollapsed ? "" : " open")
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border-[3px] border-[#1e293b] rounded-xl p-2 md:p-3 text-[#1e293b] shadow-[4px_4px_0px_#1e293b] flex flex-col md:flex-row gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm md:text-base font-black mb-1 border-b-[3px] border-[#ffcc00] inline-block pb-0.5"
  }, "\uD83D\uDCDC \u904A\u6232\u898F\u5247"), /*#__PURE__*/React.createElement("ol", {
    className: "list-decimal list-outside ml-4 space-y-1 text-[10px] md:text-sm leading-relaxed font-bold"
  }, /*#__PURE__*/React.createElement("li", null, "\u9078\u64C7\u4E0A\u65B9\u6578\u5B57\u9EDE\u64CA\u65B9\u683C\u3002\u82E5\u4E0D\u9078\u4E0A\u65B9\u6578\u5B57\uFF0C\u53EF\u76F4\u63A5\u9EDE\u64CA\u76E4\u9762\u5DF2\u6709\u6578\u5B57\u4F86\u300C\u667A\u6167\u5438\u53D6\u300D\u9AD8\u4EAE\u3002"), /*#__PURE__*/React.createElement("li", null, "\u8F38\u5165\u65B9\u5F0F\u53EF\u5728\u4E0B\u65B9\u5207\u63DB\u6210\u300C\uD83D\uDC46 \u683C\u5B50\u5148\u884C\u300D\uFF1A\u5148\u9EDE\u683C\u5B50\u3001\u518D\u9EDE\u6578\u5B57\u586B\u5165\uFF0C\u7FD2\u6163\u9019\u7A2E\u9806\u5E8F\u7684\u73A9\u5BB6\u9069\u7528\uFF1B\u5207\u63DB\u5F8C\u6703\u8A18\u4F4F\u4F60\u7684\u9078\u64C7\u3002"), /*#__PURE__*/React.createElement("li", null, "\u4E0D\u53EF\u91CD\u8907\uFF1A\u82E5\u767C\u751F\u885D\u7A81\uFF0C\u80CC\u666F\u6703\u4EAE\u8D77\u7D05\u8272\u63D0\u793A\u3002"), /*#__PURE__*/React.createElement("li", null, "\u8349\u7A3F\u6A21\u5F0F\uFF1A\u53EF\u5728\u65B9\u683C\u5167\u6A19\u8A18\u591A\u500B\u5C0F\u6578\u5B57\u8F14\u52A9\u63A8\u7406\u3002"), /*#__PURE__*/React.createElement("li", null, "\u9577\u6309\u6E05\u9664\uFF1A\u82E5\u586B\u932F\u6578\u5B57\u4E14\u4E0A\u65B9\u6309\u9375\u5DF2\u88AB\u9396\u5B9A\uFF08\u53CD\u7070\uFF09\uFF0C\u53EF\u9577\u6309\u8A72\u683C 0.5 \u79D2\u5F37\u5236\u6E05\u9664\u3002"))))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-nowrap gap-1.5 items-center w-full overflow-x-auto hide-scrollbar pt-0.5 pb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5 items-center shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: isMultiplayer && !isHostRef.current,
    onClick: function onClick() {
      setTempSizeId(sizeId);
      setTempDiffId(diffId);
      setShowSetupModal(true);
    },
    className: "plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 rounded border-2 border-[#1e293b] font-bold bg-white text-[#1e293b] text-[10px] md:text-sm outline-none shadow-[2px_2px_0px_#1e293b] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0 flex items-center gap-1 hover:translate-y-[1px]",
    title: "\u8A2D\u5B9A\u984C\u578B\u8207\u96E3\u5EA6"
  }, "\u2699\uFE0F ", (_SIZES$find = SIZES.find(function (s) {
    return s.id === sizeId;
  })) === null || _SIZES$find === void 0 ? void 0 : _SIZES$find.name.split(' ')[0], " - ", ((_DIFFICULTIES$find = DIFFICULTIES.find(function (d) {
    return d.id === diffId;
  })) === null || _DIFFICULTIES$find === void 0 ? void 0 : _DIFFICULTIES$find.name.split(' ')[1]) || '難度')), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5 items-center ml-auto shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handlePlayAgain,
    disabled: isMultiplayer && !isHost,
    className: "plat-btn-hard plat-btn-hard-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-blue-500 text-white border-2 border-[#1e293b] rounded font-bold text-[10px] md:text-sm shadow-[2px_2px_0px_#1e293b] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1 shrink-0",
    title: "\u65B0\u984C"
  }, "\uD83C\uDFB2", /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, "\u65B0\u984C")), true && /*#__PURE__*/React.createElement("button", {
    onClick: handleUndo,
    disabled: history.length === 0 || isWon || isMultiplayer && !isBrawlMode,
    className: "plat-btn-hard plat-btn-hard-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-white border-2 border-[#1e293b] rounded font-bold text-[10px] md:text-sm shadow-[2px_2px_0px_#1e293b] disabled:opacity-50 disabled:shadow-none flex items-center gap-1 text-[#1e293b] shrink-0",
    title: "\u5FA9\u539F"
  }, "\u21A9\uFE0F", /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, "\u5FA9\u539F")), /*#__PURE__*/React.createElement("button", {
    onClick: handleReset,
    className: "plat-btn-hard plat-btn-hard-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-red-500 text-white border-2 border-[#1e293b] rounded font-bold text-[10px] md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1 shrink-0",
    title: "\u91CD\u7F6E"
  }, "\uD83D\uDD04", /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, "\u91CD\u7F6E")), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setShowSaveModal(true);
    },
    className: "plat-btn-hard plat-btn-hard-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-blue-500 text-white border-2 border-[#1e293b] rounded font-bold text-[10px] md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1 shrink-0",
    title: "\u5B58\u6A94/\u8B80\u6A94"
  }, "\uD83D\uDCBE", /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, "\u5B58\u6A94")), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      var m = window.SUDOKU_SOUND.toggleMute();
      setMuted(m);
      if (!m) window.SUDOKU_SOUND.play('click');
    },
    className: "plat-btn-hard plat-btn-hard-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-white border-2 border-[#1e293b] rounded font-bold text-[10px] md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1 text-[#1e293b] shrink-0",
    title: muted ? "取消靜音" : "靜音"
  }, muted ? '🔇' : '🔊'), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      var N = typeof window !== 'undefined' ? window.__PLAT_NET : null;
      if (N && N.inMatch === 'sudoku' || typeof window !== 'undefined' && window.__PLAT_TOURN_CAN_FORCEEND && window.__PLAT_TOURN_CAN_FORCEEND()) setShowExitMenu(true);else handleGoHome();
    },
    className: "plat-btn-hard plat-btn-hard-2 bg-white text-[#1e293b] border-2 border-[#1e293b] px-1.5 py-1 md:px-3 md:py-1.5 rounded font-bold text-[10px] md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1 shrink-0",
    title: "\u56DE\u9996\u9801/\u65B7\u7DDA"
  }, !isMultiplayer ? '🏠' : '🔌', /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline ml-1"
  }, !isMultiplayer ? '回首頁' : '退出'))))), isMultiplayer && /*#__PURE__*/React.createElement("div", {
    className: "px-2 md:px-4 py-1.5 bg-[#fffdfa] border-b-[3px] border-slate-800 flex flex-nowrap gap-2 items-center relative z-40 shadow-inner shrink-0 overflow-x-auto hide-scrollbar w-full"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-black text-slate-800 text-xs shrink-0 whitespace-nowrap"
  }, "\uD83D\uDC65 \u73A9\u5BB6\uFF1A"), playersList.map(function (p, idx) {
    var isMe = p.id === myId;
    var isRainbow = p.color === 'rainbow';
    var pct = isBrawlMode ? ghostProgress[p.id] || 0 : (playerProgress.find(function (x) {
      return x.uid === p.id;
    }) || {
      pct: 0
    }).pct || 0;
    return /*#__PURE__*/React.createElement("div", {
      key: idx,
      "data-fly-uid": p.id,
      className: "shrink-0 flex flex-col gap-0.5 border-2 border-slate-800 rounded px-1.5 py-0.5 relative cursor-pointer hover:bg-slate-100 transition-colors ".concat(p.isSpectator ? 'opacity-60 bg-slate-100' : 'bg-white'),
      onClick: function onClick() {
        if (platSessRef.current && platSessRef.current.hub) {
          // 平台 hub：代表色由殼摩天輪決定，遊戲內不開色票——點自己請殼開摩天輪選色（回呼走既有改色管道）；點別人直接不開
          if (isMe && typeof window.__PLAT_PICK_COLOR === 'function') {
            window.__PLAT_PICK_COLOR(myCurrentColor, function (c) {
              if (c) handlePlayerColorChange(myId, c);
            });
          }
          return;
        }
        if (isMe || isHostRef.current) {
          setEditName(p.name);
          setColorPickerTarget(p.id);
        } else {
          showToast("⚠️ 只有房主可以更改其他玩家的設定！");
        }
      },
      title: isMe ? "點擊修改設定" : isHostRef.current ? "房主可修改他人設定" : "無法修改他人設定"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute left-0 top-0 bottom-0 w-1 rounded-l-[1px]",
      style: {
        backgroundColor: isRainbow ? 'transparent' : p.color
      }
    }, isRainbow && /*#__PURE__*/React.createElement("svg", {
      className: "absolute inset-0 w-full h-full pointer-events-none"
    }, /*#__PURE__*/React.createElement("rect", {
      width: "100%",
      height: "100%",
      fill: "url(#rainbowGrad)"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-1 text-[10px] md:text-xs font-bold text-slate-800 pl-1.5 whitespace-nowrap"
    }, p.name, " ", p.isHost && '👑', " ", p.isSpectator && ' 👁️', " ", isMe && '(你)', /*#__PURE__*/React.createElement("span", {
      className: "text-emerald-600 font-mono ml-1"
    }, /*#__PURE__*/React.createElement(PlatPct, {
      value: pct
    }))), /*#__PURE__*/React.createElement("div", {
      className: "w-24 md:w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-1.5 relative border border-slate-300"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full plat-pbar relative overflow-hidden",
      style: {
        width: "".concat(pct, "%"),
        backgroundColor: isRainbow ? 'transparent' : p.color
      }
    }, isRainbow && /*#__PURE__*/React.createElement("svg", {
      className: "absolute inset-0 w-full h-full pointer-events-none"
    }, /*#__PURE__*/React.createElement("rect", {
      width: "100%",
      height: "100%",
      fill: "url(#rainbowGrad)"
    })))));
  }), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto shrink-0 flex items-center pl-2 gap-2"
  }, engineRef.current === 'peerjs' && !isBrawlMode && /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-1.5 cursor-pointer text-[10px] md:text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-1.5 py-1 rounded border-2 border-slate-300 shadow-[1px_1px_0px_rgba(30,41,59,1)] whitespace-nowrap"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: showOtherCursors,
    onChange: function onChange(e) {
      return setShowOtherCursors(e.target.checked);
    },
    className: "w-3 h-3 accent-emerald-500"
  }), "\u986F\u793A\u6E38\u6A19"), isMultiplayer && isBrawlMode && /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-1.5 cursor-pointer text-[10px] md:text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-1.5 py-1 rounded border-2 border-slate-300 shadow-[1px_1px_0px_rgba(30,41,59,1)] whitespace-nowrap"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: showGhostProgress,
    onChange: function onChange(e) {
      return setShowGhostProgress(e.target.checked);
    },
    className: "w-3 h-3 accent-purple-500"
  }), "\u986F\u793A\u5C0D\u624B\u8272\u584A"))), !isHeaderCollapsed && /*#__PURE__*/React.createElement("div", {
    className: "h-6 md:h-8 shrink-0 flex items-center justify-center bg-slate-800 text-white border-b-4 border-slate-800 relative z-30 font-bold tracking-wide"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] md:text-sm hidden md:inline"
  }, "\u652F\u63F4\u6ED1\u9F20\u62D6\u66F3\u3001\u6EFE\u8F2A\u7E2E\u653E\uFF1B\u4E0B\u65B9\u5DE5\u5177\u5217\u53EF\u5207\u63DB\u6A21\u5F0F\u8207\u7E2E\u653E\u3002", ' (v' + (window.PLAT_VERSION || '3.13.4') + ')'), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] md:text-sm md:hidden"
  }, "\u9EDE\u9078\u4E0A\u65B9\u6578\u5B57\u518D\u9EDE\u64CA\u65B9\u683C\u3002\u652F\u63F4\u96D9\u6307\u7E2E\u653E\u8207\u5E73\u79FB\u3002")), /*#__PURE__*/React.createElement("div", {
    className: "relative z-0 flex-1 flex flex-col min-h-0 bg-[#fffaf0]"
  }, isGenerating && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 z-[40] flex flex-col items-center justify-center pointer-events-none bg-[#fffaf0]/80 backdrop-blur-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-slate-800 font-black text-2xl md:text-4xl tracking-widest flex items-center select-none animate-pulse mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative inline-flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("span", null, "\u984C\u76EE\u751F\u6210\u4E2D"), /*#__PURE__*/React.createElement("span", {
    className: "absolute left-full animate-loading-dots w-[1.5em] text-left"
  }))), genProgress && /*#__PURE__*/React.createElement("div", {
    className: "text-slate-600 font-bold text-sm md:text-base animate-fadeIn whitespace-pre-line text-center"
  }, genProgress), /*#__PURE__*/React.createElement("div", {
    className: "text-emerald-600 font-bold text-xs mt-2 opacity-80"
  }, "*\u56B4\u683C\u552F\u4E00\u89E3\u904B\u7B97\u8F03\u8017\u6642\uFF0C\u8ACB\u7A0D\u5019*")), !isSpectator && /*#__PURE__*/React.createElement("div", {
    className: "flex flex-nowrap gap-0.5 sm:gap-1 md:gap-2 justify-center w-full px-1 sm:px-2 py-2 md:py-3 bg-[#f8fafc] border-b-[3px] border-slate-800 shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.05)] z-20 select-none",
    style: {
      perspective: '1000px'
    }
  }, keyMapping.map(function (c, idx) {
    var isCompleted = completedChars.has(c);
    var isFlipping = flippedKeys.includes(idx);
    return /*#__PURE__*/React.createElement("button", {
      key: "keybtn-".concat(idx),
      onPointerDown: function onPointerDown(e) {
        var trk = platTapNew({
          slop: 22
        });
        trk.down(e.clientX, e.clientY, Date.now());
        padTapRef.current = {
          c: c,
          trk: trk
        };
      },
      onPointerUp: function onPointerUp(e) {
        var pt2 = padTapRef.current;
        padTapRef.current = null;
        if (pt2) {
          var r = pt2.trk.up(e.clientX, e.clientY, Date.now());
          supTrk().markSuppress(Date.now());
          if (pt2.c === c && r.type === 'tap') onNumClick({
            preventDefault: function preventDefault() {}
          }, c);
        }
      },
      onPointerCancel: function onPointerCancel() {
        var pt2 = padTapRef.current;
        padTapRef.current = null;
        if (pt2) pt2.trk.cancel();
      },
      onClick: function onClick(e) {
        if (supTrk().shouldSuppressClick(Date.now())) return;
        onNumClick(e, c);
      },
      title: isCompleted ? "\u5DF2\u7D93\u586B\u6EFF ".concat(c) : "\u9EDE\u64CA\u9078\u53D6 ".concat(c),
      className: "select-none flex-1 min-w-[24px] max-w-[48px] aspect-square rounded-md sm:rounded-lg md:rounded-xl text-sm sm:text-lg md:text-2xl font-black border-2 md:border-[3px] border-slate-800 flex items-center justify-center p-0 key-btn\n                       ".concat(isFlipping ? 'anim-key-flip' : '', "\n                       ").concat(isCompleted ? 'bg-slate-300 text-slate-500 opacity-60 cursor-pointer shadow-none' : selectedChar === c ? 'bg-[#ffcc00] text-slate-900 scale-110 shadow-[2px_2px_0px_rgba(30,41,59,1)] sm:shadow-[4px_4px_0px_rgba(30,41,59,1)] hover:scale-110' : 'bg-white text-slate-700 hover:bg-slate-50 shadow-[1px_1px_0px_rgba(30,41,59,1)] sm:shadow-[2px_2px_0px_rgba(30,41,59,1)]', "\n                       ").concat(!isCompleted && !isFlipping ? 'active:translate-y-1 active:shadow-none' : '')
    }, c);
  })), /*#__PURE__*/React.createElement("div", {
    ref: zoomContainerRef,
    className: "px-2 pt-2 pb-28 md:px-6 md:pt-6 md:pb-24 flex-1 overflow-auto custom-scrollbar plat-chat-clear relative z-0 flex flex-col"
  }, isSpectator || isBrawlMode && winner && finishViewMode === 'god' ? isBrawlMode ? renderHostGodView() : /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex flex-col items-center justify-center min-h-[400px]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border-4 border-slate-800 rounded-xl p-6 md:p-10 shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full max-w-2xl text-center"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl md:text-4xl font-black text-slate-800 mb-2 tracking-widest"
  }, "\uD83D\uDCE1 \u8CFD\u6CC1\u8F49\u64AD\u4E2D"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500 font-bold mb-8"
  }, "\u60A8\u4EE5\u89C0\u6230\u8005\u8EAB\u5206\u52A0\u5165\uFF0C\u8ACB\u70BA\u5834\u4E0A\u73A9\u5BB6\u52A0\u6CB9\uFF01"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-5 text-left"
  }, playersList.filter(function (p) {
    return !p.isSpectator;
  }).map(function (p) {
    var pct = ghostProgress[p.id] || 0;
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      className: "flex flex-col gap-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between font-black text-slate-700 items-center"
    }, /*#__PURE__*/React.createElement("span", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-4 h-4 rounded-full border-2 border-slate-800",
      style: {
        backgroundColor: p.color === 'rainbow' ? '#ffcc00' : p.color
      }
    }), p.name, " ", p.isHost && '👑'), /*#__PURE__*/React.createElement("span", {
      className: "text-emerald-600 font-mono text-lg"
    }, /*#__PURE__*/React.createElement(PlatPct, {
      value: pct
    }))), /*#__PURE__*/React.createElement("div", {
      className: "w-full h-5 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-800 shadow-inner"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full plat-pbar",
      style: {
        width: "".concat(pct, "%"),
        backgroundColor: p.color === 'rainbow' ? '#ffcc00' : p.color
      }
    })));
  }), playersList.filter(function (p) {
    return !p.isSpectator;
  }).length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-center text-slate-400 font-bold py-4"
  }, "\u76EE\u524D\u5834\u4E0A\u6C92\u6709\u6BD4\u8CFD\u73A9\u5BB6")))) : /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center items-center min-w-max min-h-max m-auto pb-32 pr-20",
    style: countdownValue !== null ? {
      filter: 'blur(18px)',
      pointerEvents: 'none'
    } : {
      transition: 'filter 0.3s'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    ref: svgRef,
    onPointerMove: handlePointerMove,
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerLeave: function onPointerLeave(e) {
      handlePointerUp(e);
      if (eraserRef.current) eraserRef.current.style.display = 'none';
    },
    onPointerCancel: handlePointerUp,
    viewBox: "0 0 ".concat(svgW, " ").concat(svgH),
    className: "bg-transparent transition-transform duration-100 ease-out origin-center select-none",
    style: {
      width: "".concat(svgW * zoomLevel, "px"),
      height: "".concat(svgH * zoomLevel, "px"),
      touchAction: interactionMode >= 2 ? 'none' : 'manipulation'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "rainbowGrad",
    gradientUnits: "userSpaceOnUse",
    x1: "0",
    y1: "0",
    x2: svgW,
    y2: svgH
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    className: "rainbow-stop"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    className: "rainbow-stop"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "fogGrad",
    cx: "50%",
    cy: "45%",
    r: "60%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#a855f7",
    stopOpacity: "0.95"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "40%",
    stopColor: "#7c3aed",
    stopOpacity: "0.90"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "80%",
    stopColor: "#db2777",
    stopOpacity: "0.85"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#1e1b4b",
    stopOpacity: "0.75"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "frostGrad",
    cx: "50%",
    cy: "45%",
    r: "65%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#e0f2fe",
    stopOpacity: "0.97"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "55%",
    stopColor: "#7dd3fc",
    stopOpacity: "0.95"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#0284c7",
    stopOpacity: "0.92"
  }))), /*#__PURE__*/React.createElement("g", {
    transform: "translate(".concat(PADDING, ", ").concat(PADDING, ")")
  }, activeCells.map(function (cell) {
    var hasConflict = conflictCellIds.has(cell.id);
    var yellowAllowed = stateRef.current.brawlSettings.allowYellowHint;
    var isExactMatch = selectedChar !== null && cell.value === selectedChar && interactionMode < 2;
    var isHighlightZone = yellowAllowed && highlightZones.has(cell.id);
    var isFilledWithOther = yellowAllowed && selectedChar !== null && cell.value !== null && cell.value !== selectedChar && interactionMode < 2;
    var fillColor = '#ffffff';
    if (hasConflict) fillColor = '#fee2e2';else if (inputMode === 'cell' && selectedCellId === cell.id) fillColor = '#bae6fd';else if (isExactMatch) fillColor = '#fde047';else if (isHighlightZone || isFilledWithOther) fillColor = '#fef8cb';else if (isSpectator && cell.isGiven) fillColor = '#f1f5f9'; // 上帝視角下的題目背景：淺灰色 (v3.10.12)

    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: "bg-".concat(cell.id)
    }, /*#__PURE__*/React.createElement("rect", {
      x: cell.x * CELL_SIZE,
      y: cell.y * CELL_SIZE,
      width: CELL_SIZE,
      height: CELL_SIZE,
      fill: fillColor,
      className: "transition-colors duration-300 pointer-events-none"
    }), pressedCellId === cell.id && /*#__PURE__*/React.createElement("rect", {
      x: cell.x * CELL_SIZE + 1,
      y: cell.y * CELL_SIZE + 1,
      width: CELL_SIZE - 2,
      height: CELL_SIZE - 2,
      fill: "#0f172a",
      rx: "3",
      className: "sudoku-pressfx pointer-events-none"
    }));
  })), strokes.map(function (s) {
    var strokeUid = s.uid || s.id.split('-')[1];
    var isOwnStroke = strokeUid === myId;
    var strokeColor = s.color;
    var strokeOpacity = 1;
    var isRainbow = false;
    if (strokeUid) {
      strokeColor = getPlayerColor(strokeUid);
      if (strokeColor === 'rainbow') isRainbow = true;
      strokeOpacity = isMultiplayer && !isOwnStroke ? 0.5 : 1;
    }
    return /*#__PURE__*/React.createElement("path", {
      key: s.id,
      d: s.path,
      fill: "none",
      stroke: isRainbow ? undefined : strokeColor,
      strokeOpacity: strokeOpacity,
      strokeWidth: "8",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: "doodle-stroke ".concat(isRainbow ? 'rainbow-stroke' : ''),
      "data-stroke-id": s.id,
      style: {
        pointerEvents: interactionMode === 2 && drawSubMode === 'eraser' && isOwnStroke ? 'stroke' : 'none'
      }
    });
  }), /*#__PURE__*/React.createElement("path", {
    ref: drawingPathRef,
    fill: "none",
    stroke: myCurrentColor === 'rainbow' ? undefined : myCurrentColor,
    strokeOpacity: 1,
    strokeWidth: "8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "pointer-events-none ".concat(myCurrentColor === 'rainbow' ? 'rainbow-stroke' : ''),
    style: {
      display: 'none'
    }
  }), /*#__PURE__*/React.createElement("g", {
    transform: "translate(".concat(PADDING, ", ").concat(PADDING, ")")
  }, Array.from({
    length: cSizeDef.size + 1
  }).map(function (_, i) {
    var isThickX = i % cSizeDef.boxW === 0;
    var isThickY = i % cSizeDef.boxH === 0;
    return /*#__PURE__*/React.createElement("g", {
      key: "grid-line-".concat(i),
      className: "pointer-events-none"
    }, /*#__PURE__*/React.createElement("line", {
      x1: i * CELL_SIZE,
      y1: 0,
      x2: i * CELL_SIZE,
      y2: cSizeDef.size * CELL_SIZE,
      stroke: "#1e293b",
      strokeWidth: isThickX ? 4 : 1,
      strokeLinecap: isThickX ? 'square' : 'butt'
    }), /*#__PURE__*/React.createElement("line", {
      x1: 0,
      y1: i * CELL_SIZE,
      x2: cSizeDef.size * CELL_SIZE,
      y2: i * CELL_SIZE,
      stroke: "#1e293b",
      strokeWidth: isThickY ? 4 : 1,
      strokeLinecap: isThickY ? 'square' : 'butt'
    }));
  }), activeCells.map(function (cell) {
    var cx = cell.x * CELL_SIZE;
    var cy = cell.y * CELL_SIZE;
    var valColor = "#1e293b";
    var isRainbow = false;
    if (!cell.isGiven && cell.value && cell.owner) {
      valColor = getPlayerColor(cell.owner);
      if (valColor === 'rainbow') isRainbow = true;
    }
    if (cell.isSystemRevealed) {
      valColor = "#1e293b";
      isRainbow = false;
    }
    return /*#__PURE__*/React.createElement("g", {
      key: "cell-".concat(cell.id),
      id: "cell-".concat(cell.id),
      onClick: function onClick() {
        if (supTrk().shouldSuppressClick(Date.now())) return;
        handleCellClick(cell.id);
      },
      className: interactionMode >= 2 ? 'pointer-events-none' : 'cursor-pointer group'
    }, /*#__PURE__*/React.createElement("rect", {
      x: cx,
      y: cy,
      width: CELL_SIZE,
      height: CELL_SIZE,
      fill: "transparent",
      className: interactionMode >= 2 ? '' : 'hover:fill-yellow-600/20 transition-colors'
    }), erasingCells[cell.id] && /*#__PURE__*/React.createElement("g", {
      className: "pointer-events-none select-none",
      style: {
        animation: 'eraseFade 0.5s ease-in forwards'
      }
    }, /*#__PURE__*/React.createElement("text", {
      x: cx + CELL_SIZE / 2,
      y: cy + CELL_SIZE / 2 + 2,
      textAnchor: "middle",
      dominantBaseline: "central",
      fontSize: CELL_SIZE * 0.6,
      fontWeight: "bold",
      fill: isRainbow ? undefined : valColor,
      className: isRainbow ? 'rainbow-fill' : ''
    }, erasingCells[cell.id].value), /*#__PURE__*/React.createElement("text", {
      x: cx + CELL_SIZE / 2 + 10,
      y: cy + CELL_SIZE / 2 - 10,
      textAnchor: "middle",
      dominantBaseline: "central",
      fontSize: CELL_SIZE * 0.4
    }, "\uD83E\uDDF9")), function () {
      // 上帝視角視覺分層 (v3.10.12)
      if (isSpectator) {
        if (cell.isGiven) {
          var _stateRef$current$lev;
          var originalCell = (_stateRef$current$lev = stateRef.current.levelData) === null || _stateRef$current$lev === void 0 || (_stateRef$current$lev = _stateRef$current$lev.cells) === null || _stateRef$current$lev === void 0 ? void 0 : _stateRef$current$lev.find(function (c) {
            return c.id === cell.id;
          });
          return /*#__PURE__*/React.createElement("text", {
            x: cx + CELL_SIZE / 2,
            y: cy + CELL_SIZE / 2 + 2,
            textAnchor: "middle",
            dominantBaseline: "central",
            fontSize: CELL_SIZE * 0.6,
            fontWeight: "900",
            fill: "#1e293b",
            className: "pointer-events-none select-none opacity-40"
          }, (originalCell === null || originalCell === void 0 ? void 0 : originalCell.value) || cell.value);
        }
        // 如果是上帝且不是題目，但「上帝視角顯示數字」關閉，則不顯示數字 (即便 cell.value 有值)
        if (!brawlSettings.showNumbersInGodMode) {
          return null;
        }
      }
      if (cell.value) {
        return /*#__PURE__*/React.createElement("text", {
          x: cx + CELL_SIZE / 2,
          y: cy + CELL_SIZE / 2 + 2,
          textAnchor: "middle",
          dominantBaseline: "central",
          fontSize: CELL_SIZE * 0.6,
          fontWeight: cell.isGiven || cell.isSystemRevealed ? "900" : "bold",
          fill: isRainbow ? undefined : valColor,
          className: "pointer-events-none select-none ".concat(isRainbow ? 'rainbow-fill' : '')
        }, cell.value);
      }
      return cell.drafts.map(function (d) {
        var idx = cSizeDef.chars.indexOf(d);
        var dx, dy, fontSize;
        if (cSizeDef.size === 4) {
          dx = idx % 2 * (CELL_SIZE / 2) + CELL_SIZE / 4;
          dy = Math.floor(idx / 2) * (CELL_SIZE / 2) + CELL_SIZE / 4;
          fontSize = CELL_SIZE * 0.3;
        } else if (cSizeDef.size === 9) {
          dx = idx % 3 * (CELL_SIZE / 3) + CELL_SIZE / 6;
          dy = Math.floor(idx / 3) * (CELL_SIZE / 3) + CELL_SIZE / 6;
          fontSize = CELL_SIZE * 0.25;
        } else {
          dx = idx % 4 * (CELL_SIZE / 4) + CELL_SIZE / 8;
          dy = Math.floor(idx / 4) * (CELL_SIZE / 4) + CELL_SIZE / 8;
          fontSize = CELL_SIZE * 0.18;
        }
        var isDraftSelected = d === selectedChar;
        return /*#__PURE__*/React.createElement("g", {
          key: "draft-".concat(d),
          className: "pointer-events-none"
        }, /*#__PURE__*/React.createElement("text", {
          x: cx + dx,
          y: cy + dy + 1,
          textAnchor: "middle",
          dominantBaseline: "central",
          fontSize: isDraftSelected ? fontSize * 1.2 : fontSize,
          fontWeight: isDraftSelected ? "900" : "bold",
          fill: isDraftSelected ? "#facc15" : "#64748b",
          stroke: isDraftSelected ? "#1e293b" : "none",
          strokeWidth: isDraftSelected ? 2 : 0,
          strokeLinejoin: "round",
          paintOrder: "stroke",
          className: "select-none transition-all duration-200"
        }, d));
      });
    }());
  })), /*#__PURE__*/React.createElement("g", {
    transform: "translate(".concat(PADDING, ", ").concat(PADDING, ")")
  }, isBrawlMode && showGhostProgress && activeCells.map(function (cell) {
    var ghostInfo = ghostHints[cell.id];
    if (!ghostInfo || cell.isGiven || cell.isSystemRevealed) return null;
    return Object.entries(ghostInfo).map(function (_ref10, idx) {
      var _ref11 = _slicedToArray(_ref10, 2),
        uid = _ref11[0],
        hint = _ref11[1];
      if (uid === myId) return null; // 不顯示自己的

      // 只有一位填答者時，且是上帝模式，畫出「大方塊」覆蓋格子背景
      var isOnlyOneHint = Object.keys(ghostInfo).length === 1;
      var sqSize = isSpectator && isOnlyOneHint ? CELL_SIZE - 4 : 10;
      var col = idx % 5;
      var row = Math.floor(idx / 5);
      var offsetX = isSpectator && isOnlyOneHint ? 2 : col * (sqSize + 2);
      var offsetY = isSpectator && isOnlyOneHint ? 2 : row * (sqSize + 2);
      var playerColor = (_typeof(hint) === 'object' ? hint.color : hint) || getPlayerColor(uid);
      return /*#__PURE__*/React.createElement("rect", {
        key: "ghost-".concat(cell.id, "-").concat(uid),
        x: cell.x * CELL_SIZE + (isSpectator && isOnlyOneHint ? 2 : CELL_SIZE - sqSize - 2 - offsetX),
        y: cell.y * CELL_SIZE + (isSpectator && isOnlyOneHint ? 2 : 2 + offsetY),
        width: sqSize,
        height: sqSize,
        fill: playerColor === 'rainbow' ? 'url(#rainbowGrad)' : playerColor,
        opacity: isSpectator && isOnlyOneHint ? "0.85" : "0.95",
        rx: isSpectator && isOnlyOneHint ? "8" : "2",
        className: "pointer-events-none ghost-highlight",
        stroke: "rgba(255,255,255,0.7)",
        strokeWidth: "1"
      });
    });
  })), /*#__PURE__*/React.createElement("circle", {
    ref: eraserRef,
    r: "15",
    fill: myCurrentColor === 'rainbow' ? undefined : myCurrentColor,
    fillOpacity: "0.4",
    stroke: myCurrentColor === 'rainbow' ? undefined : myCurrentColor,
    strokeWidth: "2",
    className: "pointer-events-none ".concat(myCurrentColor === 'rainbow' ? 'rainbow-stroke rainbow-fill' : ''),
    style: {
      display: 'none'
    }
  }), !isBrawlMode && Object.entries(cursors).map(function (entry) {
    var uid = entry[0];
    var pos = entry[1];
    if (uid === myId) return null;
    var player = playersList.find(function (p) {
      return p.id === uid;
    });
    if (!player) return null;
    var isRainbow = player.color === 'rainbow';
    return /*#__PURE__*/React.createElement("g", {
      key: "cursor-".concat(uid),
      transform: "translate(".concat(pos.x, ", ").concat(pos.y, ")"),
      className: "pointer-events-none transition-transform duration-75 ease-linear"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M0,0 L16,6 L10,10 L15,19 L11,21 L6,12 L0,18 Z",
      fill: isRainbow ? undefined : player.color,
      stroke: "white",
      strokeWidth: "2",
      className: isRainbow ? 'rainbow-fill' : ''
    }), /*#__PURE__*/React.createElement("rect", {
      x: "14",
      y: "22",
      rx: "4",
      ry: "4",
      width: player.name.length * 14 + 12,
      height: "22",
      fill: "rgba(0,0,0,0.6)"
    }), /*#__PURE__*/React.createElement("text", {
      x: "20",
      y: "37",
      fill: "white",
      fontSize: "13",
      fontWeight: "bold"
    }, player.name));
  }), !isBrawlMode && ripples.map(function (r) {
    var player = playersList.find(function (p) {
      return p.id === r.uid;
    });
    var color = player ? player.color : '#3b82f6';
    var isRainbow = color === 'rainbow';
    return /*#__PURE__*/React.createElement("circle", {
      key: r.id,
      cx: r.x,
      cy: r.y,
      r: "20",
      fill: "none",
      stroke: isRainbow ? undefined : color,
      className: "pointer-events-none ".concat(isRainbow ? 'rainbow-stroke' : ''),
      style: {
        transformOrigin: "".concat(r.x, "px ").concat(r.y, "px"),
        animation: 'rippleAnim 0.8s ease-out forwards'
      }
    });
  }), /*#__PURE__*/React.createElement("g", {
    transform: "translate(".concat(PADDING, ", ").concat(PADDING, ")")
  }, isBrawlMode && Object.entries(foggedBoxes).map(function (_ref12) {
    var _ref13 = _slicedToArray(_ref12, 2),
      boxIdStr = _ref13[0],
      expiry = _ref13[1];
    var boxId = parseInt(boxIdStr);
    var boxRow = Math.floor(boxId / (cSizeDef.size / cSizeDef.boxH));
    var boxCol = boxId % (cSizeDef.size / cSizeDef.boxW);
    var bx = boxCol * cSizeDef.boxW * CELL_SIZE;
    var by = boxRow * cSizeDef.boxH * CELL_SIZE;
    var bw = cSizeDef.boxW * CELL_SIZE;
    var bh = cSizeDef.boxH * CELL_SIZE;
    return /*#__PURE__*/React.createElement("g", {
      key: "fog-".concat(boxId),
      style: {
        animation: 'fogFade 10s ease-in-out forwards',
        pointerEvents: 'none'
      }
    }, /*#__PURE__*/React.createElement("rect", {
      x: bx,
      y: by,
      width: bw,
      height: bh,
      fill: "url(#frostGrad)",
      stroke: "#38bdf8",
      strokeWidth: "2.5"
    }), /*#__PURE__*/React.createElement("text", {
      x: bx + bw / 2,
      y: by + bh / 2,
      textAnchor: "middle",
      dominantBaseline: "middle",
      fontSize: "".concat(Math.min(bw, bh) * 0.62, "px"),
      className: "pointer-events-none",
      style: {
        userSelect: 'none',
        pointerEvents: 'none'
      }
    }, "\u2744\uFE0F"));
  }))))), (isWon || isBrawlMode && winner) && !hideVictoryModal && !(isBrawlMode && typeof window !== 'undefined' && window.PlatResults) && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] pointer-events-auto ".concat(isClosingModal ? 'animate-fadeOut' : 'animate-fadeIn')
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-6 md:p-8 border-[4px] border-[#1e293b] shadow-[10px_10px_0px_#1e293b] text-center min-w-[280px] md:min-w-[320px] relative ".concat(isClosingModal ? 'animate-popOutCenter' : 'animate-popUpCenter')
  }, /*#__PURE__*/React.createElement("button", {
    onClick: closeVictoryModal,
    className: "absolute top-2 right-4 text-slate-400 hover:text-[#1e293b] text-2xl font-black"
  }, "\u2715"), isBrawlMode ? /*#__PURE__*/React.createElement("div", {
    className: "w-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-5xl mb-2"
  }, "\u2694\uFE0F\uD83C\uDFC6"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl font-black text-purple-700 mb-3 uppercase tracking-wide"
  }, "\u5927\u4E82\u9B25\u7D50\u679C\uFF01"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2 mb-5 text-left max-h-[240px] overflow-y-auto pr-1 custom-scrollbar"
  }, brawlWinners.map(function (w, i) {
    var medals = ['🥇', '🥈', '🥉'];
    var medal = medals[i] || "".concat(i + 1);
    return /*#__PURE__*/React.createElement("div", {
      key: w.id,
      className: "flex items-center gap-3 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 shadow-sm animate-fadeIn"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-2xl w-8 shrink-0 text-center"
    }, medal), /*#__PURE__*/React.createElement("span", {
      className: "w-3 h-full shrink-0 rounded-full self-stretch",
      style: {
        backgroundColor: w.color === 'rainbow' ? 'transparent' : w.color,
        minWidth: '4px',
        maxWidth: '4px',
        background: w.color === 'rainbow' ? 'linear-gradient(to bottom, red, orange, yellow, green, blue, indigo, violet)' : w.color
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "font-black text-slate-800 flex-1 truncate"
    }, w.name), /*#__PURE__*/React.createElement("span", {
      className: "font-mono text-blue-600 text-sm shrink-0"
    }, "\u23F1 ", w.time));
  }), function () {
    var limit = brawlSettings.winnersCount || 1;
    var placeholders = [];
    for (var i = brawlWinners.length; i < limit; i++) {
      var medals = ['🥇', '🥈', '🥉'];
      var medal = medals[i] || "".concat(i + 1);
      placeholders.push( /*#__PURE__*/React.createElement("div", {
        key: "wait-".concat(i),
        className: "flex items-center gap-3 bg-slate-100/50 border-2 border-slate-100 border-dashed rounded-xl px-3 py-2 opacity-50"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-2xl w-8 shrink-0 text-center filter grayscale"
      }, medal), /*#__PURE__*/React.createElement("span", {
        className: "w-1 h-full shrink-0 bg-slate-300 rounded-full self-stretch"
      }), /*#__PURE__*/React.createElement("span", {
        className: "font-semibold text-slate-400 flex-1 italic text-sm"
      }, "\u7B49\u5F85\u7B2C ", i + 1, " \u540D\u5B8C\u6210...")));
    }
    return placeholders;
  }(), brawlWinners.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-slate-400 text-center font-bold py-4"
  }, "\u5C1A\u7121\u5B8C\u6210\u8005")), /*#__PURE__*/React.createElement("div", {
    className: "border-t-2 border-dashed border-slate-200 pt-3 mb-2"
  })) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-6xl mb-3"
  }, "\uD83D\uDCA5\uD83C\uDFC6"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl font-black text-[#1e293b] mb-1 uppercase tracking-wide"
  }, "\u5B8C\u7F8E\u901A\u95DC\uFF01"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-600 mb-6 text-sm font-bold border-b-2 border-dashed border-slate-300 pb-4"
  }, "\u5B8C\u6210\u6642\u9593\uFF1A", endTime ? formatTime(Math.floor((endTime - startTime) / 1000)) : "00:00")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center gap-3 flex-wrap w-full mt-4"
  }, !isMultiplayer ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: handlePlayAgain,
    className: "flex-1 px-3 py-3 bg-[#ffcc00] text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] hover:shadow-none transition-all text-sm sm:text-base"
  }, "\u4E0B\u4E00\u984C (\u540C\u8A2D\u5B9A)"), /*#__PURE__*/React.createElement("button", {
    onClick: handleGoHome,
    className: "flex-1 px-3 py-3 bg-white text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] hover:shadow-none transition-all text-sm sm:text-base"
  }, "\u8FD4\u56DE\u4E3B\u9078\u55AE")) : /*#__PURE__*/React.createElement(React.Fragment, null, matchPhase === 'finished' ? isHostRef.current || stateRef.current.brawlSettings.allowOthersToPlayAgain !== false ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: handlePlayAgain,
    className: "flex-1 px-3 py-3 bg-[#ffcc00] text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] hover:shadow-none transition-all text-sm sm:text-base"
  }, "\u518D\u4F86\u4E00\u5C40 (\u540C\u8A2D\u5B9A)"), /*#__PURE__*/React.createElement("button", {
    onClick: handleBackToLobby,
    className: "flex-1 px-3 py-3 bg-white text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] hover:shadow-none transition-all text-sm sm:text-base"
  }, "\u8FD4\u56DE\u5927\u5EF3")) : /*#__PURE__*/React.createElement("span", {
    className: "font-black text-slate-500 bg-slate-100 px-4 py-2 rounded-xl border-2 border-slate-300 w-full text-center"
  }, "\u23F3 \u7B49\u5F85\u623F\u4E3B\u6C7A\u5B9A\u4E0B\u4E00\u5C40...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setHideVictoryModal(true);
      setFinishViewMode('god');
      toggleSpectator(myId, true, true);
      showToast("👁️ 已轉變為上帝模式，您可以繼續觀看其他玩家比賽");
    },
    className: "flex-1 px-3 py-3 bg-purple-100 text-purple-700 border-[4px] border-purple-700 font-black rounded-xl shadow-[4px_4px_0px_#6d28d9] hover:translate-y-[2px] hover:shadow-none transition-all text-sm sm:text-base"
  }, "\uD83D\uDC41\uFE0F \u8F49\u8B8A\u70BA\u4E0A\u5E1D\u6A21\u5F0F (\u89C0\u6230)"), /*#__PURE__*/React.createElement("div", {
    className: "w-full text-xs font-semibold text-slate-400 mt-2 animate-pulse"
  }, "\u6BD4\u8CFD\u5C1A\u672A\u7D50\u675F\uFF0C\u60A8\u53EF\u4EE5\u5148\u8F49\u70BA\u89C0\u6230\u6A21\u5F0F...")))))), (isWon || isBrawlMode && winner) && hideVictoryModal && /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-20 inset-x-0 flex flex-col items-center gap-3 z-50 pointer-events-none"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pointer-events-auto bg-white/90 backdrop-blur-sm border-2 border-slate-800 p-1 rounded-xl shadow-lg flex gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setFinishViewMode('my');
      toggleSpectator(myId, true, false);
    },
    className: "px-3 py-1.5 rounded-lg font-black text-xs transition-all ".concat(finishViewMode === 'my' ? 'bg-blue-500 text-white shadow-inner' : 'text-slate-500 hover:bg-slate-100')
  }, "\uD83D\uDC64 \u6211\u7684\u7248\u9762"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setFinishViewMode('god');
      toggleSpectator(myId, true, true);
    },
    className: "px-3 py-1.5 rounded-lg font-black text-xs transition-all ".concat(finishViewMode === 'god' ? 'bg-purple-500 text-white shadow-inner' : 'text-slate-500 hover:bg-slate-100')
  }, "\uD83D\uDC41\uFE0F \u4E0A\u5E1D\u8996\u89D2")), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setHideVictoryModal(false);
    },
    className: "pointer-events-auto bg-[#ffcc00] text-[#1e293b] border-[4px] border-[#1e293b] px-6 py-3 rounded-full shadow-[6px_6px_0px_#1e293b] hover:translate-y-[2px] transition-all font-black flex items-center gap-2 tracking-wide text-lg"
  }, "\uD83C\uDFC6 \u986F\u793A\u6210\u7E3E")))), flares.length > 0 && /*#__PURE__*/React.createElement("svg", {
    className: "fixed inset-0 pointer-events-none z-[120]",
    style: {
      width: '100vw',
      height: '100vh'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("filter", {
    id: "flareGlow"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    stdDeviation: "3",
    result: "blur"
  }), /*#__PURE__*/React.createElement("feMerge", null, /*#__PURE__*/React.createElement("feMergeNode", {
    "in": "blur"
  }), /*#__PURE__*/React.createElement("feMergeNode", {
    "in": "SourceGraphic"
  })))), flares.map(function (f) {
    var cpX = (f.startX + f.endX) / 2;
    var cpY = Math.min(f.startY, f.endY) - 200;
    var pathD = "M ".concat(f.startX, " ").concat(f.startY, " Q ").concat(cpX, " ").concat(cpY, " ").concat(f.endX, " ").concat(f.endY);
    return /*#__PURE__*/React.createElement("g", {
      key: f.id
    }, /*#__PURE__*/React.createElement("path", {
      d: pathD,
      fill: "none",
      stroke: "#fcd34d",
      strokeWidth: "2",
      strokeDasharray: "5,5",
      opacity: "0.4"
    }), /*#__PURE__*/React.createElement("circle", {
      r: "12",
      fill: "#fff",
      filter: "url(#flareGlow)"
    }, /*#__PURE__*/React.createElement("animateMotion", {
      path: pathD,
      dur: "0.6s",
      fill: "freeze",
      calcMode: "spline",
      keyTimes: "0;1",
      keySplines: "0.4 0 0.2 1"
    }), /*#__PURE__*/React.createElement("animate", {
      attributeName: "opacity",
      values: "1;0",
      begin: "0.5s",
      dur: "0.1s",
      fill: "freeze"
    }), /*#__PURE__*/React.createElement("animate", {
      attributeName: "r",
      values: "8;16;0",
      keyTimes: "0;0.8;1",
      dur: "0.6s",
      fill: "freeze"
    })));
  })), colorPickerTarget && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm pointer-events-auto animate-fadeIn",
    onClick: function onClick(e) {
      e.stopPropagation();
      setColorPickerTarget(null);
      setColorSeq([]);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#fffdfa] border-[3px] border-slate-800 rounded-xl p-4 shadow-[10px_10px_0px_rgba(30,41,59,1)] animate-popUpCenter max-w-[280px] w-full mx-4",
    onClick: function onClick(e) {
      return e.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-3 border-b-2 border-slate-800 pb-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-slate-800"
  }, "\u2699\uFE0F \u500B\u4EBA\u8A2D\u5B9A"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      setColorPickerTarget(null);
      setColorSeq([]);
    },
    className: "text-slate-400 hover:text-slate-800 font-black text-lg leading-none"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "mb-4"
  }, /*#__PURE__*/React.createElement("label", {
    className: "block text-[10px] md:text-xs font-bold text-slate-600 mb-1"
  }, "\u4FEE\u6539\u66B1\u7A31\uFF1A"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editName,
    onChange: function onChange(e) {
      return setEditName(e.target.value);
    },
    placeholder: "\u8F38\u5165\u65B0\u66B1\u7A31",
    className: "w-full border-2 border-slate-800 rounded px-2 py-1 text-xs font-bold outline-none focus:ring-1 ring-[#ffcc00]"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick(e) {
      e.stopPropagation();
      var newName = editName.trim();
      if (!newName) return showToast("⚠️ 暱稱不能為空");
      if (playersList.some(function (p) {
        return p.name === newName && p.id !== colorPickerTarget;
      })) return showToast("⚠️ 此暱稱已被其他人使用");
      handlePlayerNameChange(colorPickerTarget, newName);
      setColorPickerTarget(null);
      setColorSeq([]);
    },
    className: "bg-blue-500 text-white font-bold text-[10px] md:text-xs px-3 rounded border-2 border-slate-800 hover:bg-blue-600 active:translate-y-[1px] whitespace-nowrap"
  }, "\u5132\u5B58"))), /*#__PURE__*/React.createElement("label", {
    className: "block text-[10px] md:text-xs font-bold text-slate-600 mb-1"
  }, "\u4FEE\u6539\u4EE3\u8868\u8272\uFF1A"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-5 gap-2"
  }, COLORS.map(function (color) {
    return /*#__PURE__*/React.createElement("button", {
      key: color,
      onClick: function onClick(e) {
        e.stopPropagation();
        var colorIdx = COLORS.indexOf(color);
        var newSeq = [].concat(_toConsumableArray(colorSeq), [colorIdx]);
        var targetSeq = [0, 4, 15, 19];
        var isValid = true;
        for (var i = 0; i < newSeq.length; i++) {
          if (newSeq[i] !== targetSeq[i]) {
            isValid = false;
            break;
          }
        }
        if (isValid) {
          setColorSeq(newSeq);
          if (newSeq.length === 4) {
            handlePlayerColorChange(colorPickerTarget, 'rainbow');
            setColorPickerTarget(null);
            showToast("🌈 解鎖隱藏彩色漸變！");
            setColorSeq([]);
          } else handlePlayerColorChange(colorPickerTarget, color);
        } else {
          setColorSeq([]);
          handlePlayerColorChange(colorPickerTarget, color);
          setColorPickerTarget(null);
        }
      },
      className: "plat-btn-hard plat-btn-hard-2 w-8 h-8 rounded-full border-[2px] border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] hover:scale-110 active:scale-95 mx-auto",
      style: {
        backgroundColor: color
      },
      title: color
    });
  })))), showSaveModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#fffdfa] border-[4px] border-[#1e293b] rounded-2xl p-6 shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full max-w-md animate-popUpCenter"
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
    className: "plat-btn-hard plat-btn-hard-2 absolute bottom-3 right-3 bg-[#ffcc00] text-slate-900 px-3 py-1.5 rounded-lg text-sm font-black border-2 border-slate-800 hover:bg-[#e6b800] shadow-[2px_2px_0px_rgba(30,41,59,1)]"
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
  }, "\u8F09\u5165\u4EE3\u78BC")))), toastMsg && /*#__PURE__*/React.createElement("div", {
    className: "fixed top-10 left-1/2 transform -translate-x-1/2 bg-white text-slate-800 px-6 py-3 rounded-xl border-[3px] border-slate-800 font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] z-[100] animate-slideUpFade flex items-center justify-center gap-2 whitespace-pre-line text-center"
  }, toastMsg), !isSpectator && screen === 'game' && /*#__PURE__*/React.createElement("div", {
    className: "fixed bottom-0 left-0 right-0 z-[100] pb-safe"
  }, matchPhase === 'playing' && /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-row gap-4 items-center pointer-events-none"
  }, unopenedGifts[myId] && unopenedGifts[myId].length > 0 && /*#__PURE__*/React.createElement("button", {
    id: "btn-open-gift",
    onClick: handleOpenGift,
    className: "plat-btn-hard pointer-events-auto relative w-14 h-14 bg-pink-500 rounded-full border-[3px] border-slate-800 shadow-[4px_4px_0px_#1e293b] text-3xl animate-bounce flex items-center justify-center p-0"
  }, "\uD83C\uDF81 ", /*#__PURE__*/React.createElement("div", {
    className: "absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-800"
  }, /*#__PURE__*/React.createElement(PlatNum, {
    value: unopenedGifts[myId].length
  }))), isBrawlMode && myWeapons.filter(function (w) {
    return w === 'balloon';
  }).length > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return handleUseWeapon('balloon');
    },
    className: "plat-btn-hard pointer-events-auto relative w-14 h-14 bg-violet-500 rounded-full border-[3px] border-slate-800 shadow-[4px_4px_0px_#1e293b] text-3xl anim-weapon flex items-center justify-center"
  }, "\uD83D\uDCA7 ", myWeapons.filter(function (w) {
    return w === 'balloon';
  }).length > 1 && /*#__PURE__*/React.createElement("div", {
    className: "absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-900 font-black text-xs w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-800"
  }, /*#__PURE__*/React.createElement(PlatNum, {
    value: myWeapons.filter(function (w) {
      return w === 'balloon';
    }).length
  }))), isBrawlMode && myWeapons.filter(function (w) {
    return w === 'eraser';
  }).length > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return handleUseWeapon('eraser');
    },
    className: "plat-btn-hard pointer-events-auto relative w-14 h-14 bg-orange-500 rounded-full border-[3px] border-slate-800 shadow-[4px_4px_0px_#1e293b] text-3xl anim-weapon flex items-center justify-center"
  }, "\uD83E\uDDF9 ", myWeapons.filter(function (w) {
    return w === 'eraser';
  }).length > 1 && /*#__PURE__*/React.createElement("div", {
    className: "absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-900 font-black text-xs w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-800"
  }, /*#__PURE__*/React.createElement(PlatNum, {
    value: myWeapons.filter(function (w) {
      return w === 'eraser';
    }).length
  })))), typeof window.PlatBar !== 'undefined' ? /*#__PURE__*/React.createElement("div", {
    ref: platBarRef
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, ")}", /*#__PURE__*/React.createElement("div", {
    className: "bg-[#fffdfa]/95 backdrop-blur-md border-t-[4px] border-slate-800 min-h-[4rem] md:min-h-[5rem] flex flex-wrap items-center justify-between gap-y-1 py-1 px-3 md:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 md:gap-3 bg-slate-100 p-1 rounded-xl border-2 border-slate-300 relative"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setZoomOpen(!zoomOpen);
    },
    className: "plat-btn-hard plat-btn-hard-2 w-11 h-11 md:w-14 md:h-14 bg-white border-[3px] border-slate-800 rounded-lg shadow-[2px_2px_0px_#1e293b] flex items-center justify-center text-base md:text-lg font-black hover:bg-[#ffcc00]",
    title: "\u7E2E\u653E\uFF08\u9EDE\u958B/\u6536\u5408\uFF09"
  }, zoomIndicator.visible ? /*#__PURE__*/React.createElement("span", {
    className: "text-blue-600 scale-110 text-xs md:text-sm"
  }, zoomIndicator.value.toFixed(1), "X") : '🔍'), zoomOpen && /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-full mb-3 left-0 flex flex-col gap-2 bg-white border-[3px] border-slate-800 p-2 rounded-2xl shadow-[6px_6px_0px_rgba(30,41,59,0.25)] animate-popUpCenter z-50"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleZoomIn,
    className: "plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-white border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-xl font-black shadow-[2px_2px_0px_#1e293b]",
    title: "\u653E\u5927"
  }, "\uFF0B"), /*#__PURE__*/React.createElement("button", {
    onClick: handleZoomOut,
    className: "plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-white border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-xl font-black shadow-[2px_2px_0px_#1e293b]",
    title: "\u7E2E\u5C0F"
  }, "\uFF0D"), /*#__PURE__*/React.createElement("button", {
    onClick: handleCycleZoom,
    className: "plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-slate-800 border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-[2px_2px_0px_#1e293b]",
    title: "\u5FAA\u74B0\u5207\u63DB\u7E2E\u653E\u6A21\u5F0F\uFF08\u81EA\u52D5\u9069\u61C9\uFF09"
  }, zoomModeIdx === 0 ? '1X' : zoomModeIdx === 1 ? '↔️' : zoomModeIdx === 2 ? '↕️' : '🔲'))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 md:gap-2 bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner",
    title: "\u8F38\u5165\u65B9\u5F0F"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setInputMode('num');
    },
    className: "px-3 md:px-5 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-base flex items-center gap-1.5 md:gap-2 transition-all ".concat(inputMode === 'num' ? 'bg-[#ffcc00] text-slate-900 shadow-md scale-105' : 'text-slate-400 hover:text-white')
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD22"), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, "\u6578\u5B57\u5148\u884C")), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setInputMode('cell');
    },
    className: "px-3 md:px-5 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-base flex items-center gap-1.5 md:gap-2 transition-all ".concat(inputMode === 'cell' ? 'bg-sky-400 text-slate-900 shadow-md scale-105' : 'text-slate-400 hover:text-white')
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC46"), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, "\u683C\u5B50\u5148\u884C"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 md:gap-2 bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner relative"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: cycleInteractionMode,
    className: "px-3 md:px-5 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-base flex items-center gap-1.5 md:gap-2 transition-all shadow-md ".concat(interactionMode === 2 ? 'bg-emerald-400 text-slate-900' : 'bg-[#ffcc00] text-slate-900'),
    title: "\u5207\u63DB\u6A21\u5F0F\uFF08\u586B\u7B54/\u7B46\u8A18/\u5857\u9D09\uFF09"
  }, /*#__PURE__*/React.createElement("span", null, interactionMode === 0 ? '🖋️' : interactionMode === 1 ? '✏️' : '🖌️'), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, interactionMode === 0 ? '填答' : interactionMode === 1 ? '筆記' : '塗鴉'), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] opacity-60"
  }, "\u25BE")), interactionMode === 2 && modeSubOpen && /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-full mb-6 right-0 flex flex-col gap-3 bg-white border-[3px] border-slate-800 p-2.5 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,0.2)] animate-popUpCenter pointer-events-auto"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick(e) {
      e.stopPropagation();
      setDrawSubMode('pen');
    },
    className: "w-12 h-12 border-[3px] border-slate-800 rounded-xl flex items-center justify-center transition-all shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-[2px] ".concat(drawSubMode === 'pen' ? 'bg-emerald-100 scale-110 border-emerald-600' : 'bg-white hover:bg-slate-50'),
    title: "\u756B\u7B46\u6A21\u5F0F"
  }, "\uD83D\uDD8C\uFE0F"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick(e) {
      e.stopPropagation();
      setDrawSubMode('eraser');
    },
    onDoubleClick: function onDoubleClick(e) {
      e.stopPropagation();
      clearOwnStrokes();
    },
    className: "w-12 h-12 border-[3px] border-slate-800 rounded-xl flex items-center justify-center transition-all shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-[2px] ".concat(drawSubMode === 'eraser' ? 'bg-orange-100 scale-110 border-orange-600' : 'bg-white hover:bg-slate-50'),
    title: "\u6A61\u76AE\u64E6 (\u96D9\u64CA\u6E05\u9664\u81EA\u5DF1\u6240\u6709\u5857\u9D09)"
  }, "\uD83E\uDDFD"), isHostRef.current && !isBrawlMode && /*#__PURE__*/React.createElement("button", {
    onClick: function onClick(e) {
      e.stopPropagation();
      clearAllStrokes();
    },
    className: "plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-rose-50 border-[3px] border-rose-800 text-rose-800 rounded-xl flex items-center justify-center hover:bg-rose-100 shadow-[2px_2px_0px_#1e293b]",
    title: "\u623F\u4E3B\uFF1A\u6E05\u9664\u5168\u5834\u5857\u9D09"
  }, "\uD83D\uDEAE"))), renderDockCapsule(false)))));
}
var renderApp = function renderApp() {
  var root = ReactDOM.createRoot(document.getElementById('sudoku-root'));
  root.render(React.createElement(window.PlatBoundary, null, React.createElement(SudokuGame)));
};
renderApp();