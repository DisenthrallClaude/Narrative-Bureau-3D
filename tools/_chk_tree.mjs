import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]); await doc.transform(dequantize());
const mul = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
for (const n of doc.getRoot().listNodes().filter((n) => n.getMesh())) { const M = n.getWorldMatrix(); for (const p of n.getMesh().listPrimitives()) { const a = p.getAttribute('POSITION'); let ys = [], rs = [];
  for (let j = 0; j < a.getCount(); j++) { const w = mul(M, a.getElement(j, [])); ys.push(w[1]); rs.push(Math.hypot(w[0], w[2])); } ys.sort((x, y) => x - y); rs.sort((x, y) => x - y);
  console.log(n.getName(), p.getMaterial()?.getName(), a.getCount(), 'y', ys[0].toFixed(2), ys[Math.floor(ys.length * 0.02)].toFixed(2), ys.at(-1).toFixed(2), 'r95', rs[Math.floor(rs.length * 0.95)].toFixed(2)); } }
if (process.argv[3]) { for (const e of doc.getRoot().listExtensionsUsed()) if (/meshopt/.test(e.extensionName)) e.dispose(); await io.write(process.argv[3], doc); }
