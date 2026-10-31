// 批次 M10：第七局作战室 / 杀青室陈设替换（tools/blender/m10_s7props.py → public/assets/models/m10/{pendant,oldchair,stool}.glb）
// ① 白色圆锥吊灯罩 → 1960–70 年代暖黑搪瓷工业吊灯（内侧暖白、暗古铜灯头、自发光 <1.0）
// ② 白网面现代转椅 → 胡桃 + 酒红褐皮面老式办公椅（四爪铸铁底座 + 铜轮）
// ③ 杀青室中轴 6 只纯黑方块木凳 → 胡桃框 + 皮面方凳（铜钉压边）；原本就无碰撞、非锚点，位置不变
// 位置由 depths.js 收集后传入；`?nom10=1` 回旧（仍走原圆锥罩 / office_chair / 黑方块）。
import * as THREE from 'three';
import { loadModel } from '../engine/assets.js';

export const NO_M10 = typeof location !== 'undefined' && /[?&]nom10=1/.test(location.search);

function tune(o) {
  o.traverse((m) => {
    if (!m.isMesh) return; m.castShadow = false; m.receiveShadow = true;
    const mt = m.material; if (!mt || !mt.name) return;
    if (/^m10_(bronze|iron)/.test(mt.name)) { mt.envMapIntensity = 0.5; mt.roughness = Math.max(mt.roughness, 0.48); }
    else mt.envMapIntensity = Math.min(mt.envMapIntensity ?? 1, 0.4);
    if (mt.name === 'm10_bulb') { mt.emissive.setRGB(1.0, 0.8, 0.52); mt.emissiveIntensity = 0.9; m.userData.noShadow = true; }
    if (mt.name === 'm10_enamelIn') { mt.emissive.setRGB(1.0, 0.86, 0.66); mt.emissiveIntensity = 0.35; mt.side = THREE.DoubleSide; }
  });
  return o;
}

/** items: { pendants:[[x,y,z]], chairs:[[x,y,z,yaw]], stools:[[x,y,z]] } */
export function buildM10Seventh(zone, items) {
  const put = (name, list, f) => loadModel('m10/' + name).then((src) => { tune(src); for (const it of list) { const o = src.clone(true); f(o, it); zone.add(o); } });
  return Promise.all([
    put('pendant', items.pendants, (o, [x, y, z]) => o.position.set(x, y, z)),
    put('oldchair', items.chairs, (o, [x, y, z, yaw]) => { o.position.set(x, y, z); o.rotation.y = yaw; }),
    put('stool', items.stools, (o, [x, y, z]) => o.position.set(x, y, z)),
  ]);
}
