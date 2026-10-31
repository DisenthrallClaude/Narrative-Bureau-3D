// 室内：正门门廊/服务台、安检大厅（扇形拱顶、玫瑰窗、闸机与扫描门、LED 大屏）、人事档案馆（回廊、阅览大厅、B1 密集库）
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { placeModel, loadTex } from '../engine/assets.js';
import { mats } from './mats.js';
import { Frame, archRingGeo, archSolidGeo, archShape, archApex, lancetWindow, emblem, goldText } from './gothic.js';
import { lightShaft, dust, CanvasScreen, time, roseGlassTexture } from '../engine/fx.js';
import { content } from '../engine/content.js';
import { FLOOR, T, HERO } from './exterior.js';
import { placeHero, hallMats } from './hero.js';
export const HERO_HALL = HERO && !new URLSearchParams(location.search).has('legacyhall');

const Y = FLOOR;

export async function buildInteriors(scene, world, ctx) {
  const M = mats();
  const zones = {};
  for (const z of ['gate', 'security_hall', 'archive', 'archive_b1']) { zones[z] = new THREE.Group(); zones[z].name = z; scene.add(zones[z]); }
  const jobs = [];
  const add = (zone, p) => { jobs.push(p.then((o) => { zones[zone].add(o); return o; })); return p; };
  ctx.zones = zones;
  T('int start'); buildGate(zones.gate, world, ctx, M, (p) => add('gate', p)); T('int gate');
  buildHall(zones.security_hall, world, ctx, M, (p) => add('security_hall', p)); T('int hall');
  buildArchive(zones.archive, zones.archive_b1, world, ctx, M, (p) => add('archive', p), (p) => add('archive_b1', p));
  T('int archive'); if (ctx.heroHallJob) jobs.push(ctx.heroHallJob); await Promise.all(jobs); T('int models');
  return zones;
}

// ——— 通用：墙（带门洞）———
export function wallX(b, key, x, z0, z1, y0, h, t, holes = [], collide = true) {
  // 沿 z 方向的墙，holes: [{z0,z1,h}]
  let cur = z0; const segs = [];
  const hs = holes.slice().sort((a, b2) => b2.z0 - a.z0);
  // z0 > z1 （向北为负）
  for (const ho of hs) { if (cur > ho.z0) segs.push([cur, ho.z0]); b.add(key, new THREE.BoxGeometry(t, h - ho.h, ho.z0 - ho.z1), { pos: [x, y0 + ho.h + (h - ho.h) / 2, (ho.z0 + ho.z1) / 2] }, { uv: 0.25 }); cur = ho.z1; }
  if (cur > z1) segs.push([cur, z1]);
  for (const [a, c] of segs) b.add(key, new THREE.BoxGeometry(t, h, a - c), { pos: [x, y0 + h / 2, (a + c) / 2] }, { uv: 0.25, collide });
}
export function wallZ(b, key, z, x0, x1, y0, h, t, holes = [], collide = true) {
  let cur = x0; const hs = holes.slice().sort((a, b2) => a.x0 - b2.x0);
  for (const ho of hs) { if (ho.x0 > cur) b.add(key, new THREE.BoxGeometry(ho.x0 - cur, h, t), { pos: [(cur + ho.x0) / 2, y0 + h / 2, z] }, { uv: 0.25, collide }); b.add(key, new THREE.BoxGeometry(ho.x1 - ho.x0, h - ho.h, t), { pos: [(ho.x0 + ho.x1) / 2, y0 + ho.h + (h - ho.h) / 2, z] }, { uv: 0.25 }); cur = ho.x1; }
  if (x1 > cur) b.add(key, new THREE.BoxGeometry(x1 - cur, h, t), { pos: [(cur + x1) / 2, y0 + h / 2, z] }, { uv: 0.25, collide });
}
/** 尖拱门洞装饰框（面向 +z 的 Frame） */
export function archPortal(b, f, w, hs, depth, gold = true) {
  b.add('wallStone', archRingGeo(w + 1.2, hs, w, hs, depth), f.at(0, 0, 0), { uv: 0.5 });
  b.add('stoneDark', archRingGeo(w + 0.5, hs, w, hs, depth + 0.2), f.at(0, 0, 0), { uv: 0.5 });
  if (gold) b.add('gold', archRingGeo(w + 1.3, hs, w + 1.2, hs, depth + 0.1), f.at(0, 0, 0), { uv: 1 });
  for (const sx of [-1, 1]) b.add('stoneDark', new THREE.CylinderGeometry(0.22, 0.22, hs, 10), f.at(sx * (w / 2 + 0.3), hs / 2, depth / 2 + 0.05), { uv: 0.5 });
}
/** 束柱 */
export function pier(b, x, z, y0, h, r = 0.7) {
  b.add('wallStone', new THREE.CylinderGeometry(r, r, h, 16), { pos: [x, y0 + h / 2, z] }, { uv: 0.4, collide: true });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.add('stoneDark', new THREE.CylinderGeometry(r * 0.28, r * 0.28, h, 8), { pos: [x + Math.cos(a) * r * 0.95, y0 + h / 2, z + Math.sin(a) * r * 0.95] }, { uv: 0.5 }); }
  b.add('stoneDark', new THREE.CylinderGeometry(r * 1.5, r * 1.6, 0.8, 16), { pos: [x, y0 + 0.4, z] }, { uv: 0.5 });
  b.add('gold', new THREE.CylinderGeometry(r * 1.62, r * 1.62, 0.08, 16), { pos: [x, y0 + 0.82, z] }, { uv: 1 });
  b.add('gold', new THREE.CylinderGeometry(r * 1.45, r * 1.25, 0.5, 16), { pos: [x, y0 + h - 0.25, z] }, { uv: 1 });
}
/** 管状肋（沿曲线） */
/** 带尖拱洞的墙片（局部 x 居中，y 从 0 到 h，挤出厚 1.2 沿 z） */
export function wallWithArch(w, h, aw, ahs, ay) {
  const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.lineTo(-w / 2, 0);
  const pts = archShape(aw, ahs).getPoints().map((p) => new THREE.Vector2(p.x, p.y + ay));
  if (ay <= 0.001) { // 洞通到底：改为 U 形轮廓
    const s2 = new THREE.Shape(); s2.moveTo(-w / 2, 0); s2.lineTo(-aw / 2, 0);
    const arc = archShape(aw, ahs).getPoints().filter((p) => p.y > 0.0001 || Math.abs(p.x) < aw / 2 - 1e-3);
    arc.forEach((p) => s2.lineTo(p.x, p.y)); s2.lineTo(aw / 2, 0); s2.lineTo(w / 2, 0); s2.lineTo(w / 2, h); s2.lineTo(-w / 2, h); s2.lineTo(-w / 2, 0);
    return new THREE.ExtrudeGeometry(s2, { depth: 1.2, bevelEnabled: false });
  }
  sh.holes.push(new THREE.Path(pts.reverse()));
  return new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false });
}
export function rib(b, key, pts, r = 0.12) { const c = new THREE.CatmullRomCurve3(pts); b.add(key, new THREE.TubeGeometry(c, Math.max(8, pts.length * 4), r, 6, false), null, { uv: 1 }); }
/** 尖拱筒形拱顶（沿 z）：宽 w，起拱高 y0，拱高 rise */
export function pointedVault(b, key, cx, cz, w, len, y0, rise, ribEvery = 4) {
  const g = archRingGeo(w + 0.6, 0.001, w, 0.001, len);
  g.scale(1, rise / (w * 0.866), 1);
  b.add(key, g, { pos: [cx, y0, cz] }, { uv: 0.25 });
  const prof = (k) => { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; const s = archShape(w - 0.2, 0.001, THREE.Shape, 8).getPoints(); void s; } return pts; };
  void prof;
  // 横肋与对角肋
  const arc = (side, t) => { // t 0..1 从起拱到拱顶
    const h = w / 2; const ang = Math.PI - (Math.PI / 3) * t;
    const x = side < 0 ? h + w * Math.cos(ang) : -(h + w * Math.cos(ang));
    const y = w * Math.sin(ang) * (rise / (w * 0.866));
    return [x * 0.985, y * 0.985];
  };
  const n = Math.round(len / ribEvery);
  for (let k = 0; k <= n; k++) {
    const z = cz - len / 2 + (len / n) * k;
    const pts = []; for (let i = 0; i <= 12; i++) { const [x, y] = arc(-1, i / 12); pts.push(new THREE.Vector3(cx + x, y0 + y, z)); } for (let i = 12; i >= 0; i--) { const [x, y] = arc(1, i / 12); pts.push(new THREE.Vector3(cx + x, y0 + y, z)); }
    rib(b, 'gold', pts, 0.1);
    if (k < n) { // 对角肋
      const z2 = z + len / n;
      for (const dir of [1, -1]) { const pts2 = []; for (let i = 0; i <= 16; i++) { const t = i / 16; const side = t < 0.5 ? -1 : 1; const tt = t < 0.5 ? t * 2 : (1 - t) * 2; const [x, y] = arc(side * dir, tt); pts2.push(new THREE.Vector3(cx + x, y0 + y - 0.05, z + (z2 - z) * t)); } rib(b, 'stoneDark', pts2, 0.12); }
      b.add('gold', new THREE.SphereGeometry(0.35, 10, 8), { pos: [cx, y0 + rise - 0.3, (z + z2) / 2] }, { uv: 1 });
    }
  }
  // 屋脊肋
  rib(b, 'gold', [new THREE.Vector3(cx, y0 + rise - 0.15, cz - len / 2), new THREE.Vector3(cx, y0 + rise - 0.15, cz + len / 2)], 0.09);
}
/** 扇形拱：在 (x,z) 柱顶 y0 处旋转出喇叭形穹面 + 放射金肋 */
export function fanConoid(b, x, z, y0, R, H, sectors = [0, Math.PI * 2]) {
  const pts = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; const r = 0.5 + (R - 0.5) * (1 - Math.cos(t * Math.PI / 2)); const y = H * Math.sin(t * Math.PI / 2); pts.push(new THREE.Vector2(r, y)); }
  const geo = new THREE.LatheGeometry(pts, 48, sectors[0], sectors[1] - sectors[0]);
  b.add('vault', geo, { pos: [x, y0, z] }, { uv: 0.5 });
  const nR = Math.round(24 * (sectors[1] - sectors[0]) / (Math.PI * 2));
  for (let k = 0; k <= nR; k++) {
    const a = sectors[0] + ((sectors[1] - sectors[0]) * k) / nR;
    const rp = pts.map((p) => new THREE.Vector3(x + Math.sin(a) * (p.x - 0.03), y0 + p.y - 0.04, z + Math.cos(a) * (p.x - 0.03)));
    rib(b, k % 2 ? 'stoneDark' : 'gold', rp, k % 2 ? 0.05 : 0.06);
  }
  for (const t of [0.45, 0.75, 1.0]) { const i = Math.round(t * 14); const p = pts[i]; const rp = []; for (let k = 0; k <= 24; k++) { const a = sectors[0] + ((sectors[1] - sectors[0]) * k) / 24; rp.push(new THREE.Vector3(x + Math.sin(a) * (p.x - 0.04), y0 + p.y - 0.04, z + Math.cos(a) * (p.x - 0.04))); } rib(b, 'gold', rp, 0.05); }
}

/** 带矩形洞的楼板 */
export function slabWithHole(b, key, x0, x1, z0, z1, y, t, h, collide) {
  const parts = [[x0, h.x0, z0, z1], [h.x1, x1, z0, z1], [h.x0, h.x1, z0, h.z0], [h.x0, h.x1, h.z1, z1]];
  for (const [a, c, d, e] of parts) if (c - a > 0.01 && d - e > 0.01) b.box(key, c - a, t, d - e, [(a + c) / 2, y + t / 2, (d + e) / 2], { uv: 0.35, collide });
}
// 面光补光：RectAreaLight 在有光泽的墙面/地面上会映出整块矩形高光（「悬空半透明板」穿帮），
// 改为分区内的半球补光（无镜面高光）；分区组隐藏时灯同样失效。强度按原面光面积粗略折算。
export function rectLight(zone, color, intensity, w, h, pos, look) {
  const c = new THREE.Color(color); const g = c.clone().multiplyScalar(0.18);
  const k = Math.min(0.6, intensity * Math.sqrt(w * h) / 60 + 0.1);
  const l = new THREE.HemisphereLight(c, g, k); l.position.set(...pos); l.userData.isFill = true; zone.add(l); void look; return l;
}
export function spot(zone, color, intensity, pos, target, angle = 0.5, shadow = false, dist = 40) {
  const s = new THREE.SpotLight(color, intensity, Math.min(dist, 40), angle, 0.6, 2); s.position.set(...pos); s.target.position.set(...target); zone.add(s, s.target);
  if (shadow) { s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0006; s.shadow.normalBias = 0.05; s.userData.qualityShadow = true; }
  return s;
}
export function point(zone, color, intensity, pos, dist = 12) { const p = new THREE.PointLight(color, intensity, dist, 2); p.position.set(...pos); zone.add(p); return p; }

// =============================== 正门门廊 / 服务台 ===============================
function buildGate(zone, world, ctx, M, add) {
  const b = new Batch();
  const X0 = -13.9, X1 = 13.9, Z0 = -6.4, Z1 = -30;
  // 地面：大理石拼花 + 金线
  b.box('hallFloor', 27.8, 0.1, 23.6, [0, Y - 0.05, (Z0 + Z1) / 2], { uv: 0.25, collide: true });
  for (let z = Z0 - 2; z > Z1; z -= 4) b.box('gold', 27.8, 0.012, 0.06, [0, Y + 0.004, z], { uv: 1 });
  for (const x of [-10, -5, 0, 5, 10]) b.box('gold', 0.06, 0.012, 23.6, [x, Y + 0.004, (Z0 + Z1) / 2], { uv: 1 });
  b.box('hallFloorDark', 6, 0.012, 23.6, [0, Y + 0.002, (Z0 + Z1) / 2], { uv: 0.3 });
  ctx.gateFloorY = Y;
  // 内墙
  wallX(b, 'wallStone', X0 - 0.2, Z0, Z1, Y, 14, 0.4, [], true);
  wallX(b, 'wallStone', X1 + 0.2, Z0, Z1, Y, 14, 0.4, [], true);
  // 前墙内侧（门洞）
  wallZ(b, 'wallStone', Z0 - 0.15, X0, X1, Y, 14, 0.3, [{ x0: -3.5, x1: 3.5, h: 9 }], false);
  // 后墙（通往安检大厅的尖拱门洞）
  wallZ(b, 'wallStone', Z1, X0, X1, Y, 14, 0.8, [{ x0: -5, x1: 5, h: 10 }], true);
  archPortal(b, new Frame([0, Y, Z1 + 0.45], 0), 10, 10 - 10 * 0.866 * 0.5, 0.4);
  // 墙面：盲拱壁龛 + 金线腰带
  for (const sx of [-1, 1]) {
    const f = new Frame([sx * (X1 - 0.02), Y, -18], sx > 0 ? -Math.PI / 2 : Math.PI / 2);
    for (let k = -2; k <= 2; k++) { b.add('stoneDark', new THREE.ShapeGeometry(archShape(2.6, 5)), f.at(k * 4.4, 1.2, 0.01), { uv: 0.5 }); b.add('gold', archRingGeo(2.8, 5, 2.6, 5, 0.06), f.at(k * 4.4, 1.2, 0.04), { uv: 1 }); }
    b.add('gold', new THREE.BoxGeometry(23, 0.1, 0.1), f.at(0, 10.2, 0.05), { uv: 1 });
  }
  // 拱顶
  pointedVault(b, 'vault', 0, (Z0 + Z1) / 2, 27.8, 23.6, Y + 14, 9.5, 3.93); // M6：加高起拱、六跨肋拱（R4 P1-5 平板天花）
  // 束柱（装饰）
  for (const sx of [-1, 1]) for (const z of [-12, -24]) pier(b, sx * 12.9, z, Y, 14, 0.5);

  // —— 服务台（东侧，面向西）——
  const dx = 10.5, dz0 = -10, dz1 = -24;
  b.box('blackMarble', 1.4, 1.1, 14, [dx, Y + 0.55, (dz0 + dz1) / 2], { uv: 0.5, collide: true });
  b.box('onyx', 1.7, 0.08, 14.3, [dx, Y + 1.14, (dz0 + dz1) / 2], { uv: 0.3 });
  b.box('gold', 0.04, 0.05, 14.3, [dx - 0.86, Y + 1.12, (dz0 + dz1) / 2], { uv: 1 });
  b.box('gold', 0.04, 0.04, 14, [dx - 0.71, Y + 0.6, (dz0 + dz1) / 2], { uv: 1 });
  // 窗口隔板 + 窗口牌
  for (let k = 0; k < 6; k++) b.box('glassClear', 0.04, 0.9, 0.03, [dx - 0.5, Y + 1.6, dz0 - k * 2.8], { uv: false });
  for (let k = 0; k < 5; k++) {
    const z = dz0 - 1.4 - k * 2.8;
    const lbl = goldText(`${k + 1} 号窗口`, 1.1, 0.26, M.goldBright, { res: 128 }); lbl.position.set(dx - 0.72, Y + 2.25, z); lbl.rotation.y = -Math.PI / 2; zone.add(lbl);
    b.box('blackMetal', 0.06, 0.34, 1.3, [dx - 0.66, Y + 2.25, z], { uv: 1 });
    // 人脸识别终端（每窗口）
    b.box('blackMetal', 0.08, 0.32, 0.22, [dx - 0.68, Y + 1.36, z + 0.6], { uv: 1 });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.28), new THREE.MeshStandardMaterial({ color: 0, emissive: 0x3a8cff, emissiveIntensity: 1.2 })); scr.position.set(dx - 0.73, Y + 1.36, z + 0.6); scr.rotation.y = -Math.PI / 2; zone.add(scr);
  }
  // 证件打印机（3 号窗）
  const z3 = dz0 - 1.4 - 2 * 2.8;
  b.box('paintedSteel', 0.5, 0.25, 0.45, [dx - 0.2, Y + 1.3, z3 - 0.4], { uv: 1 });
  b.box('rubber', 0.3, 0.02, 0.2, [dx - 0.42, Y + 1.25, z3 - 0.4], { uv: 1 });
  ctx.printerPos = new THREE.Vector3(dx - 0.5, Y + 1.3, z3 - 0.4);
  // 折页架
  b.box('glassClear', 0.25, 0.3, 0.6, [dx - 0.4, Y + 1.32, dz1 + 0.8], { uv: false });
  for (let k = 0; k < 4; k++) b.box('kraft', 0.02, 0.24, 0.14, [dx - 0.42 + k * 0.05, Y + 1.32, dz1 + 0.6 + k * 0.12], { uv: 2 });
  // 局徽墙（台后东墙）
  b.box('stoneDark', 0.3, 9, 14, [X1 - 0.05, Y + 4.5, (dz0 + dz1) / 2], { uv: 0.3 });
  b.box('gold', 0.32, 0.12, 14.2, [X1 - 0.05, Y + 9, (dz0 + dz1) / 2], { uv: 1 });
  const wallEm = emblem(3.0, M.goldBright, M.navy); wallEm.position.set(X1 - 0.35, Y + 5.2, (dz0 + dz1) / 2); wallEm.rotation.y = -Math.PI / 2; zone.add(wallEm);
  ctx.emblemWallGem = new THREE.Vector3(X1 - 0.4, Y + 5.2, (dz0 + dz1) / 2);
  const wt = goldText('叙事管理局　京城总部', 6.4, 0.6, M.goldBright, { res: 128 }); wt.position.set(X1 - 0.22, Y + 1.7, (dz0 + dz1) / 2); wt.rotation.y = -Math.PI / 2; zone.add(wt);
  // 叫号屏
  const q = new CanvasScreen(1024, 256, drawQueue, { fps: 1, intensity: 1.3 }); ctx.screens.push(q);
  b.box('blackMetal', 0.2, 1.1, 4.1, [X1 - 0.2, Y + 7.8, dz0 - 0.4], { uv: 1 });
  const qm = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), q.mat); qm.position.set(X1 - 0.32, Y + 7.8, dz0 - 0.4); qm.rotation.y = -Math.PI / 2; zone.add(qm);
  ctx.queueScreen = qm;
  // 人事处干事（台后）
  const clerk = person(M, { coat: 0x1c2233, clue: 'chair' }); clerk.position.set(dx + 0.9, Y, z3); clerk.rotation.y = -Math.PI / 2; zone.add(clerk);
  ctx.clerk = clerk;
  // 立式导视牌（服务台左侧）
  const dirTex = content.tex('tex_gate_directory');
  b.box('blackMetal', 0.12, 2.4, 1.1, [6.8, Y + 1.2, -8.6], { uv: 1, collide: true });
  const dm = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.2), dirTex ? new THREE.MeshStandardMaterial({ map: dirTex, roughness: 0.4, emissive: 0xffffff, emissiveMap: dirTex, emissiveIntensity: 0.25 }) : signMaterial('楼层导视', ['F1 正门 · 安检大厅', 'F1 西翼 · 人事档案馆', 'F1 东翼 · 市民服务', 'F2 监测指挥中心', 'F3 办公区', 'B1–B6 需权限'], 512, 1126));
  dm.position.set(6.73, Y + 1.25, -8.6); dm.rotation.y = -Math.PI / 2; zone.add(dm);
  ctx.directorySign = dm;
  // 访客座椅（西侧）与绿植
  for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) add(placeModel('armchair', { height: 0.95, pos: [-10.6 + r * 2.2, Y, -11 - k * 2.2], rotY: Math.PI / 2 }).then((o) => { world.boundsOf(o, 0.8); return o; }));
  for (const p of [[-12.6, -8], [-12.6, -28.6], [12.6, -28.6], [12.6, -7.6]]) add(placeModel('potted_plant', { height: 1.7, pos: [p[0], Y, p[1]] }).then((o) => { world.boundsOf(o, 0.6); return o; }));
  // 吊灯
  for (const z of [-12, -24]) add(placeModel('chandelier', { height: 2.4, pos: [0, Y + 15.6, z] }));
  // 灯光
  for (const z of [-12, -24]) point(zone, 0xffd9a8, 26, [0, Y + 13.5, z], 22);
  spot(zone, 0xffe6c2, 140, [6, Y + 13.5, -17], [12, Y + 3, -17], 0.55, true, 26);
  spot(zone, 0xffe6c2, 120, [-6, Y + 13.5, -17], [-11, Y, -17], 0.7, false, 30);
  rectLight(zone, 0xffe0b8, 3, 10, 3, [0, Y + 13.9, -18], [0, Y, -18]);

  // —— 门廊外：访客须知碑（左）、新人报到铜牌（右）——
  const stele = new THREE.Group();
  const sb = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.3, 0.35), M.stoneDark); sb.position.y = 1.15 + 0.3; stele.add(sb);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 0.6), M.blackMarble); base.position.y = 0.15; stele.add(base);
  const tt = content.tex('tex_gate_visitor_rules');
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 1.76), tt ? new THREE.MeshStandardMaterial({ map: tt, roughness: 0.45, metalness: 0.1 }) : signMaterial('访客须知', ['一、请主动出示证件', '二、接受文本完整性扫描', '三、勿携带来源不明纸质物品'], 512, 680));
  face.position.set(0, 1.55, 0.18); stele.add(face);
  stele.position.set(-9.6, Y, -2.2); stele.rotation.y = 0.35; stele.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
  zone.add(stele); world.box(-9.6, Y + 1.2, -2.2, 1.6, 2.4, 0.6, 0.35);
  ctx.visitorStele = face;
  const plaqueTex = content.tex('tex_gate_newcomer');
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), plaqueTex ? new THREE.MeshStandardMaterial({ map: plaqueTex, metalness: 0.6, roughness: 0.35 }) : brassPlaqueMaterial('新人报到须知', ['请于服务台 3 号窗口报到', '领取临时入职证', '前往安检大厅接受扫描', '至西翼人事档案馆领取档案']));
  pl.position.set(9.9, Y + 2.0, -4.9 + 0.02); zone.add(pl);
  b.box('gold', 1.32, 1.72, 0.04, [9.9, Y + 2.0, -4.93], { uv: 1 });
  ctx.newcomerPlaque = pl;

  b.build(zone, M);
  for (const geo of b.colliders) world.addGeo(geo);
  world.surface(X0, Z1, X1, Z0, 'marble');
}

// =============================== 安检大厅 ===============================
function buildHall(zone, world, ctx, M, add) {
  const b = new Batch();
  const HH = HERO_HALL; const bA = HH ? new Batch() : b; // R2：建筑与固定陈设改由 hero_hall.glb（tools/blender/hall.py）提供，bA 为丢弃批次
  if (HH) heroHall(zone, world, ctx, M);
  const X = 17.4, Z0 = -30, Z1 = -76;
  const len = Z0 - Z1, cz = (Z0 + Z1) / 2;
  // 地面：黑白大理石 + 金线罗盘拼花
  const floor = bA.box('hallFloor', 34.8, 0.1, len, [0, Y - 0.05, cz], { uv: 0.18, collide: true });
  void floor;
  bA.box('hallFloorDark', 23, 0.012, len, [0, Y + 0.003, cz], { uv: 0.2 });
  for (let z = Z0 - 5.75; z > Z1; z -= 11) { bA.box('gold', 23, 0.014, 0.08, [0, Y + 0.006, z], { uv: 1 }); }
  for (const x of [-11.5, 11.5]) bA.box('gold', 0.08, 0.014, len, [x, Y + 0.006, cz], { uv: 1 });
  { const r = new THREE.RingGeometry(6.8, 7.0, 96); r.rotateX(-Math.PI / 2); bA.add('gold', r, { pos: [0, Y + 0.008, -58] }, { uv: 1 }); const r2 = new THREE.RingGeometry(4.8, 4.9, 96); r2.rotateX(-Math.PI / 2); bA.add('gold', r2, { pos: [0, Y + 0.008, -58] }, { uv: 1 }); }
  // 侧廊外墙（带窗）与通往档案馆的西门洞
  wallX(bA, 'wallStone', -X - 0.3, Z0, Z1, Y, 26, 0.6, [{ z0: -47.5, z1: -55.5, h: 8 }], true);
  wallX(bA, 'wallStone', X + 0.3, Z0, Z1, Y, 26, 0.6, [{ z0: -45, z1: -51, h: 6 }], true);
  { const f = new Frame([X - 0.05, Y, -48], -Math.PI / 2); bA.add('stoneDark', archRingGeo(7.0, 4.2, 6.0, 4.2, 0.7), f.at(0, 0, 0.3), { uv: 0.5 }); bA.add('gold', archRingGeo(7.2, 4.2, 7.0, 4.2, 0.72), f.at(0, 0, 0.3), { uv: 1 });
    const t = goldText('东翼 → 市民服务 · 叙事高考 · 监测指挥中心', 5.6, 0.3, M.goldBright, { res: 96 }); t.position.set(X - 0.3, Y + 7.6, -48); t.rotation.y = -Math.PI / 2; zone.add(t); }
  // 北墙（电梯厅金门、中庭铁门）
  wallZ(bA, 'wallStone', Z1 - 0.3, -X, X, Y, 26, 0.6, [{ x0: -2.3, x1: 2.3, h: 6.2 }], true);
  // 南墙（与门厅之间）
  wallZ(bA, 'wallStone', Z0 + 0.3, -X, X, Y + 14, 12, 0.6, [], false);
  // 侧廊顶（x ±12…±17.4 高 12）
  for (const sx of [-1, 1]) {
    bA.box('vault', 5.6, 0.5, len, [sx * 14.7, Y + 12.25, cz], { uv: 0.25 });
    for (let z = Z0 - 5.5; z > Z1; z -= 5.5) bA.box('gold', 5.4, 0.12, 0.12, [sx * 14.7, Y + 11.95, z], { uv: 1 });
    bA.box('gold', 0.12, 0.12, len, [sx * 12.6, Y + 11.95, cz], { uv: 1 });
  }
  // 拱廊：束柱 + 尖拱 + 拱上墙（高侧窗）
  const pz = [-31.5, -42.5, -53.5, -64.5, -75.5];
  for (const sx of [-1, 1]) {
    for (const z of pz) pier(bA, sx * 12, z, Y, 16, 0.75);
    for (let k = 0; k < 4; k++) {
      const z = (pz[k] + pz[k + 1]) / 2; const f = new Frame([sx * 12, Y, z], Math.PI / 2);
      // 拱廊墙（尖拱洞）
      bA.add('wallStone', wallWithArch(11, 14, 9.4, 3.8, 0), f.at(0, 0, -0.6), { uv: 0.3 });
      bA.add('gold', archRingGeo(9.6, 3.8, 9.4, 3.8, 1.3), f.at(0, 0, 0), { uv: 1 });
      bA.add('stoneDark', archRingGeo(10.2, 3.8, 9.6, 3.8, 1.25), f.at(0, 0, 0), { uv: 0.5 });
      // 拱上三联盲拱（triforium）
      bA.add('wallStone', new THREE.BoxGeometry(11, 2, 1.2), f.at(0, 15, 0), { uv: 0.3 });
      for (let j = -1; j <= 1; j++) bA.add('stoneDark', archRingGeo(2.2, 0.6, 1.8, 0.6, 1.3), f.at(j * 2.8, 14.05, 0), { uv: 0.6 });
      bA.add('gold', new THREE.BoxGeometry(11, 0.1, 1.32), f.at(0, 14.0, 0), { uv: 1 });
      // 高侧彩窗（发光）
      bA.add('wallStone', wallWithArch(11, 8.2, 4.2, 2.0, 0.6), f.at(0, 16, -0.6), { uv: 0.3 });
      bA.add('glassIn', new THREE.ShapeGeometry(archShape(4.2, 2.6)), f.at(0, 16, sx > 0 ? -0.05 : 0.05), { uv: false });
      bA.add('gold', archRingGeo(4.4, 2.6, 4.2, 2.6, 1.3), f.at(0, 16, 0), { uv: 1 });
      bA.add('stoneDark', new THREE.BoxGeometry(0.14, 5.2, 1.0), f.at(0, 18.6, 0), { uv: 1 });
      // 侧廊外墙彩窗
      const fw = new Frame([sx * (X - 0.01), Y, z], sx > 0 ? -Math.PI / 2 : Math.PI / 2);
      if (k !== 1) {
        bA.add('glassIn', new THREE.ShapeGeometry(archShape(3.2, 6)), fw.at(0, 2.5, 0.02), { uv: false });
        bA.add('stoneDark', archRingGeo(3.8, 6, 3.2, 6, 0.3), fw.at(0, 2.5, 0.1), { uv: 0.6 });
        bA.add('gold', archRingGeo(3.9, 6, 3.8, 6, 0.32), fw.at(0, 2.5, 0.1), { uv: 1 });
        bA.add('stone', new THREE.BoxGeometry(0.14, 6 + 3.2 * 0.6, 0.2), fw.at(0, 2.5 + 4, 0.1), { uv: 1 });
      } else {
        // 侧门洞上方的高窗
        bA.add('glassIn', new THREE.ShapeGeometry(archShape(2.4, 1.2)), fw.at(0, 8.6, 0.02), { uv: false });
        bA.add('gold', archRingGeo(2.6, 1.2, 2.4, 1.2, 0.32), fw.at(0, 8.6, 0.1), { uv: 1 });
      }
    }
  }
  // 中殿扇形拱顶
  const springY = Y + 16, H = 7.2, R = 5.4;
  const P2 = Math.PI / 2;
  for (const sx of [-1, 1]) for (let k = 0; k < pz.length; k++) {
    let sec = sx > 0 ? [Math.PI, 2 * Math.PI] : [0, Math.PI];
    if (k === 0) sec = sx > 0 ? [Math.PI, 3 * P2] : [P2, Math.PI];
    if (k === pz.length - 1) sec = sx > 0 ? [3 * P2, 2 * Math.PI] : [0, P2];
    fanConoid(bA, sx * 12, pz[k], springY, R, H, sec);
  }
  // 中央平顶带（拱顶最高处）+ 垂饰
  const crownY = springY + H;
  bA.box('vault', 13.6, 0.4, len, [0, crownY + 0.1, cz], { uv: 0.25 });
  bA.box('vault', 24.4, 0.4, len, [0, crownY + 0.9, cz], { uv: 0.25 });
  for (const x of [-6.6, 6.6]) bA.box('vault', 0.6, 3.2, len, [x, crownY - 1.3, cz], { uv: 0.25 });
  for (let k = 0; k < 4; k++) {
    const z = (pz[k] + pz[k + 1]) / 2;
    bA.add('gold', new THREE.ConeGeometry(0.6, 2.4, 8), { pos: [0, crownY - 1.2, z], rot: [Math.PI, 0, 0] }, { uv: 1 });
    bA.add('gold', new THREE.TorusGeometry(2.2, 0.08, 6, 48), { pos: [0, crownY - 0.1, z], rot: [Math.PI / 2, 0, 0] }, { uv: 1 });
    for (let j = 0; j < 8; j++) { const a = (j / 8) * Math.PI * 2; rib(bA, 'gold', [new THREE.Vector3(0, crownY - 0.05, z), new THREE.Vector3(Math.cos(a) * 3.2, crownY - 0.25, z + Math.sin(a) * 3.2), new THREE.Vector3(Math.cos(a) * 6.4, crownY - 0.9, z + Math.sin(a) * 4.8)], 0.05); }
  }
  for (let k = 0; k < pz.length; k++) rib(bA, 'gold', [new THREE.Vector3(-12, springY + 0.2, pz[k]), new THREE.Vector3(-6, crownY - 0.6, pz[k]), new THREE.Vector3(0, crownY - 0.15, pz[k]), new THREE.Vector3(6, crownY - 0.6, pz[k]), new THREE.Vector3(12, springY + 0.2, pz[k])], 0.1);
  // 南墙玫瑰窗（室内侧，发光）
  if (!HH) roseWindow(b, zone, M, [0, Y + 19, Z0 + 0.0], 5.2);
  // 北墙：电梯厅金门与铁门
  for (const x of [-6, 6]) {
    const f = new Frame([x, Y, Z1 + 0.02], 0);
    bA.add('stoneDark', archRingGeo(4.6, 4.2, 3.4, 4.2, 0.6), f.at(0, 0, 0.3), { uv: 0.5 });
    bA.add('gold', new THREE.BoxGeometry(1.6, 4.0, 0.1), f.at(-0.82, 2, 0.1), { uv: 1 });
    bA.add('gold', new THREE.BoxGeometry(1.6, 4.0, 0.1), f.at(0.82, 2, 0.1), { uv: 1 });
    bA.add('iron', new THREE.BoxGeometry(0.04, 4.0, 0.14), f.at(0, 2, 0.1), { uv: 1 });
    const ind = goldText('书脊井　B1–B6', 1.6, 0.3, M.goldBright, { res: 96 }); ind.position.set(x, Y + 5.0, Z1 + (HH ? 0.87 : 0.35)); zone.add(ind);
  }
  for (const sx of [-1, 1]) add(placeModel('iron_gate', { width: 2.3, pos: [sx * 3.6, Y, Z1 + 0.6], rotY: sx * 0.15 })); // 铁门向两侧敞开 → 中庭食堂
  { const f = new Frame([0, Y, Z1 + 0.02], 0); bA.add('stoneDark', archRingGeo(6.4, 3.2, 4.8, 3.2, 0.7), f.at(0, 0, 0.3), { uv: 0.5 }); }
  const atrium = goldText('中庭　职工食堂　→', 4.8, 0.32, M.goldBright, { res: 96 }); atrium.position.set(0, Y + 7.6, Z1 + (HH ? 0.72 : 0.4)); zone.add(atrium);

  // —— 闸机线（z = -40）——
  const GZ = -40;
  const lanes = []; for (let i = 0; i < 8; i++) lanes.push(-10.5 + i * 3);
  ctx.lanes = lanes;
  for (let i = 0; i <= 8; i++) {
    const x = -12 + i * 3;
    // M4：人脸识别翼闸——拉丝不锈钢圆头机箱 + 黑玻璃顶面 + 刷卡区 + 人脸屏立杆 + 底部通行灯带
    bA.box('steel', 0.3, 0.98, 1.4, [x, Y + 0.49, GZ], { uv: 1 });
    for (const ez of [-1, 1]) bA.add('steel', new THREE.CylinderGeometry(0.15, 0.15, 0.98, 16, 1, false, ez > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), { pos: [x, Y + 0.49, GZ + ez * 0.7] }, { uv: 1 });
    bA.box('screenOff', 0.32, 0.03, 1.42, [x, Y + 0.995, GZ], { uv: false }); for (const ez of [-1, 1]) bA.add('screenOff', new THREE.CylinderGeometry(0.16, 0.16, 0.03, 16, 1, false, ez > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), { pos: [x, Y + 0.995, GZ + ez * 0.71] }, { uv: false });
    bA.box('gold', 0.31, 0.025, 1.41, [x, Y + 0.8, GZ], { uv: 1 }); bA.box('blackMetal', 0.32, 0.08, 1.42, [x, Y + 0.04, GZ], { uv: 1 });
    b.box('lampGreen', 0.305, 0.02, 1.3, [x, Y + 0.1, GZ], { uv: false });
    b.box('runeGold', 0.2, 0.004, 0.2, [x, Y + 1.012, GZ + 0.45], { uv: false });
    bA.box('blackMetal', 0.035, 0.36, 0.035, [x, Y + 1.18, GZ + 0.62], { uv: 1 }); bA.box('blackMetal', 0.2, 0.14, 0.03, [x, Y + 1.42, GZ + 0.64], { uv: 1 }); b.box('faceScreen', 0.17, 0.11, 0.005, [x, Y + 1.42, GZ + 0.657], { uv: false });
    if (i < 8) { // 车道之间的亚克力翼门（金边）
      for (const ex of [-1, 1]) { bA.box('glassClear', 0.02, 0.62, 0.55, [x + 1.5 + ex * 0.43, Y + 0.72, GZ], { uv: false }); bA.box('gold', 0.025, 0.62, 0.015, [x + 1.5 + ex * 0.43, Y + 0.72, GZ + 0.27], { uv: 1 }); bA.box('gold', 0.025, 0.015, 0.55, [x + 1.5 + ex * 0.43, Y + 1.03, GZ], { uv: 1 }); }
    }
    world.box(x, Y + 0.6, GZ, 0.5, 1.2, 1.7);
  }
  // 车道间实体隔断（只留车道中央 0.9m 通行）
  for (const lx of lanes) { world.box(lx - 0.95, Y + 0.6, GZ, 0.9, 1.2, 0.3); world.box(lx + 0.95, Y + 0.6, GZ, 0.9, 1.2, 0.3); }
  world.box(-15, Y + 0.6, GZ, 4.8, 1.2, 0.4); world.box(15, Y + 0.6, GZ, 4.8, 1.2, 0.4);
  for (const sx of [-1, 1]) bA.box('steel', 4.8, 1.1, 0.12, [sx * 15, Y + 0.55, GZ], { uv: 1 });
  // 排队隔离带（黄铜立柱 + 深蓝伸缩带）
  for (const lx of lanes) for (const ex of [-1, 1]) { const x = lx + ex * 0.75; for (const z of [GZ + 2.4, GZ + 4.2]) { bA.add('brass', new THREE.CylinderGeometry(0.03, 0.03, 0.95, 10), { pos: [x, Y + 0.475, z] }, { uv: 1 }); bA.add('brass', new THREE.CylinderGeometry(0.16, 0.18, 0.04, 16), { pos: [x, Y + 0.02, z] }, { uv: 1 }); bA.add('brass', new THREE.SphereGeometry(0.045, 10, 8), { pos: [x, Y + 0.97, z] }, { uv: 1 }); } bA.box('navy', 0.02, 0.06, 1.8, [x, Y + 0.88, GZ + 3.3], { uv: 1 }); }
  // X 光行李安检机（两侧）：机身 + 通道 + 铅帘 + 滚筒传送带
  for (const sx of [-1, 1]) { const x = sx * 15, z = GZ + 1.6; bA.box('paintedSteel', 1.3, 1.25, 2.4, [x, Y + 0.625 + 0.15, z], { uv: 1 }); bA.box('screenOff', 0.9, 0.6, 2.41, [x, Y + 0.68, z], { uv: false }); for (let k = 0; k < 7; k++) for (const ez of [-1, 1]) bA.box('rubber', 0.11, 0.55, 0.01, [x - 0.36 + k * 0.12, Y + 0.68, z + ez * 1.2], { uv: false }); for (const ez of [-1, 1]) { bA.box('blackMetal', 0.9, 0.08, 1.4, [x, Y + 0.4, z + ez * 1.9], { uv: 1 }); for (let k = 0; k < 10; k++) bA.add('steel', new THREE.CylinderGeometry(0.03, 0.03, 0.86, 8), { pos: [x, Y + 0.46, z + ez * (1.3 + k * 0.13)], rot: [0, 0, Math.PI / 2] }, { uv: 1 }); } bA.box('blackMetal', 0.06, 0.4, 0.06, [x + sx * 0.75, Y + 1.25, z], { uv: 1 }); b.box('faceScreen', 0.5, 0.32, 0.02, [x + sx * 0.75, Y + 1.55, z], { uv: false, rot: [0, -sx * Math.PI / 2, 0] }); world.box(x, Y + 0.7, z, 1.3, 1.4, 5.2); }
  // 文本扫描拱门（每条车道）+ 金色符文环
  ctx.scanRings = [];
  for (let i = 0; i < 8; i++) {
    const x = lanes[i], z = GZ - 3.2;
    // 批次30：黑方柱 + 金带 + 顶梁方块 → Blender 精建 scan_gate_6080（tools/blender/hall_props.py：黑漆立柱 + 铜框线 / 铜踢脚 + 内侧感应格栅 + 指示灯列 + 顶梁铭牌框），碰撞体不变
    add(placeModel('r2/scan_gate_6080', { width: 1.5, pos: [x, Y, z] }));
    for (const ex of [-1, 1]) { world.box(x + ex * 0.62, Y + 1.15, z, 0.24, 2.3, 0.56); b.box('runeGold', 0.02, 2.0, 0.08, [x + ex * 0.505, Y + 1.15, z + 0.2], { uv: false }); }
    const ind = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.02), new THREE.MeshStandardMaterial({ color: 0, emissive: 0x44ff88, emissiveIntensity: 2 })); ind.position.set(x, Y + 2.45, z + 0.31); zone.add(ind);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.035, 8, 64), M.runeGold.clone()); ring.rotation.x = Math.PI / 2; ring.position.set(x, Y + (i === 6 ? 2.25 : 1.2), z); zone.add(ring);
    const lane = goldText(`${i + 1}`, 0.3, 0.3, M.goldBright, { res: 64 }); lane.position.set(x, Y + 2.45, z + 0.32); zone.add(lane);
    ctx.scanRings.push({ ring, ind, x, z });
  }
  // 第 7 号闸机扫描结果小屏
  const scanScr = new CanvasScreen(512, 320, drawScanIdle, { fps: 2, intensity: 1.2 }); ctx.screens.push(scanScr); ctx.scanScreen = scanScr;
  b.box('blackMetal', 0.08, 1.4, 0.08, [lanes[6] + 1.1, Y + 0.7, GZ - 3.2], { uv: 1 });
  b.box('blackMetal', 0.66, 0.44, 0.06, [lanes[6] + 1.1, Y + 1.5, GZ - 3.2], { uv: 1 });
  const ssm = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.375), scanScr.mat); ssm.position.set(lanes[6] + 1.1, Y + 1.5, GZ - 3.2 + 0.035); ssm.rotation.y = 0; zone.add(ssm);
  ssm.rotation.y = 0.0; ssm.position.z += 0; ctx.scanScreenMesh = ssm;
  ssm.rotation.y = Math.PI * 0; // 面向南（迎面走来的人）
  // X 光行李机（1 号道西侧）
  bA.box('paintedSteel', 1.2, 1.3, 3.2, [-14.2, Y + 0.65, GZ - 1.4], { uv: 0.6, collide: true });
  bA.box('rubber', 0.9, 0.04, 4.6, [-14.2, Y + 0.82, GZ - 1.4], { uv: 1 });
  for (const ez of [-1, 1]) for (let k = 0; k < 8; k++) bA.box('rubber', 0.1, 0.5, 0.01, [-14.6 + k * 0.11, Y + 1.0, GZ - 1.4 + ez * 1.6], { uv: 1 });
  bA.box('blackMetal', 0.6, 0.45, 0.05, [-15.2, Y + 1.6, GZ - 2.8], { uv: 1 });
  // CCTV 与监控
  for (const z of [-42.5, -64.5]) for (const sx of [-1, 1]) add(placeModel('cctv', { maxDim: 0.5, pos: [sx * 11.2, Y + 10.5, z], rotY: sx > 0 ? Math.PI / 2 : -Math.PI / 2 }));
  // —— 中央悬挂 LED 大屏（双面）——
  ctx.mainScreenTex = content.tex('tex_sec_main_screen');
  const hud = new CanvasScreen(2048, 896, (c, t, W, H) => drawMainScreen(c, t, W, H, ctx), { fps: 2, intensity: 1.35 }); ctx.screens.push(hud);
  const SW = 15, SH = 6.56, SY = Y + 12.4, SZ = -57;
  bA.box('blackMetal', SW + 0.5, SH + 0.5, 0.5, [0, SY, SZ], { uv: 0.5 });
  bA.box('gold', SW + 0.7, 0.12, 0.6, [0, SY + SH / 2 + 0.3, SZ], { uv: 1 });
  bA.box('gold', SW + 0.7, 0.12, 0.6, [0, SY - SH / 2 - 0.3, SZ], { uv: 1 });
  for (const ex of [-1, 1]) rib(b, 'iron', [new THREE.Vector3(ex * 6.5, SY + SH / 2 + 0.3, SZ), new THREE.Vector3(ex * 6.5, crownY - 0.4, SZ)], 0.03);
  for (const side of [1, -1]) { const sm = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), hud.mat); sm.position.set(0, SY, SZ + side * 0.26); sm.rotation.y = side > 0 ? 0 : Math.PI; zone.add(sm); }
  ctx.mainScreenPos = new THREE.Vector3(0, SY, SZ);
  // 东墙通缉公告栏
  const wb = content.texPatched('tex_sec_wanted_board', [{ rect: [814 / 2176, 1322 / 1632, 72 / 2176, 72 / 1632], fill: '#161617', text: '叙', color: '#d8b56c', size: 0.86 },
    // 批次16：两张「A 级通缉」卡中间的灰色空照片框 → 填秦骁 / 江戾档案海报头像裁切（做旧灰调）
    { rect: [223 / 1536, 504 / 1152, 155 / 1536, 176 / 1152], img: content.texUrl('tex_archive_portrait_qinxiao'), crop: [300, 330, 360, 410], filter: 'grayscale(1) sepia(0.3) contrast(1.08)' },
    { rect: [537 / 1536, 504 / 1152, 154 / 1536, 176 / 1152], img: content.texUrl('tex_archive_portrait_jiangli'), crop: [400, 300, 360, 410], filter: 'grayscale(1) sepia(0.3) contrast(1.08)' }]); // 生图底部「敘事管理局」改简体
  const WO = 0.3; // 批次21：hall_wanted 栏面正中竖缝 = 背后墙柱（z −64）凸出穿过栏面 → 整组再前移 0.3 m，木背板加厚到墙
  b.box('wood', 0.2 + WO, 2.6, 5.6, [X - 0.23 - WO / 2, Y + 2.2, -64], { uv: 0.5 }); // 批次17：通缉栏整组前移 0.13 m——hall_wanted 前景「半透明横杆」= 墙面 H_trim 线脚（x≈17.13，离地 2.64–2.84）凸出在栏面（原 X−0.21）前，隔着玻璃看像横杆（pick 实测）
  b.box('gold', 0.22 + WO, 2.7, 0.08, [X - 0.23 - WO / 2, Y + 2.2, -61.2], { uv: 1 }); b.box('gold', 0.22 + WO, 2.7, 0.08, [X - 0.23 - WO / 2, Y + 2.2, -66.8], { uv: 1 });
  const wbm = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.4), wb ? new THREE.MeshStandardMaterial({ map: wb, roughness: 0.6 }) : wantedBoardMaterial());
  wbm.position.set(X - 0.34 - WO, Y + 2.2, -64); wbm.rotation.y = -Math.PI / 2; zone.add(wbm);
  const wbg = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 2.5), M.glassClear); wbg.position.set(X - 0.43 - WO, Y + 2.2, -64); wbg.rotation.y = -Math.PI / 2; zone.add(wbg);
  ctx.wantedBoard = wbm;
  // 批次13：通缉栏两侧加挂江戾 / 秦骁整张档案海报（IMAGE-PLAN「未用」→ F2 安检大厅通缉栏；栏内原生图保持不动），金框 + 玻璃 + 铜签
  for (const [id, z, nm] of [['tex_archive_portrait_qinxiao', -60.3, '秦骁'], ['tex_archive_portrait_jiangli', -67.7, '江戾']]) { const t = content.tex(id); if (!t) continue;
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.28), new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.12 })); pm.position.set(X - 0.345, Y + 2.2, z); pm.rotation.y = -Math.PI / 2; zone.add(pm);
    b.box('wood', 0.2, 1.4, 0.84, [X - 0.23, Y + 2.2, z], { uv: 0.5 }); b.box('gold', 0.22, 1.46, 0.05, [X - 0.23, Y + 2.2, z - 0.44], { uv: 1 }); b.box('gold', 0.22, 1.46, 0.05, [X - 0.23, Y + 2.2, z + 0.44], { uv: 1 });
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.36), M.glassClear); gl.position.set(X - 0.43, Y + 2.2, z); gl.rotation.y = -Math.PI / 2; zone.add(gl);
    const tg = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), brassPlaqueMaterial('A 级通缉', [nm])); tg.position.set(X - 0.345, Y + 1.3, z); tg.rotation.y = -Math.PI / 2; zone.add(tg); }
  // 西墙违禁品展示柜（相框）
  bA.box('blackMarble', 1.0, 1.0, 4.4, [-X + 0.6, Y + 0.5, -62], { uv: 0.5, collide: true });
  bA.box('gold', 1.04, 0.06, 4.44, [-X + 0.6, Y + 1.0, -62], { uv: 1 });
  bA.box('glassClear', 0.9, 1.3, 4.3, [-X + 0.6, Y + 1.68, -62], { uv: false });
  for (let k = 0; k < 4; k++) bA.box('stoneDark', 0.5, 0.12, 0.5, [-X + 0.6, Y + 1.08, -63.6 + k * 1.05], { uv: 1 });
  add(placeModel('picture_frame', { height: 0.6, pos: [-X + 0.6, Y + 1.14, -62.55], rotY: Math.PI / 2 }));
  add(placeModel('magnifier', { height: 0.3, pos: [-X + 0.6, Y + 1.14, -63.6] }));
  add(placeModel('stapler', { width: 0.25, pos: [-X + 0.6, Y + 1.14, -60.45] }));
  ctx.contrabandCase = new THREE.Vector3(-X + 0.6, Y + 1.4, -62.55);
  // 西北角停走的落地座钟（程序化）
  zone.add(grandClock(M, [-15.8, Y, -73.8], 0.6)); world.box(-15.8, Y + 1.2, -73.8, 0.8, 2.4, 0.6);
  ctx.clockPos = new THREE.Vector3(-15.8, Y + 1.6, -73.8);
  // 规定牌（闸机通道入口右侧立柱）
  const rules = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.3), brassPlaqueMaterial('入局安检规定', ['一、所有人员须过检', '二、出示临时或正式证件', '三、文本完整性扫描不可拒绝', '四、扫描异常须人工复核', '五、禁止回头张望扫描门']));
  rules.position.set(12.5, Y + 2.2, -31.5 + 0.77); zone.add(rules); ctx.secRules = rules;
  // 海报（立柱，待生图）
  const posters = [['tex_poster_gaokao', '叙事高考', '2027 全国叙事高考　报名进行中'], ['tex_poster_safety', '畸变规避', '遇到异常文本　请勿念出声']];
  posters.forEach(([id, title, sub], i) => { const t = content.tex(id); const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.0), t ? new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.35 }) : posterMaterial(title, sub)); const z = pz[2 + i * 1] + 0; pm.position.set(i ? 12 - 1.3 : -12 + 1.3, Y + 2.6, z); pm.rotation.y = i ? -Math.PI / 2 : Math.PI / 2; zone.add(pm); });
  // 湿滑警示牌、灭火器、绿植
  add(placeModel('wet_sign', { height: 0.65, pos: [3.2, Y, -47], rotY: 0.6 }));
  for (const z of [-36, -70]) for (const sx of [-1, 1]) add(placeModel('extinguisher', { height: 0.65, pos: [sx * (X - 0.4), Y, z] }));
  for (const p of [[-15.5, -33], [15.5, -33], [15.5, -73.5]]) add(placeModel('potted_plant', { height: 1.8, pos: [p[0], Y, p[1]] }).then((o) => { world.boundsOf(o, 0.6); return o; }));
  // 等候长椅（闸机后）
  for (const x of [-8, 8]) add(placeModel('r2/wait_bench_6080', { width: 4.2, pos: [x, Y, -68] }) /* 批次30：street_seating → Blender 精建候检长椅（实木条 + 铸铁扶手），坐面朝南 */.then((o) => { world.boundsOf(o, 0.85); return o; }));
  // 西门洞（通往档案馆）
  if (!HH) archPortal(b, new Frame([-X + 0.1, Y, -51.5], Math.PI / 2), 8, 8 - 8 * 0.866 * 0.5, 0.3);
  const way = goldText('← 西翼　人事档案馆', 3.6, 0.42, M.goldBright, { res: 128 }); way.position.set(-X + 0.4, Y + 9.6, -51.5); way.rotation.y = Math.PI / 2; zone.add(way);
  // 殷泽
  const yz = person(M, { coat: 0x0b0d14 }); yz.position.set(lanes[6] + 1.6, Y, GZ - 6.2); yz.rotation.y = Math.PI * 0.85; zone.add(yz); ctx.yinze = yz; // 殷泽：不显形（剧情走位逻辑保留），原位放他的衣帽架 + 名牌，台词走安检广播
  { const yc = person(M, { coat: 0x5a4632, clue: 'coat', name: '殷泽' }) /* 批次16：驼色呢料（原 0x0b0d14 近黑看不清）；去掉程序化黑圆柱帽 */; yc.position.set(lanes[6] + 2.4, Y, GZ - 6.8); yc.rotation.y = Math.PI; zone.add(yc); }
  // —— 光：玫瑰窗光柱、侧窗斜射光柱、尘埃 ——
  ctx.shafts = ctx.shafts ?? [];
  const rs = lightShaft({ from: [0, Y + 19, Z0 - 0.2], to: [0, Y + 0.5, -54], r0: 4.2, r1: 6.5, color: 0xffd9a0, intensity: 0.12 }); zone.add(rs); ctx.shafts.push(rs);
  for (let k = 0; k < 4; k++) {
    const z = (pz[k] + pz[k + 1]) / 2;
    const s = lightShaft({ from: [X - 0.3, Y + 8, z], to: [3, Y, z - 3], r0: 1.4, r1: 3.2, color: 0xbad2ff, intensity: 0.06 }); zone.add(s); ctx.shafts.push(s);
    const s2 = lightShaft({ from: [12, Y + 17, z], to: [-4, Y + 2, z - 2], r0: 1.6, r1: 3.6, color: 0xffe2b5, intensity: 0.07 }); zone.add(s2); ctx.shafts.push(s2);
  }
  zone.add(dust([0, Y, cz], [32, 22, 44], 700));
  // 灯光
  if (!HH) spot(zone, 0xffd6a0, 520, [0, Y + 21, -33], [0, Y, -50], 0.42, true, 60);
  if (!HH) spot(zone, 0xcfe0ff, 250, [14, Y + 11, -48], [-2, Y, -54], 0.55, true, 40);
  if (!HH) for (const z of [-36.5, -47.5, -58.5, -69.5]) for (const sx of [-1, 1]) point(zone, 0xffcf96, 22, [sx * 14.7, Y + 10.5, z], 10);
  if (!HH) rectLight(zone, 0xffe2c0, 4, 12, 40, [0, crownY - 1, cz], [0, Y, cz]);
  rectLight(zone, 0x7fb4ff, HH ? 3 : 6, 14, 6, [0, SY - SH / 2 - 0.4, SZ], [0, Y, SZ + 2]);
  // 吊灯
  for (const z of [-37, -48, -66, -71]) add(placeModel('chandelier', { height: 2.8, pos: [0, HH ? Y + 14.2 : crownY - 4.8, z] }));

  b.build(zone, M);
  for (const geo of b.colliders) world.addGeo(geo);
  world.surface(-X, Z1, X, Z0, 'marble');
  ctx.hallReflectY = Y;
}

// ---------------- R2 精修安检大厅（tools/blender/hall.py → bake_lm.py：Cycles 烘焙光照贴图 + 反射探针）----------------
function heroHall(zone, world, ctx, M) {
  const Y = FLOOR;
  ctx.heroHallJob = placeHero(zone, world, './assets/hero/hero_hall.glb', { mats: hallMats(), lm: './assets/hero/hero_hall_lm.webp', lmInPlace: true, lmOpts: { intensity: 1.0, rgbmRange: 8.0 }, castShadow: false, cut: [-1, 1].map((sx) => ({ mats: ['leatherBlack', 'steel'], box: [sx > 0 ? 14.2 : -15.6, Y - 0.2, -64.2, sx > 0 ? 15.6 : -14.2, Y + 1.3, -56.8] })) /* 批次33：两侧廊黑皮机场排椅（hall.py beam_seating ±14.9, z −59/−62）删掉，换 wait_bench_6080 */ });
  for (const sx of [-1, 1]) for (const z of [-59.0, -62.2]) placeModel('r2/wait_bench_6080', { width: 2.9, rotY: -sx * Math.PI / 2, pos: [sx * 14.95, Y, z] }).then((o) => { zone.add(o); world.boundsOf?.(o, 0.85); }); // 坐面朝中殿，两张成排
  ctx.hallFloorMats = [hallMats().floorNave, hallMats().marbleDark, hallMats().floorAisle];
  // 吊挂指示牌文字（牌体在 GLB 里，双面金字）
  const signs = [[0, Y + 6.2, -36.2, 7.2, 0.75, 0, '安 检 通 道　　SECURITY'], [-14.7, Y + 4.6, -50.5, 3.6, 0.6, Math.PI / 2, '← 人事档案馆'], [14.7, Y + 4.6, -46.0, 3.6, 0.6, Math.PI / 2, '东翼　市民服务 →'], [14.7, Y + 4.4, -70.5, 3.2, 0.6, Math.PI / 2, '人工复检']];
  for (const [x, y, z, w, h, yaw, txt] of signs) for (const side of [1, -1]) {
    const t = goldText(txt, w * 0.86, h * 0.5, M.goldBright, { res: 128 });
    const n = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(side * 0.05);
    // 牌在 Blender 局部 xz 平面（厚 0.08），法线为游戏 ±z（yaw 绕竖轴）
    t.position.set(x - n.z * 0 + (yaw ? side * 0.05 : 0), y, z + (yaw ? 0 : side * 0.05)); t.rotation.y = (yaw ? (side > 0 ? Math.PI / 2 : -Math.PI / 2) : (side > 0 ? 0 : Math.PI));
    zone.add(t);
  }
}

function roseWindow(b, zone, M, pos, r) {
  const [x, y, z] = pos;
  const f = new Frame([x, y, z - 0.35], 0);
  const glassTex = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffffff, emissiveMap: roseGlassTexture(), emissiveIntensity: 2.6, side: THREE.DoubleSide });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 64), glassTex); disc.position.set(x, y, z - 0.38); disc.rotation.y = Math.PI; zone.add(disc);
  b.add('stoneDark', new THREE.TorusGeometry(r + 0.25, 0.35, 8, 96), f.at(0, 0, 0), { uv: 0.5 });
  b.add('gold', new THREE.TorusGeometry(r + 0.62, 0.06, 6, 96), f.at(0, 0, 0), { uv: 1 });
  b.add('stoneDark', new THREE.TorusGeometry(r * 0.32, 0.14, 6, 48), f.at(0, 0, 0), { uv: 0.5 });
  b.add('stoneDark', new THREE.TorusGeometry(r * 0.68, 0.1, 6, 64), f.at(0, 0, 0), { uv: 0.5 });
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; b.add('stoneDark', new THREE.BoxGeometry(0.12, r * 0.68, 0.18), f.at(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66, 0, [0, 0, a - Math.PI / 2]), { uv: 1 }); }
  for (let k = 0; k < 16; k++) { const a = ((k + 0.5) / 16) * Math.PI * 2; b.add('stoneDark', new THREE.TorusGeometry(r * 0.13, 0.06, 6, 24), f.at(Math.cos(a) * r * 0.84, Math.sin(a) * r * 0.84, 0), { uv: 1 }); }
  // 外框方形墙
  const em = emblem(r * 0.22, M.goldBright, M.navy); em.position.set(x, y, z - 0.25); em.rotation.y = Math.PI; zone.add(em);
}

// =============================== 人事档案馆 ===============================
function buildArchive(zone, zoneB1, world, ctx, M, add, addB1) {
  const b = new Batch();
  const X0 = -56, X1 = -20, Z0 = -32, Z1 = -70, H = 13, GY = Y + 6.2;
  const cz = (Z0 + Z1) / 2, cx = (X0 + X1) / 2, W = X1 - X0, L = Z0 - Z1;
  // 连廊（大厅西门 → 档案馆东门）
  b.box('terrazzo', 2.8, 0.1, 8, [-18.6, Y - 0.05, -51.5], { uv: 0.8, collide: true });
  b.box('wallStone', 2.8, 0.4, 8.6, [-18.6, Y + 8.2, -51.5], { uv: 0.3 });
  for (const ez of [-1, 1]) b.box('wallStone', 2.8, 8.4, 0.4, [-18.6, Y + 4.2, -51.5 + ez * 4.2], { uv: 0.3, collide: true });
  // 地面
  const HOLE = { x0: -34.6, x1: -24.3, z0: -35.3, z1: -37.5 };
  ctx.b1Hole = HOLE;
  slabWithHole(b, 'woodFloor', X0, X1, Z0, Z1, Y - 0.1, 0.1, HOLE, true);
  // 地毯：见 dressing.js（带边框图案的长地毯）
  // 墙
  wallX(b, 'wallPlaster', X1 + 0.2, Z0, Z1, Y, H, 0.4, [{ z0: -48, z1: -55, h: 5.2 }], true);
  wallX(b, 'wallPlaster', X0 - 0.2, Z0, Z1, Y, H, 0.4, [], true);
  wallZ(b, 'wallPlaster', Z0 + 0.2, X0, X1, Y, H, 0.4, [], true);
  wallZ(b, 'wallPlaster', Z1 - 0.2, X0, X1, Y, H, 0.4, [], true);
  // 墙裙木护板
  for (const [x0, z0, x1, z1] of [[X0, Z0, X1, Z0], [X0, Z1, X1, Z1]]) b.box('wood', x1 - x0, 1.2, 0.08, [(x0 + x1) / 2, Y + 0.6, z0 + (z0 === Z0 ? -0.04 : 0.04)], { uv: 0.5 });
  // 天花：木质藻井 + 铁桁架
  b.box('wood', W, 0.3, L, [cx, Y + H + 0.15, cz], { uv: 0.3 });
  for (let x = X0 + 3; x < X1; x += 3) b.box('wood', 0.3, 0.6, L, [x, Y + H - 0.3, cz], { uv: 0.5 });
  for (let z = Z1 + 3; z < Z0; z += 3) b.box('wood', W, 0.6, 0.3, [cx, Y + H - 0.3, z], { uv: 0.5 });
  for (let z = Z1 + 6; z < Z0 - 2; z += 6) { // 铁桁架
    b.box('iron', W, 0.25, 0.25, [cx, Y + H - 1.6, z], { uv: 1 });
    for (let x = X0 + 2; x < X1; x += 2) b.box('iron', 0.08, 1.3, 0.08, [x, Y + H - 0.95, z], { uv: 1, rot: [0, 0, (x / 2) % 2 ? 0.6 : -0.6] });
  }
  // 西墙高窗（日光）
  for (let k = 0; k < 4; k++) {
    const z = Z1 + 6 + k * 8.6;
    const f = new Frame([X0 + 0.02, Y, z], Math.PI / 2);
    b.add('glassIn', new THREE.ShapeGeometry(archShape(2.0, 3.3)), f.at(0, 7.4, 0), { uv: false });
    b.add('stoneDark', archRingGeo(2.6, 3.3, 2.0, 3.3, 0.3), f.at(0, 7.4, 0.12), { uv: 0.6 });
    b.add('gold', archRingGeo(2.7, 3.3, 2.6, 3.3, 0.32), f.at(0, 7.4, 0.12), { uv: 1 });
    const s = lightShaft({ from: [X0 + 0.3, Y + 10, z], to: [X0 + 13, Y, z + 2], r0: 1.1, r1: 2.6, color: 0xffe5bb, intensity: 0.014 }); zone.add(s); (ctx.shafts = ctx.shafts ?? []).push(s);
  }
  // —— 二层回廊（铸铁）——
  const GW = 2.6;
  const gal = [[X0, Z0 - GW, X1 - 3, Z0], [X0, Z1, -33.8, Z1 + GW], [X0, Z1 + GW, X0 + GW, Z0 - GW]];
  for (const [x0, z0, x1, z1] of gal) {
    b.box('woodFloor', x1 - x0, 0.25, z1 - z0, [(x0 + x1) / 2, GY - 0.125, (z0 + z1) / 2], { uv: 0.4, collide: true });
    b.box('iron', x1 - x0, 0.3, 0.1, [(x0 + x1) / 2, GY - 0.4, z0 === Z0 - GW ? z0 : z1], { uv: 1 });
  }
  // 栏杆（回廊内沿）
  const railLine = (a, c) => {
    const A = new THREE.Vector3(...a), C = new THREE.Vector3(...c); const len = A.distanceTo(C); const n = Math.floor(len / 0.25);
    const mid = A.clone().add(C).multiplyScalar(0.5); const yaw = Math.atan2(C.x - A.x, C.z - A.z);
    b.add('brass', new THREE.BoxGeometry(0.07, 0.07, len), { pos: [mid.x, GY + 1.05, mid.z], rot: [0, yaw, 0] }, { uv: 1 });
    b.add('iron', new THREE.BoxGeometry(0.05, 0.05, len), { pos: [mid.x, GY + 0.12, mid.z], rot: [0, yaw, 0] }, { uv: 1 });
    for (let i = 0; i <= n; i++) { const p = A.clone().lerp(C, i / n); b.add('iron', new THREE.CylinderGeometry(0.015, 0.015, 0.95, 5), { pos: [p.x, GY + 0.58, p.z] }, { uv: 1 }); if (i % 4 === 0) b.add('iron', new THREE.TorusGeometry(0.1, 0.012, 4, 12), { pos: [p.x, GY + 0.6, p.z], rot: [0, yaw + Math.PI / 2, 0] }, { uv: 1 }); }
    world.box(mid.x, GY + 0.55, mid.z, Math.abs(C.x - A.x) + 0.1, 1.1, Math.abs(C.z - A.z) + 0.1);
  };
  railLine([X0 + GW, GY, Z0 - GW], [X1 - 3, GY, Z0 - GW]);
  railLine([X0 + GW, GY, Z1 + GW], [-33.8, GY, Z1 + GW]);
  railLine([X0 + GW, GY, Z1 + GW], [X0 + GW, GY, Z0 - GW]);
  railLine([X1 - 3, GY, Z0 - GW], [X1 - 3, GY, Z0]);
  // 铸铁立柱
  for (let x = X0 + GW; x <= X1 - 3; x += 5.4) for (const z of [Z0 - GW, Z1 + GW]) { if (z === Z1 + GW && x > -34) continue; b.add('iron', new THREE.CylinderGeometry(0.1, 0.12, 6.2, 10), { pos: [x, Y + 3.1, z] }, { uv: 1, collide: true }); b.add('brass', new THREE.CylinderGeometry(0.2, 0.12, 0.3, 10), { pos: [x, GY - 0.6, z] }, { uv: 1 }); }
  // 楼梯：北侧沿墙，从 (x -27.4, z -66.1) 向西上到二层
  { const sx0 = X1 - 3.4, z = Z1 + 1.3, steps = 34, run = 0.3, rise = 6.2 / steps;
    for (let i = 0; i < steps; i++) b.box('wood', run + 0.02, rise, GW - 0.2, [sx0 - (i + 0.5) * run - 3.0 + 3.0, Y + rise * (i + 0.5), z], { uv: 0.5 });
    // 楼梯下方实体
    world.ramp([sx0 + 0.1, Y - 0.02, z], [sx0 - steps * run, GY + 0.0, z], GW - 0.3);
    b.box('iron', steps * run, 0.08, 0.08, [sx0 - (steps * run) / 2, Y + 3.1 + 1.0, z + GW / 2 - 0.15], { uv: 1, rot: [0, 0, Math.atan2(6.2, steps * run)] });
    ctx.archiveStairTop = new THREE.Vector3(sx0 - steps * run, GY, z);
  }
  // —— 抽屉式档案柜墙（一层南北两墙）——
  const drawerWall = (x0, x1, z, face) => {
    const w = x1 - x0, h = 5.6;
    b.box('wood', w, h, 0.7, [(x0 + x1) / 2, Y + h / 2 + 0.2, z + face * 0.35], { uv: 0.5, collide: true });
    const cols = Math.floor(w / 0.62), rows = 12;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const x = x0 + 0.31 + i * (w / cols), y = Y + 0.5 + j * 0.44;
      b.box('wood', w / cols - 0.05, 0.4, 0.04, [x, y, z + face * 0.72], { uv: 1.5 });
      b.box('brass', 0.14, 0.06, 0.03, [x, y + 0.08, z + face * 0.75], { uv: 1 });
      b.box('brass', 0.12, 0.02, 0.05, [x, y - 0.06, z + face * 0.76], { uv: 1 });
    }
    b.box('wood', w + 0.1, 0.25, 0.85, [(x0 + x1) / 2, Y + h + 0.3, z + face * 0.42], { uv: 0.5 });
  };
  drawerWall(X0 + 0.5, X1 - 0.5, Z0 - 0.2, -1);
  drawerWall(X0 + 0.5, -34.6, Z1 + 0.2, 1);
  // 二层：档案盒书架（南北墙）
  const shelfWall = (x0, x1, z, face) => {
    const w = x1 - x0;
    b.box('wood', w, 5.6, 0.5, [(x0 + x1) / 2, GY + 2.8, z + face * 0.25], { uv: 0.5 });
    for (let j = 0; j < 6; j++) b.box('wood', w, 0.05, 0.55, [(x0 + x1) / 2, GY + 0.3 + j * 0.9, z + face * 0.3], { uv: 1 });
  };
  shelfWall(X0 + 0.3, X1 - 0.3, Z0 - 0.2, -1);
  shelfWall(X0 + 0.3, X1 - 0.3, Z1 + 0.2, 1);
  // 档案盒（实例化）
  const boxGeo = new THREE.BoxGeometry(0.1, 0.32, 0.36);
  const boxes = new THREE.InstancedMesh(boxGeo, M.kraftDark, 2400); let nb = 0; const m4 = new THREE.Matrix4();
  for (const [z, face] of [[Z0 - 0.2, -1], [Z1 + 0.2, 1]]) for (let j = 0; j < 6; j++) for (let x = X0 + 0.5; x < X1 - 0.5 && nb < 2400; x += 0.11 + (Math.random() < 0.05 ? 0.2 : 0)) {
    const hh = 0.28 + Math.random() * 0.08;
    m4.compose(new THREE.Vector3(x, GY + 0.33 + j * 0.9 + hh / 2, z + face * 0.3), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (Math.random() - 0.5) * 0.06), new THREE.Vector3(1, hh / 0.32, 1)); boxes.setMatrixAt(nb++, m4);
  }
  boxes.count = nb; boxes.castShadow = true; boxes.receiveShadow = true; zone.add(boxes);
  // —— 阅览长桌 + 绿罩台灯 ——
  ctx.archiveLamps = [];
  for (let r = 0; r < 4; r++) for (const sx of [-1, 1]) {
    const tx = cx + sx * 6.5, tz = Z0 - 9.5 - r * 7;
    if (tz < Z1 + 6) continue;
    // 批次32：阅览长桌方块（板 + 绿呢 + 4 方腿 + 横枨）→ Blender 精建 r2/reading_table_6080（胡桃木桌面 + 内嵌绿呢铜压条 + 牙板线脚 + 6 只车削腿铜脚套 + 落地横枨；tools/blender/hall_props.py reading_table），桌面顶 0.82 不变
    add(placeModel('r2/reading_table_6080', { width: 5.63, pos: [tx, Y, tz] }).then((o) => { o.traverse((m) => { if (m.isMesh) m.castShadow = m.receiveShadow = true; }); return o; }));
    world.box(tx, Y + 0.4, tz, 5.6, 0.8, 1.5);
    for (const ex of [-1.4, 1.4]) { bankerLamp(b, zone, M, tx + ex, Y + 0.82, tz); ctx.archiveLamps.push([tx + ex, tz]); }
    for (const ex of [-1.6, 0, 1.6]) for (const ez of [-1, 1]) woodChair(b, tx + ex, Y, tz + ez * 1.05, ez);
    // 桌面散落档案
    if (r % 2 === 0) add(placeModel('binder', { width: 0.42, pos: [tx - 0.6 * sx, Y + 0.83, tz + 0.2], rotY: 0.3 }));
  }
  // 移动梯（靠北墙档案柜）
  { const lx = -42, lz = Z0 - 1.5; for (const ex of [-1, 1]) b.box('wood', 0.06, 5.2, 0.06, [lx + ex * 0.25, Y + 2.6, lz], { uv: 1, rot: [0.18, 0, 0] }); for (let k = 0; k < 14; k++) b.box('brass', 0.5, 0.03, 0.03, [lx, Y + 0.3 + k * 0.36, lz + 0.05 - k * 0.065], { uv: 1 }); b.box('brass', 3, 0.04, 0.04, [lx, Y + 5.3, Z0 - 0.72], { uv: 1 }); }
  // —— 管理员柜台（西端）——
  const kx = X0 + 6, kz = -51.5;
  // 批次32：借阅柜台方块 → Blender 精建 r2/loan_counter_6080（公众面 +X：胡桃木 7 间凸起芯板 + 铜钮 + 铜踢脚 + 铜扶脚杆；黑石台面铜包边；职员面开放格架），台面顶对齐原 Y+1.11
  world.box(kx, Y + 0.525, kz, 1.2, 1.05, 7);
  add(placeModel('r2/loan_counter_6080', { width: 7.21, pos: [kx, Y - 0.02, kz], rotY: Math.PI / 2 }).then((o) => { o.traverse((m) => { if (m.isMesh) m.castShadow = m.receiveShadow = true; }); return o; }));
  // 台面：登记簿（摊开）、印章、放大镜、订书机、显示器
  const ledger = new THREE.Group();
  for (const s of [-1, 1]) { const pg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.025, 0.42), new THREE.MeshStandardMaterial({ map: ledgerTexture(), roughness: 0.85 })); pg.position.set(0, 0.012, s * 0.215); pg.rotation.x = s * 0.06; ledger.add(pg); }
  const cov = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.88), M.leather); cov.position.y = -0.005; ledger.add(cov);
  ledger.position.set(kx + 0.05, Y + 1.11, kz + 2.4); ledger.rotation.y = Math.PI / 2 * 0; zone.add(ledger); ctx.ledger = ledger;
  add(placeModel('magnifier', { height: 0.27, pos: [kx + 0.3, Y + 1.11, kz + 1.6], rotZ: Math.PI / 2 }));
  add(placeModel('stapler', { width: 0.2, pos: [kx + 0.2, Y + 1.11, kz - 1.2], rotY: 0.6 }));
  add(placeModel('stationery', { width: 0.3, pos: [kx + 0.1, Y + 1.11, kz - 2.2] }));
  add(placeModel('desk_lamp', { height: 0.7, pos: [kx - 0.2, Y + 1.11, kz - 2.9], rotY: -Math.PI / 2 }));
  b.box('blackMetal', 0.06, 0.38, 0.6, [kx - 0.3, Y + 1.36, kz + 0.6], { uv: 1 });
  b.box('blackMetal', 0.2, 0.12, 0.2, [kx - 0.3, Y + 1.14, kz + 0.6], { uv: 1 });
  const mon = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.32), new THREE.MeshStandardMaterial({ color: 0, emissive: 0x7aa8d8, emissiveIntensity: 0.9 })); mon.position.set(kx - 0.26, Y + 1.37, kz + 0.6); mon.rotation.y = Math.PI / 2; zone.add(mon);
  const note = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.09), stickyMaterial()); note.position.set(kx - 0.255, Y + 1.5, kz + 0.84); note.rotation.y = Math.PI / 2; note.rotation.z = 0.12; zone.add(note); ctx.stickyNote = note;
  // 印章
  b.add('wood', new THREE.CylinderGeometry(0.03, 0.035, 0.09, 12), { pos: [kx + 0.3, Y + 1.155, kz - 0.4] }, { uv: 1 });
  b.add('waxRed', new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12), { pos: [kx + 0.3, Y + 1.12, kz - 0.4] }, { uv: 1 });
  // 档案推车（牛皮纸档案袋堆）
  const cart = new THREE.Group(); cart.position.set(kx + 1.9, Y, kz - 4.6); // R3 批次3：原 +2.2 压到阅览桌端
  for (const yy of [0.3, 0.8]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.6), M.blackMetal); sh.position.y = yy; cart.add(sh); }
  for (const ex of [-1, 1]) for (const ez of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9), M.steel); p.position.set(ex * 0.58, 0.45, ez * 0.28); cart.add(p); const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12), M.rubber); wh.rotation.x = Math.PI / 2; wh.position.set(ex * 0.55, 0.05, ez * 0.26); cart.add(wh); }
  const env = envelopeMesh(M); 
  for (let k = 0; k < 14; k++) { const e = env.clone(); e.position.set(-0.35 + (k % 3) * 0.35, (k < 7 ? 0.33 : 0.83) + Math.floor((k % 7) / 3) * 0.02, -0.05 + Math.random() * 0.1); e.rotation.y = (Math.random() - 0.5) * 0.3; cart.add(e); }
  cart.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); zone.add(cart); world.box(kx + 1.9, Y + 0.45, kz - 4.6, 1.3, 0.9, 0.7);
  // 柜台后档案柜（GLB）
  for (let k = 0; k < 4; k++) add(placeModel('file_cabinet', { height: 1.45, pos: [X0 + 1.0, Y, kz - 3 + k * 2], rotY: Math.PI / 2 }));
  add(placeModel('filing_cabinets', { maxDim: 6.5, pos: [X0 + 4.6, Y, Z1 + 6.5], rotY: 0 }).then((o) => { world.boundsOf(o, 0.85); return o; }));
  // 叶寻与影子
  const yx = person(M, { coat: 0x2a2620, clue: 'chair', name: '叶寻' }); yx.position.set(kx - 1.1, Y, kz); yx.rotation.y = Math.PI / 2; zone.add(yx); ctx.yexun = yx;
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.82, depthWrite: false });
  const sh = person(M, { coat: 0x000000, material: shadowMat, clue: 'shadow' }); sh.position.copy(yx.position); sh.position.x -= 0.5; sh.visible = false; zone.add(sh); ctx.yexunShadow = sh;
  // 档案馆入口规章铜牌（东门右侧）
  const art = content.tex('tex_archive_rules');
  const arm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), art ? new THREE.MeshStandardMaterial({ map: art, metalness: 0.5, roughness: 0.4 }) : brassPlaqueMaterial('阅览规章', ['一、调阅须登记', '二、禁止涂改档案', '三、档号即身份', '四、勿在馆内念出已归档者之名']));
  arm.position.set(-17.2 - 0.02 - 1.2, Y + 1.8, -51.5 - 4.0 + 0.21); zone.add(arm); ctx.archiveRules = arm;
  // 门（双开木门，敞开）
  for (const ez of [-1, 1]) { const d = new THREE.Mesh(new THREE.BoxGeometry(3.4, 5, 0.1), M.wood); d.position.set(X1 - 1.8, Y + 2.5, -51.5 + ez * 3.45); d.castShadow = true; zone.add(d); }
  const title = goldText('人事档案馆', 3.4, 0.6, M.goldBright, { res: 128 }); title.position.set(X1 + 0.45, Y + 6.2, -51.5); title.rotation.y = Math.PI / 2; ctx.zones.security_hall.add(title);
  // 二层：公开叙事者档案陈列柜
  const pubIds = (content.m.documents ?? []).filter((d) => d.type === 'personnel_file').map((d) => d.id);
  const ids = pubIds.length ? pubIds : Array.from({ length: 12 }, (_, i) => `doc_archive_pub_${i}`);
  ctx.pubCases = [];
  ids.forEach((id, i) => {
    let x, z, rot;
    const nS = 11;
    if (i < nS) { x = X0 + GW + 1.6 + i * 2.75; z = Z0 - 0.95; rot = Math.PI; }
    else if (i < nS + 7) { x = X0 + GW + 1.6 + (i - nS) * 2.75; z = Z1 + 0.95; rot = 0; }
    else { x = X0 + 0.95; z = -44 - (i - nS - 7) * 8; rot = Math.PI / 2; }
    const d = content.get(id); const t = d?.texture ? content.tex(d.texture) : null;
    const grp = new THREE.Group();
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.6, 0.12), M.blackMarble); back.position.y = 1.5; grp.add(back);
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 2.2), t ? new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.18 }) : posterMaterial(d?.title?.split('·').pop()?.trim() ?? '档案', '登记叙事者'));
    poster.position.set(0, 1.55, 0.07); grp.add(poster);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.34, 2.3, 0.04), M.brass); frame.position.set(0, 1.55, 0.05); grp.add(frame);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.6, 0.5), M.glassClear); glass.position.set(0, 1.5, 0.3); grp.add(glass);
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.02), M.brass); card.position.set(0, 0.25, 0.3); card.rotation.x = -0.4; grp.add(card);
    grp.position.set(x, GY, z); grp.rotation.y = rot; zone.add(grp);
    grp.traverse((o) => { if (o.isMesh && o !== glass) { o.castShadow = true; o.receiveShadow = true; } });
    ctx.pubCases.push({ id, obj: poster, grp });
  });
  const pubIntro = brassPlaqueMaterial('登记叙事者公开档案', ['本廊陈列经审定可公开之', '登记叙事者档案摘要', '请勿拍照　请勿触碰玻璃']);
  const pim = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), pubIntro); pim.position.set(X1 - 3.6, GY + 1.6, Z0 - 0.45); pim.rotation.y = Math.PI; zone.add(pim); ctx.pubIntro = pim;
  // 灯光
  for (const [lx, lz] of ctx.archiveLamps) point(zone, 0xffd59a, 3.2, [lx, Y + 1.3, lz], 4.5);
  for (let z = Z1 + 6; z < Z0; z += 9) add(placeModel('chandelier', { height: 1.8, pos: [cx + 2, Y + H - 2.4, z] }));
  for (let z = Z1 + 6; z < Z0; z += 9) point(zone, 0xffcf96, 15, [cx + 2, Y + H - 3.0, z], 16);
  spot(zone, 0xffe6c0, 30, [X0 + 1, Y + 11, -44], [X0 + 14, Y, -40], 0.45, true, 24);
  spot(zone, 0xffd8a0, 30, [kx + 3, Y + 9, kz], [kx, Y + 1, kz], 0.4, false, 14);
  rectLight(zone, 0xffe6c8, 0.35, W - 4, L - 4, [cx, Y + H - 0.4, cz], [cx, Y, cz]);
  zone.add(dust([cx, Y, cz], [W, H, L], 500));

  // ——— 楼梯下 B1 ———
  const BY = Y - 6.0; // B1 地坪 -4.2
  ctx.b1Y = BY;
  { const xT = HOLE.x1 - 0.1, z = (HOLE.z0 + HOLE.z1) / 2, steps = 33, run = 0.3, rise = 6.0 / steps;
    for (let i = 0; i < steps; i++) b.box('concrete', run + 0.02, 0.2, 2.2, [xT - (i + 0.5) * run, Y - rise * (i + 1) - 0.0, z], { uv: 0.6 });
    world.ramp([xT + 0.2, Y + 0.0, z], [xT - steps * run, BY + 0.0, z], 2.0);
    // 洞口栏杆（北、东侧不封，西端封）
    b.box('iron', HOLE.x1 - HOLE.x0, 0.06, 0.06, [(HOLE.x0 + HOLE.x1) / 2, Y + 1.0, HOLE.z1], { uv: 1 });
    b.box('iron', HOLE.x1 - HOLE.x0, 0.06, 0.06, [(HOLE.x0 + HOLE.x1) / 2, Y + 1.0, HOLE.z0], { uv: 1 });
    b.box('iron', 0.06, 0.06, HOLE.z0 - HOLE.z1, [HOLE.x0, Y + 1.0, z], { uv: 1 });
    for (let x = HOLE.x0; x <= HOLE.x1 - 1.2; x += 0.5) for (const zz of [HOLE.z0, HOLE.z1]) b.box('iron', 0.025, 1.0, 0.025, [x, Y + 0.5, zz], { uv: 1 });
    world.box((HOLE.x0 + HOLE.x1) / 2 - 0.6, Y + 0.5, HOLE.z1, HOLE.x1 - HOLE.x0 - 1.2, 1.0, 0.1);
    world.box((HOLE.x0 + HOLE.x1) / 2 - 0.6, Y + 0.5, HOLE.z0, HOLE.x1 - HOLE.x0 - 1.2, 1.0, 0.1);
    world.box(HOLE.x0, Y + 0.5, z, 0.1, 1.0, 2.2);
    // 楼梯井侧墙
    // 钢梯梁 + 栏杆（B1 内可见，不挡视线）；梯下以阶梯状碰撞块封住
    const sl = Math.atan2(6.0, steps * run);
    for (const zz of [HOLE.z0 + 0.05, HOLE.z1 - 0.05]) {
      b.add('blackMetal', new THREE.BoxGeometry(steps * run + 0.4, 0.3, 0.08), { pos: [xT - (steps * run) / 2, (Y + BY) / 2 - 0.15, zz], rot: [0, 0, sl] }, { uv: 1 });
      b.add('brass', new THREE.BoxGeometry(steps * run + 0.2, 0.05, 0.05), { pos: [xT - (steps * run) / 2, (Y + BY) / 2 + 0.9, zz], rot: [0, 0, sl] }, { uv: 1 });
      for (let i = 0; i <= steps; i += 3) b.box('iron', 0.025, 0.95, 0.025, [xT - i * run, Y - rise * i + 0.45, zz], { uv: 1 });
    }
    for (let k = 0; k < 6; k++) { const xa = xT - k * (steps * run / 6), xb = xa - steps * run / 6; const top = Y - ((xT - xa) / run) * rise - 0.35; if (top - BY > 0.3) world.box((xa + xb) / 2, (top + BY) / 2, z, Math.abs(xb - xa), top - BY, 2.1); }
    const wf = goldText('B1　密集库　↓', 1.8, 0.3, M.goldBright, { res: 96 }); wf.position.set(HOLE.x1 + 0.3, Y + 2.4, HOLE.z1 - 0.06); wf.rotation.y = 0; zone.add(wf);
    b.box('blackMetal', 0.08, 2.6, 0.08, [HOLE.x1 + 0.3, Y + 1.3, HOLE.z1 - 0.1], { uv: 1 });
    ctx.b1StairTop = new THREE.Vector3(xT, Y, z);
  }
  buildB1(zoneB1, world, ctx, M, addB1, X0, X1, Z0, Z1, BY);

  b.build(zone, M);
  for (const geo of b.colliders) world.addGeo(geo);
  world.surface(X0, Z1, X1, Z0, 'wood', Y - 0.5, Y + 5);
  world.surface(X0, Z1, X1, Z0, 'wood', GY - 0.5, GY + 4);
  world.surface(-20, -56, -17, -47, 'stone');
}

function buildB1(zone, world, ctx, M, add, X0, X1, Z0, Z1, BY) {
  const b = new Batch();
  const H = 5.2, cz = (Z0 + Z1) / 2, cx = (X0 + X1) / 2, W = X1 - X0, L = Z0 - Z1;
  b.box('concrete', W, 0.2, L, [cx, BY - 0.1, cz], { uv: 0.3, collide: true });
  b.box('terrazzo', W, 0.02, 4.6, [cx, BY + 0.01, Z0 - 5.4], { uv: 1.0 });
  slabWithHole(b, 'concrete', X0, X1, Z0, Z1, BY + H, 0.3, ctx.b1Hole, false);
  wallX(b, 'concrete', X0 - 0.2, Z0, Z1, BY, H, 0.4, [], true);
  wallX(b, 'concrete', X1 + 0.2, Z0, Z1, BY, H, 0.4, [], true);
  wallZ(b, 'concrete', Z0 + 0.2, X0, X1, BY, H, 0.4, [], true);
  wallZ(b, 'concrete', Z1 - 0.2, X0, X1, BY, H, 0.4, [], true);
  // 地面导轨
  // 密集架 12 排：沿 z 方向长，端头面向北侧通道（z = Z0-7.7）
  const rowZ0 = Z0 - 7.8, rowZ1 = Z1 + 1.2, rowLen = rowZ0 - rowZ1;
  ctx.compactRows = [];
  for (let i = 0; i < 12; i++) {
    const x = X0 + 4.5 + i * 2.35;
    const grp = new THREE.Group();
    const lb = new Batch();
    lb.box('paintedGreen', 1.9, 2.8, rowLen, [0, 1.4 + 0.08, -rowLen / 2], { uv: 0.4 });
    lb.box('paintedSteel', 2.0, 3.0, 0.12, [0, 1.5, 0.06], { uv: 0.6 }); // 端板
    lb.box('blackMetal', 2.0, 0.12, rowLen + 0.1, [0, 0.06, -rowLen / 2], { uv: 1 });
    lb.box('gold', 1.6, 0.04, 0.02, [0, 2.75, 0.13], { uv: 1 });
    // M4：端板细节——凹线分格、黄铜卡槽（索引卡）、踢脚护板、推拉把手
    for (const yy of [0.55, 2.55]) lb.box('blackMetal', 1.9, 0.02, 0.01, [0, yy, 0.125], { uv: 1 });
    for (const xx of [-0.92, 0.92]) lb.box('blackMetal', 0.02, 2.0, 0.01, [xx, 1.55, 0.125], { uv: 1 });
    lb.box('brass', 0.62, 0.36, 0.015, [0.35, 1.95, 0.128], { uv: 1 }); lb.box('steel', 1.96, 0.3, 0.02, [0, 0.27, 0.13], { uv: 1 });
    for (const yy of [1.05, 1.5]) lb.box('steel', 0.04, 0.22, 0.05, [-0.85, yy, 0.15], { uv: 1 });
    lb.build(grp, M);
    { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 150; const c = cv.getContext('2d'); c.fillStyle = '#ece4cc'; c.fillRect(0, 0, 256, 150); c.fillStyle = '#7a1a1a'; c.fillRect(0, 0, 256, 26); c.fillStyle = '#fff'; c.font = '700 20px "NB Sans", sans-serif'; c.fillText(`第 ${String(i + 1).padStart(2, '0')} 排`, 10, 20); c.fillStyle = '#2a241c'; c.font = '18px "NB Sans", sans-serif'; c.fillText(['人事卷宗', '外勤记录', '叙事者备案', '考务档案', '收容登记', '联络函件', '（空）', '离职归档', '内部审查', '证物清单', '市民来信', '其他'][i], 10, 60); c.fillText(`07-${String(2016 + i)}　至　07-${String(2020 + i)}`, 10, 92); c.fillStyle = '#8a8070'; c.fillText(i === 6 ? '请勿调阅' : '管理员：叶寻', 10, 128); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const card = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.3), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })); card.position.set(0.35, 1.95, 0.137); grp.add(card); }
    // 手摇轮
    const wheel = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.025, 8, 32), M.steel); wheel.add(rim);
    for (let k = 0; k < 3; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.02), M.steel); sp.rotation.z = (k / 3) * Math.PI; wheel.add(sp); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12), M.steel); hub.rotation.x = Math.PI / 2; wheel.add(hub);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), M.rubber); handle.rotation.x = Math.PI / 2; handle.position.set(0.24, 0, 0.06); wheel.add(handle);
    wheel.position.set(0.4, 1.25, 0.16); grp.add(wheel);
    // 编号牌
    const num = goldText(String(i + 1).padStart(2, '0'), 0.5, 0.36, M.goldBright, { res: 96, font: '"NB Sans", sans-serif' }); num.position.set(-0.45, 2.3, 0.13); grp.add(num);
    // 档案盒侧面（可见于开缝）
    grp.position.set(x, BY, rowZ0); zone.add(grp);
    grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    world.box(x, BY + 1.5, rowZ0 - rowLen / 2, 2.0, 3.0, rowLen);
    ctx.compactRows.push({ grp, x, wheel });
  }
  // 第 7 排控制面板（四位拨盘）
  const r7 = ctx.compactRows[6];
  const panel = new THREE.Group();
  const pb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.06), M.blackMetal); panel.add(pb);
  for (let k = 0; k < 4; k++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16), M.brass); d.rotation.x = Math.PI / 2; d.position.set(-0.15 + k * 0.1, -0.03, 0.04); panel.add(d); }
  const led = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.06), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff5040, emissiveIntensity: 1.6 })); led.position.set(0, 0.08, 0.035); panel.add(led);
  panel.position.set(-0.45, 1.5, 0.15); r7.grp.add(panel); ctx.compactPanel = panel; ctx.compactLed = led;
  // 装订线缝隙（第 7 排开启后可见）：纸背 + 暗红线 + 铜牌「柒」
  const seam = new THREE.Group();
  const paperBack = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3.2), new THREE.MeshStandardMaterial({ color: 0xd8c8a4, roughness: 0.95, emissive: 0x2a1408, emissiveIntensity: 0.4, side: THREE.DoubleSide })); paperBack.position.set(0, 1.6, -3.5); seam.add(paperBack);
  const thread = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 3.3, -3.4), new THREE.Vector3(0.05, 2.4, -2.4), new THREE.Vector3(-0.04, 1.6, -1.2), new THREE.Vector3(0.02, 1.2, 0.2)]), 40, 0.012, 6), M.redThread); seam.add(thread);
  const plate = goldText('柒', 0.16, 0.16, M.brass, { res: 64 }); plate.position.set(0, 1.55, -3.48); seam.add(plate);
  const glow = new THREE.PointLight(0xff3b2b, 0, 4, 2); glow.position.set(0, 1.6, -2.0); seam.add(glow);
  seam.position.set(r7.x + 1.17, BY, rowZ0); seam.visible = false; zone.add(seam); ctx.seam = seam; ctx.seamGlow = glow; ctx.seamThread = thread;
  // 冷光灯管
  for (let k = 0; k < 5; k++) for (let z = Z0 - 2; z > Z1; z -= 7) b.box('lampCold', 0.12, 0.05, 2.2, [X0 + 5 + k * 6.5, BY + H - 0.05, z], { uv: false });
  for (let k = 0; k < 3; k++) rectLight(zone, 0xdfe8ff, 2.2, 6, L - 4, [X0 + 6 + k * 12, BY + H - 0.1, cz], [X0 + 6 + k * 12, BY, cz]);
  // B1 灯在楼板下方，无阴影的点光会穿过楼板照亮档案馆南墙（R2 白光溢出）→ 标为分区补光，只在 B1 生效
  point(zone, 0xcfe0ff, 20, [cx, BY + 3.6, Z0 - 5], 14).userData.isFill = true;
  spot(zone, 0xe8f0ff, 200, [r7.x + 2, BY + 4.8, Z0 - 4.5], [r7.x, BY + 1, rowZ0], 0.5, true, 16).userData.isFill = true;
  // 管线
  for (const z of [Z0 - 1, Z0 - 2]) b.box('steel', W, 0.16, 0.16, [cx, BY + H - 0.4, z], { uv: 1 });
  add(placeModel('box_stack', { width: 1.2, pos: [X1 - 1.5, BY, Z0 - 2] }));
  add(placeModel('cardboard_box', { height: 0.35, pos: [X1 - 2.9, BY, Z0 - 1.8], rotY: 0.4 }));
  add(placeModel('worn_rack', { height: 1.9, pos: [X1 - 1.0, BY, Z0 - 5], rotY: -Math.PI / 2 }).then((o) => { world.boundsOf(o, 0.8); return o; }));
  b.build(zone, M);
  for (const geo of b.colliders) world.addGeo(geo);
  world.surface(X0, Z1, X1, Z0, 'stone', BY - 1, BY + 3);
}

// ——— 小件与材质 ———
export function woodChair(b, x, y, z, face) {
  b.box('wood', 0.46, 0.05, 0.44, [x, y + 0.46, z], { uv: 2 });
  for (const ex of [-1, 1]) for (const ez of [-1, 1]) b.box('wood', 0.045, 0.46, 0.045, [x + ex * 0.2, y + 0.23, z + ez * 0.19], { uv: 2 });
  for (const ex of [-1, 1]) b.box('wood', 0.045, 0.5, 0.045, [x + ex * 0.2, y + 0.72, z + face * 0.2], { uv: 2 });
  b.box('wood', 0.44, 0.22, 0.03, [x, y + 0.86, z + face * 0.2], { uv: 2 });
  b.box('leather', 0.4, 0.03, 0.38, [x, y + 0.5, z], { uv: 2 });
}
export function bankerLamp(b, zone, M, x, y, z) {
  b.add('brass', new THREE.CylinderGeometry(0.09, 0.11, 0.03, 16), { pos: [x, y + 0.015, z] }, { uv: 1 });
  b.add('brass', new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8), { pos: [x, y + 0.18, z] }, { uv: 1 });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 16, 1, true, 0, Math.PI), M.lampGreen); shade.rotation.set(0, 0, Math.PI / 2); shade.position.set(x, y + 0.36, z); shade.scale.set(0.7, 1, 1); zone.add(shade);
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.1), M.lampWarm); bulb.position.set(x, y + 0.33, z); zone.add(bulb);
}
export function envelopeMesh(M, withString = true) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.012, 0.36), M.kraft); g.add(body);
  if (withString) {
    for (const zz of [0.06, -0.06]) { const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.004, 12), M.kraftDark); btn.position.set(0, 0.008, zz + 0.1); g.add(btn); }
  }
  return g;
}
// 批次12（用户 2026-10-30 22:16 要求「游戏里不要放人物模型」）：person() 不再生成人形，只返回一个占位 Group（位置/朝向/剧情逻辑照旧可用）。
// clue 给出「人不在、但有人在此」的非人物线索：'chair' 空椅 + 椅背搭着外套（+ 名牌）、'coat' 衣帽架挂外套/帽（+ 名牌）、'hanger' 挂着的制服（无头无手）、'shadow' 地面一摊墨影。
// 不给 clue = 什么都不画（路人、人群）。
// 批次13：用户「人物图片保留并多用」→ 名牌旁加证件照小卡（白底立绘裁头肩 / 齐仇用档案海报裁），work/r3/b13/idp/mk.py 生成
const IDPHOTO = { 周闻: 'zhouwen', 殷泽: 'yinze', 叶寻: 'yexun', 周也: 'zhouye', 齐凌云: 'qilingyun', 齐仇: 'qichou' };
// 批次31（用户 07:02 要求）：证件照小卡 0.105×0.14 太小 → 约 A5（0.16×0.226 m，面积 ≈2.5 倍）档案照片卡：米白卡纸 + 顶部「叙事管理局 人员档案」+ 大头像（0.136×0.18 m）+ 姓名，铜框 + 顶部铜夹
const _idCard = {};
function idCardBigMat(name) {
  const k = IDPHOTO[name]; if (!k) return null; if (_idCard[k]) return _idCard[k];
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = 904; const c = cv.getContext('2d');
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const draw = (img) => { // 批次31 看图修：源图本身是带姓名/编号/印章的小卡 → 只裁头像框（40,25,305×400）放大，姓名改用大字（96 px ≈ 2.4 cm）
    c.fillStyle = '#ece3cc'; c.fillRect(0, 0, 640, 904);
    c.strokeStyle = '#7a5a2a'; c.lineWidth = 6; c.strokeRect(14, 14, 612, 876); c.lineWidth = 2; c.strokeRect(26, 26, 588, 852);
    c.fillStyle = '#5a3c18'; c.font = '600 44px "NB Serif","Noto Serif SC",serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('叙事管理局　人员档案', 320, 66);
    c.fillStyle = '#8a6a3a'; c.fillRect(60, 98, 520, 3);
    const W = 500, H = 656, X = 70, py = 112;
    c.fillStyle = '#b8c4cc'; c.fillRect(X, py, W, H);
    if (img) c.drawImage(img, 40, 25, 305, 400, X, py, W, H);
    c.strokeStyle = '#3a2a14'; c.lineWidth = 4; c.strokeRect(X, py, W, H);
    c.fillStyle = '#1e140a'; c.font = '700 96px "NB Serif","Noto Serif SC",serif'; c.fillText(name, 320, py + H + 64);
    t.needsUpdate = true;
  };
  draw(null); const img = new Image(); img.onload = () => draw(img); img.src = `./content/textures/idphoto/${k}.jpg`;
  return (_idCard[k] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.08 }));
}
/** A5 档案照片卡（面朝 +Z，中心在原点）：卡面 + 铜框 + 顶部铜夹 */
function idCardBig(name, brass) {
  const m = idCardBigMat(name); if (!m) return null;
  const g = new THREE.Group(); const W = 0.16, H = 0.226;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), m); face.position.z = 0.004; g.add(face);
  const fr = new THREE.Mesh(new THREE.BoxGeometry(W + 0.014, H + 0.014, 0.006), brass); g.add(fr);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.012), brass); clip.position.set(0, H / 2 - 0.004, 0.006); g.add(clip);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.003, 6, 14), brass); ring.position.set(0, H / 2 + 0.016, 0.004); g.add(ring);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  return g;
}
// 批次31（用户 07:20 覆盖上一条）：证件照不再挂在大衣 / 椅背上 → 座位 / 衣帽架旁放一张胡桃木边几，几面摊开牛皮纸人事档案夹，
// 证件照（A6 以上 0.12×0.16 m）用铜回形针夹在右页左上角，页面打字机式档案文字，旁边立一张打字机名签。边几自带，不依赖各处桌子尺寸（避免悬空 / 穿模）。
const _dos = {};
function dossierPageMat(name) {
  if (_dos[name]) return _dos[name];
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 700; const c = cv.getContext('2d');
  c.fillStyle = '#efe8d6'; c.fillRect(0, 0, 512, 700); c.fillStyle = '#2a2420'; c.font = '600 30px "NB Mono","Courier New",monospace'; c.textBaseline = 'top';
  c.fillText('人员档案', 300, 30); c.font = '22px "NB Mono","Courier New",monospace';
  const L = ['姓名：' + name, '所属：叙事管理局', '状态：在册 / 暂离', '', '备注：', '本人物品原位封存，', '请勿移动。'];
  L.forEach((t, i) => c.fillText(t, 300 - (i > 2 ? 270 : 0), 90 + i * 34 + (i > 2 ? 200 : 0)));
  for (let i = 0; i < 7; i++) { c.fillStyle = 'rgba(40,36,32,0.35)'; c.fillRect(30, 560 + i * 18, 300 + (i * 37) % 140, 3); }
  c.strokeStyle = 'rgba(150,40,30,0.7)'; c.lineWidth = 4; c.beginPath(); c.arc(420, 600, 48, 0, Math.PI * 2); c.stroke(); c.font = '700 40px "NB Serif",serif'; c.fillStyle = 'rgba(150,40,30,0.7)'; c.fillText('叙', 400, 580);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return (_dos[name] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }));
}
function tagMat(name) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 80; const c = cv.getContext('2d');
  c.fillStyle = '#f4efe2'; c.fillRect(0, 0, 256, 80); c.fillStyle = '#1e1a16'; c.font = '600 40px "NB Mono","Courier New",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, 128, 42);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 });
}
/** 边几 + 摊开档案夹 + 回形针证件照 + 打字机名签；(x, z) 为边几中心（person 局部坐标，面朝 +Z） */
let _oldBronze = null;
function dossierStand(g, M, name, x, z, flip = false) { // flip：相框朝 −Z（周闻：椅前是值班长台，玩家从椅后平台过来）
  const k = IDPHOTO[name]; if (!k) return;
  const wood = M.wood ?? new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.6 });
  const brass = (_oldBronze ??= new THREE.MeshStandardMaterial({ color: 0x5a4630, metalness: 0.8, roughness: 0.6 })); // 批次33：旧铜（原 M.brass 偏亮橙）
  const kraft = new THREE.MeshStandardMaterial({ color: 0xa47e4e, roughness: 0.9 });
  const add = (geo, m, px, py, pz, rx = 0, ry = 0, rz = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x + px, py, z + pz); me.rotation.set(rx, ry, rz); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  const TOP = 0.62; // 批次32：几面放大 0.56×0.42 → 0.62×0.52，后半放立式铜框相片座，前半摊档案夹
  add(new THREE.BoxGeometry(0.62, 0.03, 0.52), wood, 0, TOP - 0.015, 0); // 几面
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.CylinderGeometry(0.016, 0.012, TOP - 0.03, 10), wood, sx * 0.27, (TOP - 0.03) / 2, sz * 0.22);
  add(new THREE.BoxGeometry(0.56, 0.02, 0.46), wood, 0, 0.2, 0); // 下层隔板
  add(new THREE.BoxGeometry(0.625, 0.012, 0.525), brass, 0, TOP - 0.034, 0); // 几面下铜线
  // 档案夹：两页牛皮纸封皮（各 0.22×0.3）+ 右页内衬档案纸（前移到 z +0.08）
  const DZ = flip ? -0.08 : 0.08;
  add(new THREE.BoxGeometry(0.225, 0.004, 0.3), kraft, -0.115, TOP + 0.002, DZ, 0, 0.04, 0);
  add(new THREE.BoxGeometry(0.225, 0.004, 0.3), kraft, 0.115, TOP + 0.002, DZ);
  add(new THREE.PlaneGeometry(0.21, 0.287), dossierPageMat(name), 0.115, TOP + 0.0045, DZ, -Math.PI / 2);
  add(new THREE.PlaneGeometry(0.2, 0.28), new THREE.MeshStandardMaterial({ color: 0xe9e2cf, roughness: 0.9 }), -0.115, TOP + 0.0045, DZ + 0.002, -Math.PI / 2, 0, 0.04);
  const ph = add(new THREE.PlaneGeometry(0.12, 0.16), new THREE.MeshStandardMaterial({ map: loadTex(`content/textures/idphoto/${k}.jpg`, { srgb: true }), roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0.05 }), 0.075, TOP + 0.006, DZ - 0.055, -Math.PI / 2, 0, 0.05);
  ph.castShadow = false;
  add(new THREE.TorusGeometry(0.012, 0.0015, 4, 16), brass, 0.035, TOP + 0.0075, DZ - 0.132, -Math.PI / 2, 0, 0).scale.set(0.6, 1.6, 1); // 回形针
  // 批次32（用户：照片太小）立式铜框相片座：照片 0.13×0.18 m，后仰 14°，面朝 +Z（玩家来向）；底框嵌打字机名签铜牌
  const fr = new THREE.Group(); fr.name = 'pframe_' + name; fr.position.set(x, TOP, z + (flip ? 0.13 : -0.13)); fr.rotation.order = 'YXZ'; fr.rotation.set(-0.24, flip ? Math.PI : 0, 0); g.add(fr);
  const fa = (geo, m, px, py, pz, rx = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.rotation.x = rx; me.castShadow = true; me.receiveShadow = true; fr.add(me); return me; };
  const PW = 0.13, PH = 0.18, B = 0.014, BOT = 0.046, D = 0.016;
  fa(new THREE.BoxGeometry(PW + 2 * B, BOT, D), brass, 0, BOT / 2, 0); // 底框（宽，嵌名签）
  fa(new THREE.BoxGeometry(PW + 2 * B, B, D), brass, 0, BOT + PH + B / 2, 0); // 顶框
  for (const sx of [-1, 1]) fa(new THREE.BoxGeometry(B, PH, D), brass, sx * (PW / 2 + B / 2), BOT + PH / 2, 0);
  fa(new THREE.BoxGeometry(PW + 2 * B - 0.004, PH + BOT + B - 0.004, 0.004), new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 0.7 }), 0, (PH + BOT + B) / 2, -D / 2 - 0.001); // 背板
  fa(new THREE.BoxGeometry(PW + 0.006, 0.004, 0.002), brass, 0, BOT + PH + 0.002, D / 2 - 0.002); // 内口铜线
  const pm = fa(new THREE.PlaneGeometry(PW, PH), framePhotoMat(name), 0, BOT + PH / 2, 0.002); pm.castShadow = false;
  const gl = fa(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.06, depthWrite: false }), 0, BOT + PH / 2, 0.006); gl.castShadow = false; // 玻璃
  const nt = fa(new THREE.PlaneGeometry(PW - 0.004, 0.032), frameTagMat(name), 0, BOT / 2, D / 2 + 0.0006); nt.castShadow = false;
  fa(new THREE.BoxGeometry(0.03, 0.2, 0.006), brass, 0, 0.115, -0.06, 0.5); // 背撑（底端落在几面上）
  for (const sx of [-1, 1]) fa(new THREE.CylinderGeometry(0.004, 0.004, 0.003, 10), M.gold ?? brass, sx * 0.055, BOT / 2, D / 2 + 0.0012, Math.PI / 2); // 铭牌铆钉
}
const _fphoto = {};
function framePhotoMat(name) { // 只裁源图头像框（48,25,289×400，比例 = 0.13/0.18），不带源图自带的小姓名 / 编号
  const k = IDPHOTO[name]; if (_fphoto[k]) return _fphoto[k];
  const cv = document.createElement('canvas'); cv.width = 520; cv.height = 720; const c = cv.getContext('2d');
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const draw = (img) => { c.fillStyle = '#b8c4cc'; c.fillRect(0, 0, 520, 720); if (img) c.drawImage(img, 48, 25, 289, 400, 0, 0, 520, 720); c.strokeStyle = 'rgba(30,20,10,0.6)'; c.lineWidth = 6; c.strokeRect(3, 3, 514, 714); t.needsUpdate = true; };
  draw(null); const img = new Image(); img.onload = () => draw(img); img.src = `./content/textures/idphoto/${k}.jpg`;
  return (_fphoto[k] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.1 }));
}
function frameTagMat(name) { // 铜牌刻字名签：暗铜底 + 深色刻字（打字机等宽体）
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const c = cv.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#c9a463'); gr.addColorStop(0.5, '#a9844a'); gr.addColorStop(1, '#8a6a36'); c.fillStyle = gr; c.fillRect(0, 0, 512, 128);
  c.strokeStyle = '#5a4020'; c.lineWidth = 5; c.strokeRect(8, 8, 496, 112);
  c.fillStyle = '#21160a'; c.font = '700 84px "NB Mono","Courier New",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, 256, 68);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0.6, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.06 });
}
function namePlateMat(name) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 72; const c = cv.getContext('2d');
  c.fillStyle = '#6b4f22'; c.fillRect(0, 0, 256, 72); c.strokeStyle = '#d8b56a'; c.lineWidth = 4; c.strokeRect(4, 4, 248, 64);
  c.fillStyle = '#f3e2b0'; c.font = '600 40px "NB Serif","Noto Serif SC",serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, 128, 38);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.45, metalness: 0.4 });
}
export function person(M, { coat = 0x1a1d26, cap = false, material = null, clue = null, name = null, flipDossier = false } = {}) {
  const g = new THREE.Group(); g.userData.presence = clue ?? 'none';
  if (!clue) return g;
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.rotation.set(rx, ry, rz); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
  const cloth = new THREE.MeshStandardMaterial({ color: coat, roughness: 0.85 });
  const wood = M.wood ?? new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.6 });
  const brass = M.brass ?? M.gold;
  if (clue === 'shadow') { const d = add(new THREE.CircleGeometry(0.45, 28), material ?? new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.8, depthWrite: false }), 0, 0.012, 0, -Math.PI / 2); d.scale.set(1, 1.6, 1); d.castShadow = false; return g; }
  // 批次15：空椅 / 外套改用 Blender 精建模型（r4/exam_chair 实木课椅、r4/wool_coat 呢子大衣：领口、驳头、双袖、褶皱、扣子、袋盖、里衬；work/r3/b15/prev/build.py）
  const coatTint = (o) => { const c = new THREE.Color(coat); const k = 2.1; c.setRGB(Math.min(1, c.r * k + 0.06), Math.min(1, c.g * k + 0.06), Math.min(1, c.b * k + 0.06));
    o.traverse((m) => { if (!m.isMesh) return; m.castShadow = m.receiveShadow = true; if (material) { m.material = material; return; }
      if (/wool/.test(m.material?.name ?? '')) { m.material = m.material.clone(); m.material.color.copy(c); } }); return o; };
  if (clue === 'chair') { // 空椅（面朝 +Z），呢子大衣搭在椅背上（肩线压在弯靠背上档、衣身垂在椅背后）
    placeModel('r4/exam_chair', { height: 0.84 }).then((o) => { o.traverse((m) => { if (m.isMesh) m.castShadow = m.receiveShadow = true; }); g.add(o); });
    placeModel('r4/wool_coat', { height: 0.886 }).then((o) => { o.position.set(0, 0.01, -0.28); g.add(coatTint(o)); });
    if (cap) add(new THREE.CylinderGeometry(0.11, 0.12, 0.06, 16), cloth, 0.08, 0.485, 0.06);
    if (name) dossierStand(g, M, name, 0.62, flipDossier ? -0.14 : 0.05, flipDossier); /* 批次33：周闻（flip）边几后移 19 cm，离值班台 ≈28 cm */ // 批次31（用户 07:20）：证件照从椅上拿掉 → 椅旁边几上的人事档案夹
    return g; }
  if (clue === 'coat' || clue === 'hanger') { // 衣帽架 / 制服挂架
    if (clue === 'coat') { add(new THREE.CylinderGeometry(0.02, 0.025, 1.75, 10), wood, 0, 0.875, 0); add(new THREE.CylinderGeometry(0.2, 0.22, 0.03, 20), wood, 0, 0.015, 0);
      for (let k = 0; k < 4; k++) add(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), brass, Math.sin(k * 1.57) * 0.07, 1.68, Math.cos(k * 1.57) * 0.07, 0.9 * Math.cos(k * 1.57), 0, -0.9 * Math.sin(k * 1.57)); }
    const top = clue === 'coat' ? 1.62 : 1.5;
    add(new THREE.BoxGeometry(0.44, 0.012, 0.012), brass, 0, top + 0.02, 0.06); // 衣架横杆
    placeModel('r4/wool_coat', { height: 1.03 }).then((o) => { o.position.set(0, top + 0.03 - 1.03, 0.07); g.add(coatTint(o)); });
    if (cap && clue === 'coat') add(new THREE.CylinderGeometry(0.12, 0.13, 0.07, 16), cloth, 0.05, 1.79, 0);
    if (name) { const np = add(new THREE.BoxGeometry(0.2, 0.06, 0.012), namePlateMat(name), 0, top - 1.18, 0.03); np.castShadow = false;
      dossierStand(g, M, name, 0.55, 0.12); } // 批次31（用户 07:20）：证件照从大衣上拿掉 → 衣帽架旁边几上的人事档案夹 // 批次31：A5 档案照片卡夹在大衣左胸驳头外（x 0.02–0.18 避开中线扣子 x0±0.012；y top−0.157…−0.383，在领口之下、首粒扣 top−0.40 之上；卡面 z0.196 > 驳头前沿 ≈0.175，不穿模）
    return g; }
  return g;
}
export function grandClock(M, pos, yaw) {
  const g = new THREE.Group();
  const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  add(new THREE.BoxGeometry(0.62, 0.3, 0.42), M.wood, 0, 0.15, 0);
  add(new THREE.BoxGeometry(0.5, 1.4, 0.34), M.wood, 0, 1.0, 0);
  add(new THREE.BoxGeometry(0.62, 0.62, 0.4), M.wood, 0, 2.0, 0);
  add(new THREE.ConeGeometry(0.4, 0.3, 4), M.wood, 0, 2.46, 0).rotation.y = Math.PI / 4;
  const face = add(new THREE.CircleGeometry(0.22, 32), new THREE.MeshStandardMaterial({ map: clockFaceTexture(), roughness: 0.4 }), 0, 2.0, 0.205);
  void face;
  add(new THREE.TorusGeometry(0.23, 0.02, 6, 32), M.brass, 0, 2.0, 0.21);
  add(new THREE.BoxGeometry(0.3, 1.0, 0.01), M.glassClear, 0, 1.0, 0.175);
  add(new THREE.CylinderGeometry(0.008, 0.008, 0.7), M.brass, 0, 1.2, 0.12);
  add(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 20), M.brass, 0, 0.82, 0.12).rotation.x = Math.PI / 2;
  g.position.set(...pos); g.rotation.y = yaw; return g;
}
export function clockFaceTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
  c.fillStyle = '#efe6cc'; c.fillRect(0, 0, 256, 256); c.translate(128, 128); c.fillStyle = '#222'; c.font = '900 22px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const R = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  R.forEach((r, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; c.fillText(r, Math.cos(a) * 100, Math.sin(a) * 100); });
  // 3:07
  const hA = ((3 + 7 / 60) / 12) * Math.PI * 2 - Math.PI / 2, mA = (7 / 60) * Math.PI * 2 - Math.PI / 2;
  c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(hA) * 55, Math.sin(hA) * 55); c.stroke();
  c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(mA) * 85, Math.sin(mA) * 85); c.stroke();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function ledgerTexture() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 360; const c = cv.getContext('2d');
  c.fillStyle = '#e8dcbc'; c.fillRect(0, 0, 256, 360); c.strokeStyle = '#a89878'; for (let y = 30; y < 360; y += 18) { c.beginPath(); c.moveTo(10, y); c.lineTo(246, y); c.stroke(); }
  c.fillStyle = '#3a3226'; c.font = '13px "NB Sans", sans-serif'; for (let y = 44; y < 350; y += 18) c.fillText('2023-06-0' + ((y / 18) % 9 | 0) + '　07-0-' + ((y * 37) % 10000).toString().padStart(4, '0'), 14, y);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function stickyMaterial() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  c.fillStyle = '#f2df5a'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#333'; c.font = '16px "NB Sans", sans-serif'; c.fillText('记得问它', 16, 50); c.fillText('别问我', 16, 80);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, side: THREE.DoubleSide });
}
export function signMaterial(title, lines, w = 512, h = 680) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d');
  c.fillStyle = '#0d0f14'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9a052'; c.lineWidth = 6; c.strokeRect(14, 14, w - 28, h - 28);
  c.fillStyle = '#e6c67c'; c.font = `900 ${w * 0.09}px \"NB Title\", \"NB Serif\", serif`; c.textAlign = 'center'; c.fillText(title, w / 2, h * 0.14);
  c.fillStyle = '#d8d2c2'; c.font = `${w * 0.05}px "NB Latin", "NB Serif", serif`; c.textAlign = 'left'; lines.forEach((l, i) => c.fillText(l, w * 0.1, h * 0.26 + i * w * 0.1));
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.15 });
}
export function brassPlaqueMaterial(title, lines) {
  const w = 512, h = 680; const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d');
  const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#b8924a'); gr.addColorStop(0.5, '#e2c27a'); gr.addColorStop(1, '#9a7638'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#5a4018'; c.lineWidth = 8; c.strokeRect(18, 18, w - 36, h - 36);
  c.fillStyle = '#2a1c08'; c.font = '900 44px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'center'; c.fillText(title, w / 2, 96);
  c.font = '28px "NB Serif", serif'; c.textAlign = 'left'; lines.forEach((l, i) => c.fillText(l, 50, 170 + i * 52));
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, metalness: 0.7, roughness: 0.35 });
}
export function posterMaterial(title, sub) {
  const w = 512, h = 732; const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0d1838'); gr.addColorStop(1, '#03050c'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#c9a052'; c.lineWidth = 4; c.strokeRect(20, 20, w - 40, h - 40);
  c.fillStyle = '#e8c87a'; c.font = '900 76px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'center'; c.fillText(title, w / 2, h * 0.45);
  c.fillStyle = '#aab4cc'; c.font = '600 26px "NB Serif", serif'; c.fillText(sub, w / 2, h * 0.56);
  c.fillStyle = '#c9a052'; c.font = '22px "NB Serif", serif'; c.fillText('叙事管理局', w / 2, h * 0.9);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.4, roughness: 0.4 });
}
export function wantedBoardMaterial() {
  const w = 1350, h = 600; const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d');
  c.fillStyle = '#5a4630'; c.fillRect(0, 0, w, h);
  const items = [['通缉令', '秦骁　【王寇】', '高危'], ['通缉令', '江戾　【冥礼】', '高危'], ['通缉令', '第二草稿　在逃成员', '协查'], ['通告', '余辉剧团　演出一律取消', '']];
  items.forEach(([t, n, l], i) => { const x = 30 + i * 330; c.fillStyle = i < 3 ? '#e9e1cc' : '#d8e2ee'; c.fillRect(x, 40, 300, 520); c.fillStyle = '#7a1a1a'; c.font = '900 54px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'center'; c.fillText(t, x + 150, 110); c.fillStyle = '#222'; c.fillRect(x + 60, 140, 180, 220); c.fillStyle = '#2a2a2a'; c.font = '900 30px \"NB Title\", \"NB Serif\", serif'; c.fillText(n, x + 150, 410); c.fillStyle = '#a3262a'; c.font = '26px "NB Sans", sans-serif'; c.fillText(l, x + 150, 460); });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 });
}

// ——— 屏幕绘制 ———
function drawQueue(c, t, W, H) {
  c.fillStyle = '#030814'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#e8c87a'; c.font = '900 54px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'left'; c.fillText('请 XS-2026-1029-07 号', 40, 110);
  c.fillStyle = '#ffffff'; c.fillText('到 3 号窗口', 40, 190);
  c.fillStyle = '#7f8db0'; c.font = '28px "NB Sans", sans-serif'; c.textAlign = 'right'; c.fillText('叙事管理局 · 人事处', W - 40, 230);
}
export function drawScanIdle(c, t, W, H) {
  c.fillStyle = '#04110a'; c.fillRect(0, 0, W, H); c.fillStyle = '#4cff9a'; c.font = '700 40px "NB Sans", sans-serif'; c.textAlign = 'center'; c.fillText('文本完整性扫描', W / 2, 90); c.font = '30px "NB Sans", sans-serif'; c.fillText('请依次通过　· 待机', W / 2, 170);
  c.fillStyle = '#2a8a5a'; c.fillRect(60, 220, (W - 120) * ((t * 0.3) % 1), 14);
}
export function drawScanAlert(c, t, W, H) {
  c.fillStyle = '#1a1004'; c.fillRect(0, 0, W, H); c.fillStyle = (t * 2) % 1 > 0.5 ? '#ffb02e' : '#ff8a00'; c.font = '700 46px "NB Sans", sans-serif'; c.textAlign = 'center'; c.fillText('段落缺失', W / 2, 100); c.font = '30px "NB Sans", sans-serif'; c.fillText('请转人工复核', W / 2, 160);
  c.fillStyle = '#6a5a40'; c.font = '20px "NB Sans", sans-serif'; c.fillText('此人此前已被扫描过一次', W / 2, 290);
}
function drawMainScreen(c, t, W, H, ctx) {
  const tex = ctx.mainScreenTex;
  if (tex && tex.image && tex.image.complete) { c.drawImage(tex.image, 0, 0, W, H); }
  else {
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#061028'); gr.addColorStop(1, '#02040c'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#1d3a7a'; c.lineWidth = 2; for (let x = 0; x < W; x += 64) { c.beginPath(); c.moveTo(x, 120); c.lineTo(x, H); c.stroke(); } for (let y = 120; y < H; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.fillStyle = '#0c1d48'; c.fillRect(0, 0, W, 110);
    c.fillStyle = '#e8c87a'; c.font = '900 60px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'left'; c.fillText('叙事管理局 · 京城总部　安检大厅实时监测', 50, 76);
    c.textAlign = 'right'; c.fillStyle = '#9fb4e0'; c.font = '40px "NB Sans", sans-serif'; const d = new Date(); c.fillText(`2026-10-29　${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`, W - 50, 72);
    // 左：污染指数
    c.textAlign = 'left'; c.fillStyle = '#9fb4e0'; c.font = '44px "NB Sans", sans-serif'; c.fillText('今日叙事污染指数', 70, 210);
    c.fillStyle = '#7dffb0'; c.font = '700 230px "NB Sans", sans-serif'; c.fillText('37', 70, 440); c.font = '54px "NB Serif", serif'; c.fillText('良 · 二级', 380, 430);
    // 中：现实稳定度
    c.fillStyle = '#9fb4e0'; c.font = '44px "NB Sans", sans-serif'; c.fillText('现实稳定度', 760, 210);
    const v = 97.3 + Math.sin(t * 0.7) * 0.02; c.fillStyle = '#ffd36e'; c.font = '700 200px "NB Sans", sans-serif'; c.fillText(v.toFixed(1) + '%', 740, 430);
    c.fillStyle = '#ff7a6a'; c.font = '40px "NB Sans", sans-serif'; c.fillText('较昨日 ▼0.4%', 760, 500);
    // 波形
    c.strokeStyle = '#ffd36e'; c.lineWidth = 4; c.beginPath(); for (let x = 0; x < 640; x += 4) { const y = 640 + Math.sin(x * 0.05 + t * 2) * 30 + Math.sin(x * 0.013 + t) * 30; x ? c.lineTo(740 + x, y) : c.moveTo(740 + x, y); } c.stroke();
    // 右：各区
    const areas = [['东城区', 98.1], ['西城区', 97.6], ['朝阳区', 96.2], ['海淀区', 97.9], ['通州区', 95.4]];
    c.font = '40px "NB Sans", sans-serif'; areas.forEach(([n, val], i) => { const y = 220 + i * 92; c.fillStyle = '#9fb4e0'; c.fillText(n, 1500, y); c.fillStyle = val < 96 ? '#ff8a5a' : '#7dffb0'; c.fillRect(1700, y - 30, (val - 90) * 30, 30); c.fillText(val.toFixed(1) + (val < 96 ? ' ⚠' : ''), 1700 + (val - 90) * 30 + 14, y); });
    c.fillStyle = '#9fb4e0'; c.font = '38px "NB Sans", sans-serif'; c.fillText('入局人员文本完整性扫描　今日通过 1,284 人　复核 3 人', 70, 800);
    c.fillText('地下驯化空间　驯化度 99.98%　状态：稳定', 70, 856);
  }
  // B7 闪帧（约每 40 秒一帧）
  if ((t % 40) < 0.5) { c.fillStyle = '#000'; c.fillRect(W - 640, H - 150, 600, 110); c.fillStyle = '#ff2a2a'; c.font = '700 54px "NB Sans", sans-serif'; c.textAlign = 'right'; c.fillText('B7 层 —— 无数据', W - 60, H - 72); }
}

export function updateInteriors(ctx, dt, t) {
  if (ctx.scanRings) for (const s of ctx.scanRings) { s.ring.material.emissiveIntensity = 2.2 + Math.sin(t * 2 + s.x) * 0.8; }
  if (ctx.compactRows) for (const r of ctx.compactRows) if (r.spin) { r.wheel.rotation.z += dt * 4; }
  if (ctx.seamThread && ctx.seam.visible) ctx.seamThread.rotation.z = Math.sin(t * 3) * 0.02;
}
