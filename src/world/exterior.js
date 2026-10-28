// 外景：中轴广场、规则之泉、黑金哥特主楼外观、环形城墙与塔楼、远景巨城与河流、飞行器
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { placeModel, loadModel } from '../engine/assets.js';
import { mats } from './mats.js';
import { Frame, archRingGeo, archSolidGeo, archShape, archApex, lancetWindow, pinnacle, spire, tower, gableRoof, bayWall, flyingButtress, emblem, goldText } from './gothic.js';
import { waterMaterial, waterfallMaterial, bannerMaterial, CanvasScreen, time } from '../engine/fx.js';
import { content } from '../engine/content.js';

export const T = (n) => { if (window.__SHOT__) console.log('[NB]', n, (performance.now() / 1000).toFixed(1)); };
export const FLOOR = 1.8; // 主楼一层地坪
export const RING = { cx: 0, cz: -35, R: 118 };

export async function buildExterior(scene, world, ctx) {
  const M = mats();
  const g = new THREE.Group(); g.name = 'exterior'; scene.add(g);
  const b = new Batch();
  const jobs = [];
  const add = (p) => { jobs.push(p.then((o) => { g.add(o); return o; })); return p; };

  // ================= 地面 =================
  // 广场铺装（环形城墙内）
  const ground = new THREE.CircleGeometry(RING.R - 2, 96); ground.rotateX(-Math.PI / 2);
  b.add('paving', ground, { pos: [RING.cx, 0, RING.cz] }, { uv: 0.35, collide: true });
  // 中轴石材拼花大道
  b.box('plazaTile', 16, 0.06, 84, [0, 0.03, 38], { uv: 0.5 });
  for (const sx of [-1, 1]) { b.box('gold', 0.18, 0.07, 84, [sx * 8.1, 0.035, 38], { uv: 1 }); b.box('whiteMarble', 1.2, 0.065, 84, [sx * 7.3, 0.033, 38], { uv: 0.5 }); }
  for (let z = 0; z < 80; z += 4) b.box('gold', 14.4, 0.07, 0.08, [0, 0.036, z], { uv: 1 });
  // 环形拼花（喷泉外）
  for (const [r, w] of [[19, 1.4], [22, 0.6]]) { const ring = new THREE.RingGeometry(r - w / 2, r + w / 2, 128); ring.rotateX(-Math.PI / 2); b.add(r === 19 ? 'whiteMarble' : 'stoneDark', ring, { pos: [0, 0.04, 30] }, { uv: 0.5 }); }
  { const ring = new THREE.RingGeometry(20.3, 20.5, 128); ring.rotateX(-Math.PI / 2); b.add('gold', ring, { pos: [0, 0.05, 30] }, { uv: 1 }); }
  // 大地徽（南端）
  g.add(groundEmblem(M, [0, 0.06, 64], 9));
  // 绿篱花坛与草坪（两侧）
  for (const sx of [-1, 1]) {
    for (const [z0, z1] of [[2, 22], [38, 56], [60, 72]]) {
      const cx = sx * 30, cz = (z0 + z1) / 2, L = z1 - z0;
      b.box('grass', 18, 0.12, L, [cx, 0.06, cz], { uv: 0.3 });
      for (const ex of [-1, 1]) b.box('hedge', 0.9, 1.1, L, [cx + ex * 9, 0.55, cz], { uv: 0.6, collide: true });
      for (const ez of [-1, 1]) b.box('hedge', 18.9, 1.1, 0.9, [cx, 0.55, cz + ez * L / 2], { uv: 0.6, collide: true });
      // 花坛内低矮绿雕
      for (let k = 0; k < Math.floor(L / 6); k++) b.add('hedge', blob(1.1, k + cx), { pos: [cx, 0.9, z0 + 3 + k * 6], scale: [1, 0.8, 1] }, { uv: 0.8 });
    }
    // 柏树列
    for (let z = 0; z < 64; z += 7) cypress(b, sx * 42, z);
  }
  // 南端大台阶（下到迎宾大道 y=-4）
  for (let i = 0; i < 20; i++) b.box('plazaTile', 44, 0.2, 0.6, [0, -0.1 - i * 0.2, 81 + i * 0.6], { uv: 0.4, collide: true });
  world.ramp([0, -0.05, 80.6], [0, -4.05, 93], 44);
  b.box('paving', 300, 0.5, 400, [0, -4.25, 290], { uv: 0.2, collide: true });
  // 台阶两侧跌水
  for (const sx of [-1, 1]) {
    const al = Math.atan2(4, 12.6);
    b.add('stoneDark', new THREE.BoxGeometry(3.4, 0.8, 13.4), { pos: [sx * 23.7, -2.3, 86.9], rot: [al, 0, 0] }, { uv: 0.4 });
    for (const ex of [-1, 1]) b.add('stone', new THREE.BoxGeometry(0.4, 1.4, 13.4), { pos: [sx * 23.7 + ex * 1.7, -1.9, 86.9], rot: [al, 0, 0] }, { uv: 0.4 });
    const wg = new THREE.PlaneGeometry(2.8, 13.2, 1, 1); wg.rotateX(-Math.PI / 2);
    const wf = new THREE.Mesh(wg, waterfallMaterial()); wf.position.set(sx * 23.7, -1.84, 86.9); wf.rotation.x = al; g.add(wf);
  }

  T('ext ground');
  // ================= 规则之泉 =================
  buildFountain(b, g, M, world, ctx);

  // ================= 主楼正门台阶 =================
  for (let i = 0; i < 10; i++) b.box('blackMarble', 34 - i * 0.4, 0.18, 0.5, [0, 0.09 + i * 0.18, 0.6 - i * 0.5], { uv: 0.4, collide: true });
  b.box('blackMarble', 34, FLOOR, 5, [0, FLOOR / 2, -3], { uv: 0.4, collide: true });
  world.ramp([0, 0.0, 1.0], [0, FLOOR, -4.4], 30);

  T('ext fountain');
  // ================= 主楼外观 =================
  buildMainBuilding(b, g, M, world, ctx, add);

  T('ext building');
  // ================= 环形城墙 =================
  buildRingWall(b, g, M, world, ctx);

  T('ext wall');
  // ================= 广场陈设（GLB） =================
  for (const sx of [-1, 1]) for (let z = 6; z <= 76; z += 14) {
    add(placeModel('street_lamp_01', { height: 5.2, pos: [sx * 9.4, 0, z], rotY: sx > 0 ? -Math.PI / 2 : Math.PI / 2 }));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M.lampWarm); bulb.position.set(sx * 9.4, 4.75, z); g.add(bulb);
  }
  const benchZ = [10, 24, 44, 52, 68];
  benchZ.forEach((z, i) => { for (const sx of [-1, 1]) add(placeModel('park_bench', { width: 2.2, pos: [sx * 19.2, 0, z], rotY: sx > 0 ? -Math.PI / 2 : Math.PI / 2 }).then((o) => { world.boundsOf(o, 0.8); if (sx > 0 && i === 2) ctx.newspaperBench = o; return o; })); });
  for (let x = -20; x <= 20; x += 2.5) if (Math.abs(x) > 9) add(placeModel('bollard', { height: 0.95, pos: [x, 0, 78.5] }));
  for (const p of [[12, 46], [-12, 14], [5, 74], [-26, 30], [26, 30]]) add(placeModel('manhole', { width: 0.8, pos: [p[0], 0.02, p[1]] }));
  for (const sx of [-1, 1]) add(placeModel('planter', { height: 1.0, pos: [sx * 15.2, FLOOR, -3.2] }));
  // 旗杆阵列（12 面局旗）
  const flagTex = content.tex('tex_flag_bureau');
  const flagMat = bannerMaterial(flagTex ?? null, flagTex ? 0xffffff : 0x14244d);
  for (let i = 0; i < 12; i++) {
    const sx = i < 6 ? -1 : 1, k = i % 6;
    const x = sx * 14.5, z = 8 + k * 12;
    b.add('blackMarble', new THREE.CylinderGeometry(0.55, 0.65, 0.9, 8), { pos: [x, 0.45, z] }, { uv: 0.5, collide: true });
    b.add('gold', new THREE.CylinderGeometry(0.58, 0.58, 0.06, 8), { pos: [x, 0.92, z] }, { uv: 1 });
    b.add('iron', new THREE.CylinderGeometry(0.07, 0.11, 12, 10), { pos: [x, 6.9, z] }, { uv: 1 });
    b.add('iron', new THREE.BoxGeometry(2.3, 0.08, 0.08), { pos: [x, 11.5, z + 0.1] }, { uv: 1 });
    b.add('gold', new THREE.SphereGeometry(0.16, 10, 8), { pos: [x, 13.0, z] }, { uv: 1 });
    b.add('gold', new THREE.ConeGeometry(0.08, 0.6, 6), { pos: [x, 13.45, z] }, { uv: 1 });
    world.box(x, 6, z, 0.3, 12, 0.3);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.7, 10, 16), flagMat);
    fl.position.set(x + 0.02, 9.7, z + 0.95 * -sx * 0); fl.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; fl.position.z += 0; fl.position.x += 0; fl.castShadow = true;
    // 竖挂长旗：贴在横杆下
    fl.position.x = x + (sx > 0 ? -1.05 : 1.05) * 0; fl.position.set(x, 9.6, z + 0.14); fl.rotation.y = 0;
    g.add(fl);
    if (k === 3 && sx < 0) ctx.flag7 = fl;
  }
  // 写生老人与画架（泉池西北）
  g.add(painter(M, [-13.5, 0, 15.5], -0.6));
  world.box(-13.5, 0.7, 15.5, 1.6, 1.4, 1.6);
  ctx.painterPos = new THREE.Vector3(-13.5, 1.2, 15.5);
  // 户外 LED 倒计时屏（南端台阶上方右侧）
  const scr = new CanvasScreen(1024, 512, drawCountdown, { fps: 1, intensity: 1.4 });
  ctx.screens.push(scr);
  b.box('blackMetal', 0.5, 7, 0.5, [17, 3.5, 76], { uv: 1, collide: true });
  b.box('blackMetal', 8.6, 4.6, 0.5, [17, 6.6, 76], { uv: 0.5 });
  b.box('gold', 8.8, 0.12, 0.6, [17, 8.95, 76], { uv: 1 });
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), scr.mat); sm.position.set(17, 6.6, 75.74); sm.rotation.y = Math.PI; g.add(sm);
  ctx.countdownScreen = sm;

  T('ext props');
  // ================= 远景巨城 =================
  buildCity(g, M, ctx);

  T('ext city'); b.build(g, M); T('ext merged');
  for (const geo of b.colliders) world.addGeo(geo);
  await Promise.all(jobs); T('ext models');
  return g;
}

function blob(r, seed) {
  const g = new THREE.IcosahedronGeometry(r, 3); const p = g.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = Math.sin(v.x * 3.1 + seed) * Math.sin(v.y * 2.7 + seed * 2) * Math.sin(v.z * 3.3 + seed * 3); v.multiplyScalar(1 + n * 0.18 + (Math.random() - 0.5) * 0.06); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
function cypress(b, x, z) {
  const H = 8 + Math.random() * 2.5;
  for (let k = 0; k < 6; k++) { const t = k / 5; const r = 1.45 * (1 - t * 0.78); b.add('foliage', blob(r, x + z + k), { pos: [x + (Math.random() - 0.5) * 0.2, 1.2 + t * H, z + (Math.random() - 0.5) * 0.2], scale: [1, 1.5, 1] }, { uv: 0.8 }); }
  b.add('wood', new THREE.CylinderGeometry(0.2, 0.25, 1, 6), { pos: [x, 0.5, z] }, { uv: 1 });
}

function groundEmblem(M, pos, r) {
  const N = 1024, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const c = cv.getContext('2d'); c.translate(N / 2, N / 2);
  c.strokeStyle = '#fff'; c.fillStyle = '#fff';
  c.lineWidth = 22; c.beginPath(); c.arc(0, 0, N * 0.36, 0, Math.PI * 2); c.stroke();
  c.lineWidth = 8; c.beginPath(); c.arc(0, 0, N * 0.3, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; c.save(); c.rotate(a); c.fillRect(-3, -N * 0.355, 6, i % 4 ? 18 : 40); c.restore(); }
  const star = (R, ri, n, rot) => { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 + rot; const rr = i % 2 ? ri : R; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); };
  star(N * 0.48, N * 0.06, 4, -Math.PI / 2); star(N * 0.24, N * 0.04, 4, -Math.PI / 4);
  c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(0, -40); c.lineTo(28, 0); c.lineTo(0, 40); c.lineTo(-28, 0); c.fill();
  const t = new THREE.CanvasTexture(cv);
  const m = M.gold.clone(); m.alphaMap = t; m.alphaTest = 0.5; m.map = null; m.color.set(0xd8b070); m.roughness = 0.5; m.roughnessMap = null;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), m); mesh.rotation.x = -Math.PI / 2; mesh.position.set(...pos); mesh.receiveShadow = true;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r * 0.78, 64), M.stoneDark); disc.rotation.x = -Math.PI / 2; disc.position.set(pos[0], pos[1] - 0.01, pos[2]); disc.receiveShadow = true;
  const grp = new THREE.Group(); grp.add(disc, mesh); return grp;
}

function lawTileTexture() {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024; const c = cv.getContext('2d');
  c.fillStyle = '#1a140c'; c.fillRect(0, 0, 1024, 1024);
  const laws = ['第一条　叙事安全，人人有责', '第二条　凡畸变之物，应即上交', '第三条　禁止私自续写他人命运', '第四条　现实稳定度为国家安全指标', '第五条　叙事高考依法组织', '第六条　不得以文字伤人', '第八条　归档者之档号永久保留', '第九条　废稿不得流入人间'];
  c.font = '700 38px "NB Serif", serif'; c.textBaseline = 'middle';
  for (let i = 0; i < 16; i++) {
    const y = 32 + i * 64; c.fillStyle = i % 2 ? '#2a2014' : '#231a10'; c.fillRect(0, y - 30, 1024, 60);
    c.fillStyle = '#c9a052'; c.fillText(laws[i % laws.length], 40 + (i % 3) * 30, y);
    c.strokeStyle = '#0b0805'; c.lineWidth = 3; c.strokeRect(2, y - 30, 1020, 60);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function buildFountain(b, g, M, world, ctx) {
  const C = [0, 0, 30];
  const lathe = (pts, key) => { const geo = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), 96); b.add(key, geo, { pos: C }, { uv: 0.5 }); };
  // 一层池：外沿
  lathe([[13.2, 0], [14.4, 0.05], [14.6, 0.35], [14.4, 0.75], [14.9, 0.85], [14.9, 1.0], [13.6, 1.0], [13.4, 0.9], [13.4, 0.2]], 'blackMarble');
  { const r = new THREE.TorusGeometry(14.25, 0.05, 6, 160); r.rotateX(Math.PI / 2); b.add('gold', r, { pos: [C[0], 1.02, C[2]] }, { uv: 1 }); }
  { const r = new THREE.TorusGeometry(14.6, 0.04, 6, 160); r.rotateX(Math.PI / 2); b.add('gold', r, { pos: [C[0], 0.4, C[2]] }, { uv: 1 }); }
  // 池底铜字地砖
  const law = new THREE.Mesh(new THREE.CircleGeometry(13.4, 96), new THREE.MeshStandardMaterial({ map: lawTileTexture(), metalness: 0.7, roughness: 0.4, color: 0xffffff }));
  law.rotation.x = -Math.PI / 2; law.position.set(C[0], 0.12, C[2]); law.receiveShadow = true; g.add(law);
  ctx.lawFloor = law;
  // 水面
  const water = new THREE.Mesh(new THREE.RingGeometry(2.2, 13.45, 96, 1), waterMaterial()); water.rotation.x = -Math.PI / 2; water.position.set(C[0], 0.62, C[2]); water.material.opacity = 0.78; g.add(water);
  ctx.fountainWater = water;
  // 中央底座与二层盘
  lathe([[0, 0], [3.2, 0], [3.2, 0.9], [2.4, 1.2], [1.6, 1.4], [1.3, 2.4], [1.5, 3.0], [2.4, 3.3], [6.2, 3.55], [6.5, 3.9], [6.1, 4.05], [2.0, 3.9], [0, 3.9]], 'blackMarble');
  { const r = new THREE.TorusGeometry(6.38, 0.05, 6, 120); r.rotateX(Math.PI / 2); b.add('gold', r, { pos: [C[0], 3.95, C[2]] }, { uv: 1 }); }
  const w2 = new THREE.Mesh(new THREE.CircleGeometry(6.05, 64), waterMaterial()); w2.rotation.x = -Math.PI / 2; w2.position.set(C[0], 3.98, C[2]); g.add(w2);
  // 三层盘
  lathe([[0, 3.9], [1.0, 3.9], [0.7, 4.6], [0.7, 5.6], [1.1, 6.2], [3.0, 6.45], [3.2, 6.75], [2.9, 6.85], [0.9, 6.75], [0, 6.75]], 'blackMarble');
  { const r = new THREE.TorusGeometry(3.15, 0.04, 6, 90); r.rotateX(Math.PI / 2); b.add('gold', r, { pos: [C[0], 6.8, C[2]] }, { uv: 1 }); }
  const w3 = new THREE.Mesh(new THREE.CircleGeometry(2.9, 48), waterMaterial()); w3.rotation.x = -Math.PI / 2; w3.position.set(C[0], 6.8, C[2]); g.add(w3);
  // 水帘
  const wfm = waterfallMaterial();
  const s2 = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.9, 3.4, 96, 1, true), wfm); s2.position.set(C[0], 2.2, C[2]); g.add(s2);
  const s3 = new THREE.Mesh(new THREE.CylinderGeometry(3.22, 3.5, 2.85, 64, 1, true), wfm); s3.position.set(C[0], 5.4, C[2]); g.add(s3);
  // 四向喷水（从外沿射向中心）
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(Math.cos(a) * 13.2, 0.95, Math.sin(a) * 13.2), new THREE.Vector3(Math.cos(a) * 10, 3.6, Math.sin(a) * 10), new THREE.Vector3(Math.cos(a) * 7.2, 0.7, Math.sin(a) * 7.2));
    const jet = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.06, 6), wfm); jet.position.set(C[0], 0, C[2]); g.add(jet);
    b.add('gold', new THREE.SphereGeometry(0.14, 8, 6), { pos: [C[0] + Math.cos(a) * 13.3, 0.95, C[2] + Math.sin(a) * 13.3] }, { uv: 1 });
  }
  // 中央金色细尖塔（扫描尖塔，金属化）
  const goldSpire = M.goldBright;
  placeModel('spire', { height: 9.5, pos: [C[0], 6.75, C[2]], material: goldSpire }).then((o) => g.add(o));
  // 尖塔顶部罗盘
  const em = emblem(0.55, M.goldBright, M.navy); em.position.set(C[0], 16.9, C[2]); em.rotation.y = 0; g.add(em); ctx.fountainEmblem = em;
  // 铭牌（南侧）
  b.add('stoneDark', new THREE.BoxGeometry(1.6, 1.0, 0.5), { pos: [C[0], 0.5, C[2] + 15.4] }, { uv: 1, collide: true });
  b.add('brass', new THREE.BoxGeometry(1.4, 0.04, 0.6), { pos: [C[0], 1.02, C[2] + 15.4], rot: [-0.35, 0, 0] }, { uv: 1 });
  ctx.fountainPlaque = new THREE.Vector3(C[0], 1.0, C[2] + 15.4);
  // 碰撞：池沿
  world.addGeo(new THREE.CylinderGeometry(14.9, 14.9, 1.0, 48).translate(C[0], 0.5, C[2]));
  ctx.fountainCenter = new THREE.Vector3(...C);
}

// ---------------- 主楼 ----------------
function buildMainBuilding(b, g, M, world, ctx, add) {
  const Y = FLOOR;
  // —— 正立面中央门楼（x ±14，z -5…-30）——
  const front = new Frame([0, Y, -5], 0);
  // 门楼墙体（门洞两侧 + 门洞上方）
  const DW = 7, DH = 9; // 门洞宽高（矩形部分）
  b.add('stone', new THREE.BoxGeometry(14 - DW / 2, 40, 1.4), front.at(-(14 + DW / 2) / 2, 20, -0.7), { uv: 0.2, collide: true });
  b.add('stone', new THREE.BoxGeometry(14 - DW / 2, 40, 1.4), front.at((14 + DW / 2) / 2, 20, -0.7), { uv: 0.2, collide: true });
  b.add('stone', new THREE.BoxGeometry(DW, 40 - DH, 1.4), front.at(0, DH + (40 - DH) / 2, -0.7), { uv: 0.2 });
  // 门楼侧墙与后墙体量
  for (const sx of [-1, 1]) b.add('stone', new THREE.BoxGeometry(1.4, 40, 25), { pos: [sx * 14.7, Y + 20, -17.5] }, { uv: 0.2 });
  b.add('slate', new THREE.BoxGeometry(30.8, 0.6, 26), { pos: [0, Y + 40, -17.5] }, { uv: 0.2 });
  // 尖拱门券（6 重退缩）
  const hs = DH;
  for (let k = 0; k < 6; k++) {
    const wIn = DW + k * 1.15, wOut = wIn + 1.15;
    b.add(k % 2 ? 'stoneDark' : 'stone', archRingGeo(wOut, hs, wIn, hs, 0.62), front.at(0, 0, 0.32 + k * 0.6), { uv: 0.5 });
    b.add('gold', archRingGeo(wIn + 0.1, hs, wIn, hs, 0.66), front.at(0, 0, 0.32 + k * 0.6), { uv: 1 });
    // 门柱（每重一根，含柱头）
    for (const sx of [-1, 1]) {
      const x = sx * (wIn / 2 + 0.55);
      b.add('stoneDark', new THREE.CylinderGeometry(0.26, 0.3, hs, 12), front.at(x, hs / 2, 0.32 + k * 0.6), { uv: 0.5 });
      b.add('gold', new THREE.CylinderGeometry(0.36, 0.26, 0.4, 12), front.at(x, hs - 0.2, 0.32 + k * 0.6), { uv: 1 });
    }
  }
  const pW = DW + 6 * 1.15 + 1.15; const pDepth = 0.32 + 6 * 0.6;
  // 门楼两侧前凸墩柱
  for (const sx of [-1, 1]) {
    b.add('stone', new THREE.BoxGeometry(1.6, archApex(pW, hs) + 2, pDepth + 0.6), front.at(sx * (pW / 2 + 0.8), (archApex(pW, hs) + 2) / 2, pDepth / 2), { uv: 0.3, collide: true });
    pinnacle(b, front, sx * (pW / 2 + 0.8), archApex(pW, hs) + 2, pDepth / 2, 1.0);
  }
  // 门楣山花（wimperg）
  { const s = new THREE.Shape(); const hw = pW / 2 + 0.3; s.moveTo(-hw, 0); s.lineTo(0, 9); s.lineTo(hw, 0); s.lineTo(-hw, 0);
    const inner = new THREE.Path(); inner.moveTo(-hw + 1.4, 0.7); inner.lineTo(hw - 1.4, 0.7); inner.lineTo(0, 7.4); inner.lineTo(-hw + 1.4, 0.7); s.holes.push(inner);
    const gg = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false });
    b.add('stone', gg, front.at(0, archApex(pW, hs) - 3.2, pDepth - 0.2), { uv: 0.4 });
    // 山花金边
    const e1 = new THREE.Shape(); e1.moveTo(-hw - 0.1, -0.1); e1.lineTo(0, 9.15); e1.lineTo(hw + 0.1, -0.1); e1.lineTo(hw - 0.2, -0.1); e1.lineTo(0, 8.7); e1.lineTo(-hw + 0.2, -0.1);
    b.add('gold', new THREE.ExtrudeGeometry(e1, { depth: 0.56, bevelEnabled: false }), front.at(0, archApex(pW, hs) - 3.2, pDepth - 0.23), { uv: 1 });
    // 山花内金色小罗盘
    const em = emblem(1.1, M.gold, M.navy); em.position.set(0, Y + archApex(pW, hs) + 0.9, -5 + pDepth + 0.25); g.add(em);
    // 山花两斜边卷叶饰
    for (let k = 1; k < 9; k++) { const t = k / 9; for (const sx of [-1, 1]) b.add('stone', new THREE.ConeGeometry(0.14, 0.5, 4), front.at(sx * hw * (1 - t), archApex(pW, hs) - 3.2 + 9 * t + 0.25, pDepth), { uv: 1 }); }
    pinnacle(b, front, 0, archApex(pW, hs) - 3.2 + 8.6, pDepth, 0.5);
  }
  // 门洞内：鼓室（tympanum）与局徽浮雕
  b.add('stoneDark', archSolidGeo(DW, 0.01, 0.3), front.at(0, hs, 0.1), { uv: 0.4 });
  b.add('gold', new THREE.BoxGeometry(DW + 0.2, 0.25, 0.5), front.at(0, hs, 0.25), { uv: 1 });
  { const em = emblem(1.8, M.goldBright, M.navy); em.position.set(0, Y + hs + 2.6, -5 + 0.35); g.add(em); }
  // 敞开的大门门扇（深色木 + 铁箍 + 金色铆钉）
  for (const sx of [-1, 1]) {
    const leaf = new THREE.Group();
    const w = DW / 2, h = DH;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.28), M.doorWood); slab.position.set(sx * -w / 2, h / 2, 0); slab.castShadow = slab.receiveShadow = true; leaf.add(slab);
    for (let k = 0; k < 6; k++) { const strap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.14, 0.34), M.iron); strap.position.set(sx * -w / 2, 0.8 + k * 1.5, 0); leaf.add(strap); for (let r = 0; r < 6; r++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), M.gold); s.position.set(sx * -(0.25 + r * 0.6), 0.8 + k * 1.5, 0.18); leaf.add(s); } }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 6, 20), M.gold); ring.position.set(sx * -(w - 0.5), h * 0.45, 0.2); leaf.add(ring);
    leaf.position.set(sx * DW / 2, Y, -5.6); leaf.rotation.y = sx * -1.25; g.add(leaf);
  }
  // 门楼立面：文字带、局徽、上部尖窗、山墙
  const textBandY = 29.6;
  b.add('stoneDark', new THREE.BoxGeometry(17, 3.6, 0.5), front.at(0, textBandY, 0.2), { uv: 0.5 });
  b.add('gold', new THREE.BoxGeometry(17.4, 0.14, 0.6), front.at(0, textBandY + 1.85, 0.2), { uv: 1 });
  b.add('gold', new THREE.BoxGeometry(17.4, 0.14, 0.6), front.at(0, textBandY - 1.85, 0.2), { uv: 1 });
  const txt = goldText('叙事管理局', 15, 2.9, M.goldBright, { res: 256, spacing: 30 }); txt.position.set(0, Y + textBandY, -5 + 0.5); g.add(txt);
  const big = emblem(4.2, M.goldBright, M.navy); big.position.set(0, Y + 37, -5 + 0.5); g.add(big); ctx.facadeEmblem = big;
  b.add('stoneDark', new THREE.CylinderGeometry(5.3, 5.3, 0.3, 48), { pos: [0, Y + 37, -5 + 0.2], rot: [Math.PI / 2, 0, 0] }, { uv: 0.5 });
  lancetWindow(b, front, -9.2, 31.5, 0.05, 2.2, 8.5);
  lancetWindow(b, front, 9.2, 31.5, 0.05, 2.2, 8.5);
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) lancetWindow(b, front, sx * (4 + k * 2.6), 1.5 + 9.6, 0.05, 1.4, 5.2, { tracery: false });
  // 门楼顶部山墙
  { const s = new THREE.Shape(); s.moveTo(-14.7, 0); s.lineTo(0, 13); s.lineTo(14.7, 0); s.lineTo(-14.7, 0);
    b.add('stone', new THREE.ExtrudeGeometry(s, { depth: 1.4, bevelEnabled: false }), front.at(0, 40, -1.4), { uv: 0.25 });
    const e1 = new THREE.Shape(); e1.moveTo(-15, -0.1); e1.lineTo(0, 13.25); e1.lineTo(15, -0.1); e1.lineTo(14.4, -0.1); e1.lineTo(0, 12.6); e1.lineTo(-14.4, -0.1);
    b.add('gold', new THREE.ExtrudeGeometry(e1, { depth: 1.5, bevelEnabled: false }), front.at(0, 40, -1.42), { uv: 1 });
    lancetWindow(b, front, -2.2, 43.2, 0.05, 1.5, 5.4); lancetWindow(b, front, 2.2, 43.2, 0.05, 1.5, 5.4); lancetWindow(b, front, 0, 44, 0.05, 1.6, 6.2);
    pinnacle(b, front, 0, 52.6, -0.7, 0.9);
    gableRoof(b, 0, Y + 40, -18.5, 29.4, 27, 13);
  }
  // 门楼两侧小尖塔列
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) pinnacle(b, front, sx * (14 - k * 0.01), 40, -0.7, 0.8);

  // —— 正面双塔（x ±22）——
  const towerBanner = (ff, w) => {
    const fm = bannerMaterial(content.tex('tex_flag_bureau'), content.tex('tex_flag_bureau') ? 0xffffff : 0x14244d);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 13, 6, 18), fm);
    fl.applyMatrix4(ff.at(0, 30, w / 2 + 0.35)); fl.castShadow = true; g.add(fl);
  };
  for (const sx of [-1, 1]) {
    tower(b, sx * 22, -13, 13, 60, { y0: Y, spireH: 44, banner: (ff, w) => { if (Math.abs(ff.m.elements[8]) < 0.1 && ff.m.elements[10] > 0.5) towerBanner(ff, w); } });
    world.box(sx * 22, Y + 30, -13, 15, 60, 15);
  }
  // —— 次塔（x ±36）——
  for (const sx of [-1, 1]) { tower(b, sx * 36, -12, 8, 42, { y0: Y, spireH: 26, levels: 3 }); world.box(sx * 36, Y + 20, -12, 9.5, 40, 9.5); }

  // —— 两翼（x ±29…±62，z -8…-80，高 22）——
  const WH = 22;
  for (const sx of [-1, 1]) {
    // 正面（两塔之间与外侧）
    bayWall(b, new Frame([sx * 51, Y, -8], 0), 22, WH, 4, { collide: true, twoTier: true });
    b.add('stone', new THREE.BoxGeometry(8, WH, 2), { pos: [sx * 31.5, Y + WH / 2, -9] }, { uv: 0.2, collide: true });
    // 外侧立面
    bayWall(b, new Frame([sx * 62, Y, -44], sx * Math.PI / 2), 72, WH, 9, { collide: true, twoTier: true });
    // 屋顶
    b.add('slate', new THREE.BoxGeometry(44, 0.6, 72), { pos: [sx * 40, Y + WH, -44] }, { uv: 0.2 });
    gableRoof(b, sx * 51, Y + WH, -44, 20, 72, 9, { dormers: 0 });
    gableRoof(b, sx * 29, Y + WH, -44, 20, 72, 7);
    // 飞扶壁（翼楼屋顶上的墩柱 → 中殿高侧窗墙）
    for (let k = 0; k < 5; k++) {
      const z = -39 - k * 8;
      const pierX = sx * 25;
      b.add('stone', new THREE.BoxGeometry(1.4, 9, 1.4), { pos: [pierX, Y + WH + 4.5, z] }, { uv: 0.3 });
      pinnacle(b, new Frame([pierX, Y + WH + 9, z], 0), 0, 0, 0, 0.6);
      flyingButtress(b, new Frame([pierX, 0, z], sx > 0 ? Math.PI : 0), 6.4, Y + WH + 2, Y + 33, 0.6);
    }
  }
  // —— 中殿（x ±18，z -30…-80，墙高 36）——
  const NH = 36;
  for (const sx of [-1, 1]) {
    const f = new Frame([sx * 18.6, Y, -55], sx * Math.PI / 2);
    // 高侧窗段（翼楼屋顶以上）
    b.add('stone', new THREE.BoxGeometry(50, NH, 1.2), f.at(0, NH / 2, -0.6), { uv: 0.2 });
    for (let k = 0; k < 6; k++) lancetWindow(b, f, -20 + k * 8, WH + 2.5, 0.05, 3.2, 10);
    b.add('gold', new THREE.BoxGeometry(50, 0.14, 0.14), f.at(0, WH + 1.6, 0.07), { uv: 1 });
    b.add('stone', new THREE.BoxGeometry(50.4, 0.6, 0.8), f.at(0, NH - 0.3, 0.2), { uv: 0.5 });
  }
  gableRoof(b, 0, Y + NH, -55, 37.2, 50, 15, { dormers: 3 });
  // 中殿屋顶小尖塔（交叉处）
  { const f = new Frame([0, Y + NH + 15, -38], 0); b.add('stone', new THREE.CylinderGeometry(2.2, 2.6, 6, 8), f.at(0, 3, 0), { uv: 0.4 }); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; lancetWindow(b, new Frame([Math.cos(a) * 2.3, Y + NH + 15, -38 + Math.sin(a) * 2.3], -a + Math.PI / 2), 0, 1.2, 0, 0.7, 3, { tracery: false, gold: false }); } spire(b, f, 0, 6, 0, 2.4, 16, { lucarnes: false }); }
  // —— 后楼（z -80…-120，x ±62，高 28）——
  const RH = 28;
  bayWall(b, new Frame([0, Y, -120], Math.PI), 124, RH, 14, { collide: true, twoTier: true });
  for (const sx of [-1, 1]) bayWall(b, new Frame([sx * 62, Y, -100], sx * Math.PI / 2), 40, RH, 5, { collide: true, twoTier: true });
  b.add('slate', new THREE.BoxGeometry(124, 0.6, 40), { pos: [0, Y + RH, -100] }, { uv: 0.2 });
  for (const sx of [-1, 1]) gableRoof(b, sx * 40, Y + RH, -100, 40, 38, 10, { yaw: Math.PI / 2 });
  // 后楼正面在中庭以上露出的部分（翼楼屋顶之上）
  for (const sx of [-1, 1]) bayWall(b, new Frame([sx * 40, Y + WH, -80], 0), 44, RH - WH, 5, { pinnacles: true });
  // —— 主塔（中央，z -96，宽 28，高 96）——
  tower(b, 0, -98, 28, 96, { y0: Y, spireH: 74, levels: 6 });
  // 主塔南面巨型局徽
  const te = emblem(6.5, M.goldBright, M.navy); te.position.set(0, Y + 80, -98 + 14 + 0.6); g.add(te);
  b.add('stoneDark', new THREE.CylinderGeometry(8, 8, 0.4, 48), { pos: [0, Y + 80, -98 + 14 + 0.2], rot: [Math.PI / 2, 0, 0] }, { uv: 0.5 });
  // 主塔四角高耸副尖塔
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = new Frame([sx * 16.5, Y + 96, -98 + sz * 16.5], 0); b.add('stone', new THREE.CylinderGeometry(1.8, 2.0, 10, 8), f.at(0, 5, 0), { uv: 0.4 }); spire(b, f, 0, 10, 0, 2.0, 22, { lucarnes: false, bands: [0, 0.5] }); }
  // —— 立面雕像（门券两侧壁龛）——
  for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) {
    const x = sx * (pW / 2 + 2.6 + k * 2.6);
    b.add('stoneDark', archRingGeo(2.0, 2.6, 1.6, 2.6, 0.5), front.at(x, 2.0, 0.25), { uv: 0.5 });
    b.add('stone', new THREE.BoxGeometry(1.6, 0.5, 0.9), front.at(x, 1.75, 0.6), { uv: 0.5 });
    add(placeModel('gothic_statue', { height: 2.5, pos: [x, Y + 2.0, -5 + 0.5], rotY: 0 }));
  }
  // 门楼台阶两侧狮首
  for (const sx of [-1, 1]) { b.box('stone', 1.6, 2.2, 6.5, [sx * 17.8, 1.1, -1.6], { uv: 0.4, collide: true }); b.box('gold', 1.7, 0.12, 6.6, [sx * 17.8, 2.2, -1.6], { uv: 1 }); add(placeModel('lion_head', { height: 0.9, pos: [sx * 17.8, 2.26, 1.0] })); }
  // 门洞内碰撞补充（门扇不阻挡）
  ctx.doorZ = -5;
}

// ---------------- 环形城墙 ----------------
function buildRingWall(b, g, M, world, ctx) {
  const { cx, cz, R } = RING;
  const H = 16, T = 7;
  const gap = THREE.MathUtils.degToRad(16);
  const seg = 72;
  const P = (a, r = R) => [cx + Math.sin(a) * r, cz + Math.cos(a) * r];
  const TA = (k) => 26 + k * (308 / 11);
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    if (am < gap || am > Math.PI * 2 - gap) continue;
    const len = 2 * R * Math.sin((a1 - a0) / 2) + 0.4;
    const [x, z] = P(am);
    const yaw = am + Math.PI / 2;
    const f = new Frame([x, 0, z], yaw);
    // 6–8 号塔之间加厚（无 7 号塔）
    const thick = (am > THREE.MathUtils.degToRad(TA(5) + 4) && am < THREE.MathUtils.degToRad(TA(7) - 4)) ? T * 1.6 : T;
    b.add('stone', new THREE.BoxGeometry(len, H, thick), f.at(0, H / 2, 0), { uv: 0.2, collide: true });
    // 外侧盲尖拱与金腰线
    b.add('gold', new THREE.BoxGeometry(len, 0.16, 0.16), f.at(0, H * 0.62, -thick / 2 - 0.06), { uv: 1 });
    b.add('gold', new THREE.BoxGeometry(len, 0.16, 0.16), f.at(0, H * 0.62, thick / 2 + 0.06), { uv: 1 });
    b.add('stoneDark', new THREE.ShapeGeometry(archShape(len * 0.5, H * 0.3)), f.at(0, 2, thick / 2 + 0.02), { uv: 0.5 });
    // 雉堞（两侧）
    for (const side of [-1, 1]) for (let k = 0; k < 3; k++) b.add('stone', new THREE.BoxGeometry(len / 3 * 0.55, 1.6, 0.8), f.at(-len / 2 + (len / 3) * (k + 0.5), H + 0.8, side * (thick / 2 - 0.4)), { uv: 0.5 });
  }
  // 塔楼：每 30°，编号 1–12，无 7 号
  const towers = [];
  for (let k = 0; k < 12; k++) {
    const num = k + 1;
    const a = THREE.MathUtils.degToRad(TA(k));
    if (num === 7) continue;
    const [x, z] = P(a);
    towers.push({ num, x, z });
    tower(b, x, z, 11, 26, { y0: 0, spireH: 26, levels: 2, yaw: a });
    world.box(x, 13, z, 12, 26, 12, a);
  }
  // 南门门楼（两座）
  for (const sx of [-1, 1]) { const [x, z] = P(sx * gap + (sx < 0 ? Math.PI * 2 : 0)); tower(b, x, z, 10, 22, { y0: 0, spireH: 18, levels: 2 }); world.box(x, 11, z, 11, 22, 11); }
  ctx.wallTowers = towers;
}

// ---------------- 远景巨城 ----------------
function buildCity(g, M, ctx) {
  // 城市地面与河流
  const land = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ color: 0x24242a, roughness: 0.95 }));
  land.rotation.x = -Math.PI / 2; land.position.y = -4.4; land.receiveShadow = false; g.add(land);
  const riverMat = waterMaterial(0x23384a); riverMat.opacity = 1; riverMat.transparent = false; riverMat.envMapIntensity = 1.8;
  const riverShape = new THREE.Shape();
  const rp = []; for (let i = 0; i <= 60; i++) { const t = i / 60; rp.push(new THREE.Vector2(-3500 + 7000 * t, -520 + Math.sin(t * 7) * 160 + t * 300)); }
  riverShape.moveTo(rp[0].x, rp[0].y - 90); rp.forEach((p) => riverShape.lineTo(p.x, p.y - 90)); for (let i = rp.length - 1; i >= 0; i--) riverShape.lineTo(rp[i].x, rp[i].y + 90);
  const river = new THREE.Mesh(new THREE.ShapeGeometry(riverShape, 4), riverMat); river.rotation.x = -Math.PI / 2; river.position.y = -4.2; river.scale.y = -1; g.add(river);
  // 第二条河（东侧南北向）
  const r2 = new THREE.Mesh(new THREE.PlaneGeometry(150, 6000), riverMat); r2.rotation.x = -Math.PI / 2; r2.position.set(620, -4.25, 0); g.add(r2);
  // 楼群：哥特低模剪影（暗色石体 + 随机亮灯的尖窗 + 四坡尖顶 + 细尖塔），远处由天空盒雾融入生图天空盒
  const rnd = mulberry(7);
  const riverDist = (x, z) => { const t = (x + 3500) / 7000; const rz = -(-520 + Math.sin(t * 7) * 160 + t * 300); return Math.min(Math.abs(z - rz), Math.abs(x - 620)); };
  const winShader = (sh, lit = 0.32) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp; varying vec3 vOn; varying float vSeed;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvec4 nbw = vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nnbw = instanceMatrix * nbw;\n#endif\nvWp = (modelMatrix * nbw).xyz; vOn = normal; vSeed = 0.0;\n#ifdef USE_INSTANCING\nvSeed = instanceMatrix[3].x * 0.013 + instanceMatrix[3].z * 0.007;\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp; varying vec3 vOn; varying float vSeed;\nfloat hh(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5);}')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float sideX = step(0.5, abs(vOn.x)); vec2 wp = sideX > 0.5 ? vWp.zy : vWp.xy;
          float wall = 1.0 - step(0.5, abs(vOn.y));
          vec2 cs = vec2(2.6, 4.2); vec2 cell = floor(wp / cs); vec2 f = fract(wp / cs);
          // 尖拱窗：矩形 + 顶部收尖
          float ax = abs(f.x - 0.5);
          float win = step(ax, 0.17) * step(0.18, f.y) * step(f.y, 0.62 + (0.17 - ax) * 1.1);
          float on = step(1.0 - ${lit.toFixed(2)}, hh(cell + vSeed * 31.0));
          float band = step(0.5, fract(cell.y * 0.21 + vSeed)); // 整层亮/暗，像办公楼层
          float k = win * wall * on * mix(0.55, 1.0, band) * smoothstep(2.0, 8.0, vWp.y);
          vec3 wc = mix(vec3(1.0, 0.62, 0.30), vec3(1.0, 0.82, 0.55), hh(cell * 1.7));
          totalEmissiveRadiance += wc * k * 2.4;
          diffuseColor.rgb *= 1.0 - win * wall * 0.6;
          // 竖向石肋与层间腰线（法线不变，只做明暗）
          diffuseColor.rgb *= 0.85 + 0.15 * step(0.08, fract(wp.y / 12.6)) ;
        }`);
  };
  const stoneCity = new THREE.MeshStandardMaterial({ color: 0x2a2b31, roughness: 0.72, metalness: 0.15, envMapIntensity: 0.6 });
  stoneCity.onBeforeCompile = (sh) => winShader(sh, 0.3);
  const roofCity = new THREE.MeshStandardMaterial({ color: 0x1c1d24, roughness: 0.42, metalness: 0.55, envMapIntensity: 0.9 });
  const goldCity = new THREE.MeshStandardMaterial({ color: 0xd8a850, roughness: 0.3, metalness: 1, emissive: 0x6a4410, emissiveIntensity: 0.4 });
  const boxG = new THREE.BoxGeometry(1, 1, 1); boxG.translate(0, 0.5, 0);
  const roofG = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1); roofG.rotateY(Math.PI / 4); roofG.translate(0, 0.5, 0);
  const spireG = new THREE.ConeGeometry(1, 1, 8, 1); spireG.translate(0, 0.5, 0);
  const tipG = new THREE.CylinderGeometry(0.08, 0.08, 1, 4); tipG.translate(0, 0.5, 0);
  const N = 1500, NS = 520;
  const bodies = new THREE.InstancedMesh(boxG, stoneCity, N + NS);
  const roofs = new THREE.InstancedMesh(roofG, roofCity, N);
  const spires = new THREE.InstancedMesh(spireG, roofCity, NS * 5);
  const tips = new THREE.InstancedMesh(tipG, goldCity, NS);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  let nb = 0, nr = 0, ns = 0, nt = 0;
  const place = (x, z) => riverDist(x, z) > 100 && !(Math.abs(x) < 70 && z > 90 && z < 1600);
  // 街区：沿环形放射路网排列（比随机撒点更像城市肌理）
  while (nb < N) {
    const a = rnd() * Math.PI * 2, r = 175 + Math.pow(rnd(), 0.85) * 1500;
    const x = Math.sin(a) * r, z = -35 + Math.cos(a) * r; if (!place(x, z)) continue;
    const near = r < 450;
    const h = (14 + Math.pow(rnd(), 1.8) * (near ? 34 : 60)) * (rnd() < 0.06 ? 2.2 : 1);
    const w = 16 + rnd() * 22, d = 16 + rnd() * 22; q.setFromAxisAngle(up, a + (rnd() < 0.5 ? 0 : Math.PI / 2));
    m4.compose(new THREE.Vector3(x, -4.4, z), q, new THREE.Vector3(w, h, d)); bodies.setMatrixAt(nb++, m4);
    const rh = Math.min(w, d) * (0.55 + rnd() * 0.5);
    m4.compose(new THREE.Vector3(x, -4.4 + h, z), q, new THREE.Vector3(w, rh, d)); roofs.setMatrixAt(nr++, m4);
  }
  // 尖塔楼：细高主体 + 主尖塔 + 四角小尖塔 + 金色塔尖
  for (let i = 0; i < NS; i++) {
    const a = rnd() * Math.PI * 2, r = 200 + Math.pow(rnd(), 0.8) * 1500;
    const x = Math.sin(a) * r, z = -35 + Math.cos(a) * r; if (!place(x, z)) { i--; continue; }
    const big = rnd() < 0.12;
    const bw = (big ? 22 : 9) + rnd() * 8, bh = (big ? 70 : 30) + rnd() * (big ? 70 : 50);
    const sh = bw * (big ? 3.4 : 2.6) * (0.8 + rnd() * 0.5);
    q.setFromAxisAngle(up, rnd() * Math.PI);
    m4.compose(new THREE.Vector3(x, -4.4, z), q, new THREE.Vector3(bw, bh, bw)); bodies.setMatrixAt(nb++, m4);
    m4.compose(new THREE.Vector3(x, -4.4 + bh, z), q, new THREE.Vector3(bw * 0.5, sh, bw * 0.5)); spires.setMatrixAt(ns++, m4);
    for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const v = new THREE.Vector3(ox * bw * 0.42, 0, oz * bw * 0.42).applyQuaternion(q);
      m4.compose(new THREE.Vector3(x + v.x, -4.4 + bh, z + v.z), q, new THREE.Vector3(bw * 0.09, sh * 0.32, bw * 0.09)); spires.setMatrixAt(ns++, m4);
    }
    m4.compose(new THREE.Vector3(x, -4.4 + bh + sh * 0.98, z), q, new THREE.Vector3(1.2, sh * 0.12 + 2, 1.2)); tips.setMatrixAt(nt++, m4);
  }
  for (const im of [bodies, roofs, spires, tips]) { im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere?.(); g.add(im); }
  ctx.cityMats = { stoneCity };
  loadModel('cathedral').then((src) => {
    const spots = [[-420, -640, 0.4], [520, -900, 2.1], [-900, 300, 1.2], [880, 260, -0.6], [-260, -1300, 0.9], [1300, -500, 3.0], [-1500, -600, 2.4], [300, 900, 0.2]];
    for (const [x, z, yaw] of spots) {
      const o = src.clone(true); const w = new THREE.Group(); w.add(o);
      o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o); const s = 110 / (bb.max.y - bb.min.y); o.scale.setScalar(s);
      o.updateMatrixWorld(true); bb.setFromObject(o); const c = bb.getCenter(new THREE.Vector3()); o.position.set(-c.x, -bb.min.y, -c.z);
      w.position.set(x, -4.4, z); w.rotation.y = yaw; w.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } }); g.add(w);
    }
  });
  // 跨河大桥
  for (const bx of [-900, 0, 900]) { const t = (bx + 3500) / 7000; const rz = -(-520 + Math.sin(t * 7) * 160 + t * 300); const br = new THREE.Mesh(new THREE.BoxGeometry(30, 3, 260), new THREE.MeshStandardMaterial({ color: 0x4a4c52, roughness: 0.7 })); br.position.set(bx, 2, rz); g.add(br); }
  // 飞行器
  ctx.aircraft = [];
  for (let i = 0; i < 9; i++) {
    const ac = aircraft(M, i < 3 ? 1.6 : 1.0);
    const r = i < 3 ? 260 + i * 80 : 600 + rnd() * 1400; const h = i < 3 ? 120 + i * 30 : 140 + rnd() * 260; const sp2 = (i % 2 ? 1 : -1) * (0.02 + rnd() * 0.03) * (i < 3 ? 1 : 0.6); const ph = rnd() * 6.28;
    g.add(ac); ctx.aircraft.push({ o: ac, r, h, sp: sp2, ph });
  }
}

function aircraft(M, s) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.6, 11, 6, 12), M.navy); body.rotation.z = Math.PI / 2; g.add(body);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 16), M.slate); wing.position.x = -1; g.add(wing);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(3, 3.2, 0.25), M.slate); fin.position.set(-6, 1.8, 0); g.add(fin);
  for (const sz of [-1, 1]) { const eng = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.0, 16), M.blackMetal); eng.position.set(-1, 0.4, sz * 7); g.add(eng); }
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(12, 0.25, 0.1), M.goldBright); stripe.position.set(0, 0, 1.62); g.add(stripe);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3030 })); light.position.set(-1, 0.2, 8.2); g.add(light);
  g.scale.setScalar(s);
  return g;
}

function painter(M, pos, yaw) {
  const g = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({ color: 0x2b2a30, roughness: 0.85 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xb08a72, roughness: 0.7 });
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 12), M.wood); stool.position.y = 0.48; g.add(stool);
  for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5), M.iron); const a = (i / 3) * Math.PI * 2; l.position.set(Math.cos(a) * 0.15, 0.24, Math.sin(a) * 0.15); g.add(l); }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 4, 10), coat); torso.position.set(0, 0.88, 0); torso.rotation.x = 0.18; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), skin); head.position.set(0, 1.28, 0.06); g.add(head);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 14), coat); hat.position.set(0, 1.39, 0.06); g.add(hat);
  for (const sx of [-1, 1]) {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.32, 4, 8), coat); thigh.rotation.x = Math.PI / 2; thigh.position.set(sx * 0.1, 0.55, 0.18); g.add(thigh);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.36, 4, 8), coat); shin.position.set(sx * 0.1, 0.28, 0.36); g.add(shin);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.4, 4, 8), coat); arm.position.set(sx * 0.25, 0.9, 0.16); arm.rotation.x = -0.9; g.add(arm);
  }
  // 画架与画板
  const easel = new THREE.Group();
  for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.6, 0.03), M.wood); leg.position.set(sx * 0.3, 0.8, 0); leg.rotation.z = sx * 0.1; easel.add(leg); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.5, 0.03), M.wood); back.position.set(0, 0.75, -0.3); back.rotation.x = -0.25; easel.add(back);
  const tex = content.tex('tex_painter_canvas');
  const canvas = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.02), new THREE.MeshStandardMaterial({ color: 0xf0eadc, map: tex ?? sketchTexture(), roughness: 0.9 }));
  canvas.position.set(0, 1.25, 0.03); canvas.rotation.x = -0.1; easel.add(canvas);
  easel.position.set(0, 0, 0.75); easel.rotation.y = Math.PI; g.add(easel);
  g.position.set(...pos); g.rotation.y = yaw;
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
function sketchTexture() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 320; const c = cv.getContext('2d');
  c.fillStyle = '#efe7d6'; c.fillRect(0, 0, 256, 320); c.strokeStyle = '#3a3530'; c.lineWidth = 1.5;
  const sp = [40, 70, 100, 128, 156, 186, 216];
  sp.forEach((x, i) => { const h = i === 3 ? 230 : 120 + (i % 3) * 30; c.beginPath(); c.moveTo(x - 10, 300); c.lineTo(x - 10, 300 - h * 0.6); c.lineTo(x, 300 - h); c.lineTo(x + 10, 300 - h * 0.6); c.lineTo(x + 10, 300); c.stroke(); });
  c.beginPath(); c.moveTo(10, 300); c.lineTo(246, 300); c.stroke();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function drawCountdown(c, t, W, H) {
  const target = Date.UTC(2027, 5, 7, 1, 0, 0);
  const days = Math.max(0, Math.ceil((target - Date.now()) / 86400000));
  c.fillStyle = '#03060c'; c.fillRect(0, 0, W, H);
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#0d1d44'); g.addColorStop(1, '#050a18'); c.fillStyle = g; c.fillRect(0, 0, W, 96);
  c.fillStyle = '#e8c87a'; c.font = '700 48px "NB Serif", serif'; c.textAlign = 'left'; c.fillText('叙事管理局 · 公告', 36, 66);
  c.fillStyle = '#cfd8ea'; c.font = '700 54px "NB Serif", serif'; c.fillText('距 2027 全国叙事高考', 36, 200);
  c.fillStyle = '#ffd36e'; c.font = '700 190px "NB Serif", serif'; c.textAlign = 'right'; c.fillText(String(days), W - 190, 400);
  c.fillStyle = '#cfd8ea'; c.font = '700 70px "NB Serif", serif'; c.fillText('天', W - 70, 400);
  c.textAlign = 'left'; c.fillStyle = '#7f8db0'; c.font = '30px "NB Sans", sans-serif'; c.fillText('京城 · 现实稳定度 97.3%　叙事污染指数 37 良', 36, 480);
}

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function updateExterior(ctx, dt, t) {
  for (const a of ctx.aircraft ?? []) {
    const ang = a.ph + t * a.sp;
    a.o.position.set(Math.sin(ang) * a.r, a.h, -35 + Math.cos(ang) * a.r);
    a.o.rotation.y = ang + (a.sp > 0 ? Math.PI : 0);
  }
  if (ctx.fountainEmblem) ctx.fountainEmblem.rotation.y = t * 0.3;
}
