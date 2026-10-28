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
  M.glassIn = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: stainedGlassTexture(3), emissiveIntensity: 2.4, roughness: 1, side: THREE.DoubleSide });
  M.glassIn.userData.noShadow = true;
  M.glassClear = new THREE.MeshPhysicalMaterial({ color: 0xdde6ee, metalness: 0, roughness: 0.02, transmission: 0, transparent: true, opacity: 0.16, envMapIntensity: 1.5, depthWrite: false });
  M.glassClear.userData.noShadow = true;
  M.navy = pbr('Fabric023', { color: 0x1a2c66, roughness: 0.85 });
  // 广场
  M.paving = pbr('PavingStones142', { color: 0x8a8a92, roughness: 0.9, repeat: [1, 1] });
  M.plazaTile = pbr('Tiles138', { color: 0x606268, roughness: 0.55, env: 0.8 });
  M.whiteMarble = pbr('Marble021', { color: 0xd8d8da, roughness: 0.3, env: 1.0 });
  M.hedge = new THREE.MeshStandardMaterial({ color: 0x1d3a22, roughness: 0.9 });
  M.grass = new THREE.MeshStandardMaterial({ color: 0x2c4a26, roughness: 0.95 });
  // 室内
  M.hallFloor = pbr('Marble012', { color: 0xc0c0c4, roughness: 0.18, env: 0.9, physical: true, clearcoat: 0.8, clearcoatRoughness: 0.05 });
  M.hallFloorDark = pbr('Marble006', { color: 0x606068, roughness: 0.2, env: 0.9, physical: true, clearcoat: 0.8, clearcoatRoughness: 0.06 });
  M.terrazzo = pbr('Terrazzo005', { color: 0xa8a8ac, roughness: 0.3, env: 0.8 });
  M.wallStone = pbr('Marble016', { color: 0x55565e, roughness: 0.45, env: 0.9 });
  M.vault = pbr('Granite003A', { color: 0x777980, roughness: 0.7, env: 0.8 });
  M.wallPlaster = pbr('Concrete034', { color: 0xb4b2ac, roughness: 0.85 });
  M.onyx = pbr('Onyx013', { color: 0x8a8a90, roughness: 0.22, env: 1.2 });
  M.wood = pbr('Wood051', { color: 0x8a6a50, roughness: 0.5, env: 0.8 });
  M.woodFloor = pbr('WoodFloor064', { color: 0x9a8676, roughness: 0.42, env: 0.8 });
  M.carpet = pbr('Carpet012', { color: 0x4a5a8a, roughness: 1 });
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
  M.foliage = new THREE.MeshStandardMaterial({ color: 0x1f3d24, roughness: 0.85 });
  M.rubber = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.8 });
  return M;
}
