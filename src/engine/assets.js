// 资产加载：GLB（meshopt）、PBR 贴图集、HDRI；带进度回调与缓存
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export const BASE = './';
export const manager = new THREE.LoadingManager();
// R3 批次6：截图模式要知道还有多少资源在加载（shot.mjs 首张等它归零），并记下超时用空组顶上的模型
const _ld = { pending: 0, timeouts: [] };
{ const s0 = manager.itemStart.bind(manager), e0 = manager.itemEnd.bind(manager), r0 = manager.itemError.bind(manager);
  manager.itemStart = (u) => { _ld.pending++; s0(u); }; manager.itemEnd = (u) => { _ld.pending--; e0(u); }; manager.itemError = (u) => { r0(u); }; }
if (typeof window !== 'undefined') window.__LOADSTATE__ = () => ({ pending: _ld.pending, timeouts: _ld.timeouts.slice() });
const SHOT_MODE = typeof location !== 'undefined' && /[?&]shot=/.test(location.search);
const gltfLoader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
const texLoader = new THREE.TextureLoader(manager);
const rgbeLoader = new RGBELoader(manager);

let anisotropy = 8;
export function setAnisotropy(a) { anisotropy = a; }

const modelCache = new Map();
// R2：网上模型别名（tools/models_all.mjs 处理进 assets/models/r2/）
export const ALIAS = { lion_justice: 'r2/lion_palais_de_justice_d_orl_ans_france', gargoyle_a: 'r2/gargoyle_3dst27', gargoyle_b: 'r2/gargoyle_statue_photogrammetry' };
/** 加载 GLB，返回原始 scene（缓存）。unlit 扫描件转为 PBR。 */
const _woodMats = {};
const WOOD_TONE = { 'r2/lib_vitrine': [0x7c5434, 0x9a6a44], 'r2/lib_globe': [0x6a4630, 0xb07a4c], 'r2/arch_catalog': [0x8a5a38, 0xc08a58], 'r2/arch_bookcart': [0x8a5a38, 0xc08a58] }; // 批次46：档案馆目录柜 / 书车 ac_walnut 纯色直出在游戏里读成米色胶合板 → 走盒投影 Wood051（0x3a2416 一档看图成黑漆 → 0x9a6844 仍近乌木 → 0xc08a58 中胡桃） // 批次43：陈列柜底柜芯板（sw_walnutDarkVit → 0x4a3020 近黑）、地球仪三弯腿看图偏黑 → 按模型提亮木纹 albedo（不再加灯）
function woodBox(o, m, model) { // 物体空间盒投影 UV（0.5 m 一格，按法线主轴取面），木纹沿长边
  const g = o.geometry, pa = g.getAttribute('position'), na = g.getAttribute('normal'); if (!pa || !na) return;
  const uv = new Float32Array(pa.count * 2);
  for (let i = 0; i < pa.count; i++) { const nx = Math.abs(na.getX(i)), ny = Math.abs(na.getY(i)), nz = Math.abs(na.getZ(i)); const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
    const [u, v] = nx >= ny && nx >= nz ? [z, y] : ny >= nz ? [x, z] : [x, y]; uv[i * 2] = u / 0.9; uv[i * 2 + 1] = v / 0.45; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const dark = /Dark/.test(m.name), tone = WOOD_TONE[model];
  o.material = _woodMats[(tone ? model + ':' : '') + m.name] ??= Object.assign(pbr('Wood051', { color: tone ? tone[dark ? 0 : 1] : dark ? 0x4a3020 : 0x8a5a38, roughness: 0.55, env: 0.6 }), { name: m.name });
}
export function loadModel(name) {
  name = ALIAS[name] ?? name;
  if (!modelCache.has(name)) {
    modelCache.set(name, new Promise((resIn) => { let res = resIn;
      // 超时保护：单个模型 60 秒没加载完就用空组顶上，不让整个场景卡在加载
      const to = setTimeout(() => { console.warn('[NB] 模型加载超时', name); _ld.timeouts.push(name); res(new THREE.Group()); }, SHOT_MODE ? 900000 : 60000); // 截图模式（SwiftShader 慢机）放宽到 15 分钟，避免首张把大 GLB 当超时换成空组
      res = (v) => { clearTimeout(to); resIn(v); };
      gltfLoader.load(`${BASE}assets/models/${name}.glb`, (g) => {
        g.scene.traverse((o) => {
          if (o.isMesh) {
            const m = o.material;
            if (m && /^(dd|gd|sw|ac|id)_walnut/.test(m.name || '')) { woodBox(o, m, name); return; } // 批次36：Blender 精建台体（值班长台 / 引导台）的胡桃木面是无 UV 纯色 → cc_r3_c 看图像橙色塑料；补盒投影 UV + Wood051 木纹
            if (name === 'r2/44_pocket_rotating_newspaper_stand' && m) { // 批次39：旋转报架原模型 FrontColor 纯白无贴图 + 双面薄片 → 黄昏 / 室内都发白、像半透明线框（ext_busstop、cs 表格取阅架）；改旧新闻纸灰米色 + 阳极铝真金属
              if (m.name === 'FrontColor') o.material = new THREE.MeshStandardMaterial({ name: 'np_paper', color: 0x8c8474, roughness: 0.92, side: THREE.DoubleSide });
              else if (/Alumin/.test(m.name || '')) o.material = new THREE.MeshStandardMaterial({ name: 'np_alu', color: 0x8d939a, roughness: 0.38, metalness: 0.85, side: THREE.DoubleSide });
            }
            /* 批次44：书脊压暗改在 tools/blender/lib_nook.py 里降饱和重导，运行时 ×0.5 去掉 */ // 批次43：lib_nook 书脊在游戏里偏粉 / 青（线性色值直出偏浅）→ 压暗一半，读成旧精装深红 / 墨绿 / 藏青
            if (m && /decal_screen/.test(m.name || '')) { o.material = screenUI(0); o.userData.screen = 'flat'; o.castShadow = false; return; }
            if (m && m.name === 'monitor_glass') { o.material = crtUI(2); o.userData.screen = 'crt'; o.castShadow = false; return; } // 批次57：CRT 玻璃换终端界面 // M5：显示器原贴图是粉紫色桌面，换成局内系统界面
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
  obj.traverse((o) => { if (o.userData.screen) o.material = o.userData.screen === 'crt' ? crtUI(_scrK++) : screenUI(_scrK++); });
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
  if (base.source.data?.nbFreed) t.version++; else t.needsUpdate = true; // 批次12 freecpu：源图已上传并丢掉 CPU 副本时不能 source.version++（会重传空图），只让 clone 复用已上传的 GPU 贴图
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

// —— 批次57：显示器界面池（机关终端风：琥珀荧光 / 暖白，640×320 = 屏面 UV 0.039–0.966 × 物理宽高比 1.85 → 不拉伸）——
// 0 档案检索 1 叫号队列 2 值班日志 3 电报收发 4 表单/菜单 5 局徽待机；按区域分配见 SCR_ZONE
let _scrK = 1; const _scr = [];
function termCanvas(W, H, warm, draw) { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const fg = warm ? '#efe6cf' : '#ffb347', dim = warm ? '#9a917c' : '#a8702a', bg = warm ? '#16130e' : '#120a03';
  const g = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.6); g.addColorStop(0, warm ? '#24201a' : '#221406'); g.addColorStop(1, bg); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const mx = Math.round(W * 0.05); draw(c, W, H, { fg, dim, mx, mono: (sz, b = '') => `${b} ${sz}px "NB Sans", monospace` });
  for (let y = 0; y < H; y += 3) { c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(0, y, W, 1); } return cv; }
function termHead(c, W, o, t, r) { c.fillStyle = o.fg; c.fillRect(o.mx, 10, W - o.mx * 2, 26); c.fillStyle = '#1a1208'; c.font = o.mono(17, 700); c.fillText(t, o.mx + 8, 29); c.textAlign = 'right'; c.fillText(r, W - o.mx - 8, 29); c.textAlign = 'left'; }
function termFoot(c, W, H, o, t) { c.strokeStyle = o.dim; c.lineWidth = 1; c.beginPath(); c.moveTo(o.mx, H - 34); c.lineTo(W - o.mx, H - 34); c.stroke(); c.fillStyle = o.dim; c.font = o.mono(14); c.fillText(t, o.mx + 4, H - 14); c.fillStyle = o.fg; c.fillRect(W - o.mx - 16, H - 28, 10, 16); }
const SCR_DRAW = [
  (c, W, H, o) => { termHead(c, W, o, '档案检索 ARCH-SRCH', '库：B1 总档'); c.font = o.mono(16); c.fillStyle = o.fg; c.fillText('查询> 编号=A-03*  状态=全部', o.mx + 4, 62);
    c.fillStyle = o.dim; c.fillText('编号     题名               密级  架位', o.mx + 4, 90);
    [['A-0301', '京城旧报合订·一九七九', '内部', '07-3-12'], ['A-0314', '叙事污染区调查记录', '机密', '11-1-04'], ['A-0327', '市民来函登记簿（卷三）', '一般', '02-5-21'], ['A-0341', '外勤人员周也履历', '机密', '09-2-08'], ['A-0358', '东廊修缮图纸', '一般', '04-4-17']].forEach((r, i) => { const y = 116 + i * 26; if (i === 1) { c.fillStyle = o.fg; c.fillRect(o.mx, y - 18, W - o.mx * 2, 24); c.fillStyle = '#1a1208'; } else c.fillStyle = o.fg; c.fillText(`${r[0]}   ${r[1].padEnd(13, '　')} ${r[2]}  ${r[3]}`, o.mx + 4, y); });
    termFoot(c, W, H, o, '共 27 条  第 1/6 页   F3 调阅  F5 借出登记'); },
  (c, W, H, o) => { termHead(c, W, o, '市民服务 · 叫号队列', '10:42'); c.fillStyle = o.dim; c.font = o.mono(15); c.fillText('窗口   当前号   业务          等候', o.mx + 4, 62);
    [['1', 'A027', '来函登记', '3'], ['2', 'A031', '证明开具', '5'], ['3', 'B012', '档案查询', '2'], ['4', '——', '暂停服务', '-'], ['5', 'C004', '投诉受理', '1']].forEach((r, i) => { const y = 92 + i * 30; c.fillStyle = i === 3 ? o.dim : o.fg; c.font = o.mono(i === 0 ? 22 : 18, i === 0 ? 700 : ''); c.fillText(`${r[0]}号   ${r[1]}    ${r[2].padEnd(6, '　')}   ${r[3]}人`, o.mx + 4, y); });
    termFoot(c, W, H, o, '已办 118  待办 11   [呼叫] [重呼] [过号]'); },
  (c, W, H, o) => { termHead(c, W, o, '值班日志 DUTY-LOG', '十月卅一日 夜班'); c.font = o.mono(15);
    [['21:00', '交接班完毕，在岗 6 人，无遗留事项'], ['21:37', '东廊 03 号探头画面抖动，已报修'], ['22:05', 'B5 收容区读数 0.82，正常范围'], ['22:18', '接市民来电一次，已登记转办'], ['22:40', '巡查档案馆北门，门禁正常'], ['23:02', '电报室收到外勤简报 2 份']].forEach((r, i) => { const y = 64 + i * 27; c.fillStyle = o.dim; c.fillText(r[0], o.mx + 4, y); c.fillStyle = o.fg; c.fillText(r[1], o.mx + 70, y); });
    termFoot(c, W, H, o, '值班员：　　签字待补   F2 新增  F9 打印'); },
  (c, W, H, o) => { termHead(c, W, o, '电报收发 TLX-07', '线路 03 ●在线'); c.font = o.mono(15); c.fillStyle = o.dim; c.fillText('收报 0417   发自：外勤二组   等级：急', o.mx + 4, 62);
    c.fillStyle = o.fg; ['ZCZC 0417 BJ', '目标区域读数回落 已撤离两名市民', '旧书店现场封存完毕 请派车接收证物', '请示：是否扩大巡查至西街', 'NNNN'].forEach((t, i) => c.fillText(t, o.mx + 4, 92 + i * 26));
    c.fillStyle = o.dim; c.fillText('发报队列：2   回执：0416 已签收', o.mx + 4, 92 + 5 * 26 + 6); termFoot(c, W, H, o, '[F1 收报] [F2 拟稿] [F4 发送] [F8 存档]'); },
  (c, W, H, o) => { termHead(c, W, o, '业务办理 · 主菜单', '终端 CS-02'); c.font = o.mono(17);
    ['1  来函来访登记', '2  证明材料开具', '3  档案调阅申请', '4  遗失声明登记', '5  投诉与建议', '0  退出'].forEach((t, i) => { const y = 66 + i * 28; if (i === 2) { c.fillStyle = o.fg; c.fillRect(o.mx, y - 20, W * 0.46, 26); c.fillStyle = '#1a1208'; } else c.fillStyle = o.fg; c.fillText(t, o.mx + 8, y); });
    c.strokeStyle = o.dim; c.strokeRect(W * 0.55, 48, W * 0.4, 170); c.fillStyle = o.dim; c.font = o.mono(14); ['申请人：', '证件号：', '事由：', '经办：'].forEach((t, i) => { c.fillText(t, W * 0.57, 76 + i * 38); c.fillRect(W * 0.66, 80 + i * 38, W * 0.26, 1); });
    termFoot(c, W, H, o, '请输入序号后按回车'); },
  (c, W, H, o) => { const cx = W / 2; c.strokeStyle = o.fg; c.lineWidth = 3; c.beginPath(); c.arc(cx, 138, 62, 0, 7); c.stroke(); c.fillStyle = o.fg; c.beginPath(); c.moveTo(cx, 80); c.lineTo(cx + 14, 138); c.lineTo(cx, 196); c.lineTo(cx - 14, 138); c.closePath(); c.fill();
    c.textAlign = 'center'; c.font = o.mono(22, 700); c.fillText('叙 事 管 理 局', cx, 240); c.fillStyle = o.dim; c.font = o.mono(15); c.fillText('终端已锁定 · 请插入工作证', cx, 270); c.textAlign = 'left'; },
];
export const SCR_ZONE = (id) => /citizen|gate|plaza|reception/.test(id) ? [1, 4, 1, 4, 5] : /archive|library/.test(id) ? [0, 0, 4, 0, 5] : /command|security|interrog|b4|b5/.test(id) ? [2, 3, 2, 3, 0] : [0, 2, 3, 4, 1, 5];
export function screenUI(k) {
  if (!_scr.length) SCR_DRAW.forEach((d, i) => { const cv = termCanvas(640, 320, i % 2 === 1 && i !== 1, d); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = 4;
    _scr.push(new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.85, roughness: 0.25, metalness: 0, name: 'scr' + i })); });
  return _scr[k % _scr.length];
}
const _crt = new Map();
export function crtUI(k) { k %= SCR_DRAW.length; if (!_crt.has(k)) { screenUI(0); const t = _scr[k].emissiveMap.clone(); t.needsUpdate = true; // CRT 玻璃 UV 在图集 u .752–.909 / v .606–.816 一块 → repeat/offset 把整张界面铺进这块（玻璃物理 4:3，裁两侧保持不拉伸）
    t.repeat.set(1 / 0.157 * 0.667, 1 / 0.21); t.offset.set(-0.752 / 0.157 * 0.667 + 0.1665, -0.606 / 0.21); _crt.set(k, new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.85, roughness: 0.2, side: THREE.DoubleSide, name: 'crt' + k })); }
  return _crt.get(k); }
