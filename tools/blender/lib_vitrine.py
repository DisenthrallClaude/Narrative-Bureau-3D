# 批次38：藏书阁入口「限阅陈列柜」精建（替换 blackMetal 方盒底座）。正面 +Z，原点 = 底面中心，单位 m。
# 胡桃底柜 1.6×0.8×0.8（踢脚 + 三联凹芯板 + 铜线脚 + 铜锁眼）+ 玻璃罩铜框（四角铜立柱 + 上下铜框，玻璃本身由游戏 glassClear 出）+ 胡桃檐顶（两道线脚）+ 内衬红丝绒台面。总高 1.92。
import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True); S = bpy.context.scene
def mat(name, col, rough=0.5, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m
M = dict(wal=mat('sw_walnutVit', (0.30, 0.17, 0.09), 0.5), walD=mat('sw_walnutDarkVit', (0.16, 0.09, 0.05), 0.5),
         brass=mat('vit_brass', (0.80, 0.60, 0.30), 0.28, 1.0), velvet=mat('vit_velvet', (0.36, 0.05, 0.05), 0.95), iron=mat('vit_keyhole', (0.05, 0.04, 0.03), 0.4, 0.8))
def box(n, m, sx, sy, sz, x=0, y=0, z=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y)); o = bpy.context.object; o.name = n; o.scale = (sx, sz, sy); o.data.materials.append(M[m]); return o
W, D = 1.6, 0.8
# 底柜
box('plinth', 'walD', W + 0.06, 0.1, D + 0.06, y=0.05)
box('plinthTop', 'brass', W + 0.07, 0.012, D + 0.07, y=0.106)
box('carcass', 'wal', W, 0.66, D, y=0.11 + 0.33)
for sz in (1, -1):  # 正背面三联凹芯板（框梃 + 凹入芯板 + 铜内线）
    zf = sz * (D / 2 + 0.006)
    for k in range(3):
        cx = -W / 2 + W / 6 + k * W / 3
        box(f'rail{sz}{k}', 'wal', W / 3 - 0.1, 0.46, 0.012, x=cx, y=0.44, z=zf)
        box(f'panel{sz}{k}', 'walD', W / 3 - 0.18, 0.38, 0.01, x=cx, y=0.44, z=zf + sz * 0.004)
        for dy in (-0.19, 0.19): box(f'pb{sz}{k}{dy}', 'brass', W / 3 - 0.18, 0.008, 0.006, x=cx, y=0.44 + dy, z=zf + sz * 0.008)
        for dx in (-1, 1): box(f'pv{sz}{k}{dx}', 'brass', 0.008, 0.38, 0.006, x=cx + dx * (W / 6 - 0.09), y=0.44, z=zf + sz * 0.008)
for sx in (1, -1):  # 侧面单芯板
    box(f'sideP{sx}', 'walD', 0.01, 0.38, D - 0.2, x=sx * (W / 2 + 0.008), y=0.44)
box('keyPlate', 'brass', 0.07, 0.1, 0.01, y=0.6, z=D / 2 + 0.016); box('keyHole', 'iron', 0.014, 0.03, 0.006, y=0.6, z=D / 2 + 0.022)
box('topMould', 'wal', W + 0.05, 0.03, D + 0.05, y=0.785)
box('topBrass', 'brass', W + 0.055, 0.012, D + 0.055, y=0.806)
box('velvet', 'velvet', W - 0.12, 0.012, D - 0.12, y=0.81)
# 玻璃罩铜框（玻璃 1.5×1.0×0.7 由游戏出，中心 y 1.3）
for sx in (-1, 1):
    for sz in (-1, 1): box(f'post{sx}{sz}', 'brass', 0.035, 1.02, 0.035, x=sx * 0.765, y=1.3, z=sz * 0.365)
for y in (0.815, 1.79):
    for sz in (-1, 1): box(f'frX{y}{sz}', 'brass', 1.56, 0.025, 0.025, y=y, z=sz * 0.365)
    for sx in (-1, 1): box(f'frZ{y}{sx}', 'brass', 0.025, 0.025, 0.76, x=sx * 0.765, y=y)
# 檐顶
box('crown0', 'wal', W + 0.02, 0.05, D + 0.02, y=1.83)
box('crown1', 'walD', W + 0.08, 0.035, D + 0.08, y=1.872)
box('crownB', 'brass', W + 0.085, 0.01, D + 0.085, y=1.894)
box('crown2', 'wal', W - 0.1, 0.025, D - 0.1, y=1.905)
for o in S.objects: o.select_set(True)
bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); bpy.ops.object.join(); S.objects[0].name = 'lib_vitrine'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
print('tris', sum(len(p.vertices) - 2 for p in S.objects[0].data.polygons))
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.5, 0.45, 0.4, 1)
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 3.0; sun.rotation_euler = (math.radians(50), 0, math.radians(30))
bpy.ops.mesh.primitive_plane_add(size=20); bpy.context.object.data.materials.append(M['walD'])
S.render.engine = 'CYCLES'; S.cycles.samples = 32; S.cycles.use_denoising = False; S.render.resolution_x = 800; S.render.resolution_y = 600
bpy.ops.object.camera_add(location=(1.4, -2.6, 1.6)); cam = bpy.context.object; S.camera = cam
cam.rotation_euler = (Vector((0, 0, 0.95)) - Vector((1.4, -2.6, 1.6))).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 35
S.render.filepath = f'{PREV}/lib_vitrine_0.png'; bpy.ops.render.render(write_still=True)
