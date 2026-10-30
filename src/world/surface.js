// M5：地表外围（城墙内附楼群体量 + 宿舍 + 机库停机坪 + 城墙岗哨 + 无字碑廊 + 地铁口）与东翼—后楼连续走廊
// 坐标：环形城墙圆心 (0,−35) 半径 118（内壁约 114.5）；广场地面 y=0；迎宾大道 y=−4（南门外）。
// 区域：dorm 宿舍 (52…80, 0…40)，helipad 机库 (73…99, −87…−53，屋顶 y=12)，wall_posts 岗亭（12 号塔内侧），
//       memorial 碑廊 (−76…−50, 0…44)，metro_exit 地铁口 (0,−4,140)，east_cloister 东廊 (x 18…30, z −76…−115)
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { CanvasScreen } from '../engine/fx.js';
import { content } from '../engine/content.js';
import { mats } from './mats.js';
import { Frame, archShape, archRingGeo, lancetWindow, gableRoof, bayWall, tower, pinnacle, emblem, goldText } from './gothic.js';
import { wallX, wallZ, point, spot, person, signMaterial, brassPlaqueMaterial, posterMaterial, rectLight } from './interiors.js';
import { vaultMats, tagMaterial } from './vault.js';
import { dressMats, Props, wallDress, wallSeg, rug, hangingSign, plantPot, bin, paperStack, folderStack, telephone, greenLamp } from './dress.js';
import { m5Mats } from './dress_m5.js';
import { RING, FLOOR, cypress, blob } from './exterior.js';
import { R3 } from './r3plan.js';
import { dormMats, bunkBed, singleBed, desk, wardrobe, thermos, mug, washstand, windowCurtain, noticeBoard, thermosRack, tubeLamp } from './dorm.js';

const rnd = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const cvMat = (w, h, draw, o = {}) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, ...(o.emis ? { emissive: 0xffffff, emissiveMap: t, emissiveIntensity: o.emis } : {}), ...(o.side ? { side: o.side } : {}) }); };
const plane = (zone, mat, w, h, x, y, z, yaw = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = yaw; zone.add(m); return m; };
const docMat = (id, fb) => { const d = content.get(id); const t = d?.texture ? content.tex(d.texture) : null; return t ? new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }) : fb; };

/** 附楼体量：四面扶壁尖窗墙 + 山墙坡屋顶 + 角塔（front: 'w'|'e'|'s'|'n' 那一面换成带门洞的墙，便于进入） */
function annex(b, cx, cz, w, d, h, o = {}) {
  const faces = { s: [cx, cz + d / 2, 0, w], n: [cx, cz - d / 2, Math.PI, w], e: [cx + w / 2, cz, Math.PI / 2, d], w: [cx - w / 2, cz, -Math.PI / 2, d] };
  for (const [k, [x, z, yaw, len]] of Object.entries(faces)) {
    if (k === o.front) continue;
    bayWall(b, new Frame([x, 0, z], yaw), len, h, Math.max(2, Math.round(len / 6)), { collide: true, twoTier: h > 11, buttressD: 1.2, pinnacles: o.pinnacles ?? true });
  }
  gableRoof(b, cx, h + 0.5, cz, o.roofAlongX ? d : w, o.roofAlongX ? w : d, o.rh ?? 6, { yaw: o.roofAlongX ? Math.PI / 2 : 0, dormers: o.dormers ?? 0 });
  if (o.corner !== false) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = new Frame([cx + sx * (w / 2 + 0.4), 0, cz + sz * (d / 2 + 0.4)], 0); pinnacle(b, f, 0, h, 0, 1.2); }
  // M7：勒脚改为沿外墙一圈（原实心 0.5 m 石台填满室内，盖住宿舍地坪，抛光大理石成了「金色镜面地面」）
  for (const [bw, bd, ox, oz] of [[w + 1.2, 0.9, 0, d / 2 + 0.15], [w + 1.2, 0.9, 0, -d / 2 - 0.15], [0.9, d + 1.2, w / 2 + 0.15, 0], [0.9, d + 1.2, -w / 2 - 0.15, 0]]) b.box('stoneDark', bw, 0.5, bd, [cx + ox, 0.25, cz + oz], { uv: 0.4 });
}
/** 带门洞的立面（沿 x=at 的墙，门洞 holes），外侧加尖窗框与金腰线 */
function frontWallX(b, at, z0, z1, h, holes, n, outward) {
  wallX(b, 'stone', at, z0, z1, 0, h, 1.2, holes, true);
  b.box('gold', 0.14, 0.14, z0 - z1, [at + outward * 0.62, h * 0.44, (z0 + z1) / 2], { uv: 1 });
  b.box('stone', 0.8, 0.6, z0 - z1 + 0.4, [at + outward * 0.4, h - 0.3, (z0 + z1) / 2], { uv: 0.5 });
  const f = new Frame([at + outward * 0.6, 0, (z0 + z1) / 2], outward > 0 ? Math.PI / 2 : -Math.PI / 2);
  const len = z0 - z1; for (let i = 0; i < n; i++) { const t = -len / 2 + (i + 0.5) * len / n; const lx = outward > 0 ? -t : t; const zz = (z0 + z1) / 2 - t; if (holes.some((ho) => zz < ho.z0 + 1 && zz > ho.z1 - 1)) continue; lancetWindow(b, f, lx, h * 0.5, 0.05, 1.6, h * 0.36); lancetWindow(b, f, lx, 1.4, 0.05, 1.3, h * 0.28); }
}
/** 室内暖色玻璃窗（从外看亮灯） */
function litWindow(b, x, y, z, yaw, w = 1.2, h = 2.2) { b.add('dz_shade', new THREE.ShapeGeometry(archShape(w, h - w * 0.866)), { pos: [x, y, z], rot: [0, yaw, 0] }, { uv: false }); }

export async function buildSurface(scene, world, ctx) {
  const M = mats(); const Mx = vaultMats(M); const D = dressMats(M); const X5 = m5Mats(M);
  const MAT = { ...M, ...Mx, ...D, ...X5, ...dormMats() };
  const jobs = [];
  const mk = (name) => { const g = new THREE.Group(); g.name = name; scene.add(g); ctx.zones[name] = g; return g; };
  const zone = mk('surface');
  const b = new Batch(), P = new Props();
  const anchor = (id, obj, range) => { ctx.anchors[id] = range ? { obj, range } : obj; };

  // ======================= 附楼群体量（外观） =======================
  annex(b, -86, -70, 26, 34, 10, { roofAlongX: false, dormers: 2 }); // 西北：后勤车库
  for (let k = 0; k < 3; k++) { b.box('iron', 0.2, 5.2, 6, [-72.9, 2.6, -80 + k * 10], { uv: 1 }); b.box('blackMetal', 0.1, 4.8, 5.4, [-72.85, 2.5, -80 + k * 10], { uv: 1 }); for (let r = 0; r < 8; r++) b.box('steel', 0.05, 0.04, 5.4, [-72.78, 0.4 + r * 0.6, -80 + k * 10], { uv: 1 }); }
  hangingSign(zone, M, '后勤车库', -72.4, 6.4, -70, -Math.PI / 2, 3.2);
  annex(b, -80, -20, 18, 26, 13, { roofAlongX: false }); // 西：档案附楼
  annex(b, 82, -20, 18, 26, 13, { roofAlongX: false }); // 东：外勤附楼
  for (const [x, yaw] of [[-71, -Math.PI / 2], [73, Math.PI / 2]]) { const f = new Frame([x, 0, -20], yaw); b.add('stoneDark', archRingGeo(3.4, 2.6, 2.4, 2.6, 1.4), f.at(0, 0, 0.5), { uv: 0.5 }); b.add('doorWood', new THREE.ShapeGeometry(archShape(2.4, 2.6)), f.at(0, 0, 0.1), { uv: 1 }); b.add('gold', archRingGeo(3.6, 2.6, 3.4, 2.6, 0.2), f.at(0, 0, 1.2), { uv: 1 }); }
  // 内院：环形车道（沥青）+ 路缘 + 草坪 + 路灯
  { const ring = new THREE.RingGeometry(92, 99, 128, 1, THREE.MathUtils.degToRad(208), THREE.MathUtils.degToRad(124)); ring.rotateX(-Math.PI / 2); b.add('concrete', ring, { pos: [RING.cx, 0.02, RING.cz] }, { uv: 0.2 });
    const ring2 = new THREE.RingGeometry(92, 99, 128, 1, THREE.MathUtils.degToRad(28), THREE.MathUtils.degToRad(124)); ring2.rotateX(-Math.PI / 2); b.add('concrete', ring2, { pos: [RING.cx, 0.02, RING.cz] }, { uv: 0.2 });
    for (const r of [91.9, 99.1]) for (const [a0, a1] of [[208, 332], [28, 152]]) { const g = new THREE.RingGeometry(r - 0.15, r + 0.15, 128, 1, THREE.MathUtils.degToRad(a0), THREE.MathUtils.degToRad(a1 - a0)); g.rotateX(-Math.PI / 2); b.add('stoneDark', g, { pos: [RING.cx, 0.05, RING.cz] }, { uv: 0.5 }); } }
  for (const [x, z] of [[-60, -48], [-62, -95], [60, -48], [62, -95], [-95, -40], [96, -40], [-50, -120], [50, -120]]) P.add('street_lamp_02', [x, 0, z], { h: 5.5 });
  for (const [x, z, w, d] of [[-60, -118, 24, 14], [60, -118, 24, 14], [-96, 4, 10, 24], [100, 0, 8, 20]]) { b.box('grass', w, 0.1, d, [x, 0.05, z], { uv: 0.3 }); for (let k = 0; k < 4; k++) b.add('hedge', blob(1.0, x + k), { pos: [x - w / 2 + 2 + k * (w - 4) / 3, 0.8, z], scale: [1, 0.8, 1] }, { uv: 0.8 }); }

  // ======================= 宿舍附楼 dorm (52…80, 0…40) =======================
  {
    const X0 = 52, X1 = 80, Z0 = 40, Z1 = 0, H = 14, cx = 66, cz = 20, F2 = 4.6;
    annex(b, cx, cz, X1 - X0, Z0 - Z1, H, { front: 'w', dormers: 3 });
    frontWallX(b, X0 + 0.6, Z0, Z1, H, [{ z0: 21.6, z1: 18.4, h: 3.6 }], 6, -1);
    { const f = new Frame([X0 - 0.2, 0, 20], -Math.PI / 2); b.add('stoneDark', archRingGeo(4.4, 3.2, 3.2, 3.2, 1.2), f.at(0, 0, 0.3), { uv: 0.5 }); b.add('gold', archRingGeo(4.6, 3.2, 4.4, 3.2, 0.2), f.at(0, 0, 0.92), { uv: 1 }); b.box('stoneDark', 3, 0.3, 2, [X0 - 1.2, 0.15, 20], { uv: 0.5 }); }
    const sg = goldText('职工宿舍　三号楼', 5, 0.55, M.goldBright, { res: 128 }); sg.position.set(X0 - 0.9, 5.6, 20); sg.rotation.y = -Math.PI / 2; zone.add(sg);
    // 楼层板
    b.box('dm_terrazzo', X1 - X0 - 2.4, 0.04, Z0 - Z1 - 2.4, [cx, 0.02, cz], { uv: 0.4, collide: true });
    b.box('dm_wood', 13.7, 0.012, 18.7, [71.95, 0.046, 10.6], { uv: 0.8 }); // 101/102 木地板
    const hole = { x0: 54, x1: 61.6, z0: 28, z1: 26 };
    for (const [a, c, d, e] of [[53.2, hole.x0, 38.8, 1.2], [hole.x1, 78.8, 38.8, 1.2], [hole.x0, hole.x1, 38.8, hole.z0], [hole.x0, hole.x1, hole.z1, 1.2]]) b.box('dz_ceil', c - a, 0.3, d - e, [(a + c) / 2, F2 - 0.15, (d + e) / 2], { uv: 0.3, collide: true });
    b.box('dm_wood', 78.8 - 53.2, 0.04, 37.6, [cx, F2 + 0.02, cz], { uv: 0.8 });
    b.box('dz_ceil', 25.6, 0.3, 37.6, [cx, 9.2 - 0.15, cz], { uv: 0.3 });
    // 楼梯（大厅北侧，向东上 2F）
    { const n = 26, run = 7.4 / n, rise = F2 / n; for (let i = 0; i < n; i++) b.box('dz_beam', run + 0.02, 0.18, 1.6, [54.2 + run * (i + 0.5), rise * (i + 1) - 0.09, 27], { uv: 0.6 }); world.ramp([53.8, 0, 27], [61.6, F2, 27], 1.6); b.box('brass', 7.8, 0.05, 0.05, [57.9, F2 / 2 + 1.0, 26.15], { uv: 1, rot: [0, 0, Math.atan2(F2, 7.4)] }); world.box(57.9, F2 / 2 + 0.6, 26.1, 7.6, F2 + 1.2, 0.1); }
    // 一层隔墙：小卖部/宿管室（南）、洗衣房（北）、走廊西墙、客房隔墙
    for (const [y0, hh] of [[0, F2 - 0.3], [F2, 4.3]]) {
      wallZ(b, 'dz_paintUp', 12, 53.2, 62, y0, hh, 0.2, y0 ? [] : [{ x0: 55, x1: 60, h: 1.1 }], true);
      wallZ(b, 'dz_paintUp', 28.2, 53.2, 62, y0, hh, 0.2, y0 ? [{ x0: 55.5, x1: 57, h: 2.2 }] : [{ x0: 55.5, x1: 58, h: 2.4 }], true);
      wallX(b, 'dz_paintUp', 62, 12, 1.2, y0, hh, 0.2, [{ z0: 7.2, z1: 6.0, h: 2.2 }], true); wallX(b, 'dz_paintUp', 62, 38.8, 28.2, y0, hh, 0.2, [{ z0: 34.2, z1: 33.0, h: 2.2 }], true);
      const doors = y0 ? [{ z0: 26.4, z1: 25.2, h: 2.2 }] : [{ z0: 6.5, z1: 5.3, h: 2.2 }, { z0: 15.9, z1: 14.7, h: 2.2 }];
      wallX(b, 'dz_paintUp', 65, 38.8, 1.2, y0, hh, 0.2, doors, true);
      for (const z of [10.6, 20, 29.4]) wallZ(b, 'dz_paintUp', z, 65, 78.8, y0, hh, 0.2, [], true);
      for (const z of [10.6, 20, 29.4]) b.box('dz_paintLow', 13.8, 1.2, 0.22, [71.9, y0 + 0.6, z], { uv: 0.6 });
      b.box('dz_paintLow', 0.22, 1.2, 37.6, [65, y0 + 0.6, 20], { uv: 0.6 });
      // 门牌与关着的门
      const plates = y0 ? [['205', 5.9], ['206', 15.3], ['207', 25.8], ['208', 34.1]] : [['101', 5.9], ['102', 15.3], ['103', 24.7], ['104', 34.1]];
      for (const [num, z] of plates) { const open = (y0 && num === '207') || (!y0 && (num === '101' || num === '102')); if (!open) { b.box('doorWood', 0.08, 2.2, 1.1, [64.9, y0 + 1.1, z], { uv: 1 }); b.box('brass', 0.12, 0.05, 0.14, [64.84, y0 + 1.05, z - 0.4], { uv: 1 }); } const tp = plane(zone, tagMaterial(num), 0.36, 0.14, 64.88, y0 + 2.45, z, -Math.PI / 2); void tp; }
      // 走廊吸顶灯
      for (let z = 4; z < 38; z += 5) b.box('dz_glowCold', 0.9, 0.04, 0.3, [63.5, y0 + (y0 ? 4.25 : F2 - 0.35), z], { uv: false });
    }
    // 大厅：信箱墙、沙发、贩卖机、公告板、绿植、地垫
    for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) { b.box('brass', 0.04, 0.3, 0.36, [53.3, 1.0 + j * 0.34, 14.2 + i * 0.4], { uv: 1 }); b.box('dz_bakelite', 0.03, 0.03, 0.1, [53.33, 1.12 + j * 0.34, 14.2 + i * 0.4], { uv: false }); }
    b.box('dz_wain', 0.4, 1.6, 4.2, [53.4, 1.5, 16], { uv: 0.6 });
    if (!R3.dorm) for (const z of [22.4, 24.4]) { b.box('leather', 0.9, 0.45, 1.8, [58.6, 0.23, z], { uv: 1, collide: true }); b.box('leather', 0.2, 0.5, 1.8, [59.0, 0.7, z], { uv: 1 }); } if (!R3.dorm) { b.box('wood', 0.8, 0.45, 1.2, [57.2, 0.23, 23.4], { uv: 0.6, collide: true }); paperStack(b, 57.2, 0.46, 23.4, 0.3, 4); }
    { b.box('paintedSteel', 0.8, 1.9, 0.75, [61.3, 0.95, 13.2], { uv: 1, collide: true }); const vm = plane(zone, cvMat(256, 420, (c, w, h) => { c.fillStyle = '#0a1420'; c.fillRect(0, 0, w, h); for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) { c.fillStyle = ['#c83a2a', '#2a8ac8', '#e8c040', '#3ab070'][(r + k) % 4]; c.fillRect(20 + k * 56, 40 + r * 64, 40, 50); } c.fillStyle = '#e8c87a'; c.font = '900 26px "NB Title", "NB Serif", serif'; c.fillText('篇幅补充剂', 30, 380); }, { emis: 0.6 }), 0.7, 1.4, 60.9, 1.1, 13.2, -Math.PI / 2); void vm; }
    const rulesM = plane(zone, docMat('doc_dorm_rules', signMaterial('职工宿舍管理条例', ['一、23:00 熄灯', '二、请勿在走廊朗读', '三、发现房间多出一间', '　　请立即上报宿管', '四、残页请投回收箱'], 512, 680)), 0.9, 1.2, 64.88, 1.6, 9.0, -Math.PI / 2); anchor('doc_dorm_rules', rulesM);
    // 宿管室窗口 + 分配表
    b.box('wood', 5, 1.1, 0.5, [57.5, 0.55, 12.3], { uv: 0.6 }); b.box('blackMarble', 5.2, 0.05, 0.6, [57.5, 1.12, 12.3], { uv: 0.5 });
    const asg = plane(zone, docMat('doc_dorm_assign', signMaterial('新入职人员宿舍分配表', ['3 号楼 101　——', '3 号楼 102　——', '3 号楼 207　（新人）', '分配日期：2023 年', '　　　　　宿管科'], 560, 720)), 1.0, 1.3, 61.4, 2.2, 12.14, 0); anchor('doc_dorm_assign', asg);
    hangingSign(zone, M, '宿管室　·　小卖部', 57.5, 3.4, 12.5, 0, 2.4);
    const keeper = person(M, { coat: 0x4a3a30, glasses: true }); keeper.position.set(57.0, 0, 10.4); zone.add(keeper);
    for (let s = 0; s < 3; s++) { b.box('steel', 0.4, 0.02, 4.8, [53.6, 0.5 + s * 0.6, 6.5], { uv: 1 }); for (let k = 0; k < 12; k++) b.box(['kraft', 'paintR', 'navy', 'm5_olive'][k % 4], 0.22, 0.24, 0.16, [53.6, 0.63 + s * 0.6, 4.4 + k * 0.38], { uv: false }); }
    // 洗衣房
    for (let k = 0; k < 4; k++) { const x = 54.4 + k * 1.6; b.box('whitePad', 0.75, 0.9, 0.7, [x, 0.45, 38.2], { uv: 1, collide: true }); b.add('dz_glassDark', new THREE.CylinderGeometry(0.22, 0.22, 0.04, 20), { pos: [x, 0.5, 37.84], rot: [Math.PI / 2, 0, 0] }, { uv: false }); }
    for (let k = 0; k < 3; k++) b.add('steel', new THREE.CylinderGeometry(0.015, 0.015, 7, 6), { pos: [57.6, 2.1 + k * 0.01, 31 + k * 1.6], rot: [0, 0, Math.PI / 2] }, { uv: 1 });
    for (let k = 0; k < 9; k++) b.add(['paintW', 'navy', 'paintR'][k % 3], new THREE.PlaneGeometry(0.5, 0.7), { pos: [54.6 + (k % 5) * 1.3, 1.7, 31 + Math.floor(k / 3) * 1.6] }, { uv: false });
    hangingSign(zone, M, '洗衣房', 56.3, 2.9, 28.0, Math.PI, 1.4);
    // 回收箱
    b.box('navy', 0.6, 1.0, 0.5, [63.6, 0.5, 30.5], { uv: 1, collide: true }); plane(zone, tagMaterial('叙事残页回收箱'), 0.5, 0.14, 63.29, 0.8, 30.5, Math.PI / 2 * 0 - Math.PI / 2 + Math.PI);
    // 101 六人间（M7 重做）：铁架上下铺 ×5、窗下长书桌、木衣柜、脸盆架、暖瓶、窗帘、值日表
    for (const [x, z, o] of [[67.0, 2.35, { top: 'tofu' }], [69.7, 2.35, { top: 'bare', towel2: true }], [72.4, 2.35, { top: 'tofu' }], [68.6, 9.45, { top: 'tofu', bottom: 'quilt', towel2: true }], [71.3, 9.45, { top: 'none' }]]) bunkBed(b, world, x, 0.046, z, 0, { ...o });
    windowCurtain(b, 78.72, 0.95, 5.9, -Math.PI / 2, 2.0, 1.7);
    desk(b, world, 78.3, 0.046, 5.0, -Math.PI / 2, 1.2); desk(b, world, 78.3, 0.046, 6.8, -Math.PI / 2, 1.2);
    P.add('desk_lamp', [78.4, 0.83, 4.6], { h: 0.42, yaw: -Math.PI / 2 }); greenLamp(b, 78.35, 0.83, 7.2, -Math.PI / 2);
    for (const [x, z] of [[78.1, 5.35], [78.15, 6.35]]) mug(b, x, 0.83, z); thermos(b, 78.45, 0.83, 5.7); folderStack(b, 78.2, 0.83, 7.0, 0.3, 3); paperStack(b, 78.0, 0.83, 4.9, 0.2, 5);
    for (let k = 0; k < 6; k++) b.box(['dm_bookA', 'dm_bookB', 'dm_bookC'][k % 3], 0.17, 0.24, 0.035, [78.52, 0.95, 6.05 + k * 0.04], { uv: false });
    for (const z of [1.85, 2.95, 8.85, 9.95]) wardrobe(b, world, 78.42, 0.046, z, -Math.PI / 2, { suitcase: z !== 2.95 });
    washstand(b, world, 65.55, 0.046, 8.2, Math.PI / 2); washstand(b, world, 65.55, 0.046, 3.4, Math.PI / 2);
    for (let k = 0; k < 3; k++) thermos(b, 66.0 + k * 0.2, 0.046, 10.3);
    { b.box('dm_desk', 0.8, 0.04, 0.8, [70.6, 0.76, 6.0], { uv: 1 }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box('dm_desk', 0.04, 0.72, 0.04, [70.6 + sx * 0.35, 0.4, 6.0 + sz * 0.35], { uv: 1 }); world.box(70.6, 0.4, 6.0, 0.8, 0.8, 0.8); for (const [dx, dz] of [[-0.7, 0], [0.7, 0.1], [0, 0.75]]) { b.add('dm_desk', new THREE.CylinderGeometry(0.16, 0.16, 0.03, 12), { pos: [70.6 + dx, 0.47, 6.0 + dz] }, { uv: 1 }); b.add('dm_frame', new THREE.CylinderGeometry(0.012, 0.012, 0.45, 5), { pos: [70.6 + dx, 0.24, 6.0 + dz] }, { uv: false }); } mug(b, 70.5, 0.78, 5.9); thermos(b, 70.8, 0.78, 6.15); }
    plane(zone, signMaterial('101 室值日表', ['周一　清扫　打水', '周二　倒垃圾', '周三　擦窗　拖地', '周四　——', '熄灯前互相点名'], 400, 560), 0.5, 0.7, 65.13, 1.55, 4.6, Math.PI / 2);
    plane(zone, posterMaterial('叙事高考', '加油！'), 0.42, 0.6, 65.13, 1.6, 7.3, Math.PI / 2);
    for (const x of [68.5, 72.5, 76.0]) tubeLamp(b, x, F2 - 0.3, 6.0, Math.PI / 2);
    point(zone, 0xffe8cc, 4, [71, 3.6, 6], 9); point(zone, 0xffe8cc, 3, [67.5, 3.4, 3.0], 7); point(zone, 0xffe8cc, 3, [74.5, 3.4, 8.5], 7);
    b.add('dm_frame', new THREE.CylinderGeometry(0.006, 0.006, 9.5, 4), { pos: [71.0, 2.25, 5.6], rot: [0, 0, Math.PI / 2] }, { uv: false }); // 晾衣绳
    for (let k = 0; k < 7; k++) b.add(['dm_towel', 'dm_towel2', 'dm_sheet', 'navy', 'dm_olive', 'dm_towel2', 'dm_sheet'][k], new THREE.PlaneGeometry(k % 3 === 2 ? 0.7 : 0.45, k % 3 === 2 ? 0.9 : 0.55, 1, 1), { pos: [67.0 + k * 1.25, 2.25 - (k % 3 === 2 ? 0.45 : 0.27), 5.6], rot: [0, (k % 2) * 0.15, 0] }, { uv: false }); point(zone, 0xd8e4f4, 2.5, [77.6, 1.9, 5.9], 6);
    // 102 单间（M7 重做）
    { singleBed(b, world, 77.75, 0.046, 15.2, 0, { olive: true }); windowCurtain(b, 78.72, 0.95, 18.2, -Math.PI / 2, 1.6, 1.7);
      desk(b, world, 72, 0.046, 19.62, Math.PI, 1.2); P.add('desk_lamp', [71.6, 0.83, 19.65], { h: 0.4, yaw: Math.PI }); folderStack(b, 72.4, 0.83, 19.6, 0, 3); thermos(b, 72.85, 0.046, 19.7); mug(b, 72.2, 0.83, 19.45);
      P.add('wall_clock', [72, 2.6, 19.85], { w: 0.4, yaw: Math.PI }); wardrobe(b, world, 65.42, 0.046, 18.9, Math.PI / 2); washstand(b, world, 65.55, 0.046, 11.6, Math.PI / 2);
      noticeBoard(zone, b, 70.0, 1.75, 10.74, 0, 1.4, 0.8, '个人备忘', [['待办', ['领工牌', '交体检表'], '#efe8d6'], ['电话', ['宿管 8207', '后勤 8113'], '#e8eef4'], ['注意', ['别在走廊', '朗读'], '#f4e8c8']]);
      tubeLamp(b, 72, F2 - 0.3, 15.3, Math.PI / 2); point(zone, 0xffd8b0, 3, [72, 3.4, 15], 7); }
    // 二层活动室 + 207
    if (!R3.dorm2) for (const z of [14, 18]) { b.box('wood', 2.2, 0.05, 1.0, [57.5, F2 + 0.76, z], { uv: 0.6, collide: true }); for (const dx of [-0.7, 0.7]) b.box('wood', 0.45, 0.45, 0.45, [57.5 + dx, F2 + 0.23, z + 0.8], { uv: 0.6 }); }
    b.box('blackMetal', 0.1, 1.0, 1.7, [53.4, F2 + 1.8, 20], { uv: 1 }); plane(zone, cvMat(512, 300, (c, w, h) => { c.fillStyle = '#081018'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8c87a'; c.font = '900 34px "NB Title", "NB Serif", serif'; c.fillText('京城新闻　·　稳定度 97.3%', 20, 60); c.fillStyle = '#9fb4e0'; c.font = '24px "NB Sans", sans-serif'; c.fillText('通州区连续三日低于 96%', 20, 120); }, { emis: 0.7 }), 1.6, 0.92, 53.47, F2 + 1.8, 20, Math.PI / 2);
    { const z0 = 20.2, x = 72; bunkBed(b, world, 77.85, F2 + 0.04, 21.35, 0, { bottom: 'quilt', top: 'bare', suitcase: false }); windowCurtain(b, 78.72, F2 + 0.95, 25.6, -Math.PI / 2, 1.8, 1.7); wardrobe(b, world, 65.42, F2 + 0.04, 21.2, Math.PI / 2); washstand(b, world, 65.55, F2 + 0.04, 28.4, Math.PI / 2); thermos(b, 73.0, F2 + 0.04, 29.0); thermos(b, 73.2, F2 + 0.04, 29.05); mug(b, 71.7, F2 + 0.79, 28.7); tubeLamp(b, 72, 8.9, 24.8, Math.PI / 2);
      bunkBed(b, world, 75.0, F2 + 0.04, 21.35, 0, { bottom: 'bare', top: 'none', suitcase: false }); // 室友的空铺
      for (let k = 0; k < 9; k++) b.box('dm_frameCream', 0.08, 0.6, 0.05, [78.6, F2 + 0.45, 24.9 + k * 0.17], { uv: false }); b.box('dm_frameCream', 0.1, 0.05, 1.5, [78.6, F2 + 0.13, 25.6], { uv: false }); // 暖气片
      rug(b, 71.5, 24.8, 2.4, 3.2, F2 + 0.05, 'dz_rugNavy');
      { const sx0 = 68.4, sz = 29.12; for (const ly of [0.05, 0.45, 0.85, 1.25, 1.65]) b.box('dm_desk', 1.2, 0.03, 0.3, [sx0, F2 + ly, sz], { uv: 1 }); for (const dx of [-0.6, 0.6]) b.box('dm_desk', 0.03, 1.7, 0.3, [sx0 + dx, F2 + 0.85, sz], { uv: 1 }); for (let r = 0; r < 4; r++) for (let k = 0; k < 18 - r * 3; k++) b.box(['dm_bookA', 'dm_bookB', 'dm_bookC', 'kraft'][(k + r) % 4], 0.035, 0.22 + (k % 3) * 0.03, 0.2, [sx0 - 0.55 + k * 0.045, F2 + 0.18 + r * 0.4 + (k % 3) * 0.015, sz], { uv: false }); world.box(sx0, F2 + 0.9, sz, 1.2, 1.8, 0.32); }
      for (let k = 0; k < 3; k++) b.add('dm_brass', new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6), { pos: [65.17, F2 + 1.75, 23.6 + k * 0.3], rot: [0, 0, Math.PI / 2 - 0.4] }, { uv: false }); b.add('navy', new THREE.BoxGeometry(0.08, 0.8, 0.5), { pos: [65.2, F2 + 1.35, 23.9] }, { uv: 1 }); // 衣钩+制服外套
      point(zone, 0xd8e4f4, 2.2, [77.5, F2 + 1.9, 25.6], 6); point(zone, 0xffe0b8, 2.5, [70, F2 + 3, 22.5], 7); b.add('dm_case', new THREE.BoxGeometry(0.7, 0.45, 0.25), { pos: [76.6, F2 + 0.27, 23.2], rot: [0, 0.3, 0] }, { uv: false }); desk(b, world, x, F2 + 0.04, 28.95, Math.PI, 1.4); greenLamp(b, x - 0.5, F2 + 0.83, 29.0, Math.PI); P.add('picture_frame', [x + 0.4, F2 + 0.83, 29.05], { h: 0.22, yaw: Math.PI });
      const env = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.006, 0.12), M.kraft); env.position.set(x + 0.3, F2 + 0.83, 28.75); env.rotation.y = 0.2; zone.add(env); anchor('doc_dorm_letter', env, 2.4); point(zone, 0xffd0a0, 3, [x, F2 + 3, 25], 7); void z0; }
    point(zone, 0xffe4c0, 6, [57.5, 3.6, 20], 12); point(zone, 0xffe4c0, 5, [57.5, F2 + 3.4, 20], 10); point(zone, 0xdfe8ff, 3, [63.5, 3.5, 30], 9);
    for (const [x, z] of [[53.8, 21.9], [61.4, 19]]) plantPot(b, x, 0, z, 1.0);
    // M7：外墙内侧刷漆衬层（原外立面石材直接作室内墙面，映出金色大厅环境图）
    for (const [y0, hh] of [[0, F2 - 0.3], [F2, 4.3]]) {
      for (const [z0, z1] of [[1.2, 18.35], [21.65, 38.8]]) { if (y0 && z0 > 20) continue; b.box('dz_paintUp', 0.04, hh, z1 - z0, [53.24, y0 + hh / 2, (z0 + z1) / 2], { uv: 0.6 }); }
      if (y0) b.box('dz_paintUp', 0.04, hh, 17.15, [53.24, y0 + hh / 2, 30.225], { uv: 0.6 });
      if (!y0) b.box('dz_paintUp', 0.04, hh - 3.65, 3.3, [53.24, 3.65 + (hh - 3.65) / 2, 20], { uv: 0.6 });
      b.box('dz_paintUp', 0.04, hh, 37.6, [78.76, y0 + hh / 2, 20], { uv: 0.6 }); b.box('dz_paintLow', 0.05, 0.9, 37.6, [78.75, y0 + 0.45, 20], { uv: 0.6 });
      for (const z of [1.24, 38.76]) { b.box('dz_paintUp', 25.6, hh, 0.04, [66, y0 + hh / 2, z], { uv: 0.6 }); b.box('dz_paintLow', 25.6, 1.1, 0.05, [66, y0 + 0.55, z + (z < 20 ? 0.01 : -0.01)], { uv: 0.6 }); }
    }
    point(zone, 0xffe4c0, 4, [57.5, 3.4, 15.5], 9);
    // M7 大厅加密：暖瓶架（开水房）、公告栏、长椅、日光灯、挂钟、雨伞桶
    thermosRack(b, world, 53.55, 0.04, 24.75, Math.PI / 2, 10); hangingSign(zone, M, '开水房　6:30–22:30', 54.0, 2.7, 24.75, Math.PI / 2, 1.8);
    noticeBoard(zone, b, 64.86, 1.75, 23.2, -Math.PI / 2, 2.6, 1.3, '三号楼公告栏', [['熄灯通知', ['本周起 23:00 熄灯', '走廊灯 23:30 关闭', '　　——宿管科'], '#efe8d6'], ['卫生评比', ['一等　101 室', '二等　205 室', '待改进　207 室'], '#f4ead0'], ['失物招领', ['黑色钢笔一支', '（笔帽刻「南」）', '请到宿管室认领'], '#e6edf2'], ['复习小组', ['叙事高考模拟卷', '每周三晚 活动室', '自带草稿纸'], '#f2e2d6']]);
    for (const z of [17.6, 19.6]) { b.box('dm_desk', 0.42, 0.04, 1.6, [64.6, 0.45, z], { uv: 1 }); for (const dz of [-0.7, 0.7]) b.box('dm_frame', 0.38, 0.43, 0.04, [64.6, 0.22, z + dz], { uv: false }); world.box(64.6, 0.25, z, 0.45, 0.5, 1.6); }
    for (const [x, z] of [[57.5, 15], [57.5, 19.5], [57.5, 24], [63.5, 21]]) tubeLamp(b, x, F2 - 0.3, z, 0);
    P.add('wall_clock', [57.5, 3.1, 12.48], { w: 0.5 });
    b.add('dm_frame', new THREE.CylinderGeometry(0.15, 0.13, 0.55, 14, 1, true), { pos: [61.5, 0.32, 21.8] }, { uv: false }); for (let k = 0; k < 3; k++) b.add(['navy', 'dm_case', 'dm_shoe'][k], new THREE.CylinderGeometry(0.02, 0.02, 0.9, 5), { pos: [61.48 + k * 0.04, 0.6, 21.8 + (k - 1) * 0.05], rot: [0.08 * (k - 1), 0, 0.06] }, { uv: false });
    rug(b, 57.5, 20, 4.4, 6, 0.06, 'dz_rugNavy');
    for (let k = 0; k < 6; k++) litWindow(b, X1 + 0.62, F2 + 1.4, 3 + k * 6.6, Math.PI / 2, 1.1, 2.2);
    world.surface(X0, Z1, X1, Z0, 'stone', -1, 12);
    jobs.push(Promise.resolve());
  }

  // ======================= 机库与停机坪 helipad (73…99, −87…−53) =======================
  {
    const X0 = 73, X1 = 99, Z0 = -53, Z1 = -87, H = 12, cx = 86, cz = -70;
    for (const [x, z, yaw, len] of [[cx, Z0, 0, X1 - X0], [cx, Z1, Math.PI, X1 - X0], [X1, cz, Math.PI / 2, Z0 - Z1]]) bayWall(b, new Frame([x, 0, z], yaw), len, H, 4, { collide: true, buttressD: 1.2, pinnacles: false });
    wallX(b, 'stone', X0 + 0.6, Z0, Z1, 0, H, 1.2, [{ z0: -63, z1: -77, h: 8.4 }], true);
    for (const z of [-62.4, -77.6]) b.box('iron', 0.5, 8.6, 0.5, [X0 - 0.1, 4.3, z], { uv: 1 }); b.box('paintY', 0.3, 0.4, 14.4, [X0 - 0.2, 8.6, -70], { uv: false });
    hangingSign(zone, M, '飞行器机库　·　停机坪', X0 - 0.5, 9.6, -70, -Math.PI / 2, 4.2);
    // 平屋顶 = 停机坪（y=12）
    b.box('concrete', X1 - X0, 0.4, Z0 - Z1, [cx, H + 0.2, cz], { uv: 0.2, collide: true });
    b.box('dz_ceil', X1 - X0 - 2.4, 0.05, Z0 - Z1 - 2.4, [cx, H - 0.05, cz], { uv: 0.3 });
    for (const [x, z, w, d] of [[cx, Z0, X1 - X0, 0.4], [cx, Z1, X1 - X0, 0.4], [X1, cz, 0.4, Z0 - Z1], [X0, cz, 0.4, Z0 - Z1]]) { b.box('stone', w, 1.1, d, [x, H + 0.95, z], { uv: 0.4, collide: true }); b.box('gold', w + 0.02, 0.06, d + 0.02, [x, H + 1.5, z], { uv: 1 }); }
    { const r = new THREE.RingGeometry(8.2, 8.8, 64); r.rotateX(-Math.PI / 2); b.add('paintY', r, { pos: [cx, H + 0.41, cz] }, { uv: false }); const r2 = new THREE.RingGeometry(6.3, 6.5, 64); r2.rotateX(-Math.PI / 2); b.add('paintW', r2, { pos: [cx, H + 0.41, cz] }, { uv: false });
      const em = emblem(4.0, M.goldBright, M.navy); em.rotation.x = -Math.PI / 2; em.position.set(cx, H + 0.43, cz); zone.add(em);
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; b.add('dz_glow', new THREE.CylinderGeometry(0.12, 0.14, 0.12, 8), { pos: [cx + Math.cos(a) * 9.4, H + 0.46, cz + Math.sin(a) * 9.4] }, { uv: false }); } }
    { b.add('steel', new THREE.CylinderGeometry(0.05, 0.05, 4, 6), { pos: [X1 - 1.5, H + 2.4, Z1 + 1.5] }, { uv: 1 }); b.add('m5_orange', new THREE.ConeGeometry(0.35, 1.8, 10, 1, true), { pos: [X1 - 2.3, H + 4.1, Z1 + 1.5], rot: [0, 0, Math.PI / 2 + 0.25] }, { uv: false }); }
    // 外挂钢楼梯（南立面外侧，自西向东上屋顶）
    { const zS = Z0 + 2.2, n = 40, xa = 76, xb = 97, run = (xb - xa) / n, rise = H / n; for (let i = 0; i < n; i++) b.box('dz_grate', run + 0.02, 0.06, 1.6, [xa + run * (i + 0.5), rise * (i + 1), zS], { uv: 2 }); b.box('blackMetal', 22, 0.4, 0.12, [86.5, H / 2, zS + 0.85], { uv: 1, rot: [0, 0, Math.atan2(H, xb - xa)] }); b.box('brass', 24, 0.05, 0.05, [86.5, H / 2 + 1.0, zS + 0.85], { uv: 1, rot: [0, 0, Math.atan2(H, xb - xa)] }); for (let i = 0; i <= n; i += 5) b.box('iron', 0.04, 1.0 + rise * i * 0, 0.04, [xa + run * i, rise * i + 0.5, zS + 0.85], { uv: 1 }); world.ramp([xa - 0.3, 0, zS], [xb, H + 0.4, zS], 1.6); world.box(86.5, H / 2 + 0.6, zS + 0.9, 24, H + 1.2, 0.1); b.box('dz_grate', 3, 0.1, 2.6, [98, H + 0.35, Z0 + 1.6], { uv: 2 }); b.box('stone', 2.4, 0.01, 0.4, [98, H + 1.0, Z0 + 0.2], { uv: 1 }); }
    // 飞行器（程序化）×3：机库两架 + 屋顶一架
    const vtol = (x, y, z, yaw) => { const g = new THREE.Group(); const body = new THREE.MeshStandardMaterial({ color: 0x0f1a36, metalness: 0.6, roughness: 0.32 }); const add = (geo, m, px, py, pz, r = [0, 0, 0]) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.rotation.set(...r); me.castShadow = true; g.add(me); return me; };
      add(new THREE.CapsuleGeometry(1.1, 5.2, 8, 16), body, 0, 1.9, 0, [Math.PI / 2, 0, 0]); add(new THREE.SphereGeometry(1.0, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.glassOut, 0, 2.3, -2.4, [-0.4, 0, 0]);
      add(new THREE.BoxGeometry(9, 0.18, 1.6), body, 0, 2.4, 0.4); for (const sx of [-1, 1]) { add(new THREE.CylinderGeometry(1.0, 1.0, 0.5, 24, 1, true), M.blackMetal, sx * 4.4, 2.5, 0.4); add(new THREE.TorusGeometry(1.0, 0.06, 6, 24), M.gold, sx * 4.4, 2.75, 0.4, [Math.PI / 2, 0, 0]); for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(1.8, 0.03, 0.18), M.iron, sx * 4.4, 2.55, 0.4, [0, k * 1.05, 0]); }
      add(new THREE.BoxGeometry(0.15, 1.4, 1.2), body, 0, 2.9, 3.2); add(new THREE.BoxGeometry(5.24, 0.08, 0.08), M.gold, 0, 1.9, 0.0, [0, Math.PI / 2, 0]).scale.set(1, 1, 1);
      for (const [px, pz] of [[-0.8, -1.8], [0.8, -1.8], [-0.8, 2], [0.8, 2]]) add(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6), M.steel, px, 0.4, pz); for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.12, 0.08, 4.6), M.steel, sx * 0.8, 0.04, 0.1);
      const em = emblem(0.42, M.goldBright, M.navy); em.position.set(1.13, 1.9, 0.6); em.rotation.y = Math.PI / 2; g.add(em);
      g.position.set(x, y, z); g.rotation.y = yaw; zone.add(g); world.box(x, y + 1.6, z, 3.2, 3.2, 7.4, yaw); return g; };
    if (!R3.hangar) { vtol(84, 0, -63.5, Math.PI / 2 + 0.1); vtol(86, 0, -78, Math.PI / 2 - 0.15); } vtol(cx, H + 0.4, cz, 0.7); // 批次6：机库内两架胶囊体飞行器 → r3plan 直升机 + 勤务车
    // 机库内：维修吊臂、充电桩、调度台（起降日志）、防爆运输箱（证物标签）、行李箱、工具车
    b.box('paintY', 0.4, 0.4, 32, [93, 9.6, -70], { uv: false }); b.box('paintY', 0.4, 0.4, 32, [79, 9.6, -70], { uv: false }); b.box('paintY', 14.4, 0.5, 0.5, [86, 9.2, -71], { uv: false }); b.add('steel', new THREE.CylinderGeometry(0.02, 0.02, 4, 4), { pos: [86, 7.0, -71] }, { uv: 1 });
    for (const z of [-58, -82]) { b.box('paintW', 0.5, 1.6, 0.4, [97.8, 0.8, z], { uv: false, collide: true }); plane(zone, new THREE.MeshStandardMaterial({ color: 0, emissive: 0x40d080, emissiveIntensity: 1 }), 0.3, 0.2, 97.53, 1.2, z, -Math.PI / 2); }
    { const dx = 96.6, dz = -85; b.box('wood', 2.4, 0.9, 0.9, [dx, 0.45, dz], { uv: 0.6, collide: true }); b.box('blackMarble', 2.5, 0.05, 1.0, [dx, 0.92, dz], { uv: 0.5 }); P.add('monitor', [dx - 0.5, 0.95, dz - 0.25], { h: 0.4 }); telephone(b, dx + 0.7, 0.95, dz - 0.1, 0.4);
      const log = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.44), docMat('doc_helipad_log', cvMat(256, 340, (c, w, h) => { c.fillStyle = '#ece4cf'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1612'; c.font = '900 26px "NB Title", "NB Serif", serif'; c.fillText('起降日志', 16, 36); c.font = '14px "NB Sans", sans-serif'; for (let i = 0; i < 12; i++) c.fillText(i === 6 ? '07 号架次　——　批准：柒' : `0${(i % 9) + 1} 号架次　京城　已归`, 16, 70 + i * 22); }))); log.position.set(dx + 0.1, 0.96, dz + 0.1); log.rotation.y = 0.15; zone.add(log); anchor('doc_helipad_log', log, 2.6);
      hangingSign(zone, M, '起降调度台', dx, 3.4, dz + 0.6, 0, 2.0); point(zone, 0xffd8b0, 4, [dx, 3, dz + 1.2], 7); }
    { const bx = 76, bz = -84.5; b.box('m5_olive', 2.2, 1.1, 1.2, [bx, 0.55, bz], { uv: 1, collide: true }); for (const dx of [-0.9, 0.9]) b.box('paintY', 0.08, 1.12, 1.22, [bx + dx, 0.55, bz], { uv: false }); const lab = plane(zone, docMat('doc_helipad_crate', tagMaterial('证物　·　运输中')), 0.6, 0.3, bx, 0.75, bz + 0.61); anchor('doc_helipad_crate', lab, 2.4); }
    { const sf = R3.hangar ? plane(zone, docMat('doc_helipad_safety', signMaterial('乘机安全须知', ['起降时请系好安全带', '舱内禁止朗读', '目的地栏为空时', '请勿登机'], 420, 560)), 0.42, 0.56, 91.37, 1.45, -59.6, -Math.PI / 2) : plane(zone, docMat('doc_helipad_safety', signMaterial('乘机安全须知', ['起降时请系好安全带', '舱内禁止朗读', '目的地栏为空时', '请勿登机'], 420, 560)), 0.42, 0.56, 85.3, 1.8, -63.5 + 1.15, 0); /* 批次6：原贴在胶囊机身上 → 移到直升机旁落地展架（r3plan） */ anchor('doc_helipad_safety', sf, 3); }
    for (const [x, z, h] of [[78, -55, 0], [78.7, -55, 0], [78.35, -55, 0.55], [95, -55, 0]]) P.add('military_crate', [x, h, z], { h: 0.55, yaw: x });
    P.add('storage_cart', [80, 0, -86], { h: 1.0, yaw: 0.4 }); P.add('plastic_container', [92, 0, -85.5], { h: 0.6 });
    if (!R3.hangar) for (const z of [-66, -74]) b.box('paintY', 12, 0.006, 0.15, [86, 0.012, z], { uv: false });
    for (let x = 76; x < 98; x += 5) for (const z of [-62, -78]) { b.box('dz_glowCold', 2.2, 0.06, 0.3, [x, H - 0.4, z], { uv: false }); }
    point(zone, 0xdfe8ff, 10, [86, 9, -62], 16); point(zone, 0xdfe8ff, 10, [86, 9, -78], 16);
    // —— M6 布景加密：屋架桁条、东墙更衣柜、南墙工具挂板、液氢加注车、软管盘、油桶堆、维修梯台、轮挡、停机位地标圈、局旗 ——
    for (let x = X0 + 3; x < X1 - 1; x += 4) { b.box('blackMetal', 0.3, 0.5, Z0 - Z1 - 2.4, [x, H - 1.0, cz], { uv: 1 }); for (let z = Z1 + 3; z < Z0 - 2; z += 3) b.add('blackMetal', new THREE.BoxGeometry(0.08, 0.08, 3.6), { pos: [x, H - 1.6, z], rot: [0.6, 0, 0] }, { uv: 1 }); }
    for (let x = X0 + 1; x < X1; x += 2) b.box('blackMetal', 0.12, 0.12, Z0 - Z1 - 2.4, [x, H - 0.6, cz], { uv: 1 });
    for (let k = 0; k < 14; k++) { const z = -61 + k * -1.25; if (z < -79) break; b.box('paintedGreen', 0.6, 2.0, 1.15, [98.2, 1.0, z], { uv: 1, collide: true }); b.box('steel', 0.02, 0.18, 0.04, [97.88, 1.2, z + 0.4], { uv: 1 }); for (let v = 0; v < 3; v++) b.box('blackMetal', 0.01, 0.02, 0.6, [97.89, 1.7 + v * 0.06, z], { uv: 1 }); }
    for (let k = 0; k < 4; k++) { const x = 76 + k * 5.5; b.box('wood', 4.2, 1.8, 0.05, [x, 1.9, Z0 - 0.75], { uv: 0.8 }); for (let t = 0; t < 14; t++) { const tx = x - 1.9 + (t % 7) * 0.62, ty = 1.4 + Math.floor(t / 7) * 0.8; b.box(t % 3 ? 'steel' : 'paintR', 0.05, 0.3 + (t % 4) * 0.08, 0.03, [tx, ty, Z0 - 0.8], { uv: 1, rot: [0, 0, (t % 5 - 2) * 0.08] }); }
      b.box('steel', 4.0, 0.04, 0.6, [x, 0.9, Z0 - 1.1], { uv: 1 }); b.box('paintR', 1.6, 0.8, 0.55, [x - 1, 0.45, Z0 - 1.1], { uv: 1, collide: true }); for (let d = 0; d < 4; d++) b.box('blackMetal', 1.5, 0.02, 0.02, [x - 1, 0.2 + d * 0.18, Z0 - 0.82], { uv: 1 }); }
    const cart = (x, z, yaw) => { const f = new Frame([x, 0, z], yaw); b.add('paintW', new THREE.BoxGeometry(2.6, 0.5, 1.3), f.at(0, 0.6, 0), { uv: 1, collide: true }); for (const dz of [-0.35, 0.35]) b.add('steel', new THREE.CylinderGeometry(0.3, 0.3, 2.2, 16), f.at(0, 1.15, dz, [0, 0, Math.PI / 2]), { uv: 1 }); b.add('m5_orange', new THREE.BoxGeometry(0.5, 0.9, 1.2), f.at(1.2, 1.1, 0), { uv: 1 }); for (const [wx, wz] of [[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6]]) b.add('rubber', new THREE.CylinderGeometry(0.22, 0.22, 0.16, 14), f.at(wx, 0.22, wz, [Math.PI / 2, 0, 0]), { uv: false }); b.add('paintY', new THREE.BoxGeometry(2.62, 0.08, 1.32), f.at(0, 0.8, 0), { uv: false }); };
    if (!R3.hangar) cart(79.5, -67.5, 0.2); cart(92, -82.5, -0.3);
    if (!R3.hangar) for (const [x, z] of [[81, -59.5], [90.5, -75]]) { b.add('rubber', new THREE.TorusGeometry(0.45, 0.05, 6, 20), { pos: [x, 0.06, z], rot: [Math.PI / 2, 0, 0] }, { uv: false }); b.add('rubber', new THREE.TorusGeometry(0.33, 0.05, 6, 20), { pos: [x, 0.13, z], rot: [Math.PI / 2, 0, 0] }, { uv: false }); }
    for (const [x, z] of [[96.4, -79], [96.9, -79.7], [96.2, -80.3], [96.8, -80.9], [75.2, -57], [75.9, -57.3]]) b.add(x > 90 ? 'm5_olive' : 'paintR', new THREE.CylinderGeometry(0.29, 0.29, 0.88, 18), { pos: [x, 0.44, z] }, { uv: 1, collide: true });
    if (!R3.hangar) for (const [x, z, yaw] of [[88.6, -66, 0], [89.2, -80.4, 0.2]]) { const f = new Frame([x, 0, z], yaw); for (let i = 0; i < 6; i++) b.add('dz_grate', new THREE.BoxGeometry(0.8, 0.05, 0.3), f.at(0, 0.3 + i * 0.3, -0.9 + i * 0.25), { uv: 2 }); b.add('paintY', new THREE.BoxGeometry(0.9, 0.05, 1.0), f.at(0, 2.0, 0.9), { uv: false }); for (const sx of [-0.45, 0.45]) { b.add('paintY', new THREE.BoxGeometry(0.05, 2.0, 0.05), f.at(sx, 1.0, 1.4), { uv: false }); b.add('paintY', new THREE.BoxGeometry(0.05, 1.0, 2.6), f.at(sx, 2.5, 0.2, [0.6, 0, 0]), { uv: false }); } }
    if (!R3.hangar) for (const [x, z] of [[82.6, -61.6], [85.4, -61.6], [84.6, -76], [87.4, -76]]) b.add('paintY', new THREE.BoxGeometry(0.25, 0.15, 0.35), { pos: [x, 0.08, z], rot: [0, 0, 0] }, { uv: false });
    for (const [x, z] of [[84, -63.5], [86, -78]]) { const r = new THREE.RingGeometry(5.4, 5.6, 48); r.rotateX(-Math.PI / 2); b.add('paintY', r, { pos: [x, 0.07, z] }, { uv: false }); }
    for (const z of [-60, -80]) { const bn = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.2), M.navy); bn.position.set(98.6 - 0.75, 7.0, z); bn.rotation.y = -Math.PI / 2; zone.add(bn); const em2 = emblem(0.55, M.goldBright, M.navy); em2.position.set(98.6 - 0.8, 7.4, z); em2.rotation.y = -Math.PI / 2; zone.add(em2); }
    b.box('concrete', X1 - X0 - 2.4, 0.06, Z0 - Z1 - 2.4, [cx, 0.03, cz], { uv: 0.2, collide: true });
  }

  // ======================= 城墙岗哨（12 号塔内侧） wall_posts =======================
  {
    const a = THREE.MathUtils.degToRad(26 + 11 * 28), r = 104; const gx = RING.cx + Math.sin(a) * r, gz = RING.cz + Math.cos(a) * r; const yaw = a + Math.PI; // 门朝内院
    const f = new Frame([gx, 0, gz], yaw); const W = 7, Dp = 5, H = 4.2; ctx.guardPost = { x: gx, z: gz, yaw };
    // 墙体（局部 z+ 为门面）
    const box = (key, w, h, d, x, y, z, o = {}) => b.add(key, new THREE.BoxGeometry(w, h, d), f.at(x, y, z), { uv: 0.4, ...o });
    box('stone', W, H, 0.5, 0, H / 2, -Dp / 2, { collide: true }); box('stone', 0.5, H, Dp, -W / 2, H / 2, 0, { collide: true }); box('stone', 0.5, H, Dp, W / 2, H / 2, 0, { collide: true });
    box('stone', 2.4, H, 0.5, -2.3, H / 2, Dp / 2, { collide: true }); box('stone', 2.4, H, 0.5, 2.3, H / 2, Dp / 2, { collide: true }); box('stone', 2.2, H - 2.6, 0.5, 0, 2.6 + (H - 2.6) / 2, Dp / 2);
    box('dz_glassDark', 1.6, 1.0, 0.06, -2.3, 1.8, Dp / 2 + 0.26); box('dz_glassDark', 1.6, 1.0, 0.06, 2.3, 1.8, Dp / 2 + 0.26);
    box('stoneDark', W + 0.6, 0.35, Dp + 0.6, 0, H + 0.17, 0); box('gold', W + 0.62, 0.06, Dp + 0.62, 0, H + 0.36, 0); for (let k = 0; k < 7; k++) box('stone', 0.5, 0.7, 0.5, -W / 2 + 0.25 + k * (W - 0.5) / 6, H + 0.7, Dp / 2 + 0.05);
    box('dz_tileB', W - 0.5, 0.06, Dp - 0.5, 0, 0.03, 0, { collide: true });
    // 室内：监控台（屏幕墙）、对讲机、执勤登记本、守则、塔楼附图、行军床、暖水瓶
    box('wood', 4.4, 0.8, 0.8, 0, 0.4, -Dp / 2 + 0.7, { collide: true }); box('blackMarble', 4.5, 0.05, 0.85, 0, 0.82, -Dp / 2 + 0.7);
    const mon = new CanvasScreen(768, 256, (c, t, w, h) => { c.fillStyle = '#05080c'; c.fillRect(0, 0, w, h); for (let k = 0; k < 6; k++) { const x = (k % 3) * 256, y = Math.floor(k / 3) * 128; c.fillStyle = '#0e1a14'; c.fillRect(x + 4, y + 4, 248, 120); c.strokeStyle = '#2a4a3a'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(x + 10 + i * 40, y + 120); c.lineTo(x + 128, y + 30); c.stroke(); } c.fillStyle = '#7fd0a0'; c.font = '14px "NB Sans", sans-serif'; c.fillText(`城墙 ${[1, 2, 3, 5, 6, 8][k]} 号塔　${(t % 60).toFixed(0)}s`, x + 10, y + 20); } c.fillStyle = '#e05a4a'; c.fillText('7 号塔　无信号', 520, 250); }, { fps: 1, intensity: 0.9 }); ctx.screens.push(mon);
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.2), mon.mat); m.applyMatrix4(f.at(0, 1.75, -Dp / 2 + 0.27)); zone.add(m); }
    const logM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.42), docMat('doc_wall_logbook', cvMat(256, 340, (c, w) => { c.fillStyle = '#e8e0cc'; c.fillRect(0, 0, w, 340); c.fillStyle = '#1a1612'; c.font = '900 24px "NB Title", "NB Serif", serif'; c.fillText('执勤登记本', 16, 34); c.font = '14px "NB Sans", sans-serif'; c.fillText('03:12　北二哨：听见墙里有人念书', 12, 80); c.fillText('处理结果：未见异常', 12, 104); }))); logM.applyMatrix4(f.at(0.8, 0.86, -Dp / 2 + 0.75, [0, 0.2, 0])); zone.add(logM); anchor('doc_wall_logbook', logM, 2.4);
    { const rr = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.95), docMat('doc_wall_rules', signMaterial('岗哨执勤守则', ['一、每两小时巡墙一次', '二、塔楼编号 1–12', '　　无需寻找 7 号', '三、墙里有声音时', '　　不要回答'], 480, 640))); rr.applyMatrix4(f.at(-1.25, 1.7, Dp / 2 - 0.27, [0, Math.PI, 0])); zone.add(rr); anchor('doc_wall_rules', rr); }
    { const mp = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), docMat('doc_wall_tower_map', cvMat(480, 400, (c, w, h) => { c.fillStyle = '#e6dcc4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2a2018'; c.lineWidth = 6; c.beginPath(); c.arc(w / 2, h / 2 + 10, 150, 0.3, Math.PI * 2 - 0.3 + 0.6); c.stroke(); c.fillStyle = '#2a2018'; c.font = '900 26px "NB Title", "NB Serif", serif'; c.fillText('环形城墙塔楼编号附图', 90, 34); c.font = '18px "NB Sans", sans-serif'; for (let k = 0; k < 12; k++) { if (k === 6) continue; const aa = (26 + k * 28) * Math.PI / 180; c.fillText(String(k + 1), w / 2 + Math.sin(aa) * 168 - 6, h / 2 + 10 + Math.cos(aa) * 168 + 6); } }))); mp.applyMatrix4(f.at(-W / 2 + 0.27, 2.0, 0, [0, Math.PI / 2, 0])); zone.add(mp); anchor('doc_wall_tower_map', mp); }
    box('steel', 0.8, 0.4, 1.9, W / 2 - 0.7, 0.35, 0.3, { collide: true }); box('m5_olive', 0.75, 0.12, 1.85, W / 2 - 0.7, 0.6, 0.3);
    { const tt = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 10), M.paintedGreen); tt.applyMatrix4(f.at(-1.6, 1.0, -Dp / 2 + 0.7)); zone.add(tt); const rad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.05), M.blackMetal); rad.applyMatrix4(f.at(-1.2, 0.95, -Dp / 2 + 0.75)); zone.add(rad); }
    const guard = person(M, { coat: 0x14203e, cap: true }); guard.applyMatrix4(f.at(1.6, 0, Dp / 2 + 1.0, [0, 0, 0])); zone.add(guard);
    { const l = new THREE.PointLight(0xffe0b0, 3.5, 7, 2); l.position.copy(new THREE.Vector3(0, 3.4, 0).applyMatrix4(f.m)); zone.add(l); }
    const sg = goldText('城墙岗哨　十二号塔', 3.2, 0.36, M.goldBright, { res: 96 }); sg.applyMatrix4(f.at(0, 3.3, Dp / 2 + 0.27)); zone.add(sg);
    // 岗亭顶部瞭望台：外挂铁梯 + 黄铜望远镜
    { for (let k = 0; k < 10; k++) box('iron', 0.6, 0.04, 0.04, W / 2 + 0.4, 0.3 + k * 0.42, 1.6); for (const dz of [1.3, 1.9]) box('iron', 0.04, 4.6, 0.04, W / 2 + 0.4, 2.3, dz); const p0 = new THREE.Vector3(W / 2 + 0.6, 0, 1.6).applyMatrix4(f.m), p1 = new THREE.Vector3(W / 2 - 0.4, H + 0.4, 1.6).applyMatrix4(f.m); world.ramp([p0.x, 0, p0.z], [p1.x, H + 0.4, p1.z], 0.9); world.box(...new THREE.Vector3(0, H + 0.2, 0).applyMatrix4(f.m).toArray(), W, 0.4, Dp, yaw);
      const tel = new THREE.Group(); const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.0, 14), M.brass); tb.rotation.x = Math.PI / 2 - 0.1; tb.position.y = 1.35; tel.add(tb); for (const k of [0, 1, 2]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 5), M.iron); leg.position.set(Math.cos(k * 2.1) * 0.25, 0.65, Math.sin(k * 2.1) * 0.25); leg.rotation.set(Math.sin(k * 2.1) * 0.2, 0, -Math.cos(k * 2.1) * 0.2); tel.add(leg); }
      tel.applyMatrix4(f.at(0, H + 0.35, 0.6, [0, Math.PI, 0])); zone.add(tel); ctx.anchors.int_wall_telescope = { obj: tel, range: 2.6 }; }
    // 被「啃」过的墙砖（西段城墙内侧，碑廊北侧）
    { const aa = THREE.MathUtils.degToRad(300), rr = 114.2; const bx = RING.cx + Math.sin(aa) * rr, bz = RING.cz + Math.cos(aa) * rr; const bm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), cvMat(256, 170, (c, w, h) => { c.fillStyle = '#2a2b30'; c.fillRect(0, 0, w, h); c.fillStyle = '#0a0a0c'; c.beginPath(); c.moveTo(40, 30); for (let i = 0; i < 14; i++) c.lineTo(60 + i * 10 + (i % 2) * 8, 40 + Math.sin(i) * 30 + 60); c.lineTo(200, 40); c.closePath(); c.fill(); c.fillStyle = '#5a5a60'; c.font = '900 40px "NB Title", "NB Serif", serif'; c.fillText('京　　安', 30, 150); })); bm.position.set(bx, 1.4, bz); bm.rotation.y = aa + Math.PI; zone.add(bm); ctx.anchors.int_wall_bitten = { obj: bm, range: 2.6 }; }
  }

  // ======================= 无字碑廊 memorial (−76…−50, 0…44) =======================
  {
    const X0 = -76, X1 = -50, Z0 = 44, Z1 = 2;
    b.box('dz_soil', X1 - X0, 0.08, Z0 - Z1, [(X0 + X1) / 2, 0.04, (Z0 + Z1) / 2], { uv: 0.3 });
    for (let x = X0 + 1; x <= X1 - 1; x += 0.5) for (let z = Z1 + 1; z <= Z0 - 1; z += 0.5) if (rnd() < 0.08) b.box('whiteMarble', 0.08, 0.04, 0.06, [x + rnd() * 0.4, 0.09, z + rnd() * 0.4], { uv: false });
    b.box('paving', 3.2, 0.1, Z0 - Z1, [-63, 0.06, (Z0 + Z1) / 2], { uv: 0.4 }); b.box('paving', X1 - X0, 0.1, 2.4, [(X0 + X1) / 2, 0.06, 23], { uv: 0.4 });
    for (const x of [X0 + 0.5, X1 - 0.5]) for (let z = Z1 + 1; z < Z0; z += 4.2) cypress(b, x, z);
    for (const z of [Z1 + 0.5, Z0 - 0.5]) for (let x = X0 + 4; x < X1 - 2; x += 4.4) if (Math.abs(x + 63) > 3) cypress(b, x, z);
    // 七排碑，每排 8 块（中路两侧各 4）
    let last = null;
    for (let r = 0; r < 7; r++) for (let k = 0; k < 8; k++) {
      const z = 40 - r * 5 - (r >= 4 ? 2.4 : 0), x = k < 4 ? -73.5 + k * 2.4 : -59.8 + (k - 4) * 2.4;
      b.box('stoneDark', 1.2, 0.3, 0.7, [x, 0.15, z], { uv: 0.5, collide: true }); b.box('blackMarble', 0.9, 1.5, 0.22, [x, 1.05, z], { uv: 0.5 }); b.add('blackMarble', new THREE.CylinderGeometry(0.45, 0.45, 0.22, 16, 1, false, 0, Math.PI), { pos: [x, 1.8, z], rot: [Math.PI / 2, 0, Math.PI / 2] }, { uv: 0.5 }); b.box('gold', 0.92, 0.03, 0.23, [x, 0.42, z], { uv: 1 });
      if (rnd() < 0.35) { for (let f = 0; f < 3; f++) b.add('whitePad', new THREE.SphereGeometry(0.06, 6, 4), { pos: [x - 0.15 + f * 0.15, 0.33, z + 0.42] }, { uv: false }); b.box('dz_leaves', 0.4, 0.02, 0.08, [x, 0.32, z + 0.45], { uv: false }); }
      if (r === 6 && k === 7) last = [x, z];
    }
    { const [x, z] = last; for (let f = 0; f < 9; f++) b.add('whitePad', new THREE.SphereGeometry(0.07, 8, 6), { pos: [x - 0.3 + (f % 5) * 0.15, 0.36 + Math.floor(f / 5) * 0.08, z + 0.45] }, { uv: false }); const card = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), cvMat(128, 80, (c, w, h) => { c.fillStyle = '#f2ece0'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2018'; c.font = '13px "NB Serif", serif'; c.fillText('给又一次回来的你', 8, 44); })); card.position.set(x + 0.2, 0.42, z + 0.6); card.rotation.x = -1.1; zone.add(card); const num = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.12), tagMaterial('07-0-0000 · 2023')); num.position.set(x, 0.55, z + 0.115); zone.add(num); ctx.anchors.int_memorial_0000 = { obj: num, range: 2.4 }; }
    // 入口主碑 + 立牌 + 留言簿
    { const ex = -63, ez = 46.5; b.box('stoneDark', 4.4, 0.4, 1.4, [ex, 0.2, ez], { uv: 0.5, collide: true }); b.box('blackMarble', 3.6, 2.6, 0.5, [ex, 1.7, ez], { uv: 0.5 }); b.box('gold', 3.7, 0.06, 0.52, [ex, 3.05, ez], { uv: 1 });
      const ins = plane(zone, docMat('doc_memorial_inscription', cvMat(720, 520, (c, w, h) => { c.fillStyle = '#121216'; c.fillRect(0, 0, w, h); c.fillStyle = '#c9a052'; c.font = '900 52px "NB Title", "NB Serif", serif'; c.textAlign = 'center'; c.fillText('无字碑廊', w / 2, 90); c.font = '30px "NB Serif", serif'; c.fillText('这里纪念的人，我们已不记得。', w / 2, 240); c.fillText('正因为不记得，才要立碑。', w / 2, 300); })), 3.2, 2.3, ex, 1.75, ez + 0.26, 0); anchor('doc_memorial_inscription', ins, 4);
      b.box('brass', 0.05, 1.0, 0.05, [ex + 3.4, 0.5, ez + 0.2], { uv: 1 }); const rl = plane(zone, docMat('doc_memorial_rules', brassPlaqueMaterial('参观须知', ['请保持安静', '请勿记录碑文', '离开时请回头看一眼'])), 0.6, 0.75, ex + 3.4, 1.3, ez + 0.24, 0); anchor('doc_memorial_rules', rl);
      b.box('wood', 0.6, 1.0, 0.45, [ex - 3.4, 0.5, ez + 0.2], { uv: 0.6, collide: true }); const gb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.36), M.leather); gb.position.set(ex - 3.4, 1.03, ez + 0.2); gb.rotation.x = -0.25; zone.add(gb); paperStack(b, ex - 3.4, 1.02, ez + 0.2, 0, 2); anchor('doc_memorial_guestbook', gb, 2.2);
      for (const sx of [-1, 1]) { b.box('stoneDark', 0.5, 2.2, 0.5, [ex + sx * 2.0, 1.1, ez - 1.8], { uv: 0.5, collide: true }); b.add('dz_shade', new THREE.CylinderGeometry(0.16, 0.2, 0.36, 10), { pos: [ex + sx * 2.0, 2.4, ez - 1.8] }, { uv: false }); } }
    for (const [x, z] of [[-63, 30], [-63, 15]]) { for (const dx of [-1.6, 1.6]) b.box('stoneDark', 0.4, 0.45, 1.8, [x + dx, 0.23, z], { uv: 0.5, collide: true }); }
    for (let k = 0; k < 6; k++) { const z = 38 - k * 7; b.add('blackMetal', new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6), { pos: [-61.2, 0.3, z] }, { uv: 1 }); b.add('dz_shade', new THREE.BoxGeometry(0.2, 0.2, 0.2), { pos: [-61.2, 0.7, z] }, { uv: false }); }
    const visitor = person(M, { coat: 0x2a2a30 }); visitor.position.set(-57.4, 0, 8.6); visitor.rotation.y = Math.PI; zone.add(visitor);
  }

  // ======================= 地铁「管理局站」B 口 metro_exit (0,−4,140) =======================
  {
    const Y = -4, cx = 0, cz = 140;
    // 玻璃顶出站厅：钢框 + 玻璃人字顶 + 扶梯井
    for (const sx of [-1, 1]) for (const dz of [-5, 0, 5]) b.box('blackMetal', 0.25, 4.2, 0.25, [cx + sx * 4.2, Y + 2.1, cz + dz], { uv: 1, collide: true });
    for (const dz of [-5, 0, 5]) { b.box('blackMetal', 9, 0.2, 0.2, [cx, Y + 4.2, cz + dz], { uv: 1 }); for (const sx of [-1, 1]) b.add('blackMetal', new THREE.BoxGeometry(4.8, 0.16, 0.16), { pos: [cx + sx * 2.2, Y + 4.85, cz + dz], rot: [0, 0, -sx * 0.3] }, { uv: 1 }); }
    b.box('gold', 0.14, 0.14, 10.4, [cx, Y + 5.55, cz], { uv: 1 });
    { const gm = M.glassClear.clone(); gm.opacity = 0.18; gm.side = THREE.DoubleSide; for (const sx of [-1, 1]) { const g = new THREE.Mesh(new THREE.PlaneGeometry(4.75, 10.4), gm); g.position.set(cx + sx * 2.2, Y + 4.9, cz); g.rotation.set(-Math.PI / 2, 0, 0); g.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -sx * 0.3); zone.add(g); } for (const sx of [-1, 1]) { const g = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.6), gm); g.position.set(cx + sx * 4.2, Y + 2.2, cz); g.rotation.y = Math.PI / 2; zone.add(g); } }
    // 扶梯与楼梯下到站厅（深处做暗）
    for (const [x, key] of [[-1.6, 'steel'], [1.6, 'steel']]) { b.add('dz_bakelite', new THREE.BoxGeometry(1.3, 0.3, 11), { pos: [cx + x, Y - 2.6, cz - 0.5], rot: [-0.52, 0, 0] }, { uv: false }); for (const ex of [-0.7, 0.7]) b.add(key, new THREE.BoxGeometry(0.1, 1.0, 11), { pos: [cx + x + ex, Y - 2.1, cz - 0.5], rot: [-0.52, 0, 0] }, { uv: 1 }); }
    b.box('dz_bakelite', 6, 0.2, 2.2, [cx, Y - 5.9, cz + 5.4], { uv: false }); b.box('dz_glowCold', 5, 0.05, 0.3, [cx, Y - 3.0, cz + 6], { uv: false });
    for (const sx of [-1, 1]) { b.box('stoneDark', 0.3, 1.1, 10.4, [cx + sx * 3.0, Y + 0.55, cz], { uv: 0.5, collide: true }); b.box('glassClear', 0.04, 0.9, 10.4, [cx + sx * 3.0, Y + 1.55, cz], { uv: false }); }
    b.box('stoneDark', 6.3, 1.1, 0.3, [cx, Y + 0.55, cz - 5.2], { uv: 0.5, collide: true });
    point(zone, 0xe8f0ff, 6, [cx, Y + 3.6, cz], 10);
    // 站名立柱 + 7 号线标识
    { b.box('blackMetal', 0.8, 5.2, 0.8, [cx - 6.4, Y + 2.6, cz + 4.6], { uv: 1, collide: true }); const sm = cvMat(256, 768, (c, w, h) => { c.fillStyle = '#0c1424'; c.fillRect(0, 0, w, h); c.fillStyle = '#c9a052'; c.beginPath(); c.arc(w / 2, 110, 80, 0, 7); c.fill(); c.fillStyle = '#0c1424'; c.font = '700 120px "NB Sans", sans-serif'; c.textAlign = 'center'; c.fillText('7', w / 2, 152); c.fillStyle = '#e8e4d8'; c.font = '900 64px "NB Title", "NB Serif", serif'; ['管', '理', '局', '站'].forEach((ch, i) => c.fillText(ch, w / 2, 290 + i * 90)); c.font = '48px "NB Sans", sans-serif'; c.fillStyle = '#c9a052'; c.fillText('B 口', w / 2, 700); }, { emis: 0.8 }); for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.1), sm); p.position.set(cx - 6.4 + Math.sin(yaw) * 0.41, Y + 3.6, cz + 4.6 + Math.cos(yaw) * 0.41); p.rotation.y = yaw; zone.add(p); } }
    // 官方守则立牌（背面贴民间残版）
    { const sx = cx + 3.6, sz = cz - 6.4; b.box('steel', 0.8, 1.6, 0.06, [sx, Y + 1.1, sz], { uv: 1, collide: true }); b.box('steel', 0.06, 0.4, 0.4, [sx, Y + 0.2, sz], { uv: 1 }); const o = plane(zone, docMat('doc_metro_rules_official', signMaterial('地铁乘车守则（官方版）', ['一、请站稳扶好', '二、末班车后请勿逗留', '三、广播报出不存在的站名', '　　属正常现象，请勿下车'], 480, 680)), 0.72, 1.0, sx, Y + 1.2, sz + 0.04, 0); anchor('doc_metro_rules_official', o); const fk = plane(zone, docMat('doc_metro_rules_folk', cvMat(256, 300, (c, w, h) => { c.fillStyle = '#f0ece2'; c.fillRect(0, 0, w, h * 0.62); c.fillStyle = '#1a1a1a'; c.font = '900 22px "NB Title", "NB Serif", serif'; c.fillText('午夜地铁乘车守则', 20, 36); c.font = '15px "NB Sans", sans-serif'; ['1. 不要坐最后一节', '2. 不要回答报站', '…', '6. 若车门打开……'].forEach((l, i) => c.fillText(l, 20, 70 + i * 24)); c.fillStyle = 'rgba(220,200,120,0.6)'; c.fillRect(0, 0, w, 14); }, { side: THREE.DoubleSide })), 0.5, 0.58, sx, Y + 1.25, sz - 0.04, Math.PI); anchor('doc_metro_rules_folk', fk); }
    // 城市信息屏（出站厅顶）
    { const ws = new CanvasScreen(1024, 256, (c, t, w, h) => { c.fillStyle = '#060a12'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8c87a'; c.font = '900 64px "NB Title", "NB Serif", serif'; c.fillText('今日 晴　17℃', 30, 100); c.fillStyle = '#9fd0ff'; c.font = '48px "NB Sans", sans-serif'; c.fillText('现实稳定度　97.3%', 30, 190); c.fillStyle = '#e05a4a'; c.font = '30px "NB Sans", sans-serif'; c.fillText('通州区　95.8%　请减少夜间出行', 560, 190); }, { fps: 0.2, intensity: 1.2 }); ctx.screens.push(ws); b.box('blackMetal', 6.4, 1.8, 0.3, [cx, Y + 6.6, cz + 5.3], { uv: 1 }); const m = plane(zone, ws.mat, 6, 1.5, cx, Y + 6.6, cz + 5.46, 0); anchor('doc_metro_weather', m, 12); for (const sx of [-1, 1]) b.box('blackMetal', 0.15, 1.5, 0.15, [cx + sx * 2.8, Y + 5.3, cz + 5.3], { uv: 1 }); }
    // 便利店报亭（东侧）
    { const kx = 15, kz = 128, KW = 7, KD = 5, KH = 3.6; b.box('stoneDark', KW, KH, 0.3, [kx, Y + KH / 2, kz - KD / 2], { uv: 0.4, collide: true }); for (const sx of [-1, 1]) b.box('stoneDark', 0.3, KH, KD, [kx + sx * KW / 2, Y + KH / 2, kz], { uv: 0.4, collide: true });
      b.box('slate', KW + 0.8, 0.3, KD + 0.8, [kx, Y + KH + 0.15, kz], { uv: 0.5 }); b.box('navy', KW + 0.4, 0.7, 0.1, [kx, Y + KH - 0.35, kz + KD / 2 + 0.05], { uv: 1 }); const sg = goldText('京城便利　24h', 4.2, 0.5, M.goldBright, { res: 96 }); sg.position.set(kx, Y + KH - 0.35, kz + KD / 2 + 0.12); zone.add(sg);
      b.box('glassClear', KW - 0.4, KH - 1.0, 0.05, [kx - 0.0, Y + 1.4, kz + KD / 2 - 0.02], { uv: false }); world.box(kx + 0.8, Y + 1.4, kz + KD / 2, KW - 2.2, 2.8, 0.2);
      for (let s = 0; s < 4; s++) { b.box('steel', 4.2, 0.03, 0.5, [kx, Y + 0.4 + s * 0.5, kz - KD / 2 + 0.45], { uv: 1 }); for (let k = 0; k < 14; k++) b.box(['paintR', 'navy', 'paintY', 'kraft', 'paintW'][(k + s) % 5], 0.2, 0.3, 0.18, [kx - 2 + k * 0.3, Y + 0.57 + s * 0.5, kz - KD / 2 + 0.45], { uv: false }); }
      b.box('wood', 1.6, 1.0, 0.6, [kx - 2.4, Y + 0.5, kz + 0.8], { uv: 0.6, collide: true }); b.box('blackMarble', 1.7, 0.04, 0.65, [kx - 2.4, Y + 1.02, kz + 0.8], { uv: 0.5 });
      const rc = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.004, 0.2), docMat('doc_metro_shop', M.kraft)); rc.material = new THREE.MeshStandardMaterial({ color: 0xf2eee4, roughness: 0.9 }); rc.position.set(kx - 2.2, Y + 1.045, kz + 0.9); rc.rotation.y = 0.3; zone.add(rc); anchor('doc_metro_shop', rc, 2.2);
      plane(zone, posterMaterial('篇幅补充剂', '一瓶续写一天'), 0.9, 1.3, kx + 2.6, Y + 1.6, kz + KD / 2 + 0.06, 0); plane(zone, posterMaterial('基础叙事学', '高考必备教辅'), 0.9, 1.3, kx - 3.2 + 0.4, Y + 1.6, kz + KD / 2 + 0.06, 0);
      b.box('dz_glow', KW - 1, 0.04, 0.3, [kx, Y + KH - 0.1, kz], { uv: false }); point(zone, 0xfff0d8, 4, [kx, Y + 2.8, kz], 8);
      const clerk = person(M, { coat: 0x2a5a8a }); clerk.position.set(kx - 2.4, Y, kz + 0.1); zone.add(clerk); }
    // 共享单车、外卖电动车、隔离墩、行道树、长椅
    const bike = (x, z, yaw, col) => { const g = new THREE.Group(); const fr = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.3 }); for (const dz of [-0.52, 0.52]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.03, 6, 20), M.rubber); w.position.set(0, 0.35, dz); w.rotation.y = Math.PI / 2; g.add(w); } const t = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.0), fr); t.position.set(0, 0.6, 0); t.rotation.x = 0.1; g.add(t); const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.05), fr); st.position.set(0, 0.6, -0.2); g.add(st); const sd = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.24), M.rubber); sd.position.set(0, 0.92, -0.25); g.add(sd); const hb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.04), M.blackMetal); hb.position.set(0, 0.98, 0.45); g.add(hb); const bk = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.25), fr); bk.position.set(0, 0.85, 0.66); g.add(bk); g.position.set(x, Y, z); g.rotation.y = yaw; zone.add(g); };
    for (let k = 0; k < 14; k++) bike(-14 + (k % 7) * 0.75, 126 + Math.floor(k / 7) * 3.2, Math.PI / 2 + (rnd() - 0.5) * 0.15, k % 3 ? 0x2a8ac8 : 0xe8b020);
    for (const [x, z, yaw] of [[8, 146, 0.4], [9.5, 147, 0.2]]) { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.4), new THREE.MeshStandardMaterial({ color: 0xe8c020, roughness: 0.5 })); body.position.y = 0.55; g.add(body); const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), new THREE.MeshStandardMaterial({ color: 0x2a6ab0, roughness: 0.6 })); box.position.set(0, 1.05, -0.45); g.add(box); for (const dz of [-0.55, 0.55]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 6, 16), M.rubber); w.position.set(0, 0.25, dz); w.rotation.y = Math.PI / 2; g.add(w); } g.position.set(x, Y, z); g.rotation.y = yaw; zone.add(g); }
    const rider = person(M, { coat: 0xe8c020, cap: true }); rider.position.set(10.6, Y, 146.2); rider.rotation.y = 2.2; zone.add(rider);
    for (let x = -18; x <= 18; x += 3) if (Math.abs(x) > 6) P.add('bollard', [x, Y, 118], { h: 0.95 });
    for (const sx of [-1, 1]) for (let z = 104; z <= 160; z += 12) { b.box('stoneDark', 1.6, 0.6, 1.6, [sx * 24, Y + 0.3, z], { uv: 0.5, collide: true }); b.box('dz_soil', 1.4, 0.02, 1.4, [sx * 24, Y + 0.61, z], { uv: false }); b.add('wood', new THREE.CylinderGeometry(0.12, 0.16, 3, 6), { pos: [sx * 24, Y + 2.1, z] }, { uv: 1 }); b.add('foliage', blob(1.7, z + sx), { pos: [sx * 24, Y + 4.6, z], scale: [1, 0.9, 1] }, { uv: 0.8 }); P.add('street_lamp_02', [sx * 20, Y, z + 6], { h: 5.5 }); }
    for (const z of [110, 152]) for (const sx of [-1, 1]) P.add('park_bench', [sx * 21.5, Y, z], { w: 2.0, yaw: sx > 0 ? -Math.PI / 2 : Math.PI / 2 });
    b.box('plazaTile', 30, 0.05, 70, [0, Y + 0.02, 135], { uv: 0.5 }); for (let z = 102; z < 170; z += 6) b.box('gold', 30, 0.06, 0.06, [0, Y + 0.03, z], { uv: 1 });
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { const p = person(M, { coat: [0x2a3040, 0x40302a, 0x30402a][k] }); p.position.set(sx * (5 + k * 3.2), Y, 120 + k * 7); p.rotation.y = sx > 0 ? -2.8 : 2.8; zone.add(p); }
  }

  b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g); jobs.push(P.build(zone));

  // ======================= 东翼 — 后楼连续走廊（东廊） east_cloister =======================
  {
    const zc = mk('east_cloister'), bc = new Batch(), Pc = new Props(), Y = FLOOR;
    const XW = 24.2, XE = 28, ZS = -76.4, ZN = -115, H = 5.6;
    // 南北段（x 24.2…28，z −76.4…−111）+ 东西段（z −111…−115，x 18.4…28）
    bc.box('hallFloorDark', XE - XW, 0.1, ZS - ZN, [(XW + XE) / 2, Y - 0.05, (ZS + ZN) / 2], { uv: 0.3, collide: true });
    bc.box('hallFloorDark', XW - 18.4, 0.1, 4, [(18.4 + XW) / 2, Y - 0.05, -113], { uv: 0.3, collide: true });
    for (let z = ZS - 1; z > ZN; z -= 2) bc.box('dz_pil', XE - XW - 0.6, 0.014, 0.9, [(XW + XE) / 2, Y + 0.008, z], { uv: 0.5 });
    wallX(bc, 'panelWall', XW - 0.2, ZS, -111, Y, H, 0.4, [], true);
    wallX(bc, 'panelWall', XE + 0.2, ZS, ZN, Y, H, 0.4, [], true);
    wallZ(bc, 'panelWall', ZN - 0.2, 18.4, XE + 0.4, Y, H, 0.4, [], true);
    wallZ(bc, 'panelWall', -110.8, 18.4, XW, Y, H, 0.4, [], true);
    bc.box('dz_ceil', XE - XW + 0.8, 0.3, ZS - ZN, [(XW + XE) / 2, Y + H + 0.15, (ZS + ZN) / 2], { uv: 0.3 }); bc.box('dz_ceil', XW - 18.4, 0.3, 4.4, [(18.4 + XW) / 2, Y + H + 0.15, -113], { uv: 0.3 });
    // 尖拱肋（每 3 m）+ 东墙盲尖窗（内嵌彩窗）+ 壁灯
    for (let z = ZS - 1.5; z > ZN + 1; z -= 3) { const f = new Frame([(XW + XE) / 2, Y, z], 0); bc.add('dz_pil', archRingGeo(XE - XW, H - 2.4, XE - XW - 0.5, H - 2.4, 0.3), f.at(0, 0.01, 0), { uv: 0.5 }); bc.add('gold', archRingGeo(XE - XW - 0.48, H - 2.4, XE - XW - 0.56, H - 2.4, 0.32), f.at(0, 0.01, 0), { uv: 1 }); }
    for (let z = ZS - 3; z > -110; z -= 6) { const f = new Frame([XE - 0.02, Y + 1.6, z], -Math.PI / 2); bc.add('glassIn', new THREE.ShapeGeometry(archShape(1.2, 1.6)), f.at(0, 0, 0.02), { uv: false }); bc.add('gold', archRingGeo(1.5, 1.6, 1.2, 1.6, 0.12), f.at(0, 0, 0.04), { uv: 1 }); }
    for (let z = ZS - 6; z > ZN; z -= 6) { bc.add('brass', new THREE.BoxGeometry(0.06, 0.4, 0.16), { pos: [XW + 0.02, Y + 2.8, z] }, { uv: 1 }); bc.add('dz_shade', new THREE.CylinderGeometry(0.1, 0.16, 0.3, 12, 1, true), { pos: [XW + 0.25, Y + 3.05, z] }, { uv: false }); point(zc, 0xffd8a8, 3.5, [XW + 0.6, Y + 3, z], 7); }
    WXd(bc, XW, ZS, -110.8, 1, Y, H); WXd(bc, XE, ZS, ZN, -1, Y, H);
    // 陈设：长椅、展柜（局史老照片）、绿植、导视
    for (const z of [-86, -98]) { bc.box('wood', 0.5, 0.45, 2.2, [XE - 0.6, Y + 0.23, z], { uv: 0.6, collide: true }); bc.box('wood', 0.08, 0.5, 2.2, [XE - 0.35, Y + 0.7, z], { uv: 0.6 }); }
    for (const z of [-92, -104]) { bc.box('blackMetal', 0.6, 0.9, 1.4, [XW + 0.5, Y + 0.45, z], { uv: 1, collide: true }); const gc = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 1.35), M.glassClear); gc.position.set(XW + 0.5, Y + 1.15, z); zc.add(gc); bc.add('kraft', new THREE.BoxGeometry(0.3, 0.01, 0.4), { pos: [XW + 0.5, Y + 0.92, z], rot: [0, 0.2, 0] }, { uv: false }); }
    for (const z of [-80, -108]) plantPot(bc, XE - 0.5, Y, z, 1.0);
    hangingSign(zc, mats(), '东廊　·　通往职工食堂', (XW + XE) / 2, Y + 3.9, -79, 0, 2.6);
    hangingSign(zc, mats(), '← 食堂　东翼 →', 21.5, Y + 3.6, -113, Math.PI / 2, 2.2);
    rectLight(zc, 0xffe6c8, 0.8, 4, 40, [(XW + XE) / 2, Y + H - 0.3, -95], [(XW + XE) / 2, Y, -95]);
    bc.build(zc, MAT); for (const g of bc.colliders) world.addGeo(g); jobs.push(Pc.build(zc));
  }
  await Promise.all(jobs);
}
// 走廊墙面护墙板（沿 x=at）
function WXd(b, at, za, zb, n, y, h) { const z0 = Math.max(za, zb), z1 = Math.min(za, zb), L = z0 - z1; wallDress(b, wallSeg(at, (z0 + z1) / 2, L, [n, 0], y), L, h, { style: 'stone', pil: false }); }
