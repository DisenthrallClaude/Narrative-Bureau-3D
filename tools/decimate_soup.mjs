// 三角汤模型（法线不共享、无法焊接）的强力减面：去 NORMAL → weld → meshopt simplify；运行时 computeVertexNormals 补法线
// node tools/decimate_soup.mjs in.glb out.glb ratio error
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, dedup, prune } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
const [inp, out, ratio = '0.1', error = '0.02'] = process.argv.slice(2);
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(inp);
for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const n = p.getAttribute('NORMAL'); if (n) p.setAttribute('NORMAL', null); }
await doc.transform(dedup(), weld());
await MeshoptSimplifier.ready;
// simplifySloppy：可跨不相连的小碎片合并（彩窗/雕花这类成千上万小片的模型普通 simplify 降不下去）
for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
  const pa = p.getAttribute('POSITION'), n = pa.getCount(); const pos = new Float32Array(n * 3); const e = [0, 0, 0];
  for (let i = 0; i < n; i++) { pa.getElement(i, e); pos[i * 3] = e[0]; pos[i * 3 + 1] = e[1]; pos[i * 3 + 2] = e[2]; }
  let idx = p.getIndices() ? Uint32Array.from(p.getIndices().getArray()) : Uint32Array.from({ length: n }, (_, i) => i);
  const target = Math.max(3, Math.floor(idx.length * +ratio / 3) * 3);
  if (p.getMode() !== 4 || idx.length % 3) continue; let out = [];
  try { [out] = MeshoptSimplifier.simplifySloppy(idx, pos, 3, null, target, +error); } catch (er) { console.log('skip', m.getName(), idx.length, er.message); continue; }
  if (out.length >= 3) { const acc = doc.createAccessor().setType('SCALAR').setArray(n > 65535 ? out : Uint16Array.from(out)); p.setIndices(acc); }
}
await doc.transform(prune());
await io.write(out, doc);
let t = 0; for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) t += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3; console.log('tris', Math.round(t));
