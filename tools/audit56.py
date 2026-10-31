# 批次56 审计：穿模（落地件↔隔断/墙板、落地件↔落地件）+ 图片比例/无支撑。用法：python3 tools/audit56.py ../work/r3/b56/plans > out.md
import json, sys, os, math, glob
from PIL import Image
D = sys.argv[1]; PUB = 'public/content/'
def aabb(i):
    s = i.get('size') or [i.get('w', .1), i.get('h', .1), i.get('d', .1)]
    w, h, d = s; yaw = i.get('yaw', 0) or 0; c, sn = abs(math.cos(yaw)), abs(math.sin(yaw))
    W, Dd = w * c + d * sn, w * sn + d * c
    y0 = i['y'] - h / 2 if 'box' in i else i['y']
    return [i['x'] - W / 2, i['x'] + W / 2, y0, y0 + h, i['z'] - Dd / 2, i['z'] + Dd / 2]
def pen(a, b):
    return min(a[1], b[1]) - max(a[0], b[0]), min(a[3], b[3]) - max(a[2], b[2]), min(a[5], b[5]) - max(a[4], b[4])
def wallish(i):
    if i.get('on') == 'part': return True
    if 'box' in i and i.get('on') == 'partv':
        s = i['size']; return s[1] >= 0.5 and min(s[0], s[2]) <= 0.16 and max(s[0], s[2]) >= 0.6
    return False
IGN = ('地毯', '地面', '磨损', '线', '吊牌')
res = {'clip': [], 'ff': [], 'asp': [], 'hang': []}
for f in sorted(glob.glob(D + '/*.json')):
    pid = os.path.basename(f)[:-5]; P = json.load(open(f)); it = P['items']; R = P['room']
    fl = [i for i in it if 'm' in i and i.get('on') == 'floor' and not i.get('fixed') and not str(i['m']).startswith('固定')]
    wl = [i for i in it if wallish(i) and not any(k in str(i.get('tag', '')) for k in IGN)]
    for a in fl:
        A = aabb(a)
        for w in wl:
            p = pen(A, aabb(w))
            if min(p) > 0.03: res['clip'].append((pid, a['m'], a['tag'], round(a['x'], 2), round(a['z'], 2), w.get('box', 'part'), w.get('tag'), round(min(p[0], p[2]), 3)))
    for k, a in enumerate(fl):
        A = aabb(a)
        for b in fl[k + 1:]:
            p = pen(A, aabb(b))
            if min(p) > 0.06 and min(p[0], p[2]) > 0.06: res['ff'].append((pid, a['m'], b['m'], round(a['x'], 2), round(a['z'], 2), round(min(p[0], p[2]), 3)))
    sup = [i for i in it if ('box' in i or i.get('on') == 'part' or i.get('fixed') or ('m' in i and i.get('on') in ('floor', 'partv', 'wall')))]
    for i in it:
        if 'pic' not in i: continue
        fn = PUB + i['pic']
        try:
            W, H = Image.open(fn).size; ra, rp = W / H, i['w'] / i['h']; dev = abs(rp / ra - 1)
            if dev > 0.03: res['asp'].append((pid, i['pic'], round(i['x'], 2), round(i['z'], 2), f"{W}x{H}", round(ra, 3), round(i['w'], 3), round(i['h'], 3), round(rp, 3), round(dev * 100, 1)))
        except Exception as e: res['asp'].append((pid, i['pic'], i['x'], i['z'], 'MISSING', 0, i['w'], i['h'], 0, 0))
        if i.get('stand'): continue
        yaw = i.get('yaw', 0) or 0; nx, nz = math.sin(yaw), math.cos(yaw); ok = False
        for t in (0.03, 0.06, 0.09):
            bx, bz = i['x'] - nx * t, i['z'] - nz * t
            if (abs(bx - R['x0']) < 0.12 or abs(bx - R['x1']) < 0.12 or abs(bz - R['z0']) < 0.12 or abs(bz - R['z1']) < 0.12): ok = True; break
            for s in sup:
                if s is i: continue
                A = aabb(s)
                if A[0] - 0.02 <= bx <= A[1] + 0.02 and A[4] - 0.02 <= bz <= A[5] + 0.02 and A[2] <= i['y'] <= A[3] + 0.05: ok = True; break
            if ok: break
        if not ok: res['hang'].append((pid, i['pic'], round(i['x'], 2), round(i['y'], 2), round(i['z'], 2), round(yaw, 2), i.get('tag')))
print('# AUDIT-56 · 穿模 / 图片比例 / 图片支撑 / 配色 审计（脚本 tools/audit56.sh + tools/audit56.py）\n')
print(f"## 1 落地件 ↔ 隔断 / 墙板 / 屏风 穿插（三轴都 >3 cm）：{len(res['clip'])} 处\n|区|物件|tag|x|z|撞到|隔断tag|水平穿入 m|\n|-|-|-|-|-|-|-|-|")
for r in sorted(res['clip'], key=lambda r: -r[-1]): print('|' + '|'.join(map(str, r)) + '|')
print(f"\n## 2 落地件 ↔ 落地件 互插（水平 >6 cm）：{len(res['ff'])} 处\n|区|A|B|x|z|穿入 m|\n|-|-|-|-|-|-|")
for r in sorted(res['ff'], key=lambda r: -r[-1]): print('|' + '|'.join(map(str, r)) + '|')
print(f"\n## 3 图片宽高比偏差 >3%：{len(res['asp'])} 张\n|区|图|x|z|原图|原比|平面w|平面h|平面比|偏差%|\n|-|-|-|-|-|-|-|-|-|-|")
for r in sorted(res['asp'], key=lambda r: -r[-1]): print('|' + '|'.join(map(str, r)) + '|')
print(f"\n## 4 图片背后 9 cm 内无墙/板/展架（疑似悬空；hero GLB 内建墙不在规划数据里，需逐张核对）：{len(res['hang'])} 张\n|区|图|x|y|z|yaw|tag|\n|-|-|-|-|-|-|-|")
for r in res['hang']: print('|' + '|'.join(map(str, r)) + '|')
json.dump(res, open('../work/r3/b56/audit.json', 'w'), ensure_ascii=False)
