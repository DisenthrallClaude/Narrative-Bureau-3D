# 批次 M12：B6 训练场第二轮——简报区老式课椅（胡桃座/背 + 铸铁弯腿），替换 r2/schoolchair_01（蓝色塑料座）。
# 用法：blender.sh -b -P m12_training.py -- <outdir> <prevdir> chair
# 屋架另用 m9_training.py truss 出模到 m12/（tr_truss.glb）。
# 坐标约定同 m1_lib：参数 (x, y=高, z=前后)，原点底面中心，正面（坐的人朝向）+z。尺寸 0.42×0.84×0.48，座高 0.45。
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from m1_lib import mat, box, cyl, finish, reset
import m1_lib

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PREV = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True); os.makedirs(PREV, exist_ok=True)

def chair():
    S = reset(); m1_lib._M.clear()
    wal = mat('m1_walnut', (0.085, 0.045, 0.025), 0.5)
    walD = mat('m1_walnutDark', (0.05, 0.028, 0.016), 0.45)
    iron = mat('m1_iron', (0.05, 0.045, 0.04), 0.5, 0.9)
    brz = mat('m2_bronze', (0.23, 0.15, 0.08), 0.48, 1.0)
    W, SH, D = 0.42, 0.45, 0.42
    for sx in (-1, 1):
        for sz in (-1, 1):
            box(iron, 0.028, SH - 0.03, 0.028, x=sx * (W / 2 - 0.03), y=(SH - 0.03) / 2, z=sz * (D / 2 - 0.04), rz=sx * 0.04, rx=-sz * 0.04, bev=0.006)
            cyl(iron, 0.022, 0.016, x=sx * (W / 2 - 0.025), y=0.008, z=sz * (D / 2 - 0.035), n=12)
        box(iron, 0.018, 0.018, D - 0.08, x=sx * (W / 2 - 0.03), y=0.12, z=0, bev=0.004)
        box(iron, 0.026, 0.40, 0.026, x=sx * (W / 2 - 0.03), y=SH + 0.19, z=-(D / 2 - 0.04) - 0.025, rx=-0.12, bev=0.006)
    box(iron, W - 0.06, 0.018, 0.018, y=0.12, z=D / 2 - 0.04, bev=0.004)
    box(iron, W - 0.04, 0.03, D - 0.04, y=SH - 0.045, z=0, bev=0.004)
    box(wal, W, 0.03, D, y=SH - 0.015, z=0.01, bev=0.012)
    box(walD, W - 0.02, 0.008, 0.012, y=SH - 0.024, z=D / 2 + 0.008)
    for (yy, hh) in ((SH + 0.17, 0.09), (SH + 0.33, 0.11)):
        box(wal, W - 0.04, hh, 0.022, y=yy, z=-(D / 2 - 0.04) - 0.03 - (yy - SH) * 0.12, rx=-0.12, bev=0.008)
    for sx in (-1, 1):
        for yy in (SH + 0.17, SH + 0.33):
            cyl(brz, 0.009, 0.012, x=sx * (W / 2 - 0.03), y=yy, z=-(D / 2 - 0.04) - 0.012 - (yy - SH) * 0.12, axis='z', n=10)
    box(brz, 0.07, 0.025, 0.004, y=SH + 0.33, z=-(D / 2 - 0.04) - 0.044 - 0.33 * 0.12 + 0.03, rx=-0.12)
    finish(S, f'{OUT}/tr_chair.glb', 'tr_chair', cube=0.5)
    L = [((1.0, 1.6, 1.6), 160, (1, .88, .75)), ((-1.2, 1.0, -0.6), 60, (1, .85, .7))]
    m1_lib.render(S, PREV, 'm12_chair_a', [((0.9, 0.95, 1.2), (0, 0.4, 0), 40)], res=(640, 480), lights=L)
    m1_lib.render(S, PREV, 'm12_chair_b', [((-0.9, 1.1, -1.0), (0, 0.45, 0), 40)], res=(640, 480), lights=L)

for f in argv[2].split(','): globals()[f]()
