# R2 新旧对比拼图：每行「旧版（m4b/m6）| R2 新版」，左上角标注
# 用法：python3 tools/r2_compare.py out.jpg "标题" old1:new1:说明 old2:new2:说明 ...
import sys, os
from PIL import Image, ImageDraw, ImageFont
F = '/workspace/projects/b2c90d19-7034-43fd-aea1-521ddd72406e/work/fonts/NotoSerifSC-Bold.otf'
out, title, pairs = sys.argv[1], sys.argv[2], [a.split(':', 2) for a in sys.argv[3:]]
W, H = 960, 540; PAD = 16; TOP = 70; LAB = 34
font = ImageFont.truetype(F, 22); tfont = ImageFont.truetype(F, 34)
rows = len(pairs)
im = Image.new('RGB', (PAD * 3 + W * 2, TOP + rows * (H + LAB + PAD) + PAD), (14, 13, 12))
d = ImageDraw.Draw(im)
d.text((PAD, 18), title, font=tfont, fill=(236, 212, 150))
for i, (old, new, cap) in enumerate(pairs):
    y = TOP + i * (H + LAB + PAD)
    for j, (p, tag) in enumerate(((old, '旧版'), (new, 'R2 新版'))):
        x = PAD + j * (W + PAD)
        if p and os.path.exists(p):
            t = Image.open(p).convert('RGB'); t = t.resize((W, int(W * t.height / t.width)))
            if t.height > H: t = t.crop((0, (t.height - H) // 2, W, (t.height - H) // 2 + H))
            im.paste(t, (x, y + LAB))
        else:
            d.rectangle((x, y + LAB, x + W, y + LAB + H), fill=(30, 28, 26)); d.text((x + 20, y + LAB + 20), '（旧版无此机位）', font=font, fill=(150, 140, 130))
        d.text((x, y + 4), f'{tag} · {cap}', font=font, fill=(220, 214, 200) if j else (160, 154, 146))
im.save(out, quality=88)
print('saved', out, im.size)
