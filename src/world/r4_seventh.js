// 批次 R4-A：第七局中部充实（开源资源复用）
// 资源：public/assets/models/r4a/*（Above the Desk by Wh1tZz，github.com/Wh1tZz/above-the-desk，Tripo 生成，经作者许可使用；
// meshopt + webp 1k）+ 已入库 r2/woodenchair_01、r2/armchair_01、r2/woodentable_02、r2/rotary_telephone、s1/book_encyclopedia_set_01。
// 平面（坐标见 work/r4a/plan.md）：
// ① 作战室：会商长桌（4 拼，x −1.1…8.9，z −118…−122）——M10 散乱朝向的铸铁四爪转椅 13 把 → 长边两侧成排木椅 16 把（面朝桌）；
//    桌面南沿每桌一台打字机 + 转盘电话 / 信札匣（避开纸堆 −119.5、地图页、台灯、S1 活页夹）；K 的桌换维多利亚木扶手椅；
//    北墙东段（x 3.8…8.1，门洞 |x|<2.2 与西门子内线 x 3.4 之外）书柜 ×3 背贴墙；东墙内鬼墙下（z −119.5…−125.8，壁柱 −118.6 之南）矮档案柜 ×6 + 地球仪 / 座钟 + 暖光池。
// ② 回写台：北墙门洞两侧（|x| 1.7…7.1）书柜 ×3+3（z −158.2…−158.9，红线纸条林 z<−160 之外）；
//    环形定稿台外圈 45° 四角（r 6.8）低矮档案车 ×4（高 0.72 m < 纸条最低 0.79 m，不碰红线林）；南墙壁柱间矮柜 ×2 + 浑天仪；暖光池。
// ③ 杀青室：中部两侧（x ±4.8，z −141 / −150.5，书脊架内侧 1.85 m、中轴凳 / 地毯外）钢制办公桌 ×4（S1 同款）+ 木椅（面朝书架侧）+ 台灯 + 打字机 / 茶具 / 信札 / 百科，每台暖光池。
// ④ 回写台「改写之手」：Above the Desk 巨人手（去骨骼静态）从天花垂下，指尖离地 6.45 m，压暗 + 暗暖光。
// 剧情锚点、触发器、传送、zone 判定不动；`?nor4a=1` 关闭（M10 椅子恢复）。
import * as THREE from 'three';
import { Props } from './dress.js';
import { pbr } from '../engine/assets.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const NO_R4A = typeof location !== 'undefined' && /[?&]nor4a=1/.test(location.search);
// R6-C：作战室长桌 16 + 杀青室 4 把 literary_club_chair（细木条、偏秀气）→ Blender 自建 1960–80 年代机关风厚重实木扶手椅 r6c/bureau_armchair
// （宽 0.63 深 0.60 座高 0.46 总高 0.88；5 cm 方腿、0.10 m 宽扶手、暗酒红褐皮革软包 + 暗铜泡钉、矮靠背上下横档、H 形横枨、暗铜包脚；5.2k 三角 251 KB；
// 源脚本 tools/blender/r6c_bureau_armchair.py）。位置 / 朝向不变；扶手顶 0.67 m，椅前沿离桌沿封边 ≈0.3 m，不进长桌腿 / H 枨 / 围裙。`?nor6c=1` 回旧椅。
const NO_R6C = typeof location !== 'undefined' && /[?&]nor6c=1/.test(location.search);
const CHAIR = NO_R6C ? ['r2/literary_club_chair_preview', 1.0] : ['r6c/bureau_armchair', 0.88];

export function buildR4Seventh(zone, world, Y, M10) {
  if (NO_R4A) return Promise.resolve();
  const P = new Props();
  const lamp = (x, y, z, i, d) => { const l = new THREE.PointLight(0xffc890, i, d, 2); l.position.set(x, y, z); l.castShadow = false; zone.add(l); };
  const PI = Math.PI;

  // ① 作战室 ——————————————————————————————
  // 批次 R5-D：会商长桌（4 张 2.2×4 m 黑色台面，depths.js 顶面 Y+0.73…0.79）原本无腿悬空 → 程序几何暗胡桃实木桌体：
  // 每桌 4 条 0.11 m 方腿（内收 0.1 m）+ 0.14 m 高围裙（台面下、内收 0.06 m）+ 两端与中央 H 形横枨 + 台面外沿胡桃封边，腿脚暗铜包脚（粗糙 0.5）。
  // 碰撞仍用 depths.js 原整桌盒 world.box(…, 2.2, 0.8, 4)，椅子在长边外 0.65 m，与腿 / 围裙不相交。
  {
    const walnut = pbr('Wood051', { color: 0x4a2f1f, roughness: 0.62, env: 0.15 }), brass = pbr('Metal046A', { color: 0x7a5a3a, metalness: 0.8, roughness: 0.5, env: 0.3 });
    const gw = [], gb = [];
    const bx = (arr, w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(w, d) / 0.8, uv.getY(i) * Math.max(h, Math.min(w, d)) / 0.8); g.translate(x, y, z); arr.push(g); };
    for (let k = 0; k < 4; k++) {
      const cx = k * 2.6, cz = -120, hw = 1.1, hd = 2.0;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const lx = cx + sx * (hw - 0.155), lz = cz + sz * (hd - 0.155); bx(gw, 0.11, 0.62, 0.11, lx, Y + 0.05 + 0.31, lz); bx(gb, 0.125, 0.05, 0.125, lx, Y + 0.025, lz); }
      for (const sx of [-1, 1]) bx(gw, 0.04, 0.14, 2 * hd - 0.22, cx + sx * (hw - 0.12), Y + 0.66, cz); // 长边围裙
      for (const sz of [-1, 1]) bx(gw, 2 * hw - 0.22, 0.14, 0.04, cx, Y + 0.66, cz + sz * (hd - 0.12)); // 短边围裙
      for (const sx of [-1, 1]) bx(gw, 0.06, 0.08, 2 * hd - 0.42, cx + sx * (hw - 0.155), Y + 0.2, cz); // 两侧纵枨（腿间）
      bx(gw, 2 * hw - 0.42, 0.08, 0.07, cx, Y + 0.2, cz); // 中央横枨（H 形）
      for (const sx of [-1, 1]) bx(gw, 0.05, 0.075, 2 * hd + 0.04, cx + sx * (hw + 0.02), Y + 0.7575, cz); // 台面封边（长边，顶面 Y+0.795）
      for (const sz of [-1, 1]) bx(gw, 2 * hw + 0.09, 0.075, 0.05, cx, Y + 0.7575, cz + sz * (hd + 0.02)); // 封边（短边）
    }
    for (const [arr, mat, nm] of [[gw, walnut, 'r5d_tableWalnut'], [gb, brass, 'r5d_tableBrass']]) { const m = new THREE.Mesh(mergeGeometries(arr, false), mat); m.name = nm; m.castShadow = false; m.receiveShadow = true; zone.add(m); }
  }
  if (M10) M10.chairs.length = 0; // 会商长桌 12 + K 的桌 1 把 M10 转椅由本批接管
  for (let k = 0; k < 4; k++) {
    const x = k * 2.6;
    for (const dx of [-0.5, 0.5]) {
      // R5-D：哥特高背梯形木椅（woodenchair_01 宽/高仅 0.30，h 0.95 时座宽 ≈0.29 m，房间尺度下太细）→ 实木扶手椅 literary_club_chair（宽 ≈0.76、深 ≈0.72），
      // 椅心离桌沿 0.65 m（椅前沿离桌沿 ≈0.29 m，扶手 < 台面底 0.73 m），仍成排面朝桌
      P.add(CHAIR[0], [x + dx, Y, -117.35], { h: CHAIR[1], yaw: PI }); // 南侧，面朝 −z
      P.add(CHAIR[0], [x + dx, Y, -122.65], { h: CHAIR[1], yaw: 0 }); // 北侧，面朝 +z
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

  // 改写之手（Above the Desk giant-hand，去骨骼静态 + 减面）：从天花垂下，x 0 z −176.5（红线林豁口 |x|<2.2 内、天花梁 −175 / −178 之间、
  // 顶光 (0, 8.6, −170)→巨书 光路之外），指尖离地 6.45 m 不挡任何动线；压暗为低存在感，下方暗暖光
  P.add('r4a/giant_hand', [0, Y + 6.45, -176.5], { h: 3.0, yaw: 0 }); // 腕口埋进天花 0.45 m（防天花格心处露出腕截面）
  { const l = new THREE.PointLight(0xffa860, 1.1, 4.5, 2); l.position.set(0, Y + 5.4, -175.6); l.castShadow = false; zone.add(l); }

  // ③ 杀青室 ——————————————————————————————
  for (const sx of [-1, 1]) for (const [j, z] of [[0, -141], [1, -150.5]]) {
    const x = sx * 4.8, face = sx > 0 ? -PI / 2 : PI / 2; // 桌面件正面朝向椅子（室内中轴一侧）
    // 首拍 woodentable_02 实际只有约 0.6 m 宽（小边几）→ 换 S1 同款 1970 年代钢制办公桌（2.0×0.95，同暗铜褐漆），使用侧朝椅子
    P.add('s1/metal_office_desk', [x, Y, z], { w: 2.0, yaw: sx > 0 ? -PI / 2 : PI / 2 }); world.box(x, Y + 0.4, z, 0.95, 0.8, 2.0);
    P.add(CHAIR[0], [sx * 3.8, Y, z], { h: CHAIR[1], yaw: sx > 0 ? PI / 2 : -PI / 2 }); // R5-D：同作战室换实木扶手椅（椅前沿离桌 ≈0.17 m）
    P.add('r4a/desk_lamp', [x + sx * 0.15, Y + 0.79, z - 0.7], { h: 0.45, yaw: face });
    if (j === 0) { P.add('r4a/typewriter', [x, Y + 0.79, z + 0.05], { w: 0.4, yaw: face }); P.add('s1/book_encyclopedia_set_01', [x + sx * 0.2, Y + 0.79, z + 0.7], { w: 0.45, yaw: face }); }
    else { P.add('r4a/tea_service', [x, Y + 0.79, z + 0.1], { w: 0.42, yaw: face }); P.add('r4a/correspondence_set', [x + sx * 0.05, Y + 0.79, z + 0.7], { d: 0.36, yaw: face + PI / 2 }); }
    lamp(x - sx * 0.3, Y + 1.7, z, 1.3, 3.6);
  }

  // R5-D：杀青室北墙（镜子 |x|<0.75 与 S1 钢桌 |x|>4 之间、两幅挂画 x ±2.6 正下方）各一只矮柜背贴护墙，
  // 西：留声机，东：古籍档案摞（Above the Desk）；顶面 ≤1.2 m < 挂画下沿 1.36 m，离 S1 椅（z −156.2，x ±5）> 1 m，不进中轴与镜前锚点盒
  for (const sx of [-1, 1]) {
    const x = sx * 2.6, z = -157.45;
    P.add('r4a/lower_cabinet', [x, Y, z], { w: 1.0, yaw: 0 }); world.box(x, Y + 0.385, z, 1.0, 0.77, 0.48);
    if (sx < 0) P.add('r4a/gramophone', [x + 0.05, Y + 0.77, z + 0.02], { h: 0.42, yaw: 0.35 });
    else P.add('r4a/antique_book_stack', [x - 0.1, Y + 0.77, z + 0.02], { h: 0.36, yaw: -0.15 });
    lamp(x, Y + 1.9, z + 0.9, 0.9, 3.2);
  }

  return P.build(zone).then((ms) => {
    for (const m of ms || []) {
      if (m.name === 'props:s1/metal_office_desk') { m.material = m.material.clone(); m.material.color.setHex(0x8a6446); m.material.metalness = Math.min(m.material.metalness ?? 0, 0.35); m.material.roughness = Math.max(m.material.roughness ?? 0.5, 0.55); m.material.envMapIntensity = 0.35; continue; }
      if (!m.name.startsWith('props:r4a/')) continue;
      m.material = m.material.clone(); m.material.envMapIntensity = Math.min(m.material.envMapIntensity ?? 1, 0.35);
      if (m.name === 'props:r4a/giant_hand') { m.material.color.setHex(0x8a6a58); m.material.roughness = Math.max(m.material.roughness ?? 0.6, 0.7); m.material.envMapIntensity = 0.15; m.castShadow = false; }
      if (m.name === 'props:r4a/desk_globe') m.material.color.setHex(0xd2a46c); // 禁蓝绿：海洋青绿 → 暖褐（乘色）
    }
    return ms;
  });
}
