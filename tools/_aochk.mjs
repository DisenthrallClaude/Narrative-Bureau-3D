// 外立面 hi / lo 顶点 AO（COLOR_0）按面积加权均值对比：node tools/_aochk.mjs a.glb b.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
export async function aoStats(f) { const doc = await io.read(f); const r = {};
  for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) { const P = p.getAttribute('POSITION'), C = p.getAttribute('COLOR_0'), I = p.getIndices().getArray(); if (!C) { r[mesh.getName()] = 'noColor'; continue; }
    let s = 0, A = 0; const a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0], e = [0, 0, 0, 0];
    for (let t = 0; t < I.length; t += 3) { P.getElement(I[t], a); P.getElement(I[t + 1], b); P.getElement(I[t + 2], c); const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]; const L = Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]); let m = 0; for (const k of [0, 1, 2]) { C.getElement(I[t + k], e); m += e[0] / 3; } s += m * L; A += L; }
    r[mesh.getName()] = +(s / A).toFixed(3); } return r; }
if (process.argv[1].endsWith('_aochk.mjs')) for (const f of process.argv.slice(2)) console.log(f, JSON.stringify(await aoStats(f)));
