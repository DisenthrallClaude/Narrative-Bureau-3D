// 资产加载：GLB（meshopt）、PBR 贴图集、HDRI；带进度回调与缓存
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export const BASE = './';
export const manager = new THREE.LoadingManager();
const gltfLoader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
const texLoader = new THREE.TextureLoader(manager);
const rgbeLoader = new RGBELoader(manager);

let anisotropy = 8;
export function setAnisotropy(a) { anisotropy = a; }

const modelCache = new Map();
/** 加载 GLB，返回原始 scene（缓存）。unlit 扫描件转为 PBR。 */
export function loadModel(name) {
  if (!modelCache.has(name)) {
    modelCache.set(name, new Promise((resIn) => { let res = resIn;
      // 超时保护：单个模型 60 秒没加载完就用空组顶上，不让整个场景卡在加载
      const to = setTimeout(() => { console.warn('[NB] 模型加载超时', name); res(new THREE.Group()); }, 60000);
      res = (v) => { clearTimeout(to); resIn(v); };
      gltfLoader.load(`${BASE}assets/models/${name}.glb`, (g) => {
        g.scene.traverse((o) => {
          if (o.isMesh) {
            const m = o.material;
            if (m && m.isMeshBasicMaterial) {
              o.material = new THREE.MeshStandardMaterial({ map: m.map, color: m.color, roughness: 0.85, metalness: 0, side: m.side, transparent: m.transparent, alphaTest: m.alphaTest });
            }
            o.castShadow = true; o.receiveShadow = true;
          }
        });
        g.scene.userData.animations = g.animations;
        res(g.scene);
      }, undefined, (e) => { console.warn('模型加载失败', name, e); res(new THREE.Group()); });
    }));
  }
  return modelCache.get(name);
}

/**
 * 实例化模型：按目标尺寸缩放，底部落地，水平居中。
 * opts: { height | width | depth | scale, rotY, pos:[x,y,z], align:'base'|'center', shadow }
 */
export async function placeModel(name, opts = {}) {
  const src = await loadModel(name);
  const obj = src.clone(true);
  if (opts.rotX) obj.rotation.x = opts.rotX;
  if (opts.rotZ) obj.rotation.z = opts.rotZ;
  const wrap = new THREE.Group();
  wrap.add(obj);
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  let s = opts.scale ?? 1;
  if (opts.height) s = opts.height / size.y;
  else if (opts.width) s = opts.width / size.x;
  else if (opts.depth) s = opts.depth / size.z;
  else if (opts.maxDim) s = opts.maxDim / Math.max(size.x, size.y, size.z);
  obj.scale.multiplyScalar(s);
  obj.updateMatrixWorld(true);
  box.setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3());
  obj.position.x -= c.x; obj.position.z -= c.z;
  obj.position.y -= opts.align === 'center' ? c.y : box.min.y;
  if (opts.rotY) wrap.rotation.y = opts.rotY;
  if (opts.pos) wrap.position.set(...opts.pos);
  if (opts.material) obj.traverse((o) => { if (o.isMesh) o.material = opts.material; });
  if (opts.shadow === false) obj.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  wrap.userData.size = box.getSize(new THREE.Vector3());
  return wrap;
}

const texCache = new Map();
export function loadTex(path, { srgb = false, repeat = [1, 1] } = {}) {
  const key = path;
  let base = texCache.get(key);
  if (!base) {
    base = texLoader.load(`${BASE}${path}`);
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    base.anisotropy = anisotropy;
    if (srgb) base.colorSpace = THREE.SRGBColorSpace;
    texCache.set(key, base);
  }
  if (repeat[0] === 1 && repeat[1] === 1) return base;
  const t = base.clone();
  t.repeat.set(repeat[0], repeat[1]);
  t.needsUpdate = true;
  // clone 共享 source，图片加载完成后自动可用
  return t;
}

const HAS_METAL = new Set(['Facade001', 'Metal009', 'Metal027', 'Metal046A', 'Metal048A']);
const HAS_AO = new Set(['Carpet012', 'PavingStones142']);
/** ambientCG 贴图集 → MeshStandardMaterial / MeshPhysicalMaterial */
export function pbr(set, opts = {}) {
  const r = opts.repeat ?? [1, 1];
  const P = opts.physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const m = new P({
    map: loadTex(`assets/tex/${set}_color.webp`, { srgb: true, repeat: r }),
    normalMap: loadTex(`assets/tex/${set}_normal.webp`, { repeat: r }),
    roughnessMap: loadTex(`assets/tex/${set}_rough.webp`, { repeat: r }),
    metalness: opts.metalness ?? 0,
    roughness: opts.roughness ?? 1,
    color: opts.color ?? 0xffffff,
    envMapIntensity: opts.env ?? 1,
  });
  if (HAS_METAL.has(set) && opts.useMetalMap !== false) { m.metalnessMap = loadTex(`assets/tex/${set}_metal.webp`, { repeat: r }); m.metalness = opts.metalness ?? 1; }
  if (HAS_AO.has(set)) m.aoMap = loadTex(`assets/tex/${set}_ao.webp`, { repeat: r });
  if (opts.normalScale) m.normalScale.set(opts.normalScale, opts.normalScale);
  if (opts.physical) { m.clearcoat = opts.clearcoat ?? 0; m.clearcoatRoughness = opts.clearcoatRoughness ?? 0.1; }
  if (opts.emissive) { m.emissive = new THREE.Color(opts.emissive); m.emissiveIntensity = opts.emissiveIntensity ?? 1; }
  m.name = set;
  return m;
}

export function loadHDR(name) {
  return new Promise((res) => rgbeLoader.load(`${BASE}assets/hdri/${name}.hdr`, (t) => { t.mapping = THREE.EquirectangularReflectionMapping; res(t); }, undefined, () => res(null)));
}

export async function fetchJSON(path) {
  try { const r = await fetch(`${BASE}${path}`, { cache: 'no-cache' }); if (!r.ok) return null; return await r.json(); } catch { return null; }
}
