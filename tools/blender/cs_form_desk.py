# 批次52：市民服务大厅填单台精建（eastwing.js 原 wood 方盒 3.2×1.0×1.2 + onyx 板）。
# 双面胡桃木斜面填单台：踢脚底座 + 凸芯板柜身（两长面各 3 格凸芯板 + 铜压条，两端侧板）；台面 = 中央平带（宽 0.5 m，y 1.055，放表格/文件夹/剧情表格锚点）
# + 两侧斜面书写板（由平带 1.055 向外沿降到 0.985，约 8°），每侧 2 块铜框玻璃压板，压板下夹两种表格样张（B07 举报登记表 / 调度单贴图）；
# 平带两端各一组铜笔架（杯座 + 斜插钢笔 + 球链），外沿铜挡条 + 端头铜名牌。游戏坐标 +Z/−Z 两面对称，原点 = 占地中心地面。占地 3.4 × 1.4。
import bpy, bmesh, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV, TA, TB = argv[0], argv[1], argv[2], argv[3]
bpy.ops.wm.read_factory_settings(use_empty=True); S = bpy.context.scene
import os
TEXD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')
def mat(name, col, rough=0.5, metal=0.0, tex=None, alpha=None, trans=0.0, nrm=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if tex:
        t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(tex); m.node_tree.links.new(t.outputs['Color'], b.inputs['Base Color'])
    if nrm:  # 批次53：木纹法线
        t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(nrm); t.image.colorspace_settings.name = 'Non-Color'
        nm = m.node_tree.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 0.6
        m.node_tree.links.new(t.outputs['Color'], nm.inputs['Color']); m.node_tree.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if alpha is not None:
        b.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND'
    return m
# 批次53：胡桃木改贴木纹（tex/fd_walnut*.jpg = ambientCG CC0 Wood051 调色版 walnut.jpg 按原平涂色线性均值缩放）+ 法线
M = dict(walnut=mat('fd_walnut', (1, 1, 1), 0.42, tex=os.path.join(TEXD, 'fd_walnut.jpg'), nrm=os.path.join(TEXD, 'walnut_n.jpg')), walnutD=mat('fd_walnutDark', (1, 1, 1), 0.5, tex=os.path.join(TEXD, 'fd_walnutD.jpg'), nrm=os.path.join(TEXD, 'walnut_n.jpg')),
         brass=mat('fd_brass', (0.80, 0.60, 0.30), 0.28, 1.0), brassD=mat('fd_brassDim', (0.50, 0.37, 0.19), 0.4, 1.0),
         steel=mat('fd_steel', (0.55, 0.55, 0.56), 0.3, 1.0), ink=mat('fd_ink', (0.03, 0.03, 0.035), 0.35),
         formA=mat('fd_formA', (1, 1, 1), 0.8, 0, TA), formB=mat('fd_formB', (1, 1, 1), 0.8, 0, TB),
         glass=mat('fd_glass', (0.75, 0.80, 0.78), 0.05, 0.0, alpha=0.18), felt=mat('fd_felt', (0.13, 0.20, 0.14), 0.9))
def G(x, y, z): return (x, -z, y)
def add(o, m): o.data.materials.append(M[m]); return o
def box(m, w, h, d, x, y, z, rx=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=G(x, y, z)); o = bpy.context.object; o.scale = (w, d, h); o.rotation_euler = (rx, 0, 0); return add(o, m)
def cyl(m, r, d, x, y, z, v=20, r2=None, rot=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=d, location=G(x, y, z))
    else: bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=d, location=G(x, y, z))
    o = bpy.context.object
    if rot: o.rotation_euler = rot
    return add(o, m)
def prism(m, prof, x0, x1):
    me = bpy.data.meshes.new('pr'); bm = bmesh.new(); n = len(prof)
    vs = [bm.verts.new(G(x, y, z)) for x in (x0, x1) for (z, y) in prof]
    bm.faces.new(vs[:n][::-1]); bm.faces.new(vs[n:])
    for i in range(n): j = (i + 1) % n; bm.faces.new((vs[i], vs[j], vs[n + j], vs[n + i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('pr', me); S.collection.objects.link(o); return add(o, m)
def quad(m, pts):  # 贴图面片 pts 4 个游戏坐标点（逆时针，自上看），UV 0..1
    me = bpy.data.meshes.new('q'); me.from_pydata([G(*p) for p in pts], [], [(0, 1, 2, 3)]); me.update()
    uv = me.uv_layers.new(name='UVMap')
    for i, l in enumerate(me.loops): uv.data[i].uv = [(0, 0), (1, 0), (1, 1), (0, 1)][l.vertex_index]
    o = bpy.data.objects.new('q', me); S.collection.objects.link(o); return add(o, m)
W, D = 3.4, 1.4; BW = 3.2; BD = 1.06
YT, YE, HB = 1.055, 0.985, 0.25   # 平带高、外沿高、平带半宽
# 底座 + 柜身
box('walnutD', BW - 0.1, 0.1, BD - 0.1, 0, 0.05, 0)
box('brassD', BW - 0.09, 0.012, BD - 0.09, 0, 0.104, 0)
box('walnut', BW, 0.80, BD, 0, 0.51, 0)
box('walnutD', BW + 0.03, 0.04, BD + 0.03, 0, 0.93, 0)   # 柜顶腰线
for s in (-1, 1):
    zf = s * (BD / 2 + 0.006)
    for k in range(3):
        cx = (k - 1) * (BW / 3)
        box('walnutD', BW / 3 - 0.12, 0.60, 0.012, cx, 0.52, zf)
        box('walnut', BW / 3 - 0.24, 0.46, 0.012, cx, 0.52, zf + s * 0.01)
        box('brass', BW / 3 - 0.24, 0.01, 0.006, cx, 0.755, zf + s * 0.018)
    for k in range(4): box('walnutD', 0.05, 0.80, 0.03, -BW / 2 + k * BW / 3, 0.51, s * (BD / 2 + 0.012))   # 立梃
    # 侧板
    box('walnutD', 0.012, 0.60, BD - 0.16, s * (BW / 2 + 0.006), 0.52, 0)
    box('walnut', 0.012, 0.46, BD - 0.32, s * (BW / 2 + 0.014), 0.52, 0)
# 台面：中央平带 + 两侧斜面
box('walnut', W, 0.05, 2 * HB, 0, YT - 0.025, 0)
for s in (-1, 1):
    z0, z1 = s * HB, s * D / 2
    prof = [(z0, YT), (z1, YE), (z1, YE - 0.05), (z0, YT - 0.05)]
    prism('walnut', prof if s > 0 else prof[::-1], -W / 2, W / 2)
    ang = math.atan2(YT - YE, D / 2 - HB)
    box('brass', W + 0.01, 0.03, 0.014, 0, YE - 0.005, s * (D / 2 + 0.007))   # 外沿铜挡条
    box('brassD', W, 0.006, 0.01, 0, YT + 0.003, s * HB)   # 平带 / 斜面分界铜线
    # 两块铜框玻璃压板（中间两格），压板下表格样张
    for k, cx in enumerate((-0.75, 0.75)):
        def on(u, v, lift):  # u 沿 x，v 沿斜面自平带向外 0..1
            z = s * (HB + v * (D / 2 - HB)); y = YT - v * (YT - YE) + lift; return (cx + u, y, z)
        pw, v0, v1 = 0.62, 0.12, 0.92
        mA = 'formA' if (k + (s > 0)) % 2 else 'formB'
        a, b = (0.16, 0.08)
        pts = [on(-0.17, v1 - 0.02, 0.0015), on(0.17, v1 - 0.02, 0.0015), on(0.17, v0 + 0.04, 0.0015), on(-0.17, v0 + 0.04, 0.0015)]
        if s < 0: pts = [pts[1], pts[0], pts[3], pts[2]]
        quad(mA, pts)
        p2 = [on(0.04, v1 - 0.06, 0.001), on(0.30, v1 - 0.06, 0.001), on(0.30, v0 + 0.1, 0.001), on(0.04, v0 + 0.1, 0.001)]
        if s < 0: p2 = [p2[1], p2[0], p2[3], p2[2]]
        quad('formB' if mA == 'formA' else 'formA', p2)
        dz = (v1 - v0) * (D / 2 - HB) / math.cos(ang)
        cz = s * (HB + (v0 + v1) / 2 * (D / 2 - HB)); cy = YT - (v0 + v1) / 2 * (YT - YE)
        box('glass', pw, 0.006, dz, cx, cy + 0.006, cz, rx=s * ang)
        for e in (-1, 1):
            box('brass', pw + 0.02, 0.008, 0.016, cx, cy + 0.008 - e * dz / 2 * math.sin(ang), cz + s * e * dz / 2 * math.cos(ang), rx=s * ang)
            box('brass', 0.016, 0.008, dz, cx + e * pw / 2, cy + 0.008, cz, rx=s * ang)
        for e in (-1, 1):
            for f in (-1, 1): cyl('brass', 0.008, 0.006, cx + e * (pw / 2 - 0.02), cy + 0.012 - f * (dz / 2 - 0.02) * math.sin(ang), cz + s * f * (dz / 2 - 0.02) * math.cos(ang), v=12)
# 平带两端铜笔架：杯座 + 斜插钢笔 + 球链
for e in (-1, 1):
    x = e * 1.42
    box('felt', 0.26, 0.004, 0.36, x, YT + 0.002, 0)
    cyl('brass', 0.06, 0.016, x, YT + 0.01, 0, v=28); cyl('brassD', 0.05, 0.008, x, YT + 0.021, 0, v=28)
    for s in (-1, 1):
        cyl('brass', 0.016, 0.05, x, YT + 0.045, s * 0.03, v=16, r2=0.012)
        cyl('ink', 0.0065, 0.15, x, YT + 0.1, s * 0.03 + s * 0.035, v=12, rot=(s * -0.45, 0, 0))
        cyl('brass', 0.007, 0.02, x, YT + 0.165, s * 0.03 + s * 0.064, v=12, rot=(s * -0.45, 0, 0))
        for k in range(10):
            t = k / 9; bpy.ops.mesh.primitive_uv_sphere_add(segments=6, ring_count=4, radius=0.003, location=G(x + e * 0.03 * math.sin(t * 3.1), YT + 0.03 + 0.08 * (1 - t) ** 2, s * (0.03 + 0.07 * t))); add(bpy.context.object, 'steel')
# 端头铜名牌（两端侧板）
for e in (-1, 1):
    box('brass', 0.006, 0.08, 0.30, e * (BW / 2 + 0.022), 0.86, 0)
    box('ink', 0.002, 0.05, 0.24, e * (BW / 2 + 0.026), 0.86, 0)
for o in list(S.objects):
    for md in list(o.modifiers): bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
def uv_cube(o, s):  # 批次53：木构件按 0.8 m 一张立方投影 UV
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.cube_project(cube_size=s, correct_aspect=True, clip_to_bounds=False, scale_to_bounds=False); bpy.ops.object.mode_set(mode='OBJECT')
for o in list(S.objects):
    if o.type == 'MESH' and o.data.materials and o.data.materials[0].name.startswith('fd_walnut'): uv_cube(o, 0.8)
for o in S.objects:
    if o.type == 'MESH' and 'UVMap' not in o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
bpy.ops.object.select_all(action='SELECT'); bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); bpy.ops.object.join(); S.objects[0].name = 'cs_form_desk'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
ob = S.objects[0]; print('tris', sum(len(p.vertices) - 2 for p in ob.data.polygons), 'dims', tuple(round(v, 3) for v in ob.dimensions))
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.32, 0.30, 0.28, 1)
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 2.8; sun.rotation_euler = (math.radians(50), 0, math.radians(-30))
bpy.ops.mesh.primitive_plane_add(size=8); bpy.context.object.data.materials.append(mat('floor', (0.06, 0.06, 0.065), 0.5))
S.render.engine = 'CYCLES'; S.cycles.samples = 24; S.cycles.use_denoising = False; S.render.resolution_x = 800; S.render.resolution_y = 560
for i, (cp, tg) in enumerate([(G(2.6, 2.2, 2.6), G(0, 0.8, 0)), (G(-0.9, 1.75, 1.2), G(-0.6, 1.0, 0.2))]):
    bpy.ops.object.camera_add(location=cp); cam = bpy.context.object; S.camera = cam
    cam.rotation_euler = (Vector(tg) - Vector(cp)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 35
    S.render.filepath = f'{PREV}/cs_form_desk_{i}.png'; bpy.ops.render.render(write_still=True)
