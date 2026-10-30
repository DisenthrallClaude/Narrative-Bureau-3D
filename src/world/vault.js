// M2 地下：书脊井电梯（安检大厅北墙 x=±6 金门 → 楼层面板 → 转场）、B3 开架收容区、B4 齐仇收容柜走廊、B5 深库（圆形金库门 + 单件收容室）
// 地下楼层在主楼后楼正下方：B3 y=-26，B4 y=-34，B5 y=-42；每层南端是电梯厅（金门在 z=-84）
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { placeModel, loadModel } from '../engine/assets.js';
import { mats } from './mats.js';
import { weather } from '../engine/weather.js';
import { Frame, archRingGeo, archShape, emblem, goldText } from './gothic.js';
import { CanvasScreen, dust, time } from '../engine/fx.js';
import { content } from '../engine/content.js';
import { FLOOR, T } from './exterior.js';
import { R3 } from './r3plan.js';
import { dressMats, roomDress, coffered } from './dress.js';
import { wallX, wallZ, rectLight, spot, point, person, brassPlaqueMaterial, signMaterial, grandClock } from './interiors.js';

export const LEVELS = { B3: -26, B4: -34, B5: -42 };
// 电梯可达楼层登记（其他模块往里注册：FLOORS.B1 = { y, label }）
export const FLOOR_ORDER = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];
// 施工中的楼层：电梯面板显示「施工中」并拒绝到达（布景未达标的区域不以灰盒开放）
export const WIP = new Set();
export const FLOORS = { B3: { y: -26, label: 'B3　收容库 · 开架区（1–3 级）' }, B4: { y: -34, label: 'B4　单独收容柜（4–6 级）' }, B5: { y: -42, label: 'B5　深库（7 级以上）' } };
const EZ = -84;
export const HALL_TEXT = { B1: '外勤缉拿处 · 整备库', B2: '审讯室 · 临时羁押', B3: '证物收容库 · 开架区 · 1–3 级', B4: '证物收容库 · 单独收容柜 · 4–6 级', B5: '深库 · 7 级以上 · 双人双锁', B6: '驯化副本训练场' }; // 电梯门所在墙面 z（门朝北开向楼层）

export function buildVault(scene, world, ctx) {
  const M = mats();
  const Z = {}, B = {};
  for (const n of Object.keys(LEVELS)) { Z[n] = new THREE.Group(); Z[n].name = 'vault_' + n.toLowerCase(); scene.add(Z[n]); ctx.zones[Z[n].name] = Z[n]; B[n] = new Batch(); }
  const jobs = [];
  const addTo = (g) => (p) => { jobs.push(p.then((o) => { g.add(o); return o; })); return p; };
  ctx.anchors = ctx.anchors ?? {}; ctx.slots = ctx.slots ?? {};
  ctx.vault = { doors: {} };
  const Mx = vaultMats(M);

  // ======== 安检大厅北墙：两部电梯的呼梯面板 ========
  ctx.elevatorCalls = [];
  for (const x of [-6, 6]) {
    const panel = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.6, 0.06), M.brass); panel.add(base);
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 20), new THREE.MeshStandardMaterial({ color: 0x201a10, emissive: 0xffc35a, emissiveIntensity: 1.6 })); btn.rotation.x = Math.PI / 2; btn.position.set(0, 0.08, 0.04); panel.add(btn);
    const btn2 = btn.clone(); btn2.position.y = -0.08; panel.add(btn2);
    panel.position.set(x + (x > 0 ? -2.1 : 2.1), FLOOR + 1.35, -75.62); ctx.zones.security_hall.add(panel);
    ctx.elevatorCalls.push({ obj: panel, x, floor: '1F' });
  }

  // ======== 三个地下层的电梯厅 ========
  for (const [name, y] of Object.entries(LEVELS)) elevatorHall(B[name], Z[name], world, ctx, M, Mx, name, y);

  // ======== B3：1–3 级开架收容区 ========
  {
    const zone = Z.B3, b = B.B3, add = addTo(zone);
    const y = LEVELS.B3, X = 20, Z0 = -92, Z1 = -128, H = 6.2;
    room(b, world, M, -X, X, Z0, Z1, y, H, 'concreteFloor', 'concreteWall', { frontHole: { x0: -9.4, x1: 9.4, h: 5.2 } });
    // 气闸门（入口）
    airlock(b, zone, M, Mx, 0, y, Z0);
    const rules = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), content.tex('tex_vault_rules') ? new THREE.MeshStandardMaterial({ map: content.tex('tex_vault_rules'), roughness: 0.5 }) : signMaterial('收容库管理规定', ['1–3 级：开架', '4–6 级：单独收容柜', '7 级以上：深库 · 双人双锁', '', '不要回应任何证物的问候'], 512, 680));
    rules.position.set(3.4, y + 1.7, Z0 - 0.42); rules.rotation.y = Math.PI; zone.add(rules); ctx.anchors.doc_vault_rules = rules;
    b.box('blackMetal', 1.0, 1.3, 0.04, [3.4, y + 1.7, Z0 - 0.4], { uv: 1 });
    // 地面黄黑警示线 + 通道
    for (const x of [-2.4, 2.4]) b.box('hazard', 0.18, 0.012, Z0 - Z1 - 1, [x, y + 0.006, (Z0 + Z1) / 2], { uv: 0.8 });
    if (R3.vault_b3) { // 批次20：入口告示 + 门槛警示带 + 中央通道地面编号（黄漆）
      const MY = dressMats(M);
      b.box('hazard', 5.2, 0.014, 0.36, [0, y + 0.007, Z0 - 0.75], { uv: 0.8 }); // 门槛黄黑警示带
      for (let k = 0; k < 6; k++) b.box('hazard', 4.6, 0.013, 0.18, [0, y + 0.0065, Z0 - 5.2 - k * 5], { uv: 0.8 }); // 与收容格对位的横向警示线
      b.box('blackMetal', 5.8, 0.46, 0.04, [0, y + 3.95, Z0 - 0.17], { uv: 1 }); // 门楣外侧（电梯厅面）黑底横匾
      const ban = goldText('B3 证物收容库 · 未经批准禁止入内', 5.4, 0.36, M.goldBright ?? M.gold, { res: 160 }); ban.position.set(0, y + 3.95, Z0 - 0.145); zone.add(ban);
      const pq = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), brassPlaqueMaterial('B3 证物收容库', ['未经批准', '禁止入内', '', '进出须双人登记', '随身物品寄存', '外勤缉拿处 · 收容科'])); pq.position.set(2.95, y + 1.75, Z0 - 0.19); zone.add(pq); // 门垛外侧铜牌（朝电梯厅）
      const pq2 = pq.clone(); pq2.position.x = -2.95; zone.add(pq2);
      for (let k = 0; k < 6; k++) { const t = goldText('通道 ' + String(k + 1).padStart(2, '0'), 1.1, 0.34, MY.r3_paintYellow, { res: 128 }); t.rotation.x = -Math.PI / 2; t.position.set(1.5, y + 0.016, Z0 - 7.5 - k * 4.6); zone.add(t); } }
    // 货架：两侧各 6 排，垂直于中轴
    const shelfZ = []; for (let k = 0; k < 6; k++) shelfZ.push(Z0 - 5 - k * 5);
    let label = null;
    if (R3.vault_b3) label = [9.5 - 1.5, y + 1.35, -99 + 0.42]; // 批次19：开架货架由 r3plan vault_b3 的收容格 + 深灰绿钢架取代，清单标签挂到第一组钢架
    else shelfZ.forEach((z, k) => {
      for (const sx of [-1, 1]) {
        const cx = sx * 11.5;
        steelShelf(b, world, cx, y, z, 14, 0.9, 3.6, 4);
        // 证物箱（程序化纸箱 + 模型混排）
        for (let lv = 0; lv < 4; lv++) for (let i = 0; i < 6; i++) {
          const bx = cx - 6 + i * 2.3 + ((lv + k) % 2) * 0.4, by = y + 0.12 + lv * 0.9;
          if ((i + lv + k) % 5 === 0) continue;
          const w = 0.7 + ((i * 7 + lv * 3 + k) % 4) * 0.12, h = 0.42 + ((i + lv * 5) % 3) * 0.1;
          b.box((i + lv) % 3 === 0 ? 'kraftDark' : 'kraft', w, h, 0.62, [bx, by + h / 2 + 0.03, z], { uv: 1.2 });
          b.box('evLabel', 0.22, 0.12, 0.005, [bx, by + h * 0.55, z + 0.315], { uv: false });
        }
      }
      if (k === 1) label = [11.5 - 6 + 2.3, y + 1.35, z + 0.36];
    });
    // 中轴展示台：会眨眼的琥珀、市民上交的电饭锅、古董花瓶、防毒面具、旧军箱
    const exhibits = [['amber', 0.35, 'B3-0117 琥珀（蚊子会眨眼）'], ['vase', 0.6, 'B3-0342 古董花瓶'], ['gas_mask', 0.32, 'B3-0408 防毒面具'], ['military_crate', 0.55, 'B3-0091 旧军箱'], ['candle_holder', 0.4, 'B3-0233 烛台'], ['magnifier', 0.25, 'B3-0560 放大镜']];
    exhibits.forEach(([model, hgt, name], i) => {
      const z = Z0 - 7.5 - i * 4.6, x = 0;
      b.box('blackMarble', 1.0, 1.0, 1.0, [x, y + 0.5, z], { uv: 0.6, collide: true });
      b.box('gold', 1.04, 0.04, 1.04, [x, y + 1.0, z], { uv: 1 });
      b.add('glassClear', new THREE.CylinderGeometry(0.42, 0.42, 0.9, 32, 1, true), { pos: [x, y + 1.47, z] }, { uv: false });
      b.box('brass', 0.9, 0.04, 0.9, [x, y + 1.94, z], { uv: 1 });
      add(placeModel(model, { height: hgt, pos: [x, y + 1.02, z], rotY: i * 0.7 }));
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.14), tagMaterial(name)); tag.position.set(x, y + 0.86, z + 0.505); zone.add(tag);
      point(zone, 0xfff2d8, 3, [x, y + 2.6, z], 4);
    });
    // 会说话的电饭锅（单独一台，盖子会轻轻跳）
    const cooker = riceCooker(); cooker.position.set(-1.6, y + 1.02, Z0 - 7.5 - 1 * 4.6); zone.add(cooker); ctx.vault.cooker = cooker;
    b.box('blackMarble', 0.8, 1.0, 0.8, [-1.6, y + 0.5, Z0 - 7.5 - 4.6], { uv: 0.6, collide: true });
    // 货架上的一组小标签（逐件可读）
    if (label) { const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), tagMaterial('B3 开架区 · 证物清单')); lb.position.set(...label); zone.add(lb); ctx.anchors.doc_vault_b3_items = lb; }
    // 荧光灯带（冷白，部分闪烁）
    ctx.vault.flicker = [];
    for (let z = Z0 - 3; z > Z1 + 1; z -= 5) for (const x of [-11.5, 0, 11.5]) {
      b.box('blackMetal', 3.2, 0.08, 0.3, [x, y + H - 0.25, z], { uv: 1 });
      const tube = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.05, 0.12), M.lampCold.clone()); tube.position.set(x, y + H - 0.31, z); zone.add(tube);
      if ((z * 7 + x) % 3 === 0) ctx.vault.flicker.push(tube);
    }
    rectLight(zone, 0xe6eeff, 2.2, 36, 30, [0, y + H - 0.4, (Z0 + Z1) / 2], [0, y, (Z0 + Z1) / 2]);
    for (const z of [-100, -116]) point(zone, 0xdfe8ff, 10, [0, y + 5, z], 18);
    spot(zone, 0xffe6c0, 60, [0, y + 5.8, -104], [0, y, -104], 0.8, true, 16);
    // 警示灯（旋转）
    ctx.vault.beacons = [];
    for (const z of [Z0 - 1, Z1 + 1]) { const bc = beacon(M); bc.position.set(-X + 0.4, y + 4.6, z); zone.add(bc); ctx.vault.beacons.push(bc); }
    world.surface(-X, Z1, X, Z0, 'stone', y - 1, y + 3);
  }

  // ======== B4：4–6 级单独收容柜走廊（齐仇） ========
  {
    const zone = Z.B4, b = B.B4, add = addTo(zone);
    const y = LEVELS.B4, Z0 = -92, Z1 = -140, X = 4.2, H = 5.2;
    room(b, world, M, -X, X, Z0, Z1, y, H, 'darkTile', 'concreteWall', { noFront: true });
    airlock(b, zone, M, Mx, 0, y, Z0);
    // 两侧铠装收容柜：每 3.2 m 一个柜位，编号 + 状态灯
    ctx.vault.cabLeds = [];
    for (let k = 0; k < 13; k++) {
      const z = Z0 - 3 - k * 3.4;
      for (const sx of [-1, 1]) {
        const x = sx * (X - 0.55);
        if (k % 4 === 2) { add(placeModel('armored_cabinet', { height: 2.4, pos: [x, y, z], rotY: -sx * Math.PI / 2 })); world.box(x, y + 1.2, z, 1.0, 2.4, 2.4); }
        else {
          b.box('steel', 1.0, 2.6, 2.8, [x, y + 1.3, z], { uv: 0.8, collide: true });
          b.box('blackMetal', 0.06, 2.3, 2.5, [x - sx * 0.5, y + 1.35, z], { uv: 1 });
          for (const dz of [-0.6, 0.6]) b.box('brass', 0.08, 0.36, 0.06, [x - sx * 0.54, y + 1.4, z + dz], { uv: 1 });
          b.add('steel', new THREE.CylinderGeometry(0.18, 0.18, 0.08, 24), { pos: [x - sx * 0.55, y + 1.85, z], rot: [0, 0, Math.PI / 2] }, { uv: 1 });
        }
        const led = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.05), new THREE.MeshStandardMaterial({ color: 0, emissive: (k * 3 + (sx > 0 ? 1 : 0)) % 7 === 0 ? 0xff3020 : 0x30ff70, emissiveIntensity: 2.2 }));
        led.position.set(x - sx * 0.535, y + 2.35, z); led.rotation.y = -sx * Math.PI / 2; zone.add(led); ctx.vault.cabLeds.push(led);
        const num = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.18), tagMaterial(`B4-${String(k * 2 + (sx > 0 ? 2 : 1)).padStart(3, '0')}　${['4', '5', '6'][k % 3]} 级`)); num.position.set(x - sx * 0.535, y + 2.1, z); num.rotation.y = -sx * Math.PI / 2; zone.add(num);
      }
      // 顶灯（琥珀色，间隔）
      b.box('blackMetal', 0.5, 0.06, 1.4, [0, y + H - 0.2, z], { uv: 1 });
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 1.2), Mx.lampAmber); lamp.position.set(0, y + H - 0.25, z); zone.add(lamp);
      if (k % 3 === 0) point(zone, 0xffb860, 8, [0, y + H - 0.6, z], 9);
    }
    // 走廊尽头：齐仇的工作台（显微镜、试剂架、数字保险柜）
    const zd = Z1 + 3.2;
    b.box('steel', 3.0, 0.9, 1.0, [0, y + 0.45, zd], { uv: 1, collide: true });
    b.box('blackMetal', 3.1, 0.05, 1.1, [0, y + 0.92, zd], { uv: 1 });
    add(placeModel('microscope', { height: 0.45, pos: [-0.8, y + 0.945, zd], rotY: 0.4 }));
    add(placeModel('chem_set', { height: 0.35, pos: [0.7, y + 0.945, zd], rotY: -0.3 }));
    add(placeModel('safe_small', { height: 0.9, pos: [2.8, y, Z1 + 1.0], rotY: 0 }));
    add(placeModel('desk_lamp', { height: 0.5, pos: [1.3, y + 0.945, zd - 0.2], rotY: -0.6 }));
    const qc = person(M, { coat: 0x2a2620, clue: 'chair', name: '齐仇' }); qc.position.set(0, y, zd - 1.0); qc.rotation.y = Math.PI; zone.add(qc); ctx.vault.qichou = qc;
    // 裁纸刀（齐仇的能力【裁纸】）
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.005, 0.32), M.steel); blade.position.set(0.15, y + 0.95, zd + 0.1); blade.rotation.y = 0.5; zone.add(blade);
    ctx.anchors.int_vault_qichou = { box: [0, y + 1.0, zd - 1.0, 1.2, 2.0, 1.2] };
    spot(zone, 0xfff0d8, 50, [0, y + H - 0.3, zd], [0, y + 0.9, zd], 0.7, true, 8);
    const tl = goldText('B4　单独收容柜　4–6 级', 4, 0.32, M.goldBright, { res: 96 }); tl.position.set(0, y + 3.4, Z0 - 0.45); tl.rotation.y = Math.PI; zone.add(tl);
    world.surface(-X, Z1, X, Z0, 'stone', y - 1, y + 3);
  }

  // ======== B5：7 级以上深库（圆形金库门 + 单件收容室） ========
  {
    const zone = Z.B5, b = B.B5, add = addTo(zone);
    const y = LEVELS.B5, Z0 = -92, Zd = -100, Z1 = -134, X = 14, H = 7;
    // 前室：双人登记台
    room(b, world, M, -6, 6, Z0, Zd, y, H, 'darkTile', 'vaultWall', { noFront: true, backHole: [-2.4, 2.4, 4.6] });
    b.box('blackMarble', 3.2, 1.05, 0.9, [-3.0, y + 0.525, -95.5], { uv: 0.5, collide: true });
    b.box('brass', 3.3, 0.04, 1.0, [-3.0, y + 1.07, -95.5], { uv: 1 });
    const inc = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.01, 0.32), new THREE.MeshStandardMaterial({ map: clipTexture(), roughness: 0.8 })); inc.position.set(-3.4, y + 1.1, -95.5); inc.rotation.y = 0.15; zone.add(inc); ctx.anchors.doc_vault_incident = inc;
    add(placeModel('clipboard', { height: 0.02, width: 0.26, pos: [-2.4, y + 1.09, -95.4], rotY: -0.2 }));
    for (const dx of [-1, 1]) { const pnl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 0.06), M.blackMetal); pnl.position.set(dx * 3.2, y + 1.5, Zd + 0.45); zone.add(pnl); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff4030, emissiveIntensity: 1.6 })); scr.position.set(dx * 3.2, y + 1.62, Zd + 0.485); zone.add(scr); }
    const dual = goldText('深库　7 级以上　双人双锁', 4.4, 0.34, M.goldBright, { res: 96 }); dual.position.set(0, y + 5.6, Zd + 0.46); zone.add(dual);
    // 圆形金库门（动画模型），靠近自动开启
    add(loadModel('vault_door_anim').then((src) => {
      const o = src.clone(true); const w = new THREE.Group(); w.add(o);
      o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o); const s = 4.6 / (bb.max.y - bb.min.y); o.scale.setScalar(s);
      o.updateMatrixWorld(true); bb.setFromObject(o); const c = bb.getCenter(new THREE.Vector3()); o.position.set(-c.x, -bb.min.y, -c.z);
      w.position.set(0, y, Zd); w.rotation.y = 0;
      const anims = src.userData.animations ?? [];
      if (anims.length) { const mixer = new THREE.AnimationMixer(o); const acts = anims.map((a) => { const ac = mixer.clipAction(a); ac.setLoop(THREE.LoopOnce, 1); ac.clampWhenFinished = true; return ac; }); ctx.vault.door = { mixer, acts, opened: false, group: w }; }
      return w;
    }));
    ctx.vault.doorBlock = { x: 0, y: y + 2.3, z: Zd, open: false };
    // 深库主室
    room(b, world, M, -X, X, Zd, Z1, y, H, 'blackFloor', 'vaultWall', { noFront: true });
    for (const sx of [-1, 1]) b.box('vaultWall', X - 6, H, 0.8, [sx * (6 + (X - 6) / 2), y + H / 2, Zd], { uv: 0.3, collide: true });
    // 金库门的临时碰撞墙（开门后移除通行限制：用体积判断）
    // 中央：金色收容法阵
    { const r = new THREE.RingGeometry(3.4, 3.55, 96); r.rotateX(-Math.PI / 2); b.add('gold', r, { pos: [0, y + 0.012, -117] }, { uv: 1 }); const r2 = new THREE.RingGeometry(2.2, 2.26, 96); r2.rotateX(-Math.PI / 2); b.add('gold', r2, { pos: [0, y + 0.012, -117] }, { uv: 1 }); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; b.box('gold', 0.04, 0.012, 1.1, [Math.cos(a) * 2.85, y + 0.012, -117 + Math.sin(a) * 2.85], { uv: 1, rot: [0, -a + Math.PI / 2, 0] }); } }
    // 单件收容室：两侧各 3 间玻璃隔间
    const cells = [
      { id: 'clock', x: -9, z: -108 }, { id: 'frame', x: 9, z: -108 },
      { id: 'skull', x: -9, z: -118 }, { id: 'lantern', x: 9, z: -118 },
      { id: 'bronze', x: -9, z: -128 }, { id: 'mirror', x: 9, z: -128 },
    ];
    for (const c of cells) cell(b, zone, world, M, Mx, c.x, y, c.z, c.x < 0 ? 1 : -1);
    // 01 回响座钟（玻璃罩里，钟摆停在 3:07）
    { const c = cells[0]; zone.add(grandClock(M, [c.x - 0.6, y + 0.3, c.z], Math.PI / 2)); b.box('blackMarble', 1.4, 0.3, 1.4, [c.x - 0.6, y + 0.15, c.z], { uv: 0.6 }); b.add('glassClear', new THREE.CylinderGeometry(0.62, 0.62, 2.8, 32, 1, true), { pos: [c.x - 0.6, y + 1.7, c.z] }, { uv: false }); b.add('glassClear', new THREE.SphereGeometry(0.62, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), { pos: [c.x - 0.6, y + 3.1, c.z] }, { uv: false });
      const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), tagMaterial('【回响座钟】 B5-01')); lb.position.set(c.x + 0.63, y + 1.0, c.z + 0.9); lb.rotation.y = Math.PI / 2; zone.add(lb); ctx.anchors.doc_vault_label_clock = { obj: lb, range: 3.4 };
      spot(zone, 0xffe2b0, 40, [c.x - 0.6, y + H - 0.4, c.z], [c.x - 0.6, y + 1.5, c.z], 0.45, true, 9); }
    // 02 活人相框（相框里有一个人在敲玻璃，举着纸）
    { const c = cells[1]; const fr = frameWithPerson(); fr.position.set(c.x + 0.9, y + 1.7, c.z); fr.rotation.y = -Math.PI / 2; zone.add(fr); ctx.vault.frame = fr;
      b.box('blackMarble', 0.5, 1.0, 1.6, [c.x + 1.1, y + 0.5, c.z], { uv: 0.6 });
      const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), tagMaterial('【活人相框】 B5-02')); lb.position.set(c.x - 0.63, y + 1.0, c.z + 0.9); lb.rotation.y = -Math.PI / 2; zone.add(lb); ctx.anchors.doc_vault_label_frame = { obj: lb, range: 3.4 };
      ctx.anchors.int_vault_frame = { obj: fr.userData.glass, range: 1.4 };
      spot(zone, 0xfff0e0, 30, [c.x, y + H - 0.4, c.z], [c.x + 0.9, y + 1.7, c.z], 0.4, false, 9); }
    // 03 宝石骷髅 / 04 生锈提灯 / 05 青铜器 / 06 镜子
    const ped = (c, model, h, extra = {}) => { b.box('blackMarble', 0.9, 1.0, 0.9, [c.x + (c.x < 0 ? -0.6 : 0.6), y + 0.5, c.z], { uv: 0.6, collide: true }); add(placeModel(model, { height: h, pos: [c.x + (c.x < 0 ? -0.6 : 0.6), y + 1.0, c.z], rotY: extra.rotY ?? (c.x < 0 ? Math.PI / 2 : -Math.PI / 2) })); spot(zone, extra.color ?? 0xffe6c8, 30, [c.x, y + H - 0.4, c.z], [c.x + (c.x < 0 ? -0.6 : 0.6), y + 1.2, c.z], 0.4, false, 9); };
    ped(cells[2], 'gem_skull', 0.35, { color: 0xc8d8ff });
    ped(cells[3], 'rusty_lantern', 0.5, { color: 0xffb070 });
    ped(cells[4], 'bronze_fangyi', 0.55);
    add(placeModel('ornate_mirror', { height: 2.0, pos: [cells[5].x + 1.4, y, cells[5].z], rotY: -Math.PI / 2 }));
    spot(zone, 0xe0e8ff, 26, [cells[5].x, y + H - 0.4, cells[5].z], [cells[5].x + 1.2, y + 1.2, cells[5].z], 0.45, false, 9);
    for (const [c, n] of [[cells[2], '【宝石骷髅】 B5-03'], [cells[3], '【生锈提灯】 B5-04'], [cells[4], '【青铜方彝】 B5-05'], [cells[5], '【空镜】 B5-06']]) { const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), tagMaterial(n)); lb.position.set(c.x + (c.x < 0 ? 0.63 : -0.63), y + 1.0, c.z + 0.9); lb.rotation.y = c.x < 0 ? Math.PI / 2 : -Math.PI / 2; zone.add(lb); }
    // 北端：通往书芯的封死后门（v4 墨渊入口预留）
    b.box('blackMetal', 3.2, 4.4, 0.3, [0, y + 2.2, Z1 + 0.25], { uv: 0.6 });
    for (let k = 0; k < 6; k++) b.box('iron', 3.4, 0.14, 0.4, [0, y + 0.5 + k * 0.7, Z1 + 0.35], { uv: 1 });
    const seal = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.6), sealMaterial()); seal.position.set(0.4, y + 2.0, Z1 + 0.58); seal.rotation.z = 0.12; zone.add(seal);
    const em = emblem(0.7, M.goldBright, M.navy); em.position.set(0, y + 5.2, Z1 + 0.5); zone.add(em);
    // 灯：冷暗 + 细金线
    rectLight(zone, 0x8ea6d8, 0.3, 26, 30, [0, y + H - 0.3, -117], [0, y, -117]); // M4：压低补光，深库更戏剧
    point(zone, 0xffc880, 6, [0, y + 4, -117], 10);
    spot(zone, 0xffd090, 90, [0, y + H - 0.2, -117], [0, y, -117], 0.6, true, 12);
    for (let z = Zd - 4; z > Z1 + 2; z -= 5) { b.box('gold', 0.06, 0.06, 4.4, [-3.6, y + H - 0.1, z], { uv: 1 }); b.box('gold', 0.06, 0.06, 4.4, [3.6, y + H - 0.1, z], { uv: 1 }); }
    const ln = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, Zd - Z1 - 2), Mx.lampAmber); ln.position.set(0, y + H - 0.05, (Zd + Z1) / 2); zone.add(ln);
    world.surface(-X, Z1, X, Z0, 'marble', y - 1, y + 3);
  }

  Z.B3.add(dust([0, LEVELS.B3, -110], [36, 6, 36], 260, 0xdfe8ff));
  Z.B5.add(dust([0, LEVELS.B5, -117], [24, 7, 30], 220, 0xffe2b0));
  for (const n of Object.keys(LEVELS)) { B[n].build(Z[n], { ...M, ...Mx }); for (const geo of B[n].colliders) world.addGeo(geo); }
  T('vault built');
  return Promise.all(jobs).then(() => Z);
}

// ———————— 结构件 ————————
export function vaultMats(M) {
  const tint = (m, c, extra = {}, w = { macro: 0.25, grime: 0.5, streak: 0.3, ground: -60 }) => { const n = m.clone(); n.userData = {}; n.color = new THREE.Color(c); Object.assign(n, extra); return weather(n, w); };
  return {
    concreteFloor: tint(M.concrete, 0x6a6a6c, { roughness: 0.55 }),
    concreteWall: tint(M.phConcrete, 0x6a6e74), // 批次8：Poly Haven concrete_wall_008（原 ambientCG Concrete036）
    vaultWall: tint(M.phBlocks, 0x5c5a56), // 批次8：B 层石墙 Poly Haven medieval_blocks_02（原 Marble016 深色着色，像岩壁）
    darkTile: tint(M.hallFloorDark, 0x34363c, { roughness: 0.62, clearcoat: 0.0, envMapIntensity: 0.3 }),
    blackFloor: tint(M.blackMarble, 0x2e2e34, { roughness: 0.55, clearcoat: 0.08, clearcoatRoughness: 0.4, envMapIntensity: 0.35 }),
    hazard: hazardMaterial(),
    whitePad: weather(new THREE.MeshStandardMaterial({ color: 0xd8d6d0, roughness: 0.92 }), { macro: 0.12, grime: 0.4, ground: -60 }),
    mirrorGlass: new THREE.MeshPhysicalMaterial({ color: 0x101418, metalness: 0.9, roughness: 0.05, envMapIntensity: 1.4 }),
    evLabel: new THREE.MeshStandardMaterial({ color: 0xf2efe4, roughness: 0.8 }),
    lampAmber: new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffa040, emissiveIntensity: 5, roughness: 0.5 }),
    elevDoor: new THREE.MeshStandardMaterial({ color: 0xd8b060, metalness: 1, roughness: 0.22, map: pageReliefTexture(), bumpMap: pageReliefTexture(), bumpScale: 1.5 }),
  };
}
/** 矩形房间（地板/天花/四墙，可在南墙开门，北墙开洞） */
export function room(b, world, M, x0, x1, z0, z1, y, h, floor, wall, o = {}) {
  b.box(floor, x1 - x0, 0.2, z0 - z1, [(x0 + x1) / 2, y - 0.1, (z0 + z1) / 2], { uv: 0.3, collide: true });
  b.box(o.ceil ?? wall, x1 - x0, 0.3, z0 - z1, [(x0 + x1) / 2, y + h + 0.15, (z0 + z1) / 2], { uv: 0.25 });
  wallX(b, wall, x0 - 0.2, z0, z1, y, h, 0.4, o.westHoles ?? [], true);
  wallX(b, wall, x1 + 0.2, z0, z1, y, h, 0.4, [], true);
  if (!o.noFront) wallZ(b, wall, z0, x0, x1, y, h, 0.4, o.frontHole ? [o.frontHole] : o.doorX ? [{ x0: o.doorX[0], x1: o.doorX[1], h: 3.2 }] : [], true);
  if (!o.noBack) wallZ(b, wall, z1, x0, x1, y, h, 0.4, o.backHoles ?? (o.backHole ? [{ x0: o.backHole[0], x1: o.backHole[1], h: o.backHole[2] }] : []), true);
  // 踢脚线 + 墙裙金线
  for (const x of [x0 + 0.02, x1 - 0.02]) { b.box('stoneDark', 0.06, 0.18, z0 - z1, [x, y + 0.09, (z0 + z1) / 2], { uv: 1 }); b.box('brass', 0.03, 0.03, z0 - z1, [x, y + 1.2, (z0 + z1) / 2], { uv: 1 }); }
}
/** 电梯厅：南墙两扇书页浮雕金门（x=±6），楼层铭牌，安全须知 */
export function elevatorHall(b, zone, world, ctx, M, Mx, name, y) {
  const Z0 = EZ, Z1 = -92, X = 9, H = 5.2;
  // 批次20 中央竖井：洞口 x −1.8…1.8，z −89.2…−86.4（B3/B4 地面开洞、B4/B5 顶板开洞；地面碰撞仍整块，栏杆另有碰撞）
  const SPN = R3['spine_' + name.toLowerCase()] === true, hx = 1.8, hz0 = -89.2, hz1 = -86.4;
  const slab = (m, yy, th, hole, o) => { if (!hole) { b.box(m, 2 * X, th, Z0 - Z1, [0, yy, (Z0 + Z1) / 2], o); return; }
    b.box(m, 2 * X, th, Z0 - hz1, [0, yy, (Z0 + hz1) / 2], o); b.box(m, 2 * X, th, hz0 - Z1, [0, yy, (hz0 + Z1) / 2], o);
    for (const s of [-1, 1]) b.box(m, X - hx, th, hz1 - hz0, [s * (X + hx) / 2, yy, (hz0 + hz1) / 2], o); };
  const BM = name[0] === 'B'; // 批次22：B 层电梯厅地下化——乱石墙 / 蓝调深砖地 → 素混凝土墙顶 + 哑光环氧地坪（墙裙 / 灯 / 设施见 r3plan basementHall）
  if (BM) { const D = dressMats(M); M.r3_bunkerConc = M.r3_bunkerConc ?? D.r3_bunkerConc; M.r3_epoxy = M.r3_epoxy ?? D.r3_epoxy; for (const k of ['r3_steelGrey', 'r3_steelOld', 'dz_brassDim', 'r3_consoleSteel']) M[k] = M[k] ?? D[k]; }
  const WM = BM ? 'r3_bunkerConc' : 'vaultWall';
  slab(BM ? 'r3_epoxy' : 'darkTile', y - 0.1, 0.2, SPN && name !== 'B5', { uv: 0.3 }); world.box(0, y - 0.1, (Z0 + Z1) / 2, 2 * X, 0.2, Z0 - Z1);
  slab(WM, y + H + 0.15, 0.3, SPN && name !== 'B3', { uv: 0.25 });
  wallX(b, WM, -X - 0.2, Z0, Z1, y, H, 0.4, [], true); wallX(b, WM, X + 0.2, Z0, Z1, y, H, 0.4, [], true);
  wallZ(b, WM, Z0, -X, X, y, H, 0.4, [], true);
  if (name !== 'B3') wallZ(b, WM, Z1, -X, X, y, H, 0.4, [{ x0: -2.2, x1: 2.2, h: 3.2 }], true);
  // 批次12 收尾返工（用户 22:20：上层电梯厅乱石墙像洞穴、偏粉、空）：R3 上层电梯厅墙面 = 胡桃木墙裙 + 方石上墙 + 黑石壁柱，顶棚 = 藻井；门两侧铜框立柱 + 楼层指示器；暖白光
  const UP = R3['lobby_' + name] === true; const dz = UP ? 0.1 : 0; // 墙面布景厚约 0.085 → 墙上件前移 0.1
  if (UP) { dressMats(M);
    roomDress(b, -X, X, Z0 - 0.2, Z1 + 0.2, y, H - 0.04, { // 批次13：檐口顶到藻井下沿（原 H−0.4 露出 0.4 m 粉色乱石带）
      style: 'office', over: { up: 'dz_ashlarEC' }, upOff: [0, 1.43 - y], pil: true, pitch: 3.0, sconce: false,
      s: { skip: [[X - 6 - 1.95, X - 6 + 1.95], [X + 6 - 1.95, X + 6 + 1.95]], pilSkip: [[X - 0.95, X + 0.95]] }, // 批次13：南墙正中壁柱挡住楼层铭牌 → 让开
      n: { skip: [[X - 2.3, X + 2.3]] } });
    coffered(b, -X, X, Z0, Z1, y + H, { cell: 3.0, depth: 0.36, lights: true, lightEvery: 1 }); }
  // 门
  for (const x of [-6, 6]) {
    const f = new Frame([x, y, Z0 - 0.21], Math.PI);
    if (BM) { // 批次23：B 层电梯门套——金色哥特拱 → 方形门套（客梯暗铜 / 货梯钢），厚门框 + 门楣 + 底座 + 门头钢板
      const D = dressMats(M); const fm = x < 0 ? 'r3_brassAged' : 'r3_steelGrey'; /* 批次24：暗铜做旧 */ M[fm] = M[fm] ?? D[fm]; M.r3_steelOld = M.r3_steelOld ?? D.r3_steelOld; M.blackMetal = M.blackMetal ?? D.blackMetal;
      for (const s of [-1, 1]) { b.add(fm, new THREE.BoxGeometry(0.28, 3.6, 0.42), f.at(s * 1.36, 1.8, 0.0), { uv: 1 }); b.add('r3_steelOld', new THREE.BoxGeometry(0.36, 0.22, 0.46), f.at(s * 1.36, 0.11, 0.0), { uv: 1 }); }
      b.add(fm, new THREE.BoxGeometry(3.0, 0.3, 0.42), f.at(0, 3.45, 0.0), { uv: 1 });
      b.add(fm, new THREE.BoxGeometry(3.2, 0.06, 0.48), f.at(0, 3.63, 0.0), { uv: 1 });
      b.add('r3_steelOld', new THREE.BoxGeometry(3.0, 0.7, 0.05), f.at(0, 3.95, -0.16), { uv: 1 });
      b.add('stoneDark', new THREE.BoxGeometry(2.48, 0.06, 0.5), f.at(0, 0.03, 0.05), { uv: 1 }); // 门槛
    } else {
    b.add('stoneDark', archRingGeo(3.6, 3.4, 2.4, 3.4, 0.4), f.at(0, 0, 0.0), { uv: 0.5 });
    b.add('gold', archRingGeo(3.7, 3.4, 3.6, 3.4, 0.42), f.at(0, 0, 0.0), { uv: 1 }); }
    if (BM) { // 批次23 看图：B 层门扇仍是金色书页浮雕（上层风格）→ 客梯拉丝钢门扇 + 中缝 + 视窗条；货梯同（门框钢）
      for (const s of [-1, 1]) { b.add('r3_consoleSteel', new THREE.BoxGeometry(1.18, 3.3, 0.08), f.at(s * 0.6, 1.65, 0.05), { uv: 1 }); /* 看图 r3_steelGrey 门扇近白平板 → 灰绿喷漆钢（带污渍） */ b.add('r3_steelOld', new THREE.BoxGeometry(1.0, 0.04, 0.02), f.at(s * 0.6, 1.1, 0.1), { uv: 1 }); b.add('r3_steelOld', new THREE.BoxGeometry(1.0, 0.04, 0.02), f.at(s * 0.6, 2.4, 0.1), { uv: 1 }); }
    } else
    for (const s of [-1, 1]) b.add('elevDoor', new THREE.BoxGeometry(1.18, 3.3, 0.08), f.at(s * 0.6, 1.65, 0.05), { uv: false });
    if (UP) b.add('dz_pil', new THREE.BoxGeometry(3.9, H - 3.34, 0.01), f.at(0, 3.3 + (H - 3.34) / 2, -0.005), { uv: 0.5 }); // 批次13：门头拱内补黑石门楣板（原露出乱石）
    if (UP) { for (const s of [-1, 1]) { b.add('brass', new THREE.BoxGeometry(0.2, 3.9, 0.16), f.at(s * 1.98, 1.95, 0.02), { uv: 1 }); b.add('dz_pil', new THREE.BoxGeometry(0.3, 0.2, 0.2), f.at(s * 1.98, 0.1, 0.02), { uv: 1 }); b.add('dz_pil', new THREE.BoxGeometry(0.3, 0.16, 0.2), f.at(s * 1.98, 3.98, 0.02), { uv: 1 }); }
      b.add('brass', new THREE.BoxGeometry(4.2, 0.12, 0.16), f.at(0, 4.12, 0.02), { uv: 1 });
      const ind = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.24), floorIndicatorMat(name)); ind.applyMatrix4(f.at(0, 3.72, 0.12)); zone.add(ind); b.add('brass', new THREE.BoxGeometry(0.7, 0.32, 0.03), f.at(0, 3.72, 0.1), { uv: 1 }); }
    b.add('iron', new THREE.BoxGeometry(0.03, 3.3, 0.1), f.at(0, 1.65, 0.05), { uv: 1 });
    const pnl = new THREE.Group(); const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.05), M.brass); pnl.add(base);
    const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 20), new THREE.MeshStandardMaterial({ color: 0x201a10, emissive: 0xffc35a, emissiveIntensity: 1.6 })); bt.rotation.x = Math.PI / 2; bt.position.z = -0.035; pnl.add(bt);
    if (UP) { const bp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.62, 0.03), M.brass); bp.position.set(0, 0, 0.012); pnl.add(bp); const b2 = bt.clone(); b2.position.y = -0.12; bt.position.y = 0.12; pnl.add(b2); }
    pnl.position.set(x + (x > 0 ? 2.0 : -2.0) + (UP ? (x > 0 ? 0.45 : -0.45) : 0), y + 1.3, Z0 - 0.23 - dz); zone.add(pnl);
    ctx.elevatorCalls.push({ obj: pnl, x, floor: name });
  }
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), UP ? floorPlateMat(name, UP_TEXT[name] ?? []) : brassPlaqueMaterial(name, [HALL_TEXT[name] ?? ''])); // 批次13：上层原用竖版铜牌贴图拉伸到横版且无文字 → 横版深铜底金字楼层牌
  plate.position.set(0, y + 2.2, Z0 - 0.22 - dz); plate.rotation.y = Math.PI; zone.add(plate);
  if (name === 'B3') ctx.anchors.doc_spine_floorplate_b3 = plate;
  if (name === 'B4') { const sf = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.6), signMaterial('电梯安全须知', ['若电梯显示不存在的楼层', '请勿出梯', '', '若轿厢内多出一名乘客', '请不要数人数'], 420, 600)); sf.position.set(-3.0, y + 1.6, Z0 - 0.22); sf.rotation.y = Math.PI; zone.add(sf); ctx.anchors.doc_spine_safety = sf; }
  const nm = goldText(name, 1.0, 0.7, M.goldBright, { res: 160 }); nm.position.set(0, y + (UP ? 3.7 : 4.1), Z0 - 0.22 - dz); nm.rotation.y = Math.PI; zone.add(nm);
  if (!UP) for (const x of (SPN ? [-6, 6] : [-6, 0, 6])) { b.box('blackMetal', 1.6, 0.06, 0.4, [x, y + H - 0.03, -88], { uv: 1 }); const l = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.03, 0.26), Mx.lampAmber); l.position.set(x, y + H - 0.07, -88); zone.add(l); }
  point(zone, UP ? 0xfff0dc : 0xffd0a0, BM ? 11 : 8, [0, y + 4, -88], 12); // 批次23：B 层整体提亮一档
  if (BM) point(zone, 0xf2e8d6, 4.5, [0, y + 3.4, Z1 + 1.6], 10); // 批次24：北墙（远端）补光，看图北墙仍偏暗
  rectLight(zone, 0xffe8c8, 1.2, 16, 6, [0, y + H - 0.2, -88], [0, y, -88]);
}
const UP_TEXT = { '2F': ['国际联络处', '宣传处 · 新闻发布厅'], '3F': ['政策研究室 · 法务处', '医务室 · 观察病房'], '4F': ['典籍藏书阁', '阅览 · 借阅 · 古籍修复'], '12F': ['局长室', '机要室 · 会客厅'] };
function floorPlateMat(name, lines) { // 横版楼层牌：深铜底 + 金色描边 + 大号楼层 + 两行科室
  const W = 1024, H = 512; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a2016'); g.addColorStop(1, '#17110b'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#c9a052'; c.lineWidth = 10; c.strokeRect(22, 22, W - 44, H - 44); c.lineWidth = 3; c.strokeRect(44, 44, W - 88, H - 88);
  c.fillStyle = '#e6c67c'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = '900 210px "NB Title","NB Serif",serif'; c.fillText(name, 90, H / 2 + 8);
  c.fillStyle = '#c9a052'; c.fillRect(name.length > 2 ? 470 : 400, 120, 4, H - 240);
  c.fillStyle = '#e8d6a8'; c.font = '700 58px "NB Serif",serif'; lines.forEach((l, i) => c.fillText(l, name.length > 2 ? 505 : 435, H / 2 - 50 + i * 100));
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: t, metalness: 0.35, roughness: 0.45, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.08 });
}
function floorIndicatorMat(name) { // 电梯门头楼层指示器：黑底琥珀数码 + 上下箭头
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 100; const c = cv.getContext('2d'); c.fillStyle = '#0b0906'; c.fillRect(0, 0, 256, 100);
  c.fillStyle = '#ffb648'; c.font = '700 64px "NB Serif","Noto Serif SC",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, 150, 54);
  c.beginPath(); c.moveTo(40, 22); c.lineTo(58, 44); c.lineTo(22, 44); c.fill(); c.globalAlpha = 0.3; c.beginPath(); c.moveTo(40, 80); c.lineTo(58, 58); c.lineTo(22, 58); c.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.4, roughness: 0.3 });
}
/** 气闸门：两扇厚钢推拉门（常开），门框黄黑警示 */
function airlock(b, zone, M, Mx, x, y, z) {
  b.box('hazard', 4.8, 0.4, 0.5, [x, y + 3.4, z], { uv: 0.8 });
  for (const s of [-1, 1]) { b.box('hazard', 0.3, 3.2, 0.5, [x + s * 2.35, y + 1.6, z], { uv: 0.8 }); b.box('steel', 2.0, 3.1, 0.25, [x + s * 3.4, y + 1.55, z - 0.35], { uv: 0.8 }); }
}
/** 钢架货架（长 L，深 d，高 h，lv 层） */
export function steelShelf(b, world, cx, y, z, L, d, h, lv) {
  for (let i = 0; i <= Math.round(L / 2.3); i++) { const x = cx - L / 2 + i * (L / Math.round(L / 2.3)); for (const dz of [-d / 2, d / 2]) b.box('paintedGreen', 0.06, h, 0.06, [x, y + h / 2, z + dz], { uv: 1 }); }
  for (let k = 0; k < lv; k++) { b.box('steel', L, 0.04, d, [cx, y + 0.12 + k * 0.9, z], { uv: 1 }); b.box('hazard', L, 0.05, 0.01, [cx, y + 0.12 + k * 0.9, z + d / 2 + 0.01], { uv: 0.8 }); }
  world.box(cx, y + h / 2, z, L, h, d + 0.1);
}
/** 单件收容室：前面玻璃墙 + 侧墙 + 门框金线；dir=+1 表示房间在西侧（玻璃朝东） */
function cell(b, zone, world, M, Mx, x, y, z, dir) {
  const W = 4.4, D = 4.2, H = 4.0;
  const gx = x + dir * 0.6; // 玻璃墙位置（靠中轴一侧）
  b.box('glassClear', 0.04, H, W - 0.2, [gx + dir * 0.0, y + H / 2, z], { uv: false });
  world.box(gx, y + H / 2, z, 0.12, H, W);
  for (const dz of [-W / 2, W / 2]) { b.box('blackMetal', 0.14, H, 0.14, [gx, y + H / 2, z + dz], { uv: 1 }); b.box('vaultWall', D, H, 0.3, [gx - dir * D / 2, y + H / 2, z + dz], { uv: 0.3, collide: true }); }
  b.box('blackMetal', 0.14, 0.14, W, [gx, y + H, z], { uv: 1 }); b.box('vaultWall', D + 0.3, 7 - H, W + 0.3, [gx - dir * D / 2, y + H + (7 - H) / 2, z], { uv: 0.3 });
  b.box('gold', 0.05, 0.05, W, [gx + dir * 0.08, y + 0.05, z], { uv: 1 });
  b.box('gold', 0.05, 0.05, W, [gx + dir * 0.08, y + H - 0.06, z], { uv: 1 });
  // 观察窗边的双人锁
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.2), M.brass); lock.position.set(gx + dir * 0.09, y + 1.3, z + W / 2 - 0.4); zone.add(lock);
}

// ———————— 程序化道具与贴图 ————————
export function hazardMaterial() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  c.fillStyle = '#d8a812'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#16140f';
  for (let i = -128; i < 256; i += 48) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 24, 0); c.lineTo(i + 24 + 128, 128); c.lineTo(i + 128, 128); c.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, metalness: 0.2 });
}
const _tagCache = new Map();
export function tagMaterial(text) {
  if (_tagCache.has(text)) return _tagCache.get(text);
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160; const c = cv.getContext('2d');
  c.fillStyle = '#efe9d8'; c.fillRect(0, 0, 512, 160); c.strokeStyle = '#7a1a1a'; c.lineWidth = 6; c.strokeRect(6, 6, 500, 148);
  c.fillStyle = '#7a1a1a'; c.fillRect(6, 6, 90, 148); c.fillStyle = '#f2e6c8'; c.font = '900 40px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('证', 51, 58); c.fillText('物', 51, 108);
  c.fillStyle = '#1a1612'; c.textAlign = 'left'; c.font = '900 38px \"NB Title\", \"NB Serif\", serif'; c.fillText(text, 112, 64, 384); c.font = '24px "NB Sans", sans-serif'; c.fillStyle = '#5a5248'; c.fillText('叙事管理局 · 收容库　请勿触碰', 112, 118, 384);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.75 }); _tagCache.set(text, m); return m;
}
function clipTexture() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 340; const c = cv.getContext('2d');
  c.fillStyle = '#ece6d4'; c.fillRect(0, 0, 256, 340); c.fillStyle = '#1a1612'; c.font = '900 20px \"NB Title\", \"NB Serif\", serif'; c.fillText('事故报告', 16, 34);
  c.font = '13px "NB Sans", sans-serif'; c.fillStyle = '#3a342c'; ['B5-01 回响座钟 误敲一次', '值班员认为今天是', '2023 年 6 月 8 日', '持续 7 小时'].forEach((l, i) => c.fillText(l, 16, 70 + i * 22));
  c.fillStyle = '#9a9286'; for (let y = 170; y < 320; y += 14) c.fillRect(16, y, 160 + ((y * 13) % 70), 5);
  c.strokeStyle = '#a01818'; c.lineWidth = 3; c.beginPath(); c.arc(196, 290, 30, 0, Math.PI * 2); c.stroke();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function sealMaterial() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 400; const c = cv.getContext('2d');
  c.fillStyle = '#efe8d4'; c.fillRect(0, 0, 128, 400); c.fillStyle = '#a01818'; c.font = '900 44px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'center';
  '封存　墨渊'.split('').forEach((ch, i) => c.fillText(ch, 64, 70 + i * 66));
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, side: THREE.DoubleSide });
}
let _relief = null;
function pageReliefTexture() {
  if (_relief) return _relief;
  // 金门浮雕：翻开的书页与竖排细字纹
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; const c = cv.getContext('2d');
  c.fillStyle = '#808080'; c.fillRect(0, 0, 256, 512);
  c.strokeStyle = '#d0d0d0'; c.lineWidth = 6; c.strokeRect(14, 14, 228, 484); c.lineWidth = 2; c.strokeRect(26, 26, 204, 460);
  c.fillStyle = '#b0b0b0'; for (let x = 44; x < 216; x += 14) for (let y = 60; y < 300; y += 12) if (Math.random() > 0.25) c.fillRect(x, y, 8, 6);
  c.strokeStyle = '#e0e0e0'; c.lineWidth = 4; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(128, 330); c.quadraticCurveTo(128 - 40 - k * 10, 360 - k * 6, 40 + k * 4, 340 - k * 10); c.stroke(); c.beginPath(); c.moveTo(128, 330); c.quadraticCurveTo(128 + 40 + k * 10, 360 - k * 6, 216 - k * 4, 340 - k * 10); c.stroke(); }
  c.beginPath(); c.moveTo(128, 320); c.lineTo(128, 470); c.stroke();
  _relief = new THREE.CanvasTexture(cv); _relief.colorSpace = THREE.NoColorSpace; return _relief;
}
function riceCooker() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.22, 24), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.3 })); body.position.y = 0.11; g.add(body);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.3 })); lid.position.y = 0.22; lid.scale.y = 0.4; g.add(lid); g.userData.lid = lid;
  const led = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff4020, emissiveIntensity: 2 })); led.position.set(0, 0.12, 0.165); g.add(led);
  return g;
}
function frameWithPerson() {
  const g = new THREE.Group();
  const W = 1.1, H = 1.4;
  const outer = new THREE.Mesh(new THREE.BoxGeometry(W + 0.24, H + 0.24, 0.1), new THREE.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 1, roughness: 0.35 })); g.add(outer);
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 320;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 })); pic.position.z = 0.051; g.add(pic);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.12, envMapIntensity: 1.6 })); glass.position.z = 0.06; g.add(glass);
  g.userData = { cv, tex, glass, t: 0 };
  drawFrame(g, 0);
  return g;
}
export function drawFrame(g, t) {
  const { cv, tex } = g.userData; const c = cv.getContext('2d');
  c.fillStyle = '#2a2620'; c.fillRect(0, 0, 256, 320);
  const gr = c.createRadialGradient(128, 140, 10, 128, 160, 200); gr.addColorStop(0, '#6a5e4c'); gr.addColorStop(1, '#1a1612'); c.fillStyle = gr; c.fillRect(0, 0, 256, 320);
  // 敲玻璃：手臂周期性前伸，人物轻微晃动
  const knock = Math.max(0, Math.sin(t * 6)) * (Math.sin(t * 0.7) > 0.2 ? 1 : 0);
  const sway = Math.sin(t * 0.9) * 4;
  c.fillStyle = '#0e0c0a';
  c.beginPath(); c.ellipse(128 + sway, 104, 26, 32, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(80 + sway, 320); c.quadraticCurveTo(84 + sway, 150, 128 + sway, 140); c.quadraticCurveTo(172 + sway, 150, 176 + sway, 320); c.fill();
  // 举着的纸
  c.save(); c.translate(88 + sway, 210); c.rotate(-0.08); c.fillStyle = '#e8e2d0'; c.fillRect(-46, -30, 92, 64);
  c.fillStyle = '#2a2018'; c.font = '900 11px \"NB Title\", \"NB Serif\", serif'; c.textAlign = 'center'; c.fillText('别相信第七局', 0, -6); c.fillText('也别相信我', 0, 14); c.restore();
  // 敲玻璃的手
  c.fillStyle = '#c8a888'; c.beginPath(); c.ellipse(180 + sway, 150 - knock * 6, 12 + knock * 6, 14 + knock * 6, 0, 0, Math.PI * 2); c.fill();
  tex.needsUpdate = true;
}
export function beacon(M) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.1, 16), M.blackMetal); g.add(base);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x401008, emissive: 0xff5020, emissiveIntensity: 2.0, transparent: true, opacity: 0.85 })); dome.position.y = 0.05; g.add(dome);
  const l = new THREE.SpotLight(0xff5020, 30, 14, 0.5, 0.5, 1.5); l.position.y = 0.08; const tg = new THREE.Object3D(); tg.position.set(1, -0.3, 0); g.add(l, tg); l.target = tg; g.userData.rot = tg; g.userData.light = l;
  return g;
}

/** 每帧：金库门动画、闪烁灯管、旋转警示灯、相框里的人、电饭锅盖 */
export function updateVault(ctx, dt, t, playerPos) {
  const v = ctx.vault; if (!v) return;
  if (v.door) {
    v.door.mixer.update(dt);
    if (!v.door.opened && playerPos && playerPos.y < LEVELS.B5 + 3 && playerPos.y > LEVELS.B5 - 2 && playerPos.z < -94 && playerPos.z > -99.5 && Math.abs(playerPos.x) < 3) {
      v.door.opened = true; for (const a of v.door.acts) a.reset().play(); v.onDoorOpen?.();
    }
  }
  for (const f of v.flicker ?? []) f.material.emissiveIntensity = Math.sin(t * 37 + f.position.x) > 0.93 ? 0.4 : 5;
  for (const bc of v.beacons ?? []) { const a = t * 3; bc.userData.rot.position.set(Math.cos(a), -0.3, Math.sin(a)); }
  if (v.frame) { v.frame.userData.t += dt; if ((v.frame.userData.acc = (v.frame.userData.acc ?? 0) + dt) > 0.08) { v.frame.userData.acc = 0; drawFrame(v.frame, v.frame.userData.t); } }
  if (v.cooker) v.cooker.userData.lid.position.y = 0.22 + Math.max(0, Math.sin(t * 9)) * (Math.sin(t * 0.5) > 0.85 ? 0.012 : 0);
}

/** 书脊井电梯：呼梯面板 → 楼层选择 → 黑场转场 → 到站；B6+关门 7 秒 → B7 彩蛋 */
export function setupElevator(G, { toast, dialog, fade, runInteractable }) {
  const { inter, ctx, audio, player } = G;
  const DEST = (to, x) => to === '1F' ? { pos: [x, FLOOR + 0.05, -73.2], yaw: Math.PI } : { pos: [x, FLOORS[to].y + 0.05, -86.4], yaw: 0 };
  let busy = false;
  const ride = async (from, to, x) => {
    busy = true; G.freeze(true); audio.sfx('S13', 0.6); fade(true);
    await sleep(700); audio.sfx('S14', 0.7);
    const d = DEST(to, x); player.pos.set(...d.pos); player.vel?.set(0, 0, 0); player.yaw = d.yaw; player.pitch = 0;
    await sleep(Math.min(2600, 900 + Math.abs(levelY(from) - levelY(to)) * 60));
    audio.sfx('S13', 0.7); fade(false); G.freeze(false); busy = false;
  };
  for (const c of ctx.elevatorCalls ?? []) {
    inter.add({
      id: 'elev_' + c.floor + '_' + c.x, obj: c.obj, range: 2.6, prompt: () => '按 E 呼叫电梯',
      enabled: () => !busy,
      use: async () => {
        if (!content.has('item_badge')) { toast('面板没有反应。\n需要入职证刷卡。'); return; }
        const L = 'ABCDEFGHIJ'; const keys = ['1F', ...FLOOR_ORDER.filter((k) => FLOORS[k])].filter((k) => k !== c.floor);
        const opts = keys.map((k, i) => [L[i], k, k === '1F' ? '1F　安检大厅' : FLOORS[k].label + (WIP.has(k) ? '　（施工中）' : '')]);
        if (!FLOORS.B6) opts.push([L[opts.length], 'B6x', 'B6　驯化副本训练场（需教官授权）']);
        opts.push([L[opts.length], 'B6+', '（同时按住 B6 与关门键）'], [L[opts.length + 1], null, '离开']);
        const choice = await dialog([`（书脊井 · ${c.floor}。轿厢面板：12F…1F，B1–B6。没有 B7。）`, ...opts.map((o) => `> 选项 ${o[0]}：${o[2]}`)]);
        const pick = opts.find((o) => o[0] === choice); if (!pick || !pick[1]) return;
        if (pick[1] === 'B6x') { toast('B6 的按钮是暗的：「训练场 · 需教官授权」。'); return; }
        if (pick[1] === 'B6+') {
          G.freeze(true); toast('（你按住两个按钮。）', { ms: 7000, whisper: true }); await sleep(7000); G.freeze(false);
          const it = content.get('int_spine_b7'); if (it) await runInteractable(G, it, null); G.glitch?.(1.2); if (G.toSeventh) { await sleep(1200); await G.toSeventh(); } return; // M5：B7 → 装订线
        }
        if (WIP.has(pick[1])) { toast(`${pick[1]} 的按钮贴着一张黄条：「施工中 · 暂停开放」。`, { ms: 4200 }); return; }
        if (pick[1] === 'B5' && !content.has('used:int_vault_qichou')) { toast('B5 按钮亮起红灯：「深库 · 需双人授权」。\n也许该先去 B4 找收容库主管。', { ms: 5200 }); return; }
        await ride(c.floor, pick[1], c.x);
      },
    });
  }
  // B5 金库门：开启前挡住门洞
  inter.volume({ box: [-2.6, LEVELS.B5 - 1, -101.2, 2.6, LEVELS.B5 + 3, -99.4], enabled: () => !ctx.vault?.door?.opened && !!ctx.vault?.door, enter: () => { player.pos.z = -98.6; player.vel?.set(0, 0, 0); } });
  if (ctx.vault) ctx.vault.onDoorOpen = () => { audio.sfx('S12', 0.9); toast('（泄压声。金库门慢慢转开。）', { ms: 3500, whisper: true }); };
}
const levelY = (f) => (f === '1F' ? FLOOR : FLOORS[f]?.y ?? 0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
