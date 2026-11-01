# R6-C 叙事管理局 · 1960–80 年代机关风厚重实木扶手椅（bureau_armchair）
# 坐标：Blender Z 上，正面朝 −Y（导出 glTF 后正面 +Z），原点 = 地面中心。尺寸 宽 0.62 深 0.58 座高 0.46 总高 0.88。
# 用法：blender -b --python chair.py -- <tex_dir> <out.glb>
import bpy, bmesh, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
TEX, OUT = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def img(n, nonc=False):
    i = bpy.data.images.load(f'{TEX}/{n}.png'); 
    if nonc: i.colorspace_settings.name = 'Non-Color'
    return i
def mat(name, col=None, tex=None, nrm=None, rough=0.6, metal=0.0, nscale=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if col: b.inputs['Base Color'].default_value = (*col, 1)
    if tex:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(tex); nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    if nrm:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(nrm, True); n = nt.nodes.new('ShaderNodeNormalMap'); n.inputs['Strength'].default_value = nscale
        nt.links.new(t.outputs['Color'], n.inputs['Color']); nt.links.new(n.outputs['Normal'], b.inputs['Normal'])
    return m
M = {
  'wood': mat('bc_walnut', tex='wood_col', nrm='wood_nrm', rough=0.5, nscale=0.8),
  'leather': mat('bc_leather', tex='leather_col', nrm='leather_nrm', rough=0.42, nscale=1.0),
  'brass': mat('bc_brass', col=(0.42, 0.29, 0.16), rough=0.45, metal=0.85),
}
objs = {k: [] for k in M}

def finish(o, key, bevel=0.0, seg=1, uv=0.6):
    o.data.materials.append(M[key])
    if bevel > 0:
        md = o.modifiers.new('bv', 'BEVEL'); md.width = bevel; md.segments = seg; md.limit_method = 'ANGLE'; md.harden_normals = False
    bpy.context.view_layer.objects.active = o
    for x in bpy.context.selected_objects: x.select_set(False)
    o.select_set(True)
    bpy.ops.object.modifier_apply(modifier='bv') if bevel > 0 else None
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.cube_project(cube_size=uv, correct_aspect=True, clip_to_bounds=False, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    if seg > 1: 
        for p in o.data.polygons: p.use_smooth = True
    objs[key].append(o); return o

def box(key, sx, sy, sz, x, y, z, rx=0.0, bevel=0.005, seg=2, uv=0.6):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z)); o = bpy.context.object
    o.scale = (sx, sy, sz); o.rotation_euler = (rx, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return finish(o, key, bevel, seg, uv)

def tube(key, pts, sx, sy, bevel=0.004):
    """沿折线 pts（中心点）放样的方截面杆件，截面 sx×sy（水平截面）"""
    me = bpy.data.meshes.new('t'); bm = bmesh.new(); rings = []
    for (x, y, z) in pts:
        rings.append([bm.verts.new((x + dx * sx / 2, y + dy * sy / 2, z)) for dx, dy in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    for a, b in zip(rings, rings[1:]):
        for i in range(4): bm.faces.new((a[i], a[(i + 1) % 4], b[(i + 1) % 4], b[i]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    bm.normal_update(); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('t', me); sc.collection.objects.link(o)
    return finish(o, key, bevel, 2)

W, D = 0.62, 0.58
LX, LY, L = 0.262, 0.245, 0.052          # 腿中心 x、y，腿截面
RAKE = 0.09                              # 后腿座面以上后仰斜率
SEAT = 0.46
by = lambda z: LY + max(0, z - 0.45) * RAKE  # 后腿中心 y(z)

# 腿：前腿直通至扶手下（0.635），后腿座面以上后仰
for sx in (-1, 1):
    tube('wood', [(sx * LX, -LY, 0.03), (sx * LX, -LY, 0.635)], L, L)
    tube('wood', [(sx * LX, LY, 0.03), (sx * LX, LY, 0.45), (sx * LX, by(0.82), 0.82)], L, 0.056)
    for yy in (-LY, LY): box('brass', 0.058, 0.058, 0.03, sx * LX, yy, 0.015, bevel=0.003)  # 暗铜包脚
# 座框围板（真厚 0.028，高 0.09）
box('wood', 2 * LX - L, 0.028, 0.09, 0, -LY + 0.004, 0.36)
box('wood', 2 * LX - L, 0.028, 0.09, 0, LY - 0.004, 0.36)
for sx in (-1, 1): box('wood', 0.028, 2 * LY - L, 0.09, sx * (LX - 0.004), 0, 0.36)
# 下部 H 形横枨
for sx in (-1, 1): box('wood', 0.03, 2 * LY - L, 0.042, sx * LX, 0, 0.14)
box('wood', 2 * LX - L, 0.034, 0.038, 0, 0.02, 0.14)
# 宽扶手（0.10 宽，前端出挑），扶手下靠背侧短托
for sx in (-1, 1):
    y0, y1 = -LY - 0.05, by(0.65) - 0.01
    box('wood', 0.10, y1 - y0, 0.032, sx * (LX + 0.004), (y0 + y1) / 2, 0.651, bevel=0.007, seg=2)
# 软包坐垫（暗酒红褐皮革），略高出座框
box('leather', 2 * LX - L - 0.006, 2 * LY + 0.01, 0.075, 0, -0.005, SEAT - 0.0375, bevel=0.022, seg=4, uv=0.5)
# 座框上沿木压条 + 坐垫下的托板感由围板承担
# 靠背：下横档（木）+ 软包靠背 + 顶横档（木），随后腿后仰
tilt = math.atan(RAKE)
def back_y(z, off=0.0): return by(z) + off
box('wood', 2 * LX - L, 0.03, 0.05, 0, back_y(0.53), 0.53, rx=-tilt)               # 下横档
box('leather', 2 * LX - L - 0.004, 0.055, 0.24, 0, back_y(0.68, -0.012), 0.68, rx=-tilt, bevel=0.02, seg=4, uv=0.5)  # 软包靠背
box('wood', W - 0.02, 0.05, 0.065, 0, back_y(0.8475), 0.8475, rx=-tilt, bevel=0.008, seg=2)  # 顶横档（总高 0.88）

# 暗铜泡钉：坐垫前沿/两侧下缘、靠背软包四周
def nail(x, y, z):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=4, radius=0.0075, location=(x, y, z)); o = bpy.context.object
    o.scale = (1, 1, 1); finish(o, 'brass', 0, 2, 0.6)
cw, cd, cz = LX - L / 2 - 0.003, LY + 0.005, SEAT - 0.06
for i in range(13): nail(-cw + 0.02 + i * (2 * cw - 0.04) / 12, -cd - 0.0055 - 0.005, cz)
for sx in (-1, 1):
    for i in range(9): nail(sx * (cw + 0.006), -cd + 0.03 + i * (2 * cd - 0.08) / 8, cz)
for i in range(11):
    x = -cw + 0.02 + i * (2 * cw - 0.04) / 10
    for z in (0.572, 0.788): nail(x, by(z) - 0.012 - 0.0275 * math.cos(tilt) - 0.002, z)
# 合并同材质
final = []
for k, lst in objs.items():
    if not lst: continue
    for x in bpy.context.selected_objects: x.select_set(False)
    for o in lst: o.select_set(True)
    bpy.context.view_layer.objects.active = lst[0]; bpy.ops.object.join(); o = bpy.context.object; o.name = 'bc_' + k; final.append(o)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in final)
mn = [min((o.matrix_world @ Vector(c))[i] for o in final for c in o.bound_box) for i in range(3)]
mx = [max((o.matrix_world @ Vector(c))[i] for o in final for c in o.bound_box) for i in range(3)]
print('TRIS', tris, 'BBOX', [round(a, 3) for a in mn], [round(a, 3) for a in mx])
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True, export_image_format='WEBP', export_yup=True)
