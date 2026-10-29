# 室内：Cycles CPU 烘焙漫反射全局光照（直射 + 间接，不含反照率）到光照贴图（第二套 UV），去噪 + 外扩后编码为 8bit gamma PNG；
# 另渲染一张等距柱状全景作为反射探针（HDR）。导出 GLB（TEXCOORD_1 = 光照贴图 UV）。
# 用法：blender -b in.blend --python bake_lm.py -- out.glb [res=4096] [samples=128] [probe=x,y,z(游戏坐标)] [range=4]
import bpy, bmesh, sys, time, math, os
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:]
out = argv[0]
RES = int(argv[1]) if len(argv) > 1 else 4096
SPP = int(argv[2]) if len(argv) > 2 else 128
probe = [float(v) for v in argv[3].split(',')] if len(argv) > 3 and argv[3] != '-' else None
RANGE = float(argv[4]) if len(argv) > 4 else 4.0
base = out[:-4]
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SPP; sc.cycles.use_denoising = False
sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 4; sc.cycles.glossy_bounces = 1; sc.cycles.transparent_max_bounces = 4
sc.cycles.sample_clamp_indirect = 8.0

for o in bpy.data.objects:
    if o.name.startswith('C_'): o.hide_render = True  # 碰撞体不参与烘焙（否则遮光）
hero = [o for o in bpy.data.objects if o.type == 'MESH' and not o.name.startswith(('C_', 'OCC_'))]
NOLM = {'screenEmit', 'glassN', 'glassA', 'glassRose', 'glassClear', 'COL'}   # 自发光/透明：不烘焙（three 端自发光或透明）
bake_objs = [o for o in hero if (o.data.materials[0].name if o.data.materials else '') not in NOLM]
t0 = time.time()
# ---- 1. 光照贴图 UV（所有物体共享一张图集）----
for o in bake_objs:
    me = o.data
    while len(me.uv_layers) < 2: me.uv_layers.new(name='LM')
    me.uv_layers.active_index = 1
bpy.ops.object.select_all(action='DESELECT')
for o in bake_objs: o.select_set(True)
bpy.context.view_layer.objects.active = bake_objs[0]
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(55), island_margin=0.0, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
bpy.ops.uv.pack_islands(udim_source='CLOSEST_UDIM', rotate=True, margin_method='FRACTION', margin=0.0025 * 4096 / RES * 0.6, shape_method='CONCAVE')
bpy.ops.object.mode_set(mode='OBJECT')
print('LM uv', round(time.time() - t0, 1), 's', flush=True)

# ---- 2. 烘焙目标图 ----
img = bpy.data.images.new('LM', RES, RES, float_buffer=True, alpha=False)
for o in bake_objs:
    for m in o.data.materials:
        nt = m.node_tree
        n = nt.nodes.get('LM_TEX') or nt.nodes.new('ShaderNodeTexImage'); n.name = 'LM_TEX'; n.image = img
        uvn = nt.nodes.get('LM_UV') or nt.nodes.new('ShaderNodeUVMap'); uvn.name = 'LM_UV'; uvn.uv_map = 'LM'
        nt.links.new(uvn.outputs['UV'], n.inputs['Vector'])
        nt.nodes.active = n
bpy.ops.object.select_all(action='DESELECT')
for o in bake_objs: o.select_set(True)
sc.render.bake.target = 'IMAGE_TEXTURES'; sc.render.bake.margin = 6; sc.render.bake.margin_type = 'EXTEND'
sc.render.bake.use_pass_color = False; sc.render.bake.use_pass_direct = True; sc.render.bake.use_pass_indirect = True
t0 = time.time()
bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, margin=6, use_clear=True)
print('LM bake', round(time.time() - t0, 1), 's', flush=True)
px = np.empty(RES * RES * 4, dtype=np.float32); img.pixels.foreach_get(px); px = px.reshape(RES, RES, 4)[:, :, :3]
np.save(base + '_lm_raw.npy', px.astype(np.float16))

# ---- 3. 去噪：岛内归一化高斯（覆盖掩码 = 烘焙过的像素），再外扩 ----
mask = (px.sum(axis=2) > 1e-6).astype(np.float32)
def blur(a, r):
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / (r / 2.0)) ** 2); k /= k.sum()
    b = a.copy()
    for ax in (0, 1):
        b = sum(np.roll(b, i - r, axis=ax) * k[i] for i in range(2 * r + 1))
    return b
num = blur(px * mask[:, :, None], 3); den = blur(mask, 3)[:, :, None]
den_safe = np.maximum(den, 1e-4)
den_px = np.where(den > 1e-3, num / den_safe, px)
# 边缘保留：与原值差太多的像素（硬阴影边）混回一部分
diff = np.abs(den_px - px).sum(axis=2, keepdims=True) / (px.sum(axis=2, keepdims=True) + 0.05)
w = np.clip(diff * 0.6, 0, 0.5)
res = den_px * (1 - w) + px * w
# 外扩 8 像素（防止 mip 渗色）
filled = res * mask[:, :, None]; m = mask.copy()
for it in range(8):
    nb = np.zeros_like(filled); cnt = np.zeros_like(m)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nb += np.roll(np.roll(filled, dy, 0), dx, 1); cnt += np.roll(np.roll(m, dy, 0), dx, 1)
    grow = (m == 0) & (cnt > 0)
    filled[grow] = nb[grow] / cnt[grow][:, None]; m[grow] = 1
res = filled
# ---- 4. 编码：v = (rgb / RANGE)^(1/2.2) → 8bit PNG（three 端：pow(v,2.2)*RANGE）----
p999 = float(np.percentile(res[m > 0].max(axis=1), 99.9)) if m.sum() > 0 else 1.0
print('LM p99.9', round(p999, 3), 'range', RANGE, flush=True)
enc = np.clip(res / RANGE, 0, 1) ** (1 / 2.2)
rgba = np.concatenate([enc, np.ones((RES, RES, 1), np.float32)], axis=2)
im2 = bpy.data.images.new('LM_ENC', RES, RES, alpha=False)
im2.pixels.foreach_set(rgba.astype(np.float32).ravel())
im2.filepath_raw = base + '_lm.png'; im2.file_format = 'PNG'; im2.save()
print('LM saved', base + '_lm.png', flush=True)
for o in bake_objs:
    for m_ in o.data.materials:
        n = m_.node_tree.nodes.get('LM_TEX')
        if n: m_.node_tree.nodes.remove(n)
        n = m_.node_tree.nodes.get('LM_UV')
        if n: m_.node_tree.nodes.remove(n)
bpy.ops.wm.save_as_mainfile(filepath=base + '_baked.blend')

# ---- 5. 反射探针：等距柱状全景（HDR）----
if probe:
    cam = bpy.data.cameras.new('probe'); cam.type = 'PANO'
    try: cam.panorama_type = 'EQUIRECTANGULAR'
    except Exception: sc.cycles.panorama_type = 'EQUIRECTANGULAR'
    co = bpy.data.objects.new('probe', cam); sc.collection.objects.link(co); sc.camera = co
    co.location = (probe[0], -probe[2], probe[1]); co.rotation_euler = (math.pi / 2, 0, -math.pi / 2)
    sc.render.resolution_x, sc.render.resolution_y = 768, 384; sc.render.resolution_percentage = 100
    sc.cycles.samples = int(os.environ.get('PROBE_SPP', '24'))
    sc.render.image_settings.file_format = 'HDR'; sc.render.filepath = base + '_probe.hdr'
    t0 = time.time(); bpy.ops.render.render(write_still=True); print('probe', round(time.time() - t0, 1), 's', flush=True)

# ---- 6. 导出 ----
# 去掉贴图节点（three 端按材质名套 PBR；否则 glTF 会把整套贴图塞进 GLB）
for m_ in bpy.data.materials:
    if m_.use_nodes:
        for n in [n for n in m_.node_tree.nodes if n.type == 'TEX_IMAGE']: m_.node_tree.nodes.remove(n)
for o in bpy.data.objects: o.select_set(False)
for o in hero:
    o.select_set(True)
    if len(o.data.uv_layers) > 1: o.data.uv_layers.active_index = 0
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True, export_materials='EXPORT', export_normals=True, export_texcoords=True, export_yup=True, export_vertex_color='NONE' if bpy.app.version >= (4, 2, 0) else None)
cols = [o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('C_')]
if cols:
    for o in bpy.data.objects: o.select_set(False)
    for o in cols: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=base + '_col.glb', export_format='GLB', use_selection=True, export_materials='NONE', export_normals=False, export_texcoords=False, export_yup=True)
print('EXPORTED', out, flush=True)
