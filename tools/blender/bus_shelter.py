# 批次38：1960–80 年代铁皮公交候车亭（站牌亭），无人物。
# 正面 +Z（朝车行道），原点 = 底面中心，单位 m。棚体 3.6 × 1.5，高 2.65；东端（+x）独立站牌杆（牌面留白，游戏里贴有字画布）。
# 用法：blender.sh -b -P bus_shelter.py -- <out.glb> <preview_dir>
import bpy, bmesh, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene
def mat(name, col, rough=0.6, metal=0.0, emit=None, alpha=1.0, trans=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = 1.2
    if trans: b.inputs['Transmission Weight'].default_value = trans
    if alpha < 1: b.inputs['Alpha'].default_value = alpha
    return m
M = dict(
  frame=mat('bs_greenPaint', (0.10, 0.24, 0.20), 0.45, 0.3),     # 墨绿漆钢管
  sheet=mat('bs_sheetBlue', (0.36, 0.52, 0.55), 0.5, 0.35),       # 浅蓝灰漆铁皮
  roof=mat('bs_roofGalv', (0.46, 0.47, 0.46), 0.42, 0.75),        # 镀锌瓦楞铁皮
  fascia=mat('bs_fasciaCream', (0.85, 0.80, 0.66), 0.6),          # 米白檐板
  red=mat('bs_redStripe', (0.66, 0.09, 0.07), 0.45),
  board=mat('bs_boardWhite', (0.90, 0.89, 0.84), 0.55),           # 站牌 / 时刻表白底
  glass=mat('bs_wireGlass', (0.55, 0.62, 0.60), 0.08, alpha=0.4, trans=0.7),
  wood=mat('bs_benchWood', (0.36, 0.20, 0.10), 0.55),
  iron=mat('bs_iron', (0.07, 0.07, 0.07), 0.5, 0.8),
  conc=mat('bs_concrete', (0.50, 0.49, 0.46), 0.85),
  rust=mat('bs_rustEdge', (0.35, 0.18, 0.09), 0.8, 0.2),
)
def box(name, m, sx, sy, sz, x=0, y=0, z=0, rx=0, rz=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y)); o = bpy.context.object; o.name = name
    o.scale = (sx, sz, sy); o.rotation_euler = (rx, 0, rz); o.data.materials.append(M[m]); return o
def cyl(name, m, r, h, x=0, y=0, z=0, v=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=(x, -z, y)); o = bpy.context.object; o.name = name; o.data.materials.append(M[m]); return o
L, D, H = 3.6, 1.5, 2.35   # 棚长 / 进深 / 檐下净高
# —— 混凝土基座板 + 四根方钢管立柱（底板 + 螺栓）——
box('slab', 'conc', L + 0.3, 0.08, D + 0.2, y=0.04)
for sx in (-1, 1):
    for sz in (-1, 1):
        x, z = sx * (L / 2 - 0.06), sz * (D / 2 - 0.06) - 0.05
        hh = H + (0.12 if sz < 0 else 0.0)
        box(f'post{sx}{sz}', 'frame', 0.08, hh, 0.08, x=x, y=0.08 + hh / 2, z=z)
        box(f'plate{sx}{sz}', 'iron', 0.2, 0.012, 0.2, x=x, y=0.086, z=z)
        for bx in (-1, 1):
            for bz in (-1, 1): cyl(f'bolt{sx}{sz}{bx}{bz}', 'iron', 0.012, 0.03, x=x + bx * 0.07, y=0.1, z=z + bz * 0.07, v=6)
# 顶部纵横梁
for sz, hy in ((-1, H + 0.2), (1, H + 0.08)):
    box(f'beamL{sz}', 'frame', L, 0.08, 0.08, y=hy, z=sz * (D / 2 - 0.06) - 0.05)
for sx in (-1, 0, 1):
    box(f'rafter{sx}', 'frame', 0.06, 0.06, D + 0.1, x=sx * (L / 2 - 0.06), y=H + 0.17, z=-0.05, rx=math.atan2(0.12, D))
# —— 拱形瓦楞铁皮顶：沿 x 正弦起伏（波距 0.076 m），沿 z 拱起 0.22 m，前后各出挑 0.3 m ——
bm = bmesh.new(); NX, NZ = 96, 14; Z0, Z1 = -D / 2 - 0.35, D / 2 + 0.3; X0, X1 = -L / 2 - 0.2, L / 2 + 0.2
vs = []
for j in range(NZ + 1):
    t = j / NZ; z = Z0 + (Z1 - Z0) * t; arch = 0.22 * math.sin(math.pi * t); slope = 0.12 * (1 - t)
    row = []
    for i in range(NX + 1):
        x = X0 + (X1 - X0) * i / NX; rip = 0.018 * math.sin(i * math.pi / 2)
        row.append(bm.verts.new((x, -z, H + 0.24 + arch + slope + rip)))
    vs.append(row)
for j in range(NZ):
    for i in range(NX): bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
me = bpy.data.meshes.new('roofSheet'); bm.to_mesh(me); bm.free(); ro = bpy.data.objects.new('roofSheet', me); S.collection.objects.link(ro); ro.data.materials.append(M['roof'])
sol = ro.modifiers.new('s', 'SOLIDIFY'); sol.thickness = 0.012
for p in me.polygons: p.use_smooth = True
# 前檐板（米白 + 红色腰线，游戏里贴站名字）
box('fascia', 'fascia', L + 0.42, 0.26, 0.03, y=H + 0.3, z=Z1 + 0.01)
box('fasciaRed', 'red', L + 0.42, 0.04, 0.035, y=H + 0.2, z=Z1 + 0.012)
box('fasciaB', 'fascia', L + 0.42, 0.18, 0.03, y=H + 0.4, z=Z0 - 0.01)
# —— 背板：下半实心铁皮（压筋）、上半三格夹丝玻璃 ——
zb = -D / 2 + 0.01
box('backSheet', 'sheet', L - 0.14, 1.0, 0.02, y=0.18 + 0.5, z=zb)
for k in range(6): box(f'backRib{k}', 'sheet', L - 0.14, 0.025, 0.018, y=0.28 + k * 0.16, z=zb + 0.018)
box('backRail', 'frame', L - 0.1, 0.06, 0.06, y=1.2, z=zb)
box('backRail0', 'frame', L - 0.1, 0.05, 0.05, y=0.16, z=zb)
for k in range(4): box(f'backMull{k}', 'frame', 0.05, 1.0, 0.05, x=-L / 2 + 0.06 + k * (L - 0.12) / 3, y=1.73, z=zb)
box('backGlass', 'glass', L - 0.14, 0.98, 0.01, y=1.73, z=zb)
box('backTop', 'frame', L - 0.1, 0.05, 0.05, y=2.24, z=zb)
# —— 西侧挡风板（铁皮 + 时刻表白板）；东侧敞开 ——
xs = -L / 2 + 0.01
box('sideSheet', 'sheet', 0.02, 1.0, D - 0.32, x=xs, y=0.68, z=-0.16)
box('sideRail', 'frame', 0.05, 0.05, D - 0.25, x=xs, y=1.2, z=-0.16)
box('sideGlass', 'glass', 0.01, 0.98, D - 0.32, x=xs, y=1.73, z=-0.16)
box('timetableFrame', 'frame', 0.03, 0.66, 0.56, x=xs + 0.02, y=1.65, z=-0.2)
box('timetable', 'board', 0.012, 0.6, 0.5, x=xs + 0.04, y=1.65, z=-0.2)
for k in range(5): box(f'ttLine{k}', 'red' if k == 0 else 'iron', 0.004, 0.012, 0.42, x=xs + 0.048, y=1.88 - k * 0.1, z=-0.2)
# —— 长凳：铸铁三角托 + 三条木条，挂在背板 ——
for bx in (-1.1, 0, 1.1):
    box(f'benchArm{bx}', 'iron', 0.05, 0.05, 0.42, x=bx, y=0.45, z=zb + 0.23)
    box(f'benchStrut{bx}', 'iron', 0.04, 0.04, 0.5, x=bx, y=0.32, z=zb + 0.15, rx=-0.75)
for k in range(3): box(f'benchSlat{k}', 'wood', L - 0.6, 0.035, 0.11, y=0.49, z=zb + 0.08 + k * 0.13)
box('backrestSlat', 'wood', L - 0.6, 0.1, 0.03, y=0.82, z=zb + 0.04)
# 边角锈迹（铁皮下沿）
box('rustEdge', 'rust', L - 0.14, 0.04, 0.022, y=0.2, z=zb + 0.002)
# —— 东端独立站牌杆：铸铁圆杆 + 长方站牌（白底红框，牌面留白给游戏贴字）+ 顶部圆牌 ——
px, pz = L / 2 + 0.55, D / 2 - 0.1
cyl('signPole', 'frame', 0.045, 2.9, x=px, y=0.08 + 1.45, z=pz)
cyl('signFoot', 'conc', 0.18, 0.12, x=px, y=0.06, z=pz)
box('signRed', 'red', 0.64, 0.92, 0.03, x=px, y=1.95, z=pz + 0.06)
box('signFace', 'board', 0.56, 0.84, 0.032, x=px, y=1.95, z=pz + 0.065)
box('signFaceB', 'board', 0.56, 0.84, 0.032, x=px, y=1.95, z=pz + 0.055)
for yy in (1.5, 2.4): box(f'signClamp{yy}', 'iron', 0.12, 0.04, 0.1, x=px, y=yy, z=pz + 0.02)
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.2, depth=0.03, location=(px, -(pz + 0.04), 2.78)); dc = bpy.context.object; dc.name = 'signDisc'; dc.rotation_euler[0] = math.pi / 2; dc.data.materials.append(M['red'])
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.16, depth=0.035, location=(px, -(pz + 0.042), 2.78)); dc = bpy.context.object; dc.name = 'signDiscIn'; dc.rotation_euler[0] = math.pi / 2; dc.data.materials.append(M['board'])
# —— 合并导出 ——
for o in S.objects: o.select_set(True)
bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.convert(target='MESH'); bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
bpy.ops.object.join(); S.objects[0].name = 'bus_shelter'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
print('tris', sum(len(p.vertices) - 2 for p in S.objects[0].data.polygons))
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.45, 0.42, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.8
bpy.ops.object.light_add(type='SUN', location=(5, -5, 8)); sun = bpy.context.object; sun.data.energy = 3.0; sun.rotation_euler = (math.radians(55), 0, math.radians(30)); sun.data.color = (1.0, 0.8, 0.62)
bpy.ops.mesh.primitive_plane_add(size=30); pl = bpy.context.object; pl.data.materials.append(M['conc'])
S.render.engine = 'CYCLES'; S.cycles.samples = 40; S.cycles.use_denoising = False; S.render.resolution_x = 900; S.render.resolution_y = 650
for i, (pos, tgt) in enumerate([((3.2, -6.0, 1.9), (0.2, 0, 1.3)), ((-4.5, -3.2, 3.4), (0, 0, 1.2))]):
    bpy.ops.object.camera_add(location=pos); cam = bpy.context.object; S.camera = cam
    d = Vector(tgt) - Vector(pos); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 32
    S.render.filepath = f'{PREV}/bus_shelter_{i}.png'; bpy.ops.render.render(write_still=True)
