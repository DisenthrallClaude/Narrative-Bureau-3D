# 批次27 E5：1960–80 年代机关门卫岗亭（替换 simple_90_s_kiosk）。
# 正面 +Z（值班窗口），原点 = 底面中心，单位 m。占地 3.2 × 3.4（含石基），总高 3.25。
# 用法：blender.sh -b -P guard_booth.py -- <out.glb> <preview_dir>
import bpy, bmesh, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene

def mat(name, col, rough=0.6, metal=0.0, emit=None, alpha=1.0, trans=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = 1.5
    if trans: b.inputs['Transmission Weight'].default_value = trans
    if alpha < 1: b.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None
    return m
M = dict(
  granite=mat('booth_granite', (0.42, 0.40, 0.37), 0.75),
  graniteD=mat('booth_graniteDark', (0.22, 0.21, 0.20), 0.7),
  terrazzo=mat('booth_wallLower', (0.55, 0.52, 0.46), 0.8),   # 水刷石墙裙
  plaster=mat('booth_plaster', (0.80, 0.76, 0.66), 0.85),      # 浅米黄抹灰
  wood=mat('booth_woodFrame', (0.30, 0.13, 0.06), 0.45),       # 枣红漆木窗框
  glass=mat('booth_glass', (0.55, 0.65, 0.62), 0.05, alpha=0.35, trans=0.8),
  roof=mat('booth_roofTile', (0.18, 0.22, 0.20), 0.6, 0.2),     # 墨绿铁皮/瓦
  eave=mat('booth_eaveFascia', (0.75, 0.72, 0.64), 0.7),
  brass=mat('booth_brass', (0.78, 0.58, 0.28), 0.3, 1.0),
  red=mat('booth_redStar', (0.70, 0.08, 0.06), 0.4),
  lamp=mat('booth_lampGlow', (1.0, 0.85, 0.6), 0.3, emit=(1.0, 0.82, 0.55)),
  iron=mat('booth_iron', (0.08, 0.08, 0.08), 0.5, 0.8),
)
def box(name, m, sx, sy, sz, x=0, y=0, z=0, rx=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y))  # Blender Z-up；输出 glTF 时 +Y up，-Y(blender) = +Z(gl)
    o = bpy.context.object; o.name = name; o.scale = (sx, sz, sy); o.rotation_euler[0] = rx
    o.data.materials.append(M[m]); return o
# 坐标约定：函数参数 (x, y=高, z=gl 前后)，前方 +z
W, D = 3.0, 3.2           # 墙体外包
# —— 石基：两级花岗岩 + 倒角线脚 ——
box('plinth0', 'graniteD', 3.3, 0.18, 3.5, y=0.09)
box('plinth1', 'granite', 3.16, 0.30, 3.36, y=0.33)
box('plinthCap', 'granite', 3.22, 0.06, 3.42, y=0.51)
# 台阶（门在东侧 +x → 局部右侧）
box('step', 'granite', 0.5, 0.18, 1.1, x=1.85, y=0.09, z=-0.6)
Y0 = 0.54
# —— 墙裙（水刷石）到窗台 1.05 ——
H_low = 0.62
for (n, sx, sz, x, z) in [('lowF', W, 0.24, 0, D/2-0.12), ('lowB', W, 0.24, 0, -D/2+0.12), ('lowL', 0.24, D, -W/2+0.12, 0), ('lowR', 0.24, D, W/2-0.12, 0)]:
    box(n, 'terrazzo', sx, H_low, sz, x=x, y=Y0+H_low/2, z=z)
for sx in (-1, 1):
    for sz in (-1, 1): box(f'lowPier{sx}{sz}', 'granite', 0.38, H_low, 0.38, x=sx*(W/2-0.17), y=Y0+H_low/2, z=sz*(D/2-0.17))
# 窗台石
for (n, sx, sz, x, z) in [('sillF', W+0.08, 0.34, 0, D/2-0.1), ('sillB', W+0.08, 0.34, 0, -D/2+0.1), ('sillL', 0.34, D+0.08, -W/2+0.1, 0), ('sillR', 0.34, D+0.08, W/2-0.1, 0)]:
    box(n, 'granite', sx, 0.07, sz, x=x, y=Y0+H_low+0.035, z=z)
YW0 = Y0 + H_low + 0.07; HW = 1.2; YW1 = YW0 + HW
# —— 四角抹灰壁柱 ——
for sx in (-1, 1):
    for sz in (-1, 1):
        box(f'pier{sx}{sz}', 'plaster', 0.34, HW, 0.34, x=sx*(W/2-0.17), y=YW0+HW/2, z=sz*(D/2-0.17))
# —— 木窗：每面窗带，竖梃分格 + 玻璃 ——
def window_band(face):
    if face in ('F', 'B'):
        L = W - 0.68; zc = (D/2 - 0.12) * (1 if face == 'F' else -1); n = 3
        box(f'glass{face}', 'glass', L, HW-0.1, 0.02, z=zc, y=YW0+HW/2)
        for k in range(n+1):
            x = -L/2 + k*L/n; box(f'mull{face}{k}', 'wood', 0.07, HW, 0.1, x=x, y=YW0+HW/2, z=zc)
        for yy in (YW0+0.04, YW1-0.04, YW0+HW*0.68): box(f'rail{face}{yy:.2f}', 'wood', L, 0.07, 0.1, y=yy, z=zc)
    else:
        L = D - 0.68; xc = (W/2 - 0.12) * (1 if face == 'R' else -1); n = 3
        box(f'glass{face}', 'glass', 0.02, HW-0.1, L, x=xc, y=YW0+HW/2)
        for k in range(n+1):
            z = -L/2 + k*L/n; box(f'mull{face}{k}', 'wood', 0.1, HW, 0.07, x=xc, y=YW0+HW/2, z=z)
        for yy in (YW0+0.04, YW1-0.04, YW0+HW*0.68): box(f'rail{face}{yy:.2f}', 'wood', 0.1, 0.07, L, x=xc, y=yy)
for f in ('F', 'B', 'L'): window_band(f)
# 右侧（东）= 门：木门 + 门上亮子
box('doorLeafR', 'wood', 0.08, HW+H_low-0.05, 0.9, x=W/2+0.0, y=Y0+(HW+H_low)/2, z=-0.6)
for k in range(3): box(f'doorPanel{k}', 'wood', 0.1, 0.36, 0.7, x=W/2+0.02, y=Y0+0.3+k*0.55, z=-0.6)
box('doorKnob', 'brass', 0.08, 0.06, 0.06, x=W/2+0.07, y=Y0+0.95, z=-0.25)
box('glassRfix', 'glass', 0.02, HW-0.1, 1.2, x=W/2-0.12, y=YW0+HW/2, z=0.7)
for z in (0.1, 0.7, 1.3): box(f'mullR{z}', 'wood', 0.1, HW, 0.07, x=W/2-0.12, y=YW0+HW/2, z=z)
# —— 值班窗口（正面中格外凸窗台 + 推拉小窗 + 铜递件槽）——
box('dutyLedge', 'granite', 1.0, 0.06, 0.34, y=YW0+0.03, z=D/2+0.1)
for sx in (-1, 1): box(f'ledgeBracket{sx}', 'iron', 0.04, 0.2, 0.26, x=sx*0.42, y=YW0-0.1, z=D/2+0.05)
box('slotPlate', 'brass', 0.5, 0.05, 0.02, y=YW0+0.12, z=D/2-0.05)
box('slideSash', 'wood', 0.5, 0.5, 0.05, x=0.22, y=YW0+0.32, z=D/2-0.02)
# —— 铜牌（值班窗口左侧壁柱）+ 红五星（檐下正中）——
box('brassPlaque', 'brass', 0.28, 0.6, 0.02, x=-(W/2-0.17), y=YW0+0.6, z=D/2+0.01)
box('plaqueRim', 'graniteD', 0.32, 0.64, 0.01, x=-(W/2-0.17), y=YW0+0.6, z=D/2)
# —— 檐口：抹灰檐板 + 线脚两道 ——
Y1 = YW1
box('lintel', 'plaster', W+0.02, 0.32, D+0.02, y=Y1+0.16)
box('corn1', 'eave', W+0.18, 0.08, D+0.18, y=Y1+0.36)
box('corn2', 'eave', W+0.36, 0.1, D+0.36, y=Y1+0.45)
# 红五星
bpy.ops.mesh.primitive_circle_add(vertices=10, radius=0.16, fill_type='NGON', location=(0, -(D/2+0.02), Y1+0.16))
st = bpy.context.object; st.name = 'redStar'; st.rotation_euler[0] = math.pi/2
for i, v in enumerate(st.data.vertices):
    if i % 2: v.co *= 0.42
st.data.materials.append(M['red'])
sol = st.modifiers.new('s', 'SOLIDIFY'); sol.thickness = 0.03
# —— 四坡顶（墨绿）+ 屋脊宝顶 ——
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=(W+0.6)/math.sqrt(2)*1.0, radius2=0.12, depth=0.62, location=(0, 0, Y1+0.5+0.31))
rf = bpy.context.object; rf.name = 'roof'; rf.rotation_euler[2] = math.pi/4; rf.scale = (1.0, (D+0.6)/(W+0.6), 1); rf.data.materials.append(M['roof'])
box('finialBase', 'brass', 0.16, 0.08, 0.16, y=Y1+1.16)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(0, 0, Y1+1.27)); fo = bpy.context.object; fo.name = 'finial'; fo.data.materials.append(M['brass'])
# —— 门灯（铁臂 + 暖光罩，东侧门上）——
box('lampArm', 'iron', 0.3, 0.03, 0.03, x=W/2+0.15, y=Y1-0.1, z=-0.6)
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.2, location=(W/2+0.3, 0.6, Y1-0.22)); lp = bpy.context.object; lp.name = 'lampGlow'; lp.data.materials.append(M['lamp'])
# —— 室内：值班桌 + 电话 + 台灯（透过玻璃可见）——
box('desk', 'wood', 1.6, 0.06, 0.55, y=Y0+0.75, z=D/2-0.5)
box('deskBody', 'wood', 1.6, 0.7, 0.5, y=Y0+0.38, z=D/2-0.52)
box('phone', 'iron', 0.2, 0.08, 0.16, x=0.45, y=Y0+0.82, z=D/2-0.45)
box('ledger', 'red', 0.3, 0.03, 0.22, x=-0.3, y=Y0+0.795, z=D/2-0.45)
box('floor', 'graniteD', W-0.48, 0.02, D-0.48, y=Y0+0.01)
box('ceiling', 'plaster', W-0.2, 0.04, D-0.2, y=Y1-0.02)
# —— 应用变换并合并为单一对象，导出 ——
for o in S.objects:
    o.select_set(True)
bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.convert(target='MESH')
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
bpy.ops.object.join(); S.objects[0].name = 'guard_booth'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
print('tris', sum(len(p.vertices) - 2 for p in S.objects[0].data.polygons))
# —— 预览（Cycles 小样）——
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.45, 0.42, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.8
bpy.ops.object.light_add(type='SUN', location=(5, -5, 8)); sun = bpy.context.object; sun.data.energy = 3.0; sun.rotation_euler = (math.radians(60), 0, math.radians(35)); sun.data.color = (1.0, 0.75, 0.55)
bpy.ops.mesh.primitive_plane_add(size=30); pl = bpy.context.object; pl.data.materials.append(M['graniteD'])
S.render.engine = 'CYCLES'; S.cycles.samples = 48; S.cycles.use_denoising = False; S.render.resolution_x = 900; S.render.resolution_y = 700
for i, (pos, tgt) in enumerate([((4.2, -6.5, 2.4), (0, 0, 1.4)), ((-5.5, -4.0, 3.6), (0, 0, 1.3))]):
    bpy.ops.object.camera_add(location=pos); cam = bpy.context.object; S.camera = cam
    d = Vector(tgt) - Vector(pos); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 35
    S.render.filepath = f'{PREV}/guard_booth_{i}.png'; bpy.ops.render.render(write_still=True)
