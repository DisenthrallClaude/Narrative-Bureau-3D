// 布景加密工具包（M4）：护墙板/壁柱/踢脚/檐口、藻井天花、地毯与拼花、成组家具、GLB 实例化（InstancedMesh）
// 所有静态几何走 Batch 合批；重复的 GLB 小件走 Props（每个子网格一个 InstancedMesh）
import * as THREE from 'three';
import { loadModel, pbr } from '../engine/assets.js';
import { weather } from '../engine/weather.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// —————————————————— 材质 ——————————————————
let DM = null;
export function dressMats(M) {
  if (DM) return DM;
  const tex = (draw, w = 512, h = 512, rep = [1, 1]) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; };
  const damask = (bg, fg, line) => tex((c, w, h) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    // 竖条纹 + 菱形缠枝（大马士革纹的简化），四方连续
    c.globalAlpha = 0.35; c.fillStyle = line; for (let x = 0; x < w; x += 64) c.fillRect(x, 0, 2, h); c.globalAlpha = 1;
    const motif = (cx, cy, s) => { c.save(); c.translate(cx, cy); c.strokeStyle = fg; c.fillStyle = fg; c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * 0.7, -s * 0.5, s * 0.7, s * 0.5, 0, s); c.bezierCurveTo(-s * 0.7, s * 0.5, -s * 0.7, -s * 0.5, 0, -s); c.stroke();
      c.beginPath(); c.arc(0, 0, s * 0.18, 0, 7); c.fill();
      for (const sy of [-1, 1]) { c.beginPath(); c.moveTo(0, sy * s * 0.35); c.quadraticCurveTo(s * 0.45, sy * s * 0.15, s * 0.3, sy * s * 0.6); c.moveTo(0, sy * s * 0.35); c.quadraticCurveTo(-s * 0.45, sy * s * 0.15, -s * 0.3, sy * s * 0.6); c.stroke(); }
      c.restore(); };
    for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h], [w / 2, h / 2]]) motif(x, y, 110);
    for (const [x, y] of [[w / 2, 0], [w / 2, h], [0, h / 2], [w, h / 2]]) motif(x, y, 40);
  }, 512, 512);
  const tile = (bg, grout, n) => tex((c, w, h) => { c.fillStyle = grout; c.fillRect(0, 0, w, h); const s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = (Math.sin(i * 12.9 + j * 78.2) * 43758.5) % 1; c.fillStyle = bg; c.globalAlpha = 0.92 + Math.abs(v) * 0.08; c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); } c.globalAlpha = 1; });
  const parquet = () => tex((c, w, h) => { const s = w / 8; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const v = Math.abs(Math.sin(i * 3.1 + j * 7.7) * 1000) % 1; c.fillStyle = `rgb(${70 + v * 30 | 0},${46 + v * 20 | 0},${30 + v * 12 | 0})`; c.fillRect(i * s, j * s, s, s); c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2; if ((i + j) % 2) { for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(i * s + (k * s) / 4, j * s); c.lineTo(i * s + (k * s) / 4, j * s + s); c.stroke(); } } else { for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(i * s, j * s + (k * s) / 4); c.lineTo(i * s + s, j * s + (k * s) / 4); c.stroke(); } } c.strokeRect(i * s, j * s, s, s); } });
  const checker = (a, b, grout, n) => tex((c, w, h) => { c.fillStyle = grout; c.fillRect(0, 0, w, h); const s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = Math.abs(Math.sin(i * 12.9 + j * 78.2) * 43758.5) % 1; c.fillStyle = (i + j) % 2 ? b : a; c.globalAlpha = 0.9 + v * 0.1; c.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3); } c.globalAlpha = 1; });
  // 磨损贴花：通道中线的走磨发亮 + 鞋印脏污（alpha），沿 v 方向四方连续
  const wearTex = () => tex((c, w, h) => { c.clearRect(0, 0, w, h); for (let k = 0; k < 900; k++) { const x = w / 2 + (Math.random() + Math.random() + Math.random() - 1.5) * w * 0.42, y = Math.random() * h, r = 2 + Math.random() * 10; const d = Math.random() < 0.6; c.fillStyle = d ? `rgba(30,24,18,${0.05 + Math.random() * 0.08})` : `rgba(255,250,235,${0.03 + Math.random() * 0.05})`; c.beginPath(); c.ellipse(x, y, r * 0.6, r, Math.random(), 0, 7); c.fill(); } const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(25,20,15,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }, 256, 512);
  const hazardTex = () => tex((c, w, h) => { c.fillStyle = '#c8a020'; c.fillRect(0, 0, w, h); c.fillStyle = '#141414'; for (let k = -w; k < w * 2; k += 64) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + 32, 0); c.lineTo(k + 32 - h, h); c.lineTo(k - h, h); c.fill(); } }, 256, 64);
  const rugTex = (inner, border, gold) => tex((c, w, h) => { c.fillStyle = border; c.fillRect(0, 0, w, h); c.strokeStyle = gold; c.lineWidth = 6; c.strokeRect(18, 18, w - 36, h - 36); c.lineWidth = 2; c.strokeRect(34, 34, w - 68, h - 68); c.fillStyle = inner; c.fillRect(48, 48, w - 96, h - 96); c.strokeStyle = gold; c.globalAlpha = 0.5; c.lineWidth = 2; for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(w / 2, h / 2, 40 + k * 26, 24 + k * 16, 0, 0, 7); c.stroke(); } c.globalAlpha = 0.25; for (let x = 70; x < w - 70; x += 28) for (let y = 70; y < h - 70; y += 28) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.stroke(); } c.globalAlpha = 1; }, 512, 768);
  const W = (m, o) => weather(m, o);
  DM = {
    dz_wain: W(pbr('Wood051', { color: 0x4a3222, roughness: 0.5, env: 0.6 }), { macro: 0.12, grime: 0.2, ground: 1.0 }),
    dz_wain2: W(pbr('Wood051', { color: 0x5e4230, roughness: 0.42, env: 0.7 }), { macro: 0.1 }),
    dz_base: M.stoneDark,
    dz_pil: W(pbr('Marble016', { rn: true, color: 0x2a2a30, roughness: 0.34, env: 0.6 }), { macro: 0.12, grime: 0.2, ground: 1.2 }),
    dz_damask: W(new THREE.MeshStandardMaterial({ map: damask('#1d2232', '#4a5270', '#2a3046'), roughness: 0.85, envMapIntensity: 0.4 }), { macro: 0.15, grime: 0.15 }),
    dz_damaskRed: W(new THREE.MeshStandardMaterial({ map: damask('#3a1416', '#6a2a26', '#4a1c1c'), roughness: 0.85, envMapIntensity: 0.4 }), { macro: 0.15, grime: 0.15 }),
    dz_damaskGreen: W(new THREE.MeshStandardMaterial({ map: damask('#1a2a22', '#3e5a48', '#22362c'), roughness: 0.85, envMapIntensity: 0.4 }), { macro: 0.15, grime: 0.15 }),
    dz_plaster: W(pbr('Concrete034', { color: 0x8a8070, roughness: 0.85, env: 0.3 }), { macro: 0.2, grime: 0.25, streak: 0.1 }),
    dz_ceil: W(new THREE.MeshStandardMaterial({ color: 0x3e3830, roughness: 0.92, envMapIntensity: 0.2 }), { macro: 0.25, grime: 0.1 }),
    dz_beam: W(pbr('Wood051', { color: 0x2a1c14, roughness: 0.6, env: 0.3 }), { macro: 0.12 }),
    dz_tileW: W(new THREE.MeshStandardMaterial({ map: tile('#c8ccc6', '#7a7e7a', 8), roughness: 0.3, envMapIntensity: 0.6 }), { macro: 0.15, grime: 0.35, ground: 1.2 }),
    dz_tileG: W(new THREE.MeshStandardMaterial({ map: tile('#4c6658', '#2a3430', 8), roughness: 0.3, envMapIntensity: 0.6 }), { macro: 0.15, grime: 0.3, ground: 1.2 }),
    dz_tileB: W(new THREE.MeshStandardMaterial({ map: tile('#1a1c22', '#3a3a40', 4), roughness: 0.35, envMapIntensity: 0.5 }), { macro: 0.12, grime: 0.3 }),
    dz_paintClinic: W(pbr('Concrete034', { color: 0xa8b0a6, roughness: 0.8, env: 0.3 }), { macro: 0.12, grime: 0.15 }),
    dz_paintLow: W(new THREE.MeshStandardMaterial({ color: 0x2c3a34, roughness: 0.55, metalness: 0.1 }), { macro: 0.2, grime: 0.5, ground: 1.2, streak: 0.2 }),
    dz_paintUp: W(pbr('Concrete034', { color: 0x6c6e6a, roughness: 0.8, env: 0.3 }), { macro: 0.25, grime: 0.3, streak: 0.25 }),
    dz_parquet: W(new THREE.MeshStandardMaterial({ map: parquet(), roughness: 0.42, envMapIntensity: 0.5 }), { macro: 0.15, dust: 0.15 }),
    dz_rugRed: new THREE.MeshStandardMaterial({ map: rugTex('#4a1418', '#1a1a2a', '#b08a40'), roughness: 1 }),
    dz_rugNavy: new THREE.MeshStandardMaterial({ map: rugTex('#14203e', '#3a1014', '#b08a40'), roughness: 1 }),
    dz_rugGreen: new THREE.MeshStandardMaterial({ map: rugTex('#163024', '#121418', '#a08040'), roughness: 1 }),
    dz_paper: new THREE.MeshStandardMaterial({ color: 0xe6dfcc, roughness: 0.85 }),
    dz_paper2: new THREE.MeshStandardMaterial({ color: 0xd8cfb4, roughness: 0.85 }),
    dz_bakelite: new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.25, metalness: 0.1 }),
    dz_redPhone: new THREE.MeshStandardMaterial({ color: 0x7a0c10, roughness: 0.25, metalness: 0.1 }),
    dz_cable: new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.6, metalness: 0.4 }),
    dz_pipe: W(new THREE.MeshStandardMaterial({ color: 0x5a5e62, roughness: 0.45, metalness: 0.8 }), { macro: 0.2, tarnish: 0.4 }),
    dz_pipeRed: W(new THREE.MeshStandardMaterial({ color: 0x6a1a16, roughness: 0.5, metalness: 0.5 }), { macro: 0.2, tarnish: 0.3 }),
    dz_glow: new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd9a0, emissiveIntensity: 3.5, roughness: 0.5 }),
    dz_glowCold: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdfe8ff, emissiveIntensity: 3.0, roughness: 0.5 }),
    dz_shade: new THREE.MeshStandardMaterial({ color: 0xf0e2c4, emissive: 0xffc888, emissiveIntensity: 1.2, roughness: 0.8, side: THREE.DoubleSide }),
    dz_glassDark: new THREE.MeshPhysicalMaterial({ color: 0x0a0e14, roughness: 0.08, metalness: 0.2, envMapIntensity: 0.6, clearcoat: 1 }),
    dz_leaves: (() => { const m = M.foliage.clone(); m.color.set(0x7fa868); m.side = THREE.DoubleSide; return m; })(),
    dz_stem: new THREE.MeshStandardMaterial({ color: 0x4a5a30, roughness: 0.8 }),
    dz_soil: new THREE.MeshStandardMaterial({ color: 0x1c140e, roughness: 1 }),
    dz_brassDim: W(new THREE.MeshStandardMaterial({ color: 0x7a5e34, metalness: 0.85, roughness: 0.55, envMapIntensity: 0.5 }), { macro: 0.15, tarnish: 0.4 }),
    dz_cork: new THREE.MeshStandardMaterial({ color: 0x8a6440, roughness: 1 }),
    // —— R3 批次3：地面分区材质（走廊石材 / 办公地毯 / 茶水间地砖 / 库房地胶）+ 磨损贴花 ——
    r3_corr: W(pbr('Terrazzo005', { rn: true, color: 0xc9c1b2, roughness: 0.42, env: 0.4 }), { macro: 0.16, dust: 0.08, rough: 0.25 }),
    r3_check: W(pbr('Terrazzo005', { rn: true, color: 0x9c968a, roughness: 0.5, env: 0.45 }), { macro: 0.16, grime: 0.12, dust: 0.06 }), // 批次4：走廊棋盘 → 暖灰水磨石
    r3_stoneBorder: W(pbr('Marble016', { rn: true, color: 0x3a3632, roughness: 0.4, env: 0.5 }), { macro: 0.1 }),
    r3_carpet: W(pbr('Carpet012', { color: 0x5c6c7c, roughness: 1 }), { macro: 0.22, dust: 0.1 }),
    r3_carpetGreen: W(pbr('Carpet012', { color: 0x46564a, roughness: 1 }), { macro: 0.22, dust: 0.1 }),
    r3_carpetRed: W(pbr('Carpet012', { color: 0x6a2a2a, roughness: 1 }), { macro: 0.2, dust: 0.1 }),
    r3_carpetBrown: W(pbr('Carpet012', { color: 0x6a5440, roughness: 1 }), { macro: 0.22, dust: 0.1 }),
    r3_tile: W(new THREE.MeshStandardMaterial({ map: tile('#9a9484', '#6a6456', 8), roughness: 0.45, envMapIntensity: 0.4 }), { macro: 0.14, dust: 0.1 }),
    r3_lino: W(pbr('Concrete036', { color: 0x6e7a70, roughness: 0.55, env: 0.35 }), { macro: 0.25, dust: 0.15, rough: 0.3 }),
    r3_epoxy: W(pbr('Concrete036', { color: 0x7a7c78, roughness: 0.5, env: 0.3 }), { macro: 0.3, dust: 0.2, rough: 0.3 }),
    r3_parquet: W(new THREE.MeshStandardMaterial({ map: parquet(), roughness: 0.4, envMapIntensity: 0.5, color: 0xd8c0a0 }), { macro: 0.15, dust: 0.1 }),
    r3_wear: new THREE.MeshStandardMaterial({ map: wearTex(), transparent: true, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, color: 0xffffff }),
    r3_steelOld: W(new THREE.MeshStandardMaterial({ color: 0x5c5e58, roughness: 0.6, metalness: 0.7, envMapIntensity: 0.5 }), { macro: 0.25, tarnish: 0.5, grime: 0.3, ground: 0 }),
    r3_steelGrey: W(new THREE.MeshStandardMaterial({ color: 0x77786f, roughness: 0.55, metalness: 0.55, envMapIntensity: 0.5 }), { macro: 0.2, tarnish: 0.3 }),
    r3_glassCase: new THREE.MeshPhysicalMaterial({ color: 0xdfe8e4, roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: 0.18, envMapIntensity: 0.8, depthWrite: false }),
    r3_globe: new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xffe2b8, emissiveIntensity: 2.4, roughness: 0.4 }),
    r3_screen: new THREE.MeshStandardMaterial({ color: 0x0a1a12, emissive: 0x4ad08a, emissiveIntensity: 0.9, roughness: 0.3 }),
    r3_screenAmber: new THREE.MeshStandardMaterial({ color: 0x1a1006, emissive: 0xffa040, emissiveIntensity: 0.8, roughness: 0.3 }),
    r3_mapPaper: new THREE.MeshStandardMaterial({ color: 0xcfc3a0, roughness: 0.85 }),
    r3_hazard: new THREE.MeshStandardMaterial({ map: hazardTex(), roughness: 0.7 }),
    r3_paintYellow: W(new THREE.MeshStandardMaterial({ color: 0xc8a020, roughness: 0.7 }), { macro: 0.3, dust: 0.2 }),
  };
  for (const m of [DM.dz_glow, DM.dz_glowCold, DM.dz_shade, DM.dz_glassDark, DM.r3_globe, DM.r3_wear, DM.r3_glassCase, DM.r3_screen, DM.r3_screenAmber]) m.userData.noShadow = true;
  return DM;
}

// —————————————————— GLB 实例化 ——————————————————
export class Props {
  constructor() { this.items = new Map(); }
  /** o: { h: 目标高度 | w: 目标宽度 | s: 缩放, yaw, rx, rz } */
  add(name, pos, o = {}) { if (!this.items.has(name)) this.items.set(name, []); this.items.get(name).push({ pos, ...o }); return this; }
  async build(parent, { shadow = true } = {}) {
    const out = [];
    await Promise.all([...this.items].map(async ([name, list]) => {
      const src = await loadModel(name); src.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(src); if (box.isEmpty()) return;
      const size = box.getSize(V3()), c = box.getCenter(V3());
      const center = new THREE.Matrix4().makeTranslation(-c.x, -box.min.y, -c.z);
      const meshes = []; src.traverse((o) => { if (o.isMesh) meshes.push(o); });
      const inst = list.map((it) => { const s = it.h ? it.h / size.y : it.w ? it.w / size.x : it.d ? it.d / size.z : (it.s ?? 1); const sv = it.fit ? V3(it.fit[0] / size.x, it.fit[1] / size.y, it.fit[2] / size.z) : V3(s, s, s); return new THREE.Matrix4().compose(V3(...it.pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(it.rx ?? 0, it.yaw ?? 0, it.rz ?? 0, 'YXZ')), sv).multiply(center); });
      for (const m of meshes) {
        const im = new THREE.InstancedMesh(m.geometry, m.material, list.length);
        inst.forEach((mt, i) => im.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(mt, m.matrixWorld)));
        im.instanceMatrix.needsUpdate = true; im.castShadow = shadow && list.length < 300; im.receiveShadow = true; im.computeBoundingSphere(); im.name = 'props:' + name;
        parent.add(im); out.push(im);
      }
    }));
    return out;
  }
}

// —————————————————— 局部坐标系（墙面） ——————————————————
/** 墙面坐标：原点在墙面起点，+x 沿墙，+z 指向室内（法线 n），+y 向上 */
class WallFrame {
  constructor(sx, sz, n, y) { this.yaw = Math.atan2(n[0], n[1]); this.m = new THREE.Matrix4().compose(V3(sx, y, sz), new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), this.yaw), V3(1, 1, 1)); }
  at(x, y, z, rot = [0, 0, 0]) { return new THREE.Matrix4().multiplyMatrices(this.m, new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), V3(1, 1, 1))); }
  world(x, y, z) { return V3(x, y, z).applyMatrix4(this.m); }
}
/** 由墙面中心、长度、室内法线得到起点（沿墙方向 u = (nz, -nx)） */
export function wallSeg(cx, cz, len, n, y) { const u = [n[1], -n[0]]; return new WallFrame(cx - u[0] * len / 2, cz - u[1] * len / 2, n, y); }

const STYLES = {
  // 机构正式：深色胡桃护墙板 + 大马士革墙布 + 黑石壁柱 + 金线
  office: { low: 'dz_wain', field: 'dz_wain2', up: 'dz_damask', pil: 'dz_pil', base: 'dz_base', crown: 'dz_pil', trim: 'gold', lowH: 1.15 },
  red: { low: 'dz_wain', field: 'dz_wain2', up: 'dz_damaskRed', pil: 'dz_pil', base: 'dz_base', crown: 'dz_pil', trim: 'gold', lowH: 1.15 },
  green: { low: 'dz_wain', field: 'dz_wain2', up: 'dz_damaskGreen', pil: 'dz_wain', base: 'dz_base', crown: 'dz_wain', trim: 'brass', lowH: 1.15 },
  // 黑石：黑大理石墙裙 + 暖灰抹灰 + 黑石壁柱
  stone: { low: 'dz_pil', field: 'stoneDark', up: 'dz_plaster', pil: 'dz_pil', base: 'dz_base', crown: 'dz_pil', trim: 'gold', lowH: 1.3 },
  // 医务/实验：白瓷砖墙裙 + 灰绿涂料，不锈钢护角
  clinic: { low: 'dz_tileW', field: null, up: 'dz_paintClinic', pil: 'dz_wain', base: 'dz_base', crown: 'dz_wain', trim: 'steel', lowH: 1.25, pilW: 0.12 },
  // 地下：墨绿油漆墙裙 + 混凝土，管线与桥架
  bunker: { low: 'dz_paintLow', field: null, up: 'dz_paintUp', pil: 'blackMetal', base: 'blackMetal', crown: 'blackMetal', trim: 'hazard', lowH: 1.2, pilW: 0.3, pipes: true },
};

/**
 * 墙面布景：踢脚、护墙板（分格线脚）、腰线金线、上墙面墙布、壁柱（柱础+柱头）、檐口线脚
 * o: { style, pitch: 壁柱间距, skip: [[a,b],...] 沿墙不铺的区间（门洞/窗）, sconce: 壁灯, top: 檐口高度(默认 h) }
 */
export function wallDress(b, f, len, h, o = {}) {
  const S = { ...STYLES[o.style ?? 'office'], ...(o.over ?? {}) };
  const skip = (o.skip ?? []).map(([a, c]) => [Math.min(a, c), Math.max(a, c)]).sort((p, q) => p[0] - q[0]);
  const runs = []; let cur = 0; for (const [a, c] of skip) { if (a > cur + 0.05) runs.push([cur, a]); cur = Math.max(cur, c); } if (len > cur + 0.05) runs.push([cur, len]);
  const lowH = S.lowH, crownH = 0.32, top = o.top ?? h;
  const B = (key, w, hh, d, x, y, z, rot) => { if (key) b.add(key, new THREE.BoxGeometry(w, hh, d), f.at(x, y, z, rot), { uv: key.startsWith('dz_damask') ? 1.6 : key.startsWith('dz_tile') ? 1.0 : 0.6 }); };
  for (const [a, c] of runs) {
    const L = c - a, mid = (a + c) / 2;
    B(S.base, L, 0.2, 0.06, mid, 0.1, 0.03);
    B(S.low, L, lowH - 0.2, 0.03, mid, 0.2 + (lowH - 0.2) / 2, 0.015);
    if (S.field) { const n = Math.max(1, Math.round(L / 1.25)), bw = L / n; for (let k = 0; k < n; k++) { const x = a + bw * (k + 0.5); B(S.field, bw - 0.28, lowH - 0.62, 0.03, x, 0.2 + (lowH - 0.2) / 2, 0.04); for (const sx of [-1, 1]) B(S.low, 0.07, lowH - 0.3, 0.05, x + sx * (bw / 2 - 0.06), 0.2 + (lowH - 0.2) / 2, 0.03); } B(S.low, L, 0.07, 0.05, mid, 0.33, 0.03); B(S.low, L, 0.07, 0.05, mid, lowH - 0.12, 0.03); }
    B(S.crown === 'dz_pil' ? 'dz_pil' : S.low, L, 0.09, 0.08, mid, lowH + 0.02, 0.04); B(S.trim, L, 0.018, 0.085, mid, lowH - 0.035, 0.045);
    if (S.up) B(S.up, L, top - lowH - crownH - 0.06, 0.02, mid, lowH + 0.06 + (top - lowH - crownH - 0.06) / 2, 0.012);
    // 檐口：三层退台 + 金线
    B(S.crown, L, 0.12, 0.12, mid, top - 0.06, 0.06); B(S.crown, L, 0.1, 0.2, mid, top - 0.17, 0.1); B(S.crown, L, 0.06, 0.07, mid, top - 0.27, 0.035); B(S.trim, L, 0.02, 0.21, mid, top - 0.225, 0.105);
    // 画镜线
    if (S.up && top - lowH > 3.2) B(S.trim === 'hazard' ? 'blackMetal' : 'brass', L, 0.025, 0.03, mid, top - 0.62, 0.025);
    // 壁柱
    const pitch = o.pitch ?? 4.2; const np = Math.max(1, Math.floor(L / pitch)); const pw = S.pilW ?? 0.5;
    for (let k = 0; k <= np; k++) {
      const x = a + (L * k) / np; const xx = Math.min(c - pw / 2 - 0.02, Math.max(a + pw / 2 + 0.02, x));
      const ph = top - 0.3;
      const pskip = o.pil === false || (o.pilSkip ?? []).some(([p0, p1]) => xx > Math.min(p0, p1) - pw && xx < Math.max(p0, p1) + pw);
      if (!pskip) B(S.pil, pw, ph, 0.14, xx, ph / 2, 0.07);
      if (pw > 0.3 && !pskip) { B(S.base, pw + 0.16, 0.42, 0.22, xx, 0.21, 0.11); B(S.crown, pw + 0.18, 0.28, 0.24, xx, ph - 0.14, 0.12); B(S.trim, pw + 0.2, 0.03, 0.25, xx, ph - 0.3, 0.125); B(S.trim, 0.025, ph - 1.2, 0.02, xx, 0.6 + (ph - 1.2) / 2, 0.145); }
      if (o.sconce && k > 0 && k < np + (np === 1 ? 1 : 0)) {
        const sx = a + (L * (k - 0.5)) / np; const sy = Math.min(top - 0.9, 2.5);
        b.add('brass', new THREE.BoxGeometry(0.12, 0.22, 0.04), f.at(sx, sy, 0.03), { uv: 1 });
        b.add('brass', new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), f.at(sx, sy + 0.05, 0.13, [Math.PI / 2, 0, 0]), { uv: 1 });
        b.add('dz_shade', new THREE.CylinderGeometry(0.07, 0.11, 0.18, 12, 1, true), f.at(sx, sy + 0.14, 0.24), { uv: false });
        b.add('dz_glow', new THREE.SphereGeometry(0.035, 8, 6), f.at(sx, sy + 0.1, 0.24), { uv: false });
      }
    }
    if (S.pipes) { // 沿墙管线：三根水平管 + 卡箍
      for (const [py, r, key] of [[top - 0.55, 0.06, 'dz_pipe'], [top - 0.78, 0.045, 'dz_pipeRed'], [top - 0.98, 0.04, 'dz_pipe']]) { b.add(key, new THREE.CylinderGeometry(r, r, L, 8), f.at(mid, py, 0.2, [0, 0, Math.PI / 2]), { uv: 1 }); for (let x = a + 0.6; x < c; x += 2.2) b.add('blackMetal', new THREE.BoxGeometry(0.05, r * 2.6, 0.24), f.at(x, py, 0.1), { uv: 1 }); }
    }
  }
}

/** 房间四面墙一次性布景：x0..x1, z0(南,大)..z1(北,小)，each: {s,n,e,w} 选项覆盖（skip 以各墙自身起点计） */
export function roomDress(b, x0, x1, z0, z1, y, h, o = {}) {
  const inset = o.inset ?? 0;
  const W = x1 - x0, D = z0 - z1;
  // 北墙（z1，法线 +z），起点在西端
  if (o.n !== false) wallDress(b, wallSeg((x0 + x1) / 2, z1 + inset, W, [0, 1], y), W, h, { ...o, ...(o.n ?? {}) });
  // 南墙（z0，法线 -z），起点在东端（沿墙方向 u=(-1,0)）
  if (o.s !== false) wallDress(b, wallSeg((x0 + x1) / 2, z0 - inset, W, [0, -1], y), W, h, { ...o, ...(o.s ?? {}) });
  // 西墙（x0，法线 +x），沿墙方向 u=(0,-1) 起点在南端
  if (o.w !== false) wallDress(b, wallSeg(x0 + inset, (z0 + z1) / 2, D, [1, 0], y), D, h, { ...o, ...(o.w ?? {}) });
  // 东墙（x1，法线 -x），u=(0,1) 起点在北端
  if (o.e !== false) wallDress(b, wallSeg(x1 - inset, (z0 + z1) / 2, D, [-1, 0], y), D, h, { ...o, ...(o.e ?? {}) });
}

/** 藻井天花：主次梁格栅 + 凹板 + 金线 + 每格中央筒灯（发光） */
export function coffered(b, x0, x1, z0, z1, y, o = {}) {
  const cell = o.cell ?? 3, d = o.depth ?? 0.38, beam = o.beam ?? 'dz_beam', trim = o.trim ?? 'dz_brassDim'; // M5：藻井金线改哑光暗铜，原抛光黄铜偏亮
  const nx = Math.max(1, Math.round((x1 - x0) / cell)), nz = Math.max(1, Math.round((z0 - z1) / cell));
  const cx = (x1 - x0) / nx, cz = (z0 - z1) / nz;
  b.box(o.panel ?? 'dz_ceil', x1 - x0, 0.04, z0 - z1, [(x0 + x1) / 2, y - 0.02, (z0 + z1) / 2], { uv: 0.3 });
  for (let i = 0; i <= nx; i++) { const x = x0 + i * cx; b.box(beam, 0.32, d, z0 - z1, [x, y - d / 2, (z0 + z1) / 2], { uv: 0.5 }); b.box(trim, 0.34, 0.025, z0 - z1, [x, y - d + 0.01, (z0 + z1) / 2], { uv: 1 }); }
  for (let j = 0; j <= nz; j++) { const z = z1 + j * cz; b.box(beam, x1 - x0, d, 0.32, [(x0 + x1) / 2, y - d / 2, z], { uv: 0.5 }); b.box(trim, x1 - x0, 0.025, 0.34, [(x0 + x1) / 2, y - d + 0.01, z], { uv: 1 }); }
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x = x0 + (i + 0.5) * cx, z = z1 + (j + 0.5) * cz;
    b.box(beam, cx - 0.9, 0.06, 0.08, [x, y - 0.06, z - cz / 2 + 0.45], { uv: 0.5 }); b.box(beam, cx - 0.9, 0.06, 0.08, [x, y - 0.06, z + cz / 2 - 0.45], { uv: 0.5 });
    b.box(beam, 0.08, 0.06, cz - 0.9, [x - cx / 2 + 0.45, y - 0.06, z], { uv: 0.5 }); b.box(beam, 0.08, 0.06, cz - 0.9, [x + cx / 2 - 0.45, y - 0.06, z], { uv: 0.5 });
    if (o.lights !== false && ((i + j) % (o.lightEvery ?? 1) === 0)) { b.add('brass', new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), { pos: [x, y - 0.06, z] }, { uv: 1 }); b.add(o.cold ? 'dz_glowCold' : 'dz_glow', new THREE.CylinderGeometry(0.14, 0.14, 0.02, 16), { pos: [x, y - 0.085, z] }, { uv: false }); }
  }
}

/** 工业天花：桥架 + 风管 + 灯槽（地下层） */
export function bunkerCeiling(b, x0, x1, z0, z1, y, o = {}) {
  const step = o.step ?? 4;
  for (let x = x0 + step / 2; x < x1; x += step) { b.box('blackMetal', 0.4, 0.08, z0 - z1, [x, y - 0.35, (z0 + z1) / 2], { uv: 1 }); for (let z = z1 + 1; z < z0; z += 2.5) b.box('blackMetal', 0.03, 0.35, 0.03, [x, y - 0.18, z], { uv: 1 }); }
  b.add('dz_pipe', new THREE.CylinderGeometry(0.32, 0.32, z0 - z1, 12), { pos: [x0 + 1.2, y - 0.5, (z0 + z1) / 2], rot: [Math.PI / 2, 0, 0] }, { uv: 0.5 });
  for (let z = z1 + 2; z < z0; z += 3) b.add('blackMetal', new THREE.TorusGeometry(0.34, 0.03, 4, 16), { pos: [x0 + 1.2, y - 0.5, z] }, { uv: 1 });
  b.add('dz_pipeRed', new THREE.CylinderGeometry(0.08, 0.08, z0 - z1, 8), { pos: [x1 - 0.8, y - 0.3, (z0 + z1) / 2], rot: [Math.PI / 2, 0, 0] }, { uv: 1 });
}

/** 地毯：带边框图案的地毯（双层：底边 + 图案面） */
export function rug(b, cx, cz, w, d, y, key = 'dz_rugRed', yaw = 0) {
  b.add(key, new THREE.BoxGeometry(w, 0.02, d), { pos: [cx, y + 0.012, cz], rot: [0, yaw, 0] }, { uv: false });
}
/** 拼花地面：中央拼花 + 黄铜/黑石镶边带 */
export function floorInlay(b, x0, x1, z0, z1, y, o = {}) {
  const m = o.margin ?? 1.0, key = o.field ?? 'dz_parquet';
  b.box(key, x1 - x0 - 2 * m, 0.012, z0 - z1 - 2 * m, [(x0 + x1) / 2, y + 0.006, (z0 + z1) / 2], { uv: o.rep ?? 0.25 });
  const band = o.band ?? 'dz_base', bw = 0.22;
  for (const [x, z, w, d] of [[(x0 + x1) / 2, z0 - m, x1 - x0 - 2 * m + bw, bw], [(x0 + x1) / 2, z1 + m, x1 - x0 - 2 * m + bw, bw], [x0 + m, (z0 + z1) / 2, bw, z0 - z1 - 2 * m], [x1 - m, (z0 + z1) / 2, bw, z0 - z1 - 2 * m]]) { b.box(band, w, 0.016, d, [x, y + 0.008, z], { uv: 0.5 }); b.box('brass', w > d ? w : 0.03, 0.018, w > d ? 0.03 : d, [x, y + 0.009, z], { uv: 1 }); }
}

// —————————————————— 成组家具 ——————————————————
const rotP = (x, z, yaw, dx, dz) => [x + Math.cos(yaw) * dx + Math.sin(yaw) * dz, z - Math.sin(yaw) * dx + Math.cos(yaw) * dz];
/** 一叠纸（若干张略错位）+ 档案夹 */
export function paperStack(b, x, y, z, yaw = 0, n = 6, key = 'dz_paper') { for (let i = 0; i < n; i++) b.add(i % 3 === 2 ? 'dz_paper2' : key, new THREE.BoxGeometry(0.21, 0.006, 0.297), { pos: [x, y + 0.003 + i * 0.007, z], rot: [0, yaw + Math.sin(i * 7.3) * 0.08, 0] }, { uv: false }); }
export function folderStack(b, x, y, z, yaw = 0, n = 4) { for (let i = 0; i < n; i++) b.add(i % 2 ? 'kraft' : 'kraftDark', new THREE.BoxGeometry(0.25, 0.025, 0.33), { pos: [x, y + 0.0125 + i * 0.027, z], rot: [0, yaw + Math.sin(i * 3.1) * 0.1, 0] }, { uv: 2 }); }
/** 老式拨盘电话 */
export function telephone(b, x, y, z, yaw = 0, key = 'dz_bakelite') {
  b.add(key, new THREE.BoxGeometry(0.2, 0.08, 0.22), { pos: [x, y + 0.04, z], rot: [-0.15, yaw, 0] }, { uv: false });
  b.add(key, new THREE.CapsuleGeometry(0.025, 0.18, 4, 8), { pos: [x, y + 0.11, z], rot: [0, yaw, Math.PI / 2] }, { uv: false });
  b.add('brass', new THREE.CylinderGeometry(0.05, 0.05, 0.01, 16), { pos: [x, y + 0.075, z + 0.06], rot: [-0.6, yaw, 0] }, { uv: 1 });
}
/** 垃圾桶（金属网格感，用细竖条） */
export function bin(b, x, y, z) { b.add('blackMetal', new THREE.CylinderGeometry(0.17, 0.14, 0.4, 14, 1, true), { pos: [x, y + 0.2, z] }, { uv: 1 }); b.add('blackMetal', new THREE.CylinderGeometry(0.14, 0.14, 0.01, 14), { pos: [x, y + 0.005, z] }, { uv: 1 }); b.add('dz_paper', new THREE.IcosahedronGeometry(0.07, 0), { pos: [x + 0.03, y + 0.33, z] }, { uv: false }); }
/** 落地绿植（程序化：陶盆 + 叶团），比 GLB 便宜 */
export function plantPot(b, x, y, z, s = 1) {
  b.add('stoneDark', new THREE.CylinderGeometry(0.26 * s, 0.2 * s, 0.5 * s, 14), { pos: [x, y + 0.25 * s, z] }, { uv: 0.5 });
  b.add('gold', new THREE.TorusGeometry(0.26 * s, 0.015, 4, 20), { pos: [x, y + 0.5 * s, z], rot: [Math.PI / 2, 0, 0] }, { uv: 1 });
  b.add('dz_soil', new THREE.CylinderGeometry(0.24 * s, 0.24 * s, 0.02, 12), { pos: [x, y + 0.48 * s, z] }, { uv: false });
  // M6：原 7 个深色二十面体读成「黑球」→ 改为放射状叶片（扁锥）+ 中心茎，亮绿
  for (let k = 0; k < 16; k++) { const a = k * 2.399, tilt = 0.25 + (k % 4) * 0.22, L = (0.55 + (k % 3) * 0.18) * s; const g = new THREE.ConeGeometry(0.075 * s, L, 4, 1); g.translate(0, L / 2, 0); g.scale(1, 1, 0.18);
    b.add('dz_leaves', g, { pos: [x, y + 0.5 * s, z], rot: [Math.cos(a) * tilt, a, Math.sin(a) * tilt] }, { uv: 0.8 }); }
  b.add('dz_stem', new THREE.CylinderGeometry(0.012 * s, 0.018 * s, 0.5 * s, 5), { pos: [x, y + 0.72 * s, z] }, { uv: false });
}
/** 办公桌组：桌（GLB）+ 台灯 + 显示器/键盘 或 文件 + 电话 + 椅 + 纸篓。face=桌面朝向（人坐的一侧）yaw */
export function deskSet(P, b, world, x, y, z, yaw = 0, o = {}) {
  const w = o.w ?? 1.6, top = y + 0.76;
  P.add('office_desk', [x, y, z], { h: 0.76, yaw });
  world?.box(x, y + 0.4, z, w, 0.8, 0.8, yaw);
  const at = (dx, dz) => rotP(x, z, yaw, dx, dz);
  if (o.lamp !== 'green') { const [lx, lz] = at(-w * 0.36, -0.15); P.add('desk_lamp', [lx, top, lz], { h: 0.45, yaw: yaw + 0.6 }); }
  else { const [lx, lz] = at(-w * 0.36, -0.15); greenLamp(b, lx, top, lz, yaw); }
  if (o.pc !== false) { const [mx, mz] = at(0.05, -0.2); P.add('monitor', [mx, top, mz], { h: 0.42, yaw }); const [kx, kz] = at(0.05, 0.12); P.add('keyboard', [kx, top, kz], { w: 0.44, yaw }); }
  const [px, pz] = at(w * 0.3, 0.05); (o.pc === false ? folderStack : paperStack)(b, px, top, pz, yaw + 0.2, 3 + ((x * 7 + z * 3) & 3));
  const [tx, tz] = at(w * 0.38, -0.22); telephone(b, tx, top, tz, yaw + 0.3, o.red ? 'dz_redPhone' : 'dz_bakelite');
  if (o.extra !== false) { const [sx, sz] = at(-w * 0.12, 0.15); P.add(((x + z) | 0) % 2 ? 'stapler' : 'notepads', [sx, top, sz], { w: ((x + z) | 0) % 2 ? 0.14 : 0.3, yaw: yaw + 0.4 }); }
  if (o.chair !== false) { const [cx, cz] = at(0, 0.75); P.add(o.chairModel ?? 'office_chair', [cx, y, cz], { h: o.chairModel === 'armchair' ? 1.0 : 1.05, yaw: yaw + Math.PI + (Math.sin(x * 3 + z) * 0.35) }); }
  if (o.bin !== false) { const [bx, bz] = at(w * 0.5 + 0.25, 0.1); bin(b, bx, y, bz); }
}
export function greenLamp(b, x, y, z, yaw = 0) {
  b.add('brass', new THREE.CylinderGeometry(0.08, 0.1, 0.03, 16), { pos: [x, y + 0.015, z] }, { uv: 1 });
  b.add('brass', new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), { pos: [x, y + 0.17, z] }, { uv: 1 });
  b.add('lampGreen', new THREE.CylinderGeometry(0.1, 0.1, 0.32, 16, 1, false, 0, Math.PI), { pos: [x, y + 0.34, z], rot: [0, yaw, Math.PI / 2], scale: [0.7, 1, 1] }, { uv: false });
  b.add('dz_glow', new THREE.BoxGeometry(0.24, 0.015, 0.08), { pos: [x, y + 0.31, z], rot: [0, yaw, 0] }, { uv: false });
}
/** 文件柜一排（GLB 实例） */
export function cabinetRow(P, world, x, y, z, yaw, n, step = 0.62, model = 'file_cabinet', h = 1.35) {
  for (let k = 0; k < n; k++) { const [cx, cz] = rotP(x, z, yaw, (k - (n - 1) / 2) * step, 0); P.add(model, [cx, y, cz], { h, yaw }); }
  const [cx, cz] = rotP(x, z, yaw, 0, 0); world?.box(cx, y + h / 2, cz, n * step, h, 0.7, yaw);
}
/** 书柜（实心木柜 + 书脊 InstancedMesh 由 Batch 盒子合并，细书脊） */
export function bookcase(b, world, x, y, z, yaw, w = 2.4, h = 3.2, d = 0.45, o = {}) {
  const f = new WallFrame(...rotP(x, z, yaw, -w / 2, 0), [Math.sin(yaw), Math.cos(yaw)], y);
  const wood = o.wood ?? 'dz_wain';
  b.add(wood, new THREE.BoxGeometry(w, h, 0.04), f.at(w / 2, h / 2, -d / 2 + 0.02), { uv: 0.6 });
  for (const sx of [0.03, w - 0.03]) b.add(wood, new THREE.BoxGeometry(0.06, h, d), f.at(sx, h / 2, 0), { uv: 0.6 });
  b.add(wood, new THREE.BoxGeometry(w + 0.12, 0.12, d + 0.08), f.at(w / 2, h - 0.06, 0.02), { uv: 0.6 }); b.add(o.trim ?? 'gold', new THREE.BoxGeometry(w + 0.13, 0.02, 0.01), f.at(w / 2, h - 0.1, d / 2 + 0.065), { uv: 1 });
  b.add(wood, new THREE.BoxGeometry(w, 0.14, d), f.at(w / 2, 0.07, 0), { uv: 0.6 });
  const shelves = Math.max(3, Math.floor((h - 0.3) / 0.42)); const sh = (h - 0.3) / shelves;
  const cols = ['leather', 'navy', 'kraftDark', 'dz_rugRed', 'leather', 'wood', 'dz_beam'];
  let seed = Math.abs(Math.round(x * 13 + z * 7));
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let s = 0; s < shelves; s++) {
    const sy = 0.14 + s * sh;
    b.add(wood, new THREE.BoxGeometry(w - 0.1, 0.03, d - 0.04), f.at(w / 2, sy, 0), { uv: 0.6 });
    if (o.empty) continue;
    let bx = 0.1; while (bx < w - 0.12) {
      if (rnd() < 0.06) { bx += 0.15 + rnd() * 0.2; continue; }
      const bw = 0.025 + rnd() * 0.045, bh = sh * (0.62 + rnd() * 0.3), bd = d * (0.6 + rnd() * 0.3); const lean = rnd() < 0.05 ? 0.18 : 0;
      b.add(cols[(rnd() * cols.length) | 0], new THREE.BoxGeometry(bw, bh, bd), f.at(bx + bw / 2, sy + 0.015 + bh / 2, 0.02 - (d - bd) / 2 + 0.02, [0, 0, lean]), { uv: 3 });
      if (rnd() < 0.3) b.add('gold', new THREE.BoxGeometry(bw + 0.002, 0.012, bd * 0.2), f.at(bx + bw / 2, sy + 0.015 + bh * 0.82, 0.02 - (d - bd) / 2 + 0.02 + bd * 0.41), { uv: false });
      bx += bw + 0.003;
    }
  }
  world?.box(x, y + h / 2, z, w, h, d, yaw);
}
/** 指示牌（吊挂式：黑底金字），文本放 Canvas */
export function hangingSign(zone, M, text, x, y, z, yaw = 0, w = 1.6) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const c = cv.getContext('2d');
  c.fillStyle = '#0c0d10'; c.fillRect(0, 0, 512, 128); c.strokeStyle = '#c9a052'; c.lineWidth = 5; c.strokeRect(8, 8, 496, 112);
  c.fillStyle = '#e8c87a'; c.font = '900 54px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 256, 66, 470);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.35, roughness: 0.4 });
  const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.BoxGeometry(w, w / 4, 0.04), [M.blackMetal, M.blackMetal, M.blackMetal, M.blackMetal, m, m]); g.add(p);
  for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.6), M.brass); r.position.set(sx * w * 0.4, w / 8 + 0.3, 0); g.add(r); }
  g.position.set(x, y, z); g.rotation.y = yaw; zone.add(g); return g;
}

// —————————————————— 书脊贴图（细书脊，一张图覆盖 2 m 书架） ——————————————————
let _spine = null;
export function spineMaterial() {
  if (_spine) return _spine;
  const W = 2048, H = 256; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const bump = document.createElement('canvas'); bump.width = W; bump.height = H; const bc = bump.getContext('2d');
  c.fillStyle = '#0a0806'; c.fillRect(0, 0, W, H); bc.fillStyle = '#000'; bc.fillRect(0, 0, W, H);
  const pal = ['#6a2a1e', '#2e4a2a', '#24386a', '#7a5432', '#3e2a1e', '#8a6a44', '#5a3a56', '#2a2e36', '#9a7646', '#4a4232', '#7a2626', '#2a4646', '#b09060', '#1e2a4a'];
  let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  let x = 0;
  while (x < W) {
    if (r() < 0.025) { x += 10 + r() * 30; continue; }
    const w = 9 + r() * 26, h = H * (0.66 + r() * 0.32), col = pal[(r() * pal.length) | 0];
    const top = H - h;
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.25, col); g.addColorStop(0.7, col); g.addColorStop(1, 'rgba(0,0,0,0.6)');
    c.fillStyle = g; c.fillRect(x, top, w - 1, h);
    const gold = r() < 0.6; c.fillStyle = gold ? '#b8904a' : '#c8b896';
    const nb = 1 + ((r() * 3) | 0); for (let k = 0; k < nb; k++) c.fillRect(x + 1, top + h * (0.08 + k * 0.05), w - 3, 2);
    if (r() < 0.7) { c.fillRect(x + 1, top + h * 0.82, w - 3, 2); c.globalAlpha = 0.8; c.fillRect(x + w * 0.3, top + h * 0.3, w * 0.35, h * 0.28); c.globalAlpha = 1; c.fillStyle = col; c.fillRect(x + w * 0.3 + 1, top + h * 0.3 + 1, w * 0.35 - 2, h * 0.28 - 2); }
    bc.fillStyle = '#9a9a9a'; bc.fillRect(x + 1, top, w - 2, h); bc.fillStyle = '#ffffff'; bc.fillRect(x + w * 0.3, top, w * 0.4, h);
    x += w;
  }
  const T = (cvs, srgb) => { const t = new THREE.CanvasTexture(cvs); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  _spine = new THREE.MeshStandardMaterial({ map: T(cv, true), bumpMap: T(bump, false), bumpScale: 2.5, roughness: 0.7 });
  _spine.userData.noShadow = true;
  return _spine;
}
/** 书脊面：宽 w 高 h 的平面，UV 横向随机偏移（一张图 = 2 m） */
export function spineGeo(w, h, seed = 0) { const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv; const o = (Math.sin(seed * 91.7) * 0.5 + 0.5); for (let i = 0; i < uv.count; i++) uv.setX(i, o + uv.getX(i) * w / 2); return g; }
/** 书架（细书脊版，适合大面积）：柜体 + 层板 + 书脊面 */
export function spineShelf(b, f, w, h, d, o = {}) {
  const wood = o.wood ?? 'dz_wain'; const n = o.shelves ?? Math.max(3, Math.round((h - 0.2) / 0.4)); const sh = (h - 0.2) / n;
  b.add(wood, new THREE.BoxGeometry(w, h, 0.05), f.at(0, h / 2, -d / 2), { uv: 0.6 });
  for (const sx of [-1, 1]) b.add(wood, new THREE.BoxGeometry(0.06, h, d), f.at(sx * (w / 2 - 0.03), h / 2, 0), { uv: 0.6 });
  b.add(wood, new THREE.BoxGeometry(w + 0.1, 0.1, d + 0.06), f.at(0, h - 0.05, 0.03), { uv: 0.6 });
  for (let k = 0; k <= n; k++) { const y = 0.1 + k * sh; b.add(wood, new THREE.BoxGeometry(w - 0.1, 0.035, d), f.at(0, y, 0), { uv: 0.6 }); if (k < n) b.add('spine', spineGeo(w - 0.14, sh - 0.05, (o.seed ?? 0) + k * 3.1), f.at(0, y + 0.02 + (sh - 0.05) / 2, d / 2 - 0.08), { uv: false }); }
  if (o.trim !== false) b.add('gold', new THREE.BoxGeometry(w + 0.11, 0.018, 0.01), f.at(0, h - 0.08, d / 2 + 0.065), { uv: 1 });
}
