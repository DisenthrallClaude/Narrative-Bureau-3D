# 批次34：306 空床卷起的军绿毛毯（螺旋截面卷 + 两端松散垂边 + 纵向压褶）+ 白棉布枕头（四角收尖、中间压凹、边缝）
# 原点：床垫顶面中心，+X 床宽方向，-Y 床头（glTF -Z 床头）。材质 dm_olive / dm_pillow 由游戏替换。
# 用法：blender -b --python dorm_bedding.py -- out.glb
import bpy, bmesh, sys, math
from mathutils import Vector
out = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(n, c):
    m = bpy.data.materials.new(n); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*c, 1); m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.95; return m
# —— 毛毯卷：沿 X 方向长 0.8 m，截面为 2.6 圈阿基米德螺线，带 1.8 cm 厚度
bm = bmesh.new(); NX = 48; NT = 120; L = 0.8; T = 0.018
rings = []
for i in range(NX + 1):
    x = -L / 2 + L * i / NX; u = i / NX
    row = []
    for j in range(NT + 1):
        a = j / NT * 2.6 * 2 * math.pi; r = 0.035 + 0.115 * a / (2.6 * 2 * math.pi)
        # 纵向压褶 + 两端松（半径放大、轻微下垂）
        end = max(0, abs(u - 0.5) * 2 - 0.7) / 0.3
        r *= 1 + 0.022 * math.sin(u * 17.3 + a * 0.9) + 0.014 * math.sin(u * 41.7 - a * 1.7 + 0.8) + 0.01 * math.sin(a * 5.3 + u * 7) + 0.12 * end  # 不等频压褶，避免成排波纹
        y = r * math.cos(a); z = r * math.sin(a) + 0.15 - 0.01 * math.sin(u * math.pi) - 0.03 * end
        row.append(bm.verts.new((x, y, max(z, 0.002))))
    rings.append(row)
# 外层尾巴：从最外圈切线方向向床尾平铺 0.22 m（毯子末端搭在床垫上）
tail = []
for i in range(NX + 1):
    v = rings[i][-1].co; row = []
    for k in range(1, 9):
        t = k / 8; row.append(bm.verts.new((v.x, v.y + 0.25 * t, max(0.004, v.z * (1 - t) ** 2 + 0.004 + 0.006 * math.sin(i * 0.9 + k)))))
    tail.append(row)
for i in range(NX):
    for j in range(NT): bm.faces.new((rings[i][j], rings[i + 1][j], rings[i + 1][j + 1], rings[i][j + 1]))
    a = [rings[i][-1]] + tail[i]; b2 = [rings[i + 1][-1]] + tail[i + 1]
    for k in range(len(a) - 1): bm.faces.new((a[k], b2[k], b2[k + 1], a[k + 1]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = bpy.data.meshes.new('bedroll'); bm.to_mesh(me); bm.free()
o = bpy.data.objects.new('bedroll', me); bpy.context.scene.collection.objects.link(o); me.materials.append(mat('dm_olive', (0.3, 0.34, 0.2)))
sol = o.modifiers.new('s', 'SOLIDIFY'); sol.thickness = T; sol.offset = 0
for p in me.polygons: p.use_smooth = True
o.location = (0, -0.62, 0)
# —— 枕头：0.58×0.36×0.13，四角收尖、中间压凹
# 两片矩形布面（上 / 下）共用边缘缝线；厚度 h(x,y) = 0.065·(1−|x|⁴)^0.7·(1−|y|⁴)^0.7 → 四角收尖成"枕角"，边缘微内凹
bm = bmesh.new(); NXp, NYp = 36, 24; top = {}; bot = {}
def cx(i): return -1 + 2 * i / NXp
def cy(j): return -1 + 2 * j / NYp
for i in range(NXp + 1):
    for j in range(NYp + 1):
        x, y = cx(i), cy(j); edge = i in (0, NXp) or j in (0, NYp)
        f = max(0.0, (1 - abs(x) ** 4)) ** 0.7 * max(0.0, (1 - abs(y) ** 4)) ** 0.7
        pinch = 1 - 0.07 * (1 - abs(y)) ** 2 if i in (0, NXp) else 1  # 枕边中段内收
        pinchy = 1 - 0.07 * (1 - abs(x)) ** 2 if j in (0, NYp) else 1
        X, Y = x * 0.29 * pinchy, y * 0.18 * pinch
        h = 0.064 * f; dent = 0.02 * max(0, 1 - (x / 0.55) ** 2 - (y / 0.65) ** 2); wr = 0.004 * math.sin(x * 9 + y * 5) * f
        top[i, j] = bm.verts.new((X, Y, h - dent + wr))
        bot[i, j] = top[i, j] if edge else bm.verts.new((X, Y, -h * 0.6))
for i in range(NXp):
    for j in range(NYp):
        bm.faces.new((top[i, j], top[i + 1, j], top[i + 1, j + 1], top[i, j + 1]))
        bm.faces.new((bot[i, j], bot[i, j + 1], bot[i + 1, j + 1], bot[i + 1, j]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
pme = bpy.data.meshes.new('pillow'); bm.to_mesh(pme); bm.free(); pw = bpy.data.objects.new('pillow', pme); bpy.context.scene.collection.objects.link(pw)
for p in pw.data.polygons: p.use_smooth = True
pw.data.materials.append(mat('dm_pillow', (0.85, 0.82, 0.74)))
pw.location = (0.02, -0.76, 0.04); pw.rotation_euler = (0.1, 0, 0.12); o.location = (0, -0.38, 0)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, use_selection=True)
