// 地雷/美術燈適應模式幾何量測：逐模式量盤面 rect vs 容器/PlatBar 頂
const base = require('/home/hatch/workspace/boottest/cdp/frame-lib.js');
const GAME = process.argv[2];
(async () => {
  const { ev, done } = await base.startFrame(390, 'x', 844);
  const clickSel = async (sel) => ev(`(function(){ var b = document.querySelector('${sel}'); if (b) { b.click(); return 1; } return 0; })()`);
  await ev(`window.PLAT_show('${GAME}'); 1`); await base.sleep(3000);
  await clickSel('.plat-view.active [data-ph="solo"]'); await base.sleep(1200);
  if (GAME === 'mines') {
    await ev(`(function(){ var t = null; document.querySelectorAll('#plat-setup button').forEach(function(b){ if (b.textContent.includes('16×16')) t = b; }); if (t) t.click(); return !!t; })()`); await base.sleep(4500);
  } else {
    await clickSel('#plat-setup [data-pse-card]'); await base.sleep(400);
    await ev(`(function(){ var o = document.querySelector('#plat-setup [data-pse-opt="12"]') || document.querySelector('#plat-setup [data-pse-opt]'); if (o) o.click(); return !!o; })()`); await base.sleep(400);
    await clickSel('#plat-setup [data-pse="start"]'); await base.sleep(4500);
  }
  const scope = GAME === 'mines' ? '#view-mines' : '#view-akari';
  const ensureMenu = async () => { const has = await ev(`!!document.querySelector('${scope} [data-pb="zoom-cycle"]') || !!document.querySelector('[data-pb="zoom-cycle"]')`); if (!has) { await clickSel('[data-pb="zoom-toggle"]'); await base.sleep(500); } };
  const GEO = GAME === 'mines' ? `(function(){
    var cont = document.querySelector('#view-mines .mines-board-scroll');
    var board = cont ? cont.querySelector('div') : null;
    var pbBtn = document.querySelector('[data-pb="zoom-toggle"]'); var pbar = pbBtn; while (pbar && getComputedStyle(pbar).position !== 'fixed') pbar = pbar.parentElement;
    var cyc = document.querySelector('[data-pb="zoom-cycle"]');
    function R(el) { if (!el) return null; var r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; }
    return { glyph: cyc ? cyc.textContent.trim() : '(menu)', cont: R(cont), board: R(board), barTop: pbar ? Math.round(pbar.getBoundingClientRect().top) : null, sw: cont ? cont.scrollWidth : null, cw: cont ? cont.clientWidth : null };
  })()` : `(function(){
    var cont = document.querySelector('#view-akari .akari-board-scroll');
    var grid = cont ? cont.querySelector('.inline-grid') : null;
    var pbBtn = document.querySelector('[data-pb="zoom-toggle"]'); var pbar = pbBtn; while (pbar && getComputedStyle(pbar).position !== 'fixed') pbar = pbar.parentElement;
    var cyc = document.querySelector('[data-pb="zoom-cycle"]');
    function R(el) { if (!el) return null; var r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; }
    return { glyph: cyc ? cyc.textContent.trim() : '(menu)', cont: R(cont), board: R(grid), barTop: pbar ? Math.round(pbar.getBoundingClientRect().top) : null };
  })()`;
  for (let i = 0; i < 5; i++) {
    await ensureMenu();
    console.log('FIT2 ' + GAME + ' step' + i + ' ' + JSON.stringify(await ev(GEO)));
    await clickSel('[data-pb="zoom-cycle"]'); await base.sleep(1000);
  }
  done(); process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
