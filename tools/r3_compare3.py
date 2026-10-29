#!/usr/bin/env python3
"""R3 批次3 对比拼图（只存 jpg）（旧图 / 新图 / 平面布局图 / 俯视实拍 + 若干室内细节机位），同时另存 jpg。
用法：python3 tools/r3_compare2.py out.png 标题 旧图标签 旧图 新图 布局图 俯视图 [细节图...]"""
import sys
from PIL import Image, ImageDraw, ImageFont
out, title, oldlab, old, new, plan, top = sys.argv[1:8]; extra = sys.argv[8:]
F = ImageFont.truetype('/workspace/projects/b2c90d19-7034-43fd-aea1-521ddd72406e/work/fonts/NotoSansSC-Medium.otf', 26)
W = 960
def fit(p, w, h=None):
    im = Image.open(p).convert('RGB'); r = w / im.width; im = im.resize((w, int(im.height * r)))
    if h and im.height > h: r = h / im.height; im = im.resize((int(im.width * r), h))
    return im
rows = [[(fit(old, W), oldlab), (fit(new, W), '批次3 新（同机位或相近机位）')],
        [(fit(plan, W, 900), '平面功能规划（r3plan_draw 检查 0 错误）'), (fit(top, W, 900), '俯视实拍（裁顶棚）')]]
for i in range(0, len(extra), 2):
    rows.append([(fit(e, W), '室内细节 · ' + e.split('/')[-1].rsplit('.', 1)[0]) for e in extra[i:i + 2]])
H = 60 + sum(max(i.height for i, _ in r) + 44 for r in rows)
c = Image.new('RGB', (2 * W + 30, H), (24, 22, 20)); d = ImageDraw.Draw(c)
d.text((14, 14), title, fill=(230, 210, 160), font=F); y = 60
for r in rows:
    for k, (im, lab) in enumerate(r):
        x = 10 + k * (W + 10); d.text((x, y), lab, fill=(220, 220, 220), font=F); c.paste(im, (x, y + 40))
    y += max(i.height for i, _ in r) + 44
c.save(out.rsplit('.', 1)[0] + '.jpg', quality=85); print(out, c.size)
