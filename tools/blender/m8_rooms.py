# 批次 M8（续 M5）：装裱——护墙板加高 1.2 m + 胡桃竖向壁骨把牛皮纸墙分格（铜压边）+ 天花格心酒红褐 + 作战室机关陈设/铜链灯组/行军床。
# 原 M5：第七局 作战室 seventh_ops / 杀青室 seventh_wrap / 回写台 seventh_rewrite 精建壳 + 关键装置。
# 用法：blender.sh -b -P m5_rooms.py -- <outdir> <prevdir> [ops|wrap|rewrite ...]
# 世界坐标（相对 y=SY），游戏端 o.position.set(0, SY, 0) 直接放；材质名沿用 m1_*（游戏端 m1Mats 换 pbr）。
# 原牛皮纸墙内皮：x0+0.2 / x1-0.2，北墙 z0-0.2，南墙 z1+0.2。所有件贴内皮向内 ≤0.14（壁柱），锚点处留空。
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
from m1_lib import reset, palette, box, cyl, finish, render

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PREV = argv[0], argv[1]
WHICH = argv[2:] or ['ops', 'wrap', 'rewrite']

def wall_run(P, axis, c, inward, a, b, h, skip=(), pils=()):
    """沿墙一段：石踢脚 + 胡桃框芯护墙板 + 腰线 + 石檐口（檐口不受 skip 限制）。axis='x' 表示墙沿 x 走（南北墙），c 为墙内皮坐标。"""
    def put(m, along0, along1, y0, y1, d0, d1, bev=0.0):
        L = along1 - along0
        if L <= 0.02: return
        mid = (along0 + along1) / 2; dc = c + inward * (d0 + d1) / 2; D = d1 - d0
        if axis == 'x': box(m, L, y1 - y0, D, mid, (y0 + y1) / 2, dc, bev=bev)
        else: box(m, D, y1 - y0, L, dc, (y0 + y1) / 2, mid, bev=bev)
    segs = [(a, b)]
    for (s0, s1) in skip:
        nxt = []
        for (u, v) in segs:
            if s1 <= u or s0 >= v: nxt.append((u, v)); continue
            if s0 > u: nxt.append((u, s0))
            if s1 < v: nxt.append((s1, v))
        segs = nxt
    for (u, v) in segs:
        put(P['stoneD'], u, v, 0, 0.24, 0, 0.07, 0.01)                 # 踢脚
        put(P['walnutD'], u, v, 0.24, 1.12, 0, 0.03)                   # 护墙底板（M8：加高到 1.2 m）
        n = max(1, round((v - u) / 1.25)); w = (v - u) / n
        for i in range(n):                                             # 框芯
            p0 = u + i * w + 0.07; p1 = u + (i + 1) * w - 0.07
            put(P['walnut'], p0, p1, 0.32, 1.04, 0.03, 0.045, 0.008)
            put(P['walnutD'], p0 + 0.08, p1 - 0.08, 0.40, 0.96, 0.045, 0.052, 0.004)
        put(P['walnut'], u, v, 1.12, 1.2, 0, 0.06, 0.01)               # 腰线
        put(P['bronze'], u, v, 1.2, 1.225, 0, 0.04)                    # 腰线铜条
    # M8：护墙板以上胡桃竖向壁骨分格（每格 1.5–2 m）+ 铜压边，格顶接檐口下的胡桃顶轨；壁柱处不重复
    top = h - 0.38
    for (u, v) in segs:
        if v - u < 0.6: continue
        put(P['walnut'], u, v, top - 0.16, top, 0, 0.05, 0.008)        # 顶轨
        put(P['bronze'], u, v, top - 0.18, top - 0.16, 0, 0.035)
        n = max(1, round((v - u) / 1.75)); w = (v - u) / n
        for i in range(n + 1):
            at = u + i * w
            if any(abs(at - q) < 0.45 for q in pils): continue
            a0 = max(u, at - 0.07); a1 = min(v, at + 0.07)
            put(P['walnut'], a0, a1, 1.225, top - 0.16, 0, 0.055, 0.008)
            for e in (a0, a1 - 0.02):
                if a0 <= e <= a1 - 0.02: put(P['bronze'], e, e + 0.02, 1.225, top - 0.16, 0.0, 0.062)
    put(P['stone'], a, b, h - 0.38, h - 0.22, 0, 0.08, 0.01)           # 檐口三级
    put(P['burg'], a, b, h - 0.22, h - 0.12, 0, 0.05)
    put(P['stone'], a, b, h - 0.12, h - 0.02, 0, 0.13, 0.01)

def pilaster(P, axis, c, inward, at, h, w=0.5):
    """石壁柱：基座 / 柱身四槽 / 铜箍柱头。"""
    def pb(m, sw, y0, y1, d, bev=0.01):
        dc = c + inward * d / 2
        if axis == 'x': box(m, sw, y1 - y0, d, at, (y0 + y1) / 2, dc, bev=bev)
        else: box(m, d, y1 - y0, sw, dc, (y0 + y1) / 2, at, bev=bev)
    pb(P['stoneD'], w + 0.12, 0, 0.32, 0.18)
    pb(P['stone'], w + 0.06, 0.32, 0.42, 0.15)
    pb(P['stone'], w, 0.42, h - 0.62, 0.12, 0.012)
    for k in (-1.5, -0.5, 0.5, 1.5):                                    # 凹槽（深色嵌条读作阴影）
        off = k * w / 5
        dc = c + inward * 0.122
        if axis == 'x': box(P['stoneD'], 0.035, h - 1.3, 0.01, at + off, (h - 0.2) / 2 + 0.11, dc)
        else: box(P['stoneD'], 0.01, h - 1.3, 0.035, dc, (h - 0.2) / 2 + 0.11, at + off)
    pb(P['bronze'], w + 0.04, h - 0.62, h - 0.56, 0.14)
    pb(P['stone'], w + 0.14, h - 0.56, h - 0.38, 0.17)

def casing(P, axis, c, inward, g0, g1, gh, both=True):
    """门套：石门樘 + 楣 + 铜内框（两面）。"""
    for side in ((1, -1) if both else (1,)):
        ci = c if side == 1 else c - inward * 0.4
        iw = inward * side
        for x in (g0 - 0.16, g1 + 0.16):
            if axis == 'x': box(P['stone'], 0.32, gh + 0.2, 0.1, x, (gh + 0.2) / 2, ci + iw * 0.05, bev=0.01)
            else: box(P['stone'], 0.1, gh + 0.2, 0.32, ci + iw * 0.05, (gh + 0.2) / 2, x, bev=0.01)
        L = g1 - g0 + 0.8; mid = (g0 + g1) / 2
        if axis == 'x':
            box(P['stone'], L, 0.34, 0.12, mid, gh + 0.37, ci + iw * 0.06, bev=0.012)
            box(P['burg'], L - 0.3, 0.08, 0.13, mid, gh + 0.44, ci + iw * 0.065)
            box(P['bronze'], g1 - g0 + 0.06, 0.04, 0.03, mid, gh + 0.02, ci + iw * 0.115)
        else:
            box(P['stone'], 0.12, 0.34, L, ci + iw * 0.06, gh + 0.37, mid, bev=0.012)
            box(P['burg'], 0.13, 0.08, L - 0.3, ci + iw * 0.065, gh + 0.44, mid)
            box(P['bronze'], 0.03, 0.04, g1 - g0 + 0.06, ci + iw * 0.115, gh + 0.02, mid)
        for x in (g0 - 0.015, g1 + 0.015):
            if axis == 'x': box(P['bronze'], 0.03, gh, 0.03, x, gh / 2, ci + iw * 0.115)
            else: box(P['bronze'], 0.03, gh, 0.03, ci + iw * 0.115, gh / 2, x)

def ceiling(P, x0, x1, z0, z1, h, step=2.5):
    """胡桃纵梁（与原牛皮纸横梁成井字藻井）+ 铜角花。"""
    xi0, xi1 = x0 + 0.2, x1 - 0.2
    n = max(2, round((xi1 - xi0) / step)); s = (xi1 - xi0) / n
    for i in range(1, n):
        x = xi0 + i * s
        box(P['walnutD'], 0.26, 0.42, (z0 - z1) - 0.4, x, h - 0.21, (z0 + z1) / 2, bev=0.012)
        box(P['bronze'], 0.06, 0.03, (z0 - z1) - 0.4, x, h - 0.435, (z0 + z1) / 2)
        z = z0 - 2.0
        while z > z1 + 0.5:                                              # 与原牛皮纸横梁交点：铜角花
            cyl(P['bronze'], 0.11, 0.04, x, h - 0.45, z, n=16); z -= 3.0
    # M8：格心酒红褐 + 铜嵌线（纵梁之间 × 原牛皮纸横梁之间，横梁 z0−2−3k）
    zs_ = [z0 - 0.2] + [z0 - 2.0 - 3.0 * k for k in range(20) if z0 - 2.0 - 3.0 * k > z1 + 0.5] + [z1 + 0.2]
    xs_ = [xi0 + 0.3] + [xi0 + i * s for i in range(1, n)] + [xi1 - 0.3]
    for i in range(len(xs_) - 1):
        for j in range(len(zs_) - 1):
            cxm = (xs_[i] + xs_[i + 1]) / 2; czm = (zs_[j] + zs_[j + 1]) / 2
            wx = xs_[i + 1] - xs_[i] - 0.5; wz = zs_[j] - zs_[j + 1] - 0.55
            if wx < 0.3 or wz < 0.3: continue
            box(P['burg'], wx, 0.02, wz, cxm, h - 0.012, czm)
            box(P['bronze'], wx + 0.06, 0.012, 0.03, cxm, h - 0.028, czm - wz / 2); box(P['bronze'], wx + 0.06, 0.012, 0.03, cxm, h - 0.028, czm + wz / 2)
            box(P['bronze'], 0.03, 0.012, wz, cxm - wx / 2, h - 0.028, czm); box(P['bronze'], 0.03, 0.012, wz, cxm + wx / 2, h - 0.028, czm)
    for x in (xi0 + 0.15, xi1 - 0.15):
        box(P['walnut'], 0.3, 0.3, (z0 - z1) - 0.4, x, h - 0.15, (z0 + z1) / 2, bev=0.01)

def room_shell(P, x0, x1, z0, z1, h, gapN, gapS, pilW, pilE, pilS=(), skipW=(), skipE=(), skipS=(), skipN=(), gh=3.4):
    xi0, xi1, zn, zs = x0 + 0.2, x1 - 0.2, z0 - 0.2, z1 + 0.2
    wall_run(P, 'z', xi0, 1, zs, zn, h, skipW, list(pilW) + [zn - 0.25, zs + 0.25]); wall_run(P, 'z', xi1, -1, zs, zn, h, skipE, list(pilE) + [zn - 0.25, zs + 0.25])
    wall_run(P, 'x', zn, -1, xi0, xi1, h, list(skipN) + ([gapN] if gapN else []), [xi0, xi1])
    wall_run(P, 'x', zs, 1, xi0, xi1, h, list(skipS) + ([gapS] if gapS else []), list(pilS) + [xi0, xi1])
    for z in pilW: pilaster(P, 'z', xi0, 1, z, h)
    for z in pilE: pilaster(P, 'z', xi1, -1, z, h)
    for x in pilS: pilaster(P, 'x', zs, 1, x, h)
    for zz in (zn, zs):                                                  # 墙角柱
        for (xx, inw) in ((xi0 + 0.25, 1), (xi1 - 0.25, -1)):
            pilaster(P, 'z', xi0 if inw == 1 else xi1, inw, zz + (-0.25 if zz == zn else 0.25), h, 0.4)
    if gapN: casing(P, 'x', zn, -1, gapN[0], gapN[1], gh)
    ceiling(P, x0, x1, z0, z1, h)

# ----------------------------------------------------------------- 作战室
def build_ops(P):
    Y0 = 0
    room_shell(P, -10, 10, -112, -134, 6, (-2.2, 2.2), (-1.4, 1.4),
               pilW=[-124.6, -128.8], pilE=[-118.6, -128.6],
               skipE=[(-126.3, -119.7)], skipS=[(-4.2, 4.2)], gh=3.6)
    # 标图墙：给原叛徒连线墙（x 9.75 z −126…−120 y 1…5）加胡桃框 + 铜内唇 + 顶部铜轨与标题楣
    X = 9.8
    for z in (-126.18, -119.82):
        box(P['walnut'], 0.09, 4.5, 0.16, X - 0.045, 3.0, z, bev=0.01)
    for y in (0.82, 5.18):
        box(P['walnut'], 0.09, 0.16, 6.52, X - 0.045, y, -123, bev=0.01)
    for z in (-126.08, -119.92): box(P['bronze'], 0.035, 4.1, 0.025, X - 0.1, 3.0, z)
    for y in (0.92, 5.08): box(P['bronze'], 0.035, 0.025, 6.14, X - 0.1, y, -123)
    box(P['bronze'], 0.03, 0.03, 6.8, X - 0.16, 5.42, -123)                       # 吊图铜轨
    for z in (-126.3, -123, -119.7): box(P['bronze'], 0.14, 0.05, 0.05, X - 0.08, 5.42, z)
    box(P['stone'], 0.08, 0.26, 3.0, X - 0.04, 5.58, -123, bev=0.01)               # 标题楣
    box(P['burg'], 0.085, 0.14, 2.7, X - 0.045, 5.58, -123)
    box(P['walnutD'], 0.18, 0.06, 6.5, X - 0.09, 0.76, -123, bev=0.01)              # 图钉槽托
    # 作战沙盘（中心 −4.3, −121.3；2.4 × 3.0）
    cx, cz, W, Dp = -4.3, -121.3, 2.4, 3.0
    box(P['stoneD'], W + 0.16, 0.12, Dp + 0.16, cx, 0.06, cz, bev=0.015)
    box(P['walnutD'], W - 0.2, 0.62, Dp - 0.2, cx, 0.43, cz, bev=0.01)
    for sx in (-1, 1):
        for sz in (-1, 1):
            box(P['walnut'], 0.16, 0.66, 0.16, cx + sx * (W / 2 - 0.08), 0.45, cz + sz * (Dp / 2 - 0.08), bev=0.015)
            box(P['bronze'], 0.18, 0.04, 0.18, cx + sx * (W / 2 - 0.08), 0.16, cz + sz * (Dp / 2 - 0.08))
    for sx in (-1, 1):                                                              # 侧板框芯
        box(P['walnut'], 0.02, 0.4, Dp - 0.5, cx + sx * (W / 2 - 0.09), 0.45, cz, bev=0.005)
    for sz in (-1, 1):
        box(P['walnut'], W - 0.5, 0.4, 0.02, cx, 0.45, cz + sz * (Dp / 2 - 0.09), bev=0.005)
    box(P['walnut'], W, 0.08, Dp, cx, 0.8, cz, bev=0.02)                            # 台框
    box(P['bronze'], W + 0.02, 0.025, Dp + 0.02, cx, 0.85, cz)                      # 铜压边
    box(P['kraft'], W - 0.24, 0.03, Dp - 0.24, cx, 0.855, cz)                       # 沙盘底（牛皮纸地形）
    rnd = random.Random(7)
    for i in range(7):                                                              # 街区块
        for j in range(9):
            if (i == 3) or (j == 4) or rnd.random() < 0.18: continue                # 中轴路与空地
            bx = cx - (W - 0.4) / 2 + (i + 0.5) * (W - 0.4) / 7; bz = cz - (Dp - 0.4) / 2 + (j + 0.5) * (Dp - 0.4) / 9
            hh = 0.02 + rnd.random() ** 2 * 0.14
            box(P['paper'] if rnd.random() < 0.7 else P['stone'], 0.2, hh, 0.22, bx, 0.87 + hh / 2, bz)
    box(P['stoneD'], 0.18, 0.012, Dp - 0.3, cx, 0.876, cz)                          # 主路
    box(P['stoneD'], W - 0.3, 0.012, 0.16, cx, 0.876, cz)
    for (fx, fz) in ((-0.6, -0.9), (0.4, 0.3), (-0.2, 1.1), (0.75, -0.55), (-0.85, 0.5)):  # 酒红褐标旗
        cyl(P['bronze'], 0.006, 0.22, cx + fx, 0.98, cz + fz, n=6)
        box(P['burg'], 0.09, 0.055, 0.004, cx + fx + 0.045, 1.06, cz + fz)
    for (a, b2) in (((-0.6, -0.9), (0.4, 0.3)), ((0.4, 0.3), (-0.2, 1.1)), ((0.75, -0.55), (0.4, 0.3))):   # 红线连标
        (ax, az), (bx_, bz_) = a, b2; L = math.hypot(bx_ - ax, bz_ - az)
        box(P['thread'], 0.008, 0.008, L, cx + (ax + bx_) / 2, 1.03, cz + (az + bz_) / 2, ry=math.atan2(bx_ - ax, bz_ - az))
    # 沙盘吊灯（铜链 + 碗罩）
    # M8：铜链灯组——横担（胡桃 + 铜）吊三盏碗灯，沿沙盘长向
    box(P['walnutD'], 0.12, 0.1, 2.6, cx, 4.2, cz, bev=0.01); box(P['bronze'], 0.14, 0.02, 2.62, cx, 4.14, cz)
    for dz in (-1.2, 1.2): cyl(P['bronze'], 0.012, 1.6, cx, 5.0, cz + dz, n=6)            # 吊链到天花
    for dz in (-1.05, 0.0, 1.05):
        cyl(P['bronze'], 0.01, 0.75, cx, 3.78, cz + dz, n=6)
        cyl(P['bronze'], 0.3, 0.14, cx, 3.35, cz + dz, n=32, r2=0.12)
        cyl(P['paper'], 0.26, 0.02, cx, 3.27, cz + dz, n=32)
    build_ops_furniture(P)

def phone(P, x, y, z):
    box(P['iron'], 0.2, 0.06, 0.24, x, y + 0.03, z, bev=0.01); cyl(P['bronze'], 0.06, 0.012, x, y + 0.066, z + 0.02, n=16)
    box(P['iron'], 0.05, 0.04, 0.24, x - 0.06, y + 0.1, z, bev=0.01)

def build_ops_furniture(P):
    """平面规划 work/r3/m8/plans/plan_ops_m8.png：西墙两壁柱间电话台 ×3（面西，靠墙成排）+ 总机板；南墙西段标图柜 ×3 成排；北墙西段行军床 ×2 替双层铁床。"""
    XW = -9.8
    # 西墙电话台 ×3（z −122.95 / −123.85 避 柒 字 z≥−122.7；−125.6 / −126.5 / −127.4 在壁柱 −124.6 与 K 笔记 −127.9 之间 → 取 3 台：−123.6、−125.7、−127.15）
    for zc in (-123.55, -125.65, -127.1):
        box(P['walnut'], 0.58, 0.05, 0.95, XW + 0.49, 0.76, zc, bev=0.01)                     # 台面
        box(P['walnutD'], 0.5, 0.7, 0.9, XW + 0.47, 0.38, zc, bev=0.008)                      # 台柜
        for k in range(2): box(P['walnut'], 0.02, 0.26, 0.38, XW + 0.73, 0.22 + k * 0.3, zc + (k - 0.5) * 0.0, bev=0.004)
        box(P['bronze'], 0.02, 0.025, 0.1, XW + 0.745, 0.5, zc)
        phone(P, XW + 0.5, 0.785, zc - 0.22)
        box(P['paper'], 0.22, 0.004, 0.3, XW + 0.55, 0.787, zc + 0.2, ry=0.1)
        box(P['walnutD'], 0.03, 0.7, 0.8, XW + 0.235, 1.6, zc, bev=0.006)                     # 总机板
        for r in range(3):
            for c in range(5): cyl(P['bronze'], 0.018, 0.02, XW + 0.255, 1.4 + r * 0.18, zc - 0.28 + c * 0.14, axis='x', n=10)
        box(P['burg'], 0.02, 0.06, 0.5, XW + 0.255, 1.88, zc)
    # 南墙西段标图柜（平抽档案柜，斜面绘图板）×3：x −9.4…−4.85，背靠南墙内皮 z −133.8
    ZS = -133.8
    for xc in (-8.75, -7.25, -5.75):
        box(P['stoneD'], 1.44, 0.08, 0.86, xc, 0.04, ZS + 0.45, bev=0.01)
        box(P['walnutD'], 1.4, 0.82, 0.82, xc, 0.49, ZS + 0.45, bev=0.008)
        for r in range(5):                                                                    # 平抽
            box(P['walnut'], 1.28, 0.13, 0.02, xc, 0.18 + r * 0.155, ZS + 0.865, bev=0.004)
            box(P['bronze'], 0.16, 0.022, 0.02, xc, 0.2 + r * 0.155, ZS + 0.88)
        box(P['walnut'], 1.42, 0.04, 0.8, xc, 0.98, ZS + 0.48, bev=0.008, rx=-0.12)
        box(P['bronze'], 1.42, 0.02, 0.02, xc, 0.93, ZS + 0.89)                               # 前沿挡铅条
        box(P['kraft'], 1.1, 0.006, 0.62, xc, 1.005, ZS + 0.5, rx=-0.12)                     # 摊开的地图
    # 北墙西段：值班行军床 ×2（铁管架 + 帆布 + 深色毯），替原白色双层铁床；位置/朝向同原床（长向沿 x，床头靠北墙）
    for xc in (-6.9, -4.3):
        zc = -112.2 - 0.62
        for sx in (-1, 1):
            cyl(P['iron'], 0.018, 1.9, xc, 0.42, zc + sx * 0.33, axis='x', n=8)
            for k in (-0.85, 0.85):
                b = cyl(P['iron'], 0.014, 0.6, xc + k, 0.21, zc + sx * 0.17, n=6); b.rotation_euler = (sx * 0.55, 0, 0)
        box(P['stoneD'], 1.86, 0.03, 0.62, xc, 0.44, zc, bev=0.005)                          # 帆布
        box(P['burg'], 1.3, 0.06, 0.66, xc + 0.25, 0.48, zc, bev=0.02)                       # 深色毯
        box(P['walnutD'], 0.4, 0.08, 0.5, xc - 0.68, 0.49, zc, bev=0.03)                     # 枕

# ----------------------------------------------------------------- 杀青室
def build_wrap(P):
    room_shell(P, -8, 8, -134, -158, 5.4, (-1.4, 1.4), (-1.6, 1.6),
               pilW=[-140.3, -144.9, -149.5, -154.3], pilE=[-140.3, -144.9, -149.5, -154.3],
               skipS=[(-0.95, 0.95)], gh=3.4)
    # 定稿台：给原档案袋木台（0, −146；3.4×0.9×0.9）加石台座 + 胡桃框芯外饰 + 铜腰带（台面不动，档案袋锚点不动）
    cx, cz = 0, -146
    box(P['stoneD'], 3.72, 0.12, 1.22, cx, 0.06, cz, bev=0.015)
    for sz in (-1, 1):
        box(P['walnut'], 3.48, 0.7, 0.03, cx, 0.47, cz + sz * 0.465, bev=0.006)
        for k in range(3):
            box(P['walnutD'], 0.95, 0.46, 0.012, cx - 1.1 + k * 1.1, 0.47, cz + sz * 0.484, bev=0.004)
        box(P['bronze'], 3.5, 0.03, 0.02, cx, 0.86, cz + sz * 0.48)
    for sx in (-1, 1):
        box(P['walnut'], 0.03, 0.7, 0.98, cx + sx * 1.715, 0.47, cz, bev=0.006)
        box(P['bronze'], 0.02, 0.03, 0.98, cx + sx * 1.73, 0.86, cz)
        for sz in (-1, 1): box(P['walnut'], 0.1, 0.8, 0.1, cx + sx * 1.72, 0.48, cz + sz * 0.47, bev=0.01)
    # 落地镜铜框外再加石框 + 酒红褐楣（镜 0, −157.64）
    box(P['stone'], 2.0, 0.16, 0.1, 0, 2.95, -157.75, bev=0.01); box(P['burg'], 1.7, 0.08, 0.11, 0, 3.08, -157.75)
    for x in (-0.92, 0.92): box(P['stone'], 0.16, 2.95, 0.1, x, 1.47, -157.75, bev=0.01)

# ----------------------------------------------------------------- 回写台
def build_rewrite(P):
    room_shell(P, -9, 9, -158, -186, 9, (-1.6, 1.6), None,
               pilW=[-168.2, -173.6, -179.0, -183.4], pilE=[-163.0, -168.2, -173.6, -179.0, -183.4], pilS=[-5, -1, 1, 5],
               skipW=[(-166.2, -160.4)], gh=3.6)
    # 回写排字台：西墙 x −8.8，z −166…−160.6；铸铁座 + 胡桃字盘柜 + 斜面活字盘（铜隔条）+ 排字手托
    x0, zc, L = -8.8, -163.3, 5.2
    box(P['stoneD'], 0.9, 0.1, L + 0.1, x0 + 0.45, 0.05, zc, bev=0.012)
    box(P['walnutD'], 0.78, 0.82, L, x0 + 0.41, 0.51, zc, bev=0.01)
    for k in range(4):                                                              # 字盘抽屉面
        for r in range(3):
            box(P['walnut'], 0.02, 0.2, L / 4 - 0.1, x0 + 0.81, 0.24 + r * 0.25, zc - L / 2 + (k + 0.5) * L / 4, bev=0.005)
            box(P['bronze'], 0.02, 0.025, 0.12, x0 + 0.83, 0.26 + r * 0.25, zc - L / 2 + (k + 0.5) * L / 4)
    box(P['walnut'], 0.86, 0.05, L + 0.06, x0 + 0.43, 0.945, zc, bev=0.01)
    import bpy
    tray_rx = 0.0
    for k in range(4):                                                              # 斜面活字盘 ×4
        tz = zc - L / 2 + (k + 0.5) * L / 4
        o = box(P['walnut'], 0.62, 0.05, L / 4 - 0.08, x0 + 0.4, 1.06, tz, rz=0.0, bev=0.006)
        o.rotation_euler = (0.0, 0.32, 0.0)
        for i in range(6):
            d = box(P['bronze'], 0.6, 0.03, 0.008, x0 + 0.4, 1.09, tz - (L / 4 - 0.1) / 2 + (i + 0.5) * (L / 4 - 0.1) / 6)
            d.rotation_euler = (0.0, 0.32, 0.0)
        for i in range(4):
            d = box(P['bronze'], 0.008, 0.03, L / 4 - 0.1, x0 + 0.14 + i * 0.16, 1.0 + i * 0.05, tz)
    box(P['walnut'], 0.06, 0.6, L, x0 + 0.05, 1.25, zc, bev=0.008)                 # 背板
    box(P['bronze'], 0.08, 0.03, L, x0 + 0.08, 1.56, zc)
    box(P['bronze'], 0.12, 0.05, 0.3, x0 + 0.72, 1.0, zc + 0.6)                     # 排字手托
    box(P['iron'], 0.1, 0.04, 0.26, x0 + 0.72, 1.035, zc + 0.6)
    for k in range(5): box(P['paper'], 0.05, 0.004, 0.24, x0 + 0.5 + k * 0.012, 0.975, zc - 1.1 + k * 0.02)   # 校样纸
    # 中央长桌（原 0, −174，3.2×0.9×7）外加石台座 + 胡桃裙板（台面与巨书不动）
    box(P['stoneD'], 3.5, 0.1, 7.3, 0, 0.05, -174, bev=0.015)
    for sx in (-1, 1): box(P['walnut'], 0.03, 0.66, 6.9, sx * 1.615, 0.5, -174, bev=0.006)
    for sz in (-1, 1): box(P['walnut'], 3.1, 0.66, 0.03, 0, 0.5, -174 + sz * 3.515, bev=0.006)

S = None
for w in WHICH:
    import m1_lib; m1_lib._M.clear(); S = reset(); P = palette()
    {'ops': build_ops, 'wrap': build_wrap, 'rewrite': build_rewrite}[w](P)
    finish(S, f'{OUT}/{w}.glb', f'm8_{w}')
    if PREV != '-':
        views = {
            'ops': [((-1, 1.7, -113.5), (2, 1.6, -130), 50), ((6, 1.8, -117), (-6, 1.0, -124), 45), ((-6.5, 1.5, -118), (9.8, 2.5, -123), 45), ((-2, 1.7, -119), (-9.6, 1.2, -128), 55), ((0, 2.0, -126), (-7, 0.8, -114), 55), ((3, 1.5, -122), (-4.3, 3.6, -121.3), 55)],
            'wrap': [((0, 1.7, -135.5), (0, 1.4, -156), 45), ((5, 1.6, -150), (-1, 0.6, -145), 45), ((0, 2.5, -138), (0, 5.3, -150), 60)],
            'rewrite': [((0, 2.2, -159.5), (0, 3, -185), 45), ((-4, 1.7, -167), (-8.6, 1.0, -162), 50)],
        }[w]
        lights = {'ops': [((0, 5, -118), 900, (1, .8, .6)), ((-4.3, 3.0, -121.3), 300, (1, .75, .5)), ((0, 4, -130), 600, (1, .7, .5))],
                  'wrap': [((0, 4.4, -140), 800, (1, .85, .7)), ((0, 4, -152), 600, (1, .8, .6))],
                  'rewrite': [((0, 8, -170), 2200, (1, .85, .7)), ((-6, 3, -163), 400, (1, .75, .5)), ((0, 6, -182), 900, (1, .7, .5))]}[w]
        render(S, PREV, f'm8_{w}', views, lights=lights)
