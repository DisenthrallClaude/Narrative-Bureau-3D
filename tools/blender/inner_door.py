# 批次50：门廊内门门扇（原 exterior.js innerVestibuleDoors 程序几何 → Blender 精建）。单扇 4.8 × 5.6 × 0.12 m 胡桃木门：
#   框架冒头 / 梃 + 2 列 × 3 行凸起芯板（芯板斜面 bevel + 铜压线四边）+ 铜包边、两面铜推板（带 4 颗铜钉）、铜踢板、门轴侧 3 只铜合页筒。
# 原点 = 门轴下端；门扇沿 Blender −X 展开（左扇；右扇游戏里镜像 scale.x=−1）。Blender +Y = 门廊侧（glTF −Z）。用法：blender -b --python inner_door.py -- out.glb
import bpy, bmesh, sys, math
from mathutils import Matrix, Vector
out = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
COL = {'id_walnut': (0.16, 0.08, 0.036, 0.42, 0), 'id_walnutDark': (0.075, 0.037, 0.018, 0.5, 0), 'id_brass': (0.66, 0.47, 0.2, 0.28, 0.95), 'sw_walnut': (0.16, 0.08, 0.036, 0.4, 0), 'sw_walnutDark': (0.07, 0.035, 0.018, 0.5, 0), 'sw_brass': (0.66, 0.47, 0.2, 0.26, 0.95), 'sw_plinth': (0.03, 0.03, 0.03, 0.4, 0),
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

W, H, T = 4.8, 5.6, 0.12
cx0 = -W / 2
# 框架：两梃 + 上冒头 + 中冒头 ×2 + 下冒头（略厚于芯板，做出凹凸）
box('id_walnut', -0.14, 0, H / 2, 0.28, T, H, bev=0.01); box('id_walnut', -W + 0.14, 0, H / 2, 0.28, T, H, bev=0.01)
box('id_walnut', cx0, 0, H - 0.14, W - 0.56, T - 0.006, 0.28, bev=0.01); box('id_walnut', cx0, 0, 0.3, W - 0.56, T - 0.006, 0.6, bev=0.01)
box('id_walnut', cx0, 0, 1.55, W - 0.56, T - 0.006, 0.26, bev=0.01); box('id_walnut', cx0, 0, 3.55, W - 0.56, T - 0.006, 0.26, bev=0.01)
box('id_walnut', cx0, 0, H / 2, 0.22, T + 0.012, H - 0.5, bev=0.01)  # 中梃（略凸出冒头，避免共面闪烁）
rows = [(0.6, 1.42), (1.68, 3.42), (3.68, H - 0.28)]
cols = [(-W + 0.28, cx0 - 0.11), (cx0 + 0.11, -0.28)]
for (z0, z1) in rows:
    for (x0, x1) in cols:
        pcx, pcz, pw, ph = (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0
        box('id_walnutDark', pcx, 0, pcz, pw, T * 0.55, ph)                       # 凹槽底板
        for fy in (-1, 1):
            box('id_walnut', pcx, fy * T * 0.3, pcz, pw - 0.2, 0.035, ph - 0.2, bev=0.03)   # 凸起芯板（斜面）
            for (dx, dz, sx, sz) in ((0, ph / 2 - 0.02, pw, 0.025), (0, -ph / 2 + 0.02, pw, 0.025), (-pw / 2 + 0.02, 0, 0.025, ph), (pw / 2 - 0.02, 0, 0.025, ph)):
                box('id_brass', pcx + dx, fy * (T / 2 + 0.004), pcz + dz, sx, 0.012, sz)    # 铜压线
# 铜包边（门扇四周窄边）
box('id_brass', -W + 0.006, 0, H / 2, 0.012, T + 0.01, H); box('id_brass', cx0, 0, H - 0.006, W, T + 0.01, 0.012)
# 铜推板 + 铜钉、铜踢板（两面）
for fy in (-1, 1):
    box('id_brass', -W + 0.42, fy * (T / 2 + 0.01), 1.35, 0.16, 0.012, 0.9, bev=0.004)
    for dz in (-0.4, 0.4):
        cyl('id_brass', -W + 0.42, fy * (T / 2 + 0.018), 1.35 + dz, 0.012, 0.01, axis='Y', seg=8)
    box('id_brass', cx0, fy * (T / 2 + 0.008), 0.12, W - 0.04, 0.012, 0.22, bev=0.003)
# 门轴侧铜合页筒 ×3
for z in (0.45, H / 2, H - 0.45): cyl('id_brass', 0.02, T / 2 + 0.02, z, 0.035, 0.3, seg=12)
for o in objs: o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
bpy.ops.object.join()
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, use_selection=True)
print('OK', out)
