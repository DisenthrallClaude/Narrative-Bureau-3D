// 批次 M16：档案馆借阅柜台 / 阅览长桌 hero 重建接入（替换批次32 的 r2/loan_counter_6080、r2/reading_table_6080）。?nom16=1 回旧。
// 模型：public/assets/models/m16/{loan_counter,reading_table}.glb（tools/blender/m16_archive.py，meshopt）。外包尺寸与旧件一致，
// placeModel 同参数放置（宽 7.21 / 5.63、同位同朝向），碰撞 world.box、琥珀检索屏、ctx.stickyNote、登记簿 / 触发器全部原位不动。
// 长桌模型自带两盏暗铜罩台灯（x ±1.4），M16 下 interiors.js 不再画程序化 bankerLamp（ctx.archiveLamps 坐标照旧登记）。
import * as THREE from 'three';
import { pbr } from '../engine/assets.js';

export const M16_ARCH = typeof location !== 'undefined' && !new URLSearchParams(location.search).has('nom16');

let MM = null;
export function m16Mats() {
  if (MM) return MM;
  MM = {
    m16_walnut: pbr('Wood051', { color: 0x74492f, roughness: 0.55, env: 0.4 }),
    m16_walnutD: pbr('Wood051', { color: 0x40291c, roughness: 0.52, env: 0.35 }),
    m16_stoneTop: pbr('Marble021', { color: 0x2a2420, roughness: 0.36, env: 0.5, rn: true }),
    m16_stoneBase: pbr('Granite003A', { color: 0x4a4038, roughness: 0.7, env: 0.35, rn: true }),
    m16_bronze: pbr('Metal046A', { color: 0x8a6038, metalness: 1, roughness: 0.5, env: 0.5 }),   // 大面暗铜：粗糙 ≥0.45 / env 0.5
    m16_brass: pbr('Metal046A', { color: 0xb08250, metalness: 1, roughness: 0.45, env: 0.5 }),   // 小件铜线 / 铭牌
    m16_leather: pbr('Leather026', { color: 0x9a5434, roughness: 0.66, env: 0.25, rn: true }),   // 深棕皮面（非绿呢）
    m16_iron: pbr('Metal046A', { color: 0x2e2a26, metalness: 0.6, roughness: 0.55, env: 0.45 }),
    m16_lampGlow: new THREE.MeshStandardMaterial({ color: 0x2a1c10, emissive: 0xffc890, emissiveIntensity: 0.95, roughness: 0.8 }),
  };
  MM.m16_lampGlow.userData.noShadow = true;
  for (const [k, m] of Object.entries(MM)) m.name = k;
  return MM;
}
/** placeModel 结果按材质名换游戏 pbr（不改几何，可 meshopt） */
export function m16Dress(o) {
  const T = m16Mats();
  o.traverse((m) => { if (!m.isMesh) return; const k = (m.material?.name || '').replace(/\.\d+$/, ''); if (T[k]) m.material = T[k]; m.castShadow = k !== 'm16_lampGlow'; m.receiveShadow = true; });
  return o;
}
