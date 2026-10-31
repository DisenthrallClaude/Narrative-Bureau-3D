# 批次 M9：B6 训练场（training）主线区 hero 模块（1960–80 年代机关内部训练场）。
# 用法：blender.sh -b -P m9_training.py -- <outdir> <prevdir> bay,truss,lectern,locker
# 产出（坐标约定同 m1_lib：参数 (x, y=高, z=前后)，原点底面，正面 +z，背面 z=0）：
#   m9/tr_bay.glb     墙面一开间 8 m 宽 × 16 m 高：胡桃凸芯板墙裙 1.4 m + 踢脚石 + 腰线；暖灰石饰面分缝；两侧半壁柱（拼成 0.8 m）带柱础/柱头；
#                     高窗 3.0×3.4 m（胡桃门套式窗套、石窗台、铁窗棂、暖琥珀内透）；檐口三级线脚 + 暗铜嵌条。厚度 ≤0.36 m（壁柱 0.2）。
#   m9/tr_truss.glb   屋架一榀：64 m 跨、1.6 m 高华伦式钢桁架（暗铜褐涂装，上下弦槽钢 + 斜腹杆 + 节点板铆钉）
#   m9/tr_lectern.glb 讲台 0.72×1.15×0.56：胡桃台身、斜面台板、酒红褐前芯板 + 暗铜局徽牌，正面（听众侧）+z
#   m9/tr_locker.glb  器材柜 1.0×1.9×0.5：暖灰烤漆双开门、百叶通风口、铜标签框/拉手、底座，正面 +z
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from m1_lib import mat, box, cyl, finish, reset
import m1_lib

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PREV = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True); os.makedirs(PREV, exist_ok=True)

def pal():
    m1_lib._M.clear()
    return dict(
        walnut=mat('m1_walnut', (0.085, 0.045, 0.025), 0.5),
        walnutD=mat('m1_walnutDark', (0.05, 0.028, 0.016), 0.45),
        stone=mat('m1_stone', (0.36, 0.33, 0.29), 0.7),
        stoneD=mat('m1_stoneDark', (0.20, 0.185, 0.165), 0.65),
        bronze=mat('m2_bronze', (0.23, 0.15, 0.08), 0.48, 1.0),
        burg=mat('m1_burgundy', (0.16, 0.035, 0.03), 0.6),
        iron=mat('m1_iron', (0.05, 0.045, 0.04), 0.5, 0.9),
        rust=mat('m9_truss', (0.09, 0.055, 0.035), 0.55, 0.6),
        glow=mat('m9_glow', (0.3, 0.16, 0.05), 0.8, emit=(0.9, 0.5, 0.18)),
        enamel=mat('m6_enamel', (0.27, 0.25, 0.22), 0.5, 0.35),
        enamelD=mat('m6_enamelDark', (0.15, 0.14, 0.125), 0.5, 0.35),
        paper=mat('m1_paper', (0.78, 0.72, 0.6), 0.9),
    )

def render(S, name, views, lights, res=(720, 480)):
    m1_lib.render(S, PREV, name, views, res=res, lights=lights)

def bay():
    S = reset(); P = pal(); W, H = 8.0, 16.0
    # 石饰面（盖住旧墙）+ 横向分缝
    box(P['stone'], W, H - 1.4, 0.03, y=1.4 + (H - 1.4) / 2, z=0.015)
    for yy in [3.4 + 2.0 * k for k in range(6)]:
        if 10.0 < yy < 13.8: continue
        box(P['stoneD'], W - 0.8, 0.025, 0.012, y=yy, z=0.034)
    # 墙裙：踢脚石 + 胡桃底板 + 4 块凸芯板 + 腰线
    box(P['stoneD'], W, 0.18, 0.09, y=0.09, z=0.045, bev=0.01)
    box(P['walnutD'], W, 1.22, 0.05, y=0.18 + 0.61, z=0.025)
    pw = (W - 0.8 - 0.12 * 5) / 4
    for i in range(4):
        cx = -W / 2 + 0.4 + 0.12 + pw / 2 + i * (pw + 0.12)
        box(P['walnut'], pw, 0.86, 0.03, x=cx, y=0.79, z=0.062, bev=0.012)
        box(P['walnut'], pw - 0.24, 0.62, 0.02, x=cx, y=0.79, z=0.085, bev=0.008)
    box(P['walnutD'], W, 0.1, 0.1, y=1.4, z=0.05, bev=0.015)
    box(P['bronze'], W, 0.015, 0.006, y=1.33, z=0.078)
    # 半壁柱 ×2（相邻开间拼成 0.8 m）：柱础 / 柱身 / 柱头
    for sx in (-1, 1):
        x = sx * (W / 2 - 0.2)
        box(P['stoneD'], 0.4, 0.55, 0.28, x=x, y=0.275, z=0.14, bev=0.015)
        box(P['stone'], 0.4, 13.6, 0.2, x=x, y=0.55 + 6.8, z=0.1, bev=0.01)
        for k in range(1, 7): box(P['stoneD'], 0.4, 0.03, 0.205, x=x, y=0.55 + k * 2.0, z=0.1)
        box(P['stoneD'], 0.4, 0.22, 0.26, x=x, y=14.26, z=0.13, bev=0.012)
        box(P['bronze'], 0.4, 0.03, 0.27, x=x, y=14.1, z=0.135)
        box(P['stoneD'], 0.4, 0.2, 0.3, x=x, y=14.47, z=0.15, bev=0.012)
    # 高窗：窗套 + 石窗台 + 琥珀内透 + 铁窗棂
    WX0, WY0, WW, WH = 0.0, 10.2, 3.0, 3.4
    box(P['glow'], WW, WH, 0.01, x=WX0, y=WY0 + WH / 2, z=0.04)
    for sx in (-1, 1): box(P['walnutD'], 0.16, WH + 0.32, 0.12, x=sx * (WW / 2 + 0.08), y=WY0 + WH / 2, z=0.06, bev=0.01)
    box(P['walnutD'], WW + 0.48, 0.18, 0.14, y=WY0 + WH + 0.09, z=0.07, bev=0.012)
    box(P['stoneD'], WW + 0.6, 0.12, 0.22, y=WY0 - 0.06, z=0.11, bev=0.01)
    # 批次 M16：铁窗棂方格 → 采光井格栅（铁内框 + 两根竖梃 + 斜百叶 17 条 + 中腰横档；B6 地下"高窗"读成通风采光井）
    for sx in (-1, 1): box(P['iron'], 0.06, WH, 0.07, x=sx * (WW / 2 - 0.03), y=WY0 + WH / 2, z=0.06)
    for yy in (WY0 + 0.03, WY0 + WH - 0.03, WY0 + WH / 2): box(P['iron'], WW, 0.06, 0.07, y=yy, z=0.06)
    for k in (1, 2): box(P['iron'], 0.05, WH, 0.07, x=-WW / 2 + k * WW / 3, y=WY0 + WH / 2, z=0.06)
    n = 17
    for k in range(n):
        yy = WY0 + 0.12 + k * (WH - 0.24) / (n - 1)
        if abs(yy - (WY0 + WH / 2)) < 0.06: continue
        box(P['iron'], WW - 0.1, 0.012, 0.11, y=yy, z=0.07, rx=math.radians(-40))
    # 檐口：三级线脚 + 暗铜嵌条
    box(P['stoneD'], W, 0.3, 0.16, y=15.0, z=0.08)
    box(P['stone'], W, 0.18, 0.26, y=15.24, z=0.13, bev=0.01)
    box(P['bronze'], W, 0.03, 0.27, y=15.35, z=0.135)
    box(P['stoneD'], W, 0.26, 0.36, y=15.5, z=0.18, bev=0.012)
    finish(S, f'{OUT}/tr_bay.glb', 'tr_bay')
    L = [((0, 4, 6), 2500, (1, .85, .7)), ((0, 13, 5), 1600, (1, .8, .6))]
    render(S, 'm9_bay_a', [((-2.0, 8.0, 18.0), (0, 7.8, 0), 32)], L)
    render(S, 'm9_bay_b', [((-1.8, 1.4, 2.6), (0.4, 0.8, 0), 30)], L)

def truss():
    S = reset(); P = pal(); L, D = 64.0, 1.6
    for yy in (0.0, D):
        box(P['rust'], L, 0.16, 0.22, y=yy, z=0, bev=0.008)
        box(P['rust'], L, 0.03, 0.34, y=yy + (0.08 if yy == 0 else -0.08), z=0)
    n = 32; step = L / n
    for i in range(n + 1):
        x = -L / 2 + i * step
        box(P['rust'], 0.12, D, 0.14, x=x, y=D / 2, z=0)
        box(P['iron'], 0.36, 0.3, 0.02, x=x, y=0.15, z=0.12); box(P['iron'], 0.36, 0.3, 0.02, x=x, y=D - 0.15, z=0.12)
        for (rx, ry) in ((-0.1, 0.1), (0.1, 0.1), (-0.1, 0.2), (0.1, 0.2)):
            cyl(P['bronze'], 0.018, 0.02, x=x + rx, y=ry, z=0.135, axis='z', n=8)
        if i < n:
            a = math.atan2(D, step) * (1 if i % 2 else -1)
            box(P['rust'], math.hypot(step, D) - 0.1, 0.1, 0.12, x=x + step / 2, y=D / 2, z=0, rz=a)
    finish(S, f'{OUT}/tr_truss.glb', 'tr_truss')
    Lt = [((0, -3, 8), 3000, (1, .85, .7))]
    render(S, 'm9_truss_a', [((-4, -2.5, 9), (0, 0.8, 0), 35)], Lt)

def lectern():
    S = reset(); P = pal(); W, H, Dp = 0.72, 1.15, 0.56
    box(P['walnutD'], W + 0.1, 0.06, Dp + 0.08, y=0.03, z=0, bev=0.01)
    box(P['walnut'], W, 0.98, Dp - 0.06, y=0.06 + 0.49, z=0, bev=0.012)
    box(P['walnutD'], W - 0.12, 0.7, 0.02, y=0.52, z=(Dp - 0.06) / 2 + 0.005, bev=0.006)
    box(P['burg'], W - 0.22, 0.58, 0.012, y=0.52, z=(Dp - 0.06) / 2 + 0.018, bev=0.004)
    cyl(P['bronze'], 0.08, 0.012, y=0.62, z=(Dp - 0.06) / 2 + 0.03, axis='z', n=24)
    cyl(P['walnutD'], 0.05, 0.014, y=0.62, z=(Dp - 0.06) / 2 + 0.037, axis='z', n=6)
    box(P['bronze'], 0.3, 0.07, 0.006, y=0.36, z=(Dp - 0.06) / 2 + 0.026)
    box(P['walnutD'], W + 0.08, 0.05, Dp + 0.02, y=1.06, z=0, rx=0.22, bev=0.01)
    box(P['walnutD'], W + 0.08, 0.03, 0.05, y=1.02, z=-(Dp / 2) - 0.02, bev=0.005)
    box(P['walnut'], W - 0.1, 0.02, 0.3, y=0.78, z=-(Dp / 2) + 0.17)
    cyl(P['bronze'], 0.008, 0.25, x=0.24, y=1.2, z=-0.1, axis='y', n=8)
    cyl(P['bronze'], 0.035, 0.05, x=0.24, y=1.33, z=-0.1, axis='y', n=12)
    finish(S, f'{OUT}/tr_lectern.glb', 'tr_lectern', cube=0.5)
    Ll = [((1.2, 2.0, 2.0), 260, (1, .88, .75)), ((-1.5, 1.2, -1), 80, (1, .85, .7))]
    render(S, 'm9_lectern_a', [((1.0, 1.5, 2.2), (0, 0.6, 0), 40)], Ll)
    render(S, 'm9_lectern_b', [((-1.2, 1.7, -1.6), (0, 0.8, 0), 40)], Ll)

def locker():
    S = reset(); P = pal(); W, H, Dp = 1.0, 1.9, 0.5
    box(P['enamelD'], W, 0.1, Dp - 0.04, y=0.05, z=0.02)
    box(P['enamel'], W, H - 0.1, Dp, y=0.1 + (H - 0.1) / 2, z=0.0, bev=0.006)
    box(P['enamelD'], W + 0.02, 0.04, Dp + 0.02, y=H + 0.02, z=0, bev=0.006)
    for sx in (-1, 1):
        x = sx * W / 4
        box(P['enamel'], W / 2 - 0.02, H - 0.2, 0.02, x=x, y=0.15 + (H - 0.2) / 2, z=Dp / 2 + 0.01, bev=0.004)
        for k in range(6): box(P['enamelD'], W / 2 - 0.16, 0.012, 0.012, x=x, y=1.52 + k * 0.035, z=Dp / 2 + 0.024)
        for k in range(6): box(P['enamelD'], W / 2 - 0.16, 0.012, 0.012, x=x, y=0.3 + k * 0.035, z=Dp / 2 + 0.024)
        box(P['bronze'], 0.12, 0.06, 0.006, x=x, y=1.36, z=Dp / 2 + 0.024)
        box(P['paper'], 0.1, 0.04, 0.004, x=x, y=1.36, z=Dp / 2 + 0.028)
        box(P['bronze'], 0.025, 0.16, 0.03, x=-sx * 0.04, y=1.0, z=Dp / 2 + 0.035, bev=0.004)
    box(P['enamelD'], 0.012, H - 0.2, 0.02, y=0.15 + (H - 0.2) / 2, z=Dp / 2 + 0.022)
    finish(S, f'{OUT}/tr_locker.glb', 'tr_locker', cube=0.5)
    Ll = [((1.4, 2.2, 2.4), 320, (1, .88, .75)), ((-1.5, 1.2, 1.0), 90, (1, .85, .7))]
    render(S, 'm9_locker_a', [((1.4, 1.6, 2.8), (0, 0.95, 0), 38)], Ll)

for f in argv[2].split(','): globals()[f]()
