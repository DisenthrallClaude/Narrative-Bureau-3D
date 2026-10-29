# R2 写实 PBR 材质库（Blender / Cycles）：按材质名把 Poly Haven / ambientCG 贴图（public/assets/tex）接成真实材质，
# 并叠加「真实感层」：大尺度色差（噪波，色相/明度微变）、缝隙污垢（AO 节点）、竖向雨痕/水渍、金属氧化。
# three 端 hero.js 的 extMats()/hallMats() 用同一套贴图与色调，保证游戏与离线渲染一致。
# 用法：import pbr; pbr.apply(kind='hall'|'facade'|'plaza')  ——在已有 .blend 里按材质名替换节点树
import bpy, os

BAKE = False  # 烘焙光照贴图时关闭 AO 污垢节点（省反弹采样；污垢只影响颜色，不影响光照贴图）
TEX = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'assets', 'tex')

def _img(path, srgb):
    p = os.path.abspath(path)
    if not os.path.exists(p): return None
    im = bpy.data.images.load(p, check_existing=True)
    im.colorspace_settings.name = 'sRGB' if srgb else 'Non-Color'
    return im

def tex_paths(name):
    """ph:xxx → Poly Haven（col/nrm/arm），否则 ambientCG（color/normal/rough[N]/metal）"""
    if name.startswith('ph:'):
        n = name[3:]; b = os.path.join(TEX, 'ph', n)
        return {'col': b + '_col.webp', 'nrm': b + '_nrm.webp', 'arm': b + '_arm.webp'}
    b = os.path.join(TEX, name)
    d = {'col': b + '_color.webp', 'nrm': b + '_normal.webp', 'rough': b + '_rough.webp', 'metal': b + '_metal.webp'}
    if os.path.exists(b + '_roughN.webp'): d['roughN'] = b + '_roughN.webp'
    return d

def build(m, spec, uvname='UVMap'):
    """spec: tex, tint(rgb), rough (固定值或 None=贴图), rmul, metal, nrm, coat, var (色差强度), grime (缝隙污垢), streak (雨痕), emit"""
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    N = nt.nodes.new; L = nt.links.new
    out = N('ShaderNodeOutputMaterial'); out.location = (900, 0)
    bs = N('ShaderNodeBsdfPrincipled'); bs.location = (600, 0); L(bs.outputs[0], out.inputs['Surface'])
    tint = spec.get('tint', (1, 1, 1))
    if 'emit' in spec:
        c, s = spec['emit']; bs.inputs['Base Color'].default_value = (0, 0, 0, 1)
        bs.inputs['Emission Color'].default_value = (*c, 1); bs.inputs['Emission Strength'].default_value = s
        if spec.get('emitTex') and not BAKE:  # 大屏：贴游戏同款屏幕画面（按面片包围盒投 UV）
            im = _img(spec['emitTex'], True)
            if im:
                t = N('ShaderNodeTexImage'); t.image = im; t.extension = 'CLIP'
                tc = N('ShaderNodeTexCoord'); sx = N('ShaderNodeSeparateXYZ'); L(tc.outputs['Generated'], sx.inputs[0])
                cb = N('ShaderNodeCombineXYZ'); L(sx.outputs['X'], cb.inputs['X']); L(sx.outputs['Z'], cb.inputs['Y']); L(cb.outputs[0], t.inputs['Vector'])
                L(t.outputs['Color'], bs.inputs['Emission Color'])
        return
    if spec.get('glass'):
        bs.inputs['Base Color'].default_value = (*tint, 1); bs.inputs['Roughness'].default_value = spec.get('rough', 0.02)
        bs.inputs['Transmission Weight'].default_value = 1.0; bs.inputs['IOR'].default_value = 1.5
        if spec.get('bakeClear'): bs.inputs['Alpha'].default_value = 0.0
        return
    uv = N('ShaderNodeUVMap'); uv.uv_map = uvname; uv.location = (-1200, 0)
    coord = uv.outputs['UV']
    if spec.get('uvs'):
        mp = N('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (spec['uvs'], spec['uvs'], 1); L(coord, mp.inputs['Vector']); coord = mp.outputs[0]
    base = None; rough = None; metal = None
    if spec.get('tex'):
        P = tex_paths(spec['tex'])
        ci = _img(P['col'], True)
        if ci:
            t = N('ShaderNodeTexImage'); t.image = ci; t.location = (-900, 300); L(coord, t.inputs['Vector']); base = t.outputs['Color']
        ni = _img(P['nrm'], False)
        if ni and spec.get('nrm', 1.0) > 0:
            t = N('ShaderNodeTexImage'); t.image = ni; t.location = (-900, -300); L(coord, t.inputs['Vector'])
            nm = N('ShaderNodeNormalMap'); nm.uv_map = uvname; nm.inputs['Strength'].default_value = spec.get('nrm', 1.0); L(t.outputs['Color'], nm.inputs['Color']); L(nm.outputs[0], bs.inputs['Normal'])
        if 'arm' in P:
            ai = _img(P['arm'], False)
            if ai:
                t = N('ShaderNodeTexImage'); t.image = ai; t.location = (-900, 0); L(coord, t.inputs['Vector'])
                sp = N('ShaderNodeSeparateColor'); L(t.outputs['Color'], sp.inputs[0]); rough = sp.outputs[1]
        else:
            ri = _img(P.get('roughN') if spec.get('rn') and 'roughN' in P else P['rough'], False)
            if ri:
                t = N('ShaderNodeTexImage'); t.image = ri; t.location = (-900, 0); L(coord, t.inputs['Vector']); rough = t.outputs['Color']
            mi = _img(P['metal'], False) if spec.get('metalmap') else None
            if mi:
                t = N('ShaderNodeTexImage'); t.image = mi; L(coord, t.inputs['Vector']); metal = t.outputs['Color']
    # ---- 颜色：贴图 × 色调；去饱和
    col_rgb = N('ShaderNodeRGB'); col_rgb.outputs[0].default_value = (*tint, 1)
    if base is not None:
        if spec.get('desat'):
            hs = N('ShaderNodeHueSaturation'); hs.inputs['Saturation'].default_value = 1 - spec['desat']; L(base, hs.inputs['Color']); base = hs.outputs['Color']
        mul = N('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1.0
        L(base, mul.inputs[6]); L(col_rgb.outputs[0], mul.inputs[7]); base = mul.outputs[2]
    else:
        base = col_rgb.outputs[0]
    # ---- 真实感层 1：大尺度色差（物体空间噪波，2–6 m 斑块；明度 ±var，色相轻微偏暖/偏冷）
    var = spec.get('var', 0.0)
    tc = N('ShaderNodeTexCoord')
    if var > 0:
        nz = N('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = spec.get('varScale', 0.25); nz.inputs['Detail'].default_value = 6; nz.inputs['Roughness'].default_value = 0.6
        L(tc.outputs['Object'], nz.inputs['Vector'])
        ramp = N('ShaderNodeValToRGB'); L(nz.outputs['Fac'], ramp.inputs['Fac'])
        e = ramp.color_ramp.elements; e[0].position = 0.3; e[1].position = 0.7
        lo, hi = 1 - var, 1 + var * 0.6
        e[0].color = (lo * 0.97, lo * 0.98, lo * 1.0, 1); e[1].color = (hi * 1.02, hi, hi * 0.95, 1)
        mv = N('ShaderNodeMix'); mv.data_type = 'RGBA'; mv.blend_type = 'MULTIPLY'; mv.inputs['Factor'].default_value = 1.0
        L(base, mv.inputs[6]); L(ramp.outputs['Color'], mv.inputs[7]); base = mv.outputs[2]
    # ---- 真实感层 2：竖向雨痕/水渍（拉伸噪波，只在竖直面）
    st = spec.get('streak', 0.0)
    if st > 0:
        mp = N('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (6.0, 6.0, 0.25); L(tc.outputs['Object'], mp.inputs['Vector'])
        nz = N('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.2; nz.inputs['Detail'].default_value = 8; L(mp.outputs[0], nz.inputs['Vector'])
        ramp = N('ShaderNodeValToRGB'); L(nz.outputs['Fac'], ramp.inputs['Fac']); e = ramp.color_ramp.elements; e[0].position = 0.45; e[1].position = 0.75
        e[0].color = (1, 1, 1, 1); e[1].color = (1 - st, 1 - st * 1.02, 1 - st * 1.05, 1)
        mv = N('ShaderNodeMix'); mv.data_type = 'RGBA'; mv.blend_type = 'MULTIPLY'; mv.inputs['Factor'].default_value = 1.0
        L(base, mv.inputs[6]); L(ramp.outputs['Color'], mv.inputs[7]); base = mv.outputs[2]
    # ---- 真实感层 3：缝隙污垢（AO 节点，暗角积灰）
    gr = 0.0 if BAKE else spec.get('grime', 0.0)
    if gr > 0:
        ao = N('ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = spec.get('grimeDist', 0.35); ao.samples = 8
        ramp = N('ShaderNodeValToRGB'); L(ao.outputs['AO'], ramp.inputs['Fac']); e = ramp.color_ramp.elements; e[0].position = 0.2; e[1].position = 0.9
        e[0].color = (1 - gr, 1 - gr * 1.05, 1 - gr * 1.15, 1); e[1].color = (1, 1, 1, 1)
        mv = N('ShaderNodeMix'); mv.data_type = 'RGBA'; mv.blend_type = 'MULTIPLY'; mv.inputs['Factor'].default_value = 1.0
        L(base, mv.inputs[6]); L(ramp.outputs['Color'], mv.inputs[7]); base = mv.outputs[2]
    L(base, bs.inputs['Base Color'])
    # ---- 粗糙度：贴图 × rmul，或固定值；再叠加噪波起伏（抛光面不均匀磨损）
    if spec.get('rough') is not None and (rough is None or spec.get('roughFixed')):
        rv = N('ShaderNodeValue'); rv.outputs[0].default_value = spec['rough']; rough = rv.outputs[0]
    elif rough is not None:
        mm = N('ShaderNodeMath'); mm.operation = 'MULTIPLY'; mm.inputs[1].default_value = spec.get('rmul', 1.0); L(rough, mm.inputs[0]); rough = mm.outputs[0]
        if spec.get('rmin') is not None:
            mx = N('ShaderNodeMath'); mx.operation = 'MAXIMUM'; mx.inputs[1].default_value = spec['rmin']; L(rough, mx.inputs[0]); rough = mx.outputs[0]
    if rough is not None and spec.get('rvar', 0) > 0:
        nz = N('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.5; nz.inputs['Detail'].default_value = 4; L(tc.outputs['Object'], nz.inputs['Vector'])
        ma = N('ShaderNodeMath'); ma.operation = 'MULTIPLY_ADD'; ma.inputs[1].default_value = spec['rvar']; ma.inputs[2].default_value = -spec['rvar'] / 2
        L(nz.outputs['Fac'], ma.inputs[0])
        ad = N('ShaderNodeMath'); ad.operation = 'ADD'; ad.use_clamp = True; L(rough, ad.inputs[0]); L(ma.outputs[0], ad.inputs[1]); rough = ad.outputs[0]
    if rough is not None: L(rough, bs.inputs['Roughness'])
    if metal is not None: L(metal, bs.inputs['Metallic'])
    else: bs.inputs['Metallic'].default_value = spec.get('metal', 0.0)
    if spec.get('coat'):
        bs.inputs['Coat Weight'].default_value = spec['coat']; bs.inputs['Coat Roughness'].default_value = spec.get('coatRough', 0.06)
    bs.inputs['Specular IOR Level'].default_value = spec.get('spec', 0.5)

# ---------------------------------------------------------------- 材质表
# 色调说明：贴图本身是实拍反照率，tint 只做轻微校色（不是整体压灰）；var/grime/streak 给出真实石材的不均匀与年代感。
HALL = {
    # 墙/柱：暖灰米色石灰岩方石（实拍砂岩砌块，去一点黄），柱身同石种更光洁
    'wall':       dict(tex='ph:sandstone_blocks_08', tint=(0.86, 0.84, 0.8), desat=0.35, var=0.18, grime=0.35, streak=0.12, nrm=1.2, rmul=1.0),
    'pier':       dict(tex='ph:sandstone_blocks_08', tint=(0.84, 0.82, 0.78), desat=0.4, var=0.15, grime=0.4, nrm=1.0, rmul=0.9),
    'trim':       dict(tex='Concrete034', tint=(0.78, 0.74, 0.66), var=0.15, grime=0.45, nrm=0.8, rmul=0.8),
    'vault':      dict(tex='Concrete036', tint=(0.92, 0.86, 0.74), desat=0.2, var=0.2, grime=0.35, grimeDist=0.8, nrm=0.6),
    'wallDark':   dict(tex='Marble006', tint=(0.6, 0.6, 0.62), rough=0.35, roughFixed=True, nrm=0.4),
    # 地面：中殿黑金色棋盘抛光大理石（反射），侧廊米色大板
    'floorNave':  dict(tex='Tiles074', uvs=0.625, tint=(0.95, 0.92, 0.86), rn=True, rmul=0.16, rmin=0.04, rvar=0.06, coat=0.35, coatRough=0.05, var=0.08, grime=0.25, nrm=0.35),
    'floorAisle': dict(tex='ph:marble_01', tint=(0.9, 0.86, 0.8), rmul=0.45, rvar=0.08, coat=0.2, var=0.1, grime=0.3, nrm=0.5),
    'marbleDark': dict(tex='Marble016', tint=(1, 1, 1), rn=True, rmul=0.12, rmin=0.03, coat=0.5, coatRough=0.04, nrm=0.3),
    'marbleLight':dict(tex='Marble021', tint=(0.95, 0.93, 0.9), rn=True, rmul=0.18, coat=0.4, nrm=0.3, var=0.06),
    'marble':     dict(tex='Marble006', tint=(1, 1, 1), rn=True, rmul=0.14, coat=0.5, coatRough=0.04, nrm=0.3),
    'plinthIn':   dict(tex='Marble006', tint=(0.9, 0.9, 0.92), rn=True, rmul=0.3, grime=0.3, nrm=0.4),
    # 金属：鎏金（偏暖、局部氧化）、黄铜（拉丝+手摸亮处）、不锈钢、黑色烤漆
    'gold':       dict(tint=(1.0, 0.74, 0.36), metal=1.0, rough=0.24, rvar=0.12, var=0.12, varScale=1.5, grime=0.35, grimeDist=0.15),
    'brass':      dict(tex='Metal048A', tint=(0.86, 0.62, 0.34), metal=1.0, rmul=1.0, rough=0.32, roughFixed=True, rvar=0.14, var=0.18, varScale=2.0, grime=0.4, grimeDist=0.12),
    'steel':      dict(tex='Metal009', tint=(0.92, 0.92, 0.93), metal=1.0, rmul=0.8),
    'blackMetal': dict(tex='Metal027', tint=(0.35, 0.35, 0.37), metal=0.6, rmul=0.9, grime=0.2),
    'paintMetal': dict(tint=(0.32, 0.34, 0.37), rough=0.42, rvar=0.1, metal=0.0, grime=0.3, var=0.06),
    'blackGlass': dict(tint=(0.004, 0.004, 0.005), rough=0.04, spec=0.7, coat=1.0),
    'rubber':     dict(tint=(0.018, 0.018, 0.02), rough=0.85),
    'navyBelt':   dict(tex='Fabric023', tint=(0.12, 0.18, 0.42), rmul=1.0, nrm=0.6),
    'leatherBlack': dict(tex='Leather026', tint=(0.55, 0.42, 0.34), rn=True, rmul=0.55, nrm=0.8),
    'woodDark':   dict(tex='Wood051', tint=(0.75, 0.62, 0.52), rmul=0.6, coat=0.3, coatRough=0.15, nrm=0.6),
    'glassClear': dict(glass=True, tint=(0.95, 0.97, 0.97), rough=0.02, bakeClear=True),
    # 自发光：彩窗透日光、大屏
    'glassN':     dict(emit=((1.0, 0.9, 0.74), 6.0)),
    'glassA':     dict(emit=((0.55, 0.68, 1.0), 4.0)),
    'glassRose':  dict(emit=((1.0, 0.58, 0.32), 7.0)),
    'screenEmit': dict(emit=((0.12, 0.3, 0.75), 1.6), emitTex=os.path.join(TEX, '..', '..', 'content', 'textures', 'b01', 'B01_05_安检大屏主界面.png')),
}
EXT = {
    # 科隆大教堂式风化深色砂岩：暖灰褐，浅色斑块 + 烟熏雨痕
    'ashlar':     dict(tex='ph:large_sandstone_blocks', tint=(0.62, 0.6, 0.58), desat=0.25, var=0.25, varScale=0.08, streak=0.35, grime=0.4, grimeDist=0.6, nrm=1.3),
    'ashlarDeep': dict(tex='ph:large_sandstone_blocks', tint=(0.42, 0.41, 0.4), desat=0.3, var=0.2, varScale=0.08, streak=0.3, grime=0.35, nrm=1.0),
    'trim':       dict(tex='Granite003A', tint=(0.4, 0.38, 0.36), desat=0.6, var=0.2, varScale=0.1, streak=0.3, grime=0.45, grimeDist=0.3, rmul=0.9, nrm=0.9),
    'plinth':     dict(tex='ph:granite_tile', tint=(0.85, 0.83, 0.8), var=0.15, grime=0.45, nrm=0.8),
    'marble':     dict(tex='Marble016', tint=(0.9, 0.9, 0.95), rn=True, rmul=0.25, coat=0.4, nrm=0.4, streak=0.15),
    'marbleDark': dict(tex='Marble016', tint=(0.6, 0.6, 0.65), rn=True, rmul=0.3, var=0.15, streak=0.3, grime=0.3, nrm=0.4),
    'steps':      dict(tex='Marble016', tint=(0.75, 0.75, 0.78), rn=True, rmul=0.4, var=0.12, grime=0.3, nrm=0.5),
    'gold':       HALL['gold'],
    'slate':      dict(tex='ph:roof_slates_02', tint=(0.55, 0.6, 0.7), var=0.2, varScale=0.05, streak=0.2, nrm=1.2),
    'lead':       dict(tex='Metal027', tint=(0.45, 0.48, 0.52), metal=0.7, rmul=0.9, var=0.2, streak=0.35),
    'glass':      dict(tint=(0.01, 0.015, 0.03), rough=0.05, spec=0.8, coat=1.0),
    'louver':     dict(tex='Wood051', tint=(0.35, 0.28, 0.22), rmul=0.9),
    'paving':     dict(tex='ph:large_grey_tiles', tint=(0.92, 0.9, 0.86), var=0.2, varScale=0.06, grime=0.3, rmul=1.0, nrm=1.0),
    'paveDark':   dict(tex='ph:granite_tile', tint=(0.6, 0.6, 0.64), rmul=0.6, var=0.12, grime=0.2),
    'curb':       dict(tex='Granite003A', tint=(0.8, 0.78, 0.75), desat=0.5, rmul=0.85, grime=0.35),
    'whiteMarble':dict(tex='Marble021', tint=(0.9, 0.89, 0.87), rn=True, rmul=0.3, var=0.1, grime=0.25),
    'water':      dict(tint=(0.02, 0.04, 0.045), rough=0.02, spec=0.6, coat=1.0),
    'bronze':     dict(tint=(0.36, 0.27, 0.18), metal=1.0, rough=0.45, var=0.3, varScale=1.5, grime=0.5, grimeDist=0.2),
    'iron':       dict(tex='Metal046A', tint=(0.2, 0.21, 0.23), metal=1.0, rmul=1.0, grime=0.3),
    'lawn':       dict(tint=(0.07, 0.13, 0.04), rough=0.9, var=0.3, varScale=0.4),
    'hedge':      dict(tint=(0.035, 0.08, 0.025), rough=0.85, var=0.3, varScale=0.8, grime=0.5),
}

def fix_normals(angle=35):
    """按角度平滑（>angle 的棱拆法线）：Acc 合并网格里共享顶点的直角面会插值出朝内的着色法线 → 拱廊墙侧面/柱旁大片发黑"""
    import math
    objs = [o for o in bpy.data.objects if o.type == 'MESH' and not o.name.startswith(('C_', 'OCC_'))]
    if not objs: return
    for o in bpy.data.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    try: bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angle), keep_sharp_edges=True)
    except Exception as e: print('fix_normals', e)

def apply(kind='hall', bake=False):
    global BAKE; BAKE = bake
    fix_normals()
    table = HALL if kind == 'hall' else EXT
    done = []
    for o in bpy.data.objects:
        if o.type != 'MESH' or not o.data.materials or o.name.startswith('C_'): continue
        uvname = o.data.uv_layers[0].name if o.data.uv_layers else 'UVMap'
        for m in o.data.materials:
            if not m or m.name in done: continue
            spec = table.get(m.name.split('.')[0])
            if spec is None: continue
            if bake and spec.get('glass') and spec.get('bakeClear'):
                build(m, spec, uvname)
            else:
                build(m, spec, uvname)
            done.append(m.name)
    print('PBR applied', kind, len(done), 'materials; missing:', sorted({m.name for m in bpy.data.materials} - set(done)))
    return done
