# U2 齿轮加载动画 SVG 生成器：三只精确咬合的细线齿轮（模数 3），输出 <svg> 片段到 stdout
import math
m=3
def gear(N, spokes, hole):
    r=m*N/2; ra=r+m; rf=r-1.25*m; p=2*math.pi/N; pts=[]
    for i in range(N):
        t=i*p
        for rr,a in ((rf,t-.27*p),(ra,t-.11*p),(ra,t+.11*p),(rf,t+.27*p)): pts.append((rr*math.cos(a),rr*math.sin(a)))
    d='M'+' L'.join(f'{x:.2f},{y:.2f}' for x,y in pts)+'Z'
    ri=rf-4; s=[f'<path class="t" d="{d}"/>', f'<circle r="{ri:.1f}"/>', f'<circle class="f" r="{ri-2.5:.1f}"/>', f'<circle r="{hole+5}"/>', f'<circle class="h" r="{hole}"/>']
    for k in range(spokes):
        a=k*2*math.pi/spokes; a1=a-.13; a2=a+.13
        s.append(f'<path d="M{(hole+5)*math.cos(a1):.2f},{(hole+5)*math.sin(a1):.2f} L{(ri-2.5)*math.cos(a-.06):.2f},{(ri-2.5)*math.sin(a-.06):.2f} M{(hole+5)*math.cos(a2):.2f},{(hole+5)*math.sin(a2):.2f} L{(ri-2.5)*math.cos(a+.06):.2f},{(ri-2.5)*math.sin(a+.06):.2f}"/>')
        s.append(f'<circle class="b" cx="{(ri-7)*math.cos(a+math.pi/spokes):.2f}" cy="{(ri-7)*math.sin(a+math.pi/spokes):.2f}" r="1.4"/>')
    return ''.join(s), r
N1,N2,N3=32,20,14
g1,r1=gear(N1,6,5); g2,r2=gear(N2,5,4); g3,r3=gear(N3,4,3)
c1=(-38,18.5)  # 整组居中（三齿轮包围盒中心对准 0,0）
th=-45; c2=(c1[0]+(r1+r2)*math.cos(math.radians(th)), c1[1]+(r1+r2)*math.sin(math.radians(th)))
ph2=th+180-0.5*360/N2; th2=18; c3=(c2[0]+(r2+r3)*math.cos(math.radians(th2)), c2[1]+(r2+r3)*math.sin(math.radians(th2))); ph3=th2+180-0.5*360/N3
T=24
ticks=''.join(f'<line x1="{(118 if k%5 else 113)*math.cos(k*math.pi/60):.2f}" y1="{(118 if k%5 else 113)*math.sin(k*math.pi/60):.2f}" x2="{122*math.cos(k*math.pi/60):.2f}" y2="{122*math.sin(k*math.pi/60):.2f}"/>' for k in range(120))
svg=f'''<svg class="gears" viewBox="-150 -150 300 300" aria-hidden="true">
<g class="ring"><circle r="134" class="trk"/><circle r="134" class="arc" id="gearArc" pathLength="100"/><g class="tk">{ticks}</g><circle r="108" class="f"/></g>
<g transform="translate({c1[0]:.2f},{c1[1]:.2f})"><g class="gr" style="--a0:0deg;--d:{T}s">{g1}</g></g>
<g transform="translate({c2[0]:.2f},{c2[1]:.2f})"><g class="gr ccw" style="--a0:{ph2:.3f}deg;--d:{T*N2/N1:.3f}s">{g2}</g></g>
<g transform="translate({c3[0]:.2f},{c3[1]:.2f})"><g class="gr" style="--a0:{ph3:.3f}deg;--d:{T*N3/N1:.3f}s">{g3}</g></g>
</svg>'''
print(svg)
