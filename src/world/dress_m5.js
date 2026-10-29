// M5 布景：B1 整备库 / B6 训练场加密（训练器械、靶位、装备箱、拖车、标识、地面磨损贴花），哑光地坪材质
// 坐标见 rooms.js：B1 y=-10, x±16, z -92…-126；B6 y=-52, x±32, z -92…-156（副本门弧线 z −119…−134，控制塔 (−22,−99)）
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { pbr } from '../engine/assets.js';
import { weather } from '../engine/weather.js';
import { mats } from './mats.js';
import { vaultMats, tagMaterial } from './vault.js';
import { dressMats, Props, hangingSign } from './dress.js';
import { person } from './interiors.js';
import { UNDER } from './rooms.js';

const cvTex = (w, h, draw, rep) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t; };
const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

let MM = null;
export function m5Mats(M) {
  if (MM) return MM;
  // 环氧地坪：灰绿哑光，整体粗糙（不再用抛光石材粗糙度图）
  const epoxy = pbr('Concrete034', { color: 0x5a605c, roughness: 0.82, env: 0.12 });
  weather(epoxy, { macro: 0.3, grime: 0.45, dust: 0.35, ground: -60, rough: 0.15 });
  // 训练场地面：深灰橡胶地垫，2 m 一格，接缝 + 轻微折痕（呼应「纸页」）
  const tf = cvTex(512, 512, (c, w, h) => { c.fillStyle = '#2b2c2f'; c.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { const g = 36 + rnd() * 18; c.fillStyle = `rgb(${g},${g},${g + 3})`; c.fillRect(rnd() * w, rnd() * h, 2, 2); } c.strokeStyle = 'rgba(0,0,0,0.75)'; c.lineWidth = 4; c.strokeRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, h); c.moveTo(w, 0); c.lineTo(0, h); c.stroke(); }, true);
  const trainFloor = new THREE.MeshStandardMaterial({ map: tf, roughness: 0.9, envMapIntensity: 0.1, color: 0xbfbfbf });
  tf.repeat.set(0.5, 0.5); // Batch 世界 UV（uv:0.3）→ 约 2 m 一格（经验值）
  weather(trainFloor, { macro: 0.25, grime: 0.3, dust: 0.3, ground: -60, rough: 0.1 });
  // 地面磨损/轮胎印/油渍贴花（透明）
  const decal = (draw) => { const m = new THREE.MeshStandardMaterial({ map: cvTex(256, 256, draw), transparent: true, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }); m.userData.noShadow = true; return m; };
  const wear = decal((c, w, h) => { c.filter = 'blur(1px)'; for (let i = 0; i < 2600; i++) { const x = w / 2 + (rnd() - 0.5) * w * 0.9 * rnd(), y = h / 2 + (rnd() - 0.5) * h * 0.9 * rnd(); c.fillStyle = `rgba(${110 + rnd() * 30},${108 + rnd() * 30},${100 + rnd() * 30},${0.015 + rnd() * 0.03})`; c.fillRect(x, y, 1 + rnd() * 3, 1 + rnd() * 2); } });
  const tire = decal((c, w, h) => { for (const x0 of [56, 200]) for (let y = 0; y < h; y += 6) { c.fillStyle = `rgba(10,10,10,${0.18 + rnd() * 0.2})`; c.fillRect(x0 + Math.sin(y * 0.02) * 6, y, 34, 4); } });
  const oil = decal((c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(8,8,6,0.65)'); g.addColorStop(0.6, 'rgba(14,12,8,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(w / 2, h / 2, w * 0.48, h * 0.36, 0.4, 0, 7); c.fill(); });
  const paintY = new THREE.MeshStandardMaterial({ color: 0xc8a020, roughness: 0.7 });
  const paintW = new THREE.MeshStandardMaterial({ color: 0xc8c8c0, roughness: 0.7 });
  const paintR = new THREE.MeshStandardMaterial({ color: 0x9a1c18, roughness: 0.7 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xd8641c, roughness: 0.55 });
  const olive = weather(new THREE.MeshStandardMaterial({ color: 0x3e4636, roughness: 0.6, metalness: 0.3 }), { macro: 0.2, tarnish: 0.3, dust: 0.3 });
  const bagLeather = new THREE.MeshStandardMaterial({ color: 0x2a1a14, roughness: 0.55 });
  const toolRed = new THREE.MeshStandardMaterial({ color: 0x8a1a16, roughness: 0.35, metalness: 0.5 });
  const rubberMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.9 });
  const targetMat = new THREE.MeshStandardMaterial({ map: cvTex(256, 384, (c, w, h) => { c.fillStyle = '#e6dfcc'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1612'; c.beginPath(); c.arc(w / 2, 70, 40, 0, 7); c.fill(); c.beginPath(); c.moveTo(40, h); c.quadraticCurveTo(w / 2, 90, w - 40, h); c.fill(); c.strokeStyle = '#b01e22'; c.lineWidth = 3; for (let r = 20; r < 130; r += 22) { c.beginPath(); c.arc(w / 2, 220, r, 0, 7); c.stroke(); } c.fillStyle = '#e6dfcc'; c.font = '900 26px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'center'; c.fillText('文', w / 2, 230); for (let i = 0; i < 9; i++) { c.fillStyle = '#111'; c.beginPath(); c.arc(w / 2 + (rnd() - 0.5) * 120, 220 + (rnd() - 0.5) * 140, 3, 0, 7); c.fill(); } }), roughness: 0.9, side: THREE.DoubleSide });
  MM = { epoxy, trainFloor, m5_wear: wear, m5_tire: tire, m5_oil: oil, paintY, paintW, paintR, m5_orange: orange, m5_olive: olive, m5_bag: bagLeather, m5_toolRed: toolRed, m5_rubber: rubberMat, m5_target: targetMat };
  for (const k of ['m5_wear', 'm5_tire', 'm5_oil']) MM[k].userData.noShadow = true;
  return MM;
}

/** 地面喷字（透明画布贴片） */
function stencil(zone, text, x, y, z, yaw = 0, w = 3, color = '#d8b020') {
  const m = new THREE.MeshStandardMaterial({ map: cvTex(512, 128, (c, W, H) => { c.fillStyle = color; c.globalAlpha = 0.85; c.font = '700 88px "NB Sans", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H / 2 + 4, W - 20); for (let i = 0; i < 300; i++) { c.clearRect(rnd() * W, rnd() * H, 3, 3); } }), transparent: true, depthWrite: false, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -3 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), m); p.rotation.set(-Math.PI / 2, 0, yaw); p.position.set(x, y + 0.012, z); zone.add(p); return p;
}
/** 平地贴花 */
function decalAt(b, key, x, y, z, w, d, yaw = 0) { b.add(key, new THREE.PlaneGeometry(w, d), { pos: [x, y + 0.008, z], rot: [-Math.PI / 2, 0, yaw] }, { uv: false }); }
/** 托盘 + 纸箱 */
function pallet(b, P, x, y, z, yaw = 0, boxes = 4) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  for (let i = -1; i <= 1; i++) b.box('wood', 1.2, 0.04, 0.1, [x + s * i * 0.5, y + 0.13, z + c * i * 0.5], { uv: 0.6, rot: [0, yaw, 0] });
  for (let i = -1; i <= 1; i++) b.box('wood', 0.1, 0.11, 1.0, [x + c * i * 0.55, y + 0.055, z - s * i * 0.55], { uv: 0.6, rot: [0, yaw, 0] });
  for (let k = 0; k < boxes; k++) P.add('cardboard_box', [x + c * ((k % 2) - 0.5) * 0.55, y + 0.15 + Math.floor(k / 2) * 0.42, z - s * ((k % 2) - 0.5) * 0.55], { h: 0.42, yaw: yaw + (k % 3) * 0.1 });
}
/** 油桶 */
function drum(b, x, y, z, key = 'm5_olive') { b.add(key, new THREE.CylinderGeometry(0.29, 0.29, 0.88, 18), { pos: [x, y + 0.44, z] }, { uv: 1 }); for (const h of [0.2, 0.68]) b.add('blackMetal', new THREE.TorusGeometry(0.295, 0.015, 4, 18), { pos: [x, y + h, z], rot: [Math.PI / 2, 0, 0] }, { uv: 1 }); }
/** 锥形路标 */
function cone(b, x, y, z) { b.add('m5_orange', new THREE.ConeGeometry(0.16, 0.6, 12), { pos: [x, y + 0.32, z] }, { uv: false }); b.box('m5_rubber', 0.36, 0.03, 0.36, [x, y + 0.015, z], { uv: false }); b.add('paintW', new THREE.CylinderGeometry(0.085, 0.11, 0.08, 12, 1, true), { pos: [x, y + 0.36, z] }, { uv: false }); }
/** 平板拖车 */
function trailer(b, P, x, y, z, yaw = 0) {
  const c = Math.cos(yaw), s = Math.sin(yaw); const at = (dx, dz) => [x + c * dx + s * dz, z - s * dx + c * dz];
  b.add('m5_olive', new THREE.BoxGeometry(2.2, 0.14, 4.2), { pos: [x, y + 0.62, z], rot: [0, yaw, 0] }, { uv: 1 });
  for (const sx of [-1, 1]) { const [px, pz] = at(sx * 1.08, 0); b.add('blackMetal', new THREE.BoxGeometry(0.06, 0.35, 4.2), { pos: [px, y + 0.86, pz], rot: [0, yaw, 0] }, { uv: 1 }); }
  for (const sx of [-1, 1]) for (const dz of [-0.9, 0.9]) { const [px, pz] = at(sx * 1.2, dz); b.add('m5_rubber', new THREE.CylinderGeometry(0.34, 0.34, 0.24, 18), { pos: [px, y + 0.34, pz], rot: [0, yaw, Math.PI / 2] }, { uv: false }); b.add('steel', new THREE.CylinderGeometry(0.16, 0.16, 0.26, 12), { pos: [px, y + 0.34, pz], rot: [0, yaw, Math.PI / 2] }, { uv: 1 }); }
  { const [px, pz] = at(0, 2.7); b.add('blackMetal', new THREE.BoxGeometry(0.1, 0.1, 1.4), { pos: [px, y + 0.55, pz], rot: [0, yaw, 0] }, { uv: 1 }); }
  for (const [dx, dz] of [[-0.5, -1.2], [0.5, -1.2], [-0.5, 0], [0.5, 0.2]]) { const [px, pz] = at(dx, dz); P.add('military_crate', [px, y + 0.69, pz], { h: 0.55, yaw: yaw + dx * 0.2 }); }
  { const [px, pz] = at(0, 1.3); P.add('plastic_container', [px, y + 0.69, pz], { h: 0.5, yaw }); }
}

export async function buildM5(scene, world, ctx) {
  const M = mats(); const Mx = vaultMats(M); const D = dressMats(M); const X5 = m5Mats(M);
  const MAT = { ...M, ...Mx, ...D, ...X5 };
  const jobs = [];
  const finish = (zone, b, P) => { b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g); jobs.push(P.build(zone)); };

  // ================= B1 整备库 =================
  const za = ctx.zones.armory;
  if (za) {
    const b = new Batch(), P = new Props(), y = UNDER.B1, X = 16, Z0 = -92, Z1 = -126;
    // 车位标线（东侧车库）+ 人行通道双黄线 + 轮胎印/油渍
    for (const z of [-99.5, -109, -118.5]) b.box('paintY', 6.2, 0.006, 0.12, [10.5, y + 0.004, z], { uv: false });
    b.box('paintY', 0.12, 0.006, 19, [7.4, y + 0.004, -109], { uv: false });
    for (const x of [5.2, 5.5]) b.box('paintY', 0.08, 0.006, 32, [x, y + 0.004, -109], { uv: false });
    for (const x of [-4.6, -4.3]) b.box('paintW', 0.08, 0.006, 28, [x, y + 0.004, -107], { uv: false });
    for (const z of [-104, -114]) { decalAt(b, 'm5_tire', 10, y, z + 7, 2.4, 9); decalAt(b, 'm5_oil', 10.3, y, z + 0.4, 1.6, 1.2, 0.3); }
    decalAt(b, 'm5_tire', 10, y, -96, 2.4, 6); decalAt(b, 'm5_oil', 3.6, y, -121, 1.2, 0.9, 1.1);
    for (let k = 0; k < 8; k++) decalAt(b, 'm5_wear', -12 + k * 3.4, y, -106 - (k % 3) * 6, 4.5, 4.5, k);
    stencil(za, '车辆整备区', 10.5, y, -96.2, Math.PI / 2 * 0, 3.2); stencil(za, '禁止停车', 1.8, y, -94.5, 0, 2.4, '#c8c8c0'); stencil(za, '人行通道', -0.4, y, -100, Math.PI / 2, 2.0, '#c8c8c0');
    // 车库龙门吊轨 + 吊钩
    for (const x of [7.6, 13.4]) { b.box('blackMetal', 0.22, 0.4, 32, [x, y + 5.0, -109], { uv: 1 }); b.box('paintY', 0.24, 0.06, 32, [x, y + 4.78, -109], { uv: false }); }
    b.box('paintY', 6.0, 0.42, 0.42, [10.5, y + 4.6, -110], { uv: false }); b.box('blackMetal', 0.6, 0.5, 0.6, [10.5, y + 4.2, -110], { uv: 1 });
    b.add('steel', new THREE.CylinderGeometry(0.015, 0.015, 2.0, 5), { pos: [10.5, y + 2.95, -110] }, { uv: 1 }); b.add('paintY', new THREE.TorusGeometry(0.12, 0.035, 6, 14, Math.PI * 1.4), { pos: [10.5, y + 1.85, -110] }, { uv: false });
    // 车边充电桩 ×2
    for (const z of [-101.4, -111.4]) { b.box('paintW', 0.45, 1.5, 0.35, [15.5, y + 0.75, z], { uv: false, collide: true }); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.18), new THREE.MeshStandardMaterial({ color: 0, emissive: 0x30d070, emissiveIntensity: 1.0 })); sc.position.set(15.27, y + 1.15, z); sc.rotation.y = -Math.PI / 2; za.add(sc); b.add('m5_rubber', new THREE.TorusGeometry(0.22, 0.025, 6, 16), { pos: [15.25, y + 0.6, z] , rot: [0, Math.PI / 2, 0] }, { uv: false }); }
    // 防暴盾牌墙（东墙两车之间）
    { b.box('blackMetal', 0.12, 2.6, 4.2, [15.85, y + 1.6, -106.6], { uv: 1 }); for (let k = 0; k < 7; k++) { const z = -104.8 - k * 0.55; b.box('dz_glassDark', 0.04, 1.2, 0.5, [15.7, y + 1.2, z], { uv: false }); b.box('steel', 0.05, 0.08, 0.5, [15.69, y + 1.45, z], { uv: 1 }); const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.08), tagMaterial('防暴')); lab.position.set(15.67, y + 1.0, z); lab.rotation.y = -Math.PI / 2; za.add(lab); } for (let k = 0; k < 7; k++) P.add('gas_mask', [15.7, y + 2.25, -104.8 - k * 0.55], { h: 0.26, yaw: -Math.PI / 2 }); }
    // 战术背心挂架（简报区与装备墙之间）
    for (let r = 0; r < 2; r++) { const z = -112 - r * 2.4; b.box('steel', 3.6, 0.04, 0.04, [-1.5, y + 1.9, z], { uv: 1 }); for (const ex of [-1.8, 1.8]) { b.box('steel', 0.04, 1.9, 0.04, [-1.5 + ex, y + 0.95, z], { uv: 1 }); b.box('steel', 0.04, 0.04, 0.8, [-1.5 + ex, y + 0.02, z], { uv: 1 }); } for (let k = 0; k < 6; k++) { const x = -3.0 + k * 0.6; b.box(k % 3 ? 'navy' : 'm5_olive', 0.46, 0.62, 0.18, [x, y + 1.45, z], { uv: 1 }); b.box('paintY', 0.3, 0.06, 0.19, [x, y + 1.6, z], { uv: false }); } world.box(-1.5, y + 1, z, 3.8, 2, 0.3); }
    hangingSign(za, M, '战术装备领用', -1.5, y + 3.6, -113.2, 0, 2.2);
    // 托盘货物 + 油桶 + 装备箱堆
    pallet(b, P, -7.5, y, -115.5, 0.1, 6); pallet(b, P, -7.6, y, -118.6, -0.15, 4); world.box(-7.5, y + 0.6, -117, 1.4, 1.2, 4.4);
    for (const [x, z] of [[13.6, -121.6], [14.3, -121.0], [13.2, -120.6], [14.5, -122.3]]) drum(b, x, y, z, x > 14 ? 'm5_olive' : 'dz_pipeRed');
    world.box(13.8, y + 0.45, -121.4, 2, 0.9, 2);
    for (const [x, z, h] of [[-12.6, -123.8, 0], [-11.9, -123.8, 0], [-12.25, -123.8, 0.55], [8.5, -94.4, 0], [9.2, -94.4, 0]]) P.add('military_crate', [x, y + h, z], { h: 0.55, yaw: x * 0.3 });
    // 平板拖车（载装备箱）
    trailer(b, P, 3.2, y, -102.5, 0.08); world.box(3.2, y + 0.7, -102.5, 2.4, 1.4, 4.6, 0.08);
    // 工具车（红）×2
    for (const [x, z] of [[0.6, -118.4], [5.6, -118.4]]) { b.box('m5_toolRed', 0.9, 1.0, 0.55, [x, y + 0.58, z], { uv: false, collide: true }); for (let k = 0; k < 5; k++) b.box('steel', 0.82, 0.015, 0.02, [x, y + 0.3 + k * 0.17, z + 0.28], { uv: 1 }); for (const dx of [-0.38, 0.38]) b.add('m5_rubber', new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10), { pos: [x + dx, y + 0.05, z + 0.2], rot: [Math.PI / 2, 0, 0] }, { uv: false }); }
    for (const [x, z] of [[-3.2, -96.5], [-3.2, -98.0], [6.2, -124], [-10.4, -112.5]]) cone(b, x, y, z);
    hangingSign(za, M, '车辆整备区', 10.5, y + 4.0, -97.5, 0, 2.2); hangingSign(za, M, '外勤简报室', -12.0, y + 3.8, -95.5, Math.PI / 2, 2.0);
    P.add('wet_sign', [-4.4, y, -103.5], { h: 0.6, yaw: 0.7 });
    finish(za, b, P);
  }

  // ================= B6 驯化副本训练场 =================
  const zt = ctx.zones.training;
  if (zt) {
    const b = new Batch(), P = new Props(), y = UNDER.B6, X = 32, Z0 = -92, Z1 = -156;
    // —— 射击训练区（南端 z −140…−155）：射击台、隔板、靶位、计分牌 ——
    const LX0 = -18, LN = 8, LW = 4.5;
    b.box('dz_pil', LN * LW, 1.05, 0.7, [LX0 + LN * LW / 2, y + 0.525, -141], { uv: 0.5, collide: true }); b.box('blackMetal', LN * LW + 0.1, 0.05, 0.8, [LX0 + LN * LW / 2, y + 1.07, -141], { uv: 1 });
    for (let i = 0; i <= LN; i++) { const x = LX0 + i * LW; b.box('m5_olive', 0.08, 2.2, 1.6, [x, y + 1.1, -141.9], { uv: 1 }); b.box('steel', 0.03, 0.05, 13, [x, y + 6.2, -148], { uv: 1 }); }
    for (let i = 0; i < LN; i++) { const x = LX0 + (i + 0.5) * LW, tz = -150 - (i % 3) * 1.6;
      b.box('steel', 0.04, 0.04, 13, [x, y + 6.0, -148], { uv: 1 }); b.box('blackMetal', 0.3, 0.2, 0.3, [x, y + 5.85, tz], { uv: 1 }); b.add('steel', new THREE.CylinderGeometry(0.01, 0.01, 3.4, 4), { pos: [x, y + 4.1, tz] }, { uv: 1 });
      b.add('m5_target', new THREE.PlaneGeometry(0.75, 1.1), { pos: [x, y + 1.95, tz], rot: [0, 0, (i % 2 ? 0.03 : -0.02)] }, { uv: false });
      b.box('wood', 0.9, 0.04, 0.04, [x, y + 2.52, tz], { uv: 1 });
      const num = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), tagMaterial(String(i + 1).padStart(2, '0'))); num.position.set(x, y + 1.25, -140.62); zt.add(num);
      stencil(zt, String(i + 1), x, y, -143.2, 0, 1.4, '#d8d8d0');
      for (let k = 0; k < 6; k++) b.box('dz_bakelite', 0.012, 0.035, 0.012, [x - 0.4 + k * 0.05, y + 1.1, -141.2], { uv: false }); }
    b.box('paintR', LN * LW, 0.006, 0.18, [LX0 + LN * LW / 2, y + 0.004, -142.1], { uv: false }); stencil(zt, '射击线　严禁越线', 0, y, -142.9, 0, 4.4, '#c83020');
    b.box('wood', LN * LW + 2, 3.4, 0.6, [LX0 + LN * LW / 2, y + 1.7, -155.4], { uv: 0.4 }); for (let k = 0; k < 40; k++) b.box('m5_olive', 0.8, 0.28, 0.4, [LX0 - 1 + (k % 20) * 1.9, y + 0.14 + Math.floor(k / 20) * 0.3, -154.8], { uv: 1, rot: [0, (k % 3) * 0.05, 0] });
    hangingSign(zt, M, '射击训练区', 0, y + 6.8, -140.8, 0, 3.0);
    // —— 体能障碍区（西侧 x −31…−21, z −124…−152）——
    for (let k = 0; k < 4; k++) b.box('concrete', 2.6, 0.9 + (k % 2) * 0.5, 0.4, [-26, y + (0.9 + (k % 2) * 0.5) / 2, -127 - k * 3.2], { uv: 0.5, collide: true });
    for (let k = 0; k < 3; k++) { const z = -140 - k * 2.2; for (const dx of [-1.3, 1.3]) b.box('paintY', 0.08, 0.8, 0.08, [-26 + dx, y + 0.4, z], { uv: false }); b.box('paintW', 2.7, 0.1, 0.06, [-26, y + 0.8, z], { uv: false }); }
    { const cx = -26, cz = -149.5; for (const dx of [-1.5, 1.5]) for (const dz of [-1.2, 1.2]) b.box('steel', 0.1, 4.2, 0.1, [cx + dx, y + 2.1, cz + dz], { uv: 1 }); for (let k = 1; k < 7; k++) { b.box('steel', 3.1, 0.05, 0.05, [cx, y + k * 0.6, cz - 1.2], { uv: 1 }); b.box('steel', 3.1, 0.05, 0.05, [cx, y + k * 0.6, cz + 1.2], { uv: 1 }); } b.box('steel', 3.1, 0.06, 2.5, [cx, y + 4.2, cz], { uv: 1 }); for (let k = 0; k < 3; k++) b.add('dz_cable', new THREE.CylinderGeometry(0.025, 0.025, 4.0, 6), { pos: [cx - 0.8 + k * 0.8, y + 2.1, cz] }, { uv: false }); world.box(cx, y + 2.1, cz, 3.2, 4.2, 2.6); }
    b.box('wood', 0.2, 0.15, 6, [-29.4, y + 0.6, -137], { uv: 0.6 }); for (const z of [-134.4, -139.6]) b.box('steel', 0.1, 0.6, 0.1, [-29.4, y + 0.3, z], { uv: 1 });
    for (let k = 0; k < 6; k++) b.add('m5_rubber', new THREE.TorusGeometry(0.42, 0.16, 8, 18), { pos: [-22.3 + (k % 2) * 0.9, y + 0.16, -128 - k * 1.1], rot: [Math.PI / 2, 0, 0] }, { uv: false });
    hangingSign(zt, M, '体能训练区', -26, y + 6.2, -124, 0, 2.6);
    // —— 格斗训练区（东北软垫旁）：沙袋架 + 人形木靶 ——
    { b.box('blackMetal', 9.0, 0.14, 0.14, [22, y + 3.6, -107.2], { uv: 1 }); for (const x of [17.6, 26.4]) b.box('blackMetal', 0.14, 3.6, 0.14, [x, y + 1.8, -107.2], { uv: 1 }); for (let k = 0; k < 4; k++) { const x = 19 + k * 2; b.add('steel', new THREE.CylinderGeometry(0.01, 0.01, 0.9, 4), { pos: [x, y + 3.1, -107.2] }, { uv: 1 }); b.add('m5_bag', new THREE.CapsuleGeometry(0.2, 0.9, 6, 14), { pos: [x, y + 2.0, -107.2], rot: [0, 0, (k - 1.5) * 0.03] }, { uv: false }); b.box('gold', 0.42, 0.04, 0.42, [x, y + 2.62, -107.2], { uv: false }); world.box(x, y + 2, -107.2, 0.45, 1.4, 0.45); } }
    for (const [x, z] of [[16.5, -101], [16.5, -103.5]]) { b.add('wood', new THREE.CylinderGeometry(0.16, 0.16, 1.7, 12), { pos: [x, y + 0.95, z] }, { uv: 0.6 }); b.add('wood', new THREE.SphereGeometry(0.15, 12, 8), { pos: [x, y + 1.95, z] }, { uv: 0.6 }); for (const h of [1.2, 1.55]) b.add('wood', new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), { pos: [x, y + h, z + 0.22], rot: [Math.PI / 2, 0, 0] }, { uv: 0.6 }); b.add('blackMetal', new THREE.CylinderGeometry(0.3, 0.35, 0.1, 14), { pos: [x, y + 0.05, z] }, { uv: 1 }); world.box(x, y + 1, z, 0.4, 2, 0.4); }
    hangingSign(zt, M, '格斗训练区', 22, y + 5.0, -104, 0, 2.4);
    // —— 器械架（训练杖 / 盾）沿东墙 ——
    for (let r = 0; r < 3; r++) { const z = -112 - r * 4; b.box('blackMetal', 0.5, 2.2, 3.0, [31.5, y + 1.1, z], { uv: 1, collide: true }); for (let k = 0; k < 8; k++) b.add(k % 3 ? 'wood' : 'steel', new THREE.CylinderGeometry(0.025, 0.025, 1.9, 6), { pos: [31.15, y + 1.15, z - 1.2 + k * 0.34], rot: [0, 0, 0.08] }, { uv: 0.6 }); }
    // —— 装备箱、路锥、隔离墩、母带运输拖车 ——
    for (const [x, z, h] of [[-30.6, -106, 0], [-30.6, -106.7, 0], [-30.6, -106.35, 0.55], [30.4, -126, 0], [29.7, -126, 0], [10, -152.4, 0], [10.7, -152.4, 0]]) P.add('military_crate', [x, y + h, z], { h: 0.55, yaw: z * 0.2 });
    for (const [x, z] of [[-30.4, -110.5], [-29.6, -110.9]]) P.add('plastic_container', [x, y, z], { h: 0.6, yaw: x });
    trailer(b, P, 13, y, -98.5, -0.12); world.box(13, y + 0.7, -98.5, 2.4, 1.4, 4.6, -0.12); const tl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.3), tagMaterial('副本母带　运输中')); tl.position.set(13.0, y + 1.0, -96.1); tl.rotation.y = -0.12; zt.add(tl);
    for (const [x, z] of [[-6, -137], [-3, -137.5], [3, -137.5], [6, -137], [-14, -116], [14, -116]]) cone(b, x, y, z);
    // —— 地面：区域边线、磨损、喷字 ——
    const rectLine = (x0, x1, z0, z1, key = 'paintY') => { b.box(key, x1 - x0, 0.006, 0.12, [(x0 + x1) / 2, y + 0.004, z0], { uv: false }); b.box(key, x1 - x0, 0.006, 0.12, [(x0 + x1) / 2, y + 0.004, z1], { uv: false }); b.box(key, 0.12, 0.006, z0 - z1, [x0, y + 0.004, (z0 + z1) / 2], { uv: false }); b.box(key, 0.12, 0.006, z0 - z1, [x1, y + 0.004, (z0 + z1) / 2], { uv: false }); };
    rectLine(-31, -20.5, -123, -153); rectLine(16.6, 27.6, -98, -110); rectLine(-19, 19, -138.5, -155.5, 'paintW');
    for (let k = 0; k < 14; k++) decalAt(b, 'm5_wear', -24 + (k % 7) * 8, y, -100 - Math.floor(k / 7) * 22 - (k % 3) * 5, 6, 6, k);
    stencil(zt, '副本门区　非授权勿入', 0, y, -112.5, 0, 5.4, '#c83020'); stencil(zt, '体能', -26, y, -125.2, 0, 2.0); stencil(zt, '格斗', 22, y, -98.8, 0, 2.0);
    // —— 教官（控制塔下）——
    const ins = person(M, { coat: 0x1a1d22, cap: true }); ins.position.set(-16.6, y, -104.8); ins.rotation.y = -2.2; zt.add(ins);
    finish(zt, b, P);
  }
  await Promise.all(jobs);
}
