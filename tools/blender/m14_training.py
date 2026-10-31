# 批次 M14：B6 训练场第三轮——器材箱（替换墙脚蓝色塑料周转箱）+ 射击区靶架 / 靶道隔板（替换 M5 程序化橄榄色隔板与平面靶）。
# 用法：blender.sh -b -P m14_training.py -- <outdir> <prevdir> crate,target,baffle
# 坐标约定同 m1_lib：参数 (x, y=高, z=前后)，原点底面中心，正面 +z。
# crate  0.80×0.50×0.50：橡木板箱身（横板分缝）+ 暖黑铁包角 / 箍带 + 铸铁提手 + 铜编号牌。
# target 1.00×2.30×0.70：铸铁 T 形底座 + 两只帆布沙袋压脚 + 橡木靶框（立柱 / 上下横档）+ 靶纸面（材质 m14_paper，游戏内换成原 m5_target 画布）+ 铁夹 + 顶部滑车挂杆接口。
# baffle 0.12×2.20×1.60：射击位之间的隔板：铁框 + 胡桃凸芯板（上下两格）+ 吸音帆布芯 + 铜编号框 + 踢脚铁板。
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from m1_lib import mat, box, cyl, finish, reset
import m1_lib

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PREV = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True); os.makedirs(PREV, exist_ok=True)
L = [((1.6, 2.4, 2.2), 260, (1, .88, .75)), ((-2.0, 1.4, -0.8), 90, (1, .85, .7))]

def M():
    m1_lib._M.clear()
    return dict(
        oak=mat('m14_oak', (0.16, 0.095, 0.05), 0.62),
        oakD=mat('m1_walnutDark', (0.05, 0.028, 0.016), 0.5),
        wal=mat('m1_walnut', (0.085, 0.045, 0.025), 0.5),
        iron=mat('m1_iron', (0.035, 0.03, 0.026), 0.55, 0.6),
        brz=mat('m2_bronze', (0.23, 0.15, 0.08), 0.48, 1.0),
        canvas=mat('m14_canvas', (0.13, 0.085, 0.05), 0.9),
        paper=mat('m14_paper', (0.7, 0.64, 0.52), 0.9),
    )

def crate():
    S = reset(); T = M()
    W, H, D = 0.80, 0.50, 0.50
    for k in range(4):  # 横板 4 条，留 4 mm 缝（暗色背板透出）
        h = (H - 0.06) / 4
        yy = 0.03 + h * (k + 0.5)
        box(T['oak'], W - 0.02, h - 0.006, D - 0.02, y=yy, bev=0.006)
    box(T['oakD'], W - 0.04, H - 0.07, D - 0.04, y=H / 2)
    box(T['oak'], W - 0.01, 0.035, D - 0.01, y=H - 0.0175, bev=0.006)  # 盖板
    box(T['oakD'], W - 0.03, 0.03, D - 0.03, y=0.015)
    for sx in (-1, 1):
        for sz in (-1, 1):
            box(T['iron'], 0.07, H + 0.004, 0.07, x=sx * (W / 2 - 0.03), y=H / 2, z=sz * (D / 2 - 0.03), bev=0.006)  # 包角
    for x in (-0.22, 0.22):  # 箍带
        box(T['iron'], 0.045, 0.012, D + 0.008, x=x, y=H + 0.002, bev=0.002)
        for sz in (-1, 1): box(T['iron'], 0.045, H, 0.008, x=x, y=H / 2, z=sz * (D / 2 + 0.002))
    for sx in (-1, 1):  # 侧面铸铁提手
        box(T['iron'], 0.012, 0.05, 0.16, x=sx * (W / 2 + 0.004), y=H * 0.66)
        box(T['iron'], 0.03, 0.022, 0.15, x=sx * (W / 2 + 0.03), y=H * 0.62, bev=0.006)
        for dz in (-0.07, 0.07): box(T['iron'], 0.03, 0.04, 0.016, x=sx * (W / 2 + 0.018), y=H * 0.64, z=dz)
    box(T['brz'], 0.16, 0.07, 0.004, x=0, y=H * 0.55, z=D / 2 + 0.006, bev=0.002)  # 铜编号牌
    box(T['iron'], 0.05, 0.06, 0.012, x=0, y=H - 0.04, z=D / 2 + 0.008)  # 搭扣
    finish(S, f'{OUT}/tr_crate.glb', 'tr_crate', cube=0.5)
    m1_lib.render(S, PREV, 'm14_crate_a', [((1.3, 1.0, 1.4), (0, 0.25, 0), 40)], res=(640, 480), lights=L)

def target():
    S = reset(); T = M()
    # 铸铁 T 形底座 + 沙袋
    box(T['iron'], 0.9, 0.06, 0.12, y=0.03, bev=0.01)
    box(T['iron'], 0.12, 0.06, 0.7, y=0.03, bev=0.01)
    for sx in (-1, 1):
        box(T['canvas'], 0.3, 0.12, 0.2, x=sx * 0.28, y=0.12, z=0.16, bev=0.04)
        box(T['canvas'], 0.3, 0.12, 0.2, x=sx * 0.28, y=0.12, z=-0.16, bev=0.04)
    # 橡木靶框
    for sx in (-1, 1):
        box(T['oak'], 0.07, 2.2, 0.07, x=sx * 0.46, y=1.1 + 0.06, bev=0.008)
        box(T['iron'], 0.11, 0.14, 0.11, x=sx * 0.46, y=0.13)  # 立柱铁靴
    for yy in (0.75, 2.22):
        box(T['oak'], 0.99, 0.08, 0.08, y=yy, bev=0.008)
    # （第一版中档压在靶纸前，已去掉）
    # 靶纸（0.75×1.1，m14_paper；游戏内贴原靶画布）+ 背衬板
    box(T['oakD'], 0.84, 1.36, 0.018, y=1.48, z=-0.03)
    box(T['paper'], 0.75, 1.1, 0.004, y=1.48, z=-0.018)
    for sx in (-1, 1):
        for yy in (0.95, 2.02): box(T['iron'], 0.05, 0.04, 0.03, x=sx * 0.34, y=yy, z=-0.012)  # 铁夹
    # 顶部滑车挂杆接口
    box(T['iron'], 0.3, 0.04, 0.06, y=2.28)
    cyl(T['iron'], 0.012, 0.04, y=2.32, n=10)
    box(T['brz'], 0.18, 0.06, 0.004, y=0.84, z=0.042)  # 靶位铜牌
    finish(S, f'{OUT}/tr_target.glb', 'tr_target', cube=0.5)
    m1_lib.render(S, PREV, 'm14_target_a', [((1.6, 1.6, 2.6), (0, 1.1, 0), 40)], res=(640, 640), lights=L)

def baffle():
    S = reset(); T = M()
    W, H, D = 0.12, 2.2, 1.6
    for sz in (-1, 1): box(T['iron'], W, H, 0.06, z=sz * (D / 2 - 0.03), y=H / 2, bev=0.006)  # 立框
    for yy in (0.03, 0.22, 1.2, H - 0.03): box(T['iron'], W, 0.06 if yy < 0.1 or yy > 2 else 0.05, D, y=yy, bev=0.006)
    box(T['iron'], W + 0.01, 0.16, D - 0.12, y=0.12)  # 踢脚铁板
    for (y0, y1) in ((0.25, 1.175), (1.225, H - 0.06)):
        h = y1 - y0
        box(T['canvas'], W - 0.04, h, D - 0.12, y=(y0 + y1) / 2)  # 吸音帆布芯
        for sx in (-1, 1):
            box(T['wal'], 0.02, h - 0.08, D - 0.22, x=sx * (W / 2 - 0.006), y=(y0 + y1) / 2, bev=0.008)  # 凸芯板
            box(T['oakD'], 0.012, h - 0.16, D - 0.32, x=sx * (W / 2 + 0.002), y=(y0 + y1) / 2, bev=0.004)
    for sx in (-1, 1): box(T['brz'], 0.004, 0.16, 0.24, x=sx * (W / 2 + 0.012), y=1.55, z=D / 2 - 0.3)  # 铜编号框
    box(T['brz'], W + 0.004, 0.012, D, y=1.2, bev=0.002)  # 腰线铜条
    finish(S, f'{OUT}/tr_baffle.glb', 'tr_baffle', cube=0.5)
    m1_lib.render(S, PREV, 'm14_baffle_a', [((2.4, 1.8, 2.0), (0, 1.0, 0), 40)], res=(640, 480), lights=L)

for f in argv[2].split(','): globals()[f]()
