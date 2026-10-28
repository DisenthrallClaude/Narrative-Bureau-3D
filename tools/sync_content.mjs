// 从 P/content（art-content 维护）同步到 public/content：manifest.json、textures/、audio/
// 图片最长边压到 2048（保持原文件名与格式，manifest 路径不变）；生成 audio/index.json
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const SRC = path.resolve('../content'), DST = path.resolve('public/content');
fs.mkdirSync(DST, { recursive: true });
fs.copyFileSync(path.join(SRC, 'manifest.json'), path.join(DST, 'manifest.json'));
let n = 0, skipped = 0;
async function walk(rel) {
  const dir = path.join(SRC, rel); if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (e.isDirectory()) { await walk(r); continue; }
    const src = path.join(SRC, r), dst = path.join(DST, r);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(src).mtimeMs) { skipped++; continue; }
    const ext = path.extname(e.name).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      const img = sharp(src); const meta = await img.metadata();
      let pipe = img; if (Math.max(meta.width, meta.height) > 2048) pipe = pipe.resize({ width: meta.width >= meta.height ? 2048 : null, height: meta.height > meta.width ? 2048 : null });
      if (ext === '.png') await pipe.png({ compressionLevel: 9, palette: false }).toFile(dst); else if (ext === '.webp') await pipe.webp({ quality: 88 }).toFile(dst); else await pipe.jpeg({ quality: 86, mozjpeg: true }).toFile(dst);
    } else fs.copyFileSync(src, dst);
    n++;
  }
}
await walk('textures');
await walk('audio');
const ad = path.join(DST, 'audio'); fs.mkdirSync(ad, { recursive: true });
fs.writeFileSync(path.join(ad, 'index.json'), JSON.stringify(fs.readdirSync(ad).filter((f) => /\.(mp3|ogg|wav|m4a)$/i.test(f))));
console.log(`synced ${n}, unchanged ${skipped}`);
