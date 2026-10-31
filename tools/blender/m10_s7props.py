# 批次 M10：第七局作战室 / 杀青室陈设三件（替换白色圆锥灯罩、白网面现代转椅、纯黑方块木凳）。
# blender.sh -b -P m10_s7props.py -- <out_dir> <prev_dir|->
#   pendant.glb ：1960–70 年代暖黑搪瓷工业吊灯（深色碗罩外 / 内侧暖白搪瓷 / 暗铜灯头与吊杆 / 乳白灯泡），原点 = 吊点（天花），向下 0.95 m
#   oldchair.glb：胡桃木 + 酒红褐皮面老式办公椅（弧形靠背、扶手、四爪铸铁底座 + 铜轮），原点 = 地面中心，+Z = 正面
#   stool.glb   ：胡桃框 + 深褐皮面方凳（0.5×0.45×0.5，铜钉压边）
import bpy, sys, math, os
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
TEXD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')
def G(x, y, z): return (x, -z, y)
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(name, col, rough=0.5, metal=0.0, emit=None, es=0.0, tex=None):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = es
    if tex:
        t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(tex); m.node_tree.links.new(t.outputs['Color'], b.inputs['Base Color'])
    return m
def MATS():
    return dict(
        enamel=mat('m10_enamelBlack', (0.035, 0.028, 0.022), 0.45, 0.0),          # 暖黑搪瓷外罩
        enamelIn=mat('m10_enamelIn', (0.86, 0.80, 0.68), 0.5, 0.0),               # 内侧暖白搪瓷
        bronze=mat('m10_bronze', (0.36, 0.24, 0.12), 0.48, 0.9),                  # 暗古铜
        bulb=mat('m10_bulb', (0.9, 0.82, 0.65), 0.3, 0.0, (1.0, 0.80, 0.52), 0.9),
        walnut=mat('m10_walnut', (1, 1, 1), 0.55, tex=os.path.join(TEXD, 'fd_walnut.jpg')),
        walnutD=mat('m10_walnutDark', (1, 1, 1), 0.58, tex=os.path.join(TEXD, 'fd_walnutD.jpg')),
        leather=mat('m10_leather', (0.16, 0.055, 0.035), 0.55, 0.0),              # 酒红褐皮
        iron=mat('m10_iron', (0.045, 0.04, 0.035), 0.55, 0.7))
def add(o, M, m): o.data.materials.append(M[m]); return o
def box(M, m, w, h, d, x, y, z, bev=0.0, rx=0.0, ry=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=G(x, y, z)); o = bpy.context.object; o.scale = (w, d, h); o.rotation_euler = (rx, 0, ry)
    if bev: md = o.modifiers.new('b', 'BEVEL'); md.width = bev; md.segments = 3
    return add(o, M, m)
def cylY(M, m, r, h, x, y, z, v=24, r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=G(x, y, z))
    else: bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=h, location=G(x, y, z))
    return add(bpy.context.object, M, m)
def sph(M, m, r, x, y, z, seg=16): bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=G(x, y, z)); return add(bpy.context.object, M, m)
def lathe(M, m, prof, v=40, name='lathe'):
    """prof: [(r, y)] 绕 Y 轴旋转（game 坐标）"""
    import bmesh
    me = bpy.data.meshes.new(name); bm = bmesh.new(); rings = []
    for i in range(v):
        a = 2 * math.pi * i / v; ring = [bm.verts.new(G(r * math.cos(a), y, r * math.sin(a))) for (r, y) in prof]; rings.append(ring)
    for i in range(v):
        A, B = rings[i], rings[(i + 1) % v]
        for k in range(len(prof) - 1): bm.faces.new((A[k], A[k + 1], B[k + 1], B[k]))
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    sm = o.modifiers.new('s', 'SOLIDIFY'); sm.thickness = 0.006; o.data.materials.append(M[m]); return o
def uv_cube(o, s):
    bpy.context.view_layer.objects.active = o; bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.cube_project(cube_size=s, correct_aspect=True); bpy.ops.object.mode_set(mode='OBJECT')
def finish(name, path):
    S = bpy.context.scene
    for o in list(S.objects):
        if o.type == 'MESH' and o.data.materials and o.data.materials[0].name.startswith('m10_walnut'): uv_cube(o, 0.5)
    for o in S.objects:
        if o.type == 'MESH' and not o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
    bpy.ops.object.select_all(action='DESELECT')
    for o in S.objects:
        if o.type == 'MESH': o.select_set(True)
    bpy.context.view_layer.objects.active = [o for o in S.objects if o.type == 'MESH'][0]
    bpy.ops.object.convert(target='MESH'); bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active; ob.name = name
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_apply=True)
    print('M10', name, 'tris', sum(len(p.vertices) - 2 for p in ob.data.polygons), 'dims', tuple(round(v, 3) for v in ob.dimensions))
def preview(tag, shots, res=(520, 520)):
    if PREV == '-': return
    S = bpy.context.scene
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.20, 0.17, 0.14, 1)
    bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 2.6; sun.rotation_euler = (math.radians(50), 0, math.radians(-30))
    bpy.ops.object.light_add(type='POINT', location=G(0.8, 1.6, 1.2)); bpy.context.object.data.energy = 60; bpy.context.object.data.color = (1, 0.8, 0.6)
    bpy.ops.mesh.primitive_plane_add(size=8, location=G(0, -1.2 if tag == 'pendant' else 0, 0)); bpy.context.object.data.materials.append(mat('floor', (0.25, 0.14, 0.07), 0.6))
    S.render.engine = 'CYCLES'; S.cycles.samples = 20; S.cycles.use_denoising = False; S.render.resolution_x, S.render.resolution_y = res
    for i, (cp, tg) in enumerate(shots):
        bpy.ops.object.camera_add(location=G(*cp)); cam = bpy.context.object; S.camera = cam
        cam.rotation_euler = (Vector(G(*tg)) - Vector(G(*cp))).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 40
        S.render.filepath = f'{PREV}/m10_{tag}_{i}.png'; bpy.ops.render.render(write_still=True)

# ---------- 1 吊灯 ----------
reset(); M = MATS()
cylY(M, 'bronze', 0.07, 0.025, 0, -0.012, 0, v=24)                  # 天花碗座
cylY(M, 'bronze', 0.009, 0.62, 0, -0.33, 0, v=10)                   # 吊杆
cylY(M, 'bronze', 0.03, 0.05, 0, -0.66, 0, v=16)                    # 吊杆接头
cylY(M, 'bronze', 0.05, 0.11, 0, -0.73, 0, v=24, r2=0.035)          # 灯头铜壳
cylY(M, 'bronze', 0.056, 0.012, 0, -0.785, 0, v=24)                 # 灯头圈
prof = [(0.05, -0.78), (0.09, -0.80), (0.16, -0.84), (0.23, -0.89), (0.27, -0.93), (0.285, -0.95)]
lathe(M, 'enamel', prof, name='shade_out')
inn = lathe(M, 'enamelIn', [(r - 0.004, y + 0.004) for r, y in prof], name='shade_in'); inn.modifiers['s'].thickness = -0.003
for o in bpy.context.scene.objects:  # 内罩翻法线朝内
    if o.name == 'shade_in':
        bpy.context.view_layer.objects.active = o; bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.flip_normals(); bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.mesh.primitive_torus_add(major_radius=0.285, minor_radius=0.007, major_segments=48, minor_segments=8, location=G(0, -0.95, 0)); add(bpy.context.object, M, 'bronze')  # 卷边铜口
sph(M, 'bulb', 0.045, 0, -0.85, 0)
finish('m10_pendant', f'{OUT}/pendant.glb')
preview('pendant', [((0.9, -0.5, 1.0), (0, -0.7, 0)), ((0.5, -1.6, 0.6), (0, -0.85, 0))])

# ---------- 2 老式办公椅（胡桃 + 皮面，四爪铸铁底座 + 铜轮）----------
reset(); M = MATS()
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2; ex, ez = 0.3 * math.cos(a), 0.3 * math.sin(a)
    box(M, 'iron', 0.34, 0.035, 0.05, ex / 2, 0.075, ez / 2, bev=0.008, ry=-a)  # 爪
    cylY(M, 'bronze', 0.028, 0.03, ex, 0.03, ez, v=12)                         # 铜轮
    sph(M, 'bronze', 0.03, ex, 0.04, ez, seg=10)
cylY(M, 'iron', 0.06, 0.06, 0, 0.1, 0, v=20); cylY(M, 'iron', 0.025, 0.3, 0, 0.27, 0, v=14); cylY(M, 'bronze', 0.032, 0.03, 0, 0.405, 0, v=14)
box(M, 'iron', 0.34, 0.02, 0.34, 0, 0.43, 0, bev=0.005)                       # 底盘
box(M, 'walnut', 0.5, 0.05, 0.48, 0, 0.465, 0, bev=0.012)                     # 胡桃座框
box(M, 'leather', 0.44, 0.05, 0.42, 0, 0.51, 0.005, bev=0.02)                 # 皮座垫
for sx in (-1, 1):                                                            # 扶手：立柱 + 弧扶面
    box(M, 'walnut', 0.04, 0.2, 0.05, sx * 0.235, 0.59, 0.12, bev=0.008)
    box(M, 'walnut', 0.045, 0.2, 0.05, sx * 0.235, 0.59, -0.16, bev=0.008)
    box(M, 'walnut', 0.06, 0.035, 0.44, sx * 0.235, 0.705, -0.02, bev=0.012)
# 弧形靠背：分段胡桃框 + 皮芯（围绕后方）
segs = 9
for i in range(segs):
    t = (i - (segs - 1) / 2) / (segs - 1); a = t * 1.5; R = 0.3
    x, z = R * math.sin(a), -R * math.cos(a) + 0.08
    box(M, 'walnut', 0.075, 0.055, 0.035, x, 0.95, z, bev=0.008, ry=-a)      # 顶框
    box(M, 'leather', 0.074, 0.3, 0.03, x, 0.78, z + 0.012 * math.cos(a), bev=0.006, ry=-a)  # 皮芯
    if i in (0, segs - 1): box(M, 'walnut', 0.04, 0.45, 0.04, x, 0.73, z, bev=0.008, ry=-a)
box(M, 'walnutD', 0.05, 0.08, 0.05, 0, 0.56, -0.22, bev=0.01)                 # 背撑
box(M, 'walnutD', 0.04, 0.12, 0.03, 0, 0.6, -0.225)
finish('m10_oldchair', f'{OUT}/oldchair.glb')
preview('chair', [((1.0, 1.1, 1.4), (0, 0.55, 0)), ((-1.2, 1.0, -0.9), (0, 0.55, 0))])

# ---------- 3 方凳（胡桃框 + 皮面 + 铜钉）----------
reset(); M = MATS()
for sx in (-1, 1):
    for sz in (-1, 1): box(M, 'walnut', 0.045, 0.37, 0.045, sx * 0.215, 0.185, sz * 0.215, bev=0.006)
for e in (-1, 1):
    box(M, 'walnut', 0.43, 0.06, 0.025, 0, 0.33, e * 0.215, bev=0.005); box(M, 'walnut', 0.025, 0.06, 0.43, e * 0.215, 0.33, 0, bev=0.005)
    box(M, 'walnutD', 0.43, 0.025, 0.02, 0, 0.1, e * 0.215); box(M, 'walnutD', 0.02, 0.025, 0.43, e * 0.215, 0.1, 0)
box(M, 'walnut', 0.5, 0.03, 0.5, 0, 0.385, 0, bev=0.008)
box(M, 'leather', 0.47, 0.06, 0.47, 0, 0.42, 0, bev=0.022)
for i in range(9):
    t = -0.22 + i * 0.055
    for e in (-1, 1): sph(M, 'bronze', 0.007, t, 0.405, e * 0.236, seg=8); sph(M, 'bronze', 0.007, e * 0.236, 0.405, t, seg=8)
finish('m10_stool', f'{OUT}/stool.glb')
preview('stool', [((0.8, 0.9, 1.0), (0, 0.25, 0))], res=(420, 420))
