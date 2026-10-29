# 室外构件：Cycles 烘焙环境光遮蔽到顶点色（COLOR_0），并导出 GLB（材质只留名字/因子，贴图在 three 端按名字套 PBR）
# 用法：blender -b in.blend --python bake_vao.py -- out.glb [samples=64] [ao_dist=5] [maxedge=1.2]
import bpy, bmesh, sys, time, math

argv = sys.argv[sys.argv.index('--') + 1:]
out = argv[0]
samples = int(argv[1]) if len(argv) > 1 else 64
dist = float(argv[2]) if len(argv) > 2 else 5.0
maxedge = float(argv[3]) if len(argv) > 3 else 1.2
SUBDIV = {'ashlar', 'ashlarDeep', 'plinth', 'slate', 'steps', 'lead', 'paving', 'paveDark', 'curb', 'lawn', 'marbleDark', 'COL_skip'}

sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples; sc.cycles.use_denoising = False
w = sc.world or bpy.data.worlds.new('w'); sc.world = w
w.light_settings.distance = dist

for o in bpy.data.objects:
    if o.name.startswith('C_'): o.hide_render = True  # 碰撞体不参与烘焙（否则遮光）
hero = [o for o in bpy.data.objects if o.type == 'MESH' and not o.name.startswith(('C_', 'OCC_'))]
t0 = time.time()
for o in hero:
    mat = o.data.materials[0].name if o.data.materials else ''
    if mat in SUBDIV:
        bm = bmesh.new(); bm.from_mesh(o.data)
        for it in range(6):
            long = [e for e in bm.edges if e.calc_length() > maxedge]
            if not long: break
            bmesh.ops.subdivide_edges(bm, edges=long, cuts=1, use_grid_fill=True)
        bm.to_mesh(o.data); bm.free()
    print('obj', o.name, round(time.time() - t0, 1), flush=True)
    me = o.data
    if 'AO' not in me.color_attributes:
        me.color_attributes.new('AO', 'BYTE_COLOR', 'CORNER')
    me.color_attributes.active_color = me.color_attributes['AO']
    me.color_attributes.render_color_index = me.color_attributes.find('AO')
print('subdiv done', flush=True); print('x', round(time.time() - t0, 1), 's; tris', sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in hero))

bpy.ops.object.select_all(action='DESELECT')
for o in hero: o.select_set(True)
bpy.context.view_layer.objects.active = hero[0]
sc.render.bake.target = 'VERTEX_COLORS'
sc.render.bake.margin = 0
t0 = time.time()
bpy.ops.object.bake(type='AO')
print('bake AO', round(time.time() - t0, 1), 's')

bpy.ops.wm.save_as_mainfile(filepath=out.replace('.glb', '_baked.blend'))
# 导出（碰撞体单独导出到 *_col.glb）
for o in bpy.data.objects: o.select_set(False)
for o in hero: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True, export_vertex_color='ACTIVE', export_all_vertex_colors=False,
                          export_materials='EXPORT', export_normals=True, export_texcoords=True, export_yup=True, export_extras=False)
cols = [o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('C_')]
if cols:
    for o in bpy.data.objects: o.select_set(False)
    for o in cols: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=out.replace('.glb', '_col.glb'), export_format='GLB', use_selection=True, export_materials='NONE', export_normals=False, export_texcoords=False, export_yup=True)
print('EXPORTED', out)
