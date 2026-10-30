// R3 批次9：主楼外立面远景 LOD v2。
// 批次8 lo 变黑根因：facade_lod.mjs 末尾 prune() 默认删掉「材质未引用贴图」的属性 → GLB 里材质无贴图（three 端按名字换 extMats），
// TEXCOORD_0 被整体删除，砌块/金色窗花贴图全部采样 (0,0) 单像素 → 远景发黑、纹理与窗花消失；dedup() 还把 marbleDark 合并成 marble。
// v2：不用 Permissive（保留 UV/法线缝，避免跨缝塌边拉坏 UV）；simplifyWithAttributes 带 UV/法线权重；prune(keepAttributes) + dedup 不合并材质。
// node tools/facade_lod2.mjs hi.glb out.glb
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, meshopt as meshoptFn } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
await MeshoptDecoder.ready; await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]);
const RATIO = { F_trim: +(process.env.RT ?? 0.08), F_ashlar: 0.2, F_gold: +(process.env.RG ?? 0.12), F_ashlarDeep: 0.2, F_slate: 0.25, F_lead: 0.2, F_louver: 0.3 };
const ERR = +(process.env.ERR ?? 0.006);
const UVW = +(process.env.UVW ?? 0.5), NW = +(process.env.NW ?? 0.15);
let tin = 0, tout = 0;
// 锁定区（世界坐标球）：主机位焦点玫瑰窗（F_trim 窗花 2.6 万面，普通塌边后只剩 457 面 → 窗花消失）。区内顶点不塌边、原样保留
const LOCK = [[0, 39.4, -5.5, 5.2]];
for (const node of doc.getRoot().listNodes()) { const mesh = node.getMesh(); if (!mesh) continue; const WM = node.getWorldMatrix(); for (const prim of mesh.listPrimitives()) {
  const r = RATIO[mesh.getName()] ?? 0.4;
  const pa = prim.getAttribute('POSITION'); const n = pa.getCount(); const pos = new Float32Array(n * 3); const e = [0, 0, 0];
  for (let i = 0; i < n; i++) { pa.getElement(i, e); pos.set(e, i * 3); }
  // 属性：UV(2) + 法线(3)
  const ua = prim.getAttribute('TEXCOORD_0'), na = prim.getAttribute('NORMAL');
  const att = new Float32Array(n * 5); const u2 = [0, 0], n3 = [0, 0, 0];
  let umin = [1e9, 1e9], umax = [-1e9, -1e9];
  for (let i = 0; i < n; i++) { ua.getElement(i, u2); umin = [Math.min(umin[0], u2[0]), Math.min(umin[1], u2[1])]; umax = [Math.max(umax[0], u2[0]), Math.max(umax[1], u2[1])]; }
  const ur = Math.max(umax[0] - umin[0], umax[1] - umin[1], 1e-6);
  for (let i = 0; i < n; i++) { ua.getElement(i, u2); na.getElement(i, n3); att.set([u2[0] / ur, u2[1] / ur, n3[0], n3[1], n3[2]], i * 5); }
  const lock = new Uint8Array(n); let nl = 0;
  for (let i = 0; i < n; i++) { const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2]; const wx = WM[0] * x + WM[4] * y + WM[8] * z + WM[12], wy = WM[1] * x + WM[5] * y + WM[9] * z + WM[13], wz = WM[2] * x + WM[6] * y + WM[10] * z + WM[14];
    for (const [cx, cy, cz, rr] of LOCK) if (Math.hypot(wx - cx, wy - cy, wz - cz) < rr) { lock[i] = 1; nl++; break; } }
  const ia = prim.getIndices(); const idx = new Uint32Array(ia.getArray());
  const tgt = Math.floor(idx.length * r / 3) * 3;
  const [out, err] = MeshoptSimplifier.simplifyWithAttributes(idx, pos, 3, att, 5, [UVW, UVW, NW, NW, NW], nl ? lock : null, tgt, ERR, (process.env.PERM ? ['Permissive'] : []));
  console.log(mesh.getName(), idx.length / 3, '->', out.length / 3, 'err', err.toFixed(4), 'uvRange', ur.toFixed(1), nl ? 'locked ' + nl : '');
  tin += idx.length / 3; tout += out.length / 3;
  ia.setArray(n > 65535 ? new Uint32Array(out) : new Uint16Array(out));
} }
console.log('total', tin, '->', tout);
await doc.transform(prune({ keepAttributes: true, keepLeaves: true }), dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.TEXTURE] }));
await doc.transform(meshoptFn({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(process.argv[3], doc);
