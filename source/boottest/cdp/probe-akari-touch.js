// 美術燈項3 真引擎觸控驗證：CDP 真實 touch 事件——(a) 快滑→容器捲動且不塗叉 (b) 慢拖→塗叉
const base = require('/home/hatch/workspace/boottest/cdp/frame-lib.js');
(async () => {
  const { ev, done, sendRaw } = await base.startFrame(390, 'x', 844);
  const clickSel = async (sel) => ev(`(function(){ var b = document.querySelector('${sel}'); if (b) { b.click(); return 1; } return 0; })()`);
  await ev(`window.PLAT_show('akari'); 1`); await base.sleep(3000);
  await clickSel('.plat-view.active [data-ph="solo"]'); await base.sleep(1200);
  await clickSel('#plat-setup [data-pse-card]'); await base.sleep(400);
  await ev(`(function(){ var o = document.querySelector('#plat-setup [data-pse-opt="12"]') || document.querySelector('#plat-setup [data-pse-opt]'); if (o) o.click(); return !!o; })()`); await base.sleep(400);
  await clickSel('#plat-setup [data-pse="start"]'); await base.sleep(4000);
  // 放大到 2 倍讓盤面可捲動：PlatBar 選單 zoom-in ×4
  for (let i = 0; i < 4; i++) { const has = await ev(`!!document.querySelector('[data-pb="zoom-in"]')`); if (!has) { await clickSel('[data-pb="zoom-toggle"]'); await base.sleep(400); } await clickSel('[data-pb="zoom-in"]'); await base.sleep(300); }
  await base.sleep(800);
  const contInfo = await ev(`(function(){ var c = document.querySelector('#view-akari .akari-board-scroll'); var r = c.getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left), sw: c.scrollWidth, cw: c.clientWidth, sl: c.scrollLeft }; })()`);
  console.log('CONT', JSON.stringify(contInfo));
  const crosses = async () => ev(`window.__PLAT_HOOKS_akari.debug().cells.filter(c => c === 2).length`);
  const scrollLeft = async () => ev(`document.querySelector('#view-akari .akari-board-scroll').scrollLeft`);
  const touch = async (type, points) => sendRaw('Input.dispatchTouchEvent', { type, touchPoints: points });
  // (a) 快速橫滑：board 中段 y≈400，x 300→80，5 步快節奏
  const y = contInfo.top + 120;
  await touch('touchStart', [{ x: 300, y, id: 1 }]);
  for (let k = 1; k <= 5; k++) { await touch('touchMove', [{ x: 300 - k * 44, y, id: 1 }]); await base.sleep(16); }
  await touch('touchEnd', []);
  await base.sleep(700);
  console.log('A fast-swipe: scrollLeft', contInfo.sl, '->', await scrollLeft(), 'crosses=', await crosses());
  // (b) 慢速拖曳：按住停留後慢移（每步 40ms、8px）
  const cell0 = await ev(`(function(){ var dbg = window.__PLAT_HOOKS_akari.debug(); var walls = new Set(dbg.puzzle.walls); var W = dbg.puzzle.w; for (var i = 0; i < dbg.cells.length; i++) if (!walls.has(i) && dbg.cells[i] === 0) { var el = document.querySelector('button[data-cell="' + i + '"]'); var r = el.getBoundingClientRect(); if (r.left > 30 && r.right < 360 && r.top > 100 && r.bottom < 700) return { i, cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2) }; } return null; })()`);
  console.log('B start cell', JSON.stringify(cell0));
  await touch('touchStart', [{ x: cell0.cx, y: cell0.cy, id: 2 }]);
  await base.sleep(200);
  for (let k = 1; k <= 14; k++) { await touch('touchMove', [{ x: cell0.cx + k * 8, y: cell0.cy, id: 2 }]); await base.sleep(40); }
  await touch('touchEnd', []);
  await base.sleep(500);
  console.log('B slow-drag: crosses=', await crosses());
  done(); process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
