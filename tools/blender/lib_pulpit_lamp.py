# 批次40：藏书阁讲经台「诵经灯」（铜质鹅颈台灯，一对立在 lib_lectern 斜面书托南（高）缘两角，灯罩朝北俯照「本册」）。
# 游戏坐标：+Z = 南，原点 = 灯座底面中心，单位 m。鹅颈从灯座向 −Z（北）弯出，灯罩口朝下偏北。
import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True); S = bpy.context.scene
def mat(name, col, rough=0.5, metal=0.0, emit=None, es=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = es
    return m
M = dict(brass=mat('pl_brass', (0.82, 0.62, 0.30), 0.24, 1.0), brassD=mat('pl_brassDim', (0.52, 0.38, 0.19), 0.36, 1.0),
         shadeIn=mat('pl_shadeIn', (0.95, 0.88, 0.70), 0.6, 0.0, (1.0, 0.82, 0.55), 2.0),
         bulb=mat('pl_bulb', (1.0, 0.9, 0.7), 0.3, 0.0, (1.0, 0.85, 0.6), 8.0),
         felt=mat('pl_felt', (0.08, 0.16, 0.10), 0.95))
def G(x, y, z): return (x, -z, y)  # 游戏 → Blender
def cyl(n, m, r, d, x, y, z, v=32, r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=d, location=G(x, y, z))
    else: bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=d, location=G(x, y, z))
    o = bpy.context.object; o.name = n; o.data.materials.append(M[m]); return o
# 灯座：毡垫 + 三级圆台 + 珠线
cyl('felt', 'felt', 0.072, 0.004, 0, 0.002, 0)
cyl('base0', 'brass', 0.075, 0.016, 0, 0.012, 0)
cyl('base1', 'brassD', 0.064, 0.012, 0, 0.026, 0, r2=0.05)
cyl('bead', 'brass', 0.05, 0.006, 0, 0.035, 0)
cyl('base2', 'brass', 0.04, 0.03, 0, 0.053, 0, r2=0.022)
cyl('collar', 'brassD', 0.018, 0.02, 0, 0.078, 0)
# 立柱 + 中段球结
cyl('stem', 'brass', 0.009, 0.16, 0, 0.165, 0, v=16)
bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=0.02, location=G(0, 0.25, 0)); o = bpy.context.object; o.data.materials.append(M['brassD'])
# 鹅颈：贝塞尔曲线 + 圆截面（带螺旋纹 = 两道细环）
cv = bpy.data.curves.new('neck', 'CURVE'); cv.dimensions = '3D'; cv.bevel_depth = 0.0075; cv.bevel_resolution = 4; cv.resolution_u = 24
sp = cv.splines.new('BEZIER'); sp.bezier_points.add(2)
pts = [((0, 0.265, 0), (0, 0.22, 0), (0, 0.33, 0)), ((0, 0.40, -0.10), (0, 0.39, -0.03), (0, 0.41, -0.17)), ((0, 0.34, -0.26), (0, 0.39, -0.22), (0, 0.31, -0.28))]
for bp, (c, l, r) in zip(sp.bezier_points, pts): bp.co = G(*c); bp.handle_left = G(*l); bp.handle_right = G(*r)
neck = bpy.data.objects.new('neck', cv); S.collection.objects.link(neck); neck.data.materials.append(M['brass'])
# 灯罩：截锥铜罩（口朝下偏北），外铜内暖白 + 卷边 + 顶帽
sh_c = (0, 0.305, -0.29); tilt = math.radians(-30)
def shade_part(n, m, r1, r2, d, off):
    bpy.ops.mesh.primitive_cone_add(vertices=40, radius1=r1, radius2=r2, depth=d, location=(0, 0, 0), end_fill_type='NOTHING')
    o = bpy.context.object; o.name = n; o.data.materials.append(M[m])
    o.location = Vector(G(*sh_c)) + Vector((0, -off * math.sin(tilt) * 0 , 0)); o.rotation_euler = (tilt, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    for v in o.data.vertices: v.co.z += off
    return o
so = shade_part('shadeOut', 'brass', 0.075, 0.035, 0.09, 0); sm = so.modifiers.new('s', 'SOLIDIFY'); sm.thickness = 0.003
si = shade_part('shadeIn', 'shadeIn', 0.072, 0.033, 0.088, 0)
for p in si.data.polygons: p.flip()
bpy.ops.mesh.primitive_torus_add(major_radius=0.076, minor_radius=0.004, location=G(*sh_c)); rim = bpy.context.object; rim.data.materials.append(M['brassD'])
rim.rotation_euler = (tilt, 0, 0); rim.location = Vector(G(*sh_c)) + (Vector((0, 0, -0.045)) @ rim.rotation_euler.to_matrix().transposed())
cap = cyl('cap', 'brassD', 0.038, 0.02, 0, 0, 0); cap.rotation_euler = (tilt, 0, 0); cap.location = Vector(G(*sh_c)) + (Vector((0, 0, 0.05)) @ cap.rotation_euler.to_matrix().transposed())
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.022, location=G(*sh_c)); bulb = bpy.context.object; bulb.data.materials.append(M['bulb'])
bulb.location = Vector(G(*sh_c)) + (Vector((0, 0, -0.012)) @ rim.rotation_euler.to_matrix().transposed())
# 转换 + 合并
bpy.ops.object.select_all(action='DESELECT'); neck.select_set(True); bpy.context.view_layer.objects.active = neck; bpy.ops.object.convert(target='MESH')
for o in S.objects:
    o.select_set(True)
    for md in list(o.modifiers): bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); bpy.ops.object.join(); S.objects[0].name = 'lib_pulpit_lamp'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
print('tris', sum(len(p.vertices) - 2 for p in S.objects[0].data.polygons))
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.35, 0.32, 0.3, 1)
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 2.5; sun.rotation_euler = (math.radians(50), 0, math.radians(30))
bpy.ops.mesh.primitive_plane_add(size=4); pm = mat('floor', (0.15, 0.085, 0.045), 0.5); bpy.context.object.data.materials.append(pm)
S.render.engine = 'CYCLES'; S.cycles.samples = 32; S.cycles.use_denoising = False; S.render.resolution_x = 700; S.render.resolution_y = 600
for i, (cp, tg) in enumerate([((0.55, 0.45, 0.35), (0, 0.15, 0.2)), ((-0.45, -0.75, 0.3), (0, 0.15, 0.2))]):
    bpy.ops.object.camera_add(location=cp); cam = bpy.context.object; S.camera = cam
    cam.rotation_euler = (Vector(tg) - Vector(cp)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 40
    S.render.filepath = f'{PREV}/lib_pulpit_lamp_{i}.png'; bpy.ops.render.render(write_still=True)
