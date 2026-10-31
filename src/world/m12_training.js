// 批次 M12：B6 训练场第二轮（续 M9）。只作用于 training 区（含 B6 电梯厅），在 buildR3 之后跑一遍（main.js 调用），幂等。
// 1 地面：深蓝灰橡胶地垫 → 暖灰混凝土（带磨损）；地面网格灯带与黄 / 白标线压成暗铜 / 暗黄。
// 2 简报区课椅：r3plan 改用 m12/tr_chair（tools/blender/m12_training.py，胡桃座背 + 铸铁腿）。
// 3 副本门：书页拱门发光色 蓝 / 黄 / 紫 / 绿 / 橙 → 琥珀 / 暗金 / 酒红 / 铜褐 / 羊皮纸（ABY 封门保持暗红），门前点光一并暖化；自发光峰值 ≤0.67（updateRooms）。
// 4 B6 电梯厅：铆钉钢板墙裙 → 胡桃板、素混凝土墙（透过开口读成橄榄绿大片）→ 暖深灰、环氧地坪 → 同训练场地面；训练场一侧开口加石门套（门柱 + 门楣 + 檐口 + 柱础，两个小碰撞盒，不占通行宽度）。
// 5 器材柜 / 高窗：在 m9_training.js 里改（暖灰烤漆压深、高窗暖白 0.45）。
// 6 屋架：m12/tr_truss（m9_training.py truss 出模）×5 替换 dressing.js 的平铁灯光桁架（M12_TRAIN 下关闭旧件，射灯头保留）。
// 7 兜底：区内其余材质 / 灯光若色相落在黄绿—蓝—紫（72°–288°）且有饱和度 → 改成暖褐 / 暖白（克隆材质，不影响其他区）。
// 剧情锚点 / 触发器 / 原碰撞不动。?nom12=1 回旧。
import * as THREE from 'three';
import { loadModel, pbr } from '../engine/assets.js';
import { weather } from '../engine/weather.js';
import { m5Mats } from './dress_m5.js';
import { dressMats } from './dress.js';

export const M12_TRAIN = typeof location !== 'undefined' && !new URLSearchParams(location.search).has('nom12');

const WARM_GATES = [0xd89a48, 0xb8913a, 0x9a3a2c, 0xa0603a, 0xd8c49a, 0xff2030]; // SUR 琥珀 / COM 暗金 / MYS 酒红 / RPG 铜褐 / EXP 羊皮纸 / ABY 原红（封门不动）
let M = null;
function mats() {
  if (M) return M;
  const floor = pbr('Concrete034', { color: 0x8c8378, roughness: 0.82, env: 0.3 });
  weather(floor, { macro: 0.35, grime: 0.4, dust: 0.3, ground: -60, rough: 0.12 });
  M = {
    floor,
    grid: new THREE.MeshStandardMaterial({ color: 0x3a2c1c, emissive: 0x5a3e1e, emissiveIntensity: 0.05, roughness: 0.6, metalness: 0.5 }),
    paintY: new THREE.MeshStandardMaterial({ color: 0x6e5422, roughness: 0.88 }),
    paintW: new THREE.MeshStandardMaterial({ color: 0x7e7466, roughness: 0.88 }),
    walnut: pbr('Wood051', { color: 0x5e3c2a, roughness: 0.55, env: 0.4 }),
    stone: pbr('Concrete034', { color: 0x9a8e7e, roughness: 0.78, env: 0.4 }),
    stoneDark: pbr('Concrete034', { color: 0x5e554b, roughness: 0.72, env: 0.4 }),
    bronze: pbr('Metal046A', { color: 0x7a5634, metalness: 0.9, roughness: 0.5, env: 0.5 }),
    truss: pbr('Metal046A', { color: 0x5a3c26, metalness: 0.6, roughness: 0.55, env: 0.5 }),
    iron: pbr('Metal046A', { color: 0x2e2a26, metalness: 0.8, roughness: 0.5, env: 0.45 }),
    trussIron: pbr('Metal046A', { color: 0x2e2a26, metalness: 0.5, roughness: 0.6, env: 0.3 }), // 屋架节点板 / 铆钉：金属度 0.8 时反射天空 HDR 成蓝点 → 压低
    trussRivet: pbr('Metal046A', { color: 0x6a4a2e, metalness: 0.5, roughness: 0.6, env: 0.3 }),
    hallWall: pbr('Concrete034', { color: 0x6a6158, roughness: 0.8, env: 0.35 }), // B6 电梯厅墙（原 r3_bunkerConc 透过开口读成橄榄绿）→ 暖深灰
  };
  for (const k of ['grid', 'paintY', 'paintW']) M[k].userData.noShadow = true;
  for (const m of Object.values(M)) m.userData.m12 = true;
  return M;
}

const _hsl = {};
const coolHue = (c, sMin) => { c.getHSL(_hsl); return _hsl.s > sMin && _hsl.l > 0.03 && _hsl.h > 0.2 && _hsl.h < 0.8; };
const _warm = new Map();
function warmMat(m) {
  if (!m || m.userData?.m12) return m;
  if (_warm.has(m.uuid)) return _warm.get(m.uuid);
  let out = m;
  const cc = m.color && coolHue(m.color, 0.12), ce = m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() && coolHue(m.emissive, 0.1);
  if (cc || ce) {
    out = m.clone(); out.userData = { ...m.userData, m12: true };
    if (cc) { out.color.getHSL(_hsl); out.color.setHSL(0.075, Math.min(_hsl.s, 0.3), _hsl.l); }
    if (ce) { out.emissive.getHSL(_hsl); out.emissive.setHSL(0.09, Math.min(_hsl.s, 0.55), _hsl.l); }
  }
  _warm.set(m.uuid, out); return out;
}

function doorSurround(zone, world, y) {
  const T = mats(), g = new THREE.Group(); g.name = 'm12_tr_doorcase';
  const B = (m, w, h, d, x, yy, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, yy, z); o.castShadow = o.receiveShadow = true; g.add(o); };
  const zf = -92.2; // 北墙内表面；门套向训练场一侧凸出（−z）
  for (const s of [-1, 1]) {
    const x = s * 10.0; // 洞口 x ±9.4，门柱 1.2 宽贴洞口外沿（9.4…10.6）
    B(T.stoneDark, 1.5, 0.5, 0.95, x, y + 0.25, zf - 0.475); // 柱础
    B(T.stone, 1.2, 5.9, 0.72, x, y + 0.5 + 2.95, zf - 0.36); // 门柱
    B(T.stoneDark, 0.08, 5.6, 0.04, x - s * 0.5, y + 3.3, zf - 0.74); // 内侧退缩线
    B(T.bronze, 0.03, 5.2, 0.02, x - s * 0.3, y + 3.2, zf - 0.73); // 暗铜嵌线
    B(T.stoneDark, 1.4, 0.3, 0.86, x, y + 6.55, zf - 0.43); // 柱头垫石
    world?.box(x, y + 3.2, zf - 0.47, 1.5, 6.4, 0.95);
  }
  B(T.stone, 21.6, 1.3, 0.78, 0, y + 7.35, zf - 0.39); // 门楣（洞口顶 5.2，门楣底 6.7，中间是原墙）
  B(T.bronze, 19.6, 0.04, 0.02, 0, y + 6.95, zf - 0.79);
  B(T.stoneDark, 22.4, 0.18, 0.95, 0, y + 8.09, zf - 0.475); // 檐口两级
  B(T.stoneDark, 22.8, 0.12, 1.05, 0, y + 8.24, zf - 0.525);
  B(T.stone, 1.3, 1.5, 0.84, 0, y + 7.35, zf - 0.42); // 拱心石
  B(T.bronze, 0.7, 0.22, 0.02, 0, y + 7.3, zf - 0.85); // 铜铭牌
  zone.add(g);
}

export async function applyM12Training(ctx, world) {
  const zone = ctx?.zones?.training; if (!M12_TRAIN || !zone || zone.userData.m12) return;
  zone.userData.m12 = true;
  const T = mats(), y = -52; let MM = {}, D = {}; try { MM = m5Mats(); D = dressMats(); } catch (e) { console.warn('M12 mats', e); }
  // 副本门：书页材质换暖色（原色只决定发光色相，代号 / 铭牌 / 锚点不动）
  for (const [i, p] of (ctx.rooms?.portals ?? []).entries()) { if (i === 5) continue; const col = new THREE.Color(WARM_GATES[i]).lerp(new THREE.Color(0xffe8c0), 0.35); p.material.emissive.copy(col); p.material.userData.m12 = true; }
  // 屋架
  try {
    const s = await loadModel('m12/tr_truss'); const tg = new THREE.Group(); tg.name = 'm12_tr_truss';
    s.traverse((o) => { if (o.isMesh) { const n = (o.material?.name || '').replace(/\.\d+$/, ''); o.material = n === 'm1_iron' ? T.trussIron : n === 'm2_bronze' ? T.trussRivet : T.truss; o.castShadow = true; o.receiveShadow = true; } });
    for (let z = -102; z > -152; z -= 12) { const c = s.clone(); c.position.set(0, y + 16 - 2.0, z); c.scale.set(63.2 / 64.36, 1, 1); tg.add(c); }
    zone.add(tg);
  } catch (e) { console.warn('M12 truss', e); }
  doorSurround(zone, world, y);
  // 材质替换 + 兜底暖化
  const swap = (m) => m === MM.trainFloor ? T.floor : m === MM.paintY ? T.paintY : m === MM.paintW ? T.paintW : (D.r3_steelRivet && m === D.r3_steelRivet) ? T.walnut : (D.r3_bunkerConc && m === D.r3_bunkerConc) ? T.hallWall : (D.r3_epoxy && m === D.r3_epoxy) ? T.floor : (m?.emissive && m.color && m.emissive.getHex() === 0xc9a052 && m.color.getHex() === 0x1a1610) ? T.grid : warmMat(m);
  zone.traverse((o) => {
    if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
    if (o.isLight && o.color && coolHue(o.color, 0.08)) { o.color.getHSL(_hsl); o.color.setHSL(0.08, 0.55, Math.max(_hsl.l, 0.8)); }
  });
}
