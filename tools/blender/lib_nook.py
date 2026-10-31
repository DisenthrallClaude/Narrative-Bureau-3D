# 批次42：藏书阁阅读龛（剧情锚点外壳 1.4×0.8 纯黑方块 → 精建）：胡桃书桌（两侧带凸芯板的桌腿板 + 中央抽屉 + 铜拉手 + 背挡板）
# + 桌后书格上架（两侧板 + 两层搁板 + 中竖隔 + 檐口线脚 + 铜挂镜线，格内按规则排精装书）+ 绿罩银行家台灯 + 软垫扶手阅读椅。
# 游戏坐标：+Z = 龛背（靠墙 / 远离圆厅中心），−Z = 读者一侧；原点 = 桌脚占地中心地面；单位 m。桌面高 0.76。
import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True); S = bpy.context.scene
def mat(name, col, rough=0.5, metal=0.0, emit=None, es=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = es
    return m
M = dict(walnut=mat('sw_walnut', (0.20, 0.10, 0.05), 0.45), walnutD=mat('sw_walnutDark', (0.11, 0.055, 0.03), 0.5),
         brass=mat('nk_brass', (0.82, 0.62, 0.30), 0.26, 1.0), brassD=mat('nk_brassDim', (0.52, 0.38, 0.19), 0.38, 1.0),
         green=mat('nk_lampGreen', (0.04, 0.30, 0.12), 0.18, 0.0, (0.10, 0.45, 0.18), 0.6),
         glow=mat('nk_lampGlow', (1.0, 0.92, 0.75), 0.4, 0.0, (1.0, 0.84, 0.58), 6.0),
         leather=mat('nk_leather', (0.30, 0.07, 0.05), 0.55), leatherD=mat('nk_leatherDark', (0.18, 0.04, 0.03), 0.6),
         felt=mat('nk_felt', (0.07, 0.17, 0.10), 0.92),
         b0=mat('nk_book0', (0.34, 0.08, 0.06), 0.6), b1=mat('nk_book1', (0.08, 0.20, 0.12), 0.6), b2=mat('nk_book2', (0.30, 0.18, 0.08), 0.6),
         b3=mat('nk_book3', (0.07, 0.10, 0.22), 0.6), b4=mat('nk_book4', (0.55, 0.45, 0.30), 0.65), gilt=mat('nk_gilt', (0.85, 0.66, 0.30), 0.3, 1.0))
def G(x, y, z): return (x, -z, y)
def box(m, w, h, d, x, y, z, bev=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=G(x, y, z)); o = bpy.context.object; o.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    if bev > 0: md = o.modifiers.new('b', 'BEVEL'); md.width = bev; md.segments = 2
    o.data.materials.append(M[m]); return o
def cyl(m, r, d, x, y, z, v=24, r2=None, axis='y'):
    rot = {'y': (0, 0, 0), 'x': (0, math.pi / 2, 0), 'z': (math.pi / 2, 0, 0)}[axis]
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=d, location=G(x, y, z), rotation=rot)
    else: bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=d, location=G(x, y, z), rotation=rot)
    o = bpy.context.object; o.data.materials.append(M[m]); return o
TOP = 0.76
# —— 书桌 ——
box('walnutD', 1.40, 0.045, 0.80, 0, TOP - 0.0225, 0, 0.008)                      # 桌面（深色边）
box('felt', 1.22, 0.004, 0.50, 0, TOP + 0.002, -0.10)                              # 绿毡书写垫
for sz in (-0.36, 0.16):                                                             # 毡垫铜压条
    box('brass', 1.24, 0.006, 0.012, 0, TOP + 0.003, sz)
for sx in (-1, 1):                                                                   # 两侧桌腿板（带凸芯板）
    box('walnut', 0.06, TOP - 0.045, 0.76, sx * 0.66, (TOP - 0.045) / 2, 0, 0.006)
    box('walnut', 0.075, 0.08, 0.80, sx * 0.66, 0.04, 0, 0.006)                    # 踢脚
    box('walnutD', 0.02, 0.44, 0.52, sx * 0.695, 0.38, 0, 0.004)                   # 凹槽
    box('walnut', 0.03, 0.38, 0.46, sx * 0.70, 0.38, 0, 0.01)                      # 凸芯
    box('brassD', 0.07, 0.012, 0.78, sx * 0.66, 0.09, 0)                           # 铜脚线
box('walnut', 1.26, 0.56, 0.03, 0, 0.40, 0.36, 0.004)                              # 背挡板
box('walnut', 1.26, 0.10, 0.70, 0, TOP - 0.095, 0, 0.004)                          # 裙板 / 抽屉箱
box('walnutD', 0.62, 0.075, 0.012, 0, TOP - 0.095, -0.355, 0.003)                  # 抽屉面
box('brass', 0.12, 0.012, 0.02, 0, TOP - 0.095, -0.368)                            # 铜拉手
for sx in (-1, 1): cyl('brass', 0.008, 0.02, sx * 0.06, TOP - 0.095, -0.37, 10, axis='z')
box('brass', 0.05, 0.03, 0.004, 0, TOP - 0.07, -0.363)                             # 铜名签框
# —— 书格上架（桌后） ——
HZ0, HZ1, HY1 = 0.16, 0.40, 1.88; HZ = (HZ0 + HZ1) / 2; HD = HZ1 - HZ0
for sx in (-1, 1):
    box('walnut', 0.05, HY1 - TOP, HD, sx * 0.675, (TOP + HY1) / 2, HZ, 0.005)
    box('walnutD', 0.012, HY1 - TOP - 0.16, 0.02, sx * 0.675, (TOP + HY1) / 2, HZ0 - 0.008)  # 侧板前沿凹线
box('walnutD', 1.30, HY1 - TOP, 0.02, 0, (TOP + HY1) / 2, HZ1 - 0.01)             # 背板
box('walnut', 0.03, HY1 - TOP - 0.06, HD - 0.02, 0, (TOP + HY1) / 2 + 0.03, HZ)   # 中竖隔
SH = [TOP + 0.36, TOP + 0.72]
for y in SH:
    box('walnut', 1.30, 0.03, HD, 0, y, HZ, 0.004)
    box('brassD', 1.30, 0.008, 0.008, 0, y + 0.012, HZ0 - 0.004)                   # 搁板铜包边
box('walnut', 1.30, 0.03, HD, 0, TOP + 0.015, HZ)                                   # 底板
box('walnut', 1.44, 0.06, HD + 0.06, 0, HY1, HZ - 0.01, 0.006)                     # 檐口
box('walnut', 1.48, 0.03, HD + 0.10, 0, HY1 + 0.045, HZ - 0.02, 0.008)            # 冠线
box('walnutD', 1.40, 0.04, 0.02, 0, HY1 - 0.05, HZ0 - 0.012, 0.004)               # 檐下齿带
for k in range(18): box('walnut', 0.035, 0.03, 0.02, -0.68 + 0.04 + k * 0.0782, HY1 - 0.05, HZ0 - 0.024)
box('brass', 1.36, 0.01, 0.01, 0, HY1 - 0.085, HZ0 - 0.02)                         # 铜挂镜线
# 格内精装书：按格序号确定尺寸 / 颜色（非随机），每格靠一侧立放 + 一摞平放
BK = ['b0', 'b1', 'b2', 'b3', 'b0', 'b4', 'b1', 'b2']
cells = [(-0.65, -0.015, TOP + 0.03, SH[0] - 0.015), (0.015, 0.65, TOP + 0.03, SH[0] - 0.015),
         (-0.65, -0.015, SH[0] + 0.015, SH[1] - 0.015), (0.015, 0.65, SH[0] + 0.015, SH[1] - 0.015),
         (-0.65, -0.015, SH[1] + 0.015, HY1 - 0.03), (0.015, 0.65, SH[1] + 0.015, HY1 - 0.03)]
for ci, (x0, x1, y0, y1) in enumerate(cells):
    hmax = y1 - y0 - 0.03; x = x0 + 0.01; stand_end = x1 - (0.20 if ci % 2 == 0 else 0.0) - 0.01
    if ci % 2 == 1: x = x0 + 0.20  # 右格先留平放区在左
    i = 0
    while True:
        t = 0.028 + 0.012 * ((i * 7 + ci * 3) % 4) / 3; h = hmax * (0.72 + 0.26 * (((i * 5 + ci) % 5) / 4))
        if x + t > (stand_end if ci % 2 == 0 else x1 - 0.01): break
        m = BK[(i + ci * 3) % len(BK)]; d = 0.19 - 0.02 * ((i + ci) % 2)
        box(m, t, h, d, x + t / 2, y0 + h / 2, HZ + 0.01 - (0.19 - d) / 2, 0.002)
        for gy in (0.12, 0.82): box('gilt', t + 0.002, 0.008, 0.004, x + t / 2, y0 + h * gy, HZ + 0.01 - d / 2 - 0.0005)
        x += t + 0.002; i += 1
    # 平放一摞
    fx = (x1 - 0.105) if ci % 2 == 0 else (x0 + 0.105); fy = y0
    for j in range(3 + ci % 2):
        th = 0.035 + 0.01 * ((j + ci) % 3); m = BK[(j * 3 + ci) % len(BK)]
        box(m, 0.18 - 0.01 * j, th, 0.17 - 0.008 * j, fx, fy + th / 2, HZ + 0.01, 0.002); fy += th
# —— 绿罩银行家台灯（桌面右侧 x +0.45） ——
LX, LZ = 0.45, 0.02
cyl('brass', 0.085, 0.02, LX, TOP + 0.01, LZ, 32); cyl('brassD', 0.07, 0.02, LX, TOP + 0.03, LZ, 32, r2=0.05)
cyl('brass', 0.011, 0.30, LX, TOP + 0.18, LZ, 12)
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.018, location=G(LX, TOP + 0.12, LZ)); bpy.context.object.data.materials.append(M['brassD'])
for sx in (-1, 1): box('brass', 0.008, 0.06, 0.008, LX + sx * 0.10, TOP + 0.33, LZ)  # 灯罩托臂
box('brass', 0.21, 0.008, 0.008, LX, TOP + 0.30, LZ)
# 灯罩：半圆柱绿玻璃罩（沿 X 轴），开口朝下
bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.085, depth=0.30, location=G(LX, TOP + 0.36, LZ - 0.02), rotation=(0, math.pi / 2, 0), end_fill_type='NOTHING')
sh = bpy.context.object; bpy.ops.object.transform_apply(location=False, rotation=True, scale=False); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
c0 = Vector(G(LX, TOP + 0.36, LZ - 0.02))
for v in sh.data.vertices: v.select = (v.co.z + 0.0) < -0.0001
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.delete(type='VERT'); bpy.ops.object.mode_set(mode='OBJECT')
sm = sh.modifiers.new('s', 'SOLIDIFY'); sm.thickness = 0.004; sh.data.materials.append(M['green'])
inner = box('glow', 0.28, 0.004, 0.15, LX, TOP + 0.355, LZ - 0.02)                # 罩内暖光面
for sx in (-1, 1): cyl('brass', 0.087, 0.006, LX + sx * 0.15, TOP + 0.36, LZ - 0.02, 32, axis='x')
cyl('brass', 0.004, 0.10, LX + 0.06, TOP + 0.27, LZ - 0.08, 8); bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=0.009, location=G(LX + 0.06, TOP + 0.215, LZ - 0.08)); bpy.context.object.data.materials.append(M['brass'])
# —— 软垫扶手阅读椅（读者侧，面朝 +Z 书桌） ——
CZ = -0.70
for sx in (-1, 1):
    for sz in (-1, 1):  # 车削腿
        cyl('walnutD', 0.022, 0.40, sx * 0.22, 0.20, CZ + sz * 0.21, 16, r2=0.016)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.026, location=G(sx * 0.22, 0.30, CZ + sz * 0.21)); bpy.context.object.data.materials.append(M['walnutD'])
        cyl('brass', 0.017, 0.02, sx * 0.22, 0.01, CZ + sz * 0.21, 12)           # 铜脚套
box('walnut', 0.52, 0.07, 0.50, 0, 0.40, CZ, 0.01)                                 # 座框
box('leather', 0.50, 0.08, 0.48, 0, 0.47, CZ, 0.03)                                # 坐垫
for i in range(3):
    for j in range(3): bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.009, location=G(-0.15 + i * 0.15, 0.511, CZ - 0.15 + j * 0.15)); bpy.context.object.data.materials.append(M['brassD'])
BZ = CZ - 0.23
box('walnut', 0.52, 0.48, 0.05, 0, 0.66, BZ, 0.01)                                 # 靠背框（背朝 −Z）
box('leather', 0.44, 0.40, 0.05, 0, 0.67, BZ + 0.035, 0.025)                       # 靠背软垫
box('walnutD', 0.56, 0.04, 0.07, 0, 0.92, BZ, 0.012)                               # 顶冠
for sx in (-1, 1):
    box('walnut', 0.05, 0.22, 0.05, sx * 0.25, 0.53, CZ + 0.17, 0.008)            # 扶手前柱
    box('walnut', 0.07, 0.035, 0.46, sx * 0.25, 0.65, CZ, 0.01)                   # 扶手
    box('leatherD', 0.055, 0.02, 0.32, sx * 0.25, 0.675, CZ - 0.02, 0.008)        # 扶手垫
    box('walnut', 0.04, 0.04, 0.42, sx * 0.22, 0.12, CZ, 0.004)                    # 侧拉档
box('walnut', 0.40, 0.035, 0.035, 0, 0.12, CZ)                                      # 中拉档
# —— 合并导出 ——
for o in S.objects:
    for md in list(o.modifiers): bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
bpy.ops.object.select_all(action='SELECT'); bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); bpy.ops.object.join(); S.objects[0].name = 'lib_nook'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
ob = S.objects[0]; print('tris', sum(len(p.vertices) - 2 for p in ob.data.polygons), 'dims', tuple(round(v, 3) for v in ob.dimensions))
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.32, 0.30, 0.28, 1)
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 2.8; sun.rotation_euler = (math.radians(50), 0, math.radians(-30))
bpy.ops.mesh.primitive_plane_add(size=6); bpy.context.object.data.materials.append(mat('floor', (0.15, 0.085, 0.045), 0.5))
S.render.engine = 'CYCLES'; S.cycles.samples = 32; S.cycles.use_denoising = False; S.render.resolution_x = 800; S.render.resolution_y = 640
for i, (cp, tg) in enumerate([(G(1.6, 1.5, -2.6), G(0, 0.9, -0.1)), (G(-1.3, 1.2, -1.2), G(0.1, 0.9, 0.2))]):
    bpy.ops.object.camera_add(location=cp); cam = bpy.context.object; S.camera = cam
    cam.rotation_euler = (Vector(tg) - Vector(cp)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 35
    S.render.filepath = f'{PREV}/lib_nook_{i}.png'; bpy.ops.render.render(write_still=True)
