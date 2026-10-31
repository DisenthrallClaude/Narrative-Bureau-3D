# 批次52：市民服务大厅叫号 / 取号机精建（eastwing.js 原 blackMetal 方盒 0.5×1.4×0.4 + 蓝色发光平面）。
# 70 年代立式取号机：墨绿烤漆柜身（倒角 + 铜包角 + 踢脚）+ 顶部铜壳显示头（三位数码管窗：暗红发光七段码「047」+ 铜框玻璃 + 上沿铜铭牌）
# + 中段斜面操作板（铜框、大号铜按钮「取号」+ 出票口与半露纸票）+ 下段检修门（铜锁孔 + 凸芯板）。游戏坐标 +Z = 正面，原点 = 占地中心地面。占地 0.5 × 0.4，高 1.4。
import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True); S = bpy.context.scene
def mat(name, col, rough=0.5, metal=0.0, emit=None, es=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = es
    return m
M = dict(enamel=mat('qm_enamelGreen', (0.045, 0.085, 0.06), 0.42), enamelD=mat('qm_enamelDark', (0.02, 0.04, 0.03), 0.5),
         brass=mat('qm_brass', (0.80, 0.60, 0.30), 0.28, 1.0), brassD=mat('qm_brassDim', (0.48, 0.35, 0.18), 0.42, 1.0),
         glass=mat('qm_glassDark', (0.02, 0.015, 0.012), 0.08), seg=mat('qm_segGlow', (1.0, 0.25, 0.08), 0.4, 0, (1.0, 0.22, 0.06), 8.0),
         segOff=mat('qm_segOff', (0.10, 0.03, 0.02), 0.5), paper=mat('qm_ticket', (0.86, 0.82, 0.70), 0.8), rubber=mat('qm_rubber', (0.02, 0.02, 0.02), 0.8),
         red=mat('qm_btnRed', (0.45, 0.05, 0.03), 0.35))
def G(x, y, z): return (x, -z, y)
def add(o, m): o.data.materials.append(M[m]); return o
def box(m, w, h, d, x, y, z, rx=0.0, bev=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=G(x, y, z)); o = bpy.context.object; o.scale = (w, d, h); o.rotation_euler = (rx, 0, 0)
    if bev: md = o.modifiers.new('b', 'BEVEL'); md.width = bev; md.segments = 3
    return add(o, m)
def cyl(m, r, d, x, y, z, v=24, rot=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=d, location=G(x, y, z)); o = bpy.context.object; o.rotation_euler = rot; return add(o, m)
W, D = 0.46, 0.36; ZF = D / 2
box('rubber', W - 0.02, 0.06, D - 0.02, 0, 0.03, 0)
box('brassD', W + 0.01, 0.02, D + 0.01, 0, 0.07, 0)
box('enamel', W, 0.86, D, 0, 0.51, 0, bev=0.012)
for sx in (-1, 1):
    for sz in (-1, 1): box('brass', 0.022, 0.86, 0.022, sx * W / 2, 0.51, sz * D / 2, bev=0.004)
# 下段检修门
box('enamelD', W - 0.1, 0.42, 0.01, 0, 0.34, ZF + 0.004); box('enamel', W - 0.16, 0.34, 0.01, 0, 0.34, ZF + 0.01, bev=0.003)
cyl('brass', 0.014, 0.012, 0.13, 0.48, ZF + 0.016, v=16); cyl('rubber', 0.004, 0.014, 0.13, 0.48, ZF + 0.018, v=8)
# 中段斜面操作板（约 25°）
# 批次53：原「方块托 + 斜板」两件拼 → 与柜身一体的倒角楔形斜台（侧面轮廓下沿圆弧收进柜身）+ 斜面内嵌深色面板 + 前沿铜圆棍
ang = math.radians(25)
import bmesh
prof = [(ZF - 0.02, 0.78)] + [(ZF + 0.11 * math.sin(t * math.pi / 2), 0.78 + 0.10 * (1 - math.cos(t * math.pi / 2))) for t in (0.25, 0.5, 0.75, 1.0)] + [(ZF + 0.11, 0.90), (ZF - 0.12, 1.005), (ZF - 0.12, 0.78)]
me = bpy.data.meshes.new('wedge'); bm = bmesh.new(); n = len(prof)
vs = [bm.verts.new(G(x, y, z)) for x in (-W / 2 + 0.006, W / 2 - 0.006) for (z, y) in prof]
bm.faces.new(vs[:n][::-1]); bm.faces.new(vs[n:])
for i in range(n): j = (i + 1) % n; bm.faces.new((vs[i], vs[j], vs[n + j], vs[n + i]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
o = bpy.data.objects.new('wedge', me); S.collection.objects.link(o); add(o, 'enamel')
md = o.modifiers.new('b', 'BEVEL'); md.width = 0.014; md.segments = 4; md.limit_method = 'ANGLE'; md.angle_limit = math.radians(30); md.harden_normals = False
box('enamelD', W - 0.07, 0.010, 0.21, 0, 0.955, ZF - 0.012, rx=ang, bev=0.004)
cyl('brass', 0.009, W - 0.02, 0, 0.895, ZF + 0.112, v=16, rot=(0, math.pi / 2, 0))
cyl('brassD', 0.055, 0.012, -0.08, 0.965, ZF + 0.07 - 0.07, v=32, rot=(math.pi / 2 - ang, 0, 0))
cyl('red', 0.04, 0.03, -0.08, 0.975, ZF + 0.07 - 0.065, v=32, rot=(math.pi / 2 - ang, 0, 0))
cyl('brass', 0.043, 0.006, -0.08, 0.988, ZF + 0.07 - 0.058, v=32, rot=(math.pi / 2 - ang, 0, 0))
box('brass', 0.12, 0.03, 0.006, 0.11, 0.955, ZF + 0.07 - 0.05, rx=ang); box('rubber', 0.1, 0.008, 0.008, 0.11, 0.955, ZF + 0.07 - 0.047, rx=ang)  # 出票口
box('paper', 0.075, 0.003, 0.07, 0.11, 0.94, ZF + 0.07 - 0.015, rx=ang + 0.2)
# 顶部铜壳显示头
box('brass', W + 0.02, 0.36, D + 0.02, 0, 1.17, -0.02, bev=0.02)
box('brassD', W + 0.04, 0.03, D + 0.04, 0, 1.005, -0.02)
box('brassD', W + 0.04, 0.025, D + 0.04, 0, 1.36, -0.02, bev=0.006)
box('brass', W - 0.06, 0.03, D - 0.06, 0, 1.385, -0.02, bev=0.008)
box('glass', W - 0.06, 0.17, 0.012, 0, 1.16, ZF - 0.004)
box('brassD', W - 0.04, 0.012, 0.02, 0, 1.25, ZF + 0.004); box('brassD', W - 0.04, 0.012, 0.02, 0, 1.07, ZF + 0.004)
for e in (-1, 1): box('brassD', 0.012, 0.19, 0.02, e * (W - 0.04) / 2, 1.16, ZF + 0.004)
# 七段码 047（每位 0.1 宽 0.13 高）
SEGS = {'0': 'abcdef', '4': 'bcfg', '7': 'abc'}
def digit(ch, cx):
    w, h, t = 0.075, 0.13, 0.012; zz = ZF + 0.004; y0 = 1.16
    P = {'a': (0, h / 2, w, t), 'g': (0, 0, w, t), 'd': (0, -h / 2, w, t), 'f': (-w / 2, h / 4, t, h / 2), 'b': (w / 2, h / 4, t, h / 2), 'e': (-w / 2, -h / 4, t, h / 2), 'c': (w / 2, -h / 4, t, h / 2)}
    for k, (dx, dy, sw, sh) in P.items(): box('seg' if k in SEGS[ch] else 'segOff', sw * 0.9, sh * 0.9, 0.003, cx + dx, y0 + dy, zz)
for i, ch in enumerate('047'): digit(ch, (i - 1) * 0.12)
box('brassD', 0.2, 0.035, 0.004, 0, 1.30, ZF + 0.012); box('rubber', 0.17, 0.012, 0.003, 0, 1.30, ZF + 0.015)  # 铭牌
for o in list(S.objects):
    for md in list(o.modifiers): bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
for o in S.objects:
    if o.type == 'MESH' and 'UVMap' not in o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
bpy.ops.object.select_all(action='SELECT'); bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); bpy.ops.object.join(); S.objects[0].name = 'cs_queue_machine'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
ob = S.objects[0]; print('tris', sum(len(p.vertices) - 2 for p in ob.data.polygons), 'dims', tuple(round(v, 3) for v in ob.dimensions))
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.32, 0.30, 0.28, 1)
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 2.8; sun.rotation_euler = (math.radians(50), 0, math.radians(-30))
bpy.ops.mesh.primitive_plane_add(size=6); bpy.context.object.data.materials.append(mat('floor', (0.06, 0.06, 0.065), 0.5))
S.render.engine = 'CYCLES'; S.cycles.samples = 24; S.cycles.use_denoising = False; S.render.resolution_x = 560; S.render.resolution_y = 700
for i, (cp, tg) in enumerate([(G(0.9, 1.5, 1.4), G(0, 0.8, 0))]):
    bpy.ops.object.camera_add(location=cp); cam = bpy.context.object; S.camera = cam
    cam.rotation_euler = (Vector(tg) - Vector(cp)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 35
    S.render.filepath = f'{PREV}/cs_queue_machine_{i}.png'; bpy.ops.render.render(write_still=True)
