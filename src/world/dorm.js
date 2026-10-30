// M7：职工宿舍布景（金属上下铺+床垫被褥枕头、书桌、衣柜、台灯、暖瓶、脸盆架、窗帘、公告栏）
// 全部进 Batch 合批（按材质合并），材质哑光，环境反射压低，避免再出现「金色镜面」。
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
const noise = (c, w, h, a = 0.06, n = 4000) => { for (let i = 0; i < n; i++) { c.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 0.7})`; c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };
const matte = (o) => new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, envMapIntensity: 0.15, ...o });

export function dormMats() {
  // 地板：哑光实木条（每米重复 0.5 → 一张图 2 m）
  const plank = cv(512, 512, (c, w, h) => { const rows = 8; for (let r = 0; r < rows; r++) { const off = (r % 2) * 180; for (let x = -off; x < w; x += 360) { const tone = 50 + Math.random() * 26; c.fillStyle = `rgb(${tone + 28},${tone + 8},${tone - 12})`; c.fillRect(x, r * h / rows, 358, h / rows - 2); for (let k = 0; k < 14; k++) { c.strokeStyle = `rgba(40,20,8,${0.08 + Math.random() * 0.1})`; c.beginPath(); const yy = r * h / rows + Math.random() * h / rows; c.moveTo(x, yy); c.bezierCurveTo(x + 120, yy + 3, x + 240, yy - 3, x + 358, yy + 1); c.stroke(); } } c.fillStyle = 'rgba(20,10,4,0.8)'; c.fillRect(0, (r + 1) * h / rows - 2, w, 2); } noise(c, w, h, 0.05); });
  // 水磨石：哑光细颗粒
  const terr = cv(512, 512, (c, w, h) => { c.fillStyle = '#8c8a84'; c.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const g = 60 + Math.random() * 150; c.fillStyle = Math.random() < 0.08 ? `rgb(${g + 30},${g},${g - 30})` : `rgb(${g},${g},${g})`; const s = 1 + Math.random() * 4; c.fillRect(Math.random() * w, Math.random() * h, s, s * (0.6 + Math.random())); } c.strokeStyle = 'rgba(180,150,90,0.55)'; c.lineWidth = 3; c.strokeRect(1, 1, w - 2, h - 2); });
  // 床垫：蓝白条纹帆布
  const stripe = cv(256, 256, (c, w, h) => { c.fillStyle = '#e4e0d4'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { c.fillStyle = '#3c5a8c'; c.fillRect(x, 0, 12, h); c.fillStyle = '#9fb0c8'; c.fillRect(x + 14, 0, 3, h); } noise(c, w, h, 0.05, 2500); });
  // 被罩：蓝白格子
  const check = cv(256, 256, (c, w, h) => { c.fillStyle = '#e8e4da'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(40,70,130,0.55)'; for (let k = 0; k < w; k += 64) { c.fillRect(k, 0, 24, h); c.fillRect(0, k, w, 24); } c.fillStyle = 'rgba(40,70,130,0.35)'; for (let k = 34; k < w; k += 64) { c.fillRect(k, 0, 4, h); c.fillRect(0, k, w, 4); } noise(c, w, h, 0.05, 2500); });
  // 军绿被（豆腐块）
  const olive = cv(128, 128, (c, w, h) => { c.fillStyle = '#4e5a38'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.08, 2500); });
  // 窗帘：酒红绒布竖褶
  const curt = cv(256, 64, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); for (let k = 0; k <= 8; k++) { g.addColorStop(k / 8, k % 2 ? '#5a1a18' : '#8a2c26'); } c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = '#c9a052'; c.fillRect(0, h - 4, w, 3); });
  // 暖瓶：红铁皮印花
  const flask = cv(256, 128, (c, w, h) => { c.fillStyle = '#b0302a'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8c87a'; c.fillRect(0, 10, w, 4); c.fillRect(0, h - 14, w, 4); for (let k = 0; k < 4; k++) { const x = 32 + k * 64; c.beginPath(); for (let p = 0; p < 5; p++) { const a = p * 1.2566; c.ellipse(x + Math.cos(a) * 9, 64 + Math.sin(a) * 9, 7, 4, a, 0, 7); } c.fillStyle = '#f0e0c0'; c.fill(); c.beginPath(); c.arc(x, 64, 4, 0, 7); c.fillStyle = '#e8c040'; c.fill(); c.strokeStyle = '#3a6a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 76); c.quadraticCurveTo(x + 10, 96, x + 4, 110); c.stroke(); } });
  return {
    dm_wood: matte({ map: plank, roughness: 0.78, envMapIntensity: 0.12 }),
    dm_terrazzo: matte({ map: terr, roughness: 0.72, envMapIntensity: 0.12 }),
    dm_frame: new THREE.MeshStandardMaterial({ color: 0x3e4a44, metalness: 0.35, roughness: 0.62, envMapIntensity: 0.25 }),
    dm_frameCream: new THREE.MeshStandardMaterial({ color: 0xcfc8b4, metalness: 0.2, roughness: 0.6, envMapIntensity: 0.2 }),
    dm_slat: matte({ color: 0x8a6a44 }),
    dm_mattress: matte({ map: stripe }),
    dm_sheet: matte({ color: 0xe2ddd0 }),
    dm_quilt: matte({ map: check }),
    dm_olive: matte({ map: olive }),
    dm_pillow: matte({ color: 0xd8cdb4 }),
    dm_towel: matte({ color: 0xc8604a, side: THREE.DoubleSide }),
    dm_towel2: matte({ color: 0x5a7aa8, side: THREE.DoubleSide }),
    dm_curtain: matte({ map: curt, side: THREE.DoubleSide, roughness: 1 }),
    dm_flask: new THREE.MeshStandardMaterial({ map: flask, roughness: 0.45, metalness: 0.3, envMapIntensity: 0.3 }),
    dm_cork: matte({ color: 0x1c140e }),
    dm_enamel: new THREE.MeshStandardMaterial({ color: 0xeeeae0, roughness: 0.28, metalness: 0, envMapIntensity: 0.35 }),
    dm_enamelRim: new THREE.MeshStandardMaterial({ color: 0x24407a, roughness: 0.3, envMapIntensity: 0.3 }),
    dm_desk: matte({ color: 0x6a4a2c, roughness: 0.7, envMapIntensity: 0.2 }),
    dm_deskTop: matte({ color: 0x3e5a48, roughness: 0.8 }), // 绿呢台面垫
    dm_wardrobe: matte({ color: 0x7a5434, roughness: 0.65, envMapIntensity: 0.2 }),
    dm_brass: new THREE.MeshStandardMaterial({ color: 0xb08a48, metalness: 0.8, roughness: 0.45, envMapIntensity: 0.4 }),
    dm_pane: new THREE.MeshStandardMaterial({ color: 0x9ab0c4, emissive: 0xcfdcea, emissiveIntensity: 0.55, roughness: 0.2 }),
    dm_sillWhite: matte({ color: 0xd8d2c4 }),
    dm_shoe: matte({ color: 0x1a1612 }),
    dm_shoe2: matte({ color: 0xd8d4cc }),
    dm_case: matte({ color: 0x6a2a20, roughness: 0.6 }),
    dm_bookA: matte({ color: 0x8a2a22 }), dm_bookB: matte({ color: 0x24406a }), dm_bookC: matte({ color: 0xc8b890 }),
  };
}

const RB = (w, h, d, r = 0.03, s = 2) => new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
/** 局部坐标→世界：以 (x,y,z) 为原点、绕 Y 转 yaw */
const at = (x, y, z, yaw) => (lx, ly, lz) => [x + Math.cos(yaw) * lx + Math.sin(yaw) * lz, y + ly, z - Math.sin(yaw) * lx + Math.cos(yaw) * lz];

/** 金属上下铺：中心 (x,z)，长边沿局部 z（yaw=0 时沿世界 z），头在 -z。o.top: 'made'|'bare'|'none' */
export function bunkBed(b, world, x, y, z, yaw = 0, o = {}) {
  const L = 2.0, W = 0.95, P = at(x, y, z, yaw), R = [0, yaw, 0];
  const bx = (key, w, h, d, lx, ly, lz, uv = 1) => b.add(key, new THREE.BoxGeometry(w, h, d), { pos: P(lx, ly, lz), rot: R }, { uv });
  const fr = o.frame ?? 'dm_frame';
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(fr, 0.045, 1.9, 0.045, sx * W / 2, 0.95, sz * L / 2);
  for (const ly of [0.32, 1.42]) { // 两层床框 + 木条床板
    for (const sx of [-1, 1]) bx(fr, 0.04, 0.08, L, sx * W / 2, ly, 0);
    for (const sz of [-1, 1]) bx(fr, W, 0.08, 0.04, 0, ly, sz * L / 2);
    for (let k = 0; k < 9; k++) bx('dm_slat', W - 0.06, 0.02, 0.12, 0, ly + 0.02, -L / 2 + 0.15 + k * 0.212, false);
  }
  for (const sz of [-1, 1]) { bx(fr, W, 0.035, 0.035, 0, 0.75, sz * L / 2); bx(fr, W, 0.035, 0.035, 0, 1.88, sz * L / 2); } // 床头/床尾横杆
  for (const sx of [-1, 1]) bx(fr, 0.035, 0.035, L, sx * W / 2, 1.78, 0); // 上铺护栏
  for (let k = 0; k < 4; k++) bx(fr, 0.03, 0.03, 0.03, -W / 2, 1.62 + k * 0.05, -0.6 + k * 0.4); // 护栏立柱
  // 梯子（床尾侧）
  for (const lz of [L / 2 + 0.02]) for (let k = 0; k < 4; k++) bx(fr, 0.32, 0.03, 0.03, W / 2 - 0.22, 0.5 + k * 0.3, lz + 0.03);
  bx(fr, 0.03, 1.4, 0.03, W / 2 - 0.06, 0.95, L / 2 + 0.05); bx(fr, 0.03, 1.4, 0.03, W / 2 - 0.38, 0.95, L / 2 + 0.05);
  const bedding = (ly, kind) => {
    if (kind === 'none') return;
    b.add('dm_mattress', RB(W - 0.08, 0.11, L - 0.06, 0.04), { pos: P(0, ly + 0.09, 0), rot: R }, { uv: 1.2 });
    if (kind === 'bare') { b.add('dm_olive', new THREE.CylinderGeometry(0.13, 0.13, W - 0.2, 14), { pos: P(0, ly + 0.27, -L / 2 + 0.35), rot: [0, yaw, Math.PI / 2] }, { uv: 1 }); return; }
    b.add('dm_sheet', RB(W - 0.06, 0.02, L - 0.04, 0.008, 1), { pos: P(0, ly + 0.155, 0), rot: R }, { uv: false });
    b.add('dm_pillow', RB(0.56, 0.11, 0.34, 0.05, 3), { pos: P(0, ly + 0.22, -L / 2 + 0.25), rot: [0.08, yaw, 0] }, { uv: false });
    b.add(o.towel2 ? 'dm_towel2' : 'dm_towel', new THREE.PlaneGeometry(0.5, 0.3), { pos: P(0, ly + 0.28, -L / 2 + 0.25), rot: [-Math.PI / 2 + 0.08, yaw, 0] }, { uv: false });
    if (kind === 'tofu') { // 豆腐块军被
      b.add('dm_olive', RB(0.62, 0.16, 0.42, 0.02), { pos: P(0, ly + 0.25, L / 2 - 0.32), rot: R }, { uv: 2 });
      b.add('dm_olive', new THREE.BoxGeometry(0.625, 0.004, 0.08), { pos: P(0, ly + 0.27, L / 2 - 0.32), rot: R }, { uv: false });
    } else { // 铺开的格子被（微隆起）
      const g = new THREE.BoxGeometry(W - 0.02, 0.06, 1.25, 1, 1, 6); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setY(i, p.getY(i) + Math.sin((p.getZ(i) / 1.25 + 0.5) * Math.PI) * 0.03); g.computeVertexNormals();
      b.add('dm_quilt', g, { pos: P(0, ly + 0.2, 0.3), rot: R }, { uv: 1.4 });
      b.add('dm_quilt', new THREE.BoxGeometry(0.02, 0.22, 1.25), { pos: P(W / 2, ly + 0.1, 0.3), rot: R }, { uv: 1.4 }); // 垂边
      b.add('dm_quilt', new THREE.BoxGeometry(0.02, 0.22, 1.25), { pos: P(-W / 2, ly + 0.1, 0.3), rot: R }, { uv: 1.4 });
    }
  };
  bedding(0.32, o.bottom ?? 'quilt'); bedding(1.42, o.top ?? 'tofu');
  // 床下：脸盆/鞋/箱子
  b.add('dm_shoe', RB(0.11, 0.08, 0.27, 0.03), { pos: P(-0.18, y === 0 ? 0.09 : 0.09, L / 2 - 0.25), rot: R }, { uv: false }); b.add('dm_shoe', RB(0.11, 0.08, 0.27, 0.03), { pos: P(-0.04, 0.09, L / 2 - 0.27), rot: R }, { uv: false });
  b.add('dm_shoe2', RB(0.11, 0.09, 0.28, 0.03), { pos: P(0.18, 0.095, L / 2 - 0.2), rot: R }, { uv: false });
  if (o.suitcase !== false) b.add('dm_case', RB(0.7, 0.2, 0.45, 0.03), { pos: P(0, 0.15, -0.2), rot: R }, { uv: false });
  const w = P(0, 0, 0); world.box(w[0], y + 1.0, w[2], Math.abs(Math.cos(yaw)) * W + Math.abs(Math.sin(yaw)) * L, 2.0, Math.abs(Math.sin(yaw)) * W + Math.abs(Math.cos(yaw)) * L);
}

/** 单人铁床（102/207） */
export function singleBed(b, world, x, y, z, yaw = 0, o = {}) {
  const L = 2.0, W = 1.0, P = at(x, y, z, yaw), R = [0, yaw, 0];
  const bx = (key, w, h, d, lx, ly, lz, uv = 1) => b.add(key, new THREE.BoxGeometry(w, h, d), { pos: P(lx, ly, lz), rot: R }, { uv });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx('dm_frameCream', 0.04, sz < 0 ? 0.95 : 0.65, 0.04, sx * W / 2, sz < 0 ? 0.475 : 0.325, sz * L / 2);
  for (const sx of [-1, 1]) bx('dm_frameCream', 0.04, 0.07, L, sx * W / 2, 0.36, 0);
  for (let k = 0; k < 5; k++) bx('dm_frameCream', 0.025, 0.5, 0.025, -0.4 + k * 0.2, 0.62, -L / 2);
  bx('dm_frameCream', W, 0.04, 0.04, 0, 0.92, -L / 2); bx('dm_frameCream', W, 0.04, 0.04, 0, 0.62, L / 2);
  for (let k = 0; k < 9; k++) bx('dm_slat', W - 0.06, 0.02, 0.12, 0, 0.38, -L / 2 + 0.15 + k * 0.212, false);
  b.add('dm_mattress', RB(W - 0.08, 0.12, L - 0.06, 0.04), { pos: P(0, 0.46, 0), rot: R }, { uv: 1.2 });
  if (o.made !== false) {
    b.add('dm_sheet', RB(W - 0.06, 0.02, L - 0.04, 0.008, 1), { pos: P(0, 0.53, 0), rot: R }, { uv: false });
    b.add('dm_pillow', RB(0.58, 0.12, 0.35, 0.05, 3), { pos: P(0, 0.6, -L / 2 + 0.26), rot: [0.08, yaw, 0] }, { uv: false });
    const g = new THREE.BoxGeometry(W - 0.02, 0.07, 1.3, 1, 1, 6); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setY(i, p.getY(i) + Math.sin((p.getZ(i) / 1.3 + 0.5) * Math.PI) * 0.035); g.computeVertexNormals();
    b.add(o.olive ? 'dm_olive' : 'dm_quilt', g, { pos: P(0, 0.57, 0.28), rot: R }, { uv: 1.4 });
  } else b.add('dm_olive', new THREE.CylinderGeometry(0.14, 0.14, W - 0.2, 14), { pos: P(0, 0.66, -L / 2 + 0.35), rot: [0, yaw, Math.PI / 2] }, { uv: 1 });
  const w = P(0, 0, 0); world.box(w[0], y + 0.5, w[2], Math.abs(Math.cos(yaw)) * W + Math.abs(Math.sin(yaw)) * L, 1.0, Math.abs(Math.sin(yaw)) * W + Math.abs(Math.cos(yaw)) * L);
}

/** 书桌（带抽屉+绿呢垫）+ 木椅；yaw=0 时桌面朝 +z（人坐在 +z 侧） */
export function desk(b, world, x, y, z, yaw = 0, w = 1.1) {
  const P = at(x, y, z, yaw), R = [0, yaw, 0];
  const bx = (key, ww, h, d, lx, ly, lz, uv = 1) => b.add(key, new THREE.BoxGeometry(ww, h, d), { pos: P(lx, ly, lz), rot: R }, { uv });
  bx('dm_desk', w, 0.04, 0.58, 0, 0.76, 0, 1.2); bx('dm_deskTop', w * 0.6, 0.004, 0.4, -w * 0.1, 0.782, 0.02, false);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx('dm_desk', 0.045, 0.74, 0.045, sx * (w / 2 - 0.04), 0.37, sz * 0.25);
  bx('dm_desk', 0.4, 0.16, 0.5, w / 2 - 0.24, 0.66, 0); bx('dm_brass', 0.1, 0.015, 0.015, w / 2 - 0.24, 0.66, 0.255, false);
  bx('dm_desk', w - 0.1, 0.12, 0.02, 0, 0.62, -0.26); // 挡板
  // 椅
  const C = at(...P(0, 0, 0.45), yaw); const cb = (ww, h, d, lx, ly, lz) => b.add('dm_desk', new THREE.BoxGeometry(ww, h, d), { pos: C(lx, ly, lz), rot: R }, { uv: 1 });
  cb(0.42, 0.035, 0.4, 0, 0.45, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cb(0.035, 0.45, 0.035, sx * 0.18, 0.225, sz * 0.17);
  for (const sx of [-1, 1]) cb(0.035, 0.45, 0.035, sx * 0.18, 0.67, 0.17); cb(0.42, 0.12, 0.025, 0, 0.82, 0.17);
  const ww = P(0, 0, 0); world.box(ww[0], y + 0.4, ww[2], Math.abs(Math.cos(yaw)) * w + Math.abs(Math.sin(yaw)) * 0.6, 0.8, Math.abs(Math.sin(yaw)) * w + Math.abs(Math.cos(yaw)) * 0.6);
}

/** 双开门木衣柜（背靠墙），yaw=0 时门朝 +z */
export function wardrobe(b, world, x, y, z, yaw = 0, o = {}) {
  const P = at(x, y, z, yaw), R = [0, yaw, 0], W = o.w ?? 1.0, H = 1.9;
  const bx = (key, w, h, d, lx, ly, lz, uv = 1) => b.add(key, new THREE.BoxGeometry(w, h, d), { pos: P(lx, ly, lz), rot: R }, { uv });
  bx('dm_wardrobe', W, H, 0.55, 0, H / 2 + 0.06, 0, 1); bx('dm_wardrobe', W + 0.04, 0.05, 0.58, 0, H + 0.085, 0, 1); bx('dm_desk', W - 0.04, 0.06, 0.5, 0, 0.03, 0, 1);
  bx('dm_shoe', 0.008, H - 0.12, 0.01, 0, H / 2 + 0.06, 0.277, false);
  for (const sx of [-1, 1]) { bx('dm_desk', W / 2 - 0.08, H - 0.3, 0.012, sx * W / 4, H / 2 + 0.06, 0.28, 1); bx('dm_brass', 0.02, 0.14, 0.02, sx * 0.05, 1.08, 0.3, false); }
  bx('dm_sillWhite', 0.4, 0.5, 0.012, W / 4 + 0.05, 1.45, 0.29, false); // 门上小镜
  if (o.suitcase !== false) { b.add('dm_case', RB(0.6, 0.2, 0.42, 0.03), { pos: P(0, H + 0.21, 0), rot: R }, { uv: false }); }
  const w = P(0, 0, 0); world.box(w[0], y + 1, w[2], Math.abs(Math.cos(yaw)) * W + Math.abs(Math.sin(yaw)) * 0.56, 2, Math.abs(Math.sin(yaw)) * W + Math.abs(Math.cos(yaw)) * 0.56);
}

/** 暖瓶（红铁皮印花 + 木塞） */
export function thermos(b, x, y, z, s = 1) {
  b.add('dm_flask', new THREE.CylinderGeometry(0.075 * s, 0.075 * s, 0.32 * s, 16, 1, true), { pos: [x, y + 0.18 * s, z] }, { uv: false });
  b.add('dm_frame', new THREE.CylinderGeometry(0.078 * s, 0.078 * s, 0.025 * s, 16), { pos: [x, y + 0.012 * s, z] }, { uv: false });
  b.add('dm_flask', new THREE.CylinderGeometry(0.04 * s, 0.075 * s, 0.06 * s, 16), { pos: [x, y + 0.37 * s, z] }, { uv: false });
  b.add('dm_cork', new THREE.CylinderGeometry(0.028 * s, 0.024 * s, 0.05 * s, 10), { pos: [x, y + 0.42 * s, z] }, { uv: false });
  b.add('dm_frame', new THREE.TorusGeometry(0.05 * s, 0.006 * s, 4, 10, Math.PI), { pos: [x + 0.08 * s, y + 0.22 * s, z], rot: [0, 0, -Math.PI / 2] }, { uv: false });
}
/** 搪瓷缸 */
export function mug(b, x, y, z) { b.add('dm_enamel', new THREE.CylinderGeometry(0.04, 0.036, 0.085, 14), { pos: [x, y + 0.043, z] }, { uv: false }); b.add('dm_enamelRim', new THREE.TorusGeometry(0.04, 0.004, 4, 14), { pos: [x, y + 0.086, z], rot: [Math.PI / 2, 0, 0] }, { uv: false }); b.add('dm_enamel', new THREE.TorusGeometry(0.025, 0.005, 4, 10, Math.PI), { pos: [x + 0.04, y + 0.045, z], rot: [0, 0, -Math.PI / 2] }, { uv: false }); }

/** 三脚脸盆架 + 搪瓷盆 + 毛巾杆 + 小镜 */
export function washstand(b, world, x, y, z, yaw = 0) {
  const P = at(x, y, z, yaw), R = [0, yaw, 0];
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.3; b.add('dm_frameCream', new THREE.CylinderGeometry(0.012, 0.012, 0.85, 6), { pos: P(Math.cos(a) * 0.18, 0.42, Math.sin(a) * 0.18), rot: [Math.sin(a) * 0.12, yaw, -Math.cos(a) * 0.12] }, { uv: false }); }
  b.add('dm_frameCream', new THREE.TorusGeometry(0.17, 0.01, 4, 20), { pos: P(0, 0.8, 0), rot: [Math.PI / 2, 0, 0] }, { uv: false });
  b.add('dm_frameCream', new THREE.CylinderGeometry(0.012, 0.012, 0.75, 6), { pos: P(0, 1.18, -0.2), rot: R }, { uv: false });
  b.add('dm_frameCream', new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), { pos: P(0, 1.45, -0.2), rot: [0, yaw, Math.PI / 2] }, { uv: false });
  const basin = new THREE.LatheGeometry([new THREE.Vector2(0.0, 0), new THREE.Vector2(0.12, 0.0), new THREE.Vector2(0.2, 0.08), new THREE.Vector2(0.215, 0.09)], 24);
  b.add('dm_enamel', basin, { pos: P(0, 0.79, 0) }, { uv: false }); b.add('dm_enamelRim', new THREE.TorusGeometry(0.215, 0.007, 4, 24), { pos: P(0, 0.88, 0), rot: [Math.PI / 2, 0, 0] }, { uv: false });
  b.add('dm_towel', new THREE.PlaneGeometry(0.32, 0.5), { pos: P(0, 1.22, -0.19), rot: R }, { uv: false });
  b.add('dm_sillWhite', new THREE.BoxGeometry(0.3, 0.4, 0.015), { pos: P(0, 1.75, -0.24), rot: R }, { uv: false });
  b.add('dm_pane', new THREE.PlaneGeometry(0.26, 0.36), { pos: P(0, 1.75, -0.23), rot: R }, { uv: false });
  mug(b, ...P(0.05, 0.8, 0.05));
  const w = P(0, 0, 0); world.box(w[0], y + 0.5, w[2], 0.45, 1, 0.45);
}

/** 墙上窗（内侧）：窗框+窗棂+亮窗玻璃+窗台+两侧酒红窗帘。墙法线朝 yaw 方向（yaw=0 → 面朝 +z） */
export function windowCurtain(b, x, y, z, yaw = 0, w = 1.8, h = 1.7) {
  const P = at(x, y, z, yaw), R = [0, yaw, 0];
  b.add('dm_pane', new THREE.PlaneGeometry(w, h), { pos: P(0, h / 2, 0.01), rot: R }, { uv: false });
  const bar = (ww, hh, lx, ly) => b.add('dm_sillWhite', new THREE.BoxGeometry(ww, hh, 0.06), { pos: P(lx, ly, 0.03), rot: R }, { uv: false });
  bar(w + 0.1, 0.06, 0, 0); bar(w + 0.1, 0.06, 0, h); bar(0.06, h, -w / 2, h / 2); bar(0.06, h, w / 2, h / 2); bar(0.04, h, 0, h / 2); bar(w, 0.04, 0, h * 0.7);
  b.add('dm_sillWhite', new THREE.BoxGeometry(w + 0.3, 0.04, 0.22), { pos: P(0, -0.02, 0.11), rot: R }, { uv: false });
  b.add('dm_frame', new THREE.CylinderGeometry(0.012, 0.012, w + 0.9, 6), { pos: P(0, h + 0.22, 0.12), rot: [0, yaw, Math.PI / 2] }, { uv: false });
  for (const sx of [-1, 1]) { const cw = 0.55, g = new THREE.PlaneGeometry(cw, h + 0.6, 16, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) / cw * Math.PI * 7) * 0.035 + 0.035); g.computeVertexNormals();
    b.add('dm_curtain', g, { pos: P(sx * (w / 2 + 0.12), h / 2 - 0.1, 0.12), rot: R }, { uv: false }); }
}

/** 软木公告栏（canvas 张贴物） */
export function noticeBoard(zone, b, x, y, z, yaw, w = 2.4, h = 1.3, title = '宿舍公告栏', notes = []) {
  const P = at(x, y, z, yaw), R = [0, yaw, 0];
  b.add('dm_desk', new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.05), { pos: P(0, 0, 0.0), rot: R }, { uv: 1 });
  const t = cv(1024, Math.round(1024 * h / w), (c, W, H) => {
    c.fillStyle = '#8a6440'; c.fillRect(0, 0, W, H); noise(c, W, H, 0.12, 9000);
    c.fillStyle = '#7a1c18'; c.fillRect(W * 0.3, 12, W * 0.4, 52); c.fillStyle = '#e8c87a'; c.font = '900 36px "NB Title", "NB Serif", serif'; c.textAlign = 'center'; c.fillText(title, W / 2, 50); c.textAlign = 'left';
    const n = notes.length; notes.forEach(([head, lines, col], i) => { const cw = (W - 40) / Math.min(n, 4), px = 20 + (i % 4) * cw + 8 + Math.sin(i * 3) * 6, py = 84 + Math.floor(i / 4) * (H * 0.45) + Math.cos(i * 5) * 6; const pw = cw - 22, ph = H - py - 20 - (n > 4 ? H * 0.45 * (1 - Math.floor(i / 4)) : 0);
      c.save(); c.translate(px + pw / 2, py + ph / 2); c.rotate(Math.sin(i * 7.7) * 0.03); c.fillStyle = col || '#efe8d6'; c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 8; c.fillRect(-pw / 2, -ph / 2, pw, ph); c.shadowBlur = 0;
      c.fillStyle = '#222'; c.font = '700 26px "NB Serif", serif'; c.fillText(head, -pw / 2 + 12, -ph / 2 + 38); c.font = '19px "NB Sans", sans-serif'; c.fillStyle = '#333'; lines.forEach((l, k) => c.fillText(l, -pw / 2 + 12, -ph / 2 + 72 + k * 28)); c.fillStyle = '#c0302a'; c.beginPath(); c.arc(0, -ph / 2 + 10, 7, 0, 7); c.fill(); c.restore(); });
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, envMapIntensity: 0.1 })); m.position.set(...P(0, 0, 0.03)); m.rotation.set(...R); zone.add(m); return m;
}

/** 暖瓶架（开水房外一排暖瓶） */
export function thermosRack(b, world, x, y, z, yaw = 0, n = 10) {
  const P = at(x, y, z, yaw), R = [0, yaw, 0], W = n * 0.2 + 0.1;
  for (const ly of [0.02, 0.62]) b.add('dm_desk', new THREE.BoxGeometry(W, 0.04, 0.32), { pos: P(0, ly + 0.0, 0), rot: R }, { uv: 1 });
  for (const sx of [-1, 1]) b.add('dm_desk', new THREE.BoxGeometry(0.04, 1.2, 0.32), { pos: P(sx * W / 2, 0.6, 0), rot: R }, { uv: 1 });
  for (let k = 0; k < n; k++) { thermos(b, ...P(-W / 2 + 0.15 + k * 0.2, 0.04, 0), 1); if (k % 3 !== 1) thermos(b, ...P(-W / 2 + 0.15 + k * 0.2, 0.64, 0), 1); }
  const w = P(0, 0, 0); world.box(w[0], y + 0.6, w[2], Math.abs(Math.cos(yaw)) * W + Math.abs(Math.sin(yaw)) * 0.34, 1.2, Math.abs(Math.sin(yaw)) * W + Math.abs(Math.cos(yaw)) * 0.34);
}

/** 吸顶日光灯（灯箱 + 自发光灯管） */
export function tubeLamp(b, x, y, z, yaw = 0, shade = false) { b.add('dm_sillWhite', new THREE.BoxGeometry(1.25, 0.06, 0.22), { pos: [x, y - 0.03, z], rot: [0, yaw, 0] }, { uv: false }); b.add('dz_glowCold', new THREE.CylinderGeometry(0.018, 0.018, 1.18, 8), { pos: [x, y - 0.075, z], rot: [0, yaw, Math.PI / 2] }, { uv: false });
  if (shade) { // 批次22：搪瓷灯罩（两片外撇反光板 + 端板），宿舍 3F 用
    for (const sd of [-1, 1]) { const g = new THREE.BoxGeometry(1.3, 0.01, 0.15); g.rotateX(sd * 0.75); b.add('dm_sillWhite', g, { pos: [x + Math.sin(yaw) * sd * 0.155, y - 0.11, z + Math.cos(yaw) * sd * 0.155], rot: [0, yaw, 0] }, { uv: false }); }
    for (const sd of [-1, 1]) b.add('dm_sillWhite', new THREE.BoxGeometry(0.01, 0.11, 0.24), { pos: [x + Math.cos(yaw) * sd * 0.65, y - 0.1, z - Math.sin(yaw) * sd * 0.65], rot: [0, yaw, 0] }, { uv: false }); } }
