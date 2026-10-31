// 批次 M11：12F 局长室（director）Blender hero 接入。
// 模型：public/assets/models/m11/{dr_shell,dr_desk,dr_cred,dr_cab,dr_flag}.glb（tools/blender/m11_director.py，meshopt 压缩）。
// dr_shell：东西墙胡桃护墙板 1.5 m 框芯 + 上段壁骨/线框分格 + 四边三级檐口 + 格子天花（底 y+6.55）+ 北窗酒红褐丝绒窗帘（游戏绝对 x/z，原点 12F 地面）。
// dr_desk：替换 upper.js 的方盒大班台（原台面/柜体在 M11 下不画，玻璃板与锚点纸张、镇纸、抽屉信原样保留）；碰撞改 world.box 同尺寸。
// dr_cred：主座背后矮书柜（中窗前）；dr_cab：机要室隔墙西面文件柜 ×3；dr_flag：主座右后局旗。新件均补碰撞盒。
// 剧情锚点 / 触发器 / 无名书 / zone 判定全部不动。?nom11=1 回旧。
import * as THREE from 'three';
import { loadModel, pbr } from '../engine/assets.js';

export const M11_DIR = typeof location !== 'undefined' && !new URLSearchParams(location.search).has('nom11');

function mats() {
  const noEnvBlue = (m) => m;
  return {
    m1_walnut: pbr('Wood051', { color: 0x6a4430, roughness: 0.55, env: 0.4 }),
    m1_walnutDark: pbr('Wood051', { color: 0x3e281c, roughness: 0.5, env: 0.35 }),
    m1_stone: pbr('Concrete034', { color: 0x9a8e7e, roughness: 0.78, env: 0.4 }),
    m1_stoneDark: pbr('Concrete034', { color: 0x5e554b, roughness: 0.72, env: 0.4 }),
    m2_bronze: pbr('Metal046A', { color: 0x8a6238, metalness: 0.9, roughness: 0.5, env: 0.5 }),
    m1_burgundy: pbr('Fabric023', { color: 0x6a2a20, roughness: 0.8, env: 0.3 }),
    m11_leather: pbr('Fabric023', { color: 0x4a1a14, roughness: 0.6, env: 0.35 }),
    m11_velvet: pbr('Fabric023', { color: 0x5a1c16, roughness: 0.88, env: 0.25 }),
    m11_coffer: pbr('Fabric023', { color: 0x3a1a12, roughness: 0.8, env: 0.3 }),
    m11_wallcloth: pbr('Fabric023', { color: 0x7e6a56, roughness: 0.88, env: 0.3 }),
    m11_books: pbr('Fabric023', { color: 0x5a3020, roughness: 0.85, env: 0.25 }),
    m6_enamelDark: noEnvBlue(new THREE.MeshStandardMaterial({ color: 0x5a5248, metalness: 0.12, roughness: 0.52, envMapIntensity: 0.5 })),
    m1_paper: pbr('Fabric023', { color: 0xe0d2b4, roughness: 0.9, env: 0.2 }),
  };
}
const pick = (MAT, m) => MAT[(m?.name || '').replace(/\.\d+$/, '')] ?? m;

function place(zone, MAT, name, pos, yaw, cast) {
  return loadModel('m11/' + name).then((src) => {
    const g = src.clone(true); g.name = 'm11_' + name;
    g.position.set(pos[0], pos[1], pos[2]); g.rotation.y = yaw;
    g.traverse((o) => { if (!o.isMesh) return; o.material = pick(MAT, o.material); o.receiveShadow = true; o.castShadow = !!cast; });
    zone.add(g);
  });
}

export function buildM11Director(zone, world, y) {
  if (!M11_DIR || !zone) return Promise.resolve();
  const MAT = mats(), jobs = [];
  jobs.push(place(zone, MAT, 'dr_shell', [0, y, 0], 0, false));
  jobs.push(place(zone, MAT, 'dr_desk', [0, y, -104], 0, true));
  jobs.push(place(zone, MAT, 'dr_cred', [0, y, -110.85], 0, true));
  jobs.push(place(zone, MAT, 'dr_flag', [2.4, y, -106.0], 0, true));
  for (const z of [-101.5, -102.05, -102.6]) jobs.push(place(zone, MAT, 'dr_cab', [6.53, y, z], -Math.PI / 2, true));
  if (world) {
    world.box(0, y + 0.45, -104, 3.34, 0.9, 1.52);         // 大班台（替原 Batch 碰撞）
    world.box(0, y + 0.48, -110.85, 2.68, 0.95, 0.55);     // 矮书柜
    world.box(6.53, y + 0.66, -102.05, 0.62, 1.32, 1.65);  // 文件柜一排
    world.box(2.4, y + 1.0, -106.0, 0.4, 2.0, 0.4);        // 旗架
  }
  return Promise.all(jobs).catch((e) => console.warn('M11 director', e));
}
