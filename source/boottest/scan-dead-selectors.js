// 死 selector 掃描（甲案後半）：抽每支回歸套件 querySelector 字面值裡的 #id 與 [data-*] 屬性名，
// 對照現行殼＋四款原始碼語料；語料裡找不到的列「疑似已死」——動態組字串不在此列（僅供人工複核，不自動判死）。
const fs = require('fs');
const path = require('path');
const corpusFiles = [
  '../platform/shell.js', '../platform/shell.html', '../platform/shell.css',
  '../sudoku-site/js/app.js', '../sudoku-site/css/style.css',
  '../hashi-site/js/app.js', '../hashi-site/css/style.css',
  '../mines-site/js/app.js', '../mines-site/css/style.css',
  '../akari-site/js/app.js', '../akari-site/css/style.css',
];
let corpus = '';
for (const f of corpusFiles) { try { corpus += fs.readFileSync(path.join(__dirname, f), 'utf8') + '\n'; } catch (e) {} }
const runAll = fs.readFileSync(path.join(__dirname, 'run-all.js'), 'utf8');
const suiteFiles = [...new Set([...runAll.matchAll(/\['(test-[^']+\.js)'/g)].map(m => m[1]))];
let totalSuspects = 0;
for (const f of suiteFiles) {
  let s; try { s = fs.readFileSync(path.join(__dirname, f), 'utf8'); } catch (e) { continue; }
  const ids = new Set(), attrs = new Set();
  for (const m of s.matchAll(/querySelector(?:All)?\(\s*'([^'$][^']*)'/g)) collect(m[1]);
  for (const m of s.matchAll(/querySelector(?:All)?\(\s*"([^"$][^"]*)"/g)) collect(m[1]);
  function collect(sel) {
    for (const im of sel.matchAll(/#([A-Za-z][\w-]*)/g)) ids.add(im[1]);
    for (const am of sel.matchAll(/\[(data-[\w-]+)/g)) attrs.add(am[1]);
  }
  const deadIds = [...ids].filter(id => !corpus.includes('#' + id) && !corpus.includes("'" + id + "'") && !corpus.includes('"' + id + '"') && !corpus.includes('id=' + id));
  const deadAttrs = [...attrs].filter(a => !corpus.includes(a));
  if (deadIds.length || deadAttrs.length) {
    totalSuspects += deadIds.length + deadAttrs.length;
    console.log(f + ' :: ids疑似死: [' + deadIds.join(', ') + '] attrs疑似死: [' + deadAttrs.join(', ') + ']');
  }
}
console.log('=== scan done: ' + suiteFiles.length + ' suites, ' + totalSuspects + ' suspect tokens ===');
