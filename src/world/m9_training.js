// 批次 M9：B6 训练场（training）hero 建筑壳 + 关键装置接入。
// 模型：public/assets/models/m9/{tr_bay,tr_lectern,tr_locker}.glb（tools/blender/m9_training.py）。
// 墙面开间 tr_bay（胡桃墙裙 / 暖灰石饰面 / 壁柱 / 高窗 / 檐口）替换东、西、南墙与北墙两翼的蓝色灯条护墙板（dressing.js 在 M9_TRAIN 下关闭）；
// 讲台 / 器材柜替换 r3plan 的 r2/lectern（简报区）与 r2/locker_equipment ×5（规划里改登记为固定件，参与检查）。
// 剧情锚点、触发器、碰撞（副本门 / 控制塔 / 维护门）全部不动；新件不加碰撞（墙面 ≤0.36 m 贴墙，讲台/柜体加小碰撞盒）。?nom9=1 回旧。
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { loadModel, pbr } from '../engine/assets.js';

export const M9_TRAIN = typeof location !== 'undefined' && !new URLSearchParams(location.search).has('nom9');

function mats() {
  return {
    m1_walnut: pbr('Wood051', { color: 0x6a4430, roughness: 0.55, env: 0.4 }),
    m1_walnutDark: pbr('Wood051', { color: 0x3e281c, roughness: 0.5, env: 0.35 }),
    m1_stone: pbr('Concrete034', { color: 0x9a8e7e, roughness: 0.78, env: 0.4 }),
    m1_stoneDark: pbr('Concrete034', { color: 0x5e554b, roughness: 0.72, env: 0.4 }),
    m2_bronze: pbr('Metal046A', { color: 0xa87a4a, metalness: 1, roughness: 0.48, env: 0.5 }),
    m1_burgundy: pbr('Fabric023', { color: 0x7a3026, roughness: 0.8, env: 0.3 }),
    m1_iron: pbr('Metal046A', { color: 0x2e2a26, metalness: 0.8, roughness: 0.5, env: 0.45 }),
    m1_paper: pbr('Fabric023', { color: 0xe0d2b4, roughness: 0.9, env: 0.2 }),
    m6_enamel: new THREE.MeshStandardMaterial({ color: 0xa79b8b, metalness: 0.12, roughness: 0.5, envMapIntensity: 0.5 }),
    m6_enamelDark: new THREE.MeshStandardMaterial({ color: 0x6f665a, metalness: 0.12, roughness: 0.52, envMapIntensity: 0.5 }),
    m9_glow: (() => { const m = new THREE.MeshStandardMaterial({ color: 0x14100c, emissive: 0xf0d8b4, emissiveIntensity: 0.45, roughness: 0.9 }); m.userData.noShadow = true; return m; })(), // 高窗（采光井）暖白内透；M12：0.7 奶黄 → 0.45 暖白
  };
}
// M12：器材柜单独一套暖灰烤漆（原 0xa79b8b 在游戏里读成白色现代铁柜）
const LOCKER = { m6_enamel: new THREE.MeshStandardMaterial({ color: 0x302a25, metalness: 0.05, roughness: 0.72, envMapIntensity: 0.35 }), m6_enamelDark: new THREE.MeshStandardMaterial({ color: 0x1e1a17, metalness: 0.05, roughness: 0.72, envMapIntensity: 0.35 }) }; // 批次 M16：0x5c5248 / env 0.5 在画面里仍读成浅米色 （run 41226229241 m9_tr_locker 亲眼看与地面同亮）→ 0x423b35 复拍 41227158198 仍只略暗 → 0x302a25 / 0x1e1a17、粗糙 0.72、env 0.35（训练场曝光高，立面读得比色值亮）
const pick = (MAT, m) => MAT[(m?.name || '').replace(/\.\d+$/, '')] ?? m;
function bake(src, mxs, MAT) {
  const byMat = new Map(); src.updateMatrixWorld(true);
  src.traverse((o) => { if (!o.isMesh) return; const mat = pick(MAT, o.material); for (const mx of mxs) { const g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(mx, o.matrixWorld)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); if (!byMat.has(mat)) byMat.set(mat, []); byMat.get(mat).push(g); } });
  const out = new THREE.Group();
  for (const [mat, gs] of byMat) { const g = mergeGeometries(gs, false); if (!g) continue; const m = new THREE.Mesh(g, mat); m.receiveShadow = true; out.add(m); }
  return out;
}
const MX = (x, y, z, yaw = 0, sx = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(sx, 1, 1));

export function buildM9Training(zone, world, y) {
  if (!M9_TRAIN || !zone) return Promise.resolve();
  const MAT = mats(), X = 32, Z0 = -92, Z1 = -156;
  const bays = [];
  for (let z = Z0 - 4; z > Z1; z -= 8) { bays.push(MX(-X, y, z, Math.PI / 2)); bays.push(MX(X, y, z, -Math.PI / 2)); } // 西 / 东墙 8 开间
  for (const x of [-28, -20, -12, 12, 20, 28]) bays.push(MX(x, y, Z1 + 0.2, 0)); // 南墙（内表面 z −155.8）（中段 ±8 m 靶档区保留原墙）
  for (const x of [-28, -20, 20, 28]) bays.push(MX(x, y, Z0 - 0.2, Math.PI)); // 北墙（内表面 z −92.2）
  for (const s of [-1, 1]) bays.push(MX(s * 13.3, y, Z0 - 0.2, Math.PI, 0.675)); // 北墙电梯厅开口两侧窄开间（M14：5.4 m，止于 x ±10.6，与 M12 门柱 9.4…10.6 对接不再交叠；原 12.8 / 0.8 止于 ±9.6）
  const jobs = [];
  jobs.push(loadModel('m9/tr_bay').then((s) => { const g = bake(s, bays, MAT); g.name = 'm9_tr_bay'; zone.add(g); }));
  jobs.push(loadModel('m9/tr_lectern').then((s) => { const g = bake(s, [MX(-22, y, -104.0, Math.PI)], MAT); g.name = 'm9_tr_lectern'; g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); zone.add(g); }));
  jobs.push(loadModel('m9/tr_locker').then((s) => { const I = []; for (let k = 0; k < 5; k++) I.push(MX(12.7, y, -103.6 - k * 1.02, -Math.PI / 2)); const g = bake(s, I, { ...MAT, ...LOCKER }); g.name = 'm9_tr_locker'; g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); zone.add(g); }));
  if (world) { world.box(-22, y + 0.58, -104.0, 0.8, 1.15, 0.6); world.box(12.7, y + 0.95, -105.64, 0.5, 1.9, 5.1); }
  return Promise.all(jobs).catch((e) => console.warn('M9 training', e));
}
