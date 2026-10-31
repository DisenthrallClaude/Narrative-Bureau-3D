// 东翼（M2）：1F 市民服务与污染举报窗口、叙事高考报名大厅；2F 全国现实稳定度监测指挥中心、阅卷中心；3F 禁区封锁调度厅、副本投放调度室；东侧楼梯井
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { placeModel, loadModel } from '../engine/assets.js';
import { mats } from './mats.js';
import { Frame, archRingGeo, archShape, emblem, goldText } from './gothic.js';
import { CanvasScreen, lightShaft, dust } from '../engine/fx.js';
import { content } from '../engine/content.js';
import { FLOOR, T } from './exterior.js';
import { R3, EXAM_R3 } from './r3plan.js';
import { wallX, wallZ, archPortal, rectLight, spot, point, person, signMaterial, brassPlaqueMaterial, brassPlateMaterial, posterMaterial, woodChair, slabWithHole } from './interiors.js';

const Y = FLOOR, F2 = Y + 7, F3 = Y + 14;
const X0 = 20, X1 = 56, XS = 50; // 房间 x 20…50，楼梯井列 x 50…56
const ZA = -32, ZM = -53, ZB = -76; // 北/南分界
const WELL = { x0: 50, x1: 56, z0: -54, z1: -64 };

export function buildEastWing(scene, world, ctx) {
  const M = mats();
  const zone = new THREE.Group(); zone.name = 'east_wing'; scene.add(zone);
  ctx.zones.east_wing = zone;
  const b = new Batch();
  const jobs = [];
  const add = (p) => { jobs.push(p.then((o) => { zone.add(o); return o; })); return p; };
  ctx.anchors = ctx.anchors ?? {}; ctx.slots = ctx.slots ?? {};
  const slot = (area, pos, yaw, w = 0.9, h = 1.2) => (ctx.slots[area] = ctx.slots[area] ?? []).push({ pos, yaw, w, h });

  // —— 安检大厅东门洞 → 连廊 ——
  b.box('terrazzo', 2.8, 0.1, 6, [18.6, Y - 0.05, -48], { uv: 0.8, collide: true });
  b.box('wallStone', 2.8, 0.4, 6.6, [18.6, Y + 6.2, -48], { uv: 0.3 });
  for (const ez of [-1, 1]) b.box('wallStone', 2.8, 6.4, 0.4, [18.6, Y + 3.2, -48 + ez * 3.2], { uv: 0.3, collide: true });
  // —— 楼板与外墙 ——
  slabWithHole(b, 'blackMarble', X0, X1, ZA, ZB, Y - 0.1, 0.1, { x0: 0, x1: 0, z0: 0, z1: 0 }, true);
  for (const fy of [F2, F3]) slabWithHole(b, 'carpet', X0, X1, ZA, ZB, fy - 0.3, 0.3, WELL, true);
  b.box('wallPlaster', X1 - X0, 0.3, ZA - ZB, [(X0 + X1) / 2, Y + 21.2, (ZA + ZB) / 2], { uv: 0.25 });
  wallX(b, 'panelWall', X0 - 0.2, ZA, ZB, Y, 21, 0.4, [{ z0: -45, z1: -51, h: 6 }], true);
  wallX(b, 'panelWall', X1 + 0.2, ZA, ZB, Y, 21, 0.4, [], true);
  wallZ(b, 'panelWall', ZA + 0.2, X0, X1, Y, 21, 0.4, [], true);
  wallZ(b, 'panelWall', ZB - 0.2, X0, X1, Y, 21, 0.4, [{ x0: 24.4, x1: 27.8, h: 3.6 }], true); // M5：北墙开门 → 东廊（通往食堂）
  // 楼层间分隔墙（南北两区）：每层 z = -53 / -61（2F/3F 南区从 -62 开始）
  wallZ(b, 'panelWall', ZM, X0, XS, Y, 7, 0.3, [{ x0: 31, x1: 35, h: 3.2 }], true);
  wallZ(b, 'wallPlaster', -61, X0, XS, F2, 7, 0.3, [{ x0: 40, x1: 43, h: 3 }], true);
  wallZ(b, 'wallPlaster', -61, X0, XS, F3, 7.2, 0.3, [{ x0: 40, x1: 43, h: 3 }], true);
  // 楼梯井列与房间之间的墙（2F/3F），留门
  for (const fy of [F2, F3]) wallX(b, 'wallPlaster', XS, ZA, WELL.z0, fy, fy === F3 ? 7.2 : 7, 0.3, [{ z0: -44, z1: -47.5, h: 3 }], true);
  // —— 室内饰面：护墙板 + 金线 + 壁柱 + 檐口 + 藻井天花（每层每区）——
  const rooms = [
    [Y, 6.7, ZA, ZM, 'wood'], [Y, 6.7, ZM, ZB, 'wood'],
    [F2, 6.7, ZA, -61, 'blackMetal'], [F2, 6.7, -61, ZB, 'wood'],
    [F3, 7.1, ZA, -61, 'wood'], [F3, 7.1, -61, ZB, 'blackMetal'],
  ];
  for (const [fy, h, za, zb, panel] of rooms) {
    const xe = fy === Y && za === ZM ? XS : XS; // 楼梯井列另算
    const zc = (za + zb) / 2, L = za - zb, W = xe - X0;
    // 东西墙护墙板（西墙 1F 留门洞）
    for (const [x, sgn] of [[X0 + 0.24, 1], [X1 - 0.03, -1]]) {
      const segs = (x < 30 && fy === Y && za === ZA) ? [[za, -44.6], [-51.4, zb]] : [[za, zb]];
      if (x > 30 && fy !== Y) continue; // 2F/3F 东侧是楼梯井隔墙
      for (const [a, c] of segs) { if (a - c < 0.3) continue; b.box(panel, 0.06, 1.15, a - c, [x + sgn * 0.03, fy + 0.575, (a + c) / 2], { uv: 0.6 }); b.box('gold', 0.08, 0.04, a - c, [x + sgn * 0.05, fy + 1.17, (a + c) / 2], { uv: 1 }); b.box('stoneDark', 0.1, 0.12, a - c, [x + sgn * 0.05, fy + 0.06, (a + c) / 2], { uv: 1 }); }
      for (let z = za - 4.3; z > zb + 1; z -= 8.6) if (!(x < 30 && fy === Y && z < -44 && z > -52)) { b.box('stoneDark', 0.22, h, 0.6, [x + sgn * 0.11, fy + h / 2, z], { uv: 0.4 }); b.box('gold', 0.24, 0.05, 0.64, [x + sgn * 0.12, fy + h - 0.6, z], { uv: 1 }); }
    }
    // 南北墙护墙板
    for (const [z, sgn] of [[za - 0.36, -1], [zb + 0.36, 1]]) { b.box(panel, W, 1.15, 0.06, [(X0 + xe) / 2, fy + 0.575, z], { uv: 0.6 }); b.box('gold', W, 0.04, 0.08, [(X0 + xe) / 2, fy + 1.17, z + sgn * 0.02], { uv: 1 }); }
    // 檐口
    for (const [z] of [[za - 0.4], [zb + 0.4]]) b.box('stoneDark', W, 0.35, 0.3, [(X0 + xe) / 2, fy + h - 0.18, z], { uv: 0.5 });
    b.box('stoneDark', 0.3, 0.35, L, [X0 + 0.35, fy + h - 0.18, zc], { uv: 0.5 });
    // 藻井天花：深色天花板 + 金色井格
    b.box('vault', W, 0.04, L, [(X0 + xe) / 2, fy + h - 0.02, zc], { uv: 0.3 });
    for (let x = X0 + 3; x < xe - 1; x += 3) b.box('gold', 0.06, 0.12, L - 0.8, [x, fy + h - 0.1, zc], { uv: 1 });
    for (let z = za - 3; z > zb + 1; z -= 3) b.box('stoneDark', W - 0.6, 0.2, 0.18, [(X0 + xe) / 2, fy + h - 0.12, z], { uv: 0.5 });
  }
  // 窗（外墙内侧发光）
  for (const fy of [Y, F2, F3]) for (let k = 0; k < 5; k++) {
    const z = -36 - k * 8.6;
    if (fy === F3 && R3.zone_control) { // 批次18：3F 哥特彩窗（zone_r3_b 里与 70 年代管控室冲突）→ 钢框磨砂窗：磨砂玻璃 + 4×3 钢棂 + 水泥窗台
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshStandardMaterial({ color: 0x8a918d, emissive: 0xc8d0cc, emissiveIntensity: 0.32, roughness: 0.5 })); gl.position.set(X1 - 0.03, fy + 2.4, z); gl.rotation.y = -Math.PI / 2; zone.add(gl);
      for (const dz of [-0.82, -0.41, 0, 0.41, 0.82]) b.box('blackMetal', 0.06, 2.68, dz === -0.82 || dz === 0.82 ? 0.08 : 0.035, [X1 - 0.05, fy + 2.4, z + dz], { uv: 1 });
      for (const dy of [-1.32, -0.65, 0, 0.65, 1.32]) b.box('blackMetal', 0.06, Math.abs(dy) > 1.3 ? 0.08 : 0.035, 1.72, [X1 - 0.05, fy + 2.4 + dy, z], { uv: 1 });
      b.box('stoneDark', 0.22, 0.08, 1.9, [X1 - 0.11, fy + 1.06, z], { uv: 0.5 });
      if (k === 1) point(zone, 0xfff0dc, 6, [53, fy + 2.9, -45.75], 9); // 东门后楼梯间吸顶灯（门洞不再是纯黑）
      continue; }
    const f = new Frame([X1 - 0.01, fy, z], -Math.PI / 2);
    b.add('glassIn', new THREE.ShapeGeometry(archShape(1.6, 2.6)), f.at(0, 2.0, 0), { uv: false });
    b.add('gold', archRingGeo(1.8, 2.6, 1.6, 2.6, 0.2), f.at(0, 2.0, 0.05), { uv: 1 });
  }
  // —— 楼梯（双跑，1F→2F→3F）——
  const flight = (x0, x1, za, ya, zb, yb) => {
    const n = 20, run = (za - zb) / n, rise = (yb - ya) / n;
    for (let i = 0; i < n; i++) b.box('blackMarble', x1 - x0, Math.abs(rise) + 0.05, Math.abs(run) + 0.02, [(x0 + x1) / 2, ya + rise * (i + 0.5), za - run * (i + 0.5)], { uv: 0.6 });
    world.ramp([(x0 + x1) / 2, ya, za + Math.sign(run) * 0.15], [(x0 + x1) / 2, yb, zb - Math.sign(run) * 0.15], x1 - x0 - 0.1);
    b.add('brass', new THREE.BoxGeometry(0.05, 0.05, Math.hypot(za - zb, yb - ya)), { pos: [x0 + 0.05, (ya + yb) / 2 + 0.95, (za + zb) / 2], rot: [Math.atan2(yb - ya, za - zb) * (zb < za ? 1 : -1), 0, 0] }, { uv: 1 });
  };
  for (const [ya, yb] of [[Y, F2], [F2, F3]]) {
    const ym = (ya + yb) / 2;
    flight(50.2, 52.9, WELL.z0, ya, -62.4, ym);
    b.box('blackMarble', 5.8, 0.2, 1.6, [53, ym - 0.1, -63.2], { uv: 0.5, collide: true });
    flight(53.1, 55.8, -62.4, ym, WELL.z0, yb);
    // 中间隔墙
    b.box('wallStone', 0.2, yb - ya + 1, 8.4, [53, (ya + yb) / 2, -58.2], { uv: 0.4, collide: true });
  }
  b.box('blackMarble', 6, 0.2, 1, [53, F3 - 0.1, -53.5], { uv: 0.5, collide: true });
  const sg = goldText('东翼楼梯　2F 指挥中心 · 阅卷　3F 禁区调度 · 投放调度', 6.4, 0.32, M.goldBright, { res: 96 }); sg.position.set(XS - 0.17, Y + 3.8, -55); sg.rotation.y = -Math.PI / 2; zone.add(sg);
  // 1F：楼梯井与考务大厅之间的栏杆（井西侧）
  b.box('iron', 0.06, 1.0, 10, [XS - 0.05, Y + 0.5, -59], { uv: 1 }); world.box(XS - 0.05, Y + 0.5, -60, 0.1, 1, 8);

  // ================= 1F 市民服务 =================
  T('east start');
  const csz = (ZA + ZM) / 2;
  // 服务窗口（北侧分隔墙前，面向南）
  ctx.citWindows = [];
  const labels = ['1 号　污染举报', '2 号　畸变物上交', '3 号　叙事者备案', '4 号　归档人员查询', '5 号　加试报名咨询'];
  for (let k = 0; k < 5; k++) {
    const x = 23.5 + k * 5.4, z = ZM + 1.6;
    if (R3.citizen_service) { // 批次37：台体 / 台面 / 铜框由 r3plan 的 Blender 精建 r2/service_window 出，这里只留平玻璃 + 碰撞 + 编号铜牌 + 叫号小灯
      world.box(x, Y + 0.525, z, 4.6, 1.05, 1.0);
      b.box('glassClear', 4.36, 1.56, 0.02, [x, Y + 1.95, z - 0.1], { uv: false });
      const np = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.1), brassPlateMaterial(`${k + 1} 号 窗 口`, '', 0.54, 0.1)); np.position.set(x, Y + 2.9, z - 0.1 + 0.084); zone.add(np);
      for (const dx of [-1.9, 1.9]) { const on = dx < 0 ? (k % 2 === 0) : (k % 2 === 1); const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), new THREE.MeshStandardMaterial({ color: 0x100804, emissive: dx < 0 ? 0x3aff6a : 0xff3a24, emissiveIntensity: on ? 1.6 : 0.12 })); cl.position.set(x + dx, Y + 2.9, z - 0.1 + 0.122); zone.add(cl); }
    } else {
    b.box('blackMarble', 4.6, 1.05, 1.0, [x, Y + 0.525, z], { uv: 0.5, collide: true });
    b.box('onyx', 4.8, 0.06, 1.2, [x, Y + 1.08, z], { uv: 0.5 });
    b.box('glassClear', 4.4, 1.6, 0.04, [x, Y + 1.95, z - 0.1], { uv: false });
    b.box('gold', 4.6, 0.05, 0.06, [x, Y + 2.78, z - 0.1], { uv: 1 });
    }
    b.box('wallPlaster', 4.8, 4.5, 0.2, [x, Y + 2.25, ZM + 0.4], { uv: 0.4 });
    const led = new CanvasScreen(512, 96, (c, t, W, H) => { c.fillStyle = '#04070e'; c.fillRect(0, 0, W, H); c.fillStyle = k === 3 ? '#ffb85a' : '#ff5a3a'; c.font = '700 54px "NB Sans", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(labels[k], W / 2, H / 2 + 3); }, { fps: 0.2, intensity: 1.6 });
    ctx.screens.push(led);
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.6), led.mat); lm.position.set(x, Y + 3.3, ZM + 0.52); zone.add(lm);
    b.box('blackMetal', 3.3, 0.7, 0.1, [x, Y + 3.3, ZM + 0.45], { uv: 1 });
    const clerk = person(M, { coat: 0x1a2030, clue: 'chair' }); clerk.position.set(x, Y, ZM + 0.9); clerk.rotation.y = 0; zone.add(clerk);
    ctx.citWindows.push({ x, z, led: lm });
  }
  ctx.anchors.doc_cit_windows = ctx.citWindows[2].led;
  // 2 号窗：钢制畸变物投放口
  // 批次37：原 0.9 宽、中心 x 31.5 与 2 号窗台（x 26.6–31.2、台面到 31.25）交叠约 0.15 m → 收窄到 0.62 m、居窗间缝中心 x 31.6（31.29–31.91，3 号窗台面从 31.95 起）
  const DX = 31.6;
  b.box('steel', 0.62, 0.6, 0.5, [DX, Y + 0.9, ZM + 1.4], { uv: 1, collide: true });
  b.box('blackMetal', 0.5, 0.12, 0.06, [DX, Y + 1.0, ZM + 1.12], { uv: 1 });
  const hand = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45), brassPlaqueMaterial('畸变物投放口', ['请勿徒手投放', '投放后请勿回头']));
  hand.position.set(DX, Y + 1.6, ZM + 1.16); zone.add(hand); ctx.anchors.doc_cit_handover = hand;
  ctx.anchors.int_cit_drawer = { box: [DX, Y + 0.9, ZM + 1.4, 0.8, 0.7, 0.7] };
  // 4 号窗公告 + 附表七
  const w4 = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.6), signMaterial('公告', ['归档人员无法被查询', '若您仍来到本窗口', '请填写附表七'], 420, 600));
  w4.position.set(23.5 + 3 * 5.4 + 1.2, Y + 1.8, ZM + 1.52); zone.add(w4); ctx.anchors.doc_cit_window4 = w4;
  const f7 = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.003, 0.3), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.8 })); f7.position.set(23.5 + 3 * 5.4 - 0.8, Y + 1.115, ZM + 1.9); zone.add(f7); ctx.anchors.doc_cit_form7 = f7;
  // 批次54：游戏内 Wood051 调色版读成浅橡木 → 胡桃木材质整体压深偏冷（setRGB 幂等，两张填单台共享材质不会重复压暗）
  const walnutTone = (o) => { o?.traverse?.((m) => { if (!m.isMesh) return; for (const mt of [].concat(m.material)) if (mt && /^(fd|qm)_walnut/.test(mt.name)) mt.color.setRGB(0.22, 0.205, 0.27); }); /* 批次55：0.52/0.42/0.36 读成中深偏橙 → 压成深胡桃偏冷（目标 #4a3022 一带，B 相对抬高防偏橙） */ return o; };
  // 叫号机
  if (R3.citizen_service) { // 批次52：方盒 + 蓝发光片 → Blender 精建 r2/cs_queue_machine（胡桃木柜身（批次54 去墨绿） + 铜壳三位七段码显示头 + 取号铜按钮 / 出票口，tools/blender/cs_queue_machine.py），正面朝 −Z
    add(placeModel('r2/cs_queue_machine', { height: 1.4, pos: [22, Y, ZA - 3], rotY: Math.PI }).then((o) => { world.boundsOf(o, 0.95); return walnutTone(o); }));
  } else {
  b.box('blackMetal', 0.5, 1.4, 0.4, [22, Y + 0.7, ZA - 3], { uv: 1, collide: true });
  const qn = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshStandardMaterial({ color: 0, emissive: 0x3a8cff, emissiveIntensity: 1.2 })); qn.position.set(22, Y + 1.2, ZA - 3 - 0.21); qn.rotation.y = Math.PI; zone.add(qn); }
  // 填单台（中央）
  // 批次52：R3 下 wood 方盒 + onyx 板 → Blender 精建 r2/cs_form_desk（双面胡桃木斜面填单台 + 铜框玻璃压板下表格样张 + 端头铜笔架，tools/blender/cs_form_desk.py）；中央平带 y 1.055 承接剧情表格锚点
  for (const x of [30, 40]) { if (R3.citizen_service) { add(placeModel('r2/cs_form_desk', { width: 3.4, pos: [x, Y, ZA - 7] }).then(walnutTone)); world.box(x, Y + 0.5, ZA - 7, 3.3, 1.0, 1.3); continue; } b.box('wood', 3.2, 1.0, 1.2, [x, Y + 0.5, ZA - 7], { uv: 0.6, collide: true }); b.box('onyx', 3.4, 0.06, 1.4, [x, Y + 1.03, ZA - 7], { uv: 0.5 }); }
  const rf = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.003, 0.3), new THREE.MeshStandardMaterial({ color: 0xf6f2e8, roughness: 0.8 })); rf.position.set(30, Y + 1.065, ZA - 7); rf.rotation.y = 0.2; zone.add(rf); ctx.anchors.doc_cit_report_form = rf;
  // 排队座椅（三排）
  for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) add(placeModel('street_seating', { width: 3.7, pos: [27 + k * 10, Y, ZA - 11 - r * 2.4], rotY: Math.PI }).then((o) => { world.boundsOf(o, 0.85); return o; }));
  // 排队市民
  // 批次12 收尾：改为 1/3/4 号窗台前各一位正在办理（站两只圆凳之间），3 号窗一米线处一位等候（站在线内侧，不占窗口前主通道）（cs_top 看候号座椅间站人像「在长椅间罚站」）。批次12：4 位排队市民原本站在候号长椅里（x 25/29/35/39 正落在长椅端部，穿模）→ R3 下同一 x、退到相邻两排长椅之间的过道（z 各 −1.2 m），面向窗口不变
  const citizens = R3.citizen_service ? [[23.5, -50.2, 0x3a3020], [34.3, -50.2, 0x22324a], [39.7, -50.2, 0x4a2a2a], [34.3, -49.68, 0x2a3a2a]] : [[25, ZA - 11, 0x3a3020], [29, ZA - 13.4, 0x22324a], [39, ZA - 11, 0x4a2a2a], [35, ZA - 13.4, 0x2a3a2a]];
  for (const [x, z, c] of citizens) { const p = person(M, { coat: c }); p.position.set(x, Y, z); p.rotation.y = Math.PI; p.scale.y = 0.96; zone.add(p); }
  // 电饭锅大妈
  const auntie = person(M, { coat: 0x6a3a4a }); auntie.position.set(33, Y, ZA - 13.4); auntie.rotation.y = Math.PI; zone.add(auntie);
  const cooker = new THREE.Group(); const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.22, 20), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.3 })); cooker.add(ck); const lid = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.3 })); lid.position.y = 0.1; lid.scale.y = 0.4; cooker.add(lid);
  const ckLed = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff4020, emissiveIntensity: 2 })); ckLed.position.set(0, 0, -0.17); ckLed.rotation.y = Math.PI; cooker.add(ckLed);
  cooker.position.set(33, Y + 1.05, ZA - 13.7); zone.add(cooker);
  ctx.anchors.int_cit_ricecooker = { box: [33, Y + 1.0, ZA - 13.4, 0.9, 2, 0.9] };
  // 东墙「群众来信摘录」
  const lt = content.tex('tex_cit_letters');
  const lw = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), lt ? new THREE.MeshStandardMaterial({ map: lt, roughness: 0.7 }) : lettersMaterial());
  lw.position.set(X1 - 0.05 - 5.8, Y + 2.4, ZA - 0.25); lw.rotation.y = Math.PI; zone.add(lw); ctx.anchors.doc_cit_letters = lw;
  b.box('wood', 9.4, 3.8, 0.12, [X1 - 5.8, Y + 2.4, ZA - 0.12], { uv: 0.5 });
  // 批次12：R3 市民服务大厅改铺哑光大理石 + 铜嵌条（r3plan），原金线网格只保留南区（考务大厅）段；穿过候号座椅的 5 道导引线关闭
  for (let x = X0 + 4; x < XS; x += 4) { if (R3.citizen_service) b.box('gold', 0.05, 0.01, ZM - ZB, [x, Y + 0.004, (ZM + ZB) / 2], { uv: 1 }); else b.box('gold', 0.05, 0.01, ZA - ZB, [x, Y + 0.004, (ZA + ZB) / 2], { uv: 1 }); }
  for (let z = ZA - 4; z > ZB; z -= 4) if (!R3.citizen_service || z < ZM) b.box('gold', XS - X0, 0.01, 0.05, [(X0 + XS) / 2, Y + 0.004, z], { uv: 1 });
  // 地面导引
  if (!R3.citizen_service) for (let k = 0; k < 5; k++) b.box('gold', 0.08, 0.012, 14, [23.5 + k * 5.4, Y + 0.005, ZA - 11], { uv: 1 });
  const csTitle = goldText('市民服务大厅　·　污染举报', 6, 0.5, M.goldBright, { res: 192 }); csTitle.position.set(X0 + 0.3, Y + 4.4, -40.3); // 批次13：原在西门洞（z −45…−51）正上方、背后是连廊黑洞且被门垛切断 → 移到西墙实墙段（壁柱 −36.3 与门垛 −44.6 之间） csTitle.rotation.y = Math.PI / 2; zone.add(csTitle);
  // 灯
  for (const x of [26, 36, 46]) { point(zone, 0xfff0d8, 14, [x, Y + 5.8, csz], 14); b.box('lampWarm', 4, 0.06, 0.5, [x, F2 - 0.37, csz], { uv: false }); }
  rectLight(zone, 0xfff2e0, 1.4, 28, 16, [35, F2 - 0.4, csz], [35, Y, csz]);

  // ================= 1F 叙事高考报名大厅 =================
  const exz = (ZM + ZB) / 2;
  const ef = content.tex('tex_exam_flow');
  const efm = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.2), ef ? new THREE.MeshStandardMaterial({ map: ef, emissive: 0xffffff, emissiveMap: ef, emissiveIntensity: 0.3 }) : posterMaterial('加试报名', '2027 全国叙事高考'));
  efm.position.set(33, Y + 1.5, ZM - 1.2); efm.rotation.y = 0.3; zone.add(efm); ctx.anchors.doc_exam_flow = efm;
  b.box('blackMetal', 1.4, 2.4, 0.06, [33, Y + 1.5, ZM - 1.24], { uv: 1, rot: [0, 0.3, 0] });
  // 自助报名机 ×8（第 7 台可用）
  ctx.examKiosks = [];
  for (let k = 0; k < 8; k++) {
    const x = 22.5 + k * 3.3, z = ZB + 1.2;
    b.box('blackMetal', 0.7, 1.6, 0.5, [x, Y + 0.8, z], { uv: 1, collide: true });
    b.box('gold', 0.72, 0.04, 0.52, [x, Y + 1.62, z], { uv: 1 });
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.42), new THREE.MeshStandardMaterial({ color: 0, emissive: k === 6 ? 0x5ac8ff : 0x2a5a8a, emissiveIntensity: 1.3 }));
    sc.position.set(x, Y + 1.3, z + 0.26); sc.rotation.x = -0.25; zone.add(sc);
    const num = goldText(`${k + 1}`, 0.2, 0.2, M.goldBright, { res: 64 }); num.position.set(x, Y + 1.75, z + 0.26); zone.add(num);
    ctx.examKiosks.push(sc);
  }
  ctx.anchors.int_exam_kiosk = ctx.examKiosks[6];
  // 觉醒授勋照片墙（西墙）
  for (let k = 0; k < 6; k++) { const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), photoMaterial(k)); pm.position.set(X0 + 0.25, Y + 2.2 + (k % 2) * 1.3, -58 - Math.floor(k / 2) * 3.4); pm.rotation.y = Math.PI / 2; zone.add(pm); b.box('gold', 0.04, 1.08, 1.48, [X0 + 0.22, Y + 2.2 + (k % 2) * 1.3, -58 - Math.floor(k / 2) * 3.4], { uv: 1 }); }
  const exTitle = goldText('叙事高考考务中心　报名大厅', 6, 0.5, M.goldBright, { res: 128 }); exTitle.position.set(35, Y + 5.6, ZB + 0.25); zone.add(exTitle);
  for (const x of [26, 38]) point(zone, 0xe8f0ff, 14, [x, Y + 5.8, exz], 14);
  rectLight(zone, 0xe8f0ff, 1.4, 28, 18, [35, F2 - 0.4, exz], [35, Y, exz]);
  // 考场照片（N26）
  const ph = content.tex('tex_ref_N26'); if (ph) { const pm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ map: ph, roughness: 0.6 })); pm.position.set(X0 + 0.25, Y + 2.8, -71); pm.rotation.y = Math.PI / 2; zone.add(pm); }

  // ================= 2F 监测指挥中心 =================
  const ccz0 = ZA, ccz1 = -61, ccz = (ccz0 + ccz1) / 2;
  // 阶梯式席位（向北升高）
  const ccSeats = []; // 批次34：24 台 r2/cc_console 按席位实例化（按材质 10 个 InstancedMesh）
  queueMicrotask(() => loadModel('r2/cc_console').then((src) => { src.updateMatrixWorld(true); const m4 = new THREE.Matrix4();
    src.traverse((o) => { if (!o.isMesh || !ccSeats.length) return; const geo = o.geometry.clone().applyMatrix4(o.matrixWorld); const mn = (o.material?.name || '').replace(/\.\d+$/, '');
      const mat = (mn.startsWith('cc_lamp') ? Object.assign(o.material, { emissive: o.material.color.clone(), emissiveIntensity: 1.4 }) : o.material);
      const im = new THREE.InstancedMesh(geo, mat, ccSeats.length); ccSeats.forEach(([x, y, z], i) => { m4.makeTranslation(x, y, z); im.setMatrixAt(i, m4); });
      im.computeBoundingSphere(); im.userData.noCull = true; im.castShadow = mn === 'cc_walnut' || mn === 'cc_steel' || mn === 'cc_bakelite'; im.receiveShadow = true; zone.add(im); }); }).catch((e) => console.warn('[NB] cc_console', e)));
  for (let r = 0; r < 4; r++) {
    const z = ccz0 - 9 - r * 3.6, h = r * 0.45;
    if (h > 0) { b.box('carpet', XS - X0, h, 3.6, [(X0 + XS) / 2, F2 + h / 2, z], { uv: 0.4, collide: true }); b.box('gold', XS - X0, 0.04, 0.04, [(X0 + XS) / 2, F2 + h, z + 1.8], { uv: 1 }); }
    for (let k = 0; k < 6; k++) {
      const x = X0 + 3 + k * 4.6;
      // 批次34：黑方板台面 + 两块黑侧板 + 黑盒显示器 → Blender 精建 r2/cc_console（tools/blender/cc_console.py：胡桃木台面 + 绿呢垫 + 灰绿钢抽屉柜铜拉手 + 斜面仪表条 + 三台 CRT 外壳），见下方 InstancedMesh
      ccSeats.push([x, F2 + h, z + 0.6]);
      world.box(x, F2 + h + 0.4, z + 0.6, 3.6, 0.8, 1.0);
      for (let m = -1; m <= 1; m++) { const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.46), consoleMaterial((r * 6 + k) * 3 + m + 1)); scr.position.set(x + m * 0.95 - Math.sin(-m * 0.25) * 0.004, F2 + h + 1.12, z + 0.921); scr.rotation.y = -m * 0.25 + Math.PI; zone.add(scr); }
      add(placeModel('office_chair', { height: 1.0, pos: [x, F2 + h, z - 0.2], rotY: Math.PI }));
    }
  }
  // 巨幅弧形主屏（南墙）
  const cmd = new CanvasScreen(2048, 640, (c, t, W, H) => drawCmdScreen(c, t, W, H), { fps: 1, intensity: 1.4 }); ctx.screens.push(cmd);
  const arcGeo = new THREE.CylinderGeometry(22, 22, 6, 48, 1, true, Math.PI - 0.62, 1.24); arcGeo.scale(-1, 1, 1);
  const arc = new THREE.Mesh(arcGeo, cmd.mat); arc.position.set(35, F2 + 3.6, ccz0 + 21.2 - 0.6 - 21.2 + 21.2 - 21.2 + 0); zone.add(arc);
  arc.position.set(35, F2 + 3.6, ZA - 1.2 + 22 - 22); arc.position.z = ZA + 20.4; arc.rotation.y = Math.PI;
  ctx.anchors.doc_cmd_main_screen = arc;
  b.box('blackMetal', XS - X0, 0.5, 0.6, [(X0 + XS) / 2, F2 + 6.85, ZA - 1.0], { uv: 0.5 });
  // 中央全息文字地球
  const globe = textGlobe(); globe.position.set(35, F2 + 3.2, ccz0 - 6); zone.add(globe); ctx.textGlobe = globe;
  b.add('blackMarble', new THREE.CylinderGeometry(1.2, 1.4, 0.6, 32), { pos: [35, F2 + 0.3, ccz0 - 6] }, { uv: 0.5, collide: true });
  b.add('gold', new THREE.TorusGeometry(1.3, 0.04, 6, 48), { pos: [35, F2 + 0.6, ccz0 - 6], rot: [Math.PI / 2, 0, 0] }, { uv: 1 });
  ctx.anchors.int_cmd_globe = { box: [35, F2 + 2, ccz0 - 6, 2.8, 4, 2.8] };
  // 值班长台（后排中央）+ 红色预警按钮 + 打印机长条
  const dz = ccz1 + 2.4, dh = 4 * 0.45;
  b.box('carpet', XS - X0, dh, 4.6, [(X0 + XS) / 2, F2 + dh / 2, ccz1 + 2.3], { uv: 0.4, collide: true });
  // 批次35：wood 方盒 6×1.0×1.2 → Blender 精建 r2/cc_duty_desk（tools/blender/cc_duty_desk.py：胡桃木三联凸起芯板 + 铜包边 / 铜踢脚 + 操作员侧抽屉柜 + 容膝洞；台上电话交换机斜面插孔板 + 两部胶木话机 + 绿罩台灯），碰撞盒不变
  world.box(35, F2 + dh + 0.5, dz, 6, 1.0, 1.2);
  queueMicrotask(() => loadModel('r2/cc_duty_desk').then((src) => { src.position.set(35, F2 + dh, dz); src.traverse((o) => { if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true; const mn = (o.material?.name || ''); if (/dd_lamp/.test(mn)) Object.assign(o.material, { emissive: o.material.color.clone(), emissiveIntensity: mn === 'dd_lampG' ? 0.35 : 1.4 }); }); zone.add(src); }).catch((e) => console.warn('[NB] cc_duty_desk', e)));
  b.box('onyx', 6.2, 0.06, 1.4, [35, F2 + dh + 1.03, dz], { uv: 0.5 });
  const btnBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 24), M.blackMetal); btnBase.position.set(36.8, F2 + dh + 1.09, dz); zone.add(btnBase);
  const btn = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8a0a0a, emissive: 0xff1a1a, emissiveIntensity: 1.2 })); btn.position.set(36.8, F2 + dh + 1.11, dz); zone.add(btn);
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.3), M.glassClear); cover.position.set(36.8, F2 + dh + 1.16, dz); zone.add(cover); ctx.anchors.doc_cmd_alert_flow = cover;
  const ledger = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.46), M.leather); ledger.position.set(34.6, F2 + dh + 1.075, dz); zone.add(ledger); ctx.anchors.doc_cmd_handover = ledger;
  // 批次35：台上 paintedSteel 方块 0.6×0.3×0.45 → 并入 cc_duty_desk 的电话交换机（x 33）
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 1.9), stripMaterial()); strip.position.set(33, F2 + dh + 0.2, dz + 0.62); strip.rotation.x = -0.15; zone.add(strip); ctx.anchors.doc_cmd_log_strip = strip;
  const zw = person(M, { coat: 0x101622, clue: 'chair', name: '周闻', flipDossier: true }); zw.position.set(35, F2 + dh, dz - 1.0); zw.rotation.y = 0; zone.add(zw); point(zone, 0xffe2b8, 2.2, [35.3, F2 + dh + 1.25, dz - 0.55], 2.6); /* 批次18：周闻空椅补光（id_zhouwen 证件卡太暗） */ // 空椅面朝值班长台/主屏（+Z），原 PI 是旧人形朝向。批次16：原 zone.add 被吞进行尾注释 → 周闻空椅从未加入场景（id_zhouwen 一直拍不到的根因）
  ctx.anchors.int_cmd_zhouwen = { box: [35, F2 + dh + 1.0, dz - 1.0, 1.2, 2, 1.2] };
  // 世界钟
  const clocks = [['京城', 0], ['阿尔卑斯 · 灰塔', -7], ['华盛顿', -13], ['雾港', -8]];
  clocks.forEach(([n, off], i) => { const cs = new CanvasScreen(256, 300, (c) => drawWorldClock(c, n, off), { fps: 0.5, intensity: 1.0 }); ctx.screens.push(cs); const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.17), cs.mat); m.position.set(X0 + 0.25, F2 + 4.2, -38 - i * 2.4); m.rotation.y = Math.PI / 2; zone.add(m); });
  const ccTitle = goldText('全国现实稳定度监测指挥中心', 6, 0.5, M.goldBright, { res: 128 }); ccTitle.position.set(35, F2 + 6.4, ccz1 + 0.2); zone.add(ccTitle);
  // 灯光（冷蓝）
  // 批次35 灯光分层：主屏冷色补光（rectLight 1.6 + 主屏前一盏冷点光）+ 席位上空两盏铜吊灯暖光 + 值班平台两盏暖色筒灯；不再三盏同色冷蓝
  rectLight(zone, 0x9ec2ff, 1.6, 18, 5, [35, F2 + 3.6, ZA - 1.4], [35, F2 + 1, ZA - 10]);
  point(zone, 0xbcd4ff, 7, [35, F2 + 5, ccz0 - 5], 13);
  for (const x of [28.1, 41.9]) { point(zone, 0xffc58a, 9, [x, F2 + 4.6, ccz - 1.8], 12); const pz = ccz - 1.8;
    b.box('brass', 0.03, F3 - 0.5 - (F2 + 5.05), 0.03, [x, (F3 - 0.5 + F2 + 5.05) / 2, pz], { uv: 1 });
    b.add('brass', new THREE.CylinderGeometry(0.16, 0.55, 0.32, 24, 1, true), { pos: [x, F2 + 4.9, pz] }, { uv: 1 });
    b.add('lampWarm', new THREE.CircleGeometry(0.5, 24), { pos: [x, F2 + 4.75, pz], rot: [Math.PI / 2, 0, 0] }, { uv: false }); }
  for (const x of [32.4, 37.6]) { point(zone, 0xffd6a0, 4, [x, F2 + dh + 3.4, dz + 0.2], 6); b.add('lampWarm', new THREE.CircleGeometry(0.12, 20), { pos: [x, F3 - 0.51, dz + 0.2], rot: [Math.PI / 2, 0, 0] }, { uv: false }); }
  b.box('vault', XS - X0, 0.2, ccz0 - ccz1, [(X0 + XS) / 2, F3 - 0.4, ccz], { uv: 0.3 });

  // ================= 2F 阅卷中心 =================
  const gz0 = -62, gz1 = ZB, gz = (gz0 + gz1) / 2;
  if (!R3.exam_center) for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { // 批次14：R3 下由 r3plan planExamCenter 接管（原随机纸堆/显示器阅卷桌关闭）
    const x = X0 + 4 + k * 7, z = gz0 - 3 - r * 3.6;
    b.box('wood', 5.6, 0.06, 1.2, [x, F2 + 0.76, z], { uv: 0.6 }); world.box(x, F2 + 0.4, z, 5.6, 0.8, 1.2);
    for (const ex of [-2.7, 2.7]) b.box('wood', 0.06, 0.74, 1.1, [x + ex, F2 + 0.37, z], { uv: 1 });
    for (const ex of [-1.4, 1.4]) { const mon = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.36), consoleMaterial(100 + r * 10 + k)); mon.position.set(x + ex, F2 + 1.15, z - 0.4); zone.add(mon); b.box('blackMetal', 0.64, 0.4, 0.04, [x + ex, F2 + 1.15, z - 0.43], { uv: 1 }); woodChair(b, x + ex, F2, z + 0.75, 1); }
    for (let p = 0; p < 4; p++) b.box('kraft', 0.3, 0.05 + Math.random() * 0.2, 0.4, [x - 2.2 + p * 1.4 + Math.random() * 0.3, F2 + 0.82, z + 0.25], { uv: 2 });
  }
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.003, 0.3), new THREE.MeshStandardMaterial({ color: 0xf6f2e8, roughness: 0.8 })); paper.position.set(X0 + 4 + 7 * 1, F2 + 0.795, gz0 - 3 - 2 * 3.6 + 0.1); zone.add(paper); ctx.anchors.doc_exam_paper = paper;
  const note = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), new THREE.MeshStandardMaterial({ color: 0xf2df5a, roughness: 0.8 })); note.position.set(X0 + 4 + 7 * 1 + 1.4 + 0.25, F2 + 1.3, gz0 - 3 - 2 * 3.6 - 0.39); zone.add(note); ctx.anchors.doc_exam_grader_note = note;
  if (R3.exam_center) { paper.position.set(EXAM_R3.paper[0], F2 + 1.052, EXAM_R3.paper[1]); paper.rotation.y = 0.15; note.position.set(EXAM_R3.note[0], F2 + 1.051, EXAM_R3.note[1]); note.rotation.x = -Math.PI / 2; }
  if (!R3.exam_center) for (let k = 0; k < 6; k++) add(placeModel('box_stack', { width: 1.1, pos: [XS - 1.2, F2, gz0 - 2 - k * 2], rotY: -Math.PI / 2 }));
  const gTitle = goldText('阅卷中心', 3, 0.5, M.goldBright, { res: 128 }); gTitle.position.set(35, F2 + 5.8, gz1 + 0.25); zone.add(gTitle);
  rectLight(zone, R3.exam_center ? 0xfff0dc : 0xf0f4ff, R3.exam_center ? 1.2 : 1.6, 26, 10, [35, F3 - 0.5, gz], [35, F2, gz]);
  b.box('vault', XS - X0, 0.2, gz0 - gz1, [(X0 + XS) / 2, F3 - 0.4, gz], { uv: 0.3 });

  // ================= 3F 禁区封锁调度厅 =================
  const zz0 = ZA, zz1 = -61, zz = (zz0 + zz1) / 2;
  // 二十米实体沙盘
  const sand = sandTable(M); sand.position.set(35, F3, zz); zone.add(sand); ctx.sandTable = sand;
  world.box(35, F3 + 0.5, zz, 22, 1.0, 9);
  ctx.anchors.int_zone_sandbox = { box: [30, F3 + 1.2, zz, 10, 0.6, 8] };
  ctx.anchors.int_zone_beijing8 = { obj: sand.userData.beijing };
  // 北墙分级挂牌、西墙卡片墙、调度台
  const gr = content.tex('tex_zone_grading');
  const grm = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.6), gr ? new THREE.MeshStandardMaterial({ map: gr, roughness: 0.5 }) : gradingMaterial());
  grm.position.set(35, F3 + 3.6, zz1 + 0.2); zone.add(grm); ctx.anchors.doc_zone_grading = grm;
  const cw = content.tex('tex_zone_cardwall');
  const cwm = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.6), cw ? new THREE.MeshStandardMaterial({ map: cw, roughness: 0.7 }) : cardWallMaterial());
  cwm.position.set(X0 + 0.25, F3 + 3.0, zz); cwm.rotation.y = Math.PI / 2; zone.add(cwm); ctx.anchors.doc_zone_cardwall = cwm;
  b.box('wood', 6, 1.0, 1.2, [35, F3 + 0.5, zz0 - 2.6], { uv: 0.5, collide: true });
  const zd = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.4), M.kraft); zd.position.set(35, F3 + 1.01, zz0 - 2.6); zone.add(zd); ctx.anchors.doc_zone_dispatch = zd;
  // 悬吊封锁带样品
  for (let k = 0; k < 5; k++) { const tape = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 2.2), tapeMaterial()); tape.position.set(X1 - 2 - k * 0.5, F3 + 5.6, zz0 - 3); tape.rotation.y = 0.3 * k; zone.add(tape); }
  const zTitle = goldText('禁区封锁调度厅', 4, 0.5, M.goldBright, { res: 128 }); zTitle.position.set(35, F3 + 6.6, zz1 + 0.21); zone.add(zTitle);
  rectLight(zone, 0xffe2c0, 1.4, 24, 12, [35, Y + 20.8, zz], [35, F3, zz]);
  spot(zone, 0xffd6a0, 160, [35, Y + 20.5, zz], [35, F3, zz], 0.7, true, 20);

  // ================= 3F 副本投放调度室 =================
  const dz0 = -62, dz1 = ZB, dzc = (dz0 + dz1) / 2;
  // 全国考点电子地图（南墙）
  const map = new CanvasScreen(1536, 768, (c, t, W, H) => drawExamMap(c, t, W, H), { fps: 1, intensity: 1.2 }); ctx.screens.push(map);
  const mm = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), map.mat); mm.position.set(35, F3 + 3.8, dz1 + 0.25); zone.add(mm); ctx.anchors.doc_exam_stats = mm;
  // 旋转金属书架（副本母带）
  const shelf = masterShelf(M); shelf.position.set(35, F3, dzc + 1); zone.add(shelf); ctx.masterShelf = shelf; world.box(35, F3 + 1.8, dzc + 1, 3.2, 3.6, 3.2);
  ctx.anchors.int_exam_shelf = { box: [35, F3 + 1.8, dzc + 1, 3.6, 3.6, 3.6] };
  b.box('blackMetal', 4, 1.0, 1.2, [28, F3 + 0.5, dz0 - 2], { uv: 0.5, collide: true });
  if (R3.zone_control) { point(zone, 0xfff0dc, 3.2, [41.5, F3 + 3.0, dz0 - 1.6], 9); point(zone, 0xffe8c8, 1.6, [41.5, F3 + 2.2, dz0 - 5.0], 8); } // 批次20：zone_r3_b 看图北墙门洞（→ 副本投放调度室）一块纯黑 → 门后补灯，透出调度室内景
  if (R3.zone_control) { // 批次22：zone_r3_b 门洞后仍黑 → 门洞视线落点（x 44…47.5，z −65）立一面「投放任务板」（胡桃木框 + 自发光告示）+ 两侧铁皮档案柜 + 暖光
    const tb = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.7), signMaterial('副本投放任务板', ['冀-03　时流异常　5 级　投放中', '雾港-19　回声　3 级　待命', '沪-07　空房间　2 级　已回收', '', '投放前须双人复核母带编号', '值班员签字：________'], 900, 510));
    tb.material.emissive = new THREE.Color(0xffffff); tb.material.emissiveMap = tb.material.map; tb.material.emissiveIntensity = 0.12;
    tb.position.set(43.0, F3 + 1.9, -65.18); zone.add(tb);
    b.box('doorWood', 3.2, 1.9, 0.08, [43.0, F3 + 1.9, -65.26], { uv: 0.5 }); b.box('doorWood', 3.4, 0.08, 0.3, [43.0, F3 + 0.85, -65.1], { uv: 0.5 }); // 批次23：任务板西移到门洞视线正中
    for (const x of [40.9, 45.1]) b.box('paintedGreen', 0.9, 1.8, 0.6, [x, F3 + 0.9, -65.0], { uv: 0.5, collide: true });
    point(zone, 0xffe2b8, 3.0, [43.0, F3 + 2.8, -63.4], 6); }
  const dsp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.31), M.kraft); dsp.position.set(28, F3 + 1.03, dz0 - 2); zone.add(dsp); ctx.anchors.doc_exam_dispatch = dsp;
  const dTitle = goldText('副本投放调度室', 4, 0.5, M.goldBright, { res: 128 }); dTitle.position.set(X0 + 0.25, F3 + 5.4, dzc); dTitle.rotation.y = Math.PI / 2; zone.add(dTitle);
  rectLight(zone, 0xc8d8ff, 1.0, 20, 10, [35, Y + 20.8, dzc], [35, F3, dzc]);
  point(zone, 0x8ab8ff, 12, [35, F3 + 5, dzc], 16);

  zone.add(dust([35, Y, -54], [30, 20, 40], 300));
  b.build(zone, M);
  for (const geo of b.colliders) world.addGeo(geo);
  world.surface(X0, ZB, X1, ZA, 'marble', Y - 1, Y + 3);
  world.surface(X0, ZB, X1, ZA, 'carpet', F2 - 1, F2 + 3.5);
  world.surface(X0, ZB, X1, ZA, 'carpet', F3 - 1, F3 + 4);
  T('east built');
  return Promise.all(jobs).then(() => zone);
}

// ——— 程序化物件 ———
function textGlobe() {
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024; const c = cv.getContext('2d');
  c.fillStyle = '#000'; c.fillRect(0, 0, 2048, 1024);
  const words = '叙事 规则 稳定 污染 畸变 篇幅 归档 留白 管理局 禁区 觉醒 祂 文本 页 书 墨 冲正 装订 缝合 京城 雾港 灰塔'.split(' ');
  c.font = '22px "NB Sans", sans-serif';
  for (let y = 20; y < 1024; y += 26) for (let x = (y * 7) % 60; x < 2048; x += 60 + Math.random() * 40) {
    const lat = (y / 1024 - 0.5) * Math.PI, lon = (x / 2048) * Math.PI * 2;
    const land = Math.sin(lon * 3 + 1) * Math.cos(lat * 2) + Math.sin(lon * 5 + lat * 3) * 0.5 > 0.2;
    c.fillStyle = land ? `rgba(255,${190 + Math.random() * 50 | 0},110,0.95)` : 'rgba(90,150,255,0.35)';
    c.fillText(words[(Math.random() * words.length) | 0], x, y);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.SphereGeometry(2.2, 64, 32), m); g.add(s);
  const core = new THREE.Mesh(new THREE.SphereGeometry(2.1, 32, 16), new THREE.MeshBasicMaterial({ color: 0x061024, transparent: true, opacity: 0.5 })); g.add(core);
  for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(2.6 + i * 0.25, 0.01, 4, 96), new THREE.MeshBasicMaterial({ color: 0x5aa8ff, transparent: true, opacity: 0.5 })); r.rotation.set(Math.PI / 2 + i * 0.3, i * 0.6, 0); g.add(r); }
  g.userData.spin = s; g.frustumCulled = false;
  return g;
}
function sandTable(M) { // 批次17：沙盘重做——原黑大理石高光侧面在近景成一条模糊反光横条、台面金属感 + Math.random 散布 → 哑光胡桃木框 + 墨绿漆裙板 + 铜踢脚 + 地形版图（等高线/河道/环路/区块）+ 按区块定点的分级棱柱（种子确定，不随机）
  const g = new THREE.Group(); let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0x2c3a30, roughness: 0.78, metalness: 0.05 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(22, 0.86, 9), skirtMat); base.position.y = 0.43; g.add(base);
  const kick = new THREE.Mesh(new THREE.BoxGeometry(22.04, 0.1, 9.04), M.brass); kick.position.y = 0.05; g.add(kick);
  const frameMat = M.wood; for (const [w, d, x, z] of [[22.3, 0.22, 0, 4.54], [22.3, 0.22, 0, -4.54], [0.22, 9.08, 11.04, 0], [0.22, 9.08, -11.04, 0]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), frameMat); f.position.set(x, 0.91, z); g.add(f); }
  for (const x of [-7.33, -3.67, 0, 3.67, 7.33]) for (const z of [4.505, -4.505]) { const pl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.6, 0.012), M.brass); pl.position.set(x, 0.46, z); g.add(pl); } // 裙板分格铜线
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 820; const c = cv.getContext('2d');
  c.fillStyle = '#45452f'; c.fillRect(0, 0, 2048, 820);
  for (let k = 0; k < 9; k++) { c.strokeStyle = `rgba(${40 + k * 8},${44 + k * 7},${28 + k * 4},0.55)`; c.lineWidth = 2; for (const [cx, cy, r0] of [[520, 300, 60], [1500, 560, 80], [1180, 220, 50]]) { c.beginPath(); for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2, r = r0 + k * 34 + Math.sin(a * 3 + k) * 14; c.lineTo(cx + Math.cos(a) * r * 1.6, cy + Math.sin(a) * r); } c.stroke(); } }
  c.strokeStyle = '#3b6a88'; c.lineWidth = 14; c.beginPath(); c.moveTo(0, 610); c.bezierCurveTo(500, 520, 800, 700, 1200, 470); c.bezierCurveTo(1500, 300, 1800, 420, 2048, 330); c.stroke();
  c.strokeStyle = '#b8a77a'; c.lineWidth = 5; c.beginPath(); c.ellipse(1024, 410, 620, 290, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.ellipse(1024, 410, 330, 160, 0, 0, Math.PI * 2); c.stroke();
  for (const a of [0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6]) { c.beginPath(); c.moveTo(1024, 410); c.lineTo(1024 + Math.cos(a) * 980, 410 + Math.sin(a) * 460); c.stroke(); }
  const blocks = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const x = 230 + i * 300 + (j % 2) * 60, y = 140 + j * 240; blocks.push([x, y]); c.fillStyle = 'rgba(30,28,20,0.35)'; c.fillRect(x - 70, y - 50, 140, 100); c.strokeStyle = '#e0cf9a'; c.lineWidth = 2; c.strokeRect(x - 70, y - 50, 140, 100); c.fillStyle = '#efe2b8'; c.font = '700 26px "NB Serif",serif'; c.fillText('甲乙丙丁戊己'[i] + '-' + (j * 6 + i + 1), x - 40, y + 10); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(21.86, 8.86), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, metalness: 0, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.1 }));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.865; g.add(top);
  // 分级棱柱：每区块 2–3 根、成簇定点（种子确定）
  const colors = [0xfff0b0, 0xffe080, 0xffc860, 0xffa040, 0xff8030, 0xff5a28, 0xff3a20, 0xd02020, 0xa01030];
  const pinMats = colors.map((cl) => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: cl, emissiveIntensity: 2.4, roughness: 0.4 })); // 批次17 zone_r3 看图：1.1 被曝光吃掉像米色木块
  const capMat = M.brass;
  for (const [bx, by] of blocks) { const n = 2 + Math.floor(rnd() * 2); for (let k = 0; k < n; k++) { const lvl = 1 + Math.floor(Math.pow(rnd(), 1.8) * 7), h = 0.12 + lvl * 0.07;
    const x = (bx - 1024) / 2048 * 21.86 + (k - (n - 1) / 2) * 0.32, z = (by - 410) / 820 * 8.86 + 0.15;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 8), pinMats[lvl - 1]); m.position.set(x, 0.865 + h / 2, z); g.add(m);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 12), capMat); cap.position.set(x, 0.865 + h + 0.01, z); g.add(cap); } }
  const bj = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.95, 8), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4, metalness: 0.6 })); bj.position.set(2.2, 0.865 + 0.475, -0.8); g.add(bj);
  const bjr = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 24), new THREE.MeshBasicMaterial({ color: 0xc9a052, side: THREE.DoubleSide })); bjr.rotation.x = -Math.PI / 2; bjr.position.set(2.2, 0.868, -0.8); g.add(bjr);
  g.userData.beijing = bj;
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
function masterShelf(M) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.6, 12), M.steel); core.position.y = 1.8; g.add(core);
  const books = new THREE.Group();
  const codes = ['SUR-044-5', 'MYS-013-2', 'RPG-021-1', 'COM-005-2', 'EXP-009-1', 'SUR-001-1'];
  for (let tier = 0; tier < 4; tier++) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.05, 32), M.blackMetal); disc.position.y = 0.4 + tier * 0.85; books.add(disc);
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2; const bk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.42), new THREE.MeshStandardMaterial({ color: [0x2a1a14, 0x14182a, 0x1e2a1a][k % 3], roughness: 0.6 }));
      bk.position.set(Math.cos(a) * 1.2, 0.72 + tier * 0.85, Math.sin(a) * 1.2); bk.rotation.y = -a; books.add(bk);
      const seal = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.06, 0.43), M.waxRed); seal.position.copy(bk.position); seal.rotation.y = -a; books.add(seal);
      void codes;
    }
  }
  g.add(books); g.userData.books = books;
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
function canvasMat(w, h, draw, emissive = 0) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, ...(emissive ? { emissive: 0xffffff, emissiveMap: t, emissiveIntensity: emissive } : {}) });
}
const _consoleCache = new Map();
function consoleMaterial(seed) {
  const k = seed % 6; if (_consoleCache.has(k)) return _consoleCache.get(k);
  const m = canvasMat(256, 144, (c, w, h) => {
    c.fillStyle = '#030a16'; c.fillRect(0, 0, w, h); c.strokeStyle = ['#3a9cff', '#ffd36e', '#7dffb0'][k % 3]; c.lineWidth = 2; c.beginPath();
    for (let x = 0; x < w; x += 4) { const y = h * 0.6 + Math.sin(x * 0.07 + k) * 20 + Math.sin(x * 0.21 + k * 2) * 8; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.fillStyle = '#9fb4e0'; c.font = '14px "NB Sans", sans-serif'; c.fillText(['京', '冀', '晋', '鲁', '豫', '苏'][k] + ' · 现实稳定度 ' + (95 + k * 0.5).toFixed(1) + '%', 8, 20);
    for (let i = 0; i < 6; i++) c.fillRect(8 + i * 40, 120 - i * 6 - k * 3, 30, 10 + i * 6 + k * 3);
  }, 1.1);
  _consoleCache.set(k, m); return m;
}
function photoMaterial(k) { return canvasMat(280, 200, (c, w, h) => { c.fillStyle = '#d8d2c4'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2a30'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(40 + i * 50, 90, 16, 0, Math.PI * 2); c.fill(); c.fillRect(26 + i * 50, 106, 28, 60); } c.fillStyle = '#7a1a1a'; c.fillRect(0, 170, w, 30); c.fillStyle = '#f2e6c8'; c.font = '16px "NB Serif", serif'; c.fillText(`${2019 + k} 年觉醒者授勋`, 10, 191); }); }
function lettersMaterial() { return canvasMat(1800, 680, (c, w, h) => { c.fillStyle = '#3a2c20'; c.fillRect(0, 0, w, h); const L = ['我家楼道每天多一层台阶', '孩子作文本上的字半夜会自己改', '小区门口的路牌写着一个不存在的地名', '我丈夫说他读到了自己的结局', '电梯里总有人多按一层', '我梦里的那本书有我的名字']; L.forEach((l, i) => { const x = 30 + (i % 3) * 590, y = 40 + Math.floor(i / 3) * 320; c.fillStyle = '#ece4cf'; c.save(); c.translate(x + 260, y + 140); c.rotate((Math.random() - 0.5) * 0.06); c.fillRect(-260, -140, 520, 280); c.fillStyle = '#2a2018'; c.font = '30px "NB Serif", serif'; c.fillText('群众来信摘录', -240, -90); c.font = '26px "NB Serif", serif'; c.fillText('「' + l + '」', -240, -20); c.restore(); }); }); }
function stripMaterial() { const m = canvasMat(96, 760, (c, w, h) => { c.fillStyle = '#f2efe4'; c.fillRect(0, 0, w, h); c.fillStyle = '#333'; c.font = '9px monospace'; for (let y = 12; y < h; y += 12) c.fillText(`${String((y / 12) % 24 | 0).padStart(2, '0')}:07 京 97.${(y * 7) % 10}`, 4, y); }); m.side = THREE.DoubleSide; return m; }
function gradingMaterial() { return canvasMat(960, 520, (c, w, h) => { c.fillStyle = '#0d0f14'; c.fillRect(0, 0, w, h); c.fillStyle = '#e6c67c'; c.font = '900 40px \"NB Title\", \"NB Serif\", serif'; c.fillText('畸变禁区分级标准（1–9 级）', 40, 60); const cols = ['#fff0b0', '#ffe080', '#ffc860', '#ffa040', '#ff8030', '#ff5a28', '#ff3a20', '#d02020', '#a01030']; for (let i = 0; i < 9; i++) { c.fillStyle = cols[i]; c.fillRect(40, 90 + i * 44, 30, 30); c.fillStyle = '#d8d2c2'; c.font = '24px "NB Sans", sans-serif'; c.fillText(`${i + 1} 级　${['局部异常', '空间增殖', '规则替换', '认知污染', '时流异常', '群体改写', '现实剥离', '驯化空间', '不可接触'][i]}`, 90, 114 + i * 44); } }); }
function cardWallMaterial() { return canvasMat(2400, 720, (c, w, h) => { c.fillStyle = '#1a1612'; c.fillRect(0, 0, w, h); const cards = ['京-朝阳-001 · 1 级 · 烂尾楼多房', '冀-03 · 5 级 · 时流异常', '昆仑无字碑林 · 9 级 · 只读', '沪-07 · 3 级 · 地铁多一站', '粤-12 · 2 级 · 镜中人', '太平洋底沉没书库 · 9 级 · 只读', '撒哈拉倒悬之城 · 9 级 · 只读', '川-04 · 4 级 · 回声山谷']; for (let i = 0; i < 24; i++) { const x = 30 + (i % 8) * 296, y = 30 + Math.floor(i / 8) * 230; c.fillStyle = i % 5 === 0 ? '#e8d8b0' : '#ece6d6'; c.fillRect(x, y, 270, 200); c.fillStyle = '#7a1a1a'; c.fillRect(x, y, 270, 34); c.fillStyle = '#fff'; c.font = '20px "NB Sans", sans-serif'; c.fillText('禁区卡', x + 10, y + 24); c.fillStyle = '#222'; c.font = '19px "NB Serif", serif'; c.fillText(cards[i % cards.length].split(' · ')[0], x + 10, y + 80); c.fillText(cards[i % cards.length].split(' · ').slice(1).join(' · '), x + 10, y + 120); } }); }
function tapeMaterial() { const m = canvasMat(32, 512, (c, w, h) => { for (let y = 0; y < h; y += 32) { c.fillStyle = (y / 32) % 2 ? '#111' : '#e8c020'; c.fillRect(0, y, w, 32); } c.fillStyle = '#fff'; c.save(); c.translate(22, 10); c.rotate(Math.PI / 2); c.font = '16px "NB Sans", sans-serif'; c.fillText('封锁区域　禁止入内　叙事管理局', 0, 0); c.restore(); }); m.side = THREE.DoubleSide; return m; }

function drawCmdScreen(c, t, W, H) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04102a'); g.addColorStop(1, '#010309'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#e8c87a'; c.font = '900 44px \"NB Title\", \"NB Serif\", serif'; c.fillText('全国现实稳定度 · 叙事污染实时态势', 40, 60);
  c.strokeStyle = '#1f4a9a'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; const r = 210 + Math.sin(a * 3) * 40; const x = 700 + Math.cos(a) * r * 1.6, y = 360 + Math.sin(a) * r * 0.8; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.stroke();
  for (let i = 0; i < 70; i++) { const x = 400 + ((i * 97) % 600), y = 220 + ((i * 53) % 300); const v = 0.5 + 0.5 * Math.sin(t * 0.6 + i); c.fillStyle = i % 9 === 0 ? `rgba(255,90,60,${v})` : `rgba(120,200,255,${0.4 + v * 0.4})`; c.beginPath(); c.arc(x, y, i % 9 === 0 ? 7 : 3, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#ffd36e'; c.font = '700 120px "NB Sans", sans-serif'; c.fillText('97.3%', 1300, 260); c.fillStyle = '#9fb4e0'; c.font = '34px "NB Sans", sans-serif'; c.fillText('全国平均现实稳定度', 1310, 140);
  const d = new Date(); c.fillText(`京城 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}　预警 2　处置中 5`, 1310, 330);
  c.strokeStyle = '#ffd36e'; c.lineWidth = 3; c.beginPath(); for (let x = 0; x < 640; x += 4) { const y = 470 + Math.sin(x * 0.04 + t) * 20 + Math.sin(x * 0.011) * 30; x ? c.lineTo(1300 + x, y) : c.moveTo(1300 + x, y); } c.stroke();
  if ((t % 30) < 0.6) { c.fillStyle = '#ff2a2a'; c.font = '700 40px "NB Sans", sans-serif'; c.fillText('03:07　京城地下　读数波动　已自动消除', 1300, 590); }
}
function drawWorldClock(c, name, off) {
  c.fillStyle = '#05070c'; c.fillRect(0, 0, 256, 300); const d = new Date(Date.now() + off * 3600000);
  c.translate(128, 120); c.strokeStyle = '#c9a052'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 96, 0, Math.PI * 2); c.stroke();
  const h = d.getUTCHours() + 8, m = d.getUTCMinutes();
  const ha = ((h % 12) + m / 60) / 12 * Math.PI * 2 - Math.PI / 2, ma = m / 60 * Math.PI * 2 - Math.PI / 2;
  c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ha) * 50, Math.sin(ha) * 50); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ma) * 80, Math.sin(ma) * 80); c.stroke();
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#e8d8b0'; c.font = '26px "NB Serif", serif'; c.textAlign = 'center'; c.fillText(name, 128, 270);
}
function drawExamMap(c, t, W, H) {
  c.fillStyle = '#020610'; c.fillRect(0, 0, W, H); c.fillStyle = '#e8c87a'; c.font = '900 40px \"NB Title\", \"NB Serif\", serif'; c.fillText('2027 叙事高考加试 · 全国考点副本投放', 30, 54);
  for (let i = 0; i < 302; i++) { const x = 200 + ((i * 131) % 1100), y = 120 + ((i * 71) % 560); const on = (Math.sin(t + i) > -0.2); c.fillStyle = on ? '#ffd36e' : '#3a4a6a'; c.fillRect(x, y, 5, 5); }
  c.fillStyle = '#9fb4e0'; c.font = '28px "NB Sans", sans-serif'; c.fillText('觉醒率　3‰　　SUR-044-5 已投放 302 考点', 30, H - 30);
}

export function updateEastWing(ctx, dt, t) {
  if (ctx.textGlobe) { ctx.textGlobe.userData.spin.rotation.y += dt * 0.15; }
  if (ctx.masterShelf) ctx.masterShelf.userData.books.rotation.y += dt * 0.05;
}
