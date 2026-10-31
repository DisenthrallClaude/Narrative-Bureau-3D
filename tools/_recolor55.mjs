// 批次55：去墨绿 —— 报刊架墨绿铁皮 → 暗铜褐烤漆；填单台毛毡垫灰绿 → 深酒红呢面（直接改 GLB 材质因子，源脚本同步改）
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const SET = { nr_greenPaint: [[0.060, 0.030, 0.015], 0.40, 0.35], nr_greenDark: [[0.028, 0.014, 0.007], 0.48, 0.35], fd_felt: [[0.12, 0.018, 0.022], 0.95, 0] };
for (const f of process.argv.slice(2)) { const doc = await io.read(f); let n = 0;
  for (const m of doc.getRoot().listMaterials()) { const s = SET[m.getName()]; if (!s) continue; m.setBaseColorFactor([...s[0], 1]); m.setRoughnessFactor(s[1]); m.setMetallicFactor(s[2]); n++; console.log(f, m.getName()); }
  if (n) await io.write(f, doc); }
