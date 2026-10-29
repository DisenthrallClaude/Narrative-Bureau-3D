# 中文字体子集化：扫描 src/、index.html、public/content/ 中所有文字 → woff2
import os, re, glob, subprocess, sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
chars=set()
for pat in ['src/**/*.js','index.html','public/content/**/*.json','public/content/**/*.md','../content/**/*.md']:
    for f in glob.glob(os.path.join(ROOT,pat), recursive=True):
        try: chars|=set(open(f,encoding='utf-8').read())
        except Exception: pass
base='　，。、；：？！“”‘’（）《》【】「」『』—…·￥0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz%-+/.,:;!?()[]<>=#*&@ ←→↑↓▼▲⚠'
chars|=set(base)
txt=''.join(sorted(c for c in chars if ord(c)>=32))
open('/tmp/nb_chars.txt','w',encoding='utf-8').write(txt)
F=os.path.join(ROOT,'..','work','fonts')
# R2 字体规范（docs/TYPOGRAPHY.md）：标题 思源宋体 Black / 小标题 SemiBold / 正文 Regular·Bold / 界面数字 思源黑体 / 西文标题 Cinzel / 西文正文 Cormorant Garamond
JOBS=[('NotoSerifSC-W900.ttf','title.woff2',txt),('NotoSerifSC-W600.ttf','serif-semibold.woff2',txt),('NotoSerifSC-Bold.otf','serif-bold.woff2',txt),('NotoSerifSC-Regular.otf','serif-regular.woff2',txt),('NotoSansSC-Regular.otf','sans-regular.woff2',txt),('NotoSansSC-Medium.otf','sans-medium.woff2',txt)]
LAT=''.join(chr(c) for c in range(32,127))+'·—–‘’“”…©®°×←→↑↓'
JOBS+=[('Cinzel-SemiBold.ttf','latin-title.woff2',LAT),('Cormorant-Medium.ttf','latin-serif.woff2',LAT),('Cormorant-MediumItalic.ttf','latin-italic.woff2',LAT)]
for src,dst,chars_ in JOBS:
    if not os.path.exists(os.path.join(F,src)): print('missing',src); continue
    open('/tmp/nb_sub.txt','w',encoding='utf-8').write(chars_)
    subprocess.run([sys.executable,'-m','fontTools.subset',os.path.join(F,src),'--text-file=/tmp/nb_sub.txt','--flavor=woff2',f'--output-file={os.path.join(ROOT,"public/fonts",dst)}','--layout-features=*'],check=True)
print(len(txt),'chars')
