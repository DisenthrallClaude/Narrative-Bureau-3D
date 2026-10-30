# R3 批次10：AO 烘焙后处理（本机跑）：UV 三角光栅化覆盖掩码 → 岛内归一化高斯去噪 → 外扩 → 8bit webp
# python3 tools/bake_ao_post.py <dir> <id> [gamma=1.0] → <dir>/<id>_ao.webp
import sys, json, numpy as np
from PIL import Image, ImageDraw
D, ID = sys.argv[1], sys.argv[2]; GM = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
px = np.load(f'{D}/{ID}_ao_raw.npy').astype(np.float32); RES = px.shape[0]
uv = np.fromfile(f'{D}/{ID}_uv.bin', dtype=np.uint16).astype(np.float32) / 65535
mi = Image.new('L', (RES, RES), 0); dr = ImageDraw.Draw(mi)
T = uv.reshape(-1, 3, 2) * RES
for t in T: dr.polygon([(t[0, 0], RES - t[0, 1]), (t[1, 0], RES - t[1, 1]), (t[2, 0], RES - t[2, 1])], fill=255, outline=255)
mask = (np.asarray(mi, np.float32)[::-1] > 0).astype(np.float32)  # Blender 像素底行在前
def blur(a, r):
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / (r / 2.0)) ** 2); k /= k.sum(); b = a.copy()
    for ax in (0, 1): b = sum(np.roll(b, i - r, axis=ax) * k[i] for i in range(2 * r + 1))
    return b
num = blur(px * mask, 2); den = blur(mask, 2)
res = np.where(den > 1e-3, num / np.maximum(den, 1e-4), px)
filled = res * mask; m = mask.copy()
for it in range(12):
    nb = np.zeros_like(filled); cnt = np.zeros_like(m)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nb += np.roll(np.roll(filled * m, dy, 0), dx, 1); cnt += np.roll(np.roll(m, dy, 0), dx, 1)
    grow = (m == 0) & (cnt > 0); filled[grow] = nb[grow] / cnt[grow]; m[grow] = 1
filled[m == 0] = 1.0
cov = mask > 0
out = np.clip(filled, 0, 1) ** GM
print(ID, 'cover %.1f%%' % (mask.mean() * 100), 'AO mean %.3f p5 %.3f p50 %.3f' % (out[cov].mean(), np.percentile(out[cov], 5), np.percentile(out[cov], 50)))
Image.fromarray((out[::-1] * 255 + 0.5).astype(np.uint8), 'L').convert('RGB').save(f'{D}/{ID}_ao.webp', quality=90, method=4)
Image.fromarray((out[::-1] * 255 + 0.5).astype(np.uint8), 'L').resize((512, 512)).save(f'{D}/{ID}_ao_prev.png')
