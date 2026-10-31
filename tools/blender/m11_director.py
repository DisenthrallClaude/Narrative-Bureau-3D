# 批次 M11：12F 局长室（director）主线区 hero 模块（1960–80 年代机关最高领导办公室）。
# 用法：blender.sh -b -P m11_director.py -- <outdir> <prevdir|-> shell,desk,cred,cab,flag
# 坐标约定同 m1_lib：参数 (x, y=高, z=前后)，与游戏坐标一致（Blender 内部 (x,-z,y)）。
#   m11/dr_shell.glb  房间壳（游戏绝对 x / z，原点 = 12F 地面 y）：东西墙胡桃护墙板 1.5 m 框芯（踢脚石 / 凸芯板 / 腰线 + 暗铜条）
#                     + 护墙以上胡桃壁骨分格（避开壁炉/黑布画/机要室挂画/保险柜）+ 四边三级檐口；格子天花（胡桃梁格 + 酒红褐格心 + 暗铜嵌线，底 y 6.55）；
#                     北窗 5 樘酒红褐丝绒落地窗帘（褶裥）+ 胡桃帘头 + 暗铜帘杆。厚度：墙面 ≤0.12 m，窗帘离窗 ≥0.35 m。
#   m11/dr_desk.glb   大班台 3.34×0.89×1.52（原点底面中心，+z = 访客侧/南）：双柜体、访客面凸芯板 + 暗铜包角、局长侧抽屉 + 铜吊环拉手、
#                     酒红褐皮面嵌心 + 铜压边、台面胡桃线脚。
#   m11/dr_cred.glb   背后矮书柜 2.6×0.95×0.5（+z 朝房内）：框芯门 ×4 + 上层开格书 + 铜拉手。
#   m11/dr_cab.glb    文件柜 0.52×1.32×0.62（+z 正面）：暗暖灰搪瓷四屉、铜标签框 / 拉手。
#   m11/dr_flag.glb   局旗旗架：暗铜三足座 + 胡桃旗杆 2.5 m + 铜矛头 + 酒红褐垂旗（褶）+ 暗铜流苏。
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from m1_lib import mat, box, cyl, finish, reset
import m1_lib

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PREV = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)
if PREV != '-': os.makedirs(PREV, exist_ok=True)

def pal():
    m1_lib._M.clear()
    return dict(
        walnut=mat('m1_walnut', (0.085, 0.045, 0.025), 0.5),
        walnutD=mat('m1_walnutDark', (0.05, 0.028, 0.016), 0.45),
        stone=mat('m1_stone', (0.36, 0.33, 0.29), 0.7),
        stoneD=mat('m1_stoneDark', (0.20, 0.185, 0.165), 0.65),
        bronze=mat('m2_bronze', (0.23, 0.15, 0.08), 0.48, 1.0),
        burg=mat('m1_burgundy', (0.16, 0.035, 0.03), 0.6),
        leather=mat('m11_leather', (0.11, 0.03, 0.022), 0.55),
        velvet=mat('m11_velvet', (0.13, 0.028, 0.024), 0.85),
        enamelD=mat('m6_enamelDark', (0.15, 0.14, 0.125), 0.5, 0.35),
        paper=mat('m1_paper', (0.78, 0.72, 0.6), 0.9),
        book=mat('m11_books', (0.2, 0.08, 0.05), 0.8),
        coffer=mat('m11_coffer', (0.085, 0.03, 0.022), 0.7),
        cloth=mat('m11_wallcloth', (0.17, 0.14, 0.11), 0.85),
    )

def render(S, name, views, lights, res=(800, 520)):
    if PREV == '-': return
    m1_lib.render(S, PREV, name, views, res=res, lights=lights)

# ---------- 房间壳 ----------
X, ZN, ZS, H = 12.85, -111.8, -92.2, 7.0
WAIN = 1.5
def wall_run(P, side, za, zb, studs, skip_upper=()):
    """东/西墙一段护墙板（z 从 za 到 zb，za > zb）。side=-1 西墙（面朝 +x），+1 东墙。studs=壁骨 z 列表。"""
    L = za - zb; zc = (za + zb) / 2; nx = -side  # 朝房内法向
    xw = side * X
    def B(m, t, h, d, off, y, z, bev=0.0):  # t=沿墙长度, d=离墙厚度, off=离墙面距离（中心）
        box(m, d, h, t, x=xw + nx * off, y=y, z=z, bev=bev)
    B(P['stoneD'], L, 0.2, 0.08, 0.04, 0.1, zc, 0.01)                   # 踢脚石
    B(P['walnutD'], L, WAIN - 0.2, 0.035, 0.0175, 0.2 + (WAIN - 0.2) / 2, zc)  # 底板
    n = max(1, round(L / 1.1)); pw = (L - 0.12 * (n + 1)) / n
    for i in range(n):
        z = za - 0.12 - pw / 2 - i * (pw + 0.12)
        B(P['walnut'], pw, 0.92, 0.025, 0.047, 0.78, z, 0.01)          # 框
        B(P['walnut'], pw - 0.22, 0.68, 0.02, 0.066, 0.78, z, 0.008)   # 凸芯
    B(P['walnutD'], L, 0.12, 0.09, 0.045, WAIN, zc, 0.015)               # 腰线
    B(P['bronze'], L, 0.014, 0.006, 0.093, WAIN - 0.075, zc)             # 暗铜条
    # 护墙以上：暖灰石饰面 + 胡桃壁骨（框芯分格）
    B(P['cloth'], L, 6.25 - WAIN - 0.06, 0.02, 0.01, (WAIN + 0.06 + 6.25) / 2, zc)
    bnd = sorted([zb] + list(studs) + [za])
    for a, b in zip(bnd, bnd[1:]):
        if b - a < 1.0 or any(lo < (a + b) / 2 < hi for lo, hi in skip_upper): continue
        za2, zb2 = b - 0.36, a + 0.36; zm = (za2 + zb2) / 2; y0, y1 = 2.0, 5.75
        for yy in (y0, y1): B(P['walnut'], za2 - zb2 + 0.05, 0.05, 0.035, 0.035, yy, zm, 0.008)
        for zz in (za2, zb2): B(P['walnut'], 0.05, y1 - y0 + 0.05, 0.035, 0.035, (y0 + y1) / 2, zz, 0.008)
    for z in studs:
        B(P['walnutD'], 0.22, 6.25 - WAIN - 0.06, 0.06, 0.03, (WAIN + 0.06 + 6.25) / 2, z, 0.01)
        B(P['bronze'], 0.012, 6.25 - WAIN - 0.06, 0.006, 0.063, (WAIN + 0.06 + 6.25) / 2, z - 0.09)
        B(P['bronze'], 0.012, 6.25 - WAIN - 0.06, 0.006, 0.063, (WAIN + 0.06 + 6.25) / 2, z + 0.09)
    B(P['walnutD'], L, 0.14, 0.06, 0.03, 6.18, zc, 0.01)                  # 顶轨
def cornice_x(P, side, za, zb):
    L = za - zb; zc = (za + zb) / 2; nx = -side; xw = side * X
    for (h, d, y, m) in ((0.16, 0.08, 6.33, 'walnutD'), (0.12, 0.16, 6.47, 'walnut'), (0.03, 0.17, 6.545, 'bronze'), (0.26, 0.24, 6.69, 'walnutD'), (0.18, 0.3, 6.91, 'walnut')):
        box(P[m], d, h, L, x=xw + nx * d / 2, y=y, z=zc, bev=0.01 if m != 'bronze' else 0)
def cornice_z(P, zw, nz, xa, xb):
    L = xb - xa; xc = (xa + xb) / 2
    for (h, d, y, m) in ((0.16, 0.08, 6.33, 'walnutD'), (0.12, 0.16, 6.47, 'walnut'), (0.03, 0.17, 6.545, 'bronze'), (0.26, 0.24, 6.69, 'walnutD'), (0.18, 0.3, 6.91, 'walnut')):
        box(P[m], L, h, d, x=xc, y=y, z=zw + nz * d / 2, bev=0.01 if m != 'bronze' else 0)

def shell():
    S = reset(); P = pal()
    # 西墙：壁炉 + 黑布画段（z −98.5…−101.5）留空；哥特柜背后照常铺板（柜体遮挡）
    wall_run(P, -1, ZS - 0.1, -98.5, [-94.3, -96.4])
    wall_run(P, -1, -101.5, ZN + 0.1, [-103.6, -106.6, -109.5])
    for z in (-98.45, -101.55): box(P['walnutD'], 0.1, 6.25, 0.14, x=-X + 0.05, y=3.125, z=z, bev=0.012)  # 壁炉段两侧收口壁柱
    # 东墙：机要室内（保险柜 z −97、挂画 z −99.2 y1.55–2.25）→ 只做墙裙，挂画段上方无壁骨
    wall_run(P, 1, ZS - 0.1, ZN + 0.1, [-94.4, -102.2, -105.6, -109.0], skip_upper=[(-102.2, -94.4)])
    cornice_x(P, -1, ZS, ZN); cornice_x(P, 1, ZS, ZN)
    cornice_z(P, ZN, 1, -X, X)                       # 北墙
    for (a, b) in ((-X, -9.4), (9.4, X), (-9.4, 9.4)): cornice_z(P, ZS, -1, a, b)  # 南墙（门洞上方 5.2 m 以上照做）
    # 格子天花（底 6.55，顶 7.0）
    ys = 6.55
    box(P['coffer'], 2 * X, 0.04, ZS - ZN, x=0, y=6.96, z=(ZS + ZN) / 2)
    nxg, nzg = 10, 8
    for i in range(nxg + 1):
        x = -X + i * (2 * X / nxg)
        box(P['walnutD'], 0.3, 0.38, ZS - ZN, x=x, y=ys + 0.19, z=(ZS + ZN) / 2, bev=0.012)
    cw, cd = 2 * X / nxg, (ZS - ZN) / nzg
    for i in range(nxg):
        for j in range(nzg):
            cx = -X + (i + 0.5) * cw; cz = ZN + (j + 0.5) * cd
            box(P['walnut'], cw - 0.3, 0.06, cd - 0.3, x=cx, y=ys + 0.35, z=cz)       # 二级退台
            box(P['bronze'], cw - 0.6, 0.008, cd - 0.6, x=cx, y=ys + 0.322, z=cz)                # 暗铜嵌线（格心外露一圈）
            box(P['coffer'], cw - 0.66, 0.02, cd - 0.66, x=cx, y=ys + 0.31, z=cz)       # 酒红褐格心
    # 北窗：落地丝绒窗帘 + 帘头 + 帘杆
    zc = ZN + 0.5
    for k in range(-2, 3):
        x0 = k * 4.6
        box(P['walnutD'], 4.5, 0.42, 0.16, x=x0, y=5.42, z=zc + 0.12, bev=0.015)        # 帘头
        box(P['bronze'], 4.5, 0.02, 0.008, x=x0, y=5.27, z=zc + 0.205)
        cyl(P['bronze'], 0.022, 4.6, x=x0, y=5.12, z=zc, axis='x', n=12)
        for sx in (-1, 1):
            cyl(P['bronze'], 0.045, 0.06, x=x0 + sx * 2.3, y=5.12, z=zc, axis='x', n=16)
            for f in range(6):                                                       # 褶裥
                xf = x0 + sx * (1.78 + f * 0.085)
                cyl(P['velvet'], 0.05, 5.0, x=xf, y=2.56, z=zc + (0.03 if f % 2 else -0.03), n=10)
            box(P['bronze'], 0.08, 0.05, 0.16, x=x0 + sx * 2.0, y=1.25, z=zc + 0.06)     # 束带钩
    finish(S, f'{OUT}/dr_shell.glb', 'dr_shell')
    L = [((-8, 4, -98), 4000, (1, .85, .7)), ((6, 4, -106), 4000, (1, .82, .66)), ((0, 5, -110), 2500, (1, .8, .6))]
    render(S, 'm11_shell', [((10, 2.2, -94), (-12, 3.2, -104), 26), ((0, 1.7, -93.5), (0, 4.8, -111), 22)], L, res=(640, 420))

# ---------- 大班台 ----------
def desk():
    S = reset(); P = pal(); W, D, T = 3.34, 1.52, 0.89
    fz = 0.69  # 柜体访客面（+z）
    for sx in (-1, 1):
        x = sx * 1.15
        box(P['walnutD'], 1.0, 0.08, 1.42, x=x, y=0.04, z=0, bev=0.012)                 # 底座
        box(P['walnut'], 0.95, 0.74, 1.38, x=x, y=0.08 + 0.37, z=0, bev=0.01)           # 柜体
        # 访客面：凸芯板 + 铜珠边 + 包角
        box(P['walnutD'], 0.78, 0.56, 0.02, x=x, y=0.46, z=fz, bev=0.006)
        box(P['walnut'], 0.6, 0.4, 0.02, x=x, y=0.46, z=fz + 0.016, bev=0.008)
        for (w, h, dx, dy) in ((0.8, 0.012, 0, 0.285), (0.8, 0.012, 0, -0.285 + 0.0), (0.012, 0.58, 0.395, 0), (0.012, 0.58, -0.395, 0)):
            box(P['bronze'], w, h, 0.008, x=x + dx, y=0.46 + dy, z=fz + 0.012)
        for ex in (-1, 1):
            box(P['bronze'], 0.035, 0.74, 0.035, x=x + ex * 0.475, y=0.45, z=fz - 0.0, bev=0.004)   # 铜包角
        # 侧面凸芯板
        for ez in (-1,):
            pass
        box(P['walnut'], 0.02, 0.5, 1.0, x=x + sx * 0.48, y=0.46, z=0, bev=0.008)
        # 局长侧抽屉 ×3 + 铜吊环
        for k in range(3):
            yy = 0.2 + k * 0.22
            box(P['walnut'], 0.84, 0.19, 0.02, x=x, y=yy, z=-0.69 - 0.005, bev=0.006)
            box(P['bronze'], 0.16, 0.035, 0.012, x=x, y=yy + 0.03, z=-0.705)
            box(P['bronze'], 0.12, 0.012, 0.014, x=x, y=yy - 0.015, z=-0.715, rx=0.4)
    # 中段：访客面凹进挡板 + 局徽圆章；局长侧中屉
    box(P['walnutD'], 1.36, 0.6, 0.04, x=0, y=0.5, z=fz - 0.08, bev=0.006)
    box(P['walnut'], 1.1, 0.42, 0.02, x=0, y=0.5, z=fz - 0.055, bev=0.008)
    cyl(P['bronze'], 0.09, 0.015, x=0, y=0.52, z=fz - 0.04, axis='z', n=32)
    cyl(P['walnutD'], 0.06, 0.016, x=0, y=0.52, z=fz - 0.035, axis='z', n=5)
    box(P['walnut'], 1.36, 0.1, 1.3, x=0, y=0.77, z=0)
    box(P['walnut'], 1.2, 0.08, 0.02, x=0, y=0.77, z=-0.66, bev=0.005)
    box(P['bronze'], 0.2, 0.025, 0.012, x=0, y=0.77, z=-0.675)
    # 台面：线脚 + 铜边 + 皮面嵌心
    box(P['walnutD'], W - 0.04, 0.035, D - 0.04, x=0, y=0.8375, z=0, bev=0.012)
    box(P['bronze'], W - 0.02, 0.012, D - 0.02, x=0, y=0.858, z=0)
    box(P['walnut'], W, 0.028, D, x=0, y=0.876, z=0, bev=0.012)
    box(P['leather'], 2.5, 0.004, 0.9, x=0, y=0.891, z=-0.1)
    for (w, d, dx, dz) in ((2.54, 0.012, 0, 0.36), (2.54, 0.012, 0, -0.56), (0.012, 0.93, 1.27, -0.1), (0.012, 0.93, -1.27, -0.1)):
        box(P['bronze'], w, 0.006, d, x=dx, y=0.892, z=dz)
    finish(S, f'{OUT}/dr_desk.glb', 'dr_desk', cube=0.5)
    L = [((2.2, 2.4, 2.6), 420, (1, .88, .75)), ((-2.5, 1.6, -1.8), 200, (1, .85, .7))]
    render(S, 'm11_desk', [((2.6, 1.7, 3.2), (0, 0.5, 0), 34), ((-2.3, 1.9, -2.6), (0, 0.6, 0), 34)], L)

# ---------- 背后矮书柜 ----------
def cred():
    S = reset(); P = pal(); W, Hh, D = 2.6, 0.95, 0.5
    box(P['walnutD'], W + 0.04, 0.08, D - 0.02, y=0.04, z=-0.01, bev=0.01)
    box(P['walnut'], W, Hh - 0.12, D, y=0.08 + (Hh - 0.12) / 2, z=0, bev=0.008)
    box(P['walnutD'], W + 0.08, 0.04, D + 0.05, y=Hh - 0.02, z=0.01, bev=0.01)
    dw = (W - 0.1) / 4
    for i in range(4):
        x = -W / 2 + 0.05 + dw / 2 + i * dw
        box(P['walnutD'], dw - 0.04, 0.52, 0.02, x=x, y=0.36, z=D / 2 + 0.01, bev=0.005)
        box(P['walnut'], dw - 0.2, 0.38, 0.02, x=x, y=0.36, z=D / 2 + 0.025, bev=0.007)
        box(P['bronze'], 0.02, 0.1, 0.02, x=x + (0.25 if i % 2 == 0 else -0.25), y=0.42, z=D / 2 + 0.035, bev=0.003)
    # 上层开格
    box(P['walnutD'], W - 0.06, 0.2, D - 0.1, y=0.76, z=0.06)
    for i in range(5): box(P['walnut'], 0.03, 0.2, D - 0.08, x=-W / 2 + 0.04 + i * (W - 0.08) / 4, y=0.76, z=0.06)
    import random; random.seed(11)
    for i in range(4):
        x0 = -W / 2 + 0.07 + i * (W - 0.08) / 4
        x = x0
        while x < x0 + (W - 0.08) / 4 - 0.08:
            t = random.uniform(0.025, 0.05); h = random.uniform(0.14, 0.18)
            box(P['book'] if random.random() < 0.7 else P['burg'], t, h, 0.2, x=x + t / 2, y=0.665 + h / 2, z=0.08); x += t + 0.004
    finish(S, f'{OUT}/dr_cred.glb', 'dr_cred', cube=0.5)
    L = [((1.5, 2.0, 2.4), 300, (1, .88, .75))]
    render(S, 'm11_cred', [((1.6, 1.4, 2.6), (0, 0.5, 0), 36)], L)

# ---------- 文件柜 ----------
def cab():
    S = reset(); P = pal(); W, Hh, D = 0.52, 1.32, 0.62
    box(P['enamelD'], W - 0.04, 0.06, D - 0.04, y=0.03, z=-0.01)
    box(P['enamelD'], W, Hh - 0.06, D, y=0.06 + (Hh - 0.06) / 2, z=0, bev=0.008)
    for k in range(4):
        yy = 0.2 + k * 0.3
        box(P['enamelD'], W - 0.04, 0.27, 0.015, y=yy, z=D / 2 + 0.008, bev=0.004)
        box(P['bronze'], 0.1, 0.05, 0.006, y=yy + 0.07, z=D / 2 + 0.018)
        box(P['paper'], 0.08, 0.032, 0.003, y=yy + 0.07, z=D / 2 + 0.022)
        box(P['bronze'], 0.14, 0.02, 0.03, y=yy - 0.02, z=D / 2 + 0.03, bev=0.004)
    finish(S, f'{OUT}/dr_cab.glb', 'dr_cab', cube=0.5)
    L = [((1.2, 2.0, 2.0), 220, (1, .88, .75))]
    render(S, 'm11_cab', [((1.1, 1.3, 1.7), (0, 0.66, 0), 38)], L)

# ---------- 局旗 ----------
def flag():
    S = reset(); P = pal()
    cyl(P['bronze'], 0.2, 0.04, y=0.02, n=32)
    cyl(P['bronze'], 0.12, 0.12, y=0.1, n=24, r2=0.05)
    for a in range(3):
        ang = a * 2 * math.pi / 3
        box(P['bronze'], 0.05, 0.03, 0.22, x=math.sin(ang) * 0.17, y=0.015, z=math.cos(ang) * 0.17, ry=ang)
    cyl(P['walnutD'], 0.022, 2.4, y=0.16 + 1.2, n=12)
    for yy in (0.6, 1.4): cyl(P['bronze'], 0.026, 0.03, y=yy, n=12)
    cyl(P['bronze'], 0.035, 0.06, y=2.59, n=12)
    cyl(P['bronze'], 0.04, 0.16, y=2.7, n=8, r2=0.0)
    # 垂旗：贴杆挂下，褶皱（窄条错位）
    for i in range(10):
        x = 0.06 + i * 0.075
        box(P['velvet'], 0.08, 1.15, 0.012, x=x, y=2.45 - 0.575, z=0.02 * math.sin(i * 1.3), ry=0.25 * math.cos(i * 1.3))
    box(P['bronze'], 0.76, 0.03, 0.03, x=0.42, y=1.3, z=0.0)
    cyl(P['bronze'], 0.06, 0.006, x=0.42, y=1.95, z=0.03, axis='z', n=24)
    finish(S, f'{OUT}/dr_flag.glb', 'dr_flag', cube=0.5)
    L = [((1.5, 2.6, 2.2), 380, (1, .88, .75))]
    render(S, 'm11_flag', [((1.6, 1.6, 4.2), (0.3, 1.4, 0), 32)], L)

for f in argv[2].split(','): globals()[f]()
