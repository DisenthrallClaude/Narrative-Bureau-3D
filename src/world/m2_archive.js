// 批次 M2：西翼人事档案馆（archive）建筑壳 Blender 精建接入。
// 模型：public/assets/models/m2/{arch_coffer,arch_entab,arch_pilaster,arch_door}.glb（tools/blender/m2_archive.py）。
// 原地面/墙/回廊/楼梯/抽屉墙/借阅台/叶寻/便签 ctx.stickyNote 等剧情锚点与碰撞全部不动；
// 只替换：平板天花下的木梁格 + 铁桁架（interiors.js 里 M2_ARCHIVE 下关闭）→ 3×3 m 藻井格 12×12；新增四周檐部、东墙壁柱 ×4、东门石门套。
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { loadModel, pbr } from '../engine/assets.js';

export const M2_ARCHIVE = !new URLSearchParams(location.search).has('nom2');

let MM = null;
function m2Mats() {
  if (MM) return MM;
  MM = {
    m1_walnut: pbr('Wood051', { color: 0x6a4430, roughness: 0.55, env: 0.4 }),
    m1_walnutDark: pbr('Wood051', { color: 0x3e281c, roughness: 0.5, env: 0.35 }),
    m1_stone: pbr('Concrete034', { color: 0xa89a88, roughness: 0.78, env: 0.45 }),
    m1_stoneDark: pbr('Concrete034', { color: 0x665c52, roughness: 0.72, env: 0.4 }),
    m2_bronze: pbr('Metal046A', { color: 0xb08250, metalness: 1, roughness: 0.48, env: 0.5 }), // 大面金属 roughness ≥0.45 / env ≈0.5
    m1_burgundy: pbr('Fabric023', { color: 0x8a3428, roughness: 0.85, env: 0.25 }),
  };
  return MM;
}
const pick = (MAT, m) => MAT[(m?.name || '').replace(/\.\d+$/, '')] ?? m;

/** 同一 glb 按一组矩阵烘进世界坐标、按材质合并（只留 position/normal/uv，避免带第二套 UV） */
function bake(src, mats, MAT) {
  const byMat = new Map(); src.updateMatrixWorld(true);
  src.traverse((o) => { if (!o.isMesh) return; const mat = pick(MAT, o.material); for (const mx of mats) { const g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(mx, o.matrixWorld)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); if (!byMat.has(mat)) byMat.set(mat, []); byMat.get(mat).push(g); } });
  const out = new THREE.Group();
  for (const [mat, gs] of byMat) { const g = mergeGeometries(gs, false); if (!g) continue; const m = new THREE.Mesh(g, mat); m.castShadow = false; m.receiveShadow = true; out.add(m); }
  return out;
}
const Q = (yaw) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
const MX = (x, y, z, yaw = 0, sy = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), Q(yaw), new THREE.Vector3(1, sy, 1));

export function buildM2Archive(zone, world, Y) {
  if (!M2_ARCHIVE) return Promise.resolve();
  const MAT = m2Mats();
  const X0 = -56, X1 = -20, Z0 = -32, Z1 = -70, H = 13;
  // —— 藻井：x −54.5…−21.5、z −34.5…−67.5，12×12 格，顶面贴平板天花底 Y+H ——
  const cof = [];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) cof.push(MX(X0 + 1.5 + i * 3, Y + H, Z0 - 2.5 - j * 3));
  // —— 檐部：2 m 模块，背面贴墙内皮，底 Y+11.8（= 回廊档案盒书架顶），顶入天花 0.05 ——
  const ent = [], EY = Y + H - 1.2;
  for (let x = X0 + 1; x <= X1 - 1 + 1e-6; x += 2) { ent.push(MX(x, EY, Z1, 0)); ent.push(MX(x, EY, Z0, Math.PI)); }
  for (let z = Z1 + 1; z <= Z0 - 1 + 1e-6; z += 2) { ent.push(MX(X0, EY, z, Math.PI / 2)); ent.push(MX(X1, EY, z, -Math.PI / 2)); }
  // —— 东墙壁柱（避开东门 z −48…−55 与门旁灭火器 z −46.9 / −56.1）——
  const pil = [], PZ = [-36.0, -41.5, -61.0, -66.0];
  for (const z of PZ) { pil.push(MX(X1, Y, z, -Math.PI / 2, 11.8 / 11.33)); world.box(X1 - 0.16, Y + 5.9, z, 0.32, 11.8, 0.92); }
  // —— 东门石门套（洞宽 7、高 5.2，中心 z −51.5）——
  for (const sz of [-1, 1]) world.box(X1 - 0.15, Y + 2.7, -51.5 + sz * 3.67, 0.3, 5.4, 0.4);
  const jobs = [];
  jobs.push(loadModel('m2/arch_coffer').then((s) => { const g = bake(s, cof, MAT); g.name = 'm2_arch_coffer'; zone.add(g); }));
  jobs.push(loadModel('m2/arch_entab').then((s) => { const g = bake(s, ent, MAT); g.name = 'm2_arch_entab'; zone.add(g); }));
  jobs.push(loadModel('m2/arch_pilaster').then((s) => { const g = bake(s, pil, MAT); g.name = 'm2_arch_pilaster'; zone.add(g); }));
  jobs.push(loadModel('m2/arch_door').then((s) => { const g = bake(s, [MX(X1, Y, -51.5, -Math.PI / 2)], MAT); g.name = 'm2_arch_door'; zone.add(g); }));
  return Promise.all(jobs);
}
