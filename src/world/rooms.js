// M3（第一批）：后楼 1F 职工食堂与中庭（安检大厅北墙铁门 → 连廊）、B1 外勤缉拿处与整备库、B2 审讯室与临时羁押、B6 驯化副本训练场
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { placeModel } from '../engine/assets.js';
import { mats } from './mats.js';
import { Frame, archRingGeo, archShape, emblem, goldText } from './gothic.js';
import { CanvasScreen, dust, lightShaft } from '../engine/fx.js';
import { content } from '../engine/content.js';
import { FLOOR, T } from './exterior.js';
import { wallX, wallZ, rectLight, spot, point, person, signMaterial, brassPlaqueMaterial, woodChair, posterMaterial } from './interiors.js';
import { FLOORS, room, elevatorHall, vaultMats, tagMaterial, steelShelf, beacon } from './vault.js';

export const UNDER = { B1: -10, B2: -18, B6: -52 };
const Y = FLOOR;

export function buildRooms(scene, world, ctx) {
  const M = mats(); const Mx = vaultMats(M);
  const jobs = [];
  const mk = (name) => { const g = new THREE.Group(); g.name = name; scene.add(g); ctx.zones[name] = g; return g; };
  const addTo = (g) => (p) => { jobs.push(p.then((o) => { g.add(o); return o; })); return p; };
  const docMesh = (id, w, h, fallback) => { const d = content.get(id); const t = d?.texture ? content.tex(d.texture) : null; return new THREE.Mesh(new THREE.PlaneGeometry(w, h), t ? new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }) : fallback); };
  const MAT = { ...M, ...Mx };
  ctx.rooms = {};

  // ================= 1F 职工食堂与中庭 =================
  {
    const zone = mk('canteen'), b = new Batch(), add = addTo(zone);
    const X = 18, Z0 = -110, Z1 = -140, H = 13, cz = (Z0 + Z1) / 2;
    // 连廊（铁门 → 食堂），两侧书脊井井壁
    b.box('hallFloorDark', 4.8, 0.1, Z0 - -76.6 + 0.2, [0, Y - 0.05, (-76.6 + Z0) / 2], { uv: 0.3, collide: true });
    for (const sx of [-1, 1]) { b.box('panelWall', 0.4, 6.2, Z0 - -76.6 + 0.2, [sx * 2.6, Y + 3.1, (-76.6 + Z0) / 2], { uv: 0.3, collide: true }); for (let z = -80; z > Z0; z -= 4) { b.box('stoneDark', 0.3, 6.2, 0.4, [sx * 2.3, Y + 3.1, z], { uv: 0.5 }); b.box('gold', 0.32, 0.05, 0.42, [sx * 2.3, Y + 5.4, z], { uv: 1 }); } }
    b.box('vault', 4.8, 0.2, Z0 - -76.6, [0, Y + 6.3, (-76.6 + Z0) / 2], { uv: 0.3 });
    for (let z = -80; z > Z0; z -= 4) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.3), M.lampWarm); l.position.set(0, Y + 6.15, z); zone.add(l); }
    point(zone, 0xffe0b0, 8, [0, Y + 5, -86], 12); point(zone, 0xffe0b0, 8, [0, Y + 5, -100], 12);
    // 大厅本体
    b.box('woodFloor', 2 * X, 0.1, Z0 - Z1, [0, Y - 0.05, cz], { uv: 0.35, collide: true });
    // 墙体碰撞只到 6.8 m（上方与 2F 楼板在同一位置，避免挡住楼上的玩家）
    wallX(b, 'panelWall', -X - 0.2, Z0, Z1, Y, 6.8, 0.4, [], true); wallX(b, 'panelWall', X + 0.2, Z0, Z1, Y, 6.8, 0.4, [], true);
    wallZ(b, 'panelWall', Z0, -X, X, Y, 6.8, 0.4, [{ x0: -2.4, x1: 2.4, h: 6.2 }], true); wallZ(b, 'panelWall', Z1, -X, X, Y, 6.8, 0.4, [], true);
    for (const sx of [-1, 1]) b.box('panelWall', 0.4, H - 6.8, Z0 - Z1, [sx * (X + 0.2), Y + 6.8 + (H - 6.8) / 2, cz], { uv: 0.3 });
    for (const z of [Z0, Z1]) b.box('panelWall', 2 * X, H - 6.8, 0.4, [0, Y + 6.8 + (H - 6.8) / 2, z], { uv: 0.3 });
    // 两层回廊（二层挑台）
    for (const sx of [-1, 1]) { b.box('wood', 4, 0.3, Z0 - Z1, [sx * (X - 2), Y + 6.3, cz], { uv: 0.5 }); b.box('iron', 0.06, 1.0, Z0 - Z1, [sx * (X - 4), Y + 6.95, cz], { uv: 1 }); b.box('gold', 0.08, 0.05, Z0 - Z1, [sx * (X - 4), Y + 7.45, cz], { uv: 1 }); for (let z = Z0 - 3; z > Z1; z -= 6) { b.add('stoneDark', new THREE.CylinderGeometry(0.28, 0.32, 6.2, 12), { pos: [sx * (X - 4), Y + 3.1, z] }, { uv: 0.5, collide: true }); } }
    // 玻璃顶（钢桁架 + 透明玻璃，能看见黄昏天空）
    for (let z = Z0; z >= Z1; z -= 3) { b.box('blackMetal', 2 * X, 0.18, 0.12, [0, Y + H, z], { uv: 1 }); b.add('blackMetal', new THREE.BoxGeometry(0.1, 0.1, 2 * X * 0.56), { pos: [-X / 2, Y + H + 2.2, z], rot: [0, Math.PI / 2, 0.28] }, { uv: 1 }); b.add('blackMetal', new THREE.BoxGeometry(0.1, 0.1, 2 * X * 0.56), { pos: [X / 2, Y + H + 2.2, z], rot: [0, Math.PI / 2, -0.28] }, { uv: 1 }); }
    for (const sx of [-1, 1]) { const g = new THREE.PlaneGeometry(Z0 - Z1, X * 1.04); const m = new THREE.Mesh(g, M.glassClear); m.position.set(sx * X / 2, Y + H + 2.4, cz); m.rotation.set(-Math.PI / 2, 0, Math.PI / 2); m.rotateX(sx * 0.28); zone.add(m); }
    b.box('gold', 0.14, 0.14, Z0 - Z1, [0, Y + H + 4.8, cz], { uv: 1 });
    for (const z of [Z0, Z1]) { const s = new THREE.Shape(); s.moveTo(-X, 0); s.lineTo(0, 4.9); s.lineTo(X, 0); b.add('panelWall', new THREE.ShapeGeometry(s), { pos: [0, Y + H, z + (z === Z0 ? -0.01 : 0.01)], rot: [0, z === Z0 ? Math.PI : 0, 0] }, { uv: 0.3 }); }
    // 打饭窗口（北墙）+ 电子菜单屏
    b.box('steel', 22, 1.0, 1.2, [0, Y + 0.5, Z1 + 1.4], { uv: 1, collide: true });
    b.box('blackMarble', 22.2, 0.06, 1.3, [0, Y + 1.03, Z1 + 1.4], { uv: 0.5 });
    b.box('glassClear', 22, 0.6, 0.04, [0, Y + 1.5, Z1 + 1.9], { uv: false });
    for (let k = 0; k < 10; k++) { b.box('steel', 1.8, 0.12, 0.5, [-9.9 + k * 2.2, Y + 1.12, Z1 + 1.3], { uv: 1 }); b.box(k % 3 ? 'kraftDark' : 'kraft', 1.6, 0.06, 0.4, [-9.9 + k * 2.2, Y + 1.2, Z1 + 1.3], { uv: 1 }); }
    const menu = content.texUrl('tex_canteen_menu') ? null : new CanvasScreen(1536, 320, drawMenu, { fps: 0.2, intensity: 1.3 }); if (menu) ctx.screens.push(menu);
    const mm = docMesh('doc_canteen_menu', 14, 2.9, menu?.mat ?? M.screenOff); if (!menu) { mm.material.emissive = new THREE.Color(0xffffff); mm.material.emissiveMap = mm.material.map; mm.material.emissiveIntensity = 0.8; }
    mm.position.set(0, Y + 4.2, Z1 + 0.25); zone.add(mm); ctx.anchors.doc_canteen_menu = { obj: mm, range: 14 };
    for (let k = 0; k < 4; k++) { const cook = person(M, { coat: 0xe8e8e2, cap: true }); cook.position.set(-7.5 + k * 5, Y, Z1 + 0.6); zone.add(cook); }
    // 长桌 × 3 列 × 5 排
    for (let r = 0; r < 5; r++) for (const x of [-9, 0, 9]) {
      const z = Z0 - 5 - r * 4.2;
      b.box('wood', 5.6, 0.08, 1.2, [x, Y + 0.76, z], { uv: 0.6 }); world.box(x, Y + 0.4, z, 5.6, 0.8, 1.2);
      for (const ex of [-2.5, 2.5]) b.box('blackMetal', 0.08, 0.72, 1.0, [x + ex, Y + 0.36, z], { uv: 1 });
      for (let c = -2; c <= 2; c++) { woodChair(b, x + c * 1.1, Y, z - 0.85, 1); woodChair(b, x + c * 1.1, Y, z + 0.85, -1); }
      if ((r + x) % 2 === 0) { b.box('steel', 0.45, 0.02, 0.32, [x - 1.2, Y + 0.81, z + 0.2], { uv: 1 }); b.add('whiteMarble', new THREE.CylinderGeometry(0.07, 0.06, 0.05, 16), { pos: [x - 1.2, Y + 0.845, z + 0.2] }, { uv: 1 }); }
    }
    // 靠窗长桌：两名职员（八卦）
    const gossipers = []; for (const [dx, dz, c] of [[-0.6, -0.85, 0x2a3040], [0.6, 0.85, 0x40302a]]) { const p = person(M, { coat: c, glasses: dx > 0 }); p.position.set(-9 + dx, Y - 0.45, Z0 - 5 + dz); p.rotation.y = dz > 0 ? Math.PI : 0; zone.add(p); gossipers.push(p); }
    ctx.anchors.int_canteen_gossip = { box: [-9, Y + 1.0, Z0 - 5, 3, 2, 3] };
    // 入口公告栏
    const bd = docMesh('doc_canteen_board', 3.2, 2.0, signMaterial('员工公告栏', ['· 本周加试阅卷人员 可在 B 窗口加餐', '· 请勿与倒影共餐', '· 失物招领：一枚无字书签', '· 食堂 21:00 后不供应任何「回忆」'], 640, 400));
    bd.position.set(X - 0.02, Y + 2.2, Z0 - 3.2); bd.rotation.y = -Math.PI / 2; zone.add(bd); ctx.anchors.doc_canteen_board = bd;
    b.box('wood', 0.08, 2.3, 3.5, [X - 0.02, Y + 2.2, Z0 - 3.2], { uv: 0.6 });
    // 绿植、吊灯
    for (const [x, z] of [[-15, -113], [15, -113], [-15, -136], [15, -136], [-4.5, -125], [4.5, -125]]) add(placeModel('potted_plant', { height: 2.0, pos: [x, Y, z] }));
    for (let r = 0; r < 3; r++) for (const x of [-9, 0, 9]) add(placeModel('chandelier', { height: 1.6, pos: [x, Y + 9.2, Z0 - 7 - r * 8] }));
    for (const x of [-9, 0, 9]) point(zone, 0xffd8a8, 18, [x, Y + 8, cz], 20);
    rectLight(zone, 0xfff0dc, 1.4, 34, 28, [0, Y + 12.5, cz], [0, Y, cz]);
    spot(zone, 0xffc890, 260, [10, Y + 17, -118], [-4, Y, -128], 0.55, true, 40);
    zone.add(lightShaft({ from: [8, Y + 15, -118], to: [-3, Y, -128], r0: 2.5, r1: 5, intensity: 0.12, color: 0xffd0a0 }));
    const tt = goldText('职工食堂　·　中庭', 6, 0.55, M.goldBright, { res: 128 }); tt.position.set(0, Y + 7.4, Z0 - 0.25); tt.rotation.y = Math.PI; zone.add(tt);
    b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g);
    world.surface(-X, Z1, X, Z0, 'wood', Y - 1, Y + 3);
  }

  // ================= B1 外勤缉拿处与整备库 =================
  {
    const zone = mk('armory'), b = new Batch(), add = addTo(zone), y = UNDER.B1;
    FLOORS.B1 = { y, label: 'B1　外勤缉拿处 · 整备库' };
    elevatorHall(b, zone, world, ctx, M, Mx, 'B1', y);
    const X = 16, Z0 = -92, Z1 = -126, H = 5.6, cz = (Z0 + Z1) / 2;
    room(b, world, M, -X, X, Z0, Z1, y, H, 'darkTile', 'concreteWall', { frontHole: { x0: -9.4, x1: 9.4, h: 5.2 } });
    for (let x = -X + 2; x < X; x += 4) b.box('hazard', 0.12, 0.01, Z0 - Z1, [x, y + 0.005, cz], { uv: 0.8 });
    // 作战简报室（西侧）：大屏 + 白板 + 座椅
    const brief = new CanvasScreen(1280, 640, drawBriefing, { fps: 0.5, intensity: 1.2 }); ctx.screens.push(brief);
    const bs = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), brief.mat); bs.position.set(-X + 0.25, y + 2.7, -100); bs.rotation.y = Math.PI / 2; zone.add(bs);
    const wb = docMesh('doc_arm_briefing', 3.0, 1.6, signMaterial('出勤白板', ['外勤一组：京-朝阳-001 · 复查', '外勤二组：雾港联络 · 待命', '外勤三组：第二草稿线索 · 跟进', '', '今日口令：别回答'], 600, 320));
    wb.position.set(-X + 0.25, y + 1.8, -108); wb.rotation.y = Math.PI / 2; zone.add(wb); ctx.anchors.doc_arm_briefing = wb;
    b.box('paintedSteel', 0.06, 1.7, 3.1, [-X + 0.22, y + 1.8, -108], { uv: 1 });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) add(placeModel('office_chair', { height: 1.0, pos: [-X + 4 + r * 1.6, y, -97.5 - k * 1.3], rotY: -Math.PI / 2 }));
    // A 级通缉档案柜
    add(placeModel('file_cabinet', { height: 1.4, pos: [-X + 1.0, y, -114], rotY: Math.PI / 2 }));
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.12), tagMaterial('A 级　高危通缉')); fl.position.set(-X + 1.45, y + 1.2, -114); fl.rotation.y = Math.PI / 2; zone.add(fl); ctx.anchors.doc_arm_wanted_files = { obj: fl, range: 3 };
    // 装备墙（北墙）：防污染作战服、面罩、背心、锁喉铐
    for (let k = 0; k < 9; k++) {
      const x = -10 + k * 2.5;
      b.box('blackMetal', 2.2, 3.4, 0.5, [x, y + 1.7, Z1 + 0.3], { uv: 1 });
      b.box('steel', 2.0, 0.04, 0.4, [x, y + 0.6, Z1 + 0.5], { uv: 1 });
      const suit = person(M, { coat: 0x1a1d22, material: k % 3 === 0 ? null : undefined }); suit.position.set(x, y + 0.6, Z1 + 0.55); suit.scale.setScalar(0.92); zone.add(suit);
      add(placeModel('gas_mask', { height: 0.28, pos: [x - 0.6, y + 2.6, Z1 + 0.6] }));
      if (k % 2 === 0) add(placeModel('military_crate', { height: 0.5, pos: [x + 0.5, y, Z1 + 1.2], rotY: 0.2 * k }));
    }
    const eq = docMesh('doc_arm_equipment', 0.42, 0.6, signMaterial('装备领用单', ['防污染作战服 ×1', '锁喉铐 ×2', '记录仪 ×1', '领用人：________'], 420, 600));
    eq.position.set(0.8, y + 1.2, Z1 + 1.05); zone.add(eq); ctx.anchors.doc_arm_equipment = eq;
    b.box('wood', 1.6, 0.9, 0.7, [0.8, y + 0.45, Z1 + 1.4], { uv: 0.6, collide: true });
    // 周也
    const zy = person(M, { coat: 0x101216 }); zy.position.set(3.2, y, Z1 + 2.6); zy.rotation.y = Math.PI * 0.85; zone.add(zy);
    ctx.anchors.int_arm_zhouye = { box: [3.2, y + 1.0, Z1 + 2.6, 1.2, 2, 1.2] };
    // 黑色装甲车（东侧车库）
    const car = armoredCar(M); car.position.set(10, y, -104); car.rotation.y = Math.PI / 2; zone.add(car); world.box(10, y + 1.2, -104, 2.6, 2.4, 6);
    const car2 = armoredCar(M); car2.position.set(10, y, -114); car2.rotation.y = Math.PI / 2; zone.add(car2); world.box(10, y + 1.2, -114, 2.6, 2.4, 6);
    // 打卡机
    b.box('blackMetal', 0.5, 1.5, 0.4, [6, y + 0.75, Z0 - 0.5], { uv: 1, collide: true });
    const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.2), new THREE.MeshStandardMaterial({ color: 0, emissive: 0x40ff80, emissiveIntensity: 1.4 })); cl.position.set(6, y + 1.2, Z0 - 0.71); cl.rotation.y = Math.PI; zone.add(cl);
    for (let z = Z0 - 4; z > Z1; z -= 6) for (const x of [-8, 0, 8]) { b.box('blackMetal', 2.6, 0.06, 0.3, [x, y + H - 0.04, z], { uv: 1 }); const tb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.16), M.lampCold); tb.position.set(x, y + H - 0.08, z); zone.add(tb); }
    rectLight(zone, 0xdfe8ff, 1.8, 30, 32, [0, y + H - 0.3, cz], [0, y, cz]);
    point(zone, 0xbfd4ff, 10, [-10, y + 4, -104], 14); point(zone, 0xffd8b0, 8, [4, y + 4, Z1 + 3], 10);
    const bc = beacon(M); bc.position.set(X - 0.4, y + 4.4, -100); zone.add(bc); ctx.rooms.beacons = [bc];
    const tl = goldText('外勤缉拿处　整备库', 4.4, 0.4, M.goldBright, { res: 96 }); tl.position.set(0, y + 4.2, Z1 + 0.6); zone.add(tl);
    b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g);
    world.surface(-X, Z1, X, Z0 + 8, 'stone', y - 1, y + 3);
  }

  // ================= B2 审讯室与临时羁押 =================
  {
    const zone = mk('interrogation'), b = new Batch(), add = addTo(zone), y = UNDER.B2;
    FLOORS.B2 = { y, label: 'B2　审讯室 · 临时羁押' };
    elevatorHall(b, zone, world, ctx, M, Mx, 'B2', y);
    const Z0 = -92, Z1 = -136, H = 4.2, cz = (Z0 + Z1) / 2;
    // 中央走廊 x ±2.2
    room(b, world, M, -2.2, 2.2, Z0, Z1, y, H, 'darkTile', 'whitePad', { noFront: true });
    // 西侧：审讯室 + 观察间（单向玻璃），用走廊西墙上的门洞进入
    b.box('darkTile', 10, 0.2, 12, [-7.4, y - 0.1, -101], { uv: 0.3, collide: true });
    b.box('concreteWall', 10, 0.3, 12, [-7.4, y + H + 0.15, -101], { uv: 0.3 });
    wallX(b, 'concreteWall', -12.6, -95, -107, y, H, 0.4, [], true); wallZ(b, 'concreteWall', -95, -12.4, -2.4, y, H, 0.4, [], true); wallZ(b, 'concreteWall', -107, -12.4, -2.4, y, H, 0.4, [], true);
    // 单向玻璃隔墙（x=-7.4）分开观察间（东）和审讯室（西）
    b.box('concreteWall', 0.3, H, 4, [-7.4, y + H / 2, -97], { uv: 0.3, collide: true }); b.box('concreteWall', 0.3, H, 4, [-7.4, y + H / 2, -105], { uv: 0.3, collide: true });
    b.box('mirrorGlass', 0.05, 2.0, 4, [-7.4, y + 1.9, -101], { uv: false }); b.box('concreteWall', 0.3, 0.9, 4, [-7.4, y + 0.45, -101], { uv: 0.3, collide: true }); b.box('concreteWall', 0.3, H - 2.9, 4, [-7.4, y + 2.9 + (H - 2.9) / 2, -101], { uv: 0.3 }); world.box(-7.4, y + 2, -101, 0.2, 2, 4);
    // 审讯桌椅（固定）+ 录音设备
    b.box('steel', 1.6, 0.06, 0.9, [-10, y + 0.76, -101], { uv: 1 }); b.box('steel', 0.1, 0.74, 0.1, [-10, y + 0.37, -101], { uv: 1 }); world.box(-10, y + 0.4, -101, 1.6, 0.8, 0.9);
    for (const dz of [-0.9, 0.9]) { b.box('steel', 0.45, 0.45, 0.45, [-10, y + 0.225, -101 + dz], { uv: 1 }); b.box('steel', 0.45, 0.5, 0.05, [-10, y + 0.7, -101 + dz * 1.2], { uv: 1 }); }
    add(placeModel('telegraph', { height: 0.25, pos: [-10.5, y + 0.79, -101.2], rotY: 0.3 }));
    const scratch = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), scratchMaterial()); scratch.rotation.x = -Math.PI / 2; scratch.position.set(-9.8, y + 0.795, -100.9); zone.add(scratch);
    spot(zone, 0xfff2e0, 70, [-10, y + H - 0.1, -101], [-10, y, -101], 0.5, true, 6);
    // 观察间：桌上笔录
    b.box('wood', 2.4, 0.06, 0.8, [-5, y + 0.76, -101], { uv: 0.6 }); world.box(-5, y + 0.4, -101, 2.4, 0.8, 0.8);
    const tr = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.01, 0.3), new THREE.MeshStandardMaterial({ map: lineTexture('审讯笔录'), roughness: 0.8 })); tr.position.set(-5.2, y + 0.8, -101); tr.rotation.y = 0.2; zone.add(tr); ctx.anchors.doc_int_transcript = tr;
    add(placeModel('desk_lamp', { height: 0.5, pos: [-4.4, y + 0.79, -101.2], rotY: -2 }));
    point(zone, 0xffc890, 4, [-4.6, y + 1.5, -101], 5);
    wallX(b, 'whitePad', -2.4, Z0, Z1, y, H, 0.3, [{ z0: -99.5, z1: -102.5, h: 2.4 }], true);
    // 东侧：白色软包牢房 ×6（门 + 观察窗 + 编号）
    wallX(b, 'whitePad', 2.4, Z0, Z1, y, H, 0.3, [], true);
    for (let k = 0; k < 6; k++) {
      const z = Z0 - 5 - k * 6;
      b.box('steel', 0.12, 2.3, 1.2, [2.25, y + 1.15, z], { uv: 1 });
      b.box('blackMetal', 0.14, 0.3, 0.5, [2.24, y + 1.6, z], { uv: 1 });
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.22), new THREE.MeshStandardMaterial({ color: 0x0, emissive: 0xe8f0ff, emissiveIntensity: k === 5 ? 0.15 : 0.8 })); win.position.set(2.17, y + 1.6, z); win.rotation.y = -Math.PI / 2; zone.add(win);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.14), tagMaterial(k === 5 ? '羁押原因：自愿' : `羁押室 0${k + 1}`)); plate.position.set(2.17, y + 2.05, z); plate.rotation.y = -Math.PI / 2; zone.add(plate);
      if (k === 5) ctx.anchors.doc_int_cell_last = { obj: plate, range: 2.6 };
    }
    // 走廊尽头：狂草者隔离间（满墙手写字）
    const mad = new THREE.Mesh(new THREE.PlaneGeometry(4.4, H), madWallMaterial()); mad.position.set(0, y + H / 2, Z1 + 0.25); zone.add(mad); ctx.anchors.doc_int_madwall = { obj: mad, range: 4 };
    for (let z = Z0 - 2; z > Z1; z -= 3.5) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.2), M.lampCold); l.position.set(0, y + H - 0.05, z); zone.add(l); }
    rectLight(zone, 0xe8f0ff, 1.6, 4, 44, [0, y + H - 0.1, cz], [0, y, cz]);
    point(zone, 0xdfe8ff, 6, [0, y + 3, -100], 10); point(zone, 0xff8060, 4, [0, y + 2.5, Z1 + 2], 6);
    const tl = goldText('审讯室　·　临时羁押', 3.6, 0.32, M.goldBright, { res: 96 }); tl.position.set(0, y + 3.5, Z0 - 0.3); tl.rotation.y = Math.PI; zone.add(tl);
    b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g);
    world.surface(-12, Z1, 2.4, Z0 + 8, 'stone', y - 1, y + 3);
  }

  // ================= B6 驯化副本训练场 =================
  {
    const zone = mk('training'), b = new Batch(), add = addTo(zone), y = UNDER.B6;
    FLOORS.B6 = { y, label: 'B6　驯化副本训练场' };
    elevatorHall(b, zone, world, ctx, M, Mx, 'B6', y);
    const X = 32, Z0 = -92, Z1 = -156, H = 16, cz = (Z0 + Z1) / 2;
    room(b, world, M, -X, X, Z0, Z1, y, H, 'blackFloor', 'vaultWall', { frontHole: { x0: -9.4, x1: 9.4, h: 5.2 } });
    // 地面网格灯带
    const grid = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x3a8cff, emissiveIntensity: 1.4 });
    for (let x = -X + 4; x < X; x += 4) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, Z0 - Z1), grid); m.position.set(x, y + 0.006, cz); zone.add(m); }
    for (let z = Z0 - 4; z > Z1; z -= 4) { const m = new THREE.Mesh(new THREE.BoxGeometry(2 * X, 0.01, 0.04), grid); m.position.set(0, y + 0.006, z); zone.add(m); }
    // 六扇副本门（弧形排列）
    const gates = [['SUR-001-1', 'doc_train_gate_sur', 0x5ac8ff], ['COM-005-2', 'doc_train_gate_com', 0xffd36e], ['MYS-013-2', 'doc_train_gate_mys', 0xb08aff], ['RPG-021-1', 'doc_train_gate_rpg', 0x7dffb0], ['EXP-009-1', 'doc_train_gate_exp', 0xff8a5a], ['ABY-000-?', 'doc_train_gate_aby', 0xff2030]];
    ctx.rooms.portals = [];
    gates.forEach(([code, docId, col], i) => {
      const a = -0.95 + i * 0.38, R = 30; const gx = Math.sin(a) * R, gz = -112 - Math.cos(a) * R + 10;
      const f = new Frame([gx, y, gz], -a);
      b.add('stoneDark', archRingGeo(5.2, 5, 4.0, 5, 0.9), f.at(0, 0, 0), { uv: 0.5 });
      b.add('gold', archRingGeo(5.4, 5, 5.2, 5, 0.95), f.at(0, 0, 0), { uv: 1 });
      b.add('stoneDark', new THREE.BoxGeometry(6.4, 0.4, 2.0), f.at(0, 0.2, 0.2), { uv: 0.5, collide: true });
      const pm = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: i === 5 ? 0.15 : 0.55, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
      const portal = new THREE.Mesh(new THREE.ShapeGeometry(archShape(4.0, 5)), pm); portal.applyMatrix4(f.at(0, 0, 0.0)); zone.add(portal); ctx.rooms.portals.push(portal);
      const pl = point(zone, col, i === 5 ? 3 : 14, [gx + Math.sin(a) * -2, y + 3, gz + Math.cos(a) * 2], 12);
      const plq = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), brassPlaqueMaterial(code, [i === 5 ? '未经第七局许可 严禁启封' : '驯化切片 · 训练用'])); plq.applyMatrix4(f.at(0, 9.6, 0.5)); zone.add(plq); ctx.anchors[docId] = plq;
      world.box(gx, y + 4, gz, 4.4, 8, 0.6, -a);
      if (i === 5) { for (let k = 0; k < 7; k++) { const ch = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12), M.iron); ch.applyMatrix4(f.at(-2 + k * 0.66, 2.6 + Math.sin(k) * 0.4, 0.5)); zone.add(ch); } const sl = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3.4), signMaterial('封', ['第七局', '封条'], 160, 900)); sl.applyMatrix4(f.at(0.2, 2.6, 0.55)); sl.rotateZ(0.2); zone.add(sl); }
      if (i === 0) ctx.anchors.int_train_sur = { obj: portal, range: 5 };
      void pl;
    });
    // 控制塔（教官台）
    const tx = 0, tz = -98;
    b.box('blackMetal', 8, 6, 5, [tx, y + 3, tz - 1], { uv: 0.5, collide: true });
    b.box('glassOut', 7.6, 2.4, 0.06, [tx, y + 7.5, tz - 3.5], { uv: false }); b.box('blackMetal', 8, 0.3, 5, [tx, y + 9, tz - 1], { uv: 0.5 }); b.box('blackMetal', 8, 3, 0.2, [tx, y + 7.5, tz + 1.5], { uv: 0.5 });
    const board = new CanvasScreen(1024, 768, drawBoard, { fps: 0.2, intensity: 1.2 }); ctx.screens.push(board);
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.15), board.mat); bm.position.set(tx, y + 3.2, tz - 3.52); bm.rotation.y = Math.PI; zone.add(bm); ctx.anchors.doc_train_board = { obj: bm, range: 10 };
    const rules = docMesh('doc_train_rules', 0.9, 1.2, signMaterial('训练守则', ['一、进门前报出自己的名字', '二、副本里的时间不算工时', '三、听到第二个自己的脚步', '　　立即按下撤离键', '四、ABY 门不是门'], 512, 680));
    rules.position.set(tx + 3.0, y + 1.6, tz - 3.52); rules.rotation.y = Math.PI; zone.add(rules); ctx.anchors.doc_train_rules = rules;
    for (const [x, z] of [[-20, -100], [20, -100]]) { add(placeModel('worn_rack', { height: 2, pos: [x, y, z], rotY: Math.PI })); }
    // 灯：顶部冷光 + 门光
    for (let z = Z0 - 8; z > Z1; z -= 12) for (const x of [-16, 0, 16]) { const l = new THREE.Mesh(new THREE.BoxGeometry(6, 0.08, 0.5), M.lampCold); l.position.set(x, y + H - 0.1, z); zone.add(l); }
    rectLight(zone, 0xbcd4ff, 1.2, 60, 60, [0, y + H - 0.3, cz], [0, y, cz]);
    spot(zone, 0xdfe8ff, 400, [0, y + H - 0.5, -120], [0, y, -124], 0.7, true, 40);
    zone.add(dust([0, y, -124], [60, 14, 60], 300, 0xbcd4ff));
    const tl = goldText('驯化副本训练场', 5, 0.6, M.goldBright, { res: 128 }); tl.position.set(0, y + 11, Z1 + 0.3); zone.add(tl);
    b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g);
    world.surface(-X, Z1, X, Z0 + 8, 'marble', y - 1, y + 3);
  }
  // 补充材质
  T('rooms built');
  return Promise.all(jobs);
}

export function updateRooms(ctx, dt, t) {
  for (const [i, p] of (ctx.rooms?.portals ?? []).entries()) p.material.opacity = (i === 5 ? 0.1 : 0.4) + Math.sin(t * 1.3 + i) * 0.12;
  for (const bc of ctx.rooms?.beacons ?? []) { const a = t * 3; bc.userData.rot.position.set(Math.cos(a), -0.3, Math.sin(a)); }
}

// ———— 程序化道具与贴图 ————
function armoredCar(M) {
  const g = new THREE.Group(); const body = new THREE.MeshStandardMaterial({ color: 0x0c0d10, metalness: 0.7, roughness: 0.3 });
  const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  add(new THREE.BoxGeometry(5.6, 1.2, 2.3), body, 0, 0.95, 0);
  add(new THREE.BoxGeometry(3.4, 1.0, 2.1), body, -0.6, 2.0, 0);
  add(new THREE.BoxGeometry(0.05, 0.6, 1.8), M.glassOut, 1.13, 2.05, 0).rotation.z = -0.3;
  for (const [x, z] of [[-1.8, -1.1], [1.8, -1.1], [-1.8, 1.1], [1.8, 1.1]]) add(new THREE.CylinderGeometry(0.48, 0.48, 0.4, 20), M.rubber, x, 0.48, z).rotation.x = Math.PI / 2;
  const em = emblem(0.35, M.goldBright, M.navy); em.position.set(-0.6, 2.0, 1.06); g.add(em);
  add(new THREE.BoxGeometry(5.62, 0.06, 2.32), M.gold, 0, 1.3, 0);
  for (const z of [-0.8, 0.8]) add(new THREE.BoxGeometry(0.05, 0.16, 0.3), M.lampWarm, 2.81, 1.1, z);
  return g;
}
function canvasMat(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }); }
function lineTexture(title) { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 340; const c = cv.getContext('2d'); c.fillStyle = '#ece6d6'; c.fillRect(0, 0, 256, 340); c.fillStyle = '#1a1612'; c.font = '700 22px "NB Serif", serif'; c.fillText(title, 16, 36); c.fillStyle = '#8a8276'; for (let y = 60; y < 330; y += 14) c.fillRect(16, y, 150 + ((y * 17) % 80), 5); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
function scratchMaterial() { const m = canvasMat(256, 160, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.5; c.font = '40px "NB Serif", serif'; c.strokeText('我 没 有 写', 20, 70); c.strokeText('这 一 段', 50, 130); }); m.transparent = true; m.map.premultiplyAlpha = false; m.metalness = 1; m.roughness = 0.3; return m; }
function madWallMaterial() {
  return canvasMat(1100, 1050, (c, w, h) => {
    c.fillStyle = '#e8e6e0'; c.fillRect(0, 0, w, h);
    const L = ['删掉我', '这一行是谁写的', '不要读下一句', '作者在看', '我已经被改过三次', '第七', '把我还给草稿', '你也在这页上', '别相信页码', '墨还没干', '祂', '我是错别字'];
    for (let i = 0; i < 160; i++) { c.save(); c.translate(Math.random() * w, Math.random() * h); c.rotate((Math.random() - 0.5) * 0.9); c.fillStyle = `rgba(${20 + Math.random() * 60},${10 + Math.random() * 20},${10 + Math.random() * 20},${0.5 + Math.random() * 0.5})`; c.font = `${18 + Math.random() * 46}px "NB Serif", serif`; c.fillText(L[i % L.length], 0, 0); c.restore(); }
  });
}
function drawMenu(c, t, W, H) { c.fillStyle = '#060a10'; c.fillRect(0, 0, W, H); c.fillStyle = '#e8c87a'; c.font = '700 54px "NB Serif", serif'; c.fillText('今日菜单', 30, 70); const items = ['红烧狮子头　12', '番茄炒蛋　6', '清炒时蔬　4', '老鸭汤　8', '米饭　1', '「回忆」　售罄']; c.font = '40px "NB Sans", sans-serif'; items.forEach((s, i) => { c.fillStyle = i === 5 ? '#ff6a4a' : '#cfd8ea'; c.fillText(s, 30 + (i % 3) * 500, 160 + Math.floor(i / 3) * 90); }); }
function drawBriefing(c, t, W, H) { c.fillStyle = '#04070e'; c.fillRect(0, 0, W, H); c.fillStyle = '#e8c87a'; c.font = '700 44px "NB Serif", serif'; c.fillText('外勤作战简报　·　今日出勤', 30, 60); c.strokeStyle = '#2a5aa8'; c.lineWidth = 2; for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(60 + i * 90, 120); c.lineTo(60 + i * 90, 600); c.stroke(); } for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(60, 120 + i * 96); c.lineTo(1050, 120 + i * 96); c.stroke(); } for (let i = 0; i < 9; i++) { const v = 0.5 + 0.5 * Math.sin(t + i); c.fillStyle = i % 4 === 0 ? `rgba(255,80,60,${v})` : `rgba(120,200,255,${v})`; c.beginPath(); c.arc(120 + ((i * 271) % 900), 170 + ((i * 113) % 400), 10, 0, 7); c.fill(); } c.fillStyle = '#9fb4e0'; c.font = '28px "NB Sans", sans-serif'; c.fillText('高危：秦骁【王寇】　江戾【冥礼】　—— 发现即报', 30, 630); }
function drawBoard(c, t, W, H) { c.fillStyle = '#05070c'; c.fillRect(0, 0, W, H); c.fillStyle = '#e8c87a'; c.font = '700 52px "NB Serif", serif'; c.fillText('训练成绩榜', 40, 80); const rows = [['1', '　　　　', '—'], ['2', '周也', '98.2'], ['3', '殷泽', '97.6'], ['4', '叶寻', '91.0'], ['5', '齐仇', '88.4'], ['6', '实习生', '—']]; c.font = '40px "NB Sans", sans-serif'; rows.forEach((r, i) => { c.fillStyle = i === 0 ? '#ffd36e' : '#cfd8ea'; c.fillText(r[0], 60, 170 + i * 92); c.fillText(r[1], 160, 170 + i * 92); c.fillText(r[2], 700, 170 + i * 92); }); }
