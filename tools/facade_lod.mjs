// R3 批次8：主楼外立面远景 LOD（Permissive 跨 UV 缝塌边；保留原顶点属性子集）
// node tools/facade_lod.mjs in.glb out.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, weld, meshopt as meshoptFn, dedup } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
await MeshoptDecoder.ready; await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]);
const RATIO = { F_trim: 0.08, F_ashlar: 0.2, F_gold: 0.12, F_ashlarDeep: 0.2, F_slate: 0.25, F_lead: 0.2, F_louver: 0.3 };
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  const r = RATIO[mesh.getName()] ?? 0.4;
  const pa = prim.getAttribute('POSITION'); const n = pa.getCount(); const pos = new Float32Array(n * 3); const e = [0, 0, 0];
  for (let i = 0; i < n; i++) { pa.getElement(i, e); pos.set(e, i * 3); }
  const ia = prim.getIndices(); const idx = new Uint32Array(ia.getArray());
  const tgt = Math.floor(idx.length * r / 3) * 3;
  const [out, err] = MeshoptSimplifier.simplify(idx, pos, 3, tgt, 0.004, ['Permissive']);
  console.log(mesh.getName(), idx.length / 3, '->', out.length / 3, 'err', err.toFixed(4));
  ia.setArray(n > 65535 ? new Uint32Array(out) : new Uint16Array(out));
}
await doc.transform(prune(), dedup());
await doc.transform(meshoptFn({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(process.argv[3], doc);
