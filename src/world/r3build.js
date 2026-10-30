// R3：按 r3plan.js 的平面规划实例化（GLB → Props/InstancedMesh，色块/隔墙 → Batch），并加碰撞盒
// 批次2：隔墙碰撞、门牌（铜牌）、挂画/海报（content 贴图 + 画框）、补光点灯、窗光、壁灯；金属件做旧、台灯/吊灯灯罩自发光
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { loadTex } from '../engine/assets.js';
import { Props } from './dress.js';
import { PLANS, R3 } from './r3plan.js';
import { UPPER } from './upper.js';
import { FLOOR } from './exterior.js';
import { point, rectLight, spot, brassPlaqueMaterial } from './interiors.js';
import { lightShaft } from '../engine/fx.js';
import { goldText } from './gothic.js';

const ZONE_OF = { library: ['library', () => UPPER['4F']], east_stair: ['east_wing', () => FLOOR], lobby_2F: ['floor2', () => UPPER['2F']], lobby_3F: ['floor3', () => UPPER['3F']], lobby_4F: ['library', () => UPPER['4F']], lobby_12F: ['director', () => UPPER['12F']], east_cloister: ['east_cloister', () => FLOOR], citizen_service: ['east_wing', () => FLOOR], floor3_office: ['floor3', () => UPPER['3F']], floor2_liaison: ['floor2', () => UPPER['2F']], floor2_pub: ['floor2', () => UPPER['2F']], director: ['director', () => UPPER['12F']], gate: ['gate', () => FLOOR], archive: ['archive', () => FLOOR], command_center: ['east_wing', () => FLOOR + 7], exam_center: ['east_wing', () => FLOOR + 7], canteen: ['canteen', () => FLOOR], b1: ['armory', () => -10], b2: ['interrogation', () => -18], archive_b1: ['archive_b1', () => FLOOR - 6], b4: ['vault_b4', () => -34], b5: ['vault_b5', () => -42], b6: ['training', () => -52], b7: ['abyss', () => -300], medical: ['floor3', () => UPPER['3F']], dorm: ['surface', () => 0.046], dorm2: ['surface', () => 4.64], interrogation: ['interrogation', () => -18], hangar: ['surface', () => 0], training: ['training', () => -52], b5_deep: ['vault_b5', () => -42], metro: ['surface', () => -3.955], memorial: ['surface', () => 0.08], s7_ops: ['seventh', () => -500], s7_wrap: ['seventh', () => -500], abyss_city: ['abyss', () => -300], abyss_exam: ['abyss', () => -300], abyss_core: ['abyss', () => -280], abyss_tide: ['abyss', () => -300], s7_entry: ['seventh', () => -500] };
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

const LATE = new Set(['b7', 's7_ops', 's7_wrap', 'abyss_city', 'abyss_exam', 'abyss_core', 'abyss_tide', 's7_entry']); // 墨渊等深层区在 buildDepths 之后才建 zone → main.js 末尾再调一次 buildR3(..., true)
export async function buildR3(ctx, world, MAT, late = false) {
  const jobs = []; ctx._r3mat = MAT;
  for (const [id, on] of Object.entries(R3)) {
    if (!on || !ZONE_OF[id]) continue;
    ctx._r3built = ctx._r3built ?? new Set(); if (ctx._r3built.has(id)) continue;
    if (!late && LATE.has(id)) continue;
    // 批次6 修：surface（宿舍/机库）、training（B6）等分区在 buildDressing 之后才建 → 第一遍找不到 zone 时留到 late 那一遍（之前这些区的 R3 陈设整批没实例化）
    const [zn, yf] = ZONE_OF[id]; const zone0 = ctx.zones[zn]; if (!zone0) { if (late) console.warn('[NB] R3 区缺 zone', id, zn); continue; }
    // 批次7：surface 组（宿舍/机库/地铁口/碑廊共用一个大组）里的 R3 陈设各自成子组，main.js setZone 按所在区只显示相关子组（降面数、少灯）
    let zone = zone0; if (zn === 'surface') { zone = new THREE.Group(); zone.name = 'r3_' + id; zone0.add(zone); ctx.r3groups = ctx.r3groups ?? {}; ctx.r3groups[id] = zone; }
    ctx._r3built.add(id);
    const plan = PLANS[id](yf()); const P = new Props(), b = new Batch();
    for (const it of plan.items) {
      const yaw = it.yaw ?? 0;
      if (it.fixed) { if (it.col) world.box(it.x, it.y + it.col[1] / 2, it.z, it.col[0], it.col[1], it.col[2], yaw); continue; }
      if (it.part) { world.box(it.x, it.y + it.size[1] / 2, it.z, it.size[0], it.size[1], it.size[2], 0); continue; }
      if (it.box) { b.box(it.box, it.w, it.h, it.d, [it.x, it.y, it.z], { uv: it.box === 'glassClear' || it.box === 'r3_glassCase' ? false : (it.uv ?? 1), rot: [0, yaw, 0] }); continue; }
      if (it.wear) { // 磨损贴花：沿长边四方连续
        const w = it.x1 - it.x0, d = it.z1 - it.z0, alongX = w > d, L = alongX ? w : d, W = alongX ? d : w;
        const g = new THREE.PlaneGeometry(W, L); g.rotateX(-Math.PI / 2); if (alongX) g.rotateY(Math.PI / 2);
        const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * L / 3); b.add('r3_wear', g, { pos: [it.x, it.y, it.z] }, { uv: false }); continue; }
      if (it.globe) { // 乳白玻璃球吊灯：铜吊杆 + 灯头 + 发光球
        const rod = it.top - it.y - it.r; b.box('dz_brassDim', 0.02, rod, 0.02, [it.x, it.y + it.r + rod / 2, it.z], { uv: 1 });
        b.add('dz_brassDim', new THREE.CylinderGeometry(0.06, 0.09, 0.08, 12), { pos: [it.x, it.y + it.r + 0.02, it.z] }, { uv: 1 });
        b.add('dz_brassDim', new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), { pos: [it.x, it.top - 0.015, it.z] }, { uv: 1 });
        b.add(it.cold ? 'dz_glowCold' : it.dim ? 'r3_globeDim' : 'r3_globe', new THREE.SphereGeometry(it.r, 18, 12), { pos: [it.x, it.y, it.z] }, { uv: false }); continue; }
      if (it.pipe) { const L = Math.abs(it.a1 - it.a0), g = new THREE.CylinderGeometry(it.r, it.r, L, 12); if (it.axis === 'x') g.rotateZ(Math.PI / 2); else g.rotateX(Math.PI / 2); b.add(it.mat, g, { pos: [it.x, it.y, it.z] }, { uv: 1 });
        for (let a = Math.min(it.a0, it.a1) + 0.4; a < Math.max(it.a0, it.a1); a += 3) { const r2 = new THREE.CylinderGeometry(it.r * 1.25, it.r * 1.25, 0.05, 12); if (it.axis === 'x') r2.rotateZ(Math.PI / 2); else r2.rotateX(Math.PI / 2); b.add(it.mat, r2, { pos: [it.axis === 'x' ? a : it.x, it.y, it.axis === 'x' ? it.z : a] }, { uv: 1 }); }
        continue; }
      if (it.stair) { const n = Math.max(2, Math.round((it.yTop - it.yBot) / 0.3)), L = it.zTop - it.zBot, rise = (it.yTop - it.yBot) / n, run = L / n;
        for (let i = 0; i < n; i++) { const h = rise * (i + 1); b.box(it.mat, it.w, h, Math.abs(run) + 0.01, [it.x, it.yBot + h / 2, it.zBot + run * (i + 0.5)], { uv: 0.6 }); }
        world.ramp([it.x, it.yBot - 0.02, it.zBot], [it.x, it.yTop, it.zTop], it.w - 0.1); continue; }
      if (it.troffer) { b.box('dz_brassDim', it.len + 0.06, 0.04, 0.34, [it.x, it.y + 0.02, it.z], { uv: 1, rot: [0, yaw, 0] }); b.box(it.cold ? 'dz_glowCold' : 'r3_globe', it.len, 0.03, 0.26, [it.x, it.y - 0.005, it.z], { uv: false, rot: [0, yaw, 0] }); continue; }
      if (it.shaft) { // 窗光柱：从窗口中心斜向室内地面
        const to = [it.x + it.nx * it.len * 0.75, it.y - 2.6, it.z + it.nz * it.len * 0.75];
        const sh = lightShaft({ from: [it.x, it.y + 0.6, it.z], to, r0: it.w * 0.45, r1: it.w * 0.9, color: 0xdfe6ff, intensity: 0.16 * it.i, shape: 'cone' }); zone.add(sh);
        if (it.spot) spot(zone, 0xe4ecff, 38 * it.i, [it.x - it.nx * 0.3, it.y + 0.8, it.z - it.nz * 0.3], to, 0.42, false, 14);
        continue; }
      if (it.light) { if (it.win) rectLight(zone, it.c, it.i * 1.5, it.w, it.h, [it.x, it.y, it.z], it.look); else point(zone, it.c, it.i * 3, [it.x, it.y, it.z], it.d * 1.15); continue; }
      if (it.disc) { b.add(it.mat, new THREE.CylinderGeometry(it.r, it.r, it.h, 24), { pos: [it.x, it.y + it.h / 2, it.z] }, { uv: 1 }); continue; } // 批次12：徽章等扁圆件
      if (it.ring) { const g = new THREE.RingGeometry(it.r0, it.r1, 128, 1); g.rotateX(-Math.PI / 2); b.add(it.mat, g, { pos: [it.x, it.y, it.z] }, { uv: it.uv ?? 0.5 }); continue; } // 批次12：圆形地面分区（藏书阁）
      if (it.rod) { const A = new THREE.Vector3(...it.a), B = new THREE.Vector3(...it.b), L = A.distanceTo(B), g = new THREE.CylinderGeometry(it.r, it.r, L, 10); g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize())); b.add(it.mat, g, { pos: it.a }, { uv: 1 }); continue; } // 批次12：任意方向圆杆（斜扶手）
      if (it.plaque) { // 批次12：铜牌（标题 + 多行文字）+ 木框底板
        const n = [Math.sin(yaw), Math.cos(yaw)]; const m = new THREE.Mesh(new THREE.PlaneGeometry(it.w, it.h), brassPlaqueMaterial(it.title, it.lines)); m.position.set(it.x + n[0] * 0.022, it.y, it.z + n[1] * 0.022); m.rotation.y = yaw; zone.add(m);
        b.box('dz_wain2', it.w + 0.08, it.h + 0.08, 0.03, [it.x + n[0] * 0.006, it.y, it.z + n[1] * 0.006], { uv: 1, rot: [0, yaw, 0] }); continue; }
      if (it.hang) { // 批次12：吊牌（黑铁底板 + 双面金字 + 两根铜吊杆到顶棚）
        const n = [Math.sin(yaw), Math.cos(yaw)], u = [n[1], -n[0]];
        b.box('blackMetal', it.w, it.h, 0.04, [it.x, it.y, it.z], { uv: 1, rot: [0, yaw, 0] });
        b.box('dz_brassDim', it.w + 0.04, 0.025, 0.05, [it.x, it.y + it.h / 2, it.z], { uv: 1, rot: [0, yaw, 0] }); b.box('dz_brassDim', it.w + 0.04, 0.025, 0.05, [it.x, it.y - it.h / 2, it.z], { uv: 1, rot: [0, yaw, 0] });
        const rod = (it.top ?? it.y + 2) - (it.y + it.h / 2); for (const s of [-1, 1]) b.box('dz_brassDim', 0.015, rod, 0.015, [it.x + u[0] * s * it.w * 0.38, it.y + it.h / 2 + rod / 2, it.z + u[1] * s * it.w * 0.38], { uv: 1 });
        const gm = MAT.goldBright ?? MAT.gold; for (const s of [1, -1]) { const t = goldText(it.text, it.w * 0.86, it.h * 0.62, gm, { res: 192, stroke: 0.03 }); t.position.set(it.x + n[0] * s * 0.022, it.y, it.z + n[1] * s * 0.022); t.rotation.y = yaw + (s < 0 ? Math.PI : 0); zone.add(t); }
        continue; }
      if (it.led) { // 批次13：叫号 LED 显示屏（黑铁壳 + 自发光点阵字），stand 时带落地立杆底座
        const n = [Math.sin(yaw), Math.cos(yaw)], u = [n[1], -n[0]];
        b.box('blackMetal', it.w + 0.08, it.h + 0.08, 0.08, [it.x - n[0] * 0.04, it.y, it.z - n[1] * 0.04], { uv: 1, rot: [0, yaw, 0] });
        b.box('dz_brassDim', it.w + 0.1, 0.02, 0.09, [it.x - n[0] * 0.04, it.y + it.h / 2 + 0.05, it.z - n[1] * 0.04], { uv: 1, rot: [0, yaw, 0] });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(it.w, it.h), ledMat(it.title, it.rows, it.w / it.h)); m.position.set(it.x + n[0] * 0.002, it.y, it.z + n[1] * 0.002); m.rotation.y = yaw; zone.add(m);
        if (it.stand) { const bot = it.y - it.h / 2 - 0.04, hh = bot - it.fy;
          for (const s of [-1, 1]) { const x = it.x + u[0] * s * it.w * 0.36 - n[0] * 0.04, z = it.z + u[1] * s * it.w * 0.36 - n[1] * 0.04; b.box('blackMetal', 0.05, hh, 0.05, [x, it.fy + hh / 2, z], { uv: 1 }); b.box('blackMetal', 0.08, 0.03, 0.5, [x, it.fy + 0.015, z], { uv: 1, rot: [0, yaw, 0] }); } }
        continue; }
      if (it.notice) { // 批次15：告示纸（Canvas 印刷字 + 红头 + 公章），替代白色纸块
        const m = new THREE.Mesh(new THREE.PlaneGeometry(it.w, it.h), noticeMat(it.notice, it.lines ?? [], it.red)); m.position.set(it.x, it.y, it.z); m.rotation.y = yaw; zone.add(m); continue; }
      if (it.wtext) { // 批次15：墙面铜字（黑石底板 + 铜边 + 金字）
        const n = [Math.sin(yaw), Math.cos(yaw)];
        b.box('stoneDark', it.w + 0.2, it.h + 0.16, 0.05, [it.x, it.y, it.z], { uv: 0.5, rot: [0, yaw, 0] });
        b.box('dz_brassDim', it.w + 0.26, it.h + 0.22, 0.03, [it.x - n[0] * 0.012, it.y, it.z - n[1] * 0.012], { uv: 1, rot: [0, yaw, 0] });
        const t = goldText(it.wtext, it.w, it.h, MAT.goldBright ?? MAT.gold, { res: 256, stroke: 0.03 }); t.position.set(it.x + n[0] * 0.03, it.y, it.z + n[1] * 0.03); t.rotation.y = yaw; zone.add(t); continue; }
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
        if (nm.includes('18th_century_bench')) { const tint = (x) => { const c = x.clone(); c.color = new THREE.Color(0x5a3f30); return c; }; m.material = Array.isArray(m.material) ? m.material.map(tint) : tint(m.material); } // 批次13：歌剧院长凳粉色绒面 + 白漆框 → 压成深胡桃木 + 暗酒红
        if (AGE[nm]) m.material = Array.isArray(m.material) ? m.material.map((x) => ageMat(x, nm)) : ageMat(m.material, nm);
        if (nm.includes('bankers_lamp') || nm.includes('ceiling_light')) m.material = Array.isArray(m.material) ? m.material.map((x) => glowMat(x, nm)) : glowMat(m.material, nm);
      }
    }));
    ctx.r3 = ctx.r3 ?? {}; ctx.r3[id] = plan;
  }
  await Promise.all(jobs);
}

/** 叫号 LED 屏贴图：深色底 + 琥珀标题 + 红色号码 / 绿色窗口（每行「号码  →  窗口」） */
function ledMat(title, rows = [], aspect = 2) {
  const W = 768, H = Math.round(W / aspect); const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  c.fillStyle = '#050505'; c.fillRect(0, 0, W, H); const F = '"NB Serif","Noto Serif SC",serif', n = rows.length + 1, rh = H / (n + 0.3);
  c.textBaseline = 'middle'; c.fillStyle = '#ffb648'; c.font = `700 ${Math.round(rh * 0.62)}px ${F}`; c.textAlign = 'center'; c.fillText(title ?? '', W / 2, rh * 0.62);
  c.fillStyle = '#3a2a10'; c.fillRect(W * 0.04, rh * 1.18, W * 0.92, 3);
  rows.forEach((r, i) => { const yy = rh * (i + 1.75); const [a, b2] = String(r).split('|'); c.font = `700 ${Math.round(rh * 0.6)}px ${F}`;
    c.textAlign = 'left'; c.fillStyle = '#ff3b24'; c.fillText(a ?? '', W * 0.07, yy); c.textAlign = 'right'; c.fillStyle = '#5cff7c'; c.fillText(b2 ?? '', W * 0.93, yy); });
  // 点阵网格感：细暗线
  c.globalAlpha = 0.35; c.fillStyle = '#000'; for (let x = 0; x < W; x += 4) c.fillRect(x, 0, 1, H); for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.25, roughness: 0.35 });
}

// 批次15：告示纸材质（米黄纸 + 红头标题 + 正文行 + 落款 + 红色公章）
const _notice = new Map();
function noticeMat(title, lines, red) {
  const key = title + '|' + lines.join('/'); if (_notice.has(key)) return _notice.get(key);
  const w = 360, h = 480, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d');
  const g = c.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 320); g.addColorStop(0, '#ece4cc'); g.addColorStop(1, '#cfc3a2'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.textAlign = 'center'; c.fillStyle = red ? '#9c1c16' : '#1d1a16'; c.font = '700 34px "NB Title","NB Serif",serif'; c.fillText(title, w / 2, 62);
  if (red) { c.fillStyle = '#9c1c16'; c.fillRect(28, 82, w - 56, 3); }
  c.textAlign = 'left'; c.fillStyle = '#2a2620'; c.font = '19px "NB Serif",serif';
  let y = 122; for (const l of lines) { for (let i = 0; i < l.length; i += 15) { c.fillText((i ? '' : '　　') + l.slice(i, i + 15), 30, y); y += 30; if (y > h - 90) break; } y += 4; }
  c.textAlign = 'right'; c.font = '17px "NB Serif",serif'; c.fillText('叙事管理局 · 阅卷中心', w - 30, h - 52); c.fillText('一九七七年十二月', w - 30, h - 28);
  c.strokeStyle = 'rgba(176,30,24,0.82)'; c.lineWidth = 4; c.beginPath(); c.arc(w - 92, h - 52, 40, 0, Math.PI * 2); c.stroke(); c.fillStyle = 'rgba(176,30,24,0.82)'; c.font = '28px serif'; c.textAlign = 'center'; c.fillText('★', w - 92, h - 42);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }); _notice.set(key, m); return m;
}
