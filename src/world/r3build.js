// R3：按 r3plan.js 的平面规划实例化（GLB → Props/InstancedMesh，色块/隔墙 → Batch），并加碰撞盒
// 批次2：隔墙碰撞、门牌（铜牌）、挂画/海报（content 贴图 + 画框）、补光点灯、窗光、壁灯；金属件做旧、台灯/吊灯灯罩自发光
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { loadTex } from '../engine/assets.js';
import { Props } from './dress.js';
import { PLANS, R3 } from './r3plan.js';
import { UPPER } from './upper.js';
import { point, rectLight, brassPlaqueMaterial } from './interiors.js';

const ZONE_OF = { floor3_office: ['floor3', () => UPPER['3F']], floor2_liaison: ['floor2', () => UPPER['2F']], floor2_pub: ['floor2', () => UPPER['2F']], director: ['director', () => UPPER['12F']] };
// 做旧：冷轧钢/喷漆钢件压暗、偏橄榄灰、提高粗糙度（「过白过新」）
const AGE = { office_desk: [0.62, 0.64, 0.58, 0.62], file_cabinet: [0.7, 0.7, 0.64, 0.6], 'r2/mfp_office_printer': [0.8, 0.78, 0.72, 0.55], 'r2/old_radiator': [0.75, 0.72, 0.66, 0.6], 'r2/hand_truck': [0.7, 0.68, 0.62, 0.7], 'r2/steel_frame_shelves_02': [0.7, 0.7, 0.66, 0.7], 'r2/fire_extinguisher': [0.85, 0.8, 0.78, 0.5], 'r2/electrical_panel_c': [0.75, 0.75, 0.7, 0.6], monitor: [0.8, 0.78, 0.72, 0.6] };
const _aged = new Map();
function ageMat(m, k) { const key = m.uuid + k; if (_aged.has(key)) return _aged.get(key); const n = m.clone(); const a = AGE[k]; n.color.setRGB(n.color.r * a[0], n.color.g * a[1], n.color.b * a[2]); n.roughness = Math.max(n.roughness ?? 0.5, a[3]); if (n.metalness > 0.5) n.metalness = 0.75; n.envMapIntensity = Math.min(n.envMapIntensity ?? 1, 0.7); _aged.set(key, n); return n; }
function glowMat(m, name) {
  const key = m.uuid + ':glow'; if (_aged.has(key)) return _aged.get(key); let n = m;
  if (name.includes('bankers_lamp') && m.name === 'green_glass') { n = m.clone(); n.emissive = new THREE.Color(0x2c7a3c); n.emissiveIntensity = 0.9; }
  if (name.includes('ceiling_light') && /Emmision|Bulb/.test(m.name)) { n = m.clone(); n.emissive = new THREE.Color(0xffd49a); n.emissiveIntensity = 2.2; n.toneMapped = true; }
  _aged.set(key, n); return n;
}
const _tex = new Map();
const tex = (p) => { if (!_tex.has(p)) _tex.set(p, loadTex('content/' + p, { srgb: true })); return _tex.get(p); };
const FRAME = { gold: 'gold', wood: 'dz_wain2', black: 'blackMetal', cork: 'dz_wain2' };

export async function buildR3(ctx, world, MAT) {
  const jobs = [];
  for (const [id, on] of Object.entries(R3)) {
    if (!on || !ZONE_OF[id]) continue;
    const [zn, yf] = ZONE_OF[id]; const zone = ctx.zones[zn]; if (!zone) continue;
    const plan = PLANS[id](yf()); const P = new Props(), b = new Batch();
    for (const it of plan.items) {
      const yaw = it.yaw ?? 0;
      if (it.fixed) { if (it.col) world.box(it.x, it.y + it.col[1] / 2, it.z, it.col[0], it.col[1], it.col[2], yaw); continue; }
      if (it.part) { world.box(it.x, it.y + it.size[1] / 2, it.z, it.size[0], it.size[1], it.size[2], 0); continue; }
      if (it.box) { b.box(it.box, it.w, it.h, it.d, [it.x, it.y, it.z], { uv: it.box === 'glassClear' ? false : 1, rot: [0, yaw, 0] }); continue; }
      if (it.light) { if (it.win) rectLight(zone, it.c, it.i * 1.5, it.w, it.h, [it.x, it.y, it.z], it.look); else point(zone, it.c, it.i * 3, [it.x, it.y, it.z], it.d * 1.15); continue; }
      if (it.sign) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), brassPlaqueMaterial(it.sign, it.sub ? [it.sub] : [])); m.position.set(it.x, it.y, it.z); m.rotation.y = yaw; zone.add(m); continue; }
      if (it.sconce) { // 铜壁灯：底座 + 弯臂 + 灯罩（自发光）
        const n = [Math.sin(yaw), Math.cos(yaw)], o = (d) => [it.x + n[0] * d, it.z + n[1] * d];
        let [x, z] = o(0.015); b.box('dz_brassDim', 0.1, 0.2, 0.03, [x, it.y, z], { uv: 1, rot: [0, yaw, 0] });
        [x, z] = o(0.09); b.box('dz_brassDim', 0.025, 0.025, 0.16, [x, it.y + 0.02, z], { uv: 1, rot: [0, yaw, 0] });
        [x, z] = o(0.17); b.add('dz_shade', new THREE.CylinderGeometry(0.06, 0.1, 0.16, 14, 1, true), { pos: [x, it.y + 0.12, z] }, { uv: false });
        continue; }
      if (it.pic) {
        const n = [Math.sin(yaw), Math.cos(yaw)]; const t = tex(it.pic);
        const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.75, side: it.side === 2 ? THREE.DoubleSide : THREE.FrontSide });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(it.w, it.h), mat); m.position.set(it.x + n[0] * 0.012, it.y, it.z + n[1] * 0.012); m.rotation.y = yaw; zone.add(m);
        if (it.cork) b.box('dz_cork', it.cork[0], it.cork[1], 0.025, [it.x - n[0] * 0.01, it.y, it.z - n[1] * 0.01], { uv: 1, rot: [0, yaw, 0] });
        if (it.cork) b.box('dz_wain2', it.cork[0] + 0.06, it.cork[1] + 0.06, 0.02, [it.x - n[0] * 0.025, it.y, it.z - n[1] * 0.025], { uv: 1, rot: [0, yaw, 0] });
        else if (it.frame !== 'none') { b.box(FRAME[it.frame] ?? 'gold', it.w + 0.07, it.h + 0.07, 0.03, [it.x - n[0] * 0.006, it.y, it.z - n[1] * 0.006], { uv: 1, rot: [0, yaw, 0] }); }
        if (it.stand) { // 落地展架：两根黑铁立杆 + 底座
          const u = [n[1], -n[0]];
          const top = it.y + it.h / 2 + 0.05, hh = top - it.fy;
          for (const s of [-1, 1]) { const x = it.x + u[0] * s * (it.w / 2 + 0.03), z = it.z + u[1] * s * (it.w / 2 + 0.03); b.box('blackMetal', 0.03, hh, 0.03, [x, it.fy + hh / 2, z], { uv: 1 }); b.box('blackMetal', 0.06, 0.02, 0.4, [x, it.fy + 0.01, z], { uv: 1, rot: [0, yaw, 0] }); }
        }
        continue; }
      P.add(it.m, [it.x, it.y, it.z], { h: it.h, w: it.w, d: it.d, s: it.s, fit: it.fit, yaw, rx: it.rx, rz: it.rz });
      if (it.col) world.box(it.x, it.y + it.col[1] / 2, it.z, it.col[0], it.col[1], it.col[2], yaw);
    }
    b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g);
    jobs.push(P.build(zone, { shadow: true }).then((ms) => {
      for (const m of ms) {
        const nm = m.name.slice(6);
        if (nm.includes('ceiling_light') || nm.includes('smoke')) m.castShadow = false;
        if (AGE[nm]) m.material = Array.isArray(m.material) ? m.material.map((x) => ageMat(x, nm)) : ageMat(m.material, nm);
        if (nm.includes('bankers_lamp') || nm.includes('ceiling_light')) m.material = Array.isArray(m.material) ? m.material.map((x) => glowMat(x, nm)) : glowMat(m.material, nm);
      }
    }));
    ctx.r3 = ctx.r3 ?? {}; ctx.r3[id] = plan;
  }
  await Promise.all(jobs);
}
