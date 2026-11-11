// PlatAudio 單元測試（v1.64.0；v1.64.2 配方改版）：A 清脆＋華麗版配方參數（triangle/頻率/琶音/和弦墊）、主增益 0.5、六事件×三款接線覆蓋、
// 靜音零建立＋plat_muted 寫入、舊 muted 遷移矩陣（保守合併）、60ms 節流、無手勢不 throw/不建 ctx。
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('✅', m); } else { fail++; console.log('❌', m); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (fn()) return true; } catch (e) {} await sleep(120); } throw new Error('waitFor timeout: ' + label); }

function mockAC(w) {
  w.__AC = { instances: 0, oscs: [], gains: [] };
  class P { constructor() { this.value = 0; this.calls = []; } setValueAtTime(v, t) { this.calls.push(['set', v, t]); this.value = v; } linearRampToValueAtTime(v, t) { this.calls.push(['lin', v, t]); } exponentialRampToValueAtTime(v, t) { this.calls.push(['exp', v, t]); } }
  class O { constructor() { this.type = ''; this.frequency = new P(); this.gainNode = null; } connect(g) { this.gainNode = g; } start(t) { this.started = t; } stop(t) { this.stopped = t; } }
  class G { constructor() { this.gain = new P(); } connect() {} }
  w.AudioContext = class { constructor() { w.__AC.instances++; this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { const o = new O(); w.__AC.oscs.push(o); return o; } createGain() { const g = new G(); w.__AC.gains.push(g); return g; } resume() { this.state = 'running'; return Promise.resolve(); } };
}
function boot(seed) {
  const reg = {};
  return new JSDOM(html, {
    url: 'http://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    beforeParse(w) {
      w.__SHARED_REG__ = reg;
      mockAC(w);
      if (seed) for (const k in seed) { try { w.localStorage.setItem(k, seed[k]); } catch (e) {} }
      w.__VIB = [];
      try { Object.defineProperty(w.navigator, 'vibrate', { value: (p) => { w.__VIB.push(p); return true; }, configurable: true }); } catch (e) {}
      w.addEventListener('error', () => {});
    }
  });
}

(async () => {
  // ===== 主頁：行為測試 =====
  const dom = boot(null);
  const w = dom.window;
  await waitFor(() => w.PlatAudio, 30000, 'PlatAudio');
  const PA = w.PlatAudio;
  // 無手勢：不 throw、不建 ctx
  let threw = false; try { PA.play('place'); } catch (e) { threw = true; }
  ok(!threw && w.__AC.instances === 0, '無手勢 play 靜默丟棄（不 throw、零 ctx 建立）');
  ok(PA.isMuted() === false && w.localStorage.getItem('plat_muted') === '0', '無舊鍵 → 未靜音、plat_muted 落盤 0');
  // 手勢解鎖
  w.document.dispatchEvent(new w.Event('pointerdown'));
  ok(w.__AC.instances === 1, '首次 pointerdown 建立 AudioContext');
  ok(w.__AC.gains.length >= 1 && w.__AC.gains[0].gain.value === 0.5, '主增益 0.5（音量天花板）');
  const oscN = () => w.__AC.oscs.length;
  const last = n => w.__AC.oscs[w.__AC.oscs.length - n];
  // place 配方（v1.64.2 A 清脆：triangle 880Hz 0.07s）
  PA.play('place');
  ok(oscN() === 1, 'place 產生 1 個 oscillator');
  let o = last(1);
  ok(o.type === 'triangle' && o.frequency.calls[0][1] === 880, 'place：triangle 880Hz');
  ok(Math.abs((o.stopped - o.started) - 0.12) < 0.001, 'place：時長 0.07s（+0.05 收尾 pad）');
  ok(o.gainNode && o.gainNode.gain.calls.some(c => c[0] === 'lin' && c[1] === 1), 'place：attack 20ms 線性淡入至 1.0');
  // error / boom（A 家族：triangle 170Hz 0.13s / 低音 140Hz 0.22s）
  PA.play('error'); o = last(1);
  ok(o.type === 'triangle' && o.frequency.calls[0][1] === 170 && Math.abs((o.stopped - o.started) - 0.18) < 0.001, 'error：triangle 170Hz、0.13s');
  PA.play('boom'); o = last(1);
  ok(o.type === 'triangle' && o.frequency.calls[0][1] === 140 && Math.abs((o.stopped - o.started) - 0.27) < 0.001, 'boom：triangle 140Hz、0.22s 低沉一擊');
  // complete 華麗版：523→659→784→1046 四音琶音（間隔 0.07）＋262/330/392 sine 和弦墊 0.75s
  let b = oscN(); PA.play('complete');
  const cs = w.__AC.oscs.slice(b);
  ok(cs.length === 7 && cs.slice(0, 4).map(x => x.frequency.calls[0][1]).join(',') === '523,659,784,1046' && cs.slice(0, 4).every(x => x.type === 'triangle') && Math.abs(cs[1].started - cs[0].started - 0.07) < 0.001, 'complete：523→659→784→1046 triangle 琶音、間隔 0.07s');
  ok(cs.slice(4).map(x => x.frequency.calls[0][1]).join(',') === '262,330,392' && cs.slice(4).every(x => x.type === 'sine') && Math.abs((cs[4].stopped - cs[4].started) - 0.80) < 0.001, 'complete：262/330/392 sine 和弦墊、總長 ≈0.75s');
  // gift 輕版（complete 前兩音 523→659、0.7 倍）
  b = oscN(); PA.play('gift');
  ok(oscN() - b === 2 && last(2).frequency.calls[0][1] === 523 && last(1).frequency.calls[0][1] === 659 && last(2).gainNode.gain.calls.some(c => c[0] === 'lin' && c[1] === 0.7), 'gift：523→659 前兩音、增益 0.7 倍輕版');
  // win 更華麗：六音上行琶音（間隔 0.08）＋0.48s 處 1046/1318/1568 閃耀和弦（1.0s）＋和弦墊
  b = oscN(); PA.play('win');
  const ws = w.__AC.oscs.slice(b);
  ok(ws.length === 12 && ws.slice(0, 6).map(x => x.frequency.calls[0][1]).join(',') === '523,587,659,784,880,1046' && Math.abs(ws[1].started - ws[0].started - 0.08) < 0.001, 'win：523→587→659→784→880→1046 六音琶音、間隔 0.08s');
  ok(ws.slice(6, 9).map(x => x.frequency.calls[0][1]).join(',') === '1046,1318,1568' && Math.abs(ws[6].started - ws[0].started - 0.48) < 0.001 && Math.abs((ws[6].stopped - ws[6].started) - 1.05) < 0.001, 'win：尾段 1046/1318/1568 閃耀和弦、總長 ≈1.5s');
  // 節流：同名 60ms 內只播一次；不同事件不互擋（先等配方段的節流窗過期）
  await sleep(90);
  b = oscN(); PA.play('place'); PA.play('place');
  ok(oscN() - b === 1, '節流：同名事件連發只播一次');
  b = oscN(); PA.play('error');
  ok(oscN() - b === 1, '節流：不同事件不互相節流');
  await sleep(90);
  b = oscN(); PA.play('place');
  ok(oscN() - b === 1, '節流：90ms 後同名可再播');
  // 震動復原（v1.64.1）：舊引擎震型——place 10、error [30,30,30]、complete [50,50,100]、boom 不震
  w.__VIB.length = 0;
  await sleep(90); PA.play('place');
  ok(w.__VIB.length === 1 && w.__VIB[0] === 10, '震動：place → vibrate(10)');
  PA.play('error');
  ok(w.__VIB.length === 2 && JSON.stringify(w.__VIB[1]) === '[30,30,30]', '震動：error → vibrate([30,30,30])');
  PA.play('complete');
  ok(w.__VIB.length === 3 && JSON.stringify(w.__VIB[2]) === '[50,50,100]', '震動：complete → vibrate([50,50,100])（舊 win 震型）');
  PA.play('boom');
  ok(w.__VIB.length === 3, '震動：boom 不震（地雷原本無震動）');
  // 未知事件
  threw = false; try { PA.play('nope'); } catch (e) { threw = true; }
  ok(!threw, '未知事件名不 throw');
  // 靜音：零建立、落盤、toggle
  PA.setMuted(true);
  ok(w.localStorage.getItem('plat_muted') === '1' && PA.isMuted() === true, 'setMuted(true) → plat_muted=1');
  b = oscN(); PA.play('win');
  ok(oscN() - b === 0, '靜音時 play 零 oscillator');
  w.__VIB.length = 0; PA.play('place');
  ok(w.__VIB.length === 0, '靜音時不震動（照舊制閘門）');
  ok(PA.toggleMuted() === false && PA.isMuted() === false, 'toggleMuted 回傳新狀態');
  PA.setMuted(true);
  ok(PA.toggleMuted() === false && w.localStorage.getItem('plat_muted') === '0', 'toggle 後 plat_muted=0');
  dom.window.close();

  // ===== 遷移矩陣（獨立頁、種子 localStorage）=====
  const cases = [
    [{ sudoku_muted: '1' }, true, 'sudoku 曾靜音 → 靜音'],
    [{ hashi_muted: '1' }, true, 'hashi 曾靜音 → 靜音'],
    [{ mines_muted: '1' }, true, 'mines 曾靜音 → 靜音'],
    [{ sudoku_muted: '0', hashi_muted: '0', mines_muted: '0' }, false, '三鍵皆 0 → 不靜音'],
    [{ sudoku_muted: '0', hashi_muted: '1', mines_muted: '0' }, true, '任一為 1 → 靜音（保守合併）'],
    [{ plat_muted: '0', sudoku_muted: '1' }, false, 'plat_muted 已存在 → 以新鍵為準（不被舊鍵覆蓋）'],
    [{ plat_muted: '1', sudoku_muted: '0' }, true, 'plat_muted=1 → 靜音']
  ];
  for (const [seed, want, label] of cases) {
    const d = boot(seed);
    const ww = d.window;
    await waitFor(() => ww.PlatAudio, 30000, 'PlatAudio matrix');
    ok(ww.PlatAudio.isMuted() === want, '遷移矩陣：' + label);
    d.window.close();
  }
  // ===== 事件覆蓋（v1.64.2 覆蓋驗收）：六事件 × 三款、逐款逐事件至少一接線點（讀三款原始碼樹）=====
  // 接線形式含三元式 play(cond ? 'error' : 'place')——以 play(...) 括號內含事件名字串判定。
  const fsx = require('fs');
  const coverage = [
    ['數獨', ['../sudoku-site/js/app.js', '../sudoku-site/js/engine.js'], { place: 1, error: 1, complete: 1, win: 1, gift: 1, boom: 0 }],
    ['數橋', ['../hashi-site/js/app.js'], { place: 1, error: 1, complete: 1, win: 1, gift: 1, boom: 0 }],
    ['踩地雷', ['../mines-site/js/app.js'], { place: 1, error: 1, complete: 1, win: 1, gift: 1, boom: 1 }]
  ];
  for (const [gname, files, expect] of coverage) {
    const src = files.map(f => fsx.readFileSync(__dirname + '/' + f, 'utf8')).join('\n');
    for (const ev of ['place', 'error', 'boom', 'complete', 'gift', 'win']) {
      const n = (src.match(new RegExp("\\.play\\([^)]*'" + ev + "'", 'g')) || []).length;
      if (expect[ev] > 0) ok(n >= 1, `覆蓋：${gname} ${ev} 有接線（${n} 處）`);
      else ok(n === 0, `覆蓋：${gname} 無 ${ev} 事件（N/A、零接線正確）`);
    }
  }
  console.log(`\n=== plataudio: ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
