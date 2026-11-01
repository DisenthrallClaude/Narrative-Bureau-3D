// R4-B：rusty_kiosk_01 贴图里的蓝漆带按色相选择性改成暗酒红褐漆（其余锈迹/白漆不动）
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import fs from 'fs'; import { execSync } from 'child_process';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]);
for (const m of doc.getRoot().listMaterials()) { const t = m.getBaseColorTexture(); if (!t) continue;
  fs.writeFileSync('/tmp/r4bk/in.webp', t.getImage());
  execSync(`python3 -c "
from PIL import Image
import colorsys
a=Image.open('/tmp/r4bk/in.webp').convert('RGB'); px=a.load(); W,H=a.size
for y in range(H):
  for x in range(W):
    r,g,b=px[x,y]; h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
    w=max(0.0,min(1.0,(s-0.12)/0.15))*max(0.0,1-abs(h-0.55)/0.12)
    if w<=0: continue
    l=(0.299*r+0.587*g+0.114*b)
    t=(l*0.95,l*0.50,l*0.36)
    px[x,y]=tuple(int(c*(1-w)+k*w) for c,k in zip((r,g,b),t))
a.save('/tmp/r4bk/out.webp',quality=88)"`);
  t.setImage(fs.readFileSync('/tmp/r4bk/out.webp')); console.log('recolor', m.getName()); }
await io.write(process.argv[3], doc);
