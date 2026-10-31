# 批次41：藏书阁落地地球仪（替换 dressing.js 里木锥 + 铜环 + Math.random 斑点球）。
# 游戏坐标：+Z = 南，原点 = 底面中心，单位 m。总高约 1.30 m，球径 0.50 m。
# 构造：胡桃三弯腿 + 十字拉档 + 拉档中心铜罗盘；车削中柱；地平环（胡桃宽环 + 铜刻度 + 黄道十二宫分格）由三根立柱托起；黄铜子午环（23.4° 倾）+ 南北极轴钮；
#       球面：烘焙的仿古羊皮纸地图（陆地赭褐 / 海洋暖米黄 / 等高晕线 / 经纬网 15°），烘焙成 1024×512 贴图打进 glb。
import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True); S = bpy.context.scene
def mat(name, col, rough=0.5, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m
M = dict(walnut=mat('sw_walnut', (0.20, 0.10, 0.05), 0.45), walnutD=mat('sw_walnutDark', (0.11, 0.055, 0.03), 0.5),
         brass=mat('gl_brass', (0.80, 0.60, 0.30), 0.26, 1.0), brassD=mat('gl_brassDim', (0.50, 0.37, 0.18), 0.38, 1.0),
         paper=mat('gl_horizonPaper', (0.72, 0.64, 0.46), 0.7), ink=mat('gl_ink', (0.18, 0.12, 0.07), 0.7))
def G(x, y, z): return (x, -z, y)
def add(o, m): o.data.materials.append(M[m]); return o
def cyl(m, r, d, x, y, z, v=32, r2=None, rot=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=d, location=G(x, y, z))
    else: bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=d, location=G(x, y, z))
    o = bpy.context.object
    if rot: o.rotation_euler = rot
    return add(o, m)
def torus(m, R, r, x, y, z, rot=(0, 0, 0), maj=64):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=maj, minor_segments=10, location=G(x, y, z)); o = bpy.context.object; o.rotation_euler = rot; return add(o, m)
GC = 0.86  # 球心高
# 三弯腿（贝塞尔曲线挤圆截面）+ 铜爪脚
for k in range(3):
    a = k * 2 * math.pi / 3 + math.pi / 2
    def P(r, y): return G(r * math.cos(a), y, r * math.sin(a))
    cv = bpy.data.curves.new('leg', 'CURVE'); cv.dimensions = '3D'; cv.bevel_depth = 0.022; cv.bevel_resolution = 4; cv.resolution_u = 20
    sp = cv.splines.new('BEZIER'); sp.bezier_points.add(2)
    pts = [(P(0.05, 0.52), P(0.05, 0.60), P(0.07, 0.42)), (P(0.20, 0.22), P(0.14, 0.32), P(0.26, 0.12)), (P(0.34, 0.03), P(0.30, 0.06), P(0.37, 0.02))]
    for bp, (c, l, r) in zip(sp.bezier_points, pts): bp.co, bp.handle_left, bp.handle_right = c, l, r
    o = bpy.data.objects.new('leg', cv); S.collection.objects.link(o); o.data.materials.append(M['walnut'])
    cv.bevel_mode = 'ROUND'; cv.taper_radius_mode = 'MULTIPLY'
    for bp, rr in zip(sp.bezier_points, (1.0, 0.85, 0.6)): bp.radius = rr
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.022, location=P(0.355, 0.022)); add(bpy.context.object, 'brass')
    # 拉档（腿 → 中心）
    c = Vector(P(0.11, 0.16)); bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.011, depth=0.22, location=c)
    o = bpy.context.object; o.rotation_euler = (math.pi / 2, 0, math.pi / 2 - a); add(o, 'walnutD')
    # 地平环立柱
    cyl('walnut', 0.014, GC - 0.52 + 0.02, 0.36 * math.cos(a + math.pi / 3), (GC + 0.52) / 2 - 0.01, 0.36 * math.sin(a + math.pi / 3), v=14)
    cyl('brassD', 0.022, 0.02, 0.36 * math.cos(a + math.pi / 3), 0.53, 0.36 * math.sin(a + math.pi / 3), v=14)
# 中柱车削 + 罗盘
cyl('brass', 0.07, 0.012, 0, 0.165, 0); cyl('paper', 0.058, 0.004, 0, 0.173, 0)
for k in range(8): a = k * math.pi / 4; L = 0.05 if k % 2 == 0 else 0.03; bpy.ops.mesh.primitive_cube_add(size=1, location=G(L / 2 * math.cos(a), 0.176, L / 2 * math.sin(a))); o = bpy.context.object; o.scale = (L, 0.006, 0.002); o.rotation_euler = (0, 0, -a); add(o, 'ink')
cyl('walnut', 0.05, 0.08, 0, 0.56, 0, r2=0.035); cyl('walnutD', 0.06, 0.02, 0, 0.51, 0)
bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=0.045, location=G(0, 0.62, 0)); add(bpy.context.object, 'walnut')
# 3 根立柱连向地平环：已在上方；水平托环
torus('walnutD', 0.36, 0.012, 0, 0.53, 0, rot=(0, 0, 0))
# 地平环（宽环：胡桃上下沿 + 纸面刻度带 + 铜刻度线）
cyl('walnut', 0.355, 0.03, 0, GC, 0, v=96); hole = cyl('walnut', 0.285, 0.05, 0, GC, 0, v=96)
md = S.objects[-2].modifiers.new('b', 'BOOLEAN'); md.object = hole; md.operation = 'DIFFERENCE'
bpy.context.view_layer.objects.active = S.objects[-2]; bpy.ops.object.modifier_apply(modifier='b'); bpy.data.objects.remove(hole)
torus('brass', 0.355, 0.006, 0, GC + 0.015, 0, maj=96); torus('brass', 0.285, 0.005, 0, GC + 0.015, 0, maj=96)
torus('paper', 0.32, 0.028, 0, GC + 0.012, 0, rot=(0, 0, 0), maj=96).scale = (1, 1, 0.08)
for k in range(72):
    a = k * math.pi / 36; L = 0.03 if k % 6 == 0 else 0.014
    bpy.ops.mesh.primitive_cube_add(size=1, location=G(0.334 * math.cos(a), GC + 0.0175, 0.334 * math.sin(a))); o = bpy.context.object; o.scale = (L, 0.002, 0.0025); o.rotation_euler = (0, 0, -a); add(o, 'ink')
# 子午环（铜，竖直穿过地平环南北两槽，绕东西轴倾 23.4°）+ 极轴钮
tilt = math.radians(23.4)
mer = torus('brass', 0.272, 0.009, 0, GC, 0, rot=(0, math.pi / 2, 0), maj=96); mer.scale = (1, 1, 1)
mer.data.materials.clear(); add(mer, 'brass')
for s in (-1, 1): cyl('brassD', 0.022, 0.04, 0, GC + s * 0.272 * math.cos(tilt), s * 0.272 * math.sin(tilt), v=16, rot=(tilt, 0, 0))
# 子午环托：底部铜叉
cyl('brass', 0.03, 0.05, 0, GC - 0.29, 0, r2=0.018)
# 球面
bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=0.25, location=G(0, GC, 0)); gl = bpy.context.object; gl.name = 'globe'
bpy.ops.object.shade_smooth()
gm = bpy.data.materials.new('gl_map'); gm.use_nodes = True; nt = gm.node_tree; bs = nt.nodes['Principled BSDF']; bs.inputs['Roughness'].default_value = 0.42
tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.6; nz.inputs['Detail'].default_value = 8; nz.inputs['Roughness'].default_value = 0.58
nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
cr = nt.nodes.new('ShaderNodeValToRGB'); e = cr.color_ramp.elements
e[0].position = 0.0; e[0].color = (0.70, 0.60, 0.40, 1); e[1].position = 0.47; e[1].color = (0.62, 0.52, 0.33, 1)
for p, c in [(0.485, (0.42, 0.26, 0.12, 1)), (0.52, (0.52, 0.36, 0.17, 1)), (0.62, (0.36, 0.22, 0.10, 1)), (1.0, (0.28, 0.17, 0.08, 1))]:
    el = cr.color_ramp.elements.new(p); el.color = c
nt.links.new(nz.outputs['Fac'], cr.inputs['Fac'])
# 经纬网 15°：用球面坐标做细线
sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'], sep.inputs['Vector'])
def math_node(op, a=None, b=None, v1=None):
    n = nt.nodes.new('ShaderNodeMath'); n.operation = op
    if a is not None: nt.links.new(a, n.inputs[0])
    if b is not None: nt.links.new(b, n.inputs[1])
    if v1 is not None: n.inputs[1].default_value = v1
    return n
lon = math_node('ARCTAN2', sep.outputs['Y'], sep.outputs['X'])
lat = math_node('ARCSINE', math_node('DIVIDE', sep.outputs['Z'], None, 0.25).outputs[0])
def gridline(src):
    m = math_node('MULTIPLY', src.outputs[0], None, 12.0 / math.pi)
    f = math_node('FRACT', m.outputs[0]); d = math_node('SUBTRACT', f.outputs[0], None, 0.5); ab = math_node('ABSOLUTE', d.outputs[0])
    return math_node('GREATER_THAN', ab.outputs[0], None, 0.485)
g1 = gridline(lon); g2 = gridline(lat); gg = math_node('MAXIMUM', g1.outputs[0], g2.outputs[0])
mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; nt.links.new(gg.outputs[0], mix.inputs['Factor']); nt.links.new(cr.outputs['Color'], mix.inputs[6]); mix.inputs[7].default_value = (0.25, 0.15, 0.07, 1)
nt.links.new(mix.outputs[2], bs.inputs['Base Color'])
gl.data.materials.append(gm)
# 烘焙到贴图
img = bpy.data.images.new('gl_map_bake', 1024, 512); tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = img; nt.nodes.active = tn
S.render.engine = 'CYCLES'; S.cycles.samples = 4; S.cycles.bake_type = 'DIFFUSE'; S.render.bake.use_pass_direct = False; S.render.bake.use_pass_indirect = False; S.render.bake.use_pass_color = True
bpy.ops.object.select_all(action='DESELECT'); gl.select_set(True); bpy.context.view_layer.objects.active = gl; bpy.ops.object.bake(type='DIFFUSE')
img.filepath_raw = PREV + '/lib_globe_map.png'; img.file_format = 'PNG'; img.save()
for n in list(nt.nodes):
    if n not in (bs, tn, nt.nodes['Material Output']): nt.nodes.remove(n)
nt.links.new(tn.outputs['Color'], bs.inputs['Base Color']); img.pack()
# 球体绕东西轴倾 23.4°（与子午环一致）
gl.rotation_euler = (tilt, 0, 0); mer.rotation_euler = (0, math.pi / 2, 0)
# 转换 + 合并
for o in list(S.objects):
    if o.type == 'CURVE': bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o; bpy.ops.object.convert(target='MESH')
for o in S.objects: o.select_set(True)
bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); bpy.ops.object.join(); S.objects[0].name = 'lib_globe'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
print('tris', sum(len(p.vertices) - 2 for p in S.objects[0].data.polygons))
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.35, 0.32, 0.3, 1)
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 3.0; sun.rotation_euler = (math.radians(50), 0, math.radians(30))
bpy.ops.mesh.primitive_plane_add(size=6); bpy.context.object.data.materials.append(mat('floor', (0.15, 0.085, 0.045), 0.5))
S.cycles.samples = 32; S.cycles.use_denoising = False; S.render.resolution_x = 700; S.render.resolution_y = 700
for i, (cp, tg) in enumerate([((1.4, -2.0, 1.4), (0, 0, 0.65)), ((-0.9, -1.2, 1.5), (0, 0, 0.75))]):
    bpy.ops.object.camera_add(location=cp); cam = bpy.context.object; S.camera = cam
    cam.rotation_euler = (Vector(tg) - Vector(cp)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 40
    S.render.filepath = f'{PREV}/lib_globe_{i}.png'; bpy.ops.render.render(write_still=True)
