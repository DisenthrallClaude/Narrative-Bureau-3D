# R3 批次10：程序化室内区 AO 光照贴图烘焙
# 用法：blender -b --factory-startup --python bake_ao_zone.py -- <in_dir> <id> <out_dir> [res=2048] [spp=48] [dist=1.8]
# 输入 <in_dir>/<id>.json + <id>.bin（tools/bake_export.mjs 导出，世界坐标，three Y-up）
# 输出 <out_dir>/<id>_ao_raw.npy（float16 原始 AO，后处理见 tools/bake_ao_post.py）、<id>_uv.bin（每个接收面每个三角角点 uv1，uint16 归一化）、<id>.json（键 → uv 偏移）
import bpy, sys, json, time, math
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:]
IN, ID, OUT = argv[0], argv[1], argv[2]
RES = int(argv[3]) if len(argv) > 3 else 2048
SPP = int(argv[4]) if len(argv) > 4 else 48
DIST = float(argv[5]) if len(argv) > 5 else 1.8
head = json.load(open(f'{IN}/{ID}.json'))
raw = open(f'{IN}/{ID}.bin', 'rb').read()
def f32(off, n): return np.frombuffer(raw, dtype=np.float32, count=n, offset=off)
def u32(off, n): return np.frombuffer(raw, dtype=np.uint32, count=n, offset=off)
def conv(P):  # three (x,y,z) → blender (x,-z,y)
    P = P.reshape(-1, 3); return np.stack([P[:, 0], -P[:, 2], P[:, 1]], axis=1)

for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SPP; sc.cycles.use_denoising = False
w = sc.world or bpy.data.worlds.new('w'); sc.world = w; w.light_settings.distance = DIST
t0 = time.time()

def mk_mesh(name, P, I):
    me = bpy.data.meshes.new(name)
    V = conv(P); F = I.reshape(-1, 3)
    me.vertices.add(len(V)); me.vertices.foreach_set('co', V.astype(np.float32).ravel())
    me.loops.add(len(I)); me.loops.foreach_set('vertex_index', I.astype(np.int32))
    me.polygons.add(len(F)); me.polygons.foreach_set('loop_start', np.arange(0, len(I), 3, dtype=np.int32)); me.polygons.foreach_set('loop_total', np.full(len(F), 3, dtype=np.int32))
    me.update(calc_edges=True)  # 不 validate：会删掉重合的重复三角形，角点数对不上
    return me

import os, re
SKIP = re.compile(os.environ.get('SKIPRE', r'^(gearbox|door|Door)'))
recv = []; recv_meta = []
DEG = {}
for k, r in enumerate(head['recv']):
    P = f32(r['v'], r['nv'] * 3); I = u32(r['i'], r['ni'])
    F = I.reshape(-1, 3); bad = (F[:, 0] == F[:, 1]) | (F[:, 1] == F[:, 2]) | (F[:, 0] == F[:, 2])  # 重复顶点的退化三角形（Blender 会删）→ 不建，输出时补 0
    DEG[k] = bad
    me = mk_mesh(f'R{k}', P, F[~bad].ravel())
    if len(me.polygons) != int((~bad).sum()): print('WARN polys changed', k, len(me.polygons), int((~bad).sum()), flush=True)
    o = bpy.data.objects.new(f'R{k}', me); sc.collection.objects.link(o)
    if SKIP.search(r.get('name', '')): continue  # 动画件（金库门齿轮等）只当遮挡体
    recv.append(o); recv_meta.append((k, r))
print('recv', len(recv), round(time.time() - t0, 1), flush=True)
C = np.array([[1, 0, 0, 0], [0, 0, -1, 0], [0, 1, 0, 0], [0, 0, 0, 1]], dtype=np.float64); Ci = np.linalg.inv(C)
occM = []
for k, g in enumerate(head['occG']):
    occM.append(mk_mesh(f'G{k}', f32(g['v'], g['nv'] * 3), u32(g['i'], g['ni'])))
from mathutils import Matrix
occ_mat = bpy.data.materials.new('OCC'); occ_mat.use_nodes = True
for k, it in enumerate(head['occI']):
    M = np.array(it['m'], dtype=np.float64).reshape(4, 4).T  # three 列主序
    o = bpy.data.objects.new(f'O{k}', occM[it['g']]); sc.collection.objects.link(o)
    o.matrix_world = Matrix((C @ M @ Ci).tolist())
for me in occM: me.materials.append(occ_mat)
print('occ', len(head['occI']), 'inst /', len(occM), 'geoms', round(time.time() - t0, 1), flush=True)

# ---- 共面层修正：接收面本身对 AO 射线不可见，换成「沿法线内缩 1.5 cm」的遮挡副本 ----
# （第七局地面 = 牛皮纸地板 + 贴面的文字纸页层，两层共面时 AO 射线从表面出发立刻命中另一层 → 整片地面 AO≈0.4，发黑）
import bmesh
SHRINK = float(os.environ.get('SHRINK', '0.015'))
for o in list(recv) + [bpy.data.objects[f'R{k}'] for k, r in enumerate(head['recv']) if SKIP.search(r.get('name', ''))]:
    d = o.data.copy(); bm_ = bmesh.new(); bm_.from_mesh(d); bm_.normal_update(); bm_.verts.index_update()
    # 按连通块内缩：厚度 t 的薄盒（地坪漆、地毯、踢脚）只缩 min(1.5 cm, 0.25 t)，否则上下两面缩过头会翻转、底面跑到顶面上方把整块盖黑；
    # 零厚度面片（贴花/纸页层）整体沿法线退后 1.5 cm
    seen = set()
    for v0 in bm_.verts:
        if v0.index in seen: continue
        comp = []; st = [v0]; seen.add(v0.index)
        while st:
            v = st.pop(); comp.append(v)
            for e in v.link_edges:
                w_ = e.other_vert(v)
                if w_.index not in seen: seen.add(w_.index); st.append(w_)
        co = np.array([tuple(v.co) for v in comp]); ext = co.max(0) - co.min(0); t = float(ext.min())
        sh = SHRINK if t < 1e-3 else min(SHRINK, 0.25 * t)
        for v in comp: v.co -= v.normal * sh
    bm_.to_mesh(d); bm_.free(); d.materials.clear(); d.materials.append(occ_mat)
    oc = bpy.data.objects.new(o.name + '_occ', d); sc.collection.objects.link(oc)
for o in recv:
    o.visible_shadow = False; o.visible_diffuse = False; o.visible_glossy = False; o.visible_transmission = False; o.visible_volume_scatter = False
for o in [bpy.data.objects[f'R{k}'] for k, r in enumerate(head['recv']) if SKIP.search(r.get('name', ''))]: o.hide_render = True
print('shrink copies', round(time.time() - t0, 1), flush=True)

# ---- UV 图集 ----
for o in recv:
    o.data.uv_layers.new(name='LM'); o.data.uv_layers.active_index = 0
bpy.ops.object.select_all(action='DESELECT')
for o in recv: o.select_set(True)
bpy.context.view_layer.objects.active = recv[0]
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(55), island_margin=0.0, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
bpy.ops.uv.pack_islands(udim_source='CLOSEST_UDIM', rotate=True, margin_method='FRACTION', margin=0.004 * 2048 / RES, shape_method='CONCAVE')
bpy.ops.object.mode_set(mode='OBJECT')
print('uv', round(time.time() - t0, 1), flush=True)

# ---- 烘焙 ----
img = bpy.data.images.new('AO', RES, RES, float_buffer=True, alpha=False)
bm = bpy.data.materials.new('BAKE'); bm.use_nodes = True; nt = bm.node_tree
n = nt.nodes.new('ShaderNodeTexImage'); n.image = img; uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = 'LM'; nt.links.new(uvn.outputs['UV'], n.inputs['Vector']); nt.nodes.active = n
for o in recv: o.data.materials.clear(); o.data.materials.append(bm)
bpy.ops.object.select_all(action='DESELECT')
for o in recv: o.select_set(True)
bpy.context.view_layer.objects.active = recv[0]
sc.render.bake.target = 'IMAGE_TEXTURES'; sc.render.bake.margin = 4; sc.render.bake.margin_type = 'EXTEND'
t1 = time.time()
bpy.ops.object.bake(type='AO', margin=4, use_clear=True)
print('bake', round(time.time() - t1, 1), 's', flush=True)
px = np.empty(RES * RES * 4, dtype=np.float32); img.pixels.foreach_get(px); px = px.reshape(RES, RES, 4)[:, :, 0].copy()

np.save(f'{OUT}/{ID}_ao_raw.npy', px.astype(np.float16))  # 后处理（掩码/去噪/外扩/编码）在 tools/bake_ao_post.py
uvs_all = []
for o in recv:
    a = np.empty(len(o.data.loops) * 2, dtype=np.float32); o.data.uv_layers['LM'].data.foreach_get('uv', a); uvs_all.append(a)

# ---- uv1 输出 ----
off = 0; parts = []; man = []
for (k, r), a in zip(recv_meta, uvs_all):
    bad = DEG[k]
    if bad.any(): full = np.zeros((len(bad), 6), np.float32); full[~bad] = a.reshape(-1, 6); a = full.ravel()
    if len(a) != r['ni'] * 2: print('WARN uv count', r['key'], len(a), r['ni'] * 2, flush=True); continue
    parts.append((np.clip(a, 0, 1) * 65535 + 0.5).astype(np.uint16)); man.append({'key': r['key'], 'ni': r['ni'], 'uv': off}); off += len(a)
np.concatenate(parts).tofile(f'{OUT}/{ID}_uv.bin')
json.dump({'id': ID, 'res': RES, 'spp': SPP, 'dist': DIST, 'direct': 0.5, 'recv': man}, open(f'{OUT}/{ID}.json', 'w'))
print('DONE', ID, len(man), 'recv', off // 2, 'corners', round(time.time() - t0, 1), 's', flush=True)
