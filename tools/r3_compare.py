#!/usr/bin/env python3
"""R3 新旧对比拼图：python3 tools/r3_compare.py out.png 标题 旧图 新图 [平面规划图 俯视实拍]"""
import sys
from PIL import Image, ImageDraw, ImageFont
out, title, old, new = sys.argv[1:5]; extra = sys.argv[5:]
F = ImageFont.truetype('/workspace/projects/b2c90d19-7034-43fd-aea1-521ddd72406e/work/fonts/NotoSansSC-Medium.otf', 26)
W = 960
def fit(p, w, h=None):
    im = Image.open(p).convert('RGB'); r = w / im.width; im = im.resize((w, int(im.height * r)))
    if h and im.height > h: r = h / im.height; im = im.resize((int(im.width * r), h))
    return im
a, b = fit(old, W), fit(new, W)
rows = [[(a, '旧（R3 前）'), (b, 'R3 新')]]
if extra: rows.append([(fit(extra[0], W, 760), '平面功能规划（0 错误）'), (fit(extra[1], W, 760), '俯视实拍（裁顶棚）')] if len(extra) > 1 else [(fit(extra[0], W, 760), '平面功能规划')])
H = 60 + sum(max(i.height for i, _ in r) + 44 for r in rows)
c = Image.new('RGB', (2 * W + 30, H), (24, 22, 20)); d = ImageDraw.Draw(c)
d.text((14, 14), title, fill=(230, 210, 160), font=F); y = 60
for r in rows:
    for k, (im, lab) in enumerate(r):
        x = 10 + k * (W + 10); d.text((x, y), lab, fill=(220, 220, 220), font=F); c.paste(im, (x, y + 40))
    y += max(i.height for i, _ in r) + 44
c.save(out); print(out, c.size)
