#!/usr/bin/env python3
"""平台整合殼 build：殼模板 + 數獨(sudoku-site) + 數橋(hashi-site) → 單檔預覽。
- 兩款 app 程式碼以 text/plain 嵌入，進遊戲時才用各自的 Babel 版本編譯執行（避免全域命名衝突、加快首頁開啟）
- 兩款 css 的 body 規則抽出，改成 body[data-view=...] 讓殼切換背景
- 各 app 的 createRoot 目標改成自己的掛載點（sudoku-root / hashi-root），來源專案不動
用法: python3 build.py [output.html]
"""
import os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
HASHI = os.path.expanduser('~/workspace/hashi-site')
SUDOKU = os.path.expanduser('~/workspace/sudoku-site')
MINES = os.path.expanduser('~/workspace/mines-site')
_args = [a for a in sys.argv[1:] if not a.startswith('--')]
DIAG = '--diag' in sys.argv
OUT = _args[0] if _args else os.path.join(BASE, 'platform-v1-test.html')

def read(root, p):
    return open(os.path.join(root, p), encoding='utf-8').read()

def split_body_rule(css):
    m = re.search(r'(?:^|\n)\s*body\s*\{(.*?)\}', css, re.S)
    assert m, 'body rule not found'
    inner = m.group(1).strip()
    rest = css[:m.start()] + css[m.end():]
    return inner, rest

sudoku_css = read(SUDOKU, 'css/style.css')
hashi_css = read(HASHI, 'css/style.css')
mines_css = read(MINES, 'css/style.css')
s_body, sudoku_css = split_body_rule(sudoku_css)
h_body, hashi_css = split_body_rule(hashi_css)
m_body, mines_css = split_body_rule(mines_css)
shell_css = read(BASE, 'shell.css')
platform_css = (
    '/* === 數獨 css === */\n' + sudoku_css.strip() + '\n\n'
    '/* === 數橋 css === */\n' + hashi_css.strip() + '\n\n'
    '/* === 踩地雷 css === */\n' + mines_css.strip() + '\n\n'
    'body[data-view="sudoku"] {\n' + s_body + '\n}\n'
    'body[data-view="hashi"] {\n' + h_body + '\n}\n'
    'body[data-view="mines"] {\n' + m_body + '\n}\n\n'
    '/* === 平台殼 css === */\n' + shell_css.strip()
)

def classic(code):
    return '<script>\n' + code.rstrip() + '\n  </script>'

classics = '\n'.join([
    classic(read(HASHI, 'js/solver.js')),
    classic(read(HASHI, 'js/puzzle.js')),
    classic(read(SUDOKU, 'js/engine.js')),
])

# 兩款 app 改為 build 時預編譯（各自的 Babel 版本），手機端直接執行、不再即時編譯
import subprocess
subprocess.run(['node', os.path.join(BASE, 'compile.js')], check=True)
def js_safe(code):
    return code.replace('</script>', '<\\/script>')
sudoku_app = js_safe(open(os.path.join(BASE, '.build', 'plat-sudoku-compiled.js'), encoding='utf-8').read())
hashi_app = js_safe(open(os.path.join(BASE, '.build', 'plat-hashi-compiled.js'), encoding='utf-8').read())
mines_app = js_safe(open(os.path.join(BASE, '.build', 'plat-mines-compiled.js'), encoding='utf-8').read())
assert 'sudoku-root' in sudoku_app and 'hashi-root' in hashi_app and 'mines-root' in mines_app


# === v1.19.0 單一檔案部署：函式庫全 vendor 化 inline ===
# 病因（2026-10-29 與 2026-11-01 兩次實機事故）：多檔案部署下 index/shell/compiled 各自被快取分開計時，
# 手機（尤其 iOS 主畫面 App 的頑固快取）隨時可能跑混版組合，開局流程中途死亡變整面空白。
# 解法：正式站只部署一個 index.html——殼＋三款預編譯遊戲＋全部函式庫都在同一檔，一個版本一個檔案，
# 混版在物理上不可能；連「開局才 fetch 遊戲」的懶載入競態也一併消失（loadCode 直接讀 inline #code-*）。
# vendor 來源（2026-11-01 快照，存 platform/vendor/）：
#   tailwind.js    = https://cdn.tailwindcss.com（Play CDN）
#   react.js       = react@18 UMD production、react-dom.js = react-dom@18 UMD production
#   regenerator.js = regenerator-runtime@0.14.1 runtime.js、peerjs.js = peerjs@1.5.2 peerjs.min.js
VENDORS = [('tailwind', 'https://cdn.tailwindcss.com'),
           ('react', 'https://unpkg.com/react@18/umd/react.production.min.js'),
           ('react-dom', 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'),
           ('regenerator', 'https://unpkg.com/regenerator-runtime@0.14.1/runtime.js'),
           ('peerjs', 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js')]
def inline_vendors(html):
    for name, url in VENDORS:
        code = js_safe(read(BASE, 'vendor/' + name + '.js'))
        pat = re.compile(r'<script[^>]*src="' + re.escape(url) + r'"[^>]*></script>')
        repl = '  <script data-vendor="' + name + '">\n' + code.rstrip() + '\n  </script>'
        html, n = pat.subn(lambda m: repl, html)  # lambda 回傳字面字串：vendor 程式碼含 \d 等反斜線序列，不能當替換模板
        assert n == 1, 'vendor 標籤未找到: ' + name
    return html

SITE_PANEL = ''
def build_site(outdir):
    os.makedirs(os.path.join(outdir, 'css'), exist_ok=True)
    os.makedirs(os.path.join(outdir, 'js/sudoku'), exist_ok=True)
    os.makedirs(os.path.join(outdir, 'js/hashi'), exist_ok=True)
    os.makedirs(os.path.join(outdir, 'js/mines'), exist_ok=True)
    os.makedirs(os.path.join(outdir, 'js/platform'), exist_ok=True)
    # css: body-stripped game css + platform css with data-view body rules
    open(os.path.join(outdir, 'css/sudoku.css'), 'w', encoding='utf-8').write(sudoku_css.strip() + '\n')
    open(os.path.join(outdir, 'css/hashi.css'), 'w', encoding='utf-8').write(hashi_css.strip() + '\n')
    open(os.path.join(outdir, 'css/mines.css'), 'w', encoding='utf-8').write(mines_css.strip() + '\n')
    plat_css = ('body[data-view="sudoku"] {\n' + s_body + '\n}\n'
                'body[data-view="hashi"] {\n' + h_body + '\n}\n'
                'body[data-view="mines"] {\n' + m_body + '\n}\n\n' + shell_css.strip() + '\n')
    open(os.path.join(outdir, 'css/platform.css'), 'w', encoding='utf-8').write(plat_css)
    # js: classics + compiled apps + shell
    import shutil, subprocess
    shutil.copy(os.path.join(SUDOKU, 'js/engine.js'), os.path.join(outdir, 'js/sudoku/engine.js'))
    for f in ['solver.js', 'puzzle.js']:
        shutil.copy(os.path.join(HASHI, 'js', f), os.path.join(outdir, 'js/hashi', f))
    subprocess.run(['node', os.path.join(BASE, 'compile.js')], check=True)
    shutil.copy(os.path.join(BASE, '.build', 'plat-sudoku-compiled.js'), os.path.join(outdir, 'js/sudoku/app.compiled.js'))
    shutil.copy(os.path.join(BASE, '.build', 'plat-hashi-compiled.js'), os.path.join(outdir, 'js/hashi/app.compiled.js'))
    shutil.copy(os.path.join(BASE, '.build', 'plat-mines-compiled.js'), os.path.join(outdir, 'js/mines/app.compiled.js'))
    shutil.copy(os.path.join(BASE, 'shell.js'), os.path.join(outdir, 'js/platform/shell.js'))
    shutil.copy(os.path.join(BASE, 'platform-icon.png'), os.path.join(outdir, 'platform-icon.png'))
    # index.html from shell template with file references instead of inlining
    html = read(BASE, 'shell.html')
    # 快取破壞（2026-10-30）：本地 js/css 網址一律加 ?v=<PLAT_VERSION>——GitHub Pages 快取 10 分鐘且各檔分開計時，
    # 使用者多次遇到「推了新版、手機還跑舊檔（混版/沒感覺）」；升版即換網址，瀏覽器被迫抓新檔。只作用在 --site 的 index。
    _ver = re.search(r"PLAT_VERSION = '([^']+)'", read(BASE, 'shell.js')).group(1)
    html = html.replace('<!--PLATFORM_CSS-->', '')
    html = re.sub(r'  <style>\n\n  </style>', '  <link rel="stylesheet" href="css/sudoku.css">\n  <link rel="stylesheet" href="css/hashi.css">\n  <link rel="stylesheet" href="css/mines.css">\n  <link rel="stylesheet" href="css/platform.css">', html)
    html = html.replace('<!--CLASSIC_SCRIPTS-->', '\n'.join([
        '  <script src="js/hashi/solver.js"></script>',
        '  <script src="js/hashi/puzzle.js"></script>',
        '  <script src="js/sudoku/engine.js"></script>']))
    html = re.sub(r'  <script type="text/plain" id="code-sudoku">.*?</script>\n', '', html, flags=re.S)
    html = re.sub(r'  <script type="text/plain" id="code-hashi">.*?</script>\n', '', html, flags=re.S)
    html = re.sub(r'  <script type="text/plain" id="code-mines">.*?</script>\n', '', html, flags=re.S)
    html = html.replace('<!--STATUS_PANEL-->', '')
    html = re.sub(r'  <script>\n<!--SHELL_JS-->\n  </script>', '  <script src="js/platform/shell.js"></script>', html)
    assert '<!--' not in html, 'site index 尚有 placeholder'
    html = re.sub(r'((?:src|href)="(?:js|css)/[^"?]+)"', lambda m: m.group(1) + '?v=' + _ver + '"', html)
    assert '?v=' + _ver in html, '快取破壞參數未注入'
    open(os.path.join(outdir, 'index.html'), 'w', encoding='utf-8').write(html)
    # remove old-layout files superseded by the platform structure
    for old in ['css/style.css', 'js/app.js', 'js/sound.js', 'js/solver.js', 'js/puzzle.js']:
        p = os.path.join(outdir, old)
        if os.path.exists(p): os.remove(p)
    print('site built ->', outdir)

def assemble_bundle():
    html = read(BASE, 'shell.html')
    html = html.replace('<!--PLATFORM_CSS-->', platform_css)
    html = html.replace('<!--CLASSIC_SCRIPTS-->', classics)
    html = html.replace('<!--CODE_SUDOKU-->', sudoku_app.rstrip())
    html = html.replace('<!--CODE_HASHI-->', hashi_app.rstrip())
    html = html.replace('<!--CODE_MINES-->', mines_app.rstrip())
    PANEL = '''  <div id="plat-status" style="position:fixed;left:0;right:0;bottom:0;z-index:99998;background:rgba(0,0,0,0.8);color:#d1fae5;font-family:monospace;font-size:11px;line-height:1.5;padding:6px 10px;max-height:38vh;overflow:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;"><span>🔧 平台狀態（測試用）</span><button onclick="document.getElementById('plat-status').style.display='none'" style="color:#fff;font-weight:900;padding:2px 8px;">✕</button></div>
    <div id="plat-status-body"></div>
  </div>'''
    html = html.replace('<!--STATUS_PANEL-->', PANEL if DIAG else '')
    html = html.replace('<!--SHELL_JS-->', read(BASE, 'shell.js').rstrip())
    assert '<!--' not in html, '尚有未填的 placeholder'
    return html

if '--site' in sys.argv:
    outdir = _args[0] if _args else os.path.expanduser('~/workspace/platform-site')
    build_site(outdir)  # 舊多檔資產照舊寫入（凍結備援：卡在舊版 index 的手機走舊路徑仍找得到檔案，不會 404）
    single = inline_vendors(assemble_bundle())
    open(os.path.join(outdir, 'index.html'), 'w', encoding='utf-8').write(single)
    print(f'single-file index -> {os.path.join(outdir, "index.html")} ({len(single)//1024} KB)')
    sys.exit(0)

html = assemble_bundle()
open(OUT, 'w', encoding='utf-8').write(html)
print(f'build ok -> {OUT} ({len(html)//1024} KB)')
