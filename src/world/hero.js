// R2 精修资产：Blender 程序化精修建模 + Cycles CPU 离线烘焙（室外顶点 AO / 室内光照贴图）导出的 GLB
// three 端按材质名套写实 PBR（Poly Haven / ambientCG），并把烘焙结果接入光照：
//   顶点色 COLOR_0.r = 环境光遮蔽（只压间接光 + 少量直射，保留实时阳光阴影）
//   uv1 光照贴图（8bit：pow(v,2.2) * range）= 漫反射全局光照（直射 + 间接，Cycles 烘焙，替代实时灯）
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { manager, loadTex, pbr } from '../engine/assets.js';
import { weather } from '../engine/weather.js';
import { mats } from './mats.js';

const loader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
export function loadGLB(url) { return new Promise((res) => loader.load(url, (g) => res(g), undefined, (e) => { console.warn('[NB] hero 加载失败', url, e); res(null); })); }

/** Poly Haven 贴图集（col/nrm/arm）→ 标准 PBR；arm.g 作粗糙度 */
export function phMat(name, o = {}) {
  const P = o.physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const m = new P({
    map: loadTex(`assets/tex/ph/${name}_col.webp`, { srgb: true }),
    normalMap: loadTex(`assets/tex/ph/${name}_nrm.webp`),
    roughnessMap: loadTex(`assets/tex/ph/${name}_arm.webp`),
    color: o.color ?? 0xffffff, roughness: o.roughness ?? 1, metalness: o.metalness ?? 0, envMapIntensity: o.env ?? 1,
  });
  if (o.normalScale) m.normalScale.set(o.normalScale, o.normalScale);
  if (o.physical) { m.clearcoat = o.clearcoat ?? 0; m.clearcoatRoughness = o.clearcoatRoughness ?? 0.2; }
  m.name = 'ph_' + name;
  return m;
}

/** 顶点 AO：COLOR_0.r 压暗间接漫反射/镜面 + 少量直射（缝隙更有体积） */
export function vaoPatch(mat, { direct = 0.35, gamma = 1.0 } = {}) {
  if (mat.userData.vao) return mat;
  mat.userData.vao = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 color;\nvarying float vNbAO;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvNbAO = pow(clamp(color.r, 0.0, 1.0), ' + gamma.toFixed(2) + ');');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vNbAO;')
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        reflectedLight.indirectDiffuse *= vNbAO;
        reflectedLight.indirectSpecular *= mix(1.0, vNbAO, 0.85);
        reflectedLight.directDiffuse *= mix(1.0, vNbAO, ${direct.toFixed(2)});
        reflectedLight.directSpecular *= mix(1.0, vNbAO, ${(direct * 0.8).toFixed(2)});`);
  };
  const k = mat.customProgramCacheKey?.bind(mat);
  mat.customProgramCacheKey = () => (k ? k() : '') + '|vao' + direct + gamma;
  mat.needsUpdate = true;
  return mat;
}

/** 光照贴图（uv1，RGBM8 编码）：替换间接漫反射；直射保留为可选少量（用于实时高光）。intensity 为整体曝光系数 */
export function lightmapPatch(mat, tex, { intensity = 1.0, rgbmRange = 4.0, keepEnvDiffuse = 0.0 } = {}) {
  mat.userData.lm = true;
  mat.userData.lmTex = tex;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r);
    sh.uniforms.nbLM = { value: tex }; sh.uniforms.nbLMI = { value: intensity };
    mat.userData.lmUniform = sh.uniforms.nbLMI;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 uv1;\nvarying vec2 vNbLM;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvNbLM = uv1;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D nbLM; uniform float nbLMI; varying vec2 vNbLM;')
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        { vec3 lm = pow(texture2D(nbLM, vNbLM).rgb, vec3(2.2)) * ${rgbmRange.toFixed(1)};
          reflectedLight.indirectDiffuse = reflectedLight.indirectDiffuse * ${keepEnvDiffuse.toFixed(2)} + lm * nbLMI * BRDF_Lambert(material.diffuseColor);
          // 镜面反射按光照贴图亮度遮蔽（暗处不反光）
          float lmL = dot(lm, vec3(0.2126, 0.7152, 0.0722));
          reflectedLight.indirectSpecular *= clamp(lmL * 1.6 * nbLMI, 0.08, 1.0); }`);
  };
  const k = mat.customProgramCacheKey?.bind(mat);
  mat.customProgramCacheKey = () => (k ? k() : '') + '|lm' + rgbmRange + keepEnvDiffuse;
  mat.needsUpdate = true;
  return mat;
}

let EXT = null;
/** 室外精修材质库（名字与 tools/blender/*.py 的材质名一一对应） */
export function extMats() {
  if (EXT) return EXT;
  const M = mats();
  EXT = {};
  // 黑色哥特石材：科隆大教堂式风化深色砂岩（暖灰黑，带烟熏雨痕），Poly Haven large_sandstone_blocks（3 m 一块图）
  EXT.ashlar = weather(phMat('large_sandstone_blocks', { color: 0x4a4744, roughness: 1, env: 0.55, normalScale: 1.3 }), { macro: 0.16, streak: 0.42, grime: 0.4, ground: 1.8, rough: 0.12 });
  EXT.ashlarDeep = weather(phMat('large_sandstone_blocks', { color: 0x2c2a29, roughness: 1, env: 0.4 }), { macro: 0.12, streak: 0.3, grime: 0.3, ground: 1.8 });
  // 雕饰线脚：同石种、较细腻（ambientCG Granite003A 无砌缝）
  EXT.trim = weather(pbr('Granite003A', { color: 0x3c3a38, roughness: 0.78, env: 0.55, normalScale: 0.9 }), { macro: 0.14, streak: 0.35, grime: 0.3, ground: 1.8, rough: 0.12 });
  EXT.plinth = weather(phMat('granite_tile', { color: 0x6a6866, roughness: 0.9, env: 0.6 }), { macro: 0.12, grime: 0.45, ground: 0.2 });
  EXT.marble = weather(pbr('Marble016', { color: 0x9a9aa2, roughness: 0.32, env: 1.0, physical: true, clearcoat: 0.5, clearcoatRoughness: 0.15 }), { macro: 0.1, streak: 0.2, rough: 0.08 });
  EXT.marbleDark = weather(pbr('Marble016', { color: 0x2a2b30, roughness: 0.36, env: 0.9 }), { macro: 0.16, streak: 0.4, grime: 0.3, rough: 0.12 });
  EXT.steps = weather(pbr('Marble016', { rn: true, color: 0x8a8a90, roughness: 0.42, env: 0.8 }), { macro: 0.1, dust: 0.25, rough: 0.12 });
  EXT.gold = weather(pbr('Metal048A', { color: 0xffdc96, metalness: 1, roughness: 0.3, env: 1.3 }), { macro: 0.1, tarnish: 0.3, rough: 0.12, scale: 2.0 });
  EXT.slate = weather(phMat('roof_slates_02', { color: 0x3c4250, roughness: 0.85, env: 0.9, normalScale: 1.2 }), { macro: 0.18, streak: 0.25, tarnish: 0.1 });
  EXT.lead = weather(pbr('Metal027', { color: 0x3a3e46, metalness: 0.7, roughness: 0.5, env: 0.9 }), { macro: 0.2, streak: 0.4, tarnish: 0.3 });
  EXT.glass = M.glassOut;
  EXT.louver = pbr('Wood051', { color: 0x2a1e16, roughness: 0.7 });
  // 广场
  EXT.paving = weather(phMat('large_grey_tiles', { color: 0x9a968e, roughness: 0.95, env: 0.6 }), { macro: 0.22, dust: 0.25, rough: 0.15 });
  EXT.paveDark = weather(phMat('granite_tile', { color: 0x55545a, roughness: 0.55, env: 0.8 }), { macro: 0.12, dust: 0.12, rough: 0.12 });
  EXT.curb = weather(pbr('Granite003A', { color: 0x8a8884, roughness: 0.75, env: 0.6 }), { macro: 0.12, grime: 0.3, ground: 0.1 });
  EXT.whiteMarble = weather(pbr('Marble021', { color: 0xd8d6d2, roughness: 0.32, env: 0.9 }), { macro: 0.12, dust: 0.2, rough: 0.1 });
  EXT.water = M.water ?? new THREE.MeshPhysicalMaterial({ color: 0x0d1a1e, roughness: 0.05, metalness: 0, transmission: 0, envMapIntensity: 1.2 });
  EXT.bronze = new THREE.MeshStandardMaterial({ color: 0x5a4632, metalness: 1, roughness: 0.45, envMapIntensity: 1.0 });
  weather(EXT.bronze, { macro: 0.2, tarnish: 0.6, scale: 1.5 });
  EXT.iron = weather(pbr('Metal046A', { color: 0x2b2d33, metalness: 1, roughness: 0.42 }), { macro: 0.15, tarnish: 0.5, rough: 0.2, scale: 1.5 });
  EXT.lawn = M.grass.clone(); EXT.hedge = M.hedge.clone(); // 共享材质不能直接打补丁（老几何没有 color 属性 → AO=0 全黑）
  for (const k of Object.keys(EXT)) if (k !== 'glass' && k !== 'water') vaoPatch(EXT[k], { direct: k === 'gold' ? 0.5 : 0.35 });
  return EXT;
}

let HALLM = null;
/** 安检大厅精修材质（与 tools/blender/pbr.py 的 HALL 表同贴图同色调；光照由烘焙光照贴图提供，反射由大厅探针提供） */
export function hallMats() {
  if (HALLM) return HALLM;
  const M = mats();
  const H = {};
  const c = (r, g, b) => new THREE.Color(r, g, b);
  // 墙/柱：暖灰米色石灰岩方石（实拍砌块），柱身更光洁；线脚为细腻石灰岩
  H.wall = weather(phMat('sandstone_blocks_08', { color: c(0.8, 0.76, 0.7), roughness: 1, env: 0.5, normalScale: 1.2 }), { macro: 0.18, streak: 0.12, grime: 0.3, ground: 1.8, rough: 0.1 });
  H.pier = weather(phMat('sandstone_blocks_08', { color: c(0.78, 0.74, 0.68), roughness: 0.9, env: 0.55 }), { macro: 0.15, grime: 0.35, ground: 1.8, rough: 0.1 });
  H.trim = weather(pbr('Concrete034', { color: c(0.78, 0.72, 0.62), roughness: 0.8, env: 0.55, normalScale: 0.8 }), { macro: 0.15, grime: 0.3, ground: 1.8 });
  H.vault = weather(pbr('Concrete036', { color: c(0.9, 0.82, 0.68), roughness: 1, env: 0.4, normalScale: 0.6 }), { macro: 0.2, rough: 0.1 });
  H.wallDark = pbr('Marble006', { rn: true, color: c(0.6, 0.6, 0.62), roughness: 0.35, env: 0.6 });
  // 地面：中殿黑米棋盘抛光大理石（清漆层 + 平面反射），侧廊米色大板
  H.floorNave = weather(pbr('Tiles074', { rn: true, color: c(0.95, 0.92, 0.86), roughness: 0.12, env: 1.0, physical: true, clearcoat: 0.35, clearcoatRoughness: 0.05, normalScale: 0.35 }), { macro: 0.08, dust: 0.08, rough: 0.06 });
  H.floorAisle = weather(phMat('marble_01', { color: c(0.9, 0.86, 0.8), roughness: 0.45, env: 0.8, physical: true, clearcoat: 0.2, clearcoatRoughness: 0.1, normalScale: 0.5 }), { macro: 0.1, dust: 0.1, rough: 0.08 });
  H.marbleDark = pbr('Marble016', { rn: true, color: 0xffffff, roughness: 0.1, env: 1.0, physical: true, clearcoat: 0.5, clearcoatRoughness: 0.04, normalScale: 0.3 });
  H.marbleLight = pbr('Marble021', { rn: true, color: c(0.95, 0.93, 0.9), roughness: 0.16, env: 1.0, physical: true, clearcoat: 0.4, clearcoatRoughness: 0.05 });
  H.marble = pbr('Marble006', { rn: true, color: 0xffffff, roughness: 0.12, env: 1.0, physical: true, clearcoat: 0.5, clearcoatRoughness: 0.04 });
  H.plinthIn = weather(pbr('Marble006', { rn: true, color: c(0.9, 0.9, 0.92), roughness: 0.3, env: 0.8 }), { macro: 0.1, grime: 0.25, ground: 1.8 });
  // 金属：鎏金、黄铜（局部氧化与手摸亮处）、拉丝不锈钢、黑色烤漆
  H.gold = weather(new THREE.MeshStandardMaterial({ color: c(1.0, 0.74, 0.36), metalness: 1, roughness: 0.24, envMapIntensity: 1.2 }), { macro: 0.12, tarnish: 0.2, rough: 0.12, scale: 2.0 });
  H.brass = weather(pbr('Metal048A', { color: c(0.86, 0.62, 0.34), metalness: 1, roughness: 0.32, env: 1.1 }), { macro: 0.18, tarnish: 0.35, rough: 0.14, scale: 2.0 });
  H.steel = pbr('Metal009', { color: c(0.92, 0.92, 0.93), metalness: 1, roughness: 0.8, env: 1.0 });
  H.blackMetal = weather(pbr('Metal027', { color: c(0.35, 0.35, 0.37), metalness: 0.6, roughness: 0.9, env: 0.8 }), { macro: 0.08, rough: 0.1 });
  H.paintMetal = weather(new THREE.MeshStandardMaterial({ color: c(0.32, 0.34, 0.37), roughness: 0.42, metalness: 0, envMapIntensity: 0.8 }), { macro: 0.06, grime: 0.15, ground: 1.8, rough: 0.1 });
  H.blackGlass = new THREE.MeshPhysicalMaterial({ color: c(0.004, 0.004, 0.005), roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.2 });
  H.rubber = new THREE.MeshStandardMaterial({ color: c(0.018, 0.018, 0.02), roughness: 0.85 });
  H.navyBelt = pbr('Fabric023', { color: c(0.12, 0.18, 0.42), roughness: 1 });
  H.leatherBlack = pbr('Leather026', { rn: true, color: c(0.55, 0.42, 0.34), roughness: 0.55 });
  H.woodDark = pbr('Wood051', { color: c(0.75, 0.62, 0.52), roughness: 0.6, physical: true, clearcoat: 0.3, clearcoatRoughness: 0.15 });
  H.glassClear = M.glassClear;
  // 自发光：彩窗透光、大屏（大屏面由 three 画布屏覆盖，这里只做暗底）
  const em = (col, i) => new THREE.MeshStandardMaterial({ color: 0, emissive: col, emissiveIntensity: i, side: THREE.DoubleSide });
  H.glassN = em(c(1.0, 0.9, 0.74), 2.2); H.glassA = em(c(0.55, 0.68, 1.0), 1.6); H.glassRose = em(c(1.0, 0.58, 0.32), 2.4);
  H.screenEmit = em(c(0.05, 0.1, 0.25), 0.5);
  H.COL = new THREE.MeshBasicMaterial({ visible: false });
  for (const k of Object.keys(H)) H[k].name = H[k].name || 'hall_' + k;
  HALLM = H;
  return H;
}

/**
 * 载入精修 GLB 到 group：按材质名换材质；*_col.glb 作碰撞几何。
 * opts.vao：顶点 AO；opts.lm：光照贴图 url；opts.mats：材质表
 */
export async function placeHero(group, world, url, opts = {}) {
  const [g, gc] = await Promise.all([loadGLB(url), opts.col !== false ? loadGLB(url.replace('.glb', '_col.glb')) : Promise.resolve(null)]);
  if (!g) return null;
  const table = opts.mats ?? extMats();
  let lm = null;
  if (opts.lm) { lm = loadTex(opts.lm, { srgb: false }); lm.flipY = false; lm.channel = 1; lm.wrapS = lm.wrapT = THREE.ClampToEdgeWrapping; lm.generateMipmaps = true; }
  const missing = new Set();
  g.scene.traverse((o) => {
    if (!o.isMesh) return;
    const mn = (o.material?.name || '').replace(/\.\d+$/, '');
    let m = table[mn];
    if (!m) { missing.add(mn); m = table.trim ?? o.material; }
    if (lm && !/^(glass|screenEmit|COL)/.test(mn)) { if (opts.lmInPlace) { if (!m.userData.lm) lightmapPatch(m, lm, opts.lmOpts); } else { const key = mn + '|lm'; table[key] = table[key] ?? lightmapPatch(m.clone(), lm, opts.lmOpts); m = table[key]; } }
    o.material = m;
    o.castShadow = opts.castShadow ?? !/glass|water/.test(mn);
    o.receiveShadow = true;
    o.matrixAutoUpdate = false; o.updateMatrix();
    if (window.__SHOT__) o.onAfterRender = () => { (window.__DRAWN__ ??= new Set()).add(o.name); };
  });
  if (missing.size) console.warn('[NB] hero 缺材质', [...missing]);
  group.add(g.scene);
  g.scene.updateMatrixWorld(true);
  if (gc && world) gc.scene.traverse((o) => { if (o.isMesh) { o.updateMatrixWorld(true); const geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld); world.addGeo(geo); } });
  return g.scene;
}
