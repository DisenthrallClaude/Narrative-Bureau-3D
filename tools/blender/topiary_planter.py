# 批次27 E1：修剪柱形侧柏 + 花岗岩方形花箱（替换 cypress() 低模“绿团”）。原点底面中心，+Y up（glTF）。
# 绿叶材质名含 'hedge' → 游戏内替换为 M.hedge（叶片贴图 + 法线）。总高约 3.4 m，箱 1.3×1.3×0.75。
# 用法：blender.sh -b -P topiary_planter.py -- <out.glb> <preview_dir>
import bpy, bmesh, sys, math, random
from mathutils import Vector, noise
argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene; random.seed(7)
def mat(name, col, rough):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; return m
MG = mat('planter_granite', (0.46, 0.44, 0.40), 0.75); MGD = mat('planter_graniteDark', (0.25, 0.24, 0.22), 0.7)
MS = mat('planter_soil', (0.12, 0.08, 0.05), 0.95); MH = mat('hedge_topiary', (0.16, 0.26, 0.11), 0.9)
def cube(name, m, sx, sy, sz, z, bev=0.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, z)); o = bpy.context.object; o.name = name; o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True); bv = o.modifiers.new('b', 'BEVEL'); bv.width = bev; bv.segments = 2
    o.data.materials.append(m); return o
# 花箱：底座线脚 + 箱身（四面凸芯板）+ 压顶
cube('base', MGD, 1.42, 1.42, 0.12, 0.06)
cube('body', MG, 1.30, 1.30, 0.56, 0.12 + 0.28)
for ang in range(4):
    a = ang * math.pi / 2; d = 0.655
    bpy.ops.mesh.primitive_cube_add(size=1, location=(math.cos(a) * d, math.sin(a) * d, 0.40)); p = bpy.context.object
    p.scale = (0.03 if ang % 2 == 0 else 0.9, 0.9 if ang % 2 == 0 else 0.03, 0.34); bpy.ops.object.transform_apply(scale=True)
    bv = p.modifiers.new('b', 'BEVEL'); bv.width = 0.012; p.data.materials.append(MG)
cube('cap', MG, 1.44, 1.44, 0.08, 0.72, bev=0.025)
cube('soil', MS, 1.16, 1.16, 0.04, 0.73, bev=0.0)
# 柱形侧柏：细分圆柱 → 剪出锥顶 → 叶簇噪声位移（修剪后仍有小叶团起伏）
bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.5, depth=2.7, location=(0, 0, 0.70 + 1.35))
t = bpy.context.object; t.name = 'topiary'
bm = bmesh.new(); bm.from_mesh(t.data)
bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > 0.1], cuts=26)
bm.to_mesh(t.data); bm.free()
for v in t.data.vertices:
    h = min(1.0, max(0.0, (v.co.z + 1.35) / 2.7))
    prof = 0.60 * ((1 - h) ** 0.82) + 0.035 * math.sin(h * math.pi)  # 修剪圆锥（紫杉 / 侧柏造型），底宽 1.2 m，略外凸
    r = math.hypot(v.co.x, v.co.y)
    if r > 1e-4:
        n = noise.noise(Vector((v.co.x * 9, v.co.y * 9, v.co.z * 9))) * 0.05 + noise.noise(Vector((v.co.x * 30, v.co.y * 30, v.co.z * 30))) * 0.018
        k = (prof + n) / r; v.co.x *= k; v.co.y *= k
    pass
t.data.materials.append(MH)
for p in t.data.polygons: p.use_smooth = True
# 树干根部（土面上露一点）
bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.07, depth=0.12, location=(0, 0, 0.78)); bpy.context.object.data.materials.append(MS)
for o in S.objects: o.select_set(True)
bpy.context.view_layer.objects.active = t
bpy.ops.object.convert(target='MESH'); bpy.ops.object.join(); S.objects[0].name = 'topiary_planter'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
print('tris', sum(len(p.vertices) - 2 for p in bpy.context.object.data.polygons))
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.45, 0.42, 1)
bpy.ops.object.light_add(type='SUN'); sun = bpy.context.object; sun.data.energy = 3.0; sun.rotation_euler = (math.radians(62), 0, math.radians(35)); sun.data.color = (1.0, 0.78, 0.58)
bpy.ops.mesh.primitive_plane_add(size=30); bpy.context.object.data.materials.append(MGD)
S.render.engine = 'CYCLES'; S.cycles.samples = 40; S.cycles.use_denoising = False; S.render.resolution_x = 700; S.render.resolution_y = 800
bpy.ops.object.camera_add(location=(3.4, -4.6, 2.2)); cam = bpy.context.object; S.camera = cam
cam.rotation_euler = (Vector((0, 0, 1.6)) - cam.location).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 35
S.render.filepath = f'{PREV}/topiary_planter_0.png'; bpy.ops.render.render(write_still=True)
