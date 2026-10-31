# 批次33：60–80 年代街屋立面模块（每个模块 = 一个开间，原点在开间底边中点、立面平面上；Blender +Y 朝街 → glTF +Z）
# 材质名：sh_stone（水刷石窗套 / 窗台 / 檐板）、sh_glass（玻璃）、sh_frame（木窗框，枣红漆）、sh_iron（阳台铁栏）、sh_conc（阳台板 / 雨棚骨架）、sh_canvas（雨棚帆布）
# 用法：blender -b --python street_house.py -- outdir
import bpy, bmesh, sys, os, math
out = sys.argv[sys.argv.index('--') + 1]; os.makedirs(out, exist_ok=True)
COL = {'sh_stone': (0.62, 0.58, 0.5), 'sh_glass': (0.03, 0.04, 0.05), 'sh_frame': (0.32, 0.1, 0.07), 'sh_iron': (0.05, 0.05, 0.05), 'sh_conc': (0.5, 0.49, 0.46), 'sh_canvas': (0.42, 0.12, 0.08)}
def mat(n):
    m = bpy.data.materials.get(n)
    if not m:
        m = bpy.data.materials.new(n); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (*COL[n], 1)
        b.inputs['Roughness'].default_value = 0.2 if n == 'sh_glass' else 0.8; b.inputs['Metallic'].default_value = 0.7 if n == 'sh_iron' else 0
    return m
class Mod:
    def __init__(s, name): s.name = name; s.bm = bmesh.new(); s.mats = []
    def box(s, mn, cx, cy, cz, sx, sy, sz, rx=0.0):  # cy = 离立面向外（+Y 朝街）
        if mn not in s.mats: s.mats.append(mn)
        mi = s.mats.index(mn); r = bmesh.ops.create_cube(s.bm, size=1.0)
        vs = r['verts']; bmesh.ops.scale(s.bm, vec=(sx, sy, sz), verts=vs)
        if rx: bmesh.ops.rotate(s.bm, cent=(0, 0, 0), matrix=__import__('mathutils').Matrix.Rotation(rx, 3, 'X'), verts=vs)
        bmesh.ops.translate(s.bm, vec=(cx, cy, cz), verts=vs)
        for f in {f for v in vs for f in v.link_faces}: f.material_index = mi
    def done(s):
        me = bpy.data.meshes.new(s.name); s.bm.to_mesh(me); s.bm.free()
        for mn in s.mats: me.materials.append(mat(mn))
        o = bpy.data.objects.new(s.name, me); bpy.context.scene.collection.objects.link(o); return o
def window(m, W=1.5, H=1.75, z0=0.95, bal=False):
    # 窗洞玻璃（退进 0.12）+ 枣红木框十字分格 + 水刷石窗套（凸出 0.08）+ 带滴水的出挑窗台 + 窗楣
    m.box('sh_glass', 0, -0.1, z0 + H / 2, W, 0.02, H)
    for x in (-W / 2 + 0.03, W / 2 - 0.03, 0): m.box('sh_frame', x, -0.08, z0 + H / 2, 0.06, 0.06, H)
    for z in (z0 + 0.03, z0 + H - 0.03, z0 + H * 0.68): m.box('sh_frame', 0, -0.08, z, W, 0.06, 0.06)
    t = 0.16
    for sx in (-1, 1): m.box('sh_stone', sx * (W / 2 + t / 2), 0.04, z0 + H / 2, t, 0.08, H + 0.02)
    m.box('sh_stone', 0, 0.06, z0 + H + 0.1, W + 2 * t + 0.08, 0.12, 0.2)  # 窗楣
    m.box('sh_stone', 0, 0.12, z0 + H + 0.22, W + 2 * t + 0.16, 0.2, 0.05)  # 楣上压顶
    if not bal:
        m.box('sh_stone', 0, 0.07, z0 - 0.04, W + 2 * t + 0.12, 0.22, 0.08)  # 窗台
        m.box('sh_stone', 0, 0.16, z0 - 0.095, W + 2 * t + 0.12, 0.04, 0.03)  # 滴水
def balcony(m, W=2.6, z=0.0):
    D = 0.95
    m.box('sh_conc', 0, D / 2, z + 0.06, W, D, 0.12); m.box('sh_conc', 0, D - 0.02, z - 0.02, W, 0.06, 0.08)  # 阳台板 + 板边滴水
    H = 1.05
    m.box('sh_iron', 0, D - 0.06, z + 0.12 + H, W - 0.04, 0.05, 0.04)  # 扶手
    m.box('sh_iron', 0, D - 0.06, z + 0.24, W - 0.04, 0.03, 0.03)  # 下横档
    for sx in (-1, 1): m.box('sh_iron', sx * (W / 2 - 0.03), D / 2, z + 0.12 + H, 0.04, D - 0.1, 0.04); m.box('sh_iron', sx * (W / 2 - 0.03), D / 2, z + 0.24, 0.03, D - 0.1, 0.03)
    n = int((W - 0.1) / 0.14)
    for i in range(n + 1):
        x = -W / 2 + 0.05 + i * (W - 0.1) / n; m.box('sh_iron', x, D - 0.06, z + 0.12 + H / 2, 0.018, 0.018, H)
    for sx in (-1, 1):
        for j in range(1, 6): m.box('sh_iron', sx * (W / 2 - 0.03), 0.05 + j * (D - 0.1) / 6, z + 0.12 + H / 2, 0.018, 0.018, H)
    for x in (-W / 4, W / 4): m.box('sh_iron', x, D - 0.06, z + 0.62, 0.5, 0.012, 0.012)  # 中腰装饰横条
# A：普通窗开间（3.4 × 3.2）
m = Mod('sh_bay_win'); window(m); m.box('sh_stone', 0, 0.03, 0.06, 3.4, 0.06, 0.12)  # 楼板腰线
m.done()
# B：阳台开间（落地门 + 阳台铁栏）
m = Mod('sh_bay_bal'); window(m, W=1.2, H=2.3, z0=0.12, bal=True); balcony(m, 2.6, 0.0); m.box('sh_stone', 0, 0.03, 0.06, 3.4, 0.06, 0.12)
m.done()
# C：底层店面开间（5 × 4.2）：水刷石勒脚 + 橱窗 + 门 + 招牌框 + 斜雨棚
m = Mod('sh_shop')
m.box('sh_stone', 0, 0.05, 0.25, 5.0, 0.1, 0.5)  # 勒脚
for sx in (-1, 1): m.box('sh_stone', sx * 2.35, 0.06, 2.1, 0.3, 0.12, 4.2)  # 壁柱
m.box('sh_glass', -0.6, -0.08, 1.65, 2.9, 0.02, 2.3); m.box('sh_glass', 1.45, -0.08, 1.35, 1.0, 0.02, 2.5)
for x in (-2.05, -0.6, 0.85, 0.95, 1.95): m.box('sh_frame', x, -0.06, 1.65, 0.07, 0.07, 2.4)
for z in (0.52, 2.82): m.box('sh_frame', 0, -0.06, z, 4.4, 0.07, 0.07)
m.box('sh_stone', 0, 0.08, 3.6, 4.6, 0.16, 0.9)  # 招牌底板（游戏里招牌字由着色器画在墙上，这里只给框）
m.box('sh_frame', 0, 0.17, 3.6, 4.4, 0.02, 0.7)
# 雨棚：铁骨 + 帆布斜面
m.box('sh_canvas', 0, 0.55, 2.98, 4.5, 1.1, 0.03, rx=math.radians(-18)); m.box('sh_canvas', 0, 1.06, 2.72, 4.5, 0.03, 0.22)
for sx in (-1, 0, 1): m.box('sh_iron', sx * 2.2, 0.55, 2.93, 0.03, 1.15, 0.03, rx=math.radians(-18))
m.box('sh_stone', 0, 0.12, 4.15, 5.0, 0.24, 0.1)  # 店面檐板
m.done()
for o in [o for o in bpy.data.objects if o.name.startswith('sh_')]:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.export_scene.gltf(filepath=os.path.join(out, o.name + '.glb'), use_selection=True, export_apply=True)
    print('EXPORT', o.name, len(o.data.polygons) * 2, flush=True)
