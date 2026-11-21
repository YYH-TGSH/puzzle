// 數獨適應模式幾何量測 v3：PlatBar 選單狀態感知驅動（開選單→讀 glyph→點 cycle）
const base = require('/home/hatch/workspace/boottest/cdp/frame-lib.js');
const H = parseInt(process.argv[2] || '844');
(async () => {
  const { ev, done } = await base.startFrame(390, 'x', H);
  const clickSel = async (sel) => ev(`(function(){ var b = document.querySelector('${sel}'); if (b) { b.click(); return 1; } return 0; })()`);
  await ev(`window.PLAT_show('sudoku'); 1`); await base.sleep(3000);
  await clickSel('.plat-view.active [data-ph="solo"]'); await base.sleep(1200);
  await clickSel('#plat-setup [data-pse-card]'); await base.sleep(400);
  await clickSel('#plat-setup [data-pse="start"]'); await base.sleep(4500);
  const ensureMenu = async () => { const has = await ev(`!!document.querySelector('[data-pb="zoom-cycle"]')`); if (!has) { await clickSel('[data-pb="zoom-toggle"]'); await base.sleep(500); } };
  const readGlyph = async () => { await ensureMenu(); return ev(`(function(){ var b = document.querySelector('[data-pb="zoom-cycle"]'); return b ? b.textContent.trim() : '?'; })()`); };
  const GEO = `(function(){
    var svg = document.querySelector('#view-sudoku svg');
    var cont = null; document.querySelectorAll('#view-sudoku div').forEach(function(d){ if (String(d.className).includes('custom-scrollbar')) cont = d; });
    var pbBtn = document.querySelector('[data-pb="zoom-toggle"]'); var pbar = pbBtn; while (pbar && getComputedStyle(pbar).position !== 'fixed') pbar = pbar.parentElement;
    function R(el) { if (!el) return null; var r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) }; }
    var cs = cont ? getComputedStyle(cont) : null;
    return { ih: window.innerHeight, svg: R(svg), cont: R(cont), contClientH: cont ? cont.clientHeight : null, padT: cs ? cs.paddingTop : null, padB: cs ? cs.paddingBottom : null, platBar: R(pbar) };
  })()`;
  const seen = [];
  for (let i = 0; i < 5; i++) {
    const glyph = await readGlyph();
    const g = await ev(GEO);
    console.log('FIT H=' + H + ' glyph=' + glyph + ' ' + JSON.stringify(g));
    seen.push(glyph);
    await clickSel('[data-pb="zoom-cycle"]'); await base.sleep(900);
    if (seen.filter(x => x === glyph).length > 1 && i > 1) break;
  }
  done(); process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
