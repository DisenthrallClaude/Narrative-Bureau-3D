// 批次 S1：第七局开源资源加密（Poly Haven CC0：metal_office_desk / binder_notebook / book_encyclopedia_set_01 / vintage_grandfather_clock_01，
// gltf-transform 1k 贴图 webp + meshopt，public/assets/models/s1/）。位置先做平面核对（work/s1/plan.md）：
// ① 回写台：东西两墙壁柱之间各两座落地钟（z −170.9 / −176.3，背贴护墙内 0.1 m，红线纸条林 |x|<8 不进入 |x|>8.05 带）
// ② 杀青室：北墙镜子两侧各一张 1970 年代钢制办公桌（x ±5，背贴北墙）+ 老式办公椅 + 精装百科一列 + 活页夹 + 转盘电话 + 暖色台面光池
// ③ 作战室：会商长桌（4 张拼桌）北段每桌一组百科 / 活页夹（避开纸堆、地图页、台灯）
// 剧情锚点、触发器全部不动；`?nos1=1` 关闭。
import * as THREE from 'three';
import { Props } from './dress.js';

export const NO_S3 = typeof location !== 'undefined' && /[?&]nos3=1/.test(location.search);
export const NO_S1 = typeof location !== 'undefined' && /[?&]nos1=1/.test(location.search);

export function buildS1Seventh(zone, world, Y) {
  if (NO_S1) return Promise.resolve();
  const P = new Props();
  const lamp = (x, y, z, i, d) => { const l = new THREE.PointLight(0xffc890, i, d, 2); l.position.set(x, y, z); l.castShadow = false; zone.add(l); };
  // ① 回写台落地钟（钟面朝室内）
  for (const z of [-170.9, -176.3]) for (const sx of [-1, 1]) {
    P.add('s1/vintage_grandfather_clock_01', [sx * 8.35, Y, z], { h: 2.1, yaw: sx > 0 ? -Math.PI / 2 : Math.PI / 2 });
    world.box(sx * 8.35, Y + 1.05, z, 0.45, 2.1, 0.66);
  }
  for (const sx of [-1, 1]) lamp(sx * 7.6, Y + 2.6, -173.6, 2.2, 5);
  // ② 杀青室北墙两张办公桌（使用侧 = +Z 朝南，人面北）
  for (const sx of [-1, 1]) {
    const x = sx * 5, z = -157.16;
    P.add('s1/metal_office_desk', [x, Y, z], { w: 2.0, yaw: 0 }); world.box(x, Y + 0.4, z, 2.0, 0.8, 0.95);
    P.add('s1/book_encyclopedia_set_01', [x + sx * 0.55, Y + 0.79, -157.54], { w: 0.55, yaw: 0 });
    P.add('s1/binder_notebook', [x - sx * 0.3, Y + 0.79, -157.0], { w: 0.5, yaw: sx * 0.08 });
    P.add('r2/rotary_telephone', [x - sx * 0.75, Y + 0.79, -157.45], { h: 0.13, yaw: sx * 0.25 });
    P.add('m10/oldchair', [x, Y, -156.2], { h: 1.0, yaw: Math.PI });
    lamp(x, Y + 1.7, -156.9, 1.6, 3.6);
    // 批次 S3：桌外侧（x ±6.45，离桌端 0.26 m、离北墙 0.25 m）高脚胡桃花几 + 壁炉台座钟（Poly Haven CC0，models/s3/）
    if (!NO_S3) { P.add('s3/side_table_tall_01', [sx * 6.45, Y, -157.25], { h: 0.76, yaw: 0 }); world.box(sx * 6.45, Y + 0.38, -157.25, 0.4, 0.76, 0.4);
    P.add('s3/mantel_clock_01', [sx * 6.45, Y + 0.76, -157.27], { w: 0.34, yaw: 0 }); }
  }
  // ③ 作战室会商长桌北段（桌心 x = k·2.6，z −118…−122；纸堆 z −119.5、地图页 −120.3、台灯 x−0.8 z −121.5）
  for (let k = 0; k < 4; k++) {
    if (k % 2) P.add('s1/book_encyclopedia_set_01', [k * 2.6 + 0.35, Y + 0.79, -121.4], { w: 0.55, yaw: 0 });
    else P.add('s1/binder_notebook', [k * 2.6 + 0.4, Y + 0.79, -121.35], { w: 0.5, yaw: 0.05 });
  }
  // 批次 S3：钢桌冷灰 → 暗铜褐漆（克隆材质，只动钢桌；不改桌面摆件）
  return P.build(zone).then((ms) => { for (const m of ms || []) if (m.name === 'props:s1/metal_office_desk') { m.material = m.material.clone(); m.material.color.setHex(NO_S3 ? 0xffffff : 0x8a6446); m.material.metalness = Math.min(m.material.metalness ?? 0, 0.35); m.material.roughness = Math.max(m.material.roughness ?? 0.5, 0.55); m.material.envMapIntensity = 0.35; } return ms; });
}
