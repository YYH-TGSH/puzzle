# 第 6 項效能量測（D2 歸宿）方法備忘（v1.65.0 出貨後執行、純量測不升版）
① 數獨玩家等待路徑（jsdom、真 bundle）：PLAT_show 進數獨 → 單機選 16 困難/16 普通 → 量「點擊開始 → 盤面格子全數渲染可玩」端到端 ms（N=10，jsdom 慢於真機、只作相對熱點判讀，報告註明）。
② 數橋 L5 端到端：generateUniqueHashi L5 的 ms 分布已由 measure2 genMs 欄位補齊（attempts×solver 實測毫秒）；另在 jsdom 真路徑量一次開局等待對照。
③ bundle：platform-site/index.html 實體大小、gzip 後大小、殼首屏可互動（jsdom DOMContentLoaded→PlatDock 渲染）ms，註明無頭侷限。
④ 大盤互動代理指標：16×16 數獨/20×20 數橋/30×24 自訂地雷（最大盤）開局後 DOM 節點總數、單次操作（填格/架橋/挖格）的 handler 耗時（performance.now 包覆 dispatch）、長任務計數（>50ms 的同步段，以 handler 耗時近似）。
產出：原始數字＋熱點清單回稽核，不附修法。
