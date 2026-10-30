// 材质库：黑金哥特主调（黑色抛光石材 + 抛光金 + 深蓝），室内现代冷峻
import * as THREE from 'three';
import { loadTex as _lt } from '../engine/assets.js';
const phm = (name, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: _lt(`assets/tex/ph/${name}_col.webp`, { srgb: true }), normalMap: _lt(`assets/tex/ph/${name}_nrm.webp`), roughnessMap: _lt(`assets/tex/ph/${name}_arm.webp`), color: o.color ?? 0xffffff, roughness: 1, envMapIntensity: o.env ?? 0.4 }); m.name = 'ph_' + name; return m; };
import { pbr } from '../engine/assets.js';
import { stainedGlassTexture } from '../engine/fx.js';
import { weather } from '../engine/weather.js';
import { TOD } from '../engine/tod.js';

let M = null;
export function mats() {
  if (M) return M;
  M = {};
  // 外立面：黑色石材（带轻微反射）
  // 批次8：外立面（附楼/城中建筑/宿舍/岗哨）改 Poly Haven large_sandstone_blocks（与主楼 hero 外立面同石种，原 ambientCG Granite003A + 程序化砌缝）
  const rep = (m, k) => { for (const t of [m.map, m.normalMap, m.roughnessMap]) if (t) t.repeat.set(k, k); return m; };
  M.stone = rep(phm('large_sandstone_blocks', { color: 0x4a4744, env: 0.55 }), 1.5); M.stone.normalScale.set(1.25, 1.25);
  // 批次8：B 层石墙 / 混凝土墙、宿舍抹灰墙、机库砖墙的 Poly Haven 底材（vault.js / surface.js 按区着色）
  M.phBlocks = rep(phm('medieval_blocks_02', { env: 0.35 }), 1.6); M.phConcrete = phm('concrete_wall_008', { env: 0.3 });
  M.phPlaster = phm('painted_plaster_wall', { env: 0.25 }); M.phBrick = rep(phm('brick_wall_006', { env: 0.3 }), 2.5);
  M.stoneDark = pbr('Marble016', { color: 0x1b1c22, roughness: 0.4, env: 1.0 });
  M.blackMarble = pbr('Marble016', { color: 0x9a9aa2, roughness: 0.35, env: 1.1, physical: true, clearcoat: 0.6, clearcoatRoughness: 0.12 });
  M.gold = pbr('Metal048A', { color: 0xffe2a0, metalness: 1, roughness: 0.32, env: 1.3 });
  M.goldBright = new THREE.MeshStandardMaterial({ color: 0xf0c66e, metalness: 1, roughness: 0.18, envMapIntensity: 1.5 });
  M.goldEmis = new THREE.MeshStandardMaterial({ color: 0xf6d27e, metalness: 1, roughness: 0.25, emissive: 0xc8902e, emissiveIntensity: 0.8, envMapIntensity: 1.4 });
  M.slate = pbr('Metal027', { color: 0x2a2d36, metalness: 0.6, roughness: 0.45, env: 1.0 });
  M.iron = pbr('Metal046A', { color: 0x2b2d33, metalness: 1, roughness: 0.42 });
  // M6：深蓝铅条菱格玻璃（canvas 自产，ShapeGeometry UV 为米制 → 每 0.9 m 一组菱格）
  const lead = leadedGlassTexture();
  M.glassOut = new THREE.MeshPhysicalMaterial({ color: TOD.label === '白昼' ? 0x6f8fe0 : 0x3a5098, map: lead.map, roughnessMap: lead.rough, metalness: 0.25, roughness: 0.9, envMapIntensity: TOD.label === '白昼' ? 1.6 : 1.1, emissive: 0x2440a0, emissiveMap: lead.map, emissiveIntensity: TOD.label === '白昼' ? 0.35 : 0.25, clearcoat: 0.6, clearcoatRoughness: 0.1 });
  M.glassOut.userData.noShadow = true;
  // 黄昏：外立面尖窗按窗格随机亮起暖色灯光（世界坐标哈希），其余保持深色反射
  M.glassOut.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGw;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvGw = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGw; float gh(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 cell = floor(vGw / vec3(3.0, 5.0, 3.0)); float on = step(${TOD.label === "白昼" ? "0.80" : "0.55"}, gh(cell));
          float flick = 0.85 + 0.15 * gh(cell + 7.0);
          float grad = 0.6 + 0.4 * smoothstep(0.0, 1.0, fract(vGw.y / 5.0));
          totalEmissiveRadiance += vec3(1.0, 0.58, 0.26) * on * flick * grad * ${TOD.winLit.toFixed(2)}; }`);
  };
  M.glassOut.customProgramCacheKey = () => 'glassOut' + TOD.label;
  const sgt = stainedGlassTexture(3); // UV 由 Batch 按每扇窗归一化
  M.glassIn = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: sgt, emissiveIntensity: 1.7, roughness: 1, side: THREE.DoubleSide });
  M.glassIn.userData.noShadow = true;
  M.glassClear = new THREE.MeshPhysicalMaterial({ color: 0xc8d2da, metalness: 0, roughness: 0.04, transmission: 0, transparent: true, opacity: 0.1, envMapIntensity: 0.65, depthWrite: false }); // M4：降反射，避免玻璃在掠射角泛白成「悬空板」
  M.glassClear.userData.noShadow = true;
  M.navy = pbr('Fabric023', { color: 0x1a2c66, roughness: 0.85, emissive: 0x0a1530, emissiveIntensity: 0.15 });
  // 广场
  M.paving = pbr('PavingStones142', { color: 0x8a8a92, roughness: 0.9, repeat: [1, 1] });
  M.plazaTile = pbr('Tiles138', { color: 0x606268, roughness: 0.55, env: 0.8 });
  M.whiteMarble = pbr('Marble021', { color: 0xd8d8da, roughness: 0.3, env: 1.0 });
  const leaf = leafTextures();
  M.hedge = new THREE.MeshStandardMaterial({ color: 0x6f8a62, map: leaf.map, normalMap: leaf.normal, normalScale: new THREE.Vector2(1.6, 1.6), roughness: 0.92 });
  M.grass = pbr('Grass001', { color: 0xb8c8a8, roughness: 0.95, env: 0.3 }); // 批次28：程序化竖线草 → ambientCG Grass001 实拍修剪草坪（CC0）
  // 室内
  M.hallFloor = pbr('Marble012', { rn: true, color: 0x3c3c42, roughness: 0.34, env: 0.22, physical: true, clearcoat: 0.12, clearcoatRoughness: 0.25 });
  M.hallFloorDark = pbr('Marble006', { rn: true, color: 0x46464c, roughness: 0.3, env: 0.3, physical: true, clearcoat: 0.12, clearcoatRoughness: 0.25 });
  M.terrazzo = pbr('Terrazzo005', { rn: true, color: 0x8a8a8e, roughness: 0.55, env: 0.3 });
  M.wallStone = pbr('Marble016', { rn: true, color: 0x5e5e66, roughness: 0.5, env: 0.6 }); // M4：原花岗岩在暖光下呈锈斑，改黑金纹大理石
  M.vault = pbr('Concrete034', { color: 0x8a8478, roughness: 0.85, env: 0.6 }); M.vault.side = THREE.DoubleSide; M.vault.userData.noShadow = true; // 双面薄壳自投影会出现橙黑色阴影痤疮
  M.panelWall = pbr('Marble006', { rn: true, color: 0x5e5850, roughness: 0.6, env: 0.35 });
  M.wallPlaster = phm('grey_plaster_02', { color: 0x6a7a72, env: 0.35 }); // 批次7：Poly Haven 实拍石膏（原 ambientCG Concrete034）
  M.onyx = pbr('Onyx013', { color: 0x8a8a90, roughness: 0.22, env: 1.2 });
  M.wood = pbr('Wood051', { color: 0x4a3020, roughness: 0.55, env: 0.3 }); // M4：深胡桃
  M.doorWood = pbr('Wood051', { color: 0x6a4e3a, roughness: 0.55, repeat: [1.5, 4] });
  M.woodFloor = pbr('WoodFloor064', { rn: true, color: 0x6e5a4a, roughness: 0.72, env: 0.2 }); // M4：掠射角环境反射是档案馆「白光溢出」的主因
  M.carpet = pbr('Carpet012', { color: 0x6a2228, roughness: 1 });
  M.steel = pbr('Metal009', { color: 0xc8ccd0, metalness: 1, roughness: 0.32 });
  M.blackMetal = pbr('Metal046A', { color: 0x3a3c42, metalness: 1, roughness: 0.38 });
  M.paintedSteel = new THREE.MeshStandardMaterial({ color: 0xc9cbc8, metalness: 0.5, roughness: 0.42 });
  M.paintedGreen = new THREE.MeshStandardMaterial({ color: 0x3d4a40, metalness: 0.45, roughness: 0.45 });
  M.kraft = pbr('Paper006', { color: 0xd6b88a, roughness: 0.9 });
  M.kraftDark = pbr('Cardboard004', { color: 0xb08a5a, roughness: 0.95 });
  M.leather = pbr('Leather026', { rn: true, color: 0x2a1c16, roughness: 0.62, env: 0.4 }); // M5：原粗糙度图均值 0.37×0.5 → 偏镜面，桌面泛白
  M.baize = new THREE.MeshStandardMaterial({ color: 0x1d3a28, roughness: 0.97, envMapIntensity: 0.05 }); // M6：阅览桌绿台呢（原皮革掠射角泛白，R4 P1-2）
  M.winView = new THREE.MeshBasicMaterial({ map: cityViewTexture(), toneMapped: true }); M.winView.userData.noShadow = true; // M6：室内窗外城景（R4 P1-6 floor3 纯蓝）
  M.concrete = pbr('Concrete036', { color: 0x7a7a7e, roughness: 0.9 });
  M.screenOff = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.15, metalness: 0.4 });
  M.lampGreen = new THREE.MeshStandardMaterial({ color: 0x0d4a2a, emissive: 0x1d7a45, emissiveIntensity: 0.25, roughness: 0.15, metalness: 0.1 });
  M.lampWarm = new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd9a0, emissiveIntensity: 6, roughness: 0.5 });
  M.lampCold = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe8f0ff, emissiveIntensity: 5, roughness: 0.5 });
  M.runeGold = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffc35a, emissiveIntensity: 3.5 });
  M.redThread = new THREE.MeshStandardMaterial({ color: 0x5a0a0c, emissive: 0x8a0f14, emissiveIntensity: 1.6, roughness: 0.6 });
  M.brass = new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 1, roughness: 0.32 });
  M.waxRed = new THREE.MeshStandardMaterial({ color: 0x7a1016, roughness: 0.35, metalness: 0.05 });
  M.foliage = new THREE.MeshStandardMaterial({ color: 0x55704c, map: leaf.map, normalMap: leaf.normal, normalScale: new THREE.Vector2(1.8, 1.8), roughness: 0.9 });
  M.rubber = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.8 });
  M.faceScreen = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x3aa8ff, emissiveIntensity: 1.3, roughness: 0.2 }); M.faceScreen.userData.noShadow = true;
  // —— 老化与脏污（世界空间，打破平铺与“新模型感”）——
  weather(M.stone, { macro: 0.14, streak: 0.4, grime: 0.38, ground: 1.8, rough: 0.12 }); // 批次8：贴图自带砌缝，去掉程序化 blocks
  weather(M.stoneDark, { macro: 0.18, streak: 0.5, grime: 0.4, ground: 0, rough: 0.16 });
  weather(M.slate, { macro: 0.2, streak: 0.4, tarnish: 0.25, dust: 0.3 });
  weather(M.gold, { macro: 0.1, tarnish: 0.32, rough: 0.12, scale: 2.0 });
  weather(M.goldBright, { macro: 0.06, tarnish: 0.18, rough: 0.08, scale: 2.0 });
  weather(M.iron, { macro: 0.15, tarnish: 0.5, rough: 0.2, scale: 1.5 });
  weather(M.wallStone, { macro: 0.2, streak: 0.25, grime: 0.45, ground: 1.8, rough: 0.14, blocks: [1.6, 0.8], jointDark: 0.78 });
  weather(M.paving, { macro: 0.32, dust: 0.25, rough: 0.2 });
  weather(M.plazaTile, { macro: 0.18, dust: 0.15, rough: 0.12 });
  weather(M.blackMarble, { macro: 0.1, rough: 0.08 });
  weather(M.concrete, { macro: 0.3, grime: 0.5, streak: 0.3, ground: -50, rough: 0.2 });
  weather(M.panelWall, { macro: 0.12, grime: 0.25, ground: 1.8 });
  weather(M.wallPlaster, { macro: 0.18, grime: 0.35, ground: 1.8 });
  weather(M.blackMetal, { macro: 0.12, tarnish: 0.2, rough: 0.15, scale: 1.5 });
  weather(M.steel, { macro: 0.12, tarnish: 0.15, rough: 0.15, scale: 1.5 });
  weather(M.brass, { macro: 0.1, tarnish: 0.35, rough: 0.15, scale: 2.0 });
  return M;
}

/** 窗外城景：天空渐变 + 三层哥特剪影（远淡近深）+ 亮窗 + 河带，按窗归一化 UV（fitUV）贴满尖拱窗 */
function cityViewTexture() {
  const W = 512, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const day = TOD.label === '白昼'; const sky = c.createLinearGradient(0, 0, 0, H * 0.75);
  if (day) { sky.addColorStop(0, '#5f86c0'); sky.addColorStop(0.7, '#a9c2df'); sky.addColorStop(1, '#d9e2ea'); } else { sky.addColorStop(0, '#1a1f3a'); sky.addColorStop(0.6, '#7a4a52'); sky.addColorStop(1, '#e09a5a'); }
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  if (day) { c.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse(Math.random() * W, 80 + Math.random() * 380, 40 + Math.random() * 90, 12 + Math.random() * 20, 0, 0, Math.PI * 2); c.fill(); } }
  const layers = [[0.62, day ? '#8a95a8' : '#3a3048', 0.5], [0.7, day ? '#5a6272' : '#241e2e', 0.8], [0.8, day ? '#2c3038' : '#121018', 1.2]];
  for (const [base, col, sc] of layers) {
    let x = -10; c.fillStyle = col;
    while (x < W) { const w = (18 + Math.random() * 40) * sc, h = (40 + Math.random() * 140) * sc, y0 = H * base; c.fillRect(x, y0 - h, w, h + H); if (Math.random() < 0.5) { c.beginPath(); c.moveTo(x - 2, y0 - h); c.lineTo(x + w / 2, y0 - h - (30 + Math.random() * 120) * sc); c.lineTo(x + w + 2, y0 - h); c.fill(); }
      if (sc > 0.7) { c.save(); c.fillStyle = day ? 'rgba(40,50,70,0.8)' : 'rgba(255,190,110,0.85)'; for (let wy = y0 - h + 8; wy < y0 - 4; wy += 9 * sc) for (let wx = x + 3; wx < x + w - 4; wx += 6 * sc) if (Math.random() < (day ? 0.5 : 0.3)) c.fillRect(wx, wy, 2 * sc, 4 * sc); c.restore(); }
      x += w + Math.random() * 6; }
    if (base === 0.7) { const rv = c.createLinearGradient(0, H * 0.7, 0, H * 0.76); rv.addColorStop(0, day ? '#9fb6cc' : '#c08060'); rv.addColorStop(1, day ? '#4f6a84' : '#30283a'); c.fillStyle = rv; c.fillRect(0, H * 0.7, W, H * 0.06); c.fillStyle = col; }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** 铅条菱格深蓝玻璃：颜色图（铅条黑、玻璃深蓝带色差与少量琥珀/宝石红）+ 粗糙度图（铅条粗、玻璃光） */
function leadedGlassTexture() {
  const N = 256, c1 = document.createElement('canvas'), c2 = document.createElement('canvas'); c1.width = c1.height = c2.width = c2.height = N;
  const g = c1.getContext('2d'), r = c2.getContext('2d');
  g.fillStyle = '#05070c'; g.fillRect(0, 0, N, N); r.fillStyle = '#e0e0e0'; r.fillRect(0, 0, N, N);
  const cells = 4, s = N / cells;
  for (let j = -1; j <= cells; j++) for (let i = -1; i <= cells; i++) for (const off of [0, 0.5]) {
    const cx = (i + off) * s + s / 2, cy = (j + off) * s + s / 2; const k = Math.random();
    const col = k < 0.06 ? [150, 90, 20] : k < 0.1 ? [110, 18, 28] : [20 + Math.random() * 25, 45 + Math.random() * 35, 120 + Math.random() * 70];
    const pts = [[cx, cy - s / 2 + 3], [cx + s / 2 - 3, cy], [cx, cy + s / 2 - 3], [cx - s / 2 + 3, cy]];
    const grd = g.createLinearGradient(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2);
    grd.addColorStop(0, `rgb(${col[0] * 1.3 | 0},${col[1] * 1.3 | 0},${col[2] * 1.25 | 0})`); grd.addColorStop(1, `rgb(${col[0] * 0.7 | 0},${col[1] * 0.7 | 0},${col[2] * 0.75 | 0})`);
    g.fillStyle = grd; r.fillStyle = `rgb(${18 + Math.random() * 30 | 0},0,0)`;
    for (const ctx of [g, r]) { ctx.beginPath(); pts.forEach((p, n) => (n ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill(); }
  }
  const T = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.1, 1.1); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  return { map: T(c1, true), rough: T(c2, false) };
}

/** 程序化叶丛贴图（颜色 + 法线），用于绿篱、柏树、草坪 */
function leafTextures() {
  const N = 256;
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; };
  const cv = mk(), c = cv.getContext('2d'); const h = new Float32Array(N * N);
  c.fillStyle = '#1c2e1a'; c.fillRect(0, 0, N, N);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * N, y = Math.random() * N, r = 2 + Math.random() * 5, a = Math.random() * Math.PI;
    const g = 40 + Math.random() * 50; c.fillStyle = `rgb(${g * 0.55 | 0},${g | 0},${g * 0.5 | 0})`;
    c.beginPath(); c.ellipse(x, y, r, r * 0.5, a, 0, Math.PI * 2); c.fill();
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const d = (xx * xx + yy * yy) / (r * r); if (d < 1) { const ix = (((x + xx) | 0) + N) % N, iy = (((y + yy) | 0) + N) % N; h[iy * N + ix] = Math.max(h[iy * N + ix], (1 - d) * (0.5 + Math.random() * 0.5)); } }
  }
  const nv = mk(), nc = nv.getContext('2d'), img = nc.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = h[y * N + (x + 1) % N] - h[y * N + (x + N - 1) % N], dy = h[((y + 1) % N) * N + x] - h[((y + N - 1) % N) * N + x];
    const v = new THREE.Vector3(-dx * 3, -dy * 3, 1).normalize(); const i = (y * N + x) * 4;
    img.data[i] = (v.x * 0.5 + 0.5) * 255; img.data[i + 1] = (v.y * 0.5 + 0.5) * 255; img.data[i + 2] = (v.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  nc.putImageData(img, 0, 0);
  const gv = mk(), gc = gv.getContext('2d'); gc.fillStyle = '#2e4424'; gc.fillRect(0, 0, N, N);
  for (let i = 0; i < 9000; i++) { const g = 50 + Math.random() * 60; gc.fillStyle = `rgb(${g * 0.6 | 0},${g | 0},${g * 0.45 | 0})`; gc.fillRect(Math.random() * N, Math.random() * N, 1, 2 + Math.random() * 3); }
  const T = (cvs, srgb) => { const t = new THREE.CanvasTexture(cvs); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  return { map: T(cv, true), normal: T(nv, false), grass: T(gv, true) };
}
