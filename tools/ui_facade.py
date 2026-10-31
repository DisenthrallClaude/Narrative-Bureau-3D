# U1：生成主菜单左页「叙事管理局正立面」铜版画线稿 SVG，写入 index.html 的 <!--FACADE--> … <!--/FACADE--> 之间
import math, re, os
W,H=600,780
L={k:[] for k in ['k','o','c','d','h','w','t']}
def ln(g,x1,y1,x2,y2): L[g].append(f'M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}')
def rc(g,x,y,w,h): L[g].append(f'M{x:.1f} {y:.1f}h{w:.1f}v{h:.1f}h{-w:.1f}Z')
def circ(g,cx,cy,r): L[g].append(f'M{cx-r:.1f} {cy:.1f}a{r:.1f} {r:.1f} 0 1 0 {2*r:.1f} 0a{r:.1f} {r:.1f} 0 1 0 {-2*r:.1f} 0')
cx=300; G=650  # 地坪线
# —— 构造线（赭石）：地平线 / 灭点 / 维特鲁威方圆 / 黄金矩形对角
ln('k',20,G,580,G); ln('k',20,470,580,470)
for x in (40,120,480,560): ln('k',x,G+60,cx,470)
circ('k',cx,400,250); rc('k',cx-215,175,430,430); ln('k',cx-215,175,cx+215,605); ln('k',cx+215,175,cx-215,605)
ln('k',cx,30,cx,G+40)
# —— 台阶 / 台基
for i in range(4): rc('o',cx-230+i*10,G-14-i*12,460-i*20,12)
rc('o',cx-200,G-62-24,400,24)
# —— 两翼（窗格）
for s in (-1,1):
    x0=cx+s*215-(64 if s>0 else 0); x0=cx+215 if s>0 else cx-279
    rc('o',x0,G-300,64,214)
    for r in range(3):
        for c in range(2):
            wx=x0+10+c*26; wy=G-280+r*66; rc('w',wx,wy,18,42); ln('w',wx+9,wy,wx+9,wy+42); ln('w',wx,wy+16,wx+18,wy+16)
            L['w'].append(f'M{wx:.1f} {wy:.1f}a9 9 0 0 1 18 0')
    rc('d',x0-4,G-306,72,8)
# —— 柱廊：八柱
top=G-86; colH=262; cols=8; span=380; step=span/(cols-1)
xs=[cx-span/2+i*step for i in range(cols)]
# 柱间阴影排线（墙面内凹）
for x in range(int(cx-195),int(cx+195),5):
    ln('h',x,top-colH+30,x+14,top-colH+30+14*1) if False else None
for k in range(0,140):
    y=top-colH+20+k*2*1.0
    if y>top-4: break
    pass
for i in range(cols-1):
    a=xs[i]+12; b=xs[i+1]-12
    for k in range(int((b-a)/4)+28):
        x1=a+k*4-60; y1=top-colH+18; x2=x1+60; y2=top
        # 裁到 [a,b]
        t1=max(0,(a-x1)/60); t2=min(1,(b-x1)/60)
        if t1<t2: ln('h',x1+60*t1,y1+(y2-y1)*t1,x1+60*t2,y1+(y2-y1)*t2)
    # 门 / 窗
    mx=(xs[i]+xs[i+1])/2
    if i==3: rc('d',mx-20,top-110,40,110); L['d'].append(f'M{mx-20:.1f} {top-110:.1f}a20 20 0 0 1 40 0'); ln('d',mx,top-110,mx,top)
    else: rc('d',mx-11,top-150,22,56); L['d'].append(f'M{mx-11:.1f} {top-150:.1f}l11 -10l11 10')
for x in xs:
    rc('o',x-12,top-colH+16,24,colH-24)       # 柱身
    for f in (-6,0,6): ln('c',x+f,top-colH+22,x+f,top-12)
    rc('c',x-16,top-12,32,12); rc('c',x-15,top-colH+8,30,8)  # 柱础 / 柱头
    circ('c',x-15,top-colH+12,3.2); circ('c',x+15,top-colH+12,3.2)
# —— 檐部
eY=top-colH+8
rc('o',cx-214,eY-34,428,34); ln('d',cx-214,eY-22,cx+214,eY-22); ln('d',cx-214,eY-12,cx+214,eY-12)
for x in range(int(cx-210),int(cx+212),12): rc('d',x,eY-34,6,6)   # 齿饰
# —— 山花
pY=eY-34; pk=pY-96
L['o'].append(f'M{cx-226:.1f} {pY:.1f}L{cx:.1f} {pk:.1f}L{cx+226:.1f} {pY:.1f}Z')
L['d'].append(f'M{cx-196:.1f} {pY-8:.1f}L{cx:.1f} {pk+16:.1f}L{cx+196:.1f} {pY-8:.1f}Z')
# 山花内局徽：罗盘
circ('d',cx,pY-38,24); circ('d',cx,pY-38,17)
for k in range(16):
    a=k/16*2*math.pi; r0=17 if k%2 else 6; ln('d',cx+math.sin(a)*r0*0.2,pY-38-math.cos(a)*r0*0.2,cx+math.sin(a)*(24 if k%4==0 else 19),pY-38-math.cos(a)*(24 if k%4==0 else 19))
# 山花排线
for k in range(0,46):
    y=pY-10-k*1.9
    hw=(y-pk-16)/(pY-8-pk-16)*196
    if hw<30: break
    ln('h',cx-hw,y,cx-28 if abs(y-(pY-38))<26 else cx-hw*0.55,y)
# —— 鼓座 + 穹顶 + 采光亭
dY=pk+10
rc('o',cx-96,dY-64,192,64)
for x in range(int(cx-84),int(cx+90),24): rc('w',x,dY-54,12,40); L['w'].append(f'M{x} {dY-54:.1f}a6 6 0 0 1 12 0')
rc('d',cx-104,dY-72,208,8)
L['o'].append(f'M{cx-100:.1f} {dY-72:.1f}C{cx-100:.1f} {dY-190:.1f} {cx+100:.1f} {dY-190:.1f} {cx+100:.1f} {dY-72:.1f}')
for k in range(-4,5):
    t=k/5; L['c'].append(f'M{cx+t*100:.1f} {dY-72:.1f}Q{cx+t*70:.1f} {dY-170:.1f} {cx:.1f} {dY-160:.1f}')
for k in range(24):
    y=dY-80-k*3.4; hw=100*math.sqrt(max(0,1-((dY-72-y)/ (118))**2))
    ln('h',cx+hw*0.35,y,cx+hw*0.98,y)
rc('o',cx-14,dY-196,28,36); L['o'].append(f'M{cx-18:.1f} {dY-196:.1f}Q{cx:.1f} {dY-226:.1f} {cx+18:.1f} {dY-196:.1f}'); ln('o',cx,dY-224,cx,dY-246); circ('d',cx,dY-250,4)
# —— 题字与比例尺
ln('t',cx-120,G+42,cx+120,G+42)
for i in range(7): ln('t',cx-120+i*40,G+38,cx-120+i*40,G+46)
style={'k':('#a8743a',.6,'u-k'),'o':('#3a2616',1.35,'u-o'),'c':('#4a3220',.8,'u-c'),'d':('#4a3220',.8,'u-d'),'h':('#6b4f35',.5,'u-h'),'w':('#4a3220',.7,'u-w'),'t':('#3a2616',.8,'u-t')}
out=[f'<svg class="etch" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">']
for g in ['k','h','o','c','d','w','t']:
    col,sw,cl=style[g]
    # 每层拆 3 条路径，错峰描绘
    parts=L[g]; n=3 if len(parts)>9 else 1; sz=math.ceil(len(parts)/n)
    for j in range(n):
        d=''.join(parts[j*sz:(j+1)*sz])
        if d: out.append(f'<path class="{cl} s{j}" pathLength="1" d="{d}" stroke="{col}" stroke-width="{sw}" fill="none"/>')
out.append(f'<text x="{cx}" y="{G+70}" class="cap">ORTHOGRAPHIA · FRONS AEDIS</text>')
out.append(f'<text x="{cx-120}" y="{G+60}" class="sc">0</text><text x="{cx+120}" y="{G+60}" class="sc">60 PEDES</text>')
out.append('</svg>')
svg=''.join(out)
P=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'index.html')
s=open(P,encoding='utf-8').read()
s=re.sub(r'<!--FACADE-->.*?<!--/FACADE-->','<!--FACADE-->'+svg+'<!--/FACADE-->',s,flags=re.S)
open(P,'w',encoding='utf-8').write(s); print(len(svg),'bytes')
