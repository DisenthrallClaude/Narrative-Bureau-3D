// R3：导出平面规划 JSON（含每件模型按目标尺寸缩放后的真实包围盒），供 tools/r3plan_draw.py 画俯视布局图与做穿模/悬空/越界检查
// 用法：node tools/r3plan_dump.mjs <planId> <y> > out.json
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { PLANS } from '../src/world/r3plan.js';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const [id, Y] = [process.argv[2], +process.argv[3]];
const plan = PLANS[id](Y);
const mul = (a, b) => { const o = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) o[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return o; };
const ap = (m, v) => [0, 1, 2].map((k) => m[k] * v[0] + m[4 + k] * v[1] + m[8 + k] * v[2] + m[12 + k]);
const cache = {};
async function bbox(m) {
  if (cache[m]) return cache[m];
  const doc = await io.read(`public/assets/models/${m}.glb`);
  const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
  const visit = (n, pm) => { const mm = mul(pm, n.getMatrix()); const me = n.getMesh(); if (me) for (const p of me.listPrimitives()) { const pos = p.getAttribute('POSITION'); if (!pos) continue; const a = pos.getMin([]), b = pos.getMax([]); for (const x of [a[0], b[0]]) for (const y of [a[1], b[1]]) for (const z of [a[2], b[2]]) { const v = ap(mm, [x, y, z]); for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], v[k]); max[k] = Math.max(max[k], v[k]); } } } for (const c of n.listChildren()) visit(c, mm); };
  const sc = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
  for (const n of sc.listChildren()) visit(n, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  return (cache[m] = max.map((v, k) => v - min[k]));
}
for (const it of plan.items) {
  if (it.fixed || it.size) continue;
  if (it.box || it.examPaper) { it.size = [it.w, it.h, it.d]; continue; }
  const s0 = await bbox(it.m); if (it.fit) { it.size = it.fit; continue; } const s = it.h ? it.h / s0[1] : it.w ? it.w / s0[0] : it.d ? it.d / s0[2] : (it.s ?? 1);
  it.size = s0.map((v) => +(v * s).toFixed(3));
}
console.log(JSON.stringify(plan, null, 0));
