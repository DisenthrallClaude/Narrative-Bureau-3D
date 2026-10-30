# 批次30：安检大厅主要物件 Blender 精建（替换 r3plan / interiors.js 里的廉价方块）
#   sec_counter  证件查验柜台：胡桃木框芯板 + 黑石台面 + 铜包边 + 玻璃挡板 + 编号牌框。占地 2.0 × 0.8，台面 1.09，挡板顶 1.78；正面（公众侧）+Z
#   scan_gate    文本扫描门：黑漆立柱 + 铜框线 + 铜踢脚 + 内侧感应格栅 + 指示灯列 + 顶梁铭牌。外包 1.46 × 2.6 × 0.6，净宽 1.02，净高 2.3；正面 +Z
#   wait_bench   候检长椅：实木条座 / 背 + 三副铸铁扶手腿。4.2 × 0.72 × 0.84；坐面朝 +Z
# 贴图 tools/blender/tex/*.jpg 由 ambientCG（CC0）Wood051 / Marble006 / Metal048A / Metal027 / Metal046A 调色缩到 512 而来
# 用法：blender.sh -b -P hall_props.py -- <out_dir> <preview_dir> [只出某个名字]
import bpy, sys, math, os
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PREV = argv[0], argv[1]; ONLY = argv[2] if len(argv) > 2 else None
TEX = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
def img(n):
    p = os.path.join(TEX, n); i = bpy.data.images.get(n) or bpy.data.images.load(p); return i
def mat(name, col=None, tex=None, nrm=None, rough=0.6, metal=0.0, emit=None, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    if tex:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(tex); nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    else: b.inputs['Base Color'].default_value = (*col, 1)
    if nrm:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(nrm); t.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 0.7
        nt.links.new(t.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = 3.0
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
        try: m.surface_render_method = 'BLENDED'
        except Exception: pass
        m.blend_method = 'BLEND'
    return m
def mats():
    return dict(
        walnut=mat('hp_walnut', tex='walnut.jpg', nrm='walnut_n.jpg', rough=0.42),
        walnutD=mat('hp_walnutPanel', tex='walnut.jpg', nrm='walnut_n.jpg', rough=0.5),
        stone=mat('hp_blackStone', tex='blackstone.jpg', nrm='blackstone_n.jpg', rough=0.18),
        brass=mat('hp_brass', tex='brass.jpg', rough=0.32, metal=1.0),
        iron=mat('hp_castIron', tex='castiron.jpg', nrm='castiron_n.jpg', rough=0.55, metal=0.85),
        lacquer=mat('hp_blackLacquer', tex='lacquer.jpg', rough=0.22, metal=0.3),
        grille=mat('hp_grille', (0.05, 0.05, 0.05), rough=0.6, metal=0.6),
        glass=mat('hp_glass', (0.75, 0.82, 0.8), rough=0.04, alpha=0.22),
        green=mat('hp_ledGreen', (0.1, 0.6, 0.25), rough=0.3, emit=(0.25, 1.0, 0.5)),
        amber=mat('hp_ledAmber', (0.6, 0.4, 0.1), rough=0.3, emit=(1.0, 0.65, 0.25)),
        enamel=mat('hp_enamelPlate', (0.05, 0.07, 0.12), rough=0.3),
        baize=mat('hp_baize', (0.025, 0.075, 0.045), rough=0.92),
    )
M = None
def box(name, m, sx, sy, sz, x=0, y=0, z=0, bev=0.004, ry=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y))
    o = bpy.context.object; o.name = name; o.scale = (sx, sz, sy); o.rotation_euler[2] = ry
    o.data.materials.append(M[m]); bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    uv_cube(o, 1.0)
    if bev > 0:
        b = o.modifiers.new('bv', 'BEVEL'); b.width = min(bev, 0.45 * min(sx, sy, sz)); b.segments = 2; b.limit_method = 'ANGLE'
    return o
def cyl(name, m, r, h, x=0, y=0, z=0, axis='y', verts=20, r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=(x, -z, y))
    else: bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=(x, -z, y))
    o = bpy.context.object; o.name = name
    if axis == 'x': o.rotation_euler[1] = math.pi / 2
    if axis == 'z': o.rotation_euler[0] = math.pi / 2
    o.data.materials.append(M[m]); bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); uv_cube(o, 1.0); return o
def uv_cube(o, s):
    bpy.context.view_layer.objects.active = o
    for x in bpy.context.selected_objects: x.select_set(False)
    o.select_set(True); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.cube_project(cube_size=s, correct_aspect=True, clip_to_bounds=False, scale_to_bounds=False); bpy.ops.object.mode_set(mode='OBJECT')
def finish(name, views):
    S = bpy.context.scene
    for o in S.objects: o.select_set(o.type == 'MESH')
    meshes = [o for o in S.objects if o.type == 'MESH']; bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.convert(target='MESH'); bpy.ops.object.join(); ob = bpy.context.view_layer.objects.active; ob.name = name
    bpy.ops.export_scene.gltf(filepath=f'{OUT}/{name}.glb', export_format='GLB', export_apply=True, export_image_format='JPEG')
    print('TRIS', name, sum(len(p.vertices) - 2 for p in ob.data.polygons))
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.32, 0.29, 0.26, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.9
    bpy.ops.object.light_add(type='AREA', location=(2.5, -4, 4)); L = bpy.context.object; L.data.energy = 900; L.data.size = 3; L.data.color = (1, 0.88, 0.72)
    L.rotation_euler = (Vector((0, 0, 0.8)) - L.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=30); pl = bpy.context.object; pl.data.materials.append(M['stone'])
    S.render.engine = 'CYCLES'; S.cycles.samples = 40; S.cycles.use_denoising = False; S.render.resolution_x = 900; S.render.resolution_y = 650
    for i, (pos, tgt) in enumerate(views):
        bpy.ops.object.camera_add(location=(pos[0], -pos[2], pos[1])); cam = bpy.context.object; S.camera = cam
        t = Vector((tgt[0], -tgt[2], tgt[1])); cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 35
        S.render.filepath = f'{PREV}/{name}_{i}.png'; bpy.ops.render.render(write_still=True)

# ---------------- 证件查验柜台 ----------------
def counter():
    W, D, HT = 2.0, 0.8, 1.09
    box('plinth', 'stone', W - 0.06, 0.1, D - 0.1, y=0.05, z=-0.02)
    box('toe', 'brass', W - 0.05, 0.03, 0.012, y=0.085, z=D / 2 - 0.065, bev=0.002)
    # 胡桃木柜身外框：前面 4 立梃 + 上下冒头，三块凸起芯板（芯板凹进 1.5 cm，四周起线）
    zf = D / 2 - 0.06; yb, yt = 0.1, HT - 0.06
    for i, x in enumerate([-0.93, -0.31, 0.31, 0.93]): box(f'stile{i}', 'walnut', 0.1 if abs(x) > 0.9 else 0.08, yt - yb, 0.05, x=x, y=(yb + yt) / 2, z=zf)
    box('railB', 'walnut', W - 0.04, 0.1, 0.04, y=yb + 0.05, z=zf - 0.006, bev=0.002); box('railT', 'walnut', W - 0.04, 0.12, 0.04, y=yt - 0.06, z=zf - 0.006, bev=0.002)
    box('railM', 'walnut', W - 0.04, 0.06, 0.04, y=0.66, z=zf - 0.006, bev=0.002)
    for i, x in enumerate([-0.62, 0, 0.62]):
        for (y0, y1, k) in [(yb + 0.1, 0.63, 'L'), (0.69, yt - 0.12, 'U')]:
            h = y1 - y0; box(f'panel{i}{k}', 'walnutD', 0.5, h, 0.03, x=x, y=(y0 + y1) / 2, z=zf - 0.012)
            box(f'raise{i}{k}', 'walnutD', 0.42, h - 0.08, 0.02, x=x, y=(y0 + y1) / 2, z=zf + 0.008, bev=0.008)
    # 编号牌框（中间上芯板：铜框 + 深色珐琅底；文字由 r3plan sign 贴上）
    box('plateFrame', 'brass', 0.38, 0.16, 0.012, y=0.85, z=zf + 0.028, bev=0.003)
    # 侧板（框芯板）+ 背面（职员侧：中间容膝 + 两侧抽屉柜）
    for sx in (-1, 1):
        box(f'side{sx}', 'walnut', 0.05, yt - yb, D - 0.12, x=sx * (W / 2 - 0.045), y=(yb + yt) / 2, z=-0.03)
        box(f'sideP{sx}', 'walnutD', 0.02, yt - yb - 0.24, D - 0.32, x=sx * (W / 2 - 0.01), y=(yb + yt) / 2, z=-0.03, bev=0.008)
        box(f'ped{sx}', 'walnut', 0.5, yt - yb, 0.05, x=sx * 0.7, y=(yb + yt) / 2, z=-D / 2 + 0.08)
        for k in range(3):
            yy = yb + 0.16 + k * 0.27; box(f'drw{sx}{k}', 'walnutD', 0.44, 0.22, 0.02, x=sx * 0.7, y=yy, z=-D / 2 + 0.05, bev=0.006)
            box(f'pull{sx}{k}', 'brass', 0.1, 0.015, 0.02, x=sx * 0.7, y=yy + 0.05, z=-D / 2 + 0.035, bev=0.002)
    box('kneeBack', 'walnutD', 0.88, yt - yb - 0.3, 0.03, y=(yb + yt) / 2 + 0.15, z=0.12)
    box('apron', 'walnut', 0.9, 0.1, 0.05, y=yt - 0.05, z=-D / 2 + 0.08)
    # 黑石台面 + 铜包边（前缘、两侧）
    box('top', 'stone', W, 0.04, D, y=HT - 0.02, bev=0.003)
    box('edgeF', 'brass', W + 0.012, 0.045, 0.008, y=HT - 0.022, z=D / 2 + 0.004, bev=0.002)
    for sx in (-1, 1): box(f'edgeS{sx}', 'brass', 0.008, 0.045, D, x=sx * (W / 2 + 0.004), y=HT - 0.022, bev=0.002)
    # 玻璃挡板：铜立柱（带圆头）+ 上横梁 + 底座铜槽；下缘留 6 cm 递件缝
    zg = 0.18; gy0, gy1 = HT + 0.06, 1.76
    for sx in (-1, 1):
        cyl(f'post{sx}', 'brass', 0.018, gy1 - HT + 0.02, x=sx * 0.81, y=(HT + gy1) / 2, z=zg)
        cyl(f'postB{sx}', 'brass', 0.035, 0.02, x=sx * 0.81, y=HT + 0.01, z=zg)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.026, location=(sx * 0.81, -zg, gy1 + 0.03)); o = bpy.context.object; o.data.materials.append(M['brass'])
    box('glass', 'glass', 1.58, gy1 - gy0, 0.01, y=(gy0 + gy1) / 2, z=zg, bev=0)
    box('glassTop', 'brass', 1.64, 0.025, 0.025, y=gy1, z=zg, bev=0.003)
    box('slotTray', 'stone', 0.5, 0.02, 0.2, y=HT + 0.01, z=zg + 0.02, bev=0.004)
    box('slotLip', 'brass', 0.5, 0.025, 0.006, y=HT + 0.015, z=zg + 0.12, bev=0.001)
    # 挡板上沿的小编号牌（铜框 + 深底），两面可读
    box('topPlate', 'enamel', 0.24, 0.1, 0.012, y=gy1 + 0.07, z=zg, bev=0.002)
    box('topPlateF', 'brass', 0.26, 0.12, 0.008, y=gy1 + 0.07, z=zg - 0.004, bev=0.002)
    finish('sec_counter_6080', [((1.6, 1.5, 2.2), (0, 0.8, 0)), ((-1.4, 1.7, -1.8), (0, 0.8, 0))])

# ---------------- 文本扫描门 ----------------
def gate():
    PW, PD, H = 0.22, 0.55, 2.3
    for sx in (-1, 1):
        x = sx * 0.62
        box(f'pier{sx}', 'lacquer', PW, H - 0.12, PD, x=x, y=0.12 + (H - 0.12) / 2, bev=0.012)
        box(f'base{sx}', 'brass', PW + 0.04, 0.12, PD + 0.04, x=x, y=0.06, bev=0.006)
        box(f'plinthStone{sx}', 'stone', PW + 0.08, 0.02, PD + 0.08, x=x, y=0.01, bev=0.003)
        for ez in (-1, 1):  # 立柱四角铜线条
            for ex in (-1, 1): box(f'bead{sx}{ez}{ex}', 'brass', 0.014, H - 0.14, 0.014, x=x + ex * (PW / 2 + 0.002), y=0.12 + (H - 0.12) / 2, z=ez * (PD / 2 + 0.002), bev=0.002)
        # 外侧铜框嵌板
        xo = x + sx * (PW / 2 + 0.004)
        box(f'outPanel{sx}', 'brass', 0.008, 1.5, PD - 0.14, x=xo, y=1.05, bev=0.002)
        box(f'outInset{sx}', 'lacquer', 0.01, 1.42, PD - 0.22, x=xo + sx * 0.002, y=1.05, bev=0.002)
        # 内侧感应格栅（深色横百叶）+ 铜框
        xi = x - sx * (PW / 2 + 0.003)
        box(f'grilleF{sx}', 'brass', 0.008, 1.62, 0.3, x=xi, y=1.1, bev=0.002)
        for k in range(26): box(f'gr{sx}{k}', 'grille', 0.012, 0.03, 0.26, x=xi - sx * 0.002, y=0.33 + k * 0.06, bev=0)
        # 指示灯列（正面立柱上段：绿 / 琥珀）
        for k in range(5): box(f'led{sx}{k}', 'green' if k < 4 else 'amber', 0.08, 0.03, 0.01, x=x, y=1.55 + k * 0.08, z=PD / 2 + 0.006, bev=0)
        box(f'ledFrame{sx}', 'brass', 0.12, 0.44, 0.006, x=x, y=1.71, z=PD / 2 + 0.002, bev=0.002)
        box(f'ledBack{sx}', 'grille', 0.1, 0.42, 0.006, x=x, y=1.71, z=PD / 2 + 0.004, bev=0)
    # 顶梁：黑漆 + 上下铜线脚 + 正 / 背面铭牌框（中间留给车道号与指示灯）
    box('header', 'lacquer', 1.46, 0.3, 0.6, y=2.45, bev=0.01)
    box('hdrCapT', 'brass', 1.5, 0.03, 0.64, y=2.615, bev=0.004)
    box('hdrCapB', 'brass', 1.5, 0.03, 0.64, y=2.29, bev=0.004)
    for ez in (-1, 1):
        box(f'name{ez}', 'brass', 0.9, 0.18, 0.008, y=2.45, z=ez * 0.304, bev=0.002)
        box(f'nameIn{ez}', 'enamel', 0.84, 0.13, 0.008, y=2.45, z=ez * 0.307, bev=0)
    box('soffit', 'grille', 1.0, 0.01, 0.4, y=2.297, bev=0)
    finish('scan_gate_6080', [((1.5, 1.6, 2.6), (0, 1.3, 0)), ((-0.4, 1.4, 1.6), (0.5, 1.2, 0))])

# ---------------- 候检长椅 ----------------
def bench():
    L = 4.2
    for i, x in enumerate([-2.02, 0, 2.02]):
        arm = abs(x) > 0.1
        # 铸铁侧架：前腿、后腿（后倾）、座梁、扶手、靠背立
        box(f'legF{i}', 'iron', 0.06, 0.44, 0.06, x=x, y=0.22, z=0.24, bev=0.01)
        box(f'legB{i}', 'iron', 0.06, 0.82, 0.06, x=x, y=0.41, z=-0.27, bev=0.01, ry=0)
        box(f'seatRail{i}', 'iron', 0.06, 0.06, 0.6, x=x, y=0.41, z=-0.01, bev=0.01)
        box(f'stretcher{i}', 'iron', 0.04, 0.04, 0.5, x=x, y=0.1, z=-0.01, bev=0.008)
        box(f'foot{i}', 'iron', 0.1, 0.03, 0.66, x=x, y=0.015, z=-0.01, bev=0.008)
        if arm:
            box(f'arm{i}', 'iron', 0.07, 0.05, 0.58, x=x, y=0.66, z=0.0, bev=0.012)
            cyl(f'armScroll{i}', 'iron', 0.045, 0.07, x=x, y=0.64, z=0.29, axis='x')
            box(f'armPost{i}', 'iron', 0.05, 0.24, 0.05, x=x, y=0.53, z=0.22, bev=0.01)
            box(f'armWood{i}', 'walnut', 0.09, 0.025, 0.5, x=x, y=0.7, z=0.0, bev=0.006)
    # 座面实木条（6 条，条间 1.2 cm 缝）+ 靠背木条（4 条，后倾 12°）
    for k in range(6): box(f'slat{k}', 'walnut', L - 0.02, 0.03, 0.075, y=0.455, z=0.24 - k * 0.088, bev=0.006)
    tilt = math.radians(12)
    for k in range(4):
        h = 0.52 + k * 0.1; zz = -0.29 - (h - 0.45) * math.tan(tilt)
        o = box(f'back{k}', 'walnut', L - 0.02, 0.075, 0.03, y=h, z=zz, bev=0.006); o.rotation_euler[0] = tilt
    # 背后两根铁横撑
    for yy in (0.5, 0.82): box(f'backRail{yy}', 'iron', L - 0.1, 0.03, 0.025, y=yy, z=-0.33 - (yy - 0.45) * math.tan(tilt), bev=0.006)
    finish('wait_bench_6080', [((2.4, 1.3, 2.8), (0, 0.45, 0)), ((-1.6, 1.5, -2.2), (0, 0.45, 0))])

# ---------------- 档案馆 叙事事件陈列柜（批次31）----------------
#   vitrine  4.0 × 0.62，柜面 0.845（展品纸/地图仍由 r3plan 放在 0.851），玻璃罩 0.22 高；前后两面都是公众面（独立陈列）
def vitrine():
    L, D = 4.0, 0.6
    box('plinth', 'walnut', L - 0.06, 0.08, D - 0.06, y=0.04)
    box('carcass', 'walnut', L, 0.72, D, y=0.08 + 0.36)
    for sz in (-1, 1):
        zf = sz * (D / 2 + 0.006)
        box(f'toe{sz}', 'brass', L - 0.04, 0.025, 0.012, y=0.095, z=sz * (D / 2 - 0.02), bev=0.002)
        n = 5; bw = L / n
        for i in range(n + 1):  # 立梃
            box(f'stile{sz}{i}', 'walnut', 0.06, 0.66, 0.012, x=-L / 2 + i * bw + (0.03 if i == 0 else -0.03 if i == n else 0), y=0.47, z=zf)
        for yy in (0.15, 0.79):  # 上下冒头（退 6 mm，避免与立梃共面）
            box(f'rail{sz}{yy}', 'walnut', L - 0.02, 0.05, 0.012, y=yy, z=zf - sz * 0.006)
        for i in range(n):  # 凸起芯板 + 铜标签框
            cx = -L / 2 + (i + 0.5) * bw
            box(f'panel{sz}{i}', 'walnutD', bw - 0.13, 0.52, 0.016, x=cx, y=0.47, z=zf + sz * 0.004, bev=0.012)
            box(f'label{sz}{i}', 'brass', 0.16, 0.05, 0.008, x=cx, y=0.66, z=zf + sz * 0.016, bev=0.002)
            box(f'labelIn{sz}{i}', 'enamel', 0.14, 0.035, 0.004, x=cx, y=0.66, z=zf + sz * 0.020, bev=0.001)
    box('top', 'walnut', L + 0.04, 0.03, D + 0.04, y=0.83, bev=0.008)
    for sz in (-1, 1): box(f'topEdge{sz}', 'brass', L + 0.05, 0.012, 0.01, y=0.836, z=sz * (D / 2 + 0.024), bev=0.002)
    # 玻璃罩：铜框（四角立柱 + 上下框）+ 玻璃
    gh = 0.22; gy = 0.845
    box('glass', 'glass', L - 0.03, gh - 0.01, D - 0.03, y=gy + gh / 2, bev=0)
    for kx in (-1, 1):
        for kz in (-1, 1): box(f'post{kx}{kz}', 'brass', 0.02, gh, 0.02, x=kx * (L / 2 - 0.01), y=gy + gh / 2, z=kz * (D / 2 - 0.01), bev=0.003)
    for kz in (-1, 1):
        for yy in (gy + 0.008, gy + gh - 0.006): box(f'fr{kz}{yy}', 'brass', L, 0.014, 0.018, y=yy, z=kz * (D / 2 - 0.01), bev=0.002)
    for kx in (-1, 1):
        for yy in (gy + 0.008, gy + gh - 0.006): box(f'fe{kx}{yy}', 'brass', 0.018, 0.014, D, x=kx * (L / 2 - 0.01), y=yy, bev=0.002)
    box('lock', 'brass', 0.05, 0.03, 0.01, y=0.77, z=D / 2 + 0.02, bev=0.003)
    finish('vitrine_6080', [((2.6, 1.6, 2.6), (0, 0.6, 0)), ((0.4, 1.2, 1.4), (0.4, 0.6, 0))])

# ---------------- 档案馆 阅览长桌（批次32）----------------
#   reading_table  5.6 × 1.5，桌面顶 0.82（中间绿呢 5.2 × 1.2 内嵌 + 铜压条），车削桌腿 ×6 + 牙板线脚 + 落地横枨
def reading_table():
    L, D, T = 5.6, 1.5, 0.82
    box('top', 'walnut', L, 0.05, D, y=T - 0.025, bev=0.012)
    box('topEdge', 'walnut', L + 0.03, 0.025, D + 0.03, y=T - 0.06, bev=0.008)
    box('baize', 'baize', 5.2, 0.004, 1.2, y=T + 0.001, bev=0)
    for sz in (-1, 1): box(f'brassZ{sz}', 'brass', 5.22, 0.006, 0.02, y=T + 0.003, z=sz * 0.61, bev=0.001)
    for sx in (-1, 1): box(f'brassX{sx}', 'brass', 0.02, 0.006, 1.24, x=sx * 2.61, y=T + 0.003, bev=0.001)
    # 牙板（四周）+ 下沿线脚
    for sz in (-1, 1):
        box(f'apron{sz}', 'walnutD', L - 0.24, 0.12, 0.03, y=T - 0.135, z=sz * (D / 2 - 0.1))
        box(f'apronBead{sz}', 'walnut', L - 0.22, 0.018, 0.04, y=T - 0.2, z=sz * (D / 2 - 0.1), bev=0.006)
    for sx in (-1, 1):
        box(f'apronE{sx}', 'walnutD', 0.03, 0.12, D - 0.24, x=sx * (L / 2 - 0.12), y=T - 0.135)
    # 车削桌腿：方颈 + 圆柱身 + 鼓形 + 锥脚 + 铜脚套
    for lx in (-(L / 2 - 0.12), 0, L / 2 - 0.12):
        for sz in (-1, 1):
            z = sz * (D / 2 - 0.1)
            box(f'legBlock{lx}{sz}', 'walnut', 0.09, 0.16, 0.09, x=lx, y=T - 0.135, z=z, bev=0.006)
            cyl(f'legA{lx}{sz}', 'walnut', 0.04, 0.2, x=lx, y=T - 0.31, z=z, r2=0.034)
            cyl(f'legB{lx}{sz}', 'walnut', 0.05, 0.08, x=lx, y=T - 0.45, z=z)
            cyl(f'legC{lx}{sz}', 'walnut', 0.038, 0.3, x=lx, y=T - 0.64, z=z, r2=0.026)
            cyl(f'shoe{lx}{sz}', 'brass', 0.03, 0.03, x=lx, y=0.015, z=z, r2=0.026)
    box('stretcher', 'walnut', L - 0.3, 0.04, 0.05, y=0.16, bev=0.008)
    for lx in (-(L / 2 - 0.12), 0, L / 2 - 0.12): box(f'stretchX{lx}', 'walnut', 0.05, 0.04, D - 0.24, x=lx, y=0.16, bev=0.008)
    finish('reading_table_6080', [((3.6, 1.8, 3.2), (0, 0.6, 0)), ((1.2, 1.1, 1.8), (1.6, 0.6, 0))])

# ---------------- 档案馆 借阅柜台（批次32）----------------
#   loan_counter  7.2 长（沿 x）× 1.2 柜身 / 1.4 台面，台面顶 1.11；公众面 +Z：胡桃木框 6 间凸起芯板 + 铜踢脚 + 铜扶手杆；职员面 −Z：开放格架
def loan_counter():
    L, D, T = 7.0, 1.2, 1.08
    box('plinth', 'stone', L - 0.06, 0.1, D - 0.08, y=0.05)
    box('carcass', 'walnut', L, T - 0.1, D - 0.06, y=0.1 + (T - 0.1) / 2)
    zf = (D - 0.06) / 2 + 0.006
    n = 7; bw = L / n
    for i in range(n + 1):
        box(f'stile{i}', 'walnut', 0.07, T - 0.18, 0.014, x=-L / 2 + i * bw + (0.035 if i == 0 else -0.035 if i == n else 0), y=0.1 + (T - 0.1) / 2, z=zf)
    for yy in (0.17, T - 0.07): box(f'rail{yy}', 'walnut', L - 0.02, 0.06, 0.014, y=yy, z=zf - 0.006)
    for i in range(n):
        cx = -L / 2 + (i + 0.5) * bw
        box(f'panel{i}', 'walnutD', bw - 0.15, T - 0.36, 0.018, x=cx, y=0.1 + (T - 0.1) / 2, z=zf + 0.004, bev=0.014)
        box(f'boss{i}', 'brass', 0.07, 0.07, 0.008, x=cx, y=0.1 + (T - 0.1) / 2, z=zf + 0.016, bev=0.003)
    box('toe', 'brass', L - 0.04, 0.03, 0.012, y=0.115, z=zf + 0.002, bev=0.002)
    # 铜扶手杆（公众侧离地 0.25，托架 1 m 一只）
    cyl('footRail', 'brass', 0.022, L - 0.3, y=0.25, z=zf + 0.14, axis='x')
    for k in range(7): box(f'railBr{k}', 'brass', 0.025, 0.025, 0.14, x=-3.0 + k * 1.0, y=0.25, z=zf + 0.07, bev=0.004)
    # 台面：黑石 + 前缘铜包边 + 胡桃木下沿线脚
    box('top', 'stone', L + 0.2, 0.05, 1.4, y=T + 0.025, z=0.08, bev=0.01)
    box('topBrass', 'brass', L + 0.21, 0.014, 0.012, y=T + 0.025, z=0.08 + 0.706, bev=0.002)
    box('topMould', 'walnut', L + 0.1, 0.04, 0.05, y=T - 0.02, z=zf + 0.02, bev=0.008)
    # 职员侧开放格架（3 层隔板 + 竖隔）
    zb = -(D - 0.06) / 2 - 0.005
    for yy in (0.45, 0.8): box(f'shelf{yy}', 'walnutD', L - 0.1, 0.025, 0.012, y=yy, z=zb)
    for k in range(8): box(f'div{k}', 'walnut', 0.03, T - 0.2, 0.014, x=-L / 2 + 0.05 + k * (L - 0.1) / 7, y=0.1 + (T - 0.1) / 2, z=zb)
    finish('loan_counter_6080', [((3.2, 1.9, 4.2), (0, 0.6, 0)), ((-2.5, 1.8, -3.0), (0, 0.6, 0))])

for nm, fn in [('sec_counter', counter), ('scan_gate', gate), ('wait_bench', bench), ('vitrine', vitrine), ('reading_table', reading_table), ('loan_counter', loan_counter)]:
    if ONLY and ONLY != nm: continue
    reset(); M = mats(); fn()
