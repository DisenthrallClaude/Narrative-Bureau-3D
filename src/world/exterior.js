// 外景：中轴广场、规则之泉、黑金哥特主楼外观、环形城墙与塔楼、远景巨城与河流、飞行器
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TOD } from '../engine/tod.js';
import { Batch } from '../engine/batch.js';
import { placeModel, loadModel, pbr } from '../engine/assets.js';
import { mats } from './mats.js';
import { Frame, archRingGeo, archSolidGeo, archShape, archApex, lancetWindow, pinnacle, spire, tower, gableRoof, bayWall, flyingButtress, emblem, goldText } from './gothic.js';
import { waterMaterial, waterfallMaterial, bannerMaterial, CanvasScreen, time } from '../engine/fx.js';
import { content } from '../engine/content.js';
import { placeHero, phMat } from './hero.js';
import { weather } from '../engine/weather.js';
export const HERO = !new URLSearchParams(location.search).has('legacy'); // R2：主楼外观改用 Blender 精修 GLB（?legacy 回到旧版程序化外观对比）

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
  b.add('paving', ground, { pos: [RING.cx, HERO ? -0.01 : 0, RING.cz] }, { uv: 1 / 3, collide: true });
  if (HERO) jobs.push(placeHero(g, world, './assets/hero/hero_plaza.glb'));
  if (!HERO) {
  // 中轴石材拼花大道
  b.box('plazaTile', 16, 0.06, 84, [0, 0.03, 38], { uv: 0.5 });
  for (const sx of [-1, 1]) { b.box('gold', 0.18, 0.07, 84, [sx * 8.1, 0.035, 38], { uv: 1 }); b.box('whiteMarble', 1.2, 0.065, 84, [sx * 7.3, 0.033, 38], { uv: 0.5 }); }
  for (let z = 0; z < 80; z += 4) b.box('gold', 14.4, 0.07, 0.08, [0, 0.036, z], { uv: 1 });
  // 环形拼花（喷泉外）
  for (const [r, w] of [[19, 1.4], [22, 0.6]]) { const ring = new THREE.RingGeometry(r - w / 2, r + w / 2, 128); ring.rotateX(-Math.PI / 2); b.add(r === 19 ? 'whiteMarble' : 'stoneDark', ring, { pos: [0, 0.04, 30] }, { uv: 0.5 }); }
  { const ring = new THREE.RingGeometry(20.3, 20.5, 128); ring.rotateX(-Math.PI / 2); b.add('gold', ring, { pos: [0, 0.05, 30] }, { uv: 1 }); }
  // M4：喷泉外黑白石材放射拼花（三圈错位扇形 + 金线圈），中轴大道菱形黑石嵌花，窨井盖
  for (const [r0, r1, n, off] of [[13.7, 15.3, 32, 0], [15.3, 16.9, 48, 0.5], [16.9, 18.25, 64, 0]]) {
    for (let k = 0; k < n; k++) { const g2 = new THREE.RingGeometry(r0, r1, 3, 1, ((k + off) / n) * Math.PI * 2, (Math.PI * 2) / n); g2.rotateX(-Math.PI / 2); b.add(k % 2 ? 'whiteMarble' : 'stoneDark', g2, { pos: [0, 0.066, 30] }, { uv: 0.5 }); }
    const gr = new THREE.RingGeometry(r1 - 0.05, r1 + 0.05, 128); gr.rotateX(-Math.PI / 2); b.add('gold', gr, { pos: [0, 0.071, 30] }, { uv: 1 });
  }
  for (let z = 2; z < 80; z += 4) { if (Math.abs(z - 30) < 19) continue; const d = new THREE.PlaneGeometry(2.2, 2.2); d.rotateX(-Math.PI / 2); d.rotateY(Math.PI / 4); b.add('stoneDark', d, { pos: [0, 0.062, z + 2] }, { uv: 0.5 }); const d2 = new THREE.PlaneGeometry(1.1, 1.1); d2.rotateX(-Math.PI / 2); d2.rotateY(Math.PI / 4); b.add('whiteMarble', d2, { pos: [0, 0.064, z + 2] }, { uv: 0.5 }); for (const sx of [-1, 1]) { const d3 = new THREE.PlaneGeometry(0.9, 0.9); d3.rotateX(-Math.PI / 2); d3.rotateY(Math.PI / 4); b.add('stoneDark', d3, { pos: [sx * 4.5, 0.062, z + 2] }, { uv: 0.5 }); } }
  }
  for (const [x, z] of [[-12, 8], [12, 8], [-12, 52], [12, 52]]) add(placeModel('manhole', { width: 1.0, pos: [x, HERO ? 0.035 : 0.03, z] }));
  // 大地徽（南端）
  g.add(groundEmblem(M, [0, 0.06, 64], 9));
  // 绿篱花坛与草坪（两侧）
  if (!HERO) for (const sx of [-1, 1]) {
    for (const [z0, z1] of [[2, 22], [38, 56], [60, 72]]) {
      const cx = sx * 30, cz = (z0 + z1) / 2, L = z1 - z0;
      b.box('grass', 18, 0.12, L, [cx, 0.06, cz], { uv: 0.3 });
      for (const ex of [-1, 1]) b.box('hedge', 0.9, 1.1, L, [cx + ex * 9, 0.55, cz], { uv: 0.6, collide: true });
      for (const ez of [-1, 1]) b.box('hedge', 18.9, 1.1, 0.9, [cx, 0.55, cz + ez * L / 2], { uv: 0.6, collide: true });
      // 花坛内低矮绿雕
      for (let k = 0; k < Math.floor(L / 6); k++) b.add('hedge', blob(1.1, k + cx), { pos: [cx, 0.9, z0 + 3 + k * 6], scale: [1, 0.8, 1] }, { uv: 0.8 });
    }
  }
  for (const sx of [-1, 1]) for (let z = 0; z < 64; z += 7) { if (Math.hypot(sx * 42 + 47.3, z - 62.1) < 9) continue; cypress(b, sx * 42, z); } // 柏树列（批次10：十二号塔岗哨门前两株挡门 → 去掉）
  // 南端大台阶（下到迎宾大道 y=-4）
  for (let i = 0; i < 20; i++) { if (HERO) world.box(0, -0.1 - i * 0.2, 81 + i * 0.6, 44, 0.2, 0.6); else b.box('plazaTile', 44, 0.2, 0.6, [0, -0.1 - i * 0.2, 81 + i * 0.6], { uv: 0.4, collide: true }); }
  world.ramp([0, -0.05, 80.6], [0, -4.05, 93], 44);
  // 批次39 ★根因：原整块 300×400 弹石箱顶面在 y −4.0，比墙外环路 / 人行道 / 路缘（Y0 −4.4，顶 −4.34 / −4.2 / −4.16）和街心绿地（−4.32）高 0.4 m，
  //   把 |x|<150、z>90 的 R160 / R245 / R305 南段全部埋住 → 人视角满眼弹石。改：迎宾大道台地只留大道本身（|x|≤25、z 93–175，顶 −4.0，surface.js Y=−4 不动），
  //   其余墙外地坪降到环路基面 −4.40（路面 / 人行道 / 路缘都在它之上分层），台地边缘花岗岩压顶 + 隐形坡道接环路。
  b.box('paving', 50, 0.5, 82, [0, -4.25, 134], { uv: 0.2, collide: true });
  for (const sx of [-1, 1]) { b.box('stone', 0.5, 0.5, 82.5, [sx * 25.2, -4.17, 134], { uv: 0.5 }); b.box('stone', 0.56, 0.06, 82.5, [sx * 25.2, -3.9, 134], { uv: 0.5 }); world.ramp([sx * 31, -4.4, 123], [sx * 25.4, -3.88, 123], 22); }
  b.box('stone', 50.9, 0.5, 0.5, [0, -4.17, 175.2], { uv: 0.5 }); b.box('stone', 50.9, 0.06, 0.56, [0, -3.9, 175.2], { uv: 0.5 });
  b.box('paving', 300, 0.1, 400, [0, -4.45, 290], { uv: 0.2, collide: true });
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
  if (HERO) buildFrontSteps(g, world); // 批次48：原 hero_facade 烘焙的光滑深色大理石踏步只露出前 3 级、其后是 1.26 m 高的平台立面（ext_door_near 下 1/4 一整条深褐带）→ 10 级踏步整体前移到平台前沿外（z 4.5…−0.5），花岗岩分缝板 + 前沿圆角线脚 + 双道铜防滑条 + 花岗岩压顶 + 两侧阶梯式石栏墙
  else { for (let i = 0; i < 10; i++) b.box('blackMarble', 34 - i * 0.4, 0.18, 0.5, [0, 0.09 + i * 0.18, 0.6 - i * 0.5], { uv: 0.4, collide: true });
  b.box('blackMarble', 34, FLOOR, 5, [0, FLOOR / 2, -3], { uv: 0.4, collide: true }); }
  if (HERO) world.ramp([0, 0.0, 4.6], [0, FLOOR, -0.5], 30); else world.ramp([0, 0.0, 1.0], [0, FLOOR, -4.4], 30);

  T('ext fountain');
  // ================= 主楼外观 =================
  if (HERO) jobs.push(heroFacade(g, M, world, ctx, add)); else buildMainBuilding(b, g, M, world, ctx, add);

  T('ext building');
  // ================= 环形城墙 =================
  buildRingWall(b, g, M, world, ctx);

  T('ext wall');
  // ================= 广场陈设（GLB） =================
  for (const sx of [-1, 1]) for (let z = 6; z <= 76; z += 14) {
    if (HERO) add(placeModel('r2/victorian_street_lamp', { height: 5.4, pos: [sx * 10.0, 0.04, z], rotY: sx > 0 ? -Math.PI / 2 : Math.PI / 2 }));
    else { add(placeModel('street_lamp_01', { height: 5.2, pos: [sx * 9.4, 0, z], rotY: sx > 0 ? -Math.PI / 2 : Math.PI / 2 }));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M.lampWarm); bulb.position.set(sx * 9.4, 4.75, z); g.add(bulb); }
  }
  const benchZ = [10, 24, 44, 52, 68];
  benchZ.forEach((z, i) => { for (const sx of [-1, 1]) add(placeModel(HERO ? 'r2/fancy_bench' : 'park_bench', { width: 2.2, pos: [sx * 19.6, HERO ? 0.09 : 0, z], rotY: sx > 0 ? -Math.PI / 2 : Math.PI / 2 }).then((o) => { world.boundsOf(o, 0.8); if (sx > 0 && i === 2) ctx.newspaperBench = o; return o; })); });
  for (let x = -20; x <= 20; x += 2.5) if (Math.abs(x) > 9) add(placeModel('bollard', { height: 0.95, pos: [x, 0, 78.5] }));
  for (const p of [[12, 46], [-12, 14], [5, 74], [-26, 30], [26, 30]]) add(placeModel('manhole', { width: 0.8, pos: [p[0], 0.02, p[1]] }));
  for (const sx of [-1, 1]) add(placeModel('planter', { height: 1.0, pos: [sx * 15.2, FLOOR, -3.2] }));
  // 旗杆阵列（12 面局旗）
  const flagTex = content.tex('tex_flag_bureau');
  const flagMat = bannerMaterial(flagTex ?? null, flagTex ? 0xffffff : 0x14244d);
  for (let i = 0; i < 12; i++) {
    const sx = i < 6 ? -1 : 1, k = i % 6;
    const x = sx * 14.5, z = 8 + k * 12;
    if (!HERO) { b.add('blackMarble', new THREE.CylinderGeometry(0.55, 0.65, 0.9, 8), { pos: [x, 0.45, z] }, { uv: 0.5 });
    b.add('gold', new THREE.CylinderGeometry(0.58, 0.58, 0.06, 8), { pos: [x, 0.92, z] }, { uv: 1 }); }
    b.add('iron', new THREE.CylinderGeometry(0.07, 0.11, 12, 10), { pos: [x, HERO ? 7.05 : 6.9, z] }, { uv: 1 });
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

  T('ext city'); b.build(g, M); jobs.push(flushTopiary(b, g, M)); T('ext merged');
  for (const geo of b.colliders) world.addGeo(geo);
  await Promise.all(jobs); T('ext models');
  return g;
}

export function blob(r, seed) {
  const g = new THREE.IcosahedronGeometry(r, 3); const p = g.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = Math.sin(v.x * 3.1 + seed) * Math.sin(v.y * 2.7 + seed * 2) * Math.sin(v.z * 3.3 + seed * 3); v.multiplyScalar(1 + n * 0.18 + (Math.random() - 0.5) * 0.06); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
// 批次27 E1：原 cypress() = 6 个噪声 icosa 球叠成的低模“绿团”→ 改为 Blender 精建「花岗岩花箱 + 修剪圆锥侧柏」（tools/blender/topiary_planter.py → r2/topiary_planter），
// 先记点、b.build 之后由 flushTopiary 一次性实例化（每材质 1 个 InstancedMesh）；叶面换 M.hedge（叶片贴图 + 法线）。
export function cypress(b, x, z, h = 3.4, y = 0) { (b._topi ??= []).push([x, z, h, y]); }
export async function flushTopiary(b, parent, M) {
  const pts = b._topi ?? []; b._topi = []; if (!pts.length) return;
  const src = await loadModel('r2/topiary_planter'); src.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(src); const H0 = bb.max.y - bb.min.y || 1; const mm = new THREE.Matrix4(), sm = new THREE.Matrix4();
  src.traverse((o) => { if (!o.isMesh) return;
    const geo = o.geometry.clone().applyMatrix4(o.matrixWorld); geo.translate(0, -bb.min.y, 0);
    const leaf = /hedge/.test(o.material?.name ?? ''); const mat = leaf ? M.hedge : o.material;
    if (leaf && geo.attributes.uv) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * 3); }
    const im = new THREE.InstancedMesh(geo, mat, pts.length); im.castShadow = true; im.receiveShadow = true;
    pts.forEach(([x, z, h, y], i) => { const s = h / H0; im.setMatrixAt(i, mm.makeTranslation(x, y, z).multiply(sm.makeRotationY((i * 1.7) % 6.283)).multiply(new THREE.Matrix4().makeScale(s, s, s))); });
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.name = 'topiary'; parent.add(im); });
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
  // 批次13（用户 23:05）：地徽底盘原用 M.stoneDark（抛光黑大理石 env 1.0）在广场把蓝天整片映成蓝色圆盘，很违和 → 暗铜褐哑光花岗岩，低环境反射
  const discMat = pbr('Marble016', { rn: true, color: 0x3b332b, roughness: 0.78, env: 0.18, repeat: [5, 5] });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r * 0.78, 64), discMat); disc.rotation.x = -Math.PI / 2; disc.position.set(pos[0], pos[1] - 0.01, pos[2]); disc.receiveShadow = true;
  const grp = new THREE.Group(); grp.add(disc, mesh); return grp;
}

function lawTileTexture() {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024; const c = cv.getContext('2d');
  c.fillStyle = '#1a140c'; c.fillRect(0, 0, 1024, 1024);
  const laws = ['第一条　叙事安全，人人有责', '第二条　凡畸变之物，应即上交', '第三条　禁止私自续写他人命运', '第四条　现实稳定度为国家安全指标', '第五条　叙事高考依法组织', '第六条　不得以文字伤人', '第八条　归档者之档号永久保留', '第九条　废稿不得流入人间'];
  c.font = '900 38px \"NB Title\", \"NB Serif\", serif'; c.textBaseline = 'middle';
  for (let i = 0; i < 16; i++) {
    const y = 32 + i * 64; c.fillStyle = i % 2 ? '#2a2014' : '#231a10'; c.fillRect(0, y - 30, 1024, 60);
    c.fillStyle = '#c9a052'; c.fillText(laws[i % laws.length], 40 + (i % 3) * 30, y);
    c.strokeStyle = '#0b0805'; c.lineWidth = 3; c.strokeRect(2, y - 30, 1020, 60);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function buildFountain(b, g, M, world, ctx) {
  const C = [0, 0, 30];
  const lathe = (pts, key) => { if (HERO) return; const geo = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), 96); b.add(key, geo, { pos: C }, { uv: 0.5 }); }; // R2：石作在 hero_plaza.glb
  // 一层池：外沿
  lathe([[13.2, 0], [14.4, 0.05], [14.6, 0.35], [14.4, 0.75], [14.9, 0.85], [14.9, 1.0], [13.6, 1.0], [13.4, 0.9], [13.4, 0.2]], 'blackMarble');
  if (!HERO) {
  { const r = new THREE.TorusGeometry(14.25, 0.05, 6, 160); r.rotateX(Math.PI / 2); b.add('gold', r, { pos: [C[0], 1.02, C[2]] }, { uv: 1 }); }
  { const r = new THREE.TorusGeometry(14.6, 0.04, 6, 160); r.rotateX(Math.PI / 2); b.add('gold', r, { pos: [C[0], 0.4, C[2]] }, { uv: 1 }); }
  }
  // 池底铜字地砖
  const law = new THREE.Mesh(new THREE.CircleGeometry(13.4, 96), new THREE.MeshStandardMaterial({ map: lawTileTexture(), metalness: 0.7, roughness: 0.4, color: 0xffffff }));
  law.rotation.x = -Math.PI / 2; law.position.set(C[0], 0.12, C[2]); law.receiveShadow = true; g.add(law);
  ctx.lawFloor = law;
  // 水面
  const water = new THREE.Mesh(new THREE.RingGeometry(2.2, 13.45, 96, 1), waterMaterial()); water.rotation.x = -Math.PI / 2; water.position.set(C[0], 0.62, C[2]); water.material.opacity = 0.78; g.add(water);
  ctx.fountainWater = water;
  // 中央底座与二层盘
  lathe([[0, 0], [3.2, 0], [3.2, 0.9], [2.4, 1.2], [1.6, 1.4], [1.3, 2.4], [1.5, 3.0], [2.4, 3.3], [6.2, 3.55], [6.5, 3.9], [6.1, 4.05], [2.0, 3.9], [0, 3.9]], 'blackMarble');
  if (!HERO) {
  { const r = new THREE.TorusGeometry(6.38, 0.05, 6, 120); r.rotateX(Math.PI / 2); b.add('gold', r, { pos: [C[0], 3.95, C[2]] }, { uv: 1 }); }
  }
  const w2 = new THREE.Mesh(new THREE.CircleGeometry(6.05, 64), waterMaterial()); w2.rotation.x = -Math.PI / 2; w2.position.set(C[0], HERO ? 3.8 : 3.98, C[2]); g.add(w2);
  // 三层盘
  lathe([[0, 3.9], [1.0, 3.9], [0.7, 4.6], [0.7, 5.6], [1.1, 6.2], [3.0, 6.45], [3.2, 6.75], [2.9, 6.85], [0.9, 6.75], [0, 6.75]], 'blackMarble');
  if (!HERO) {
  { const r = new THREE.TorusGeometry(3.15, 0.04, 6, 90); r.rotateX(Math.PI / 2); b.add('gold', r, { pos: [C[0], 6.8, C[2]] }, { uv: 1 }); }
  }
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
  if (!HERO) {
  b.add('stoneDark', new THREE.BoxGeometry(1.6, 1.0, 0.5), { pos: [C[0], 0.5, C[2] + 15.4] }, { uv: 1, collide: true });
  }
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
    // M5：删去山花顶尖顶（曾穿过招牌「管」字）
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
    // M4：门扇分格（2 列 × 4 行凸起镶板 + 金边框 + 三道铁箍），双面
    for (const fz of [-1, 1]) {
      for (let c = 0; c < 2; c++) for (let r = 0; r < 4; r++) { const pw = w * 0.38, ph = r === 3 ? 1.9 : 1.55, px = sx * -(w * 0.27 + c * w * 0.46), py = 0.9 + r * 1.95 + ph / 2; const pnl = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.06), M.wood); pnl.position.set(px, py, fz * 0.16); leaf.add(pnl); const fr = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.12, ph + 0.12, 0.03), M.brass); fr.position.set(px, py, fz * 0.145); leaf.add(fr); }
      for (const k of [0, 2, 4]) { const strap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.12, 0.05), M.iron); strap.position.set(sx * -w / 2, 0.55 + k * 1.95, fz * 0.17); leaf.add(strap); for (let r = 0; r < 5; r++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 4), M.gold); st.position.set(sx * -(0.3 + r * 0.7), 0.55 + k * 1.95, fz * 0.2); leaf.add(st); } }
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 6, 20), M.gold); ring.position.set(sx * -(w - 0.5), h * 0.45, 0.2); leaf.add(ring);
    leaf.position.set(sx * DW / 2, Y, -5.6); leaf.rotation.y = sx * -1.25; g.add(leaf);
  }
  // 门楼立面：文字带、局徽、上部尖窗、山墙
  const textBandY = 31.2; // M5：上移 1.6 m，让门洞山花顶点不再顶进文字带
  b.add('stoneDark', new THREE.BoxGeometry(17, 3.6, 0.5), front.at(0, textBandY, 0.2), { uv: 0.5 });
  b.add('gold', new THREE.BoxGeometry(17.4, 0.14, 0.6), front.at(0, textBandY + 1.85, 0.2), { uv: 1 });
  b.add('gold', new THREE.BoxGeometry(17.4, 0.14, 0.6), front.at(0, textBandY - 1.85, 0.2), { uv: 1 });
  const txt = goldText('叙事管理局', 15, 2.9, M.goldBright, { res: 512, spacing: 60 }); txt.position.set(0, Y + textBandY, -5 + 0.5); g.add(txt);
  const big = emblem(3.8, M.goldBright, M.navy); big.position.set(0, Y + 37.8, -5 + 0.5); g.add(big); ctx.facadeEmblem = big; big.traverse((o) => { o.userData.noCull = true; }); // 批次9：玫瑰窗中心局徽半径 1.05 m 被 DistCull（r<1.5 → 60 m）剔掉，plaza 主机位看不到金色窗花中心
  b.add('stoneDark', new THREE.CylinderGeometry(4.75, 4.75, 0.3, 48), { pos: [0, Y + 37.8, -5 + 0.2], rot: [Math.PI / 2, 0, 0] }, { uv: 0.5 });
  lancetWindow(b, front, -10.0, 31.5, 0.42, 2.2, 8.5);
  lancetWindow(b, front, 10.0, 31.5, 0.42, 2.2, 8.5);
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) lancetWindow(b, front, sx * (4 + k * 2.6), 1.5 + 9.6, 0.42, 1.4, 5.2);
  // 门楼顶部山墙
  { const s = new THREE.Shape(); s.moveTo(-14.7, 0); s.lineTo(0, 13); s.lineTo(14.7, 0); s.lineTo(-14.7, 0);
    b.add('stone', new THREE.ExtrudeGeometry(s, { depth: 1.4, bevelEnabled: false }), front.at(0, 40, -1.4), { uv: 0.25 });
    const e1 = new THREE.Shape(); e1.moveTo(-15, -0.1); e1.lineTo(0, 13.25); e1.lineTo(15, -0.1); e1.lineTo(14.4, -0.1); e1.lineTo(0, 12.6); e1.lineTo(-14.4, -0.1);
    b.add('gold', new THREE.ExtrudeGeometry(e1, { depth: 1.5, bevelEnabled: false }), front.at(0, 40, -1.42), { uv: 1 });
    lancetWindow(b, front, -2.2, 43.2, 0.42, 1.5, 5.4); lancetWindow(b, front, 2.2, 43.2, 0.42, 1.5, 5.4); lancetWindow(b, front, 0, 44, 0.42, 1.6, 6.2);
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
    for (let k = 0; k < 6; k++) lancetWindow(b, f, -20 + k * 8, WH + 2.5, 0.42, 3.2, 10);
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
  // M4：主塔加高约 40% 并分三段收分（方塔 → 收分方塔 → 八角灯笼亭 → 尖顶），让主塔压倒两侧塔群
  tower(b, 0, -98, 28, 92, { y0: Y, spire: false, levels: 6 });
  tower(b, 0, -98, 21, 30, { y0: Y + 92, spire: false, levels: 2, collide: false });
  { const f = new Frame([0, Y + 122, -98], 0); const r = 8.6, hh = 16;
    b.add('stone', new THREE.CylinderGeometry(r, r * 1.05, hh, 8), f.at(0, hh / 2, 0, [0, Math.PI / 8, 0]), { uv: 0.3 });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; lancetWindow(b, new Frame([Math.cos(a) * r * 0.93, Y + 122, -98 + Math.sin(a) * r * 0.93], -a + Math.PI / 2), 0, 2.5, 0, 2.2, 10, { tracery: true }); const fp = new Frame([Math.cos(a + Math.PI / 8) * r * 1.02, Y + 122, -98 + Math.sin(a + Math.PI / 8) * r * 1.02], 0); b.add('stone', new THREE.BoxGeometry(1.0, hh, 1.0), fp.at(0, hh / 2, 0), { uv: 0.4 }); spire(b, fp, 0, hh, 0, 0.75, 7, { lucarnes: false, bands: [0] }); }
    for (const yy of [0.2, hh]) b.add('gold', new THREE.CylinderGeometry(r * 1.07, r * 1.07, 0.25, 8, 1, true), f.at(0, yy, 0, [0, Math.PI / 8, 0]), { uv: 1 });
    spire(b, f, 0, hh, 0, r * 0.92, 108, { bands: [0, 0.22, 0.45, 0.66, 0.84] }); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = new Frame([sx * 11.8, Y + 122, -98 + sz * 11.8], 0); b.add('stone', new THREE.CylinderGeometry(1.3, 1.5, 6, 8), f.at(0, 3, 0), { uv: 0.4 }); spire(b, f, 0, 6, 0, 1.5, 20, { lucarnes: false, bands: [0, 0.5] }); }
  // 主塔南面巨型局徽
  const te = emblem(6.5, M.goldBright, M.navy); te.position.set(0, Y + 80, -98 + 14 + 0.6); g.add(te);
  b.add('stoneDark', new THREE.CylinderGeometry(8, 8, 0.4, 48), { pos: [0, Y + 80, -98 + 14 + 0.2], rot: [Math.PI / 2, 0, 0] }, { uv: 0.5 });
  // 主塔四角高耸副尖塔
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = new Frame([sx * 16.5, Y + 92, -98 + sz * 16.5], 0); b.add('stone', new THREE.CylinderGeometry(1.8, 2.0, 10, 8), f.at(0, 5, 0), { uv: 0.4 }); spire(b, f, 0, 10, 0, 2.0, 22, { lucarnes: false, bands: [0, 0.5] }); }
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
  // 批次27 E4/E8：立面洗墙灯 / 投光（黄昏）——广场前沿地埋灯 ×6 上照立面，双塔各 1 盏远投光打尖塔；暖白 3000K，不投影
  { const fix = new THREE.MeshStandardMaterial({ color: 0x2a2620, metalness: 0.8, roughness: 0.4 }), lens = new THREE.MeshStandardMaterial({ color: 0xffe2b8, emissive: 0xffd49a, emissiveIntensity: 2.5 });
    const dusk = TOD.label !== '白昼', k = dusk ? 1 : 0.25;
    const spot = (p, t, i, ang) => { const l = new THREE.SpotLight(0xffd7a8, i * k, 90, ang, 0.65, 1.6); l.position.set(...p); l.target.position.set(...t); l.castShadow = false; g.add(l, l.target); };
    for (const x of [-27, -15.5, -6.2, 6.2, 15.5, 27]) { // 地埋灯：石框 + 铜面 + 发光透镜，前沿 z 4.2（台阶外），对准立面 30 m 高处
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.5), fix); f.position.set(x, 0.04, 5.6); g.add(f);
      const ln = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.3), lens); ln.position.set(x, 0.09, 5.6); g.add(ln);
      spot([x, 0.3, 5.6], [x * 0.92, Y + 17, -8], 1550, 0.56); } // 批次49：下半立面再提一档——1250 → 1550、锥角 0.5 → 0.56、对准 Y+20 → Y+17（光池下移覆盖门廊雕像列与一层窗台） // 批次48：台阶前移到 z 4.5 → 地埋灯退到 5.6；对准点 Y+26 → Y+20、锥角 0.42 → 0.5，让下半立面也进光池（ext_plaza 下半立面发黑）
    // 批次48：下半立面补光——实体铜投光器 ×4：台阶两侧石栏端墩顶（打门洞两侧墩柱 / 雕像列）+ 双塔脚石座前沿（贴墙掠射塔身下段），暖 2900K，不投影
    const proj = (p, t, i, ang) => { const h = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.34, 14), fix); body.rotation.x = Math.PI / 2; h.add(body);
      const le = new THREE.Mesh(new THREE.CircleGeometry(0.12, 14), lens); le.position.z = 0.175; h.add(le); const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.12), fix); yoke.position.y = -0.2; h.add(yoke);
      h.position.set(...p); h.lookAt(...t); g.add(h); spot([p[0], p[1], p[2]], t, i * 1, ang); };
    for (const sx of [-1, 1]) { proj([sx * 17.6, 1.62, 5.1], [sx * 7.5, Y + 8, -4.5], 1250, 0.48); proj([sx * 22, 2.4, -5.9], [sx * 22, Y + 14, -8], 1000, 0.62); /* 批次49：投光器 900/700 → 1250/1000，锥角放宽（洗墙覆盖到塔脚两侧开间），不加灯数（外景渲染时长） */ }
    for (const sx of [-1, 1]) spot([sx * 30, 0.4, 36], [sx * 22, Y + 52, -13], 2600, 0.16); // 尖塔投光（广场两侧路灯列外的灯座处）
    spot([0, 0.4, 24], [0, Y + 36, -5], 1200, 0.13); // 玫瑰窗 / 局徽
  }
  ctx.doorZ = -5;
}


// ---------------- 批次48 正门台阶 + 平台（花岗岩分缝） ----------------
// 10 级 0.18 × 0.5：踏步 i 踏面顶 y=0.18(i+1)，前沿 z=4.5−0.5i；第 10 级即平台前沿压顶（z 0…−0.5），平台 z −0.5…−5.5。
// 每级：暗色灰缝底芯（退 4 cm）+ 踢面石板（约 1.4 m 一块，1.2 cm 缝）+ 踏面石板（6 cm 厚、前挑 5 cm）+ 前沿圆角线脚 + 两道铜防滑条（按板分段）。
function buildFrontSteps(g, world) {
  const b = new Batch();
  const gm = (c, r) => weather(pbr('Granite003A', { color: c, roughness: r, env: 0.6, normalScale: 0.9 }), { macro: 0.14, dust: 0.18, grime: 0.25, ground: 0.4, rough: 0.12 });
  const MT = { tread: gm(0xb0a798, 0.72), riser: gm(0x938b7f, 0.8), coping: gm(0xc4baa8, 0.62), cheek: gm(0xa29a8d, 0.78), joint: new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: 1 }), nosing: mats().brassNosing };
  const W = 34, X0 = -W / 2, gap = 0.012, T = 0.06, SL = 1.4;
  const segs = (off) => { const out = []; let x = X0; const first = off ? SL / 2 : SL; let w = first; while (x < -X0 - 1e-3) { const e = Math.min(-X0, x + w); out.push([x, e]); x = e; w = SL; } return out; };
  for (let i = 0; i < 10; i++) {
    const yt = 0.18 * (i + 1), yb = 0.18 * i, zf = 4.5 - 0.5 * i, last = i === 9;
    world.box(0, yt / 2, zf - 0.25, W, yt, 0.5);
    b.box('joint', W, yt - T, 0.5, [0, (yt - T) / 2, zf - 0.04 - 0.25]);
    for (const [a, e] of segs(i % 2)) {
      const w = e - a - gap, cx = (a + e) / 2;
      b.box('riser', w, yt - T - yb, 0.04, [cx, yb + (yt - T - yb) / 2, zf - 0.03], { uv: 0.5 });
      const key = last ? 'coping' : 'tread', d = last ? 0.6 : 0.55, th = last ? 0.12 : T;
      b.box(key, w, th, d, [cx, yt - th / 2, zf + 0.02 - d / 2], { uv: 0.5 });
      if (!last) for (const dz of [0.05, 0.1]) b.box('nosing', w - 0.16, 0.006, 0.022, [cx, yt + 0.003, zf - dz], { uv: 1 });
    }
    const nose = new THREE.CylinderGeometry(last ? 0.06 : 0.03, last ? 0.06 : 0.03, W, 10); nose.rotateZ(Math.PI / 2);
    b.add(last ? 'coping' : 'tread', nose, { pos: [0, yt - (last ? 0.06 : 0.03), zf + 0.02] }, { uv: 0.5 });
  }
  // 平台：灰缝底芯 + 1.2 m 方板错缝铺装（z −0.5…−5.5）
  b.box('joint', W, 1.78, 5.0, [0, 0.89, -3.0]);
  for (let r = 0; r < 4; r++) { const z0 = -0.6 - r * 1.225, z1 = z0 - 1.225; for (const [a, e] of segs(r % 2)) b.box('tread', e - a - gap, 0.04, z0 - z1 - gap, [(a + e) / 2, 1.78 + 0.02, (z0 + z1) / 2], { uv: 0.5 }); }
  // 两侧阶梯式石栏墙（x ±17…±18.2，z 4.5…1.8 接狮座）+ 端头方墩 + 压顶
  for (const sx of [-1, 1]) {
    const xc = sx * 17.6;
    for (let i = 0; i < 6; i++) { const yt = 0.18 * (i + 1), zf = 4.5 - 0.5 * i, top = yt + 0.85, d = i === 5 ? 0.3 : 0.5;
      b.box('cheek', 1.2, top - 0.1, d, [xc, (top - 0.1) / 2, zf - d / 2], { uv: 0.5 });
      b.box('coping', 1.34, 0.1, d + 0.02, [xc, top - 0.05, zf - d / 2], { uv: 0.5 }); }
    b.box('cheek', 1.5, 1.3, 1.5, [xc, 0.65, 5.1], { uv: 0.5 });
    b.box('coping', 1.66, 0.12, 1.66, [xc, 1.36, 5.1], { uv: 0.5 });
    b.box('coping', 1.62, 0.1, 1.62, [xc, 0.05, 5.1], { uv: 0.5 });
    world.box(xc, 0.6, 3.1, 1.2, 1.2, 3.4);
  }
  world.box(0, FLOOR / 2, -3, W, FLOOR, 5);
  b.build(g, MT);
}

// ---------------- R2 精修主楼（tools/blender/facade.py → hero_facade.glb）----------------
async function heroFacade(g, M, world, ctx, add) {
  const Y = FLOOR;
  // R3 批次8：远景 LOD（tools/facade_lod.mjs，Permissive 塌边 2.6M → 0.32M 面）；hi/lo 各自子组，main.js 切块后按格切换
  const gHi = new THREE.Group(); gHi.name = 'facade_hi'; const gLo = new THREE.Group(); gLo.name = 'facade_lo'; g.add(gHi, gLo); ctx.facadeLod = { hi: gHi, lo: gLo };
  await Promise.all([placeHero(gHi, world, './assets/hero/hero_facade.glb', { hide: ['steps'] }), placeHero(gLo, null, './assets/hero/hero_facade_lo.glb', { col: false, hide: ['steps'] })]);
  facadeBounce(gHi, gLo, Y); facadeTroughs(g, Y); // 批次50：下半立面暖反弹光（广场铺地被地埋灯 / 投光照亮后回弹到石墙下段），让远景下半立面石材纹理可读
  // 门洞内：敞开的大门门扇——批次30 看 ext_door_near：原深色木 + 亮铜框读成「棕木板 + 霓虹描边」→ 暗古铜门扇 + 浅一档铜芯板 + 哑光铜框 + 铁箍铜泡钉
  const DW = 7, DH = 9;
  for (const sx of [-1, 1]) {
    const leaf = new THREE.Group(); const w = DW / 2, h = DH;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.28), M.bronzeDoor); slab.position.set(sx * -w / 2, h / 2, 0); slab.castShadow = slab.receiveShadow = true; leaf.add(slab);
    for (const fz of [-1, 1]) {
      for (let c = 0; c < 2; c++) for (let r = 0; r < 4; r++) { const pw = w * 0.38, ph = r === 3 ? 1.9 : 1.55, px = sx * -(w * 0.27 + c * w * 0.46), py = 0.9 + r * 1.95 + ph / 2; const pnl = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.06), M.bronzePanel); pnl.position.set(px, py, fz * 0.16); leaf.add(pnl); const fr = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.12, ph + 0.12, 0.03), M.bronzeFrame); fr.position.set(px, py, fz * 0.145); leaf.add(fr); }
      for (const k of [0, 2, 4]) { const strap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.12, 0.05), M.iron); strap.position.set(sx * -w / 2, 0.55 + k * 1.95, fz * 0.17); leaf.add(strap); for (let r = 0; r < 5; r++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 6), M.bronzePanel); st.position.set(sx * -(0.3 + r * 0.7), 0.55 + k * 1.95, fz * 0.2); leaf.add(st); } }
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 24), M.gold); ring.position.set(sx * -(w - 0.5), h * 0.45, 0.2); leaf.add(ring);
    leaf.position.set(sx * DW / 2, Y, -6.2); leaf.rotation.y = sx * -1.25; g.add(leaf);
  }
  innerVestibuleDoors(g, M, Y); // 批次49：门洞纵深——门厅尽头内门（铜饰胡桃木门半开）+ 门厅暖光渐变
  // 文字带「叙事管理局」（黑色抛光石板上的鎏金字）
  const txt = goldText('叙事管理局', 15, 2.9, M.goldBright, { res: 512, spacing: 60 }); txt.position.set(0, Y + 31.2, -4.99); g.add(txt);
  // 玫瑰窗中心局徽、鼓室局徽
  const big = emblem(1.05, M.goldBright, M.navy); big.position.set(0, Y + 37.6, -5.35); g.add(big); ctx.facadeEmblem = big; big.traverse((o) => { o.userData.noCull = true; }); // 批次9：玫瑰窗中心局徽半径 1.05 m 被 DistCull（r<1.5 → 60 m）剔掉，plaza 主机位看不到金色窗花中心
  { const em = emblem(1.7, M.goldBright, M.navy); em.position.set(0, Y + DH + 2.4, -5.25); g.add(em); em.traverse((o) => { o.userData.noCull = true; }); }
  // 雕像：门洞五重退缩券的门柱托座（每侧 5 尊）、列王廊 11 龛、门廊墩柱壁龛、两侧盲龛
  for (let k = 1; k <= 5; k++) { const wi = DW + k, yk = -k * 0.55; for (const sx of [-1, 1]) add(placeModel('gothic_statue', { height: 2.55, pos: [sx * (wi / 2 - 0.22), Y + 2.36, -5 - (yk - 0.17)], rotY: sx * -0.35 })); }
  for (let i = 0; i < 11; i++) add(placeModel('gothic_statue', { height: 3.0, pos: [-14 + 1.27 + i * 2.546, Y + 18.71, -5.3] }));
  for (const sx of [-1, 1]) { add(placeModel('gothic_statue', { height: 2.3, pos: [sx * 7.0, Y + 3.55, -1.5] })); for (const k of [0, 1]) add(placeModel('gothic_statue', { height: 2.5, pos: [sx * (6.5 + 2.4 + k * 2.2), Y + 2.0, -5.0] })); }
  // 台阶两侧石狮（奥尔良司法宫石狮扫描，对放）
  for (const sx of [-1, 1]) add(placeModel('lion_justice', { height: 1.9, pos: [sx * 17.9, 3.1, 0.6], rotY: sx * 0.25 }).then((o) => { if (sx > 0) o.scale.x *= -1; return o; }));
  // 滴水兽：正面双塔每座 8 个（四面 × 两角），伸出扶壁顶石托
  for (const cx of [-22, 22]) for (const [fx, fz, ry] of [[0, 1, 0], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2], [0, -1, Math.PI]]) for (const s of [-1, 1]) {
    const px = cx + (fx ? fx * 6.5 + fx * 1.4 : s * 5.6), pz = -13 + (fz ? fz * 6.5 + fz * 1.4 : s * 5.6);
    add(placeModel(s > 0 ? 'gargoyle_a' : 'gargoyle_b', { maxDim: 1.7, pos: [px, Y + 58.6, pz], rotY: ry }));
  }
  // 塔身深蓝局旗（竖幅，挂在一层盲拱段）
  const fm = bannerMaterial(content.tex('tex_flag_bureau'), content.tex('tex_flag_bureau') ? 0xffffff : 0x14244d);
  for (const sx of [-1, 1]) { const fl = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 12, 6, 18), fm); fl.position.set(sx * 22, Y + 10.2, -6.5 + 0.55); fl.castShadow = true; g.add(fl); }
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
  // 批次40：城墙脚（墙外皮 r 121.5 → 街心绿地内缘路缘 r 124.4）原是一圈暗色素地坪（ext_sky 看图）→ 南侧两段弧（门楼外 ~110°，正对迎宾大道两片绿地 + 环路）按 规则 成列：
  //   墙基花岗岩勒脚（墙身 y0 以下到墙外地坪 −4.4，外挑 0.35 m + 冠石）→ 1.3 m 浅色石材散水（每 2.4 m 一道分缝）+ 外沿立砌路缘 → 0.2 m 土沟 → 1.0 m 宽 0.9 m 高修剪绿篱（每段 4.0 m、留 0.8 m 检修口，等距成列）。避开塔楼 / 门楼脚（±6.5 m）。
  { const Yg = -4.4, inT = (deg) => towers.some((t) => Math.abs(THREE.MathUtils.radToDeg(Math.atan2(t.x - cx, t.z - cz)) - deg) < 3.4) || Math.abs(Math.abs(deg) - THREE.MathUtils.radToDeg(gap)) < 3.6;
    const ring = (r0, r1, step, fn) => { for (const sgn of [1, -1]) for (let s = R * gap + 0.01; s / r0 < THREE.MathUtils.degToRad(112); s += step) { const a = sgn * (s + step / 2) / r0; if (inT(THREE.MathUtils.radToDeg(a))) continue; fn(a, (r0 + r1) / 2, step); } };
    ring(121.5, 121.5, 2.4, (a, r, st) => { const [x, z] = P(a, 121.35); b.add('stone', new THREE.BoxGeometry(st + 0.02, 4.6, 0.75), { pos: [x, Yg + 2.3, z], rot: [0, a, 0] }, { uv: 0.5 }); const [x2, z2] = P(a, 121.62); b.add('stone', new THREE.BoxGeometry(st + 0.02, 0.18, 0.42), { pos: [x2, Yg + 4.0, z2], rot: [0, a, 0] }, { uv: 0.5 }); });
    ring(121.7, 123.0, 2.4, (a, r, st) => { const [x, z] = P(a, r); b.add('plazaTile', new THREE.BoxGeometry(st * (r / 121.7) - 0.03, 0.1, 1.3), { pos: [x, Yg + 0.05, z], rot: [0, a, 0] }, { uv: 0.6 }); const [xk, zk] = P(a, 123.08); b.add('stone', new THREE.BoxGeometry(st * (123.08 / 121.7) + 0.01, 0.2, 0.16), { pos: [xk, Yg + 0.1, zk], rot: [0, a, 0] }, { uv: 0.5 }); });
    ring(123.65, 123.65, 4.8, (a, r) => { const [x, z] = P(a, r); b.add('hedge', new THREE.BoxGeometry(4.0, 0.9, 1.0), { pos: [x, Yg + 0.45, z], rot: [0, a, 0] }, { uv: 0.6, collide: true }); b.add('hedge', new THREE.BoxGeometry(3.8, 0.12, 0.8), { pos: [x, Yg + 0.96, z], rot: [0, a, 0] }, { uv: 0.6 }); }); }
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
  // M6：城墙北侧大河（参考图：主楼背后环抱的宽阔河道）+ 石砌河堤 + 哥特石拱桥
  const northZ = (x) => -35 - 265 * Math.exp(-((x / 420) ** 2)) - 40 * Math.exp(-(((x - 900) / 500) ** 2)) * 0;
  const ribbon = (fz, x0, x1, w0, w1, y, mat, step = 20) => {
    const pos = [], idx = []; let n = 0;
    for (let x = x0; x <= x1; x += step) {
      const z = fz(x), dz = (fz(x + 1) - fz(x - 1)) / 2, l = Math.hypot(1, dz), nx = -dz / l, nz = 1 / l;
      pos.push(x + nx * w0, y, z + nz * w0, x + nx * w1, y, z + nz * w1);
      if (n) idx.push(2 * n - 2, 2 * n, 2 * n - 1, 2 * n - 1, 2 * n, 2 * n + 1); n++;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    if (geo.attributes.normal.getY(0) < 0) { idx.reverse(); geo.setIndex(idx); geo.computeVertexNormals(); }
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = false; g.add(m); return m;
  };
  ribbon(northZ, -3500, 3500, -72, 72, -4.22, riverMat, 12);
  const quayMat = new THREE.MeshStandardMaterial({ color: 0x4a4a50, roughness: 0.85 });
  const quayTop = new THREE.MeshStandardMaterial({ color: 0x6a6a70, roughness: 0.8 });
  for (const sd of [-1, 1]) { ribbon(northZ, -3500, 3500, sd * 72, sd * 84, -3.2, quayTop, 12); }
  // 河堤立面（竖直石墙）：沿河两岸的竖带
  for (const sd of [-1, 1]) {
    const pos = [], idx = []; let n = 0;
    for (let x = -3500; x <= 3500; x += 12) { const z = northZ(x), dz = (northZ(x + 1) - northZ(x - 1)) / 2, l = Math.hypot(1, dz), nx = -dz / l, nz = 1 / l; const px = x + nx * sd * 72, pz = z + nz * sd * 72; pos.push(px, -3.2, pz, px, -4.3, pz); if (n) idx.push(2 * n - 2, 2 * n - 1, 2 * n, 2 * n - 1, 2 * n + 1, 2 * n); n++; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, quayMat); m.material.side = THREE.DoubleSide; g.add(m);
  }
  // 河堤路灯（金色灯头，黄昏自发光）
  { const lampG = new THREE.CylinderGeometry(0.18, 0.25, 7, 6); lampG.translate(0, 3.5, 0); const headG = new THREE.SphereGeometry(0.55, 8, 6); headG.translate(0, 7.2, 0);
    const poles = new THREE.InstancedMesh(lampG, M.iron, 640), heads = new THREE.InstancedMesh(headG, new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffc070, emissiveIntensity: TOD.label === '白昼' ? 0.4 : 3 }), 640); let k = 0; const mm = new THREE.Matrix4();
    for (let x = -1600; x <= 1600 && k < 640; x += 18) for (const sd of [-1, 1]) { const z = northZ(x), dz = (northZ(x + 1) - northZ(x - 1)) / 2, l = Math.hypot(1, dz); mm.makeTranslation(x + (-dz / l) * sd * 80, -3.2, z + (1 / l) * sd * 80); poles.setMatrixAt(k, mm); heads.setMatrixAt(k++, mm); }
    for (const im of [poles, heads]) { im.count = k; im.frustumCulled = false; im.castShadow = false; im.instanceMatrix.needsUpdate = true; g.add(im); } }
  const bridgeStone = new THREE.MeshStandardMaterial({ color: 0x2a2b31, roughness: 0.7, metalness: 0.1 });
  const archDark = new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 1, side: THREE.DoubleSide });
  const bridgeParts = new Map(); // M6：所有桥按材质合并为少数几个网格（原每桥 ~60 个 Mesh → 数百 drawcall）
  const gothicBridge = (cx, cz, yaw, len, w) => {
    const base = new THREE.Matrix4().compose(new THREE.Vector3(cx, 0, cz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(1, 1, 1));
    const deckY = 4.5; const add = (geo, mat, x, y, z, rot = [0, 0, 0], sc = [1, 1, 1]) => { const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...sc)); geo.applyMatrix4(base.clone().multiply(m)); if (geo.index) geo = geo.toNonIndexed(); for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k); if (!bridgeParts.has(mat)) bridgeParts.set(mat, []); bridgeParts.get(mat).push(geo); };
    add(new THREE.BoxGeometry(w, 1.6, len), bridgeStone, 0, deckY, 0);
    add(new THREE.BoxGeometry(w + 0.6, 0.35, len), M.gold, 0, deckY - 0.85, 0);
    for (const sx of [-1, 1]) { add(new THREE.BoxGeometry(0.5, 1.3, len), bridgeStone, sx * (w / 2 - 0.25), deckY + 1.45, 0); add(new THREE.BoxGeometry(0.62, 0.12, len), M.gold, sx * (w / 2 - 0.25), deckY + 2.12, 0); }
    const span = len / 5;
    for (let i = 1; i < 5; i++) { const z = -len / 2 + i * span;
      add(new THREE.BoxGeometry(w + 2, deckY + 4.4, 5), bridgeStone, 0, (deckY - 4.4) / 2 - 0.4, z); // 桥墩
      add(new THREE.ConeGeometry(3.2, 7, 4), bridgeStone, 0, 0.5, z, [0, Math.PI / 4, 0], [1, 1, 0.8]); // 分水尖
      for (const sx of [-1, 1]) { add(new THREE.BoxGeometry(1.4, 9, 1.4), bridgeStone, sx * (w / 2 + 0.4), deckY + 3.5, z); add(new THREE.ConeGeometry(1.0, 4.5, 4), bridgeStone, sx * (w / 2 + 0.4), deckY + 10.2, z, [0, Math.PI / 4, 0]); add(new THREE.SphereGeometry(0.35, 8, 6), M.gold, sx * (w / 2 + 0.4), deckY + 12.6, z); }
    }
    for (let i = 0; i < 5; i++) { const z = -len / 2 + (i + 0.5) * span; for (const sx of [-1, 1]) add(new THREE.ShapeGeometry(archShape(span - 5, 0.6)), archDark, sx * (w / 2 + 0.02), -4.2, z, [0, sx * Math.PI / 2, 0], [1, 7.6 / (0.6 + (span - 5) * 0.866), 1]); }
  };
  gothicBridge(0, northZ(0), 0, 175, 22);
  for (const bx of [-520, 470]) { const z = northZ(bx), dz = (northZ(bx + 1) - northZ(bx - 1)) / 2; gothicBridge(bx, z, -Math.atan(dz), 175 * Math.hypot(1, dz) ** 0.3, 16); }
  for (const bx of [-1300, 1250]) gothicBridge(bx, northZ(bx), 0, 175, 16);
  // 楼群：哥特低模剪影（暗色石体 + 随机亮灯的尖窗 + 四坡尖顶 + 细尖塔），远处由天空盒雾融入生图天空盒
  const rnd = mulberry(7);
  const riverDist = (x, z) => { const t = (x + 3500) / 7000; const rz = -(-520 + Math.sin(t * 7) * 160 + t * 300); return Math.min(Math.abs(z - rz), Math.abs(x - 620), Math.abs(z - northZ(x)) - 10); };
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
  const stoneCity = new THREE.MeshStandardMaterial({ color: TOD.cityColor, roughness: 0.72, metalness: 0.15, envMapIntensity: 0.6 });
  stoneCity.onBeforeCompile = (sh) => winShader(sh, TOD.cityLit);
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
  const bandG = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true); const bands = new THREE.InstancedMesh(bandG, goldCity, NS * 3); let nbd = 0; // M4：远景尖塔金箍
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  let nb = 0, nr = 0, ns = 0, nt = 0;
  const place = (x, z) => riverDist(x, z) > 100 && !(Math.abs(x) < 70 && z > 90 && z < 1600);
  // 街区：沿环形放射路网排列（比随机撒点更像城市肌理）
  while (nb < N) {
    const a = rnd() * Math.PI * 2, r = 470 + Math.pow(rnd(), 0.85) * 1200; // 批次28：<450 m 近排改为下方成排街屋，程序方块只留远景剪影
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
    const a = rnd() * Math.PI * 2, r = 520 + Math.pow(rnd(), 0.8) * 1200;
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
    for (const tt of [0.04, 0.3, 0.58]) { const rr = bw * 0.5 * (1 - tt) * 1.03; m4.compose(new THREE.Vector3(x, -4.4 + bh + sh * tt, z), q, new THREE.Vector3(rr, Math.max(0.5, sh * 0.012), rr)); bands.setMatrixAt(nbd++, m4); }
  }
  for (const im of [bodies, roofs, spires, tips, bands]) { im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere?.(); g.add(im); }
  buildStreetRows(g, M, place, rnd);
  ctx.cityMats = { stoneCity };
  loadModel('cathedral').then((src) => {
    const spots = [[-420, -640, 0.4], [520, -900, 2.1], [-900, 300, 1.2], [880, 260, -0.6], [-260, -1300, 0.9], [1300, -500, 3.0], [-1500, -600, 2.4], [300, 900, 0.2]];
    for (const [x, z, yaw] of spots) {
      const o = src.clone(true); const w = new THREE.Group(); w.add(o);
      o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o); const s = 110 / (bb.max.y - bb.min.y); o.scale.setScalar(s);
      o.updateMatrixWorld(true); bb.setFromObject(o); const c = bb.getCenter(new THREE.Vector3()); o.position.set(-c.x, -bb.min.y, -c.z);
      w.position.set(x, -4.4, z); w.rotation.y = yaw; w.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals(); } }); g.add(w); // M7：远景教堂 357k→32k 面（tools/decimate_soup.mjs，去法线后运行时补）
    }
  });
  // 跨河大桥
  for (const bx of [-900, 0, 900]) { const t = (bx + 3500) / 7000; const rz = -(-520 + Math.sin(t * 7) * 160 + t * 300); gothicBridge(bx, rz, 0, 240, bx === 0 ? 30 : 20); }
  for (const [mat, geos] of bridgeParts) { const mg = mergeGeometries(geos, false); if (mg) { const m = new THREE.Mesh(mg, mat); m.castShadow = false; m.receiveShadow = false; g.add(m); } }
  // 飞行器
  ctx.aircraft = [];
  for (let i = 0; i < 9; i++) {
    const ac = aircraft(M, i < 3 ? 1.6 : 1.0);
    const r = i < 3 ? 260 + i * 80 : 600 + rnd() * 1400; const h = i < 3 ? 120 + i * 30 : 140 + rnd() * 260; const sp2 = (i % 2 ? 1 : -1) * (0.02 + rnd() * 0.03) * (i < 3 ? 1 : 0.6); const ph = rnd() * 6.28;
    g.add(ac); ctx.aircraft.push({ o: ac, r, h, sp: sp2, ph });
  }
}

// 批次28 E3：近排 1960–80 年代街屋立面（两圈沿环路连续临街，非随机撒点）+ 车行道 / 人行道路沿 / 成列路灯 / 行道树。
// 立面全部在着色器里按楼内局部米制坐标画：底层商铺橱窗 + 招牌带、上层分格木窗（窗套 + 窗台 + 雨渍）、楼板腰线、檐口；亮窗稀疏（黄昏 12%）。
function streetModules(g, mods, at, Y0) { // 批次33：tools/blender/street_house.py 精建的三种立面模块，按开间实例化
  const MT = { sh_stone: new THREE.MeshStandardMaterial({ color: 0xc9c0ad, roughness: 0.85, envMapIntensity: 0.55 }) /* 批次34：窗套提亮 */, sh_glass: new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.22, metalness: 0, envMapIntensity: 0.9 }) /* 批次36：去金属度、粗糙度略升，防远处镜面高光闪点 */,
    sh_frame: new THREE.MeshStandardMaterial({ color: 0x4a1c12, roughness: 0.7 }), sh_iron: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.6 }),
    sh_conc: new THREE.MeshStandardMaterial({ color: 0xa29d93, roughness: 0.9 }) /* 批次35：阳台板提亮，暗铁栏前读得出 */, sh_canvas: new THREE.MeshStandardMaterial({ color: 0xb2462a, roughness: 0.8, side: THREE.DoubleSide, envMapIntensity: 0.6 }) /* 批次34：帆布提亮 */ };
  const litGlass = new THREE.MeshStandardMaterial({ color: 0x20180f, emissive: 0xffb060, emissiveIntensity: 1.6, roughness: 0.3 });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  const plateG = new THREE.BoxGeometry(2.3, 2.1, 0.03); plateG.translate(0, 1.82, 0.0);
  const plateM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86, envMapIntensity: 0.45, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 }); // 批次35：阳台开间遮板往后推（深度偏移），不与门玻璃抢深度
  const plates = mods.filter((m) => m[5]); if (plates.length) { const im = new THREE.InstancedMesh(plateG, plateM, plates.length); plates.forEach((m, i) => { const [x, z] = at(m[7], m[2]); q.setFromAxisAngle(up, m[4]); m4.compose(new THREE.Vector3(x, Y0 + m[3], z), q, one); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color(m[5][0] * 0.93, m[5][1] * 0.93, m[5][2] * 0.93)); });
    im.computeBoundingSphere(); im.userData.noCull = true; im.receiveShadow = true; g.add(im); } // 阳台开间：遮住着色器画的窄窗，墙色同房屋三色
  // 批次34：ext_house 看图——窗套 / 窗台 20 m 外偏弱、雨棚几乎看不出 → 窗模块进深 ×2.2（窗套加厚、窗台出挑）、店面 ×1.9（雨棚出挑 ≈2 m）、阳台 ×1.3
  const MSC = { sh_bay_win: new THREE.Vector3(1.04, 1.04, 1.5), sh_bay_bal: new THREE.Vector3(1.15, 1, 1.35), sh_shop: new THREE.Vector3(1, 1.06, 1.9) }; // 批次36：模块翻正后真实出挑——窗套 / 窗台 ×1.5、阳台板 1.28 m、雨棚 ≈2.1 m（人行道宽 4 m） // 批次35：阳台 ×1.3→宽 ×1.15 / 深 ×1.5（板深 1.43 m、宽 3.0 m）；雨棚出挑 ×1.9→×2.6（≈2.7 m）
  const MSC_FLAT = {}; for (const k in MSC) MSC_FLAT[k] = new THREE.Vector3(MSC[k].x, MSC[k].y, 1); // 批次35：玻璃 / 木窗框不随进深放大——原 ×2.2 把玻璃推到墙面后 6 cm、阳台门玻璃离阳台底板仅 1.5 cm → 远处 z-fighting 白闪点；不放大后玻璃在墙面外 6 cm、窗框 8 cm
  for (const name of ['sh_bay_win', 'sh_bay_bal', 'sh_shop']) loadModel('r2/' + name).then((src) => { const list = mods.filter((m) => m[0] === name); if (!list.length) return;
    src.updateMatrixWorld(true);
    src.traverse((o) => { if (!o.isMesh) return; const mn = (o.material?.name || '').replace(/\.\d+$/, ''); const geo = o.geometry.clone().applyMatrix4(o.matrixWorld); geo.rotateY(Math.PI); /* 批次36 ★根因：Blender +Y 朝街导出后是 glTF −Z（不是 +Z）——三批来阳台板 / 铁栏 / 雨棚 / 窗套全部朝楼内长进墙里，只有退进的玻璃和窗框露在墙外（pick 前读 glb：sh_shop 玻璃 z=+0.08、雨棚 z<0）。绕 Y 转 180° 让模块正面朝街 */
      const sets = mn === 'sh_glass' ? [[MT.sh_glass, list.filter((m) => !m[6])], [litGlass, list.filter((m) => m[6])]] : [[MT[mn] ?? MT.sh_stone, list]];
      for (const [mat, L] of sets) { if (!L.length) continue; const im = new THREE.InstancedMesh(geo, mat, L.length);
        L.forEach((m, i) => { const [x, z] = at(m[1], m[2]); q.setFromAxisAngle(up, m[4]); m4.compose(new THREE.Vector3(x, Y0 + m[3], z), q, (mn === 'sh_glass' || mn === 'sh_frame') ? MSC_FLAT[name] : MSC[name]); im.setMatrixAt(i, m4); });
        im.computeBoundingSphere(); im.userData.noCull = true; im.castShadow = mn === 'sh_canvas' || mn === 'sh_conc'; im.receiveShadow = true; g.add(im); } });
    console.log('[NB] 街屋立面模块', name, list.length); });
}

// 批次37：街屋店面招牌由平涂色块 → 有字招牌（60–80 年代国营商店：红底金字 / 蓝底白字 / 绿底白字木框招牌），每个店面模块一块，按开间 hash 取店名（稳定，不随机散布）
const SHOP_NAMES = [['国营百货商店', '#8e1a14', '#f2d27a'], ['副食品商店', '#1c3a6e', '#f4f0e4'], ['红星照相馆', '#8e1a14', '#f2d27a'], ['人民邮电', '#1d5a34', '#f4f0e4'], ['新华书店', '#8e1a14', '#f2d27a'], ['国营饭店', '#1c3a6e', '#f4f0e4'], ['五金交电', '#1d5a34', '#f4f0e4'], ['钟表眼镜', '#5a2a14', '#f2d27a']];
function shopSigns(g, mods, at, Y0) {
  const hs = (k) => { const x = Math.sin(k * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
  const geo = new THREE.PlaneGeometry(4.3, 0.66), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  const lists = SHOP_NAMES.map(() => []);
  for (const md of mods) { if (md[0] !== 'sh_shop') continue; const [, fr, th, , yaw] = md; const k = Math.floor(hs(Math.round(th * 1e4) + fr) * SHOP_NAMES.length); lists[k].push([fr, th, yaw]); }
  SHOP_NAMES.forEach(([name, bg, fg], k) => { const L = lists[k]; if (!L.length) return;
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 172; const c = cv.getContext('2d');
    c.fillStyle = '#3a2414'; c.fillRect(0, 0, 1024, 172); c.fillStyle = bg; c.fillRect(14, 14, 996, 144);
    c.strokeStyle = fg; c.globalAlpha = 0.5; c.lineWidth = 3; c.strokeRect(26, 26, 972, 120); c.globalAlpha = 1;
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${Math.min(108, 860 / name.length)}px "NB Title", "NB Serif", serif`;
    const chars = [...name], step = Math.min(150, 860 / chars.length); chars.forEach((ch, i) => c.fillText(ch, 512 + (i - (chars.length - 1) / 2) * step, 90));
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: TOD.label === '白昼' ? 0.05 : 0.35 });
    const im = new THREE.InstancedMesh(geo, mat, L.length);
    L.forEach(([fr, th, yaw], i) => { const sd = Math.abs(((yaw - th) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) > 1 ? 1 : -1; const [x, z] = at(fr - sd * 0.38, th); q.setFromAxisAngle(up, yaw); m4.compose(new THREE.Vector3(x, Y0 + 3.6, z), q, one); im.setMatrixAt(i, m4); });
    im.computeBoundingSphere(); im.userData.noCull = true; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = true; g.add(im); });
}
// 批次38：南大道路口（内圈 R160 环路与南轴相接处）两侧成组街具——外侧人行道上 60–80 年代铁皮候车亭（Blender 精建 r2/bus_shelter_6080，前 +Z 朝车行道）+ 人行道后报刊亭（复用 r2/simple_90_s_kiosk）+ 旋转报架 + 垃圾桶；东西对称成组，不随机
function busStops(g, at, Y0) {
  const sign = (() => { const cv = document.createElement('canvas'); cv.width = 384; cv.height = 576; const c = cv.getContext('2d');
    c.fillStyle = '#f2efe6'; c.fillRect(0, 0, 384, 576); c.fillStyle = '#a3170f'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '900 64px "NB Title", "NB Serif", serif'; c.fillText('公共汽车', 192, 70); c.fillRect(30, 118, 324, 6);
    c.fillStyle = '#1a1a1a'; c.font = '900 58px "NB Title", "NB Serif", serif'; c.fillText('局南门站', 192, 186);
    c.font = '700 40px "NB Serif", serif'; ['3 路  南站—局北门', '11 路  环城路', '24 路  地铁B口'].forEach((t, i) => c.fillText(t, 192, 278 + i * 66));
    c.fillStyle = '#a3170f'; c.fillRect(30, 470, 324, 4); c.fillStyle = '#333'; c.font = '600 32px "NB Serif", serif'; c.fillText('首班 5:30　末班 22:00', 192, 516);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }); })();
  for (const sx of [1, -1]) {
    const put = (name, r, arc, h, extra) => { /* 批次39：人行道顶 Y0+0.2（原 +0.1 陷进 10 cm） */ const th = sx * arc / r; const [x, z] = at(r, th); placeModel(name, { height: h, pos: [x, Y0 + 0.2, z], rotY: th + Math.PI }).then((w) => { w.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); w.userData.noCull = true; g.add(w); extra?.(w); }); };
    put('r2/bus_shelter_6080', 168.6, 34, 3.02, (w) => { const o = w.children[0]; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.81), sign); m.position.set(2.35 + o.position.x, 1.95, 0.75 + 0.032 + o.position.z); w.add(m); });
    // 批次39：成组对称——候车亭（弧长 34）居中，西侧垃圾桶（29.4）、东侧垃圾桶（38.6）对称；报刊亭移到候车亭东侧同一后退线（弧长 45，r 171.6，原 41.5 在候车亭正后方被挡），旋转报架在报刊亭门前东侧（49）
    put('r2/simple_90_s_kiosk', 171.6, 45, 2.6);
    put('r2/news_rack_6080', 170.0, 49, 1.48); // 批次41：细铁丝格兜旋转报架（远看白色点阵线框）→ Blender 精建 60–80 年代墨绿铁皮报刊架（4 级斜搁板插满报纸，tools/blender/news_rack_6080.py）；市民大厅表格取阅架 / 报刊架同换
    put('r2/garbage_bin', 169.2, 38.6, 1.0); put('r2/garbage_bin', 169.2, 29.4, 1.0);
  }
}
function buildStreetRows(g, M, place, rnd) {
  const hs = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const boxG = new THREE.BoxGeometry(1, 1, 1); boxG.translate(0, 0.5, 0);
  const lit = TOD.label === '白昼' ? 0.02 : 0.12;
  const houseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86, metalness: 0, envMapIntensity: 0.45 });
  houseMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLm; varying vec3 vLn; varying float vSd; varying float vH; varying float vW;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 isc = vec3(1.0); vSd = 0.0;
        #ifdef USE_INSTANCING
        isc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)); vSd = fract(instanceMatrix[3].x * 0.0137 + instanceMatrix[3].z * 0.0071);
        #endif
        vLm = transformed * isc; vLn = normal; vH = isc.y; vW = isc.x;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLm; varying vec3 vLn; varying float vSd; varying float vH; varying float vW;\nfloat h2(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5);}')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float wall = 1.0 - step(0.5, abs(vLn.y));
          float u = abs(vLn.x) > 0.5 ? vLm.z : vLm.x; float y = vLm.y; float side = abs(vLn.x) > 0.5 ? 1.0 : 0.0;
          vec3 pal = vSd < 0.34 ? vec3(0.40, 0.40, 0.41) : vSd < 0.67 ? vec3(0.46, 0.27, 0.21) : vec3(0.68, 0.64, 0.57); // 批次32：三色成排——深灰抹灰 / 暗红砖 / 米灰石（去掉偏蓝绿的第四色）
          vec3 col = pal;
          // 面砖 / 砖缝
          vec2 tg = fract(vec2(u / 0.6, y / 0.3)); col *= 0.93 + 0.07 * step(0.08, tg.x) * step(0.1, tg.y);
          vec3 em = vec3(0.0);
          // 批次36：临街正面（局部 ±Z 面）由立面模块覆盖的范围——店面 5 m 开间、楼层 3.4 m 开间，与 buildStreetRows 的模块排布同式；范围外着色器不再画大块暗窗 / 白亮橱窗（ext_tree 看图：模块外的残开间是一整块暗玻璃 + 白光条）
          float front = step(0.5, abs(vLn.z));
          float shopCov = 5.0 * floor((vW * 0.5 - 2.5) / 5.0) + 2.5, winCov = 3.4 * (floor((vW * 0.5 - 1.7) / 3.4 - 0.5 + 0.001) + 1.0);
          float keepShop = 1.0 - front * step(shopCov, abs(u)), keepWin = 1.0 - front * step(winCov, abs(u));
          if (y < 4.2 && side > 0.5) { // 批次38：山墙侧面底层——去掉平涂彩色招牌带，改真实材质：石勒脚 + 墙砖（红砖楼）/ 方整石（灰 / 米色楼）+ 石套窗 + 窗台 + 腰线
            float aa = clamp(fwidth(u) * 6.0, 0.0, 1.0); // 远处砖缝淡出，防摩尔纹
            if (y < 0.9) { // 花岗岩勒脚：大块石 1.2×0.45，深灰
              vec2 sb = vec2(u / 1.2 + 0.5 * mod(floor(y / 0.45), 2.0), y / 0.45); vec2 sf = fract(sb);
              float mort = (1.0 - step(0.03, sf.x) * step(sf.y, 0.94)) * (1.0 - aa);
              col = vec3(0.30, 0.29, 0.28) * (0.88 + 0.2 * h2(floor(sb))) * (1.0 - 0.35 * mort);
              col *= 1.0 - 0.3 * step(0.82, y); // 勒脚压顶阴影线
            } else {
              bool brick = vSd >= 0.34 && vSd < 0.67;
              vec2 bs = brick ? vec2(0.25, 0.065) : vec2(0.9, 0.42);
              float row = floor(y / bs.y); vec2 bb = vec2(u / bs.x + 0.5 * mod(row, 2.0), y / bs.y); vec2 bf = fract(bb);
              float mort = (1.0 - step(brick ? 0.05 : 0.025, bf.x) * step(bf.y, brick ? 0.82 : 0.95)) * (1.0 - aa);
              vec3 base = brick ? vec3(0.50, 0.26, 0.19) : pal * 0.95;
              col = base * (0.86 + 0.24 * h2(floor(bb) + vSd * 9.0)) ;
              col = mix(col, brick ? vec3(0.62, 0.58, 0.52) : pal * 0.7, mort * 0.8);
              // 石套窗：每 3.4 m 一樘，窗洞 1.1–2.9 m
              float fx = fract(u / 3.4); float cx = floor(u / 3.4);
              float wn = step(0.3, fx) * step(fx, 0.7) * step(1.15, y) * step(y, 2.85);
              float fr = step(0.27, fx) * step(fx, 0.73) * step(1.05, y) * step(y, 3.0) - wn;
              float sill = step(0.25, fx) * step(fx, 0.75) * step(0.98, y) * step(y, 1.1);
              float ml = wn * (step(abs(fx - 0.5), 0.012) + step(abs(y - 2.25), 0.02));
              col = mix(col, vec3(0.70, 0.68, 0.63), max(fr, sill));
              col = mix(col, vec3(0.05, 0.055, 0.06), wn); col = mix(col, vec3(0.26, 0.17, 0.10), ml);
              col *= 1.0 - 0.3 * step(0.98, y) * step(y, 1.0) * step(0.25, fx) * step(fx, 0.75); // 窗台下影
              float wo = step(0.82, h2(vec2(cx * 2.3, vSd * 31.0)));
              em += wn * (1.0 - ml) * wo * vec3(1.0, 0.55, 0.25) * 0.35;
              if (y > 3.85) col = vec3(0.66, 0.64, 0.59) * (1.0 - 0.3 * step(y, 3.92)); // 腰线石
            }
          } else if (y < 4.2) { // 底层商铺
            float bay = floor(u / 5.0 + 0.5 + side * 7.0 + vSd * 13.0); float bx = fract(u / 5.0 + 0.5);
            float glass = step(0.08, bx) * step(bx, 0.92) * step(0.45, y) * step(y, 3.0) * keepShop;
            float sign = step(0.04, bx) * step(bx, 0.96) * step(3.15, y) * step(y, 3.95) * (1.0 - front); /* 批次38：临街正面招牌交给模块招牌框 + shopSigns 有字招牌，着色器不再画平涂色带（ext_house b38：模块外残开间仍见红 / 绿色带） */
            vec3 sc = h2(vec2(bay, 1.0)) < 0.33 ? vec3(0.62, 0.10, 0.08) : h2(vec2(bay, 1.0)) < 0.66 ? vec3(0.10, 0.22, 0.48) : vec3(0.12, 0.36, 0.22);
            col = mix(col * 0.75, vec3(0.05, 0.06, 0.07), glass); col = mix(col, sc, sign);
            float shopOn = step(0.55, h2(vec2(bay, 7.0 + vSd)));
            em += glass * shopOn * (1.0 - front) * vec3(1.0, 0.55, 0.24) * 0.45 /* 批次37：侧面橱窗压暗偏暖 */ /* 批次36：正面橱窗亮光交给模块 litGlass */ + sign * vec3(1.0, 0.9, 0.8) * sc * 1.6 * step(0.4, h2(vec2(bay, 3.0)));
            col *= 1.0 - 0.25 * step(y, 0.45); // 水刷石勒脚
          } else if (y > vH - 0.9) { col *= y > vH - 0.6 ? 0.55 : 1.15; // 檐口 + 檐下线脚
          } else {
            float fy = (y - 4.2) / 3.2; float cy = floor(fy); float f = fract(fy);
            float cx = floor(u / 3.4); float fx = fract(u / 3.4);
            float win = step(0.22, fx) * step(fx, 0.78) * step(0.28, f) * step(f, 0.82) * keepWin;
            float frame = (step(0.18, fx) * step(fx, 0.82) * step(0.24, f) * step(f, 0.86)) * keepWin - win;
            float mull = win * (step(abs(fx - 0.5), 0.015) + step(abs(f - 0.6), 0.015));
            col *= 1.0 - 0.18 * step(f, 0.07); // 楼板腰线
            col *= 1.0 - 0.14 * step(0.3, fx) * step(fx, 0.7) * step(f, 0.24) * (1.0 - f / 0.24); // 窗台下雨渍
            col = mix(col, vec3(0.85, 0.83, 0.78), frame * 0.7);
            col = mix(col, vec3(0.04, 0.05, 0.06), win); col = mix(col, vec3(0.30, 0.18, 0.10), mull);
            float on = step(1.0 - ${lit.toFixed(2)}, h2(vec2(cx + side * 31.0, cy) + vSd * 17.0));
            em += win * (1.0 - mull) * on * (1.0 - step(0.5, abs(vLn.z))) /* 批次36：临街正面 / 背面的亮窗交给模块 litGlass（稳定少量暖窗），着色器只在山墙侧面画亮窗——去掉正面窗后再叠一层亮窗的白闪点 */ * step(0.5, h2(vec2(cx * 1.7, cy + 5.0))) * mix(vec3(1.0, 0.5, 0.2), vec3(1.0, 0.62, 0.32), h2(vec2(cx, cy * 3.1))) * 0.5; /* 批次37：侧面亮窗再减半 + 更暖（ext_house 仍见奶白块） */ /* 批次36：山墙亮窗 2.0 → 0.75、偏暖（原过曝成白块；1.3 仍偏白，ext_house b36b） */
          }
          col = mix(vec3(0.16, 0.16, 0.17), col, wall); // 平屋面
          diffuseColor.rgb *= col; totalEmissiveRadiance += em * wall;
        }`);
  };
  const parMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3c, roughness: 0.9 });
  // 批次39：环路车道 = 纯色暗盒 → Poly Haven asphalt_02（CC0）沥青；人行道 = 弹石 PavingStones142（与墙外地坪同料、分不出层）→ granite_tile 花岗岩分缝板（CC0）；
  //   InstancedMesh 单位盒 UV 会被实例缩放拉伸 → 世界坐标 xz 投影 UV（worldUV）。路缘改浅花岗岩、高出人行道 4 cm。
  const worldUV = (m, s) => { for (const t of [m.map, m.normalMap, m.roughnessMap]) if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
    m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      { vec4 nbW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        nbW = instanceMatrix * nbW;
        #endif
        nbW = modelMatrix * nbW; vec2 nbUv = nbW.xz * ${s.toFixed(4)};
        #ifdef USE_MAP
        vMapUv = nbUv;
        #endif
        #ifdef USE_NORMALMAP
        vNormalMapUv = nbUv;
        #endif
        #ifdef USE_ROUGHNESSMAP
        vRoughnessMapUv = nbUv;
        #endif
      }`); }; m.customProgramCacheKey = () => 'nbwuv' + s; return m; };
  const roadMat = worldUV(phMat('asphalt_02', { color: 0x6a6866, roughness: 0.9, env: 0.35, normalScale: 1.6 }), 1 / 3);
  const walkMat = worldUV(phMat('granite_tile', { color: 0x8e8a82, roughness: 0.7, env: 0.75, normalScale: 2.4 }), 1 / 2); const curbMat = new THREE.MeshStandardMaterial({ color: 0x9a978f, roughness: 0.72 });
  const leafMat = M.hedge; const trunkMat = M.iron;
  const NH = 760, NSEG = 1000;
  const houses = new THREE.InstancedMesh(boxG, houseMat, NH), pars = new THREE.InstancedMesh(boxG, parMat, NH * 2);
  // 批次32：两坡屋面三角棱柱（单位：x −0.5…0.5 沿街，z −0.5…0.5 进深，y 0…1 屋脊）
  const roofG = new THREE.BufferGeometry(); { const P = [[-0.5, 0, -0.5], [0.5, 0, -0.5], [0.5, 1, 0], [-0.5, 1, 0], [-0.5, 0, 0.5], [0.5, 0, 0.5]];
    const tri = [[0, 3, 2], [0, 2, 1], [4, 5, 2], [4, 2, 3], [0, 4, 3], [1, 2, 5], [0, 1, 5], [0, 5, 4]]; const pos = []; for (const t of tri) for (const i of t) pos.push(...P[i]);
    roofG.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); roofG.computeVertexNormals(); }
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, side: THREE.DoubleSide, envMapIntensity: 0.4 });
  const roofs = new THREE.InstancedMesh(roofG, roofMat, NH); const ROOFC = [new THREE.Color(0x34363a), new THREE.Color(0x5a3426), new THREE.Color(0x45474b)]; let nf = 0;
  const lineG = new THREE.PlaneGeometry(1, 1); lineG.rotateX(-Math.PI / 2);
  const paintW = new THREE.MeshStandardMaterial({ color: 0xdcdad2, roughness: 0.6, envMapIntensity: 0.4, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const paintY = new THREE.MeshStandardMaterial({ color: 0xd8a624, roughness: 0.6, envMapIntensity: 0.4, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const linesW = new THREE.InstancedMesh(lineG, paintW, NSEG * 4), linesY = new THREE.InstancedMesh(lineG, paintY, NSEG * 2); let nlw = 0, nly = 0;
  const roads = new THREE.InstancedMesh(boxG, roadMat, NSEG), walks = new THREE.InstancedMesh(boxG, walkMat, NSEG * 2), curbs = new THREE.InstancedMesh(boxG, curbMat, NSEG * 2);
  const poleG = new THREE.CylinderGeometry(0.12, 0.16, 7, 6); poleG.translate(0, 3.5, 0); const armG = new THREE.BoxGeometry(0.1, 0.1, 1.6); armG.translate(0, 7, -0.7); const headG = new THREE.BoxGeometry(0.4, 0.18, 0.7); headG.translate(0, 6.9, -1.4);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffc27a, emissiveIntensity: TOD.label === '白昼' ? 0.2 : 2.6 });
  const NL = 700; const poles = new THREE.InstancedMesh(poleG, M.iron, NL), arms = new THREE.InstancedMesh(armG, M.iron, NL), heads = new THREE.InstancedMesh(headG, lampMat, NL);
  const crownG = new THREE.IcosahedronGeometry(1, 1); crownG.translate(0, 1, 0); const stemG = new THREE.CylinderGeometry(0.14, 0.2, 1, 6); stemG.translate(0, 0.5, 0);
  const crowns = new THREE.InstancedMesh(crownG, leafMat, NL), stems = new THREE.InstancedMesh(stemG, trunkMat, NL);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), Y0 = -4.4;
  let nh = 0, np = 0, nr = 0, nw = 0, nc = 0, nl = 0, nt = 0; const mods = [], tallTrees = [];
  const at = (R, th) => [Math.sin(th) * R, -35 + Math.cos(th) * R];
  // 两圈环路：R 为车行道中心线；内侧、外侧各一排临街街屋
  for (const R of [160, 245, 305]) { // 批次29：ext_sky 看图——R212 / 300 两圈都在城墙到画框之外，墙外 120–200 m 一片空地 → 改三圈 160 / 245 / 305（相邻圈街屋背靠背留 ≥4 m 后巷）
    const C = 2 * Math.PI * R, roadW = 12, walkW = 4;
    const placeR = (x, z) => place(x, z) || (R === 160 && z > 90 && Math.abs(x) > 26 && Math.abs(x) < 70); // 批次37：内圈环路在南大道两侧（原整片剔除成平褐空地）接续到大道路口 |x| 26 m，街屋仍不进南轴
    for (let s = 0; s < C; s += 6) { const th = s / R; const [x, z] = at(R, th); if (!placeR(x, z)) continue; q.setFromAxisAngle(up, th);
      if (nr < NSEG) { m4.compose(new THREE.Vector3(x, Y0, z), q, new THREE.Vector3(6.3, 0.06, roadW)); roads.setMatrixAt(nr++, m4); }
      { // 批次39：标线——中心双黄实线、两侧白色虚线分道（3 m 线 / 3 m 空）、路边白实线（距路缘 0.5 m）
        const L = (rr, len, wd, im) => { const [lx, lz] = at(rr, th); m4.compose(new THREE.Vector3(lx, Y0 + 0.062, lz), q, new THREE.Vector3(len, 1, wd)); im.setMatrixAt(im === linesY ? nly++ : nlw++, m4); };
        if (nly < NSEG * 2 - 1) { L(R - 0.13, 6.3, 0.12, linesY); L(R + 0.13, 6.3, 0.12, linesY); }
        if (nlw < NSEG * 4 - 3) { for (const sd of [-1, 1]) { L(R + sd * 3.0, 3, 0.13, linesW); L(R + sd * (roadW / 2 - 0.5), 6.3, 0.15, linesW); } }
      }
      for (const sd of [-1, 1]) { const rr = R + sd * (roadW / 2 + walkW / 2); const [wx, wz] = at(rr, th); if (nw < NSEG * 2) { m4.compose(new THREE.Vector3(wx, Y0, wz), q, new THREE.Vector3(6.3 * rr / R, 0.2, walkW)); walks.setMatrixAt(nw++, m4); }
        const rc = R + sd * (roadW / 2 + 0.12); const [cx, cz] = at(rc, th); if (nc < NSEG * 2) { m4.compose(new THREE.Vector3(cx, Y0, cz), q, new THREE.Vector3(6.3, 0.24, 0.26)); curbs.setMatrixAt(nc++, m4); } }
    }
    // 路灯（每 30 m，两侧对位）与行道树（灯间居中，每 30 m）——等距成列
    for (let s = 0; s < C; s += 15) { const th = s / R; const lamp = Math.round(s / 15) % 2 === 0;
      for (const sd of [-1, 1]) { const rr = R + sd * (roadW / 2 + 0.9); const [x, z] = at(rr, th); if (!placeR(x, z) || nl >= NL || nt >= NL) continue;
        const yaw = th + (sd > 0 ? 0 : Math.PI); q.setFromAxisAngle(up, yaw);
        if (lamp) { m4.compose(new THREE.Vector3(x, Y0 + 0.2, z), q, new THREE.Vector3(1, 1, 1)); poles.setMatrixAt(nl, m4); arms.setMatrixAt(nl, m4); heads.setMatrixAt(nl++, m4); }
        else if (R === 160) tallTrees.push([x, z, yaw]); /* 批次34：最内圈二十面体树 → r2/street_tree_tall */ else { m4.compose(new THREE.Vector3(x, Y0 + 0.2, z), q, new THREE.Vector3(1, 3.2, 1)); stems.setMatrixAt(nt, m4); m4.compose(new THREE.Vector3(x, Y0 + 2.9, z), q, new THREE.Vector3(2.6, 2.4, 2.6)); crowns.setMatrixAt(nt++, m4); } } }
    // 临街街屋：连续面宽，每 6 栋留 10 m 支路口
    for (const sd of [-1, 1]) {
      const front = R + sd * (roadW / 2 + walkW); let s = 0, k = 0;
      while (s < C && nh < NH) { const w = 12 + Math.floor(hs(k + R) * 4) * 3, d = 14 + Math.floor(hs(k * 3.3 + R) * 3) * 2, fl = 4 + Math.floor(hs(k * 7.7 + R + sd) * 4);
        const h = 4.2 + (fl - 1) * 3.2 + 0.9; const th = (s + w / 2) / front; const rc = front + sd * d / 2; const [x, z] = at(rc, th);
        if (place(x, z) && place(...at(front, th))) { q.setFromAxisAngle(up, th); m4.compose(new THREE.Vector3(x, Y0, z), q, new THREE.Vector3(w, h, d)); houses.setMatrixAt(nh++, m4);
          { // 批次34：三圈街屋都贴模块（原只最内圈 R160）；批次33：最内圈街屋贴 Blender 精建立面模块（窗套 / 窗台 / 阳台铁栏 / 店面雨棚），对齐着色器开间网格（窗 3.4 m、店 5 m）
            const yaw = th + (sd < 0 ? 0 : Math.PI), fr = front - sd * 0.16, sdv = ((x * 0.0137 + z * 0.0071) % 1 + 1) % 1, th3 = hs(k * 5.1 + R + sd), typ = th3 < 0.2 ? 0 : th3 < 0.6 ? 1 : 2; /* 批次34：阳台户型 80%（ext_house 画面里没见阳台） */
            const pal = sdv < 0.34 ? [0.40, 0.40, 0.41] : sdv < 0.67 ? [0.46, 0.27, 0.21] : [0.68, 0.64, 0.57];
            const c0 = s + w / 2; // 局部 +x = 弧长增加方向，u 处的角度 = (c0 + u) / front
            for (let u = -5 * Math.floor((w / 2 - 2.5) / 5); u <= w / 2 - 2.5 + 1e-3; u += 5) mods.push(['sh_shop', fr, (c0 + u) / front, 0, yaw, null, hs(u * 1.7 + k * 2.3 + R + sd) < 0.45]); /* 批次36：约 45% 店面橱窗暖光（模块 litGlass，按户 hash 稳定） */
            const kb = Math.floor((w / 2 - 1.7) / 3.4 - 0.5 + 1e-3), bays = []; for (let b = -kb - 1; b <= kb; b++) bays.push(3.4 * (b + 0.5));
            bays.forEach((u, b) => { const mid = Math.abs(u) < 1.8;
              for (let f = 0; f < fl - 1; f++) { const bal = typ === 1 ? mid : typ === 2 ? (b % 2 === 0 && f % 2 === 0) : false;
                mods.push([bal ? 'sh_bay_bal' : 'sh_bay_win', fr, (c0 + u) / front, 4.2 + f * 3.2, yaw, bal ? pal : null, hs(b * 7.3 + f * 3.1 + k + R) < lit, front - sd * 0.015]); } });
          }
          // 批次32：平顶 + 水箱间方块 → 出挑檐口（0.35 m 厚、每边出 0.45 m）+ 两坡屋面（屋脊平行街道、坡比 ≈0.38、檐口再出 0.4 m）；屋面三色成排（石板灰 / 陶瓦褐 / 铅灰）
          m4.compose(new THREE.Vector3(x, Y0 + h - 0.35, z), q, new THREE.Vector3(w + 0.9, 0.35, d + 0.9)); if (np < NH * 2) pars.setMatrixAt(np++, m4);
          if (nf < NH) { m4.compose(new THREE.Vector3(x, Y0 + h, z), q, new THREE.Vector3(w + 1.6, d * 0.38, d + 1.7)); roofs.setMatrixAt(nf, m4); roofs.setColorAt(nf++, ROOFC[k % 3]); } }
        s += w + 0.4; k++; if (k % 6 === 0) s += 10; }
    }
  }
  // 批次44：城墙外背街（墙外皮 r 121.5 → 内圈街屋背面 r ≥132）原是城市底板暗紫灰素地（ext_wallfoot 看图）→ 南侧两段弧（与墙脚散水 / 绿篱同范围，31°–112°，
  //   街心绿地扇区内不铺）按规则成列：墙脚散水 + 绿篱之外，花岗岩分缝人行道 r 124.2–128.1（与环路同料 walkMat）→ 浅花岗岩立砌路缘 r 128.25 → 单车道沥青背街 r 128.3–131.9（同 roadMat）+ 路边白实线。
  //   塔楼外皮在 r 124（12 m 方台），人行道内缘让开 0.2 m，不穿模。每 6 m 一段弧长（与环路分段一致）。
  { const { cx: rx, cz: rz } = RING; const atW = (r, a) => [rx + Math.sin(a) * r, rz + Math.cos(a) * r];
    for (const sgn of [1, -1]) for (let s = 0; ; s += 6) { const a = sgn * (THREE.MathUtils.degToRad(31) + s / 130); if (Math.abs(a) > THREE.MathUtils.degToRad(112)) break;
      const [gx, gz] = atW(128, a); if (Math.abs(gx) < 70 && gz > 90) continue; q.setFromAxisAngle(up, a);
      const seg = (r, h, w, im, y = Y0) => { const [x, z] = atW(r, a); m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(6.3 * r / 130, h, w)); im.setMatrixAt(im === roads ? nr++ : im === walks ? nw++ : nc++, m4); };
      if (nr < NSEG) seg(130.1, 0.06, 3.6, roads); if (nw < NSEG * 2) seg(126.15, 0.2, 3.9, walks); if (nc < NSEG * 2) seg(128.2, 0.24, 0.26, curbs);
      if (nlw < NSEG * 4) { const [lx, lz] = atW(128.75, a); m4.compose(new THREE.Vector3(lx, Y0 + 0.062, lz), q, new THREE.Vector3(6.3 * 128.75 / 130, 1, 0.15)); linesW.setMatrixAt(nlw++, m4); } } }
  const lawnTufts = [];
  // 批次37：城墙外南侧（大道两侧 |x| 26–68 m、墙外 125–149 m）= 环路内侧街心绿地：修剪草坪扇形 + 两列高干行道树（每 12 m 等距）+ 石材路缘，不再是平褐空地
  { const gm = M.grass.clone(); for (const k of ['map', 'normalMap', 'roughnessMap']) if (gm[k]) { gm[k] = gm[k].clone(); gm[k].wrapS = gm[k].wrapT = THREE.RepeatWrapping; gm[k].repeat.set(80, 80); gm[k].needsUpdate = true; }
    /* 批次41：ext_green 看图草坪像地毯（单一贴图 80× 重复、色相均匀）→ 世界坐标两级值噪声：大尺度 18 m 斑块（深绿 / 黄绿 / 微枯）+ 3 m 细斑 + 近路缘 1.2 m 内略深（踩踏 / 水汽）；法线加强 1.6 */
    gm.normalScale?.set(1.6, 1.6); gm.customProgramCacheKey = () => 'lawn43';
    /* 批次43：两次压色相 ext_green 均值几乎不变（94/65/31→92/65/31）→ 黄昏低角度逆光下读成黄褐的主因是高光 / 环境反射：去粗糙度贴图（Grass001 原图偏光滑）、roughness 1、envMapIntensity 0.3→0.12，着色器里直接 / 间接镜面各 ×0.3（草叶近似全漫反射） */
    gm.roughnessMap = null; gm.roughness = 1; gm.envMapIntensity = 0.12;
    gm.onBeforeCompile = (sh) => { sh.vertexShader = 'varying vec3 vLw;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvLw = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'varying vec3 vLw;\nfloat lh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat ln(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(lh(i),lh(i+vec2(1,0)),f.x),mix(lh(i+vec2(0,1)),lh(i+vec2(1,1)),f.x),f.y);}\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        { vec2 q = vLw.xz; float big = ln(q / 18.0) * 0.65 + ln(q / 7.0) * 0.35, fine = ln(q / 3.0), r = length(vec2(q.x, q.y + 35.0)), edge = 1.0 - smoothstep(0.0, 1.2, min(abs(r - 125.0), abs(r - 149.0)));
          vec3 tint = mix(vec3(0.64, 0.98, 0.60), vec3(0.80, 1.00, 0.64), smoothstep(0.35, 0.75, big)); tint = mix(tint, vec3(0.96, 0.96, 0.74), smoothstep(0.72, 0.9, fine) * 0.2); /* 批次42：ext_green 看图整体偏黄褐像枯草 → 第一版（0.80,1.00,0.72）→（0.98,1.04,0.78）黄昏下仍橄榄黄 → 第二版压红：（0.64,0.98,0.60）→（0.80,1.00,0.64），细斑微枯 0.2 */
          diffuseColor.rgb *= tint * (0.9 + 0.2 * fine) * (1.0 - 0.18 * edge); }`).replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n reflectedLight.directSpecular *= 0.3; reflectedLight.indirectSpecular *= 0.3;'); };
    const T0 = 0.21, T1 = 0.474;
    for (const sgn of [1, -1]) { const st = sgn > 0 ? -Math.PI / 2 + T0 : -Math.PI / 2 - T1;
      const lawn = new THREE.Mesh(new THREE.RingGeometry(125, 149, 48, 1, st, T1 - T0), gm); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, Y0 + 0.08, -35); lawn.receiveShadow = true; lawn.userData.noCull = true; g.add(lawn);
      for (const r of [124.7, 149.3]) { const kerb = new THREE.Mesh(new THREE.RingGeometry(r - 0.3, r + 0.3, 48, 1, st, T1 - T0), curbMat); kerb.rotation.x = -Math.PI / 2; kerb.position.set(0, Y0 + 0.12, -35); kerb.userData.noCull = true; g.add(kerb); }
      for (const r of [129, 145]) for (let a = T0 + 6 / r; a <= T1 - 4 / r; a += 12 / r) { const th = sgn * a; const [x, z] = at(r, th); tallTrees.push([x, z, th]); }
      for (const r of [125.6, 148.4]) for (let a = T0 + 1.5 / r; a <= T1 - 1.5 / r; a += 3 / r) { const th = sgn * a; const [x, z] = at(r, th); lawnTufts.push([x, z, th]); } } } /* 批次41：草坪内缘贴路缘 0.6 m 一圈蕨类草丛，每 3 m 等距成列（边缘草丛，打破地毯感） */
  streetModules(g, mods, at, Y0); shopSigns(g, mods, at, Y0); busStops(g, at, Y0); console.log('[NB] 街屋模块实例', mods.length, '高干行道树', tallTrees.length);
  if (lawnTufts.length) loadModel('r2/fern_02').then((src) => { src.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(src); const sc = 0.55 / Math.max(0.01, bb.max.y - bb.min.y), tq = new THREE.Quaternion();
    src.traverse((o) => { if (!o.isMesh) return; const geo = o.geometry.clone(); for (const n of ['position', 'normal']) { const a = geo.getAttribute(n); if (!a || (a.array instanceof Float32Array && !a.normalized && !a.isInterleavedBufferAttribute)) continue; const f = new Float32Array(a.count * 3); for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); } geo.setAttribute(n, new THREE.BufferAttribute(f, 3)); } geo.applyMatrix4(o.matrixWorld); geo.translate(0, -bb.min.y, 0);
      const im = new THREE.InstancedMesh(geo, o.material, lawnTufts.length);
      lawnTufts.forEach(([x, z, yaw], i) => { const s2 = sc * (0.9 + 0.2 * ((i * 0.618) % 1)); tq.setFromAxisAngle(up, yaw + i * 2.4); m4.compose(new THREE.Vector3(x, Y0 + 0.08, z), tq, new THREE.Vector3(s2 * 1.3, s2, s2 * 1.3)); im.setMatrixAt(i, m4); });
      im.computeBoundingSphere(); im.userData.noCull = true; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = true; g.add(im); }); });
  if (tallTrees.length) loadModel('r2/street_tree_tall').then((src) => { src.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(src); const sc = 9.5 / Math.max(0.01, bb.max.y - bb.min.y), S = new THREE.Vector3(sc, sc, sc), tq = new THREE.Quaternion();
    src.traverse((o) => { if (!o.isMesh) return; const geo = o.geometry.clone(); for (const n of ['position', 'normal']) { const a = geo.getAttribute(n); if (!a || (a.array instanceof Float32Array && !a.normalized && !a.isInterleavedBufferAttribute)) continue; const f = new Float32Array(a.count * 3); for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); } geo.setAttribute(n, new THREE.BufferAttribute(f, 3)); } /* 批次34 修：street_tree_tall 是 meshopt 量化 glb（Int16 归一化坐标），直接 applyMatrix4 会把米制坐标截断到 ±1 → 树缩成地上一团（ext_house 看图）；先解量化成 Float32 */ geo.applyMatrix4(o.matrixWorld); geo.translate(0, -bb.min.y, 0);
      let mat = o.material; if (/trunk/.test(mat?.name || '')) { // 批次35：树干原贴图纵向拉伸、偏红 → ambientCG Bark007（CC0）按真实米制柱面重映射：u = 角度 × 半径 / 0.6 m、v = 高度 / 0.9 m（树高 9.5 m 缩放后）
        const pa = geo.getAttribute('position'), uv = new Float32Array(pa.count * 2); /* 批次36：按 0.4 m 高度分层求各层中心（原用整棵树均值，分叉枝干绕错中心 → 纹理横向拉成平涂） */ const BAND = 0.4 / sc, cen = new Map(); for (let i = 0; i < pa.count; i++) { const k = Math.floor(pa.getY(i) / BAND), c = cen.get(k) ?? [0, 0, 0]; c[0] += pa.getX(i); c[1] += pa.getZ(i); c[2]++; cen.set(k, c); }
        for (let i = 0; i < pa.count; i++) { const c = cen.get(Math.floor(pa.getY(i) / BAND)), cx = c[0] / c[2], cz = c[1] / c[2]; const dx = (pa.getX(i) - cx) * sc, dz = (pa.getZ(i) - cz) * sc, r = Math.max(0.12, Math.hypot(dx, dz)); uv[i * 2] = (Math.atan2(dx, dz) + Math.PI) * Math.min(r, 0.35) / 0.6; uv[i * 2 + 1] = pa.getY(i) * sc / 0.9; }
        geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); mat = pbr('Bark007', { repeat: [1, 1], color: 0x8f8574, env: 0.35, normalScale: 1.8 }); /* 批次36：压暗 + 法线加强，近景读出树皮沟纹 */
        for (const t of [mat.map, mat.normalMap, mat.roughnessMap]) if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; } }
      const im = new THREE.InstancedMesh(geo, mat, tallTrees.length);
      tallTrees.forEach(([x, z, yaw], i) => { tq.setFromAxisAngle(up, yaw + i * 0.9); m4.compose(new THREE.Vector3(x, Y0 + 0.2, z), tq, S); im.setMatrixAt(i, m4); });
      im.computeBoundingSphere(); im.userData.noCull = true; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = true; g.add(im); }); });
  for (const [im, n] of [[houses, nh], [pars, np], [roofs, nf], [roads, nr], [walks, nw], [curbs, nc], [poles, nl], [arms, nl], [heads, nl], [stems, nt], [crowns, nt], [linesW, nlw], [linesY, nly]]) { im.count = n; im.computeBoundingSphere(); im.userData.noCull = true; /* 批次30：ext_sky 看图——三圈街屋全没出现：InstancedMesh 没算 boundingSphere，DistCull 拿单位方块半径 0.87 m 当整排街屋 → 60 m 外全剔 */ im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.instanceMatrix.needsUpdate = true; g.add(im); }
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
  // 批次25：按“游戏内禁止人物 3D 模型”去掉程序化写生老人（躯干 / 头 / 帽 / 四肢），只留空凳 + 画架 + 未完成的画（人已离开）
  void coat; void skin;
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
  c.fillStyle = '#e8c87a'; c.font = '900 48px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'left'; c.fillText('叙事管理局 · 公告', 36, 66);
  c.fillStyle = '#cfd8ea'; c.font = '900 54px \"NB Title\", \"NB Serif\", serif'; c.fillText('距 2027 全国叙事高考', 36, 200);
  c.fillStyle = '#ffd36e'; c.font = '900 190px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'right'; c.fillText(String(days), W - 190, 400);
  c.fillStyle = '#cfd8ea'; c.font = '900 70px \"NB Title\", \"NB Serif\", serif'; c.fillText('天', W - 70, 400);
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


// ---------------- 批次49 门厅内门 + 暖光渐变 ----------------
// 门厅 z −6.2（正门门扇）… −30（大厅南墙 10 m 门洞，hall.py end_wall）。原先从门洞斜看进去只有一整块平亮米黄面（ext_door_mid），无纵深。
// 在南墙门洞内侧装一樘对开内门：胡桃木框 + 铜包边芯板 + 上部铜格栅玻璃亮子 + 铜推板，半开约 50°（向门厅开，中缝净宽 ≈ 4.6 m，不加碰撞，玩家照常通过）；
// 门套：胡桃木贴脸 + 铜线；门后大厅方向放一张加法混合的暖光渐变卡（深处亮、近处淡，营造「门厅深处有光」的透视），再加 1 盏不投影暖点光照亮门扇与门厅地面。
function innerVestibuleDoors(g, M, Y) {
  const ZW = -29.3, OW = 9.6, OH = 7.2;
  const wood = pbr('Wood051', { color: 0x5a3a24, roughness: 0.5, env: 0.35 }), woodDk = pbr('Wood051', { color: 0x3a2416, roughness: 0.6, env: 0.3 });
  const brass = M.brassNosing, glow = new THREE.MeshStandardMaterial({ color: 0x1a120a, emissive: 0xffb860, emissiveIntensity: 0.9, roughness: 0.3 });
  const box = (par, mat, w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; par.add(m); return m; };
  // 门套贴脸（两侧 + 门楣）
  for (const sx of [-1, 1]) { box(g, woodDk, 0.35, OH + 0.35, 0.5, sx * (OW / 2 + 0.17), Y + (OH + 0.35) / 2, ZW); box(g, brass, 0.04, OH + 0.3, 0.52, sx * (OW / 2 + 0.01), Y + (OH + 0.3) / 2, ZW); }
  box(g, woodDk, OW + 0.7, 0.35, 0.5, 0, Y + OH + 0.17, ZW); box(g, brass, OW + 0.6, 0.04, 0.52, 0, Y + OH + 0.01, ZW);
  const w = OW / 2, doorH = OH - 1.6; // 门扇 5.6 m 高，上方 1.6 m 铜格栅亮子
  // 亮子：铜格栅 + 暖光内透
  box(g, glow, OW, 1.5, 0.04, 0, Y + doorH + 0.8, ZW - 0.05);
  for (let i = 1; i < 12; i++) box(g, brass, 0.05, 1.5, 0.08, -OW / 2 + i * OW / 12, Y + doorH + 0.8, ZW);
  box(g, woodDk, OW, 0.18, 0.3, 0, Y + doorH + 0.05, ZW);
  // 批次50：门扇改 Blender 精建 r2/inner_door（tools/blender/inner_door.py：4.8 × 5.6 m，2×3 凸芯板 + 铜压线 / 推板 / 踢板 / 合页筒；原点门轴下端、沿 −X 展开），左扇镜像
  loadModel('r2/inner_door').then((src) => { for (const sx of [-1, 1]) {
    const leaf = src.clone(true); leaf.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
    leaf.scale.set(sx > 0 ? 1 : -1, 1, 1); leaf.position.set(sx * w, Y, ZW + 0.1); leaf.rotation.y = sx * 0.87; g.add(leaf); } }); // 向门厅（+z）半开 ≈ 50°
  // 暖光渐变卡（大厅深处 → 门洞）：竖向卡，中心暖、四周透明，加法混合不写深度
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const c2 = cv.getContext('2d');
  const gr = c2.createRadialGradient(128, 150, 10, 128, 150, 140); gr.addColorStop(0, 'rgba(255,196,120,0.85)'); gr.addColorStop(0.45, 'rgba(255,150,70,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  c2.fillStyle = gr; c2.fillRect(0, 0, 256, 256); const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const cardM = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: true, opacity: 0.55 });
  for (const [z, s, o] of [[-31.5, 1.0, 0.55], [-24, 0.8, 0.28], [-16, 0.62, 0.14]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(OW * 1.3 * s + 2, OH * 1.2 * s + 1), cardM.clone()); m.material.opacity = o; m.position.set(0, Y + OH * 0.5, z); m.userData.noShadow = true; m.castShadow = false; g.add(m); }
  const pl = new THREE.PointLight(0xffc68a, 60, 16, 1.6); pl.position.set(0, Y + 4.5, -25); pl.castShadow = false; g.add(pl);
  // 批次50：尖拱鼓室（门楣 Y+7.55 以上到门洞顶 Y+10）——胡桃木框 + 暖光内透 + 铜竖格栅 + 中央铜圆花；轮廓贴 archPortal 内弧（w 10、起拱 5.67）
  const archTop = (x) => Math.min(10, 5.67 + Math.sqrt(Math.max(0, 100 - (5 + Math.abs(x)) ** 2)));
  const y0 = OH + 0.35, ty = new THREE.Shape(); const xs = []; for (let i = 0; i <= 16; i++) xs.push(-4.82 + i * 9.64 / 16);
  ty.moveTo(-4.82, y0); for (const x of xs) ty.lineTo(x, archTop(x)); ty.lineTo(4.82, y0); ty.lineTo(-4.82, y0);
  const tyM = new THREE.Mesh(new THREE.ShapeGeometry(ty), glow); tyM.position.set(0, Y, ZW - 0.12); g.add(tyM);
  for (let i = 1; i < 16; i++) { const x = -4.82 + i * 9.64 / 16, hh = archTop(x) - y0; box(g, brass, 0.045, hh, 0.07, x, Y + y0 + hh / 2, ZW - 0.06); }
  for (const yy of [y0 + 0.75, y0 + 1.6]) { const hw = Math.min(4.82, 5 - (5 - Math.sqrt(Math.max(0, 100 - (yy - 5.67) ** 2)))) - 0.05; box(g, woodDk, hw * 2, 0.07, 0.09, 0, Y + yy, ZW - 0.05); }
  const ros = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 40), brass); ros.position.set(0, Y + y0 + 1.15, ZW); g.add(ros);
  const ros2 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 32), brass); ros2.position.set(0, Y + y0 + 1.15, ZW); g.add(ros2);
  for (let a = 0; a < 8; a++) { const sp = box(g, brass, 0.035, 0.62, 0.04, 0, Y + y0 + 1.15, ZW); sp.rotation.z = a * Math.PI / 8; }
  // 批次50：门廊后墙（Z1 −30 内面 z −29.6）内门两侧胡桃木护墙板 4.2 m 高（ext_door_mid 门洞内右侧那块被面光平打的米黄墙）——2 行凸芯板 + 铜压线 + 顶部线脚；上段石墙乘护墙阴影后不再整块平亮
  for (const sx of [-1, 1]) {
    const x0 = 5.6, x1 = 13.7, wd = x1 - x0, cx = sx * (x0 + x1) / 2, zz = -29.55;
    box(g, woodDk, wd, 4.2, 0.08, cx, Y + 2.1, zz); box(g, woodDk, wd, 0.22, 0.16, cx, Y + 4.25, zz + 0.04); box(g, brass, wd, 0.03, 0.17, cx, Y + 4.13, zz + 0.05);
    box(g, woodDk, wd, 0.25, 0.12, cx, Y + 0.12, zz + 0.02); box(g, brass, wd, 0.025, 0.13, cx, Y + 1.25, zz + 0.04);
    const n = 5, pw = wd / n;
    for (let i = 0; i < n; i++) { const px = sx * (x0 + pw * (i + 0.5));
      for (const [py, ph] of [[0.72, 0.8], [2.75, 2.3]]) { box(g, wood, pw - 0.36, ph, 0.05, px, Y + py, zz + 0.06); box(g, brass, pw - 0.3, 0.02, 0.02, px, Y + py + ph / 2 + 0.02, zz + 0.09); } }
  }
  // 批次50：门廊前墙门洞侧壁（x ±3.5，z −6.4…−6.7，高 9）胡桃木门套衬板 + 铜收边，压掉 ext_door_mid 门洞右侧那条平亮竖面
  for (const sx of [-1, 1]) { box(g, woodDk, 0.06, 9, 0.42, sx * 3.47, Y + 4.5, -6.55); box(g, brass, 0.07, 9, 0.03, sx * 3.47, Y + 4.5, -6.33); }
  // 批次50 补：ext_door_mid 看图——平亮米黄竖面实为主楼 GLB 门洞内侧石壁（x ±3.5，z −4.9…−6.4，门扇铰接处之后）被门厅面光打亮 → 胡桃木门洞衬板 + 3 段凸芯板 + 铜收边贴满 z −4.95…−6.35，高 8.6 m
  for (const sx of [-1, 1]) { const x = sx * 3.44, zc = -5.65, dz = 1.4;
    box(g, woodDk, 0.05, 8.6, dz, x, Y + 4.3, zc);
    for (const [py, ph] of [[1.1, 1.6], [3.75, 3.1], [6.85, 2.5]]) { box(g, wood, 0.03, ph, dz - 0.3, x - sx * 0.035, Y + py, zc); box(g, brass, 0.02, 0.025, dz - 0.24, x - sx * 0.04, Y + py + ph / 2 + 0.03, zc); }
    box(g, brass, 0.06, 8.6, 0.025, x - sx * 0.01, Y + 4.3, zc + dz / 2); }
  // 批次51：ext_door_mid 米黄平亮面最终定位——按机位 [-4,1.8,18]→[0,13,-5] fov66 反算射线：亮面像素 (645…660, 440…600) 穿门洞后打在
  // 门廊后墙 Z1=−30 内面 x 4.3…6、y Y+2…Y+15，即「尖拱外侧 + 护墙板以上」的石墙，被门廊顶部面光（buildGate rectLight Y+13.9）平打。
  // 改：护墙以上整面贴深色花岗岩饰面（沿尖拱外弧留 0.25 m 石券边），每 2.7 m 一根胡桃木壁柱 + 铜压条，Y+11 胡桃木檐板 + 铜线；
  // 饰面上暖光渐变（下亮上暗，模拟护墙顶线脚处的上照灯），石材深色高粗糙 → 不再反成整块米黄。
  const dkStone = pbr('Granite003A', { color: 0x4a3f36, roughness: 0.9, env: 0.25, normalScale: 0.8 });
  const cv2 = document.createElement('canvas'); cv2.width = 4; cv2.height = 128; const g2 = cv2.getContext('2d'); const lg = g2.createLinearGradient(0, 128, 0, 0);
  lg.addColorStop(0, 'rgba(255,170,90,0.55)'); lg.addColorStop(0.35, 'rgba(255,150,70,0.18)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); g2.fillStyle = lg; g2.fillRect(0, 0, 4, 128);
  const wash = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.6 }); wash.map.colorSpace = THREE.SRGBColorSpace;
  const yB = 4.38, yT = 13.9, aw = 5.25; const sh = new THREE.Shape(); sh.moveTo(-13.85, yB); sh.lineTo(-aw, yB);
  for (let i = 0; i <= 24; i++) { const x = -aw + i * 2 * aw / 24; sh.lineTo(x, Math.min(10.25, 5.67 + Math.sqrt(Math.max(0, 100 - (5 + Math.abs(x) - 0.25) ** 2))) + 0.25); }
  sh.lineTo(aw, yB); sh.lineTo(13.85, yB); sh.lineTo(13.85, yT); sh.lineTo(-13.85, yT); sh.lineTo(-13.85, yB);
  const sgeo = new THREE.ShapeGeometry(sh); { const pa = sgeo.attributes.position, uv = sgeo.attributes.uv; for (let i = 0; i < pa.count; i++) uv.setXY(i, pa.getX(i) / 2.5, pa.getY(i) / 2.5); }
  const clad = new THREE.Mesh(sgeo, dkStone); clad.position.set(0, Y, -29.5); clad.receiveShadow = true; g.add(clad);
  const wgeo = sgeo.clone(); { const pa = wgeo.attributes.position, uv = wgeo.attributes.uv; for (let i = 0; i < pa.count; i++) uv.setXY(i, 0.5, (pa.getY(i) - yB) / (yT - yB)); }
  const wm = new THREE.Mesh(wgeo, wash); wm.position.set(0, Y, -29.47); wm.userData.noShadow = true; g.add(wm);
  for (const sx of [-1, 1]) { for (let k = 0; k < 4; k++) { const px = sx * (6.3 + k * 2.45);
      box(g, woodDk, 0.42, 6.5, 0.14, px, Y + yB + 3.25, -29.42); box(g, wood, 0.26, 6.2, 0.05, px, Y + yB + 3.25, -29.33); box(g, brass, 0.03, 6.2, 0.02, px, Y + yB + 3.25, -29.3); }
    box(g, woodDk, 8.2, 0.32, 0.22, sx * 9.75, Y + 11.05, -29.4); box(g, brass, 8.2, 0.03, 0.24, sx * 9.75, Y + 10.9, -29.39); }
  // 批次51 补：e51b 看图——饰面后仍剩「尖拱与右门扇之间」一条米黄竖带 = 后墙门洞内侧券面（x=+5 竖向侧壁，法线 −x 正对西偏机位）+ archPortal 浅色石券环。
  // → 胡桃木门洞券套：内宽 9.94（盖住侧壁）、外宽 11.4（盖住浅色券环）、进深 1.6（z −30.5…−28.9）+ 铜内口线
  const lin = new THREE.Mesh(archRingGeo(11.4, 5.67, 9.94, 5.67, 1.6), woodDk); lin.position.set(0, Y, -29.7); lin.castShadow = lin.receiveShadow = true; g.add(lin);
  const linB = new THREE.Mesh(archRingGeo(10.06, 5.67, 9.92, 5.67, 1.64), brass); linB.position.set(0, Y, -29.7); g.add(linB);
}


// ---------------- 批次51 实体铜灯槽（洗墙） ----------------
// 勒脚线脚上沿（两翼 x ±15.4…28.6 顶 y2.2 / ±31.8…40.2 顶 y2.0）与中段平台后沿（x ±4.4…15.2，y FLOOR）各一道铜 U 槽：
// 外壁哑光铜 + 内衬暗铜 + 槽内磨砂暖光灯带（只朝上可见，平视藏在槽唇后）+ 每 1.2 m 一个灯具隔板；对应的洗墙光在 facadeBounce 着色器里按槽口高度计算。
function facadeTroughs(g, Y) {
  if (TOD.label === '白昼') return;
  const cu = new THREE.MeshStandardMaterial({ color: 0x8a5a32, metalness: 0.85, roughness: 0.42 }), cuDk = new THREE.MeshStandardMaterial({ color: 0x3a2414, metalness: 0.7, roughness: 0.6 });
  const led = new THREE.MeshStandardMaterial({ color: 0x1a120a, emissive: 0xffb466, emissiveIntensity: 2.2, roughness: 0.5 });
  const b = new Batch();
  const run = (x0, x1, y, z) => { for (const sx of [-1, 1]) { const L = x1 - x0, cx = sx * (x0 + x1) / 2;
    b.box('cu', L, 0.16, 0.03, [cx, y + 0.08, z + 0.13]); b.box('cu', L, 0.12, 0.03, [cx, y + 0.06, z - 0.13]); b.box('cuDk', L, 0.025, 0.26, [cx, y + 0.012, z]);
    b.box('cu', L, 0.012, 0.06, [cx, y + 0.165, z + 0.15]); b.box('led', L - 0.04, 0.012, 0.12, [cx, y + 0.04, z - 0.02]);
    for (let x = x0 + 0.6; x < x1; x += 1.2) b.box('cuDk', 0.02, 0.12, 0.24, [sx * x, y + 0.07, z]); } };
  run(4.4, 15.2, Y, -5.32); run(15.4, 28.6, 2.2, -5.62); run(31.8, 40.2, 2.0, -6.52);
  b.build(g, { cu, cuDk, led });
}

// ---------------- 批次50 下半立面反弹光 ----------------
// ext_plaza（56 m 外逆光）下半立面发黑：SpotLight 再加强看不出、只会把近处打爆。改为材质级弱反弹项——
// 只作用于主楼正立面（z > −16、|x| < 40）、Y−1…Y+16 高度，强度随高度衰减，乘石材自身反照率（纹理 / 分缝仍可读，不是平涂发光）。
// GLB 材质与附楼 / 广场共用 extMats 表 → 这里 clone 一份并承接原有 onBeforeCompile 链（vao / 光照贴图），不影响其它建筑。
function facadeBounce(gHi, gLo, Y) {
  if (TOD.label === '白昼') return;
  const cache = new Map();
  const patch = (m) => {
    if (cache.has(m)) return cache.get(m);
    if (!m || !m.isMeshStandardMaterial || /glass|gold|brass|bronze|emit|lamp|light|water|COL|screen/i.test(m.name || '')) { cache.set(m, m); return m; }
    const c = m.clone(); const prev = m.onBeforeCompile; const pk = m.customProgramCacheKey?.bind(m);
    c.onBeforeCompile = (sh, r) => {
      prev?.call(m, sh, r);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vNbBw;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvNbBw = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vNbBw;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float hgt = smoothstep(${(Y + 16).toFixed(1)}, ${(Y + 0.5).toFixed(1)}, vNbBw.y) * smoothstep(${(Y - 1.5).toFixed(1)}, ${(Y - 0.2).toFixed(1)}, vNbBw.y);
          float reg = smoothstep(-16.0, -12.0, vNbBw.z) * (1.0 - smoothstep(36.0, 40.0, abs(vNbBw.x)));
          totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.72, 0.46) * (0.30 * hgt * hgt + 0.06 * hgt) * reg;
          /* 批次51：实体铜灯槽洗墙（灯槽见 facadeTroughs）——灯槽口以上墙面掠射光：槽口最亮、向上指数衰减 ≈ 6 m，每 1.2 m 一盏灯的扇贝纹 */
          float ax = abs(vNbBw.x), yt = ax < 15.2 ? ${(Y + 0.06).toFixed(2)} : (ax < 30.5 ? 2.2 : 2.0);
          float seg = (step(4.4, ax) * (1.0 - step(15.2, ax))) + (step(15.4, ax) * (1.0 - step(28.6, ax))) + (step(31.8, ax) * (1.0 - step(40.2, ax)));
          float dy = vNbBw.y - yt, up = smoothstep(-0.02, 0.25, dy) * exp(-max(dy, 0.0) / 6.0);
          float scal = 0.7 + 0.3 * pow(abs(cos(3.14159 * vNbBw.x / 1.2)), 2.0) * exp(-max(dy, 0.0) / 1.6);
          totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.70, 0.40) * 0.85 * up * scal * seg * step(vNbBw.z, -4.8) * step(-12.0, vNbBw.z); }`);
    };
    c.customProgramCacheKey = () => (pk ? pk() : '') + '|bnc50';
    cache.set(m, c); return c;
  };
  for (const gr of [gHi, gLo]) gr.traverse((o) => { if (o.isMesh && o.material && !Array.isArray(o.material)) o.material = patch(o.material); });
}
