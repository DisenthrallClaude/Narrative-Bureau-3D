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

export const MOYUAN_ATHENA = typeof location !== 'undefined' && /[?&]moyuan=athena\b/.test(location.search);
export const OY = -3000;
const MODULES = ['terrain', 'temple', 'acropolis', 'aqueducts', 'statues', 'city', 'vegetation', 'waterfalls'];
const DENSITY = { vegetation: 0.45 / 20, waterfalls: 0.15 }; // 其余用 preview 0.45
// 玩家出生：卫城前庭南缘（Athenaion 机位 5 前方），落地由重力贴地
export const SPAWN = [34, 70, -18];
// R8b：雾密度取负 = 关闭 R7 天空盒雾/大气透视 nbAerial（skyfog.js），exp2 雾浓度不变
export const ATHENA_LOOK = { env: 'hall', envI: 0.3, sun: 0, exp: 1.3, fog: [0x17120c, -0.00042], hemi: 0.2 };
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
function remapColor(c, plant) {
  c.getHSL(_hsl); let { h, s, l } = _hsl;
  if (h > 0.17 && h < 0.8) { if (plant) { h = 0.3; s *= 0.35; l *= 0.35; } else { h = 0.08 + (h - 0.17) * 0.05; s = Math.min(s, 0.45) * 0.7; l *= 0.55; } }
  else { s *= 0.85; l *= 0.7; }
  c.setHSL(h, s, l);
}
function remapScene(root) {
  const seen = new Set(), seenG = new Set(), c = new THREE.Color();
  root.traverse((o) => {
    if (!o.isMesh && !o.isPoints && !o.isLine) return;
    const plant = /leaf|foliage|tree|cypress|olive|pine|grass|shrub|veg|flora/i.test(o.name + (o.parent?.name ?? ''));
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!m || seen.has(m)) continue; seen.add(m);
      if (m.color) remapColor(m.color, plant);
      if (m.emissive) m.emissive.multiplyScalar(0.4);
      if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u?.value?.isColor) remapColor(u.value, plant);
      if ('envMapIntensity' in m) m.envMapIntensity = 0.5;
    }
    const g = o.geometry, ca = g?.attributes?.color;
    if (ca && !seenG.has(g) && ca.itemSize >= 3 && !ca.normalized) { seenG.add(g); for (let i = 0; i < ca.count; i++) { c.setRGB(ca.getX(i), ca.getY(i), ca.getZ(i)); remapColor(c, plant); ca.setXYZ(i, c.r, c.g, c.b); } ca.needsUpdate = true; }
    if (o.isInstancedMesh && o.instanceColor && !seenG.has(o.instanceColor)) { const ic = o.instanceColor; seenG.add(ic); for (let i = 0; i < ic.count; i++) { c.fromArray(ic.array, i * 3); remapColor(c, plant); c.toArray(ic.array, i * 3); } ic.needsUpdate = true; }
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
        for (const st of ['vertexShader', 'fragmentShader']) if (new RegExp('\\b' + k + '\\b').test(sh[st]) && !decl.test(sh[st])) sh[st] = `uniform ${t} ${k};\n` + sh[st]; } };
    const base = m.customProgramCacheKey?.bind(m); m.customProgramCacheKey = () => (base ? base() : '') + '|nbAtmo'; m.needsUpdate = true; } });
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
  for (const name of MODULES) {
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
  const dome = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0x0c0907, roughness: 1, side: THREE.BackSide }));
  dome.position.set(0, -400, 0); dome.scale.y = 0.22; dome.name = 'moyuan_dome'; dome.userData.mod = 'dome'; root.add(dome);
  const ink = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000), new THREE.MeshStandardMaterial({ color: 0x030202, roughness: 0.06, metalness: 0.2 }));
  ink.rotation.x = -Math.PI / 2; ink.position.y = 0.6; ink.name = 'moyuan_ink'; ink.userData.mod = 'ink'; root.add(ink);
  const amb = new THREE.HemisphereLight(0x6a4a2a, 0x120c08, 0.6); root.add(amb);
  const key = new THREE.DirectionalLight(0xffb060, 0.9); key.position.set(-400, 1500, 600); key.target.position.set(20, 60, -64); root.add(key, key.target);
  for (const [x, y, z, i] of [[20, 110, -40, 1800], [50, 90, -10, 800], [-10, 90, -10, 800], [-300, 80, 100, 1200]]) { const p = new THREE.PointLight(0xffa040, i, 0, 2); p.position.set(x, y, z); root.add(p); }
  if (DBG) { const keep = DBG.split(','); for (const ch of root.children) if (!ch.isLight && ch.userData.mod) ch.visible = keep.includes(ch.userData.mod); console.log('[NB] mydbg show', DBG, JSON.stringify(root.children.filter((c) => c.userData.mod).map((c) => c.userData.mod + ':' + (c.visible ? 1 : 0)))); }
  G.scene.add(root); S.root = root; S.updates = E.updates; startProbe(G);
  const tc = performance.now(); S.collider = collectCollider(root); const colMs = Math.round(performance.now() - tc);
  let tris = 0, meshes = 0; root.traverse((o) => { if (!o.isMesh || !o.geometry) return; meshes++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position?.count ?? 0) / 3 * (o.isInstancedMesh ? o.count : 1); });
  S.stats = { buildMs: Math.round(performance.now() - t0), colliderMs: colMs, colliderTris: S.collider ? S.collider.geometry.attributes.position.count / 3 : 0, modules: times, meshes, tris: Math.round(tris), heapMB: performance.memory ? Math.round((performance.memory.usedJSHeapSize - mem0) / 1e6) : null };
  console.log('[moyuan] athena built', JSON.stringify(S.stats));
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

/** main.js 调用：G = { scene, camera, world, player, onZone, onUpdate }；tp(x,y,z,yaw) 传送 */
export function setupMoyuanAthena(G, tp) {
  if (!MOYUAN_ATHENA) return;
  const enter = (z) => {
    const inAthena = z === 'abyss_athena';
    if (S.root) S.root.visible = inAthena;
    if (inAthena) { G.camera.far = 16000; G.camera.near = 0.15; G.camera.updateProjectionMatrix(); if (S.collider) { S.mainCollider ??= G.world.collider; G.world.collider = S.collider; } }
    else { if (G.camera.far !== 6000) { G.camera.far = 6000; G.camera.near = 0.05; G.camera.updateProjectionMatrix(); } if (S.mainCollider) G.world.collider = S.mainCollider; }
  };
  G.onZone.push((z) => {
    if (/^abyss/.test(z) && S.state === 'idle') build(G).then(() => { enter(G.zone); if (!window.__SHOT__ && z !== 'abyss_athena') tp(SPAWN[0], OY + SPAWN[1], SPAWN[2], Math.PI); }).catch((e) => { console.error('[moyuan] build failed', e); S.state = 'failed'; manager.itemEnd('moyuan:athena'); });
    else enter(z);
  });
  G.onUpdate.push((dt, t) => { if (S.root?.visible) for (const f of S.updates ?? []) try { f(t ?? 0, dt); } catch { /* 动画失败不影响游戏 */ } });
}
