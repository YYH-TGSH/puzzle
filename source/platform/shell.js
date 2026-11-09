// 平台殼：畫面切換 + 遊戲啟動（兩款 app 已由 build 預先編譯，點進去直接執行）
(function () {
  var booted = { sudoku: false, hashi: false, mines: false };
  var statusEl = null;
  var platLogBuf = []; window.__PLAT_LOG = platLogBuf; // 環形錯誤簿（稽核 I-01：正式站沒有診斷面板，至少留記憶體紀錄可查）
  function showErrBar(msg) { // 正式站可見錯誤橫幅：❌ 級 status 不再寫進不存在的面板就消失，使用者截圖能帶回病名
    try {
      var bar = document.getElementById('plat-errbar'); if (!bar) return;
      var tx = document.getElementById('plat-errbar-text'); if (tx) tx.textContent = msg;
      bar.style.display = 'flex';
      var x = document.getElementById('plat-errbar-x'); if (x && !x._wired) { x._wired = 1; x.onclick = function () { bar.style.display = 'none'; }; }
      var rl = document.getElementById('plat-errbar-reload'); if (rl && !rl._wired) { rl._wired = 1; rl.onclick = function () { location.reload(); }; }
    } catch (e) {}
  }
  function status(msg) {
    platLogBuf.push({ t: Date.now(), msg: String(msg) }); if (platLogBuf.length > 80) platLogBuf.shift();
    if (!statusEl) statusEl = document.getElementById('plat-status-body');
    if (statusEl) { var d = document.createElement('div'); d.textContent = msg; statusEl.appendChild(d); }
    if (String(msg).indexOf('❌') >= 0) showErrBar(String(msg));
  }
  window.__PLAT_status = status;
  window.addEventListener('error', function (e) {
    status('❌ error: ' + (e.message || e.type));
  });
  window.addEventListener('unhandledrejection', function (e) {
    status('❌ rejection: ' + (e.reason && e.reason.message ? e.reason.message : e.reason));
  });
  function ensureBoundary() {
    if (window.PlatBoundary || !window.React) return;
    window.PlatBoundary = class extends React.Component {
      constructor(p) { super(p); this.state = { err: null }; }
      static getDerivedStateFromError(e) { return { err: e }; }
      componentDidCatch(e, info) {
        status('❌ 渲染錯誤本名: ' + (e && e.message ? e.message : e));
        if (e && e.stack) status('stack: ' + e.stack.split('\n').slice(0, 3).join(' | ').slice(0, 320));
      }
      render() {
        if (!this.state.err) return this.props.children;
        // v1.19.0：渲染錯誤不再吞成空白（舊版 return null＝整面深藍、無從診斷）——顯示錯誤本名＋重新整理鈕，
        // 使用者截圖就能把病名帶回來。
        var e = this.state.err;
        return React.createElement('div', { style: { padding: '28px 16px', textAlign: 'center', color: '#fff' } },
          React.createElement('div', { style: { fontSize: '40px' } }, '😵'),
          React.createElement('div', { style: { fontWeight: 900, fontSize: '18px', margin: '10px 0 6px' } }, '遊戲畫面出錯了'),
          React.createElement('div', { style: { fontSize: '13px', opacity: .85, wordBreak: 'break-all', maxWidth: '520px', margin: '0 auto' } }, String(e && e.message ? e.message : e)),
          React.createElement('button', { onClick: function () { location.reload(); }, style: { marginTop: '14px', padding: '10px 22px', borderRadius: '12px', border: 'none', background: '#f59e0b', color: '#1e293b', fontWeight: 900, fontSize: '15px', cursor: 'pointer' } }, '🔄 重新整理'));
      }
    };
  }
  function loadCode(name, cb) {
    var el = document.getElementById('code-' + name);
    if (el) { cb(el.textContent); return; }
    var attempt = 0;
    (function tryFetch() {
      attempt++;
      fetch('js/' + name + '/app.compiled.js?v=' + PLAT_VERSION).then(function (r) { // 帶版號破快取：三款程式走 fetch 載入，不帶版號會吃 GitHub Pages 的 10 分鐘舊快取（v1.17.1 使用者回報「推了沒感覺」的真通道）
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }).then(cb).catch(function (e) {
        if (attempt < 3) { status('⏳ 載入 ' + name + ' 失敗（' + e.message + '），自動重試 ' + attempt + '/2…'); setTimeout(tryFetch, 1500); return; }
        booted[name] = false;
        status('❌ 載入 ' + name + ' 程式失敗: ' + e.message);
        if (window.__PLAT_TOAST) window.__PLAT_TOAST('❌ 遊戲程式載入失敗，請檢查網路連線後再試一次');
      });
    })();
  }
  // 掛載失敗橫幅（v1.19.0）：遊戲 view 頂端亮出問題＋一顆「重新載入這款遊戲」鈕（走 __PLAT_REBOOT）
  var GAME_TITLES = { sudoku: '🔢 數獨', hashi: '🌉 數橋', mines: '💣 踩地雷' };
  function showBootErr(name) {
    var view = document.getElementById('view-' + name); if (!view) return;
    if (document.getElementById('plat-boot-err-' + name)) return;
    var bar = document.createElement('div');
    bar.id = 'plat-boot-err-' + name;
    bar.style.cssText = 'position:relative;z-index:300;margin:10px;padding:14px 16px;border-radius:14px;background:#7f1d1d;color:#fff;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.35)';
    bar.innerHTML = '<div style="font-weight:900;font-size:16px">⚠️ ' + (GAME_TITLES[name] || name) + ' 沒有成功載入</div>' +
      '<div style="font-size:13px;opacity:.9;margin-top:4px">可能是網路不穩或快取問題，點下面按鈕重試一次。</div>';
    var btn = document.createElement('button');
    btn.textContent = '🔄 重新載入';
    btn.style.cssText = 'margin-top:10px;padding:9px 22px;border-radius:10px;border:none;background:#f59e0b;color:#1e293b;font-weight:900;font-size:15px;cursor:pointer';
    btn.onclick = function () { hideBootErr(name); if (window.__PLAT_REBOOT) window.__PLAT_REBOOT(name); };
    bar.appendChild(btn);
    view.insertBefore(bar, view.firstChild);
    status('❌ 已亮出掛載失敗橫幅: ' + name);
  }
  function hideBootErr(name) { var b = document.getElementById('plat-boot-err-' + name); if (b) b.remove(); }
  function boot(name) {
    if (booted[name]) { status(name + ' 已啟動過（略過）'); return; }
    if (!(window.React && window.ReactDOM)) {
      if (!boot['w_' + name]) { boot['w_' + name] = 1; status('⏳ 等函式庫（React）載入完成…'); }
      if ((boot['w_' + name] || 0) > 40) { status('❌ 函式庫載入逾時，可能是網路問題'); return; }
      boot['w_' + name] = (boot['w_' + name] || 0) + 1;
      setTimeout(function () { boot(name); }, 500);
      return;
    }
    booted[name] = true;
    var t0 = Date.now();
    ensureBoundary();
    loadCode(name, function (src) {
      try {
        status('▶ 啟動 ' + name + '（程式 ' + Math.round(src.length / 1024) + 'KB）…');
        new Function(src)();
        status('▶ ' + name + ' 執行完成 ' + (Date.now() - t0) + 'ms，檢查掛載…');
        setTimeout(function () {
          var root = document.getElementById(name + '-root');
          var n = root ? root.childElementCount : -1;
          status((n > 0 ? '✅ ' : '❌ ') + name + ' 掛載子元素: ' + n);
          if (n > 0) { hideBootErr(name); return; }
          // 掛載閘門（v1.19.0）：1.2 秒沒掛上不算定罪（真機慢），再等 2 秒複查；仍是空殼就亮出可見橫幅＋重試鈕——
          // 絕不重演「整面深藍空白、錯誤只寫在隱藏日誌」的啞巴失敗。
          setTimeout(function () {
            var r2 = document.getElementById(name + '-root');
            var n2 = r2 ? r2.childElementCount : -1;
            status('掛載複查 ' + name + ': ' + n2);
            if (n2 > 0) hideBootErr(name); else showBootErr(name);
          }, 2000);
        }, 1200);
      } catch (e) {
        booted[name] = false;
        status('❌ ' + name + ' 執行例外: ' + (e && e.message ? e.message : e));
      }
    });
  }
  window.__PLAT_BOOT = function (name) { if (!booted[name]) boot(name); }; // 背景預載：只執行＋掛載遊戲到隱藏的 view，不切畫面
  window.__PLAT_REBOOT = function (name) { booted[name] = false; boot(name); }; // 載入卡住時強制重啟一款遊戲
  // （v1.8.0 起）左上角「🏠 平台」鈕已移除：回大廳改由兩款遊戲主畫面最下方的藍色大按鈕擔任（使用者指定）
  var currentView = 'home';
  window.PLAT_show = function (name) {
    // v1.11.0：房間進行中要求看「大廳」＝回殼的房間框架頁（不載入遊戲）；賽中＝回該局遊戲畫面。
    // 注意：Net 活在下方另一個 IIFE，這裡只能透過 window.__PLAT_NET 取（舊版直接寫 Net 永遠是 undefined、整段是死碼）。
    if (name === 'lobby') {
      var N2 = window.__PLAT_NET;
      if (N2 && N2.active) {
        var fromView = document.body.getAttribute('data-view');
        if ((fromView === 'sudoku' || fromView === 'hashi' || fromView === 'mines') && !N2.inMatch) N2.armed.game = fromView; // 從哪款按多人連線，房間頁就先停在那款的分頁
        if (N2.inMatch) { window.PLAT_show(N2.inMatch); return; }
        if (window.__PLAT_SHOW_HUB) { window.__PLAT_SHOW_HUB(); return; }
      }
    }
    currentView = name;
    ['home', 'sudoku', 'hashi', 'mines', 'lobby'].forEach(function (v) {
      var vel = document.getElementById('view-' + v); if (!vel) return; // 防空：混版快取（新殼+舊頁面缺某款 view）不能讓整個切換死掉（v1.14.1 實機事故：房主開數獨整面空白）
      if (v === name) { if (vel._outT) { clearTimeout(vel._outT); vel._outT = null; } vel.classList.remove('plat-view-out'); vel.classList.add('active'); }
      else if (vel.classList.contains('active')) { // 退場補強（v1.53.0）：舊畫面 90ms 淡出後才卸載，與新畫面淡入組成 crossfade，不再瞬斷
        vel.classList.add('plat-view-out');
        if (vel._outT) clearTimeout(vel._outT);
        vel._outT = setTimeout(function () { vel.classList.remove('active'); vel.classList.remove('plat-view-out'); vel._outT = null; }, 90);
      } else vel.classList.remove('active');
    });
    document.body.setAttribute('data-view', name);
    // 先 boot 遊戲、再做裝飾更新：dock/rejoin 只是外觀與探測，萬一丟錯絕不能擋住遊戲載入（v1.19.0 靈魂拷問盤點）
    if (name === 'sudoku' || name === 'hashi' || name === 'mines') {
      try { boot(name); } catch (e) { status('❌ ' + name + ' 啟動例外: ' + (e && e.message ? e.message : e)); }
    }
    try { if (window.__PLAT_UPDATE_DOCK) window.__PLAT_UPDATE_DOCK(); } catch (e) { status('dock 更新失敗（不擋遊戲）: ' + (e && e.message ? e.message : e)); } // updateDock 在另一個 IIFE：舊版直接寫函數名永遠是 undefined、dock 在回主頁時不會收
    if (name === 'lobby' && window.__PLAT_REFRESH_REJOIN) window.__PLAT_REFRESH_REJOIN(); // 進多人連線才探測房間存續（主畫面不放重連鈕）
    window.scrollTo(0, 0);
  };
  status('殼就緒。點上面的遊戲按鈕開始。');
})();

// ==================== Phase C：共用連線（PlatNet） ====================
// 殼持有唯一的 RealPeer 連線：大廳/名單/聊天/視訊都在殼層；
// 遊戲透過 PlatPeer shim 共用同一條連線進多人（訊息以 __plat 信封與遊戲訊息多工）。
(function () {
  var RealPeer = window.Peer;
  window.__RealPeer = RealPeer;
  window.__PLAT_PLATFORM = true;
  var PLAT_VERSION = '1.57.0'; // 平台主版本（功能批 +0.1 尾碼歸零；小修 +0.0.1）——數獨/數橋的子版本號讀這個值
  window.PLAT_START_WAIT_MS = 60000; // 開始按鈕門檻（兩款共用單一來源）：全員準備，或等待室開滿此毫秒數（防掛機卡房）房主才能開始；測試可調
  // 連線設定：v1.7.1 回滾 v1.6.1 的 OpenRelay TURN——該組公開帳密已失效，死中繼反而讓交涉整體卡死（使用者實測：加了之後連原本能連的都連不上）。
  // 回到 PeerJS 預設（v1.6.0 以前的做法）：同區網/友善 NAT 直連。跨網路穿透需要有在運作的中繼服務（需註冊），使用者 2026-10-18 決定不註冊任何服務，此路暫擱置。
  window.PLAT_VERSION = PLAT_VERSION;

  // ---- vendored: qrcode-generator 1.4.4 (MIT License, Copyright (c) 2009 Kazuhiko Arase) — 邀請 QR 生成，單檔零外連（v1.51.0）----
  var qrcode=function(){var t=function(t,r){var e=t,n=g[r],o=null,i=0,a=null,u=[],f={},c=function(t,r){o=function(t){for(var r=new Array(t),e=0;e<t;e+=1){r[e]=new Array(t);for(var n=0;n<t;n+=1)r[e][n]=null}return r}(i=4*e+17),l(0,0),l(i-7,0),l(0,i-7),s(),h(),d(t,r),e>=7&&v(t),null==a&&(a=p(e,n,u)),w(a,r)},l=function(t,r){for(var e=-1;e<=7;e+=1)if(!(t+e<=-1||i<=t+e))for(var n=-1;n<=7;n+=1)r+n<=-1||i<=r+n||(o[t+e][r+n]=0<=e&&e<=6&&(0==n||6==n)||0<=n&&n<=6&&(0==e||6==e)||2<=e&&e<=4&&2<=n&&n<=4)},h=function(){for(var t=8;t<i-8;t+=1)null==o[t][6]&&(o[t][6]=t%2==0);for(var r=8;r<i-8;r+=1)null==o[6][r]&&(o[6][r]=r%2==0)},s=function(){for(var t=B.getPatternPosition(e),r=0;r<t.length;r+=1)for(var n=0;n<t.length;n+=1){var i=t[r],a=t[n];if(null==o[i][a])for(var u=-2;u<=2;u+=1)for(var f=-2;f<=2;f+=1)o[i+u][a+f]=-2==u||2==u||-2==f||2==f||0==u&&0==f}},v=function(t){for(var r=B.getBCHTypeNumber(e),n=0;n<18;n+=1){var a=!t&&1==(r>>n&1);o[Math.floor(n/3)][n%3+i-8-3]=a}for(n=0;n<18;n+=1){a=!t&&1==(r>>n&1);o[n%3+i-8-3][Math.floor(n/3)]=a}},d=function(t,r){for(var e=n<<3|r,a=B.getBCHTypeInfo(e),u=0;u<15;u+=1){var f=!t&&1==(a>>u&1);u<6?o[u][8]=f:u<8?o[u+1][8]=f:o[i-15+u][8]=f}for(u=0;u<15;u+=1){f=!t&&1==(a>>u&1);u<8?o[8][i-u-1]=f:u<9?o[8][15-u-1+1]=f:o[8][15-u-1]=f}o[i-8][8]=!t},w=function(t,r){for(var e=-1,n=i-1,a=7,u=0,f=B.getMaskFunction(r),c=i-1;c>0;c-=2)for(6==c&&(c-=1);;){for(var g=0;g<2;g+=1)if(null==o[n][c-g]){var l=!1;u<t.length&&(l=1==(t[u]>>>a&1)),f(n,c-g)&&(l=!l),o[n][c-g]=l,-1==(a-=1)&&(u+=1,a=7)}if((n+=e)<0||i<=n){n-=e,e=-e;break}}},p=function(t,r,e){for(var n=A.getRSBlocks(t,r),o=b(),i=0;i<e.length;i+=1){var a=e[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var u=0;for(i=0;i<n.length;i+=1)u+=n[i].dataCount;if(o.getLengthInBits()>8*u)throw"code length overflow. ("+o.getLengthInBits()+">"+8*u+")";for(o.getLengthInBits()+4<=8*u&&o.put(0,4);o.getLengthInBits()%8!=0;)o.putBit(!1);for(;!(o.getLengthInBits()>=8*u||(o.put(236,8),o.getLengthInBits()>=8*u));)o.put(17,8);return function(t,r){for(var e=0,n=0,o=0,i=new Array(r.length),a=new Array(r.length),u=0;u<r.length;u+=1){var f=r[u].dataCount,c=r[u].totalCount-f;n=Math.max(n,f),o=Math.max(o,c),i[u]=new Array(f);for(var g=0;g<i[u].length;g+=1)i[u][g]=255&t.getBuffer()[g+e];e+=f;var l=B.getErrorCorrectPolynomial(c),h=k(i[u],l.getLength()-1).mod(l);for(a[u]=new Array(l.getLength()-1),g=0;g<a[u].length;g+=1){var s=g+h.getLength()-a[u].length;a[u][g]=s>=0?h.getAt(s):0}}var v=0;for(g=0;g<r.length;g+=1)v+=r[g].totalCount;var d=new Array(v),w=0;for(g=0;g<n;g+=1)for(u=0;u<r.length;u+=1)g<i[u].length&&(d[w]=i[u][g],w+=1);for(g=0;g<o;g+=1)for(u=0;u<r.length;u+=1)g<a[u].length&&(d[w]=a[u][g],w+=1);return d}(o,n)};f.addData=function(t,r){var e=null;switch(r=r||"Byte"){case"Numeric":e=M(t);break;case"Alphanumeric":e=x(t);break;case"Byte":e=m(t);break;case"Kanji":e=L(t);break;default:throw"mode:"+r}u.push(e),a=null},f.isDark=function(t,r){if(t<0||i<=t||r<0||i<=r)throw t+","+r;return o[t][r]},f.getModuleCount=function(){return i},f.make=function(){if(e<1){for(var t=1;t<40;t++){for(var r=A.getRSBlocks(t,n),o=b(),i=0;i<u.length;i++){var a=u[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var g=0;for(i=0;i<r.length;i++)g+=r[i].dataCount;if(o.getLengthInBits()<=8*g)break}e=t}c(!1,function(){for(var t=0,r=0,e=0;e<8;e+=1){c(!0,e);var n=B.getLostPoint(f);(0==e||t>n)&&(t=n,r=e)}return r}())},f.createTableTag=function(t,r){t=t||2;var e="";e+='<table style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: "+(r=void 0===r?4*t:r)+"px;",e+='">',e+="<tbody>";for(var n=0;n<f.getModuleCount();n+=1){e+="<tr>";for(var o=0;o<f.getModuleCount();o+=1)e+='<td style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: 0px;",e+=" width: "+t+"px;",e+=" height: "+t+"px;",e+=" background-color: ",e+=f.isDark(n,o)?"#000000":"#ffffff",e+=";",e+='"/>';e+="</tr>"}return e+="</tbody>",e+="</table>"},f.createSvgTag=function(t,r,e,n){var o={};"object"==typeof arguments[0]&&(t=(o=arguments[0]).cellSize,r=o.margin,e=o.alt,n=o.title),t=t||2,r=void 0===r?4*t:r,(e="string"==typeof e?{text:e}:e||{}).text=e.text||null,e.id=e.text?e.id||"qrcode-description":null,(n="string"==typeof n?{text:n}:n||{}).text=n.text||null,n.id=n.text?n.id||"qrcode-title":null;var i,a,u,c,g=f.getModuleCount()*t+2*r,l="";for(c="l"+t+",0 0,"+t+" -"+t+",0 0,-"+t+"z ",l+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',l+=o.scalable?"":' width="'+g+'px" height="'+g+'px"',l+=' viewBox="0 0 '+g+" "+g+'" ',l+=' preserveAspectRatio="xMinYMin meet"',l+=n.text||e.text?' role="img" aria-labelledby="'+y([n.id,e.id].join(" ").trim())+'"':"",l+=">",l+=n.text?'<title id="'+y(n.id)+'">'+y(n.text)+"</title>":"",l+=e.text?'<description id="'+y(e.id)+'">'+y(e.text)+"</description>":"",l+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',l+='<path d="',a=0;a<f.getModuleCount();a+=1)for(u=a*t+r,i=0;i<f.getModuleCount();i+=1)f.isDark(a,i)&&(l+="M"+(i*t+r)+","+u+c);return l+='" stroke="transparent" fill="black"/>',l+="</svg>"},f.createDataURL=function(t,r){t=t||2,r=void 0===r?4*t:r;var e=f.getModuleCount()*t+2*r,n=r,o=e-r;return I(e,e,(function(r,e){if(n<=r&&r<o&&n<=e&&e<o){var i=Math.floor((r-n)/t),a=Math.floor((e-n)/t);return f.isDark(a,i)?0:1}return 1}))},f.createImgTag=function(t,r,e){t=t||2,r=void 0===r?4*t:r;var n=f.getModuleCount()*t+2*r,o="";return o+="<img",o+=' src="',o+=f.createDataURL(t,r),o+='"',o+=' width="',o+=n,o+='"',o+=' height="',o+=n,o+='"',e&&(o+=' alt="',o+=y(e),o+='"'),o+="/>"};var y=function(t){for(var r="",e=0;e<t.length;e+=1){var n=t.charAt(e);switch(n){case"<":r+="&lt;";break;case">":r+="&gt;";break;case"&":r+="&amp;";break;case'"':r+="&quot;";break;default:r+=n}}return r};return f.createASCII=function(t,r){if((t=t||1)<2)return function(t){t=void 0===t?2:t;var r,e,n,o,i,a=1*f.getModuleCount()+2*t,u=t,c=a-t,g={"██":"█","█ ":"▀"," █":"▄","  ":" "},l={"██":"▀","█ ":"▀"," █":" ","  ":" "},h="";for(r=0;r<a;r+=2){for(n=Math.floor((r-u)/1),o=Math.floor((r+1-u)/1),e=0;e<a;e+=1)i="█",u<=e&&e<c&&u<=r&&r<c&&f.isDark(n,Math.floor((e-u)/1))&&(i=" "),u<=e&&e<c&&u<=r+1&&r+1<c&&f.isDark(o,Math.floor((e-u)/1))?i+=" ":i+="█",h+=t<1&&r+1>=c?l[i]:g[i];h+="\n"}return a%2&&t>0?h.substring(0,h.length-a-1)+Array(a+1).join("▀"):h.substring(0,h.length-1)}(r);t-=1,r=void 0===r?2*t:r;var e,n,o,i,a=f.getModuleCount()*t+2*r,u=r,c=a-r,g=Array(t+1).join("██"),l=Array(t+1).join("  "),h="",s="";for(e=0;e<a;e+=1){for(o=Math.floor((e-u)/t),s="",n=0;n<a;n+=1)i=1,u<=n&&n<c&&u<=e&&e<c&&f.isDark(o,Math.floor((n-u)/t))&&(i=0),s+=i?g:l;for(o=0;o<t;o+=1)h+=s+"\n"}return h.substring(0,h.length-1)},f.renderTo2dContext=function(t,r){r=r||2;for(var e=f.getModuleCount(),n=0;n<e;n++)for(var o=0;o<e;o++)t.fillStyle=f.isDark(n,o)?"black":"white",t.fillRect(n*r,o*r,r,r)},f};t.stringToBytes=(t.stringToBytesFuncs={default:function(t){for(var r=[],e=0;e<t.length;e+=1){var n=t.charCodeAt(e);r.push(255&n)}return r}}).default,t.createStringToBytes=function(t,r){var e=function(){for(var e=S(t),n=function(){var t=e.read();if(-1==t)throw"eof";return t},o=0,i={};;){var a=e.read();if(-1==a)break;var u=n(),f=n()<<8|n();i[String.fromCharCode(a<<8|u)]=f,o+=1}if(o!=r)throw o+" != "+r;return i}(),n="?".charCodeAt(0);return function(t){for(var r=[],o=0;o<t.length;o+=1){var i=t.charCodeAt(o);if(i<128)r.push(i);else{var a=e[t.charAt(o)];"number"==typeof a?(255&a)==a?r.push(a):(r.push(a>>>8),r.push(255&a)):r.push(n)}}return r}};var r,e,n,o,i,a=1,u=2,f=4,c=8,g={L:1,M:0,Q:3,H:2},l=0,h=1,s=2,v=3,d=4,w=5,p=6,y=7,B=(r=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],e=1335,n=7973,i=function(t){for(var r=0;0!=t;)r+=1,t>>>=1;return r},(o={}).getBCHTypeInfo=function(t){for(var r=t<<10;i(r)-i(e)>=0;)r^=e<<i(r)-i(e);return 21522^(t<<10|r)},o.getBCHTypeNumber=function(t){for(var r=t<<12;i(r)-i(n)>=0;)r^=n<<i(r)-i(n);return t<<12|r},o.getPatternPosition=function(t){return r[t-1]},o.getMaskFunction=function(t){switch(t){case l:return function(t,r){return(t+r)%2==0};case h:return function(t,r){return t%2==0};case s:return function(t,r){return r%3==0};case v:return function(t,r){return(t+r)%3==0};case d:return function(t,r){return(Math.floor(t/2)+Math.floor(r/3))%2==0};case w:return function(t,r){return t*r%2+t*r%3==0};case p:return function(t,r){return(t*r%2+t*r%3)%2==0};case y:return function(t,r){return(t*r%3+(t+r)%2)%2==0};default:throw"bad maskPattern:"+t}},o.getErrorCorrectPolynomial=function(t){for(var r=k([1],0),e=0;e<t;e+=1)r=r.multiply(k([1,C.gexp(e)],0));return r},o.getLengthInBits=function(t,r){if(1<=r&&r<10)switch(t){case a:return 10;case u:return 9;case f:case c:return 8;default:throw"mode:"+t}else if(r<27)switch(t){case a:return 12;case u:return 11;case f:return 16;case c:return 10;default:throw"mode:"+t}else{if(!(r<41))throw"type:"+r;switch(t){case a:return 14;case u:return 13;case f:return 16;case c:return 12;default:throw"mode:"+t}}},o.getLostPoint=function(t){for(var r=t.getModuleCount(),e=0,n=0;n<r;n+=1)for(var o=0;o<r;o+=1){for(var i=0,a=t.isDark(n,o),u=-1;u<=1;u+=1)if(!(n+u<0||r<=n+u))for(var f=-1;f<=1;f+=1)o+f<0||r<=o+f||0==u&&0==f||a==t.isDark(n+u,o+f)&&(i+=1);i>5&&(e+=3+i-5)}for(n=0;n<r-1;n+=1)for(o=0;o<r-1;o+=1){var c=0;t.isDark(n,o)&&(c+=1),t.isDark(n+1,o)&&(c+=1),t.isDark(n,o+1)&&(c+=1),t.isDark(n+1,o+1)&&(c+=1),0!=c&&4!=c||(e+=3)}for(n=0;n<r;n+=1)for(o=0;o<r-6;o+=1)t.isDark(n,o)&&!t.isDark(n,o+1)&&t.isDark(n,o+2)&&t.isDark(n,o+3)&&t.isDark(n,o+4)&&!t.isDark(n,o+5)&&t.isDark(n,o+6)&&(e+=40);for(o=0;o<r;o+=1)for(n=0;n<r-6;n+=1)t.isDark(n,o)&&!t.isDark(n+1,o)&&t.isDark(n+2,o)&&t.isDark(n+3,o)&&t.isDark(n+4,o)&&!t.isDark(n+5,o)&&t.isDark(n+6,o)&&(e+=40);var g=0;for(o=0;o<r;o+=1)for(n=0;n<r;n+=1)t.isDark(n,o)&&(g+=1);return e+=Math.abs(100*g/r/r-50)/5*10},o),C=function(){for(var t=new Array(256),r=new Array(256),e=0;e<8;e+=1)t[e]=1<<e;for(e=8;e<256;e+=1)t[e]=t[e-4]^t[e-5]^t[e-6]^t[e-8];for(e=0;e<255;e+=1)r[t[e]]=e;var n={glog:function(t){if(t<1)throw"glog("+t+")";return r[t]},gexp:function(r){for(;r<0;)r+=255;for(;r>=256;)r-=255;return t[r]}};return n}();function k(t,r){if(void 0===t.length)throw t.length+"/"+r;var e=function(){for(var e=0;e<t.length&&0==t[e];)e+=1;for(var n=new Array(t.length-e+r),o=0;o<t.length-e;o+=1)n[o]=t[o+e];return n}(),n={getAt:function(t){return e[t]},getLength:function(){return e.length},multiply:function(t){for(var r=new Array(n.getLength()+t.getLength()-1),e=0;e<n.getLength();e+=1)for(var o=0;o<t.getLength();o+=1)r[e+o]^=C.gexp(C.glog(n.getAt(e))+C.glog(t.getAt(o)));return k(r,0)},mod:function(t){if(n.getLength()-t.getLength()<0)return n;for(var r=C.glog(n.getAt(0))-C.glog(t.getAt(0)),e=new Array(n.getLength()),o=0;o<n.getLength();o+=1)e[o]=n.getAt(o);for(o=0;o<t.getLength();o+=1)e[o]^=C.gexp(C.glog(t.getAt(o))+r);return k(e,0).mod(t)}};return n}var A=function(){var t=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],r=function(t,r){var e={};return e.totalCount=t,e.dataCount=r,e},e={};return e.getRSBlocks=function(e,n){var o=function(r,e){switch(e){case g.L:return t[4*(r-1)+0];case g.M:return t[4*(r-1)+1];case g.Q:return t[4*(r-1)+2];case g.H:return t[4*(r-1)+3];default:return}}(e,n);if(void 0===o)throw"bad rs block @ typeNumber:"+e+"/errorCorrectionLevel:"+n;for(var i=o.length/3,a=[],u=0;u<i;u+=1)for(var f=o[3*u+0],c=o[3*u+1],l=o[3*u+2],h=0;h<f;h+=1)a.push(r(c,l));return a},e}(),b=function(){var t=[],r=0,e={getBuffer:function(){return t},getAt:function(r){var e=Math.floor(r/8);return 1==(t[e]>>>7-r%8&1)},put:function(t,r){for(var n=0;n<r;n+=1)e.putBit(1==(t>>>r-n-1&1))},getLengthInBits:function(){return r},putBit:function(e){var n=Math.floor(r/8);t.length<=n&&t.push(0),e&&(t[n]|=128>>>r%8),r+=1}};return e},M=function(t){var r=a,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+2<r.length;)t.put(o(r.substring(n,n+3)),10),n+=3;n<r.length&&(r.length-n==1?t.put(o(r.substring(n,n+1)),4):r.length-n==2&&t.put(o(r.substring(n,n+2)),7))}},o=function(t){for(var r=0,e=0;e<t.length;e+=1)r=10*r+i(t.charAt(e));return r},i=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);throw"illegal char :"+t};return n},x=function(t){var r=u,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+1<r.length;)t.put(45*o(r.charAt(n))+o(r.charAt(n+1)),11),n+=2;n<r.length&&t.put(o(r.charAt(n)),6)}},o=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);if("A"<=t&&t<="Z")return t.charCodeAt(0)-"A".charCodeAt(0)+10;switch(t){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+t}};return n},m=function(r){var e=f,n=t.stringToBytes(r),o={getMode:function(){return e},getLength:function(t){return n.length},write:function(t){for(var r=0;r<n.length;r+=1)t.put(n[r],8)}};return o},L=function(r){var e=c,n=t.stringToBytesFuncs.SJIS;if(!n)throw"sjis not supported.";!function(){var t=n("友");if(2!=t.length||38726!=(t[0]<<8|t[1]))throw"sjis not supported."}();var o=n(r),i={getMode:function(){return e},getLength:function(t){return~~(o.length/2)},write:function(t){for(var r=o,e=0;e+1<r.length;){var n=(255&r[e])<<8|255&r[e+1];if(33088<=n&&n<=40956)n-=33088;else{if(!(57408<=n&&n<=60351))throw"illegal char at "+(e+1)+"/"+n;n-=49472}n=192*(n>>>8&255)+(255&n),t.put(n,13),e+=2}if(e<r.length)throw"illegal char at "+(e+1)}};return i},D=function(){var t=[],r={writeByte:function(r){t.push(255&r)},writeShort:function(t){r.writeByte(t),r.writeByte(t>>>8)},writeBytes:function(t,e,n){e=e||0,n=n||t.length;for(var o=0;o<n;o+=1)r.writeByte(t[o+e])},writeString:function(t){for(var e=0;e<t.length;e+=1)r.writeByte(t.charCodeAt(e))},toByteArray:function(){return t},toString:function(){var r="";r+="[";for(var e=0;e<t.length;e+=1)e>0&&(r+=","),r+=t[e];return r+="]"}};return r},S=function(t){var r=t,e=0,n=0,o=0,i={read:function(){for(;o<8;){if(e>=r.length){if(0==o)return-1;throw"unexpected end of file./"+o}var t=r.charAt(e);if(e+=1,"="==t)return o=0,-1;t.match(/^\s$/)||(n=n<<6|a(t.charCodeAt(0)),o+=6)}var i=n>>>o-8&255;return o-=8,i}},a=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(43==t)return 62;if(47==t)return 63;throw"c:"+t};return i},I=function(t,r,e){for(var n=function(t,r){var e=t,n=r,o=new Array(t*r),i={setPixel:function(t,r,n){o[r*e+t]=n},write:function(t){t.writeString("GIF87a"),t.writeShort(e),t.writeShort(n),t.writeByte(128),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(255),t.writeByte(255),t.writeByte(255),t.writeString(","),t.writeShort(0),t.writeShort(0),t.writeShort(e),t.writeShort(n),t.writeByte(0);var r=a(2);t.writeByte(2);for(var o=0;r.length-o>255;)t.writeByte(255),t.writeBytes(r,o,255),o+=255;t.writeByte(r.length-o),t.writeBytes(r,o,r.length-o),t.writeByte(0),t.writeString(";")}},a=function(t){for(var r=1<<t,e=1+(1<<t),n=t+1,i=u(),a=0;a<r;a+=1)i.add(String.fromCharCode(a));i.add(String.fromCharCode(r)),i.add(String.fromCharCode(e));var f,c,g,l=D(),h=(f=l,c=0,g=0,{write:function(t,r){if(t>>>r!=0)throw"length over";for(;c+r>=8;)f.writeByte(255&(t<<c|g)),r-=8-c,t>>>=8-c,g=0,c=0;g|=t<<c,c+=r},flush:function(){c>0&&f.writeByte(g)}});h.write(r,n);var s=0,v=String.fromCharCode(o[s]);for(s+=1;s<o.length;){var d=String.fromCharCode(o[s]);s+=1,i.contains(v+d)?v+=d:(h.write(i.indexOf(v),n),i.size()<4095&&(i.size()==1<<n&&(n+=1),i.add(v+d)),v=d)}return h.write(i.indexOf(v),n),h.write(e,n),h.flush(),l.toByteArray()},u=function(){var t={},r=0,e={add:function(n){if(e.contains(n))throw"dup key:"+n;t[n]=r,r+=1},size:function(){return r},indexOf:function(r){return t[r]},contains:function(r){return void 0!==t[r]}};return e};return i}(t,r),o=0;o<r;o+=1)for(var i=0;i<t;i+=1)n.setPixel(i,o,e(i,o));var a=D();n.write(a);for(var u=function(){var t=0,r=0,e=0,n="",o={},i=function(t){n+=String.fromCharCode(a(63&t))},a=function(t){if(t<0);else{if(t<26)return 65+t;if(t<52)return t-26+97;if(t<62)return t-52+48;if(62==t)return 43;if(63==t)return 47}throw"n:"+t};return o.writeByte=function(n){for(t=t<<8|255&n,r+=8,e+=1;r>=6;)i(t>>>r-6),r-=6},o.flush=function(){if(r>0&&(i(t<<6-r),t=0,r=0),e%3!=0)for(var o=3-e%3,a=0;a<o;a+=1)n+="="},o.toString=function(){return n},o}(),f=a.toByteArray(),c=0;c<f.length;c+=1)u.writeByte(f[c]);return u.flush(),"data:image/gif;base64,"+u};return t}();qrcode.stringToBytesFuncs["UTF-8"]=function(t){return function(t){for(var r=[],e=0;e<t.length;e++){var n=t.charCodeAt(e);n<128?r.push(n):n<2048?r.push(192|n>>6,128|63&n):n<55296||n>=57344?r.push(224|n>>12,128|n>>6&63,128|63&n):(e++,n=65536+((1023&n)<<10|1023&t.charCodeAt(e)),r.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|63&n))}return r}(t)},function(t){"function"==typeof define&&define.amd?define([],t):"object"==typeof exports&&(module.exports=t())}((function(){return qrcode}));
//# sourceMappingURL=/sm/26b4b0d0b1e283d6b3ec9857ac597d7a60c76ac17be1ef4c965f03086de426bb.map
  // ---- end vendored qrcode-generator ----

  var PLAT_COLORS = ['#E3002B', '#F35B00', '#FFC90E', '#D7157A', '#E895C0', '#007A61', '#87D300', '#C4D600', '#8DD1BF', '#616130', '#00538A', '#008CC1', '#00C1D5', '#79C8ED', '#CDBB79', '#41136A', '#935CB9', '#BCA8D1', '#7A0026', '#BC7B70'];
  var RAINBOW_BG = 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)';

  function $(id) { return document.getElementById(id); }
  function storeGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function storeSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  function normName(s) { return (s || '').trim().toLowerCase(); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); } // 補齊引號跳脫（稽核 B-02：esc 也用在 value="..." 屬性上下文，未跳脫的引號可突破屬性）；與 pbEsc 規格統一為五字元
  function platSafeColor(c) { // 顏色白名單（稽核 B-03）：只放行 PLAT_COLORS、rainbow 與 #rrggbb，其餘一律中性灰——防自報顏色拼進 style 字串時突破屬性/注入 CSS
    if (c === 'rainbow') return 'rainbow';
    if (typeof c === 'string' && (PLAT_COLORS.indexOf(c) >= 0 || /^#[0-9a-fA-F]{6}$/.test(c))) return c;
    return '#94a3b8';
  }

  function myUid() { // 殼層持久身份：斷線重連/接管後仍是同一個人（賽程積分綁這個，不綁連線 pid）
    var u = storeGet('plat_uid');
    if (!u) { u = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9); storeSet('plat_uid', u); }
    return u;
  }
  var Net = {
    active: false, isHost: false, code: '', peer: null, myPid: '', hostPid: '', myUid: '', timeOffset: 0, // 來賓端估計的「房主時鐘 − 本地時鐘」毫秒差（D-05），房主恆 0
    armed: { game: (function () { try { var g = localStorage.getItem('plat_armed_game'); return (g === 'hashi' || g === 'sudoku' || g === 'mines') ? g : 'sudoku'; } catch (e) { return 'sudoku'; } })(), mode: 'coop' }, armedByGame: { sudoku: 'coop', hashi: 'coop', mines: 'coop' }, roomTab: 'sudoku',
    me: { name: '', color: PLAT_COLORS[2] },
    roster: [], conns: {}, gamePeer: null, inMatch: null, liveMatch: null, // liveMatch: 房主權威的「本房有對局進行中」快照 {game, mode, players:[uid], tourn}——回房間頁的選手靠它看到回到對局鈕
    lastSeen: {}, hostSeen: 0, _lastPing: 0, _hostWarned: false,
    presence: { pingMs: 10000, offlineMs: 25000, removeMs: 60000 }, // 在線心跳：10s ping、25s 標離線、60s 移除（比賽中只標離線不移除）
    videoOn: false, localStream: null, micMuted: true, speakerOn: false,
    remoteStreams: {}, remoteMic: {}, calls: {}, speakPrompted: {}, speakPid: null,
    chatOpen: false, chatMin: false, unread: 0, ending: false, joinRetry: false, tourn: null
  };
  window.__PLAT_NET = Net;

  var SLOT_NAMES = ['柴犬', '柯基', '虎斑貓', '橘貓', '倉鼠', '兔兔', '刺蝟', '龍貓', '水豚', '樹懶', '狐獴', '羊駝', '企鵝', '海獺', '貓頭鷹', '松鼠', '無尾熊', '台灣黑熊', '石虎', '穿山甲', '梅花鹿', '台灣藍鵲', '帝雉', '獼猴', '山羌', '綠蠵龜', '櫻花鉤吻鮭', '飛魚', '螢火蟲', '獨角仙'];
  var slotName = '', slotTimer = null;
  // 拉霸音效（WebAudio 小嗶聲；無音效環境/被擋就靜默）
  var platAC = null;
  function platTone(freq, dur, delay, type, vol) {
    try {
      if (!platAC) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; platAC = new AC(); }
      if (platAC.state === 'suspended') platAC.resume();
      var t0 = platAC.currentTime + (delay || 0);
      var o = platAC.createOscillator(), g = platAC.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(vol || 0.04, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(platAC.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    } catch (e) {}
  }
  function spinSound(totalMs) { // 滾動 tick 先密後疏（配合減速），落地叮噹兩聲
    var n = Math.max(6, Math.round(totalMs / 95));
    for (var i = 0; i < n; i++) {
      var p = i / n;
      platTone(620 + (i % 2) * 200, 0.03, (totalMs * (1 - Math.pow(1 - p, 2))) / 1000, 'square', 0.028);
    }
    platTone(880, 0.12, totalMs / 1000, 'sine', 0.06);
    platTone(1318, 0.2, totalMs / 1000 + 0.08, 'sine', 0.05);
  }
  function spinSlot(cb) {
    if (slotTimer) return;
    spinSound(1150);
    var el = $('slot-display'); var t0 = Date.now();
    el.classList.add('slot-spinning');
    (function tick() {
      slotName = SLOT_NAMES[Math.floor(Math.random() * SLOT_NAMES.length)];
      el.textContent = slotName;
      var elapsed = Date.now() - t0;
      if (elapsed < 1150) slotTimer = setTimeout(tick, 50 + (elapsed / 1150) * 160);
      else {
        slotTimer = null;
        el.classList.remove('slot-spinning'); el.classList.add('slot-land');
        setTimeout(function () { el.classList.remove('slot-land'); }, 350);
        $('lob-name').value = slotName;
        if (cb) cb();
      }
    })();
  }

  // ---------- 訊息傳送 ----------
  Net.myUid = myUid();
  function platSend(conn, obj) { if (!conn) return; var m = { __plat: 1 }; for (var k in obj) m[k] = obj[k]; if (m.kind === 'roster') m.now = Date.now(); /* 房主時間戳：來賓據此校正時鐘偏移（D-05） */ try { conn.send(m); } catch (e) {} }
  function platBroadcast(obj, exceptPid) {
    for (var pid in Net.conns) { if (pid !== exceptPid) platSend(Net.conns[pid], obj); }
  }
  function platToHost(obj) { var c = Net.conns[Net.hostPid]; if (c) platSend(c, obj); }
  window.__PLAT_TOAST = platToast;
  function platToast(msg) {
    var el = $('plat-toast');
    if (!el) {
      el = document.createElement('div'); el.id = 'plat-toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); // 狀態播報（稽核 F-01 快修：toast 是全平台的狀態通知通道）
      el.style.cssText = 'position:fixed;left:50%;bottom:118px;transform:translateX(-50%);z-index:100001;background:rgba(15,23,42,.93);color:#fff;font-weight:800;font-size:14px;padding:10px 18px;border-radius:999px;border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none;transition:opacity .3s;display:none';
      var sp = document.createElement('span'); sp.id = 'plat-toast-text'; el.appendChild(sp);
      document.body.appendChild(el);
    }
    var span = el.querySelector('span');
    if (!span) { span = document.createElement('span'); el.appendChild(span); }
    clearTimeout(platToast._t); clearTimeout(platToast._t2);
    // v1.55.0 Toast 升級：隱藏中（或退場淡出中）→ 由下 rise 升入＋settle 落定（.plat-toast-in 的 keyframes 全程合併 translate(-50%) 置中）；
    // 已可見時連續通知 → 文字走 PlatLite 滾換，不再整句瞬換（every change moves）
    var fresh = (el.style.display === 'none' || !el.style.display || el.style.opacity === '0');
    if (fresh) {
      span.textContent = msg;
      el.style.display = 'block'; el.style.opacity = '1';
      el.classList.remove('plat-toast-in'); void el.offsetWidth; el.classList.add('plat-toast-in');
    } else {
      el.style.opacity = '1';
      window.PlatLite(span, msg);
    }
    platToast._t = setTimeout(function () { el.style.opacity = '0'; platToast._t2 = setTimeout(function () { el.style.display = 'none'; el.classList.remove('plat-toast-in'); }, 320); }, 3600);
  }
  function platDistribute(obj, fromPid) {
    if (Net.isHost) platBroadcast(obj, fromPid); else platToHost(obj);
  }

  // ---------- 聊天 ----------
  function chatScrollBottom(list, smooth) {
    if (!list) return;
    try { if (smooth) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' }); else list.scrollTop = list.scrollHeight; }
    catch (e) { list.scrollTop = list.scrollHeight; }
  }
  function appendChat(m) {
    var list = $('plat-chat-list'); if (!list) return;
    var d = document.createElement('div');
    if (m.sys) { d.className = 'plat-msg sys'; d.textContent = m.text; }
    else {
      d.className = 'plat-msg';
      var who = document.createElement('span'); who.className = 'who'; who.textContent = m.name || '玩家';
      who.style.color = (m.color === 'rainbow') ? '#a855f7' : (m.color || '#1e293b');
      d.appendChild(who);
      d.appendChild(document.createTextNode(m.text || ''));
    }
    // v1.55.0 訊息進場（P1）：新訊息由下升入＋淡入（220ms settle；sys 同節奏、自己的訊息 rise 較大）；
    // 動畫結束移除 class、不殘留 transform 影響排版。造型不動（行列式是使用者定的版面）。
    d.classList.add('plat-msg-in'); if (m.mine) d.classList.add('mine');
    (function (node) { setTimeout(function () { node.classList.remove('plat-msg-in'); node.classList.remove('mine'); }, 300); })(d);
    list.appendChild(d);
    while (list.children.length > 120) list.removeChild(list.firstChild); // 保留上限（B-06：防刷屏讓 DOM 無界累積）
    chatScrollBottom(list, !!(Net.chatOpen && !Net.chatMin)); // 面板開著時平滑捲到底（被推著走）；關著時維持瞬跳（無人看）
    if (!m.sys && !m.mine && (!Net.chatOpen || Net.chatMin)) { Net.unread++; renderUnread(); }
  }
  function sysChat(text) { appendChat({ sys: true, text: text }); }
  function renderUnread() {
    var b = $('dock-chat-badge'); if (b) { b.style.display = Net.unread > 0 ? 'flex' : 'none'; window.PlatLite(b, Net.unread > 99 ? '99+' : Net.unread); }
    var u = $('plat-chat-unread'); if (u) { u.style.display = (Net.chatOpen && Net.chatMin && Net.unread > 0) ? 'inline-block' : 'none'; window.PlatLite(u, Net.unread > 99 ? '99+' : Net.unread); }
    if (window.PlatDock) window.PlatDock._emit();
  }
  function openChat() {
    Net.chatOpen = true; Net.chatMin = false; Net.unread = 0; renderUnread();
    var w = $('plat-chat'); if (w) { if (w._fadeT) { clearTimeout(w._fadeT); w._fadeT = null; } w.style.opacity = ''; w.style.display = 'block'; }
    platPopOpen($('plat-chat-panel'), '50% 100%', 'block', true); // v1.55.0：面板本體收編 popover 通則（由下微放大落定）
    $('plat-chat-body').style.display = 'flex'; $('plat-chat-min').textContent = '🔽';
    var list = $('plat-chat-list'); if (list) list.scrollTop = list.scrollHeight;
  }
  function closeChat() { Net.chatOpen = false; var ep = $('plat-chat-emojis'); if (ep) platPopClose(ep); platPopClose($('plat-chat-panel'), function () { var w = $('plat-chat'); if (w && !Net.chatOpen) w.style.display = 'none'; }, true); }
  function sendChat() {
    var inp = $('plat-chat-input'); var text = (inp.value || '').trim().slice(0, 200); if (!text || !Net.active) return; // 送出端也截斷（B-06，不只靠 HTML maxlength）
    inp.value = '';
    var m = { kind: 'chat', pid: Net.myPid, name: Net.me.name, color: Net.me.color, text: text };
    appendChat({ name: m.name, color: m.color, text: text, mine: true });
    platDistribute(m, Net.myPid);
  }

  // ---------- 大廳 UI ----------
  function lobbyMsg(t) { var el = $('lob-msg'); if (el) window.PlatLite(el, t || ''); } // F2：連線狀態字改滾換（同字不重播由 PlatLite 內部把關）
  function showStep(s) {
    $('lob-step-entry').style.display = (s === 'entry') ? 'block' : 'none';
    $('lob-step-nick').style.display = (s === 'nick') ? 'block' : 'none';
    var rm = $('lob-step-room'); if (rm) rm.style.display = (s === 'room') ? 'block' : 'none';
    if (s === 'entry') refreshRejoin();
    if (s === 'nick') { Net.colorPicked = false; renderColors(); } // 每次回到暱稱步，代表色視為尚未決定（摩天輪慢轉＋顯示「？」）：按確認進房時會自動轉
    rejoinBusy(false);
  }
  function hubVisible() { var rm = $('lob-step-room'); return !!(rm && rm.style.display === 'block' && Net.active && !Net.inMatch); }
  // 回到房間鈕（只在大廳，不放主畫面）：跟舊數獨同款——先灰色探測房間還在不在，
  // 找到 → 亮藍色可點；找不到 → 灰色「房間已失效」。探測結果快取 20 秒，避免反覆打擾房主端。
  var REJOIN_ON = 'w-full mt-4 py-3 bg-sky-400 border-[3px] border-slate-800 rounded-xl font-black text-lg text-slate-900 shadow-[3px_3px_0px_rgba(30,41,59,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer';
  var REJOIN_OFF = 'w-full mt-4 py-3 bg-slate-200 border-[3px] border-slate-800 rounded-xl font-black text-lg text-slate-400 cursor-not-allowed';
  var rejoinProbe = { code: null, state: 'idle', at: 0 }; // state: idle|probing|alive|dead
  var rejoinBusyOn = false;
  function refreshRejoin() {
    var rc = storeGet('plat_room');
    var b = $('lob-rejoin'); if (!b) return;
    if (!rc || Net.active) { b.style.display = 'none'; return; }
    b.style.display = '';
    var fresh = rejoinProbe.code === rc && rejoinProbe.state !== 'idle' && (Date.now() - rejoinProbe.at < 20000);
    if (!fresh && rejoinProbe.state !== 'probing' && !Net.peer) probeRoom(rc);
    else renderRejoinBtn();
  }
  window.__PLAT_REFRESH_REJOIN = refreshRejoin;
  function renderRejoinBtn() {
    var b = $('lob-rejoin'); if (!b || rejoinBusyOn) return;
    var rc = storeGet('plat_room');
    if (!rc || Net.active) { b.style.display = 'none'; return; }
    b.style.display = '';
    if (rejoinProbe.code === rc && rejoinProbe.state === 'alive') {
      b.disabled = false; b.className = REJOIN_ON;
      b.innerHTML = '↩ 回到房間 <span id="lob-rejoin-code">' + rc + '</span>';
    } else if (rejoinProbe.code === rc && rejoinProbe.state === 'dead') {
      if (storeGet('plat_room_role') === 'host' && rc === storeGet('plat_code')) {
        b.disabled = false; b.className = REJOIN_ON; // 房主本人：房號是自己的，給他同房號重開（不然會被鎖在自己房間外）
        b.innerHTML = '🏠 用同房號重開房間 <span id="lob-rejoin-code">' + rc + '</span>';
      } else {
        b.disabled = true; b.className = REJOIN_OFF;
        b.innerHTML = '🚫 房間已失效 (<span id="lob-rejoin-code">' + rc + '</span>)';
      }
    } else {
      b.disabled = true; b.className = REJOIN_OFF + ' animate-pulse';
      b.innerHTML = '🔍 正在尋找房間 <span id="lob-rejoin-code">' + rc + '</span>…';
    }
  }
  function probeRoom(code) {
    rejoinProbe = { code: code, state: 'probing', at: Date.now() };
    renderRejoinBtn();
    var done = false, pp = null;
    var finish = function (alive) {
      if (done) return; done = true;
      clearTimeout(timer);
      try { if (pp) pp.destroy(); } catch (e) {}
      if (rejoinProbe.code === code && rejoinProbe.state === 'probing') { rejoinProbe.state = alive ? 'alive' : 'dead'; rejoinProbe.at = Date.now(); }
      renderRejoinBtn();
    };
    var timer = setTimeout(function () { finish(false); }, 5000);
    try {
      pp = new RealPeer();
      pp.on('open', function () {
        var c = pp.connect('yyh-tgsh-' + code + '-host');
        c.on('open', function () { finish(true); });
        c.on('error', function () { finish(false); });
      });
      pp.on('error', function () { finish(false); });
    } catch (e) { finish(false); }
  }
  function rejoinBusy(on) { // 回到房間鈕的按下回饋：連線中改字＋脈動＋禁用，避免使用者以為沒點到
    rejoinBusyOn = !!on;
    ['lob-rejoin'].forEach(function (id) {
      var b = $(id); if (!b) return;
      if (on) {
        if (!b._origHtml) b._origHtml = b.innerHTML;
        b.disabled = true; b.classList.add('animate-pulse'); b.innerHTML = '⏳ 正在連線…';
      } else if (b._origHtml) {
        b.disabled = false; b.classList.remove('animate-pulse'); b.innerHTML = b._origHtml; b._origHtml = null;
        refreshRejoin();
      }
    });
    if (on) { clearTimeout(rejoinBusy._t); rejoinBusy._t = setTimeout(function () { rejoinBusy(false); }, 20000); }
    else clearTimeout(rejoinBusy._t);
  }
  function doRejoin() {
    var rc = storeGet('plat_room'); if (!rc) return;
    if (Net.active) { window.PLAT_show('lobby'); return; } // 已在房間裡：直接回房間頁，不要重複入房
    window.PLAT_show('lobby');
    var savedName = storeGet('plat_name');
    if (!savedName) { // 尚無身份（第一次）才退回暱稱步，房號已預填
      Net.lobMode = 'join'; $('lob-joinrow').style.display = 'block'; lobbyMsg(''); showStep('nick');
      $('lob-code').value = rc;
      return;
    }
    // 一鍵重連：暱稱/顏色/房號/角色都照舊，直接連線，不經暱稱步
    Net.me.name = savedName;
    var savedColor = storeGet('plat_color'); if (savedColor) Net.me.color = savedColor;
    lobbyMsg('⏳ 正在連線…');
    rejoinBusy(true);
    if (rejoinProbe.code === rc && rejoinProbe.state === 'alive') { $('lob-code').value = rc; joinRoom(); } // 房間還在（含已被接管）→ 以來賓身分回座
    else if (storeGet('plat_room_role') === 'host' && rc === storeGet('plat_code')) createRoom(); // 房間不在了＋自己是原房主 → 同房號重開
    else { $('lob-code').value = rc; joinRoom(); }
  }
  function showIdle() { showStep('entry'); }
  function renderLobby() {
    document.body.classList.toggle('plat-room-on', !!Net.active);
    // 未連線時若使用者正在暱稱步，不可把畫面踢回入口步（拉霸選色等 render 呼叫會踩到）
    if (!Net.active) { var nk = $('lob-step-nick'); if (!nk || nk.style.display !== 'block') showIdle(); return; }
    if (hubVisible()) hubRender();
    renderTourn();
    renderInvite();
  }
  // ---------- 邀請連結＋QR（v1.51.0）：房主房號固定，連結＝房號的另一種寫法 ----------
  function inviteUrl() { try { return location.origin + location.pathname + '?room=' + Net.code; } catch (e) { return ''; } }
  function drawInviteQR(text) {
    var cv = $('hub-invite-qr'); if (!cv || typeof qrcode !== 'function' || !text) return;
    if (cv._qrText === text) return;
    cv._qrText = text;
    try {
      var qr = qrcode(0, 'M'); qr.addData(text); qr.make();
      var n = qr.getModuleCount(), ctx = (cv.getContext && cv.getContext('2d')); if (!ctx) return;
      var cell = cv.width / (n + 8); // 左右各 4 模組靜默區，掃描器才讀得到
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#1e293b';
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(Math.floor((c + 4) * cell), Math.floor((r + 4) * cell), Math.ceil(cell), Math.ceil(cell));
    } catch (e) {}
  }
  function renderInvite() {
    var box = $('hub-invite'); if (!box) return;
    var on = !!(Net.active && Net.isHost && Net.code);
    box.style.display = on ? 'block' : 'none';
    if (!on) return;
    var url = inviteUrl(), inp = $('hub-invite-link');
    if (inp && inp.value !== url) inp.value = url;
    drawInviteQR(url);
  }
  // ---------- 代表色摩天輪工廠（v1.22.0） ----------
  // 大廳與選色覆蓋層（遊戲名條點自己、名單編輯器）共用同一份實作，畫面與行為保證一致。
  // 動畫一律 JS 逐格（requestAnimationFrame）驅動：轉子轉的同時把每台車廂反向轉回正立（CSS animation 做不到）。
  // 狀態：idle（未決定：慢轉 12°/s、圓心「？」）／spin（加速→高速→緩停 2.8s、停在目標車廂）／
  //       rest（已決定靜止對位）／rainbow（持續自轉 90°/s＋車廂與圓心彩虹色相動畫）。
  // 選色一律靠轉（＋連按 5 次彩虹），沒有任何直接指定顏色的入口——使用者定案。
  var FERRIS_SPIN_MS = 2800;
  function createFerris(mount, opts) {
    opts = opts || {};
    var SEG = 360 / PLAT_COLORS.length;
    var wrap = document.createElement('div'); wrap.className = 'fw-wrap';
    wrap.innerHTML = '<div class="fw-pointer">▼</div><div class="fw-stand"><span class="fw-leg l"></span><span class="fw-leg r"></span><span class="fw-base"></span></div><div class="fw-wheel"></div><div class="fw-rotor"><span class="fw-ring r1"></span><span class="fw-ring r2"></span></div><div class="fw-hub"></div>';
    mount.appendChild(wrap);
    var wheel = wrap.querySelector('.fw-wheel'), rotor = wrap.querySelector('.fw-rotor'), hub = wrap.querySelector('.fw-hub');
    hub.style.fontSize = '30px'; hub.style.color = '#b45309';
    var cabs = [];
    PLAT_COLORS.forEach(function (c, i) {
      var b = document.createElement('button');
      b.className = 'wseg'; b.title = c; b.style.transform = 'rotate(' + (i * SEG) + 'deg)';
      b.setAttribute('data-lob-color', String(i));
      var arm = document.createElement('span'); arm.className = 'cab-arm';
      var cab = document.createElement('span'); cab.className = 'cab'; cab.style.background = c;
      b.appendChild(arm); b.appendChild(cab);
      b.onclick = function () { if (opts.onPress) opts.onPress(); else api.spin(null); };
      rotor.appendChild(b); cabs.push(cab);
    });
    var rot = 0, mode = 'rest', rafId = null, lastTs = 0, spinGen = 0, spinning = false;
    function applyRot() {
      rotor.style.transform = 'rotate(' + rot + 'deg)';
      for (var i = 0; i < cabs.length; i++) cabs[i].style.transform = 'translate(-50%, 0) rotate(' + (-(rot + i * SEG)) + 'deg)'; // 車廂繞「最頂端尖尖的指點（吊掛點，transform-origin 在車廂上方 8px）」保持正立——吊著轉，不是繞車廂中心轉（實體物理）
    }
    function loop(ts) {
      if (mode !== 'idle' && mode !== 'rainbow') { rafId = null; return; }
      if (lastTs) { rot += (ts - lastTs) / 1000 * (mode === 'rainbow' ? 90 : 12); applyRot(); if (mode === 'idle') followHub(); }
      lastTs = ts; rafId = requestAnimationFrame(loop);
    }
    function startLoop(m) { mode = m; lastTs = 0; if (!rafId) rafId = requestAnimationFrame(loop); }
    function stopLoop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } if (mode === 'idle' || mode === 'rainbow') mode = 'rest'; }
    function paintHub(color, mark) {
      hub.classList.remove('plat-rainbow-anim'); hub.style.background = '';
      if (mark) { hub.style.background = '#fff7e0'; hub.textContent = mark; }
      else if (color === 'rainbow') { hub.classList.add('plat-rainbow-anim'); hub.textContent = ''; }
      else { hub.style.background = color || '#ccc'; hub.textContent = ''; }
    }
    // 車廂指點（吊掛點）角＝ i*SEG（.cab 的指點定位在分段起點角上）——停車一律對齊車廂的指點（最頂端尖尖）到指針下，指針指著尖尖、不壓線
    function cabinIdxAt(rotDeg) { var m = ((-(rotDeg) % 360) + 360) % 360; return Math.round(m / SEG) % PLAT_COLORS.length; }
    function visualRot() { // spin 中 rotor 由 CSS transition 驅動，JS 的 rot 是終點值——讀實際矩陣角才能跟色
      try { var t = getComputedStyle(rotor).transform; if (!t || t === 'none') return rot; var mm = t.match(/matrix\(([^)]+)\)/); if (!mm) return rot; var v = mm[1].split(','); return Math.atan2(parseFloat(v[1]), parseFloat(v[0])) * 180 / Math.PI; } catch (e) { return rot; }
    }
    function followHub() { paintHub(PLAT_COLORS[cabinIdxAt(visualRot())], ''); } // 旋轉時圓心跟著指針下的車廂變色（使用者定案：不要問號）
    function alignTo(idx) {
      var wantMod = ((360 - idx * SEG) % 360 + 360) % 360;
      var curMod = ((rot % 360) + 360) % 360;
      rot += ((wantMod - curMod) + 360) % 360;
      rotor.classList.remove('spinning'); applyRot();
    }
    var api = {
      el: wrap, hubEl: hub, rotorEl: rotor, wheelEl: wheel,
      isRainbow: function () { return mode === 'rainbow'; },
      isSpinning: function () { return spinning; },
      spin: function (onDone) {
        if (spinning) return;
        if (mode === 'rainbow') api.rainbowOff();
        stopLoop();
        spinning = true;
        // 顏色不可重複（使用者定案）：房裡已被別人占用的顏色不進落點池，轉盤照跑、最後停在剩下的顏色上（20 人時最後一人就只剩最後一色）
        var taken = (opts.getTaken ? (opts.getTaken() || []) : []);
        var avail = [];
        for (var ai = 0; ai < PLAT_COLORS.length; ai++) { if (taken.indexOf(PLAT_COLORS[ai]) < 0) avail.push(ai); }
        if (!avail.length) { for (var aj = 0; aj < PLAT_COLORS.length; aj++) avail.push(aj); }
        var idx = avail[Math.floor(Math.random() * avail.length)];
        var c = PLAT_COLORS[idx];
        var wantMod = ((360 - idx * SEG) % 360 + 360) % 360;
        var curMod = ((rot % 360) + 360) % 360;
        rot += 6 * 360 + (((wantMod - curMod) + 360) % 360); // 先加速衝 6 圈再緩停到目標車廂正中心
        var gen = ++spinGen;
        rotor.classList.add('spinning'); applyRot();
        var follow = function () { if (gen !== spinGen || !spinning) return; followHub(); requestAnimationFrame(follow); };
        requestAnimationFrame(follow);
        setTimeout(function () {
          if (gen !== spinGen) return; // 被彩虹觸發作廢
          spinning = false; rotor.classList.remove('spinning');
          if (onDone) onDone(c);
        }, FERRIS_SPIN_MS + 60);
      },
      pointerColor: function () { return PLAT_COLORS[cabinIdxAt(visualRot())]; },
      rainbowOn: function () {
        spinGen++; spinning = false; rotor.classList.remove('spinning');
        wrap.classList.add('rainbow-mode'); rotor.classList.add('is-rainbow');
        paintHub('rainbow', '');
        startLoop('rainbow');
      },
      rainbowOff: function () {
        wrap.classList.remove('rainbow-mode'); rotor.classList.remove('is-rainbow');
        stopLoop(); applyRot();
      },
      setUndecided: function () {
        spinGen++; spinning = false; rotor.classList.remove('spinning');
        if (mode === 'rainbow') api.rainbowOff();
        followHub(); // 不再顯示問號：未決定時也在轉，圓心直接跟著指針下的車廂變色
        startLoop('idle');
      },
      setDecided: function (color) {
        spinGen++; spinning = false; rotor.classList.remove('spinning');
        if (mode === 'rainbow' && color !== 'rainbow') api.rainbowOff();
        stopLoop();
        paintHub(color, '');
        var idx = PLAT_COLORS.indexOf(color);
        if (idx >= 0) alignTo(idx);
      },
      destroy: function () { spinGen++; stopLoop(); if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
    };
    applyRot();
    return api;
  }
  // ---------- 大廳摩天輪（工廠實例 #1） ----------
  var lobWheel = null;
  // 房裡其他人已占用的顏色（名稱與顏色都要不同——使用者定案）：選色落點與彩虹觸發都要避開
  function takenColorsForPicker() {
    var t = [];
    if (Net.active && Net.roster) Net.roster.forEach(function (p) { if ((p.uid || p.pid) !== Net.myUid && p.color && t.indexOf(p.color) < 0) t.push(p.color); });
    return t;
  }
  function getLobWheel() { if (!lobWheel) { var m = $('lob-wheel-wrap'); if (!m) return null; lobWheel = createFerris(m, { onPress: function () { spinColor(); }, getTaken: takenColorsForPicker }); } return lobWheel; }
  function settleLobbyColor(c) {
    Net.me.color = c; storeSet('plat_color', c);
    if (c === 'rainbow') storeSet('plat_rainbow', '1'); // 觸發即解鎖（房間編輯等舊路徑相容）
    Net.colorPicked = true;
    renderColors(); if (Net.active) renderLobby();
  }
  function renderColors() {
    var w = getLobWheel(); if (!w) return;
    var dot = $('lob-color-dot');
    if (dot) {
      dot.classList.remove('plat-rainbow-anim'); dot.style.background = ''; dot.textContent = '';
      dot.style.display = 'inline-flex'; dot.style.alignItems = 'center'; dot.style.justifyContent = 'center'; dot.style.fontWeight = '900'; dot.style.color = '#b45309'; dot.style.fontSize = '17px';
      if (w.isRainbow() || (Net.colorPicked && Net.me.color === 'rainbow')) dot.classList.add('plat-rainbow-anim');
      else if (!Net.colorPicked) { dot.style.background = '#e2e8f0'; dot.textContent = '?'; } // 未決定：色票顯示「？」（使用者定案：每次打開暱稱步都應是問號，不要拿指針下的顏色冒充已決定——renderColors 不是逐格呼叫，色票會凍在某一色看起來像已選定）
      else dot.style.background = Net.me.color || '#ccc';
    }
    if (w.isRainbow()) return;
    if (!Net.colorPicked) w.setUndecided(); else w.setDecided(Net.me.color);
  }
  // 彩虹模式開關（快速連按選色鈕 5 次觸發；世代/回呼由工廠與 spinColor 的 colorSpinCb 接手）
  function triggerRainbow() {
    var w = getLobWheel(); if (!w || w.isRainbow()) return;
    if (takenColorsForPicker().indexOf('rainbow') >= 0) { platToast('🌈 彩虹已被其他玩家使用，自動轉一般選色'); spinColor(); return; } // 顏色不可重複：彩虹被占用就不觸發
    var f = colorSpinCb; colorSpinCb = null;
    colorSpinning = false;
    w.rainbowOn();
    settleLobbyColor('rainbow');
    lobbyMsg('🌈 彩虹模式！摩天輪轉起來了');
    if (f) f();
  }
  var colorPressTimes = [];
  function onColorButton() {
    var now = Date.now();
    colorPressTimes = colorPressTimes.filter(function (t) { return now - t <= 2800; });
    colorPressTimes.push(now);
    if (colorPressTimes.length >= 5) { colorPressTimes = []; triggerRainbow(); return; }
    spinColor();
  }
  var colorSpinning = false, colorSpinCb = null;
  function spinColor(cb) {
    var w = getLobWheel(); if (!w) { if (cb) cb(); return; }
    if (colorSpinning) { if (cb) colorSpinCb = cb; return; } // 按鈕不 disable：連按要計數觸發彩虹，重疊 spin 由此守衛擋下
    colorSpinning = true;
    spinSound(FERRIS_SPIN_MS);
    w.spin(function (c) { // 工廠 spin 在彩虹中會先退出彩虹再正常轉
      colorSpinning = false;
      settleLobbyColor(c);
      var f = colorSpinCb; colorSpinCb = null; if (f) f();
    });
    if (cb) colorSpinCb = cb;
  }
  // ---------- 選色覆蓋層（工廠實例 #2）：遊戲名條點自己、名單編輯器改色都開這一張 ----------
  // window.__PLAT_PICK_COLOR(currentColor, cb, opts)：定色 cb(顏色)、取消 cb(null)。
  // 從遊戲呼叫視為「改自己的代表色」：定色後走殼的身份路徑同步名單（opts.noIdentity 時只回傳顏色，給編輯器儲存流程自己送）。
  var pickCtx = null;
  function applyPickedSelfColor(c) {
    if (c === 'rainbow') storeSet('plat_rainbow', '1');
    if (Net.isHost && Net.active) {
      var entry = null; Net.roster.forEach(function (p) { if ((p.uid || p.pid) === Net.myUid) entry = p; });
      if (entry) { hubApplyIdentity(entry, entry.name, c); return; }
    }
    if (Net.active) platToHost({ kind: 'identity', name: Net.me.name, color: c });
    Net.me.color = c; storeSet('plat_color', c); updateDock();
  }
  window.__PLAT_PICK_COLOR = function (currentColor, cb, opts) {
    opts = opts || {};
    if (pickCtx) { if (cb) cb(null); return; }
    var ov = $('plat-pick'); if (!ov) { if (cb) cb(null); return; }
    ov.style.display = 'flex';
    var mount = $('plat-pick-wheel'); mount.innerHTML = '';
    var presses = [];
    var wheel = createFerris(mount, { onPress: function () { ovPress(); }, getTaken: takenColorsForPicker });
    wheel.setDecided(currentColor || PLAT_COLORS[0]);
    var ctx = pickCtx = { done: false };
    function finish(c) {
      if (ctx.done) return; ctx.done = true; pickCtx = null;
      ov.style.display = 'none'; wheel.destroy();
      if (c && !opts.noIdentity) applyPickedSelfColor(c);
      if (cb) cb(c);
    }
    function ovSpin() {
      if (wheel.isSpinning()) return;
      spinSound(FERRIS_SPIN_MS);
      wheel.spin(function (c) { finish(c); });
    }
    function ovPress() {
      var now = Date.now();
      presses = presses.filter(function (t) { return now - t <= 2800; });
      presses.push(now);
      if (presses.length >= 5) { presses = []; if (takenColorsForPicker().indexOf('rainbow') >= 0) { platToast('🌈 彩虹已被其他玩家使用，自動轉一般選色'); ovSpin(); return; } wheel.rainbowOn(); finish('rainbow'); return; }
      ovSpin();
    }
    $('plat-pick-spin').onclick = ovPress;
    $('plat-pick-close').onclick = function () { if (!wheel.isSpinning()) finish(null); };
  };
  function readIdentity() { return Net.me.name || ''; }

  // ---------- 房間框架（v1.11.0）：進房先到殼的房間頁，不載入任何遊戲 ----------
  // 分頁（數獨/數橋/錦標賽）＋各款自己的設定表單＋準備/觀戰都在殼層；房主按開始才 doLaunch 載入遊戲。
  var HUB_SIZES = [{ id: 4, name: '4x4 幼幼班' }, { id: 9, name: '9x9 標準' }, { id: 16, name: '16x16 史詩' }];
  var HUB_DIFFS = [{ id: 'easy', name: '🟢 簡單' }, { id: 'medium', name: '🟡 普通' }, { id: 'hard', name: '🔴 困難' }];
  var HUB_LEVELS = [{ id: 1, name: '5x5 幼幼班' }, { id: 2, name: '10x10 標準' }, { id: 3, name: '10x20 手機直式' }, { id: 4, name: '15x15 魔王' }, { id: 5, name: '20x20 史詩' }, { id: 'custom', name: '⚙️ 自訂尺寸' }];
  var HUB_MINES_SIZES = [{ id: 9, name: '9×9・10 雷' }, { id: 16, name: '16×16・40 雷' }, { id: 'custom', name: '⚙️ 自訂盤面' }];
  function hubDefaults() {
    return {
      sudoku: { mode: 'coop', sizeId: 9, diffId: 'medium', winnersCount: 3, allowWeapons: true, allowGifts: true, allowYellowHint: false, showNumbersInGodMode: false, allowOthersToPlayAgain: true, allowQuickFill: false, allowTraversal: false, weaponStartTime: 60 },
      hashi: { mode: 'coop', sizeId: 2, itemsEnabled: true, godNumbers: true, customW: 15, customH: 15 },
      mines: { mode: 'coop', sizeId: 9, allowItems: true, itemStartTime: 60, customW: 16, customH: 16, customMines: 40 }
    };
  }
  function ensureHub() {
    if (Net.hub) return Net.hub;
    var cfg = hubDefaults();
    try { var saved = JSON.parse(storeGet('plat_hub_cfg') || 'null'); if (saved) { for (var g in cfg) { if (saved[g]) { for (var k in cfg[g]) { if (saved[g][k] !== undefined) cfg[g][k] = saved[g][k]; } } } } } catch (e) {}
    Net.hub = { ready: {}, spec: {}, cfg: cfg, enteredAt: 0, _accent: null, _wired: false };
    return Net.hub;
  }
  function hubSaveCfg() { var H = ensureHub(); try { storeSet('plat_hub_cfg', JSON.stringify(H.cfg)); } catch (e) {} }
  function hubAccent() { return Net.roomTab === 'tourn' ? '#f59e0b' : (Net.armed.game === 'hashi' ? '#4ade80' : (Net.armed.game === 'mines' ? '#f97316' : '#ffcc00')); }
  function hubGameMode(game) { var H = ensureHub(); return H.cfg[game].mode; }
  function hubStateBroadcast() { platBroadcast({ kind: 'hubstate', ready: ensureHub().ready, spec: ensureHub().spec }); }
  function hubCfgBroadcast(game) { platBroadcast({ kind: 'hubcfg', game: game, cfg: ensureHub().cfg[game] }); }
  function hubMinesCustom(c) { // 地雷自訂規格 clamp（與遊戲端 clampCustomSpec 同界：寬 8–30、高 8–24、雷 5..格數−9，首點保護圈要留 9 格）
    var w = Math.max(8, Math.min(30, Math.round(Number(c.customW) || 16)));
    var h = Math.max(8, Math.min(24, Math.round(Number(c.customH) || 16)));
    var m = Math.max(5, Math.min(w * h - 9, Math.round(Number(c.customMines) || 40)));
    return { w: w, h: h, mines: m };
  }
  function hubLaunchCfg(game) {
    var H = ensureHub(), c = H.cfg[game];
    if (game === 'sudoku') { var wt = Number(c.weaponStartTime); if (isNaN(wt)) wt = 60; wt = Math.max(0, Math.min(600, wt));
      return { mode: c.mode, sizeId: Number(c.sizeId) || 9, diffId: c.diffId || 'medium',
      brawl: { winnersCount: Number(c.winnersCount) || 3, allowWeapons: c.allowWeapons !== false, allowGifts: c.allowGifts !== false, allowYellowHint: !!c.allowYellowHint, showNumbersInGodMode: !!c.showNumbersInGodMode, allowOthersToPlayAgain: c.allowOthersToPlayAgain !== false, allowQuickFill: !!c.allowQuickFill, allowTraversal: !!c.allowTraversal, hideAnswers: true, weaponStartTime: wt } }; }
    if (game === 'mines') { var wt2 = Number(c.itemStartTime); if (isNaN(wt2)) wt2 = 60; wt2 = Math.max(0, Math.min(600, wt2));
      if (String(c.sizeId) === 'custom') return { mode: c.mode, sizeId: 'custom', custom: hubMinesCustom(c), allowItems: c.allowItems !== false, itemStartTime: wt2, brawl: {} }; // 自訂盤：sizeId 保持字串 'custom'（Number() 會變 NaN 被吞成 9），規格走 custom 欄位給遊戲註冊
      return { mode: c.mode, sizeId: Number(c.sizeId) || 9, allowItems: c.allowItems !== false, itemStartTime: wt2, brawl: {} }; }
    return { mode: c.mode, sizeId: c.sizeId === 'custom' ? 'custom' : (Number(c.sizeId) || 2), customW: Math.max(5, Math.min(100, Number(c.customW) || 15)), customH: Math.max(5, Math.min(100, Number(c.customH) || 15)), brawl: { itemsEnabled: c.itemsEnabled !== false, godNumbers: c.godNumbers !== false } };
  }
  function hubRacers() { return Net.roster.slice(); } // 房間頁不分觀戰：進房的都是選手（觀戰是對局內的事）
  function hubSpec() {
    var H = ensureHub();
    var game = Net.armed.game, c = H.cfg[game] || hubDefaults()[game] || hubDefaults().sudoku; // cfg 缺遊戲（舊版存檔/異常狀態）也不能讓房間頁掛掉
    var brawl = c.mode === 'brawl' || c.mode === 'race';
    var tournSetup = Net.roomTab === 'tourn' && !Net.tourn; // 錦標賽設定階段：準備與開始比照其他競速模式（v1.48.0 統一；原本錦標賽沒有準備步驟、房主在設定面板直接開賽，跟其他模式不一樣）
    var tournActive = Net.roomTab === 'tourn' && !!Net.tourn;
    if (tournSetup) brawl = true; else if (tournActive) brawl = false;
    var racers = hubRacers();
    var allReady = racers.length > 0 && racers.every(function (p) { return !!H.ready[p.uid || p.pid]; });
    var waited = H.enteredAt ? (Date.now() - H.enteredAt) : 0;
    var waitLeft = Math.max(0, (window.PLAT_START_WAIT_MS || 60000) - waited);
    var canStart = racers.length >= 2 && (!brawl || allReady || waitLeft <= 0);
    var players = Net.roster.map(function (p) {
      var key = p.uid || p.pid, isSpec = !!H.spec[key];
      var badge = null;
      if (isSpec) badge = { kind: 'spec', text: '👁️ 觀戰' };
      else if (p.host) badge = { kind: 'ready', text: '👑 房主' };
      else if (brawl) badge = H.ready[key] ? { kind: 'ready', text: '✅ 已準備' } : { kind: '', text: '未準備' };
      var editing = H._idEdit === key;
      return { key: key, name: p.name, color: p.color, isMe: key === Net.myUid, isHost: !!p.host, online: p.offline ? false : true, badge: badge,
        editable: !!(Net.isHost || key === Net.myUid), editing: editing,
        editName: editing ? (H._idName != null ? H._idName : p.name) : '', editColor: editing ? (H._idColor || p.color) : '',
        editRainbow: !!(editing && key === Net.myUid && storeGet('plat_rainbow') === '1') };
    });
    var start = null, waitingText = null;
    if (tournActive) { start = null; waitingText = null; }
    else if (tournSetup && Net.isHost) {
      var tNote = null;
      if (racers.length < 2) tNote = '等待選手加入（至少 2 位）…';
      else if (!allReady && waitLeft > 0) tNote = '等待全員準備（或 ' + Math.ceil(waitLeft / 1000) + ' 秒後開放開始）';
      start = { label: '🏆 開賽（全員進第 1 局）', disabled: !(racers.length >= 2 && (allReady || waitLeft <= 0)), note: tNote };
    }
    else if (Net.isHost) {
      var note = null;
      if (racers.length < 2) note = '等待選手加入（至少 2 位）…';
      else if (brawl && !allReady && waitLeft > 0) note = '等待全員準備（或 ' + Math.ceil(waitLeft / 1000) + ' 秒後開放開始）';
      start = { label: brawl ? '⚔️ 開始大亂鬥' : '🤝 開始合作', disabled: !canStart, note: note };
    } else waitingText = '等待房主開始…';
    return {
      title: '🏠 房間', code: Net.code, players: players,
      myReady: brawl ? !!H.ready[Net.myUid] : null,
      mySpectator: null,
      start: start, waitingText: waitingText, showRefresh: false
    };
  }
  function hubModeBtns(game, mode, cur) {
    var dis = Net.isHost ? '' : ' disabled';
    var on = 'background:#1e293b;color:#fff';
    return '<button data-hub-mode="' + mode + '" data-hub-game="' + game + '"' + dis + ' class="flex-1 px-2 py-2 rounded-lg border-2 border-slate-800 font-black text-sm" style="' + (cur === mode ? on : 'background:#f1f5f9;color:#64748b') + '">' + (mode === 'coop' ? '🤝 合作模式' : (game === 'mines' ? '⚔️ 競速模式' : '⚔️ 大亂鬥模式')) + '</button>';
  }
  function hubSel(game, key, val, opts) {
    var dis = Net.isHost ? '' : ' disabled';
    var h = '<select data-hub-key="' + key + '" data-hub-game="' + game + '"' + dis + ' class="flex-1 bg-white border-2 border-slate-800 rounded p-1.5 font-black text-slate-700 outline-none">';
    opts.forEach(function (o) { h += '<option value="' + o.id + '"' + (String(o.id) === String(val) ? ' selected' : '') + '>' + esc(o.name) + '</option>'; });
    return h + '</select>';
  }
  function hubChk(game, key, val, label) {
    var dis = Net.isHost ? '' : ' disabled';
    return '<label class="flex items-center justify-between font-bold text-slate-700 text-sm py-0.5"><span>' + label + '</span><input type="checkbox" data-hub-key="' + key + '" data-hub-game="' + game + '"' + (val ? ' checked' : '') + dis + ' class="w-5 h-5 accent-purple-500"></label>';
  }
  function hubNum(game, key, val, label, min, max) {
    var dis = Net.isHost ? '' : ' disabled';
    return '<label class="flex items-center justify-between font-bold text-slate-700 text-sm py-0.5"><span>' + label + '</span><input type="number" min="' + min + '" max="' + max + '" data-hub-key="' + key + '" data-hub-game="' + game + '" value="' + val + '"' + dis + ' class="w-20 bg-white border-2 border-slate-800 rounded p-1 font-black text-slate-700 outline-none"></label>';
  }
  function hubSettingsHtml() {
    var H = ensureHub();
    if (Net.roomTab === 'tourn') return '';
    var game = Net.armed.game, c = H.cfg[game] || hubDefaults()[game] || hubDefaults().sudoku;
    var h = '<div class="bg-white border-[3px] border-slate-800 rounded-xl p-4 mb-4 flex flex-col gap-2.5 text-left shadow-[4px_4px_0px_#1e293b]' + (Net.isHost ? '' : ' hub-locked') + '">'; // 來賓端反灰：hub-locked 的 CSS 把整卡控制項壓灰，一眼看出只有房主能改
    h += '<h3 class="font-black border-b-2 border-slate-100 pb-2">⚙️ 對局設定' + (Net.isHost ? '' : '（房主設定）') + '</h3>';
    h += '<div class="flex gap-2 items-center"><span class="font-bold text-slate-500 w-10 text-sm shrink-0">模式</span>' + hubModeBtns(game, 'coop', c.mode) + hubModeBtns(game, game === 'sudoku' ? 'brawl' : 'race', c.mode) + '</div>';
    if (game === 'sudoku') {
      h += '<div class="flex gap-2 items-center"><span class="font-bold text-slate-500 w-10 text-sm shrink-0">題目</span>' + hubSel('sudoku', 'sizeId', c.sizeId, HUB_SIZES) + hubSel('sudoku', 'diffId', c.diffId, HUB_DIFFS) + '</div>';
      if (c.mode === 'brawl') {
        h += '<div class="flex gap-2 items-center"><span class="font-bold text-slate-500 w-10 text-sm shrink-0">結束</span>' + hubSel('sudoku', 'winnersCount', c.winnersCount, [1, 2, 3, 4, 5].map(function (n) { return { id: n, name: '前 ' + n + ' 名結束' }; })) + '</div>';
        h += hubChk('sudoku', 'allowWeapons', c.allowWeapons, '開啟陷害道具（水球/橡皮擦）');
        h += '<div class="flex gap-2 items-center"><span class="font-bold text-slate-500 text-sm shrink-0">陷害道具延遲</span>' + hubSel('sudoku', 'weaponStartTime', c.weaponStartTime, [0, 30, 60, 90, 120, 180].map(function (n) { return { id: n, name: n + ' 秒' }; })) + '</div>';
        h += hubChk('sudoku', 'allowQuickFill', c.allowQuickFill, '開啟快速填答');
        h += hubChk('sudoku', 'allowTraversal', c.allowTraversal, '開啟循環模式');
        h += hubChk('sudoku', 'allowGifts', c.allowGifts, '開啟獲得與贈送禮物功能');
        h += hubChk('sudoku', 'allowYellowHint', c.allowYellowHint, '開啟底塊提示');
        h += hubChk('sudoku', 'showNumbersInGodMode', c.showNumbersInGodMode, '上帝視角顯示數字');
        h += hubChk('sudoku', 'allowOthersToPlayAgain', c.allowOthersToPlayAgain, '允許其他玩家按再來一局');
      }
    } else if (game === 'mines') {
      h += '<div class="flex gap-2 items-center"><span class="font-bold text-slate-500 w-10 text-sm shrink-0">盤面</span>' + hubSel('mines', 'sizeId', c.sizeId, HUB_MINES_SIZES) + '</div>';
      if (String(c.sizeId) === 'custom') { // 自訂盤面欄位（比照數橋自訂尺寸：選到自訂才展開）
        h += hubNum('mines', 'customW', c.customW, '自訂寬度（左右格數）', 8, 30);
        h += hubNum('mines', 'customH', c.customH, '自訂高度（上下格數）', 8, 24);
        h += hubNum('mines', 'customMines', c.customMines, '自訂地雷數', 5, 999);
      }
      if (c.mode === 'race') {
        h += hubChk('mines', 'allowItems', c.allowItems, '開啟道具與禮物（❓問號干擾／⏪回填／🎁鎖定旗禮物）');
        h += '<div class="flex gap-2 items-center"><span class="font-bold text-slate-500 text-sm shrink-0">道具延遲</span>' + hubSel('mines', 'itemStartTime', c.itemStartTime, [0, 30, 60, 90, 120, 180].map(function (n) { return { id: n, name: n + ' 秒' }; })) + '</div>';
        h += '<div class="text-xs font-bold text-slate-400">競速規則：同一個盤面各玩各的，最快排完的人贏；踩到雷直接出局，照當時進度排名。</div>';
      }
      else h += '<div class="text-xs font-bold text-slate-400">合作規則：共用同一個盤面一起排雷，踩到雷全隊失敗。</div>';
    } else {
      h += '<div class="flex gap-2 items-center"><span class="font-bold text-slate-500 w-10 text-sm shrink-0">關卡</span>' + hubSel('hashi', 'sizeId', c.sizeId, HUB_LEVELS) + '</div>';
      if (String(c.sizeId) === 'custom') {
        h += hubNum('hashi', 'customW', c.customW, '自訂寬度（橫向島嶼數）', 5, 100);
        h += hubNum('hashi', 'customH', c.customH, '自訂長度（直向島嶼數）', 5, 100);
      }
      if (c.mode === 'race') {
        h += hubChk('hashi', 'itemsEnabled', c.itemsEnabled, '里程碑道具發放');
        h += hubChk('hashi', 'godNumbers', c.godNumbers, '上帝視角顯示數字');
      }
    }
    return h + '</div>';
  }
  function hubRenderSettings() {
    if (!window.PlatRoom || !PlatRoom.getSlot || !PlatRoom.getSlot()) return;
    var slot = PlatRoom.getSlot();
    if (!slot.closest || !slot.closest('#lob-step-room')) return; // 只在房間框架的卡片裡寫殼表單
    var h = hubSettingsHtml();
    var H = ensureHub();
    if (H._slotHtml === h && slot.innerHTML) return; // 沒變就不重繪：房主操作到一半（開著下拉選單）不能被每秒刷新打斷
    H._slotHtml = h;
    slot.innerHTML = h;
  }
  function syncTournForm() {
    var H = ensureHub(), dis = !Net.isHost;
    var tSetup = $('lob-tourn-setup'); if (tSetup && tSetup.classList) tSetup.classList.toggle('hub-locked', dis); // 來賓端錦標賽表單同樣反灰
    function set(id, v, isChk) { var el = $(id); if (!el) return; if (!isChk && document.activeElement === el && (el.tagName === 'INPUT')) return; if (isChk) el.checked = !!v; else el.value = String(v); el.disabled = dis; } // 正在編輯的文字欄不覆寫：hubRender 每秒/每次名單變動都會跑，打字途中被蓋回舊值很惱人
    set('ts-size', H.cfg.sudoku.sizeId); set('ts-diff', H.cfg.sudoku.diffId);
    set('ts-weapons', H.cfg.sudoku.allowWeapons, 1); set('ts-gifts', H.cfg.sudoku.allowGifts, 1);
    set('ts-yellow', H.cfg.sudoku.allowYellowHint, 1); set('ts-god', H.cfg.sudoku.showNumbersInGodMode, 1);
    set('ts-quick', H.cfg.sudoku.allowQuickFill, 1); set('ts-trav', H.cfg.sudoku.allowTraversal, 1); set('ts-wtime', H.cfg.sudoku.weaponStartTime);
    set('th-size', H.cfg.hashi.sizeId);
    set('th-items', H.cfg.hashi.itemsEnabled, 1); set('th-god', H.cfg.hashi.godNumbers, 1);
    set('tm-size', H.cfg.mines.sizeId);
  }
  function hubRender() {
    if (!window.PlatRoom) return;
    var H = ensureHub();
    var slot = PlatRoom.getSlot && PlatRoom.getSlot();
    var attachedHere = !!(PlatRoom.isAttached() && slot && slot.closest && slot.closest('#lob-step-room'));
    if (!attachedHere || H._accent !== hubAccent()) {
      H._accent = hubAccent();
      PlatRoom.attach($('hub-room'), { accent: hubAccent(), onAction: hubOnAction });
    }
    PlatRoom.update(hubSpec());
    hubRenderSettings();
    syncTournForm();
  }
  // ---------- 對局進行中・回座（不小心跳出又回來接續）：房主在 doLaunch 記 liveMatch 並廣播；不在對局中的選手在房間頁看到「回到對局」鈕，點了請房主對他重發 launch（resume） ----------
  function setLiveMatch(ml) {
    Net.liveMatch = ml;
    if (Net.isHost) platBroadcast({ kind: 'match-live', ml: ml });
    renderResumeBanner();
  }
  function renderResumeBanner() {
    var el = $('hub-resume'); if (!el) return;
    var ml = Net.liveMatch;
    if (!Net.active || Net.inMatch || !ml) { el.style.display = 'none'; el.innerHTML = ''; return; }
    var names = { sudoku: '數獨', hashi: '數橋', mines: '踩地雷' };
    var gn = names[ml.game] || ml.game;
    var mine = !!(ml.players && ml.players.indexOf(Net.myUid) >= 0);
    el.style.display = 'block';
    if (mine) {
      el.innerHTML = '<div class="lob-game-card" style="margin-bottom:10px"><div class="p-3 flex items-center gap-2"><span class="font-black text-slate-700 text-sm">🎮 ' + gn + (ml.tourn ? '錦標賽' : '對局') + '進行中——你還在這場比賽裡</span><button id="hub-resume-btn" class="ml-auto shrink-0 bg-emerald-500 text-white border-[3px] border-slate-800 rounded-xl px-3 py-2 font-black text-sm shadow-[3px_3px_0px_rgba(30,41,59,1)] active:translate-y-[2px] active:shadow-none">↩ 回到對局</button></div></div>';
      var b = $('hub-resume-btn');
      if (b) b.onclick = function () { b.disabled = true; b.textContent = '連接中…'; platToHost({ kind: 'relaunch-me' }); setTimeout(function () { renderResumeBanner(); }, 3000); };
    } else {
      el.innerHTML = '<div class="text-center text-xs font-bold text-slate-400" style="margin-bottom:8px">⏳ ' + gn + '對局進行中，等他們打完…</div>';
    }
  }
  // ---------- 房間頁改暱稱/代表色（v1.12.0）：房主可改任何人、玩家可改自己；房主端驗證後寫回名單並廣播，被改的人由 roster 同步回 Net.me ----------
  function notifyGameIdentity(self, name, color) { // 名單身份（顏色）變更 → 通知進行中的遊戲跟著改（遊戲以 hooks.identity 接收）
    if (!Net.inMatch || !color) return;
    try { var hk = window['__PLAT_HOOKS_' + Net.inMatch]; if (hk && hk.identity) hk.identity({ self: !!self, name: name, color: color }); } catch (e) {}
  }
  function hubSyncMeFromRoster() {
    var me = null;
    Net.roster.forEach(function (p) { if ((p.uid || p.pid) === Net.myUid) me = p; });
    if (me && (me.name !== Net.me.name || me.color !== Net.me.color)) {
      Net.me.name = me.name; Net.me.color = me.color;
      storeSet('plat_name', me.name); storeSet('plat_color', me.color);
      updateDock();
    }
  }
  function hubApplyIdentity(entry, name, color) {
    name = (name || '').replace(/[<>&"']/g, '').trim().slice(0, 12); // 與 join 同規格：去 HTML 字元（B-02 統一消毒）
    if (!name) return '⚠️ 暱稱不能空白';
    var dup = Net.roster.some(function (p) { return p !== entry && normName(p.name) === normName(name); });
    if (dup) return '⚠️ 這個暱稱已經有人用了';
    if (color !== 'rainbow' && PLAT_COLORS.indexOf(color) < 0) color = entry.color;
    var old = entry.name;
    entry.name = name; entry.color = color;
    notifyGameIdentity((entry.uid || entry.pid) === Net.myUid, old, color);
    if ((entry.uid || entry.pid) === Net.myUid) { Net.me.name = name; Net.me.color = color; storeSet('plat_name', name); storeSet('plat_color', color); updateDock(); }
    platBroadcast({ kind: 'roster', players: Net.roster, code: Net.code });
    if (old !== name) sysChat('🪪 ' + old + ' 改名為 ' + name);
    renderLobby();
    return null;
  }
  function hubIdSave(uid) {
    var H = ensureHub();
    var entry = null; Net.roster.forEach(function (p) { if ((p.uid || p.pid) === uid) entry = p; });
    if (!entry) return;
    var inp = $('hub-id-name'); var name = inp ? inp.value : (H._idName || entry.name);
    var color = H._idColor || entry.color;
    H._idEdit = null; H._idName = null; H._idKey = '';
    if (Net.isHost) { var err = hubApplyIdentity(entry, name, color); if (err) lobbyMsg(err); }
    else if (uid === Net.myUid) {
      name = (name || '').trim().slice(0, 12);
      if (!name) { lobbyMsg('⚠️ 暱稱不能空白'); hubRender(); return; }
      if (Net.roster.some(function (p) { return (p.uid || p.pid) !== uid && normName(p.name) === normName(name); })) { lobbyMsg('⚠️ 這個暱稱已經有人用了'); hubRender(); return; }
      platToHost({ kind: 'identity', name: name, color: color });
    }
    hubRender();
  }
  function hubWire() {
    var H = ensureHub(); if (H._wired) return; H._wired = true;
    var root = $('view-lobby'); if (!root) return;
    root.addEventListener('change', function (e) {
      var t = e.target; if (!t || !Net.isHost) return;
      var H2 = ensureHub();
      if (t.hasAttribute && t.hasAttribute('data-hub-key')) {
        var g = t.getAttribute('data-hub-game'), k = t.getAttribute('data-hub-key');
        H2.cfg[g][k] = t.type === 'checkbox' ? t.checked : (isNaN(Number(t.value)) || t.value === '' ? t.value : Number(t.value));
        hubSaveCfg(); hubCfgBroadcast(g); hubRender();
        return;
      }
      var tid = t.id || '';
      var TKEYS = { 'ts-size': ['sudoku', 'sizeId', 0], 'ts-diff': ['sudoku', 'diffId', 0], 'ts-weapons': ['sudoku', 'allowWeapons', 1], 'ts-gifts': ['sudoku', 'allowGifts', 1], 'ts-yellow': ['sudoku', 'allowYellowHint', 1], 'ts-god': ['sudoku', 'showNumbersInGodMode', 1], 'ts-quick': ['sudoku', 'allowQuickFill', 1], 'ts-trav': ['sudoku', 'allowTraversal', 1], 'ts-wtime': ['sudoku', 'weaponStartTime', 0], 'th-size': ['hashi', 'sizeId', 0], 'th-items': ['hashi', 'itemsEnabled', 1], 'th-god': ['hashi', 'godNumbers', 1], 'tm-size': ['mines', 'sizeId', 0] };
      if (TKEYS[tid]) {
        var tk = TKEYS[tid];
        H2.cfg[tk[0]][tk[1]] = tk[2] ? t.checked : (isNaN(Number(t.value)) ? t.value : Number(t.value));
        hubSaveCfg(); hubCfgBroadcast(tk[0]); hubRender();
      }
    });
    root.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-hub-mode]') : null;
      if (!b || !Net.isHost) return;
      var H2 = ensureHub(), g = b.getAttribute('data-hub-game');
      H2.cfg[g].mode = b.getAttribute('data-hub-mode');
      Net.armedByGame[g] = H2.cfg[g].mode;
      hubSaveCfg(); hubCfgBroadcast(g); hubRender();
    });
    root.addEventListener('click', function (e) {
      var t = e.target; if (!t || !t.closest) return;
      var H3 = ensureHub();
      var eb = t.closest('[data-id-edit]');
      if (eb) { var uid3 = eb.getAttribute('data-id-edit'); var en3 = null; Net.roster.forEach(function (p) { if ((p.uid || p.pid) === uid3) en3 = p; }); if (en3 && (Net.isHost || uid3 === Net.myUid)) { H3._idEdit = uid3; H3._idColor = en3.color; H3._idName = en3.name; H3._idKey = ''; hubRender(); } return; }
      var cb3 = t.closest('[data-id-color]');
      if (cb3) { var inp3 = $('hub-id-name'); if (inp3) H3._idName = inp3.value; H3._idColor = cb3.getAttribute('data-id-color'); H3._idKey = ''; hubRender(); return; }
      var wb3 = t.closest('[data-id-wheel]');
      if (wb3) { var inp4 = $('hub-id-name'); if (inp4) H3._idName = inp4.value; window.__PLAT_PICK_COLOR(H3._idColor || PLAT_COLORS[0], function (c) { if (c) { H3._idColor = c; H3._idKey = ''; hubRender(); } }, { noIdentity: true }); return; }
      var sb3 = t.closest('[data-id-save]');
      if (sb3) { hubIdSave(sb3.getAttribute('data-id-save')); return; }
      if (t.closest('[data-id-cancel]')) { H3._idEdit = null; H3._idName = null; H3._idKey = ''; hubRender(); }
    });
    var _hubFp = '';
    setInterval(function () { // 開始閘門的 60 秒倒數 + 名單保鮮；狀態指紋沒變就跳過全量重繪（稽核 E-03：原本每秒整頁重建＋逐欄寫回表單，指紋含名單/準備/設定/錦標賽進度/等待秒數桶，任一變動仍會在 1 秒內刷新）
      if (!hubVisible()) return;
      var H = ensureHub();
      var waited = H.enteredAt ? (Date.now() - H.enteredAt) : 0;
      var waitBucket = H.enteredAt ? Math.ceil(Math.max(0, (window.PLAT_START_WAIT_MS || 60000) - waited) / 1000) : -1;
      var fp = '';
      try { fp = JSON.stringify([Net.roster, H.ready, H.spec, H.cfg, H._idEdit, Net.roomTab, Net.armed && Net.armed.game, waitBucket, Net.tourn && [Net.tourn.phase, Net.tourn.round, Net.tourn.settled, Net.tourn.acks && Object.keys(Net.tourn.acks).length, Net.tourn.totals]]); } catch (e) { fp = ''; }
      if (fp && fp === _hubFp) return;
      _hubFp = fp;
      hubRender();
    }, 1000);
  }
  function hubOnAction(name) {
    var H = ensureHub();
    if (name === 'ready' || name === 'spectator') {
      var isR = name === 'ready';
      var map = isR ? H.ready : H.spec, key = isR ? 'ready' : 'spec';
      var v = !map[Net.myUid];
      if (Net.isHost) { map[Net.myUid] = v; hubStateBroadcast(); hubRender(); }
      else { var m = { kind: key, uid: Net.myUid }; m[key] = v; platToHost(m); map[Net.myUid] = v; hubRender(); }
    }
    else if (name === 'start') { if (Net.roomTab === 'tourn' && !Net.tourn) tournCreate(); else hubStart(); }
    else if (name === 'leave') leaveRoom();
    else if (name === 'refresh') hubRender();
  }
  function hubStart() {
    if (!Net.isHost || Net.tourn || Net.inMatch) return;
    var game = Net.armed.game;
    var payload = hubLaunchCfg(game);
    var mode = payload.mode;
    Net.armed.mode = mode; Net.armedByGame[game] = mode;
    Net.lastLaunch = { game: game, mode: mode, cfg: payload };
    platBroadcast({ kind: 'launch', game: game, mode: mode, cfg: payload });
    doLaunch(game, mode, null, payload);
  }
  function platPreload() { var g = Net.armed && Net.armed.game; if (g && window.__PLAT_BOOT) { try { window.__PLAT_BOOT(g); } catch (e) {} } } // 把開局的載入成本移出關鍵路徑：進房間/換遊戲時就背景載好
  function showHubRoom() {
    if (!Net.active) return;
    rejoinBusy(false);
    var H = ensureHub();
    if (!H.enteredAt) H.enteredAt = Date.now();
    hubWire();
    ['home', 'sudoku', 'hashi', 'mines', 'lobby'].forEach(function (v) {
      var vel = document.getElementById('view-' + v); if (vel) vel.classList.toggle('active', v === 'lobby'); // 防空同 PLAT_show（混版快取）
    });
    document.body.setAttribute('data-view', 'lobby');
    showStep('room');
    if (typeof updateDock === 'function') updateDock();
    hubRender();
    renderResumeBanner();
    renderTourn();
    window.scrollTo(0, 0);
  }
  window.__PLAT_SHOW_HUB = showHubRoom;
  var _showHubRoomOrig = showHubRoom; showHubRoom = function () { var r = _showHubRoomOrig.apply(null, arguments); platPreload(); return r; };
  window.__PLAT_SHOW_HUB = showHubRoom;

  // ---------- 連線管理 ----------
  function wireConn(c) {
    c.on('data', function (d) { routeData(c, d); });
    c.on('close', function () { onRealConnClose(c); });
    c.on('error', function () {});
  }
  function routeData(c, d) {
    if (d && typeof d === 'object' && d.__plat) { onPlatData(c, d); return; }
    if (d && typeof d === 'object' && d.__pg) {
      // 遊戲訊息帶寄件遊戲戳記：不是目前對局遊戲的（背景另一款的自修 JOIN/心跳等）直接丟棄，
      // 否則會污染前景遊戲的 JOIN 處理（幻影玩家、名單互搶、RESUME 濫發重啟倒數）。
      if (Net.inMatch && d.__pg !== Net.inMatch) return;
      d = d.__pd;
    }
    tournSniff(c.peer, d);
    var vp = Net.gamePeer;
    if (vp && !vp._destroyed) { try { vp.wrapperFor(c)._deliverData(d); } catch (e) {} }
    else { var nq = (Net._dq = Net._dq || {})[c.peer] || (Net._dq[c.peer] = []); nq.push(d); if (nq.length > 100) nq.shift(); }
  }
  function onRealConnClose(c) {
    var pid = c.peer;
    if (Net.conns[pid] && Net.conns[pid] !== c) return; // 舊連線的遲到 close（同對象已換綁/重連新連線）：忽略，避免誤觸接管或誤刪名單
    var vp = Net.gamePeer;
    if (vp && !vp._destroyed) { try { vp._notifyClose(c); } catch (e) {} }
    if (!Net.active || Net.ending) { delete Net.conns[pid]; return; }
    delete Net.conns[pid];
    closeCallOf(pid);
    if (!Net.isHost) {
      if (pid === Net.hostPid) { onHostConnLost(); }
    } else {
      var gone = null;
      Net.roster = Net.roster.filter(function (p) { if (p.pid === pid) { gone = p; return false; } return true; });
      if (gone) {
        sysChat('👋 ' + (gone.name || '玩家') + ' 離開了房間');
        if (Net.tourn && (Net.tourn.phase === 'playing' || Net.tourn.phase === 'playoff')) { var de = tournEntrantByPid(pid); if (de) { Net.tourn.disc[de.uid] = true; tournCheckDone(); } }
        platBroadcast({ kind: 'roster', players: Net.roster, code: Net.code });
        renderLobby();
      }
    }
  }
  // 在線心跳：來賓每 pingMs 向房主 ping（房主回 pong 兼證明房主存活）；房主以 lastSeen 判定離線/移除。
  // 傳輸層的 close 訊號在 App 被直接關掉時可能拖很久，心跳是即時性的後盾。參數在 Net.presence（測試可調）。
  setInterval(function () {
    if (!Net.active) return;
    var now = Date.now(), cfg = Net.presence;
    if (!Net.isHost) {
      if (now - (Net._lastPing || 0) >= cfg.pingMs) { Net._lastPing = now; platToHost({ kind: 'ping' }); }
      if (Net.hostSeen && now - Net.hostSeen > cfg.offlineMs && !Net._hostWarned) { Net._hostWarned = true; lobbyMsg('⚠️ 與房主連線中斷，嘗試重連中…'); }
      return;
    }
    var changed = false;
    Net.roster.slice().forEach(function (p) {
      if (p.host || p.pid === Net.myPid) return;
      var seen = Net.lastSeen[p.pid] || p._joinedAt || now;
      var silent = now - seen;
      if (silent > cfg.removeMs && !Net.inMatch) {
        Net.roster = Net.roster.filter(function (x) { return x.pid !== p.pid; });
        delete Net.lastSeen[p.pid];
        sysChat('📴 ' + (p.name || '玩家') + ' 已離線（無回應）');
        changed = true;
      } else if (silent > cfg.offlineMs && !p.offline) {
        p.offline = true; changed = true;
      }
    });
    if (changed) { platBroadcast({ kind: 'roster', players: Net.roster, code: Net.code }); renderLobby(); }
  }, 5000);
  function onPlatData(c, d) {
    var pid = c.peer;
    // 寄件者驗證（稽核 A-01/A-02）：房主權威訊息只認「房主連線」送來的；寄件者身分一律以連線 pid 查名單，不信任訊息自報的 pid/uid/name（identity 分支的既有範式，全面套用）
    var fromHost = !Net.isHost && pid === Net.hostPid;
    var senderEntry = null; Net.roster.forEach(function (p) { if (p.pid === pid) senderEntry = p; });
    switch (d.kind) {
      case 'join': {
        if (!Net.isHost) return;
        // 顏色不可重複（使用者定案：名稱與顏色都要不同）：來賓選的顏色已被占用 → 房主自動換第一個可用顏色（彩虹也算一色）；名稱重複在下方 reject 把關
        var joinColor = d.color, colorSubbed = false;
        if (joinColor) {
          var takenC = {}; Net.roster.forEach(function (p) { if ((p.uid || p.pid) !== d.uid && p.pid !== pid && p.color) takenC[p.color] = 1; });
          if (takenC[joinColor]) {
            for (var ci2 = 0; ci2 < PLAT_COLORS.length; ci2++) { if (!takenC[PLAT_COLORS[ci2]]) { joinColor = PLAT_COLORS[ci2]; colorSubbed = true; break; } }
          }
        }
        if (joinColor && joinColor !== 'rainbow' && PLAT_COLORS.indexOf(joinColor) < 0) { // 顏色白名單（B-03）：只接受摩天輪色票盤的顏色，自報的任意字串不進名單（名單顏色會被拼進 style 字串）
          for (var ci3 = 0; ci3 < PLAT_COLORS.length; ci3++) { if (!takenC[PLAT_COLORS[ci3]]) { joinColor = PLAT_COLORS[ci3]; colorSubbed = true; break; } }
          if (!colorSubbed) joinColor = PLAT_COLORS[0];
        }
        // 同 uid 回座（離房後一鍵重連/斷線重連）：舊條目還在名單裡（舊連線尚未逾時清除）時先換綁新 pid，不要誤判暱稱已被占用
        if (d.uid) {
          var reJ = null; Net.roster.forEach(function (p) { if ((p.uid || p.pid) === d.uid && p.pid !== pid) reJ = p; });
          if (reJ) {
            var oldPidJ = reJ.pid;
            reJ.pid = pid; reJ.name = d.name || reJ.name; reJ.color = joinColor || reJ.color; reJ.offline = false;
            delete Net.lastSeen[oldPidJ];
            var ocJ = Net.conns[oldPidJ]; if (ocJ) { delete Net.conns[oldPidJ]; try { ocJ.close(); } catch (e) {} }
          }
        }
        var safeName = String(d.name || '玩家').replace(/[<>&"']/g, '').slice(0, 12) || '玩家'; // 名稱來自網路輸入：一律去 HTML 字元＋截 12 字再進名單（名單多處以 innerHTML 渲染）
        var clash = Net.roster.some(function (p) { return p.pid !== pid && normName(p.name) === normName(safeName); });
        if (clash) { platSend(c, { kind: 'reject', reason: 'name_taken' }); return; }
        if (!Net.roster.some(function (p) { return p.pid === pid; })) {
          Net.roster.push({ pid: pid, uid: d.uid || pid, ver: d.ver || '', name: safeName, color: joinColor, host: false, _joinedAt: Date.now() });
        }
        if (colorSubbed) sysChat('🎨 ' + safeName + ' 選的顏色已被占用，自動換了一個顏色');
        Net.lastSeen[pid] = Date.now();
        tournRebind();
        platSend(c, { kind: 'roster', players: Net.roster, code: Net.code });
        platBroadcast({ kind: 'roster', players: Net.roster, code: Net.code }, pid);
        sysChat('👋 ' + safeName + ' 加入了房間');
        platSend(c, { kind: 'hubstate', ready: ensureHub().ready, spec: ensureHub().spec });
        platSend(c, { kind: 'hubcfg', game: 'sudoku', cfg: ensureHub().cfg.sudoku });
        platSend(c, { kind: 'hubcfg', game: 'hashi', cfg: ensureHub().cfg.hashi });
        platSend(c, { kind: 'hubcfg', game: 'mines', cfg: ensureHub().cfg.mines });
        // 進房同步房主目前選的遊戲/分頁：不送的話來賓只拿到三款設定、roomTab 停在預設數獨（房主在踩地雷、來賓看數獨）
        if (Net.roomTab === 'tourn' || Net.tourn) platSend(c, { kind: 'tab', tab: 'tourn' }); else platSend(c, { kind: 'arm', game: Net.armed.game });
        if (Net.tourn) { platSend(c, { kind: 'tourn-setup', cfg: tournPublicCfg() }); var tsm = tournStateMsg(); if (tsm) platSend(c, tsm); }
        if (Net.liveMatch) platSend(c, { kind: 'match-live', ml: Net.liveMatch });
        if (Net.inMatch) platSend(c, { kind: 'launch', game: Net.inMatch, mode: Net.matchMode || 'coop', cfg: (Net.lastLaunch && Net.lastLaunch.game === Net.inMatch) ? Net.lastLaunch.cfg : undefined, tourn: (Net.tourn && (Net.tourn.phase === 'playing' || Net.tourn.phase === 'playoff')) ? tournSess() : undefined, resume: !!(Net.liveMatch && d.uid && Net.liveMatch.players.indexOf(d.uid) >= 0) });
        renderLobby();
        if (Net.videoOn) callPeer(pid);
        if (Net.videoOn || Object.keys(Net.remoteStreams).length) platSend(c, { kind: 'mic', pid: Net.myPid, name: Net.me.name, muted: Net.micMuted });
        break;
      }
      case 'roster': {
        if (!fromHost) break;
        var prevRoster = Net.roster || [];
        Net.roster = d.players || [];
        // 採用端再消毒一次（B-02/B-03 縱深防禦：不完全信任送來的名單內容）
        Net.roster.forEach(function (p) { p.color = platSafeColor(p.color); if (p.name) p.name = String(p.name).replace(/[<>&"']/g, '').slice(0, 12); });
        // 時鐘偏移估計（D-05）：房主 roster 附帶其時間戳，平滑後供遊戲校正倒數/完賽時間；只在 roster 更新（低頻）取樣，避免抖動
        if (typeof d.now === 'number') { var off = d.now - Date.now(); if (isFinite(off) && Math.abs(off) < 3600000) Net.timeOffset = Net.timeOffset ? Math.round(Net.timeOffset * 0.6 + off * 0.4) : off; }
        if (d.code) Net.code = d.code;
        Net.hostSeen = Date.now(); Net._hostWarned = false; tournRebind(); hubSyncMeFromRoster(); renderLobby();
        Net.roster.forEach(function (p) { var o = null; prevRoster.forEach(function (q) { if ((q.uid || q.pid) === (p.uid || p.pid)) o = q; }); if (o && o.color !== p.color) notifyGameIdentity((p.uid || p.pid) === Net.myUid, p.name, p.color); });
      }
        if (!Net.isHost && !Net.inMatch && !Net.tourn) { var fbT = setTimeout(function () { if (Net.active && !Net.inMatch && !Net.tourn) maybeAutoEnterRoom(); }, 1500); }
        break;
      case 'ping': {
        if (!Net.isHost) return;
        Net.lastSeen[pid] = Date.now();
        platSend(c, { kind: 'pong' });
        var pp = Net.roster.find(function (x) { return x.pid === pid; });
        if (pp && pp.offline) { pp.offline = false; platBroadcast({ kind: 'roster', players: Net.roster, code: Net.code }); renderLobby(); }
        break;
      }
      case 'pong': if (!fromHost) break; Net.hostSeen = Date.now(); Net._hostWarned = false; break;
      case 'reject': if (!fromHost) break; lobbyMsg('⚠️ 暱稱已被使用，換一個名字再試'); teardownPeer(); showIdle(); break;
      case 'leave': {
        if (!Net.isHost) return;
        var gone2 = null;
        Net.roster = Net.roster.filter(function (p) { if (p.pid === pid) { gone2 = p; return false; } return true; }); // 以連線 pid 為準：送 leave 只能送走自己，不能指定別人（A-02）
        if (gone2) sysChat('👋 ' + (gone2.name || '玩家') + ' 離開了房間');
        platBroadcast({ kind: 'roster', players: Net.roster, code: Net.code });
        renderLobby();
        break;
      }
      case 'bye': if (!fromHost) break; endSession('房主已解散房間'); break;
      case 'chat': {
        if (!Net.isHost && !fromHost) break; // 聊天一律經房主轉播，來賓只收房主連線送來的
        var ctext = String(d.text == null ? '' : d.text).slice(0, 500); // 接收端長度上限（B-06：不只靠送出端 maxlength）
        if (!ctext) break;
        if (Net.isHost) {
          if (!senderEntry) break;
          var nowC = Date.now(); var winC = (Net._chatWin || (Net._chatWin = {}))[pid] || ((Net._chatWin || {})[pid] = []);
          while (winC.length && nowC - winC[0] > 3000) winC.shift();
          if (winC.length >= 6) break; // 每人 3 秒 6 則上限，超過丟棄（B-06 防刷屏）
          winC.push(nowC);
          appendChat({ name: senderEntry.name, color: senderEntry.color, text: ctext });
          platBroadcast({ kind: 'chat', pid: pid, name: senderEntry.name, color: senderEntry.color, text: ctext }, pid); // 身分由房主以名單蓋章，不用自報值
        } else {
          appendChat({ name: d.name, color: d.color, text: ctext });
        }
        break;
      }
      case 'mic': {
        if (!Net.isHost && !fromHost) break;
        if (Net.isHost && !senderEntry) break;
        var midP = Net.isHost ? pid : d.pid; // 房主端以連線 pid 為準；來賓端用房主蓋章的原寄件者 pid
        Net.remoteMic[midP] = d.muted;
        onRemoteMic({ pid: midP, name: Net.isHost ? senderEntry.name : d.name, muted: d.muted });
        if (Net.isHost) platBroadcast({ kind: 'mic', pid: midP, name: senderEntry.name, muted: d.muted }, pid);
        renderVideos();
        break;
      }
      case 'arm': if (fromHost && ['sudoku', 'hashi', 'mines'].indexOf(d.game) >= 0) { Net.armed.game = d.game; Net.roomTab = d.game; renderRoomTabs(); prRenderRegions(); if (hubVisible()) hubRender(); platPreload(); } break; // 未知 game 不寫入 armed，否則房主按開始時 hubLaunchCfg 會讀到 undefined 設定丟例外
      case 'tab': if (fromHost) { Net.roomTab = d.tab; renderTourn(); renderRoomTabs(); if (hubVisible()) hubRender(); } break;
      case 'ready': case 'spec': {
        if (!Net.isHost) return;
        var H9 = ensureHub(), map9 = d.kind === 'ready' ? H9.ready : H9.spec;
        map9[senderEntry ? (senderEntry.uid || senderEntry.pid) : pid] = d.kind === 'ready' ? !!d.ready : !!d.spec; // 以連線 pid 查到的身分為準，不用自報 uid（A-02）
        hubStateBroadcast(); renderLobby();
        break;
      }
      case 'hubstate': { if (!fromHost) break; var H10 = ensureHub(); H10.ready = d.ready || {}; H10.spec = d.spec || {}; renderLobby(); break; }
      case 'hubcfg': { if (!fromHost) break; var H11 = ensureHub(); if (d.game && d.cfg) H11.cfg[d.game] = d.cfg; if (hubVisible()) hubRender(); break; }
      case 'identity': { // 房間頁改暱稱/代表色：來賓只能改自己（以寄件者 pid 為準，不信任訊息裡的 uid），房主驗證後套用到名單並廣播
        if (!Net.isHost) break;
        var ie2 = null; Net.roster.forEach(function (p) { if (p.pid === pid) ie2 = p; });
        if (ie2) { var ierr2 = hubApplyIdentity(ie2, d.name, d.color); if (ierr2) { var ic2 = Net.conns[pid]; if (ic2) platSend(ic2, { kind: 'identity-denied', msg: ierr2 }); } }
        break;
      }
      case 'identity-denied': if (!fromHost) break; lobbyMsg(d.msg || '⚠️ 修改失敗'); break;
      case 'launch': {
        if (!fromHost) break; // 開局只能由房主發起（接管重播走 restored 分支，寄件者仍是新房主連線）
        if (['sudoku', 'hashi', 'mines'].indexOf(d.game) < 0) break; // 未知 game（跨版/損毀訊息）不可把畫面切成整面空白
        if (Net.restored) { Net.restored = false; Net.inMatch = d.game; Net.matchMode = d.mode || 'coop'; window.PLAT_show(d.game); renderLobby(); }
        else if (!Net.isHost) {
          var dupLaunch = Net.inMatch === d.game && !d.resume && (!d.tourn || (Net.tourn && Net.tourn.round === d.tourn.round));
          if (!dupLaunch) doLaunch(d.game, d.mode, d.tourn, d.cfg, d.resume);
        }
        break;
      }
      case 'match-live': { if (!fromHost) break; Net.liveMatch = d.ml || null; renderResumeBanner(); break; }
      case 'relaunch-me': { // 房間頁選手請求回座：房主驗證他是本場選手後，對他單獨重發 launch（resume）
        if (!Net.isHost || !Net.inMatch || !Net.liveMatch) break;
        var rme = null; Net.roster.forEach(function (p) { if (p.pid === pid) rme = p; });
        var rUid = rme ? (rme.uid || rme.pid) : null;
        if (!rUid || Net.liveMatch.players.indexOf(rUid) < 0) break;
        var rc9 = Net.conns[pid]; if (!rc9) break;
        platSend(rc9, { kind: 'launch', game: Net.inMatch, mode: Net.matchMode || 'coop', cfg: (Net.lastLaunch && Net.lastLaunch.game === Net.inMatch) ? Net.lastLaunch.cfg : undefined, tourn: (Net.tourn && (Net.tourn.phase === 'playing' || Net.tourn.phase === 'playoff')) ? tournSess() : undefined, resume: true });
        break;
      }
      case 'return': if (fromHost) doReturnToLobby(); break;
      case 'host-leaving': if (fromHost) onHostConnLost(); break; // 房主主動退房：其餘人接管選舉（第一位非房主升格、同房號）；只認房主連線送來的，防假冒觸發選舉
      case 'tourn-setup': if (!fromHost) break; if (d.cfg && d.cfg.entrants) { Net.tourn = tournNewState(d.cfg, 'playing'); sysChat('🏆 錦標賽開始！共 ' + (d.cfg.totalRounds || 5) + ' 局'); renderTourn(); } break; // cfg 缺失/缺 entrants 時 tournNewState 會丟例外讓 Net.tourn 半成品，先擋下
      case 'tourn-ack': {
        if (Net.isHost && Net.tourn) {
          var ta = Net.tourn, all2 = (ta.acks = ta.acks || {});
          var ackKey = senderEntry ? (senderEntry.uid || senderEntry.pid) : pid; // 以連線 pid 查到的身分為準（A-02）
          var rec = all2[ackKey] || (all2[ackKey] = {});
          rec[d.what] = d.round; if (d.game) rec.enteredGame = d.game;
          renderTourn();
        }
        break;
      }
      case 'tourn-score': { if (!fromHost) break; var tst = Net.tourn; if (tst) { tst.totals = d.totals || tst.totals; tst.wins = d.wins || tst.wins; tst.history = d.history || tst.history; tst.round = d.round || tst.round; tst.phase = d.phase || 'standings'; if (d.game) tst.curGame = d.game; if (d.progress) tst.progress = d.progress; if (d.finishOrder) tst.finishOrder = d.finishOrder; if (d.boom) tst.boom = d.boom; if (d.tiedPids) tst.tiedPids = d.tiedPids; tst.settled = (tst.phase !== 'playing' && tst.phase !== 'playoff'); if (!Net.isHost && !Net.inMatch && (tst.phase === 'standings' || tst.phase === 'playoff-pending')) platToHost({ kind: 'tourn-ack', what: 'lobby', round: tst.round, uid: Net.myUid }); } renderTourn(); break; }
      case 'tourn-end': { if (!fromHost) break; var ten = Net.tourn; if (ten) { ten.phase = 'ended'; ten.champion = d.champion; ten.endNote = d.note || ''; ten.totals = d.totals || ten.totals; ten.wins = d.wins || ten.wins; ten.history = d.history || ten.history; } if (Net.inMatch) doReturnToLobby(); if (d.champion) sysChat('🏆 總冠軍：' + d.champion.name + '！'); renderTourn(); break; }
      case 'tourn-abort': if (!fromHost) break; tournClear(); renderLobby(); break;
    }
  }
  // ---------- 房主斷線接管（未收到 bye 的意外斷線才走這裡；主動解散已在 endSession 處理） ----------
  function onHostConnLost() {
    if (Net.isHost || !Net.active || Net.migrating) return;
    Net.migrating = true;
    sysChat('📡 房主連線中斷，正在自動接管重連…');
    lobbyMsg('📡 房主連線中斷，正在自動接管重連…');
    var cand = null;
    for (var i = 0; i < Net.roster.length; i++) { if (!Net.roster[i].host) { cand = Net.roster[i]; break; } }
    if (cand && cand.pid === Net.myPid) promoteToHost();
    else waitForNewHost();
  }
  function promoteToHost() {
    var code = Net.code;
    Net.roster = Net.roster.filter(function (pp) { return !pp.host; });
    Net.roster.forEach(function (pp) { if (pp.pid === Net.myPid) pp.host = true; });
    var tries = 0;
    (function attempt() {
      if (!Net.migrating) return;
      var peer = new RealPeer('yyh-tgsh-' + code + '-host');
      Net.peer = peer;
      peer.on('open', function (id) {
        Net.hostPid = id; Net.isHost = true; Net.migrating = false; Net.timeOffset = 0; // 升格房主後自己就是時間基準
        sysChat('👑 你已接管成為新房主，朋友們正在重連…');
        renderLobby(); updateDock();
        platBroadcast({ kind: 'roster', players: Net.roster, code: Net.code });
        migrateGame(true);
        if (Net.tourn) setTimeout(tournAdopt, 1200);
      });
      peer.on('connection', function (c) {
        Net.conns[c.peer] = c; wireConn(c);
        if (Net.gamePeer && !Net.gamePeer._destroyed) Net.gamePeer._deliver(c);
      });
      peer.on('call', function (call) { handleCall(call); });
      peer.on('error', function (err) {
        if (err && err.type === 'unavailable-id' && tries < 10 && Net.migrating) {
          tries++; try { peer.destroy(); } catch (e) {}
          setTimeout(attempt, 2000); return;
        }
        if (Net.migrating) { Net.migrating = false; endSession('⚠️ 接管失敗，連線結束'); }
      });
    })();
  }
  function waitForNewHost() {
    var tries = 0;
    (function attempt() {
      if (!Net.migrating) return;
      tries++;
      if (tries > 16) { Net.migrating = false; endSession('⚠️ 房主離線且接管逾時，連線結束'); return; }
      var c = Net.peer.connect(Net.hostPid);
      var done = false;
      c.on('open', function () {
        if (done) return; done = true;
        Net.conns[Net.hostPid] = c; wireConn(c);
        Net.migrating = false;
        Net.restored = !!Net.inMatch; // 接管重連：對局中才需要擋 launch 重播（遊戲已由 migrateGame 重設）；不在對局中（房間頁斷線）不可設，否則旗標殘留會吞掉下一局的 launch（v1.14.2 稽核修）
        platSend(c, { kind: 'join', name: Net.me.name, color: Net.me.color, uid: Net.myUid, ver: PLAT_VERSION });
        sysChat('📡 已重連到新房主');
        renderLobby(); updateDock();
        migrateGame(false);
      });
      setTimeout(function () { if (!done && Net.migrating) { try { c.close(); } catch (e) {} attempt(); } }, 3000);
    })();
  }
  function migrateGame(amHost) {
    var g = Net.inMatch; if (!g) return;
    var hk = window['__PLAT_HOOKS_' + g]; if (!hk) return;
    var sess = { code: Net.code, name: Net.me.name, color: Net.me.color, isHost: amHost, mode: Net.matchMode || 'coop' };
    window.__PLAT_CREATING_GAME = g;
    if (hk.migrate) { try { hk.migrate(amHost, sess); } catch (e) { console.error('[plat] migrate ' + g + ' failed', e); platToast('⚠️ 遊戲接管重設失敗，可能需要回房間頁重開'); } }
    else if (hk.enter) { try { hk.enter(sess); } catch (e) { console.error('[plat] migrate-enter ' + g + ' failed', e); platToast('⚠️ 遊戲接管重設失敗，可能需要回房間頁重開'); } }
    window.__PLAT_CREATING_GAME = null;
  }
  function teardownPeer() {
    Net.ending = true;
    try { if (Net.peer) Net.peer.destroy(); } catch (e) {}
    Net.peer = null; Net.conns = {}; Net.active = false; Net.ending = false;
  }
  function endSession(msg) {
    Net.migrating = false;
    Net.restored = false; // 場次結束一律清接管旗標，不讓它殘留吞下一局 launch
    rejoinBusy(false);
    if (Net.hub) { Net.hub.enteredAt = 0; Net.hub.ready = {}; Net.hub.spec = {}; }
    Net.lastLaunch = null;
    if (!Net.active && !Net.peer) { showIdle(); return; }
    var g = Net.inMatch; Net.inMatch = null; Net.matchMode = null;
    stopVideo();
    teardownPeer();
    Net.roster = []; Net.gamePeer = null; Net.isHost = false;
    tournClear();
    updateDock(); closeChat(); showIdle(); renderLobby();
    if (g) { var hk = window['__PLAT_HOOKS_' + g]; if (hk && hk.exit) { try { hk.exit(); } catch (e) {} } }
    window.PLAT_show('lobby');
    if (msg) lobbyMsg(msg);
  }
  function createRoom() {
    if (Net.peer && !Net.peer.destroyed) return; // 已有 peer 時重入建房只會產生雙 peer 狀態混亂
    var name = readIdentity();
    if (!name) { lobbyMsg('⚠️ 請先輸入暱稱'); return; }
    var code = storeGet('plat_code');
    if (!code) { code = String(Math.floor(1000 + Math.random() * 9000)); storeSet('plat_code', code); }
    Net.code = code; Net.joinRetry = false;
    storeSet('plat_room', code); storeSet('plat_room_role', 'host');
    lobbyMsg('正在建立房間…');
    makeHostPeer(code);
  }
  function makeHostPeer(code) {
    var p = new RealPeer('yyh-tgsh-' + code + '-host');
    Net.peer = p;
    p.on('open', function (id) {
      Net.myPid = id; Net.hostPid = id; Net.isHost = true; Net.active = true; Net.timeOffset = 0;
      Net.roster = [{ pid: id, uid: Net.myUid, ver: PLAT_VERSION, name: Net.me.name, color: Net.me.color, host: true }];
      lobbyMsg(''); renderLobby(); updateDock();
      sysChat('🏠 房間已建立，房號 ' + code + '（把房號告訴朋友）');
      maybeAutoEnterRoom();
    });
    p.on('connection', function (c) {
      Net.conns[c.peer] = c; wireConn(c);
      if (Net.gamePeer && !Net.gamePeer._destroyed) Net.gamePeer._deliver(c);
    });
    p.on('call', function (call) { handleCall(call); });
    p.on('error', function (err) {
      if (err && err.type === 'unavailable-id' && !Net.joinRetry) {
        Net.joinRetry = true;
        var nc = String(Math.floor(1000 + Math.random() * 9000));
        storeSet('plat_code', nc); Net.code = nc;
        try { p.destroy(); } catch (e) {}
        makeHostPeer(nc);
        return;
      }
      lobbyMsg('⚠️ 建立房間失敗：' + (err && err.type ? err.type : '未知錯誤'));
      teardownPeer(); showIdle();
    });
  }
  function joinRoom() {
    if (Net.peer && !Net.peer.destroyed) return; // 同 createRoom：防重入雙 peer
    var name = readIdentity();
    if (!name) { lobbyMsg('⚠️ 請先輸入暱稱'); return; }
    var code = ($('lob-code').value || '').trim();
    if (code.length !== 4) { lobbyMsg('⚠️ 請輸入 4 位數房號'); return; }
    Net.code = code; Net.hostPid = 'yyh-tgsh-' + code + '-host'; Net.timeOffset = 0; // 換房重新估計時鐘偏移
    storeSet('plat_room', code); storeSet('plat_room_role', 'guest');
    lobbyMsg('正在連線到房間 ' + code + '…');
    var p = new RealPeer();
    Net.peer = p;
    p.on('open', function (id) {
      Net.myPid = id;
      var c = p.connect(Net.hostPid);
      Net.conns[Net.hostPid] = c; wireConn(c);
      c.on('open', function () {
        Net.active = true; Net.isHost = false;
        platSend(c, { kind: 'join', name: Net.me.name, color: Net.me.color, uid: Net.myUid, ver: PLAT_VERSION });
        lobbyMsg('已連上房間，等待房主確認…');
        updateDock();
      });
    });
    p.on('call', function (call) { handleCall(call); });
    p.on('error', function (err) {
      if (err && err.type === 'peer-unavailable') { lobbyMsg('⚠️ 找不到這個房號，房主可能還沒建立房間'); storeSet('plat_room', ''); teardownPeer(); showIdle(); return; }
      if (!Net.active) { lobbyMsg('⚠️ 連線失敗：' + (err && err.type ? err.type : '')); teardownPeer(); showIdle(); }
    });
  }
  function leaveRoom() {
    if (!Net.active) { showIdle(); return; }
    if (Net.isHost) platBroadcast({ kind: 'bye' });
    else platToHost({ kind: 'leave', pid: Net.myPid });
    storeSet('plat_room', '');
    endSession('');
    lobbyMsg('已離開房間');
  }

  // ---------- 進/出對局 ----------
  function waitForHook(game, cb, retried) {
    var tries = 0;
    (function poll() {
      var hk = window['__PLAT_HOOKS_' + game];
      if (hk && hk.enter) { cb(hk); return; }
      tries++;
      if (tries === 25) platToast('⏳ 遊戲還在載入，正在等它就緒…');
      if (tries < 120) { setTimeout(poll, 400); return; }
      // 等滿 48 秒還沒就緒：不要默默死掉——強制重啟這款遊戲再等一輪（真機上 fetch/eval/掛載任何一步卡住都靠這裡自癒）
      if (!retried) {
        platToast('⏳ 遊戲載入卡住，正在自動重新載入…');
        if (window.__PLAT_REBOOT) { try { window.__PLAT_REBOOT(game); } catch (e) {} }
        waitForHook(game, cb, true);
      } else {
        platToast('⚠️ 遊戲載入逾時，請回房間頁後再試一次');
      }
    })();
  }
  function tournSelfAck(what, round, game) {
    var t = Net.tourn; if (!t) return;
    var all = (t.acks = t.acks || {});
    var a = all[Net.myUid] || (all[Net.myUid] = {});
    a[what] = round; if (game) a.enteredGame = game;
  }
  // v1.11.0：建/入房完成先進殼的房間框架頁（不載入遊戲）；房主在房間頁按開始才 doLaunch。
  function maybeAutoEnterRoom() {
    if (!Net.active || Net.inMatch || Net.tourn) return;
    showHubRoom();
  }
  function doLaunch(game, mode, tournSess, hubCfg, resumeFlag) {
    if (window.PlatCountdown) window.PlatCountdown.hide(); if (window.PlatResults) window.PlatResults.hide(); if (!(typeof POD !== 'undefined' && POD.shownAt && Date.now() - POD.shownAt < 6000)) podHide(); // 剛播的頒獎台不擋：來賓先收 tourn-score 播台、隨後才被 return 帶回，立刻 podHide 會讓玩家永遠看不到小局結算
    Net.inMatch = game; Net.matchMode = mode || 'coop';
    if (Net.isHost && !resumeFlag) setLiveMatch({ game: game, mode: mode || 'coop', players: Net.roster.map(function (p) { return p.uid || p.pid; }), tourn: !!tournSess }); // 房主權威快照：本場選手名單（回座鈕的判定依據）；resume 重入不重快照
    if (tournSess) { Net.armed.game = game; Net.roomTab = game; } else { Net.armed = { game: game, mode: mode || 'coop' }; Net.roomTab = game; } // 賽程局開局也要切到該局遊戲的分頁：全員落進該局等待室（名單/準備/開始），不要停在錦標賽面板（局間回來由 doReturnToLobby 再切回 tourn）
    Net.armedByGame[game] = mode || 'coop';
    try { localStorage.setItem('plat_armed_game', game); } catch (e) {}
    if (tournSess && Net.tourn) { Net.tourn.phase = tournSess.playoff ? 'playoff' : 'playing'; Net.tourn.round = tournSess.round; Net.tourn.curGame = game; Net.tourn.settled = false; }
    // 切換遊戲時先釋放 PlatRoom 的外來綁定：舊遊戲的等待室節點只是被隱藏、仍連在文件上，
    // 遊戲端自我修復 effect 不會主動讓出（isAttached && 已連接就跳過），不先 detach 新遊戲永遠掛不上等待室
    if (window.PlatBar && window.PlatBar.isAttached() && !window.PlatBar._elConnected()) window.PlatBar.detach(window.PlatBar._el()); // 同上：PlatBar 若抱著已卸載的死節點先放掉，新局遊戲端才掛得上（v1.55.1）
    if (window.PlatRoom && window.PlatRoom.isAttached()) {
      var prSlotEl = window.PlatRoom.getSlot();
      var prOwnerView = prSlotEl && prSlotEl.closest ? prSlotEl.closest('[id^="view-"]') : null;
      if (!prOwnerView || prOwnerView.id !== 'view-' + game) window.PlatRoom.detach();
    }
    renderLobby();
    window.PLAT_show(game);
    waitForHook(game, function (hk) {
      if (Net.inMatch !== game) return;
      window.__PLAT_CREATING_GAME = game; // enter 內建立的 VirtualPeer 蓋上本遊戲戳記（背景遊戲訊息靠它在 routeData 被丟棄）
      try { hk.enter({ code: Net.code, isHost: Net.isHost, name: Net.me.name, color: Net.me.color, mode: mode || 'coop', tourn: tournSess || null, settings: hubCfg || (tournSess && tournSess.settings) || null, hub: true, resume: !!resumeFlag }); } catch (e) { console.error('[plat] enter ' + game + ' failed', e); platToast('⚠️ 遊戲啟動失敗，請回房間頁再試一次'); }
      window.__PLAT_CREATING_GAME = null;
      if (tournSess) { if (Net.isHost) tournSelfAck('entered', tournSess.round, game); else platToHost({ kind: 'tourn-ack', what: 'entered', round: tournSess.round, game: game, uid: Net.myUid }); }
    });
  }
  function exitGameHook(g) { var hk = window['__PLAT_HOOKS_' + g]; if (hk && hk.exit) { try { hk.exit(); } catch (e) {} } }
  function doReturnToLobby() {
    var g = Net.inMatch; Net.inMatch = null; Net.matchMode = null; Net.restored = false; // 回房間頁＝本局結束：接管旗標一律清，launch 重播沒來也不許殘留到下一局
    if (Net.isHost && Net.liveMatch) setLiveMatch(null); // 房主回房間頁＝本場散場（他是錨點）；來賓自己回頁不清——那是房間裡還在進行的比賽
    if (g) exitGameHook(g);
    // 注意：這裡不 podHide——頒獎台是回大廳的儀式，來賓先收到 tourn-score 播台、隨後才被 return 帶回大廳，藏掉就永遠看不到
    if (window.PlatCountdown) window.PlatCountdown.hide(); if (window.PlatResults) window.PlatResults.hide();
    if (Net.tourn) { if (Net.isHost) tournSelfAck('lobby', Net.tourn.round); else platToHost({ kind: 'tourn-ack', what: 'lobby', round: Net.tourn.round, uid: Net.myUid }); }
    // v1.11.0：還在房間裡就回殼的房間框架頁（賽程中停在錦標賽分頁），不載入遊戲、不經過選單頁
    if (Net.active) {
      Net.roomTab = Net.tourn ? 'tourn' : Net.armed.game;
      showHubRoom();
    } else { renderLobby(); window.PLAT_show('lobby'); }
  }
  window.__PLAT_NOTIFY = function (type) {
    if (type === 'game-exit') {
      if (!Net.inMatch) return;
      if (Net.isHost) { platBroadcast({ kind: 'return' }); doReturnToLobby(); }
      else doReturnToLobby(); // v1.12.0：來賓按回等待室＝只有自己回房間頁（其他人繼續對局），不再只清 inMatch 把人卡在遊戲首頁
    } else if (type === 'player-leave') {
      // v1.12.0：連線模式個人退出——只有自己離房回大廳，其他人繼續；房主退出先廣播 host-leaving，其餘人走接管選舉升格新房主
      if (!Net.active || Net.leaving) return;
      Net.leaving = true;
      if (Net.isHost) platBroadcast({ kind: 'host-leaving' });
      setTimeout(function () { Net.leaving = false; endSession('你已離開房間'); }, 350); // 留一點時間讓遊戲層的 LEAVE 訊號先送出
    } else if (type === 'host-gone') {
      onHostConnLost(); // 接管流程（殼層選舉升格），不再直接結束連線
    }
  };


  // ---------- 混合大亂鬥賽程 PlatTourn（房主權威；嗅探遊戲訊息計分；設計見 phase-d-design.md） ----------
  var TOURN_PTS = [10, 7, 5, 3, 2];
  function tournPts(rank) { return rank <= 5 ? TOURN_PTS[rank - 1] : 1; }
  function tournGameName(g) { return g === 'sudoku' ? '🔢 數獨' : (g === 'mines' ? '💣 踩地雷' : '🌉 數橋'); }
  function tournGameLabel(g) { return tournGameName(g) + (g === 'mines' ? '競速' : '大亂鬥'); } // 地雷錦標賽是純競速（無道具），不叫大亂鬥
  function tournUidByName(name) {
    var t = Net.tourn; if (!t || !name) return null;
    var n = normName(name);
    for (var i = 0; i < t.entrants.length; i++) if (normName(t.entrants[i].name) === n) return t.entrants[i].uid;
    return null;
  }
  function tournEntrant(key) { var t = Net.tourn; if (!t) return null; for (var i = 0; i < t.entrants.length; i++) if (t.entrants[i].uid === key) return t.entrants[i]; return null; }
  function tournEntrantByPid(pid) { var t = Net.tourn; if (!t) return null; for (var i = 0; i < t.entrants.length; i++) if (t.entrants[i].pid === pid) return t.entrants[i]; return null; }
  function tournRebind() { // 參賽者 pid 隨重連/接管變動：以 uid 把 entrant 的傳輸 pid 對回當下名單
    var t = Net.tourn; if (!t) return;
    t.entrants.forEach(function (e) {
      if (!e.uid) return;
      for (var i = 0; i < Net.roster.length; i++) { var rp = Net.roster[i]; if (rp.uid === e.uid) { e.pid = rp.pid; e.name = rp.name || e.name; e.color = rp.color || e.color; break; } }
    });
  }
  function tournSess() {
    var t = Net.tourn; if (!t) return null;
    var settings = null;
    if (t.curGame === 'sudoku') settings = { mode: 'brawl', sizeId: t.sudoku.sizeId, diffId: t.sudoku.diffId,
      brawl: { winnersCount: t.entrants.length, allowWeapons: t.sudoku.allowWeapons !== false, allowGifts: t.sudoku.allowGifts !== false, allowYellowHint: !!t.sudoku.allowYellowHint, showNumbersInGodMode: !!t.sudoku.showNumbersInGodMode, allowOthersToPlayAgain: true, allowQuickFill: !!t.sudoku.allowQuickFill, allowTraversal: !!t.sudoku.allowTraversal, hideAnswers: true, weaponStartTime: (t.sudoku.weaponStartTime == null ? 60 : t.sudoku.weaponStartTime) } };
    else if (t.curGame === 'hashi') settings = { mode: 'brawl', sizeId: t.hashi.sizeId,
      brawl: { itemsEnabled: t.hashi.itemsEnabled !== false, godNumbers: t.hashi.godNumbers !== false } };
    else if (t.curGame === 'mines') settings = { mode: 'brawl', sizeId: t.mines.sizeId, custom: t.mines.custom || undefined, allowItems: true, itemStartTime: 60, brawl: {} };
    return { round: t.round, total: t.totalRounds, playoff: t.phase === 'playoff', entrants: t.entrants.length,
      roster: t.entrants.map(function (e) { return { uid: e.uid, name: e.name, color: e.color }; }),
      sizeId: t.curGame === 'sudoku' ? t.sudoku.sizeId : (t.curGame === 'mines' ? t.mines.sizeId : t.hashi.sizeId), diffId: t.sudoku.diffId, roundSecs: t.roundSecs, settings: settings };
  }
  function tournBuildRounds(order, n) {
    n = n || 5;
    var rounds = [], i;
    var games = ['sudoku', 'hashi', 'mines']; // 三款循環（數獨→數橋→地雷），以選定的起頭款為首
    if (order === 'random') { for (i = 0; i < n; i++) rounds.push(games[Math.floor(Math.random() * 3)]); return rounds; }
    var first = order === 'alt-h' ? 'hashi' : (order === 'alt-m' ? 'mines' : 'sudoku');
    var start = games.indexOf(first);
    for (i = 0; i < n; i++) rounds.push(games[(start + i) % 3]);
    return rounds;
  }
  // （v1.11.0 起錦標賽設定改讀房間框架的表單 hub cfg，不再讀各遊戲的等待室——遊戲在開賽前根本不載入）
  function tournPublicCfg() {
    var t = Net.tourn;
    return { rounds: t.rounds, order: t.order, sudoku: t.sudoku, hashi: t.hashi, mines: t.mines, roundSecs: t.roundSecs, totalRounds: t.totalRounds, entrants: t.entrants };
  }
  function tournNewState(cfg, phase) {
    Net._podiumKey = '';
    var totals = {}, wins = {};
    cfg.entrants.forEach(function (e) { totals[e.uid] = 0; wins[e.uid] = 0; });
    return { phase: phase, round: 1, totalRounds: cfg.totalRounds, order: cfg.order, rounds: cfg.rounds,
      sudoku: cfg.sudoku, hashi: cfg.hashi, mines: cfg.mines, roundSecs: cfg.roundSecs, entrants: cfg.entrants,
      totals: totals, wins: wins, history: [], curGame: null, settled: false, startedAt: 0, endsAt: 0,
      progress: {}, finishOrder: [], boom: {}, uidMap: {}, cellTrack: {}, totalBlanks: 0, disc: {}, acks: {}, timer: null, armTimer: null, tiedPids: null, champion: null, endNote: '' };
  }
  function tournCreate() {
    if (!Net.isHost || Net.tourn) return;
    var sC = ensureHub().cfg.sudoku, hC = ensureHub().cfg.hashi, mC = ensureHub().cfg.mines;
    var cfg = { order: ($('t-order') || {}).value || 'alt-s',
      sudoku: { sizeId: Number(sC.sizeId) || 9, diffId: sC.diffId || 'medium', allowWeapons: sC.allowWeapons !== false, allowGifts: sC.allowGifts !== false, allowYellowHint: !!sC.allowYellowHint, showNumbersInGodMode: !!sC.showNumbersInGodMode, allowQuickFill: !!sC.allowQuickFill, allowTraversal: !!sC.allowTraversal, weaponStartTime: (function () { var w = Number(sC.weaponStartTime); return isNaN(w) ? 60 : Math.max(0, Math.min(600, w)); })() },
      hashi: { sizeId: Number(hC.sizeId) || 2, itemsEnabled: hC.itemsEnabled !== false, godNumbers: hC.godNumbers !== false },
      mines: { sizeId: String(mC.sizeId) === 'custom' ? 'custom' : (Number(mC.sizeId) || 9), custom: String(mC.sizeId) === 'custom' ? hubMinesCustom(mC) : null }, // 錦標賽地雷回合沿用對局設定的盤面（含自訂）
      roundSecs: Number(($('t-secs') || {}).value) || 300, totalRounds: Number(($('t-rounds') || {}).value) || 5, rounds: null,
      entrants: Net.roster.map(function (p) { return { pid: p.pid, uid: p.uid || p.pid, name: p.name, color: p.color }; }) };
    cfg.rounds = tournBuildRounds(cfg.order, cfg.totalRounds);
    var badVer = Net.roster.filter(function (p) { return p.ver && p.ver !== PLAT_VERSION; });
    if (badVer.length) sysChat('⚠️ ' + badVer.map(function (p) { return (p.name || '玩家') + '（' + p.ver + '）'; }).join('、') + ' 的版本和房主（' + PLAT_VERSION + '）不同，可能連線異常');
    Net.tourn = tournNewState(cfg, 'playing');
    platBroadcast({ kind: 'tourn-setup', cfg: tournPublicCfg() });
    sysChat('🏆 錦標賽開始！共 ' + cfg.totalRounds + ' 局');
    tournStartRound();
  }
  function tournStartRound() {
    var t = Net.tourn; if (!t) return;
    t.curGame = t.phase === 'playoff' ? 'hashi' : t.rounds[t.round - 1];
    t.settled = false; t.startedAt = 0; t.endsAt = 0;
    t.progress = {}; t.finishOrder = []; t.boom = {}; t.uidMap = {}; t.cellTrack = {}; t.totalBlanks = 0; t.disc = {};
    if (t.timer) { clearTimeout(t.timer); t.timer = null; }
    if (t.armTimer) { clearTimeout(t.armTimer); t.armTimer = null; }
    var sess = tournSess();
    platBroadcast({ kind: 'launch', game: t.curGame, mode: 'brawl', tourn: sess });
    doLaunch(t.curGame, 'brawl', sess);
    sysChat('🏆 第 ' + t.round + ' 局：' + tournGameLabel(t.curGame));
    if (t.roundSecs > 0) {
      t.armTimer = setTimeout(function () {
        if (Net.tourn === t && !t.startedAt && !t.settled) { t.startedAt = Date.now(); t.endsAt = Date.now() + t.roundSecs * 1000; tournArmTimer(); }
      }, 120000);
    }
    renderTourn();
  }
  function tournArmTimer() {
    var t = Net.tourn; if (!t) return;
    if (t.timer) clearTimeout(t.timer);
    t.timer = setTimeout(function () { if (Net.tourn === t && !t.settled) tournSettle(); }, Math.max(0, t.endsAt - Date.now()) + 250);
  }
  function tournMarkFinished(key) {
    var t = Net.tourn; if (!t || !key || t.settled) return;
    if (t.finishOrder.indexOf(key) < 0) { t.finishOrder.push(key); t.progress[key] = 100; }
    tournSnapshot(true);
    tournCheckDone();
  }
  function tournCheckDone() {
    var t = Net.tourn; if (!t || t.settled) return;
    var anyFinished = t.finishOrder.length > 0;
    var done = t.entrants.every(function (e) {
      if (t.finishOrder.indexOf(e.uid) >= 0) return true;
      if (t.boom && t.boom[e.uid]) return true; // 踩地雷出局＝本局了結（照當時進度排名；不走 finishOrder 以免進度被灌成 100）
      // 未到者不擋結算（使用者 2026-10-24 規則）：本局從未進場（entered ack 非本局）且無任何進度流量，
      // 而其他人已完賽時視同了結——結算時他以進度 0 排最後；中途加入的權利只到結算發生前為止
      if (anyFinished) {
        var ack = (t.acks || {})[e.uid] || {};
        if (ack.entered !== t.round && !(t.progress[e.uid] > 0)) return true;
      }
      if (!t.disc[e.uid]) return false;
      // 斷線旗標只在本人真的不在房間時才算數：重連回來的選手還在玩，要等他完賽，不能提前結算
      var present = Net.roster.some(function (p) { return (p.uid || p.pid) === e.uid || p.pid === e.pid; });
      return !present;
    });
    if (done) tournSettle();
  }
  function tournDecideChampion() {
    var t = Net.tourn;
    var sorted = t.entrants.slice().sort(function (a, b) { return (t.totals[b.uid] || 0) - (t.totals[a.uid] || 0); });
    var top = t.totals[sorted[0].uid] || 0;
    var tied = sorted.filter(function (e) { return (t.totals[e.uid] || 0) === top; }).map(function (e) { return e.uid; });
    if (tied.length === 1) return { champion: tied[0], note: '' };
    var bestWins = -1; tied.forEach(function (k) { bestWins = Math.max(bestWins, t.wins[k] || 0); });
    var winTied = tied.filter(function (k) { return (t.wins[k] || 0) === bestWins; });
    if (winTied.length === 1) return { champion: winTied[0], note: '同分比冠軍局數（' + bestWins + ' 次第 1 名）決勝' };
    return { champion: null, tied: winTied };
  }
  // ===== v1.8.1 等待室分頁：分頁列長在等待室（PlatRoom）頂部，房內切換，不經過多人連線選單頁 =====
  var roomTabsSig = '';
  var _tournNodeCache = {};
  function tournNode(id) {
    var n = _tournNodeCache[id];
    if (n && n.id === id) return n;
    n = document.getElementById(id);
    if (n) _tournNodeCache[id] = n;
    return n || null;
  }
  function rescueTournNodes() {
    var home = document.getElementById('lob-panel-tourn'); if (!home) return;
    ['lob-tourn-setup', 'lob-tourn-note', 'lob-tourn'].forEach(function (id) {
      var n = tournNode(id);
      if (n && n.parentNode !== home) home.appendChild(n);
    });
  }
  function renderRoomTabs() {
    if (typeof prRegion !== 'function' || typeof PR === 'undefined' || !PR.el) return;
    var tabsRg = prRegion('tabs'), tournRg = prRegion('tourn');
    if (!tabsRg && !tournRg) return;
    var showTourn = Net.roomTab === 'tourn';
    if (tournRg) {
      tournRg.style.display = showTourn ? 'block' : 'none';
      if (showTourn) {
        ['lob-tourn-setup', 'lob-tourn-note', 'lob-tourn'].forEach(function (id) {
          var n = tournNode(id);
          if (n && n.parentNode !== tournRg) tournRg.appendChild(n);
        });
      } else rescueTournNodes();
    }
    var ro = prRegion('roster'), ct = prRegion('controls');
    // v1.54.1 修復（使用者實機回報「錦標賽沒有進入遊戲的按鈕」）：舊版在錦標賽分頁把名單（roster）與
    // 準備/開賽列（controls）整組 display:none——v1.48 把錦標賽準備流程統一成「名單卡準備鈕＋開賽鈕」後，
    // 這段隱藏沒跟著退場，結果真機上錦標賽分頁看不到任何進入遊戲的按鈕（jsdom 點得到隱藏元素、測試全綠也沒發現）。
    // 現在 roster/controls 在錦標賽分頁照常顯示（與其他分頁同款）；只隱藏 settings 槽（錦標賽有自己的設定表單）。
    if (ro) ro.style.display = '';
    if (ct) ct.style.display = '';
    if (ro && ro.previousElementSibling) ro.previousElementSibling.style.display = '';
    if (PR.slot) PR.slot.style.display = showTourn ? 'none' : '';
    // 錦標賽分頁也要有卡片內的聊天/視訊膠囊＋離開房間（跟兩款遊戲等待室同款、使用者指示）：dock 與 leave 不隨分頁隱藏
    if (!tabsRg) return;
    var t = Net.tourn;
    var tournLive = !!(t && t.phase !== 'ended');
    var sig = [Net.armed.game, Net.armed.mode, Net.roomTab, Net.isHost ? 'H' : 'G', t ? t.phase + ':' + t.round : '-', tournLive ? 'L' : ''].join('|');
    if (sig === roomTabsSig && tabsRg.innerHTML) return;
    roomTabsSig = sig;
    function tabBtn(id, label) {
      var on = id === 'tourn' ? (Net.roomTab === 'tourn') : (Net.roomTab !== 'tourn' && Net.armed.game === id);
      var dim = (tournLive && id !== 'tourn' && !on) || !Net.isHost; // 來賓端：四顆分頁全反灰（只有房主能選遊戲）
      return '<button data-rtab="' + id + '" class="lob-tab' + (on ? ' lob-tab-on' : '') + '" style="flex:1' + (dim ? ';opacity:.45' : '') + '">' + label + '</button>';
    }
    var h = '<div class="flex gap-1.5">' + tabBtn('sudoku', '🔢 數獨') + tabBtn('hashi', '🌉 數橋') + tabBtn('mines', '💣 踩地雷') + tabBtn('tourn', '🏆 錦標賽') + '</div>';
    // 模式（合作/大亂鬥）不在這裡切：兩款的「對局設定」裡本來就有，殼只負責換遊戲（使用者指示刪除重複的模式列）
    if (Net.roomTab !== 'tourn') {
      if (tournLive) h += '<div class="text-center text-[11px] font-black text-amber-600 mt-1.5">🏆 賽程進行中・本局由賽程決定</div>';
      else if (Net.armed.game && Net.inMatch && Net.armed.game !== Net.inMatch) {
        var gn2 = Net.armed.game === 'hashi' ? '數橋' : (Net.armed.game === 'mines' ? '踩地雷' : '數獨');
        h += '<div class="text-center text-[11px] font-black text-sky-700 mt-1.5">' + (Net.isHost ? ('已選「' + gn2 + '」・按下方開始鈕帶大家過去') : ('房主已選「' + gn2 + '」・等房主開始後一起過去')) + '</div>';
      }
      else if (!Net.isHost) h += '<div class="text-center text-[11px] font-black text-slate-400 mt-1.5">遊戲由房主選擇，跟著房主走</div>';
    }
    tabsRg.innerHTML = h;
  }
  // 分頁選了別款遊戲時，房主按本房的「開始」＝帶全房去選定遊戲的等待室（回傳 true 表示已改道，不再啟動本房遊戲）
  function tryTransportStart() {
    if (!Net.isHost || Net.tourn || !Net.armed.game || !Net.inMatch || Net.armed.game === Net.inMatch) return false;
    var m = Net.armedByGame[Net.armed.game] || 'coop';
    platBroadcast({ kind: 'launch', game: Net.armed.game, mode: m });
    doLaunch(Net.armed.game, m);
    return true;
  }
  window.__PLAT_ROOMTAB = function (kind, val) {
    if (!Net.active) return;
    if (kind === 'tab' && val === 'tourn') { Net.roomTab = 'tourn'; if (Net.isHost) platBroadcast({ kind: 'tab', tab: 'tourn' }); renderTourn(); renderRoomTabs(); if (hubVisible()) hubRender(); return; }
    if (!Net.isHost) return;
    var t = Net.tourn;
    if (kind === 'tab') {
      if (t && t.phase !== 'ended') return;
      if (t && t.phase === 'ended') tournAbort();
      // 分頁只是選遊戲（使用者定案）：只改選定＋廣播同步，不 launch、不換畫面；房主按等待室的開始鈕才帶大家過去
      Net.armed.game = val; Net.roomTab = val;
      platBroadcast({ kind: 'arm', game: val });
      platPreload();
      renderRoomTabs();
      prRenderRegions(); // 帶路標籤由 prRenderRegions 依 armed 重繪：不等遊戲端下一次 update（數橋等待室沒有每秒 update，標籤會永遠不變）
      if (hubVisible()) hubRender();
    }
  };
  function tournSettle() {
    var t = Net.tourn; if (!t || t.settled) return;
    t.settled = true;
    if (t.timer) { clearTimeout(t.timer); t.timer = null; }
    if (t.armTimer) { clearTimeout(t.armTimer); t.armTimer = null; }
    var rest = t.entrants.filter(function (e) { return t.finishOrder.indexOf(e.uid) < 0; });
    rest.sort(function (a, b) { return (t.progress[b.uid] || 0) - (t.progress[a.uid] || 0); });
    var ordered = t.finishOrder.concat(rest.map(function (e) { return e.uid; }));
    var placements = ordered.map(function (key, i) {
      var en = tournEntrant(key);
      return { uid: key, pid: en ? en.pid : null, name: en ? en.name : '玩家', rank: i + 1, pts: tournPts(i + 1), progress: Math.floor(t.progress[key] || 0), finished: t.finishOrder.indexOf(key) >= 0 };
    });
    placements.forEach(function (pl) { t.totals[pl.uid] = (t.totals[pl.uid] || 0) + pl.pts; if (pl.rank === 1) t.wins[pl.uid] = (t.wins[pl.uid] || 0) + 1; });
    t.history.push({ round: t.round, game: t.curGame, placements: placements });
    if (t.phase === 'playoff') {
      var champKey = null;
      for (var i = 0; i < placements.length; i++) { if (t.tiedPids && t.tiedPids.indexOf(placements[i].uid) >= 0) { champKey = placements[i].uid; break; } }
      tournFinish(champKey || placements[0].uid, '同分加賽決勝');
      return;
    }
    if (t.round >= t.totalRounds) {
      var res = tournDecideChampion();
      if (res.champion) { tournFinish(res.champion, res.note); return; }
      t.tiedPids = res.tied;
      t.phase = 'playoff-pending';
    } else t.phase = 'standings';
    platBroadcast({ kind: 'tourn-score', round: t.round, game: t.curGame, placements: placements, totals: t.totals, wins: t.wins, history: t.history, phase: t.phase });
    tournReturnAll();
    renderTourn();
  }
  function tournFinish(champKey, note) {
    var t = Net.tourn; if (!t) return;
    t.phase = 'ended';
    var en = tournEntrant(champKey);
    t.champion = { uid: champKey, pid: en ? en.pid : null, name: en ? en.name : '玩家' };
    t.endNote = note || '';
    platBroadcast({ kind: 'tourn-end', champion: t.champion, totals: t.totals, wins: t.wins, history: t.history, note: t.endNote });
    tournReturnAll();
    renderTourn();
  }
  function tournStateMsg() { // 完整賽程狀態（接管備份/重連同步用）
    var t = Net.tourn; if (!t) return null;
    return { kind: 'tourn-score', phase: t.phase, round: t.round, game: t.curGame, progress: t.progress, finishOrder: t.finishOrder, boom: t.boom, totals: t.totals, wins: t.wins, history: t.history, tiedPids: t.tiedPids };
  }
  function tournSnapshot(force) { // 局中定期把進度/完賽序同步給全員，接管時新房主才有資料結算本局
    var t = Net.tourn; if (!t || !Net.isHost) return;
    var now = Date.now();
    if (!force && t._snapAt && now - t._snapAt < 2500) return;
    t._snapAt = now;
    var m = tournStateMsg(); if (m) platBroadcast(m);
  }
  function tournReturnAll() {
    if (Net.isHost) platBroadcast({ kind: 'return' });
    if (Net.inMatch) doReturnToLobby();
  }
  function tournAbort() {
    if (Net.isHost) platBroadcast({ kind: 'tourn-abort' });
    tournClear();
    renderLobby();
  }
  function tournClear() {
    var t = Net.tourn; if (!t) return;
    if (t.timer) clearTimeout(t.timer);
    if (t.armTimer) clearTimeout(t.armTimer);
    Net.tourn = null;
  }
  function tournAdopt() { // 房主接管後續打：新房主用全員備份的狀態接著主持（局中斷→本局依備份進度結算；局間→直接接手面板）
    var t = Net.tourn; if (!t || !Net.isHost) return;
    if (t.timer) { clearTimeout(t.timer); t.timer = null; }
    if (t.armTimer) { clearTimeout(t.armTimer); t.armTimer = null; }
    tournRebind();
    if (t.phase === 'playing' || t.phase === 'playoff') {
      t.settled = false;
      sysChat('👑 新房主接管賽程：本局依目前進度結算，賽程繼續進行');
      tournSettle();
    } else {
      sysChat('👑 新房主接管賽程：由新房主接著主持');
      var m2 = tournStateMsg(); if (m2) platBroadcast(m2);
      renderTourn();
    }
  }
  // 嗅探遊戲訊息（只在房主端計分）：fromPid 是傳輸層 pid，身份以訊息內 uid/name 為準（轉發不影響）
  function tournSniff(fromPid, d) {
    var t = Net.tourn;
    if (!t || !Net.isHost || t.settled || !d || typeof d !== 'object' || d.__plat) return;
    if (t.phase !== 'playing' && t.phase !== 'playoff') return;
    if (d.type === 'JOIN' && d.uid && d.pName) t.uidMap[d.uid] = tournUidByName(d.pName) || (tournEntrantByPid(fromPid) || {}).uid || null;
    if (d.type === 'PLAYERS_UPDATE' && d.players) d.players.forEach(function (p) { if (p.id && p.name) { var pp = tournUidByName(p.name); if (pp) t.uidMap[p.id] = pp; } });
    if (d.uid && d.name) { var pn = tournUidByName(d.name); if (pn) t.uidMap[d.uid] = pn; }
    var pidOf = function (uid) { return (uid && t.uidMap[uid]) || null; };
    if (t.curGame === 'hashi') {
      if (d.type === 'RACE_START' && !t.startedAt) {
        t.startedAt = d.startAt || Date.now();
        if (t.roundSecs > 0) { t.endsAt = t.startedAt + t.roundSecs * 1000; tournArmTimer(); }
      } else if (d.type === 'RACE_PROGRESS') { var p1 = pidOf(d.uid); if (p1) { t.progress[p1] = d.progress || 0; tournSnapshot(false); } }
      else if (d.type === 'RACE_FINISH' || d.type === 'RACE_DNF') tournMarkFinished(pidOf(d.uid));
    } else if (t.curGame === 'sudoku') {
      if (d.type === 'SYNC' && d.data) {
        // 數獨 SYNC 是 delta 廣播：cells（出題時）與 countdownTarget（開賽時）永遠不在同一封，必須分開認
        var sCells = d.data.cells || (d.data.levelData && d.data.levelData.cells);
        if (sCells && !t.totalBlanks) t.totalBlanks = sCells.filter(function (c) { return !c.isGiven; }).length || 0;
        if (d.data.countdownTarget && !t.startedAt) {
          t.startedAt = d.data.countdownTarget;
          if (t.roundSecs > 0) { t.endsAt = t.startedAt + t.roundSecs * 1000; tournArmTimer(); }
        }
        if (d.data.brawlWinners) d.data.brawlWinners.forEach(function (w) { tournMarkFinished(pidOf(w.id)); });
      } else if (d.type === 'GHOST_I_WON') tournMarkFinished(pidOf(d.senderUid));
      else if (d.type === 'GHOST_SOLVED' && d.uid) {
        var m = t.cellTrack[d.uid] || (t.cellTrack[d.uid] = {});
        m[d.cellId] = d.value;
        var p2 = pidOf(d.uid);
        if (p2 && t.totalBlanks > 0) {
          var cnt = 0; for (var k in m) if (m[k] !== null && m[k] !== undefined) cnt++;
          t.progress[p2] = Math.floor(cnt * 100 / t.totalBlanks);
          tournSnapshot(false);
        }
      }
    } else if (t.curGame === 'mines') {
      // 踩地雷：進度是 0–1 小數，換算成百分比與另兩款同尺度；踩雷出局走 boom 集合（不進 finishOrder，進度才不會被灌成 100）
      if (d.type === 'MINE_START' && !t.startedAt) {
        t.startedAt = d.startAt || Date.now();
        if (t.roundSecs > 0) { t.endsAt = t.startedAt + t.roundSecs * 1000; tournArmTimer(); }
      } else if (d.type === 'MINE_PROGRESS') { var p5 = pidOf(d.uid); if (p5) { t.progress[p5] = Math.round((d.progress || 0) * 100); tournSnapshot(false); } }
      else if (d.type === 'MINE_FINISH') tournMarkFinished(pidOf(d.uid));
      else if (d.type === 'MINE_BOOM') { var p6 = pidOf(d.uid); if (p6) { t.progress[p6] = Math.round((d.progress || 0) * 100); (t.boom = t.boom || {})[p6] = true; tournSnapshot(true); tournCheckDone(); } }
    }
  }
  // 錦標賽局中「結束本局」：v1.11.1 起不再有浮動鈕（太容易誤觸）——改藏進兩款遊戲標頭的「退出」選單裡，
  // 房主在賽局進行中按退出才會看到這個選項；遊戲端透過這兩個 hook 詢問/執行，條件與實作都只在殼端一份
  window.__PLAT_TOURN_CAN_FORCEEND = function () {
    var t = Net.tourn;
    return !!(Net.isHost && t && (t.phase === 'playing' || t.phase === 'playoff') && !t.settled);
  };
  window.__PLAT_TOURN_FORCEEND = function () { if (window.__PLAT_TOURN_CAN_FORCEEND()) tournSettle(); };
  function renderTourn() {
    var setup = tournNode('lob-tourn-setup'), panel = tournNode('lob-tourn');
    if (!setup || !panel) return;
    var t = Net.tourn;
    setup.style.display = (Net.isHost && !t && Net.roomTab === 'tourn') ? 'block' : 'none'; // v1.8.2：等待室五戰分頁裡就顯示（舊條件 !Net.inMatch 在房內永遠成立不了 → 五戰分頁全白）
    var tnote = tournNode('lob-tourn-note'); if (tnote) tnote.style.display = (!Net.isHost && Net.active && !t && Net.roomTab === 'tourn') ? 'block' : 'none';
    if (!t) { panel.style.display = 'none'; panel.innerHTML = ''; return; }
    if (t.phase === 'standings' || t.phase === 'playoff-pending' || t.phase === 'ended') {
      var tkey = t.phase + ':' + t.round + ':' + t.history.length;
      if (Net._tabTournKey !== tkey) Net._tabTournKey = tkey;
    }
    panel.style.display = 'block';
    var html = '<div class="lob-game-card"><div class="lob-game-title" style="background:#f59e0b">🏆 錦標賽</div><div class="p-2.5">';
    html += '<div class="flex flex-wrap gap-1.5 mb-2.5">';
    for (var i = 0; i < t.rounds.length; i++) {
      var rn = i + 1, g = t.rounds[i], st = 'bg-slate-100 text-slate-500', mark = '';
      var doneR = false; t.history.forEach(function (h) { if (h.round === rn) doneR = true; });
      if (doneR) { st = 'bg-emerald-100 text-emerald-700'; mark = '✓ '; }
      else if (t.round === rn && (t.phase === 'playing' || t.phase === 'playoff')) { st = 'bg-amber-200 text-slate-800'; mark = '▶ '; }
      html += '<span class="px-2 py-1 rounded-lg border-2 border-slate-800 text-xs font-black ' + st + '">' + mark + '第' + rn + '局 ' + tournGameName(g) + '</span>';
    }
    var hasPlayoff = t.phase === 'playoff' || t.phase === 'playoff-pending';
    t.history.forEach(function (h) { if (h.round > t.totalRounds) hasPlayoff = true; });
    if (hasPlayoff) html += '<span class="px-2 py-1 rounded-lg border-2 border-slate-800 text-xs font-black bg-rose-100 text-rose-600">加賽 數橋</span>';
    html += '</div>';
    if (t.phase === 'playing' || t.phase === 'playoff') html += '<div class="font-black text-slate-700 text-sm mb-2">▶ ' + (t.phase === 'playoff' ? '加賽' : '第 ' + t.round + ' 局') + '進行中：' + tournGameLabel(t.curGame) + (t.roundSecs > 0 ? '（限時 ' + Math.round(t.roundSecs / 60) + ' 分鐘）' : '') + '</div>';
    else if (t.phase === 'standings') html += '<div class="font-black text-slate-700 text-sm mb-2">第 ' + t.round + ' 局結束，下一局：' + tournGameName(t.rounds[t.round]) + '</div>';
    else if (t.phase === 'playoff-pending') html += '<div class="font-black text-rose-600 text-sm mb-2">⚖️ 總分同分、冠軍局數也同分 — 加賽一局數橋決勝！</div>';
    else if (t.phase === 'ended' && t.champion) html += '<div class="font-black text-amber-600 text-lg mb-1 text-center">🏆 總冠軍：' + esc(t.champion.name) + '</div>' + (t.endNote ? '<div class="text-center text-xs text-slate-500 font-bold mb-1">' + esc(t.endNote) + '</div>' : '');
    if (Net.isHost && (t.phase === 'playing' || t.phase === 'playoff')) {
      html += '<button id="t-forceend" class="w-full mb-2 py-2 bg-rose-500 border-[3px] border-slate-800 rounded-xl font-black text-white active:translate-y-[2px] transition-all">⏹️ 結束本局（以目前進度結算）</button>';
      html += '<div class=\"mb-2 flex flex-col gap-1\">' + t.entrants.map(function (e) {
        var a = (t.acks || {})[e.uid] || {};
        var okIn = a.entered === t.round;
        return '<div class=\"flex items-center justify-between text-xs font-bold ' + (okIn ? 'text-emerald-600' : 'text-amber-600') + '\"><span>' + (okIn ? '🎮' : '⏳') + ' ' + esc(e.name) + (okIn ? ' 已進場' : ' 進場中…') + '</span>' + (!okIn && e.pid !== Net.myPid ? '<button data-t-resend=\"' + e.pid + '\" class=\"px-2 py-0.5 bg-white border-2 border-slate-800 rounded-lg text-slate-700\">重送邀請</button>' : '') + '</div>';
      }).join('') + '</div>';
    }
    if (Net.isHost && t.phase === 'standings') {
      html += '<div class=\"mb-1 flex flex-col gap-1\">' + t.entrants.map(function (e) {
        var a = (t.acks || {})[e.uid] || {};
        var okBack = a.lobby === t.round;
        return '<div class=\"flex items-center justify-between text-xs font-bold ' + (okBack ? 'text-emerald-600' : 'text-amber-600') + '\"><span>' + (okBack ? '🏠' : '⏳') + ' ' + esc(e.name) + (okBack ? ' 已回大廳' : ' 還在遊戲裡…') + '</span>' + (!okBack && e.pid !== Net.myPid ? '<button data-t-rtn=\"' + e.pid + '\" class=\"px-2 py-0.5 bg-white border-2 border-slate-800 rounded-lg text-slate-700\">叫他回大廳</button>' : '') + '</div>';
      }).join('') + '</div>';
    }
    var rows = t.entrants.slice().sort(function (a, b) { return (t.totals[b.uid] || 0) - (t.totals[a.uid] || 0); });
    html += '<table class="w-full text-sm font-bold text-slate-600"><tbody>';
    rows.forEach(function (e, ri) {
      var cells = '';
      for (var r = 0; r < t.history.length; r++) {
        var pl = null;
        t.history[r].placements.forEach(function (x) { if (x.uid ? x.uid === e.uid : x.pid === e.pid) pl = x; });
        cells += '<td class="text-center px-1">' + (pl ? pl.pts : '–') + '</td>';
      }
      html += '<tr><td class="py-1">' + (ri + 1) + '. <span' + (e.color === 'rainbow' ? ' class="plat-rainbow-anim"' : '') + ' style="display:inline-block;width:10px;height:10px;border-radius:99px;' + (e.color === 'rainbow' ? '' : 'background:' + platSafeColor(e.color) + ';') + 'vertical-align:middle"></span> ' + esc(e.name) + (e.uid === Net.myUid ? '（你）' : '') + (t.wins[e.uid] ? ' <span class="text-xs text-slate-400">👑×' + t.wins[e.uid] + '</span>' : '') + '</td>' + cells + '<td class="text-right font-black text-slate-800"><span data-pc="' + (t.totals[e.uid] || 0) + '" data-pc-key="tourn-' + e.uid + '">' + (t.totals[e.uid] || 0) + '</span> 分</td></tr>';
    });
    html += '</tbody></table>';
    var last = t.history[t.history.length - 1];
    if (last && (t.phase === 'standings' || t.phase === 'playoff-pending' || t.phase === 'ended')) {
      html += '<div class="mt-2 text-xs font-bold text-slate-500">' + (last.round > t.totalRounds ? '加賽' : '第 ' + last.round + ' 局') + '名次：' + last.placements.map(function (pl) { return pl.rank + '. ' + esc(pl.name) + '（' + pl.pts + ' 分' + (pl.finished ? '' : '・未完成 ' + pl.progress + '%') + '）'; }).join('　') + '</div>';
    }
    var missingBack = t.entrants.filter(function (e) { var a = (t.acks || {})[e.uid] || {}; return a.lobby !== t.round; }).length;
    if (Net.isHost && t.phase === 'standings') html += '<button id="t-next" class="w-full mt-3 py-2.5 ' + (missingBack ? 'bg-rose-400' : 'bg-[#f59e0b]') + ' border-[3px] border-slate-800 rounded-xl font-black text-slate-900 shadow-[3px_3px_0px_rgba(30,41,59,1)] active:translate-y-[2px] active:shadow-none transition-all">' + (missingBack ? '🚀 強制開始第 ' + (t.round + 1) + ' 局（還有 ' + missingBack + ' 人未回來）' : '▶ 開始第 ' + (t.round + 1) + ' 局：' + tournGameName(t.rounds[t.round])) + '</button>';
    if (Net.isHost && t.phase === 'playoff-pending') html += '<button id="t-playoff" class="w-full mt-3 py-2.5 bg-rose-400 border-[3px] border-slate-800 rounded-xl font-black text-slate-900 shadow-[3px_3px_0px_rgba(30,41,59,1)] active:translate-y-[2px] active:shadow-none transition-all">' + (missingBack ? '🚀 強制加賽（還有 ' + missingBack + ' 人未回來）' : '▶ 加賽一局：數橋大亂鬥') + '</button>';
    if (Net.isHost && (t.phase === 'standings' || t.phase === 'playoff-pending')) html += '<button id="t-abort" class="w-full mt-2 py-2 bg-white border-[3px] border-slate-300 rounded-xl font-black text-slate-500 active:translate-y-[2px] transition-all">✖ 中止賽程</button>';
    if (Net.isHost && t.phase === 'ended') html += '<button id="t-abort" class="w-full mt-3 py-2.5 bg-white border-[3px] border-slate-800 rounded-xl font-black text-slate-700 active:translate-y-[2px] transition-all">結束賽程（回房間）</button>';
    if (!Net.isHost && (t.phase === 'standings' || t.phase === 'playoff-pending')) html += '<div class="text-center text-slate-400 font-bold text-xs mt-2">⏳ 等待房主開始下一局…</div>';
    html += '</div></div>';
    panel.innerHTML = html;
    platCountify(panel); // v1.53.0：總分以滾輪續滾到新值（跨局不重畫歸零）
    var feb = panel.querySelector('#t-forceend'); if (feb) feb.onclick = function () { if (Net.tourn && !Net.tourn.settled) tournSettle(); };
    var nb = panel.querySelector('#t-next'); if (nb) nb.onclick = function () { var tt = Net.tourn; if (!tt) return; tt.round++; tt.phase = 'playing'; tournStartRound(); };
    var pb = panel.querySelector('#t-playoff'); if (pb) pb.onclick = function () { var tt = Net.tourn; if (!tt) return; tt.round = tt.totalRounds + 1; tt.phase = 'playoff'; tournStartRound(); };
    var ab = panel.querySelector('#t-abort'); if (ab) ab.onclick = function () { tournAbort(); };
    panel.querySelectorAll('[data-t-resend]').forEach(function (b) { b.onclick = function () { var pid2 = b.getAttribute('data-t-resend'); var c2 = Net.conns[pid2]; var tt2 = Net.tourn; if (c2 && tt2) { platSend(c2, { kind: 'launch', game: tt2.curGame, mode: 'brawl', tourn: tournSess() }); var en = tt2.entrants.find(function (x) { return x.pid === pid2; }); sysChat('📨 已重送進場邀請給 ' + (en ? en.name : '玩家')); } }; });
    panel.querySelectorAll('[data-t-rtn]').forEach(function (b) { b.onclick = function () { var pid3 = b.getAttribute('data-t-rtn'); var c3 = Net.conns[pid3]; if (c3) { platSend(c3, { kind: 'return' }); sysChat('📨 已請他回大廳'); } }; });
    // 小局結算頒獎台：history 新增一筆且處於結算相態時播一次（房主/來賓/接管皆經 renderTourn 觸發）
    if ((t.phase === 'standings' || t.phase === 'playoff-pending' || t.phase === 'ended') && t.history && t.history.length) {
      var hk2 = t.history.length + ':' + t.history[t.history.length - 1].round;
      if (Net._podiumKey !== hk2) { Net._podiumKey = hk2; try { podShow(t.history[t.history.length - 1], t); } catch (e) {} }
    }
  }

  // ---------- 視訊（v2.18 禮儀：麥克風預設關、喇叭預設關、發言提示） ----------
  function updateDock() {
    // v1.12.5：下方正方形 dock 條已刪（使用者指示）——聊天/視訊/離開房間統一收進 PlatRoom 卡片內的膠囊＋離開鈕（房間頁全分頁，含錦標賽）
    window.__PLAT_SESSION_ACTIVE = !!Net.active;
    if (window.PlatDock) window.PlatDock._emit();
  }
  window.__PLAT_UPDATE_DOCK = updateDock;
  // 遊戲內底部列的平台按鈕 API（💬/🎥/🎤/🔈/回大廳）：遊戲在平台模式＋連線中時
  // 把這些按鈕畫進自己的底部工具列（與遊戲按鈕同排同款），殼的 strip 只留在大廳。
  window.PlatDock = {
    _subs: [],
    isActive: function () { return !!Net.active; },
    getState: function () {
      return { unread: Net.unread || 0, chatOpen: !!Net.chatOpen, videoOn: !!Net.videoOn, micMuted: !!Net.micMuted, speakerOn: !!Net.speakerOn, remoteCount: Object.keys(Net.remoteStreams).length };
    },
    toggleChat: function () { if (Net.chatOpen) closeChat(); else openChat(); if (window.PlatDock) window.PlatDock._emit(); },
    toggleVideo: function () { toggleVideo(); },
    toggleMic: function () { toggleMic(); },
    toggleSpeaker: function () { toggleSpeaker(); },
    goLobby: function () { window.PLAT_show('home'); }, // 回「大廳」= 平台主頁（使用者明示：不是多人連線選單、也不是等待室）
    subscribe: function (fn) {
      window.PlatDock._subs.push(fn);
      return function () { var i = window.PlatDock._subs.indexOf(fn); if (i >= 0) window.PlatDock._subs.splice(i, 1); };
    },
    _emit: function () { window.PlatDock._subs.slice().forEach(function (f) { try { f(); } catch (e) {} }); }
  };

  // ---------- 共用底部列 PlatBar（單一元件：兩款遊戲的對局底部列都由殼渲染） ----------
  // 遊戲只負責：留掛載點 div、attach(cfg)、狀態變動時 update(state)、卸載時 detach(el)。
  // cfg: { accent:'#ffcc00'|'#4ade80', onAction:function(name, payload) }
  // state: { mode, modes:[{icon,label}], modeTitle, zoomLabel, zoomGlyph,
  //          showInput, inputMode, showDraw, drawTool, showHostClear }
  // popover 開合（zoomOpen/drawOpen）由殼持有；模式鈕規則與數獨/數橋原行為一致：
  // 在塗鴉模式且 popover 關閉時按模式鈕 → 只重開 popover；其餘 → onAction('mode-press') 由遊戲切換。
  var PB = { el: null, cfg: null, state: null, zoomOpen: false, drawOpen: false, dockOpen: false, lastMode: -1, unsub: null, lastJson: null, _popOut: null };
  // PlatBar 子選單的 popover 退場（v1.55.0，P2 與 platPopOpen/Close 同通則）：bar 是 innerHTML 重畫模型、元素不能跨畫持有，
  // 改為「關閉時先把選單以 plat-pop-out 姿態多畫一幀屍體（175ms），時間到才真的不畫」——開＝plat-pop-in 插入即播、origin 對齊觸發邊。
  function pbDying(kind) { return !!(PB._popOut && PB._popOut.kind === kind && Date.now() < PB._popOut.until); }
  function pbArmPopOut(kind) { PB._popOut = { kind: kind, until: Date.now() + 175 }; setTimeout(function () { if (PB._popOut && Date.now() >= PB._popOut.until - 5) { PB._popOut = null; pbRender(); } }, 190); }
  function pbPopCloseMenu(kind) {
    if (kind === 'zoom') PB.zoomOpen = false; else if (kind === 'draw') PB.drawOpen = false; else if (kind === 'dock') PB.dockOpen = false;
    pbArmPopOut(kind); pbRender();
  }
  function pbPopOpenMenu(kind) {
    if (kind === 'zoom') PB.zoomOpen = true; else if (kind === 'draw') PB.drawOpen = true; else if (kind === 'dock') PB.dockOpen = true;
    if (PB._popOut && PB._popOut.kind === kind) PB._popOut = null;
    pbRender();
  }
  function pbEsc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); } // 名稱/標籤進 innerHTML 前一律跳脫（原為直通，改造客戶端送 HTML 名稱可注入標記）
  function pbRender() {
    if (!PB.el || !PB.state || !PB.cfg) return;
    var st = PB.state, ac = PB.cfg.accent || '#ffcc00';
    var dock = window.PlatDock;
    var ds = dock && dock.isActive() ? dock.getState() : null;
    var drawIdx = st.modes.length - 1;
    var h = '';
    h += '<div class="bg-[#fffdfa]/95 backdrop-blur-md border-t-[4px] border-slate-800 min-h-[4rem] md:min-h-[5rem] flex flex-nowrap items-center justify-between gap-x-2 gap-y-1 py-1 px-3 md:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]" style="width:100%">';
    // 縮放組
    h += '<div class="flex items-center gap-1.5 md:gap-3 bg-slate-100 p-1 rounded-xl border-2 border-slate-300 relative">';
    h += '<button data-pb="zoom-toggle" title="縮放（點開/收合）" class="w-11 h-11 md:w-14 md:h-14 bg-white border-[3px] border-slate-800 rounded-lg shadow-[2px_2px_0px_#1e293b] active:translate-y-[2px] active:shadow-none flex items-center justify-center text-base md:text-lg font-black transition-all" style="--pba:' + ac + '">' + (st.zoomLabel && st.zoomLabel !== '🔍' ? '<span class="text-xs md:text-sm">' + pbEsc(st.zoomLabel) + '</span>' : '🔍') + '</button>';
    if (PB.zoomOpen || pbDying('zoom')) {
      h += '<div data-pbmenu="zoom" style="transform-origin:0% 100%" class="absolute bottom-full mb-3 left-0 flex flex-col gap-2 bg-white border-[3px] border-slate-800 p-2 rounded-2xl shadow-[6px_6px_0px_rgba(30,41,59,0.25)] z-50 ' + (PB.zoomOpen ? 'plat-pop-in' : 'plat-pop-out') + '">';
      h += '<button data-pb="zoom-in" title="放大" class="w-12 h-12 bg-white border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-xl font-black shadow-[2px_2px_0px_#1e293b] active:translate-y-[2px] active:shadow-none transition-all">＋</button>';
      h += '<button data-pb="zoom-out" title="縮小" class="w-12 h-12 bg-white border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-xl font-black shadow-[2px_2px_0px_#1e293b] active:translate-y-[2px] active:shadow-none transition-all">－</button>';
      h += '<button data-pb="zoom-cycle" title="循環切換縮放模式（自動適應）" class="w-12 h-12 bg-slate-800 border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-[2px_2px_0px_#1e293b] active:translate-y-[2px] active:shadow-none transition-all">' + pbEsc(st.zoomGlyph || '🔲') + '</button>';
      h += '</div>';
    }
    h += '</div>';
    // 輸入方式組（數獨專屬，遊戲以 showInput 開啟）
    if (st.showInput) {
      var numOn = st.inputMode !== 'cell';
      h += '<div class="flex items-center bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner">';
      h += '<button data-pb="input-num" class="px-3 md:px-5 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-base flex items-center gap-1.5 md:gap-2 transition-all ' + (numOn ? 'shadow-md' : 'text-slate-400 hover:text-white') + '"' + (numOn ? ' style="background:' + ac + ';color:#0f172a"' : '') + '><span class="text-lg md:text-xl leading-none">🔢</span><span class="hidden sm:inline">數字先行</span></button>';
      h += '<button data-pb="input-cell" class="px-3 md:px-5 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-base flex items-center gap-1.5 md:gap-2 transition-all ' + (!numOn ? 'shadow-md' : 'text-slate-400 hover:text-white') + '"' + (!numOn ? ' style="background:#38bdf8;color:#0f172a"' : '') + '><span class="sm:hidden text-lg leading-none">👆</span><span class="hidden sm:inline">👆 格子先行</span></button>';
      h += '</div>';
    }
    // 模式組
    var md = st.modes[st.mode] || st.modes[0];
    var modeBg = (st.mode === drawIdx && st.modes.length > 2) ? '#34d399' : ac;
    h += '<div class="flex items-center gap-1 md:gap-2 bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner relative">';
    h += '<button data-pb="mode-press" title="' + pbEsc(st.modeTitle || '切換模式') + '" class="px-3 md:px-5 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-base flex items-center gap-1.5 md:gap-2 transition-all shadow-md" style="background:' + modeBg + ';color:#0f172a"><span>' + pbEsc(md.icon) + '</span><span class="hidden sm:inline">' + pbEsc(md.label) + '</span><span style="font-size:10px;opacity:.6">▾</span></button>';
    if (st.showDraw && (PB.drawOpen || pbDying('draw'))) {
      var penOn = st.drawTool !== 'eraser';
      h += '<div data-pbmenu="draw" style="transform-origin:100% 100%" class="absolute bottom-full mb-6 right-0 flex flex-col gap-3 bg-white border-[3px] border-slate-800 p-2.5 rounded-2xl shadow-[10px_10px_0px_rgba(30,41,59,0.2)] z-50 ' + (PB.drawOpen ? 'plat-pop-in' : 'plat-pop-out') + '">';
      h += '<button data-pb="draw-pen" title="畫筆模式" class="w-12 h-12 border-[3px] rounded-xl flex items-center justify-center transition-all shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-[2px] ' + (penOn ? 'bg-emerald-100 border-emerald-600' : 'bg-white border-slate-800 hover:bg-slate-50') + '"' + (penOn ? ' style="transform:scale(1.1)"' : '') + '>🖌️</button>';
      h += '<button data-pb="draw-eraser" title="橡皮擦 (雙擊清除自己所有塗鴉)" class="w-12 h-12 border-[3px] rounded-xl flex items-center justify-center transition-all shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-[2px] ' + (!penOn ? 'bg-orange-100 border-orange-600' : 'bg-white border-slate-800 hover:bg-slate-50') + '"' + (!penOn ? ' style="transform:scale(1.1)"' : '') + '>🧽</button>';
      if (st.showHostClear) h += '<button data-pb="draw-clear" title="房主：清除全場塗鴉" class="w-12 h-12 bg-rose-50 border-[3px] border-rose-800 text-rose-800 rounded-xl flex items-center justify-center hover:bg-rose-100 shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-[2px]">🚮</button>';
      h += '</div>';
    }
    h += '</div>';
    // 平台 dock capsule（連線中才出現）：列上只留 💬＋🎥；視訊相關控制（麥克風/喇叭/關閉）
    // 收進 🎥 的往上展開 popover（比照縮放/塗鴉），底部列永遠不換行成兩排。
    if (ds) {
      if (!ds.videoOn && ds.remoteCount === 0) PB.dockOpen = false;
      var dbtn = 'position:relative;display:flex;align-items:center;justify-content:center;padding:6px 10px;border-radius:12px;font-size:17px;line-height:1;background:transparent;border:none;cursor:pointer';
      var hasVidCtl = ds.videoOn || ds.remoteCount > 0;
      var popBtn = 'w-12 h-12 border-[3px] border-slate-800 rounded-xl flex items-center justify-center text-xl shadow-[2px_2px_0px_#1e293b] active:translate-y-[2px] active:shadow-none transition-all bg-white';
      h += '<div class="flex items-center gap-0.5 md:gap-1 bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner relative">';
      h += '<button data-pb="dock-chat" title="聊天室" style="' + dbtn + (ds.chatOpen ? ';background:' + ac : '') + '">💬' + (ds.unread > 0 && !ds.chatOpen ? '<span style="position:absolute;top:1px;right:1px;min-width:15px;height:15px;padding:0 3px;border-radius:9999px;background:#ef4444;color:#fff;font-size:9px;font-weight:900;display:flex;align-items:center;justify-content:center;border:1.5px solid #1e293b">' + ds.unread + '</span>' : '') + '</button>';
      h += '<button data-pb="dock-video" title="視訊" style="' + dbtn + (ds.videoOn ? ';background:' + ac : '') + '">' + (ds.videoOn ? '📹' : '🎥') + (hasVidCtl ? '<span style="font-size:9px;opacity:.75;margin-left:1px">▴</span>' : '') + '</button>';
      if (hasVidCtl && (PB.dockOpen || pbDying('dock'))) {
        h += '<div data-pbmenu="dock" style="transform-origin:100% 100%" class="absolute bottom-full mb-3 right-0 flex flex-col gap-2 bg-white border-[3px] border-slate-800 p-2 rounded-2xl shadow-[6px_6px_0px_rgba(30,41,59,0.25)] z-50 ' + (PB.dockOpen ? 'plat-pop-in' : 'plat-pop-out') + '">';
        if (ds.videoOn) h += '<button data-pb="dock-mic" title="麥克風" class="' + popBtn + '"' + (!ds.micMuted ? ' style="background:' + ac + '"' : '') + '>' + (ds.micMuted ? '🔇' : '🎤') + '</button>';
        h += '<button data-pb="dock-speaker" title="喇叭" class="' + popBtn + '"' + (ds.speakerOn ? ' style="background:' + ac + '"' : '') + '>' + (ds.speakerOn ? '🔊' : '🔈') + '</button>';
        if (ds.videoOn) h += '<button data-pb="dock-stop" title="關閉視訊" class="w-12 h-12 bg-rose-50 border-[3px] border-rose-800 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#1e293b] active:translate-y-[2px] active:shadow-none transition-all"><span style="font-size:19px">📹</span><span style="font-size:10px;vertical-align:top;color:#9f1239;font-weight:900">✕</span></button>';
        else h += '<button data-pb="dock-start" title="開啟視訊" class="' + popBtn + '">🎥</button>';
        h += '</div>';
      }
      h += '</div>';
    }
    h += '</div>';
    PB.el.innerHTML = h;
    // popover（視訊控制/縮放/塗鴉）開啟時要浮在視訊頭像上面，否則會被自己的頭像遮住按不到
    var anyPop = PB.dockOpen || PB.zoomOpen || PB.drawOpen || pbDying('zoom') || pbDying('draw') || pbDying('dock');
    PB.el.style.position = 'relative';
    PB.el.style.zIndex = anyPop ? '99990' : '';
    var vv = $('plat-videos'); if (vv) vv.style.zIndex = anyPop ? '9990' : '';
  }
  function pbAct(name, payload) { if (PB.cfg && PB.cfg.onAction) { try { PB.cfg.onAction(name, payload); } catch (e) {} } }
  function pbClick(e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-pb]') : null;
    if (!t || !PB.el.contains(t)) return;
    var k = t.getAttribute('data-pb');
    if (k === 'zoom-toggle') { if (PB.zoomOpen) pbPopCloseMenu('zoom'); else pbPopOpenMenu('zoom'); }
    else if (k === 'zoom-in') pbAct('zoom-in');
    else if (k === 'zoom-out') pbAct('zoom-out');
    else if (k === 'zoom-cycle') pbAct('zoom-cycle');
    else if (k === 'input-num') pbAct('input-set', 'num');
    else if (k === 'input-cell') pbAct('input-set', 'cell');
    else if (k === 'mode-press') {
      var st = PB.state; if (!st) return;
      var drawIdx = st.modes.length - 1;
      if (st.showDraw && st.mode === drawIdx && !PB.drawOpen) { pbPopOpenMenu('draw'); return; }
      pbAct('mode-press');
    }
    else if (k === 'draw-pen') pbAct('draw-tool', 'pen');
    else if (k === 'draw-eraser') pbAct('draw-tool', 'eraser');
    else if (k === 'draw-clear') pbAct('draw-clear');
    else if (k === 'dock-chat' && window.PlatDock) window.PlatDock.toggleChat();
    else if (k === 'dock-video' && window.PlatDock) {
      var ds2 = window.PlatDock.isActive() ? window.PlatDock.getState() : null;
      if (ds2 && (ds2.videoOn || ds2.remoteCount > 0)) { if (PB.dockOpen) pbPopCloseMenu('dock'); else pbPopOpenMenu('dock'); }
      else window.PlatDock.toggleVideo();
    }
    else if (k === 'dock-start' && window.PlatDock) { pbPopCloseMenu('dock'); window.PlatDock.toggleVideo(); }
    else if (k === 'dock-stop' && window.PlatDock) { pbPopCloseMenu('dock'); window.PlatDock.toggleVideo(); }
    else if (k === 'dock-mic' && window.PlatDock) window.PlatDock.toggleMic();
    else if (k === 'dock-speaker' && window.PlatDock) window.PlatDock.toggleSpeaker();
  }
  function pbDblClick(e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-pb]') : null;
    if (!t || !PB.el.contains(t)) return;
    if (t.getAttribute('data-pb') === 'draw-eraser') pbAct('draw-erase-dbl');
  }
  window.PlatBar = {
    attach: function (el, cfg) {
      if (!el) return;
      if (PB.el && PB.el !== el) window.PlatBar.detach(PB.el);
      PB.el = el; PB.cfg = cfg || {}; PB.lastJson = null;
      el.removeEventListener('click', pbClick);
      el.addEventListener('click', pbClick);
      el.removeEventListener('dblclick', pbDblClick);
      el.addEventListener('dblclick', pbDblClick);
      if (!PB.unsub && window.PlatDock) PB.unsub = window.PlatDock.subscribe(function () { pbRender(); });
      pbRender();
    },
    update: function (state) {
      if (!state) return;
      var j = null;
      try { j = JSON.stringify(state); } catch (e) {}
      if (j && j === PB.lastJson && PB.state) { PB.state = state; return; }
      PB.lastJson = j;
      var prevMode = PB.state ? PB.state.mode : -1;
      PB.state = state;
      if (state.mode !== prevMode) {
        var drawIdx = state.modes.length - 1;
        var ndOpen = !!(state.showDraw && state.mode === drawIdx);
        if (PB.drawOpen && !ndOpen) pbArmPopOut('draw'); // 模式切離塗鴉＝選單退場，照通則淡出後才消失
        PB.drawOpen = ndOpen;
        PB.lastMode = state.mode;
      }
      pbRender();
    },
    detach: function (el) {
      if (!PB.el || (el && el !== PB.el)) return;
      PB.el.removeEventListener('click', pbClick);
      PB.el.removeEventListener('dblclick', pbDblClick);
      PB.el.innerHTML = '';
      PB.el = null; PB.cfg = null; PB.state = null; PB.lastJson = null; PB.zoomOpen = false; PB.drawOpen = false; PB.dockOpen = false; PB._popOut = null;
      if (PB.unsub) { PB.unsub(); PB.unsub = null; }
    },
    isAttached: function () { return !!PB.el; },
    _el: function () { return PB.el; },
    _elConnected: function () { return !!(PB.el && PB.el.isConnected); }, // v1.55.1：遊戲端自我修復 attach 用（掛載節點被卸載重建時 PB.el 會變死節點）
    _debug: function () { return { attached: !!PB.el, inDoc: !!(PB.el && PB.el.isConnected), hasState: !!PB.state, mode0: PB.state && PB.state.modes && PB.state.modes[0] ? PB.state.modes[0].label : null, htmlLen: PB.el ? PB.el.innerHTML.length : -1, zoomOpen: PB.zoomOpen, drawOpen: PB.drawOpen }; }
  };
  // ---------- 共用等待室 PlatRoom（兩款遊戲的多人等待室由殼渲染同一張卡） ----------
  // 遊戲負責：留掛載點、attach(cfg)、update(state)、把自己的「對局設定」JSX 用
  // ReactDOM.createPortal 塞進 PlatRoom.getSlot() 的設定槽（殼不碰那個節點）。
  // state: { title, code, showRefresh,
  //   players:[{key,name,color,isMe,isHost,online,badge:{text,kind}|null,
  //             toggle:{on,labelOn,labelOff}|null, clickable}],
  //   myReady(bool|null), readyOn, readyOff, mySpectator(bool|null),
  //   start:{label,kind:'primary'|'danger',disabled,note}|null, waitingText }
  // actions: refresh / ready / spectator / start / leave /
  //          player-click(key) / player-toggle(key)
  var PR = { el: null, cfg: null, state: null, lastJson: null, unsub: null, slot: null };
  // F2 狀態字 Roll（v1.56.0）：字串渲染的按鈕標籤換字時包 .plat-lite-in 播滾換（新節點插入即播）；
  // 同字重渲染不加 class、不重播。用 key 區分不同標籤位（ready/start）。
  var prLiteMemo = {};
  function prLiteSpan(key, text) {
    var t = String(text == null ? '' : text);
    var prev = prLiteMemo[key], now = Date.now();
    var changed = prev !== undefined && prev.text !== t;
    if (!prev || prev.text !== t) prLiteMemo[key] = { text: t, at: now };
    // 換字後 400ms 內的重渲染繼續帶滾換 class（名單每秒 waitLeft 推進＋ready 廣播回音都會重渲染；
    // 只在換字當次渲染帶 class，測試與真機都可能被緊接的回音渲染洗掉、滾換被腰斬）。首次掛載不滾。
    var m2 = prLiteMemo[key];
    var rolling = changed || (prev && prev.text === t && (now - m2.at) < 400);
    return '<span' + (rolling ? ' class="plat-lite-in" style="display:inline-block"' : '') + '>' + pbEsc(t) + '</span>';
  }

  function prRegion(name) { return PR.el ? PR.el.querySelector('[data-pr-region="' + name + '"]') : null; }
  function prAct(name, payload) { if (PR.cfg && PR.cfg.onAction) { try { PR.cfg.onAction(name, payload); } catch (e) {} } }
  function prDockHtml(ac) {
    var dock = window.PlatDock;
    if (!dock || !dock.isActive()) return '';
    var ds = dock.getState();
    var dbtn = 'position:relative;display:flex;align-items:center;justify-content:center;padding:6px 10px;border-radius:12px;font-size:17px;line-height:1;background:transparent;border:none;cursor:pointer';
    var h = '<div class="flex items-center gap-0.5 md:gap-1 bg-slate-800 p-1 rounded-2xl border-2 border-slate-800 shadow-inner">';
    h += '<button data-pr="dock-chat" title="聊天室" style="' + dbtn + (ds.chatOpen ? ';background:' + ac : '') + '">💬' + (ds.unread > 0 && !ds.chatOpen ? '<span style="position:absolute;top:1px;right:1px;min-width:15px;height:15px;padding:0 3px;border-radius:9999px;background:#ef4444;color:#fff;font-size:9px;font-weight:900;display:flex;align-items:center;justify-content:center;border:1.5px solid #1e293b">' + ds.unread + '</span>' : '') + '</button>';
    h += '<button data-pr="dock-video" title="視訊" style="' + dbtn + (ds.videoOn ? ';background:' + ac : '') + '">' + (ds.videoOn ? '📹' : '🎥') + '</button>';
    if (ds.videoOn) h += '<button data-pr="dock-mic" title="麥克風" style="' + dbtn + (!ds.micMuted ? ';background:' + ac : '') + '">' + (ds.micMuted ? '🔇' : '🎤') + '</button>';
    if (ds.videoOn || ds.remoteCount > 0) h += '<button data-pr="dock-speaker" title="喇叭" style="' + dbtn + (ds.speakerOn ? ';background:' + ac : '') + '">' + (ds.speakerOn ? '🔊' : '🔈') + '</button>';
    return h + '</div>';
  }
  function prRenderRegions() {
    if (!PR.el || !PR.state) return;
    var st = PR.state, ac = (PR.cfg && PR.cfg.accent) || '#ffcc00';
    var t = prRegion('title'); if (t) t.textContent = st.title || '🎮 遊戲大廳';
    var cd = prRegion('code'); if (cd) cd.textContent = st.code || '';
    var rf = prRegion('refresh'); if (rf) rf.style.display = st.showRefresh ? '' : 'none';
    var ro = prRegion('roster');
    if (ro) {
      var h = '';
      (st.players || []).forEach(function (pl) {
        var bg = pl.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : platSafeColor(pl.color);
        h += '<div class="bg-slate-50 border-2 border-slate-800 rounded-xl px-3 py-2 font-black text-slate-800"' + (pl.pending ? ' style="opacity:.55"' : '') + '>';
        h += '<div class="flex items-center gap-2"' + (pl.clickable ? ' data-pr="player-click" data-key="' + pbEsc(pl.key) + '" style="cursor:pointer"' : '') + '>';
        h += '<span class="relative shrink-0"><span class="w-4 h-4 rounded-full inline-block border-2 border-slate-800 shadow-inner' + (pl.color === 'rainbow' ? ' plat-rainbow-anim' : '') + '" style="' + (pl.color === 'rainbow' ? '' : 'background:' + bg + ';') + (pl.pending ? 'filter:grayscale(1)' : '') + '"></span>';
        if (pl.online !== undefined && pl.online !== null) h += '<span class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-white ' + (pl.online ? 'bg-green-500' : 'bg-slate-300') + '"></span>';
        h += '</span>';
        if (pl.editable && !pl.editing) {
          h += '<button data-id-edit="' + pbEsc(pl.key) + '" class="truncate bg-transparent border-none cursor-pointer font-black text-slate-800 text-left p-0" title="點名字改暱稱/代表色">' + pbEsc(pl.name || '玩家') + (pl.isMe ? '（你）' : '') + (pl.isHost ? ' 👑' : '') + ' <span class="text-slate-400" style="font-size:11px">✏️</span></button>';
        } else {
          h += '<span class="truncate">' + pbEsc(pl.name || '玩家') + (pl.isMe ? '（你）' : '') + (pl.isHost ? ' 👑' : '') + (pl.pending ? '<span class="text-slate-400">（未到）</span>' : '') + '</span>';
        }
        h += '<span class="ml-auto flex gap-1 shrink-0 items-center">';
        if (pl.toggle) {
          var tg = pl.toggle;
          h += '<button data-pr="player-toggle" data-key="' + pbEsc(pl.key) + '" class="flex items-center gap-1 cursor-pointer select-none bg-transparent border-none">';
          h += '<span class="font-black text-[10px] ' + (tg.on ? 'text-slate-700' : 'text-slate-400') + '">' + pbEsc(tg.on ? tg.labelOn : tg.labelOff) + '</span>';
          h += '<span class="w-10 h-5 rounded-full border-2 border-slate-800 relative shadow-inner inline-block ' + (tg.on ? 'bg-emerald-400' : 'bg-slate-300') + '"><span class="w-3.5 h-3.5 bg-white rounded-full border-2 border-slate-800 absolute top-[1px]" style="left:' + (tg.on ? '18px' : '1px') + '"></span></span>';
          h += '</button>';
        }
        if (pl.badge) {
          var bk = pl.badge.kind === 'ready' ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : pl.badge.kind === 'spec' ? 'bg-sky-100 border-sky-400 text-sky-700' : 'bg-slate-100 border-slate-300 text-slate-400';
          h += '<span class="text-[10px] border px-1.5 py-0.5 rounded-md ' + bk + '">' + prLiteSpan('badge-' + pl.key, pl.badge.text) + '</span>'; // G3：名單狀態字換字才滾（key=玩家 uid；同字重渲染不重播、不閃爍）
        }
        h += '</span></div>';
        if (pl.editing) {
          h += '<div class="mt-2 flex flex-col gap-2">';
          h += '<input id="hub-id-name" type="text" maxlength="12" value="' + esc(pl.editName || '') + '" class="w-full border-2 border-slate-800 rounded-lg px-2 py-1.5 font-black text-slate-800 outline-none bg-white">';
          h += '<div class="flex items-center gap-2">';
          h += '<span class="w-8 h-8 rounded-full border-2 border-slate-800 shrink-0' + (pl.editColor === 'rainbow' ? ' plat-rainbow-anim' : '') + '"' + (pl.editColor === 'rainbow' ? '' : ' style="background:' + (pl.editColor || '#ccc') + '"') + '></span>';
          h += '<button data-id-wheel="1" class="flex-1 py-1.5 bg-[#60a5fa] border-2 border-slate-800 rounded-lg font-black text-slate-900">🎡 摩天輪決定代表色</button>';
          h += '</div>';
          h += '<div class="flex gap-2"><button data-id-save="' + pbEsc(pl.key) + '" class="flex-1 py-1.5 bg-emerald-400 border-2 border-slate-800 rounded-lg font-black text-slate-900">✓ 儲存</button><button data-id-cancel="1" class="flex-1 py-1.5 bg-white border-2 border-slate-800 rounded-lg font-black text-slate-500">取消</button></div>';
          h += '</div>';
        }
        h += '</div>';
      });
      ro.innerHTML = h;
    }
    var ct = prRegion('controls');
    if (ct) {
      var c = '';
      if (st.myReady !== null && st.myReady !== undefined || st.mySpectator !== null && st.mySpectator !== undefined) {
        c += '<div class="flex gap-2 mb-4">';
        if (st.myReady !== null && st.myReady !== undefined) {
          c += '<button data-pr="ready"' + (st.myReady ? '' : ' data-pr-bob="1"') + ' class="flex-1 py-3 rounded-xl border-[3px] border-slate-800 font-black text-base shadow-[3px_3px_0px_rgba(30,41,59,1)] active:translate-y-[2px] active:shadow-none transition-all" style="background:' + (st.myReady ? ac : '#ffffff') + ';color:' + (st.myReady ? '#0f172a' : '#64748b') + '">' + prLiteSpan('ready', st.myReady ? (st.readyOn || '✅ 已準備') : (st.readyOff || '✋ 準備好了')) + '</button>';
        }
        if (st.mySpectator !== null && st.mySpectator !== undefined) {
          c += '<button data-pr="spectator" class="px-4 py-3 rounded-xl border-[3px] border-slate-800 font-black text-base shadow-[3px_3px_0px_rgba(30,41,59,1)] active:translate-y-[2px] active:shadow-none transition-all ' + (st.mySpectator ? 'bg-sky-300 text-slate-900' : 'bg-white text-slate-500') + '">👁️ 觀戰</button>';
        }
        c += '</div>';
      }
      if (st.start) {
        var sk = st.start.kind === 'danger' ? 'background:#f87171;color:#0f172a' : 'background:' + ac + ';color:#0f172a';
        c += '<button data-pr="start"' + (st.start.disabled ? ' disabled' : '') + ' class="plat-btn-hard w-full py-3.5 border-4 border-slate-800 rounded-xl font-black text-lg shadow-[4px_4px_0px_rgba(30,41,59,1)] disabled:opacity-50 disabled:cursor-not-allowed" style="' + sk + '">' + prLiteSpan('start', st.start.label || '開始') + '</button>';
        if (st.start.note) c += '<p class="text-xs text-slate-500 font-bold text-center mt-2">' + pbEsc(st.start.note) + '</p>';
      } else if (st.waitingText) {
        c += '<p class="font-black text-slate-700 animate-pulse text-center">' + pbEsc(st.waitingText) + '</p>';
      }
      ct.innerHTML = c ? '<div class="max-w-xl mx-auto w-full">' + c + '</div>' : '';
    }
    var dk = prRegion('dock'); if (dk) dk.innerHTML = prDockHtml(ac);
    if (Net.isHost && !Net.tourn && Net.armed.game && Net.inMatch && Net.armed.game !== Net.inMatch) {
      var sb2 = PR.el.querySelector('[data-pr="start"]');
      if (sb2) { sb2.disabled = false; sb2.textContent = '🚀 帶大家去' + (Net.armed.game === 'hashi' ? '數橋' : (Net.armed.game === 'mines' ? '踩地雷' : '數獨')); var np2 = sb2.nextElementSibling; if (np2 && np2.tagName === 'P') np2.style.display = 'none'; }
    }
    renderRoomTabs();
  }
  function prSkeleton() {
    PR.el.innerHTML =
      '<div data-pr-region="tabs" class="mb-3"></div>' +
      '<div class="bg-white border-4 border-slate-800 rounded-3xl shadow-[10px_10px_0px_rgba(30,41,59,1)] p-5 md:p-6 w-full animate-popUpCenter">' +
      '<div class="flex items-center justify-between gap-2 mb-4">' +
      '<h2 data-pr-region="title" class="text-2xl md:text-3xl font-black text-slate-800 tracking-widest">🎮 遊戲大廳</h2>' +
      '<div class="flex items-center gap-2 shrink-0">' +
      '<span class="font-black text-sm text-slate-500">房間代碼 <span data-pr-region="code" class="bg-slate-800 text-white font-mono px-2 py-0.5 rounded-md tracking-widest"></span></span>' +
      '<button data-pr="refresh" data-pr-region="refresh" class="text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-1 rounded border border-slate-400 font-bold shadow-sm transition-colors" style="display:none">🔄 重整名單</button>' +
      '</div></div>' +
      '<div data-pr-region="tourn" style="display:none" class="mb-2"></div>' +
      '<div data-pr-slot="settings"></div>' +
      '<div class="font-black text-slate-700 text-sm mb-1.5 text-left">玩家名單</div>' +
      '<div data-pr-region="roster" class="mb-4 flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1"></div>' +
      '<div data-pr-region="dock" class="flex justify-center mt-4"></div>' +
      '<button data-pr="leave" class="w-full mt-4 text-slate-400 font-bold hover:text-slate-800 hover:underline bg-transparent border-none cursor-pointer">離開房間</button>' +
      '</div>' +
      '<div data-pr-region="controls" class="pr-actionbar"></div>';
    PR.el.style.paddingBottom = '150px'; // 懸浮列的高度留白：捲到底時 dock/離開房間不被遮住
    PR.slot = PR.el.querySelector('[data-pr-slot="settings"]');
  }
  function prClick(e) {
    var tb = e.target && e.target.closest ? e.target.closest('[data-rtab]') : null;
    if (tb && PR.el.contains(tb)) { if (window.__PLAT_ROOMTAB) window.__PLAT_ROOMTAB('tab', tb.getAttribute('data-rtab')); return; }
    var t = e.target && e.target.closest ? e.target.closest('[data-pr]') : null;
    if (!t || !PR.el.contains(t)) return;
    var k = t.getAttribute('data-pr');
    if (k === 'dock-chat' && window.PlatDock) window.PlatDock.toggleChat();
    else if (k === 'dock-video' && window.PlatDock) window.PlatDock.toggleVideo();
    else if (k === 'dock-mic' && window.PlatDock) window.PlatDock.toggleMic();
    else if (k === 'dock-speaker' && window.PlatDock) window.PlatDock.toggleSpeaker();
    else if (k === 'player-click' || k === 'player-toggle') prAct(k, t.getAttribute('data-key'));
    else if (k === 'start' && tryTransportStart()) { /* 已改道：帶大家去選定的遊戲 */ }
    else prAct(k);
  }
  // ===== PlatCount：三款共用數字滾輪（v1.53.0 物理感規格）=====
  // 只滾變動位數、個位先滾（每位 stagger 40ms）、可中斷 retarget（CSS transition 自當前位置續行，不排隊不回跳）、
  // 禁止逐幀 lerp 數字本體；prefers-reduced-motion 直接換字。單位（% 等）由 suffix 獨立承載、不跟滾。
  window.PlatCount = (function () {
    var reduced = false;
    try { reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}
    function buildSlots(h) {
      h.el.innerHTML = '';
      h.digits = [];
      var str = String(h.value);
      for (var i = 0; i < str.length; i++) {
        var d = document.createElement('span'); d.className = 'pc-digit'; d.setAttribute('aria-hidden', 'true');
        var strip = document.createElement('span'); strip.className = 'pc-strip';
        for (var n = 0; n <= 9; n++) { var c = document.createElement('span'); c.textContent = String(n); strip.appendChild(c); }
        strip.style.transform = 'translateY(-' + str[i] + 'em)';
        d.appendChild(strip); h.el.appendChild(d); h.digits.push(strip);
      }
      if (h.suffix) { var u = document.createElement('span'); u.className = 'pc-unit'; u.setAttribute('aria-hidden', 'true'); u.textContent = h.suffix; h.el.appendChild(u); }
      h.el.setAttribute('aria-label', String(h.value) + (h.suffix || ''));
    }
    function set(h, v) {
      if (!h) return;
      v = Math.max(0, Math.round(v));
      h.el.setAttribute('aria-label', String(v) + (h.suffix || ''));
      if (reduced) { h.value = v; h.el.textContent = String(v) + (h.suffix || ''); h.digits = null; return; }
      var str = String(v), os = String(h.value);
      if (!h.digits || str.length !== os.length) { h.value = v; buildSlots(h); return; }
      h.value = v;
      for (var i = 0; i < str.length; i++) {
        if (str[i] === os[i]) continue;
        var strip = h.digits[i];
        strip.style.transitionDelay = ((str.length - 1 - i) * 40) + 'ms'; // 個位先滾、往高位依序錯開
        strip.style.transform = 'translateY(-' + str[i] + 'em)';
      }
    }
    return {
      mount: function (el, opts) {
        opts = opts || {};
        var h = { el: el, value: (typeof opts.value === 'number') ? opts.value : 0, suffix: opts.suffix || '', digits: null };
        el.classList.add('plat-count');
        if (reduced) { el.textContent = String(h.value) + h.suffix; return h; }
        buildSlots(h);
        return h;
      },
      set: set,
      _reduced: function () { return reduced; }
    };
  })();
  // PlatLite：小計數的 Roll-lite 換字（新字 spring 彈入、舊字直接讓位）；值沒變不重播
  window.PlatLite = function (el, v) {
    if (!el) return;
    var str = String(v);
    if (el.textContent === str) return;
    el.textContent = str;
    try { el.classList.remove('plat-lite-in'); void el.offsetWidth; el.classList.add('plat-lite-in'); } catch (e) {}
  };
  // platCountify：把容器內 [data-pc] 接上滾輪；data-pc-key 跨重渲染記住前值（standings 表格每局重畫也能續滾）
  var pcPrevByKey = {};
  function platCountify(root) {
    if (!root || !root.querySelectorAll || !window.PlatCount) return;
    var els = root.querySelectorAll('[data-pc]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], v = parseInt(el.getAttribute('data-pc'), 10) || 0, key = el.getAttribute('data-pc-key') || '';
      var prev = (key && typeof pcPrevByKey[key] === 'number') ? pcPrevByKey[key] : v;
      var h = window.PlatCount.mount(el, { value: prev });
      if (key) pcPrevByKey[key] = v;
      if (prev !== v) (function (hh, vv) { setTimeout(function () { window.PlatCount.set(hh, vv); }, 30); })(h, v);
    }
  }

  // ===== PlatCountdown：兩款共用倒數 overlay（同一套邏輯，不寫兩遍）=====
  window.PlatCountdown = (function () {
    var el = null, numEl = null;
    function ensure() {
      if (el) return;
      el = document.createElement('div');
      el.id = 'plat-countdown';
      el.style.cssText = 'position:fixed;inset:0;z-index:300;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)';
      numEl = document.createElement('div');
      numEl.style.cssText = 'font-size:11rem;line-height:1;font-weight:900;color:#ef4444;text-shadow:6px 6px 0 #fff,-6px -6px 0 #fff,6px -6px 0 #fff,-6px 6px 0 #fff;filter:drop-shadow(0 0 30px rgba(255,0,0,.8));font-family:inherit';
      el.appendChild(numEl);
      document.body.appendChild(el);
    }
    return {
      show: function (v) { ensure(); el.style.display = 'flex'; numEl.textContent = v; numEl.style.animation = ''; numEl.classList.remove('plat-count-roll'); void numEl.offsetWidth; numEl.classList.add('plat-count-roll'); }, // v1.53.0：Roll 換位（下滾入＋spring 落定）後接呼吸脈衝
      hide: function () { if (el) el.style.display = 'none'; },
      _visible: function () { return !!(el && el.style.display === 'flex'); }
    };
  })();

  // ---------- 共用結算畫面 PlatResults（數獨/數橋大亂鬥共用同一框架；遊戲只餵 spec：條目/判定/按鈕） ----------
  var PR2 = { spec: null, json: '' };
  function pr2El() {
    var el = document.getElementById('plat-results');
    if (!el) {
      el = document.createElement('div');
      el.id = 'plat-results';
      el.style.cssText = 'position:fixed;inset:0;z-index:850;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.45);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);padding:16px';
      document.body.appendChild(el);
      el.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('[data-pres]') : null;
        if (b && !b.disabled && PR2.spec && PR2.spec.onAction) { try { PR2.spec.onAction(b.getAttribute('data-pres')); } catch (err) {} }
      });
    }
    return el;
  }
  // 殼元件退場（v1.54.0，E 批）：關閉先 150ms 淡出、動畫完才真正隱藏，治 pop-out；顯示前 platFadeInReset 取消進行中的退場。
  function platFadeOut(el, done) {
    if (!el) { if (done) done(); return; }
    if (el.style.display === 'none' || el.style.display === '') { if (done) done(); return; }
    el.style.transition = 'opacity 150ms var(--plat-ease-travel)';
    el.style.opacity = '0'; el.style.pointerEvents = 'none';
    if (el._fadeT) clearTimeout(el._fadeT);
    el._fadeT = setTimeout(function () { el._fadeT = null; el.style.display = 'none'; el.style.opacity = ''; el.style.transition = ''; el.style.pointerEvents = ''; if (done) done(); }, 160);
  }
  function platFadeInReset(el) {
    if (!el) return;
    if (el._fadeT) { clearTimeout(el._fadeT); el._fadeT = null; }
    el.style.opacity = ''; el.style.transition = ''; el.style.pointerEvents = '';
  }
  // 小框 Popover 通則（v1.55.0，P2）：開＝scale .96→1＋淡入、transform-origin 對齊觸發邊、尺寸第一幀即定版
  //（三處的內容都是開啟前就排好的靜態內容，不在動畫途中改尺寸）；關＝淡出＋微縮回（150ms）完成才 display:none。
  // x=true 給本體帶 translateX(-50%) 置中的元素（plat-speak／聊天面板本體），走合併置中位移的 -x keyframes、不跳位。
  function platPopOpen(el, origin, displayVal, x) {
    if (!el) return;
    if (el._popT) { clearTimeout(el._popT); el._popT = null; }
    el._popDisplay = displayVal || el._popDisplay || 'block';
    el.style.display = el._popDisplay;
    if (origin) el.style.transformOrigin = origin;
    var inCls = x ? 'plat-pop-in-x' : 'plat-pop-in', outCls = x ? 'plat-pop-out-x' : 'plat-pop-out';
    el.classList.remove(outCls); el.classList.remove(inCls); void el.offsetWidth; el.classList.add(inCls);
    if (el._popInT) clearTimeout(el._popInT);
    el._popInT = setTimeout(function () { el._popInT = null; el.classList.remove(inCls); }, 230); // 動畫結束卸下 class，不留 fill 的 transform 影響後續排版
  }
  function platPopClose(el, done, x) {
    if (!el) { if (done) done(); return; }
    if (el.style.display === 'none') { if (done) done(); return; }
    var inCls = x ? 'plat-pop-in-x' : 'plat-pop-in', outCls = x ? 'plat-pop-out-x' : 'plat-pop-out';
    if (el._popInT) { clearTimeout(el._popInT); el._popInT = null; }
    el.classList.remove(inCls); el.classList.add(outCls);
    if (el._popT) clearTimeout(el._popT);
    el._popT = setTimeout(function () { el._popT = null; el.style.display = 'none'; el.classList.remove(outCls); if (done) done(); }, 160);
  }
  function speakShow() { platPopOpen($('plat-speak'), '50% 0', 'flex', true); }
  function speakHide() { platPopClose($('plat-speak'), null, true); }
  function pr2Render() {
    var el = pr2El(); var s = PR2.spec;
    if (!s) { el.style.display = 'none'; el.innerHTML = ''; return; }
    platFadeInReset(el);
    var ac = s.accent || '#ffcc00';
    var medals = ['🥇', '🥈', '🥉'];
    var h = '<div class="bg-white rounded-2xl p-6 md:p-8 border-4 border-slate-800 shadow-[8px_8px_0px_rgba(30,41,59,1)] text-center animate-popUpCenter" style="min-width:300px;max-width:28rem;width:100%;max-height:92vh;overflow-y:auto">';
    h += '<div style="font-size:2.6rem;line-height:1.1">🏆</div>';
    h += '<h2 class="text-2xl md:text-3xl font-black text-slate-800 mb-4">' + pbEsc(s.title || '大亂鬥結果') + '</h2>';
    (s.entries || []).forEach(function (e, i) {
      var medal = medals[i] || ((i + 1) + '.');
      var rowStyle = i === 0 ? 'background:' + ac + '2e;border-color:#1e293b' : 'background:#f8fafc;border-color:#cbd5e1';
      var stripe = e.color === 'rainbow' ? '' : 'background:' + platSafeColor(e.color);
      h += '<div class="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl text-left" style="border-width:3px;border-style:solid;' + rowStyle + '">'
        + '<span class="shrink-0 text-center" style="font-size:1.4rem;width:2rem">' + medal + '</span>'
        + '<span class="shrink-0 rounded-full' + (e.color === 'rainbow' ? ' plat-rainbow-anim' : '') + '" style="width:4px;align-self:stretch;' + stripe + '"></span>'
        + '<span class="font-black text-slate-800 flex-1 truncate">' + pbEsc(e.name || '玩家') + (e.isMe ? '(你)' : '') + (e.isHost ? ' 👑' : '') + '</span>'
        + '<span class="font-mono font-black text-slate-700 shrink-0" style="font-size:.85rem">' + pbEsc(e.right || '') + '</span></div>';
    });
    if (s.waitingText) h += '<p class="font-black text-slate-500 animate-pulse my-2">⏳ ' + pbEsc(s.waitingText) + '</p>';
    if (s.verdict) h += '<p class="text-emerald-600 font-black text-lg my-2">' + pbEsc(s.verdict) + '</p>';
    if (s.stars != null) {
      h += '<div class="flex justify-center gap-2 my-3">';
      for (var si = 0; si < 3; si++) h += '<span style="font-size:2.2rem;line-height:1' + (si < s.stars ? '' : ';opacity:.2;filter:grayscale(1)') + '">⭐</span>';
      h += '</div>';
    }
    if (s.buttons && s.buttons.length) {
      h += '<div class="flex justify-center gap-2 mt-4 flex-wrap">';
      s.buttons.forEach(function (b) {
        var st = b.kind === 'primary' ? 'background:' + ac + ';color:#0f172a' : (b.kind === 'danger' ? 'background:#f87171;color:#0f172a' : 'background:#ffffff;color:#1e293b');
        h += '<button data-pres="' + pbEsc(b.id) + '"' + (b.disabled ? ' disabled' : '') + ' class="px-4 py-3 border-4 border-slate-800 font-black rounded-xl shadow-[4px_4px_0px_rgba(30,41,59,1)] hover:translate-y-[2px] transition-all disabled:opacity-40" style="' + st + '">' + pbEsc(b.label) + '</button>';
      });
      h += '</div>';
    }
    if (s.note) h += '<p class="text-xs font-bold text-slate-400 mt-3">' + pbEsc(s.note) + '</p>';
    h += '</div>';
    el.innerHTML = h;
    el.style.display = 'flex';
  }
  window.PlatResults = {
    show: function (spec) {
      var j = '';
      try { j = JSON.stringify(spec, function (k, v) { return k === 'onAction' ? undefined : v; }); } catch (e) {}
      if (j && j === PR2.json && PR2.spec) { PR2.spec.onAction = spec.onAction; return; }
      PR2.json = j; PR2.spec = spec; pr2Render();
    },
    hide: function () { if (!PR2.spec && !PR2.json) return; platFadeOut(pr2El(), function () { PR2.spec = null; PR2.json = ''; pr2Render(); }); },
    _visible: function () { return !!PR2.spec; }
  };

  // ---------- 每日一題月曆（PlatCalendar）：三款遊戲共用同一份實作（v1.16 統一） ----------
  // cfg: { accent:'#ffcc00', records:{ 'YYYY-MM-DD': … }, selected:'YYYY-MM-DD', onPick:function(ds) }
  // 規格（使用者定案）：固定 42 格、完成日以主題色亮起＋✓、今天外框、過去未玩可選、未來反灰停用、月份範圍 [2026-01, 本月]、點可玩日立即回呼 onPick
  var PCAL = { el: null, cfg: null, ym: '' };
  function pcalPad(n) { return (n < 10 ? '0' : '') + n; }
  function pcalToday() { var d = new Date(); return d.getFullYear() + '-' + pcalPad(d.getMonth() + 1) + '-' + pcalPad(d.getDate()); }
  function pcalEl() {
    if (!PCAL.el) {
      var el = document.createElement('div');
      el.id = 'plat-calendar';
      el.className = 'fixed inset-0 flex items-center justify-center bg-black/50 p-4';
      el.style.zIndex = '9990'; el.style.display = 'none';
      el.addEventListener('click', function (e) {
        if (e.target === el) { window.PlatCalendar.hide(); return; }
        var b = e.target && e.target.closest ? e.target.closest('[data-pcal]') : null;
        if (!b || b.disabled) return;
        var act = b.getAttribute('data-pcal');
        if (act === 'close') window.PlatCalendar.hide();
        else if (act === 'prev' || act === 'next') {
          var cy = parseInt(PCAL.ym.slice(0, 4), 10), cm = parseInt(PCAL.ym.slice(5, 7), 10) - 1 + (act === 'next' ? 1 : -1);
          var d = new Date(cy, cm, 1);
          PCAL.ym = d.getFullYear() + '-' + pcalPad(d.getMonth() + 1);
          pcalRender();
        } else if (act === 'day') {
          var ds = b.getAttribute('data-ds');
          var cfg = PCAL.cfg;
          window.PlatCalendar.hide();
          if (cfg && cfg.onPick) cfg.onPick(ds);
        }
      });
      document.body.appendChild(el);
      PCAL.el = el;
    }
    return PCAL.el;
  }
  function pcalRender() {
    var cfg = PCAL.cfg; if (!cfg) return;
    var el = pcalEl();
    var today = pcalToday(), todayYM = today.slice(0, 7);
    var ym = PCAL.ym < '2026-01' ? '2026-01' : (PCAL.ym > todayYM ? todayYM : PCAL.ym);
    PCAL.ym = ym;
    var cy = parseInt(ym.slice(0, 4), 10), cm = parseInt(ym.slice(5, 7), 10) - 1;
    var firstDow = new Date(cy, cm, 1).getDay();
    var daysInMonth = new Date(cy, cm + 1, 0).getDate();
    var rec = cfg.records || {};
    var cells = '';
    var i;
    for (i = 0; i < firstDow; i++) cells += '<div class="h-11"></div>';
    for (var day = 1; day <= daysInMonth; day++) {
      var ds = ym + '-' + pcalPad(day);
      var future = ds > today, done = !!rec[ds], isToday = ds === today, picked = ds === cfg.selected;
      var cls = 'relative h-11 rounded-lg font-black text-sm flex items-center justify-center border-2 ';
      if (future) cls += 'bg-slate-100 text-slate-300 border-transparent cursor-not-allowed';
      else if (done) cls += 'bg-[' + cfg.accent + '] text-slate-900 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-none';
      else if (isToday) cls += 'bg-white text-slate-800 border-slate-800 ring-2 ring-inset ring-slate-800 active:translate-y-0.5';
      else if (picked) cls += 'bg-sky-100 text-slate-800 border-sky-500 active:translate-y-0.5';
      else cls += 'bg-white text-slate-600 border-slate-200 active:translate-y-0.5';
      cells += '<button data-pcal="day" data-ds="' + ds + '"' + (future ? ' disabled' : '') + ' class="' + cls + '">' + day +
        (done ? '<span class="absolute top-0 right-1 text-[9px]">✓</span>' : '') +
        (isToday && !done ? '<span class="absolute bottom-0 right-1 text-[8px] text-slate-400">今天</span>' : '') + '</button>';
    }
    var total = firstDow + daysInMonth;
    for (i = total; i < 42; i++) cells += '<div class="h-11"></div>';
    var navBtn = 'w-9 h-9 bg-white border-2 border-slate-800 rounded-lg font-black text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] disabled:opacity-30 active:translate-y-0.5 active:shadow-none';
    el.innerHTML =
      '<div class="bg-white border-4 border-slate-800 rounded-2xl shadow-[8px_8px_0px_rgba(30,41,59,1)] w-full max-w-sm p-5">' +
        '<div class="flex items-center justify-between mb-3">' +
          '<button data-pcal="prev" ' + (ym <= '2026-01' ? 'disabled' : '') + ' class="' + navBtn + '">◀</button>' +
          '<div class="font-black text-xl text-slate-800">📅 ' + cy + ' 年 ' + (cm + 1) + ' 月</div>' +
          '<button data-pcal="next" ' + (ym >= todayYM ? 'disabled' : '') + ' class="' + navBtn + '">▶</button>' +
        '</div>' +
        '<div class="grid grid-cols-7 gap-1 mb-1">' + ['日', '一', '二', '三', '四', '五', '六'].map(function (w) { return '<div class="text-center font-black text-xs text-slate-400 py-1">' + w + '</div>'; }).join('') + '</div>' +
        '<div class="grid grid-cols-7 gap-1">' + cells + '</div>' +
        '<div class="flex items-center justify-between mt-4">' +
          '<span class="text-xs font-bold text-slate-500"><span class="inline-block w-3 h-3 rounded-sm bg-[' + cfg.accent + '] border border-slate-800 align-middle mr-1"></span>亮燈＝已完成・灰色＝還沒到</span>' +
          '<button data-pcal="close" class="px-4 py-2 bg-white border-2 border-slate-800 rounded-lg font-black text-sm text-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-none">關閉</button>' +
        '</div>' +
      '</div>';
  }
  window.PlatCalendar = {
    show: function (cfg) { PCAL.cfg = cfg || {}; PCAL.ym = pcalToday().slice(0, 7); pcalRender(); var el = pcalEl(); platFadeInReset(el); el.style.display = 'flex'; },
    hide: function () { platFadeOut(PCAL.el, function () { PCAL.cfg = null; }); },
    _visible: function () { return !!(PCAL.el && PCAL.el.style.display === 'flex'); }
  };

  // ---------- 五戰小局結算頒獎台（PlatPodium）：前三名上山字台、本局分數動畫加進總分、未得名滾下台 ----------
  var POD = { timer: null, tick: null };
  function podEl() {
    var el = document.getElementById('plat-podium');
    if (!el) {
      el = document.createElement('div'); el.id = 'plat-podium';
      el.style.cssText = 'position:fixed;inset:0;z-index:880;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.45);backdrop-filter:blur(2px);padding:16px;';
      el.addEventListener('click', function () { podHide(); });
      document.body.appendChild(el);
    }
    return el;
  }
  function podHide() {
    var el = document.getElementById('plat-podium'); if (el) platFadeOut(el);
    if (POD.timer) { clearTimeout(POD.timer); POD.timer = null; }
    if (POD.tick) { clearInterval(POD.tick); POD.tick = null; }
  }
  function podColorOf(t, uid, name) {
    var en = (typeof tournEntrant === 'function') ? tournEntrant(uid) : null;
    if (en && en.color) return en.color;
    return '#94a3b8';
  }
  function podShow(entry, t) {
    if (!entry || !entry.placements || !entry.placements.length) return;
    POD.shownAt = Date.now();
    var el = podEl(); platFadeInReset(el);
    var pls = entry.placements.slice().sort(function (a, b) { return a.rank - b.rank; });
    var totals = t.totals || {}, wins = t.wins || {};
    var rows = pls.map(function (pl) {
      var after = totals[pl.uid] || 0;
      return { uid: pl.uid, name: pl.name, rank: pl.rank, pts: pl.pts, after: after, before: after - pl.pts, wins: wins[pl.uid] || 0, color: podColorOf(t, pl.uid, pl.name), finished: pl.finished, progress: pl.progress };
    });
    var byTotal = rows.slice().sort(function (a, b) { return (b.after - a.after) || (b.wins - a.wins); });
    var top3 = rows.filter(function (r) { return r.rank <= 3; });
    var rest = rows.filter(function (r) { return r.rank > 3; });
    var medal = { 1: '🥇', 2: '🥈', 3: '🥉' };
    var blockH = { 1: 96, 2: 66, 3: 48 };
    var blockBg = { 1: '#fcd34d', 2: '#e2e8f0', 3: '#fed7aa' };
    var dropDelay = { 1: 14, 2: 8, 3: 3 }; // v1.53.0：以 --plat-stagger(60ms) 的倍數表達（≈0.84/0.48/0.18s，節奏同舊版）
    function chipHtml(r, big) {
      var bg = r.color === 'rainbow' ? '' : r.color;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;max-width:96px">' +
        (r.rank === 1 ? '<div style="font-size:20px;line-height:1">👑</div>' : '') +
        '<span' + (r.color === 'rainbow' ? ' class="plat-rainbow-anim"' : '') + ' style="width:' + (big ? 34 : 26) + 'px;height:' + (big ? 34 : 26) + 'px;border-radius:9999px;display:inline-block;border:3px solid #1e293b;background:' + bg + '"></span>' +
        '<span style="font-weight:900;color:#1e293b;font-size:13px;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + pbEsc(r.name) + '</span></div>';
    }
    function colHtml(r) {
      return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;animation:podDrop .55s cubic-bezier(.2,1.6,.4,1) calc(var(--plat-stagger) * ' + dropDelay[r.rank] + ') both">' +
        chipHtml(r, r.rank === 1) +
        '<div style="width:88px;height:' + blockH[r.rank] + 'px;background:' + blockBg[r.rank] + ';border:3px solid #1e293b;border-bottom:none;border-radius:10px 10px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:6px;font-weight:900;font-size:22px;color:#1e293b">' + medal[r.rank] + '</div></div>';
    }
    var stageOrder = [];
    var byRank = {}; top3.forEach(function (r) { byRank[r.rank] = r; });
    if (byRank[2]) stageOrder.push(byRank[2]);
    if (byRank[1]) stageOrder.push(byRank[1]);
    if (byRank[3]) stageOrder.push(byRank[3]);
    var h = '<div style="background:#fff;border:4px solid #1e293b;border-radius:24px;box-shadow:10px 10px 0 rgba(30,41,59,1);padding:20px 18px 14px;width:100%;max-width:430px;text-align:center;animation:podIn .3s ease-out both;max-height:92vh;overflow-y:auto">';
    h += '<div style="font-weight:900;font-size:22px;color:#1e293b">🏆 第 ' + entry.round + ' 局結果</div>';
    h += '<div style="font-weight:900;font-size:13px;color:#64748b;margin-bottom:6px">' + tournGameLabel(entry.game) + '</div>';
    h += '<div style="display:flex;align-items:flex-end;justify-content:center;gap:6px;border-bottom:4px solid #1e293b;padding:0 4px">' + stageOrder.map(colHtml).join('') + '</div>';
    if (rest.length) {
      h += '<div style="display:flex;justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap">' + rest.map(function (r, i) {
        return '<span style="animation:podRoll .9s ease-in ' + (1.15 + i * 0.14) + 's both;display:inline-flex">' + chipHtml(r, false) + '</span>';
      }).join('') + '</div>';
      h += '<div style="font-size:11px;font-weight:900;color:#94a3b8;margin-top:2px">未進前三 · 滾下台啦</div>';
    }
    h += '<div style="margin-top:14px;display:flex;flex-direction:column;gap:5px;text-align:left">';
    byTotal.forEach(function (r) {
      var bg2 = r.color === 'rainbow' ? '' : r.color;
      h += '<div style="display:flex;align-items:center;gap:8px;background:#f8fafc;border:2px solid #1e293b;border-radius:12px;padding:5px 10px;font-weight:900;color:#1e293b;font-size:14px">' +
        '<span' + (r.color === 'rainbow' ? ' class="plat-rainbow-anim"' : '') + ' style="width:14px;height:14px;border-radius:9999px;display:inline-block;border:2px solid #1e293b;background:' + bg2 + ';flex-shrink:0"></span>' +
        '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + pbEsc(r.name) + (r.wins ? ' <span style="color:#d97706;font-size:12px">👑×' + r.wins + '</span>' : '') + '</span>' +
        '<span style="margin-left:auto;font-size:12px;color:#94a3b8">第 ' + r.rank + ' 名</span>' +
        '<span class="pod-plus" style="color:#059669;font-size:13px;opacity:0">+' + r.pts + '</span>' +
        '<span class="pod-score" data-from="' + r.before + '" data-to="' + r.after + '" style="font-family:monospace;font-size:17px;min-width:34px;text-align:right">' + r.before + '</span></div>';
    });
    h += '</div>';
    h += '<div style="margin-top:10px;font-size:11px;font-weight:900;color:#94a3b8">點任意處跳過</div>';
    h += '</div>';
    el.innerHTML = h;
    el.style.display = 'flex';
    // 分數動畫：+N 浮現 + 總分 0.5s 後開始滾動累加（1.15 秒）
    var plus = el.querySelectorAll('.pod-plus');
    setTimeout(function () { plus.forEach(function (s) { s.style.animation = 'podPlus 1.2s ease-out both'; }); }, 450);
    // v1.53.0：分數改走 PlatCount 位數滾輪（只滾變動位數、個位先滾），取代舊逐幀 lerp；+N 浮現後 0.5s 起滾
    var scores = el.querySelectorAll('.pod-score');
    if (POD.tick) { clearInterval(POD.tick); POD.tick = null; }
    if (POD._pcT) clearTimeout(POD._pcT);
    POD._pcT = setTimeout(function () {
      scores.forEach(function (sp2) {
        var f = parseInt(sp2.getAttribute('data-from'), 10) || 0, to = parseInt(sp2.getAttribute('data-to'), 10) || 0;
        var hh = window.PlatCount.mount(sp2, { value: f });
        window.PlatCount.set(hh, to);
      });
    }, 500);
    if (POD.timer) clearTimeout(POD.timer);
    POD.timer = setTimeout(podHide, 5600);
  }
  window.PlatPodium = { show: podShow, hide: podHide, _visible: function () { var el = document.getElementById('plat-podium'); return !!el && el.style.display === 'flex'; } };

  window.PlatRoom = {
    attach: function (el, cfg) {
      if (!el) return;
      if (PR.el && PR.el !== el) window.PlatRoom.detach(PR.el);
      PR.el = el; PR.cfg = cfg || {}; PR.lastJson = null;
      el.removeEventListener('click', prClick);
      el.addEventListener('click', prClick);
      prSkeleton();
      if (!PR.unsub && window.PlatDock) PR.unsub = window.PlatDock.subscribe(function () { var dk = prRegion('dock'); if (dk && PR.state) dk.innerHTML = prDockHtml((PR.cfg && PR.cfg.accent) || '#ffcc00'); });
      prRenderRegions();
      renderRoomTabs();
    },
    update: function (state) {
      if (!state) return;
      var j = null;
      try { j = JSON.stringify(state); } catch (e) {}
      if (j && j === PR.lastJson && PR.state) { PR.state = state; return; }
      PR.lastJson = j; PR.state = state;
      prRenderRegions();
    },
    detach: function (el) {
      if (!PR.el || (el && el !== PR.el)) return;
      rescueTournNodes();
      PR.el.removeEventListener('click', prClick);
      PR.el.innerHTML = '';
      PR.el = null; PR.cfg = null; PR.state = null; PR.lastJson = null; PR.slot = null;
      if (PR.unsub) { PR.unsub(); PR.unsub = null; }
    },
    getSlot: function () { return PR.slot; },
    isAttached: function () { return !!PR.el; },
    _elConnected: function () { return !!(PR.el && PR.el.isConnected); }
  };

  function nameOf(pid) {
    var p = Net.roster.find(function (x) { return x.pid === pid; });
    return p ? (p.name || '玩家') : '玩家';
  }
  function renderVideos() {
    var wrap = $('plat-videos'); if (!wrap) return;
    var hasRemote = Object.keys(Net.remoteStreams).length > 0;
    if (!Net.videoOn && !hasRemote) { wrap.style.display = 'none'; wrap.innerHTML = ''; updateDock(); return; }
    wrap.style.display = 'block'; wrap.innerHTML = '';
    var vidIdx = 0;
    if (Net.videoOn && Net.localStream) {
      wrap.appendChild(makeCircle('你' + (Net.micMuted ? ' 🔇' : ' 🎤'), Net.localStream, true, Net.me.color, 'self', vidIdx++));
    }
    Object.keys(Net.remoteStreams).forEach(function (pid) {
      var nm = nameOf(pid) + (Net.remoteMic[pid] === false ? ' 🎤' : '');
      wrap.appendChild(makeCircle(nm, Net.remoteStreams[pid], false, null, pid, vidIdx++));
    });
    updateDock();
  }
  // 視訊頭像位置：每位玩家在本機自己拖曳決定（不與其他玩家同步），存在 localStorage
  var vidPosCache = null;
  function vidPosMap() {
    if (vidPosCache) return vidPosCache;
    try { vidPosCache = JSON.parse(storeGet('plat_vpos') || '{}') || {}; } catch (e) { vidPosCache = {}; }
    return vidPosCache;
  }
  function applyVidPos(d, key, idx) {
    var p = vidPosMap()[key];
    var W = window.innerWidth || 360, H = window.innerHeight || 640;
    if (p && typeof p.fx === 'number' && typeof p.fy === 'number') {
      d.style.left = Math.max(0, Math.min(Math.max(1, W - 60), p.fx * Math.max(1, W - 60))) + 'px';
      d.style.top = Math.max(0, Math.min(Math.max(1, H - 84), p.fy * Math.max(1, H - 84))) + 'px';
    } else {
      d.style.right = (8 + idx * 68) + 'px';
      d.style.bottom = 'calc(96px + env(safe-area-inset-bottom, 0px))';
    }
    attachVidDrag(d, key);
  }
  function attachVidDrag(d, key) {
    d.addEventListener('pointerdown', function (e) {
      var r = d.getBoundingClientRect();
      var sx = e.clientX, sy = e.clientY, ox = r.left, oy = r.top, moved = false;
      try { d.setPointerCapture(e.pointerId); } catch (err) {}
      d.style.right = ''; d.style.bottom = ''; d.style.left = ox + 'px'; d.style.top = oy + 'px';
      function mv(ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        var W = window.innerWidth || 360, H = window.innerHeight || 640;
        d.style.left = Math.max(0, Math.min(Math.max(1, W - 60), ox + dx)) + 'px';
        d.style.top = Math.max(0, Math.min(Math.max(1, H - 84), oy + dy)) + 'px';
      }
      function up() {
        d.removeEventListener('pointermove', mv);
        d.removeEventListener('pointerup', up);
        d.removeEventListener('pointercancel', up);
        if (moved) {
          var W = window.innerWidth || 360, H = window.innerHeight || 640;
          var m = vidPosMap();
          m[key] = { fx: (parseFloat(d.style.left) || 0) / Math.max(1, W - 60), fy: (parseFloat(d.style.top) || 0) / Math.max(1, H - 84) };
          try { storeSet('plat_vpos', JSON.stringify(m)); } catch (err) {}
        }
      }
      d.addEventListener('pointermove', mv);
      d.addEventListener('pointerup', up);
      d.addEventListener('pointercancel', up);
      e.preventDefault();
    });
  }
  function makeCircle(label, stream, mirror, color, key, idx) {
    var d = document.createElement('div'); d.className = 'plat-vid';
    var c = document.createElement('div'); c.className = 'circ';
    if (stream) {
      var v = document.createElement('video');
      v.autoplay = true; v.playsInline = true; v.srcObject = stream;
      if (mirror) { v.muted = true; v.style.transform = 'scaleX(-1)'; }
      else { v.className = 'plat-remote-video'; v.muted = !Net.speakerOn; }
      c.appendChild(v);
    } else {
      c.textContent = (label || '？').slice(0, 1);
      if (color) c.style.background = (color === 'rainbow') ? '#a855f7' : color;
    }
    var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = label;
    d.appendChild(c); d.appendChild(nm);
    applyVidPos(d, key || label, idx || 0);
    return d;
  }
  function broadcastMic() {
    platDistribute({ kind: 'mic', pid: Net.myPid, name: Net.me.name, muted: Net.micMuted }, Net.myPid);
  }
  function onRemoteMic(d) {
    if (d.muted) {
      Net.speakPrompted[d.pid] = false;
      if (Net.speakPid === d.pid) { speakHide(); Net.speakPid = null; }
    } else if (!Net.speakerOn && !Net.speakPrompted[d.pid]) {
      Net.speakPrompted[d.pid] = true; Net.speakPid = d.pid;
      $('plat-speak-name').textContent = d.name || nameOf(d.pid);
      speakShow();
    }
  }
  function wireCall(call, pid) {
    Net.calls[pid] = call;
    call.on('stream', function (rs) { Net.remoteStreams[pid] = rs; renderVideos(); });
    call.on('close', function () { delete Net.remoteStreams[pid]; delete Net.calls[pid]; renderVideos(); });
    call.on('error', function () {});
  }
  function handleCall(call) {
    // 來電白名單（B-05）：只接名單內成員的視訊來電——Peer ID 格式可預測，不擋的話知道 ID 的人可直接呼叫建立媒體連線
    var okCall = false; Net.roster.forEach(function (p) { if (p.pid === call.peer) okCall = true; });
    if (!okCall) { try { call.close(); } catch (e) {} status('📵 已拒絕名單外來電：' + call.peer); return; }
    try { call.answer(Net.localStream || undefined); } catch (e) { try { call.answer(); } catch (e2) {} }
    wireCall(call, call.peer);
  }
  function callPeer(pid) {
    if (!Net.peer || !Net.localStream) return;
    try { var call = Net.peer.call(pid, Net.localStream); wireCall(call, pid); } catch (e) {}
  }
  function closeCallOf(pid) {
    if (Net.calls[pid]) { try { Net.calls[pid].close(); } catch (e) {} delete Net.calls[pid]; }
    if (Net.remoteStreams[pid]) { delete Net.remoteStreams[pid]; renderVideos(); }
  }
  function toggleVideo() {
    if (Net.videoOn) { stopVideo(); broadcastMic(); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      sysChat('⚠️ 此環境不支援視訊（需要相機權限），請用瀏覽器開啟線上版');
      if ($('view-lobby').classList.contains('active')) lobbyMsg('⚠️ 此環境不支援視訊，請用瀏覽器開啟線上版');
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(function (stream) {
      Net.localStream = stream; Net.videoOn = true; Net.micMuted = true;
      var at = stream.getAudioTracks()[0]; if (at) at.enabled = false; // 麥克風預設關閉
      renderVideos();
      Net.roster.forEach(function (p) { if (p.pid !== Net.myPid) callPeer(p.pid); });
      broadcastMic();
    }).catch(function (e) {
      var msg = (e && e.name === 'NotAllowedError') ? '⚠️ 相機/麥克風權限被拒絕' : '⚠️ 無法取得相機/麥克風';
      sysChat(msg); lobbyMsg(msg);
    });
  }
  function stopVideo() {
    if (Net.localStream) { try { Net.localStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} }
    Net.localStream = null; Net.videoOn = false; Net.micMuted = true;
    for (var pid in Net.calls) { try { Net.calls[pid].close(); } catch (e) {} }
    Net.calls = {}; Net.remoteStreams = {};
    renderVideos();
  }
  function toggleMic() {
    if (!Net.localStream) return;
    var at = Net.localStream.getAudioTracks()[0]; if (!at) return;
    at.enabled = !at.enabled; Net.micMuted = !at.enabled;
    updateDock(); renderVideos(); broadcastMic();
  }
  function toggleSpeaker() {
    Net.speakerOn = !Net.speakerOn;
    document.querySelectorAll('.plat-remote-video').forEach(function (el) { try { el.muted = !Net.speakerOn; } catch (e) {} });
    if (Net.speakerOn) { speakHide(); Net.speakPid = null; }
    updateDock();
  }

  // ---------- Peer shim ----------
  function VirtualConn(realConn, vp, peerLabel) {
    this._real = realConn; this._vp = vp; this.peer = peerLabel;
    this._cbs = {}; this._closed = false; this.uid = undefined; this._dq = [];
    this.connectionId = realConn.connectionId || ('vc-' + realConn.peer);
  }
  Object.defineProperty(VirtualConn.prototype, 'open', { get: function () { return !this._closed && !(this._vp && this._vp._destroyed) && !!this._real.open; } });
  VirtualConn.prototype.on = function (ev, cb) {
    (this._cbs[ev] = this._cbs[ev] || []).push(cb);
    if (ev === 'open') {
      var s = this;
      if (this.open) { setTimeout(function () { if (!s._closed) cb(); }, 0); }
      else if (this._real && this._real.on) {
        // 實體連線還在談判（真機 WebRTC 要 0.5–3 秒、連線在開局當下重建時更久）：註冊當下未 open 不代表永遠不 open，
        // 必須在實體連線真正 open 時補發，否則遊戲層的 open 回呼（數獨來賓靠它送 JOIN）永遠遺失、雙邊卡死（2026-10-31 大亂鬥開局卡死案）
        var fired = false;
        var fire = function () { if (fired || s._closed) return; fired = true; cb(); };
        this._real.on('open', fire);
        setTimeout(function () { if (s.open) fire(); }, 0); // 補註冊與 open 之間的競態
      }
    }
    if (ev === 'data' && this._dq.length) { var q = this._dq; this._dq = []; var s2 = this; setTimeout(function () { q.forEach(function (m) { s2._deliverData(m); }); }, 0); }
    return this;
  };
  VirtualConn.prototype._deliverData = function (d) {
    if (this._closed) return;
    var l = this._cbs['data'];
    if (l && l.length) this._fire('data', d);
    else { this._dq.push(d); if (this._dq.length > 100) this._dq.shift(); }
  };
  VirtualConn.prototype.send = function (d) { if (this._closed || (this._vp && this._vp._destroyed)) return; tournSniff(Net.myPid, d); var out = d; if (this._vp && this._vp.__game && d && typeof d === 'object') out = { __pg: this._vp.__game, __pd: d }; try { this._real.send(out); } catch (e) {} };
  VirtualConn.prototype.close = function () { this._closed = true; }; // 共用連線：不關實體連線
  VirtualConn.prototype._fire = function (ev, arg) {
    var l = this._cbs[ev] || [];
    for (var i = 0; i < l.length; i++) { try { l[i](arg); } catch (e) { console.warn('[plat] game conn handler error (' + ev + ')', e); } } // 不再全靜默：遊戲 handler 丟例外至少留 console 紀錄可查
  };
  function VirtualPeer(id) {
    this.id = id || Net.myPid;
    this.__game = window.__PLAT_CREATING_GAME || Net.inMatch || null; // 這個 peer 屬於哪款遊戲（寄件戳記用）
    this._cbs = {}; this._wrappers = {}; this._delivered = {};
    this._destroyed = false; this.disconnected = false; this.connections = {};
    Net.gamePeer = this;
    var self = this;
    setTimeout(function () {
      if (self._destroyed) return;
      self._fire('open', self.id);
      self._deliverAll();
    }, 0);
  }
  VirtualPeer.prototype.on = function (ev, cb) {
    (this._cbs[ev] = this._cbs[ev] || []).push(cb);
    if (ev === 'connection') { var s = this; setTimeout(function () { s._deliverAll(); }, 0); }
    return this;
  };
  VirtualPeer.prototype._fire = function (ev, arg) {
    var l = this._cbs[ev] || [];
    for (var i = 0; i < l.length; i++) { try { l[i](arg); } catch (e) { console.warn('[plat] game peer handler error (' + ev + ')', e); } }
  };
  VirtualPeer.prototype.wrapperFor = function (realConn, peerLabel) {
    var key = realConn.peer;
    var w = this._wrappers[key];
    if (!w) { w = this._wrappers[key] = new VirtualConn(realConn, this, peerLabel || realConn.peer); }
    else if (w._real !== realConn) { w._real = realConn; w._closed = false; } // 同 pid 重連換了新實體連線：重新綁定，否則遊戲層 send 會一直送進已死的舊連線（收得到、送不出）
    return w;
  };
  VirtualPeer.prototype._deliverAll = function () {
    if (this._destroyed) return;
    for (var pid in Net.conns) this._deliver(Net.conns[pid]);
    if (Net._dq) for (var pid2 in Net._dq) {
      var rc = Net.conns[pid2], qq = Net._dq[pid2];
      if (rc && qq && qq.length) { var w = this.wrapperFor(rc); Net._dq[pid2] = []; var vp2 = this; qq.forEach(function (m) { if (m && typeof m === 'object' && m.__pg) { if (vp2.__game && m.__pg !== vp2.__game) return; m = m.__pd; } w._deliverData(m); }); }
    }
  };
  VirtualPeer.prototype._deliver = function (realConn) {
    if (this._destroyed) return;
    var cbs = this._cbs['connection'] || [];
    if (!cbs.length) return;
    var key = realConn.peer;
    if (this._delivered[key]) return;
    this._delivered[key] = true;
    var w = this.wrapperFor(realConn, realConn.peer);
    cbs.forEach(function (cb) { try { cb(w); } catch (e) {} });
  };
  VirtualPeer.prototype._notifyClose = function (realConn) {
    var w = this._wrappers[realConn.peer];
    if (w && !w._closed) { w._closed = true; w._fire('close'); }
  };
  VirtualPeer.prototype.connect = function (remoteId) {
    var real = null, pid;
    for (pid in Net.conns) { real = Net.conns[pid]; break; }
    if (!real && Net.peer && Net.hostPid) {
      real = Net.peer.connect(Net.hostPid);
      Net.conns[Net.hostPid] = real; wireConn(real);
    }
    return this.wrapperFor(real, remoteId);
  };
  VirtualPeer.prototype.call = function () { // 平台模式視訊由殼接管
    return { on: function () {}, close: function () {}, answer: function () {} };
  };
  VirtualPeer.prototype.destroy = function () {
    this._destroyed = true;
    if (Net.gamePeer === this) Net.gamePeer = null;
    this._fire('close');
  };
  VirtualPeer.prototype.disconnect = function () {};
  VirtualPeer.prototype.reconnect = function () {};

  function PlatPeer(id) {
    if (Net.active) return new VirtualPeer(id);
    return new RealPeer(id);
  }
  window.Peer = PlatPeer;

  // ---------- 初始化 UI 綁定 ----------
  function init() {
    var nameInp = $('lob-name');
    if (nameInp) nameInp.value = '';
    slotName = ''; $('slot-display').textContent = '🎰';
    var savedColor = storeGet('plat_color');
    if (savedColor) Net.me.color = savedColor;
    var codeInp = $('lob-code');
    if (codeInp) codeInp.value = storeGet('plat_last_code') || '';
    renderColors();
    var pvEl = $('plat-ver'); if (pvEl) pvEl.textContent = 'v' + PLAT_VERSION;
    $('lob-go-create').onclick = function () { Net.lobMode = 'create'; $('lob-joinrow').style.display = 'none'; lobbyMsg(''); showStep('nick'); };
    $('lob-go-join').onclick = function () { Net.lobMode = 'join'; $('lob-joinrow').style.display = 'block'; lobbyMsg(''); showStep('nick'); };
    var rjBtn = $('lob-rejoin');
    if (rjBtn) { refreshRejoin(); rjBtn.onclick = doRejoin; }
    $('lob-back').onclick = function () { lobbyMsg(''); showStep('entry'); };
    $('slot-spin').onclick = function () { spinSlot(); };
    var csb = $('lob-color-spin'); if (csb) csb.onclick = function () { onColorButton(); };
    nameInp.addEventListener('input', function () { slotName = nameInp.value; $('slot-display').textContent = nameInp.value || '🎰'; });
    $('lob-confirm').onclick = function () {
      if (colorSpinning) return; // 拉霸進行中擋手動連點：否則會先建一次房、拉霸結束的回呼再補點一次，產生兩個 peer（完成回呼是在 colorSpinning 清除後才觸發，不受此守衛影響）
      var name = (nameInp.value || '').replace(/[<>&"']/g, '').trim().slice(0, 12);
      if (!name) {
        if (slotTimer) return;
        lobbyMsg('🎰 名字空白，幫你拉霸選一個…');
        spinSlot(function () { $('lob-confirm').click(); });
        return;
      }
      Net.me.name = name; storeSet('plat_name', name);
      var joinCode = null;
      if (Net.lobMode === 'join') {
        joinCode = ($('lob-code').value || '').trim();
        if (joinCode.length !== 4) { lobbyMsg('⚠️ 請輸入 4 位數房號'); return; }
      }
      if (!Net.colorPicked && !colorSpinning) { // 代表色跟暱稱一樣：進房前沒決定就自動拉霸（自己按過拉霸選色就用那個）
        lobbyMsg('🎰 代表色也幫你拉霸決定…');
        spinColor(function () { $('lob-confirm').click(); });
        return;
      }
      if (Net.lobMode === 'join') { storeSet('plat_last_code', joinCode); joinRoom(); }
      else createRoom();
    };
    var tStartBtn = $('t-start'); if (tStartBtn) tStartBtn.onclick = tournCreate;
    $('plat-chat-close').onclick = function (e) { e.stopPropagation(); closeChat(); };
    $('plat-chat-min').onclick = function (e) {
      e.stopPropagation();
      Net.chatMin = !Net.chatMin;
      if (!Net.chatMin) Net.unread = 0;
      renderUnread();
      $('plat-chat-body').style.display = Net.chatMin ? 'none' : 'flex';
      $('plat-chat-min').textContent = Net.chatMin ? '🔼' : '🔽';
    };
    $('plat-chat-head').onclick = function () { $('plat-chat-min').click(); };
    $('plat-chat-send').onclick = sendChat;
    // 表情符號鍵盤（v1.49.0，聊天室朋友建議）：😊 開合面板，點表情插入輸入框游標處（可連點多個）
    var PLAT_EMOJIS = ['😀','😁','😂','🤣','😊','😍','😘','😎','🤩','😜','😝','🙂','😉','😌','😴','🤔','😱','😭','😡','🥳','👍','👎','👏','🙏','💪','🙌','👋','✌️','🤞','❤️','💔','🔥','✨','🎉','🏆','💯','🎮','💣','🚩','🌉','🧩','🍀','⭐','☀️','🌈','🍕','🍔','🍟','☕','🍺','⚽','🎵','💡','⏰','🚀','🐶','🐱','🐼','🦄','👻','🤖','👑'];
    var emojiPanel = $('plat-chat-emojis');
    if (emojiPanel && !$('plat-chat-emoji').dataset.bound) {
      $('plat-chat-emoji').dataset.bound = '1';
      PLAT_EMOJIS.forEach(function (em) { var b = document.createElement('button'); b.type = 'button'; b.className = 'plat-emoji-btn'; b.textContent = em; b.onclick = function () { var inp = $('plat-chat-input'); var st = (inp.selectionStart != null) ? inp.selectionStart : inp.value.length; var en = (inp.selectionEnd != null) ? inp.selectionEnd : inp.value.length; if (inp.value.length + em.length > 200) return; inp.value = inp.value.slice(0, st) + em + inp.value.slice(en); try { inp.setSelectionRange(st + em.length, st + em.length); } catch (e2) {} inp.focus(); }; emojiPanel.appendChild(b); });
      $('plat-chat-emoji').onclick = function (e) { e.stopPropagation(); if (emojiPanel.style.display === 'none' || !emojiPanel.style.display) platPopOpen(emojiPanel, '0% 100%', 'grid'); else platPopClose(emojiPanel); }; // v1.55.0：經 popover helper（origin 對齊左下 😊 觸發鈕）
    }
    $('plat-chat-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') sendChat(); });
    $('plat-speak-yes').onclick = function () { if (!Net.speakerOn) toggleSpeaker(); speakHide(); Net.speakPid = null; };
    $('plat-speak-no').onclick = function () { speakHide(); Net.speakPid = null; };
    // 邀請連結複製鈕（v1.51.0）
    var invCopy = $('hub-invite-copy');
    if (invCopy) invCopy.onclick = function () {
      var inp = $('hub-invite-link'); if (!inp || !inp.value) return;
      function done() { if (window.__PLAT_TOAST) window.__PLAT_TOAST('🔗 邀請連結已複製，傳給朋友吧！'); }
      function fallback() { try { inp.select(); document.execCommand('copy'); } catch (e) {} done(); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(inp.value).then(done, fallback);
      else fallback();
    };
    // 邀請連結入口（v1.51.0）：開站帶 ?room=NNNN → 比照一鍵重連 doRejoin 的快速路徑；
    // 有存暱稱就直接進房（2 步），沒有存暱稱先到暱稱步並預填房號。用完即從網址清掉參數，避免重整重觸。
    (function consumeInvite() {
      var code = null;
      try {
        var m = /[?&]room=(\d{4})(?:&|$)/.exec(location.search || '');
        if (m) { code = m[1]; history.replaceState(null, '', location.pathname); }
      } catch (e) {}
      if (!code || Net.active) return;
      window.PLAT_show('lobby');
      var savedName = storeGet('plat_name');
      if (!savedName) {
        Net.lobMode = 'join'; $('lob-joinrow').style.display = 'block'; lobbyMsg(''); showStep('nick');
        $('lob-code').value = code;
        return;
      }
      Net.me.name = savedName;
      var savedColor = storeGet('plat_color'); if (savedColor) Net.me.color = savedColor;
      $('lob-code').value = code;
      joinRoom();
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
