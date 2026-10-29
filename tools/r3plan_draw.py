#!/usr/bin/env python3
"""R3 俯视布局图 + 规则检查（穿模 / 悬空 / 越界 / 占通道 / 贴墙）。
用法：python3 tools/r3plan_draw.py plan.json out.png  → 打印检查报告，非零退出码表示有硬错误
"""
import json, math, sys
from PIL import Image, ImageDraw, ImageFont

p = json.load(open(sys.argv[1])); out = sys.argv[2]
R = p['room']; items = p['items']
FONT = None
for f in ['/workspace/projects/b2c90d19-7034-43fd-aea1-521ddd72406e/work/fonts/NotoSansSC-Medium.otf', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
          '/workspace/projects/b2c90d19-7034-43fd-aea1-521ddd72406e/game/public/fonts/sans.woff2']:
    try: FONT = ImageFont.truetype(f, 15); FONTS = ImageFont.truetype(f, 11); break
    except Exception: pass
if FONT is None: FONT = FONTS = ImageFont.load_default()

def obb(it, pad=0.0):
    w, _, d = it['size']; c, s = math.cos(it.get('yaw', 0)), math.sin(it.get('yaw', 0))
    pts = []
    for lx, lz in [(-w/2-pad, -d/2-pad), (w/2+pad, -d/2-pad), (w/2+pad, d/2+pad), (-w/2-pad, d/2+pad)]:
        pts.append((it['x'] + lx*c + lz*s, it['z'] - lx*s + lz*c))
    return pts

def sat(a, b):
    for poly in (a, b):
        for i in range(4):
            x1, z1 = poly[i]; x2, z2 = poly[(i+1) % 4]; nx, nz = z1-z2, x2-x1
            pa = [nx*x+nz*z for x, z in a]; pb = [nx*x+nz*z for x, z in b]
            if max(pa) <= min(pb) or max(pb) <= min(pa): return False
    return True

def inside(pt, poly):
    x, z = pt; sgn = None
    for i in range(4):
        x1, z1 = poly[i]; x2, z2 = poly[(i+1) % 4]
        c = (x2-x1)*(z-z1)-(z2-z1)*(x-x1)
        if abs(c) < 1e-9: continue
        if sgn is None: sgn = c > 0
        elif sgn != (c > 0): return False
    return True

def name(it): return (it.get('m') or it.get('box') or it.get('pic') or it.get('sign') or ('part' if it.get('part') else 'x')).split('/')[-1]
errs, warns = [], []
floor = [it for it in items if it.get('on') == 'floor']
parts = [it for it in items if it.get('on') == 'part']
SOFT = ('chair', 'bin', 'broom', 'dustpan', 'trashbag', 'cleaner')
for i in range(len(floor)):
    for j in range(i+1, len(floor)):
        a, b = floor[i], floor[j]
        if not sat(obb(a, -0.01), obb(b, -0.01)): continue
        na, nb = name(a), name(b)
        if any(k in na for k in SOFT) and ('desk' in nb or 'table' in nb) or any(k in nb for k in SOFT) and ('desk' in na or 'table' in na): continue  # 椅子塞进桌下、纸篓贴桌是真实的
        if a['tag'].startswith('K4') and b['tag'].startswith('K4'): continue  # 保洁工具靠在一起
        errs.append(f"穿模：{na}@({a['x']:.2f},{a['z']:.2f}) ↔ {nb}@({b['x']:.2f},{b['z']:.2f})")
for a in floor:
    if a.get('fixed') and 'm' in a and '展板' in a['m']: continue
    for w in parts:
        if sat(obb(a, -0.015), obb(w)): errs.append(f"穿墙：{name(a)}@({a['x']:.2f},{a['z']:.2f}) ↔ 隔墙@({w['x']:.2f},{w['z']:.2f})")
supports = [it for it in items if it.get('on') == 'floor' and it.get('col')] + [it for it in items if it.get('on') == 'floor' and any(k in name(it) for k in ('cabinet', 'desk', 'table'))]
for it in items:
    if it.get('on') != 'desk' or it.get('box'): continue
    sup = [s for s in supports if inside((it['x'], it['z']), obb(s)) and abs((s['y'] + s['size'][1]) - it['y']) < 0.06]
    if not sup: errs.append(f"悬空：{name(it)}@({it['x']:.2f},{it['y']:.2f},{it['z']:.2f}) 下面没有台面")
for it in items:
    pts = obb(it)
    if it.get('on') in ('floor', 'wall', 'desk'):
        if any(x < R['x0']-0.02 or x > R['x1']+0.02 or z < R['z0']-0.02 or z > R['z1']+0.02 for x, z in pts): errs.append(f"越界：{name(it)}@({it['x']:.2f},{it['z']:.2f})")
    if it.get('on') == 'wall':
        dmin = min(abs(it['x']-R['x0']), abs(it['x']-R['x1']), abs(it['z']-R['z0']), abs(it['z']-R['z1']))
        if dmin > 0.3: warns.append(f"挂墙件离墙 {dmin:.2f} m：{name(it)}")
for a in R.get('aisles', []):
    poly = [(a['x0'], a['z0']), (a['x1'], a['z0']), (a['x1'], a['z1']), (a['x0'], a['z1'])]
    for it in floor:
        if sat(obb(it, -0.02), poly): errs.append(f"占通道[{a['label']}]：{name(it)}@({it['x']:.2f},{it['z']:.2f})")

# —— 画图 ——
S = 40; M = 60
W = int((R['x1']-R['x0'])*S) + 2*M + 260; H = int((R['z1']-R['z0'])*S) + 2*M
im = Image.new('RGB', (W, H), (245, 242, 235)); d = ImageDraw.Draw(im)
X = lambda x: M + (x - R['x0'])*S
Z = lambda z: M + (z - R['z0'])*S  # 北（-Z）在上
d.rectangle([X(R['x0']), Z(R['z0']), X(R['x1']), Z(R['z1'])], outline=(30, 30, 30), width=5, fill=(232, 228, 218))
for gx in range(math.ceil(R['x0']), math.floor(R['x1'])+1):
    d.line([X(gx), Z(R['z0']), X(gx), Z(R['z1'])], fill=(220, 214, 200))
for gz in range(math.ceil(R['z0']), math.floor(R['z1'])+1):
    d.line([X(R['x0']), Z(gz), X(R['x1']), Z(gz)], fill=(220, 214, 200))
for a in R.get('aisles', []):
    d.rectangle([X(a['x0']), Z(a['z0']), X(a['x1']), Z(a['z1'])], fill=(214, 230, 214), outline=(120, 170, 120))
    d.text((X(a['x0'])+4, Z(a['z0'])+2), a['label'], fill=(60, 120, 60), font=FONTS)
def wallseg(w, a, b, col, wid):
    if w == 'E': d.line([X(R['x1']), Z(a), X(R['x1']), Z(b)], fill=col, width=wid)
    if w == 'W': d.line([X(R['x0']), Z(a), X(R['x0']), Z(b)], fill=col, width=wid)
    if w == 'N': d.line([X(a), Z(R['z0']), X(b), Z(R['z0'])], fill=col, width=wid)
    if w == 'S': d.line([X(a), Z(R['z1']), X(b), Z(R['z1'])], fill=col, width=wid)
for wdw in R.get('windows', []): wallseg(wdw['wall'], wdw['a'], wdw['b'], (90, 160, 230), 7)
for dr in R.get('doors', []):
    wallseg(dr['wall'], dr['a'], dr['b'], (232, 228, 218), 9)
    xm = R['x1'] if dr['wall'] == 'E' else R['x0']; d.text((X(xm)+8 if dr['wall'] == 'E' else X(xm)-120, Z((dr['a']+dr['b'])/2)-8), '门 ' + dr.get('label', ''), fill=(180, 40, 40), font=FONTS)
COL = {'floor': (120, 92, 60), 'desk': (40, 90, 160), 'wall': (160, 60, 160), 'ceil': (200, 160, 40)}
for w in parts: d.polygon([(X(x), Z(z)) for x, z in obb(w)], fill=(70, 62, 52))
for it in items:
    if it.get('on') == 'pic': pts = [(X(x), Z(z)) for x, z in obb(dict(it, size=[it['w'], 0, 0.12]))]; d.polygon(pts, fill=(170, 40, 170))
    if it.get('on') == 'light' and not it.get('win'): d.ellipse([X(it['x'])-6, Z(it['z'])-6, X(it['x'])+6, Z(it['z'])+6], outline=(230, 170, 0), width=3)
    if it.get('on') == 'sign': d.rectangle([X(it['x'])-4, Z(it['z'])-4, X(it['x'])+4, Z(it['z'])+4], fill=(200, 150, 40))
for rm in R.get('rooms', []): d.text((X(rm[1])-30, Z(rm[2])-8), rm[0], fill=(150, 30, 30), font=FONT)
for it in sorted([t for t in items if t.get('on', 'floor') in ('floor', 'wall', 'desk', 'ceil')], key=lambda t: {'floor': 0, 'wall': 1, 'desk': 2, 'ceil': 3}[t.get('on', 'floor')]):
    on = it.get('on', 'floor')
    if on == 'ceil' and it.get('box'): continue
    pts = [(X(x), Z(z)) for x, z in obb(it)]
    if on == 'ceil': d.polygon(pts, outline=COL[on]); continue
    d.polygon(pts, fill=COL[on] + (0,) if False else None, outline=COL[on], width=2 if on == 'floor' else 1)
    # 朝向箭头：模型 +Z（正面/使用侧）
    yaw = it.get('yaw', 0); L = max(0.25, min(it['size'][0], it['size'][2])*0.45)
    cx, cz = it['x'], it['z']; ex, ez = cx + math.sin(yaw)*L, cz + math.cos(yaw)*L
    if on == 'floor': d.line([X(cx), Z(cz), X(ex), Z(ez)], fill=(200, 50, 30), width=2); d.ellipse([X(ex)-3, Z(ez)-3, X(ex)+3, Z(ez)+3], fill=(200, 50, 30))
for k in R.get('keep', []):
    d.rectangle([X(k['x']-k['w']/2), Z(k['z']-k['d']/2), X(k['x']+k['w']/2), Z(k['z']+k['d']/2)], fill=(230, 80, 30))
    d.text((X(k['x'])+6, Z(k['z'])-6), k['label'], fill=(200, 60, 20), font=FONTS)
# 分组标签
groups = {}
for it in items:
    if it.get('on') == 'floor': groups.setdefault(it['tag'], []).append(it)
for t, lst in groups.items():
    cx = sum(i['x'] for i in lst)/len(lst); cz = sum(i['z'] for i in lst)/len(lst)
    d.text((X(cx)-20, Z(cz)-8), t, fill=(20, 20, 20), font=FONT)
lx = W - 250
d.text((lx, M), R['name'], fill=(0, 0, 0), font=FONT)
yy = M + 28
for lab, c in [('落地家具（轮廓）', COL['floor']), ('桌面小件', COL['desk']), ('挂墙件', COL['wall']), ('顶棚灯/烟感', COL['ceil']), ('红线 = 正面/使用侧', (200, 50, 30)), ('蓝 = 窗　缺口 = 门', (90, 160, 230)), ('绿 = 通道（保持净空）', (120, 170, 120)), ('橙 = 保留的剧情锚点', (230, 80, 30)), ('深褐实线 = 隔墙（缺口=门）', (70, 62, 52)), ('紫 = 挂画/海报/告示', (170, 40, 170)), ('黄圈 = 台灯/补光', (230, 170, 0))]:
    d.rectangle([lx, yy+3, lx+14, yy+15], outline=c, width=3); d.text((lx+20, yy), lab, fill=(30, 30, 30), font=FONTS); yy += 20
yy += 10; d.text((lx, yy), f"网格 1 m　物件 {len(items)}", fill=(30, 30, 30), font=FONTS); yy += 18
d.text((lx, yy), f"检查：穿模/悬空/越界/占道 {len(errs)} 处", fill=(180, 0, 0) if errs else (0, 120, 0), font=FONTS); yy += 18
d.text((lx, yy), '北 ↑（-Z）', fill=(30, 30, 30), font=FONT)
im.save(out)
print(f"items={len(items)} errors={len(errs)} warnings={len(warns)}")
for e in errs: print('ERR', e)
for w in warns: print('WARN', w)
sys.exit(1 if errs else 0)
