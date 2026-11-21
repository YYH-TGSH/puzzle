// 全套回歸的單一清單（稽核 H-03：「測試全綠」從此只有這個定義）
// 用法：node run-all.js [子字串過濾]  —— 逐支「依序」執行（不可平行：jsdom 雙頁測試平行跑會 CPU 爭用假失敗）
// 退出碼：全綠 0、任一支失敗 1。每支的完整輸出留在 boottest/run-all-logs/<name>.log
const { spawn } = require('child_process'); // 2026-11-21 甲案後半：改 spawn 串流（spawnSync 全緩衝會把輸出悶到套件結束）
const fs = require('fs');
const path = require('path');

// 正式回歸清單（發版前必跑）。不在清單的：test-hashi-strip（已退休）、test-v1xx/test-xver（特定版本探針）、
// test-lastone2dbg（除錯版）、repro-*（一次性重現腳本；僅 staleprog/rematch 兩支列入常規）、
// test-turnopts（2026-11-21 退休：metered TURN 斷言與零成本政策衝突）
const SUITES = [
  ['test-hub.js', {}],
  ['test-roomui.js', {}],
  ['test-site.js', {}],
  ['test-wheel.js', {}],
  ['test-color.js', { GAME: 'hashi' }],
  ['test-color.js', { GAME: 'sudoku' }],
  ['test-color.js', { GAME: 'mines' }],
  ['test-autogod.js', {}],
  ['test-brawl-start.js', {}],
  ['test-startgate.js', {}],
  ['test-jointab.js', {}],
  ['test-leave.js', {}],
  ['test-leaveflow.js', {}],
  ['test-migrate-room.js', {}],
  ['test-daily-cal.js', {}],
  ['test-guestfirst.js', {}],
  ['test-hashifirst.js', {}],
  ['repro-staleprog.js', {}],
  ['repro-sudoku-rematch.js', {}],
  ['test-hashi-items.js', {}],
  ['test-sudoku-items.js', {}],
  ['test-sudoku-wintime.js', {}],
  ['test-prob-weights.js', {}],
  ['test-lastone.js', {}],
  ['test-lastone2.js', {}],
  ['test-islandgift.js', {}],
  ['test-islandgift-strict.js', {}],
  ['test-inputfix.js', {}],
  ['test-mines-solo.js', {}],
  ['test-mines-tap.js', {}],
  ['test-mines-save.js', {}],
  ['test-settings-modal.js', {}],
  ['test-tutdemo.js', {}],
  ['test-roomtoast.js', {}],
  ['test-tournready.js', {}],
  ['test-tournvis.js', {}],
  ['test-mines-doodle.js', {}],
  ['test-chat-emoji.js', {}],
  ['test-mines-3bv.js', {}],
  ['test-invite.js', {}],
  ['test-motion.js', {}],
  ['test-msgfx.js', {}],
  ['test-rematch-bar.js', {}],
  ['test-tap-drift.js', {}],
  ['test-round2.js', {}],
  ['test-round3.js', {}],
  ['test-round4.js', {}],
  ['test-round6.js', {}],
  ['test-round6b.js', {}],
  ['test-classjoin.js', {}],
  ['test-classjoin2.js', {}],
  ['test-chatdup.js', {}],
  ['test-chatpad.js', {}],
  ['test-solo-pick.js', {}],
  ['test-mines-mp.js', {}],
  ['test-mines-tourn.js', {}],
  ['test-mines-items.js', {}],
  ['test-mines-takeover.js', {}],
  ['test-mines-zoomcustom.js', {}],
  ['test-resume.js', {}],
  ['test-layout-width.js', {}], // 真引擎排版寬度（CDP/Chromium；jsdom 量不到溢出，v1.72.2 起常設）
  ['test-akari-dragscroll.js', {}], // 美術燈塗叉/捲動分流（v1.72.3 項3）
  ['test-genchip-race.js', {}], // PlatGenerating tick 競態決定性重現（v1.72.4）
  ['test-akari-undodraft.js', {}], // 美術燈 undo/redo＋草稿＋防農場（v1.73.0）
  ['test-tourn-cards.js', {}], // 錦標賽卡片式選關（v1.74.0）
  ['test-akari-coop.js', {}], // 美術燈合作模式（v1.74.0）
  ['test-akari-coopresume.js', {}], // 美術燈合作回座（v1.74.0）
  ['test-sudoku-undoredo.js', {}], // 數獨 undo/redo＋防農場（v1.75.0）
  ['test-hashi-undoredo.js', {}], // 數橋 undo/redo＋防農場（v1.75.0）
];

const filter = process.argv[2] || '';
const logDir = path.join(__dirname, 'run-all-logs');
fs.mkdirSync(logDir, { recursive: true });
let pass = 0, fail = 0; const failed = [];
function runOne(file, env) { // 串流執行：子行程輸出即時寫入 log 檔並同步印到主控台，不再整支悶住
  return new Promise((resolve) => {
    const child = spawn('node', [path.join(__dirname, file)], { env: Object.assign({}, process.env, env) });
    let out = '';
    const killer = setTimeout(() => { try { child.kill('SIGKILL'); } catch (e) {} }, 12 * 60 * 1000);
    child.stdout.on('data', (d) => { const s = d.toString(); out += s; process.stdout.write(s); });
    child.stderr.on('data', (d) => { const s = d.toString(); out += s; process.stderr.write(s); });
    child.on('close', (status) => { clearTimeout(killer); resolve({ status, out }); });
    child.on('error', () => { clearTimeout(killer); resolve({ status: 2, out }); });
  });
}
(async () => {
for (const [file, env] of SUITES) {
  const tag = file.replace('.js', '') + (env.GAME ? ':' + env.GAME : '');
  if (filter && !tag.includes(filter)) continue;
  const t0 = Date.now();
  console.log('--- RUN ' + tag + ' ---');
  const r = await runOne(file, env);
  const out = r.out;
  fs.writeFileSync(path.join(logDir, tag.replace(':', '_') + '.log'), out);
  const bad = r.status !== 0 || /[1-9]\d* failed/.test(out) || /RESULT: \d+ pass, [1-9]/.test(out);
  const secs = Math.round((Date.now() - t0) / 1000);
  if (bad) { fail++; failed.push(tag); console.log('✗ ' + tag + ' (' + secs + 's) — log: run-all-logs/' + tag.replace(':', '_') + '.log'); }
  else { pass++; console.log('✓ ' + tag + ' (' + secs + 's)'); }
}
console.log('\n=== run-all: ' + pass + ' suites passed, ' + fail + ' failed' + (failed.length ? ' → ' + failed.join(', ') : '') + ' ===');
process.exit(fail ? 1 : 0);
})();
