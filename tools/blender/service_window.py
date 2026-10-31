# (helpers copied from guide_desk.py) 批次36：市民服务大厅 ① 引导台（原 dz_wain 方盒 + 黑玛瑙台面）→ 60–70 年代机关接待台：胡桃木正面三联凸起芯板 + 铜线脚 / 铜踢脚 + 中联铜牌框；
#   两侧芯板；职员侧 3 屉抽屉柜（铜卡片框 + 拉手）+ 文件格 + 容膝洞。尺寸 1.8 × 0.7 × 1.0（黑玛瑙台面 1.00–1.05 仍由游戏铺，碰撞盒不变）。
# 原点 = 台体中心地面；Blender +Y = 市民侧（glTF −Z，游戏北）。用法：blender -b --python guide_desk.py -- out.glb
import bpy, bmesh, sys, math
from mathutils import Matrix, Vector
out = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
COL = {'sw_walnut': (0.16, 0.08, 0.036, 0.4, 0), 'sw_walnutDark': (0.07, 0.035, 0.018, 0.5, 0), 'sw_brass': (0.66, 0.47, 0.2, 0.26, 0.95), 'sw_plinth': (0.03, 0.03, 0.03, 0.4, 0),
       'sw_stone': (0.018, 0.018, 0.02, 0.18, 0), 'sw_grille': (0.4, 0.28, 0.12, 0.4, 0.9), 'sw_lampHouse': (0.05, 0.05, 0.05, 0.4, 0.6)}
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


# 批次37：市民服务大厅 5 个服务窗口台（原 blackMarble 方盒 + 玛瑙板 + 平玻璃 + 金条）→ 60–70 年代机关服务窗口：
#   胡桃木框芯板柜台（正面 3 联凸芯板 + 铜线脚 / 铜踢脚）+ 黑石台面（含前沿倒圆压边）+ 铜框玻璃隔窗（3 开间铜立梃、中开间圆形铜格栅传声孔、
#   台面铜传递槽拱口）+ 顶部铜横楣 + 中央编号铜牌框（字由游戏贴）+ 两侧叫号小灯灯座（灯罩由游戏自发光）。
# 原点 = 柜台中心地面；Blender −Y = 市民侧（glTF +Z，游戏南）。平玻璃仍由游戏铺在 Blender y=+0.1（游戏 z−0.1），z 1.15–2.75。
W, D = 4.6, 1.0
FY = -D / 2   # 市民侧正面
box('sw_plinth', 0, 0.02, 0.05, W - 0.06, D - 0.1, 0.1)
box('sw_brass', 0, FY + 0.04, 0.06, W - 0.04, 0.012, 0.11)
for sx in (-1, 1): box('sw_brass', sx * (W / 2 - 0.035), 0, 0.06, 0.012, D - 0.12, 0.11)
box('sw_walnut', 0, FY + 0.05, 0.575, W, 0.06, 0.95, bev=0.012)
for sx in (-1, 1): box('sw_walnut', sx * (W / 2 - 0.03), 0, 0.575, 0.06, D - 0.04, 0.95, bev=0.012)
box('sw_walnutDark', 0, 0.3, 0.575, W - 0.12, 0.04, 0.95)      # 职员侧背板（容膝区后壁）
# 正面芯板：两侧竖梃 + 中间 5 联
N = 5; PW = (W - 0.2) / N
for i in range(N):
    cx = -W / 2 + 0.1 + PW * (i + 0.5)
    box('sw_walnutDark', cx, FY + 0.015, 0.58, PW - 0.08, 0.012, 0.72)
    box('sw_walnut', cx, FY + 0.006, 0.58, PW - 0.2, 0.026, 0.58, bev=0.01)
    for (dx, dz, sx, sz) in ((0, 0.37, PW - 0.06, 0.012), (0, -0.37, PW - 0.06, 0.012), (-(PW - 0.07) / 2, 0, 0.012, 0.75), ((PW - 0.07) / 2, 0, 0.012, 0.75)):
        box('sw_brass', cx + dx, FY + 0.012, 0.58 + dz, sx, 0.012, sz)
# 台面下沿压线 + 铜线条
box('sw_walnut', 0, 0, 1.02, W + 0.04, D + 0.04, 0.06, bev=0.012)
box('sw_brass', 0, FY - 0.012, 0.995, W + 0.04, 0.012, 0.016)
# 黑石台面（1.05–1.11，前沿 3 cm 倒圆）
box('sw_stone', 0, 0, 1.08, W + 0.1, D + 0.2, 0.06, bev=0.02)
# 玻璃隔窗铜框（平玻璃由游戏铺）：底槛 / 顶楣 / 立梃
GY = 0.1
box('sw_brass', 0, GY, 1.135, W - 0.1, 0.07, 0.05, bev=0.005)
box('sw_brass', 0, GY, 2.78, W, 0.09, 0.07, bev=0.008)
box('sw_walnut', 0, GY + 0.02, 2.9, W + 0.1, 0.16, 0.18, bev=0.01)        # 胡桃横楣
box('sw_brass', 0, GY - 0.065, 2.985, W + 0.12, 0.02, 0.02)
for x in (-2.2, -0.75, 0.75, 2.2): box('sw_brass', x, GY, 1.96, 0.05, 0.07, 1.64, bev=0.006)
# 横档（1.85 m 以上为上亮）
for sgn in (-1, 1): box('sw_brass', sgn * 1.475, GY, 2.3, 1.45, 0.05, 0.03)
box('sw_brass', 0, GY, 2.3, 1.45, 0.05, 0.03)
# 中开间圆形铜格栅传声孔（φ 0.26，环 + 放射条 + 同心环）
cyl('sw_brass', 0, GY - 0.03, 1.62, 0.15, 0.02, axis='Y', seg=36)
cyl('sw_grille', 0, GY - 0.042, 1.62, 0.125, 0.006, axis='Y', seg=36)
for k in range(8):
    box('sw_brass', 0, GY - 0.048, 1.62, 0.25, 0.006, 0.012, rot=Matrix.Rotation(k * math.pi / 8, 3, 'Y'))
cyl('sw_brass', 0, GY - 0.05, 1.62, 0.05, 0.008, axis='Y', seg=24)
# 两侧开间也开小格栅
for x in (-1.475, 1.475):
    cyl('sw_brass', x, GY - 0.03, 1.62, 0.11, 0.02, axis='Y', seg=32)
    cyl('sw_grille', x, GY - 0.042, 1.62, 0.09, 0.006, axis='Y', seg=32)
    for k in range(6): box('sw_brass', x, GY - 0.048, 1.62, 0.18, 0.006, 0.01, rot=Matrix.Rotation(k * math.pi / 6, 3, 'Y'))
# 台面铜传递槽：凹槽托盘 + 拱口框
box('sw_brass', 0, GY - 0.15, 1.115, 0.56, 0.32, 0.012, bev=0.004)
box('sw_walnutDark', 0, GY - 0.15, 1.121, 0.5, 0.26, 0.004)
box('sw_brass', 0, GY - 0.02, 1.25, 0.6, 0.04, 0.03)
for sx in (-1, 1): box('sw_brass', sx * 0.29, GY - 0.02, 1.19, 0.03, 0.04, 0.12)
# 编号铜牌框（游戏贴字）
box('sw_brass', 0, GY - 0.075, 2.9, 0.62, 0.012, 0.16, bev=0.004)
box('sw_walnutDark', 0, GY - 0.082, 2.9, 0.56, 0.004, 0.11)
# 叫号小灯灯座（两侧，灯罩游戏自发光）
for x in (-1.9, 1.9):
    box('sw_lampHouse', x, GY - 0.09, 2.9, 0.16, 0.05, 0.12, bev=0.01)
    box('sw_brass', x, GY - 0.116, 2.9, 0.18, 0.008, 0.14, bev=0.003)
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
