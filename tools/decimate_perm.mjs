// R3 批次8：高面模型批量减面（meshopt Permissive：允许跨 UV/法线缝塌边，保留原顶点属性子集）
// node tools/decimate_perm.mjs <目标面数> <模型名...>   原件备份到 ../work/models_pre_b8/
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, meshopt as meshoptFn } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import fs from 'node:fs'; import path from 'node:path';
await MeshoptDecoder.ready; await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const T = +process.argv[2]; const BK = '../work/models_pre_b8';
for (const name of process.argv.slice(3)) {
  const f = `public/assets/models/${name}.glb`, bk = path.join(BK, name + '.glb');
  if (!fs.existsSync(f)) { console.log('skip', name); continue; }
  fs.mkdirSync(path.dirname(bk), { recursive: true }); if (!fs.existsSync(bk)) fs.copyFileSync(f, bk);
  const doc = await io.read(bk); let tot = 0; const prims = [];
  for (const me of doc.getRoot().listMeshes()) for (const p of me.listPrimitives()) { const i = p.getIndices(); if (!i || p.getMode() !== 4 || i.getCount() % 3) continue; tot += i.getCount() / 3; prims.push(p); }
  if (tot <= T * 1.2) { console.log(name, tot, 'ok'); continue; }
  const r = T / tot; let after = 0;
  for (const p of prims) {
    const pa = p.getAttribute('POSITION'); const n = pa.getCount(); const pos = new Float32Array(n * 3); const e = [0, 0, 0];
    for (let i = 0; i < n; i++) { pa.getElement(i, e); pos.set(e, i * 3); }
    const ia = p.getIndices(); const idx = new Uint32Array(ia.getArray()); const tgt = Math.max(36, Math.floor(idx.length * r / 3) * 3);
    let out; try { [out] = MeshoptSimplifier.simplify(idx, pos, 3, tgt, 0.012, ['Permissive']); } catch (err) { after += idx.length / 3; continue; }
    after += out.length / 3; ia.setArray(n > 65535 ? new Uint32Array(out) : new Uint16Array(out));
  }
  await doc.transform(prune(), dedup(), meshoptFn({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(f, doc); console.log(name, tot, '->', after);
}
