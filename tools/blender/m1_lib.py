# 批次 M1：第七局主线区 Blender 精建公共库。坐标约定同 guard_booth.py：参数 (x, y=高, z=gl 前后)，
# Blender 内 (x, -z, y)；glTF 导出 +Y up → 游戏坐标 = (x, y, z)。材质只给名字 + 近似色（游戏端按名字换成 pbr 贴图材质，见 depths.js m1Mats）。
# 色板：暗铜褐 / 深胡桃 / 暖灰石材 / 酒红褐 / 牛皮纸，暗红线为叙事母题（不配蓝绿）。
import bpy, math
from mathutils import Vector

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene

_M = {}
def mat(name, col, rough=0.6, metal=0.0, emit=None):
    if name in _M: return _M[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = 2.0
    _M[name] = m; return m

def palette():
    return dict(
        walnut=mat('m1_walnut', (0.085, 0.045, 0.025), 0.5),
        walnutD=mat('m1_walnutDark', (0.05, 0.028, 0.016), 0.45),
        stone=mat('m1_stone', (0.36, 0.33, 0.29), 0.7),
        stoneD=mat('m1_stoneDark', (0.20, 0.185, 0.165), 0.65),
        bronze=mat('m1_bronze', (0.23, 0.15, 0.08), 0.38, 1.0),
        burg=mat('m1_burgundy', (0.16, 0.035, 0.03), 0.6),
        kraft=mat('m1_kraft', (0.45, 0.30, 0.16), 0.85),
        iron=mat('m1_iron', (0.05, 0.045, 0.04), 0.45, 0.9),
        thread=mat('m1_thread', (0.35, 0.03, 0.02), 0.5, emit=(0.6, 0.06, 0.04)),
        paper=mat('m1_paper', (0.78, 0.72, 0.6), 0.9),
    )

def _fin(o, m, bev):
    o.data.materials.append(m)
    if bev:
        md = o.modifiers.new('bev', 'BEVEL'); md.width = bev; md.segments = 2; md.limit_method = 'ANGLE'
    return o

def box(m, sx, sy, sz, x=0, y=0, z=0, bev=0.0, ry=0.0, rx=0.0, rz=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y)); o = bpy.context.object
    o.scale = (sx, sz, sy); o.rotation_euler = (rx, rz, ry)
    return _fin(o, m, bev)

def cyl(m, r, h, x=0, y=0, z=0, axis='y', n=24, r2=None, bev=0.0):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=n, location=(x, -z, y))
    else: bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=h, vertices=n, location=(x, -z, y))
    o = bpy.context.object
    if axis == 'x': o.rotation_euler = (0, math.pi / 2, 0)
    elif axis == 'z': o.rotation_euler = (math.pi / 2, 0, 0)
    return _fin(o, m, bev)

def torus(m, R, r, x=0, y=0, z=0, axis='x'):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=40, minor_segments=8, location=(x, -z, y)); o = bpy.context.object
    if axis == 'x': o.rotation_euler = (0, math.pi / 2, 0)
    elif axis == 'z': o.rotation_euler = (math.pi / 2, 0, 0)
    return _fin(o, m, 0)

def arch_rib(m, span, rise, thick_z, depth, y0, z=0, segs=20, x0=0.0):
    """半圆/弓形拱肋：在 x-y 平面（游戏坐标），厚度 thick_z（沿 z），截面高 depth（径向）。"""
    import bmesh
    me = bpy.data.meshes.new('rib'); bm = bmesh.new(); R = span / 2
    outer, inner = [], []
    for i in range(segs + 1):
        a = math.pi * i / segs; cx, cy = math.cos(a), math.sin(a)
        ox, oy = x0 + cx * R, y0 + cy * rise; ix, iy = x0 + cx * (R - depth), y0 + cy * (rise - depth)
        outer.append((ox, oy)); inner.append((ix, iy))
    vs = []
    for zz in (-thick_z / 2, thick_z / 2):
        row = [bm.verts.new((px, -(z + zz), py)) for (px, py) in outer] + [bm.verts.new((px, -(z + zz), py)) for (px, py) in inner]
        vs.append(row)
    n = segs + 1
    for s in range(2):
        r = vs[s]
        for i in range(segs):
            f = [r[i], r[i + 1], r[n + i + 1], r[n + i]]; bm.faces.new(f if s else f[::-1])
    for i in range(segs):
        for (a, b) in ((i, i + 1), (n + i + 1, n + i)):
            bm.faces.new([vs[0][a], vs[0][b], vs[1][b], vs[1][a]])
    for e in (0, segs):
        bm.faces.new([vs[0][e], vs[1][e], vs[1][n + e], vs[0][n + e]] if e == 0 else [vs[0][n + e], vs[1][n + e], vs[1][e], vs[0][e]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('rib', me); bpy.context.collection.objects.link(o)
    o.data.materials.append(m); return o

def finish(S, out, name, cube=1.0):
    """应用修改器 → 立方投影 UV（1 m 一张，不拉伸）→ 合并 → 导出 GLB。"""
    for o in list(S.objects):
        if o.type != 'MESH': continue
        bpy.context.view_layer.objects.active = o
        for md in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.ops.object.select_all(action='DESELECT')
    for o in S.objects:
        if o.type == 'MESH': o.select_set(True)
    bpy.context.view_layer.objects.active = [o for o in S.objects if o.type == 'MESH'][0]
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.object.join(); ob = bpy.context.view_layer.objects.active; ob.name = name
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.cube_project(cube_size=cube, correct_aspect=True, clip_to_bounds=False, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, use_selection=True)
    print('M1', name, 'tris', sum(len(p.vertices) - 2 for p in ob.data.polygons), 'dims', tuple(round(v, 2) for v in ob.dimensions))
    return ob

def render(S, prev, name, views, res=(800, 560), bg=(0.05, 0.04, 0.035), lights=()):
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (*bg, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    for (p, e, c) in lights:
        bpy.ops.object.light_add(type='POINT', location=(p[0], -p[2], p[1])); L = bpy.context.object; L.data.energy = e; L.data.color = c; L.data.shadow_soft_size = 0.6
    S.render.engine = 'CYCLES'; S.cycles.samples = 32; S.cycles.use_denoising = False
    try: S.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception: pass
    S.render.resolution_x, S.render.resolution_y = res; S.view_settings.view_transform = 'AgX'
    for i, (cp, tg, lens) in enumerate(views):
        cpb = Vector((cp[0], -cp[2], cp[1])); tgb = Vector((tg[0], -tg[2], tg[1]))
        bpy.ops.object.camera_add(location=cpb); cam = bpy.context.object; S.camera = cam
        cam.rotation_euler = (tgb - cpb).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lens
        S.render.filepath = f'{prev}/{name}_{i}.png'; bpy.ops.render.render(write_still=True)
