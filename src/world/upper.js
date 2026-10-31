// M3（第二批）：地上楼层（书脊井电梯可达）—— 2F 国际联络处 + 宣传处、3F 办公区 + 医务室 + 鉴定实验室、4F 典籍藏书阁（书井）、12F 机要室与局长室
// 每层是主楼后楼 / 主塔里的一块楼板，南端电梯厅金门在 z=-84，与地下层同一套电梯
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { placeModel } from '../engine/assets.js';
import { R3 } from './r3plan.js';
import { mats } from './mats.js';
import { Frame, archRingGeo, archShape, lancetWindow, emblem, goldText } from './gothic.js';
import { CanvasScreen, dust, lightShaft } from '../engine/fx.js';
import { content } from '../engine/content.js';
import { FLOOR, T } from './exterior.js';
import { wallX, wallZ, rectLight, spot, point, person, signMaterial, brassPlaqueMaterial, woodChair, bankerLamp, posterMaterial } from './interiors.js';
import { FLOORS, FLOOR_ORDER, HALL_TEXT, room, elevatorHall, vaultMats, tagMaterial } from './vault.js';
import { dressMats, spineMaterial, spineGeo } from './dress.js';

export const UPPER = { '2F': FLOOR + 7, '3F': FLOOR + 14, '4F': FLOOR + 21, '12F': FLOOR + 70 };

export function buildUpper(scene, world, ctx) {
  const M = mats(); const Mx = vaultMats(M); const MAT = { ...M, ...Mx, ...dressMats(M), spine: spineMaterial() };
  const jobs = [];
  const mk = (name) => { const g = new THREE.Group(); g.name = name; scene.add(g); ctx.zones[name] = g; return g; };
  const addTo = (g) => (p) => { jobs.push(p.then((o) => { g.add(o); return o; })); return p; };
  const tex = (id) => { const d = content.get(id); return d?.texture ? content.tex(d.texture) : null; };
  const board = (id, w, h, fallback, emissive = 0) => { const t = tex(id); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), t ? new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, ...(emissive ? { emissive: 0xffffff, emissiveMap: t, emissiveIntensity: emissive } : {}) }) : fallback); return m; };
  const paper = (id, title) => { const t = tex(id); const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.006, 0.3), new THREE.MeshStandardMaterial({ map: t ?? paperTex(title), roughness: 0.8 })); return m; };
  for (const [k, label] of [['2F', '2F　国际联络处 · 宣传处'], ['3F', '3F　办公区 · 医务室 · 鉴定实验室'], ['4F', '4F–11F　典籍藏书阁'], ['12F', '12F　机要室 · 局长室']]) { FLOORS[k] = { y: UPPER[k], label }; }
  FLOOR_ORDER.unshift('12F', '4F', '3F', '2F');
  Object.assign(HALL_TEXT, { '2F': '国际联络处 · 宣传处', '3F': '办公区 · 医务室 · 鉴定实验室', '4F': '典籍藏书阁 · 4F–11F', '12F': '机要室 · 局长室' });
  const winRow = (b, x, z0, z1, y, h, yaw) => { for (let z = z0 - 3; z > z1 + 1; z -= 5) { const f = new Frame([x, y, z], yaw); b.add('winView', new THREE.ShapeGeometry(archShape(1.6, h)), f.at(0, 1.1, 0.02), { uv: false, fitUV: true }); b.add('gold', archRingGeo(1.8, h, 1.6, h, 0.2), f.at(0, 1.1, 0.05), { uv: 1 }); } };

  // ================= 2F 国际联络处（东）+ 宣传处（西） =================
  {
    const zone = mk('floor2'), b = new Batch(), add = addTo(zone), y = UPPER['2F'];
    elevatorHall(b, zone, world, ctx, M, Mx, '2F', y);
    const X = 28, Z0 = -92, Z1 = -118, H = 6, cz = (Z0 + Z1) / 2;
    room(b, world, M, -X, X, Z0, Z1, y, H, 'woodFloor', 'panelWall', { ceil: 'vault', frontHole: { x0: -9.4, x1: 9.4, h: 5.2 } });
    wallX(b, 'panelWall', 0, Z0 - 2, Z1, y, H, 0.3, [{ z0: -96, z1: -99, h: 3 }], true);
    winRow(b, -X + 0.01, Z0, Z1, y, 2.6, Math.PI / 2); winRow(b, X - 0.01, Z0, Z1, y, 2.6, -Math.PI / 2);
    // —— 国际联络处：势力评估墙（北墙 13 框）——
    for (let k = 0; k < 13; k++) {
      const x = 2.2 + (k % 7) * 3.6, yy = y + (k < 7 ? 3.6 : 1.6), id = k < 11 ? `doc_liaison_faction_${String(k + 1).padStart(2, '0')}` : k === 12 ? 'doc_liaison_empty_frame' : null;
      b.box('wood', 2.6, 1.7, 0.08, [x, yy, Z1 + 0.25], { uv: 0.6 }); b.box('gold', 2.7, 1.8, 0.04, [x, yy, Z1 + 0.22], { uv: 1 });
      const pm = id ? board(id, 2.4, 1.5, k === 12 ? emptyFrameMat() : factionMat(k)) : new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), factionMat(k));
      pm.position.set(x, yy, Z1 + 0.3); zone.add(pm); if (id) ctx.anchors[id] = pm;
    }
    const li = board('doc_liaison_intro', 0.9, 1.2, signMaterial('国际联络处', ['本处负责与体系外各势力的', '联络、评估与情报交换', '', '会客请先登记'], 512, 680)); li.position.set(0.17, y + 1.7, -94); li.rotation.y = Math.PI / 2; zone.add(li); ctx.anchors.doc_liaison_intro = li;
    // 会客区：沙发 + 电话 + 来电便签；保险柜 + 证物盒；渡鸦标本 + 信箱
    if (!R3.floor2_liaison) for (const [x, z, r] of [[8, -100, 0], [12, -100, 0], [10, -103.5, Math.PI]]) add(placeModel('armchair', { height: 1.0, pos: [x, y, z], rotY: r }));
    b.box('wood', 2.4, 0.5, 1.0, [10, y + 0.25, -101.8], { uv: 0.6, collide: true });
    add(placeModel('telegraph', { height: 0.22, pos: [9.4, y + 0.5, -101.8], rotY: 0.4 }));
    const call = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), new THREE.MeshStandardMaterial({ color: 0xf2df5a, roughness: 0.8, side: THREE.DoubleSide })); call.rotation.x = -Math.PI / 2; call.position.set(10.4, y + 0.505, -101.7); zone.add(call); ctx.anchors.doc_liaison_greytower_call = { obj: call, range: 2.4 };
    add(placeModel('safe_small', { height: 1.0, pos: [24, y, -112], rotY: -Math.PI / 2 }));
    b.box('glassClear', 0.5, 0.35, 0.35, [24, y + 1.2, -112], { uv: false }); const bm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.005, 0.18), new THREE.MeshStandardMaterial({ color: 0xe8e0c8, roughness: 0.6 })); bm.position.set(24, y + 1.1, -112); zone.add(bm); ctx.anchors.doc_liaison_bookmark = { box: [24, y + 1.2, -112, 0.6, 0.5, 0.5] };
    const raven = ravenModel(M); raven.position.set(20, y + 1.1, -94); raven.rotation.y = Math.PI; zone.add(raven); b.box('wood', 0.6, 1.1, 0.6, [20, y + 0.55, -94], { uv: 0.6, collide: true });
    b.box('brass', 0.3, 0.2, 0.2, [20.4, y + 1.2, -94], { uv: 1 }); ctx.anchors.doc_liaison_raven = { box: [20.2, y + 1.3, -94, 0.8, 0.6, 0.6] };
    // —— 宣传处：新闻发布厅讲台 + 剪辑室 + 海报打样间 ——
    b.box('wood', 1.2, 1.15, 0.7, [-14, y + 0.575, -112], { uv: 0.6, collide: true }); const em = emblem(0.25, M.goldBright, M.navy); em.position.set(-14, y + 0.8, -111.63); zone.add(em);
    const press = paper('doc_pub_press', '通稿（草稿）'); press.position.set(-14, y + 1.16, -112.1); press.rotation.set(-0.2, 0, 0); zone.add(press); ctx.anchors.doc_pub_press = press;
    const bg = board('doc_pub_press_bg', 8, 3.4, posterMaterial('叙事管理局 新闻发布会', '京城 · 现实稳定度通报')); bg.position.set(-14, y + 3.0, Z1 + 0.25); zone.add(bg);
    if (!R3.floor2_pub) for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) woodChair(b, -18 + k * 2, y, -104 + r * 2.2, 1);
    if (!R3.floor2_pub) for (let k = 0; k < 4; k++) { const x = -25 + k * 3; b.box('blackMetal', 2.6, 0.06, 1.0, [x, y + 0.76, -96], { uv: 1 }); world.box(x, y + 0.4, -96, 2.6, 0.8, 1); add(placeModel('monitor', { height: 0.5, pos: [x, y + 0.79, -96.2] })); add(placeModel('office_chair', { height: 1, pos: [x, y, -95.1], rotY: Math.PI })); }
    const cm = board('doc_pub_comments', 0.55, 0.32, signMaterial('后台评论', ['「主播背后那栋楼是真的吗」', '「我梦见过这个大厅」', '「第七排有人」'], 550, 320), 0.6); cm.position.set(-22, y + 1.12, -96.18); zone.add(cm); ctx.anchors.doc_pub_comments = cm;
    add(placeModel('shelves_01', { height: 2.2, pos: [-27, y, -102], rotY: Math.PI / 2 }));
    const guide = paper('doc_pub_guide', '宣传口径手册'); guide.position.set(-26.6, y + 1.2, -102); guide.rotation.y = Math.PI / 2; zone.add(guide); ctx.anchors.doc_pub_guide = guide;
    add(placeModel('cardboard_box', { height: 0.4, pos: [-6, y, -116.4] }));
    const rej = board('doc_pub_rejected', 0.6, 0.85, posterMaterial('海报小样', '（已废弃）')); rej.position.set(-5.2, y + 0.02, -115.6); rej.rotation.set(-Math.PI / 2, 0, 0.3); zone.add(rej); ctx.anchors.doc_pub_rejected = { obj: rej, range: 2.6 };
    for (const x of [-14, 14]) { point(zone, 0xffe2c0, 14, [x, y + 5, cz], 18); rectLight(zone, 0xfff0dc, 1.3, 24, 22, [x, y + H - 0.2, cz], [x, y, cz]); }
    spot(zone, 0xfff2e0, 120, [-14, y + H - 0.2, -108], [-14, y + 1, -112], 0.5, true, 10);
    for (const [x, t] of [[14, '国际联络处'], [-14, '宣传处　新闻发布厅']]) { const g = goldText(t, 4, 0.42, M.goldBright, { res: 112 }); g.position.set(x, y + 5.3, Z0 - 0.25); g.rotation.y = Math.PI; zone.add(g); }
    b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g); world.surface(-X, Z1, X, Z0 + 8, 'wood', y - 1, y + 3);
  }

  // ================= 3F 办公区（西）+ 医务室（中）+ 鉴定实验室（东） =================
  {
    const zone = mk('floor3'), b = new Batch(), add = addTo(zone), y = UPPER['3F'];
    elevatorHall(b, zone, world, ctx, M, Mx, '3F', y);
    const X = 28, Z0 = -92, Z1 = -120, H = 5.4, cz = (Z0 + Z1) / 2;
    room(b, world, M, -X, X, Z0, Z1, y, H, 'carpet', 'panelWall', { ceil: 'vault', frontHole: { x0: -9.4, x1: 9.4, h: 5.2 } });
    wallX(b, 'panelWall', -9.6, Z0 - 2, Z1, y, H, 0.3, [{ z0: -96, z1: -99, h: 3 }], true); wallX(b, 'whitePad', 9.6, Z0 - 2, Z1, y, H, 0.3, [{ z0: -96, z1: -99, h: 3 }], true);
    winRow(b, -X + 0.01, Z0, Z1, y, 2.4, Math.PI / 2);
    // 批次19：鉴定实验室东墙（x 28）哥特尖拱窗 + 城景 → 钢框磨砂窗（与 3F 区域管控室同款，研究所风格统一）
    if (R3.lab3) for (let z = Z0 - 3; z > Z1 + 1; z -= 5) {
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), new THREE.MeshStandardMaterial({ color: 0x8a918d, emissive: 0xc8d0cc, emissiveIntensity: 0.32, roughness: 0.5 }));
      gl.position.set(X - 0.04, y + 2.3, z); gl.rotation.y = -Math.PI / 2; zone.add(gl);
      for (const dz of [-0.82, -0.41, 0, 0.41, 0.82]) b.box('blackMetal', 0.06, 2.48, dz === -0.82 || dz === 0.82 ? 0.08 : 0.035, [X - 0.07, y + 2.3, z + dz], { uv: 1 });
      for (const dy of [-1.22, -0.6, 0, 0.6, 1.22]) b.box('blackMetal', 0.06, Math.abs(dy) > 1.2 ? 0.08 : 0.035, 1.72, [X - 0.07, y + 2.3 + dy, z], { uv: 1 });
      b.box('stoneDark', 0.2, 0.06, 1.9, [X - 0.12, y + 1.06, z], { uv: 0.5 });
    } else winRow(b, X - 0.01, Z0, Z1, y, 2.4, -Math.PI / 2);
    // 办公区：工位岛 + 会议室白板 + 法务处门牌 + 公告屏
    if (!R3.floor3_office) for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) { const x = -24 + k * 7, z = -98 - r * 6; b.box('wood', 5, 0.06, 2.2, [x, y + 0.76, z], { uv: 0.6 }); world.box(x, y + 0.4, z, 5, 0.8, 2.2); b.box('paintedGreen', 5, 0.4, 0.04, [x, y + 0.98, z], { uv: 1 }); for (const dx of [-1.6, 0, 1.6]) for (const dz of [-0.55, 0.55]) { add(placeModel('monitor', { height: 0.45, pos: [x + dx, y + 0.79, z + dz * 0.6], rotY: dz > 0 ? 0 : Math.PI })); add(placeModel('office_chair', { height: 1, pos: [x + dx, y, z + dz * 2.2], rotY: dz > 0 ? 0 : Math.PI })); } if ((r + k) % 2) add(placeModel('stationery', { height: 0.12, pos: [x + 0.8, y + 0.79, z] })); }
    const wbd = board('doc_office_whiteboard', 2.6, 1.3, signMaterial('政策研究室', ['议题：叙事污染指数口径调整', '· 「良」是否改为「可读」', '· 3‰ 觉醒率是否对外', '· 不要讨论第七排'], 640, 320)); wbd.position.set(-X + 0.25, y + 1.9, -112); wbd.rotation.y = Math.PI / 2; zone.add(wbd); ctx.anchors.doc_office_whiteboard = wbd;
    const lp = board('doc_office_legal_plate', 0.6, 0.22, brassPlaqueMaterial('法务处', ['文本合规 · 篇幅审查'])); lp.position.set(-9.78, y + 2.1, -100.5); lp.rotation.y = -Math.PI / 2; zone.add(lp); ctx.anchors.doc_office_legal_plate = lp;
    const ns = board('doc_office_notice', 1.4, 0.8, signMaterial('三层公告', ['本周五 15:07 全员消防演练', '请勿在演练中回头'], 560, 320), 0.5); ns.position.set(-4, y + 2.4, Z0 - 0.25); ns.rotation.y = Math.PI; zone.add(ns); ctx.anchors.doc_office_notice = ns;
    // 医务室：检测椅 + 理智值表 + 视力表 + 药柜 + 隔离观察室病历夹
    b.box('steel', 0.8, 0.5, 1.8, [0, y + 0.25, -110], { uv: 1, collide: true }); b.box('whitePad', 0.8, 0.12, 1.8, [0, y + 0.56, -110], { uv: 1 }); b.box('whitePad', 0.8, 0.9, 0.12, [0, y + 1.0, -110.9], { uv: 1 }); b.add('steel', new THREE.TorusGeometry(0.22, 0.03, 8, 24), { pos: [0, y + 1.75, -110.8] }, { uv: 1 });
    const mon = new CanvasScreen(256, 192, drawSanity, { fps: 2, intensity: 1.2 }); ctx.screens.push(mon); const mm = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45), mon.mat); mm.position.set(1.0, y + 1.5, -110.6); mm.rotation.y = -0.5; zone.add(mm); b.box('blackMetal', 0.1, 1.5, 0.1, [1.1, y + 0.75, -110.7], { uv: 1 });
    ctx.anchors.int_med_test = { box: [0, y + 0.8, -110, 1.2, 1.6, 2.2] };
    const st = board('doc_med_sanity_table', 1.2, 1.6, signMaterial('理智值分级表', ['90–100　清醒', '70–89　轻度污染', '40–69　需复查', '10–39　隔离观察', '0–9　　请联系第七……', '　　　（此行被涂黑）'], 480, 640)); st.position.set(0, y + 2.4, Z1 + 0.25); zone.add(st); ctx.anchors.doc_med_sanity_table = st;
    const ec = board('doc_med_eye_chart', 0.6, 1.2, eyeChartMat()); ec.position.set(9.43, y + 1.8, -106); ec.rotation.y = -Math.PI / 2; zone.add(ec); ctx.anchors.doc_med_eye_chart = ec;
    add(placeModel('drawer_cabinet', { height: 1.8, pos: [-8.6, y, -114], rotY: Math.PI / 2 }));
    const meds = board('doc_med_meds', 0.4, 0.5, signMaterial('药品清单', ['定神丸　×12', '空白页（外用）　×3', '标点糖浆　×1'], 400, 500)); meds.position.set(-8.0, y + 1.3, -114); meds.rotation.y = Math.PI / 2; zone.add(meds); ctx.anchors.doc_med_meds = meds;
    const cs = board('doc_med_case', 0.24, 0.32, signMaterial('病历', ['隔离观察室 03'], 240, 320)); cs.position.set(-3, y + 1.4, Z0 - 2.25); cs.rotation.y = 0; zone.add(cs); ctx.anchors.doc_med_case = cs; b.box('panelWall', 6, H, 0.3, [-6.4, y + H / 2, Z0 - 2.1], { uv: 0.3, collide: true });
    // 鉴定实验室：篇幅测量仪 + 拓印台 + 阶位刻度墙 + 命名会议桌 + 流程图
    b.add('steel', new THREE.CylinderGeometry(1.0, 1.1, 0.25, 32), { pos: [18, y + 0.125, -110] }, { uv: 1, collide: true }); b.add('gold', new THREE.TorusGeometry(1.05, 0.03, 6, 48), { pos: [18, y + 0.26, -110], rot: [Math.PI / 2, 0, 0] }, { uv: 1 });
    const gs = content.tex('tex_lab_gauge_screen'); const gm = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), gs ? new THREE.MeshStandardMaterial({ map: gs, emissive: 0xffffff, emissiveMap: gs, emissiveIntensity: 0.7 }) : new THREE.MeshStandardMaterial({ color: 0, emissive: 0x3a8cff, emissiveIntensity: 1 })); gm.position.set(18, y + 2.4, -112.2); zone.add(gm); b.box('blackMetal', 0.2, 2.4, 0.2, [18, y + 1.2, -112.4], { uv: 1 });
    ctx.anchors.int_lab_gauge = { box: [18, y + 1.0, -110, 2.2, 2, 2.2] };
    b.box('blackMarble', 2.4, 0.9, 1.2, [24, y + 0.45, -100], { uv: 0.5, collide: true }); const rub = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.0), new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.04, metalness: 0.3, clearcoat: 1 })); rub.rotation.x = -Math.PI / 2; rub.position.set(24, y + 0.905, -100); zone.add(rub); ctx.anchors.int_lab_rubbing = { obj: rub, range: 3 };
    const sw = board('doc_lab_scale_wall', 6, 2.6, scaleWallMat()); sw.position.set(X - 0.25, y + 2.6, -110); sw.rotation.y = -Math.PI / 2; zone.add(sw); ctx.anchors.doc_lab_scale_wall = sw;
    b.box('wood', 3.6, 0.06, 1.4, [15, y + 0.76, -99], { uv: 0.6 }); world.box(15, y + 0.4, -99, 3.6, 0.8, 1.4); for (let k = -1; k <= 1; k++) { woodChair(b, 15 + k * 1.1, y, -98, 1); woodChair(b, 15 + k * 1.1, y, -100, -1); }
    const nm = paper('doc_lab_naming', '命名备选词表'); nm.position.set(15.3, y + 0.8, -99); zone.add(nm); ctx.anchors.doc_lab_naming = nm;
    const rp = paper('doc_lab_report', '鉴定报告（样例）'); rp.position.set(23.4, y + 0.91, -99.6); rp.rotation.y = 0.3; zone.add(rp); ctx.anchors.doc_lab_report = rp;
    const lf = board('doc_lab_flow', 1.2, 1.6, signMaterial('鉴定流程', ['1 登记', '2 篇幅测量', '3 初始文本拓印', '4 阶位评定', '5 命名委员会', '6 归档'], 480, 640)); lf.position.set(9.78, y + 1.8, -94.5); lf.rotation.y = Math.PI / 2; zone.add(lf); ctx.anchors.doc_lab_flow = lf;
    add(placeModel('microscope', { height: 0.45, pos: [23, y + 0.9, -100.4], rotY: 2.5 }));
    for (const [x, c] of [[-18, 0xffe6c8], [0, 0xf0f6ff], [18, 0xdfe8ff]]) { point(zone, c, 12, [x, y + 4.4, cz], 16); rectLight(zone, c, 1.3, 16, 24, [x, y + H - 0.2, cz], [x, y, cz]); }
    for (const [x, t] of [[-18, '办公区'], [0, '医务室　理智值监测'], [18, '鉴定与觉醒评测实验室']]) { const g = goldText(t, 4.2, 0.36, M.goldBright, { res: 112 }); g.position.set(x, y + 4.6, Z0 - 0.25); g.rotation.y = Math.PI; zone.add(g); }
    b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g); world.surface(-X, Z1, X, Z0 + 8, 'carpet', y - 1, y + 3);
  }

  // ================= 4F–11F 典籍藏书阁（环形书井） =================
  {
    const zone = mk('library'), b = new Batch(), add = addTo(zone), y = UPPER['4F'];
    elevatorHall(b, zone, world, ctx, M, Mx, '4F', y);
    const cx = 0, cz = -106, R = 13, H = 46;
    b.box('woodFloor', 30, 0.2, 30, [cx, y - 0.1, cz], { uv: 0.35, collide: true });
    wallZ(b, 'panelWall', -92, -15, 15, y, 8, 0.4, [{ x0: -9.4, x1: 9.4, h: 5.2 }], true);
    // 圆柱外墙 + 书架（每层 6 m，共 8 层），每层回廊挑台与金栏
    const ring = (r, h, y0, mat, open = true) => { const g = new THREE.CylinderGeometry(r, r, h, 64, 1, open); g.scale(-1, 1, 1); b.add(mat, g, { pos: [cx, y0 + h / 2, cz] }, { uv: 0.3 }); };
    ring(R + 0.6, H, y, 'panelWall');
    for (let lv = 0; lv < 8; lv++) {
      const ly = y + lv * 6;
      for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; if (lv === 0 && Math.abs(Math.sin(a / 2 - Math.PI / 2 + 0.0)) < 0.2 && Math.cos(a) > 0.9) continue;
        const x = cx + Math.sin(a) * (R + 0.1), z = cz + Math.cos(a) * (R + 0.1);
        if (lv === 0 && z > cz + R - 2 && Math.abs(x) < 3) continue; // 入口
        // 书架：背板 + 侧板 + 层板 + 细书脊面（M4：替换原 0.22 m 粗方格书块）
        const f = new Frame([x, ly, z], a + Math.PI);
        b.add('dz_wain', new THREE.BoxGeometry(2.0, 5.4, 0.3), f.at(0, 2.7, -0.2), { uv: 0.6 });
        for (const sx of [-0.97, 0.97]) b.add('dz_wain', new THREE.BoxGeometry(0.06, 5.4, 0.7), f.at(sx, 2.7, 0), { uv: 0.6 });
        for (let s = 0; s <= 6; s++) b.add('dz_wain', new THREE.BoxGeometry(1.94, 0.045, 0.7), f.at(0, 0.18 + s * 0.85, 0), { uv: 0.6 });
        for (let s = 0; s < 6; s++) b.add('spine', spineGeo(1.88, 0.78, k * 7.3 + s * 3.1 + lv * 11.7), f.at(0, 0.2 + s * 0.85 + 0.4, 0.2), { uv: false });
        b.add('gold', new THREE.BoxGeometry(2.0, 0.025, 0.02), f.at(0, 5.32, 0.36), { uv: 1 });
      }
      if (lv > 0) { const g = new THREE.RingGeometry(R - 2.2, R, 64); g.rotateX(-Math.PI / 2); b.add('woodFloor', g, { pos: [cx, ly - 0.05, cz] }, { uv: 0.3 }); b.add('gold', new THREE.TorusGeometry(R - 2.2, 0.05, 6, 96), { pos: [cx, ly + 1.0, cz], rot: [Math.PI / 2, 0, 0] }, { uv: 1 }); b.add('iron', new THREE.CylinderGeometry(R - 2.2, R - 2.2, 1.0, 96, 1, true), { pos: [cx, ly + 0.5, cz] }, { uv: 2 }); b.add('stoneDark', new THREE.TorusGeometry(R - 1.1, 0.2, 6, 96), { pos: [cx, ly - 0.25, cz], rot: [Math.PI / 2, 0, 0] }, { uv: 1 }); }
    }
    // 穹顶天窗 + 光柱
    b.add('vault', new THREE.SphereGeometry(R + 0.6, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2), { pos: [cx, y + H, cz] }, { uv: 0.25 });
    
    zone.add(lightShaft({ from: [cx, y + H + 10, cz], to: [cx, y, cz], r0: 2.2, r1: 4.4, intensity: 0.22, color: 0xffe2b0 }));
    // 中央：讲经台与「本册」（只有封面的巨书）+ 三处阅读龛
    b.add('blackMarble', new THREE.CylinderGeometry(2.4, 2.8, 0.6, 48), { pos: [cx, y + 0.3, cz] }, { uv: 0.5, collide: true });
    // 批次39：讲经台 wood 方盒 1.6×1.1×0.9 → Blender 精建 r2/lib_lectern（tools/blender/lib_lectern.py：胡桃台座三联凸芯板 + 铜玫瑰钉 + 凹槽壁柱 + 上下铜包角 + 齿饰檐口 + 14° 斜面书托（铜挡书条 / 四角铜包角）+ 北侧两级诵读台阶）。原点 = 黑石圆台顶面中心（不走 placeModel 的水平居中）
    if (R3.library) { add(placeModel('r2/lib_lectern', { scale: 1, pos: [cx, y + 0.6, cz] }).then((w) => { const o = w.children[0]; o.position.x = 0; o.position.z = 0; w.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return w; }));
      world.box(cx, y + 0.6 + 0.77, cz + 0.1, 1.5, 1.54, 0.95); world.box(cx, y + 0.6 + 0.15, cz - 0.6, 1.54, 0.3, 0.63); world.box(cx, y + 0.6 + 0.075, cz - 1.08, 1.54, 0.15, 0.39);
      const lecLight = new THREE.SpotLight(0xffe2b8, 9, 7, 0.42, 0.6, 1.6); lecLight.position.set(cx, y + 5.2, cz + 2.6); lecLight.target.position.set(cx, y + 1.3, cz + 0.2); zone.add(lecLight, lecLight.target); } // 讲经台正面雕饰补一盏斜上方暖光（中轴顶光只照到书托面）
    else b.add('wood', new THREE.BoxGeometry(1.6, 1.1, 0.9), { pos: [cx, y + 1.15, cz], rot: [0, 0, 0] }, { uv: 0.6, collide: true });
    const ct = content.tex('tex_lib_benche_cover'); const book = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.9), [M.leather, M.leather, ct ? new THREE.MeshStandardMaterial({ map: ct, roughness: 0.5 }) : M.navy, M.leather, M.leather, M.leather]); if (R3.library) book.position.set(cx, y + 2.077, cz + 0.074); else book.position.set(cx, y + 1.78, cz); book.rotation.x = -0.25; /* 批次39：书底贴 lib_lectern 书托面（面中心 y +1.375、z +0.1，沿法线抬 0.105） */ zone.add(book); ctx.anchors.int_lib_benche = { obj: book, range: 3 };
    const lr = board('doc_lib_rules', 0.9, 1.2, brassPlaqueMaterial('藏书阁规则', ['禁止朗读', '禁止在页边写字', '若书架多出一层　请原路返回'])); lr.position.set(3.5, y + 1.8, -92.25); lr.rotation.y = Math.PI; zone.add(lr); ctx.anchors.doc_lib_rules = lr;
    const alcoves = [['doc_lib_hypothesis', -0.9], ['doc_lib_alien_pages', 0.9], ['doc_lib_origin', Math.PI]];
    for (const [id, a] of alcoves) { const x = cx + Math.sin(a) * (R - 3.4), z = cz + Math.cos(a) * (R - 3.4); b.add('wood', new THREE.BoxGeometry(1.4, 1.0, 0.8), { pos: [x, y + 0.5, z], rot: [0, a, 0] }, { uv: 0.6, collide: true }); const p = paper(id, content.get(id)?.title ?? '典籍'); p.position.set(x, y + 1.01, z); p.rotation.y = a; p.scale.set(1.6, 1, 1.4); zone.add(p); ctx.anchors[id] = p; bankerLamp(b, zone, M, x + Math.cos(a) * 0.45, y + 1.0, z - Math.sin(a) * 0.45); }
    for (let lv = 0; lv < 8; lv += 2) point(zone, 0xffd8a0, 16, [cx, y + lv * 6 + 4, cz], 20);
    spot(zone, 0xffe6c0, 300, [cx, y + H, cz], [cx, y, cz], 0.35, true, 60);
    zone.add(dust([cx, y, cz], [24, 30, 24], 400));
    const tl = goldText('典籍藏书阁', 3.4, 0.5, M.goldBright, { res: 128 }); tl.position.set(0, y + 6.2, -92.5); tl.rotation.y = Math.PI; zone.add(tl);
    b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g); world.surface(-15, -121, 15, -84, 'wood', y - 1, y + 3);
    world.box(cx, y + 3, cz + R + 0.8, 30, 6, 0.4); // 环形外墙的近似碰撞由书架承担
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; const x = cx + Math.sin(a) * (R + 0.3), z = cz + Math.cos(a) * (R + 0.3); if (z > cz + R - 2 && Math.abs(x) < 3) continue; world.box(x, y + 2, z, 3.6, 4, 0.8, a); }
  }

  // ================= 12F 机要室与局长室 =================
  {
    const zone = mk('director'), b = new Batch(), add = addTo(zone), y = UPPER['12F'];
    elevatorHall(b, zone, world, ctx, M, Mx, '12F', y);
    const X = 13, Z0 = -92, Z1 = -112, H = 7, cz = (Z0 + Z1) / 2;
    room(b, world, M, -X, X, Z0, Z1, y, H, 'woodFloor', 'panelWall', { ceil: 'vault', frontHole: { x0: -9.4, x1: 9.4, h: 5.2 }, backHoles: [-2, -1, 0, 1, 2].map((k) => ({ x0: k * 4.6 - 1.8, x1: k * 4.6 + 1.8, h: 6.2 })) });
    // 北墙：整面落地尖拱窗（能看见暮色中的巨城）
    for (let k = -2; k <= 2; k++) { const f = new Frame([k * 4.6, y, Z1 + 0.25], 0); b.add('glassClear', new THREE.ShapeGeometry(archShape(3.6, 4.4)), f.at(0, 0.3, 0.0), { uv: false }); b.add('stoneDark', archRingGeo(4.2, 4.4, 3.6, 4.4, 0.4), f.at(0, 0.3, 0.05), { uv: 0.5 }); b.add('gold', archRingGeo(4.3, 4.4, 4.2, 4.4, 0.42), f.at(0, 0.3, 0.05), { uv: 1 }); }
    // 书桌 + 镇纸 + 玻璃板手稿 + 抽屉信
    // M4：大班台——双柜体（抽屉 + 黄铜拉手）+ 凹进的挡板 + 出沿台面 + 金色包边 + 底座线脚
    b.box('wood', 3.34, 0.07, 1.52, [0, y + 0.855, -104], { uv: 0.6, collide: true }); b.box('gold', 3.36, 0.02, 1.54, [0, y + 0.83, -104], { uv: 1 });
    for (const sx of [-1, 1]) { b.box('wood', 0.95, 0.8, 1.36, [sx * 1.15, y + 0.42, -104], { uv: 0.6, collide: true }); b.box('dz_base', 1.0, 0.1, 1.42, [sx * 1.15, y + 0.05, -104], { uv: 0.5 }); for (let k = 0; k < 3; k++) { b.box('dz_wain2', 0.82, 0.2, 0.02, [sx * 1.15, y + 0.2 + k * 0.24, -103.31], { uv: 0.6 }); b.box('brass', 0.16, 0.025, 0.03, [sx * 1.15, y + 0.24 + k * 0.24, -103.29], { uv: 1 }); } for (const ex of [-1, 1]) b.box('dz_wain2', 0.06, 0.8, 0.06, [sx * 1.15 + ex * 0.47, y + 0.42, -103.33], { uv: 0.6 }); }
    b.box('dz_wain', 1.36, 0.62, 0.05, [0, y + 0.5, -104.55], { uv: 0.6 }); b.box('glassClear', 3.0, 0.02, 1.2, [0, y + 0.915, -104], { uv: false }); b.box('leather', 1.6, 0.01, 0.8, [0, y + 0.905, -104], { uv: 1 });
    const md = paper('doc_dir_motto_draft', '手稿'); md.position.set(-0.6, y + 0.91, -104); zone.add(md); ctx.anchors.doc_dir_motto_draft = md;
    const pw = emblem(0.07, M.goldBright, M.navy); pw.rotation.x = -Math.PI / 2; pw.position.set(0.5, y + 0.95, -104); zone.add(pw); ctx.anchors.int_dir_paperweight = { box: [0.5, y + 0.95, -104, 0.3, 0.2, 0.3] };
    const lt = paper('doc_dir_letter_k', '致 K'); lt.position.set(1.2, y + 0.75, -103.25); zone.add(lt); ctx.anchors.doc_dir_letter_k = { box: [1.2, y + 0.7, -103.2, 0.6, 0.3, 0.4] };
    add(placeModel('armchair', { height: 1.2, pos: [0, y, -105.4], rotY: 0 })); add(placeModel('desk_lamp', { height: 0.55, pos: [-1.2, y + 0.92, -104.3], rotY: 0.6 }));
    // 壁炉（西墙）+ 盖黑布的画框
    b.box('blackMarble', 0.6, 1.4, 2.6, [-X + 0.3, y + 0.7, -100], { uv: 0.5, collide: true }); b.box('stoneDark', 0.4, 0.9, 1.6, [-X + 0.45, y + 0.45, -100], { uv: 0.5 }); b.box('gold', 0.7, 0.08, 2.8, [-X + 0.35, y + 1.42, -100], { uv: 1 });
    const fire = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshBasicMaterial({ color: 0xff7a30 })); fire.position.set(-X + 0.66, y + 0.3, -100); fire.rotation.y = Math.PI / 2; zone.add(fire); const fl = point(zone, 0xff8a40, 8, [-X + 1.2, y + 0.6, -100], 8); ctx.rooms = ctx.rooms ?? {}; ctx.rooms.fire = fl;
    const pf = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 2.2), new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.95 })); pf.position.set(-X + 0.15, y + 2.7, -100); zone.add(pf); b.box('gold', 0.08, 1.75, 2.35, [-X + 0.08, y + 2.7, -100], { uv: 1 }); ctx.anchors.int_dir_painting = pf;
    // 机要室（东侧隔间）：保险柜 + 机要目录
    b.box('panelWall', 0.3, H, 9, [7, y + H / 2, -99.5], { uv: 0.3, collide: true });
    add(placeModel('safe_small', { height: 1.3, pos: [X - 0.6, y, -97], rotY: -Math.PI / 2 }));
    const si = paper('doc_dir_secret_index', '机要文件目录'); si.position.set(10, y + 1.0, -100.5); zone.add(si); ctx.anchors.doc_dir_secret_index = si; b.box('steel', 1.4, 1.0, 0.8, [10, y + 0.5, -100.5], { uv: 1, collide: true });
    // 齐凌云（落地窗前）
    const ql = person(M, { coat: 0x15161c, clue: 'chair', name: '齐凌云' }); ql.position.set(-3, y, -110); ql.rotation.y = 0; zone.add(ql); ctx.anchors.int_dir_qilingyun = { box: [-3, y + 1, -110, 1.2, 2, 1.2] };
    // 书柜墙（南墙两侧）+ 地毯 + 灯
    // 南墙书柜与地毯：见 dressing.js（细书脊书柜 + 图案地毯）
    add(placeModel('chandelier', { height: 1.6, pos: [0, y + 4.8, -102] }));
    point(zone, 0xffd8a8, 12, [0, y + 4.5, -102], 14); spot(zone, 0xffe0b0, 80, [2, y + H - 0.2, -103], [0, y + 0.9, -104], 0.5, true, 10);
    rectLight(zone, 0xc8b8e8, 2.0, 22, 5, [0, y + 2.5, Z1 + 0.6], [0, y + 2, -100]);
    const tl = goldText('局长室', 2.2, 0.42, M.goldBright, { res: 112 }); tl.position.set(0, y + 5.6, Z0 - 0.25); tl.rotation.y = Math.PI; zone.add(tl);
    b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g); world.surface(-X, Z1, X, Z0 + 8, 'wood', y - 1, y + 3);
  }
  T('upper built');
  return Promise.all(jobs);
}

export function updateUpper(ctx, dt, t) { if (ctx.rooms?.fire) ctx.rooms.fire.intensity = 7 + Math.sin(t * 13) * 1.2 + Math.sin(t * 7.3) * 0.8; }

function canvasMat(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.75 }); }
const _ptex = new Map();
function paperTex(title) { if (_ptex.has(title)) return _ptex.get(title); const cv = document.createElement('canvas'); cv.width = 256; cv.height = 340; const c = cv.getContext('2d'); c.fillStyle = '#ece6d4'; c.fillRect(0, 0, 256, 340); c.fillStyle = '#1a1612'; c.font = '900 20px \"NB Title\", \"NB Serif\", serif'; c.fillText(title, 16, 36, 224); c.fillStyle = '#8a8276'; for (let y = 60; y < 330; y += 14) c.fillRect(16, y, 140 + ((y * 17) % 80), 5); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; _ptex.set(title, t); return t; }
function factionMat(k) { const N = ['灰塔', '雾港', '无字海岸', '无名海岸', '无妄城', '深瞳', '第二草稿', '蛇之尾', '焚稿会', '余辉剧团', '第十三书签', '（档案缺失）', '']; return canvasMat(480, 300, (c, w, h) => { c.fillStyle = '#16120e'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9a052'; c.lineWidth = 3; c.beginPath(); c.arc(110, 150, 70, 0, 7); c.stroke(); c.fillStyle = '#e8d8b0'; c.font = '900 40px \"NB Title\", \"NB Serif\", serif'; c.fillText(N[k], 210, 140); c.font = '22px "NB Sans", sans-serif'; c.fillStyle = '#9a8e78'; c.fillText('势力评估 · 机密', 210, 190); }); }
function emptyFrameMat() { return canvasMat(480, 300, (c, w, h) => { c.fillStyle = '#1a1612'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7a0f14'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 40); c.bezierCurveTo(160, 200, 320, 80, 480, 260); c.stroke(); c.fillStyle = '#c9a052'; c.beginPath(); c.arc(240, 150, 5, 0, 7); c.fill(); }); }
function eyeChartMat() { return canvasMat(300, 600, (c, w, h) => { c.fillStyle = '#f4f2ec'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.textAlign = 'center'; const rows = ['叙', '事 管', '理 局 你', '在 看 我 吗', '我 也 在 看 你', '请 不 要 眨 眼 睛']; rows.forEach((r, i) => { c.font = `900 ${90 - i * 13}px \"NB Title\", \"NB Serif\", serif`; c.fillText(r, w / 2, 100 + i * 90); }); }); }
function scaleWallMat() { return canvasMat(1200, 520, (c, w, h) => { c.fillStyle = '#0d0f14'; c.fillRect(0, 0, w, h); c.fillStyle = '#e6c67c'; c.font = '900 40px \"NB Title\", \"NB Serif\", serif'; c.fillText('叙事者阶位刻度', 30, 56); const L = ['句', '段', '节', '章', '卷', '册', '典', '？']; L.forEach((s, i) => { const x = 60 + i * 140; c.fillStyle = i === 7 ? '#7a1a1a' : '#c9a052'; c.fillRect(x, 460 - i * 45, 90, 10 + i * 45); c.fillStyle = '#e8dcc0'; c.font = '900 44px \"NB Title\", \"NB Serif\", serif'; c.fillText(s, x + 24, 440 - i * 45); }); }); }
function drawSanity(c, t, W, H) { c.fillStyle = '#02060c'; c.fillRect(0, 0, W, H); c.strokeStyle = '#5affb0'; c.lineWidth = 2; c.beginPath(); for (let x = 0; x < W; x += 3) { const y = H * 0.55 + Math.sin(x * 0.12 + t * 4) * 12 * (Math.sin(x * 0.03 + t) > 0.6 ? 2.2 : 0.4); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.fillStyle = '#cfe8ff'; c.font = '700 26px "NB Sans", sans-serif'; c.fillText('理智值 ' + (86 + Math.round(Math.sin(t * 0.3) * 3)), 10, 32); }
function ravenModel(M) { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.4, metalness: 0.2 }); const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), m); body.scale.set(1, 0.9, 1.6); body.position.y = 0.22; g.add(body); const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), m); head.position.set(0, 0.36, 0.2); g.add(head); const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 8), m); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.35, 0.32); g.add(beak); const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.22), m); tail.position.set(0, 0.18, -0.26); tail.rotation.x = 0.4; g.add(tail); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), M.goldBright); eye.position.set(0.05, 0.38, 0.25); g.add(eye); const perch = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4), M.brass); perch.rotation.z = Math.PI / 2; perch.position.y = 0.05; g.add(perch); return g; }
