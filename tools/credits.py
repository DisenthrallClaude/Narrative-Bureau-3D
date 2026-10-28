# 生成 public/assets/CREDITS.txt：从 process_models.sh 用到的源目录读取 LICENSE，汇总署名
import os,re
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); S=os.path.join(ROOT,'..','assets','sourced')
lst=open(os.path.join(ROOT,'tools','process_models.sh'),encoding='utf-8').read()
dirs=sorted(set(os.path.dirname(l.split('|')[1]) for l in lst.splitlines() if l.count('|')==3 and os.path.exists(os.path.join(ROOT,'public/assets/models',l.split('|')[0]+'.glb'))))
by=[];cc0=[]
for d in dirs:
    for n in ['LICENSE.txt','LICENSE_RECORD.txt','LICENSE.md']:
        p=os.path.join(S,d,n)
        if os.path.exists(p):
            t=open(p,encoding='utf-8',errors='ignore').read()
            m=re.search(r'REQUIRED ATTRIBUTION[^:]*:\s*(.+)',t)
            if m: by.append(m.group(1).strip())
            else:
                a=re.search(r'Asset:\s*(.+)',t); au=re.search(r'Author:\s*(.+)',t)
                cc0.append(f"{a.group(1).strip() if a else os.path.basename(d)}{' — '+au.group(1).strip() if au else ''}")
            break
out=['叙事管理局 · 致谢','','【三维模型 · CC BY 4.0（须署名）】',*['· '+x for x in by],'','【三维模型 · CC0】',*['· '+x for x in cc0],'',
'【PBR 材质】ambientCG（CC0）：Granite003A、Marble006/012/016/021、Metal009/027/046A/048A、PavingStones142、Tiles138、Terrazzo005、Paper006、Cardboard004、Fabric023、Concrete034/036、Onyx013、Wood051、WoodFloor064、Carpet012、Leather026、Facade001',
'【HDRI】Poly Haven（CC0）：kloofendal_48d_partly_cloudy_puresky（Greg Zaal, Jarod Guest）、entrance_hall（Sergej Majboroda）、large_corridor（Sergej Majboroda）',
'【字体】Noto Serif SC / Noto Sans SC（SIL Open Font License 1.1）',
'【引擎】three.js（MIT）、three-mesh-bvh（MIT）、postprocessing（Zlib）、N8AO（CC0）',
'【剧情与美术设定】叙事管理局项目组；部分贴图由 GPT image 生成']
os.makedirs(os.path.join(ROOT,'public/assets'),exist_ok=True)
open(os.path.join(ROOT,'public/assets/CREDITS.txt'),'w',encoding='utf-8').write('\n'.join(out))
print(len(by),'CC BY',len(cc0),'CC0')
