// R3 批次8 收尾：修外立面远景 LOD 法线（Permissive 跨属性缝塌边后，24% 的角点法线与所在三角面夹角 > 60°，
// 远景主楼整体发黑、玫瑰窗金线丢失）。做法：法线与面法线点积 < 0.5 的角点按「原顶点 + 面朝向簇（点积 > 0.85）」拆出新顶点，
// 新顶点法线 = 簇内面法线面积加权平均；其余属性照抄原顶点。合格角点不动。
// node tools/facade_lod_fixn.mjs in_lo.glb out_lo.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, meshopt as meshoptFn } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]);
let added = 0, fixed = 0;
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  const P = prim.getAttribute('POSITION'), N = prim.getAttribute('NORMAL'); if (!N) continue;
  const I = Array.from(prim.getIndices().getArray()); const n0 = P.getCount();
  const a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0], nn = [0, 0, 0];
  const fN = []; // 每个面的单位法线与面积
  for (let t = 0; t < I.length; t += 3) {
    P.getElement(I[t], a); P.getElement(I[t + 1], b); P.getElement(I[t + 2], c);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const f = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const L = Math.hypot(...f);
    fN.push(L > 1e-12 ? [f[0] / L, f[1] / L, f[2] / L, L] : null);
  }
  // 坏角点：按原顶点分组
  const badByV = new Map();
  for (let t = 0; t < I.length; t++) { const F = fN[(t / 3) | 0]; if (!F) continue; N.getElement(I[t], nn); const l = Math.hypot(...nn) || 1; if ((F[0] * nn[0] + F[1] * nn[1] + F[2] * nn[2]) / l >= 0.5) continue; const v = I[t]; if (!badByV.has(v)) badByV.set(v, []); badByV.get(v).push(t); }
  if (!badByV.size) continue;
  // 聚簇 → 新顶点
  const newV = []; // [srcVertex, normal]
  for (const [v, corners] of badByV) {
    const cl = [];
    for (const t of corners) { const F = fN[(t / 3) | 0]; let k = cl.find((q) => q.seed[0] * F[0] + q.seed[1] * F[1] + q.seed[2] * F[2] > 0.85); if (!k) cl.push(k = { seed: F, s: [0, 0, 0], ts: [] }); k.s[0] += F[0] * F[3]; k.s[1] += F[1] * F[3]; k.s[2] += F[2] * F[3]; k.ts.push(t); }
    for (const k of cl) { const l = Math.hypot(...k.s) || 1; const id = n0 + newV.length; newV.push([v, [k.s[0] / l, k.s[1] / l, k.s[2] / l]]); for (const t of k.ts) { I[t] = id; fixed++; } }
  }
  added += newV.length;
  // 扩展所有属性
  for (const sem of prim.listSemantics()) {
    const A = prim.getAttribute(sem); const es = A.getElementSize(); const src = A.getArray(); const out = new src.constructor((n0 + newV.length) * es); out.set(src.subarray(0, n0 * es));
    const acc = A.clone(); acc.setArray(out); const e = new Array(es).fill(0);
    newV.forEach(([v, nrm], j) => { if (sem === 'NORMAL') acc.setElement(n0 + j, nrm); else { A.getElement(v, e); acc.setElement(n0 + j, e); } });
    prim.setAttribute(sem, acc);
  }
  const total = n0 + newV.length; prim.getIndices().setArray(total > 65535 ? new Uint32Array(I) : new Uint16Array(I));
}
console.log('fixed corners', fixed, 'added vertices', added);
await doc.transform(prune(), dedup());
await doc.transform(meshoptFn({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(process.argv[3], doc);
