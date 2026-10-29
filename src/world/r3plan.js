// R3 平面功能规划（纯数据，无 THREE 依赖：游戏与 tools/r3plan_dump.mjs 共用）
// 约定：所有入选模型的「正面/使用侧」= 模型 +Z（已用 work/r3/orient_sheet_*.png 逐个核对）。
// yaw 按 three.js 绕 Y 轴：+Z → (sin yaw, cos yaw)。桌子的使用侧 = 人坐的一侧；椅子正面 = 人脸朝向。
// 每个条目：{ m: 模型路径(相对 assets/models), x, y, z, yaw, h|w|d: 目标尺寸, tag: 功能分组, on: 'floor'|'desk'|'wall'|'ceil', col: [w,h,d] 碰撞盒 }
// 每个区的「平面规划说明」同时写进 docs/HANDOFF.md「R3 每区布局说明」。

export const R3 = { floor3_office: true, floor2_liaison: true };

const rot = (yaw, lx, lz) => [lx * Math.cos(yaw) + lz * Math.sin(yaw), -lx * Math.sin(yaw) + lz * Math.cos(yaw)];
const at = (o, yaw, lx, lz) => { const [dx, dz] = rot(yaw, lx, lz); return [o[0] + dx, o[1] + dz]; };
// 金属办公桌（Poly Haven metal_office_desk）按桌面高 0.76 m 等比 → 1.93 × 0.91 m
const DW = 1.93, DD = 0.91;
const ROWS = [-101.8, -107.0], COLS = [-24.0, -18.4, -12.8];
/** 吊灯：灯罩 0.45 m，灯底离地 2.6 m，黑铁吊杆到顶棚 */
function pendant(out, x, z, y, H) { out.push({ m: 'r2/ceiling_light_with_chain', x, y: y + 2.6, z, yaw: 0, w: 0.45, tag: '照明', on: 'ceil' }); out.push({ box: 'blackMetal', x, y: y + 2.6 + 0.45 + (H - 3.05) / 2, z, w: 0.025, h: H - 3.05, d: 0.025, tag: '照明', on: 'ceil' }); }
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

// —— 单个工位 K1：桌（使用侧 +Z）+ 椅 + 桌面三件 + 纸篓 ——
function workstation(out, cx, cz, y, yaw, k, o = {}) {
  const tag = o.tag ?? 'K1 工位';
  const top = y + 0.76, W = DW / 2;
  out.push({ m: 'office_desk', x: cx, y, z: cz, yaw, h: 0.76, tag, on: 'floor', col: [DW, 0.76, DD] });
  const P = (lx, lz) => at([cx, cz], yaw, lx, lz);
  const empty = k % 4 === 3; // 每 4 个 1 个「异常」：空位（人离开，椅子拉出斜放、没有杯子）
  // 椅子：人坐在使用侧（+Z）面朝桌子（-Z）→ 椅子 yaw = 桌 yaw + π
  { const pull = DD / 2 + (empty ? 0.45 : 0.26), tw = empty ? 0.35 : (hash(cx, cz) - 0.5) * 0.12; const [x, z] = P(empty ? 0.18 : 0, pull); out.push({ m: o.chair ?? 'r2/old_computer_chair', x, y, z, yaw: yaw + Math.PI + tw, h: 0.92, tag, on: 'floor' }); }
  // 台灯：左后角（人面朝 -Z，左手 = -X）
  { const [x, z] = P(-W + 0.22, -0.24); out.push({ m: 'r2/bankers_lamp', x, y: top, z, yaw: yaw + Math.PI, h: 0.4, tag, on: 'desk' }); }
  // 电话：右后角，三种轮换
  { const ph = ['r2/rotary_telephone', 'r2/phone_vef_ta_68', 'r2/office_phone'][k % 3]; const [x, z] = P(W - 0.2, -0.24); out.push({ m: ph, x, y: top, z, yaw: yaw + Math.PI + 0.25, w: 0.22, tag, on: 'desk' }); }
  // 文件：中右，文件盘/文件夹轮换
  { const fm = ['r2/paper_tray_with_paper_for_bank', 'r2/several_folders', 'r2/document_letter_tray_documents_organizer'][(k + 1) % 3]; const [x, z] = P(W - 0.62, -0.26); out.push({ m: fm, x, y: top, z, yaw: yaw + (fm.includes('folders') ? Math.PI : 0) + 0.04, ...(fm.includes('folders') ? { h: 0.32 } : { w: 0.3 }), tag, on: 'desk' }); }
  // 打字机：每 3 桌 1 台（正中偏前）
  if (k % 3 === 1) { const [x, z] = P(-0.08, 0.02); out.push({ m: 'r2/1930s_style_typewriter_w_o_branding', x, y: top, z, yaw: yaw + Math.PI * 0 , w: 0.42, tag, on: 'desk' }); }
  // 杯子：约一半的桌
  if (!empty && k % 2 === 0) { const [x, z] = P(W - 0.45, 0.14); out.push({ m: 'r2/coffee_mug', x, y: top, z, yaw: yaw + 1.1, h: 0.095, tag, on: 'desk' }); }
  // 纸篓：右脚前方
  { const [x, z] = P(W - 0.3, DD / 2 + 0.22); out.push({ m: 'r2/paper_waste_bin', x, y, z, yaw, h: 0.33, tag, on: 'floor' }); }
}

/** K2：4 人岛（两桌并排 × 两排背靠背，中间绿色隔板）。cx,cz 岛心，岛长轴沿 x */
function island(out, cx, cz, y, k0, o = {}) {
  let k = k0;
  for (const side of [-1, 1]) for (const sx of [-1, 1]) {
    // side=-1：北排（桌在岛心北侧，人坐更北，面朝南）→ 使用侧朝 -Z → yaw π
    const x = cx + sx * DW / 2, z = cz + side * DD / 2;
    workstation(out, x, z, y, side < 0 ? Math.PI : 0, k++, o);
  }
  out.push({ box: 'paintedGreen', x: cx, y: y + 0.76 + 0.2, z: cz, w: DW * 2, h: 0.4, d: 0.04, tag: 'K2 隔板', on: 'desk' });
  return k;
}

export function planFloor3Office(y) {
  const out = []; const H = 5.4;
  const room = { name: '3F 西 · 政策研究室 / 法务处', x0: -27.85, x1: -9.75, z0: -119.8, z1: -92.2, y, H,
    doors: [{ wall: 'E', a: -99, b: -96, label: '入口（来自医务室/电梯厅）' }],
    windows: [-95, -100, -105, -110, -115].map((z) => ({ wall: 'W', a: z - 0.8, b: z + 0.8 })),
    keep: [{ label: '白板（锚点）', x: -27.7, z: -112, w: 0.1, d: 2.6 }, { label: '法务处铜牌（锚点）', x: -9.8, z: -100.5, w: 0.1, d: 0.6 }],
    aisles: [{ label: '主通道', x0: -26.2, x1: -9.9, z0: -98.6, z1: -96.6 }, { label: '南北通道 A', x0: -22.0, x1: -20.4, z0: -110.5, z1: -98.6 }, { label: '南北通道 B', x0: -16.4, x1: -14.8, z0: -118.6, z1: -98.6 }, { label: '岛间通道', x0: -27.5, x1: -11.0, z0: -105.0, z1: -103.6 }, { label: '会议区北通道', x0: -27.5, x1: -10.6, z0: -110.5, z1: -108.6 }] };
  // ① 政策研究室：三列 × 两排 K2 工位岛（24 人），桌长轴沿 x，人面向南北；岛距 2.2 m 通道
  let k = 0;
  for (const cz of ROWS) for (const cx of COLS) k = island(out, cx, cz, y, k);
  // 岛上方吊灯（每岛 1 盏，灯底离地 2.6 m）
  for (const cz of ROWS) for (const cx of COLS) for (const dx of [-1, 1]) pendant(out, cx + dx * DW / 2, cz, y, H);
  // ② 会议区：长桌垂直于西墙白板（长轴沿 x），两侧各 4 椅，白板端留 2.2 m 讲解空间
  { const cx = -22.4, cz = -112.0;
    out.push({ m: 'r2/conference_table_rectangular_6m', x: cx, y, z: cz, yaw: 0, fit: [3.6, 0.76, 1.2], tag: '会议区', on: 'floor', col: [3.6, 0.78, 1.2] });
    for (let i = 0; i < 4; i++) { const x = cx - 1.2 + i * 0.8; out.push({ m: 'r2/dining_chair_02', x, y, z: cz - 0.95, yaw: 0, h: 0.98, tag: '会议区', on: 'floor' }); out.push({ m: 'r2/dining_chair_02', x, y, z: cz + 0.95, yaw: Math.PI, h: 0.98, tag: '会议区', on: 'floor' }); }
    for (const [dx, m, w] of [[-0.9, 'r2/document_letter_tray_documents_organizer', 0.3], [0.4, 'r2/paper_tray_with_paper_for_bank', 0.3]]) out.push({ m, x: cx + dx, y: y + 0.76, z: cz + 0.15, yaw: Math.PI, w, tag: '会议区', on: 'desk' });
    pendant(out, cx - 0.9, cz, y, H); pendant(out, cx + 0.9, cz, y, H);
  }
  // ③ 科长位（东北）：大写字台面向南（背靠档案墙，看得见整间办公室和门），客椅两把
  { const cx = -14.0, cz = -114.6, yaw = Math.PI; // 使用侧朝北（-Z）
    out.push({ m: 'r2/antique_desk', x: cx, y, z: cz, yaw, h: 0.78, tag: '科长位', on: 'floor', col: [1.53, 0.78, 0.63] });
    const [chx, chz] = at([cx, cz], yaw, 0, 0.62); out.push({ m: 'r2/literary_club_chair_preview', x: chx, y, z: chz, yaw: 0, h: 1.05, tag: '科长位', on: 'floor' });
    for (const dx of [-0.45, 0.45]) out.push({ m: 'r2/dining_chair_02', x: cx + dx, y, z: cz + 0.85, yaw: Math.PI - dx * 0.3, h: 0.98, tag: '科长位', on: 'floor' });
    const top = y + 0.78;
    for (const [lx, lz, m, s, dy] of [[-0.58, -0.12, 'r2/bankers_lamp', 0.36, 0], [0.55, -0.12, 'r2/rotary_telephone', 0.24, 0], [0.12, -0.14, 'r2/document_letter_tray_documents_organizer', 0.3, 0], [-0.2, -0.24, 'r2/name_plate', 0.24, 0]]) { const [x, z] = at([cx, cz], yaw, lx, lz); out.push({ m, x, y: top + dy, z, yaw: yaw + Math.PI, w: s, tag: '科长位', on: 'desk' }); }
    out.push({ m: 'r2/paper_waste_bin', x: cx + 0.98, y, z: cz - 0.45, yaw: 0, h: 0.33, tag: '科长位', on: 'floor' });
  }
  // ④ 北墙档案墙：4 抽文件柜成排靠墙（正面朝南），中间 1 组书柜；柜前 1.5 m 取档通道
  { const zc = -119.8 + 0.36; let i = 0;
    for (let x = -27.2; x <= -19.4; x += 0.52) out.push({ m: 'file_cabinet', x, y, z: zc, yaw: 0, h: 1.32, tag: '档案墙', on: 'floor', col: [0.5, 1.32, 0.7], i: i++ });
    out.push({ m: 'r2/book_cabinet_vintage', x: -17.6, y, z: -119.8 + 0.3, yaw: 0, h: 2.2, tag: '档案墙', on: 'floor', col: [1.4, 2.2, 0.5] });
    for (let x = -16.2; x <= -11.0; x += 0.52) out.push({ m: 'file_cabinet', x, y, z: zc, yaw: 0, h: 1.32, tag: '档案墙', on: 'floor', col: [0.5, 1.32, 0.7], i: i++ });
    // 柜顶：档案盒（只放在一半柜子上，成组）
    for (const x of [-26.68, -26.16, -22.0, -12.04]) out.push({ m: 'r2/filing_box', x, y: y + 1.32, z: zc, yaw: 0, w: 0.34, tag: '档案墙', on: 'desk' });
    out.push({ m: 'r2/free_pothos_potted_plant_money_plant', x: -24.08, y: y + 1.32, z: zc, yaw: 0, h: 0.45, tag: '档案墙', on: 'desk' });
  }
  // ⑤ 东墙（门北侧）：复印机 + 纸箱；门南侧：衣帽架、配电箱、灭火器
  out.push({ m: 'r2/mfp_office_printer', x: -10.25, y, z: -104.3, yaw: -Math.PI / 2, h: 1.25, tag: '复印角', on: 'floor', col: [0.65, 1.25, 0.95] });
  out.push({ m: 'r2/set_of_cardboard_boxes', x: -10.4, y, z: -107.0, yaw: -Math.PI / 2, w: 0.9, tag: '复印角', on: 'floor' });
  out.push({ m: 'r2/coat_rack', x: -10.4, y, z: -93.3, yaw: 0, h: 1.85, tag: '入口', on: 'floor' });
  // ⑥ K3 墙面设备带
  out.push({ m: 'r2/exit_sign', x: -9.93, y: y + 3.2, z: -97.5, yaw: -Math.PI / 2, w: 0.36, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/fire_extinguisher', x: -10.0, y, z: -95.5, yaw: -Math.PI / 2, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/electrical_panel_c', x: -9.95, y: y + 1.2, z: -93.3, yaw: -Math.PI / 2, h: 0.8, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/old_wall_clock', x: -18.6, y: y + 2.3, z: -92.4, yaw: Math.PI, h: 0.85, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/cctv_camera', x: -27.4, y: y + 3.6, z: -92.6, yaw: Math.PI * 0.75, h: 0.3, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/cctv_camera', x: -10.3, y: y + 3.6, z: -119.3, yaw: -Math.PI * 0.25, h: 0.3, tag: 'K3', on: 'wall' });
  for (const x of [-23.2, -15.6]) for (const z of [-96.5, -104.4, -114.5]) out.push({ m: 'r2/apollo_smoke_detector', x, y: y + H - 0.06, z, yaw: 0, w: 0.12, tag: 'K3', on: 'ceil' });
  for (const z of [-95, -100, -105, -115]) out.push({ m: 'r2/old_radiator', x: -27.62, y: y + 0.12, z, yaw: Math.PI / 2, w: 1.2, tag: 'K3 暖气（窗下）', on: 'wall' });
  // ⑦ K4 保洁角（西南角，主通道尽头）
  out.push({ m: 'r2/plastic_broom', x: -27.5, y, z: -92.5, yaw: Math.PI / 2, rz: 0.12, h: 1.3, tag: 'K4', on: 'floor' });
  out.push({ m: 'r2/dustpan', x: -27.3, y, z: -93.1, yaw: 1.2, w: 0.3, tag: 'K4', on: 'floor' });
  out.push({ m: 'r2/trashbag', x: -26.7, y, z: -92.75, yaw: 0.4, h: 0.55, tag: 'K4', on: 'floor' });
  out.push({ m: 'r2/multi_cleaner_5_litre', x: -27.45, y, z: -93.7, yaw: 0.2, h: 0.32, tag: 'K4', on: 'floor' });
  // ⑧ K5 积压（南墙西段：等待归档的纸箱 + 搬运车）
  out.push({ m: 'r2/old_paper_cardboard_boxes', x: -23.4, y, z: -93.15, yaw: Math.PI, w: 1.4, tag: 'K5', on: 'floor' });
  out.push({ m: 'r2/hand_truck', x: -21.7, y, z: -92.65, yaw: Math.PI, rx: -0.08, h: 1.2, tag: 'K5', on: 'floor' });
  // ⑨ 绿植：主通道两端（不挡路）
  out.push({ m: 'r2/free_pothos_potted_plant_money_plant', x: -12.0, y, z: -92.85, yaw: 0, h: 0.9, tag: '绿植', on: 'floor' });
  return { room, items: out };
}

export function planFloor2Liaison(y) {
  const out = []; const H = 6;
  const room = { name: '2F 东 · 国际联络处', x0: 0.32, x1: 27.85, z0: -117.55, z1: -92.2, y, H,
    doors: [{ wall: 'S', a: 0.32, b: 9.4, label: '电梯厅开口' }, { wall: 'W', a: -99, b: -96, label: '通宣传处' }],
    windows: [-95, -100, -105, -110, -115].map((z) => ({ wall: 'E', a: z - 0.8, b: z + 0.8 })),
    keep: [{ label: '势力评估墙 13 框（锚点）', x: 13, z: -117.5, w: 25.4, d: 0.12 }, { label: '世界钟（锚点）', x: 0.4, z: -104.4, w: 0.1, d: 8 }, { label: '势力地图', x: 0.4, z: -114.5, w: 0.1, d: 5 }, { label: '简介牌（锚点）', x: 0.4, z: -94, w: 0.1, d: 0.9 }],
    aisles: [{ label: '入口通道', x0: 1.5, x1: 8.5, z0: -98.6, z1: -92.2 }, { label: '主通道', x0: 15.0, x1: 19.4, z0: -112.6, z1: -95.4 }, { label: '会商台前通道', x0: 2.0, x1: 22.0, z0: -112.6, z1: -111.2 }] };
  // 固定件（原剧情锚点 / 旧件，保持原位，只参与检查）
  for (const [lab, x, z, w, d] of [['会客茶几（来电便签锚点）', 10, -101.8, 2.4, 1.0], ['渡鸦标本台（锚点）', 20, -94, 0.6, 0.6], ['保险柜+玻璃罩（锚点）', 24, -112, 0.9, 0.9], ['礼宾旗', 23.6, -93.6, 1.2, 1.2]]) out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, 1, d], tag: '原锚点', on: 'floor' });
  for (const z of [-97.5, -102.5, -107.5, -112.5]) out.push({ fixed: true, m: '固定:窗间书架', x: 27.6, y, z, yaw: 0, size: [0.5, 3, 2.6], tag: '窗间书架', on: 'floor' });
  // ① 会客区：茶几（锚点）北侧三人沙发朝南，南侧两把扶手椅朝北微内收，沙发两端边几 + 台灯
  out.push({ m: 'r2/sofa_01', x: 10, y, z: -103.5, yaw: 0, w: 2.1, tag: '会客区', on: 'floor', col: [2.1, 0.9, 0.9] });
  for (const sx of [-1, 1]) { out.push({ m: 'r2/armchair_01', x: 10 + sx * 1.15, y, z: -99.95, yaw: Math.PI - sx * 0.22, h: 1.05, tag: '会客区', on: 'floor', col: [0.8, 1, 0.8] });
    out.push({ m: 'r2/side_table_01', x: 10 + sx * 1.4, y, z: -103.55, yaw: 0, h: 0.55, tag: '会客区', on: 'floor' });
    out.push({ m: 'r2/bankers_lamp', x: 10 + sx * 1.4, y: y + 0.55, z: -103.6, yaw: sx > 0 ? -0.6 : 0.6, h: 0.4, tag: '会客区', on: 'desk' }); }
  // ② 联络官席：两张写字台背靠东侧窗间书架、面向入口（使用侧朝东），每席一把客椅
  let k = 0;
  for (const cz of [-100.0, -105.0]) { const cx = 23.6, yaw = Math.PI / 2;
    out.push({ m: 'r2/antique_desk', x: cx, y, z: cz, yaw, h: 0.78, tag: '联络官席', on: 'floor', col: [1.53, 0.78, 0.63] });
    const [chx, chz] = at([cx, cz], yaw, 0, 0.62); out.push({ m: 'r2/literary_club_chair_preview', x: chx, y, z: chz, yaw: -Math.PI / 2, h: 1.05, tag: '联络官席', on: 'floor' });
    const [vx, vz] = at([cx, cz], yaw, 0.25, -0.8); out.push({ m: 'r2/dining_chair_02', x: vx, y, z: vz, yaw: Math.PI / 2 + 0.15, h: 0.98, tag: '联络官席', on: 'floor' });
    const top = y + 0.78;
    for (const [lx, lz, m, w] of [[-0.58, -0.12, 'r2/bankers_lamp', 0.36], [0.55, -0.12, ['r2/rotary_telephone', 'r2/phone_vef_ta_68'][k], 0.24], [0.12, -0.14, 'r2/document_letter_tray_documents_organizer', 0.3]]) { const [x, z] = at([cx, cz], yaw, lx, lz); out.push({ m, x, y: top, z, yaw: yaw + Math.PI, w, tag: '联络官席', on: 'desk' }); }
    if (k === 0) { const [x, z] = at([cx, cz], yaw, -0.1, 0.05); out.push({ m: 'r2/1930s_style_typewriter_w_o_branding', x, y: top, z, yaw, w: 0.42, tag: '联络官席', on: 'desk' }); }
    out.push({ m: 'r2/paper_waste_bin', x: cx + 0.6, y, z: cz + 0.95, yaw: 0, h: 0.33, tag: '联络官席', on: 'floor' }); k++; }
  // ③ 评估会商台：正对北墙势力评估墙，长桌平行于墙，椅子只放南侧（人面朝评估墙）
  { const cx = 11.5, cz = -114.7;
    out.push({ m: 'r2/conference_table_rectangular_6m', x: cx, y, z: cz, yaw: 0, fit: [4.4, 0.76, 1.1], tag: '评估会商台', on: 'floor', col: [4.4, 0.76, 1.1] });
    for (let i = 0; i < 5; i++) out.push({ m: 'r2/dining_chair_02', x: cx - 1.7 + i * 0.85, y, z: cz + 0.95, yaw: Math.PI, h: 0.98, tag: '评估会商台', on: 'floor' });
    for (const [dx, m, w] of [[-1.3, 'r2/several_folders', 0], [0.2, 'r2/paper_tray_with_paper_for_bank', 0.3], [1.4, 'r2/document_letter_tray_documents_organizer', 0.3]]) out.push({ m, x: cx + dx, y: y + 0.76, z: cz - 0.2, yaw: Math.PI, ...(w ? { w } : { h: 0.3 }), tag: '评估会商台', on: 'desk' });
    out.push({ m: 'r2/antique_globe', x: cx + 3.2, y, z: cz + 0.1, yaw: 0, h: 1.0, tag: '评估会商台', on: 'floor' });
  }
  // ④ 西墙（世界钟下）：长边台，正面朝东；南墙东段：档案柜一排 + 书柜（正面朝北）
  out.push({ m: 'r2/classicconsole_01', x: 0.72, y, z: -104.4, yaw: Math.PI / 2, w: 1.6, tag: '世界钟边台', on: 'floor', col: [1.6, 0.85, 0.7] });
  for (let i = 0; i < 6; i++) out.push({ m: 'file_cabinet', x: 11.4 + i * 0.52, y, z: -92.2 - 0.27, yaw: Math.PI, h: 1.32, tag: '档案柜', on: 'floor', col: [0.5, 1.32, 0.55] });
  out.push({ m: 'r2/book_cabinet_vintage', x: 16.4, y, z: -92.2 - 0.24, yaw: Math.PI, h: 2.2, tag: '档案柜', on: 'floor', col: [1.15, 2.2, 0.45] });
  out.push({ m: 'r2/filing_box', x: 11.4, y: y + 1.32, z: -92.47, yaw: Math.PI, w: 0.34, tag: '档案柜', on: 'desk' });
  out.push({ m: 'r2/filing_box', x: 11.92, y: y + 1.32, z: -92.47, yaw: Math.PI, w: 0.34, tag: '档案柜', on: 'desk' });
  // ⑤ K3
  out.push({ m: 'r2/fire_extinguisher', x: 10.0, y, z: -92.4, yaw: Math.PI, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/electrical_panel_c', x: 26.8, y: y + 1.2, z: -92.3, yaw: Math.PI, h: 0.8, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/cctv_camera', x: 27.4, y: y + 4.2, z: -92.6, yaw: -Math.PI * 0.75, h: 0.3, tag: 'K3', on: 'wall' });
  for (const x of [5, 14, 22]) for (const z of [-97, -106, -114]) out.push({ m: 'r2/apollo_smoke_detector', x, y: y + H - 0.06, z, yaw: 0, w: 0.12, tag: 'K3', on: 'ceil' });
  for (const z of [-95, -100, -105, -110, -115]) out.push({ m: 'r2/old_radiator', x: 27.62, y: y + 0.12, z, yaw: -Math.PI / 2, w: 1.2, tag: 'K3 暖气（窗下）', on: 'wall' });
  // ⑥ 入口：衣帽架；绿植两盆（角落）
  out.push({ m: 'r2/coat_rack', x: 9.95, y, z: -93.2, yaw: Math.PI, h: 1.85, tag: '入口', on: 'floor' });
  out.push({ m: 'r2/free_pothos_potted_plant_money_plant', x: 0.95, y, z: -116.9, yaw: 0, h: 0.9, tag: '绿植', on: 'floor' });
  out.push({ m: 'r2/free_pothos_potted_plant_money_plant', x: 26.9, y, z: -116.8, yaw: 0, h: 0.9, tag: '绿植', on: 'floor' });
  return { room, items: out };
}

export const PLANS = { floor3_office: (Y) => planFloor3Office(Y), floor2_liaison: (Y) => planFloor2Liaison(Y) };
