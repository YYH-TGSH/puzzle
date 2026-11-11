// test-motion：物理感微互動（v1.53.0）驗收——token/按壓參數斷言、PlatCount 行為、跨fade、進度整合、拖曳零 transition。
const fs = require('fs');
const { JSDOM } = require('jsdom');
const HTML = fs.readFileSync('/home/hatch/workspace/platform/platform-v1-test.html', 'utf8');
const CSS = fs.readFileSync('/home/hatch/workspace/platform/shell.css', 'utf8');
const HASHI = fs.readFileSync('/home/hatch/workspace/hashi-site/js/app.js', 'utf8');
const MOCK = require('./mockpeer.js');
let pass = 0, fail = 0;
function ok(c, label, extra) { if (c) { pass++; console.log('✅ ' + label); } else { fail++; console.log('❌ ' + label + (extra !== undefined ? ' :: ' + extra : '')); } }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(120); } console.log('  ⏱ timeout: ' + label); return null; }

// ---------- 1) token 與按壓參數（靜態斷言） ----------
ok(CSS.includes('--plat-ease-travel: cubic-bezier(0.45, 0, 0.1, 1)'), 'token travel');
ok(CSS.includes('--plat-ease-settle: cubic-bezier(0.25, 0.8, 0.25, 1)'), 'token settle');
ok(CSS.includes('--plat-ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275)'), 'token spring（既有回彈曲線升格）');
ok(CSS.includes('--plat-press-in: 80ms'), 'token press-in 80ms（70–90 區間）');
ok(CSS.includes('--plat-press-out: 220ms'), 'token press-out 220ms（200–240 區間）');
ok(CSS.includes('--plat-stagger: 60ms'), 'token stagger 60ms');
const whereRule = CSS.slice(CSS.indexOf(':where(button):not(:disabled) {'), CSS.indexOf(':where(button):not(:disabled):active'));
ok(whereRule.includes('var(--plat-press-out)') && whereRule.includes('var(--plat-ease-spring)'), '全域鈕 out = press-out + spring');
const activeRule = CSS.slice(CSS.indexOf(':where(button):not(:disabled):active'), CSS.indexOf('@media (prefers-reduced-motion: reduce) { :where(button)'));
ok(activeRule.includes('transition-duration: var(--plat-press-in)') && activeRule.includes('var(--plat-ease-press-in)'), '全域鈕 in = press-in 專用時長＋曲線（非對稱）');
const hardRule = CSS.slice(CSS.indexOf('.plat-btn-hard {'), CSS.indexOf('@media (prefers-reduced-motion: reduce) { .plat-btn-hard'));
ok(hardRule.includes('box-shadow var(--plat-press-out) var(--plat-ease-spring)'), '硬陰影鈕：shadow 列入 transition（同步壓縮、非瞬跳）');
const hardActive = CSS.slice(CSS.indexOf('.plat-btn-hard:not(:disabled):active'), CSS.indexOf('@media (hover: hover)'));
ok(hardActive.includes('box-shadow: 0 0 0') && hardActive.includes('translate(var(--ph-press)'), '硬陰影鈕按下：位移與影子同到 0');
const pbarRule = CSS.slice(CSS.indexOf('.plat-pbar {'), CSS.indexOf('@media (prefers-reduced-motion: reduce) { .plat-pbar'));
ok(pbarRule.includes('width 400ms var(--plat-ease-travel)'), '進度條：width 400ms travel（與滾字同窗）');

// ---------- 拖曳零 transition（專門斷言）：預覽線元素與其渲染段不含 transition ----------
const dpIdx = HASHI.indexOf('ref={dragPreviewLineRef}');
const dpSeg = HASHI.slice(Math.max(0, dpIdx - 400), dpIdx + 200);
ok(dpIdx > 0 && !/transition/.test(dpSeg), '數橋拖曳預覽線：零 transition（直接跟手）', dpIdx < 0 ? 'marker missing' : '');

// ---------- 2) PlatCount 行為（jsdom） ----------
function loadPage(extraBeforeParse, url) {
  const html = HTML.replace(/<script[^>]+src="[^"]*peerjs[^"]*"[^>]*><\/script>/, () => '<script>' + MOCK.replace(/<\/script/g, '<\\/script') + '</' + 'script>');
  const errors = [];
  const dom = new JSDOM(html, {
    url: url || 'https://localhost/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    beforeParse(window) {
      window.__SHARED_REG__ = {};
      window.addEventListener('error', e => { const m = String(e.message || ''); if (!/scrollTo/.test(m)) errors.push(m); });
      if (extraBeforeParse) extraBeforeParse(window);
    }
  });
  return { dom, window: dom.window, document: dom.window.document, errors, $: id => dom.window.document.getElementById(id) };
}

(async () => {
  const P = loadPage(null);
  const ready = await waitFor(() => P.window.PlatCount && typeof P.window.PLAT_show === 'function', 60000, 'shell boot');
  ok(!!ready, '殼載入完成（含 PlatCount）');

  // 128 → 135：只有十位與個位滾
  const host = P.document.createElement('div'); P.document.body.appendChild(host);
  const h = P.window.PlatCount.mount(host, { value: 128, suffix: '%' });
  let strips = host.querySelectorAll('.pc-strip');
  ok(strips.length === 3, 'PlatCount 128：三位槽建成', strips.length);
  ok(strips[0].style.transform === 'translateY(-1em)' && strips[2].style.transform === 'translateY(-8em)', '初始位數定位正確');
  P.window.PlatCount.set(h, 135);
  strips = host.querySelectorAll('.pc-strip');
  ok(strips[0].style.transform === 'translateY(-1em)', '128→135：百位靜止不動', strips[0].style.transform);
  ok(strips[1].style.transform === 'translateY(-3em)' && strips[2].style.transform === 'translateY(-5em)', '128→135：十位與個位滾到新值');
  ok(strips[2].style.transitionDelay === '0ms' && strips[1].style.transitionDelay === '40ms', '個位先滾（delay 0）、十位次之（40ms）');
  ok(host.querySelector('.pc-unit') && host.querySelector('.pc-unit').textContent === '%', '單位獨立不跟滾');

  // 連續快速 set 五次：不排隊、最終落定正確、中途不回跳舊值
  P.window.PlatCount.set(h, 190);
  P.window.PlatCount.set(h, 101);
  P.window.PlatCount.set(h, 199);
  P.window.PlatCount.set(h, 100);
  P.window.PlatCount.set(h, 135);
  strips = host.querySelectorAll('.pc-strip');
  ok(strips[0].style.transform === 'translateY(-1em)' && strips[1].style.transform === 'translateY(-3em)' && strips[2].style.transform === 'translateY(-5em)', '連續 set 五次後落定 135（retarget 不回跳）');
  // 位數變化（135 → 7）：重建槽、值正確
  P.window.PlatCount.set(h, 7);
  strips = host.querySelectorAll('.pc-strip');
  ok(strips.length === 1 && strips[0].style.transform === 'translateY(-7em)', '位數變化重建槽且值正確');

  // view crossfade：舊畫面先掛淡出、90ms 後才卸載
  P.window.PLAT_show('sudoku');
  const home = P.$('view-home');
  ok(home.classList.contains('plat-view-out') && home.classList.contains('active'), '切換當下：舊畫面淡出中（尚未卸載）');
  ok(P.$('view-sudoku').classList.contains('active'), '切換當下：新畫面已啟用');
  await sleep(220);
  ok(!home.classList.contains('active') && !home.classList.contains('plat-view-out'), '90ms 後舊畫面卸載完成');
  P.window.PLAT_show('home');
  await sleep(50);
  ok(home.classList.contains('active') && !home.classList.contains('plat-view-out'), '切回舊畫面：淡出取消、立即啟用');

  // ---------- 3) 進度整合：地雷單機自己的 % 是滾輪 ----------
  P.window.PLAT_show('mines');
  await waitFor(() => !!P.window.__PLAT_HOOKS_mines, 90000, 'mines hooks');
  await sleep(400);
  const clickBtn = pred => { const b = [...P.document.querySelectorAll('#mines-root button')].find(pred); if (b) { b.click(); return true; } return false; };
  clickBtn(b => b.textContent.includes('單機挑戰')); await sleep(250);
  clickBtn(b => b.textContent.includes('9×9'));
  const cells = await waitFor(() => P.document.querySelectorAll('#mines-root button[data-cell]').length === 81 ? true : null, 30000, 'mines cells');
  ok(!!cells, '地雷單機開局');
  const progDiv = [...P.document.querySelectorAll('#mines-root div')].find(x => (x.textContent.startsWith('進度（3BV）') || x.textContent.startsWith('開格 ')) && x.querySelector('.plat-count'));
  ok(!!progDiv, '自己的進度 % 已接 PlatCount 滾輪', progDiv ? '' : 'no .plat-count in progress div');
  ok(progDiv && progDiv.querySelectorAll('.pc-digit').length >= 1, '進度滾輪槽存在');

  const errs = P.errors.filter(m => !/scrollTo/.test(m));
  ok(errs.length === 0, '全程零頁面錯誤', errs.slice(0, 2).join(' | '));

  // ---------- reduced-motion：直接換字 ----------
  const R = loadPage(w => { w.matchMedia = q => ({ matches: /prefers-reduced-motion/.test(q), media: q, addEventListener() {}, removeEventListener() {} }); });
  const rr = await waitFor(() => R.window.PlatCount && R.window.PlatCount._reduced(), 60000, 'reduced boot');
  ok(!!rr, 'reduced-motion 環境偵測成立');
  if (rr) {
    const host2 = R.document.createElement('div'); R.document.body.appendChild(host2);
    const h2 = R.window.PlatCount.mount(host2, { value: 128, suffix: '%' });
    R.window.PlatCount.set(h2, 135);
    ok(host2.textContent === '135%' && !host2.querySelector('.pc-strip'), 'reduced-motion：直接換字、無滾輪');
  }
  console.log('\nRESULT motion: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(2); });

// ================= v1.54.0 補完批（A/B/C/D/E） =================
try {
  const bp2 = require('path'), bf2 = require('fs');
  const bdir2 = bp2.join(__dirname, '..', 'platform', '.build');
  const comp2 = g => bf2.readFileSync(bp2.join(bdir2, 'plat-' + g + '-compiled.js'), 'utf8');
  const cssOf2 = g => bf2.readFileSync(bp2.join(__dirname, '..', g + '-site', 'css', 'style.css'), 'utf8');
  ['sudoku', 'hashi', 'mines'].forEach(g => {
    const c = comp2(g);
    const n = (c.match(/plat-btn-hard/g) || []).length;
    ok(n > 10, 'A ' + g + ' compiled plat-btn-hard >10', n);
    ok((c.match(/PlatNum/g) || []).length >= 3 && c.indexOf('PlatLite') >= 0, 'B ' + g + ' PlatNum 接入（定義+使用）');
  });
  ok(comp2('mines').indexOf('plat-btn-hard plat-btn-hard-2 px-2 py-1') >= 0, 'A mines hbtn 收編');
  const sc2 = comp2('sudoku'), hc2 = comp2('hashi');
  ok(sc2.indexOf('pressedCellId') >= 0 && sc2.indexOf('sudoku-pressfx') >= 0, 'D 數獨 pressedCellId+pressfx');
  ok(/@keyframes sudokuCellPress/.test(cssOf2('sudoku')) && cssOf2('sudoku').indexOf('sudokuCellPress 70ms') >= 0, 'D 數獨格動畫 70ms');
  ok(hc2.indexOf('hashi-island') >= 0 && cssOf2('hashi').indexOf('.hashi-island:active') >= 0 && cssOf2('hashi').indexOf('scale(0.96)') >= 0 && cssOf2('hashi').indexOf('transform-box: fill-box') >= 0, 'D 數橋島 class+CSS 參數');
  const shellCss2 = bf2.readFileSync(bp2.join(__dirname, '..', 'platform', 'shell.css'), 'utf8');
  ok(['.plat-btn-hard-1', '.plat-btn-hard-2', '.plat-btn-hard-3', '.plat-btn-hard-6'].every(x => shellCss2.indexOf(x) >= 0), 'A 尺寸變體 classes');
  ok(/#plat-bar button \{[^}]*background-color 150ms ease/.test(shellCss2), 'C PlatBar 底色 150ms');
  const shellJs2 = bf2.readFileSync(bp2.join(__dirname, '..', 'platform', 'shell.js'), 'utf8');
  ok((shellJs2.match(/platFadeOut\(/g) || []).length >= 4 && shellJs2.indexOf('function platFadeInReset') >= 0, 'E platFadeOut 定義+多處使用（v1.55 聊天面板改走 popover helper 後門檻 5→4）');
  ok(shellJs2.indexOf("PLAT_VERSION = '1.63.0'") >= 0, 'E 版號 1.63.0');
} catch (e) { ok(false, 'v1.54 靜態斷言例外: ' + e.message); }
