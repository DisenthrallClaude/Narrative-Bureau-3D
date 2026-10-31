# 批次 M2：西翼人事档案馆（archive）建筑壳 hero 模块。
# 用法：blender.sh -b -P m2_archive.py -- <outdir> <prevdir>
# 产出：m2/arch_coffer.glb（3×3 m 藻井格，顶面 y=0 向下 0.62 m）
#       m2/arch_entab.glb（1 m 檐部模块：石额枋 + 酒红褐楣带铜齿饰 + 石檐口，背面 z=0，向 +z 凸出，y 0…1.25）
#       m2/arch_pilaster.glb（壁柱：石基座 + 胡桃框芯柱身 + 铜箍 + 石柱头，高 10.0，背面 z=0）
#       m2/arch_door.glb（东门 7 m 门洞石门套：两侧石框 + 铜内框 + 门楣线脚 + 酒红褐楣板铜铭牌，x 沿墙，背面 z=0）
# 坐标约定同 m1_lib：参数 (x, y=高, z=前后)，导出后游戏坐标 = (x, y, z)。
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from m1_lib import reset, mat, box, cyl, torus, finish
import m1_lib
def render(S, prev, name, views, lights=()): m1_lib.render(S, prev, name, views, res=(560, 400), lights=lights)

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
        plaster=mat('m2_plaster', (0.55, 0.49, 0.41), 0.85),
    )

LIGHTS = [((2.5, 3.0, 3.5), 900, (1.0, 0.85, 0.65)), ((-3, 1.5, 2.0), 350, (1.0, 0.8, 0.6))]

# ---------------- 藻井格 3×3 ----------------
def coffer():
    S = reset(); P = pal(); T = 3.0
    # 主梁（四边各半宽 0.18，拼接后 0.36 宽梁）
    for sx in (-1, 1):
        box(P['walnut'], 0.18, 0.62, T, x=sx * (T / 2 - 0.09), y=-0.31, bev=0.012)
        box(P['walnut'], T, 0.62, 0.18, z=sx * (T / 2 - 0.09), y=-0.31, bev=0.012)
        # 梁底铜压条
        box(P['bronze'], 0.03, 0.012, T, x=sx * (T / 2 - 0.09), y=-0.626)
        box(P['bronze'], T, 0.012, 0.03, z=sx * (T / 2 - 0.09), y=-0.626)
    # 两级退台线脚
    for k, (inset, h, yy) in enumerate([(0.18, 0.12, -0.25), (0.30, 0.09, -0.16)]):
        L = T - 2 * inset
        for sx in (-1, 1):
            box(P['walnutD'], 0.12, h, L, x=sx * (T / 2 - inset - 0.06), y=yy)
            box(P['walnutD'], L, h, 0.12, z=sx * (T / 2 - inset - 0.06), y=yy)
    # 格心：酒红褐面板 + 胡桃细框
    box(P['burg'], T - 0.84, 0.03, T - 0.84, y=-0.1)
    for sx in (-1, 1):
        box(P['bronze'], 0.025, 0.02, T - 0.9, x=sx * (T / 2 - 0.47), y=-0.115)
        box(P['bronze'], T - 0.9, 0.02, 0.025, z=sx * (T / 2 - 0.47), y=-0.115)
    # 中心铜花饰
    cyl(P['bronze'], 0.2, 0.04, y=-0.13, n=16); cyl(P['bronze'], 0.11, 0.08, y=-0.17, n=16, r2=0.05)
    # 四角铜角花
    for sx in (-1, 1):
        for sz in (-1, 1): cyl(P['bronze'], 0.05, 0.03, x=sx * (T / 2 - 0.47), z=sz * (T / 2 - 0.47), y=-0.13, n=12)
    finish(S, f'{OUT}/arch_coffer.glb', 'arch_coffer')
    render(S, PREV, 'm2_coffer', [((2.2, -2.6, 2.6), (0, -0.25, 0), 30), ((0, -3.5, 0.01), (0, 0, 0), 26)], lights=[((0, -2.0, 0), 300, (1, .85, .65))])

# ---------------- 檐部 1 m 模块 ----------------
def entab():
    S = reset(); P = pal(); W = 2.0
    box(P['stone'], W, 0.32, 0.18, y=0.16, z=0.09)                 # 额枋下层
    box(P['stone'], W, 0.06, 0.22, y=0.35, z=0.11, bev=0.01)        # 额枋上沿线
    box(P['burg'], W, 0.4, 0.14, y=0.58, z=0.07)                   # 楣带
    for i in range(10): box(P['bronze'], 0.07, 0.09, 0.06, x=-0.9 + i * 0.2, y=0.74, z=0.17, bev=0.006)  # 铜齿饰
    box(P['stone'], W, 0.07, 0.26, y=0.82, z=0.13, bev=0.01)
    box(P['stone'], W, 0.18, 0.34, y=0.95, z=0.17, bev=0.02)       # 檐口
    box(P['stoneD'], W, 0.06, 0.40, y=1.07, z=0.20, bev=0.015)     # 檐口顶线
    box(P['stone'], W, 0.15, 0.30, y=1.175, z=0.15)
    finish(S, f'{OUT}/arch_entab.glb', 'arch_entab')
    # 预览：排 4 段
    for o in list(S.objects): pass
    render(S, PREV, 'm2_entab', [((1.6, 0.2, 1.6), (0, 0.65, 0), 40), ((0.2, -0.6, 1.4), (0, 0.8, 0.1), 32)], lights=LIGHTS)

# ---------------- 壁柱 ----------------
def pilaster(Hh=10.0, nm='arch_pilaster'):
    S = reset(); P = pal()
    box(P['stoneD'], 0.86, 0.12, 0.30, y=0.06, z=0.15, bev=0.015)   # 踢脚基座
    box(P['stone'], 0.78, 0.9, 0.26, y=0.57, z=0.13, bev=0.02)      # 基座身
    box(P['stone'], 0.82, 0.08, 0.29, y=1.06, z=0.145, bev=0.015)   # 基座帽
    box(P['walnut'], 0.66, Hh - 2.2, 0.16, y=1.1 + (Hh - 2.2) / 2, z=0.08, bev=0.01)  # 柱身
    # 框芯：凹槽 3 道 + 铜嵌线
    for i in (-1, 0, 1):
        box(P['walnutD'], 0.08, Hh - 2.8, 0.03, x=i * 0.18, y=1.4 + (Hh - 2.8) / 2, z=0.165)
    for yy in (1.35, Hh - 1.4): box(P['bronze'], 0.62, 0.035, 0.03, y=yy, z=0.175)
    box(P['bronze'], 0.70, 0.08, 0.2, y=Hh - 1.06, z=0.1, bev=0.01)  # 铜箍
    box(P['stone'], 0.80, 0.42, 0.24, y=Hh - 0.8, z=0.12, bev=0.02)   # 柱头
    box(P['stone'], 0.92, 0.12, 0.32, y=Hh - 0.53, z=0.16, bev=0.02)
    for sx in (-1, 1): cyl(P['stone'], 0.07, 0.24, x=sx * 0.32, y=Hh - 0.8, z=0.26, axis='z', n=16)  # 涡卷简化
    finish(S, f'{OUT}/{nm}.glb', nm)
    render(S, PREV, 'm2_' + nm, [((1.8, 2.2, 3.4), (0, 2.0, 0), 35), ((0.9, Hh - 0.8, 1.6), (0, Hh - 1.0, 0), 35)], lights=[((1.5, 2.5, 2.0), 600, (1, .85, .65)), ((1.5, Hh - 1, 2.0), 600, (1, .85, .65))])

# ---------------- 东门石门套（洞宽 7.0、高 5.2）----------------
def door():
    S = reset(); P = pal(); OW, OH = 7.0, 5.2
    for sx in (-1, 1):
        x = sx * (OW / 2 + 0.17)
        box(P['stoneD'], 0.40, 0.14, 0.30, x=x, y=0.07, z=0.15, bev=0.015)      # 门墩
        box(P['stone'], 0.34, OH, 0.24, x=x, y=OH / 2, z=0.12, bev=0.02)       # 石框
        box(P['stone'], 0.12, OH - 0.2, 0.05, x=x - sx * 0.05, y=OH / 2, z=0.26) # 框面线
        box(P['bronze'], 0.035, OH, 0.035, x=sx * (OW / 2 + 0.0175), y=OH / 2, z=0.2)  # 铜内框
        box(P['stone'], 0.30, 0.6, 0.30, x=x, y=OH + 0.1, z=0.15, bev=0.02)    # 角块（耳）
    box(P['bronze'], OW, 0.035, 0.035, y=OH - 0.0175, z=0.2)
    box(P['stone'], OW + 0.68, 0.34, 0.24, y=OH + 0.17, z=0.12, bev=0.02)        # 门楣
    box(P['burg'], 2.6, 0.42, 0.08, y=OH + 0.62, z=0.04)                          # 楣板
    box(P['bronze'], 2.7, 0.04, 0.1, y=OH + 0.85, z=0.05); box(P['bronze'], 2.7, 0.04, 0.1, y=OH + 0.39, z=0.05)
    box(P['bronze'], 1.4, 0.2, 0.02, y=OH + 0.62, z=0.09, bev=0.004)             # 铜铭牌
    box(P['stone'], OW + 0.9, 0.1, 0.32, y=OH + 0.39, z=0.16, bev=0.015)          # 门楣顶线
    finish(S, f'{OUT}/arch_door.glb', 'arch_door')
    render(S, PREV, 'm2_door', [((2.0, 2.8, 8.5), (0, 3.0, 0), 30), ((3.6, 5.4, 1.4), (2.6, 5.4, 0), 35)], lights=[((0, 4, 3), 1500, (1, .85, .65)), ((3, 6, 1.2), 300, (1, .85, .65))])

for f in argv[2].split(','):
    if f == 'pilaster': pilaster(11.8)
    else: globals()[f]()
