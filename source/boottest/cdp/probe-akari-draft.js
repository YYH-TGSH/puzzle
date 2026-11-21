// 美術燈草稿視覺驗證（v1.73.0）：真燈 vs 草稿燈並排截圖（CDP 真引擎）
const base = require('/home/hatch/workspace/boottest/cdp/frame-lib.js');
const fs = require('fs');
(async () => {
  const { ev, done, sendRaw } = await base.startFrame(390, 'x', 844);
  const clickSel = async (sel) => ev(`(function(){ var b = document.querySelector('${sel}'); if (b) { b.click(); return 1; } return 0; })()`);
  await ev(`window.PLAT_show('akari'); 1`); await base.sleep(3000);
  await clickSel('.plat-view.active [data-ph="solo"]'); await base.sleep(1200);
  await clickSel('#plat-setup [data-pse-card]'); await base.sleep(400);
  await ev(`(function(){ var os = document.querySelectorAll('#plat-setup [data-pse-opt]'); for (var i = 0; i < os.length; i++) if (os[i].textContent.indexOf('7×7') >= 0) { os[i].click(); return 1; } return 0; })()`); await base.sleep(400);
  await clickSel('#plat-setup [data-pse="start"]'); await base.sleep(4000);
  // 放一盞真燈（解答格）
  const placed = await ev(`(function(){ var d = window.__PLAT_HOOKS_akari.debug(); var s = d.puzzle.solution[0]; var el = document.querySelector('button[data-cell="' + s + '"]'); el.click(); return s; })()`);
  await base.sleep(600);
  // 切草稿模式（PlatBar mode-press 一次），在另一個解答格放草稿
  await clickSel('#view-akari [data-pb="mode-press"]'); await base.sleep(600);
  const drafted = await ev(`(function(){ var d = window.__PLAT_HOOKS_akari.debug(); for (var k = 0; k < d.puzzle.solution.length; k++) { var s = d.puzzle.solution[k]; if (d.cells[s] === 0) { var el = document.querySelector('button[data-cell="' + s + '"]'); el.click(); return s; } } return -1; })()`);
  await base.sleep(600);
  const state = await ev(`(function(){ var d = window.__PLAT_HOOKS_akari.debug(); return { mode: d.mode, cells: d.cells, placed: ${'null'} }; })()`).catch(() => null);
  const info = await ev(`(function(){ var d = window.__PLAT_HOOKS_akari.debug(); var out = { mode: d.mode, drafts: [], bulbs: [] }; d.cells.forEach(function(c, i){ if (c === 4) out.drafts.push(i); if (c === 1) out.bulbs.push(i); }); return out; })()`);
  console.log('placed bulb cell:', placed, '| drafted cell:', drafted, '| state:', JSON.stringify(info));
  // 截圖：整個 frame
  await sendRaw('Page.enable');
  const shot = await sendRaw('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/home/hatch/workspace/boottest/logs/akari-draft-visual.png', Buffer.from(shot.data, 'base64'));
  console.log('screenshot saved');
  done(); process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
