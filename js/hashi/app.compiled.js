'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
      if (!hRef.current) hRef.current = window.PlatCount.mount(ref.current, { value: v, suffix: '%' });else window.PlatCount.set(hRef.current, v);
    }
  }, [v]);
  if (!window.PlatCount) return React.createElement(
    'span',
    null,
    v,
    '%'
  );
  return React.createElement('span', { ref: ref });
}

// PlatNum：小數字 Roll-lite 包裝（v1.54.0，B 批）——有殼 PlatLite 時新值 spring 彈入換字；無殼（獨立版）退純文字。寫法比照 PlatPct。
function PlatNum(props) {
  var ref = useRef(null);
  var v = String(props.value);
  useEffect(function () {
    if (window.PlatLite && ref.current) window.PlatLite(ref.current, v);
  }, [v]);
  if (!window.PlatLite) return React.createElement(
    'span',
    null,
    v
  );
  return React.createElement('span', { ref: ref });
}

// === 20 色票 ===
var COLORS = ['#E3002B', '#F35B00', '#FFC90E', '#D7157A', '#E895C0', '#007A61', '#87D300', '#C4D600', '#8DD1BF', '#616130', '#00538A', '#008CC1', '#00C1D5', '#79C8ED', '#CDBB79', '#41136A', '#935CB9', '#BCA8D1', '#7A0026', '#BC7B70'];

// === 關卡設定 ===
var LEVELS = [{ id: 1, name: "5x5 幼幼班", width: 5, height: 5, description: "最簡單的暖身關卡，試著連連看。" }, { id: 2, name: "10x10 標準", width: 10, height: 10, description: "標準難度，注意所有島嶼都要連通喔！" }, { id: 3, name: "10x20 手機直式", width: 10, height: 20, description: "適合手機滑動的長條形地圖。" }, { id: 4, name: "15x15 魔王", width: 15, height: 15, description: "極具挑戰性！找尋角落的大數字作為突破口。" }, { id: 5, name: "20x20 史詩", width: 20, height: 20, description: "超大地圖，請善用右下角的畫面縮放功能。" }, { id: 'custom', name: "⚙️ 自訂尺寸", width: 30, height: 30, description: "自訂地圖長寬，適合多人合作挑戰！" }];

// === 首次教學導覽步驟 ===
var TUTORIAL_STEPS = [{ icon: "🌉", title: "歡迎來到數橋！", body: "每個圓圈是一座「島」，上面的數字代表這座島需要幾座橋。你的任務：用橋把所有島連成一張網！" }, { icon: "👆", title: "怎麼架橋？", body: "從島嶼按住拖曳，會看到預覽線跟著手指，放開即架橋；也可以直接點擊兩座島之間的空白處：點一下架 1 座橋、點兩下架 2 座、點第三下取消。橋只能走直線或橫線，而且橋跟橋之間不能交叉喔！", demo: 'bridge' }, { icon: "✏️", title: "草稿模式", body: "遊戲下方的工具列可以切換到 ✏️ 草稿模式，先用虛線記下不確定的橋，確定後再轉成實線。", demo: 'draft' }, { icon: "🔍", title: "縮放與操作", body: "雙指開合可以縮放地圖，也可以用右下角的 ＋ － 按鈕。向下滑動畫布可以自動收合上方選單，爭取更多空間。" }, { icon: "🌐", title: "多人合作", body: "從平台主畫面進入多人連線，一人按「建立房間」拿到 4 位數代碼，朋友按「加入房間」輸入代碼就能一起解題！每個人的橋會用不同顏色顯示。" }, { icon: "🔌", title: "跟朋友連線", body: "房主建立房間拿代碼 → 把代碼傳給朋友 → 朋友輸入代碼加入 → 連線成功！", demo: 'connect' }];

var getAvailableColor = function getAvailableColor(currentPlayers) {
  var usedColors = currentPlayers.map(function (p) {
    return p.color;
  });
  var available = COLORS.filter(function (c) {
    return !usedColors.includes(c);
  });
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};

function formatTime(secs) {
  var m = String(Math.floor(secs / 60)).padStart(2, '0');
  var s = String(secs % 60).padStart(2, '0');
  return m + ":" + s;
}

// ⭐ 每局星級評分：timeSec 完成秒數、islandCount 島數、usedSolution 是否看過解答
function computeStars(timeSec, islandCount, usedSolution) {
  if (usedSolution) return 1;
  if (timeSec <= islandCount * 6) return 3;
  if (timeSec <= islandCount * 15) return 2;
  return 1;
}

function GameTimer(_ref) {
  var startTime = _ref.startTime,
      endTime = _ref.endTime,
      isRunning = _ref.isRunning;

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

  var timeToUse = endTime ? endTime : now;
  var secs = Math.max(0, Math.floor((timeToUse - startTime) / 1000));
  return React.createElement(
    'span',
    null,
    '\u23F1 ',
    formatTime(secs)
  );
}

// ==========================================
// 每日一題：確定性隨機（零伺服器，同一天全世界同一題）
// ==========================================
// 台灣可愛動物隨機暱稱（多人連線用，約30個）
// ===== ANIMAL-NAMES-START =====
var ANIMAL_NAMES = ['柴犬', '柯基', '虎斑貓', '橘貓', '倉鼠', '兔兔', '刺蝟', '龍貓', '水豚', '樹懶', '狐獴', '羊駝', '企鵝', '海獺', '貓頭鷹', '松鼠', '無尾熊', '台灣黑熊', '石虎', '穿山甲', '梅花鹿', '台灣藍鵲', '帝雉', '獼猴', '山羌', '綠蠵龜', '櫻花鉤吻鮭', '飛魚', '螢火蟲', '獨角仙'];
function normName(n) {
  return (n || '').trim().toLowerCase();
}
// ===== ANIMAL-NAMES-END =====

// ===== DAILY-CHALLENGE-START ===

// (moved to js/puzzle.js: mulberry32)


// (moved to js/puzzle.js: hashDateStr)


// (moved to js/puzzle.js: getDailyDateStr)


// (moved to js/puzzle.js: shiftDateStr)


// (moved to js/puzzle.js: getDailySeed)

// 每日紀錄收斂為單一 map key（稽核 G-01：原「一天一 key」無界成長）：第一次讀取時把全部舊 key 摺進 hashi_daily_map 並刪除舊 key，之後只讀寫 map（帶 schema 版本 v:1，G-02）
var _dailyMapCache = null;
function dailyMap() {
  if (_dailyMapCache) return _dailyMapCache;
  var m = null;
  try {
    var raw = localStorage.getItem('hashi_daily_map');var p = raw ? JSON.parse(raw) : null;if (p && p.v === 1 && p.days && _typeof(p.days) === 'object') m = p;
  } catch (e) {}
  if (!m) m = { v: 1, days: {} };
  try {
    var legacy = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);if (k && /^hashi_daily_\d{4}-\d{2}-\d{2}$/.test(k)) legacy.push(k);
    }
    legacy.forEach(function (k) {
      var ds = k.slice('hashi_daily_'.length);if (!m.days[ds]) {
        try {
          var _p = JSON.parse(localStorage.getItem(k));if (_p && typeof _p.time === 'number' && isFinite(_p.time)) m.days[ds] = { time: _p.time };
        } catch (e) {}
      }try {
        localStorage.removeItem(k);
      } catch (e) {}
    });
    if (legacy.length) try {
      localStorage.setItem('hashi_daily_map', JSON.stringify(m));
    } catch (e) {}
  } catch (e) {}
  _dailyMapCache = m;
  return m;
}
function readDailyRecord(dateStr) {
  var p = dailyMap().days[dateStr];
  return p && typeof p.time === 'number' && isFinite(p.time) ? p : null; // 形狀不符（舊版/損毀資料）視同無紀錄：recordDailyWin 直接讀 prev.time 算 Math.min，NaN 會一路污染最佳時間（稽核修）
}
function readDailyStreak() {
  try {
    var raw = localStorage.getItem('hashi_daily_streak');
    var s = raw ? JSON.parse(raw) : null;
    return s && typeof s.count === 'number' ? s : { count: 0, lastDate: '' };
  } catch (e) {
    return { count: 0, lastDate: '' };
  }
}
function getDailyStatus(dateStr) {
  var d = clampDailyDate(dateStr);
  return { dateStr: d, done: readDailyRecord(d), streak: readDailyStreak().count };
}
// 每日一題可玩的日期範圍：今天以前（含今天），未來不行
var MIN_DAILY_DATE = '2026-01-01';
function clampDailyDate(d) {
  var today = HASHI_PUZZLE.getDailyDateStr();
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
  var _this = this;

  var playerIdRef = useRef(function () {
    try {
      var K = 'plat_uid_hashi';
      var tab = sessionStorage.getItem(K + '_tab');
      if (!tab) {
        tab = Math.random().toString(36).substring(2, 8);try {
          sessionStorage.setItem(K + '_tab', tab);
        } catch (e) {}
      }
      var claim = null;try {
        claim = JSON.parse(localStorage.getItem(K + '_claim') || 'null');
      } catch (e) {}
      if (claim && claim.tab !== tab && Date.now() - claim.ts < 8000) {
        // 同瀏覽器另一個分頁正在用正規 uid（雙分頁/同機雙開測試）：本分頁改用分頁專屬 uid，避免兩邊同 uid 撞成同一個人
        var alt = sessionStorage.getItem(K + '_alt');
        if (!alt) {
          alt = Math.random().toString(36).substring(2, 12);try {
            sessionStorage.setItem(K + '_alt', alt);
          } catch (e) {}
        }
        return alt;
      }
      var beat = function beat() {
        try {
          localStorage.setItem(K + '_claim', JSON.stringify({ tab: tab, ts: Date.now() }));
        } catch (e) {}
      };
      beat(); // interval id 存到 window 並先清舊的（稽核 D-06：平台 REBOOT 會重跑遊戲程式碼，原寫法 id 直接丟棄、舊 interval 永遠清不掉會疊加）
      var _ct = window.__platClaimTimers || (window.__platClaimTimers = {});
      if (_ct[K]) clearInterval(_ct[K]);
      _ct[K] = setInterval(beat, 3000);
      var u = localStorage.getItem(K);
      if (!u) {
        u = Math.random().toString(36).substring(2, 12);localStorage.setItem(K, u);
      }
      return u;
    } catch (e) {
      return Math.random().toString(36).substring(2, 12);
    }
  }()); // 持久 uid：同裝置重連同房間＝同座位（重連回座）；同瀏覽器多分頁僅第一個分頁用正規 uid
  var myId = playerIdRef.current;
  var platTimeOffset = function platTimeOffset() {
    try {
      return window.__PLAT_NET && window.__PLAT_NET.timeOffset || 0;
    } catch (e) {
      return 0;
    }
  }; // 房主時鐘偏移（稽核 D-05）：殼以 roster 時間戳估計，房主/單機恆 0
  var myNameRef = useRef("");
  var lastSeenRef = useRef({}); // 在線心跳：uid → 最後收到其訊息的時間（房主端判定離線用）
  var hostSeenRef = useRef(0); // 來賓端：最後收到房主訊息的時間
  var lastPingRef = useRef(0);
  var myColorRef = useRef(COLORS[0]);

  var initialDataRef = useRef(null);
  if (!initialDataRef.current) {
    initialDataRef.current = HASHI_PUZZLE.generateUniqueHashi(LEVELS[1]);
  }

  var _useState3 = useState('home'),
      _useState4 = _slicedToArray(_useState3, 2),
      screen = _useState4[0],
      setScreen = _useState4[1];

  var _useState5 = useState('none'),
      _useState6 = _slicedToArray(_useState5, 2),
      engine = _useState6[0],
      setEngine = _useState6[1];

  var _useState7 = useState(2),
      _useState8 = _slicedToArray(_useState7, 2),
      currentLevelId = _useState8[0],
      setCurrentLevelId = _useState8[1];

  var _useState9 = useState(initialDataRef.current),
      _useState10 = _slicedToArray(_useState9, 2),
      randomLevelData = _useState10[0],
      setRandomLevelData = _useState10[1];

  var _useState11 = useState(function () {
    return HASHI_PUZZLE.generateEmptyBridges(initialDataRef.current);
  }),
      _useState12 = _slicedToArray(_useState11, 2),
      bridges = _useState12[0],
      setBridges = _useState12[1];

  var _useState13 = useState([]),
      _useState14 = _slicedToArray(_useState13, 2),
      strokes = _useState14[0],
      setStrokes = _useState14[1];

  var _useState15 = useState([]),
      _useState16 = _slicedToArray(_useState15, 2),
      history = _useState16[0],
      setHistory = _useState16[1];

  var _useState17 = useState(false),
      _useState18 = _slicedToArray(_useState17, 2),
      isWon = _useState18[0],
      setIsWon = _useState18[1];

  var isWonRef = useRef(false);
  useEffect(function () {
    isWonRef.current = isWon;
  }, [isWon]);

  var _useState19 = useState(false),
      _useState20 = _slicedToArray(_useState19, 2),
      hideVictoryModal = _useState20[0],
      setHideVictoryModal = _useState20[1];

  var _useState21 = useState(""),
      _useState22 = _slicedToArray(_useState21, 2),
      toastMsg = _useState22[0],
      setToastMsg = _useState22[1];

  var _useState23 = useState(Date.now()),
      _useState24 = _slicedToArray(_useState23, 2),
      startTime = _useState24[0],
      setStartTime = _useState24[1];

  var _useState25 = useState(null),
      _useState26 = _slicedToArray(_useState25, 2),
      endTime = _useState26[0],
      setEndTime = _useState26[1];

  var _useState27 = useState(1),
      _useState28 = _slicedToArray(_useState27, 2),
      zoomLevel = _useState28[0],
      setZoomLevel = _useState28[1];

  var _useState29 = useState(false),
      _useState30 = _slicedToArray(_useState29, 2),
      showSolution = _useState30[0],
      setShowSolution = _useState30[1];

  var _useState31 = useState(true),
      _useState32 = _slicedToArray(_useState31, 2),
      isHeaderCollapsed = _useState32[0],
      setIsHeaderCollapsed = _useState32[1];

  var _useState33 = useState(false),
      _useState34 = _slicedToArray(_useState33, 2),
      showSaveModal = _useState34[0],
      setShowSaveModal = _useState34[1];

  var _useState35 = useState(false),
      _useState36 = _slicedToArray(_useState35, 2),
      showSettingsModal = _useState36[0],
      setShowSettingsModal = _useState36[1]; // 設定難度 modal（v1.43 Q2：設定入口三款統一 modal 式，廢標頭 select）


  var _useState37 = useState(false),
      _useState38 = _slicedToArray(_useState37, 2),
      soloPick = _useState38[0],
      setSoloPick = _useState38[1]; // 單機入口先選難度（v1.58.0 使用者要求，比照數獨設定畫面／地雷 setup）：由主畫面「單機挑戰」開 modal 時為 true，取消＝回主畫面、選定才開局


  var _useState39 = useState(""),
      _useState40 = _slicedToArray(_useState39, 2),
      saveCode = _useState40[0],
      setSaveCode = _useState40[1];

  var _useState41 = useState(false),
      _useState42 = _slicedToArray(_useState41, 2),
      showCustomModal = _useState42[0],
      setShowCustomModal = _useState42[1];

  var _useState43 = useState(30),
      _useState44 = _slicedToArray(_useState43, 2),
      tempWidth = _useState44[0],
      setTempWidth = _useState44[1];

  var _useState45 = useState(30),
      _useState46 = _slicedToArray(_useState45, 2),
      tempHeight = _useState46[0],
      setTempHeight = _useState46[1];

  var _useState47 = useState(0),
      _useState48 = _slicedToArray(_useState47, 2),
      interactionMode = _useState48[0],
      setInteractionMode = _useState48[1];

  var _useState49 = useState('pen'),
      _useState50 = _slicedToArray(_useState49, 2),
      drawSubMode = _useState50[0],
      setDrawSubMode = _useState50[1];

  var modeIcons = ['🖋️', '✏️', '🖌️'];
  var modeTitles = ['實線模式', '草稿模式', '繪圖作記號'];

  var _useState51 = useState(0),
      _useState52 = _slicedToArray(_useState51, 2),
      zoomModeIdx = _useState52[0],
      setZoomModeIdx = _useState52[1];

  var _useState53 = useState(false),
      _useState54 = _slicedToArray(_useState53, 2),
      isClosingModal = _useState54[0],
      setIsClosingModal = _useState54[1];

  var _useState55 = useState(false),
      _useState56 = _slicedToArray(_useState55, 2),
      isGenerating = _useState56[0],
      setIsGenerating = _useState56[1];

  var _useState57 = useState(0),
      _useState58 = _slicedToArray(_useState57, 2),
      boardFadeKey = _useState58[0],
      setBoardFadeKey = _useState58[1]; // 新題目時棋盤淡入

  var _useState59 = useState(null),
      _useState60 = _slicedToArray(_useState59, 2),
      hoveredBridgeId = _useState60[0],
      setHoveredBridgeId = _useState60[1];

  var _useState61 = useState(null),
      _useState62 = _slicedToArray(_useState61, 2),
      hoveredIslandId = _useState62[0],
      setHoveredIslandId = _useState62[1];

  var _useState63 = useState(null),
      _useState64 = _slicedToArray(_useState63, 2),
      colorPickerTarget = _useState64[0],
      setColorPickerTarget = _useState64[1];

  var _useState65 = useState([]),
      _useState66 = _slicedToArray(_useState65, 2),
      colorSeq = _useState66[0],
      setColorSeq = _useState66[1];

  var _useState67 = useState(null),
      _useState68 = _slicedToArray(_useState67, 2),
      editTarget = _useState68[0],
      setEditTarget = _useState68[1]; // 個人設定 modal（改名/改色，比照數獨進度條）：點自己（或房主點任何人）的選手晶片開啟


  var _useState69 = useState(''),
      _useState70 = _slicedToArray(_useState69, 2),
      editName = _useState70[0],
      setEditName = _useState70[1];

  // 💾 記住暱稱與房號（同一裝置下次免重打；房主代碼固定不變）


  var loadSavedNickname = function loadSavedNickname() {
    try {
      return localStorage.getItem('hashi_nickname') || "";
    } catch (e) {
      return "";
    }
  };
  var saveNickname = function saveNickname(n) {
    try {
      if (n) localStorage.setItem('hashi_nickname', n);
    } catch (e) {}
  };
  var loadLastRoom = function loadLastRoom() {
    try {
      return localStorage.getItem('hashi_last_room') || "";
    } catch (e) {
      return "";
    }
  };
  var saveLastRoom = function saveLastRoom(r) {
    try {
      if (r) localStorage.setItem('hashi_last_room', r);
    } catch (e) {}
  };
  var loadHostRoom = function loadHostRoom() {
    try {
      return localStorage.getItem('hashi_host_room') || "";
    } catch (e) {
      return "";
    }
  };
  var saveHostRoom = function saveHostRoom(r) {
    try {
      if (r) localStorage.setItem('hashi_host_room', r);
    } catch (e) {}
  };
  var clearHostRoom = function clearHostRoom() {
    try {
      localStorage.removeItem('hashi_host_room');
    } catch (e) {}
  };

  var _useState71 = useState(""),
      _useState72 = _slicedToArray(_useState71, 2),
      roomId = _useState72[0],
      setRoomId = _useState72[1];

  var _useState73 = useState(false),
      _useState74 = _slicedToArray(_useState73, 2),
      isHost = _useState74[0],
      setIsHost = _useState74[1];

  var _useState75 = useState(function () {
    return loadLastRoom();
  }),
      _useState76 = _slicedToArray(_useState75, 2),
      tempRoomId = _useState76[0],
      setTempRoomId = _useState76[1];

  var _useState77 = useState(""),
      _useState78 = _slicedToArray(_useState77, 2),
      tempPlayerName = _useState78[0],
      setTempPlayerName = _useState78[1];

  var _useState79 = useState(function () {
    return ANIMAL_NAMES[Math.random() * ANIMAL_NAMES.length | 0];
  }),
      _useState80 = _slicedToArray(_useState79, 1),
      namePlaceholderAnimal = _useState80[0];

  var nameInputRef = useRef(null);

  var _useState81 = useState('choose'),
      _useState82 = _slicedToArray(_useState81, 2),
      joinStep = _useState82[0],
      setJoinStep = _useState82[1]; // 'choose' | 'hostSetup' | 'guestSetup' | 'connecting' | 'nick'


  var _useState83 = useState([]),
      _useState84 = _slicedToArray(_useState83, 2),
      takenNames = _useState84[0],
      setTakenNames = _useState84[1]; // 來賓：房主回傳的已用名單快照


  var _useState85 = useState(""),
      _useState86 = _slicedToArray(_useState85, 2),
      nickError = _useState86[0],
      setNickError = _useState86[1]; // nick 步輸入框下方 inline 錯誤


  var joinRoleRef = useRef(null); // 'host' | 'guest'
  var joinActiveRef = useRef(false); // 是否正在 join 流程中（供斷線／錯誤判斷）
  var suppressCloseRef = useRef(false); // 主動清理連線時壓住 close 事件雜訊
  var autoNameRef = useRef(false); // 本次加入用的名字是否來自拉霸機（REQ_REJOIN 沿用）
  var myJoinNameRef = useRef(""); // 本次 JOIN 用的名字（名單自我修復重送 JOIN 用，不從 playersList 反推）
  var promotingRef = useRef(false); // 房主接管升格中（open handler 不洗名單）
  var hostRoomRetryRef = useRef(false); // 房主固定代碼衝突時只自動重試一次
  // 🎰 暱稱拉霸機

  var _useState87 = useState(false),
      _useState88 = _slicedToArray(_useState87, 2),
      showSlotMachine = _useState88[0],
      setShowSlotMachine = _useState88[1];

  var _useState89 = useState('host'),
      _useState90 = _slicedToArray(_useState89, 2),
      slotMode = _useState90[0],
      setSlotMode = _useState90[1];

  var _useState91 = useState(ANIMAL_NAMES),
      _useState92 = _slicedToArray(_useState91, 2),
      slotPool = _useState92[0],
      setSlotPool = _useState92[1];

  var _useState93 = useState(""),
      _useState94 = _slicedToArray(_useState93, 2),
      slotName = _useState94[0],
      setSlotName = _useState94[1];

  var _useState95 = useState(false),
      _useState96 = _slicedToArray(_useState95, 2),
      slotSpinning = _useState96[0],
      setSlotSpinning = _useState96[1];

  var _useState97 = useState(""),
      _useState98 = _slicedToArray(_useState97, 2),
      slotFinalName = _useState98[0],
      setSlotFinalName = _useState98[1];

  var _useState99 = useState(false),
      _useState100 = _slicedToArray(_useState99, 2),
      slotWaiting = _useState100[0],
      setSlotWaiting = _useState100[1];

  var _useState101 = useState(0),
      _useState102 = _slicedToArray(_useState101, 2),
      slotRound = _useState102[0],
      setSlotRound = _useState102[1];

  var slotPoolRef = useRef(ANIMAL_NAMES);
  var slotFinalNameRef = useRef("");
  var slotTimerRef = useRef(null);
  var guestAutoNameRef = useRef(false);
  var guestJoinedRef = useRef(false);
  var guestNamesResolvedRef = useRef(false);
  var guestNamesTimeoutRef = useRef(null);

  var _useState103 = useState([]),
      _useState104 = _slicedToArray(_useState103, 2),
      playersList = _useState104[0],
      setPlayersList = _useState104[1];

  var _useState105 = useState(false),
      _useState106 = _slicedToArray(_useState105, 2),
      isConnecting = _useState106[0],
      setIsConnecting = _useState106[1];

  var _useState107 = useState(true),
      _useState108 = _slicedToArray(_useState107, 2),
      showOtherCursors = _useState108[0],
      setShowOtherCursors = _useState108[1];

  var _useState109 = useState({}),
      _useState110 = _slicedToArray(_useState109, 2),
      cursors = _useState110[0],
      setCursors = _useState110[1];

  var _useState111 = useState([]),
      _useState112 = _slicedToArray(_useState111, 2),
      ripples = _useState112[0],
      setRipples = _useState112[1];

  // 💬 聊天室


  var _useState113 = useState([]),
      _useState114 = _slicedToArray(_useState113, 2),
      chatMsgs = _useState114[0],
      setChatMsgs = _useState114[1]; // {id, uid, name, color, text, ts, mine}


  var _useState115 = useState(false),
      _useState116 = _slicedToArray(_useState115, 2),
      chatOpen = _useState116[0],
      setChatOpen = _useState116[1];

  var _useState117 = useState(''),
      _useState118 = _slicedToArray(_useState117, 2),
      chatInput = _useState118[0],
      setChatInput = _useState118[1];

  var _useState119 = useState(0),
      _useState120 = _slicedToArray(_useState119, 2),
      unreadChat = _useState120[0],
      setUnreadChat = _useState120[1];

  var chatOpenRef = useRef(false);
  var chatListRef = useRef(null);

  var _useState121 = useState(false),
      _useState122 = _slicedToArray(_useState121, 2),
      chatMin = _useState122[0],
      setChatMin = _useState122[1]; // 💬 聊天室收合

  // 💬 聊天室邏輯


  useEffect(function () {
    chatOpenRef.current = chatOpen;if (chatOpen) setUnreadChat(0);
  }, [chatOpen]);
  useEffect(function () {
    // 新訊息自動捲到底
    var el = chatListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMsgs, chatOpen]);
  var appendChatMsg = function appendChatMsg(m) {
    var msg = { id: 'c' + Date.now() + '_' + Math.floor(Math.random() * 1000000), uid: m.uid, name: m.name || '對手', color: m.color || '#3b82f6', text: String(m.text || '').slice(0, 200), ts: m.ts || Date.now(), mine: m.uid === myId };
    setChatMsgs(function (prev) {
      return [].concat(_toConsumableArray(prev.slice(-99)), [msg]);
    });
    if (!msg.mine && !chatOpenRef.current) setUnreadChat(function (prev) {
      return prev + 1;
    });
  };
  var sendChat = function sendChat() {
    var text = chatInput.trim();
    if (!text || engineRef.current !== 'peerjs') return;
    var msg = { type: 'CHAT', uid: myId, name: myNameRef.current || '你', color: myColorRef.current, text: text, ts: Date.now() };
    appendChatMsg(msg);
    setChatInput('');
    try {
      if (isHostRef.current) {
        connsRef.current.forEach(function (c) {
          if (c.open) c.send(msg);
        });
      } else if (connRef.current && connRef.current.open) {
        connRef.current.send(msg);
      }
    } catch (e) {}
  };

  // 📹 圓形視訊（PeerJS MediaConnection，走 WebRTC 不經伺服器）

  var _useState123 = useState(false),
      _useState124 = _slicedToArray(_useState123, 2),
      videoOn = _useState124[0],
      setVideoOn = _useState124[1];

  var _useState125 = useState(false),
      _useState126 = _slicedToArray(_useState125, 2),
      micMuted = _useState126[0],
      setMicMuted = _useState126[1];

  var _useState127 = useState(null),
      _useState128 = _slicedToArray(_useState127, 2),
      localStream = _useState128[0],
      setLocalStream = _useState128[1];

  var _useState129 = useState({}),
      _useState130 = _slicedToArray(_useState129, 2),
      remoteVideos = _useState130[0],
      setRemoteVideos = _useState130[1]; // uid -> MediaStream


  var localStreamRef = useRef(null);
  var videoCallsRef = useRef([]);
  var videoOnRef = useRef(false);
  useEffect(function () {
    videoOnRef.current = videoOn;
  }, [videoOn]);
  // 🔊 喇叭預設關閉；有人開麥發言時提示是否開音效

  var _useState131 = useState(false),
      _useState132 = _slicedToArray(_useState131, 2),
      speakerOn = _useState132[0],
      setSpeakerOn = _useState132[1];

  var _useState133 = useState({}),
      _useState134 = _slicedToArray(_useState133, 2),
      remoteMic = _useState134[0],
      setRemoteMic = _useState134[1]; // uid -> muted(bool)


  var _useState135 = useState(null),
      _useState136 = _slicedToArray(_useState135, 2),
      speakPrompt = _useState136[0],
      setSpeakPrompt = _useState136[1]; // {uid, name}


  var speakerOnRef = useRef(false);
  var speakPromptedRef = useRef({});
  useEffect(function () {
    speakerOnRef.current = speakerOn;
  }, [speakerOn]);
  useEffect(function () {
    // 喇叭開關即時套用到所有遠端視訊
    document.querySelectorAll('.remote-video-el').forEach(function (el) {
      try {
        el.muted = !speakerOn;
      } catch (e) {}
    });
    if (speakerOn) setSpeakPrompt(null);
  }, [speakerOn]);
  var broadcastMic = function broadcastMic(muted) {
    var msg = { type: 'MIC', uid: myId, name: myNameRef.current || '你', muted: muted };
    try {
      if (isHostRef.current) {
        connsRef.current.forEach(function (c) {
          if (c.open) c.send(msg);
        });
      } else if (connRef.current && connRef.current.open) {
        connRef.current.send(msg);
      }
    } catch (e) {}
  };
  var handleMicMsg = function handleMicMsg(m) {
    if (!m || m.uid === myId) return;
    setRemoteMic(function (prev) {
      return _extends({}, prev, _defineProperty({}, m.uid, !!m.muted));
    });
    if (m.muted) {
      speakPromptedRef.current[m.uid] = false;
      setSpeakPrompt(function (prev) {
        return prev && prev.uid === m.uid ? null : prev;
      });
    } else if (!speakerOnRef.current && !speakPromptedRef.current[m.uid]) {
      speakPromptedRef.current[m.uid] = true;
      setSpeakPrompt({ uid: m.uid, name: m.name || '對手' });
    }
  };
  var handleIncomingCall = function handleIncomingCall(call) {
    try {
      call.answer(localStreamRef.current || undefined);
    } catch (e) {
      try {
        call.answer();
      } catch (e2) {}
    }
    videoCallsRef.current.push(call);
    var remoteUid = call.metadata && call.metadata.uid || call.peer;
    call.on('stream', function (rs) {
      setRemoteVideos(function (prev) {
        return _extends({}, prev, _defineProperty({}, remoteUid, rs));
      });
      showToast('📹 對方開啟了視訊');
    });
    call.on('close', function () {
      setRemoteVideos(function (prev) {
        var n = _extends({}, prev);delete n[remoteUid];return n;
      });
    });
  };
  var callAllPeers = function callAllPeers(stream) {
    var peer = peerRef.current;
    if (!peer) return;
    var doCall = function doCall(peerId, uid) {
      try {
        var call = peer.call(peerId, stream, { metadata: { uid: myId, name: myNameRef.current || '你' } });
        videoCallsRef.current.push(call);
        call.on('stream', function (rs) {
          setRemoteVideos(function (prev) {
            return _extends({}, prev, _defineProperty({}, uid, rs));
          });
        });
        call.on('close', function () {
          setRemoteVideos(function (prev) {
            var n = _extends({}, prev);delete n[uid];return n;
          });
        });
      } catch (e) {}
    };
    if (isHostRef.current) {
      connsRef.current.forEach(function (c) {
        if (c.uid && c.open) doCall(c.peer, c.uid);
      });
    } else if (connRef.current && connRef.current.open) {
      var hostEntry = playersListRef.current.find(function (p) {
        return p.isHost;
      });
      doCall(connRef.current.peer, hostEntry ? hostEntry.id : connRef.current.peer);
    }
  };
  var stopVideo = function stopVideo() {
    videoCallsRef.current.forEach(function (call) {
      try {
        call.close();
      } catch (e) {}
    });
    videoCallsRef.current = [];
    var s = localStreamRef.current;
    if (s) {
      try {
        s.getTracks().forEach(function (t) {
          return t.stop();
        });
      } catch (e) {}
    }
    localStreamRef.current = null;
    setLocalStream(null);setRemoteVideos({});setVideoOn(false);setMicMuted(false);
    setRemoteMic({});setSpeakPrompt(null);speakPromptedRef.current = {};
  };
  var toggleVideo = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var stream;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!videoOn) {
                _context.next = 3;
                break;
              }

              stopVideo();return _context.abrupt('return');

            case 3:
              if (!(engineRef.current !== 'peerjs')) {
                _context.next = 5;
                break;
              }

              return _context.abrupt('return');

            case 5:
              if (!(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
                _context.next = 8;
                break;
              }

              showToast('⚠️ 目前的環境不支援相機（預覽器不算），請上線後用 Safari 開啟');
              return _context.abrupt('return');

            case 8:
              _context.prev = 8;
              _context.next = 11;
              return navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 320 }, facingMode: 'user' }, audio: true });

            case 11:
              stream = _context.sent;

              try {
                stream.getAudioTracks().forEach(function (t) {
                  t.enabled = false;
                });
              } catch (e) {} // 🎤 麥克風預設關閉，要講話再手動開
              localStreamRef.current = stream;
              setLocalStream(stream);setVideoOn(true);setMicMuted(true);
              callAllPeers(stream);
              broadcastMic(true);
              _context.next = 24;
              break;

            case 21:
              _context.prev = 21;
              _context.t0 = _context['catch'](8);

              showToast(_context.t0 && _context.t0.name === 'NotAllowedError' ? '⚠️ 相機/麥克風權限被拒，請到瀏覽器設定中允許' : '⚠️ 無法開啟相機/麥克風');

            case 24:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this, [[8, 21]]);
    }));

    return function toggleVideo() {
      return _ref2.apply(this, arguments);
    };
  }();
  var toggleMic = function toggleMic() {
    var newMuted = !micMuted;
    var s = localStreamRef.current;
    if (s) {
      try {
        s.getAudioTracks().forEach(function (t) {
          t.enabled = !newMuted;
        });
      } catch (e) {}
    }
    setMicMuted(newMuted);
    broadcastMic(newMuted); // 通知其他玩家：我開麥/關麥了
  };

  // 首次教學導覽

  var _useState137 = useState(false),
      _useState138 = _slicedToArray(_useState137, 2),
      showTutorial = _useState138[0],
      setShowTutorial = _useState138[1];

  var _useState139 = useState(0),
      _useState140 = _slicedToArray(_useState139, 2),
      tutorialStep = _useState140[0],
      setTutorialStep = _useState140[1];

  // 靜音偏好（與全域音效引擎同步）


  var _useState141 = useState(function () {
    try {
      return localStorage.getItem('hashi_muted') === '1';
    } catch (e) {
      return false;
    }
  }),
      _useState142 = _slicedToArray(_useState141, 2),
      muted = _useState142[0],
      setMuted = _useState142[1];

  // 🏁 競速模式


  var _useState143 = useState('coop'),
      _useState144 = _slicedToArray(_useState143, 2),
      mpMode = _useState144[0],
      setMpMode = _useState144[1]; // 'coop' | 'race'


  var _useState145 = useState('idle'),
      _useState146 = _slicedToArray(_useState145, 2),
      raceState = _useState146[0],
      setRaceState = _useState146[1]; // idle | lobby | countdown | racing | finished


  var _useState147 = useState({}),
      _useState148 = _slicedToArray(_useState147, 2),
      raceProgress = _useState148[0],
      setRaceProgress = _useState148[1];
  // ⚔️ 大亂鬥擴充：盤面快照（上帝視角）+ 道具 + 特效


  var _useState149 = useState({}),
      _useState150 = _slicedToArray(_useState149, 2),
      brawlBoards = _useState150[0],
      setBrawlBoards = _useState150[1];

  var brawlBoardsRef = useRef({});
  useEffect(function () {
    brawlBoardsRef.current = brawlBoards;
  }, [brawlBoards]);
  // 🎮 統一多人框架：等待室 + 大亂鬥設定 + 本局選手名單

  var _useState151 = useState(false),
      _useState152 = _slicedToArray(_useState151, 2),
      roomOpen = _useState152[0],
      setRoomOpen = _useState152[1];

  var _useState153 = useState({ sizeId: 2, itemsEnabled: true, godNumbers: true }),
      _useState154 = _slicedToArray(_useState153, 2),
      brawlSettings = _useState154[0],
      setBrawlSettings = _useState154[1];

  var _useState155 = useState([]),
      _useState156 = _slicedToArray(_useState155, 2),
      raceRacers = _useState156[0],
      setRaceRacers = _useState156[1];

  var _useState157 = useState(null),
      _useState158 = _slicedToArray(_useState157, 2),
      godViewUid = _useState158[0],
      setGodViewUid = _useState158[1];

  var _useState159 = useState([]),
      _useState160 = _slicedToArray(_useState159, 2),
      myItems = _useState160[0],
      setMyItems = _useState160[1];

  var _useState161 = useState({}),
      _useState162 = _slicedToArray(_useState161, 2),
      fxFog = _useState162[0],
      setFxFog = _useState162[1];

  var _useState163 = useState([]),
      _useState164 = _slicedToArray(_useState163, 2),
      fxFogBoxes = _useState164[0],
      setFxFogBoxes = _useState164[1]; // 雲霧：[{id,minX,minY,maxX,maxY,until,cx,cy,R,puffs}]（命中島嶼外接矩形＋命中時算好的雲團幾何）


  var _useState165 = useState([]),
      _useState166 = _slicedToArray(_useState165, 2),
      fxMarks = _useState166[0],
      setFxMarks = _useState166[1]; // 短暫特效標記：[{id,gx,gy,icon,until}]（💥炸橋／✨禮物補橋，格坐標中心）


  var _useState167 = useState(Date.now()),
      _useState168 = _slicedToArray(_useState167, 2),
      fxNow = _useState168[0],
      setFxNow = _useState168[1];

  var _useState169 = useState(null),
      _useState170 = _slicedToArray(_useState169, 2),
      raceResult = _useState170[0],
      setRaceResult = _useState170[1];

  var _useState171 = useState(false),
      _useState172 = _slicedToArray(_useState171, 2),
      raceWaiting = _useState172[0],
      setRaceWaiting = _useState172[1];

  var resultsDismissRef = useRef(null); // PlatResults 關閉標記（記 raceState：同 state 內關了不再彈，state 變了——如結算——再彈）

  var _useState173 = useState(false),
      _useState174 = _slicedToArray(_useState173, 2),
      resultsDismissedUi = _useState174[0],
      setResultsDismissedUi = _useState174[1]; // 結果卡被「看盤面」關掉後，畫面留一顆🏆結果鈕可隨時叫回


  var _useState175 = useState(false),
      _useState176 = _slicedToArray(_useState175, 2),
      leaveArm = _useState176[0],
      setLeaveArm = _useState176[1]; // 結果卡「離開」兩段確認（防誤按就拆連線退場、結果再也叫不回）


  var leaveArmTimerRef = useRef(null);

  var _useState177 = useState(false),
      _useState178 = _slicedToArray(_useState177, 2),
      showExitMenu = _useState178[0],
      setShowExitMenu = _useState178[1]; // 標頭「退出」選單（錦標賽房主進行中按退出才開，內含「結束本局」防誤觸）


  var _useState179 = useState(null),
      _useState180 = _slicedToArray(_useState179, 2),
      raceCountdown = _useState180[0],
      setRaceCountdown = _useState180[1];

  // ⭐ 星級評分


  var _useState181 = useState(0),
      _useState182 = _slicedToArray(_useState181, 2),
      stars = _useState182[0],
      setStars = _useState182[1];

  var _useState183 = useState(false),
      _useState184 = _slicedToArray(_useState183, 2),
      isNewBest = _useState184[0],
      setIsNewBest = _useState184[1];

  // ✨ 爽感：粒子與撒花


  var _useState185 = useState([]),
      _useState186 = _slicedToArray(_useState185, 2),
      bursts = _useState186[0],
      setBursts = _useState186[1];

  var _useState187 = useState([]),
      _useState188 = _slicedToArray(_useState187, 2),
      confetti = _useState188[0],
      setConfetti = _useState188[1];

  // 每日一題


  var _useState189 = useState(false),
      _useState190 = _slicedToArray(_useState189, 2),
      isDailyMode = _useState190[0],
      setIsDailyMode = _useState190[1];

  var _useState191 = useState(""),
      _useState192 = _slicedToArray(_useState191, 2),
      dailyDateStr = _useState192[0],
      setDailyDateStr = _useState192[1];

  var _useState193 = useState(0),
      _useState194 = _slicedToArray(_useState193, 2),
      dailyStreak = _useState194[0],
      setDailyStreak = _useState194[1];

  var _useState195 = useState(null),
      _useState196 = _slicedToArray(_useState195, 2),
      dailyDone = _useState196[0],
      setDailyDone = _useState196[1];

  var isDailyModeRef = useRef(false);
  var dailyDateStrRef = useRef("");
  // 主選單選擇的每日題目日期（預設今天，可往前選以前的題目）

  var _useState197 = useState(function () {
    return HASHI_PUZZLE.getDailyDateStr();
  }),
      _useState198 = _slicedToArray(_useState197, 2),
      dailyMenuDate = _useState198[0],
      setDailyMenuDate = _useState198[1];

  var dailyStatus = useMemo(function () {
    if (screen !== 'home') return null;
    return getDailyStatus(dailyMenuDate);
  }, [screen, dailyMenuDate]);

  var isMultiplayer = engine !== 'none';
  var inRace = raceState !== 'idle';
  var spectateUid = godViewUid && brawlBoards[godViewUid] ? godViewUid : raceRacers.find(function (u) {
    return brawlBoards[u];
  }) || null;
  var myPlayerEntry = playersList.find(function (p) {
    return p.id === myId;
  });
  var roomRacers = playersList.filter(function (p) {
    return !p.isSpectator;
  });
  var roomRealRacers = playersList.filter(function (p) {
    return !p.isSpectator && !p.pending;
  }); // 已真人到場的選手（未到席位不算人數）
  var roomAllReady = roomRacers.length >= 2 && roomRacers.every(function (p) {
    return p.isReady;
  });
  var svgRef = useRef(null);
  var lastCursorSend = useRef(0);
  var isDrawingRef = useRef(false);

  var engineRef = useRef('none');
  var isHostRef = useRef(false);
  var peerRef = useRef(null);
  var PLAT_MODE = typeof window !== 'undefined' && !!window.__PLAT_PLATFORM;

  var _useState199 = useState(false),
      _useState200 = _slicedToArray(_useState199, 2),
      zoomOpen = _useState200[0],
      setZoomOpen = _useState200[1];

  var _useState201 = useState(false),
      _useState202 = _slicedToArray(_useState201, 2),
      drawSubOpen = _useState202[0],
      setDrawSubOpen = _useState202[1];
  // 平台 dock 按鈕（💬/🎥/🎤/🔈）：平台模式＋連線中時畫進自己的底部列，與遊戲按鈕同排同款


  var _useState203 = useState(0),
      _useState204 = _slicedToArray(_useState203, 2),
      dockTick = _useState204[0],
      setDockTick = _useState204[1];

  useEffect(function () {
    if (window.PlatDock) return window.PlatDock.subscribe(function () {
      return setDockTick(function (t) {
        return t + 1;
      });
    });
  }, []);
  var platDock = PLAT_MODE && window.PlatDock && window.PlatDock.isActive() ? window.PlatDock.getState() : null;
  var renderDockCapsule = function renderDockCapsule(withLobby) {
    if (!platDock) return null;
    var PD = window.PlatDock;
    var dbtn = function dbtn(active) {
      return "px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl font-black text-base md:text-lg flex items-center justify-center transition-all relative " + (active ? "bg-[#4ade80] text-slate-900 shadow-md" : "text-slate-400 hover:text-white");
    };
    return React.createElement(
      'div',
      { className: 'flex items-center gap-1 bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner' },
      withLobby && React.createElement(
        'button',
        { onClick: function onClick() {
            return PD.goLobby();
          }, className: dbtn(false), title: '\u56DE\u5927\u5EF3\u9078\u904A\u6232' },
        '\uD83C\uDFE0'
      ),
      React.createElement(
        'button',
        { onClick: function onClick() {
            return PD.toggleChat();
          }, className: dbtn(platDock.chatOpen), title: '\u804A\u5929\u5BA4' },
        '\uD83D\uDCAC',
        platDock.unread > 0 && React.createElement(
          'span',
          { className: 'absolute -top-1 -right-1 w-4 h-4 bg-red-500 border border-white rounded-full text-[9px] text-white flex items-center justify-center font-black' },
          platDock.unread > 9 ? '9+' : platDock.unread
        )
      ),
      React.createElement(
        'button',
        { onClick: function onClick() {
            return PD.toggleVideo();
          }, className: dbtn(platDock.videoOn), title: '\u8996\u8A0A' },
        platDock.videoOn ? '📹' : '🎥'
      ),
      platDock.videoOn && React.createElement(
        'button',
        { onClick: function onClick() {
            return PD.toggleMic();
          }, className: dbtn(!platDock.micMuted), title: '\u9EA5\u514B\u98A8' },
        platDock.micMuted ? '🔇' : '🎤'
      ),
      (platDock.videoOn || platDock.remoteCount > 0) && React.createElement(
        'button',
        { onClick: function onClick() {
            return PD.toggleSpeaker();
          }, className: dbtn(platDock.speakerOn), title: '\u5587\u53ED' },
        platDock.speakerOn ? '🔊' : '🔈'
      )
    );
  };
  var platAutoRef = useRef(null);
  var platSessRef = useRef(null); // 平台 hub：殼 enter/migrate 最後帶入的 sess（hub 模式下代表色以 sess.color 為準、固定不亂配）
  var hubPlatColor = function hubPlatColor() {
    var s = platSessRef.current;
    if (!s || !s.hub) return null;
    var c = s.color;
    return c === 'rainbow' || COLORS.indexOf(c) >= 0 ? c : null;
  };
  var connRef = useRef(null);
  var connsRef = useRef([]);
  var zoomContainerRef = useRef(null);
  var lastPinchDist = useRef(null);
  var stateRef = useRef({ bridges: [], randomLevelData: null, showSolution: false, startTime: Date.now(), levelId: 2, strokes: [] });

  var zoomLevelRef = useRef(1);
  var zoomModeIdxRef = useRef(0);
  var levelDimRef = useRef({ w: 10, h: 10 }); // 最新題目尺寸（給 auto-fit 用）
  var userZoomedRef = useRef(false); // 使用者是否手動調整過縮放
  var lastBridgeTapRef = useRef({}); // 橋樑防連點時間戳
  var dragDrawRef = useRef(null); // 拖曳架橋手勢 {kind:'island'|'bridge', id, startX, startY, startT, dragging, targetId, holdTimer}
  var panRef = useRef(null); // 空白處單指拖曳捲動 {lastX, lastY}（CSS px；svg 已 touch-action:none，需手動捲動）
  var currentPathDataRef = useRef("");
  var drawingPathRef = useRef(null);
  var eraserRef = useRef(null);
  var dragPreviewLineRef = useRef(null); // 拖曳架橋預覽線（ref 直寫 DOM，不走 React state）
  var dragPreviewTipRef = useRef(null); // 拖曳預覽線末端圓點
  var lastEraseTimeRef = useRef(0);
  var mpModeRef = useRef('coop');
  var playersListRef = useRef([]);
  var raceStateRef = useRef('idle');
  var raceStartAtRef = useRef(null);
  var raceSeqRef = useRef(0);
  var raceResultsRef = useRef({});
  var myFinishTimeRef = useRef(null);
  var finishResentRef = useRef(0); // RACE_FINISH 補送次數（完賽回報補送用）
  var lastProgressSentRef = useRef(0);
  var lastProgressValRef = useRef(-1);
  var myItemsRef = useRef([]);
  var brawlAutoRef = useRef({}); // 集滿 3 自動發動進行中旗標（防重入）
  var raceProgressRef = useRef({});
  var hostMilestonesRef = useRef({});
  var brawlSettingsRef = useRef({ sizeId: 2, itemsEnabled: true, godNumbers: true });
  var customDimsRef = useRef(null); // 房間頁帶入的自訂尺寸 {w,h}（關卡選自訂時生成題目用）
  var racersRef = useRef([]);
  var milestonesRef = useRef({});
  var hashiGiftCreditRef = useRef(0); // 島嶼禮物額度：正確完成島數每跨總數 1/20 +1，送給較弱的對手；沒對象時存著
  var hashiGiftUnitsRef = useRef(0); // 已入帳的島嶼禮物單位（正確完成島數換算，只增不減——橋被拆掉重架不重複入帳）
  var lastBrawlSentRef = useRef(0);
  var fxRef = useRef({ fog: {}, boxes: [], marks: [] });
  var prevIslandDoneRef = useRef({});

  var MAX_SAFE_DIMENSION = 8500;

  // === 拖曳架橋手勢判定常數（方便微調手感） ===
  var TAP_MAX_MS = 350; // 按下到放開 < 350ms 才算點擊
  var DRAG_HOLD_MS = 220; // 按住 220ms 不放 → 進入拖曳模式（預覽線現身）
  var TAP_MOVE_TOL = 12; // 點擊容錯：移動 < 12px（SVG 單位）

  var cLevel = randomLevelData || { islands: [], description: "" };
  var islandsToRender = cLevel.islands || [];
  var maxGridX = islandsToRender.length > 0 ? Math.max.apply(Math, islandsToRender.map(function (i) {
    return i.x;
  }).concat([6])) : 6;
  var maxGridY = islandsToRender.length > 0 ? Math.max.apply(Math, islandsToRender.map(function (i) {
    return i.y;
  }).concat([6])) : 6;
  var gridWidth = cLevel.width ? cLevel.width : maxGridX + 1;
  var gridHeight = cLevel.height ? cLevel.height : maxGridY + 1;

  var SCALE = 65;var PADDING = 85;var ISLAND_RADIUS = 22;
  var svgW = (gridWidth - 1) * SCALE + PADDING * 2;
  var svgH = (gridHeight - 1) * SCALE + PADDING * 2;
  var hasSolution = cLevel.solution && cLevel.solution.length > 0;

  var getPlayerColor = function getPlayerColor(uid) {
    var p = playersList.find(function (p) {
      return p.id === uid;
    });
    return p ? p.color : COLORS[0];
  };

  var myCurrentColor = getPlayerColor(myId);
  var _mePlayer = playersList.find(function (p) {
    return p.id === myId;
  });
  myNameRef.current = _mePlayer ? _mePlayer.name : "";
  myColorRef.current = myCurrentColor;

  useEffect(function () {
    if (engine !== 'peerjs' && interactionMode >= 2) {
      setInteractionMode(0);
    }
  }, [engine, interactionMode]);

  useEffect(function () {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);
  useEffect(function () {
    zoomModeIdxRef.current = zoomModeIdx;
  }, [zoomModeIdx]);

  // 首次進入遊戲時顯示教學導覽（localStorage 記錄）
  useEffect(function () {
    var seen = false;
    try {
      seen = localStorage.getItem('hashi_tutorial_seen') === '1';
    } catch (e) {}
    if (!seen) {
      setTutorialStep(0);
      setShowTutorial(true);
    }
  }, []);

  useEffect(function () {
    stateRef.current = { bridges: bridges, randomLevelData: randomLevelData, showSolution: showSolution, startTime: startTime, levelId: currentLevelId, strokes: strokes };
    levelDimRef.current = { w: gridWidth, h: gridHeight };
  }, [bridges, randomLevelData, showSolution, startTime, currentLevelId, strokes]);

  useEffect(function () {
    if (screen !== 'game') return;
    var el = zoomContainerRef.current;
    if (!el) return;
    var touchStartY = null;

    var handleTouchStart = function handleTouchStart(e) {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
      }
    };
    var handleTouchMove = function handleTouchMove(e) {
      if (interactionMode >= 2) return;

      if (e.touches.length === 2) {
        e.preventDefault();
        var dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (lastPinchDist.current) {
          var delta = dist - lastPinchDist.current;
          var newZoom = Math.min(Math.max(zoomLevelRef.current + delta * 0.005, 0.4), 3.5);

          if (svgW * newZoom > MAX_SAFE_DIMENSION || svgH * newZoom > MAX_SAFE_DIMENSION) {
            newZoom = Math.min(MAX_SAFE_DIMENSION / svgW, MAX_SAFE_DIMENSION / svgH);
          }

          zoomLevelRef.current = newZoom;
          userZoomedRef.current = true;

          if (svgRef.current) {
            svgRef.current.style.width = svgW * newZoom + 'px';
            svgRef.current.style.height = svgH * newZoom + 'px';
          }

          if (zoomModeIdxRef.current !== 0) {
            setZoomModeIdx(0);
            zoomModeIdxRef.current = 0;
          }
        }
        lastPinchDist.current = dist;
      } else if (e.touches.length === 1 && touchStartY !== null) {
        var dy = e.touches[0].clientY - touchStartY;
        if (Math.abs(dy) > 30 && !isHeaderCollapsed) {
          setIsHeaderCollapsed(true);
        }
      }
    };
    var handleTouchEnd = function handleTouchEnd() {
      lastPinchDist.current = null;
      touchStartY = null;
      if (zoomLevel !== zoomLevelRef.current) {
        setZoomLevel(zoomLevelRef.current);
      }
    };
    var handleWheel = function handleWheel(e) {
      if (interactionMode >= 2) return;
      if (Math.abs(e.deltaY) > 10 && !isHeaderCollapsed) {
        setIsHeaderCollapsed(true);
      }
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

    return function () {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
      el.removeEventListener('wheel', handleWheel);
    };
  }, [screen, isHeaderCollapsed, interactionMode, svgW, svgH, zoomLevel]);

  useEffect(function () {
    if (screen !== 'game') return;
    var t = null;
    var onWinResize = function onWinResize() {
      if (userZoomedRef.current) return; // 使用者手動調過就不自動重算
      if (t) clearTimeout(t);
      t = setTimeout(function () {
        applyFitZoom();
      }, 200);
    };
    window.addEventListener('resize', onWinResize);
    window.addEventListener('orientationchange', onWinResize);
    return function () {
      window.removeEventListener('resize', onWinResize);
      window.removeEventListener('orientationchange', onWinResize);
      if (t) clearTimeout(t);
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

  useEffect(function () {
    playersListRef.current = playersList;
  }, [playersList]);
  useEffect(function () {
    raceProgressRef.current = raceProgress;
  }, [raceProgress]);
  // （2026-10-18 使用者指示：準備只是打勾，不自動開賽——一律等房主按「開始」才開賽）

  // ✨ 島嶼完成粒子：偵測「未完成 → 完成」
  useEffect(function () {
    var islands = randomLevelData && randomLevelData.islands || [];
    if (islands.length === 0) return;
    var fresh = [];
    islands.forEach(function (isl) {
      var cc = islandCurrentCounts[isl.id];
      var done = !!(cc && cc.total === isl.req);
      var was = !!prevIslandDoneRef.current[isl.id];
      if (done && !was) fresh.push(isl);
      prevIslandDoneRef.current[isl.id] = done;
    });
    if (fresh.length > 0) {
      var col = myCurrentColor === 'rainbow' ? '#fbbf24' : myCurrentColor;
      var parts = fresh.map(function (isl) {
        var cx = isl.x * SCALE + PADDING,
            cy = isl.y * SCALE + PADDING;
        var arr = [];
        for (var k = 0; k < 8; k++) {
          var ang = k / 8 * Math.PI * 2 + Math.random() * 0.6;
          var dist = 26 + Math.random() * 24;
          arr.push({ dx: Math.cos(ang) * dist, dy: Math.sin(ang) * dist });
        }
        return { id: 'b' + Date.now() + '_' + isl.id + '_' + Math.floor(Math.random() * 1000000), x: cx, y: cy, color: col, parts: arr };
      });
      setBursts(function (prev) {
        return [].concat(_toConsumableArray(prev), _toConsumableArray(parts));
      });
      var ids = {};
      parts.forEach(function (p) {
        ids[p.id] = true;
      });
      setTimeout(function () {
        setBursts(function (prev) {
          return prev.filter(function (b) {
            return !ids[b.id];
          });
        });
      }, 850);
    }
  }, [islandCurrentCounts]);

  // ✨ 勝利撒花
  useEffect(function () {
    if (isWon) {
      var colors = ['#4ade80', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#f97316'];
      var arr = [];
      for (var i = 0; i < 50; i++) {
        arr.push({ id: 'c' + i, left: Math.random() * 100, delay: Math.random() * 1.4, dur: 2.4 + Math.random() * 2.2, color: colors[i % colors.length], w: 6 + Math.random() * 6, h: 9 + Math.random() * 7 });
      }
      setConfetti(arr);
    } else {
      setConfetti([]);
    }
  }, [isWon]);

  // ----- 競速回座存檔（不小心跳出/重整後接續：房主 RACE_RESUME 有快照，但本地存檔更新更快、且含道具/里程碑狀態） -----
  var saveHashiResume = function saveHashiResume(bridgesArr) {
    if (raceStateRef.current !== 'racing' && raceStateRef.current !== 'countdown') return;
    try {
      localStorage.setItem('hashi_resume_' + myId, JSON.stringify({ startAt: raceStartAtRef.current, bridges: bridgesArr || stateRef.current.bridges || [], items: myItemsRef.current, milestones: milestonesRef.current, giftCredit: hashiGiftCreditRef.current, giftUnits: hashiGiftUnitsRef.current, ts: Date.now() }));
    } catch (e) {}
  };
  var loadHashiResume = function loadHashiResume(startAt) {
    try {
      var raw = localStorage.getItem('hashi_resume_' + myId);if (!raw) return null;
      var p = JSON.parse(raw);
      if (!p || p.startAt !== startAt || !Array.isArray(p.bridges)) return null; // 不是同一場（startAt 不符）不准還原
      if (!p.ts || Date.now() - p.ts > 3 * 3600 * 1000) return null;
      return p;
    } catch (e) {
      return null;
    }
  };

  // 🏁 競速進度分享：effect 版（安全網；主要推送走 raceAwareSync 內的 pushRaceProgress）
  useEffect(function () {
    pushRaceProgress(bridges);
  }, [islandCurrentCounts, raceState, randomLevelData]);

  var toastTimerRef = useRef(null);
  var showToast = function showToast(m) {
    if (typeof window !== 'undefined' && window.__PLAT_TOAST) {
      window.__PLAT_TOAST(m);return;
    }setToastMsg(m);if (toastTimerRef.current) clearTimeout(toastTimerRef.current);toastTimerRef.current = setTimeout(function () {
      return setToastMsg("");
    }, 4000);
  }; // 平台內統一走殼 toast（美學稽核 V-07：三款一式）；獨立版才用本地 toast。計時器存 ref（稽核 D-06）

  var getSvgCoords = function getSvgCoords(clientX, clientY) {
    var svg = svgRef.current;
    if (!svg) return null;
    var pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    var ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
  };

  var eraseAtPoint = function eraseAtPoint(cx, cy) {
    var offsets = [[0, 0], [15, 0], [-15, 0], [0, 15], [0, -15], [10, 10], [-10, -10], [10, -10], [-10, 10]];
    var hitIds = new Set();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = offsets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var off = _step.value;

        var els = document.elementsFromPoint(cx + off[0], cy + off[1]);
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = els[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var el = _step2.value;

            if (el.classList.contains('doodle-stroke')) {
              (function () {
                var sid = el.getAttribute('data-stroke-id');
                var strokeObj = stateRef.current.strokes.find(function (s) {
                  return s.id === sid;
                });
                var strokeUid = strokeObj && strokeObj.uid || (strokeObj ? strokeObj.id.split('-')[1] : null);
                if (strokeUid === myId) {
                  hitIds.add(sid);
                }
              })();
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    if (hitIds.size > 0) {
      var newStrokes = stateRef.current.strokes.filter(function (s) {
        return !hitIds.has(s.id);
      });
      if (newStrokes.length !== stateRef.current.strokes.length) {
        raceAwareSync({ strokes: newStrokes });
      }
    }
  };

  // === 拖曳架橋：手勢起始（時間＋距離雙條件判定） ===
  // 「同點或相近位置、快速按下放開」→ 點擊；「持續按住（長按）或移動」→ 拖曳模式
  var clearDragTimer = function clearDragTimer(dd) {
    if (dd && dd.holdTimer) {
      clearTimeout(dd.holdTimer);dd.holdTimer = null;
    }
  };

  var startDragGesture = function startDragGesture(e, kind, id) {
    if (interactionMode >= 2 || !e.isPrimary || dragDrawRef.current || isWon) return;
    var pt = getSvgCoords(e.clientX, e.clientY);
    if (!pt) return;
    var dd = { kind: kind, id: id, startX: pt.x, startY: pt.y, startCX: e.clientX, startCY: e.clientY, startT: Date.now(), dragging: false, targetId: null, holdTimer: null };
    dragDrawRef.current = dd;
    var pc = myCurrentColor === 'rainbow' ? '#fbbf24' : myCurrentColor;
    if (dragPreviewLineRef.current) dragPreviewLineRef.current.setAttribute('stroke', pc);
    if (dragPreviewTipRef.current) dragPreviewTipRef.current.setAttribute('fill', pc);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    // 長按進入拖曳：DRAG_HOLD_MS 後還按著 → 只顯示 tip 圓點在觸摸點（還沒方向，線保持隱藏）
    dd.holdTimer = setTimeout(function () {
      var cur = dragDrawRef.current;
      if (cur && cur.holdTimer === dd.holdTimer && !cur.dragging) {
        cur.dragging = true;
        var tip = dragPreviewTipRef.current;
        if (tip) {
          tip.setAttribute('cx', cur.startX);tip.setAttribute('cy', cur.startY);
          tip.style.display = 'block';
        }
      }
    }, DRAG_HOLD_MS);
  };

  var handleIslandPointerDown = function handleIslandPointerDown(e, island) {
    if (interactionMode < 2) setHoveredIslandId(island.id);
    startDragGesture(e, 'island', island.id);
  };

  var handleBridgePointerDown = function handleBridgePointerDown(e, b) {
    startDragGesture(e, 'bridge', b.id);
  };

  // === 拖曳架橋：依拖曳方向判定目標橋樑 ===
  var resolveDragTarget = function resolveDragTarget(d, dx, dy) {
    var rlv = stateRef.current.randomLevelData;
    var islands = rlv && rlv.islands ? rlv.islands : [];
    var bridgesNow = stateRef.current.bridges || [];
    var islMap = {};islands.forEach(function (i) {
      islMap[i.id] = i;
    });
    if (d.kind === 'island') {
      var from = islMap[d.id];if (!from) return null;
      var fromX = from.x * SCALE + PADDING,
          fromY = from.y * SCALE + PADDING;
      var len = Math.hypot(dx, dy) || 1,
          nx = dx / len,
          ny = dy / len;
      var bestId = null,
          bestCos = 0.82; // 夾角 < ~35°
      bridgesNow.forEach(function (b) {
        if (b.from !== d.id && b.to !== d.id) return;
        var other = islMap[b.from === d.id ? b.to : b.from];if (!other) return;
        var vx = other.x * SCALE + PADDING - fromX,
            vy = other.y * SCALE + PADDING - fromY;
        var vl = Math.hypot(vx, vy) || 1;vx /= vl;vy /= vl;
        var cos = vx * nx + vy * ny;
        if (cos > bestCos) {
          bestCos = cos;bestId = b.id;
        }
      });
      return bestId;
    }
    // 從橋樑出發：拖曳以橋軸向為主才算數
    var b = bridgesNow.find(function (x) {
      return x.id === d.id;
    });if (!b) return null;
    var f = islMap[b.from],
        t = islMap[b.to];if (!f || !t) return null;
    var ax = t.x - f.x,
        ay = t.y - f.y;
    var axial = Math.abs(dx * ax + dy * ay),
        normal = Math.abs(dx * ay - dy * ax);
    return axial > 0 && axial > normal * 1.5 ? d.id : null;
  };

  // === 拖曳架橋預覽線（ref 直寫 DOM，不走 React state，避免 pointermove 重渲染） ===
  var hideDragPreview = function hideDragPreview() {
    if (dragPreviewLineRef.current) dragPreviewLineRef.current.style.display = 'none';
    if (dragPreviewTipRef.current) dragPreviewTipRef.current.style.display = 'none';
  };

  // 拖曳預覽線幾何：軸向取手指按下位置，法向取軸線位置（線「從手指開始」，貼在橋的線上）
  var islandCenter = function islandCenter(id) {
    var rlv = stateRef.current.randomLevelData;
    var islands = rlv && rlv.islands ? rlv.islands : [];
    var isl = islands.find(function (i) {
      return i.id === id;
    });
    return isl ? { x: isl.x * SCALE + PADDING, y: isl.y * SCALE + PADDING } : null;
  };
  var bridgeAxis = function bridgeAxis(id) {
    var rlv = stateRef.current.randomLevelData;
    var islands = rlv && rlv.islands ? rlv.islands : [];
    var islMap = {};islands.forEach(function (i) {
      islMap[i.id] = i;
    });
    var b = (stateRef.current.bridges || []).find(function (x) {
      return x.id === id;
    });
    if (!b) return null;
    var f = islMap[b.from],
        t = islMap[b.to];
    if (!f || !t) return null;
    var fx = f.x * SCALE + PADDING,
        fy = f.y * SCALE + PADDING;
    var tx = t.x * SCALE + PADDING,
        ty = t.y * SCALE + PADDING;
    return { type: b.type, midX: (fx + tx) / 2, midY: (fy + ty) / 2 };
  };
  // 法向座標：島嶼出發 = 島中心在法向的分量；橋樑出發 = 橋中點在法向的分量
  var dragAxisNormal = function dragAxisNormal(d, main) {
    if (d.kind === 'island') {
      var c = islandCenter(d.id);
      return c ? main === 'h' ? c.y : c.x : null;
    }
    var ax = bridgeAxis(d.id);
    return ax ? main === 'h' ? ax.midY : ax.midX : null;
  };

  // 拖曳提交門檻：拉超過 max(24, 島間距×0.35) 才算數
  var dragCommitInfo = function dragCommitInfo(d, dx, dy) {
    var ax = Math.abs(dx),
        ay = Math.abs(dy);
    var main = ax >= ay ? 'h' : 'v';
    var len = main === 'h' ? ax : ay;
    var spacing = SCALE;
    if (d.targetId) {
      var rlv = stateRef.current.randomLevelData;
      var islands = rlv && rlv.islands ? rlv.islands : [];
      var islMap = {};islands.forEach(function (i) {
        islMap[i.id] = i;
      });
      var b = (stateRef.current.bridges || []).find(function (x) {
        return x.id === d.targetId;
      });
      if (b) {
        var f = islMap[b.from],
            t = islMap[b.to];
        if (f && t) spacing = Math.hypot(t.x - f.x, t.y - f.y) * SCALE;
      }
    }
    return { main: main, len: len, threshold: Math.max(24, spacing * 0.35) };
  };

  // 預覽線長度上限：有目標橋時 = 起點到拖曳方向那端島的距離，否則 120
  var dragPreviewMaxLen = function dragPreviewMaxLen(d, main, dir, sx, sy) {
    var rlv = stateRef.current.randomLevelData;
    var islands = rlv && rlv.islands ? rlv.islands : [];
    var islMap = {};islands.forEach(function (i) {
      islMap[i.id] = i;
    });
    if (d.targetId) {
      var b = (stateRef.current.bridges || []).find(function (x) {
        return x.id === d.targetId;
      });
      if (b) {
        var targetIslandId = null;
        if (d.kind === 'island') {
          targetIslandId = b.from === d.id ? b.to : b.from;
        } else {
          var f = islMap[b.from],
              t = islMap[b.to];
          if (f && t) {
            var fx = f.x * SCALE + PADDING,
                fy = f.y * SCALE + PADDING;
            var tx = t.x * SCALE + PADDING,
                ty = t.y * SCALE + PADDING;
            var toF = main === 'h' ? Math.sign(fx - sx) === dir : Math.sign(fy - sy) === dir;
            targetIslandId = toF ? b.from : b.to;
          }
        }
        var o = islMap[targetIslandId];
        if (o) {
          var ox = o.x * SCALE + PADDING,
              oy = o.y * SCALE + PADDING;
          return Math.max(0, Math.hypot(ox - sx, oy - sy));
        }
      }
    }
    return 120;
  };

  // 每幀更新預覽線：起點 = 手指按下點的軸向座標 × 軸線的法向座標（從手指開始、貼在橋線上）
  var updateDragPreview = function updateDragPreview(d, dx, dy) {
    var line = dragPreviewLineRef.current,
        tip = dragPreviewTipRef.current;
    if (!line || !tip) return;
    var info = dragCommitInfo(d, dx, dy);
    var main = info.main;
    var fixed = dragAxisNormal(d, main);
    if (fixed === null) return;
    var sx = main === 'h' ? d.startX : fixed;
    var sy = main === 'h' ? fixed : d.startY;
    var dir = main === 'h' ? Math.sign(dx) || 1 : Math.sign(dy) || 1;
    var maxLen = dragPreviewMaxLen(d, main, dir, sx, sy);
    var cl = Math.min(info.len, maxLen);
    var ex = main === 'h' ? sx + dir * cl : sx;
    var ey = main === 'v' ? sy + dir * cl : sy;
    line.setAttribute('x1', sx);line.setAttribute('y1', sy);
    line.setAttribute('x2', ex);line.setAttribute('y2', ey);
    tip.setAttribute('cx', ex);tip.setAttribute('cy', ey);
    line.style.display = 'block';tip.style.display = 'block';
  };

  var handlePointerDown = function handlePointerDown(e) {
    // 雙指介入：取消拖曳架橋與空白捲動，讓 pinch 縮放接管
    if (e.isPrimary === false) {
      if (dragDrawRef.current) {
        clearDragTimer(dragDrawRef.current);dragDrawRef.current = null;hideDragPreview();
      }
      panRef.current = null;
      if (interactionMode < 2) {
        setHoveredIslandId(null);setHoveredBridgeId(null);
      }
    }
    if (interactionMode < 2 && e.target.tagName && e.target.tagName.toLowerCase() === 'svg') {
      setHoveredIslandId(null);
      setHoveredBridgeId(null);
      // 空白處單指按下 → 手動捲動（svg 已是 touch-action:none，瀏覽器不會代勞捲動）
      if (e.isPrimary && !dragDrawRef.current && !panRef.current) {
        panRef.current = { lastX: e.clientX, lastY: e.clientY };
      }
    }

    var pt = getSvgCoords(e.clientX, e.clientY);
    if (!pt) return;

    if (interactionMode === 2) {
      e.target.setPointerCapture(e.pointerId);
      if (drawSubMode === 'pen') {
        isDrawingRef.current = true;
        currentPathDataRef.current = 'M ' + pt.x + ' ' + pt.y;
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
    var msg = { type: 'CLICK', uid: myId, x: pt.x, y: pt.y };
    setRipples(function (prev) {
      return [].concat(_toConsumableArray(prev), [{ id: Date.now() + Math.random(), uid: myId, x: pt.x, y: pt.y, timestamp: Date.now() }]);
    });

    if (isHostRef.current) {
      connsRef.current.forEach(function (c) {
        return c.send(msg);
      });
    } else if (connRef.current) {
      connRef.current.send(msg);
    }
  };

  var handlePointerMove = function handlePointerMove(e) {
    // 拖曳架橋：方向判定 + 預覽線跟隨 + 即時高亮
    if (dragDrawRef.current && interactionMode < 2) {
      var dd = dragDrawRef.current;
      var pressed = e.buttons > 0 || e.pointerType === 'touch' && e.isPrimary;
      if (!pressed) {
        clearDragTimer(dd);
        dragDrawRef.current = null;
        hideDragPreview();
        setHoveredBridgeId(null);
      } else {
        var _pt = getSvgCoords(e.clientX, e.clientY);
        if (_pt) {
          var dx = _pt.x - dd.startX,
              dy = _pt.y - dd.startY;
          if (!dd.dragging && Math.hypot(dx, dy) > TAP_MOVE_TOL) {
            clearDragTimer(dd);
            dd.dragging = true;
            // 預覽線起點改為每幀投影（updateDragPreview 內計算），不再快照島中心/橋中點
          }
          if (dd.dragging) {
            var t = resolveDragTarget(dd, dx, dy);
            if (t !== dd.targetId) {
              var wasNull = !dd.targetId;
              dd.targetId = t;
              setHoveredBridgeId(t);
              // 目標出現時輕 tick 一聲，加 150ms 遲滯避免抖動連播
              if (t && wasNull && Date.now() - (dd.lastTick || 0) > 150) {
                dd.lastTick = Date.now();
                try {
                  window.HASHI_SOUND.play('click');
                } catch (err2) {}
              }
            }
            updateDragPreview(dd, dx, dy);
          }
        }
      }
    }
    // 空白處單指拖曳 → 手動捲動棋盤（svg 為 touch-action:none 時的替代捲動）
    else if (panRef.current && interactionMode < 2 && e.isPrimary) {
        var pan = panRef.current;
        var zc = zoomContainerRef.current;
        if (zc && (e.buttons > 0 || e.pointerType === 'touch')) {
          zc.scrollLeft -= e.clientX - pan.lastX;
          zc.scrollTop -= e.clientY - pan.lastY;
          pan.lastX = e.clientX;pan.lastY = e.clientY;
        }
      }
    if (interactionMode === 2) {
      var _pt2 = getSvgCoords(e.clientX, e.clientY);
      if (drawSubMode === 'eraser') {
        if (_pt2 && eraserRef.current) {
          eraserRef.current.setAttribute('cx', _pt2.x);
          eraserRef.current.setAttribute('cy', _pt2.y);
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
        if (_pt2 && currentPathDataRef.current) {
          currentPathDataRef.current += ' L ' + _pt2.x + ' ' + _pt2.y;
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
    var pt = getSvgCoords(e.clientX, e.clientY);
    if (pt) {
      var msg = { type: 'CURSOR', uid: myId, x: pt.x, y: pt.y };
      if (isHostRef.current) {
        connsRef.current.forEach(function (c) {
          return c.send(msg);
        });
      } else if (connRef.current) {
        connRef.current.send(msg);
      }
    }
  };

  var handlePointerUp = function handlePointerUp(e) {
    // 只處理真正的放開與取消；svg 的 onPointerLeave 不再經由這裡結算拖曳，
    // 避免邊界事件（特別是 iOS 上 pointer capture 相關的）誤殺進行中的手勢
    if (e.type !== 'pointerup' && e.type !== 'pointercancel') return;
    panRef.current = null;
    // 拖曳架橋手勢結算（pointercancel 只清空、不結算）
    var dd = dragDrawRef.current;
    if (dd) {
      clearDragTimer(dd);
      dragDrawRef.current = null;
      hideDragPreview();
      if (e.type !== 'pointercancel' && interactionMode < 2 && !isWon) {
        var pt = getSvgCoords(e.clientX, e.clientY);
        var dx = pt ? pt.x - dd.startX : 0,
            dy = pt ? pt.y - dd.startY : 0;
        var moved = Math.hypot(dx, dy);
        var dt = Date.now() - (dd.startT || 0);
        var cDrift = Math.hypot(e.clientX - (dd.startCX || 0), e.clientY - (dd.startCY || 0));
        if (!dd.dragging && dt < TAP_MAX_MS && cDrift <= 22) {
          // v1.56.0（F1 同類修）：容錯改 client 22px——舊制 12 SVG 單位在手機上只值約 6–12 實體 px，手指微滾就把點按橋吞掉
          // 點擊：同點或相近位置、快速按下放開（有容錯率）→ 只有橋樑能點，島嶼不做事
          if (dd.kind === 'bridge') handleBridgeClick(dd.id);
        } else if (dd.dragging && dd.targetId) {
          // 拖曳：有目標且拉超過門檻才真正架橋
          var info = dragCommitInfo(dd, dx, dy);
          if (info.len > info.threshold) handleBridgeClick(dd.targetId);
        }
        // 其餘狀況（按住超時未動、拖曳未達門檻）→ 取消，什麼都不做
      }
      if (interactionMode < 2) {
        setHoveredIslandId(null);setHoveredBridgeId(null);
      }
    }
    if (interactionMode === 2) {
      if (drawSubMode === 'pen' && isDrawingRef.current) {
        isDrawingRef.current = false;
        if (e.type === 'pointercancel') {
          currentPathDataRef.current = "";if (drawingPathRef.current) drawingPathRef.current.style.display = 'none';
        } // pointercancel 比照架橋手勢：作廢不結算，不可把半截筆觸送出（稽核修）
        else if (currentPathDataRef.current) {
            var newStrokes = [].concat(_toConsumableArray(stateRef.current.strokes), [{ id: Date.now() + '-' + myId, uid: myId, path: currentPathDataRef.current }]);
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

  var clearOwnStrokes = function clearOwnStrokes() {
    var newStrokes = stateRef.current.strokes.filter(function (s) {
      return !s.id.endsWith('-' + myId);
    });
    raceAwareSync({ strokes: newStrokes });
    showToast("🗑️ 已清除你所有的塗鴉");
  };

  var clearAllStrokes = function clearAllStrokes() {
    if (isHostRef.current) {
      raceAwareSync({ strokes: [] });
      showToast("🚨 房主已清空全場塗鴉");
    }
  };

  var purgeGhostPlayers = function purgeGhostPlayers() {
    if (!isHostRef.current) return;
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
          return c.send({ type: 'PLAYERS_UPDATE', players: newList });
        });
        connsRef.current.forEach(function (c) {
          return c.send({ type: 'REQ_REJOIN' });
        });
      }
      return newList;
    });
  };

  var syncState = function syncState(partial) {
    var shouldBroadcast = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (partial.bridges !== undefined) setBridges(partial.bridges);
    if (partial.showSolution !== undefined) setShowSolution(partial.showSolution);
    if (partial.randomLevelData !== undefined) setRandomLevelData(partial.randomLevelData);
    if (partial.startTime !== undefined) setStartTime(partial.startTime);
    if (partial.levelId !== undefined) setCurrentLevelId(partial.levelId);
    if (partial.strokes !== undefined) setStrokes(partial.strokes);

    var updatedState = _extends({}, stateRef.current, partial);
    stateRef.current = updatedState;

    if (shouldBroadcast) {
      if (engineRef.current === 'peerjs') {
        if (isHostRef.current) {
          connsRef.current.forEach(function (c) {
            return c.send({ type: 'SYNC', data: updatedState });
          });
        } else if (connRef.current) {
          connRef.current.send({ type: 'SYNC', data: updatedState });
        }
      }
    }
  };

  // ⚔️ 大亂鬥道具系統
  var BRAWL_ITEMS = [{ key: 'bomb', icon: '💣', name: '炸橋', w: 3 }, { key: 'fog', icon: '🌫️', name: '迷霧', w: 2 }, { key: 'gift', icon: '🎁', name: '禮物', w: 2 }];
  // 道具列固定順序：禮物放正中間（使用者定案）
  var BRAWL_BAR_ORDER = ['bomb', 'gift', 'fog'];
  var applyBrawlSettings = function applyBrawlSettings(settings, broadcast) {
    if (!settings) return;
    brawlSettingsRef.current = settings;
    setBrawlSettings(settings);
    stateRef.current = _extends({}, stateRef.current, { brawlSettings: settings });
    if (broadcast && isHostRef.current) {
      connsRef.current.forEach(function (c) {
        if (c.open) c.send({ type: 'BRAWL_SETTINGS', settings: settings });
      });
    }
  };
  var sendBrawlMsg = function sendBrawlMsg(msg) {
    try {
      if (isHostRef.current) {
        connsRef.current.forEach(function (c) {
          if (c.open) c.send(msg);
        });
      } else if (connRef.current && connRef.current.open) {
        connRef.current.send(msg);
      }
    } catch (e) {}
  };
  var pickRandomItem = function pickRandomItem() {
    // 里程碑道具種類：炸橋／迷霧各半（使用者定案）——禮物不走里程碑彩券，禮物只由「完成總島數每 1/20」的島嶼系統發放
    var pool = BRAWL_ITEMS.filter(function (x) {
      return x.key === 'bomb' || x.key === 'fog';
    });
    return pool[Math.floor(Math.random() * pool.length)];
  };
  // 道具機率公式（使用者定案，兩款同形、保底統一 0.1）：禮物權重 = (1 − p)² + 保底（平方扶弱）；
  // 陷阱：先取 1 − p 再套同一個禮物公式 → 權重 = (1 − (1 − p))² + 保底 = p² + 保底（越強越容易被打，分布明顯拉開）。
  // 抽選在候選集合內正規化；完賽者本來就被排除在候選之外（100% 即退出計算）。
  var platProgWeights = function platProgWeights(progs, mode, floor) {
    var f = floor == null ? 0.1 : floor;
    if (mode === 'attack') return progs.map(function (x) {
      var q = Math.min(1, Math.max(0, x || 0));return q * q + f;
    });
    return progs.map(function (x) {
      var d = 1 - Math.min(1, Math.max(0, x || 0));return d * d + f;
    });
  };
  var platPickWeighted = function platPickWeighted(items, ws) {
    var T = ws.reduce(function (a, b) {
      return a + b;
    }, 0);
    if (!(T > 0) || !items.length) return items[Math.floor(Math.random() * items.length)];
    var r = Math.random() * T;
    for (var i = 0; i < items.length; i++) {
      r -= ws[i];if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  };
  // 里程碑發放（房主執行，比照數獨）：抽一件道具，再依進度比例公式抽一位收件人
  var handleBrawlMilestone = function handleBrawlMilestone(m) {
    if (!isHostRef.current) return;
    if (!brawlSettingsRef.current.itemsEnabled) return;
    var key = m.uid + '@' + m.threshold;
    if (hostMilestonesRef.current[key]) return;
    hostMilestonesRef.current[key] = true;
    var racerIds = racersRef.current || [];
    var cands = playersListRef.current.filter(function (pl) {
      return pl.id && !raceResultsRef.current[pl.id] && !(pl.id === myId && myFinishTimeRef.current != null) && (racerIds.length === 0 || racerIds.indexOf(pl.id) >= 0);
    });
    if (!cands.length) return;
    var item = cands.length === 1 ? BRAWL_ITEMS.find(function (x) {
      return x.key === 'gift';
    }) : pickRandomItem(); // 只剩最後一位：沒有對手可打，里程碑只發禮物加速他完賽（使用者定案）
    var progs = cands.map(function (pl) {
      var info = raceProgressRef.current[pl.id];return info ? info.progress : 0;
    });
    var sel = platPickWeighted(cands, platProgWeights(progs, 'grant'));
    var grant = { type: 'BRAWL_GRANT', toUid: sel.id, item: item.key, fromUid: m.uid };
    sendBrawlMsg(grant);
    if (sel.id === myId) applyBrawlGrant(grant);
  };
  // 最後一位規則（使用者定案）：只剩我一人在場上（其他選手皆完賽或 DNF）時，攻擊道具沒有對手可用——
  // 手邊庫存全轉禮物、之後收到的也直接轉禮物、房主發放也只發禮物，讓最後一位加速完賽，其他人不用乾等。
  var lastOneRef = useRef(false);
  var amLastRacer = function amLastRacer() {
    if (raceStateRef.current !== 'racing' || myFinishTimeRef.current != null) return false;
    var racers = racersRef.current || [];
    if (racers.length < 2 || racers.indexOf(myId) < 0) return false;
    return racers.every(function (uid) {
      return uid === myId || raceResultsRef.current[uid];
    });
  };
  var maybeConvertLastOne = function maybeConvertLastOne() {
    if (lastOneRef.current || !amLastRacer()) return;
    lastOneRef.current = true;
    var cur = myItemsRef.current;
    var conv = cur.filter(function (x) {
      return x !== 'gift';
    }).length;
    if (conv > 0) {
      var ni = cur.map(function () {
        return 'gift';
      });
      myItemsRef.current = ni;setMyItems(ni);
      showToast('🏁 只剩你一人！手邊 ' + conv + ' 個攻擊道具全部轉換成 🎁 禮物，加速完賽！');
      if (ni.length >= 3) setTimeout(function () {
        return autoFireBrawlItem('gift');
      }, 650); // 禮物湊滿 3 個照舊自動連發（同規則一致）
    } else {
      showToast('🏁 只剩你一人！接下來的里程碑道具都會是 🎁 禮物');
    }
  };
  var applyBrawlGrant = function applyBrawlGrant(m) {
    if (!m || m.toUid !== myId) return;
    if (!BRAWL_ITEMS.find(function (x) {
      return x.key === m.item;
    })) return;
    if (myFinishTimeRef.current != null) return; // 已完賽不再獲得道具（盤面凍結）
    var effItem = m.item !== 'gift' && amLastRacer() ? 'gift' : m.item; // 已是最後一位：還在飛的攻擊道具入包時直接轉禮物
    var meta = BRAWL_ITEMS.find(function (x) {
      return x.key === effItem;
    });
    if (myItemsRef.current.filter(function (x) {
      return x === effItem;
    }).length >= 3) return; // 已有 3 個且自動發動排程中（理論上不會發生），多的不收
    var ni = myItemsRef.current.concat([effItem]);
    myItemsRef.current = ni;setMyItems(ni);
    if (effItem === 'gift' && m.fromUid && m.fromUid !== myId) {
      try {
        if (window.PlatFly) PlatFly.fly(PlatFly.byUid('hashi', m.fromUid), PlatFly.me('hashi') || PlatFly.byUid('hashi', myId), '🎁');
      } catch (e) {}
    } // H3 禮物 Fly（純顯示層）
    showToast('🎁 里程碑道具：你獲得 ' + meta.icon + ' ' + meta.name + '！');
    if (ni.filter(function (x) {
      return x === effItem;
    }).length >= 3) setTimeout(function () {
      return autoFireBrawlItem(effItem);
    }, 650); // 集滿 3 個 → 自動連續發動並歸零（禮物也同規，使用者定案）
    try {
      window.HASHI_SOUND.play('star');
    } catch (e) {}
  };
  // 短暫特效標記（💥炸橋／✨禮物補橋）：出現在盤面座標上、動畫播完自動消失，不進同步
  var pushFxMark = function pushFxMark(gx, gy, icon, ms) {
    var mk = { id: 'mk' + Date.now() + '-' + Math.floor(Math.random() * 100000), gx: gx, gy: gy, icon: icon, until: Date.now() + (ms || 800) };
    var nm = (fxRef.current.marks || []).concat([mk]);
    fxRef.current.marks = nm;setFxMarks(nm);
  };
  var applyGift = function applyGift() {
    var rld = stateRef.current.randomLevelData;
    var sol = rld && rld.solution || [];
    var mine = stateRef.current.bridges || [];
    var islMap = {};(rld && rld.islands || []).forEach(function (i) {
      islMap[i.id] = i;
    });
    var segCross = function segCross(a, b) {
      var af = islMap[a.from],
          at = islMap[a.to],
          bf = islMap[b.from],
          bt = islMap[b.to];
      if (!af || !at || !bf || !bt) return false;
      var aH = af.y === at.y,
          bH = bf.y === bt.y;
      if (aH === bH) return false;
      var hp = aH ? [af, at] : [bf, bt];var vp = aH ? [bf, bt] : [af, at];
      var hx1 = Math.min(hp[0].x, hp[1].x),
          hx2 = Math.max(hp[0].x, hp[1].x);
      var vy1 = Math.min(vp[0].y, vp[1].y),
          vy2 = Math.max(vp[0].y, vp[1].y);
      return vp[0].x > hx1 && vp[0].x < hx2 && hp[0].y > vy1 && hp[0].y < vy2;
    };
    var samePair = function samePair(x, y) {
      return x.from === y.from && x.to === y.to || x.from === y.to && x.to === y.from;
    };
    var cands = sol.filter(function (solB) {
      var cur = mine.find(function (b) {
        return samePair(b, solB);
      });
      if (!cur || cur.locked) return false; // 禮物補過的橋已鎖定，不重複補
      if (cur.count >= solB.count) return false; // 實線已補滿
      if (cur.count + (cur.draftCount || 0) > solB.count) return false; // 草稿太多（總量超過解答量）先不補，避免衝破上限 2
      return !mine.some(function (b) {
        return b.count + (b.draftCount || 0) > 0 && !samePair(b, solB) && segCross(solB, b);
      }); // 交叉阻擋也要算草稿橋，否則補出的實線會跨過既有草稿
    });
    if (!cands.length) {
      showToast('🎁 目前沒有能補上的正確橋');return false;
    }
    var pickB = cands[Math.floor(Math.random() * cands.length)];
    // 禮物：直接把這對島的正確橋補滿（解答是雙橋就補兩條），草稿一併轉實線，並標 locked 鎖定——之後點按/拖曳/炸橋都不能改它
    var nb = mine.map(function (b) {
      return samePair(b, pickB) ? _extends({}, b, { count: pickB.count, draftCount: 0, owner: myId, locked: true }) : b;
    });
    raceAwareSync({ bridges: nb });
    var gf = islMap[pickB.from],
        gt = islMap[pickB.to];
    if (gf && gt) pushFxMark((gf.x + gt.x) / 2, (gf.y + gt.y) / 2, '✨', 900); // 補橋處閃光動畫（不閃現）
    showToast('🎁 禮物幫你把一對島的正確橋補滿並鎖定了！');
    try {
      window.HASHI_SOUND.play('bridge');
    } catch (e) {}
    return true;
  };
  var applyBrawlItem = function applyBrawlItem(m) {
    if (!m || m.targetUid !== myId) return;
    // 完賽凍結（比照數獨 isSpectator 守衛）：已完賽者的盤面不再受任何道具影響
    if (myFinishTimeRef.current != null) {
      showToast('🏁 你已完賽，盤面凍結，' + (m.fromName || '對手') + ' 的道具對你無效！');return;
    }
    var now = Date.now();
    if (m.item === 'bomb') {
      var cur = (stateRef.current.bridges || []).filter(function (b) {
        return b.count > 0 && !b.locked;
      }); // 禮物鎖定的橋炸不掉
      if (!cur.length) {
        showToast('💣 ' + (m.fromName || '對手') + ' 想炸你的橋，但你還沒架橋！');return;
      }
      var victim = cur[Math.floor(Math.random() * cur.length)];
      var nb = stateRef.current.bridges.map(function (b) {
        return b.id === victim.id ? _extends({}, b, { count: b.count - 1, owner: b.count - 1 > 0 || (b.draftCount || 0) > 0 ? b.owner : null }) : b;
      });
      raceAwareSync({ bridges: nb });
      var islMapB = {};((stateRef.current.randomLevelData || {}).islands || []).forEach(function (i) {
        islMapB[i.id] = i;
      });
      var bf = islMapB[victim.from],
          bt = islMapB[victim.to];
      if (bf && bt) pushFxMark((bf.x + bt.x) / 2, (bf.y + bt.y) / 2, '💥', 750); // 爆炸動畫蓋在被炸的橋上（不閃現消失）
      showToast('💣 ' + (m.fromName || '對手') + ' 炸掉了你一條橋！');
      try {
        window.HASHI_SOUND.play('remove');
      } catch (e) {}
    } else if (m.item === 'fog') {
      var isls = (stateRef.current.randomLevelData || {}).islands || [];
      if (!isls.length) return;
      var c = isls[Math.floor(Math.random() * isls.length)];
      var fog = _extends({}, fxRef.current.fog);
      var hit = [];
      isls.forEach(function (i) {
        if (Math.abs(i.x - c.x) <= 2 && Math.abs(i.y - c.y) <= 2) {
          fog[i.id] = now + 10000;hit.push(i);
        }
      });
      fxRef.current.fog = fog;setFxFog(fog);
      if (hit.length) {
        // 雲霧（使用者定案：不要方框虛化，要一團團的雲）：命中當下一次算好雲團幾何（中心／半徑／puff 配置），渲染只負責畫
        var box = { id: 'fog' + now + '-' + Math.floor(Math.random() * 100000), minX: Math.min.apply(null, hit.map(function (i) {
            return i.x;
          })), minY: Math.min.apply(null, hit.map(function (i) {
            return i.y;
          })), maxX: Math.max.apply(null, hit.map(function (i) {
            return i.x;
          })), maxY: Math.max.apply(null, hit.map(function (i) {
            return i.y;
          })), until: now + 10000 };
        var ccx0 = (box.minX + box.maxX) / 2 * SCALE + PADDING,
            ccy0 = (box.minY + box.maxY) / 2 * SCALE + PADDING;
        var natR = Math.sqrt(Math.pow((box.maxX - box.minX) * SCALE / 2, 2) + Math.pow((box.maxY - box.minY) * SCALE / 2, 2)) + ISLAND_RADIUS + 16;
        var capR = Math.sqrt(svgW * svgH * 0.2 / Math.PI); // 上限：雲團外接圓面積 ≤ 盤面面積的 1/5（使用者定案）
        box.R = Math.max(60, Math.min(natR, capR));
        box.cx = svgW >= box.R * 2 ? Math.min(Math.max(ccx0, box.R), svgW - box.R) : svgW / 2; // 中心夾回盤內，雲不飄出界
        box.cy = svgH >= box.R * 2 ? Math.min(Math.max(ccy0, box.R), svgH - box.R) : svgH / 2;
        var seed = now % 2147483646 + 1;
        var rnd = function rnd() {
          seed = seed * 48271 % 2147483647;return seed / 2147483647;
        };
        var puffTpl = [[0, 0, 0.60], [-0.38, 0.17, 0.46], [0.40, 0.15, 0.44], [-0.30, -0.28, 0.40], [0.06, -0.40, 0.48], [0.40, -0.24, 0.37], [-0.60, 0.03, 0.33], [0.62, 0.05, 0.32]];
        box.puffs = puffTpl.map(function (t) {
          return { x: box.cx + (t[0] + (rnd() - 0.5) * 0.06) * box.R, y: box.cy + (t[1] + (rnd() - 0.5) * 0.06) * box.R, r: t[2] * box.R * (0.92 + rnd() * 0.16) };
        }); // 抖動收緊：任一 puff 的外緣都留在 R 內，上限才守得住
        var nbx = (fxRef.current.boxes || []).concat([box]);
        fxRef.current.boxes = nbx;setFxFogBoxes(nbx);
      }
      showToast('🌫️ ' + (m.fromName || '對手') + ' 放出一團雲霧罩住了你的一區，連橋都看不到了！');
    }
  };
  // 發動一次道具效果（不扣背包）：禮物用在自己、攻擊型自動打進度最高的未完賽對手；回傳是否真的發動
  var launchBrawlEffect = function launchBrawlEffect(key) {
    var meta = BRAWL_ITEMS.find(function (x) {
      return x.key === key;
    });
    if (!meta) return false;
    if (key === 'gift') return applyGift();
    // 攻擊目標：進度比例公式抽選（P(打 i) = p_i/Σp_候選）——越領先越容易中，但不是只有最強的會中
    var foes = playersListRef.current.filter(function (p) {
      if (p.id === myId) return false;
      if (raceResultsRef.current[p.id]) return false; // 已完賽者盤面凍結，不可攻擊
      if ((racersRef.current || []).length && racersRef.current.indexOf(p.id) < 0) return false; // 觀戰者不在場上
      return true;
    });
    if (!foes.length) return false;
    var foeProgs = foes.map(function (p) {
      var info = raceProgress[p.id];return info ? info.progress : 0;
    });
    var sel = platPickWeighted(foes, platProgWeights(foeProgs, 'attack'));
    sendBrawlMsg({ type: 'BRAWL_ITEM', item: key, fromUid: myId, fromName: myNameRef.current || '對手', targetUid: sel.id });
    showToast(meta.icon + ' 已對 ' + (sel.name || '對手') + ' 使用 ' + meta.name + '！');
    return true;
  };
  var useBrawlItem = function useBrawlItem(key) {
    if (raceStateRef.current !== 'racing') return;
    if (myFinishTimeRef.current != null) {
      showToast('🏁 你已完賽，不能再使用道具');return;
    }
    var idx = myItemsRef.current.indexOf(key);
    if (idx < 0) return;
    if (!launchBrawlEffect(key)) {
      if (key !== 'gift') showToast('⚠️ 沒有對手可以攻擊');return;
    } // 發動失敗不消耗（禮物無可補時 applyGift 已自己提示）
    var ni = myItemsRef.current.slice();ni.splice(idx, 1);
    myItemsRef.current = ni;setMyItems(ni);
  };
  // 集滿 3 個同種道具 → 自動連續發動 3 次並歸零（使用者定案：防囤積到最後一次逆轉；未滿 3 仍可手動用）
  var autoFireBrawlItem = function autoFireBrawlItem(key) {
    if (brawlAutoRef.current[key]) return;
    if (myItemsRef.current.filter(function (x) {
      return x === key;
    }).length < 3) return;
    brawlAutoRef.current[key] = true;
    var removed = 0;var ni = [];
    myItemsRef.current.forEach(function (x) {
      if (x === key && removed < 3) removed++;else ni.push(x);
    });
    myItemsRef.current = ni;setMyItems(ni); // 先歸零，效果再逐發送出——期間新獲得的同種從 0 重新累積
    var meta = BRAWL_ITEMS.find(function (x) {
      return x.key === key;
    });
    showToast('🎒 集滿 3 個 ' + (meta ? meta.icon + ' ' + meta.name : key) + '，自動連續發動！');
    try {
      window.HASHI_SOUND.play('star');
    } catch (e) {}
    var fired = 0;
    var step = function step() {
      if (fired >= 3) {
        brawlAutoRef.current[key] = false;return;
      }
      fired++;
      if (raceStateRef.current === 'racing' && myFinishTimeRef.current == null) launchBrawlEffect(key); // 每發重選目標／重算可補的橋；無目標或無可補時該發落空
      setTimeout(step, 550);
    };
    setTimeout(step, 400);
  };
  // 👁️ 上帝視角盤面（唯讀）：modal 與觀戰面板共用；島數字受「上帝視角顯示數字」設定
  var renderGodBoard = function renderGodBoard(board) {
    if (!board || !randomLevelData) return null;
    var isls = randomLevelData.islands || [];
    if (!isls.length) return null;
    var islMap = {};isls.forEach(function (i) {
      islMap[i.id] = i;
    });
    var counts = {};isls.forEach(function (i) {
      counts[i.id] = 0;
    });
    (board.bridges || []).forEach(function (b) {
      if (counts[b.from] !== undefined) counts[b.from] += b.count;if (counts[b.to] !== undefined) counts[b.to] += b.count;
    });
    var maxGX = Math.max.apply(Math, isls.map(function (i) {
      return i.x;
    }).concat([6]));
    var maxGY = Math.max.apply(Math, isls.map(function (i) {
      return i.y;
    }).concat([6]));
    var gw = (maxGX + 1) * SCALE + PADDING * 2;
    var gh = (maxGY + 1) * SCALE + PADDING * 2;
    return React.createElement(
      'svg',
      { viewBox: '0 0 ' + gw + ' ' + gh, className: 'w-full h-auto bg-[#f6fdf6] rounded-xl border-2 border-slate-200' },
      (board.bridges || []).map(function (b) {
        var f = islMap[b.from],
            t = islMap[b.to];
        if (!f || !t || b.count === 0 && !(b.draftCount > 0)) return null;
        var x1 = f.x * SCALE + PADDING,
            y1 = f.y * SCALE + PADDING,
            x2 = t.x * SCALE + PADDING,
            y2 = t.y * SCALE + PADDING;
        var horiz = f.y === t.y;
        var off = 4;
        var lines = [];
        if (b.count >= 1) {
          if (b.count === 2) {
            lines.push(React.createElement('line', { key: b.id + '-a', x1: x1 + (horiz ? 0 : -off), y1: y1 + (horiz ? -off : 0), x2: x2 + (horiz ? 0 : -off), y2: y2 + (horiz ? -off : 0), stroke: b.locked ? '#000000' : '#1e293b', strokeWidth: '4', strokeLinecap: 'round' }));
            lines.push(React.createElement('line', { key: b.id + '-b', x1: x1 + (horiz ? 0 : off), y1: y1 + (horiz ? off : 0), x2: x2 + (horiz ? 0 : off), y2: y2 + (horiz ? off : 0), stroke: b.locked ? '#000000' : '#1e293b', strokeWidth: '4', strokeLinecap: 'round' }));
          } else {
            lines.push(React.createElement('line', { key: b.id, x1: x1, y1: y1, x2: x2, y2: y2, stroke: b.locked ? '#000000' : '#1e293b', strokeWidth: '4', strokeLinecap: 'round' }));
          }
        } else if (b.draftCount > 0) {
          lines.push(React.createElement('line', { key: b.id + '-d', x1: x1, y1: y1, x2: x2, y2: y2, stroke: '#94a3b8', strokeWidth: '4', strokeDasharray: '6 5', strokeLinecap: 'round' }));
        }
        return React.createElement(
          'g',
          { key: 'gb-' + b.id },
          lines
        );
      }),
      isls.map(function (i) {
        var cx = i.x * SCALE + PADDING,
            cy = i.y * SCALE + PADDING;
        var done = counts[i.id] === i.req,
            over = counts[i.id] > i.req;
        return React.createElement(
          'g',
          { key: 'gi-' + i.id },
          React.createElement('circle', { cx: cx, cy: cy, r: ISLAND_RADIUS, fill: done ? '#d1fae5' : over ? '#fee2e2' : '#ffffff', stroke: done ? '#059669' : over ? '#dc2626' : '#1e293b', strokeWidth: '4' }),
          React.createElement(
            'text',
            { x: cx, y: cy + 2, textAnchor: 'middle', dominantBaseline: 'central', className: 'text-xl font-black font-sans', fill: '#1e293b' },
            brawlSettings.godNumbers ? i.req : '?'
          )
        );
      })
    );
  };
  var renderGodModal = function renderGodModal() {
    if (!godViewUid) return null;
    var board = brawlBoards[godViewUid];
    if (!board || !randomLevelData) return null;
    var opps = Object.keys(brawlBoards);
    return React.createElement(
      'div',
      { className: 'fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4', onClick: function onClick() {
          return setGodViewUid(null);
        } },
      React.createElement(
        'div',
        { className: 'bg-white rounded-2xl border-[4px] border-[#1e293b] shadow-[10px_10px_0px_#1e293b] p-4 w-full max-w-[430px] max-h-[92vh] overflow-y-auto', onClick: function onClick(e) {
            return e.stopPropagation();
          } },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between mb-2' },
          React.createElement(
            'h3',
            { className: 'font-black text-base md:text-lg text-[#1e293b]' },
            '\uD83D\uDC41\uFE0F \u4E0A\u5E1D\u8996\u89D2 \u2014 ',
            board.name,
            '\uFF08',
            Math.round((board.progress || 0) * 100),
            '%\uFF09'
          ),
          React.createElement(
            'button',
            { onClick: function onClick() {
                return setGodViewUid(null);
              }, className: 'w-8 h-8 shrink-0 bg-white border-2 border-slate-800 rounded-lg font-black shadow-[2px_2px_0px_rgba(30,41,59,1)]' },
            '\u2715'
          )
        ),
        opps.length > 1 && React.createElement(
          'div',
          { className: 'flex gap-1.5 mb-2 flex-wrap' },
          opps.map(function (u) {
            return React.createElement(
              'button',
              { key: u, onClick: function onClick() {
                  return setGodViewUid(u);
                }, className: "px-2.5 py-1 rounded-lg border-2 border-slate-800 font-black text-xs " + (u === godViewUid ? "bg-slate-800 text-white" : "bg-white text-slate-700") },
              brawlBoards[u].name
            );
          })
        ),
        renderGodBoard(board),
        React.createElement(
          'p',
          { className: 'text-[11px] font-bold text-slate-400 mt-2 text-center' },
          '\u5373\u6642\u540C\u6B65\u5C0D\u624B\u76E4\u9762\uFF08\u552F\u8B80\uFF09\u30FB\u9EDE\u5916\u9762\u6216 \u2715 \u95DC\u9589'
        )
      )
    );
  };
  // 特效計時：到期自動清除（雲霧的淡出靠 fxNow 每 500ms 推進＋CSS transition 補間）
  useEffect(function () {
    var hasFx = Object.keys(fxFog).length > 0 || fxFogBoxes.length > 0 || fxMarks.length > 0;
    if (!hasFx) return;
    var iv = setInterval(function () {
      var now = Date.now();setFxNow(now);
      var prune = function prune(obj) {
        var n = {};var changed = false;Object.keys(obj).forEach(function (k) {
          if (obj[k] > now) n[k] = obj[k];else changed = true;
        });return changed ? n : obj;
      };
      var nf = prune(fxRef.current.fog);if (nf !== fxRef.current.fog) {
        fxRef.current.fog = nf;setFxFog(nf);
      }
      var nb = (fxRef.current.boxes || []).filter(function (b) {
        return b.until > now;
      });if (nb.length !== (fxRef.current.boxes || []).length) {
        fxRef.current.boxes = nb;setFxFogBoxes(nb);
      }
      var nm = (fxRef.current.marks || []).filter(function (mk) {
        return mk.until > now;
      });if (nm.length !== (fxRef.current.marks || []).length) {
        fxRef.current.marks = nm;setFxMarks(nm);
      }
    }, 500);
    return function () {
      return clearInterval(iv);
    };
  }, [fxFog, fxFogBoxes, fxMarks]);

  // 🏁 競速進度推送：用最新的 bridges 直接計算並廣播（架橋當下同步呼叫，不依賴 effect 時序）
  var pushRaceProgress = function pushRaceProgress(bridgesArr) {
    if (raceStateRef.current !== 'racing') return;
    var rld = stateRef.current && stateRef.current.randomLevelData || randomLevelData;
    var islands = rld && rld.islands || [];
    if (islands.length === 0) return;
    var counts = {};
    islands.forEach(function (i) {
      counts[i.id] = 0;
    });
    (bridgesArr || []).forEach(function (b) {
      var t = (b.count || 0) + (b.draftCount || 0);
      if (counts[b.from] !== undefined) counts[b.from] += t;
      if (counts[b.to] !== undefined) counts[b.to] += t;
    });
    var done = 0;
    islands.forEach(function (isl) {
      if (counts[isl.id] === isl.req) done++;
    });
    var p = done / islands.length;
    if (brawlSettingsRef.current.itemsEnabled) {
      for (var t = 5; t <= 100; t += 5) {
        if (p * 100 >= t && !milestonesRef.current[t]) {
          milestonesRef.current[t] = true;var mm = { type: 'BRAWL_MILESTONE', uid: myId, threshold: t };if (isHostRef.current) handleBrawlMilestone(mm);else sendBrawlMsg(mm);
        }
      } // 里程碑每 5% 一格（5→100 共 20 格）
      // 島嶼禮物額度（2026-11-02 使用者糾正，與里程碑脫鉤）：只有「對照解答、全實線」的島嶼完成才算——
      // 草稿虛線不算進完成（舊版 counts 把 draftCount 也加進去，虛線湊滿就亮綠燈照送）；只湊滿數字（橋架錯對象、條數分配錯）也不算。
      // 判定：該島牽涉的每一對（解答有的＋實線有的）其實線條數都必須與解答完全一致。額度以單位制只增不減（每完成總島數 1/20 入帳 1）。
      var solPairs = {};
      (rld && rld.solution || []).forEach(function (sb) {
        solPairs[sb.from < sb.to ? sb.from + '|' + sb.to : sb.to + '|' + sb.from] = sb.count;
      });
      var solidPairs = {};
      (bridgesArr || []).forEach(function (b) {
        if ((b.count || 0) > 0) solidPairs[b.from < b.to ? b.from + '|' + b.to : b.to + '|' + b.from] = b.count;
      });
      var strictDone = 0;
      islands.forEach(function (isl) {
        var sid = String(isl.id),
            rel = {};
        Object.keys(solPairs).forEach(function (k) {
          var ab = k.split('|');if (ab[0] === sid || ab[1] === sid) rel[k] = true;
        });
        Object.keys(solidPairs).forEach(function (k) {
          var ab = k.split('|');if (ab[0] === sid || ab[1] === sid) rel[k] = true;
        });
        var ok = true;
        Object.keys(rel).forEach(function (k) {
          if ((solidPairs[k] || 0) !== (solPairs[k] || 0)) ok = false;
        });
        if (ok) strictDone++;
      });
      var giftUnits = Math.floor(strictDone * 20 / islands.length);
      if (giftUnits > hashiGiftUnitsRef.current) {
        hashiGiftCreditRef.current += giftUnits - hashiGiftUnitsRef.current;hashiGiftUnitsRef.current = giftUnits;
      }
      // 島嶼禮物（使用者定案，比照數獨扶弱）：額度逐一送給比自己弱的未完賽對手（差距平方根加權抽一位）；沒有較弱對手時額度存著，等下次進度推送再試
      while (hashiGiftCreditRef.current > 0) {
        var weaker = playersListRef.current.filter(function (pl) {
          if (!pl.id || pl.id === myId) return false;
          if (raceResultsRef.current[pl.id]) return false; // 已完賽者不收
          if ((racersRef.current || []).length && racersRef.current.indexOf(pl.id) < 0) return false; // 觀戰者不在場上
          var info = raceProgressRef.current[pl.id];
          return (info ? info.progress : 0) < p;
        });
        if (!weaker.length) break;
        var ws = weaker.map(function (pl) {
          var info = raceProgressRef.current[pl.id];return Math.sqrt(Math.max(0.01, p - (info ? info.progress : 0)));
        });
        var sel = platPickWeighted(weaker, ws);
        sendBrawlMsg({ type: 'BRAWL_GRANT', toUid: sel.id, item: 'gift', fromUid: myId });
        try {
          if (window.PlatFly) PlatFly.fly(PlatFly.byUid('hashi', myId), PlatFly.byUid('hashi', sel.id), '🎁');
        } catch (e) {} // H3 禮物 Fly（純顯示層）
        hashiGiftCreditRef.current -= 1;
      }
    }
    var nowB = Date.now();
    if (nowB - lastBrawlSentRef.current > 700) {
      lastBrawlSentRef.current = nowB;
      sendBrawlMsg({ type: 'BRAWL_STATE', uid: myId, name: myNameRef.current || '你', color: myColorRef.current, progress: p, bridges: bridgesArr });
    }
    saveHashiResume(bridgesArr);
    var now = Date.now();
    if (p === lastProgressValRef.current && now - lastProgressSentRef.current <= 1000) return; // 節流
    lastProgressValRef.current = p;
    lastProgressSentRef.current = now;
    var info = { progress: p, name: myNameRef.current || '你', color: myColorRef.current };
    setRaceProgress(function (prev) {
      return _extends({}, prev, _defineProperty({}, myId, info));
    });
    var msg = { type: 'RACE_PROGRESS', uid: myId, name: info.name, color: info.color, progress: p };
    try {
      if (isHostRef.current) {
        connsRef.current.forEach(function (c) {
          if (c.open) c.send(msg);
        });
      } else if (connRef.current && connRef.current.open) {
        connRef.current.send(msg);
      }
    } catch (e) {}
  };

  // 🏁 競速中：橋樑/塗鴉只改本地，不廣播（防偷看、防互相覆蓋）
  var raceAwareSync = function raceAwareSync(partial) {
    if (raceStateRef.current === 'countdown' || raceStateRef.current === 'racing' || raceStateRef.current === 'finished') {
      if (partial.bridges !== undefined) {
        setBridges(partial.bridges);
        pushRaceProgress(partial.bridges);
      }
      if (partial.strokes !== undefined) setStrokes(partial.strokes);
      if (partial.showSolution !== undefined) setShowSolution(partial.showSolution);
      stateRef.current = _extends({}, stateRef.current, partial);
    } else {
      syncState(partial);
    }
  };

  // ⭐ 最佳紀錄：hashi_best_{W}x{H}
  var recordBest = function recordBest(secs) {
    try {
      var w = randomLevelData.width,
          h = randomLevelData.height;
      var key = 'hashi_best_' + w + 'x' + h;
      var prev = parseInt(localStorage.getItem(key) || '0', 10);
      if (!prev || secs < prev) {
        localStorage.setItem(key, String(secs));
        setIsNewBest(true);
      } else {
        setIsNewBest(false);
      }
    } catch (e) {}
  };

  var resetWinMeta = function resetWinMeta() {
    setStars(0);setIsNewBest(false);setBursts([]);
    prevIslandDoneRef.current = {};
  };

  var islandCurrentCounts = useMemo(function () {
    var counts = {};
    var islands = randomLevelData && randomLevelData.islands ? randomLevelData.islands : [];
    islands.forEach(function (i) {
      counts[i.id] = { total: 0, real: 0 };
    });
    (bridges || []).forEach(function (b) {
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

  var crossedBridgeIds = useMemo(function () {
    var crossed = new Set();
    var islMap = {};
    var bList = bridges || [];
    var islands = randomLevelData && randomLevelData.islands ? randomLevelData.islands : [];
    islands.forEach(function (i) {
      islMap[i.id] = i;
    });

    var activeV = bList.filter(function (b) {
      return b.count + (b.draftCount || 0) > 0 && b.type === 'v';
    });
    var activeH = bList.filter(function (b) {
      return b.count + (b.draftCount || 0) > 0 && b.type === 'h';
    });

    bList.forEach(function (target) {
      if (target.count + (target.draftCount || 0) > 0) return;

      var tFrom = islMap[target.from];
      var tTo = islMap[target.to];
      if (!tFrom || !tTo) return;

      var isCross = false;
      if (target.type === 'h') {
        var y = tFrom.y;
        var minX = Math.min(tFrom.x, tTo.x);
        var maxX = Math.max(tFrom.x, tTo.x);
        for (var i = 0; i < activeV.length; i++) {
          var b = activeV[i];
          var bFrom = islMap[b.from],
              bTo = islMap[b.to];
          if (bFrom && bTo && bFrom.x > minX && bFrom.x < maxX && y > Math.min(bFrom.y, bTo.y) && y < Math.max(bFrom.y, bTo.y)) {
            isCross = true;break;
          }
        }
      } else {
        var x = tFrom.x;
        var minY = Math.min(tFrom.y, tTo.y);
        var maxY = Math.max(tFrom.y, tTo.y);
        for (var _i = 0; _i < activeH.length; _i++) {
          var _b = activeH[_i];
          var _bFrom = islMap[_b.from],
              _bTo = islMap[_b.to];
          if (_bFrom && _bTo && _bFrom.y > minY && _bFrom.y < maxY && x > Math.min(_bFrom.x, _bTo.x) && x < Math.max(_bFrom.x, _bTo.x)) {
            isCross = true;break;
          }
        }
      }
      if (isCross) crossed.add(target.id);
    });
    return crossed;
  }, [bridges, randomLevelData]);

  var highlightedIslandIds = useMemo(function () {
    var ids = new Set();
    var bList = bridges || [];
    if (hoveredIslandId) {
      ids.add(hoveredIslandId);
      bList.forEach(function (b) {
        if (b.from === hoveredIslandId) ids.add(b.to);
        if (b.to === hoveredIslandId) ids.add(b.from);
      });
    }
    if (hoveredBridgeId) {
      var hb = bList.find(function (b) {
        return b.id === hoveredBridgeId;
      });
      if (hb) {
        ids.add(hb.from);
        ids.add(hb.to);
      }
    }
    return ids;
  }, [hoveredIslandId, hoveredBridgeId, bridges]);

  var activeHints = useMemo(function () {
    if (!hoveredIslandId || interactionMode >= 2) return [];
    return (bridges || []).filter(function (b) {
      return b.from === hoveredIslandId || b.to === hoveredIslandId;
    });
  }, [hoveredIslandId, interactionMode, bridges]);

  var handleBridgeClick = function handleBridgeClick(bId) {
    if (isWon || interactionMode >= 2) return;
    if (raceStateRef.current === 'countdown') return; // 🏁 倒數中鎖定操作
    var nowTap = Date.now();
    if (nowTap - (lastBridgeTapRef.current[bId] || 0) < 150) return; // 防手機連點誤觸
    lastBridgeTapRef.current[bId] = nowTap;
    var cur = bridges || [];
    var target = cur.find(function (b) {
      return b.id === bId;
    });
    if (!target) return;
    if (target.locked) {
      showToast('🎁 這是禮物補上的橋，已鎖定，不會被改掉');try {
        window.HASHI_SOUND.play('error');
      } catch (e) {}return;
    } // 禮物橋：誤觸不刪（點按/拖曳共用此入口）

    if (target.count + (target.draftCount || 0) === 0) {
      if (crossedBridgeIds.has(bId)) {
        window.HASHI_SOUND.play('error');
        return showToast("🚫 橋樑不能交叉喔！請先移除阻擋的橋。");
      }
    }

    if (engineRef.current === 'none') {
      setHistory(function (past) {
        var newPast = [].concat(_toConsumableArray(past), [cur]);
        if (newPast.length > 25) return newPast.slice(newPast.length - 25);
        return newPast;
      });
    }

    var oldTotal = target.count + (target.draftCount || 0);

    var nextBridges = cur.map(function (b) {
      if (b.id !== bId) return b;

      var newCount = b.count;
      var newDraftCount = b.draftCount || 0;

      if (interactionMode === 1) {
        // 草稿模式
        if (b.count === 1) {
          newDraftCount = newDraftCount === 0 ? 1 : 0;
        } else if (b.count === 0) {
          newDraftCount = (newDraftCount + 1) % 3;
        }
      } else {
        // 實線模式
        if (newDraftCount > 0) {
          newCount = b.count + newDraftCount;
          newDraftCount = 0;
        } else {
          newCount = (b.count + 1) % 3;
        }
      }

      var newOwner = newCount > 0 || newDraftCount > 0 ? myId : null;
      return _extends({}, b, { count: newCount, draftCount: newDraftCount, owner: newOwner });
    });

    var newB = nextBridges.find(function (b) {
      return b.id === bId;
    });
    var newTotal = newB.count + (newB.draftCount || 0);
    if (newTotal > oldTotal) {
      window.HASHI_SOUND.play('bridge');
    } else if (newTotal < oldTotal) {
      window.HASHI_SOUND.play('remove');
    }

    raceAwareSync({ bridges: nextBridges });

    // ✨ 點擊漣漪：在橋樑中點（成功架橋或取消時）
    if (newTotal !== oldTotal) {
      var islMap2 = {};
      (randomLevelData && randomLevelData.islands || []).forEach(function (i) {
        islMap2[i.id] = i;
      });
      var bf = islMap2[target.from],
          bt = islMap2[target.to];
      if (bf && bt) {
        var mx = (bf.x + bt.x) / 2 * SCALE + PADDING;
        var myy = (bf.y + bt.y) / 2 * SCALE + PADDING;
        setRipples(function (prev) {
          return [].concat(_toConsumableArray(prev), [{ id: Date.now() + Math.random(), uid: myId, x: mx, y: myy, timestamp: Date.now() }]);
        });
      }
    }

    setHoveredIslandId(null);
  };

  var handleShowSolution = function handleShowSolution() {
    syncState({ showSolution: true });
  };

  var switchMode = function switchMode(m) {
    setInteractionMode(m);showToast(modeIcons[m] + ' \u5DF2\u5207\u63DB\u70BA ' + modeTitles[m]);
  };

  var toggleInteractionMode = function toggleInteractionMode() {
    var maxModes = engineRef.current === 'peerjs' ? 3 : 2;
    var nextMode = (interactionMode + 1) % maxModes;
    setInteractionMode(nextMode);
    showToast(modeIcons[nextMode] + ' \u5DF2\u5207\u63DB\u70BA ' + modeTitles[nextMode]);
  };
  var advanceHashiMode = function advanceHashiMode() {
    var nextMode = interactionMode === 0 ? 1 : interactionMode === 1 ? engine === 'peerjs' ? 2 : 0 : 0;
    switchMode(nextMode);
    setDrawSubOpen(nextMode === 2);
  };
  // === 共用底部列 PlatBar（平台模式由殼渲染單一元件；獨立版走舊列） ===
  var platBarRef = useRef(null);
  var platBarCfgRef = useRef(null);
  platBarCfgRef.current = {
    accent: '#4ade80',
    onAction: function onAction(name, payload) {
      if (name === 'zoom-in') handleZoomIn();else if (name === 'zoom-out') handleZoomOut();else if (name === 'zoom-cycle') handleCycleZoom();else if (name === 'mode-press') advanceHashiMode();else if (name === 'draw-tool') setDrawSubMode(payload);else if (name === 'draw-erase-dbl') clearOwnStrokes();else if (name === 'draw-clear') clearAllStrokes();
    }
  };
  var platBarCfgStable = useRef(null);
  if (!platBarCfgStable.current) platBarCfgStable.current = { accent: '#4ade80', onAction: function onAction(n, p) {
      if (platBarCfgRef.current) platBarCfgRef.current.onAction(n, p);
    } };
  useEffect(function () {
    if (typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'hashi') return; // 底部列主人是另一款遊戲時不搶（錦標賽輪替時防翻跳）
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
    if (typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'hashi') return;
    var st = {
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

  useEffect(function () {
    if (typeof window === 'undefined' || !window.PlatCountdown) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch !== 'hashi') return; // 平台：背景遊戲不許碰殼的共用 overlay（會把前景那款的倒數/結算弄閃）
    if (raceCountdown !== null) window.PlatCountdown.show(raceCountdown === 0 ? 'GO!' : raceCountdown);else window.PlatCountdown.hide();
  }, [raceCountdown]);

  // 共用結算畫面（PlatResults，與數獨同框架）：大亂鬥結算改餵殼 spec，本地 modal/等待 pill 只作無殼時 fallback
  useEffect(function () {
    if (typeof window === 'undefined' || !window.PlatResults) return;
    if (window.__PLAT_NET && window.__PLAT_NET.inMatch !== 'hashi') return; // 平台：背景遊戲不許碰殼的共用 overlay（會把前景那款的倒數/結算弄閃）
    var fin = inRace && raceState === 'finished' && raceResult;
    var wait = inRace && raceWaiting && raceState === 'racing';
    if (!fin && !wait) {
      window.PlatResults.hide();resultsDismissRef.current = null;if (resultsDismissedUi) setResultsDismissedUi(false);if (leaveArm) setLeaveArm(false);return;
    }
    if (resultsDismissRef.current === raceState) {
      window.PlatResults.hide();return;
    }
    if (resultsDismissedUi) setResultsDismissedUi(false);
    var homeBtn = leaveArm ? { id: 'home', label: '⚠️ 確定離開？', kind: 'danger' } : { id: 'home', label: '離開' };
    var watchAction = function watchAction() {
      resultsDismissRef.current = raceState;
      setResultsDismissedUi(true);
      window.PlatResults.hide();
      // 等待態（我已完賽）：畫面已自動轉上帝視角面板（raceWaiting），關卡即可，不用再開 modal；
      // 全場結算態：維持開 modal 看盤面
      if (raceState === 'finished') {
        var opps = Object.keys(brawlBoards);if (opps.length) setGodViewUid(opps[0]);
      }
    };
    if (fin) {
      var iFinished = raceResult.entries.some(function (e) {
        return e.uid === myId && e.finished;
      });
      window.PlatResults.show({
        accent: '#4ade80', title: '大亂鬥結果',
        entries: raceResult.entries.map(function (e) {
          return { key: String(e.uid), name: e.name, color: e.color, isMe: e.uid === myId, right: e.finished ? '⏱ ' + formatTime(Math.floor(e.timeMs / 1000)) : '未完成 · ' + Math.round((e.progress || 0) * 100) + '%' };
        }),
        verdict: raceResult.winnerUid === myId ? '🎉 你贏了！' : iFinished ? '完賽了，名次如上！' : '比賽結束，結果如上',
        stars: iFinished ? stars : null,
        note: typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.tourn ? null : !isHostRef.current ? '再來一局／回等待室都會帶全員一起' : null,
        buttons: typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.tourn ? [// 錦標賽：下一局照賽程走，不給再來一局
        { id: 'watch', label: '👁️ 看盤面' }, { id: 'lobby', label: '🏁 回等待室', kind: 'primary' }, homeBtn] : [{ id: 'watch', label: '👁️ 看盤面' }, { id: 'rematch', label: '🔁 再來一局', kind: 'primary' }, { id: 'lobby', label: '🏁 回等待室' }, homeBtn],
        onAction: function onAction(id) {
          if (id === 'watch') watchAction();else if (id === 'rematch') {
            window.PlatResults.hide();playAgain();
          } else if (id === 'lobby') {
            window.PlatResults.hide();requestLobby();
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
            window.PlatResults.hide();handleGoHome();
          }
        }
      });
    } else {
      var fins = [];
      if (myFinishTimeRef.current != null) fins.push({ uid: myId, name: myNameRef.current || '你', color: myColorRef.current, timeMs: myFinishTimeRef.current });
      Object.keys(raceResultsRef.current).forEach(function (uid) {
        var r = raceResultsRef.current[uid];
        if (!r.dnf) fins.push({ uid: uid, name: r.name, color: r.color, timeMs: r.timeMs });
      });
      fins.sort(function (a, b) {
        return a.timeMs - b.timeMs;
      });
      window.PlatResults.show({
        accent: '#4ade80', title: '大亂鬥結果',
        entries: fins.map(function (f) {
          return { key: String(f.uid), name: f.name, color: f.color, isMe: f.uid === myId, right: '⏱ ' + formatTime(Math.floor(f.timeMs / 1000)) };
        }),
        waitingText: '等待其他玩家完成…',
        buttons: [{ id: 'watch', label: '👁️ 轉變為上帝模式（觀戰）', kind: 'primary' }],
        onAction: function onAction(id) {
          if (id === 'watch') watchAction();
        }
      });
    }
  });

  var handleUndo = function handleUndo() {
    if (history.length === 0 || isWon || engineRef.current !== 'none') return;
    var previousState = history[history.length - 1];
    syncState({ bridges: previousState });
    setHistory(function (past) {
      return past.slice(0, -1);
    });
  };

  var handleReset = function handleReset() {
    var empty = HASHI_PUZZLE.generateEmptyBridges(randomLevelData);
    raceAwareSync({ bridges: empty, strokes: [], showSolution: false, startTime: Date.now() });
    if (engineRef.current === 'none') setHistory([]);
    setIsWon(false);setEndTime(null);
    resetWinMeta();
  };

  var handleRegenerateRandom = function handleRegenerateRandom() {
    if (isDailyModeRef.current) return;
    setIsGenerating(true);
    setTimeout(function () {
      purgeGhostPlayers();
      var targetLevelDef = void 0;
      if (currentLevelId === 'custom') {
        targetLevelDef = { id: 'custom', name: '\u2699\uFE0F \u81EA\u8A02 (' + randomLevelData.width + 'x' + randomLevelData.height + ')', width: randomLevelData.width, height: randomLevelData.height, description: "玩家自訂尺寸的大型地圖！" };
      } else {
        targetLevelDef = LEVELS.find(function (l) {
          return l.id === currentLevelId;
        }) || LEVELS[1];
      }
      var newRandomData = HASHI_PUZZLE.generateUniqueHashi(targetLevelDef);
      var empty = HASHI_PUZZLE.generateEmptyBridges(newRandomData);
      syncState({ levelId: currentLevelId, randomLevelData: newRandomData, bridges: empty, strokes: [], showSolution: false, startTime: Date.now() });
      setIsWon(false);setHistory([]);setEndTime(null);setHideVictoryModal(false);
      resetWinMeta();
      setBoardFadeKey(function (k) {
        return k + 1;
      });scheduleFitZoom();
      setIsGenerating(false);
    }, 100);
  };

  var handleLevelChange = function handleLevelChange(newLevelId) {
    if (isDailyModeRef.current) return;
    if (engineRef.current !== 'none' && !isHostRef.current) return;

    if (newLevelId === 'custom') {
      setShowCustomModal(true);
      return;
    }

    setIsGenerating(true);
    setTimeout(function () {
      purgeGhostPlayers();
      var targetLevelDef = LEVELS.find(function (l) {
        return l.id === newLevelId;
      });
      if (!targetLevelDef) {
        setIsGenerating(false);
        return;
      }
      var newRandomData = HASHI_PUZZLE.generateUniqueHashi(targetLevelDef);
      var empty = HASHI_PUZZLE.generateEmptyBridges(newRandomData);
      syncState({ levelId: newLevelId, randomLevelData: newRandomData, bridges: empty, strokes: [], showSolution: false, startTime: Date.now() });
      setIsWon(false);setHistory([]);setEndTime(null);
      resetWinMeta();
      setBoardFadeKey(function (k) {
        return k + 1;
      });scheduleFitZoom();
      setIsGenerating(false);
    }, 100);
  };

  var handleCustomGenerate = function handleCustomGenerate() {
    var w = Math.max(5, Math.min(100, tempWidth));
    var h = Math.max(5, Math.min(100, tempHeight));
    if (soloPick) {
      try {
        localStorage.setItem('hashi_solo_level', 'custom');localStorage.setItem('hashi_solo_custom', JSON.stringify({ w: w, h: h }));
      } catch (e) {}setSoloPick(false);
    }
    setTempWidth(w);
    setTempHeight(h);
    setShowCustomModal(false);

    setIsGenerating(true);
    setTimeout(function () {
      purgeGhostPlayers();
      var customLevelDef = { id: 'custom', name: '\u2699\uFE0F \u81EA\u8A02 (' + w + 'x' + h + ')', width: w, height: h, description: "玩家自訂尺寸的大型地圖！" };
      var newRandomData = HASHI_PUZZLE.generateUniqueHashi(customLevelDef);
      var empty = HASHI_PUZZLE.generateEmptyBridges(newRandomData);

      syncState({ levelId: 'custom', randomLevelData: newRandomData, bridges: empty, strokes: [], showSolution: false, startTime: Date.now() });
      setIsWon(false);setHistory([]);setEndTime(null);
      resetWinMeta();
      setBoardFadeKey(function (k) {
        return k + 1;
      });scheduleFitZoom();
      setIsGenerating(false);
    }, 100);
  };

  var closeVictoryModal = function closeVictoryModal() {
    setIsClosingModal(true);
    setTimeout(function () {
      setHideVictoryModal(true);
      setIsClosingModal(false);
    }, 300);
  };

  var triggerRegenerate = function triggerRegenerate() {
    setIsClosingModal(true);
    setTimeout(function () {
      setIsClosingModal(false);
      handleRegenerateRandom();
    }, 300);
  };

  var triggerDailyHome = function triggerDailyHome() {
    setIsClosingModal(true);
    setTimeout(function () {
      setIsClosingModal(false);
      handleGoHome();
    }, 300);
  };

  var switchToOffline = function switchToOffline() {
    setEngine('none');engineRef.current = 'none';
    setIsHost(false);isHostRef.current = false;
    setRoomId("");setPlayersList([]);
    connsRef.current = [];connRef.current = null;
    setCursors({});setRipples([]);setInteractionMode(0);
    setChatMsgs([]);setUnreadChat(0);setChatOpen(false);setChatInput('');
    stopVideo(); // 📹 關閉視訊
  };

  var startSinglePlayer = function startSinglePlayer() {
    setIsDailyMode(false);isDailyModeRef.current = false;
    resetWinMeta();
    switchToOffline();
    // v1.58.0：單機入口先選難度（不要直接開局）——還原上次單機選的難度供 modal 反綠，再開設定 modal；
    // 選定才生成題目（handleLevelChange/handleCustomGenerate），取消則回主畫面（closeSettingsModal 處理）
    try {
      var lastSolo = localStorage.getItem('hashi_solo_level');
      if (lastSolo === 'custom') {
        var cd = JSON.parse(localStorage.getItem('hashi_solo_custom') || 'null');
        if (cd && cd.w && cd.h) {
          setTempWidth(cd.w);setTempHeight(cd.h);
        }
        setCurrentLevelId('custom');
      } else if (lastSolo && LEVELS.some(function (l) {
        return String(l.id) === String(lastSolo);
      })) setCurrentLevelId(Number(lastSolo));else if (!LEVELS.some(function (l) {
        return String(l.id) === String(currentLevelId);
      })) setCurrentLevelId(2); // 'daily' 等偽難度不可沿用
    } catch (e) {}
    setSoloPick(true);
    setScreen('game');setIsHeaderCollapsed(true);
    setShowSettingsModal(true);
  };
  // 設定 modal 的關閉：單機選難度途中取消＝回主畫面（局還沒開）；局內開啟則只關 modal
  var closeSettingsModal = function closeSettingsModal() {
    setShowSettingsModal(false);
    if (soloPick) {
      setSoloPick(false);setScreen('home');
    }
  };

  // 每日一題：紀錄過關（只在每日模式呼叫）
  var recordDailyWin = function recordDailyWin(secs) {
    var d = dailyDateStrRef.current;
    if (!d) return;
    try {
      var prev = readDailyRecord(d);
      var best = prev ? Math.min(prev.time, secs) : secs;
      var dm = dailyMap();dm.days[d] = { time: best };localStorage.setItem('hashi_daily_map', JSON.stringify(dm));
    } catch (e) {}
    // 連擊只算「今天」：補玩以前日期的題目只記成績，不影響連擊
    try {
      var today = HASHI_PUZZLE.getDailyDateStr();
      if (d === today) {
        var streak = readDailyStreak();
        var yesterday = HASHI_PUZZLE.shiftDateStr(d, -1);
        var newCount = void 0;
        if (streak.lastDate === d) newCount = streak.count;else if (streak.lastDate === yesterday) newCount = streak.count + 1;else newCount = 1;
        localStorage.setItem('hashi_daily_streak', JSON.stringify({ count: newCount, lastDate: d }));
        setDailyStreak(newCount);
      }
    } catch (e) {}
    setDailyDone(readDailyRecord(d));
  };

  var startDailyMode = function startDailyMode(dateStr) {
    var d = clampDailyDate(dateStr);
    var today = HASHI_PUZZLE.getDailyDateStr();
    var rng = HASHI_PUZZLE.getDailySeed(d);
    var dailyDef = { id: 'daily', name: '\uD83D\uDCC5 \u6BCF\u65E5\u4E00\u984C (' + d + ')', width: 10, height: 10, description: d < today ? '\u88DC\u73A9 ' + d + ' \u7684\u6BCF\u65E5\u984C\u76EE\uFF1A\u5168\u4E16\u754C\u540C\u4E00\u984C\uFF01' : '\u6BCF\u65E5\u6311\u6230\uFF08' + d + '\uFF09\uFF1A\u5168\u4E16\u754C\u540C\u4E00\u984C\uFF0C\u4E00\u5929\u53EA\u6709\u4E00\u6B21\u6A5F\u6703\uFF01' };
    var data = HASHI_PUZZLE.generateUniqueHashi(dailyDef, rng);
    var empty = HASHI_PUZZLE.generateEmptyBridges(data);
    var status = getDailyStatus(d);
    setIsDailyMode(true);isDailyModeRef.current = true;
    setDailyDateStr(d);dailyDateStrRef.current = d;
    setDailyStreak(status.streak);
    setDailyDone(status.done);
    setCurrentLevelId('daily');
    setRandomLevelData(data);
    setBridges(empty);
    setStrokes([]);
    setHistory([]);
    setShowSolution(false);
    setStartTime(Date.now());
    setIsWon(false);setEndTime(null);setHideVictoryModal(false);
    resetWinMeta();
    setBoardFadeKey(function (k) {
      return k + 1;
    });scheduleFitZoom();
    setInteractionMode(0);
    switchToOffline();
    setScreen('game');
    setIsHeaderCollapsed(true);
  };

  // ===== 📅 每日一題月曆（亮燈=已完成、未來反灰不可選；點日期直接開那天的題目） =====
  var openDailyCal = function openDailyCal() {
    if (!window.PlatCalendar) return;var recs = {};var dd = new Date(2026, 0, 1);var nowD = new Date();while (dd <= nowD) {
      var ds2 = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0') + '-' + String(dd.getDate()).padStart(2, '0');if (readDailyRecord(ds2)) recs[ds2] = 1;dd.setDate(dd.getDate() + 1);
    }window.PlatCalendar.show({ accent: '#4ade80', records: recs, selected: dailyMenuDate, onPick: function onPick(ds) {
        setDailyMenuDate(ds);startDailyMode(ds);
      } });
  }; // 每日月曆已統一為殼端 PlatCalendar（v1.16）

  // ===== 🎰 暱稱拉霸機（只給沒手動填暱稱的玩家） =====
  var spinSlot = function spinSlot(pool) {
    if (slotTimerRef.current) {
      clearTimeout(slotTimerRef.current);slotTimerRef.current = null;
    }
    var list = pool && pool.length > 0 ? pool : ANIMAL_NAMES;
    slotPoolRef.current = list;
    setSlotPool(list);
    setSlotRound(function (r) {
      return r + 1;
    });
    setSlotSpinning(true);
    setSlotFinalName("");slotFinalNameRef.current = "";
    var t0 = Date.now();
    var delay = 60;
    var tick = function tick() {
      setSlotName(list[Math.random() * list.length | 0]);
      if (Date.now() - t0 >= 1800) {
        var finalName = list[Math.random() * list.length | 0];
        setSlotName(finalName);
        setSlotFinalName(finalName);slotFinalNameRef.current = finalName;
        setSlotSpinning(false);
        slotTimerRef.current = null;
        try {
          window.HASHI_SOUND.play('star');
        } catch (e) {}
        return;
      }
      delay = Math.min(delay * 1.18, 420);
      slotTimerRef.current = setTimeout(tick, delay);
    };
    tick();
  };

  var openSlotMachine = function openSlotMachine(mode, pool) {
    // 新流程：pool 在開拉霸機前就已算好（含已用名單排除），直接轉
    setSlotMode(mode);
    setSlotWaiting(false);
    setSlotName("");setSlotFinalName("");slotFinalNameRef.current = "";
    setSlotSpinning(false);
    if (pool) {
      slotPoolRef.current = pool;setSlotPool(pool);
    }
    setShowSlotMachine(true);
    spinSlot(pool);
  };

  // 只關拉霸機 modal（回到 nick 步，連線保持）
  var closeSlotModal = function closeSlotModal() {
    if (slotTimerRef.current) {
      clearTimeout(slotTimerRef.current);slotTimerRef.current = null;
    }
    setShowSlotMachine(false);
    setSlotSpinning(false);
    setSlotWaiting(false);
  };

  // 完整清理 join 流程（回到 choose 步）
  var fullJoinCleanup = function fullJoinCleanup() {
    if (guestNamesTimeoutRef.current) {
      clearTimeout(guestNamesTimeoutRef.current);guestNamesTimeoutRef.current = null;
    }
    if (slotTimerRef.current) {
      clearTimeout(slotTimerRef.current);slotTimerRef.current = null;
    }
    setShowSlotMachine(false);
    setSlotSpinning(false);
    setSlotWaiting(false);
    suppressCloseRef.current = true;
    if (connRef.current) {
      try {
        connRef.current.close();
      } catch (e) {}connRef.current = null;
    }
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {}peerRef.current = null;
    }
    connsRef.current = [];
    setTimeout(function () {
      suppressCloseRef.current = false;
    }, 500);
    engineRef.current = 'none';setEngine('none');
    setIsConnecting(false);
    setIsHost(false);isHostRef.current = false;
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

  var backToChoose = function backToChoose() {
    fullJoinCleanup();setScreen('home');
  };

  var confirmSlotName = function confirmSlotName() {
    var name = slotFinalNameRef.current;
    if (!name || slotSpinning) return;
    try {
      window.HASHI_SOUND.play('click');
    } catch (e) {}
    if (slotTimerRef.current) {
      clearTimeout(slotTimerRef.current);slotTimerRef.current = null;
    }
    setShowSlotMachine(false);
    setTempPlayerName(name);
    autoNameRef.current = true;
    if (slotMode === 'host') {
      hostConfirmName(name);
    } else {
      guestSendJoin(name, true);
    }
  };

  var handleJoinRejected = function handleJoinRejected(m) {
    // 最終把關：連線保持開啟，不關閉
    setIsConnecting(false);
    guestJoinedRef.current = false;
    joinActiveRef.current = true;
    setScreen('home');
    setJoinStep('nick');
    if (guestAutoNameRef.current) {
      // 拉霸機自動名：用房主回傳的最新名單再轉一次
      showToast("🎰 剛好被選走了，再轉一次！");
      var taken = new Set((m.names || []).map(normName));
      var pool = ANIMAL_NAMES.filter(function (a) {
        return !taken.has(normName(a));
      });
      setTakenNames(m.names || []);
      setTimeout(function () {
        openSlotMachine('guest', pool.length > 0 ? pool : ANIMAL_NAMES);
      }, 700);
    } else {
      // 手動名：留在 nick 步，inline 錯誤
      setNickError("暱稱「" + (m.dupName || "這個名字") + "」已經有人用了，換一個吧！");
      setTimeout(function () {
        if (nameInputRef.current) nameInputRef.current.focus();
      }, 350);
    }
  };

  // ===== 新流程：先選房間，進去再填暱稱（名字用參數傳遞） =====
  var excludeTakenNames = function excludeTakenNames(pool, taken) {
    var t = new Set((taken || []).map(normName));
    var rest = pool.filter(function (a) {
      return !t.has(normName(a));
    });
    return rest.length > 0 ? rest : pool.slice();
  };

  // 房主：建立房間（空名字先佔位）→ nick 步
  var hostCreateRoom = function hostCreateRoom() {
    mpModeRef.current = mpMode;
    setIsConnecting(true);
    setJoinStep('connecting');
    setNickError("");
    setTempPlayerName(loadSavedNickname());
    joinRoleRef.current = 'host';
    joinActiveRef.current = true;
    // 房主代碼固定不變：第一次隨機產生並存下，之後都用同一組，朋友不用每次重問代碼
    var rId = loadHostRoom();
    if (!rId) {
      rId = Math.floor(1000 + Math.random() * 9000).toString();saveHostRoom(rId);
    }
    hostRoomRetryRef.current = false;
    setEngine('peerjs');engineRef.current = 'peerjs';
    setupPeerJS(rId, true);
  };

  // 房主在 nick 步確認暱稱 → 進遊戲（競速則進大廳）
  var hostConfirmName = function hostConfirmName(pName) {
    setRoomOpen(true);
    var name = (pName || "").trim();
    if (!name) return;
    // 房裡可能已有提早進來的來賓，本地即時檢查
    var clash = playersListRef.current.some(function (pl) {
      return pl.id !== myId && pl.name && normName(pl.name) === normName(name);
    });
    if (clash) {
      setNickError("已經有人用這個名字了，換一個吧！");return;
    }
    var entry = { id: myId, name: name, isHost: true, color: hubPlatColor() || getAvailableColor(playersListRef.current.filter(function (p) {
        return p.id !== myId;
      })) }; // hub 模式：房主代表色用殼帶入的 sess.color，不亂配
    setPlayersList(function (prev) {
      var nList = [entry].concat(prev.filter(function (p) {
        return p.id !== myId;
      }));
      connsRef.current.forEach(function (c) {
        if (c.open) {
          try {
            c.send({ type: 'PLAYERS_UPDATE', players: nList });
          } catch (e) {}
        }
      });
      return nList;
    });
    setTempPlayerName(name);
    saveNickname(name);
    joinActiveRef.current = false;
    setIsConnecting(false);
    setScreen('game');setIsHeaderCollapsed(true);
    if (mpModeRef.current === 'race') {
      setRaceState('lobby');raceStateRef.current = 'lobby';
    }
  };

  // 來賓送出 JOIN（暱稱已在平台房間頁確認過，platAuto 自動呼叫）
  var guestSendJoin = function guestSendJoin(pName, auto) {
    var name = (pName || "").trim();
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
      var joinMsg = { type: 'JOIN', pName: name, uid: myId, auto: auto };
      var hcJoin = hubPlatColor();
      if (hcJoin) {
        myColorRef.current = hcJoin;joinMsg.color = hcJoin;
      } // hub 模式：render 會用名單覆寫 myColorRef，故在送出點補釘並把殼的代表色帶進 JOIN（房主以 m.color 為準）；非 hub 不帶色、維持原行為
      connRef.current.send(joinMsg);
      setScreen('game');setIsHeaderCollapsed(true);setIsConnecting(false);
    } else {
      setIsConnecting(false);
      showToast("⚠️ 連線已中斷，請重試");
      backToChoose();
    }
  };

  // 名單自我修復：來賓若發現自己不在房主名單裡（JOIN 在房主遊戲就緒前送達被漏接、
  // 或房主重進遊戲換了新 id），每 2.5 秒自動重送 JOIN，直到名單上有自己為止。
  useEffect(function () {
    var t = setInterval(function () {
      if (isHostRef.current || !guestJoinedRef.current) return;
      if (!connRef.current || !connRef.current.open) return;
      var list = playersListRef.current || [];
      if (list.some(function (pl) {
        return pl.id === myId;
      })) return;
      var nm = myJoinNameRef.current || myNameRef.current;
      if (!nm) return;
      try {
        connRef.current.send({ type: 'JOIN', pName: nm, uid: myId, color: hubPlatColor() || myColorRef.current, auto: autoNameRef.current });
      } catch (e) {}
    }, 2500);
    return function () {
      return clearInterval(t);
    };
  }, []);

  // 完賽回報補送（與數獨 GHOST_I_WON 補送同款邏輯）：RACE_FINISH 原本只送一次，
  // 途中連線替換/掉包就永遠遺失、房主卡在等結果。完賽後仍在 racing 期間每 3 秒補送（上限 6 次），房主端以 uid 去重。
  useEffect(function () {
    var t = setInterval(function () {
      if (engineRef.current !== 'peerjs' || isHostRef.current) return;
      if (myFinishTimeRef.current == null) return;
      if (raceStateRef.current !== 'racing') return;
      if (finishResentRef.current >= 6) return;
      if (!connRef.current || !connRef.current.open) return;
      finishResentRef.current++;
      try {
        connRef.current.send({ type: 'RACE_FINISH', uid: myId, name: myNameRef.current || '你', color: myColorRef.current, timeMs: myFinishTimeRef.current });
      } catch (e) {}
    }, 3000);
    return function () {
      return clearInterval(t);
    };
  }, []);

  // 進度列以玩家名單為準：名單上沒有的 uid（舊連線殘留/重進前的殭屍列）直接修剪掉
  useEffect(function () {
    var ids = new Set(playersList.map(function (pl) {
      return String(pl.id);
    }));
    ids.add(String(myId));
    (racersRef.current || []).forEach(function (uid) {
      return ids.add(String(uid));
    });
    setRaceProgress(function (prev) {
      var keys = Object.keys(prev);
      if (keys.every(function (k) {
        return ids.has(String(k));
      })) return prev;
      var next = {};
      keys.forEach(function (k) {
        if (ids.has(String(k))) next[k] = prev[k];
      });
      return next;
    });
  }, [playersList]);

  var _useState205 = useState(false),
      _useState206 = _slicedToArray(_useState205, 2),
      platTournLock = _useState206[0],
      setPlatTournLock = _useState206[1];

  var _useState207 = useState(false),
      _useState208 = _slicedToArray(_useState207, 2),
      platHub = _useState208[0],
      setPlatHub = _useState208[1]; // v1.11.0：本局由殼房間框架啟動（等待室改在殼端，本遊戲不顯示自己的等待室）


  var platHubRef = useRef(false);
  var hubStartTimerRef = useRef(null);

  var _useState209 = useState(null),
      _useState210 = _slicedToArray(_useState209, 2),
      tournRoundInfo = _useState210[0],
      setTournRoundInfo = _useState210[1]; // 錦標賽本局資訊（第幾局/共幾局/加賽/應到人數），每局等待卡顯示與門檻用


  var tournWaitSinceRef = useRef(null); // 本局等待起點（等滿 1 分鐘房主可強制開始）

  var _useState211 = useState(0),
      _useState212 = _slicedToArray(_useState211, 2),
      setTournTick = _useState212[1];

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
  var tournRosterRef = useRef(null); // 五戰名單帶入：本局預期選手（殼 sess.tourn.roster），等待室先種灰色未到席位（與數獨同款）
  // ===== 平台 Phase C 接入：殼 launch 時自動進多人（暱稱由殼帶入，跳過 nick 步） =====
  useEffect(function () {
    if (!PLAT_MODE) return;
    window.__PLAT_HOOKS_hashi = {
      enter: function enter(sess) {
        platSessRef.current = sess; // hub 模式：代表色以殼 sess.color 為準（enter 在連線建立前執行，先把我的顏色釘住，重複呼叫以最後一次為準）
        var hcEnter = hubPlatColor();
        if (hcEnter) myColorRef.current = hcEnter;
        // 開新局先清掉上一局的結算暫存：raceState 若停在 finished＋舊 raceResult，結算 effect 會在新局一進去就重播舊結果（錦標賽結束後再開大亂鬥實機踩到）
        setRaceState('idle');raceStateRef.current = 'idle';
        setRaceWaiting(false);setRaceResult(null);setRaceCountdown(null);setRaceProgress({});
        raceResultsRef.current = {};myFinishTimeRef.current = null;finishResentRef.current = 0;
        resultsDismissRef.current = null;setResultsDismissedUi(false);setLeaveArm(false);
        setBrawlBoards({});setGodViewUid(null);
        setIsWon(false);setEndTime(null);resetWinMeta();
        setPlatTournLock(!!sess.tourn);
        tournRosterRef.current = sess.tourn && sess.tourn.roster || null;
        setPlatHub(!!sess.hub);platHubRef.current = !!sess.hub;
        setTournRoundInfo(sess.tourn ? { round: sess.tourn.round, total: sess.tourn.total, playoff: !!sess.tourn.playoff, entrants: sess.tourn.entrants } : null);
        tournWaitSinceRef.current = sess.tourn ? Date.now() : null;
        if (sess.settings) {
          // 房間框架帶入的設定（全員同一份）：大亂鬥設定＋關卡一次種下（數橋沒有「去第幾名」這種設定）
          var st = sess.settings;
          applyBrawlSettings(_extends({}, brawlSettingsRef.current, st.brawl || {}, { sizeId: st.sizeId }), false);
          customDimsRef.current = st.customW || st.customH ? { w: Math.max(5, Math.min(100, Number(st.customW) || 15)), h: Math.max(5, Math.min(100, Number(st.customH) || 15)) } : null;
          if (st.sizeId === 'custom') setCurrentLevelId('custom');else {
            var lv = LEVELS.find(function (l) {
              return l.id === st.sizeId;
            });if (lv) setCurrentLevelId(lv.id);
          } // 合作關卡：房主開房載入時照這個關卡走
          // 合作模式：房主照房間頁選的關卡先生成題目（原本沒生成、永遠是初始 10x10）；競速由 startRace 自己生成
          if (sess.isHost && sess.mode !== 'brawl' && sess.mode !== 'race') {
            var coopDef = st.sizeId === 'custom' ? { id: 'custom', name: '⚙️ 自訂', width: (customDimsRef.current || {}).w || 15, height: (customDimsRef.current || {}).h || 15 } : LEVELS.find(function (l) {
              return l.id === st.sizeId;
            }) || null;
            if (coopDef) setTimeout(function () {
              if (!isHostRef.current) return;
              var data = HASHI_PUZZLE.generateUniqueHashi(coopDef);
              var empty = HASHI_PUZZLE.generateEmptyBridges(data);
              syncState({ levelId: coopDef.id, randomLevelData: data, bridges: empty, strokes: [], showSolution: false, startTime: Date.now() });
            }, 250);
          }
        } else if (sess.tourn && sess.isHost) {
          // 賽程預設：套用賽程的關卡
          applyBrawlSettings(_extends({}, brawlSettingsRef.current, { sizeId: sess.tourn.sizeId }), true);
        }
        platAutoRef.current = { name: sess.name };
        var mode = sess.mode === 'brawl' || sess.mode === 'race' ? 'race' : 'coop';
        setMpMode(mode);mpModeRef.current = mode;
        setTempPlayerName(sess.name);
        try {
          myNameRef.current = sess.name;
        } catch (e) {}
        setNickError("");
        setEngine('peerjs');engineRef.current = 'peerjs';
        setIsConnecting(true);setJoinStep('connecting');
        if (sess.isHost) {
          joinRoleRef.current = 'host';joinActiveRef.current = true;
          setupPeerJS(sess.code, true);
        } else {
          joinRoleRef.current = 'guest';joinActiveRef.current = true;
          guestJoinedRef.current = false;guestNamesResolvedRef.current = false;guestAutoNameRef.current = false;
          setTakenNames([]);
          setupPeerJS(sess.code, false);
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
            if (expected >= 2 && present >= expected) {
              clearInterval(hubStartTimerRef.current);hubStartTimerRef.current = null;
              if (mpModeRef.current === 'race') startRace();else startCoop();
            } else if (tries > 90) {
              clearInterval(hubStartTimerRef.current);hubStartTimerRef.current = null;
            }
          }, 500);
        }
      },
      exit: function exit() {
        platSessRef.current = null;setPlatTournLock(false);tournRosterRef.current = null;setPlatHub(false);platHubRef.current = false;setTournRoundInfo(null);tournWaitSinceRef.current = null;if (hubStartTimerRef.current) {
          clearInterval(hubStartTimerRef.current);hubStartTimerRef.current = null;
        }handleGoHome();
      },
      migrate: function migrate(amHost, sess) {
        platSessRef.current = sess; // 接管也以最後帶入的 sess 為準（hub 代表色同 enter）
        var hcMig = hubPlatColor();
        if (hcMig) myColorRef.current = hcMig;
        setEngine('peerjs');engineRef.current = 'peerjs';
        if (amHost) {
          promotingRef.current = true;
          isHostRef.current = true;setIsHost(true);
          joinRoleRef.current = 'host';joinActiveRef.current = true;
          setupPeerJS(sess.code, true);
        } else {
          joinRoleRef.current = 'guest';joinActiveRef.current = true;
          guestJoinedRef.current = false;guestNamesResolvedRef.current = false;
          platAutoRef.current = { name: sess.name };
          setIsConnecting(true);
          setupPeerJS(sess.code, false);
        }
      },
      identity: function identity(d) {
        // 殼端身分同步（改名/改色）：殼已在它的名單同步好，這裡只把遊戲內名單對齊，不自創協議
        if (!d) return;
        if (d.self) {
          if (d.color !== 'rainbow' && COLORS.indexOf(d.color) < 0) return;
          myColorRef.current = d.color;
          setPlayersList(function (prev) {
            var nList = prev.map(function (p) {
              return p.id === myId ? _extends({}, p, { color: d.color }) : p;
            });
            // 我是房主：本地套用後用既有廣播管道送一次最新名單，讓來賓端一致（來賓身分只本地套用、不送訊息）
            if (isHostRef.current) connsRef.current.forEach(function (c) {
              if (c.open) {
                try {
                  c.send({ type: 'PLAYERS_UPDATE', players: nList });
                } catch (e) {}
              }
            });
            return nList;
          });
        } else {
          var p = (playersListRef.current || []).find(function (pl) {
            return normName(pl.name) === normName(d.name);
          });
          if (p) handlePlayerColorChange(p.id, d.color); // 走原協議：房主直改廣播／來賓送 REQ_COLOR_CHANGE
        }
      }
    };
  }, []);

  // 在線心跳（與數獨同款）：來賓每 10 秒 ping 房主；房主記錄每人最後出現時間，25 秒標離線、等待中 60 秒無回應移除。
  // 底層連線的 close 訊號在 App 被直接關掉時可能拖很久，心跳負責即時性；房主把 isOffline 寫進名單條目，廣播自動帶給全場。
  useEffect(function () {
    var iv = setInterval(function () {
      if (engineRef.current !== 'peerjs') return;
      var now = Date.now();
      if (!isHostRef.current) {
        if (now - (lastPingRef.current || 0) >= 10000 && connRef.current && connRef.current.open) {
          lastPingRef.current = now;
          try {
            connRef.current.send({ type: 'PING', uid: myId });
          } catch (e) {}
        }
        return;
      }
      var list = playersListRef.current || [];
      var waiting = raceStateRef.current === 'lobby' || mpModeRef.current === 'coop' && !(stateRef.current && stateRef.current.coopStarted);
      var changed = false;var removed = null;
      var next = [];
      list.forEach(function (p) {
        if (p.id === myId) {
          next.push(p);return;
        }
        if (p.pending) {
          next.push(p);return;
        } // 未到席位不做離線判定/移除，等真 JOIN 替換或開賽時清掉
        if (!lastSeenRef.current[p.id]) {
          lastSeenRef.current[p.id] = now;next.push(p);return;
        }
        var silent = now - lastSeenRef.current[p.id];
        if (waiting && silent > 60000) {
          removed = p;changed = true;return;
        }
        var off = silent > 25000;
        if (!!p.isOffline !== off) {
          changed = true;next.push(_extends({}, p, { isOffline: off }));
        } else next.push(p);
      });
      if (changed) {
        setPlayersList(next);
        connsRef.current.forEach(function (c) {
          if (c.open) {
            try {
              c.send({ type: 'PLAYERS_UPDATE', players: next });
            } catch (e) {}
          }
        });
        if (removed) showToast('\uD83D\uDCF4 ' + (removed.name || '玩家') + ' \u5DF2\u96E2\u7DDA');
      }
    }, 5000);
    return function () {
      return clearInterval(iv);
    };
  }, []);

  var setupPeerJS = function setupPeerJS(rId, isCreating) {
    // 冪等重設：重複 setup（接管/重入）先清掉舊 peer 與 conn refs，避免訊息送進死連線或重複綁定
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {}peerRef.current = null;
    }
    connsRef.current = [];connRef.current = null;
    if (isCreating) {
      var p = new Peer(rId + '-host');
      peerRef.current = p;
      p.on('call', handleIncomingCall); // 📹 視訊來電
      p.on('open', function () {
        setIsHost(true);isHostRef.current = true;
        setRoomId(rId);setIsConnecting(false);
        setJoinStep('nick');
        // 空名字先佔位，等 nick 步確認後再填上
        if (promotingRef.current) {
          // 接管升格：保留原名單（只移除舊房主、自己標房主），朋友以同 uid 回座
          promotingRef.current = false;
          setPlayersList(function (prev) {
            var others = prev.filter(function (pl) {
              return !pl.isHost && pl.id !== myId;
            });
            var me = prev.find(function (pl) {
              return pl.id === myId;
            }) || { id: myId, name: myNameRef.current || '玩家', color: myColorRef.current };
            return [_extends({}, me, { isHost: true })].concat(_toConsumableArray(others));
          });
        } else {
          var seedListH = [{ id: myId, name: "", isHost: true, color: hubPlatColor() || getAvailableColor([]) }]; // hub 模式：種子名單的房主色也用 sess.color
          // 五戰名單帶入：還沒進遊戲的選手先種成灰色「未到」席位（真 JOIN 到達時以同名替換）
          if (tournRosterRef.current) {
            var selfNameH = platAutoRef.current ? platAutoRef.current.name : null;
            tournRosterRef.current.forEach(function (e) {
              if (!e || !e.name || e.name === selfNameH) return;
              seedListH.push({ id: 'pending:' + e.name, name: e.name, isHost: false, color: e.color || getAvailableColor(seedListH), isReady: false, isSpectator: false, pending: true });
            });
          }
          setPlayersList(seedListH);
          if (platAutoRef.current) {
            var nmH = platAutoRef.current.name;platAutoRef.current = null;hostConfirmName(nmH);
          }
        }

        p.on('connection', function (c) {
          connsRef.current.push(c);
          c.on('data', function (m) {
            if (c.uid || m.uid || m.targetId) lastSeenRef.current[c.uid || m.uid || m.targetId] = Date.now();
            if (m.type === 'PING') {
              try {
                c.send({ type: 'PONG' });
              } catch (e) {}return;
            }
            if (m.type === 'JOIN') {
              c.uid = m.uid; // 將玩家身分標籤綁定到這個連線上
              // 撞名檢查：同 uid 重連允許；不同 uid 同名（大小寫不敏感）拒絕
              var tryName = (m.pName || '').trim();
              var clash = !!tryName && playersListRef.current.some(function (pl) {
                return pl.id !== m.uid && !pl.pending && normName(pl.name) === normName(tryName);
              });
              if (clash) {
                // 連線保持開啟：拉霸機自動名會自動重轉，手動名回 nick 步重填
                c.send({ type: 'JOIN_REJECTED', reason: 'name_taken', dupName: tryName, names: playersListRef.current.map(function (pl) {
                    return pl.name;
                  }) });
                return;
              }
              setPlayersList(function (prev) {
                var existingPlayer = prev.find(function (pl) {
                  return pl.id === m.uid;
                });
                var nList = void 0;
                if (existingPlayer) {
                  // 老玩家回歸，更新名字
                  nList = prev.map(function (pl) {
                    return pl.id === m.uid ? _extends({}, pl, { name: m.pName }) : pl;
                  });
                } else {
                  // 新玩家加入（比賽進行中加入 → 自動觀戰，比照數獨）
                  var lateSpec = mpModeRef.current === 'race' && (raceStateRef.current === 'countdown' || raceStateRef.current === 'racing' || raceStateRef.current === 'finished');
                  var pendIdxH = prev.findIndex(function (pl) {
                    return pl.pending && pl.name === m.pName;
                  });
                  if (pendIdxH >= 0) {
                    // 五戰未到席位被真人頂上：沿用預期名單的顏色與位置
                    nList = prev.slice();
                    nList[pendIdxH] = { id: m.uid, name: m.pName, isHost: false, color: prev[pendIdxH].color, isReady: false, isSpectator: lateSpec };
                  } else {
                    var newColor = m.color === 'rainbow' || COLORS.indexOf(m.color) >= 0 ? m.color : getAvailableColor(prev); // 來賓有帶合法代表色（hub 模式＝殼的摩天輪色）就以他的為準，否則維持房主隨機配色
                    nList = [].concat(_toConsumableArray(prev), [{ id: m.uid, name: m.pName, isHost: false, color: newColor, isReady: false, isSpectator: lateSpec }]);
                  }
                }
                // 強制派發最新地圖與名單
                connsRef.current.forEach(function (conn) {
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
                  connsRef.current.forEach(function (conn) {
                    if (conn !== c && conn.open) conn.send({ type: 'RACE_UNDNF', uid: m.uid });
                  });
                }
                var snap = brawlBoardsRef.current[m.uid];
                c.send({ type: 'RACE_RESUME', data: { randomLevelData: stateRef.current.randomLevelData, levelId: stateRef.current.levelId, showSolution: false, startTime: raceStartAtRef.current, strokes: [] }, startAt: raceStartAtRef.current, racers: racersRef.current, settings: brawlSettingsRef.current, bridges: snap ? snap.bridges : null, progress: raceProgressRef.current, results: raceResultsRef.current });
              }
              // 📹 若房主已開視訊，自動撥給新加入的玩家，並同步麥克風狀態
              if (!PLAT_MODE && videoOnRef.current && localStreamRef.current && c.open) {
                try {
                  var call = peerRef.current.call(c.peer, localStreamRef.current, { metadata: { uid: myId, name: myNameRef.current || '你' } });
                  videoCallsRef.current.push(call);
                  var newUid = m.uid;
                  call.on('stream', function (rs) {
                    setRemoteVideos(function (prev) {
                      return _extends({}, prev, _defineProperty({}, newUid, rs));
                    });
                  });
                  call.on('close', function () {
                    setRemoteVideos(function (prev) {
                      var n = _extends({}, prev);delete n[newUid];return n;
                    });
                  });
                  c.send({ type: 'MIC', uid: myId, name: myNameRef.current || '你', muted: function () {
                      try {
                        var at = localStreamRef.current.getAudioTracks()[0];return at ? !at.enabled : true;
                      } catch (e) {
                        return true;
                      }
                    }() });
                } catch (e) {}
              }
            } else if (m.type === 'GET_TAKEN_NAMES') {
              // 只回給該連線：目前已使用的名字（排除空名字，給拉霸機／暱稱檢查用）
              c.send({ type: 'TAKEN_NAMES', names: playersListRef.current.filter(function (pl) {
                  return pl.name && pl.name.trim();
                }).map(function (pl) {
                  return pl.name;
                }) });
            } else if (m.type === 'LEAVE') {
              var inRaceNow = raceStateRef.current === 'countdown' || raceStateRef.current === 'racing';
              if (inRaceNow) {
                markRacerDnf(m.uid);
                connsRef.current.forEach(function (conn) {
                  if (conn !== c && conn.open) conn.send({ type: 'RACE_DNF', uid: m.uid });
                });
                showToast("👋 一位選手離開，以未完成計入名次");
              } else {
                setPlayersList(function (prev) {
                  var nList = prev.filter(function (pl) {
                    return pl.id !== m.uid;
                  });
                  connsRef.current.forEach(function (conn) {
                    if (conn !== c && conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: nList });
                  });
                  return nList;
                });
              }
            } else if (m.type === 'SYNC') {
              syncState(m.data, false);
              connsRef.current.forEach(function (conn) {
                if (conn.peer !== c.peer) conn.send({ type: 'SYNC', data: m.data });
              });
            } else if (m.type === 'REQ_COLOR_CHANGE') {
              setPlayersList(function (prev) {
                var nList = prev.map(function (pl) {
                  if (pl.id === m.targetId) return _extends({}, pl, { color: m.color });
                  return pl;
                });
                connsRef.current.forEach(function (conn) {
                  return conn.send({ type: 'PLAYERS_UPDATE', players: nList });
                });
                return nList;
              });
            } else if (m.type === 'REQ_NAME_CHANGE') {
              setPlayersList(function (prev) {
                var nList = prev.map(function (pl) {
                  if (pl.id === m.targetId) return _extends({}, pl, { name: m.name });
                  return pl;
                });
                connsRef.current.forEach(function (conn) {
                  return conn.send({ type: 'PLAYERS_UPDATE', players: nList });
                });
                return nList;
              });
            } else if (m.type === 'CURSOR') {
              connsRef.current.forEach(function (conn) {
                if (conn.peer !== c.peer) conn.send(m);
              });
              setCursors(function (prev) {
                return _extends({}, prev, _defineProperty({}, m.uid, { x: m.x, y: m.y }));
              });
            } else if (m.type === 'CLICK') {
              connsRef.current.forEach(function (conn) {
                if (conn.peer !== c.peer) conn.send(m);
              });
              setRipples(function (prev) {
                return [].concat(_toConsumableArray(prev), [{ id: Date.now() + Math.random(), uid: m.uid, x: m.x, y: m.y, timestamp: Date.now() }]);
              });
            } else if (m.type === 'CHAT') {
              appendChatMsg(m);
              connsRef.current.forEach(function (conn) {
                if (conn.peer !== c.peer && conn.open) conn.send(m);
              });
            } else if (m.type === 'MIC') {
              handleMicMsg(m);
              connsRef.current.forEach(function (conn) {
                if (conn.peer !== c.peer && conn.open) conn.send(m);
              });
            } else if (m.type === 'RACE_PROGRESS') {
              setRaceProgress(function (prev) {
                return _extends({}, prev, _defineProperty({}, m.uid, { progress: m.progress, name: m.name, color: m.color }));
              });
              connsRef.current.forEach(function (conn) {
                if (conn.peer !== c.peer && conn.open) conn.send(m);
              });
            } else if (m.type === 'RACE_FINISH') {
              onRaceOpponentFinish(m.uid, m);
              connsRef.current.forEach(function (conn) {
                if (conn.peer !== c.peer && conn.open) conn.send(m);
              });
            } else if (m.type === 'BRAWL_STATE') {
              setBrawlBoards(function (prev) {
                return _extends({}, prev, _defineProperty({}, m.uid, { bridges: m.bridges, progress: m.progress, name: m.name, color: m.color }));
              });
              connsRef.current.forEach(function (conn) {
                if (conn.peer !== c.peer && conn.open) conn.send(m);
              });
            } else if (m.type === 'BRAWL_ITEM') {
              applyBrawlItem(m);
              connsRef.current.forEach(function (conn) {
                if (conn.peer !== c.peer && conn.open) conn.send(m);
              });
            } else if (m.type === 'BRAWL_MILESTONE') {
              handleBrawlMilestone(m);
            } else if (m.type === 'BRAWL_GRANT') {
              applyBrawlGrant(m); // 來賓產生的島嶼禮物：房主自己是收件人時入包（applyBrawlGrant 內部驗 toUid）
              connsRef.current.forEach(function (conn) {
                if (conn.peer !== c.peer && conn.open) conn.send(m);
              }); // 轉發給其他來賓（收件人可能在別台；非收件人入包時會自行忽略）
            } else if (m.type === 'REQ_READY') {
              setPlayersList(function (prev) {
                var nList = prev.map(function (pl) {
                  return pl.id === m.uid ? _extends({}, pl, { isReady: !!m.ready }) : pl;
                });
                connsRef.current.forEach(function (conn) {
                  if (conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: nList });
                });
                return nList;
              });
            } else if (m.type === 'REQ_SPECTATE') {
              setPlayersList(function (prev) {
                var nList = prev.map(function (pl) {
                  return pl.id === m.uid ? _extends({}, pl, { isSpectator: !!m.spectator, isReady: false }) : pl;
                });
                connsRef.current.forEach(function (conn) {
                  if (conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: nList });
                });
                return nList;
              });
            } else if (m.type === 'REQ_PLAY_AGAIN') {
              if (mpModeRef.current === 'race') {
                if (raceStateRef.current === 'finished') startRace();
              } else if (isWonRef.current) {
                hostCoopAgain();
              }
            } else if (m.type === 'REQ_TO_LOBBY') {
              returnToLobby();
            }
          });

          c.on('close', function () {
            if (suppressCloseRef.current) return;
            var inRaceNow = raceStateRef.current === 'countdown' || raceStateRef.current === 'racing';
            if (c.uid && inRaceNow) {
              markRacerDnf(c.uid);
              connsRef.current.forEach(function (conn) {
                if (conn !== c && conn.open) conn.send({ type: 'RACE_DNF', uid: c.uid });
              });
              showToast("👋 一位選手斷線，比賽繼續");
            }
            connsRef.current = connsRef.current.filter(function (conn) {
              return conn.peer !== c.peer;
            });
            if (c.uid && !inRaceNow) {
              // 非比賽期間斷線才拔除名單並廣播
              var goneUid = c.uid;
              setRemoteVideos(function (prev) {
                var n = _extends({}, prev);delete n[goneUid];return n;
              }); // 📹 移除視訊
              setPlayersList(function (prev) {
                var nList = prev.filter(function (pl) {
                  return pl.id !== c.uid;
                });
                connsRef.current.forEach(function (conn) {
                  if (conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: nList });
                });
                return nList;
              });
            }
          });
        });
      });
      p.on('error', function (err) {
        if (isCreating && err && err.type === 'unavailable-id' && !hostRoomRetryRef.current) {
          // 固定代碼被佔用（多半是上次連線殘留）：換一組新代碼重試一次
          hostRoomRetryRef.current = true;
          clearHostRoom();
          hostCreateRoom();
          return;
        }
        setIsConnecting(false);setJoinStep('choose');joinActiveRef.current = false;joinRoleRef.current = null;switchToOffline();showToast("⚠️ 無法建立對局大廳，請重試");
      });
    } else {
      var guestP = new Peer();
      peerRef.current = guestP;
      guestP.on('call', handleIncomingCall); // 📹 視訊來電
      guestP.on('open', function () {
        var c = guestP.connect(rId + '-host');
        connRef.current = c;
        c.on('open', function () {
          setIsHost(false);isHostRef.current = false;
          setRoomId(rId);
          // 新流程：一律先跟房主要已用名單，進 nick 步填完暱稱才 JOIN
          guestNamesResolvedRef.current = false;
          c.send({ type: 'GET_TAKEN_NAMES', uid: myId });
          if (guestNamesTimeoutRef.current) {
            clearTimeout(guestNamesTimeoutRef.current);
          }
          guestNamesTimeoutRef.current = setTimeout(function () {
            if (!guestNamesResolvedRef.current && !guestJoinedRef.current && joinActiveRef.current) {
              setTakenNames([]);
              setIsConnecting(false);
              setJoinStep('nick');
              if (platAutoRef.current) {
                var nmT = platAutoRef.current.name;platAutoRef.current = null;guestSendJoin(nmT, false);
              }
            }
          }, 5000);
        });
        c.on('data', function (m) {
          hostSeenRef.current = Date.now();
          if (m.type === 'PONG') {
            return;
          }
          if (m.type === 'INIT') {
            if (m.players) setPlayersList(m.players);
            if (m.data) syncState(m.data, false);
            if (m.data && m.data.brawlSettings) applyBrawlSettings(m.data.brawlSettings, false);
            setRoomOpen(!(m.data && m.data.coopStarted));
            if (m.mpMode === 'race') {
              setMpMode('race');mpModeRef.current = 'race';
              setRaceState('lobby');raceStateRef.current = 'lobby';
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
            var hRes = loadHashiResume(m.startAt); // 本地存檔優先（比房主快照新，且含道具/里程碑/禮物額度）
            if (hRes) {
              if (hRes.bridges && hRes.bridges.length) setBridges(hRes.bridges);
              if (Array.isArray(hRes.items)) {
                myItemsRef.current = hRes.items;setMyItems(hRes.items);
              }
              if (hRes.milestones) milestonesRef.current = hRes.milestones;
              hashiGiftCreditRef.current = hRes.giftCredit || 0;hashiGiftUnitsRef.current = hRes.giftUnits || 0;
            }
            if (m.progress) setRaceProgress(m.progress);
            if (m.results) {
              // 房主端的既有成績（完賽/DNF）一併帶回：beginRace 剛把本地成績清空，不補回來可能永遠湊不滿結算人數（稽核修）
              var rr = {};
              Object.keys(m.results).forEach(function (k) {
                if (k !== myId) rr[k] = m.results[k];
              });
              raceResultsRef.current = rr;
              if (m.results[myId] && m.results[myId].timeMs != null) myFinishTimeRef.current = m.results[myId].timeMs; // 自己重整頁面回座：恢復自己的完賽時間（自己的成績不進 raceResultsRef，maybeFinalize 是分開計的）
            }
          } else if (m.type === 'RACE_UNDNF') {
            if (raceResultsRef.current[m.uid] && raceResultsRef.current[m.uid].dnf) delete raceResultsRef.current[m.uid]; // 對手斷線又回座：撤銷 DNF，他完賽時才會被承認
          } else if (m.type === 'RACE_PROGRESS') {
            setRaceProgress(function (prev) {
              return _extends({}, prev, _defineProperty({}, m.uid, { progress: m.progress, name: m.name, color: m.color }));
            });
          } else if (m.type === 'RACE_FINISH') {
            onRaceOpponentFinish(m.uid, m);
          } else if (m.type === 'RACE_DNF') {
            markRacerDnf(m.uid);
          } else if (m.type === 'BRAWL_STATE') {
            setBrawlBoards(function (prev) {
              return _extends({}, prev, _defineProperty({}, m.uid, { bridges: m.bridges, progress: m.progress, name: m.name, color: m.color }));
            });
          } else if (m.type === 'BRAWL_ITEM') {
            applyBrawlItem(m);
          } else if (m.type === 'BRAWL_GRANT') {
            applyBrawlGrant(m);
          } else if (m.type === 'BRAWL_SETTINGS') {
            applyBrawlSettings(m.settings, false);
          } else if (m.type === 'MP_MODE') {
            setMpMode(m.mode);mpModeRef.current = m.mode;
            if (m.mode === 'race') {
              setRaceState('lobby');raceStateRef.current = 'lobby';
            } else {
              setRaceState('idle');raceStateRef.current = 'idle';
            }
          } else if (m.type === 'COOP_START') {
            setRoomOpen(false);
          } else if (m.type === 'TO_LOBBY') {
            returnToLobbyLocal();
          } else if (m.type === 'CURSOR') {
            setCursors(function (prev) {
              return _extends({}, prev, _defineProperty({}, m.uid, { x: m.x, y: m.y }));
            });
          } else if (m.type === 'CLICK') {
            setRipples(function (prev) {
              return [].concat(_toConsumableArray(prev), [{ id: Date.now() + Math.random(), uid: m.uid, x: m.x, y: m.y, timestamp: Date.now() }]);
            });
          } else if (m.type === 'CHAT') {
            appendChatMsg(m);
          } else if (m.type === 'MIC') {
            handleMicMsg(m);
          } else if (m.type === 'TAKEN_NAMES') {
            if (!guestNamesResolvedRef.current && !guestJoinedRef.current && joinActiveRef.current) {
              if (guestNamesTimeoutRef.current) {
                clearTimeout(guestNamesTimeoutRef.current);guestNamesTimeoutRef.current = null;
              }
              guestNamesResolvedRef.current = true;
              setTakenNames((m.names || []).filter(function (n) {
                return n && n.trim();
              }));
              setIsConnecting(false);
              setJoinStep('nick');
              if (platAutoRef.current) {
                var nmG = platAutoRef.current.name;platAutoRef.current = null;guestSendJoin(nmG, false);
              }
            }
          } else if (m.type === 'JOIN_REJECTED' && m.reason === 'name_taken') {
            handleJoinRejected(m);
          } else if (m.type === 'REQ_REJOIN') {
            connRef.current.send({ type: 'JOIN', pName: myNameRef.current, uid: myId, color: hubPlatColor() || myColorRef.current, auto: autoNameRef.current });
          }
        });
        c.on('close', function () {
          if (suppressCloseRef.current) return;
          if (PLAT_MODE) {
            showToast("📡 房主連線中斷，正在自動重連…");return;
          }
          if (joinActiveRef.current) {
            // 還在 join 流程（connecting/nick/拉霸機）→ 回 choose 步
            showToast("⚠️ 連線中斷，請重試");
            fullJoinCleanup();
            return;
          }
          if (raceStateRef.current !== 'idle') {
            showToast("⚠️ 對手斷線，大亂鬥結束");exitRaceToSolo();
          } else {
            showToast("⚠️ 主機已離線，切換為單機模式");switchToOffline();
          }
        });
      });
      guestP.on('error', function () {
        if (joinActiveRef.current) {
          showToast("⚠️ 無法連線，請確認代碼是否正確");
          fullJoinCleanup();
        } else {
          setIsConnecting(false);switchToOffline();
          showToast("⚠️ 無法連線，請確認代碼是否正確");
        }
      });
    }
  };

  var handleGoHome = function handleGoHome(platLeave) {
    setRoomOpen(false);
    // platLeave==='leave'：連線模式個人退出（只有自己回大廳、其他人繼續、房主退出由殼接管）；其餘走舊語義（房主帶全員回等待室）
    if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY(platLeave === 'leave' ? 'player-leave' : 'game-exit');
    if (engineRef.current !== 'none') {
      if (!isHostRef.current && engineRef.current === 'peerjs' && connRef.current) {
        // 有禮貌地先傳送退出訊號給房主，再關閉連線
        connRef.current.send({ type: 'LEAVE', uid: myId });
        var pToKill = peerRef.current;
        setTimeout(function () {
          if (pToKill) {
            try {
              pToKill.destroy();
            } catch (e) {}
          }
          if (peerRef.current === pToKill) peerRef.current = null;
        }, 100);
      } else {
        if (peerRef.current) {
          peerRef.current.destroy();peerRef.current = null;
        }
      }
    }
    switchToOffline();setScreen('home');setIsWon(false);setEndTime(null);setHistory([]);
    setIsDailyMode(false);isDailyModeRef.current = false;
    setRaceState('idle');raceStateRef.current = 'idle';
    setRaceWaiting(false);setRaceResult(null);setRaceCountdown(null);setRaceProgress({});
    raceResultsRef.current = {};myFinishTimeRef.current = null;
    fxRef.current = { fog: {}, boxes: [], marks: [] };setFxFog({});setFxFogBoxes([]);setFxMarks([]); // 道具特效也要清：回主畫面後 8-10 秒內開單機/合作局，上一局的霧會直接漏進新局（其他離場路徑都有清，獨漏這條，稽核修）
    resetWinMeta();
  };

  // ==================== 🏁 競速模式 ====================
  var startRace = function startRace() {
    if (!isHostRef.current) return;
    // 開賽時清掉仍未到的五戰預期席位（遲到者進場會以觀戰者加入，不卡結算）
    var curListH = playersListRef.current;
    if ((curListH || []).some(function (p) {
      return p.pending;
    })) {
      curListH = curListH.filter(function (p) {
        return !p.pending;
      });
      setPlayersList(curListH);
      connsRef.current.forEach(function (c) {
        if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: curListH });
      });
    }
    var racers = curListH.filter(function (p) {
      return !p.isSpectator;
    });
    if (racers.length < 2) return;
    var st = brawlSettingsRef.current;
    var def = LEVELS.find(function (l) {
      return l.id === st.sizeId;
    }) || LEVELS[1];
    var cdims = st.sizeId === 'custom' && customDimsRef.current ? customDimsRef.current : null;
    var targetLevelDef = { id: def.id, name: def.name, width: cdims ? cdims.w : def.width, height: cdims ? cdims.h : def.height, description: "🏁 大亂鬥專用題目，祝好運！" };
    var newRandomData = HASHI_PUZZLE.generateUniqueHashi(targetLevelDef);
    var empty = HASHI_PUZZLE.generateEmptyBridges(newRandomData);
    var startAt = Date.now() + 3500;
    var payload = { randomLevelData: newRandomData, bridges: empty, levelId: def.id, showSolution: false, startTime: startAt, strokes: [] };
    var racersIds = racers.map(function (p) {
      return p.id;
    });
    connsRef.current.forEach(function (c) {
      if (c.open) c.send({ type: 'RACE_START', data: payload, startAt: startAt, racers: racersIds, settings: st });
    });
    beginRace(payload, startAt, racersIds, st);
  };

  // 回等待室（房主廣播全員；來賓收到 TO_LOBBY 也走這支本地版）
  var returnToLobbyLocal = function returnToLobbyLocal() {
    // 回等待室先清除全員準備狀態（比照數獨），避免一回房就被自動開始拉走
    setPlayersList(function (prev) {
      return prev.map(function (pl) {
        return _extends({}, pl, { isReady: false });
      });
    });
    if (isHostRef.current) {
      var nList = playersListRef.current.map(function (pl) {
        return _extends({}, pl, { isReady: false });
      });
      connsRef.current.forEach(function (c) {
        if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: nList });
      });
    }
    setRaceState('lobby');raceStateRef.current = 'lobby';
    setRaceWaiting(false);setRaceResult(null);setRaceCountdown(null);
    setRaceProgress({});raceResultsRef.current = {};myFinishTimeRef.current = null;
    myItemsRef.current = [];setMyItems([]);setBrawlBoards({});setGodViewUid(null);
    fxRef.current = { fog: {}, boxes: [], marks: [] };setFxFog({});setFxFogBoxes([]);setFxMarks([]);
    setRoomOpen(true);
  };
  var returnToLobby = function returnToLobby() {
    if (isHostRef.current) connsRef.current.forEach(function (c) {
      if (c.open) c.send({ type: 'TO_LOBBY' });
    });
    returnToLobbyLocal();
  };
  // 合作再來一局（房主）：同關卡重生成 + 廣播 COOP_START 讓全員一起重開
  var hostCoopAgain = function hostCoopAgain() {
    var lv = LEVELS.find(function (l) {
      return l.id === (stateRef.current.levelId || currentLevelId);
    }) || LEVELS[1];
    applyCoopLevel(lv);
    stateRef.current = _extends({}, stateRef.current, { coopStarted: true });
    connsRef.current.forEach(function (c) {
      if (c.open) c.send({ type: 'COOP_START' });
    });
    setRoomOpen(false);
  };
  // 結算「再來一局」：房主直接重開；來賓送請求給房主（全員同進退，不回等待室）
  var playAgain = function playAgain() {
    if (engineRef.current !== 'peerjs') {
      handleRegenerateRandom();return;
    }
    if (isHostRef.current) {
      if (mpModeRef.current === 'race') startRace();else hostCoopAgain();
    } else if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: 'REQ_PLAY_AGAIN' });
      showToast('已向房主送出再來一局請求');
    }
  };
  // 結算「回等待室」：來賓送請求，房主帶全員一起回
  var requestLobby = function requestLobby() {
    if (platHubRef.current) {
      if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY('game-exit');return;
    } // 平台房間框架：回等待室＝回殼的房間頁（房主帶全員、來賓只回自己）
    if (isHostRef.current) {
      returnToLobby();return;
    }
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: 'REQ_TO_LOBBY' });
      showToast('已向房主送出回等待室請求');
    }
  };
  var startCoop = function startCoop() {
    if (!isHostRef.current) return;
    stateRef.current = _extends({}, stateRef.current, { coopStarted: true });
    connsRef.current.forEach(function (c) {
      if (c.open) c.send({ type: 'COOP_START' });
    });
    setRoomOpen(false);
    showToast('🤝 合作開始！');
  };
  var applyCoopLevel = function applyCoopLevel(levelDef) {
    if (!isHostRef.current) return;
    var data = HASHI_PUZZLE.generateUniqueHashi(levelDef);
    var empty = HASHI_PUZZLE.generateEmptyBridges(data);
    syncState({ randomLevelData: data, bridges: empty, levelId: levelDef.id, showSolution: false, strokes: [], startTime: Date.now() });
    setIsWon(false);setEndTime(null);resetWinMeta();
  };
  var setMyReady = function setMyReady(v) {
    setPlayersList(function (prev) {
      return prev.map(function (pl) {
        return pl.id === myId ? _extends({}, pl, { isReady: v }) : pl;
      });
    });
    if (isHostRef.current) {
      var nList = playersListRef.current.map(function (pl) {
        return pl.id === myId ? _extends({}, pl, { isReady: v }) : pl;
      });
      connsRef.current.forEach(function (c) {
        if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: nList });
      });
    } else if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: 'REQ_READY', uid: myId, ready: v });
    }
  };
  var setMySpectator = function setMySpectator(v) {
    setPlayersList(function (prev) {
      return prev.map(function (pl) {
        return pl.id === myId ? _extends({}, pl, { isSpectator: v, isReady: false }) : pl;
      });
    });
    if (isHostRef.current) {
      var nList = playersListRef.current.map(function (pl) {
        return pl.id === myId ? _extends({}, pl, { isSpectator: v, isReady: false }) : pl;
      });
      connsRef.current.forEach(function (c) {
        if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: nList });
      });
    } else if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: 'REQ_SPECTATE', uid: myId, spectator: v });
    }
  };
  var setMpModeHost = function setMpModeHost(mode) {
    if (!isHostRef.current) return;
    setMpMode(mode);mpModeRef.current = mode;
    if (mode === 'race') {
      setRaceState('lobby');raceStateRef.current = 'lobby';
    } else {
      setRaceState('idle');raceStateRef.current = 'idle';
    }
    connsRef.current.forEach(function (c) {
      if (c.open) c.send({ type: 'MP_MODE', mode: mode });
    });
  };

  var beginRace = function beginRace(payload, startAt, racersIds, settings) {
    if (settings) applyBrawlSettings(settings, false);
    var rIds = racersIds || playersListRef.current.filter(function (p) {
      return !p.isSpectator;
    }).map(function (p) {
      return p.id;
    });
    racersRef.current = rIds;
    setRaceRacers(rIds);
    stateRef.current = _extends({}, stateRef.current, { racers: rIds });
    setRoomOpen(false);
    var seq = ++raceSeqRef.current;
    if (rIds.indexOf(myId) < 0) {
      // 👁️ 觀戰者：不進賽局，改看上帝視角面板
      setRandomLevelData(payload.randomLevelData);
      setCurrentLevelId(payload.levelId || 2);
      stateRef.current = _extends({}, stateRef.current, payload);
      setBrawlBoards({});setGodViewUid(null);
      setRaceResult(null);setRaceWaiting(false);
      raceResultsRef.current = {}; // 觀戰者也要清上一場成績/進度：不清的話新局第一筆 RACE_FINISH 會被舊紀錄擋下、maybeFinalize 還會拿舊成績提前結算（稽核修，選手分支本來就有清）
      var seedS = {};
      playersListRef.current.forEach(function (p) {
        seedS[p.id] = { progress: 0, name: p.name, color: p.color };
      });
      if (!seedS[myId]) seedS[myId] = { progress: 0, name: myNameRef.current || '你', color: myColorRef.current };
      setRaceProgress(seedS);
      myItemsRef.current = [];setMyItems([]);
      setRaceState('spectating');raceStateRef.current = 'spectating';
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
    setIsWon(false);setHideVictoryModal(false);
    resetWinMeta();
    setConfetti([]);
    raceStartAtRef.current = startAt;
    myFinishTimeRef.current = null;
    raceResultsRef.current = {};
    setRaceResult(null);setRaceWaiting(false);setRaceCountdown(null);
    lastProgressValRef.current = -1;lastProgressSentRef.current = 0;
    myItemsRef.current = [];setMyItems([]);milestonesRef.current = {};hostMilestonesRef.current = {};lastOneRef.current = false;hashiGiftCreditRef.current = 0;hashiGiftUnitsRef.current = 0;
    setBrawlBoards({});setGodViewUid(null);
    fxRef.current = { fog: {}, boxes: [], marks: [] };setFxFog({});setFxFogBoxes([]);setFxMarks([]);
    stateRef.current = _extends({}, stateRef.current, payload);
    var seed = {};
    playersListRef.current.forEach(function (p) {
      seed[p.id] = { progress: 0, name: p.name, color: p.color };
    });
    if (!seed[myId]) seed[myId] = { progress: 0, name: myNameRef.current || '你', color: myColorRef.current };
    setRaceProgress(seed);
    setCursors({}); // 🏁 競速開始：清掉大廳殘留的游標（競速模式不顯示游標，防作弊）
    levelDimRef.current = { w: payload.randomLevelData.width, h: payload.randomLevelData.height };
    setBoardFadeKey(function (k) {
      return k + 1;
    });scheduleFitZoom();
    setRaceState('countdown');raceStateRef.current = 'countdown';
    var now = Date.now() + platTimeOffset(); // startAt 是房主時鐘的絕對時刻：以校正後時間排倒數（D-05）
    [3, 2, 1].forEach(function (n) {
      var delay = Math.max(0, startAt - n * 1000 - now);
      setTimeout(function () {
        if (raceSeqRef.current !== seq || raceStateRef.current !== 'countdown') return;
        setRaceCountdown(n);
        window.HASHI_SOUND.play('countdown');
      }, delay);
    });
    setTimeout(function () {
      if (raceSeqRef.current !== seq || raceStateRef.current !== 'countdown') return;
      setRaceCountdown(0);
      window.HASHI_SOUND.play('go');
      setRaceState('racing');raceStateRef.current = 'racing';
      setTimeout(function () {
        if (raceSeqRef.current === seq) setRaceCountdown(null);
      }, 900);
    }, Math.max(0, startAt - now));
  };

  var onRaceSelfFinish = function onRaceSelfFinish(timeMs) {
    sendBrawlMsg({ type: 'BRAWL_STATE', uid: myId, name: myNameRef.current || '你', color: myColorRef.current, progress: 1, bridges: stateRef.current.bridges });
    myFinishTimeRef.current = timeMs;
    finishResentRef.current = 0;
    var msg = { type: 'RACE_FINISH', uid: myId, name: myNameRef.current || '你', color: myColorRef.current, timeMs: timeMs };
    if (isHostRef.current) {
      connsRef.current.forEach(function (c) {
        if (c.open) c.send(msg);
      });
    } else if (connRef.current && connRef.current.open) {
      connRef.current.send(msg);
    }
    if (!maybeFinalize()) {
      setRaceWaiting(true);
      showToast("🏁 你完成了！已自動轉為上帝模式觀戰");
    }
  };

  var onRaceOpponentFinish = function onRaceOpponentFinish(uid, m) {
    if (raceResultsRef.current[uid]) return;
    raceResultsRef.current[uid] = { name: m.name || '對手', color: m.color, timeMs: m.timeMs };
    if (!maybeFinalize()) {
      if (myFinishTimeRef.current == null && raceStateRef.current === 'racing') showToast("🏁 " + (m.name || '對手') + " 已完成！加油！");
      maybeConvertLastOne(); // 對手完賽後若只剩我 → 庫存攻擊道具轉禮物
    }
  };

  // 選手中途離開/斷線：記為 DNF（未完成，保留最後進度），比賽繼續，其他人照常結算
  var markRacerDnf = function markRacerDnf(uid) {
    if (!uid) return;
    if (raceStateRef.current !== 'countdown' && raceStateRef.current !== 'racing') return;
    if ((racersRef.current || []).indexOf(uid) < 0) return;
    if (raceResultsRef.current[uid]) return;
    var prog = raceProgressRef.current || {};
    var pl = (playersListRef.current || []).find(function (x) {
      return x.id === uid;
    });
    raceResultsRef.current[uid] = { name: pl ? pl.name : prog[uid] ? prog[uid].name : '玩家', color: pl ? pl.color : prog[uid] ? prog[uid].color : '#94a3b8', timeMs: null, dnf: true, progress: prog[uid] ? prog[uid].progress : 0 };
    maybeFinalize();
    maybeConvertLastOne(); // 對手離場後若只剩我 → 同樣轉換（他若回座不追回，比照結算把 DNF 當出局）
  };

  // 數橋的結算：全員完賽或 DNF 才結算（沒有數獨那種「去第幾名」設定）；未完成者以進度排名
  var maybeFinalize = function maybeFinalize() {
    if (raceStateRef.current === 'finished') return true;
    var racers = racersRef.current || [];
    if (!racers.length) return false;
    var finCount = (myFinishTimeRef.current != null && racers.indexOf(myId) >= 0 ? 1 : 0) + Object.keys(raceResultsRef.current).filter(function (uid) {
      return racers.indexOf(uid) >= 0;
    }).length;
    if (finCount >= racers.length) {
      finalizeRace();return true;
    }
    return false;
  };

  var finalizeRace = function finalizeRace() {
    var prog = raceProgressRef.current || {};
    var nameOf = function nameOf(uid) {
      var p = playersListRef.current.find(function (x) {
        return x.id === uid;
      });return p ? p.name : prog[uid] ? prog[uid].name : '玩家';
    };
    var colorOf = function colorOf(uid) {
      var p = playersListRef.current.find(function (x) {
        return x.id === uid;
      });return p ? p.color : prog[uid] ? prog[uid].color : '#94a3b8';
    };
    var entries = [];
    if (myFinishTimeRef.current != null && racersRef.current.indexOf(myId) >= 0) entries.push({ uid: myId, name: myNameRef.current || '你', color: myColorRef.current, timeMs: myFinishTimeRef.current, finished: true });
    Object.keys(raceResultsRef.current).forEach(function (uid) {
      if (racersRef.current.indexOf(uid) < 0) return;
      var r = raceResultsRef.current[uid];
      if (r.dnf) return; // DNF 走下方未完成桶
      entries.push({ uid: uid, name: r.name, color: r.color, timeMs: r.timeMs, finished: true });
    });
    entries.sort(function (a, b) {
      return a.timeMs - b.timeMs;
    });
    var finUids = {};entries.forEach(function (e) {
      finUids[e.uid] = true;
    });
    var dnf = racersRef.current.filter(function (uid) {
      return !finUids[uid];
    }).map(function (uid) {
      var rr = raceResultsRef.current[uid];return { uid: uid, name: nameOf(uid), color: colorOf(uid), progress: rr && rr.progress != null ? rr.progress : prog[uid] ? prog[uid].progress : 0, finished: false };
    });
    dnf.sort(function (a, b) {
      return b.progress - a.progress;
    });
    var all = entries.concat(dnf);
    if (myFinishTimeRef.current != null) {
      var islCount = (stateRef.current.randomLevelData && stateRef.current.randomLevelData.islands || []).length || 1;
      var s = computeStars(Math.floor(myFinishTimeRef.current / 1000), islCount, false);
      setStars(s);
      for (var si = 0; si < s; si++) {
        setTimeout(function () {
          return window.HASHI_SOUND.play('star');
        }, 200 + si * 320);
      }
    } else setStars(0);
    setRaceResult({ winnerUid: all.length ? all[0].uid : null, entries: all });
    setRaceWaiting(false);
    setRaceState('finished');raceStateRef.current = 'finished';
  };

  var exitRaceToSolo = function exitRaceToSolo() {
    setRoomOpen(false);
    myItemsRef.current = [];setMyItems([]);setBrawlBoards({});setGodViewUid(null);
    fxRef.current = { fog: {}, boxes: [], marks: [] };setFxFog({});setFxFogBoxes([]);setFxMarks([]);
    setRaceState('idle');raceStateRef.current = 'idle';
    setRaceWaiting(false);setRaceResult(null);setRaceCountdown(null);setRaceProgress({});
    raceResultsRef.current = {};myFinishTimeRef.current = null;
    switchToOffline();
  };
  // ================== 🏁 競速模式結束 ==================

  var handlePlayerColorChange = function handlePlayerColorChange(playerId, newColor) {
    if (engineRef.current === 'none') return;

    if (engineRef.current === 'peerjs') {
      if (isHostRef.current) {
        setPlayersList(function (prev) {
          var nList = prev.map(function (p) {
            if (p.id === playerId) return _extends({}, p, { color: newColor });
            return p;
          });
          connsRef.current.forEach(function (c) {
            return c.send({ type: 'PLAYERS_UPDATE', players: nList });
          });
          return nList;
        });
      } else if (connRef.current) {
        connRef.current.send({ type: 'REQ_COLOR_CHANGE', targetId: playerId, color: newColor });
      }
    }
  };

  // 改名（比照數獨 handlePlayerNameChange）：房主直接改名單並廣播；來賓送 REQ_NAME_CHANGE 請房主改
  var handlePlayerNameChange = function handlePlayerNameChange(playerId, newName) {
    if (engineRef.current === 'none') {
      setPlayersList(function (prev) {
        return prev.map(function (p) {
          return p.id === playerId ? _extends({}, p, { name: newName }) : p;
        });
      });
    } else if (engineRef.current === 'peerjs') {
      if (isHostRef.current) {
        var nList = playersListRef.current.map(function (p) {
          return p.id === playerId ? _extends({}, p, { name: newName }) : p;
        });setPlayersList(nList);connsRef.current.forEach(function (c) {
          if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: nList });
        });
      } else if (connRef.current) connRef.current.send({ type: 'REQ_NAME_CHANGE', targetId: playerId, name: newName });
    }
    showToast("✅ 暱稱修改成功！");
  };

  useEffect(function () {
    var islands = randomLevelData && randomLevelData.islands ? randomLevelData.islands : [];
    if (islands.length === 0) {
      if (isWon) {
        setIsWon(false);setEndTime(null);
      }
      return;
    }

    var allCountsMatch = true;
    for (var i = 0; i < islands.length; i++) {
      if (islandCurrentCounts[islands[i].id].real !== islands[i].req) {
        allCountsMatch = false;break;
      }
    }
    if (!allCountsMatch) {
      if (isWon) {
        setIsWon(false);setEndTime(null);
      }
      return;
    }

    var adjList = {};islands.forEach(function (i) {
      adjList[i.id] = [];
    });
    (bridges || []).forEach(function (b) {
      if (b.count > 0 && adjList[b.from] && adjList[b.to]) {
        adjList[b.from].push(b.to);adjList[b.to].push(b.from);
      }
    });
    var visited = new Set();var queue = [islands[0].id];
    if (queue.length > 0) visited.add(queue[0]);
    while (queue.length > 0) {
      var curr = queue.shift();
      if (adjList[curr]) {
        adjList[curr].forEach(function (neighbor) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);queue.push(neighbor);
          }
        });
      }
    }
    if (visited.size === islands.length && islands.length > 0) {
      if (!isWon) {
        setIsWon(true);
        setEndTime(Date.now());
        setHideVictoryModal(false);
        var secs = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        if (raceStateRef.current === 'racing') {
          // 🏁 競速完賽：記錄個人成績並通知對手，不播標準勝利音效
          var timeMs = Math.max(0, Date.now() + platTimeOffset() - raceStartAtRef.current); // 以房主時鐘校正後計算（D-05：各裝置時鐘差不再系統性偏袒時鐘慢的一方）
          recordBest(Math.max(0, Math.floor(timeMs / 1000)));
          onRaceSelfFinish(timeMs);
        } else {
          window.HASHI_SOUND.play('win');
          var s = computeStars(secs, islands.length, showSolution);
          setStars(s);
          for (var si = 0; si < s; si++) {
            setTimeout(function () {
              return window.HASHI_SOUND.play('star');
            }, 200 + si * 320);
          }
          recordBest(secs);
          if (isDailyModeRef.current) {
            recordDailyWin(secs);
          }
        }
      }
    } else {
      if (isWon) {
        setIsWon(false);setEndTime(null);
      }
    }
  }, [bridges, randomLevelData, islandCurrentCounts, isWon]);

  var handleSaveCode = function handleSaveCode() {
    var saveData = {
      lid: currentLevelId,
      r: randomLevelData,
      b: (bridges || []).filter(function (br) {
        return br.count > 0 || (br.draftCount || 0) > 0;
      }).map(function (br) {
        return { i: br.id, c: br.count, d: br.draftCount || 0, o: br.owner };
      }),
      s: strokes
    };
    var code = btoa(encodeURIComponent(JSON.stringify(saveData)));
    setSaveCode(code);
    var textArea = document.createElement("textarea");textArea.value = code;document.body.appendChild(textArea);textArea.select();
    try {
      document.execCommand('copy');showToast("✅ 已產生並複製代碼！");
    } catch (err) {}
    document.body.removeChild(textArea);
  };

  var handleQuickPaste = function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var text, ta;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;

              if (!(navigator.clipboard && navigator.clipboard.readText)) {
                _context2.next = 8;
                break;
              }

              _context2.next = 4;
              return navigator.clipboard.readText();

            case 4:
              text = _context2.sent;
              if (text) {
                setSaveCode(text);showToast("✅ 貼上成功！");
              }_context2.next = 9;
              break;

            case 8:
              throw new Error();

            case 9:
              _context2.next = 16;
              break;

            case 11:
              _context2.prev = 11;
              _context2.t0 = _context2['catch'](0);
              ta = document.getElementById("saveCodeTextarea");
              if (ta) ta.focus();showToast("⚠️ 瀏覽器阻擋自動貼上，請手動貼上");
            case 16:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this, [[0, 11]]);
    }));

    return function handleQuickPaste() {
      return _ref3.apply(this, arguments);
    };
  }();

  var handleLoadCode = function handleLoadCode() {
    try {
      if (!saveCode.trim()) return showToast("⚠️ 請貼上代碼");
      var data = JSON.parse(decodeURIComponent(atob(saveCode.trim())));

      var baseLevel = void 0,
          newRandom = void 0;
      if (data.lid === 'custom' || data.lid === 'daily') {
        baseLevel = { id: data.lid, name: data.lid === 'daily' ? '\uD83D\uDCC5 \u6BCF\u65E5\u4E00\u984C' : '\u2699\uFE0F \u81EA\u8A02\u5C3A\u5BF8', islands: data.r && data.r.islands ? data.r.islands : [] };
        newRandom = data.r;
      } else {
        baseLevel = LEVELS.find(function (l) {
          return l.id === data.lid;
        });
        if (!baseLevel) return showToast("⚠️ 無效的代碼");
        newRandom = data.r;
      }

      var islandsToUse = newRandom && newRandom.islands ? newRandom.islands : baseLevel.islands;
      var emptyBridges = HASHI_PUZZLE.generateEmptyBridges({ islands: islandsToUse });

      data.b.forEach(function (savedBr) {
        var tb = emptyBridges.find(function (eb) {
          return eb.id === savedBr.i;
        });if (tb) {
          tb.count = savedBr.c || 0;tb.draftCount = savedBr.d || 0;tb.owner = savedBr.o;
        }
      });
      setCurrentLevelId(data.lid);
      syncState({ randomLevelData: newRandom, bridges: emptyBridges, strokes: data.s || [], showSolution: false });
      setIsWon(false);setShowSaveModal(false);showToast("✅ 讀取成功！");
    } catch (e) {
      showToast("⚠️ 讀檔失敗！");
    }
  };

  // G2（v1.57.0，比照數獨 F3）：按鈕觸發的縮放加 200ms travel 過渡——先在 svg 掛 transition 再改尺寸；
  // 260ms 後自動卸下，雙指捏合（handleTouchMove）走另一條路、維持即時跟手。連按重掛即可 retarget。
  var zoomAnimTimerRef = useRef(null);
  var armZoomTransition = function armZoomTransition() {
    var svg = svgRef.current;if (!svg) return;
    svg.style.transition = 'width 200ms cubic-bezier(0.22, 1, 0.36, 1), height 200ms cubic-bezier(0.22, 1, 0.36, 1)';
    if (zoomAnimTimerRef.current) clearTimeout(zoomAnimTimerRef.current);
    zoomAnimTimerRef.current = setTimeout(function () {
      if (svgRef.current) svgRef.current.style.transition = '';
    }, 260);
  };

  var handleZoomIn = function handleZoomIn() {
    armZoomTransition();
    var newZoom = Math.min(zoomLevelRef.current + 0.3, 3.5);
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
      svgRef.current.style.width = svgW * newZoom + 'px';
      svgRef.current.style.height = svgH * newZoom + 'px';
    }
  };
  var handleZoomOut = function handleZoomOut() {
    armZoomTransition();
    var newZoom = Math.max(zoomLevelRef.current - 0.3, 0.4);
    userZoomedRef.current = true;
    zoomLevelRef.current = newZoom;
    setZoomLevel(newZoom);
    setZoomModeIdx(0);
    zoomModeIdxRef.current = 0;
    if (svgRef.current) {
      svgRef.current.style.width = svgW * newZoom + 'px';
      svgRef.current.style.height = svgH * newZoom + 'px';
    }
  };
  var handleZoomReset = function handleZoomReset() {
    armZoomTransition();
    zoomLevelRef.current = 1;
    userZoomedRef.current = true;
    setZoomLevel(1);
    setZoomModeIdx(0);
    zoomModeIdxRef.current = 0;
    if (svgRef.current) {
      svgRef.current.style.width = svgW + 'px';
      svgRef.current.style.height = svgH + 'px';
    }
  };

  // === 題目自動適應螢幕（新題目 / 旋轉螢幕時呼叫） ===
  var applyFitZoom = function applyFitZoom() {
    var container = zoomContainerRef.current;
    if (!container) return false;
    var cw = container.clientWidth;
    var ch = container.clientHeight;
    if (!cw || !ch) return false;
    var _levelDimRef$current = levelDimRef.current,
        w = _levelDimRef$current.w,
        h = _levelDimRef$current.h;

    var sW = (w - 1) * SCALE + PADDING * 2;
    var sH = (h - 1) * SCALE + PADDING * 2;
    // clientWidth 含容器 padding，盤面實際可用空間要扣掉容器與內層包裝的 padding，
    // 否則手機上盤面會比可視區寬一點點、最右欄被切掉（2026-10-17 修）
    var cs = window.getComputedStyle(container);
    var padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    var padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    var wrapEl = container.firstElementChild;
    var wrapPadR = 0,
        wrapPadB = 0;
    if (wrapEl) {
      var ws = window.getComputedStyle(wrapEl);wrapPadR = parseFloat(ws.paddingRight) || 0;wrapPadB = parseFloat(ws.paddingBottom) || 0;
    }
    var availW = Math.max(50, cw - padX - wrapPadR);
    var availH = Math.max(50, ch - padY - wrapPadB);
    var paddingFactor = 0.98;
    var newZoom = Math.min(availW / sW, availH / sH) * paddingFactor;
    newZoom = Math.min(Math.max(newZoom, 0.2), 3.5);
    if (sW * newZoom > MAX_SAFE_DIMENSION || sH * newZoom > MAX_SAFE_DIMENSION) {
      newZoom = Math.min(MAX_SAFE_DIMENSION / sW, MAX_SAFE_DIMENSION / sH);
    }
    userZoomedRef.current = false;
    zoomLevelRef.current = newZoom;
    setZoomLevel(newZoom);
    setZoomModeIdx(3);
    zoomModeIdxRef.current = 3;
    if (svgRef.current) {
      svgRef.current.style.width = sW * newZoom + 'px';
      svgRef.current.style.height = sH * newZoom + 'px';
    }
    // 保底：若實際捲動寬度仍大於可視寬度，依比例縮到剛好（只縮不放大）
    if (container.scrollWidth > container.clientWidth + 1 && sW * newZoom > 0) {
      var fix = container.clientWidth / container.scrollWidth;
      if (fix < 1) {
        newZoom = newZoom * fix;
        zoomLevelRef.current = newZoom;
        setZoomLevel(newZoom);
        if (svgRef.current) {
          svgRef.current.style.width = sW * newZoom + 'px';
          svgRef.current.style.height = sH * newZoom + 'px';
        }
      }
    }
    return true;
  };
  var scheduleFitZoom = function scheduleFitZoom() {
    // 等 DOM 穩定再量測；量不到就 350ms 後重試一次
    setTimeout(function () {
      requestAnimationFrame(function () {
        if (!applyFitZoom()) {
          setTimeout(function () {
            return requestAnimationFrame(function () {
              applyFitZoom();
            });
          }, 350);
        }
      });
    }, 60);
  };

  var handleCycleZoom = function handleCycleZoom() {
    armZoomTransition();
    var nextIdx = (zoomModeIdxRef.current + 1) % 4;
    setZoomModeIdx(nextIdx);
    zoomModeIdxRef.current = nextIdx;
    userZoomedRef.current = true; // 手動縮放

    var container = zoomContainerRef.current;
    if (!container) return;

    var paddingFactor = 0.95;
    var cw = container.clientWidth;
    var ch = container.clientHeight;

    var newZoom = 1;
    if (nextIdx === 0) {
      newZoom = 1;
      showToast("🔍 原始大小 (1x)");
    } else if (nextIdx === 1) {
      newZoom = cw / svgW * paddingFactor;
      showToast("↔️ 適應螢幕寬度");
    } else if (nextIdx === 2) {
      newZoom = ch / svgH * paddingFactor;
      showToast("↕️ 適應螢幕長度");
    } else if (nextIdx === 3) {
      newZoom = Math.min(cw / svgW, ch / svgH) * paddingFactor;
      showToast("🔲 長寬自動適應");
    }

    newZoom = Math.min(Math.max(newZoom, 0.2), 3.5);

    if (svgW * newZoom > MAX_SAFE_DIMENSION || svgH * newZoom > MAX_SAFE_DIMENSION) {
      newZoom = Math.min(MAX_SAFE_DIMENSION / svgW, MAX_SAFE_DIMENSION / svgH);
    }

    zoomLevelRef.current = newZoom;
    setZoomLevel(newZoom);

    if (svgRef.current) {
      svgRef.current.style.width = svgW * newZoom + 'px';
      svgRef.current.style.height = svgH * newZoom + 'px';
    }
  };

  // === 首次教學導覽 overlay（可在任何畫面開啟） ===
  var closeTutorial = function closeTutorial() {
    try {
      localStorage.setItem('hashi_tutorial_seen', '1');
    } catch (e) {}
    setShowTutorial(false);
  };
  // ===== 👆 架橋教學動畫（兩幕：拖曳 → 點擊三連拍） =====
  var BridgeDemo = function BridgeDemo() {
    return React.createElement(
      'div',
      { className: 'bdemo mb-4', 'aria-hidden': 'true' },
      React.createElement(
        'div',
        { className: 'bdemo-section bdemo-sec1' },
        '\u62D6\u66F3'
      ),
      React.createElement(
        'div',
        { className: 'bdemo-section bdemo-sec2' },
        '\u9EDE\u64CA'
      ),
      React.createElement(
        'div',
        { className: 'bdemo-label bdemo-l1' },
        '\uD83D\uDC46 \u6309\u4F4F\u62D6\u66F3\uFF0C\u653E\u958B\u67B6\u6A4B'
      ),
      React.createElement(
        'div',
        { className: 'bdemo-label bdemo-l2' },
        '\u9EDE\u4E00\u4E0B\uFF1A1 \u5EA7\u6A4B'
      ),
      React.createElement(
        'div',
        { className: 'bdemo-label bdemo-l3' },
        '\u9EDE\u5169\u4E0B\uFF1A2 \u5EA7\u6A4B'
      ),
      React.createElement(
        'div',
        { className: 'bdemo-label bdemo-l4' },
        '\u9EDE\u4E09\u4E0B\uFF1A\u53D6\u6D88'
      ),
      React.createElement(
        'div',
        { className: 'bdemo-scene' },
        React.createElement(
          'div',
          { className: 'bdemo-island', style: { left: '30px' } },
          '3'
        ),
        React.createElement(
          'div',
          { className: 'bdemo-island', style: { left: '210px' } },
          '2'
        ),
        React.createElement('div', { className: 'bdemo-preview' }),
        React.createElement('div', { className: 'bdemo-bridge bdemo-b1' }),
        React.createElement('div', { className: 'bdemo-bridge bdemo-bd1' }),
        React.createElement('div', { className: 'bdemo-bridge bdemo-bd2' }),
        React.createElement(
          'div',
          { className: 'bdemo-finger' },
          '\uD83D\uDC46'
        ),
        React.createElement('div', { className: 'bdemo-ripple' })
      )
    );
  };

  // ===== ✏️ 草稿教學動畫：虛線兩法 → 切畫筆一點變實線 =====
  var DraftDemo = function DraftDemo() {
    return React.createElement(
      'div',
      { className: 'bdemo mb-4', 'aria-hidden': 'true' },
      React.createElement(
        'div',
        { className: 'bdemo-label ddemo-l1' },
        '\u270F\uFE0F \u8349\u7A3F\uFF1A\u62D6\u66F3\u756B\u51FA\u865B\u7DDA'
      ),
      React.createElement(
        'div',
        { className: 'bdemo-label ddemo-l2' },
        '\uD83D\uDC46 \u9EDE\u64CA\uFF1A\u9EDE\u5169\u4E0B 2 \u689D\u865B\u7DDA'
      ),
      React.createElement(
        'div',
        { className: 'bdemo-label ddemo-l3' },
        '\u5207\u56DE\u756B\u7B46\u6A21\u5F0F \u270E'
      ),
      React.createElement(
        'div',
        { className: 'bdemo-label ddemo-l4' },
        '\u9EDE\u4E00\u4E0B\uFF1A\u865B\u7DDA\u76F4\u63A5\u8B8A\u5BE6\u7DDA\uFF01'
      ),
      React.createElement(
        'div',
        { className: 'bdemo-scene' },
        React.createElement(
          'div',
          { className: 'ddemo-mode' },
          React.createElement(
            'span',
            { className: 'ddemo-m ddemo-m-draft' },
            '\u270F\uFE0F \u8349\u7A3F'
          ),
          React.createElement(
            'span',
            { className: 'ddemo-m ddemo-m-pen' },
            '\u270E \u756B\u7B46'
          )
        ),
        React.createElement(
          'div',
          { className: 'bdemo-island', style: { left: '30px' } },
          '3'
        ),
        React.createElement(
          'div',
          { className: 'bdemo-island', style: { left: '210px' } },
          '2'
        ),
        React.createElement('div', { className: 'bdemo-preview ddemo-preview' }),
        React.createElement('div', { className: 'ddemo-dash ddemo-db1' }),
        React.createElement('div', { className: 'ddemo-dash ddemo-dbA' }),
        React.createElement('div', { className: 'ddemo-dash ddemo-dbB' }),
        React.createElement('div', { className: 'bdemo-bridge ddemo-sbA' }),
        React.createElement('div', { className: 'bdemo-bridge ddemo-sbB' }),
        React.createElement(
          'div',
          { className: 'bdemo-finger ddemo-finger' },
          '\uD83D\uDC46'
        ),
        React.createElement('div', { className: 'bdemo-ripple ddemo-ripple' })
      )
    );
  };

  // ===== 🔌 連線教學動畫：房主建房拿代碼 → 代碼飛給朋友 → 朋友輸入加入 → 成功 =====
  var ConnectDemo = function ConnectDemo() {
    return React.createElement(
      'div',
      { className: 'conn-demo mb-4', 'aria-hidden': 'true' },
      React.createElement(
        'div',
        { className: 'conn-phone conn-host' },
        React.createElement(
          'div',
          { className: 'conn-ptitle' },
          '\uD83C\uDFE0 \u623F\u4E3B'
        ),
        React.createElement(
          'div',
          { className: 'conn-btn' },
          '\u5EFA\u7ACB\u623F\u9593'
        ),
        React.createElement(
          'div',
          { className: 'conn-code' },
          React.createElement(
            'span',
            null,
            '1'
          ),
          React.createElement(
            'span',
            null,
            '2'
          ),
          React.createElement(
            'span',
            null,
            '3'
          ),
          React.createElement(
            'span',
            null,
            '4'
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'conn-wire' },
        React.createElement(
          'div',
          { className: 'conn-chip' },
          '1234'
        )
      ),
      React.createElement(
        'div',
        { className: 'conn-phone conn-guest' },
        React.createElement(
          'div',
          { className: 'conn-ptitle' },
          '\uD83D\uDEAA \u670B\u53CB'
        ),
        React.createElement(
          'div',
          { className: 'conn-input' },
          React.createElement(
            'span',
            null,
            '1'
          ),
          React.createElement(
            'span',
            null,
            '2'
          ),
          React.createElement(
            'span',
            null,
            '3'
          ),
          React.createElement(
            'span',
            null,
            '4'
          )
        ),
        React.createElement(
          'div',
          { className: 'conn-btn' },
          '\u52A0\u5165\u623F\u9593'
        )
      ),
      React.createElement(
        'div',
        { className: 'conn-success' },
        '\u2705 \u9023\u7DDA\u6210\u529F\uFF01'
      )
    );
  };

  var openTutorial = function openTutorial() {
    window.HASHI_SOUND.play('click');
    setTutorialStep(0);
    setShowTutorial(true);
  };

  var tutorialOverlay = showTutorial ? React.createElement(
    'div',
    { className: 'fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4', onClick: closeTutorial },
    React.createElement(
      'div',
      { className: 'bg-[#fffaf0] border-4 border-slate-800 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,1)] max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 relative', onClick: function onClick(e) {
          return e.stopPropagation();
        } },
      React.createElement(
        'button',
        { onClick: closeTutorial, className: 'absolute top-3 right-3 w-11 h-11 rounded-full bg-white border-4 border-slate-800 text-xl font-black text-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] z-20 flex items-center justify-center' },
        '\u2715'
      ),
      React.createElement(
        'h2',
        { className: 'text-3xl font-black text-slate-800 border-b-8 border-[#4ade80] pb-2 inline-block mb-5 relative z-10' },
        '\u2753 \u73A9\u6CD5\u6559\u5B78'
      ),
      React.createElement(
        'div',
        { className: 'bg-white border-[3px] border-slate-800 rounded-xl p-4 mb-4 shadow-[4px_4px_0px_rgba(30,41,59,1)] h-[400px] flex flex-col' },
        React.createElement(
          'div',
          { className: 'h-[196px] shrink-0 flex items-center justify-center overflow-hidden w-full' },
          TUTORIAL_STEPS[tutorialStep].demo === 'connect' && React.createElement(
            'div',
            { className: 'w-full' },
            React.createElement(ConnectDemo, null)
          ),
          TUTORIAL_STEPS[tutorialStep].demo === 'bridge' && React.createElement(
            'div',
            { className: 'w-full' },
            React.createElement(BridgeDemo, null)
          ),
          TUTORIAL_STEPS[tutorialStep].demo === 'draft' && React.createElement(
            'div',
            { className: 'w-full' },
            React.createElement(DraftDemo, null)
          ),
          !TUTORIAL_STEPS[tutorialStep].demo && React.createElement(
            'div',
            { className: 'text-7xl' },
            TUTORIAL_STEPS[tutorialStep].icon
          )
        ),
        React.createElement(
          'h3',
          { className: 'text-lg font-black text-slate-800 text-center mt-1' },
          TUTORIAL_STEPS[tutorialStep].title
        ),
        React.createElement(
          'p',
          { className: 'text-[13px] font-bold text-slate-600 leading-relaxed text-center mt-1' },
          TUTORIAL_STEPS[tutorialStep].body
        )
      ),
      React.createElement(
        'div',
        { className: 'flex justify-center gap-2 mb-5' },
        TUTORIAL_STEPS.map(function (_, idx) {
          return React.createElement('div', { key: idx, className: 'w-3.5 h-3.5 rounded-full border-2 border-slate-800 ' + (idx === tutorialStep ? 'bg-[#4ade80]' : 'bg-white') });
        })
      ),
      React.createElement(
        'div',
        { className: 'flex gap-3' },
        tutorialStep > 0 ? React.createElement(
          'button',
          { onClick: function onClick() {
              window.HASHI_SOUND.play('click');setTutorialStep(tutorialStep - 1);
            }, className: 'flex-1 py-4 bg-white border-4 border-slate-800 rounded-xl font-black text-xl text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)]' },
          '\u4E0A\u4E00\u6B65'
        ) : React.createElement('div', { className: 'flex-1' }),
        React.createElement(
          'button',
          { onClick: closeTutorial, className: 'flex-1 py-4 bg-white border-4 border-slate-800 rounded-xl font-black text-xl text-slate-400 shadow-[4px_4px_0px_rgba(30,41,59,1)]' },
          '\u8DF3\u904E'
        ),
        tutorialStep < TUTORIAL_STEPS.length - 1 ? React.createElement(
          'button',
          { onClick: function onClick() {
              window.HASHI_SOUND.play('click');setTutorialStep(tutorialStep + 1);
            }, className: 'flex-1 py-4 bg-[#4ade80] border-4 border-slate-800 rounded-xl font-black text-xl text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)]' },
          '\u4E0B\u4E00\u6B65'
        ) : React.createElement(
          'button',
          { onClick: closeTutorial, className: 'flex-1 py-4 bg-[#34d399] border-4 border-slate-800 rounded-xl font-black text-xl text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)]' },
          '\u958B\u59CB\u904A\u6232 \uD83C\uDFAE'
        )
      )
    )
  ) : null;

  if (screen === 'home') {
    return React.createElement(
      'div',
      { className: 'h-screen w-screen flex flex-col items-center justify-center p-4 relative overflow-hidden animate-fadeIn' },
      React.createElement(
        'div',
        { className: 'flex-1 flex flex-col justify-center w-full max-w-md items-center' },
        React.createElement(
          'div',
          { className: 'bg-[#f6fdf6] border-4 border-slate-800 p-10 rounded-xl shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full text-center relative transform -rotate-1 z-10' },
          React.createElement(
            'h1',
            { className: 'text-6xl font-black text-slate-800 mb-6 tracking-widest flex justify-center gap-3' },
            React.createElement(
              'span',
              { className: 'inline-block animate-float-slow bg-[#4ade80] px-4 py-2 border-4 border-slate-800 rounded-xl transform rotate-3 shadow-[4px_4px_0px_rgba(30,41,59,1)]' },
              '\u6578'
            ),
            React.createElement(
              'span',
              { className: 'inline-block animate-float-slow animate-float-slow-d bg-[#4ade80] px-4 py-2 border-4 border-slate-800 rounded-xl transform -rotate-2 shadow-[4px_4px_0px_rgba(30,41,59,1)]' },
              '\u6A4B'
            )
          ),
          React.createElement(
            'div',
            { className: 'inline-block border-[3px] border-dashed border-slate-800 rounded-xl px-6 py-2 mb-8 bg-white shadow-[4px_4px_0px_rgba(30,41,59,1)] transform rotate-2' },
            React.createElement(
              'p',
              { className: 'text-slate-800 font-black text-xl tracking-widest uppercase italic' },
              'Hashi Puzzle'
            )
          ),
          React.createElement(
            'div',
            { className: 'flex flex-col gap-5' },
            React.createElement(
              'button',
              { onClick: startSinglePlayer, className: 'plat-btn-hard w-full py-4 bg-white border-4 border-slate-800 rounded-xl font-black text-xl text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)] transform rotate-1' },
              '\uD83D\uDC64 \u55AE\u6A5F\u6311\u6230'
            ),
            React.createElement(
              'button',
              { onClick: function onClick() {
                  return startDailyMode(dailyMenuDate);
                }, className: 'plat-btn-hard w-full py-4 bg-[#4ade80] border-4 border-slate-800 rounded-xl font-black text-xl text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)] transform rotate-1' },
              '\uD83D\uDCC5 \u6BCF\u65E5\u4E00\u984C'
            ),
            React.createElement(
              'div',
              { className: '-mt-2 flex items-center justify-center gap-1.5' },
              React.createElement(
                'span',
                { className: 'text-slate-500 font-semibold text-xs whitespace-nowrap' },
                '\uD83D\uDD58 \u4EE5\u524D\u7684\u984C\u76EE'
              ),
              React.createElement(
                'button',
                { onClick: function onClick() {
                    return setDailyMenuDate(function (d) {
                      return clampDailyDate(HASHI_PUZZLE.shiftDateStr(d, -1));
                    });
                  }, disabled: dailyMenuDate <= MIN_DAILY_DATE, className: 'plat-btn-hard plat-btn-hard-2 px-2 py-1 bg-white border-2 border-slate-800 rounded-md font-black text-xs text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-30 active:translate-y-0.5' },
                '\u25C0'
              ),
              React.createElement(
                'button',
                { onClick: openDailyCal, className: 'plat-btn-hard plat-btn-hard-2 border-2 border-slate-800 rounded-md px-2 py-1 font-bold text-sm bg-white text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] active:translate-y-0.5' },
                '\uD83D\uDCC5 ',
                dailyMenuDate
              ),
              React.createElement(
                'button',
                { onClick: function onClick() {
                    return setDailyMenuDate(function (d) {
                      return clampDailyDate(HASHI_PUZZLE.shiftDateStr(d, 1));
                    });
                  }, disabled: dailyMenuDate >= HASHI_PUZZLE.getDailyDateStr(), className: 'plat-btn-hard plat-btn-hard-2 px-2 py-1 bg-white border-2 border-slate-800 rounded-md font-black text-xs text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-30 active:translate-y-0.5' },
                '\u25B6'
              )
            ),
            dailyStatus && React.createElement(
              'p',
              { className: 'text-slate-600 font-bold text-sm -mt-2' },
              dailyStatus.done ? '\u2705 \u5DF2\u5B8C\u6210 ' + formatTime(dailyStatus.done.time) : '\uD83D\uDCC5 ' + dailyStatus.dateStr,
              dailyStatus.streak > 1 ? '  \uD83D\uDD25 \u9023\u64CA x' + dailyStatus.streak : ''
            ),
            React.createElement(
              'button',
              { onClick: openTutorial, className: 'plat-btn-hard w-full py-4 bg-white border-4 border-slate-800 rounded-xl font-black text-xl text-slate-600 shadow-[4px_4px_0px_rgba(30,41,59,1)]' },
              '\u2753 \u73A9\u6CD5\u6559\u5B78'
            ),
            PLAT_MODE && React.createElement(
              'div',
              { className: 'flex items-center gap-2' },
              React.createElement(
                'button',
                { onClick: function onClick() {
                    if (window.PLAT_show) window.PLAT_show('home');
                  }, className: 'plat-btn-hard flex-1 py-3 bg-sky-400 border-4 border-slate-800 rounded-xl font-black text-lg text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)]' },
                '\uD83C\uDFE0 \u56DE\u5927\u5EF3'
              ),
              renderDockCapsule(false)
            )
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'shrink-0 pb-4 text-slate-800 font-black text-sm opacity-60 tracking-wider z-10' },
        'Copyright \xA9 2026 \u8449\u5927\u5E25. All rights reserved.',
        ' (v' + (window.PLAT_VERSION || '2.18') + ')'
      ),
      tutorialOverlay
    );
  }

  var sortedBridges = [].concat(_toConsumableArray(bridges)).sort(function (a, b) {
    var aActive = a.count + (a.draftCount || 0) > 0 ? 1 : 0;
    var bActive = b.count + (b.draftCount || 0) > 0 ? 1 : 0;
    return aActive - bActive;
  });

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

  return React.createElement(
    'div',
    { className: 'h-screen w-screen p-1 md:p-4 flex flex-col items-center font-sans relative', style: { backgroundColor: '#e9f7e9', backgroundImage: 'radial-gradient(#b7ddb7 2px, transparent 2px)', backgroundSize: '12px 12px' } },
    React.createElement(
      'div',
      { className: 'w-full max-w-[1200px] bg-[#f6fdf6] rounded-xl border-4 border-slate-800 shadow-[10px_10px_0px_rgba(30,41,59,1)] flex flex-col h-full relative z-10 overflow-hidden' },
      React.createElement(
        'div',
        { className: 'bg-gradient-to-b from-[#ffd633] to-[#4ade80] border-b-4 border-slate-800 shrink-0 z-50 relative transition-all duration-300 ease-in-out px-2 md:px-4 py-2 flex flex-col gap-2' },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between gap-1 w-full' },
          React.createElement(
            'div',
            { className: 'flex items-center gap-2 flex-wrap' },
            React.createElement(
              'h1',
              { className: 'font-black tracking-tight uppercase text-lg md:text-2xl text-[#1e293b] flex items-center gap-1' },
              '\uD83C\uDF09',
              React.createElement(
                'span',
                { className: 'hidden sm:inline' },
                '\u6578\u6A4B'
              )
            ),
            React.createElement(
              'div',
              { className: 'flex items-center gap-1 bg-[#1e293b] text-white px-2 py-1 rounded-md font-mono font-bold shadow-[2px_2px_0px_rgba(0,0,0,0.4)] text-xs md:text-sm whitespace-nowrap' },
              React.createElement(GameTimer, { startTime: startTime, endTime: endTime, isRunning: !isWon && screen === 'game' })
            ),
            isDailyMode && React.createElement(
              'span',
              { className: 'flex items-center gap-0.5 bg-[#4ade80] text-[#1e293b] pl-1 pr-1.5 py-1 rounded-md border-2 border-[#1e293b] font-black text-xs md:text-sm shadow-[2px_2px_0px_rgba(0,0,0,0.3)] whitespace-nowrap' },
              React.createElement(
                'button',
                { onClick: function onClick() {
                    return startDailyMode(HASHI_PUZZLE.shiftDateStr(dailyDateStr, -1));
                  }, disabled: dailyDateStr <= MIN_DAILY_DATE, className: 'disabled:opacity-30 px-1', title: '\u524D\u4E00\u5929\u7684\u984C\u76EE' },
                '\u25C0'
              ),
              React.createElement(
                'span',
                null,
                '\uD83D\uDCC5 ',
                dailyDateStr
              ),
              React.createElement(
                'button',
                { onClick: function onClick() {
                    return startDailyMode(HASHI_PUZZLE.shiftDateStr(dailyDateStr, 1));
                  }, disabled: dailyDateStr >= HASHI_PUZZLE.getDailyDateStr(), className: 'disabled:opacity-30 px-1', title: '\u5F8C\u4E00\u5929\u7684\u984C\u76EE' },
                '\u25B6'
              )
            ),
            isDailyMode && dailyStreak > 0 && React.createElement(
              'span',
              { className: 'bg-red-500 text-white px-2 py-1 rounded-md border-2 border-[#1e293b] font-black text-xs md:text-sm shadow-[2px_2px_0px_rgba(0,0,0,0.3)] whitespace-nowrap' },
              '\uD83D\uDD25 x',
              React.createElement(PlatNum, { value: dailyStreak })
            ),
            !PLAT_MODE && (videoOn || Object.keys(remoteVideos).length > 0) && React.createElement(
              'div',
              { className: 'px-4 py-2 bg-slate-800 flex gap-3 items-start overflow-x-auto shrink-0' },
              React.createElement(
                'div',
                { className: 'flex flex-col items-center shrink-0' },
                React.createElement(
                  'div',
                  { className: 'w-14 h-14 rounded-full overflow-hidden border-[3px] border-[#4ade80] shadow relative bg-slate-600' },
                  localStream ? React.createElement('video', { ref: function ref(el) {
                      if (el) el.srcObject = localStream;
                    }, autoPlay: true, playsInline: true, muted: true, className: 'w-full h-full object-cover', style: { transform: 'scaleX(-1)' } }) : React.createElement(
                    'div',
                    { className: 'w-full h-full flex items-center justify-center text-white font-black text-lg', style: { backgroundColor: myColorRef.current === 'rainbow' ? '#a855f7' : myColorRef.current || '#3b82f6' } },
                    (myNameRef.current || '你').slice(0, 1)
                  )
                ),
                React.createElement(
                  'span',
                  { className: 'text-white text-[10px] font-bold mt-0.5' },
                  '\u4F60',
                  micMuted ? ' 🔇' : ''
                )
              ),
              Object.entries(remoteVideos).map(function (entry) {
                var uid = entry[0];var stream = entry[1];
                var pl = playersList.find(function (p) {
                  return p.id === uid;
                });
                var nm = pl ? pl.name : '對手';
                return React.createElement(
                  'div',
                  { key: uid, className: 'flex flex-col items-center shrink-0' },
                  React.createElement(
                    'div',
                    { className: 'w-14 h-14 rounded-full overflow-hidden border-[3px] border-white shadow relative bg-slate-600' },
                    React.createElement('video', { ref: function ref(el) {
                        if (el) {
                          el.srcObject = stream;try {
                            el.muted = !speakerOnRef.current;
                          } catch (e) {}
                        }
                      }, autoPlay: true, playsInline: true, muted: true, className: 'remote-video-el w-full h-full object-cover' })
                  ),
                  React.createElement(
                    'span',
                    { className: 'text-white text-[10px] font-bold mt-0.5 max-w-[64px] truncate' },
                    nm,
                    remoteMic[uid] === false ? ' 🎤' : ''
                  )
                );
              })
            ),
            isMultiplayer && React.createElement(
              'span',
              { className: 'bg-emerald-400 text-slate-900 px-2 py-1 rounded-md border-2 border-slate-800 font-black text-xs md:text-sm shadow-[2px_2px_0px_rgba(30,41,59,1)] flex items-center gap-1 whitespace-nowrap' },
              isHostRef.current ? '👑 主機' : '👤 玩家',
              ' | \u4EE3\u78BC: ',
              roomId
            )
          ),
          React.createElement(
            'button',
            { onClick: function onClick() {
                return setIsHeaderCollapsed(!isHeaderCollapsed);
              }, className: 'flex px-2 md:px-3 py-1 bg-[#1e293b] text-white border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:bg-slate-800 items-center gap-1 whitespace-nowrap' },
            isHeaderCollapsed ? '🔽 展開規則' : '🔼 縮小面板'
          )
        ),
        React.createElement(
          'div',
          { className: "plat-collapse-y w-full" + (isHeaderCollapsed ? "" : " open") },
          React.createElement(
            'div',
            { className: 'bg-white border-[3px] border-[#1e293b] rounded-xl p-3 text-[#1e293b] shadow-[4px_4px_0px_#1e293b] flex flex-col md:flex-row gap-3' },
            React.createElement(
              'div',
              { className: 'flex-1' },
              React.createElement(
                'h3',
                { className: 'text-sm md:text-base font-black mb-1 border-b-[3px] border-[#4ade80] inline-block pb-0.5' },
                '\uD83D\uDCDC \u904A\u6232\u56DB\u5927\u898F\u5247'
              ),
              React.createElement(
                'ol',
                { className: 'list-decimal list-outside ml-4 space-y-1 text-xs md:text-sm leading-relaxed font-bold' },
                React.createElement(
                  'li',
                  null,
                  '\u6BCF\u500B\u5713\u5708\u662F\u4E00\u5EA7\u300C\u5CF6\u300D\uFF0C\u6578\u5B57\u4EE3\u8868\u9700\u8981\u5E7E\u5EA7\u6A4B\u6A11\u3002'
                ),
                React.createElement(
                  'li',
                  null,
                  '\u6A4B\u6A11\u5FC5\u9808\u662F\u5782\u76F4\u6216\u6C34\u5E73\u65B9\u5411\u3002'
                ),
                React.createElement(
                  'li',
                  null,
                  '\u6A4B\u6A11\u4E4B\u9593\u7D55\u5C0D\u4E0D\u80FD\u4EA4\u53C9\u6216\u91CD\u758A\u3002'
                ),
                React.createElement(
                  'li',
                  null,
                  '\u5169\u5EA7\u5CF6\u4E4B\u9593\u6700\u591A\u67B6\u8A2D 2 \u5EA7\u6A4B\uFF0C\u4E14\u5B8C\u6210\u6642\u6240\u6709\u5CF6\u5DBC\u5FC5\u9808\u5168\u90E8\u9023\u901A\u3002'
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'md:w-1/3 bg-[#4ade80]/20 p-2 md:p-3 rounded-xl border-[3px] border-dashed border-[#1e293b] flex flex-col justify-center' },
              React.createElement(
                'p',
                { className: 'text-[#1e293b] font-black text-xs md:text-sm mb-1 flex items-center gap-1' },
                React.createElement(
                  'span',
                  null,
                  '\uD83D\uDCA1'
                ),
                ' \u63D0\u793A\u8207\u72C0\u614B\uFF1A'
              ),
              React.createElement(
                'p',
                { className: 'text-slate-700 text-xs md:text-sm font-bold leading-relaxed' },
                cLevel.description
              )
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'flex flex-wrap gap-1.5 items-center justify-between w-full' },
          React.createElement(
            'button',
            { disabled: isDailyMode || inRace || isMultiplayer && !isHostRef.current, onClick: function onClick() {
                return setShowSettingsModal(true);
              }, title: '\u8A2D\u5B9A\u96E3\u5EA6', className: 'px-1 py-1 md:px-2 md:py-1.5 rounded-md border-2 border-[#1e293b] font-bold bg-white text-[#1e293b] text-xs md:text-sm outline-none shadow-[2px_2px_0px_#1e293b] w-auto cursor-pointer max-w-[150px] sm:max-w-none truncate disabled:opacity-60 disabled:cursor-not-allowed' },
            currentLevelId === 'daily' || isDailyMode ? '📅 每日一題' + (cLevel && cLevel.width ? ' ' + cLevel.width + 'x' + cLevel.height : '') : currentLevelId === 'custom' && randomLevelData ? '\u2699\uFE0F \u81EA\u8A02 (' + randomLevelData.width + 'x' + randomLevelData.height + ')' : (LEVELS.find(function (l) {
              return String(l.id) === String(currentLevelId);
            }) || {}).name || (cLevel && cLevel.width ? cLevel.width + 'x' + cLevel.height : '10x10 標準'),
            ' \u25BE'
          ),
          React.createElement(
            'div',
            { className: 'flex gap-1 md:gap-2 flex-wrap items-center ml-auto' },
            !isWon && hasSolution && !showSolution && !inRace && React.createElement(
              'button',
              { onClick: handleShowSolution, className: 'plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-green-400 text-[#1e293b] border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1', title: '\u89E3\u7B54' },
              '\uD83D\uDCA1',
              React.createElement(
                'span',
                { className: 'hidden sm:inline' },
                '\u89E3\u7B54'
              )
            ),
            !isDailyMode && !inRace && React.createElement(
              'button',
              { onClick: handleRegenerateRandom, className: 'plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-blue-500 text-white border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1', title: '\u65B0\u984C' },
              '\uD83C\uDFB2',
              React.createElement(
                'span',
                { className: 'hidden sm:inline' },
                '\u65B0\u984C'
              )
            ),
            !isMultiplayer && React.createElement(
              'button',
              { onClick: handleUndo, disabled: history.length === 0 || isWon, className: 'plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-white border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-50 disabled:shadow-none flex items-center gap-1 text-[#1e293b]', title: '\u5FA9\u539F' },
              '\u21A9\uFE0F',
              React.createElement(
                'span',
                { className: 'hidden sm:inline' },
                '\u5FA9\u539F'
              )
            ),
            React.createElement(
              'button',
              { onClick: handleReset, className: 'plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-red-500 text-white border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1', title: '\u91CD\u7F6E' },
              '\uD83D\uDD04',
              React.createElement(
                'span',
                { className: 'hidden sm:inline' },
                '\u91CD\u7F6E'
              )
            ),
            React.createElement(
              'button',
              { onClick: function onClick() {
                  return setShowSaveModal(true);
                }, className: 'plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-blue-500 text-white border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1', title: '\u5B58\u6A94/\u8B80\u6A94' },
              '\uD83D\uDCBE',
              React.createElement(
                'span',
                { className: 'hidden sm:inline' },
                '\u5B58\u6A94'
              )
            ),
            React.createElement(
              'button',
              { onClick: function onClick() {
                  var m = window.HASHI_SOUND.toggleMute();setMuted(m);if (!m) window.HASHI_SOUND.play('click');
                }, className: 'plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 bg-white border-2 border-[#1e293b] rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1 text-[#1e293b]', title: muted ? "取消靜音" : "靜音" },
              muted ? '🔇' : '🔊'
            ),
            React.createElement(
              'button',
              { onClick: function onClick() {
                  var N = typeof window !== 'undefined' ? window.__PLAT_NET : null;if (N && N.inMatch === 'hashi' || typeof window !== 'undefined' && window.__PLAT_TOURN_CAN_FORCEEND && window.__PLAT_TOURN_CAN_FORCEEND()) setShowExitMenu(true);else handleGoHome();
                }, className: 'plat-btn-hard plat-btn-hard-2 bg-white text-[#1e293b] border-2 border-[#1e293b] px-2 py-1 md:px-3 md:py-1.5 rounded-md font-bold text-xs md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1', title: '\u56DE\u9996\u9801/\u65B7\u7DDA' },
              !isMultiplayer ? '🏠' : '🔌',
              React.createElement(
                'span',
                { className: 'hidden sm:inline ml-1' },
                !isMultiplayer ? '回首頁' : '退出'
              )
            )
          )
        )
      ),
      isMultiplayer && !(inRace && raceState !== 'lobby') && React.createElement(
        'div',
        { className: 'px-4 py-2 bg-[#f6fdf6] border-b-4 border-slate-800 flex flex-wrap gap-2 items-center relative z-[70] shadow-inner shrink-0' },
        React.createElement(
          'span',
          { className: 'font-black text-slate-800 text-sm' },
          '\uD83D\uDC65 \u9023\u7DDA\u73A9\u5BB6\uFF1A'
        ),
        playersList.map(function (p, idx) {
          var isMe = p.id === myId;
          var isRainbow = p.color === 'rainbow';
          return React.createElement(
            'div',
            { key: idx, className: 'relative inline-flex' },
            React.createElement(
              'span',
              {
                onClick: function onClick() {
                  var sHub = platSessRef.current;
                  if (sHub && sHub.hub) {
                    // hub 模式：代表色由殼的摩天輪決定、遊戲內不自選——點自己的名條改呼叫殼的選色（結果走原改色協議同步），點別人無動作、不開色票
                    if (isMe && window.__PLAT_PICK_COLOR) window.__PLAT_PICK_COLOR(myCurrentColor, function (c) {
                      if (c) handlePlayerColorChange(myId, c);
                    });
                    return;
                  }
                  setColorPickerTarget(function (prev) {
                    return prev === p.id ? null : p.id;
                  });
                },
                title: isMe ? "點擊可切換你的代表色" : "點擊可為這位玩家更換顏色",
                className: 'px-2 py-0.5 rounded text-xs font-bold bg-white text-slate-800 flex items-center shadow-[1px_1px_0px_rgba(30,41,59,1)] cursor-pointer hover:bg-slate-100 transition-colors relative border-2 border-slate-800',
                style: { borderLeftWidth: '6px', borderLeftColor: isRainbow ? 'transparent' : p.color } },
              isRainbow && React.createElement(
                'svg',
                { className: 'absolute top-[-2px] left-[-6px] w-[6px] pointer-events-none', style: { height: 'calc(100% + 4px)', borderRadius: '2px 0 0 2px' } },
                React.createElement('rect', { width: '100%', height: '100%', fill: 'url(#rainbowGrad)' })
              ),
              p.name,
              ' ',
              p.isHost && '👑',
              ' ',
              isMe && '(你)'
            ),
            colorPickerTarget === p.id && React.createElement(
              'div',
              { className: 'absolute top-full mt-2 left-0 sm:left-0 bg-[#f6fdf6] border-[3px] border-slate-800 rounded-xl p-3 shadow-[4px_4px_0px_rgba(30,41,59,1)] z-[100] w-[180px] animate-fadeIn' },
              React.createElement(
                'div',
                { className: 'flex justify-between items-center mb-2 border-b-2 border-slate-800 pb-1' },
                React.createElement(
                  'h3',
                  { className: 'text-xs font-bold text-slate-800' },
                  '\uD83C\uDFA8 \u9078\u8272'
                ),
                React.createElement(
                  'button',
                  { onClick: function onClick(e) {
                      e.stopPropagation();setColorPickerTarget(null);setColorSeq([]);
                    }, className: 'text-slate-400 hover:text-slate-800 font-black leading-none' },
                  '\u2715'
                )
              ),
              React.createElement(
                'div',
                { className: 'grid grid-cols-5 gap-1.5' },
                COLORS.map(function (color) {
                  return React.createElement('button', {
                    key: color,
                    onClick: function onClick(e) {
                      e.stopPropagation();
                      var colorIdx = COLORS.indexOf(color);
                      var newSeq = [].concat(_toConsumableArray(colorSeq), [colorIdx]);
                      var targetSeq = [0, 4, 15, 19];

                      var isValid = true;
                      for (var i = 0; i < newSeq.length; i++) {
                        if (newSeq[i] !== targetSeq[i]) {
                          isValid = false;break;
                        }
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
                    },
                    className: 'plat-btn-hard plat-btn-hard-1 w-6 h-6 rounded-full border-[2px] border-slate-800 shadow-[1px_1px_0px_rgba(30,41,59,1)] hover:scale-110 active:scale-95',
                    style: { backgroundColor: color },
                    title: color
                  });
                })
              )
            )
          );
        }),
        engineRef.current === 'peerjs' && !PLAT_MODE && React.createElement(
          'div',
          { className: 'ml-auto flex items-center gap-1.5' },
          React.createElement(
            'button',
            {
              onClick: function onClick() {
                setChatOpen(function (prev) {
                  if (!prev) setChatMin(false);return !prev;
                });
              },
              className: 'relative flex items-center gap-1 text-xs md:text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border-2 border-slate-300 shadow-[1px_1px_0px_rgba(30,41,59,1)] hover:bg-slate-200 transition-colors',
              title: '\u804A\u5929\u5BA4'
            },
            '\uD83D\uDCAC \u804A\u5929',
            unreadChat > 0 && React.createElement(
              'span',
              { className: 'absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white' },
              unreadChat > 99 ? '99+' : unreadChat
            )
          ),
          React.createElement(
            'button',
            {
              onClick: toggleVideo,
              className: "flex items-center gap-1 text-xs md:text-sm font-bold px-2 py-1 rounded-md border-2 shadow-[1px_1px_0px_rgba(30,41,59,1)] transition-colors " + (videoOn ? "text-white bg-slate-800 border-slate-800" : "text-slate-700 bg-slate-100 border-slate-300 hover:bg-slate-200"),
              title: videoOn ? '關閉視訊' : '開啟視訊（圓形頭像）'
            },
            videoOn ? '📹' : '🎥',
            ' \u8996\u8A0A'
          ),
          videoOn && React.createElement(
            'button',
            {
              onClick: toggleMic,
              className: 'flex items-center text-xs md:text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border-2 border-slate-300 shadow-[1px_1px_0px_rgba(30,41,59,1)] hover:bg-slate-200 transition-colors',
              title: micMuted ? '取消靜音' : '靜音'
            },
            micMuted ? '🔇' : '🎤'
          ),
          (videoOn || Object.keys(remoteVideos).length > 0) && React.createElement(
            'button',
            {
              onClick: function onClick() {
                return setSpeakerOn(function (prev) {
                  return !prev;
                });
              },
              className: "flex items-center gap-1 text-xs md:text-sm font-bold px-2 py-1 rounded-md border-2 shadow-[1px_1px_0px_rgba(30,41,59,1)] transition-colors " + (speakerOn ? "text-white bg-slate-800 border-slate-800" : "text-slate-700 bg-slate-100 border-slate-300 hover:bg-slate-200"),
              title: speakerOn ? '喇叭開啟中（點按關閉）' : '喇叭關閉中（點按開啟，才聽得到對方）'
            },
            speakerOn ? '🔊' : '🔈',
            ' \u5587\u53ED'
          ),
          React.createElement(
            'label',
            { title: mpMode === 'race' ? '大亂鬥模式停用顯示游標（防作弊）' : '', className: "flex items-center gap-1.5 text-xs md:text-sm font-bold px-2 py-1 rounded-md border-2 shadow-[1px_1px_0px_rgba(30,41,59,1)] transition-colors " + (mpMode === 'race' ? "text-slate-400 bg-slate-200 border-slate-300 cursor-not-allowed opacity-70" : "cursor-pointer text-slate-700 hover:text-slate-900 bg-slate-100 border-slate-300 hover:bg-slate-200") },
            React.createElement('input', {
              type: 'checkbox',
              checked: showOtherCursors,
              disabled: mpMode === 'race',
              onChange: function onChange(e) {
                return setShowOtherCursors(e.target.checked);
              },
              className: 'w-3.5 h-3.5 md:w-4 md:h-4 accent-emerald-500'
            }),
            '\u986F\u793A\u6E38\u6A19',
            mpMode === 'race' ? ' 🔒' : ''
          )
        )
      ),
      inRace && raceState !== 'lobby' && React.createElement(
        'div',
        { className: 'bg-[#f6fdf6] border-b-4 border-slate-800 shrink-0 relative z-40' },
        React.createElement(
          'div',
          { className: 'px-2 md:px-4 py-1.5 flex flex-nowrap gap-2 items-center shadow-inner overflow-x-auto hide-scrollbar w-full' },
          React.createElement(
            'span',
            { className: 'font-black text-slate-800 text-xs shrink-0 whitespace-nowrap' },
            '\uD83D\uDC65 \u73A9\u5BB6\uFF1A'
          ),
          playersList.map(function (p, idx) {
            var isMe = p.id === myId;
            var isRainbow = p.color === 'rainbow';
            var rinfo = raceProgress[p.id];
            var pct = rinfo ? Math.round(rinfo.progress * 100) : 0;
            return React.createElement(
              'div',
              { key: idx, 'data-fly-uid': p.id, className: "shrink-0 flex flex-col gap-0.5 border-2 border-slate-800 rounded px-1.5 py-0.5 relative cursor-pointer hover:bg-slate-100 transition-colors " + (p.isSpectator ? 'opacity-60 bg-slate-100' : 'bg-white'),
                onClick: function onClick() {
                  if (isMe || isHostRef.current) {
                    setEditName(p.name);setEditTarget(p.id);
                  } else {
                    showToast("⚠️ 只有房主可以更改其他玩家的設定！");
                  }
                },
                title: isMe ? "點擊修改設定" : isHostRef.current ? "房主可修改他人設定" : "無法修改他人設定" },
              React.createElement('div', { className: 'absolute left-0 top-0 bottom-0 w-1 rounded-l-[1px]', style: { background: isRainbow ? 'linear-gradient(180deg, red, orange, yellow, green, blue, indigo, violet)' : p.color } }),
              React.createElement(
                'div',
                { className: 'flex items-center gap-1 text-[10px] md:text-xs font-bold text-slate-800 pl-1.5 whitespace-nowrap' },
                p.name,
                ' ',
                p.isHost && '👑',
                ' ',
                p.isSpectator && ' 👁️',
                ' ',
                isMe && '(你)',
                React.createElement(
                  'span',
                  { className: 'text-emerald-600 font-mono ml-1' },
                  React.createElement(PlatPct, { value: pct })
                )
              ),
              React.createElement(
                'div',
                { className: 'w-24 md:w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-1.5 relative border border-slate-300' },
                React.createElement('div', { className: 'h-full plat-pbar', style: { width: pct + '%', background: isRainbow ? 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)' : p.color } })
              )
            );
          })
        ),
        raceState === 'finished' && React.createElement(
          'div',
          { className: 'px-4 pb-1.5 flex items-center gap-1.5 flex-wrap' },
          React.createElement(
            'button',
            { onClick: function onClick() {
                var opps = Object.keys(brawlBoards);if (opps.length) setGodViewUid(opps[0]);
              }, disabled: Object.keys(brawlBoards).length === 0, className: 'plat-btn-hard plat-btn-hard-2 px-2 py-1 bg-slate-800 text-white border-2 border-slate-800 rounded-lg font-black text-xs shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-40' },
            '\uD83D\uDC41\uFE0F \u4E0A\u5E1D\u8996\u89D2'
          )
        )
      ),
      renderGodModal(),
      editTarget && React.createElement(
        'div',
        { className: 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm pointer-events-auto animate-fadeIn', onClick: function onClick(e) {
            e.stopPropagation();setEditTarget(null);setColorSeq([]);
          } },
        React.createElement(
          'div',
          { className: 'bg-[#f6fdf6] border-[3px] border-slate-800 rounded-xl p-4 shadow-[10px_10px_0px_rgba(30,41,59,1)] animate-popUpCenter max-w-[280px] w-full mx-4', onClick: function onClick(e) {
              return e.stopPropagation();
            } },
          React.createElement(
            'div',
            { className: 'flex justify-between items-center mb-3 border-b-2 border-slate-800 pb-2' },
            React.createElement(
              'h3',
              { className: 'text-sm font-bold text-slate-800' },
              '\u2699\uFE0F \u500B\u4EBA\u8A2D\u5B9A'
            ),
            React.createElement(
              'button',
              { onClick: function onClick() {
                  setEditTarget(null);setColorSeq([]);
                }, className: 'text-slate-400 hover:text-slate-800 font-black text-lg leading-none' },
              '\u2715'
            )
          ),
          React.createElement(
            'div',
            { className: 'mb-4' },
            React.createElement(
              'label',
              { className: 'block text-[10px] md:text-xs font-bold text-slate-600 mb-1' },
              '\u4FEE\u6539\u66B1\u7A31\uFF1A'
            ),
            React.createElement(
              'div',
              { className: 'flex gap-2' },
              React.createElement('input', { type: 'text', value: editName, onChange: function onChange(e) {
                  return setEditName(e.target.value);
                }, placeholder: '\u8F38\u5165\u65B0\u66B1\u7A31', className: 'w-full border-2 border-slate-800 rounded px-2 py-1 text-xs font-bold outline-none focus:ring-1 ring-emerald-400' }),
              React.createElement(
                'button',
                { onClick: function onClick(e) {
                    e.stopPropagation();
                    var newName = editName.trim();
                    if (!newName) return showToast("⚠️ 暱稱不能為空");
                    if (playersList.some(function (p) {
                      return p.name === newName && p.id !== editTarget;
                    })) return showToast("⚠️ 此暱稱已被其他人使用");
                    handlePlayerNameChange(editTarget, newName);
                    setEditTarget(null);
                    setColorSeq([]);
                  }, className: 'bg-blue-500 text-white font-bold text-[10px] md:text-xs px-3 rounded border-2 border-slate-800 hover:bg-blue-600 active:translate-y-[1px] whitespace-nowrap' },
                '\u5132\u5B58'
              )
            )
          ),
          React.createElement(
            'label',
            { className: 'block text-[10px] md:text-xs font-bold text-slate-600 mb-1' },
            '\u4FEE\u6539\u4EE3\u8868\u8272\uFF1A'
          ),
          React.createElement(
            'div',
            { className: 'grid grid-cols-5 gap-2' },
            COLORS.map(function (color) {
              return React.createElement('button', { key: color, onClick: function onClick(e) {
                  e.stopPropagation();var colorIdx = COLORS.indexOf(color);var newSeq = [].concat(_toConsumableArray(colorSeq), [colorIdx]);var targetSeq = [0, 4, 15, 19];var isValid = true;for (var i = 0; i < newSeq.length; i++) {
                    if (newSeq[i] !== targetSeq[i]) {
                      isValid = false;break;
                    }
                  }if (isValid) {
                    setColorSeq(newSeq);if (newSeq.length === 4) {
                      handlePlayerColorChange(editTarget, 'rainbow');setEditTarget(null);showToast("🌈 解鎖隱藏彩色漸變！");setColorSeq([]);
                    } else handlePlayerColorChange(editTarget, color);
                  } else {
                    setColorSeq([]);handlePlayerColorChange(editTarget, color);setEditTarget(null);
                  }
                }, className: 'plat-btn-hard plat-btn-hard-2 w-8 h-8 rounded-full border-[2px] border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] hover:scale-110 active:scale-95 mx-auto', style: { backgroundColor: color }, title: color });
            })
          )
        )
      ),
      !isHeaderCollapsed && React.createElement(
        'div',
        { className: 'h-8 shrink-0 flex items-center justify-center bg-slate-800 text-white border-b-4 border-slate-800 relative z-30 font-bold tracking-wide' },
        React.createElement(
          'span',
          { className: 'text-xs md:text-sm hidden md:inline' },
          '\u9EDE\u64CA\u6216\u5F9E\u5CF6\u5DBC\u62D6\u66F3\u67B6\u6A4B\uFF1A\u4E00\u4E0B1\u5EA7\u3001\u5169\u4E0B2\u5EA7\u3001\u4E09\u4E0B\u53D6\u6D88\uFF1B\u6EFE\u8F2A\u7E2E\u653E\u3002'
        ),
        React.createElement(
          'span',
          { className: 'text-xs md:text-sm md:hidden' },
          '\u9EDE\u64CA\u6216\u62D6\u66F3\u5CF6\u5DBC\u67B6\u6A4B\uFF1A\u4E00\u4E0B1\u5EA7\u3001\u5169\u4E0B2\u5EA7\u3001\u4E09\u4E0B\u53D6\u6D88\u3002'
        )
      ),
      React.createElement(
        'div',
        { className: "relative z-0 flex-1 flex flex-col min-h-0 bg-[#f6fdf6]" + (raceState === 'spectating' || inRace && raceWaiting ? " hidden" : "") },
        isGenerating && React.createElement(
          'div',
          { className: 'absolute inset-0 z-[40] flex items-center justify-center pointer-events-none' },
          React.createElement(
            'div',
            { className: 'text-slate-800/30 font-black text-3xl md:text-5xl tracking-widest flex items-center select-none animate-pulse' },
            '\u5730\u5716\u7522\u751F\u4E2D',
            React.createElement('span', { className: 'animate-loading-dots inline-block w-[1.5em] text-left' })
          )
        ),
        inRace && (raceState === 'racing' || raceState === 'finished') && myItems.length > 0 && React.createElement(
          'div',
          { 'data-fly-me': 'items', className: 'absolute bottom-20 left-1/2 -translate-x-1/2 z-[45] flex items-end gap-4' },
          BRAWL_BAR_ORDER.filter(function (k) {
            return myItems.indexOf(k) >= 0;
          }).map(function (k) {
            var meta = BRAWL_ITEMS.find(function (x) {
              return x.key === k;
            });
            var cnt = myItems.filter(function (x) {
              return x === k;
            }).length;
            return React.createElement(
              'button',
              { key: k, onClick: function onClick() {
                  return useBrawlItem(k);
                }, disabled: raceState !== 'racing', className: 'plat-btn-hard plat-btn-hard-3 anim-item relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-white border-4 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] flex flex-col items-center justify-center disabled:opacity-40' },
              React.createElement(
                'span',
                { className: 'text-[22px] md:text-2xl leading-none' },
                meta.icon
              ),
              React.createElement(
                'span',
                { className: 'text-[9px] font-black text-slate-600 leading-tight mt-0.5' },
                meta.name
              ),
              cnt > 1 && React.createElement(
                'span',
                { className: 'absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full border-2 border-white flex items-center justify-center' },
                React.createElement(PlatNum, { value: cnt })
              )
            );
          })
        ),
        React.createElement(
          'div',
          { ref: zoomContainerRef, className: 'p-2 md:p-6 flex-1 overflow-auto custom-scrollbar relative z-0' },
          React.createElement(
            'div',
            { key: boardFadeKey, className: 'flex justify-center items-center min-w-max min-h-max m-auto pb-2 pr-2 animate-boardFade', style: raceState === 'countdown' ? { filter: 'blur(18px)', pointerEvents: 'none' } : { transition: 'filter 0.3s' } },
            React.createElement(
              'svg',
              {
                ref: svgRef,
                onPointerMove: handlePointerMove,
                onPointerDown: handlePointerDown,
                onPointerUp: handlePointerUp,
                onPointerLeave: function onPointerLeave(e) {
                  if (eraserRef.current) eraserRef.current.style.display = 'none';
                },
                onPointerCancel: handlePointerUp,
                viewBox: '0 0 ' + svgW + ' ' + svgH,
                className: 'bg-transparent transition-transform duration-100 ease-out origin-center select-none',
                style: {
                  width: svgW * zoomLevel + 'px',
                  height: svgH * zoomLevel + 'px',
                  // 全模式 touch-action:none：iOS 對 SVG 內層 <g> 的 touch-action 支援不可靠，
                  // 曾導致拖曳手勢被瀏覽器捲動劫持（pointercancel）而永遠觸發不了；
                  // 改由 svg 統一吃掉手勢，空白處捲動改走手動 pan（見 panRef）
                  touchAction: 'none',
                  WebkitTouchCallout: 'none' // iOS 長按不跳系統選單（拖曳需要長按）
                } },
              React.createElement(
                'defs',
                null,
                React.createElement(
                  'pattern',
                  { id: 'grid', width: SCALE, height: SCALE, patternUnits: 'userSpaceOnUse' },
                  React.createElement('path', { d: 'M ' + SCALE + ' 0 L 0 0 0 ' + SCALE, fill: 'none', stroke: '#d97706', strokeOpacity: '0.28', strokeWidth: '1' })
                ),
                React.createElement(
                  'pattern',
                  { id: 'warningStripe', width: '16', height: '16', patternTransform: 'rotate(45 0 0)', patternUnits: 'userSpaceOnUse' },
                  React.createElement('line', { x1: '0', y1: '0', x2: '0', y2: '16', stroke: '#facc15', strokeWidth: '8', strokeOpacity: '0.7' })
                ),
                React.createElement(
                  'radialGradient',
                  { id: 'fogPuff' },
                  React.createElement('stop', { offset: '0%', stopColor: '#ffffff', stopOpacity: '0.96' }),
                  React.createElement('stop', { offset: '55%', stopColor: '#eef3f7', stopOpacity: '0.92' }),
                  React.createElement('stop', { offset: '82%', stopColor: '#dde6ee', stopOpacity: '0.55' }),
                  React.createElement('stop', { offset: '100%', stopColor: '#dde6ee', stopOpacity: '0' })
                ),
                React.createElement(
                  'radialGradient',
                  { id: 'islandShine' },
                  React.createElement('stop', { offset: '0%', stopColor: '#ffffff', stopOpacity: '0.55' }),
                  React.createElement('stop', { offset: '100%', stopColor: '#ffffff', stopOpacity: '0' })
                ),
                React.createElement(
                  'linearGradient',
                  { id: 'rainbowGrad', gradientUnits: 'userSpaceOnUse', x1: '0', y1: '0', x2: svgW, y2: svgH },
                  React.createElement('stop', { offset: '0%', className: 'rainbow-stop' }),
                  React.createElement('stop', { offset: '100%', className: 'rainbow-stop' })
                )
              ),
              React.createElement('rect', { id: 'svg-bg', width: gridWidth * SCALE, height: gridHeight * SCALE, fill: 'url(#grid)', transform: 'translate(' + PADDING + ', ' + PADDING + ')', className: 'pointer-events-none' }),
              showSolution && cLevel.solution && cLevel.solution.map(function (sol, idx) {
                var islandsMap = {};islandsToRender.forEach(function (i) {
                  islandsMap[i.id] = i;
                });
                var f = islandsMap[sol.from],
                    t = islandsMap[sol.to];
                if (!f || !t) return null;
                var x1 = f.x * SCALE + PADDING,
                    y1 = f.y * SCALE + PADDING,
                    x2 = t.x * SCALE + PADDING,
                    y2 = t.y * SCALE + PADDING;

                if (sol.count === 1) {
                  return React.createElement('line', { key: 'sol-' + idx, x1: x1, y1: y1, x2: x2, y2: y2, stroke: '#ef4444', strokeWidth: '6', strokeOpacity: '0.4', strokeDasharray: '8,6', className: 'solution-line pointer-events-none' });
                } else if (sol.count === 2) {
                  if (sol.type === 'h') {
                    return React.createElement(
                      'g',
                      { key: 'sol-' + idx, className: 'pointer-events-none' },
                      React.createElement('line', { x1: x1, y1: y1 - 5, x2: x2, y2: y2 - 5, stroke: '#ef4444', strokeWidth: '5', strokeOpacity: '0.4', strokeDasharray: '8,6', className: 'solution-line' }),
                      React.createElement('line', { x1: x1, y1: y1 + 5, x2: x2, y2: y2 + 5, stroke: '#ef4444', strokeWidth: '5', strokeOpacity: '0.4', strokeDasharray: '8,6', className: 'solution-line' })
                    );
                  } else {
                    return React.createElement(
                      'g',
                      { key: 'sol-' + idx, className: 'pointer-events-none' },
                      React.createElement('line', { x1: x1 - 5, y1: y1, x2: x2 - 5, y2: y2, stroke: '#ef4444', strokeWidth: '5', strokeOpacity: '0.4', strokeDasharray: '8,6', className: 'solution-line' }),
                      React.createElement('line', { x1: x1 + 5, y1: y1, x2: x2 + 5, y2: y2, stroke: '#ef4444', strokeWidth: '5', strokeOpacity: '0.4', strokeDasharray: '8,6', className: 'solution-line' })
                    );
                  }
                }
                return null;
              }),
              strokes.map(function (s) {
                var strokeUid = s.uid || s.id.split('-')[1];
                var isOwnStroke = strokeUid === myId;

                var strokeColor = s.color;
                var strokeOpacity = 1;
                var isRainbow = false;

                if (isMultiplayer && strokeUid) {
                  strokeColor = getPlayerColor(strokeUid);
                  if (strokeColor === 'rainbow') isRainbow = true;
                  strokeOpacity = isOwnStroke ? 1 : 0.5;
                }

                return React.createElement('path', {
                  key: s.id,
                  d: s.path,
                  fill: 'none',
                  stroke: isRainbow ? undefined : strokeColor,
                  strokeOpacity: strokeOpacity,
                  strokeWidth: '8',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  className: 'doodle-stroke ' + (isRainbow ? 'rainbow-stroke' : ''),
                  'data-stroke-id': s.id,
                  style: { pointerEvents: interactionMode === 2 && drawSubMode === 'eraser' && isOwnStroke ? 'stroke' : 'none' }
                });
              }),
              React.createElement('path', {
                ref: drawingPathRef,
                fill: 'none',
                stroke: myCurrentColor === 'rainbow' ? undefined : myCurrentColor,
                strokeOpacity: 1,
                strokeWidth: '8',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                className: 'pointer-events-none ' + (myCurrentColor === 'rainbow' ? 'rainbow-stroke' : ''),
                style: { display: 'none' }
              }),
              sortedBridges.map(function (b) {
                var totalLines = b.count + (b.draftCount || 0);
                var islMap = {};islandsToRender.forEach(function (i) {
                  islMap[i.id] = i;
                });
                var f = islMap[b.from],
                    t = islMap[b.to];
                if (!f || !t) return null;
                var x1 = f.x * SCALE + PADDING,
                    y1 = f.y * SCALE + PADDING,
                    x2 = t.x * SCALE + PADDING,
                    y2 = t.y * SCALE + PADDING;

                var lineStroke = "#1e293b";
                var lineOpacity = 1;
                var isRainbow = false;

                if (isMultiplayer && totalLines > 0 && b.owner) {
                  lineStroke = getPlayerColor(b.owner);
                  if (lineStroke === 'rainbow') isRainbow = true;
                  lineOpacity = b.owner === myId ? 1 : 0.5;
                }
                if (b.locked) {
                  lineStroke = '#000000';lineOpacity = 1;isRainbow = false;
                } // 禮物橋：黑色實線鎖定

                var isCrossed = crossedBridgeIds.has(b.id);
                var isIslandHovered = (hoveredIslandId === b.from || hoveredIslandId === b.to) && interactionMode < 2;

                var bridgeGroupClass = interactionMode >= 2 || isCrossed && totalLines === 0 ? "pointer-events-none" : "cursor-pointer group";

                var bridgeRectClass = interactionMode >= 2 ? "fill-transparent bridge-hotzone" : 'transition-colors duration-300 bridge-hotzone ' + (isIslandHovered ? 'fill-yellow-300/40' : 'fill-transparent group-hover:fill-yellow-300/40');
                var bridgeLineClass = 'pointer-events-none ' + (isRainbow ? 'rainbow-stroke' : 'transition-colors duration-300');

                if (totalLines === 0) {
                  return React.createElement(
                    'g',
                    { key: b.id,
                      onPointerDown: function onPointerDown(e) {
                        return handleBridgePointerDown(e, b);
                      },
                      style: interactionMode < 2 ? { touchAction: 'none' } : undefined,
                      onPointerEnter: function onPointerEnter(e) {
                        if (e.pointerType === 'mouse' && interactionMode < 2) setHoveredBridgeId(b.id);
                      },
                      onPointerLeave: function onPointerLeave(e) {
                        if (e.pointerType === 'mouse' && interactionMode < 2) setHoveredBridgeId(null);
                      },
                      className: bridgeGroupClass },
                    b.type === 'h' ? React.createElement('rect', { x: Math.min(x1, x2) + ISLAND_RADIUS, y: y1 - 20, width: Math.abs(x1 - x2) - ISLAND_RADIUS * 2, height: 40, className: isCrossed ? 'fill-transparent' : bridgeRectClass }) : React.createElement('rect', { x: x1 - 20, y: Math.min(y1, y2) + ISLAND_RADIUS, width: 40, height: Math.abs(y1 - y2) - ISLAND_RADIUS * 2, className: isCrossed ? 'fill-transparent' : bridgeRectClass }),
                    isCrossed && isIslandHovered && (b.type === 'h' ? React.createElement('rect', { x: Math.min(x1, x2) + ISLAND_RADIUS, y: y1 - 8, width: Math.abs(x1 - x2) - ISLAND_RADIUS * 2, height: 16, fill: 'url(#warningStripe)', className: 'pointer-events-none animate-fadeIn' }) : React.createElement('rect', { x: x1 - 8, y: Math.min(y1, y2) + ISLAND_RADIUS, width: 16, height: Math.abs(y1 - y2) - ISLAND_RADIUS * 2, fill: 'url(#warningStripe)', className: 'pointer-events-none animate-fadeIn' }))
                  );
                }

                var linesToDraw = [];
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

                return React.createElement(
                  'g',
                  { key: b.id,
                    onPointerDown: function onPointerDown(e) {
                      return handleBridgePointerDown(e, b);
                    },
                    style: interactionMode < 2 ? { touchAction: 'none' } : undefined,
                    onPointerEnter: function onPointerEnter(e) {
                      if (e.pointerType === 'mouse' && interactionMode < 2) setHoveredBridgeId(b.id);
                    },
                    onPointerLeave: function onPointerLeave(e) {
                      if (e.pointerType === 'mouse' && interactionMode < 2) setHoveredBridgeId(null);
                    },
                    className: bridgeGroupClass },
                  b.type === 'h' ? React.createElement('rect', { x: Math.min(x1, x2) + ISLAND_RADIUS, y: y1 - 20, width: Math.abs(x1 - x2) - ISLAND_RADIUS * 2, height: 40, className: bridgeRectClass }) : React.createElement('rect', { x: x1 - 20, y: Math.min(y1, y2) + ISLAND_RADIUS, width: 40, height: Math.abs(y1 - y2) - ISLAND_RADIUS * 2, className: bridgeRectClass }),
                  linesToDraw.map(function (lineObj, lIdx) {
                    var isDraft = lineObj.isDraft;
                    var off = lineObj.offset;
                    var w = totalLines === 1 ? isDraft ? "5" : "6" : isDraft ? "4" : "5";
                    var op = isDraft ? lineOpacity * 0.4 : lineOpacity;
                    var dash = isDraft ? "8,6" : "none";
                    if (b.type === 'h') {
                      return React.createElement('line', { key: lIdx, x1: x1, y1: y1 + off, x2: x2, y2: y2 + off, stroke: isRainbow ? undefined : lineStroke, strokeWidth: w, strokeLinecap: 'round', strokeOpacity: op, strokeDasharray: dash, className: bridgeLineClass, style: { filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' } });
                    } else {
                      return React.createElement('line', { key: lIdx, x1: x1 + off, y1: y1, x2: x2 + off, y2: y2, stroke: isRainbow ? undefined : lineStroke, strokeWidth: w, strokeLinecap: 'round', strokeOpacity: op, strokeDasharray: dash, className: bridgeLineClass, style: { filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' } });
                    }
                  })
                );
              }),
              React.createElement('line', {
                ref: dragPreviewLineRef,
                x1: '0', y1: '0', x2: '0', y2: '0',
                stroke: myCurrentColor === 'rainbow' ? '#fbbf24' : myCurrentColor,
                strokeWidth: '7',
                strokeLinecap: 'round',
                strokeOpacity: '0.9',
                className: 'solution-line pointer-events-none',
                style: { display: 'none' }
              }),
              React.createElement('circle', {
                ref: dragPreviewTipRef,
                cx: '0', cy: '0', r: '9',
                fill: myCurrentColor === 'rainbow' ? '#fbbf24' : myCurrentColor,
                fillOpacity: '0.9',
                className: 'pointer-events-none animate-pulse',
                style: { display: 'none' }
              }),
              islandsToRender.map(function (island) {
                var cx = island.x * SCALE + PADDING;var cy = island.y * SCALE + PADDING;var current = islandCurrentCounts[island.id].total;
                var strokeColor = "#1e293b";var bgColor = "#ffffff";var textColor = "#1e293b";
                if (current === island.req) {
                  strokeColor = "#059669";bgColor = "#d1fae5";textColor = "#065f46";
                } else if (current > island.req) {
                  strokeColor = "#dc2626";bgColor = "#fee2e2";textColor = "#991b1b";
                }

                var showHighlight = highlightedIslandIds.has(island.id) && interactionMode < 2;
                var isDirectlyHovered = hoveredIslandId === island.id && interactionMode < 2;

                return React.createElement(
                  'g',
                  { key: 'island-' + island.id, className: 'hashi-island',
                    onPointerEnter: function onPointerEnter(e) {
                      if (e.pointerType === 'mouse' && interactionMode < 2) setHoveredIslandId(island.id);
                    },
                    onPointerLeave: function onPointerLeave(e) {
                      if (e.pointerType === 'mouse' && interactionMode < 2) setHoveredIslandId(null);
                    },
                    onPointerDown: function onPointerDown(e) {
                      return handleIslandPointerDown(e, island);
                    },
                    style: interactionMode < 2 ? { touchAction: 'none' } : undefined
                  },
                  showHighlight && React.createElement('circle', { cx: cx, cy: cy, r: ISLAND_RADIUS + 8, fill: '#fde047', fillOpacity: '0.5', className: 'pointer-events-none transition-all duration-300' }),
                  React.createElement('circle', { cx: cx + 3, cy: cy + 3, r: ISLAND_RADIUS, fill: 'rgba(30,41,59,0.2)', className: 'pointer-events-none' }),
                  React.createElement('circle', { cx: cx, cy: cy, r: ISLAND_RADIUS, fill: bgColor, stroke: strokeColor, strokeWidth: '4', className: 'transition-colors duration-300' }),
                  React.createElement('circle', { cx: cx - 6, cy: cy - 7, r: ISLAND_RADIUS * 0.55, fill: 'url(#islandShine)', className: 'pointer-events-none' }),
                  React.createElement(
                    'text',
                    { x: cx, y: cy + 2, textAnchor: 'middle', dominantBaseline: 'central', className: 'text-xl font-black font-sans pointer-events-none select-none transition-colors duration-300', fill: textColor },
                    island.req
                  ),
                  isDirectlyHovered && activeHints.map(function (b) {
                    if (!crossedBridgeIds.has(b.id)) return null;

                    var dotCx = cx;
                    var dotCy = cy;
                    var offset = ISLAND_RADIUS + 14;
                    if (b.type === 'h') {
                      if (b.from === island.id) dotCx += offset;else dotCx -= offset;
                    } else {
                      if (b.from === island.id) dotCy += offset;else dotCy -= offset;
                    }

                    return React.createElement(
                      'g',
                      { key: 'hint-' + b.id, className: 'pointer-events-none animate-pulse', transform: 'translate(' + dotCx + ', ' + dotCy + ')' },
                      React.createElement('line', { x1: '-5', y1: '-5', x2: '5', y2: '5', stroke: '#ef4444', strokeWidth: '4', strokeLinecap: 'round' }),
                      React.createElement('line', { x1: '5', y1: '-5', x2: '-5', y2: '5', stroke: '#ef4444', strokeWidth: '4', strokeLinecap: 'round' })
                    );
                  })
                );
              }),
              bursts.map(function (b) {
                return React.createElement(
                  'g',
                  { key: b.id, className: 'pointer-events-none' },
                  b.parts.map(function (pt, i) {
                    return React.createElement('circle', { key: i, cx: b.x, cy: b.y, r: '5', fill: b.color, className: 'burst-particle', style: { '--bx': pt.dx + 'px', '--by': pt.dy + 'px' } });
                  })
                );
              }),
              React.createElement('circle', {
                ref: eraserRef,
                r: '15',
                fill: myCurrentColor === 'rainbow' ? undefined : myCurrentColor,
                fillOpacity: '0.4',
                stroke: myCurrentColor === 'rainbow' ? undefined : myCurrentColor,
                strokeWidth: '2',
                className: 'pointer-events-none ' + (myCurrentColor === 'rainbow' ? 'rainbow-stroke rainbow-fill' : ''),
                style: { display: 'none' }
              }),
              showOtherCursors && mpMode !== 'race' && engineRef.current === 'peerjs' && Object.entries(cursors).map(function (entry) {
                var uid = entry[0];var pos = entry[1];
                if (uid === myId) return null;
                var player = playersList.find(function (p) {
                  return p.id === uid;
                });
                if (!player) return null;
                var isRainbow = player.color === 'rainbow';
                return React.createElement(
                  'g',
                  { key: 'cursor-' + uid, transform: 'translate(' + pos.x + ', ' + pos.y + ')', className: 'pointer-events-none transition-transform duration-75 ease-linear' },
                  React.createElement('path', { d: 'M0,0 L16,6 L10,10 L15,19 L11,21 L6,12 L0,18 Z', fill: isRainbow ? undefined : player.color, stroke: 'white', strokeWidth: '2', className: isRainbow ? 'rainbow-fill' : '' }),
                  React.createElement('rect', { x: '14', y: '22', rx: '4', ry: '4', width: player.name.length * 14 + 12, height: '22', fill: 'rgba(0,0,0,0.6)' }),
                  React.createElement(
                    'text',
                    { x: '20', y: '37', fill: 'white', fontSize: '13', fontWeight: 'bold' },
                    player.name
                  )
                );
              }),
              (engineRef.current === 'peerjs' ? showOtherCursors : true) && ripples.map(function (r) {
                var player = playersList.find(function (p) {
                  return p.id === r.uid;
                });
                var color = player ? player.color : '#3b82f6';
                var isRainbow = color === 'rainbow';
                return React.createElement('circle', { key: r.id, cx: r.x, cy: r.y, r: '20', fill: 'none', stroke: isRainbow ? undefined : color, className: 'pointer-events-none ' + (isRainbow ? 'rainbow-stroke' : ''), style: { transformOrigin: r.x + 'px ' + r.y + 'px', animation: 'rippleAnim 0.8s ease-out forwards' } });
              }),
              fxFogBoxes.filter(function (b) {
                return b.until > fxNow;
              }).map(function (b) {
                var remain = b.until - fxNow;
                var op = remain > 1600 ? 1 : Math.max(0.12, remain / 1600);
                var RR = b.R || 90,
                    CCX = b.cx != null ? b.cx : (b.minX + b.maxX) / 2 * SCALE + PADDING,
                    CCY = b.cy != null ? b.cy : (b.minY + b.maxY) / 2 * SCALE + PADDING;
                return React.createElement(
                  'g',
                  { key: b.id, className: 'pointer-events-none fog-box-in', style: { opacity: op, transition: 'opacity 0.5s ease', transformBox: 'fill-box', transformOrigin: 'center' } },
                  React.createElement(
                    'g',
                    { className: 'fog-cloud-drift' },
                    React.createElement(
                      'g',
                      { transform: 'translate(' + CCX + ' ' + CCY + ') scale(1 0.84) translate(' + -CCX + ' ' + -CCY + ')' },
                      React.createElement('ellipse', { cx: CCX, cy: CCY, rx: RR * 0.68, ry: RR * 0.62, fill: '#f7fafc', fillOpacity: '0.97' }),
                      (b.puffs || []).map(function (pf, i) {
                        return React.createElement('circle', { key: i, cx: pf.x, cy: pf.y, r: pf.r, fill: 'url(#fogPuff)' });
                      })
                    )
                  )
                );
              }),
              fxMarks.filter(function (mk) {
                return mk.until > fxNow;
              }).map(function (mk) {
                return React.createElement(
                  'text',
                  { key: mk.id, x: mk.gx * SCALE + PADDING, y: mk.gy * SCALE + PADDING, textAnchor: 'middle', dominantBaseline: 'central', fontSize: '30', className: 'pointer-events-none select-none fx-mark-pop', style: { transformBox: 'fill-box', transformOrigin: 'center' } },
                  mk.icon
                );
              })
            )
          )
        ),
        (raceState === 'spectating' || inRace && raceWaiting) && React.createElement(
          'div',
          { className: 'relative z-0 flex-1 min-h-0 overflow-y-auto p-4' },
          React.createElement(
            'div',
            { className: 'max-w-md mx-auto bg-white border-4 border-[#1e293b] rounded-2xl shadow-[10px_10px_0px_#1e293b] p-5 mt-2' },
            React.createElement(
              'div',
              { className: 'flex items-center justify-between mb-3' },
              React.createElement(
                'h2',
                { className: 'text-xl font-black text-[#1e293b]' },
                React.createElement(
                  'span',
                  { key: raceState === 'spectating' ? 'spec' : 'fin', className: 'plat-lite-in', style: { display: 'inline-block' } },
                  raceState === 'spectating' ? '👁️ 觀戰中' : '🏁 已完賽・觀戰中'
                )
              ),
              React.createElement(
                'span',
                { className: 'text-xs font-semibold text-slate-400' },
                '\u6BD4\u8CFD\u7D50\u675F\u5F8C\u81EA\u52D5\u986F\u793A\u7D50\u679C'
              )
            ),
            React.createElement(
              'div',
              { className: 'flex gap-1.5 mb-3 flex-wrap' },
              raceRacers.filter(function (uid) {
                return raceState === 'spectating' || uid !== myId;
              }).map(function (uid) {
                var p = playersList.find(function (x) {
                  return x.id === uid;
                });
                return React.createElement(
                  'button',
                  { key: uid, onClick: function onClick() {
                      return setGodViewUid(uid);
                    }, className: "px-2.5 py-1 rounded-lg border-2 border-slate-800 font-black text-xs " + (spectateUid === uid ? "bg-slate-800 text-white" : "bg-white text-slate-700") },
                  p ? p.name : '選手'
                );
              })
            ),
            spectateUid && brawlBoards[spectateUid] ? renderGodBoard(brawlBoards[spectateUid]) : React.createElement(
              'p',
              { className: 'font-bold text-slate-400 text-center py-8' },
              '\u7B49\u5F85\u9078\u624B\u76E4\u9762\u540C\u6B65\u2026'
            )
          )
        ),
        typeof window.PlatBar !== 'undefined' ? React.createElement('div', { ref: platBarRef, className: 'shrink-0 relative z-30' }) : React.createElement(
          React.Fragment,
          null,
          ')}',
          React.createElement(
            'div',
            { className: 'shrink-0 bg-[#fffdfa]/95 backdrop-blur-md border-t-[4px] border-slate-800 min-h-[4rem] md:min-h-[5rem] flex flex-wrap items-center justify-between gap-x-2 gap-y-1 py-1 px-3 md:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] relative z-30' },
            React.createElement(
              'div',
              { className: 'flex items-center gap-1.5 md:gap-3 bg-slate-100 p-1 rounded-xl border-2 border-slate-300 relative' },
              React.createElement(
                'button',
                { onClick: function onClick() {
                    return setZoomOpen(!zoomOpen);
                  }, title: '\u7E2E\u653E\uFF08\u9EDE\u958B/\u6536\u5408\uFF09', className: 'plat-btn-hard plat-btn-hard-2 w-11 h-11 md:w-14 md:h-14 bg-white border-[3px] border-slate-800 rounded-lg shadow-[2px_2px_0px_#1e293b] flex items-center justify-center text-base md:text-lg font-black hover:bg-[#4ade80]' },
                '\uD83D\uDD0D'
              ),
              zoomOpen && React.createElement(
                'div',
                { className: 'absolute bottom-full mb-3 left-0 flex flex-col gap-2 bg-white border-[3px] border-slate-800 p-2 rounded-2xl shadow-[6px_6px_0px_rgba(30,41,59,0.25)] animate-popUpCenter z-50' },
                React.createElement(
                  'button',
                  { onClick: handleZoomIn, title: '\u653E\u5927', className: 'plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-white border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-xl font-black shadow-[2px_2px_0px_#1e293b]' },
                  '\uFF0B'
                ),
                React.createElement(
                  'button',
                  { onClick: handleZoomOut, title: '\u7E2E\u5C0F', className: 'plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-white border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-xl font-black shadow-[2px_2px_0px_#1e293b]' },
                  '\uFF0D'
                ),
                React.createElement(
                  'button',
                  { onClick: handleCycleZoom, title: '\u5FAA\u74B0\u5207\u63DB\u7E2E\u653E\u6A21\u5F0F\uFF08\u81EA\u52D5\u9069\u61C9\uFF09', className: 'plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-slate-800 border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-[2px_2px_0px_#1e293b]' },
                  zoomModeIdx === 0 ? '1x' : zoomModeIdx === 1 ? '↔️' : zoomModeIdx === 2 ? '↕️' : '🔲'
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'flex items-center gap-1 md:gap-2 ml-auto bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner relative' },
              React.createElement(
                'button',
                { onClick: function onClick() {
                    if (interactionMode === 2 && !drawSubOpen) {
                      setDrawSubOpen(true);return;
                    }advanceHashiMode();
                  }, title: '\u5207\u63DB\u6A21\u5F0F\uFF08\u756B\u7B46/\u8349\u7A3F/\u7E6A\u5716\uFF09', className: 'px-3 md:px-5 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-base flex items-center gap-1.5 md:gap-2 transition-all shadow-md ' + (interactionMode === 2 ? 'bg-emerald-400 text-slate-900' : 'bg-[#4ade80] text-slate-900') },
                React.createElement(
                  'span',
                  null,
                  interactionMode === 0 ? '🖋️' : interactionMode === 1 ? '✏️' : '🖌️'
                ),
                React.createElement(
                  'span',
                  { className: 'hidden sm:inline' },
                  interactionMode === 0 ? '畫筆' : interactionMode === 1 ? '草稿' : '繪圖'
                ),
                React.createElement(
                  'span',
                  { className: 'text-[10px] opacity-60' },
                  '\u25BE'
                )
              ),
              interactionMode === 2 && drawSubOpen && React.createElement(
                'div',
                { className: 'absolute bottom-full mb-6 right-0 flex flex-col gap-3 bg-white border-[3px] border-slate-800 p-2.5 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,0.2)] animate-popUpCenter pointer-events-auto' },
                React.createElement(
                  'button',
                  { onClick: function onClick() {
                      return setDrawSubMode('pen');
                    }, className: 'w-12 h-12 border-[3px] border-slate-800 rounded-xl flex items-center justify-center transition-all shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-[2px] ' + (drawSubMode === 'pen' ? 'bg-emerald-100 scale-110 border-emerald-600' : 'bg-white hover:bg-slate-50'), title: '\u756B\u7B46\u6A21\u5F0F' },
                  '\uD83D\uDD8C\uFE0F'
                ),
                React.createElement(
                  'button',
                  { onClick: function onClick() {
                      return setDrawSubMode('eraser');
                    }, onDoubleClick: clearOwnStrokes, className: 'w-12 h-12 border-[3px] border-slate-800 rounded-xl flex items-center justify-center transition-all shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-[2px] ' + (drawSubMode === 'eraser' ? 'bg-orange-100 scale-110 border-orange-600' : 'bg-white hover:bg-slate-50'), title: '\u6A61\u76AE\u64E6 (\u96D9\u64CA\u6E05\u9664\u81EA\u5DF1\u6240\u6709\u5857\u9D09)' },
                  '\uD83E\uDDFD'
                ),
                isHostRef.current && React.createElement(
                  'button',
                  { onClick: clearAllStrokes, className: 'plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-rose-50 border-[3px] border-rose-800 text-rose-800 rounded-xl flex items-center justify-center hover:bg-rose-100 shadow-[2px_2px_0px_#1e293b]', title: '\u623F\u4E3B\uFF1A\u6E05\u9664\u5168\u5834\u5857\u9D09' },
                  '\uD83D\uDEAE'
                )
              )
            ),
            renderDockCapsule(false)
          )
        ),
        resultsDismissedUi && inRace && raceState === 'finished' && React.createElement(
          'button',
          { onClick: function onClick() {
              resultsDismissRef.current = null;setResultsDismissedUi(false);
            }, className: 'plat-btn-hard plat-btn-hard-3 fixed bottom-24 right-3 z-[56] bg-white border-[3px] border-slate-800 rounded-full px-4 py-2 font-black shadow-[3px_3px_0px_#1e293b]' },
          '\uD83C\uDFC6 \u7D50\u679C'
        ),
        showExitMenu && React.createElement(
          'div',
          { className: 'fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4', onClick: function onClick() {
              return setShowExitMenu(false);
            } },
          React.createElement(
            'div',
            { className: 'bg-white border-4 border-[#1e293b] rounded-2xl shadow-[10px_10px_0px_#1e293b] p-6 w-full max-w-xs text-center animate-popUpCenter', onClick: function onClick(e) {
                return e.stopPropagation();
              } },
            React.createElement(
              'div',
              { className: 'font-black text-xl text-[#1e293b] mb-4' },
              '\u8981\u96E2\u958B\u5C0D\u5C40\u55CE\uFF1F'
            ),
            typeof window !== 'undefined' && window.__PLAT_TOURN_CAN_FORCEEND && window.__PLAT_TOURN_CAN_FORCEEND() && React.createElement(
              'button',
              { onClick: function onClick() {
                  setShowExitMenu(false);if (window.__PLAT_TOURN_FORCEEND) window.__PLAT_TOURN_FORCEEND();
                }, className: 'plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 bg-rose-500 text-white border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_#1e293b]' },
              '\u23F9\uFE0F \u7D50\u675F\u672C\u5C40\uFF08\u9326\u6A19\u8CFD\uFF09'
            ),
            React.createElement(
              'button',
              { onClick: function onClick() {
                  setShowExitMenu(false);requestLobby();
                }, className: 'plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 bg-white text-slate-800 border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_#1e293b]' },
              '\uD83C\uDFC1 \u56DE\u7B49\u5F85\u5BA4'
            ),
            React.createElement(
              'button',
              { onClick: function onClick() {
                  setShowExitMenu(false);handleGoHome('leave');
                }, className: 'plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 bg-white text-slate-800 border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_#1e293b]' },
              '\uD83D\uDEAA \u9000\u51FA\uFF08\u56DE\u5927\u5EF3\uFF09'
            ),
            React.createElement(
              'button',
              { onClick: function onClick() {
                  return setShowExitMenu(false);
                }, className: 'w-full py-2 text-slate-400 font-bold hover:text-slate-700' },
              '\u53D6\u6D88'
            )
          )
        ),
        roomOpen && platHub && platTournLock ? React.createElement(
          'div',
          { className: 'absolute inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-[2px] p-4 flex' },
          React.createElement(
            'div',
            { className: 'bg-[#fffaf0] border-4 border-[#1e293b] rounded-2xl shadow-[10px_10px_0px_#1e293b] p-6 max-w-md w-full my-auto mx-auto' },
            React.createElement(
              'div',
              { className: 'text-center text-4xl mb-1' },
              '\uD83C\uDFC6'
            ),
            React.createElement(
              'div',
              { className: 'font-black text-2xl text-[#1e293b] text-center' },
              '\u9326\u6A19\u8CFD\u30FB',
              tournRoundInfo && tournRoundInfo.playoff ? '加賽' : '第 ' + (tournRoundInfo && tournRoundInfo.round || '?') + ' 局'
            ),
            React.createElement(
              'div',
              { className: 'font-semibold text-slate-400 text-sm text-center mt-1 mb-4' },
              '\u672C\u5C40\uFF1A\u6578\u6A4B\u5927\u4E82\u9B25\u30FB\u5168\u54E1\u6E96\u5099\u597D\u623F\u4E3B\u624D\u80FD\u958B\u59CB\uFF0C\u6216\u7B49\u6EFF 1 \u5206\u9418\u5F37\u5236\u958B\u59CB'
            ),
            React.createElement(
              'div',
              { className: 'flex flex-col gap-2 mb-4' },
              playersList.filter(function (p) {
                return !p.isSpectator;
              }).map(function (p) {
                return React.createElement(
                  'div',
                  { key: p.id, className: 'flex items-center gap-2 bg-slate-50 border-2 border-slate-800 rounded-xl px-3 py-2 font-black text-slate-800' },
                  React.createElement('span', { className: 'w-4 h-4 rounded-full border-2 border-slate-800 inline-block shrink-0', style: { background: p.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : p.color } }),
                  React.createElement(
                    'span',
                    { className: 'truncate' },
                    p.name,
                    p.isHost ? ' 👑' : '',
                    p.id === myId ? '（你）' : ''
                  ),
                  React.createElement(
                    'span',
                    { className: 'ml-auto shrink-0' },
                    p.pending ? React.createElement(
                      'span',
                      { className: 'text-[10px] bg-slate-100 border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded-md' },
                      '\u672A\u5230'
                    ) : p.isReady ? React.createElement(
                      'span',
                      { className: 'text-[10px] bg-emerald-100 border border-emerald-500 text-emerald-700 px-1.5 py-0.5 rounded-md' },
                      '\u2705 \u6E96\u5099\u597D\u4E86'
                    ) : React.createElement(
                      'span',
                      { className: 'text-[10px] bg-slate-100 border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded-md' },
                      '\u672A\u6E96\u5099'
                    )
                  )
                );
              })
            ),
            tournMyEntry && !tournMyEntry.pending && React.createElement(
              'button',
              { onClick: function onClick() {
                  return setMyReady(!(tournMyEntry && tournMyEntry.isReady));
                }, className: "plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 rounded-xl border-[3px] border-slate-800 font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)]" + (tournMyEntry.isReady ? ' bg-amber-400 text-slate-900' : ' bg-white text-slate-500') },
              tournMyEntry.isReady ? '✅ 已準備（點擊取消）' : '✋ 準備好了'
            ),
            isHostRef.current ? React.createElement(
              'div',
              null,
              React.createElement(
                'button',
                { onClick: function onClick() {
                    if (mpModeRef.current === 'race') startRace();else startCoop();
                  }, disabled: !tournCanStart, className: 'w-full py-3 bg-red-500 text-white border-[3px] border-slate-800 rounded-xl font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed' },
                '\uD83C\uDFC1 \u958B\u59CB\u672C\u5C40'
              ),
              React.createElement(
                'p',
                { className: 'text-xs text-slate-500 font-semibold text-center mt-2' },
                tournStartNote
              )
            ) : React.createElement(
              'p',
              { className: 'font-black text-slate-700 animate-pulse text-center' },
              '\u7B49\u5F85\u623F\u4E3B\u958B\u59CB...'
            )
          )
        ) : roomOpen && platHub ? React.createElement(
          'div',
          { className: 'absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4' },
          React.createElement(
            'div',
            { className: 'bg-[#fffaf0] border-4 border-[#1e293b] rounded-2xl shadow-[10px_10px_0px_#1e293b] p-8 text-center max-w-sm w-full' },
            React.createElement(
              'div',
              { className: 'text-5xl mb-3' },
              '\u23F3'
            ),
            React.createElement(
              'div',
              { className: 'font-black text-2xl text-[#1e293b] animate-pulse' },
              '\u7B49\u623F\u4E3B\u958B\u59CB\u5C0D\u5C40\u2026'
            ),
            React.createElement(
              'div',
              { className: 'font-semibold text-slate-400 text-sm mt-2' },
              '\u6E96\u5099\u548C\u8A2D\u5B9A\u90FD\u5728\u623F\u9593\u9801\u5B8C\u6210\u4E86\uFF0C\u99AC\u4E0A\u958B\u59CB'
            )
          )
        ) : null,
        raceCountdown !== null && !(typeof window !== 'undefined' && window.PlatCountdown) && React.createElement(
          'div',
          { className: 'absolute inset-0 z-[65] flex items-center justify-center pointer-events-none' },
          React.createElement(
            'div',
            { key: raceCountdown, className: 'animate-countdownPop text-8xl md:text-9xl font-black text-[#1e293b] bg-[#4ade80] border-4 border-slate-800 rounded-3xl px-10 py-6 shadow-[10px_10px_0px_rgba(30,41,59,1)]' },
            raceCountdown === 0 ? 'GO!' : raceCountdown
          )
        ),
        inRace && raceState === 'racing' && Object.keys(fxFog).some(function (id) {
          return fxFog[id] > fxNow;
        }) && React.createElement(
          'div',
          { className: 'absolute top-2 left-2 z-[57] flex gap-1.5 pointer-events-none' },
          React.createElement(
            'span',
            { className: 'px-2 py-1 bg-slate-200/95 border-2 border-slate-400 text-slate-600 rounded-lg font-black text-xs shadow' },
            '\uD83C\uDF2B\uFE0F \u8FF7\u9727\u4E2D'
          )
        ),
        inRace && raceState === 'finished' && raceResult && !(typeof window !== 'undefined' && window.PlatResults) && React.createElement(
          'div',
          { className: 'absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4' },
          React.createElement(
            'div',
            { className: 'bg-white rounded-2xl p-6 md:p-8 border-[4px] border-[#1e293b] shadow-[10px_10px_0px_#1e293b] text-center min-w-[300px] max-w-md w-full animate-popUpCenter max-h-[92vh] overflow-y-auto' },
            React.createElement(
              'div',
              { className: 'text-5xl mb-2' },
              '\uD83C\uDFC6'
            ),
            React.createElement(
              'h2',
              { className: 'text-2xl font-black text-[#1e293b] mb-4' },
              '\u5927\u4E82\u9B25\u7D50\u679C'
            ),
            raceResult.entries.map(function (e, idx) {
              return React.createElement(
                'div',
                { key: e.uid, className: 'flex items-center justify-between gap-3 px-4 py-2 mb-2 rounded-xl border-[3px] ' + (idx === 0 ? 'bg-[#4ade80] border-slate-800' : 'bg-slate-50 border-slate-300') },
                React.createElement(
                  'span',
                  { className: 'font-black text-slate-800 truncate' },
                  ['🥇', '🥈', '🥉'][idx] || idx + 1 + '.',
                  ' ',
                  e.name,
                  e.uid === myId ? '(你)' : ''
                ),
                React.createElement(
                  'span',
                  { className: 'font-mono font-black text-slate-800 shrink-0' },
                  e.finished ? formatTime(Math.floor(e.timeMs / 1000)) : '未完成 · ' + Math.round((e.progress || 0) * 100) + '%'
                )
              );
            }),
            raceResult.winnerUid === myId ? React.createElement(
              'p',
              { className: 'text-emerald-600 font-black text-lg my-2' },
              '\uD83C\uDF89 \u4F60\u8D0F\u4E86\uFF01'
            ) : React.createElement(
              'p',
              { className: 'text-slate-500 font-black text-lg my-2' },
              raceResult.entries.some(function (e) {
                return e.uid === myId && e.finished;
              }) ? '完賽了，名次如上！' : '比賽結束，結果如上'
            ),
            raceResult.entries.some(function (e) {
              return e.uid === myId && e.finished;
            }) && React.createElement(
              'div',
              { className: 'flex justify-center gap-2 my-3' },
              [0, 1, 2].map(function (i) {
                return React.createElement(
                  'span',
                  { key: i, className: i < stars ? "animate-starPop text-4xl inline-block" : "text-4xl inline-block opacity-20 grayscale", style: i < stars ? { animationDelay: i * 0.3 + 's' } : {} },
                  '\u2B50'
                );
              })
            ),
            React.createElement(
              'div',
              { className: 'flex justify-center gap-2 mt-4 flex-wrap' },
              React.createElement(
                'button',
                { onClick: function onClick() {
                    var opps = Object.keys(brawlBoards);if (opps.length) setGodViewUid(opps[0]);
                  }, disabled: Object.keys(brawlBoards).length === 0, className: 'px-4 py-3 bg-sky-200 text-slate-900 border-4 border-slate-800 font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all disabled:opacity-40' },
                '\uD83D\uDC41\uFE0F \u770B\u76E4\u9762'
              ),
              React.createElement(
                'button',
                { onClick: playAgain, className: 'px-4 py-3 bg-[#4ade80] text-slate-900 border-4 border-slate-800 font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all' },
                '\uD83D\uDD01 \u518D\u4F86\u4E00\u5C40'
              ),
              React.createElement(
                'button',
                { onClick: requestLobby, className: 'px-4 py-3 bg-red-400 text-slate-900 border-4 border-slate-800 font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all' },
                '\uD83C\uDFC1 \u56DE\u7B49\u5F85\u5BA4'
              ),
              React.createElement(
                'button',
                { onClick: handleGoHome, className: 'px-4 py-3 bg-white text-slate-800 border-4 border-slate-800 font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all' },
                '\u96E2\u958B'
              )
            ),
            !isHostRef.current && React.createElement(
              'p',
              { className: 'text-xs font-semibold text-slate-400 mt-3' },
              '\u518D\u4F86\u4E00\u5C40\uFF0F\u56DE\u7B49\u5F85\u5BA4\u90FD\u6703\u5E36\u5168\u54E1\u4E00\u8D77'
            )
          )
        ),
        confetti.length > 0 && !hideVictoryModal && React.createElement(
          'div',
          { className: 'absolute inset-0 z-[55] pointer-events-none overflow-hidden' },
          confetti.map(function (c) {
            return React.createElement('div', { key: c.id, className: 'confetti-piece absolute -top-4', style: { left: c.left + '%', width: c.w + 'px', height: c.h + 'px', backgroundColor: c.color, animationDuration: c.dur + 's', animationDelay: c.delay + 's' } });
          })
        ),
        isWon && !hideVictoryModal && !inRace && React.createElement(
          'div',
          { className: 'absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] pointer-events-auto ' + (isClosingModal ? 'animate-fadeOut' : 'animate-fadeIn') },
          React.createElement(
            'div',
            { className: 'bg-white rounded-2xl p-6 md:p-8 border-[4px] border-[#1e293b] shadow-[10px_10px_0px_#1e293b] text-center min-w-[280px] md:min-w-[320px] relative ' + (isClosingModal ? 'animate-popOutCenter' : 'animate-popUpCenter') },
            React.createElement(
              'button',
              { onClick: closeVictoryModal, className: 'absolute top-2 right-4 text-slate-400 hover:text-[#1e293b] text-2xl font-black' },
              '\u2715'
            ),
            React.createElement(
              'div',
              { className: 'text-5xl md:text-6xl mb-3' },
              '\uD83D\uDCA5\uD83C\uDFC6'
            ),
            React.createElement(
              'h2',
              { className: 'text-2xl md:text-3xl font-black text-[#1e293b] mb-2 uppercase tracking-wide' },
              'PERFECT!'
            ),
            React.createElement(
              'p',
              { className: 'text-slate-600 mb-1 text-sm md:text-base font-bold' },
              '\u6240\u6709\u7684\u5CF6\u5DBC\u90FD\u6210\u529F\u9023\u7D50\u4E86\uFF01'
            ),
            React.createElement(
              'p',
              { className: 'text-blue-600 mb-1 text-sm md:text-base font-bold' },
              '\u5B8C\u6210\u6642\u9593\uFF1A',
              endTime ? formatTime(Math.floor((endTime - startTime) / 1000)) : "00:00"
            ),
            React.createElement(
              'div',
              { className: 'flex justify-center gap-2 my-3' },
              [0, 1, 2].map(function (i) {
                return React.createElement(
                  'span',
                  { key: i, className: i < stars ? "animate-starPop text-4xl md:text-5xl inline-block" : "text-4xl md:text-5xl inline-block opacity-20 grayscale", style: i < stars ? { animationDelay: i * 0.3 + 's' } : {} },
                  '\u2B50'
                );
              })
            ),
            isNewBest && React.createElement(
              'p',
              { className: 'text-amber-600 font-black mb-2 animate-pulse' },
              '\uD83C\uDF89 \u65B0\u7D00\u9304\uFF01'
            ),
            isDailyMode ? React.createElement(
              'p',
              { className: 'text-emerald-600 mb-6 text-sm md:text-base font-black border-b-[3px] border-dashed border-slate-300 pb-4' },
              '\u2705 \u4ECA\u65E5\u6311\u6230\u5B8C\u6210\uFF01\u660E\u5929\u518D\u4F86'
            ) : React.createElement('div', { className: 'border-b-[3px] border-dashed border-slate-300 mb-6' }),
            React.createElement(
              'div',
              { className: 'flex justify-center gap-3' },
              isDailyMode ? React.createElement(
                'button',
                { onClick: triggerDailyHome, className: 'px-5 py-3 bg-[#4ade80] text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all text-base md:text-lg' },
                '\u56DE\u4E3B\u9078\u55AE \uD83C\uDFE0'
              ) : engine === 'peerjs' ? React.createElement(
                React.Fragment,
                null,
                React.createElement(
                  'button',
                  { onClick: playAgain, className: 'px-5 py-3 bg-[#4ade80] text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all text-base md:text-lg' },
                  '\u518D\u4F86\u4E00\u5C40 \u2794'
                ),
                React.createElement(
                  'button',
                  { onClick: requestLobby, className: 'px-5 py-3 bg-white text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all text-base md:text-lg' },
                  '\u56DE\u7B49\u5F85\u5BA4'
                )
              ) : React.createElement(
                'button',
                { onClick: triggerRegenerate, className: 'px-5 py-3 bg-[#4ade80] text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] transition-all text-base md:text-lg' },
                '\u518D\u4F86\u4E00\u5C40 \u2794'
              )
            )
          )
        ),
        isWon && hideVictoryModal && React.createElement(
          'div',
          { className: 'absolute bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none' },
          React.createElement(
            'button',
            { onClick: function onClick() {
                return setHideVictoryModal(false);
              }, className: 'pointer-events-auto bg-[#4ade80] text-[#1e293b] border-[4px] border-[#1e293b] px-6 py-3 rounded-full shadow-[6px_6px_0px_#1e293b] hover:translate-y-[2px] transition-all font-black flex items-center gap-2 tracking-wide text-lg' },
            '\uD83C\uDFC6 \u986F\u793A\u6210\u7E3E'
          )
        )
      )
    ),
    showSaveModal && React.createElement(
      'div',
      { className: 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4' },
      React.createElement(
        'div',
        { className: 'bg-[#f6fdf6] border-[4px] border-[#1e293b] rounded-2xl p-6 shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full max-w-md animate-popUp' },
        React.createElement(
          'h2',
          { className: 'text-2xl font-black text-slate-800 mb-2 border-b-4 border-blue-500 inline-block pb-1' },
          '\uD83D\uDCBE \u5B58\u6A94\u8207\u8B80\u6A94'
        ),
        React.createElement(
          'p',
          { className: 'text-sm font-bold text-slate-600 mb-4' },
          '\u5C07\u9032\u5EA6\u8F49\u63DB\u70BA\u4EE3\u78BC\uFF0C\u4E0B\u6B21\u8CBC\u4E0A\u4EE3\u78BC\u5373\u53EF\u6062\u5FA9\uFF01'
        ),
        React.createElement(
          'div',
          { className: 'mb-6' },
          React.createElement(
            'button',
            { onClick: handleSaveCode, className: 'plat-btn-hard w-full py-3 bg-blue-500 text-white border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] mb-3 text-base md:text-lg' },
            '\u7522\u751F\u9032\u5EA6\u4EE3\u78BC (\u81EA\u52D5\u8907\u88FD)'
          ),
          React.createElement(
            'div',
            { className: 'relative' },
            React.createElement('textarea', { id: 'saveCodeTextarea', value: saveCode, onChange: function onChange(e) {
                return setSaveCode(e.target.value);
              }, placeholder: '\u9EDE\u64CA\u4E0A\u65B9\u6309\u9215\u751F\u6210\uFF0C\u6216\u662F\u624B\u52D5\u8CBC\u4E0A\u820A\u4EE3\u78BC\u81F3\u6B64\u8655', rows: '4', className: 'w-full border-4 border-slate-800 rounded-xl p-3 pb-12 font-mono text-sm shadow-inner outline-none focus:bg-blue-50 break-all bg-white' }),
            React.createElement(
              'button',
              { onClick: handleQuickPaste, className: 'plat-btn-hard plat-btn-hard-2 absolute bottom-3 right-3 bg-[#4ade80] text-slate-900 px-3 py-1.5 rounded-lg text-sm font-black border-2 border-slate-800 hover:bg-[#e6b800] shadow-[2px_2px_0px_rgba(30,41,59,1)]' },
              '\uD83D\uDCCB \u5FEB\u901F\u8CBC\u4E0A'
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'flex gap-4' },
          React.createElement(
            'button',
            { onClick: function onClick() {
                return setShowSaveModal(false);
              }, className: 'plat-btn-hard flex-1 py-3 bg-white border-4 border-slate-800 rounded-xl font-black text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)]' },
            '\u95DC\u9589'
          ),
          React.createElement(
            'button',
            { onClick: handleLoadCode, className: 'plat-btn-hard flex-1 py-3 bg-emerald-400 text-slate-900 border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)]' },
            '\u8F09\u5165\u4EE3\u78BC'
          )
        )
      )
    ),
    showSettingsModal && React.createElement(
      'div',
      { className: 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4', onClick: closeSettingsModal },
      React.createElement(
        'div',
        { className: 'bg-[#f6fdf6] border-[4px] border-[#1e293b] rounded-2xl p-6 shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full max-w-md animate-popUp', onClick: function onClick(e) {
            return e.stopPropagation();
          } },
        React.createElement(
          'h2',
          { className: 'text-2xl font-black text-slate-800 mb-2 border-b-4 border-[#4ade80] inline-block pb-1' },
          '\u2699\uFE0F \u8A2D\u5B9A\u96E3\u5EA6'
        ),
        React.createElement(
          'p',
          { className: 'text-sm font-bold text-slate-600 mb-4' },
          soloPick ? '選一個難度，開始一局新的挑戰。' : '選一個難度，立刻換一題新的。'
        ),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-2 mb-4' },
          LEVELS.map(function (level) {
            return React.createElement(
              'button',
              { key: level.id, onClick: function onClick() {
                  setShowSettingsModal(false);if (soloPick && level.id !== 'custom') {
                    try {
                      localStorage.setItem('hashi_solo_level', String(level.id));
                    } catch (e) {}setSoloPick(false);
                  }handleLevelChange(level.id === 'custom' ? 'custom' : level.id);
                }, className: "plat-btn-hard plat-btn-hard-3 w-full text-left px-4 py-3 border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_rgba(30,41,59,1)]" + (String(currentLevelId) === String(level.id) ? " bg-[#4ade80] text-slate-900" : " bg-white text-slate-800") },
              level.name,
              React.createElement(
                'span',
                { className: 'block text-xs font-bold opacity-70 mt-0.5' },
                level.description
              )
            );
          })
        ),
        React.createElement(
          'button',
          { onClick: closeSettingsModal, className: 'plat-btn-hard w-full py-3 bg-white border-4 border-slate-800 rounded-xl font-black text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)]' },
          '\u53D6\u6D88'
        )
      )
    ),
    showCustomModal && React.createElement(
      'div',
      { className: 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4' },
      React.createElement(
        'div',
        { className: 'bg-[#f6fdf6] border-[4px] border-[#1e293b] rounded-2xl p-6 shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full max-w-sm animate-popUpCenter' },
        React.createElement(
          'div',
          { className: 'flex justify-between items-center mb-4 border-b-4 border-slate-800 pb-2' },
          React.createElement(
            'h2',
            { className: 'text-xl font-black text-slate-800' },
            '\u2699\uFE0F \u81EA\u8A02\u5730\u5716\u5C3A\u5BF8'
          ),
          React.createElement(
            'button',
            { onClick: function onClick() {
                setShowCustomModal(false);
                setCurrentLevelId(stateRef.current.levelId);
                if (soloPick) {
                  setSoloPick(false);setScreen('home');
                }
              }, className: 'text-slate-400 hover:text-slate-800 text-2xl font-black' },
            '\u2715'
          )
        ),
        React.createElement(
          'p',
          { className: 'text-xs font-semibold text-slate-500 mb-4' },
          '\u8F38\u5165\u5C08\u5C6C\u9577\u5BEC\uFF085 ~ 100\uFF09\uFF0C\u751F\u6210\u8D85\u5927\u578B\u5408\u4F5C\u5730\u5716\uFF1A'
        ),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-4 mb-6' },
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'block text-sm font-bold text-slate-800 mb-1' },
              '\u5BEC\u5EA6 (\u6A6B\u5411\u5CF6\u5DBC\u6578):'
            ),
            React.createElement('input', { type: 'number', min: '5', max: '100', value: tempWidth, onChange: function onChange(e) {
                return setTempWidth(parseInt(e.target.value) || 5);
              }, className: 'w-full border-2 border-slate-800 rounded-md p-2 font-bold focus:ring-2 ring-[#4ade80] outline-none' })
          ),
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'block text-sm font-bold text-slate-800 mb-1' },
              '\u9577\u5EA6 (\u76F4\u5411\u5CF6\u5DBC\u6578):'
            ),
            React.createElement('input', { type: 'number', min: '5', max: '100', value: tempHeight, onChange: function onChange(e) {
                return setTempHeight(parseInt(e.target.value) || 5);
              }, className: 'w-full border-2 border-slate-800 rounded-md p-2 font-bold focus:ring-2 ring-[#4ade80] outline-none' })
          )
        ),
        React.createElement(
          'div',
          { className: 'flex gap-3' },
          React.createElement(
            'button',
            { onClick: function onClick() {
                setShowCustomModal(false);
                setCurrentLevelId(stateRef.current.levelId);
                if (soloPick) {
                  setSoloPick(false);setScreen('home');
                }
              }, className: 'plat-btn-hard plat-btn-hard-2 flex-1 py-2 bg-slate-200 border-2 border-slate-800 rounded-xl font-black text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] hover:bg-slate-300' },
            '\u53D6\u6D88'
          ),
          React.createElement(
            'button',
            { onClick: handleCustomGenerate, className: 'plat-btn-hard plat-btn-hard-2 flex-1 py-2 bg-[#4ade80] border-2 border-slate-800 rounded-xl font-black text-slate-900 shadow-[2px_2px_0px_rgba(30,41,59,1)] hover:bg-[#e6b800]' },
            '\u7522\u751F'
          )
        )
      )
    ),
    toastMsg && React.createElement(
      'div',
      { className: 'fixed top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full font-bold shadow-[0_4px_10px_rgba(0,0,0,0.3)] z-[100] border-[3px] border-white animate-slideUpFade' },
      toastMsg
    ),
    speakPrompt && !speakerOn && React.createElement(
      'div',
      { className: 'absolute top-2 left-1/2 -translate-x-1/2 z-[96] bg-slate-800 text-white pl-4 pr-2 py-2 rounded-full font-bold shadow-[0_4px_10px_rgba(0,0,0,0.35)] border-[3px] border-white flex items-center gap-2 whitespace-nowrap max-w-[calc(100%-16px)]' },
      React.createElement(
        'span',
        { className: 'truncate' },
        '\uD83D\uDD0A ',
        speakPrompt.name,
        ' \u767C\u8A00\u4E2D\uFF0C\u958B\u555F\u97F3\u6548\uFF1F'
      ),
      React.createElement(
        'button',
        { onClick: function onClick() {
            return setSpeakerOn(true);
          }, className: 'bg-[#4ade80] text-slate-900 px-3 py-1 rounded-full font-black border-2 border-slate-900 shrink-0' },
        '\u958B\u555F'
      ),
      React.createElement(
        'button',
        { onClick: function onClick() {
            return setSpeakPrompt(null);
          }, className: 'bg-white/20 text-white px-2 py-1 rounded-full font-black shrink-0' },
        '\u2715'
      )
    ),
    chatOpen && !PLAT_MODE && engineRef.current === 'peerjs' && React.createElement(
      'div',
      { className: 'absolute inset-0 z-[95] flex items-end justify-center pointer-events-none p-3' },
      React.createElement(
        'div',
        { className: 'pointer-events-auto w-full max-w-md bg-[#f6fdf6]/90 backdrop-blur-[2px] border-4 border-slate-800 rounded-2xl shadow-[4px_4px_0px_rgba(30,41,59,0.6)] flex flex-col overflow-hidden', style: chatMin ? {} : { height: '40vh', maxHeight: '380px' } },
        React.createElement(
          'div',
          { onClick: function onClick() {
              return setChatMin(function (prev) {
                return !prev;
              });
            }, className: 'flex items-center justify-between px-3 py-2 bg-[#4ade80] border-b-[3px] border-slate-800 shrink-0 cursor-pointer select-none' },
          React.createElement(
            'span',
            { className: 'font-black text-slate-900' },
            '\uD83D\uDCAC \u804A\u5929\u5BA4 ',
            unreadChat > 0 && React.createElement(
              'span',
              { className: 'ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black inline-flex items-center justify-center border-2 border-white align-middle' },
              unreadChat > 99 ? '99+' : unreadChat
            )
          ),
          React.createElement(
            'div',
            { className: 'flex items-center gap-2' },
            React.createElement(
              'span',
              { className: 'font-black text-slate-800' },
              chatMin ? '🔼' : '🔽'
            ),
            React.createElement(
              'button',
              { onClick: function onClick(e) {
                  e.stopPropagation();setChatOpen(false);
                }, className: 'w-7 h-7 rounded-full bg-white border-2 border-slate-800 font-black text-slate-800 text-sm leading-none' },
              '\u2715'
            )
          )
        ),
        !chatMin && React.createElement(
          React.Fragment,
          null,
          React.createElement(
            'div',
            { ref: chatListRef, className: 'flex-1 overflow-y-auto px-3 py-2 space-y-2' },
            chatMsgs.length === 0 && React.createElement(
              'p',
              { className: 'text-center text-slate-400 text-xs font-semibold py-8' },
              '\u9084\u6C92\u6709\u8A0A\u606F\uFF0C\u6253\u500B\u62DB\u547C\u5427\uFF01\uD83D\uDC4B'
            ),
            chatMsgs.map(function (m) {
              return React.createElement(
                'div',
                { key: m.id, className: "flex " + (m.mine ? "justify-end" : "justify-start") },
                React.createElement(
                  'div',
                  { className: "max-w-[82%] px-2.5 py-1.5 rounded-xl border-2 border-slate-800 " + (m.mine ? "bg-[#4ade80]" : "bg-white") },
                  !m.mine && React.createElement(
                    'div',
                    { className: 'text-[10px] font-black leading-tight', style: { color: m.color === 'rainbow' ? '#a855f7' : m.color } },
                    m.name
                  ),
                  React.createElement(
                    'div',
                    { className: 'break-words text-sm font-bold text-slate-900 leading-snug' },
                    m.text
                  )
                )
              );
            })
          ),
          React.createElement(
            'div',
            { className: 'flex gap-2 p-2 border-t-[3px] border-slate-800 shrink-0 bg-white' },
            React.createElement('input', {
              value: chatInput,
              onChange: function onChange(e) {
                return setChatInput(e.target.value);
              },
              onKeyDown: function onKeyDown(e) {
                if (e.key === 'Enter') sendChat();
              },
              placeholder: '\u8F38\u5165\u8A0A\u606F\u2026',
              maxLength: 200,
              className: 'flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-slate-800 text-sm font-bold outline-none focus:border-emerald-500'
            }),
            React.createElement(
              'button',
              { onClick: sendChat, className: 'plat-btn-hard plat-btn-hard-2 px-4 py-2 bg-[#4ade80] border-2 border-slate-800 rounded-xl font-black text-slate-900 shadow-[2px_2px_0px_rgba(30,41,59,1)] shrink-0' },
              '\u9001\u51FA'
            )
          )
        )
      )
    ),
    tutorialOverlay
  );
}
var root = ReactDOM.createRoot(document.getElementById('hashi-root'));
root.render(React.createElement(window.PlatBoundary, null, React.createElement(HashiGame, null)));