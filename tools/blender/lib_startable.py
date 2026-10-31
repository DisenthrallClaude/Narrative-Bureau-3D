# 批次43：藏书阁星图台（dressing.js 里 1.4×0.9×1.0 wood 方盒 + Math.random 星点贴片 → 在 lib_globe 看图里是纯黑方块）精建。
# 胡桃木斜面图台：底座踢脚 + 柜身（正面一排 3 只扁平图纸抽屉 + 铜杯形拉手 + 名签框；下层两扇凸芯柜门 + 铜钮；两侧凸芯板）；
# 斜面台面（前低 0.84 / 后高 1.02，约 14°）+ 前沿铜挡条；台面嵌铜框星图板（烘焙 1024×640 贴图：深蓝底 + 赤经赤纬网 + 黄道虚线 + 星座连线 + 按亮度分级的星点）；
# 左下角黄铜平面星盘（星盘外环 72 刻度 + 镂空网环 + 指针尺）；后沿平台 + 铜围栏 + 黄铜立柱台灯（钟形铜罩，罩内暖光面）。
# 游戏坐标：+Z = 读者一侧（面向圆厅中心），原点 = 占地中心地面，单位 m。占地 1.36 × 0.96。
import bpy, bmesh, sys, math
import numpy as np
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True); S = bpy.context.scene
def mat(name, col, rough=0.5, metal=0.0, emit=None, es=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = es
    return m
M = dict(walnut=mat('sw_walnut', (0.20, 0.10, 0.05), 0.45), walnutD=mat('sw_walnutDark', (0.11, 0.055, 0.03), 0.5),
         brass=mat('st_brass', (0.82, 0.62, 0.30), 0.26, 1.0), brassD=mat('st_brassDim', (0.52, 0.38, 0.19), 0.38, 1.0),
         paper=mat('st_label', (0.74, 0.66, 0.48), 0.7), glow=mat('st_lampGlow', (1.0, 0.92, 0.75), 0.4, 0.0, (1.0, 0.84, 0.58), 6.0),
         ink=mat('st_ink', (0.05, 0.035, 0.02), 0.6))
def G(x, y, z): return (x, -z, y)
def add(o, m): o.data.materials.append(M[m]); return o
def box(m, w, h, d, x, y, z, rx=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=G(x, y, z)); o = bpy.context.object; o.scale = (w, d, h); o.rotation_euler = (rx, 0, 0); return add(o, m)
def cyl(m, r, d, x, y, z, v=24, r2=None, rot=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=d, location=G(x, y, z))
    else: bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=d, location=G(x, y, z))
    o = bpy.context.object
    if rot: o.rotation_euler = rot
    return add(o, m)
def prism(m, prof, x0, x1):  # prof = [(z, y), ...] 侧面轮廓，沿 x 拉伸
    me = bpy.data.meshes.new('pr'); bm = bmesh.new(); n = len(prof)
    vs = [bm.verts.new(G(x, y, z)) for x in (x0, x1) for (z, y) in prof]
    bm.faces.new(vs[:n][::-1]); bm.faces.new(vs[n:])
    for i in range(n): j = (i + 1) % n; bm.faces.new((vs[i], vs[j], vs[n + j], vs[n + i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('pr', me); S.collection.objects.link(o); return add(o, m)
W, D = 1.30, 0.90; ZF, ZB = D / 2, -D / 2; YF, YB = 0.84, 1.02  # 斜面前低后高
ANG = math.atan2(YB - YF, ZF - ZB)
def slopeY(z): return YF + (ZF - z) / (ZF - ZB) * (YB - YF)
# —— 底座 + 柜身 ——
box('walnutD', W + 0.06, 0.09, D + 0.06, 0, 0.045, 0)
box('brassD', W + 0.065, 0.012, 0.012, 0, 0.095, ZF + 0.031)
prism('walnut', [(ZF, 0.09), (ZF, YF - 0.035), (ZB, YB - 0.035), (ZB, 0.09)], -W / 2, W / 2)
# 正面：上排 3 只扁平图纸抽屉
for k in range(3):
    cx = (k - 1) * (W / 3); dw = W / 3 - 0.05
    box('walnutD', dw + 0.02, 0.15, 0.012, cx, 0.68, ZF + 0.004)
    box('walnut', dw, 0.13, 0.02, cx, 0.68, ZF + 0.012)
    for s2 in (-1, 1): box('brass', 0.012, 0.012, 0.024, cx + s2 * 0.05, 0.665, ZF + 0.03)  # 吊环拉手两座
    cyl('brass', 0.006, 0.11, cx, 0.655, ZF + 0.044, v=10, rot=(0, math.pi / 2, 0))
    box('brassD', 0.075, 0.035, 0.006, cx, 0.715, ZF + 0.024); box('paper', 0.06, 0.024, 0.004, cx, 0.715, ZF + 0.028)
# 抽屉排下的腰线
box('walnutD', W + 0.02, 0.03, 0.03, 0, 0.59, ZF + 0.012)
# 下层两扇凸芯柜门 + 中立梃
for s in (-1, 1):
    cx = s * W / 4
    box('walnut', W / 2 - 0.05, 0.44, 0.02, cx, 0.34, ZF + 0.012)
    box('walnutD', W / 2 - 0.17, 0.32, 0.012, cx, 0.34, ZF + 0.026)
    box('walnut', W / 2 - 0.21, 0.28, 0.012, cx, 0.34, ZF + 0.034)  # 凸芯
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.018, location=G(-s * 0.06, 0.40, ZF + 0.04)); add(bpy.context.object, 'brass')
box('walnutD', 0.04, 0.46, 0.03, 0, 0.34, ZF + 0.016)
# 两侧凸芯板 + 角柱
for sx in (-1, 1):
    box('walnutD', 0.012, 0.56, D - 0.22, sx * (W / 2 + 0.006), 0.42, 0)
    box('walnut', 0.012, 0.44, D - 0.34, sx * (W / 2 + 0.014), 0.42, 0)
    for sz in (-1, 1): box('walnut', 0.05, YF - 0.12 if sz > 0 else 0.8, 0.05, sx * (W / 2 - 0.0), 0.09 + (YF - 0.12 if sz > 0 else 0.8) / 2, sz * (D / 2 - 0.0))
# —— 斜面台面（带厚度 + 外挑）+ 前沿铜挡条 ——
T = 0.035; ov = 0.03
prism('walnutD', [(ZF + ov, slopeY(ZF + ov) - T), (ZF + ov, slopeY(ZF + ov)), (ZB - ov, slopeY(ZB - ov)), (ZB - ov, slopeY(ZB - ov) - T)], -W / 2 - ov, W / 2 + ov)
zl = ZF + ov - 0.01; box('brass', W + 0.04, 0.03, 0.008, 0, slopeY(zl) + 0.012, zl, rx=0)
# 后沿平台 + 铜围栏
yb = slopeY(ZB - ov)
box('walnut', W + 0.06, 0.03, 0.14, 0, yb + 0.015, ZB - ov + 0.0)
for k in range(9): px = -W / 2 + k * W / 8; cyl('brass', 0.006, 0.07, px, yb + 0.065, ZB - ov - 0.055, v=10)
cyl('brass', 0.007, W, 0, yb + 0.10, ZB - ov - 0.055, v=10, rot=(0, math.pi / 2, 0))
# —— 星图板（铜框 + 烘焙贴图）——
CW, CD = 1.04, 0.62; cz = 0.0
def onslope(u, v, lift):  # u = x，v = 沿斜面（+ 朝后），lift = 法向抬高
    z = cz - v * math.cos(ANG); y = slopeY(cz) + v * math.sin(ANG)
    return G(u, y + lift * math.cos(ANG), z + lift * math.sin(ANG))
for (u, v, w, d) in [(0, CD / 2 + 0.012, CW + 0.05, 0.024), (0, -CD / 2 - 0.012, CW + 0.05, 0.024), (CW / 2 + 0.012, 0, 0.024, CD), (-CW / 2 - 0.012, 0, 0.024, CD)]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=onslope(u, v, 0.006)); o = bpy.context.object; o.scale = (w, d, 0.012); o.rotation_euler = (ANG, 0, 0); add(o, 'brass')
# 星图贴图
TW, TH = 1024, 640; img = np.zeros((TH, TW, 4), np.float32); img[..., 3] = 1
yy, xx = np.mgrid[0:TH, 0:TW].astype(np.float32)
img[..., 0] = 0.10; img[..., 1] = 0.15; img[..., 2] = 0.32  # 批次44：底色 0.03/0.05/0.15 → 提亮的普鲁士蓝（预览里原底读成近黑橄榄）
vign = 1 - 0.35 * (((xx - TW / 2) / (TW / 2)) ** 2 + ((yy - TH / 2) / (TH / 2)) ** 2); img[..., :3] *= vign[..., None]
def stroke(mask, col, a):
    for c in range(3): img[..., c] = np.where(mask, img[..., c] * (1 - a) + col[c] * a, img[..., c])
GOLD = (0.80, 0.62, 0.30)
ccx, ccy = TW * 0.5, TH * 0.5; rr = np.hypot(xx - ccx, yy - ccy); th = np.arctan2(yy - ccy, xx - ccx)
for R in (90, 170, 250, 300): stroke(np.abs(rr - R) < 0.9, GOLD, 0.55)
stroke(np.abs(rr - 302) < 2.2, GOLD, 0.9)
for k in range(24): stroke((np.abs(np.sin(th - k * math.pi / 12)) * rr < 0.8) & (rr < 300) & (np.cos(th - k * math.pi / 12) > 0) & (rr > 20), GOLD, 0.35)
for k in range(72): stroke((np.abs(np.sin(th - k * math.pi / 36)) * rr < 0.9) & (rr > 300) & (rr < (318 if k % 6 == 0 else 310)) & (np.cos(th - k * math.pi / 36) > 0), GOLD, 0.85)
ecl = np.abs(np.hypot(xx - ccx - 60, yy - ccy + 30) - 210) < 1.0; stroke(ecl & ((xx.astype(int) // 6) % 2 == 0), (0.65, 0.30, 0.18), 0.8)  # 黄道虚线
# 星点：确定性哈希（非 Math.random），按亮度 4 级
def h(i, s): return (math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1.0
stars = []
for i in range(280):
    a = h(i, 1) * 2 * math.pi; r = math.sqrt(h(i, 2)) * 296; px, py = ccx + r * math.cos(a), ccy + r * math.sin(a); mag = h(i, 3); stars.append((px, py, mag))
for (px, py, mag) in stars:
    rad = 1.0 + 3.2 * mag ** 6; d = np.hypot(xx - px, yy - py); stroke(d < rad + 1.2, (0.95, 0.88, 0.66), 1.0)
cons = [[3, 17, 41, 58, 77], [102, 130, 151, 160], [201, 222, 240, 266], [180, 195, 233], [250, 262, 271]]
for ch in cons:
    for a_, b_ in zip(ch, ch[1:]):
        (x0, y0, _), (x1, y1, _) = stars[a_], stars[b_]; L = math.hypot(x1 - x0, y1 - y0)
        if L > 160: continue
        t = np.clip(((xx - x0) * (x1 - x0) + (yy - y0) * (y1 - y0)) / (L * L), 0, 1); d = np.hypot(xx - x0 - t * (x1 - x0), yy - y0 - t * (y1 - y0))
        stroke(d < 0.9, (0.70, 0.62, 0.42), 0.6)
# 外框留白：四角羊皮纸角花
cm = (np.minimum(xx, TW - xx) < 14) | (np.minimum(yy, TH - yy) < 14); stroke(cm, (0.30, 0.22, 0.10), 0.9)
im = bpy.data.images.new('st_chartTex', TW, TH); im.pixels.foreach_set(np.flipud(img).ravel()); im.filepath_raw = PREV + '/lib_startable_chart.png'; im.file_format = 'PNG'; im.save(); im.pack()
cm_ = bpy.data.materials.new('st_chart'); cm_.use_nodes = True; nt = cm_.node_tree; bs = nt.nodes['Principled BSDF']; tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = im
nt.links.new(tn.outputs['Color'], bs.inputs['Base Color']); nt.links.new(tn.outputs['Color'], bs.inputs['Emission Color']); bs.inputs['Emission Strength'].default_value = 0.18; bs.inputs['Roughness'].default_value = 0.85; bs.inputs['Specular IOR Level'].default_value = 0.2
me = bpy.data.meshes.new('chart'); bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
vs = [bm.verts.new(onslope(u, v, 0.003)) for (u, v) in [(-CW / 2, -CD / 2), (CW / 2, -CD / 2), (CW / 2, CD / 2), (-CW / 2, CD / 2)]]
f = bm.faces.new(vs)
for lp, uv in zip(f.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]): lp[uvl].uv = uv
bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('chart', me); S.collection.objects.link(o); o.data.materials.append(cm_)
# —— 黄铜平面星盘（左前角压在星图上）——
pu, pv = -0.36, -0.12
def disc(r, t, m, lift, v=64):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=t, location=onslope(pu, pv, lift)); o = bpy.context.object; o.rotation_euler = (ANG - math.pi / 2 + math.pi / 2, 0, 0); return add(o, m)
def ring(R, r, m, lift):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=72, minor_segments=8, location=onslope(pu, pv, lift)); o = bpy.context.object; o.rotation_euler = (ANG, 0, 0); o.scale = (1, 1, 0.5); return add(o, m)
disc(0.17, 0.008, 'brassD', 0.012); ring(0.17, 0.008, 'brass', 0.017); ring(0.13, 0.004, 'brass', 0.018); ring(0.075, 0.004, 'brass', 0.019)
for k in range(12):  # 网环辐条
    a = k * math.pi / 6; u, v = pu + 0.10 * math.cos(a), pv + 0.10 * math.sin(a)
    bpy.ops.mesh.primitive_cube_add(size=1, location=onslope(u, v, 0.019)); o = bpy.context.object; o.scale = (0.06, 0.004, 0.003); o.rotation_euler = (ANG, 0, 0); o.rotation_euler.rotate_axis('Z', -a); add(o, 'brass')
for k in range(72):
    a = k * math.pi / 36; L = 0.02 if k % 6 == 0 else 0.01; u, v = pu + (0.155 - L / 2) * math.cos(a), pv + (0.155 - L / 2) * math.sin(a)
    bpy.ops.mesh.primitive_cube_add(size=1, location=onslope(u, v, 0.0175)); o = bpy.context.object; o.scale = (L, 0.0015, 0.002); o.rotation_euler = (ANG, 0, 0); o.rotation_euler.rotate_axis('Z', -a); add(o, 'ink')
bpy.ops.mesh.primitive_cube_add(size=1, location=onslope(pu, pv, 0.024)); o = bpy.context.object; o.scale = (0.34, 0.016, 0.003); o.rotation_euler = (ANG, 0, 0); o.rotation_euler.rotate_axis('Z', -0.6); add(o, 'brass')  # 指针尺
bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.012, location=onslope(pu, pv, 0.026)); add(bpy.context.object, 'brass')
# —— 黄铜立柱台灯（后沿平台右端）——
lx, lz = 0.50, ZB - ov + 0.0; ly = yb + 0.03
cyl('brass', 0.075, 0.018, lx, ly + 0.009, lz, v=32); cyl('brassD', 0.06, 0.012, lx, ly + 0.024, lz, v=32); cyl('brass', 0.035, 0.04, lx, ly + 0.05, lz, v=24, r2=0.014)
cyl('brass', 0.010, 0.36, lx, ly + 0.25, lz, v=14)
bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=8, radius=0.02, location=G(lx, ly + 0.16, lz)); add(bpy.context.object, 'brass')
# 横臂朝前伸向台面
cyl('brass', 0.008, 0.26, lx - 0.0, ly + 0.43, lz + 0.12, v=12, rot=(0, 0, 0)).rotation_euler = (math.pi / 2, 0, 0)
bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=8, radius=0.018, location=G(lx, ly + 0.43, lz)); add(bpy.context.object, 'brass')
sz_ = lz + 0.25
cyl('brass', 0.03, 0.06, lx, ly + 0.40, sz_, v=24, r2=0.015)
cyl('brass', 0.11, 0.12, lx, ly + 0.32, sz_, v=40, r2=0.035).modifiers.new('s', 'SOLIDIFY').thickness = 0.004
bpy.ops.mesh.primitive_torus_add(major_radius=0.11, minor_radius=0.006, major_segments=40, minor_segments=8, location=G(lx, ly + 0.26, sz_)); add(bpy.context.object, 'brass')
cyl('glow', 0.095, 0.004, lx, ly + 0.27, sz_, v=32)
# —— 合并导出 ——
for o in list(S.objects):
    for md in list(o.modifiers): bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
# 批次44：join 只保留活动物体的 UV 层——其余部件无 UV 时星图板 UV 全归零，只采到贴图角上的褐边（预览里读成近黑橄榄色的真因）→ 合并前给每个网格补同名 UVMap
for o in S.objects:
    if o.type == 'MESH' and 'UVMap' not in o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
bpy.ops.object.select_all(action='SELECT'); bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); bpy.ops.object.join(); S.objects[0].name = 'lib_startable'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
ob = S.objects[0]; print('tris', sum(len(p.vertices) - 2 for p in ob.data.polygons), 'dims', tuple(round(v, 3) for v in ob.dimensions))
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.32, 0.30, 0.28, 1)
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 2.8; sun.rotation_euler = (math.radians(50), 0, math.radians(-30))
bpy.ops.mesh.primitive_plane_add(size=6); bpy.context.object.data.materials.append(mat('floor', (0.15, 0.085, 0.045), 0.5))
S.render.engine = 'CYCLES'; S.cycles.samples = 32; S.cycles.use_denoising = False; S.render.resolution_x = 800; S.render.resolution_y = 640
for i, (cp, tg) in enumerate([(G(1.3, 1.9, 2.3), G(0, 0.75, 0)), (G(-1.5, 1.2, 1.4), G(0, 0.7, 0))]):
    bpy.ops.object.camera_add(location=cp); cam = bpy.context.object; S.camera = cam
    cam.rotation_euler = (Vector(tg) - Vector(cp)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 35
    S.render.filepath = f'{PREV}/lib_startable_{i}.png'; bpy.ops.render.render(write_still=True)
