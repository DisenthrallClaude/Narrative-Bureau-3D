import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const mul = (a, b) => { const o = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) o[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return o; };
const ap = (m, v) => [0, 1, 2].map((k) => m[k] * v[0] + m[4 + k] * v[1] + m[8 + k] * v[2] + m[12 + k]);
for (const m of process.argv.slice(2)) { const doc = await io.read(`public/assets/models/${m}.glb`); const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
  const visit = (n, pm) => { const mm = mul(pm, n.getMatrix()); const me = n.getMesh(); if (me) for (const p of me.listPrimitives()) { const pos = p.getAttribute('POSITION'); const a = pos.getMin([]), b = pos.getMax([]); for (const x of [a[0], b[0]]) for (const y of [a[1], b[1]]) for (const z of [a[2], b[2]]) { const v = ap(mm, [x, y, z]); for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], v[k]); max[k] = Math.max(max[k], v[k]); } } } for (const c of n.listChildren()) visit(c, mm); };
  const sc = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]; for (const n of sc.listChildren()) visit(n, [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  const s = max.map((v, k) => v - min[k]); console.log(m, s.map(v=>v.toFixed(3)).join(' x '), 'ratio w/h', (s[0]/s[1]).toFixed(2), 'd/h', (s[2]/s[1]).toFixed(2)); }
