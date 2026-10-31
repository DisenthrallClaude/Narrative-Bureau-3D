// 批次33：行道树「抬冠收冠」——把 Poly Haven jacaranda（CC0）冠下抬高 + 树冠水平收窄，得到高干窄冠的行道树形
// node tools/tree_lift.mjs in.glb out.glb [lift=0.31] [narrow=0.6]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize, quantize, prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const [i, o, LIFT = '0.31', NAR = '0.6'] = process.argv.slice(2);
const doc = await io.read(i); await doc.transform(dequantize());
const nodes = doc.getRoot().listNodes().filter((n) => n.getMesh());
const mul = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
function inv(m) { // 仿射逆
  const [a, b, c, d, e, f, g, h, k] = [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
  const A = e * k - f * h, B = -(d * k - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  const r = [A / det, -(b * k - c * h) / det, (b * f - c * e) / det, 0, B / det, (a * k - c * g) / det, -(a * f - c * d) / det, 0, C / det, -(a * h - b * g) / det, (a * e - b * d) / det, 0, 0, 0, 0, 1];
  const t = mul(r, [m[12], m[13], m[14]]); r[12] = -t[0] + 0; r[13] = -t[1]; r[14] = -t[2]; // r*(p) 已含 0 平移，这里补 −R·t
  return r; }
let lo = Infinity, hi = -Infinity;
for (const n of nodes) { const M = n.getWorldMatrix(); for (const p of n.getMesh().listPrimitives()) { const a = p.getAttribute('POSITION'); for (let j = 0; j < a.getCount(); j++) { const w = mul(M, a.getElement(j, [])); lo = Math.min(lo, w[1]); hi = Math.max(hi, w[1]); } } }
const H = hi - lo, L = +LIFT * H, s = +NAR; console.log('H', H.toFixed(3), 'lift', L.toFixed(3));
const sm = (x, a, b) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const done = new Set();
for (const n of nodes) { const M = n.getWorldMatrix(), R = inv(M); for (const p of n.getMesh().listPrimitives()) { const a = p.getAttribute('POSITION'); if (done.has(a)) continue; done.add(a);
  for (let j = 0; j < a.getCount(); j++) { const w = mul(M, a.getElement(j, [])); const z = (w[1] - lo) / H; // 0..1
    const up = sm(z, 0.03, 0.105) * L; const k = 1 - (1 - s) * sm(z, 0.08, 0.2);
    w[0] *= k; w[2] *= k; w[1] += up; a.setElement(j, mul(R, w)); } } }
await doc.transform(quantize(), prune({ keepAttributes: true }));
await io.write(o, doc); console.log('wrote', o);
