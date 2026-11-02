// R8-MOYUAN 原型：?moyuan=athena 时，进入墨渊区（abyss_*）即动态加载 Athenaion（MIT，© 2026 Leon Lin，
// https://github.com/Leonxlnx/athenaion，代码见 ./athenaion/，LICENSE 同目录）程序化古城，改成地底世界「墨渊·雅典娜」：
//  - 只取几何 / 材质构建模块（不用其离线 accumulation 管线、不装其大气 / 天空 / CSM），用本项目渲染器渲染；
//  - 裁剪：海 / 云 / 鸟 / 废墟前景 / 旗帜 / flora 不建；树密度 ≈1/20；瀑布密度降低；雪山（远景地形）保留；
//  - 地底化：岩顶穹顶代替天空、暗琥珀灰雾、暗金点光 + 暗铜环境光、墨黑静水；蓝 / 青 / 绿色相压到暗金 / 暗铜 / 墨褐（植物保留极暗墨绿）。
// 世界整体平移到 y = OY（远低于墨渊 −300 / 装订线 −500），默认不开启，不影响现有 walk。
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { manager } from '../engine/assets.js';
import { midLoad } from '../ui/ui.js';

// R10（用户 2026-11-02 22:10）：古城 = 被管理局封锁的历史遗迹，自然部分按 Athenaion 原样：恢复其天空（含体积云）/ 太阳 / 大气透视 / 海水 / 原配色，
// 撤掉 R9 的地底化（岩穹顶、墨黑静水、暗金点光、去蓝压暗调色）；大气与天空着色器用 uAtmoOY 抵消 y−3000 平移。
// R9：默认开启（墨渊 = 古城）；?nomyathena=1 回退旧墨渊四区
export const MOYUAN_ATHENA = typeof location !== 'undefined' && !/[?&]nomyathena=1\b/.test(location.search);
export const OY = -3000;
const MODULES = ['terrain', 'water', 'temple', 'acropolis', 'aqueducts', 'statues', 'city', 'vegetation', 'waterfalls']; // R10：恢复 Athenaion 原顺序里的 water / waterfalls（失败则跳过，海面退回简易平面） // R9：waterfalls 需要 Athenaion 管线 RT，失败 → 不建
const DENSITY = { vegetation: 0.45 / 4, city: 0.3 }; // R10：树 1/40 → 1/4 原 preview 密度（Athenaion VegSystem 自带 LOD + 每实例剔除，镜头同步为玩家相机） // R9：树 / 城区实例再减半 // 其余用 preview 0.45
// 玩家出生：卫城前庭南缘（Athenaion 机位 5 前方），落地由重力贴地
export const SPAWN = [34, 70, -18];
// R8b：雾密度取负 = 关闭 R7 天空盒雾/大气透视 nbAerial（skyfog.js），exp2 雾浓度不变
// R9：远处暗琥珀灰距离雾（exp2，仍取负值 → 不走 nbAerial）
export const ATHENA_LOOK = { env: 'sky', envI: 0.4, sun: 0, exp: 0.86, fog: [0xc9d2db, -0.00001], hemi: 0.05 }; // R10：自然天空 IBL；项目 exp2 雾几乎关掉（Athenaion 材质走自己的大气透视）
export const athenaZone = (p) => (MOYUAN_ATHENA && p.y < OY + 2000 && p.y > OY - 200 ? 'abyss_athena' : null); // R9：上界 −1000（原 −500 把装订线 y≈−500.02 误判成古城）

const S = { state: 'idle', root: null, collider: null, mainCollider: null, stats: null };
window.__MOYUAN__ = () => S.stats;

function shimEngine(params, renderer) {
  const scene = new THREE.Group();
  const quality = { name: 'preview', spp: 1, msaa: 4, shadowMapSize: 2048, cascades: 3, shadowMaxFar: 1400, softShadows: false, terrainRes: 0.5, density: 0.45, detail: 0.5, cloudSteps: 16, bloom: false, ao: false };
  const cam = new THREE.PerspectiveCamera(60, 16 / 9, 0.3, 40000); cam.position.set(...SPAWN); cam.lookAt(20, 70, -64);
  return {
    scene, camera: cam, renderer, quality, params, time: 0, width: 1600, height: 900, registry: {}, updates: [], shotHooks: [],
    slots: { banner: [], brazier: [], statue: [], ivy: [], urn: [], planter: [], lamp: [], tree: [] },
    footprints: null, envIntensity: 1, stats: {},
    rng: null, onUpdate(fn) { this.updates.push(fn); }, onShot(fn) { this.shotHooks.push(fn); },
    add(obj, { castShadow = true, receiveShadow = true } = {}) { obj.traverse((o) => { if (o.isMesh) { if (o.userData.castShadow === undefined) o.userData.wantShadow = castShadow; o.castShadow = false; o.receiveShadow = o.userData.receiveShadow ?? receiveShadow; } }); scene.add(obj); return obj; },
    patchMaterial() {}, ensurePatched() {}, prepareScene() {}, applyShot() {},
  };
}

// —— 色相压制：蓝 / 青 / 绿 → 暗金 / 暗铜 / 墨褐；植物（材质名含 leaf / foliage / tree / grass）保留极暗墨绿
const _hsl = {};
function remapColor(c, plant, dark = 1) {
  c.getHSL(_hsl); let { h, s, l } = _hsl;
  if ((h < 0.065 || h > 0.94) && s > 0.3 && !plant) { h = 0.07; s *= 0.38; l *= 0.72; } // R9：屋顶红橙 → 暗陶褐
  l *= dark;
  if (h > 0.17 && h < 0.8) { if (plant) { h = 0.3; s *= 0.35; l *= 0.35; } else { h = 0.08 + (h - 0.17) * 0.05; s = Math.min(s, 0.45) * 0.7; l *= 0.55; } }
  else { s *= 0.85; l *= 0.7; }
  c.setHSL(h, s, l);
}
function remapScene(root) {
  const seen = new Set(), seenG = new Set(), c = new THREE.Color();
  root.traverse((o) => {
    if (!o.isMesh && !o.isPoints && !o.isLine) return;
    const plant = /leaf|foliage|tree|cypress|olive|pine|grass|shrub|veg|flora/i.test(o.name + (o.parent?.name ?? ''));
    let top = o; while (top.parent && top.parent !== root) top = top.parent; const dark = top.userData.mod === 'terrain' ? 0.7 : 1; // R9：地形整体压暗 30%
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!m || seen.has(m)) continue; seen.add(m);
      if (m.color) remapColor(m.color, plant, dark);
      if (m.emissive) m.emissive.multiplyScalar(0.4);
      if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u?.value?.isColor) remapColor(u.value, plant, dark);
      if ('envMapIntensity' in m) m.envMapIntensity = 0.5;
    }
    const g = o.geometry, ca = g?.attributes?.color;
    if (ca && !seenG.has(g) && ca.itemSize >= 3 && !ca.normalized) { seenG.add(g); for (let i = 0; i < ca.count; i++) { c.setRGB(ca.getX(i), ca.getY(i), ca.getZ(i)); remapColor(c, plant, dark); ca.setXYZ(i, c.r, c.g, c.b); } ca.needsUpdate = true; }
    if (o.isInstancedMesh && o.instanceColor && !seenG.has(o.instanceColor)) { const ic = o.instanceColor; seenG.add(ic); for (let i = 0; i < ic.count; i++) { c.fromArray(ic.array, i * 3); remapColor(c, plant, dark); c.toArray(ic.array, i * 3); } ic.needsUpdate = true; }
  });
}

// Athenaion 的部分材质（plaster / foliage 等）依赖其 patchMaterial 注入的大气 uniform（uSunDir…）——这里只补声明与取值，不装其 fog chunk / CSM
async function patchAtmo(root) {
  const { ATMO, FOG_PARS_VERTEX, FOG_VERTEX, FOG_PARS_FRAGMENT, FOG_FRAGMENT } = await import('./athenaion/core/atmosphere.js');
  ATMO.uAtmoEnabled.value = 1; ATMO.uAtmoOY.value = OY; // R10：恢复 Athenaion 大气透视（原 R8b 白屏因高度偏移，现由 uAtmoOY 抵消）
  const FOGSW = [['#include <fog_pars_vertex>', FOG_PARS_VERTEX], ['#include <fog_vertex>', FOG_VERTEX], ['#include <fog_pars_fragment>', FOG_PARS_FRAGMENT], ['#include <fog_fragment>', FOG_FRAGMENT]];
  void 0; // R8b：Athenaion 自带大气（uMist H=16 m / uHazeLow 300 m）按世界绝对高度算，y−3000 时光学深度爆掉 → 白屏；墨渊地下不要天空大气，整体关掉
  const ty = (v) => (typeof v === 'number' ? 'float' : v?.isVector2 ? 'vec2' : v?.isVector3 || v?.isColor ? 'vec3' : v?.isVector4 ? 'vec4' : v?.isTexture ? 'sampler2D' : null);
  const seen = new Set();
  root.traverse((o) => { for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) {
    if (seen.has(m)) continue; seen.add(m); const prev = m.onBeforeCompile;
    m.onBeforeCompile = function (sh, r) { if (prev) prev.call(this, sh, r);
      for (const [a, b] of FOGSW) for (const st of ['vertexShader', 'fragmentShader']) if (sh[st].includes(a)) sh[st] = sh[st].split(a).join(b); // R10：只给 Athenaion 材质换成其大气 fog chunk，不动全局
      for (const k in ATMO) { if (!sh.uniforms[k]) sh.uniforms[k] = ATMO[k]; const t = ty(ATMO[k].value); if (!t) continue; const decl = new RegExp('uniform\\s+\\w+\\s+' + k + '\\b');
        for (const st of ['vertexShader', 'fragmentShader']) if (new RegExp('\\b' + k + '\\b').test(sh[st]) && !decl.test(sh[st])) sh[st] = `uniform ${t} ${k};\n` + sh[st]; }
      scrubNaN(sh); };
    const base = m.customProgramCacheKey?.bind(m); m.customProgramCacheKey = () => (base ? base() : '') + '|nbAtmo|r10'; m.needsUpdate = true; } });
}

// R8c 真因：?mypost=0 时画面正常，开后处理（HalfFloat HDR + mipmap Bloom）才整屏灰白、带锐利竖直块边——
// 是 Athenaion 某些材质（神庙 / 卫城 / 渡槽 / 植被组）输出了 NaN / Inf 像素，被 Bloom 的 mip 链扩散到全屏、AgX 映射成灰白。
// 修：给 Athenaion 全部材质的片元出口包一层，NaN / Inf → 黑，HDR 上限钳到 256。
function scrubNaN(sh) {
  const re = /void\s+main\s*\(\s*(?:void)?\s*\)/g; const fs = sh.fragmentShader;
  if ((fs.match(re) || []).length !== 1 || /nbMainR8c/.test(fs)) return;
  sh.fragmentShader = fs.replace(re, 'void nbMainR8c()') + '\nvoid main() { nbMainR8c(); vec4 c = gl_FragColor; if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0, 0.0, 0.0, 1.0); gl_FragColor = vec4(clamp(c.rgb, 0.0, 256.0), clamp(c.a, 0.0, 1.0)); }\n';
}

function collectCollider(root) {
  const geos = []; root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !o.geometry?.attributes?.position) return;
    const top = (() => { let a = o; while (a.parent && a.parent !== root) a = a.parent; return a.userData.mod; })();
    if (!/^(terrain|temple|acropolis|aqueducts)$/.test(top ?? '')) return;
    if (top === 'terrain' && !o.userData.castShadow) return; // 只取近处地形块
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    const pa = g.attributes.position, f = new Float32Array(pa.count * 3); for (let i = 0; i < pa.count; i++) { f[i * 3] = pa.getX(i); f[i * 3 + 1] = pa.getY(i); f[i * 3 + 2] = pa.getZ(i); } // 量化 / 交错位置统一转 Float32，避免合并失败
    g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(f, 3)); g.applyMatrix4(o.matrixWorld); geos.push(g);
  });
  if (!geos.length) return null;
  const merged = mergeGeometries(geos.filter((g) => g.attributes.position.itemSize === 3 && !g.attributes.position.isInterleavedBufferAttribute), false); if (!merged) return null; merged.boundsTree = new MeshBVH(merged);
  const m = new THREE.Mesh(merged, new THREE.MeshBasicMaterial()); m.visible = false; return m;
}

async function build(G) {
  S.state = 'loading'; manager.itemStart('moyuan:athena');
  const t0 = performance.now(), mem0 = performance.memory?.usedJSHeapSize ?? 0;
  const params = new URLSearchParams(location.search);
  const E = shimEngine(params, G.renderer); S.E = E;
  const { Footprints } = await import('./athenaion/core/footprints.js');
  const { RNG } = await import('./athenaion/core/rng.js');
  E.footprints = new Footprints(); E.rng = (label) => new RNG(String(label));
  const times = {};
  for (const [mi, name] of MODULES.entries()) {
    S.onProgress?.(0.1 + 0.8 * mi / MODULES.length, '正在展开墨渊古城……（' + name + '）'); await new Promise((r) => setTimeout(r, 0));
    const t = performance.now(); const before = new Set(E.scene.children);
    E.quality.density = DENSITY[name] ?? 0.45;
    try { const mod = await import(`./athenaion/modules/${name}.js`); if (typeof mod.build === 'function') await mod.build(E); }
    catch (e) { console.warn('[moyuan] module', name, 'skipped:', String(e?.message ?? e).slice(0, 160)); times[name] = 'ERR ' + String(e?.message ?? e).slice(0, 80); continue; }
    for (const ch of E.scene.children) if (!before.has(ch)) ch.userData.mod = name;
    times[name] = Math.round(performance.now() - t);
  }
  const root = E.scene; root.name = 'moyuan_athena'; root.position.y = OY;
  root.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = o.frustumCulled !== false; } });
  await patchAtmo(root); // R10：不再 remapScene（保留 Athenaion 原配色）
  await addNature(root, E, times);
  if (DBG) { const keep = DBG.split(','); for (const ch of root.children) if (!ch.isLight && ch.userData.mod) ch.visible = keep.includes(ch.userData.mod); console.log('[NB] mydbg show', DBG, JSON.stringify(root.children.filter((c) => c.userData.mod).map((c) => c.userData.mod + ':' + (c.visible ? 1 : 0)))); }
  // R9：远处小件剔除（城区 / 雕像 / 植被 / 渡槽 包围球 r<45 m 且离相机 > 650 m 不画）
  S.cull = []; root.updateMatrixWorld(true); root.traverse((o) => { if (!o.isMesh || !o.geometry) return; let a = o; while (a.parent && a.parent !== root) a = a.parent; if (!/^(city|statues|vegetation|aqueducts|temple)$/.test(a.userData.mod ?? '')) return; o.geometry.boundingSphere || o.geometry.computeBoundingSphere(); const bs = o.geometry.boundingSphere; if (!bs || o.isInstancedMesh) { if (o.isInstancedMesh && o.count > 0) { o.computeBoundingSphere?.(); } } const sp = (o.isInstancedMesh && o.boundingSphere) ? o.boundingSphere : bs; if (!sp) return; const c = sp.center.clone().applyMatrix4(o.matrixWorld); const r = sp.radius * o.matrixWorld.getMaxScaleOnAxis(); if (r < 45) S.cull.push({ o, c, r }); });
  G.scene.add(root); S.root = root; S.updates = E.updates; startProbe(G);
  const tc = performance.now(); S.collider = collectCollider(root); const colMs = Math.round(performance.now() - tc);
  let tris = 0, meshes = 0; root.traverse((o) => { if (!o.isMesh || !o.geometry) return; meshes++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position?.count ?? 0) / 3 * (o.isInstancedMesh ? o.count : 1); });
  S.stats = { buildMs: Math.round(performance.now() - t0), colliderMs: colMs, colliderTris: S.collider ? S.collider.geometry.attributes.position.count / 3 : 0, modules: times, meshes, tris: Math.round(tris), heapMB: performance.memory ? Math.round((performance.memory.usedJSHeapSize - mem0) / 1e6) : null };
  console.log('[moyuan] athena built', JSON.stringify(S.stats));
  placeRelics(G);
  S.state = 'ready'; manager.itemEnd('moyuan:athena');
}

// R8c 调试：?mydbg=模块名[,模块名…]（terrain / temple / acropolis / aqueducts / statues / city / vegetation / dome / ink）只显示所列模块；
// 构建后每 4 s 打印一次相机位置与 5 条屏幕射线的首个命中（[NB] 前缀，截图工具会转发）
const DBG = new URLSearchParams(location.search).get('mydbg');
function startProbe(G) {
  if (!DBG && !/[?&]myprobe=1/.test(location.search) && !/[?&]mypost=0/.test(location.search)) return;
  let n = 0; const rc = new THREE.Raycaster(); rc.far = 20000; const v = new THREE.Vector2(), d = new THREE.Vector3();
  const targets = () => { const out = []; const walk = (o) => { if (!o.visible) return; if (o.isMesh) out.push(o); for (const c of o.children) walk(c); }; walk(G.scene); return out; };
  const top = (o) => { let a = o; while (a.parent && a.parent !== S.root && a.parent.parent) a = a.parent; return a.userData.mod ?? a.name; };
  const tick = () => {
    if (n++ >= 6) return; const cam = G.camera; cam.updateMatrixWorld(); cam.getWorldDirection(d);
    console.log('[NB] mydbg cam', cam.position.toArray().map((x) => x.toFixed(1)).join(','), 'dir', d.toArray().map((x) => x.toFixed(2)).join(','), 'near', cam.near, 'far', cam.far, 'zone', G.zone, 'rootVis', S.root?.visible, 'fog', G.scene.fog?.density, 'bg', G.scene.background?.getHexString?.());
    const T = targets();
    for (const [x, y] of [[0, 0], [-0.97, 0], [0.5, 0.4], [-0.5, -0.4], [0, -0.85]]) {
      v.set(x, y); rc.setFromCamera(v, cam); let h = null; try { h = rc.intersectObjects(T, false)[0]; } catch (e) { console.log('[NB] mydbg ray err', String(e)); }
      if (!h) { console.log('[NB] mydbg ray', x, y, 'MISS'); continue; }
      const m = Array.isArray(h.object.material) ? h.object.material[0] : h.object.material;
      console.log('[NB] mydbg ray', x, y, 'hit', h.object.name || h.object.type, 'mod', top(h.object), 'dist', h.distance.toFixed(2), 'mat', m?.type, m?.name, 'col', m?.color?.getHexString?.(), 'emi', m?.emissive?.getHexString?.(), 'side', m?.side, 'transp', m?.transparent, 'shader', !!m?.isShaderMaterial, 'inst', !!h.object.isInstancedMesh);
    }
    setTimeout(tick, 4000);
  };
  setTimeout(tick, 500);
}

// R10：Athenaion 原样的天空（程序化天穹 + 体积云 raymarch + 太阳盘）、太阳（方向光 + 阴影）、海面兜底；入口 1–2 件管理局封存标识
async function addNature(root, E, times) {
  const { createSky, SKY, ensureCloudTextures } = await import('./athenaion/core/sky.js');
  const { ATMO } = await import('./athenaion/core/atmosphere.js');
  const { sunColorForElevation } = await import('./athenaion/core/lighting.js');
  const { dirFromAzEl, SUN: SUN0 } = await import('./athenaion/world/layout.js');
  S.SKY = SKY;
  const dir = new THREE.Vector3(...dirFromAzEl(SUN0.azimuth, SUN0.elevation)).normalize();
  const col = sunColorForElevation(SUN0.elevation), I = 12.0;
  ATMO.uSunDir.value.copy(dir); ATMO.uSunColor.value.copy(col);
  SKY.uSunIrr.value.set(col.r, col.g, col.b).multiplyScalar(I);
  if (SKY.uSunDiskDir) SKY.uSunDiskDir.value.copy(dir);
  SKY.uCloudSteps.value = /[?&]q=low\b/.test(location.search) ? 10 : 16;
  try { if (E.renderer) ensureCloudTextures(E.renderer); } catch (e) { console.warn('[moyuan] cloud noise skipped', String(e?.message ?? e)); }
  {
    const sky = createSky(); sky.userData.mod = 'sky';
    if (/[?&]nomycloud=1\b/.test(location.search)) SKY.uCloudCover && (SKY.uCloudCover.value = 0);
    // y−3000 平移：天空片元里的 cameraPosition 换成原高度
    const m = sky.material; m.uniforms.uAtmoOY = ATMO.uAtmoOY;
    m.fragmentShader = 'uniform float uAtmoOY;\n' + m.fragmentShader.replace(/\bcameraPosition\b/g, '(cameraPosition - vec3(0.0, uAtmoOY, 0.0))');
    m.fragmentShader = m.fragmentShader.replace('uEnvPass > 0.5 ? 1.0 : 0.0', '1.0'); // 本项目画布带 alpha：天空 alpha 0 会透成黑底
    if (/uniform float uAtmoOY;[\s\S]*uniform float uAtmoOY;/.test(m.fragmentShader)) m.fragmentShader = m.fragmentShader.replace('uniform float uAtmoOY;\n', '');
    root.add(sky); S.sky = sky;
  }
  // 太阳：Athenaion 默认方位 238° / 仰角 21°、强度 12、按空气质量的金色；单张 2048 阴影，覆盖卫城一带 ±420 m
  const key = new THREE.DirectionalLight(col, I); key.name = 'moyuan_sun';
  const C = new THREE.Vector3(20, 80, -50); key.target.position.copy(C); key.position.copy(C).addScaledVector(dir, 1500);
  key.castShadow = true; const sc = key.shadow.camera; sc.left = sc.bottom = -420; sc.right = sc.top = 420; sc.near = 10; sc.far = 3200; sc.updateProjectionMatrix();
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.6; root.add(key, key.target);
  root.updateMatrixWorld(true); const v = new THREE.Vector3(); let nc = 0;
  root.traverse((o) => { if (!o.isMesh || o.userData.wantShadow === false || o === S.sky) return; let a = o; while (a.parent && a.parent !== root) a = a.parent; if (!/^(temple|acropolis|aqueducts|statues|city|terrain)$/.test(a.userData.mod ?? '')) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const bs = o.geometry.boundingSphere; if (!bs) return; v.copy(bs.center).applyMatrix4(o.matrixWorld); v.y -= OY;
    const r = bs.radius * o.matrixWorld.getMaxScaleOnAxis(); if (a.userData.mod === 'terrain' ? r > 900 : r > 200) return; if (v.distanceTo(C) - r < 450) { o.castShadow = true; nc++; } o.receiveShadow = true; });
  times.shadowCasters = nc;
  // 海 / 潟湖：water 模块失败时用简易海面（Athenaion SEA_LEVEL = 0）
  if (typeof times.water !== 'number') {
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), new THREE.MeshStandardMaterial({ color: 0x1b3d4c, roughness: 0.12, metalness: 0.0, envMapIntensity: 1.2 }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = 0; sea.name = 'moyuan_sea'; sea.userData.mod = 'sea'; root.add(sea);
  }
}

// 入口：管理局封存标识（编号铜牌 + 红色封条），按出生点前方落地
function bureauSeal() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 320; const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 512, 320); g.addColorStop(0, '#8a6a3c'); g.addColorStop(1, '#5a4224'); c.fillStyle = g; c.fillRect(0, 0, 512, 320);
  c.strokeStyle = '#2e2010'; c.lineWidth = 10; c.strokeRect(14, 14, 484, 292); c.fillStyle = '#21160a'; c.textAlign = 'center';
  c.font = 'bold 44px serif'; c.fillText('叙事管理局 · 封存遗迹', 256, 96); c.font = 'bold 64px monospace'; c.fillText('NB-M-0008', 256, 186);
  c.font = '30px serif'; c.fillText('墨渊 · 雅典娜　未经批文不得深入', 256, 256);
  c.save(); c.translate(256, 160); c.rotate(-0.22); c.fillStyle = 'rgba(170,20,16,0.88)'; c.fillRect(-300, -26, 600, 52); c.fillStyle = '#f3e6d0'; c.font = 'bold 34px serif'; c.fillText('封 · 叙事管理局 · 封', 0, 12); c.restore();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const grp = new THREE.Group(); grp.name = 'bureau_seal';
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), [0, 0, 0, 0, 0, 0].map((_, i) => (i === 4 ? new THREE.MeshStandardMaterial({ map: t, metalness: 0.6, roughness: 0.45 }) : new THREE.MeshStandardMaterial({ color: 0x4a3418, metalness: 0.8, roughness: 0.4 }))));
  plate.position.y = 1.35; const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0x2a2018, metalness: 0.7, roughness: 0.5 })); post.position.y = 0.7;
  grp.add(plate, post); grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return grp;
}

// R9：旧墨渊四区的剧情点（depths.js 默认只建这些，不建几何）挂进古城：按古城本地 (x, z) 向下找地面
function placeRelics(G) {
  const d = G.ctx?.depths; if (!d?.athenaRelics || !S.root) return;
  const rc = new THREE.Raycaster(); rc.firstHitOnly = true; const down = new THREE.Vector3(0, -1, 0);
  const ground = (x, z, fromY) => { if (!S.collider) return null; rc.set(new THREE.Vector3(x, OY + fromY, z), down); rc.far = fromY + 400; const h = rc.intersectObject(S.collider, false)[0]; return h ? h.point.y - OY : null; };
  const g0 = ground(SPAWN[0], SPAWN[2], 400) ?? 66;
  const gy = (x, z) => ground(x, z, g0 + 12) ?? g0;
  for (const { obj, at } of d.athenaRelics) { const [x, z, dy, yaw] = at; S.root.attach(obj); obj.position.set(x, gy(x, z) + dy, z); if (yaw != null) obj.rotation.y = yaw; if (obj === d.floatFile) d.floatFileBase = obj.position.y + OY; }
  for (const { box, at } of d.athenaBoxes ?? []) { const [x, z, dy] = at; box[0] = x; box[1] = OY + gy(x, z) + dy; box[2] = z; }
  // floatFile 动画按世界 y 写 position（root 只平移 y）→ 基准换成本地
  if (d.floatFileBase != null) d.floatFileBase -= OY;
  { const seal = bureauSeal(); S.root.add(seal); const sx = SPAWN[0] - 3, sz = SPAWN[2] - 6; seal.position.set(sx, gy(sx, sz), sz); seal.rotation.y = 0.35; }
  S.relicY = d.athenaRelics.map((r) => +(r.obj.position.y).toFixed(1));
  console.log('[moyuan] relics placed', d.athenaRelics.length, 'g0', g0.toFixed(1));
}

/** main.js 调用：G = { scene, camera, world, player, onZone, onUpdate }；tp(x,y,z,yaw) 传送 */
export function setupMoyuanAthena(G, tp) {
  if (!MOYUAN_ATHENA) return;
  const enter = (z) => {
    const inAthena = z === 'abyss_athena';
    if (S.root) S.root.visible = inAthena;
    if (inAthena) { G.camera.far = 40000; G.camera.near = 0.2; G.camera.updateProjectionMatrix(); if (S.collider) { S.mainCollider ??= G.world.collider; G.world.collider = S.collider; } }
    else { if (G.camera.far !== 6000) { G.camera.far = 6000; G.camera.near = 0.05; G.camera.updateProjectionMatrix(); } if (S.mainCollider) G.world.collider = S.mainCollider; }
  };
  let loadUI = false;
  S.onProgress = (p, tip) => { if (loadUI) midLoad(true, p, tip); };
  const start = () => { if (S.state !== 'idle') return S.promise; S.promise = build(G).then(() => enter(G.zone)).catch((e) => { console.error('[moyuan] build failed', e); S.state = 'failed'; manager.itemEnd('moyuan:athena'); }); return S.promise; };
  // 进入深渊门广场（abyss_gate）即后台预构建；穿过折页门 → 传送进古城（未构建完则显示齿轮加载层等待）
  G.onZone.push((z) => { if (/^abyss/.test(z)) start(); enter(z); });
  const goIn = async () => {
    if (S.state !== 'ready') { loadUI = true; G.freeze?.(true); midLoad(true, 0.08, '正在展开墨渊古城……'); await start(); loadUI = false; midLoad(false); G.freeze?.(false); }
    if (S.state === 'ready') { tp(SPAWN[0], OY + SPAWN[1], SPAWN[2], Math.PI); G.glitch?.(1.4); }
  };
  G.ctx.hooks = G.ctx.hooks ?? {}; G.ctx.hooks.int_abyss_fold = () => goIn();
  G.toAthena = goIn; window.__MOYUAN_STATE__ = () => ({ state: S.state, relicY: S.relicY, stats: S.stats });
  const cam = new THREE.Vector3(); let acc = 0;
  G.onUpdate.push((dt, t) => {
    if (!S.root?.visible) return;
    if (S.E) { const ec = S.E.camera; G.camera.updateMatrixWorld(); ec.matrixWorld.copy(G.camera.matrixWorld); ec.matrixWorld.decompose(ec.position, ec.quaternion, ec.scale); ec.position.y -= OY; ec.fov = G.camera.fov; ec.aspect = G.camera.aspect; ec.near = G.camera.near; ec.far = G.camera.far; ec.updateProjectionMatrix(); ec.updateMatrixWorld(true); } // R10：Athenaion 的 LOD / 剔除按玩家相机（去掉 y 平移）
    S.skyT = (S.skyT ?? 0) + (dt ?? 0.016); if (S.SKY) S.SKY.uSkyTime.value = S.skyT;
    for (const f of S.updates ?? []) try { f(S.skyT, dt); } catch { /* 动画失败不影响游戏 */ }
    if ((acc += dt ?? 0.016) < 0.4 && S.culled) return; acc = 0; S.culled = true; // R9：远处小件剔除，0.4 s 一次
    G.camera.getWorldPosition(cam); for (const it of S.cull ?? []) it.o.visible = cam.distanceTo(it.c) - it.r < 650;
  });
}
