// 批次 M14：B6 训练场第三轮收尾（续 M12）。在 applyM12Training 之后跑一遍，只作用于 training 区，幂等。?nom14=1 回旧。
// 1 射击区：M5 程序化橄榄色隔板 → m14/tr_baffle（铁框 + 胡桃凸芯板 + 帆布吸音芯，同位包住旧板）；平面靶纸 → m14/tr_target（橡木靶框 + 铸铁 T 座 + 沙袋压脚，
//   落地在原靶位 x / z，靶纸贴原 m5_target 画布，顶部挂钩对上原滑车吊线）。射击台 / 射击线 / 碰撞不动。
// 2 冷色件换模型 / 换色：墙脚蓝色塑料周转箱、护具架 / 检录台塑料筐（r2/plastic_container、r2/plastic_crate_*）→ m14/tr_crate（橡木铁包角器材箱，同位同朝向）；
//   副本门旁橄榄色手提探照灯（r2/portable_searchlight，玩家读成"器材包"）→ 棕皮革色；m5_olive（隔板 / 沙袋墙 / 拖车板）→ 棕帆布；
//   浅色发青的金属栏杆 / 低饱和冷灰 → 暖黑铁 / 暖灰。
// 3 屋顶蓝白光点：屋面以上（y+9）金属件 env ≤0.25、roughness ≥0.55（反射 HDR 天空成蓝点）。
// 4 器材柜前亮黄框线（r3_paintYellow）→ 暗黄 0x6e5422。
// 剧情锚点 / 触发器 / 碰撞不动。
import * as THREE from 'three';
import { loadModel, pbr } from '../engine/assets.js';
import { m5Mats } from './dress_m5.js';
import { dressMats } from './dress.js';

export const M14_TRAIN = typeof location !== 'undefined' && !new URLSearchParams(location.search).has('nom14');

let M = null;
function mats() {
  if (M) return M;
  M = {
    m14_oak: pbr('Wood051', { color: 0x7a5236, roughness: 0.62, env: 0.4 }),
    m1_walnut: pbr('Wood051', { color: 0x5e3c2a, roughness: 0.55, env: 0.4 }),
    m1_walnutDark: pbr('Wood051', { color: 0x3a2618, roughness: 0.55, env: 0.4 }),
    m1_iron: pbr('Metal046A', { color: 0x2e2a26, metalness: 0.6, roughness: 0.55, env: 0.45 }),
    m2_bronze: pbr('Metal046A', { color: 0x7a5634, metalness: 0.8, roughness: 0.5, env: 0.5 }),
    m14_canvas: pbr('Fabric023', { color: 0x5a4430, roughness: 0.9, env: 0.2 }),
    olive: pbr('Fabric023', { color: 0x4a3626, roughness: 0.88, env: 0.25 }), // m5_olive → 棕帆布
    leather: new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.6, metalness: 0.1, envMapIntensity: 0.4 }),
    paintY: new THREE.MeshStandardMaterial({ color: 0x6e5422, roughness: 0.88 }),
    rail: pbr('Metal046A', { color: 0x3a302a, metalness: 0.55, roughness: 0.55, env: 0.4 }),
  };
  M.paintY.userData.noShadow = true;
  for (const m of Object.values(M)) m.userData.m12 = m.userData.m14 = true;
  return M;
}
const pick = (m) => (M[(m?.name || '').replace(/\.\d+$/, '')] ?? m);
// 靶纸 UV：原立方投影 → 按包围盒平铺 0..1，整张画布贴满靶纸
function paperUV(geo) {
  geo.computeBoundingBox(); const b = geo.boundingBox, p = geo.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) - b.min.x) / (b.max.x - b.min.x); uv[i * 2 + 1] = (p.getY(i) - b.min.y) / (b.max.y - b.min.y); }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
function instanced(src, mats4, name, over = {}) {
  const g = new THREE.Group(); g.name = name; src.updateMatrixWorld(true);
  src.traverse((o) => {
    if (!o.isMesh) return; const nm = (o.material?.name || '').replace(/\.\d+$/, '');
    let geo = o.geometry; if (nm === 'm14_paper') { geo = geo.clone(); paperUV(geo); }
    const im = new THREE.InstancedMesh(geo, over[nm] ?? pick(o.material), mats4.length);
    mats4.forEach((mt, i) => im.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(mt, o.matrixWorld)));
    im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); g.add(im);
  });
  return g;
}
const MX = (x, y, z, yaw = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(s, s, s));
const _hsl = {};

export async function applyM14Training(ctx) {
  const zone = ctx?.zones?.training; if (!M14_TRAIN || !zone || zone.userData.m14) return;
  zone.userData.m14 = true; const T = mats(), y = -52;
  let MM = {}, D = {}; try { MM = m5Mats(); D = dressMats(); } catch (e) { console.warn('M14 mats', e); }
  const jobs = [];
  // —— 1 射击区（M5：LX0 −18，8 道 × 4.5 m；隔板 x = −18 + 4.5 i，z −141.9；靶 tz = −150 − (i%3)·1.6）——
  const baf = [], tgt = [];
  for (let i = 0; i <= 8; i++) baf.push(MX(-18 + i * 4.5, y, -141.9, Math.PI / 2));
  for (let i = 0; i < 8; i++) tgt.push(MX(-18 + (i + 0.5) * 4.5, y, -150 - (i % 3) * 1.6, 0));
  jobs.push(loadModel('m14/tr_baffle').then((s) => zone.add(instanced(s, baf, 'm14_tr_baffle'))).catch((e) => console.warn('M14 baffle', e)));
  jobs.push(loadModel('m14/tr_target').then((s) => zone.add(instanced(s, tgt, 'm14_tr_target', MM.m5_target ? { m14_paper: MM.m5_target } : {}))).catch((e) => console.warn('M14 target', e)));
  // —— 2 塑料周转箱 / 塑料筐 → 器材箱（同位、同朝向、按原高度缩放，最大 1）——
  const crates = [], hide = [];
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), bb = new THREE.Box3();
  zone.traverse((o) => {
    if (!o.isInstancedMesh || !/^props:r2\/plastic_(container|crate)/.test(o.name)) return;
    hide.push(o);
    const key = o.name; if (crates.some((c) => c.key === key)) return; // 同一模型多个子网格只取一次
    o.geometry.computeBoundingBox();
    for (let i = 0; i < o.count; i++) {
      o.getMatrixAt(i, _m); bb.copy(o.geometry.boundingBox).applyMatrix4(_m); const h = bb.max.y - bb.min.y, wx = bb.max.x - bb.min.x, wz = bb.max.z - bb.min.z;
      _m.decompose(_p, _q, _s); const yaw = new THREE.Euler().setFromQuaternion(_q, 'YXZ').y;
      const sc = Math.min(1, h / 0.5, Math.max(wx, wz) / 0.8);
      crates.push({ key, m: MX(_p.x, bb.min.y, _p.z, yaw, sc) });
    }
  });
  for (const o of hide) o.visible = false;
  if (crates.length) jobs.push(loadModel('m14/tr_crate').then((s) => zone.add(instanced(s, crates.map((c) => c.m), 'm14_tr_crate'))).catch((e) => console.warn('M14 crate', e)));
  // —— 材质：橄榄 / 探照灯 / 黄线 / 浅冷金属栏杆 / 屋顶反光 ——
  const roofY = y + 9; const _w = new THREE.Vector3(); const cache = new Map();
  const fix = (m, o) => {
    if (!m || m.userData?.m14) return m;
    if (MM.m5_olive && m === MM.m5_olive) return T.olive;
    if (D.r3_paintYellow && m === D.r3_paintYellow) return T.paintY;
    if (m.color && [0xc8a020, 0xd8a818].includes(m.color.getHex())) return T.paintY;
    if (/portable_searchlight/.test(o.name) && m.map) { const k = 'sl' + m.uuid; if (!cache.has(k)) { const c = m.clone(); c.color.set(0x9a6a48); c.userData = { ...m.userData, m14: true }; cache.set(k, c); } return cache.get(k); }
    o.getWorldPosition(_w); const high = _w.y > roofY && o.geometry?.boundingSphere?.radius < 40;
    if (!m.color) return m;
    m.color.getHSL(_hsl);
    const coolGrey = _hsl.s > 0.04 && _hsl.h > 0.42 && _hsl.h < 0.75 && _hsl.l > 0.25 && !m.map; // 低饱和冷灰（M12 兜底 s>0.12 抓不到）
    const paleMetal = (m.metalness ?? 0) >= 0.5 && _hsl.l > 0.5 && _hsl.s < 0.25 && !m.emissiveMap && !(m.emissiveIntensity > 0.3); // 读成白 / 发青的金属栏杆
    if (paleMetal) return T.rail;
    if (!coolGrey && !(high && (m.metalness ?? 0) > 0.3)) return m;
    const k = m.uuid + (high ? 'h' : ''); if (cache.has(k)) return cache.get(k);
    const c = m.clone(); c.userData = { ...m.userData, m14: true };
    if (coolGrey) c.color.setHSL(0.08, 0.12, _hsl.l);
    if (high && (m.metalness ?? 0) > 0.3) { c.envMapIntensity = Math.min(c.envMapIntensity ?? 1, 0.25); c.roughness = Math.max(c.roughness ?? 0.5, 0.55); c.metalness = Math.min(c.metalness, 0.5); }
    cache.set(k, c); return c;
  };
  zone.traverse((o) => {
    if (!o.isMesh || o.userData.m14skip) return; if (/^m1[24]_|^m9_/.test(o.parent?.name || '')) return;
    o.material = Array.isArray(o.material) ? o.material.map((m) => fix(m, o)) : fix(o.material, o);
  });
  // 旧平面靶纸（M5 batch 内 m5_target 合并网格）隐藏，由 tr_target 落地靶架替代
  if (MM.m5_target) zone.traverse((o) => { if (o.isMesh && o.material === MM.m5_target && !o.isInstancedMesh) o.visible = false; });
  await Promise.all(jobs);
}
