# 批次41：60–80 年代墨绿漆铁皮报刊架（替换细铁丝格兜旋转报架 r2/44_pocket_rotating_newspaper_stand，那个模型远看成白色点阵线框）。
# 游戏坐标：+Z = 正面（取报一侧），原点 = 底面中心，单位 m。外形 0.72 宽 × 0.46 深 × 1.48 高。
# 构造：方钢管四脚 + 橡胶脚垫；两侧梯形压筋侧板（米白腰线）；背板；正面 4 级斜搁板（每级铁皮挡报唇 + 铜铆钉），每级插 3 份对折报纸（报头红/黑条 + 灰色栏线 + 头版照片块）；顶部红底檐牌。
import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True); S = bpy.context.scene
def mat(name, col, rough=0.5, metal=0.0, emit=None, es=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = es
    return m
M = dict(green=mat('nr_greenPaint', (0.060, 0.030, 0.015), 0.40, 0.35), greenD=mat('nr_greenDark', (0.028, 0.014, 0.007), 0.48, 0.35)  # 批次55：墨绿 → 暗铜褐烤漆（材质名保留以兼容）,
         cream=mat('nr_cream', (0.78, 0.72, 0.58), 0.5), red=mat('nr_red', (0.50, 0.06, 0.04), 0.45),
         steel=mat('nr_steel', (0.30, 0.30, 0.31), 0.45, 0.8), brass=mat('nr_rivet', (0.62, 0.48, 0.25), 0.35, 1.0),
         rubber=mat('nr_rubber', (0.03, 0.03, 0.03), 0.9),
         paperA=mat('nr_paperA', (0.80, 0.77, 0.68), 0.92), paperB=mat('nr_paperB', (0.74, 0.71, 0.62), 0.92), paperC=mat('nr_paperC', (0.84, 0.80, 0.70), 0.92),
         ink=mat('nr_ink', (0.16, 0.15, 0.14), 0.9), inkL=mat('nr_inkLight', (0.42, 0.40, 0.36), 0.9), mastR=mat('nr_mastRed', (0.58, 0.07, 0.05), 0.8),
         photo=mat('nr_photo', (0.25, 0.24, 0.22), 0.85))
def G(x, y, z): return (x, -z, y)
def box(m, sx, sy, sz, x, y, z, rx=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=G(x, y, z)); o = bpy.context.object; o.scale = (sx, sz, sy); o.rotation_euler = (rx, 0, 0)
    o.data.materials.append(M[m]); return o
W, D, H = 0.72, 0.46, 1.48
# 四脚方钢管 + 脚垫 + 底横撑
for sx in (-1, 1):
    for sz in (-1, 1):
        box('greenD', 0.03, 0.22, 0.03, sx * (W / 2 - 0.02), 0.12, sz * (D / 2 - 0.03))
        box('rubber', 0.045, 0.012, 0.045, sx * (W / 2 - 0.02), 0.006, sz * (D / 2 - 0.03))
for sz in (-1, 1): box('greenD', W - 0.04, 0.025, 0.025, 0, 0.06, sz * (D / 2 - 0.03))
# 侧板（梯形：前低后高）用斜切的盒 + 压筋 + 米白腰线
for sx in (-1, 1):
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.data.materials.append(M['green'])
    for v in o.data.vertices:  # 立方体 → 梯形侧板：x 厚 0.012，前缘高 0.95、后缘高 1.30
        gz = v.co.y * -D; gy = 0.22 + (v.co.z + 0.5) * ((0.95 if gz > 0 else 1.30) - 0.22); v.co = Vector(G(sx * (W / 2 - 0.006) + v.co.x * 0.012, gy, gz))
    for k in range(3): box('greenD', 0.006, 0.6 - k * 0.08, 0.018, sx * (W / 2 + 0.002), 0.55, -0.12 + k * 0.12)
    box('cream', 0.008, 0.03, D, sx * (W / 2 + 0.003), 0.30, 0)
    for z in (-D / 2 + 0.03, D / 2 - 0.03):
        for y in (0.30, 0.85): bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=0.007, location=G(sx * (W / 2 + 0.006), y, z * 0.9)); bpy.context.object.data.materials.append(M['brass'])
# 背板 + 顶檐牌
box('green', W, 1.08, 0.012, 0, 0.76, -D / 2 + 0.006)
box('red', W + 0.06, 0.16, 0.03, 0, H - 0.08, -D / 2 + 0.02)
box('cream', W + 0.07, 0.018, 0.035, 0, H - 0.165, -D / 2 + 0.02); box('cream', W + 0.07, 0.018, 0.035, 0, H + 0.005, -D / 2 + 0.02)
for x in (-0.18, -0.06, 0.06, 0.18): box('cream', 0.07, 0.07, 0.006, x, H - 0.08, -D / 2 + 0.037)  # 檐牌四方白字底（游戏侧可再贴字）
box('greenD', 0.025, H - 1.30 + 0.02, 0.025, -W / 2 + 0.02, (H + 1.30) / 2 - 0.08, -D / 2 + 0.02); box('greenD', 0.025, H - 1.30 + 0.02, 0.025, W / 2 - 0.02, (H + 1.30) / 2 - 0.08, -D / 2 + 0.02)
# 正面 4 级斜搁板（自下而上后退），每级：斜板 + 前挡唇 + 3 份报纸
tilt = math.radians(-62); papers = ['paperA', 'paperB', 'paperC']
for t in range(4):
    zf = D / 2 - 0.05 - t * 0.095; yb = 0.28 + t * 0.24
    box('green', W - 0.03, 0.012, 0.16, 0, yb + 0.03, zf - 0.04, rx=math.radians(-12))  # 托板
    box('greenD', W - 0.03, 0.07, 0.01, 0, yb + 0.035, zf + 0.035)  # 挡报唇
    box('cream', W - 0.03, 0.008, 0.012, 0, yb + 0.072, zf + 0.037)
    for x in (-W / 2 + 0.05, W / 2 - 0.05): bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=0.006, location=G(x, yb + 0.035, zf + 0.041)); bpy.context.object.data.materials.append(M['brass'])
    for k in range(3):
        x = -0.225 + k * 0.225 + (0.01 if (t + k) % 2 else -0.01); pm = papers[(t * 2 + k) % 3]; h = 0.30; th = 0.018 + 0.006 * ((t + k) % 3)
        cy, cz = yb + 0.02 + h / 2 * math.sin(-tilt), zf + 0.01 - h / 2 * math.cos(-tilt)
        p = box(pm, 0.205, h, th, x, cy, cz, rx=-(tilt + math.pi / 2))
        # 头版：报头条 + 栏线 + 照片块，贴在报纸正面（法线朝 +Z 上方）
        nrm = Vector((0, math.cos(-tilt), math.sin(-tilt)))  # 游戏系：斜面朝前上
        up = Vector((0, math.sin(-tilt), -math.cos(-tilt)))  # 沿报纸向上（往后上方）
        c0 = Vector((x, cy, cz)) + nrm * (th / 2 + 0.0015)
        def dec(m, w, hh, du, dx=0.0):
            c = c0 + up * du; o = box(m, w, hh, 0.002, c.x + dx, c.y, c.z, rx=-(tilt + math.pi / 2)); return o
        dec('mastR' if (t + k) % 2 == 0 else 'ink', 0.17, 0.035, h / 2 - 0.035)
        dec('photo', 0.08, 0.06, 0.03, -0.042)
        for r in range(5): dec('inkL', 0.07, 0.006, 0.075 - r * 0.018, 0.048)
        for r in range(3): dec('inkL', 0.17, 0.006, -0.03 - r * 0.02)
# 合并导出
for o in S.objects: o.select_set(True)
bpy.context.view_layer.objects.active = S.objects[0]
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); bpy.ops.object.join(); S.objects[0].name = 'news_rack_6080'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
print('tris', sum(len(p.vertices) - 2 for p in S.objects[0].data.polygons))
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.45, 0.45, 0.48, 1)
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 3.0; sun.rotation_euler = (math.radians(50), 0, math.radians(30))
bpy.ops.mesh.primitive_plane_add(size=6); bpy.context.object.data.materials.append(mat('floor', (0.35, 0.34, 0.32), 0.8))
S.render.engine = 'CYCLES'; S.cycles.samples = 32; S.cycles.use_denoising = False; S.render.resolution_x = 700; S.render.resolution_y = 700
for i, (cp, tg) in enumerate([((1.3, -2.2, 1.4), (0, 0, 0.75)), ((-1.0, -1.3, 1.6), (0, 0, 0.8))]):
    bpy.ops.object.camera_add(location=cp); cam = bpy.context.object; S.camera = cam
    cam.rotation_euler = (Vector(tg) - Vector(cp)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 40
    S.render.filepath = f'{PREV}/news_rack_{i}.png'; bpy.ops.render.render(write_still=True)
