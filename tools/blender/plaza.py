# 样板 A：正门广场（铺装、中轴大道、规则之泉石作、花坛绿篱、旗杆基座、南端大台阶与栏杆）——Blender 程序化
# 运行：blender -b --factory-startup --python plaza.py -- out.blend [facade.blend 作遮挡体]
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
from gk import *

A = Acc(); C = Acc()
def G(x, y, z): return T(x, -z, y)
def col(cx, cy, cz, sx, sy, sz):
    v, f = box(sx, sz, sy); C.add('COL', v, f, G(cx, cy, cz))
def slab(mat, x0, x1, z0, z1, y, h=0.06, c=0.01):
    v, f = cbox(x1 - x0, z1 - z0, h, c); A.add(mat, v, f, G((x0 + x1) / 2, y - h / 2, (z0 + z1) / 2))
def ring_seg(mat, r0, r1, a0, a1, y, h=0.05, cx=0.0, cz=30.0, n=6):
    """环形扇区石板（略带倒角的厚片）"""
    pts_o = [(cx + r1 * math.cos(a0 + (a1 - a0) * i / n), cz + r1 * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]
    pts_i = [(cx + r0 * math.cos(a0 + (a1 - a0) * i / n), cz + r0 * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]
    poly = pts_o + pts_i[::-1]
    # 2D (x, z游戏) → Blender (x, -z)；用 prism 沿 Blender z 拉伸
    v = [(x, -z, y - h) for x, z in poly] + [(x, -z, y) for x, z in poly]
    m = len(poly)
    f = [tuple(range(m, 2 * m)), tuple(range(m))[::-1]]
    for i in range(m):
        j = (i + 1) % m; f.append((i, j, m + j, m + i))
    A.add(mat, v, f)

def baluster(M, h=0.9):
    prof = [(0.09, 0), (0.09, 0.08), (0.07, 0.1), (0.06, 0.16), (0.1, 0.32), (0.11, 0.42), (0.08, 0.56), (0.045, 0.66), (0.06, 0.72), (0.045, 0.78), (0.07, 0.82), (0.07, h)]
    v, f = revolve(prof, 8); A.add('curb', v, f, M, smooth=True)

def balustrade(x0, z0, x1, z1, y, h=1.0, pitch=0.32, post_every=3.2):
    """石栏杆：底座 + 瓶式栏杆柱 + 扶手 + 每隔 post_every 一根方墩（带帽）"""
    d = Vector((x1 - x0, 0, z1 - z0)); L = d.length; dn = d.normalized()
    ang = math.atan2(-(z1 - z0), x1 - x0)
    Mb = G(x0, y, z0) @ RZ(ang)
    v, f = cbox(L, 0.42, 0.22, 0.03); A.add('curb', v, f, Mb @ T(L / 2, 0, 0.11))
    v, f = cbox(L + 0.1, 0.36, 0.14, 0.04); A.add('curb', v, f, Mb @ T(L / 2, 0, h - 0.07))
    n = int(L / pitch)
    for i in range(n):
        x = (i + 0.5) * L / n
        if abs((x % post_every) - 0) < pitch * 0.6 or abs((x % post_every) - post_every) < pitch * 0.6: continue
        baluster(Mb @ T(x, 0, 0.22), h - 0.36)
    k = int(L / post_every)
    for i in range(k + 1):
        x = i * L / max(1, k)
        v, f = cbox(0.46, 0.46, h + 0.1, 0.03); A.add('curb', v, f, Mb @ T(x, 0, (h + 0.1) / 2))
        v, f = cbox(0.56, 0.56, 0.1, 0.03); A.add('curb', v, f, Mb @ T(x, 0, h + 0.15))
    C.add('COL', *box(L, 0.4, h), Mb @ T(L / 2, 0, h / 2))

def hedge_box(cx, cz, sx, sz, h=1.05):
    v, f = cbox(sx, sz, h, 0.18); A.add('hedge', v, f, G(cx, h / 2 + 0.12, cz))
    col(cx, h / 2, cz, sx, h, sz)

def topiary(x, z, kind=0, s=1.0):
    if kind == 0:  # 圆锥
        v, f = revolve([(0.0, 0), (0.75 * s, 0.25 * s), (0.8 * s, 0.6 * s), (0.5 * s, 1.6 * s), (0.18 * s, 2.3 * s), (0.0, 2.5 * s)], 12); A.add('hedge', v, f, G(x, 0.12, z), smooth=True)
    else:  # 双球
        for zz, r in ((0.55, 0.55), (1.45, 0.38)):
            v, f = revolve([(r * math.sin(math.pi * i / 6), r - r * math.cos(math.pi * i / 6)) for i in range(7)], 12); A.add('hedge', v, f, G(x, 0.12 + zz - r, z), smooth=True)
    # 花岗岩方形树池
    v, f = cbox(1.9 * s, 1.9 * s, 0.3, 0.03); A.add('curb', v, f, G(x, 0.15, z))

def build():
    # ---------------- 铺装：大块花岗岩板（贴图 3 m 一块）----------------
    slab('paving', -48, 48, -5.6, 80.6, 0.012, h=0.04, c=0.0)
    # 中轴大道：深色抛光花岗岩 + 白大理石镶边 + 鎏金铜条
    slab('paveDark', -7, 7, 0.8, 80.4, 0.032, h=0.03)
    for s in (-1, 1):
        slab('whiteMarble', s * 7 - 0.6, s * 7 + 0.6, 0.8, 80.4, 0.034, h=0.03)
        slab('gold', s * 7.62 - 0.04, s * 7.62 + 0.04, 0.8, 80.4, 0.037, h=0.03, c=0.005)
        slab('curb', s * 8.9 - 0.25, s * 8.9 + 0.25, 0.8, 80.4, 0.04, h=0.05)  # 排水沟石沿
        slab('iron', s * 8.3 - 0.18, s * 8.3 + 0.18, 0.8, 80.4, 0.022, h=0.03, c=0.0)  # 铸铁排水箅子
    for z in range(4, 80, 4):
        if abs(z - 30) < 17: continue
        slab('gold', -6.4, 6.4, z - 0.03, z + 0.03, 0.036, h=0.02, c=0.003)
    # 大道菱形嵌花（每 8 m）：深色花岗岩底 + 白大理石菱 + 金边
    for z in range(6, 80, 8):
        if abs(z - 30) < 18: continue
        for r, mat, y in ((1.6, 'whiteMarble', 0.036), (1.15, 'paveDark', 0.038), (0.5, 'gold', 0.04)):
            pts = [(r, 0), (0, r), (-r, 0), (0, -r)]
            v = [(x, -(z + zz), y - 0.01) for x, zz in pts] + [(x, -(z + zz), y) for x, zz in pts]
            A.add(mat, v, [(4, 5, 6, 7), (3, 2, 1, 0), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)])
    # ---------------- 规则之泉外圈：三圈黑白放射拼花 + 金线圈 + 外圈台阶 ----------------
    for (r0, r1, n, off) in ((14.9, 15.9, 32, 0), (15.9, 17.1, 48, 0.5), (17.1, 18.3, 64, 0)):
        for k in range(n):
            a0 = (k + off) / n * TAU; a1 = (k + 1 + off) / n * TAU
            ring_seg('whiteMarble' if k % 2 else 'paveDark', r0 + 0.01, r1 - 0.01, a0 + 0.002, a1 - 0.002, 0.04, n=4)
        ring_seg('gold', r1 - 0.035, r1 + 0.035, 0, TAU, 0.042, n=160)
    ring_seg('whiteMarble', 18.3, 19.7, 0, TAU, 0.04, n=160)
    ring_seg('paveDark', 19.7, 22.2, 0, TAU, 0.036, n=160)
    ring_seg('gold', 20.33, 20.47, 0, TAU, 0.04, n=160)
    # ---------------- 规则之泉石作（半径与 three 端水面一致：外沿 13.4–14.9，二层盘 6.5，三层盘 3.2） ----------------
    Mf = G(0, 0, 30)
    # 外池壁：勒脚 + 束腰 + 凸圆线 + 压顶（内侧略收）
    prof = [(13.35, 0.1), (13.35, 0.9), (13.5, 1.0), (14.95, 1.0), (15.05, 0.93), (15.0, 0.86), (14.7, 0.8), (14.62, 0.62), (14.75, 0.5), (14.62, 0.36), (14.65, 0.22), (14.95, 0.15), (15.15, 0.06), (15.15, 0.0)]
    v, f = revolve(prof[::-1], 128); A.add('marble', v, f, Mf, smooth=True)
    for r, y in ((14.98, 0.97), (14.66, 0.44)):
        v, f = sweep(circ_prof(0.045, 6), [Vector((r * math.cos(TAU * i / 160), r * math.sin(TAU * i / 160), y)) for i in range(160)], closed=True); A.add('gold', v, f, Mf, smooth=True)
    # 池壁外侧 16 个兽首出水口（铜）位置的石托
    for i in range(16):
        a = TAU * i / 16
        v, f = cbox(0.5, 0.36, 0.42, 0.04); A.add('marble', v, f, Mf @ RZ(a) @ T(14.8, 0, 0.62))
    # 池底：深色石 + 中心铜字圈由 three 端贴图
    v, f = revolve([(13.4, 0.1), (0.0, 0.1)], 96); A.add('paveDark', v, f, Mf)
    # 中央基座 + 二层盘（花瓣形盘沿：16 瓣）
    prof2 = [(3.3, 0.1), (3.3, 0.85), (3.0, 0.95), (2.5, 1.15), (1.7, 1.35), (1.45, 1.6), (1.32, 2.3), (1.42, 2.55), (1.62, 2.7), (1.55, 2.85), (1.75, 3.0), (2.5, 3.25), (4.0, 3.42), (6.0, 3.52)]
    v, f = revolve(prof2, 64); A.add('marble', v, f, Mf, smooth=True)
    lip = []
    for i in range(161):
        a = TAU * i / 160; rr = 6.35 + 0.18 * abs(math.cos(8 * a))
        lip.append((a, rr))
    # 盘沿：按花瓣半径扫一圈厚唇
    pts = [Vector((rr * math.cos(a), rr * math.sin(a), 3.72)) for a, rr in lip[:-1]]
    v, f = sweep([(0.0, -0.22), (0.22, -0.12), (0.26, 0.05), (0.12, 0.2), (-0.25, 0.18), (-0.3, 0.0), (-0.12, -0.24)], pts, closed=True, up=(0, 0, 1)); A.add('marble', v, f, Mf, smooth=True)
    v, f = revolve([(6.0, 3.52), (6.3, 3.62), (6.3, 3.66), (5.9, 3.86), (0.0, 3.86)], 64); A.add('marble', v, f, Mf, smooth=True)
    # 二层盘下的卷叶托架（8 个）
    for i in range(8):
        a = TAU * i / 8 + TAU / 16
        Mc = Mf @ RZ(a)
        path = [Vector((1.5 + 3.2 * t, 0, 2.6 + 0.85 * math.sin(t * math.pi / 2) ** 0.7)) for t in [j / 8 for j in range(9)]]
        v, f = sweep(rect_prof(0.16, 0.2, 0.04), path, up=(0, 1, 0)); A.add('marble', v, f, Mc, smooth=True)
        v, f = leaf(0.45); A.add('gold', v, f, Mc @ T(1.55, 0, 2.55) @ RY(1.2), smooth=True)
    # 三层盘
    prof3 = [(1.05, 3.86), (0.78, 4.1), (0.7, 4.6), (0.82, 4.75), (0.7, 4.9), (0.72, 5.55), (0.95, 5.8), (1.3, 6.1), (2.4, 6.4), (3.05, 6.5), (3.25, 6.68), (3.2, 6.82), (2.9, 6.86), (0.0, 6.8)]
    v, f = revolve(prof3, 48); A.add('marble', v, f, Mf, smooth=True)
    # 南侧铭牌碑座
    v, f = cbox(1.7, 0.55, 1.0, 0.04); A.add('marble', v, f, G(0, 0.5, 45.4))
    v, f = cbox(1.9, 0.75, 0.12, 0.03); A.add('marble', v, f, G(0, 0.06, 45.4))
    col(0, 0.5, 45.4, 1.7, 1.0, 0.55)
    # ---------------- 花坛：花岗岩路缘 + 草坪 + 黄杨绿篱 + 造型树 ----------------
    for s in (-1, 1):
        for (z0, z1) in ((2, 22), (38, 56), (60, 72)):
            cx = s * 30; cz = (z0 + z1) / 2; L = z1 - z0
            slab('lawn', cx - 9, cx + 9, z0, z1, 0.13, h=0.1, c=0.0)
            for ex in (-1, 1):
                slab('curb', cx + ex * 9.6 - 0.2, cx + ex * 9.6 + 0.2, z0 - 0.8, z1 + 0.8, 0.22, h=0.2, c=0.03)
            for ez in (-1, 1):
                slab('curb', cx - 9.8, cx + 9.8, z0 + (z1 - z0) / 2 * (1 + ez) - 0.2 + ez * 0.6, z0 + (z1 - z0) / 2 * (1 + ez) + 0.2 + ez * 0.6, 0.22, h=0.2, c=0.03)
            # 绿篱（开口朝中轴）
            hedge_box(cx + s * 8.9, cz, 0.9, L, 1.1)
            for ez in (-1, 1):
                hedge_box(cx + s * 2.2, z0 + (L / 2) * (1 + ez) - ez * 0.45, 13.4, 0.9, 1.1)
            hedge_box(cx - s * 8.9, cz - L * 0.3, 0.9, L * 0.38, 0.8)
            hedge_box(cx - s * 8.9, cz + L * 0.3, 0.9, L * 0.38, 0.8)
            # 坛内：低矮绿篱十字 + 造型树
            hedge_box(cx, cz, 0.6, L - 4, 0.55)
            hedge_box(cx, cz, 12, 0.6, 0.55)
            for k, (dx, dz) in enumerate(((-4.5, -L / 4), (4.5, -L / 4), (-4.5, L / 4), (4.5, L / 4))):
                topiary(cx + dx, cz + dz, k % 2, 0.9)
    # ---------------- 旗杆基座（12 面局旗：x ±14.5，z 8…68）----------------
    for i in range(12):
        sx = -1 if i < 6 else 1; k = i % 6
        x = sx * 14.5; z = 8 + k * 12
        Mp = G(x, 0, z)
        v, f = cbox(1.7, 1.7, 0.25, 0.03); A.add('curb', v, f, Mp @ T(0, 0, 0.125))
        v, f = revolve([(0.78, 0.25), (0.78, 0.35), (0.66, 0.42), (0.62, 0.9), (0.7, 0.98), (0.7, 1.05), (0.2, 1.05)], 8, math.pi / 8, math.pi / 8 + TAU); A.add('marble', v, f, Mp)
        v, f = ngon_prism(0.72, 0.04, 8, math.pi / 8); A.add('gold', v, f, Mp @ T(0, 0, 0.9))
        col(x, 0.5, z, 1.4, 1.05, 1.4)
    # ---------------- 南端大台阶（20 级，宽 44，下到 y=-4）+ 两侧栏杆与跌水墙 ----------------
    for i in range(20):
        y = -0.1 - i * 0.2 + 0.1
        z = 81 + i * 0.6
        v, f = cbox(44, 0.64, 0.2, 0.02); A.add('steps', v, f, G(0, y - 0.1, z))
        v, f = box(43.98, 0.6, 0.2 + (19 - i) * 0.0); A.add('steps', v, f, G(0, y - 0.2 - 0.1, z + 0.0))
    for s in (-1, 1):
        # 台阶两侧颊墙（cheek wall）与栏杆
        al = math.atan2(4, 12.6)
        balustrade(s * 22.4, 80.6, s * 22.4, 93.2, 0.0, h=1.0)
    # 广场南缘栏杆（台阶两侧，x ±23…±48）
    for s in (-1, 1):
        balustrade(s * 25.6, 80.6, s * 48, 80.6, 0.0, h=1.0)
    # 大台阶两端石墩 + 铜灯座（灯由 three 放）
    for s in (-1, 1):
        for z in (80.6,):
            v, f = cbox(1.6, 1.6, 1.4, 0.04); A.add('curb', v, f, G(s * 23.0, 0.7, z))
            v, f = cbox(1.8, 1.8, 0.16, 0.04); A.add('curb', v, f, G(s * 23.0, 1.48, z))
            col(s * 23.0, 0.7, z, 1.6, 1.4, 1.6)
    # ---------------- 主楼前广场边缘：石凳基座与树池（沿两侧，x ±19.2） ----------------
    for z in (10, 24, 44, 52, 68):
        for s in (-1, 1):
            v, f = cbox(1.0, 3.0, 0.08, 0.02); A.add('paveDark', v, f, G(s * 19.6, 0.05, z))

def materials():
    alb = {'paving': (0.35, 0.34, 0.32), 'paveDark': (0.06, 0.06, 0.065), 'whiteMarble': (0.7, 0.7, 0.68), 'gold': (0.8, 0.6, 0.3), 'curb': (0.3, 0.3, 0.29), 'iron': (0.05, 0.05, 0.05),
           'lawn': (0.12, 0.2, 0.08), 'hedge': (0.06, 0.12, 0.05), 'marble': (0.04, 0.04, 0.045), 'steps': (0.05, 0.05, 0.055)}
    for m in bpy.data.materials:
        m.use_nodes = True; b = m.node_tree.nodes.get('Principled BSDF')
        if not b: continue
        b.inputs['Base Color'].default_value = (*alb.get(m.name, (0.2, 0.2, 0.2)), 1)

if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    out = argv[0] if argv else '/tmp/plaza.blend'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build()
    print('PLAZA tris', A.tris())
    sc = {'paving': 1 / 3.0, 'paveDark': 1 / 2.3, 'whiteMarble': 1 / 2.0, 'curb': 1 / 2.0, 'lawn': 1 / 4.0, 'hedge': 1 / 1.5, 'marble': 1 / 2.0, 'steps': 1 / 2.0, 'iron': 2.0, 'gold': 1.0}
    co = bpy.data.collections.new('hero'); bpy.context.scene.collection.children.link(co)
    A.build('P', co, sc)
    cc = bpy.data.collections.new('col'); bpy.context.scene.collection.children.link(cc)
    C.build('C', cc)
    materials()
    # 遮挡体：主楼（只参与烘焙，不导出）
    if len(argv) > 1 and os.path.exists(argv[1]):
        with bpy.data.libraries.load(argv[1]) as (src, dst):
            dst.objects = [n for n in src.objects if n.startswith('F_')]
        oc = bpy.data.collections.new('occluder'); bpy.context.scene.collection.children.link(oc)
        for o in dst.objects:
            if o: o.name = 'OCC_' + o.name; oc.objects.link(o)
    bpy.ops.wm.save_as_mainfile(filepath=out)
    print('SAVED', out)
