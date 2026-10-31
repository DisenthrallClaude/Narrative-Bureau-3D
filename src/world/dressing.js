// M4 布景加密：在 M3 各房间的结构之上加护墙板、壁柱、藻井、地毯、成组家具与道具（不改玩法锚点）
// 坐标与各房间结构见 upper.js / rooms.js；墙面布景只贴墙内表面，门洞/窗洞/牌匾处跳过
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { mats } from './mats.js';
import { Frame, archShape, archRingGeo, emblem } from './gothic.js';
import { vaultMats, tagMaterial } from './vault.js';
import { posterMaterial, point, spot, signMaterial } from './interiors.js';
import { roseGlassTexture, lightShaft } from '../engine/fx.js';
const lightShaftLite = (x, y0, z, y1, r0, r1, color, intensity) => lightShaft({ from: [x, y0, z], to: [x, y1, z], r0, r1, color, intensity });
import { FLOOR } from './exterior.js';
import { UPPER } from './upper.js';
import { UNDER } from './rooms.js';
import { dressMats, spineMaterial, Props, wallDress, wallSeg, coffered, bunkerCeiling, rug, floorInlay, deskSet, paperStack, folderStack, telephone, bin, plantPot, cabinetRow, spineShelf, hangingSign, greenLamp } from './dress.js';

const Y = FLOOR;
// —— 世界坐标墙面布景：WX 墙面在 x=at（法线 n=±1 沿 x），WZ 墙面在 z=at ——
function WX(b, at, za, zb, n, y, h, o = {}) {
  const z0 = Math.max(za, zb), z1 = Math.min(za, zb), L = z0 - z1; const loc = n > 0 ? (z) => z0 - z : (z) => z - z1;
  const cv = (r) => (r ?? []).map(([p, q]) => [loc(p), loc(q)]);
  wallDress(b, wallSeg(at, (z0 + z1) / 2, L, [n, 0], y), L, h, { ...o, skip: cv(o.skip), pilSkip: cv(o.pilSkip) });
}
function WZ(b, at, xa, xb, n, y, h, o = {}) {
  const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), L = x1 - x0; const loc = n > 0 ? (x) => x - x0 : (x) => x1 - x;
  const cv = (r) => (r ?? []).map(([p, q]) => [loc(p), loc(q)]);
  wallDress(b, wallSeg((x0 + x1) / 2, at, L, [0, n], y), L, h, { ...o, skip: cv(o.skip), pilSkip: cv(o.pilSkip) });
}
const wins = (cs, half = 1.0) => cs.map((c) => [c - half, c + half]);
const range = (a, b, s) => { const r = []; for (let v = a; s > 0 ? v <= b + 1e-6 : v >= b - 1e-6; v += s) r.push(v); return r; };

/** 吊顶 T 形龙骨 + 格栅灯（医务/实验/办公） */
function tGrid(b, x0, x1, z0, z1, y, o = {}) {
  b.box('paintedSteel', x1 - x0, 0.03, z0 - z1, [(x0 + x1) / 2, y - 0.015, (z0 + z1) / 2], { uv: 0.5 });
  for (let x = x0 + 1.2; x < x1; x += 1.2) b.box('steel', 0.035, 0.04, z0 - z1, [x, y - 0.045, (z0 + z1) / 2], { uv: 1 });
  for (let z = z1 + 0.6; z < z0; z += 0.6) b.box('steel', x1 - x0, 0.04, 0.035, [(x0 + x1) / 2, y - 0.045, z], { uv: 1 });
  for (let x = x0 + 1.8; x < x1 - 0.6; x += o.lx ?? 3.6) for (let z = z1 + 1.5; z < z0 - 0.6; z += o.lz ?? 3.0) b.box(o.warm ? 'dz_glow' : 'dz_glowCold', 1.1, 0.02, 0.55, [x, y - 0.06, z], { uv: false });
}
/** 简易绘制材质 */
function canvasMat(w, h, draw, emis = 0) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, ...(emis ? { emissive: 0xffffff, emissiveMap: t, emissiveIntensity: emis } : {}) }); }
function worldMapMat() { return canvasMat(1024, 560, (c, w, h) => { c.fillStyle = '#10141c'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(201,160,82,0.35)'; c.lineWidth = 1; for (let x = 0; x < w; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y < h; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } c.fillStyle = '#3a3426'; const blob = (pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * w, y * h) : c.moveTo(x * w, y * h))); c.closePath(); c.fill(); }; blob([[0.08, 0.2], [0.3, 0.15], [0.33, 0.4], [0.22, 0.55], [0.12, 0.45]]); blob([[0.24, 0.6], [0.32, 0.62], [0.3, 0.9], [0.25, 0.85]]); blob([[0.45, 0.18], [0.6, 0.14], [0.85, 0.2], [0.9, 0.4], [0.75, 0.5], [0.62, 0.42], [0.5, 0.36]]); blob([[0.48, 0.45], [0.58, 0.48], [0.56, 0.8], [0.5, 0.75]]); blob([[0.8, 0.68], [0.9, 0.7], [0.88, 0.82], [0.8, 0.8]]); c.fillStyle = '#c9a052'; for (const [x, y, n] of [[0.74, 0.33, '京城'], [0.48, 0.24, '灰塔'], [0.2, 0.3, '联邦档案局'], [0.6, 0.6, '雾港'], [0.3, 0.75, '无名海岸']]) { c.beginPath(); c.arc(x * w, y * h, 6, 0, 7); c.fill(); c.font = '22px "NB Sans", sans-serif'; c.fillText(n, x * w + 10, y * h + 6); } c.font = '900 30px \"NB Title\", \"NB Serif\", serif'; c.fillText('体系外势力分布　·　机密', 24, 40); }); }
function crossMat() { return canvasMat(256, 256, (c, w, h) => { c.fillStyle = '#e8e6e0'; c.fillRect(0, 0, w, h); c.fillStyle = '#b01e22'; c.fillRect(96, 36, 64, 184); c.fillRect(36, 96, 184, 64); }); }
function quiltMat() { const m = canvasMat(256, 256, (c, w, h) => { c.fillStyle = '#d6d4cc'; c.fillRect(0, 0, w, h); c.strokeStyle = '#a8a69e'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w / 2, 0); c.lineTo(w, h / 2); c.lineTo(w / 2, h); c.closePath(); c.stroke(); c.fillStyle = '#8a8882'; for (const [x, y] of [[w / 2, 0], [0, h / 2], [w, h / 2], [w / 2, h]]) { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); } }); m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; m.roughness = 0.95; m.bumpMap = m.map; m.bumpScale = 3; return m; }

import { R3, LIB_R3 } from './r3plan.js';
import { buildR3 } from './r3build.js';
export async function buildDressing(scene, world, ctx) {
  const M = mats(); const Mx = vaultMats(M); const D = dressMats(M);
  D.dz_quilt = D.dz_quilt ?? quiltMat();
  D.dz_blueGlow = D.dz_blueGlow ?? new THREE.MeshStandardMaterial({ color: 0x1a1408, emissive: 0xd8a850, emissiveIntensity: 1.1 });
  D.dz_rose = D.dz_rose ?? new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffffff, emissiveMap: roseGlassTexture(), emissiveIntensity: 1.8, side: THREE.DoubleSide });
  D.dz_redGlow = D.dz_redGlow ?? new THREE.MeshStandardMaterial({ color: 0x300000, emissive: 0xff2010, emissiveIntensity: 3 });
  D.dz_grate = D.dz_grate ?? new THREE.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.9, roughness: 0.45 });
  const MAT = { ...M, ...Mx, ...D, spine: spineMaterial() };
  const jobs = [];
  const zoneOf = (n) => ctx.zones[n];
  const finish = (zone, b, P) => { b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g); jobs.push(P.build(zone)); };

  // ================= 2F 国际联络处（东）+ 宣传处（西） =================
  if (zoneOf('floor2')) {
    const zone = zoneOf('floor2'), b = new Batch(), P = new Props(), y = UPPER['2F'], H = 6;
    const W5 = wins([-95, -100, -105, -110, -115]);
    WX(b, -28, -92.2, -117.8, 1, y, H, { style: 'red', skip: W5, sconce: true, pitch: 5 });
    WX(b, 28, -92.2, -117.8, -1, y, H, { style: 'office', skip: W5, sconce: true, pitch: 5 });
    WZ(b, -117.8, -28, -0.15, 1, y, H, { style: 'red', pilSkip: [[-18.2, -9.8]] });
    WZ(b, -117.8, 0.15, 28, 1, y, H, { style: 'office', pil: false });
    WZ(b, -92.2, -28, 28, -1, y, H, { skip: [[-2.3, 2.3], [-9.4, -9.0], [9.0, 9.4]], pilSkip: [[-16.2, -11.8], [11.8, 16.2]], style: 'office', sconce: true });
    WX(b, -0.15, -94, -117.8, -1, y, H, { style: 'red', skip: [[-95.9, -99.1]] });
    WX(b, 0.15, -94, -117.8, 1, y, H, { style: 'office', skip: [[-95.9, -99.1], [-93.4, -94.6]], pilSkip: [[-99, -110]] });
    coffered(b, -28, -0.15, -92, -118, y + H, { cell: 3.4, lightEvery: 2 }); coffered(b, 0.15, 28, -92, -118, y + H, { cell: 3.4, lightEvery: 2 });
    // —— 联络处：书柜（窗间）、世界钟、势力地图、礼宾旗、办公桌、会客地毯 ——
    for (const z of [-97.5, -102.5, -107.5, -112.5]) spineShelf(b, new Frame([27.72, y, z], -Math.PI / 2), 2.6, 3.0, 0.5, { seed: z });
    for (const [k, city] of ['京城', '阿尔卑斯 · 灰塔', '雾港（漂移）', '华盛顿'].entries()) { const z = -100.5 - k * 2.6; P.add('wall_clock', [0.2, y + 3.0, z], { w: 0.62, yaw: Math.PI / 2 }); const t = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), tagMaterial(city)); t.position.set(0.17, y + 2.45, z); t.rotation.y = Math.PI / 2; zone.add(t); }
    const map = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 2.7), worldMapMat()); map.position.set(0.2, y + 3.1, -114.5); map.rotation.y = Math.PI / 2; zone.add(map); b.box('gold', 0.05, 2.86, 5.16, [0.18, y + 3.1, -114.5], { uv: 1 });
    for (const [k, c] of [0x1a2c66, 0x7a1016, 0x203a2a].entries()) { const x = 22.5 + k * 1.1; b.add('brass', new THREE.CylinderGeometry(0.025, 0.025, 2.6, 8), { pos: [x, y + 1.3, -93.6] }, { uv: 1 }); b.add('brass', new THREE.SphereGeometry(0.05, 8, 6), { pos: [x, y + 2.63, -93.6] }, { uv: 1 }); const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.1), new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, side: THREE.DoubleSide })); fl.position.set(x + 0.4, y + 2.0, -93.6); fl.rotation.set(0, 0.25, 0.05); zone.add(fl); }
    b.add('stoneDark', new THREE.CylinderGeometry(0.5, 0.6, 0.12, 16), { pos: [23.6, y + 0.06, -93.6] }, { uv: 0.5 });
    if (!R3.floor2_liaison) { deskSet(P, b, world, 18, y, -108.5, 0, { lamp: 'green', red: true }); deskSet(P, b, world, 22.5, y, -108.5, 0, { lamp: 'green', pc: false }); }
    if (!R3.floor2_liaison) cabinetRow(P, world, 6.5, y, -117.35, 0, 4, 0.62, 'file_cabinet', 1.35);
    rug(b, 10, -101.8, 6.4, 5.2, y, 'dz_rugNavy'); if (!R3.floor2_liaison) rug(b, 20.2, -108.5, 7.4, 4.0, y, 'dz_rugRed');
    const lt = new THREE.Group(); const env = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.006, 0.16), M.kraft); lt.add(env); const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.008, 12), M.waxRed); seal.position.y = 0.006; lt.add(seal); lt.position.set(10.7, y + 0.505, -102.0); lt.rotation.y = 0.3; zone.add(lt);
    if (!R3.floor2_liaison) for (const [x, z] of [[26.2, -94.2], [1.4, -116.6], [26.2, -116.6], [8, -93.6]]) plantPot(b, x, y, z, 1.1);
    P.add('chandelier', [14, y + H - 1.7, -100], { h: 1.3 }); P.add('chandelier', [14, y + H - 1.7, -110], { h: 1.3 });
    point(zone, 0xffd2a0, 6, [14, y + H - 1.8, -100], 9); point(zone, 0xffd2a0, 6, [14, y + H - 1.8, -110], 9);
    // —— 宣传处：海报墙（窗间）、摄像机与补光灯、打样桌（被否海报+印章）、吊灯 ——
    const titles = [['叙事高考', '今年你也是作者'], ['规则之泉', '饮水思源　不问出处'], ['畸变规避', '看到不该看的　请闭眼'], ['谨防第二草稿', '它会说：这一版更好']];
    [-97.5, -102.5, -107.5, -112.5].forEach((z, k) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.15), posterMaterial(...titles[k])); p.position.set(-27.86, y + 2.75, z); p.rotation.y = Math.PI / 2; zone.add(p); b.box('blackMetal', 0.05, 2.27, 1.62, [-27.9, y + 2.75, z], { uv: 1 }); b.box('gold', 0.055, 2.3, 0.02, [-27.88, y + 2.75, z - 0.82], { uv: 1 }); b.box('gold', 0.055, 2.3, 0.02, [-27.88, y + 2.75, z + 0.82], { uv: 1 }); });
    // 三脚架摄像机
    { const cx = R3.floor2_pub ? -17.2 : -14, cz = R3.floor2_pub ? -105.2 : -102; for (let k = 0; k < 3; k++) { const a = k * 2.094; b.add('blackMetal', new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6), { pos: [cx + Math.sin(a) * 0.25, y + 0.72, cz + Math.cos(a) * 0.25], rot: [Math.cos(a) * 0.18, 0, -Math.sin(a) * 0.18] }, { uv: 1 }); } b.box('dz_bakelite', 0.22, 0.24, 0.42, [cx, y + 1.6, cz], { uv: false }); b.add('dz_glassDark', new THREE.CylinderGeometry(0.07, 0.08, 0.16, 16), { pos: [cx, y + 1.62, cz - 0.28], rot: [Math.PI / 2, 0, 0] }, { uv: false }); const red = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff2020 })); red.position.set(cx + 0.08, y + 1.74, cz - 0.21); zone.add(red); }
    for (const sx of [-1, 1]) { const x = -14 + sx * (R3.floor2_pub ? 2.7 : 3.4), z = R3.floor2_pub ? -111.0 : -107; b.add('blackMetal', new THREE.CylinderGeometry(0.02, 0.02, 2.2, 6), { pos: [x, y + 1.1, z] }, { uv: 1 }); b.add('blackMetal', new THREE.CylinderGeometry(0.5, 0.5, 0.03, 16), { pos: [x, y + 0.02, z] }, { uv: 1 }); b.box('blackMetal', 0.9, 0.9, 0.35, [x, y + 2.35, z], { uv: 1, rot: [0.25, -sx * 0.5, 0] }); const sb = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), D.dz_glow); sb.position.set(x + sx * -0.09, y + 2.31, z - 0.19); sb.rotation.set(0.25, -sx * 0.5, 0); zone.add(sb); }
    b.box('wood', 2.6, 0.06, 1.3, [-6, y + 0.9, -114], { uv: 0.6, rot: [0.12, 0, 0] }); for (const sx of [-1, 1]) b.box('blackMetal', 0.06, 0.9, 1.1, [-6 + sx * 1.2, y + 0.45, -114], { uv: 1 }); world.box(-6, y + 0.45, -114, 2.6, 0.9, 1.3);
    for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), posterMaterial(['小样', '二稿', '否', '待议'][k], '宣传处')); p.position.set(-6.8 + k * 0.5, y + 0.96 + k * 0.004, -114 + Math.sin(k) * 0.2); p.rotation.set(-Math.PI / 2 + 0.12, 0, (k - 1.5) * 0.25); zone.add(p); }
    for (const x of [-5.1, -4.9]) b.add('waxRed', new THREE.CylinderGeometry(0.03, 0.035, 0.08, 10), { pos: [x, y + 0.98, -113.6] }, { uv: false });
    if (!R3.floor2_pub) { deskSet(P, b, world, -21, y, -112, Math.PI / 2, { lamp: 'green' }); rug(b, -14, -105, 9.5, 8.4, y, 'dz_rugRed'); for (const [x, z] of [[-26.2, -94.2], [-26.2, -116.6], [-1.4, -116.6], [-8, -93.6]]) plantPot(b, x, y, z, 1.1); }
    for (const z of [-97, -105, -113]) P.add('ceiling_lamp', [-21, y + H - 0.4 - 0.9, z], { h: 0.9 });
    if (!R3.floor2_pub) bin(b, -2, y, -110); bin(b, 2, y, -104);
    finish(zone, b, P);
  }

  // ================= 3F 办公区 + 医务室 + 鉴定实验室 =================
  if (zoneOf('floor3')) {
    const zone = zoneOf('floor3'), b = new Batch(), P = new Props(), y = UPPER['3F'], H = 5.4;
    const W5 = wins([-95, -100, -105, -110, -115]);
    WX(b, -28, -92.2, -119.8, 1, y, H, { style: 'green', skip: W5, sconce: true, pitch: 5 });
    WX(b, 28, -92.2, -119.8, -1, y, H, { style: R3.lab3 ? 'lab' : 'stone', skip: W5, pilSkip: [[-106.5, -113.5]] });
    WZ(b, -119.8, -28, -9.75, 1, y, H, { style: 'green', pilSkip: [[-26, -12]] });
    WZ(b, -119.8, -9.45, 9.45, 1, y, H, { style: 'clinic', pilSkip: [[-0.8, 0.8]] });
    WZ(b, -119.8, 9.75, 28, 1, y, H, { style: R3.lab3 ? 'lab' : 'stone' });
    WZ(b, -92.2, -28, -9.75, -1, y, H, { style: 'green', skip: [[-9.75, -9.0]], pilSkip: [[-20.2, -15.8], [-4.8, -3.2]] });
    WZ(b, -92.2, -9.45, 9.45, -1, y, H, { style: 'clinic', skip: [[-2.3, 2.3], [-9.45, -9.0], [9.0, 9.45], [-9.45, -3.3]], pilSkip: [[-2.4, 2.4]] });
    WZ(b, -92.2, 9.75, 28, -1, y, H, { style: R3.lab3 ? 'lab' : 'stone', skip: [[9.75, 10.1]], pilSkip: [[15.8, 20.2]] });
    WX(b, -9.75, -94, -119.8, -1, y, H, { style: 'green', skip: [[-95.9, -101.2]] });
    WX(b, -9.45, -94.3, -119.8, 1, y, H, { style: 'clinic', skip: [[-95.9, -99.1]] });
    WX(b, 9.45, -94, -119.8, -1, y, H, { style: 'clinic', skip: [[-95.9, -99.1], [-105.2, -106.8]] });
    WX(b, 9.75, -94, -119.8, 1, y, H, { style: R3.lab3 ? 'lab' : 'stone', skip: [[-93.6, -99.1]] });
    coffered(b, -28, -9.6, -92, -120, y + H, { cell: 3.0, lightEvery: 2, beam: 'dz_beam' });
    tGrid(b, -9.45, 9.45, -92.2, -119.8, y + H); if (!R3.lab3) tGrid(b, 9.75, 28, -92.2, -119.8, y + H, { warm: false, lx: 4.8 }); // 批次18：lab3 白网格吊顶 → r3plan 深色木格藻井
    // 办公区：桌面杂物（工位岛已有显示器/椅），文件柜墙、打印机、饮水机、挂钟、吊牌
    if (!R3.floor3_office) { for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) { const x = -24 + k * 7, z = -98 - r * 6, t = y + 0.79; for (const dx of [-1.6, 0, 1.6]) for (const dz of [-0.55, 0.55]) { const sx = x + dx + 0.5, sz = z + dz * 1.2; if ((r + k + dx) % 2) paperStack(b, sx, t, sz, dz * 2, 4); else folderStack(b, sx, t, sz, dz, 3); P.add('keyboard', [x + dx, t, z + dz * 1.15], { w: 0.42, yaw: dz > 0 ? 0 : Math.PI }); } telephone(b, x - 2.1, t, z + 0.6, 0.3); greenLamp(b, x + 2.1, t, z - 0.6, Math.PI); bin(b, x + 2.8, y, z + 1.4); } }
    if (!R3.floor3_office) { cabinetRow(P, world, -19, y, -119.4, 0, 14, 0.62, 'file_cabinet', 1.35); }
    if (!R3.floor3_office) { b.box('paintedSteel', 1.0, 1.1, 0.7, [-11, y + 0.55, -116], { uv: 1, collide: true }); b.box('dz_bakelite', 0.9, 0.12, 0.6, [-11, y + 1.16, -116], { uv: false }); paperStack(b, -11, y + 1.22, -116, 0, 5); }
    if (!R3.floor3_office) { b.add('dz_glassDark', new THREE.CylinderGeometry(0.16, 0.16, 0.45, 16), { pos: [-11, y + 1.45, -112.5] }, { uv: false }); b.box('paintedSteel', 0.4, 1.1, 0.4, [-11, y + 0.55, -112.5], { uv: 1, collide: true }); }
    if (!R3.floor3_office) { P.add('wall_clock', [-18, y + 3.6, -119.6], { w: 0.55 }); P.add('fire_alarm', [-26.5, y + 1.5, -119.7], { h: 0.15 }); P.add('extinguisher', [-26.5, y, -119.3], { h: 0.6 }); }
    if (R3.floor3_office) hangingSign(zone, M, '政策研究室', -21.7, y + 3.8, -97.6, Math.PI / 2, 1.8); else hangingSign(zone, M, '政策研究室', -24, y + 3.8, -110.5, Math.PI / 2, 1.8); hangingSign(zone, M, '法务处　·　B 级许可', -13, y + 3.9, -100.5, Math.PI / 2, 2.0);
    if (!R3.floor3_office) { for (const [x, z] of [[-26.6, -93.6], [-11, -93.6], [-26.6, -118.6], [-14, -118.6]]) plantPot(b, x, y, z, 1.0); }
    if (!R3.floor3_office) { rug(b, -20.5, -104, 15, 17, y, 'dz_rugGreen'); }
    // 医务室：病床 ×2（隔帘）、输液架、净化舱、玻璃药柜、洗手台
    if (!R3.medical) for (const z of [-102, -106]) { const x = -6.4; b.box('steel', 0.95, 0.5, 2.0, [x, y + 0.3, z], { uv: 1, collide: true }); b.box('whitePad', 0.9, 0.16, 1.95, [x, y + 0.63, z], { uv: 1 }); b.box('whitePad', 0.6, 0.1, 0.4, [x, y + 0.75, z - 0.75], { uv: 1 }); b.box('steel', 0.95, 0.5, 0.04, [x, y + 0.85, z - 1.0], { uv: 1 }); b.add('steel', new THREE.CylinderGeometry(0.012, 0.012, 1.8, 6), { pos: [x + 0.7, y + 0.9, z - 0.7] }, { uv: 1 }); b.box('dz_glassDark', 0.14, 0.22, 0.05, [x + 0.7, y + 1.7, z - 0.7], { uv: false }); const cur = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.2, 12, 1), new THREE.MeshStandardMaterial({ color: 0x9cb4a8, roughness: 0.9, side: THREE.DoubleSide })); const pp = cur.geometry.attributes.position; for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.sin(pp.getX(i) * 8) * 0.05); cur.geometry.computeVertexNormals(); cur.position.set(x + 0.7, y + 1.4, z + 1.2); zone.add(cur); b.box('steel', 0.03, 0.03, 2.6, [x + 1.2, y + 2.55, z], { uv: 1 }); }
    { const px = 4.6, pz = -116.5; b.add('steel', new THREE.CylinderGeometry(0.9, 0.95, 0.25, 32), { pos: [px, y + 0.125, pz] }, { uv: 1, collide: true }); b.add('steel', new THREE.CylinderGeometry(0.9, 0.9, 0.18, 32), { pos: [px, y + 2.6, pz] }, { uv: 1 }); const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 2.3, 32, 1, true), M.glassClear); gl.position.set(px, y + 1.4, pz); zone.add(gl); const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.1, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffc35a, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); liquid.position.set(px, y + 1.35, pz); zone.add(liquid); ctx.rooms.pod = liquid; point(zone, 0xffc35a, 3, [px, y + 1.4, pz], 5); const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), tagMaterial('净化舱　01')); pl.position.set(px, y + 2.85, pz + 0.95); zone.add(pl); }
    b.box('wood', 1.6, 2.0, 0.42, [8.5, y + 1.0, -112], { uv: 0.6, rot: [0, -Math.PI / 2, 0], collide: true }); for (let s = 0; s < 4; s++) { b.box('dz_glassDark', 0.02, 0.4, 1.4, [8.28, y + 0.4 + s * 0.45, -112], { uv: false }); for (let k = 0; k < 6; k++) b.add(k % 2 ? 'whiteMarble' : 'dz_paper', new THREE.CylinderGeometry(0.04, 0.04, 0.14, 8), { pos: [8.5, y + 0.3 + s * 0.45, -112.55 + k * 0.22] }, { uv: false }); }
    b.box('whiteMarble', 1.0, 0.85, 0.5, [2.5, y + 0.43, -119.5], { uv: 1, collide: true }); b.add('steel', new THREE.CylinderGeometry(0.2, 0.18, 0.08, 16), { pos: [2.5, y + 0.86, -119.45] }, { uv: 1 }); P.add('ornate_mirror', [2.5, y + 1.1, -119.75], { h: 0.8 });
    hangingSign(zone, M, '医务室　理智值监测', 0, y + 3.9, -100, 0, 2.4);
    rug(b, 0, -107, 5, 8, y, 'dz_rugNavy');
    // 实验室：服务器机柜、测试舱（防爆玻璃）、蓝色液柱「篇幅测量仪」副表、化学台
    if (!R3.lab3) for (const z of [-97.5, -102.5]) { P.add('server_rack', [26.9, y, z - 0.6], { h: 2.0, yaw: -Math.PI / 2 }); P.add('server_rack', [26.9, y, z + 0.6], { h: 2.0, yaw: -Math.PI / 2 }); world.box(26.9, y + 1, z, 0.8, 2, 2.4); } // 批次17：R3 下由 planLab3 接管
    if (!R3.lab3) for (const x of [13, 17.4]) { b.box('steel', 4.0, 0.15, 3.2, [x + 1.8, y + 0.075, -117.6], { uv: 1 }); b.box('dz_glassDark', 0.05, 2.8, 3.0, [x - 0.2, y + 1.5, -117.6], { uv: false }); b.box('glassClear', 4.0, 2.8, 0.05, [x + 1.8, y + 1.5, -116.0], { uv: false }); b.box('steel', 4.0, 0.1, 3.2, [x + 1.8, y + 2.95, -117.6], { uv: 1 }); world.box(x + 1.8, y + 1.5, -116.0, 4.0, 2.8, 0.1); b.box('steel', 0.08, 2.8, 0.08, [x - 0.2, y + 1.5, -116.0], { uv: 1 }); const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.22), tagMaterial(x < 15 ? '测试舱 A　防爆' : '测试舱 B　防爆')); pl.position.set(x + 1.8, y + 2.65, -115.96); zone.add(pl); } // 批次17：R3 下由 planLab3 接管
    if (!R3.lab3) { const cx = 25.5, cz = -116.5; b.add('steel', new THREE.CylinderGeometry(0.45, 0.5, 0.3, 24), { pos: [cx, y + 0.15, cz] }, { uv: 1, collide: true }); const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 3.0, 24), new THREE.MeshStandardMaterial({ color: 0x0a2a60, emissive: 0x3a8cff, emissiveIntensity: 1.6, transparent: true, opacity: 0.85 })); col.position.set(cx, y + 1.8, cz); zone.add(col); const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 3.2, 24, 1, true), M.glassClear); gl.position.set(cx, y + 1.9, cz); zone.add(gl); for (let k = 0; k < 9; k++) b.add('gold', new THREE.TorusGeometry(0.35, 0.012, 4, 24), { pos: [cx, y + 0.5 + k * 0.33, cz], rot: [Math.PI / 2, 0, 0] }, { uv: 1 }); point(zone, 0x3a8cff, 4, [cx, y + 2, cz + 0.6], 6); } // 批次17：R3 下由 planLab3 接管
    if (!R3.lab3) b.box('blackMarble', 3.0, 0.9, 0.9, [16, y + 0.45, -106], { uv: 0.5, collide: true }); P.add('chem_set', [15.4, y + 0.9, -106], { w: 0.9 }); P.add('magnifier', [16.8, y + 0.9, -106], { h: 0.2 }); paperStack(b, 17.2, y + 0.9, -105.8, 0.3, 5); // 批次17：R3 下由 planLab3 接管
    if (!R3.lab3) for (const [x, z] of [[11, -93.6], [26.6, -93.8]]) plantPot(b, x, y, z, 1.0); // 批次17：R3 下由 planLab3 接管
    hangingSign(zone, M, '鉴定与觉醒评测', 18, y + 3.9, -104, 0, 2.4);
    finish(zone, b, P);
  }

  // ================= 4F–11F 典籍藏书阁 =================
  if (zoneOf('library')) {
    const zone = zoneOf('library'), b = new Batch(), P = new Props(), y = UPPER['4F'];
    const cx = 0, cz = -106, R = 13, H = 46;
    // 穹顶玫瑰窗（替换纯白圆孔）
    const rose = new THREE.Mesh(new THREE.CircleGeometry(6.2, 96), D.dz_rose); rose.rotation.x = Math.PI / 2; rose.position.set(cx, y + H + 11.9, cz); zone.add(rose);
    b.add('gold', new THREE.TorusGeometry(6.25, 0.18, 8, 96), { pos: [cx, y + H + 11.88, cz], rot: [Math.PI / 2, 0, 0] }, { uv: 1 });
    // 穹顶金肋 16 道
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; const pts = []; for (let i = 0; i <= 20; i++) { const t = Math.asin(6.2 / 13.55) + (Math.PI / 2 - Math.asin(6.2 / 13.55)) * (i / 20); pts.push(new THREE.Vector3(cx + Math.sin(a) * Math.cos(Math.PI / 2 - t) * 13.5 * 0 + Math.sin(a) * 13.5 * Math.sin(t), y + H + 13.5 * Math.cos(t), cz + Math.cos(a) * 13.5 * Math.sin(t))); } b.add('gold', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.09, 6), null, { uv: 1 }); }
    // 底层：阅读桌一圈（绿罩台灯）、地球仪、星图台、滑动书梯、限阅玻璃柜
    if (!R3.library) for (let k = 0; k < 6; k++) { const a = k * (Math.PI / 3) + Math.PI / 6; if (Math.abs(Math.sin(a)) < 0.3 && Math.cos(a) > 0) continue; const r = 7.2, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r; b.add('wood', new THREE.BoxGeometry(2.4, 0.06, 1.0), { pos: [x, y + 0.76, z], rot: [0, a, 0] }, { uv: 0.6 }); for (const s of [-1, 1]) b.add('wood', new THREE.BoxGeometry(0.08, 0.74, 0.9), { pos: [x + Math.cos(a) * s * 1.1, y + 0.37, z - Math.sin(a) * s * 1.1], rot: [0, a, 0] }, { uv: 0.6 }); world.box(x, y + 0.4, z, 2.4, 0.8, 1, a); greenLamp(b, x, y + 0.79, z, a); folderStack(b, x + Math.cos(a) * 0.6, y + 0.79, z - Math.sin(a) * 0.6, a, 3); for (const s of [-0.6, 0.6]) { const ox = x + Math.cos(a) * s + Math.sin(a) * 0.8, oz = z - Math.sin(a) * s + Math.cos(a) * 0.8; P.add('armchair', [ox, y, oz], { h: 0.95, yaw: a + Math.PI }); } }
    { const [gx, gz] = R3.library ? LIB_R3.globe : [-5, -112]; if (R3.library) { P.add('r2/lib_globe', [gx, y, gz], { h: 1.13 }); world.box(gx, y + 0.55, gz, 0.76, 1.1, 0.76); const gs = spot(zone, 0xffe6c0, 4.6, [gx + 1.2, y + 3.2, gz + 1.6], [gx, y + 0.9, gz], 0.5, false, 6); if (gs) gs.penumbra = 1; const gl = spot(zone, 0xffdcb0, 2.2, [gx + 1.4, y + 0.9, gz + 1.5], [gx, y + 0.3, gz], 0.7, false, 4); if (gl) gl.penumbra = 1; } /* 批次42：lib_globe 看图胡桃三弯腿偏黑 → 主射灯 4→4.6 + 低位侧前方弱柔光 2.2 专照腿 / 拉档罗盘 */ /* 批次41：木锥 + 铜环 + Math.random 斑点球 → Blender 精建 r2/lib_globe（三弯胡桃腿 + 罗盘拉档 + 刻度地平环 + 黄铜子午环 23.4° + 烘焙仿古地图；tools/blender/lib_globe.py）+ 柔射灯 */ else { b.add('wood', new THREE.CylinderGeometry(0.06, 0.25, 0.9, 12), { pos: [gx, y + 0.45, gz] }, { uv: 0.6, collide: true }); b.add('brass', new THREE.TorusGeometry(0.42, 0.02, 6, 32), { pos: [gx, y + 1.35, gz], rot: [0, 0, 0.4] }, { uv: 1 }); const globe = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 20), canvasMat(512, 256, (c, w, h) => { c.fillStyle = '#c8b48a'; c.fillRect(0, 0, w, h); c.fillStyle = '#7a6440'; for (let i = 0; i < 40; i++) { c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 10 + Math.random() * 40, 6 + Math.random() * 20, 0, 0, 7); c.fill(); } c.strokeStyle = 'rgba(60,40,20,0.5)'; for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } })); globe.position.set(gx, y + 1.35, gz); globe.rotation.z = 0.4; zone.add(globe); } }
    if (R3.library) { const [sx, sz] = LIB_R3.star; P.add('r2/lib_startable', [sx, y, sz], { h: 1.504 }); world.box(sx, y + 0.5, sz, 1.38, 1.02, 0.98); const ss = spot(zone, 0xffe6c0, 4.6, [sx - 1.2, y + 3.2, sz + 1.8], [sx, y + 0.85, sz], 0.5, false, 6); if (ss) ss.penumbra = 1; const sl = spot(zone, 0xffdcb0, 2.2, [sx - 1.0, y + 1.0, sz + 1.8], [sx, y + 0.4, sz + 0.4], 0.7, false, 4); if (sl) sl.penumbra = 1; point(zone, 0xffd2a0, 0.9, [sx + 0.5, y + 1.32, sz - 0.25], 1.8); } /* 批次43：星图台 wood 方盒 + Math.random 星点贴片（lib_globe 看图纯黑方块）→ Blender 精建 r2/lib_startable（tools/blender/lib_startable.py：胡桃斜面图台 + 3 只图纸抽屉铜吊环 + 凸芯柜门 / 侧板；铜框星图板烘焙贴图 + 黄铜平面星盘 + 后沿铜围栏 + 黄铜立柱钟罩台灯）；读者侧朝 +Z（圆厅中心）+ 柔射主光 + 低位柔光 + 灯罩下暖点光 */
    else { const [sx, sz] = [5, -112]; b.add('wood', new THREE.BoxGeometry(1.4, 0.9, 1.0), { pos: [sx, y + 0.45, sz] }, { uv: 0.6, collide: true }); const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), canvasMat(512, 360, (c, w, h) => { c.fillStyle = '#0a1028'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8d8a0'; for (let i = 0; i < 220; i++) { c.globalAlpha = Math.random(); c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } c.globalAlpha = 0.7; c.strokeStyle = '#c9a052'; c.beginPath(); c.arc(w / 2, h / 2, 150, 0, 7); c.stroke(); c.beginPath(); c.arc(w / 2, h / 2, 90, 0, 7); c.stroke(); c.globalAlpha = 1; c.font = '22px "NB Serif", serif'; c.fillText('星图　·　并非此世', 20, 32); }, 0.25)); sm.rotation.x = -Math.PI / 2 + 0.35; sm.position.set(sx, y + 0.94, sz); zone.add(sm); }
    for (let k = 0; k < 5; k++) { const a = 0.5 + k * 1.15, x = cx + Math.sin(a) * (R - 0.75), z = cz + Math.cos(a) * (R - 0.75); const f = new Frame([x, y, z], a + Math.PI); for (const s of [-0.22, 0.22]) b.add('wood', new THREE.BoxGeometry(0.05, 4.2, 0.06), f.at(s, 2.0, -0.6 + 0.0, [-0.28, 0, 0]), { uv: 0.6 }); for (let r = 0; r < 12; r++) b.add('wood', new THREE.BoxGeometry(0.44, 0.04, 0.05), f.at(0, 0.25 + r * 0.33, -0.6 + 0.07 + r * 0.093, [-0.28, 0, 0]), { uv: 0.6 }); b.add('brass', new THREE.CylinderGeometry(0.015, 0.015, 2.4, 6), f.at(0, 5.0, -0.5 - 0.0, [0, 0, Math.PI / 2]), { uv: 1 }); }
    { const [gx, gz] = R3.library ? LIB_R3.vitrine : [3.2, -99.5]; if (R3.library) { P.add('r2/lib_vitrine', [gx, y, gz], { h: 1.92 }); world.box(gx, y + 0.95, gz, 1.66, 1.9, 0.86); { const vs = spot(zone, 0xffe2b8, 6.5, [gx, y + 3.4, gz + 2.6], [gx, y + 0.5, gz + 0.2], 0.55, false, 7); if (vs) vs.penumbra = 1; } /* 批次40：lib_vit 看图左 / 中芯板热斑 → 强度 11→6.5、角 0.42→0.55、半影 1、灯位抬高后退居中（光斑铺满三联芯板） */ point(zone, 0xffd8a8, 0.45, [gx + 1.1, y + 0.15, gz + 1.8], 2.6); { const vw = spot(zone, 0xffe6c4, 16, [gx + 0.4, y + 1.5, gz + 3.4], [gx, y + 0.45, gz + 0.4], 0.45, false, 6); if (vw) vw.penumbra = 1; } /* 批次43：只提木纹 albedo（0x4a3020→0x7c5434）看图芯面均值 RGB 16/9/5→18/9/5 几乎不变 → 真因是这道正前方柔射在 3 m 处照度只有 ~0.5（4.5 cd ÷ 9），不加新灯、把它 4.5→16 */ /* 批次42：lib_vit 底柜三联芯板近黑 → 柜正前方 3 m、离地 1.5 m 一道柔射（4.5、角 0.45、半影 1）正照立面芯板（上方洗光掠射立面无效，第一版 2.6 看图仍近黑）；不用近距点光 */ /* 批次41：lib_vit 中芯板热斑真因是柜前低位暖点光（距芯板 1 m 正对）→ 1.2→0.45、挪到右前 1.8 m 贴地 */ /* 批次39：lib_vit 看图底柜暗处读成黑漆 → 正前上方局部射灯 + 柜前低位暖光 */ } /* 批次38：blackMetal 方盒底座 → Blender 精建 r2/lib_vitrine（胡桃三联芯板底柜 + 铜线脚 + 铜框玻璃罩 + 胡桃檐顶 + 红丝绒台面；tools/blender/lib_vitrine.py） */ else b.add('blackMetal', new THREE.BoxGeometry(1.6, 0.8, 0.8), { pos: [gx, y + 0.4, gz] }, { uv: 1, collide: true }); const gc = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.7), M.glassClear); gc.position.set(gx, y + 1.3, gz); zone.add(gc); for (let k = 0; k < 3; k++) { const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0xe8dcbc, emissive: 0xffd890, emissiveIntensity: 0.25, side: THREE.DoubleSide })); pg.position.set(gx - 0.45 + k * 0.45, y + 1.25 + k * 0.08, gz); pg.rotation.set(0.2 * k, 0.6 * k, 0.1); zone.add(pg); (ctx.rooms.floatPages ??= []).push(pg); } const t = new THREE.Mesh(new THREE.PlaneGeometry(R3.library ? 0.5 : 0.7, R3.library ? 0.1 : 0.18), tagMaterial('限阅　·　自行翻页')); t.position.set(gx, y + (R3.library ? 0.725 : 0.65), gz + (R3.library ? 0.43 : 0.41)); zone.add(t); }
    if (!R3.library) { rug(b, cx, cz, 9, 9, y, 'dz_rugRed', Math.PI / 4); floorInlay(b, -10, 10, -96, -116, y, { field: 'dz_parquet', margin: 0.6, rep: 0.42 }); } // 批次12：R3 改同心圆地面（r3plan planLibrary）
    finish(zone, b, P);
  }

  // ================= 12F 机要室与局长室 =================
  if (zoneOf('director')) {
    const zone = zoneOf('director'), b = new Batch(), P = new Props(), y = UPPER['12F'], H = 7;
    WX(b, -13, -92.2, -111.8, 1, y, H, { style: 'red', pilSkip: [[-98, -102]], sconce: true, pitch: 4.9 });
    WX(b, 13, -92.2, -111.8, -1, y, H, { style: 'office', pitch: 4.5 });
    WZ(b, -92.2, -13, 13, -1, y, H, { style: 'red', skip: [[-2.3, 2.3]], pil: false });
    WX(b, 6.85, -95, -104, -1, y, H, { style: 'red', pil: false }); WX(b, 7.15, -95, -104, 1, y, H, { style: 'office', pil: false });
    WZ(b, -111.8, -13, -11.5, 1, y, H, { style: 'red', pil: false }); WZ(b, -111.8, 11.5, 13, 1, y, H, { style: 'red', pil: false });
    coffered(b, -13, 13, -92, -112, y + H, { cell: 2.6, depth: 0.45, lightEvery: 3 });
    // 窗间立柱：黑石 + 金线（北窗之间 1 m 墙垛）
    for (const x of [-11.5, -6.9, -2.3, 2.3, 6.9, 11.5]) { b.box('dz_pil', 0.9, H, 0.35, [x, y + H / 2, -111.62], { uv: 0.5 }); b.box('gold', 0.04, H - 0.6, 0.02, [x - 0.3, y + H / 2, -111.44], { uv: 1 }); b.box('gold', 0.04, H - 0.6, 0.02, [x + 0.3, y + H / 2, -111.44], { uv: 1 }); }
    // 南墙书柜（细书脊）
    for (const x of [-10.2, -7.4, -4.6, 4.6, 7.4, 10.2]) spineShelf(b, new Frame([x, y, -92.55], Math.PI), 2.7, 4.6, 0.6, { seed: x, wood: 'dz_wain' });
    for (const x of [-10.2, -7.4, -4.6, 4.6, 7.4, 10.2]) world.box(x, y + 2.3, -92.55, 2.7, 4.6, 0.6);
    floorInlay(b, -12.4, 12.4, -92.6, -111.4, y, { field: 'dz_parquet', margin: 0.3, rep: 0.42 });
    rug(b, 0, -104, 10, 7.2, y + 0.016, 'dz_rugRed');
    // 黑檀书桌上的陈设：红色电话、台灯、墨水台、一摞文件、蜡烛台
    telephone(b, 1.1, y + 0.92, -104.3, -0.3, 'dz_redPhone'); folderStack(b, -0.1, y + 0.92, -104.35, 0.1, 5); P.add('candle_holder', [1.4, y + 0.92, -103.8], { h: 0.32 }); b.box('blackMarble', 0.3, 0.05, 0.18, [-0.9, y + 0.94, -103.7], { uv: 0.5 });
    // 壁炉侧：两张扶手椅 + 小圆几 + 地球仪
    for (const z of [-98.4, -101.6]) P.add('armchair', [-10, y, z], { h: 1.05, yaw: -Math.PI / 2 + (z > -100 ? -0.4 : 0.4) });
    b.add('wood', new THREE.CylinderGeometry(0.35, 0.35, 0.04, 20), { pos: [-9.4, y + 0.6, -100] }, { uv: 0.6 }); b.add('wood', new THREE.CylinderGeometry(0.04, 0.12, 0.6, 10), { pos: [-9.4, y + 0.3, -100] }, { uv: 0.6, collide: true }); P.add('vase', [-9.4, y + 0.62, -100], { h: 0.32 });
    rug(b, -9.6, -100, 3.4, 4.6, y + 0.016, 'dz_rugNavy');
    P.add('gothic_cabinet', [-12.4, y, -95.2], { h: 2.6, yaw: Math.PI / 2 }); P.add('gothic_cabinet', [-12.4, y, -105.6], { h: 2.6, yaw: Math.PI / 2 }); world.box(-12.4, y + 1.3, -95.2, 1, 2.6, 2); world.box(-12.4, y + 1.3, -105.6, 1, 2.6, 2);
    b.box('blackMarble', 0.7, 1.1, 0.7, [-8.5, y + 0.55, -109.5], { uv: 0.5, collide: true }); P.add('marble_bust', [-8.5, y + 1.1, -109.5], { h: 0.62, yaw: 0.6 });
    b.box('blackMarble', 0.7, 1.1, 0.7, [8.5, y + 0.55, -109.5], { uv: 0.5, collide: true }); P.add('bronze_gui', [8.5, y + 1.1, -109.5], { h: 0.35 });
    // 局徽挂毯（机要室隔墙西面）
    { const tp = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.2), M.navy); tp.position.set(6.82, y + 3.4, -99.5); tp.rotation.y = -Math.PI / 2; zone.add(tp); const em = emblem(0.75, M.goldBright, M.navy); em.position.set(6.78, y + 3.7, -99.5); em.rotation.y = -Math.PI / 2; zone.add(em); b.box('brass', 0.06, 0.06, 2.8, [6.78, y + 5.55, -99.5], { uv: 1 }); for (let k = 0; k < 9; k++) b.box('gold', 0.02, 0.18, 0.04, [6.8, y + 1.22, -100.6 + k * 0.27], { uv: 1 }); }
    // 机要室：碎纸机、密电终端、档案柜、密码门键盘
    b.box('blackMetal', 0.6, 0.8, 0.45, [8, y + 0.4, -94.6], { uv: 1, collide: true }); b.box('dz_bakelite', 0.5, 0.04, 0.05, [8, y + 0.81, -94.6], { uv: false }); paperStack(b, 8.4, y, -95.1, 0.4, 2);
    b.box('wood', 1.6, 0.76, 0.8, [11.8, y + 0.38, -102.6], { uv: 0.6, collide: true }); P.add('monitor', [11.8, y + 0.76, -102.85], { h: 0.4, yaw: -Math.PI / 2 }); P.add('keyboard', [11.5, y + 0.76, -102.6], { w: 0.42, yaw: -Math.PI / 2 }); telephone(b, 11.8, y + 0.76, -102.0, -Math.PI / 2, 'dz_redPhone');
    cabinetRow(P, world, 10, y, -103.5, 0, 4, 0.62, 'drawer_cabinet', 1.4);
    b.box('blackMetal', 0.04, 0.28, 0.18, [7.17, y + 1.4, -96.4], { uv: 1 }); const kp = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.2), new THREE.MeshStandardMaterial({ color: 0, emissive: 0x30ff70, emissiveIntensity: 0.9 })); kp.position.set(7.2, y + 1.42, -96.4); kp.rotation.y = Math.PI / 2; zone.add(kp);
    point(zone, 0xffc890, 5, [-11, y + 4.8, -100], 8); point(zone, 0xffc890, 4, [10, y + 3.5, -99], 7);
    finish(zone, b, P);
  }

  // ================= 1F 职工食堂与中庭 =================
  if (zoneOf('canteen')) {
    const zone = zoneOf('canteen'), b = new Batch(), P = new Props(), X = 18, Z0 = -110, Z1 = -140;
    WX(b, -X, Z0 - 0.2, Z1 + 0.2, 1, Y, 6.15, { style: 'green', pitch: 6, sconce: true });
    WX(b, X, Z0 - 0.2, Z1 + 0.2, -1, Y, 6.15, { style: 'green', pitch: 6, sconce: true, skip: [[-111.3, -115.1]] });
    WZ(b, Z1 + 0.2, -X, X, 1, Y, 6.8, { style: 'green', pilSkip: [[-7.4, 7.4]] });
    WZ(b, Z0 - 0.2, -X, X, -1, Y, 6.8, { style: 'green', skip: [[-2.5, 2.5]], pilSkip: [[-3.4, 3.4]] });
    // 上层墙：哥特高窗（彩窗）+ 壁柱
    for (const sx of [-1, 1]) for (let z = Z0 - 4; z > Z1 + 2; z -= 6) { const f = new Frame([sx * (X - 0.02), Y + 7.6, z], -sx * Math.PI / 2); b.add('glassIn', new THREE.ShapeGeometry(archShape(1.7, 3.2)), f.at(0, 0, 0.02), { uv: false }); b.add('stoneDark', archRingGeo(2.2, 3.2, 1.7, 3.2, 0.25), f.at(0, 0, 0.1), { uv: 0.5 }); b.add('gold', archRingGeo(2.3, 3.2, 2.2, 3.2, 0.27), f.at(0, 0, 0.1), { uv: 1 }); b.box('dz_pil', 0.5, 6.0, 0.18, [sx * (X - 0.09), Y + 9.9, z - 3], { uv: 0.5 }); }
    for (const z of [Z0, Z1]) { const f = new Frame([0, Y + 7.3, z + (z === Z0 ? -0.22 : 0.22)], z === Z0 ? Math.PI : 0); for (const dx of [-4.2, 0, 4.2]) { b.add('glassIn', new THREE.ShapeGeometry(archShape(2.2, dx === 0 ? 3.6 : 2.8)), f.at(dx, 0, 0.02), { uv: false }); b.add('gold', archRingGeo(2.5, dx === 0 ? 3.6 : 2.8, 2.2, dx === 0 ? 3.6 : 2.8, 0.25), f.at(dx, 0, 0.1), { uv: 1 }); } }
    // 二层挑台可登临：西侧沿挑台外沿的直跑楼梯（z −112 → −128），挑台楼板与栏杆加碰撞，栏杆在梯口留缺口
    { const sx = -13.0, za = -112.2, zb = -128.0, top = Y + 6.45, n = 50; const run = (za - zb) / n, rise = (top - Y) / n;
      for (let i = 0; i < n; i++) b.box('dz_beam', 1.4, rise + 0.02, run + 0.02, [sx, Y + rise * (i + 0.5), za - run * (i + 0.5)], { uv: 0.6 });
      b.add('dz_pil', new THREE.BoxGeometry(0.12, 0.5, za - zb), { pos: [sx + 0.72, (Y + top) / 2 - 0.1, (za + zb) / 2], rot: [Math.atan2(top - Y, za - zb), 0, 0] }, { uv: 0.5 });
      b.add('brass', new THREE.BoxGeometry(0.06, 0.06, Math.hypot(za - zb, top - Y)), { pos: [sx + 0.72, (Y + top) / 2 + 0.95, (za + zb) / 2], rot: [Math.atan2(top - Y, za - zb), 0, 0] }, { uv: 1 });
      for (let i = 0; i <= n; i += 4) b.box('iron', 0.025, 0.95, 0.025, [sx + 0.72, Y + rise * i + 0.47, za - run * i], { uv: 1 });
      world.ramp([sx, Y, za + 0.2], [sx, top, zb], 1.3); world.box(sx + 0.75, (Y + top) / 2 + 0.6, (za + zb) / 2, 0.1, top - Y + 1.2, za - zb);
      ctx.canteenStair = { x: sx, za, zb }; }
    for (const sx of [-1, 1]) { world.box(sx * (X - 2), Y + 6.4, (Z0 + Z1) / 2, 4, 0.12, Z0 - Z1); const x = sx * (X - 4); if (sx < 0) { world.box(x, Y + 7.0, (Z0 - 0.2 + -127.6) / 2, 0.1, 1.2, -127.6 - (Z0 - 0.2) < 0 ? (Z0 - 0.2) - -127.6 : 0.1); world.box(x, Y + 7.0, (-129.4 + Z1) / 2, 0.1, 1.2, -129.4 - Z1); } else world.box(x, Y + 7.0, (Z0 + Z1) / 2, 0.1, 1.2, Z0 - Z1); }
    // 挑台咖啡座（两侧各 4 组小圆桌）
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { const x = sx * (X - 2), z = -114 - k * 6.5 - (sx < 0 && k === 2 ? 2.5 : 0); b.add('dz_pil', new THREE.CylinderGeometry(0.4, 0.4, 0.04, 20), { pos: [x, Y + 7.2, z] }, { uv: 0.5 }); b.add('brass', new THREE.CylinderGeometry(0.04, 0.2, 0.75, 10), { pos: [x, Y + 6.82, z] }, { uv: 1 }); P.add('armchair', [x, Y + 6.45, z - 0.8], { h: 0.85 }); P.add('armchair', [x, Y + 6.45, z + 0.8], { h: 0.85, yaw: Math.PI }); b.add('whiteMarble', new THREE.CylinderGeometry(0.045, 0.04, 0.09, 12), { pos: [x + 0.1, Y + 7.27, z] }, { uv: 1 }); }
    // 挑台：栏杆立柱（替换整片铁板）+ 托架 + 挑台下吊顶
    for (const sx of [-1, 1]) { const x = sx * (X - 4); for (let z = Z0 - 0.3; z > Z1; z -= 0.18) { if (sx < 0 && z < -127.6 && z > -129.4) continue; b.box('iron', 0.025, 0.95, 0.025, [x, Y + 6.93, z], { uv: 1 }); } b.box('iron', 0.05, 0.05, Z0 - Z1, [x, Y + 6.5, (Z0 + Z1) / 2], { uv: 1 }); b.box('dz_beam', 0.12, 0.3, Z0 - Z1, [x, Y + 6.0, (Z0 + Z1) / 2], { uv: 0.5 }); for (let z = Z0 - 1.5; z > Z1; z -= 3) { b.box('dz_beam', 4, 0.22, 0.18, [sx * (X - 2), Y + 6.03, z], { uv: 0.5 }); b.box('gold', 0.3, 0.3, 0.3, [x, Y + 5.95, z], { uv: 1 }); } for (let z = Z0 - 3; z > Z1; z -= 6) { b.box('dz_glow', 0.3, 0.02, 0.3, [sx * (X - 2), Y + 5.9, z], { uv: false }); } }
    // 地面：水磨石拼花 + 走道黑石带
    floorInlay(b, -X, X, Z0, Z1, Y, { field: 'terrazzo', margin: 0.5, rep: 2.6, band: 'dz_pil' }); // M5：颗粒细化（原 0.8 → 2.6）
    for (const x of [-4.5, 4.5]) b.box('dz_pil', 1.2, 0.014, Z0 - Z1 - 2, [x, Y + 0.012, (Z0 + Z1) / 2], { uv: 0.5 });
    // 桌面：餐盘、杯、调味架
    for (let r = 0; r < 5; r++) for (const x of [-9, 0, 9]) { if (R3.canteen && r === 0 && x === 0) continue; const z = Z0 - 5 - r * 4.2, t = Y + 0.8; b.box('dz_bakelite', 0.5, 0.012, 0.5, [x, t + 0.006, z], { uv: false }); b.add('brass', new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8), { pos: [x - 0.1, t + 0.06, z] }, { uv: 1 }); b.add('dz_glassDark', new THREE.CylinderGeometry(0.025, 0.025, 0.11, 8), { pos: [x + 0.1, t + 0.055, z] }, { uv: false }); for (let c = 0; c < 3; c++) { const cx = x - 2 + c * 2 + ((r + c) % 2) * 0.5, cz = z + (c % 2 ? 0.3 : -0.3); if ((r * 3 + c + x) % 3 === 0) continue; b.box('steel', 0.42, 0.02, 0.3, [cx, t + 0.01, cz], { uv: 1 }); b.add('whiteMarble', new THREE.CylinderGeometry(0.045, 0.04, 0.1, 12), { pos: [cx + 0.25, t + 0.05, cz] }, { uv: 1 }); } }
    // 西侧挑台下：咖啡机台 + 托盘架 + 自助茶水
    { const x = -X + 0.7; b.box('wood', 1.0, 0.95, 6, [x, Y + 0.475, -121], { uv: 0.6, collide: true }); b.box('blackMarble', 1.05, 0.05, 6.05, [x, Y + 0.97, -121], { uv: 0.5 }); for (const z of [-119, -121.5]) { b.box('steel', 0.55, 0.65, 0.5, [x, Y + 1.32, z], { uv: 1 }); b.box('dz_bakelite', 0.4, 0.2, 0.05, [x + 0.28, Y + 1.45, z], { uv: false }); const lm = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshBasicMaterial({ color: 0x40ff80 })); lm.position.set(x + 0.31, Y + 1.5, z + 0.12); lm.rotation.y = Math.PI / 2; zone.add(lm); } for (let k = 0; k < 8; k++) b.box('whiteMarble', 0.08, 0.1, 0.08, [x - 0.1, Y + 1.05, -123.2 - k * 0.12], { uv: 1 }); for (let k = 0; k < 12; k++) b.box('steel', 0.42, 0.012, 0.3, [x, Y + 1.0 + k * 0.014, -118.0], { uv: 1 }); hangingSign(zone, M, '自助茶水　·　咖啡', x + 0.4, Y + 3.0, -121, Math.PI / 2, 1.8); }
    // 东侧挑台下：员工信箱墙 + 点餐机
    { const x = X - 0.35; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { b.box('brass', 0.04, 0.32, 0.42, [x, Y + 1.0 + j * 0.36, -124 - i * 0.46], { uv: 1 }); b.box('dz_bakelite', 0.03, 0.03, 0.12, [x - 0.03, Y + 1.12 + j * 0.36, -124 - i * 0.46], { uv: false }); } b.box('dz_wain', 0.5, 1.5, 3.0, [x + 0.05, Y + 1.5, -125.15], { uv: 0.6 }); for (const z of [-132, -134]) { b.box('blackMetal', 0.4, 1.5, 0.5, [X - 0.6, Y + 0.75, z], { uv: 1, collide: true }); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.45), new THREE.MeshStandardMaterial({ color: 0, emissive: 0x6aa0ff, emissiveIntensity: 0.8 })); sc.position.set(X - 0.81, Y + 1.25, z); sc.rotation.y = -Math.PI / 2; zone.add(sc); } }
    // 中庭小喷泉（入口北侧，规则之泉的缩小复刻）
    { const fx = 0, fz = -113.2; b.add('dz_pil', new THREE.CylinderGeometry(1.0, 1.1, 0.45, 32), { pos: [fx, Y + 0.225, fz] }, { uv: 0.5, collide: true }); b.add('gold', new THREE.TorusGeometry(1.0, 0.03, 6, 48), { pos: [fx, Y + 0.45, fz], rot: [Math.PI / 2, 0, 0] }, { uv: 1 }); const w = new THREE.Mesh(new THREE.CircleGeometry(0.92, 32), new THREE.MeshPhysicalMaterial({ color: 0x0a1a24, roughness: 0.05, metalness: 0.1, clearcoat: 1, envMapIntensity: 1.2 })); w.rotation.x = -Math.PI / 2; w.position.set(fx, Y + 0.4, fz); zone.add(w); b.add('gold', new THREE.ConeGeometry(0.12, 1.3, 8), { pos: [fx, Y + 1.05, fz] }, { uv: 1 }); b.add('dz_pil', new THREE.CylinderGeometry(0.18, 0.22, 0.4, 12), { pos: [fx, Y + 0.55, fz] }, { uv: 0.5 }); }
    P.add('wall_clock', [0, Y + 5.9, Z1 + 0.3], { w: 1.0 });
    for (const [x, z] of [[-16.5, -111.5], [16.5, -138.5], [-16.5, -138.5], [-6, -111.2], [6, -111.2]]) plantPot(b, x, Y, z, 1.25);
    for (const z of [-114, -126, -138]) for (const sx of [-1, 1]) P.add('extinguisher', [sx * (X - 0.3), Y, z], { h: 0.6 });
    finish(zone, b, P);
  }

  // ================= B1 外勤缉拿处与整备库 =================
  if (zoneOf('armory')) {
    const zone = zoneOf('armory'), b = new Batch(), P = new Props(), y = UNDER.B1, X = 16, Z0 = -92, Z1 = -126, H = 5.6;
    WX(b, -X, Z0 - 0.2, Z1 + 0.2, 1, y, H, { style: 'bunker', pitch: 6, pilSkip: [[-96.6, -103.4], [-106.3, -109.7]] });
    WX(b, X, Z0 - 0.2, Z1 + 0.2, -1, y, H, { style: 'bunker', pitch: 6 });
    WZ(b, Z1 + 0.2, -X, X, 1, y, H, { style: 'bunker', pil: false });
    WZ(b, Z0 - 0.2, -X, X, -1, y, H, { style: 'bunker', skip: [[-2.3, 2.3], [-9.4, -9.0], [9.0, 9.4]], pilSkip: [[5.4, 6.6]] });
    bunkerCeiling(b, -X, X, Z0, Z1, y + H, { step: 4 });
    // 制式武器柜（西墙北段）：刻符文的枪械与刀具
    for (let k = 0; k < 3; k++) { const z = -117 - k * 2.6; b.box('blackMetal', 0.6, 2.4, 2.3, [-X + 0.35, y + 1.2, z], { uv: 1, collide: true }); b.box('dz_glassDark', 0.02, 2.0, 2.0, [-X + 0.66, y + 1.25, z], { uv: false }); for (let g = 0; g < 6; g++) { b.box('dz_bakelite', 0.06, 0.9, 0.08, [-X + 0.5, y + 1.3, z - 0.8 + g * 0.32], { uv: false, rot: [0.05, 0, 0] }); b.box('gold', 0.065, 0.04, 0.085, [-X + 0.5, y + 1.55, z - 0.8 + g * 0.32], { uv: false }); } const t = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.16), tagMaterial(['制式　符文步枪', '制式　镇纸短刀', '封印手铐　锁喉铐'][k])); t.position.set(-X + 0.67, y + 2.55, z); t.rotation.y = Math.PI / 2; zone.add(t); }
    // 储物柜一排（南墙西段）
    for (let k = 0; k < 10; k++) { const x = -14.6 + k * 0.62; b.box('paintedGreen', 0.6, 2.0, 0.5, [x, y + 1.0, Z0 - 0.5], { uv: 1 }); for (let v = 0; v < 4; v++) b.box('dz_bakelite', 0.3, 0.015, 0.01, [x, y + 1.6 + v * 0.05, Z0 - 0.755], { uv: false }); b.box('steel', 0.03, 0.12, 0.02, [x + 0.22, y + 1.1, Z0 - 0.76], { uv: 1 }); } world.box(-11.8, y + 1, Z0 - 0.5, 6.2, 2, 0.5);
    // 维修工作台 + 工具挂板
    b.box('steel', 3.0, 0.08, 0.9, [3, y + 0.92, Z1 + 2.2 + 3], { uv: 1 }); for (const sx of [-1.4, 1.4]) b.box('blackMetal', 0.08, 0.9, 0.8, [3 + sx, y + 0.45, Z1 + 5.2], { uv: 1 }); world.box(3, y + 0.46, Z1 + 5.2, 3, 0.92, 0.9); P.add('plastic_container', [2.2, y + 0.96, Z1 + 5.2], { h: 0.3 }); P.add('rusty_lantern', [4.1, y + 0.96, Z1 + 5.2], { h: 0.35 });
    // 货物与路障
    P.add('road_barrier', [-3, y, -104], { h: 0.8, yaw: Math.PI / 2 }); P.add('road_barrier', [-3, y, -109], { h: 0.8, yaw: Math.PI / 2 }); world.box(-3, y + 0.4, -104, 0.6, 0.8, 2.5); world.box(-3, y + 0.4, -109, 0.6, 0.8, 2.5);
    for (const [x, z, r] of [[14.2, -124.4, 0.1], [13.0, -124.6, -0.2], [14.2, -123.2, 0.4]]) P.add('cardboard_box', [x, y, z], { h: 0.55, yaw: r });
    P.add('box_stack', [-6, y, -124.6], { h: 1.4 }); P.add('storage_cart', [-8.6, y, -123.4], { h: 1.0, yaw: 0.3 }); world.box(-6, y + 0.7, -124.6, 1.6, 1.4, 1.2);
    for (const [x, z, r] of [[-X + 0.3, -112, Math.PI / 2], [X - 0.3, -96, -Math.PI / 2], [X - 0.3, -122, -Math.PI / 2]]) { P.add('extinguisher', [x, y, z], { h: 0.6, yaw: r }); P.add('fire_alarm', [x, y + 1.5, z + 0.5], { h: 0.15, yaw: r }); }
    for (const [x, z, r] of [[-X + 0.4, Z0 - 0.4, 2.4], [X - 0.4, Z1 + 0.4, -0.8], [X - 0.4, Z0 - 0.4, -2.4]]) P.add('cctv', [x, y + H - 0.9, z], { h: 0.35, yaw: r });
    for (let z = Z0 - 4; z > Z1; z -= 6) for (const x of [-8, 0, 8]) P.add('fluorescent', [x, y + H - 0.12, z], { w: 2.4 });
    for (let k = 0; k < 4; k++) { const z = -100 - k * 5; b.box('hazard', 2.8, 0.01, 0.14, [10, y + 0.012, z + 2.6], { uv: 0.8 }); }
    finish(zone, b, P);
  }

  // ================= B2 审讯室与临时羁押 =================
  if (zoneOf('interrogation')) {
    const zone = zoneOf('interrogation'), b = new Batch(), P = new Props(), y = UNDER.B2, H = 4.2;
    // 走廊：不锈钢护墙扶手、踢脚，吊顶笼灯，监控
    for (const sx of [-1, 1]) { const x = sx * 2.17; b.box('steel', 0.04, 0.06, 44, [x, y + 1.0, -114], { uv: 1 }); b.box('blackMetal', 0.05, 0.2, 44, [x + sx * 0.02, y + 0.1, -114], { uv: 1 }); }
    for (let z = -96; z > -135; z -= 7) P.add('caged_light', [0, y + H - 0.45, z], { h: 0.35, rx: Math.PI });
    for (const z of [-94, -112, -130]) P.add('security_camera', [1.9, y + H - 0.35, z], { h: 0.25, yaw: Math.PI });
    // 物证暂存柜（走廊南端西侧）
    for (let k = 0; k < 3; k++) { b.box('steel', 0.5, 2.0, 0.9, [-1.9, y + 1.0, -125 - k * 0.95], { uv: 1, collide: true }); b.box('blackMetal', 0.02, 0.1, 0.4, [-1.64, y + 1.6, -125 - k * 0.95], { uv: 1 }); const t = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), tagMaterial('物证 0' + (k + 1))); t.position.set(-1.63, y + 1.8, -125 - k * 0.95); t.rotation.y = Math.PI / 2; zone.add(t); }
    // 观察间 / 审讯室：混凝土护墙 + 吸音板
    WX(b, -12.4, -95.2, -106.8, 1, y, H, { style: 'bunker', pil: false });
    WZ(b, -95.2, -12.4, -7.55, -1, y, H, { style: 'bunker', pil: false }); WZ(b, -106.8, -12.4, -7.55, 1, y, H, { style: 'bunker', pil: false });
    WZ(b, -95.2, -7.25, -2.55, -1, y, H, { style: 'bunker', pil: false }); WZ(b, -106.8, -7.25, -2.55, 1, y, H, { style: 'bunker', pil: false });
    for (let z = -96; z > -106; z -= 1.2) for (let v = 0; v < 2; v++) b.box('dz_tileB', 0.06, 1.0, 1.1, [-12.15, y + 1.9 + v * 1.05, z - 0.6], { uv: 0.5 });
    P.add('security_camera', [-12.0, y + H - 0.4, -95.6], { h: 0.25, yaw: Math.PI * 0.75 });
    b.box('blackMetal', 0.8, 1.6, 0.4, [-3.0, y + 0.8, -106.3], { uv: 1, collide: true }); for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), new THREE.MeshBasicMaterial({ color: [0xff3020, 0x30ff60, 0xffc030][k] })); l.position.set(-3.2 + k * 0.2, y + 1.4, -106.09); zone.add(l); }
    P.add('stapler', [-5.6, y + 0.79, -100.8], { w: 0.14 }); paperStack(b, -4.6, y + 0.79, -100.7, 0.3, 5); P.add('clipboard', [-5.9, y + 0.79, -101.2], { w: 0.22, yaw: 0.2 });
    finish(zone, b, P);
  }

  // ================= B6 驯化副本训练场 =================
  if (zoneOf('training')) {
    const zone = zoneOf('training'), b = new Batch(), P = new Props(), y = UNDER.B6, X = 32, Z0 = -92, Z1 = -156, H = 16;
    // 墙面：深色模块护墙板 + 竖向蓝色灯条
    const tech = { style: 'bunker', over: { low: 'dz_tileB', up: 'dz_tileB', trim: 'dz_blueGlow', pilW: 0.4 }, pitch: 8 };
    WX(b, -X, Z0 - 0.2, Z1 + 0.2, 1, y, H, tech); WX(b, X, Z0 - 0.2, Z1 + 0.2, -1, y, H, tech); WZ(b, Z1 + 0.2, -X, X, 1, y, H, { ...tech, pilSkip: [[-3, 3]] }); WZ(b, Z0 - 0.2, -X, X, -1, y, H, { ...tech, skip: [[-9.4, 9.4]] });
    // 环形检修马道（高 7 m）+ 栏杆 + 托架
    for (const [cx, cz, w, d] of [[-X + 0.9, (Z0 + Z1) / 2, 1.6, Z0 - Z1], [X - 0.9, (Z0 + Z1) / 2, 1.6, Z0 - Z1], [0, Z1 + 0.9, 2 * X, 1.6]]) { b.box('dz_grate', w, 0.06, d, [cx, y + 7, cz], { uv: 2 }); }
    for (const sx of [-1, 1]) { const x = sx * (X - 1.7); b.box('steel', 0.05, 0.05, Z0 - Z1, [x, y + 8.05, (Z0 + Z1) / 2], { uv: 1 }); for (let z = Z0 - 1; z > Z1; z -= 2) { b.box('steel', 0.04, 1.05, 0.04, [x, y + 7.53, z], { uv: 1 }); b.box('blackMetal', 1.6, 0.12, 0.08, [sx * (X - 0.9), y + 6.9, z], { uv: 1 }); } }
    b.box('steel', 2 * X - 3.4, 0.05, 0.05, [0, y + 8.05, Z1 + 1.7], { uv: 1 }); for (let x = -X + 2; x < X - 1; x += 2) b.box('steel', 0.04, 1.05, 0.04, [x, y + 7.53, Z1 + 1.7], { uv: 1 });
    // 顶部灯光桁架（每 12 m 一榀）+ 射灯头
    for (let z = Z0 - 10; z > Z1 + 4; z -= 12) { for (const dy of [0, 0.8]) b.box('steel', 2 * X, 0.08, 0.08, [0, y + H - 1.2 - dy, z], { uv: 1 }); for (let x = -X + 1; x < X; x += 1.6) b.box('steel', 0.04, 0.8, 0.04, [x, y + H - 1.6, z], { uv: 1, rot: [0, 0, 0.6 * ((x / 1.6) % 2 ? 1 : -1)] }); for (let x = -24; x <= 24; x += 8) { b.add('blackMetal', new THREE.CylinderGeometry(0.16, 0.2, 0.4, 12), { pos: [x, y + H - 2.3, z], rot: [0.5, 0, 0] }, { uv: 1 }); b.add('dz_glowCold', new THREE.CircleGeometry(0.15, 12), { pos: [x, y + H - 2.48, z + 0.1], rot: [Math.PI / 2 + 0.5, 0, 0] }, { uv: false }); } }
    // 护具区：软垫地块 + 护具架 + 急救站 + 观众看台
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) b.box(((i + j) % 2) ? 'navy' : 'dz_bakelite', 2, 0.08, 2, [18 + i * 2.05, y + 0.04, -100 - j * 2.05], { uv: 0.6 });
    P.add('worn_rack', [28, y, -97], { h: 2, yaw: -Math.PI / 2 }); P.add('gas_mask', [27.5, y + 1.3, -98.2], { h: 0.3, yaw: -Math.PI / 2 });
    { b.box('whitePad', 1.6, 2.2, 0.8, [-29, y + 1.1, -100], { uv: 1, collide: true }); const cm = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), crossMat()); cm.position.set(-28.18, y + 1.7, -100); cm.rotation.y = Math.PI / 2; zone.add(cm); hangingSign(zone, M, '急救点', -28.4, y + 3.2, -100, Math.PI / 2, 1.4); P.add('extinguisher', [-29.2, y, -101.8], { h: 0.6 }); }
    for (let s = 0; s < 4; s++) { b.box('dz_pil', 1.0, 0.5, 18, [X - 2.0 - s * 1.0, y + 0.25 + s * 0.5, -138], { uv: 0.5, collide: true }); b.box('blackMetal', 0.98, 0.12, 18, [X - 2.0 - s * 1.0, y + 0.56 + s * 0.5, -138], { uv: 1 }); }
    // 地面局徽（训练场中心）
    { const em = emblem(4.5, M.goldEmis, M.navy); em.rotation.x = -Math.PI / 2; em.position.set(0, y + 0.03, -122); zone.add(em); }
    finish(zone, b, P);
  }

  // ================= B5 深库：黑石墙裙 + 金线壁柱 + 法阵光柱 + 红色警示灯 =================
  if (zoneOf('vault_b5')) {
    const zone = zoneOf('vault_b5'), b = new Batch(), P = new Props(), y = -42, H = 7;
    const vs = { style: 'stone', over: { up: null, low: 'dz_pil', field: 'stoneDark', lowH: 1.4 }, pitch: 5 };
    WX(b, -14, -100.4, -133.8, 1, y, H, vs); WX(b, 14, -100.4, -133.8, -1, y, H, vs); WZ(b, -133.8, -14, 14, 1, y, H, { ...vs, skip: [[-1.9, 1.9]] });
    zone.add(lightShaftLite(0, y + H, -117, y, 1.6, 3.4, 0xffc880, 0.14));
    for (const sx of [-1, 1]) for (const z of [-104, -130]) { b.add('blackMetal', new THREE.CylinderGeometry(0.12, 0.12, 0.12, 12), { pos: [sx * 13.8, y + H - 0.6, z], rot: [0, 0, Math.PI / 2] }, { uv: 1 }); b.add('dz_redGlow', new THREE.SphereGeometry(0.1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), { pos: [sx * 13.7, y + H - 0.6, z], rot: [0, 0, sx * Math.PI / 2] }, { uv: false }); point(zone, 0xff2010, 2.2, [sx * 13.2, y + H - 0.7, z], 6); }
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; b.box('dz_pil', 0.5, 0.02, 0.18, [Math.cos(a) * 4.4, y + 0.01, -117 + Math.sin(a) * 4.4], { uv: 0.5, rot: [0, -a, 0] }); }
    finish(zone, b, P);
  }

  // ================= 正门门廊：护墙板（只做墙裙与踢脚，上部保留盲拱壁龛） =================
  if (zoneOf('gate')) {
    const zone = zoneOf('gate'), b = new Batch(), P = new Props();
    const wain = { style: 'stone', over: { up: null, lowH: 1.1 }, pil: false };
    WX(b, -13.9, -6.6, -29.6, 1, Y, 14, wain);
    WX(b, 13.9, -6.6, -9.9, -1, Y, 14, wain); WX(b, 13.9, -24.1, -29.6, -1, Y, 14, wain);
    WZ(b, -29.6, -13.9, -5.2, 1, Y, 14, wain); WZ(b, -29.6, 5.2, 13.9, 1, Y, 14, wain);
    rug(b, 0, -18, 5.4, 20, Y, 'dz_rugNavy');
    for (const z of [-10, -26]) for (const sx of [-1, 1]) { const x = sx * 13.6; b.add('brass', new THREE.BoxGeometry(0.06, 0.4, 0.16), { pos: [x, Y + 3.2, z] }, { uv: 1 }); b.add('dz_shade', new THREE.CylinderGeometry(0.1, 0.16, 0.3, 12, 1, true), { pos: [x - sx * 0.25, Y + 3.45, z] }, { uv: false }); b.add('dz_glow', new THREE.SphereGeometry(0.05, 8, 6), { pos: [x - sx * 0.25, Y + 3.4, z] }, { uv: false }); }
    finish(zone, b, P);
  }

  // ================= 人事档案馆：墙面护墙板、长地毯、书车、梯子、档案箱、钟与局徽 =================
  if (zoneOf('archive')) {
    const zone = zoneOf('archive'), b = new Batch(), P = new Props(), GY = Y + 6.2;
    WX(b, -56, -32.2, -69.8, 1, Y, 6.0, { style: 'green', pil: false });
    WX(b, -56, -32.2, -69.8, 1, GY, 6.8, { style: 'green', skip: wins([-64, -55.4, -46.8, -38.2], 1.45), pitch: 4.3 });
    WX(b, -20, -32.2, -69.8, -1, Y, 6.2, { style: 'green', skip: [[-47.8, -55.2]], pitch: 4.5 });
    WX(b, -20, -32.2, -69.8, -1, GY, 6.8, { style: 'green', pitch: 4.5, pilSkip: [[-50, -53]] });
    rug(b, -38, -53, 3.4, 30, Y, 'dz_rugRed'); rug(b, -38, -51.5, 30, 3.4, Y + 0.004, 'dz_rugRed');
    P.add('wall_clock', [-20.25, GY + 3.4, -51.5], { w: 1.5, yaw: -Math.PI / 2 });
    { const em = emblem(1.3, M.goldBright, M.navy); em.position.set(-55.8, GY + 3.4, -51.1); em.rotation.y = Math.PI / 2; zone.add(em); }
    // 书车 ×2（档案袋 + 档案盒）
    for (const [x, z, r] of (R3.archive ? [[-32.0, -45.0, 0.3], [-44.5, -59.0, -0.4]] : [[-30.5, -41, 0.3], [-45, -62.5, -0.4]])) { const f = new Frame([x, Y, z], r); for (const yy of [0.25, 0.65, 1.0]) b.add('wood', new THREE.BoxGeometry(1.1, 0.04, 0.5), f.at(0, yy, 0), { uv: 0.6 }); for (const ex of [-1, 1]) b.add('brass', new THREE.BoxGeometry(0.03, 1.05, 0.5), f.at(ex * 0.55, 0.53, 0), { uv: 1 }); for (const ex of [-1, 1]) for (const ez of [-1, 1]) b.add('rubber', new THREE.CylinderGeometry(0.05, 0.05, 0.03, 10), f.at(ex * 0.5, 0.05, ez * 0.2, [Math.PI / 2, 0, 0]), { uv: false }); for (let k = 0; k < 8; k++) b.add(k % 3 ? 'kraftDark' : 'kraft', new THREE.BoxGeometry(0.09, 0.3, 0.34), f.at(-0.45 + k * 0.1, 0.42, 0, [0, 0, (k % 4 === 3) ? 0.2 : 0]), { uv: 2 }); world.box(x, Y + 0.55, z, 1.2, 1.1, 0.6, r); }
    for (const [x, z, r] of (R3.archive ? [[-32.0, -45.0, 0.3], [-44.5, -59.0, -0.4]] : [[-30.5, -41, 0.3], [-45, -62.5, -0.4]])) folderStack(b, x, Y + 1.02, z, r, 5);
    // 第二架移动梯（南墙档案柜）
    { const lx = -29, lz = -68.5; for (const ex of [-1, 1]) b.box('wood', 0.06, 5.2, 0.06, [lx + ex * 0.25, Y + 2.6, lz], { uv: 1, rot: [-0.18, 0, 0] }); for (let k = 0; k < 14; k++) b.box('brass', 0.5, 0.03, 0.03, [lx, Y + 0.3 + k * 0.36, lz - 0.05 + k * 0.065], { uv: 1 }); }
    // 档案箱堆（档案柜脚下）
    for (const [x, z, r] of [[-24.5, -33.3, 0.2], [-25.3, -33.4, -0.1], [-24.9, -33.3, 0.5], [-52.5, -68.6, 0.3], [-51.7, -68.7, -0.2]]) P.add('cardboard_box', [x, Y, z], { h: 0.42, yaw: r });
    P.add('cardboard_box', [-24.9, Y + 0.42, -33.3], { h: 0.4, yaw: 1.2 });
    for (const [x, z] of [[-21.2, -33.2], [-21.2, -68.8], [-54.8, -33.2]]) plantPot(b, x, Y, z, 1.2);
    bin(b, -48.6, Y, -55.6);
    finish(zone, b, P);
  }

  jobs.push(buildR3(ctx, world, MAT));
  await Promise.all(jobs);
}

export function updateDressing(ctx, dt, t) {
  if (ctx.rooms?.pod) ctx.rooms.pod.material.opacity = 0.14 + Math.sin(t * 1.3) * 0.05;
  for (const [i, p] of (ctx.rooms?.floatPages ?? []).entries()) { p.position.y += Math.sin(t * 0.9 + i * 2) * 0.0008; p.rotation.y += dt * 0.15 * (i % 2 ? 1 : -1); }
}
