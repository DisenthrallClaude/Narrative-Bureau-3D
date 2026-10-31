# 批次36：市民服务大厅 ① 引导台（原 dz_wain 方盒 + 黑玛瑙台面）→ 60–70 年代机关接待台：胡桃木正面三联凸起芯板 + 铜线脚 / 铜踢脚 + 中联铜牌框；
#   两侧芯板；职员侧 3 屉抽屉柜（铜卡片框 + 拉手）+ 文件格 + 容膝洞。尺寸 1.8 × 0.7 × 1.0（黑玛瑙台面 1.00–1.05 仍由游戏铺，碰撞盒不变）。
# 原点 = 台体中心地面；Blender +Y = 市民侧（glTF −Z，游戏北）。用法：blender -b --python guide_desk.py -- out.glb
import bpy, bmesh, sys, math
from mathutils import Matrix, Vector
out = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
COL = {'gd_walnut': (0.16, 0.08, 0.036, 0.4, 0), 'gd_walnutDark': (0.07, 0.035, 0.018, 0.5, 0), 'gd_brass': (0.62, 0.44, 0.2, 0.28, 0.95), 'gd_plinth': (0.03, 0.03, 0.03, 0.4, 0), 'dd_walnut': (0.15, 0.075, 0.035, 0.42, 0), 'dd_walnutDark': (0.08, 0.04, 0.02, 0.5, 0), 'dd_brass': (0.6, 0.42, 0.19, 0.3, 0.95),
       'dd_bakelite': (0.03, 0.026, 0.024, 0.3, 0), 'dd_steel': (0.17, 0.2, 0.18, 0.5, 0.35), 'dd_chrome': (0.72, 0.72, 0.72, 0.18, 1.0),
       'dd_lampR': (0.8, 0.08, 0.05, 0.3, 0), 'dd_lampG': (0.1, 0.7, 0.2, 0.3, 0), 'dd_lampA': (0.9, 0.55, 0.1, 0.3, 0), 'dd_ivory': (0.75, 0.7, 0.58, 0.45, 0)}
def mat(n):
    m = bpy.data.materials.get(n)
    if not m:
        c = COL[n]; m = bpy.data.materials.new(n); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = (*c[:3], 1); b.inputs['Roughness'].default_value = c[3]; b.inputs['Metallic'].default_value = c[4]
    return m
objs = []
def _link(mn, bm, bev=0.0):
    me = bpy.data.meshes.new(mn); bm.to_mesh(me); bm.free(); me.materials.append(mat(mn))
    o = bpy.data.objects.new(mn, me); bpy.context.scene.collection.objects.link(o)
    if bev: md = o.modifiers.new('b', 'BEVEL'); md.width = bev; md.segments = 2; md.limit_method = 'ANGLE'
    objs.append(o); return o
def box(mn, cx, cy, cz, sx, sy, sz, bev=0.0, rot=None, piv=None):
    bm = bmesh.new(); vs = bmesh.ops.create_cube(bm, size=1.0)['verts']
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=vs)
    if rot: bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=rot, verts=vs)
    bmesh.ops.translate(bm, vec=(cx, cy, cz), verts=vs)
    if piv: bmesh.ops.rotate(bm, cent=piv[0], matrix=piv[1], verts=vs)
    return _link(mn, bm, bev)
def cyl(mn, cx, cy, cz, r, h, axis='Z', seg=12, rot=None, r2=None):
    bm = bmesh.new(); vs = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)['verts']
    if axis == 'Y': bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'X'), verts=vs)
    if axis == 'X': bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'), verts=vs)
    if rot: bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=rot, verts=vs)
    bmesh.ops.translate(bm, vec=(cx, cy, cz), verts=vs)
    return _link(mn, bm)

W, D, H = 1.8, 0.7, 1.0
FY = D / 2   # 正面（市民侧）= Blender +Y = glTF −Z（游戏北）
# 退进黑色踢脚 + 铜踢脚板（正面 / 两侧）
box('gd_plinth', 0, 0, 0.05, W - 0.06, D - 0.06, 0.1)
box('gd_brass', 0, FY - 0.035, 0.06, W - 0.04, 0.012, 0.11)
for sx in (-1, 1): box('gd_brass', sx * (W / 2 - 0.035), 0, 0.06, 0.012, D - 0.08, 0.11)
# 柜体：正面板 + 两侧板 + 背侧（职员侧）两边柱，中间容膝洞
box('gd_walnut', 0, FY - 0.04, 0.525, W, 0.06, 0.85, bev=0.012)
for sx in (-1, 1): box('gd_walnut', sx * (W / 2 - 0.03), 0, 0.525, 0.06, D, 0.85, bev=0.012)
# 正面三联凸起芯板：外框铜线脚 + 胡桃凸芯 + 中联铜徽框
PW = (W - 0.16) / 3
for i in (-1, 0, 1):
    cx = i * (PW + 0.02)
    for (dx, dz, sx, sz) in ((0, 0.34, PW - 0.04, 0.012), (0, -0.34, PW - 0.04, 0.012), (-(PW - 0.05) / 2, 0, 0.012, 0.69), ((PW - 0.05) / 2, 0, 0.012, 0.69)):
        box('gd_brass', cx + dx, FY + 0.0, 0.55 + dz, sx, 0.014, sz)
    box('gd_walnutDark', cx, FY - 0.005, 0.55, PW - 0.07, 0.012, 0.66)
    box('gd_walnut', cx, FY + 0.006, 0.55, PW - 0.16, 0.022, 0.54, bev=0.008)
box('gd_brass', 0, FY + 0.022, 0.58, 0.42, 0.008, 0.18, bev=0.003)     # 中联铜牌框（游戏另贴「咨询 · 引导」铜牌在 0.72）
box('gd_walnutDark', 0, FY + 0.026, 0.58, 0.38, 0.004, 0.14)
# 两侧板芯板
for sx in (-1, 1):
    box('gd_walnutDark', sx * (W / 2 + 0.001), 0, 0.55, 0.004, D - 0.16, 0.62)
    box('gd_walnut', sx * (W / 2 + 0.008), 0, 0.55, 0.014, D - 0.24, 0.5, bev=0.005)
    for dz in (-0.31, 0.31): box('gd_brass', sx * (W / 2 + 0.006), 0, 0.55 + dz, 0.01, D - 0.14, 0.012)
# 台面下沿：铜线条 + 胡桃压线（黑玛瑙台面由游戏铺在 1.00–1.05）
box('gd_walnut', 0, 0, 0.975, W + 0.02, D + 0.02, 0.05, bev=0.01)
box('gd_brass', 0, FY + 0.012, 0.955, W + 0.02, 0.012, 0.016)
for sx in (-1, 1): box('gd_brass', sx * (W / 2 + 0.012), 0, 0.955, 0.012, D + 0.02, 0.016)
# 职员侧：左抽屉柜（3 屉，铜卡片框 + 拉手）+ 右侧文件格，中间容膝洞
BY = -D / 2
box('gd_walnut', -0.55, 0, 0.525, 0.6, D - 0.1, 0.85)
for k in range(3):
    z = 0.25 + k * 0.25
    box('gd_walnut', -0.55, BY - 0.004, z, 0.56, 0.02, 0.22, bev=0.006)
    box('gd_brass', -0.55, BY - 0.018, z + 0.04, 0.09, 0.006, 0.035)
    box('gd_brass', -0.55, BY - 0.026, z - 0.03, 0.12, 0.01, 0.014, bev=0.003)
    for sx in (-1, 1): box('gd_brass', -0.55 + sx * 0.06, BY - 0.02, z - 0.03, 0.012, 0.02, 0.014)
box('gd_walnut', 0.62, 0, 0.525, 0.5, D - 0.1, 0.85)
box('gd_walnutDark', 0.62, BY + 0.02, 0.62, 0.42, 0.02, 0.6)       # 文件格内腔
for z in (0.42, 0.62, 0.82): box('gd_walnut', 0.62, BY + 0.12, z, 0.42, 0.22, 0.015)
for k in range(5): box('gd_walnutDark', 0.5 + k * 0.06, BY + 0.14, 0.495, 0.005, 0.2, 0.13)  # 斜插文件夹（简）
box('gd_walnut', 0.62, BY - 0.004, 0.2, 0.46, 0.02, 0.2, bev=0.006)
box('gd_brass', 0.62, BY - 0.026, 0.2, 0.12, 0.01, 0.014, bev=0.003)
box('gd_walnutDark', 0, FY - 0.1, 0.55, 0.62, 0.02, 0.88)           # 容膝洞背板（暗）
# 按材质合并
for o in objs:
    bpy.context.view_layer.objects.active = o
    for md in list(o.modifiers): o.select_set(True); bpy.ops.object.modifier_apply(modifier=md.name); o.select_set(False)
groups = {}
for o in objs: groups.setdefault(o.data.materials[0].name, []).append(o)
for mn, L in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in L: o.select_set(True)
    bpy.context.view_layer.objects.active = L[0]; bpy.ops.object.join(); L[0].name = mn
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, use_selection=True)
