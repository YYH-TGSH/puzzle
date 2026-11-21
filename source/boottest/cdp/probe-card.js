// 對照四款主畫面「標題卡」元素鏈：class、rect、computed transform/margin/width
const base = require('/home/hatch/workspace/boottest/cdp/measure-lib.js');
(async () => {
  const { ev, done } = await base.start(500, 900, 'file:///home/hatch/workspace/platform-site/index.html');
  const PROBE = `(function(){
    var view = document.querySelector('.plat-view.active');
    var title = null;
    var els = view.querySelectorAll('*');
    for (var i = 0; i < els.length; i++) { if ((els[i].textContent || '').includes('單機挑戰') && els[i].children.length > 0) { title = els[i]; break; } }
    var chain = []; var el = title;
    for (var d = 0; d < 6 && el; d++) { var r = el.getBoundingClientRect(); var cs = getComputedStyle(el);
      chain.push({ tag: el.tagName, cls: String(el.className).slice(0, 90), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), transform: cs.transform, marginLeft: cs.marginLeft, width: cs.width, boxSizing: cs.boxSizing, anim: cs.animationName });
      el = el.parentElement; }
    return chain;
  })()`;
  for (const g of ['sudoku', 'hashi', 'mines', 'akari']) {
    await ev(`window.PLAT_show('${g}'); 1`); await base.sleep(3000);
    console.log('CARD ' + g + ' ' + JSON.stringify(await ev(PROBE)));
  }
  done(); process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
