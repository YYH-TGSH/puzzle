const base = require('/home/hatch/workspace/boottest/cdp/measure-lib.js');
(async () => {
  const { ev, done } = await base.start(500, 900, 'file:///home/hatch/workspace/platform-site/index.html');
  const PROBE = `(function(){
    var view = document.querySelector('.plat-view.active'); var iw = window.innerWidth;
    function info(el) { var r = el.getBoundingClientRect(); var cs = getComputedStyle(el);
      return { tag: el.tagName, cls: String(el.className).slice(0, 110), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), pos: cs.position, transform: cs.transform, ml: cs.marginLeft, mr: cs.marginRight, pl: cs.paddingLeft, width: cs.width, maxW: cs.maxWidth, disp: cs.display, jc: cs.justifyContent, ai: cs.alignItems }; }
    var cards = [];
    view.querySelectorAll('div').forEach(function(el){ var c = String(el.className); if (c.includes('border-4') || c.includes('shadow-[10px')) cards.push(el); });
    var out = { iw: iw, cards: cards.slice(0, 3).map(info) };
    if (cards[0]) { out.parent = info(cards[0].parentElement); out.grand = info(cards[0].parentElement.parentElement); out.mountChain = []; var e = cards[0]; for (var d = 0; d < 5 && e; d++) { out.mountChain.push(e.tagName + '.' + String(e.className).slice(0, 40) + '#' + (e.id || '')); e = e.parentElement; } }
    return out;
  })()`;
  for (const g of ['sudoku', 'hashi', 'mines', 'akari']) {
    await ev(`window.PLAT_show('${g}'); 1`); await base.sleep(3000);
    console.log('CARD2 ' + g + ' ' + JSON.stringify(await ev(PROBE)));
  }
  done(); process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
