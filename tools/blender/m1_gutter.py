# 批次 M1：装订线回廊 seventh_gutter 精建模块（游戏端沿 CatmullRom 弧线逐段实例化，见 depths.js）。
# 局部坐标：回廊轴线沿 −z，中心 x=0，两侧墙内皮 x=±1.75，地坪 y=0。
#   rib  ：一榀「拱肋」——两侧石壁柱（基座/槽纹柱身/铜箍柱头，内凸 0.16）+ 半圆石拱肋（拱脚 8.2，拱顶 ≈10.0）+ 酒红褐拱心石 + 铜吊杆线环（托住 y 7.6 的红线）
#   panel：1 m 长的一段墙脚——石踢脚 + 胡桃护墙板（凸芯）+ 腰线 + y 8.2 石檐线 + 地面酒红褐走道毯/铜压条/石边（游戏端沿 z 缩放到段长）
# 用法：blender.sh -b -P m1_gutter.py -- <out_dir> <preview_dir>
import bpy, sys, math, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import m1_lib as L
argv = sys.argv[sys.argv.index('--') + 1:]; OUTD, PREV = argv[0], argv[1]
WF = 1.75

def build_rib(M, box, cyl):
    for sx in (-1, 1):
        box(M['stoneD'], 0.22, 0.36, 0.52, sx * (WF - 0.11), 0.18, 0, bev=0.02)
        box(M['stone'], 0.19, 0.08, 0.46, sx * (WF - 0.095), 0.40, 0, bev=0.02)
        box(M['stone'], 0.08, 7.5, 0.38, sx * (WF - 0.04), 0.44 + 3.75, 0)
        for k in range(3): box(M['stone'], 0.08, 7.3, 0.09, sx * (WF - 0.12), 0.54 + 3.65, -0.12 + k * 0.12, bev=0.02)
        box(M['bronze'], 0.17, 0.06, 0.42, sx * (WF - 0.085), 7.9, 0, bev=0.01)
        box(M['stone'], 0.22, 0.16, 0.48, sx * (WF - 0.11), 8.03, 0, bev=0.02)
        box(M['stone'], 0.27, 0.1, 0.54, sx * (WF - 0.135), 8.16, 0, bev=0.02)
    L.arch_rib(M['stone'], 2 * WF, WF, 0.36, 0.26, 8.2)
    L.arch_rib(M['bronze'], 2 * WF - 0.48, WF - 0.24, 0.38, 0.03, 8.2)
    box(M['burg'], 0.3, 0.42, 0.42, 0, 9.82, 0, bev=0.02)
    cyl(M['bronze'], 0.012, 1.95, 0, 8.6, 0, n=6)
    L.torus(M['bronze'], 0.07, 0.014, 0, 7.6, 0, axis='z')

def build_panel(M, box, cyl):
    Lz = 1.0
    for sx in (-1, 1):
        f = WF
        box(M['stoneD'], 0.05, 0.18, Lz, sx * (f - 0.025), 0.09, 0)
        box(M['walnutD'], 0.03, 1.02, Lz, sx * (f - 0.015), 0.69, 0)
        for y in (0.22, 1.16): box(M['walnut'], 0.05, 0.07, Lz, sx * (f - 0.025), y, 0)
        box(M['walnut'], 0.06, 0.72, Lz - 0.22, sx * (f - 0.03), 0.69, 0, bev=0.03)
        box(M['walnutD'], 0.08, 0.07, Lz, sx * (f - 0.04), 1.235, 0)
        box(M['stone'], 0.1, 0.16, Lz, sx * (f - 0.05), 7.62 + 0.42, 0)   # 檐线（拱脚下）
        box(M['stone'], 0.05, 1.1, Lz, sx * (f - 0.025), 7.45, 0)  # 檐下石带（遮住红线横杆插墙处的纸墙）
    box(M['burg'], 1.5, 0.02, Lz, 0, 0.01, 0)
    for sx in (-1, 1):
        box(M['bronze'], 0.04, 0.03, Lz, sx * 0.77, 0.015, 0)
        box(M['stone'], 0.93, 0.025, Lz, sx * 1.26, 0.0125, 0)

for nm, fn in (('gutter_rib', build_rib), ('gutter_panel', build_panel)):
    S = L.reset(); L._M.clear(); M = L.palette()
    fn(M, L.box, L.cyl)
    L.finish(S, f'{OUTD}/{nm}.glb', 'm1_' + nm)
# ---------- 预览：一段直廊（8 段护墙 + 4 榀拱肋）+ 牛皮纸/书页墙 + 红线 ----------
S = L.reset(); L._M.clear(); M = L.palette()
for k in range(9):
    z = -k * 1.0
    L.box(M['kraft'], 0.3, 12, 1.0, -1.9, 6, z); L.box(M['paper'], 0.3, 12, 1.0, 1.9, 6, z); L.box(M['kraft'], 3.6, 0.3, 1.0, 0, -0.15, z)
    bpy.ops.import_scene.gltf(filepath=f'{OUTD}/gutter_panel.glb')
    for o in bpy.context.selected_objects: o.location.y += k * 1.0
for k in range(0, 9, 2):
    bpy.ops.import_scene.gltf(filepath=f'{OUTD}/gutter_rib.glb')
    for o in bpy.context.selected_objects: o.location.y += k * 1.0 + 0.5
L.cyl(L.mat('m1_threadP', (0.35, 0.03, 0.02), 0.5, emit=(0.8, 0.08, 0.05)), 0.05, 9, 0, 7.6, -4, axis='z', n=8)
L.render(S, PREV, 'm1_gutter', [((0.6, 1.7, 1.5), (-0.2, 3.5, -7), 20), ((-1.2, 1.2, -1.0), (1.6, 0.8, -4.0), 24), ((0, 1.6, -2), (0, 9.5, -5.0), 18)],
         lights=[((0, 6.5, -2), 500, (1, 0.6, 0.45)), ((0, 6.5, -6), 500, (1, 0.6, 0.45)), ((0.5, 2.0, 0.5), 150, (1, 0.85, 0.65))])
