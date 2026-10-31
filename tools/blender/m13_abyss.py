# 批次 M13：墨渊 abyss_gate 深渊门 Blender hero（巨型石拱门 + 门前深井广场围合）。
# 用法：blender.sh -b -P m13_abyss.py -- <outdir> <prevdir|-> <view index | -1 = 只导出>
# 坐标约定同 m1_lib：参数 (x, y=高, z=前后)，与游戏坐标一致；原点 = 墨渊地坪 (0, AY, 0)，x/z 为游戏绝对坐标。
#   m13/abyss_gate.glb：
#   · 门洞：等边尖拱 w 12.4 / 起拱 10.6（与 depths.js 折页面 archShape(12.4, 10.6) 完全重合 → 折页面即后续特效贴面，z −80.8）。
#   · 四层退缩拱券（order 0..3，内半宽 6.2/6.9/7.6/8.3，外 9.0；前脸 z −80.2/−79.5/−78.8/−78.1），每层独立拱石（留 2 cm 灰缝），拱心石凸出；
#     order 1/2 内角立小圆柱（柱础 + 柱头）；门洞内圈暗铜铆钉门框（0.28 宽带 + 铆钉）。
#   · 两侧门座（socle）x 6.2..9.0，y 0..3，前脸 z −77.95：右座即原铜铭牌 doc_abyss_gate_plate（x 7.2, z −77.88）的底墙；左座对称装暗铜符刻浮雕板。
#   · 立面墙 x ±15、高 30、厚 3.9（z −78.1..−82），拱门以上拱肩 + 三道束腰线（酒红褐石嵌带）+ 顶檐口；扶壁 x ±12.5 两级收分；门两侧三级石台阶（不在通行路径）。
#   · 深井围合：东西侧墙 x ±15..±15.8（z −54..−78.1，高 24，壁柱 ×4 + 顶檐），南墙在回程门两侧 + 回程门上方（y 8..24）。
#   · 门槛石（顶 y +0.012，铜包边）。不含人物、不含特效。
import bpy, bmesh, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from m1_lib import mat, box, cyl, finish, reset
import m1_lib

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PREV, VIEW = argv[0], argv[1], int(argv[2])
os.makedirs(OUT, exist_ok=True)
if PREV != '-': os.makedirs(PREV, exist_ok=True)

def pal():
    m1_lib._M.clear()
    return dict(
        stone=mat('m13_stone', (0.34, 0.30, 0.26), 0.8),
        stoneD=mat('m13_stoneDark', (0.19, 0.17, 0.15), 0.75),
        porph=mat('m13_porph', (0.17, 0.06, 0.045), 0.6),
        bronze=mat('m2_bronze', (0.23, 0.15, 0.08), 0.5, 1.0),
    )

HS = 10.6            # 起拱高
HALF = [6.2, 6.9, 7.6, 8.3, 9.0]
FRONT = [-80.2, -79.5, -78.8, -78.1]
BACK = -81.9
SOC_H, SOC_F = 3.0, -77.95

def arc_pt(w, t, side):
    """等边尖拱（archShape 同式）：宽 w，起拱 HS；t∈[0,1] 从起拱点到拱顶；side=-1 左 / +1 右。"""
    h = w / 2; a = math.pi - (math.pi / 3) * t
    x = h + w * math.cos(a); y = HS + w * math.sin(a)
    return (x * (-side), y) if side == 1 else (x, y)

def prism(m, quad, zf, zb, name='blk'):
    """quad = 4 个 (x,y) 点（游戏 x-y 平面），沿 z 从 zf 到 zb 挤出。"""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    f = [bm.verts.new((x, -zf, y)) for (x, y) in quad]
    b = [bm.verts.new((x, -zb, y)) for (x, y) in quad]
    n = len(quad)
    bm.faces.new(f); bm.faces.new(b[::-1])
    for i in range(n):
        j = (i + 1) % n; bm.faces.new([f[i], b[i], b[j], f[j]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    o.data.materials.append(m); return o

def lerp(a, b, t): return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

def voussoirs(m, wi, wo, zf, zb, n, gap=0.02, key=None):
    """一层拱券的拱石：左右各 n 块（顶部两块合成拱心石，另给 key 材质凸出）。"""
    for side in (-1, 1):
        for i in range(n):
            t0, t1 = i / n, (i + 1) / n
            if i == n - 1: t1 = 1.0
            a0, a1 = arc_pt(wi, t0, side), arc_pt(wi, t1, side)
            b0, b1 = arc_pt(wo, t0, side), arc_pt(wo, t1, side)
            # 灰缝：沿切向收 gap
            g = gap / max(0.1, math.dist(a0, a1))
            a0g, a1g = lerp(a0, a1, g), lerp(a1, a0, g if i < n - 1 else 0)
            gb = gap / max(0.1, math.dist(b0, b1))
            b0g, b1g = lerp(b0, b1, gb), lerp(b1, b0, gb if i < n - 1 else 0)
            q = [a0g, b0g, b1g, a1g] if side == -1 else [a1g, b1g, b0g, a0g]
            prism(m, q, zf - (0.0 if i % 2 else 0.02), zb)
    if key is not None:
        # 拱心石：跨拱顶，较拱石外凸 0.12、上下各出 0.25
        ap_i = arc_pt(wi, 1.0, -1); ap_o = arc_pt(wo, 1.0, -1)
        hw = 0.42
        prism(key, [(-hw * 0.8, ap_i[1] - 0.35), (hw * 0.8, ap_i[1] - 0.35), (hw * 1.15, ap_o[1] + 0.3), (-hw * 1.15, ap_o[1] + 0.3)], zf + 0.12, zf - 0.4)

def jamb(m, x0, x1, zf, zb, y0, y1, course=0.82, gap=0.018):
    """拱脚以下的门侧墩：错缝条石（每皮宽度交替）。"""
    y = y0; k = 0
    while y < y1 - 0.05:
        yt = min(y1, y + course)
        prism(m, [(x0, y + gap), (x1, y + gap), (x1, yt), (x0, yt)], zf - (0.015 if k % 2 else 0.0), zb)
        y = yt; k += 1

def portal(P):
    for k in range(4):
        for s in (-1, 1):
            x0, x1 = s * HALF[k], s * HALF[k + 1]
            jamb(P['stone'], min(x0, x1), max(x0, x1), FRONT[k], BACK, SOC_H, HS)
            # 拱脚冠石（impost）：每层起拱处横线
            box(P['stoneD'], HALF[k + 1] - HALF[k] + 0.1, 0.32, 0.12, x=s * (HALF[k] + HALF[k + 1]) / 2, y=HS - 0.16, z=FRONT[k] + 0.06, bev=0.02)
        voussoirs(P['stone'] if k % 2 == 0 else P['stoneD'], 2 * HALF[k], 2 * HALF[k + 1], FRONT[k], BACK, 9 + k, key=(P['stone'] if k == 3 else None))
    # 酒红褐石嵌带：order 2 拱面外缘一道细带
    for side in (-1, 1):
        n = 24
        for i in range(n):
            t0, t1 = i / n, (i + 1) / n
            a0, a1 = arc_pt(2 * HALF[3] - 0.24, t0, side), arc_pt(2 * HALF[3] - 0.24, t1, side)
            b0, b1 = arc_pt(2 * HALF[3] - 0.08, t0, side), arc_pt(2 * HALF[3] - 0.08, t1, side)
            prism(P['porph'], [a0, b0, b1, a1] if side == -1 else [a1, b1, b0, a0], FRONT[2] + 0.015, FRONT[2] - 0.05)
    # order 1/2 内角小圆柱（柱础 + 柱身 + 柱头）
    for k in (1, 2, 3):
        for s in (-1, 1):
            x = s * (HALF[k] + 0.02); z = FRONT[k - 1] + 0.02
            cyl(P['stoneD'], 0.3, 0.3, x=x, y=SOC_H + 0.15, z=z, n=20, bev=0.03)
            cyl(P['stone'], 0.21, HS - SOC_H - 0.9, x=x, y=(SOC_H + 0.3 + HS - 0.6) / 2, z=z, n=20)
            cyl(P['stoneD'], 0.36, 0.5, x=x, y=HS - 0.35, z=z, n=20, r2=0.22)
    # 暗铜铆钉门框：门洞内圈 0.28 宽带（order 0 前脸外凸 6 cm），拱段 + 门侧竖段（门座以上）
    zf = FRONT[0] + 0.06; zb = FRONT[0] - 0.02
    for side in (-1, 1):
        n = 30
        for i in range(n):
            t0, t1 = i / n, (i + 1) / n
            a0, a1 = arc_pt(12.4, t0, side), arc_pt(12.4, t1, side)
            b0, b1 = arc_pt(12.96, t0, side), arc_pt(12.96, t1, side)
            prism(P['bronze'], [a0, b0, b1, a1] if side == -1 else [a1, b1, b0, a0], zf, zb)
            if i % 2 == 0:
                c = lerp(arc_pt(12.68, t0, side), arc_pt(12.68, t1, side), 0.5)
                cyl(P['bronze'], 0.05, 0.05, x=c[0], y=c[1], z=zf + 0.02, axis='z', n=10)
        x = side * 6.34
        box(P['bronze'], 0.28, HS - SOC_H, 0.08, x=x, y=(SOC_H + HS) / 2, z=FRONT[0] + 0.02)
        y = SOC_H + 0.3
        while y < HS - 0.1:
            cyl(P['bronze'], 0.05, 0.05, x=x, y=y, z=zf + 0.02, axis='z', n=10); y += 0.62
        # 门洞内侧竖向铜包边（门座内侧面全高）
        box(P['bronze'], 0.05, SOC_H, 0.2, x=side * 6.225, y=SOC_H / 2, z=SOC_F - 0.12)

def socles(P):
    for s in (-1, 1):
        xc = s * 7.6
        box(P['stone'], 2.8, SOC_H, SOC_F - BACK, x=xc, y=SOC_H / 2, z=(SOC_F + BACK) / 2)
        box(P['stoneD'], 2.96, 0.32, 0.2, x=xc, y=0.16, z=SOC_F + 0.06, bev=0.03)            # 勒脚
        box(P['stoneD'], 3.0, 0.22, 0.26, x=xc, y=SOC_H - 0.11, z=SOC_F + 0.08, bev=0.04)    # 座顶线脚
        box(P['stone'], 2.9, 0.1, 0.16, x=xc, y=SOC_H - 0.27, z=SOC_F + 0.04, bev=0.02)
        # 前脸两道竖向石缝分块（三块面石）
        for dx in (-0.47, 0.47):
            box(P['stoneD'], 0.025, SOC_H - 0.6, 0.01, x=xc + dx, y=SOC_H / 2, z=SOC_F + 0.003)
    # 左座：暗铜符刻浮雕板（与右侧铭牌对称；纯几何刻纹，无文字无人形）
    x0, y0, zf = -7.2, 1.8, SOC_F + 0.05
    box(P['bronze'], 1.3, 1.6, 0.05, x=x0, y=y0, z=SOC_F + 0.025, bev=0.012)
    box(P['bronze'], 1.12, 1.42, 0.02, x=x0, y=y0, z=zf + 0.01)
    for i in range(5):  # 横刻纹
        w = [0.8, 0.5, 0.9, 0.4, 0.7][i]
        box(P['bronze'], w, 0.05, 0.03, x=x0 + [0, -0.12, 0.05, 0.18, -0.06][i], y=y0 - 0.5 + i * 0.25, z=zf + 0.03, bev=0.008)
    for i in range(4):  # 竖刻纹
        box(P['bronze'], 0.05, [0.4, 0.7, 0.3, 0.55][i], 0.03, x=x0 - 0.36 + i * 0.24, y=y0 + [0.2, -0.1, 0.35, 0.0][i], z=zf + 0.03, bev=0.008)
    cyl(P['bronze'], 0.16, 0.03, x=x0, y=y0 + 0.5, z=zf + 0.03, axis='z', n=24)
    for (dx, dy) in ((-0.58, -0.73), (0.58, -0.73), (-0.58, 0.73), (0.58, 0.73)):
        cyl(P['bronze'], 0.035, 0.04, x=x0 + dx, y=y0 + dy, z=zf + 0.03, axis='z', n=10)
    # 右座：铜铭牌外框（铭牌本体是游戏端 doc 平面 1.2×1.5 @ (7.2, 1.8, −77.88)；框只做四边，不遮牌面）
    for (w, h, dx, dy) in ((1.4, 0.07, 0, 0.8), (1.4, 0.07, 0, -0.8), (0.07, 1.67, 0.665, 0), (0.07, 1.67, -0.665, 0)):
        box(P['bronze'], w, h, 0.06, x=7.2 + dx, y=1.8 + dy, z=SOC_F + 0.03, bev=0.01)
    # 门槛石 + 铜包边
    box(P['stoneD'], 12.4, 0.06, BACK - SOC_F, x=0, y=-0.048, z=(SOC_F + BACK) / 2)
    box(P['bronze'], 12.4, 0.02, 0.1, x=0, y=0.002, z=SOC_F - 0.05)

def facade(P):
    zf, zb = -78.1, -82.0
    # 门两侧墙墩
    for s in (-1, 1):
        box(P['stone'], 6.0, 30, zf - zb, x=s * 12.0, y=15, z=(zf + zb) / 2)
    # 拱肩（拱外缘 → y 30），左右各一块多边形
    for side in (-1, 1):
        pts = [arc_pt(18.0, i / 16, side) for i in range(17)]
        poly = pts + [(0.0, 30.0), (side * 9.0, 30.0)]
        if side == 1: poly = poly[::-1]
        me = bpy.data.meshes.new('sp'); bm = bmesh.new()
        f = [bm.verts.new((x, -zf, y)) for (x, y) in poly]; b = [bm.verts.new((x, -zb, y)) for (x, y) in poly]
        bm.faces.new(f); bm.faces.new(b[::-1]); n = len(poly)
        for i in range(n):
            j = (i + 1) % n; bm.faces.new([f[i], b[i], b[j], f[j]])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
        o = bpy.data.objects.new('sp', me); bpy.context.collection.objects.link(o); o.data.materials.append(P['stone'])
    # 束腰线：y 3（接门座顶）/ 14.5 / 27.6，酒红褐嵌带；檐口 y 30
    for (y, ext) in ((SOC_H, ((-15, -9.0), (9.0, 15))), (27.6, ((-15, 15),))):
        for (a, b) in ext:
            box(P['stoneD'], b - a, 0.36, 0.3, x=(a + b) / 2, y=y - 0.18, z=zf + 0.15, bev=0.04)
            box(P['porph'], b - a, 0.12, 0.04, x=(a + b) / 2, y=y - 0.52, z=zf + 0.02)
    box(P['stoneD'], 30.6, 0.5, 0.7, x=0, y=29.75, z=zf + 0.3, bev=0.06)
    box(P['stone'], 30.2, 0.3, 0.45, x=0, y=29.35, z=zf + 0.18, bev=0.04)
    for i in range(30):  # 檐下齿饰
        box(P['stoneD'], 0.36, 0.3, 0.3, x=-14.5 + i * 1.0, y=29.05, z=zf + 0.15)
    # 扶壁 x ±12.5：两级收分 + 斜帽
    for s in (-1, 1):
        x = s * 12.5
        box(P['stone'], 1.8, 14.0, 1.4, x=x, y=7.0, z=zf + 0.7)
        box(P['stoneD'], 2.0, 0.4, 1.6, x=x, y=0.2, z=zf + 0.8, bev=0.03)
        prism(P['stoneD'], [(x - 0.9, 14.0), (x + 0.9, 14.0), (x + 0.9, 14.6), (x - 0.9, 14.6)], zf + 1.4, zf)  # 收分盖石
        box(P['stone'], 1.5, 8.0, 0.8, x=x, y=18.6, z=zf + 0.4)
        prism(P['stoneD'], [(x - 0.75, 22.6), (x + 0.75, 22.6), (x + 0.75, 23.0), (x - 0.75, 23.0)], zf + 0.8, zf)
        box(P['stoneD'], 1.9, 0.3, 1.5, x=x, y=14.15 - 0.3, z=zf + 0.75, bev=0.03)
    # 门两侧三级台阶（x 9.0..11.6 与 13.4..15，不在门洞通行路径）
    for s in (-1, 1):
        for (a, b) in ((9.0, 11.6), (13.4, 15.0)):
            for k in range(3):
                d = 1.2 - k * 0.4
                box(P['stoneD'] if k == 0 else P['stone'], b - a, 0.18, d, x=s * (a + b) / 2, y=0.09 + k * 0.18, z=zf + d / 2, bev=0.015)

def shaft(P):
    """深井围合：东西侧墙 + 南墙（回程门两侧与门上）。"""
    H = 24.0
    for s in (-1, 1):
        x = s * 15.4
        box(P['stone'], 0.8, H, 24.1, x=x, y=H / 2, z=(-54.0 - 78.1) / 2)
        box(P['stoneD'], 0.3, 0.4, 24.1, x=s * 14.9, y=0.2, z=(-54.0 - 78.1) / 2, bev=0.03)
        for (y, d) in ((SOC_H, 0.22), (14.5, 0.22)):
            box(P['stoneD'], d, 0.3, 24.1, x=s * (15.0 - d / 2), y=y - 0.15, z=(-54.0 - 78.1) / 2, bev=0.03)
        box(P['stoneD'], 0.9, 0.6, 24.1, x=s * 14.7, y=H - 0.3, z=(-54.0 - 78.1) / 2, bev=0.05)
        for z in (-59.0, -65.0, -71.0):
            box(P['stone'], 0.55, H - 0.6, 1.1, x=s * 14.73, y=(H - 0.6) / 2, z=z)
            box(P['stoneD'], 0.75, 0.4, 1.3, x=s * 14.63, y=0.2, z=z, bev=0.03)
            box(P['stoneD'], 0.75, 0.45, 1.3, x=s * 14.63, y=H - 0.6 - 0.22, z=z, bev=0.03)
    # 南墙：回程门两侧（|x| 7..15）与门上方（y 8..24）
    for s in (-1, 1):
        box(P['stone'], 8.8, H, 1.0, x=s * 11.4, y=H / 2, z=-53.5)
    box(P['stone'], 14.0, H - 8.0, 1.0, x=0, y=8.0 + (H - 8.0) / 2, z=-53.5)
    box(P['stoneD'], 30.0, 0.6, 0.6, x=0, y=H - 0.3, z=-54.2, bev=0.05)
    box(P['stoneD'], 14.4, 0.4, 0.4, x=0, y=8.2, z=-54.15, bev=0.03)

def build():
    S = reset(); P = pal()
    portal(P); socles(P); facade(P); shaft(P)
    ob = finish(S, f'{OUT}/abyss_gate.glb', 'abyss_gate', cube=2.0)
    return S, ob

S, ob = build()
if VIEW >= 0 and PREV != '-':
    L = [((0, 8, -74), 9000, (1, .86, .7)), ((0, 4, -66), 3000, (1, .88, .74)), ((-12, 6, -60), 1500, (1, .85, .7))]
    V = [((0, 1.7, -60), (0, 7, -82), 22),       # 0 正面玩家视角
         ((-9, 2.5, -64), (3, 9, -80), 24),      # 1 斜侧
         ((5, 1.6, -75.5), (7.2, 3, -79), 30),   # 2 右门座铭牌近景
         ((0, 18, -56), (0, 14, -80), 14)]       # 3 远景（南墙内高处，看全立面 + 深井）
    m1_lib.render(S, PREV, f'm13_abyss', [V[VIEW]], res=(720, 480), lights=L)
    os.rename(f'{PREV}/m13_abyss_0.png', f'{PREV}/m13_abyss_v{VIEW}.png')
