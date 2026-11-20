// build 用：以兩款遊戲各自的 Babel 版本預編譯 app 程式碼
// 路徑一律相對本檔位置解析（稽核 H-02：原寫死 /home/hatch 絕對路徑＋/tmp 中間檔，換機器/CI 即無法建置、平行建置會互覆）
// Babel 本體已 vendored 在 ./tools/：babel6.min.js = babel-standalone 6（數橋）、babel7.min.js = @babel/standalone 7（數獨/踩地雷）
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const WS = path.join(HERE, '..');
const OUTDIR = path.join(HERE, '.build');
fs.mkdirSync(OUTDIR, { recursive: true });
const B6 = require(path.join(HERE, 'tools', 'babel6.min.js'));
const B7 = require(path.join(HERE, 'tools', 'babel7.min.js'));
function compile(srcPath, outPath, babel, presets, rootId, gameName, createPattern) {
  let code = fs.readFileSync(srcPath, 'utf8');
  code = code.replace("document.getElementById('root')", "document.getElementById('" + rootId + "')");
  if (!code.includes(rootId)) throw new Error('root replace failed: ' + srcPath);
  let out = babel.transform(code, { presets, filename: 'app.jsx' }).code;
  if (!out.includes(createPattern)) throw new Error('create pattern not found for ' + gameName + ': ' + createPattern);
  out = out.replace(createPattern, 'React.createElement(window.PlatBoundary, null, ' + createPattern + ')');
  fs.writeFileSync(outPath, out);
  console.log('compiled', srcPath, '->', outPath, Math.floor(out.length/1024), 'KB');
}
compile(path.join(WS, 'sudoku-site', 'js', 'app.js'), path.join(OUTDIR, 'plat-sudoku-compiled.js'), B7, ['env', 'react'], 'sudoku-root', 'sudoku', 'React.createElement(SudokuGame)');
compile(path.join(WS, 'hashi-site', 'js', 'app.js'), path.join(OUTDIR, 'plat-hashi-compiled.js'), B6, ['es2015', 'react', 'stage-2'], 'hashi-root', 'hashi', 'React.createElement(HashiGame, null)');
compile(path.join(WS, 'mines-site', 'js', 'app.js'), path.join(OUTDIR, 'plat-mines-compiled.js'), B7, ['env', 'react'], 'mines-root', 'mines', 'React.createElement(MinesGame)');
compile(path.join(WS, 'akari-site', 'js', 'app.js'), path.join(OUTDIR, 'plat-akari-compiled.js'), B7, ['env', 'react'], 'akari-root', 'akari', 'React.createElement(AkariGame, null)');
