# 样板 A：主楼外观（正立面 + 双塔 + 次塔 + 两翼 + 中殿 + 后楼 + 主塔）——Blender 程序化建模
# 运行：blender -b --factory-startup --python facade.py -- out.blend
# 坐标：游戏 (x, y, z) → Blender (x, -z, y)。正立面朝游戏 +z（南，广场）= Blender -y。构件局部 -y = 朝外。
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector, Matrix
from gk import *

Y = 1.8  # 一层地坪

def G(x, y, z):
    """游戏坐标 → Blender 平移矩阵"""
    return T(x, -z, y)

FACE = {'S': RZ(0), 'E': RZ(math.pi / 2), 'N': RZ(math.pi), 'W': RZ(-math.pi / 2)}

A = Acc()        # 可见几何
C = Acc()        # 碰撞几何（粗盒）

def col(cx, cy, cz, sx, sy, sz):
    """碰撞盒（游戏坐标中心 + 尺寸 x/y/z）"""
    v, f = box(sx, sz, sy); C.add('COL', v, f, G(cx, cy, cz))

# ================================================================ 立面开间工具
def face_frame(cx, cz, w, d, face):
    """返回立面局部→世界矩阵：原点在该立面底边中点（地坪 y=Y），局部 x 沿立面向右（站在外面看），-y 朝外"""
    hw, hd = w / 2, d / 2
    if face == 'S': return G(cx, 0, cz + hd) @ FACE['S']
    if face == 'N': return G(cx, 0, cz - hd) @ FACE['N']
    if face == 'E': return G(cx + hw, 0, cz) @ FACE['E']
    if face == 'W': return G(cx - hw, 0, cz) @ FACE['W']

def window_bay(M, cx, zb, w, hs, wall_t, lights=2, orders=2, gold_line=True, rose=True):
    """在立面 M 上 x=cx 处做一扇窗：墙上开洞（由调用方的 wall_with_openings 负责）+ 窗花格 + 玻璃"""
    apex = tracery_window(A, 'trim', 'glass', w, hs, depth=wall_t, lights=lights, M=M @ T(cx, 0, zb), orders=orders, bar=0.13 if w < 2.5 else 0.16, rose=rose, lod=0 if rose else 1)
    # 券头罩（hood mould）+ 金线
    ap = pointed_arch(w + 0.9, 1.0, 14 if rose else 8, cx, zb + hs)
    v, f = sweep(rect_prof(0.16, 0.2, 0.03 if rose else 0), [Vector((cx - w / 2 - 0.45, -0.1, zb + hs - 0.3))] + to3(ap, -0.1) + [Vector((cx + w / 2 + 0.45, -0.1, zb + hs - 0.3))], up=(0, -1, 0))
    A.add('trim', v, f, M)
    if gold_line:
        ap2 = pointed_arch(w + 0.62, 1.0, 18, cx, zb + hs)
        v, f = sweep(rect_prof(0.035, 0.05), to3(ap2, -0.17), up=(0, -1, 0)); A.add('gold', v, f, M)
    # 券头罩两端的小头像托（label stops）
    for s in (-1, 1):
        v, f = cbox(0.24, 0.26, 0.3, 0.04); A.add('trim', v, f, M @ T(cx + s * (w / 2 + 0.45), -0.12, zb + hs - 0.42))
    return zb + hs + arch_apex(w)

def stage_face(M, w, z0, z1, kind, wall_t=1.0, n=1, lights=2, inset=0.0):
    """立面一层（z0..z1）：kind = window / belfry / blind / plain / tall"""
    H = z1 - z0
    ops = []
    if kind in ('window', 'belfry', 'tall'):
        cw = (w - 2 * inset) / n
        for i in range(n):
            cx = -w / 2 + inset + cw * (i + 0.5)
            ww = min(cw * 0.62, 3.6 if kind != 'belfry' else 2.2)
            apex_h = arch_apex(ww)
            hs = H - apex_h - 1.6
            zb = z0 + 0.9
            ops.append((cx, ww, hs, zb, 1.0))
        wall_with_openings(A, 'ashlar', -w / 2, w / 2, z0, z1, wall_t, ops, M)
        for (cx, ww, hs, zb, k) in ops:
            if kind == 'belfry':
                # 钟楼百叶窗：深色木百叶 + 两联尖券
                tracery_window(A, 'trim', 'louver', ww, hs, depth=wall_t, lights=2, M=M @ T(cx, 0, zb), orders=3, bar=0.14)
                for j in range(int(hs / 0.35)):
                    v, f = box(ww - 0.1, 0.06, 0.24); A.add('louver', v, f, M @ T(cx, 0.55, zb + 0.3 + j * 0.35) @ RX(0.6))
                ap = pointed_arch(ww + 0.9, 1.0, 18, cx, zb + hs)
                v, f = sweep(rect_prof(0.16, 0.2, 0.03), [Vector((cx - ww / 2 - 0.45, -0.1, zb + hs - 0.3))] + to3(ap, -0.1) + [Vector((cx + ww / 2 + 0.45, -0.1, zb + hs - 0.3))], up=(0, -1, 0)); A.add('trim', v, f, M)
            else:
                window_bay(M, cx, zb, ww, hs, wall_t, lights=lights if ww > 1.8 else 1 if ww < 1.2 else 2, orders=3 if kind == 'tall' else 2)
    else:
        v, f = box(w, wall_t, H); A.add('ashlar', v, f, M @ T(0, wall_t / 2, (z0 + z1) / 2))
        if kind == 'blind':
            nb = max(2, int(w / 1.6))
            blind_arcade(A, 'trim', -w / 2 + 0.3, w / 2 - 0.3, z0 + 0.6, H - 1.2, nb, M @ T(0, -0.01, 0), depth=0.14, mat2='ashlarDeep')
    return ops

# ================================================================ 塔
def tower(cx, cz, w, h, spire_h, stages, y0=Y, buttress_d=1.6, pin=True, spire_r=None, faces=('S', 'E', 'N', 'W'), parapet_on=True, clock=False):
    """方塔：四面分层（stages=[(高, kind, n)]）+ 四角双向角扶壁 + 檐口 + 镂空女儿墙 + 八角尖塔"""
    col(cx, y0 + h / 2, cz, w, h, w)
    # 塔芯（封闭体，窗洞后面不透）
    v, f = box(w - 2.4, w - 2.4, h); A.add('ashlarDeep', v, f, G(cx, y0 + h / 2, cz))
    for fc in faces:
        M = face_frame(cx, cz, w, w, fc) @ T(0, 0, y0)
        z = 0
        for (sh, kind, n) in stages:
            stage_face(M, w - 2.0, z, z + sh, kind, wall_t=1.1, n=n)
            # 层间腰线
            string_course(A, 'trim', -w / 2 + 0.6, w / 2 - 0.6, z + sh - 0.15, M @ T(0, -0.02, 0))
            z += sh
        # 塔身角部：与扶壁之间的墙垛
        for s in (-1, 1):
            v, f = box(1.0, 1.1, h); A.add('ashlar', v, f, M @ T(s * (w / 2 - 0.5), 0.55, h / 2))
        # 檐口
        cornice(A, 'trim', -w / 2 - 0.2, w / 2 + 0.2, h - 0.2, M @ T(0, -0.05, 0), h=0.9, d=0.6)
        if parapet_on:
            parapet(A, 'trim', -w / 2, w / 2, h + 0.55, M @ T(0, -0.25, 0), h=1.3)
        # 角扶壁（每面两侧各一，垂直该面）
        for s in (-1, 1):
            buttress(A, 'ashlar', 1.5, buttress_d, h - 1.0, M @ T(s * (w / 2 - 0.9), 0.0, 0) @ RZ(math.pi), stages=4, pin_h=None)
        # 滴水兽（gargoyle 落位由 three 端放 GLB；这里留石托）
        for s in (-1, 1):
            v, f = cbox(0.5, 1.4, 0.5, 0.05); A.add('trim', v, f, M @ T(s * (w / 2 - 0.9), -buttress_d * 0.5 - 0.4, h - 1.6))
        if clock and fc == 'S':
            pass
    # 四角小尖塔（扶壁顶）
    if pin:
        for sx in (-1, 1):
            for sz in (-1, 1):
                pinnacle(A, 'trim', 1.5, 9.0, G(cx + sx * (w / 2 - 0.4), y0 + h - 0.2, cz + sz * (w / 2 - 0.4)))
    # 尖塔
    if spire_h:
        r = spire_r or w * 0.40
        # 八角基座（与女儿墙同高）
        v, f = ngon_prism(r * 1.02, 2.2, 8, math.pi / 8); A.add('ashlar', v, f, G(cx, y0 + h, cz))
        spire(A, 'slate', r, spire_h, G(cx, y0 + h + 2.2, cz), mat_gold='gold', mat_trim='trim', crockets=True, lucarnes=True, bands=(0.22, 0.45, 0.68, 0.86))

# ================================================================ 正立面中央门楼
def portal(M, w, hs, orders, depth_per=0.55):
    """主门洞：多重退缩券（每重：门柱 + 柱头 + 券面线脚），门柱间立雕像托座与华盖，券内鼓室，门楣，山花（wimperg）。
    M 原点：门洞底边中点（地坪），-y 朝外。门洞本身（w × hs + 尖拱）保持通行。返回门廊外缘宽度。"""
    D = orders * depth_per
    for k in range(orders + 1):
        wi = w + k * 1.0          # 本重券的内宽
        yk = -k * depth_per + 0.0  # 本重的外表面位置（越外越 -y）
        # 门柱（每侧）
        if k > 0:
            for s in (-1, 1):
                x = s * (wi / 2 - 0.22)
                column(A, 'marble', 0.2, hs - 0.1, M @ T(x, yk + depth_per * 0.45, 0.0), seg=12, mat_cap='trim')
                # 雕像托座 + 华盖（雕像本体由 three 放 GLB）
                v, f = cbox(0.62, 0.62, 0.32, 0.04); A.add('trim', v, f, M @ T(x, yk + depth_per * 0.15 - 0.25, 2.2))
                v, f = ngon_prism(0.34, 0.5, 8, math.pi / 8); A.add('trim', v, f, M @ T(x, yk - 0.1, 1.7))
                pinnacle(A, 'trim', 0.55, 1.6, M @ T(x, yk - 0.1, 5.15), crockets=True)
                v, f = cbox(0.7, 0.7, 0.2, 0.03); A.add('trim', v, f, M @ T(x, yk - 0.1, 5.05))
            # 门柱间的退台墙（splay）
            for s in (-1, 1):
                v, f = cbox(0.5, depth_per, hs, 0.02); A.add('ashlar', v, f, M @ T(s * (wi / 2 + 0.25), yk + depth_per / 2, hs / 2))
        # 券面：圆棍线脚（每重）
        a = pointed_arch(wi, 1.0, 26, 0, hs)
        prof = [(px * 1.0, py) for px, py in rect_prof(0.5, depth_per * 0.9, 0.06)]
        v, f = sweep(prof, to3(a, yk + depth_per * 0.45), up=(0, -1, 0)); A.add('trim' if k % 2 else 'ashlar', v, f, M)
        # 圆棍 roll
        a2 = pointed_arch(wi + 0.02, 1.0, 26, 0, hs)
        v, f = sweep(circ_prof(0.13, 10), to3(a2, yk + 0.06), up=(0, -1, 0)); A.add('trim', v, f, M, smooth=True)
        if k % 2 == 0 and k > 0:
            # 券面卷叶带（每隔一重）
            for i in range(2, len(a2) - 2, 2):
                x, z = a2[i]
                v, f = leaf(0.32); A.add('trim', v, f, M @ T(x, yk - 0.05, z) @ RY(math.atan2(x, max(0.1, z - hs)) if z > hs else 0) @ RX(-1.2), smooth=True)
        if k == orders:
            a3 = pointed_arch(wi + 0.5, 1.0, 26, 0, hs)
            v, f = sweep(rect_prof(0.06, 0.06), to3(a3, yk - 0.02), up=(0, -1, 0)); A.add('gold', v, f, M)
    outer = w + orders * 1.0 + 1.0
    # 门楣（lintel）+ 鼓室（tympanum）
    v, f = cbox(w + 0.4, 0.7, 0.9, 0.05); A.add('trim', v, f, M @ T(0, 0.35, hs + 0.45 - 0.9))
    v, f = cbox(w + 0.1, 0.05, 0.12, 0.01); A.add('gold', v, f, M @ T(0, -0.02, hs - 0.2))
    tym = [(-w / 2, hs - 0.0)] + pointed_arch(w, 1.0, 22, 0, hs)[1:-1] + [(w / 2, hs)]
    v, f = prism(tym, 0.4, 0.3); A.add('marbleDark', v, f, M)
    # 鼓室内两圈浅浮雕边框
    for sc in (0.86, 0.7):
        ww = w * sc
        a = pointed_arch(ww, 1.0, 20, 0, hs + 0.15)
        v, f = sweep(rect_prof(0.1, 0.12, 0.02), [Vector((-ww / 2, 0.28, hs + 0.15))] + to3(a, 0.28) + [Vector((ww / 2, 0.28, hs + 0.15))], up=(0, -1, 0)); A.add('gold' if sc < 0.8 else 'trim', v, f, M)
    # 门廊山花（wimperg）：外缘宽 outer，高 outer*0.95，内嵌三叶尖券镂空
    gw = outer + 0.6; gh = gw * 1.05
    # 镂空山花：只有两条斜压顶（卷叶）+ 顶饰 + 内部花格，透过它能看到后面的券面
    gz = hs + 0.6
    Mg = M @ T(0, -D - 0.35, gz)
    for s in (-1, 1):
        path = [Vector((s * gw / 2, 0, 0)), Vector((0, 0, gh))]
        v, f = sweep(rect_prof(0.42, 0.5, 0.05), path, up=(0, -1, 0)); A.add('trim', v, f, Mg)
        path = [Vector((s * (gw / 2 - 0.32), -0.27, 0.2)), Vector((0, -0.27, gh - 0.35))]
        v, f = sweep(rect_prof(0.05, 0.05), path, up=(0, -1, 0)); A.add('gold', v, f, Mg)
        L = math.hypot(gw / 2, gh); nk = int(L / 0.85)
        for k in range(1, nk):
            t = k / nk
            v, f = leaf(0.42); A.add('trim', v, f, Mg @ T(s * (gw / 2) * (1 - t) + s * 0.18, -0.05, gh * t + 0.22) @ RY(s * 0.5) @ RX(-0.5), smooth=True)
    finial(A, 'gold', 1.0, Mg @ T(0, 0, gh - 0.1))
    # 内部花格：中央三叶圆窗 + 两侧小尖券（均为镂空棂条）
    fz = gh * 0.62
    v, f = sweep(rect_prof(0.16, 0.34), to3(circle2(gw * 0.11, 28, 0, fz)), closed=True, up=(0, -1, 0)); A.add('trim', v, f, Mg)
    v, f = sweep(rect_prof(0.1, 0.28), to3(foil(gw * 0.095, 3, 36, 0, fz, math.pi / 2, 0.42)), closed=True, up=(0, -1, 0)); A.add('gold', v, f, Mg)
    for s in (-1, 1):
        cx = s * gw * 0.17
        ap = pointed_arch(gw * 0.12, 1.0, 8, cx, gh * 0.3)
        v, f = sweep(rect_prof(0.12, 0.28), [Vector((cx - gw * 0.06, 0, gh * 0.12))] + to3(ap) + [Vector((cx + gw * 0.06, 0, gh * 0.12))], up=(0, -1, 0)); A.add('trim', v, f, Mg)
        # 斜边与花格之间的连接棂
        v, f = sweep(rect_prof(0.12, 0.28), [Vector((cx, 0, gh * 0.3 + arch_apex(gw * 0.12))), Vector((s * gw * 0.08, 0, fz - gw * 0.08))], up=(0, -1, 0)); A.add('trim', v, f, Mg)
    # 门廊两侧墩柱（扶壁 + 小尖塔）
    for s in (-1, 1):
        x = s * (outer / 2 + 0.5)
        buttress(A, 'ashlar', 1.6, D + 1.4, gz + gh * 0.55, M @ T(x, 0.6, 0) @ RZ(math.pi), stages=3)
        pinnacle(A, 'trim', 1.3, 7.5, M @ T(x, -D * 0.6, gz + gh * 0.55))
        # 墩柱正面壁龛（放雕像）
        v, f = cbox(0.9, 0.6, 0.3, 0.04); A.add('trim', v, f, M @ T(x, -D - 0.75, 3.4))
        pinnacle(A, 'trim', 0.9, 2.6, M @ T(x, -D - 0.75, 6.4))
    return outer, D

def rose_window(M, r, cz, petals=16):
    """玫瑰窗：外环 + 两圈辐射花格（尖券花瓣）+ 中心圆盘（局徽由 three 放）+ 玻璃"""
    # 外框线脚（多重）
    for k, rr in enumerate((r + 0.55, r + 0.3, r)):
        v, f = sweep(rect_prof(0.26, 0.42 - k * 0.08, 0.04), to3(circle2(rr, 96, 0, cz), -0.1 + k * 0.12), closed=True, up=(0, -1, 0)); A.add('trim', v, f, M)
    v, f = sweep(rect_prof(0.06, 0.06), to3(circle2(r + 0.72, 96, 0, cz), -0.25), closed=True, up=(0, -1, 0)); A.add('gold', v, f, M)
    # 中心圆
    rc = r * 0.26
    v, f = sweep(rect_prof(0.2, 0.36, 0.03), to3(circle2(rc, 48, 0, cz), 0.1), closed=True, up=(0, -1, 0)); A.add('trim', v, f, M)
    # 内圈辐条 + 尖券花瓣
    r1 = r * 0.62
    for i in range(petals):
        a = TAU * i / petals
        p0 = Vector((math.cos(a) * rc, 0.1, cz + math.sin(a) * rc)); p1 = Vector((math.cos(a) * r, 0.1, cz + math.sin(a) * r))
        v, f = sweep(rect_prof(0.14, 0.3, 0.03), [p0, p1], up=(0, -1, 0)); A.add('trim', v, f, M)
        # 花瓣：辐条之间的尖券（顶点朝外）
        a0, a1 = TAU * (i - 0.5) / petals, TAU * (i + 0.5) / petals
    for i in range(petals):
        am = TAU * (i + 0.5) / petals
        # 在 r1 处，相邻辐条间宽度
        wpet = 2 * r1 * math.sin(math.pi / petals) * 0.92
        loc = pointed_arch(wpet, 1.0, 10, 0, 0)
        pts = []
        for x, z in loc:
            rr = r * 0.34 + z * 1.0 + (r1 - r * 0.34) * 0.0
            ang = am + x / max(0.5, (r * 0.34 + z)) if False else am + math.atan2(x, r * 0.36 + z * 1.6)
            dist = r * 0.36 + z * 1.6 * (r1 - r * 0.36) / max(1e-3, arch_apex(wpet) * 1.6) if False else r * 0.36 + (z / max(1e-3, arch_apex(wpet))) * (r1 - r * 0.36)
            pts.append(Vector((math.sin(ang) * dist * 0 + math.cos(am) * dist + (-math.sin(am)) * x, 0.1, cz + math.sin(am) * dist + math.cos(am) * x)))
        v, f = sweep(rect_prof(0.09, 0.24, 0.02), pts, up=(0, -1, 0)); A.add('trim', v, f, M)
        # 外圈：每格一个四叶圆
        rr = (r - r1) * 0.42
        cxp, czp = math.cos(am) * (r1 + (r - r1) * 0.5), math.sin(am) * (r1 + (r - r1) * 0.5)
        v, f = sweep(rect_prof(0.08, 0.22, 0.02), to3(circle2(rr, 20, cxp, cz + czp), 0.1), closed=True, up=(0, -1, 0)); A.add('trim', v, f, M)
        v, f = sweep(rect_prof(0.05, 0.18, 0.01), to3(foil(rr * 0.85, 4, 32, cxp, cz + czp, am, 0.4), 0.1), closed=True, up=(0, -1, 0)); A.add('trim', v, f, M)
    v, f = sweep(rect_prof(0.12, 0.28, 0.03), to3(circle2(r1, 80, 0, cz), 0.1), closed=True, up=(0, -1, 0)); A.add('trim', v, f, M)
    # 玻璃
    gv = [(x, 0.32, z) for x, z in circle2(r, 64, 0, cz)]
    A.add('glass', gv, [tuple(range(len(gv)))[::-1]], M)

def central_block():
    """中央门楼：x ±14，正面 z=-5（游戏），墙高 43，上加山墙"""
    W = 28.0; Hc = 43.0; front_gz = -5.0
    M = G(0, Y, front_gz)  # 正面底边中点，-y 朝外（游戏 +z）
    col(0, Y + Hc / 2, -6.0, W, Hc, 2.0)
    # ---- 一层：主门洞（墙开洞） ----
    DW, DH = 7.0, 9.0
    outer, D = 0, 0
    # 墙体：门洞两侧与上方（门洞为尖拱，拱脚 9）
    wall_with_openings(A, 'ashlar', -W / 2, W / 2, 0, 18.0, 1.6, [(0, DW, DH, 0.0, 1.0)], M)
    outer, D = portal(M, DW, DH, orders=5)
    # 门洞两侧碰撞（门洞保持可通行）
    for s in (-1, 1): col(s * (DW / 2 + (W / 2 - DW / 2) / 2), Y + 9, -5.8, W / 2 - DW / 2, 18, 1.6)
    col(0, Y + 18 - (18 - DH - 6) / 2, -5.8, DW, 18 - DH - 6, 1.6)
    # 门廊外凸墙体（门廊两侧实墙，承托退缩券）
    # 一层两侧盲拱 + 雕像壁龛（门廊外）
    for s in (-1, 1):
        for k in range(2):
            x = s * (outer / 2 + 2.4 + k * 2.2)
            ap = opening_poly(1.5, 2.6, 1.0, 10, x, 2.0)
            v = [(px, 0.25, pz) for px, pz in ap]; A.add('ashlarDeep', v, [tuple(range(len(v)))], M)
            reveal(A, 'ashlar', 1.5, 2.6, 0.25, M @ T(x, 0, 2.0))
            ap2 = pointed_arch(1.9, 1.0, 12, x, 4.6)
            v, f = sweep(rect_prof(0.14, 0.2, 0.03), [Vector((x - 0.95, -0.05, 2.0))] + to3(ap2, -0.05) + [Vector((x + 0.95, -0.05, 2.0))], up=(0, -1, 0)); A.add('trim', v, f, M)
            v, f = cbox(1.5, 0.7, 0.3, 0.04); A.add('trim', v, f, M @ T(x, -0.1, 1.85))
            gable(A, 'trim', 2.2, 1.8, M @ T(x, -0.2, 4.6 + arch_apex(1.9) * 0.4), t=0.25, crockets=True)
    # 勒脚（底座线脚，绕正面）
    v, f = sweep([(0, 0), (0.45, 0), (0.45, 0.5), (0.3, 0.62), (0.3, 0.9), (0.15, 1.05), (0, 1.05)], [Vector((-W / 2 - 1.2, -0.0, 0)), Vector((-outer / 2 - 1.3, 0, 0))], up=(0, -1, 0))
    # ---- 二层：列王廊（gallery of kings）z 18..24 ----
    string_course(A, 'trim', -W / 2, W / 2, 17.85, M @ T(0, -0.02, 0), h=0.4, d=0.4)
    v, f = box(W, 1.6, 6.0); A.add('ashlar', v, f, M @ T(0, 0.8, 21))
    ng = 11
    for i in range(ng):
        x = -W / 2 + 1.27 + i * (W - 2.54) / (ng - 1)
        # 壁龛：尖券凹入 + 两侧小柱 + 华盖
        ap = opening_poly(1.5, 3.4, 1.0, 10, x, 18.5)
        v = [(px, 0.55, pz) for px, pz in ap]; A.add('ashlarDeep', v, [tuple(range(len(v)))], M)
        reveal(A, 'ashlar', 1.5, 3.4, 0.55, M @ T(x, 0, 18.5))
        for s in (-1, 1): column(A, 'marble', 0.09, 4.4, M @ T(x + s * 0.88, -0.1, 18.5), seg=8, mat_cap='trim')
        ap2 = pointed_arch(1.9, 1.0, 12, x, 22.9)
        v, f = sweep(circ_prof(0.09, 8), to3(ap2, -0.1), up=(0, -1, 0)); A.add('trim', v, f, M, smooth=True)
        gable(A, 'trim', 1.9, 1.5, M @ T(x, -0.15, 22.9 + arch_apex(1.9) * 0.55), t=0.2, crockets=False)
        v, f = cbox(1.1, 0.5, 0.22, 0.03); A.add('trim', v, f, M @ T(x, 0.3, 18.6))
    parapet(A, 'trim', -W / 2, W / 2, 24.3, M @ T(0, -0.15, 0), h=1.1)
    # ---- 三层：文字带（z 27.4..31.0，游戏 Y+29.2 中心）+ 玫瑰窗 ----
    v, f = box(W, 1.5, 43 - 25.4); A.add('ashlar', v, f, M @ T(0, 0.75 + 0.4, 25.4 + (43 - 25.4) / 2))
    # 文字带：黑色抛光石板 + 金框（文字由 three 贴）
    tb_c = 31.2 - 0.0
    v, f = cbox(17.2, 0.35, 3.7, 0.05); A.add('marbleDark', v, f, M @ T(0, 0.25, tb_c))
    for dz in (-1.92, 1.92):
        v, f = cbox(17.6, 0.12, 0.14, 0.02); A.add('gold', v, f, M @ T(0, 0.04, tb_c + dz))
    for dx in (-8.72, 8.72):
        v, f = cbox(0.14, 0.12, 3.98, 0.02); A.add('gold', v, f, M @ T(dx, 0.04, tb_c))
    # 文字带两侧：双尖窗（三层）
    for s in (-1, 1):
        cx = s * 11.2
        wall_patch = None
        ap = opening_poly(2.0, 5.2, 1.0, 14, cx, 27.2)
        v = [(px, 1.0, pz) for px, pz in ap]; A.add('glass', v, [tuple(range(len(v)))], M)
        tracery_window(A, 'trim', 'glass', 2.0, 5.2, depth=1.0, lights=2, M=M @ T(cx, 0.3, 27.2), orders=2, bar=0.12)
    # 玫瑰窗（中心 37.6，r 4.3）：外方框 + 拱肩三角盲花格
    rose_window(M @ T(0, 0.35, 0), 4.3, 37.6)
    v, f = cbox(10.8, 0.3, 0.3, 0.04); A.add('trim', v, f, M @ T(0, 0.0, 32.6))
    # ---- 檐口 + 镂空女儿墙 ----
    cornice(A, 'trim', -W / 2 - 0.3, W / 2 + 0.3, Hc - 0.2, M @ T(0, -0.0, 0), h=1.0, d=0.75)
    parapet(A, 'trim', -W / 2, W / 2, Hc + 0.6, M @ T(0, -0.3, 0), h=1.3)
    # ---- 山墙（z 43..56）：盲窗 + 小玫瑰 + 顶部尖饰 ----
    tri = [(-W / 2 + 0.8, 0), (W / 2 - 0.8, 0), (0, 13.2)]
    v, f = prism(tri, 1.4, 0.6); A.add('ashlar', v, f, M @ T(0, 0, Hc + 1.9))
    for s in (-1, 1):
        path = [Vector((s * (W / 2 - 0.4), 0.4, Hc + 1.8)), Vector((0, 0.4, Hc + 1.9 + 13.6))]
        v, f = sweep(rect_prof(0.5, 0.35, 0.04), path, up=(0, -1, 0)); A.add('trim', v, f, M)
        for k in range(1, 12):
            t = k / 12
            v, f = leaf(0.5); A.add('trim', v, f, M @ T(s * (W / 2 - 0.4) * (1 - t), 0.3, Hc + 2.2 + 13.6 * t) @ RY(s * 0.5) @ RX(-0.4), smooth=True)
    for k in (-1, 0, 1):
        hh = 5.4 if k == 0 else 4.4
        ap = opening_poly(1.3, hh, 1.0, 12, k * 2.3, Hc + 2.6 + (0 if k == 0 else 0.4))
        v = [(px, 0.55, pz) for px, pz in ap]; A.add('glass', v, [tuple(range(len(v)))], M)
        reveal(A, 'ashlar', 1.3, hh, 0.55, M @ T(k * 2.3, 0, Hc + 2.6 + (0 if k == 0 else 0.4)))
        tracery_window(A, 'trim', 'glass', 1.3, hh, depth=0.6, lights=1, M=M @ T(k * 2.3, -0.02, Hc + 2.6 + (0 if k == 0 else 0.4)), orders=1, bar=0.1, glass_y=0.5)
    pinnacle(A, 'trim', 1.2, 6.5, M @ T(0, 0.9, Hc + 1.9 + 12.6))
    # 门楼屋顶（双坡石板瓦，z 43..56，纵深 25）
    roof(0, -17.5, 29.4, 25, Y + Hc, 13.0, ridge_gold=True)

def roof(cx, cz, w, d, y0, h, ridge_gold=True, dormers=0, yaw=0):
    """双坡屋顶（石板瓦）+ 屋脊金色镂空脊饰 + 可选老虎窗。游戏坐标，屋脊沿游戏 z（yaw=0）或 x（yaw=π/2）"""
    Mr = G(cx, y0, cz) @ RZ(yaw)
    # 截面在 Blender xz（x 横向），沿 y 拉伸 d
    tri = [(-w / 2 - 0.5, -0.3), (w / 2 + 0.5, -0.3), (w / 2 + 0.5, 0.0), (0, h), (-w / 2 - 0.5, 0.0)]
    v, f = prism(tri, d, -d / 2); A.add('slate', v, f, Mr)
    # 屋脊：铅皮脊 + 金色脊饰（每 1.2m 一枚鸢尾花）
    v, f = sweep(rect_prof(0.35, 0.25, 0.05), [Vector((0, -d / 2, h + 0.05)), Vector((0, d / 2, h + 0.05))], up=(0, 0, 1)); A.add('lead', v, f, Mr)
    if ridge_gold:
        n = int(d / 1.2)
        for i in range(n):
            yy = -d / 2 + 0.6 + i * (d - 1.2) / max(1, n - 1)
            finial(A, 'gold', 0.7, Mr @ T(0, yy, h + 0.15))
        v, f = sweep(rect_prof(0.06, 0.06), [Vector((0, -d / 2, h + 0.35)), Vector((0, d / 2, h + 0.35))], up=(0, 0, 1)); A.add('gold', v, f, Mr)
    # 檐沟
    for s in (-1, 1):
        v, f = sweep(rect_prof(0.3, 0.25, 0.04), [Vector((s * (w / 2 + 0.3), -d / 2, 0.05)), Vector((s * (w / 2 + 0.3), d / 2, 0.05))], up=(0, 0, 1)); A.add('lead', v, f, Mr)
    for k in range(dormers):
        yy = -d / 2 + d * (k + 0.5) / dormers
        for s in (-1, 1):
            Md = Mr @ T(s * w * 0.22, yy, h * 0.28) @ RZ(-s * math.pi / 2)
            v, f = cbox(1.6, 1.6, 2.4, 0.03); A.add('ashlar', v, f, Md @ T(0, 0.4, 1.2))
            gable(A, 'trim', 2.0, 1.6, Md @ T(0, -0.42, 2.4), t=0.3, crockets=False)
            ap = opening_poly(0.9, 1.4, 1.0, 8, 0, 0.4)
            vv = [(px, -0.41, pz) for px, pz in ap]; A.add('glass', vv, [tuple(range(len(vv)))], Md)

# ================================================================ 开间墙（两翼、中殿、后楼）
def bay_wall(cx, cz, length, height, bays, face, y0=Y, tiers=2, wall_t=1.2, depth=None, pinnacles=True, buttress_d=1.5, parapet_on=True, low_detail=False):
    """开间墙：每开间一扇（或上下两层）尖窗，开间之间扶壁 + 小尖塔，檐口 + 女儿墙。face = 墙朝向"""
    M = face_frame(cx, cz, length if face in 'SN' else (depth or 1), (depth or 1) if face in 'SN' else length, face) @ T(0, 0, y0)
    L = length; bw = L / bays
    # 勒脚
    v, f = cbox(L + 0.4, 1.0, 1.2, 0.06); A.add('plinth', v, f, M @ T(0, 0.2, 0.6))
    th = height / tiers
    for t in range(tiers):
        z0, z1 = t * th, (t + 1) * th
        ops = []
        for i in range(bays):
            x = -L / 2 + bw * (i + 0.5)
            ww = min(bw * 0.5, 3.2)
            hs = th - arch_apex(ww) - 2.0
            ops.append((x, ww, hs, z0 + 1.2, 1.0))
        wall_with_openings(A, 'ashlar', -L / 2, L / 2, z0, z1, wall_t, ops, M)
        for (x, ww, hs, zb, k) in ops:
            window_bay(M, x, zb, ww, hs, wall_t, lights=2 if ww > 1.6 else 1, orders=1 if low_detail else 2, gold_line=not low_detail, rose=not low_detail)
        if t < tiers - 1:
            string_course(A, 'trim', -L / 2, L / 2, z1 - 0.1, M @ T(0, -0.02, 0))
    # 扶壁
    for i in range(bays + 1):
        x = -L / 2 + bw * i
        buttress(A, 'ashlar', 1.2, buttress_d, height - 1.2, M @ T(x, 0, 0) @ RZ(math.pi), stages=3)
        if pinnacles:
            pinnacle(A, 'trim', 1.0, 5.5, M @ T(x, -buttress_d * 0.35, height + 0.2), crockets=not low_detail)
    cornice(A, 'trim', -L / 2 - 0.2, L / 2 + 0.2, height - 0.2, M, h=0.8, d=0.6, dentils=not low_detail)
    if parapet_on:
        parapet(A, 'trim', -L / 2, L / 2, height + 0.5, M @ T(0, -0.25, 0), h=1.1)

def solid(cx, cy, cz, sx, sy, sz, mat='ashlar', collide=True):
    v, f = box(sx, sz, sy); A.add(mat, v, f, G(cx, cy, cz))
    if collide: col(cx, cy, cz, sx, sy, sz)

def flyer(x0, x1, gz, y_low, y_high, sx):
    """飞扶壁：墩柱在 x0（翼楼屋顶上），落到中殿墙 x1，高度 y_low→y_high（游戏坐标），sx=±1"""
    Mf = G(x0, 0, gz) @ RZ(math.pi / 2 if sx > 0 else -math.pi / 2)
    L = abs(x1 - x0)
    flying_buttress(A, 'trim', (0, y_low), (L, y_high), 0.8, Mf, w=0.7)

def build_all():
    # ---------------- 中央门楼 ----------------
    central_block()
    # 门楼侧墙 + 后部体量（与双塔之间的连接墙）
    for s in (-1, 1):
        solid(s * 14.75, Y + 21.5, -17.5, 1.5, 43, 25)
    # ---------------- 正面双塔 x ±22 ----------------
    stages = [(17.8, 'blind', 1), (16.0, 'tall', 1), (14.0, 'belfry', 2), (12.2, 'window', 3)]
    for s in (-1, 1):
        tower(s * 22, -13, 13, 60, 44, stages)
    # ---------------- 次塔 x ±36 ----------------
    st2 = [(14, 'blind', 1), (14, 'window', 1), (14, 'belfry', 1)]
    for s in (-1, 1):
        tower(s * 36, -12, 8, 42, 26, st2, buttress_d=1.1)
    # ---------------- 两翼：正面（x ±40…±62，z -8），外侧立面（x ±62），屋顶 ----------------
    WH = 22
    for s in (-1, 1):
        bay_wall(s * 51, -9, 22, WH, 4, 'S', depth=2)
        solid(s * 51, Y + WH / 2, -10, 22, WH, 2, 'ashlarDeep')
        bay_wall(s * 62, -44, 72, WH, 9, 'E' if s > 0 else 'W', depth=2, low_detail=True)
        solid(s * 61.5, Y + WH / 2, -44, 1.6, WH, 72, 'ashlarDeep')
        # 塔与翼之间的连接墙（x ±28.5…±32）
        solid(s * 30.25, Y + WH / 2, -9.5, 3.5, WH, 3, 'ashlar')
        roof(s * 51, -44, 21, 72, Y + WH, 9.0, dormers=4)
        roof(s * 29, -44, 20, 72, Y + WH, 7.0, dormers=0)
        solid(s * 40, Y + WH - 0.3, -44, 44, 0.6, 72, 'lead', collide=False)
        # 翼楼内侧墙（面向中殿，翼楼屋顶以上是中殿高侧窗）
    # ---------------- 中殿：x ±18.6 高侧墙 z -30…-80，高 36 ----------------
    NH = 36
    for s in (-1, 1):
        bay_wall(s * 18.6, -55, 50, NH - WH, 6, 'E' if s > 0 else 'W', y0=Y + WH, tiers=1, depth=1.2, low_detail=True, buttress_d=0.9)
        solid(s * 18.0, Y + NH / 2, -55, 1.2, NH, 50, 'ashlarDeep')
        for k in range(6):
            z = -34 - k * 8.4
            solid(s * 25.5, Y + WH + 5, z, 1.4, 10, 1.4, 'ashlar', collide=False)
            pinnacle(A, 'trim', 1.4, 7, G(s * 25.5, Y + WH + 10, z))
            flyer(s * 25.5, s * 19.4, z, Y + WH + 6.5, Y + NH - 3, s)
    roof(0, -55, 37.2, 50, Y + NH, 15, dormers=3)
    # 交叉处小尖塔（飞檐塔 flèche）
    v, f = ngon_prism(2.4, 6, 8, math.pi / 8); A.add('trim', v, f, G(0, Y + NH + 14.6, -38))
    spire(A, 'lead', 2.4, 18, G(0, Y + NH + 20.6, -38), mat_trim='gold', lucarnes=False, bands=(0.3, 0.6))
    # ---------------- 后楼（z -80…-120，x ±62，高 28） ----------------
    RH = 28
    bay_wall(0, -120, 124, RH, 14, 'N', depth=2, low_detail=True)
    for s in (-1, 1):
        bay_wall(s * 62, -100, 40, RH, 5, 'E' if s > 0 else 'W', depth=2, low_detail=True)
        bay_wall(s * 40, -80, 44, RH - WH, 5, 'S', y0=Y + WH, tiers=1, depth=1.0, low_detail=True)
        roof(s * 40, -100, 40, 38, Y + RH, 10, yaw=math.pi / 2, dormers=0)
    solid(0, Y + RH / 2, -100, 122, RH, 38, 'ashlarDeep')
    # ---------------- 主塔（中央 z -98，28 宽 92 高 + 收分 21×30 + 八角灯笼亭 + 108 尖顶） ----------------
    mst = [(16, 'blind', 1), (16, 'tall', 2), (16, 'tall', 2), (16, 'window', 3), (14, 'belfry', 3), (14, 'window', 4)]
    tower(0, -98, 28, 92, 0, mst, buttress_d=2.4)
    tower(0, -98, 21, 30, 0, [(15, 'tall', 2), (15, 'belfry', 3)], y0=Y + 92, buttress_d=1.6)
    # 八角灯笼亭
    r8 = 8.6; y8 = Y + 122
    for i in range(8):
        a = TAU * i / 8
        Mf = G(math.cos(a) * r8 * 0.924, y8, -98 + math.sin(a) * r8 * 0.924) @ RZ(-a + math.pi / 2)
        Mf = T(math.cos(a) * r8 * 0.924, 98 - math.sin(a) * r8 * 0.924, y8) @ RZ(math.atan2(-math.sin(a), math.cos(a)) - math.pi / 2 + math.pi)
        stage_face(Mf, 2 * r8 * math.tan(math.pi / 8) * 0.92, 0, 16, 'tall', wall_t=0.8, n=1, lights=2)
        # 八角柱棱上小尖塔
        b = a + math.pi / 8
        pinnacle(A, 'trim', 1.1, 8, T(math.cos(b) * r8 * 1.02, 98 - math.sin(b) * r8 * 1.02, y8 + 15.5))
    v, f = ngon_prism(r8 * 0.8, 16, 8, math.pi / 8); A.add('ashlarDeep', v, f, T(0, 98, y8))
    cornice_oct = None
    v, f = ngon_prism(r8 * 1.08, 0.5, 8, 0); A.add('trim', v, f, T(0, 98, y8 + 15.8))
    spire(A, 'slate', r8 * 0.92, 108, T(0, 98, y8 + 16.3), mat_trim='trim', bands=(0.18, 0.36, 0.55, 0.72, 0.86))
    for sx in (-1, 1):
        for sz in (-1, 1):
            v, f = ngon_prism(1.6, 6, 8, math.pi / 8); A.add('trim', v, f, G(sx * 11.8, y8, -98 + sz * 11.8))
            spire(A, 'slate', 1.6, 20, G(sx * 11.8, y8 + 6, -98 + sz * 11.8), mat_trim='trim', lucarnes=False, bands=(0.5,))
    # ---------------- 正门台阶 + 平台（游戏：10 级 0.18，z 0.6…-4.4；平台 34×5 高 1.8） ----------------
    Ms = G(0, 0, 0.85)
    for i in range(10):
        w = 34 - i * 0.4
        v, f = cbox(w, 0.56, 0.18, 0.015); A.add('steps', v, f, G(0, 0.09 + i * 0.18, 0.6 - i * 0.5))
        v, f = box(w - 0.01, 0.5, 0.09 + i * 0.18); A.add('steps', v, f, G(0, (0.09 + i * 0.18) / 2, 0.6 - i * 0.5 + 0.0))
    v, f = cbox(34, 5.0, Y, 0.02); A.add('steps', v, f, G(0, Y / 2, -3.0))
    # 平台两侧石狮基座（狮子由 three 放 GLB）+ 栏墙
    for s in (-1, 1):
        v, f = cbox(1.8, 6.8, 2.4, 0.05); A.add('plinth', v, f, G(s * 17.9, 1.2, -1.6))
        v, f = cbox(2.0, 7.0, 0.25, 0.04); A.add('trim', v, f, G(s * 17.9, 2.48, -1.6))
        v, f = cbox(2.2, 2.2, 0.5, 0.04); A.add('plinth', v, f, G(s * 17.9, 2.85, 0.6))
        col(s * 17.9, 1.3, -1.6, 1.8, 2.6, 6.8)
    # 全楼勒脚（底座石台，围合正面）
    for s in (-1, 1):
        v, f = cbox(13.2, 1.6, 2.2, 0.05); A.add('plinth', v, f, G(s * 22, 1.1, -6.3))
        v, f = cbox(8.4, 1.4, 2.0, 0.05); A.add('plinth', v, f, G(s * 36, 1.0, -7.4))

def materials():
    """Cycles 烘焙用材质（只影响烘焙光照，不导出贴图）：近似反照率"""
    alb = {'ashlar': (0.08, 0.075, 0.07), 'ashlarDeep': (0.05, 0.05, 0.05), 'trim': (0.1, 0.095, 0.09), 'marble': (0.03, 0.03, 0.035), 'marbleDark': (0.03, 0.03, 0.035),
           'gold': (0.8, 0.6, 0.3), 'slate': (0.05, 0.055, 0.065), 'glass': (0.02, 0.03, 0.06), 'louver': (0.04, 0.03, 0.02), 'lead': (0.08, 0.085, 0.09), 'plinth': (0.09, 0.09, 0.09), 'steps': (0.05, 0.05, 0.055), 'COL': (0.5, 0.5, 0.5)}
    for m in bpy.data.materials:
        m.use_nodes = True
        b = m.node_tree.nodes.get('Principled BSDF')
        c = alb.get(m.name, (0.1, 0.1, 0.1))
        b.inputs['Base Color'].default_value = (*c, 1)
        b.inputs['Roughness'].default_value = 0.7
        if m.name == 'gold': b.inputs['Metallic'].default_value = 1.0; b.inputs['Roughness'].default_value = 0.3

if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    out = argv[0] if argv else '/tmp/facade.blend'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_all()
    print('FACADE tris', A.tris(), 'col', C.tris())
    sc = {'ashlar': 1 / 3.0, 'ashlarDeep': 1 / 3.0, 'trim': 1 / 2.0, 'plinth': 1 / 2.0, 'steps': 1 / 2.0, 'slate': 1 / 3.0, 'marble': 1 / 1.5, 'marbleDark': 1 / 2.0, 'gold': 1.0, 'lead': 1 / 2.0}
    co = bpy.data.collections.new('hero'); bpy.context.scene.collection.children.link(co)
    objs = A.build('F', co, sc)
    cc = bpy.data.collections.new('col'); bpy.context.scene.collection.children.link(cc)
    C.build('C', cc)
    materials()
    bpy.ops.wm.save_as_mainfile(filepath=out)
    print('SAVED', out)
