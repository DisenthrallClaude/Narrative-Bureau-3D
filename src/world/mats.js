// 材质库：黑金哥特主调（黑色抛光石材 + 抛光金 + 深蓝），室内现代冷峻
import * as THREE from 'three';
import { pbr } from '../engine/assets.js';
import { stainedGlassTexture } from '../engine/fx.js';
import { weather } from '../engine/weather.js';
import { TOD } from '../engine/tod.js';

let M = null;
export function mats() {
  if (M) return M;
  M = {};
  // 外立面：黑色石材（带轻微反射）
  M.stone = pbr('Granite003A', { color: 0x15161b, roughness: 0.55, env: 0.9, normalScale: 0.8 });
  M.stoneDark = pbr('Marble016', { color: 0x1b1c22, roughness: 0.4, env: 1.0 });
  M.blackMarble = pbr('Marble016', { color: 0x9a9aa2, roughness: 0.35, env: 1.1, physical: true, clearcoat: 0.6, clearcoatRoughness: 0.12 });
  M.gold = pbr('Metal048A', { color: 0xffe2a0, metalness: 1, roughness: 0.32, env: 1.3 });
  M.goldBright = new THREE.MeshStandardMaterial({ color: 0xf0c66e, metalness: 1, roughness: 0.18, envMapIntensity: 1.5 });
  M.goldEmis = new THREE.MeshStandardMaterial({ color: 0xf6d27e, metalness: 1, roughness: 0.25, emissive: 0xc8902e, emissiveIntensity: 0.8, envMapIntensity: 1.4 });
  M.slate = pbr('Metal027', { color: 0x2a2d36, metalness: 0.6, roughness: 0.45, env: 1.0 });
  M.iron = pbr('Metal046A', { color: 0x2b2d33, metalness: 1, roughness: 0.42 });
  M.glassOut = new THREE.MeshPhysicalMaterial({ color: TOD.label === '白昼' ? 0x22355e : 0x0c1428, metalness: 0.3, roughness: 0.05, envMapIntensity: TOD.label === '白昼' ? 2.4 : 1.6, emissive: 0x1a2a55, emissiveIntensity: 0.2, clearcoat: 1 });
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
  M.grass = new THREE.MeshStandardMaterial({ color: 0x8aa070, map: leaf.grass, roughness: 0.95 });
  // 室内
  M.hallFloor = pbr('Marble012', { color: 0x5a5a60, roughness: 0.38, env: 0.3, physical: true, clearcoat: 0.12, clearcoatRoughness: 0.25 });
  M.hallFloorDark = pbr('Marble006', { color: 0x4c4c52, roughness: 0.38, env: 0.3, physical: true, clearcoat: 0.12, clearcoatRoughness: 0.25 });
  M.terrazzo = pbr('Terrazzo005', { color: 0x8a8a8e, roughness: 0.4, env: 0.5 });
  M.wallStone = pbr('Marble016', { color: 0x6a6a72, roughness: 0.48, env: 0.8 }); // M4：原花岗岩在暖光下呈锈斑，改黑金纹大理石
  M.vault = pbr('Concrete034', { color: 0x8a8478, roughness: 0.85, env: 0.6 }); M.vault.side = THREE.DoubleSide; M.vault.userData.noShadow = true; // 双面薄壳自投影会出现橙黑色阴影痤疮
  M.panelWall = pbr('Marble006', { color: 0x5e5850, roughness: 0.62, env: 0.45 });
  M.wallPlaster = pbr('Concrete034', { color: 0x3e4a44, roughness: 0.8 });
  M.onyx = pbr('Onyx013', { color: 0x8a8a90, roughness: 0.22, env: 1.2 });
  M.wood = pbr('Wood051', { color: 0x4a3020, roughness: 0.55, env: 0.3 }); // M4：深胡桃
  M.doorWood = pbr('Wood051', { color: 0x6a4e3a, roughness: 0.55, repeat: [1.5, 4] });
  M.woodFloor = pbr('WoodFloor064', { color: 0x7a6656, roughness: 0.66, env: 0.25 }); // M4：掠射角环境反射是档案馆「白光溢出」的主因
  M.carpet = pbr('Carpet012', { color: 0x6a2228, roughness: 1 });
  M.steel = pbr('Metal009', { color: 0xc8ccd0, metalness: 1, roughness: 0.32 });
  M.blackMetal = pbr('Metal046A', { color: 0x3a3c42, metalness: 1, roughness: 0.38 });
  M.paintedSteel = new THREE.MeshStandardMaterial({ color: 0xc9cbc8, metalness: 0.5, roughness: 0.42 });
  M.paintedGreen = new THREE.MeshStandardMaterial({ color: 0x3d4a40, metalness: 0.45, roughness: 0.45 });
  M.kraft = pbr('Paper006', { color: 0xd6b88a, roughness: 0.9 });
  M.kraftDark = pbr('Cardboard004', { color: 0xb08a5a, roughness: 0.95 });
  M.leather = pbr('Leather026', { color: 0x2a1c16, roughness: 0.5 });
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
  weather(M.stone, { macro: 0.12, streak: 0.2, grime: 0.35, ground: 0, rough: 0.15, blocks: [1.2, 0.6] });
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
