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
for src,dst in [('NotoSerifSC-Bold.otf','serif-bold.woff2'),('NotoSerifSC-Regular.otf','serif-regular.woff2'),('NotoSansSC-Regular.otf','sans-regular.woff2'),('ZCOOLXiaoWei-Regular.ttf','title.woff2')]:
    subprocess.run([sys.executable,'-m','fontTools.subset',os.path.join(F,src),'--text-file=/tmp/nb_chars.txt','--flavor=woff2',f'--output-file={os.path.join(ROOT,"public/fonts",dst)}','--layout-features=*'],check=True)
print(len(txt),'chars')
