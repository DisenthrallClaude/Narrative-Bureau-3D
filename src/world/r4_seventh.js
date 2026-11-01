// 批次 R4-A：第七局中部充实（开源资源复用）
// 资源：public/assets/models/r4a/*（Above the Desk by Wh1tZz，github.com/Wh1tZz/above-the-desk，Tripo 生成，经作者许可使用；
// meshopt + webp 1k）+ 已入库 r2/woodenchair_01、r2/armchair_01、r2/woodentable_02、r2/rotary_telephone、s1/book_encyclopedia_set_01。
// 平面（坐标见 work/r4a/plan.md）：
// ① 作战室：会商长桌（4 拼，x −1.1…8.9，z −118…−122）——M10 散乱朝向的铸铁四爪转椅 13 把 → 长边两侧成排木椅 16 把（面朝桌）；
//    桌面南沿每桌一台打字机 + 转盘电话 / 信札匣（避开纸堆 −119.5、地图页、台灯、S1 活页夹）；K 的桌换维多利亚木扶手椅；
//    北墙东段（x 3.8…8.1，门洞 |x|<2.2 与西门子内线 x 3.4 之外）书柜 ×3 背贴墙；东墙内鬼墙下（z −119.5…−125.8，壁柱 −118.6 之南）矮档案柜 ×6 + 地球仪 / 座钟 + 暖光池。
// ② 回写台：北墙门洞两侧（|x| 1.7…7.1）书柜 ×3+3（z −158.2…−158.9，红线纸条林 z<−160 之外）；
//    环形定稿台外圈 45° 四角（r 6.8）低矮档案车 ×4（高 0.72 m < 纸条最低 0.79 m，不碰红线林）；南墙壁柱间矮柜 ×2 + 浑天仪；暖光池。
// ③ 杀青室：中部两侧（x ±4.8，z −141 / −150.5，书脊架内侧 1.85 m、中轴凳 / 地毯外）工作台 ×4 + 木椅（面朝书架侧）+ 台灯 + 打字机 / 茶具 / 信札 / 百科，每台暖光池。
// 剧情锚点、触发器、传送、zone 判定不动；`?nor4a=1` 关闭（M10 椅子恢复）。
import * as THREE from 'three';
import { Props } from './dress.js';

export const NO_R4A = typeof location !== 'undefined' && /[?&]nor4a=1/.test(location.search);

export function buildR4Seventh(zone, world, Y, M10) {
  if (NO_R4A) return Promise.resolve();
  const P = new Props();
  const lamp = (x, y, z, i, d) => { const l = new THREE.PointLight(0xffc890, i, d, 2); l.position.set(x, y, z); l.castShadow = false; zone.add(l); };
  const PI = Math.PI;

  // ① 作战室 ——————————————————————————————
  if (M10) M10.chairs.length = 0; // 会商长桌 12 + K 的桌 1 把 M10 转椅由本批接管
  for (let k = 0; k < 4; k++) {
    const x = k * 2.6;
    for (const dx of [-0.5, 0.5]) {
      P.add('r2/woodenchair_01', [x + dx, Y, -117.45], { h: 0.95, yaw: PI }); // 南侧，面朝 −z
      P.add('r2/woodenchair_01', [x + dx, Y, -122.55], { h: 0.95, yaw: 0 }); // 北侧，面朝 +z
    }
    P.add('r4a/typewriter', [x + 0.45, Y + 0.79, -118.42], { w: 0.42, yaw: 0 });
    if (k % 2 === 0) P.add('r2/rotary_telephone', [x - 0.55, Y + 0.79, -118.4], { h: 0.13, yaw: 0.0 });
    else P.add('r4a/correspondence_set', [x - 0.55, Y + 0.79, -118.45], { d: 0.38, yaw: PI / 2 });
  }
  P.add('r2/armchair_01', [-6, Y, -124.95], { h: 1.0, yaw: PI }); world.box(-6, Y + 0.5, -124.95, 0.7, 1.0, 0.7);
  // 北墙东段书柜 ×3（面朝 −z 入室）
  for (const x of [4.55, 6.0, 7.45]) { P.add('r4a/realistic_bookcase', [x, Y, -112.54], { h: 2.0, yaw: PI }); }
  world.box(6.0, Y + 1.0, -112.54, 4.4, 2.0, 0.6);
  lamp(6.0, Y + 2.6, -113.6, 1.6, 5);
  // 东墙内鬼墙下矮档案柜 ×6（面朝 −x）
  for (let i = 0; i < 6; i++) P.add('r4a/lower_cabinet', [9.33, Y, -120.0 - i * 1.05], { w: 1.0, yaw: -PI / 2 });
  world.box(9.33, Y + 0.385, -122.625, 0.48, 0.77, 6.3);
  P.add('r4a/desk_globe', [9.33, Y + 0.77, -121.05], { h: 0.46, yaw: -PI / 2 });
  P.add('r4a/wind_clock', [9.38, Y + 0.77, -124.2], { h: 0.32, yaw: -PI / 2 });
  lamp(8.7, Y + 2.0, -122.6, 1.4, 4.5);

  // ② 回写台 ——————————————————————————————
  for (const sx of [-1, 1]) {
    for (const ax of [2.6, 4.4, 6.2]) P.add('r4a/realistic_bookcase', [sx * ax, Y, -158.62], { h: 2.4, yaw: PI });
    world.box(sx * 4.4, Y + 1.2, -158.62, 5.4, 2.4, 0.7);
    lamp(sx * 4.4, Y + 3.0, -159.6, 1.8, 5.5);
    // 南墙壁柱（x ±1 / ±5）之间矮柜 + 浑天仪（红线竖线 x ±2 / ±4 之间）
    P.add('r4a/lower_cabinet', [sx * 3, Y, -185.53], { w: 1.0, yaw: 0 }); world.box(sx * 3, Y + 0.385, -185.53, 1.0, 0.77, 0.48);
    P.add('r4a/armillary', [sx * 3, Y + 0.77, -185.5], { h: 0.5, yaw: 0 });
    lamp(sx * 3, Y + 2.2, -184.6, 1.2, 4);
  }
  // 环形定稿台外圈 45° 四角档案车（长边沿切线）
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const r = 6.8, rx = sx * Math.SQRT1_2, rz = sz * Math.SQRT1_2, x = rx * r, z = -174 + rz * r;
    const tx = -rz, tz = rx, yaw = Math.atan2(-tz, tx);
    P.add('r4a/library_cart', [x, Y, z], { h: 0.72, yaw });
    world.box(x, Y + 0.36, z, 0.75, 0.72, 0.75);
    lamp(x * 0.92, Y + 2.0, -174 + (z + 174) * 0.92, 1.0, 3.5);
  }

  // ③ 杀青室 ——————————————————————————————
  for (const sx of [-1, 1]) for (const [j, z] of [[0, -141], [1, -150.5]]) {
    const x = sx * 4.8, face = sx > 0 ? -PI / 2 : PI / 2; // 桌面件正面朝向椅子（室内中轴一侧）
    P.add('r2/woodentable_02', [x, Y, z], { h: 0.78, yaw: -PI / 2 }); world.box(x, Y + 0.39, z, 0.9, 0.78, 1.8);
    P.add('r2/woodenchair_01', [sx * 3.95, Y, z], { h: 0.95, yaw: sx > 0 ? PI / 2 : -PI / 2 });
    P.add('r4a/desk_lamp', [x + sx * 0.15, Y + 0.78, z - 0.6], { h: 0.45, yaw: face });
    if (j === 0) { P.add('r4a/typewriter', [x, Y + 0.78, z + 0.05], { w: 0.4, yaw: face }); P.add('s1/book_encyclopedia_set_01', [x + sx * 0.2, Y + 0.78, z + 0.65], { w: 0.45, yaw: face }); }
    else { P.add('r4a/tea_service', [x, Y + 0.78, z + 0.1], { w: 0.42, yaw: face }); P.add('r4a/correspondence_set', [x + sx * 0.05, Y + 0.78, z + 0.62], { d: 0.36, yaw: face + PI / 2 }); }
    lamp(x - sx * 0.3, Y + 1.7, z, 1.3, 3.6);
  }

  return P.build(zone).then((ms) => {
    for (const m of ms || []) {
      if (!m.name.startsWith('props:r4a/')) continue;
      m.material = m.material.clone(); m.material.envMapIntensity = Math.min(m.material.envMapIntensity ?? 1, 0.35);
      if (m.name === 'props:r4a/desk_globe') m.material.color.setHex(0xd2a46c); // 禁蓝绿：海洋青绿 → 暖褐（乘色）
    }
    return ms;
  });
}
