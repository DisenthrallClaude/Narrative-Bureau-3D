// 统计某球形区域内各网格三角面数：node tools/_region.mjs a.glb cx cy cz r
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const [f, cx, cy, cz, r] = [process.argv[2], ...process.argv.slice(3).map(Number)];
const doc = await io.read(f); const out = {};
for (const node of doc.getRoot().listNodes()) { const m = node.getMesh(); if (!m) continue; const M = node.getWorldMatrix();
  for (const p of m.listPrimitives()) { const P = p.getAttribute('POSITION'), I = p.getIndices().getArray(); const e = [0, 0, 0]; const inR = new Uint8Array(P.getCount());
    for (let i = 0; i < P.getCount(); i++) { P.getElement(i, e); const x = M[0] * e[0] + M[4] * e[1] + M[8] * e[2] + M[12], y = M[1] * e[0] + M[5] * e[1] + M[9] * e[2] + M[13], z = M[2] * e[0] + M[6] * e[1] + M[10] * e[2] + M[14]; inR[i] = Math.hypot(x - cx, y - cy, z - cz) < r ? 1 : 0; }
    let n = 0; for (let t = 0; t < I.length; t += 3) if (inR[I[t]] && inR[I[t + 1]] && inR[I[t + 2]]) n++; out[m.getName()] = n; } }
console.log(f.split('/').pop(), JSON.stringify(Object.fromEntries(Object.entries(out).filter(([, v]) => v))));
