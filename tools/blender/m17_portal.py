# 批次M17：正门门廊二轮精修（Blender 程序化）——
#   portal.glb：五重退缩尖拱券面重建（每重分块券石 + 圆棍/凹槽/平带线脚 + 暗色灰缝芯，奇数重犬齿饰带、最外重卷叶 + 暗铜嵌线，各重拱心石，最外重大拱心石）
#               + 门楣本体（错缝平拱 7 块 + 加高中央拱心块 + 檐口三级线脚 + 暗铜线）。叠加并包住 hero_facade.glb portal() 的方截面券（原券面落在新截面内部）。
#   steps.glb ：正门 10 级踏步 + 平台铺装 + 两侧颊墙与柱墩（磨损圆角前沿：中间行走带圆角更大、踏面中段 ≤1 cm 凹陷，两侧几乎不磨；暗铜防滑条嵌入）。
#               几何与 exterior.js buildFrontSteps 同尺寸（踏面顶 0.18(i+1)、前沿 z=4.5−0.5i、宽 34），碰撞仍由 JS world.box 生成，不变。
# 坐标：游戏 (x, y, z) → Blender (x, −z, y)。portal 原点 = 门洞底边中点（游戏 0, FLOOR, −5），+z 朝外；steps 原点 = 游戏原点（y 0 = 广场地面）。
# 用法：blender.sh -b -P m17_portal.py -- <outdir> <prevdir|->
import bpy, sys, math, random
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]; VIEWS = [int(v) for v in argv[2].split(',')] if len(argv) > 2 else [0, 1, 2, 3, 4]
random.seed(17)
bpy.ops.wm.read_factory_settings(use_empty=True); S = bpy.context.scene
def mat(name, col, rough, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m
MT = {k: mat(*v) for k, v in dict(
    stone=('m17_stone', (0.17, 0.16, 0.15), 0.82), stoneD=('m17_stoneDark', (0.10, 0.095, 0.09), 0.86), joint=('m17_joint', (0.03, 0.028, 0.026), 1.0),
    bronze=('m17_bronze', (0.26, 0.17, 0.09), 0.5, 0.6), tread=('m17_tread', (0.21, 0.20, 0.185), 0.74), riser=('m17_riser', (0.15, 0.142, 0.132), 0.8),
    cheek=('m17_cheek', (0.17, 0.16, 0.15), 0.8), coping=('m17_coping', (0.23, 0.215, 0.20), 0.68)).items()}
def g2b(p): return (p[0], -p[2], p[1])
def mesh(name, V, F, mats, fmat=None, coll=None):
    me = bpy.data.meshes.new(name); me.from_pydata([g2b(v) for v in V], [], F); me.update()
    for m in mats: me.materials.append(MT[m])
    if fmat:
        for i, p in enumerate(me.polygons): p.material_index = fmat[i]
    o = bpy.data.objects.new(name, me); (coll or S.collection).objects.link(o); return o
def loft(rings, closed_prof=True, cap=True):
    """rings: [[(x,y,z)...] 每环同点数] → 面（四边形）+ 两端盖（ngon）"""
    n = len(rings[0]); V = [p for r in rings for p in r]; F = []
    for i in range(len(rings) - 1):
        for j in range(n if closed_prof else n - 1):
            a, b = i * n + j, i * n + (j + 1) % n; F.append((a, b, b + n, a + n))
    if cap: F.append(tuple(range(n - 1, -1, -1))); F.append(tuple((len(rings) - 1) * n + j for j in range(n)))
    return V, F
def box(name, m, w, h, d, x, y, z, bev=0.0, seg=2, coll=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=g2b((x, y, z))); o = bpy.context.object; o.scale = (w, d, h); o.name = name
    o.data.materials.append(MT[m])
    if bev: md = o.modifiers.new('b', 'BEVEL'); md.width = bev; md.segments = seg; md.limit_method = 'ANGLE'
    if coll: S.collection.objects.unlink(o); coll.objects.link(o)
    return o
CP = bpy.data.collections.new('portal'); CS = bpy.data.collections.new('steps'); S.collection.children.link(CP); S.collection.children.link(CS)

# ================= A 尖拱券面（portal 局部：x, y=高, z=朝外） =================
HS, W0, DP = 9.0, 7.0, 0.55
# 券面截面 (r 朝券外, d 朝广场)：后部包住原方截面券（r ±0.25, d −0.495…0）与原圆棍（中心 d −0.06, r 0.13）
roll = [(0.15 * math.cos(math.radians(a)), 0.15 * math.sin(math.radians(a))) for a in (165, 140, 115, 90, 65, 40, 15)]
PROF = [(-0.28, -0.50), (-0.28, 0.0), (-0.25, 0.035), (-0.21, 0.012), (-0.172, 0.022)] + roll + [(0.172, 0.022), (0.21, 0.012), (0.24, 0.035), (0.26, 0.05), (0.30, 0.05), (0.30, -0.50)]
JPROF = [(-0.262, -0.48), (-0.262, 0.03), (0.285, 0.03), (0.285, -0.48)]  # 暗灰缝芯
def arc_pt(w, side, a):  # side −1 左弧（圆心 (w/2, HS)）/ +1 右弧；a = 从拱脚起的角（0…π/3）
    R = w; cx = -side * w / 2
    ang = (math.pi - a) if side < 0 else a
    P = (cx + R * math.cos(ang), HS + R * math.sin(ang)); n = (math.cos(ang), math.sin(ang)); return P, n
def ring_at(w, side, a, zf, prof):
    P, n = arc_pt(w, side, a); return [(P[0] + n[0] * r, P[1] + n[1] * r, zf + d) for r, d in prof]
A_TOP = math.pi / 3
for k in range(6):
    w = W0 + k; zf = DP * k; R = w; L = R * A_TOP
    key_half = 0.22 / R  # 拱心石半宽（弧度）
    nb = max(4, round((L - 0.22) / 0.58)); gap = 0.012 / R
    for side in (-1, 1):
        # 灰缝芯（整段）
        rings = [ring_at(w, side, A_TOP * t / 24, zf, JPROF) for t in range(25)]; V, F = loft(rings); mesh(f'jt{k}{side}', V, F, ['joint'], coll=CP)
        for b in range(nb):
            a0 = (A_TOP - key_half) * b / nb + (gap if b else 0); a1 = (A_TOP - key_half) * (b + 1) / nb - gap
            sub = 3; rings = [ring_at(w, side, a0 + (a1 - a0) * t / sub, zf, PROF) for t in range(sub + 1)]
            V, F = loft(rings); mesh(f'vs{k}{side}{b}', V, F, ['stone' if (b + k) % 5 else 'stoneD'], coll=CP)
        # 犬齿饰带（奇数重，外侧凹槽内）
        if k % 2 == 1:
            nt = int(L / 0.24)
            for t in range(1, nt):
                a = A_TOP * t / nt
                if a > A_TOP - key_half - 0.02: continue
                P, n = arc_pt(w, side, a); tg = (-n[1], n[0]); c = (P[0] + n[0] * 0.21, P[1] + n[1] * 0.21)
                s = 0.06; base = []
                for q in range(8):  # 八点星形底（四瓣犬齿）
                    ang = q * math.pi / 4; rr = s if q % 2 == 0 else s * 0.45
                    u, v = rr * math.cos(ang), rr * math.sin(ang)
                    base.append((c[0] + tg[0] * u + n[0] * v, c[1] + tg[1] * u + n[1] * v, zf + 0.012))
                V = base + [(c[0], c[1], zf + 0.085)]; F = [tuple(range(7, -1, -1))] + [(q, (q + 1) % 8, 8) for q in range(8)]
                mesh(f'dt{k}{side}{t}', V, F, ['stone'], coll=CP)
        # 最外重：外缘卷叶（crocket）+ 暗铜嵌线
        if k == 5:
            rings = [ring_at(w, side, A_TOP * t / 30, zf, [(0.278, 0.05), (0.278, 0.066), (0.292, 0.066), (0.292, 0.05)]) for t in range(31)]
            V, F = loft(rings); mesh(f'bz{side}', V, F, ['bronze'], coll=CP)
            for t in range(1, 15):
                a = A_TOP * t / 15 - 0.01
                P, n = arc_pt(w, side, a); c = (P[0] + n[0] * 0.36, P[1] + n[1] * 0.36)
                bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=1, location=g2b((c[0], c[1], zf - 0.12)))
                o = bpy.context.object; o.scale = (0.09, 0.07, 0.16); o.rotation_mode = 'XYZ'
                o.rotation_euler = (0.5, 0, math.atan2(n[1], n[0]) - math.pi / 2); o.data.materials.append(MT['stone']); S.collection.objects.unlink(o); CP.objects.link(o)
    # 拱心石：两弧交点处，竖向楔形块，外伸 0.12（最外重 0.3 + 暗铜圆饰）
    big = k == 5; hw0, hw1 = (0.2, 0.3) if not big else (0.3, 0.46)
    ytop = HS + R * math.sin(math.acos(0.5)); r0, r1 = -0.3, (0.42 if big else 0.32)
    y0, y1 = ytop + r0, ytop + r1; zb, zt = zf - 0.48, zf + (0.2 if big else 0.13)
    V = [(-hw0, y0, zb), (hw0, y0, zb), (hw1, y1, zb), (-hw1, y1, zb), (-hw0, y0, zt), (hw0, y0, zt), (hw1, y1, zt), (-hw1, y1, zt)]
    F = [(0, 1, 2, 3)[::-1], (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    o = mesh(f'key{k}', V, F, ['stoneD' if big else 'stone'], coll=CP)
    md = o.modifiers.new('b', 'BEVEL'); md.width = 0.025; md.segments = 2
    if big:
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.16, depth=0.05, location=g2b((0, (y0 + y1) / 2, zt + 0.02)))
        o = bpy.context.object; o.rotation_euler = (math.pi / 2, 0, 0); o.data.materials.append(MT['bronze']); S.collection.objects.unlink(o); CP.objects.link(o)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.2, minor_radius=0.02, location=g2b((0, (y0 + y1) / 2, zt + 0.02)))
        o = bpy.context.object; o.rotation_euler = (math.pi / 2, 0, 0); o.data.materials.append(MT['bronze']); S.collection.objects.unlink(o); CP.objects.link(o)
# ---- 门楣本体：错缝平拱（门套内皮 x ±3.34 之间），底 8.55（坐在 M7 叠涩上），顶 9.42，前面 z +0.10
LB, LT, LZ0, LZ1 = 8.55, 9.42, -0.03, 0.10
xs = [-3.34, -2.36, -1.42, -0.5, 0.5, 1.42, 2.36, 3.34]
for i in range(7):
    x0, x1 = xs[i] + 0.006, xs[i + 1] - 0.006; key = i == 3
    # 平拱楔缝：缝线朝下汇聚（上宽下窄），中央块加高到 9.62
    sk = lambda x, y: x * (1 + (y - LB) * 0.035)
    top = 9.62 if key else LT
    V = [(sk(x0, LB), LB, LZ0), (sk(x1, LB), LB, LZ0), (sk(x1, top), top, LZ0), (sk(x0, top), top, LZ0)]
    V += [(p[0], p[1], LZ1 + (0.03 if key else 0)) for p in V]
    F = [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    o = mesh(f'lin{i}', V, F, ['stoneD' if key else 'stone'], coll=CP); md = o.modifiers.new('b', 'BEVEL'); md.width = 0.018; md.segments = 2
box('lin_joint', 'joint', 6.7, 0.84, 0.1, 0, (LB + LT) / 2, 0.0, coll=CP)
box('lin_plaque', 'bronze', 0.42, 0.26, 0.02, 0, 9.1, LZ1 + 0.04, bev=0.006, coll=CP)
for j, (h, d, y) in enumerate([(0.06, 0.16, LT + 0.03), (0.05, 0.22, LT + 0.085), (0.04, 0.27, LT + 0.13)]):
    box(f'lin_cor{j}', 'stone', 6.62 - 0.0 * j, h, d, 0, y, LZ0 + d / 2 + 0.01, bev=0.01, coll=CP)
box('lin_bz', 'bronze', 6.5, 0.02, 0.012, 0, LT + 0.002, LZ1 + 0.03, coll=CP)

# ================= B 正门台阶 + 平台 + 颊墙柱墩（游戏世界坐标） =================
SW, SX0, SL, GAP = 34.0, -17.0, 1.4, 0.008
def segs(off):
    out = []; x = SX0; w = SL / 2 if off else SL
    while x < -SX0 - 1e-3: e = min(-SX0, x + w); out.append((x, e)); x = e; w = SL
    return out
def wear(x): return math.exp(-(x / 9.0) ** 2)  # 中间行走带磨损权重
for i in range(10):
    yt, yb, zf, last = 0.18 * (i + 1), 0.18 * i, 4.5 - 0.5 * i, i == 9
    dep = 0.6 if last else 0.52
    box(f'sj{i}', 'joint', SW, yt - 0.05, 0.5, 0, (yt - 0.05) / 2, zf - 0.27, coll=CS)
    for (a, e) in segs(i % 2):
        x0, x1 = a + GAP / 2, e - GAP / 2; nx = 4; rings = []
        jit = random.uniform(-0.0015, 0.0015)
        for t in range(nx + 1):
            x = x0 + (x1 - x0) * t / nx; wv = wear(x)
            rw = (0.03 + 0.03 * wv) if not last else 0.05; dip = (0.009 * wv + 0.002) if not last else 0.003
            zb, zn = zf - dep, zf + 0.02; ytop = yt + jit
            prof = [(zb, yb + (0.0 if i else 0.0)), (zf - 0.015, yb), (zf - 0.015, ytop - 0.07), (zn - 0.004, ytop - rw - 0.012)]
            for q in range(5):  # 前沿圆角（磨损半径随 x 变）
                ang = q * (math.pi / 2) / 4
                prof.append((zn - rw + rw * math.cos(ang), ytop - rw + rw * math.sin(ang)))
            for f in (0.2, 0.42, 0.62, 0.82):  # 踏面中段凹陷
                prof.append((zn - rw - (zn - rw - zb) * f, ytop - dip * math.sin(math.pi * min(1, f * 1.1))))
            prof.append((zb, ytop))
            rings.append([(x, y, z) for z, y in prof])
        V, F = loft(rings)
        npf = len(rings[0]); fm = []
        for ii in range(nx):
            for j in range(npf): fm.append(1 if j in (1, 2) else 0)  # 踢面 = riser 材质
        fm += [0, 0]
        mesh(f'st{i}_{a:.1f}', V, F, ['coping' if last else 'tread', 'riser'], fmat=fm, coll=CS)
        if not last:  # 暗铜防滑条（嵌入 6 mm）
            for dz in (0.06, 0.11):
                box(f'nb{i}', 'bronze', x1 - x0 - 0.16, 0.008, 0.022, (x0 + x1) / 2, yt - 0.0035 - 0.002 * wear((x0 + x1) / 2), zf - dz, coll=CS)
# 平台铺装（z −0.5…−5.5，1.2 m 错缝）
box('pj', 'joint', SW, 1.76, 5.0, 0, 0.88, -3.0, coll=CS)
for r in range(4):
    z0 = -0.6 - r * 1.225; z1 = z0 - 1.225
    for (a, e) in segs(r % 2):
        box(f'pv{r}', 'tread', e - a - 0.01, 0.05, z0 - z1 - 0.01, (a + e) / 2, 1.775 + random.uniform(-0.0012, 0.0012), (z0 + z1) / 2, bev=0.008, coll=CS)
# 两侧颊墙（斜压顶）+ 柱墩
for sx in (-1, 1):
    xc = sx * 17.6
    def ytop(z): return 1.03 + 0.36 * (4.5 - z)
    zA, zB = 4.35, 1.7
    # 墙身：斜顶（x 宽 1.1）
    V = []
    for x in (xc - 0.55, xc + 0.55):
        V += [(x, 0.0, zA), (x, 0.0, zB), (x, ytop(zB) - 0.1, zB), (x, ytop(zA) - 0.1, zA)]
    F = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    o = mesh(f'cw{sx}', V, F, ['cheek'], coll=CS)
    # 勒脚（突出 3 cm，高 0.28）
    box(f'cwp{sx}', 'stoneD', 1.16, 0.28, zA - zB, xc, 0.14, (zA + zB) / 2, bev=0.01, coll=CS)
    # 内外侧凹框（暗色线脚，沿斜面）
    for fx in (-1, 1):
        x = xc + fx * 0.552
        for (za, zb_, yo) in [(zA - 0.15, zB + 0.15, 0.45)]:
            ya, yb2 = ytop(za) - 0.32, ytop(zb_) - 0.32
            for (p0, p1) in [((za, 0.42), (zb_, 0.42)), ((zb_, 0.42), (zb_, yb2)), ((zb_, yb2), (za, ya)), ((za, ya), (za, 0.42))]:
                cz, cy = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2; ln = math.hypot(p1[0] - p0[0], p1[1] - p0[1])
                bpy.ops.mesh.primitive_cube_add(size=1, location=g2b((x, cy, cz))); o = bpy.context.object
                o.scale = (0.012, ln + 0.04, 0.04); o.rotation_euler = (math.atan2(p1[1] - p0[1], -(p1[0] - p0[0])), 0, 0)
                o.data.materials.append(MT['stoneD']); S.collection.objects.unlink(o); CS.objects.link(o)
    # 斜压顶（厚 0.12，宽 1.32，两侧挑出 + 前端水平收头）
    V = []
    for x in (xc - 0.66, xc + 0.66):
        V += [(x, ytop(zA) - 0.12, zA), (x, ytop(zB) - 0.12, zB - 0.06), (x, ytop(zB) + 0.02, zB - 0.06), (x, ytop(zA) + 0.02, zA)]
    o = mesh(f'cc{sx}', V, F, ['coping'], coll=CS); md = o.modifiers.new('b', 'BEVEL'); md.width = 0.02; md.segments = 2
    # 柱墩（z 4.35…5.85）：基座 + 墩身 + 腰线 + 两级檐 + 低锥顶
    zc = 5.1
    box(f'pb{sx}', 'stoneD', 1.66, 0.22, 1.66, xc, 0.11, zc, bev=0.015, coll=CS)
    box(f'pb2{sx}', 'cheek', 1.56, 0.08, 1.56, xc, 0.26, zc, bev=0.02, coll=CS)
    box(f'ps{sx}', 'cheek', 1.46, 0.98, 1.46, xc, 0.79, zc, bev=0.012, coll=CS)
    for fx, fz in ((1, 0), (-1, 0), (0, 1), (0, -1)):  # 四面凹芯板框
        if fx: box(f'pp{sx}', 'stoneD', 0.012, 0.6, 1.0, xc + fx * 0.732, 0.8, zc, coll=CS)
        else: box(f'pp{sx}', 'stoneD', 1.0, 0.6, 0.012, xc, 0.8, zc + fz * 0.732, coll=CS)
    box(f'pk{sx}', 'coping', 1.6, 0.08, 1.6, xc, 1.32, zc, bev=0.015, coll=CS)
    box(f'pk2{sx}', 'coping', 1.72, 0.1, 1.72, xc, 1.41, zc, bev=0.02, coll=CS)
    box(f'pbz{sx}', 'bronze', 1.62, 0.02, 1.62, xc, 1.365, zc, coll=CS)
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.78 * 1.414, radius2=0.12, depth=0.22, location=g2b((xc, 1.57, zc)))
    o = bpy.context.object; o.rotation_euler = (0, 0, math.pi / 4); o.data.materials.append(MT['coping']); S.collection.objects.unlink(o); CS.objects.link(o)

# ================= 导出 =================
def finish(coll, name, out):
    for o in list(coll.objects):
        bpy.context.view_layer.objects.active = o; o.select_set(True)
        for md in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
        o.select_set(False)
        if 'UVMap' not in o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
    bpy.ops.object.select_all(action='DESELECT')
    for o in coll.objects: o.select_set(True)
    bpy.context.view_layer.objects.active = coll.objects[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.join(); ob = bpy.context.view_layer.objects.active; ob.name = name
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.uv.cube_project(cube_size=1.0, correct_aspect=True, clip_to_bounds=False, scale_to_bounds=False); bpy.ops.object.mode_set(mode='OBJECT')
    for p in ob.data.polygons: p.use_smooth = False
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, use_selection=True)
    print(name, 'tris', sum(len(p.vertices) - 2 for p in ob.data.polygons), 'bbox', [round(v, 3) for v in ob.dimensions]); return ob
P = finish(CP, 'm17_portal', f'{OUT}/portal.glb'); St = finish(CS, 'm17_steps', f'{OUT}/steps.glb')
if PREV == '-': sys.exit(0)
# ---- 预览：portal 放回世界位置 (0, 1.8, −5)，加门洞墙 / 原券占位，暖光 ----
P.location = g2b((0, 1.8, -5))
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.10, 0.095, 0.09, 1)
ph = mat('ph', (0.20, 0.19, 0.18), 0.9)
def phbox(wd, h, d, x, y, z):
    bpy.ops.mesh.primitive_cube_add(size=1, location=g2b((x, y, z))); o = bpy.context.object; o.scale = (wd, d, h); o.data.materials.append(ph)
for s in (-1, 1): phbox(12, 24, 1.0, s * 12.0, 1.8 + 12, -5.5 - 0.0)
phbox(7, 12, 0.4, 0, 1.8 + 9 + 6, -5.6)
bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0)); bpy.context.object.data.materials.append(mat('fl', (0.16, 0.15, 0.14), 0.85))
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5)); sun = bpy.context.object; sun.data.energy = 1.2; sun.data.color = (1.0, 0.84, 0.66); sun.rotation_euler = (math.radians(60), 0, math.radians(-30))
bpy.ops.object.light_add(type='POINT', location=g2b((0, 6, 6))); bpy.context.object.data.energy = 1500; bpy.context.object.data.color = (1.0, 0.75, 0.5)
S.render.engine = 'CYCLES'; S.cycles.samples = 10; S.cycles.use_denoising = False; S.render.resolution_x = 640; S.render.resolution_y = 480
for i, (cp, tg, lens) in enumerate([((0, 7, 24), (0, 10, -5), 30), ((9, 3.5, 10), (0, 9, -4), 26), ((-1.5, 13, 2.5), (-3, 15.5, -4), 24), ((9, 1.1, 7.5), (2, 0.7, 2.5), 24), ((-15.5, 2.2, 8.5), (-17.5, 1.0, 3.5), 26)]):
    if i not in VIEWS: continue
    bpy.ops.object.camera_add(location=g2b(cp)); cam = bpy.context.object; S.camera = cam
    cam.rotation_euler = (Vector(g2b(tg)) - Vector(g2b(cp))).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lens
    S.render.filepath = f'{PREV}/m17_portal_{i}.png'; bpy.ops.render.render(write_still=True)
