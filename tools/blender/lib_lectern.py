# 批次39：藏书阁圆厅正中「讲经台」精建（替换 wood 方盒 1.6×1.1×0.9）。游戏坐标：+Z = 南（入口 / 听众侧，雕饰正面），−Z = 北（诵读者侧，斜面书托朝北低、南高），原点 = 黑石圆台顶面中心，单位 m。
# 胡桃台座（踢脚 + 铜脚线 + 正面三联凸芯板 + 铜玫瑰钉 + 侧芯板 + 四角凹槽壁柱 + 上下铜包角）+ 齿饰檐口 + 斜面书托（14°，铜挡书条 + 四角铜包角）+ 北侧两级诵读台阶（胡桃踏板 + 铜防滑条）。
import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True); S = bpy.context.scene
def mat(name, col, rough=0.5, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m
M = dict(wal=mat('sw_walnutLec', (0.30, 0.17, 0.09), 0.45), walD=mat('sw_walnutDarkLec', (0.15, 0.085, 0.045), 0.5),
         brass=mat('lec_brass', (0.82, 0.62, 0.30), 0.26, 1.0), brassD=mat('lec_brassDim', (0.55, 0.40, 0.20), 0.38, 1.0))
def box(n, m, sx, sy, sz, x=0, y=0, z=0, rx=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y)); o = bpy.context.object; o.name = n; o.scale = (sx, sz, sy); o.rotation_euler = (rx, 0, 0); o.data.materials.append(M[m]); return o
def cyl(n, m, r, d, x, y, z, axis='z'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=r, depth=d, location=(x, -z, y)); o = bpy.context.object; o.name = n
    if axis == 'z': o.rotation_euler = (math.radians(90), 0, 0)
    elif axis == 'x': o.rotation_euler = (0, math.radians(90), 0)
    o.data.materials.append(M[m]); return o
W, D, ZC = 1.30, 0.76, 0.10        # 台座宽 / 深 / 中心 z
H0, H1 = 0.13, 1.23                 # 台座身 y 范围
zf, zb = ZC + D / 2, ZC - D / 2
# 踢脚 + 铜脚线
box('plinth', 'walD', W + 0.16, H0, D + 0.16, y=H0 / 2, z=ZC)
box('plinthBrass', 'brass', W + 0.17, 0.014, D + 0.17, y=H0 + 0.004, z=ZC)
box('plinthMould', 'wal', W + 0.10, 0.04, D + 0.10, y=H0 + 0.03, z=ZC)
box('carcass', 'wal', W, H1 - H0, D, y=(H0 + H1) / 2, z=ZC)
# 正面三联凸芯板（台座身 1.1 m 高）（框 → 凹槽 → 凸起芯板 → 铜玫瑰钉）
for k in range(3):
    cx = -W / 2 + W / 6 + k * W / 3; cy = (H0 + 0.05 + H1 - 0.06) / 2; ph = H1 - H0 - 0.2
    box(f'fRec{k}', 'walD', W / 3 - 0.08, ph, 0.012, x=cx, y=cy, z=zf + 0.004)
    box(f'fRaise{k}', 'wal', W / 3 - 0.16, ph - 0.1, 0.03, x=cx, y=cy, z=zf + 0.012)
    box(f'fField{k}', 'wal', W / 3 - 0.22, ph - 0.18, 0.04, x=cx, y=cy, z=zf + 0.016)
    cyl(f'fRose{k}', 'brass', 0.045, 0.02, cx, cy, zf + 0.045); cyl(f'fRoseIn{k}', 'brassD', 0.022, 0.03, cx, cy, zf + 0.05)
    for dy in (-1, 1): box(f'fBead{k}{dy}', 'brassD', W / 3 - 0.16, 0.008, 0.006, x=cx, y=cy + dy * (ph - 0.1) / 2, z=zf + 0.03)
# 侧芯板 + 背板（诵读侧）
for sx in (-1, 1):
    box(f'sRec{sx}', 'walD', 0.012, H1 - H0 - 0.2, D - 0.2, x=sx * (W / 2 + 0.004), y=(H0 + H1) / 2)
    box(f'sRaise{sx}', 'wal', 0.03, H1 - H0 - 0.3, D - 0.3, x=sx * (W / 2 + 0.012), y=(H0 + H1) / 2, z=ZC)
box('bRec', 'walD', W - 0.2, H1 - H0 - 0.2, 0.012, y=(H0 + H1) / 2, z=zb - 0.004)
# 四角凹槽壁柱 + 上下铜包角
for sx in (-1, 1):
    for sz in (-1, 1):
        px, pz = sx * (W / 2 + 0.01), ZC + sz * (D / 2 + 0.01)
        box(f'pil{sx}{sz}', 'wal', 0.1, H1 - H0, 0.1, x=px, y=(H0 + H1) / 2, z=pz)
        for f in (-0.025, 0, 0.025): box(f'flute{sx}{sz}{f}', 'walD', 0.012, H1 - H0 - 0.16, 0.006, x=px + f, y=(H0 + H1) / 2, z=pz + sz * 0.051)
        box(f'capB{sx}{sz}', 'brass', 0.115, 0.06, 0.115, x=px, y=H0 + 0.03, z=pz)
        box(f'capT{sx}{sz}', 'brass', 0.115, 0.05, 0.115, x=px, y=H1 - 0.025, z=pz)
# 齿饰檐口（正面 + 两侧）
box('cornice', 'wal', W + 0.18, 0.05, D + 0.18, y=H1 + 0.025, z=ZC)
box('corniceBrass', 'brassD', W + 0.19, 0.01, D + 0.19, y=H1 + 0.055, z=ZC)
nd = int((W + 0.1) / 0.07)
for i in range(nd + 1):
    x = -(W + 0.1) / 2 + i * 0.07; box(f'dent{i}', 'walD', 0.035, 0.045, 0.03, x=x, y=H1 - 0.022, z=zf + 0.07)
for sx in (-1, 1):
    for i in range(int((D + 0.1) / 0.07) + 1): box(f'dentS{sx}{i}', 'walD', 0.03, 0.045, 0.035, x=sx * (W / 2 + 0.07), y=H1 - 0.022, z=ZC - (D + 0.1) / 2 + i * 0.07)
# 斜面书托：南高北低 14°（与游戏「本册」rotation.x −0.25 同角），面中心 y 1.375（书底 1.40；诵读平台 0.30 上方 ≈1.1 m 站读高度）
A = -0.25; RW, RD, RT = 1.46, 1.02, 0.05
box('restCore', 'wal', RW - 0.06, 0.20, RD - 0.12, y=1.30, z=ZC, rx=A)  # 斜罩（填檐口到书托）
box('rest', 'wal', RW, RT, RD, y=1.375, z=ZC, rx=A)
box('restInlay', 'walD', RW - 0.16, 0.006, RD - 0.16, y=1.375 + RT / 2 * math.cos(A) + 0.001, z=ZC + RT / 2 * math.sin(A) * -1, rx=A)
ca, sa = math.cos(A), math.sin(A)
def onRest(u, w, h=0.0):  # 书托面上局部坐标（u 沿 z，w 法向上）→ 游戏 (y, z)
    return 1.075 + w * ca + u * (-sa) * -1 * 0 + (u * math.sin(-A) * 0), ZC + u * ca - w * sa
# 书托四边的世界位置：沿斜面方向 (dz, dy) = (cos A, sin(-A)·?) —— 直接用旋转
import mathutils
Rm = mathutils.Matrix.Rotation(A, 3, 'X')
def P(u_z, w_y, x=0.0):  # 局部（x, y=w, z=u）→ 游戏
    v = Rm @ Vector((x, w_y, u_z)); return v.x, 1.375 + v.y, ZC + v.z
# 北缘（低侧）铜挡书条
x_, y_, z_ = P(-RD / 2 - 0.015, RT / 2 + 0.03); box('ledge', 'brass', RW - 0.1, 0.06, 0.03, x=x_, y=y_, z=z_, rx=A)
# 四角铜包角（L 形两片）
for sx in (-1, 1):
    for su in (-1, 1):
        x_, y_, z_ = P(su * (RD / 2 - 0.05), 0.0, sx * (RW / 2 - 0.05))
        box(f'rcA{sx}{su}', 'brass', 0.1, RT + 0.012, 0.012, x=x_, y=y_, z=z_ + su * 0.05 * ca, rx=A)
        box(f'rcB{sx}{su}', 'brass', 0.012, RT + 0.012, 0.1, x=x_ + sx * 0.05, y=y_, z=z_, rx=A)
        x2, y2, z2 = P(su * (RD / 2 - 0.045), RT / 2 + 0.003, sx * (RW / 2 - 0.045)); box(f'rcT{sx}{su}', 'brass', 0.09, 0.006, 0.09, x=x2, y=y2, z=z2, rx=A)
# 书托下两道雕饰托架（正面可见）
for sx in (-1, 1):
    box(f'corbel{sx}', 'walD', 0.08, 0.16, 0.12, x=sx * 0.45, y=H1 - 0.1, z=zf + 0.1)
    cyl(f'corbelR{sx}', 'brassD', 0.02, 0.015, sx * 0.45, H1 - 0.1, zf + 0.165)
# 北侧诵读台阶：平台 0.30 + 下一级 0.15（胡桃踏板 + 踢面深色 + 铜防滑条）
for i, (h, z0, z1) in enumerate([(0.30, zb - 0.62, zb - 0.02), (0.15, zb - 0.98, zb - 0.62)]):
    zc = (z0 + z1) / 2; dd = z1 - z0
    box(f'stepBody{i}', 'walD', 1.5, h - 0.04, dd, y=(h - 0.04) / 2, z=zc)
    box(f'stepTread{i}', 'wal', 1.54, 0.04, dd + 0.03, y=h - 0.02, z=zc - 0.015)
    box(f'stepNose{i}', 'brass', 1.5, 0.012, 0.04, y=h + 0.002, z=z0 - 0.01)
    for sx in (-1, 1): box(f'stepCap{i}{sx}', 'brass', 0.06, 0.05, 0.06, x=sx * 0.75, y=h - 0.02, z=z0 + 0.0)
for o in S.objects: o.select_set(True)
bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); bpy.ops.object.join(); S.objects[0].name = 'lib_lectern'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
print('tris', sum(len(p.vertices) - 2 for p in S.objects[0].data.polygons))
# 预览：加一本书示意
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.5, 0.45, 0.4, 1)
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 3.0; sun.rotation_euler = (math.radians(50), 0, math.radians(30))
bpy.ops.mesh.primitive_plane_add(size=20); bpy.context.object.data.materials.append(M['walD'])
S.render.engine = 'CYCLES'; S.cycles.samples = 32; S.cycles.use_denoising = False; S.render.resolution_x = 800; S.render.resolution_y = 600
for i, (cp, tg) in enumerate([((1.6, -2.6, 1.5), (0, -0.1, 0.65)), ((-1.8, 2.4, 1.7), (0, 0.3, 0.6))]):  # 0 = 南侧（听众）斜看，1 = 北侧（诵读者 + 台阶）斜看
    bpy.ops.object.camera_add(location=cp); cam = bpy.context.object; S.camera = cam
    cam.rotation_euler = (Vector(tg) - Vector(cp)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 32
    S.render.filepath = f'{PREV}/lib_lectern_{i}.png'; bpy.ops.render.render(write_still=True)
