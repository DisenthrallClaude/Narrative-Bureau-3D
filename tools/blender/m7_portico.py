# 批次M7：正门门廊 hero 细部（叠加在 hero_facade.glb 的 portal() 五重退缩券上，不改原 glb、不加碰撞）。
# 内容：①五重券门柱的叶饰钟形柱头（两层卷叶 + 八角柱顶板）②门柱八角阶梯柱础（方墩 + 圆盘 + 环面线脚）
#       ③门洞内侧石门套（三级退缩线脚 + 圆棍 + 底部柱础块）④门楣下沿叠涩线脚（齿饰 + 暗铜嵌线）。
# 坐标：游戏坐标 +Z = 朝外（广场），原点 = 门洞底边中点（游戏 x 0, y FLOOR, z −5）。
# 用法：blender.sh -b -P m7_portico.py -- <out.glb> <preview_dir>
import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True); S = bpy.context.scene
def mat(name, col, rough, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m
M = dict(stone=mat('m7_stone', (0.20, 0.19, 0.18), 0.82), stoneD=mat('m7_stoneDark', (0.12, 0.112, 0.105), 0.86), bronze=mat('m7_bronze', (0.30, 0.20, 0.11), 0.5, 0.6))
def G(x, y, z): return (x, -z, y)
def fin(o, m, bev=0.0, seg=2):
    o.data.materials.append(M[m])
    if bev: md = o.modifiers.new('b', 'BEVEL'); md.width = bev; md.segments = seg; md.limit_method = 'ANGLE'
    return o
def box(m, w, h, d, x, y, z, bev=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=G(x, y, z)); o = bpy.context.object; o.scale = (w, d, h); return fin(o, m, bev)
def cyl(m, r, h, x, y, z, v=8, r2=None, rotz=0.0):  # 竖直柱（游戏 y 向）
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=G(x, y, z))
    else: bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=h, location=G(x, y, z))
    o = bpy.context.object; o.rotation_euler = (0, 0, rotz); return fin(o, m)
def torus(m, R, r, x, y, z):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=20, minor_segments=8, location=G(x, y, z)); return fin(bpy.context.object, m)
def leaf(m, x, y, z, ang, s=1.0, tilt=0.55):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=1, location=G(x, y, z)); o = bpy.context.object
    o.scale = (0.07 * s, 0.035 * s, 0.13 * s); o.rotation_euler = (0, 0, 0)
    # 叶片：扁椭球，朝外倾 tilt，绕柱轴转 ang
    o.rotation_euler = (tilt, 0, ang); o.rotation_mode = 'ZXY'; o.rotation_euler = (tilt, 0, ang)
    return fin(o, m)
HS, W, DP = 9.0, 7.0, 0.55
cols = []
for k in range(1, 6):
    for s in (-1, 1): cols.append((s * ((W + k) / 2 - 0.22), DP * k - 0.2475))
# ① 叶饰柱头（柱身 r 0.2，原 glb 柱头约 Y 8.7–8.9 → 本件包住它）
for (x, z) in cols:
    cyl('stone', 0.2, 0.12, x, HS - 0.62, z, v=16)                    # 柱颈环
    torus('stone', 0.205, 0.035, x, HS - 0.55, z)                      # 颈部圆棍
    cyl('stone', 0.2, 0.38, x, HS - 0.33, z, v=16, r2=0.29)            # 钟形柱头
    for t, (yy, sc, tl) in enumerate([(HS - 0.40, 0.95, 0.35), (HS - 0.22, 1.1, 0.75)]):
        for i in range(8):
            a = (i + 0.5 * t) * math.pi / 4; rr = 0.22 + 0.05 * t
            leaf('stone', x + math.sin(a) * rr, yy, z + math.cos(a) * rr, -a, sc, tl)
    cyl('stone', 0.36, 0.1, x, HS - 0.09, z, v=8, rotz=math.pi / 8)    # 八角柱顶板
    cyl('stoneD', 0.33, 0.05, x, HS - 0.165, z, v=8, rotz=math.pi / 8)
# ② 柱础：方墩 + 八角座 + 两道环面 + 凹槽
for (x, z) in cols:
    box('stoneD', 0.62, 0.32, 0.62, x, 0.16, z, bev=0.025)
    cyl('stone', 0.31, 0.16, x, 0.40, z, v=8, rotz=math.pi / 8)
    torus('stone', 0.24, 0.055, x, 0.52, z); cyl('stoneD', 0.205, 0.07, x, 0.6, z, v=16); torus('stone', 0.215, 0.035, x, 0.66, z)
# ③ 门洞内侧石门套（门洞内皮 x ±3.5，墙前面 z 0 → 向内 1.0；只往洞内凸 0.16，留通行 6.68 m）
for s in (-1, 1):
    xi = s * 3.5
    for j, (dx, dz0, dz1) in enumerate([(0.06, 0.0, -0.32), (0.11, -0.32, -0.66), (0.16, -0.66, -1.0)]):
        box('stone', dx, HS - 0.55 - 0.25, dz0 - dz1, xi - s * dx / 2, 0.25 + (HS - 0.55 - 0.25) / 2, (dz0 + dz1) / 2, bev=0.012)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.05, depth=HS - 0.8, location=G(xi - s * 0.12, 0.25 + (HS - 0.8) / 2, -0.32)); fin(bpy.context.object, 'stone')
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.045, depth=HS - 0.8, location=G(xi - s * 0.17, 0.25 + (HS - 0.8) / 2, -0.66)); fin(bpy.context.object, 'stone')
    box('stoneD', 0.24, 0.5, 1.02, xi - s * 0.12, 0.25, -0.5, bev=0.02)            # 门套底部基石
    box('bronze', 0.012, HS - 1.4, 0.04, xi - s * 0.165, 0.5 + (HS - 1.4) / 2, -0.84)  # 暗铜嵌线
# ④ 门楣下沿叠涩：三级挑出线脚 + 齿饰（原门楣 Y 8.55–9.45，z 0…−0.7）
for j, (h, d, y) in enumerate([(0.10, 0.14, HS - 0.50), (0.08, 0.24, HS - 0.60), (0.06, 0.32, HS - 0.68)]):
    box('stone', W - 0.02, h, d, 0, y, 0.0 + d / 2 - 0.005, bev=0.01)
for i in range(29):
    x = -W / 2 + 0.2 + i * (W - 0.4) / 28
    box('stoneD', 0.1, 0.1, 0.1, x, HS - 0.77, 0.24)
box('bronze', W - 0.3, 0.025, 0.012, 0, HS - 0.55, 0.145)
# 应用修改器、合并、导出
for o in list(S.objects):
    bpy.context.view_layer.objects.active = o
    for md in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
for o in S.objects:
    if o.type == 'MESH' and 'UVMap' not in o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
bpy.ops.object.select_all(action='SELECT'); bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# 立方投影 UV（1 m 一张）
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.cube_project(cube_size=1.0, correct_aspect=True, clip_to_bounds=False, scale_to_bounds=False); bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.join(); ob = bpy.context.view_layer.objects.active; ob.name = 'm7_portico'
for p in ob.data.polygons: p.use_smooth = False
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
print('tris', sum(len(p.vertices) - 2 for p in ob.data.polygons), 'dims', tuple(round(v, 3) for v in ob.dimensions))
if PREV == '-': sys.exit(0)
# 预览：暗石墙背景 + 门洞 + 柱身占位（灰），暖光
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.12, 0.11, 0.10, 1)
ph = mat('ph', (0.32, 0.30, 0.28), 0.9)
def phbox(wd, h, d, x, y, z):
    bpy.ops.mesh.primitive_cube_add(size=1, location=G(x, y, z)); o = bpy.context.object; o.scale = (wd, d, h); o.data.materials.append(ph)
for s in (-1, 1): phbox(8, 12, 1.2, s * 7.5, 6, -0.6)
phbox(7, 3, 1.2, 0, HS + 1.5 + 0.45, -0.6)
for (x, z) in cols:
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.2, depth=HS - 1.3, location=G(x, 0.66 + (HS - 1.3) / 2, z)); bpy.context.object.data.materials.append(ph)
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0)); bpy.context.object.data.materials.append(mat('fl', (0.25, 0.24, 0.22), 0.8))
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 3.0; sun.data.color = (1.0, 0.86, 0.7); sun.rotation_euler = (math.radians(55), 0, math.radians(-35))
bpy.ops.object.light_add(type='POINT', location=G(0, 4, 3)); bpy.context.object.data.energy = 600; bpy.context.object.data.color = (1.0, 0.75, 0.5)
S.render.engine = 'CYCLES'; S.cycles.samples = 16; S.cycles.use_denoising = False; S.render.resolution_x = 640; S.render.resolution_y = 640
for i, (cp, tg, lens) in enumerate([(G(0, 4.5, 14), G(0, 4.5, 0), 30), (G(6.5, 2.0, 5.5), G(3.6, 3.5, -0.3), 28), (G(-1.2, 8.0, 3.0), G(-4.5, 8.6, 1.0), 30)]):
    bpy.ops.object.camera_add(location=cp); cam = bpy.context.object; S.camera = cam
    cam.rotation_euler = (Vector(tg) - Vector(cp)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lens
    S.render.filepath = f'{PREV}/m7_portico_{i}.png'; bpy.ops.render.render(write_still=True)
