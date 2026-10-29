// Poly Haven 2K 贴图 → public/assets/tex/ph/<name>_{col,nrm,arm}.webp（arm：R=AO G=粗糙度 B=金属度）
import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path';
const S = '../work/r2/ph', O = 'public/assets/tex/ph'; fs.mkdirSync(O, { recursive: true });
const size = +(process.argv[3] || 2048);
const names = (process.argv[2] || '').split(',').filter(Boolean);
for (const n of names) {
  for (const [k, v] of [['diff', 'col'], ['nor', 'nrm'], ['arm', 'arm']]) {
    const f = path.join(S, `${n}_${k}.jpg`), out = path.join(O, `${n}_${v}.webp`);
    if (!fs.existsSync(f) || fs.existsSync(out)) continue;
    await sharp(f).resize(size, size).webp({ quality: v === 'nrm' ? 92 : 85 }).toFile(out);
  }
  console.log('ok', n);
}
