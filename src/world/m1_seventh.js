// 批次 M1：第七局主线区 Blender 精建接入（装订线入口 seventh_entry + 回廊 seventh_gutter）。
// 模型：public/assets/models/m1/{entry,gutter_rib,gutter_panel}.glb（tools/blender/m1_entry.py / m1_gutter.py / m1_lib.py）。
// 原牛皮纸墙/地/书页墙与全部剧情锚点、传送点保持不动；精建件贴着墙内皮加，凸出部分补碰撞。
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { loadModel, pbr } from '../engine/assets.js';
import { point } from './interiors.js';

let MM = null;
function m1Mats(D, M) {
  if (MM) return MM;
  MM = {
    m1_walnut: pbr('Wood051', { color: 0x5a3826, roughness: 0.58, env: 0.15 }), // M3：回廊远端护墙掠射反出冷色 env → 压 env、提粗糙
    m1_walnutDark: pbr('Wood051', { color: 0x3c271c, roughness: 0.6, env: 0.12 }),
    m1_stone: pbr('Concrete034', { color: 0xa09484, roughness: 0.78, env: 0.4 }),
    m1_stoneDark: pbr('Concrete034', { color: 0x5e554c, roughness: 0.75, env: 0.2 }),
    m1_bronze: pbr('Metal046A', { color: 0xb08250, metalness: 0.85, roughness: 0.48, env: 0.5 }), // M3：暗古铜——粗糙 ≥0.45 / env≈0.5，靠底色 + 金属 0.85 留漫反射不发黑
    m1_burgundy: new THREE.MeshStandardMaterial({ color: 0x6a2a20, roughness: 0.85, envMapIntensity: 0.15 }), // M5：Fabric023 贴图本身暗、走道毯读近黑 → 去贴图直给酒红褐底色
    m1_kraft: D.dp_kraft,
    m1_iron: M.blackMetal,
    m1_thread: D.dp_red,
    m1_paper: D.dp_page,
    m1_lampGlow: new THREE.MeshStandardMaterial({ color: 0x2a1a0a, emissive: 0xffc890, emissiveIntensity: 0.95, roughness: 0.4 }),
  };
  return MM;
}
const pick = (MAT, m) => MAT[(m?.name || '').replace(/\.\d+$/, '')] ?? m;

/** 把 glb 里各材质的网格，按一组变换矩阵烘进世界坐标，按材质合并（回廊 46 段 + 19 榀 → 每模块 ≈6 次绘制） */
function bakeInstances(src, mats, MAT) {
  const byMat = new Map();
  src.updateMatrixWorld(true);
  src.traverse((o) => { if (!o.isMesh) return; const mat = pick(MAT, o.material); for (const mx of mats) { const g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(mx, o.matrixWorld)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); if (!byMat.has(mat)) byMat.set(mat, []); byMat.get(mat).push(g); } });
  const out = new THREE.Group();
  for (const [mat, gs] of byMat) { const g = mergeGeometries(gs, false); if (!g) continue; const m = new THREE.Mesh(g, mat); m.castShadow = false; m.receiveShadow = true; out.add(m); }
  return out;
}

export function buildM1Seventh(zone, world, Y, gcur, D, M) {
  const MAT = m1Mats(D, M);
  // ---------- 碰撞（同步加，先于 world.build）----------
  for (const sx of [-1, 1]) {
    for (const z of [-54.5, -58.6, -63.3]) world.box(sx * 2.85, Y + 3, z, 0.3, 6, 0.66);   // 入口石壁柱
    world.box(sx * 2.475, Y + 4.5, -65.0, 1.45, 9, 0.5);                                    // 北端拱门屏墙（洞口 ±1.75）
    world.box(sx * 0.58, Y + 3, -53.42, 0.56, 6, 0.42);                                     // 南墙门套
  }
  world.box(2.22, Y + 1.2, -61.0, 1.3, 2.4, 2.2);                                            // 装订机
  const N = 46, ribs = [], panels = [];
  for (let i = 0; i < N; i++) {
    const p0 = gcur.getPoint(i / N), p1 = gcur.getPoint((i + 1) / N); const mid = p0.clone().add(p1).multiplyScalar(0.5);
    const yaw = Math.atan2(p1.x - p0.x, p1.z - p0.z), len = p0.distanceTo(p1) + 0.02;
    panels.push(new THREE.Matrix4().compose(new THREE.Vector3(mid.x, Y, mid.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(1, 1, len)));
    if (i % 2 === 0 && i > 0 && !(i >= 19 && i <= 27)) { // 镜像守则（t=0.5）两侧留空；i=0 与入口拱门重叠，跳过
      ribs.push(new THREE.Matrix4().compose(new THREE.Vector3(p0.x, Y, p0.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(1, 1, 1)));
      const nx = Math.cos(yaw), nz = -Math.sin(yaw);
      for (const sd of [-1, 1]) world.box(p0.x + nx * sd * 1.62, Y + 4.1, p0.z + nz * sd * 1.62, 0.26, 8.2, 0.52, yaw);
    }
  }
  // ---------- 灯光 ----------
  point(zone, 0xffc890, 7, [0, Y + 6.0, -56.5], 9); point(zone, 0xffc890, 7, [0, Y + 6.0, -61.0], 9); point(zone, 0xffb070, 3, [1.0, Y + 2.6, -61], 4);
  // ---------- 模型 ----------
  const jobs = [];
  jobs.push(loadModel('m1/entry').then((src) => { const o = src.clone(true); o.traverse((m) => { if (m.isMesh) { m.material = pick(MAT, m.material); m.castShadow = false; m.receiveShadow = true; } }); o.position.set(0, Y, 0); o.name = 'm1_entry'; zone.add(o); }));
  jobs.push(loadModel('m1/gutter_panel').then((src) => { const g = bakeInstances(src, panels, MAT); g.name = 'm1_gutter_panel'; zone.add(g); }));
  jobs.push(loadModel('m1/gutter_rib').then((src) => { const g = bakeInstances(src, ribs, MAT); g.name = 'm1_gutter_rib'; zone.add(g); }));
  return Promise.all(jobs);
}

// ---------- 批次 M5：作战室 / 杀青室 / 回写台 精建壳（public/assets/models/m5/{ops,wrap,rewrite}.glb，tools/blender/m5_rooms.py）----------
// 原牛皮纸房间、全部锚点（看板/叛徒墙/K 笔记/档案袋/落地镜/巨书）、传送与 zone 判定不动；凸出件（壁柱/沙盘/排字台）补碰撞。
export function buildM5Seventh(zone, world, Y, D, M) {
  const MAT = m1Mats(D, M);
  const pil = (x, z, alongX) => world.box(x, Y + 3, z, alongX ? 0.66 : 0.2, 6, alongX ? 0.2 : 0.66);
  for (const z of [-124.6, -128.8]) pil(-9.7, z); for (const z of [-118.6, -128.6]) pil(9.7, z);              // 作战室壁柱
  world.box(-4.3, Y + 0.5, -121.3, 2.56, 1.0, 3.16);                                                          // 作战沙盘
  for (const z of [-140.3, -144.9, -149.5, -154.3]) { pil(-7.7, z); pil(7.7, z); }                            // 杀青室壁柱
  for (const z of [-168.2, -173.6, -179.0, -183.4]) pil(-8.7, z); for (const z of [-163.0, -168.2, -173.6, -179.0, -183.4]) pil(8.7, z);
  for (const x of [-5, -1, 1, 5]) pil(x, -185.7, true);                                                       // 回写台壁柱
  world.box(-8.35, Y + 0.8, -163.3, 0.9, 1.6, 5.3);                                                           // 回写排字台
  point(zone, 0xffc890, 3, [-4.3, Y + 3.0, -121.3], 6);                                                       // 沙盘碗灯
  return Promise.all(['ops', 'wrap', 'rewrite'].map((n) => loadModel('m5/' + n).then((src) => { const o = src.clone(true); o.traverse((m) => { if (m.isMesh) { m.material = pick(MAT, m.material); m.castShadow = false; m.receiveShadow = true; } }); o.position.set(0, Y, 0); o.name = 'm5_' + n; zone.add(o); })));
}
