import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import fs from 'fs'; import { execSync } from 'child_process';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]);
for (const m of doc.getRoot().listMaterials()) { const t = m.getBaseColorTexture(); if (!t) continue; const n = m.getName();
  const amt = n === 'met4' ? 0.95 : n === 'vitea' ? 0.55 : 0; if (!amt) continue;
  fs.writeFileSync('/tmp/r4bk/in.webp', t.getImage());
  execSync(`python3 -c "
from PIL import Image
a=Image.open('/tmp/r4bk/in.webp').convert('RGB'); px=a.load(); W,H=a.size
tint=(0.66,0.50,0.38) if '${n}'=='met4' else (1.04,0.86,0.66)
for y in range(H):
  for x in range(W):
    r,g,b=px[x,y]; l=0.299*r+0.587*g+0.114*b
    px[x,y]=tuple(int(min(255,c*(1-${amt})+l*k*${amt})) for c,k in zip((r,g,b),tint))
a.save('/tmp/r4bk/out.webp',quality=85)"`);
  t.setImage(fs.readFileSync('/tmp/r4bk/out.webp')); console.log('recolor', n); }
await io.write(process.argv[3], doc);
