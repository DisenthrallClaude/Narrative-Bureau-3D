// PBR 贴图压缩：ambientCG 2K JPG → 1K WebP（color/normal/roughness/metalness/ao）
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
const S = '../assets/sourced/00_materials', O = 'public/assets/tex';
const SETS = ['Marble016','Granite003A','Metal048A','PavingStones142','Marble012','Tiles074','Terrazzo005','Metal046A','Metal009','Paper006','Cardboard004','Fabric023','Concrete036','Concrete034','Onyx013','Tiles138','Wood051','WoodFloor064','Carpet012','Facade001','Marble006','Marble021','Leather026','Metal027','SurfaceImperfections003'];
const MAPS = { Color:'color', NormalGL:'normal', Roughness:'rough', Metalness:'metal', AmbientOcclusion:'ao' };
for (const s of SETS) {
  const dir = path.join(S, 'acg_' + s);
  if (!fs.existsSync(dir)) { console.log('missing', s); continue; }
  for (const [k, v] of Object.entries(MAPS)) {
    const f = path.join(dir, `${s}_2K-JPG_${k}.jpg`);
    if (!fs.existsSync(f)) continue;
    const out = path.join(O, `${s}_${v}.webp`);
    if (fs.existsSync(out)) continue;
    await sharp(f).resize(1024, 1024).webp({ quality: v === 'normal' ? 90 : 82 }).toFile(out);
  }
  console.log('ok', s);
}
