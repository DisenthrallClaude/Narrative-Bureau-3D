# 批次 M1：装订线入口 seventh_entry 精建壳 + 装订机（世界坐标 x/z，y 相对 SY 地坪；游戏端原点 (0, SY, 0) 直接放，不重心化）。
# 区域：x −3.2…3.2（牛皮纸墙内皮 ±3.0），z −53.2（南墙，白缝出口）…−65.25（北端拱门屏墙，接回廊）。
# 用法：blender.sh -b -P m1_entry.py -- <out.glb> <preview_dir>
import bpy, sys, math, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import m1_lib as L
argv = sys.argv[sys.argv.index('--') + 1:]; OUT, PREV = argv[0], argv[1]
S = L.reset(); M = L.palette(); box, cyl, torus = L.box, L.cyl, L.torus
WF = 3.0; ZS, ZN = -53.2, -64.75   # 墙内皮、南墙内皮、北屏墙南皮
ZP = [-54.5, -58.6, -63.3]          # 壁柱（西墙 −61 处是打孔卡片锚点，避开）
# ---------- 地面：暖灰石板 + 酒红褐走道毯 + 铜压条 ----------
for ix in range(-3, 3):
    for iz in range(0, 12):
        x = ix + 0.5; z = ZS - 0.5 - iz
        if abs(x) < 0.9: continue
        box(M['stone'] if (ix + iz) % 2 else M['stoneD'], 0.97, 0.03, 0.97, x, 0.015, z, bev=0.006)
box(M['burg'], 1.5, 0.025, ZS - ZN - 0.2, 0, 0.0125, (ZS + ZN) / 2)
for sx in (-1, 1): box(M['bronze'], 0.05, 0.035, ZS - ZN - 0.2, sx * 0.78, 0.0175, (ZS + ZN) / 2, bev=0.008)
box(M['stoneD'], 3.5, 0.04, 0.5, 0, 0.02, -65.0, bev=0.01)  # 北拱门门槛石
# ---------- 侧墙：石踢脚 + 胡桃护墙板（框+凸芯）+ 腰线 ----------
def wainscot_run(sx, z0, z1, face_x, along='z'):
    L_ = abs(z1 - z0); zc = (z0 + z1) / 2
    if along == 'z':
        P = lambda d, y, h, w, zz: box(M['walnut'], d, h, w, sx * (face_x - d / 2), y, zz, bev=0.004)
        box(M['stoneD'], 0.05, 0.18, L_, sx * (face_x - 0.025), 0.09, zc, bev=0.006)
        box(M['walnutD'], 0.03, 1.07, L_, sx * (face_x - 0.015), 0.715, zc)
        n = max(1, round(L_ / 0.9)); w = L_ / n
        for k in range(n + 1): box(M['walnut'], 0.05, 1.07, 0.07, sx * (face_x - 0.025), 0.715, z0 - k * w * (1 if z1 < z0 else -1), bev=0.006)
        for y in (0.22, 1.21): box(M['walnut'], 0.05, 0.07, L_, sx * (face_x - 0.025), y, zc, bev=0.006)
        for k in range(n):
            zz = z0 - (k + 0.5) * w * (1 if z1 < z0 else -1)
            box(M['walnut'], 0.06, 0.78, w - 0.2, sx * (face_x - 0.03), 0.715, zz, bev=0.03)
        box(M['walnutD'], 0.09, 0.07, L_, sx * (face_x - 0.045), 1.285, zc, bev=0.012)  # 腰线
for sx in (-1, 1):
    edges = [ZS] + ZP + [ZN]
    for a, b in zip(edges[:-1], edges[1:]):
        a2 = a - (0.3 if a != ZS else 0); b2 = b + (0.3 if b != ZN else 0)
        wainscot_run(sx, a2, b2, WF)
# 南墙护墙板（门套两侧）
for sx in (-1, 1):
    x0, x1 = sx * 0.85, sx * 2.95; xc = (x0 + x1) / 2; Lx = abs(x1 - x0)
    box(M['stoneD'], Lx, 0.18, 0.05, xc, 0.09, ZS - 0.025)
    box(M['walnutD'], Lx, 1.07, 0.03, xc, 0.715, ZS - 0.015)
    for y in (0.22, 1.21): box(M['walnut'], Lx, 0.07, 0.05, xc, y, ZS - 0.025, bev=0.006)
    for k in range(2): box(M['walnut'], Lx / 2 - 0.2, 0.78, 0.06, x0 + sx * (k + 0.5) * Lx / 2, 0.715, ZS - 0.03, bev=0.03)
    box(M['walnutD'], Lx, 0.07, 0.09, xc, 1.285, ZS - 0.045, bev=0.012)
# ---------- 壁柱：石基 + 槽纹柱身 + 铜箍柱头 ----------
def pilaster(x_face, sx, z, h=5.5):
    box(M['stoneD'], 0.26, 0.34, 0.66, sx * (x_face - 0.13), 0.17, z, bev=0.02)
    box(M['stone'], 0.22, 0.08, 0.58, sx * (x_face - 0.11), 0.38, z, bev=0.02)
    box(M['stone'], 0.12, h - 0.42, 0.5, sx * (x_face - 0.06), 0.42 + (h - 0.42) / 2, z)
    for k in range(4): box(M['stone'], 0.07, h - 0.62, 0.085, sx * (x_face - 0.155), 0.52 + (h - 0.62) / 2, z - 0.18 + k * 0.12, bev=0.02)
    box(M['bronze'], 0.21, 0.06, 0.54, sx * (x_face - 0.105), h - 0.02, z, bev=0.01)
    box(M['stone'], 0.26, 0.16, 0.62, sx * (x_face - 0.13), h + 0.09, z, bev=0.02)
    box(M['stone'], 0.32, 0.12, 0.7, sx * (x_face - 0.16), h + 0.23, z, bev=0.025)
for sx in (-1, 1):
    for z in ZP: pilaster(WF, sx, z)
# ---------- 檐部（沿两侧墙 + 南墙）：额枋石 / 酒红褐楣带 + 铜齿饰 / 石檐口 ----------
for sx in (-1, 1):
    Lz = ZS - ZN; zc = (ZS + ZN) / 2
    box(M['stone'], 0.12, 0.26, Lz, sx * (WF - 0.06), 5.92, zc, bev=0.01)
    box(M['burg'], 0.06, 0.3, Lz, sx * (WF - 0.03), 6.2, zc)
    for k in range(int(Lz / 0.3)): box(M['bronze'], 0.08, 0.07, 0.12, sx * (WF - 0.04), 6.32, ZS - 0.15 - k * 0.3)
    box(M['stone'], 0.34, 0.16, Lz, sx * (WF - 0.17), 6.44, zc, bev=0.03)
box(M['stone'], 2 * WF, 0.26, 0.12, 0, 5.92, ZS - 0.06, bev=0.01); box(M['burg'], 2 * WF, 0.3, 0.06, 0, 6.2, ZS - 0.03); box(M['stone'], 2 * WF, 0.16, 0.34, 0, 6.44, ZS - 0.17, bev=0.03)
# ---------- 南墙门套（白缝出口）----------
for sx in (-1, 1):
    box(M['stoneD'], 0.56, 0.34, 0.42, sx * 0.58, 0.17, ZS - 0.21, bev=0.02)
    box(M['stone'], 0.46, 5.9, 0.34, sx * 0.58, 0.34 + 2.95, ZS - 0.17, bev=0.02)
    box(M['bronze'], 0.05, 5.9, 0.36, sx * 0.33, 0.34 + 2.95, ZS - 0.18, bev=0.01)
box(M['stone'], 1.8, 0.5, 0.4, 0, 6.5, ZS - 0.2, bev=0.03)
box(M['stone'], 2.1, 0.14, 0.52, 0, 6.82, ZS - 0.26, bev=0.03)
box(M['bronze'], 0.9, 0.26, 0.03, 0, 6.5, ZS - 0.415, bev=0.01)  # 铭牌
# ---------- 北端拱门屏墙（z −64.75…−65.25，洞口 ±1.75，拱脚 5.6）----------
wall = box(M['stone'], 6.4, 9.0, 0.5, 0, 4.5, -65.0)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 65.0, 2.8)); cut1 = bpy.context.object; cut1.scale = (3.5, 1.2, 5.62)
bpy.ops.mesh.primitive_cylinder_add(radius=1.75, depth=1.2, vertices=48, location=(0, 65.0, 5.6)); cut2 = bpy.context.object; cut2.rotation_euler = (math.pi / 2, 0, 0)
for c in (cut1, cut2):
    md = wall.modifiers.new('cut', 'BOOLEAN'); md.object = c; md.operation = 'DIFFERENCE'
bpy.context.view_layer.objects.active = wall
for md in list(wall.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
bpy.data.objects.remove(cut1); bpy.data.objects.remove(cut2)
# 拱门两面：拱圈（石）+ 铜内圈 + 酒红褐拱心石；门柱 + 护墙板
for zf, sgn in ((-64.75, 1), (-65.25, -1)):
    rb = L.arch_rib(M['stone'], 3.9, 1.95, 0.14, 0.32, 5.6, z=zf + sgn * 0.07)
    L.arch_rib(M['bronze'], 3.56, 1.78, 0.16, 0.05, 5.6, z=zf + sgn * 0.08)
    box(M['burg'], 0.42, 0.62, 0.2, 0, 7.45, zf + sgn * 0.1, bev=0.02)
    for sx in (-1, 1):
        box(M['stone'], 0.32, 5.6, 0.14, sx * 1.91, 2.8, zf + sgn * 0.07, bev=0.015)
        box(M['stone'], 0.4, 0.2, 0.18, sx * 1.91, 5.6, zf + sgn * 0.09, bev=0.02)
        box(M['stoneD'], 0.44, 0.34, 0.2, sx * 1.91, 0.17, zf + sgn * 0.1, bev=0.02)
    box(M['stone'], 6.4, 0.16, 0.3, 0, 6.44, zf + sgn * 0.15, bev=0.03)
for sx in (-1, 1):  # 拱洞内侧铜包边
    box(M['bronze'], 0.04, 5.6, 0.5, sx * 1.73, 2.8, -65.0)
for sx in (-1, 1):  # 屏墙南面护墙板
    x0, x1 = sx * 2.1, sx * 2.95; xc = (x0 + x1) / 2
    box(M['walnutD'], 0.85, 1.07, 0.03, xc, 0.715, -64.735); box(M['walnut'], 0.65, 0.78, 0.05, xc, 0.715, -64.72, bev=0.025)
    box(M['walnutD'], 0.85, 0.07, 0.09, xc, 1.285, -64.705, bev=0.012)
# ---------- 藻井天花（y 9.0）：石顶板 + 胡桃梁格 + 酒红褐格心 + 铜角花 ----------
box(M['stone'], 6.4, 0.15, ZS - ZN + 0.5, 0, 9.075, (ZS + ZN - 0.5) / 2)
zb = [ZS] + ZP + [ZN]
for z in zb: box(M['walnut'], 6.0, 0.42, 0.3, 0, 8.79, z, bev=0.02)
for x in (-1.0, 1.0, -2.9, 2.9): box(M['walnut'], 0.26, 0.36, ZS - ZN, x, 8.82, (ZS + ZN) / 2, bev=0.02)
for a, b in zip(zb[:-1], zb[1:]):
    for xc, w in ((-1.95, 1.64), (0, 1.74), (1.95, 1.64)):
        box(M['burg'], w, 0.04, abs(a - b) - 0.34, xc, 8.98, (a + b) / 2)
        box(M['walnutD'], w - 0.1, 0.06, abs(a - b) - 0.44, xc, 8.94, (a + b) / 2)
        box(M['burg'], w - 0.34, 0.05, abs(a - b) - 0.7, xc, 8.9, (a + b) / 2, bev=0.02)
        cyl(M['bronze'], 0.09, 0.06, xc, 8.86, (a + b) / 2, n=16)
# 吊灯两盏（铜链 + 乳白碗灯）
for z in (-56.5, -61.0):
    cyl(M['bronze'], 0.012, 2.2, 0, 7.6, z, n=6); cyl(M['bronze'], 0.32, 0.18, 0, 6.42, z, r2=0.12, n=28, bev=0.01)
    cyl(L.mat('m1_lampGlow', (0.9, 0.75, 0.5), 0.4, emit=(1.0, 0.78, 0.5)), 0.27, 0.05, 0, 6.32, z, n=28)
# ---------- 装订机（东侧 x 1.6…2.9，z −59.9…−62.1）：铸铁座 + 铜侧板 + 胡桃台面 + 针排 + 飞轮 + 线轴架，红线上天花 ----------
MX, MZ = 2.22, -61.0
box(M['iron'], 1.2, 0.22, 2.2, MX, 0.11, MZ, bev=0.03)
for dz in (-0.92, 0.92):
    box(M['bronze'], 1.0, 1.7, 0.1, MX, 0.22 + 0.85, MZ + dz, bev=0.025)
    cyl(M['bronze'], 0.5, 0.1, MX, 1.92, MZ + dz, axis='z', n=32)
    box(M['iron'], 0.6, 0.6, 0.12, MX, 0.6, MZ + dz, bev=0.02)
box(M['walnut'], 1.24, 0.08, 2.0, MX, 1.0, MZ, bev=0.015)
box(M['bronze'], 1.28, 0.03, 2.04, MX, 0.955, MZ, bev=0.008)
box(M['iron'], 0.18, 0.18, 2.0, MX + 0.15, 1.9, MZ, bev=0.02)  # 横梁
for k in range(9):
    zz = MZ - 0.8 + k * 0.2
    cyl(M['bronze'], 0.02, 0.5, MX - 0.05, 1.55, zz, n=8); cyl(M['iron'], 0.004, 0.18, MX - 0.05, 1.22, zz, n=6)
box(M['paper'], 0.42, 0.14, 1.5, MX - 0.12, 1.11, MZ, bev=0.01)
box(M['burg'], 0.46, 0.04, 1.54, MX - 0.12, 1.2, MZ, bev=0.01)
# 飞轮（朝走道）
torus(M['bronze'], 0.5, 0.05, MX - 0.68, 1.2, MZ + 0.55, axis='x')
cyl(M['iron'], 0.09, 0.2, MX - 0.62, 1.2, MZ + 0.55, axis='x', n=18)
for k in range(6):
    a = k * math.pi / 3; box(M['bronze'], 0.04, 0.9, 0.05, MX - 0.68, 1.2, MZ + 0.55, rx=a)
cyl(M['iron'], 0.04, 0.5, MX - 0.42, 1.2, MZ + 0.55, axis='x', n=10)
# 线轴架 + 红线
box(M['walnutD'], 0.3, 0.06, 1.6, MX + 0.2, 2.45, MZ, bev=0.01)
for k in range(6):
    zz = MZ - 0.65 + k * 0.26
    cyl(M['bronze'], 0.008, 0.36, MX + 0.2, 2.62, zz, n=6); cyl(M['thread'], 0.06, 0.18, MX + 0.2, 2.6, zz, n=16)
    cyl(M['thread'], 0.004, 6.3, MX + 0.2, 2.7 + 3.15, zz, n=4)
cyl(M['bronze'], 0.008, 0.6, MX + 0.2, 2.25, MZ - 0.78, n=6); cyl(M['bronze'], 0.008, 0.6, MX + 0.2, 2.25, MZ + 0.78, n=6)
ob = L.finish(S, OUT, 'm1_entry')
# ---------- 预览：补上游戏里的牛皮纸墙/地面作上下文（不导出）----------
kr = M['kraft']
for sx in (-1, 1): L.box(kr, 0.4, 9, 14, sx * 3.2, 4.5, -60)
L.box(kr, 7, 9, 0.4, 0, 4.5, -53)
L.box(kr, 8, 0.3, 14, 0, -0.15, -60)
L.box(L.mat('m1_seam', (1, 1, 1), 0.5, emit=(1.0, 0.93, 0.85)), 0.3, 6, 0.02, 0, 3, -53.3)
L.render(S, PREV, 'm1_entry', [((0.3, 1.7, -64.0), (0, 2.6, -53.5), 24), ((-2.2, 1.6, -55.0), (1.0, 3.0, -64.6), 20), ((-1.6, 1.5, -58.5), (2.2, 1.4, -61.0), 26), ((0, 1.6, -57), (0, 9, -59.5), 20)],
         lights=[((0, 6.0, -56.5), 900, (1, 0.78, 0.55)), ((0, 6.0, -61.0), 900, (1, 0.78, 0.55)), ((0, 3, -53.6), 120, (1, 0.92, 0.85)), ((1.2, 3.0, -61), 300, (1, 0.7, 0.5))])
