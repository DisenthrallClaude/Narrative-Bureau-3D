# 批次45：人事档案馆「大档案柜组」精建卡片目录柜（替换 filing_cabinets 方块 GLB）+ 书车（替换 dressing.js 程序方块）。
# 用法：blender -b --python arch_catalog.py -- <out_dir> <prev_dir>。正面 +Z，原点 = 底面中心，单位 m。
# 目录柜 6.48×0.86×2.22：6 联（每联 1.08）；下段 7 行×5 列卡片抽屉（铜标签框 + 米白卡签 + 铜拉环 + 铜座）；1.0 m 胡桃工作台面铜包边；
# 上段退进 0.5 m 深，4 行×2 列大档案抽屉（铜标签框 + 铜吊环拉手）；联间胡桃壁柱、底座踢脚 + 铜线、檐口两道线脚 + 铜线。
# 书车 1.2×0.56×1.05：三层胡桃搁板（顶面 0.27 / 0.67 / 1.02，与 dressing.js 档案盒 / folderStack 高度一致）+ 前沿铜挡条 + 两端胡桃立板（凹芯）+ 铜推把 + 4 只铜叉橡胶脚轮。
import bpy, sys, math, os
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
def mat(name, col, rough=0.5, metal=0.0):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m
def mats():
    return dict(wal=mat('ac_walnut', (0.34, 0.20, 0.11), 0.5), walD=mat('ac_walnutDark', (0.22, 0.13, 0.07), 0.55),
                brass=mat('ac_brass', (0.80, 0.60, 0.30), 0.3, 1.0), card=mat('ac_card', (0.78, 0.71, 0.55), 0.85),
                rubber=mat('ac_rubber', (0.03, 0.03, 0.03), 0.8))
M = {}; MI = {}; BM = [None]
import bmesh
from mathutils import Matrix
def _bm():
    if BM[0] is None: BM[0] = bmesh.new()
    return BM[0]
def _mi(m):
    if m not in MI: MI[m] = len(MI)
    return MI[m]
def _tag(bm, faces, m):
    i = _mi(m)
    for f in faces: f.material_index = i
def box(n, m, sx, sy, sz, x=0, y=0, z=0):
    bm = _bm(); r = bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((x, -z, y)) @ Matrix.Diagonal((sx, sz, sy, 1)))
    _tag(bm, {f for v in r['verts'] for f in v.link_faces}, m)
def ring(n, r, t, x, y, z, seg=10):
    bm = _bm(); ms = 4; vs = []
    for i in range(seg):
        a = 2 * math.pi * i / seg; row = []
        for j in range(ms):
            b = 2 * math.pi * j / ms; rr = r + t * math.cos(b)
            row.append(bm.verts.new((x + rr * math.cos(a), -z + t * math.sin(b), y + rr * math.sin(a))))
        vs.append(row)
    fs = [bm.faces.new((vs[i][j], vs[(i + 1) % seg][j], vs[(i + 1) % seg][(j + 1) % ms], vs[i][(j + 1) % ms])) for i in range(seg) for j in range(ms)]
    _tag(bm, fs, 'brass')
def cyl(n, m, r, h, x, y, z, rot=(0, 0, 0), v=12):
    bm = _bm(); R = Matrix.Translation((x, -z, y)) @ __import__('mathutils').Euler(rot).to_matrix().to_4x4()
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=v, radius1=r, radius2=r, depth=h, matrix=R)
    _tag(bm, {f for vv in res['verts'] for f in vv.link_faces}, m)
def finish(name):
    me = bpy.data.meshes.new(name); bm = BM[0]; bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free(); BM[0] = None
    for m, i in sorted(MI.items(), key=lambda kv: kv[1]): me.materials.append(M[m])
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    for o in bpy.context.scene.objects: o.select_set(o == ob)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(filepath=f'{OUT}/{name}.glb', export_format='GLB', use_selection=True)
    print(name, 'tris', sum(len(p.vertices) - 2 for p in me.polygons)); MI.clear(); return ob
def preview(name, views):
    S = bpy.context.scene
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.5, 0.45, 1)
    bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 3.2; sun.rotation_euler = (math.radians(50), 0, math.radians(25))
    bpy.ops.mesh.primitive_plane_add(size=30); bpy.context.object.data.materials.append(M['walD'])
    S.render.engine = 'CYCLES'; S.cycles.samples = 32; S.cycles.use_denoising = False; S.render.resolution_x = 900; S.render.resolution_y = 600
    for i, (loc, look, lens) in enumerate(views):
        bpy.ops.object.camera_add(location=loc); cam = bpy.context.object; S.camera = cam
        cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lens
        S.render.filepath = f'{PREV}/{name}_{i}.png'; bpy.ops.render.render(write_still=True)

# ===================== 卡片目录柜 =====================
bpy.ops.wm.read_factory_settings(use_empty=True); M.update(mats())
U, N, D, Du = 1.08, 6, 0.86, 0.50
W = U * N; zf = D / 2; zu = -D / 2 + Du  # 下段前脸 z、上段前脸 z
box('plinth', 'walD', W + 0.04, 0.12, D + 0.02, y=0.06, z=0.01)
box('plinthBrass', 'brass', W + 0.045, 0.012, D + 0.03, y=0.125, z=0.01)
box('lowerCarcass', 'wal', W, 0.88, D - 0.02, y=0.13 + 0.44, z=-0.01)
box('top', 'wal', W + 0.06, 0.04, D + 0.06, y=1.03, z=0.01)
box('topNose', 'brass', W + 0.065, 0.012, 0.012, y=1.03, z=zf + 0.04)
box('upperCarcass', 'wal', W, 0.96, Du - 0.02, y=1.05 + 0.48, z=-D / 2 + Du / 2 - 0.01)
box('cornice0', 'wal', W + 0.04, 0.06, Du + 0.04, y=2.04, z=-D / 2 + Du / 2)
box('cornice1', 'walD', W + 0.12, 0.05, Du + 0.1, y=2.095, z=-D / 2 + Du / 2 + 0.02)
box('corniceBrass', 'brass', W + 0.125, 0.012, Du + 0.105, y=2.124, z=-D / 2 + Du / 2 + 0.02)
box('cornice2', 'wal', W + 0.02, 0.07, Du, y=2.165, z=-D / 2 + Du / 2)
rows, cols = 7, 5
dw, dh = (U - 0.06) / cols, 0.86 / rows
for u in range(N):
    ux = -W / 2 + U / 2 + u * U
    for k in range(rows):
        for c in range(cols):
            x = ux - (U - 0.06) / 2 + dw / 2 + c * dw; y = 0.14 + dh / 2 + k * dh
            box(f'd{u}_{k}_{c}', 'wal', dw - 0.012, dh - 0.012, 0.02, x=x, y=y, z=zf + 0.01)
            box(f'lf{u}_{k}_{c}', 'brass', 0.07, 0.034, 0.006, x=x, y=y + 0.025, z=zf + 0.022)
            box(f'lc{u}_{k}_{c}', 'card', 0.058, 0.024, 0.004, x=x, y=y + 0.025, z=zf + 0.026)
            box(f'rb{u}_{k}_{c}', 'brass', 0.03, 0.012, 0.012, x=x, y=y - 0.01, z=zf + 0.026)
            ring(f'rr{u}_{k}_{c}', 0.013, 0.0028, x, y - 0.026, zf + 0.03)
    for k in range(4):
        for c in range(2):
            x = ux + (c - 0.5) * (U - 0.06) / 2; y = 1.10 + 0.115 + k * 0.23
            box(f'D{u}_{k}_{c}', 'wal', (U - 0.06) / 2 - 0.016, 0.214, 0.022, x=x, y=y, z=zu + 0.011)
            box(f'Di{u}_{k}_{c}', 'walD', (U - 0.06) / 2 - 0.09, 0.15, 0.006, x=x, y=y, z=zu + 0.024)
            box(f'Lf{u}_{k}_{c}', 'brass', 0.12, 0.05, 0.006, x=x, y=y + 0.045, z=zu + 0.029)
            box(f'Lc{u}_{k}_{c}', 'card', 0.104, 0.036, 0.004, x=x, y=y + 0.045, z=zu + 0.033)
            box(f'Rb{u}_{k}_{c}', 'brass', 0.05, 0.016, 0.014, x=x, y=y - 0.02, z=zu + 0.032)
            ring(f'Rr{u}_{k}_{c}', 0.02, 0.0035, x, y - 0.045, zu + 0.038, 12)
for u in range(N + 1):  # 联间壁柱（下段 + 上段）
    x = -W / 2 + u * U
    box(f'pilL{u}', 'walD', 0.05, 0.88, 0.03, x=x, y=0.57, z=zf + 0.015)
    box(f'pilU{u}', 'walD', 0.05, 0.94, 0.03, x=x, y=1.55, z=zu + 0.015)
    box(f'capU{u}', 'brass', 0.056, 0.012, 0.034, x=x, y=2.02, z=zu + 0.016)
for u in range(N):  # 每联上段顶部铜号牌
    box(f'np{u}', 'brass', 0.16, 0.05, 0.006, x=-W / 2 + U / 2 + u * U, y=2.0, z=zu + 0.01)
finish('arch_catalog')
os.makedirs(PREV, exist_ok=True)
preview('arch_catalog', [((2.6, -4.6, 1.7), (0.4, 0, 1.1), 32), ((0.9, -1.25, 1.25), (0.25, 0, 0.75), 35)])

# ===================== 书车 =====================
bpy.ops.wm.read_factory_settings(use_empty=True); M.clear(); M.update(mats())
L, Dc = 1.2, 0.56
for i, yt in enumerate((0.27, 0.67, 1.02)):
    box(f'sh{i}', 'wal', L - 0.06, 0.03, Dc - 0.02, y=yt - 0.015)
    for sz in (-1, 1): box(f'lip{i}{sz}', 'brass', L - 0.06, 0.035, 0.008, x=0, y=yt + 0.012, z=sz * (Dc / 2 - 0.004))
for sx in (-1, 1):
    xe = sx * (L / 2 - 0.015)
    box(f'end{sx}', 'wal', 0.03, 0.98, Dc, x=xe, y=0.6)
    box(f'endP{sx}', 'walD', 0.006, 0.7, Dc - 0.14, x=xe + sx * 0.017, y=0.6)
    box(f'endB{sx}', 'brass', 0.008, 0.012, Dc - 0.12, x=xe + sx * 0.02, y=0.96)
    box(f'endT{sx}', 'walD', 0.05, 0.03, Dc + 0.02, x=xe, y=1.105)
for sz in (-1, 1): cyl(f'hp{sz}', 'brass', 0.012, 0.12, L / 2 + 0.06, 0.95, sz * 0.2, rot=(0, math.radians(90), 0))
cyl('handle', 'brass', 0.014, 0.46, L / 2 + 0.12, 0.95, 0, rot=(math.radians(90), 0, 0))
for sx in (-1, 1):
    for sz in (-1, 1):
        x, z = sx * 0.5, sz * 0.2
        box(f'fork{sx}{sz}', 'brass', 0.05, 0.06, 0.04, x=x, y=0.115, z=z)
        cyl(f'wh{sx}{sz}', 'rubber', 0.05, 0.03, x, 0.05, z, rot=(math.radians(90), 0, 0), v=16)
box('apron', 'walD', L - 0.06, 0.06, 0.02, y=0.12, z=Dc / 2 - 0.02)
finish('arch_bookcart')
preview('arch_bookcart', [((1.6, -1.8, 1.4), (0, 0, 0.55), 35)])
