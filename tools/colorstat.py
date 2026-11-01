#!/usr/bin/env python3
"""R7-ATH 截图颜色统计对比（改编自 Athenaion tools/colorstats.mjs + satstats.mjs，Leon Lin，MIT）。

用法：
  python3 tools/colorstat.py before.png after.png [--grid 4x3] [--json out.json]
  python3 tools/colorstat.py shot.png                 # 只看一张

每格（行优先，左上起）输出平均 sRGB、亮度、HSV 饱和度，以及本项目调色约束用的两项：
  blue%  = 色相落在 180°–260°（青蓝）且 S>0.25、V>0.15 的像素占比（禁蓝绿验收）
  warm   = 平均 (R+G)/2 − B（>0 偏暖）
全图再给亮度分位 p02/p10/p50/p90/p98、Hasler-Süsstrunk 色彩度、平均 |dL| / |dSat|。
依赖：Pillow、numpy。
"""
import argparse, json, sys
import numpy as np
from PIL import Image


def load(p):
    return np.asarray(Image.open(p).convert('RGB'), dtype=np.float32)


def hsv(a):
    mx = a.max(-1); mn = a.min(-1); c = mx - mn
    s = np.where(mx > 0, c / np.maximum(mx, 1e-6), 0)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.zeros_like(mx)
    cz = np.maximum(c, 1e-6)
    h = np.where(mx == r, ((g - b) / cz) % 6, h)
    h = np.where(mx == g, (b - r) / cz + 2, h)
    h = np.where(mx == b, (r - g) / cz + 4, h)
    h = np.where(c > 0, h * 60, 0)
    return h, s, mx / 255.0


def cell_stats(a):
    h, s, v = hsv(a)
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    blue = ((h >= 180) & (h <= 260) & (s > 0.25) & (v > 0.15)).mean()
    m = a.reshape(-1, 3).mean(0)
    return dict(r=float(m[0]), g=float(m[1]), b=float(m[2]), L=float(lum.mean()), s=float(s.mean()),
                blue=float(blue), warm=float((m[0] + m[1]) / 2 - m[2]))


def stats(img, gx, gy):
    H, W, _ = img.shape
    cells = []
    for cy in range(gy):
        for cx in range(gx):
            cells.append(cell_stats(img[cy * H // gy:(cy + 1) * H // gy, cx * W // gx:(cx + 1) * W // gx]))
    lum = (0.2126 * img[..., 0] + 0.7152 * img[..., 1] + 0.0722 * img[..., 2]).ravel()
    pct = {k: float(np.percentile(lum, q)) for k, q in (('p02', 2), ('p10', 10), ('p50', 50), ('p90', 90), ('p98', 98))}
    rg = img[..., 0] - img[..., 1]; yb = 0.5 * (img[..., 0] + img[..., 1]) - img[..., 2]
    colourful = float(np.hypot(rg.std(), yb.std()) + 0.3 * np.hypot(rg.mean(), yb.mean()))
    g = cell_stats(img)
    return dict(cells=cells, pct=pct, colourfulness=colourful, sat=g['s'], blue=g['blue'], warm=g['warm'])


def fmt(c):
    return f"{c['r']:3.0f},{c['g']:3.0f},{c['b']:3.0f} L{c['L']:3.0f} s{c['s']*100:2.0f} b{c['blue']*100:4.1f}%"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('a'); ap.add_argument('b', nargs='?')
    ap.add_argument('--grid', default='4x3'); ap.add_argument('--json')
    o = ap.parse_args()
    gx, gy = map(int, o.grid.split('x'))
    A = stats(load(o.a), gx, gy)
    out = {'a': o.a, 'A': A}
    if not o.b:
        for i, c in enumerate(A['cells']):
            print(f"[{i // gx},{i % gx}] {fmt(c)}")
    else:
        B = stats(load(o.b), gx, gy); out.update(b=o.b, B=B)
        print(f"A = {o.a}\nB = {o.b}\n格 {gx}x{gy}（行优先，左上起）: A | B | dL dSat dRGB")
        dl = ds = 0
        for i, (x, y) in enumerate(zip(A['cells'], B['cells'])):
            dl += abs(y['L'] - x['L']); ds += abs(y['s'] - x['s'])
            print(f"[{i // gx},{i % gx}] {fmt(x)} | {fmt(y)} | dL{y['L']-x['L']:+5.0f} dSat{(y['s']-x['s'])*100:+4.0f} dRGB {y['r']-x['r']:+.0f},{y['g']-x['g']:+.0f},{y['b']-x['b']:+.0f}")
        print(f"平均 |dL| {dl/len(A['cells']):.1f}  平均 |dSat| {ds/len(A['cells'])*100:.1f}%")
    print('亮度分位      p02  p10  p50  p90  p98 | 色彩度  饱和%  蓝%   暖(Y-B)')
    for tag, S in (('A', A), ('B', out.get('B'))):
        if S:
            print(f"  {tag}         " + ' '.join(f"{v:4.0f}" for v in S['pct'].values()) + f" | {S['colourfulness']:6.1f} {S['sat']*100:5.1f} {S['blue']*100:5.2f} {S['warm']:6.1f}")
    if o.json:
        json.dump(out, open(o.json, 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    sys.exit(main())
