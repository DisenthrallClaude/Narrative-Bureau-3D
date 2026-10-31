# 批次34：指挥中心操作员控制台（60–70 年代：胡桃木台面倒圆 + 绿呢书写垫 + 灰绿烤漆钢柜体 + 两侧三抽屉柜铜拉手 + 黑踢脚
#   + 显示器后台架 + 斜面仪表条（拨动开关 / 指示灯）+ 三台 CRT 监视器外壳（前框留屏口，屏幕由游戏贴 canvas）
# 原点 = 台体中心地面；Blender +Y = 操作员侧（glTF −Z），−Y = 背面。屏口前沿 y = −0.33，与 eastwing.js 原显示器位置对齐。
# 用法：blender -b --python cc_console.py -- out.glb
import bpy, bmesh, sys, math
from mathutils import Matrix, Vector
out = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
COL = {'cc_walnut': (0.16, 0.08, 0.04, 0.45, 0), 'cc_baize': (0.06, 0.12, 0.08, 0.9, 0), 'cc_steel': (0.17, 0.2, 0.18, 0.5, 0.35), 'cc_brass': (0.55, 0.38, 0.17, 0.35, 0.9),
       'cc_black': (0.02, 0.02, 0.02, 0.6, 0.2), 'cc_bakelite': (0.035, 0.03, 0.028, 0.35, 0), 'cc_lampR': (0.8, 0.08, 0.05, 0.3, 0), 'cc_lampG': (0.1, 0.7, 0.2, 0.3, 0), 'cc_lampA': (0.9, 0.55, 0.1, 0.3, 0), 'cc_chrome': (0.7, 0.7, 0.7, 0.2, 1.0)}
def mat(n):
    m = bpy.data.materials.get(n)
    if not m:
        c = COL[n]; m = bpy.data.materials.new(n); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = (*c[:3], 1); b.inputs['Roughness'].default_value = c[3]; b.inputs['Metallic'].default_value = c[4]
    return m
objs = []
def box(mn, cx, cy, cz, sx, sy, sz, bev=0.0, rot=None, parent_rot=None):
    bm = bmesh.new(); r = bmesh.ops.create_cube(bm, size=1.0); vs = r['verts']
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=vs)
    if rot: bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=rot, verts=vs)
    bmesh.ops.translate(bm, vec=(cx, cy, cz), verts=vs)
    if parent_rot: bmesh.ops.rotate(bm, cent=parent_rot[0], matrix=parent_rot[1], verts=vs)
    me = bpy.data.meshes.new(mn); bm.to_mesh(me); bm.free(); me.materials.append(mat(mn))
    o = bpy.data.objects.new(mn, me); bpy.context.scene.collection.objects.link(o)
    if bev: md = o.modifiers.new('b', 'BEVEL'); md.width = bev; md.segments = 3; md.limit_method = 'ANGLE'
    objs.append(o); return o
def cyl(mn, cx, cy, cz, r, h, axis='Z', seg=12, rot=None):
    bm = bmesh.new(); res = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=h); vs = res['verts']
    if axis == 'Y': bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'X'), verts=vs)
    if rot: bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=rot, verts=vs)
    bmesh.ops.translate(bm, vec=(cx, cy, cz), verts=vs)
    me = bpy.data.meshes.new(mn); bm.to_mesh(me); bm.free(); me.materials.append(mat(mn)); o = bpy.data.objects.new(mn, me); bpy.context.scene.collection.objects.link(o); objs.append(o); return o
W, D, TOP = 3.6, 1.0, 0.76
# 台面（前沿大倒圆）+ 绿呢书写垫 + 铜压条
box('cc_walnut', 0, 0, TOP - 0.0225, W, D, 0.045, bev=0.018)
box('cc_baize', 0, 0.2, TOP + 0.001, 2.2, 0.42, 0.004)
for y in (-0.012, 0.412): box('cc_brass', 0, y, TOP + 0.003, 2.22, 0.012, 0.006)
for x in (-1.11, 1.11): box('cc_brass', x, 0.2, TOP + 0.003, 0.012, 0.432, 0.006)
# 柜体：背板（挡板）+ 两侧抽屉柜 + 踢脚
box('cc_steel', 0, -0.45, 0.4, W - 0.1, 0.04, 0.66, bev=0.004)
for sx in (-1, 1):
    px = sx * (W / 2 - 0.27)
    box('cc_steel', px, -0.02, 0.4, 0.5, 0.86, 0.66, bev=0.006)
    box('cc_black', px, -0.02, 0.04, 0.46, 0.8, 0.08)  # 踢脚退进
    for i, (z, h) in enumerate([(0.62, 0.16), (0.42, 0.2), (0.19, 0.24)]):
        box('cc_steel', px, 0.415, z, 0.44, 0.02, h - 0.02, bev=0.005)  # 抽屉面
        box('cc_brass', px, 0.435, z + h * 0.18, 0.12, 0.018, 0.018, bev=0.004)  # 铜拉手
        for e in (-1, 1): box('cc_brass', px + e * 0.06, 0.428, z + h * 0.18, 0.012, 0.012, 0.012)
        box('cc_chrome', px, 0.426, z + h * 0.36, 0.05, 0.004, 0.022)  # 标签框
# 显示器后台架（台面后沿抬高 0.1 m）+ 斜面仪表条（20°）
box('cc_steel', 0, -0.36, TOP + 0.05, W - 0.08, 0.26, 0.1, bev=0.006)
ang = math.radians(-24); R = Matrix.Rotation(ang, 3, 'X'); c = Vector((0, -0.17, TOP + 0.045))
box('cc_bakelite', 0, 0, 0, W - 0.3, 0.13, 0.03, rot=R).location = c
k = 0
for i in range(-15, 16):
    x = i * 0.105
    if abs(x) > 1.6: continue
    local = R @ Vector((x, -0.025, 0.018)) + c
    if i % 4 == 0:
        mn = ['cc_lampG', 'cc_lampA', 'cc_lampR'][k % 3]; cyl(mn, local.x, local.y, local.z, 0.011, 0.012, rot=R); k += 1
    else:
        cyl('cc_chrome', local.x, local.y, local.z, 0.009, 0.008, rot=R)
        t = R @ Vector((x, -0.025, 0.04)) + c; cyl('cc_chrome', t.x, t.y, t.z, 0.0035, 0.04, rot=R @ Matrix.Rotation(0.35 * (1 if i % 2 else -1), 3, 'X'))
    lab = R @ Vector((x, 0.035, 0.016)) + c; box('cc_chrome', lab.x, lab.y, lab.z, 0.06, 0.012, 0.002, rot=R)
# CRT 监视器 ×3：前框（屏口 0.84×0.46）+ 收腰后壳 + 底座；绕自身中心转 −m·0.25
for m in (-1, 0, 1):
    cx, cz = m * 0.95, 1.12; piv = (Vector((cx, -0.33, cz)), Matrix.Rotation(-m * 0.25, 3, 'Z'))
    fy = -0.35  # 前框中面
    for (bx, bz, sx, sz) in [(0, 0.25, 0.92, 0.05), (0, -0.25, 0.92, 0.07), (-0.445, 0, 0.03, 0.5), (0.445, 0, 0.03, 0.5)]:
        box('cc_bakelite', cx + bx, fy, cz + bz, sx, 0.05, sz, bev=0.008, parent_rot=piv)
    box('cc_black', cx, fy - 0.03, cz, 0.86, 0.02, 0.48, parent_rot=piv)  # 屏后黑底
    # 收腰后壳：3 段递缩
    for i, (d, s) in enumerate([(0.1, 1.0), (0.12, 0.82), (0.1, 0.6)]):
        y0 = fy - 0.025 - sum(q[0] for q in [(0.1, 1.0), (0.12, 0.82), (0.1, 0.6)][:i]) - d / 2
        box('cc_bakelite', cx, y0, cz - 0.02 * i, 0.9 * s, d, 0.5 * s, bev=0.01, parent_rot=piv)
    box('cc_steel', cx, fy - 0.15, TOP + 0.1 + 0.03, 0.4, 0.26, 0.06, bev=0.006, parent_rot=piv)  # 底座
    lab = box('cc_brass', cx + 0.3, fy + 0.026, cz - 0.255, 0.12, 0.004, 0.025, parent_rot=piv)  # 铭牌
    cyl('cc_lampG', cx - 0.38, fy + 0.03, cz - 0.255, 0.008, 0.01, axis='Y')
# 按材质合并（游戏里每种材质一个 InstancedMesh，24 台只 ~10 次绘制）
for o in objs:
    bpy.context.view_layer.objects.active = o
    for md in list(o.modifiers): bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.modifier_apply(modifier=md.name); o.select_set(False)
groups = {}
for o in objs: groups.setdefault(o.data.materials[0].name, []).append(o)
for mn, L in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in L: o.select_set(True)
    bpy.context.view_layer.objects.active = L[0]; bpy.ops.object.join(); L[0].name = mn
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, use_selection=True)
