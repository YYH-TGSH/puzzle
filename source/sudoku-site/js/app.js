// 數獨 App：React 元件（大廳、多人連線、對戰、道具）
// 由 sudoku-v3.13.4.html 拆出；引擎函數在 js/engine.js

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


function GameTimer({ startTime, endTime, isRunning, matchPhase }) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        if (!isRunning) return;
        setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [isRunning, startTime]);
    let secs = 0;
    if (matchPhase === 'playing' || matchPhase === 'finished') {
        secs = Math.max(0, Math.floor(((endTime || now) - startTime) / 1000));
    }
    return <span style={{ color: matchPhase === 'finished' ? '#ff4444' : 'white', fontWeight: 'bold', fontSize: '1.1em' }}>⏱ {formatTime(secs)}</span>;
}

function platTimeOffset() { try { return (window.__PLAT_NET && window.__PLAT_NET.timeOffset) || 0; } catch (e) { return 0; } } // 房主時鐘偏移（稽核 D-05）：殼以 roster 時間戳估計，房主/單機恆 0
function SudokuGame() {
        const playerIdRef = useRef((() => { try {
          const K = 'plat_uid_sudoku';
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
          beat(); // interval id 存到 window 並先清舊的（稽核 D-06：平台 REBOOT 重跑程式碼時舊 interval 不會疊加）
          const _ct = window.__platClaimTimers || (window.__platClaimTimers = {});
          if (_ct[K]) clearInterval(_ct[K]);
          _ct[K] = setInterval(beat, 3000);
          let u = localStorage.getItem(K);
          if (!u) { u = Math.random().toString(36).substring(2, 12); localStorage.setItem(K, u); }
          return u;
        } catch (e) { return Math.random().toString(36).substring(2, 12); } })()); // 持久 uid：同裝置重連同房間＝同座位（重連回座）；同瀏覽器多分頁僅第一個分頁用正規 uid
    const myId = playerIdRef.current;
    const myNameRef = useRef("");
    const lastSeenRef = useRef({}); // 在線心跳：uid → 最後收到其訊息的時間（房主端判定離線用）
    const tournRosterRef = useRef(null); // 五戰名單帶入：本局預期選手（殼 sess.tourn.roster），等待室先種灰色未到席位
    const platTournLockRef = useRef(false); // 五戰鎖定（ref 版，完賽結算判定用）
    const hostSeenRef = useRef(0); // 來賓端：最後收到房主訊息的時間
    const lastPingRef = useRef(0);
    const myColorRef = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);

    const emptyLevelData = { sizeDef: SIZES[1], diffDef: DIFFICULTIES[1], cells: [] };

    const initialDataRef = useRef(emptyLevelData);

    const [screen, setScreen] = useState('home');
    const screenRef = useRef('home');
    useEffect(() => { screenRef.current = screen; }, [screen]);
    const [engine, setEngine] = useState('none');

    const [sizeId, setSizeId] = useState(9);
    const [diffId, setDiffId] = useState('medium');

    const [levelData, setLevelData] = useState(initialDataRef.current);
    const [cells, setCells] = useState(initialDataRef.current.cells);
    const [localCells, setLocalCells] = useState([]);
    const solutionGridRef = useRef(null);
    const [ghostHints, setGhostHints] = useState({});
    const [isBrawlMode, setIsBrawlMode] = useState(false);
    const [brawlWinners, setBrawlWinners] = useState([]);
    const [brawlSettings, setBrawlSettings] = useState({ winnersCount: 3, allowQuickFill: false, allowTraversal: false, allowYellowHint: false, hideAnswers: true, allowOthersToPlayAgain: true, allowGifts: true, showNumbersInGodMode: false, allowWeapons: true, weaponStartTime: 60 });
    const [showBrawlSettings, setShowBrawlSettings] = useState(false);
    const [winner, setWinner] = useState(null);
    const isWinnerDeclaredRef = useRef(false);
    const lastWinInfoRef = useRef(null); // 最近一次完賽資訊（GHOST_I_WON 補送用）
    const winResentRef = useRef(0);

    const [showSetupModal, setShowSetupModal] = useState(false);
    const [tempSizeId, setTempSizeId] = useState(9);
    const [tempDiffId, setTempDiffId] = useState('medium');

    const [matchPhase, setMatchPhase] = useState('playing');
    const [countdownTarget, setCountdownTarget] = useState(null);
    const [countdownValue, setCountdownValue] = useState(null);


    const [isSpectator, setIsSpectator] = useState(false);

    const [strokes, setStrokes] = useState([]);
    const [history, setHistory] = useState([]);
    const [isWon, setIsWon] = useState(false);
    const [hideVictoryModal, setHideVictoryModal] = useState(false);
    const resultsDismissRef = useRef(null); // PlatResults 關閉標記（記 matchPhase：同 phase 內關了不再彈，phase 變了——如結算——再彈）
    const [resultsDismissedUi, setResultsDismissedUi] = useState(false); // 結果卡被「看盤面」關掉後，畫面留一顆🏆結果鈕可隨時叫回
    const [leaveArm, setLeaveArm] = useState(false); // 結果卡「離開」兩段確認（防誤按就拆連線退場、結果再也叫不回）
    const leaveArmTimerRef = useRef(null);
    const [showExitMenu, setShowExitMenu] = useState(false); // 標頭「退出」選單（錦標賽房主進行中按退出才開，內含「結束本局」防誤觸）
    const [toastMsg, setToastMsg] = useState("");

    const [startTime, setStartTime] = useState(Date.now());
    const [endTime, setEndTime] = useState(null);
    const [matchStartTime, setMatchStartTime] = useState(null);

    const [zoomLevel, setZoomLevel] = useState(1);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveCode, setSaveCode] = useState("");

    const [interactionMode, setInteractionMode] = useState(0);
    const [drawSubMode, setDrawSubMode] = useState('pen');
    const [selectedChar, setSelectedChar] = useState(null);
    // 輸入方式：'num' 數字先行（先點數字再點格子）｜'cell' 格子先行（先點格子再點數字）— 玩家可切換、記住選擇
    const [inputMode, setInputMode] = useState(() => platSave().getStr('sudoku_input_mode', '') === 'cell' ? 'cell' : 'num');
    const [selectedCellId, setSelectedCellId] = useState(null);
    useEffect(() => { platSave().setStr('sudoku_input_mode', inputMode); }, [inputMode]);
    // v1.61.0 K1：單機難度段位滑動指示片（殼 PlatSeg 共用；量測在 effect 內、選取變化才滑）
    useEffect(() => { if (window.PlatSeg) { var c = document.querySelector('#view-sudoku [data-seg="sudoku-diff"]'); var b = c && c.querySelector('[data-seg-on="1"]'); if (c && b) window.PlatSeg(c, 'sudoku-diff', b, '#ffcc00'); } }, [diffId, screen]);
    // 靜音偏好（與全域音效引擎同步，同數橋）
    const [muted, setMuted] = useState(() => platAudio().isMuted()); // 靜音統一殼級 plat_muted（PlatAudio，v1.64.0）

    // 平台 dock 按鈕（💬/🎥/🎤/🔈）：平台模式＋連線中時畫進自己的底部列，與遊戲按鈕同排同款
    const [dockTick, setDockTick] = useState(0);
    useEffect(() => { if (window.PlatDock) return window.PlatDock.subscribe(() => setDockTick(t => t + 1)); }, []);
    const platDock = (window.__PLAT_PLATFORM && window.PlatDock && window.PlatDock.isActive()) ? window.PlatDock.getState() : null;
    const renderDockCapsule = (withLobby) => {
        if (!platDock) return null;
        const PD = window.PlatDock;
        const dbtn = (active) => "px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl font-black text-base md:text-lg flex items-center justify-center transition-all relative " + (active ? "bg-[#ffcc00] text-slate-900 shadow-md" : "text-slate-400 hover:text-white");
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

    // 禮物與反擊機制 (盤面直接覆蓋)
    const [unopenedGifts, setUnopenedGifts] = useState({});
    const [keyMapping, setKeyMapping] = useState(initialDataRef.current.sizeDef.chars);
    const [flippedKeys, setFlippedKeys] = useState([]);
    const [flares, setFlares] = useState([]);

    // === 道具系統：水球霧化 + 格子清除 ===
    const [myWeapons, setMyWeapons] = useState([]);         // ['balloon','eraser',...]
    const [foggedBoxes, setFoggedBoxes] = useState({});     // { boxId: expiryTimestamp }
    const [erasingCells, setErasingCells] = useState({});   // { cellId: { value, timestamp } }
    const [finishViewMode, setFinishViewMode] = useState('my'); // 'my' | 'god'
    const [godUid, setGodUid] = useState(null); // 上帝視角正在看的選手（v1.44 Q5：觀戰改單盤＋選手切換，比照數橋/地雷）
    const lastMilestoneRef = useRef(0);    // 已跨越的 5% 里程碑數量（0~19，逐格補報不跳過）
    const giftCreditRef = useRef(0);       // 禮物計量額度：每完成一個行/列/宮/數字 +0.5，湊滿 1 才送出

    const processedEventsRef = useRef(new Set());
    const completedRegionsRef = useRef(new Set());
    const scrambledCharsRef = useRef(new Set());

    const modeIcons = ['🖋️', '✏️', '🖌️'];
    const modeTitles = ['填答模式', '草稿模式', '畫筆作記號'];

    const [zoomModeIdx, setZoomModeIdx] = useState(3);
    const [zoomIndicator, setZoomIndicator] = useState({ value: 1.0, visible: false });
    const zoomIndicatorTimer = useRef(null);
    const [isClosingModal, setIsClosingModal] = useState(false);

    // --- 漂浮選單分身術 (Zoom 與 Mode 獨立系統) ---
    const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
    const [zoomMenuPos, setZoomMenuPos] = useState({ x: -1, y: -1 });
    const [isDraggingZoom, setIsDraggingZoom] = useState(false);
    const wasZoomDragged = useRef(false);
    const zoomDragTimer = useRef(null);

    const [modeSubOpen, setModeSubOpen] = useState(false);
    const [zoomOpen, setZoomOpen] = useState(false);
    const advanceInteractionMode = () => {
        const next = (interactionMode + 1) % 3;
        setInteractionMode(next);
        setModeSubOpen(next === 2);
        showToast(next === 0 ? '🖋️ 填答模式' : next === 1 ? '✏️ 筆記模式' : '🖌️ 塗鴉模式');
    };
    const cycleInteractionMode = () => {
        if (interactionMode === 2 && !modeSubOpen) { setModeSubOpen(true); return; }
        advanceInteractionMode();
    };
    const [modeMenuPos, setModeMenuPos] = useState({ x: -1, y: -1 });
    const [isDraggingMode, setIsDraggingMode] = useState(false);
    const wasModeDragged = useRef(false);
    const modeDragTimer = useRef(null);

    const [menuVertical, setMenuVertical] = useState(true); // 共用排列方向偏好
    const [isGenerating, setIsGenerating] = useState(false);
    const [genProgress, setGenProgress] = useState("");
    const isAutoFillingRef = useRef(false);

    const [colorPickerTarget, setColorPickerTarget] = useState(null);
    const [colorSeq, setColorSeq] = useState([]);
    const [editName, setEditName] = useState("");

    const [roomId, setRoomId] = useState("");
    const [isHost, setIsHost] = useState(false);
    const isHostRef = useRef(false);
    const [tempRoomId, setTempRoomId] = useState("");
    const [tempPlayerName, setTempPlayerName] = useState("");
    // ===== 每日一題（比照數橋） =====
    const dailyTodayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const shiftDateStr = (ds, delta) => { const d = new Date(ds + 'T12:00:00'); d.setDate(d.getDate() + delta); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const [dailyPickDate, setDailyPickDate] = useState(() => dailyTodayStr());
    const [dailyDate, setDailyDate] = useState(null); // 進行中的每日題日期（null=非每日模式）
    const dailyRef = useRef(null);
    const dailyRecordedRef = useRef(false);
    const [dailyRecords, setDailyRecords] = useState(() => platSave().read('sudoku_daily_records', { fallback: {} }));
    const [dailyStreak, setDailyStreak] = useState(() => platSave().read('sudoku_daily_streak', { fallback: { count: 0, lastDate: '' } }));
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutStep, setTutStep] = useState(0); // 玩法教學步進（美學稽核 V-09：三款教學統一為數橋的步進骨架）
    const [tutDemoVal, setTutDemoVal] = useState(null);   // 教學互動 demo（v1.46 Q6）：已填入的數字
    const [tutDemoWrong, setTutDemoWrong] = useState(null); // 教學互動 demo：剛填錯的數字

    const [playersList, setPlayersList] = useState([{ id: myId, name: "單機玩家", isHost: true, color: COLORS[11], isReady: false, isSpectator: false }]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("");
    const [showCancelButton, setShowCancelButton] = useState(false);

    const [showOtherCursors, setShowOtherCursors] = useState(true);
    const [showGhostProgress, setShowGhostProgress] = useState(true);
    const [cursors, setCursors] = useState({});
    const [ripples, setRipples] = useState([]);
    const [pressedCellId, setPressedCellId] = useState(null); // C 類按壓回饋（v1.54.0）：純顯示層覆蓋，不碰選格/輸入/長按邏輯

    const isMultiplayer = engine === 'peerjs';
    const svgRef = useRef(null);
    const lastCursorSend = useRef(0);
    const isDrawingRef = useRef(false);

    const cellLongPressTimer = useRef(null);
    const isLongPressTriggered = useRef(false);
    const touchStartPt = useRef(null);
    const tapSeqRef = useRef(0); // 每次 pointerdown 的點按序號：長按標記只擋同一次點按的放開，不毒到下一次
    const longPressSeqRef = useRef(-1);
    const tapInfoRef = useRef(null); // 本次點按落在哪一格（pointerup 直接處理點按用，不單靠 click）
    const cellTrkRef = useRef(null); // 本次格點按的 PlatTap 實例（每按新建一顆：長按計時器閉包各 poll 自己那顆，跨按不互擾——守恆舊 seq 語意）
    const supTrkRef = useRef(null); // 格/數字鍵共用的尾隨 click 抑制（PlatTap suppress 700ms 全擋——舊 pointerTapDedupeRef 語意，v1.63.0 收編）
    const supTrk = () => { if (!supTrkRef.current) supTrkRef.current = platTapNew({ suppressMs: 700 }); return supTrkRef.current; };
    const padTapRef = useRef(null); // F1：數字鍵 pointer 點按追蹤（按下鍵＋client 座標） // pointerup 已處理過的點按：擋掉隨後跟來的重複 click

    const engineRef = useRef('none');
    const peerRef = useRef(null);
    const connRef = useRef(null);
    const connsRef = useRef([]);
    const zoomContainerRef = useRef(null);
    const lastPinchDist = useRef(null);
    const stateRef = useRef({ cells: [], localCells: [], levelData: null, startTime: Date.now(), sizeId: 9, diffId: 'medium', strokes: [], isGenerating: false, selectedChar: null, isBrawlMode: false, brawlWinners: [], brawlSettings: { winnersCount: 3, allowQuickFill: false, allowTraversal: false, allowYellowHint: false, hideAnswers: true, allowOthersToPlayAgain: true, allowGifts: true, showNumbersInGodMode: false }, winner: null, isAutoFilling: false, matchPhase: 'playing', matchEndTime: null, countdownTarget: null, giftEvents: [], keyMapping: [], unopenedGifts: {}, myWeapons: [] });

    const playersListRef = useRef([]);

    const handleMultiplayerWinRef = useRef(null);
    handleMultiplayerWinRef.current = (winInfo) => {
        if (!stateRef.current.isBrawlMode) return;
        if (stateRef.current.brawlWinners.some(w => w.id === winInfo.id)) return;

        const curWinners = stateRef.current.brawlWinners;
        const newWinners = [...curWinners, winInfo];
        const winnersIds = newWinners.map(w => w.id || w.uid);
        const winnerNames = newWinners.map(w => w.name);
        // 結算條件硬化：非房主玩家「已完賽（id 或名字對上）或觀戰中」都算了結。
        // 舊式只認「未觀戰選手全數在 winners」：名單旗標/uid 一旦分歧（觀戰旗標殘留、重連換 id），
        // allDone 永遠不成立，房主會永遠卡在「等待第 N 名完成」。
        const contenders = playersListRef.current.filter(p => !p.isHost);
        const isDoneEntry = (p) => p.isSpectator || winnersIds.includes(p.id) || (p.name && winnerNames.includes(p.name));
        // 房主自己也是選手，必須一併了結才能結算（五戰第三局來賓先贏、房主被跳結算的根因：
        // contenders 只算非房主，來賓一完賽 every() 就成立，房主還在玩就被拉去看成績、賽程斷掉）。
        // 數橋 maybeFinalize 本來就有把自己的完賽算進 finCount，數獨這裡對齊。
        const hostEntry = playersListRef.current.find(p => p.isHost);
        const hostDone = !hostEntry || isDoneEntry(hostEntry);

        const winnersLimit = stateRef.current.isBrawlMode ? (stateRef.current.brawlSettings.winnersCount || 1) : 1;
        let allDone = (newWinners.length >= winnersLimit) || (hostDone && contenders.length > 0 && contenders.every(isDoneEntry));
        if (platTournLockRef.current) {
            // 五戰本局：必須等所有選手（含房主）都真的完賽才結算——名額到齊、觀戰旗標都不能提前觸發結算（使用者回報第五局被提前結算）
            const racers = playersListRef.current.filter(p => !p.pending);
            allDone = racers.length > 0 && racers.every(p => winnersIds.includes(p.id) || (p.name && winnerNames.includes(p.name)));
        }

        const winnerObj = stateRef.current.isBrawlMode ? (newWinners[0] || winInfo) : winInfo;

        stateRef.current.brawlWinners = newWinners;
        if (allDone) {
            const now = Date.now();
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
            const syncData = { brawlWinners: newWinners };
            if (allDone) {
                syncData.matchPhase = 'finished';
                syncData.matchEndTime = stateRef.current.matchEndTime;
                syncData.winner = winnerObj;
            }
            syncState(syncData, true);
        }
    };

    const zoomLevelRef = useRef(1);
    const pzRef = useRef(null); // 共用縮放持有（PlatZoom，v1.63.0）：按鈕 0.1–5 步進 0.1；pinch 單次 range [0.4,3.5]；適應模式 setRaw（全守恆）
    const pz = () => { if (!pzRef.current) pzRef.current = platZoomNew({ min: 0.1, max: 5, value: 1 }); return pzRef.current; };
    const zoomModeIdxRef = useRef(3);
    const currentPathDataRef = useRef("");
    const drawingPathRef = useRef(null);
    const eraserRef = useRef(null);
    const lastEraseTimeRef = useRef(0);
    const handleBrawlWinRef = useRef(null);
    const handleRegenerateRandomRef = useRef(null);
    const handleReceiveWeaponRef = useRef(null);
    const handleWeaponHitFogRef = useRef(null);
    const handleWeaponHitEraseRef = useRef(null);
    const handleReceiveCounterAttackRef = useRef(null);
    const handleMilestoneRef = useRef(null);

    handleBrawlWinRef.current = (winInfo) => {
        if (handleMultiplayerWinRef.current) handleMultiplayerWinRef.current(winInfo);
    };

    const cSizeDef = levelData.sizeDef;
    const CELL_SIZE = 60;
    const PADDING = 20;
    const svgW = cSizeDef.size * CELL_SIZE + PADDING * 2;
    const svgH = cSizeDef.size * CELL_SIZE + PADDING * 2;
    const MAX_SAFE_DIMENSION = 4000;

    const activeCells = isBrawlMode ? localCells : cells;

    useEffect(() => { playersListRef.current = playersList; }, [playersList]);

    // 定期清理過期的盤面禮物 (已經廢棄，禮物永久保存不用清理)

    useEffect(() => {
        if (matchPhase === 'countdown' && countdownTarget) {
            const checkTime = () => {
                const remaining = Math.ceil((countdownTarget - (Date.now() + platTimeOffset())) / 1000); // countdownTarget 是房主時鐘的絕對時刻（D-05 時鐘校正）
                if (remaining > 0) {
                    setCountdownValue(remaining);
                } else {
                    setCountdownValue(null);
                    if (stateRef.current.matchPhase !== 'playing') {
                        const localStart = countdownTarget - platTimeOffset(); // 換算回本地時鐘：下游計時/完賽/武器延遲全用本地版
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
            const interval = setInterval(checkTime, 100);
            return () => clearInterval(interval);
        } else {
            setCountdownValue(null);
        }
    }, [matchPhase, countdownTarget]);
    useEffect(() => {
        if (typeof window === 'undefined' || !window.PlatCountdown) return;
        if (window.__PLAT_NET && window.__PLAT_NET.inMatch !== 'sudoku') return; // 平台：背景遊戲不許碰殼的共用 overlay（會把前景那款的倒數/結算弄閃）
        if (countdownValue !== null && !isGenerating) window.PlatCountdown.show(countdownValue);
        else window.PlatCountdown.hide();
    }, [countdownValue, isGenerating]);

    // 共用結算畫面（PlatResults，與數橋同框架）：大亂鬥結算改餵殼 spec，本地 modal 只作無殼時 fallback
    useEffect(() => {
        if (typeof window === 'undefined' || !window.PlatResults) return;
        if (window.__PLAT_NET && window.__PLAT_NET.inMatch !== 'sudoku') return; // 平台：背景遊戲不許碰殼的共用 overlay（會把前景那款的倒數/結算弄閃）
        const showLocal = isBrawlMode && (isWon || winner);
        if (!showLocal) { window.PlatResults.hide(); resultsDismissRef.current = null; if (resultsDismissedUi) setResultsDismissedUi(false); if (leaveArm) setLeaveArm(false); return; }
        if (resultsDismissRef.current === matchPhase) { window.PlatResults.hide(); return; }
        if (resultsDismissedUi) setResultsDismissedUi(false);
        const homeBtn = leaveArm ? { id: 'home', label: '⚠️ 確定離開？', kind: 'danger' } : { id: 'home', label: '離開' };
        const finishedPhase = matchPhase === 'finished';
        const entries = brawlWinners.map(w => ({ key: String(w.id), name: w.name, color: w.color, isMe: w.id === myId, right: '⏱ ' + w.time }));
        if (finishedPhase) {
            const winIds = {}; brawlWinners.forEach(w => { winIds[w.id] = true; });
            const rest = playersList.filter(p => !p.isSpectator && !winIds[p.id])
                .map(p => ({ p: p, prog: ghostProgress[p.id] || 0 }))
                .sort((a, b) => b.prog - a.prog)
                .map(x => ({ key: String(x.p.id), name: x.p.name, color: x.p.color, isMe: x.p.id === myId, isHost: !!x.p.isHost, right: '未完成 · ' + Math.round(x.prog) + '%' }));
            entries.push.apply(entries, rest);
        }
        const iWon = brawlWinners.length > 0 && brawlWinners[0].id === myId;
        const iFinished = brawlWinners.some(w => w.id === myId);
        const canControl = isHostRef.current || brawlSettings.allowOthersToPlayAgain !== false;
        const watchAction = () => {
            resultsDismissRef.current = matchPhase;
            setResultsDismissedUi(true);
            window.PlatResults.hide();
            setHideVictoryModal(true);
            setFinishViewMode('god');
            toggleSpectator(myId, true, true);
            showToast("👁️ 已轉變為上帝模式，您可以繼續觀看其他玩家比賽");
        };
        window.PlatResults.show({
            accent: '#ffcc00', title: '大亂鬥結果', entries: entries,
            verdict: finishedPhase ? (iWon ? '🎉 你贏了！' : (iFinished ? '完賽了，名次如上！' : '比賽結束，結果如上')) : null,
            waitingText: !finishedPhase ? '比賽尚未結束，等待其他玩家完成…' : null,
            note: (finishedPhase && !canControl) ? '⏳ 等待房主決定下一局...' : null,
            buttons: finishedPhase
                ? (canControl ? ((typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.tourn)
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
                    ]) : [])
                : [{ id: 'watch', label: '👁️ 轉變為上帝模式（觀戰）', kind: 'primary' }],
            onAction: (id) => {
                if (id === 'watch') watchAction();
                else if (id === 'rematch') { window.PlatResults.hide(); handlePlayAgain(); }
                else if (id === 'lobby') { window.PlatResults.hide(); handleBackToLobby(); }
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
    });

    // --- 漂浮選單拖動邏輯 (通用) ---
    useEffect(() => {
        if (!isDraggingZoom && !isDraggingMode) return;
        const handleGlobalMove = (e) => {
            const margin = 20;
            const x = Math.max(margin, Math.min(window.innerWidth - margin, e.clientX));
            const y = Math.max(margin, Math.min(window.innerHeight - margin, e.clientY));
            if (isDraggingZoom) setZoomMenuPos({ x, y });
            else if (isDraggingMode) setModeMenuPos({ x, y });
        };
        const handleGlobalUp = () => {
            if (isDraggingZoom) {
                setIsDraggingZoom(false);
                wasZoomDragged.current = true;
                setTimeout(() => wasZoomDragged.current = false, 200);
            }
            if (isDraggingMode) {
                setIsDraggingMode(false);
                wasModeDragged.current = true;
                setTimeout(() => wasModeDragged.current = false, 200);
            }
            if (zoomDragTimer.current) clearTimeout(zoomDragTimer.current);
            if (modeDragTimer.current) clearTimeout(modeDragTimer.current);
        };
        window.addEventListener('pointermove', handleGlobalMove);
        window.addEventListener('pointerup', handleGlobalUp);
        return () => {
            window.removeEventListener('pointermove', handleGlobalMove);
            window.removeEventListener('pointerup', handleGlobalUp);
        };
    }, [isDraggingZoom, isDraggingMode]);

    const handleZoomPointerDown = (e) => {
        zoomDragTimer.current = setTimeout(() => {
            setIsDraggingZoom(true);
            setZoomMenuOpen(false);
            setZoomMenuPos({ x: e.clientX, y: e.clientY });
        }, 500);
    };
    const handleModePointerDown = (e) => {
        modeDragTimer.current = setTimeout(() => {
            setIsDraggingMode(true);
            setModeSubOpen(false);
            setModeMenuPos({ x: e.clientX, y: e.clientY });
        }, 500);
    };
    const handleMenuPointerUpGlobal = () => {
        if (zoomDragTimer.current) { clearTimeout(zoomDragTimer.current); zoomDragTimer.current = null; }
        if (modeDragTimer.current) { clearTimeout(modeDragTimer.current); modeDragTimer.current = null; }
        setIsDraggingZoom(false);
        setIsDraggingMode(false);
    };

    // （2026-10-18 使用者指示：準備只是打勾，不自動開賽——一律等房主按「開始比賽」才倒數）

    useEffect(() => {
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



    useEffect(() => { if (selectedChar && completedChars.has(selectedChar)) setSelectedChar(null); }, [completedChars, selectedChar]);

    useEffect(() => {
        if (screen !== 'game' || isSpectator) return;
        const handleKeyDown = (e) => {
            if (interactionMode >= 2 || isAutoFillingRef.current || matchPhase !== 'playing') return;
            const key = e.key.toUpperCase();
            const origIdx = cSizeDef.chars.indexOf(key);
            if (origIdx !== -1) {
                const mappedKey = keyMapping[origIdx];
                if (!completedChars.has(mappedKey)) setSelectedChar(prev => prev === mappedKey ? null : mappedKey);
            } else if (e.key === 'q' || e.key === 'Q') toggleInteractionMode();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [screen, cSizeDef.chars, interactionMode, completedChars, matchPhase, isSpectator, keyMapping]);

    const getPlayerColor = (uid) => {
        const p = playersList.find(p => p.id === uid);
        if (!p) return COLORS[11];
        const isOnline = engineRef.current === 'none' || p.id === myId || (isHostRef.current ? connsRef.current.some(c => (c.uid === p.id || c.peer === p.id) && c.open) : connRef.current && connRef.current.open);
        return isOnline ? p.color : '#94a3b8';
    };

    const myCurrentColor = getPlayerColor(myId);
    const _mePlayer = playersList.find(p => p.id === myId);
    myNameRef.current = _mePlayer ? _mePlayer.name : "";
    myColorRef.current = myCurrentColor;

    useEffect(() => { zoomLevelRef.current = zoomLevel; pz().setRaw(zoomLevel); }, [zoomLevel]);
    useEffect(() => { zoomModeIdxRef.current = zoomModeIdx; }, [zoomModeIdx]);

    // 同步本地觀戰狀態與伺服器列表中的身分
    useEffect(() => {
        const me = playersList.find(p => p.id === myId);
        if (me && me.isSpectator !== isSpectator) {
            setIsSpectator(me.isSpectator);
        }
    }, [playersList, myId]);


    useEffect(function () { stateRef.current = { ...stateRef.current, cells, localCells, levelData, startTime, sizeId, diffId, strokes, isBrawlMode, brawlWinners, brawlSettings, winner, matchPhase, matchEndTime: (stateRef.current.matchEndTime), countdownTarget, keyMapping, unopenedGifts, myWeapons, ghostHints, finishViewMode }; }, [cells, localCells, levelData, startTime, sizeId, diffId, strokes, isBrawlMode, brawlWinners, brawlSettings, winner, matchPhase, countdownTarget, keyMapping, unopenedGifts, myWeapons, ghostHints, finishViewMode]);

    // 🏁 我完賽 → 自動轉上帝模式（使用者 2026-10-28）：不用按鈕、不怕成績卡關掉就打不開；每場只自動切一次，之後手動切回「我的版面」不再強迫
    const autoGodRef = useRef(false);
    const matchTokenRef = useRef(null); // 對局世代代幣：房主每開新局鑄一個、隨每則 SYNC 廣播；收到代幣不符的 SYNC＝上一局遲到訊息，丟棄（原本 sessionId 從未賦值、世代守衛是死碼，稽核修）
    useEffect(() => {
        if (!isBrawlMode || finishViewMode !== 'my' || autoGodRef.current) return;
        if (!brawlWinners.some(w => w.id === myId)) return;
        autoGodRef.current = true;
        setFinishViewMode('god');
        toggleSpectator(myId, true, true);
    }, [brawlWinners, isBrawlMode, finishViewMode]);

    // 連線超時處理 (v3.8.14)
    useEffect(() => {
        let timer;
        if (isConnecting) {
            timer = setTimeout(() => {
                setShowCancelButton(true);
            }, 20000);
        } else {
            setShowCancelButton(false);
            setConnectionStatus("");
        }
        return () => clearTimeout(timer);
    }, [isConnecting]);

    const cancelConnection = () => {
        if (peerRef.current) {
            try { peerRef.current.destroy(); } catch (e) { }
            peerRef.current = null;
        }
        setIsConnecting(false);
        setScreen('home');
        showToast("已取消連線嘗試");
    };

    // 新增：多人模式分層自動同步機制 (v3.8.13)
    useEffect(() => {
        if (!isHost || engineRef.current !== 'peerjs') return;
        const interval = setInterval(() => {
            // 每 tick 重新驗證仍在連線模式：exit() 後 isHost/matchPhase 可能不變、effect 不會 cleanup，
            // 不擋下會變成殭屍廣播——切換到另一款遊戲後持續把舊名單蓋過去（五戰數獨→數橋來賓閃爍根因）
            if (!isHostRef.current || engineRef.current !== 'peerjs') return;
            const list = playersListRef.current;
            const phase = stateRef.current.matchPhase;

            // 1. 廣播最新名單 (包含在線燈號狀態)
            connsRef.current.forEach(c => {
                if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: list });
            });

            // 2. 遊戲中進行完整狀態 Heartbeat (補償掉包) (v3.8.32: 排除個人狀態以防覆蓋客端進度)
            if (phase === 'playing') {
                // 依照使用者要求，每 3 秒心跳僅檢查連線狀態，不再強制夾帶盤面覆寫客端進度 (v3.9.10)
                connsRef.current.forEach(c => {
                    if (c.open) c.send({ type: 'HEARTBEAT_PING', timestamp: Date.now() });
                });
            }
        }, matchPhase === 'waiting' ? 1000 : 3000);

        return () => clearInterval(interval);
    }, [isHost, matchPhase]);

    const conflictCellIds = useMemo(() => {
        const conflicts = new Set();
        const grid = Array(cSizeDef.size).fill(null).map(() => Array(cSizeDef.size).fill(null));
        activeCells.forEach(c => { if (c.value && c.y < cSizeDef.size && c.x < cSizeDef.size) grid[c.y][c.x] = c; }); // 邊界守衛：外來/殘檔格子越界只略過，渲染永不因資料形狀崩潰

        for (let i = 0; i < cSizeDef.size; i++) {
            const rowSeen = {}; const colSeen = {};
            for (let j = 0; j < cSizeDef.size; j++) {
                let cr = grid[i][j]; if (cr) { if (rowSeen[cr.value]) { conflicts.add(cr.id); conflicts.add(rowSeen[cr.value].id); } else rowSeen[cr.value] = cr; }
                let cc = grid[j][i]; if (cc) { if (colSeen[cc.value]) { conflicts.add(cc.id); conflicts.add(colSeen[cc.value].id); } else colSeen[cc.value] = cc; }
            }
        }
        for (let by = 0; by < cSizeDef.size; by += cSizeDef.boxH) {
            for (let bx = 0; bx < cSizeDef.size; bx += cSizeDef.boxW) {
                const boxSeen = {};
                for (let dy = 0; dy < cSizeDef.boxH; dy++) {
                    for (let dx = 0; dx < cSizeDef.boxW; dx++) {
                        let cb = grid[by + dy][bx + dx];
                        if (cb) { if (boxSeen[cb.value]) { conflicts.add(cb.id); conflicts.add(boxSeen[cb.value].id); } else boxSeen[cb.value] = cb; }
                    }
                }
            }
        }
        return conflicts;
    }, [activeCells, cSizeDef]);

    const completedChars = useMemo(() => {
        const counts = {};
        activeCells.forEach(c => {
            if (c.value !== null && !conflictCellIds.has(c.id)) {
                counts[c.value] = (counts[c.value] || 0) + 1;
            }
        });
        const completed = new Set();
        if (cSizeDef && cSizeDef.chars) {
            for (const char of cSizeDef.chars) {
                if (counts[char] >= cSizeDef.size) completed.add(char);
            }
        }
        return completed;
    }, [activeCells, cSizeDef, conflictCellIds]);


    const highlightZones = useMemo(() => {
        const zones = new Set();
        if (selectedChar === null || interactionMode >= 2) return zones;
        activeCells.forEach(c => {
            if (c.value === selectedChar) {
                activeCells.forEach(target => {
                    if (target.x === c.x || target.y === c.y || target.boxId === c.boxId) zones.add(target.id);
                });
            }
        });
        return zones;
    }, [activeCells, selectedChar, interactionMode]);

    const totalEmpty = useMemo(() => {
        const targetCells = isBrawlMode ? localCells : cells;
        if (!targetCells || targetCells.length === 0) return 1;
        return targetCells.filter(c => !c.isGiven).length || 1;
    }, [localCells, cells]);

    const playerProgress = useMemo(() => {
        if (isBrawlMode) return [];
        const counts = {};
        cells.forEach(c => {
            if (!c.isGiven && c.value !== null && c.owner) counts[c.owner] = (counts[c.owner] || 0) + 1;
        });
        return Object.entries(counts).map(([uid, count]) => ({ uid, color: getPlayerColor(uid), pct: Math.round((count / totalEmpty) * 100) }));
    }, [cells, totalEmpty, playersList, isBrawlMode]);

    // 為幽靈競速模式建立所有人的獨立進度
    const ghostProgress = useMemo(() => {
        if (!isBrawlMode) return {};
        const counts = {};
        playersList.forEach(p => counts[p.id] = 0);
        Object.values(ghostHints).forEach(cellHints => {
            Object.keys(cellHints).forEach(uid => {
                if (counts[uid] !== undefined) counts[uid]++;
            });
        });
        // 自己精確的進度 (v3.13.3 移除衝突檢查，避免透過進度條洩漏答案)
        const myAccurateCount = localCells.filter(c => !c.isGiven && c.value !== null).length;
        counts[myId] = Math.max(counts[myId] || 0, myAccurateCount);

        const result = {};
        Object.keys(counts).forEach(uid => {
            result[uid] = totalEmpty > 0 ? Math.min(100, Math.round((counts[uid] / totalEmpty) * 100)) : 0;
        });
        return result;
    }, [ghostHints, playersList, localCells, conflictCellIds, totalEmpty, myId]);

    // 區域完成判斷與禮物發送
    useEffect(() => {
        if (!isBrawlMode || isGenerating || !localCells.length || isSpectator || matchPhase !== 'playing') return;
        const solution = solutionGridRef.current;
        if (!solution) return;

        let newComps = 0;
        const s = cSizeDef.size;
        const chars = cSizeDef.chars;

        for (let i = 0; i < s; i++) {
            if (s !== 4) { // 4x4 模式不發送行列宮的禮物
                if (!completedRegionsRef.current.has(`R${i}`)) {
                    const rowCells = localCells.filter(c => c.y === i);
                    if (rowCells.length === s && rowCells.every(c => c.value === (solution[c.y] || [])[c.x])) {
                        completedRegionsRef.current.add(`R${i}`);
                        if (!rowCells.every(c => c.isGiven)) newComps++;
                    }
                }
                if (!completedRegionsRef.current.has(`C${i}`)) {
                    const colCells = localCells.filter(c => c.x === i);
                    if (colCells.length === s && colCells.every(c => c.value === (solution[c.y] || [])[c.x])) {
                        completedRegionsRef.current.add(`C${i}`);
                        if (!colCells.every(c => c.isGiven)) newComps++;
                    }
                }
                if (!completedRegionsRef.current.has(`B${i}`)) {
                    const boxCells = localCells.filter(c => c.boxId === i);
                    if (boxCells.length === s && boxCells.every(c => c.value === (solution[c.y] || [])[c.x])) {
                        completedRegionsRef.current.add(`B${i}`);
                        if (!boxCells.every(c => c.isGiven)) newComps++;
                    }
                }
            }
        }

        chars.forEach((char) => {
            if (!completedRegionsRef.current.has(`N${char}`)) {
                const numCells = localCells.filter(c => c.value === char);
                if (numCells.length === s && numCells.every(c => c.value === (solution[c.y] || [])[c.x])) {
                    completedRegionsRef.current.add(`N${char}`);
                    if (!numCells.every(c => c.isGiven)) newComps++;
                }
            }
        });

        if (newComps > 0 && stateRef.current.brawlSettings.allowGifts !== false) {
            // 禮物計量制（使用者定案）：每完成一個行/列/宮/數字累積 0.5 個禮物，湊滿 1 個才送出
            // （36 次完成 × 0.5 ＝ 一場最多 18 個禮物）；暫時沒有較弱的對手可送時，額度存著下次再湊
            giftCreditRef.current += newComps * 0.5;
            while (giftCreditRef.current >= 1) {
                const winnersIds = stateRef.current.brawlWinners.map(w => w.id);
                const validPlayers = playersList.filter(p => !p.isSpectator && !winnersIds.includes(p.id) && p.id !== myId);

                // 計算自己的有效分數（正確格數 + 未拆禮物數）
                const myEffectiveScore = (ghostProgress[myId] || 0) +
                    (stateRef.current.unopenedGifts[myId] ? stateRef.current.unopenedGifts[myId].length : 0);

                // 只送給比自己弱（有效分數更低）的玩家
                const weakerPlayers = validPlayers.filter(p => {
                    const pScore = (ghostProgress[p.id] || 0) +
                        (stateRef.current.unopenedGifts[p.id] ? stateRef.current.unopenedGifts[p.id].length : 0);
                    return pScore < myEffectiveScore;
                });

                if (weakerPlayers.length === 0) break; // 沒有比自己弱的人：這 1 個先存著（額度不扣），等有對象再送

                // 加權隨機：差距越大機率越高
                const weights = weakerPlayers.map(p => {
                    const pScore = (ghostProgress[p.id] || 0) +
                        (stateRef.current.unopenedGifts[p.id] ? stateRef.current.unopenedGifts[p.id].length : 0);
                    return Math.sqrt(myEffectiveScore - pScore + 1);
                });
                const totalWeight = weights.reduce((a, b) => a + b, 0);
                let rand = Math.random() * totalWeight;
                let targetUid = weakerPlayers[weakerPlayers.length - 1].id;
                for (let i = 0; i < weakerPlayers.length; i++) {
                    rand -= weights[i];
                    if (rand <= 0) { targetUid = weakerPlayers[i].id; break; }
                }

                const gid = Math.random().toString(36).substring(2, 10);
                const msg = { type: 'RECEIVE_GIFT', targetUid, senderUid: myId, id: gid, timestamp: Date.now() };

                if (engineRef.current === 'peerjs') {
                    if (isHostRef.current) connsRef.current.forEach(c => c.send(msg));
                    else if (connRef.current) connRef.current.send(msg);
                    setUnopenedGifts(prev => {
                        const q = prev[targetUid] || [];
                        return { ...prev, [targetUid]: [...q, myId] };
                    });
                }
                giftCreditRef.current -= 1; // 送出 1 個，扣 1 額度（送出動作已完成；非連線模式不會進大亂鬥，這裡照扣避免迴圈卡死）
                try { if (window.PlatFly) PlatFly.fly(PlatFly.byUid('sudoku', myId), PlatFly.byUid('sudoku', targetUid), '🎁'); } catch (e) {} // H3 禮物 Fly（純顯示層）
            }
        }
    }, [localCells, isGenerating, cSizeDef.size, cSizeDef.chars, ghostHints, isSpectator, matchPhase, conflictCellIds, ghostProgress, playersList, brawlWinners]);

    // === 里程碑偵測：自己每跨過 5% 就廣播給主機分配道具（逐格補報、不跳過） ===
    useEffect(() => {
        if (!isBrawlMode || isSpectator || matchPhase !== 'playing' || !isMultiplayer) return;
        if (totalEmpty === 0) return;

        // 計算自己的有效完成率（使用 ghostProgress 的自身值，最精確）
        // 注意：ghostProgress[myId] 本身已經是「百分比」（0–100），必須先換回格數才能加未拆禮物再除 totalEmpty。
        // 舊式直接把百分比再除一次 totalEmpty，等於進度被放大約 (100/totalEmpty) 倍——里程碑在真實進度約 45% 時
        // 就全部報完，後半場再也跨不到任何一格：只剩自己時什麼都拿不到（2026-11-01 使用者實機回報的病根）。
        const myCorrectCells = Math.round(((ghostProgress[myId] || 0) / 100) * totalEmpty);
        const myGifts = (stateRef.current.unopenedGifts[myId] || []).length;
        const myEffectivePct = Math.min(99, Math.floor(((myCorrectCells + myGifts) / totalEmpty) * 100));

        // 目前應達到的里程碑級別（每 5% 一個，使用者定案；原每 10%）
        const currentMilestone = Math.floor(myEffectivePct / 5);

        if (currentMilestone > lastMilestoneRef.current) {
            // 逐格補報（使用者定案：里程碑不跳過）：一次暴衝跨過好幾個 5% 時，每一格各送一則給主機、各觸發一次發放
            for (let band = lastMilestoneRef.current + 1; band <= currentMilestone; band++) {
                const msg = {
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

    useEffect(() => {
        if (!activeCells || activeCells.length === 0 || isGenerating || winner || matchPhase !== 'playing' || isSpectator) return;
        const isFull = activeCells.every(c => c.value !== null);
        const hasNoConflicts = conflictCellIds.size === 0;

        if (isFull && hasNoConflicts) {
            if (isBrawlMode) {
                if (!isWinnerDeclaredRef.current) {
                    isWinnerDeclaredRef.current = true;
                    const finishTime = Date.now();
                    const isBrawl = stateRef.current.isBrawlMode;
                    setIsWon(true);
                    setEndTime(finishTime);
                    setHideVictoryModal(false);
                    if (!isBrawl) { setMatchPhase('finished'); }
                    else {
                        setIsSpectator(true);
                        showToast("🏁 恭喜完成！已進入觀戰模式，觀察對手中...");
                    }

                    const me = playersList.find(p => p.id === myId);
                    const winInfo = { id: myId, name: me ? me.name : "玩家", color: me ? me.color : COLORS[0], time: formatTime(Math.floor((finishTime - (matchStartTime || startTime)) / 1000)), isBrawl };
                    lastWinInfoRef.current = winInfo; winResentRef.current = 0;
                    
                    // 客戶端先本地同步一份獲勝名單，增加即時感 (v3.10.4)
                    if (isBrawl) setBrawlWinners(prev => {
                        if (prev.some(w => w.id === myId)) return prev;
                        return [...prev, winInfo];
                    });

                    const msgId = Math.random().toString(36).substring(2, 10);
                    const msg = { type: 'GHOST_I_WON', senderUid: myId, id: msgId, time: finishTime, winInfo };

                    if (engineRef.current === 'peerjs') {
                        if (isHostRef.current) {
                            if (!isBrawl) { setWinner(winInfo); connsRef.current.forEach(c => c.send({ type: 'GHOST_WINNER', winner: winInfo })); }
                            else if (handleBrawlWinRef.current) handleBrawlWinRef.current(winInfo);
                        } else if (connRef.current) connRef.current.send(msg);
                    }
                }
            } else {
                if (!isWon) { setIsWon(true); setEndTime(Date.now()); setHideVictoryModal(false); setMatchPhase('finished'); }
            }
        } else {
            if (isWon) { setIsWon(false); setEndTime(null); setMatchPhase('playing'); }
        }
    }, [activeCells, conflictCellIds.size, isWon, isGenerating, winner, matchStartTime, startTime, playersList, myId, matchPhase, isSpectator]);

    // 音效：完成題目（與數橋同款引擎/音色）
    useEffect(() => { if (isWon) { try { platAudio().play('complete'); } catch (e) {} } }, [isWon]); // 個人完賽＝complete（PlatAudio，v1.64.0）
    useEffect(() => { if (winner && winner.id === myId) { try { platAudio().play('win'); } catch (e) {} } }, [winner]); // 奪冠（大亂鬥/合作勝者是我）＝win
    // 音效：倒數每秒嗶聲（GO 在倒數 effect 轉 playing 時播）
    // 倒數音效：新規格不播（寧缺勿濫，v1.64.0 起移除）

    // 觸控縮放
    useEffect(function () {
        if (screen !== 'game') return; const el = zoomContainerRef.current; if (!el) return; let touchStartY = null;
        const handleTouchStart = (e) => { if (e.touches.length === 1) touchStartY = e.touches[0].clientY; };
        const handleTouchMove = (e) => {
            if (interactionMode >= 2 || isSpectator) return;
            if (e.touches.length === 2) {
                e.preventDefault(); const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                if (lastPinchDist.current) {
                    const delta = dist - lastPinchDist.current; let newZoom = pz().set(zoomLevelRef.current + delta * 0.005, [0.4, 3.5]);
                    if (svgW * newZoom > MAX_SAFE_DIMENSION || svgH * newZoom > MAX_SAFE_DIMENSION) newZoom = Math.min(MAX_SAFE_DIMENSION / svgW, MAX_SAFE_DIMENSION / svgH);
                    zoomLevelRef.current = newZoom; if (svgRef.current) { svgRef.current.style.width = `${svgW * newZoom}px`; svgRef.current.style.height = `${svgH * newZoom}px`; }
                    if (zoomModeIdxRef.current !== 0) { setZoomModeIdx(0); zoomModeIdxRef.current = 0; }
                    showZoomIndicator(newZoom);
                }
                lastPinchDist.current = dist;
            } else if (e.touches.length === 1 && touchStartY !== null) {
                if (Math.abs(e.touches[0].clientY - touchStartY) > 30 && !isHeaderCollapsed) setIsHeaderCollapsed(true);
            }
        };
        const handleTouchEnd = () => { lastPinchDist.current = null; touchStartY = null; if (zoomLevel !== zoomLevelRef.current) setZoomLevel(zoomLevelRef.current); };
        const handleWheel = (e) => { if (interactionMode >= 2 || isSpectator) return; if (Math.abs(e.deltaY) > 10 && !isHeaderCollapsed) setIsHeaderCollapsed(true); if (e.ctrlKey && zoomModeIdxRef.current !== 0) { setZoomModeIdx(0); zoomModeIdxRef.current = 0; } };
        el.addEventListener('touchstart', handleTouchStart, { passive: true }); el.addEventListener('touchmove', handleTouchMove, { passive: false }); el.addEventListener('touchend', handleTouchEnd); el.addEventListener('touchcancel', handleTouchEnd); el.addEventListener('wheel', handleWheel, { passive: true });
        return () => { el.removeEventListener('touchstart', handleTouchStart); el.removeEventListener('touchmove', handleTouchMove); el.removeEventListener('touchend', handleTouchEnd); el.removeEventListener('touchcancel', handleTouchEnd); el.removeEventListener('wheel', handleWheel); };
    }, [screen, isHeaderCollapsed, interactionMode, svgW, svgH, zoomLevel, isSpectator]);

    // 觸控筆同點連點防護：不認 touch-action 的舊版 iOS Safari 會把「同位置的快速第二下點按」配對成雙擊縮放手勢、
    // 整下被仲裁吃掉（手指落點較飄移反而不會被配對——使用者實機回報：筆連點四下，第 2、4 下連水波紋都沒有）。
    // 在棋盤 svg 本體以非被動 touchend preventDefault 關掉雙擊配對（FastClick 世代的標準解法）：
    // 只掛 svg、不碰數字鍵（走 click）與頁面捲動（touchend 在捲動之後才發生，不擋捲動與縮放手勢）。
    useEffect(function () {
        if (screen !== 'game') return; const svg = svgRef.current; if (!svg) return;
        const killDblTap = (e) => { if (e.cancelable) e.preventDefault(); };
        svg.addEventListener('touchend', killDblTap, { passive: false });
        return () => { svg.removeEventListener('touchend', killDblTap); };
    }, [screen]);

    useEffect(function () {
        if (ripples.length === 0) return;
        const timer = setTimeout(() => { const now = Date.now(); setRipples(prev => prev.filter(r => now - r.timestamp < 1000)); }, 1000);
        return () => clearTimeout(timer);
    }, [ripples]);

    // 霧化遮罩倒數 ticker：每 500ms 觸發一次重渲染以更新倒數秒數
    useEffect(() => {
        if (Object.keys(foggedBoxes).length === 0) return;
        const ticker = setInterval(() => {
            const now = Date.now();
            setFoggedBoxes(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(k => { if (next[k] <= now) { delete next[k]; changed = true; } });
                return changed ? next : prev; // 若有到期的才更新 state
            });
        }, 500);
        return () => clearInterval(ticker);
    }, [foggedBoxes]);

    // ❄️ 水球凍結：被凍結宮格內的格子暫時不能填、不能清（不再只靠 emoji 遮數字）
    const frozenToastAtRef = useRef(0);
    const cellBoxIdOf = (cellId) => {
        const parts = String(cellId).split('-');
        const cx = parseInt(parts[0], 10), cy = parseInt(parts[1], 10);
        if (isNaN(cx) || isNaN(cy)) return -1;
        return Math.floor(cy / cSizeDef.boxH) * (cSizeDef.size / cSizeDef.boxW) + Math.floor(cx / cSizeDef.boxW);
    };
    const isCellFrozen = (cellId) => {
        const exp = foggedBoxes[cellBoxIdOf(cellId)];
        return !!exp && exp > Date.now();
    };
    const frozenToast = (what) => {
        const now = Date.now();
        if (now - frozenToastAtRef.current < 1500) return;
        frozenToastAtRef.current = now;
        showToast('❄️ 這個宮格被水球凍結了，暫時不能' + what + '！');
    };

    // 清除特效清理 ticker：每 500ms 清理超過 1 秒的 erasingCells
    useEffect(() => {
        if (Object.keys(erasingCells).length === 0) return;
        const ticker = setInterval(() => {
            const now = Date.now();
            setErasingCells(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(k => { if (now - next[k].timestamp > 1000) { delete next[k]; changed = true; } });
                return changed ? next : prev;
            });
        }, 500);
        return () => clearInterval(ticker);
    }, [erasingCells]);

    const revealSystemCellRef = useRef();
    revealSystemCellRef.current = (cellId) => {
        const grid = solutionGridRef.current;
        const targetCell = stateRef.current.localCells.find(c => c.id === cellId);
        if (!grid || !targetCell) return;
        
        const ansValue = grid[targetCell.y] ? grid[targetCell.y][targetCell.x] : null;
        if (ansValue === null || ansValue === undefined) return;

        setLocalCells(prev => {
            const nextCells = [...prev];
            const targetIdx = nextCells.findIndex(c => c.id === cellId);
            if (targetIdx === -1) return prev;
            const target = nextCells[targetIdx];

            nextCells[targetIdx] = { ...target, value: ansValue, drafts: [], isSystemRevealed: true, owner: null };

            for (let i = 0; i < nextCells.length; i++) {
                if (i !== targetIdx) {
                    const c = nextCells[i];
                    if (c.x === target.x || c.y === target.y || c.boxId === target.boxId) {
                        if (c.drafts.includes(ansValue)) {
                            nextCells[i] = { ...c, drafts: c.drafts.filter(d => d !== ansValue) };
                        }
                    }
                }
            }
            stateRef.current.localCells = nextCells;
            return nextCells;
        });

        const me = playersListRef.current.find(p => p.id === myId);
        const msg = { type: 'GHOST_SOLVED', uid: myId, color: me ? me.color : myColorRef.current, cellId, id: Math.random().toString(36).substring(2, 11), value: ansValue };
        if (engineRef.current === 'peerjs') {
            if (isHostRef.current) connsRef.current.forEach(c => c.send(msg)); else if (connRef.current) connRef.current.send(msg);
        }
    };

    // 集滿 3 個未拆禮物 → 自動拆開（使用者定案：防囤禮物到最後一次全拆逆轉；拆禮物的使用方式本來就是一次全拆）
    // 注意：禮物入列的實際路徑是訊息 dispatch 兩個分支內聯的 setUnopenedGifts，入列後都要呼叫本函式檢查
    const maybeAutoOpenGift = (targetUid) => {
        if (targetUid !== myId || isSpectator) return;
        if (stateRef.current.matchPhase !== 'playing') return;
        const q = (stateRef.current.unopenedGifts[myId] || []).length + 1;
        if (q >= 3) setTimeout(() => { showToast('🎁 禮物集滿 3 個，自動拆開！'); try { handleOpenGift(); } catch (e) {} }, 900);
    };
    const handleReceiveGiftRef = useRef();
    handleReceiveGiftRef.current = (ev) => {
        if (isSpectator) return;
        // 將收到的禮物的 senderUid 放入目標的 unopenedGifts 佇列
        setUnopenedGifts(prev => {
            const currentQueue = prev[ev.targetUid] || [];
            return { ...prev, [ev.targetUid]: [...currentQueue, ev.senderUid || 'system'] };
        });
        maybeAutoOpenGift(ev.targetUid);
    };

    const triggerRipple = (pt) => {
        const msg = { type: 'RIPPLE', x: pt.x, y: pt.y, color: myColorRef.current || COLORS[0], id: Math.random().toString(36).substring(2, 10) };
        if (engineRef.current === 'peerjs') {
            if (isHostRef.current) connsRef.current.forEach(c => c.send(msg));
            else if (connRef.current) connRef.current.send(msg);
        }
    };

    const triggerCounterAttack = (targetUid) => {
        const msg = { type: 'GIFT_COUNTER_ATTACK', targetUid, id: Math.random().toString(36).substring(2, 10), timestamp: Date.now() };
        if (engineRef.current === 'peerjs') {
            if (isHostRef.current) connsRef.current.forEach(c => c.send(msg));
            else if (connRef.current) connRef.current.send(msg);
        }
    };

    handleReceiveCounterAttackRef.current = () => {
        if (isSpectator) return;
        if (stateRef.current.matchPhase !== 'playing' || stateRef.current.brawlWinners.some(w => w.id === myId)) return; // 非對局中/已完賽不受理：遲到訊息不可污染下一局或已完成的盤面（稽核修）
        showToast("💥 遭到反擊！數字按鍵順序大亂！");
        setKeyMapping(prev => {
            const newMap = [...prev];
            if (newMap.length >= 2) {
                let idx1 = Math.floor(Math.random() * newMap.length);
                let idx2 = Math.floor(Math.random() * newMap.length);
                while (idx1 === idx2) idx2 = Math.floor(Math.random() * newMap.length);
                const temp = newMap[idx1];
                newMap[idx1] = newMap[idx2];
                newMap[idx2] = temp;

                // 記錄被打亂的數字
                scrambledCharsRef.current.add(newMap[idx1]);
                scrambledCharsRef.current.add(newMap[idx2]);

                // 觸發翻轉動畫
                setFlippedKeys([idx1, idx2]);
                setTimeout(() => setFlippedKeys([]), 600);
            }
            syncState({ keyMapping: newMap }, false);
            return newMap;
        });
    };


    // ================================================================
    // 道具系統：主機里程碑分配 + 接收道具 + 水球霧化 + 格子清除
    // ================================================================

    // 道具機率公式（使用者定案，兩款同形、保底統一 0.1）：禮物權重 = (1 − p)² + 保底（平方扶弱）；
    // 陷阱：先取 1 − p 再套同一個禮物公式 → 權重 = p² + 保底（越強越容易被打，分布明顯拉開）。抽選在候選集合內正規化；完賽者本來就被排除在候選之外。
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

    // 主機處理 MILESTONE_REACHED：依進度比例公式抽一位玩家獲得道具
    handleMilestoneRef.current = (ev) => {
        if (!isHostRef.current) return;
        if (stateRef.current.brawlSettings.allowGifts === false) return;

        if (stateRef.current.brawlSettings.allowWeapons === false) return;
        const delay = (stateRef.current.brawlSettings.weaponStartTime || 0) * 1000;
        if (Date.now() - stateRef.current.startTime < delay) return;

        const triggererUid = ev.uid;
        const triggererPct = ev.completionPct;

        // 找比觸發者有效分數更低的玩家（排除觀戰、已完成、觸發者本人）
        const winnersIds = stateRef.current.brawlWinners.map(w => w.id);
        const candidates = playersListRef.current.filter(p =>
            !p.isSpectator && !winnersIds.includes(p.id) && p.id !== triggererUid
        );

        // 權重分配：越弱勢的人權重越高 (v3.13.0 加強公平性)
        const ghostHintsData = stateRef.current.ghostHints || {};
        const totalEmp = stateRef.current.cells.filter(c => !c.isGiven).length || 1;
        const getEffPct = (uid) => {
            const corr = Object.values(ghostHintsData).filter(hints => hints && hints[uid]).length;
            const gifts = (stateRef.current.unopenedGifts[uid] || []).length;
            return Math.floor(((corr + gifts) / totalEmp) * 100);
        };

        // 所有人（除了已過關者）都是候選人
        const brawlCandidates = playersListRef.current.filter(p => !p.isSpectator && !winnersIds.includes(p.id));
        if (brawlCandidates.length === 0) return;

        const grantProgs = brawlCandidates.map(p => getEffPct(p.id));
        const grantWs = platProgWeights(grantProgs.map(p => p / 100), 'grant'); // 禮物權重 = (1 − p)² + 保底 0.1（平方扶弱）
        const candidateWeights = brawlCandidates.map((p, i) => ({ id: p.id, weight: grantWs[i] }));

        const totalWeight = candidateWeights.reduce((sum, w) => sum + w.weight, 0);
        
        // 根據人數決定發放道具數量 (1~2 個)
        const weaponsToGive = brawlCandidates.length >= 3 ? 2 : 1;

        // 只剩最後一位：改發系統禮物給他（不發武器——沒有對手可打），拆開揭露正確格加速完賽
        if (brawlCandidates.length === 1) {
            const soleId = brawlCandidates[0].id;
            for (let i = 0; i < weaponsToGive; i++) {
                const gMsg = { type: 'RECEIVE_GIFT', targetUid: soleId, senderUid: 'system', id: Math.random().toString(36).substring(2, 10), timestamp: Date.now() };
                if (engineRef.current === 'peerjs') {
                    connsRef.current.forEach(c => c.send(gMsg));
                    if (soleId === myId && handleReceiveGiftRef.current) handleReceiveGiftRef.current(gMsg);
                }
            }
            return;
        }

        for (let i = 0; i < weaponsToGive; i++) {
            let random = Math.random() * totalWeight;
            let selectedId = null;
            for (let cw of candidateWeights) {
                random -= cw.weight;
                if (random <= 0) {
                    selectedId = cw.id;
                    break;
                }
            }
            if (!selectedId) selectedId = candidateWeights[0].id;

            // 準備道具訊息
            const weaponType = Math.random() < 0.5 ? 'balloon' : 'eraser';
            const wid = Math.random().toString(36).substring(2, 10);
            const wMsg = { type: 'RECEIVE_WEAPON', targetUid: selectedId, weaponType, id: wid, timestamp: Date.now() };

            // 廣播給所有人
            if (engineRef.current === 'peerjs') {
                connsRef.current.forEach(c => c.send(wMsg));
                // 自己也要接收（如果是主機自己落後）
                if (selectedId === myId && handleReceiveWeaponRef.current) {
                    handleReceiveWeaponRef.current(wMsg);
                }
                // 房主上帝日誌：方便測試 (v3.10.12)
                const targetName = playersListRef.current.find(p => p.id === selectedId)?.name || '玩家';
                if (isSpectator) showToast(`🛡️ 上帝偵測到里程碑：發送武器給 ${targetName}`);
            }
        }
    };


    // 接收道具：各項道具上限 3 個；集滿 3 個 → 自動連續發動並歸零（使用者定案，防囤積逆轉）
    const weaponAutoRef = useRef({});
    const launchWeaponRef = useRef(null);
    const autoFireWeapon = (weaponType) => {
        if (weaponAutoRef.current[weaponType]) return;
        if (stateRef.current.matchPhase !== 'playing' || isSpectator) return;
        if ((stateRef.current.myWeapons || []).filter(w => w === weaponType).length < 3) return; // 觸發檢查時未滿 3（例如玩家搶先手動用掉）就不發動
        weaponAutoRef.current[weaponType] = true;
        setMyWeapons(prev => {
            const next = [...prev];
            for (let i = 0; i < 3; i++) { const ix = next.indexOf(weaponType); if (ix === -1) break; next.splice(ix, 1); }
            stateRef.current.myWeapons = next;
            return next;
        });
        const weaponName = weaponType === 'balloon' ? '💧 水球' : '🧹 橡皮擦';
        showToast(`🎒 集滿 3 個 ${weaponName}，自動連續發動！`);
        try { platAudio().play('star'); } catch (e) {} // 集滿自動發動輕響（v1.65.5）
        let fired = 0;
        const step = () => {
            if (fired >= 3) { weaponAutoRef.current[weaponType] = false; return; }
            fired++;
            if (stateRef.current.matchPhase === 'playing' && launchWeaponRef.current) { try { launchWeaponRef.current(weaponType); } catch (e) {} } // 每發重新選目標；無對手時該發落空
            setTimeout(step, 550);
        };
        setTimeout(step, 400);
    };
    // 最後一位規則（使用者定案）：只剩我一人未完賽時，武器沒有對手可打——庫存全轉禮物、飛來的武器也直接轉禮物、
    // 房主里程碑改發系統禮物。禮物拆開直接揭露正確格，加速最後一位完賽，其他人不用乾等。
    const lastOneConvertedRef = useRef(false);
    const amLastPlayer = () => {
        if (isSpectator) return false;
        if (stateRef.current.brawlWinners.some(w => w.id === myId)) return false;
        const entrants = playersListRef.current.filter(p => !p.isSpectator);
        if (entrants.length < 2) return false; // 至少 2 位選手才有「最後一位」：房間頁遊戲被預載、名單只有房主一人時 remaining==1 會誤判（2026-11-05 實機回報；數橋 racers<2、地雷 entrants>1 本來就有這道守衛，數獨漏了）
        const remaining = entrants.filter(p => !stateRef.current.brawlWinners.some(w => w.id === p.id));
        return remaining.length === 1 && remaining[0].id === myId;
    };
    handleReceiveWeaponRef.current = (ev) => {
        if (ev.targetUid !== myId || isSpectator) return;
        if (stateRef.current.matchPhase !== 'playing') return; // 等待/倒數期收到的遲到道具不進背包（稽核修）
        try { platAudio().play('star'); } catch (e) {} // 獲得道具輕響（v1.65.5 孤兒裁示：三款統一 star）
        if (amLastPlayer()) { // 已是最後一位：武器入包前直接轉成系統禮物
            setUnopenedGifts(prev => ({ ...prev, [myId]: [...(prev[myId] || []), 'system'] }));
            showToast('🏁 只剩你一人，獲得的武器自動轉換成 🎁 禮物！');
            maybeAutoOpenGift(myId);
            return;
        }
        setMyWeapons(prev => {
            if (prev.filter(w => w === ev.weaponType).length >= 3) return prev; // 該項已有 3 個（自動發動排程中），多的不收
            const weaponName = ev.weaponType === 'balloon' ? '💧 水球' : '🧹 橡皮擦';
            showToast(`🎯 獲得道具：${weaponName}！點擊道具按鈕攻擊對手！`);
            return [...prev, ev.weaponType];
        });
        // 進包後檢查是否集滿 3（等 stateRef 同步後由 autoFireWeapon 覆核，未滿不發動）
        setTimeout(() => autoFireWeapon(ev.weaponType), 700);
    };

    // 收到水球霧化攻擊：隨機霧化自己的一個宮格 10 秒
    handleWeaponHitFogRef.current = (ev) => {
        const targetObj = playersListRef.current.find(p => p.id === ev.targetUid);
        const senderObj = playersListRef.current.find(p => p.id === ev.senderUid);
        
        if (ev.targetUid !== myId) {
            // 如果我是主機或觀戰者，顯示誰攻擊了誰 (v3.13.2)
            if ((isHostRef.current || isSpectator) && senderObj && targetObj) {
                showToast(`📢 ${senderObj.name} 向 ${targetObj.name} 扔了水球！`);
            }
            return;
        }
        if (isSpectator) return;
        if (stateRef.current.matchPhase !== 'playing' || stateRef.current.brawlWinners.some(w => w.id === myId)) return; // 霧效以絕對時間計：非對局中受理會滲進下一局開頭（稽核修）
        // 選一個隨機宮格（從有數字的格子中選）
        const totalBoxes = cSizeDef.size; // 9x9 有 9 個宮格 (boxId 0~8)
        const randomBoxId = Math.floor(Math.random() * totalBoxes);
        const expiry = Date.now() + 10000; // 10 秒
        setFoggedBoxes(prev => ({ ...prev, [randomBoxId]: expiry }));
        showToast(`💧 水球命中！一個宮格被凍結 10 秒，裡面的格子暫時不能動！`);
        // 10 秒後自動解除
        setTimeout(() => {
            setFoggedBoxes(prev => {
                const next = { ...prev };
                if (next[randomBoxId] === expiry) delete next[randomBoxId];
                return next;
            });
        }, 10000);
    };

    // 收到格子清除攻擊：清除自己隨機一格已填正確的格子
    handleWeaponHitEraseRef.current = (ev) => {
        const targetObj = playersListRef.current.find(p => p.id === ev.targetUid);
        const senderObj = playersListRef.current.find(p => p.id === ev.senderUid);

        if (ev.targetUid !== myId) {
            // 如果我是主機或觀戰者，顯示誰攻擊了誰 (v3.13.2)
            if ((isHostRef.current || isSpectator) && senderObj && targetObj) {
                showToast(`📢 ${senderObj.name} 正在清除 ${targetObj.name} 的格字！`);
            }
            return;
        }
        if (isSpectator) return;
        if (stateRef.current.matchPhase !== 'playing' || stateRef.current.brawlWinners.some(w => w.id === myId)) return; // 已完賽的盤面不可被遲到的橡皮擦擦格（稽核修）
        const solution = solutionGridRef.current;
        if (!solution) return;
        // 找所有已填正確、非預填、非系統揭露的格子
        const correctCells = stateRef.current.localCells.filter(c =>
            !c.isGiven && !c.isSystemRevealed && c.value !== null &&
            c.value === (solution[c.y] || [])[c.x]
        );
        if (correctCells.length === 0) {
            showToast(`🧹 橡皮擦沒有效果，你沒有可被清除的格子！`);
            return;
        }
        const target = correctCells[Math.floor(Math.random() * correctCells.length)];

        // 寫入 erasingCells 記錄發動特效
        setErasingCells(prev => ({
            ...prev,
            [target.id]: { value: target.value, timestamp: Date.now() }
        }));

        // 清除該格
        setLocalCells(prev => {
            const next = prev.map(c => c.id === target.id ? { ...c, value: null, drafts: [], owner: null } : c);
            stateRef.current.localCells = next;
            return next;
        });
        // 廣播給其他人這格退步了
        const me = playersListRef.current.find(p => p.id === myId);
        const ghostMsg = { type: 'GHOST_SOLVED', uid: myId, color: me ? me.color : myColorRef.current, cellId: target.id, value: null, id: Math.random().toString(36).substring(2, 11) };
        if (engineRef.current === 'peerjs') {
            if (isHostRef.current) connsRef.current.forEach(c => c.send(ghostMsg));
            else if (connRef.current) connRef.current.send(ghostMsg);
        }
        showToast(`🧹 一格被橡皮擦清除了！再想想看...`);
    };

    // 玩家主動使用道具：廣播攻擊
    // 發射一次武器（不扣背包）：自動選擇攻擊目標（優先打比自己強的）；回傳是否發射。手動使用與集滿 3 自動連發共用
    const launchWeapon = (weaponType) => {
        // 自動選擇攻擊目標（優先打比自己強的）
        const giftsData = stateRef.current.unopenedGifts || {};
        const hintsData = stateRef.current.ghostHints || {};
        const validPlayers = playersListRef.current.filter(p => !p.isSpectator && p.id !== myId && !stateRef.current.brawlWinners.some(w => w.id === p.id));

        if (validPlayers.length === 0) return false;

        // 攻擊目標：陷阱公式抽選（權重 = p² + 保底 0.1；進度口徑＝已解格數＋未拆禮物數，與進度條一致）
        const totalEmpW = (stateRef.current.cells || []).filter(c => !c.isGiven).length || 1;
        const foeProgs = validPlayers.map(p => (Object.values(hintsData).filter(h => h && h[p.id]).length + (giftsData[p.id] ? giftsData[p.id].length : 0)) / totalEmpW);
        const targetUid = platPickWeighted(validPlayers, platProgWeights(foeProgs, 'attack')).id;

        const hitType = weaponType === 'balloon' ? 'WEAPON_HIT_FOG' : 'WEAPON_HIT_ERASE';
        const wMsg = { type: hitType, targetUid, senderUid: myId, id: Math.random().toString(36).substring(2, 10), timestamp: Date.now() };

        const sObj = playersListRef.current.find(p => p.id === myId);
        const senderName = sObj ? sObj.name : '某人';

        if (engineRef.current === 'peerjs') {
            if (isHostRef.current) connsRef.current.forEach(c => c.send(wMsg));
            else if (connRef.current) connRef.current.send(wMsg);
            // 如果攻擊目標是主機自己
            if (targetUid === myId) {
                if (weaponType === 'balloon' && handleWeaponHitFogRef.current) handleWeaponHitFogRef.current(wMsg);
                else if (weaponType === 'eraser' && handleWeaponHitEraseRef.current) handleWeaponHitEraseRef.current(wMsg);
            }
        }

        const tObj = playersListRef.current.find(p => p.id === targetUid);
        const targetName = tObj ? tObj.name : '對手';
        const emoji = weaponType === 'balloon' ? '💧' : '🧹';
        showToast(`${emoji} 向 ${targetName} 發射了攻擊！`);
        return true;
    };
    launchWeaponRef.current = launchWeapon;

    // 手動使用武器：發射成功才扣 1 個（無對手時不消耗、給提示，比照舊行為）
    const handleUseWeapon = (weaponType) => {
        if (stateRef.current.matchPhase !== 'playing') return; // 發射端同守衛：等待/倒數期不可攻擊（稽核修）
        if (stateRef.current.myWeapons.indexOf(weaponType) === -1) return;
        if (!launchWeapon(weaponType)) { showToast("😅 目前沒有可以攻擊的對手"); return; }
        // 移除已使用的道具 (修正連續點擊問題：在更新回調中找 index)
        setMyWeapons(prev => {
            const next = [...prev];
            const realIdx = next.indexOf(weaponType);
            if (realIdx !== -1) {
                next.splice(realIdx, 1);
                stateRef.current.myWeapons = next;
            }
            return next;
        });
    };

    const handleOpenGift = () => {
        if (interactionMode >= 2 || matchPhase !== 'playing' || isSpectator) return;
        const myQueue = stateRef.current.unopenedGifts[myId] || [];
        if (myQueue.length === 0) return;

        const emptyCells = stateRef.current.localCells.filter(c => !c.isGiven && !c.isSystemRevealed && c.value === null);
        const incorrectCells = stateRef.current.localCells.filter(c => !c.isGiven && !c.isSystemRevealed && c.value !== null && solutionGridRef.current && c.value !== (solutionGridRef.current[c.y] || [])[c.x]);

        const giftsToOpenCount = Math.min(myQueue.length, emptyCells.length + incorrectCells.length);
        if (giftsToOpenCount === 0) {
            showToast("⚠️ 盤面已無可解鎖或錯誤的空格");
            return;
        }
        try { platAudio().play('gift'); } catch (e) {} // 禮物拆開落地＝gift（v1.64.2 覆蓋驗收補接：原僅數橋/地雷有接線）

        const giftsToOpen = myQueue.slice(0, giftsToOpenCount);
        let cellsToReveal = [];

        if (giftsToOpenCount <= emptyCells.length) {
            cellsToReveal = [...emptyCells].sort(() => 0.5 - Math.random()).slice(0, giftsToOpenCount);
        } else {
            cellsToReveal = [...emptyCells];
            const remaining = giftsToOpenCount - emptyCells.length;
            const shuffledIncorrect = [...incorrectCells].sort(() => 0.5 - Math.random());
            cellsToReveal.push(...shuffledIncorrect.slice(0, remaining));
        }

        const buttonEl = document.getElementById("btn-open-gift");
        const buttonRect = buttonEl ? buttonEl.getBoundingClientRect() : null;
        let counterAttackCount = 0;
        let newFlares = [];

        giftsToOpen.forEach((senderUid, index) => {
            const targetCell = cellsToReveal[index];
            revealSystemCellRef.current(targetCell.id);

            if (senderUid !== 'system') {
                setTimeout(() => { triggerCounterAttack(senderUid); }, index * 150);
                counterAttackCount++;
            }

            if (buttonRect) {
                const cellEl = document.getElementById(`cell-${targetCell.id}`);
                if (cellEl) {
                    const cellRect = cellEl.getBoundingClientRect();
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
            setFlares(prev => [...prev, ...newFlares]);
            setTimeout(() => {
                setFlares(prev => prev.filter(f => !newFlares.find(nf => nf.id === f.id)));
            }, 600);
        }

        if (counterAttackCount > 0) {
            showToast(`⚔️ 連續拆開 ${giftsToOpenCount} 個禮物！對敵人發動了 ${counterAttackCount} 次干擾反擊！`);
        } else {
            showToast(`🎁 連續拆開 ${giftsToOpenCount} 個系統禮物！獲得 ${giftsToOpenCount} 格提示！`);
        }

        for (let i = 0; i < giftsToOpenCount; i++) {
            const msg = { type: 'GIFT_OPENED', uid: myId, id: Math.random().toString(36).substring(2, 10), timestamp: Date.now() };
            if (engineRef.current === 'peerjs') {
                if (isHostRef.current) connsRef.current.forEach(c => c.send(msg));
                else if (connRef.current) connRef.current.send(msg);
            }
        }

        setUnopenedGifts(prev => {
            const q = prev[myId] || [];
            return { ...prev, [myId]: q.slice(giftsToOpenCount) };
        });
    };

    // 最後一位轉換：完賽名單一更新就檢查——只剩我時，手邊武器全數轉成系統禮物（湊滿 3 個照舊自動拆）
    const maybeConvertLastOne = () => {
        if (lastOneConvertedRef.current || !amLastPlayer()) return;
        if (stateRef.current.matchPhase !== 'playing') return;
        lastOneConvertedRef.current = true;
        const weapons = stateRef.current.myWeapons || [];
        if (!weapons.length) { showToast('🏁 只剩你一人！接下來的里程碑將改發 🎁 禮物給你'); return; }
        setMyWeapons([]);
        setUnopenedGifts(prev => ({ ...prev, [myId]: [...(prev[myId] || []), ...weapons.map(() => 'system')] }));
        showToast('🏁 只剩你一人！' + weapons.length + ' 件武器全部轉換成 🎁 禮物，加速完賽！');
        setTimeout(() => { if ((stateRef.current.unopenedGifts[myId] || []).length >= 3) { showToast('🎁 禮物集滿 3 個，自動拆開！'); try { handleOpenGift(); } catch (e) {} } }, 950);
    };
    useEffect(() => { maybeConvertLastOne(); }, [brawlWinners]);

    const syncState = (partial, shouldBroadcast = true, fromRemote = false) => {
        if (partial.matchToken) matchTokenRef.current = partial.matchToken;
        else if (isHostRef.current && partial.isGenerating === true) matchTokenRef.current = Math.random().toString(36).slice(2, 10); // 房主開新局鑄代幣
        if (partial.cells !== undefined) setCells(partial.cells);
        if (partial.localCells !== undefined) setLocalCells(partial.localCells);
        if (partial.levelData !== undefined) setLevelData(partial.levelData);
        if (partial.startTime !== undefined) { const stVal = fromRemote ? partial.startTime - platTimeOffset() : partial.startTime; setStartTime(stVal); setMatchStartTime(stVal); } // 遠端來的 startTime 是房主時鐘，須換算回本地時鐘（D-05）；否則兩台手機時鐘差會直接吃掉完賽時間（2026-11-04 實機：玩 10 分鐘顯示 00:51）
        if (partial.matchPhase !== undefined) setMatchPhase(partial.matchPhase);
        if (partial.matchEndTime !== undefined) stateRef.current.matchEndTime = partial.matchEndTime;
        if (partial.countdownTarget !== undefined) setCountdownTarget(partial.countdownTarget);

        if (partial.isGenerating !== undefined) {
            setIsGenerating(partial.isGenerating);
            if (partial.isGenerating) {
                setIsWon(false); setWinner(null); setEndTime(null); isWinnerDeclaredRef.current = false; setUnopenedGifts({});
                completedRegionsRef.current.clear(); scrambledCharsRef.current.clear(); setBrawlWinners([]);
                // 恢復大廳設定的觀戰狀態
                const me = playersListRef.current.find(p => p.id === myId);
                setIsSpectator(me ? !!me.isLobbySpectator : false);
            }
        }

        if (partial.isBrawlMode !== undefined) setIsBrawlMode(partial.isBrawlMode);
        if (partial.brawlWinners !== undefined) setBrawlWinners(partial.brawlWinners);
        if (partial.brawlSettings !== undefined) setBrawlSettings(partial.brawlSettings);
        if (partial.winner !== undefined) setWinner(partial.winner);
        if (partial.keyMapping !== undefined) setKeyMapping(partial.keyMapping);

        if (partial.solutionGrid !== undefined) {
            const parsedGrid = typeof partial.solutionGrid === 'string' ? JSON.parse(partial.solutionGrid) : partial.solutionGrid;
            solutionGridRef.current = parsedGrid;
            partial.solutionGrid = parsedGrid;
        }

        // 題目一致性修復：收到新題目時同步初始化個人棋盤 (v3.8.33)
        if (partial.levelData && (partial.isBrawlMode || stateRef.current.isBrawlMode)) {
            setLocalCells(JSON.parse(JSON.stringify(partial.cells || partial.levelData.cells)));
        }

        if (partial.sizeId !== undefined) {
            setSizeId(partial.sizeId);
            setKeyMapping((SIZES.find(s => s.id === partial.sizeId) || SIZES[1] || SIZES[0]).chars); // 未知 sizeId（跨版/損毀 SYNC）要有 fallback，不可裸解引用丟例外中斷整段 handler
        }
        if (partial.diffId !== undefined) setDiffId(partial.diffId);
        if (partial.strokes !== undefined) setStrokes(partial.strokes);
        if (partial.selectedChar !== undefined) setSelectedChar(partial.selectedChar);
        if (partial.isAutoFilling !== undefined) isAutoFillingRef.current = partial.isAutoFilling;

        const updatedState = { ...stateRef.current, ...partial };
        if (fromRemote && partial.startTime !== undefined) updatedState.startTime = partial.startTime - platTimeOffset(); // ref 鏡像也要本地時鐘版（武器延遲閘門讀 stateRef.startTime）
        stateRef.current = updatedState;

        if (shouldBroadcast && engineRef.current === 'peerjs') {
            const broadcastData = {};
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
            if (isHostRef.current) connsRef.current.forEach(c => c.send({ type: 'SYNC', data: broadcastData }));
            else if (connRef.current) connRef.current.send({ type: 'SYNC', data: broadcastData });
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




    const toggleSpectator = (targetId, isTemp = false, forceState = null) => {
        if (isHostRef.current) {
            const nList = playersListRef.current.map(p => {
                if (p.id === targetId) {
                    const newState = (forceState !== null) ? forceState : !p.isSpectator;
                    return { ...p, isSpectator: newState, isLobbySpectator: isTemp ? p.isLobbySpectator : newState };
                }
                return p;
            });
            setPlayersList(nList);
            connsRef.current.forEach(c => { if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: nList }); });
            if (targetId === myId) {
                const me = nList.find(p => p.id === myId);
                if (me) setIsSpectator(me.isSpectator);
            }
        } else if (connRef.current && connRef.current.open && targetId === myId) {
            connRef.current.send({ type: 'REQ_SPEC_TOGGLE', targetId: myId, isTemp, forceState });
        }
    };

    // 強制開始邏輯 (v3.8.30)
    const handleForceStart = () => {
        if (!isHostRef.current) return;
        // 開賽時清掉仍未到的五戰預期席位（遲到者進場會以觀戰者加入，不卡結算）
        if ((playersListRef.current || []).some(p => p.pending)) {
            const nList = playersListRef.current.filter(p => !p.pending);
            setPlayersList(nList);
            connsRef.current.forEach(c => { if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: nList }); });
        }
        const target = Date.now() + 5000;
        syncState({ matchPhase: 'countdown', countdownTarget: target }, true);
        showToast("⚡ 房主已強制啟動對局！");
    };

    const handlePlayAgain = () => {
        if (isMultiplayer && !isHostRef.current && engineRef.current === 'peerjs') {
            if (connRef.current) connRef.current.send({ type: 'REQ_PLAY_DIRECT' });
            showToast("已向主機發送強制開局請求...");
            return;
        }

        if (isHostRef.current && isMultiplayer) {
            // 房主直接本地生成新一盤並略過大廳
            generateAndSync(sizeId, diffId, undefined, true);
            return;
        }

        setIsWon(false); setIsClosingModal(true);
        setTimeout(() => { setIsClosingModal(false); if (handleRegenerateRandomRef.current) handleRegenerateRandomRef.current(); }, 300);
    };

    const handleBackToLobby = () => {
        if (platHubRef.current) { if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY('game-exit'); return; } // 平台房間框架：回等待室＝回殼的房間頁（房主帶全員、來賓只回自己）
        if (isMultiplayer && !isHostRef.current && engineRef.current === 'peerjs') {
            if (connRef.current) connRef.current.send({ type: 'REQ_PLAY_AGAIN' });
            showToast("已向主機發送返回大廳請求...");
            return;
        }

        if (isHostRef.current && isMultiplayer) {
            generateAndSync(sizeId, diffId, undefined, false);
            return;
        }
    };

    const closeVictoryModal = () => setHideVictoryModal(true);

    const toastTimerRef = useRef(null);
    const showToast = (m) => { if (typeof window !== 'undefined' && window.__PLAT_TOAST) { window.__PLAT_TOAST(m); return; } setToastMsg(m); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); toastTimerRef.current = setTimeout(() => setToastMsg(""), 4000); }; // 平台內統一走殼 toast（美學稽核 V-07：三款一式）；獨立版才用本地 toast。新 toast 先取消舊計時器，否則前一則的計時器會提早清掉後一則（稽核修）

    const getSvgCoords = (clientX, clientY) => {
        const svg = svgRef.current;
        if (!svg) return null;
        let pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const ctm = svg.getScreenCTM();
        return ctm ? pt.matrixTransform(ctm.inverse()) : null;
    };

    const eraseAtPoint = (cx, cy) => {
        const offsets = [[0, 0], [15, 0], [-15, 0], [0, 15], [0, -15], [10, 10], [-10, -10], [10, -10], [-10, 10]];
        let hitIds = new Set();
        for (let off of offsets) {
            const els = document.elementsFromPoint(cx + off[0], cy + off[1]);
            for (let el of els) {
                if (el.classList.contains('doodle-stroke')) {
                    const sid = el.getAttribute('data-stroke-id');
                    const strokeObj = stateRef.current.strokes.find(s => s.id === sid);
                    if (((strokeObj && strokeObj.uid) || (strokeObj ? strokeObj.id.split('-')[1] : null)) === myId) hitIds.add(sid);
                }
            }
        }
        if (hitIds.size > 0) {
            const newStrokes = stateRef.current.strokes.filter(s => !hitIds.has(s.id));
            if (newStrokes.length !== stateRef.current.strokes.length) syncState({ strokes: newStrokes });
        }
    };

    const clearCell = (cellId) => {
        if (isWon || interactionMode >= 2 || winner || matchPhase !== 'playing' || isSpectator) return;
        const cur = stateRef.current.isBrawlMode ? stateRef.current.localCells : stateRef.current.cells;
        const targetIdx = cur.findIndex(c => c.id === cellId);
        if (targetIdx === -1) return;
        const target = cur[targetIdx];

        if (isCellFrozen(cellId)) { frozenToast('清除'); return; }
        // 只有玩家自己填上的數字能被長按清除，題目或收禮系統填的不能清
        if (target.isGiven || target.isSystemRevealed || target.value === null) return;

        if (engineRef.current === 'none') setHistory(past => [...past.slice(past.length > 25 ? 1 : 0), cur]);

        const nextCells = [...cur];
        nextCells[targetIdx] = { ...target, value: null, owner: null };

        if (stateRef.current.isBrawlMode) {
            syncState({ localCells: nextCells }, false);
        } else {
            syncState({ cells: nextCells });
        }
        showToast("🧽 已清除該格內容");
    };

    const handlePointerDown = (e) => {
        if (matchPhase !== 'playing' || isSpectator) return;
        if (e.cancelable) e.preventDefault(); // 先宣示這次點按由遊戲處理：擋掉瀏覽器拿它去做手勢仲裁/滑鼠事件合成的起點（觸控筆同點連點時第二下被 claim 的主因之一）
        const pt = getSvgCoords(e.clientX, e.clientY); if (!pt) return;

        if (interactionMode === 2) {
            e.target.setPointerCapture(e.pointerId);
            if (drawSubMode === 'pen') { isDrawingRef.current = true; currentPathDataRef.current = `M ${pt.x} ${pt.y}`; if (drawingPathRef.current) { drawingPathRef.current.setAttribute('d', currentPathDataRef.current); drawingPathRef.current.style.display = 'block'; } } else if (drawSubMode === 'eraser') eraseAtPoint(e.clientX, e.clientY);
        } else {
            setRipples(prev => [...prev, { id: Date.now() + Math.random(), uid: myId, x: pt.x, y: pt.y, timestamp: Date.now() }]);

            // 設定長按清除偵測＋記錄本次點按：放開時改由 pointerup 直接處理點按，不再單靠 click——
            // 觸控筆快速連點時瀏覽器的手勢仲裁常把 click 吃掉（水波紋已渲染、數字卻沒填，使用者實機回報）
            const cx = Math.floor((pt.x - PADDING) / CELL_SIZE);
            const cy = Math.floor((pt.y - PADDING) / CELL_SIZE);
            if (cx >= 0 && cx < cSizeDef.size && cy >= 0 && cy < cSizeDef.size) {
                const cellId = `${cx}-${cy}`;
                setPressedCellId(cellId);
                isLongPressTriggered.current = false;
                touchStartPt.current = pt;
                const seq = ++tapSeqRef.current;
                tapInfoRef.current = { cellId: cellId, seq: seq, x: pt.x, y: pt.y, cx: e.clientX, cy: e.clientY };
                const cellTrk = platTapNew({ slop: 22, longpressMs: 500 }); cellTrk.down(e.clientX, e.clientY, Date.now()); cellTrkRef.current = cellTrk;
                cellLongPressTimer.current = setTimeout(() => {
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
        const msg = { type: 'CLICK', uid: myId, x: pt.x, y: pt.y };
        if (isHostRef.current) connsRef.current.forEach(c => c.send(msg)); else if (connRef.current) connRef.current.send(msg);
    };

    const handlePointerMove = (e) => {
        if (matchPhase !== 'playing' || isSpectator) return;
        const pt = getSvgCoords(e.clientX, e.clientY);

        if (interactionMode === 2) {
            if (drawSubMode === 'eraser') { if (pt && eraserRef.current) { eraserRef.current.setAttribute('cx', pt.x); eraserRef.current.setAttribute('cy', pt.y); if (eraserRef.current.style.display === 'none') eraserRef.current.style.display = 'block'; } if ((e.buttons > 0 || e.pointerType === 'touch') && Date.now() - lastEraseTimeRef.current > 50) { eraseAtPoint(e.clientX, e.clientY); lastEraseTimeRef.current = Date.now(); } } else if (drawSubMode === 'pen' && isDrawingRef.current && pt && currentPathDataRef.current) { currentPathDataRef.current += ` L ${pt.x} ${pt.y}`; if (drawingPathRef.current) { drawingPathRef.current.setAttribute('d', currentPathDataRef.current); } }
        } else {
            // 防手震：如果移動超過10px就取消長按判定
            if (cellLongPressTimer.current && touchStartPt.current && pt) {
                const dist = Math.hypot(pt.x - touchStartPt.current.x, pt.y - touchStartPt.current.y);
                if (dist > 10) {
                    clearTimeout(cellLongPressTimer.current);
                    cellLongPressTimer.current = null;
                }
            }
        }

        if (!showOtherCursors) return;
        if (Date.now() - lastCursorSend.current < 50) return; lastCursorSend.current = Date.now();
        if (pt) {
            const msg = { type: 'CURSOR', uid: myId, x: pt.x, y: pt.y };
            if (engineRef.current === 'peerjs') {
                if (isHostRef.current) connsRef.current.forEach(c => c.send(msg)); else if (connRef.current) connRef.current.send(msg);
            }
        }
    };

    const handlePointerUp = (e) => {
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
        const tapInfo = tapInfoRef.current;
        tapInfoRef.current = null;
        const cellTrk = cellTrkRef.current; cellTrkRef.current = null;
        if (tapInfo && e.type === 'pointerleave') {
            // 手勢在盤面外結束：標記已結算，擋掉放開位置（可能是數字鍵）上的尾隨 click 誤觸
            supTrk().markSuppress(Date.now());
            if (cellTrk) cellTrk.cancel();
        }
        if ((e.type === 'pointerup' || e.type === 'pointercancel') && interactionMode < 2 && tapInfo) {
            // v1.63.0：點按判定收編 PlatTap（守恆 v1.56.0 語意）——client 漂移 ≤22 對按下那格執行、每次結算必標記抑制（尾隨 click 全擋）；長按以 seq 判定優先；cancel 的觸控筆救援（SVG ≤6）為有界例外、保留原判
            const gres = cellTrk ? (e.type === 'pointercancel' ? cellTrk.cancel(e.clientX, e.clientY, Date.now()) : cellTrk.up(e.clientX, e.clientY, Date.now())) : { type: 'none' };
            if (longPressSeqRef.current === tapInfo.seq) {
                supTrk().markSuppress(Date.now());
            } else if (e.type === 'pointercancel') {
                // 觸控筆救援保留（有界例外）：cancel 且幾乎沒動（SVG ≤6 單位）視為點按補處理；捲動起手在被 claim 前早已移動超過此量。其餘 cancel 作廢。
                const upPt = getSvgCoords(e.clientX, e.clientY);
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
                    const newStroke = { id: Date.now() + '-' + myId, uid: myId, path: currentPathDataRef.current };
                    syncState({ strokes: [...stateRef.current.strokes, newStroke] }, !isBrawlMode);
                    currentPathDataRef.current = "";
                    if (drawingPathRef.current) drawingPathRef.current.style.display = 'none';
                }
            }
            if (e.type === 'pointerleave' || e.type === 'pointercancel' || e.pointerType === 'touch') if (eraserRef.current) eraserRef.current.style.display = 'none';
        }
    };

    const clearOwnStrokes = () => {
        const filtered = stateRef.current.strokes.filter(s => !s.id.endsWith('-' + myId));
        syncState({ strokes: filtered }, !isBrawlMode);
        showToast("🗑️ 已清除你所有的塗鴉");
    };
    const clearAllStrokes = () => {
        if (isHostRef.current) {
            syncState({ strokes: [] }, !isBrawlMode);
            if (!isBrawlMode) showToast("🚨 房主已清空全場塗鴉");
            else showToast("🗑️ 已清空塗鴉");
        }
    };
    const clearAllPlayers = () => {
        setPlayersList(prev => {
            const hostPlayer = prev.find(p => p.id === myId); if (!hostPlayer) return prev;
            const newList = [hostPlayer];
            if (engineRef.current === 'peerjs') { connsRef.current = connsRef.current.filter(c => c.open); connsRef.current.forEach(c => { c.send({ type: 'PLAYERS_UPDATE', players: newList }); c.send({ type: 'REQ_REJOIN' }); }); }
            return newList;
        });
    };

    const autoFillHiddenSingles = async (char) => {
        if (!stateRef.current.brawlSettings.allowQuickFill) { showToast("⚠️ 已關閉快速填答功能"); return; }
        if (isAutoFillingRef.current) return;
        isAutoFillingRef.current = true;
        syncState({ isAutoFilling: true, selectedChar: char }, !isBrawlMode);
        let changed = false; let stateChanged = false; let currentCells = [...(isBrawlMode ? stateRef.current.localCells : stateRef.current.cells)];
        const isValid = (cell, gridCells) => { if (cell.value !== null) return false; for (let other of gridCells) { if (other.value === char) { if (other.x === cell.x || other.y === cell.y || other.boxId === cell.boxId) return false; } } return true; };
        const fill = async (cellId) => {
            const idx = currentCells.findIndex(c => c.id === cellId);
            if (idx !== -1) {
                currentCells = [...currentCells]; const targetCell = currentCells[idx];
                currentCells[idx] = { ...targetCell, value: char, drafts: [], owner: myId };
                changed = true; stateChanged = true;
                for (let i = 0; i < currentCells.length; i++) {
                    if (i !== idx) {
                        const c = currentCells[i];
                        if (c.x === targetCell.x || c.y === targetCell.y || c.boxId === targetCell.boxId) { if (c.drafts.includes(char)) currentCells[i] = { ...c, drafts: c.drafts.filter(d => d !== char) }; }
                    }
                }
                if (isBrawlMode) {
                    syncState({ localCells: currentCells }, false);
                    if (isMultiplayer) {
                        const me = playersListRef.current.find(p => p.id === myId);
                        const msg = { type: 'GHOST_SOLVED', uid: myId, color: me ? me.color : myColorRef.current, cellId, id: Math.random().toString(36).substring(2, 11), value: char };
                        if (engineRef.current === 'peerjs') {
                            if (isHostRef.current) connsRef.current.forEach(c => c.send(msg)); else if (connRef.current) connRef.current.send(msg);
                        }
                    }
                } else { syncState({ cells: currentCells }); }
                await new Promise(r => setTimeout(r, 100));
            }
        };

        do {
            changed = false;
            for (let y = 0; y < cSizeDef.size; y++) { const rowCells = currentCells.filter(c => c.y === y); if (rowCells.some(c => c.value === char)) continue; const validEmpties = rowCells.filter(c => isValid(c, currentCells)); if (validEmpties.length === 1) await fill(validEmpties[0].id); }
            if (changed) continue;
            for (let x = 0; x < cSizeDef.size; x++) { const colCells = currentCells.filter(c => c.x === x); if (colCells.some(c => c.value === char)) continue; const validEmpties = colCells.filter(c => isValid(c, currentCells)); if (validEmpties.length === 1) await fill(validEmpties[0].id); }
            if (changed) continue;
            for (let b = 0; b < cSizeDef.size; b++) { const boxCells = currentCells.filter(c => c.boxId === b); if (boxCells.some(c => c.value === char)) continue; const validEmpties = boxCells.filter(c => isValid(c, currentCells)); if (validEmpties.length === 1) await fill(validEmpties[0].id); }
        } while (changed);

        if (stateChanged) {
            if (engineRef.current === 'none') setHistory(past => [...past.slice(past.length > 25 ? 1 : 0), currentCells]);
            if (currentCells.every(c => c.value !== null)) syncState({ selectedChar: null }, !isBrawlMode); else showToast(`✅ 自動填入 ${char} 成功！`);
        } else { showToast(`💡 目前找不到必定為 ${char} 的空格了`); }
        isAutoFillingRef.current = false; syncState({ isAutoFilling: false, selectedChar: null }, !isBrawlMode);
    };

    const autoFillDrafts = async (char) => {
        if (!stateRef.current.brawlSettings.allowQuickFill) { showToast("⚠️ 已關閉快速填答功能"); return; }
        if (isAutoFillingRef.current) return;
        isAutoFillingRef.current = true;
        syncState({ isAutoFilling: true, selectedChar: char }, !isBrawlMode);
        let stateChanged = false; let currentCells = [...(isBrawlMode ? stateRef.current.localCells : stateRef.current.cells)];
        const isValid = (cell) => { if (cell.value !== null) return false; for (let other of currentCells) { if (other.value === char) { if (other.x === cell.x || other.y === cell.y || other.boxId === cell.boxId) return false; } } return true; };

        for (let y = 0; y < cSizeDef.size; y++) {
            let rowChanged = false; let newRowCells = [...currentCells];
            for (let x = 0; x < cSizeDef.size; x++) {
                const cellIdx = newRowCells.findIndex(c => c.x === x && c.y === y); const cell = newRowCells[cellIdx];
                if (cell.value === null && isValid(cell)) { if (!cell.drafts.includes(char)) { newRowCells[cellIdx] = { ...cell, drafts: [...cell.drafts, char] }; stateChanged = true; rowChanged = true; } }
            }
            if (rowChanged) { currentCells = newRowCells; if (isBrawlMode) syncState({ localCells: currentCells }, false); else syncState({ cells: currentCells }); await new Promise(r => setTimeout(r, 40)); }
        }

        if (stateChanged) { if (engineRef.current === 'none') setHistory(past => [...past.slice(past.length > 25 ? 1 : 0), currentCells]); showToast(`✏️ 已將 ${char} 標記至所有安全的空格中`); } else { showToast(`💡 沒有更多安全的空格可以標記 ${char} 了`); }
        isAutoFillingRef.current = false; syncState({ isAutoFilling: false, selectedChar: null }, !isBrawlMode);
    };

    const runAutoFillCycle = async (startChar) => {
        if (!stateRef.current.brawlSettings.allowTraversal) { showToast("⚠️ 已關閉循環功能"); return; }
        if (isAutoFillingRef.current) return;
        isAutoFillingRef.current = true;
        syncState({ isAutoFilling: true }, !isBrawlMode);
        let changed = false; let stateChanged = false; let currentCells = [...(isBrawlMode ? stateRef.current.localCells : stateRef.current.cells)]; let totalFilled = 0;
        const chars = cSizeDef.chars; const startIndex = chars.indexOf(startChar);
        const isValid = (cell, gridCells, checkChar) => { if (cell.value !== null) return false; for (let other of gridCells) { if (other.value === checkChar) { if (other.x === cell.x || other.y === cell.y || other.boxId === cell.boxId) return false; } } return true; };
        const isCharCompleted = (checkChar, gridCells) => { return gridCells.filter(c => c.value === checkChar).length === cSizeDef.size; };
        const fill = async (cellId, fillChar) => {
            const idx = currentCells.findIndex(c => c.id === cellId);
            if (idx !== -1) {
                currentCells = [...currentCells]; const targetCell = currentCells[idx];
                currentCells[idx] = { ...targetCell, value: fillChar, drafts: [], owner: myId }; changed = true; stateChanged = true; totalFilled++;
                for (let i = 0; i < currentCells.length; i++) {
                    if (i !== idx) { const c = currentCells[i]; if (c.x === targetCell.x || c.y === targetCell.y || c.boxId === targetCell.boxId) { if (c.drafts.includes(fillChar)) { currentCells[i] = { ...c, drafts: c.drafts.filter(d => d !== fillChar) }; } } }
                }
                if (isBrawlMode) {
                    syncState({ localCells: currentCells, selectedChar: fillChar }, false);
                    if (isMultiplayer) {
                        const me = playersListRef.current.find(p => p.id === myId);
                        const msg = { type: 'GHOST_SOLVED', uid: myId, color: me ? me.color : myColorRef.current, cellId, id: Math.random().toString(36).substring(2, 11), value: fillChar };
                        if (engineRef.current === 'peerjs') {
                            if (isHostRef.current) connsRef.current.forEach(c => c.send(msg)); else if (connRef.current) connRef.current.send(msg);
                        }
                    }
                }
                else { syncState({ cells: currentCells, selectedChar: fillChar }); }
                await new Promise(r => setTimeout(r, 100));
            }
        };

        let passChanged;
        do {
            passChanged = false;
            for (let i = 0; i < chars.length; i++) {
                const charIdx = (startIndex + i) % chars.length; const char = chars[charIdx];
                if (currentCells.every(c => c.value !== null)) break;
                if (isCharCompleted(char, currentCells)) continue;
                syncState({ selectedChar: char }, !isBrawlMode); await new Promise(r => setTimeout(r, 50));
                do {
                    changed = false;
                    for (let y = 0; y < cSizeDef.size; y++) { const rowCells = currentCells.filter(c => c.y === y); if (rowCells.some(c => c.value === char)) continue; const validEmpties = rowCells.filter(c => isValid(c, currentCells, char)); if (validEmpties.length === 1) await fill(validEmpties[0].id, char); }
                    if (changed) { passChanged = true; continue; }
                    for (let x = 0; x < cSizeDef.size; x++) { const colCells = currentCells.filter(c => c.x === x); if (colCells.some(c => c.value === char)) continue; const validEmpties = colCells.filter(c => isValid(c, currentCells, char)); if (validEmpties.length === 1) await fill(validEmpties[0].id, char); }
                    if (changed) { passChanged = true; continue; }
                    for (let b = 0; b < cSizeDef.size; b++) { const boxCells = currentCells.filter(c => c.boxId === b); if (boxCells.some(c => c.value === char)) continue; const validEmpties = boxCells.filter(c => isValid(c, currentCells, char)); if (validEmpties.length === 1) await fill(validEmpties[0].id, char); }
                    if (changed) passChanged = true;
                } while (changed);
            }
        } while (passChanged && !currentCells.every(c => c.value !== null));

        if (stateChanged) { if (engineRef.current === 'none') { setHistory(past => [...past.slice(past.length > 25 ? 1 : 0), currentCells]); } if (currentCells.every(c => c.value !== null)) { syncState({ selectedChar: null }, !isBrawlMode); } else { showToast(`🚀 全自動循環填寫完畢！\n共幫您填入了 ${totalFilled} 格。`); } }
        else { showToast(`💡 目前已經找不到必定能填寫的空格了`); syncState({ selectedChar: null }, !isBrawlMode); }
        isAutoFillingRef.current = false; syncState({ isAutoFilling: false, selectedChar: null }, !isBrawlMode);
    };

    const clickTracker = useRef({ char: null, count: 0, time: 0 });
    const onNumClick = (e, c) => {
        e.preventDefault(); if (isAutoFillingRef.current || winner || matchPhase !== 'playing' || isSpectator) return;
        if (inputMode === 'cell') {
            // 格子先行：數字鍵 = 寫入目前選取的格子（還沒選格子時，點數字只做同值高亮）
            if (!selectedCellId) { if (!completedChars.has(c)) setSelectedChar(prev => prev === c ? null : c); return; }
            const cur = isBrawlMode ? localCells : cells;
            const t = cur.find(x => x.id === selectedCellId);
            if (!t) return;
            if (t.isGiven || t.isSystemRevealed) { showToast("⚠️ 這格是題目給的，不能修改"); return; }
            if (!isHeaderCollapsed) setIsHeaderCollapsed(true);
            applyCharToCell(selectedCellId, c);
            setSelectedChar(c);
            return;
        }
        if (!isHeaderCollapsed) setIsHeaderCollapsed(true);
        const now = Date.now(); const tracker = clickTracker.current;
        if (tracker.char === c && now - tracker.time < 400) { tracker.count += 1; } else { tracker.char = c; tracker.count = 1; }
        tracker.time = now; const isCompleted = completedChars.has(c);

        if (tracker.count === 1) {
            if (!isCompleted) setSelectedChar(prev => prev === c ? null : c);
        } else if (tracker.count === 2) {
            if (!isCompleted) {
                const isGhostBlocked = !stateRef.current.brawlSettings.allowQuickFill;
                if (isGhostBlocked) { tracker.count = 0; }
                else { if (interactionMode === 0) autoFillHiddenSingles(c); else if (interactionMode === 1) autoFillDrafts(c); }
            }
        } else if (tracker.count === 5) {
            const isGhostBlocked = !stateRef.current.brawlSettings.allowTraversal;
            if (!isGhostBlocked) { if (interactionMode === 0) runAutoFillCycle(c); else showToast("⚠️ 草稿模式不支援循環自動填寫\n請切換至一般模式使用"); }
            tracker.count = 0;
        }
    };


    // F3（v1.56.0）：按鈕觸發的縮放加 200ms travel 過渡——先在 svg 上掛 transition 再改尺寸（inline style 變更同樣吃 transition）；
    // 260ms 後自動卸下，確保雙指捏合/捲動觸發的 recalculateZoom 維持即時跟手、不被過渡拖慢。連按時重掛即可 retarget（CSS transition 會從當前值續行）。
    const zoomAnimTimerRef = useRef(null);
    const armZoomTransition = () => {
        const svg = svgRef.current; if (!svg) return;
        platArmZoom(svg); // 過渡武裝收編 PlatZoom.armTransition（v1.63.0，語意守恆）
    };

    const recalculateZoom = (modeIdx) => {
        const container = zoomContainerRef.current;
        if (!container) return;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        let newZoom = 1;
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
            svgRef.current.style.width = `${svgW * newZoom}px`;
            svgRef.current.style.height = `${svgH * newZoom}px`;
        }
    };

    const handleSizeChange = (e) => {
        const newSize = parseInt(e.target.value);
        if (isHostRef.current) generateAndSync(newSize, diffId);
    };

    const handleDiffChange = (e) => {
        const newDiff = e.target.value;
        if (isHostRef.current) generateAndSync(sizeId, newDiff);
    };

    useEffect(() => {
        if (screen === 'game' && levelData && levelData.cells.length > 0) {
            const tid = setTimeout(() => recalculateZoom(zoomModeIdxRef.current), 100);
            return () => clearTimeout(tid);
        }
    }, [levelData, screen]);

    const handleCellClick = (cellId) => {
        if (isLongPressTriggered.current) return; // 防長按後觸發點擊
        if (isWon || interactionMode >= 2 || winner || matchPhase !== 'playing' || isSpectator) return;
        const cur = isBrawlMode ? localCells : cells;
        const targetIdx = cur.findIndex(c => c.id === cellId);
        if (targetIdx === -1) return; const target = cur[targetIdx];

        // 格子先行：點格子只是「選取」，等玩家再點數字鍵填入（同時以該格數字做同值高亮）
        if (inputMode === 'cell') {
            setSelectedCellId(cellId);
            setSelectedChar(target.value);
            return;
        }

        // 判斷按鍵是否已經被反擊打亂
        const isScrambled = keyMapping.join('') !== cSizeDef.chars.join('');

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
            setSelectedChar(prev => prev === target.value ? null : target.value);
            return;
        }

        applyCharToCell(cellId, selectedChar);
    };

    // 把字元 char 套用到指定格子（填答/草稿共用；數字先行與格子先行都走這裡）
    const applyCharToCell = (cellId, char) => {
        const cur = isBrawlMode ? localCells : cells;
        const targetIdx = cur.findIndex(c => c.id === cellId);
        if (targetIdx === -1) return; const target = cur[targetIdx];
        if (target.isGiven || target.isSystemRevealed) return;
        if (isCellFrozen(cellId)) { try { platAudio().play('error'); } catch (e) {} frozenToast('填'); return; } // 凍結拒填＝error（v1.65.5 孤兒裁示：與數橋被拒一致、推翻 v1.64.0 規格的靜音）

        if (engineRef.current === 'none') setHistory(past => [...past.slice(past.length > 25 ? 1 : 0), cur]);

        const nextCells = [...cur]; let nextCell = { ...target };

        if (interactionMode === 1) { // 草稿模式
            if (nextCell.drafts.includes(char)) {
                nextCell.drafts = nextCell.drafts.filter(d => d !== char);
            } else {
                nextCell.drafts = [...nextCell.drafts, char];
            }
        } else { // 一般填答模式
            const nextValue = (target.value === char) ? null : char;
            nextCell.value = nextValue;
            nextCell.owner = (nextValue !== null) ? myId : null;
            nextCell.drafts = [];
            if (nextValue !== null) {
                // 衝突偵測（與 conflictCellIds 同規則：列/欄/宮同值）→ error 取代 place；無衝突 → place；擦除不播（PlatAudio 接線，v1.64.0）
                const bx0 = Math.floor(target.x / cSizeDef.boxW) * cSizeDef.boxW, by0 = Math.floor(target.y / cSizeDef.boxH) * cSizeDef.boxH;
                let clash = false;
                for (const c of cur) { if (c.id === cellId || c.value !== nextValue) continue; if (c.x === target.x || c.y === target.y || (c.x >= bx0 && c.x < bx0 + cSizeDef.boxW && c.y >= by0 && c.y < by0 + cSizeDef.boxH)) { clash = true; break; } }
                try { platAudio().play(clash ? 'error' : 'place'); } catch (e) {}
            }

            // 幽靈競速/亂鬥模式：廣播玩家填答狀況（包含擦除，讓上帝模式與進度條能正確反映）
            if (isBrawlMode && isMultiplayer) {
                const me = playersListRef.current.find(p => p.id === myId);
                const msg = { type: 'GHOST_SOLVED', uid: myId, color: me ? me.color : myColorRef.current, cellId, id: Math.random().toString(36).substring(2, 11), value: nextValue };
                if (engineRef.current === 'peerjs') {
                    if (isHostRef.current) connsRef.current.forEach(c => c.send(msg)); else if (connRef.current) connRef.current.send(msg);
                }
            }
        }

        nextCells[targetIdx] = nextCell;
        if (interactionMode !== 1 && nextCell.value !== null) {
            const placed = nextCell.value;
            for (let i = 0; i < nextCells.length; i++) {
                if (i === targetIdx) continue;
                const c = nextCells[i];
                if ((c.x === target.x || c.y === target.y || c.boxId === target.boxId) && c.drafts && c.drafts.includes(placed)) {
                    nextCells[i] = { ...c, drafts: c.drafts.filter(d => d !== placed) };
                }
            }
        }
        if (isBrawlMode) {
            syncState({ localCells: nextCells }, false);
        } else {
            syncState({ cells: nextCells });
        }
    };

    const handleReset = () => {
        if (isAutoFillingRef.current || matchPhase !== 'playing' || isSpectator) return;
        const currentActive = isBrawlMode ? localCells : cells;
        const resetCells = currentActive.map(c => ({ ...c, value: (c.isGiven || c.isSystemRevealed) ? c.value : null, drafts: [], owner: null }));
        syncState({ cells: resetCells, localCells: resetCells, strokes: [], startTime: Date.now() });
        if (engineRef.current === 'none') setHistory([]);
        setIsWon(false); setEndTime(null); setSelectedChar(null);
        showToast("🔄 盤面已重置！");
    };

    const switchToOffline = () => {
        setEngine('local'); engineRef.current = 'local';
        setIsHost(true); isHostRef.current = true;
        setPlayersList([{ id: myId, name: myNameRef.current || "單機玩家", isHost: true, color: myColorRef.current, isReady: false, isSpectator: false }]);
    };

    const handleGoHome = (platLeave) => {
        dailyRef.current = null; setDailyDate(null);
        // platLeave==='leave'：連線模式個人退出（只有自己回大廳、其他人繼續、房主退出由殼接管）；其餘走舊語義（房主帶全員回等待室）
        if (window.__PLAT_NOTIFY) window.__PLAT_NOTIFY(platLeave === 'leave' ? 'player-leave' : 'game-exit');
        if (engineRef.current === 'peerjs') {
            if (!isHostRef.current && connRef.current) { connRef.current.send({ type: 'LEAVE', uid: myId }); const pToKill = peerRef.current; setTimeout(() => { if (pToKill) { try { pToKill.destroy(); } catch (e) {} } if (peerRef.current === pToKill) peerRef.current = null; }, 100); }
            else if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
        }
        switchToOffline(); setScreen('home'); setIsWon(false); setEndTime(null); setHistory([]);
    };

    const handlePlayerColorChange = (playerId, newColor) => {
        const updateLogic = (prev) => {
            const nList = prev.map(p => p.id === playerId ? { ...p, color: newColor } : p);
            if (isHostRef.current) {
                // 連動更新盤面上該玩家填寫的格子顏色 (v3.8.33)
                setCells(cur => cur.map(c => c.owner === playerId ? { ...c, ownerColor: newColor } : c));
                setLocalCells(cur => cur.map(c => c.owner === playerId ? { ...c, ownerColor: newColor } : c));
                connsRef.current.forEach(c => c.send({ type: 'PLAYERS_UPDATE', players: nList }));
            }
            return nList;
        };
        if (engineRef.current === 'none') { setPlayersList(updateLogic); return; }
        if (engineRef.current === 'peerjs') {
            if (isHostRef.current) setPlayersList(updateLogic);
            else if (connRef.current) connRef.current.send({ type: 'REQ_COLOR_CHANGE', targetId: playerId, color: newColor });
        }
    };

    const handlePlayerNameChange = (playerId, newName) => {
        if (playerId === myId) setTempPlayerName(newName);
        if (engineRef.current === 'none') setPlayersList(prev => prev.map(p => p.id === playerId ? { ...p, name: newName } : p));
        else if (engineRef.current === 'peerjs') {
            if (isHostRef.current) { const nList = playersListRef.current.map(p => p.id === playerId ? { ...p, name: newName } : p); setPlayersList(nList); connsRef.current.forEach(c => c.send({ type: 'PLAYERS_UPDATE', players: nList })); }
            else if (connRef.current) connRef.current.send({ type: 'REQ_NAME_CHANGE', targetId: playerId, name: newName });
        }
        showToast("✅ 暱稱修改成功！");
    };
    const handleUndo = () => {
        if (history.length === 0 || isWon || (engineRef.current !== 'none' && !isBrawlMode)) return;
        setHistory(past => {
            const newPast = [...past];
            const lastState = newPast.pop();
            if (isBrawlMode) {
                setLocalCells(lastState);
                syncState({ localCells: lastState }, false);
            } else {
                setCells(lastState);
                syncState({ cells: lastState });
            }
            return newPast;
        });
    };



    const handleCycleZoom = () => {
        armZoomTransition();
        const next = (zoomModeIdx + 1) % 4;
        setZoomModeIdx(next);
        zoomModeIdxRef.current = next;
        recalculateZoom(next);
    };

    const handleZoomIn = () => {
        armZoomTransition();
        setZoomModeIdx(0);
        zoomModeIdxRef.current = 0;
        const next = pz().add(0.1);
        setZoomLevel(next);
        zoomLevelRef.current = next;
        if (svgRef.current) {
            svgRef.current.style.width = `${svgW * next}px`;
            svgRef.current.style.height = `${svgH * next}px`;
        }
    };

    const handleZoomOut = () => {
        armZoomTransition();
        setZoomModeIdx(0);
        zoomModeIdxRef.current = 0;
        const next = pz().add(-0.1);
        setZoomLevel(next);
        zoomLevelRef.current = next;
        if (svgRef.current) {
            svgRef.current.style.width = `${svgW * next}px`;
            svgRef.current.style.height = `${svgH * next}px`;
        }
    };

    // === 共用底部列 PlatBar（平台模式由殼渲染單一元件；獨立版走舊列） ===
    const platBarRef = useRef(null);
    const platBarCfgRef = useRef(null);

    // 名單自我修復（比照數橋）：來賓的 JOIN 若在房主就緒前送達被漏接，每 2.5 秒重送，直到名單上有自己為止
    useEffect(() => {
        const t = setInterval(() => {
            if (engineRef.current !== 'peerjs' || isHostRef.current) return;
            if (!connRef.current || !connRef.current.open) return;
            if ((playersListRef.current || []).some(p => p.id === myId)) return;
            try { connRef.current.send({ type: 'JOIN', pName: myNameRef.current || "玩家", uid: myId, color: myColorRef.current }); } catch (e) {}
        }, 2500);
        return () => clearInterval(t);
    }, []);

    // 完賽回報補送（與數橋 RACE_FINISH 補送同款邏輯）：大亂鬥來賓的 GHOST_I_WON 原本只送一次，
    // 途中連線替換/掉包就永遠遺失、房主卡在等結果。房主宣布完賽前每 3 秒補送（上限 6 次），房主端以 winInfo.id 去重。
    useEffect(() => {
        const t = setInterval(() => {
            if (engineRef.current !== 'peerjs' || isHostRef.current) return;
            if (!isWinnerDeclaredRef.current || !lastWinInfoRef.current) return;
            if (!stateRef.current.isBrawlMode || stateRef.current.matchPhase === 'finished') return;
            if (winResentRef.current >= 6) return;
            if (!connRef.current || !connRef.current.open) return;
            winResentRef.current++;
            try { connRef.current.send({ type: 'GHOST_I_WON', senderUid: myId, id: Math.random().toString(36).substring(2, 10), time: Date.now(), winInfo: lastWinInfoRef.current }); } catch (e) {}
        }, 3000);
        return () => clearInterval(t);
    }, []);
    platBarCfgRef.current = {
        accent: '#ffcc00',
        onAction: (name, payload) => {
            if (name === 'zoom-in') handleZoomIn();
            else if (name === 'zoom-out') handleZoomOut();
            else if (name === 'zoom-cycle') handleCycleZoom();
            else if (name === 'input-set') setInputMode(payload);
            else if (name === 'mode-press') advanceInteractionMode();
            else if (name === 'draw-tool') setDrawSubMode(payload);
            else if (name === 'draw-erase-dbl') clearOwnStrokes();
            else if (name === 'draw-clear') clearAllStrokes();
        }
    };
    const platBarCfgStable = useRef(null);
    if (!platBarCfgStable.current) platBarCfgStable.current = { accent: '#ffcc00', onAction: (n, p) => { if (platBarCfgRef.current) platBarCfgRef.current.onAction(n, p); } };
    useEffect(() => {
      if (typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'sudoku') return; // 底部列主人是另一款遊戲時不搶（錦標賽輪替時防翻跳）
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
        if (typeof window !== 'undefined' && window.__PLAT_NET && window.__PLAT_NET.inMatch && window.__PLAT_NET.inMatch !== 'sudoku') return;
        const st = {
            mode: interactionMode,
            modes: [{ icon: '🖋️', label: '填答' }, { icon: '✏️', label: '筆記' }, { icon: '🖌️', label: '塗鴉' }],
            modeTitle: '切換模式（填答/筆記/塗鴉）',
            zoomLabel: zoomIndicator.visible && zoomIndicator.value > 1 ? Math.round(zoomIndicator.value * 100) + '%' : '🔍', // zoom 標示三款統一百分比（美學稽核 V-22）
            zoomGlyph: zoomModeIdx === 0 ? '1X' : zoomModeIdx === 1 ? '↔️' : zoomModeIdx === 2 ? '↕️' : '🔲',
            showInput: true, inputMode: inputMode,
            showDraw: interactionMode === 2, drawTool: drawSubMode,
            showHostClear: !!(isHostRef.current && !isBrawlMode)
        };
        window.PlatBar.update(st);
    });

    const startDailyGame = (dateStr) => {
        switchToOffline();
        dailyRef.current = dateStr; setDailyDate(dateStr); dailyRecordedRef.current = false;
        setScreen('game');
        setMatchPhase('playing');
        setIsBrawlMode(false);
        setIsHeaderCollapsed(false);
        setIsGenerating(true); setWinner(null); isWinnerDeclaredRef.current = false;
        setTimeout(() => {
            generateDailySudoku(dateStr, setGenProgress).then(newData => {
                const initCells = JSON.parse(JSON.stringify(newData.cells));
                syncState({ sizeId: 9, diffId: 'medium', levelData: newData, cells: initCells, localCells: initCells, strokes: [], startTime: Date.now(), isBrawlMode: false, winner: null, matchEndTime: null, solutionGrid: null, isGenerating: false, selectedChar: null, keyMapping: newData.sizeDef.chars, finishViewMode: 'my' }, true);
                setIsWon(false); setHistory([]); setEndTime(null); setHideVictoryModal(false); setSelectedChar(null); setGenProgress("");
            });
        }, 100);
    };

    // ===== 📅 每日一題月曆（亮燈=已完成、未來反灰不可選；點日期直接開那天的題目） =====
    const openDailyCal = () => { if (window.PlatCalendar) window.PlatCalendar.show({ accent: '#ffcc00', records: dailyRecords, selected: dailyPickDate, onPick: (ds) => { setDailyPickDate(ds); startDailyGame(ds); } }); }; // 每日月曆已統一為殼端 PlatCalendar（v1.16）

    // 每日一題完賽記錄（連擊只認今天；補玩只記該日成績）
    useEffect(() => {
        if (!isWon || !dailyRef.current || dailyRecordedRef.current || !endTime) return;
        dailyRecordedRef.current = true;
        const dateStr = dailyRef.current;
        const secs = Math.max(1, Math.round((endTime - startTime) / 1000));
        setDailyRecords(prev => {
            const next = { ...prev };
            if (!next[dateStr] || secs < next[dateStr]) next[dateStr] = secs;
            platSave().write('sudoku_daily_records', next);
            return next;
        });
        if (dateStr === dailyTodayStr()) {
            setDailyStreak(prev => {
                let next = prev;
                if (prev.lastDate !== dateStr) {
                    const count = prev.lastDate === shiftDateStr(dateStr, -1) ? prev.count + 1 : 1;
                    next = { count: count, lastDate: dateStr };
                    platSave().write('sudoku_daily_streak', next);
                }
                return next;
            });
        }
        showToast('📅 每日一題（' + dateStr + '）完成！用時 ' + formatTime(secs));
    }, [isWon, endTime]);

    const startSinglePlayer = () => {
        dailyRef.current = null; setDailyDate(null);
        switchToOffline();
        setScreen('game');
        setMatchPhase('waiting');
        setIsBrawlMode(false); setIsBrawlMode(false); // 確保是純單機模式
        setIsHeaderCollapsed(false);
    };

    const handleSaveCode = () => {
        const targetCells = isBrawlMode ? localCells : cells;
        const data = {
            sId: sizeId,
            dId: diffId,
            cells: targetCells.map(c => ({ x: c.x, y: c.y, v: c.value, g: c.isGiven, d: c.drafts, o: c.owner })),
            mode: isBrawlMode ? 'brawl' : 'coop'
        };
        try {
            const code = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
            setSaveCode(code);
            navigator.clipboard.writeText(code).then(() => showToast("📋 進度代碼已複製到剪貼簿！"));
        } catch (e) {
            showToast("❌ 產生代碼失敗");
        }
    };

    const handleLoadCode = () => {
        if (!saveCode.trim()) return showToast("⚠️ 請先貼上代碼");
        try {
            const data = JSON.parse(decodeURIComponent(escape(atob(saveCode))));
            setIsGenerating(true);
            generateSudokuAsync(data.sId, data.dId, setGenProgress).then(newData => {
                const loadedCells = newData.cells.map(c => {
                    const saved = data.cells.find(sc => sc.x === c.x && sc.y === c.y);
                    if (saved) return { ...c, value: saved.v, isGiven: saved.g, drafts: saved.d || [], owner: saved.o || null };
                    return c;
                });
                let solution = null;
                if (data.mode === 'ghost' || data.mode === 'brawl') solution = getSolutionGrid(loadedCells, newData.sizeDef);

                syncState({
                    sizeId: data.sId,
                    diffId: data.dId,
                    levelData: newData,
                    cells: loadedCells,
                    localCells: loadedCells,
                    isBrawlMode: data.mode === 'ghost' || data.mode === 'brawl',
                    isBrawlMode: data.mode === 'brawl',
                    solutionGrid: solution,
                    isGenerating: false
                }, true);
                setScreen('game');
                setShowSaveModal(false);
                showToast("✅ 進度載入成功！");
            });
        } catch (e) {
            showToast("❌ 無效的進度代碼");
        }
    };

    const handleQuickPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setSaveCode(text);
            showToast("📋 已貼上剪貼簿內容");
        } catch (err) {
            showToast("❌ 無法讀取剪貼簿，請手動貼上");
        }
    };

    const generateAndSync = (sId, dId, nextMode, skipLobby = false) => {
        if (isAutoFillingRef.current) return;
        setIsGenerating(true); setWinner(null); isWinnerDeclaredRef.current = false; setGhostHints({}); setUnopenedGifts({}); setBrawlWinners([]);
        let targetMode = nextMode;
        if (targetMode === undefined) { targetMode = stateRef.current.isBrawlMode ? 'brawl' : 'coop'; }
        const isGR = targetMode === 'brawl';
        const isBrawl = targetMode === 'brawl';
        let newPhase = (engineRef.current === 'peerjs') ? 'waiting' : 'playing';
        let cdTarget = null;
        if (skipLobby && engineRef.current === 'peerjs') { if (isGR) { newPhase = 'countdown'; cdTarget = Date.now() + 5500; } else { newPhase = 'playing'; } }
        setIsSpectator(false);
        autoGodRef.current = false; // 新局：重置「完賽自動轉上帝」的一次性旗標
        syncState({ isGenerating: true, isBrawlMode: isBrawl, winner: null, matchPhase: newPhase, matchEndTime: null, countdownTarget: cdTarget, giftEvents: [], brawlWinners: [], finishViewMode: 'my' }, true);
        setPlayersList(prev => {
            const nList = prev.map(p => ({ ...p, isReady: (engineRef.current === 'none'), isSpectator: !!p.isLobbySpectator }));
            if (engineRef.current === 'peerjs' && isHostRef.current) connsRef.current.forEach(c => c.send({ type: 'PLAYERS_UPDATE', players: nList }));
            return nList;
        });
        setTimeout(() => {
            generateSudokuAsync(sId, dId, setGenProgress).then(newData => {
                let solution = null; if (isGR) solution = getSolutionGrid(newData.cells, newData.sizeDef);
                const initLocalCells = JSON.parse(JSON.stringify(newData.cells));
                syncState({ sizeId: sId, diffId: dId, levelData: newData, cells: initLocalCells, localCells: initLocalCells, strokes: [], startTime: Date.now(), isBrawlMode: isBrawl, winner: null, matchEndTime: null, solutionGrid: solution, isGenerating: false, selectedChar: null, keyMapping: newData.sizeDef.chars, finishViewMode: 'my' }, true);
                setIsWon(false); setHistory([]); if (sId !== sizeId) { setZoomLevel(1); setZoomModeIdx(0); }
                setEndTime(null); setHideVictoryModal(false); setSelectedChar(null); setGenProgress("");
            });
        }, 100);
    };
    handleRegenerateRandomRef.current = () => generateAndSync(sizeId, diffId);

    const [platTournLock, setPlatTournLock] = useState(false);
    const [platHub, setPlatHub] = useState(false); // v1.11.0：本局由殼房間框架啟動（等待室改在殼端，本遊戲不顯示自己的等待室）
    const platHubRef = useRef(false);
    const platSessRef = useRef(null); // 殼 launch 的原始 sess（hub 判斷與代表色 sess.color 的來源；exit 時清空）
    const isShellColor = (c) => !!c && (c === 'rainbow' || COLORS.indexOf(c) >= 0); // 殼代表色合法值：20 色之一或彩虹
    const hubStartTimerRef = useRef(null);
    const joinRetryRef = useRef(null); // 來賓 JOIN 重送計時器：JOIN 只送一次時，訊息一掉就永遠進不了局（2026-10-31 卡死案）
    const [tournRoundInfo, setTournRoundInfo] = useState(null); // 錦標賽本局資訊（第幾局/共幾局/加賽/應到人數），每局等待卡顯示與門檻用
    const tournWaitSinceRef = useRef(null); // 本局等待起點（等滿 1 分鐘房主可強制開始）
    const [, setTournTick] = useState(0);
    useEffect(() => {
        if (!(platHub && platTournLock)) return;
        const t = setInterval(() => setTournTick(x => x + 1), 1000);
        return () => clearInterval(t);
    }, [platHub, platTournLock]);
    // 錦標賽每局等待卡的準備切換（與舊等待室同款訊息：來賓 REQ_READY/REQ_UNREADY、房主自切＋廣播）
    const handleTournReady = () => {
        if (isHostRef.current) {
            const nList = playersListRef.current.map(p => p.id === myId ? { ...p, isReady: !p.isReady } : p);
            setPlayersList(nList);
            connsRef.current.forEach(c => { if (c.open) c.send({ type: 'PLAYERS_UPDATE', players: nList }); });
        } else if (connRef.current && connRef.current.open) {
            const me = playersListRef.current.find(p => p.id === myId);
            if (me) connRef.current.send({ type: me.isReady ? 'REQ_UNREADY' : 'REQ_READY', targetId: myId });
        }
    };
    // ===== 平台 Phase C 接入：殼 launch 時自動進多人（免重打暱稱/房號） =====
    useEffect(() => {
        if (!window.__PLAT_PLATFORM) return;
        window.__PLAT_HOOKS_sudoku = {
            enter: (sess) => {
                // 開新局先清掉上一局的結算暫存（同數橋）：贏家/完賽名單/比賽階段全歸零，免得舊結算在新局重播
                matchTokenRef.current = null; // 世代代幣歸零：新房間的第一則 SYNC 重新認領，避免舊房間的代幣把新局 SYNC 全擋掉
                setWinner(null); setIsWon(false); setEndTime(null); isWinnerDeclaredRef.current = false;
                lastWinInfoRef.current = null; winResentRef.current = 0; // 補送 effect 的彈藥也要清：舊 GHOST_I_WON 帶進新局會被殼記成新局完賽（錦標賽記錯分）
                setBrawlWinners([]); setHideVictoryModal(false);
                resultsDismissRef.current = null; setResultsDismissedUi(false); setLeaveArm(false);
                setMatchPhase('waiting'); stateRef.current = { ...stateRef.current, matchPhase: 'waiting' };
                setPlatTournLock(!!sess.tourn); platTournLockRef.current = !!sess.tourn;
                tournRosterRef.current = (sess.tourn && sess.tourn.roster) || null;
                setPlatHub(!!sess.hub); platHubRef.current = !!sess.hub;
                platSessRef.current = sess;
                // 平台 hub：代表色以殼摩天輪選定的 sess.color 為準——先寫 myColorRef，並同步自己在 playersList 的條目；
                // render 時 myColorRef 會由名單推導回寫（getPlayerColor），條目不先改色，JOIN/GHOST 送出前就會被蓋回預設色
                if (sess.hub && isShellColor(sess.color)) {
                    myColorRef.current = sess.color;
                    setPlayersList(prev => prev.map(p => p.id === myId ? { ...p, color: sess.color } : p));
                }
                setTournRoundInfo(sess.tourn ? { round: sess.tourn.round, total: sess.tourn.total, playoff: !!sess.tourn.playoff, entrants: sess.tourn.entrants } : null);
                tournWaitSinceRef.current = sess.tourn ? Date.now() : null;
                if (sess.settings) {
                    // 房間框架帶入的設定（全員同一份，開賽前在殼房間頁設好）：一次種下尺寸/難度/大亂鬥設定
                    const st = sess.settings;
                    setSizeId(st.sizeId); setDiffId(st.diffId);
                    setBrawlSettings(prev => ({ ...prev, ...(st.brawl || {}) }));
                    stateRef.current = { ...stateRef.current, sizeId: st.sizeId, diffId: st.diffId, brawlSettings: { ...stateRef.current.brawlSettings, ...(st.brawl || {}) } };
                } else if (sess.tourn && sess.isHost) {
                    // 賽程預設：套用賽程的版型/難度，結束名次設為全員（不提前結束）
                    setSizeId(sess.tourn.sizeId); setDiffId(sess.tourn.diffId);
                    setBrawlSettings(prev => ({ ...prev, winnersCount: Math.max(1, sess.tourn.entrants || 1) }));
                    stateRef.current = { ...stateRef.current, sizeId: sess.tourn.sizeId, diffId: sess.tourn.diffId, brawlSettings: { ...stateRef.current.brawlSettings, winnersCount: Math.max(1, sess.tourn.entrants || 1) } };
                }
                myNameRef.current = sess.name;
                setTempPlayerName(sess.name);
                setEngine('peerjs'); engineRef.current = 'peerjs';
                setIsConnecting(true);
                if (sess.isHost) {
                    syncState({ levelData: emptyLevelData, cells: [], localCells: [], matchPhase: 'waiting', matchEndTime: null, isBrawlMode: sess.mode === 'brawl' }, false);
                    setupPeerJS(sess.code, sess.name, true);
                } else {
                    setupPeerJS(sess.code, sess.name, false);
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
                        if (expected >= 2 && present >= expected && !stateRef.current.isGenerating) {
                            clearInterval(hubStartTimerRef.current); hubStartTimerRef.current = null;
                            handleForceStart();
                        }
                        // 不再等 45 秒就放棄：來賓裝置慢（載入/生成競態）時舊版會直接死局——房主永遠等不到開局、來賓永遠在等待。
                        // 計時器活到 exit/開局為止（enter 的冪等重設與 exit 都會清），每 500ms 重查即可。
                    }, 500);
                }
            },
            exit: () => { setPlatTournLock(false); platTournLockRef.current = false; tournRosterRef.current = null; setPlatHub(false); platHubRef.current = false; platSessRef.current = null; setTournRoundInfo(null); tournWaitSinceRef.current = null; if (hubStartTimerRef.current) { clearInterval(hubStartTimerRef.current); hubStartTimerRef.current = null; } handleGoHome(); },
            migrate: (amHost, sess) => {
                // 房主接管：以目前對局狀態原地重建連線（房主 open handler 有 isMigrating 續局邏輯）
                platSessRef.current = sess;
                if (sess && sess.hub && isShellColor(sess.color)) myColorRef.current = sess.color;
                setEngine('peerjs'); engineRef.current = 'peerjs';
                setupPeerJS(sess.code, sess.name, !!amHost);
            },
            identity: (d) => {
                // 殼端身分同步（進遊戲後改色）：self=我——只改本地名單條目與 myColorRef，不送協議訊息；我是房主時用既有 PLAYERS_UPDATE 管道廣播最新名單一次
                // self=false=他人——以名字找人（與 JOIN 撞名檢查/五戰席位同款的完全比對），走既有 handlePlayerColorChange 管道
                if (!d || !isShellColor(d.color)) return;
                if (d.self) {
                    myColorRef.current = d.color;
                    const nList = (playersListRef.current || []).map(p => p.id === myId ? { ...p, color: d.color } : p);
                    setPlayersList(nList);
                    if (isHostRef.current) connsRef.current.forEach(c => { if (c.open) { try { c.send({ type: 'PLAYERS_UPDATE', players: nList }); } catch (e) {} } });
                } else {
                    const p = (playersListRef.current || []).find(pl => pl.name === d.name);
                    if (p) handlePlayerColorChange(p.id, d.color);
                }
            }
        };
    }, []);

    // 在線心跳（與數橋同款）：來賓每 10 秒 ping 房主；房主記錄每人最後出現時間，25 秒標離線、等待中 60 秒無回應移除。
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
            const waiting = stateRef.current.matchPhase === 'waiting';
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
                connsRef.current.forEach(conn => { if (conn.open) { try { conn.send({ type: 'PLAYERS_UPDATE', players: next }); } catch (e) {} } });
                if (removed) showToast(`📴 ${removed.name || '玩家'} 已離線`);
            }
        }, 5000);
        return () => clearInterval(iv);
    }, []);

    // 世代守衛：代幣不符的 SYNC 原則上是上一局遲到包、應丟棄；但「新局開局包」（isGenerating 或 countdown 階段）
    // 是房主在宣告新世代——同一條連線有序送達，舊開局包不可能越過新包遲到，此時必須放行（syncState 會認領新代幣）。
    // 否則再來一局的第一包（倒數包、尚無盤面）會被來賓整包丟棄，來賓永遠停在舊結算、進不了新局。
    const isStaleSync = (data) => !!(data && data.matchToken && matchTokenRef.current && data.matchToken !== matchTokenRef.current && !(data.levelData && data.startTime) && data.isGenerating !== true && data.matchPhase !== 'countdown');

    // hub 模式專用：房主的心跳廣播（分層自動同步）會搶在來賓 JOIN 前把「只有房主」的名單推過來——
    // 名單裡還沒有我時整表採用，會把殼釘好代表色的自我條目洗掉（下一個 render 就把 myColorRef 蓋回預設色、JOIN 帶錯色）。
    // 故 hub 模式下來賓不採用「沒有我」的名單；正式 INIT 與 JOIN 後的更新必含我，不受影響。非 hub 回傳原名單。
    const adoptHubPlayers = (players) => {
        if (players && platSessRef.current && platSessRef.current.hub && !players.some(p => p.id === myId)) return playersListRef.current || players;
        return players;
    };

    const setupPeerJS = (rId, pName, isCreating) => {
        // 冪等重設：重複 setup（接管/重入/launch 重播）先清掉舊 peer 與 conn refs，避免 SYNC 送進死連線或重複綁定
        if (joinRetryRef.current) { clearInterval(joinRetryRef.current); joinRetryRef.current = null; }
        if (peerRef.current) { try { peerRef.current.destroy(); } catch (e) {} peerRef.current = null; }
        connsRef.current = []; connRef.current = null;
        // 身份重置（關鍵）：isHost 必須在每次 setup 依角色重設。exit 時 switchToOffline 會把 isHost 設 true（單機＝房主），
        // 若來賓重入時不重置，state/ref 會一直是 true——來賓會看到房主的「開始比賽」鈕、還會誤跑房主邏輯（五戰第三局來賓出現開始鈕的根因；數橋在各分支都有重設，數獨漏了）
        setIsHost(!!isCreating); isHostRef.current = !!isCreating;
        let savedProg = loadLocalProgress(rId, myId);
        if (savedProg && Array.isArray(savedProg.d) && savedProg.d.length) {
            // 尺寸守衛：存檔盤面尺寸必須等於本局尺寸才准恢復。房號撞號／跨尺寸殘檔的格子一旦塞進
            // localCells，conflictCellIds 會拿大格子寫入小 grid 當場崩潰（2026-11-01 主畫面 App 實機事故：
            // Safari 儲存空間乾淨無事、主畫面 App 累積殘檔必爆）。不合就整筆清除，不留毒。
            const targetSize = (SIZES.find(s => s.id === stateRef.current.sizeId) || SIZES[1]).size;
            let maxDim = 0;
            for (const c of savedProg.d) { if (c && typeof c.x === 'number' && typeof c.y === 'number') { if (c.x + 1 > maxDim) maxDim = c.x + 1; if (c.y + 1 > maxDim) maxDim = c.y + 1; } }
            if (maxDim !== targetSize) { platSave().remove(`sudoku_prog_${rId}_${myId}`); savedProg = null; }
        }
        setConnectionStatus(isCreating ? "正在啟動通訊模組..." : `正在尋找房間 ${rId}...`);
        if (isCreating) {
            const p = new Peer('yyh-tgsh-' + rId + '-host'); peerRef.current = p;
            p.on('open', function () {
                setConnectionStatus("房間已建立，等待進入...");
                const currentPhase = stateRef.current.matchPhase;
                const hasLevelData = stateRef.current.levelData !== null;
                const isMigrating = hasLevelData && (currentPhase === 'playing' || currentPhase === 'countdown');
                const targetPhase = isMigrating ? currentPhase : 'waiting';

                setIsHost(true); isHostRef.current = true; setIsSpectator(false); setRoomId(rId); setScreen('game'); setIsHeaderCollapsed(true); setIsConnecting(false);
                syncState({ matchPhase: targetPhase }, false);

                setPlayersList(prev => {
                    const others = prev.filter(pl => pl.id !== myId && !pl.isHost);
                    const me = prev.find(pl => pl.id === myId) || { id: myId, color: getAvailableColor([]) };
                    const myEntry = { ...me, name: pName, isHost: true, isReady: false, isSpectator: false };
                    // 平台 hub：房主自己的代表色以殼 sess.color 為準（非 hub 照舊：沿用既有條目色，沒有條目才隨機分配）
                    if (platSessRef.current && platSessRef.current.hub && isShellColor(platSessRef.current.color)) myEntry.color = platSessRef.current.color;
                    const newList = [myEntry, ...others];
                    // 五戰名單帶入：把還沒進遊戲的選手先種成灰色「未到」席位（真 JOIN 到達時以同名替換）
                    if (tournRosterRef.current) {
                        tournRosterRef.current.forEach(e => {
                            if (!e || !e.name || e.name === pName) return;
                            if (!newList.some(pl => pl.name === e.name)) newList.push({ id: 'pending:' + e.name, name: e.name, isHost: false, color: e.color || getAvailableColor(newList), isReady: false, isSpectator: false, pending: true });
                        });
                    }
                    return newList;
                });

                saveLocalProgress(rId, myId, pName, true, savedProg ? savedProg.d : []);
                if (!isMigrating) {
                    if (savedProg) { setLocalCells(savedProg.d); showToast("📦 已恢復上次對局進度"); }
                    generateAndSync(stateRef.current.sizeId, stateRef.current.diffId, stateRef.current.isBrawlMode ? 'brawl' : 'coop');
                }
                p.on('connection', function (c) {
                    connsRef.current.push(c);
                    c.on('data', function (m) {
                        if (c.uid || m.uid || m.targetId) lastSeenRef.current[c.uid || m.uid || m.targetId] = Date.now();
                        if (m.type === 'PING') { try { c.send({ type: 'PONG' }); } catch (e) {} return; }
                        if (m.type === 'JOIN') {
                            let storedSid = null; { const ls = platSave().read('sudoku_last_session', { fallback: null }); storedSid = ls ? ls.sid : null; }
                            const roomSessionId = stateRef.current.sessionId || storedSid;
                            if (m.sid && roomSessionId && m.sid !== roomSessionId) { c.send({ type: 'JOIN_REJECTED', reason: 'session_mismatch' }); return; }
                            if (playersListRef.current.some(p => p.name === m.pName && p.id !== m.uid && !p.pending)) { c.send({ type: 'JOIN_REJECTED', reason: 'name_conflict' }); return; }
                            connsRef.current = connsRef.current.filter(conn => {
                                if (conn.uid === m.uid && conn !== c) { try { conn.close(); } catch (e) { } return false; }
                                return true;
                            });
                            c.uid = m.uid;
                            const existingPlayer = playersListRef.current.find(pl => pl.id === m.uid);
                            const isSpec = existingPlayer ? existingPlayer.isSpectator : ((stateRef.current.isBrawlMode) && stateRef.current.matchPhase === 'playing');
                            setPlayersList(prev => {
                                let nList;
                                if (prev.find(pl => pl.id === m.uid)) nList = prev.map(pl => pl.id === m.uid ? { ...pl, name: m.pName, isSpectator: isSpec } : pl);
                                else {
                                    const pendIdx = prev.findIndex(pl => pl.pending && pl.name === m.pName);
                                    if (pendIdx >= 0) { // 五戰未到席位被真人頂上：沿用預期名單的顏色與位置
                                        nList = prev.slice();
                                        nList[pendIdx] = { id: m.uid, name: m.pName || "玩家", isHost: false, color: prev[pendIdx].color, isReady: false, isSpectator: isSpec };
                                    } else nList = [...prev, { id: m.uid, name: m.pName || "玩家", isHost: false, color: (platHubRef.current && isShellColor(m.color)) ? m.color : getAvailableColor(prev), isReady: false, isSpectator: isSpec }];
                                }
                                connsRef.current.forEach(conn => {
                                    if (conn === c) conn.send({ type: 'INIT', data: { ...stateRef.current, solutionGrid: solutionGridRef.current }, players: nList, isSpectator: isSpec });
                                    else if (conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: nList });
                                });
                                return nList;
                            });
                            if (!existingPlayer) showToast(`👋 ${m.pName || "玩家"} 已加入對局`); // 重送 JOIN 的冪等回應不再跳提示
                        }
                        else if (m.type === 'SYNC') { if (!isStaleSync(m.data)) { syncState(m.data, false, true); if (m.data.isBrawlMode && m.data.startTime) setMatchStartTime(m.data.startTime - platTimeOffset()); } }
                        else if (m.type === 'PLAYERS_UPDATE') { if (m.players) setPlayersList(m.players); }
                        else if (m.type === 'REQ_READY') {
                            setPlayersList(prev => {
                                const nList = prev.map(p => p.id === m.targetId ? { ...p, isReady: true } : p);
                                connsRef.current.forEach(conn => { if (conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: nList }); });
                                return nList;
                            });
                        }
                        else if (m.type === 'REQ_UNREADY') {
                            setPlayersList(prev => {
                                const nList = prev.map(p => p.id === m.targetId ? { ...p, isReady: false } : p);
                                connsRef.current.forEach(conn => { if (conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: nList }); });
                                return nList;
                            });
                        }
                        else if (m.type === 'REQ_PLAY_DIRECT') {
                            if (isHostRef.current) generateAndSync(stateRef.current.sizeId, stateRef.current.diffId, undefined, true);
                        }
                        else if (m.type === 'REQ_PLAY_AGAIN') {
                            if (isHostRef.current) generateAndSync(stateRef.current.sizeId, stateRef.current.diffId, undefined, false);
                        }
                        else if (m.type === 'REQ_COLOR_CHANGE') handlePlayerColorChange(m.targetId, m.color);
                        else if (m.type === 'REQ_NAME_CHANGE') handlePlayerNameChange(m.targetId, m.name);
                        else if (m.type === 'REQ_SPEC_TOGGLE') {
                            setPlayersList(prev => {
                                const nList = prev.map(p => {
                                    if (p.id === m.targetId) {
                                        const newState = (m.forceState !== undefined && m.forceState !== null) ? m.forceState : !p.isSpectator;
                                        return { ...p, isSpectator: newState, isLobbySpectator: m.isTemp ? p.isLobbySpectator : newState };
                                    }
                                    return p;
                                });
                                connsRef.current.forEach(conn => { if (conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: nList }); });
                                return nList;
                            });
                        }
                        else if (m.type === 'GHOST_I_WON') { if (isHostRef.current && handleBrawlWinRef.current) handleBrawlWinRef.current(m.winInfo); }
                        else if (m.type === 'GHOST_SOLVED') {
                            setGhostHints(prev => {
                                const newHints = { ...prev };
                                if (m.value === null || m.value === undefined) {
                                    if (newHints[m.cellId]) {
                                        const cellHints = { ...newHints[m.cellId] };
                                        delete cellHints[m.uid];
                                        newHints[m.cellId] = cellHints;
                                    }
                                } else {
                                    newHints[m.cellId] = { ...(prev[m.cellId] || {}), [m.uid]: { color: m.color, value: m.value } };
                                }
                                return newHints;
                            });
                            connsRef.current.forEach(conn => { if (conn.open && conn !== c) conn.send(m); });
                        }
                        else if (m.type === 'GHOST_WINNER') { setWinner(m.winner); if (m.winner.id === myId) setEndTime(Date.now()); }
                        else if (m.type === 'CURSOR') {
                            setCursors(prev => ({ ...prev, [m.uid]: { x: m.x, y: m.y } }));
                            connsRef.current.forEach(conn => { if (conn.open && conn !== c) conn.send(m); });
                        }
                        else if (m.type === 'CLICK') {
                            setRipples(prev => [...prev, { id: Date.now() + Math.random(), uid: m.uid, x: m.x, y: m.y, timestamp: Date.now() }]);
                            connsRef.current.forEach(conn => { if (conn.open && conn !== c) conn.send(m); });
                        }
                        else if (m.type === 'REQ_REJOIN') { /* 房主不處理 REQ_REJOIN：原寫法用房主恆為 null 的 connRef 會丟 TypeError；來賓自癒靠自己週期性重送 JOIN（稽核修） */ }
                        else if (m.type === 'RECEIVE_GIFT') {
                            setUnopenedGifts(prev => {
                                const q = prev[m.targetUid] || [];
                                return { ...prev, [m.targetUid]: [...q, m.senderUid || 'system'] };
                            });
                        if (m.targetUid === myId) { try { if (window.PlatFly) PlatFly.fly(PlatFly.byUid('sudoku', m.senderUid), document.getElementById('btn-open-gift') || PlatFly.byUid('sudoku', myId), '🎁'); } catch (e) {} } // H3 禮物 Fly（純顯示層）
                            maybeAutoOpenGift(m.targetUid);
                            connsRef.current.forEach(conn => { if (conn.open && conn !== c) conn.send(m); });
                        }
                        else if (m.type === 'GIFT_OPENED') {
                            if (m.uid !== myId) {
                                setUnopenedGifts(prev => {
                                    const q = prev[m.uid] || [];
                                    const nq = [...q]; nq.shift();
                                    return { ...prev, [m.uid]: nq };
                                });
                            }
                            connsRef.current.forEach(conn => { if (conn.open && conn !== c) conn.send(m); });
                        }
                        else if (m.type === 'GIFT_COUNTER_ATTACK') {
                            if (m.targetUid === myId) { if (handleReceiveCounterAttackRef.current) handleReceiveCounterAttackRef.current(); }
                            connsRef.current.forEach(conn => { if (conn.open && conn !== c) conn.send(m); });
                        }
                        else if (m.type === 'MILESTONE_REACHED') { 
                            if (handleMilestoneRef.current) handleMilestoneRef.current(m); 
                            connsRef.current.forEach(conn => { if (conn.open && conn !== c) conn.send(m); });
                        }
                        else if (m.type === 'RECEIVE_WEAPON') { 
                            if (handleReceiveWeaponRef.current) handleReceiveWeaponRef.current(m); 
                            connsRef.current.forEach(conn => { if (conn.open && conn !== c) conn.send(m); });
                        }
                        else if (m.type === 'WEAPON_HIT_FOG') { 
                            if (handleWeaponHitFogRef.current) handleWeaponHitFogRef.current(m); 
                            connsRef.current.forEach(conn => { if (conn.open && conn !== c) conn.send(m); });
                        }
                        else if (m.type === 'WEAPON_HIT_ERASE') { 
                            if (handleWeaponHitEraseRef.current) handleWeaponHitEraseRef.current(m); 
                            connsRef.current.forEach(conn => { if (conn.open && conn !== c) conn.send(m); });
                        }
                    });
                    c.on('close', function () {
                        if (c.uid) {
                            setPlayersList(prev => {
                                const newList = prev.filter(p => p.id !== c.uid);
                                connsRef.current.forEach(conn => { if (conn !== c && conn.open) conn.send({ type: 'PLAYERS_UPDATE', players: newList }); });
                                return newList;
                            });
                            showToast("👋 一位玩家已斷開連線");
                        }
                        connsRef.current = connsRef.current.filter(conn => conn !== c);
                    });
                });
                p.on('error', function (err) { if (err.type === 'unavailable-id') { showToast("⚠️ 房號已被佔用或正在釋放中，請稍候再試"); setIsConnecting(false); } });
            });
        } else {
            const guestP = new Peer(); peerRef.current = guestP;
            guestP.on('open', function (id) {
                setConnectionStatus("已啟動握手，建立加密通道...");
                const c = guestP.connect('yyh-tgsh-' + rId + '-host'); connRef.current = c;
                c.on('open', function () {
                    setConnectionStatus("已找到主機，同步遊戲資料中...");
                    c.send({ type: 'JOIN', pName: pName, uid: myId, color: myColorRef.current });
                    // JOIN 重送保險：開局瞬間訊息遺失（連線重建/房主端 handler 晚註冊）時，單次 JOIN 一掉就永遠卡在同步畫面。
                    // 房主的 JOIN handler 冪等（已在名單者只更新並回最新 INIT 快照），所以在 waiting 階段每 3 秒重送直到開局。
                    if (joinRetryRef.current) clearInterval(joinRetryRef.current);
                    let joinTries = 0;
                    joinRetryRef.current = setInterval(() => {
                        joinTries++;
                        if (joinTries > 40 || connRef.current !== c || stateRef.current.matchPhase !== 'waiting') { clearInterval(joinRetryRef.current); joinRetryRef.current = null; return; }
                        if (c.open) { try { c.send({ type: 'JOIN', pName: pName, uid: myId, color: myColorRef.current }); } catch (e) {} }
                    }, 3000);
                });
                c.on('data', function (m) {
                    hostSeenRef.current = Date.now();
                    if (m.type === 'PONG') { return; }
                    if (m.type === 'INIT') {
                        setConnectionStatus("同步完成，進入遊戲！");
                        setRoomId(rId); setScreen('game'); setIsHeaderCollapsed(true); setIsConnecting(false);
                        // 強制立刻儲存一次，避開 syncState 的狀態更新延遲 (v3.8.15)
                        saveLocalProgress(rId, myId, pName, false, m.data.isBrawlMode ? m.data.localCells : m.data.cells);
                        syncState(m.data, false, true); setPlayersList(adoptHubPlayers(m.players)); setIsSpectator(m.isSpectator);
                    }
                    else if (m.type === 'SYNC') {
                        if (isStaleSync(m.data)) { /* 上一局遲到的 SYNC：丟棄，不覆寫新局盤面（新局開局包不在此列，見 isStaleSync） */ }
                        else { syncState(m.data, false, true);
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
                    }
                    else if (m.type === 'PLAYERS_UPDATE') { if (m.players) setPlayersList(adoptHubPlayers(m.players)); }
                    else if (m.type === 'GHOST_SOLVED') {
                        setGhostHints(prev => {
                            const newHints = { ...prev };
                            if (m.value === null || m.value === undefined) {
                                if (newHints[m.cellId]) {
                                    const cellHints = { ...newHints[m.cellId] };
                                    delete cellHints[m.uid];
                                    newHints[m.cellId] = cellHints;
                                }
                            } else {
                                newHints[m.cellId] = { ...(prev[m.cellId] || {}), [m.uid]: { color: m.color, value: m.value } };
                            }
                            return newHints;
                        });
                    }
                    else if (m.type === 'GHOST_WINNER') { setWinner(m.winner); if (m.winner.id === myId) setEndTime(Date.now()); }
                    else if (m.type === 'CURSOR') setCursors(prev => ({ ...prev, [m.uid]: { x: m.x, y: m.y } }));
                    else if (m.type === 'CLICK') setRipples(prev => [...prev, { id: Date.now() + Math.random(), uid: m.uid, x: m.x, y: m.y, timestamp: Date.now() }]);
                    else if (m.type === 'JOIN_REJECTED') { if (joinRetryRef.current) { clearInterval(joinRetryRef.current); joinRetryRef.current = null; } setIsConnecting(false); showToast("⚠️ 無法加入：暱稱衝突"); }
                    else if (m.type === 'RECEIVE_GIFT') {
                        setUnopenedGifts(prev => {
                            const q = prev[m.targetUid] || [];
                            return { ...prev, [m.targetUid]: [...q, m.senderUid || 'system'] };
                        });
                        if (m.targetUid === myId) { try { if (window.PlatFly) PlatFly.fly(PlatFly.byUid('sudoku', m.senderUid), document.getElementById('btn-open-gift') || PlatFly.byUid('sudoku', myId), '🎁'); } catch (e) {} } // H3 禮物 Fly（純顯示層）
                        maybeAutoOpenGift(m.targetUid);
                    }
                    else if (m.type === 'GIFT_OPENED') {
                        if (m.uid !== myId) {
                            setUnopenedGifts(prev => {
                                const q = prev[m.uid] || [];
                                const nq = [...q];
                                nq.shift();
                                return { ...prev, [m.uid]: nq };
                            });
                        }
                    }
                    else if (m.type === 'GIFT_COUNTER_ATTACK') { if (m.targetUid === myId) { if (handleReceiveCounterAttackRef.current) handleReceiveCounterAttackRef.current(); } }
                    else if (m.type === 'RECEIVE_WEAPON') { if (handleReceiveWeaponRef.current) handleReceiveWeaponRef.current(m); }
                    else if (m.type === 'WEAPON_HIT_FOG') { if (handleWeaponHitFogRef.current) handleWeaponHitFogRef.current(m); }
                    else if (m.type === 'WEAPON_HIT_ERASE') { if (handleWeaponHitEraseRef.current) handleWeaponHitEraseRef.current(m); }
                });
                c.on('close', function () {
                    if (window.__PLAT_PLATFORM) { showToast("📡 房主連線中斷，正在自動重連…"); return; }
                    const list = playersListRef.current;
                    const others = list.filter(p => !p.isHost && !p.isSpectator);

                    if (others.length === 0) {
                        showToast("⚠️ 與主機連線中斷，轉為單機模式");
                        switchToOffline();
                    } else {
                        const nextHost = others[0];
                        if (myId === nextHost.id) {
                            showToast("👑 原主機離線，您已被自動提升為新房主！正在重組對局...");
                            // 稍微延遲以確保 PeerID 已釋放
                            setTimeout(() => { setupPeerJS(rId, pName, true); }, 1500);
                        } else {
                            showToast(`📡 主機離線，正在等待 ${nextHost.name} 接管房間...`);
                            // 其它玩家嘗試連回新房主
                            setTimeout(() => { setupPeerJS(rId, pName, false); }, 5000);
                        }
                    }
                });
            });
            guestP.on('error', function (err) {
                setIsConnecting(false);
                if (err.type === 'peer-unavailable') showToast("⚠️ 找不到對應房號，主機可能已離線");
                else showToast("⚠️ 連線發生錯誤：" + err.type);
            });
        }
    };
    const renderHostGodView = () => {
        // v1.44 Q5 拍板：廢多盤面總覽，改單盤＋選手切換（與數橋/地雷觀戰同式：主欄白卡、標題統一）
        const activePlayers = playersList.filter(p => !p.isSpectator);
        if (activePlayers.length === 0) return <div className="text-slate-500 text-2xl font-black flex items-center justify-center flex-1">等待玩家加入...</div>;
        const others = activePlayers.filter(p => p.id !== myId);
        const watchable = others.length ? others : activePlayers;
        const sel = watchable.find(p => p.id === godUid) || watchable[0];
        const iFinished = stateRef.current.brawlWinners.some(w => w.id === myId); // 大亂鬥的 winner 要等全場結束才設定；「我已完賽」看 brawlWinners 才準（標題與數橋/地雷同式）
        const size = cSizeDef.size;
        const CS = 40, pw = size * CS;
        return (
            <div className="w-full max-w-md mx-auto bg-white border-4 border-slate-800 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,1)] p-4 md:p-5 animate-fadeIn my-4">
                {/* F2：狀態標籤以 key 換節點＋.plat-lite-in 滾換進場（面板出現/標籤翻面都播） */}
                <div className="font-black text-xl text-slate-800 text-center mb-3"><span key={(winner || iFinished) ? 'fin' : 'spec'} className="plat-lite-in" style={{ display: 'inline-block' }}>{(winner || iFinished) ? '🏁 已完賽・觀戰中' : '👁️ 觀戰中'}</span></div>
                <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                    {watchable.map(p => (
                        <button key={p.id} onClick={() => setGodUid(p.id)} className={"plat-btn-hard plat-btn-hard-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-slate-800 font-black text-xs shadow-[2px_2px_0px_rgba(30,41,59,1)]" + (sel.id === p.id ? " bg-slate-800 text-white" : " bg-white text-slate-700")}>
                            <span className="w-3 h-3 rounded-full border border-slate-800 shrink-0" style={{ background: p.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : p.color }}></span>
                            {p.name} {p.isHost && '👑'} {ghostProgress[p.id] || 0}%
                        </button>
                    ))}
                </div>
                <svg viewBox={`0 0 ${pw} ${pw}`} className="w-full h-auto" style={{ aspectRatio: '1/1', background: '#1e293b', borderRadius: '8px' }}>
                    {cells.map(cell => {
                        const cx = cell.x * CS;
                        const cy = cell.y * CS;
                        let isFilled = false;
                        let color = "rgba(255,255,255,0.05)";
                        let val = "";
                        if (cell.isGiven || cell.isSystemRevealed) {
                            isFilled = true; color = "#475569"; val = cell.value;
                        } else if (ghostHints[cell.id] && ghostHints[cell.id][sel.id]) {
                            isFilled = true;
                            const hint = ghostHints[cell.id][sel.id];
                            color = typeof hint === 'object' ? hint.color : hint;
                            val = typeof hint === 'object' ? hint.value : "";
                        }
                        return (
                            <g key={cell.id}>
                                <rect x={cx + 1} y={cy + 1} width={CS - 2} height={CS - 2} fill={color} fillOpacity={(isFilled && (cell.isGiven || cell.isSystemRevealed || brawlSettings.showNumbersInGodMode)) ? "0.3" : "1"} rx="3" />
                                {isFilled && (cell.isGiven || cell.isSystemRevealed || brawlSettings.showNumbersInGodMode) && (
                                    <text x={cx + CS / 2} y={cy + CS / 2 + 7} textAnchor="middle" fill="white" className="font-black" style={{ fontSize: '20px' }}>{val}</text>
                                )}
                            </g>
                        );
                    })}
                    {Array.from({ length: size + 1 }).map((_, i) => {
                        const isThickX = i % cSizeDef.boxW === 0;
                        const isThickY = i % cSizeDef.boxH === 0;
                        return (
                            <g key={`god-grid-${i}`} className="pointer-events-none">
                                <line x1={i * CS} y1={0} x2={i * CS} y2={pw} stroke="#94a3b8" strokeWidth={isThickX ? 3 : 1} strokeOpacity={isThickX ? 1 : 0.3} strokeLinecap={isThickX ? 'square' : 'butt'} />
                                <line x1={0} y1={i * CS} x2={pw} y2={i * CS} stroke="#94a3b8" strokeWidth={isThickY ? 3 : 1} strokeOpacity={isThickY ? 1 : 0.3} strokeLinecap={isThickY ? 'square' : 'butt'} />
                            </g>
                        );
                    })}
                </svg>
                <div className="mt-3 flex items-center justify-center gap-2 font-black text-slate-700 text-sm">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-800" style={{ background: sel.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : sel.color }}></span>
                    {sel.name} {sel.isHost && '👑'} 的盤面・進度 {ghostProgress[sel.id] || 0}%
                    {stateRef.current.brawlWinners.some(w => w.id === sel.id) && <span className="text-[10px] bg-yellow-400 text-slate-800 px-1.5 py-0.5 rounded font-black shadow-[1px_1px_0px_#000]">已完成</span>}
                </div>
            </div>
        );
    };
    // ==========================================
    // 新增：連線狀態蓋板 (v3.8.14)
    // ==========================================
    if (isConnecting) {
        return (
            <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn">
                <div className="bg-[#fffaf0] p-8 rounded-3xl border-4 border-slate-800 shadow-[10px_10px_0px_rgba(30,41,59,1)] text-center max-sm w-full transform rotate-1">
                    <div className="relative w-20 h-20 mx-auto mb-8">
                        <div className="absolute inset-0 border-8 border-slate-200 rounded-full"></div>
                        <div className="absolute inset-0 border-8 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">📡</div>
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 mb-2">正在建立通訊...</h2>
                    <p className="text-slate-600 font-bold mb-8 h-12 flex items-center justify-center leading-relaxed">
                        {connectionStatus || "初始化連線模組中..."}
                    </p>

                    <div className="space-y-4">
                        {showCancelButton ? (
                            <button onClick={cancelConnection} className="w-full py-4 bg-red-500 text-white border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_#1e293b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all animate-bounce">
                                ❌ 取消連線並返回
                            </button>
                        ) : (
                            <div className="py-4 text-slate-400 font-semibold text-sm animate-pulse italic">
                                請稍候，正努力尋找主機中...
                            </div>
                        )}
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Connection ID: {myId.substring(0, 6)}</p>
                    </div>
                </div>
            </div>
        );
    }

    const tutorialOverlay = showTutorial ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4" onClick={() => setShowTutorial(false)}>
            <div className="bg-[#fffaf0] border-4 border-slate-800 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,1)] max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowTutorial(false)} className="plat-btn-hard plat-btn-hard-2 absolute top-3 right-3 w-9 h-9 bg-white border-[3px] border-slate-800 rounded-full font-black shadow-[2px_2px_0px_rgba(30,41,59,1)] z-10">✕</button>
                <h3 className="text-2xl font-black text-slate-800 border-b-4 border-[#ffcc00] inline-block pb-1 mb-5">❓ 玩法教學</h3>

                <div className={"h-[400px] flex flex-col justify-center bg-white border-[3px] border-slate-800 rounded-xl p-4 mb-4 shadow-[4px_4px_0px_rgba(30,41,59,1)]" + (tutStep !== 0 ? " hidden" : "")}>
                    <div className="flex justify-center mb-3">
                        <div className="grid grid-cols-3 border-[3px] border-slate-800 rounded-lg overflow-hidden w-40">
                            {['5', '', '', '', null, '3', '', '', ''].map((v, i) => (
                                <div key={i} className={"relative aspect-square flex items-center justify-center font-black text-xl border border-slate-300 " + (v === null ? (tutDemoVal === 8 ? 'bg-emerald-50' : tutDemoWrong ? 'bg-rose-50' : 'bg-amber-50') : 'bg-white text-slate-800')}>
                                    {v === null ? (tutDemoVal === 8 ? <span className="text-emerald-600">8</span> : tutDemoWrong ? <span className="text-rose-500">{tutDemoWrong}</span> : <span className="text-amber-400">?</span>) : v}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center gap-2 mb-3">
                        {[7, 8, 9].map(n => (
                            <button key={n} onClick={() => { if (n === 8) { setTutDemoVal(8); setTutDemoWrong(null); } else { setTutDemoVal(null); setTutDemoWrong(n); } }} className="plat-btn-hard plat-btn-hard-3 w-12 h-12 bg-white border-[3px] border-slate-800 rounded-xl font-black text-xl text-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)]">{n}</button>
                        ))}
                    </div>
                    <p className="text-center font-bold text-slate-700">{tutDemoVal === 8 ? '✅ 答對了！中間這格就是 8——先點格子、再按數字鍵，就是這樣填的' : tutDemoWrong ? '❌ ' + tutDemoWrong + ' 不對喔，再想想這一格該填多少' : '動手試試：中間發亮的格子該填哪個數字？點下面的數字鍵試試'}</p>
                </div>

                <div className={"h-[400px] flex flex-col justify-center bg-white border-[3px] border-slate-800 rounded-xl p-4 mb-4 shadow-[4px_4px_0px_rgba(30,41,59,1)]" + (tutStep !== 1 ? " hidden" : "")}>
                    <div className="flex justify-center mb-3">
                        <div className="relative w-20 h-20 border-[3px] border-slate-800 rounded-lg bg-white">
                            <span className="tut-draft-a absolute top-1 left-2 font-black text-slate-400 text-lg">2</span>
                            <span className="tut-draft-b absolute bottom-1 right-2 font-black text-slate-400 text-lg">7</span>
                            <span className="absolute -bottom-3 -right-3 text-2xl">✏️</span>
                        </div>
                    </div>
                    <p className="text-center font-bold text-slate-700">還不確定？先開筆記，把可能的數字記下來</p>
                </div>

                <div className={"h-[400px] flex flex-col justify-center bg-white border-[3px] border-slate-800 rounded-xl p-4 mb-4 shadow-[4px_4px_0px_rgba(30,41,59,1)]" + (tutStep !== 2 ? " hidden" : "")}>
                    <div className="flex justify-center mb-3">
                        <div className="flex border-[3px] border-slate-800 rounded-lg overflow-hidden">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (<div key={n} className="tut-row-cell w-8 h-8 md:w-9 md:h-9 flex items-center justify-center font-black border-r border-slate-300 last:border-r-0" style={{ animationDelay: (n * 0.28) + 's' }}>{n}</div>))}
                        </div>
                    </div>
                    <p className="text-center font-bold text-slate-700">每一行、每一列、每個 3×3 宮，1~9 都不能重複</p>
                </div>

                <div className={"h-[400px] flex flex-col justify-center bg-white border-[3px] border-slate-800 rounded-xl p-4 mb-5 shadow-[4px_4px_0px_rgba(30,41,59,1)]" + (tutStep !== 3 ? " hidden" : "")}>
                    <div className="flex justify-center gap-2 mb-3 flex-wrap">
                        <span className="px-3 py-2 bg-[#ffcc00] border-[3px] border-slate-800 rounded-xl font-black text-sm shadow-[2px_2px_0px_rgba(30,41,59,1)]">🔢 先點數字 → 再點格子</span>
                        <span className="px-3 py-2 bg-sky-300 border-[3px] border-slate-800 rounded-xl font-black text-sm shadow-[2px_2px_0px_rgba(30,41,59,1)]">👆 先點格子 → 再點數字</span>
                    </div>
                    <p className="text-center font-bold text-slate-700">輸入方式自己選，遊戲中在盤面下方隨時切換</p>
                </div>

                <div className="flex justify-center gap-2 mb-5">
                    {[0, 1, 2, 3].map(idx => (<div key={idx} className={"w-2.5 h-2.5 rounded-full border-2 border-slate-800 " + (idx === tutStep ? "bg-[#ffcc00]" : "bg-white")} />))}
                </div>
                <div className="flex gap-3">
                    {tutStep > 0 ? (<button onClick={() => { setTutStep(tutStep - 1); }} className="plat-btn-hard flex-1 py-2.5 border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] bg-white text-slate-800">上一步</button>) : (<div className="flex-1"></div>)}
                    <button onClick={() => setShowTutorial(false)} className="plat-btn-hard flex-1 py-2.5 border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] bg-white text-slate-400">跳過</button>
                    {tutStep < 3 ? (<button onClick={() => { setTutStep(tutStep + 1); }} className="plat-btn-hard flex-1 py-2.5 border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] bg-[#ffcc00] text-slate-900">下一步</button>) : (<button onClick={() => setShowTutorial(false)} className="plat-btn-hard flex-1 py-2.5 border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] bg-emerald-400 text-slate-900">開始遊戲 🎮</button>)}
                </div>
            </div>
        </div>
    ) : null;

    if (screen === 'home') {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center p-4 relative overflow-hidden animate-fadeIn">
                <div className="flex-1 flex flex-col justify-center w-full max-w-md items-center">
                    <div className="bg-[#fffaf0] border-4 border-slate-800 p-10 rounded-xl shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full text-center relative transform -rotate-1 z-10">
                        <h1 className="text-6xl font-black text-slate-800 mb-6 tracking-widest flex justify-center gap-3">
                            <span className="inline-block bg-[#ffcc00] px-4 py-2 border-4 border-slate-800 rounded-xl transform rotate-3 shadow-[4px_4px_0px_rgba(30,41,59,1)]">數</span>
                            <span className="inline-block bg-[#ffcc00] px-4 py-2 border-4 border-slate-800 rounded-xl transform -rotate-2 shadow-[4px_4px_0px_rgba(30,41,59,1)]">獨</span>
                        </h1>
                        <div className="inline-block border-[3px] border-dashed border-slate-800 rounded-xl px-6 py-2 mb-8 bg-white shadow-[4px_4px_0px_rgba(30,41,59,1)] transform rotate-2">
                            <p className="text-slate-800 font-black text-xl tracking-widest uppercase italic">Sudoku Master</p>
                        </div>
                        <div className="flex flex-col gap-5">
                            <button onClick={startSinglePlayer} className="plat-btn-hard w-full py-4 bg-white border-4 border-slate-800 rounded-xl font-black text-xl text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)] transform rotate-1">👤 單機挑戰</button>
                            <button onClick={() => startDailyGame(dailyPickDate)} className="plat-btn-hard w-full py-4 bg-[#ffcc00] border-4 border-slate-800 rounded-xl font-black text-xl text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)] transform rotate-1">📅 每日一題{dailyPickDate !== dailyTodayStr() ? '（' + dailyPickDate.slice(5) + '）' : ''}{dailyRecords[dailyPickDate] ? ' ✓' : ''}</button>
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                <button onClick={() => setDailyPickDate(shiftDateStr(dailyPickDate, -1))} disabled={dailyPickDate <= '2026-01-01'} className="plat-btn-hard plat-btn-hard-2 w-9 h-9 bg-white border-[3px] border-slate-800 rounded-lg font-black shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-30">◀</button>
                                <button onClick={openDailyCal} className="plat-btn-hard plat-btn-hard-2 border-[3px] border-slate-800 rounded-lg px-2 py-1.5 font-black bg-white text-sm text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)]">📅 {dailyPickDate}</button>
                                <button onClick={() => setDailyPickDate(shiftDateStr(dailyPickDate, 1))} disabled={dailyPickDate >= dailyTodayStr()} className="plat-btn-hard plat-btn-hard-2 w-9 h-9 bg-white border-[3px] border-slate-800 rounded-lg font-black shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-30">▶</button>
                                <span className="font-black text-sm text-orange-600">🔥 連續 <PlatNum value={dailyStreak.count || 0} /> 天</span>
                                {dailyRecords[dailyPickDate] ? <span className="font-black text-sm text-emerald-600">最佳 <PlatNum value={formatTime(dailyRecords[dailyPickDate])} /></span> : null}
                            </div>
                            <button onClick={() => { setTutStep(0); setTutDemoVal(null); setTutDemoWrong(null); setShowTutorial(true); }} className="plat-btn-hard w-full py-4 bg-white border-4 border-slate-800 rounded-xl font-black text-xl text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)] transform -rotate-1">❓ 玩法教學</button>
                            {(typeof window !== 'undefined' && window.__PLAT_PLATFORM) && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { if (window.PLAT_show) window.PLAT_show('home'); }} className="plat-btn-hard flex-1 py-3 bg-sky-400 border-4 border-slate-800 rounded-xl font-black text-lg text-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,1)]">🏠 回大廳</button>
                                    {renderDockCapsule(false)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="shrink-0 pb-4 text-slate-800 font-black text-sm opacity-60 tracking-wider z-10">Copyright © 2026 葉大帥. All rights reserved.{' (v' + (window.PLAT_VERSION || '3.13.4') + ')'}</div>
                {tutorialOverlay}
                
            </div>
        );
    }





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
        <div className="h-screen w-screen p-1 md:p-2 flex flex-col items-center font-sans relative" style={{ backgroundColor: '#fdf5e6', backgroundImage: 'radial-gradient(#d3c5ab 2px, transparent 2px)', backgroundSize: '12px 12px' }}>

            {matchPhase === 'waiting' && (
                <div className="absolute inset-0 z-[65] flex items-center justify-center bg-slate-900/80 backdrop-blur-md pointer-events-auto p-4 overflow-y-auto">
                    {engine === 'local' ? (
                    <div className="bg-[#fffaf0] rounded-2xl p-6 md:p-8 border-4 border-slate-800 shadow-[10px_10px_0px_rgba(30,41,59,1)] text-center min-w-[320px] max-w-xl w-full my-auto animate-bounceIn">
                        <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-widest">🧩 單機挑戰設定</h2>
                            <React.Fragment>
                                <div className="flex flex-col gap-6 mb-8 text-left">
                                    {/* 版型設定卡片 */}
                                    <div className="bg-white border-[3px] border-slate-800 rounded-2xl p-5 shadow-[4px_4px_0px_#1e293b] transform rotate-1">
                                        <h3 className="font-semibold text-slate-400 text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span> 📐 選擇版型
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {SIZES.map(s => (
                                                <button key={s.id} onClick={() => setSizeId(s.id)} className={"py-3 border-2 border-slate-800 rounded-xl font-black text-sm transition-all " + (sizeId === s.id ? 'bg-[#ffcc00] text-slate-900 shadow-[3px_3px_0px_#1e293b] -translate-y-0.5' : 'bg-slate-50 text-slate-400 hover:bg-white')}>
                                                    {s.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 難度設定卡片 */}
                                    <div className="bg-white border-[3px] border-slate-800 rounded-2xl p-5 shadow-[4px_4px_0px_#1e293b] transform -rotate-1">
                                        <h3 className="font-semibold text-slate-400 text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> 🔥 挑戰難度
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 plat-seg" data-seg="sudoku-diff">
                                            {DIFFICULTIES.map(d => (
                                                <button key={d.id} data-seg-on={diffId === d.id ? '1' : undefined} onClick={() => setDiffId(d.id)} className={"py-3 border-2 border-slate-800 rounded-xl font-black text-sm transition-all " + (diffId === d.id ? 'bg-[#ffcc00] seg-on text-slate-900 shadow-[3px_3px_0px_#1e293b] -translate-y-0.5' : 'bg-slate-50 text-slate-400 hover:bg-white')}>
                                                    {d.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 單機專屬開始按鈕 */}
                                <button onClick={() => {
                                    generateAndSync(sizeId, diffId);
                                    setMatchPhase('playing');
                                }} className="w-full py-5 bg-emerald-400 text-slate-900 border-4 border-slate-800 rounded-2xl font-black shadow-[6px_6px_0px_rgba(30,41,59,1)] text-2xl hover:translate-y-[2px] hover:shadow-none transition-all active:scale-[0.98]">
                                    🚀 開始挑戰
                                </button>
                            </React.Fragment>
                    </div>
                    ) : (platHub && platTournLock) ? (
                    <div className="bg-[#fffaf0] rounded-2xl p-6 border-4 border-slate-800 shadow-[10px_10px_0px_rgba(30,41,59,1)] max-w-xl w-full my-auto max-h-full overflow-y-auto">
                        <div className="text-center text-4xl mb-1">🏆</div>
                        <div className="font-black text-2xl text-slate-800 text-center">錦標賽・{(tournRoundInfo && tournRoundInfo.playoff) ? '加賽' : ('第 ' + ((tournRoundInfo && tournRoundInfo.round) || '?') + ' 局')}</div>
                        <div className="font-semibold text-slate-400 text-sm text-center mt-1 mb-4">本局：數獨大亂鬥・全員準備好房主才能開始，或等滿 1 分鐘強制開始</div>
                        <div className="flex flex-col gap-2 mb-4">
                            {playersList.filter(p => !p.isSpectator).map(p => (
                                <div key={p.id} className="flex items-center gap-2 bg-white border-2 border-slate-800 rounded-xl px-3 py-2 font-black text-slate-800">
                                    <span className="w-4 h-4 rounded-full border-2 border-slate-800 inline-block shrink-0" style={{ background: p.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : p.color }}></span>
                                    <span className="truncate">{p.name}{p.isHost ? ' 👑' : ''}{p.id === myId ? '（你）' : ''}</span>
                                    <span className="ml-auto shrink-0">{p.pending ? <span className="text-[10px] bg-slate-100 border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded-md">未到</span> : (p.isReady ? <span className="text-[10px] bg-emerald-100 border border-emerald-500 text-emerald-700 px-1.5 py-0.5 rounded-md">✅ 準備好了</span> : <span className="text-[10px] bg-slate-100 border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded-md">未準備</span>)}</span>
                                </div>
                            ))}
                        </div>
                        {tournMyEntry && !tournMyEntry.pending && (
                            <button onClick={handleTournReady} className={"plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 border-[3px] border-slate-800 rounded-xl font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)]" + (tournMyEntry.isReady ? ' bg-amber-400 text-slate-900' : ' bg-white text-slate-500')}>{tournMyEntry.isReady ? '✅ 已準備（點擊取消）' : '✋ 準備好了'}</button>
                        )}
                        {isHost ? (
                            <div>
                                <button onClick={handleForceStart} disabled={!tournCanStart} className="w-full py-3 bg-red-500 text-white border-[3px] border-slate-800 rounded-xl font-black text-lg shadow-[3px_3px_0px_rgba(30,41,59,1)] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed">🏁 開始本局</button>
                                <p className="text-xs text-slate-500 font-semibold text-center mt-2">{tournStartNote}</p>
                            </div>
                        ) : (
                            <p className="font-black text-slate-700 animate-pulse text-center">等待房主開始...</p>
                        )}
                    </div>
                    ) : (platHub) ? (
                    <div className="bg-[#fffaf0] rounded-2xl p-8 border-4 border-slate-800 shadow-[10px_10px_0px_rgba(30,41,59,1)] text-center max-w-xl w-full my-auto">
                        <div className="text-5xl mb-3">⏳</div>
                        <div className="font-black text-2xl text-slate-800 animate-pulse">等房主開始對局…</div>
                        <div className="font-semibold text-slate-400 text-sm mt-2">準備和設定都在房間頁完成了，馬上開始</div>
                    </div>
                    ) : null}
                </div>
            )}

            {resultsDismissedUi && isBrawlMode && matchPhase === 'finished' && (
                <button onClick={() => { resultsDismissRef.current = null; setResultsDismissedUi(false); }} className="plat-btn-hard plat-btn-hard-3 fixed bottom-24 right-3 z-[56] bg-white border-[3px] border-slate-800 rounded-full px-4 py-2 font-black shadow-[3px_3px_0px_#1e293b]">🏆 結果</button>
            )}

            {showExitMenu && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4" onClick={() => setShowExitMenu(false)}>
                    <div className="bg-white border-4 border-[#1e293b] rounded-2xl shadow-[10px_10px_0px_#1e293b] p-6 w-full max-w-xs text-center animate-popUpCenter" onClick={e => e.stopPropagation()}>
                        <div className="font-black text-xl text-[#1e293b] mb-4">要離開對局嗎？</div>
                        {(typeof window !== 'undefined' && window.__PLAT_TOURN_CAN_FORCEEND && window.__PLAT_TOURN_CAN_FORCEEND()) && (
                            <button onClick={() => { setShowExitMenu(false); if (window.__PLAT_TOURN_FORCEEND) window.__PLAT_TOURN_FORCEEND(); }} className="plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 bg-rose-500 text-white border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_#1e293b]">⏹️ 結束本局（錦標賽）</button>
                        )}
                        <button onClick={() => { setShowExitMenu(false); handleBackToLobby(); }} className="plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 bg-white text-slate-800 border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_#1e293b]">🏁 回等待室</button>
                        <button onClick={() => { setShowExitMenu(false); handleGoHome('leave'); }} className="plat-btn-hard plat-btn-hard-3 w-full py-3 mb-2 bg-white text-slate-800 border-[3px] border-slate-800 rounded-xl font-black shadow-[3px_3px_0px_#1e293b]">🚪 退出（回大廳）</button>
                        <button onClick={() => setShowExitMenu(false)} className="w-full py-2 text-slate-400 font-bold hover:text-slate-700">取消</button>
                    </div>
                </div>
            )}

            {/* === 倒數 UI === */}
            {countdownValue !== null && !isGenerating && !(typeof window !== 'undefined' && window.PlatCountdown) && (
                <div className="absolute inset-0 z-[65] flex items-center justify-center bg-slate-900/50 backdrop-blur-md pointer-events-auto">
                    <div className="text-[12rem] font-black text-red-500 drop-shadow-[0_0_30px_rgba(255,0,0,0.8)] animate-pulse" style={{ textShadow: '6px 6px 0 #fff, -6px -6px 0 #fff, 6px -6px 0 #fff, -6px 6px 0 #fff' }}>
                        {countdownValue}
                    </div>
                </div>
            )}

            {/* === 題型與難度設定 Modal === */}
            {showSetupModal && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md pointer-events-auto animate-fadeIn p-4">
                    <div className="bg-[#fffdfa] rounded-2xl p-6 border-[4px] border-[#1e293b] shadow-[10px_10px_0px_#1e293b] relative flex flex-col gap-4 min-w-[300px] max-w-md w-full mx-auto my-auto animate-popUpCenter">
                        <h2 className="text-xl font-black mb-2 border-b-4 border-[#ffcc00] inline-block pb-1">
                            ⚙️ 設定題型與難度
                        </h2>

                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">盤面尺寸：</label>
                            <select value={tempSizeId} onChange={(e) => setTempSizeId(parseInt(e.target.value))} className="w-full px-3 py-2 rounded-xl border-2 border-slate-800 font-bold bg-white text-slate-800 outline-none shadow-[2px_2px_0px_#1e293b] cursor-pointer">
                                {SIZES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="mb-2">
                            <label className="block text-sm font-bold text-slate-600 mb-1">遊戲難度：</label>
                            <select value={tempDiffId} onChange={(e) => setTempDiffId(e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-slate-800 font-bold bg-white text-slate-800 outline-none shadow-[2px_2px_0px_#1e293b] cursor-pointer">
                                {DIFFICULTIES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        <div className="flex gap-3 mt-2">
                            <button onClick={() => setShowSetupModal(false)} className="flex-1 py-3 bg-white border-2 border-slate-800 rounded-xl font-black text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] hover:translate-y-[2px] hover:shadow-none transition-all">取消</button>
                            <button onClick={() => {
                                setShowSetupModal(false);
                                if (isHostRef.current && (sizeId !== tempSizeId || diffId !== tempDiffId)) {
                                    generateAndSync(tempSizeId, tempDiffId);
                                }
                            }} className="flex-1 py-3 bg-[#ffcc00] text-slate-900 border-2 border-slate-800 rounded-xl font-black shadow-[2px_2px_0px_rgba(30,41,59,1)] hover:translate-y-[2px] hover:shadow-none transition-all">確認產生</button>
                        </div>
                    </div>
                </div>
            )}

            {/* === 遊戲功能設定 Modal === */}
            {showBrawlSettings && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md pointer-events-auto animate-fadeIn p-4">
                    <div className="bg-white rounded-2xl p-6 border-[4px] border-[#1e293b] shadow-[10px_10px_0px_#1e293b] relative flex flex-col gap-4 min-w-[300px] max-w-sm w-full mx-auto my-auto">
                        <h2 className={`text-xl font-black mb-2 border-b-4 ${isBrawlMode ? 'border-purple-500' : 'border-sky-500'} inline-block pb-1`}>
                            ⚙️ {isBrawlMode ? '大亂鬥設定' : '遊戲設定'}
                        </h2>

                        {isBrawlMode && (
                            <div className="flex flex-col gap-4">
                                <label className="flex items-center justify-between font-bold text-slate-800">
                                    <span>結束名次 (1~5)</span>
                                    <input type="number" min="1" max="5" value={brawlSettings.winnersCount} onChange={e => {
                                        const val = Math.max(1, Math.min(5, Number(e.target.value)));
                                        const newS = {};
                                        for (let k in brawlSettings) { newS[k] = brawlSettings[k]; }
                                        newS.winnersCount = val;
                                        syncState({ brawlSettings: newS });
                                    }} className="w-16 border-2 border-slate-800 rounded p-1 text-center font-black" />
                                </label>
                                <label className="flex items-center justify-between font-bold text-slate-800 cursor-pointer">
                                    <span>上帝視角顯示數字</span>
                                    <input type="checkbox" checked={brawlSettings.showNumbersInGodMode} onChange={e => {
                                        const newS = { ...brawlSettings };
                                        newS.showNumbersInGodMode = e.target.checked;
                                        syncState({ brawlSettings: newS });
                                    }} className="w-5 h-5 accent-purple-500" />
                                </label>
                                <label className="flex items-center justify-between font-bold text-slate-800 cursor-pointer">
                                    <span>開啟陷害道具 (水球/橡皮擦)</span>
                                    <input type="checkbox" checked={brawlSettings.allowWeapons !== false} onChange={e => {
                                        const newS = { ...brawlSettings };
                                        newS.allowWeapons = e.target.checked;
                                        syncState({ brawlSettings: newS });
                                    }} className="w-5 h-5 accent-purple-500" />
                                </label>
                                {brawlSettings.allowWeapons !== false && (
                                    <label className="flex items-center justify-between font-bold text-slate-800">
                                        <span className="text-sm">陷害道具延遲 (秒)</span>
                                        <input type="number" min="0" max="600" value={brawlSettings.weaponStartTime} onChange={e => {
                                            const val = Math.max(0, Math.min(600, Number(e.target.value)));
                                            const newS = { ...brawlSettings };
                                            newS.weaponStartTime = val;
                                            syncState({ brawlSettings: newS });
                                        }} className="w-20 border-2 border-slate-800 rounded p-1 text-center font-black" />
                                    </label>
                                )}
                            </div>
                        )}

                        <label className="flex items-center justify-between font-bold text-slate-800 cursor-pointer">
                            <span>開啟快速填答</span>
                            <input type="checkbox" checked={brawlSettings.allowQuickFill} onChange={e => {
                                const newS = {};
                                for (let k in brawlSettings) { newS[k] = brawlSettings[k]; }
                                newS.allowQuickFill = e.target.checked;
                                syncState({ brawlSettings: newS });
                            }} className={"w-5 h-5 " + (isBrawlMode ? 'accent-purple-600' : 'accent-red-600') + " cursor-pointer"} />
                        </label>

                        <label className="flex items-center justify-between font-bold text-slate-800 cursor-pointer">
                            <span>開啟循環模式</span>
                            <input type="checkbox" checked={brawlSettings.allowTraversal} onChange={e => {
                                const newS = {};
                                for (let k in brawlSettings) { newS[k] = brawlSettings[k]; }
                                newS.allowTraversal = e.target.checked;
                                syncState({ brawlSettings: newS });
                            }} className={"w-5 h-5 " + (isBrawlMode ? 'accent-purple-600' : 'accent-red-600') + " cursor-pointer"} />
                        </label>

                        <label className="flex items-center justify-between font-bold text-slate-800 cursor-pointer">
                            <span>開啟底塊提示</span>
                            <input type="checkbox" checked={brawlSettings.allowYellowHint} onChange={e => {
                                const newS = {};
                                for (let k in brawlSettings) { newS[k] = brawlSettings[k]; }
                                newS.allowYellowHint = e.target.checked;
                                syncState({ brawlSettings: newS });
                            }} className={"w-5 h-5 " + (isBrawlMode ? 'accent-purple-600' : 'accent-red-600') + " cursor-pointer"} />
                        </label>



                        {isMultiplayer && (
                            <label className="flex items-center justify-between font-bold text-slate-800 cursor-pointer">
                                <span>允許其他玩家按再來一局</span>
                                <input type="checkbox" checked={brawlSettings.allowOthersToPlayAgain !== false} onChange={e => {
                                    const newS = {};
                                    for (let k in brawlSettings) { newS[k] = brawlSettings[k]; }
                                    newS.allowOthersToPlayAgain = e.target.checked;
                                    syncState({ brawlSettings: newS });
                                }} className={"w-5 h-5 " + (isBrawlMode ? 'accent-purple-600' : 'accent-red-600') + " cursor-pointer"} />
                            </label>
                        )}

                        {isMultiplayer && isBrawlMode && (
                            <label className="flex items-center justify-between font-bold text-slate-800 cursor-pointer">
                                <span>開啟獲得與贈送禮物功能</span>
                                <input type="checkbox" checked={brawlSettings.allowGifts !== false} onChange={e => {
                                    const newS = {};
                                    for (let k in brawlSettings) { newS[k] = brawlSettings[k]; }
                                    newS.allowGifts = e.target.checked;
                                    syncState({ brawlSettings: newS });
                                }} className={"w-5 h-5 " + (isBrawlMode ? 'accent-purple-600' : 'accent-red-600') + " cursor-pointer"} />
                            </label>
                        )}

                        <button onClick={() => setShowBrawlSettings(false)} className="mt-4 px-4 py-3 bg-[#ffcc00] border-4 border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] hover:shadow-none transition-all">關閉設定</button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-[1200px] bg-[#fffaf0] rounded-xl border-4 border-slate-800 shadow-[10px_10px_0px_rgba(30,41,59,1)] flex flex-col h-full relative z-10 overflow-hidden">

                <div className={`bg-[#ffcc00] border-b-[3px] border-slate-800 shrink-0 z-50 relative transition-all duration-300 ease-in-out px-2 md:px-4 py-1.5 flex flex-col gap-1.5`}>
                    <div className="flex items-center justify-between gap-2 w-full overflow-x-auto hide-scrollbar pb-0.5">
                        <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                            <h1 className="font-black tracking-tight uppercase text-base md:text-2xl text-[#1e293b] flex items-center gap-1 shrink-0">🔢<span className="hidden sm:inline">數獨 - SUDOKU</span></h1>
                            <div className="flex items-center gap-1 bg-[#1e293b] text-white px-1.5 py-0.5 rounded font-mono font-bold shadow-[2px_2px_0px_rgba(0,0,0,0.4)] text-[10px] md:text-sm whitespace-nowrap shrink-0">
                                <GameTimer startTime={startTime} endTime={isBrawlMode ? (matchPhase === 'finished' ? (stateRef.current.matchEndTime || endTime) : null) : (endTime || (winner ? matchStartTime : null))} isRunning={(isBrawlMode ? matchPhase === 'playing' : !isWon) && !winner && screen === 'game'} matchPhase={matchPhase} />
                            </div>
                            {dailyDate && (<div className="flex items-center gap-1 bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black shadow-[2px_2px_0px_rgba(0,0,0,0.4)] text-[10px] md:text-sm whitespace-nowrap shrink-0">📅 每日 {dailyDate.slice(5)}{dailyDate !== dailyTodayStr() ? ' 補玩' : ''}</div>)}
                            <div className="flex items-center gap-1 shrink-0">
                                {isMultiplayer && (
                                    <React.Fragment>
                                        <span className="bg-emerald-400 text-slate-900 px-1.5 py-0.5 rounded border-2 border-slate-800 font-black text-[10px] md:text-sm shadow-[1px_1px_0px_rgba(30,41,59,1)] flex items-center gap-1 whitespace-nowrap shrink-0">代碼: {roomId}</span>
                                        <button
                                            onClick={() => {
                                                if (isHostRef.current) {
                                                    const currentMode = stateRef.current.isBrawlMode ? 'brawl' : 'coop';
                                                    const nextMode = currentMode === 'coop' ? 'ghost' : (currentMode === 'ghost' ? 'brawl' : 'coop');
                                                    generateAndSync(sizeId, diffId, nextMode);
                                                }
                                            }}
                                            disabled={!isHostRef.current}
                                            className={`${isBrawlMode ? 'bg-purple-600' : 'bg-sky-400'} text-white px-1.5 py-0.5 rounded border-2 border-slate-800 font-black text-[10px] md:text-sm shadow-[1px_1px_0px_rgba(30,41,59,1)] flex items-center gap-1 whitespace-nowrap shrink-0 ${isHostRef.current ? 'cursor-pointer hover:translate-y-[1px] hover:shadow-none active:translate-y-[2px] transition-all' : 'opacity-90 cursor-default'}`}
                                            title={isHostRef.current ? "點擊切換競賽模式（將會重新出題）" : "僅房主可切換模式"}
                                        >
                                            {isBrawlMode ? '⚔️ 大亂鬥' : '🌐 合作模式'}
                                        </button>
                                    </React.Fragment>
                                )}
                                {(!isMultiplayer || isHostRef.current) && (
                                    <button onClick={() => setShowBrawlSettings(true)} className="bg-slate-700 text-white px-1.5 py-0.5 rounded border-2 border-slate-800 font-black text-[10px] md:text-sm shadow-[1px_1px_0px_rgba(30,41,59,1)] hover:translate-y-[1px] hover:shadow-none active:translate-y-[2px] transition-all">
                                        ⚙️ 設定
                                    </button>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)} className="shrink-0 flex px-1.5 py-0.5 bg-[#1e293b] text-white border-2 border-[#1e293b] rounded font-bold text-[10px] md:text-sm shadow-[1px_1px_0px_rgba(0,0,0,0.3)] hover:bg-slate-800 items-center gap-1 whitespace-nowrap">{isHeaderCollapsed ? '🔽 展開規則' : '🔼 縮小面板'}</button>
                    </div>

                    <div className={"plat-collapse-y w-full" + (isHeaderCollapsed ? "" : " open")}>
                        <div className="bg-white border-[3px] border-[#1e293b] rounded-xl p-2 md:p-3 text-[#1e293b] shadow-[4px_4px_0px_#1e293b] flex flex-col md:flex-row gap-3">
                            <div className="flex-1">
                                <h3 className="text-sm md:text-base font-black mb-1 border-b-[3px] border-[#ffcc00] inline-block pb-0.5">📜 遊戲規則</h3>
                                <ol className="list-decimal list-outside ml-4 space-y-1 text-[10px] md:text-sm leading-relaxed font-bold">
                                    <li>選擇上方數字點擊方格。若不選上方數字，可直接點擊盤面已有數字來「智慧吸取」高亮。</li>
                                    <li>輸入方式可在下方切換成「👆 格子先行」：先點格子、再點數字填入，習慣這種順序的玩家適用；切換後會記住你的選擇。</li>
                                    <li>不可重複：若發生衝突，背景會亮起紅色提示。</li>
                                    <li>草稿模式：可在方格內標記多個小數字輔助推理。</li>
                                    <li>長按清除：若填錯數字且上方按鍵已被鎖定（反灰），可長按該格 0.5 秒強制清除。</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-nowrap gap-1.5 items-center w-full overflow-x-auto hide-scrollbar pt-0.5 pb-1">
                        <div className="flex gap-1.5 items-center shrink-0">
                            <button
                                disabled={isMultiplayer && !isHostRef.current}
                                onClick={() => { setTempSizeId(sizeId); setTempDiffId(diffId); setShowSetupModal(true); }}
                                className="plat-btn-hard plat-btn-hard-2 px-2 py-1 md:px-3 md:py-1.5 rounded border-2 border-[#1e293b] font-bold bg-white text-[#1e293b] text-[10px] md:text-sm outline-none shadow-[2px_2px_0px_#1e293b] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0 flex items-center gap-1 hover:translate-y-[1px]"
                                title="設定題型與難度"
                            >
                                ⚙️ {SIZES.find(s => s.id === sizeId)?.name.split(' ')[0]} - {DIFFICULTIES.find(d => d.id === diffId)?.name.split(' ')[1] || '難度'}
                            </button>
                        </div>

                        <div className="flex gap-1.5 items-center ml-auto shrink-0">
                            <button onClick={handlePlayAgain} disabled={isMultiplayer && !isHost} className="plat-btn-hard plat-btn-hard-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-blue-500 text-white border-2 border-[#1e293b] rounded font-bold text-[10px] md:text-sm shadow-[2px_2px_0px_#1e293b] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1 shrink-0" title="新題">🎲<span className="hidden sm:inline">新題</span></button>
                            {(true) && (<button onClick={handleUndo} disabled={history.length === 0 || isWon || (isMultiplayer && !isBrawlMode)} className="plat-btn-hard plat-btn-hard-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-white border-2 border-[#1e293b] rounded font-bold text-[10px] md:text-sm shadow-[2px_2px_0px_#1e293b] disabled:opacity-50 disabled:shadow-none flex items-center gap-1 text-[#1e293b] shrink-0" title="復原">↩️<span className="hidden sm:inline">復原</span></button>)}
                            <button onClick={handleReset} className="plat-btn-hard plat-btn-hard-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-red-500 text-white border-2 border-[#1e293b] rounded font-bold text-[10px] md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1 shrink-0" title="重置">🔄<span className="hidden sm:inline">重置</span></button>
                            <button onClick={() => setShowSaveModal(true)} className="plat-btn-hard plat-btn-hard-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-blue-500 text-white border-2 border-[#1e293b] rounded font-bold text-[10px] md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1 shrink-0" title="存檔/讀檔">💾<span className="hidden sm:inline">存檔</span></button>
                            <button onClick={() => { const m = platAudio().toggleMuted(); setMuted(m); }} className="plat-btn-hard plat-btn-hard-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-white border-2 border-[#1e293b] rounded font-bold text-[10px] md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1 text-[#1e293b] shrink-0" title={muted ? "取消靜音" : "靜音"}>{muted ? '🔇' : '🔊'}</button>
                            <button onClick={() => { const N = typeof window !== 'undefined' ? window.__PLAT_NET : null; if ((N && N.inMatch === 'sudoku') || (typeof window !== 'undefined' && window.__PLAT_TOURN_CAN_FORCEEND && window.__PLAT_TOURN_CAN_FORCEEND())) setShowExitMenu(true); else handleGoHome(); }} className="plat-btn-hard plat-btn-hard-2 bg-white text-[#1e293b] border-2 border-[#1e293b] px-1.5 py-1 md:px-3 md:py-1.5 rounded font-bold text-[10px] md:text-sm shadow-[2px_2px_0px_#1e293b] flex items-center gap-1 shrink-0" title="回首頁/斷線">{!isMultiplayer ? '🏠' : '🔌'}<span className="hidden sm:inline ml-1">{!isMultiplayer ? '回首頁' : '退出'}</span></button>
                        </div>
                    </div>
                </div>

                {isMultiplayer && (
                    <div className="px-2 md:px-4 py-1.5 bg-[#fffdfa] border-b-[3px] border-slate-800 flex flex-nowrap gap-2 items-center relative z-40 shadow-inner shrink-0 overflow-x-auto hide-scrollbar w-full">
                        <span className="font-black text-slate-800 text-xs shrink-0 whitespace-nowrap">👥 玩家：</span>
                        {playersList.map((p, idx) => {
                            const isMe = p.id === myId;
                            const isRainbow = p.color === 'rainbow';
                            const pct = isBrawlMode ? (ghostProgress[p.id] || 0) : ((playerProgress.find(x => x.uid === p.id) || { pct: 0 }).pct || 0);

                            return (
                                <div key={idx} data-fly-uid={p.id} className={`shrink-0 flex flex-col gap-0.5 border-2 border-slate-800 rounded px-1.5 py-0.5 relative cursor-pointer hover:bg-slate-100 transition-colors ${p.isSpectator ? 'opacity-60 bg-slate-100' : 'bg-white'}`}
                                    onClick={() => {
                                        if (platSessRef.current && platSessRef.current.hub) {
                                            // 平台 hub：代表色由殼摩天輪決定，遊戲內不開色票——點自己請殼開摩天輪選色（回呼走既有改色管道）；點別人直接不開
                                            if (isMe && typeof window.__PLAT_PICK_COLOR === 'function') {
                                                window.__PLAT_PICK_COLOR(myCurrentColor, function (c) { if (c) handlePlayerColorChange(myId, c); });
                                            }
                                            return;
                                        }
                                        if (isMe || isHostRef.current) {
                                            setEditName(p.name);
                                            setColorPickerTarget(p.id);
                                        } else {
                                            showToast("⚠️ 只有房主可以更改其他玩家的設定！");
                                        }
                                    }}
                                    title={isMe ? "點擊修改設定" : (isHostRef.current ? "房主可修改他人設定" : "無法修改他人設定")}>
                                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[1px]" style={{ backgroundColor: isRainbow ? 'transparent' : p.color }}>
                                        {isRainbow && <svg className="absolute inset-0 w-full h-full pointer-events-none"><rect width="100%" height="100%" fill="url(#rainbowGrad)" /></svg>}
                                    </div>

                                    <div className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-slate-800 pl-1.5 whitespace-nowrap">
                                        {p.name} {p.isHost && '👑'} {p.isSpectator && ' 👁️'} {isMe && '(你)'}
                                        <span className="text-emerald-600 font-mono ml-1"><PlatPct value={pct} /></span>
                                    </div>
                                    <div className="w-24 md:w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-1.5 relative border border-slate-300">
                                        <div className="h-full plat-pbar relative overflow-hidden" style={{ width: `${pct}%`, backgroundColor: isRainbow ? 'transparent' : p.color }}>
                                            {isRainbow && <svg className="absolute inset-0 w-full h-full pointer-events-none"><rect width="100%" height="100%" fill="url(#rainbowGrad)" /></svg>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="ml-auto shrink-0 flex items-center pl-2 gap-2">
                            {engineRef.current === 'peerjs' && !isBrawlMode && (
                                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] md:text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-1.5 py-1 rounded border-2 border-slate-300 shadow-[1px_1px_0px_rgba(30,41,59,1)] whitespace-nowrap">
                                    <input type="checkbox" checked={showOtherCursors} onChange={(e) => setShowOtherCursors(e.target.checked)} className="w-3 h-3 accent-emerald-500" />顯示游標
                                </label>
                            )}
                            {isMultiplayer && isBrawlMode && (
                                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] md:text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-1.5 py-1 rounded border-2 border-slate-300 shadow-[1px_1px_0px_rgba(30,41,59,1)] whitespace-nowrap">
                                    <input type="checkbox" checked={showGhostProgress} onChange={(e) => setShowGhostProgress(e.target.checked)} className="w-3 h-3 accent-purple-500" />顯示對手色塊
                                </label>
                            )}
                        </div>
                    </div>
                )}

                {!isHeaderCollapsed && (
                    <div className="h-6 md:h-8 shrink-0 flex items-center justify-center bg-slate-800 text-white border-b-4 border-slate-800 relative z-30 font-bold tracking-wide">
                        <span className="text-[10px] md:text-sm hidden md:inline">支援滑鼠拖曳、滾輪縮放；下方工具列可切換模式與縮放。{' (v' + (window.PLAT_VERSION || '3.13.4') + ')'}</span>
                        <span className="text-[10px] md:text-sm md:hidden">點選上方數字再點擊方格。支援雙指縮放與平移。</span>
                    </div>
                )}

                <div className="relative z-0 flex-1 flex flex-col min-h-0 bg-[#fffaf0]">

                    {isGenerating && (
                        <div className="absolute inset-0 z-[40] flex flex-col items-center justify-center pointer-events-none bg-[#fffaf0]/80 backdrop-blur-sm">
                            <div className="text-slate-800 font-black text-2xl md:text-4xl tracking-widest flex items-center select-none animate-pulse mb-4">
                                <div className="relative inline-flex items-center justify-center">
                                    <span>題目生成中</span>
                                    <span className="absolute left-full animate-loading-dots w-[1.5em] text-left"></span>
                                </div>
                            </div>
                            {genProgress && (
                                <div className="text-slate-600 font-bold text-sm md:text-base animate-fadeIn whitespace-pre-line text-center">
                                    {genProgress}
                                </div>
                            )}
                            <div className="text-emerald-600 font-bold text-xs mt-2 opacity-80">
                                *嚴格唯一解運算較耗時，請稍候*
                            </div>
                        </div>
                    )}

                    {/* 頂部數字鍵盤：套用干擾洗牌邏輯與翻轉特效 (自動縮放，不需滾動) */}
                    {!isSpectator && (
                        <div className="flex flex-nowrap gap-0.5 sm:gap-1 md:gap-2 justify-center w-full px-1 sm:px-2 py-2 md:py-3 bg-[#f8fafc] border-b-[3px] border-slate-800 shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.05)] z-20 select-none" style={{ perspective: '1000px' }}>
                            {keyMapping.map((c, idx) => {
                                const isCompleted = completedChars.has(c);
                                const isFlipping = flippedKeys.includes(idx);

                                return (
                                    <button
                                        key={`keybtn-${idx}`}
                                        onPointerDown={(e) => { const trk = platTapNew({ slop: 22 }); trk.down(e.clientX, e.clientY, Date.now()); padTapRef.current = { c: c, trk: trk }; }}
                                        onPointerUp={(e) => { const pt2 = padTapRef.current; padTapRef.current = null; if (pt2) { const r = pt2.trk.up(e.clientX, e.clientY, Date.now()); supTrk().markSuppress(Date.now()); if (pt2.c === c && r.type === 'tap') onNumClick({ preventDefault: () => {} }, c); } }}
                                        onPointerCancel={() => { const pt2 = padTapRef.current; padTapRef.current = null; if (pt2) pt2.trk.cancel(); }}
                                        onClick={(e) => { if (supTrk().shouldSuppressClick(Date.now())) return; onNumClick(e, c); }}
                                        title={isCompleted ? `已經填滿 ${c}` : `點擊選取 ${c}`}
                                        className={`select-none flex-1 min-w-[24px] max-w-[48px] aspect-square rounded-md sm:rounded-lg md:rounded-xl text-sm sm:text-lg md:text-2xl font-black border-2 md:border-[3px] border-slate-800 flex items-center justify-center p-0 key-btn
                       ${isFlipping ? 'anim-key-flip' : ''}
                       ${isCompleted ? 'bg-slate-300 text-slate-500 opacity-60 cursor-pointer shadow-none' :
                                                selectedChar === c ? 'bg-[#ffcc00] text-slate-900 scale-110 shadow-[2px_2px_0px_rgba(30,41,59,1)] sm:shadow-[4px_4px_0px_rgba(30,41,59,1)] hover:scale-110' : 'bg-white text-slate-700 hover:bg-slate-50 shadow-[1px_1px_0px_rgba(30,41,59,1)] sm:shadow-[2px_2px_0px_rgba(30,41,59,1)]'}
                       ${!isCompleted && !isFlipping ? 'active:translate-y-1 active:shadow-none' : ''}`}
                                    >
                                        {c}
                                    </button>
                                );
                            })}
                        </div>
                    )}


                    <div ref={zoomContainerRef} className="px-2 pt-2 pb-28 md:px-6 md:pt-6 md:pb-24 flex-1 overflow-auto custom-scrollbar plat-chat-clear relative z-0 flex flex-col">
                        {isSpectator || (isBrawlMode && winner && finishViewMode === 'god') ? (
                            isBrawlMode ? renderHostGodView() : (
                                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                                    <div className="bg-white border-4 border-slate-800 rounded-xl p-6 md:p-10 shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full max-w-2xl text-center">
                                        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2 tracking-widest">📡 賽況轉播中</h2>
                                        <p className="text-slate-500 font-bold mb-8">您以觀戰者身分加入，請為場上玩家加油！</p>

                                        <div className="flex flex-col gap-5 text-left">
                                            {playersList.filter(p => !p.isSpectator).map(p => {
                                                const pct = ghostProgress[p.id] || 0;
                                                return (
                                                    <div key={p.id} className="flex flex-col gap-2">
                                                        <div className="flex justify-between font-black text-slate-700 items-center">
                                                            <span className="flex items-center gap-2">
                                                                <span className="w-4 h-4 rounded-full border-2 border-slate-800" style={{ backgroundColor: p.color === 'rainbow' ? '#ffcc00' : p.color }}></span>
                                                                {p.name} {p.isHost && '👑'}
                                                            </span>
                                                            <span className="text-emerald-600 font-mono text-lg"><PlatPct value={pct} /></span>
                                                        </div>
                                                        <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-800 shadow-inner">
                                                            <div className="h-full plat-pbar" style={{ width: `${pct}%`, backgroundColor: p.color === 'rainbow' ? '#ffcc00' : p.color }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {playersList.filter(p => !p.isSpectator).length === 0 && (
                                                <div className="text-center text-slate-400 font-bold py-4">目前場上沒有比賽玩家</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="flex justify-center items-center min-w-max min-h-max m-auto pb-32 pr-20" style={countdownValue !== null ? { filter: 'blur(18px)', pointerEvents: 'none' } : { transition: 'filter 0.3s' }}>
                                <svg
                                    ref={svgRef}
                                    onPointerMove={handlePointerMove}
                                    onPointerDown={handlePointerDown}
                                    onPointerUp={handlePointerUp}
                                    onPointerLeave={(e) => { handlePointerUp(e); if (eraserRef.current) eraserRef.current.style.display = 'none'; }}
                                    onPointerCancel={handlePointerUp}
                                    viewBox={`0 0 ${svgW} ${svgH}`}
                                    className="bg-transparent transition-transform duration-100 ease-out origin-center select-none"
                                    style={{ width: `${svgW * zoomLevel}px`, height: `${svgH * zoomLevel}px`, touchAction: (interactionMode >= 2) ? 'none' : 'manipulation' }}>
                                    <defs>
                                        <linearGradient id="rainbowGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={svgW} y2={svgH}>
                                            <stop offset="0%" className="rainbow-stop" />
                                            <stop offset="100%" className="rainbow-stop" />
                                        </linearGradient>
                                        {/* 水球顏料遮罩漸層：繽紛紫色系 */}
                                        <radialGradient id="fogGrad" cx="50%" cy="45%" r="60%">
                                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.95" />
                                            <stop offset="40%" stopColor="#7c3aed" stopOpacity="0.90" />
                                            <stop offset="80%" stopColor="#db2777" stopOpacity="0.85" />
                                            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.75" />
                                        </radialGradient>
                                        {/* 水球凍結漸層：冰藍高不透明（不靠 emoji 遮數字，任何手機都看不到底下的數字） */}
                                        <radialGradient id="frostGrad" cx="50%" cy="45%" r="65%">
                                            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.97" />
                                            <stop offset="55%" stopColor="#7dd3fc" stopOpacity="0.95" />
                                            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.92" />
                                        </radialGradient>
                                    </defs>

                                    {/* 1+2+3. 網格層：合併渲染以優化效能 (v3.8.0) */}
                                    <g transform={`translate(${PADDING}, ${PADDING})`}>
                                        {/* 先畫所有格子底色 */}
                                        {activeCells.map(cell => {
                                            const hasConflict = conflictCellIds.has(cell.id);
                                            const yellowAllowed = stateRef.current.brawlSettings.allowYellowHint;
                                            const isExactMatch = selectedChar !== null && cell.value === selectedChar && interactionMode < 2;
                                            const isHighlightZone = yellowAllowed && highlightZones.has(cell.id);
                                            const isFilledWithOther = yellowAllowed && selectedChar !== null && cell.value !== null && cell.value !== selectedChar && interactionMode < 2;
                                            let fillColor = '#ffffff';
                                            if (hasConflict) fillColor = '#fee2e2';
                                            else if (inputMode === 'cell' && selectedCellId === cell.id) fillColor = '#bae6fd';
                                            else if (isExactMatch) fillColor = '#fde047';
                                            else if (isHighlightZone || isFilledWithOther) fillColor = '#fef8cb';
                                            else if (isSpectator && cell.isGiven) fillColor = '#f1f5f9'; // 上帝視角下的題目背景：淺灰色 (v3.10.12)
                                            
                                            return (
                                                <React.Fragment key={`bg-${cell.id}`}>
                                                    <rect x={cell.x * CELL_SIZE} y={cell.y * CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE} fill={fillColor} className="transition-colors duration-300 pointer-events-none" />
                                                    {pressedCellId === cell.id && <rect x={cell.x * CELL_SIZE + 1} y={cell.y * CELL_SIZE + 1} width={CELL_SIZE - 2} height={CELL_SIZE - 2} fill="#0f172a" rx="3" className="sudoku-pressfx pointer-events-none" />}
                                                </React.Fragment>
                                            );
                                        })}
                                    </g>

                                    {/* 2. 中層：塗鴉筆跡 */}
                                    {strokes.map(s => {
                                        const strokeUid = s.uid || s.id.split('-')[1]; const isOwnStroke = strokeUid === myId;
                                        let strokeColor = s.color; let strokeOpacity = 1; let isRainbow = false;
                                        if (strokeUid) { strokeColor = getPlayerColor(strokeUid); if (strokeColor === 'rainbow') isRainbow = true; strokeOpacity = (isMultiplayer && !isOwnStroke) ? 0.5 : 1; }
                                        return <path key={s.id} d={s.path} fill="none" stroke={isRainbow ? undefined : strokeColor} strokeOpacity={strokeOpacity} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className={`doodle-stroke ${isRainbow ? 'rainbow-stroke' : ''}`} data-stroke-id={s.id} style={{ pointerEvents: (interactionMode === 2 && drawSubMode === 'eraser' && isOwnStroke) ? 'stroke' : 'none' }} />;
                                    })}
                                    <path ref={drawingPathRef} fill="none" stroke={myCurrentColor === 'rainbow' ? undefined : myCurrentColor} strokeOpacity={1} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className={`pointer-events-none ${myCurrentColor === 'rainbow' ? 'rainbow-stroke' : ''}`} style={{ display: 'none' }} />

                                    {/* 3. 上層：網格線與文字 */}
                                    <g transform={`translate(${PADDING}, ${PADDING})`}>
                                        {Array.from({ length: cSizeDef.size + 1 }).map((_, i) => {
                                            const isThickX = i % cSizeDef.boxW === 0; const isThickY = i % cSizeDef.boxH === 0;
                                            return (
                                                <g key={`grid-line-${i}`} className="pointer-events-none">
                                                    <line x1={i * CELL_SIZE} y1={0} x2={i * CELL_SIZE} y2={cSizeDef.size * CELL_SIZE} stroke="#1e293b" strokeWidth={isThickX ? 4 : 1} strokeLinecap={isThickX ? 'square' : 'butt'} />
                                                    <line x1={0} y1={i * CELL_SIZE} x2={cSizeDef.size * CELL_SIZE} y2={i * CELL_SIZE} stroke="#1e293b" strokeWidth={isThickY ? 4 : 1} strokeLinecap={isThickY ? 'square' : 'butt'} />
                                                </g>
                                            );
                                        })}

                                        {/* 點擊熱區與數字內容 */}
                                        {activeCells.map(cell => {
                                            const cx = cell.x * CELL_SIZE; const cy = cell.y * CELL_SIZE;
                                            let valColor = "#1e293b"; let isRainbow = false;
                                            if (!cell.isGiven && cell.value && cell.owner) {
                                                valColor = getPlayerColor(cell.owner); if (valColor === 'rainbow') isRainbow = true;
                                            }
                                            if (cell.isSystemRevealed) {
                                                valColor = "#1e293b";
                                                isRainbow = false;
                                            }

                                            return (
                                                <g key={`cell-${cell.id}`} id={`cell-${cell.id}`} onClick={() => { if (supTrk().shouldSuppressClick(Date.now())) return; handleCellClick(cell.id); }} className={interactionMode >= 2 ? 'pointer-events-none' : 'cursor-pointer group'}>
                                                    <rect x={cx} y={cy} width={CELL_SIZE} height={CELL_SIZE} fill="transparent" className={interactionMode >= 2 ? '' : 'hover:fill-yellow-600/20 transition-colors'} />

                                                    {erasingCells[cell.id] && (
                                                        <g className="pointer-events-none select-none" style={{ animation: 'eraseFade 0.5s ease-in forwards' }}>
                                                            <text x={cx + CELL_SIZE / 2} y={cy + CELL_SIZE / 2 + 2} textAnchor="middle" dominantBaseline="central" fontSize={CELL_SIZE * 0.6} fontWeight="bold" fill={isRainbow ? undefined : valColor} className={isRainbow ? 'rainbow-fill' : ''}>
                                                                {erasingCells[cell.id].value}
                                                            </text>
                                                            <text x={cx + CELL_SIZE / 2 + 10} y={cy + CELL_SIZE / 2 - 10} textAnchor="middle" dominantBaseline="central" fontSize={CELL_SIZE * 0.4}>
                                                                🧹
                                                            </text>
                                                        </g>
                                                    )}

                                                    {(() => {
                                                        // 上帝視角視覺分層 (v3.10.12)
                                                        if (isSpectator) {
                                                            if (cell.isGiven) {
                                                                const originalCell = stateRef.current.levelData?.cells?.find(c => c.id === cell.id);
                                                                return (
                                                                    <text x={cx + CELL_SIZE / 2} y={cy + CELL_SIZE / 2 + 2} textAnchor="middle" dominantBaseline="central" fontSize={CELL_SIZE * 0.6} fontWeight="900" fill="#1e293b" className="pointer-events-none select-none opacity-40">
                                                                        {originalCell?.value || cell.value}
                                                                    </text>
                                                                );
                                                            }
                                                            // 如果是上帝且不是題目，但「上帝視角顯示數字」關閉，則不顯示數字 (即便 cell.value 有值)
                                                            if (!brawlSettings.showNumbersInGodMode) {
                                                                return null;
                                                            }
                                                        }
                                                        
                                                        if (cell.value) {
                                                            return (
                                                                <text x={cx + CELL_SIZE / 2} y={cy + CELL_SIZE / 2 + 2} textAnchor="middle" dominantBaseline="central" fontSize={CELL_SIZE * 0.6} fontWeight={cell.isGiven || cell.isSystemRevealed ? "900" : "bold"} fill={isRainbow ? undefined : valColor} className={`pointer-events-none select-none ${isRainbow ? 'rainbow-fill' : ''}`}>
                                                                    {cell.value}
                                                                </text>
                                                            );
                                                        }
                                                        
                                                        return cell.drafts.map(d => {
                                                            const idx = cSizeDef.chars.indexOf(d); let dx, dy, fontSize;
                                                            if (cSizeDef.size === 4) { dx = (idx % 2) * (CELL_SIZE / 2) + (CELL_SIZE / 4); dy = Math.floor(idx / 2) * (CELL_SIZE / 2) + (CELL_SIZE / 4); fontSize = CELL_SIZE * 0.3; }
                                                            else if (cSizeDef.size === 9) { dx = (idx % 3) * (CELL_SIZE / 3) + (CELL_SIZE / 6); dy = Math.floor(idx / 3) * (CELL_SIZE / 3) + (CELL_SIZE / 6); fontSize = CELL_SIZE * 0.25; }
                                                            else { dx = (idx % 4) * (CELL_SIZE / 4) + (CELL_SIZE / 8); dy = Math.floor(idx / 4) * (CELL_SIZE / 4) + (CELL_SIZE / 8); fontSize = CELL_SIZE * 0.18; }

                                                            const isDraftSelected = d === selectedChar;

                                                            return (
                                                                <g key={`draft-${d}`} className="pointer-events-none">
                                                                    <text
                                                                        x={cx + dx}
                                                                        y={cy + dy + 1}
                                                                        textAnchor="middle"
                                                                        dominantBaseline="central"
                                                                        fontSize={isDraftSelected ? fontSize * 1.2 : fontSize}
                                                                        fontWeight={isDraftSelected ? "900" : "bold"}
                                                                        fill={isDraftSelected ? "#facc15" : "#64748b"}
                                                                        stroke={isDraftSelected ? "#1e293b" : "none"}
                                                                        strokeWidth={isDraftSelected ? 2 : 0}
                                                                        strokeLinejoin="round"
                                                                        paintOrder="stroke"
                                                                        className="select-none transition-all duration-200"
                                                                    >
                                                                        {d}
                                                                    </text>
                                                                </g>
                                                            );
                                                        });
                                                    })()}
                                                </g>
                                            );
                                        })}
                                    </g>

                                    {/* 4. 幽靈對手進度：右上角方塊 (保證不被覆蓋) */}
                                    <g transform={`translate(${PADDING}, ${PADDING})`}>
                                        {isBrawlMode && showGhostProgress && activeCells.map(cell => {
                                            const ghostInfo = ghostHints[cell.id];
                                            if (!ghostInfo || cell.isGiven || cell.isSystemRevealed) return null;
                                            return Object.entries(ghostInfo).map(([uid, hint], idx) => {
                                                if (uid === myId) return null; // 不顯示自己的
                                                
                                                // 只有一位填答者時，且是上帝模式，畫出「大方塊」覆蓋格子背景
                                                const isOnlyOneHint = Object.keys(ghostInfo).length === 1;
                                                const sqSize = isSpectator && isOnlyOneHint ? CELL_SIZE - 4 : 10;
                                                const col = idx % 5;
                                                const row = Math.floor(idx / 5);
                                                const offsetX = isSpectator && isOnlyOneHint ? 2 : col * (sqSize + 2);
                                                const offsetY = isSpectator && isOnlyOneHint ? 2 : row * (sqSize + 2);
                                                
                                                let playerColor = (typeof hint === 'object' ? hint.color : hint) || getPlayerColor(uid);
                                                return (
                                                    <rect key={`ghost-${cell.id}-${uid}`} x={cell.x * CELL_SIZE + (isSpectator && isOnlyOneHint ? 2 : CELL_SIZE - sqSize - 2 - offsetX)} y={cell.y * CELL_SIZE + (isSpectator && isOnlyOneHint ? 2 : 2 + offsetY)} width={sqSize} height={sqSize} fill={playerColor === 'rainbow' ? 'url(#rainbowGrad)' : playerColor} opacity={isSpectator && isOnlyOneHint ? "0.85" : "0.95"} rx={isSpectator && isOnlyOneHint ? "8" : "2"} className="pointer-events-none ghost-highlight" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                                                );
                                            });
                                        })}
                                    </g>

                                    {/* 舊版盤面實體化禮物已廢除，改為右下角懸浮 UI */}



                                    {/* 5. 最頂層：游標與橡皮擦 */}
                                    <circle ref={eraserRef} r="15" fill={myCurrentColor === 'rainbow' ? undefined : myCurrentColor} fillOpacity="0.4" stroke={myCurrentColor === 'rainbow' ? undefined : myCurrentColor} strokeWidth="2" className={`pointer-events-none ${myCurrentColor === 'rainbow' ? 'rainbow-stroke rainbow-fill' : ''}`} style={{ display: 'none' }} />

                                    {!isBrawlMode && Object.entries(cursors).map(entry => {
                                        const uid = entry[0]; const pos = entry[1]; if (uid === myId) return null;
                                        const player = playersList.find(p => p.id === uid); if (!player) return null;
                                        const isRainbow = player.color === 'rainbow';
                                        return (
                                            <g key={`cursor-${uid}`} transform={`translate(${pos.x}, ${pos.y})`} className="pointer-events-none transition-transform duration-75 ease-linear">
                                                <path d="M0,0 L16,6 L10,10 L15,19 L11,21 L6,12 L0,18 Z" fill={isRainbow ? undefined : player.color} stroke="white" strokeWidth="2" className={isRainbow ? 'rainbow-fill' : ''} />
                                                <rect x="14" y="22" rx="4" ry="4" width={player.name.length * 14 + 12} height="22" fill="rgba(0,0,0,0.6)" />
                                                <text x="20" y="37" fill="white" fontSize="13" fontWeight="bold">{player.name}</text>
                                            </g>
                                        );
                                    })}
                                    {!isBrawlMode && ripples.map(r => {
                                        const player = playersList.find(p => p.id === r.uid); const color = player ? player.color : '#3b82f6'; const isRainbow = color === 'rainbow';
                                        return <circle key={r.id} cx={r.x} cy={r.y} r="20" fill="none" stroke={isRainbow ? undefined : color} className={`pointer-events-none ${isRainbow ? 'rainbow-stroke' : ''}`} style={{ transformOrigin: `${r.x}px ${r.y}px`, animation: 'rippleAnim 0.8s ease-out forwards' }} />;
                                    })}
                                    {/* 6. 霧化遮罩層：水球砸到的宮格顯示顏料遮罩 10 秒 (移至最頂層) */}
                                    <g transform={`translate(${PADDING}, ${PADDING})`}>
                                        {isBrawlMode && Object.entries(foggedBoxes).map(([boxIdStr, expiry]) => {
                                            const boxId = parseInt(boxIdStr);
                                            const boxRow = Math.floor(boxId / (cSizeDef.size / cSizeDef.boxH));
                                            const boxCol = boxId % (cSizeDef.size / cSizeDef.boxW);
                                            const bx = boxCol * cSizeDef.boxW * CELL_SIZE;
                                            const by = boxRow * cSizeDef.boxH * CELL_SIZE;
                                            const bw = cSizeDef.boxW * CELL_SIZE;
                                            const bh = cSizeDef.boxH * CELL_SIZE;

                                            return (
                                                <g key={`fog-${boxId}`} style={{ animation: 'fogFade 10s ease-in-out forwards', pointerEvents: 'none' }}>
                                                    <rect x={bx} y={by} width={bw} height={bh} fill="url(#frostGrad)" stroke="#38bdf8" strokeWidth="2.5" />
                                                    <text
                                                        x={bx + bw / 2}
                                                        y={by + bh / 2}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                        fontSize={`${Math.min(bw, bh) * 0.62}px`}
                                                        className="pointer-events-none"
                                                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                                                    >
                                                        ❄️
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </g>
                                </svg>
                            </div>
                        )}
                    </div>


                    {(isWon || (isBrawlMode && winner)) && !hideVictoryModal && !(isBrawlMode && typeof window !== 'undefined' && window.PlatResults) && (
                        <div className={`absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] pointer-events-auto ${isClosingModal ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
                            <div className={`bg-white rounded-2xl p-6 md:p-8 border-[4px] border-[#1e293b] shadow-[10px_10px_0px_#1e293b] text-center min-w-[280px] md:min-w-[320px] relative ${isClosingModal ? 'animate-popOutCenter' : 'animate-popUpCenter'}`}>
                                <button onClick={closeVictoryModal} className="absolute top-2 right-4 text-slate-400 hover:text-[#1e293b] text-2xl font-black">✕</button>
                                {isBrawlMode ? (
                                    <div className="w-full">
                                        <div className="text-5xl mb-2">⚔️🏆</div>
                                        <h2 className="text-3xl font-black text-purple-700 mb-3 uppercase tracking-wide">大亂鬥結果！</h2>
                                        <div className="flex flex-col gap-2 mb-5 text-left max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                                            {brawlWinners.map((w, i) => {
                                                const medals = ['🥇', '🥈', '🥉'];
                                                const medal = medals[i] || `${i + 1}`;
                                                return (
                                                    <div key={w.id} className="flex items-center gap-3 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 shadow-sm animate-fadeIn">
                                                        <span className="text-2xl w-8 shrink-0 text-center">{medal}</span>
                                                        <span className="w-3 h-full shrink-0 rounded-full self-stretch" style={{ backgroundColor: w.color === 'rainbow' ? 'transparent' : w.color, minWidth: '4px', maxWidth: '4px', background: w.color === 'rainbow' ? 'linear-gradient(to bottom, red, orange, yellow, green, blue, indigo, violet)' : w.color }}></span>
                                                        <span className="font-black text-slate-800 flex-1 truncate">{w.name}</span>
                                                        <span className="font-mono text-blue-600 text-sm shrink-0">⏱ {w.time}</span>
                                                    </div>
                                                );
                                            })}
                                            {(() => {
                                                const limit = brawlSettings.winnersCount || 1;
                                                const placeholders = [];
                                                for (let i = brawlWinners.length; i < limit; i++) {
                                                    const medals = ['🥇', '🥈', '🥉'];
                                                    const medal = medals[i] || `${i + 1}`;
                                                    placeholders.push(
                                                        <div key={`wait-${i}`} className="flex items-center gap-3 bg-slate-100/50 border-2 border-slate-100 border-dashed rounded-xl px-3 py-2 opacity-50">
                                                            <span className="text-2xl w-8 shrink-0 text-center filter grayscale">{medal}</span>
                                                            <span className="w-1 h-full shrink-0 bg-slate-300 rounded-full self-stretch"></span>
                                                            <span className="font-semibold text-slate-400 flex-1 italic text-sm">等待第 {i + 1} 名完成...</span>
                                                        </div>
                                                    );
                                                }
                                                return placeholders;
                                            })()}
                                            {brawlWinners.length === 0 && <div className="text-slate-400 text-center font-bold py-4">尚無完成者</div>}
                                        </div>
                                        <div className="border-t-2 border-dashed border-slate-200 pt-3 mb-2"></div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-6xl mb-3">💥🏆</div>
                                        <h2 className="text-3xl font-black text-[#1e293b] mb-1 uppercase tracking-wide">完美通關！</h2>
                                        <p className="text-slate-600 mb-6 text-sm font-bold border-b-2 border-dashed border-slate-300 pb-4">完成時間：{endTime ? formatTime(Math.floor((endTime - startTime) / 1000)) : "00:00"}</p>
                                    </div>
                                )}
                                <div className="flex justify-center gap-3 flex-wrap w-full mt-4">
                                    {!isMultiplayer ? (
                                        <React.Fragment>
                                            <button onClick={handlePlayAgain} className="flex-1 px-3 py-3 bg-[#ffcc00] text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] hover:shadow-none transition-all text-sm sm:text-base">下一題 (同設定)</button>
                                            <button onClick={handleGoHome} className="flex-1 px-3 py-3 bg-white text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] hover:shadow-none transition-all text-sm sm:text-base">返回主選單</button>
                                        </React.Fragment>
                                    ) : (
                                        <React.Fragment>
                                            {matchPhase === 'finished' ? (
                                                (isHostRef.current || stateRef.current.brawlSettings.allowOthersToPlayAgain !== false) ? (
                                                    <React.Fragment>
                                                        <button onClick={handlePlayAgain} className="flex-1 px-3 py-3 bg-[#ffcc00] text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] hover:shadow-none transition-all text-sm sm:text-base">再來一局 (同設定)</button>
                                                        <button onClick={handleBackToLobby} className="flex-1 px-3 py-3 bg-white text-[#1e293b] border-[4px] border-[#1e293b] font-black rounded-xl shadow-[4px_4px_0px_#1e293b] hover:translate-y-[2px] hover:shadow-none transition-all text-sm sm:text-base">返回大廳</button>
                                                    </React.Fragment>
                                                ) : (
                                                    <span className="font-black text-slate-500 bg-slate-100 px-4 py-2 rounded-xl border-2 border-slate-300 w-full text-center">⏳ 等待房主決定下一局...</span>
                                                )
                                            ) : (
                                                <React.Fragment>
                                                    <button onClick={() => {
                                                        setHideVictoryModal(true);
                                                        setFinishViewMode('god');
                                                        toggleSpectator(myId, true, true);
                                                        showToast("👁️ 已轉變為上帝模式，您可以繼續觀看其他玩家比賽");
                                                    }} className="flex-1 px-3 py-3 bg-purple-100 text-purple-700 border-[4px] border-purple-700 font-black rounded-xl shadow-[4px_4px_0px_#6d28d9] hover:translate-y-[2px] hover:shadow-none transition-all text-sm sm:text-base">👁️ 轉變為上帝模式 (觀戰)</button>
                                                    <div className="w-full text-xs font-semibold text-slate-400 mt-2 animate-pulse">比賽尚未結束，您可以先轉為觀戰模式...</div>
                                                </React.Fragment>
                                            )}
                                        </React.Fragment>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {(isWon || (isBrawlMode && winner)) && hideVictoryModal && (
                        <div className="absolute bottom-20 inset-x-0 flex flex-col items-center gap-3 z-50 pointer-events-none">
                            <div className="pointer-events-auto bg-white/90 backdrop-blur-sm border-2 border-slate-800 p-1 rounded-xl shadow-lg flex gap-1">
                                <button onClick={() => { setFinishViewMode('my'); toggleSpectator(myId, true, false); }} className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all ${finishViewMode === 'my' ? 'bg-blue-500 text-white shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}>👤 我的版面</button>
                                <button onClick={() => { setFinishViewMode('god'); toggleSpectator(myId, true, true); }} className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all ${finishViewMode === 'god' ? 'bg-purple-500 text-white shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}>👁️ 上帝視角</button>
                            </div>
                            <button onClick={() => setHideVictoryModal(false)} className="pointer-events-auto bg-[#ffcc00] text-[#1e293b] border-[4px] border-[#1e293b] px-6 py-3 rounded-full shadow-[6px_6px_0px_#1e293b] hover:translate-y-[2px] transition-all font-black flex items-center gap-2 tracking-wide text-lg">🏆 顯示成績</button>
                        </div>
                    )}


                    {/* === 道具/禮物按鈕區塊已整合至漂浮選單 === */}
                </div>
            </div>

            {/* SVG 發射閃光彈動畫層 */}
            {flares.length > 0 && (
                <svg className="fixed inset-0 pointer-events-none z-[120]" style={{ width: '100vw', height: '100vh' }}>
                    <defs>
                        <filter id="flareGlow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {flares.map(f => {
                        const cpX = (f.startX + f.endX) / 2;
                        const cpY = Math.min(f.startY, f.endY) - 200;
                        const pathD = `M ${f.startX} ${f.startY} Q ${cpX} ${cpY} ${f.endX} ${f.endY}`;
                        return (
                            <g key={f.id}>
                                <path d={pathD} fill="none" stroke="#fcd34d" strokeWidth="2" strokeDasharray="5,5" opacity="0.4" />
                                <circle r="12" fill="#fff" filter="url(#flareGlow)">
                                    <animateMotion path={pathD} dur="0.6s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
                                    <animate attributeName="opacity" values="1;0" begin="0.5s" dur="0.1s" fill="freeze" />
                                    <animate attributeName="r" values="8;16;0" keyTimes="0;0.8;1" dur="0.6s" fill="freeze" />
                                </circle>
                            </g>
                        );
                    })}
                </svg>
            )}

            {/* === 獨立選色/設定面板 === */}
            {colorPickerTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm pointer-events-auto animate-fadeIn" onClick={(e) => { e.stopPropagation(); setColorPickerTarget(null); setColorSeq([]); }}>
                    <div className="bg-[#fffdfa] border-[3px] border-slate-800 rounded-xl p-4 shadow-[10px_10px_0px_rgba(30,41,59,1)] animate-popUpCenter max-w-[280px] w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-3 border-b-2 border-slate-800 pb-2">
                            <h3 className="text-sm font-bold text-slate-800">⚙️ 個人設定</h3>
                            <button onClick={() => { setColorPickerTarget(null); setColorSeq([]); }} className="text-slate-400 hover:text-slate-800 font-black text-lg leading-none">✕</button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-1">修改暱稱：</label>
                            <div className="flex gap-2">
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="輸入新暱稱" className="w-full border-2 border-slate-800 rounded px-2 py-1 text-xs font-bold outline-none focus:ring-1 ring-[#ffcc00]" />
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    const newName = editName.trim();
                                    if (!newName) return showToast("⚠️ 暱稱不能為空");
                                    if (playersList.some(p => p.name === newName && p.id !== colorPickerTarget)) return showToast("⚠️ 此暱稱已被其他人使用");
                                    handlePlayerNameChange(colorPickerTarget, newName);
                                    setColorPickerTarget(null);
                                    setColorSeq([]);
                                }} className="bg-blue-500 text-white font-bold text-[10px] md:text-xs px-3 rounded border-2 border-slate-800 hover:bg-blue-600 active:translate-y-[1px] whitespace-nowrap">儲存</button>
                            </div>
                        </div>

                        <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-1">修改代表色：</label>
                        <div className="grid grid-cols-5 gap-2">
                            {COLORS.map(color => (
                                <button key={color} onClick={(e) => { e.stopPropagation(); const colorIdx = COLORS.indexOf(color); let newSeq = [...colorSeq, colorIdx]; const targetSeq = [0, 4, 15, 19]; let isValid = true; for (let i = 0; i < newSeq.length; i++) { if (newSeq[i] !== targetSeq[i]) { isValid = false; break; } } if (isValid) { setColorSeq(newSeq); if (newSeq.length === 4) { handlePlayerColorChange(colorPickerTarget, 'rainbow'); setColorPickerTarget(null); showToast("🌈 解鎖隱藏彩色漸變！"); setColorSeq([]); } else handlePlayerColorChange(colorPickerTarget, color); } else { setColorSeq([]); handlePlayerColorChange(colorPickerTarget, color); setColorPickerTarget(null); } }} className="plat-btn-hard plat-btn-hard-2 w-8 h-8 rounded-full border-[2px] border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] hover:scale-110 active:scale-95 mx-auto" style={{ backgroundColor: color }} title={color} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showSaveModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#fffdfa] border-[4px] border-[#1e293b] rounded-2xl p-6 shadow-[10px_10px_0px_rgba(30,41,59,1)] w-full max-w-md animate-popUpCenter">
                        <h2 className="text-2xl font-black text-slate-800 mb-2 border-b-4 border-blue-500 inline-block pb-1">💾 存檔與讀檔</h2>
                        <p className="text-sm font-bold text-slate-600 mb-4">將進度轉換為代碼，下次貼上代碼即可恢復！</p>
                        <div className="mb-6">
                            <button onClick={handleSaveCode} className="plat-btn-hard w-full py-3 bg-blue-500 text-white border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] mb-3 text-base md:text-lg">產生進度代碼 (自動複製)</button>
                            <div className="relative">
                                <textarea id="saveCodeTextarea" value={saveCode} onChange={(e) => setSaveCode(e.target.value)} placeholder="點擊上方按鈕生成，或是手動貼上舊代碼至此處" rows="4" className="w-full border-4 border-slate-800 rounded-xl p-3 pb-12 font-mono text-sm shadow-inner outline-none focus:bg-blue-50 break-all bg-white" />
                                <button onClick={handleQuickPaste} className="plat-btn-hard plat-btn-hard-2 absolute bottom-3 right-3 bg-[#ffcc00] text-slate-900 px-3 py-1.5 rounded-lg text-sm font-black border-2 border-slate-800 hover:bg-[#e6b800] shadow-[2px_2px_0px_rgba(30,41,59,1)]">📋 快速貼上</button>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowSaveModal(false)} className="plat-btn-hard flex-1 py-3 bg-white border-4 border-slate-800 rounded-xl font-black text-slate-800 shadow-[4px_4px_0px_rgba(30,41,59,1)]">關閉</button>
                            <button onClick={handleLoadCode} className="plat-btn-hard flex-1 py-3 bg-emerald-400 text-slate-900 border-4 border-slate-800 rounded-xl font-black shadow-[4px_4px_0px_rgba(30,41,59,1)]">載入代碼</button>
                        </div>
                    </div>
                </div>
            )}
            {toastMsg && (
                <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-white text-slate-800 px-6 py-3 rounded-xl border-[3px] border-slate-800 font-black shadow-[4px_4px_0px_rgba(30,41,59,1)] z-[100] animate-slideUpFade flex items-center justify-center gap-2 whitespace-pre-line text-center">
                    {toastMsg}
                </div>
            )}

            {/* === 固定式底端功能列 (v3.8.0) === */}
            {!isSpectator && screen === 'game' && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] pb-safe">
                    {/* 戰鬥道具區 (浮動在工具列上方) */}
                    {matchPhase === 'playing' && (
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-row gap-4 items-center pointer-events-none">
                            {unopenedGifts[myId] && unopenedGifts[myId].length > 0 && (
                                <button id="btn-open-gift" onClick={handleOpenGift} className="plat-btn-hard pointer-events-auto relative w-14 h-14 bg-pink-500 rounded-full border-[3px] border-slate-800 shadow-[4px_4px_0px_#1e293b] text-3xl animate-bounce flex items-center justify-center p-0">
                                    🎁 <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-800"><PlatNum value={unopenedGifts[myId].length} /></div>
                                </button>
                            )}
                            {isBrawlMode && myWeapons.filter(w => w === 'balloon').length > 0 && (
                                <button onClick={() => handleUseWeapon('balloon')} className="plat-btn-hard pointer-events-auto relative w-14 h-14 bg-violet-500 rounded-full border-[3px] border-slate-800 shadow-[4px_4px_0px_#1e293b] text-3xl anim-weapon flex items-center justify-center">
                                    💧 {myWeapons.filter(w => w === 'balloon').length > 1 && <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-900 font-black text-xs w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-800"><PlatNum value={myWeapons.filter(w => w === 'balloon').length} /></div>}
                                </button>
                            )}
                            {isBrawlMode && myWeapons.filter(w => w === 'eraser').length > 0 && (
                                <button onClick={() => handleUseWeapon('eraser')} className="plat-btn-hard pointer-events-auto relative w-14 h-14 bg-orange-500 rounded-full border-[3px] border-slate-800 shadow-[4px_4px_0px_#1e293b] text-3xl anim-weapon flex items-center justify-center">
                                    🧹 {myWeapons.filter(w => w === 'eraser').length > 1 && <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-900 font-black text-xs w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-800"><PlatNum value={myWeapons.filter(w => w === 'eraser').length} /></div>}
                                </button>
                            )}
                        </div>
                    )}

                    {typeof window.PlatBar !== 'undefined' ? (<div ref={platBarRef}></div>) : (<React.Fragment>)}
                    {/* 主工具列內層 */}
                    <div className="bg-[#fffdfa]/95 backdrop-blur-md border-t-[4px] border-slate-800 min-h-[4rem] md:min-h-[5rem] flex flex-wrap items-center justify-between gap-y-1 py-1 px-3 md:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                        {/* 左側：縮放（單顆展開式：點開才出現 －/＋/適應） */}
                        <div className="flex items-center gap-1.5 md:gap-3 bg-slate-100 p-1 rounded-xl border-2 border-slate-300 relative">
                            <button onClick={() => setZoomOpen(!zoomOpen)} className="plat-btn-hard plat-btn-hard-2 w-11 h-11 md:w-14 md:h-14 bg-white border-[3px] border-slate-800 rounded-lg shadow-[2px_2px_0px_#1e293b] flex items-center justify-center text-base md:text-lg font-black hover:bg-[#ffcc00]" title="縮放（點開/收合）">
                                {zoomIndicator.visible ? (<span className="text-blue-600 scale-110 text-xs md:text-sm">{zoomIndicator.value.toFixed(1)}X</span>) : '🔍'}
                            </button>
                            {zoomOpen && (
                                <div className="absolute bottom-full mb-3 left-0 flex flex-col gap-2 bg-white border-[3px] border-slate-800 p-2 rounded-2xl shadow-[6px_6px_0px_rgba(30,41,59,0.25)] animate-popUpCenter z-50">
                                    <button onClick={handleZoomIn} className="plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-white border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-xl font-black shadow-[2px_2px_0px_#1e293b]" title="放大">＋</button>
                                    <button onClick={handleZoomOut} className="plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-white border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-xl font-black shadow-[2px_2px_0px_#1e293b]" title="縮小">－</button>
                                    <button onClick={handleCycleZoom} className="plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-slate-800 border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-[2px_2px_0px_#1e293b]" title="循環切換縮放模式（自動適應）">
                                        {zoomModeIdx === 0 ? '1X' : zoomModeIdx === 1 ? '↔️' : zoomModeIdx === 2 ? '↕️' : '🔲'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 輸入方式切換：數字先行 / 格子先行 */}
                        <div className="flex items-center gap-1 md:gap-2 bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner" title="輸入方式">
                            <button
                                onClick={() => setInputMode('num')}
                                className={`px-3 md:px-5 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-base flex items-center gap-1.5 md:gap-2 transition-all ${inputMode === 'num' ? 'bg-[#ffcc00] text-slate-900 shadow-md scale-105' : 'text-slate-400 hover:text-white'}`}
                            >
                                <span>🔢</span>
                                <span className="hidden sm:inline">數字先行</span>
                            </button>
                            <button
                                onClick={() => setInputMode('cell')}
                                className={`px-3 md:px-5 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-base flex items-center gap-1.5 md:gap-2 transition-all ${inputMode === 'cell' ? 'bg-sky-400 text-slate-900 shadow-md scale-105' : 'text-slate-400 hover:text-white'}`}
                            >
                                <span>👆</span>
                                <span className="hidden sm:inline">格子先行</span>
                            </button>
                        </div>

                        {/* 右側：模式切換（單顆循環鈕：填答→筆記→塗鴉） */}
                        <div className="flex items-center gap-1 md:gap-2 bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner relative">
                            <button
                                onClick={cycleInteractionMode}
                                className={`px-3 md:px-5 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-base flex items-center gap-1.5 md:gap-2 transition-all shadow-md ${interactionMode === 2 ? 'bg-emerald-400 text-slate-900' : 'bg-[#ffcc00] text-slate-900'}`}
                                title="切換模式（填答/筆記/塗鴉）"
                            >
                                <span>{interactionMode === 0 ? '🖋️' : interactionMode === 1 ? '✏️' : '🖌️'}</span>
                                <span className="hidden sm:inline">{interactionMode === 0 ? '填答' : interactionMode === 1 ? '筆記' : '塗鴉'}</span>
                                <span className="text-[10px] opacity-60">▾</span>
                            </button>
                                {interactionMode === 2 && modeSubOpen && (
                                    <div className="absolute bottom-full mb-6 right-0 flex flex-col gap-3 bg-white border-[3px] border-slate-800 p-2.5 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,0.2)] animate-popUpCenter pointer-events-auto">
                                        <button onClick={(e) => { e.stopPropagation(); setDrawSubMode('pen'); }} className={`w-12 h-12 border-[3px] border-slate-800 rounded-xl flex items-center justify-center transition-all shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-[2px] ${drawSubMode === 'pen' ? 'bg-emerald-100 scale-110 border-emerald-600' : 'bg-white hover:bg-slate-50'}`} title="畫筆模式">🖌️</button>
                                        <button onClick={(e) => { e.stopPropagation(); setDrawSubMode('eraser'); }} onDoubleClick={(e) => { e.stopPropagation(); clearOwnStrokes(); }} className={`w-12 h-12 border-[3px] border-slate-800 rounded-xl flex items-center justify-center transition-all shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-[2px] ${drawSubMode === 'eraser' ? 'bg-orange-100 scale-110 border-orange-600' : 'bg-white hover:bg-slate-50'}`} title="橡皮擦 (雙擊清除自己所有塗鴉)">🧽</button>
                                        {isHostRef.current && !isBrawlMode && <button onClick={(e) => { e.stopPropagation(); clearAllStrokes(); }} className="plat-btn-hard plat-btn-hard-2 w-12 h-12 bg-rose-50 border-[3px] border-rose-800 text-rose-800 rounded-xl flex items-center justify-center hover:bg-rose-100 shadow-[2px_2px_0px_#1e293b]" title="房主：清除全場塗鴉">🚮</button>}
                                    </div>
                                )}
                        </div>
                        {renderDockCapsule(false)}
                    </div>
                    </React.Fragment>)}
                </div>
            )}
        </div>
    );
}

const renderApp = () => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(SudokuGame));
};

renderApp();
