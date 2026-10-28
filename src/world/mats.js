// 材质库：黑金哥特主调（黑色抛光石材 + 抛光金 + 深蓝），室内现代冷峻
import * as THREE from 'three';
import { pbr } from '../engine/assets.js';
import { stainedGlassTexture } from '../engine/fx.js';

let M = null;
export function mats() {
  if (M) return M;
  M = {};
  // 外立面：黑色石材（带轻微反射）
  M.stone = pbr('Granite003A', { color: 0x3a3c44, roughness: 0.62, env: 0.9, normalScale: 0.8 });
  M.stoneDark = pbr('Marble016', { color: 0x1b1c22, roughness: 0.4, env: 1.0 });
  M.blackMarble = pbr('Marble016', { color: 0x9a9aa2, roughness: 0.35, env: 1.1, physical: true, clearcoat: 0.6, clearcoatRoughness: 0.12 });
  M.gold = pbr('Metal048A', { color: 0xffe2a0, metalness: 1, roughness: 0.28, env: 1.3 });
  M.goldBright = new THREE.MeshStandardMaterial({ color: 0xf0c66e, metalness: 1, roughness: 0.18, envMapIntensity: 1.5 });
  M.goldEmis = new THREE.MeshStandardMaterial({ color: 0xf6d27e, metalness: 1, roughness: 0.25, emissive: 0xc8902e, emissiveIntensity: 0.8, envMapIntensity: 1.4 });
  M.slate = pbr('Metal027', { color: 0x2a2d36, metalness: 0.6, roughness: 0.45, env: 1.0 });
  M.iron = pbr('Metal046A', { color: 0x2b2d33, metalness: 1, roughness: 0.42 });
  M.glassOut = new THREE.MeshPhysicalMaterial({ color: 0x0c1428, metalness: 0.2, roughness: 0.06, envMapIntensity: 1.6, emissive: 0x1a2a55, emissiveIntensity: 0.12, clearcoat: 1 });
  M.glassOut.userData.noShadow = true;
  const sgt = stainedGlassTexture(3); sgt.repeat.set(0.3, 0.115); sgt.offset.set(0.5, 0);
  M.glassIn = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: sgt, emissiveIntensity: 2.4, roughness: 1, side: THREE.DoubleSide });
  M.glassIn.userData.noShadow = true;
  M.glassClear = new THREE.MeshPhysicalMaterial({ color: 0xdde6ee, metalness: 0, roughness: 0.02, transmission: 0, transparent: true, opacity: 0.16, envMapIntensity: 1.5, depthWrite: false });
  M.glassClear.userData.noShadow = true;
  M.navy = pbr('Fabric023', { color: 0x1a2c66, roughness: 0.85 });
  // 广场
  M.paving = pbr('PavingStones142', { color: 0x8a8a92, roughness: 0.9, repeat: [1, 1] });
  M.plazaTile = pbr('Tiles138', { color: 0x606268, roughness: 0.55, env: 0.8 });
  M.whiteMarble = pbr('Marble021', { color: 0xd8d8da, roughness: 0.3, env: 1.0 });
  const leaf = leafTextures();
  M.hedge = new THREE.MeshStandardMaterial({ color: 0x6f8a62, map: leaf.map, normalMap: leaf.normal, normalScale: new THREE.Vector2(1.6, 1.6), roughness: 0.92 });
  M.grass = new THREE.MeshStandardMaterial({ color: 0x8aa070, map: leaf.grass, roughness: 0.95 });
  // 室内
  M.hallFloor = pbr('Marble012', { color: 0x8e8e94, roughness: 0.18, env: 0.9, physical: true, clearcoat: 0.8, clearcoatRoughness: 0.05 });
  M.hallFloorDark = pbr('Marble006', { color: 0x606068, roughness: 0.2, env: 0.9, physical: true, clearcoat: 0.8, clearcoatRoughness: 0.06 });
  M.terrazzo = pbr('Terrazzo005', { color: 0xa8a8ac, roughness: 0.3, env: 0.8 });
  M.wallStone = pbr('Granite003A', { color: 0x4c4d55, roughness: 0.5, env: 0.8 });
  M.vault = pbr('Concrete034', { color: 0x8a8478, roughness: 0.85, env: 0.6 }); M.vault.side = THREE.DoubleSide;
  M.wallPlaster = pbr('Concrete034', { color: 0x3e4a44, roughness: 0.8 });
  M.onyx = pbr('Onyx013', { color: 0x8a8a90, roughness: 0.22, env: 1.2 });
  M.wood = pbr('Wood051', { color: 0x6e4e38, roughness: 0.45, env: 0.8 });
  M.doorWood = pbr('Wood051', { color: 0x6a4e3a, roughness: 0.55, repeat: [1.5, 4] });
  M.woodFloor = pbr('WoodFloor064', { color: 0x9a8676, roughness: 0.42, env: 0.8 });
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
