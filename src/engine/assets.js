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
            if (m && /decal_screen/.test(m.name || '')) { o.material = screenUI(0); o.userData.screen = true; o.castShadow = false; return; } // M5：显示器原贴图是粉紫色桌面，换成局内系统界面
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
  obj.traverse((o) => { if (o.userData.screen) o.material = screenUI(_scrK++); });
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
    roughnessMap: loadTex(`assets/tex/${set}_${opts.rn ? 'roughN' : 'rough'}.webp`, { repeat: r }), // rn：归一化粗糙度图（均值≈0.8），roughness 参数即实际粗糙度；原图抛光石材均值仅 0.03–0.1，会把任何 roughness 乘成镜面
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

// —— 显示器界面池：档案检索 / 现实稳定度曲线 / 内部邮件 / 锁屏局徽（canvas 自绘，自发光）——
let _scrK = 1; const _scr = [];
export function screenUI(k) {
  if (!_scr.length) {
    const mk = (draw) => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 320; const c = cv.getContext('2d'); draw(c, 512, 320); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.55, roughness: 0.25, metalness: 0 }); };
    const head = (c, w, t) => { c.fillStyle = '#0a1426'; c.fillRect(0, 0, w, 320); c.fillStyle = '#16284a'; c.fillRect(0, 0, w, 30); c.fillStyle = '#c9a052'; c.font = '700 18px "NB Sans", sans-serif'; c.fillText(t, 12, 21); };
    _scr.push(mk((c, w) => { head(c, w, '叙事管理局 · 档案检索系统'); c.font = '15px "NB Sans", sans-serif'; ['编号　姓名　　状态　　等级', 'A-0127　叶寻　　在册　　B', 'A-0341　周也　　外勤　　A', 'C-1102　齐仇　　收容　　—', 'X-0007　——　　无数据　—', 'A-0912　殷泽　　在册　　A'].forEach((r, i) => { c.fillStyle = i ? (i === 4 ? '#e05a4a' : '#b8c8e8') : '#7f93b8'; c.fillText(r, 16, 62 + i * 30); }); c.fillStyle = '#c9a052'; c.fillRect(16, 250, 200, 26); c.fillStyle = '#0a1426'; c.fillText('检索：第七', 24, 268); }));
    _scr.push(mk((c, w) => { head(c, w, '现实稳定度 · 京城 24h'); c.strokeStyle = '#2a4a7a'; for (let x = 20; x < w; x += 40) { c.beginPath(); c.moveTo(x, 40); c.lineTo(x, 300); c.stroke(); } c.strokeStyle = '#5ab0ff'; c.lineWidth = 2; c.beginPath(); for (let x = 20; x < w - 10; x += 6) { const y = 150 + Math.sin(x * 0.05) * 30 + Math.sin(x * 0.17) * 10 + (x > 380 ? (x - 380) * 0.5 : 0); x === 20 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); c.fillStyle = '#e8c87a'; c.font = '700 40px "NB Sans", sans-serif'; c.fillText('97.3%', 330, 90); c.fillStyle = '#e05a4a'; c.font = '15px "NB Sans", sans-serif'; c.fillText('通州区　95.8%　↓', 330, 290); }));
    _scr.push(mk((c, w) => { head(c, w, '内部邮件'); c.font = '15px "NB Sans", sans-serif'; ['【通知】117 号：本周加试阅卷安排', '【人事】新人报到：请于 9:00 前领证', '【后勤】食堂 21:00 后不供应「回忆」', '【机要】B7 —— 无数据', '【宣传】新闻通稿第三稿待审'].forEach((r, i) => { c.fillStyle = i === 3 ? '#e05a4a' : '#cfd8ea'; c.fillText(r, 16, 66 + i * 38); c.fillStyle = '#1c2c4a'; c.fillRect(16, 76 + i * 38, w - 32, 1); }); }));
    _scr.push(mk((c, w) => { c.fillStyle = '#05080f'; c.fillRect(0, 0, w, 320); c.strokeStyle = '#c9a052'; c.lineWidth = 3; c.beginPath(); c.arc(w / 2, 140, 60, 0, 7); c.stroke(); c.beginPath(); c.moveTo(w / 2, 70); c.lineTo(w / 2 + 14, 140); c.lineTo(w / 2, 210); c.lineTo(w / 2 - 14, 140); c.closePath(); c.fillStyle = '#c9a052'; c.fill(); c.beginPath(); c.moveTo(w / 2 - 70, 140); c.lineTo(w / 2, 126); c.lineTo(w / 2 + 70, 140); c.lineTo(w / 2, 154); c.closePath(); c.fill(); c.font = '700 20px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'center'; c.fillText('叙事管理局　·　已锁定', w / 2, 260); }));
  }
  return _scr[k % _scr.length];
}
