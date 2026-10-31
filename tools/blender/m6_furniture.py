# 批次 M6：人事档案馆 / B1 密集库 家具 hero 模块。
# 用法：blender.sh -b -P m6_furniture.py -- <outdir> <prevdir> catalog,compact
# 产出：m6/card_catalog.glb（卡片目录柜单联 0.86 宽 × 1.40 高 × 0.42 深，原点底面中心，正面 +z）
#       m6/b1_cabinet.glb（B1 四斗档案铁柜）/ m6/b1_door.glb（B1 东墙防火铁门 1.2×2.2）
#       m6/compact_end.glb（密集架端板 2.0 宽 × 3.0 高，背面 z=0，正面 z≤0.125；铜卡框/编号/手摇轮/拨盘留给游戏端原件）
# 坐标约定同 m1_lib：参数 (x, y=高, z=前后)。立方投影 UV 1 m 一张不拉伸。
import bpy, sys, os
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
        bronze=mat('m2_bronze', (0.23, 0.15, 0.08), 0.48, 1.0),
        paper=mat('m1_paper', (0.78, 0.72, 0.6), 0.9),
        enamel=mat('m6_enamel', (0.27, 0.25, 0.22), 0.5, 0.35),
        enamelD=mat('m6_enamelDark', (0.15, 0.14, 0.125), 0.5, 0.35),
        iron=mat('m1_iron', (0.05, 0.045, 0.04), 0.5, 0.9),
        rubber=mat('m6_rubber', (0.03, 0.028, 0.025), 0.8),
    )

def render(S, name, views, lights):
    m1_lib.render(S, PREV, name, views, res=(640, 460), lights=lights)

# ---------------- 卡片目录柜（单联）----------------
def catalog():
    S = reset(); P = pal(); W, H, D = 0.86, 1.40, 0.42
    box(P['walnutD'], W + 0.02, 0.10, D - 0.02, y=0.05, z=-0.01, bev=0.008)            # 踢脚（内收）
    box(P['walnut'], 0.035, H - 0.16, D, x=-(W / 2 - 0.0175), y=0.10 + (H - 0.16) / 2, bev=0.004)  # 侧板
    box(P['walnut'], 0.035, H - 0.16, D, x=(W / 2 - 0.0175), y=0.10 + (H - 0.16) / 2, bev=0.004)
    box(P['walnutD'], W - 0.07, H - 0.16, 0.02, y=0.10 + (H - 0.16) / 2, z=-D / 2 + 0.01)           # 背板
    box(P['walnut'], W + 0.05, 0.035, D + 0.04, y=H - 0.0425, z=0.0, bev=0.006)          # 台面
    box(P['walnutD'], W + 0.03, 0.03, D + 0.02, y=H - 0.075, z=0.0, bev=0.004)           # 台面下线脚
    cols, rows = 3, 7; x0, x1, y0, y1 = -W / 2 + 0.035, W / 2 - 0.035, 0.12, H - 0.10
    cw, rh = (x1 - x0) / cols, (y1 - y0) / rows
    for i in range(cols + 1): box(P['walnutD'], 0.012, y1 - y0, 0.02, x=x0 + i * cw, y=(y0 + y1) / 2, z=D / 2 - 0.01)   # 竖分隔
    for j in range(rows + 1): box(P['walnutD'], x1 - x0, 0.012, 0.02, y=y0 + j * rh, z=D / 2 - 0.01)                   # 横分隔
    for i in range(cols):
        for j in range(rows):
            cx, cy = x0 + (i + 0.5) * cw, y0 + (j + 0.5) * rh
            box(P['walnut'], cw - 0.016, rh - 0.016, 0.022, x=cx, y=cy, z=D / 2 + 0.002, bev=0.003)       # 抽屉面
            box(P['bronze'], 0.085, 0.045, 0.006, x=cx, y=cy + 0.035, z=D / 2 + 0.016)                    # 标签框
            box(P['paper'], 0.07, 0.032, 0.003, x=cx, y=cy + 0.035, z=D / 2 + 0.0185)                     # 卡签
            cyl(P['bronze'], 0.011, 0.03, x=cx - 0.03, y=cy - 0.03, z=D / 2 + 0.026, axis='z', n=10)      # 半环拉手两脚
            cyl(P['bronze'], 0.011, 0.03, x=cx + 0.03, y=cy - 0.03, z=D / 2 + 0.026, axis='z', n=10)
            box(P['bronze'], 0.075, 0.014, 0.012, x=cx, y=cy - 0.03, z=D / 2 + 0.042, bev=0.003)          # 拉手横杆
    finish(S, f'{OUT}/card_catalog.glb', 'card_catalog')
    L = [((0.9, 1.4, 1.6), 260, (1, .85, .65)), ((-1.2, 1.0, 1.0), 90, (1, .8, .6))]
    render(S, 'm6_catalog_a', [((1.0, 1.15, 1.7), (0, 0.7, 0), 38)], L)
    render(S, 'm6_catalog_b', [((0.35, 0.95, 0.55), (0.0, 0.85, 0.2), 40)], L)
    render(S, 'm6_catalog_c', [((-1.6, 0.6, -0.9), (0, 0.7, 0), 38)], L)

# ---------------- 密集架端板 ----------------
def compact():
    S = reset(); P = pal(); W, H = 2.0, 3.0
    box(P['enamel'], W, H - 0.15, 0.10, y=0.15 + (H - 0.15) / 2, z=0.05, bev=0.012)          # 端板主体（钢制烤漆暖灰）
    box(P['enamelD'], W + 0.02, 0.15, 0.12, y=0.075, z=0.06, bev=0.01)                        # 底座
    box(P['iron'], W - 0.1, 0.03, 0.02, y=0.16, z=0.115)                                      # 底座防撞铁条
    box(P['enamelD'], W + 0.04, 0.10, 0.125, y=H - 0.05, z=0.0625, bev=0.012)                 # 顶帽
    # 两块凹芯板（上段 1.65…2.80 / 下段 0.30…1.62），四周压框
    for (ya, yb) in ((0.30, 1.62), (1.70, 2.82)):
        h = yb - ya; cy = (ya + yb) / 2
        box(P['enamelD'], W - 0.22, h - 0.12, 0.006, y=cy, z=0.101)                           # 芯板（凹）
        for sx in (-1, 1): box(P['enamel'], 0.05, h, 0.02, x=sx * (W / 2 - 0.135), y=cy, z=0.11, bev=0.004)
        for sy in (-1, 1): box(P['enamel'], W - 0.22, 0.05, 0.02, y=cy + sy * (h / 2 - 0.025), z=0.11, bev=0.004)
    # 竖向推拉把手（铸铁座 + 黑橡胶握杆），与原 steel 把手同位 x −0.85
    for yy in (1.02, 1.53): box(P['iron'], 0.06, 0.05, 0.03, x=-0.85, y=yy, z=0.115, bev=0.005)
    cyl(P['rubber'], 0.016, 0.56, x=-0.85, y=1.275, z=0.15, n=12)
    # 手摇轮铸铁轴座（轮本体为游戏端原件，可转）
    cyl(P['iron'], 0.085, 0.022, x=0.4, y=1.25, z=0.112, axis='z', n=24, bev=0.004)
    # 铜铆钉（四角）
    for sx in (-1, 1):
        for yy in (0.24, H - 0.16): cyl(P['bronze'], 0.012, 0.01, x=sx * (W / 2 - 0.05), y=yy, z=0.104, axis='z', n=10)
    # 侧面导向滚轮罩（端板两侧下沿，不越过 ±1.0）
    for sx in (-1, 1): box(P['iron'], 0.04, 0.12, 0.10, x=sx * 0.98, y=0.06, z=0.05)
    finish(S, f'{OUT}/compact_end.glb', 'compact_end')
    L = [((1.2, 2.2, 2.6), 650, (1, .9, .78)), ((-1.8, 1.2, 1.4), 200, (1, .85, .7))]
    render(S, 'm6_compact_a', [((1.6, 1.8, 3.6), (0, 1.5, 0), 38)], L)
    render(S, 'm6_compact_b', [((0.9, 1.3, 0.9), (0.1, 1.25, 0.05), 40)], L)
    render(S, 'm6_compact_c', [((2.4, 0.5, 1.2), (0.6, 0.6, 0), 38)], L)

# ---------------- B1 档案铁柜（四斗，钢制烤漆暖灰，0.42 宽 × 1.35 高 × 0.56 深，原点底面中心，正面 +z）----------------
def cabinet():
    S = reset(); P = pal(); W, H, D = 0.42, 1.35, 0.56
    box(P['enamelD'], W - 0.02, 0.06, D - 0.04, y=0.03, z=-0.01)
    box(P['enamel'], W, H - 0.06, D - 0.02, y=0.06 + (H - 0.06) / 2, z=-0.01, bev=0.008)
    box(P['enamelD'], W + 0.01, 0.02, D, y=H - 0.01, bev=0.004)
    n = 4; y0, y1 = 0.09, H - 0.05; rh = (y1 - y0) / n
    for j in range(n):
        cy = y0 + (j + 0.5) * rh
        box(P['enamel'], W - 0.03, rh - 0.014, 0.018, y=cy, z=D / 2 - 0.01, bev=0.004)
        box(P['enamelD'], W - 0.08, 0.006, 0.004, y=cy + rh / 2 - 0.03, z=D / 2 + 0.0)
        box(P['bronze'], 0.10, 0.05, 0.006, y=cy + 0.06, z=D / 2 + 0.002)
        box(P['paper'], 0.085, 0.036, 0.003, y=cy + 0.06, z=D / 2 + 0.0045)
        box(P['bronze'], 0.14, 0.022, 0.03, y=cy - 0.02, z=D / 2 + 0.012, bev=0.005)
        cyl(P['iron'], 0.009, 0.006, y=cy + 0.12, z=D / 2 + 0.002, axis='z', n=10)
    finish(S, f'{OUT}/b1_cabinet.glb', 'b1_cabinet')
    L = [((0.9, 1.4, 1.4), 200, (1, .9, .78)), ((-1.0, 0.8, 0.8), 70, (1, .85, .7))]
    render(S, 'm6_cabinet_a', [((0.8, 1.1, 1.4), (0, 0.65, 0), 40)], L)
    render(S, 'm6_cabinet_b', [((0.25, 0.9, 0.55), (0, 0.8, 0.28), 42)], L)

# ---------------- B1 防火铁门（洞 1.2 × 2.2：门套 + 门扇 + 冲压凸板 + 推杠 + 合页 + 铜门牌，背面 z=0，正面 +z）----------------
def door():
    S = reset(); P = pal(); OW, OH = 1.2, 2.2
    for sx in (-1, 1): box(P['iron'], 0.10, OH + 0.05, 0.08, x=sx * (OW / 2 + 0.05), y=(OH + 0.05) / 2, z=0.04, bev=0.006)
    box(P['iron'], OW + 0.2, 0.10, 0.08, y=OH + 0.05, z=0.04, bev=0.006)
    box(P['enamelD'], OW - 0.02, OH - 0.02, 0.05, y=OH / 2, z=0.035, bev=0.004)
    for (ya, yb) in ((0.15, 1.0), (1.15, 2.05)):
        h = yb - ya; cy = (ya + yb) / 2
        box(P['enamel'], OW - 0.26, h - 0.08, 0.008, y=cy, z=0.064)
        for sx in (-1, 1):
            for yy in (ya + 0.03, yb - 0.03): cyl(P['bronze'], 0.008, 0.008, x=sx * (OW / 2 - 0.08), y=yy, z=0.064, axis='z', n=8)
    box(P['iron'], OW - 0.24, 0.05, 0.03, y=1.05, z=0.08, bev=0.006)
    for sx in (-1, 1): box(P['iron'], 0.05, 0.08, 0.06, x=sx * (OW / 2 - 0.15), y=1.05, z=0.065)
    for yy in (0.35, 1.85): box(P['iron'], 0.04, 0.16, 0.03, x=-(OW / 2 - 0.02), y=yy, z=0.075)
    box(P['bronze'], 0.30, 0.10, 0.006, y=1.75, z=0.071)
    box(P['iron'], OW + 0.1, 0.03, 0.06, y=0.015, z=0.05)
    finish(S, f'{OUT}/b1_door.glb', 'b1_door')
    L = [((1.0, 1.8, 2.2), 380, (1, .9, .78)), ((-1.4, 1.0, 1.2), 120, (1, .85, .7))]
    render(S, 'm6_door_a', [((1.0, 1.4, 3.0), (0, 1.1, 0), 40)], L)
    render(S, 'm6_door_b', [((0.6, 1.2, 0.8), (0, 1.1, 0.05), 42)], L)

for f in argv[2].split(','): globals()[f]()
