# 批次 M16：档案馆借阅柜台 / 阅览长桌 hero 重建（替换批次32 的 r2/loan_counter_6080、r2/reading_table_6080）。
# 用法：blender.sh -b -P m16_archive.py -- <outdir> <prevdir> counter,table
# 坐标约定同 m1_lib：参数 (x, y=高, z=前后)，原点底面中心，正面 +z。材质只给名字 + 近似色，游戏端 src/world/m16_archive.js 按名字换 pbr。
# counter 7.21×1.13×1.4（与旧件同外包）：胡桃框芯正面 7 间（凸芯板 + 压线框）、两端胡桃壁柱、深色石材台面 + 嵌皮写字垫铜压边、
#         铜踢脚板 + 四角铜包角、借阅窗口（胡桃立柱 + 铜格栅 + 楣板 + 铜铭牌，开在 x −0.05…1.15，不挡便签 / 检索屏 / 台面物件）、铜扶脚杆、职员侧格架。
# table   5.63×0.82×1.53（与旧件同外包）：厚胡桃桌面 + 两级线脚、深棕皮面嵌心 + 铜压条、四角铜护角、牙板凸线雕、6 只方锥腿（刻线环 + 铜方靴）、H 形枨，
#         桌上两盏暗铜罩台灯（x ±1.4，铸铜座 / 立杆 / 半筒暗铜罩 / 暖光板，自发光 <1）。
import bpy, bmesh, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from m1_lib import mat, box, cyl, finish, reset, _fin
import m1_lib

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PREV = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)
if PREV != '-': os.makedirs(PREV, exist_ok=True)
L = [((2.5, 3.0, 3.0), 500, (1, .88, .75)), ((-3.0, 2.0, -1.0), 200, (1, .85, .7)), ((0, 2.2, 2.5), 160, (1, .9, .8))]

def M():
    m1_lib._M.clear()
    return dict(
        wal=mat('m16_walnut', (0.10, 0.055, 0.03), 0.5),
        walD=mat('m16_walnutD', (0.05, 0.028, 0.016), 0.5),
        stone=mat('m16_stoneTop', (0.06, 0.05, 0.045), 0.3),
        base=mat('m16_stoneBase', (0.12, 0.10, 0.09), 0.6),
        brz=mat('m16_bronze', (0.22, 0.14, 0.07), 0.5, 1.0),
        brzHi=mat('m16_brass', (0.42, 0.29, 0.13), 0.45, 1.0),
        lea=mat('m16_leather', (0.09, 0.05, 0.03), 0.6),
        iron=mat('m16_iron', (0.035, 0.03, 0.026), 0.55, 0.6),
        glow=mat('m16_lampGlow', (0.8, 0.6, 0.35), 0.8, emit=(1.0, 0.72, 0.42)),
    )

def frame4(m, w, h, t, d, x=0, y=0, z=0):
    """矩形压线框（四条斜边小线脚），在 x-y 平面，厚 d 沿 z。"""
    box(m, w, t, d, x=x, y=y + h / 2 - t / 2, z=z, bev=0.004)
    box(m, w, t, d, x=x, y=y - h / 2 + t / 2, z=z, bev=0.004)
    box(m, t, h - 2 * t, d, x=x - w / 2 + t / 2, y=y, z=z, bev=0.004)
    box(m, t, h - 2 * t, d, x=x + w / 2 - t / 2, y=y, z=z, bev=0.004)

def half_shade(m, r, length, x, y, z):
    """台灯半筒罩：轴沿 x，开口朝下，壁厚 4 mm。"""
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=length, vertices=28, location=(x, -z, y), rotation=(0, math.pi / 2, 0), end_fill_type='NOTHING')
    o = bpy.context.object; bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    bm = bmesh.new(); bm.from_mesh(o.data)
    kill = [v for v in bm.verts if v.co.z < -r * 0.15]
    bmesh.ops.delete(bm, geom=kill, context='VERTS'); bm.to_mesh(o.data); bm.free()
    md = o.modifiers.new('sol', 'SOLIDIFY'); md.thickness = 0.004; md.offset = 1
    o.data.materials.append(m); return o

# ---------------- 借阅柜台 ----------------
def counter():
    S = reset(); T = M()
    Lc, D, Tt = 7.0, 1.2, 1.08
    zf = (D - 0.06) / 2 + 0.006
    box(T['base'], Lc - 0.06, 0.1, D - 0.08, y=0.05, bev=0.008)                       # 石踢脚基座
    box(T['walD'], Lc, Tt - 0.1, D - 0.06, y=0.1 + (Tt - 0.1) / 2)                    # 柜身
    box(T['brz'], Lc - 0.02, 0.13, 0.008, y=0.165, z=zf + 0.004, bev=0.002)           # 铜踢脚板
    box(T['brzHi'], Lc - 0.02, 0.012, 0.012, y=0.236, z=zf + 0.006, bev=0.002)        # 踢脚上沿铜线
    n = 7; bw = Lc / n; yc = 0.25 + (Tt - 0.06 - 0.25) / 2; hp = Tt - 0.06 - 0.25
    for i in range(n + 1):
        sx = -Lc / 2 + i * bw
        if i in (0, n):  # 两端壁柱：胡桃柱身 + 凹槽 + 柱头柱础
            px = sx + (0.06 if i == 0 else -0.06)
            box(T['wal'], 0.14, hp + 0.04, 0.05, x=px, y=yc, z=zf + 0.02, bev=0.006)
            for k in (-1, 0, 1): box(T['walD'], 0.014, hp - 0.12, 0.006, x=px + k * 0.035, y=yc, z=zf + 0.046)
            box(T['wal'], 0.17, 0.05, 0.065, x=px, y=yc + hp / 2 - 0.01, z=zf + 0.025, bev=0.008)
            box(T['wal'], 0.17, 0.05, 0.065, x=px, y=yc - hp / 2 + 0.03, z=zf + 0.025, bev=0.008)
        else:
            box(T['wal'], 0.07, hp, 0.022, x=sx, y=yc, z=zf + 0.011, bev=0.004)         # 中梃
    for yy in (0.27, Tt - 0.08): box(T['wal'], Lc - 0.2, 0.06, 0.022, y=yy, z=zf + 0.011, bev=0.004)  # 上下冒头
    for i in range(n):
        cx = -Lc / 2 + (i + 0.5) * bw
        ww = bw - 0.07 - (0.11 if i in (0, n - 1) else 0); cxx = cx + (0.055 if i == 0 else -0.055 if i == n - 1 else 0)
        hh = hp - 0.12
        box(T['walD'], ww - 0.02, hh - 0.02, 0.016, x=cxx, y=yc, z=zf + 0.008)                         # 芯板底
        box(T['wal'], ww - 0.16, hh - 0.16, 0.03, x=cxx, y=yc, z=zf + 0.016, bev=0.022)                 # 凸芯（斜面）
        frame4(T['walD'], ww - 0.01, hh - 0.01, 0.022, 0.03, x=cxx, y=yc, z=zf + 0.02)                  # 压线框
        box(T['brzHi'], 0.05, 0.05, 0.006, x=cxx, y=yc, z=zf + 0.033, bev=0.003, rz=math.pi / 4)        # 铜菱形钮
    # 四角铜包角（竖向 L 形 + 顶 / 底角帽）
    for sx in (-1, 1):
        for sz in (-1, 1):
            x0, z0 = sx * (Lc / 2 + 0.004), sz * ((D - 0.06) / 2 + 0.004)
            box(T['brz'], 0.012, Tt - 0.12, 0.07, x=x0, y=0.1 + (Tt - 0.1) / 2, z=z0 - sz * 0.03)
            box(T['brz'], 0.07, Tt - 0.12, 0.012, x=x0 - sx * 0.03, y=0.1 + (Tt - 0.1) / 2, z=z0)
            box(T['brzHi'], 0.085, 0.03, 0.085, x=x0 - sx * 0.035, y=0.12, z=z0 - sz * 0.035, bev=0.004)
    # 台面下线脚（两级）
    box(T['wal'], Lc + 0.08, 0.035, D + 0.0, y=Tt - 0.0175, z=0.0, bev=0.008)
    box(T['walD'], Lc + 0.03, 0.025, D - 0.04, y=Tt - 0.047, bev=0.006)
    # 深色石材台面（与旧件同：7.2×1.4，前缘 z 0.08+0.70）+ 铜前缘 + 嵌皮写字垫
    box(T['stone'], Lc + 0.2, 0.05, 1.4, y=Tt + 0.025, z=0.08, bev=0.01)
    box(T['brzHi'], Lc + 0.21, 0.016, 0.012, y=Tt + 0.03, z=0.08 + 0.706, bev=0.002)
    for (cx, w) in ((-2.4, 1.1), (2.6, 0.9)):                     # 嵌皮写字垫：登记簿下 / 文具端（铜压边）
        box(T['lea'], w, 0.003, 0.62, x=cx, y=Tt + 0.0505, z=0.12)
    for (cx, w) in ((-2.4, 1.1), (2.6, 0.9)):
        for sz in (-1, 1): box(T['brzHi'], w + 0.03, 0.004, 0.012, x=cx, y=Tt + 0.051, z=0.12 + sz * 0.316)
        for sx in (-1, 1): box(T['brzHi'], 0.012, 0.004, 0.62, x=cx + sx * (w / 2 + 0.009), y=Tt + 0.051, z=0.12)
    # 借阅窗口（x −0.05…1.15，立在台面前缘内侧）
    wx0, wx1, top = -0.05, 1.15, Tt + 0.05; zw = 0.66
    for px in (wx0, wx1):
        box(T['wal'], 0.07, 0.74, 0.07, x=px, y=top + 0.37, z=zw, bev=0.008)
        box(T['brzHi'], 0.09, 0.04, 0.09, x=px, y=top + 0.02, z=zw, bev=0.004)      # 铜柱础
        box(T['brz'], 0.074, 0.012, 0.074, x=px, y=top + 0.5, z=zw)                  # 铜箍
    wc = (wx0 + wx1) / 2; ww = wx1 - wx0
    box(T['wal'], ww + 0.16, 0.16, 0.09, x=wc, y=top + 0.82, z=zw, bev=0.01)          # 楣板
    box(T['walD'], ww + 0.22, 0.035, 0.11, x=wc, y=top + 0.915, z=zw, bev=0.008)       # 檐口
    box(T['walD'], ww + 0.12, 0.03, 0.10, x=wc, y=top + 0.725, z=zw, bev=0.006)
    box(T['brzHi'], 0.5, 0.09, 0.006, x=wc, y=top + 0.82, z=zw + 0.048, bev=0.002)     # 铜铭牌
    box(T['walD'], 0.44, 0.05, 0.004, x=wc, y=top + 0.82, z=zw + 0.052)               # 铭牌字区（游戏端可贴字）
    # 铜格栅：上段 y top+0.40…0.70，竖条 + 两道横档 + 底部窗口沿
    for yy in (top + 0.40, top + 0.70): box(T['brz'], ww - 0.06, 0.02, 0.02, x=wc, y=yy, z=zw, bev=0.003)
    k = 0; xx = wx0 + 0.09
    while xx < wx1 - 0.06:
        cyl(T['brz'], 0.006, 0.3, x=xx, y=top + 0.55, z=zw, n=8); k += 1; xx += 0.07
    for xx in [wx0 + 0.09 + 0.07 * i + 0.035 for i in range(k - 1)]:
        box(T['brzHi'], 0.018, 0.018, 0.012, x=xx, y=top + 0.55, z=zw, rz=math.pi / 4)  # 格栅中段菱形扣
    box(T['wal'], ww - 0.06, 0.03, 0.16, x=wc, y=top + 0.015, z=zw - 0.04, bev=0.006)   # 窗口递物沿
    # 铜扶脚杆
    cyl(T['brzHi'], 0.022, Lc - 0.3, y=0.25, z=zf + 0.14, axis='x')
    for k in range(7): box(T['brz'], 0.025, 0.025, 0.14, x=-3.0 + k * 1.0, y=0.25, z=zf + 0.07, bev=0.004)
    # 职员侧格架
    zb = -(D - 0.06) / 2 - 0.005
    for yy in (0.45, 0.8): box(T['walD'], Lc - 0.1, 0.025, 0.02, y=yy, z=zb)
    for k in range(8): box(T['wal'], 0.03, Tt - 0.2, 0.02, x=-Lc / 2 + 0.05 + k * (Lc - 0.1) / 7, y=0.1 + (Tt - 0.1) / 2, z=zb)
    finish(S, f'{OUT}/loan_counter.glb', 'm16_loan_counter', cube=1.0)
    if PREV != '-':
        m1_lib.render(S, PREV, 'm16_counter', [((3.6, 2.0, 4.6), (0, 0.8, 0), 34), ((1.3, 1.5, 2.2), (0.55, 1.3, 0.5), 32), ((-3.4, 1.9, -3.6), (0, 0.7, 0), 34), ((4.2, 0.6, 1.4), (3.2, 0.5, 0.6), 30)], res=(800, 560), lights=L)

# ---------------- 阅览长桌 + 暗铜台灯 ----------------
def lamp(T, x, z):
    cyl(T['brz'], 0.10, 0.025, x=x, y=0.825 + 0.0125, z=z, n=32, bev=0.004)
    cyl(T['brzHi'], 0.075, 0.02, x=x, y=0.825 + 0.035, z=z, n=32, r2=0.06)
    cyl(T['brz'], 0.04, 0.03, x=x, y=0.825 + 0.06, z=z, n=24, r2=0.025)
    cyl(T['brzHi'], 0.011, 0.26, x=x, y=0.825 + 0.2, z=z, n=12)
    cyl(T['brz'], 0.02, 0.02, x=x, y=0.825 + 0.12, z=z, n=16)                 # 立杆中箍
    box(T['brz'], 0.24, 0.012, 0.012, x=x, y=0.825 + 0.33, z=z)              # 罩托臂
    half_shade(T['brz'], 0.085, 0.30, x, 0.825 + 0.335, z)
    for sx in (-1, 1): cyl(T['brzHi'], 0.088, 0.006, x=x + sx * 0.15, y=0.825 + 0.335, z=z, axis='x', n=28)  # 罩两端铜箍
    box(T['glow'], 0.24, 0.008, 0.06, x=x, y=0.825 + 0.322, z=z)              # 暖光板
    cyl(T['brzHi'], 0.006, 0.08, x=x + 0.06, y=0.825 + 0.27, z=z + 0.03, n=8)  # 拉链开关
    cyl(T['brzHi'], 0.012, 0.016, x=x + 0.06, y=0.825 + 0.225, z=z + 0.03, n=10)

def table():
    S = reset(); T = M()
    Lt, D, Tt = 5.6, 1.5, 0.82
    box(T['wal'], Lt, 0.06, D, y=Tt - 0.03, bev=0.014)                             # 厚桌面
    box(T['walD'], Lt - 0.04, 0.025, D - 0.04, y=Tt - 0.072, bev=0.008)             # 下线脚一级
    box(T['wal'], Lt - 0.1, 0.02, D - 0.1, y=Tt - 0.094, bev=0.006)                 # 二级
    box(T['lea'], Lt - 0.4, 0.004, D - 0.36, y=Tt + 0.0005)                         # 深棕皮面嵌心
    for sz in (-1, 1): box(T['brzHi'], Lt - 0.37, 0.005, 0.014, y=Tt + 0.002, z=sz * (D - 0.36 + 0.014) / 2)
    for sx in (-1, 1): box(T['brzHi'], 0.014, 0.005, D - 0.34, x=sx * (Lt - 0.4 + 0.014) / 2, y=Tt + 0.002)
    for sx in (-1, 1):                                                             # 四角铜护角
        for sz in (-1, 1):
            x0, z0 = sx * (Lt / 2 + 0.003), sz * (D / 2 + 0.003)
            box(T['brz'], 0.006, 0.066, 0.12, x=x0, y=Tt - 0.03, z=z0 - sz * 0.06)
            box(T['brz'], 0.12, 0.066, 0.006, x=x0 - sx * 0.06, y=Tt - 0.03, z=z0)
            box(T['brz'], 0.10, 0.004, 0.10, x=x0 - sx * 0.05, y=Tt + 0.001, z=z0 - sz * 0.05)
            cyl(T['brzHi'], 0.006, 0.004, x=x0 - sx * 0.04, y=Tt + 0.004, z=z0 - sz * 0.04, n=10)
    # 牙板 + 凸线雕（上下两道圆线 + 中央铜圆饰）
    for sz in (-1, 1):
        za = sz * (D / 2 - 0.13)
        box(T['walD'], Lt - 0.34, 0.15, 0.035, y=Tt - 0.18, z=za)
        for yy in (Tt - 0.125, Tt - 0.24): cyl(T['wal'], 0.009, Lt - 0.36, y=yy, z=za + sz * 0.018, axis='x', n=10)
        for lx in (-1.4, 1.4): box(T['wal'], 0.9, 0.06, 0.01, x=lx, y=Tt - 0.18, z=za + sz * 0.02, bev=0.004)
        cyl(T['brzHi'], 0.03, 0.008, y=Tt - 0.18, z=za + sz * 0.02, axis='z', n=20)
    for sx in (-1, 1):
        box(T['walD'], 0.035, 0.15, D - 0.3, x=sx * (Lt / 2 - 0.13), y=Tt - 0.18)
        for yy in (Tt - 0.125, Tt - 0.24): cyl(T['wal'], 0.009, D - 0.32, x=sx * (Lt / 2 - 0.13 + 0.018), y=yy, axis='z', n=10)
    # 方锥腿：方颈块 + 方锥身（4 边圆柱转 45°）+ 刻线环 + 铜方靴
    for lx in (-(Lt / 2 - 0.15), 0, Lt / 2 - 0.15):
        for sz in (-1, 1):
            z = sz * (D / 2 - 0.15)
            box(T['wal'], 0.13, 0.17, 0.13, x=lx, y=Tt - 0.18, z=z, bev=0.008)
            o = cyl(T['wal'], 0.085, Tt - 0.27 - 0.06, x=lx, y=0.06 + (Tt - 0.27 - 0.06) / 2, z=z, n=4, r2=0.055, bev=0.006)
            o.rotation_euler = (0, 0, math.pi / 4)
            for yy, rr in ((Tt - 0.31, 0.062), (Tt - 0.35, 0.061), (0.2, 0.044)):
                box(T['walD'], rr * 1.42, 0.008, rr * 1.42, x=lx, y=yy, z=z)       # 刻线环（略凸出深色条）
            box(T['brz'], 0.09, 0.06, 0.09, x=lx, y=0.03, z=z, bev=0.004)
            box(T['brzHi'], 0.095, 0.008, 0.095, x=lx, y=0.064, z=z)
    box(T['wal'], Lt - 0.3, 0.05, 0.06, y=0.16, bev=0.01)                           # H 枨
    for lx in (-(Lt / 2 - 0.15), 0, Lt / 2 - 0.15): box(T['wal'], 0.06, 0.05, D - 0.3, x=lx, y=0.16, bev=0.01)
    for lx in (-1.4, 1.4): lamp(T, lx, 0.0)
    finish(S, f'{OUT}/reading_table.glb', 'm16_reading_table', cube=1.0)
    if PREV != '-':
        m1_lib.render(S, PREV, 'm16_table', [((3.4, 2.0, 3.6), (0, 0.5, 0), 34), ((-1.0, 1.25, 1.1), (-1.4, 1.0, 0), 34), ((3.0, 0.5, 1.4), (2.6, 0.4, 0.6), 32), ((0, 3.4, 0.2), (0, 0.8, 0), 40)], res=(800, 560), lights=L)

for f in argv[2].split(','): globals()[f]()
