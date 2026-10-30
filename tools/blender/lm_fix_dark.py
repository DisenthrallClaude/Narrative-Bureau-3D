# 批次31：修光照贴图里 wall/pier/trim 竖直面整块为 0 的区域（拱廊墙洞口侧壁与 reveal 共面 → Cycles 烘焙互相遮挡成黑）
import bpy, numpy as np, math
from mathutils import Vector, kdtree
W='/workspace/projects/b2c90d19-7034-43fd-aea1-521ddd72406e/work/r2/'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=W+'hero_hall.glb')
img=bpy.data.images.load(W+'hero_hall_lm.png'); w,h=img.size
px=np.array(img.pixels[:],dtype=np.float32).reshape(h,w,4)
lum=px[...,:3].mean(-1)
def samp(u,v):
  x=min(w-1,max(0,int(u*w))); y=min(h-1,max(0,int(v*h))); return x,y
tot=0
for ob in [o for o in bpy.context.scene.objects if o.type=='MESH' and o.name.split('.')[0] in ('H_wall','H_pier','H_trim','H_plinthIn')]:
  me=ob.data; uvl=me.uv_layers[1].data; mw=ob.matrix_world
  me.calc_loop_triangles()
  info=[]
  for t in me.loop_triangles:
    uvs=[uvl[l].uv for l in t.loops]
    # 三角形覆盖像素平均
    xs=[u.x*w for u in uvs]; ys=[u.y*h for u in uvs]
    x0,x1=int(max(0,min(xs))),int(min(w-1,max(xs)))+1; y0,y1=int(max(0,min(ys))),int(min(h-1,max(ys)))+1
    m=lum[y0:y1+1,x0:x1+1].mean() if (x1>=x0 and y1>=y0) else 0
    c=mw@Vector(sum((me.vertices[i].co for i in t.vertices),Vector())/3)
    n=(mw.to_3x3()@t.normal).normalized()
    area=t.area
    info.append((t,uvs,m,c,n,(x0,x1,y0,y1),area))
  lit=[(c,i) for i,(t,uvs,m,c,n,bb,a) in enumerate(info) if m>0.06]
  kd=kdtree.KDTree(len(lit))
  for c,i in lit: kd.insert(c,i)
  kd.balance()
  fixed=0
  for (t,uvs,m,c,n,(x0,x1,y0,y1),a) in info:
    if m>0.02 or abs(n.z)>0.5 or a<0.05: continue
    # 只修离地 0–10 m（拱廊/柱身高度）的面
    if c.z>12: continue
    near=kd.find_range(c,2.5)
    if len(near)<3: continue
    vals=sorted(info[i][2] for (_,i,_) in near)
    tgt=vals[len(vals)//4]*0.85  # 取邻近亮面下四分位再压一点（侧壁本应比正面暗）
    # 栅格化 UV 三角形（外扩 2 px）
    P=[(u.x*w,u.y*h) for u in uvs]
    X0,X1,Y0,Y1=max(0,x0-2),min(w-1,x1+2),max(0,y0-2),min(h-1,y1+2)
    yy,xx=np.mgrid[Y0:Y1+1,X0:X1+1]+0.5
    def ed(a,b): return (b[0]-a[0])*(yy-a[1])-(b[1]-a[1])*(xx-a[0])
    e0,e1,e2=ed(P[0],P[1]),ed(P[1],P[2]),ed(P[2],P[0])
    s=np.sign(e0+e1+e2+1e-9)
    # 2px 外扩：允许边距
    def dist(e,a,b): L=math.hypot(b[0]-a[0],b[1]-a[1])+1e-9; return e*s/L
    inside=(dist(e0,P[0],P[1])>-2)&(dist(e1,P[1],P[2])>-2)&(dist(e2,P[2],P[0])>-2)
    reg=px[Y0:Y1+1,X0:X1+1]
    dark=inside&(reg[...,:3].mean(-1)<tgt)
    # 用邻近亮面的平均颜色（保持色温）
    col=np.mean([px[samp(*info[i][1][0])[1],samp(*info[i][1][0])[0],:3] for (_,i,_) in near[:20]],axis=0)
    col=col/(col.mean()+1e-6)*tgt
    reg[dark,:3]=col; fixed+=1
  print('FIX',ob.name,len(info),fixed); tot+=fixed
img.pixels[:]=px.ravel()
img.filepath_raw='/workspace/projects/b2c90d19-7034-43fd-aea1-521ddd72406e/work/r3/b31/hero_hall_lm_fix.png'; img.file_format='PNG'; img.save()
print('TOTAL',tot)
