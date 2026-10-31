# 批次35：指挥中心值班长台（60–70 年代机关大台：胡桃木柜体 + 正面三联凸起芯板 + 铜包边 / 铜踢脚 + 两侧抽屉柜 + 操作员侧容膝洞
#   + 台上老式电话交换机 / 对讲台：胶木斜面面板、插孔阵列、拨动开关、指示灯、两部胶木话机与卷线）
# 尺寸沿用旧方盒 6 × 1.2 × 1.0（台面黑玛瑙板 1.00–1.06 仍由游戏铺，锚点不变）。
# 原点 = 台体中心地面；Blender +Y = 操作员侧（周闻座椅，glTF −Z），−Y = 正面（朝主屏，日志纸带贴在 y ≈ −0.62）。
# 用法：blender -b --python cc_duty_desk.py -- out.glb
import bpy, bmesh, sys, math
from mathutils import Matrix, Vector
out = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
COL = {'dd_walnut': (0.15, 0.075, 0.035, 0.42, 0), 'dd_walnutDark': (0.08, 0.04, 0.02, 0.5, 0), 'dd_brass': (0.6, 0.42, 0.19, 0.3, 0.95),
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
W, D, H = 6.0, 1.2, 1.0
FY = -D / 2  # 正面
# --- 柜体 ---
box('dd_walnutDark', 0, 0, 0.05, W - 0.08, D - 0.1, 0.1)                         # 退进踢脚（深色）
box('dd_brass', 0, FY + 0.045, 0.012, W - 0.06, 0.012, 0.024)                       # 正面铜踢脚条
box('dd_walnut', 0, 0, H - 0.04, W, D, 0.08, bev=0.012)                            # 顶框（玛瑙台面下的木框，前沿倒圆）
box('dd_brass', 0, FY - 0.004, H - 0.04, W + 0.008, 0.008, 0.05)                   # 顶框铜包边（正面）
for sx in (-1, 1): box('dd_brass', sx * (W / 2 + 0.004), 0, H - 0.04, 0.008, D + 0.008, 0.05)
# 正面三联框架：立梃 4 根 + 上下冒头，中间凸起芯板（斜边 + 平心）+ 铜线脚
box('dd_walnut', 0, FY + 0.03, 0.55, W - 0.02, 0.06, 0.8)                           # 正面背衬板
posts = [-W / 2 + 0.07, -1.0, 1.0, W / 2 - 0.07]
for x in posts: box('dd_walnut', x, FY + 0.005, 0.55, 0.14, 0.03, 0.8, bev=0.006)
for z in (0.17, 0.93): box('dd_walnut', 0, FY + 0.005, z, W - 0.02, 0.03, 0.08, bev=0.006)
for a, b in zip(posts[:-1], posts[1:]):
    cx, w = (a + b) / 2, (b - a) - 0.14
    box('dd_walnut', cx, FY + 0.012, 0.55, w - 0.02, 0.016, 0.66)                   # 芯板斜边（低）
    box('dd_walnut', cx, FY + 0.0, 0.55, w - 0.18, 0.02, 0.5, bev=0.01)             # 芯板平心（凸起）
    for z in (0.215, 0.885): box('dd_brass', cx, FY - 0.002, z, w, 0.006, 0.01)      # 铜线脚
    for x in (cx - w / 2, cx + w / 2): box('dd_brass', x, FY - 0.002, 0.55, 0.01, 0.006, 0.68)
# 中联芯板正中：铜徽章框（圆形）
cyl('dd_brass', 0, FY - 0.012, 0.55, 0.12, 0.012, axis='Y', seg=32)
cyl('dd_walnutDark', 0, FY - 0.019, 0.55, 0.095, 0.004, axis='Y', seg=32)
# 侧板（框 + 芯板）
for sx in (-1, 1):
    x = sx * (W / 2 - 0.02)
    box('dd_walnut', x, 0, 0.55, 0.04, D - 0.02, 0.8)
    box('dd_walnut', x + sx * 0.012, 0, 0.55, 0.02, D - 0.3, 0.56, bev=0.008)
# --- 操作员侧：两侧抽屉柜 + 容膝洞 ---
BY = D / 2
for sx in (-1, 1):
    px = sx * 2.05
    box('dd_walnut', px, BY - 0.01, 0.55, 1.6, 0.02, 0.8)
    for i, (z, h) in enumerate([(0.82, 0.18), (0.6, 0.24), (0.32, 0.3)]):
        for dx in (-0.39, 0.39):
            box('dd_walnut', px + dx, BY + 0.005, z, 0.74, 0.02, h - 0.03, bev=0.006)
            box('dd_brass', px + dx, BY + 0.025, z + h * 0.16, 0.14, 0.016, 0.018, bev=0.004)
            for e in (-1, 1): cyl('dd_brass', px + dx + e * 0.06, BY + 0.018, z + h * 0.16, 0.008, 0.016, axis='Y', seg=8)
            box('dd_brass', px + dx, BY + 0.017, z + h * 0.36, 0.07, 0.004, 0.028)        # 卡片框
            box('dd_ivory', px + dx, BY + 0.0185, z + h * 0.36, 0.058, 0.003, 0.018)
box('dd_walnutDark', 0, BY - 0.35, 0.55, 2.3, 0.02, 0.8)                             # 容膝洞背板（凹进）
box('dd_walnut', 0, BY - 0.02, 0.86, 2.5, 0.04, 0.12, bev=0.006)                     # 中抽屉
box('dd_brass', 0, BY + 0.002, 0.86, 0.2, 0.014, 0.016, bev=0.003)
# --- 台上：电话交换机 / 对讲台（原 paintedSteel 方块位置 x = −2.0）---
T = H + 0.06  # 玛瑙台面顶
SX = -2.0
box('dd_walnut', SX, -0.05, T + 0.05, 0.9, 0.5, 0.1, bev=0.01)                       # 木底座
ang = math.radians(32); Rf = Matrix.Rotation(-ang, 3, 'X')
c = Vector((SX, -0.1, T + 0.22))
box('dd_bakelite', SX, 0, 0, 0.84, 0.05, 0.34, bev=0.008, rot=Rf).location = c           # 斜面主面板（朝操作员 +Y 后仰）
box('dd_bakelite', SX, -0.2, T + 0.2, 0.84, 0.12, 0.3, bev=0.01)                     # 后机箱
box('dd_steel', SX, -0.27, T + 0.2, 0.8, 0.02, 0.24)                                  # 后盖钢板（散热百叶由下方横条）
for k in range(6): box('dd_chrome', SX, -0.282, T + 0.11 + k * 0.035, 0.6, 0.004, 0.008)
for row in range(3):
    for col in range(10):
        x = (col - 4.5) * 0.072
        p = Rf @ Vector((x, 0.028, 0.1 - row * 0.075)) + c
        cyl('dd_brass', p.x, p.y, p.z, 0.011, 0.008, axis='Y', seg=10, rot=Rf)        # 插孔铜圈
        if row == 0:
            q = Rf @ Vector((x, 0.03, 0.14)) + c
            cyl(['dd_lampG', 'dd_lampA', 'dd_lampR', 'dd_lampG', 'dd_lampG'][col % 5], q.x, q.y, q.z, 0.008, 0.008, axis='Y', seg=8, rot=Rf)
for col in range(8):  # 前沿拨杆键排
    x = (col - 3.5) * 0.09
    p = Vector((SX + x, 0.16, T + 0.11))
    box('dd_chrome', p.x, p.y, p.z, 0.02, 0.05, 0.012)
    cyl('dd_ivory', p.x, p.y + 0.02, p.z + 0.03, 0.006, 0.05, rot=Matrix.Rotation(0.4 * (1 if col % 2 else -1), 3, 'X'))
box('dd_chrome', SX, 0.0, T + 0.38, 0.7, 0.02, 0.03)                                  # 顶部铭牌条
box('dd_brass', SX, 0.012, T + 0.38, 0.4, 0.006, 0.02)
# 两部胶木话机（叉簧 + 听筒 + 拨号盘）+ 卷线
for ox in (-0.62, 0.62):
    px = SX + ox if ox < 0 else 0.3
    py = 0.15
    box('dd_bakelite', px, py, T + 0.05, 0.22, 0.24, 0.1, bev=0.025)
    box('dd_bakelite', px, py - 0.02, T + 0.11, 0.18, 0.16, 0.04, bev=0.015)
    cyl('dd_ivory', px, py + 0.06, T + 0.105, 0.05, 0.006, seg=24, rot=Matrix.Rotation(-0.5, 3, 'X'))     # 拨号盘
    cyl('dd_chrome', px, py + 0.06, T + 0.11, 0.012, 0.01, seg=10, rot=Matrix.Rotation(-0.5, 3, 'X'))
    for e in (-1, 1): box('dd_bakelite', px + e * 0.085, py - 0.04, T + 0.15, 0.025, 0.05, 0.04, bev=0.006)  # 叉簧
    box('dd_bakelite', px, py - 0.04, T + 0.2, 0.24, 0.045, 0.04, bev=0.015)                              # 听筒柄
    for e in (-1, 1): cyl('dd_bakelite', px + e * 0.115, py - 0.04, T + 0.175, 0.035, 0.05, seg=16)        # 听 / 话筒杯
    for i in range(14):  # 卷线（螺旋）
        a = i * 0.9; cyl('dd_bakelite', px + 0.13 + i * 0.012, py - 0.05 + 0.012 * math.cos(a), T + 0.015 + 0.012 * math.sin(a), 0.004, 0.012, axis='X', seg=6)
# 台灯（铜底绿罩银行灯）在台右侧 x = +2.3
LX = 2.3
cyl('dd_brass', LX, -0.15, T + 0.012, 0.09, 0.024, seg=24)
cyl('dd_brass', LX, -0.15, T + 0.2, 0.012, 0.35, seg=10)
box('dd_brass', LX, -0.1, T + 0.37, 0.016, 0.1, 0.016)
bm = bmesh.new(); r = bmesh.ops.create_cone(bm, cap_ends=False, segments=24, radius1=0.12, radius2=0.12, depth=0.36)
bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'), verts=r['verts'])
for v in bm.verts:
    if v.co.z < -0.01: v.co.z = -0.01  # 半圆筒罩
bmesh.ops.translate(bm, vec=(LX, -0.05, T + 0.38), verts=bm.verts[:]); _link('dd_lampG', bm)
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
