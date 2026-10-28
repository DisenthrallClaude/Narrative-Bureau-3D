// 《叙事管理局》入口：渲染、加载、分区、控制、交互、剧情
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { Renderer, QUALITY } from './engine/renderer.js';
import { manager, loadHDR, setAnisotropy } from './engine/assets.js';
import { World, Player } from './engine/physics.js';
import { Interactions } from './engine/interact.js';
import { Audio } from './engine/audio.js';
import { content } from './engine/content.js';
import { buildM5 } from './world/dress_m5.js';
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
import { installSkyFog } from './engine/skyfog.js';
import { mats } from './world/mats.js';
import { setupStory } from './story.js';
import * as UI from './ui/ui.js';
import { SHOTS } from './shots.js';
import { TOD, TOD_NAME, setTod } from './engine/tod.js';

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot');
const LOG = (...a) => { if (SHOT) console.log('[NB]', ...a); };
window.__SHOT__ = !!SHOT;
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
window.G = G;

// —— 光照 ——
const sun = new THREE.DirectionalLight(TOD.sunColor, 3.4);
sun.castShadow = true; sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04;
// 黄昏：太阳在西南方低空（与天空盒全景图中落日方向一致，见 public/assets/tex/sky_dusk.jpg）
const SUN_DIR = TOD.sunDir.clone();
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(TOD.hemiSky, TOD.hemiGround, 0.25); scene.add(hemi);
function setShadowSize(s) { sun.shadow.mapSize.set(s, s); sun.shadow.map?.dispose(); sun.shadow.map = null; const c = sun.shadow.camera; c.left = -110; c.right = 110; c.top = 110; c.bottom = -110; c.near = 1; c.far = 600; c.updateProjectionMatrix(); }

const SKY_I = TOD.skyI;
let envSky = null, envHall = null, skyTex = null;
const reflector = new PlanarReflector(R.gl, { y: FLOOR });

function applyQuality(q) {
  R.setQuality(q); localStorage.setItem('nb_quality', q);
  setShadowSize(R.q.shadow);
  scene.traverse((o) => { if (o.isSpotLight && o.userData.qualityShadow) o.castShadow = R.q.shadowsLocal; });
  for (const s of ctx.shafts ?? []) s.visible = R.q.shafts;
  UI.ui.markQ?.(q);
}

// —— 加载 ——
manager.onProgress = (url, n, total) => UI.loadProgress(0.1 + 0.8 * (n / total), `正在装订页面…… ${n}/${total}`);
async function boot() {
  UI.loadProgress(0.02, '读取剧情与档案……');
  try { await Promise.all([document.fonts.load('700 40px \"NB Title\", \"NB Serif\"', '叙事管理局'), document.fonts.load('400 40px "NB Serif"', '叙'), document.fonts.load('40px "NB Sans"', '叙'), document.fonts.load('40px "NB Title"', '叙事管理局')]); } catch { /* */ }
  await content.load();
  await audio.init();
  const pm = new THREE.PMREMGenerator(R.gl);
  const [sky, hall] = await Promise.all([new THREE.TextureLoader(manager).loadAsync('./assets/tex/' + TOD.sky).catch(() => null), loadHDR('hall_1k')]);
  if (sky) { sky.mapping = THREE.EquirectangularReflectionMapping; sky.colorSpace = THREE.SRGBColorSpace; sky.generateMipmaps = true; sky.minFilter = THREE.LinearMipmapLinearFilter; sky.anisotropy = 4; }
  skyTex = sky;
  installSkyFog(sky, SKY_I);
  envSky = sky ? pm.fromEquirectangular(sky).texture : null;
  if (hall) tameHDR(hall, 2.5); // M5：压住室内 HDR 的窗口高光（档案馆/安检大厅地面「白光溢出」与地下地面金色镜面的根因）
  envHall = hall ? pm.fromEquirectangular(hall).texture : null;
  scene.background = sky; scene.backgroundIntensity = SKY_I;
  scene.environment = envSky;
  LOG('hdr ok'); UI.loadProgress(0.1, '建造主楼……');
  await buildExterior(scene, world, ctx); await buildInteriors(scene, world, ctx); await buildEastWing(scene, world, ctx); await buildVault(scene, world, ctx); await buildRooms(scene, world, ctx); await buildUpper(scene, world, ctx); await buildDressing(scene, world, ctx); await buildM5(scene, world, ctx); await buildSurface(scene, world, ctx); await buildDepths(scene, world, ctx);
  LOG('world built'); scene.add(world.build()); inter.blocker = world.collider; LOG('bvh ok');
  // 反射地面
  const M = mats();
  reflector.patch(M.hallFloor, 0.09); reflector.patch(M.hallFloorDark, 0.08);
  scene.traverse((o) => { if (o.isMesh && (o.material === M.hallFloor || o.material === M.hallFloorDark)) reflector.hide.push(o); if (o.userData.isShaft) reflector.hide.push(o); });
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
  if (!SHOT) { try { await R.gl.compileAsync(scene, camera); } catch { /* 旧浏览器 */ } }
  LOG('compiled');
  setZone('plaza', true);
  UI.updateObjective();
  if (SHOT) return startShot();
  if (params.get('test')) { // M6：自动化走查接口（tools/walk.mjs）——不锁鼠标，直接进入游戏态
    window.__NB_AUTO__ = { choices: [], log: [] };
    window.__NB__ = { G, content, UI, player, inter, zoneAt: (x, y, z) => zoneAt(new THREE.Vector3(x, y, z)),
      tp: (x, y, z, yaw = 0) => { player.pos.set(x, y, z); player.vel?.set(0, 0, 0); player.yaw = yaw; player.pitch = 0; player.applyCamera(camera); setZone(zoneAt(player.pos)); },
      spot: (id) => inter.spots.find((s) => s.id === id),
      use: async (id) => { const s = inter.spots.find((x) => x.id === id); if (!s) throw new Error('no spot ' + id); if (s.enabled && !s.enabled()) throw new Error('spot disabled ' + id); await s.use(); return true; },
      vols: () => inter.volumes.length, flags: () => [...content.flags], items: () => [...content.items], state: () => UI.ui.state };
    started = true; UI.ui.state = 'play'; document.getElementById('loading').classList.add('hidden'); window.__NB_READY__ = true; return;
  }
  UI.loadDone(start);
}

let started = false;
async function start() {
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
  dorm: ['职工宿舍 · 三号楼', 'STAFF DORMITORY'], helipad: ['飞行器机库 · 停机坪', 'HANGAR & HELIPAD'], wall_posts: ['环形城墙 · 十二号塔岗哨', 'WALL POST · 12'], memorial: ['无字碑廊', 'THE NAMELESS STELES'], metro_exit: ['地铁管理局站 · B 口', 'METRO · BUREAU STATION'], east_cloister: ['东廊', 'EAST CLOISTER'],
  abyss_gate: ['墨渊 · 折页门', 'THE INK ABYSS · GATE'], abyss_city: ['墨渊 · 倒悬书城', 'INVERTED BOOK CITY'], abyss_core: ['墨渊 · 定稿厅', 'THE FINAL DRAFT HALL'], abyss_exam: ['墨渊 · 考场母本', 'THE MASTER EXAM HALL'], abyss_tide: ['墨渊 · 墨潮带', 'INK TIDE'], seventh_entry: ['装订线 · 页缝', 'THE GUTTER · ENTRY'], seventh_gutter: ['装订线 · 回廊', 'THE GUTTER'], seventh_ops: ['第七局 · 作战室', 'SEVENTH BUREAU · OPS'], seventh_wrap: ['第七局 · 杀青室', 'THE WRAP ROOM'], seventh_rewrite: ['第七局 · 回写台', 'THE REWRITING DESK'] };
// 区域 → manifest 区域 id（用于 enter_area 条件）
const AREA_OF = { abyss_gate: 'abyss_gate', abyss_city: 'abyss_city', abyss_core: 'abyss_core', abyss_exam: 'abyss_exam', abyss_tide: 'abyss_tide', seventh_entry: 'seventh_entry', seventh_gutter: 'seventh_gutter', seventh_ops: 'seventh_ops', seventh_wrap: 'seventh_wrap', seventh_rewrite: 'seventh_rewrite', dorm: 'dorm', helipad: 'helipad', wall_posts: 'wall_posts', memorial: 'memorial', metro_exit: 'metro_exit', director: 'director_office',  spine_b3: 'spine_shaft', spine_b4: 'spine_shaft', spine_b5: 'spine_shaft', vault_b3: 'vault', vault_b4: 'vault', vault_b5: 'vault' };
// 区域 → 场景分组（多个区域共用一个分组）
const GROUP_OF = { abyss_gate: 'abyss', abyss_city: 'abyss', abyss_core: 'abyss', abyss_exam: 'abyss', abyss_tide: 'abyss', seventh_entry: 'seventh', seventh_gutter: 'seventh', seventh_ops: 'seventh', seventh_wrap: 'seventh', seventh_rewrite: 'seventh', dorm: 'surface', helipad: 'surface', wall_posts: 'surface', memorial: 'surface', metro_exit: 'surface', spine_b3: 'vault_b3', spine_b4: 'vault_b4', spine_b5: 'vault_b5', citizen_service: 'east_wing', exam_center: 'east_wing', command_center: 'east_wing', zone_control: 'east_wing', east_stair: 'east_wing' };
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
  if (p.x > 52 && p.x < 80 && p.z > 0 && p.z < 40 && p.y < 9) return 'dorm';
  if (p.x > 72 && p.x < 100 && p.z < -52 && p.z > -88) return 'helipad';
  if (p.x < -49 && p.x > -77 && p.z > 1 && p.z < 49) return 'memorial';
  if (p.y < -2 && p.z > 96) return 'metro_exit';
  { const dx = p.x + 47.3, dz = p.z - 62.1; if (dx * dx + dz * dz < 30) return 'wall_posts'; }
  if (Math.abs(p.x) < 18 && p.z < -29.9 && p.z > -77) return 'security_hall';
  if (Math.abs(p.x) < 14.5 && p.z < -5.6 && p.z > -30) return 'gate';
  return 'plaza';
}
const EW = { exterior: 0, gate: 0, security_hall: 1, archive: 0, archive_b1: 0, east_wing: 1, east_cloister: 1 };
const VIS = {
  plaza: { exterior: 1, gate: 1, security_hall: 1, surface: 1 },
  dorm: { exterior: 1, surface: 1 }, helipad: { exterior: 1, surface: 1 }, wall_posts: { exterior: 1, surface: 1 }, memorial: { exterior: 1, surface: 1 }, metro_exit: { exterior: 1, surface: 1 },
  east_cloister: { east_cloister: 1, canteen: 1, east_wing: 1 },
  abyss_gate: { abyss: 1 }, abyss_city: { abyss: 1 }, abyss_core: { abyss: 1 }, abyss_exam: { abyss: 1 }, abyss_tide: { abyss: 1 },
  seventh_entry: { seventh: 1 }, seventh_gutter: { seventh: 1 }, seventh_ops: { seventh: 1 }, seventh_wrap: { seventh: 1 }, seventh_rewrite: { seventh: 1 },
  gate: { exterior: 1, gate: 1, security_hall: 1 },
  security_hall: { exterior: 0, gate: 1, security_hall: 1, archive: 1, east_wing: 1, canteen: 1 },
  canteen: { security_hall: 1, east_cloister: 1 }, armory: {}, interrogation: {}, training: {}, floor2: {}, floor3: {}, library: {}, director: {},
  archive: { exterior: 0, gate: 0, security_hall: 1, archive: 1, archive_b1: 1 },
  archive_b1: { exterior: 0, archive: 1, archive_b1: 1 },
  spine_b3: {}, spine_b4: {}, spine_b5: {}, vault_b3: {}, vault_b4: {}, vault_b5: {},
  citizen_service: EW, exam_center: EW, command_center: { east_wing: 1 }, zone_control: { east_wing: 1 }, east_stair: EW,
};
const ZONE_LOOK = {
  plaza: { env: 'sky', envI: 1.1, sun: 3.2, exp: 1.05, fog: [0x8a7a86, 0.0011], hemi: 0.3 },
  memorial: { env: 'sky', envI: 1.0, sun: 3.2, exp: 1.05, fog: [0x8a7a86, 0.0016], hemi: 0.3 }, metro_exit: { env: 'sky', envI: 1.1, sun: 3.2, exp: 1.05, fog: [0x8a7a86, 0.0011], hemi: 0.3 },
  wall_posts: { env: 'sky', envI: 1.0, sun: 3.2, exp: 1.05, fog: [0x8a7a86, 0.0011], hemi: 0.3 }, helipad: { env: 'sky', envI: 0.9, sun: 3.2, exp: 1.1, fog: [0x8a7a86, 0.0011], hemi: 0.25 },
  abyss_gate: { env: 'hall', envI: 0.35, sun: 0, exp: 1.25, fog: [0x0c0a08, 0.008], hemi: 0.14 }, abyss_city: { env: 'hall', envI: 0.35, sun: 0, exp: 1.25, fog: [0x0c0a08, 0.008], hemi: 0.14 }, abyss_core: { env: 'hall', envI: 0.35, sun: 0, exp: 1.25, fog: [0x0c0a08, 0.008], hemi: 0.14 }, abyss_exam: { env: 'hall', envI: 0.35, sun: 0, exp: 1.25, fog: [0x0c0a08, 0.008], hemi: 0.14 }, abyss_tide: { env: 'hall', envI: 0.35, sun: 0, exp: 1.25, fog: [0x0c0a08, 0.012], hemi: 0.14 },
  seventh_entry: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x1a0c08, 0.03], hemi: 0.1 }, seventh_gutter: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x1a0c08, 0.03], hemi: 0.1 }, seventh_ops: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x1a0c08, 0.03], hemi: 0.1 }, seventh_wrap: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x1a0c08, 0.03], hemi: 0.1 }, seventh_rewrite: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x1a0c08, 0.03], hemi: 0.1 },
  dorm: { env: 'hall', envI: 0.45, sun: 3.2, exp: 1.15, fog: [0x221d17, 0.006], hemi: 0.14 }, east_cloister: { env: 'hall', envI: 0.4, sun: 0, exp: 1.15, fog: [0x1d1915, 0.012], hemi: 0.1 },
  gate: { env: 'hall', envI: 0.7, sun: 3.2, exp: 0.95, fog: [0x2a241c, 0.006], hemi: 0.15 },
  security_hall: { env: 'hall', envI: 0.6, sun: 0, exp: 1.0, fog: [0x1d1915, 0.010], hemi: 0.12 },
  archive: { env: 'hall', envI: 0.35, sun: 0, exp: 1.3, fog: [0x241c14, 0.012], hemi: 0.1 },
  archive_b1: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x10141a, 0.02], hemi: 0.05 },
  citizen_service: { env: 'hall', envI: 0.65, sun: 0, exp: 1.05, fog: [0x221d17, 0.010], hemi: 0.14 },
  exam_center: { env: 'hall', envI: 0.6, sun: 0, exp: 1.05, fog: [0x1a1c22, 0.010], hemi: 0.12 },
  command_center: { env: 'hall', envI: 0.4, sun: 0, exp: 1.15, fog: [0x0a1020, 0.012], hemi: 0.08 },
  zone_control: { env: 'hall', envI: 0.5, sun: 0, exp: 1.1, fog: [0x1a140e, 0.012], hemi: 0.1 },
  spine_b3: { env: 'hall', envI: 0.35, sun: 0, exp: 1.15, fog: [0x15130f, 0.02], hemi: 0.06 },
  vault_b3: { env: 'hall', envI: 0.35, sun: 0, exp: 1.1, fog: [0x12161c, 0.022], hemi: 0.06 },
  vault_b4: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x1a120a, 0.03], hemi: 0.05 },
  vault_b5: { env: 'hall', envI: 0.18, sun: 0, exp: 1.3, fog: [0x0a0806, 0.034], hemi: 0.02 },
  spine_b4: null, spine_b5: null,
  canteen: { env: 'sky', envI: 0.6, sun: 2.2, exp: 1.05, fog: [0x2a221a, 0.006], hemi: 0.18 },
  armory: { env: 'hall', envI: 0.35, sun: 0, exp: 1.15, fog: [0x10141a, 0.02], hemi: 0.06 },
  interrogation: { env: 'hall', envI: 0.3, sun: 0, exp: 1.0, fog: [0x101216, 0.03], hemi: 0.06 },
  floor2: { env: 'hall', envI: 0.6, sun: 0, exp: 1.05, fog: [0x221c16, 0.01], hemi: 0.14 },
  floor3: { env: 'hall', envI: 0.6, sun: 0, exp: 1.05, fog: [0x1c1c1e, 0.01], hemi: 0.14 },
  library: { env: 'hall', envI: 0.5, sun: 0, exp: 1.15, fog: [0x241c12, 0.008], hemi: 0.1 },
  director: { env: 'sky', envI: 0.5, sun: 0, exp: 1.05, fog: [0x1e1814, 0.004], hemi: 0.15 },
  training: { env: 'hall', envI: 0.3, sun: 0, exp: 1.2, fog: [0x060a14, 0.012], hemi: 0.05 },
  east_stair: { env: 'hall', envI: 0.55, sun: 0, exp: 1.1, fog: [0x1d1915, 0.012], hemi: 0.12 },
};
let targetExp = 1, curExp = 1; const FILLS = [];
function setZone(z, force = false) {
  if (z === G.zone && !force) return;
  const prev = G.zone; G.zone = z;
  const vis = VIS[z];
  scene.getObjectByName('exterior').visible = !!vis.exterior;
  for (const [k, g] of Object.entries(ctx.zones)) g.visible = !!vis[k] || GROUP_OF[z] === k || k === z;
  for (const f of FILLS) f.visible = f.userData.fillOf === (GROUP_OF[z] ?? z);
  const L = ZONE_LOOK[z] ?? ZONE_LOOK.spine_b3;
  scene.environment = L.env === 'sky' ? envSky : envHall;
  scene.environmentIntensity = L.envI;
  sun.intensity = L.sun * TOD.sunMul; sun.castShadow = L.sun > 0; hemi.intensity = L.env === 'sky' && L.sun > 0 ? L.hemi * TOD.hemiMul : L.hemi;
  scene.fog = new THREE.FogExp2(L.fog[0], L.fog[1]);
  { const deep = /^(abyss|seventh)/.test(z); scene.background = deep ? new THREE.Color(L.fog[0]) : skyTex; }
  targetExp = z === 'plaza' ? TOD.plazaExp : L.exp;
  reflector.enabled = z === 'gate' || z === 'security_hall';
  if (prev && AREA_NAMES[z]) UI.showArea(...AREA_NAMES[z]);
  audio.setZone(z);
  for (const f of G.onZone) f(z, prev);
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
window.__PERF__ = () => ({ ...perf.last, geometries: R.gl.info.memory.geometries, textures: R.gl.info.memory.textures, programs: R.gl.info.programs?.length ?? 0 });
function loop() {
  if (window.__READY__) return;
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.1);
  if (!envSky && !SHOT && !started) return;
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
    setZone(zoneAt(player.pos));
    const spot = inter.update(dt, player.pos, UI.ui.state === 'play' && !G.frozen);
    UI.setPrompt(spot ? (typeof spot.prompt === 'function' ? spot.prompt() : spot.prompt) : '');
    for (const f of G.onUpdate) f(dt, t);
  }
  // 太阳阴影跟随相机
  const focus = camera.position.clone(); focus.y = 0;
  sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(SUN_DIR, 300);
  const texel = 220 / sun.shadow.mapSize.x; sun.target.position.x = Math.round(sun.target.position.x / texel) * texel; sun.target.position.z = Math.round(sun.target.position.z / texel) * texel; sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 300);
  // 曝光适应
  curExp += (targetExp - curExp) * Math.min(1, dt * 1.5);
  R.setExposure(curExp);
  for (const s of ctx.screens) s.update(dt, t);
  updateExterior(ctx, dt, t); updateInteriors(ctx, dt, t); updateEastWing(ctx, dt, t); updateVault(ctx, dt, t, started ? player.pos : null); updateRooms(ctx, dt, t); updateUpper(ctx, dt, t); updateDressing(ctx, dt, t); updateDepths(ctx, dt, t);
  R.gl.info.autoReset = false; R.gl.info.reset(); // M6：统计整帧（反射 + 阴影 + 后期全部 pass）
  reflector.setY(FLOOR); reflector.update(scene, camera, R.q.reflect);
  R.render(dt);
  frames++;
  perf.last = { calls: R.gl.info.render.calls, tris: R.gl.info.render.triangles, zone: G.zone };
  if (showFps) { fpsAcc += dt; fpsN++; perf.max = Math.max(perf.max, dt); if (fpsAcc > 0.5) { const i = R.gl.info; UI.setFpsText(`${Math.round(fpsN / fpsAcc)} fps · ${(fpsAcc / fpsN * 1000).toFixed(1)} ms（峰 ${(perf.max * 1000).toFixed(0)}）\n${i.render.calls} drawcall · ${(i.render.triangles / 1e6).toFixed(2)}M 三角面\n程序 ${i.programs?.length ?? 0} · 几何 ${i.memory.geometries} · 贴图 ${i.memory.textures}\n区域 ${G.zone ?? '-'} · 画质 ${R.q.label ?? ''}`); fpsAcc = 0; fpsN = 0; perf.max = 0; } }
  if (SHOT && shotStarted) { shotN++; LOG('frame', shotN, (performance.now() / 1000).toFixed(1)); if (shotN === shotFrames) window.__READY__ = true; }
}
let shotFrames = 30, shotStarted = false, shotN = 0;
window.__setShot = (name) => { window.__READY__ = false; shotN = 0; applyShot(name); requestAnimationFrame(loop); };
function startShot() { applyShot(SHOT); }
function applyShot(name) {
  const s = SHOTS[name] ?? SHOTS.plaza;
  document.getElementById('loading').classList.add('hidden');
  if (params.get('hud')) document.getElementById('hud').classList.remove('hidden');
  camera.position.set(...s.pos);
  if (s.look) camera.lookAt(...s.look); else camera.rotation.set(s.pitch ?? 0, s.yaw ?? 0, 0, 'YXZ');
  if (s.fov) { camera.fov = s.fov; camera.updateProjectionMatrix(); }
  setZone(s.zone ?? zoneAt(new THREE.Vector3(s.pos[0], s.pos[1] - 1.6, s.pos[2])), true);
  curExp = targetExp; time.value = s.t ?? 12;
  if (/^b5(?!_door)/.test(name) && ctx.vault?.door) { ctx.vault.door.opened = true; for (const ac of ctx.vault.door.acts) ac.play(); ctx.vault.door.mixer.setTime(10); }
  shotFrames = Number(params.get('frames') || 8);
  shotStarted = true;
  window.__SHOT_INFO__ = () => ({ calls: R.gl.info.render.calls, tris: R.gl.info.render.triangles, zone: G.zone });
}
loop();
boot().catch((e) => { console.error(e); UI.loadProgress(1, '加载失败：' + e.message); });

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
