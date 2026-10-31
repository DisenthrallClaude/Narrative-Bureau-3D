// 《叙事管理局》入口：渲染、加载、分区、控制、交互、剧情
import * as THREE from 'three';
import { chunkGroup, LodCells, DistCull, PortalCull } from './engine/chunk.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { Renderer, QUALITY } from './engine/renderer.js';
import { manager, loadHDR, setAnisotropy } from './engine/assets.js';
import { World, Player } from './engine/physics.js';
import { Interactions } from './engine/interact.js';
import { Audio } from './engine/audio.js';
import { content } from './engine/content.js';
import { buildM5 } from './world/dress_m5.js';
import { applyM14Training } from './world/m14_training.js';
import { buildSurface } from './world/surface.js';
import { buildDepths, updateDepths, depthZone, setupDepths } from './world/depths.js';
import { PlanarReflector } from './engine/reflect.js';
import { time } from './engine/fx.js';
import { buildExterior, updateExterior, FLOOR } from './world/exterior.js';
import { buildInteriors, updateInteriors } from './world/interiors.js';
import { buildEastWing, updateEastWing } from './world/eastwing.js';
import { bindAll, runInteractable } from './engine/binder.js';
import { buildVault, updateVault, setupElevator } from './world/vault.js';
import { buildRooms, updateRooms } from './world/rooms.js';
import { buildUpper, updateUpper } from './world/upper.js';
import { buildDressing, updateDressing } from './world/dressing.js';
import { buildR3 } from './world/r3build.js';
import { applyM12Training } from './world/m12_training.js';
import { applyBakes, exportBake, BAKES } from './engine/bakeao.js';
import { installSkyFog } from './engine/skyfog.js';
import { mats } from './world/mats.js';
import { setupStory } from './story.js';
import * as UI from './ui/ui.js';
import { SHOTS } from './shots.js';
import { TOD, TOD_NAME, setTod } from './engine/tod.js';

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot');
const TEST = !!params.get('test'); // M7：走查模式不预编译、不渲染（SwiftShader 下整场景编译+渲染要十几分钟）
const LOG = (...a) => { if (SHOT) console.log('[NB]', ...a); };
window.__SHOT__ = !!SHOT;
// 批次12：截图模式省内存（?freecpu=1，tools/shot.mjs 在 8 GB 本机用）。实测渲染进程里 GLB 贴图 ImageBitmap 解码副本 1299 张 ≈ 2.6 GB，
// 而 SwiftShader 的「显存」本身也在内存里 → 1600×900 high 峰值超 7.9 GB 被 OOM。贴图上传 GPU 后 close() 掉 CPU 端位图（GLB 贴图不被 clone、不会重传），画面不变。
if (SHOT && params.get('freecpu') === '1') {
  const IB = globalThis.ImageBitmap, free = (t) => { const im = t.source?.data; if (IB && im instanceof IB) { t.source.data = { width: im.width, height: im.height, nbFreed: true }; im.close(); } else if (im instanceof HTMLImageElement && im.complete && im.naturalWidth) { t.source.data = { width: im.width, height: im.height, nbFreed: true }; } }; // HTMLImage：丢引用让解码图被回收；loadTex 之后再 clone 只 version++ 复用已上传的 GPU 贴图（assets.js）
  Object.defineProperty(THREE.Texture.prototype, 'onUpdate', { configurable: true, get() { return this._nbOU ?? free; }, set(v) { this._nbOU = v ?? undefined; } });
}
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 6000);
scene.add(camera);
const R = new Renderer(document.getElementById('c'), scene, camera);
const savedQ = params.get('q') || localStorage.getItem('nb_quality') || (SHOT ? 'high' : 'high');
setAnisotropy(QUALITY[savedQ]?.anis ?? 8);

const ctx = { screens: [] };
const world = new World();
const player = new Player(world);
const inter = new Interactions(camera);
scene.add(inter.proxies);
const audio = new Audio(camera);
const G = { scene, camera, ctx, world, player, inter, audio, zone: null, onUpdate: [], onZone: [], frozen: false };
window.G = G; if (SHOT) window.__THREE__ = THREE; // 批次15：拾取探针 tools/_pick.mjs

// —— 光照 ——
const sun = new THREE.DirectionalLight(TOD.sunColor, 3.4);
sun.castShadow = true; sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04;
// 黄昏：太阳在西南方低空（与天空盒全景图中落日方向一致，见 public/assets/tex/sky_dusk.jpg）
const SUN_DIR = TOD.sunDir.clone();
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(TOD.hemiSky, TOD.hemiGround, 0.25); scene.add(hemi);
function setShadowSize(s) { sun.shadow.mapSize.set(s, s); sun.shadow.map?.dispose(); sun.shadow.map = null; const c = sun.shadow.camera; c.left = -110; c.right = 110; c.top = 110; c.bottom = -110; c.near = 1; c.far = 600; c.updateProjectionMatrix(); }

const SKY_I = TOD.skyI;
const HALL_PROBE = !params.has('legacy') && !params.has('legacyhall'); // R2：室内反射环境改用 Cycles 渲染的大厅实景探针（bake_lm.py → assets/hdri/hall_probe.hdr）
let envSky = null, envHall = null, skyTex = null;
const reflector = new PlanarReflector(R.gl, { y: FLOOR });

// R2：hero 大厅可见时（广场/正门/大厅/档案馆/食堂）关掉局部聚光实时投影——大厅阴影已烘进光照贴图；
// 同屏 16 盏投影聚光会让 hero 材质在 SwiftShader 下整体不出图（无 shader 报错，?qo=shadowsLocal=false 即正常，2026-10-29 实测）
function spotShadows() {
  const on = R.q.shadowsLocal && !(HALL_PROBE && G.zone && VIS[G.zone]?.security_hall);
  scene.traverse((o) => { if (o.isSpotLight && o.userData.qualityShadow) o.castShadow = on; });
}
function applyQuality(q) {
  R.setQuality(q); localStorage.setItem('nb_quality', q);
  setShadowSize(R.q.shadow);
  spotShadows();
  for (const s of ctx.shafts ?? []) s.visible = R.q.shafts;
  UI.ui.markQ?.(q);
}

// —— 加载 ——
manager.onProgress = (url, n, total) => UI.loadProgress(0.1 + 0.8 * (n / total), `正在装订页面…… ${n}/${total}`);
async function boot() {
  UI.loadProgress(0.02, '读取剧情与档案……');
  try { await Promise.all([document.fonts.load('900 40px \"NB Title\", \"NB Serif\"', '叙事管理局'), document.fonts.load('400 40px "NB Serif"', '叙'), document.fonts.load('40px "NB Sans"', '叙'), document.fonts.load('900 40px "NB Title"', '叙事管理局'), document.fonts.load('600 40px "NB Serif"', '叙'), document.fonts.load('500 40px "NB Sans"', '叙'), document.fonts.load('600 40px "NB Latin Title"', 'BUREAU'), document.fonts.load('500 40px "NB Latin"', 'Bureau'), document.fonts.load('italic 500 40px "NB Latin"', 'Bureau')]); } catch { /* */ }
  await content.load();
  await audio.init();
  const pm = new THREE.PMREMGenerator(R.gl);
  const [sky, hall] = await Promise.all([new THREE.TextureLoader(manager).loadAsync('./assets/tex/' + TOD.sky).catch(() => null), loadHDR(HALL_PROBE ? 'hall_probe' : 'hall_1k')]);
  if (sky) { sky.mapping = THREE.EquirectangularReflectionMapping; sky.colorSpace = THREE.SRGBColorSpace; sky.generateMipmaps = true; sky.minFilter = THREE.LinearMipmapLinearFilter; sky.anisotropy = 4; }
  skyTex = sky;
  installSkyFog(sky, SKY_I);
  envSky = sky ? pm.fromEquirectangular(sky).texture : null;
  if (hall) tameHDR(hall, HALL_PROBE ? 6 : 2.5); // M5：压住室内 HDR 的窗口高光（档案馆/安检大厅地面「白光溢出」与地下地面金色镜面的根因）
  envHall = hall ? pm.fromEquirectangular(hall).texture : null;
  scene.background = sky; scene.backgroundIntensity = SKY_I;
  scene.environment = envSky;
  LOG('hdr ok'); UI.loadProgress(0.1, '建造主楼……');
  await buildExterior(scene, world, ctx); await buildInteriors(scene, world, ctx); await buildEastWing(scene, world, ctx); await buildVault(scene, world, ctx); await buildRooms(scene, world, ctx); await buildUpper(scene, world, ctx); await buildDressing(scene, world, ctx); await buildM5(scene, world, ctx); await buildSurface(scene, world, ctx); await buildDepths(scene, world, ctx); await buildR3(ctx, world, ctx._r3mat, true); await applyM12Training(ctx, world); await applyM14Training(ctx); // 批次 M12 / M14：B6 训练场第二、三轮
  // R3 批次8 性能：地表/外景合批网格按 32 m 格切块（视锥 + 阴影视锥剔除生效）；主楼外立面 hi/lo 两级按格切换；小件按距离剔除
  { const t0 = performance.now(); const ext = scene.getObjectByName('exterior'); const L = new LodCells(+(params.get('lodNear') ?? 40));
    const fl = ctx.facadeLod; const keep = (o) => fl && (o.parent === fl.hi || o.parent === fl.lo || fl.hi.getObjectById(o.id) || fl.lo.getObjectById(o.id));
    const r1 = chunkGroup(ext, { cell: 32, skip: keep }); const r2 = ctx.zones.surface ? chunkGroup(ctx.zones.surface, { cell: 32 }) : {};
    if (fl) { chunkGroup(fl.hi, { cell: 32, minTris: 500, minR: 10 }); chunkGroup(fl.lo, { cell: 32, minTris: 200, minR: 10 }); L.add(fl.hi, 'hi'); L.add(fl.lo, 'lo'); L.finish(); G.lod = L; }
    const DC = new DistCull(); const rule = (o, r) => (/^F_/.test(o.name) || o.userData.noCull ? Infinity : r < 1.5 ? 60 : r < 4 ? 110 : r < 10 ? 180 : Infinity);
    DC.add(ext, rule); if (ctx.zones.surface) DC.add(ctx.zones.surface, rule); G.distCull = DC;
    // R3 批次10：地铁口（下沉广场，视线被主楼/城墙挡住）额外远距剔除：中小件（包围球 r<60 m，非外立面）离相机 >130 m 不画（含阴影）。只在 metro_exit 区生效
    { const MC = new DistCull(); const mrule = (o, r) => (/^F_/.test(o.name) || o.userData.noCull || r >= 60 ? Infinity : 130); MC.add(ext, mrule); if (ctx.zones.surface) MC.add(ctx.zones.surface, mrule); G.metroCull = MC; }
    // 室内盒 + 门洞：宿舍三号楼（西门）、机库（西大门）、正门门廊（南正门）
    const PC = new PortalCull([
      { id: 'dorm', box: [52.6, 80, -1, 14.5, 0, 40], portals: [[[52.6, -0.2, 18.3], [52.6, -0.2, 21.7], [52.6, 3.8, 21.7], [52.6, 3.8, 18.3]]] },
      { id: 'hangar', box: [73.6, 99, -1, 11.8, -87, -53], portals: [[[73.6, -0.2, -77.1], [73.6, -0.2, -62.9], [73.6, 8.6, -62.9], [73.6, 8.6, -77.1]]] },
      { id: 'gate', box: [-14.5, 14.5, 0, 16, -30, -5.6], portals: [[[-3.7, 1.5, -6.0], [3.7, 1.5, -6.0], [3.7, 14.8, -6.0], [-3.7, 14.8, -6.0]]] },
    ]);
    if (!/[?&]noportal=1/.test(location.search)) { PC.add(ext); if (ctx.zones.surface) PC.add(ctx.zones.surface); G.portal = PC; }
    LOG(`chunk ext ${r1.split}->${r1.made} surface ${r2.split}->${r2.made} lodCells ${L.cells.size} distCull ${DC.items.length} ${(performance.now() - t0).toFixed(0)}ms`); }
  LOG('world built'); scene.add(world.build()); inter.blocker = world.collider; LOG('bvh ok');
  // 反射地面
  const M = mats();
  reflector.patch(M.hallFloor, 0.09); reflector.patch(M.hallFloorDark, 0.08);
  const HFM = ctx.hallFloorMats ?? []; if (HFM.length) { reflector.patch(HFM[0], 0.32); reflector.patch(HFM[1], 0.4); reflector.patch(HFM[2], 0.16); } // R2：精修大厅抛光地面
  scene.traverse((o) => { if (o.isMesh && (o.material === M.hallFloor || o.material === M.hallFloorDark || HFM.includes(o.material))) reflector.hide.push(o); if (o.userData.isShaft) reflector.hide.push(o); });
  // 主屏射线代理
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(15, 6.6, 0.8), new THREE.MeshBasicMaterial({ visible: false })); proxy.position.copy(ctx.mainScreenPos); inter.proxies.add(proxy); G.mainScreenProxy = proxy;
  // 分区补光只在本区生效（多个分组同时可见时不叠加）
  scene.traverse((o) => { if (o.userData?.isFill) { let a = o; while (a.parent && a.parent !== scene) a = a.parent; o.userData.fillOf = a.name; FILLS.push(o); } });
  setupStory(G);
  setupDepths(G, { toast: UI.toast, dialog: UI.dialog, fade: UI.fade, chapterCard: UI.chapterCard, updateObjective: UI.updateObjective, docPages: UI.docPages });
  bindAll(G);
  setupElevator(G, { toast: UI.toast, dialog: UI.dialog, fade: UI.fade, runInteractable });
  applyQuality(savedQ);
  UI.initPause({
    quality: QUALITY, setQuality: applyQuality, tod: TOD_NAME, setTod,
    setSens: (v) => { sens = v; }, setFov: (v) => { camera.fov = v; camera.updateProjectionMatrix(); },
    setVol: (v) => audio.setVolumes({ master: v }), setMusic: (v) => audio.setVolumes({ music: v }), setFps: (v) => { showFps = v; if (!v) UI.setFpsText(''); },
    credits: await fetch('./assets/CREDITS.txt').then((r) => (r.ok ? r.text() : '')).catch(() => ''),
  });
  UI.onResume(() => lock());
  // 出生点
  player.pos.set(0, 0.05, 72); player.yaw = 0; player.pitch = 0.02; player.spawn = player.pos.clone();
  // 预编译
  UI.loadProgress(0.95, '点亮灯光……');
  for (const z of Object.values(ctx.zones)) z.visible = true;
  if (!SHOT && !TEST) { try { await R.gl.compileAsync(scene, camera); } catch { /* 旧浏览器 */ } }
  LOG('compiled');
  await applyBakes(scene, undefined, { log: LOG }); // R3 批次10：程序化室内区 AO 烘焙
  if (SHOT) window.__bakeExport = (id, url) => exportBake(scene, id, url);
  if (SHOT && params.get('probe')) window.__CULLPROBE__ = () => { // 批次10：同屏网格按距离统计三角面（tools/_cullprobe.mjs）
    camera.updateMatrixWorld(); const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)); const sp = new THREE.Sphere(); const bins = {}; const top = [];
    const vis = (o) => { for (let a = o; a; a = a.parent) if (!a.visible) return false; return true; };
    scene.traverse((o) => { if (!o.isMesh || !o.geometry?.attributes.position || !vis(o)) return; const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); sp.copy(o.isInstancedMesh && o.boundingSphere ? o.boundingSphere : g.boundingSphere).applyMatrix4(o.matrixWorld); if (!fr.intersectsSphere(sp)) return;
      const t = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); const d = Math.max(0, camera.position.distanceTo(sp.center) - sp.radius); let root = o; while (root.parent && root.parent !== scene) root = root.parent;
      const bk = root.name + ':' + (d < 50 ? '0-50' : d < 100 ? '50-100' : d < 150 ? '100-150' : d < 250 ? '150-250' : d < 400 ? '250-400' : '400+'); bins[bk] = (bins[bk] ?? 0) + t; top.push([Math.round(t), Math.round(d), Math.round(sp.radius), root.name, o.name || o.material?.name || '', o.isInstancedMesh ? o.count : 0, sp.center.toArray().map(Math.round).join(',')]); });
    top.sort((a, b) => b[0] - a[0]); return { bins, top: top.slice(0, 40) }; };
  setZone('plaza', true);
  UI.updateObjective();
  window.__NB_G__ = G; // 调试：内存探针（work/b12/memprobe.mjs）
  if (SHOT) return startShot();
  if (params.get('test')) { // M6：自动化走查接口（tools/walk.mjs）——不锁鼠标，直接进入游戏态
    window.__NB_AUTO__ = { choices: [], log: [] };
    window.__NB__ = { G, content, UI, player, inter, zoneAt: (x, y, z) => zoneAt(new THREE.Vector3(x, y, z)),
      tp: (x, y, z, yaw = 0) => { player.pos.set(x, y, z); player.vel?.set(0, 0, 0); player.yaw = yaw; player.pitch = 0; player.applyCamera(camera); setZone(zoneAt(player.pos)); },
      spot: (id) => inter.spots.find((s) => s.id === id),
      use: async (id) => { const s = inter.spots.find((x) => x.id === id); if (!s) throw new Error('no spot ' + id); if (s.enabled && !s.enabled()) throw new Error('spot disabled ' + id); await s.use(); return true; },
      setZone: (z) => setZone(z, true), zones: () => Object.keys(VIS), sunOf: (z) => (ZONE_LOOK[z] ?? ZONE_LOOK.spine_b3).sun,
      topMeshes: (group, n = 12) => { const g = scene.getObjectByName(group); const out = []; g?.traverse((o) => { if (!o.isMesh || !o.geometry) return; const t = (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position?.count ?? 0) / 3 * (o.isInstancedMesh ? o.count : 1); out.push({ name: o.name || o.parent?.name || '?', mat: (Array.isArray(o.material) ? o.material[0] : o.material)?.name || '', inst: o.isInstancedMesh ? o.count : 0, tris: Math.round(t), shadow: o.castShadow }); }); return out.sort((a, b) => b.tris - a.tris).slice(0, n); },
      vols: () => inter.volumes.length, flags: () => [...content.flags], items: () => [...content.items], state: () => UI.ui.state };
    started = true; UI.ui.state = 'play'; document.getElementById('loading').classList.add('hidden'); window.__NB_READY__ = true; return;
  }
  UI.loadDone(start);
  menuLive(); // U2：加载完成后主菜单右侧换成实时 3D 广场机位
}

// —— U2：主菜单实时广场机位（右侧 59% 区域；setViewOffset 把画面中心移到右栏中心）——
const MENU_A = new THREE.Vector3(5, 9, 92), MENU_B = new THREE.Vector3(-3, 6.5, 80), MENU_LOOK = new THREE.Vector3(0, 40, -13), MENU_FOV = 56;
let menuOn = false, menuT = 0, playerFov = 70, enterK = 1; const enterFrom = { pos: new THREE.Vector3(), q: new THREE.Quaternion(), fov: 56, off: 0 };
const menuOffset = () => (innerWidth > innerHeight * 1.1 ? -0.11 : 0); // U2：左 1/4 磨砂区，画面中心右移
function menuLive() { if (SHOT || TEST) return; playerFov = camera.fov; menuOn = true; menuT = 0; document.getElementById('loading').classList.add('live'); }
function menuCamera(dt) {
  menuT += dt; const k = 0.5 - 0.5 * Math.cos(menuT * Math.PI * 2 / 90); // 90 s 往返，余弦缓入缓出
  camera.position.lerpVectors(MENU_A, MENU_B, k); camera.position.y += Math.sin(menuT * 0.21) * 0.25;
  camera.up.set(0, 1, 0); camera.lookAt(MENU_LOOK);
  camera.fov = MENU_FOV; camera.setViewOffset(innerWidth, innerHeight, menuOffset() * innerWidth, 0, innerWidth, innerHeight);
}
function enterBlend(dt) { // 进入：菜单机位 → 玩家视角，1.6 s smoothstep
  enterK = Math.min(1, enterK + dt / 1.6); const e = enterK * enterK * (3 - 2 * enterK);
  const pq = camera.quaternion.clone(), pp = camera.position.clone();
  camera.position.lerpVectors(enterFrom.pos, pp, e); camera.quaternion.copy(enterFrom.q).slerp(pq, e);
  camera.fov = enterFrom.fov + (playerFov - enterFrom.fov) * e; const o = enterFrom.off * (1 - e);
  if (enterK < 1 && o) camera.setViewOffset(innerWidth, innerHeight, o * innerWidth, 0, innerWidth, innerHeight); else { camera.clearViewOffset(); }
  camera.updateProjectionMatrix();
}

let started = false;
async function start() {
  if (menuOn) { menuOn = false; enterK = 0; enterFrom.pos.copy(camera.position); enterFrom.q.copy(camera.quaternion); enterFrom.fov = camera.fov; enterFrom.off = menuOffset(); }
  started = true; UI.ui.state = 'play';
  audio.resume(); audio.setZone('plaza');
  lock();
  setTimeout(async () => { await G.read(UI.docPages('doc_plaza_notice_phone')); UI.updateObjective(); }, 900);
}

// —— 分区与可见性 ——
const AREA_NAMES = { plaza: ['中轴广场 · 规则之泉', 'CENTRAL PLAZA'], gate: ['正门 · 服务台', 'MAIN GATE'], security_hall: ['安检大厅', 'SECURITY HALL'], archive: ['人事档案馆', 'PERSONNEL ARCHIVE'], archive_b1: ['B1 · 密集库', 'ARCHIVE STACKS · B1'],
  citizen_service: ['东翼 1F · 市民服务大厅', 'CITIZEN SERVICES'], exam_center: ['东翼 · 叙事高考考务中心', 'NARRATIVE EXAM CENTER'], command_center: ['东翼 2F · 现实稳定度监测指挥中心', 'STABILITY COMMAND'], zone_control: ['东翼 3F · 禁区封锁调度厅', 'ZONE CONTROL'], east_stair: ['东翼楼梯', 'EAST STAIR'],
  spine_b3: ['书脊井 · B3 电梯厅', 'SPINE SHAFT · B3'], spine_b4: ['书脊井 · B4 电梯厅', 'SPINE SHAFT · B4'], spine_b5: ['书脊井 · B5 电梯厅', 'SPINE SHAFT · B5'],
  vault_b3: ['B3 · 证物收容库　开架区', 'EVIDENCE VAULT · B3'], vault_b4: ['B4 · 单独收容柜', 'CONTAINMENT · B4'], vault_b5: ['B5 · 深库', 'DEEP VAULT · B5'],
  canteen: ['职工食堂 · 中庭', 'STAFF CANTEEN'], armory: ['B1 · 外勤缉拿处', 'FIELD OPS · B1'], interrogation: ['B2 · 审讯室', 'INTERROGATION · B2'], training: ['B6 · 驯化副本训练场', 'TRAINING GROUNDS · B6'],
  floor2: ['2F · 国际联络处 · 宣传处', 'LIAISON & PUBLICITY · 2F'], floor3: ['3F · 办公区 · 医务 · 实验室', 'OFFICES · CLINIC · LAB · 3F'], library: ['典籍藏书阁 · 4F–11F', 'THE LIBRARY'], director: ['12F · 机要室与局长室', 'DIRECTOR · 12F'],
  dorm: ['职工宿舍 · 三号楼', 'STAFF DORMITORY'], helipad: ['飞行器机库 · 停机坪', 'HANGAR & HELIPAD'], hangar: ['飞行器机库', 'HANGAR'], wall_posts: ['环形城墙 · 十二号塔岗哨', 'WALL POST · 12'], memorial: ['无字碑廊', 'THE NAMELESS STELES'], metro_exit: ['地铁管理局站 · B 口', 'METRO · BUREAU STATION'], east_cloister: ['东廊', 'EAST CLOISTER'],
  abyss_gate: ['墨渊 · 折页门', 'THE INK ABYSS · GATE'], abyss_city: ['墨渊 · 倒悬书城', 'INVERTED BOOK CITY'], abyss_core: ['墨渊 · 定稿厅', 'THE FINAL DRAFT HALL'], abyss_exam: ['墨渊 · 考场母本', 'THE MASTER EXAM HALL'], abyss_tide: ['墨渊 · 墨潮带', 'INK TIDE'], seventh_entry: ['装订线 · 页缝', 'THE GUTTER · ENTRY'], seventh_gutter: ['装订线 · 回廊', 'THE GUTTER'], seventh_ops: ['第七局 · 作战室', 'SEVENTH BUREAU · OPS'], seventh_wrap: ['第七局 · 杀青室', 'THE WRAP ROOM'], seventh_rewrite: ['第七局 · 回写台', 'THE REWRITING DESK'] };
// 区域 → manifest 区域 id（用于 enter_area 条件）
const AREA_OF = { hangar: 'helipad', abyss_gate: 'abyss_gate', abyss_city: 'abyss_city', abyss_core: 'abyss_core', abyss_exam: 'abyss_exam', abyss_tide: 'abyss_tide', seventh_entry: 'seventh_entry', seventh_gutter: 'seventh_gutter', seventh_ops: 'seventh_ops', seventh_wrap: 'seventh_wrap', seventh_rewrite: 'seventh_rewrite', dorm: 'dorm', helipad: 'helipad', wall_posts: 'wall_posts', memorial: 'memorial', metro_exit: 'metro_exit', director: 'director_office',  spine_b3: 'spine_shaft', spine_b4: 'spine_shaft', spine_b5: 'spine_shaft', vault_b3: 'vault', vault_b4: 'vault', vault_b5: 'vault' };
// 区域 → 场景分组（多个区域共用一个分组）
const GROUP_OF = { hangar: 'surface', abyss_gate: 'abyss', abyss_city: 'abyss', abyss_core: 'abyss', abyss_exam: 'abyss', abyss_tide: 'abyss', seventh_entry: 'seventh', seventh_gutter: 'seventh', seventh_ops: 'seventh', seventh_wrap: 'seventh', seventh_rewrite: 'seventh', dorm: 'surface', helipad: 'surface', wall_posts: 'surface', memorial: 'surface', metro_exit: 'surface', spine_b3: 'vault_b3', spine_b4: 'vault_b4', spine_b5: 'vault_b5', citizen_service: 'east_wing', exam_center: 'east_wing', command_center: 'east_wing', zone_control: 'east_wing', east_stair: 'east_wing' };
function zoneAt(p) {
  const Y = FLOOR;
  const dz = depthZone(p); if (dz) return dz;
  // 地上楼层：按 upper.js 实际平面包围盒判定（含电梯厅 z -84…-92）；包围盒外的高空一律算室外
  const inUpper = (hx, z1) => Math.abs(p.x) < hx && p.z < -83.6 && p.z > z1;
  if (p.y > 70 && p.y < 80 && inUpper(13.6, -112.6)) return 'director';
  if (p.y > 21 && p.y < 70 && inUpper(15.5, -121.5)) return 'library';
  if (p.y > 14.5 && p.y < 21.5 && inUpper(28.6, -120.6)) return 'floor3';
  if (p.y > 8.55 && p.y < 14.5 && inUpper(28.6, -118.6)) return 'floor2';
  if (p.y > 8.55) return 'plaza'; // 食堂挑台（脚底 y≈8.25）仍按下方 canteen 判定
  if (p.y < -46) return 'training';
  if (p.y < -14 && p.y > -22) return 'interrogation';
  if (p.y < -6 && p.y > -14 && p.z < -80) return 'armory';
  if (p.y < -15) { const L = p.y > -30 ? 'b3' : p.y > -38 ? 'b4' : 'b5'; return (p.z > -92 ? 'spine_' : 'vault_') + L; }
  if (p.x < -17.6 && p.x > -57 && p.z < -31 && p.z > -71) return p.y < Y - 2.5 ? 'archive_b1' : 'archive';
  if (p.x > 17.4 && p.x < 57 && p.z < -31 && p.z > -77) {
    if (p.x > 50 && p.z < -53.5 && p.z > -64.5) return 'east_stair';
    const fl = p.y < Y + 6.2 ? 1 : p.y < Y + 13.2 ? 2 : 3;
    if (fl === 1) return p.z > -53 ? 'citizen_service' : 'exam_center';
    if (fl === 2) return p.z > -61 ? 'command_center' : 'exam_center';
    return p.z > -61 ? 'zone_control' : 'exam_center';
  }
  if (p.x > 18.3 && p.x < 28.6 && p.z < -76.3 && p.z > -115.6 && p.y > -2 && p.y < 8) return 'east_cloister';
  if (Math.abs(p.x) < 18.5 && p.z < -76.3 && p.z > -141 && p.y > -2) return 'canteen';
  if (p.x > 52 && p.x < 80 && p.z > 0 && p.z < 40 && p.y < 13.5) return 'dorm';
  if (p.x > 73.6 && p.x < 98.8 && p.z < -53.4 && p.z > -86.6 && p.y < 11) return 'hangar'; // 批次7：机库内部单独分区（室内环境图，不再反射天空）
  if (p.x > 72 && p.x < 100 && p.z < -52 && p.z > -88) return 'helipad';
  if (p.x < -49 && p.x > -77 && p.z > 1 && p.z < 49) return 'memorial';
  if (p.y < -2 && p.z > 96) return 'metro_exit';
  { const dx = p.x + 47.3, dz = p.z - 62.1; if (dx * dx + dz * dz < 110) return 'wall_posts'; } // 批次10：半径 5.5→10.5 m，含门前坪（门外灯只在本区亮）
  if (Math.abs(p.x) < 18 && p.z < -29.9 && p.z > -77) return 'security_hall';
  if (Math.abs(p.x) < 14.5 && p.z < -5.6 && p.z > -30) return 'gate';
  return 'plaza';
}
const EW = { exterior: 0, gate: 0, security_hall: 1, archive: 0, archive_b1: 0, east_wing: 1, east_cloister: 1 };
const VIS = {
  plaza: { exterior: 1, gate: 1, security_hall: 1, surface: 1 },
  dorm: { exterior: 1, surface: 1 }, helipad: { exterior: 1, surface: 1 }, hangar: { exterior: 1, surface: 1 }, wall_posts: { exterior: 1, surface: 1 }, memorial: { exterior: 1, surface: 1 }, metro_exit: { exterior: 1, surface: 1 },
  east_cloister: { east_cloister: 1, canteen: 1, east_wing: 1 },
  abyss_gate: { abyss: 1 }, abyss_city: { abyss: 1 }, abyss_core: { abyss: 1 }, abyss_exam: { abyss: 1 }, abyss_tide: { abyss: 1 },
  seventh_entry: { seventh: 1 }, seventh_gutter: { seventh: 1 }, seventh_ops: { seventh: 1 }, seventh_wrap: { seventh: 1 }, seventh_rewrite: { seventh: 1 },
  gate: { exterior: 1, gate: 1, security_hall: 1 },
  security_hall: { exterior: 0, gate: 1, security_hall: 1, archive: 1, east_wing: 1, canteen: 1 },
  canteen: { security_hall: 1, east_cloister: 1 }, armory: {}, interrogation: {}, training: {}, floor2: {}, floor3: {}, library: {}, director: {},
  archive: { exterior: 0, gate: 0, security_hall: 1, archive: 1, archive_b1: 1 },
  archive_b1: { exterior: 0, archive: 1, archive_b1: 1 },
  spine_b3: { vault_b4: 1, vault_b5: 1 }, spine_b4: { vault_b3: 1, vault_b5: 1 }, spine_b5: { vault_b3: 1, vault_b4: 1 }, vault_b3: {}, vault_b4: {}, vault_b5: {}, // 批次20：中央竖井上下贯通 → 电梯厅里能看到其他两层的井架 / 栏杆
  citizen_service: EW, exam_center: EW, command_center: { east_wing: 1 }, zone_control: { east_wing: 1 }, east_stair: EW,
};
const ZONE_LOOK = {
  plaza: { env: 'sky', envI: 1.1, sun: 3.2, exp: 1.05, fog: [0x8a7a86, 0.0011], hemi: 0.3 },
  memorial: { env: 'sky', envI: 1.0, sun: 3.2, exp: 1.05, fog: [0x8a7a86, 0.0016], hemi: 0.3 }, metro_exit: { env: 'sky', envI: 1.1, sun: 3.2, exp: 1.05, fog: [0x8a7a86, 0.0011], hemi: 0.3 },
  wall_posts: { env: 'sky', envI: 1.0, sun: 3.2, exp: 1.05, fog: [0x8a7a86, 0.0011], hemi: 0.3 }, helipad: { env: 'sky', envI: 0.9, sun: 3.2, exp: 1.1, fog: [0x8a7a86, 0.0011], hemi: 0.25 }, hangar: { env: 'hall', envI: 0.38, sun: 3.2, exp: 1.2, fog: [0x221d17, 0.004], hemi: 0.2 },
  abyss_gate: { env: 'hall', envI: 0.35, sun: 0, exp: 1.25, fog: [0x0c0a08, 0.008], hemi: 0.14 }, abyss_city: { env: 'hall', envI: 0.35, sun: 0, exp: 1.25, fog: [0x0c0a08, 0.008], hemi: 0.14 }, abyss_core: { env: 'hall', envI: 0.35, sun: 0, exp: 1.25, fog: [0x0c0a08, 0.008], hemi: 0.14 }, abyss_exam: { env: 'hall', envI: 0.35, sun: 0, exp: 1.25, fog: [0x0c0a08, 0.008], hemi: 0.14 }, abyss_tide: { env: 'hall', envI: 0.35, sun: 0, exp: 1.25, fog: [0x0c0a08, 0.012], hemi: 0.14 },
  seventh_entry: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x1a0c08, 0.03], hemi: 0.1 }, seventh_gutter: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x1a0c08, 0.03], hemi: 0.1 }, seventh_ops: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x1a0c08, 0.03], hemi: 0.1 }, seventh_wrap: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x1a0c08, 0.03], hemi: 0.1 }, seventh_rewrite: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x1a0c08, 0.03], hemi: 0.1 },
  dorm: { env: 'hall', envI: 0.22, sun: 3.2, exp: 1.15, fog: [0x221d17, 0.006], hemi: 0.14 }, east_cloister: { env: 'hall', envI: 0.4, sun: 0, exp: 1.15, fog: [0x1d1915, 0.012], hemi: 0.1 },
  gate: { env: 'hall', envI: 0.7, sun: 3.2, exp: 1.05, fog: [0x2a241c, 0.005], hemi: 0.18 },
  security_hall: { env: 'hall', envI: HALL_PROBE ? 1.0 : 0.6, sun: 0, exp: 1.0, fog: [0x1d1915, 0.010], hemi: 0.12 },
  archive: { env: 'hall', envI: 0.5, sun: 0, exp: 1.45, fog: [0x241c14, 0.008], hemi: 0.2 },
  archive_b1: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x10141a, 0.02], hemi: 0.05 },
  citizen_service: { env: 'hall', envI: 0.65, sun: 0, exp: 1.05, fog: [0x221d17, 0.010], hemi: 0.14 },
  exam_center: { env: 'hall', envI: 0.6, sun: 0, exp: 1.05, fog: [0x1a1c22, 0.010], hemi: 0.12 },
  command_center: { env: 'hall', envI: 0.5, sun: 0, exp: 1.3, fog: [0x0a1020, 0.008], hemi: 0.16 },
  zone_control: { env: 'hall', envI: 0.5, sun: 0, exp: 1.1, fog: [0x1a140e, 0.012], hemi: 0.1 },
  spine_b3: { env: 'hall', envI: 0.35, sun: 0, exp: 1.15, fog: [0x15130f, 0.02], hemi: 0.06 },
  vault_b3: { env: 'hall', envI: 0.4, sun: 0, exp: 1.3, fog: [0x12161c, 0.017], hemi: 0.11 }, // 批次20：整体提亮（原 exp 1.1 / hemi 0.06 / fog 0.022 太黑），保留冷色雾
  vault_b4: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x1a120a, 0.03], hemi: 0.05 },
  vault_b5: { env: 'hall', envI: 0.3, sun: 0, exp: 1.42, fog: [0x0a0806, 0.022], hemi: 0.1 }, // 批次10：B5 偏暗 → 环境 0.18→0.3、曝光 1.3→1.42、雾 0.034→0.022、半球 0.02→0.1
  spine_b4: null, spine_b5: null,
  canteen: { env: 'sky', envI: 0.6, sun: 2.2, exp: 1.05, fog: [0x2a221a, 0.006], hemi: 0.18 },
  armory: { env: 'hall', envI: 0.35, sun: 0, exp: 1.15, fog: [0x10141a, 0.02], hemi: 0.06 },
  interrogation: { env: 'hall', envI: 0.38, sun: 0, exp: 1.16, fog: [0x101216, 0.022], hemi: 0.1 }, // 批次10：保留压抑感但看得清（曝光 1.0→1.16、环境 0.3→0.38、雾减薄）
  floor2: { env: 'hall', envI: 0.75, sun: 0, exp: 1.3, fog: [0x221c16, 0.006], hemi: 0.24 },
  floor3: { env: 'hall', envI: 0.75, sun: 0, exp: 1.3, fog: [0x1c1c1e, 0.006], hemi: 0.24 },
  library: { env: 'hall', envI: 0.5, sun: 0, exp: 1.15, fog: [0x241c12, 0.008], hemi: 0.1 },
  director: { env: 'sky', envI: 0.6, sun: 0, exp: 1.2, fog: [0x1e1814, 0.004], hemi: 0.2 },
  training: { env: 'hall', envI: 0.48, sun: 0, exp: 1.45, fog: [0x0e1424, 0.007], hemi: 0.2 }, // 批次9：用户反馈训练场整体偏暗 → 环境 0.3→0.48、曝光 1.2→1.45、雾减薄提亮、半球 0.05→0.2
  east_stair: { env: 'hall', envI: 0.55, sun: 0, exp: 1.1, fog: [0x1d1915, 0.012], hemi: 0.12 },
};
// R3 批次6 全局提亮：室内（无阳光、非烘焙大厅、非墨渊/第七局）曝光 ×1.18、环境 ×1.15、半球补光至少 0.1（用户：室内整体偏暗）；?dim=1 关闭
if (!/[?&]dim=1/.test(location.search)) for (const [k, L] of Object.entries(ZONE_LOOK)) { if (!L || L.sun > 0 || k === 'security_hall' || /^(abyss|seventh)/.test(k)) continue; L.exp *= 1.18; L.envI *= 1.15; L.hemi = Math.max(L.hemi * 1.5, 0.1); }
// R3 批次8：墨渊 / 第七局提亮层次（用户：第七局和墨渊偏暗、层次不足）——曝光与半球补光上调、第七局雾减薄；?dim=1 关闭
if (!/[?&]dim=1/.test(location.search)) for (const [k, L] of Object.entries(ZONE_LOOK)) { if (!L) continue; if (/^abyss/.test(k)) { L.exp *= 1.16; L.hemi = Math.max(L.hemi * 1.4, 0.2); L.envI *= 1.25; } if (/^seventh/.test(k)) { L.exp *= 1.16; L.hemi = Math.max(L.hemi * 1.6, 0.16); L.envI *= 1.25; L.fog = [L.fog[0], L.fog[1] * 0.72]; } }
{ const d = ZONE_LOOK.dorm; if (d && !/[?&]dim=1/.test(location.search)) { d.exp *= 1.15; d.envI = 0.32; d.hemi = 0.18; } } // 宿舍（sun>0 但室内）单独提亮
let targetExp = 1, curExp = 1; const FILLS = [];
function setZone(z, force = false) {
  if (z === G.zone && !force) return;
  const prev = G.zone; G.zone = z;
  const vis = VIS[z];
  scene.getObjectByName('exterior').visible = !!vis.exterior;
  for (const [k, g] of Object.entries(ctx.zones)) g.visible = !!vis[k] || GROUP_OF[z] === k || k === z;
  for (const f of FILLS) f.visible = f.userData.fillOf === (GROUP_OF[z] ?? z);
  { const R3V = { dorm: ['dorm', 'dorm2', 'dorm3'], hangar: ['hangar', 'helipad_roof'], helipad: ['hangar', 'helipad_roof'], memorial: ['memorial'], metro_exit: ['metro'], plaza: ['memorial', 'metro', 'plaza'], wall_posts: ['memorial'] }; const on = R3V[z] ?? []; for (const [id, g] of Object.entries(ctx.r3groups ?? {})) g.visible = on.includes(id); }
  const L = ZONE_LOOK[z] ?? ZONE_LOOK.spine_b3;
  scene.environment = L.env === 'sky' ? envSky : envHall;
  scene.environmentIntensity = L.envI;
  sun.intensity = L.sun * TOD.sunMul; sun.castShadow = L.sun > 0;
  // M7 性能：室外有阳光时，室内组（安检大厅/档案馆/东翼…）只是透过门洞可见，不再投进阳光阴影图（原广场多渲染 ~0.9M 阴影三角面）；室内区恢复（高画质局部阴影要用）
  { const sunOn = L.sun > 0; for (const [k, g] of Object.entries(ctx.zones)) { if (k === 'surface' || k === 'gate') continue; if (!g.userData.casters) { g.userData.casters = []; g.traverse((o) => { if (o.isMesh && o.castShadow) g.userData.casters.push(o); }); } for (const o of g.userData.casters) o.castShadow = !sunOn; } } hemi.intensity = L.env === 'sky' && L.sun > 0 ? L.hemi * TOD.hemiMul : L.hemi;
  // 批次4 性能：站在正门门廊里，外立面/广场只透过门洞可见，门廊自身墙顶已投影 → 外部组不进阳光阴影图（zonestat：gate 阴影三角面 6.08M）
  { const off = z === 'gate' && !/[?&]extShadow=1/.test(location.search); scene.getObjectByName('exterior').traverse((o) => { if (!o.isMesh) return; if (o.userData.cs0 === undefined) o.userData.cs0 = o.castShadow; o.castShadow = o.userData.cs0 && !off; if (/^F_(trim|slate|lead)$/.test(o.name)) { o.userData.zoneHide = off && !/[?&]facadeAll=1/.test(location.search); if (!G.lod) o.visible = !o.userData.zoneHide; } }); G.lod?.refresh(camera); } // 门廊内看不到外立面线脚/屋面（F_trim 1.58M 面）→ 隐藏
  scene.fog = new THREE.FogExp2(L.fog[0], L.fog[1] * (L.env === 'sky' ? (TOD.fogMul ?? 1) : 1)); // 批次28：黄昏外景大气雾加重，远景天际线退成剪影
  { const deep = /^(abyss|seventh)/.test(z); scene.background = deep ? new THREE.Color(L.fog[0]) : skyTex; }
  targetExp = z === 'plaza' ? TOD.plazaExp : L.exp;
  reflector.enabled = z === 'gate' || z === 'security_hall';
  if (R.q) spotShadows();
  if (prev && AREA_NAMES[z]) UI.showArea(...AREA_NAMES[z]);
  audio.setZone(z);
  for (const f of G.onZone) f(z, prev);
  { const ids = Object.keys(BAKES).filter((id) => ctx.zones[BAKES[id].group]?.visible); if (ids.length) applyBakes(scene, ids); } // 迟到的模型网格补匹配
  if (AREA_OF[z]) { content.set('area:' + AREA_OF[z]); UI.updateObjective(); }
}

// —— 输入 ——
const keys = {}; let sens = 1, showFps = false;
const canvas = R.gl.domElement;
function lock() { if (SHOT) return; canvas.requestPointerLock?.(); }
canvas.addEventListener('click', () => { if (started && UI.ui.state === 'play' && document.pointerLockElement !== canvas) lock(); else if (UI.ui.state === 'dialog') UI.dialogNext(); });
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  if (!locked && started && UI.ui.state === 'play') { UI.showPause(true); audio.sfx('S22', 0.6); }
  if (locked && UI.ui.state === 'pause') UI.showPause(false);
});
addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== canvas || G.frozen || UI.ui.state !== 'play') return;
  player.yaw -= e.movementX * 0.0022 * sens; player.pitch -= e.movementY * 0.0022 * sens;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.45, 1.45);
});
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Tab') { e.preventDefault(); const items = content.itemsList(); UI.toast(items.length ? '物品：\n' + items.map((i) => `${i.name}　—　${i.desc ?? ''}`).join('\n') + (content.has('item_file') ? '\n（按 R 重读入职档案）' : '') : '你身上只有一部手机。', { ms: 5000 }); }
  if (e.code === 'KeyR' && UI.ui.state === 'play' && G.reopenFile) G.reopenFile();
  if (e.code === 'KeyE') {
    if (UI.ui.state === 'dialog') return UI.dialogNext();
    if (UI.ui.state === 'reader') return UI.readerNextOrClose();
    if (UI.ui.state === 'play' && !G.frozen && inter.current) { audio.sfx('S15', 0.5); inter.current.use(); }
  }
  if (UI.ui.state === 'reader') {
    if (e.code === 'ArrowRight' || e.code === 'KeyD') UI.readerFlip(1);
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') UI.readerFlip(-1);
    if (e.code === 'Escape') UI.closeReader();
  }
  if (e.code === 'Backquote' && e.shiftKey) player.noclip = !player.noclip;
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
G.read = async (pages) => { if (!pages?.length) return; await UI.openReader(pages); if (started && document.pointerLockElement !== canvas) lock(); };
G.freeze = (f) => { G.frozen = f; };
G.pitchDown = () => player.pitch < -0.25;
G.glitch = (s) => { R.ca.offset.set(0.004 * s, 0.003 * s); setTimeout(() => R.ca.offset.set(0.0006, 0.0004), 600); };

// —— 主循环 ——
const clock = new THREE.Clock();
let frames = 0, fpsAcc = 0, fpsN = 0, stepAcc = 0; const perf = { max: 0, last: null };
window.__GROUPS__ = () => scene.children.filter((g) => g.isGroup || g.isObject3D).map((g) => { let meshes = 0, tris = 0, shadow = 0; g.traverse((o) => { if (!o.isMesh || !o.geometry) return; const n = (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position?.count ?? 0) / 3 * (o.isInstancedMesh ? o.count : 1); meshes++; tris += n; if (o.castShadow) shadow += n; }); return { name: g.name || g.type, visible: g.visible, meshes, tris: Math.round(tris), shadowTris: Math.round(shadow) }; }).filter((x) => x.meshes);
// R3 批次8：同屏三角面拆解（主相机视锥 / 太阳阴影视锥内的可见网格，按顶层组 + 前 25 大网格）
window.__TRISTAT__ = () => {
  const fr = new THREE.Frustum(), frS = new THREE.Frustum(), m = new THREE.Matrix4(), sp = new THREE.Sphere();
  camera.updateMatrixWorld(); m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); fr.setFromProjectionMatrix(m);
  const sc = sun.shadow.camera; sc.updateMatrixWorld(); m.multiplyMatrices(sc.projectionMatrix, sc.matrixWorldInverse); frS.setFromProjectionMatrix(m);
  const groups = {}, top = []; let main = 0, shadow = 0;
  const walk = (o, top0) => { if (!o.visible) return; if (o.isMesh && o.geometry && o.layers.test(camera.layers)) { const g = o.geometry; const n = (g.index ? g.index.count : g.attributes.position?.count ?? 0) / 3 * (o.isInstancedMesh ? o.count : 1);
      if (!g.boundingSphere) g.computeBoundingSphere(); sp.copy(g.boundingSphere).applyMatrix4(o.matrixWorld); const inM = !o.frustumCulled || fr.intersectsSphere(sp); const inS = sun.castShadow && o.castShadow && (!o.frustumCulled || frS.intersectsSphere(sp));
      const G0 = groups[top0] ??= { main: 0, shadow: 0 }; if (inM) { G0.main += n; main += n; top.push({ n: Math.round(n), name: o.name, grp: top0, r: +sp.radius.toFixed(1) }); } if (inS) { G0.shadow += n; shadow += n; } }
    for (const c of o.children) walk(c, top0); };
  for (const c of scene.children) walk(c, c.name || c.type);
  for (const v of Object.values(groups)) { v.main = Math.round(v.main); v.shadow = Math.round(v.shadow); }
  return { frame: perf.last, main: Math.round(main), shadow: Math.round(shadow), groups, top: top.sort((a, b) => b.n - a.n).slice(0, 25) };
};
// 批次8：整帧三角面按 pass 拆分（关太阳阴影 / 关局部阴影 / 关 AO 各渲一帧）
window.__FRAME__ = () => { const f = () => { R.gl.info.autoReset = false; R.gl.info.reset(); reflector.update(scene, camera, R.q.reflect); R.render(0.016); return R.gl.info.render.triangles; };
  const out = { all: f() }; const s0 = sun.castShadow; sun.castShadow = false; out.noSun = f(); sun.castShadow = s0;
  const loc = []; scene.traverse((o) => { if (o.isLight && o !== sun && o.castShadow) { loc.push(o); o.castShadow = false; } }); out.noLocal = f(); out.nLocal = loc.length; for (const o of loc) o.castShadow = true;
  if (R.ao) { const a = R.ao.enabled; R.ao.enabled = false; out.noAO = f(); R.ao.enabled = a; } return out; };
window.__PERF__ = () => ({ ...perf.last, geometries: R.gl.info.memory.geometries, textures: R.gl.info.memory.textures, programs: R.gl.info.programs?.length ?? 0 });
function loop() {
  if (window.__READY__) return;
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.1);
  if (!envSky && !SHOT && !started) return;
  if (TEST && !started) return;
  if (SHOT && !shotStarted) return; // 截图模式：加载期间不渲染（SwiftShader 下每帧数秒，会拖慢资源回调）
  time.value += dt;
  const t = time.value;
  // 控制
  if (!SHOT && started) {
    const canMove = UI.ui.state === 'play' && !G.frozen && document.pointerLockElement === canvas;
    const input = canMove ? { f: (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0), r: (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), run: keys.ShiftLeft || keys.ShiftRight, jump: keys.Space, up: keys.KeyQ ? 1 : 0, down: keys.KeyZ ? 1 : 0 } : { f: 0, r: 0, run: false, jump: false, up: 0, down: 0 };
    const before = player.stepDist;
    player.update(dt, input);
    stepAcc += player.stepDist - before;
    if (stepAcc > (input.run ? 0.95 : 0.72)) { stepAcc = 0; audio.footstep(world.surfaceAt(player.pos.clone().add(new THREE.Vector3(0, 0.3, 0)))); }
    player.applyCamera(camera);
    if (enterK < 1) enterBlend(dt);
    setZone(zoneAt(player.pos));
    const spot = inter.update(dt, player.pos, UI.ui.state === 'play' && !G.frozen);
    UI.setPrompt(spot ? (typeof spot.prompt === 'function' ? spot.prompt() : spot.prompt) : '');
    for (const f of G.onUpdate) f(dt, t);
  }
  if (menuOn && !started) menuCamera(dt);
  // 太阳阴影跟随相机
  const focus = camera.position.clone(); focus.y = 0;
  sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(SUN_DIR, 300);
  const texel = 220 / sun.shadow.mapSize.x; sun.target.position.x = Math.round(sun.target.position.x / texel) * texel; sun.target.position.z = Math.round(sun.target.position.z / texel) * texel; sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 300);
  // 曝光适应
  curExp += (targetExp - curExp) * Math.min(1, dt * 1.5);
  R.setExposure(curExp);
  for (const s of ctx.screens) s.update(dt, t);
  updateExterior(ctx, dt, t); updateInteriors(ctx, dt, t); updateEastWing(ctx, dt, t); updateVault(ctx, dt, t, started ? player.pos : null); updateRooms(ctx, dt, t); updateUpper(ctx, dt, t); updateDressing(ctx, dt, t); updateDepths(ctx, dt, t);
  if (G.lod && !/[?&]nolod=1/.test(location.search)) G.lod.update(camera); if (G.distCull && !/[?&]nocull=1/.test(location.search)) G.distCull.update(camera); if (G.metroCull) G.metroCull.update(camera, G.zone === 'metro_exit' && !/[?&]nometrocull=1/.test(location.search) ? 1 : 1e9); G.portal?.update(camera);
  if (TEST) { frames++; return; }
  R.gl.info.autoReset = false; R.gl.info.reset(); // M6：统计整帧（反射 + 阴影 + 后期全部 pass）
  // 批次44：截图专用「静帧冻结」——机位静止、场景静止，第 3 帧起阴影贴图与平面反射与前帧逐像素相同，
  // 不再重渲（SwiftShader 下大厅每帧数十秒主要耗在多盏投影点光 6 面立方阴影 + 反射整场景再渲一遍）。仅截图模式生效，游戏画面不变。
  const frozen = SHOT && shotStarted && shotLite && shotN >= 2;
  R.gl.shadowMap.autoUpdate = !frozen;
  reflector.setY(FLOOR); if (!frozen) reflector.update(scene, camera, R.q.reflect);
  R.render(dt);
  frames++;
  perf.last = { calls: R.gl.info.render.calls, tris: R.gl.info.render.triangles, zone: G.zone };
  if (showFps) { fpsAcc += dt; fpsN++; perf.max = Math.max(perf.max, dt); if (fpsAcc > 0.5) { const i = R.gl.info; UI.setFpsText(`${Math.round(fpsN / fpsAcc)} fps · ${(fpsAcc / fpsN * 1000).toFixed(1)} ms（峰 ${(perf.max * 1000).toFixed(0)}）\n${i.render.calls} drawcall · ${(i.render.triangles / 1e6).toFixed(2)}M 三角面\n程序 ${i.programs?.length ?? 0} · 几何 ${i.memory.geometries} · 贴图 ${i.memory.textures}\n区域 ${G.zone ?? '-'} · 画质 ${R.q.label ?? ''}`); fpsAcc = 0; fpsN = 0; perf.max = 0; } }
  if (SHOT && shotStarted) { shotN++; LOG('frame', shotN, (performance.now() / 1000).toFixed(1)); if (shotN === shotFrames) window.__READY__ = true; }
}
let shotFrames = 30, shotStarted = false, shotN = 0, shotLite = false; const liteOff = [];
window.__setShot = (name) => { window.__READY__ = false; shotN = 0; applyShot(name); requestAnimationFrame(loop); };
function startShot() { applyShot(SHOT); }
function applyShot(name) {
  const s = SHOTS[name] ?? SHOTS.plaza;
  document.getElementById('loading').classList.add('hidden');
  if (params.get('hud')) document.getElementById('hud').classList.remove('hidden');
  camera.position.set(...s.pos);
  if (s.look) camera.lookAt(...s.look); else camera.rotation.set(s.pitch ?? 0, s.yaw ?? 0, 0, 'YXZ');
  if (s.fov) { camera.fov = s.fov; camera.updateProjectionMatrix(); }
  R.gl.clippingPlanes = s.clipY != null ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), s.clipY)] : []; // R3 俯视图：裁掉顶棚
  setZone(s.zone ?? zoneAt(new THREE.Vector3(s.pos[0], s.pos[1] - 1.6, s.pos[2])), true);
  if (s.target) { scene.updateMatrixWorld(true); const fo = scene.getObjectByName(s.target); // 批次32：证件照相片座机位按场景里实际相框位置算（相框局部：正前 + 略高）
    if (fo) { const V = THREE.Vector3; const c = fo.localToWorld(new V(...(s.tcam ?? [0, 0.17, 0.5]))), l = fo.localToWorld(new V(0, 0.115, 0)); camera.position.copy(c); camera.lookAt(l); LOG('target', s.target, c.toArray().map((v) => v.toFixed(2)).join(',')); } else LOG('target missing', s.target); }
  if (params.get('menu')) { // U2：截图复现主菜单实时构图（加载层 .live + 右栏 viewOffset）
    const L = document.getElementById('loading'); L.classList.remove('hidden'); L.classList.add('live'); if (params.get('gears')) { L.classList.add('go'); document.getElementById('gearArc').style.strokeDasharray = '68 100'; document.getElementById('loadpct').textContent = '68%'; document.getElementById('loadbar').style.width = '68%'; }
    camera.position.lerpVectors(MENU_A, MENU_B, Number(params.get('menu')) || 0.5); camera.lookAt(MENU_LOOK); camera.fov = MENU_FOV; camera.setViewOffset(innerWidth, innerHeight, menuOffset() * innerWidth, 0, innerWidth, innerHeight); }
  if (s.expMul) targetExp *= s.expMul; // 批次29：个别机位单独提曝光（plaza_top 黄昏俯视偏暗）
  curExp = targetExp; time.value = s.t ?? 12;
  if (/^b5(?!_door)/.test(name) && ctx.vault?.door) { ctx.vault.door.opened = true; for (const ac of ctx.vault.door.acts) ac.play(); ctx.vault.door.mixer.setTime(10); }
  shotFrames = Number(params.get('frames') || 8);
  // 批次44：截图低开销（SHOTS 里 lite: 1 或 URL lite=1；lite=0 强制关）——
  // ①静帧冻结（见 loop）；②关掉照不到画面的有限射程点光 / 聚光：光球（位置 + distance）与主视锥、及其关于反射地面的镜像都不相交时，
  //   它对任何可见像素（含地面反射里的像素）贡献恒为 0，关掉后着色器光源循环变短、编译与逐像素开销都降，成片逐像素不变。
  for (const l of liteOff.splice(0)) l.visible = true;
  shotLite = params.get('lite') === '0' ? false : !!(s.lite || params.get('lite') === '1');
  if (shotLite) {
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(); const fr = new THREE.Frustum(), m4 = new THREE.Matrix4(), sp = new THREE.Sphere(), p = new THREE.Vector3(); let n = 0, off = 0;
    m4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); fr.setFromProjectionMatrix(m4);
    scene.traverseVisible((o) => { if (!(o.isPointLight || o.isSpotLight) || !(o.distance > 0)) return; n++; o.getWorldPosition(p); sp.set(p, o.distance * 1.05);
      if (fr.intersectsSphere(sp)) return; sp.center.y = 2 * FLOOR - sp.center.y; if (fr.intersectsSphere(sp)) return; o.visible = false; liteOff.push(o); off++; });
    LOG('lite: 关闭不入镜点光', off, '/', n);
  }
  debugTint(); // 批次53：调试假色定位
  shotStarted = true;
  window.__SHOT_INFO__ = () => ({ calls: R.gl.info.render.calls, tris: R.gl.info.render.triangles, zone: G.zone });
  window.__PICK__ = (x, y) => { const rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(x, y), camera); const h = rc.intersectObjects(scene.children, true).find((i) => i.object.visible && i.object.material); if (!h) return null; const m = Array.isArray(h.object.material) ? h.object.material[0] : h.object.material; const tx = (t) => t ? { img: !!t.image, w: t.image?.width, ver: t.version } : null;
    return { d: +h.distance.toFixed(2), p: h.point.toArray().map((v) => +v.toFixed(2)), obj: h.object.name || h.object.type, parent: h.object.parent?.name, mat: m.name || m.type, color: m.color?.getHexString(), rough: m.roughness, metal: m.metalness, envI: m.envMapIntensity, env: !!m.envMap, map: tx(m.map), rmap: tx(m.roughnessMap), refl: m.userData.reflStrength, inst: !!h.object.isInstancedMesh }; };
}
loop();
boot().catch((e) => { console.error(e); UI.loadProgress(1, '加载失败：' + e.message); });

// 批次53：截图调试——?dbgid=x0,x1,z0,z1 把世界包围盒与该 XZ 区相交的网格换成各自不同的纯色（不受光、不吃雾），日志打印 序号 颜色 名字 / 父级 / 材质，
// 用来按像素颜色反查画面里某块面属于哪个网格；?dbgmat=a,b 把名字 / 父名 / 材质名含关键字的网格染品红；?dbghide=a,b 隐藏它们。
function debugTint() {
  const id = params.get('dbgid'), dm = params.get('dbgmat'), dh = params.get('dbghide'); if (!id && !dm && !dh) return;
  scene.updateMatrixWorld(true); const box = new THREE.Box3(); const kw = (str) => (str || '').split(',').filter(Boolean);
  const nm = (o) => [o.name, o.parent?.name, o.parent?.parent?.name, ...(Array.isArray(o.material) ? o.material : [o.material]).map((m) => m?.name)].join('|');
  const hit = (o, ks) => { const n = nm(o); return ks.some((k) => n.includes(k)); };
  let r = null; if (id) { const v = id.split(',').map(Number); r = { x0: v[0], x1: v[1], z0: v[2], z1: v[3] }; }
  const meshes = []; scene.traverse((o) => { if (o.isMesh && o.visible) meshes.push(o); }); let k = 0;
  for (const o of meshes) {
    if (dh && hit(o, kw(dh))) { o.visible = false; LOG('dbghide', nm(o)); continue; }
    if (dm && hit(o, kw(dm))) { o.material = new THREE.MeshBasicMaterial({ color: 0xff00ff, fog: false, toneMapped: false, side: THREE.DoubleSide }); LOG('dbgmat', nm(o)); continue; }
    if (r) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      if (o.isInstancedMesh || box.max.x < r.x0 || box.min.x > r.x1 || box.max.z < r.z0 || box.min.z > r.z1) continue;
      const c = new THREE.Color().setHSL((k * 0.61803) % 1, 1, k % 2 ? 0.35 : 0.6); o.material = new THREE.MeshBasicMaterial({ color: c, fog: false, toneMapped: false, side: THREE.DoubleSide });
      LOG('dbgid', k, '#' + c.getHexString(), nm(o), box.min.toArray().map((v) => v.toFixed(1)).join(','), box.max.toArray().map((v) => v.toFixed(1)).join(',')); k++; }
  }
}

// 室内环境贴图限亮：把超过 maxL 的像素按亮度等比压回 maxL（保留色相），避免粗糙地面映出整片白斑
function tameHDR(t, maxL) {
  const d = t.image?.data; if (!d) return; const half = d instanceof Uint16Array; const F = THREE.DataUtils;
  let peak = 0, cut = 0; const n = d.length / 4;
  for (let i = 0; i < n; i++) {
    const o = i * 4; let r = half ? F.fromHalfFloat(d[o]) : d[o], g = half ? F.fromHalfFloat(d[o + 1]) : d[o + 1], b = half ? F.fromHalfFloat(d[o + 2]) : d[o + 2];
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b; if (L > peak) peak = L;
    if (L > maxL) { const k = maxL / L; r *= k; g *= k; b *= k; cut++; if (half) { d[o] = F.toHalfFloat(r); d[o + 1] = F.toHalfFloat(g); d[o + 2] = F.toHalfFloat(b); } else { d[o] = r; d[o + 1] = g; d[o + 2] = b; } }
  }
  t.needsUpdate = true; LOG(`hdr tame peak ${peak.toFixed(1)} cut ${(cut / n * 100).toFixed(2)}%`);
}
