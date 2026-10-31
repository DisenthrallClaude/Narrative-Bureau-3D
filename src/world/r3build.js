// R3：按 r3plan.js 的平面规划实例化（GLB → Props/InstancedMesh，色块/隔墙 → Batch），并加碰撞盒
// 批次2：隔墙碰撞、门牌（铜牌）、挂画/海报（content 贴图 + 画框）、补光点灯、窗光、壁灯；金属件做旧、台灯/吊灯灯罩自发光
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { loadTex, SCR_ZONE } from '../engine/assets.js';
import { Props } from './dress.js';
import { PLANS, R3 } from './r3plan.js';
import { UPPER } from './upper.js';
import { FLOOR } from './exterior.js';
import { point, rectLight, spot, brassPlaqueMaterial, brassPlateMaterial } from './interiors.js';
import { lightShaft } from '../engine/fx.js';
import { goldText } from './gothic.js';

const ZONE_OF = { plaza: ['surface', () => 0], security_hall: ['security_hall', () => FLOOR], library: ['library', () => UPPER['4F']], east_stair: ['east_wing', () => FLOOR], lobby_2F: ['floor2', () => UPPER['2F']], lobby_3F: ['floor3', () => UPPER['3F']], lobby_4F: ['library', () => UPPER['4F']], lobby_12F: ['director', () => UPPER['12F']], east_cloister: ['east_cloister', () => FLOOR], citizen_service: ['east_wing', () => FLOOR], floor3_office: ['floor3', () => UPPER['3F']], floor2_liaison: ['floor2', () => UPPER['2F']], floor2_pub: ['floor2', () => UPPER['2F']], director: ['director', () => UPPER['12F']], gate: ['gate', () => FLOOR], archive: ['archive', () => FLOOR], command_center: ['east_wing', () => FLOOR + 7], exam_center: ['east_wing', () => FLOOR + 7], lab3: ['floor3', () => UPPER['3F']], zone_control: ['east_wing', () => FLOOR + 14], east_ante: ['east_wing', () => FLOOR + 14], east_ante2: ['east_wing', () => FLOOR + 7], helipad_roof: ['surface', () => 12.4], canteen: ['canteen', () => FLOOR], b1: ['armory', () => -10], b2: ['interrogation', () => -18], archive_b1: ['archive_b1', () => FLOOR - 6], vault_b3: ['vault_b3', () => -26], blobby_b1: ['armory', () => -10], blobby_b2: ['interrogation', () => -18], blobby_b6: ['training', () => -52], spine_b3: ['vault_b3', () => -26], spine_b4: ['vault_b4', () => -34], spine_b5: ['vault_b5', () => -42], b4: ['vault_b4', () => -34], b5: ['vault_b5', () => -42], b6: ['training', () => -52], b7: ['abyss', () => -300], medical: ['floor3', () => UPPER['3F']], dorm: ['surface', () => 0.046], dorm2: ['surface', () => 4.64], dorm3: ['surface', () => 9.24], interrogation: ['interrogation', () => -18], hangar: ['surface', () => 0], training: ['training', () => -52], b5_deep: ['vault_b5', () => -42], metro: ['surface', () => -3.955], memorial: ['surface', () => 0.08], s7_ops: ['seventh', () => -500], s7_wrap: ['seventh', () => -500], abyss_city: ['abyss', () => -300], abyss_exam: ['abyss', () => -300], abyss_core: ['abyss', () => -280], abyss_tide: ['abyss', () => -300], s7_entry: ['seventh', () => -500] };
// 做旧：冷轧钢/喷漆钢件压暗、偏橄榄灰、提高粗糙度（「过白过新」）
const AGE = { 'r2/schooldesk_01': [0.6, 0.5, 0.42, 0.62], office_desk: [0.62, 0.64, 0.58, 0.62], file_cabinet: [0.7, 0.7, 0.64, 0.6], 'r2/mfp_office_printer': [0.8, 0.78, 0.72, 0.55], 'r2/old_radiator': [0.75, 0.72, 0.66, 0.6], 'r2/hand_truck': [0.7, 0.68, 0.62, 0.7], 'r2/steel_frame_shelves_02': [0.7, 0.7, 0.66, 0.7], 'r2/fire_extinguisher': [0.85, 0.8, 0.78, 0.5], 'r2/electrical_panel_c': [0.75, 0.75, 0.7, 0.6], monitor: [0.8, 0.78, 0.72, 0.6] };
const _aged = new Map();
function ageMat(m, k) { const key = m.uuid + k; if (_aged.has(key)) return _aged.get(key); const n = m.clone(); const a = AGE[k]; n.color.setRGB(n.color.r * a[0], n.color.g * a[1], n.color.b * a[2]); n.roughness = Math.max(n.roughness ?? 0.5, a[3]); if (n.metalness > 0.5) n.metalness = 0.75; n.envMapIntensity = Math.min(n.envMapIntensity ?? 1, 0.7); _aged.set(key, n); return n; }
function glowMat(m, name) {
  const key = m.uuid + ':glow'; if (_aged.has(key)) return _aged.get(key); let n = m;
  if (name.includes('bankers_lamp') && m.name === 'green_glass') { n = m.clone(); n.map = null; n.color = new THREE.Color(0x7a4614); n.emissive = new THREE.Color(0xc0701e); n.emissiveIntensity = 0.75; } // 批次59：绿玻璃罩紧挨红按钮 / 酒红地毯（cc_r3_c 红配绿）→ 琥珀玻璃罩
  if (name.includes('kerosene') && /BlueGlass|Real_Glass/.test(m.name)) { n = m.clone(); n.map = null; n.color = new THREE.Color(m.name === 'BlueGlass' ? 0x8a5420 : 0x6a5040); n.roughness = 0.15; }
  if (name.includes('vintage_oil_lamp') && m.name === 'vintage_oil_lamp_glass') { n = m.clone(); n.color = new THREE.Color(0xb07a3a); } // M3：灯罩压琥珀（防冷蓝透射） // 煤油灯蓝玻璃 / 冷透明罩 → 琥珀 / 烟褐
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
    const plan = PLANS[id](yf()); const P = new Props(), b = new Batch(); P.scr = SCR_ZONE(id); /* 批次57：屏幕内容按区域功能 */
    for (const it of plan.items) {
      const yaw = it.yaw ?? 0;
      if (it.fixed) { if (it.col) world.box(it.x, it.y + it.col[1] / 2, it.z, it.col[0], it.col[1], it.col[2], yaw); continue; }
      if (it.part) { world.box(it.x, it.y + it.size[1] / 2, it.z, it.size[0], it.size[1], it.size[2], 0); continue; }
      if (it.anchor) { ctx.anchors = ctx.anchors ?? {}; ctx.anchors[it.anchor] = { box: [it.x, it.y, it.z, Math.max(it.w ?? 0.3, 0.35), Math.max(it.h ?? 0.2, 0.25), Math.max(it.d ?? 0.3, 0.35)] }; } // 批次22：plan 件可登记剧情锚点（binder 接成 manifest 文档热点）
      if (it.box) { b.box(it.box, it.w, it.h, it.d, [it.x, it.y, it.z], { uv: it.box === 'glassClear' || it.box === 'r3_glassCase' ? false : (it.uv ?? 1), uvOff: it.uvOff, rot: [0, yaw, 0] }); continue; }
      if (it.cyl) { b.add(it.mat, new THREE.CylinderGeometry(it.r, it.r, it.h, 18), { pos: [it.x, it.y, it.z] }, { uv: 1 }); continue; } // 批次23：圆柱件（灭火器 / 垃圾桶），y 为中心
      if (it.wear) { // 磨损贴花：沿长边四方连续
        const w = it.x1 - it.x0, d = it.z1 - it.z0, alongX = w > d, L = alongX ? w : d, W = alongX ? d : w;
        const g = new THREE.PlaneGeometry(W, L); g.rotateX(-Math.PI / 2); if (alongX) g.rotateY(Math.PI / 2);
        const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * L / 3); b.add('r3_wear', g, { pos: [it.x, it.y, it.z] }, { uv: false }); continue; }
      if (it.globe) { // 乳白玻璃球吊灯：铜吊杆 + 灯头 + 发光球
        const rod = it.top - it.y - it.r; b.box('dz_brassDim', 0.02, rod, 0.02, [it.x, it.y + it.r + rod / 2, it.z], { uv: 1 });
        b.add('dz_brassDim', new THREE.CylinderGeometry(0.06, 0.09, 0.08, 12), { pos: [it.x, it.y + it.r + 0.02, it.z] }, { uv: 1 });
        b.add('dz_brassDim', new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), { pos: [it.x, it.top - 0.015, it.z] }, { uv: 1 });
        if (it.amber) b.add('dz_brassDim', new THREE.SphereGeometry(it.r * 1.12, 18, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), { pos: [it.x, it.y + it.r * 0.12, it.z] }, { uv: 1 }); // 批次 M9：铜罩
        b.add(it.cold ? 'dz_glowCold' : it.amber ? 'r3_globeAmber' : it.dim ? 'r3_globeDim' : 'r3_globe', new THREE.SphereGeometry(it.r, 18, 12), { pos: [it.x, it.y, it.z] }, { uv: false }); continue; }
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
      if (it.chalk) { // 批次17：黑板（胡桃木框 + 墨绿板面 Canvas：化学式、反应式、粉笔擦痕、值日栏）
        const n = [Math.sin(yaw), Math.cos(yaw)]; b.box('wood', it.w + 0.12, it.h + 0.12, 0.05, [it.x + n[0] * 0.025, it.y, it.z + n[1] * 0.025], { uv: 0.6, rot: [0, yaw, 0] });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(it.w, it.h), chalkMat(it.w / it.h)); m.position.set(it.x + n[0] * 0.052, it.y, it.z + n[1] * 0.052); m.rotation.y = yaw; zone.add(m); continue; }
      if (it.examPaper) { // 批次16：桌面试卷（Canvas 印刷字：红头标题、密封线、题号、横线作答区；70 张共用一张贴图），平放
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.297), examPaperMat()); m.rotation.order = 'YXZ'; m.rotation.set(-Math.PI / 2, yaw, 0); m.position.set(it.x, it.y, it.z); m.receiveShadow = true; zone.add(m); continue; }
      if (it.clock) { // 批次16：机关挂钟（铜框 + 象牙白表盘 + 黑罗马数字 + 黑指针 + 玻璃罩），面朝 yaw 法线
        const n = [Math.sin(yaw), Math.cos(yaw)], r = it.r, P = (d) => [it.x + n[0] * d, it.y, it.z + n[1] * d];
        const ring = new THREE.TorusGeometry(r + 0.03, 0.045, 12, 64); ring.rotateY(yaw); b.add('brass', ring, { pos: P(0.06) }, { uv: 1 });
        const back = new THREE.CylinderGeometry(r + 0.05, r + 0.05, 0.08, 64); back.rotateX(Math.PI / 2); back.rotateY(yaw); b.add('dz_wain', back, { pos: P(0.0) }, { uv: 1 });
        const face = new THREE.Mesh(new THREE.CircleGeometry(r, 64), clockMat()); face.position.set(...P(0.045)); face.rotation.y = yaw; zone.add(face);
        const gl = new THREE.Mesh(new THREE.CircleGeometry(r + 0.01, 48), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.12, envMapIntensity: 0.8, depthWrite: false })); gl.position.set(...P(0.075)); gl.rotation.y = yaw; zone.add(gl);
        continue; }
      if (it.flip) { // 批次16：机械翻牌倒计时牌（胡桃木箱 + 铜框 + 黑底白字翻牌，Canvas 一张）
        const n = [Math.sin(yaw), Math.cos(yaw)];
        b.box('dz_wain', it.w + 0.16, it.h + 0.16, 0.12, [it.x + n[0] * 0.06, it.y, it.z + n[1] * 0.06], { uv: 1, rot: [0, yaw, 0] });
        b.box('dz_brassDim', it.w + 0.06, it.h + 0.06, 0.02, [it.x + n[0] * 0.125, it.y, it.z + n[1] * 0.125], { uv: 1, rot: [0, yaw, 0] });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(it.w, it.h), flipMat(it.flip, it.days, it.w / it.h)); m.position.set(it.x + n[0] * 0.137, it.y, it.z + n[1] * 0.137); m.rotation.y = yaw; zone.add(m); continue; }
      if (it.console) { // 批次16：1960–80 年代监控台（喷漆钢柜 + 斜面按键板 + 上部 CRT 屏架 + 木质写字沿），面朝 yaw 法线（操作员一侧）
        const n = [Math.sin(yaw), Math.cos(yaw)], P = (f, up) => [it.x + n[0] * f, it.y + up, it.z + n[1] * f];
        const G = (w, h, d, rx = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); g.rotateY(yaw); return g; };
        b.add('r3_consoleSteel', G(it.w, 0.7, 0.8), { pos: P(0, 0.35) }, { uv: 1 });
        b.add('dz_base', G(it.w + 0.02, 0.08, 0.82), { pos: P(0, 0.04) }, { uv: 1 });
        b.add('r3_consoleSteel', G(it.w, 0.06, 0.5, 0.42), { pos: P(0.1, 0.8) }, { uv: 1 }); // 斜面按键板
        const kp = new THREE.Mesh(new THREE.PlaneGeometry(it.w - 0.08, 0.44), keypadMat(it.seed ?? 0)); kp.rotation.order = 'YXZ'; kp.rotation.set(-(Math.PI / 2 - 0.42), yaw, 0); kp.position.set(...P(0.1 + 0.032 * Math.sin(0.42), 0.8 + 0.032 * Math.cos(0.42))); zone.add(kp);
        b.add('dz_wain', G(it.w + 0.04, 0.04, 0.26), { pos: P(0.52, 0.74) }, { uv: 1 }); // 木写字沿
        b.add('r3_consoleSteel', G(it.w, 0.72, 0.42), { pos: P(-0.2, 1.22) }, { uv: 1 }); // 屏架
        b.add('blackMetal', G(it.w + 0.03, 0.04, 0.45), { pos: P(-0.2, 1.6) }, { uv: 1 });
        const nS = it.n ?? 2, sw = (it.w - 0.2) / nS;
        for (let k = 0; k < nS; k++) { const off = -it.w / 2 + 0.1 + sw * (k + 0.5), ux = n[1] * off, uz = -n[0] * off;
          const sm = new THREE.Mesh(new THREE.PlaneGeometry(sw - 0.08, 0.56), crtMat((it.seed ?? 0) * 7 + k)); sm.position.set(it.x + ux + n[0] * 0.016, it.y + 1.22, it.z + uz + n[1] * 0.016); sm.rotation.y = yaw; zone.add(sm); }
        if (it.col !== false) world.box(it.x, it.y + 0.8, it.z, Math.abs(n[1]) > 0.5 ? it.w : 0.9, 1.6, Math.abs(n[1]) > 0.5 ? 0.9 : it.w, 0);
        continue; }
      if (it.mapwall) { // 批次16：整面区域地图 / 灯光标示板（胡桃木框 + 铜边 + Canvas 地图，指示灯自发光）
        const n = [Math.sin(yaw), Math.cos(yaw)];
        b.box('dz_wain', it.w + 0.2, it.h + 0.2, 0.08, [it.x + n[0] * 0.04, it.y, it.z + n[1] * 0.04], { uv: 1, rot: [0, yaw, 0] });
        b.box('dz_brassDim', it.w + 0.06, it.h + 0.06, 0.02, [it.x + n[0] * 0.085, it.y, it.z + n[1] * 0.085], { uv: 1, rot: [0, yaw, 0] });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(it.w, it.h), mapWallMat(it.mapwall, it.w / it.h, it.seed ?? 1)); m.position.set(it.x + n[0] * 0.097, it.y, it.z + n[1] * 0.097); m.rotation.y = yaw; zone.add(m); continue; }
      if (it.notice) { // 批次15：告示纸（Canvas 印刷字 + 红头 + 公章），替代白色纸块
        const m = new THREE.Mesh(new THREE.PlaneGeometry(it.w, it.h), noticeMat(it.notice, it.lines ?? [], it.red)); m.position.set(it.x, it.y, it.z); m.rotation.y = yaw; zone.add(m); continue; }
      if (it.wtext) { // 批次15：墙面铜字（黑石底板 + 铜边 + 金字）
        const n = [Math.sin(yaw), Math.cos(yaw)];
        b.box('stoneDark', it.w + 0.2, it.h + 0.16, 0.05, [it.x, it.y, it.z], { uv: 0.5, rot: [0, yaw, 0] });
        b.box('dz_brassDim', it.w + 0.26, it.h + 0.22, 0.03, [it.x - n[0] * 0.012, it.y, it.z - n[1] * 0.012], { uv: 1, rot: [0, yaw, 0] });
        const t = goldText(it.wtext, it.w, it.h, MAT.goldBright ?? MAT.gold, { res: 256, stroke: 0.03 }); t.position.set(it.x + n[0] * 0.03, it.y, it.z + n[1] * 0.03); t.rotation.y = yaw; zone.add(t); continue; }
      if (it.sign) { const [pw, ph] = it.size || [0.34, 0.12]; const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), brassPlateMaterial(it.sign, it.sub || '', pw, ph)); /* 批次37：横版画布铜牌 */ m.position.set(it.x, it.y, it.z); m.rotation.y = yaw; zone.add(m); continue; }
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
        if (it.flat) { m.position.set(it.x, it.y, it.z); m.rotation.order = 'YXZ'; m.rotation.set(-Math.PI / 2, yaw, 0); m.receiveShadow = true; continue; } // 批次35：平铺在桌面（地图台全景照）
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
        if (nm === 'r2/metal_stool_01') { const re = (x) => { const c = x.clone(); c.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n{ vec3 q = diffuseColor.rgb; float rr = q.r - max(q.g, q.b); if (rr > 0.06) { float l = dot(q, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = mix(q, vec3(0.30, 0.19, 0.115) * (0.55 + l * 2.4), smoothstep(0.06, 0.16, rr)); } }'); }; c.customProgramCacheKey = () => 'stoolBrown'; return c; }; m.material = Array.isArray(m.material) ? m.material.map(re) : re(m.material); } // 批次57：高脚凳红面 → 棕皮（只换偏红像素，铁腿不动）
        if (AGE[nm]) m.material = Array.isArray(m.material) ? m.material.map((x) => ageMat(x, nm)) : ageMat(m.material, nm);
        if (nm.includes('bankers_lamp') || nm.includes('ceiling_light') || nm.includes('kerosene') || nm.includes('vintage_oil_lamp')) m.material = Array.isArray(m.material) ? m.material.map((x) => glowMat(x, nm)) : glowMat(m.material, nm);
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
const _cv = new Map();
function cvMat(key, W, H, draw, emi = 0) { if (_cv.has(key)) return _cv.get(key); const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); draw(c, W, H);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, emissive: emi ? 0xffffff : 0x000000, emissiveMap: emi ? t : null, emissiveIntensity: emi }); _cv.set(key, m); return m; }
const rnd = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
function keypadMat(seed) { return cvMat('kp' + (seed % 4), 512, 96, (c, W, H) => { const r = rnd(seed % 4 + 3); c.fillStyle = '#4a5246'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) for (let j = 0; j < 3; j++) { const x = 14 + i * 19, y = 18 + j * 26, v = r();
    if (j === 0) { c.fillStyle = v < 0.25 ? '#e0402a' : v < 0.45 ? '#e8b030' : v < 0.6 ? '#4ec060' : '#2a2e2a'; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); }
    else { c.fillStyle = j === 1 ? '#d8d2c0' : '#1a1a1a'; c.fillRect(x - 6, y - 7, 12, 14); c.fillStyle = '#000'; c.fillRect(x - 6, y + 5, 12, 2); } }
  c.fillStyle = '#d8d2c0'; c.font = '12px "NB Serif",serif'; c.fillText('通 道 选 择', 8, H - 6); }, 0.35); }
function crtMat(seed) { const k = seed % 6; return cvMat('crt' + k, 320, 240, (c, W, H) => { const r = rnd(k + 11); c.fillStyle = '#0c0d0c'; c.fillRect(0, 0, W, H);
  c.save(); c.beginPath(); const R = 34; c.moveTo(18 + R, 14); c.arcTo(W - 18, 14, W - 18, H - 14, R); c.arcTo(W - 18, H - 14, 18, H - 14, R); c.arcTo(18, H - 14, 18, 14, R); c.arcTo(18, 14, W - 18, 14, R); c.clip();
  const amber = k % 3 === 2, base = amber ? [255, 170, 60] : [150, 235, 170]; const g = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.62); g.addColorStop(0, `rgba(${base.map((v) => v * 0.28 | 0)},1)`); g.addColorStop(1, '#030503'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = `rgba(${base},0.55)`; c.lineWidth = 2; // 走廊监控画面（透视线框）
  if (k % 2 === 0) { const vx = W / 2 + (r() - 0.5) * 60, vy = H * 0.45; for (const [x, y] of [[18, 14], [W - 18, 14], [18, H - 14], [W - 18, H - 14]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(vx, vy); c.stroke(); } c.strokeRect(vx - 40, vy - 30, 80, 60); for (let i = 1; i < 5; i++) { const t = i / 5; c.beginPath(); c.moveTo(18 + (vx - 40 - 18) * t, H - 14 + (vy + 30 - H + 14) * t); c.lineTo(W - 18 + (vx + 40 - W + 18) * t, H - 14 + (vy + 30 - H + 14) * t); c.stroke(); } }
  else if (k === 1 || k === 3) { c.font = '15px monospace'; c.fillStyle = `rgba(${base},0.9)`; const L = k === 1 ? ['21:00 交接班 在岗6人', '21:37 东廊03 画面抖动 报修', '22:05 B5 读数0.82 正常', '22:40 档案馆北门 巡查正常', '23:02 收外勤简报2份'] : ['ZCZC 0417 BJ 急', '读数回落 已撤离市民2名', '旧书店现场封存完毕', '请派车接收证物', 'NNNN  回执0416已签']; L.forEach((t, i) => c.fillText(t, 30, 74 + i * 30)); c.fillText(k === 1 ? '值班日志' : '电报 TLX-07', W - 130, H - 26); } // 批次57：指挥中心台屏加值班日志 / 电报
  else { c.beginPath(); for (let x = 20; x < W - 20; x += 4) c.lineTo(x, H * 0.55 + Math.sin(x * 0.05 + k) * 30 * r()); c.stroke(); for (let y = 40; y < H - 20; y += 30) { c.globalAlpha = 0.25; c.beginPath(); c.moveTo(20, y); c.lineTo(W - 20, y); c.stroke(); c.globalAlpha = 1; } }
  c.fillStyle = `rgba(${base},0.9)`; c.font = '700 18px monospace'; c.fillText(['3F-07', 'B2-11', '东廊-03', '广场-01', 'B5-02', '机库-04'][k], 30, 38); if (k !== 1 && k !== 3) c.fillText('●REC', W - 90, 38);
  for (let y = 0; y < H; y += 3) { c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(0, y, W, 1); } c.restore();
  c.strokeStyle = '#2a2b28'; c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10); }, 0.9); }
function mapWallMat(title, aspect, seed) { return cvMat('map' + seed, 1536, Math.round(1536 / aspect), (c, W, H) => { const r = rnd(seed * 31 + 5);
  c.fillStyle = '#1d2a24'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(160,190,170,0.12)'; c.lineWidth = 1; for (let x = 0; x < W; x += 48) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.fillStyle = '#e8dcbc'; c.font = '700 54px "NB Title","NB Serif",serif'; c.textAlign = 'left'; c.fillText(title, 40, 74); c.font = '24px "NB Serif",serif'; c.fillStyle = '#b8b098'; c.fillText('京 城 · 叙 事 污 染 区 域 分 布　（ 一 九 七 九 年 版 ）', 40, 112);
  // 区块（不规则多边形）+ 河道 + 环路
  c.strokeStyle = '#6e8a76'; c.lineWidth = 3; const cx = W * 0.52, cy = H * 0.58; for (const R of [0.16, 0.28, 0.4]) { c.beginPath(); c.ellipse(cx, cy, W * R, H * R * 1.15, 0, 0, 7); c.stroke(); }
  c.strokeStyle = '#3e6a8a'; c.lineWidth = 7; c.beginPath(); c.moveTo(0, H * 0.82); for (let x = 0; x <= W; x += 40) c.lineTo(x, H * 0.82 - Math.sin(x / 210) * 60 - x * 0.12); c.stroke();
  const pts = []; for (let i = 0; i < 22; i++) { const a = r() * 6.28, d = 0.08 + r() * 0.36; pts.push([cx + Math.cos(a) * W * d, cy + Math.sin(a) * H * d * 1.1]); }
  c.lineWidth = 2; for (const [x, y] of pts) { c.strokeStyle = 'rgba(232,220,188,0.55)'; c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + r() * 0.5, d = 40 + r() * 50; k ? c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d) : c.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } c.closePath(); c.stroke(); }
  pts.forEach(([x, y], i) => { const v = r(), col = v < 0.2 ? '#ff3a24' : v < 0.45 ? '#ffb030' : '#5cff7a'; const gg = c.createRadialGradient(x, y, 2, x, y, 26); gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.beginPath(); c.arc(x, y, 26, 0, 7); c.fill(); c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill();
    c.fillStyle = '#d8ccb0'; c.font = '20px "NB Serif",serif'; c.fillText(`${'甲乙丙丁戊己庚辛'[i % 8]}-${(i * 7) % 30 + 1}`, x + 14, y - 12); });
  c.font = '22px "NB Serif",serif'; [['#ff3a24', '封锁'], ['#ffb030', '警戒'], ['#5cff7a', '正常']].forEach(([col, t], i) => { c.fillStyle = col; c.beginPath(); c.arc(W - 220, H - 120 + i * 34, 9, 0, 7); c.fill(); c.fillStyle = '#e8dcbc'; c.fillText(t, W - 200, H - 112 + i * 34); });
}, 0.5); }
let _exam = null;
let _chalk = null;
function chalkMat(asp) { // 批次17：实验室黑板
  if (_chalk) return _chalk; const h = 400, w = Math.round(h * asp), cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d');
  c.fillStyle = '#23352b'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(220,230,220,${0.03 + (i % 4) * 0.012})`; c.beginPath(); c.ellipse(80 + i * 87 % (w - 100), 90 + (i * 53) % 240, 120, 34, (i % 5) * 0.2, 0, Math.PI * 2); c.fill(); } // 擦痕（定点）
  c.fillStyle = '#e8eadf'; c.font = '700 30px "NB Serif",serif'; c.fillText('滴定分析　第三次实验', 40, 56);
  c.font = '26px "Times New Roman",serif'; const L = ['NaOH + HCl → NaCl + H₂O', 'c(NaOH) = 0.1000 mol/L', 'V₁ = 24.36 mL　V₂ = 24.41 mL', '2KMnO₄ + 5H₂C₂O₄ + 3H₂SO₄ →', '　K₂SO₄ + 2MnSO₄ + 10CO₂↑ + 8H₂O'];
  L.forEach((t, i) => c.fillText(t, 50, 112 + i * 44));
  c.font = '24px "NB Serif",serif'; c.fillText('注意：', w - 380, 112); ['① 读数平视凹液面', '② 终点微红半分钟不褪', '③ 平行测定三次'].forEach((t, i) => c.fillText(t, w - 380, 150 + i * 38));
  c.strokeStyle = 'rgba(232,234,223,0.8)'; c.lineWidth = 2; c.strokeRect(w - 220, h - 92, 190, 66); c.font = '20px "NB Serif",serif'; c.fillText('值日：王　李', w - 205, h - 52);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; _chalk = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); return _chalk;
}
function examPaperMat() { // 试卷：米白纸 + 黑色印刷正文 + 红头 + 左侧密封线（与浅色桌面拉开对比靠满版深色字块）
  if (_exam) return _exam; const w = 420, h = 594, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d');
  c.fillStyle = '#f1ead6'; c.fillRect(0, 0, w, h); c.fillStyle = '#9c1c16'; c.font = '700 30px "NB Title","NB Serif",serif'; c.textAlign = 'center'; c.fillText('一九七七年 语文试卷', w / 2 + 14, 46);
  c.fillRect(46, 60, w - 70, 3); c.fillStyle = '#1c1a17'; c.font = '17px "NB Serif",serif'; c.fillText('（ 考 试 时 间 一 百 五 十 分 钟 ）', w / 2 + 14, 84);
  c.strokeStyle = '#2a2622'; c.setLineDash([6, 5]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(30, 20); c.lineTo(30, h - 20); c.stroke(); c.setLineDash([]);
  c.save(); c.translate(18, h / 2); c.rotate(-Math.PI / 2); c.font = '12px "NB Serif",serif'; c.fillText('密　封　线　内　不　要　答　题', 0, 4); c.restore();
  c.textAlign = 'left'; const Q = ['一、解释下列加点的词。（每题二分）', '二、将下面一段文言文译成现代汉语。', '三、改正下列句子中的错别字和病句。', '四、作文：《每当我唱起〈东方红〉》'];
  let y = 120; for (const q of Q) { c.fillStyle = '#141210'; c.font = '700 17px "NB Serif",serif'; c.fillText(q, 46, y); y += 26; c.font = '14px "NB Serif",serif'; c.fillStyle = '#2b2722';
    for (let k = 0; k < 4; k++) { c.fillText('　　' + '题干印刷文字　'.repeat(4).slice(0, 22), 46, y); y += 20; }
    c.strokeStyle = '#8a8070'; c.lineWidth = 1; for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(46, y); c.lineTo(w - 24, y); c.stroke(); y += 20; } y += 8; }
  c.strokeStyle = '#1c1a17'; c.lineWidth = 2; c.strokeRect(w - 150, 96, 126, 0.1); c.font = '13px "NB Serif",serif'; c.fillStyle = '#1c1a17'; c.fillText('总分 ＿＿＿', w - 120, 112);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  _exam = new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 }); return _exam;
}
let _clock = null;
function clockMat() { // 象牙白表盘 + 黑罗马数字 + 分刻度 + 黑指针（10:08）
  if (_clock) return _clock; const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), R = S / 2;
  const g = c.createRadialGradient(R, R, 40, R, R, R); g.addColorStop(0, '#f4ecd8'); g.addColorStop(1, '#ddd0b0'); c.fillStyle = g; c.fillRect(0, 0, S, S); c.translate(R, R); c.fillStyle = '#111';
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; c.save(); c.rotate(a); c.fillRect(-(i % 5 ? 1.5 : 4), -R + 14, i % 5 ? 3 : 8, i % 5 ? 12 : 26); c.restore(); }
  c.font = '700 54px "Times New Roman","NB Serif",serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((r, i) => { const a = i / 12 * Math.PI * 2; c.save(); c.rotate(a); c.translate(0, -R + 80); c.fillText(r, 0, 0); c.restore(); });
  c.font = '20px "NB Serif",serif'; c.fillText('叙 事 管 理 局', 0, R * 0.32); c.font = '15px "NB Serif",serif'; c.fillText('上海钟厂', 0, R * 0.42);
  const hand = (a, L, w) => { c.save(); c.rotate(a); c.beginPath(); c.moveTo(-w, 20); c.lineTo(-w * 0.5, -L); c.lineTo(0, -L - 14); c.lineTo(w * 0.5, -L); c.lineTo(w, 20); c.closePath(); c.fill(); c.restore(); };
  hand((10 + 8 / 60) / 12 * Math.PI * 2, R * 0.48, 9); hand(8 / 60 * Math.PI * 2, R * 0.72, 6); c.fillStyle = '#8a1a14'; c.fillRect(-1.5, -R * 0.78, 3, R * 0.95); c.fillStyle = '#111'; c.beginPath(); c.arc(0, 0, 12, 0, Math.PI * 2); c.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; _clock = new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.08 }); return _clock;
}
function flipMat(title, days, aspect) { // 机械翻牌：奶白底铭牌字 + 3 片黑底白字翻牌（中缝 + 上下半色差）
  const W = 1024, H = Math.round(W / aspect), cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  c.fillStyle = '#1a1612'; c.fillRect(0, 0, W, H); c.fillStyle = '#e9dfc4'; c.fillRect(20, 20, W - 40, H * 0.3);
  c.fillStyle = '#9c1c16'; c.font = `700 ${Math.round(H * 0.17)}px "NB Title","NB Serif",serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(title, W / 2, 20 + H * 0.15);
  const d = String(days), cw = W * 0.17, ch = H * 0.5, y0 = H * 0.4, gap = W * 0.03, x0 = W * 0.16;
  for (let i = 0; i < d.length; i++) { const x = x0 + i * (cw + gap);
    c.fillStyle = '#23211e'; c.fillRect(x, y0, cw, ch / 2); c.fillStyle = '#121110'; c.fillRect(x, y0 + ch / 2, cw, ch / 2);
    c.save(); c.beginPath(); c.rect(x, y0, cw, ch); c.clip(); c.fillStyle = '#f2ecdc'; c.font = `700 ${Math.round(ch * 0.9)}px "Helvetica","Arial",sans-serif`; c.fillText(d[i], x + cw / 2, y0 + ch / 2 + ch * 0.04); c.restore();
    c.fillStyle = '#000'; c.fillRect(x, y0 + ch / 2 - 2, cw, 4); c.fillStyle = '#7a5e34'; c.fillRect(x - 6, y0 + ch / 2 - 5, 6, 10); c.fillRect(x + cw, y0 + ch / 2 - 5, 6, 10); }
  c.fillStyle = '#e9dfc4'; c.font = `700 ${Math.round(H * 0.26)}px "NB Title","NB Serif",serif`; c.fillText('天', x0 + d.length * (cw + gap) + cw * 0.45, y0 + ch / 2);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.05 });
}
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
