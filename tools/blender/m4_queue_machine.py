# 批次52：市民服务大厅叫号 / 取号机精建（eastwing.js 原 blackMetal 方盒 0.5×1.4×0.4 + 蓝色发光平面）。
# 70 年代立式取号机：胡桃木柜身（批次54：墨绿烤漆 → 胡桃木纹 + 暗铜；用户不要绿色）（倒角 + 铜包角 + 踢脚）+ 顶部铜壳显示头（三位数码管窗：暗红发光七段码「047」+ 铜框玻璃 + 上沿铜铭牌）
# + 中段斜面操作板（铜框、大号铜按钮「取号」+ 出票口与半露纸票）+ 下段检修门（铜锁孔 + 凸芯板）。游戏坐标 +Z = 正面，原点 = 占地中心地面。占地 0.5 × 0.4，高 1.4。
import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True); S = bpy.context.scene
import os
TEXD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')
def mat(name, col, rough=0.5, metal=0.0, emit=None, es=0.0, tex=None, nrm=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = es
    if tex:
        t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(tex); m.node_tree.links.new(t.outputs['Color'], b.inputs['Base Color'])
    if nrm:
        t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(nrm); t.image.colorspace_settings.name = 'Non-Color'
        nm = m.node_tree.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 0.5
        m.node_tree.links.new(t.outputs['Color'], nm.inputs['Color']); m.node_tree.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    return m
M0 = dict(enamel=mat('qm_walnut', (1, 1, 1), 0.38, tex=os.path.join(TEXD, 'fd_walnut.jpg'), nrm=os.path.join(TEXD, 'walnut_n.jpg')), enamelD=mat('qm_walnutDark', (1, 1, 1), 0.45, tex=os.path.join(TEXD, 'fd_walnutD.jpg'), nrm=os.path.join(TEXD, 'walnut_n.jpg')),
         brass=mat('qm_brass', (0.80, 0.60, 0.30), 0.28, 1.0), brassD=mat('qm_brassDim', (0.40, 0.28, 0.14), 0.45, 1.0),
         glass=mat('qm_glassDark', (0.02, 0.015, 0.012), 0.08), seg=mat('qm_segGlow', (1.0, 0.25, 0.08), 0.4, 0, (1.0, 0.22, 0.06), 3.5),
         segOff=mat('qm_segOff', (0.035, 0.012, 0.008), 0.6), paper=mat('qm_ticket', (0.86, 0.82, 0.70), 0.8), rubber=mat('qm_rubber', (0.02, 0.02, 0.02), 0.8),
         red=mat('qm_btnRed', (0.45, 0.05, 0.03), 0.35))
def G(x, y, z): return (x, -z, y)
def add(o, m): o.data.materials.append(M[m]); return o
def box(m, w, h, d, x, y, z, rx=0.0, bev=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=G(x, y, z)); o = bpy.context.object; o.scale = (w, d, h); o.rotation_euler = (rx, 0, 0)
    if bev: md = o.modifiers.new('b', 'BEVEL'); md.width = bev; md.segments = 3
    return add(o, m)
def cyl(m, r, d, x, y, z, v=24, rot=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=d, location=G(x, y, z)); o = bpy.context.object; o.rotation_euler = rot; return add(o, m)
M = dict(bronze=mat('qm4_bronze', (0.40, 0.26, 0.13), 0.48, 0.9), brass=mat('qm4_bronzeHi', (0.60, 0.43, 0.21), 0.45, 0.95), brassD=mat('qm4_iron', (0.05, 0.042, 0.036), 0.6, 0.7),
         glass=mat('qm_glassDark', (0.02, 0.015, 0.012), 0.08), seg=mat('qm_segGlow', (1.0, 0.25, 0.08), 0.4, 0, (1.0, 0.22, 0.06), 0.9),
         segOff=mat('qm_segOff', (0.035, 0.012, 0.008), 0.6), paper=mat('qm_ticket', (0.86, 0.82, 0.70), 0.8), rubber=mat('qm4_rubber', (0.02, 0.018, 0.016), 0.8),
         red=mat('qm4_btnOxblood', (0.32, 0.05, 0.03), 0.4))
M['enamel'] = M['bronze']; M['enamelD'] = M['brassD']
def sph(m, r, x, y, z): bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=r, location=G(x, y, z)); return add(bpy.context.object, m)
# 批次M4：1970 年代铸铁 / 古铜立式取号机（替换胡桃木方盒）：铸铁阶梯底座 + 四只铸铁球足、倒角圆润古铜柜壳（正 / 侧面浮凸框 + 铆钉排）、
# 古铜腰线、一体楔形斜台（铸铁嵌板、酒红褐取号按钮配亮铜圈、亮铜唇出票口 + 半露纸票）、圆角古铜显示头（铸铁凹窗 + 玻璃 + 七段码 047 + 四角铆钉）、阶梯檐口 + 半圆铸铜顶饰。
W, D = 0.46, 0.36; ZF = D / 2
box('brassD', W + 0.12, 0.05, D + 0.12, 0, 0.045, 0, bev=0.012); box('brassD', W + 0.07, 0.045, D + 0.07, 0, 0.09, 0, bev=0.012)
for sx in (-1, 1):
    for sz in (-1, 1): sph('brassD', 0.028, sx * (W / 2 + 0.03), 0.022, sz * (D / 2 + 0.03))
box('bronze', W, 0.78, D, 0, 0.5, 0, bev=0.03)
# 正面浮凸框 + 铸铁凹芯 + 铆钉
fw, fh, fy = W - 0.08, 0.56, 0.46
box('brassD', fw - 0.04, fh - 0.04, 0.01, 0, fy, ZF + 0.002)
for e in (-1, 1):
    box('brass', fw, 0.026, 0.018, 0, fy + e * fh / 2, ZF + 0.006, bev=0.006); box('brass', 0.026, fh, 0.018, e * fw / 2, fy, ZF + 0.006, bev=0.006)
for i in range(7):
    t = -fh / 2 + 0.04 + i * (fh - 0.08) / 6
    for e in (-1, 1): sph('brass', 0.0075, e * fw / 2, fy + t, ZF + 0.016)
for i in range(5):
    t = -fw / 2 + 0.05 + i * (fw - 0.1) / 4
    for e in (-1, 1): sph('brass', 0.0075, t, fy + e * fh / 2, ZF + 0.016)
cyl('brass', 0.016, 0.012, 0.13, 0.62, ZF + 0.012, v=16); cyl('rubber', 0.005, 0.014, 0.13, 0.62, ZF + 0.016, v=8)
# 侧面浮凸框 + 竖向铆钉
for sx in (-1, 1):
    box('brass', 0.018, fh, D - 0.08, sx * (W / 2 + 0.004), fy, 0, bev=0.006)
    box('brassD', 0.012, fh - 0.06, D - 0.14, sx * (W / 2 + 0.008), fy, 0)
    for i in range(6): sph('brass', 0.0075, sx * (W / 2 + 0.014), fy - fh / 2 + 0.05 + i * (fh - 0.1) / 5, D / 2 - 0.06)
# 腰线
box('brass', W + 0.03, 0.03, D + 0.03, 0, 0.12, 0, bev=0.01); box('brass', W + 0.03, 0.028, D + 0.03, 0, 0.87, 0, bev=0.01)
ang = math.radians(25)
import bmesh
prof = [(ZF - 0.02, 0.78)] + [(ZF + 0.11 * math.sin(t * math.pi / 2), 0.78 + 0.10 * (1 - math.cos(t * math.pi / 2))) for t in (0.25, 0.5, 0.75, 1.0)] + [(ZF + 0.11, 0.90), (ZF - 0.12, 1.005), (ZF - 0.12, 0.78)]
me = bpy.data.meshes.new('wedge'); bm = bmesh.new(); n = len(prof)
vs = [bm.verts.new(G(x, y, z)) for x in (-W / 2 + 0.006, W / 2 - 0.006) for (z, y) in prof]
bm.faces.new(vs[:n][::-1]); bm.faces.new(vs[n:])
for i in range(n): j = (i + 1) % n; bm.faces.new((vs[i], vs[j], vs[n + j], vs[n + i]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
o = bpy.data.objects.new('wedge', me); S.collection.objects.link(o); add(o, 'bronze')
md = o.modifiers.new('b', 'BEVEL'); md.width = 0.016; md.segments = 4; md.limit_method = 'ANGLE'; md.angle_limit = math.radians(30)
box('brassD', W - 0.07, 0.010, 0.21, 0, 0.955, ZF - 0.012, rx=ang, bev=0.004)
cyl('brass', 0.011, W - 0.02, 0, 0.895, ZF + 0.112, v=16, rot=(0, math.pi / 2, 0))
cyl('brass', 0.056, 0.014, -0.08, 0.965, ZF, v=32, rot=(math.pi / 2 - ang, 0, 0))
cyl('red', 0.04, 0.03, -0.08, 0.975, ZF + 0.005, v=32, rot=(math.pi / 2 - ang, 0, 0))
box('brass', 0.13, 0.034, 0.01, 0.11, 0.955, ZF + 0.02, rx=ang, bev=0.004); box('rubber', 0.1, 0.008, 0.008, 0.11, 0.958, ZF + 0.024, rx=ang)
box('paper', 0.075, 0.003, 0.07, 0.11, 0.94, ZF + 0.055, rx=ang + 0.2)
# 显示头：圆角古铜壳 + 檐口 + 顶饰
box('brass', W + 0.05, 0.03, D + 0.05, 0, 1.005, -0.02, bev=0.01)
box('bronze', W + 0.02, 0.34, D + 0.02, 0, 1.18, -0.02, bev=0.04)
box('brass', W + 0.06, 0.03, D + 0.06, 0, 1.36, -0.02, bev=0.01); box('brass', W + 0.0, 0.025, D, 0, 1.385, -0.02, bev=0.008)
cyl('bronze', 0.09, 0.03, 0, 1.40, ZF - 0.06, v=32); box('brass', 0.03, 0.03, 0.035, 0, 1.49, ZF - 0.06, bev=0.008)
box('brassD', W - 0.04, 0.2, 0.012, 0, 1.17, ZF + 0.002)
box('glass', W - 0.07, 0.17, 0.006, 0, 1.17, ZF + 0.006)
for e in (-1, 1):
    box('brass', W - 0.02, 0.018, 0.022, 0, 1.17 + e * 0.105, ZF + 0.008, bev=0.005); box('brass', 0.018, 0.228, 0.022, e * (W - 0.02) / 2, 1.17, ZF + 0.008, bev=0.005)
    for f in (-1, 1): sph('brass', 0.009, e * (W - 0.02) / 2, 1.17 + f * 0.105, ZF + 0.02)
SEGS = {'0': 'abcdef', '4': 'bcfg', '7': 'abc'}
def digit(ch, cx):
    w, h, t = 0.075, 0.13, 0.012; zz = ZF + 0.0115; y0 = 1.17  # 批次M4 修：原 ZF+0.0075 与玻璃前表面共面 → 游戏内 z-fight 数码管花屏
    P = {'a': (0, h / 2, w, t), 'g': (0, 0, w, t), 'd': (0, -h / 2, w, t), 'f': (-w / 2, h / 4, t, h / 2), 'b': (w / 2, h / 4, t, h / 2), 'e': (-w / 2, -h / 4, t, h / 2), 'c': (w / 2, -h / 4, t, h / 2)}
    for k, (dx, dy, sw, sh) in P.items(): box('seg' if k in SEGS[ch] else 'segOff', sw * 0.82, sh * 0.82, 0.003, cx + dx, y0 + dy, zz)
for i, ch in enumerate('047'): digit(ch, (i - 1) * 0.12)
box('brass', 0.2, 0.034, 0.006, 0, 1.315, ZF + 0.01, bev=0.003); box('brassD', 0.17, 0.012, 0.003, 0, 1.315, ZF + 0.014)
for o in list(S.objects):
    for md in list(o.modifiers): bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
def uv_cube(o, s):  # 批次54：胡桃木件立方投影 UV（0.6 m 一张）
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.cube_project(cube_size=0.6, correct_aspect=True, clip_to_bounds=False, scale_to_bounds=False); bpy.ops.object.mode_set(mode='OBJECT')
for o in list(S.objects):
    if o.type == 'MESH' and o.data.materials and o.data.materials[0].name.startswith('qm_walnut'): uv_cube(o, 0.6)
for o in S.objects:
    if o.type == 'MESH' and 'UVMap' not in o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
bpy.ops.object.select_all(action='SELECT'); bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); bpy.ops.object.join(); S.objects[0].name = 'cs_queue_machine_m4'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
ob = S.objects[0]; print('tris', sum(len(p.vertices) - 2 for p in ob.data.polygons), 'dims', tuple(round(v, 3) for v in ob.dimensions))
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.32, 0.30, 0.28, 1)
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 2.8; sun.rotation_euler = (math.radians(50), 0, math.radians(-30))
bpy.ops.mesh.primitive_plane_add(size=6); bpy.context.object.data.materials.append(mat('floor', (0.06, 0.06, 0.065), 0.5))
S.render.engine = 'CYCLES'; S.cycles.samples = 24; S.cycles.use_denoising = False; S.render.resolution_x = 560; S.render.resolution_y = 700
for i, (cp, tg) in enumerate([(G(0.9, 1.5, 1.4), G(0, 0.8, 0)), (G(-1.0, 1.1, 1.2), G(0, 0.8, 0)), (G(0.0, 1.25, 0.8), G(0, 1.05, 0))]):
    bpy.ops.object.camera_add(location=cp); cam = bpy.context.object; S.camera = cam
    cam.rotation_euler = (Vector(tg) - Vector(cp)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 35
    S.render.filepath = f'{PREV}/m4_qm_{i}.png'; bpy.ops.render.render(write_still=True)
