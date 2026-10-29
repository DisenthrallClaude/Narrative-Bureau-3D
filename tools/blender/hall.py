# 样板 B：安检大厅（中殿 + 侧廊，5.5 m 开间束柱拱廊、三拱廊、高侧窗、交叉肋拱、玫瑰窗、门洞）+ 固定陈设（安检翼闸、扫描拱门、X 光机、隔离柱、候检座椅、复检台、自助终端、展柜、指示吊牌、大屏框架）
# 运行：blender -b --factory-startup --python hall.py -- out.blend
# 光源（烘焙用）：彩窗/高侧窗/玫瑰窗为面发光体（日光透过彩玻）、吊灯与侧廊吊灯为点光、大屏为蓝色面光
import sys, os, math, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
from gk import *

Y = 1.8; X = 17.4; Z0 = -30.0; Z1 = -76.0; XN = 12.0
PZ = [-31.5 - 5.5 * k for k in range(9)]       # 束柱（含两端靠墙半柱）
SPRING_A, CROWN_A = 6.0, 8.8                     # 侧廊拱顶
ARC_SPRING = 6.0                                 # 拱廊
SPRING_N, CROWN_N = 16.5, 21.0                   # 中殿拱顶
A = Acc(); C = Acc(); LIGHTS = []
def G(x, y, z): return T(x, -z, y)
def col(cx, cy, cz, sx, sy, sz):
    v, f = box(sx, sz, sy); C.add('COL', v, f, G(cx, cy, cz))
def gbox(mat, cx, cy, cz, sx, sy, sz, c=0.0, M=None):
    v, f = cbox(sx, sz, sy, c) if c > 0 else box(sx, sz, sy); A.add(mat, v, f, (M or Matrix()) @ G(cx, cy, cz))
def light(kind, pos, power, color, size=0.3, name=None):
    LIGHTS.append({'kind': kind, 'pos': pos, 'power': power, 'color': color, 'size': size})

def pointed_h(t, span, rise, k=None):
    """0..1 位置 t 处的尖拱高度（拱脚 0，拱顶 rise）"""
    x = (t - 0.5) * span
    half = span / 2
    R = (half * half + rise * rise) / (2 * half)   # 两段圆弧（圆心在对侧拱脚内）
    cxo = half - R if x < 0 else -(half - R)
    return max(0.0, math.sqrt(max(0.0, R * R - (abs(x) - (R - half)) ** 2 if False else R * R - (x - (-(half - R)) if x < 0 else x - (half - R)) ** 2)))

def arch_h(x, half, rise):
    """跨 2*half、矢高 rise 的拱高度：rise>=half 用两心尖拱；rise<half（宽跨扁拱）用带尖的椭圆型曲线"""
    t = min(1.0, abs(x) / half)
    if rise >= half:
        a = (rise * rise - half * half) / (2 * half); R = half + a; d = abs(x) + a
        return math.sqrt(max(0.0, R * R - d * d))
    return rise * max(0.0, 1 - t ** 1.7) ** 0.6

def groin_vault(mat, x0, x1, z0, z1, y_spring, rise_x, rise_z, nx=18, nz=10):
    """交叉拱面：h = max(横向尖拱(x), 纵向尖拱(z))，网格面（向下可见）"""
    hx, hz = (x1 - x0) / 2, (z1 - z0) / 2
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    v = []; f = []
    for j in range(nz + 1):
        for i in range(nx + 1):
            x = x0 + (x1 - x0) * i / nx; z = z0 + (z1 - z0) * j / nz
            hX = arch_h(x - cx, hx, rise_x); hZ = arch_h(z - cz, abs(hz), rise_z)
            v.append((x, -z, Y + y_spring + max(hX, hZ)))
    for j in range(nz):
        for i in range(nx):
            a = j * (nx + 1) + i; b = a + 1; c = a + nx + 2; d = a + nx + 1
            f.append((a, d, c, b))
    A.add(mat, v, f, smooth=True)

def rib(mat, pts, w=0.28, d=0.34, gold=False):
    prof = [(-w / 2, 0), (w / 2, 0), (w / 2, -d * 0.55), (w * 0.28, -d * 0.85), (0, -d), (-w * 0.28, -d * 0.85), (-w / 2, -d * 0.55)]
    v, f = sweep(prof, pts, up=(0, 0, 1)); A.add(mat, v, f, smooth=True)
    if gold:
        v, f = sweep(circ_prof(0.025, 5, 0, -d - 0.01), pts, up=(0, 0, 1)); A.add('gold', v, f, smooth=True)

def vault_bay_ribs(x0, x1, z0, z1, y_spring, rise_x, rise_z, w=0.26, gold=True, boss=True):
    """肋：两条对角肋（交叉）+ 横向拱肋 + 纵脊肋 + 中心雕花顶石（boss）"""
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2; hx, hz = (x1 - x0) / 2, abs(z1 - z0) / 2
    def H(x, z): return Y + y_spring + max(arch_h(x - cx, hx, rise_x), arch_h(z - cz, hz, rise_z))
    n = 24
    for (ax, az, bx, bz) in ((x0, z0, x1, z1), (x0, z1, x1, z0)):
        pts = [Vector((ax + (bx - ax) * t, -(az + (bz - az) * t), H(ax + (bx - ax) * t, az + (bz - az) * t) - 0.02)) for t in [i / n for i in range(n + 1)]]
        rib('trim', pts, w, w * 1.2, gold)
    # 横向拱肋（每开间两端）
    for zz in (z0, z1):
        pts = [Vector((x0 + (x1 - x0) * t, -zz, Y + y_spring + arch_h(x0 + (x1 - x0) * t - cx, hx, rise_x) - 0.02)) for t in [i / n for i in range(n + 1)]]
        rib('trim', pts, w * 1.25, w * 1.5, False)
    # 纵脊肋
    pts = [Vector((cx, -(z0 + (z1 - z0) * t), Y + y_spring + rise_x - 0.02)) for t in [i / 8 for i in range(9)]]
    rib('trim', pts, w * 0.8, w, gold)
    if boss:
        v, f = revolve([(0, 0), (0.42, 0.05), (0.5, 0.2), (0.36, 0.38), (0.12, 0.45), (0, 0.42)], 12); A.add('gold', v, f, T(cx, -cz, Y + y_spring + rise_x - 0.52), smooth=True)
        for i in range(8):
            a = TAU * i / 8
            v, f = leaf(0.32); A.add('trim', v, f, T(cx + math.cos(a) * 0.38, -cz - math.sin(a) * 0.38, Y + y_spring + rise_x - 0.3) @ RZ(a) @ RY(2.6), smooth=True)

def pier(x, z, h, R=0.62):
    """中殿束柱：八角柱基 + 主柱 + 8 根细柱，柱头之上 3 根壁柱（vaulting shafts）继续升到中殿拱脚"""
    M = G(x, Y, z)
    clustered_pier(A, 'pier', R, h, M, shafts=8, mat_cap='trim')
    col(x, Y + 3, z, R * 2.6, 6, R * 2.6)
    # 柱头上的拱脚石 + 升向中殿拱脚的壁柱（朝中殿一侧）
    sx = -1 if x > 0 else 1
    for dz in (-0.42, 0, 0.42):
        column(A, 'pier', 0.13 if dz == 0 else 0.1, SPRING_N - h - 0.2, G(x + sx * 0.55, Y + h + 0.1, z + dz), seg=8, base=False, cap=True, mat_cap='trim')

def wall_respond(x, z, face_sign, h, kind='x'):
    """靠墙半柱（侧廊外墙/端墙）：三根附壁柱"""
    for d in (-0.4, 0, 0.4):
        if kind == 'x': M = G(x + face_sign * 0.16, Y, z + d)
        else: M = G(x + d, Y, z + face_sign * 0.16)
        column(A, 'pier', 0.15 if d == 0 else 0.11, h, M, seg=8, mat_cap='trim')

def arcade_wall(sx):
    """中殿两侧拱廊墙（x=±12）：拱廊（9 跨）+ 三拱廊 + 高侧窗墙"""
    x = sx * XN; t = 0.9  # 拱廊墙比束柱芯（直径 1.14）薄，否则墙面在柱身细柱之间露出、终年背光成黑条
    for k in range(len(PZ) - 1):
        za, zb = PZ[k], PZ[k + 1]; zc = (za + zb) / 2; span = abs(zb - za) - 1.5
        Mw = G(x, Y, zc) @ RZ(math.pi / 2 if sx < 0 else -math.pi / 2)   # 局部 -y 朝中殿
        # 拱廊拱肩墙（拱脚 6.0，到三拱廊底 10.0）
        wall_with_openings(A, 'wall', -abs(zb - za) / 2, abs(zb - za) / 2, 0, 10.0, t, [(0, span, ARC_SPRING, 0, 1.0)], Mw @ T(0, -t / 2, 0))
        # 券面多重线脚（两面）
        for side in (-1, 1):
            for o, (wd, mat) in enumerate(((0.0, 'trim'), (0.32, 'trim'))):
                a = pointed_arch(span + wd * 2, 1.0, 18, 0, ARC_SPRING)
                v, f = sweep(rect_prof(0.3, 0.24, 0.04), to3(a, side * (t / 2 + 0.06 - o * 0.08)), up=(0, -side, 0)); A.add(mat, v, f, Mw)
            a = pointed_arch(span + 0.06, 1.0, 18, 0, ARC_SPRING)
            v, f = sweep(circ_prof(0.09, 8), to3(a, side * (t / 2 + 0.12)), up=(0, -side, 0)); A.add('trim', v, f, Mw, smooth=True)
            a = pointed_arch(span + 0.9, 1.0, 18, 0, ARC_SPRING)
            v, f = sweep(rect_prof(0.05, 0.05), to3(a, side * (t / 2 + 0.03)), up=(0, -side, 0)); A.add('gold', v, f, Mw)
        # 三拱廊（triforium，10.0–12.6）：三联小尖券 + 小柱 + 四叶镂空，墙后为暗廊
        v, f = box(abs(zb - za), t, 0.35); A.add('trim', v, f, Mw @ T(0, -t / 2 + 0.25, 10.0))
        v, f = box(abs(zb - za), t * 0.5, 2.9); A.add('wallDark', v, f, Mw @ T(0, t * 0.35, 11.45))
        for j in (-1, 0, 1):
            cxj = j * 1.6
            ap = pointed_arch(1.3, 1.0, 10, cxj, 11.6)
            v, f = sweep(rect_prof(0.16, 0.3, 0.03), [Vector((cxj - 0.65, -t / 2 - 0.02, 10.2))] + to3(ap, -t / 2 - 0.02) + [Vector((cxj + 0.65, -t / 2 - 0.02, 10.2))], up=(0, 1, 0)); A.add('trim', v, f, Mw)
            column(A, 'pier', 0.07, 1.4, Mw @ T(cxj - 0.8, -t / 2 - 0.05, 10.2), seg=8, mat_cap='trim')
        # 三拱廊上的腰线
        v, f = cbox(abs(zb - za) + 0.02, 0.36, 0.22, 0.03); A.add('trim', v, f, Mw @ T(0, -t / 2 - 0.05, 12.75))
        # 高侧窗墙（12.8–16.5 + 拱面以上）：双联花窗（彩玻发光）
        ww = 2.3; zb_w = 13.1; hs = 2.0
        wall_with_openings(A, 'wall', -abs(zb - za) / 2, abs(zb - za) / 2, 12.85, CROWN_N + 0.4, t, [(0, ww, hs, zb_w, 1.0)], Mw @ T(0, -t / 2, 0))
        tracery_window(A, 'trim', 'glassN', ww, hs, depth=t, lights=2, M=Mw @ T(0, -t / 2 - 0.02, zb_w), orders=2, bar=0.11, glass_y=0.55)
        # 中殿一侧：拱下的金色细线 + 柱间暗色护墙板（侧廊侧）
    # 拱廊下的碰撞（柱间留通道）

def aisle_outer_wall(sx):
    """侧廊外墙（x=±17.4）：护墙盲拱（0–2.4）+ 每开间双联尖窗（门洞开间除外）+ 靠墙半柱"""
    x = sx * X
    door = (-55.5, -47.5) if sx < 0 else (-51.0, -45.0)
    door_h = (4.0, 8.0) if sx < 0 else (3.2, 6.0)
    for k in range(len(PZ) - 1):
        za, zb = PZ[k], PZ[k + 1]; zc = (za + zb) / 2; L = abs(zb - za)
        Mw = G(x, Y, zc) @ RZ(-math.pi / 2 if sx < 0 else math.pi / 2)   # 局部 -y 朝室内
        Mw = G(x, Y, zc) @ RZ(math.pi / 2 if sx > 0 else -math.pi / 2) @ RZ(math.pi)
        dc = (door[0] + door[1]) / 2
        if door[0] - 0.1 <= zc <= door[1] + 0.1:
            continue
        ops = [(0, 2.4, 2.3, 2.9, 1.0)]
        wall_with_openings(A, 'wall', -L / 2, L / 2, 0, CROWN_A + 0.6, 0.9, ops, Mw @ T(0, -0.45 + 0.45, 0))
        tracery_window(A, 'trim', 'glassA', 2.4, 2.3, depth=0.9, lights=2, M=Mw @ T(0, -0.02, 2.9), orders=2, bar=0.11, glass_y=0.6)
        # 护墙盲拱（dado arcade）
        blind_arcade(A, 'trim', -L / 2 + 0.4, L / 2 - 0.4, 0.25, 2.3, 4, Mw @ T(0, -0.03, 0), depth=0.1, mat2='wallDark')
        v, f = cbox(L, 0.3, 0.2, 0.03); A.add('trim', v, f, Mw @ T(0, -0.1, 2.62))
        v, f = cbox(L, 0.36, 0.25, 0.03); A.add('plinthIn', v, f, Mw @ T(0, -0.1, 0.12))
    # 门洞所在墙段（整面墙 + 尖拱门洞 + 门框线脚）
    z0d, z1d = door
    dz_lo = min(p for p in PZ if p <= z0d + 0.01) if any(p <= z0d + 0.01 for p in PZ) else PZ[-1]
    seg0 = max(p for p in PZ if p <= z0d + 0.01) if False else None
    zs = sorted(PZ, reverse=True)
    za = max(p for p in PZ if p >= z1d - 0.01 and p <= z1d + 6)  # 门洞北端以北的柱
    za = min([p for p in PZ if p >= z1d - 0.01], key=lambda p: p - z1d)
    zbb = max([p for p in PZ if p <= z0d + 0.01], key=lambda p: p - z0d)
    zc = (za + zbb) / 2; L = za - zbb; dcz = (z0d + z1d) / 2
    Mw = G(x, Y, zc) @ RZ(math.pi / 2 if sx > 0 else -math.pi / 2) @ RZ(math.pi)
    w = z1d - z0d
    lx = (dcz - zc) * (-1 if sx > 0 else 1)
    wall_with_openings(A, 'wall', -L / 2, L / 2, 0, CROWN_A + 0.6, 0.9, [(lx, w, door_h[0], 0.0, 0.62)], Mw)
    for o in range(3):
        a = pointed_arch(w + 0.3 + o * 0.5, 0.62, 18, lx, door_h[0])
        v, f = sweep(rect_prof(0.25, 0.22, 0.04), [Vector((lx - (w + 0.3 + o * 0.5) / 2, -0.06 - o * 0.06, 0))] + to3(a, -0.06 - o * 0.06) + [Vector((lx + (w + 0.3 + o * 0.5) / 2, -0.06 - o * 0.06, 0))], up=(0, 1, 0)); A.add('trim', v, f, Mw)
    a = pointed_arch(w + 1.6, 0.62, 18, lx, door_h[0])
    v, f = sweep(rect_prof(0.05, 0.05), to3(a, -0.24), up=(0, 1, 0)); A.add('gold', v, f, Mw)
    # 门牌底板（文字由 three 贴）
    gbox('marbleDark', x - sx * 0.08, Y + door_h[1] + 0.8, dcz, 0.08, 0.6, min(5.0, w * 0.75), 0.02)
    # 门洞外侧：通向邻区的暗色内衬（防漏光）
    gbox('wallDark', x + sx * 1.6, Y + 5, dcz, 0.2, 10, w + 2)

def end_wall(z, face):
    """南墙（通门厅大门洞 + 玫瑰窗）/ 北墙（电梯金门 + 中庭铁门）"""
    W = 2 * X; t = 1.2
    Mw = G(0, Y, z) @ (RZ(math.pi) if face == 'S' else RZ(0))  # 局部 -y 朝室内
    if face == 'S':
        # 南墙在 z=-30，室内在 -z 方向（Blender +y）。局部 -y 应朝室内 → Blender +y → RZ(π)
        ops = [(0, 10.0, 4.8, 0.0, 0.6)]
        wall_with_openings(A, 'wall', -W / 2, W / 2, 0, 11.3, t, ops, Mw @ T(0, -t / 2, 0))
        wall_with_circle(A, 'wall', -W / 2, W / 2, 11.3, CROWN_N + 1.0, t, 0, 15.6, 3.7, Mw, ystart=-t / 2)
        for o in range(4):
            a = pointed_arch(10.3 + o * 0.6, 0.6, 22, 0, 4.8)
            v, f = sweep(rect_prof(0.3, 0.26, 0.04), [Vector((-(10.3 + o * 0.6) / 2, -t / 2 - 0.06 - o * 0.08, 0))] + to3(a, -t / 2 - 0.06 - o * 0.08) + [Vector(((10.3 + o * 0.6) / 2, -t / 2 - 0.06 - o * 0.08, 0))], up=(0, 1, 0)); A.add('trim', v, f, Mw)
        a = pointed_arch(13.0, 0.6, 22, 0, 4.8)
        v, f = sweep(rect_prof(0.06, 0.06), to3(a, -t / 2 - 0.38), up=(0, 1, 0)); A.add('gold', v, f, Mw)
        # 玫瑰窗（室内侧，中心 15.6，r 3.7）：墙上开圆洞 → 用实墙 + 发光圆窗片 + 花格
        rose(Mw @ T(0, -t / 2 - 0.02, 0), 3.7, 15.6)
    else:
        ops = [(0, 4.6, 3.6, 0.0, 0.6)]
        wall_with_openings(A, 'wall', -W / 2, W / 2, 0, CROWN_N + 1.0, t, ops, Mw @ T(0, -t / 2, 0))
        for o in range(3):
            a = pointed_arch(4.9 + o * 0.5, 0.6, 16, 0, 3.6)
            v, f = sweep(rect_prof(0.24, 0.22, 0.03), [Vector((-(4.9 + o * 0.5) / 2, -t / 2 - 0.05 - o * 0.07, 0))] + to3(a, -t / 2 - 0.05 - o * 0.07) + [Vector(((4.9 + o * 0.5) / 2, -t / 2 - 0.05 - o * 0.07, 0))], up=(0, 1, 0)); A.add('trim', v, f, Mw)
        # 电梯厅金门（x ±6）：深门套 + 尖券门头 + 黄铜门扇（平嵌）
        for ex in (-6, 6):
            for o in range(3):
                a = pointed_arch(3.6 + o * 0.5, 0.75, 14, ex, 4.2)
                v, f = sweep(rect_prof(0.26, 0.22, 0.03), [Vector((ex - (3.6 + o * 0.5) / 2, -t / 2 - 0.05 - o * 0.08, 0))] + to3(a, -t / 2 - 0.05 - o * 0.08) + [Vector((ex + (3.6 + o * 0.5) / 2, -t / 2 - 0.05 - o * 0.08, 0))], up=(0, 1, 0)); A.add('trim' if o != 1 else 'marble', v, f, Mw)
            for s in (-1, 1):
                v, f = cbox(1.62, 0.08, 4.0, 0.01); A.add('brass', v, f, Mw @ T(ex + s * 0.83, -t / 2 - 0.02, 2.0))
                for r in range(4):
                    v, f = cbox(1.3, 0.03, 0.8, 0.005); A.add('gold', v, f, Mw @ T(ex + s * 0.83, -t / 2 - 0.07, 0.5 + r * 0.95))
            ap = opening_poly(3.4, 0.0, 0.75, 12, ex, 4.2)
            v = [(px, -t / 2 - 0.03, pz) for px, pz in ap if pz >= 4.19]
            v, f = cbox(3.5, 0.3, 0.6, 0.03); A.add('marbleDark', v, f, Mw @ T(ex, -t / 2 - 0.1, 5.05))  # 楼层指示牌底板
        # 北墙上部：大挂钟/局徽墙面板（三拱廊高度）
        v, f = cbox(9, 0.3, 4.2, 0.04); A.add('marbleDark', v, f, Mw @ T(0, -t / 2 - 0.1, 12.0))
        v, f = cbox(9.3, 0.08, 0.1, 0.01); A.add('gold', v, f, Mw @ T(0, -t / 2 - 0.26, 14.15))
        v, f = cbox(9.3, 0.08, 0.1, 0.01); A.add('gold', v, f, Mw @ T(0, -t / 2 - 0.26, 9.85))

def rose(M, r, cz):
    for k, rr in enumerate((r + 0.5, r + 0.25, r)):
        v, f = sweep(rect_prof(0.26, 0.4 - k * 0.08, 0.04), to3(circle2(rr, 80, 0, cz), -0.1 + k * 0.1), closed=True, up=(0, 1, 0)); A.add('trim', v, f, M)
    v, f = sweep(rect_prof(0.06, 0.06), to3(circle2(r + 0.68, 80, 0, cz), -0.2), closed=True, up=(0, 1, 0)); A.add('gold', v, f, M)
    rc = r * 0.28
    v, f = sweep(rect_prof(0.16, 0.3, 0.03), to3(circle2(rc, 40, 0, cz), 0.05), closed=True, up=(0, 1, 0)); A.add('trim', v, f, M)
    for i in range(12):
        a = TAU * i / 12
        v, f = sweep(rect_prof(0.12, 0.26, 0.02), [Vector((math.cos(a) * rc, 0.05, cz + math.sin(a) * rc)), Vector((math.cos(a) * r, 0.05, cz + math.sin(a) * r))], up=(0, 1, 0)); A.add('trim', v, f, M)
        am = a + TAU / 24; rr = (r - rc) * 0.3
        cxp, czp = math.cos(am) * (rc + (r - rc) * 0.62), math.sin(am) * (rc + (r - rc) * 0.62)
        v, f = sweep(rect_prof(0.07, 0.2), to3(foil(rr, 4, 28, cxp, cz + czp, am, 0.4), 0.05), closed=True, up=(0, 1, 0)); A.add('trim', v, f, M)
    gv = [(x, 1.05, z) for x, z in circle2(r + 0.05, 64, 0, cz)]
    A.add('glassRose', gv, [tuple(range(len(gv)))], M)

def floors():
    # 中殿：黑白棋盘大理石（0.6 m）；侧廊：米黄石灰岩大板；分隔带：黑色大理石 + 金线
    gbox('floorNave', 0, Y - 0.05, (Z0 + Z1) / 2, 2 * XN - 1.2, 0.1, Z0 - Z1)
    for sx in (-1, 1):
        gbox('floorAisle', sx * (XN + X) / 2 + sx * 0.3, Y - 0.05, (Z0 + Z1) / 2, X - XN - 0.6, 0.1, Z0 - Z1)
        gbox('marbleDark', sx * (XN - 0.3), Y - 0.048, (Z0 + Z1) / 2, 1.2, 0.1, Z0 - Z1)
        gbox('gold', sx * (XN - 0.9), Y + 0.0, (Z0 + Z1) / 2, 0.05, 0.012, Z0 - Z1)
    for z in PZ[1:-1]:
        gbox('marbleDark', 0, Y - 0.047, z, 2 * XN - 1.2, 0.1, 0.5)
        gbox('gold', 0, Y + 0.001, z - 0.27, 2 * XN - 1.2, 0.012, 0.04)
        gbox('gold', 0, Y + 0.001, z + 0.27, 2 * XN - 1.2, 0.012, 0.04)
    # 罗盘拼花（z -58，金圈 + 黑石圆盘 + 八角星）
    Mf = G(0, Y + 0.003, -58.4)
    v, f = revolve([(7.0, 0), (6.8, 0)], 128, close_top=False, close_bot=False); 
    for r0, r1, m in ((6.75, 7.0, 'gold'), (4.8, 6.75, 'marbleDark'), (4.75, 4.8, 'gold'), (0.0, 4.75, 'marbleLight')):
        pts_o = [(r1 * math.cos(TAU * i / 128), r1 * math.sin(TAU * i / 128)) for i in range(128)]
        if r0 > 0:
            pts_i = [(r0 * math.cos(TAU * i / 128), r0 * math.sin(TAU * i / 128)) for i in range(128)]
            vv = [(x, y, 0.004 if m == 'gold' else 0.002) for x, y in pts_o] + [(x, y, 0.004 if m == 'gold' else 0.002) for x, y in pts_i]
            ff = [(i, (i + 1) % 128, 128 + (i + 1) % 128, 128 + i) for i in range(128)]
        else:
            vv = [(x, y, 0.002) for x, y in pts_o]; ff = [tuple(range(128))]
        A.add(m, vv, ff, Mf)
    for i in range(8):
        a = TAU * i / 8; L = 4.6 if i % 2 == 0 else 3.2
        tri = [(0, 0), (math.cos(a + 0.18) * 0.9, math.sin(a + 0.18) * 0.9), (math.cos(a) * L, math.sin(a) * L), (math.cos(a - 0.18) * 0.9, math.sin(a - 0.18) * 0.9)]
        A.add('gold' if i % 2 == 0 else 'marbleDark', [(x, y, 0.006) for x, y in tri], [(0, 1, 2, 3)], Mf)
    # 碰撞：地面
    col(0, Y - 0.05, (Z0 + Z1) / 2, 2 * X, 0.1, Z0 - Z1)

def vaults():
    for k in range(len(PZ) - 1):
        za, zb = PZ[k], PZ[k + 1]
        if k == 0: za = Z0
        if k == len(PZ) - 2: zb = Z1
        groin_vault('vault', -XN, XN, za, zb, SPRING_N, CROWN_N - SPRING_N, CROWN_N - SPRING_N, 24, 8)
        vault_bay_ribs(-XN + 0.6, XN - 0.6, PZ[k], PZ[k + 1], SPRING_N, CROWN_N - SPRING_N - 0.05, CROWN_N - SPRING_N - 0.05, 0.26)
        for sx in (-1, 1):
            x0, x1 = (XN, X) if sx > 0 else (-X, -XN)
            groin_vault('vault', x0, x1, za, zb, SPRING_A, CROWN_A - SPRING_A, CROWN_A - SPRING_A, 8, 8)
            vault_bay_ribs(x0 + 0.3, x1 - 0.3, PZ[k], PZ[k + 1], SPRING_A, CROWN_A - SPRING_A - 0.05, CROWN_A - SPRING_A - 0.05, 0.2, gold=False)
    # 中殿拱面以上 / 侧廊拱面以上的封顶（防漏光）
    gbox('wallDark', 0, Y + CROWN_N + 1.2, (Z0 + Z1) / 2, 2 * X + 2, 0.4, Z0 - Z1 + 2)
    for sx in (-1, 1): gbox('wallDark', sx * (XN + X) / 2, Y + CROWN_A + 0.9, (Z0 + Z1) / 2, X - XN + 0.4, 0.3, Z0 - Z1)

# ------------------------------------------------------------------ 陈设
def security_line():
    GZ = -40.0
    lanes = [-10.5 + i * 3 for i in range(8)]
    for i in range(9):
        x = -12 + i * 3
        M = G(x, Y, GZ)
        # 翼闸机箱：拉丝不锈钢圆头 + 黑玻璃顶 + 金色腰线 + 底座 + 通行灯带槽
        v, f = cbox(0.3, 1.1, 0.96, 0.03); A.add('steel', v, f, M @ T(0, 0, 0.5))
        for ez in (-1, 1):
            v, f = revolve([(0.15, 0.02), (0.15, 0.98)], 12, -math.pi / 2 if ez > 0 else math.pi / 2, math.pi / 2 if ez > 0 else 3 * math.pi / 2, close_top=True, close_bot=True)
            A.add('steel', v, f, M @ T(0, -ez * 0.55, 0) @ RZ(math.pi / 2 if ez > 0 else -math.pi / 2) @ RZ(-math.pi / 2), smooth=True)
        v, f = cbox(0.32, 1.42, 0.03, 0.01); A.add('blackGlass', v, f, M @ T(0, 0, 0.995))
        v, f = cbox(0.31, 1.41, 0.025, 0.005); A.add('gold', v, f, M @ T(0, 0, 0.8))
        v, f = cbox(0.34, 1.44, 0.08, 0.01); A.add('blackMetal', v, f, M @ T(0, 0, 0.04))
        # 人脸识别立杆 + 屏框
        v, f = cbox(0.035, 0.035, 0.36, 0.005); A.add('blackMetal', v, f, M @ T(0, -0.62, 1.18))
        v, f = cbox(0.2, 0.03, 0.14, 0.008); A.add('blackMetal', v, f, M @ T(0, -0.64, 1.42))
        if i < 8:
            for ex in (-1, 1):
                v, f = cbox(0.02, 0.55, 0.62, 0.004); A.add('glassClear', v, f, M @ T(1.5 + ex * 0.43, 0, 0.72))
        col(x, Y + 0.6, GZ, 0.5, 1.2, 1.7)
    for lx in lanes:
        col(lx - 0.95, Y + 0.6, GZ, 0.9, 1.2, 0.3); col(lx + 0.95, Y + 0.6, GZ, 0.9, 1.2, 0.3)
        # 扫描拱门（每车道，z = -43.2）
        z = GZ - 3.2
        for ex in (-1, 1):
            v, f = cbox(0.22, 0.55, 2.3, 0.03); A.add('blackMetal', v, f, G(lx + ex * 0.62, Y + 1.15, z))
            v, f = cbox(0.24, 0.57, 0.05, 0.01); A.add('gold', v, f, G(lx + ex * 0.62, Y + 2.0, z))
            col(lx + ex * 0.62, Y + 1.15, z, 0.24, 2.3, 0.56)
        v, f = cbox(1.46, 0.6, 0.3, 0.03); A.add('blackMetal', v, f, G(lx, Y + 2.45, z))
        v, f = cbox(1.48, 0.62, 0.04, 0.01); A.add('gold', v, f, G(lx, Y + 2.3, z))
        # 排队隔离柱（黄铜）+ 深蓝伸缩带
        for ex in (-1, 1):
            xx = lx + ex * 0.75
            for zz in (GZ + 2.4, GZ + 4.2):
                Mq = G(xx, Y, zz)
                v, f = revolve([(0.17, 0), (0.18, 0.02), (0.16, 0.045), (0.035, 0.06), (0.028, 0.1), (0.028, 0.92), (0.04, 0.94), (0.045, 0.98), (0.0, 1.0)], 12); A.add('brass', v, f, Mq, smooth=True)
            v, f = cbox(0.02, 1.8, 0.055, 0.005); A.add('navyBelt', v, f, G(xx, Y + 0.88, GZ + 3.3))
    for sx in (-1, 1):
        gbox('steel', sx * 15, Y + 0.55, GZ, 4.8, 1.1, 0.12, 0.02); col(sx * 15, Y + 0.6, GZ, 4.8, 1.2, 0.4)
        # X 光行李机：机身 + 通道铅帘 + 滚筒输送
        x, z = sx * 15, GZ + 1.6
        gbox('paintMetal', x, Y + 0.78, z, 1.3, 1.26, 2.4, 0.06)
        gbox('blackGlass', x, Y + 0.68, z, 0.9, 0.6, 2.42, 0.01)
        for k in range(7):
            for ez in (-1, 1): gbox('rubber', x - 0.36 + k * 0.12, Y + 0.68, z + ez * 1.205, 0.11, 0.55, 0.01)
        for ez in (-1, 1):
            gbox('blackMetal', x, Y + 0.4, z + ez * 1.9, 0.9, 0.08, 1.4, 0.01)
            for k in range(10):
                v, f = cyl(0.03, 0.86, 8); A.add('steel', v, f, G(x - 0.43, Y + 0.46, z + ez * (1.3 + k * 0.13)) @ RY(math.pi / 2), smooth=True)
            for sxl in (-1, 1): gbox('blackMetal', x + sxl * 0.42, Y + 0.2, z + ez * 1.9, 0.05, 0.4, 1.3)
        col(x, Y + 0.7, z, 1.3, 1.4, 5.2)
        # 操作台（屏幕）
        gbox('blackMetal', x + sx * 0.75, Y + 1.25, z, 0.06, 0.4, 0.06)
    # 第二台行李机（1 号道西侧）
    gbox('paintMetal', -14.2, Y + 0.65, GZ - 1.4, 1.2, 1.3, 3.2, 0.06); gbox('rubber', -14.2, Y + 0.82, GZ - 1.4, 0.9, 0.04, 4.6)
    col(-14.2, Y + 0.65, GZ - 1.4, 1.2, 1.3, 3.2)
    # 安检员值守台（东侧，z -44）
    gbox('woodDark', 15.2, Y + 0.55, -45.2, 1.0, 1.1, 2.6, 0.03); gbox('marble', 15.2, Y + 1.12, -45.2, 1.15, 0.06, 2.75, 0.01)
    col(15.2, Y + 0.55, -45.2, 1.0, 1.1, 2.6)

def beam_seating(x, z, n_units=3, yaw=0.0):
    """机场式排椅：不锈钢横梁 + 铸铝腿 + 黑色皮质坐垫/靠背（每单元 3 座）"""
    M = G(x, Y, z) @ RZ(yaw)
    L = n_units * 3 * 0.62
    v, f = cbox(L, 0.08, 0.08, 0.01); A.add('steel', v, f, M @ T(0, 0, 0.38))
    for i in range(n_units + 1):
        xx = -L / 2 + i * L / n_units
        for s in (-1, 1):
            v, f = cbox(0.06, 0.06, 0.4, 0.01); A.add('steel', v, f, M @ T(xx, s * 0.22, 0.2) @ RX(s * 0.25))
        v, f = cbox(0.06, 0.55, 0.05, 0.01); A.add('steel', v, f, M @ T(xx, 0, 0.02))
        v, f = cbox(0.06, 0.4, 0.04, 0.01); A.add('steel', v, f, M @ T(xx, 0.05, 0.66))  # 扶手
    for k in range(n_units * 3):
        xx = -L / 2 + 0.31 + k * 0.62
        v, f = cbox(0.54, 0.48, 0.08, 0.03); A.add('leatherBlack', v, f, M @ T(xx, 0, 0.47))
        v, f = cbox(0.54, 0.07, 0.48, 0.03); A.add('leatherBlack', v, f, M @ T(xx, 0.26, 0.78) @ RX(-0.12))
    C.add('COL', *box(L, 0.7, 0.9), M @ T(0, 0.05, 0.45))

def kiosk(x, z, yaw):
    """自助取号/证件核验终端：黑色金属立柜 + 斜面屏 + 金色顶边"""
    M = G(x, Y, z) @ RZ(yaw)
    v, f = cbox(0.62, 0.48, 1.25, 0.04); A.add('blackMetal', v, f, M @ T(0, 0, 0.62))
    v, f = cbox(0.66, 0.42, 0.06, 0.02); A.add('gold', v, f, M @ T(0, 0, 1.28))
    v, f = cbox(0.56, 0.04, 0.5, 0.01); A.add('blackGlass', v, f, M @ T(0, -0.18, 1.0) @ RX(0.35))
    v, f = cbox(0.3, 0.02, 0.12, 0.005); A.add('steel', v, f, M @ T(0, -0.245, 0.7))
    C.add('COL', *box(0.62, 0.48, 1.3), M @ T(0, 0, 0.65))

def inspection_desk(x, z):
    """人工复检台：不锈钢台面 + 黑色柜体 + 托盘 + 隔离挡板"""
    gbox('blackMetal', x, Y + 0.45, z, 2.4, 0.9, 0.9, 0.03); gbox('steel', x, Y + 0.92, z, 2.5, 0.04, 1.0, 0.01)
    for k in range(3): gbox('rubber', x - 0.8 + k * 0.8, Y + 0.96, z, 0.6, 0.05, 0.42, 0.02)
    gbox('glassClear', x, Y + 1.35, z - 0.48, 2.4, 0.8, 0.02)
    col(x, Y + 0.5, z, 2.4, 1.0, 1.0)

def vitrine(x, z, L=4.4):
    gbox('marble', x, Y + 0.5, z, 1.0, 1.0, L, 0.03); gbox('gold', x, Y + 1.0, z, 1.04, 0.06, L + 0.04, 0.01)
    gbox('glassClear', x, Y + 1.68, z, 0.9, 1.3, L - 0.1)
    for e in (-1, 1): gbox('brass', x, Y + 1.68, z + e * (L / 2 - 0.05), 0.92, 1.3, 0.04)
    gbox('brass', x, Y + 2.34, z, 0.94, 0.04, L)
    col(x, Y + 1.1, z, 1.0, 2.2, L)

def hanging_sign(x, y, z, w, h=0.7, yaw=0.0):
    """吊挂指示牌：黑色金属牌 + 金边 + 两根吊杆（文字由 three 贴）"""
    M = G(x, y, z) @ RZ(yaw)
    v, f = cbox(w, 0.08, h, 0.02); A.add('blackMetal', v, f, M)
    for dz in (-h / 2 - 0.02, h / 2 + 0.02):
        v, f = cbox(w + 0.06, 0.1, 0.04, 0.01); A.add('gold', v, f, M @ T(0, 0, dz))
    for s in (-1, 1):
        v, f = cyl(0.012, 4.0, 6); A.add('blackMetal', v, f, M @ T(s * (w / 2 - 0.2), 0, h / 2))

def screen_frame():
    SW, SH, SY, SZ = 15.0, 6.56, Y + 12.4, -57.0
    gbox('blackMetal', 0, SY, SZ, SW + 0.5, SH + 0.5, 0.5, 0.05)
    gbox('gold', 0, SY + SH / 2 + 0.3, SZ, SW + 0.7, 0.12, 0.6, 0.02); gbox('gold', 0, SY - SH / 2 - 0.3, SZ, SW + 0.7, 0.12, 0.6, 0.02)
    for ex in (-6.5, 6.5):
        v, f = cyl(0.03, Y + CROWN_N - 0.4 - (SY + SH / 2 + 0.3), 6); A.add('blackMetal', v, f, G(ex, SY + SH / 2 + 0.3, SZ))
    for side in (1, -1):
        v = [(-SW / 2, 0, -SH / 2), (SW / 2, 0, -SH / 2), (SW / 2, 0, SH / 2), (-SW / 2, 0, SH / 2)]
        A.add('screenEmit', v, [(0, 1, 2, 3) if side > 0 else (3, 2, 1, 0)], G(0, SY, SZ + side * 0.26))

def furnishing():
    security_line()
    # 候检排椅（闸机后，中殿 z -66…-70，面南）与侧廊候检区
    for x in (-7.5, 7.5):
        for z in (-67.0, -70.2): beam_seating(x, z, 3, math.pi)
    for sx in (-1, 1):
        for z in (-59.0, -62.0): beam_seating(sx * 14.9, z, 2, -sx * math.pi / 2)
    # 自助终端（入口两侧）
    for sx in (-1, 1):
        for k in range(3): kiosk(sx * (6.6 + k * 1.1), -33.0, 0.0)
    # 人工复检台（东侧廊）
    inspection_desk(14.8, -68.5); inspection_desk(14.8, -72.5)
    # 违禁品展柜（西墙）
    vitrine(-X + 0.6, -62.0)
    # 吊牌（文字由 three）
    hanging_sign(0, Y + 6.2, -36.2, 7.2, 0.75)
    hanging_sign(-14.7, Y + 4.6, -50.5, 3.6, 0.6, math.pi / 2)
    hanging_sign(14.7, Y + 4.6, -46.0, 3.6, 0.6, math.pi / 2)
    hanging_sign(14.7, Y + 4.4, -70.5, 3.2, 0.6, math.pi / 2)
    screen_frame()
    # 每根中殿束柱脚下：黄铜铭牌柱 / 垃圾桶由 three 放模型

def lights():
    # 日光（多云正午）透过窗：高侧窗暖白、侧廊彩窗偏冷、玫瑰窗彩色
    pass

def materials():
    alb = {'wall': (0.16, 0.15, 0.14), 'wallDark': (0.03, 0.03, 0.03), 'pier': (0.14, 0.135, 0.13), 'trim': (0.16, 0.15, 0.14), 'vault': (0.45, 0.42, 0.37),
           'floorNave': (0.35, 0.33, 0.31), 'floorAisle': (0.55, 0.5, 0.42), 'marbleDark': (0.03, 0.03, 0.035), 'marbleLight': (0.6, 0.58, 0.55), 'marble': (0.04, 0.04, 0.045),
           'gold': (0.8, 0.6, 0.3), 'brass': (0.7, 0.5, 0.25), 'plinthIn': (0.06, 0.06, 0.06), 'steel': (0.55, 0.56, 0.58), 'blackGlass': (0.01, 0.01, 0.012), 'blackMetal': (0.03, 0.03, 0.035),
           'paintMetal': (0.6, 0.6, 0.58), 'rubber': (0.02, 0.02, 0.02), 'navyBelt': (0.03, 0.05, 0.12), 'glassClear': (0.8, 0.8, 0.8), 'leatherBlack': (0.025, 0.022, 0.02), 'woodDark': (0.06, 0.035, 0.02)}
    emis = {'glassN': ((1.0, 0.92, 0.78), 6.0), 'glassA': ((0.62, 0.75, 1.0), 4.0), 'glassRose': ((1.0, 0.6, 0.35), 7.0), 'screenEmit': ((0.35, 0.6, 1.0), 2.2)}
    for m in bpy.data.materials:
        m.use_nodes = True; nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
        if not b: continue
        if m.name in emis:
            c, s = emis[m.name]
            b.inputs['Base Color'].default_value = (0, 0, 0, 1); b.inputs['Emission Color'].default_value = (*c, 1); b.inputs['Emission Strength'].default_value = s
            continue
        b.inputs['Base Color'].default_value = (*alb.get(m.name, (0.2, 0.2, 0.2)), 1)
        b.inputs['Roughness'].default_value = 0.6
        if m.name in ('gold', 'brass', 'steel'): b.inputs['Metallic'].default_value = 1.0; b.inputs['Roughness'].default_value = 0.35
        if m.name == 'glassClear':
            b.inputs['Alpha'].default_value = 0.0  # 烘焙时透明（不挡光）
            m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None

def add_lights(coll):
    def pt(name, p, W, col, r=0.25):
        L = bpy.data.lights.new(name, 'POINT'); L.energy = W; L.color = col; L.shadow_soft_size = r
        o = bpy.data.objects.new(name, L); o.location = p; coll.objects.link(o)
    # 中殿 4 盏大吊灯（three 端同位放 chandelier GLB），暖 2700K
    for z in (-37.0, -48.0, -66.0, -71.0):
        pt('chand', (0, -z, Y + CROWN_N - 5.6), 2600, (1.0, 0.76, 0.5), 0.8)
    # 侧廊吊灯（每开间）
    for z in [(PZ[k] + PZ[k + 1]) / 2 for k in range(len(PZ) - 1)]:
        for sx in (-1, 1): pt('aisle', (sx * 14.7, -z, Y + 5.4), 320, (1.0, 0.72, 0.45), 0.3)
    # 门厅方向（南门洞外）暖光 + 档案馆/东翼门洞外补光
    pt('gateSpill', (0, 27.0, Y + 6), 1800, (1.0, 0.8, 0.6), 2.0)
    pt('westSpill', (-20.5, 51.5, Y + 4), 500, (1.0, 0.78, 0.55), 1.5)
    pt('eastSpill', (20.5, 48.0, Y + 3), 400, (0.9, 0.85, 0.8), 1.5)
    # 世界：室内封闭，世界光为 0
    w = bpy.data.worlds.new('w'); bpy.context.scene.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 0.0

if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    out = argv[0] if argv else '/tmp/hall.blend'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    floors()
    for sx in (-1, 1):
        for z in PZ[1:-1]: pier(sx * XN, z, ARC_SPRING)
        for z in (PZ[0], PZ[-1]): wall_respond(sx * XN, z, 0, ARC_SPRING, 'x')
        arcade_wall(sx)
        aisle_outer_wall(sx)
        for z in PZ:
            wall_respond(sx * (X - 0.05), z, -sx, SPRING_A, 'x')
        dz = (-55.5, -47.5, 8.0) if sx < 0 else (-51.0, -45.0, 6.0)
        for (za, zb) in ((Z1, dz[0]), (dz[1], Z0)): col(sx * (X + 0.4), Y + 10, (za + zb) / 2, 0.8, 20, zb - za)
        col(sx * (X + 0.4), Y + dz[2] + 6, (dz[0] + dz[1]) / 2, 0.8, 12, dz[1] - dz[0])
    end_wall(Z0, 'S'); end_wall(Z1, 'N')
    for (x0, x1) in ((-X, -5.0), (5.0, X)): col((x0 + x1) / 2, Y + 10, Z0 + 0.3, x1 - x0, 20, 0.6)
    for (x0, x1) in ((-X, -2.3), (2.3, X)): col((x0 + x1) / 2, Y + 10, Z1 - 0.3, x1 - x0, 20, 0.6)
    vaults()
    furnishing()
    print('HALL tris', A.tris())
    sc = {'wall': 1 / 3.0, 'wallDark': 1 / 3.0, 'pier': 1 / 2.0, 'trim': 1 / 2.0, 'vault': 1 / 3.0, 'floorNave': 1 / 3.0, 'floorAisle': 1 / 1.5, 'marbleDark': 1 / 2.0, 'marbleLight': 1 / 2.0, 'marble': 1 / 2.0, 'plinthIn': 1 / 2.0, 'leatherBlack': 1 / 1.0, 'woodDark': 1 / 1.5}
    co = bpy.data.collections.new('hero'); bpy.context.scene.collection.children.link(co)
    A.build('H', co, sc)
    cc = bpy.data.collections.new('col'); bpy.context.scene.collection.children.link(cc)
    C.build('C', cc)
    lc = bpy.data.collections.new('lights'); bpy.context.scene.collection.children.link(lc)
    add_lights(lc)
    materials()
    bpy.ops.wm.save_as_mainfile(filepath=out)
    print('SAVED', out)
