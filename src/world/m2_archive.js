// 批次 M2：西翼人事档案馆（archive）建筑壳 Blender 精建接入。
// 模型：public/assets/models/m2/{arch_coffer,arch_entab,arch_pilaster,arch_door}.glb（tools/blender/m2_archive.py）。
// 原地面/墙/回廊/楼梯/抽屉墙/借阅台/叶寻/便签 ctx.stickyNote 等剧情锚点与碰撞全部不动；
// 只替换：平板天花下的木梁格 + 铁桁架（interiors.js 里 M2_ARCHIVE 下关闭）→ 3×3 m 藻井格 12×12；新增四周檐部、东墙壁柱 ×4、东门石门套。
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { loadModel, pbr } from '../engine/assets.js';
import { stainedGlassTexture } from '../engine/fx.js';
import { archShape } from './gothic.js';

export const M2_ARCHIVE = !new URLSearchParams(location.search).has('nom2');

let MM = null;
function m2Mats() {
  if (MM) return MM;
  MM = {
    m1_walnut: pbr('Wood051', { color: 0x6a4430, roughness: 0.55, env: 0.4 }),
    m1_walnutDark: pbr('Wood051', { color: 0x3e281c, roughness: 0.5, env: 0.35 }),
    m1_stone: pbr('Concrete034', { color: 0xa89a88, roughness: 0.78, env: 0.45 }),
    m1_stoneDark: pbr('Concrete034', { color: 0x665c52, roughness: 0.72, env: 0.4 }),
    m2_bronze: pbr('Metal046A', { color: 0xb08250, metalness: 1, roughness: 0.48, env: 0.5 }), // 大面金属 roughness ≥0.45 / env ≈0.5
    m1_burgundy: pbr('Fabric023', { color: 0xc25a40, roughness: 0.8, env: 0.3 }), // 批次 M6：0x8a3428 在游戏里读成深褐 → 提亮（藻井格心/楣带/楣板）
    m1_paper: pbr('Fabric023', { color: 0xe0d2b4, roughness: 0.9, env: 0.2 }),
    m6_enamel: pbr('Metal046A', { color: 0x948a7e, metalness: 0.35, roughness: 0.5, env: 0.5 }), // 钢制烤漆暖灰
    m6_enamelDark: pbr('Metal046A', { color: 0x5e564c, metalness: 0.35, roughness: 0.52, env: 0.45 }),
    m1_iron: pbr('Metal046A', { color: 0x2e2a26, metalness: 0.8, roughness: 0.5, env: 0.45 }),
    m6_rubber: new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.85 }),
  };
  return MM;
}
/** 批次 M6：阅览台灯绿罩 → 暗铜罩（只换 lampGreen，其余共享材质不动） */
let LAMP = null;
export function M6_LAMP(M) { if (!LAMP) LAMP = { ...M, lampGreen: new THREE.MeshStandardMaterial({ color: 0x8a5a34, metalness: 1, roughness: 0.45, envMapIntensity: 0.5, side: THREE.DoubleSide }) }; return LAMP; }

/** 批次 M6：西墙高窗彩窗——沿用 stainedGlassTexture 构图，把蓝色菱格 / 纹章底按亮度重映射为琥珀 / 酒红 / 暗金（禁蓝绿） */
function amberGlassTex() {
  const t = stainedGlassTexture(3), cv = t.image, c = cv.getContext('2d'), im = c.getImageData(0, 0, cv.width, cv.height), d = im.data;
  const PAL = [[150, 78, 22], [120, 34, 26], [176, 112, 34], [96, 40, 22]];
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    if (b > r + 20 && b > g) { const k = ((i >> 2) * 2654435761 >>> 28) & 3, v = Math.min(1.25, (b / 184) * 1.05); const p = PAL[(k + (((i >> 2) / cv.width) | 0) / 40 | 0) & 3]; d[i] = p[0] * v; d[i + 1] = p[1] * v; d[i + 2] = p[2] * v; }
    else if (g > r && g > b) { d[i] = 150; d[i + 1] = 90; d[i + 2] = 30; }
  }
  c.putImageData(im, 0, 0); t.needsUpdate = true; return t;
}

const pick = (MAT, m) => MAT[(m?.name || '').replace(/\.\d+$/, '')] ?? m;

/** 同一 glb 按一组矩阵烘进世界坐标、按材质合并（只留 position/normal/uv，避免带第二套 UV） */
function bake(src, mats, MAT) {
  const byMat = new Map(); src.updateMatrixWorld(true);
  src.traverse((o) => { if (!o.isMesh) return; const mat = pick(MAT, o.material); for (const mx of mats) { const g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(mx, o.matrixWorld)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); if (!byMat.has(mat)) byMat.set(mat, []); byMat.get(mat).push(g); } });
  const out = new THREE.Group();
  for (const [mat, gs] of byMat) { const g = mergeGeometries(gs, false); if (!g) continue; const m = new THREE.Mesh(g, mat); m.castShadow = false; m.receiveShadow = true; out.add(m); }
  return out;
}
const Q = (yaw) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
const MX = (x, y, z, yaw = 0, sy = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), Q(yaw), new THREE.Vector3(1, sy, 1));

export function buildM2Archive(zone, world, Y) {
  if (!M2_ARCHIVE) return Promise.resolve();
  const MAT = m2Mats();
  const X0 = -56, X1 = -20, Z0 = -32, Z1 = -70, H = 13;
  // —— 藻井：x −54.5…−21.5、z −34.5…−67.5，12×12 格，顶面贴平板天花底 Y+H ——
  const cof = [];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) cof.push(MX(X0 + 1.5 + i * 3, Y + H, Z0 - 2.5 - j * 3));
  // —— 檐部：2 m 模块，背面贴墙内皮，底 Y+11.8（= 回廊档案盒书架顶），顶入天花 0.05 ——
  const ent = [], EY = Y + H - 1.2;
  for (let x = X0 + 1; x <= X1 - 1 + 1e-6; x += 2) { ent.push(MX(x, EY, Z1, 0)); ent.push(MX(x, EY, Z0, Math.PI)); }
  for (let z = Z1 + 1; z <= Z0 - 1 + 1e-6; z += 2) { ent.push(MX(X0, EY, z, Math.PI / 2)); ent.push(MX(X1, EY, z, -Math.PI / 2)); }
  // —— 东墙壁柱（避开东门 z −48…−55 与门旁灭火器 z −46.9 / −56.1）——
  const pil = [], PZ = [-36.0, -41.5, -61.0, -66.0];
  for (const z of PZ) { pil.push(MX(X1, Y, z, -Math.PI / 2, 11.8 / 11.33)); world.box(X1 - 0.16, Y + 5.9, z, 0.32, 11.8, 0.92); }
  // —— 东门石门套（洞宽 7、高 5.2，中心 z −51.5）——
  for (const sz of [-1, 1]) world.box(X1 - 0.15, Y + 2.7, -51.5 + sz * 3.67, 0.3, 5.4, 0.4);
  // —— 批次 M6：西墙 4 樘高窗彩窗（原 glassIn 蓝底，interiors.js 下 M2_ARCHIVE 关闭）——
  { const gm = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffffff, emissiveMap: amberGlassTex(), emissiveIntensity: 1.35, roughness: 1, side: THREE.DoubleSide, name: 'm6_amberGlass' }); gm.userData.noShadow = true;
    const g0 = new THREE.ShapeGeometry(archShape(2.0, 3.3)); g0.computeBoundingBox(); const bb = g0.boundingBox, uv = g0.attributes.uv, pos = g0.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
    for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(g0, gm); m.position.set(X0 + 0.02, Y + 7.4, Z1 + 6 + k * 8.6); m.rotation.y = Math.PI / 2; m.name = 'm6_glass'; zone.add(m); } }
  const jobs = [];
  // —— 批次 M6：西墙卡片目录柜 8 联（原 r3plan drawer_cabinet ×8 同位：x −55.45、z −36.2…−42.5，面东；深 0.42 背距墙 0.33）——
  const cat = []; for (let k = 0; k < 8; k++) { cat.push(MX(-55.45, Y, -36.2 - k * 0.9, Math.PI / 2)); world.box(-55.45, Y + 0.7, -36.2 - k * 0.9, 0.44, 1.4, 0.88); }
  jobs.push(loadModel('m6/card_catalog').then((s) => { const g = bake(s, cat, MAT); g.name = 'm6_card_catalog'; g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); zone.add(g); }));
  jobs.push(loadModel('m2/arch_coffer').then((s) => { const g = bake(s, cof, MAT); g.name = 'm2_arch_coffer'; zone.add(g); }));
  jobs.push(loadModel('m2/arch_entab').then((s) => { const g = bake(s, ent, MAT); g.name = 'm2_arch_entab'; zone.add(g); }));
  jobs.push(loadModel('m2/arch_pilaster').then((s) => { const g = bake(s, pil, MAT); g.name = 'm2_arch_pilaster'; zone.add(g); }));
  jobs.push(loadModel('m2/arch_door').then((s) => { const g = bake(s, [MX(X1, Y, -51.5, -Math.PI / 2)], MAT); g.name = 'm2_arch_door'; zone.add(g); }));
  return Promise.all(jobs);
}

/** B1 密集库：混凝土肋梁 ×5（避开楼梯洞 z −35.3…−37.5 与冷光灯管 z −34/−41/…，两端阶梯加腋）+ 北墙三管管线 6 段。密集架/第 7 排拨盘/缝隙不动。 */
export function buildM2ArchiveB1(zone, BY, ctx, world) {
  if (!M2_ARCHIVE) return Promise.resolve();
  const MAT = { ...m2Mats(), m2_concrete: pbr('Concrete034', { color: 0x7a7268, roughness: 0.85, env: 0.3 }), m2_pipe: pbr('Metal046A', { color: 0x7a5a3e, metalness: 0.6, roughness: 0.55, env: 0.45 }) };
  const TOP = BY + 5.2, cx = -38;
  if (world) { world.box(-55.69, BY + 0.675, -45.75, 0.58, 1.35, 8.0); } // 批次 M6：西墙档案铁柜 ×16 整排碰撞（z −41.75…−49.75）
  const ribs = [-38.0, -44.5, -51.5, -58.5, -65.5].map((z) => MX(cx, TOP, z));
  const pipes = []; for (let k = 0; k < 6; k++) pipes.push(MX(-53 + k * 6, BY + 4.4, -70, 0));
  return Promise.all([
    loadModel('m2/b1_rib').then((s) => { const g = bake(s, ribs, MAT); g.name = 'm2_b1_rib'; zone.add(g); }),
    loadModel('m2/b1_pipe').then((s) => { const g = bake(s, pipes, MAT); g.name = 'm2_b1_pipe'; zone.add(g); }),
    // 批次 M6：西墙档案铁柜 ×16（原 r3plan rusty_filing_cabinet 同位：x −55.7、z −42.0…−49.5 每 0.5，面东；深 0.56 背贴墙内皮 −56 留 0.02）+ 东墙防火铁门（z −39.6，前通道东端；门套背贴墙内皮 x −20）
    loadModel('m6/b1_cabinet').then((s) => { const I = []; for (let k = 0; k < 16; k++) I.push(MX(-55.69, BY, -42.0 - k * 0.5, Math.PI / 2)); const g = bake(s, I, MAT); g.name = 'm6_b1_cabinet'; zone.add(g); }),
    loadModel('m6/b1_door').then((s) => { const g = bake(s, [MX(-20.0, BY, -39.6, -Math.PI / 2)], MAT); g.name = 'm6_b1_door'; zone.add(g); }),
    // 批次 M6：密集架端板 hero（钢制烤漆暖灰 + 凹芯板压框 + 铸铁把手座 + 手摇轮轴座）挂进每排可移动 grp；原端板/分格线/把手/踢脚板在 interiors.js 下关闭，铜卡框/编号/手摇轮/第 7 排拨盘保留
    loadModel('m6/compact_end').then((s) => { const I = [new THREE.Matrix4()]; const g = bake(s, I, MAT); for (const r of ctx?.compactRows ?? []) { const c = g.clone(); c.name = 'm6_compact_end'; r.grp.add(c); } }),
  ]);
}
