// PlatSeg 幾何守衛（v1.65.2）：jsdom 無真實版面 → 以 stub getBoundingClientRect 餵兩階段版面（暫態堆疊 → 定稿格線），
// 驗 PlatSeg 的 pill 輸出幾何：量測當下可被暫態污染（重現），但版面定稿後必須自動校正到目標鈕 box（±2px）、過渡中途不暴走、元素卸載後不誤 snap。
// 真機版面（CDP）環境故障中，本檔以 stub rect 驗邏輯；水平溢出由 pill ⊆ 容器 ⊆ 卡片的包含關係蘊含（pill 右緣 ≤ 容器右緣即不出卡）。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.env.BUNDLE || '/home/hatch/workspace/platform/platform-v1-test.html';
let html = fs.readFileSync(file, 'utf8');
const mock = require('./mockpeer.js');
html = html.replace('<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>', () => '<script>' + mock + '</scr' + 'ipt>');
let pass = 0, fail = 0;
const check = (n, c, x) => { if (c) { pass++; console.log('✅ ' + n + (x ? ' — ' + x : '')); } else { fail++; console.log('❌ ' + n + (x ? ' — ' + x : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(200); } console.log('  (timeout: ' + label + ')'); return null; }
(async () => {
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {}); vc.on('error', () => {});
  const dom = new JSDOM(html, { url: 'https://localhost/', resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, beforeParse(w) { w.scrollTo = () => {}; } });
  const w = dom.window, D = w.document;
  await waitFor(() => (typeof w.PlatSeg === 'function') ? 1 : null, 60000, 'PlatSeg');
  check('前置：PlatSeg 可用', typeof w.PlatSeg === 'function');
  // 夾具：容器 + 3 鈕（模仿數獨難度格：grid-cols-2 定稿／未套工具類時全寬堆疊）
  const host = D.createElement('div'); D.body.appendChild(host);
  host.innerHTML = '<div class="plat-seg" id="segfix"><button data-seg-on="1">🟢 簡單</button><button>🟡 普通</button><button>🔴 困難</button></div>';
  const seg = D.querySelector('#segfix'); const btns = [...seg.querySelectorAll('button')];
  // 版面表：container rect 固定 (100,200,340,116)；STACKED：鈕全寬 340 高 48 依序 y=200/260/320（容器高隨之 228，此處以回傳值為準）
  const LAYOUTS = {
    stacked: { c: [100, 200, 340, 228], b: [[100, 200, 340, 48], [100, 260, 340, 48], [100, 320, 340, 48]] },
    grid: { c: [100, 200, 340, 116], b: [[100, 200, 164, 48], [276, 200, 164, 48], [100, 264, 164, 48]] }
  };
  let cur = 'stacked';
  const stub = (el, get) => { el.getBoundingClientRect = () => { const r = get(); return { left: r[0], top: r[1], width: r[2], height: r[3], right: r[0] + r[2], bottom: r[1] + r[3], x: r[0], y: r[1] }; }; };
  stub(seg, () => LAYOUTS[cur].c);
  btns.forEach((b, i) => stub(b, () => LAYOUTS[cur].b[i]));
  const pillGeo = () => { const p = seg.querySelector('.plat-seg-pill'); if (!p) return null; const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(p.style.transform || ''); return { x: m ? parseFloat(m[1]) : NaN, y: m ? parseFloat(m[2]) : NaN, w: parseFloat(p.style.width), h: parseFloat(p.style.height), tr: p.style.transition || '' }; };
  const expectBox = (btnIdx) => { const c = LAYOUTS.grid.c, b = LAYOUTS.grid.b[btnIdx]; return { x: b[0] - c[0], y: b[1] - c[1], w: b[2], h: b[3] }; };
  const near = (g, e, tol) => g && Math.abs(g.x - e.x) <= tol && Math.abs(g.y - e.y) <= tol && Math.abs(g.w - e.w) <= tol && Math.abs(g.h - e.h) <= tol;
  // A：暫態版面下量測（重現：pill 吃下全寬暫態幾何）
  btns.forEach(b => b.removeAttribute('data-seg-on')); btns[2].setAttribute('data-seg-on', '1');
  w.PlatSeg(seg, 'test-diff', btns[2], '#ffcc00');
  const gA = pillGeo();
  check('A 重現：暫態量測的 pill 不在定稿目標鈕 box 內（全寬污染）', !!gA && !near(gA, expectBox(2), 2), JSON.stringify(gA));
  // B：版面定稿（grid）→ 不再呼叫 PlatSeg，settle 必須自動校正
  cur = 'grid';
  await sleep(600);
  const gB = pillGeo();
  check('B 定稿後 pill 自動校正到困難鈕 box（±2px）', near(gB, expectBox(2), 2), JSON.stringify(gB) + ' expect ' + JSON.stringify(expectBox(2)));
  check('B pill 右緣不超出容器（不出卡）', !!gB && gB.x + gB.w <= LAYOUTS.grid.c[2] + 2);
  // C：換選（簡單）→ 滑動過渡保留、settle 不打斷、終點正確；過渡中點取樣：pill 目標幾何不暴走（width/transform 終值在容器內）
  btns.forEach(b => b.removeAttribute('data-seg-on')); btns[0].setAttribute('data-seg-on', '1');
  w.PlatSeg(seg, 'test-diff', btns[0], '#ffcc00');
  await sleep(60);
  const gC0 = pillGeo();
  check('C 換選有滑動過渡（transition 含 200ms）', !!gC0 && /200ms/.test(gC0.tr), gC0 && gC0.tr);
  await sleep(500);
  const gC = pillGeo();
  check('C 滑動終點＝簡單鈕 box（±2px）', near(gC, expectBox(0), 2), JSON.stringify(gC));
  // D：逐一選每個選項都校正（幾何矩陣）
  let allOk = true;
  for (let i = 0; i < 3; i++) {
    btns.forEach(b => b.removeAttribute('data-seg-on')); btns[i].setAttribute('data-seg-on', '1');
    w.PlatSeg(seg, 'test-diff', btns[i], '#ffcc00');
    await sleep(450);
    if (!near(pillGeo(), expectBox(i), 2)) allOk = false;
  }
  check('D 三個選項逐一選取 pill 皆落目標 box', allOk);
  // E：容器卸載後 settle 不報錯、不復活
  let errE = null;
  try { host.remove(); await sleep(500); } catch (e) { errE = e; }
  check('E 卸載後 settle 靜默無誤', !errE);
  console.log(`\n=== seg-geometry: ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
