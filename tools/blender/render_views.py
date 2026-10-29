# R2 离线样板渲染（Cycles CPU + OIDN 去噪）：按游戏机位（tools/../src/shots.js 同坐标）渲染写实样板图
# 用法：blender -b scene.blend --python render_views.py -- kind(hall|ext) 'views(json: [[name,[x,y,z],[lx,ly,lz],fov],...])' outdir WxH samples [append.blend,...]
import bpy, sys, os, math, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mathutils import Vector
import pbr

argv = sys.argv[sys.argv.index('--') + 1:]
kind, views, outdir, res, spp = argv[0], json.loads(argv[1]), argv[2], argv[3], int(argv[4])
extra = [p for p in (argv[5].split(',') if len(argv) > 5 else []) if p]
os.makedirs(outdir, exist_ok=True)
sc = bpy.context.scene
for p in extra:  # 追加其它场景（如广场 + 主楼）
    with bpy.data.libraries.load(p) as (src, dst):
        dst.objects = [n for n in src.objects if not n.startswith(('C_', 'OCC_'))]
    co = bpy.data.collections.new(os.path.basename(p)); sc.collection.children.link(co)
    for o in dst.objects:
        if o is not None and o.type == 'MESH': co.objects.link(o)
for o in bpy.data.objects:
    if o.name.startswith(('C_', 'OCC_')): o.hide_render = True
for c in bpy.data.collections:
    if c.name.startswith(('col', 'occluder')): c.hide_render = True
pbr.apply('hall' if kind == 'hall' else 'ext')

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = spp
sc.cycles.use_denoising = False  # 此 arm64 构建无 OIDN：离线渲染后用 tools/denoise.py（OpenCV NLM）去噪
sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.03
sc.cycles.max_bounces = 8; sc.cycles.diffuse_bounces = 4; sc.cycles.glossy_bounces = 4; sc.cycles.transmission_bounces = 4
sc.cycles.sample_clamp_indirect = 6.0; sc.cycles.blur_glossy = 1.0
sc.render.resolution_x, sc.render.resolution_y = map(int, res.split('x')); sc.render.resolution_percentage = 100
sc.view_settings.view_transform = 'AgX'
try: sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception: pass
sc.render.image_settings.file_format = 'PNG'

w = sc.world or bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
nt = w.node_tree; bg = nt.nodes.get('Background')
HDR = '/workspace/work/sky_2k.hdr'
if kind == 'hall':
    bg.inputs[1].default_value = 0.0
    sc.view_settings.exposure = float(os.environ.get('EXPO', '0.6'))
else:
    env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(HDR)
    mp = nt.nodes.new('ShaderNodeMapping'); tc = nt.nodes.new('ShaderNodeTexCoord')
    mp.inputs['Rotation'].default_value = (0, 0, math.radians(float(os.environ.get('SKYROT', '200'))))
    nt.links.new(tc.outputs['Generated'], mp.inputs['Vector']); nt.links.new(mp.outputs[0], env.inputs['Vector']); nt.links.new(env.outputs[0], bg.inputs[0])
    bg.inputs[1].default_value = float(os.environ.get('SKYI', '1.0'))
    if not [o for o in bpy.data.objects if o.type == 'LIGHT' and o.data.type == 'SUN']:
        s = bpy.data.lights.new('sun', 'SUN'); s.energy = float(os.environ.get('SUNE', '4.5')); s.angle = math.radians(0.6); s.color = (1.0, 0.9, 0.78)
        so = bpy.data.objects.new('sun', s); sc.collection.objects.link(so)
        so.rotation_euler = (math.radians(float(os.environ.get('SUNEL', '52'))), 0, math.radians(float(os.environ.get('SUNAZ', '-35'))))
    sc.view_settings.exposure = float(os.environ.get('EXPO', '0.0'))

cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
cam.clip_start = 0.05; cam.clip_end = 4000; cam.sensor_fit = 'VERTICAL'
G = lambda x, y, z: Vector((x, -z, y))
only = os.environ.get('ONLY', '')
for name, p, l, fov in views:
    if only and name not in only.split(','): continue
    co.location = G(*p); d = G(*l) - co.location; co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cam.angle = math.radians(fov)
    sc.render.filepath = os.path.join(outdir, name + '.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', sc.render.filepath, flush=True)
