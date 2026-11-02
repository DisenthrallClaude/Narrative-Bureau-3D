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

// R9：默认开启（墨渊 = 古城）；?nomyathena=1 回退旧墨渊四区
export const MOYUAN_ATHENA = typeof location !== 'undefined' && !/[?&]nomyathena=1\b/.test(location.search);
export const OY = -3000;
const MODULES = ['terrain', 'temple', 'acropolis', 'aqueducts', 'statues', 'city', 'vegetation']; // R9：waterfalls 需要 Athenaion 管线 RT，失败 → 不建
const DENSITY = { vegetation: 0.45 / 40, city: 0.225 }; // R9：树 / 城区实例再减半 // 其余用 preview 0.45
// 玩家出生：卫城前庭南缘（Athenaion 机位 5 前方），落地由重力贴地
export const SPAWN = [34, 70, -18];
// R8b：雾密度取负 = 关闭 R7 天空盒雾/大气透视 nbAerial（skyfog.js），exp2 雾浓度不变
// R9：远处暗琥珀灰距离雾（exp2，仍取负值 → 不走 nbAerial）
export const ATHENA_LOOK = { env: 'hall', envI: 0.3, sun: 0, exp: 1.3, fog: [0x2a2117, -0.0009], hemi: 0.2 };
export const athenaZone = (p) => (MOYUAN_ATHENA && p.y < OY + 2500 && p.y > OY - 200 ? 'abyss_athena' : null);

const S = { state: 'idle', root: null, collider: null, mainCollider: null, stats: null };
window.__MOYUAN__ = () => S.stats;

function shimEngine(params) {
  const scene = new THREE.Group();
  const quality = { name: 'preview', spp: 1, msaa: 4, shadowMapSize: 2048, cascades: 3, shadowMaxFar: 1400, softShadows: false, terrainRes: 0.5, density: 0.45, detail: 0.5, cloudSteps: 16, bloom: false, ao: false };
  const cam = new THREE.PerspectiveCamera(60, 16 / 9, 0.5, 20000); cam.position.set(...SPAWN); cam.lookAt(20, 70, -64);
  return {
    scene, camera: cam, quality, params, time: 0, width: 1600, height: 900, registry: {}, updates: [], shotHooks: [],
    slots: { banner: [], brazier: [], statue: [], ivy: [], urn: [], planter: [], lamp: [], tree: [] },
    footprints: null, envIntensity: 1, stats: {},
    rng: null, onUpdate(fn) { this.updates.push(fn); }, onShot(fn) { this.shotHooks.push(fn); },
    add(obj, { castShadow = false, receiveShadow = true } = {}) { obj.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = receiveShadow && !!castShadow; } }); scene.add(obj); return obj; },
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
  const { ATMO } = await import('./athenaion/core/atmosphere.js');
  ATMO.uAtmoEnabled.value = 0; // R8b：Athenaion 自带大气（uMist H=16 m / uHazeLow 300 m）按世界绝对高度算，y−3000 时光学深度爆掉 → 白屏；墨渊地下不要天空大气，整体关掉
  const ty = (v) => (typeof v === 'number' ? 'float' : v?.isVector2 ? 'vec2' : v?.isVector3 || v?.isColor ? 'vec3' : v?.isVector4 ? 'vec4' : v?.isTexture ? 'sampler2D' : null);
  const seen = new Set();
  root.traverse((o) => { for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) {
    if (seen.has(m)) continue; seen.add(m); const prev = m.onBeforeCompile;
    m.onBeforeCompile = function (sh, r) { if (prev) prev.call(this, sh, r);
      for (const k in ATMO) { if (!sh.uniforms[k]) sh.uniforms[k] = ATMO[k]; const t = ty(ATMO[k].value); if (!t) continue; const decl = new RegExp('uniform\\s+\\w+\\s+' + k + '\\b');
        for (const st of ['vertexShader', 'fragmentShader']) if (new RegExp('\\b' + k + '\\b').test(sh[st]) && !decl.test(sh[st])) sh[st] = `uniform ${t} ${k};\n` + sh[st]; }
      scrubNaN(sh); };
    const base = m.customProgramCacheKey?.bind(m); m.customProgramCacheKey = () => (base ? base() : '') + '|nbAtmo|r8c'; m.needsUpdate = true; } });
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
  const E = shimEngine(params);
  const { Footprints } = await import('./athenaion/core/footprints.js');
  const { RNG } = await import('./athenaion/core/rng.js');
  E.footprints = new Footprints(); E.rng = (label) => new RNG(String(label));
  const times = {};
  for (const [mi, name] of MODULES.entries()) {
    S.onProgress?.(0.1 + 0.8 * mi / MODULES.length, '正在展开墨渊古城……（' + name + '）'); await new Promise((r) => setTimeout(r, 0));
    const t = performance.now(); const before = new Set(E.scene.children);
    E.quality.density = DENSITY[name] ?? 0.45;
    try { const mod = await import(`./athenaion/modules/${name}.js`); if (typeof mod.build === 'function') await mod.build(E); }
    catch (e) { console.error('[moyuan] module', name, 'failed:', e?.stack || e); times[name] = 'ERR ' + String(e?.message ?? e).slice(0, 80); continue; }
    for (const ch of E.scene.children) if (!before.has(ch)) ch.userData.mod = name;
    times[name] = Math.round(performance.now() - t);
  }
  const root = E.scene; root.name = 'moyuan_athena'; root.position.y = OY;
  root.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = o.frustumCulled !== false; } });
  remapScene(root); await patchAtmo(root);
  // 地底化：岩顶穹顶、墨黑静水、暗金点光 + 暗铜环境
  root.add(makeDome());
  const ink = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000), new THREE.MeshStandardMaterial({ color: 0x030202, roughness: 0.06, metalness: 0.2 }));
  ink.rotation.x = -Math.PI / 2; ink.position.y = 0.6; ink.name = 'moyuan_ink'; ink.userData.mod = 'ink'; root.add(ink);
  const amb = new THREE.HemisphereLight(0x5a3e22, 0x0e0a06, 0.42); root.add(amb);
  const key = new THREE.DirectionalLight(0xffa850, 0.55); key.position.set(-400, 1500, 600); key.target.position.set(20, 60, -64); root.add(key, key.target);
  // R9：暗金光池（卫城 / 巨像 / 阶梯 / 渡槽 / 神庙）
  for (const [x, y, z, i, d] of [[20, 105, -50, 2600, 140], [50, 92, -30, 1400, 70], [30, 78, -4, 700, 45], [-300, 90, 100, 2400, 260], [22, 74, -52, 260, 26]]) { const p = new THREE.PointLight(0xffa040, i, d, 2); p.position.set(x, y, z); root.add(p); }
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

// R9：岩顶穹顶——项目已有 CC0 暗岩贴图（ambientCG Granite003A）压暗 + 暗金裂隙微光（程序化 emissiveMap）；不吃雾
function makeDome() {
  const tl = new THREE.TextureLoader(manager), rep = (t, cs) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(36, 9); if (cs) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const map = rep(tl.load('./assets/tex/Granite003A_color.webp'), true), nrm = rep(tl.load('./assets/tex/Granite003A_normal.webp'));
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, 1024, 512);
  let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 9; k++) { let x = rnd() * 1024, y = 60 + rnd() * 360; c.strokeStyle = `rgba(255,${150 + rnd() * 50 | 0},60,${0.55 + rnd() * 0.4})`; c.lineWidth = 1 + rnd() * 2.2; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 22; j++) { x += 8 + rnd() * 26; y += (rnd() - 0.5) * 30; c.lineTo(x % 1024, y); if (x > 1024) { x -= 1024; c.stroke(); c.beginPath(); c.moveTo(x, y); } } c.stroke(); }
  const em = new THREE.CanvasTexture(cv); em.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ color: 0x2a2018, map, normalMap: nrm, roughness: 1, side: THREE.BackSide, fog: false, emissive: 0xffa040, emissiveMap: em, emissiveIntensity: 0.9 });
  // 主贴图平铺，裂隙图不平铺：裂隙用 uv2 不可得 → 让 emissiveMap 取 1× 重复（three r186 每张贴图各自 transform）
  em.repeat.set(1, 1);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(9000, 64, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), mat);
  dome.position.set(0, -400, 0); dome.scale.y = 0.22; dome.name = 'moyuan_dome'; dome.userData.mod = 'dome'; return dome;
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
  S.relicY = d.athenaRelics.map((r) => +(r.obj.position.y).toFixed(1));
  console.log('[moyuan] relics placed', d.athenaRelics.length, 'g0', g0.toFixed(1));
}

/** main.js 调用：G = { scene, camera, world, player, onZone, onUpdate }；tp(x,y,z,yaw) 传送 */
export function setupMoyuanAthena(G, tp) {
  if (!MOYUAN_ATHENA) return;
  const enter = (z) => {
    const inAthena = z === 'abyss_athena';
    if (S.root) S.root.visible = inAthena;
    if (inAthena) { G.camera.far = 16000; G.camera.near = 0.15; G.camera.updateProjectionMatrix(); if (S.collider) { S.mainCollider ??= G.world.collider; G.world.collider = S.collider; } }
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
    for (const f of S.updates ?? []) try { f(t ?? 0, dt); } catch { /* 动画失败不影响游戏 */ }
    if ((acc += dt ?? 0.016) < 0.4 && S.culled) return; acc = 0; S.culled = true; // R9：远处小件剔除，0.4 s 一次
    G.camera.getWorldPosition(cam); for (const it of S.cull ?? []) it.o.visible = cam.distanceTo(it.c) - it.r < 650;
  });
}
