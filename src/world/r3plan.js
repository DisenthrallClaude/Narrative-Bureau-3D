// R3 平面功能规划（纯数据，无 THREE 依赖：游戏与 tools/r3plan_dump.mjs 共用）
// 约定：所有入选模型的「正面/使用侧」= 模型 +Z（已用 work/r3/orient_sheet_*.png 逐个核对）。
// yaw 按 three.js 绕 Y 轴：+Z → (sin yaw, cos yaw)。桌子的使用侧 = 人坐的一侧；椅子正面 = 人脸朝向。
// 每个条目：{ m: 模型路径(相对 assets/models), x, y, z, yaw, h|w|d: 目标尺寸, tag: 功能分组, on: 'floor'|'desk'|'wall'|'ceil', col: [w,h,d] 碰撞盒 }
// 每个区的「平面规划说明」同时写进 docs/HANDOFF.md「R3 每区布局说明」。

export const R3 = { floor3_office: true, floor2_liaison: true, floor2_pub: true, director: true, gate: true, archive: true, command_center: true, canteen: true, b1: true, b2: true, archive_b1: true, b4: true, b5: true, b6: true, b7: true, medical: true, dorm: true, dorm2: true, dorm3: true, interrogation: true, hangar: true, security_hall: true, plaza: true };

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
  if (o.monitor !== undefined) { if (o.monitor) { const [x, z] = P(-0.1, -0.2); out.push({ m: 'monitor', x, y: top, z, yaw, h: 0.42, tag, on: 'desk' }); } const [kx, kz] = P(-0.1, 0.14); out.push({ m: 'keyboard', x: kx, y: top, z: kz, yaw, w: 0.42, tag, on: 'desk' }); } else
  { const fm = ['r2/paper_tray_with_paper_for_bank', 'r2/several_folders', 'r2/document_letter_tray_documents_organizer'][(k + 1) % 3]; const [x, z] = P(W - 0.62, -0.26); out.push({ m: fm, x, y: top, z, yaw: yaw + (fm.includes('folders') ? Math.PI : 0) + 0.04, ...(fm.includes('folders') ? { h: 0.32 } : { w: 0.3 }), tag, on: 'desk' }); }
  // 打字机：每 3 桌 1 台（正中偏前）
  if (o.typewriter ?? (o.monitor === undefined && k % 3 === 1)) { const [x, z] = P(-0.08, 0.02); out.push({ m: 'r2/1930s_style_typewriter_w_o_branding', x, y: top, z, yaw: yaw + Math.PI * 0 , w: 0.42, tag, on: 'desk' }); }
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

// ———————————————— R3 批次2：隔断 / 门 / 门牌 / 挂画 / 灯 / 壁灯 / 地毯 ————————————————
// 隔墙（办公隔断）：踢脚 + 1.0 m 实木护墙板 + 上段（glass=玻璃+木竖梃 / 否则墙布）+ 2.9 m 木压顶；门洞两侧门框 + 门楣，门扇半开。
// axis 'x'：墙沿 x 走（z=c 固定）；axis 'z'：墙沿 z 走（x=c 固定）。doors: [{ at, w=1.0, s=±1 门扇开向（+z/+x 侧）, sign, sub }]
const PH = 2.9, PT = 0.12;
function partition(out, axis, c, a0, a1, y, o = {}) {
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1), doors = (o.doors ?? []).map((d) => ({ w: 1.0, s: 1, ...d })).sort((p, q) => p.at - q.at);
  const tag = o.tag ?? '隔墙', up = o.up ?? 'dz_damaskGreen';
  const P = (a, cc = c) => (axis === 'x' ? [a, cc] : [cc, a]);
  const box = (mat, a, L, yc, h, t, extra = {}) => { const [x, z] = P(a); out.push({ box: mat, x, y: yc, z, w: axis === 'x' ? L : t, h, d: axis === 'x' ? t : L, tag, on: 'partv', ...extra }); };
  const segs = []; let s0 = lo;
  for (const d of doors) { segs.push([s0, d.at - d.w / 2]); s0 = d.at + d.w / 2; }
  segs.push([s0, hi]);
  for (const [p, q] of segs) {
    const L = q - p; if (L < 0.02) continue; const m = (p + q) / 2;
    const [x, z] = P(m); out.push({ part: true, x, y, z, yaw: 0, size: axis === 'x' ? [L, PH, PT] : [PT, PH, L], tag, on: 'part' });
    box('dz_base', m, L, y + 0.06, 0.12, PT + 0.02);
    box('dz_panel', m, L, y + 0.56, 0.88, PT);
    box('dz_wain2', m, L, y + 1.03, 0.06, PT + 0.03);
    if (o.glass) {
      box('glassClear', m, L, y + 1.9, 1.68, 0.02);
      const n = Math.max(1, Math.round(L / 1.1)); for (let i = 0; i <= n; i++) box('dz_wain2', p + (L * i) / n, 0.06, y + 1.9, 1.68, PT * 0.8);
      box('dz_wain2', m, L, y + 1.62, 0.03, PT * 0.6); // 中横档
    } else box(up, m, L, y + 1.9, 1.68, PT * 0.9);
    box('dz_wain', m, L, y + 2.81, 0.18, PT + 0.04);
  }
  for (const d of doors) {
    const a = d.at - d.w / 2, b = d.at + d.w / 2;
    box('dz_wain2', a - 0.04, 0.08, y + PH / 2, PH, PT + 0.06); box('dz_wain2', b + 0.04, 0.08, y + PH / 2, PH, PT + 0.06);
    box('dz_wain', d.at, d.w, y + 2.5, 0.8, PT); box('dz_brassDim', d.at, d.w + 0.16, y + 2.12, 0.05, PT + 0.08);
    // 门扇（开 72°，开向 s 侧），双开门两扇
    const leaves = d.w > 1.4 ? [[a, 1, d.w / 2], [b, -1, d.w / 2]] : [[a, 1, d.w]];
    for (const [h0, dir, L] of leaves) {
      const th = 1.25, ux = dir * Math.cos(th), us = Math.sin(th) * d.s; // 沿墙分量 / 垂直墙分量
      const ca = h0 + ux * L / 2, cc = c + us * L / 2;
      const [x, z] = P(ca, cc);
      const yaw = axis === 'x' ? Math.atan2(-us, ux) : Math.atan2(-ux, us);
      out.push({ box: 'dz_wain', x, y: y + 1.05, z, w: L - 0.02, h: 2.08, d: 0.045, yaw, tag: '门扇', on: 'partv' });
    }
    if (d.sign) { // 门牌：贴在门的另一侧（走廊面），门把手侧
      const side = -d.s, off = PT / 2 + 0.006; const [x, z] = P(b + 0.32, c + side * off);
      const yaw = axis === 'x' ? (side > 0 ? 0 : Math.PI) : (side > 0 ? Math.PI / 2 : -Math.PI / 2);
      out.push({ sign: d.sign, sub: d.sub ?? '', x, y: y + 1.6, z, yaw, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
    }
  }
}
/** 挂画 / 海报 / 告示：path 相对 content/；frame: gold | wood | black | cork | none */
function pic(out, path, x, y, z, yaw, w, h, frame = 'gold', o = {}) { out.push({ pic: path, x, y, z, yaw, w, h, frame, size: [w, h, 0.04], tag: o.tag ?? '挂画', on: 'pic', ...o }); }
function light(out, x, y, z, c = 0xffd8a8, i = 3, d = 7) { out.push({ light: true, x, y, z, c, i, d, size: [0.2, 0.2, 0.2], tag: '灯', on: 'light' }); }
function sconce(out, x, y, z, yaw) { out.push({ sconce: true, x, y, z, yaw, size: [0.2, 0.3, 0.2], tag: '壁灯', on: 'sconce' }); }
function rug(out, mat, x, y, z, w, d, yaw = 0) { out.push({ box: mat, x, y: y + 0.007, z, w, h: 0.014, d, yaw, tag: '地毯', on: 'partv' }); }
const ROT = { N: Math.PI, S: 0, E: Math.PI / 2, W: -Math.PI / 2 }; // 正面朝向（+Z 转到该方向）

/** 一对背靠背工位（K2 的半岛） */
function pair(out, cx, cz, y, k, o = {}) { workstation(out, cx, cz - DD / 2, y, Math.PI, k, o); workstation(out, cx, cz + DD / 2, y, 0, k + 1, o); out.push({ box: 'paintedGreen', x: cx, y: y + 0.76 + 0.2, z: cz, w: DW, h: 0.4, d: 0.04, tag: 'K2 隔板', on: 'desk' }); return k + 2; }
/** 处室写字台组：古董写字台（人坐 yaw 的反侧）+ 皮椅 + 两把客椅 + 桌面四件 */
function chiefDesk(out, cx, cz, y, yaw, tag, o = {}) {
  out.push({ m: 'r2/antique_desk', x: cx, y, z: cz, yaw, h: 0.78, tag, on: 'floor', col: [1.53, 0.78, 0.63] });
  const [chx, chz] = at([cx, cz], yaw, 0, 0.62); out.push({ m: 'r2/literary_club_chair_preview', x: chx, y, z: chz, yaw: yaw + Math.PI, h: 1.05, tag, on: 'floor' });
  for (const dx of o.guests === 1 ? [0.25] : [-0.45, 0.45]) { const [x, z] = at([cx, cz], yaw, dx, -0.88); out.push({ m: 'r2/dining_chair_02', x, y, z, yaw: yaw - dx * 0.3, h: 0.98, tag, on: 'floor' }); }
  const top = y + 0.78;
  for (const [lx, lz, m, s] of [[-0.58, -0.12, 'r2/bankers_lamp', 0.36], [0.55, -0.12, o.phone ?? 'r2/rotary_telephone', 0.24], [0.12, -0.14, 'r2/document_letter_tray_documents_organizer', 0.3], [-0.2, -0.26, 'r2/name_plate', 0.24], [0.3, 0.12, 'r2/several_folders', 0]]) { const [x, z] = at([cx, cz], yaw, lx, lz); out.push({ m, x, y: top, z, yaw: yaw + Math.PI + (m.includes('folders') ? 0.3 : 0), ...(s ? { w: s } : { h: 0.3 }), tag, on: 'desk' }); }
  { const [x, z] = at([cx, cz], yaw, 1.0, 0.45); out.push({ m: 'r2/paper_waste_bin', x, y, z, yaw: 0, h: 0.33, tag, on: 'floor' }); }
}
const cabRow = (out, x0, z, y, n, yaw, tag, step = 0.52, alongZ = false) => { for (let i = 0; i < n; i++) out.push({ m: 'file_cabinet', x: alongZ ? x0 : x0 + i * step, y, z: alongZ ? z + i * step : z, yaw, h: 1.32, tag, on: 'floor', col: [0.5, 1.32, 0.7], i }); };
const smoke = (out, y, H, pts) => { for (const [x, z] of pts) out.push({ m: 'r2/apollo_smoke_detector', x, y: y + H - 0.06, z, yaw: 0, w: 0.12, tag: 'K3', on: 'ceil' }); };

// ———————————————— R3 批次3 套件：地面分区 / 磨损 / 吊灯实体 / 灯槽 / 窗光柱 ————————————————
/** 地面分区：0.008 m 薄层覆盖在原地板上；border = 石材收边宽度 */
function floorZ(out, mat, x0, x1, z0, z1, y, o = {}) {
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1), a = Math.min(z0, z1), b = Math.max(z0, z1);
  out.push({ box: mat, x: (lo + hi) / 2, y: y + 0.004 + (o.lift ?? 0), z: (a + b) / 2, w: hi - lo, h: 0.008, d: b - a, uv: o.uv, tag: '地面', on: 'partv' });
  if (o.border) { const t = o.border, m = o.bmat ?? 'r3_stoneBorder'; for (const [x, z, w, d] of [[(lo + hi) / 2, a + t / 2, hi - lo, t], [(lo + hi) / 2, b - t / 2, hi - lo, t], [lo + t / 2, (a + b) / 2, t, b - a - 2 * t], [hi - t / 2, (a + b) / 2, t, b - a - 2 * t]]) out.push({ box: m, x, y: y + 0.0048 + (o.lift ?? 0), z, w, h: 0.0096, d, tag: '地面', on: 'partv' }); }
}
/** 通道磨损贴花（沿长边） */
function wear(out, x0, x1, z0, z1, y) { out.push({ wear: true, x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y: y + 0.0105, x: (x0 + x1) / 2, z: (z0 + z1) / 2, size: [Math.abs(x1 - x0), 0.01, Math.abs(z1 - z0)], tag: '磨损', on: 'partv' }); }
/** 乳白玻璃球吊灯（铜吊杆到顶棚），drop = 灯球中心离地 */
function globe(out, x, z, y, H, drop = 3.0, o = {}) { out.push({ globe: true, x, y: y + drop, z, top: y + H, r: o.r ?? 0.2, cold: !!o.cold, dim: !!o.dim, size: [0.4, 0.4, 0.4], tag: '吊灯', on: 'light' }); }
/** 吸顶灯槽（乳白灯罩 + 铜边），用于小间/走廊 */
function troffer(out, x, z, y, H, yaw = 0, len = 1.2, o = {}) { out.push({ troffer: true, x, y: y + H - 0.04, z, yaw, len, cold: !!o.cold, size: [len, 0.06, 0.32], tag: '灯具', on: 'light' }); }
/** 窗光：体积光柱（从窗口斜射到地面）+ 无投影聚光在地面打亮斑。n = 窗外法线方向（指向室内） */
function winShaft(out, x, y, z, nx, nz, o = {}) { out.push({ shaft: true, x, y, z, nx, nz, w: o.w ?? 1.5, len: o.len ?? 7, spot: o.spot ?? true, i: o.i ?? 1, size: [0.1, 0.1, 0.1], tag: '窗光', on: 'light' }); }

/** 长条展示柜：木柜身 + 玻璃罩 + 内陈文件（L 沿 yaw 的 x 轴） */
function vitrine(out, x, z, y, L, yaw, tag = '展示柜', o = {}) {
  const gh = o.glassH ?? 0.22; // 批次12：o.glassH 加高玻璃罩（放实物）、o.felt 绒布衬底代替散纸；检查用 size 高 = 柜台面（台面上的展品按「桌面件」查悬空）
  out.push({ fixed: true, m: '固定:' + tag, x, y, z, yaw, size: [L, o.felt ? 0.871 : 1.05, 0.62], col: [L, 0.85 + gh, 0.62], tag, on: 'floor' });
  if (o.model) { // 批次31：档案馆陈列柜方块 → Blender 精建 r2/vitrine_6080（胡桃木框芯板 + 铜踢脚 / 铜标签框 + 铜框玻璃罩，柜面 0.845；tools/blender/hall_props.py vitrine）
    out.push({ m: 'r2/vitrine_6080', x, y, z, yaw, w: L + 0.05, tag, on: 'partv' }); out.push({ box: 'r3_mapPaper', x, y: y + 0.851, z, w: L - 0.1, h: 0.004, d: 0.5, yaw, tag, on: 'partv' });
  const n = Math.floor(L / 0.55); for (let i = 0; i < n; i++) { const [px, pz] = at([x, z], yaw, -L / 2 + 0.3 + i * 0.55, (i % 2 ? 0.04 : -0.05)); out.push({ box: i % 3 ? 'dz_paper' : 'dz_paper2', x: px, y: y + 0.856, z: pz, w: 0.3, h: 0.006, d: 0.38, yaw: yaw + (hash(px, pz) - 0.5) * 0.3, tag, on: 'partv' }); }
    return; }
  out.push({ box: 'dz_wain', x, y: y + 0.41, z, w: L, h: 0.82, d: 0.6, yaw, tag, on: 'partv' });
  out.push({ box: 'dz_wain2', x, y: y + 0.83, z, w: L + 0.04, h: 0.03, d: 0.64, yaw, tag, on: 'partv' });
  out.push({ box: 'r3_mapPaper', x, y: y + 0.851, z, w: L - 0.1, h: 0.004, d: 0.5, yaw, tag, on: 'partv' });
  out.push({ box: 'r3_glassCase', x, y: y + 0.85 + gh / 2, z, w: L - 0.02, h: gh, d: 0.58, yaw, tag, on: 'partv' });
  if (gh > 0.22) { // 批次12 收尾：高罩改「四角铜立柱 + 顶面铜边框」，原整块端板 + 整块顶板把玻璃罩盖成了不透明木盒（ec_vit 特写）
    for (const kx of [-1, 1]) for (const kz of [-1, 1]) { const [px, pz] = at([x, z], yaw, kx * (L / 2 - 0.01), kz * 0.29); out.push({ box: 'dz_brassDim', x: px, y: y + 0.85 + gh / 2, z: pz, w: 0.02, h: gh + 0.02, d: 0.02, yaw, tag, on: 'partv' }); }
    for (const kz of [-1, 1]) { const [px, pz] = at([x, z], yaw, 0, kz * 0.3); out.push({ box: 'dz_brassDim', x: px, y: y + 0.85 + gh + 0.008, z: pz, w: L + 0.02, h: 0.016, d: 0.02, yaw, tag, on: 'partv' }); }
    for (const kx of [-1, 1]) { const [px, pz] = at([x, z], yaw, kx * (L / 2), 0); out.push({ box: 'dz_brassDim', x: px, y: y + 0.85 + gh + 0.008, z: pz, w: 0.02, h: 0.016, d: 0.62, yaw, tag, on: 'partv' }); }
  } else for (const k of [-1, 1]) { const [px, pz] = at([x, z], yaw, k * (L / 2 - 0.01), 0); out.push({ box: 'dz_brassDim', x: px, y: y + 0.85 + gh / 2, z: pz, w: 0.02, h: gh + 0.02, d: 0.6, yaw, tag, on: 'partv' }); }
  if (o.felt) { out.push({ box: o.felt, x, y: y + 0.861, z, w: L - 0.08, h: 0.02, d: 0.5, yaw, uv: 2, tag, on: 'partv' }); return; }
  const n = Math.floor(L / 0.55); for (let i = 0; i < n; i++) { const [px, pz] = at([x, z], yaw, -L / 2 + 0.3 + i * 0.55, (i % 2 ? 0.04 : -0.05)); out.push({ box: i % 3 ? 'dz_paper' : 'dz_paper2', x: px, y: y + 0.856, z: pz, w: 0.3, h: 0.006, d: 0.38, yaw: yaw + (hash(px, pz) - 0.5) * 0.3, tag, on: 'partv' }); }
}
/** 铜立柱 + 红绳隔离带（pts 依次相连） */
function stanchions(out, pts, y, tag = '隔离带') {
  for (const [x, z] of pts) { out.push({ fixed: true, m: '固定:铜立柱', x, y, z, yaw: 0, size: [0.3, 0.95, 0.3], tag, on: 'floor' }); out.push({ box: 'brass', x, y: y + 0.47, z, w: 0.05, h: 0.94, d: 0.05, tag, on: 'partv' }); out.push({ box: 'dz_brassDim', x, y: y + 0.015, z, w: 0.3, h: 0.03, d: 0.3, tag, on: 'partv' }); }
  for (let i = 0; i + 1 < pts.length; i++) { const [a, b] = [pts[i], pts[i + 1]]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); out.push({ box: 'dz_rugRed', x: (a[0] + b[0]) / 2, y: y + 0.84, z: (a[1] + b[1]) / 2, w: L - 0.06, h: 0.035, d: 0.035, yaw: Math.atan2(-(b[1] - a[1]), b[0] - a[0]), tag, on: 'partv' }); }
}

/** 踏步（沿 z）：zTop 处高 yTop、zBot 处高 yBot；w 宽；r3build 生成踏步 + 斜坡碰撞 */
function stair(out, x, zBot, zTop, yBot, yTop, w = 1.4, mat = 'blackMarble') { out.push({ stair: true, x, z: (zBot + zTop) / 2, zBot, zTop, yBot, yTop, w, mat, y: yBot, size: [w, yTop - yBot, Math.abs(zTop - zBot)], tag: '踏步', on: 'partv' }); }

/** 实墙（带碰撞）：mat 材质盒 + part 碰撞体 */
function wallBox(out, mat, x, z, w, d, y, h, tag = '墙') { out.push({ box: mat, x, y: y + h / 2, z, w, h, d, uv: 0.5, tag, on: 'partv' }); out.push({ part: true, x, y, z, yaw: 0, size: [w, h, d], tag, on: 'part' }); }
/** 管线（沿 x 或 z 的圆管），r 半径 */
function pipe(out, mat, axis, a0, a1, c, y, r = 0.08) { out.push({ pipe: true, mat, axis, a0, a1, c, y, r, x: axis === 'x' ? (a0 + a1) / 2 : c, z: axis === 'x' ? c : (a0 + a1) / 2, size: [0.1, 0.1, 0.1], tag: '管线', on: 'partv' }); }

// ================= 3F 西 · 政策研究室 / 法务处（批次2：隔断分间） =================
export function planFloor3Office(y) {
  const out = []; const H = 5.4, X0 = -27.85, X1 = -9.75, Z0 = -119.8, Z1 = -92.2;
  const room = { name: '3F 西 · 政策研究室 / 法务处（隔断版）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'E', a: -99, b: -96, label: '入口（来自医务室/电梯厅）' }],
    windows: [-95, -100, -105, -110, -115].map((z) => ({ wall: 'W', a: z - 0.8, b: z + 0.8 })),
    keep: [{ label: '白板（锚点）', x: -27.7, z: -112, w: 0.1, d: 2.6 }, { label: '法务处铜牌（锚点）', x: -9.8, z: -100.5, w: 0.1, d: 0.6 }],
    rooms: [['打字室', -24.4, -94.3], ['茶水间', -18.5, -94.3], ['收发 · 复印', -12.9, -94.0], ['政策研究室（开敞）', -21.7, -99.3], ['法务处长室', -12.6, -102.2], ['法务科', -12.6, -107.2], ['法务档案间', -12.6, -114.9], ['会议室', -24.2, -109.3], ['科长室', -18.0, -109.3], ['档案墙 · 取档带', -22.0, -118.3]],
    aisles: [{ label: '主通道', x0: -27.0, x1: -9.9, z0: -98.6, z1: -96.7 }, { label: '南北通道 A', x0: -22.3, x1: -21.1, z0: -108.5, z1: -98.6 }, { label: '南北通道 B', x0: -16.9, x1: -15.5, z0: -108.5, z1: -98.6 }, { label: '岛间通道', x0: -27.0, x1: -15.5, z0: -104.4, z1: -103.4 }, { label: '取档带', x0: -27.6, x1: -15.6, z0: -118.9, z1: -117.55 }, { label: '档案间通道', x0: -20.5, x1: -15.6, z0: -117.4, z1: -115.4 }] };
  // —— 隔断 ——
  partition(out, 'x', -96.5, X0, -21.0, y, { glass: true, doors: [{ at: -22.7, s: 1, sign: '打字室', sub: '收文 · 誊录' }] });
  partition(out, 'x', -96.5, -21.0, -16.0, y, { doors: [{ at: -17.2, s: 1, sign: '茶水间' }] });
  partition(out, 'z', -21.0, -96.5, Z1, y, {}); partition(out, 'z', -16.0, -96.5, Z1, y, {});
  partition(out, 'z', -15.4, -101.4, Z0, y, { glass: true, doors: [{ at: -107.2, s: 1, sign: '法务科', sub: '文本合规审查' }] });
  partition(out, 'x', -101.4, -15.4, X1, y, { glass: true, doors: [{ at: -14.2, s: -1, sign: '法务处长室', sub: '处长 · 叶寻（代）' }] });
  partition(out, 'x', -106.4, -15.4, X1, y, { glass: true });
  partition(out, 'x', -114.4, -15.4, X1, y, { doors: [{ at: -14.4, s: -1, sign: '档案间', sub: '非经批准不得入内' }] });
  partition(out, 'x', -108.6, X0, -20.6, y, { doors: [{ at: -21.6, s: -1, sign: '会议室', sub: '第一会议室' }] });
  partition(out, 'x', -108.6, -20.6, -15.4, y, { glass: true, doors: [{ at: -16.4, s: -1, sign: '科长室', sub: '政策研究室' }] });
  partition(out, 'z', -20.6, -108.6, -117.4, y, {}); partition(out, 'x', -117.4, X0, -20.6, y, {});
  partition(out, 'x', -113.8, -20.6, -15.4, y, { glass: true });
  // —— ① 政策研究室（开敞）：2 列 × 2 排 K2 = 16 席 ——
  let k = 0; const COL2 = [-24.4, -19.0], ROW2 = [-101.6, -106.2];
  for (const cz of ROW2) for (const cx of COL2) k = island(out, cx, cz, y, k);
  for (const cz of ROW2) for (const cx of COL2) for (const dx of [-1, 1]) pendant(out, cx + dx * DW / 2, cz, y, H);
  for (const cz of ROW2) light(out, -21.7, y + 2.3, cz, 0xffd6a0, 4, 7.5);
  // 公告栏（打字室隔断北面，朝北）：红头文件 117 号 + 白板便签
  pic(out, 'textures/b05/B05_内部通知117号.png', -25.3, y + 1.75, -96.5 - 0.075, ROT.N, 0.6, 0.8, 'cork', { cork: [1.6, 1.0] });
  pic(out, 'textures/b04/B04_入职须知折页.png', -24.55, y + 1.85, -96.5 - 0.07, ROT.N, 0.42, 0.28, 'none');
  out.push({ m: 'r2/old_wall_clock', x: -18.5, y: y + 2.35, z: -96.5 - 0.1, yaw: ROT.N, h: 0.5, tag: 'K3', on: 'wall' });
  // —— ② 打字室（南侧，靠窗）：三张打字桌面朝南墙 ——
  for (const [i, x] of [-26.73, -24.75, -22.77].entries()) workstation(out, x, Z1 - 0.5, y, Math.PI, 30 + i, { typewriter: true, tag: '打字室' });
  out.push({ m: 'r2/old_paper_cardboard_boxes', x: -21.65, y, z: -95.7, yaw: ROT.W, w: 0.9, tag: '打字室', on: 'floor' });
  light(out, -24.4, y + 2.4, -94.3, 0xffe0b8, 2.5, 6);
  // —— ③ 茶水间 ——
  out.push({ box: 'dz_wain', x: -18.5, y: y + 0.44, z: Z1 - 0.33, w: 2.6, h: 0.88, d: 0.6, tag: '茶水间', on: 'partv' });
  out.push({ fixed: true, m: '固定:茶水柜台', x: -18.5, y, z: Z1 - 0.33, yaw: 0, size: [2.6, 0.9, 0.6], col: [2.6, 0.9, 0.6], tag: '茶水间', on: 'floor' });
  out.push({ box: 'whiteMarble', x: -18.5, y: y + 0.9, z: Z1 - 0.34, w: 2.66, h: 0.04, d: 0.64, tag: '茶水间', on: 'partv' });
  out.push({ box: 'dz_wain2', x: -18.5, y: y + 1.75, z: Z1 - 0.13, w: 2.2, h: 0.03, d: 0.24, tag: '茶水间', on: 'partv' });
  out.push({ m: 'r2/vintage_electric_kettle', x: -19.4, y: y + 0.92, z: Z1 - 0.35, yaw: 0.3, h: 0.24, tag: '茶水间', on: 'desk' });
  out.push({ m: 'r2/plastic_thermos', x: -19.0, y: y + 0.92, z: Z1 - 0.3, yaw: 0, h: 0.32, tag: '茶水间', on: 'desk' });
  for (const [i, x] of [-18.3, -18.05, -17.8].entries()) out.push({ m: 'r2/coffee_mug', x, y: y + 0.92, z: Z1 - 0.42 + i * 0.03, yaw: i, h: 0.095, tag: '茶水间', on: 'desk' });
  for (const [i, x] of [-19.0, -18.7, -18.4, -18.1].entries()) out.push({ m: 'r2/coffee_mug', x, y: y + 1.77, z: Z1 - 0.13, yaw: i * 0.7, h: 0.095, tag: '茶水间', on: 'shelf' });
  out.push({ m: 'r2/round_wooden_table_01', x: -18.6, y, z: -94.75, yaw: 0, h: 0.74, tag: '茶水间', on: 'floor', col: [0.85, 0.74, 0.85] });
  out.push({ m: 'r2/dining_chair_02', x: -19.55, y, z: -94.75, yaw: ROT.E, h: 0.95, tag: '茶水间', on: 'floor' });
  out.push({ m: 'r2/dining_chair_02', x: -17.65, y, z: -94.95, yaw: ROT.W + 0.2, h: 0.95, tag: '茶水间', on: 'floor' });
  out.push({ m: 'r2/coffee_mug', x: -18.45, y: y + 0.74, z: -94.6, yaw: 1, h: 0.095, tag: '茶水间', on: 'desk' });
  pic(out, 'textures/b05/B05_海报_篇幅补充剂.png', -21.0 + 0.075, y + 1.75, -94.4, ROT.E, 0.6, 0.9, 'black');
  light(out, -18.5, y + 2.4, -94.4, 0xffe6c4, 2, 5);
  // —— ④ 收发 · 复印（东南，开敞）——
  out.push({ m: 'r2/mfp_office_printer', x: -13.3, y, z: Z1 - 0.52, yaw: ROT.N, h: 1.25, tag: '收发复印', on: 'floor', col: [0.65, 1.25, 0.95] });
  out.push({ m: 'r2/set_of_cardboard_boxes', x: -12.1, y, z: Z1 - 0.5, yaw: 0, w: 0.9, tag: '收发复印', on: 'floor' });
  out.push({ m: 'r2/church_pew_bench', x: -14.8, y, z: -95.75, yaw: ROT.N, w: 1.5, tag: '收发复印', on: 'floor' });
  out.push({ m: 'r2/coat_rack', x: -10.4, y, z: -93.3, yaw: 0, h: 1.85, tag: '入口', on: 'floor' });
  // —— ⑤ 法务处长室 ——
  chiefDesk(out, -12.4, -104.6, y, Math.PI, '法务处长室');
  out.push({ m: 'r2/book_cabinet_vintage', x: X1 - 0.26, y, z: -103.2, yaw: ROT.W, h: 2.2, tag: '法务处长室', on: 'floor', col: [1.4, 2.2, 0.5] });
  out.push({ m: 'file_cabinet', x: X1 - 0.36, y, z: -105.5, yaw: ROT.W, h: 1.32, tag: '法务处长室', on: 'floor', col: [0.5, 1.32, 0.7] });
  out.push({ m: 'r2/filing_box', x: X1 - 0.36, y: y + 1.32, z: -105.5, yaw: ROT.W, w: 0.34, tag: '法务处长室', on: 'desk' });
  out.push({ m: 'r2/coat_rack', x: -15.0, y, z: -101.85, yaw: 0, h: 1.85, tag: '法务处长室', on: 'floor' });
  rug(out, 'dz_rugRed', -12.4, y, -104.1, 3.2, 2.6);
  pic(out, 'textures/emblems/N01.jpg', X1 - 0.03, y + 2.65, -103.2, ROT.W, 0.62, 0.62, 'gold');
  light(out, -12.4, y + 2.4, -103.9, 0xffd8a8, 3, 6);
  // —— ⑥ 法务科：两张工位靠东墙、文件柜贴北墙、待审卷宗 ——
  workstation(out, -11.3, -108.75, y, 0, 40, { tag: '法务科' }); workstation(out, -11.3, -111.55, y, 0, 41, { tag: '法务科', typewriter: true });
  cabRow(out, -13.4, -114.4 + 0.41, y, 7, 0, '法务科');
  for (const x of [-13.4, -12.88, -11.32]) out.push({ m: 'r2/filing_box', x, y: y + 1.32, z: -113.99, yaw: 0, w: 0.34, tag: '法务科', on: 'desk' });
  out.push({ m: 'r2/old_paper_cardboard_boxes', x: -14.65, y, z: -112.2, yaw: ROT.E, w: 0.9, tag: '法务科', on: 'floor' });
  out.push({ m: 'r2/set_of_cardboard_boxes', x: -14.7, y, z: -110.4, yaw: ROT.E, w: 0.8, tag: '法务科', on: 'floor' });
  pic(out, 'textures/emblems/N21.jpg', X1 - 0.03, y + 1.75, -110.15, ROT.W, 0.42, 0.42, 'wood');
  light(out, -12.6, y + 2.4, -110.2, 0xffe2b8, 3, 6);
  // —— ⑦ 法务档案间：书柜贴北墙、文件柜贴东墙、中间背靠背柜组 ——
  for (const x of [-14.35, -12.9, -11.45]) out.push({ m: 'r2/book_cabinet_vintage', x, y, z: Z0 + 0.26, yaw: 0, h: 2.2, tag: '档案间', on: 'floor', col: [1.4, 2.2, 0.5] });
  cabRow(out, X1 - 0.36, -118.64, y, 7, ROT.W, '档案间', 0.52, true);
  cabRow(out, -14.3, -117.04, y, 5, Math.PI, '档案间'); cabRow(out, -14.3, -116.3, y, 5, 0, '档案间');
  for (const [x, z] of [[-14.3, -117.04], [-13.78, -116.3], [-12.22, -117.04], [-12.22, -116.3]]) out.push({ m: 'r2/filing_box', x, y: y + 1.32, z, yaw: 0, w: 0.34, tag: '档案间', on: 'desk' });
  out.push({ m: 'r2/hand_truck', x: -10.8, y, z: -114.95, yaw: ROT.W, rx: -0.08, h: 1.2, tag: '档案间', on: 'floor' });
  light(out, -12.6, y + 2.5, -117.3, 0xe8eeff, 2.2, 6);
  // —— ⑧ 会议室：长桌垂直于白板，北墙边柜 + 考场照片 ——
  { const cx = -23.85, cz = -113.0;
    out.push({ m: 'r2/conference_table_rectangular_6m', x: cx, y, z: cz, yaw: 0, fit: [3.6, 0.76, 1.2], tag: '会议室', on: 'floor', col: [3.6, 0.78, 1.2] });
    for (let i = 0; i < 4; i++) { const x = cx - 1.2 + i * 0.8; out.push({ m: 'r2/dining_chair_02', x, y, z: cz - 0.95, yaw: 0, h: 0.98, tag: '会议室', on: 'floor' }); out.push({ m: 'r2/dining_chair_02', x, y, z: cz + 0.95, yaw: Math.PI, h: 0.98, tag: '会议室', on: 'floor' }); }
    out.push({ m: 'r2/dining_chair_02', x: cx + 2.25, y, z: cz, yaw: ROT.W, h: 0.98, tag: '会议室', on: 'floor' });
    for (const [dx, dz, m, w] of [[-0.9, 0.3, 'r2/document_letter_tray_documents_organizer', 0.3], [0.4, -0.3, 'r2/paper_tray_with_paper_for_bank', 0.3], [1.2, 0.25, 'r2/several_folders', 0]]) out.push({ m, x: cx + dx, y: y + 0.76, z: cz + dz, yaw: Math.PI, ...(w ? { w } : { h: 0.3 }), tag: '会议室', on: 'desk' });
    for (const dx of [-0.8, 0.8]) out.push({ m: 'r2/coffee_mug', x: cx + dx, y: y + 0.76, z: cz + 0.42, yaw: dx, h: 0.095, tag: '会议室', on: 'desk' });
    out.push({ m: 'r2/classicconsole_01', x: -24.3, y, z: -117.03, yaw: 0, w: 1.6, tag: '会议室', on: 'floor', col: [1.6, 0.98, 0.61] });
    out.push({ m: 'r2/brass_vase_02', x: -24.85, y: y + 0.984, z: -117.03, yaw: 0, h: 0.4, tag: '会议室', on: 'desk' });
    pic(out, 'textures/emblems/N26.jpg', -24.3, y + 1.95, -117.4 + 0.075, 0, 2.1, 0.9, 'gold');
    pendant(out, cx - 0.9, cz, y, H); pendant(out, cx + 0.9, cz, y, H); light(out, cx, y + 2.3, cz, 0xffdcb0, 3.5, 7);
  }
  // —— ⑨ 科长室 ——
  chiefDesk(out, -18.0, -112.4, y, Math.PI, '科长室', { phone: 'r2/phone_vef_ta_68' });
  out.push({ m: 'r2/book_cabinet_vintage', x: -20.6 + 0.32, y, z: -110.4, yaw: ROT.E, h: 2.2, tag: '科长室', on: 'floor', col: [1.4, 2.2, 0.5] });
  light(out, -18.0, y + 2.4, -111.2, 0xffd8a8, 2.5, 5.5);
  // —— ⑩ 档案墙（北墙）+ 复印机（档案间通道）——
  cabRow(out, -27.2, Z0 + 0.36, y, 12, 0, '档案墙');
  out.push({ m: 'r2/book_cabinet_vintage', x: -20.25, y, z: Z0 + 0.3, yaw: 0, h: 2.2, tag: '档案墙', on: 'floor', col: [1.4, 2.2, 0.5] });
  cabRow(out, -19.0, Z0 + 0.36, y, 7, 0, '档案墙');
  for (const x of [-26.68, -26.16, -22.0, -18.48, -16.4]) out.push({ m: 'r2/filing_box', x, y: y + 1.32, z: Z0 + 0.36, yaw: 0, w: 0.34, tag: '档案墙', on: 'desk' });
  out.push({ m: 'r2/mfp_office_printer', x: -17.0, y, z: -113.8 - 0.55, yaw: ROT.N, h: 1.25, tag: '复印', on: 'floor', col: [0.65, 1.25, 0.95] });
  out.push({ m: 'r2/set_of_cardboard_boxes', x: -18.4, y, z: -114.3, yaw: 0, w: 0.8, tag: 'K5', on: 'floor' });
  // —— K3 / K4 ——
  out.push({ m: 'r2/exit_sign', x: -9.93, y: y + 3.2, z: -97.5, yaw: -Math.PI / 2, w: 0.36, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/fire_extinguisher', x: -10.0, y, z: -95.5, yaw: -Math.PI / 2, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/electrical_panel_c', x: -9.95, y: y + 1.2, z: -93.3, yaw: -Math.PI / 2, h: 0.8, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/cctv_camera', x: -27.6, y: y + 3.6, z: -98.8, yaw: Math.PI * 0.75, h: 0.3, tag: 'K3', on: 'ceil' });
  out.push({ m: 'r2/cctv_camera', x: -10.0, y: y + 3.6, z: -98.9, yaw: -Math.PI / 2, h: 0.3, tag: 'K3', on: 'ceil' });
  smoke(out, y, H, [[-24.4, -101.6], [-19, -101.6], [-24.4, -106.2], [-19, -106.2], [-24.4, -94.3], [-18.5, -94.3], [-12.6, -103.9], [-12.6, -110.4], [-12.6, -117], [-23.8, -113], [-18, -111.2], [-21, -118.3]]);
  for (const z of [-95, -100, -105, -110, -115]) out.push({ m: 'r2/old_radiator', x: -27.62, y: y + 0.12, z, yaw: Math.PI / 2, w: 1.2, tag: 'K3 暖气（窗下）', on: 'wall' });
  out.push({ m: 'r2/plastic_broom', x: -27.55, y, z: -97.3, yaw: Math.PI / 2, rz: 0.12, h: 1.3, tag: 'K4', on: 'floor' });
  out.push({ m: 'r2/dustpan', x: -27.35, y, z: -97.85, yaw: 1.2, w: 0.3, tag: 'K4', on: 'floor' });
  out.push({ m: 'r2/multi_cleaner_5_litre', x: -27.5, y, z: -98.35, yaw: 0.2, h: 0.32, tag: 'K4', on: 'floor' });
  // 壁灯（隔断与墙面，暖光层次）
  for (const [x, z, yaw] of [[-25.3, -96.5 - 0.07, ROT.N], [-19.0, -108.6 + 0.07, 0], [-12.6, -101.4 + 0.07, 0], [X1 - 0.02, -108.2, ROT.W], [-27.83, -112, ROT.E]]) sconce(out, x, y + 2.2, z, yaw);
  out.push({ light: true, win: true, x: X0 + 0.3, y: y + 2.0, z: -105, look: [X0 + 6, y + 0.8, -105], w: 0.6, h: 22, c: 0xc0d0ff, i: 1.6, size: [0.1, 0.1, 22], tag: '窗光', on: 'light' });
  // —— 批次3：地面分区（走廊水磨石 + 石材收边 / 开敞区与处室地毯 / 茶水间地砖 / 档案区地胶 / 打字室拼花）+ 磨损 ——
  floorZ(out, 'r3_check', X0, -15.4, -98.6, -96.5, y, { uv: 1.5, border: 0.14 });
  floorZ(out, 'r3_check', -15.4, X1, -101.4, -96.5, y, { uv: 1.5, border: 0.14 });
  floorZ(out, 'r3_carpet', X0, -15.4, -108.6, -98.6, y, { border: 0.1, bmat: 'dz_wain2' });
  floorZ(out, 'r3_parquet', X0, -21.0, -96.5, Z1, y, { uv: 0.4 });
  floorZ(out, 'r3_tile', -21.0, -16.0, -96.5, Z1, y, { uv: 0.42 });
  floorZ(out, 'r3_corr', -16.0, X1, -96.5, Z1, y, {});
  floorZ(out, 'r3_parquet', -15.4, X1, -106.4, -101.4, y, { uv: 0.4 });
  floorZ(out, 'r3_carpetGreen', -15.4, X1, -114.4, -106.4, y, {});
  floorZ(out, 'r3_lino', -15.4, X1, Z0, -114.4, y, {});
  floorZ(out, 'r3_carpetRed', X0, -20.6, -117.4, -108.6, y, { border: 0.1, bmat: 'dz_wain2' });
  floorZ(out, 'r3_carpetGreen', -20.6, -15.4, -113.8, -108.6, y, {});
  floorZ(out, 'r3_lino', X0, -20.6, Z0, -117.4, y, {}); floorZ(out, 'r3_lino', -20.6, -15.4, -117.4, -113.8, y, {});
  wear(out, -27.0, -10.0, -98.3, -96.9, y); wear(out, -15.2, -10.0, -101.2, -98.4, y);
  // 吊顶灯具：走廊乳白球灯 + 小间吸顶灯槽；窗光柱（西窗）
  for (const x of [-25.5, -21.0, -16.5, -12.4]) globe(out, x, -97.6, y, H, 3.0);
  globe(out, -12.4, -99.8, y, H, 3.0);
  for (const [x, z] of [[-24.4, -94.3], [-18.5, -94.4], [-12.9, -94.2], [-12.6, -110.4], [-18.0, -111.0]]) globe(out, x, z, y, H, 2.75, { r: 0.17 });
  for (const z of [-115.8, -118.4]) globe(out, -12.6, z, y, H, 2.75, { r: 0.17, cold: true });
  for (const z of [-100, -105]) winShaft(out, X0 + 0.15, y + 2.6, z, 1, 0, { i: 1.1 });
  winShaft(out, X0 + 0.15, y + 2.6, -95, 1, 0, { spot: false });
  return { room, items: out };
}

// ================= 2F 东 · 国际联络处（批次2：联络官独立办公室 + 会客屏风 + 翻译组 + 势力徽记小牌） =================
export function planFloor2Liaison(y) {
  const out = []; const H = 6;
  const room = { name: '2F 东 · 国际联络处（隔断版）', x0: 0.32, x1: 27.85, z0: -117.55, z1: -92.2, y, H,
    doors: [{ wall: 'S', a: 0.32, b: 9.4, label: '电梯厅开口' }, { wall: 'W', a: -99, b: -96, label: '通宣传处' }],
    windows: [-95, -100, -105, -110, -115].map((z) => ({ wall: 'E', a: z - 0.8, b: z + 0.8 })),
    keep: [{ label: '势力评估墙 13 框（锚点）', x: 13, z: -117.5, w: 25.4, d: 0.12 }, { label: '世界钟（锚点）', x: 0.4, z: -104.4, w: 0.1, d: 8 }, { label: '势力地图', x: 0.4, z: -114.5, w: 0.1, d: 5 }, { label: '简介牌（锚点）', x: 0.4, z: -94, w: 0.1, d: 0.9 }],
    rooms: [['会客区', 10, -98.9], ['联络官室 A', 24.2, -98.3], ['联络官室 B', 24.2, -103.3], ['翻译 · 电报组', 8.6, -105.6], ['评估会商台', 11.5, -112.8], ['机要柜', 13.8, -93.3]],
    aisles: [{ label: '入口通道', x0: 1.5, x1: 6.2, z0: -98.6, z1: -92.2 }, { label: '主通道', x0: 15.0, x1: 19.4, z0: -112.6, z1: -95.4 }, { label: '会商台前通道', x0: 2.0, x1: 22.0, z0: -112.6, z1: -111.2 }] };
  for (const [lab, x, z, w, d] of [['会客茶几（来电便签锚点）', 10, -101.8, 2.4, 1.0], ['渡鸦标本台（锚点）', 20, -94, 0.6, 0.6], ['保险柜+玻璃罩（锚点）', 24, -112, 0.9, 0.9], ['礼宾旗', 23.6, -93.6, 1.2, 1.2]]) out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, 1, d], tag: '原锚点', on: 'floor' });
  for (const z of [-97.5, -102.5, -107.5, -112.5]) out.push({ fixed: true, m: '固定:窗间书架', x: 27.6, y, z, yaw: 0, size: [0.5, 3, 2.6], tag: '窗间书架', on: 'floor' });
  // —— 隔断：两间联络官室（玻璃隔断，门开向室内，门牌在走廊面）——
  partition(out, 'z', 20.6, -97.5, -107.5, y, { glass: true, doors: [{ at: -101.7, s: 1, sign: '联络官室 A', sub: '灰塔 · 雾港 · 联邦档案局' }, { at: -106.7, s: 1, sign: '联络官室 B', sub: '无名海岸 · 其他' }] });
  for (const z of [-97.5, -102.5, -107.5]) partition(out, 'x', z, 20.6, 27.3, y, { glass: true });
  // ① 会客区：茶几（锚点）+ 沙发 + 扶手椅 + 边几台灯 + 两扇屏风
  out.push({ m: 'r2/sofa_01', x: 10, y, z: -103.5, yaw: 0, w: 2.1, tag: '会客区', on: 'floor', col: [2.1, 0.9, 0.9] });
  for (const sx of [-1, 1]) { out.push({ m: 'r2/armchair_01', x: 10 + sx * 1.15, y, z: -99.95, yaw: Math.PI - sx * 0.22, h: 1.05, tag: '会客区', on: 'floor', col: [0.8, 1, 0.8] });
    out.push({ m: 'r2/side_table_01', x: 10 + sx * 1.4, y, z: -103.55, yaw: 0, h: 0.55, tag: '会客区', on: 'floor' });
    out.push({ m: 'r2/bankers_lamp', x: 10 + sx * 1.4, y: y + 0.55, z: -103.6, yaw: sx > 0 ? -0.6 : 0.6, h: 0.4, tag: '会客区', on: 'desk' }); }
  for (const [x, yaw] of [[6.7, ROT.E], [13.6, ROT.W]]) out.push({ m: 'r2/mid_century_mahogany_folding_screen', x, y, z: -101.6, yaw, h: 1.8, tag: '会客区', on: 'floor' });
  light(out, 10, y + 1.3, -103.0, 0xffcf96, 2.2, 5);
  // ② 联络官室 A / B：写字台背靠窗间书架、面向门
  let k = 0;
  for (const cz of [-100.0, -105.0]) { const cx = 23.6, yaw = Math.PI / 2;
    out.push({ m: 'r2/antique_desk', x: cx, y, z: cz, yaw, h: 0.78, tag: '联络官室', on: 'floor', col: [1.53, 0.78, 0.63] });
    const [chx, chz] = at([cx, cz], yaw, 0, 0.62); out.push({ m: 'r2/literary_club_chair_preview', x: chx, y, z: chz, yaw: -Math.PI / 2, h: 1.05, tag: '联络官室', on: 'floor' });
    for (const dz of [-0.45, 0.45]) out.push({ m: 'r2/dining_chair_02', x: cx - 0.88, y, z: cz + dz, yaw: Math.PI / 2 + dz * 0.3, h: 0.98, tag: '联络官室', on: 'floor' });
    const top = y + 0.78;
    for (const [lx, lz, m, w] of [[-0.58, -0.12, 'r2/bankers_lamp', 0.36], [0.55, -0.12, ['r2/rotary_telephone', 'r2/phone_vef_ta_68'][k], 0.24], [0.12, -0.14, 'r2/document_letter_tray_documents_organizer', 0.3], [-0.2, -0.26, 'r2/name_plate', 0.24]]) { const [x, z] = at([cx, cz], yaw, lx, lz); out.push({ m, x, y: top, z, yaw: yaw + Math.PI, w, tag: '联络官室', on: 'desk' }); }
    if (k === 0) { const [x, z] = at([cx, cz], yaw, -0.1, 0.05); out.push({ m: 'r2/1930s_style_typewriter_w_o_branding', x, y: top, z, yaw, w: 0.42, tag: '联络官室', on: 'desk' }); }
    out.push({ m: 'r2/paper_waste_bin', x: cx + 0.6, y, z: cz + 0.95, yaw: 0, h: 0.33, tag: '联络官室', on: 'floor' });
    out.push({ m: 'file_cabinet', x: 21.0, y, z: cz + (k ? -2.05 : 2.05), yaw: ROT.E, h: 1.32, tag: '联络官室', on: 'floor', col: [0.5, 1.32, 0.7] });
    out.push({ m: 'r2/coat_rack', x: 21.0, y, z: cz + (k ? 1.9 : -1.95), yaw: 0, h: 1.85, tag: '联络官室', on: 'floor' });
    light(out, 23.4, y + 2.5, cz, 0xffd8a8, 2.8, 5.5); k++; }
  // ③ 翻译 · 电报组：一对背靠背工位，每席打字机（电报译稿）
  pair(out, 11.0, -107.8, y, 50, { typewriter: true, tag: '翻译组' }); pair(out, 6.2, -107.8, y, 52, { tag: '翻译组' }); pendant(out, 6.2, -107.8, y, H); pendant(out, 11.0, -107.8, y, H); light(out, 11.0, y + 2.4, -107.8, 0xffdcb0, 2.8, 6);
  // ④ 评估会商台
  { const cx = 11.5, cz = -114.7;
    out.push({ m: 'r2/conference_table_rectangular_6m', x: cx, y, z: cz, yaw: 0, fit: [4.4, 0.76, 1.1], tag: '评估会商台', on: 'floor', col: [4.4, 0.76, 1.1] });
    for (let i = 0; i < 5; i++) out.push({ m: 'r2/dining_chair_02', x: cx - 1.7 + i * 0.85, y, z: cz + 0.95, yaw: Math.PI, h: 0.98, tag: '评估会商台', on: 'floor' });
    for (const [dx, m, w] of [[-1.3, 'r2/several_folders', 0], [0.2, 'r2/paper_tray_with_paper_for_bank', 0.3], [1.4, 'r2/document_letter_tray_documents_organizer', 0.3]]) out.push({ m, x: cx + dx, y: y + 0.76, z: cz - 0.2, yaw: Math.PI, ...(w ? { w } : { h: 0.3 }), tag: '评估会商台', on: 'desk' });
    for (const dx of [-0.6, 0.9]) out.push({ m: 'r2/coffee_mug', x: cx + dx, y: y + 0.76, z: cz + 0.3, yaw: dx, h: 0.095, tag: '评估会商台', on: 'desk' });
    out.push({ m: 'r2/antique_globe', x: cx + 3.2, y, z: cz + 0.1, yaw: 0, h: 1.0, tag: '评估会商台', on: 'floor' });
    pendant(out, cx - 1.1, cz, y, H); pendant(out, cx + 1.1, cz, y, H); light(out, cx, y + 2.5, cz + 0.6, 0xffdcb0, 3.2, 7); }
  // ⑤ 西墙世界钟边台、南墙档案柜
  out.push({ m: 'r2/classicconsole_01', x: 0.72, y, z: -104.4, yaw: Math.PI / 2, w: 1.6, tag: '世界钟边台', on: 'floor', col: [1.6, 0.85, 0.7] });
  cabRow(out, 11.4, -92.2 - 0.27, y, 6, Math.PI, '机要柜');
  out.push({ m: 'r2/book_cabinet_vintage', x: 16.4, y, z: -92.2 - 0.24, yaw: Math.PI, h: 2.2, tag: '机要柜', on: 'floor', col: [1.15, 2.2, 0.45] });
  for (const x of [11.4, 11.92, 13.48]) out.push({ m: 'r2/filing_box', x, y: y + 1.32, z: -92.47, yaw: Math.PI, w: 0.34, tag: '机要柜', on: 'desk' });
  // ⑥ 势力徽记小牌（评估墙框右下角）+ 渡鸦信箱上方小画框
  for (const [f, k2] of [['N05', 4], ['N06', 5], ['N08', 7], ['N09', 8], ['N29', 10]]) { const x = 2.2 + (k2 < 7 ? k2 : k2 - 7) * 3.6 + 1.0, yy = y + (k2 < 7 ? 3.6 : 1.6) - 0.58; pic(out, `textures/emblems/${f}.jpg`, x, yy, -117.62, 0, 0.3, 0.3, 'gold', { tag: '势力徽记' }); }
  pic(out, 'textures/emblems/N06.jpg', 20.0, y + 2.3, -92.2 - 0.03, Math.PI, 0.55, 0.55, 'gold');
  // ⑦ K3
  out.push({ m: 'r2/fire_extinguisher', x: 10.0, y, z: -92.4, yaw: Math.PI, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/electrical_panel_c', x: 26.8, y: y + 1.2, z: -92.3, yaw: Math.PI, h: 0.8, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/cctv_camera', x: 27.4, y: y + 4.2, z: -92.6, yaw: -Math.PI * 0.75, h: 0.3, tag: 'K3', on: 'wall' });
  smoke(out, y, H, [[5, -97], [14, -97], [5, -106], [14, -106], [5, -114], [14, -114], [24, -100], [24, -105], [22, -113]]);
  for (const z of [-95, -100, -105, -110, -115]) out.push({ m: 'r2/old_radiator', x: 27.62, y: y + 0.12, z, yaw: -Math.PI / 2, w: 1.2, tag: 'K3 暖气（窗下）', on: 'wall' });
  out.push({ m: 'r2/coat_rack', x: 9.95, y, z: -93.2, yaw: Math.PI, h: 1.85, tag: '入口', on: 'floor' });
  for (const [x, z] of [[1.0, -116.8], [26.8, -116.7], [13.9, -109.9]]) out.push({ m: 'r2/free_pothos_potted_plant_money_plant', x, y, z, yaw: 0, h: 0.7, tag: '绿植', on: 'floor' });
  for (const [x, z, yaw] of [[20.6 - 0.07, -99.6, ROT.W], [20.6 - 0.07, -104.6, ROT.W]]) sconce(out, x, y + 2.2, z, yaw);
  out.push({ light: true, win: true, x: 27.5, y: y + 2.2, z: -105, look: [21, y + 0.8, -105], w: 0.6, h: 22, c: 0xc0d0ff, i: 1.4, size: [0.1, 0.1, 22], tag: '窗光', on: 'light' });
  // —— 批次3：入口登记台（「会客请先登记」）——
  chiefDesk(out, 3.6, -100.0, y, Math.PI, '来访登记', { guests: 1, phone: 'r2/office_phone' });
  out.push({ m: 'r2/desk_bell', x: 3.25, y: y + 0.78, z: -99.75, yaw: 0, w: 0.1, tag: '来访登记', on: 'desk' });
  out.push({ m: 'r2/church_pew_bench', x: 0.62, y, z: -97.6, yaw: ROT.E, w: 1.5, tag: '来访登记', on: 'floor' });
  // —— 批次3：评估墙前（势力评估墙下排 0.6 m 外）两条展示柜 + 西侧地图桌 + 东侧观览长椅 ——
  vitrine(out, 4.8, -117.0, y, 4.4, 0, '势力档案展柜'); vitrine(out, 18.6, -117.0, y, 4.4, 0, '势力档案展柜');
  out.push({ m: 'r2/woodentable_01', x: 4.8, y, z: -114.6, yaw: 0, fit: [2.4, 0.78, 1.1], tag: '地图桌', on: 'floor', col: [2.4, 0.78, 1.1] });
  out.push({ box: 'r3_mapPaper', x: 4.8, y: y + 0.783, z: -114.6, w: 2.0, h: 0.004, d: 0.92, yaw: 0.02, tag: '地图桌', on: 'partv' });
  for (const [dx, dz, m, sz] of [[-0.85, -0.3, 'r2/bankers_lamp', { h: 0.4 }], [0.7, 0.25, 'magnifier', { w: 0.14 }], [0.95, -0.28, 'r2/several_folders', { h: 0.3 }], [-0.3, 0.3, 'r2/coffee_mug', { h: 0.095 }]]) out.push({ m, x: 4.8 + dx, y: y + 0.787, z: -114.6 + dz, yaw: Math.PI + dx, ...sz, tag: '地图桌', on: 'desk' });
  for (const dx of [-0.6, 0.6]) out.push({ m: 'r2/dining_chair_02', x: 4.8 + dx, y, z: -113.75, yaw: Math.PI + dx * 0.2, h: 0.98, tag: '地图桌', on: 'floor' });
  for (const x of [17.3, 19.9]) out.push({ m: 'r2/church_pew_bench', x, y, z: -113.7, yaw: ROT.N, w: 1.5, tag: '观览长椅', on: 'floor' });
  // —— 批次3：地面分区 + 磨损 + 吊灯 + 窗光 ——
  floorZ(out, 'r3_check', 0.32, 27.85, -97.5, -92.2, y, { uv: 1.5, border: 0.16 });
  floorZ(out, 'r3_check', 14.6, 20.6, -111.2, -97.5, y, { uv: 1.5, border: 0.16 });
  floorZ(out, 'r3_corr', 0.32, 27.85, -117.55, -111.2, y, { border: 0.16 });
  floorZ(out, 'r3_corr', 20.6, 27.85, -111.2, -107.5, y, {});
  floorZ(out, 'r3_carpet', 0.32, 14.6, -111.2, -97.5, y, { border: 0.1, bmat: 'dz_wain2' });
  floorZ(out, 'r3_parquet', 20.6, 27.85, -107.5, -97.5, y, { uv: 0.4 });
  wear(out, 1.6, 6.2, -97.4, -92.3, y); wear(out, 15.6, 18.6, -111.0, -97.6, y); wear(out, 2.5, 22.0, -112.4, -111.4, y);
  for (const z of [-95.0, -100.0, -105.0, -110.0]) globe(out, 17.6, z, y, H, 3.3);
  for (const x of [4.8, 18.6]) globe(out, x, -115.6, y, H, 3.2);
  globe(out, 3.6, -96.0, y, H, 3.3);
  for (const z of [-100, -105, -110]) winShaft(out, 27.7, y + 2.6, z, -1, 0, { i: 1.0, spot: z !== -110 });
  winShaft(out, 27.7, y + 2.6, -115, -1, 0, { spot: false });
  return { room, items: out };
}

// ================= 2F 西 · 宣传处（新：发布厅 / 剪辑室 / 器材间 / 打样间 / 文案组 / 运营组） =================
export function planFloor2Pub(y) {
  const out = []; const H = 6, X0 = -27.85, X1 = -0.15, Z0 = -117.85, Z1 = -92.15;
  const room = { name: '2F 西 · 宣传处', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'S', a: -9.4, b: X1, label: '电梯厅开口' }, { wall: 'E', a: -99, b: -96, label: '通联络处' }],
    windows: [-95, -100, -105, -110, -115].map((z) => ({ wall: 'W', a: z - 0.8, b: z + 0.8 })),
    keep: [{ label: '发布厅讲台（锚点）', x: -14, z: -112, w: 1.2, d: 0.7 }, { label: '发布会背景板（锚点）', x: -14, z: -117.6, w: 8, d: 0.1 }, { label: '口径手册书架（锚点）', x: -27.4, z: -102, w: 0.6, d: 1.4 }, { label: '后台评论屏（锚点）', x: -22, z: -96.18, w: 0.55, d: 0.05 }, { label: '打样桌+废稿（锚点）', x: -6, z: -114.6, w: 2.6, d: 2.6 }],
    rooms: [['运营组', -21.0, -93.0], ['文案组（开敞）', -24.4, -103.2], ['新闻发布厅', -14.5, -105.6], ['发布厅前厅', -14.5, -100.2], ['剪辑室', -4.2, -100.5], ['器材间', -4.2, -107.2], ['海报打样间', -4.2, -110.4]],
    aisles: [{ label: '主通道', x0: -27.0, x1: -1.0, z0: -99.4, z1: -97.0 }, { label: '入口通道', x0: -8.0, x1: -1.0, z0: -99.0, z1: -92.2 }, { label: '发布厅中央过道', x0: -14.7, x1: -13.3, z0: -111.0, z1: -104.2 }, { label: '文案组通道', x0: -22.4, x1: -21.1, z0: -116.8, z1: -99.6 }] };
  for (const [lab, x, z, w, d] of [['发布厅讲台', -14, -112, 1.2, 0.7], ['口径手册书架', -27.4, -102, 0.6, 1.4], ['打样桌', -6, -114, 2.6, 1.3], ['废稿纸箱', -6, -116.4, 0.5, 0.5]]) out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, 1, d], tag: '原锚点', on: 'floor' });
  // —— 隔断 ——
  partition(out, 'z', -21.0, -104.0, Z0, y, { up: 'dz_damaskRed' });
  partition(out, 'x', -104.0, -21.0, -8.0, y, { up: 'dz_damaskRed', doors: [{ at: -14.5, w: 2.2, s: -1, sign: '新闻发布厅', sub: '发布中请勿入内' }] });
  partition(out, 'z', -8.0, -99.6, Z0, y, { up: 'dz_damaskRed', doors: [{ at: -107.7, s: 1, sign: '器材间' }, { at: -110.6, s: 1, sign: '海报打样间', sub: '小样 · 二稿 · 待议' }] });
  partition(out, 'x', -99.6, -8.0, X1, y, { glass: true, doors: [{ at: -5.5, s: -1, sign: '剪辑室', sub: '素材 · 口径 · 发布' }] });
  partition(out, 'x', -106.0, -8.0, X1, y, {}); partition(out, 'x', -109.4, -8.0, X1, y, {});
  // —— ① 运营组（南墙下）：四席面朝北，显示器 + 后台评论屏（锚点）——
  for (const [i, x] of [-25, -22, -19, -16].entries()) workstation(out, x, -96.0, y, 0, 60 + i, { monitor: x !== -22, tag: '运营组', chair: 'r2/old_computer_chair' });
  out.push({ box: 'blackMetal', x: -22, y: y + 0.86, z: -96.2, w: 0.05, h: 0.2, d: 0.05, tag: '运营组', on: 'partv' });
  out.push({ box: 'blackMetal', x: -22, y: y + 0.77, z: -96.2, w: 0.22, h: 0.02, d: 0.16, tag: '运营组', on: 'partv' });
  pic(out, 'textures/emblems/N10.jpg', -20.5, y + 2.2, Z1 - 0.03, Math.PI, 0.9, 0.9, 'black');
  pic(out, 'textures/b01/B01_07_海报_叙事高考.png', -17.5, y + 2.3, Z1 - 0.03, Math.PI, 0.8, 1.2, 'black');
  light(out, -20.5, y + 2.6, -95.2, 0xffe0b8, 3, 7);
  // —— ② 文案组（靠窗开敞）：两组 K2 岛 + 北墙资料柜 ——
  let k = 0; for (const cz of [-106.0, -111.4]) { k = island(out, -24.4, cz, y, 70 + k, { tag: '文案组' }); for (const dx of [-1, 1]) pendant(out, -24.4 + dx * DW / 2, cz, y, H); light(out, -24.4, y + 2.3, cz, 0xffd6a0, 3.2, 6.5); }
  cabRow(out, -27.4, Z0 + 0.36, y, 11, 0, '文案组');
  for (const x of [-27.4, -26.88, -24.28, -22.2]) out.push({ m: 'r2/filing_box', x, y: y + 1.32, z: Z0 + 0.36, yaw: 0, w: 0.34, tag: '文案组', on: 'desk' });
  pic(out, 'textures/emblems/N09.jpg', -21.0 - 0.075, y + 1.85, -107.0, ROT.W, 0.8, 0.8, 'black');
  pic(out, 'textures/b01/B01_09_海报_畸变规避.png', -21.0 - 0.075, y + 1.85, -112.0, ROT.W, 0.7, 1.05, 'black');
  // —— ③ 新闻发布厅：两块座席（每块 5 × 4）面向讲台，中央过道 ——
  for (let r = 0; r < 4; r++) for (const bx of [-15.3, -12.9]) for (let c = 0; c < 4; c++) { const x = bx + (bx < -14 ? -c : c) * 0.78; out.push({ m: 'r2/dining_chair_02', x, y, z: -109.4 + r * 0.95, yaw: Math.PI, h: 0.98, tag: '发布厅座席', on: 'floor' }); }
  rug(out, 'dz_rugRed', -14.5, y, -113.6, 8.6, 4.2);
  for (const sx of [-1, 1]) { const x = -14 + sx * 4.7; out.push({ box: 'brass', x, y: y + 1.5, z: -117.2, w: 0.04, h: 3.0, d: 0.04, tag: '局旗', on: 'partv' }); pic(out, 'textures/b01/B01_02_局旗深蓝.png', x + sx * 0.02, y + 2.35, -117.18, 0, 0.9, 1.35, 'none', { tag: '局旗', side: 2 }); }
  light(out, -14.5, y + 3.2, -108.5, 0xffe2c0, 4, 11);
  // —— ④ 发布厅前厅：长椅背靠隔断 + 两块展板 ——
  for (const x of [-18.6, -10.4]) out.push({ m: 'r2/church_pew_bench', x, y, z: -104.0 + 0.4, yaw: 0, w: 1.6, tag: '前厅', on: 'floor' });
  for (const [x, f] of [[-20.2, 'b01/B01_08_海报_规则之泉.png'], [-8.8, 'b03/B03_海报_第七局欢迎你.png']]) { pic(out, 'textures/' + f, x, y + 1.55, -103.4, 0, 0.8, 1.2, 'wood', { stand: true, fy: y }); out.push({ fixed: true, m: '固定:展板', x, y, z: -103.4, yaw: 0, size: [0.9, 1, 0.5], tag: '前厅', on: 'floor' }); }
  // 批次3 前厅重排：签到台移到西侧（面向人流）、中央铜柱红绳排队通道直到发布厅门、东侧记者等候（圆几 + 3 椅 + 报刊架）、衣帽架、绿植
  chiefDesk(out, -17.9, -101.5, y, -Math.PI / 2, '前厅签到', { guests: 1, phone: 'r2/office_phone' });
  out.push({ m: 'r2/desk_bell', x: -17.65, y: y + 0.78, z: -101.0, yaw: 0, w: 0.1, tag: '前厅签到', on: 'desk' });
  stanchions(out, [[-15.5, -100.0], [-15.5, -101.8], [-15.5, -103.4]], y); stanchions(out, [[-13.5, -100.0], [-13.5, -101.8], [-13.5, -103.4]], y);
  out.push({ box: 'dz_rugRed', x: -14.5, y: y + 0.016, z: -101.8, w: 1.6, h: 0.012, d: 4.2, tag: '前厅', on: 'partv' });
  out.push({ m: 'r2/coffee_table_round_01', x: -11.2, y, z: -101.6, yaw: 0, h: 0.5, tag: '记者等候', on: 'floor', col: [0.8, 0.5, 0.8] });
  for (const [dx, dz, yaw] of [[-0.85, 0.15, ROT.E], [0.85, 0.15, ROT.W], [0, -0.85, 0]]) out.push({ m: 'r2/dining_chair_02', x: -11.2 + dx, y, z: -101.6 + dz, yaw: yaw + dx * 0.1, h: 0.98, tag: '记者等候', on: 'floor' });
  out.push({ m: 'r2/cc0_newspaper_stack_ready_to_unity_hdrp', x: -11.1, y: y + 0.5, z: -101.6, yaw: 0.4, w: 0.36, tag: '记者等候', on: 'desk' });
  out.push({ m: 'r2/news_rack_6080', x: -8.7, y, z: -101.2, yaw: 0.3, h: 1.48, tag: '记者等候', on: 'floor' });
  out.push({ m: 'r2/coat_rack', x: -20.4, y, z: -101.6, yaw: 0, h: 1.85, tag: '前厅', on: 'floor' });
  for (const x of [-20.4, -8.6]) out.push({ m: 'r2/free_pothos_potted_plant_money_plant', x, y, z: -100.1, yaw: 0, h: 0.7, tag: '前厅', on: 'floor' });
  light(out, -14.5, y + 2.6, -101.4, 0xffdcb0, 2.5, 6);
  // —— ⑤ 剪辑室：东墙三联剪辑台（双显示器）+ 西侧片库书架 ——
  for (const [i, cz] of [-101.0, -103.3].entries()) { workstation(out, X1 - 0.55, cz, y, -Math.PI / 2, 80 + i, { monitor: true, tag: '剪辑室' }); const [mx, mz] = at([X1 - 0.55, cz], -Math.PI / 2, 0.55, -0.2); out.push({ m: 'monitor', x: mx, y: y + 0.76, z: mz, yaw: -Math.PI / 2 - 0.2, h: 0.38, tag: '剪辑室', on: 'desk' }); }
  for (const z of [-101.3, -103.6]) out.push({ m: 'r2/wooden_bookshelf_worn', x: -8.0 + 0.36, y, z, yaw: ROT.E, h: 2.0, tag: '剪辑室', on: 'floor', col: [1.3, 2.0, 0.45] });
  out.push({ m: 'r2/woodentable_02', x: -4.6, y, z: -104.7, yaw: 0, h: 0.75, tag: '剪辑室', on: 'floor' });
  light(out, -4.0, y + 2.4, -102.6, 0xd8e4ff, 2.6, 6);
  // —— ⑥ 器材间：钢架 + 纸箱 + 推车 ——
  for (const x of [-6.6, -4.9, -3.2]) out.push({ m: 'r2/steel_frame_shelves_02', x, y, z: -106.0 - 0.3, yaw: 0, h: 2.0, tag: '器材间', on: 'floor' });
  for (const [x, z, w] of [[-1.2, -108.8, 0.6], [-1.2, -108.15, 0.5], [-2.0, -108.9, 0.55]]) out.push({ m: 'r2/cardboard_transport_shipping_box', x, y, z, yaw: 0.1, w, tag: '器材间', on: 'floor' });
  out.push({ m: 'r2/hand_truck', x: -0.6, y, z: -106.9, yaw: ROT.W, rx: -0.08, h: 1.2, tag: '器材间', on: 'floor' });
  light(out, -4.0, y + 2.4, -107.7, 0xe8eeff, 1.6, 4.5);
  // —— ⑦ 海报打样间：东墙钉板海报 + 文件柜 ——
  for (const [i, f] of ['b01/B01_07_海报_叙事高考.png', 'b01/B01_08_海报_规则之泉.png', 'b01/B01_09_海报_畸变规避.png', 'emblems/N10.jpg'].entries()) pic(out, 'textures/' + f, X1 - 0.03, y + 1.8, -111.0 - i * 1.25, ROT.W, 0.66, i === 3 ? 0.66 : 1.0, 'none', { tag: '打样海报' });
  out.push({ box: 'dz_cork', x: X1 - 0.02, y: y + 1.8, z: -112.9, w: 0.02, h: 1.5, d: 5.4, tag: '打样海报', on: 'partv' });
  cabRow(out, -6.6, -109.4 - 0.36, y, 3, 0, '打样间');
  light(out, -4.0, y + 2.4, -113.6, 0xffe6c4, 2.6, 6);
  // —— K3 ——
  out.push({ m: 'r2/fire_extinguisher', x: -8.6, y, z: -92.45, yaw: Math.PI, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/exit_sign', x: -0.3, y: y + 3.2, z: -97.5, yaw: ROT.W, w: 0.36, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/cctv_camera', x: -27.4, y: y + 4.2, z: -92.6, yaw: Math.PI * 0.75, h: 0.3, tag: 'K3', on: 'wall' });
  smoke(out, y, H, [[-24.4, -106], [-24.4, -111.4], [-21, -95], [-14.5, -108], [-14.5, -113], [-4, -102.6], [-4, -107.7], [-4, -113.6], [-14.5, -101.5]]);
  for (const z of [-95, -100, -105, -110, -115]) out.push({ m: 'r2/old_radiator', x: -27.62, y: y + 0.12, z, yaw: Math.PI / 2, w: 1.2, tag: 'K3 暖气（窗下）', on: 'wall' });
  for (const [x, z] of [[-27.2, -92.9]]) out.push({ m: 'r2/free_pothos_potted_plant_money_plant', x, y, z, yaw: 0, h: 0.9, tag: '绿植', on: 'floor' });
  for (const [x, z, yaw] of [[-17.5, -104.0 + 0.07, 0], [-11.5, -104.0 + 0.07, 0], [-21.0 - 0.07, -109.5, ROT.W]]) sconce(out, x, y + 2.2, z, yaw);
  out.push({ light: true, win: true, x: X0 + 0.3, y: y + 2.2, z: -105, look: [X0 + 6, y + 0.8, -105], w: 0.6, h: 22, c: 0xc0d0ff, i: 1.4, size: [0.1, 0.1, 22], tag: '窗光', on: 'light' });
  // —— 批次3 剪辑室补：审片沙发 + 放映机 + 电视推车 + 片盒钢架 ——
  out.push({ m: 'r2/sofa_02', x: -3.9, y, z: -102.2, yaw: ROT.E, w: 1.9, tag: '剪辑室', on: 'floor', col: [1.9, 0.75, 0.85] });
  out.push({ m: 'r2/eumig_film_projector', x: -4.75, y: y + 0.75, z: -104.75, yaw: 0, h: 0.3, tag: '剪辑室', on: 'desk' });
  out.push({ m: 'r2/small_wooden_table_01', x: -7.35, y, z: -105.0, yaw: ROT.E, h: 0.72, tag: '剪辑室', on: 'floor', col: [1.2, 0.72, 0.6] });
  out.push({ m: 'r2/television_01', x: -7.35, y: y + 0.72, z: -105.0, yaw: ROT.E, h: 0.42, tag: '剪辑室', on: 'desk' });
  out.push({ m: 'r2/steel_frame_shelves_02', x: -2.4, y, z: -99.95, yaw: Math.PI, h: 2.0, tag: '剪辑室', on: 'floor' });
  for (const [dx, dy, w] of [[-0.3, 0.9, 0.4], [0.25, 0.9, 0.35], [0, 1.55, 0.45]]) out.push({ m: 'r2/cardboard_transport_shipping_box', x: -2.4 + dx, y: y + dy, z: -100.0, yaw: 0.05, w, tag: '剪辑室', on: 'shelf' });
  out.push({ m: 'r2/standing_chalkboard_01', x: -2.5, y, z: -105.55, yaw: Math.PI + 0.12, h: 1.3, tag: '剪辑室', on: 'floor' });
  // —— 批次3 器材间补：南墙第二排钢架 + 架上器材 + 探照灯 / 工具箱 / 摄像机 ——
  for (const x of [-6.6, -4.9]) out.push({ m: 'r2/steel_frame_shelves_02', x, y, z: -109.1, yaw: 0, h: 2.0, tag: '器材间', on: 'floor' });
  for (const [x, dy, m, sz] of [[-6.6, 0.9, 'r2/vintage_video_camera', { h: 0.3 }], [-4.9, 0.9, 'r2/camera_01', { w: 0.16 }], [-3.2, 0.9, 'r2/metal_toolbox', { w: 0.45 }], [-6.6, 1.55, 'r2/cardboard_transport_shipping_box', { w: 0.5 }], [-4.9, 1.55, 'r2/cardboard_transport_shipping_box', { w: 0.45 }]]) out.push({ m, x, y: y + dy, z: -106.3, yaw: Math.PI, ...sz, tag: '器材间', on: 'shelf' });
  out.push({ m: 'r2/portable_searchlight', x: -2.9, y, z: -108.8, yaw: 0.6, h: 0.4, tag: '器材间', on: 'floor' });
  out.push({ m: 'r2/metal_tool_chest', x: -3.6, y, z: -109.0, yaw: 0, h: 0.75, tag: '器材间', on: 'floor' });
  // —— 批次3：地面分区 + 磨损 + 吊灯 + 窗光 ——
  floorZ(out, 'r3_check', X0, X1, -99.6, -97.0, y, { uv: 1.5, border: 0.14 });
  floorZ(out, 'r3_check', -8.0, X1, -97.0, Z1, y, { uv: 1.5, border: 0.14 });
  floorZ(out, 'r3_carpet', X0, -8.0, -97.0, Z1, y, { border: 0.1, bmat: 'dz_wain2' });
  floorZ(out, 'r3_corr', -21.0, -8.0, -104.0, -99.6, y, { border: 0.16 });
  floorZ(out, 'r3_carpetRed', -21.0, -8.0, Z0, -104.0, y, {});
  floorZ(out, 'r3_carpetGreen', X0, -21.0, Z0, -99.6, y, { border: 0.1, bmat: 'dz_wain2' });
  floorZ(out, 'r3_carpet', -8.0, X1, -106.0, -99.6, y, {});
  floorZ(out, 'r3_lino', -8.0, X1, Z0, -106.0, y, {});
  wear(out, -26.5, -1.0, -99.0, -97.6, y); wear(out, -6.5, -2.0, -98.5, -92.4, y); wear(out, -15.2, -13.8, -103.8, -99.8, y);
  for (const x of [-24.0, -18.5, -13.0, -7.5, -3.5]) globe(out, x, -98.3, y, H, 3.3);
  globe(out, -4.5, -95.0, y, H, 3.3);
  for (const [x, z] of [[-4.2, -102.8], [-4.2, -107.7], [-4.2, -113.6]]) globe(out, x, z, y, H, 2.75, { r: 0.17 });
  for (const z of [-100, -105, -110]) winShaft(out, X0 + 0.15, y + 2.6, z, 1, 0, { i: 1.0, spot: z !== -110 });
  winShaft(out, X0 + 0.15, y + 2.6, -95, 1, 0, { spot: false });
  return { room, items: out };
}


// ================= 12F · 局长室（批次2：会客区 + 秘书台 + 灯光层次 + 机要室挂画；原陈设与锚点全保留） =================
export function planDirector(y) {
  const out = []; const H = 7, X0 = -12.85, X1 = 12.85, Z0 = -111.8, Z1 = -92.2;
  const room = { name: '12F · 局长室 / 机要室', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'S', a: -9.4, b: 9.4, label: '电梯厅' }], windows: [-2, -1, 0, 1, 2].map((k) => ({ wall: 'N', a: k * 4.6 - 1.8, b: k * 4.6 + 1.8 })),
    keep: [{ label: '大班台（锚点）', x: 0, z: -104, w: 3.34, d: 1.52 }, { label: '壁炉+黑布画（锚点）', x: -12.55, z: -100, w: 0.6, d: 2.6 }, { label: '齐凌云', x: -3, z: -110, w: 0.8, d: 0.8 }, { label: '机要目录台', x: 10, z: -100.5, w: 1.4, d: 0.8 }],
    rooms: [['局长办公', 0, -106.3], ['会客区', 4, -95.3], ['秘书台', -6, -93.7], ['壁炉角', -9.6, -97.2], ['机要室', 10, -95.6]],
    aisles: [{ label: '入口通道', x0: -3.0, x1: 1.2, z0: -102.6, z1: -93.0 }] };
  for (const [lab, x, z, w, d] of [['大班台', 0, -104, 3.34, 1.52], ['主座', 0, -105.4, 0.9, 0.9], ['壁炉', -12.55, -100, 0.6, 2.6], ['扶手椅', -10, -98.4, 0.9, 0.9], ['扶手椅', -10, -101.6, 0.9, 0.9], ['圆几', -9.4, -100, 0.7, 0.7], ['哥特柜', -12.4, -95.2, 0.8, 2], ['哥特柜', -12.4, -105.6, 0.8, 2], ['胸像台', -8.5, -109.5, 0.7, 0.7], ['青铜簋台', 8.5, -109.5, 0.7, 0.7], ['齐凌云', -3, -110, 0.7, 0.7]]) out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, 1, d], tag: '原陈设', on: 'floor' });
  out.push({ part: true, x: 7, y, z: -99.5, yaw: 0, size: [0.3, H, 9], tag: '机要室隔墙', on: 'part' });
  for (const x of [-10.2, -7.4, -4.6, 4.6, 7.4, 10.2]) out.push({ fixed: true, m: '固定:南墙书柜', x, y, z: -92.55, yaw: 0, size: [2.7, 4.6, 0.6], tag: '书墙', on: 'floor' });
  // ① 会客区：黑皮沙发朝南 + 茶几 + 两把扶手椅 + 地毯
  out.push({ m: 'r2/sofa_01', x: 4.0, y, z: -99.9, yaw: 0, w: 2.1, tag: '会客区', on: 'floor', col: [2.1, 0.85, 0.9] });
  out.push({ m: 'r2/coffeetable_01', x: 4.0, y, z: -98.0, yaw: 0, w: 1.2, tag: '会客区', on: 'floor', col: [1.2, 0.45, 0.7] });
  for (const sx of [-1, 1]) out.push({ m: 'r2/armchair_01', x: 4.0 + sx * 1.25, y, z: -96.35, yaw: Math.PI + sx * 0.25, h: 1.05, tag: '会客区', on: 'floor', col: [0.8, 1, 0.8] });
  out.push({ m: 'r2/side_table_01', x: 5.55, y, z: -100.0, yaw: 0, h: 0.55, tag: '会客区', on: 'floor' });
  out.push({ m: 'r2/bankers_lamp', x: 5.55, y: y + 0.55, z: -100.0, yaw: -0.6, h: 0.4, tag: '会客区', on: 'desk' });
  out.push({ m: 'r2/coffee_mug', x: 3.7, y: y + 0.45, z: -97.9, yaw: 0.4, h: 0.09, tag: '会客区', on: 'desk' });
  rug(out, 'dz_rugNavy', 4.0, y + 0.02, -98.1, 4.2, 4.0);
  light(out, 4.0, y + 2.6, -98.0, 0xffd2a0, 3, 7);
  // ② 秘书台（入口西侧，面向来访者）
  workstation(out, -6.0, -95.6, y, -Math.PI / 2, 90, { typewriter: true, tag: '秘书台' });
  out.push({ m: 'r2/phone_vef_ta_68', x: -5.75, y: y + 0.76, z: -94.85, yaw: Math.PI / 2 + 0.2, w: 0.22, tag: '秘书台', on: 'desk' });
  out.push({ m: 'r2/coat_rack', x: -8.6, y, z: -93.6, yaw: 0, h: 1.85, tag: '秘书台', on: 'floor' });
  light(out, -6.0, y + 2.4, -95.6, 0xffdcb0, 2.4, 6);
  // ③ 主座旁地球仪；绿植；机要室挂画（被涂黑的机密文件）
  out.push({ m: 'r2/antique_globe', x: -2.7, y, z: -103.4, yaw: 0, h: 1.0, tag: '局长办公', on: 'floor' });
  for (const [x, z] of [[11.9, -109.6], [-11.9, -108.9]]) out.push({ m: 'r2/free_pothos_potted_plant_money_plant', x, y, z, yaw: 0, h: 0.8, tag: '绿植', on: 'floor' });
  pic(out, 'textures/emblems/N13.jpg', X1 - 0.03, y + 1.9, -99.2, ROT.W, 0.7, 0.7, 'gold');
  for (const z of [-96.6, -102.4]) sconce(out, 7 - 0.17, y + 2.4, z, ROT.W);
  for (const x of [-9.0, 9.0]) sconce(out, x, y + 2.6, Z1 - 0.62, Math.PI);
  light(out, 0, y + 2.2, -104.2, 0xffd8a8, 2.5, 6); light(out, -9.6, y + 2.0, -100, 0xff9a50, 2, 6);
  // —— 批次3：入口石材走廊（电梯厅 → 大班台）+ 大班台下波斯纹地毯 + 磨损 + 北窗光柱 ——
  floorZ(out, 'r3_check', -3.0, 1.2, -102.6, -92.9, y, { uv: 1.5, border: 0.12 });
  rug(out, 'dz_rugRed', 0, y + 0.01, -105.2, 5.2, 4.0);
  wear(out, -2.4, 0.6, -102.4, -93.2, y);
  for (const x of [-4.6, 0, 4.6]) winShaft(out, x, y + 3.2, Z0 + 0.15, 0, 1, { i: 1.1, spot: x === 0, len: 8 });
  return { room, items: out };
}

// ================= 1F · 正门门廊 / 服务台（批次3 新做；建筑、服务台、局徽墙、叫号屏、导视牌、访客须知碑、干事均为原锚点） =================
export function planGate(y) {
  const out = []; const X0 = -13.9, X1 = 13.9, Z0 = -30, Z1 = -6.4, H = 14;
  const room = { name: '1F · 正门门廊 / 服务台', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'S', a: -3.5, b: 3.5, label: '正门（广场）' }, { wall: 'N', a: -5, b: 5, label: '尖拱门 → 安检大厅' }], windows: [],
    keep: [{ label: '局徽墙 + 叙事管理局京城总部（锚点）', x: 13.75, z: -17, w: 0.3, d: 14 }, { label: '叫号屏（锚点）', x: 13.7, z: -10.4, w: 0.2, d: 4.1 }],
    rooms: [['服务台（1–5 号窗口）', 11.8, -17.0], ['等候区', -9.5, -15.0], ['填单台', -5.6, -24.2], ['礼仪中轴', 0, -18.0], ['入口', 0, -8.2]],
    aisles: [{ label: '礼仪中轴（正门 → 尖拱门）', x0: -2.7, x1: 2.7, z0: -29.6, z1: -6.6 }, { label: '窗口前候办带', x0: 7.6, x1: 9.7, z0: -24.2, z1: -9.8 }] };
  for (const [lab, x, z, w, d] of [['服务台', 10.5, -17, 1.4, 14.3], ['导视牌', 6.8, -8.6, 0.25, 1.15], ['人事处干事', 11.5, -17.0, 0.4, 0.5], ['束柱', -12.9, -12, 1.1, 1.1], ['束柱', -12.9, -24, 1.1, 1.1], ['束柱', 12.9, -12, 1.1, 1.1], ['束柱', 12.9, -24, 1.1, 1.1], ['盆栽', -12.6, -8, 0.8, 0.8], ['盆栽', -12.6, -28.6, 0.8, 0.8], ['盆栽', 12.6, -28.6, 0.8, 0.8], ['盆栽', 12.6, -7.6, 0.8, 0.8]]) out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, 1.2, d], ...(lab === '服务台' ? { col: [w, 1.18, d] } : {}), tag: '原锚点', on: 'floor' });
  for (const r of [0, 1]) for (let k = 0; k < 4; k++) out.push({ fixed: true, m: '固定:访客扶手椅', x: -10.6 + r * 2.2, y, z: -11 - k * 2.2, yaw: 0, size: [0.85, 1, 0.85], tag: '原锚点', on: 'floor' });
  // ① 服务台：台后 4 把高脚凳（3 号窗为干事本人）、每窗台面三件（服务铃 / 文件盘 / 印台电话轮换）、台灯
  const WZ = [-11.4, -14.2, -17.0, -19.8, -22.6], top = y + 1.18;
  for (const [i, z] of WZ.entries()) {
    if (i !== 2) out.push({ m: 'r2/bar_chair_round_01', x: 11.75, y, z, yaw: ROT.W + (i - 2) * 0.05, h: 0.78, tag: '服务台', on: 'floor' });
    out.push({ m: 'r2/desk_bell', x: 10.0, y: top, z: z - 0.35, yaw: 0, w: 0.1, tag: '服务台', on: 'desk' });
    out.push({ m: i % 2 ? 'r2/wooden_flat_filing_tray' : 'r2/document_letter_tray_documents_organizer', x: 10.6, y: top, z: z + 0.25, yaw: ROT.W, w: 0.32, tag: '服务台', on: 'desk' });
    out.push({ m: ['r2/rotary_telephone', 'r2/phone_vef_ta_68', 'r2/office_phone'][i % 3], x: 10.75, y: top, z: z - 0.55, yaw: ROT.W + 0.3, w: 0.22, tag: '服务台', on: 'desk' });
    if (i % 2 === 0) out.push({ m: 'r2/bankers_lamp', x: 10.9, y: top, z: z + 0.7, yaw: ROT.W, h: 0.4, tag: '服务台', on: 'desk' });
  }
  for (const z of [-12.8, -21.2]) out.push({ m: 'r2/coffee_mug', x: 10.8, y: top, z, yaw: z, h: 0.095, tag: '服务台', on: 'desk' });
  // 窗口前「一米线」：每窗前一根铜立柱 + 地面黄铜线
  for (const z of WZ) out.push({ box: 'brass', x: 8.7, y: y + 0.006, z, w: 0.04, h: 0.012, d: 1.6, tag: '一米线', on: 'partv' });
  stanchions(out, [[7.4, -10.2], [7.4, -12.8]], y); stanchions(out, [[7.4, -21.2], [7.4, -23.8]], y);
  // ② 等候区（西侧原扶手椅 2×4）：两张边几 + 台灯、茶几报纸、伞架、西墙告示栏 + 长凳
  for (const z of [-12.1, -16.5]) { out.push({ m: 'r2/side_table_01', x: -9.5, y, z, yaw: 0, h: 0.55, tag: '等候区', on: 'floor' }); out.push({ m: 'r2/bankers_lamp', x: -9.5, y: y + 0.55, z, yaw: ROT.E, h: 0.4, tag: '等候区', on: 'desk' }); }
  out.push({ m: 'r2/cc0_newspaper_stack_ready_to_unity_hdrp', x: -9.5, y: y + 0.55, z: -14.3, yaw: 0.5, w: 0.36, tag: '等候区', on: 'floor' });
  pic(out, 'textures/b01/T01_访客须知告示牌.png', X0 + 0.06, y + 1.95, -20.15, ROT.E, 0.6, 0.85, 'cork', { cork: [1.5, 1.05] });
  pic(out, 'textures/b04/B04_入职须知折页.png', X0 + 0.06, y + 1.95, -20.75, ROT.E, 0.42, 0.28, 'none');
  for (const z of [-19.0, -21.3]) out.push({ m: 'r2/18th_century_bench_from_hungarian_opera', x: X0 + 0.55, y, z, yaw: ROT.E, w: 1.9, tag: '等候区', on: 'floor' });
  for (const x of [-4.6, 4.6]) out.push({ m: 'r2/victorian_umbrella_stand', x, y, z: -7.1, yaw: 0, h: 0.85, tag: '入口', on: 'floor' });
  // ③ 填单台（西北，靠拱门侧）：两张站立书写台（台面 1.05 m）+ 表格、笔、铜牌
  for (const [i, x] of [-7.2, -4.4].entries()) {
    out.push({ m: 'r2/woodentable_01', x, y, z: -25.2, yaw: 0, fit: [2.2, 1.05, 0.8], tag: '填单台', on: 'floor', col: [2.2, 1.05, 0.8] });
    out.push({ box: 'dz_brassDim', x, y: y + 1.055, z: -25.55, w: 2.1, h: 0.012, d: 0.06, tag: '填单台', on: 'partv' });
    for (const dx of [-0.6, 0, 0.6]) out.push({ box: (i + dx) % 2 ? 'dz_paper' : 'dz_paper2', x: x + dx, y: y + 1.056, z: -25.15, w: 0.21, h: 0.004, d: 0.3, yaw: dx * 0.2, tag: '填单台', on: 'partv' });
    out.push({ m: 'r2/fountain_pens', x: x + 0.3, y: y + 1.05, z: -25.4, yaw: 0.4, w: 0.14, tag: '填单台', on: 'desk' });
  }
  out.push({ sign: '填单处', sub: '请先填写《来访登记表》', x: -5.8, y: y + 1.45, z: -25.6 - 0.01, yaw: 0, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  // ④ 入口：导引讲台（安保，面向正门）、擦鞋地毯、灭火器 + 出口标识、监控
  out.push({ m: 'r2/lectern', x: -4.8, y, z: -9.6, yaw: 0, h: 1.15, tag: '导引台', on: 'floor' });
  out.push({ m: 'clipboard', x: -4.8, y: y + 1.12, z: -9.55, yaw: 0.2, w: 0.25, tag: '导引台', on: 'shelf' });
  floorZ(out, 'r3_carpetBrown', -3.4, 3.4, -9.2, -6.6, y, { border: 0.08, bmat: 'dz_brassDim' });
  out.push({ m: 'r2/fire_extinguisher', x: -6.2, y, z: -6.85, yaw: 0, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/fire_extinguisher', x: 6.2, y, z: -6.85, yaw: 0, h: 0.58, tag: 'K3', on: 'floor' });
  for (const sx of [-1, 1]) out.push({ m: 'r2/exit_sign', x: sx * 2.0, y: y + 9.3, z: Z1 - 0.32, yaw: Math.PI, w: 0.36, tag: 'K3', on: 'wall' });
  for (const [x, z, yaw] of [[-13.6, -6.9, Math.PI * 0.75], [13.6, -29.5, -Math.PI * 0.25], [-13.6, -29.5, Math.PI * 0.25]]) out.push({ m: 'r2/cctv_camera', x, y: y + 4.2, z, yaw, h: 0.3, tag: 'K3', on: 'wall' });
  // ⑤ 地面磨损（中轴 + 窗口前）、照明层次（服务台台面补光、等候区落地暖光、填单台）
  wear(out, -2.4, 2.4, -29.4, -9.3, y); wear(out, 7.8, 9.6, -24.0, -10.0, y);
  for (const z of [-12.4, -17.0, -21.6]) light(out, 9.4, y + 2.6, z, 0xffe0b8, 2.2, 6);
  light(out, -9.5, y + 2.4, -14.3, 0xffd09a, 2.4, 7); light(out, -5.8, y + 2.6, -25.0, 0xffe0b8, 2.0, 5);
  for (const z of [-12, -24]) for (const sx of [-1, 1]) sconce(out, sx * (X1 - 0.02), y + 3.0, z + 3, sx > 0 ? ROT.W : ROT.E);
  return { room, items: out };
}

// ================= 1F · 安检大厅 security_hall（批次25 R3 功能平面；建筑 = hero_hall 烘焙，闸机 / 扫描门 / X 光机 / LED 屏 / 通缉栏 / 违禁品柜 / 座钟 / 殷泽衣帽 均为原锚点不动） =================
// 动线（南 → 北）：尖拱门（门廊）→ 托盘台 + X 光机（两侧）→ 隔离带排队 → 8 道翼闸（z −40）→ 8 樘文本扫描门（z −43.2）→ 证件查验柜台一排（z −49.5，中轴 11 m 留空）
//   → 中轴礼仪带（罗盘地徽 / LED 大屏下）→ 两侧去西翼档案馆 / 东翼市民服务（吊牌 + 门牌）→ 北端等候区三排长椅（z −65.4 / −68 / −70.6）→ 北墙局徽主墙 + 书脊井电梯 / 中庭铁门
export function planSecurityHall(y) {
  const out = []; const X0 = -17.4, X1 = 17.4, Z0 = -76, Z1 = -30, H = 16;
  const room = { name: '1F · 安检大厅（批次25 R3）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'S', a: -5, b: 5, label: '尖拱门 ← 门廊' }, { wall: 'N', a: -2.3, b: 2.3, label: '中庭铁门 → 食堂' }, { wall: 'N', a: -7.7, b: -4.3, label: '书脊井电梯 西' }, { wall: 'N', a: 4.3, b: 7.7, label: '书脊井电梯 东' },
      { wall: 'W', a: -55.5, b: -47.5, label: '西门 → 人事档案馆' }, { wall: 'E', a: -51, b: -45, label: '东门 → 东翼连廊' }], windows: [],
    keep: [{ label: '翼闸线（锚点）', x: 0, z: -40, w: 24.4, d: 1.7 }, { label: '文本扫描门 ×8（锚点）', x: 0, z: -43.2, w: 22.6, d: 0.6 }, { label: '通缉栏（锚点）', x: 16.9, z: -64, w: 0.6, d: 8.4 }, { label: '违禁品柜（锚点）', x: -16.8, z: -62, w: 1.0, d: 4.4 }],
    rooms: [['① 入口 · 托盘台 / X 光', 0, -34.5], ['② 翼闸 + 扫描门', 0, -41.6], ['③ 证件查验', 0, -49.5], ['④ 中轴礼仪带', 0, -58], ['⑤ 等候区', 0, -68], ['⑥ 局徽主墙', 0, -74.6]],
    aisles: [{ label: '中轴（尖拱门 → 中庭铁门）', x0: -2.7, x1: 2.7, z0: -75.6, z1: -44.0 }, { label: '查验后横向动线（西门 ↔ 东门）', x0: -17.0, x1: 17.0, z0: -52.6, z1: -50.8 }, { label: '西侧廊', x0: -15.6, x1: -12.9, z0: -72.8, z1: -44.0 }] };
  const F = (lab, x, z, w, d, h = 1, col = false) => out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, h, d], tag: '原锚点', on: 'floor', ...(col ? { col: [w, h, d] } : {}) });
  for (const z of [-31.5, -42.5, -53.5, -64.5]) for (const sx of [-1, 1]) F('束柱', sx * 12, z, 1.5, 1.5, 16);
  for (const sx of [-1, 1]) F('束柱（嵌北墙）', sx * 12, -75.5, 1.5, 0.9, 16);
  F('X 光机组（西：进口机 + 1 号道西机 + 侧板，hero_hall 原位）', -15.0, -40.45, 4.4, 6.5, 1.4); F('X 光机（东）', 15, -38.4, 1.3, 2.4, 1.4); F('翼闸侧板（东）', 15, -40, 4.8, 0.4, 1.2);
  F('殷泽衣帽', 9.9, -46.8, 0.6, 0.6, 1.8); F('扫描结果屏', 9.6, -43.2, 0.7, 0.2, 1.8); F('湿滑警示牌', 3.2, -47, 0.5, 0.5, 0.7);
  for (const sx of [-1, 1]) F('等候长椅（原 street_seating）', sx * 8, -68, 4.2, 0.9, 0.8);
  F('落地座钟', -15.8, -73.8, 0.8, 0.6, 2.4); for (const [x, z] of [[-15.5, -33], [15.5, -33], [15.5, -73.5]]) F('盆栽', x, z, 0.8, 0.8, 1.8);
  for (const z of [-36, -70]) for (const sx of [-1, 1]) F('灭火器', sx * 17.0, z, 0.3, 0.3, 0.65);
  for (const sx of [-1, 1]) F('呼梯面板', sx * 3.9, -75.6, 0.4, 0.1, 1.6);
  // ① 入口：X 光机进口端托盘台（胡桃木台 + 铜包边 + 灰色周转托盘叠放）——两侧对称
  for (const sx of [-1, 1]) { const x = sx * 15, z = -35.7;
    out.push({ box: 'r3_walnutLt', x, y: y + 0.4, z, w: 1.0, h: 0.8, d: 1.4, uv: 0.5, tag: '托盘台', on: 'floor', col: [1.0, 0.8, 1.4] });
    out.push({ box: 'dz_brassDim', x, y: y + 0.815, z, w: 1.04, h: 0.03, d: 1.44, tag: '托盘台', on: 'partv' });
    for (let k = 0; k < 5; k++) out.push({ box: 'r3_steelGrey', x: x - sx * 0.12, y: y + 0.86 + k * 0.07, z: z - 0.25, w: 0.62, h: 0.06, d: 0.44, tag: '托盘台', on: 'partv' });
    out.push({ box: 'r3_steelGrey', x: x - sx * 0.12, y: y + 0.86, z: z + 0.36, w: 0.62, h: 0.06, d: 0.44, tag: '托盘台', on: 'partv' });
    out.push({ sign: '请将随身物品放入托盘', sub: '金属 · 纸质文本 · 电子设备', x, y: y + 1.0, z: z + 0.71, yaw: 0, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
    light(out, x, y + 2.6, z, 0xffe0b8, 1.6, 5); }
  // ③ 证件查验柜台一排（z −49.5；中轴 x ±5 留空）：胡桃木柜身 + 黑石台面 + 玻璃挡板 + 编号铜牌；台后高脚凳 + 台灯 / 文件盘 / 印台电话；台前一米线
  const BX = [-10.0, -6.4, 6.4, 10.0], BZ = -49.5;
  for (const [i, x] of BX.entries()) {
    out.push({ fixed: true, m: '固定:查验柜台（台面 1.09 m）', x, y, z: BZ, yaw: 0, size: [2.0, 1.09, 0.8], col: [2.0, 1.09, 0.8], tag: '证件查验', on: 'floor' });
    // 批次30：柜身 / 立梃 / 铜踢脚 / 黑石台面 / 玻璃挡板 / 递件槽 方块 → Blender 精建 sec_counter_6080（tools/blender/hall_props.py：胡桃木框芯板 + 黑石台面 + 铜包边 + 铜立柱玻璃挡板 + 编号牌框）
    out.push({ m: 'r2/sec_counter_6080', x, y, z: BZ, yaw: 0, w: 2.012, tag: '证件查验', on: 'partv' });
    out.push({ sign: `证件查验　${i + 1}`, sub: '请出示临时或正式证件', x, y: y + 0.85, z: BZ + 0.385, yaw: 0, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
    out.push({ m: 'r2/bar_chair_round_01', x, y, z: BZ - 0.85, yaw: ROT.S, h: 0.78, tag: '证件查验', on: 'floor' });
    out.push({ m: 'r2/bankers_lamp', x: x - 0.7, y: y + 1.09, z: BZ - 0.2, yaw: ROT.S, h: 0.4, tag: '证件查验', on: 'desk' });
    out.push({ m: i % 2 ? 'r2/wooden_flat_filing_tray' : 'r2/document_letter_tray_documents_organizer', x: x + 0.55, y: y + 1.09, z: BZ - 0.15, yaw: 0, w: 0.32, tag: '证件查验', on: 'desk' });
    out.push({ m: ['r2/rotary_telephone', 'r2/phone_vef_ta_68'][i % 2], x: x + 0.05, y: y + 1.09, z: BZ - 0.25, yaw: 0.25, w: 0.22, tag: '证件查验', on: 'desk' });
    out.push({ box: 'brass', x, y: y + 0.006, z: BZ + 1.25, w: 1.6, h: 0.012, d: 0.04, tag: '一米线', on: 'partv' });
    light(out, x, y + 2.4, BZ + 0.2, 0xffe0b8, 3.2, 6); light(out, x, y + 1.6, BZ + 1.6, 0xffe6c8, 1.4, 3.5); // 批次29：柜身南面（玩家正对面）补一盏低位光，防发黑
  }
  // ⑤ 等候区：原 street_seating 两张（z −68）前后各加一排胡桃木长椅，每排每侧两张，面向南（LED 大屏）
  for (const z of [-65.4, -70.6]) for (const sx of [-1, 1]) for (const x of [6.9, 9.1]) out.push({ m: 'r2/18th_century_bench_from_hungarian_opera', x: sx * x, y, z, yaw: ROT.S, w: 1.9, tag: '等候区', on: 'floor' });
  for (const sx of [-1, 1]) led(out, '查 验 叫 号', [['请到', '3 号台'], ['等候', '12 人']], sx * 11.0, y + 2.1, -67.0, sx > 0 ? ROT.W : ROT.E, 1.2, 0.6, { stand: true, fy: y, size: [0.5, 2.5, 0.5], on: 'floor' });
  // ④ 通缉栏：前方铜立柱隔离 + 栏顶铜字 + 画框灯
  stanchions(out, [[15.7, -61.0], [15.7, -67.0]], y, '通缉栏');
  out.push({ wtext: '通 缉 公 告', x: X1 - 0.6, y: y + 4.15, z: -64, // 批次29 看图修：hall_wanted 里铜字牌左半「通缉」被墙柱细柱挡住 → 前移到柱前 0.6 m、抬高 0.25 m 让开栏顶
    yaw: ROT.W, w: 2.4, h: 0.42, size: [0.1, 0.6, 2.6], tag: '通缉栏', on: 'pic' });
  light(out, 15.6, y + 3.4, -64, 0xffe6c8, 2.6, 6);
  // ⑥ 局徽主墙（北墙中庭门上方）：大局徽 + 铜字
  // 批次29 看图修：hero_hall 北墙上部本有 9×4.2 m 黑石局徽面板（hall.py end_wall，中心离地 12.0，面板前脸 z≈−75.15），
  // 原局徽（y+11, z Z0+0.7=−75.3）整个埋在面板后 → hall_r3 只见一块空黑板。局徽移到面板正中、贴面板前脸，铜字放面板下金线下方。
  pic(out, 'textures/emblems/N01.jpg', 0, y + 12.0, Z0 + 0.92, 0, 3.4, 3.4, 'gold', { tag: '局徽主墙' });
  out.push({ wtext: '叙 事 管 理 局', x: 0, y: y + 9.1, z: Z0 + 0.92, yaw: 0, w: 5.0, h: 0.7, size: [5.4, 0.9, 0.1], tag: '局徽主墙', on: 'pic' });
  light(out, 0, y + 7.2, Z0 + 5.0, 0xffe0b0, 4.5, 12);
  // 导向：吊牌（查验后横向动线上方）+ 两侧门牌
  hang(out, '← 西翼　人事档案馆', -7.0, y + 4.6, -52.6, 0, 3.2, 0.5, y + 9.0);
  hang(out, '东翼　市民服务 · 高考 · 指挥 →', 7.0, y + 4.6, -52.6, 0, 3.2, 0.5, y + 9.0);
  hang(out, '书脊井电梯　·　中庭食堂　↑', 0, y + 4.6, -71.8, 0, 3.4, 0.5, y + 9.0);
  out.push({ sign: '人事档案馆', sub: '西翼 · 由此进入', x: X0 + 0.3, y: y + 1.6, z: -46.9, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  out.push({ sign: '东翼连廊', sub: '市民服务大厅 · 叙事高考', x: X1 - 0.3, y: y + 1.6, z: -44.4, yaw: ROT.W, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  // 地面磨损：入口 → 各车道、查验后中轴与横向动线
  wear(out, -2.4, 2.4, -75.0, -44.2, y); wear(out, -16.6, 16.6, -53.6, -51.4, y); wear(out, -11.0, 11.0, -38.0, -31.0, y);
  return { room, items: out };
}

// ================= 主楼前广场 plaza（批次25 R3 功能平面；铺装 / 喷泉 / 罗盘地徽 / 路灯 / 旗杆 / 长椅 / 写生老人 / LED 屏 / 系船柱 = hero_plaza 与 exterior.js 原锚点不动） =================
// 动线（南 → 北）：南端大台阶 → 系船柱口（|x|<9）→ 两侧岗亭 → 中轴步道 x ±8 → 罗盘地徽（z 64）→ 规则之泉（z 30，绕泉环行）→ 主楼正门台阶（z 0.6）
// 两侧带（|x| 10…21）由内到外：路灯列 x ±10 → 旗杆列 x ±14.5 → 行道树列 x ±17（树池铁箅）→ 长椅列 x ±19.6；南缘绿篱铁栏、西南自行车棚、东南告示牌
export function planPlaza(y) {
  const out = []; const X0 = -21, X1 = 21, Z0 = 1.0, Z1 = 80.4, H = 14;
  const room = { name: '主楼前广场（批次25 R3）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'N', a: -17, b: 17, label: '主楼正门台阶' }, { wall: 'S', a: -9, b: 9, label: '南端大台阶（系船柱口）' }], windows: [],
    keep: [{ label: '规则之泉（锚点）', x: 0, z: 30, w: 29.2, d: 29.2 }, { label: '罗盘地徽（地面，锚点）', x: 0, z: 64, w: 18, d: 18 }],
    rooms: [['① 正门台阶前', 0, 6], ['② 规则之泉', 0, 30], ['③ 罗盘地徽', 0, 64], ['④ 岗亭', 0, 75.5], ['⑤ 自行车棚', -18.2, 75], ['⑥ 告示牌', 17.2, 71.5]],
    aisles: [{ label: '中轴步道（北段）', x0: -8, x1: 8, z0: 1.2, z1: 15.2 }, { label: '中轴步道（南段 · 罗盘地徽）', x0: -8, x1: 8, z0: 44.8, z1: 80.2 }, { label: '东侧步行带（路灯列 ↔ 旗杆列）', x0: 10.4, x1: 12.9, z0: 1.2, z1: 72.4 }, { label: '西侧步行带（路灯列 ↔ 旗杆列）', x0: -12.9, x1: -10.4, z0: 1.2, z1: 72.4 }] };
  const F = (lab, x, z, w, d, h = 1) => out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, h, d], tag: '原锚点', on: 'floor' });
  F('规则之泉（泉池芯）', 0, 30, 19, 19, 2);
  for (const sx of [-1, 1]) { for (let z = 6; z <= 76; z += 14) F('路灯', sx * 10, z, 0.5, 0.5, 5.4); for (let k = 0; k < 6; k++) F('旗杆基座', sx * 14.5, 8 + k * 12, 1.3, 1.3, 12); for (const z of [10, 24, 44, 52, 68]) F('长椅', sx * 19.6, z, 0.8, 2.2, 0.9); F('系船柱列', sx * 15.6, 78.5, 9.2, 0.3, 0.95); }
  F('写生画架 + 空凳（批次25 去人）', -13.5, 15.5, 1.0, 1.0, 1.6); F('LED 倒计时屏立柱', 17, 76, 0.5, 0.5, 7);
  // 行道树（x ±17，与旗杆列错开半跨：z 14 / 38 / 50 / 62）+ 树池铁箅 + 树池石沿
  for (const sx of [-1, 1]) for (const z of [14, 38, 50, 62]) {
    out.push({ m: 'r2/jacaranda_tree', x: sx * 17, y, z, yaw: (z % 7) * 0.9, h: 7.5, size: [0.9, 7.5, 0.9], col: [0.6, 3, 0.6], tag: '行道树', on: 'floor' });
    out.push({ box: 'stoneDark', x: sx * 17, y: y + 0.06, z, w: 1.8, h: 0.12, d: 1.8, tag: '树池', on: 'partv' });
    out.push({ box: 'iron', x: sx * 17, y: y + 0.125, z, w: 1.5, h: 0.02, d: 1.5, tag: '树池', on: 'partv' });
  }
  // 南缘绿篱铁栏（系船柱外侧，台阶上沿内）
  for (const sx of [-1, 1]) out.push({ m: 'r2/hedge_green_fence', x: sx * 17.8, y, z: 79.7, yaw: Math.PI / 2, d: 6.0, size: [0.7, 1.6, 6.0], tag: '绿篱铁栏', on: 'floor' }); // 批次25 plaza_top 看图修：模型长轴是 z，原 w:6 按 x 缩放 → 竖成 8 m 长墙
  // 岗亭（南口两侧对称，面向中轴）+ 岗亭前黄线 + 门牌
  for (const sx of [-1, 1]) {
    out.push({ m: 'r2/guard_booth_6080', x: sx * 13.0, y, z: 74.6, yaw: sx > 0 ? ROT.W : ROT.E, h: 3.3, size: [3.3, 3.3, 3.5], col: [3.3, 3.3, 3.5], tag: '岗亭', on: 'floor' }); // 批次27 E5：报刊亭 → Blender 精建 60–80 年代门卫岗亭（tools/blender/guard_booth.py）
    out.push({ box: 'r3_paintYellow', x: sx * 10.7, y: y + 0.11, z: 74.6, w: 0.1, h: 0.01, d: 3.6, tag: '岗亭', on: 'partv' });
    out.push({ sign: sx > 0 ? '东岗亭' : '西岗亭', sub: '来访人员请出示证件', x: sx * 11.2, y: y + 0.9, z: 74.6, yaw: sx > 0 ? ROT.W : ROT.E, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
    light(out, sx * 10.9, y + 2.9, 74.6, 0xffd8a8, 1.6, 6);
  }
  // 自行车棚（西南，x −20.5…−15.9）：钢柱 ×4 + 单坡顶 + 车架；5 辆旧自行车成排，车头朝西
  { const cx = -18.2, z0 = 72.6, z1 = 77.6, cz = (z0 + z1) / 2;
    for (const [x, z] of [[-20.3, z0 + 0.1], [-20.3, z1 - 0.1], [-16.1, z0 + 0.1], [-16.1, z1 - 0.1]]) out.push({ box: 'r3_steelGrey', x, y: y + 1.2, z, w: 0.1, h: 2.4, d: 0.1, tag: '车棚', on: 'partv' });
    out.push({ box: 'r3_consoleSteel', x: cx, y: y + 2.42, z: cz, w: 4.8, h: 0.06, d: 5.4, tag: '车棚', on: 'partv' });
    out.push({ box: 'r3_steelGrey', x: cx, y: y + 0.35, z: cz, w: 0.06, h: 0.06, d: 4.8, tag: '车棚', on: 'partv' });
    out.push({ fixed: true, m: '固定:车棚柱网', x: cx, y, z: cz, yaw: 0, size: [4.4, 2.4, 5.0], tag: '车棚', on: 'partv' });
    for (let k = 0; k < 5; k++) out.push({ m: 'r2/old_bicycle', x: cx, y, z: z0 + 0.7 + k * 0.9, yaw: ROT.W, h: 1.0, tag: '车棚', on: 'partv' });
    out.push({ sign: '自行车棚', sub: '职工车辆 · 请锁好', x: -15.95, y: y + 2.1, z: z0 + 0.12, yaw: ROT.S, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  }
  // 告示牌（东南，面向西 / 进门人流）
  { const x = 17.4, z = 71.6; // 双柱木框告示栏 + 小披檐 + 两张告示（面向西）
    out.push({ fixed: true, m: '固定:告示栏', x, y, z, yaw: 0, size: [0.4, 2.4, 2.0], col: [0.3, 2.4, 2.0], tag: '告示牌', on: 'floor' });
    for (const dz of [-0.95, 0.95]) out.push({ box: 'r3_walnutLt', x, y: y + 1.15, z: z + dz, w: 0.12, h: 2.3, d: 0.12, tag: '告示牌', on: 'partv' });
    out.push({ box: 'r3_walnutLt', x, y: y + 1.55, z, w: 0.08, h: 1.2, d: 1.8, tag: '告示牌', on: 'partv' });
    out.push({ box: 'stoneDark', x, y: y + 2.36, z, w: 0.5, h: 0.06, d: 2.1, tag: '告示牌', on: 'partv' });
    out.push({ notice: '叙事管理局通告', lines: ['本局广场 06:00–22:00 开放', '入局人员须经安检大厅检查', '请勿在泉池旁朗读来历不明的文本'], x: x - 0.05, y: y + 1.6, z: z - 0.42, yaw: ROT.W, w: 0.6, h: 0.85, red: true, size: [0.01, 0.85, 0.6], tag: '告示牌', on: 'pic' });
    out.push({ notice: '2027 叙事高考报名', lines: ['报名地点：东翼市民服务大厅', '截止：十一月三十日'], x: x - 0.05, y: y + 1.6, z: z + 0.45, yaw: ROT.W, w: 0.6, h: 0.85, size: [0.01, 0.85, 0.6], tag: '告示牌', on: 'pic' }); }
  return { room, items: out };
}

// ================= 1F 西翼 · 人事档案馆（批次3 新做；柜台、叶寻、登记簿、阅览长桌、抽屉柜墙、回廊、楼梯、B1 洞口均为原锚点） =================
export function planArchive(y) {
  const out = []; const X0 = -56, X1 = -20, Z0 = -70, Z1 = -32, H = 13, TOP = y + 11.4; // TOP：铁桁架下沿（吊灯挂点）
  const room = { name: '1F 西翼 · 人事档案馆（批次3）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'E', a: -55, b: -48, label: '东门（连廊 → 安检大厅）' }], windows: [-64, -55.4, -46.8, -38.2].map((z) => ({ wall: 'W', a: z - 1, b: z + 1 })),
    keep: [{ label: '南墙抽屉柜墙（锚点）', x: -38, z: -32.7, w: 35, d: 0.95 }, { label: '北墙抽屉柜墙（锚点）', x: -45.05, z: -69.3, w: 20.9, d: 0.95 }],
    rooms: [['借阅柜台', -50.0, -51.5], ['阅览区', -38.0, -51.5], ['开架区 A', -24.0, -42.6], ['开架区 B', -24.0, -60.6], ['陈列 · 卡片目录（西南）', -52.0, -40.5], ['缩微阅读（西北）', -53.8, -60.0], ['东门入口', -23.8, -51.5]],
    aisles: [{ label: '中轴红毯（南北）', x0: -39.7, x1: -36.3, z0: -67.0, z1: -36.0 }, { label: '东西红毯', x0: -48.6, x1: -23.0, z0: -53.0, z1: -50.1 }, { label: '开架区西侧通道', x0: -28.6, x1: -27.4, z0: -66.5, z1: -38.0 }] };
  const F = (lab, x, z, w, d, h = 1) => out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, h, d], tag: '原锚点', on: 'floor' });
  F('抽屉柜墙', -38, -32.75, 35, 0.95); F('抽屉柜墙', -45.05, -69.25, 20.9, 0.95); F('楼梯', -28.5, -68.7, 10.2, 2.4); F('B1 洞口', -29.45, -36.4, 10.3, 2.2);
  F('借阅柜台', -50.0, -51.5, 1.4, 7.2); F('叶寻', -51.1, -51.5, 0.6, 0.6); F('档案推车', -48.1, -56.1, 1.2, 0.6); F('大档案柜组', -51.4, -63.5, 6.6, 0.9);
  for (let k = 0; k < 4; k++) F('柜台后档案柜', -55.0, -54.5 + k * 2, 0.7, 0.6);
  for (const tz of [-41.5, -48.5, -55.5, -62.5]) for (const tx of [-44.5, -31.5]) F('阅览长桌', tx, tz, 5.6, 3.0);
  for (const [x, z] of [[-32.0, -45.0], [-44.5, -59.0]]) F('书车', x, z, 1.25, 0.7);
  for (let x = -53.4; x <= -23; x += 5.4) for (const z of [-34.6, -67.4]) { if (z === -67.4 && x > -34) continue; F('回廊铸铁柱', x, z, 0.3, 0.3); }
  for (const [x, z] of [[-21.2, -33.5], [-21.2, -68.6], [-54.8, -33.5]]) F('盆栽', x, z, 0.4, 0.4);
  // ① 开架区 A / B（东侧）：古董书柜背靠背成排（每排 3 柜 6.1 m），通道 1.2 m，排端铜牌
  const shelfRows = (zs, tag, letter) => zs.forEach((zc, i) => {
    for (const face of [-1, 1]) for (let k = 0; k < 3; k++) out.push({ m: 'r2/antique_wooden_bookcase_game_model', x: -24.05 + (k - 1) * 2.05, y, z: zc + face * 0.19, yaw: face > 0 ? 0 : Math.PI, h: 2.4, tag, on: 'floor', col: [2.04, 2.4, 0.36] });
    out.push({ sign: `开架 ${letter}-${i + 1}`, sub: ['人事 · 1950–1979', '人事 · 1980–1999', '人事 · 2000–2019', '人事 · 2020–', '调阅登记后取档'][i] ?? '', x: -27.17, y: y + 1.55, z: zc, yaw: ROT.W, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  });
  shelfRows([-39.6, -41.7, -43.8, -45.9], '开架区 A', 'A'); shelfRows([-57.4, -59.5, -61.6, -63.7], '开架区 B', 'B');
  out.push({ m: 'r2/wooden_ladder', x: -22.4, y, z: -42.75, yaw: 0, h: 2.0, tag: '开架区 A', on: 'floor' });
  out.push({ m: 'r2/wooden_stool_01', x: -25.6, y, z: -60.55, yaw: 0.4, h: 0.5, tag: '开架区 B', on: 'floor' });
  for (const [x, z] of [[-21.3, -44.6], [-26.6, -62.4]]) out.push({ m: 'r2/mousetrap', x, y, z, yaw: 0.7, w: 0.16, tag: '开架区', on: 'floor' });
  for (const z of [-40.65, -42.75, -44.85, -58.45, -60.55, -62.65]) globe(out, -24.05, z, y, TOP - y, 3.1, { r: 0.18 });
  // ② 东门入口：石材门厅 + 还档分拣台 + 灭火器（档案馆禁水，不设消火栓）
  floorZ(out, 'r3_terrDeep', -27.4, -20.15, -56.4, -46.6, y, { uv: 1.5, border: 0.14, bmat: 'r3_stoneBorder' }); // 批次33：浅灰暖水磨石（红地毯两侧大片发白）→ 深色水磨石 + 黑石收边
  out.push({ m: 'r2/woodentable_01', x: -23.2, y, z: -47.6, yaw: Math.PI, fit: [2.2, 0.82, 0.8], tag: '还档分拣台', on: 'floor', col: [2.2, 0.82, 0.8] });
  for (const [dx, m, sz] of [[-0.7, 'r2/wooden_flat_filing_tray', { w: 0.34 }], [0.0, 'r2/several_folders', { h: 0.3 }], [0.7, 'r2/desk_bell', { w: 0.1 }]]) out.push({ m, x: -23.2 + dx, y: y + 0.82, z: -47.65, yaw: Math.PI, ...sz, tag: '还档分拣台', on: 'desk' });
  out.push({ sign: '还档处', sub: '请勿直接放回架上', x: -23.2, y: y + 1.25, z: -47.2 - 0.01, yaw: 0, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  out.push({ m: 'r2/fire_extinguisher', x: -20.45, y, z: -46.9, yaw: ROT.W, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/fire_extinguisher', x: -20.45, y, z: -56.1, yaw: ROT.W, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/exit_sign', x: -20.1, y: y + 5.5, z: -51.5, yaw: ROT.W, w: 0.36, tag: 'K3', on: 'wall' });
  globe(out, -23.8, -51.5, y, TOP - y, 3.4, { r: 0.22 });
  // ③ 西南（近南墙）：历届叙事事件陈列柜 ×2 + 卡片目录柜（西墙一排）+ 地球仪
  vitrine(out, -51.4, -38.2, y, 4.0, 0, '叙事事件陈列', { model: true }); vitrine(out, -51.4, -42.2, y, 4.0, 0, '叙事事件陈列', { model: true });
  for (let k = 0; k < 8; k++) out.push({ m: 'drawer_cabinet', x: -55.45, y, z: -36.2 - k * 0.9, yaw: ROT.E, h: 1.4, tag: '卡片目录', on: 'floor', col: [0.85, 1.4, 0.36] });
  out.push({ sign: '卡片目录', sub: '按姓氏笔画 · 按入局年份', x: -55.24, y: y + 1.7, z: -39.3, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  out.push({ m: 'r2/antique_globe', x: -48.4, y, z: -45.2, yaw: 0.6, h: 1.0, tag: '陈列', on: 'floor' });
  globe(out, -51.4, -40.2, y, TOP - y, 3.4, { r: 0.2 });
  // 批次32（archive_west 看图：西墙 1.4 m 以上整片纯墨绿）→ 胡桃木壁柱 4 根（3.5 m 一间）+ 护墙顶线（y+1.55）+ 檐下冠线（y+6.0）+ 每间一幅金框证物照（IMAGE-PLAN 未用 N13 涂黑机密文件 / N11 回响座钟 / N12 相框里的手）+ 画下铜壁灯
  for (const z of [-35.0, -38.5, -42.0, -45.5]) { out.push({ box: 'wood', x: -55.92, y: y + 3.775, z, w: 0.12, h: 4.45, d: 0.32, tag: '壁柱', on: 'partv' }); out.push({ box: 'brass', x: -55.85, y: y + 5.85, z, w: 0.04, h: 0.08, d: 0.36, tag: '壁柱', on: 'partv' }); out.push({ box: 'wood', x: -55.9, y: y + 1.7, z, w: 0.16, h: 0.3, d: 0.4, tag: '壁柱', on: 'partv' }); }
  out.push({ box: 'wood', x: -55.93, y: y + 1.55, z: -40.25, w: 0.1, h: 0.1, d: 11.0, tag: '护墙顶线', on: 'partv' });
  out.push({ box: 'wood', x: -55.9, y: y + 6.05, z: -40.25, w: 0.16, h: 0.28, d: 11.0, tag: '冠线', on: 'partv' }); out.push({ box: 'brass', x: -55.81, y: y + 5.93, z: -40.25, w: 0.02, h: 0.03, d: 11.0, tag: '冠线', on: 'partv' });
  for (const [z, n] of [[-36.75, 'N13'], [-40.25, 'N11'], [-43.75, 'N12']]) { pic(out, `textures/emblems/${n}.jpg`, -55.9, y + 3.6, z, ROT.E, 1.5, 1.5, 'gold', { tag: '证物照' }); sconce(out, -55.85, y + 4.75, z, ROT.E); }
  // ④ 西北：缩微胶片阅读位（靠西墙 3 席，人面朝墙）
  for (const [i, z] of [-58.0, -59.7, -61.4].entries()) {
    out.push({ m: 'r2/woodentable_01', x: -55.25, y, z, yaw: ROT.E, fit: [1.4, 0.76, 0.7], tag: '缩微阅读', on: 'floor', col: [1.4, 0.76, 0.7] });
    out.push({ m: 'r2/microfiche_reader', x: -55.35, y: y + 0.76, z, yaw: ROT.E, h: 0.5, tag: '缩微阅读', on: 'desk' });
    out.push({ m: 'r2/gallinera_chair', x: -54.35, y, z: z + (i - 1) * 0.06, yaw: ROT.W + (i === 1 ? 0.35 : 0), h: 0.9, tag: '缩微阅读', on: 'floor' });
  }
  globe(out, -54.6, -59.7, y, TOP - y, 3.1, { r: 0.17 });
  // ⑤ 柜台后员工区地胶 + K3（监控、温湿度）
  floorZ(out, 'r3_lino', -55.95, -50.7, -55.9, -47.1, y, {});
  for (const [x, z, yaw] of [[-55.6, -32.6, Math.PI * 0.75], [-20.4, -69.4, -Math.PI * 0.25]]) out.push({ m: 'r2/cctv_camera', x, y: y + 5.4, z, yaw, h: 0.3, tag: 'K3', on: 'wall' });
  for (const z of [-46.8, -55.4]) winShaft(out, X0 + 0.2, y + 8.6, z, 1, 0, { i: 1.2, len: 12, spot: true });
  light(out, -24.0, y + 2.6, -42.7, 0xffdcb0, 3.2, 8); light(out, -24.0, y + 2.6, -60.6, 0xffdcb0, 3.2, 8); light(out, -51.5, y + 2.6, -40.2, 0xffe2c0, 2.6, 7); light(out, -54.4, y + 2.4, -59.7, 0xffe2c0, 2.2, 6); light(out, -23.8, y + 2.8, -51.5, 0xffe6c8, 2.6, 7);
  // 批次4：档案馆偏暗 → 阅览区/书架通道上方 6 盏暖色补光（模拟大吊灯与台灯群的整体照度）
  for (const [x, z] of [[-46, -45], [-38, -45], [-30, -45], [-46, -58], [-38, -58], [-30, -58]]) light(out, x, y + 4.6, z, 0xffdcb0, 3.0, 13);
  return { room, items: out };
}

// ================= 东翼 2F · 全国现实稳定度监测指挥中心（批次3；阶梯席位/弧形主屏/文字地球/值班长台/世界钟/周文均为原锚点） =================
export function planCommand(y) {
  const out = []; const X0 = 20, X1 = 50, Z0 = -61, Z1 = -32, H = 6.7, PH2 = 1.8;
  const ROWZ = [0, 1, 2, 3].map((r) => -41 - r * 3.6), XS = [0, 1, 2, 3, 4, 5].map((k) => 23 + k * 4.6);
  const room = { name: '东翼 2F · 监测指挥中心（批次3）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'E', a: -47.5, b: -44, label: '楼梯井门' }, { wall: 'N', a: 40, b: 43, label: '北门 → 阅卷中心（值班平台上）' }], windows: [],
    keep: [{ label: '弧形主屏（锚点）', x: 35, z: -32.6, w: 25.6, d: 0.5 }, { label: '世界钟 ×4（锚点）', x: 20.2, z: -41.6, w: 0.1, d: 8.4 }],
    rooms: [['阶梯席位 4×6', 35, -46.5], ['态势研判', 23.0, -36.5], ['证据摄录', 47.0, -36.5], ['值班平台', 35, -58.6], ['通讯室', 46.8, -58.8], ['电传 · 资料', 25.5, -58.8], ['平台前通道', 35, -55.0]],
    aisles: [{ label: '主屏前通道西', x0: 26.5, x1: 33.4, z0: -39.8, z1: -35.4 }, { label: '主屏前通道东', x0: 36.6, x1: 43.5, z0: -39.8, z1: -35.4 }, { label: '平台前通道（地面）', x0: 21, x1: 49, z0: -56.2, z1: -53.8 }] };
  const F = (lab, x, z, w, d, yy = y, col) => out.push({ fixed: true, m: '固定:' + lab, x, y: yy, z, yaw: 0, size: [w, col ? col[1] : 1, d], ...(col ? { col } : {}), tag: '原锚点', on: 'floor' });
  ROWZ.forEach((z, r) => XS.forEach((x) => { F('控制台', x, z + 0.6, 3.6, 1.0, y + r * 0.45, [3.6, 0.79, 1.0]); F('操作员椅', x, z - 0.25, 0.6, 0.6, y + r * 0.45); }));
  F('文字地球基座', 35, -38, 2.8, 2.8); F('值班长台', 35, -58.6, 6.2, 1.4, y + PH2, [6.2, 1.06, 1.4]); F('周文', 35, -59.6, 0.6, 0.6, y + PH2);
  // ① 席位桌面（每席：电话 / 便签本 / 文件夹，半数有杯、每 4 席 1 只满溢烟灰缸、隔席 1 盏台灯）
  let k = 0; ROWZ.forEach((z, r) => XS.forEach((x) => { const t = y + r * 0.45 + 0.79, f = z + 0.6;
    out.push({ m: ['r2/rotary_telephone', 'r2/office_phone', 'r2/phone_vef_ta_68'][k % 3], x: x - 1.45, y: t, z: f - 0.22, yaw: 0.25, w: 0.22, tag: '席位', on: 'desk' });
    out.push({ m: 'notepads', x: x - 0.55, y: t, z: f - 0.25, yaw: (k % 5) * 0.1, w: 0.22, tag: '席位', on: 'desk' });
    if (k % 2 === 0) out.push({ m: 'r2/coffee_mug', x: x + 0.65, y: t, z: f - 0.28, yaw: k, h: 0.095, tag: '席位', on: 'desk' });
    if (k % 4 === 1) out.push({ m: 'r2/ptish_exceptionally_full_ashtray', x: x + 1.3, y: t, z: f - 0.3, yaw: 0, w: 0.15, tag: '席位', on: 'desk' });
    if (k % 2 === 1) out.push({ m: 'r2/bankers_lamp', x: x + 1.55, y: t, z: f + 0.2, yaw: Math.PI, h: 0.38, tag: '席位', on: 'desk' });
    if (k % 3 === 2) out.push({ m: 'r2/several_folders', x: x + 0.1, y: t, z: f - 0.3, yaw: 0.2, h: 0.28, tag: '席位', on: 'desk' });
    troffer(out, x, z + 0.2, y, H - 0.2, 0, 1.6, { cold: true }); k++; }));
  // ② 态势研判（西南，主屏左端前）：两块立式态势板（S 级预警演示 / 高级禁区卡片照）+ 圆桌研判
  pic(out, 'textures/emblems/N15.jpg', 22.4, y + 1.55, -34.6, Math.PI - 0.5, 1.2, 0.8, 'black', { stand: true, fy: y });
  pic(out, 'textures/emblems/N17.jpg', 24.6, y + 1.55, -33.6, Math.PI - 0.25, 1.2, 0.8, 'black', { stand: true, fy: y });
  for (const [x, z] of [[22.4, -34.6], [24.6, -33.6]]) F('态势板支架', x, z, 1.3, 0.45);
  out.push({ m: 'r2/round_wooden_table_02', x: 23.4, y, z: -37.6, yaw: 0, h: 0.76, tag: '态势研判', on: 'floor', col: [1.0, 0.76, 1.0] });
  for (const [dx, dz, yaw] of [[-0.85, 0.1, ROT.E], [0.85, 0.15, ROT.W], [0, 0.9, Math.PI]]) out.push({ m: 'r2/gallinera_chair', x: 23.4 + dx, y, z: -37.6 + dz, yaw, h: 0.9, tag: '态势研判', on: 'floor' });
  for (const [dx, m, sz] of [[-0.2, 'r2/several_folders', { h: 0.28 }], [0.25, 'r2/coffee_mug', { h: 0.095 }]]) out.push({ m, x: 23.4 + dx, y: y + 0.76, z: -37.7, yaw: 0.4, ...sz, tag: '态势研判', on: 'desk' });
  // ③ 证据摄录（东南）：摄录台 + 老摄像机 + 回放电视
  out.push({ m: 'r2/woodentable_01', x: 47.2, y, z: -35.6, yaw: 0, fit: [2.0, 0.76, 0.8], tag: '证据摄录', on: 'floor', col: [2.0, 0.76, 0.8] });
  for (const [dx, m, sz, yaw] of [[-0.6, 'r2/vintage_video_camera', { h: 0.3 }, Math.PI], [0.35, 'r2/television_01', { h: 0.4 }, Math.PI], [-0.05, 'r2/cassette_player' , { w: 0.25 }, Math.PI]]) out.push({ m: m === 'r2/cassette_player' ? 'r2/portable_cassette_player' : m, x: 47.2 + dx, y: y + 0.76, z: -35.75, yaw, ...sz, tag: '证据摄录', on: 'desk' });
  for (const dx of [-0.5, 0.5]) out.push({ m: 'r2/old_computer_chair', x: 47.2 + dx, y, z: -36.6, yaw: Math.PI + dx * 0.3, h: 0.92, tag: '证据摄录', on: 'floor' });
  // ④ 值班平台东：通讯室（玻璃隔断，平台高 1.8 m）
  const yp = y + PH2;
  partition(out, 'z', 43.6, -56.5, Z0, yp, { glass: true }); partition(out, 'x', -56.5, 43.6, X1, yp, { glass: true, doors: [{ at: 45.0, s: -1, sign: '通讯室', sub: '内线 · 电报 · 无线电' }] });
  out.push({ m: 'r2/woodentable_01', x: 47.2, y: yp, z: -60.3, yaw: 0, fit: [2.6, 0.76, 0.8], tag: '通讯室', on: 'floor', col: [2.6, 0.76, 0.8] });
  for (const [dx, m, sz] of [[-0.85, 'r2/ww2_german_field_telephone_equipment', { w: 0.6 }], [0.1, 'r2/vintage_radio_transceiver', { w: 0.6 }], [0.95, 'r2/vintage_radio_model_95t5', { h: 0.3 }]]) out.push({ m, x: 47.2 + dx, y: yp + 0.76, z: -60.35, yaw: 0, ...sz, tag: '通讯室', on: 'desk' });
  for (const dx of [-0.7, 0.6]) out.push({ m: 'r2/old_computer_chair', x: 47.2 + dx, y: yp, z: -59.4, yaw: Math.PI + dx * 0.2, h: 0.92, tag: '通讯室', on: 'floor' });
  cabRow(out, 49.6, -57.4, yp, 3, ROT.W, '通讯室', 0.52, false); for (const it of out.slice(-3)) { it.x = 49.42; it.z = -57.3 - it.i * 0.52; }
  floorZ(out, 'r3_lino', 43.6, X1, Z0, -56.5, yp, {});
  // ⑤ 值班平台西：电传 · 资料（北墙文件柜 + 两台电传打字位）+ 咖啡角
  cabRow(out, 26.0, Z0 + 0.4, yp, 9, 0, '资料柜');
  for (const [i, x] of [26.4, 28.6].entries()) workstation(out, x, -58.2, yp, Math.PI, 70 + i, { typewriter: true, tag: '电传' });
  out.push({ m: 'r2/coffeecart_01', x: 21.6, y: yp, z: -60.3, yaw: 0, w: 1.3, tag: '咖啡角', on: 'floor', col: [1.3, 1.0, 0.7] });
  out.push({ m: 'r2/plastic_thermos', x: 22.6, y: yp, z: -59.2, yaw: 0, h: 0.32, tag: '咖啡角', on: 'floor' });
  out.push({ m: 'r2/hallway_bench', x: 21.0, y: yp, z: -57.9, yaw: ROT.E, h: 0.5, tag: '咖啡角', on: 'floor' });
  // ⑥ 地面通道 → 平台：两段踏步（6 级 × 0.3 m）
  stair(out, 30.0, -53.85, -56.4, y, yp, 1.4); stair(out, 41.5, -53.85, -56.4, y, yp, 1.4);
  for (const x of [30.0, 41.5]) for (const s2 of [-1, 1]) out.push({ box: 'brass', x: x + s2 * 0.72, y: y + PH2 / 2 + 0.55, z: -55.1, w: 0.04, h: 0.04, d: 2.9, yaw: 0, tag: '扶手', on: 'partv' });
  // ⑦ 地面分区（技术区深蓝地毯：前区 / 各级台阶面 / 平台）+ 吊扇 + K3
  floorZ(out, 'r3_carpet', X0, X1, -42.8, Z1, y, {});
  for (let r = 1; r < 4; r++) floorZ(out, 'r3_carpet', X0, X1, -42.8 - r * 3.6, -42.8 - (r - 1) * 3.6, y, { lift: r * 0.45 });
  floorZ(out, 'r3_carpet', X0, 43.6, Z0, -56.4, y, { lift: PH2 });
  floorZ(out, 'r3_lino', X0, X1, -56.4, -53.6, y, {});
  wear(out, 27.5, 42.5, -39.6, -35.4, y);
  for (const x of [28, 42]) out.push({ m: 'r2/ceiling_fan', x, y: y + H - 0.55, z: -36.5, yaw: 0, w: 1.3, tag: '吊扇', on: 'ceil' });
  for (const [x, z] of [[20.5, -32.5], [49.6, -32.5], [49.6, -55.2]]) out.push({ m: 'r2/cctv_camera', x, y: y + 4.6, z, yaw: x < 30 ? Math.PI * 0.75 : -Math.PI * 0.75, h: 0.3, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/fire_extinguisher', x: 49.6, y, z: -43.4, yaw: ROT.W, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/fire_extinguisher', x: 42.9, y: yp, z: -60.6, yaw: 0, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/exit_sign', x: 49.85, y: y + 3.4, z: -45.75, yaw: ROT.W, w: 0.36, tag: 'K3', on: 'wall' });
  smoke(out, y, H, [[26, -36], [44, -36], [26, -46], [44, -46], [26, -54.8], [44, -54.8], [35, -59]]);
  // ⑧ 批次35 按功能补空：值班平台北墙（值班长台背后）三联挂图 + 两盏铜壁灯（暖色点缀，自发光无实时光源）——IMAGE-PLAN 未用图：B01_01 局徽高清 / B01_06 扫描异常屏样张 / jiangli 重点监测对象
  pic(out, 'textures/b01/B01_01_局徽高清.png', 35, yp + 2.05, Z0 + 0.18, 0, 1.15, 1.15, 'gold', { tag: '值班长台背墙' });
  pic(out, 'textures/b01/B01_06_安检扫描异常屏.png', 32.2, yp + 1.95, Z0 + 0.18, 0, 1.44, 0.81, 'black', { tag: '值班长台背墙' });
  pic(out, 'textures/archives/jiangli.jpg', 37.8, yp + 1.95, Z0 + 0.18, 0, 0.6, 1.07, 'black', { tag: '值班长台背墙' });
  for (const x of [33.6, 36.4]) sconce(out, x, yp + 2.2, Z0 + 0.17, 0); // 批次36 cc_r3_c 看图：北墙 wallZ(−61, 厚 0.3) 墙面在 −60.85，原 Z0+0.03 的挂图整幅埋进墙里、壁灯只露灯罩像浮空 → 贴到墙面外
  // ⑨ 批次35 东墙资料柜成排（第 3 级台阶面，z −53.2…−50.6，与最后一排控制台东端留 1.45 m 走道；不进平台前通道）
  cabRow(out, 49.62, -53.2, y + 3 * 0.45, 6, ROT.W, '资料柜（东墙）', 0.52, true);
  // ⑩ 批次35 地图台（东南：前排控制台背后与证据摄录之间，主屏前通道东 x 43.5 以东）：长桌 + 平铺巨城全景照 + 压镇铜尺 / 文件夹
  out.push({ m: 'r2/woodentable_01', x: 46.6, y, z: -38.6, yaw: 0, fit: [1.6, 0.8, 0.85], tag: '地图台', on: 'floor', col: [1.6, 0.8, 0.85] });
  out.push({ pic: 'textures/b01/B01_14_天空盒_黄昏巨城.png', x: 46.6, y: y + 0.805, z: -38.6, yaw: 0, w: 1.4, h: 0.7, frame: 'none', flat: true, size: [1.4, 0.7, 0.01], tag: '地图台', on: 'desk' });
  out.push({ box: 'brass', x: 46.6, y: y + 0.815, z: -38.27, w: 1.2, h: 0.012, d: 0.03, yaw: 0, tag: '地图台', on: 'partv' });
  out.push({ m: 'r2/several_folders', x: 47.25, y: y + 0.8, z: -38.85, yaw: 0.3, h: 0.2, tag: '地图台', on: 'desk' });
  light(out, 23.4, y + 2.4, -36.5, 0xffe2b8, 2.2, 6); light(out, 47.2, y + 2.4, -36.5, 0xffe2b8, 2.0, 6); light(out, 47.0, yp + 2.3, -58.8, 0xffd8a8, 2.2, 5.5); light(out, 26.0, yp + 2.3, -58.8, 0xffd8a8, 2.2, 6);
  return { room, items: out };
}

// ================= 1F 后楼 · 职工食堂与中庭（批次3；打饭窗口/菜单屏/长桌 3×5/八卦职员/公告栏/喷泉/咖啡台/信箱墙/西侧楼梯为原锚点） =================
export function planCanteen(y) {
  const out = []; const X0 = -18, X1 = 18, Z0 = -140, Z1 = -110, H = 13, GT = y + 6.15; // GT：挑台下吊顶
  const TX = [-9, 0, 9], TZ = [0, 1, 2, 3, 4].map((r) => -115 - r * 4.2);
  const room = { name: '1F · 职工食堂与中庭（批次3）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'S', a: -2.4, b: 2.4, label: '连廊（安检大厅铁门）' }, { wall: 'E', a: -114.6, b: -111.4, label: '东门 → 东廊' }], windows: [],
    keep: [{ label: '打饭窗口（锚点）', x: 0, z: -138.6, w: 22.2, d: 1.3 }, { label: '电子菜单屏（锚点）', x: 0, z: -139.75, w: 14, d: 0.1 }],
    rooms: [['取餐线', 0, -137.0], ['收银', 12.8, -137.0], ['就餐区 3×5（中列首桌撤）', 0, -123.4], ['窗边小桌（东）', 15.6, -125], ['窗边小桌（西）', -16, -132], ['餐具回收', 16.0, -137.6], ['咖啡台', -16.6, -121]],
    aisles: [{ label: '取餐排队带', x0: -11.5, x1: 11.5, z0: -137.6, z1: -136.2 }, { label: '西走道（黑石带）', x0: -5.1, x1: -3.9, z0: -134.0, z1: -114.6 }, { label: '东走道（黑石带）', x0: 3.9, x1: 5.1, z0: -134.0, z1: -114.6 }] };
  const F = (lab, x, z, w, d, col) => out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, col ? col[1] : 1, d], ...(col ? { col } : {}), tag: '原锚点', on: 'floor' });
  F('打饭窗口', 0, -138.6, 22.2, 1.3, [22.2, 1.06, 1.3]);
  for (const z of TZ) for (const x of TX) if (!(x === 0 && z === TZ[0])) F('长桌+椅', x, z, 6.0, 2.6, [5.6, 0.8, 1.2]);
  F('喷泉', 0, -113.2, 2.2, 2.2); F('咖啡台', -17.3, -121, 1.05, 6.05); F('信箱墙', 17.6, -125.2, 0.4, 2.8); F('楼梯', -12.95, -120.1, 1.3, 15.8);
  for (const sx of [-1, 1]) for (let z = -113; z > Z0; z -= 6) F('挑台柱', sx * 14, z, 0.7, 0.7);
  for (const [x, z] of [[-15, -113], [15, -113], [-15, -136], [15, -136], [-16.5, -111.5], [16.5, -138.5], [-16.5, -138.5], [-6, -111.2], [6, -111.2]]) F('盆栽', x, z, 0.7, 0.7);
  // ① 取餐线：10 个餐盆里的食物（面包/可颂/苹果/香蕉/柠檬、木碗叠放），西端托盘与筷筒，东端甜点胡萝卜蛋糕
  const pans = [-9.9, -7.7, -5.5, -3.3, -1.1, 1.1, 3.3, 5.5, 7.7, 9.9], top = y + 1.24;
  const food = [['r2/croissant', { w: 0.14 }, 3], ['r2/hamburger_buns', { w: 0.3 }, 1], ['r2/food_apple_01', { h: 0.08 }, 4], ['r2/bananas', { w: 0.3 }, 1], ['r2/wooden_bowl_01', { w: 0.2 }, 3], ['r2/lemon', { h: 0.07 }, 4], ['r2/croissant', { w: 0.14 }, 3], ['r2/hamburger_buns', { w: 0.3 }, 1], ['r2/food_apple_01', { h: 0.08 }, 4], ['r2/carrot_cake', { w: 0.26 }, 1]];
  pans.forEach((x, i) => { const [m, sz, n] = food[i]; for (let j = 0; j < n; j++) out.push({ m, x: x - 0.45 + (j + 0.5) * (0.9 / n), y: top, z: -138.7 + (j % 2 ? 0.06 : -0.06), yaw: j * 1.3 + i, ...sz, tag: '取餐线', on: 'shelf' }); });
  for (let j = 0; j < 6; j++) out.push({ box: 'dz_bakelite', x: -10.9, y: y + 1.07 + j * 0.022, z: -138.25, w: 0.45, h: 0.018, d: 0.34, tag: '取餐线', on: 'partv' });
  out.push({ m: 'r2/vintage_radio', x: 10.6, y: y + 1.06, z: -139.0, yaw: 0, h: 0.28, tag: '取餐线', on: 'desk' });
  // ② 收银（取餐线东端外）：收银台 + 收银机 + 收银员凳 + 塑料周转箱
  out.push({ m: 'r2/woodentable_01', x: 12.9, y, z: -137.5, yaw: 0, fit: [1.4, 0.95, 0.7], tag: '收银', on: 'floor', col: [1.4, 0.95, 0.7] });
  out.push({ m: 'r2/cashregister_01', x: 12.8, y: y + 0.95, z: -137.55, yaw: Math.PI, h: 0.36, tag: '收银', on: 'desk' });
  out.push({ m: 'r2/bar_chair_round_01', x: 12.9, y, z: -138.5, yaw: 0, h: 0.72, tag: '收银', on: 'floor' });
  out.push({ m: 'r2/plastic_crate_01', x: 13.95, y, z: -137.6, yaw: 0.2, h: 0.3, tag: '收银', on: 'floor' });
  // ③ 后厨（打饭窗口后，炉灶贴北墙、锅具）
  for (const x of [-10.0, -5.0, 0.0, 5.0, 10.0]) out.push({ m: 'r2/electric_stove', x, y, z: -139.68, yaw: 0, h: 0.85, tag: '后厨', on: 'floor' });
  for (const x of [-10.0, 0.0, 10.0]) out.push({ m: 'r2/pot_enamel_01', x: x + 0.05, y: y + 0.85, z: -139.7, yaw: x, h: 0.16, tag: '后厨', on: 'shelf' });
  // ④ 就餐区：每桌两只杯、半数桌一把水壶
  let k = 0; for (const z of TZ) for (const x of TX) { if (x === 0 && z === TZ[0]) continue; const t = y + 0.8;
    for (const dx of [-1.6, 1.9]) if ((k + dx) % 3) out.push({ m: 'r2/coffee_mug', x: x + dx, y: t, z: z + (dx > 0 ? 0.3 : -0.3), yaw: k + dx, h: 0.095, tag: '就餐区', on: 'desk' });
    if (k % 2 === 0) out.push({ m: 'r2/jug_01', x: x + 0.8, y: t, z: z - 0.1, yaw: k, h: 0.2, tag: '就餐区', on: 'desk' }); k++; }
  // ⑤ 窗边小桌（挑台下）：东侧 4 组、西侧 2 组，每组 1 小圆桌 + 2 椅
  for (const [x, z] of [[15.9, -116.8], [15.9, -121.0], [15.9, -130.0], [15.9, -134.0], [-16.0, -130.0], [-16.0, -134.0]]) {
    out.push({ m: 'r2/round_wooden_table_01', x, y, z, yaw: 0, h: 0.76, tag: '窗边小桌', on: 'floor', col: [0.9, 0.76, 0.9] });
    for (const dz of [-0.85, 0.85]) out.push({ m: 'r2/dining_chair_02', x, y, z: z + dz, yaw: dz > 0 ? Math.PI : 0, h: 0.98, tag: '窗边小桌', on: 'floor' });
    out.push({ m: 'r2/coffee_mug', x: x + 0.12, y: y + 0.76, z: z + 0.1, yaw: x, h: 0.095, tag: '窗边小桌', on: 'desk' });
  }
  for (const [x, z] of [[15.9, -116.8], [15.9, -121.0], [15.9, -130.0], [15.9, -134.0], [-16.0, -130.0], [-16.0, -134.0]]) globe(out, x, z, y, GT - y, 2.75, { r: 0.17 });
  // ⑥ 餐具回收（东北角）：钢架 + 周转箱 + 垃圾桶 ×2 + 垃圾袋 + 保洁角
  out.push({ m: 'r2/steel_frame_shelves_02', x: 17.55, y, z: -136.9, yaw: ROT.W, h: 1.8, tag: '餐具回收', on: 'floor' });
  for (const dy of [0.42, 0.95]) out.push({ m: 'r2/plastic_crate_01', x: 17.55, y: y + dy, z: -136.9, yaw: ROT.W, h: 0.26, tag: '餐具回收', on: 'shelf' });
  for (const z of [-135.4, -134.7]) out.push({ m: 'r2/metal_trash_can', x: 17.55, y, z, yaw: ROT.W, h: 0.7, tag: '餐具回收', on: 'floor' });
  out.push({ m: 'r2/trashbag', x: 16.9, y, z: -135.1, yaw: 0.5, h: 0.5, tag: '餐具回收', on: 'floor' });
  out.push({ m: 'r2/wooden_broom', x: 17.75, y, z: -133.7, yaw: ROT.W, rz: 0.1, h: 1.3, tag: 'K4', on: 'floor' });
  // ⑦ 电视（东南角高处托架）+ 监控 + 出口标识；照明：取餐线暖光、挑台下球灯；磨损
  out.push({ box: 'blackMetal', x: 17.6, y: y + 2.55, z: -138.6, w: 0.5, h: 0.04, d: 0.6, tag: '电视托架', on: 'partv' });
  out.push({ m: 'r2/television_01', x: 17.55, y: y + 2.57, z: -138.6, yaw: ROT.W - 0.4, h: 0.45, tag: '电视', on: 'shelf' });
  for (const [x, z, yaw] of [[-17.6, -110.6, Math.PI * 0.75], [17.6, -139.4, -Math.PI * 0.25]]) out.push({ m: 'r2/cctv_camera', x, y: y + 4.6, z, yaw, h: 0.3, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/exit_sign', x: 17.8, y: y + 3.7, z: -113.0, yaw: ROT.W, w: 0.36, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/exit_sign', x: 0, y: y + 6.5, z: Z1 - 0.3, yaw: Math.PI, w: 0.36, tag: 'K3', on: 'wall' });
  for (const x of [-7.5, 0, 7.5]) light(out, x, y + 3.2, -137.2, 0xffe2b8, 3.0, 8);
  wear(out, -11.0, 11.0, -137.5, -136.3, y); wear(out, -5.0, -4.0, -134.0, -114.8, y); wear(out, 4.0, 5.0, -134.0, -114.8, y);
  return { room, items: out };
}

// ================= B 层（批次3）：按 PLACEMENT §12 拟定功能，在既有剧情层里落位对应功能区（原锚点一律不动） =================
// B1 外勤整备库 → 西南「后勤卸货区」（货运卷帘门 + 卸货平台 + 托盘/纸箱/搬运车 + 杂物钢架）
export function planB1(y) {
  const out = []; const X0 = -16, X1 = 16, Z0 = -126, Z1 = -92, H = 5.6;
  const room = { name: 'B1 · 外勤整备库 → 后勤卸货区（批次3）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H, doors: [{ wall: 'S', a: -9.4, b: 9.4, label: '电梯厅开口' }], windows: [],
    keep: [{ label: '出勤白板（锚点）', x: -15.75, z: -108, w: 0.1, d: 3.1 }, { label: 'A 级通缉档案柜（锚点）', x: -15.0, z: -114, w: 0.8, d: 0.6 }],
    rooms: [['后勤卸货区', -12.5, -119.5], ['简报区', -11, -99.5], ['车辆整备区', 10.5, -109]], aisles: [{ label: '卷帘门前装卸带', x0: -15.5, x1: -13.4, z0: -121.4, z1: -117.8 }] };
  const F = (lab, x, z, w, d) => out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, 1, d], tag: '原锚点', on: 'floor' });
  F('托盘货物', -7.5, -117, 1.4, 4.4); F('装备箱', -12.25, -123.8, 1.4, 0.7); F('A 级档案柜', -15.0, -114, 0.8, 0.7); F('装备墙', 0, -125.7, 22.4, 0.6); F('简报座椅', -11.6, -99.5, 3.6, 5.0); F('背心挂架', -1.5, -113.2, 3.8, 3.0);
  // 货运卷帘门（西墙）+ 门框 + 防撞胶块 + 黄黑警示地面
  out.push({ m: 'r2/rollershutter_door', x: X0 + 0.28, y, z: -119.6, yaw: ROT.E, h: 3.6, tag: '卸货区', on: 'wall' });
  for (const dz of [-1.0, 1.0]) out.push({ box: 'r3_hazard', x: X0 + 0.15, y: y + 1.8, z: -119.6 + dz * 1.0, w: 0.18, h: 3.6, d: 0.22, tag: '卸货区', on: 'partv' });
  for (const dz of [-0.6, 0.6]) out.push({ box: 'dz_bakelite', x: X0 + 0.3, y: y + 0.45, z: -119.6 + dz, w: 0.2, h: 0.35, d: 0.3, tag: '卸货区', on: 'partv' });
  floorZ(out, 'r3_hazard', X0 + 0.2, X0 + 0.5, -121.6, -117.6, y, { uv: 1 }); floorZ(out, 'r3_epoxy', X0 + 0.5, -10.6, -122.2, -117.0, y, {});
  out.push({ sign: '货运通道', sub: '卸货时禁止站人', x: X0 + 0.07, y: y + 3.9, z: -119.6, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  // 托盘 + 纸箱（K5）、托盘搬运车、手推车、水泥袋（维修堆料）
  for (const [x, z] of [[-12.8, -121.2], [-12.8, -118.6]]) { out.push({ m: 'r2/eur_pallet_rawscan', x, y, z, yaw: ROT.E, w: 1.2, tag: '卸货区', on: 'floor', col: [1.2, 0.15, 0.8] }); }
  for (const [x, z, m, w, dy] of [[-12.9, -121.0, 'r2/set_of_cardboard_boxes', 0.9, 0.14], [-12.7, -118.5, 'r2/old_paper_cardboard_boxes', 0.9, 0.14], [-12.6, -118.7, 'r2/cardboard_transport_shipping_box', 0.5, 0.75]]) out.push({ m, x, y: y + dy, z, yaw: 0.1, w, tag: '卸货区', on: 'shelf' });
  out.push({ m: 'r2/simple_warehouse_pallet_hand_truck', x: -11.0, y, z: -120.0, yaw: ROT.W + 0.2, h: 1.2, tag: '卸货区', on: 'floor' });
  out.push({ m: 'r2/hand_truck', x: -14.9, y, z: -116.3, yaw: ROT.E, rx: -0.08, h: 1.2, tag: '卸货区', on: 'floor' });
  for (const [k, dy] of [[0, 0], [1, 0], [2, 0.16]]) out.push({ m: 'r2/cement_bag', x: -9.6 + (k % 2) * 0.62, y: y + dy, z: -124.4, yaw: 0.1 * k, w: 0.6, tag: '维修堆料', on: 'shelf' });
  // 杂物钢架（西墙，白板与档案柜之间不够 → 放南墙西段）
  for (const x of [-14.3, -12.2]) out.push({ m: 'r2/rusty_metal_shelving', x, y, z: Z0 + 0.45, yaw: 0, h: 2.0, tag: '杂物架', on: 'floor', col: [2.0, 2.0, 0.66] });
  for (const [x, dy, m, sz] of [[-14.6, 0.75, 'r2/metal_toolbox', { w: 0.45 }], [-13.9, 1.45, 'r2/plastic_crate_01', { h: 0.28 }], [-12.4, 0.75, 'r2/multi_cleaner_5_litre', { h: 0.32 }], [-11.9, 1.45, 'r2/cardboard_transport_shipping_box', { w: 0.45 }]]) out.push({ m, x, y: y + dy, z: Z0 + 0.45, yaw: 0, ...sz, tag: '杂物架', on: 'shelf' });
  // K4 保洁角 + K3（灭火器、监控）+ 卸货区工作灯
  for (const [m, x, z, sz] of [['r2/plastic_broom', -15.5, -115.4, { h: 1.3 }], ['r2/dustpan', -15.5, -115.0, { w: 0.3 }], ['r2/trashbag', -10.4, -125.0, { h: 0.5 }]]) out.push({ m, x, y, z, yaw: 0.5, rz: m.includes('broom') ? 0.12 : 0, ...sz, tag: 'K4', on: 'floor' });
  out.push({ m: 'r2/fire_extinguisher', x: -15.75, y, z: -122.6, yaw: ROT.E, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/cctv_camera', x: -15.7, y: y + 4.2, z: -125.6, yaw: Math.PI * 0.25, h: 0.3, tag: 'K3', on: 'wall' });
  for (const z of [-118.0, -121.4]) globe(out, -13.4, z, y, H, 3.6, { cold: true, r: 0.16 });
  light(out, -13.2, y + 3.4, -119.6, 0xe8eeff, 2.6, 8);
  wear(out, X0 + 0.6, -10.8, -120.6, -118.6, y);
  return { room, items: out };
}
// B2 审讯羁押 → 西南新辟「机电间」（配电柜排 + 电表盘 + 发电机 + 阀门管线 + 高压隔离），走廊西墙开门 z −116
export function planB2(y) {
  const out = []; const X0 = -12.6, X1 = -2.4, Z0 = -124.4, Z1 = -110.0, H = 4.2;
  const room = { name: 'B2 · 机电间（批次3 新辟）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H, doors: [{ wall: 'E', a: -116.6, b: -115.4, label: '门（走廊西墙）' }], windows: [],
    keep: [], rooms: [['配电', -9.5, -112.0], ['发电机', -9.0, -121.0], ['阀门站', -4.0, -122.5]], aisles: [{ label: '检修通道', x0: -8.6, x1: -2.6, z0: -116.9, z1: -115.1 }] };
  // 外壳：地坪、顶板、西/南/北墙（东墙=走廊西墙，开门洞）
  out.push({ box: 'r3_epoxy', x: (X0 + X1) / 2, y: y - 0.1, z: (Z0 + Z1) / 2, w: X1 - X0, h: 0.2, d: Z1 - Z0, uv: 0.5, tag: '地坪', on: 'partv' }); out.push({ part: true, x: (X0 + X1) / 2, y: y - 0.2, z: (Z0 + Z1) / 2, yaw: 0, size: [X1 - X0, 0.2, Z1 - Z0], tag: '地坪', on: 'floorcol' });
  out.push({ box: 'concreteWall', x: (X0 + X1) / 2, y: y + H + 0.15, z: (Z0 + Z1) / 2, w: X1 - X0 + 0.4, h: 0.3, d: Z1 - Z0 + 0.4, uv: 0.3, tag: '顶板', on: 'partv' });
  wallBox(out, 'concreteWall', X0 - 0.2, (Z0 + Z1) / 2, 0.4, Z1 - Z0 + 0.4, y, H); wallBox(out, 'concreteWall', (X0 + X1) / 2, Z0 - 0.2, X1 - X0, 0.4, y, H); wallBox(out, 'concreteWall', (X0 + X1) / 2, Z1 + 0.2, X1 - X0, 0.4, y, H);
  out.push({ box: 'dz_paintLow', x: (X0 + X1) / 2, y: y + 0.6, z: Z0 + 0.01, w: X1 - X0, h: 1.2, d: 0.02, tag: '墙裙', on: 'partv' }); out.push({ box: 'dz_paintLow', x: X0 + 0.01, y: y + 0.6, z: (Z0 + Z1) / 2, w: 0.02, h: 1.2, d: Z1 - Z0, tag: '墙裙', on: 'partv' });
  // ① 配电：北墙开关柜 4 台成排 + 电表盘（西墙）+ 高压隔离（黄黑地面 + 铜柱红绳）
  for (let k = 0; k < 4; k++) out.push({ m: 'r2/electrical_switchboard', x: -11.6 + k * 1.05, y, z: Z1 - 0.38, yaw: Math.PI, h: 2.1, tag: '配电', on: 'floor', col: [1.05, 2.1, 0.63] });
  out.push({ m: 'r2/electric_meters_and_panels_1', x: X0 + 0.1, y: y + 0.9, z: -113.6, yaw: ROT.E, h: 1.6, tag: '配电', on: 'wall' });
  floorZ(out, 'r3_hazard', -12.2, -7.4, -112.0, -111.8, y, { uv: 1 });
  stanchions(out, [[-12.0, -112.4], [-9.8, -112.4], [-7.6, -112.4]], y, '高压隔离');
  out.push({ sign: '高压危险', sub: '非电工禁止入内', x: -9.8, y: y + 1.3, z: -112.42, yaw: 0, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  // ② 发电机（西南）+ 油桶 + 灭火器
  out.push({ m: 'r2/diesel_generator', x: -9.6, y, z: -121.6, yaw: 0, h: 1.4, tag: '发电机', on: 'floor', col: [1.9, 1.4, 0.95] });
  out.push({ m: 'r2/oil_drums', x: -11.7, y, z: -123.4, yaw: 0.3, h: 0.95, tag: '发电机', on: 'floor', col: [1.1, 0.95, 0.95] });
  out.push({ m: 'r2/fire_extinguisher', x: -12.3, y, z: -115.4, yaw: ROT.E, h: 0.58, tag: 'K3', on: 'floor' });
  // ③ 阀门站（东南）：竖管 + 阀门手轮 + 压力表；顶部主管线沿 z
  for (const [x, r, mat] of [[-4.2, 0.1, 'dz_pipe'], [-5.0, 0.08, 'dz_pipeRed'], [-5.7, 0.08, 'dz_pipe']]) { out.push({ box: mat, x, y: y + H / 2, z: Z0 + 0.25, w: r * 2, h: H, d: r * 2, tag: '阀门站', on: 'partv' }); out.push({ m: 'r2/valve_wheel_3d_scan', x, y: y + 1.35, z: Z0 + 0.25 + r + 0.06, yaw: 0, h: 0.34, tag: '阀门站', on: 'wall' }); out.push({ m: 'r2/pressure_gauge', x, y: y + 1.75, z: Z0 + 0.25 + r + 0.04, yaw: 0, h: 0.16, tag: '阀门站', on: 'wall' }); }
  for (const [c, mat, r] of [[-3.0, 'dz_pipe', 0.12], [-3.4, 'dz_pipeRed', 0.09], [-11.9, 'dz_pipe', 0.1]]) pipe(out, mat, 'z', Z0 + 0.2, Z1 - 0.2, c, y + H - 0.35, r);
  pipe(out, 'dz_pipe', 'x', X0 + 0.2, X1 - 0.2, Z0 + 0.6, y + H - 0.55, 0.1);
  out.push({ m: 'r2/power_box_01', x: -2.78, y: y + 1.2, z: -119.0, yaw: ROT.W, h: 0.6, tag: '阀门站', on: 'wall' });
  // ④ 照明 + 设备带：吸顶灯槽、监控、工具箱
  for (const z of [-112.6, -117.2, -121.8]) troffer(out, -7.5, z, y, H, Math.PI / 2, 1.2, { cold: true });
  light(out, -7.5, y + 3.2, -114.0, 0xdfe8ff, 2.4, 7); light(out, -7.5, y + 3.2, -121.0, 0xdfe8ff, 2.2, 7);
  out.push({ m: 'r2/metal_toolbox', x: -8.2, y, z: -123.9, yaw: 0.4, w: 0.5, tag: '工具', on: 'floor' });
  out.push({ m: 'r2/cctv_camera', x: -3.0, y: y + 3.6, z: -110.4, yaw: -Math.PI * 0.75, h: 0.3, tag: 'K3', on: 'wall' });
  // ⑤ 批次4 补：东墙内衬混凝土（原走廊西墙是软包面，机电间里不对）+ 门框；北墙壁挂配电箱 ×2 + 桥架；工作台 + 台钳 + 工具车；西墙备件钢架；暖气锅炉（接阀门站）；便携发电机；笼灯
  for (const [a0, a1] of [[Z0, -116.6], [-115.4, Z1]]) out.push({ box: 'concreteWall', x: X1 - 0.24, y: y + H / 2, z: (a0 + a1) / 2, w: 0.04, h: H, d: a1 - a0, uv: 0.5, tag: '东墙内衬', on: 'partv' });
  out.push({ box: 'dz_paintLow', x: X1 - 0.27, y: y + 0.6, z: (Z0 - 116.6) / 2, w: 0.02, h: 1.2, d: -116.6 - Z0, tag: '墙裙', on: 'partv' }); out.push({ box: 'dz_paintLow', x: X1 - 0.27, y: y + 0.6, z: (-115.4 + Z1) / 2, w: 0.02, h: 1.2, d: Z1 + 115.4, tag: '墙裙', on: 'partv' });
  for (const dz of [-0.66, 0.66]) out.push({ box: 'r3_steelOld', x: X1 - 0.29, y: y + 1.1, z: -116.0 + dz, w: 0.1, h: 2.2, d: 0.08, tag: '门框', on: 'partv' });
  out.push({ box: 'r3_steelOld', x: X1 - 0.29, y: y + 2.24, z: -116.0, w: 0.1, h: 0.08, d: 1.4, tag: '门框', on: 'partv' });
  out.push({ sign: '机电间 B2-M', sub: '闲人免进 · 进出登记', x: X1 + 0.22, y: y + 1.6, z: -116.95, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  for (const x of [-6.6, -5.4]) out.push({ m: 'r2/electrical_panel_c', x, y: y + 1.0, z: Z1 - 0.08, yaw: Math.PI, h: 0.75, tag: '配电', on: 'wall' });
  out.push({ box: 'r3_steelGrey', x: (X0 + X1) / 2, y: y + 3.15, z: Z1 - 0.3, w: X1 - X0 - 0.4, h: 0.06, d: 0.45, tag: '电缆桥架', on: 'partv' });
  for (let k = 0; k < 4; k++) out.push({ box: 'dz_cable', x: (X0 + X1) / 2, y: y + 3.21, z: Z1 - 0.46 + k * 0.09, w: X1 - X0 - 0.5, h: 0.05, d: 0.05, tag: '电缆', on: 'partv' });
  for (const x of [-11.6, -10.55, -9.5, -8.45]) out.push({ box: 'dz_cable', x, y: y + 2.65, z: Z1 - 0.3, w: 0.06, h: 1.0, d: 0.06, tag: '电缆', on: 'partv' });
  // 工作台（东北）：木台面钢腿 + 台钳 + 工具车 + 工具挂板
  out.push({ fixed: true, m: '固定:工作台', x: -3.85, y, z: -111.0, yaw: 0, size: [2.0, 0.9, 0.75], col: [2.0, 0.9, 0.75], tag: '工具', on: 'floor' });
  out.push({ box: 'dz_wain', x: -3.85, y: y + 0.88, z: -111.0, w: 2.0, h: 0.05, d: 0.75, tag: '工具', on: 'partv' });
  for (const [dx, dz] of [[-0.95, -0.33], [0.95, -0.33], [-0.95, 0.33], [0.95, 0.33]]) out.push({ box: 'r3_steelOld', x: -3.85 + dx, y: y + 0.43, z: -111.0 + dz, w: 0.05, h: 0.86, d: 0.05, tag: '工具', on: 'partv' });
  out.push({ box: 'r3_steelOld', x: -3.85, y: y + 0.18, z: -111.0, w: 1.9, h: 0.03, d: 0.66, tag: '工具', on: 'partv' });
  out.push({ m: 'r2/bench_vice_01', x: -3.25, y: y + 0.905, z: -111.2, yaw: Math.PI, h: 0.2, tag: '工具', on: 'shelf' });
  out.push({ m: 'r2/metal_toolbox', x: -4.35, y: y + 0.905, z: -110.85, yaw: 0.2, w: 0.45, tag: '工具', on: 'shelf' });
  out.push({ box: 'dz_cork', x: -3.85, y: y + 1.75, z: Z1 - 0.03, w: 1.8, h: 0.9, d: 0.03, tag: '工具挂板', on: 'partv' });
  for (let k = 0; k < 7; k++) out.push({ box: 'r3_steelOld', x: -4.35 + k * 0.25, y: y + 1.7 + (k % 2) * 0.12, z: Z1 - 0.06, w: 0.04, h: 0.32 + (k % 3) * 0.06, d: 0.02, tag: '工具挂板', on: 'partv' });
  out.push({ m: 'r2/tool_cart', x: -4.2, y, z: -112.6, yaw: 0.15, w: 0.8, tag: '工具', on: 'floor', col: [0.8, 0.6, 0.48] });
  // 西墙备件钢架 ×2（电表盘南侧）
  for (const z of [-117.0, -119.2]) { out.push({ m: 'r2/rusty_metal_shelving', x: X0 + 0.35, y, z, yaw: ROT.E, h: 2.0, tag: '备件架', on: 'floor', col: [0.66, 2.0, 2.0] });
    for (const [dy, dz, m, sz] of [[0.42, -0.5, 'r2/cardboard_transport_shipping_box', { w: 0.45 }], [0.42, 0.45, 'r2/metal_toolbox', { w: 0.42 }], [1.02, 0.0, 'r2/plastic_crate_01', { h: 0.26 }], [1.6, -0.4, 'r2/multi_cleaner_5_litre', { h: 0.3 }], [1.6, 0.5, 'r2/cardboard_transport_shipping_box', { w: 0.4 }]]) out.push({ m, x: X0 + 0.35, y: y + dy, z: z + dz, yaw: ROT.E + 0.1, ...sz, tag: '备件架', on: 'shelf' }); }
  // 第二列配电柜（面朝北、背靠发电机区，双列布置留 1.9 m 检修通道）
  for (let k = 0; k < 3; k++) out.push({ m: 'r2/electrical_switchboard', x: -9.0 + k * 1.05, y, z: -117.9, yaw: 0, h: 2.1, tag: '配电', on: 'floor', col: [1.05, 2.1, 0.63] });
  for (const x of [-9.0, -7.95, -6.9]) out.push({ box: 'dz_cable', x, y: y + 2.75, z: -117.9, w: 0.06, h: 1.3, d: 0.06, tag: '电缆', on: 'partv' });
  out.push({ box: 'r3_steelGrey', x: -7.95, y: y + 3.42, z: -117.9, w: 3.4, h: 0.06, d: 0.4, tag: '电缆桥架', on: 'partv' });
  // 暖气锅炉（阀门站西侧，接竖管）+ 便携发电机 + 墙上压力表
  out.push({ m: 'r2/vintage_boiler', x: -7.0, y, z: -123.6, yaw: 0, h: 1.9, tag: '锅炉', on: 'floor', col: [0.95, 1.9, 0.65] });
  pipe(out, 'dz_pipe', 'x', -6.4, -4.2, Z0 + 0.35, y + 1.55, 0.06);
  out.push({ m: 'r2/portable_generator', x: -11.6, y, z: -120.6, yaw: ROT.E, w: 0.75, tag: '发电机', on: 'floor', col: [0.75, 0.55, 0.55] });
  for (const z of [-113.0, -119.6]) out.push({ m: 'r2/industrial_pipe_lamp', x: X1 - 0.4, y: y + 2.6, z, yaw: ROT.W, h: 0.32, tag: '壁灯', on: 'wall' });
  light(out, -4.0, y + 2.4, -111.6, 0xffe0b0, 2.0, 5); light(out, -10.6, y + 2.6, -118.2, 0xdfe8ff, 1.8, 6);
  wear(out, -8.4, -2.6, -116.7, -115.3, y);
  return { room, items: out };
}
// 档案馆 B1（y −4.2，PLACEMENT 的「B3 档案密集库」= 档案馆下层库房）：密集架 12 排与第 7 排锚点不动；补两侧锈柜/钢架、前通道值守台、推车、灯槽、温湿度
export function planArchiveB1(y) {
  const out = []; const X0 = -56, X1 = -20, Z0 = -70, Z1 = -32, H = 5.2;
  const room = { name: '档案馆 B1 · 密集库（批次3）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H, doors: [], windows: [],
    keep: [{ label: '密集架 12 排（含第 7 排锚点）', x: -38.6, z: -54.3, w: 28, d: 29.0 }], rooms: [['前通道 · 值守台', -48, -35.4], ['西墙锈柜', -54.6, -52], ['东墙钢架', -21.2, -52]],
    aisles: [{ label: '楼梯落脚区（洞口下）', x0: -34.8, x1: -24.2, z0: -38.0, z1: -34.6 }, { label: '前通道', x0: -52.5, x1: -21, z0: -39.6, z1: -38.4 }] };
  for (let i = 0; i < 12; i++) out.push({ fixed: true, m: '固定:密集架', x: X0 + 4.5 + i * 2.35, y, z: -54.3, yaw: 0, size: [2.0, 3.0, 29.0], tag: '原锚点', on: 'floor' });
  // ① 值守台（前通道西段）+ 推车 + 借阅单盒
  chiefDesk(out, -48.5, -34.6, y, Math.PI, '值守台', { guests: 1, phone: 'r2/rotary_telephone' });
  for (const [x, z] of [[-44.2, -35.2], [-42.6, -35.2]]) out.push({ m: 'storage_cart', x, y, z, yaw: 0.05, w: 1.1, tag: '推车', on: 'floor', col: [1.1, 1.0, 0.8] });
  out.push({ m: 'r2/wooden_flat_filing_tray', x: -48.1, y: y + 0.78, z: -34.4, yaw: Math.PI, w: 0.34, tag: '值守台', on: 'desk' });
  // ② 西墙：锈蚀文件柜一排（旧库）+ 捕鼠器；东墙：双联钢架 + 档案盒
  for (let k = 0; k < 16; k++) out.push({ m: 'r2/rusty_filing_cabinet', x: X0 + 0.3, y, z: -42.0 - k * 0.5, yaw: ROT.E, h: 1.35, tag: '西墙锈柜', on: 'floor', col: [0.42, 1.35, 0.56] });
  for (let k = 0; k < 6; k++) { const z = -43.6 - k * 4.3; out.push({ m: 'r2/double_metal_shelving_unit', x: X1 - 0.45, y, z, yaw: ROT.W, h: 2.0, tag: '东墙钢架', on: 'floor', col: [4.16, 2.0, 0.8] });
    for (const dy of [0.42, 1.02, 1.6]) for (const dz of [-1.2, 0.4, 1.4]) if ((dy * 10 + dz) % 3 > 0.5) out.push({ m: 'r2/filing_box', x: X1 - 0.45, y: y + dy, z: z + dz, yaw: ROT.W, w: 0.34, tag: '东墙钢架', on: 'shelf' }); }
  for (const [x, z] of [[-55.2, -50.3], [-22.0, -62.9]]) out.push({ m: 'r2/mousetrap', x, y, z, yaw: 1.1, w: 0.16, tag: '捕鼠器', on: 'floor' });
  out.push({ m: 'r2/wooden_ladder_02', x: -53.6, y, z: -68.4, yaw: 0, h: 2.2, tag: '梯', on: 'floor' });
  // ③ 灯槽（沿前通道 + 两侧）、温湿度计、气体灭火器、监控
  for (const x of [-50, -44, -38, -32, -26]) troffer(out, x, -36.6, y, H, 0, 1.4, { cold: true });
  for (const z of [-46, -54, -62]) { troffer(out, X0 + 1.4, z, y, H, Math.PI / 2, 1.4, { cold: true }); troffer(out, X1 - 1.4, z, y, H, Math.PI / 2, 1.4, { cold: true }); }
  light(out, -44, y + 3.4, -36.4, 0xe4ecff, 2.6, 9); light(out, -54.4, y + 3.2, -52, 0xe4ecff, 2.0, 9); light(out, -21.6, y + 3.2, -52, 0xe4ecff, 2.0, 9);
  out.push({ box: 'dz_bakelite', x: -55.93, y: y + 1.55, z: -40.6, w: 0.04, h: 0.24, d: 0.18, tag: '温湿度计', on: 'partv' }); out.push({ box: 'r3_screenAmber', x: -55.9, y: y + 1.58, z: -40.6, w: 0.01, h: 0.1, d: 0.13, tag: '温湿度计', on: 'partv' });
  for (const z of [-40.0, -66.0]) out.push({ m: 'r2/fire_extinguisher', x: -55.7, y, z, yaw: ROT.E, h: 0.58, tag: 'K3 气体灭火', on: 'floor' });
  out.push({ m: 'r2/cctv_camera', x: -20.4, y: y + 3.8, z: -32.4, yaw: -Math.PI * 0.75, h: 0.3, tag: 'K3', on: 'wall' });
  return { room, items: out };
}
// B4 收容柜走廊 → 中央「证物中转岛」（登记台 + 待入柜推车 + 军用木箱 + 地面导向线）
export function planB4(y) {
  const out = []; const X0 = -4.2, X1 = 4.2, Z0 = -140, Z1 = -92, H = 5.2;
  const room = { name: 'B4 · 收容柜走廊 → 证物中转岛（批次3）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H, doors: [{ wall: 'S', a: -1.5, b: 1.5, label: '气闸门' }], windows: [],
    keep: [{ label: '齐仇工作台（锚点）', x: 0, z: -136.8, w: 3.1, d: 1.1 }], rooms: [['证物中转岛', 0, -112], ['收容柜（两侧 26 位）', 0, -100]],
    aisles: [{ label: '西侧通行', x0: -3.1, x1: -1.0, z0: -134, z1: -96 }, { label: '东侧通行', x0: 1.0, x1: 3.1, z0: -134, z1: -96 }] };
  for (let k = 0; k < 13; k++) for (const sx of [-1, 1]) out.push({ fixed: true, m: '固定:收容柜', x: sx * 3.65, y, z: -95 - k * 3.4, yaw: 0, size: [1.0, 2.6, 2.8], tag: '原锚点', on: 'floor' });
  out.push({ fixed: true, m: '固定:齐仇工作台', x: 0, y, z: -136.8, yaw: 0, size: [3.1, 0.95, 1.1], tag: '原锚点', on: 'floor' }); out.push({ fixed: true, m: '固定:齐仇', x: 0, y, z: -135.8, yaw: 0, size: [0.6, 1.8, 0.6], tag: '原锚点', on: 'floor' });
  // 登记台（面向气闸门）
  workstation(out, 0, -104.6, y, 0, 95, { tag: '证物登记', typewriter: true, chair: 'r2/old_computer_chair' });
  out.push({ m: 'r2/desk_bell', x: -0.6, y: y + 0.76, z: -104.35, yaw: 0, w: 0.1, tag: '证物登记', on: 'desk' });
  out.push({ sign: '证物中转', sub: '先登记 · 后入柜 · 双人签字', x: 0, y: y + 1.05, z: -104.6 + 0.47, yaw: 0, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  // 待入柜推车 ×3（载军用木箱 / 证物箱）+ 撬棍、断线钳
  for (const [i, z] of [-110.5, -114.0, -117.5].entries()) {
    out.push({ m: 'storage_cart', x: 0, y, z, yaw: Math.PI / 2, w: 1.1, tag: '待入柜', on: 'floor', col: [1.1, 1.0, 0.8] });
    out.push({ m: i % 2 ? 'r2/wooden_military_crate' : 'r2/military_wooden_crate', x: 0, y: y + 0.92, z, yaw: Math.PI / 2 + 0.06, w: 0.6, tag: '待入柜', on: 'shelf' });
    out.push({ box: 'dz_paper', x: 0.2, y: y + 0.96 + 0.22, z: z + 0.2, w: 0.12, h: 0.003, d: 0.08, tag: '证物标签', on: 'partv' });
  }
  out.push({ m: 'r2/crowbar_01', x: 0.45, y: y + 0.76, z: -104.85, yaw: 1.4, h: 0.6, rz: Math.PI / 2, tag: '工具', on: 'shelf' });
  floorZ(out, 'r3_hazard', -0.75, 0.75, -119.4, -119.2, y, { uv: 1 }); floorZ(out, 'r3_hazard', -0.75, 0.75, -108.9, -108.7, y, { uv: 1 });
  for (const x of [-0.85, 0.85]) out.push({ box: 'r3_paintYellow', x, y: y + 0.004, z: -114.0, w: 0.06, h: 0.006, d: 10.4, tag: '导向线', on: 'partv' });
  out.push({ m: 'r2/cctv_camera', x: 3.9, y: y + 4.2, z: -92.6, yaw: -Math.PI * 0.75, h: 0.3, tag: 'K3', on: 'wall' });
  light(out, 0, y + 3.2, -106, 0xfff0d8, 2.4, 7); light(out, 0, y + 3.2, -114, 0xffd8a0, 2.2, 7);
  return { room, items: out };
}
// B5 深库前室 → 「收容前室 · 检测」（东侧实验台 + 试剂柜 + 显微镜/分光光度计 + 防毒面具墙 + 警报器）
export function planB5(y) {
  const out = []; const X0 = -6, X1 = 6, Z0 = -100, Z1 = -92, H = 7;
  const room = { name: 'B5 · 深库前室 → 收容前室 · 检测（批次3）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H, doors: [{ wall: 'N', a: -2.4, b: 2.4, label: '圆形金库门' }, { wall: 'S', a: -1.5, b: 1.5, label: '电梯厅' }], windows: [],
    keep: [{ label: '双人登记台（锚点）', x: -3.0, z: -95.5, w: 3.3, d: 1.0 }], rooms: [['检测台', 4.4, -95.8], ['面具墙', -5.6, -97.6]], aisles: [{ label: '金库门前通道', x0: -1.3, x1: 1.4, z0: -99.6, z1: -92.4 }] };
  out.push({ fixed: true, m: '固定:双人登记台', x: -3.0, y, z: -95.5, yaw: 0, size: [3.3, 1.07, 1.0], col: [3.3, 1.07, 1.0], tag: '原锚点', on: 'floor' });
  out.push({ m: 'r2/lab_bench', x: X1 - 0.5, y, z: -96.0, yaw: ROT.W, w: 2.6, tag: '检测台', on: 'floor', col: [2.6, 0.95, 0.9] });
  out.push({ m: 'r2/laboratory_cabinet_storage_pbr_low_poly', x: X1 - 0.35, y, z: -98.6, yaw: ROT.W, h: 1.9, tag: '检测台', on: 'floor', col: [1.25, 1.9, 0.55] });
  for (const [dz, m, sz] of [[-0.8, 'r2/industrial_microscope', { h: 0.42 }], [0.2, 'r2/spectrophotometer', { w: 0.42 }], [0.9, 'r2/coffee_mug', { h: 0.095 }]]) out.push({ m, x: X1 - 0.55, y: y + 0.92, z: -96.0 + dz, yaw: ROT.W, ...sz, tag: '检测台', on: 'shelf' });
  for (const dz of [-0.6, 0.6]) out.push({ m: 'r2/laboratory_stool', x: X1 - 1.45, y, z: -96.0 + dz, yaw: 0, h: 0.6, tag: '检测台', on: 'floor' });
  for (let k = 0; k < 4; k++) out.push({ m: 'gas_mask', x: X0 + 0.12, y: y + 1.75, z: -96.6 - k * 0.5, yaw: ROT.E, h: 0.28, tag: '面具墙', on: 'wall' });
  out.push({ box: 'blackMetal', x: X0 + 0.04, y: y + 1.95, z: -97.35, w: 0.04, h: 0.04, d: 2.2, tag: '面具墙', on: 'partv' });
  out.push({ m: 'r2/classic_siren_with_2_speakers', x: 0, y: y + 5.0, z: Z1 - 0.2, yaw: Math.PI, h: 0.5, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/fire_extinguisher', x: X0 + 0.35, y, z: -99.4, yaw: ROT.E, h: 0.58, tag: 'K3', on: 'floor' });
  light(out, 4.2, y + 2.6, -96.2, 0xe8f2ff, 2.4, 6);
  // 批次4：前室偏暗 → 吸顶灯槽 ×4（冷白）+ 登记台/面具墙补光 + 金库门顶红色警示灯
  for (const [x, z] of [[-3.0, -94.2], [3.6, -94.2], [-3.0, -98.2], [3.6, -98.2]]) troffer(out, x, z, y, 4.2, 0, 1.4, { cold: true });
  light(out, -3.0, y + 3.0, -95.0, 0xe8f2ff, 2.6, 7); light(out, -4.6, y + 2.6, -97.8, 0xe8f2ff, 1.8, 5); light(out, 0, y + 4.4, -99.2, 0xff4030, 1.4, 6);
  for (const x of [-2.6, 2.6]) out.push({ m: 'r2/rusty_twin_spot_emergency_light', x, y: y + 3.4, z: Z0 + 0.32, yaw: 0, h: 0.3, tag: 'K3', on: 'wall' });
  return { room, items: out };
}
// B6 训练场 → 西墙「维护管廊检修段」（沿墙高位电缆桥架 + 风管 + 管线、地堡灯、维护门门框、检修工具、锈灭火器）
export function planB6(y) {
  const out = []; const X0 = -32, X1 = -20.5, Z0 = -156, Z1 = -92, H = 16;
  const room = { name: 'B6 · 西墙维护管廊检修段（批次3）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H, doors: [{ wall: 'W', a: -147.1, b: -144.9, label: '维护通道门（→ 墨渊）' }], windows: [],
    keep: [{ label: '控制塔（锚点）', x: -22, z: -100, w: 8, d: 5 }, { label: '体能障碍区', x: -25.75, z: -138, w: 10.5, d: 30 }], rooms: [['维护门检修平台', -30.6, -146]], aisles: [{ label: '维护门前', x0: -31.9, x1: -30.4, z0: -146.9, z1: -145.1 }] };
  // 桥架：两层，沿西墙高 4.2 / 5.0 m；支架每 3 m
  for (const [yy, w] of [[4.2, 0.6], [5.0, 0.45]]) { out.push({ box: 'r3_steelGrey', x: X0 + 0.45, y: y + yy, z: -128, w, h: 0.06, d: 50, tag: '电缆桥架', on: 'partv' }); for (const s2 of [-1, 1]) out.push({ box: 'r3_steelGrey', x: X0 + 0.45 + s2 * w / 2, y: y + yy + 0.06, z: -128, w: 0.02, h: 0.12, d: 50, tag: '电缆桥架', on: 'partv' });
    for (let k = 0; k < 4; k++) out.push({ box: 'dz_cable', x: X0 + 0.32 + k * 0.08, y: y + yy + 0.06, z: -128, w: 0.05, h: 0.05, d: 50, tag: '电缆', on: 'partv' }); }
  for (let z = -104; z >= -152; z -= 3) out.push({ box: 'r3_steelOld', x: X0 + 0.4, y: y + 4.6, z, w: 0.7, h: 0.05, d: 0.06, tag: '支架', on: 'partv' });
  pipe(out, 'dz_pipe', 'z', -152, -104, X0 + 0.25, y + 6.0, 0.14); pipe(out, 'dz_pipeRed', 'z', -152, -104, X0 + 0.6, y + 6.0, 0.1);
  out.push({ box: 'r3_steelGrey', x: X0 + 0.55, y: y + 7.0, z: -128, w: 0.9, h: 0.6, d: 48, tag: '风管', on: 'partv' });
  for (let z = -105; z >= -151; z -= 6) out.push({ box: 'r3_steelOld', x: X0 + 0.55, y: y + 7.0, z, w: 0.96, h: 0.66, d: 0.08, tag: '风管法兰', on: 'partv' });
  // 维护门：加锈蚀钢门框 + 黄黑门边 + 门前检修平台（工具箱、梯子、锈灭火器、地堡灯）
  for (const dz of [-1.25, 1.25]) out.push({ box: 'r3_hazard', x: X0 + 0.22, y: y + 1.7, z: -146 + dz, w: 0.2, h: 3.4, d: 0.22, tag: '维护门', on: 'partv' });
  out.push({ box: 'r3_steelOld', x: X0 + 0.22, y: y + 3.55, z: -146, w: 0.24, h: 0.3, d: 2.7, tag: '维护门', on: 'partv' });
  out.push({ m: 'r2/fire_extinguisher_old_rusty_3d_scan', x: X0 + 0.3, y, z: -143.9, yaw: ROT.E, h: 0.6, tag: '检修平台', on: 'floor' });
  out.push({ m: 'r2/metal_toolbox', x: X0 + 0.45, y, z: -148.4, yaw: 1.2, w: 0.5, tag: '检修平台', on: 'floor' });
  out.push({ m: 'r2/wooden_ladder_02', x: X0 + 0.6, y, z: -150.6, yaw: ROT.E, h: 3.0, tag: '检修平台', on: 'floor' });
  for (const z of [-140, -152]) out.push({ m: 'r2/bunker_lamps', x: X0 + 0.22, y: y + 3.0, z, yaw: ROT.E, h: 0.3, tag: '地堡灯', on: 'wall' });
  out.push({ sign: '维护管廊 B6-W', sub: '检修时挂牌 · 双人作业', x: X0 + 0.07, y: y + 2.2, z: -142.6, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  light(out, X0 + 1.2, y + 3.4, -146, 0xffa060, 2.2, 7);
  floorZ(out, 'r3_hazard', X0 + 0.05, X0 + 1.05, -147.4, -147.2, y, { uv: 1 }); floorZ(out, 'r3_hazard', X0 + 0.05, X0 + 1.05, -144.8, -144.6, y, { uv: 1 });
  return { room, items: out };
}
// 墨渊折页门广场南端 = 「B7 墨渊前厅」（最后的人造层：封堵痕迹、废弃锅炉、值守补给、锈铁门与铁链、警报器）
export function planB7(y) {
  const out = []; const X0 = -15, X1 = 15, Z0 = -66, Z1 = -54.5, H = 8;
  const room = { name: 'B7 · 墨渊前厅（折页门广场南端，批次3）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H, doors: [{ wall: 'S', a: -1.3, b: 1.3, label: '书脊井维护梯厅金门' }], windows: [],
    keep: [], rooms: [['值守补给', -9.5, -57.5], ['废弃锅炉 · 封堵', 9.5, -58.5]], aisles: [{ label: '中轴（金门 → 折页门）', x0: -3.0, x1: 3.0, z0: -66, z1: -54.6 }] };
  // 西：值守补给（军用木箱 + 口粮 + 罐头 + 折叠凳 + 应急灯）
  out.push({ m: 'r2/military_wooden_crate', x: -9.6, y, z: -56.2, yaw: 0.1, w: 1.2, tag: '值守补给', on: 'floor', col: [1.2, 0.35, 0.5] });
  out.push({ m: 'r2/wooden_military_crate', x: -11.3, y, z: -56.4, yaw: -0.2, w: 0.9, tag: '值守补给', on: 'floor', col: [0.9, 0.4, 0.5] });
  out.push({ m: 'r2/long_life_food', x: -9.4, y: y + 0.35, z: -56.15, yaw: 0.3, w: 0.5, tag: '值守补给', on: 'shelf' });
  out.push({ m: 'r2/russian_food_cans_01', x: -11.2, y: y + 0.4, z: -56.4, yaw: 0.5, w: 0.35, tag: '值守补给', on: 'shelf' });
  out.push({ m: 'r2/folding_wooden_stool', x: -8.4, y, z: -57.6, yaw: 0.7, h: 0.45, tag: '值守补给', on: 'floor' });
  out.push({ m: 'r2/plastic_thermos', x: -8.9, y, z: -56.3, yaw: 0, h: 0.32, tag: '值守补给', on: 'floor' });
  // 东：废弃锅炉 ×2 + 水泥袋堆 + 喷漆罐（封堵痕迹）+ 大锤
  out.push({ m: 'r2/old_boiler', x: 10.8, y, z: -57.2, yaw: -0.3, h: 2.2, tag: '废弃锅炉', on: 'floor', col: [1.12, 2.2, 1.06] });
  out.push({ m: 'r2/donkey_boiler', x: 8.0, y, z: -61.8, yaw: 0.2, w: 2.4, tag: '废弃锅炉', on: 'floor', col: [2.4, 1.44, 0.9] });
  for (const [k, dy] of [[0, 0], [1, 0], [2, 0], [3, 0.16], [4, 0.16]]) out.push({ m: 'r2/cement_bag', x: 12.4 + (k % 3) * 0.62 - (k > 2 ? 0.3 : 0), y: y + dy, z: -60.4, yaw: 0.15 * k, w: 0.6, tag: '封堵堆料', on: 'shelf' });
  out.push({ m: 'r2/spray_paint_bottles', x: 11.6, y, z: -59.4, yaw: 0.4, h: 0.2, tag: '封堵堆料', on: 'floor' });
  out.push({ m: 'r2/sledgehammer_01', x: 13.6, y, z: -58.8, yaw: 0.8, rz: 1.35, h: 0.9, tag: '封堵堆料', on: 'shelf' });
  // 金门两侧：锈铁门板 + 铁链（被拆下的旧门）、警报器、锈应急灯
  out.push({ m: 'r2/steel_portal_rust_metal_door', x: -5.2, y, z: -55.0, yaw: 0.08, h: 2.6, tag: '旧门', on: 'floor' });
  out.push({ m: 'r2/iron_chain', x: -5.2, y: y + 1.3, z: -54.8, yaw: 0, h: 0.6, tag: '旧门', on: 'shelf' });
  out.push({ m: 'r2/classic_siren_with_2_speakers', x: 3.4, y: y + 4.6, z: Z1 - 0.1, yaw: Math.PI, h: 0.5, tag: 'K3', on: 'wall' });
  light(out, -9.6, y + 2.2, -57.0, 0xffb070, 4.0, 9); light(out, 10.0, y + 2.4, -58.6, 0xff8a50, 3.6, 9);
  // 批次4：截图里两侧全黑 → 墨渊用烛火（PLACEMENT §14）：值守处木提灯 ×2 + 中世纪烛台 ×2（中轴两侧）+ 锈双头应急灯（人造层最后的电灯）+ 中轴暖光
  for (const [x, z] of [[-9.0, -56.0], [-11.6, -56.6]]) out.push({ m: 'r2/wooden_lantern_01', x, y: y + (x < -10 ? 0.4 : 0.35), z, yaw: 0.3, h: 0.36, tag: '值守补给', on: 'shelf' });
  for (const sx of [-1, 1]) { out.push({ m: 'r2/medieval_candelabra_free_download', x: sx * 3.8, y, z: -57.2, yaw: 0, h: 1.6, tag: '烛台', on: 'floor', col: [0.5, 1.6, 0.5] }); light(out, sx * 3.8, y + 1.9, -57.2, 0xffb060, 2.6, 7); }
  for (const x of [-7.0, 7.0]) out.push({ m: 'r2/rusty_twin_spot_emergency_light', x, y: y + 3.2, z: Z1 - 0.32, yaw: Math.PI, h: 0.3, tag: 'K3', on: 'wall' });
  light(out, 0, y + 3.5, -60.0, 0xffd090, 3.0, 12); light(out, 12.4, y + 2.0, -60.6, 0xff9a60, 2.2, 6);
  return { room, items: out };
}


// ================= 批次4 · 3F 中 · 医务室（floor3 区，x −9.3…9.3，z −119.6…−92.4，层高 5.4） =================
// 逻辑：候诊 → 分诊 → 诊室 → 观察病房 / 处置；锚点（理智值检测椅+监测屏、理智值分级表、视力表、药柜+药品清单、病历板墙、净化舱、玻璃药柜、洗手台、地毯）一律不动
export function planMedical(y) {
  const out = []; const H = 5.4, X0 = -9.3, X1 = 9.3, Z0 = -119.6, Z1 = -92.4;
  const room = { name: '3F 中 · 医务室（批次4）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'S', a: -2.3, b: 2.3, label: '入口（电梯厅）' }, { wall: 'W', a: -99.1, b: -95.9, label: '→ 办公区' }, { wall: 'E', a: -99.1, b: -95.9, label: '→ 实验室' }], windows: [],
    keep: [{ label: '理智值检测椅（锚点）', x: 0.3, z: -110.1, w: 1.9, d: 2.0 }, { label: '药柜（锚点）', x: -8.6, z: -114, w: 0.6, d: 1.0 }, { label: '净化舱（锚点）', x: 4.6, z: -116.5, w: 2.0, d: 2.0 }, { label: '玻璃药柜（锚点）', x: 8.5, z: -112, w: 0.5, d: 1.7 }, { label: '洗手台（锚点）', x: 2.5, z: -119.3, w: 1.0, d: 0.6 }, { label: '病历板墙（锚点）', x: -6.4, z: -94.1, w: 6.0, d: 0.3 }],
    rooms: [['候诊', 5.4, -93.6], ['分诊台', 5.0, -102.4], ['诊室', 6.0, -109.6], ['观察病房', -6.2, -105.6], ['理智值检测', 0, -106.0], ['处置 · 净化', 0, -116.0]],
    aisles: [{ label: '东西主通道', x0: X0, x1: X1, z0: -99.3, z1: -95.7 }, { label: '入口通道', x0: -2.2, x1: 2.2, z0: -95.7, z1: Z1 }, { label: '检测区通道', x0: -2.6, x1: -0.9, z0: -116.0, z1: -99.6 }] };
  const F = (lab, x, z, w, d, h = 1) => out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, h, d], col: [w, h, d], tag: '原锚点', on: 'floor' });
  F('理智值检测椅', 0.3, -110.1, 1.9, 2.0); F('药柜', -8.6, -114, 0.6, 1.0, 1.8); F('净化舱', 4.6, -116.5, 2.0, 2.0, 2.7); F('玻璃药柜', 8.5, -112, 0.5, 1.7, 2.0); F('洗手台', 2.5, -119.3, 1.0, 0.6, 0.9);
  // —— 地面：医务区整体铺浅色水磨石（原 3F 地毯在医务区不合适），通道磨损 ——
  floorZ(out, 'r3_corr', X0, X1, Z0, -92.3, y, { uv: 1.6 });
  // —— 隔断：观察病房（玻璃，西）、诊室（玻璃，东）——
  partition(out, 'z', -3.2, -99.6, -111.4, y, { glass: true, doors: [{ at: -101.0, w: 1.2, s: 1, sign: '观察病房', sub: '探视请登记 · 保持安静' }] });
  partition(out, 'x', -99.6, X0, -3.2, y, { glass: true });
  partition(out, 'x', -111.4, X0, -3.2, y, { up: 'dz_damaskGreen' });
  partition(out, 'x', -104.8, 2.6, X1, y, { glass: true, doors: [{ at: 3.6, s: -1, sign: '诊室', sub: '叫号就诊' }] });
  partition(out, 'z', 2.6, -104.8, -110.8, y, { glass: true });
  partition(out, 'x', -110.8, 2.6, X1, y, { up: 'dz_damaskGreen' });
  // —— ① 候诊（南墙下，面朝北）：绿色软椅 ×5、圆茶几、盆栽、告示板、挂钟 ——
  for (let k = 0; k < 5; k++) out.push({ m: 'r2/greenchair_01', x: 3.3 + k * 1.05, y, z: -93.0, yaw: ROT.N + (hash(k, 3) - 0.5) * 0.12, h: 1.0, tag: '候诊', on: 'floor', col: [0.62, 1.0, 0.6] });
  out.push({ m: 'r2/coffee_table_round_01', x: 5.4, y, z: -94.4, yaw: 0, h: 0.5, tag: '候诊', on: 'floor', col: [0.7, 0.5, 0.7] });
  out.push({ m: 'r2/cc0_newspaper_stack_ready_to_unity_hdrp', x: 5.3, y: y + 0.5, z: -94.4, yaw: 0.4, w: 0.3, tag: '候诊', on: 'shelf' });
  out.push({ m: 'r2/potted_plant_04', x: 8.75, y, z: -93.0, yaw: 0, h: 1.3, tag: '候诊', on: 'floor' });
  out.push({ m: 'r2/notice_board_foam', x: X1 - 0.15, y: y + 1.6, z: -101.8, yaw: ROT.W, w: 1.0, tag: '候诊', on: 'wall' });
  out.push({ m: 'r2/old_wall_clock', x: 5.4, y: y + 2.55, z: Z1 - 0.06, yaw: ROT.N, h: 0.45, tag: 'K3', on: 'wall' });
  // —— ② 分诊台（护士坐北面朝南，面对通道）+ 患者椅 + 身后药品柜 ——
  workstation(out, 5.0, -101.1, y, Math.PI, 2, { tag: '分诊台', chair: 'r2/old_computer_chair', typewriter: false });
  out.push({ m: 'r2/greenchair_01', x: 5.0, y, z: -100.0, yaw: ROT.N, h: 1.0, tag: '分诊台', on: 'floor', col: [0.6, 1.0, 0.58] });
  for (const x of [6.9, 7.95]) out.push({ m: 'r2/painted_wooden_cabinet', x, y, z: -104.35, yaw: 0, h: 0.95, tag: '分诊台', on: 'floor', col: [0.98, 0.95, 0.5] });
  out.push({ m: 'r2/medical_box', x: 6.9, y: y + 0.96, z: -104.35, yaw: 0.1, w: 0.4, tag: '分诊台', on: 'shelf' });
  out.push({ m: 'r2/plastic_thermos', x: 7.9, y: y + 0.96, z: -104.35, yaw: 0, h: 0.3, tag: '分诊台', on: 'shelf' });
  // —— ③ 诊室：医生写字台（坐东面西）+ 患者椅、检查床 + 屏风 + 床旁推车、视力表（锚点）在患者正前方 ——
  workstation(out, 7.6, -107.6, y, ROT.E, 4, { tag: '诊室', chair: 'r2/old_computer_chair', typewriter: false });
  out.push({ m: 'r2/greenchair_01', x: 6.45, y, z: -107.9, yaw: ROT.E, h: 1.0, tag: '诊室', on: 'floor', col: [0.6, 1.0, 0.6] });
  out.push({ m: 'r2/simple_hospital_bed', x: 3.65, y, z: -108.2, yaw: 0, d: 2.05, tag: '诊室', on: 'floor', col: [0.95, 0.8, 2.1] });
  out.push({ m: 'r2/mid_century_mahogany_folding_screen', x: 4.75, y, z: -106.2, yaw: 0, h: 1.75, tag: '诊室', on: 'floor' });
  out.push({ m: 'r2/adjustable_bedside_table', x: 4.7, y, z: -109.9, yaw: ROT.W, h: 1.0, tag: '诊室', on: 'floor' });
  out.push({ m: 'r2/medical_tape', x: 4.7, y: y + 1.0, z: -109.9, yaw: 0.3, w: 0.08, tag: '诊室', on: 'shelf' });
  // —— ④ 观察病房：3 张旧铁病床（床头靠西墙）+ 床头柜 + 床尾小桌、屏风隔开、轮椅、拐杖 ——
  for (const [k, z] of [-101.5, -104.8, -108.1].entries()) {
    out.push({ m: 'r2/old_hospital_bed_pbr_gr', x: X0 + 1.1, y, z, yaw: ROT.W, fit: [1.2, 1.0, 2.05], size: [1.2, 1.0, 2.05], tag: '病房', on: 'floor', col: [2.0, 0.9, 0.95] });
    out.push({ m: 'r2/painted_wooden_nightstand', x: X0 + 0.3, y, z: z - 0.85, yaw: ROT.E, h: 0.62, tag: '病房', on: 'floor', col: [0.45, 0.62, 0.45] });
    if (k !== 1) out.push({ m: 'r2/coffee_mug', x: X0 + 0.3, y: y + 0.62, z: z - 0.8, yaw: 1, h: 0.095, tag: '病房', on: 'shelf' });
    if (k === 0) out.push({ m: 'r2/food_apple_01', x: X0 + 0.32, y: y + 0.62, z: z - 0.95, yaw: 0, h: 0.08, tag: '病房', on: 'shelf' });
  }
  out.push({ m: 'r2/mid_century_mahogany_folding_screen', x: -7.6, y, z: -106.45, yaw: 0.05, h: 1.75, tag: '病房', on: 'floor' });
  out.push({ m: 'r2/adjustable_bedside_table', x: -6.65, y, z: -101.5, yaw: 0, h: 1.0, tag: '病房', on: 'floor' });
  out.push({ m: 'r2/wheelchair_01', x: -4.3, y, z: -110.3, yaw: ROT.E + 0.3, h: 0.95, tag: '病房', on: 'floor', col: [0.65, 0.95, 0.9] });
  out.push({ m: 'r2/vintage_crutches_01', x: X0 + 0.15, y, z: -110.7, yaw: ROT.E, rx: -0.12, h: 1.3, tag: '病房', on: 'shelf' });
  // —— ⑤ 处置 · 净化（北）：员工更衣柜、超声仪（里间，较现代）、器械推车、药品柜 ——
  for (const x of [-7.5, -6.3]) out.push({ m: 'r2/locker_equipment', x, y, z: Z0 + 0.35, yaw: 0, h: 1.9, tag: '处置', on: 'floor', col: [1.1, 1.9, 0.55] });
  out.push({ m: 'r2/samsung_sonoace_ultrasound_machine', x: 7.6, y, z: -118.7, yaw: ROT.N + 0.3, h: 1.45, tag: '处置', on: 'floor', col: [0.6, 1.45, 0.9] });
  out.push({ m: 'storage_cart', x: -4.6, y, z: -116.4, yaw: 0.1, w: 1.0, tag: '处置', on: 'floor', col: [1.0, 1.0, 0.7] });
  out.push({ m: 'r2/medical_box', x: -4.8, y: y + 0.92, z: -116.4, yaw: 0.2, w: 0.4, tag: '处置', on: 'shelf' });
  out.push({ m: 'r2/medical_tape', x: -4.3, y: y + 0.92, z: -116.3, yaw: 0.4, w: 0.08, tag: '处置', on: 'shelf' });
  out.push({ m: 'r2/painted_wooden_cabinet', x: -2.4, y, z: Z0 + 0.3, yaw: 0, h: 0.95, tag: '处置', on: 'floor', col: [0.98, 0.95, 0.5] });
  // —— K3 / 照明：入口灭火器、出口标识、烟感、监控、灯槽（冷白）+ 补光 ——
  out.push({ m: 'r2/fire_extinguisher', x: -2.75, y, z: -92.75, yaw: 0, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/cctv_camera', x: X1 - 0.35, y: y + 3.8, z: Z1 - 0.35, yaw: -Math.PI * 0.75, h: 0.3, tag: 'K3', on: 'wall' });
  smoke(out, y, H, [[-6, -103], [-6, -109], [6, -102], [6, -108], [0, -114], [0, -97]]);
  for (const [x, z] of [[-6.2, -101.6], [-6.2, -104.9], [-6.2, -108.2], [6.0, -106.6], [6.0, -109.4], [5.4, -94.0], [-5.0, -116.4], [6.0, -116.4]]) troffer(out, x, z, y, H, Math.PI / 2, 1.2, { cold: true });
  for (const [x, z, i] of [[-6.2, -105, 2.4], [6.0, -108, 2.2], [5.4, -94.6, 2.0], [5.0, -102, 2.0], [-4.5, -116.5, 1.8]]) light(out, x, y + 3.2, z, 0xeef4ff, i, 7);
  wear(out, -2.0, 2.0, -99.0, -93.0, y); wear(out, -9.0, 9.0, -98.0, -97.0, y);
  return { room, items: out };
}


// ================= 批次4 · 职工宿舍三号楼：1F 大堂 + 2F 公共活动室（surface 区，x 53.2…62，z 12.3…28.2，F2 = 4.6） =================
// 逻辑：大门（西）→ 门厅（伞架/衣帽架）→ 宿管窗口（南，排队带留空）/ 信箱墙（西南）→ 会客休息角（北，沙发组朝南）→ 楼梯（北）→ 走廊（东）
// 2F：楼梯口 → 电视角（沙发朝西看墙上新闻屏）→ 棋牌桌（南）→ 书架 + 飞镖靶（南墙）。锚点（管理条例、分配表、宿管、贩卖机、信箱墙、回收箱、新闻屏）不动
export function planDorm(y) {
  const out = []; const X0 = 53.2, X1 = 62.0, Z0 = 12.0, Z1 = 28.1, F2 = y + 4.6, H = 4.3;
  const room = { name: '宿舍三号楼 · 1F 大堂（批次4）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'W', a: 18.4, b: 21.6, label: '大门' }, { wall: 'E', a: Z0, b: Z1, label: '→ 走廊（开敞）' }], windows: [],
    keep: [{ label: '宿管窗口台（锚点）', x: 57.5, z: 12.3, w: 5.2, d: 0.6 }, { label: '贩卖机（锚点）', x: 61.3, z: 13.2, w: 0.8, d: 0.75 }, { label: '信箱墙（锚点）', x: 53.45, z: 16.0, w: 0.4, d: 4.2 }, { label: '楼梯', x: 57.7, z: 27.0, w: 7.8, d: 1.7 }],
    rooms: [['门厅', 54.6, 20.0], ['宿管窗口排队带', 57.5, 13.8], ['会客休息角', 57.4, 23.8]],
    aisles: [{ label: '大门 → 走廊', x0: X0, x1: X1, z0: 18.6, z1: 21.4 }, { label: '窗口前排队带', x0: 55.0, x1: 60.0, z0: 12.6, z1: 14.4 }, { label: '楼梯口', x0: 53.8, x1: 55.2, z0: 21.4, z1: 26.0 }] };
  const F = (lab, x, z, w, d, yy = y, h = 1) => out.push({ fixed: true, m: '固定:' + lab, x, y: yy, z, yaw: 0, size: [w, h, d], col: [w, h, d], tag: '原锚点', on: 'floor' });
  F('宿管窗口台', 57.5, 12.3, 5.2, 0.6); F('贩卖机', 61.3, 13.2, 0.8, 0.75, y, 1.9); F('信箱墙', 53.45, 16.0, 0.4, 4.2, y, 1.6);
  // —— 1F 门厅：伞架 + 衣帽架（门两侧）、门垫 ——
  out.push({ m: 'r2/victorian_umbrella_stand', x: 53.75, y, z: 18.35, yaw: ROT.E, h: 0.75, tag: '门厅', on: 'floor' });
  out.push({ m: 'r2/coat_rack', x: 61.5, y, z: 24.6, yaw: 0, h: 1.8, tag: '门厅', on: 'floor', col: [0.5, 1.8, 0.5] });
  rug(out, 'dz_rugNavy', 54.4, y, 20.0, 1.6, 2.6);
  // —— 会客休息角（北，楼梯南侧）：三人沙发朝南 + 两把扶手椅 + 茶几 + 地毯 + 落地灯位补光 ——
  rug(out, 'dz_rugRed', 58.0, y, 23.7, 3.6, 2.6);
  out.push({ m: 'r2/sofa_02', x: 58.0, y, z: 25.15, yaw: ROT.S + Math.PI, w: 2.0, tag: '会客休息角', on: 'floor', col: [2.0, 0.8, 0.85] });
  for (const sx of [-1, 1]) out.push({ m: 'r2/armchair_01', x: 58.0 + sx * 1.75, y, z: 23.3, yaw: ROT.S + sx * (-Math.PI / 2 + 0.35) , h: 1.0, tag: '会客休息角', on: 'floor', col: [0.8, 1.0, 0.8] });
  out.push({ m: 'r2/industrial_coffee_table', x: 58.0, y, z: 23.55, yaw: 0, w: 1.1, tag: '会客休息角', on: 'floor', col: [1.1, 0.45, 0.6] });
  out.push({ m: 'r2/cc0_newspaper_stack_ready_to_unity_hdrp', x: 57.7, y: y + 0.45, z: 23.5, yaw: 0.5, w: 0.3, tag: '会客休息角', on: 'shelf' });
  out.push({ m: 'r2/coffee_mug', x: 58.3, y: y + 0.45, z: 23.65, yaw: 1.2, h: 0.095, tag: '会客休息角', on: 'shelf' });
  // —— 窗口排队带两侧：长椅（背靠贩卖机北侧 / 西墙信箱北）、挂钟（窗口上方）、告示板 ——
  out.push({ m: 'r2/hallway_bench', x: 61.55, y, z: 16.2, yaw: ROT.W, d: 1.5, tag: '候办', on: 'floor', col: [0.45, 0.9, 1.6] });
  out.push({ m: 'r2/old_wall_clock', x: 57.5, y: y + 2.75, z: 12.6, yaw: 0, h: 0.45, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/notice_board_foam', x: 61.85, y: y + 1.6, z: 22.4, yaw: ROT.W, w: 1.0, tag: '候办', on: 'wall' });
  out.push({ m: 'r2/fire_extinguisher', x: 61.7, y, z: 26.2, yaw: ROT.W, h: 0.58, tag: 'K3', on: 'floor' });
  globe(out, 57.5, 20.0, y, 4.3, 3.2, { r: 0.22 }); globe(out, 58.0, 23.7, y, 4.3, 3.0, { r: 0.18 });
  light(out, 58.0, y + 2.6, 23.7, 0xffd8a8, 2.4, 7); light(out, 57.5, y + 2.8, 15.0, 0xffe0b8, 2.0, 7);
  wear(out, X0 + 0.5, X1, 19.3, 20.7, y);
  // —— 批次6 加密（之前 surface 区 R3 陈设整批没实例化，本批修复后补齐）——
  // ① 门厅主通道：水磨石走道带 + 石材收边（门 → 走廊）
  floorZ(out, 'r3_check', X0 + 0.05, X1, 18.7, 21.3, y, { border: 0.18 });
  // ② 候办区（窗口北侧）：两条长椅面朝窗口、包裹架（西南角）、热水台（东侧）
  for (const x of [56.4, 58.7]) out.push({ m: 'r2/hallway_bench', x, y, z: 16.5, yaw: ROT.S, d: 1.5, tag: '候办', on: 'floor', col: [1.6, 0.9, 0.45] });
  out.push({ m: 'r2/steel_frame_shelves_02', x: 54.25, y, z: 12.4, yaw: 0, h: 1.9, tag: '包裹架', on: 'floor', col: [0.55, 1.9, 0.48] });
  for (const [dy, m, sz] of [[0.05, 'r2/cardboard_transport_shipping_box', { w: 0.42 }], [0.62, 'r2/set_of_cardboard_boxes', { w: 0.45 }], [1.2, 'r2/cardboard_transport_shipping_box', { w: 0.36 }]]) out.push({ m, x: 54.25, y: y + dy, z: 12.4, yaw: 0.1 + dy, ...sz, tag: '包裹架', on: 'shelf' });
  out.push({ m: 'r2/small_wooden_table_01', x: 61.45, y, z: 17.95, yaw: ROT.W, h: 0.72, tag: '热水台', on: 'floor', col: [0.6, 0.72, 1.2] });
  out.push({ m: 'r2/modified_thermos', x: 61.5, y: y + 0.72, z: 17.6, yaw: 0, h: 0.32, tag: '热水台', on: 'desk' });
  out.push({ m: 'r2/modified_thermos', x: 61.55, y: y + 0.72, z: 17.95, yaw: 1, h: 0.32, tag: '热水台', on: 'desk' });
  for (const dz of [0.25, 0.4]) out.push({ m: 'r2/coffee_mug', x: 61.35, y: y + 0.72, z: 17.95 + dz, yaw: dz * 5, h: 0.095, tag: '热水台', on: 'desk' });
  // ③ 会客角补：沙发两端边几 + 台灯、西墙暖气片 + 绿植、报刊架
  for (const sx of [-1, 1]) { out.push({ m: 'r2/side_table_01', x: 58.0 + sx * 1.35, y, z: 25.35, yaw: 0, h: 0.55, tag: '会客休息角', on: 'floor', col: [0.45, 0.55, 0.45] });
    out.push({ m: 'r2/victorian_desk_lamp', x: 58.0 + sx * 1.35, y: y + 0.55, z: 25.35, yaw: 0, h: 0.5, tag: '会客休息角', on: 'desk' }); light(out, 58.0 + sx * 1.35, y + 1.1, 25.2, 0xffc88a, 0.9, 3.5); }
  out.push({ m: 'r2/old_radiator', x: X0 + 0.12, y: y + 0.12, z: 23.6, yaw: Math.PI / 2, w: 1.2, tag: 'K3', on: 'wall' });
  out.push({ m: 'r2/potted_plant_01', x: 61.5, y, z: 23.2, yaw: 0, h: 1.2, tag: '绿植', on: 'floor' });
  out.push({ m: 'r2/wooden_display_shelves_01', x: 60.7, y, z: 25.6, yaw: Math.PI, h: 1.2, tag: '报刊架', on: 'floor', col: [0.9, 1.2, 0.4] });
  // ④ 挂图（IMAGE-PLAN）：西墙信箱上方员工公告栏（软木）、会客角西墙 N11 座钟复刻品配图（金框）、窗口上方局旗
  pic(out, 'textures/b07/B07_员工公告栏.png', X0 + 0.03, y + 2.45, 16.0, ROT.E, 1.1, 0.82, 'cork', { cork: [1.25, 0.95] });
  pic(out, 'textures/emblems/N11.jpg', X0 + 0.03, y + 1.75, 24.6, ROT.E, 0.7, 0.7, 'gold');
  pic(out, 'textures/b05/B05_宿舍分配表.png', X0 + 0.03, y + 1.6, 22.6, ROT.E, 0.45, 0.6, 'wood');
  // ⑤ 灯光层次：西墙铜壁灯 ×3、候办区与门厅补光
  for (const z of [14.2, 21.9, 25.6]) sconce(out, X0 + 0.02, y + 2.2, z, ROT.E);
  light(out, 57.5, y + 2.7, 16.8, 0xffe0b8, 2.2, 7); light(out, 55.0, y + 2.6, 20.0, 0xffd8a8, 1.6, 6); light(out, 60.8, y + 2.6, 21.0, 0xffd8a8, 1.4, 6);
  return { room, items: out };
}

export function planDorm2(y0) {
  const out = []; const y = y0, X0 = 53.2, X1 = 62.0, Z0 = 12.0, Z1 = 28.1, F2 = y;
  const room = { name: '宿舍三号楼 · 2F 公共活动室（批次4）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H: 4.3,
    doors: [{ wall: 'E', a: Z0, b: Z1, label: '→ 2F 走廊（开敞）' }], windows: [],
    keep: [{ label: '楼梯洞口', x: 57.8, z: 27.0, w: 7.6, d: 2.0 }], rooms: [['电视角', 56.8, 20.0], ['棋牌桌', 57.5, 14.4]],
    aisles: [{ label: '楼梯口 → 走廊', x0: 59.6, x1: X1, z0: 24.0, z1: 26.0 }, { label: '活动室东侧通行', x0: 60.6, x1: X1, z0: Z0, z1: 26.0 }] };
  // —— 2F 公共活动室：电视角（沙发朝西看新闻屏 x 53.4）+ 棋牌桌 ×2（南）+ 书架 + 飞镖靶（南墙）+ 摇椅 ——
  out.push({ fixed: true, m: '固定:新闻屏', x: 53.45, y: F2, z: 20, yaw: 0, size: [0.2, 1, 1.8], tag: '原锚点', on: 'floor' });
  rug(out, 'dz_rugNavy', 56.6, F2, 20.0, 3.0, 3.4);
  out.push({ m: 'r2/sofa_02', x: 58.0, y: F2, z: 20.0, yaw: ROT.W, w: 2.0, tag: '电视角', on: 'floor', col: [0.85, 0.8, 2.0] });
  out.push({ m: 'r2/industrial_coffee_table', x: 56.5, y: F2, z: 20.0, yaw: Math.PI / 2, w: 1.1, tag: '电视角', on: 'floor', col: [0.6, 0.45, 1.1] });
  out.push({ m: 'r2/chess_set', x: 56.5, y: F2 + 0.45, z: 19.8, yaw: 0.3, w: 0.35, tag: '电视角', on: 'shelf' });
  out.push({ m: 'r2/rockingchair_01', x: 56.6, y: F2, z: 22.3, yaw: ROT.W - 0.6, h: 1.0, tag: '电视角', on: 'floor', col: [0.7, 1.0, 1.0] });
  out.push({ m: 'r2/armchair_01', x: 56.6, y: F2, z: 17.6, yaw: ROT.W + 0.6, h: 1.0, tag: '电视角', on: 'floor', col: [0.8, 1.0, 0.8] });
  for (const [k, x] of [55.6, 59.4].entries()) { out.push({ m: 'r2/gallinera_table', x, y: F2, z: 14.4, yaw: 0, w: 1.0, tag: '棋牌桌', on: 'floor', col: [1.0, 0.75, 1.0] });
    for (const [dx, dz, yw] of [[0, 0.85, Math.PI], [0, -0.85, 0], [0.85, 0, -Math.PI / 2]]) out.push({ m: 'r2/gallinera_chair', x: x + dx, y: F2, z: 14.4 + dz, yaw: yw + (hash(x, dz) - 0.5) * 0.3, h: 0.95, tag: '棋牌桌', on: 'floor', col: [0.5, 0.95, 0.5] });
    out.push({ m: k ? 'r2/chess_set' : 'r2/coffee_mug', x: x - 0.1, y: F2 + 0.75, z: 14.4, yaw: 0.2, ...(k ? { w: 0.35 } : { h: 0.095 }), tag: '棋牌桌', on: 'shelf' }); }
  out.push({ m: 'r2/book_cabinet_vintage', x: 57.5, y: F2, z: Z0 + 0.3, yaw: 0, h: 2.0, tag: '书架', on: 'floor', col: [1.2, 2.0, 0.45] });
  out.push({ m: 'r2/dartboard', x: 61.0, y: F2 + 1.73, z: Z0 + 0.05, yaw: 0, h: 0.45, tag: '飞镖', on: 'wall' });
  out.push({ m: 'r2/potted_plant_04', x: 53.9, y: F2, z: 13.1, yaw: 0, h: 1.3, tag: '绿植', on: 'floor' });
  globe(out, 56.6, 20.0, F2, 4.3, 3.0, { r: 0.2 }); globe(out, 57.5, 14.4, F2, 4.3, 3.0, { r: 0.2 });
  light(out, 57.0, F2 + 2.6, 19.5, 0xffd8a8, 2.2, 7); light(out, 57.5, F2 + 2.6, 14.4, 0xffd8a8, 2.0, 7);
  // —— 批次6 加密：西墙书柜 ×2、北侧阅读长桌 4 椅、棋牌区地毯、南墙暖气、海报、壁灯 ——
  for (const z of [15.6, 16.85]) out.push({ m: 'r2/book_cabinet_vintage', x: X0 + 0.26, y: F2, z, yaw: ROT.E, h: 2.0, tag: '书架', on: 'floor', col: [1.2, 2.0, 0.45] });
  rug(out, 'dz_rugRed', 57.5, F2, 14.4, 6.2, 2.7);
  out.push({ m: 'r2/woodentable_01', x: 56.4, y: F2, z: 24.4, yaw: 0, fit: [1.8, 0.78, 0.9], tag: '阅读桌', on: 'floor', col: [1.8, 0.78, 0.9] });
  for (const dx of [-0.45, 0.45]) for (const sd of [-1, 1]) out.push({ m: 'r2/dining_chair_02', x: 56.4 + dx, y: F2, z: 24.4 + sd * 0.78, yaw: sd > 0 ? Math.PI : 0, h: 0.95, tag: '阅读桌', on: 'floor' });
  out.push({ m: 'r2/bankers_lamp', x: 56.0, y: F2 + 0.78, z: 24.3, yaw: 0, h: 0.4, tag: '阅读桌', on: 'desk' });
  out.push({ m: 'r2/several_folders', x: 56.8, y: F2 + 0.78, z: 24.5, yaw: 0.4, h: 0.3, tag: '阅读桌', on: 'desk' });
  light(out, 56.4, F2 + 1.9, 24.4, 0xffd8a8, 1.2, 4);
  out.push({ m: 'r2/old_radiator', x: 59.9, y: F2 + 0.12, z: Z0 + 0.12, yaw: 0, w: 1.2, tag: 'K3', on: 'wall' });
  pic(out, 'textures/b01/B01_07_海报_叙事高考.png', X0 + 0.03, F2 + 1.7, 13.4, ROT.E, 0.6, 0.9, 'black');
  pic(out, 'textures/b01/B01_09_海报_畸变规避.png', X0 + 0.03, F2 + 1.7, 23.6, ROT.E, 0.6, 0.9, 'black');
  pic(out, 'textures/emblems/N10.jpg', 55.6, F2 + 1.9, Z0 + 0.03, 0, 0.6, 0.6, 'wood');
  for (const z of [18.0, 22.0]) sconce(out, X0 + 0.02, F2 + 2.2, z, ROT.E);
  out.push({ m: 'r2/potted_plant_04', x: 59.15, y: F2, z: 25.5, yaw: 0, h: 1.3, tag: '绿植', on: 'floor' });

  return { room, items: out };
}


// ================= 批次4 · B2 审讯室 + 观察间（interrogation 区，y −18，x −12.4…−2.55，z −106.8…−95.2） =================
// 逻辑：审讯室（西）＝ 1 桌 2 凳、桌正上方唯一一盏链吊灯、墙上挂钟正对受审者、录音机/烟灰缸/打火机/镣铐；观察间（东）＝ 两把椅子背对写字台、面朝单向玻璃，侧墙录音/监看台、档案柜、衣帽架
// 锚点：审讯桌（含划痕贴花）、单向玻璃隔墙、观察间写字台（审讯笔录）、东南录音机柜 —— 不动
export function planInterrogation(y) {
  const out = []; const X0 = -12.4, X1 = -2.55, Z0 = -106.8, Z1 = -95.2, H = 4.2;
  const room = { name: 'B2 · 审讯室 / 观察间（批次4）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'E', a: -102.5, b: -99.5, label: '门（走廊）' }], windows: [],
    keep: [{ label: '单向玻璃隔墙', x: -7.4, z: -101, w: 0.3, d: 11.6 }],
    rooms: [['审讯室', -10.0, -97.0], ['观察间', -4.6, -97.0]], aisles: [{ label: '门 → 观察间', x0: -3.7, x1: X1, z0: -102.4, z1: -99.6 }] };
  const F = (lab, x, z, w, d, h = 1) => out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, h, d], col: [w, h, d], tag: '原锚点', on: 'floor' });
  F('单向玻璃墙北段', -7.4, -97.1, 0.3, 3.8, H); F('单向玻璃墙南段', -7.4, -104.9, 0.3, 3.8, H); F('玻璃窗下墙', -7.4, -101, 0.3, 4, 0.9);
  F('审讯桌', -10, -101, 1.6, 0.9, 0.8); F('受审凳', -10, -100.1, 0.45, 0.45, 0.45); F('审讯员凳', -10, -101.9, 0.45, 0.45, 0.45); F('观察桌', -5, -101, 2.4, 0.8, 0.8); F('录音机柜', -3.0, -106.3, 0.8, 0.4, 1.6);
  // —— 审讯室：桌上（录音机、烟灰缸满、打火机+烟盒、镣铐）、正上方链吊灯、挂钟（北墙，正对受审者）、墙角第二把凳、铁链挂钩 ——
  const T = y + 0.79;
  out.push({ m: 'r2/cassette_player', x: -10.55, y: T, z: -101.25, yaw: 0.2, w: 0.3, tag: '审讯桌', on: 'desk' });
  out.push({ m: 'r2/ptish_exceptionally_full_ashtray', x: -9.45, y: T, z: -101.2, yaw: 0, w: 0.16, tag: '审讯桌', on: 'desk' });
  out.push({ m: 'r2/vintage_lighter', x: -9.75, y: T, z: -101.32, yaw: 0.9, h: 0.06, tag: '审讯桌', on: 'desk' });
  out.push({ m: 'r2/cigarette_case', x: -9.55, y: T, z: -100.9, yaw: -0.4, w: 0.1, tag: '审讯桌', on: 'desk' });
  out.push({ m: 'r2/rusted_chain_shackles', x: -10.2, y: T, z: -100.7, yaw: 0.3, w: 0.35, tag: '审讯桌', on: 'desk' });
  pendant(out, -10, -101, y, H);
  // 批次6：北端隔出 B2-07 羁押室（钢板墙 + 门），挂钟移到羁押室隔墙南面（仍正对受审者）
  partition(out, 'x', -104.0, X0, -7.55, y, { up: 'r3_steelGrey', doors: [{ at: -11.4, w: 0.9, s: -1 }] });
  out.push({ m: 'r2/1950s_wall_clock', x: -9.6, y: y + 2.35, z: -104.0 + 0.08, yaw: 0, h: 0.4, tag: 'K3', on: 'wall' });
  // 批次13：羁押室隔墙南面「羁押登记」软木板：江戾 / 秦骁通缉档案（IMAGE-PLAN 未用 → B2 羁押登记墙）+ 铜牌
  out.push({ box: 'dz_cork', x: -8.5, y: y + 1.55, z: -104.0 + 0.07, w: 1.2, h: 0.92, d: 0.025, tag: '羁押登记', on: 'partv' }); out.push({ box: 'dz_wain2', x: -8.5, y: y + 1.55, z: -104.0 + 0.055, w: 1.26, h: 0.98, d: 0.02, tag: '羁押登记', on: 'partv' });
  pic(out, 'textures/archives/jiangli.jpg', -8.8, y + 1.55, -104.0 + 0.085, 0, 0.4, 0.711, 'none', { tag: '羁押登记' });
  pic(out, 'textures/archives/qinxiao.jpg', -8.2, y + 1.55, -104.0 + 0.085, 0, 0.4, 0.711, 'none', { tag: '羁押登记' });
  out.push({ sign: '羁押登记', sub: 'A 级在逃 · 见即上报', x: -8.5, y: y + 2.12, z: -104.0 + 0.09, yaw: 0, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
  pic(out, 'textures/b03/B03_羁押室门牌.png', -10.55, y + 1.65, -104.0 + 0.07, 0, 0.32, 0.32, 'none');
  out.push({ box: 'r3_steelOld', x: -9.4, y: y + 0.45, z: -106.5, w: 2.2, h: 0.06, d: 0.5, tag: '羁押室', on: 'partv' });
  for (const dx of [-1.0, 1.0]) out.push({ box: 'r3_steelOld', x: -9.4 + dx, y: y + 0.21, z: -106.5, w: 0.06, h: 0.42, d: 0.45, tag: '羁押室', on: 'partv' });
  out.push({ fixed: true, m: '固定:羁押室钢凳', x: -9.4, y, z: -106.5, yaw: 0, size: [2.2, 0.48, 0.5], col: [2.2, 0.48, 0.5], tag: '羁押室', on: 'floor' });
  out.push({ m: 'r2/barrel_03', x: -8.05, y, z: -106.4, yaw: 0, h: 0.5, tag: '羁押室', on: 'floor', col: [0.4, 0.5, 0.4] });
  troffer(out, -10.0, -105.4, y, H, 0, 1.0, { cold: true });
  // 批次6：审讯室南端证物暂存（钢架 ×2 + 证物箱）、西墙嫌犯组织图（N07）+ 通缉档案（秦骁）
  for (const x of [-11.75, -11.05]) { out.push({ m: 'r2/steel_frame_shelves_02', x, y, z: Z1 - 0.3, yaw: Math.PI, h: 1.9, tag: '证物暂存', on: 'floor', col: [0.55, 1.9, 0.48] });
    for (const [dy, m, sz] of [[0.05, 'r2/cardboard_transport_shipping_box', { w: 0.42 }], [0.62, 'r2/old_paper_cardboard_boxes', { w: 0.45 }], [1.2, 'r2/cardboard_transport_shipping_box', { w: 0.38 }]]) out.push({ m, x, y: y + dy, z: Z1 - 0.3, yaw: x + dy, ...sz, tag: '证物暂存', on: 'shelf' }); }
  pic(out, 'textures/emblems/N07.jpg', X0 + 0.03, y + 1.75, -98.4, ROT.E, 0.6, 0.6, 'cork', { cork: [0.95, 0.8] });
  pic(out, 'textures/archives/qinxiao.jpg', X0 + 0.03, y + 1.7, -97.2, ROT.E, 0.45, 0.8, 'black');
  floorZ(out, 'r3_epoxy', X0, -7.6, -103.95, Z1, y);
  out.push({ m: 'r2/metal_stool_02', x: -12.0, y, z: -106.3, yaw: 0.5, h: 0.48, tag: '审讯室', on: 'floor', col: [0.4, 0.48, 0.4] });
  out.push({ m: 'r2/iron_chain', x: X0 + 0.2, y: y + 1.0, z: -101.0, yaw: ROT.E, h: 0.5, tag: '审讯室', on: 'wall' });
  // —— 观察间：两把椅子面朝单向玻璃（背对写字台）、桌上电话/烟灰缸/咖啡、北墙监看台（CRT + 录音机 + 摄像机）、档案柜、衣帽架 ——
  for (const z of [-100.35, -101.65]) out.push({ m: 'r2/old_computer_chair', x: -6.75, y, z, yaw: ROT.W + (z > -101 ? 0.12 : -0.1), h: 0.92, tag: '观察间', on: 'floor' });
  out.push({ m: 'r2/rotary_telephone', x: -4.1, y: y + 0.79, z: -101.2, yaw: Math.PI + 0.3, w: 0.22, tag: '观察桌', on: 'desk' });
  out.push({ m: 'r2/glass_ashtray', x: -5.9, y: y + 0.79, z: -100.8, yaw: 0, w: 0.13, tag: '观察桌', on: 'desk' });
  out.push({ m: 'r2/coffee_mug', x: -5.5, y: y + 0.79, z: -101.25, yaw: 0.8, h: 0.095, tag: '观察桌', on: 'desk' });
  out.push({ m: 'r2/coffee_mug', x: -4.6, y: y + 0.79, z: -100.75, yaw: 2.1, h: 0.095, tag: '观察桌', on: 'desk' });
  out.push({ fixed: true, m: '固定:监看台', x: -4.9, y, z: Z1 - 0.4, yaw: 0, size: [2.6, 0.9, 0.7], col: [2.6, 0.9, 0.7], tag: '监看台', on: 'floor' });
  out.push({ box: 'dz_wain', x: -4.9, y: y + 0.86, z: Z1 - 0.4, w: 2.6, h: 0.05, d: 0.7, tag: '监看台', on: 'partv' });
  out.push({ box: 'r3_steelOld', x: -4.9, y: y + 0.42, z: Z1 - 0.4, w: 2.5, h: 0.84, d: 0.62, tag: '监看台', on: 'partv' });
  out.push({ m: 'r2/crt_computer_monitor', x: -5.6, y: y + 0.885, z: Z1 - 0.45, yaw: Math.PI, h: 0.42, tag: '监看台', on: 'desk' });
  out.push({ m: 'r2/vintage_radio_transceiver', x: -4.6, y: y + 0.885, z: Z1 - 0.42, yaw: Math.PI, w: 0.5, tag: '监看台', on: 'desk' });
  out.push({ m: 'r2/vintage_video_camera', x: -3.9, y: y + 0.885, z: Z1 - 0.3, yaw: Math.PI - 0.4, w: 0.3, tag: '监看台', on: 'desk' });
  out.push({ m: 'r2/old_computer_chair', x: -5.1, y, z: Z1 - 1.25, yaw: 0.3, h: 0.92, tag: '监看台', on: 'floor' });
  cabRow(out, -6.6, Z0 + 0.4, y, 2, 0, '档案柜');
  out.push({ m: 'r2/coat_rack', x: -3.1, y, z: -103.6, yaw: 0, h: 1.8, tag: '观察间', on: 'floor', col: [0.5, 1.8, 0.5] });
  out.push({ m: 'r2/fire_extinguisher', x: -2.85, y, z: -98.9, yaw: ROT.W, h: 0.58, tag: 'K3', on: 'floor' });
  troffer(out, -4.8, -98.0, y, H, 0, 1.2, {}); troffer(out, -4.8, -104.0, y, H, 0, 1.2, {});
  // 批次6：观察间东墙案情板（软木：秦骁通缉档案 + 第二草稿徽）、监看台加录音机、壁灯、地胶
  pic(out, 'textures/b05/B05_高危通缉档案.png', X1 - 0.03, y + 1.7, -96.6, ROT.W, 0.5, 0.68, 'cork', { cork: [1.3, 0.95] });
  pic(out, 'textures/emblems/N07.jpg', X1 - 0.03, y + 1.75, -97.4, ROT.W, 0.32, 0.32, 'none');
  out.push({ m: 'r2/portable_cassette_player', x: -6.0, y: y + 0.885, z: Z1 - 0.5, yaw: Math.PI + 0.2, w: 0.3, tag: '监看台', on: 'desk' });
  for (const z of [-98.6, -104.6]) sconce(out, X1 - 0.02, y + 2.1, z, ROT.W);
  floorZ(out, 'r3_lino', -7.25, X1, Z0, Z1, y);
  light(out, -10.0, y + 2.2, -96.4, 0xffe2c0, 0.9, 4);
  light(out, -4.9, y + 2.4, -97.0, 0xffe6c8, 1.6, 5); light(out, -5.0, y + 2.6, -101.5, 0xffd8a8, 1.4, 5);
  return { room, items: out };
}


// ================= 批次4 · 飞行器机库（surface 区，x 73.6…98.4，z −86.4…−53.6，层高 12） =================
// 逻辑（PLACEMENT §10）：西侧大门 → 两个停机位（中轴，地面黄线）→ 西南维修区（工作台+台钳+台钻、焊机车、压缩机、旧轮胎）→ 西北油料区（黄黑地线圈出，油桶/油罐/灭火器 ×2）
//   → 北墙仓储（双联钢架 + 托盘）→ 东侧工具车/工具柜/伸缩梯（更衣柜原位）→ 东南休息角（茶几 + 金属凳 + 桶炉 + 录音机）。原机库程序化陈设与锚点（调度台日志、证物箱、安全须知、飞行器）不动
export function planHangar(y) {
  const out = []; const X0 = 73.7, X1 = 98.6, Z0 = -86.4, Z1 = -53.6, H = 12;
  const room = { name: '飞行器机库（批次4）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'W', a: -77, b: -63, label: '机库大门' }], windows: [],
    keep: [], rooms: [['停机位 A', 84, -63.5], ['停机位 B', 86, -78], ['维修区', 77.6, -57.8], ['油料区', 77.0, -80.5], ['仓储', 86.0, -85.2], ['工具 · 梯', 93.0, -66.5], ['休息角', 93.4, -57.6]],
    aisles: [{ label: '大门 → 机库中轴（黄线内）', x0: X0, x1: 93.6, z0: -75.2, z1: -70.4 }, { label: '东侧检修通道', x0: 96.05, x1: 97.85, z0: -76.0, z1: -65.0 }] };
  const F = (lab, x, z, w, d, h = 1, yaw = 0) => out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw, size: [w, h, d], col: [w, h, d], tag: '原锚点', on: 'floor' });
  F('更衣柜排', 98.2, -70, 0.6, 18.5, 2); F('调度台', 96.6, -85, 2.5, 1.0, 0.95); F('证物箱', 76, -84.5, 2.2, 1.2, 1.1);
  F('加注车（程序化）', 92.0, -82.5, 2.7, 1.6, 1.4, -0.3);
  // —— 批次6 ⓪ 停机位：A = 山猫直升机（替换胶囊体，旋翼盘包围盒 13×13）；B = 勤务车位（厢式勤务车 + 罩布轿车，桥式吊车吊钩在其上方）——
  // 批次25：Lynx 模型舱门内焊有人物网格（与机身同一网格，无法按节点删）→ 按“禁人物 3D 模型”规则移除；停机位 A 留空：黄色停机框 + 系留环 ×4 + 收存轮挡
  for (const [x0, x1, z0, z1] of [[79.4, 89.0, -67.85, -67.75], [79.4, 89.0, -57.65, -57.55], [79.4, 79.5, -67.85, -57.55], [88.9, 89.0, -67.85, -57.55]]) floorZ(out, 'r3_paintYellow', x0, x1, z0, z1, y, { lift: 0.001 });
  for (const [x, z] of [[81.4, -65.6], [87.0, -65.6], [81.4, -59.7], [87.0, -59.7]]) out.push({ box: 'r3_steelOld', x, y: y + 0.03, z, w: 0.22, h: 0.06, d: 0.22, tag: '停机位 A', on: 'partv' }); // 系留环座
  for (const [x, z] of [[88.4, -66.9], [88.4, -66.4]]) out.push({ box: 'r3_paintYellow', x, y: y + 0.08, z, w: 0.35, h: 0.15, d: 0.25, tag: '停机位 A', on: 'partv' }); // 收存轮挡
  out.push({ m: 'r2/international_harvester_van_nelson_nv', x: 83.6, y, z: -78.4, yaw: 0, w: 5.0, tag: '停机位 B', on: 'floor', col: [5.0, 3.0, 2.7] });
  out.push({ m: 'r2/sedan_car_covered_with_a_gray_car_cloth', x: 89.6, y, z: -79.0, yaw: 0.04, d: 4.8, tag: '停机位 B', on: 'floor', col: [2.2, 1.45, 4.8] });
  for (const [x, z] of [[80.6, -77.0], [80.6, -79.8], [86.6, -77.0], [86.6, -79.8]]) out.push({ box: 'r3_paintYellow', x, y: y + 0.08, z, w: 0.25, h: 0.15, d: 0.35, tag: '停机位 B', on: 'partv' }); // 轮挡
  // 停机位 B 桥式吊车：第二道黄色主梁（沿 x，y 9.2）+ 小车 + 钢丝绳 + 吊钩滑轮组（悬在厢式车上方 1.2 m）
  out.push({ box: 'r3_paintYellow', x: 86, y: y + 9.2, z: -78.4, w: 14.4, h: 0.5, d: 0.5, tag: '吊车', on: 'ceil' });
  out.push({ box: 'r3_steelOld', x: 83.6, y: y + 8.75, z: -78.4, w: 0.9, h: 0.4, d: 0.9, tag: '吊车', on: 'ceil' });
  out.push({ box: 'blackMetal', x: 83.6, y: y + 6.6, z: -78.4, w: 0.03, h: 4.1, d: 0.03, tag: '吊车', on: 'ceil' });
  out.push({ box: 'r3_paintYellow', x: 83.6, y: y + 4.45, z: -78.4, w: 0.36, h: 0.5, d: 0.22, tag: '吊车', on: 'ceil' });
  out.push({ box: 'blackMetal', x: 83.6, y: y + 4.1, z: -78.4, w: 0.06, h: 0.22, d: 0.06, tag: '吊车', on: 'ceil' });
  // 地面标线：中轴黄线（两侧）+ 停机位 B 矩形框 + 大门口黄黑警示带
  for (const z of [-70.35, -75.25]) floorZ(out, 'r3_paintYellow', X0 + 0.7, 96.0, z - 0.06, z + 0.06, y);
  for (const [x0, x1, z0, z1] of [[80.0, 92.4, -76.15, -76.05], [80.0, 92.4, -81.95, -81.85], [80.0, 80.1, -81.95, -76.05], [92.3, 92.4, -81.95, -76.05]]) floorZ(out, 'r3_paintYellow', x0, x1, z0, z1, y, { lift: 0.001 });
  floorZ(out, 'r3_hazard', X0 + 0.65, X0 + 1.25, -76.8, -63.2, y, { uv: 1 });
  floorZ(out, 'r3_epoxy', 80.0, 92.4, -81.95, -76.05, y, { lift: -0.002 });
  // —— 批次6 ⑥ 东侧钳工台（面朝西，背靠更衣柜前检修通道）：实验台 ×2 + 台钳/工具箱/探照灯/扳手 + 金属凳 ——
  for (const z of [-66.2, -68.9]) { out.push({ m: 'r2/lab_bench', x: 95.6, y, z, yaw: ROT.W, h: 0.95, tag: '钳工台', on: 'floor', col: [0.8, 0.95, 2.45] });
    out.push({ m: 'r2/metal_stool_02', x: 94.75, y, z: z + 0.3, yaw: ROT.E + 0.3, h: 0.48, tag: '钳工台', on: 'floor', col: [0.38, 0.48, 0.38] }); }
  out.push({ m: 'r2/bench_vice_01', x: 95.55, y: y + 0.95, z: -65.4, yaw: ROT.W, h: 0.22, tag: '钳工台', on: 'desk' });
  out.push({ m: 'r2/metal_toolbox', x: 95.7, y: y + 0.95, z: -66.7, yaw: ROT.W + 0.1, w: 0.45, tag: '钳工台', on: 'desk' });
  out.push({ m: 'r2/portable_searchlight', x: 95.6, y: y + 0.95, z: -68.4, yaw: ROT.W - 0.3, h: 0.3, tag: '钳工台', on: 'desk' });
  out.push({ m: 'r2/adjustable_wrench', x: 95.4, y: y + 0.95, z: -69.4, yaw: 0.6, w: 0.3, tag: '钳工台', on: 'desk' });
  out.push({ m: 'r2/vintage_oil_lamp', x: 95.75, y: y + 0.95, z: -69.9, yaw: 0, h: 0.3, tag: '钳工台', on: 'desk' });
  out.push({ m: 'r2/diesel_generator', x: 94.9, y, z: -77.4, yaw: ROT.W, w: 1.0, tag: '钳工台', on: 'floor', col: [0.7, 1.0, 1.6] });
  out.push({ m: 'r2/portable_generator', x: 91.9, y, z: -66.6, yaw: -0.4, w: 0.75, tag: '停机位 A', on: 'floor', col: [0.75, 0.55, 0.55] });
  // 乘机安全须知（原锚点，移到直升机东侧落地展架）
  out.push({ fixed: true, m: '固定:乘机安全须知展架', x: 91.45, y, z: -59.6, yaw: 0, size: [0.3, 1.8, 0.6], col: [0.3, 1.8, 0.6], tag: '原锚点', on: 'floor' });
  for (const s of [-1, 1]) { out.push({ box: 'blackMetal', x: 91.47, y: y + 0.88, z: -59.6 + s * 0.26, w: 0.03, h: 1.76, d: 0.03, tag: '原锚点', on: 'partv' }); out.push({ box: 'blackMetal', x: 91.47, y: y + 0.01, z: -59.6 + s * 0.26, w: 0.4, h: 0.02, d: 0.06, tag: '原锚点', on: 'partv' }); }
  out.push({ box: 'dz_wain', x: 91.46, y: y + 1.45, z: -59.6, w: 0.02, h: 0.64, d: 0.5, tag: '原锚点', on: 'partv' });
  // 油料区补 LPG 罐 ×3（成排靠黄线）
  for (const x of [75.4, 76.15, 76.9]) out.push({ m: 'r2/small_lpg_tank', x, y, z: -79.05, yaw: 0, h: 0.95, tag: '油料区', on: 'floor', col: [0.62, 0.95, 0.62] });
  F('军用木箱', 78.35, -55, 1.3, 0.6, 1.1); F('军用木箱2', 95, -55, 0.6, 0.6, 0.55); F('工具推车', 80, -86, 1.1, 0.8, 1.0); F('塑料桶', 92, -85.5, 0.6, 0.6, 0.6); F('充电桩 S', 97.8, -58, 0.5, 0.4, 1.6); F('充电桩 N', 97.8, -82, 0.5, 0.4, 1.6);
  // —— ① 维修区（西南，大门南侧）：木工作台 + 台钳 + 台钻、焊机车、压缩机、旧轮胎堆、手推车 ——
  out.push({ fixed: true, m: '固定:工作台', x: 75.6, y, z: -54.6, yaw: 0, size: [2.4, 0.9, 0.8], col: [2.4, 0.9, 0.8], tag: '维修区', on: 'floor' });
  out.push({ box: 'dz_wain', x: 75.6, y: y + 0.88, z: -54.6, w: 2.4, h: 0.06, d: 0.8, tag: '维修区', on: 'partv' });
  for (const [dx, dz] of [[-1.15, -0.35], [1.15, -0.35], [-1.15, 0.35], [1.15, 0.35]]) out.push({ box: 'r3_steelOld', x: 75.6 + dx, y: y + 0.43, z: -54.6 + dz, w: 0.06, h: 0.86, d: 0.06, tag: '维修区', on: 'partv' });
  out.push({ box: 'r3_steelOld', x: 75.6, y: y + 0.2, z: -54.6, w: 2.3, h: 0.03, d: 0.7, tag: '维修区', on: 'partv' });
  out.push({ m: 'r2/bench_vice_01', x: 74.8, y: y + 0.91, z: -54.85, yaw: Math.PI, h: 0.22, tag: '维修区', on: 'desk' });
  out.push({ m: 'r2/drill_press_01', x: 76.3, y: y + 0.91, z: -54.65, yaw: Math.PI, h: 0.75, tag: '维修区', on: 'desk' });
  out.push({ m: 'r2/portable_welding_cart', x: 74.8, y, z: -58.6, yaw: 0.6, h: 1.1, tag: '维修区', on: 'floor', col: [0.7, 1.1, 0.6] });
  out.push({ m: 'r2/old_military_compressor', x: 76.4, y, z: -60.6, yaw: 0.2, w: 1.3, tag: '维修区', on: 'floor', col: [1.3, 0.9, 0.7] });
  for (const [k, [x, z, dy, rx]] of [[80.5, -54.4, 0, Math.PI / 2], [80.5, -54.4, 0.25, Math.PI / 2], [81.3, -55.5, 0, 0.15]].entries()) out.push({ m: 'r2/old_tyre', x, y: y + dy + (rx === 0.15 ? 0.33 : 0), z, yaw: k * 0.7, rx, w: 0.68, tag: '维修区', on: 'shelf' });
  out.push({ m: 'r2/hand_truck', x: 82.4, y, z: -54.3, yaw: Math.PI, rx: 0.1, h: 1.2, tag: '维修区', on: 'floor' });
  // —— ② 油料区（西北角，大门北侧）：黄黑地线框、油桶组、汽油罐、单桶、灭火器 ×2 ——
  floorZ(out, 'r3_hazard', 74.0, 80.4, -82.9, -82.7, y, { uv: 1 }); floorZ(out, 'r3_hazard', 80.2, 80.4, -82.9, -78.4, y, { uv: 1 }); floorZ(out, 'r3_hazard', 74.0, 80.4, -78.6, -78.4, y, { uv: 1 });
  out.push({ m: 'r2/oil_drums', x: 75.0, y, z: -80.6, yaw: 0.2, h: 0.95, tag: '油料区', on: 'floor', col: [1.2, 0.95, 1.2] });
  out.push({ m: 'r2/pallets_and_plastic_barrels', x: 77.3, y, z: -81.4, yaw: 0, w: 1.3, tag: '油料区', on: 'floor', col: [1.3, 1.0, 1.3] });
  for (const [x, z, m] of [[79.2, -79.2, 'r2/barrel_01'], [79.4, -80.2, 'r2/barrel_02'], [78.4, -79.0, 'r2/oil_drum_game_model']]) out.push({ m, x, y, z, yaw: x, h: 0.9, tag: '油料区', on: 'floor', col: [0.62, 0.9, 0.62] });
  for (let k = 0; k < 4; k++) out.push({ m: k % 2 ? 'r2/metal_jerrycan_green' : 'r2/metal_jerrycan', x: 74.3 + k * 0.5, y, z: -82.3, yaw: 0.05 * k, h: 0.46, tag: '油料区', on: 'floor' });
  for (const z of [-78.0, -83.3]) out.push({ m: 'r2/fire_extinguisher', x: 74.1, y, z, yaw: ROT.E, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ sign: '油料区', sub: '严禁烟火 · 双人作业', x: X0 - 0.02 + 0.06, y: y + 2.2, z: -80.6, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  // —— ③ 北墙仓储：双联钢架 ×2 + 托盘 + 木箱 ——
  for (const x of [83.6, 88.0]) { out.push({ m: 'r2/double_metal_shelving_unit', x, y, z: Z0 + 0.45, yaw: 0, h: 2.0, tag: '仓储', on: 'floor', col: [4.16, 2.0, 0.8] });
    for (const [dx, dy, m, sz] of [[-1.4, 0.42, 'r2/military_wooden_crate', { w: 0.9 }], [0.3, 0.42, 'r2/cardboard_transport_shipping_box', { w: 0.5 }], [1.4, 1.02, 'r2/wooden_crate_02', { w: 0.6 }], [-0.6, 1.02, 'r2/plastic_crate_01', { h: 0.28 }], [0.8, 1.6, 'r2/metal_toolbox', { w: 0.45 }]]) out.push({ m, x: x + dx, y: y + dy, z: Z0 + 0.45, yaw: 0.05, ...sz, tag: '仓储', on: 'shelf' }); }
  out.push({ m: 'r2/eur_pallet_rawscan', x: 94.2, y, z: -83.0, yaw: 0.1, w: 1.2, tag: '仓储', on: 'floor', col: [1.2, 0.15, 0.8] });
  out.push({ m: 'r2/military_wooden_crate', x: 94.2, y: y + 0.15, z: -83.0, yaw: 0.15, w: 1.0, tag: '仓储', on: 'shelf' });
  // —— ④ 东侧：工具车 + 工具柜 + 伸缩梯（停机位 A 东侧检修位）——
  out.push({ m: 'r2/tool_cart', x: 91.6, y, z: -62.4, yaw: ROT.W, w: 0.9, tag: '工具', on: 'floor', col: [0.7, 0.7, 0.9] });
  out.push({ m: 'r2/metal_tool_chest', x: 96.9, y, z: -64.0, yaw: ROT.W, w: 0.9, tag: '工具', on: 'floor', col: [0.6, 0.9, 0.9] });
  out.push({ m: 'r2/ladder_sectioned_01', x: 93.3, y, z: -64.4, yaw: ROT.W, h: 2.6, tag: '工具', on: 'floor' });
  out.push({ m: 'r2/traffic_cones', x: 79.0, y, z: -69.6, yaw: 0, h: 0.5, tag: '停机位 A', on: 'floor' });
  // —— ⑤ 休息角（东南）：工业茶几 + 金属凳 ×3 + 桶炉 + 录音机 + 满烟灰缸 + 保温壶 ——
  out.push({ m: 'r2/industrial_coffee_table', x: 92.8, y, z: -57.4, yaw: 0.1, w: 1.1, tag: '休息角', on: 'floor', col: [1.1, 0.45, 0.6] });
  for (const [dx, dz] of [[-0.95, 0.15], [0.95, -0.1], [0.1, 0.85]]) out.push({ m: 'r2/metal_stool_03', x: 92.8 + dx, y, z: -57.4 + dz, yaw: dx, h: 0.5, tag: '休息角', on: 'floor', col: [0.38, 0.5, 0.38] });
  out.push({ m: 'r2/barrel_stove', x: 90.6, y, z: -55.0, yaw: 0, h: 1.0, tag: '休息角', on: 'floor', col: [0.62, 1.0, 0.62] });
  out.push({ m: 'r2/boombox', x: 93.1, y: y + 0.45, z: -57.5, yaw: Math.PI + 0.3, w: 0.42, tag: '休息角', on: 'shelf' });
  out.push({ m: 'r2/ptish_exceptionally_full_ashtray', x: 92.5, y: y + 0.45, z: -57.3, yaw: 0, w: 0.16, tag: '休息角', on: 'shelf' });
  out.push({ m: 'r2/modified_thermos', x: 92.3, y: y + 0.45, z: -57.55, yaw: 0, h: 0.3, tag: '休息角', on: 'shelf' });
  // —— 照明：工业吊灯（维修区/油料区/休息角上方，灯底 6 m）+ 补光 ——
  for (const [x, z] of [[75.6, -57.0], [77.0, -80.6], [92.8, -57.4], [86.0, -84.0], [95.4, -67.6], [89.6, -79.0], [80.0, -62.4], [88.4, -62.4]]) { out.push({ m: 'r2/industrial_lamp', x, y: y + 6.0, z, yaw: 0, h: 0.5, tag: '照明', on: 'ceil' }); out.push({ box: 'blackMetal', x, y: y + 6.5 + (H - 7.1) / 2, z, w: 0.03, h: H - 7.1, d: 0.03, tag: '照明', on: 'ceil' }); light(out, x, y + 5.4, z, 0xffd8a0, 3.0, 10); }
  wear(out, X0 + 0.5, 96.0, -71.0, -69.0, y);
  return { room, items: out };
}

// 批次3：Blender 接触表（work/r3/orient4/sheet_*.jpg）核对出「正面不是 +Z」的模型 → 额外 yaw 修正（正面 +X → −π/2）
export const YAWFIX = { 'r2/bookshelf': -Math.PI / 2, 'r2/dusty_bookshelfs': -Math.PI / 2, 'r2/electric_meters_and_panels_1': -Math.PI / 2, 'r2/ergonomic_mesh_office_chair': -Math.PI / 2, 'r2/hallway_bench': -Math.PI / 2, 'r2/heavy_metal_door': -Math.PI / 2, 'r2/microfiche_reader': -Math.PI / 2, 'r2/retro_computer': -Math.PI / 2, 'r2/wooden_display_shelves_01': -Math.PI / 2, 'r2/apartment_radiator': -Math.PI / 2, 'r2/rusty_twin_spot_emergency_light': -Math.PI / 2, 'r2/rockingchair_01': Math.PI }; // 批次4：work/r3/orient5/sheet_*.jpg
const fixYaw = (p) => { for (const it of p.items) if (it.m && YAWFIX[it.m] !== undefined && !it.fixed) { it.yaw = (it.yaw ?? 0) + YAWFIX[it.m]; it.yawFixed = YAWFIX[it.m]; } return p; };
// ================= 批次6 补强（追加到已有规划末尾；先隔断/动线不变，只补件、补灯、补墙面）=================
const X6 = {
  // 指挥中心：通讯室北墙/东墙护墙板 + 墙布衬里（盖住原墙粗糙怪异材质）、地面补光（席位区/平台前）
  command_center: (out, y) => { const yp = y + 1.8, X1 = 50, Z0 = -61;
    for (const [x, z, w, d] of [[46.8, Z0 + 0.17, 6.3, 0.04], [X1 - 0.17, -58.75, 0.04, 4.3]]) { // 原墙 wallPlaster 厚 0.3，墙面在 z −60.85 / x 49.85
      out.push({ box: 'dz_base', x, y: yp + 0.06, z, w: w + (d > 0.1 ? 0.02 : 0), h: 0.12, d: d + 0.02, tag: '墙面', on: 'partv' });
      out.push({ box: 'dz_wain', x, y: yp + 0.6, z, w, h: 1.0, d, tag: '墙面', on: 'partv' });
      out.push({ box: 'dz_wain2', x, y: yp + 1.12, z, w, h: 0.06, d: d + 0.03, tag: '墙面', on: 'partv' });
      out.push({ box: 'dz_damaskGreen', x, y: yp + 2.6, z, w, h: 2.9, d, tag: '墙面', on: 'partv' });
      out.push({ box: 'dz_wain', x, y: yp + 4.1, z, w, h: 0.14, d: d + 0.04, tag: '墙面', on: 'partv' }); }
    pic(out, 'textures/b07/B07_预警发布流程.png', 45.4, yp + 1.85, Z0 + 0.2, 0, 0.75, 1.0, 'black');
    sconce(out, 44.4, yp + 2.2, Z0 + 0.19, 0); sconce(out, X1 - 0.19, yp + 2.2, -57.6, ROT.W);
    for (const x of [25.3, 32.2, 39.1, 46.0]) for (const z of [-42.5, -49.5]) light(out, x, y + 3.8, z, 0xfff0dc, 1.6, 9);
    for (const x of [26, 35, 44]) light(out, x, y + 3.2, -55.0, 0xffe2c0, 1.4, 8); },
  // 医务观察病房：东侧再排 2 床（床头靠玻璃隔断）+ 床头柜、吸顶灯槽、理智值分级表、输液区补光
  medical: (out, y) => { const X0 = -9.3, H = 5.4;
    for (const z of [-104.8, -108.1]) { out.push({ m: 'r2/old_hospital_bed_pbr_gr', x: -4.35, y, z, yaw: ROT.E, fit: [1.2, 1.0, 2.05], size: [1.2, 1.0, 2.05], tag: '病房', on: 'floor', col: [2.0, 0.9, 0.95] });
      out.push({ m: 'r2/painted_wooden_nightstand', x: -3.6, y, z: z + 0.85, yaw: ROT.W, h: 0.62, tag: '病房', on: 'floor', col: [0.45, 0.62, 0.45] }); }
    out.push({ m: 'r2/plastic_thermos', x: -3.6, y: y + 0.62, z: -103.95, yaw: 0, h: 0.3, tag: '病房', on: 'shelf' });
    for (const z of [-101.5, -104.8, -108.1]) troffer(out, -6.3, z, y, H, Math.PI / 2, 1.2, {});
    pic(out, 'textures/b03/B03_理智值分级表.png', X0 + 0.03, y + 2.3, -103.15, ROT.E, 0.6, 0.8, 'wood');
    pic(out, 'textures/b07/B07_药柜清单.png', X0 + 0.03, y + 2.3, -106.45, ROT.E, 0.5, 0.68, 'wood');
    light(out, -6.3, y + 2.6, -103.0, 0xfff2e0, 1.6, 7); light(out, -6.3, y + 2.6, -108.0, 0xfff2e0, 1.6, 7); },
  // B4：两条通行带上方吸顶灯槽每 4 m + 冷白补光每 8 m（原来只有中轴一串暖灯）
  b4: (out, y) => { for (let z = -96; z > -134; z -= 4) for (const x of [-2.05, 2.05]) troffer(out, x, z, y, 5.2, 0, 1.2, { cold: true });
    for (let z = -98; z > -134; z -= 8) light(out, 0, y + 3.4, z, 0xe8eeff, 1.8, 9); },
  b5: (out, y) => { for (const [x, z] of [[-3.0, -95.5], [4.4, -95.8], [0, -98.6], [-4.8, -97.8]]) light(out, x, y + 3.0, z, 0xeef2ff, 1.8, 8); for (const z of [-94, -97, -99]) troffer(out, 0, z, y, 7, 0, 1.6, { cold: true }); },
  b6: (out, y) => { for (let z = -104; z > -156; z -= 8) light(out, -24.0, y + 6.0, z, 0xe6ecff, 2.2, 14); light(out, -30.0, y + 3.0, -146.0, 0xffd8a0, 2.0, 8); },
  // B7 墨渊前厅：中轴烛台仪仗（两侧各 4 座）+ 红绳隔离带、两侧「旧档案」书架列（西墙、东墙北段）+ 散落档案箱
  b7: (out, y) => {
    for (const z of [-59.6, -62.0, -64.4]) for (const sx of [-1, 1]) { out.push({ m: 'r2/medieval_candelabra_free_download', x: sx * 3.6, y, z, yaw: 0, h: 1.6, tag: '烛台', on: 'floor', col: [0.5, 1.6, 0.5] }); }
    for (const z of [-60.8, -63.2]) for (const sx of [-1, 1]) light(out, sx * 3.6, y + 1.9, z, 0xffb060, 1.8, 6);
    stanchions(out, [[-3.25, -55.6], [-3.25, -58.4], [-3.25, -61.2], [-3.25, -63.9]], y, '仪仗隔离带'); stanchions(out, [[3.25, -55.6], [3.25, -58.4], [3.25, -61.2], [3.25, -63.9]], y, '仪仗隔离带');
    for (let k = 0; k < 3; k++) out.push({ m: 'r2/dusty_bookshelfs', x: -14.65, y, z: -58.6 - k * 2.45, yaw: ROT.E, h: 2.4, tag: '旧档案列', on: 'floor', col: [0.5, 2.4, 1.05] });
    for (let k = 0; k < 1; k++) out.push({ m: 'r2/dusty_bookshelfs', x: 14.65, y, z: -64.0 - k * 2.45, yaw: ROT.W, h: 2.4, tag: '旧档案列', on: 'floor', col: [0.5, 2.4, 1.05] });
    for (const [x, z, r] of [[-12.6, -59.4, 0.3], [-12.9, -62.5, -0.4], [-12.4, -64.7, 0.9], [12.6, -64.2, 0.2]]) out.push({ m: 'r2/old_paper_cardboard_boxes', x, y, z, yaw: r, w: 0.8, tag: '旧档案列', on: 'floor', col: [0.8, 0.5, 0.6] });
    for (const z of [-59.0, -63.5]) light(out, -12.8, y + 3.2, z, 0xffc070, 1.6, 7); },
};
const withX6 = (id, f) => (Y) => { const p = f(Y); const n0 = p.items.length; if (X6[id]) X6[id](p.items, Y); fixYaw({ items: p.items.slice(n0) }); return p; };
// ======================= 批次21：宿舍三号楼 3F 单身职工单间层 dorm3（y 9.2） =======================
// 平面：中走廊 x 62.0…64.6（2.6 m，正对 2F 走廊）沿 z；西侧单间 x 57.2…62.0、东侧 x 64.6…69.4（进深 4.8 m），每间开间 3.4 m，z 2.0…25.8 各 7 间（301–307 西，308–314 东）；
// 北端：东侧公共盥洗间 x 64.6…69.4，z 27.2…38.8（后墙一排 12 个水龙头的水泥长槽）；西侧开水房 / 储藏 z 25.8…38.8；楼梯 2F→3F 在走廊西半 x 62.1…63.3，z 30.8→38.2（北上）。
// 两侧坡屋顶下 x 53.2…57.2 / 69.4…78.8 为屋架储藏，矮墙封闭（单间后墙开高窗借老虎窗光）。剧情锚点：306（空床 + 留下的信 + 合影）、311（照片墙 + 未拆的家信）。
export const DORM3 = { Y: 9.2, H: 3.2, cx0: 62.0, cx1: 64.6, wx0: 57.2, ex1: 69.4, rz0: 2.0, rw: 3.4, n: 7, wash: { x0: 64.6, x1: 69.4, z0: 27.2, z1: 38.8 }, stair: { x0: 62.1, x1: 63.3, z0: 30.8, z1: 38.2 } };
export function dorm3Rooms() {
  const D = DORM3, out = [];
  for (let k = 0; k < D.n; k++) { const zc = D.rz0 + D.rw * (k + 0.5); out.push({ num: String(301 + k), side: 'W', zc, back: D.wx0, door: D.cx0, s: 1 }); out.push({ num: String(308 + k), side: 'E', zc, back: D.ex1, door: D.cx1, s: -1 }); }
  return out; // s：从后墙指向走廊的 x 方向
}
// 单间内陈设坐标（局部：u = 离后墙距离，v = 相对开间中心 z）
export function dorm3Furn(r) {
  const X = (u) => r.back + r.s * u, yawIn = r.s > 0 ? Math.PI / 2 : -Math.PI / 2; // yawIn：朝走廊方向
  return { bed: { x: X(1.1), z: r.zc + 1.12, yaw: yawIn }, desk: { x: X(0.32), z: r.zc - 0.75, yaw: yawIn }, wardrobe: { x: X(3.75), z: r.zc - 1.42, yaw: 0 }, wash: { x: X(3.1), z: r.zc + 1.35, yaw: Math.PI }, door: { z0: r.zc + 0.6, z1: r.zc + 1.5 }, X };
}
export function planDorm3(y0) {
  const D = DORM3, y = y0, out = [];
  const room = { name: '宿舍三号楼 · 3F 单身职工单间层（批次21）', x0: D.wx0, x1: D.ex1, z0: 1.2, z1: 38.8, y, H: D.H,
    doors: [{ wall: 'N', a: 62.1, b: 63.3, label: '楼梯 ↓ 2F' }], windows: [],
    keep: [{ label: '楼梯洞口', x: 62.7, z: 34.5, w: 1.2, d: 7.4 }],
    rooms: [['西侧单间 301–307', 59.6, 14], ['东侧单间 308–314', 67.0, 14], ['公共盥洗间', 67.0, 33], ['开水房 / 储藏', 59.6, 32], ['中走廊', 63.3, 20]],
    aisles: [{ label: '中走廊', x0: 63.35, x1: 64.55, z0: 1.3, z1: 38.7 }, { label: '中走廊（南段全宽）', x0: 62.05, x1: 64.55, z0: 1.3, z1: 30.6 }] };
  for (const r of dorm3Rooms()) {
    const f = dorm3Furn(r), anchor = r.num === '306' || r.num === '311';
    out.push({ fixed: true, m: '单人铁架床', x: f.bed.x, y, z: f.bed.z, yaw: 0, size: [2.0, 0.95, 1.0], tag: r.num, on: 'floor' });
    out.push({ fixed: true, m: 'desk 书桌+椅', x: f.desk.x + r.s * 0.22, y, z: f.desk.z, yaw: 0, size: [1.05, 0.8, 1.1], tag: r.num, on: 'floor' });
    out.push({ fixed: true, m: '木衣柜', x: f.wardrobe.x, y, z: f.wardrobe.z, yaw: 0, size: [1.0, 2.0, 0.56], tag: r.num, on: 'floor' });
    out.push({ fixed: true, m: '脸盆架', x: f.wash.x, y, z: f.wash.z, yaw: 0, size: [0.45, 1.9, 0.45], tag: r.num, on: 'floor' });
    out.push({ m: 'r2/bankers_lamp', x: f.X(0.3), y: y + 0.8, z: f.desk.z - 0.35, yaw: f.desk.yaw, h: 0.4, tag: r.num, on: 'desk' });
    // 作息表（南墙 = 开间 −z 墙，书桌上方）+ 私人物件
    out.push({ box: 'r3_kraftBox', x: f.X(1.25), y: y + 1.65, z: r.zc - 1.69, w: 0.5, h: 0.7, d: 0.01, tag: r.num, on: 'partv' });
    out.push({ box: 'dz_paper', x: f.X(1.25), y: y + 1.65, z: r.zc - 1.684, w: 0.44, h: 0.62, d: 0.006, tag: r.num, on: 'partv' });
    for (let i = 0; i < 6; i++) out.push({ box: 'navy', x: f.X(1.25), y: y + 1.88 - i * 0.09, z: r.zc - 1.68, w: 0.36 - (i % 2) * 0.1, h: 0.012, d: 0.004, tag: r.num, on: 'partv' });
    out.push({ box: 'wood', x: f.X(1.1), y: y + 0.1, z: r.zc + 0.42, w: 0.6, h: 0.2, d: 0.4, tag: r.num, on: 'floor' }); // 床下箱
    light(out, f.X(2.3), y + 2.7, r.zc, anchor ? 0xffd2a0 : 0xffe2c0, anchor ? 2.4 : 1.7, 5.5);
    // 批次22：dorm_r3_b 看图墙面素平 → 三面墙（后墙 + 两道开间隔墙）浅灰绿油漆墙裙 1.2 m + 深色踢脚线；走廊墙门两侧同做
    { const bf = r.back + r.s * 0.1, ff = r.door - r.s * 0.08, zS = r.zc - D.rw / 2 + 0.06, zN = r.zc + D.rw / 2 - 0.06, xm = (bf + ff) / 2, L = Math.abs(ff - bf);
      out.push({ box: 'r3_dormWain', x: bf + r.s * 0.006, y: y + 0.6, z: r.zc, w: 0.012, h: 1.2, d: D.rw - 0.12, tag: r.num + ' 墙裙', on: 'partv' });
      out.push({ box: 'dz_beam', x: bf + r.s * 0.016, y: y + 0.06, z: r.zc, w: 0.02, h: 0.12, d: D.rw - 0.12, tag: r.num + ' 踢脚', on: 'partv' });
      for (const [zz, sg] of [[zS, 1], [zN, -1]]) { out.push({ box: 'r3_dormWain', x: xm, y: y + 0.6, z: zz + sg * 0.006, w: L, h: 1.2, d: 0.012, tag: r.num + ' 墙裙', on: 'partv' });
        out.push({ box: 'dz_beam', x: xm, y: y + 0.06, z: zz + sg * 0.016, w: L, h: 0.12, d: 0.02, tag: r.num + ' 踢脚', on: 'partv' }); }
      const dz0 = r.zc + 0.6, dz1 = r.zc + 1.5; for (const [a, c] of [[zS, dz0], [dz1, zN]]) if (c - a > 0.1) { out.push({ box: 'r3_dormWain', x: ff - r.s * 0.017, y: y + 0.6, z: (a + c) / 2, w: 0.012, h: 1.2, d: c - a, tag: r.num + ' 墙裙', on: 'partv' }); out.push({ box: 'dz_beam', x: ff - r.s * 0.028, y: y + 0.06, z: (a + c) / 2, w: 0.02, h: 0.12, d: c - a, tag: r.num + ' 踢脚', on: 'partv' }); }
      out.push({ box: 'dz_beam', x: bf + r.s * 0.01, y: y + 1.21, z: r.zc, w: 0.03, h: 0.025, d: D.rw - 0.12, tag: r.num + ' 墙裙压线', on: 'partv' });
      // 批次34：上部墙面旧白灰（水渍 / 发丝裂 / 起皮）——后墙 + 两道开间隔墙，墙裙压线以上到顶（后墙高窗压在其前方 0.11 m，不遮挡）
      const uH = D.H - 1.27, uy = y + 1.235 + uH / 2; out.push({ box: 'r3_dormUpper', x: bf + r.s * 0.004, y: uy, z: r.zc, w: 0.008, h: uH, d: D.rw - 0.12, tag: r.num + ' 上部墙面', on: 'partv' });
      for (const [zz, sg] of [[zS, 1], [zN, -1]]) out.push({ box: 'r3_dormUpper', x: xm, y: uy, z: zz + sg * 0.004, w: L, h: uH, d: 0.008, tag: r.num + ' 上部墙面', on: 'partv' }); }
    if (r.num === '306') { // 空床：被褥卷起、桌上留下的信 + 合影 + 钥匙
      out.push({ box: 'kraft', x: f.X(0.4), y: y + 0.805, z: f.desk.z + 0.05, w: 0.12, h: 0.006, d: 0.22, tag: '306 锚点', on: 'desk' });
      out.push({ box: 'dz_paper', x: f.X(0.42), y: y + 0.81, z: f.desk.z + 0.1, w: 0.2, h: 0.003, d: 0.28, tag: '306 锚点', on: 'desk', anchor: 'doc_dorm3_letter' });
      out.push({ m: 'r2/standing_picture_frame_01', x: f.X(0.25), y: y + 0.8, z: f.desk.z - 0.05, yaw: f.desk.yaw, h: 0.2, tag: '306 锚点', on: 'desk' });
      light(out, f.X(0.6), y + 1.4, f.desk.z, 0xffcf96, 0.9, 2.5);
    }
    if (r.num === '311') for (let i = 0; i < 6; i++) out.push({ box: i % 2 ? 'dz_paper' : 'r3_kraftBox', x: f.X(1.2 + (i % 3) * 0.32), y: y + 1.35 + Math.floor(i / 3) * 0.32, z: r.zc + 1.69, w: 0.22, h: 0.28, d: 0.006, tag: '311 照片墙', on: 'partv' });
  }
  // 走廊：吸顶灯 + 防火水桶 / 暖瓶架 + 公告栏
  for (const z of [4, 11, 18, 25, 32]) light(out, 63.3, y + 2.9, z, 0xfff0d8, 2.0, 7);
  // 公共盥洗间：后墙水泥长槽 + 12 龙头 + 镜条 + 白瓷砖墙裙 + 地漏
  const W = D.wash, tx = W.x1 - 0.35;
  out.push({ box: 'r3_terrTrough', x: tx, y: y + 0.39, z: (W.z0 + W.z1) / 2, w: 0.6, h: 0.78, d: W.z1 - W.z0 - 1.2, tag: '盥洗槽', on: 'floor' }); // 批次22：素混凝土盒 → 浅灰水磨石槽 + 前沿圆口压边 + 两端挡板 + 槽下踢脚凹线
  out.push({ box: 'r3_terrTrough', x: tx - 0.29, y: y + 0.82, z: (W.z0 + W.z1) / 2, w: 0.08, h: 0.08, d: W.z1 - W.z0 - 1.16, tag: '盥洗槽压边', on: 'partv' });
  for (const z of [W.z0 + 0.6, W.z1 - 0.6]) out.push({ box: 'r3_terrTrough', x: tx, y: y + 0.84, z, w: 0.6, h: 0.12, d: 0.06, tag: '盥洗槽端板', on: 'partv' });
  out.push({ box: 'dz_beam', x: tx - 0.305, y: y + 0.05, z: (W.z0 + W.z1) / 2, w: 0.012, h: 0.1, d: W.z1 - W.z0 - 1.2, tag: '盥洗槽踢脚', on: 'partv' });
  out.push({ box: 'dz_glassDark', x: tx, y: y + 0.785, z: (W.z0 + W.z1) / 2, w: 0.44, h: 0.01, d: W.z1 - W.z0 - 1.4, tag: '盥洗槽', on: 'partv' });
  out.push({ box: 'whitePad', x: W.x1 - 0.01, y: y + 0.9, z: (W.z0 + W.z1) / 2, w: 0.01, h: 1.8, d: W.z1 - W.z0, tag: '瓷砖墙裙', on: 'partv' });
  out.push({ box: 'glassClear', x: W.x1 - 0.02, y: y + 1.65, z: (W.z0 + W.z1) / 2, w: 0.01, h: 0.5, d: W.z1 - W.z0 - 1.4, tag: '镜条', on: 'partv' });
  for (let k = 0; k < 12; k++) { const z = W.z0 + 1.0 + k * 0.85; out.push({ box: 'steel', x: W.x1 - 0.1, y: y + 1.08, z, w: 0.2, h: 0.03, d: 0.03, tag: '龙头', on: 'partv' }); out.push({ box: 'steel', x: W.x1 - 0.19, y: y + 1.03, z, w: 0.03, h: 0.1, d: 0.03, tag: '龙头', on: 'partv' }); out.push({ box: 'whiteMarble', x: W.x1 - 0.05, y: y + 1.2, z, w: 0.03, h: 0.04, d: 0.07, tag: '龙头', on: 'partv' }); }
  out.push({ box: 'steel', x: W.x1 - 0.05, y: y + 1.12, z: (W.z0 + W.z1) / 2, w: 0.04, h: 0.04, d: W.z1 - W.z0 - 1.2, tag: '水管', on: 'partv' });
  for (const z of [30.5, 35.5]) light(out, 67.0, y + 2.9, z, 0xe8f0ff, 2.2, 7);
  return { room, items: out };
}

export const PLANS = { floor3_office: (Y) => fixYaw(planFloor3Office(Y)), floor2_liaison: (Y) => fixYaw(planFloor2Liaison(Y)), floor2_pub: (Y) => fixYaw(planFloor2Pub(Y)), director: (Y) => fixYaw(planDirector(Y)), gate: (Y) => fixYaw(planGate(Y)), archive: (Y) => fixYaw(planArchive(Y)), command_center: withX6('command_center', (Y) => fixYaw(planCommand(Y))), canteen: (Y) => fixYaw(planCanteen(Y)), b1: (Y) => fixYaw(planB1(Y)), b2: (Y) => fixYaw(planB2(Y)), archive_b1: (Y) => fixYaw(planArchiveB1(Y)), b4: withX6('b4', (Y) => fixYaw(planB4(Y))), b5: withX6('b5', (Y) => fixYaw(planB5(Y))), b6: withX6('b6', (Y) => fixYaw(planB6(Y))), b7: withX6('b7', (Y) => fixYaw(planB7(Y))), medical: withX6('medical', (Y) => fixYaw(planMedical(Y))), dorm: (Y) => fixYaw(planDorm(Y)), dorm2: (Y) => fixYaw(planDorm2(Y)), dorm3: (Y) => fixYaw(planDorm3(Y)), interrogation: (Y) => fixYaw(planInterrogation(Y)), hangar: (Y) => fixYaw(planHangar(Y)), security_hall: (Y) => fixYaw(planSecurityHall(Y)), plaza: (Y) => fixYaw(planPlaza(Y)) };

// ================= 批次7 · 新做区：训练场 / 地铁口 / 无字碑廊 / 第七局（作战室·杀青室）/ 墨渊（倒悬书城·考场母本） =================
const F7 = (out, label, x, z, w, d, y, yaw = 0, h = 1) => out.push({ fixed: true, m: '固定:' + label, x, y, z, yaw, size: [w, h, d], col: [w, h, d], tag: label, on: 'floor' });
// —— B6 训练场主场（x −32…32，z −156…−92，层高 16）——
export function planTraining(y) {
  const out = []; const X0 = -32, X1 = 32, Z0 = -156, Z1 = -92, H = 16;
  const room = { name: 'B6 · 驯化副本训练场（批次7）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H, doors: [{ wall: 'N', a: -9.4, b: 9.4, label: '电梯厅开口' }], windows: [],
    rooms: [['① 检录台', 0, -95.5], ['② 战术简报区', -22, -109], ['③ 装备领用', 9.5, -110], ['④ 副本门待命位', 0, -126], ['⑤ 射击区控制台', 21.5, -138.5], ['⑥ 医疗撤离点', -28.5, -103.5]],
    aisles: [{ label: '主通道（电梯厅 → 副本门区）', x0: -2.6, x1: 2.6, z0: -117.4, z1: -92.2 }, { label: '射击线后通道', x0: -18, x1: 18, z0: -140.6, z1: -139.3 }] };
  // 原有构筑（锚点/程序化件）登记为固定，参与检查
  F7(out, '控制塔', -22, -100, 8, 5, y, 0, 6); F7(out, '器械架', -12, -96, 1.2, 0.6, y, 0, 2); F7(out, '器械架', 20, -96, 1.2, 0.6, y, 0, 2);
  F7(out, '格斗软垫区', 22.1, -104, 11, 12, y, 0, 0.1); F7(out, '母带拖车', 13, -98.5, 2.4, 4.6, y, -0.12, 1.4); F7(out, '急救柜', -29, -100, 1.6, 0.8, y, 0, 2.2);
  F7(out, '装备箱', -30.6, -106.35, 0.7, 1.4, y, 0, 1.1); F7(out, '收纳箱', -30.0, -110.7, 1.4, 0.8, y, 0, 0.6); F7(out, '东墙器械架', 31.5, -116, 0.5, 11, y, 0, 2.2); F7(out, '看台', 28.5, -138, 4.0, 18, y, 0, 2.0);
  F7(out, '射击台', 0, -141.4, 36.2, 1.4, y, 0, 1.07); F7(out, '体能障碍区', -25.75, -138, 10.5, 30, y, 0, 1.4); F7(out, '局徽地标', 0, -122, 9, 9, y, 0, 0.03);
  const PORT = []; for (let i = 0; i < 6; i++) { const a = -0.95 + i * 0.38, gx = Math.sin(a) * 30, gz = -102 - Math.cos(a) * 30; PORT.push([gx, gz, a]); F7(out, '副本门', gx, gz, 6.4, 2.0, y, -a, 8); }
  for (const [x, z] of [[-14, -116], [14, -116]]) F7(out, '路锥', x, z, 0.4, 0.4, y, 0, 0.5);
  // ① 检录台：主通道两侧各一组接待台（面朝通道）+ 凳 + 登记簿/电话/台灯 + 隔离带分流
  for (const sx of [-1, 1]) { const x = sx * 6.4, z = -96.6, yaw = sx < 0 ? ROT.W : ROT.E; // 使用侧 = 工作人员一侧（外侧）
    out.push({ m: 'office_desk', x, y, z, yaw, h: 0.76, tag: '检录台', on: 'floor', col: [0.91, 0.76, 1.93] });
    out.push({ m: 'r2/old_computer_chair', x: x + sx * 0.95, y, z: z + 0.2, yaw: yaw + Math.PI, h: 0.92, tag: '检录台', on: 'floor' });
    out.push({ m: 'r2/office_phone', x: x + sx * 0.2, y: y + 0.76, z: z - 0.6, yaw: yaw + Math.PI, w: 0.22, tag: '检录台', on: 'desk' });
    out.push({ m: 'r2/desk_bell', x: x - sx * 0.25, y: y + 0.76, z: z + 0.5, yaw: 0, w: 0.09, tag: '检录台', on: 'desk' });
    out.push({ m: 'r2/several_folders', x: x + sx * 0.1, y: y + 0.76, z: z + 0.05, yaw: yaw, h: 0.3, tag: '检录台', on: 'desk' });
    out.push({ m: 'r2/bankers_lamp', x: x + sx * 0.25, y: y + 0.76, z: z - 0.15, yaw: yaw + Math.PI, h: 0.4, tag: '检录台', on: 'desk' });
    out.push({ m: 'r2/plastic_crate_01', x: x + sx * 1.0, y, z: z - 0.9, yaw: 0.1, h: 0.3, tag: '检录台', on: 'floor' });
    pic(out, 'textures/b07/B07_副本投放调度单.png', x - sx * 0.0, y + 1.7, -92.25, Math.PI, 0.6, 0.8, 'black'); light(out, x, y + 3.2, z, 0xfff0d8, 1.6, 7); }
  stanchions(out, [[-2.9, -98.0], [-2.9, -101.0], [-2.9, -104.0]], y, '分流'); stanchions(out, [[2.9, -98.0], [2.9, -101.0], [2.9, -104.0]], y, '分流');
  // ② 战术简报区：控制塔成绩榜（南面）前 4 排 × 4 课桌（中间过道 x −22），讲台 + 立式黑板 + 投放调度单
  { let k = 0; for (const z of [-106.4, -108.2, -110.0, -111.8]) for (const x of [-25.9, -24.5, -19.5, -18.1]) { out.push({ m: 'r2/schooldesk_01', x, y, z, yaw: Math.PI, w: 0.7, tag: '简报区', on: 'floor', col: [0.7, 0.75, 0.5] }); if (k % 5 !== 3) out.push({ m: 'r2/schoolchair_01', x: x + (hash(x, z) - 0.5) * 0.08, y, z: z - 0.5, yaw: (hash(z, x) - 0.5) * 0.12, h: 0.82, tag: '简报区', on: 'floor' }); k++; } }
  out.push({ m: 'r2/lectern', x: -22, y, z: -104.0, yaw: Math.PI, h: 1.15, tag: '简报区', on: 'floor', col: [0.6, 1.15, 0.5] });
  out.push({ m: 'r2/standing_chalkboard_01', x: -16.4, y, z: -106.6, yaw: -2.2, h: 1.8, tag: '简报区', on: 'floor' });
  floorZ(out, 'r3_epoxy', -27.2, -16.6, -113.0, -103.2, y, { border: 0.12, bmat: 'r3_paintYellow' });
  for (const z of [-106, -111]) light(out, -22, y + 4.0, z, 0xfff2e0, 2.0, 9);
  // ③ 装备领用：领用柜台（两张金属桌拼接，工作人员在东侧）+ 东侧更衣柜一排 + 钢架（护具/弹药箱）+ 长凳
  for (const z of [-107.0, -109.0]) out.push({ m: 'office_desk', x: 7.6, y, z, yaw: ROT.E, h: 0.76, tag: '领用柜台', on: 'floor', col: [0.91, 0.76, 1.93] });
  for (const [z, m, sz] of [[-106.4, 'r2/metal_toolbox', { w: 0.42 }], [-107.4, 'r2/signal_flashlight', { w: 0.25 }], [-108.3, 'r2/binoculars', { w: 0.2 }], [-109.4, 'r2/medical_box', { w: 0.4 }]]) out.push({ m, x: 7.5, y: y + 0.76, z, yaw: ROT.W, ...sz, tag: '领用柜台', on: 'desk' });
  out.push({ m: 'r2/old_computer_chair', x: 8.5, y, z: -108.0, yaw: ROT.W, h: 0.92, tag: '领用柜台', on: 'floor' });
  for (let k = 0; k < 5; k++) out.push({ m: 'r2/locker_equipment', x: 12.7, y, z: -103.6 - k * 1.12, yaw: ROT.W, h: 1.9, tag: '更衣柜', on: 'floor', col: [0.5, 1.9, 1.1] });
  out.push({ m: 'r2/hallway_bench', x: 10.9, y, z: -106.0, yaw: 0, h: 0.45, tag: '更衣柜', on: 'floor', col: [0.4, 0.45, 1.6] });
  for (const z of [-110.9, -115.3]) { out.push({ m: 'r2/double_metal_shelving_unit', x: 11.6, y, z, yaw: ROT.W, h: 2.0, tag: '护具架', on: 'floor', col: [0.8, 2.0, 2.4] });
    for (const [dz, dy, m, sz] of [[-1.2, 0.42, 'r2/wooden_military_crate', { w: 0.8 }], [0.9, 0.42, 'r2/plastic_crate_03', { h: 0.3 }], [-0.4, 1.02, 'r2/plastic_crate_01', { h: 0.28 }], [0.5, 1.02, 'r2/metal_toolbox', { w: 0.45 }], [0, 1.6, 'r2/cardboard_transport_shipping_box', { w: 0.5 }]]) out.push({ m, x: 11.6, y: y + dy, z: z + dz, yaw: ROT.W + 0.05, ...sz, tag: '护具架', on: 'shelf' }); }
  out.push({ m: 'r2/hand_truck', x: 9.4, y, z: -116.6, yaw: 0.4, rx: 0.08, h: 1.2, tag: '护具架', on: 'floor' });
  floorZ(out, 'r3_epoxy', 6.6, 13.2, -117.8, -102.8, y, { border: 0.12, bmat: 'r3_paintYellow' });
  for (const z of [-105, -112]) light(out, 10, y + 4.0, z, 0xfff2e0, 2.0, 9);
  // ④ 副本门待命位：每扇门内侧 3.4 m 一个操作台（讲台式）+ 探照灯；ABY 门前改为封锁路障
  PORT.forEach(([gx, gz, a], i) => { const dx = -Math.sin(a), dz = Math.cos(a), tx = Math.cos(a), tz = Math.sin(a);
    if (i === 5) { for (const s of [-1.6, 1.6]) out.push({ m: 'r2/concrete_road_barrier', x: gx + dx * 3.0 + tx * s, y, z: gz + dz * 3.0 + tz * s, yaw: -a, w: 1.8, tag: 'ABY 封锁', on: 'floor', col: [1.8, 0.8, 0.6] }); return; }
    out.push({ m: 'r2/lectern', x: gx + dx * 3.4 + tx * 2.4, y, z: gz + dz * 3.4 + tz * 2.4, yaw: -a + Math.PI, h: 1.15, tag: '门前操作台', on: 'floor', col: [0.6, 1.15, 0.5] });
    out.push({ m: 'r2/portable_searchlight', x: gx + dx * 3.6 - tx * 2.6, y, z: gz + dz * 3.6 - tz * 2.6, yaw: -a + Math.PI, h: 1.4, tag: '门前操作台', on: 'floor' }); });
  wear(out, -2.0, 2.0, -117.5, -93.0, y);
  // ⑤ 射击区控制台（射击台东端后方）：桌 + 椅 + 电话 + 扩音器 + 望远镜；射击线后弹药箱
  out.push({ m: 'office_desk', x: 21.6, y, z: -139.2, yaw: 0, h: 0.76, tag: '射击控制台', on: 'floor', col: [1.93, 0.76, 0.91] });
  out.push({ m: 'r2/old_computer_chair', x: 21.6, y, z: -138.3, yaw: Math.PI, h: 0.92, tag: '射击控制台', on: 'floor' });
  out.push({ m: 'r2/rotary_telephone', x: 22.3, y: y + 0.76, z: -139.4, yaw: Math.PI, w: 0.22, tag: '射击控制台', on: 'desk' });
  out.push({ m: 'r2/megaphone_01', x: 21.0, y: y + 0.76, z: -139.3, yaw: 2.6, w: 0.3, tag: '射击控制台', on: 'desk' });
  out.push({ m: 'r2/vintage_binocular', x: 21.6, y: y + 0.76, z: -139.0, yaw: 0.3, w: 0.18, tag: '射击控制台', on: 'desk' });
  for (const x of [-15.75, -10.5, 10.5, 15.75]) out.push({ m: 'r2/metal_toolbox', x, y, z: -138.7, yaw: 0.1, w: 0.45, tag: '射击线', on: 'floor' });
  light(out, 21.6, y + 3.2, -139.0, 0xfff0d8, 1.6, 7);
  // ⑥ 医疗撤离点（急救柜旁）：担架床 + 轮椅 + 急救箱
  out.push({ m: 'r2/hospital_stretcher', x: -27.4, y, z: -103.2, yaw: 0, fit: [0.7, 0.9, 2.0], size: [0.7, 0.9, 2.0], tag: '医疗撤离点', on: 'floor', col: [0.7, 0.9, 2.0] });
  out.push({ m: 'r2/wheelchair_01', x: -29.2, y, z: -102.6, yaw: 0.6, h: 0.95, tag: '医疗撤离点', on: 'floor' });
  floorZ(out, 'r3_paintYellow', -30.6, -26.6, -105.0, -104.88, y);
  return { room, items: out };
}
// —— 地铁「管理局站」B 口地面广场（x −18…18，z 100…170，地面 y=−3.955）——
export function planMetro(y) {
  const out = []; const X0 = -19, X1 = 19, Z0 = 100, Z1 = 171;
  const room = { name: '地铁管理局站 B 口 · 地面广场（批次7）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H: 8, doors: [], windows: [],
    rooms: [['① 出站集散', 0, 152], ['② 机构安检亭', -9, 154], ['③ 公交站', 11, 165], ['④ 报刊/自助售卖', -11, 112], ['⑤ 流浪者角', -16, 104]],
    aisles: [{ label: '出站主通道（北）', x0: -2.8, x1: 2.8, z0: 145.4, z1: 170 }, { label: '南向步道', x0: -2.8, x1: 2.8, z0: 100, z1: 134.4 }] };
  F7(out, '出站厅', 0, 140, 8.8, 10.8, y, 0, 4.5); F7(out, '便利店', 15, 128, 7, 5, y, 0, 3.6); F7(out, '共享单车', -11.75, 127.6, 5.5, 4.6, y, 0, 1); F7(out, '站名柱', -6.4, 144.6, 0.8, 0.8, y, 0, 5.2);
  F7(out, '守则立牌', 3.6, 133.6, 0.8, 0.4, y, 0, 1.6); F7(out, '外卖车', 8.7, 146.5, 2.2, 1.8, y, 0.3, 1.2);
  for (const x of [-18, -15, -12, -9, 9, 12, 15, 18]) F7(out, '隔离墩', x, 118, 0.3, 0.3, y, 0, 0.95);
  // ① 出站集散：盲道（黄）从出站口北延；出口两侧垃圾桶 + 报刊旋转架 + 导向牌
  floorZ(out, 'r3_paintYellow', -0.2, 0.2, 145.6, 169.8, y); // 批次33：北段 100.2–134.2 已成沥青车道，盲道只留出站口南侧
  out.push({ m: 'r2/garbage_bin', x: -3.6, y, z: 147.2, yaw: 0, h: 1.0, tag: '出站集散', on: 'floor', col: [0.6, 1.0, 0.6] });
  out.push({ m: 'r2/concrete_trash_bin', x: 3.6, y, z: 147.6, yaw: 0, h: 0.9, tag: '出站集散', on: 'floor', col: [0.6, 0.9, 0.6] });
  out.push({ m: 'r2/news_rack_6080', x: 4.6, y, z: 151.0, yaw: 0, h: 1.48, tag: '出站集散', on: 'floor', col: [0.9, 1.48, 0.55] });
  pic(out, 'textures/b05/B05_地铁站名牌.png', 0, y + 3.7, 145.47, 0, 2.6, 0.96, 'black');
  // ② 机构安检亭（出站口西北）：岗亭 + 道闸路障 + 双人值守长凳 + 监控杆 + 门禁
  out.push({ m: 'r2/simple_90_s_kiosk', x: -10.2, y, z: 154.0, yaw: ROT.E, h: 2.6, tag: '安检亭', on: 'floor', col: [3.4, 2.6, 3.6] });
  for (const z of [151.4, 156.6]) out.push({ m: 'r2/concrete_road_barrier', x: -6.2, y, z, yaw: 0, w: 1.8, tag: '安检亭', on: 'floor', col: [1.8, 0.97, 0.74] });
  out.push({ m: 'r2/cctv_and_keypad_access_panel', x: -8.4, y: y + 1.2, z: 152.9, yaw: ROT.E, h: 0.3, tag: '安检亭', on: 'shelf' });
  out.push({ m: 'r2/fire_hydrant', x: -13.0, y, z: 150.4, yaw: 0.3, h: 0.8, tag: '安检亭', on: 'floor' });
  out.push({ m: 'r2/utility_box_01', x: -13.6, y, z: 158.6, yaw: ROT.E, h: 1.4, tag: '安检亭', on: 'floor', col: [0.6, 1.4, 1.0] });
  light(out, -10.2, y + 3.0, 154.0, 0xfff0d8, 1.6, 7);
  // ③ 公交站（东北，面朝南侧广场）+ 公用电话 + 自动售货机
  out.push({ m: 'r2/korean_public_payphone_01', x: 15.6, y, z: 160.4, yaw: ROT.W, h: 2.0, tag: '公交站', on: 'floor', col: [0.6, 2.0, 0.6] });
  for (const x of [8.6, 11.4]) out.push({ m: 'r2/park_bench', x, y, z: 165.6, yaw: Math.PI, w: 1.8, tag: '公交站', on: 'floor', col: [1.8, 0.9, 0.6] });
  out.push({ m: 'r2/concrete_trash_bin', x: 13.2, y, z: 165.8, yaw: 0, h: 0.9, tag: '公交站', on: 'floor', col: [0.45, 0.9, 0.55] });
  // 北侧花坛一排（广场北缘，分隔车行道）
  for (const x of [-14, -8, 8, 14]) { out.push({ box: 'stone', x, y: y + 0.3, z: 169.6, w: 3.0, h: 0.6, d: 1.2, tag: '花坛', on: 'partv' }); out.push({ box: 'stoneDark', x, y: y + 0.62, z: 169.6, w: 3.12, h: 0.06, d: 1.32, tag: '花坛压顶', on: 'partv' }); out.push({ box: 'dz_soil', x, y: y + 0.605, z: 169.6, w: 2.8, h: 0.01, d: 1.0, tag: '花坛', on: 'partv' }); F7(out, '花坛', x, 169.6, 3.0, 1.2, y, 0, 0.6); out.push({ m: 'r2/hedge_green_fence', x, y: y + 0.6, z: 169.6, yaw: Math.PI / 2, d: 2.7, size: [0.9, 0.7, 2.7], tag: '花坛绿篱', on: 'tree' }); } // 批次32：白盆栽 → 修剪绿篱（长轴 z → yaw 90° 沿 x）
  // ④ 南侧：锈报亭 + 报纸堆 + 灯箱（规则之泉 / 篇幅补充剂 / 午夜地铁剪报）
  out.push({ m: 'r2/rusty_kiosk_01', x: -11.0, y, z: 111.6, yaw: ROT.E, h: 2.6, tag: '报亭', on: 'floor', col: [2.0, 2.6, 2.0] });
  out.push({ m: 'r2/cc0_newspaper_stack_ready_to_unity_hdrp', x: -9.4, y, z: 110.4, yaw: 0.3, w: 0.5, tag: '报亭', on: 'floor' });
  out.push({ m: 'r2/garbage_bin', x: -9.2, y, z: 113.6, yaw: 0, h: 1.0, tag: '报亭', on: 'floor', col: [0.6, 1.0, 0.6] });
  for (const [x, z, p, yaw] of [[11.4, 107.0, 'textures/b01/B01_08_海报_规则之泉.png', ROT.W], [11.4, 113.0, 'textures/b05/B05_海报_篇幅补充剂.png', ROT.W]]) {
    out.push({ box: 'blackMetal', x: x + 0.12, y: y + 1.25, z, w: 0.22, h: 2.5, d: 1.3, tag: '灯箱', on: 'partv' }); F7(out, '灯箱', x + 0.12, z, 0.3, 1.3, y, 0, 2.5);
    pic(out, p, x - 0.0, y + 1.4, z, yaw, 1.0, 1.5, 'none'); light(out, x - 0.8, y + 1.6, z, 0xfff4e0, 0.9, 4); }
  pic(out, 'textures/emblems/N16.jpg', -10.0, y + 1.6, 112.6, ROT.E, 0.6, 0.4, 'cork', { cork: [0.8, 0.6] });
  // ⑥ 行道树池 + 背靠树池的长椅（南向步道两侧成排；北侧东半段）——把空旷铺装分成有尺度的步行带
  // 批次32：花池（黑台座 + 白盆栽，廉价）→ surface.js 行道树池（铸铁箅子 + 蓝花楹），此处只留占地框
  for (const [x, z] of [[-7, 104], [-7, 110], [-7, 116], [-7, 122], [-7, 128], [7, 104], [7, 110], [7, 116], [7, 122], [7, 128], [7, 152], [7, 158]]) F7(out, '行道树池', x, z, 1.6, 1.6, y, 0, 0.1);
  for (const sx of [-1, 1]) for (const z of [107, 113, 119, 125]) out.push({ m: 'r2/park_bench', x: sx * 6.6, y, z, yaw: sx < 0 ? ROT.E : ROT.W, w: 1.8, tag: '长椅', on: 'floor', col: [0.57, 0.85, 1.8] });
  for (const z of [116, 128]) for (const sx of [-1, 1]) light(out, sx * 7, y + 3.4, z, 0xffe0b0, 1.2, 8);
  // ⑤ 流浪者角（西南角，靠墙暗处）：桶炉 + 旧自行车 + 纸箱 + 街鼠
  out.push({ m: 'r2/barrel_stove', x: -16.4, y, z: 103.2, yaw: 0, h: 1.0, tag: '流浪者角', on: 'floor', col: [0.62, 1.0, 0.62] });
  out.push({ m: 'r2/old_bicycle', x: -16.8, y, z: 106.4, yaw: 0.1, h: 1.0, tag: '流浪者角', on: 'floor' });
  out.push({ m: 'r2/old_paper_cardboard_boxes', x: -14.6, y, z: 101.6, yaw: 0.4, w: 0.9, tag: '流浪者角', on: 'floor', col: [0.9, 0.5, 0.7] });
  out.push({ m: 'r2/street_rat', x: -15.2, y, z: 104.8, yaw: 2.0, w: 0.25, tag: '流浪者角', on: 'floor' });
  light(out, -16.4, y + 1.4, 103.2, 0xff9a50, 1.4, 5);
  // 井盖、配电箱、长椅（面朝出站口）
  for (const [x, z] of [[6.5, 136.0], [-6.0, 122.0], [10.0, 155.0]]) out.push({ m: 'r2/manhole_a65739', x, y: y + 0.005, z, yaw: x, w: 0.8, tag: '井盖', on: 'decal' });
  for (const x of [-13.5, 13.5]) out.push({ m: 'r2/park_bench', x, y, z: 138.0, yaw: x < 0 ? ROT.E : ROT.W, w: 1.8, tag: '长椅', on: 'floor', col: [0.7, 0.9, 1.8] });
  wear(out, -2.4, 2.4, 146.0, 168.0, y); wear(out, -2.4, 2.4, 101.0, 133.0, y);
  return { room, items: out };
}
// —— 无字碑廊（x −76…−50，z 2…44，地面 y≈0.08）：补石天使 / 花瓮 / 烛台 / 长椅 / 低位地灯 ——
export function planMemorial(y) {
  const out = []; const X0 = -76, X1 = -50, Z0 = 2, Z1 = 44;
  const room = { name: '无字碑廊（批次7 补强）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H: 6, doors: [{ wall: 'N', a: -64.6, b: -61.4, label: '入口（主碑）' }], windows: [],
    rooms: [['碑阵 西', -70, 24], ['碑阵 东', -56, 24], ['十字路口', -63, 23]], aisles: [{ label: '中轴', x0: -64.6, x1: -61.4, z0: 2, z1: 44 }, { label: '横路', x0: -76, x1: -50, z0: 21.8, z1: 24.2 }] };
  for (let r = 0; r < 7; r++) for (let k = 0; k < 8; k++) { const z = 40 - r * 5 - (r >= 4 ? 2.4 : 0), x = k < 4 ? -73.5 + k * 2.4 : -59.8 + (k - 4) * 2.4; F7(out, '碑', x, z, 1.2, 0.7, y, 0, 1.9); }
  // 横路两端：石天使（面朝十字路口）+ 花瓮
  out.push({ m: 'r2/stone_angel', x: -75.2, y, z: 26.2, yaw: ROT.E, h: 2.0, tag: '石天使', on: 'floor', col: [0.9, 2.0, 0.9] });
  out.push({ m: 'r2/stone_angel', x: -50.8, y, z: 26.2, yaw: ROT.W, h: 2.0, tag: '石天使', on: 'floor', col: [0.9, 2.0, 0.9] });
  for (const [x, z] of [[-65.4, 42.6], [-60.6, 42.6], [-75.2, 20.0], [-50.8, 20.0]]) out.push({ m: 'r2/ornamental_urn_planter', x, y, z, yaw: 0, h: 0.9, tag: '花瓮', on: 'floor', col: [0.6, 0.9, 0.6] });
  // 横路两侧：长椅（背靠碑阵，面朝横路）
  for (const x of [-69.9, -56.2]) out.push({ m: 'r2/park_bench', x, y, z: 20.9, yaw: 0, w: 1.8, tag: '长椅', on: 'floor', col: [1.8, 0.85, 0.57] });
  // 第一排碑前的铜烛台（悼念痕迹）
  for (const [x, z] of [[-73.5, 40.9], [-66.3, 40.9], [-57.4, 40.9], [-52.6, 40.9], [-68.7, 18.6 + 0.9]]) out.push({ m: 'r2/brass_candleholders', x, y, z, yaw: x, h: 0.3, tag: '烛台', on: 'floor' });
  for (const [x, z] of [[-73.5, 40.9], [-57.4, 40.9], [-68.7, 19.5]]) light(out, x, y + 0.6, z, 0xffb060, 0.6, 3);
  // 横路低位地灯（石柱 + 灯罩）
  for (const x of [-73, -69, -57, -53]) { out.push({ box: 'stoneDark', x, y: y + 0.3, z: 21.6, w: 0.18, h: 0.6, d: 0.18, tag: '地灯', on: 'partv' }); out.push({ box: 'dz_glow', x, y: y + 0.62, z: 21.6, w: 0.14, h: 0.06, d: 0.14, tag: '地灯', on: 'partv' }); light(out, x, y + 0.8, 21.6, 0xffd8a0, 0.7, 4); }
  pic(out, 'textures/emblems/N27.jpg', -66.6, y + 1.5, 43.7, Math.PI, 1.2, 0.68, 'black', { stand: true, fy: y });
  return { room, items: out };
}
// —— 第七局 · 作战室（x −9.8…9.8，z −133.8…−112.2，层高 6）——
export function planS7Ops(y) {
  const out = []; const X0 = -9.8, X1 = 9.8, Z0 = -133.8, Z1 = -112.2, H = 6;
  const room = { name: '第七局 · 作战室（批次7）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H, doors: [{ wall: 'N', a: -2.2, b: 2.2, label: '门（← 装订线回廊）' }], windows: [],
    rooms: [['① 通讯台', 8.4, -116], ['② 军械 · 补给', 8.4, -129.6], ['③ 地图作业台', 2.3, -128.4], ['K 的桌', -6, -126], ['档案柜', -9, -116]],
    aisles: [{ label: '入口通道', x0: -1.6, x1: 1.6, z0: -116.6, z1: -112.2 }] };
  F7(out, 'K 的桌椅', -6, -125.7, 2.6, 1.9, y, 0, 0.8); F7(out, '会商长桌+椅', 3.9, -120, 11.0, 5.4, y, 0, 0.8);
  F7(out, '档案柜列', -9.4, -116.3, 0.7, 5.2, y, 0, 1.4); F7(out, '内鬼墙', 9.6, -123, 0.3, 6, y, 0, 0.1);
  // ① 通讯台：东墙南段两张桌（人面朝东墙）+ 电台 / 野战电话 / 便携打字机 / 满烟灰缸 + 木椅；门边西门子墙式内线
  for (const [k, z] of [[0, -113.6], [1, -115.6]]) { out.push({ m: 'r2/woodentable_02', x: 9.25, y, z, yaw: ROT.W, h: 0.78, tag: '通讯台', on: 'floor', col: [0.9, 0.78, 1.8] });
    out.push({ m: 'r2/woodenchair_01', x: 8.3, y, z: z + 0.1, yaw: ROT.E + (k ? 0.15 : -0.1), h: 0.95, tag: '通讯台', on: 'floor' }); }
  out.push({ m: 'r2/vintage_radio_transceiver', x: 9.4, y: y + 0.78, z: -113.3, yaw: ROT.W, w: 0.5, tag: '通讯台', on: 'shelf' });
  out.push({ m: 'r2/ww2_german_field_telephone_equipment', x: 9.3, y: y + 0.78, z: -114.1, yaw: ROT.W, w: 0.3, tag: '通讯台', on: 'shelf' });
  out.push({ m: 'r2/underwood_4_bank_typewriter_portable', x: 9.2, y: y + 0.78, z: -115.5, yaw: ROT.W, w: 0.4, tag: '通讯台', on: 'shelf' });
  out.push({ m: 'r2/ptish_exceptionally_full_ashtray', x: 9.5, y: y + 0.78, z: -116.2, yaw: 0, w: 0.15, tag: '通讯台', on: 'shelf' });
  out.push({ m: 'r2/siemens_and_halske_1910', x: 3.4, y: y + 1.45, z: Z1 - 0.22, yaw: Math.PI, h: 0.5, tag: '通讯台', on: 'wall' });
  pic(out, 'textures/b07/B07_封锁调度单.png', 9.77, y + 1.9, -114.6, ROT.W, 0.6, 0.8, 'cork', { cork: [0.8, 1.0] });
  // ② 军械 · 补给（东墙北段）：铁皮柜 ×3（步枪/手枪/弹药）+ 军用木箱 + 绿油桶 + 防毒面具
  for (const z of [-127.6, -128.7, -129.8]) out.push({ m: 'r2/metal_storage_cabinet', x: 9.45, y, z, yaw: ROT.W, h: 1.9, tag: '军械柜', on: 'floor', col: [0.6, 1.9, 1.0] });
  out.push({ m: 'r2/wooden_military_crate', x: 9.1, y, z: -131.6, yaw: ROT.W, w: 0.9, tag: '补给', on: 'floor', col: [0.38, 0.34, 0.9] });
  out.push({ m: 'r2/wooden_military_crate', x: 9.1, y: y + 0.34, z: -131.6, yaw: ROT.W + 0.1, w: 0.9, tag: '补给', on: 'shelf' });
  for (const [x, z] of [[9.3, -133.2], [8.75, -133.3], [8.2, -133.25]]) out.push({ m: 'r2/metal_jerrycan_green', x, y, z, yaw: 0.05, h: 0.46, tag: '补给', on: 'floor' });
  out.push({ m: 'r2/bolt_action_rifle_7_62', x: 9.7, y: y + 0.6, z: -126.6, yaw: ROT.W, rz: 1.45, w: 1.1, tag: '军械柜', on: 'shelf' });
  out.push({ m: 'r2/long_life_food', x: 6.9, y, z: -133.1, yaw: 0.2, w: 0.5, tag: '补给', on: 'floor' });
  // ③ 地图作业台（会商长桌与危机看板之间）：两张长木桌拼成 + 折叠凳 ×6 + 罗盘 / 望远镜 / 地图
  for (const x of [1.25, 3.35]) out.push({ m: 'r2/woodentable_03', x, y, z: -128.4, yaw: 0, h: 0.78, tag: '地图台', on: 'floor', col: [1.25, 0.78, 0.55] });
  out.push({ box: 'r3_mapPaper', x: 2.3, y: y + 0.785, z: -128.4, w: 3.4, h: 0.004, d: 0.8, tag: '地图台', on: 'partv' });
  for (const [x, z, r] of [[0.6, -127.4, 0.2], [2.3, -127.3, -0.1], [4.0, -127.4, 0.3], [0.8, -129.5, 2.9], [2.4, -129.6, 3.3], [3.9, -129.4, 3.0]]) out.push({ m: 'r2/folding_wooden_stool', x, y, z, yaw: r, h: 0.45, tag: '地图台', on: 'floor' });
  out.push({ m: 'r2/seadogs_compass', x: 1.4, y: y + 0.79, z: -128.2, yaw: 0.4, w: 0.16, tag: '地图台', on: 'shelf' });
  out.push({ m: 'r2/binoculars', x: 3.6, y: y + 0.79, z: -128.6, yaw: 1.2, w: 0.2, tag: '地图台', on: 'shelf' });
  out.push({ m: 'r2/glass_ashtray', x: 2.9, y: y + 0.79, z: -128.1, yaw: 0, w: 0.12, tag: '地图台', on: 'shelf' });
  // ④ 休整角（西南，入口西侧）：双层铁床 ×2（床头靠南隔墙）+ 储物柜 ×2 + 小桌（收音机/保温壶）——与外界隔绝的值守常驻
  for (const x of [-6.9, -4.3]) out.push({ m: 'r2/simple_bunk_bed', x, y, z: Z1 - 0.66, yaw: 0, h: 1.75, tag: '休整角', on: 'floor', col: [1.96, 1.75, 1.22] });
  for (const x of [-7.2, -6.1]) out.push({ m: 'r2/locker_equipment', x, y, z: -120.6, yaw: 0, h: 1.9, tag: '休整角', on: 'floor', col: [1.1, 1.9, 0.47] });
  out.push({ m: 'r2/small_wooden_table_01', x: -4.6, y, z: -117.4, yaw: 0.1, h: 0.72, tag: '休整角', on: 'floor', col: [0.8, 0.72, 0.6] });
  out.push({ m: 'r2/vintage_radio', x: -4.75, y: y + 0.72, z: -117.45, yaw: 0.2, w: 0.36, tag: '休整角', on: 'shelf' });
  out.push({ m: 'r2/modified_thermos', x: -4.3, y: y + 0.72, z: -117.3, yaw: 0, h: 0.3, tag: '休整角', on: 'shelf' });
  for (const [x, z, r] of [[-5.3, -116.6, 0.6], [-3.9, -118.1, 2.6]]) out.push({ m: 'r2/folding_wooden_stool', x, y, z, yaw: r, h: 0.45, tag: '休整角', on: 'floor' });
  light(out, -5.6, y + 2.6, -116.0, 0xffcf98, 1.4, 6);
  // 西墙：衣帽架（礼帽）+ 立式黑板（K 的推演）+ 第七局徽 N02 + 地堡灯
  out.push({ m: 'r2/coat_rack_bowler_hat', x: -9.2, y, z: -120.4, yaw: ROT.E, h: 1.85, tag: '西墙', on: 'floor' });
  out.push({ m: 'r2/standing_chalkboard_01', x: -8.0, y, z: -130.6, yaw: 0.7, h: 1.8, tag: '西墙', on: 'floor' });
  pic(out, 'textures/b06/B06_K的工作笔记.png', -9.77, y + 1.7, -128.4, ROT.E, 0.6, 0.8, 'cork', { cork: [0.8, 1.0] });
  pic(out, 'textures/emblems/N02.jpg', -4.6, y + 4.2, Z0 + 0.22, 0, 1.0, 1.0, 'black');
  for (const [x, z, yaw] of [[X1 - 0.18, -117.8, ROT.W], [X1 - 0.18, -126.2, ROT.W], [X0 + 0.18, -122.6, ROT.E], [X0 + 0.18, -131.2, ROT.E]]) out.push({ m: 'r2/bunker_lamps', x, y: y + 2.8, z, yaw, h: 0.3, tag: '地堡灯', on: 'wall' });
  for (const [x, z] of [[8.4, -115], [8.4, -129.6], [2.3, -128.4], [-8.4, -129.0]]) light(out, x, y + 2.8, z, 0xffd0a0, 1.6, 7);
  floorZ(out, 'dz_rugRed', -0.9, 5.5, -130.2, -126.6, y, {}); out[out.length - 1].box = 'r3_carpetBrown';
  return { room, items: out };
}
// —— 第七局 · 杀青室（x −7.8…7.8，z −157.8…−134.2，层高 5.4）——
export function planS7Wrap(y) {
  const out = []; const X0 = -7.8, X1 = 7.8, Z0 = -157.8, Z1 = -134.2, H = 5.4;
  const room = { name: '第七局 · 杀青室（批次7）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H, doors: [{ wall: 'N', a: -1.4, b: 1.4, label: '门（← 作战室）' }], windows: [],
    rooms: [['档案列 西', -6.8, -146], ['档案列 东', 6.8, -146], ['空白档案袋台', 0, -146], ['落地镜', 0, -157]], aisles: [{ label: '中轴（门 → 档案袋台）', x0: -1.2, x1: 1.2, z0: -144.9, z1: -134.2 }] };
  for (let r = 0; r < 4; r++) for (const sx of [-1, 1]) F7(out, '书脊架', sx * 7.4, -138 - r * 4.6, 0.6, 3.6, y, 0, 4.4);
  F7(out, '档案袋台', 0, -146, 3.4, 0.9, y, 0, 0.9); for (let k = 0; k < 6; k++) F7(out, '木凳', -1.6 + (k % 2) * 3.2, -138 - Math.floor(k / 2) * 6, 0.5, 0.5, y, 0, 0.45);
  F7(out, '落地镜', 0, -157.6, 1.5, 0.2, y, 0, 2.6);
  // 档案列之间：滑梯（木梯靠架）、档案盒推车、地上待归档盒
  for (const [x, z] of [[-5.9, -144.9], [5.9, -140.3], [-5.9, -154.1]]) { out.push({ m: 'r2/filing_box', x, y, z, yaw: x * 0.3, w: 0.4, tag: '待归档', on: 'floor', col: [0.4, 0.3, 0.32] }); out.push({ m: 'r2/filing_box', x: x + 0.02, y: y + 0.3, z: z + 0.03, yaw: x * 0.3 + 0.2, w: 0.4, tag: '待归档', on: 'shelf' }); }
  out.push({ m: 'r2/simple_warehouse_pallet_hand_truck', x: 4.6, y, z: -152.4, yaw: 0.3, w: 0.7, tag: '档案列', on: 'floor' });
  // 档案袋台：两盏维多利亚台灯 + 铜烛台 + 印章
  for (const x of [-1.4, 1.4]) out.push({ m: 'r2/victorian_desk_lamp', x, y: y + 0.9, z: -146.3, yaw: Math.PI, h: 0.45, tag: '档案袋台', on: 'desk' });
  out.push({ m: 'r2/old_victorian_rubber_stamp', x: 0.5, y: y + 0.9, z: -145.75, yaw: 0.4, h: 0.1, tag: '档案袋台', on: 'desk' });
  for (const x of [-1.4, 1.4]) light(out, x, y + 1.6, -146.3, 0xffd49a, 1.2, 5);
  // 南墙：镜旁 N27（橡皮擦）、杀青室档案墙；北门内 柒字徽
  pic(out, 'textures/emblems/N27.jpg', 2.6, y + 1.7, Z0 + 0.03, 0, 1.2, 0.68, 'black');
  pic(out, 'textures/b06/B06_杀青室档案墙.png', -2.6, y + 1.7, Z0 + 0.03, 0, 0.9, 1.2, 'wood');
  for (const z of [-140, -152]) light(out, 0, y + 4.2, z, 0xe8d8b8, 1.6, 9);
  return { room, items: out };
}
// —— 墨渊 · 倒悬书城街道（x −12…12，z −186…−86）+ 漂浮文件柜阵列 ——
export function planAbyssCity(y) {
  const out = []; const X0 = -12, X1 = 12, Z0 = -186, Z1 = -86;
  const room = { name: '墨渊 · 倒悬书城（批次7）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H: 20, doors: [], windows: [],
    rooms: [['西侧 被改写的机构', -10.5, -110], ['东侧 被改写的机构', 10.5, -110]], aisles: [{ label: '纸页大街', x0: -8.2, x1: 8.2, z0: -186, z1: -86 }] };
  for (let z = -92; z > -182; z -= 10) for (const sx of [-1, 1]) F7(out, '书签灯柱', sx * 9, z, 0.3, 0.3, y, 0, 4.2);
  const C = [-97, -107, -117, -127, -137, -147, -157, -165];
  C.forEach((z, k) => { for (const sx of [-1, 1]) { const x = sx * 10.6, t = (k + (sx > 0 ? 1 : 0)) % 4, tag = '被改写的机构';
    if (t === 0) { out.push({ m: 'r2/dusty_bookshelfs', x: sx * 11.2, y, z, yaw: sx < 0 ? ROT.E : ROT.W, rz: sx * 0.12, h: 2.6, tag, on: 'floor', col: [0.6, 2.6, 1.2] }); out.push({ m: 'r2/medieval_book_stack', x: x - sx * 1.0, y, z: z + 0.9, yaw: z, h: 0.5, tag, on: 'floor' }); }
    if (t === 1) { out.push({ m: 'r2/lectern', x, y, z, yaw: sx < 0 ? ROT.E : ROT.W, h: 1.15, tag, on: 'floor', col: [0.6, 1.15, 0.5] }); out.push({ m: 'r2/old_typewriter', x, y: y + 1.15, z, yaw: sx < 0 ? ROT.E : ROT.W, w: 0.4, tag, on: 'shelf' }); out.push({ m: 'r2/iron_chain', x, y: y + 1.0, z: z + 0.2, yaw: 0.4, h: 0.7, tag, on: 'shelf' }); out.push({ m: 'r2/medieval_candelabra_free_download', x, y, z: z + 1.3, yaw: 0, h: 1.6, tag, on: 'floor', col: [0.5, 1.6, 0.5] }); light(out, x, y + 1.9, z + 1.3, 0xffb060, 1.6, 6); }
    if (t === 2) { out.push({ m: 'r2/dead_tree_trunk', x: sx * 11.0, y, z, yaw: Math.PI / 2, w: 3.4, tag, on: 'floor', col: [0.35, 0.35, 3.4] }); out.push({ m: 'r2/rock_moss_set_02', x: x - sx * 0.6, y, z: z + 2.3, yaw: z * 2, w: 1.2, tag, on: 'floor' }); }
    if (t === 3) { out.push({ m: 'r2/rusty_filing_cabinet', x, y, z, yaw: sx < 0 ? ROT.E : ROT.W, rz: sx * 1.5, h: 1.3, tag, on: 'decal' }); out.push({ m: 'r2/barrel_01', x: x + sx * 0.4, y, z: z - 1.2, yaw: z, h: 0.9, tag, on: 'floor', col: [0.6, 0.9, 0.6] }); out.push({ m: 'r2/barrel_02', x: x + sx * 0.5, y, z: z - 1.9, yaw: z * 3, h: 0.9, tag, on: 'floor', col: [0.6, 0.9, 0.6] }); out.push({ m: 'r2/candelabra', x: x - sx * 0.6, y, z: z + 1.4, yaw: 0, h: 1.3, tag, on: 'floor' }); light(out, x - sx * 0.6, y + 1.5, z + 1.4, 0xffb060, 1.4, 6); } } });
  // 漂浮文件柜阵列（街道上空 7–14 m，缓慢倾斜，成排「错位」）
  for (let k = 0; k < 18; k++) { const z = -96 - k * 4.8, x = ((k * 37) % 13) - 6, yy = 7 + ((k * 53) % 70) / 10; out.push({ m: k % 3 ? 'file_cabinet' : 'r2/rusty_filing_cabinet', x, y: y + yy, z, yaw: k * 0.7, rx: ((k % 5) - 2) * 0.25, rz: ((k % 3) - 1) * 0.4, h: 1.32, tag: '漂浮文件柜', on: 'ceil' }); }
  for (const z of [-102, -132, -162]) out.push({ m: 'r2/medieval_chandelier', x: 0, y: y + 9.0, z, yaw: z, h: 1.6, tag: '烛火吊灯', on: 'ceil' });
  for (const z of [-102, -132, -162]) light(out, 0, y + 8.4, z, 0xffb060, 2.4, 14);
  return { room, items: out };
}
// —— 墨渊 · 考场母本（x −70…−14，z −162…−118）：监考台 + 烛台 + 错乱挂钟 ——
export function planAbyssExam(y) {
  const out = []; const X0 = -70, X1 = -14, Z0 = -162, Z1 = -118;
  const room = { name: '墨渊 · 考场母本（批次7）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H: 8, doors: [{ wall: 'E', a: -160, b: -120, label: '→ 倒悬书城' }], windows: [],
    rooms: [['监考台', -43.6, -121.4]], aisles: [] };
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) F7(out, '考桌椅', -22 - c * 5.4, -124 - r * 3.6 + 0.3, 1.25, 1.6, y, 0, 0.9);
  F7(out, '黑板', -24, -120.2, 10, 0.3, y, 0, 3.2);
  out.push({ m: 'r2/antique_desk', x: -43.6, y, z: -121.0, yaw: Math.PI, w: 1.6, tag: '监考台', on: 'floor', col: [1.6, 0.78, 0.8] });
  out.push({ m: 'r2/worn_leather_office_chair', x: -43.6, y, z: -119.9, yaw: Math.PI, h: 1.0, tag: '监考台', on: 'floor' });
  out.push({ m: 'r2/1800s_kerosene_desk_lamps_type_b', x: -44.2, y: y + 0.78, z: -121.1, yaw: 0, h: 0.45, tag: '监考台', on: 'shelf' });
  out.push({ m: 'r2/mantel_clock_01', x: -43.0, y: y + 0.78, z: -121.0, yaw: Math.PI, h: 0.28, tag: '监考台', on: 'shelf' });
  for (const sx of [-1, 1]) { out.push({ m: 'r2/medieval_candelabra_free_download', x: -43.6 + sx * 1.6, y, z: -120.8, yaw: 0, h: 1.6, tag: '监考台', on: 'floor', col: [0.5, 1.6, 0.5] }); light(out, -43.6 + sx * 1.6, y + 1.9, -120.8, 0xffb060, 1.8, 6); }
  for (const [x, z] of [[-24.7, -137.8], [-40.9, -137.8], [-57.1, -137.8], [-30.1, -152.2], [-46.3, -152.2]]) { out.push({ m: 'r2/candelabra', x, y, z, yaw: x, h: 1.3, tag: '巡考烛台', on: 'floor' }); light(out, x, y + 1.5, z, 0xffb060, 1.2, 6); }
  for (const [k, x] of [-30, -43.6, -57].entries()) out.push({ m: 'r2/vintage_wall_clock', x, y: y + 4.6, z: -119.0, yaw: k * 0.4, rz: (k - 1) * 0.5, h: 0.8, tag: '错乱挂钟', on: 'ceil' });
  return { room, items: out };
}
Object.assign(PLANS, { training: (Y) => fixYaw(planTraining(Y)), metro: (Y) => fixYaw(planMetro(Y)), memorial: (Y) => fixYaw(planMemorial(Y)), s7_ops: (Y) => fixYaw(planS7Ops(Y)), s7_wrap: (Y) => fixYaw(planS7Wrap(Y)), abyss_city: (Y) => fixYaw(planAbyssCity(Y)), abyss_exam: (Y) => fixYaw(planAbyssExam(Y)) });
Object.assign(R3, { training: true, metro: true, memorial: true, s7_ops: true, s7_wrap: true, abyss_city: true, abyss_exam: true });
// —— B5 深库主室（金库门内，x −14…14，z −134…−100，层高 7）：补「黑空间」——值守台、收容法阵隔离带、北墙装甲柜列、转运车、灯槽 ——
export function planB5Deep(y) {
  const out = []; const X0 = -14, X1 = 14, Z0 = -134, Z1 = -100, H = 7;
  const room = { name: 'B5 · 深库主室（批次7 补全）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H, doors: [{ wall: 'S', a: -2.4, b: 2.4, label: '圆形金库门' }], windows: [],
    rooms: [['值守台', 4.4, -102.2], ['收容法阵', 0, -117], ['装甲柜列', 0, -132.8]], aisles: [{ label: '金库门内通道', x0: -1.6, x1: 1.6, z0: -112, z1: -100.4 }] };
  for (const [x, z] of [[-9, -108], [9, -108], [-9, -118], [9, -118], [-9, -128], [9, -128]]) F7(out, '单件收容室', x, z, 6, 8, y, 0, 3);
  F7(out, '收容法阵', 0, -117, 7.2, 7.2, y, 0, 0.02);
  // 值守台（门内东侧，面朝门与法阵）：金属桌 + 椅 + 监视器 + 电话 + 登记簿；对面 双喇叭警报 + 铁皮柜
  out.push({ m: 'office_desk', x: 4.4, y, z: -102.4, yaw: ROT.W, h: 0.76, tag: '值守台', on: 'floor', col: [0.91, 0.76, 1.93] });
  out.push({ m: 'r2/old_computer_chair', x: 5.3, y, z: -102.4, yaw: ROT.W + Math.PI, h: 0.92, tag: '值守台', on: 'floor' });
  out.push({ m: 'monitor', x: 4.3, y: y + 0.76, z: -102.9, yaw: ROT.E, h: 0.42, tag: '值守台', on: 'desk' });
  out.push({ m: 'r2/office_phone', x: 4.2, y: y + 0.76, z: -101.8, yaw: ROT.E, w: 0.22, tag: '值守台', on: 'desk' });
  out.push({ m: 'r2/bankers_lamp', x: 4.15, y: y + 0.76, z: -103.25, yaw: ROT.E, h: 0.4, tag: '值守台', on: 'desk' });
  out.push({ m: 'r2/metal_storage_cabinet', x: -4.4, y, z: -100.75, yaw: 0, h: 1.9, tag: '值守台', on: 'floor', col: [1.0, 1.9, 0.65] });
  pic(out, 'textures/b07/B07_分级收容制度.png', -2.9, y + 1.8, Z1 - 0.42, Math.PI, 0.6, 0.8, 'black');
  pic(out, 'textures/b07/B07_畸变物上交须知.png', 2.9, y + 1.8, Z1 - 0.42, Math.PI, 0.6, 0.8, 'black');
  // 法阵四周铜立柱隔离带（八角）
  { const pts = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; pts.push([Math.cos(a) * 4.3, -117 + Math.sin(a) * 4.3]); } stanchions(out, pts, y, '法阵隔离带'); }
  // 北墙：装甲柜 / 保险柜列（正面朝南）+ 转运车 + 气体灭火瓶
  for (const [k, x] of [-4.2, -3.0, -1.8, 1.8, 3.0, 4.2].entries()) out.push({ m: k % 3 === 1 ? 'r2/safe_hw' : 'r2/metal_storage_cabinet', x, y, z: Z0 + (k % 3 === 1 ? 0.56 : 0.36), yaw: 0, h: k % 3 === 1 ? 1.2 : 1.9, tag: '装甲柜列', on: 'floor', col: k % 3 === 1 ? [1.17, 1.2, 1.04] : [1.03, 1.9, 0.64] });
  out.push({ m: 'r2/safe_vault', x: 0, y, z: Z0 + 0.82, yaw: 0, h: 1.6, tag: '装甲柜列', on: 'floor', col: [1.6, 1.6, 1.6] });
  out.push({ m: 'r2/tool_cart', x: 2.6, y, z: -130.6, yaw: 0.3, w: 0.9, tag: '装甲柜列', on: 'floor', col: [0.9, 0.7, 0.7] });
  for (const x of [-5.6, 5.6]) out.push({ m: 'r2/fire_extinguisher_5676b1', x, y, z: Z0 + 0.3, yaw: 0, h: 0.9, tag: 'K3', on: 'floor' });
  // 灯：中轴吸顶灯槽每 4 m（冷白）+ 各收容室门前补光 + 北墙柜列补光
  for (let z = -102; z > -133; z -= 4) troffer(out, 0, z, y, H, 0, 1.6, { cold: true });
  for (const [x, z] of [[-5.4, -108], [5.4, -108], [-5.4, -118], [5.4, -118], [-5.4, -128], [5.4, -128]]) light(out, x, y + 3.2, z, 0xe8eeff, 3.2, 9);
  for (const z of [-104, -112, -122, -130]) light(out, 0, y + 4.5, z, 0xfff0dc, 2.6, 11);
  light(out, 0, y + 3.0, -131.0, 0xffe2c0, 2.0, 9); light(out, 4.4, y + 2.4, -102.4, 0xfff0d8, 1.4, 5);
  floorZ(out, 'r3_epoxy', -1.6, 1.6, -112.8, -100.4, y, { border: 0.1, bmat: 'r3_paintYellow' }); floorZ(out, 'r3_epoxy', -1.6, 1.6, -133.4, -121.2, y, { border: 0.1, bmat: 'r3_paintYellow' });
  wear(out, -1.2, 1.2, -112.4, -100.6, y);
  return { room, items: out };
}
Object.assign(PLANS, { b5_deep: (Y) => fixYaw(planB5Deep(Y)) }); Object.assign(R3, { b5_deep: true });

// ================= R3 批次8：大空间中间层次（训练场 / 地铁口）=================
// 原则：远景不空 → 结构（壁柱/桁架）+ 顶部吊挂（工矿灯/电缆桥架/局旗）+ 地面标线（安全弧线/分区框/斑马警示）+ 隔离栏 + 成组陈设（托盘/油桶/路锥）
const X8 = {
  training(out, y) {
    const H = 16;
    // ① 结构壁柱：东西墙每 8 m、南墙每 8 m（清水混凝土 + 黄色防撞护角 + 铁件柱头 + 地堡壁灯）；避让东墙器械架 z −121.5…−110.5
    const pil = (x, z, w, d, lampYaw) => { wallBox(out, 'concrete', x, z, w, d, y, H - 0.2, '结构壁柱'); out.push({ box: 'r3_paintYellow', x, y: y + 0.45, z, w: w + 0.04, h: 0.9, d: d + 0.04, tag: '结构壁柱', on: 'partv' });
      out.push({ box: 'blackMetal', x, y: y + H - 1.6, z, w: w + 0.2, h: 0.5, d: d + 0.2, tag: '结构壁柱', on: 'partv' });
      if (lampYaw != null) { const n = [Math.sin(lampYaw), Math.cos(lampYaw)]; out.push({ m: 'r2/bunker_lamps', x: x + n[0] * (w / 2 + 0.04), y: y + 4.2, z: z + n[1] * (d / 2 + 0.04), yaw: lampYaw, h: 0.3, tag: '壁灯', on: 'pillar' }); } };
    for (const z of [-100, -108, -124, -132, -140, -148]) { pil(-31.7, z, 0.6, 0.9, ROT.E); if (z !== -116) pil(31.7, z, 0.6, 0.9, ROT.W); }
    for (const x of [-24, -16, -8, 8, 16, 24]) pil(x, -155.7, 0.9, 0.6, ROT.S);
    // ② 顶部桁架：每 8 m 一榀东西向钢桁架（上下弦 + 腹杆），下弦挂工矿灯；两条南北向电缆桥架
    for (const z of [-100, -108, -116, -124, -132, -140, -148]) {
      out.push({ box: 'blackMetal', x: 0, y: y + 14.6, z, w: 63, h: 0.3, d: 0.3, tag: '桁架', on: 'ceil' }); out.push({ box: 'blackMetal', x: 0, y: y + 13.2, z, w: 63, h: 0.24, d: 0.3, tag: '桁架', on: 'ceil' });
      for (let x = -30; x <= 30; x += 3) { out.push({ box: 'blackMetal', x, y: y + 13.9, z, w: 0.12, h: 1.2, d: 0.12, tag: '桁架', on: 'ceil' }); out.push({ box: 'blackMetal', x: x + 1.5, y: y + 13.9, z, w: 0.1, h: 1.9, d: 0.1, yaw: 0, tag: '桁架', on: 'ceil', rz: 0.8 }); }
      for (const x of [-24, -12, 12, 24]) { out.push({ box: 'blackMetal', x, y: y + 12.6, z, w: 0.03, h: 1.2, d: 0.03, tag: '吊灯', on: 'ceil' }); out.push({ m: 'r2/hanging_industrial_lamp', x, y: y + 11.15, z, yaw: 0, h: 0.85, tag: '工矿灯', on: 'ceil' }); }
    }
    for (const x of [-12.5, 12.5]) { out.push({ box: 'iron', x, y: y + 12.9, z: -124, w: 0.6, h: 0.06, d: 62, tag: '电缆桥架', on: 'ceil' }); for (const s of [-1, 1]) out.push({ box: 'iron', x: x + s * 0.3, y: y + 12.98, z: -124, w: 0.03, h: 0.14, d: 62, tag: '电缆桥架', on: 'ceil' });
      for (let k = 0; k < 6; k++) out.push({ box: 'dz_bakelite', x: x + (k - 2.5) * 0.08, y: y + 12.96, z: -124, w: 0.05, h: 0.05, d: 61.6, tag: '电缆', on: 'ceil' }); }
    // ③ 局旗吊挂：主通道两侧（面朝电梯厅），桁架下 3.2 m 高的竖幅
    for (const z of [-104, -112]) for (const sx of [-1, 1]) { out.push({ box: 'blackMetal', x: sx * 4.6, y: y + 12.4, z, w: 1.5, h: 0.05, d: 0.05, tag: '局旗', on: 'ceil' }); pic(out, 'textures/b01/B01_02_局旗深蓝.png', sx * 4.6, y + 10.7, z, 0, 1.4, 3.2, 'none', { side: 2, tag: '局旗', on: 'ceil' }); }
    // ④ 地面标线：副本门区安全弧线（r = 26，黄白相间短段）、ABY 门前斜纹警示、射击线后黄线
    for (let a = -1.08; a <= 1.08; a += 0.06) { const r = 25.6, x = Math.sin(a) * r, z = -102 - Math.cos(a) * r; if (Math.abs(x) < 2.8 && z > -128.5) continue; if (Math.round(a / 0.06) % 2) continue; out.push({ box: 'r3_paintYellow', x, y: y + 0.006, z, w: 1.4, h: 0.012, d: 0.14, yaw: -a, tag: '安全线', on: 'partv' }); }
    { const a = -0.95 + 5 * 0.38, gx = Math.sin(a) * 30, gz = -102 - Math.cos(a) * 30, dx = -Math.sin(a), dz = Math.cos(a), tx = Math.cos(a), tz = Math.sin(a);
      out.push({ box: 'r3_hazard', x: gx + dx * 1.4, y: y + 0.007, z: gz + dz * 1.4, w: 5.6, h: 0.012, d: 1.4, yaw: -a, tag: '警示斑马', on: 'partv' }); }
    floorZ(out, 'r3_paintYellow', -18, 18, -137.9, -137.75, y);
    // ⑤ 隔离栏：射击线后观察带（栏杆 3.9 m 一段，主通道处留口）+ 格斗软垫区西侧
    for (const x of [-16.05, -12.1, -8.15, -4.2, 4.2, 8.15, 12.1, 16.05]) out.push({ m: 'r2/metal_railing', x, y, z: -137.2, yaw: 0, h: 1.0, tag: '隔离栏', on: 'floor', col: [3.9, 1.0, 0.15] });
    for (const z of [-100.2, -104.15, -108.1]) out.push({ m: 'r2/metal_railing', x: 16.3, y, z, yaw: ROT.E, h: 1.0, tag: '隔离栏', on: 'floor', col: [3.9, 1.0, 0.15] });
    // ⑥ 东南角后勤堆场：托盘 + 塑料桶 + 油桶 + 路锥，黄线框
    floorZ(out, 'r3_epoxy', 19.6, 31.4, -155.2, -149.0, y, { border: 0.12, bmat: 'r3_paintYellow' });
    for (const [x, z, yaw] of [[21.4, -153.6, 0.05], [23.0, -153.6, -0.04], [24.6, -153.7, 0.02]]) { out.push({ m: 'r2/eur_pallet_rawscan', x, y, z, yaw, w: 1.2, tag: '后勤堆场', on: 'floor', col: [1.2, 0.15, 0.8] }); out.push({ m: 'r2/eur_pallet_rawscan', x, y: y + 0.15, z, yaw: yaw + 0.03, w: 1.2, tag: '后勤堆场', on: 'stack' }); }
    out.push({ m: 'r2/pallets_and_plastic_barrels', x: 27.6, y, z: -153.4, yaw: 0, w: 1.3, tag: '后勤堆场', on: 'floor', col: [1.3, 1.0, 1.0] });
    out.push({ m: 'r2/oil_drums', x: 29.9, y, z: -153.6, yaw: 0.2, h: 0.95, tag: '后勤堆场', on: 'floor', col: [1.2, 0.95, 1.2] });
    out.push({ m: 'r2/oil_drums', x: 29.7, y, z: -151.2, yaw: 1.1, h: 0.95, tag: '后勤堆场', on: 'floor', col: [1.2, 0.95, 1.2] });
    for (const [x, z] of [[21.0, -150.2], [22.6, -150.4], [24.2, -150.1]]) out.push({ m: 'r2/traffic_cones', x, y, z, yaw: x, h: 0.5, tag: '后勤堆场', on: 'floor' });
    for (const z of [-104, -124, -144]) light(out, 0, y + 11.0, z, 0xfff0d8, 1.8, 18);
  },
  metro(out, y) {
    // ① 路灯两列（x = ±11，每 12 m 左右，避让报亭/单车/便利店/公交站）+ 灯杆竖幅（局旗 / 规则之泉）
    const L = [[-11, 104], [-11, 116], [-11, 136], [-11, 148], [-11, 160], [11, 104], [11, 115.6], [11, 136], [11, 152], [11, 160]];
    L.forEach(([x, z], i) => { out.push({ m: 'street_lamp_02', x, y, z, yaw: x < 0 ? ROT.E : ROT.W, h: 4.8, tag: '路灯', on: 'floor', col: [0.4, 4.8, 0.4] });
      pic(out, i % 2 ? 'textures/b01/B01_08_海报_规则之泉.png' : 'textures/b01/B01_02_局旗深蓝.png', x, y + 3.0, z + 0.22, 0, 0.55, 1.3, 'none', { side: 2, tag: '灯杆竖幅', on: 'pic' }); });
    for (const [x, z] of L) light(out, x * 0.85, y + 4.4, z, 0xffd8a0, 0.8, 9);
    // ② 广场边缘护柱（x = ±18.4，每 2.4 m；便利店段让开）+ 黑石收边带
    for (const sx of [-1, 1]) { for (let z = 101.5; z < 168.5; z += 2.4) { if (sx > 0 && z > 124.5 && z < 131.5) continue; out.push({ m: 'bollard', x: sx * 18.4, y, z, yaw: 0, h: 0.95, tag: '护柱', on: 'floor', col: [0.25, 0.95, 0.25] }); }
      floorZ(out, 'stoneDark', sx * 18.2, sx * 19.0, 100.2, 170.8, y, { lift: 0.002 }); }
    // ③ 横向石材分隔带（每 12 m，盲道处断开）——把大片铺装分成可读尺度
    for (const z of [110, 122, 146, 158]) for (const [a, b] of [[-18.2, -0.5], [0.5, 18.2]]) floorZ(out, 'r3_stoneBorder', a, b, z - 0.2, z + 0.2, y, { lift: 0.001 });
    // ④ 公交候车亭（钢柱 + 玻璃顶 + 背板广告），罩在原两张长椅上
    { const cx = 10.0, cz = 166.4; for (const dx of [-2.4, 2.4]) for (const dz of [-0.9, 0.9]) wallBox(out, 'blackMetal', cx + dx, cz + dz, 0.1, 0.1, y, 2.6, '候车亭');
      out.push({ box: 'blackMetal', x: cx, y: y + 2.65, z: cz, w: 5.2, h: 0.1, d: 2.2, tag: '候车亭', on: 'partv' }); out.push({ box: 'glassClear', x: cx, y: y + 2.72, z: cz, w: 5.0, h: 0.03, d: 2.0, tag: '候车亭', on: 'partv' });
      out.push({ box: 'blackMetal', x: cx, y: y + 1.5, z: cz + 0.95, w: 5.0, h: 1.9, d: 0.06, tag: '候车亭', on: 'partv' }); pic(out, 'textures/b05/B05_海报_篇幅补充剂.png', cx + 1.2, y + 1.5, cz + 0.91, Math.PI, 1.1, 1.6, 'none', { tag: '候车亭' }); pic(out, 'textures/b01/B01_07_海报_叙事高考.png', cx - 1.2, y + 1.5, cz + 0.91, Math.PI, 1.1, 1.6, 'none', { tag: '候车亭' });
      light(out, cx, y + 2.4, cz, 0xfff0d8, 0.8, 5); }
    // ⑤ 单车停放架（共享单车区两侧）+ 出站口两侧导向立牌
    for (const z of [124.6, 130.6]) out.push({ box: 'steel', x: -11.75, y: y + 0.4, z, w: 5.2, h: 0.05, d: 0.05, tag: '单车架', on: 'partv' });
  },
};

// ================= R3 批次8：其余区地面分区与磨损（只铺在原有分区/磨损之外，避免 z 冲突；医务室在走廊地胶上 lift 0.002）=================
Object.assign(X8, {
  archive(out, y) {
    // 开架区 A/B 实木地板 + 石材收边（东门方格石地面南北两侧）；开架区西侧通道、借阅柜台前磨损；西南卡片目录区方砖
    floorZ(out, 'r3_parquet', -27.2, -20.4, -66.4, -56.6, y, { border: 0.14 }); floorZ(out, 'r3_parquet', -27.2, -20.4, -46.4, -38.2, y, { border: 0.14 });
    floorZ(out, 'r3_terrDeep', -55.6, -48.4, -44.6, -36.2, y, { border: 0.14 }); // 批次33 压一档；批次32：白方砖（陈列区突兀）→ 深色水磨石
    wear(out, -28.5, -27.5, -66.0, -38.5, y); wear(out, -48.4, -46.6, -53.0, -50.1, y);
  },
  canteen(out, y) {
    // 取餐线前防滑方砖带 + 石材收边；就餐区石材分隔框；咖啡台 / 餐具回收 / 东侧窗边小桌各自分区
    floorZ(out, 'r3_tile', -12.0, 12.0, -138.3, -135.5, y, { border: 0.14 });
    for (const [x0, x1, z0, z1] of [[-13.2, 13.2, -134.6, -134.4], [-13.2, 13.2, -113.6, -113.4], [-13.2, -13.0, -134.4, -113.6], [13.0, 13.2, -134.4, -113.6]]) floorZ(out, 'r3_stoneBorder', x0, x1, z0, z1, y);
    floorZ(out, 'r3_check', -18.0, -14.6, -124.2, -117.8, y, { border: 0.12 }); floorZ(out, 'r3_tile', 14.2, 18.0, -139.6, -135.6, y, { border: 0.12 }); floorZ(out, 'r3_parquet', 13.8, 17.8, -131.0, -119.0, y, { border: 0.12 });
    wear(out, 13.8, 18.0, -114.6, -111.4, y); wear(out, -2.0, 2.0, -113.0, -110.4, y);
  },
  medical(out, y) {
    const L = { lift: 0.002 };
    floorZ(out, 'r3_lino', -9.2, -3.4, -111.4, -99.8, y, { ...L, border: 0.1 }); // 观察病房
    floorZ(out, 'r3_lino', 2.7, 9.2, -110.8, -105.0, y, { ...L, border: 0.1 }); // 诊室
    floorZ(out, 'r3_tile', -9.2, 9.2, -119.5, -112.0, y, { ...L, border: 0.12 }); // 处置 · 净化（湿区）
    floorZ(out, 'r3_check', 2.4, 9.2, -95.6, -92.5, y, { ...L, border: 0.1 }); // 候诊
    for (const z of [-99.35, -95.65]) floorZ(out, 'r3_stoneBorder', -9.2, 9.2, z - 0.06, z + 0.06, y, L); // 主通道收边
    wear(out, 3.2, 6.8, -104.4, -103.0, y); // 分诊台前
  },
  b1(out, y) {
    floorZ(out, 'r3_epoxy', 5.0, 15.6, -120.0, -98.0, y, { border: 0.12, bmat: 'r3_paintYellow' }); // 车辆整备区
    floorZ(out, 'r3_lino', -15.6, -7.0, -103.2, -96.0, y, { border: 0.1 }); // 简报区
    floorZ(out, 'r3_hazard', -9.4, 9.4, -92.6, -92.25, y); wear(out, -1.8, 1.8, -116.0, -92.8, y); // 电梯厅开口警示 + 主动线磨损
  },
  b2(out, y) {
    for (const z of [-117.0, -115.0]) floorZ(out, 'r3_paintYellow', -8.6, -2.6, z - 0.05, z + 0.05, y); // 检修通道边线
    floorZ(out, 'r3_epoxy', -11.8, -6.2, -123.6, -118.6, y, { border: 0.14, bmat: 'r3_hazard' }); // 发电机危险区
  },
  b4(out, y) {
    for (const x of [-3.1, 3.1]) floorZ(out, 'r3_paintYellow', x - 0.04, x + 0.04, -134.0, -95.0, y); // 收容柜前安全线
    wear(out, -2.8, -1.3, -133.5, -96.5, y); wear(out, 1.3, 2.8, -133.5, -96.5, y);
  },
});
for (const [id, f] of Object.entries(X8)) { const base = PLANS[id]; if (!base) continue; PLANS[id] = (Y) => { const p = base(Y); const n0 = p.items.length; f(p.items, Y, p.room); fixYaw({ items: p.items.slice(n0) }); return p; }; }

// ================= R3 批次8：墨渊定稿厅 / 墨潮带 / 装订线入口（回廊、回写台保持克制，不加）=================
// —— 定稿厅（平台 y −280，镇纸巨柱 (8,−228)，环形书桌 r 5.2…6.6，巨书环 r 16 南侧留口迎阶梯，柱底红线向东南 → 页缝）——
export function planAbyssCore(y) {
  const out = []; const cx = 8, cz = -228;
  const room = { name: '墨渊 · 定稿厅（批次8）', x0: cx - 23, x1: cx + 23, z0: cz - 23, z1: cz + 23, y, H: 30, doors: [{ wall: 'S', a: cx - 3, b: cx + 3, label: '上行阶梯' }], windows: [],
    rooms: [['镇纸巨柱 · 环形书桌', cx, cz], ['校对席 ×6（外环）', cx - 11, cz - 2], ['红线 → 页缝（东南，净空）', cx + 10, cz + 7]],
    aisles: [{ label: '阶梯 → 书桌（南）', x0: cx - 1.8, x1: cx + 1.8, z0: cz + 7.5, z1: cz + 15.5 }] };
  F7(out, '镇纸巨柱', cx, cz, 4.8, 4.8, y, 0, 30); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; F7(out, '环形书桌', cx + Math.sin(a) * 5.9, cz + Math.cos(a) * 5.9, 1.4, 2.6, y, -a, 1.0); }
  for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; if (a < 0.42 || a > Math.PI * 2 - 0.42) continue; F7(out, '巨书', cx + Math.sin(a) * 16, cz + Math.cos(a) * 16, 2.0, 2.4, y, -a, 14); }
  // ① 外环校对席：6 张古董桌（校对员坐外侧、面朝镇纸柱）+ 皮椅 + 煤油灯 + 稿件堆 + 打字机（隔席）；避开东南红线扇区 a∈[−0.5, 1.5]
  [2.0, 2.65, 3.3, 3.95, 4.6, 5.25].forEach((a, i) => { const r = 10.6, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r, n = [Math.sin(a), Math.cos(a)], t = [Math.cos(a), -Math.sin(a)];
    out.push({ m: 'r2/antique_desk', x, y, z, yaw: a, w: 1.6, tag: '校对席', on: 'floor', col: [1.6, 0.78, 0.8] });
    out.push({ m: 'r2/worn_leather_office_chair', x: x + n[0] * 0.85, y, z: z + n[1] * 0.85, yaw: a + Math.PI, h: 1.0, tag: '校对席', on: 'floor' });
    out.push({ m: 'r2/1800s_kerosene_desk_lamps_type_b', x: x + t[0] * 0.55, y: y + 0.78, z: z + t[1] * 0.55, yaw: a, h: 0.45, tag: '校对席', on: 'shelf' });
    if (i % 2 === 0) out.push({ m: 'r2/old_typewriter', x: x - t[0] * 0.2, y: y + 0.78, z: z - t[1] * 0.2, yaw: a + Math.PI, w: 0.4, tag: '校对席', on: 'shelf' });
    else out.push({ m: 'r2/medieval_book_stack', x: x - t[0] * 0.3, y: y + 0.78, z: z - t[1] * 0.3, yaw: a, h: 0.3, tag: '校对席', on: 'shelf' });
    out.push({ m: 'r2/medieval_book_stack', x: x - t[0] * 1.5 - n[0] * 0.45, y, z: z - t[1] * 1.5 - n[1] * 0.45, yaw: a * 2, h: 0.55, tag: '稿件堆', on: 'floor' });
    light(out, x + t[0] * 0.55, y + 1.5, z + t[1] * 0.55, 0xffc890, 1.4, 6); });
  // ② 席间落地烛台（外环，每两席之间）+ 环形书桌外沿 4 座铜烛台
  for (const a of [2.33, 2.98, 3.63, 4.28, 4.93]) out.push({ m: 'r2/medieval_candelabra_free_download', x: cx + Math.sin(a) * 12.4, y, z: cz + Math.cos(a) * 12.4, yaw: 0, h: 1.6, tag: '烛台', on: 'floor', col: [0.5, 1.6, 0.5] });
  for (const a of [2.4, 3.3, 4.2, 5.1]) out.push({ m: 'r2/candelabra', x: cx + Math.sin(a) * 8.0, y, z: cz + Math.cos(a) * 8.0, yaw: 0, h: 1.3, tag: '烛台', on: 'floor' });
  // ③ 柱身上方三盏铁吊灯（中层光）+ 南口两侧石天使（迎阶梯）
  for (const a of [2.6, 3.9, 5.2]) out.push({ m: 'r2/medieval_chandelier', x: cx + Math.sin(a) * 9, y: y + 8.0, z: cz + Math.cos(a) * 9, yaw: a, h: 1.6, tag: '烛火吊灯', on: 'ceil' });
  for (const a of [2.6, 3.9, 5.2]) light(out, cx + Math.sin(a) * 9, y + 7.2, cz + Math.cos(a) * 9, 0xffc080, 2.2, 14);
  // ④ 地面：校对席外环一圈深色地毯带（中断于东南红线扇区）
  for (let k = 0; k < 18; k++) { const a = 1.75 + k * 0.215; if (a > 5.6) break; out.push({ box: 'r3_carpetRed', x: cx + Math.sin(a) * 10.9, y: y + 0.007, z: cz + Math.cos(a) * 10.9, w: 2.5, h: 0.014, d: 3.4, yaw: a, tag: '地毯', on: 'partv' }); }
  return { room, items: out };
}
// —— 墨潮带岸线（东巷 x 14…44，z −162…−118；x>44 是墨潮，红桩线 x 43.6）：被墨潮冲上岸的机构残骸 + 一个封锁观察哨 ——
export function planAbyssTide(y) {
  const out = []; const X0 = 14, X1 = 44, Z0 = -162, Z1 = -118;
  const room = { name: '墨渊 · 墨潮带岸线（批次8）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H: 20, doors: [{ wall: 'W', a: -146, b: -134, label: '东巷口（← 书城）' }], windows: [],
    rooms: [['封锁观察哨', 36, -136], ['冲上岸的残骸带', 40, -150], ['岸线残骸（北）', 40, -124]], aisles: [{ label: '巷口 → 红桩', x0: 14, x1: 42.6, z0: -141.6, z1: -138.4 }] };
  for (let k = 0; k < 9; k++) F7(out, '红桩', 43.6, -122 - k * 4.4, 0.3, 0.3, y, 0, 1.4); F7(out, '警示牌', 43.3, -139.2, 0.3, 0.8, y, 0, 1.4);
  // ① 封锁观察哨（巷口北侧）：沙袋矮墙（木箱代）+ 讲台式记录台 + 提灯 + 探照灯指向墨潮 + 路障
  out.push({ m: 'r2/lectern', x: 36.0, y, z: -136.4, yaw: ROT.E, h: 1.15, tag: '观察哨', on: 'floor', col: [0.6, 1.15, 0.5] });
  out.push({ m: 'r2/portable_searchlight', x: 38.6, y, z: -135.6, yaw: ROT.E, h: 1.4, tag: '观察哨', on: 'floor' });
  for (const z of [-133.6, -131.8]) out.push({ m: 'r2/concrete_road_barrier', x: 40.2, y, z, yaw: ROT.E, w: 1.8, tag: '观察哨', on: 'floor', col: [1.8, 0.97, 0.74] });
  out.push({ m: 'r2/lantern_01', x: 36.0, y: y + 1.15, z: -136.1, yaw: 0, h: 0.35, tag: '观察哨', on: 'shelf' });
  light(out, 36.6, y + 2.0, -136, 0xffb070, 1.6, 9);
  // ② 冲上岸的残骸（南北两段，沿红桩内侧 1–3 m）：倾倒文件柜、散落档案箱、半埋的椅子、木桶、旧书堆
  const W = [[41.2, -122.6, 'r2/rusty_filing_cabinet', { h: 1.3, rz: 1.5 }], [40.4, -126.0, 'r2/old_paper_cardboard_boxes', { w: 0.9 }], [41.6, -128.8, 'r2/barrel_01', { h: 0.9, rz: 1.4 }], [39.8, -130.6, 'r2/medieval_book_stack', { h: 0.5 }],
    [41.0, -146.2, 'r2/rusty_filing_cabinet', { h: 1.3, rz: -1.5 }], [39.6, -149.0, 'r2/old_paper_cardboard_boxes', { w: 0.9 }], [41.8, -151.6, 'r2/worn_leather_office_chair', { h: 1.0, rz: 1.3 }], [40.2, -154.4, 'r2/barrel_02', { h: 0.9 }], [41.4, -157.6, 'r2/medieval_book_stack', { h: 0.5 }], [38.8, -158.8, 'r2/old_typewriter', { w: 0.4, rx: 0.3 }]];
  W.forEach(([x, z, m, o], i) => out.push({ m, x, y, z, yaw: x * 1.7 + i, ...o, tag: '残骸', on: o.rz ? 'decal' : 'floor' }));
  // ③ 岸线：被打湿的纸页带（深色薄片，沿红桩内侧）+ 两盏低位提灯
  for (let k = 0; k < 14; k++) { const z = -120 - k * 3.0; out.push({ box: k % 3 ? 'dz_paper' : 'dz_paper2', x: 42.2 + hash(k, 3) * 0.9, y: y + 0.006, z: z + hash(k, 7), w: 0.5, h: 0.004, d: 0.4, yaw: hash(k, 9) * 3, tag: '湿纸页', on: 'partv' }); }
  for (const z of [-126, -152]) { out.push({ m: 'r2/lantern_01', x: 38.6, y, z, yaw: 0, h: 0.35, tag: '提灯', on: 'floor' }); light(out, 38.6, y + 0.6, z, 0xff9a50, 1.2, 7); }
  return { room, items: out };
}
// —— 装订线入口（页缝，x −3…3，z −53…−67，牛皮纸 9 m 高）：第七局的「收件处」——克制：只放墙边小件，中轴净空 ——
export function planS7Entry(y) {
  const out = []; const X0 = -3.0, X1 = 3.0, Z0 = -67, Z1 = -53.2, H = 9;
  const room = { name: '装订线 · 页缝入口（批次8）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H, doors: [{ wall: 'N', a: -1.6, b: 1.6, label: '→ 回廊' }], windows: [],
    rooms: [['收件台（西墙）', -2.3, -58], ['归还档案（东墙）', 2.3, -62]], aisles: [{ label: '页缝中轴', x0: -1.3, x1: 1.3, z0: -66.8, z1: -53.6 }] };
  F7(out, '打孔卡', -2.9, -61, 0.2, 0.3, y + 1.2, 0, 0.1);
  out.push({ m: 'r2/lectern', x: -2.3, y, z: -57.6, yaw: ROT.E, h: 1.15, tag: '收件台', on: 'floor', col: [0.6, 1.15, 0.5] });
  out.push({ m: 'r2/1800s_kerosene_desk_lamps_type_b', x: -2.3, y: y + 1.15, z: -57.2, yaw: ROT.E, h: 0.4, tag: '收件台', on: 'shelf' });
  for (const [z, dy] of [[-62.0, 0], [-62.05, 0.3], [-63.0, 0]]) out.push({ m: 'r2/filing_box', x: 2.4, y: y + dy, z, yaw: ROT.W + z * 0.1, w: 0.4, tag: '归还档案', on: dy ? 'shelf' : 'floor', col: [0.4, 0.3, 0.32] });
  out.push({ m: 'r2/coat_rack_bowler_hat', x: 2.4, y, z: -56.4, yaw: ROT.W, h: 1.8, tag: '衣帽架', on: 'floor' });
  pic(out, 'textures/emblems/N02.jpg', 0, y + 5.6, -53.45, Math.PI, 1.0, 1.0, 'black');
  light(out, -2.0, y + 1.8, -57.6, 0xffc890, 1.2, 6); light(out, 0, y + 6.5, -60, 0xe8d0b0, 1.4, 10);
  return { room, items: out };
}
Object.assign(PLANS, { abyss_core: (Y) => fixYaw(planAbyssCore(Y)), abyss_tide: (Y) => fixYaw(planAbyssTide(Y)), s7_entry: (Y) => fixYaw(planS7Entry(Y)) }); Object.assign(R3, { abyss_core: true, abyss_tide: true, s7_entry: true });

// ================= R3 批次9：训练场整体提亮 / 定稿厅主机位可见陈设 =================
const X9 = {
  // 训练场：64×64 m 高顶大厅，原来只有灯管自发光 + 局部补光 → 地面大片死黑。按 4×4 网格在 y+11 m 布宽范围补光（冷白，和灯管同色），主通道/简报区/领用区上方加暖色中层光
  training(out, y) {
    for (const x of [-24, -8, 8, 24]) for (const z of [-100, -116, -132, -148]) light(out, x, y + 11, z, 0xe4ecff, 3.4, 28);
    light(out, 0, y + 5, -104, 0xffe2b8, 2.0, 14); light(out, -22, y + 5, -109, 0xffe2b8, 2.0, 12); light(out, 9.5, y + 5, -110, 0xffe2b8, 2.0, 12);
  },
  // 定稿厅：主机位（南，r≈20）只能从书环南口看进来，原校对席都在西/北/东侧被巨书挡住 → 在南口西侧（避开东南红线扇区）补 2 席校对台、南口两侧落地烛台，地毯带延伸过来，席灯加亮
  abyss_core(out, y) {
    const cx = 8, cz = -228;
    [-0.38, -0.71].forEach((a, i) => { const r = 10.6, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r, n = [Math.sin(a), Math.cos(a)], t = [Math.cos(a), -Math.sin(a)];
      out.push({ m: 'r2/antique_desk', x, y, z, yaw: a, w: 1.6, tag: '校对席', on: 'floor', col: [1.6, 0.78, 0.8] });
      out.push({ m: 'r2/worn_leather_office_chair', x: x + n[0] * 0.85, y, z: z + n[1] * 0.85, yaw: a + Math.PI, h: 1.0, tag: '校对席', on: 'floor' });
      out.push({ m: 'r2/1800s_kerosene_desk_lamps_type_b', x: x + t[0] * 0.55, y: y + 0.78, z: z + t[1] * 0.55, yaw: a, h: 0.45, tag: '校对席', on: 'shelf' });
      out.push(i === 0 ? { m: 'r2/old_typewriter', x: x - t[0] * 0.2, y: y + 0.78, z: z - t[1] * 0.2, yaw: a + Math.PI, w: 0.4, tag: '校对席', on: 'shelf' } : { m: 'r2/medieval_book_stack', x: x - t[0] * 0.3, y: y + 0.78, z: z - t[1] * 0.3, yaw: a, h: 0.3, tag: '校对席', on: 'shelf' });
      if (i === 0) out.push({ m: 'r2/medieval_book_stack', x: x - t[0] * 1.55 - n[0] * 0.4, y, z: z - t[1] * 1.55 - n[1] * 0.4, yaw: a * 2, h: 0.55, tag: '稿件堆', on: 'floor' });
      light(out, x + t[0] * 0.55, y + 1.5, z + t[1] * 0.55, 0xffc890, 2.4, 7); });
    for (const [a, r] of [[-0.28, 8.0], [0.28, 8.0]]) { const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r; out.push({ m: 'r2/medieval_candelabra_free_download', x, y, z, yaw: 0, h: 1.8, tag: '烛台', on: 'floor', col: [0.5, 1.8, 0.5] }); light(out, x, y + 2.0, z, 0xffc070, 2.2, 8); }
    for (let k = 0; k < 3; k++) { const a = -0.36 - k * 0.24; out.push({ box: 'r3_carpetRed', x: cx + Math.sin(a) * 10.9, y: y + 0.007, z: cz + Math.cos(a) * 10.9, w: 2.5, h: 0.014, d: 3.4, yaw: a, tag: '地毯', on: 'partv' }); }
  },
};
for (const [id, f] of Object.entries(X9)) { const base = PLANS[id]; if (!base) continue; PLANS[id] = (Y) => { const p = base(Y); const n0 = p.items.length; f(p.items, Y, p.room); fixYaw({ items: p.items.slice(n0) }); return p; }; }

// ================= R3 批次10：偏暗偏空收尾（B5 深库主室 / B5 前室 / 审讯室） =================
const X10 = {
  // B5 深库主室（x −14…14，z −134…−100）：中轴走廊 x ±6 两侧是 6 间单件收容室（x ±9，正面 x=±6）。
  // 平面：每间收容室正面左右各一盏地堡壁灯 + 门牌；两间之间的墙垛（z −113 / −123）放消防栓箱 / 急救箱 / 转运推车；
  // 走廊两侧顶部沿 z 走两根管线（冷水 / 消防），中轴两侧每 10 m 一盏冷白补光，北端柜列前加一盏暖光
  b5_deep(out, y) {
    const cells = [-108, -118, -128];
    cells.forEach((z, i) => { for (const s of [-1, 1]) {
      const x = s * 5.93, yaw = s < 0 ? ROT.E : ROT.W;
      out.push({ sign: `单件收容室 B5-${s < 0 ? 'W' : 'E'}${i + 1}`, sub: ['一级 · 文本畸变', '二级 · 认知污染', '三级 · 禁止单人进入'][i], x, y: y + 2.4, z: z + 2.6, yaw, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
      out.push({ m: 'r2/bunker_lamps', x: s * 5.85, y: y + 2.9, z: z - 2.9, yaw, h: 0.3, tag: '地堡灯', on: 'wall' });
      light(out, s * 5.0, y + 2.6, z - 2.6, 0xffe2b8, 1.6, 6);
    } });
    for (const [s, z, m, o] of [[-1, -113, 'r2/fire_extinguisher_5676b1', { h: 0.9 }], [1, -113, 'r2/metal_toolbox', { w: 0.5 }], [-1, -123, 'r2/tool_cart', { w: 0.9, col: [0.9, 0.7, 0.7] }], [1, -123, 'r2/fire_extinguisher_5676b1', { h: 0.9 }]])
      out.push({ m, x: s * 5.45, y, z, yaw: s < 0 ? ROT.E : ROT.W, ...o, tag: '墙垛', on: 'floor' });
    for (const s of [-1, 1]) { pipe(out, 'dz_pipe', 'z', -133.4, -100.6, s * 5.7, y + 6.3, 0.12); pipe(out, 'dz_pipeRed', 'z', -133.4, -100.6, s * 5.45, y + 6.1, 0.08); }
    for (const z of [-106, -116, -126]) for (const s of [-1, 1]) light(out, s * 3.2, y + 4.6, z, 0xe8eeff, 2.6, 10);
    light(out, 0, y + 2.4, -126.5, 0xffd8b0, 1.8, 8);
  },
  // B5 前室（12×8 m）：东南空角补一组「入库登记 / 防护」—— 南墙东段长凳 + 鞋套箱；地面黄黑警示带标出金库门开启扫掠区；整体补光
  b5(out, y) {
    out.push({ m: 'r2/park_bench', x: 3.6, y, z: -92.55, yaw: Math.PI, w: 1.8, tag: '更衣候检', on: 'floor', col: [1.8, 0.8, 0.6] });
    out.push({ m: 'r2/old_paper_cardboard_boxes', x: 5.4, y, z: -92.6, yaw: 0.2, w: 0.6, tag: '鞋套箱', on: 'floor' });
    floorZ(out, 'r3_hazard', -2.6, 2.6, -99.95, -99.75, y, { uv: 1 });
    // 东半区候检分流：铜柱红绳一道（x 2.0，z −93.4…−98.6）把「电梯 → 检测台」与「电梯 → 金库门」两股人流分开；红绳东侧放转运推车
    stanchions(out, [[2.0, -93.4], [2.0, -96.0], [2.0, -98.6]], y, '候检分流');
    out.push({ m: 'r2/tool_cart', x: 3.3, y, z: -98.9, yaw: 0.2, w: 0.9, tag: '转运车', on: 'floor', col: [0.9, 0.7, 0.7] });
    light(out, 3.4, y + 3.4, -93.6, 0xeef2ff, 2.2, 8); light(out, -1.0, y + 4.6, -96.0, 0xeef2ff, 2.0, 10);
  },
  // 审讯室：保留单灯压抑感，但让墙角和人能看清——桌上方原吊灯不动，补一盏很弱的暖色顶部漫射 + 玻璃侧冷色反光
  interrogation(out, y) {
    light(out, -10.0, y + 3.4, -101.0, 0xffe6c8, 1.3, 7); light(out, -8.1, y + 1.6, -98.2, 0xc8d6ff, 0.8, 5); light(out, -11.6, y + 2.6, -104.6, 0xffe0c0, 0.7, 5);
    light(out, -4.6, y + 3.2, -99.0, 0xe8eeff, 1.0, 6);
  },
};
for (const [id, f] of Object.entries(X10)) { const base = PLANS[id]; if (!base) continue; PLANS[id] = (Y) => { const p = base(Y); const n0 = p.items.length; f(p.items, Y, p.room); fixYaw({ items: p.items.slice(n0) }); return p; }; }

// ================= R3 批次11 · 东廊 east_cloister（1F，y=1.8，南北段 x 24.2…28 / z −111…−76.4 + 东西段 z −115…−111 / x 18.4…28，层高 5.6） =================
// 功能：东翼 1F（南口 z −76.4）↔ 职工食堂（西口 x 18.4）的通勤长廊，兼「局史陈列廊」。
// 平面：西墙（x 24.0 墙面）= 陈列面：展柜 4 台成排（z −86/−92/−98/−104，长边沿墙，前留 2.6 m 通行），柜上方挂势力徽记档案框 + 铜牌说明；
//      东墙（x 28 墙面）= 休息面：盲尖窗下长凳 4 张（z −85.4/−91.4/−97.4/−103.4，与窗中心对齐），两端绿植、垃圾桶；
//      中轴 1.4 m 红色长地毯（南口 → 拐角），拐角转入东西段；东西段北墙 = 公告栏（新人报到告示 + 规则之泉海报）+ 挂钟，西口两侧灭火器 / 衣帽架。
//      照明三层：顶部乳白球吊灯（肋间，4 盏）→ 原西墙铜壁灯 → 展柜冷白小射灯 + 公告栏暖光。
// 批次12：东廊展柜实物陈列（绿绒衬底上：档案盒 / 徽章 / 旧器物 / 说明卡；lx 沿柜长 ±0.7，lz 沿柜深 ±0.2，柜正面朝东）
function ecExhibit(out, i, c, top) {
  const P = (lx, lz) => at(c, ROT.E, lx, lz), Y = ROT.E;
  const put = (m, lx, lz, o) => { const [x, z] = P(lx, lz); out.push({ m, x, y: top, z, yaw: Y + (o.yaw ?? 0), tag: '展品', on: 'desk', ...o, yaw: Y + (o.yaw ?? 0) }); };
  const archBox = (lx, lz, n, yaw = 0) => { for (let k = 0; k < n; k++) { const [x, z] = P(lx, lz); out.push({ box: k % 2 ? 'kraftDark' : 'kraft', x, y: top + 0.03 + k * 0.061, z, w: 0.3, h: 0.06, d: 0.23, yaw: Y + yaw + k * 0.06, tag: '展品', on: 'partv' }); const [lx2, lz2] = P(lx + 0.0, lz - 0.1); out.push({ box: 'dz_paper', x: lx2, y: top + 0.03 + k * 0.061, z: lz2, w: 0.12, h: 0.035, d: 0.004, yaw: Y + yaw + k * 0.06, tag: '展品', on: 'partv' }); } };
  const badge = (lx, lz) => { const [x, z] = P(lx, lz); out.push({ disc: true, mat: 'brass', r: 0.032, h: 0.006, x, y: top, z, size: [0.064, 0.006, 0.064], tag: '徽章', on: 'partv' }); out.push({ disc: true, mat: 'dz_redPhone', r: 0.016, h: 0.009, x, y: top, z, size: [0.032, 0.009, 0.032], tag: '徽章', on: 'partv' }); const [rx, rz] = P(lx, lz + 0.055); out.push({ box: 'dz_rugRed', x: rx, y: top + 0.002, z: rz, w: 0.035, h: 0.004, d: 0.06, yaw: Y, tag: '徽章', on: 'partv' }); };
  const card = (lx, lz) => { const [x, z] = P(lx, lz); out.push({ box: 'dz_paper', x, y: top + 0.002, z, w: 0.13, h: 0.003, d: 0.08, yaw: Y, tag: '展品', on: 'partv' }); };
  if (i === 0) { put('r4/book_open_a01', -0.4, 0.0, { fit: [0.207, 0.037, 0.32], yaw: Math.PI / 2 + 0.08 }); put('r2/vintage_pocket_watch', 0.08, 0.06, { w: 0.05, rx: -Math.PI / 2, y: top + 0.006 }); put('r2/ink_bottle_with_feather_and_cork', 0.32, -0.06, { h: 0.1 }); badge(0.58, 0.06); badge(0.58, -0.1); card(0.06, -0.15); }
  if (i === 1) { archBox(-0.45, 0.0, 2, 0.05); put('r2/old_victorian_rubber_stamp', -0.05, 0.08, { h: 0.09 }); put('r2/camera_01', 0.3, 0.0, { w: 0.16, yaw: -0.3 }); badge(0.6, 0.1); card(-0.08, -0.15); }
  if (i === 2) { put('r4/paper_stack_a05', -0.42, 0.0, { fit: [0.252, 0.043, 0.338], yaw: -0.15 }); put('r2/glass_ashtray', -0.02, 0.06, { w: 0.12 }); archBox(0.38, 0.0, 1, -0.08); badge(0.0, -0.14); card(0.62, -0.14); }
  if (i === 3) { put('bronze_gui', -0.4, 0.0, { w: 0.22 }); put('r2/medieval_book_stack', 0.08, 0.02, { h: 0.12, yaw: 0.2 }); badge(0.42, 0.08); badge(0.56, 0.08); badge(0.49, -0.08); card(-0.05, -0.17); }
  light(out, c[0] + 0.05, top + 0.28, c[1], 0xfff2e2, 0.35, 1.4);
}
export function planEastCloister(y) {
  const out = []; const XW = 24.2, XE = 28, ZS = -76.4, ZN = -115, H = 5.6;
  const room = { name: '东廊 · 局史陈列廊（批次11）', x0: 18.4, x1: XE, z0: ZN, z1: ZS, y, H, doors: [{ wall: 'S', a: XW, b: XE, label: '东翼 1F' }, { wall: 'W', a: -115, b: -111, label: '职工食堂' }], windows: [],
    rooms: [['① 局史陈列面', 24.9, -95], ['② 休息长凳', 27.3, -88.4], ['③ 公告栏', 21.2, -113.6]],
    aisles: [{ label: '主通道（东翼 → 拐角）', x0: 25.0, x1: 27.0, z0: -112.6, z1: ZS }, { label: '拐角 → 食堂', x0: 18.4, x1: 27.0, z0: -113.8, z1: -112.2 }] };
  // 非本区（南北段西侧，墙外）
  F7(out, '墙外·非本区', (18.4 + XW - 0.2) / 2, -93.6, XW - 0.2 - 18.4, -76.4 - -110.6, y, 0, H);
  // ① 西墙陈列面：4 台展柜（长 1.6 m，沿 z）+ 柜上方徽记档案框 + 铜牌
  const EMB = [['emblems/势力档案-无妄城.jpg', '无妄城 · 第 3 号处置'], ['emblems/势力档案-深瞳.jpg', '深瞳 · 第 9 号处置'], ['emblems/势力档案-焚稿会.jpg', '焚稿会 · 第 14 号处置'], ['emblems/势力档案-余辉剧团.jpg', '余辉剧团 · 第 21 号处置']];
  [-86, -92, -98, -104].forEach((z, i) => {
    vitrine(out, XW + 0.36, z, y, 1.6, ROT.E, '局史展柜', { glassH: 0.34, felt: 'r3_feltGreen' });
    ecExhibit(out, i, [XW + 0.36, z], y + 0.871);
    pic(out, 'textures/' + EMB[i][0], XW + 0.035, y + 2.15, z, ROT.E, 0.8, 1.0, 'gold', { tag: '局史挂框' });
    out.push({ sign: '局史陈列', sub: EMB[i][1], x: XW + 0.035, y: y + 1.45, z: z + 0.62, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
    light(out, XW + 1.1, y + 2.0, z, 0xe8eeff, 0.7, 3.2);
  });
  // 南口与拐角两端：徽记小框（N01 法务 / N02 第七局）
  pic(out, 'textures/emblems/N01.jpg', XW + 0.035, y + 2.1, -80.2, ROT.E, 0.6, 0.6, 'gold', { tag: '局史挂框' });
  pic(out, 'textures/emblems/N02.jpg', XW + 0.035, y + 2.1, -109.4, ROT.E, 0.6, 0.6, 'gold', { tag: '局史挂框' });
  // ② 东墙休息面：长凳 ×4（对齐盲尖窗），两端绿植，凳间垃圾桶
  for (const z of [-85.4, -91.4, -97.4, -103.4]) out.push({ m: 'r2/hallway_bench', x: XE - 0.32, y, z, yaw: ROT.W, h: 0.5, tag: '长凳', on: 'floor' });
  for (const z of [-79.6, -108.6]) out.push({ m: 'r2/free_pothos_potted_plant_money_plant', x: XE - 0.5, y, z, yaw: 0, h: 0.65, tag: '绿植', on: 'floor' });
  for (const z of [-88.4, -100.4]) out.push({ m: 'r2/garbage_bin', x: XE - 0.25, y, z, yaw: ROT.W, h: 0.75, tag: '垃圾桶', on: 'floor' });
  out.push({ m: 'r2/fire_extinguisher_5676b1', x: XE - 0.18, y, z: -77.4, yaw: ROT.W, h: 0.9, tag: '消防', on: 'floor' });
  out.push({ m: 'r2/exit_sign', x: (XW + XE) / 2, y: y + 3.0, z: ZS - 0.15, yaw: Math.PI, w: 0.36, tag: '导视', on: 'wall' });
  // 中轴长地毯 + 磨损
  // 长地毯：原地面每 2 m 一道石带（顶面 y+0.015）→ 地毯抬到 y+0.016…0.028 盖在石带上；两侧铜压条
  for (const [x, z, w, d] of [[26.0, -94.0, 1.4, 33.2], [22.3, -113.0, 6.8, 1.4]]) { out.push({ box: 'r3_carpetCrimson', x, y: y + 0.022, z, w, h: 0.012, d, tag: '地毯', on: 'partv' });
    const alongZ = d > w; for (const s of [-1, 1]) out.push({ box: 'dz_brassDim', x: alongZ ? x + s * (w / 2 + 0.02) : x, y: y + 0.021, z: alongZ ? z : z + s * (d / 2 + 0.02), w: alongZ ? 0.04 : w, h: 0.014, d: alongZ ? d : 0.04, tag: '地毯', on: 'partv' }); }
  // 地毯两侧石地面走磨损（地毯上不压磨损贴花：白色擦痕在红毯上像口香糖渍）
  wear(out, 24.95, 25.25, -110.4, -78.0, y + 0.0055); wear(out, 26.75, 27.05, -110.4, -78.0, y + 0.0055);
  // 顶部乳白球吊灯（肋间）
  for (const z of [-82.4, -91.4, -100.4, -109.4]) { globe(out, 26.1, z, y, H, 3.9, { r: 0.22 }); light(out, 26.1, y + 3.7, z, 0xfff0dc, 1.6, 9); }
  // ③ 东西段北墙：公告栏（软木）+ 规则之泉海报 + 挂钟；西口灭火器 / 衣帽架
  pic(out, 'textures/b01/B01_04_新人报到告示.png', 21.6, y + 1.65, ZN + 0.045, 0, 0.75, 1.0, 'wood', { tag: '公告栏', cork: [1.9, 1.25] });
  pic(out, 'textures/b01/B01_08_海报_规则之泉.png', 24.6, y + 1.75, ZN + 0.045, 0, 0.66, 1.0, 'black', { tag: '海报' });
  out.push({ m: 'r2/1950s_wall_clock', x: 26.6, y: y + 2.6, z: ZN + 0.1, yaw: 0, h: 0.4, tag: '挂钟', on: 'wall' });
  light(out, 22.6, y + 2.8, -113.4, 0xffe6c8, 1.2, 5);
  out.push({ m: 'r2/fire_extinguisher_5676b1', x: 18.9, y, z: -114.7, yaw: 0, h: 0.9, tag: '消防', on: 'floor' });
  out.push({ m: 'r2/coat_rack', x: 19.0, y, z: -111.4, yaw: Math.PI, h: 1.85, tag: '衣帽架', on: 'floor' });
  out.push({ m: 'r2/free_pothos_potted_plant_money_plant', x: 27.5, y, z: -114.5, yaw: 0, h: 0.65, tag: '绿植', on: 'floor' });
  return { room, items: out };
}
PLANS.east_cloister = (Y) => fixYaw(planEastCloister(Y)); R3.east_cloister = true;
// ================= R3 批次12 · 东翼 1F 市民服务大厅 citizen_service 结构返工（y=1.8，x 20…56，z −53…−32，层高 6.7） =================
// 批次11 只补件补灯、中部空、黑大理石镜面反光 → 本批改结构。剧情锚点（5 个窗口 + 职员、投放口、填单台 2 张、3 排×2 组候号座椅、叫号机、群众来信墙、排队市民、电饭锅大妈）一律原位登记为固定。
// 平面（北 = −Z，窗口在北墙；南墙 z −32.4；西门 x 20、z −45…−51 来自安检大厅连廊；东北角 x 50.2…55.8 是东侧楼梯口）：
//  z 带（北→南）：窗口台 −52.9…−50.8 ｜ 分流栏杆窗口道 −50.8…−49.5（每窗一道，铜管栏杆隔开，一米线在栏杆端）｜ 窗口前横向主通道 −49.5…−48.2 ｜
//               候号区（屏风围合，北面敞向窗口与 LED）−48.2…−41.9 ｜ 东西向中通道 −41.9…−40.5 ｜ 填单岛 −40.5…−37.5 ｜ 南侧通道 + 南墙填写样张 −37.5…−32.4
//  ① 引导台：西门内南侧，台面朝北（迎着进门人流），职员坐南侧；台前立「叙事高考」入口灯箱海报（IMAGE-PLAN B01_07：市民服务入口）
//  ② 窗口分流：6 道 1.3 m 铜管栏杆（窗间缝 x 26.2/31.6/37.0/42.4 + 两端），栏杆端黄色一米线，市民侧圆凳、职员侧台灯/电话/文件夹保留
//  ③ 候号区：南、西、东三面 1.6 m 木墙裙 + 磨砂玻璃屏风（南面中间 5.2 m 开口对中通道），吊牌「候号区」，4 盏乳白球吊灯
//  ④ 填单岛：水磨石岛面 + 石材收边 + 铜嵌条，两张填单台之间放表格取阅架，岛两端翻盖垃圾桶，每台上方 2 盏球吊灯，吊牌「填单区」；南墙两张填写样张正对岛
//  ⑤ 东区：5 号窗（加试报名咨询）专用等候——同款候号座椅 2 排，西侧屏风隔出 3.8 m 南北通道；落地展架「加试报名大厅」流程海报；报刊架
//  ⑥ 东墙：两扇窗下铸铁暖气片，窗间「群众来信投递」信报箱 ×2 + 铜牌；东北角楼梯口 5.6×5.5 m 净空，灭火器 + 翻盖垃圾桶靠墙
//  ⑦ 西南：叫号机前铜柱红绳取号排队道；西墙挂钟/出口标识/灭火器
//  地面：整厅铺「哑光黑大理石」薄层（压掉原镜面清漆反光）+ 4 m 铜嵌条网格；填单岛水磨石；窗口道 / 入口 / 中通道磨损
function lowScreen(out, axis, c, a0, a1, y, tag = '屏风') { // 1.6 m 屏风：踢脚 + 0.95 m 木墙裙 + 磨砂玻璃 + 铜压顶，每 1.2 m 铜立柱
  const L = Math.abs(a1 - a0), m = (a0 + a1) / 2, P = (t, a) => axis === 'x' ? [a, t] : [t, a];
  const seg = (mat, yy, h, th, uv = 1) => { const [x, z] = P(c, m); out.push({ box: mat, x, y: yy, z, w: axis === 'x' ? L : th, h, d: axis === 'x' ? th : L, uv, tag, on: 'partv' }); };
  seg('stoneDark', y + 0.06, 0.12, 0.07); seg('dz_wain', y + 0.53, 0.82, 0.06, 0.6); seg('dz_brassDim', y + 0.955, 0.03, 0.07); seg('r3_frosted', y + 1.27, 0.6, 0.02, false); seg('dz_brassDim', y + 1.585, 0.03, 0.06);
  const n = Math.max(1, Math.round(L / 1.2)); for (let i = 0; i <= n; i++) { const [x, z] = P(c, Math.min(a0, a1) + i * L / n); out.push({ box: 'dz_brassDim', x, y: y + 0.8, z, w: 0.045, h: 1.6, d: 0.045, tag, on: 'partv' }); }
  const [x, z] = P(c, m); out.push({ part: true, x, y, z, yaw: 0, size: [axis === 'x' ? L : 0.07, 1.6, axis === 'x' ? 0.07 : L], tag, on: 'part' });
}
function railing(out, axis, c, a0, a1, y, tag = '分流栏杆') { // 不锈钢/铜管栏杆：立柱 + 上下两道横管 + 底座
  const L = Math.abs(a1 - a0), m = (a0 + a1) / 2, P = (t, a) => axis === 'x' ? [a, t] : [t, a];
  for (const a of [a0, m, a1]) { const [x, z] = P(c, a); out.push({ box: 'brass', x, y: y + 0.48, z, w: 0.045, h: 0.96, d: 0.045, tag, on: 'partv' }); out.push({ box: 'dz_brassDim', x, y: y + 0.01, z, w: 0.2, h: 0.02, d: 0.2, tag, on: 'partv' }); }
  for (const yy of [0.95, 0.5]) pipe(out, 'brass', axis, a0, a1, c, y + yy, 0.019);
  const [x, z] = P(c, m); out.push({ part: true, x, y, z, yaw: 0, size: [axis === 'x' ? L : 0.06, 1.0, axis === 'x' ? 0.06 : L], tag, on: 'part' });
}
const hang = (out, text, x, y, z, yaw, w = 2.2, h = 0.5, top) => out.push({ hang: true, text, x, y, z, yaw, w, h, top, size: [w, h, 0.05], tag: '吊牌', on: 'light' });
export function planCitizenService(y) {
  const out = []; const X0 = 20, X1 = 56, ZA = -32, ZM = -53, H = 6.7;
  const room = { name: '东翼 1F · 市民服务大厅（批次12）', x0: 20.3, x1: 55.9, z0: -52.6, z1: -32.3, y, H,
    doors: [{ wall: 'W', a: -51, b: -45, label: '安检大厅连廊' }, { wall: 'N', a: 50.2, b: 55.8, label: '东侧楼梯' }],
    windows: [{ wall: 'E', a: -36.8, b: -35.2 }, { wall: 'E', a: -45.4, b: -43.8 }],
    rooms: [['① 引导台', 22.4, -42.0], ['② 窗口分流', 34, -50.2], ['③ 候号区', 32, -46.0], ['④ 填单岛', 35, -36.9], ['⑤ 5 号窗等候', 46.2, -41.6], ['⑥ 来信投递 / 休息', 51.6, -40.3], ['⑦ 取号', 22.0, -37.6]],
    aisles: [{ label: '窗口前主通道', x0: 20.4, x1: 50.0, z0: -49.45, z1: -48.25 }, { label: '东西中通道', x0: 24.6, x1: 43.2, z0: -41.85, z1: -40.6 }, { label: '南侧通道', x0: 26.9, x1: 44.0, z0: -37.3, z1: -35.6 }, { label: '西区南北通道', x0: 22.9, x1: 25.4, z0: -40.6, z1: -34.4 },
      { label: '候号区中通道', x0: 29.3, x1: 32.4, z0: -48.2, z1: -42.0 }, { label: '东区南北通道', x0: 39.8, x1: 43.2, z0: -48.2, z1: -40.6 },
      { label: '楼梯口净空', x0: 50.3, x1: 55.4, z0: -52.6, z1: -48.3 }, { label: '楼梯南北通道', x0: 49.4, x1: 52.8, z0: -48.3, z1: -33.0 }, { label: '进门通道', x0: 20.4, x1: 24.2, z0: -49.45, z1: -45.0 }] };
  // —— 固定剧情锚点（原位）——
  for (let k = 0; k < 5; k++) F7(out, '服务窗口', 23.5 + k * 5.4, ZM + 1.6, 4.6, 1.0, y, 0, 1.1);
  F7(out, '畸变物投放口', 31.6, ZM + 1.4, 0.5, 0.5, y, 0, 1.2);
  for (const x of [30, 40]) F7(out, '填单台', x, ZA - 7, 3.4, 1.4, y, 0, 1.06);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) F7(out, '候号座椅', 27 + k * 10, ZA - 11 - r * 2.4, 4.2, 0.8, y, 0, 0.85);
  F7(out, '叫号机', 22, ZA - 3, 0.5, 0.4, y, 0, 1.4);
  F7(out, '群众来信墙', 50.2, ZA - 0.42, 9.4, 0.12, y, 0, 3.8);
  F7(out, '电饭锅（剧情）', 33, ZA - 13.4, 0.5, 0.4, y, 0, 1.3); // 批次12：用户要求不放人物模型 → 排队市民/大妈不再生成，固定锚点只留电饭锅
  // —— 地面：哑光黑大理石薄层 + 铜嵌条网格（替换原镜面清漆 + 金线网格，eastwing.js 在 R3 下关掉原金线）——
  floorZ(out, 'r3_marbleHoned', 20.3, 55.9, -52.85, -32.4, y, { uv: 0.5 });
  for (let x = 24; x <= 52; x += 4) out.push({ box: 'dz_brassDim', x, y: y + 0.0095, z: -42.6, w: 0.03, h: 0.003, d: 20.2, tag: '地面', on: 'partv' });
  for (let z = -36; z >= -52; z -= 4) out.push({ box: 'dz_brassDim', x: 38.1, y: y + 0.0095, z, w: 35.6, h: 0.003, d: 0.03, tag: '地面', on: 'partv' });
  // ① 引导台（盒体：木台身 + 黑玛瑙台面 + 铜踢脚；台面朝北，职员坐南）
  { const cx = 22.4, cz = -43.3, w = 1.8, d = 0.7;
    out.push({ fixed: true, m: '固定:引导台', x: cx, y, z: cz, yaw: 0, size: [w, 1.05, d], col: [w, 1.05, d], tag: '引导台', on: 'floor' });
    out.push({ m: 'r2/guide_desk', x: cx, y, z: cz, yaw: 0, h: 1.0, tag: '引导台', on: 'partv' } /* 固定:引导台 的实体，同 vitrine_6080 用 partv */); // 批次36：dz_wain 方盒 + 铜条 → Blender 精建 r2/guide_desk（tools/blender/guide_desk.py：胡桃三联凸芯板 + 铜线脚 / 踢脚 + 中联铜牌框；职员侧抽屉柜 + 文件格 + 容膝洞）
    out.push({ box: 'onyx', x: cx, y: y + 1.025, z: cz - 0.03, w: w + 0.1, h: 0.05, d: d + 0.12, uv: 0.5, tag: '引导台', on: 'partv' });
    out.push({ sign: '咨询 · 引导', sub: '请先取号，再到对应窗口', x: cx, y: y + 0.58, z: cz - d / 2 - 0.04, yaw: Math.PI, size: [0.38, 0.14, 0.01], tag: '铜牌', on: 'sign' }); // 批次37：铜牌放大到铜框内沿，横版画布字可读
    out.push({ m: 'r2/dining_chair_02', x: cx + 0.2, y, z: cz + 0.75, yaw: Math.PI, h: 0.98, tag: '引导台', on: 'floor' });
    out.push({ m: 'r2/bankers_lamp', x: cx - 0.65, y: y + 1.05, z: cz + 0.1, yaw: Math.PI, h: 0.4, tag: '引导台', on: 'desk' });
    out.push({ m: 'r2/office_phone', x: cx + 0.62, y: y + 1.05, z: cz + 0.08, yaw: Math.PI, w: 0.22, tag: '引导台', on: 'desk' });
    out.push({ m: 'r2/document_letter_tray_documents_organizer', x: cx + 0.05, y: y + 1.05, z: cz - 0.05, yaw: Math.PI, w: 0.3, tag: '引导台', on: 'desk' });
    light(out, cx, y + 3.0, cz - 0.4, 0xffe6c8, 1.2, 5);
    hang(out, '咨 询 引 导', cx, y + 3.3, cz, Math.PI, 1.9, 0.42, y + H);
    pic(out, 'textures/b01/B01_07_海报_叙事高考.png', 21.0, y + 1.25, -41.6, Math.PI * 0.82, 0.62, 0.93, 'black', { tag: '入口海报', stand: true, fy: y });
    out.push({ fixed: true, m: '固定:展板', x: 21.0, y, z: -41.6, yaw: 0, size: [0.7, 1.75, 0.4], tag: '入口海报', on: 'floor' }); }
  // ② 窗口：分流栏杆 + 一米线 + 市民侧圆凳 + 职员侧桌面
  for (const x of [20.85, 26.2, 31.6, 37.0, 42.4, 47.75]) railing(out, 'z', x, -50.72, -49.52, y);
  for (let k = 0; k < 5; k++) { const x = 23.5 + k * 5.4;
    for (const dx of k === 1 ? [-1.2] : [-1.0, 1.0]) out.push({ m: 'r2/metal_stool_01', x: x + dx, y, z: ZM + 2.4, yaw: Math.PI, h: 0.62, tag: '窗口', on: 'floor' });
    floorZ(out, 'r3_paintYellow', x - 2.3, x + 2.3, -49.62, -49.52, y, { lift: 0.006 });
    out.push({ m: 'r2/bankers_lamp', x: x - 1.7, y: y + 1.11, z: ZM + 1.3, yaw: 0, h: 0.4, tag: '窗口', on: 'desk' });
    out.push({ m: 'r2/office_phone', x: x + 1.6, y: y + 1.11, z: ZM + 1.3, yaw: 0, w: 0.22, tag: '窗口', on: 'desk' });
    out.push({ m: 'r2/several_folders', x: x + 0.9, y: y + 1.11, z: ZM + 1.25, yaw: 0.1, h: 0.28, tag: '窗口', on: 'desk' });
    // 批次55 精修：职员侧台面补办件小物——左手文件盘（待办件）、右手橡皮章；全部在灯 / 电话 / 文件夹之间，中间 0.8 m 留给递件台面
    out.push({ m: 'r2/document_letter_tray_documents_organizer', x: x - 1.0, y: y + 1.11, z: ZM + 1.28, yaw: 0, w: 0.3, tag: '窗口', on: 'desk' });
    out.push({ m: 'r2/old_victorian_rubber_stamp', x: x + 0.45, y: y + 1.11, z: ZM + 1.36, yaw: 0.4, h: 0.1, tag: '窗口', on: 'desk' });
    out.push({ m: 'r2/service_window', x, y, z: ZM + 1.6, yaw: 0, h: 2.995, tag: '服务窗口', on: 'partv' }); // 批次37：blackMarble 方盒 + 玛瑙板 + 平玻璃 → Blender 精建 r2/service_window（tools/blender/service_window.py：胡桃框芯板柜台 + 黑石台面 + 铜框玻璃隔窗 / 圆格栅传声孔 / 铜传递槽 + 编号铜牌框 + 叫号灯座）
    light(out, x, y + 3.9, ZM + 2.4, 0xfff0dc, 1.3, 6); } // 批次37：窗口上方冷白 0xeef2ff → 暖白，与顶部主光同色温（冷色只留叫号屏 / LED）
  wear(out, 21.0, 49.8, -49.3, -48.4, y + 0.0005);
  // ③ 候号区屏风（南面两段 + 西、东侧）+ 吊牌 + 吊灯
  lowScreen(out, 'x', -41.95, 24.4, 29.3, y); lowScreen(out, 'x', -41.95, 34.6, 39.6, y);
  lowScreen(out, 'z', 24.4, -46.6, -41.95, y); lowScreen(out, 'z', 39.6, -46.6, -41.95, y);
  hang(out, '候 号 区', 32, y + 3.6, -45.2, 0, 2.0, 0.46, y + H);
  for (const x of [27, 37]) for (const z of [-42.6, -47.4]) { globe(out, x, z, y, H, 4.2, { r: 0.24 }); light(out, x, y + 4.0, z, 0xffe2b8, 1.6, 10); }
  wear(out, 29.8, 31.9, -48.2, -42.2, y + 0.0005); wear(out, 24.8, 43.0, -41.7, -40.8, y + 0.0005);
  // ④ 填单岛：水磨石岛面 + 收边 + 铜嵌条；表格取阅架、两端垃圾桶、球吊灯、吊牌
  floorZ(out, 'r3_corr', 27.2, 42.8, -40.45, -37.55, y, { lift: 0.006, border: 0.22, uv: 0.6 });
  for (const z of [-40.47, -37.53]) out.push({ box: 'dz_brassDim', x: 35, y: y + 0.0185, z, w: 15.6, h: 0.004, d: 0.025, tag: '地面', on: 'partv' });
  for (const x of [27.18, 42.82]) out.push({ box: 'dz_brassDim', x, y: y + 0.0185, z: -39, w: 0.025, h: 0.004, d: 2.9, tag: '地面', on: 'partv' });
  out.push({ m: 'r2/news_rack_6080', x: 35, y: y + 0.014, z: -39.0, yaw: 0, h: 1.48, tag: '表格取阅架', on: 'floor' });
  out.push({ sign: '表格取阅', sub: '举报登记表 · 附表七 · 报名表', x: 35, y: y + 1.75, z: -38.68, yaw: 0, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
  for (const x of [27.75, 42.25]) out.push({ m: 'r4/furniture_trashBin_lid_a01', x, y: y + 0.014, z: -39.0, yaw: x < 35 ? ROT.E : ROT.W, fit: [0.384, 0.848, 0.364], tag: '垃圾桶', on: 'floor' });
  for (const x of [30, 40]) {
    for (const dx of [-1.1, 0.3]) out.push({ m: 'r2/fountain_pens', x: x + dx, y: y + 1.06, z: ZA - 7.2, yaw: 0.3, w: 0.16, tag: '填单台', on: 'desk' });
    out.push({ m: 'r2/several_folders', x: x + 1.2, y: y + 1.06, z: ZA - 6.9, yaw: -0.2, h: 0.22, tag: '填单台', on: 'desk' });
    for (const dx of [-0.9, 0.9]) { globe(out, x + dx, -39.0, y, H, 3.3, { r: 0.2 }); light(out, x + dx, y + 3.0, -39.0, 0xffe6c8, 1.0, 6); } }
  hang(out, '填 单 区', 35, y + 3.7, -39.0, 0, 1.9, 0.42, y + H);
  pic(out, 'textures/b07/B07_污染举报登记表.png', 30, y + 1.95, ZA - 0.42, Math.PI, 0.66, 0.88, 'wood', { tag: '填写样张' });
  pic(out, 'textures/b04/B04_空白附表七.png', 40, y + 1.95, ZA - 0.42, Math.PI, 0.66, 0.88, 'wood', { tag: '填写样张' });
  out.push({ sign: '填写样张', sub: '污染举报登记表', x: 30, y: y + 1.35, z: ZA - 0.42, yaw: Math.PI, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
  out.push({ sign: '填写样张', sub: '附表七（归档人员查询）', x: 40, y: y + 1.35, z: ZA - 0.42, yaw: Math.PI, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
  for (const x of [30, 40]) light(out, x, y + 2.6, ZA - 1.2, 0xffe6c8, 0.8, 4);
  // ⑤ 东区：5 号窗专用等候（同款座椅 2 排，面朝窗口）+ 西侧屏风 + 展架海报 + 报刊架
  for (const z of [-44.0, -46.4]) out.push({ m: 'street_seating', x: 45.9, y, z, yaw: Math.PI, w: 4.2, tag: '5 号窗等候', on: 'floor' });
  lowScreen(out, 'z', 43.4, -47.0, -42.6, y); lowScreen(out, 'x', -42.6, 43.4, 48.4, y);
  hang(out, '5 号窗 · 加试报名咨询等候', 45.9, y + 3.6, -45.2, 0, 3.0, 0.42, y + H);
  pic(out, 'textures/b02/B02_海报_加试报名大厅.png', 48.9, y + 1.3, -41.6, Math.PI * 0.85, 0.66, 0.99, 'black', { tag: '流程海报', stand: true, fy: y });
  out.push({ fixed: true, m: '固定:展板', x: 48.9, y, z: -41.6, yaw: 0, size: [0.74, 1.85, 0.4], tag: '流程海报', on: 'floor' });
  out.push({ m: 'r2/news_rack_6080', x: 44.2, y, z: -41.3, yaw: 0, h: 1.48, tag: '报刊架', on: 'floor' });
  for (const z of [-44.0, -46.4]) { globe(out, 45.9, z, y, H, 4.2, { r: 0.22 }); light(out, 45.9, y + 4.0, z, 0xffe2b8, 1.4, 9); }
  // ⑥ 东墙：窗下暖气片 + 窗间信报箱（群众来信投递）+ 楼梯口
  for (const z of [-36, -44.6]) out.push({ m: 'r4/cast_iron_radiator_bart', x: 55.79, y: y + 0.1, z, yaw: ROT.W, fit: [0.926, 0.624, 0.153], tag: '暖气', on: 'wall' });
  for (const z of [-39.55, -41.05]) out.push({ m: 'r4/soviet_mailbox_bank', x: 55.69, y: y + 1.05, z, yaw: ROT.W, fit: [1.383, 0.494, 0.389], tag: '来信投递', on: 'wall' });
  out.push({ sign: '群众来信投递', sub: '投递后由信访科每日 17:00 统一开箱', x: 55.88, y: y + 1.9, z: -40.3, yaw: ROT.W, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
  light(out, 54.6, y + 2.8, -40.3, 0xffe6c8, 0.9, 5);
  // 东墙窗前休息座椅（同款，背靠窗、面朝大厅；让开窗间信报箱 z −38.9…−41.7 与楼梯口）
  for (const z of [-35.7, -45.2]) out.push({ m: 'street_seating', x: 53.4, y, z, yaw: ROT.W, w: 4.2, tag: '休息座椅', on: 'floor' });
  out.push({ m: 'r4/furniture_trashBin_lid_a01', x: 53.4, y, z: -42.4, yaw: ROT.W, fit: [0.384, 0.848, 0.364], tag: '垃圾桶', on: 'floor' });
  for (const z of [-35.7, -45.2]) { globe(out, 53.0, z, y, H, 4.2, { r: 0.22 }); light(out, 53.0, y + 4.0, z, 0xffe2b8, 1.2, 8); }
  out.push({ m: 'r4/fireExtinguisher_abc_a03', x: 55.72, y, z: -48.6, yaw: ROT.W, fit: [0.144, 0.545, 0.192], tag: '消防', on: 'floor' });
  out.push({ m: 'r4/furniture_trashBin_lid_a01', x: 55.6, y, z: -47.6, yaw: ROT.W, fit: [0.384, 0.848, 0.364], tag: '垃圾桶', on: 'floor' });
  out.push({ m: 'r2/exit_sign', x: 53.0, y: y + 3.2, z: -52.58, yaw: 0, w: 0.36, tag: '导视', on: 'wall' });
  // ⑦ 西南取号：叫号机前铜柱红绳排队道；西墙挂钟/出口标识/灭火器；四角绿植
  stanchions(out, [[21.45, -35.7], [21.45, -38.6]], y, '取号排队'); stanchions(out, [[22.55, -35.7], [22.55, -38.6]], y, '取号排队');
  hang(out, '取 号', 22.0, y + 3.0, -35.3, 0, 1.0, 0.36, y + H);
  out.push({ m: 'r2/1950s_wall_clock', x: X0 + 0.38, y: y + 3.0, z: -40.0, yaw: ROT.E, h: 0.5, tag: '挂钟', on: 'wall' });
  // 批次37：3.5 m 以上墙面按功能补——北墙窗口带上方胡桃檐线（把 5 块窗间墙板连成一条）+ 标语铜字；南墙正中大挂钟（候号座椅、填单岛都朝它）+ 两侧公示栏（访客须知 / 办事规章，IMAGE-PLAN 未用图）+ 南墙上部石线脚两道
  out.push({ box: 'dz_wain', x: 34.3, y: y + 4.58, z: -52.42, w: 27.4, h: 0.18, d: 0.16, uv: 0.5, tag: '檐线', on: 'partv' });
  out.push({ box: 'dz_brassDim', x: 34.3, y: y + 4.475, z: -52.335, w: 27.4, h: 0.025, d: 0.02, tag: '檐线', on: 'partv' });
  out.push({ wtext: '全 心 全 意　为 市 民 叙 事 服 务', x: 34.3, y: y + 5.55, z: -52.48, yaw: 0, w: 10.5, h: 0.72, size: [10.9, 0.92, 0.1], tag: '标语', on: 'pic' });
  // 批次43：cs_r3_b（批次41 回图）挂钟 / 公示栏在南墙仍偏小 → 挂钟 1.35 → 1.6 m（再大挂钟模型进深超墙，r3plan 越界 / 离墙二选一）、公示栏 1.7×2.25 → 2.1×2.5（中心 x 28.9 / 41.1，夹在 3.55 / 6.25 两道线脚之间），画灯随之上移加宽
  // 批次39：cs_r3_b 看图——挂钟 / 公示栏远看偏小偏暗 → 挂钟 0.9 → 1.35 m、公示栏 1.2×1.6 → 1.7×2.25（中心 x 29.2 / 40.8 让开挂钟），各补一盏洗墙射灯 + 挂钟顶灯；石线脚改米灰石灰岩
  out.push({ m: 'r2/old_wall_clock', x: 35, y: y + 4.85, z: -32.59, yaw: ROT.N, h: 1.6, tag: '挂钟', on: 'wall' });
  pic(out, 'textures/b01/T01_正门大厅告示牌.png', 28.9, y + 4.9, -32.45, Math.PI, 2.1, 2.5, 'wood', { tag: '公示栏' });
  pic(out, 'textures/b01/B01_18_档案馆规章铜牌.png', 41.1, y + 4.9, -32.45, Math.PI, 2.1, 2.5, 'wood', { tag: '公示栏' });
  for (const x of [28.9, 41.1]) { light(out, x, y + 6.1, -33.6, 0xfff0dc, 1.8, 5.5); out.push({ box: 'dz_brassDim', x, y: y + 6.02 + 0.1, z: -32.62, w: 1.1, h: 0.05, d: 0.22, tag: '画灯', on: 'partv' }); out.push({ box: 'r3_globe', x, y: y + 5.98 + 0.1, z: -32.72, w: 1.0, h: 0.025, d: 0.05, tag: '画灯', on: 'partv' }); }
  light(out, 35, y + 6.0, -33.8, 0xfff0dc, 1.4, 5);
  for (const yy of [3.55, 6.25]) out.push({ box: 'r3_limestone', x: 35, y: y + yy, z: -32.47, w: 30.6, h: 0.12, d: 0.1, uv: 0.5, tag: '线脚', on: 'partv' });
  // 批次39：cs_r3_e 看图——stoneDark 线脚在黑大理石墙上几乎看不出 → 米灰石灰岩 r3_limestone；批次38：东墙两樘尖拱高窗（z −36 / −44.6，窗洞 y+2.0…4.6，eastwing.js）补线脚——石窗台 + 两侧石贴脸 + 拱顶滴水檐 + 拱心石；墙面 y+4.95（拱顶上）/ 6.25 两道通长石线脚，与南墙同高同料
  for (const z of [-36, -44.6]) {
    out.push({ box: 'r3_limestone', x: 55.79, y: y + 1.94, z, w: 0.22, h: 0.09, d: 2.1, uv: 0.5, tag: '窗台', on: 'partv' });
    out.push({ box: 'r3_limestone', x: 55.84, y: y + 1.86, z, w: 0.12, h: 0.08, d: 1.86, uv: 0.5, tag: '窗台', on: 'partv' });
    for (const dz of [-0.98, 0.98]) out.push({ box: 'r3_limestone', x: 55.84, y: y + 3.3, z: z + dz, w: 0.12, h: 2.6, d: 0.14, uv: 0.5, tag: '窗贴脸', on: 'partv' });
    out.push({ box: 'r3_limestone', x: 55.82, y: y + 4.74, z, w: 0.16, h: 0.1, d: 2.3, uv: 0.5, tag: '滴水檐', on: 'partv' });
    out.push({ box: 'r3_limestone', x: 55.83, y: y + 4.6, z, w: 0.14, h: 0.24, d: 0.2, uv: 0.5, tag: '拱心石', on: 'partv' });
  }
  for (const yy of [4.95, 6.25]) out.push({ box: 'r3_limestone', x: 55.85, y: y + yy, z: -42.45, w: 0.1, h: 0.12, d: 19.9, uv: 0.5, tag: '线脚', on: 'partv' });
  out.push({ m: 'r2/exit_sign', x: X0 + 0.36, y: y + 3.4, z: -48.0, yaw: ROT.E, w: 0.36, tag: '导视', on: 'wall' });
  out.push({ m: 'r4/fireExtinguisher_abc_a03', x: 20.45, y, z: -44.4, yaw: ROT.E, fit: [0.144, 0.545, 0.192], tag: '消防', on: 'floor' });
  for (const [x, z] of [[20.85, -33.0], [44.8, -33.0], [49.0, -51.95]]) out.push({ m: 'r2/free_pothos_potted_plant_money_plant', x, y, z, yaw: 0, h: 0.75, tag: '绿植', on: 'floor' });
  wear(out, 20.4, 24.0, -48.6, -47.4, y + 0.0005);
  // —— 批次13：中部 / 南部空地补成组陈设（用户：俯视图中部大片空地）——
  //  ⑧ 东区南 · 综合候号区（x 44.2…48.4，z −42.2…−37.4）：叫号 LED 立屏背靠 5 号窗屏风、面朝南；两排候号长椅面朝屏；东侧铜柱红绳与楼梯通道隔开
  led(out, '综合业务 · 叫号', ['A031|1 号窗', 'B012|2 号窗', 'C007|3 号窗', 'D019|4 号窗'], 46.3, y + 1.55, -42.05, 0, 1.6, 0.9, { stand: true, fy: y, tag: '叫号屏' });
  out.push({ fixed: true, m: '固定:叫号立屏', x: 46.3, y, z: -42.09, yaw: 0, size: [1.3, 2.05, 0.5], tag: '叫号屏', on: 'floor' });
  light(out, 46.3, y + 2.8, -41.0, 0xffe2b8, 0.6, 4);
  for (const z of [-40.3, -38.0]) out.push({ m: 'street_seating', x: 46.3, y, z, yaw: Math.PI, w: 4.2, tag: '综合候号', on: 'floor' });
  for (const z of [-40.3, -38.0]) { globe(out, 46.3, z + 0.4, y, H, 4.2, { r: 0.22 }); light(out, 46.3, y + 4.0, z + 0.4, 0xffe2b8, 1.2, 8); }
  stanchions(out, [[49.0, -41.0], [49.0, -38.9], [49.0, -36.8]], y, '隔离带');
  out.push({ m: 'r2/monstera_deliciosa_potted_mid_century_pl', x: 48.6, y, z: -35.5, yaw: 0.6, h: 1.1, tag: '绿植', on: 'floor' });
  hang(out, '综 合 候 号', 46.3, y + 3.6, -39.2, 0, 2.0, 0.42, y + H);
  //  ⑨ 南墙休息带（z −35.6…−32.4）：正中一排候号长椅背靠南墙、面朝填单岛；两端大叶绿植；南墙两角宣传资料架（三层插袋，正面朝北）
  out.push({ m: 'street_seating', x: 35, y, z: -34.25, yaw: Math.PI, w: 4.2, tag: '休息座椅', on: 'floor' });
  for (const x of [32.2, 37.8]) out.push({ m: 'r2/monstera_deliciosa_potted_mid_century_pl', x, y, z: -33.2, yaw: x * 1.7, h: 1.1, tag: '绿植', on: 'floor' });
  globe(out, 35, -34.3, y, H, 4.2, { r: 0.22 }); light(out, 35, y + 4.0, -34.3, 0xffe2b8, 1.0, 7);
  for (const x of [25.35, 26.4, 42.35, 43.4]) leafletRack(out, x, -32.62, ROT.N, y);
  for (const x of [25.9, 42.9]) out.push({ sign: '政策宣传资料', sub: '免费取阅 · 每人限取一份', x, y: y + 1.75, z: -32.47, yaw: ROT.N, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
  for (const x of [25.9, 42.9]) light(out, x, y + 2.6, -33.4, 0xffe6c8, 0.7, 4);
  //  ⑩ 西区（x 26.3…26.9，岛西端外侧）：两只资料架面朝西迎取号人流 + 「办事指南」落地告示立架 + 绿植
  for (const z of [-38.45, -39.55]) leafletRack(out, 26.55, z, ROT.W, y);
  pic(out, 'textures/b02/B02_市民服务窗口牌.png', 26.2, y + 1.45, -35.0, ROT.W + 0.35, 0.95, 0.41, 'black', { tag: '办事指南', stand: true, fy: y });
  out.push({ fixed: true, m: '固定:展板', x: 26.2, y, z: -35.0, yaw: 0, size: [1.05, 1.75, 0.45], tag: '办事指南', on: 'floor' });
  return { room, items: out };
}
/** 三层插袋式宣传资料架（木柜身 + 阶梯插袋 + 亚克力挡条 + 竖插的折页），正面朝 yaw */
function leafletRack(out, x, z, yaw, y, tag = '宣传资料架') {
  const P = (lx, lz) => at([x, z], yaw, lx, lz), W = 0.9, D = 0.32;
  let [px, pz] = P(0, 0); out.push({ box: 'dz_wain', x: px, y: y + 0.42, z: pz, w: W, h: 0.84, d: D, yaw, uv: 0.6, tag, on: 'partv' });
  out.push({ box: 'stoneDark', x: px, y: y + 0.04, z: pz, w: W + 0.02, h: 0.08, d: D + 0.02, yaw, tag, on: 'partv' });
  [px, pz] = P(0, -0.1); out.push({ box: 'dz_wain', x: px, y: y + 1.1, z: pz, w: W, h: 0.52, d: 0.12, yaw, uv: 0.6, tag, on: 'partv' });
  const cols = ['dz_paper', 'r3_paintYellow', 'dz_paper2', 'kraft', 'dz_paper', 'dz_paper2'];
  for (let t = 0; t < 3; t++) { const ty = y + 0.86 + t * 0.2, tz = 0.1 - t * 0.075;
    [px, pz] = P(0, tz); out.push({ box: 'dz_brassDim', x: px, y: ty, z: pz, w: W - 0.04, h: 0.015, d: 0.1, yaw, tag, on: 'partv' });
    [px, pz] = P(0, tz + 0.05); out.push({ box: 'r3_glassCase', x: px, y: ty + 0.06, z: pz, w: W - 0.04, h: 0.1, d: 0.006, yaw, tag, on: 'partv' });
    for (let k = 0; k < 3; k++) { [px, pz] = P(-0.28 + k * 0.28, tz); out.push({ box: cols[(t * 3 + k) % cols.length], x: px, y: ty + 0.12, z: pz, w: 0.21, h: 0.22, d: 0.012, yaw, tag, on: 'partv' }); } }
  [px, pz] = P(0, 0); out.push({ fixed: true, m: '固定:资料架', x: px, y, z: pz, yaw, size: [W, 1.4, D], tag, on: 'floor' });
}
/** 叫号 LED 屏（r3build it.led）：rows 每行「号码|窗口」 */
function led(out, title, rows, x, y, z, yaw, w, h, o = {}) { out.push({ led: true, title, rows, x, y, z, yaw, w, h, size: [w, h, 0.08], tag: o.tag ?? '叫号屏', on: 'pic', ...o }); }
PLANS.citizen_service = (Y) => fixYaw(planCitizenService(Y)); R3.citizen_service = true;
// ================= R3 批次12 · 上层电梯厅（2F / 3F / 4F 藏书阁 / 12F，vault.js elevatorHall 同一套：x −9…9，z −84.2…−91.8，层高 5.2） =================
// 原状：只有两樘金拱电梯门 + 中间铜牌 + 3 条琥珀灯槽，四壁石墙、深色地砖，空。剧情/机制锚点：电梯门、呼梯按钮（x ±8）、楼层铜牌、金字层名——不动。
// 平面：南墙 = 电梯墙（两樘门 x ±6，门前 2.4 m 候梯区净空）；北墙中间 4.4 m 开口进本层（中轴通道净空）。
//  ① 地面：深色石材收边 + 暖灰水磨石心 + 铜嵌条，每樘电梯门口黑石门槛；门前、中轴走磨损
//  ② 东西墙对称：各一张 18 世纪包面长凳（背靠墙、面朝中轴），凳两侧铜烛台壁灯；西凳北端伞架；东墙北角灭火器
//  ③ 南墙：楼层铜牌两侧铜壁灯；北墙开口两侧铸铁瓮式花钵；开口西侧「楼层导览」铜牌（全楼索引），开口上方出口标识
//  ④ 顶棚：原灯槽保留；补烟感 2、监控 1
const LOBBY_DIR = ['12F　机要室 · 局长室', '4F–11F　典籍藏书阁', '3F　办公区 · 医务室 · 实验室', '2F　国际联络处 · 宣传处', '1F　安检大厅 · 市民服务', '1F 西翼　人事档案馆', 'B1–B7　凭证件乘梯'];
function planLobby(y, F) {
  const out = []; const X = 9, ZS = -84.2, ZN = -91.8, H = 5.2;
  const room = { name: `${F} · 电梯厅（批次12）`, x0: -X, x1: X, z0: ZN, z1: ZS, y, H, doors: [{ wall: 'N', a: -2.2, b: 2.2, label: '进本层' }, { wall: 'S', a: -7.8, b: -4.2, label: '电梯 A' }, { wall: 'S', a: 4.2, b: 7.8, label: '电梯 B' }], windows: [],
    rooms: [['① 候梯区', 0, -85.6], ['② 休息长凳', -7.6, -88.4], ['② 休息长凳', 7.6, -88.4], ['③ 导览', -5.2, -91.0]],
    aisles: [{ label: '候梯区净空', x0: -8.6, x1: 8.6, z0: -86.6, z1: -84.45 }, { label: '中轴通道', x0: -2.2, x1: 2.2, z0: -91.8, z1: -86.6 }] };
  // 固定：电梯门（含门套）、呼梯按钮
  for (const x of [-6, 6]) F7(out, '电梯门', x, ZS - 0.08, 3.7, 0.16, y, 0, 3.4);
  for (const x of [-8.45, 8.45]) out.push({ fixed: true, m: '固定:呼梯按钮', x, y: y + 1.05, z: ZS - 0.13, yaw: 0, size: [0.3, 0.5, 0.05], tag: '呼梯', on: 'wall' });
  // ① 地面
  floorZ(out, 'r3_marbleHoned', -X, X, ZN, ZS, y, { border: 0.5, uv: 0.5 }); // 批次13：水磨石在暖白顶灯下仍近白一大片 → 哑光深色大理石
  for (const [x0, x1, z0, z1] of [[-8.5, 8.5, -91.32, -91.29], [-8.5, 8.5, -84.73, -84.7], [-8.52, -8.49, -91.3, -84.7], [8.49, 8.52, -91.3, -84.7]]) out.push({ box: 'dz_brassDim', x: (x0 + x1) / 2, y: y + 0.0105, z: (z0 + z1) / 2, w: x1 - x0, h: 0.003, d: z1 - z0, tag: '地面', on: 'partv' });
  for (const x of [-6, 6]) { out.push({ box: 'r3_stoneBorder', x, y: y + 0.012, z: ZS - 0.32, w: 2.7, h: 0.012, d: 0.5, tag: '地面', on: 'partv' }); wear(out, x - 1.3, x + 1.3, -86.4, -84.8, y + 0.006); }
  wear(out, -6, 6, -86.6, -85.6, y + 0.006);
  // ② 东西墙长凳 + 壁灯 + 伞架 / 灭火器
  // 批次12 收尾返工：每面墙两张长凳成对（中间让开壁柱 z −88），凳间铜垃圾桶；墙面改胡桃木墙裙 + 方石（vault.js elevatorHall UP），墙上件前移 0.1
  for (const s of [-1, 1]) { const x = s * (X - 0.56);
    for (const bz of [-87.4, -90.0]) out.push({ m: 'r2/18th_century_bench_from_hungarian_opera', x, y, z: bz, yaw: s < 0 ? ROT.E : ROT.W, w: 1.5, tag: '休息长凳', on: 'floor' });
    out.push({ m: 'r4/furniture_trashBin_lid_a01', x: s * 4.45, y, z: -91.5, yaw: 0, fit: [0.384, 0.848, 0.364], tag: '垃圾桶', on: 'floor' });
    out.push({ m: 'r2/monstera_deliciosa_potted_mid_century_pl', x: s * (X - 0.62), y, z: -88.72, yaw: s * 0.8, h: 0.7, tag: '绿植', on: 'floor' }); // 批次13：绿萝陶盆偏粉 → 龟背竹
    for (const z of [-86.9, -90.3]) { sconce(out, s * (X - 0.19), y + 2.1, z, s < 0 ? ROT.E : ROT.W); light(out, s * (X - 0.5), y + 2.5, z, 0xfff0dc, 0.9, 5); } }
  out.push({ m: 'r2/victorian_umbrella_stand', x: -6.9, y, z: -91.2, yaw: 0, h: 1.9, tag: '伞架', on: 'floor' });
  out.push({ m: 'r4/fireExtinguisher_abc_a03', x: 7.4, y, z: -91.55, yaw: ROT.W, fit: [0.144, 0.545, 0.192], tag: '消防', on: 'floor' });
  // ③ 南墙铜牌两侧壁灯；北墙花钵、导览铜牌、出口标识
  for (const x of [-2.4, 2.4]) { sconce(out, x, y + 1.95, ZS - 0.2, Math.PI); light(out, x, y + 2.4, ZS - 0.5, 0xfff0dc, 0.8, 4.5); }
  for (const x of [-3.3, 3.3]) out.push({ m: 'r2/ornamental_urn_planter', x, y, z: ZN + 0.5, yaw: 0, h: 1.0, tag: '花钵', on: 'floor' });
  out.push({ plaque: true, title: '楼 层 导 览', lines: LOBBY_DIR, x: -3.97, y: y + 1.7, z: ZN + 0.13, yaw: 0, w: 0.75, h: 1.0, size: [0.8, 1.05, 0.04], tag: '导览', on: 'pic' });
  light(out, -3.97, y + 2.9, ZN + 0.9, 0xffe6c8, 0.7, 3.5);
  out.push({ m: 'r2/exit_sign', x: 0, y: y + 3.45, z: ZN + 0.15, yaw: 0, w: 0.36, tag: '导视', on: 'wall' });
  if (F === '4F') { pic(out, 'textures/emblems/N24.jpg', 3.97, y + 2.3, ZN + 0.14, 0, 2.4, 1.35, 'gold', { tag: '入口壁画' }); out.push({ sign: '典籍藏书阁', sub: '宇宙图书馆 · 想象图', x: 3.97, y: y + 1.35, z: ZN + 0.14, yaw: 0, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' }); light(out, 3.97, y + 3.6, ZN + 1.2, 0xffe6c8, 0.9, 5); } // IMAGE-PLAN N24：藏书阁入口主视觉壁画
  if (F !== '4F') pic(out, 'textures/b01/B01_04_新人报到告示.png', 3.97, y + 1.65, ZN + 0.14, 0, 0.75, 1.0, 'wood', { tag: '告示框', cork: [1.5, 1.15] });
  // 中轴红地毯（北口 → 候梯区）+ 铜压条；候梯区黑石门槛已有
  out.push({ box: 'dz_rugRed', x: 0, y: y + 0.016, z: -89.1, w: 2.0, h: 0.012, d: 4.9, uv: false, tag: '地毯', on: 'partv' });
  for (const sx of [-1, 1]) out.push({ box: 'dz_brassDim', x: sx * 1.02, y: y + 0.015, z: -89.1, w: 0.04, h: 0.014, d: 4.9, tag: '地毯', on: 'partv' });
  // ④ 顶棚
  smoke(out, y, H, [[-4.5, -88], [4.5, -88]]);
  out.push({ m: 'r2/security_camera_02', x: 8.6, y: y + H - 0.25, z: ZN + 0.3, yaw: -2.4, h: 0.22, tag: 'K3', on: 'ceil' });
  return { room, items: out };
}
for (const F of ['2F', '3F', '4F', '12F']) { PLANS['lobby_' + F] = (Y) => fixYaw(planLobby(Y, F)); R3['lobby_' + F] = true; }
// ================= R3 批次12 · 东侧楼梯 east_stair（x 50…56，z −54…−64，双跑 1F→2F→3F；y 1.8 / 8.8 / 15.8） =================
// 原状：黑大理石踏步 20 级 × 4 跑、西侧一根悬空铜扶手、两处中间平台、中间隔墙；没有踏步防滑条、靠墙扶手、平台标识与照明。楼梯本体与碰撞不动。
// 平面（每层同构）：西跑 x 50.2…52.9 由 z −54 向南上到平台 z −62.4…−64；东跑 x 53.1…55.8 由平台向北上到上层 z −54。
//  ① 每级踏步前缘铜防滑条（80 级），平台前缘同样处理
//  ② 扶手：西跑外侧原铜扶手补立杆（每 2 级 1 根）；中间隔墙两侧、东外墙一侧加靠墙铜扶手 + 托架（每 1.6 m）
//  ③ 平台：隔墙南端面挂层间指示铜牌（上行 / 下行去向），东外墙铜壁灯 + 暖光；平台角落灭火器（两处平台错开东西角）
//  ④ 到达口：2F / 3F 楼梯口西墙（x 50）楼层铜牌；1F 楼梯脚磨损
//  ⑤ 照明：每跑中段东外墙 / 隔墙各一盏壁灯
function rod(out, mat, a, b, r = 0.022, tag = '扶手') { out.push({ rod: true, mat, a, b, r, x: (a[0] + b[0]) / 2, y: Math.min(a[1], b[1]), z: (a[2] + b[2]) / 2, size: [0.05, 0.05, 0.05], tag, on: 'partv' }); }
export function planEastStair(y) {
  const out = []; const Y = y, LV = [[Y, Y + 7], [Y + 7, Y + 14]], Z0 = -54, ZL = -62.4;
  const room = { name: '东侧楼梯（批次12，三层叠合俯视）', x0: 50, x1: 56, z0: -64, z1: -53.4, y, H: 21, doors: [{ wall: 'N', a: 50.2, b: 55.8, label: '1F 市民服务 / 2F·3F 楼梯口' }], windows: [{ wall: 'E', a: -62.6, b: -61.0 }],
    rooms: [['西跑 ↓', 51.55, -58.2], ['东跑 ↑', 54.45, -58.2], ['平台', 53, -63.2]], aisles: [] };
  F7(out, '西跑踏步', 51.55, -58.2, 2.7, 8.4, y, 0, 0.1); F7(out, '东跑踏步', 54.45, -58.2, 2.7, 8.4, y, 0, 0.1); F7(out, '中间隔墙', 53, -58.2, 0.2, 8.4, y, 0, 3);
  const fl = (x0, x1, za, ya, zb, yb) => { const n = 20, run = (za - zb) / n, rise = (yb - ya) / n, s = Math.sign(run);
    for (let i = 0; i < n; i++) { const zn = za - run * i, top = ya + rise * (i + 1) + 0.025; out.push({ box: 'dz_brassDim', x: (x0 + x1) / 2, y: top + 0.004, z: zn - s * 0.03, w: x1 - x0 - 0.12, h: 0.01, d: 0.05, tag: '防滑条', on: 'partv' }); out.push({ box: 'blackMetal', x: (x0 + x1) / 2, y: top + 0.0045, z: zn - s * 0.075, w: x1 - x0 - 0.12, h: 0.009, d: 0.035, tag: '防滑条', on: 'partv' }); }
    return { run, rise }; };
  for (const [ya, yb] of LV) { const ym = (ya + yb) / 2;
    const w = fl(50.2, 52.9, Z0, ya, ZL, ym); fl(53.1, 55.8, ZL, ym, Z0, yb);
    // 平台前缘
    out.push({ box: 'dz_brassDim', x: 51.55, y: ym + 0.004, z: ZL - 0.03, w: 2.6, h: 0.01, d: 0.05, tag: '防滑条', on: 'partv' });
    // ② 扶手：西跑外侧立杆（原扶手 x 50.25，高 0.95）；隔墙两侧 + 东外墙靠墙扶手 + 托架
    for (let i = 1; i < 20; i += 2) { const zn = Z0 - w.run * (i + 0.5), top = ya + w.rise * (i + 1) + 0.025; out.push({ box: 'brass', x: 50.25, y: top + 0.45, z: zn, w: 0.025, h: 0.9, d: 0.025, tag: '扶手', on: 'partv' }); }
    for (const [x, za, ra, zb, rb] of [[52.84, Z0, ya, ZL, ym], [53.16, ZL, ym, Z0, yb], [55.84, ZL, ym, Z0, yb]]) {
      rod(out, 'brass', [x, ra + 0.9 + 0.05, za], [x, rb + 0.9 + 0.05, zb]);
      for (let t = 0.1; t < 1; t += 0.2) { const zz = za + (zb - za) * t, yy = ra + (rb - ra) * t + 0.92; out.push({ box: 'dz_brassDim', x: x + (x > 53 && x < 54 ? -0.05 : x > 55 ? 0.05 : 0.05), y: yy, z: zz, w: 0.08, h: 0.025, d: 0.025, tag: '扶手', on: 'partv' }); } }
    // ③ 平台：层间指示铜牌（隔墙南端面）+ 东墙壁灯 + 灭火器
    const lvN = ya === Y ? ['1F ↔ 2F', ['↑ 2F　监测指挥中心 · 阅卷中心', '↓ 1F　市民服务大厅 · 考务大厅']] : ['2F ↔ 3F', ['↑ 3F　禁区封锁调度厅 · 副本投放调度室', '↓ 2F　监测指挥中心 · 阅卷中心']];
    out.push({ plaque: true, title: lvN[0], lines: lvN[1], x: 53, y: ym + 1.75, z: ZL - 0.012, yaw: Math.PI, w: 0.18, h: 0.24, size: [0.2, 0.26, 0.02], tag: '层间铜牌', on: 'pic' });
    out.push({ sconce: true, x: 55.97, y: ym + 2.3, z: -63.2, yaw: ROT.W, size: [0.2, 0.3, 0.2], tag: '壁灯', on: 'sconce' }); light(out, 55.4, ym + 2.5, -63.2, 0xffd8a8, 1.1, 6);
    out.push({ m: 'r4/fireExtinguisher_abc_a03', x: ya === Y ? 55.62 : 50.38, y: ym, z: -63.75, yaw: ya === Y ? ROT.W : ROT.E, fit: [0.144, 0.545, 0.192], tag: '消防', on: 'floor' });
    // ⑤ 每跑中段壁灯（东外墙 / 西侧隔墙面）
    out.push({ sconce: true, x: 55.97, y: (ym + yb) / 2 + 2.2, z: -58.2, yaw: ROT.W, size: [0.2, 0.3, 0.2], tag: '壁灯', on: 'sconce' }); light(out, 55.3, (ym + yb) / 2 + 2.4, -58.2, 0xffd8a8, 1.0, 6);
    out.push({ sconce: true, x: 52.9, y: (ya + ym) / 2 + 2.2, z: -58.2, yaw: ROT.W, size: [0.2, 0.3, 0.2], tag: '壁灯', on: 'sconce' }); light(out, 52.3, (ya + ym) / 2 + 2.4, -58.2, 0xffd8a8, 1.0, 6);
  }
  // ④ 到达口铜牌（2F / 3F 楼梯口西墙 x 50 东面）+ 1F 楼梯脚磨损
  for (const [fy, t, l] of [[Y + 7, '2F', ['监测指挥中心　→ 西门', '阅卷中心　　　→ 南区', '↑ 3F　↓ 1F']], [Y + 14, '3F', ['禁区封锁调度厅　→ 西门', '副本投放调度室　→ 南区', '↓ 2F · 1F']]]) {
    out.push({ plaque: true, title: t, lines: l, x: 50.16, y: fy + 1.7, z: -52.6, yaw: ROT.E, w: 0.45, h: 0.6, size: [0.5, 0.65, 0.04], tag: '楼层铜牌', on: 'pic' }); light(out, 50.9, fy + 2.6, -52.6, 0xffe6c8, 0.7, 4); }
  wear(out, 50.3, 52.8, -53.95, -53.0, y + 0.0105);
  return { room, items: out };
}
PLANS.east_stair = (Y) => fixYaw(planEastStair(Y)); R3.east_stair = true;
// ================= R3 批次12 · 4F 典籍藏书阁 library 底层阅览厅（圆形，中心 (0, −106)，书架环内缘 r 12.7；y 22.8） =================
// 原状：中央讲经台 + 「本册」巨书、3 处阅读龛（剧情锚点）、规则牌；6 张盒体阅读桌（r 7.2）与地球仪/星图台/限阅柜散放，方形拼花 + 方形红毯压在圆厅里，5 架倚架书梯。
// 平面（角度 a：0 = 南/入口，±90° = 东/西，180° = 北；位置 x = r·sin a，z = −106 + r·cos a）：
//  ① 地面同心圆：讲经台外黑石圈 r 2.8–3.3 → 环形回廊（r 3.3–5.8，铜圈收边 + 8 道罗盘铜线）→ 阅览环拼花（r 5.8–10.6）→ 书架前石材步道（r 10.6–12.7）
//  ② 入口（南）：中轴通道 3.2 m 直通讲经台；入口东侧借阅台（馆员面朝通道）+ 还书周转箱；西侧限阅陈列柜（对称）；入口两侧阅览须知落地铭牌 / 《宇宙图书馆假说》展板（N20）
//  ③ 阅览环：东、西、东北、西北 4 张长阅读桌沿圆周切向摆放（r 7.4），每桌 4 椅（内外两侧各 2）、2 盏绿罩台灯、摊开的书 / 文件堆
//  ④ 北区（典藏展示）：北阅读龛两侧地球仪 / 星图台（r 7.0，a ±160°）
//  ⑤ 书架环：原 5 架倚架书梯保留；补 2 架移动登高梯（a ±112°）停在书架前；每张阅读桌一盏暖色补光
function ringF(out, mat, r0, r1, cx, cz, y, uv = 0.5) { out.push({ ring: true, mat, r0, r1, x: cx, y, z: cz, uv, size: [0.1, 0.01, 0.1], tag: '地面', on: 'partv' }); }
export function planLibrary(y) {
  const out = []; const cx = 0, cz = -106, RI = 12.7;
  const P = (a, r) => [cx + Math.sin(a) * r, cz + Math.cos(a) * r], D = Math.PI / 180;
  const room = { name: '4F · 典籍藏书阁底层阅览厅（批次12，圆厅 r 12.7）', x0: -RI, x1: RI, z0: cz - RI, z1: cz + RI, y, H: 46, doors: [{ wall: 'S', a: -3, b: 3, label: '入口（电梯厅）' }], windows: [],
    rooms: [['② 借阅台', 5.6, -96.6], ['② 限阅陈列', -5.6, -96.6], ['③ 阅览', 9.2, -106], ['③ 阅览', -9.2, -106], ['④ 典藏', 0, -114.2]],
    aisles: [{ label: '入口中轴', x0: -1.6, x1: 1.6, z0: -102.6, z1: -93.4 }, { label: '回廊东', x0: 3.4, x1: 5.6, z0: -107.0, z1: -105.0 }, { label: '回廊西', x0: -5.6, x1: -3.4, z0: -107.0, z1: -105.0 }, { label: '回廊北', x0: -1.0, x1: 1.0, z0: -111.6, z1: -109.4 }] };
  // —— 固定锚点 ——
  F7(out, '讲经台', cx, cz, 4.4, 4.4, y, 0, 0.6);
  for (const a of [-0.9, 0.9, Math.PI]) { const [x, z] = P(a, 9.6); F7(out, '阅读龛', x, z, 1.48, 0.82, y, a, 1.94); const [xc, zc] = P(a, 9.6 - 0.70); F7(out, '阅读龛座椅', xc, zc, 0.56, 0.56, y, a, 0.95); } // 批次42：Blender 精建 lib_nook（书格上架 1.94 高 + 读者侧软垫椅）
  for (let k = 0; k < 5; k++) { const a = 0.5 + k * 1.15, [x, z] = P(a, RI - 0.45); F7(out, '倚架书梯', x, z, 0.5, 0.6, y, a, 4.2); }
  // —— ① 地面 ——
  ringF(out, 'r3_stoneBorder', 2.8, 3.3, cx, cz, y + 0.012); ringF(out, 'dz_brassDim', 3.3, 3.36, cx, cz, y + 0.013, 1); ringF(out, 'r3_terrLobby', 3.36, 5.8, cx, cz, y + 0.011); ringF(out, 'dz_brassDim', 5.8, 5.86, cx, cz, y + 0.013, 1);
  ringF(out, 'r3_parquet', 5.86, 10.6, cx, cz, y + 0.011, 0.42); ringF(out, 'dz_brassDim', 10.6, 10.66, cx, cz, y + 0.013, 1); ringF(out, 'r3_stoneBorder', 10.66, RI + 0.2, cx, cz, y + 0.011);
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, [x, z] = P(a, 4.58); out.push({ box: 'dz_brassDim', x, y: y + 0.0135, z, w: 0.04, h: 0.003, d: 2.4, yaw: a, tag: '地面', on: 'partv' }); }
  // 批次12 收尾：去掉入口中轴磨损贴花（白色擦痕压在深色拼花木地板上像口香糖渍，lib_r3 近景）
  // —— ② 入口：借阅台（东）/ 限阅陈列柜（西）/ 两侧落地铭牌与展板 ——
  { const x = 4.4, z = -97.4; out.push({ m: 'r2/antique_desk', x, y, z, yaw: ROT.E, fit: [1.6, 0.78, 0.66], tag: '借阅台', on: 'floor', col: [1.6, 0.78, 0.66] });
    out.push({ m: 'r2/dining_chair_02', x: x + 0.72, y, z, yaw: ROT.W, h: 0.98, tag: '借阅台', on: 'floor' });
    for (const [dz, m, sz] of [[-0.6, 'r2/bankers_lamp', { h: 0.4 }], [0.55, 'r2/desk_bell', { w: 0.1 }], [0.05, 'r4/book_open_a01', { fit: [0.207, 0.037, 0.32] }], [-0.15, 'r2/old_victorian_rubber_stamp', { h: 0.09 }]]) out.push({ m, x: x + (m.includes('book') ? -0.08 : 0.08), y: y + 0.78, z: z + dz, yaw: ROT.W, ...sz, tag: '借阅台', on: 'desk' });
    for (const k of [0, 1]) out.push({ m: 'r4/box_cardboard_open_a01', x: x + 0.9, y: y + k * 0.305, z: z + 1.25, yaw: ROT.W + k * 0.08, fit: [0.636, 0.302, 0.512], tag: '还书周转', on: k ? 'desk' : 'floor', ...(k ? {} : { col: [0.52, 0.302, 0.64] }) });
    out.push({ sign: '借阅 · 归还', sub: '限阅书目须持副局长签批', x: x - 0.34, y: y + 0.55, z, yaw: ROT.W, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
    light(out, x, y + 2.6, z, 0xffe2b8, 1.0, 5); }
  out.push({ fixed: true, m: '固定:限阅陈列柜', x: -4.4, y, z: -97.4, yaw: 0, size: [1.6, 1.8, 0.8], col: [1.6, 1.8, 0.8], tag: '限阅陈列', on: 'floor' });
  light(out, -4.4, y + 2.6, -97.4, 0xffe6c8, 0.9, 5);
  pic(out, 'textures/b07/B07_藏书阁阅览须知.png', 2.3, y + 1.3, -94.6, Math.PI * 0.92, 0.6, 0.8, 'gold', { tag: '阅览须知', stand: true, fy: y });
  out.push({ fixed: true, m: '固定:展板', x: 2.3, y, z: -94.6, yaw: 0, size: [0.7, 1.75, 0.4], tag: '阅览须知', on: 'floor' });
  pic(out, 'textures/emblems/N20.jpg', -2.5, y + 1.35, -94.6, Math.PI * 1.08, 0.96, 0.64, 'gold', { tag: '假说展板', stand: true, fy: y });
  out.push({ fixed: true, m: '固定:展板', x: -2.5, y, z: -94.6, yaw: 0, size: [1.05, 1.8, 0.4], tag: '假说展板', on: 'floor' });
  out.push({ sign: '宇宙图书馆假说', sub: '见西阅读龛摊开的原稿', x: -2.5, y: y + 0.88, z: -94.6 - 0.03, yaw: Math.PI * 1.08, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
  // —— ③ 阅览环：4 张长桌切向（r 7.4），每桌 4 椅 + 2 灯 + 书 ——
  for (const a of [90 * D, -90 * D, 135 * D, -135 * D]) { const c = P(a, 7.4);
    out.push({ m: 'r2/woodentable_01', x: c[0], y, z: c[1], yaw: a, fit: [2.4, 0.78, 1.1], tag: '阅读桌', on: 'floor', col: [2.4, 0.78, 1.1] });
    for (const lx of [-0.6, 0.6]) for (const [lz, cy] of [[0.78, a + Math.PI], [-0.78, a]]) { const [x, z] = at(c, a, lx, lz); out.push({ m: 'r2/dining_chair_02', x, y, z, yaw: cy, h: 0.98, tag: '阅读桌', on: 'floor' }); }
    for (const lx of [-0.85, 0.85]) { const [x, z] = at(c, a, lx, 0); out.push({ m: 'r2/bankers_lamp', x, y: y + 0.78, z, yaw: a, h: 0.4, tag: '阅读桌', on: 'desk' }); }
    { const [x, z] = at(c, a, -0.35, 0.22); out.push({ m: 'r4/book_open_a01', x, y: y + 0.78, z, yaw: a + Math.PI + 0.1, fit: [0.207, 0.037, 0.32], tag: '阅读桌', on: 'desk' }); }
    { const [x, z] = at(c, a, 0.4, -0.2); out.push({ m: 'r4/paper_stack_a04', x, y: y + 0.78, z, yaw: a - 0.2, fit: [0.24, 0.083, 0.34], tag: '阅读桌', on: 'desk' }); }
    light(out, c[0], y + 2.4, c[1], 0xffe2b8, 0.9, 5.5); }
  // —— ④ 北区：地球仪 / 星图台（dressing.js 在 R3 下按这里的位置摆放）——
  for (const [a, lab, w, d] of [[160 * D, '地球仪', 0.9, 0.9], [-160 * D, '星图台', 1.4, 1.0]]) { const [x, z] = P(a, 7.0); out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, 1.5, d], col: [w, 1.5, d], tag: lab, on: 'floor' }); }
  // —— ⑤ 移动登高梯（停在书架前，面朝圆心）——
  for (const a of [112 * D, -112 * D]) { const [x, z] = P(a, RI - 0.55); out.push({ m: 'r4/ladder_step_rolling_a01', x, y, z, yaw: a + Math.PI, fit: [0.758, 1.523, 0.655], tag: '登高梯', on: 'floor' }); }
  return { room, items: out };
}
export const LIB_R3 = { globe: [Math.sin(160 * Math.PI / 180) * 7.0, -106 + Math.cos(160 * Math.PI / 180) * 7.0], star: [Math.sin(-160 * Math.PI / 180) * 7.0, -106 + Math.cos(-160 * Math.PI / 180) * 7.0], vitrine: [-4.4, -97.4] };
PLANS.library = (Y) => fixYaw(planLibrary(Y)); R3.library = true;
// 对照用：?r3off=east_cloister,xxx 关掉指定区的 R3 规划（截图「改前」用，旧陈设随之恢复）
if (typeof location !== 'undefined') { const m = /[?&]r3off=([\w,]+)/.exec(location.search); if (m) for (const id of m[1].split(',')) R3[id] = false; }
// ================= R3 批次14 · 阅卷中心 exam_center（东翼 2F 北区：x 20…50，z −61…−76，层高 6.5；1960–80 年代机关阅卷场） =================
// 平面功能规划（北 = −Z）：
//  入口：南墙 x 40…43 门洞（来自指挥中心）→ 门内后横通道（z −61.2…−63.8）。
//  ① 考位：5 排 × 14 张木课桌（中轴 x 35 主通道 2 m 分东西两块，每块 7 张，间距 1.5 m），人坐南侧面朝北（监考台），每桌一份试卷 + 铅笔。
//  ② 监考台：北墙正中 8 × 2.6 m 黑石台座（0.25 m），两张胡桃木写字台（监考人坐北面朝南）+ 台灯 / 铃 / 电话 / 印章；台前 1.9 m 前横通道。
//  ③ 北墙：正中大挂钟（台座正上方）、两侧告示板 + 阅卷纪律 / 真题卷样张（铜框）、金字「阅卷中心」（原有）。
//  ④ 试卷收发台：东南角沿东侧（x 47.6，z −62.4…−66.6），职员坐东面朝西；台面试卷袋、封条、天平秤；旁边推车。
//  ⑤ 封存柜：西墙两根壁柱之间 12 只铁皮档案柜成排（面朝东，柜门贴红封条）+ 铜牌「试卷封存 · 双人双锁」。
//  ⑥ 南墙门西侧：倒计时告示（B04）；地面：人字木地板 + 黑石收边，中轴深红长地毯；顶棚：乳白球吊灯 8 盏成两列 + 暖白补光。
export const EXAM_R3 = { paper: [47.5, -64.75], note: [47.45, -64.4] }; // 剧情锚点：试卷 / 阅卷便签 → 收发台（eastwing.js 在 R3 下移过来）
export function planExamCenter(y) {
  const out = []; const H = 6.5;
  const room = { name: '东翼 2F · 阅卷中心（批次14）', x0: 20.3, x1: 49.9, z0: -76.0, z1: -61.2, y, H,
    doors: [{ wall: 'S', a: 40, b: 43, label: '指挥中心' }, { wall: 'E', a: -75.9, b: -64.2, label: '楼梯井列（开敞）' }],
    windows: [],
    rooms: [['① 考位（5×14）', 35, -67.6], ['② 监考台', 35, -74.6], ['④ 收发台', 48.3, -64.5], ['⑤ 封存柜', 21.4, -69.0], ['③ 钟 / 告示', 35, -75.6]],
    aisles: [{ label: '后横通道', x0: 21.0, x1: 47.2, z0: -63.75, z1: -61.25 }, { label: '中轴主通道', x0: 34.05, x1: 35.95, z0: -72.8, z1: -61.3 },
      { label: '前横通道', x0: 21.3, x1: 46.6, z0: -72.6, z1: -70.95 }, { label: '西侧通道', x0: 21.3, x1: 24.2, z0: -75.8, z1: -61.3 },
      { label: '东侧通道', x0: 45.75, x1: 47.15, z0: -75.8, z1: -61.3 }, { label: '进门净空', x0: 40.1, x1: 42.9, z0: -63.75, z1: -61.25 }] };
  // —— 地面：人字木地板 + 黑石收边；中轴深红地毯 + 铜压条；后横通道 / 中轴磨损 ——
  floorZ(out, 'r3_parquet', 20.3, 49.9, -75.95, -61.2, y, { border: 0.3, bmat: 'r3_stoneBorder', uv: 0.5 });
  rug(out, 'dz_rugRed', 35, y + 0.008, -66.9, 1.5, 11.6);
  for (const x of [34.22, 35.78]) out.push({ box: 'dz_brassDim', x, y: y + 0.024, z: -66.9, w: 0.03, h: 0.004, d: 11.6, tag: '地面', on: 'partv' });
  // 批次15：红毯花纹 1.5 m 一循环太显眼 → 每两排考位之间横向铜压条分段（与考位行距同步）
  for (const z of [-63.85, -65.35, -66.85, -68.35, -69.85, -71.35]) out.push({ box: 'dz_brassDim', x: 35, y: y + 0.024, z, w: 1.5, h: 0.004, d: 0.035, tag: '地面', on: 'partv' });
  wear(out, 24.5, 46.0, -63.2, -62.0, y); wear(out, 40.6, 42.4, -63.6, -61.4, y);
  // ① 考位
  const XS = [], ZR = [-64.6, -66.1, -67.6, -69.1, -70.6];
  for (let k = 0; k < 7; k++) { XS.push(33.65 - k * 1.5); XS.push(36.35 + k * 1.5); }
  let n = 0;
  for (const z of ZR) for (const x of XS) {
    out.push({ m: 'r2/schooldesk_01', x, y, z, yaw: 0, w: 0.7, tag: '① 考位', on: 'floor', col: [0.7, 0.75, 0.5] });
    out.push({ m: 'r4/exam_chair', x, y, z: z + 0.5, yaw: Math.PI, h: 0.84, tag: '① 考位', on: 'floor' }); // 批次15：Blender 精建实木课椅（原蓝色塑料椅）
    // 批次15：schooldesk_01 台面实测 0.882 × 缩放 0.972 = 0.857（原 0.757 埋在桌面里）
    out.push({ examPaper: true, x: x - 0.04, y: y + 0.870, z: z + 0.02, w: 0.21, h: 0.002, d: 0.297, yaw: 0.04 * ((n % 3) - 1), tag: '① 考位', on: 'desk' }); // 批次16：印刷试卷贴图（原纯色纸块与桌面同色）
    out.push({ box: 'r3_paintYellow', x: x + 0.2, y: y + 0.872, z: z + 0.04, w: 0.012, h: 0.008, d: 0.17, yaw: 0, tag: '① 考位', on: 'desk' });
    n++;
  }
  // ② 监考台：台座 + 铜包边 + 两步踏步
  out.push({ box: 'stoneDark', x: 35, y: y + 0.125, z: -74.25, w: 8, h: 0.25, d: 2.6, uv: 0.5, tag: '② 监考台', on: 'partv' });
  out.push({ box: 'r3_marbleHoned', x: 35, y: y + 0.254, z: -74.25, w: 7.9, h: 0.008, d: 2.5, uv: 0.5, tag: '② 监考台', on: 'partv' });
  out.push({ box: 'dz_brassDim', x: 35, y: y + 0.22, z: -72.94, w: 8.02, h: 0.04, d: 0.02, tag: '② 监考台', on: 'partv' });
  // 批次15：台座碰撞 + 前沿 0.125 m 踏步（两级各 0.125，可走上）
  out.push({ fixed: true, m: '固定:台座碰撞', x: 35, y, z: -74.25, yaw: 0, size: [8, 0.25, 2.6], col: [8, 0.25, 2.6], tag: '② 监考台', on: 'partv' });
  out.push({ box: 'stoneDark', x: 35, y: y + 0.0625, z: -72.8, w: 7.6, h: 0.125, d: 0.3, uv: 0.5, tag: '② 监考台 踏步', on: 'partv' });
  out.push({ box: 'dz_brassDim', x: 35, y: y + 0.118, z: -72.655, w: 7.62, h: 0.014, d: 0.012, tag: '② 监考台 踏步', on: 'partv' });
  out.push({ fixed: true, m: '固定:踏步碰撞', x: 35, y, z: -72.8, yaw: 0, size: [7.6, 0.125, 0.3], col: [7.6, 0.125, 0.3], tag: '② 监考台 踏步', on: 'partv' });
  for (const dx of [-3.2, 3.2]) {
    const cx = 35 + dx, cz = -74.0, top = y + 0.25 + 0.78;
    out.push({ m: 'r2/antique_desk', x: cx, y: y + 0.25, z: cz, yaw: Math.PI, h: 0.78, tag: '② 监考台', on: 'floor', col: [1.53, 0.78, 0.63] });
    out.push({ m: 'r2/literary_club_chair_preview', x: cx, y: y + 0.25, z: cz - 0.62, yaw: 0, h: 1.05, tag: '② 监考台', on: 'floor' });
    out.push({ m: 'r2/bankers_lamp', x: cx + 0.55, y: top, z: cz - 0.12, yaw: 0, h: 0.36, tag: '② 监考台', on: 'desk' });
    out.push({ m: dx < 0 ? 'r2/desk_bell' : 'r2/rotary_telephone', x: cx - 0.5, y: top, z: cz + 0.05, yaw: 0, w: dx < 0 ? 0.1 : 0.24, tag: '② 监考台', on: 'desk' });
    out.push({ m: 'r2/old_victorian_rubber_stamp', x: cx - 0.1, y: top, z: cz + 0.12, yaw: 0, h: 0.09, tag: '② 监考台', on: 'desk' });
    out.push({ m: 'r2/several_folders', x: cx + 0.15, y: top, z: cz - 0.15, yaw: 0.3, h: 0.3, tag: '② 监考台', on: 'desk' });
    out.push({ sign: dx < 0 ? '主 监 考' : '副 监 考', sub: '阅卷期间禁止交谈', x: cx, y: y + 0.25 + 0.6, z: cz + 0.33, yaw: 0, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
  }
  light(out, 35, y + 3.2, -73.4, 0xfff0dc, 1.6, 8);
  // ③ 北墙（批次15 补满）：局徽（顶）→ 铜框大挂钟 + 两侧「肃」「静」铜字 → 告示板（印刷告示）+ 样张 + 两条标语
  out.push({ box: 'stoneDark', x: 35, y: y + 3.55, z: -75.975, w: 1.7, h: 1.7, d: 0.04, uv: 0.5, tag: '③ 钟', on: 'partv' });
  out.push({ box: 'dz_brassDim', x: 35, y: y + 3.55, z: -75.99, w: 1.84, h: 1.84, d: 0.03, tag: '③ 钟', on: 'partv' });
  out.push({ clock: true, r: 0.6, x: 35, y: y + 3.55, z: -75.9, yaw: 0, w: 1.36, h: 1.36, size: [1.36, 1.36, 0.16], tag: '③ 钟', on: 'sign' }); // 批次16：象牙白表盘 + 黑罗马数字 + 铜框（原 1950s_wall_clock 表盘偏青像盾牌）
  pic(out, 'textures/emblems/N01.jpg', 35, y + 4.95, -75.95, 0, 0.8, 0.8, 'gold', { tag: '③ 局徽' }); // 批次16：下移，不再与「阅卷中心」金字重叠
  // 批次16：墙面统一 = 胡桃木墙裙（原有）+ 方石上墙 dz_ashlarEC（北 / 西 / 南三面，原北墙黑、南墙绿色斑驳抹灰）
  const AH = H - 1.25, AY = y + 1.25 + AH / 2;
  out.push({ box: 'dz_ashlarEC', x: 35.1, y: AY, z: -75.993, w: 29.6, h: AH, d: 0.01, tag: '墙面', on: 'partv' });
  out.push({ box: 'dz_ashlarEC', x: 20.307, y: AY, z: -68.6, w: 0.01, h: AH, d: 14.8, tag: '墙面', on: 'partv' });
  for (const [a, c] of [[20.3, 40], [43, 49.9]]) out.push({ box: 'dz_ashlarEC', x: (a + c) / 2, y: AY, z: -61.207, w: c - a, h: AH, d: 0.01, tag: '墙面', on: 'partv' });
  out.push({ box: 'dz_ashlarEC', x: 41.5, y: y + 3 + (H - 3) / 2, z: -61.207, w: 3, h: H - 3, d: 0.01, tag: '墙面', on: 'partv' });
  // 批次21：exam_r3_b 远端（东侧开敞楼梯井列 x 50…56）外墙内面纯黑、彩窗悬浮 → 方石护面（避开 z −61.8 / −70.4 两樘彩窗）+ 南端墙护面 + 洗墙暖光
  for (const [a, c] of [[-62.95, -69.25], [-71.55, -75.8]]) out.push({ box: 'dz_ashlarEC', x: 55.785, y: y + H / 2, z: (a + c) / 2, w: 0.01, h: H, d: a - c, tag: '墙面', on: 'partv' });
  for (const zc of [-61.8, -70.4]) { out.push({ box: 'dz_ashlarEC', x: 55.785, y: y + 0.45, z: zc, w: 0.01, h: 0.9, d: 2.3, tag: '墙面', on: 'partv' }); out.push({ box: 'dz_ashlarEC', x: 55.785, y: y + H - 0.5, z: zc, w: 0.01, h: 1.0, d: 2.3, tag: '墙面', on: 'partv' }); }
  out.push({ box: 'dz_ashlarEC', x: 52.9, y: y + H / 2, z: -75.795, w: 5.8, h: H, d: 0.01, tag: '墙面', on: 'partv' });
  for (const zc of [-66.1, -73.6]) light(out, 53.6, y + 4.6, zc, 0xffdcb0, 2.6, 8);
  light(out, 54.6, y + 2.0, -70.4, 0xffd8a8, 1.4, 5);
  // 北墙上半：黑石腰线 + 两组钢框高窗（每侧 3 樘，磨砂天光）
  out.push({ box: 'stoneDark', x: 35.1, y: y + 4.72, z: -75.95, w: 29.6, h: 0.14, d: 0.08, uv: 0.5, tag: '③ 腰线', on: 'partv' });
  for (const wx of [23.4, 26.5, 29.6, 40.4, 43.5, 46.6]) {
    out.push({ box: 'blackMetal', x: wx, y: y + 5.55, z: -75.96, w: 1.62, h: 1.06, d: 0.05, tag: '③ 高窗', on: 'partv' });
    out.push({ box: 'r3_clerestory', x: wx, y: y + 5.55, z: -75.93, w: 1.5, h: 0.94, d: 0.01, tag: '③ 高窗', on: 'partv' });
    out.push({ box: 'blackMetal', x: wx, y: y + 5.55, z: -75.92, w: 0.04, h: 0.94, d: 0.02, tag: '③ 高窗', on: 'partv' });
    out.push({ box: 'blackMetal', x: wx, y: y + 5.55, z: -75.92, w: 1.5, h: 0.035, d: 0.02, tag: '③ 高窗', on: 'partv' });
    out.push({ box: 'stoneDark', x: wx, y: y + 5.0, z: -75.92, w: 1.72, h: 0.06, d: 0.1, uv: 0.5, tag: '③ 高窗', on: 'partv' }); }
  for (const [ch, dx] of [['肃', -1.75], ['静', 1.75]]) out.push({ wtext: ch, x: 35 + dx, y: y + 3.55, z: -75.95, yaw: 0, w: 0.82, h: 0.82, size: [1.08, 1.04, 0.05], tag: '③ 铜字', on: 'sign' });
  const NOTE = [[['阅卷工作通知', true], ['各阅卷组须于每日八时前到岗签到，领卷、交卷均须两人在场清点。', '阅卷期间不得携带纸张出入。']],
    [['评分细则摘要', false], ['作文按内容、结构、语言三项给分，分差超过五分者交三评。', '不得在试卷上作任何记号。']],
    [['保密守则', true], ['考生姓名一律密封，阅卷人员不得拆封、不得议论试卷内容。', '违者按纪律处分。']],
    [['阅卷进度', false], ['第一组　语文　已阅七成', '第二组　数学　已阅五成', '第三组　政治　已阅六成']],
    [['复核登记', false], ['凡双评不一致之卷，须登记卷号，于当日送复核组。', '复核结果当日公布。']],
    [['通　告', true], ['本中心自即日起实行封闭阅卷，非工作人员严禁入内。', '如有违反，严肃处理。']]];
  for (const sx of [-1, 1]) {
    { const bx = 35 + sx * 6.0, by = y + 1.85; // 告示板：胡桃木框软木板 + 成格钉的印刷告示（3 × 2）
      out.push({ box: 'dz_wain2', x: bx, y: by, z: -75.975, w: 1.7, h: 1.12, d: 0.04, tag: '③ 告示', on: 'partv' });
      out.push({ box: 'dz_cork', x: bx, y: by, z: -75.95, w: 1.56, h: 0.98, d: 0.02, tag: '③ 告示', on: 'partv' });
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { const [[t, red], lines] = NOTE[(r * 3 + c + (sx > 0 ? 3 : 0)) % 6];
        out.push({ notice: t, red, lines, x: bx - 0.5 + c * 0.5, y: by + 0.22 - r * 0.44, z: -75.937, yaw: 0, w: 0.3, h: 0.4, size: [0.3, 0.4, 0.004], tag: '③ 告示', on: 'sign' }); } }
    out.push({ wtext: sx < 0 ? '公 正 严 明' : '一 丝 不 苟', x: 35 + sx * 7.5, y: y + 3.75, z: -75.95, yaw: 0, w: 3.0, h: 0.5, size: [3.26, 0.72, 0.05], tag: '③ 标语', on: 'sign' });
    pic(out, sx < 0 ? 'textures/b07/B07_高考真题卷.png' : 'textures/b06/B06_考场母本试卷.png', 35 + sx * 9.0, y + 2.2, -75.95, 0, 0.9, 1.27, 'gold', { tag: '③ 样张' });
    out.push({ sign: sx < 0 ? '阅 卷 纪 律' : '评 分 细 则', sub: sx < 0 ? '一人一卷 · 双评复核 · 不得涂改' : '分差逾五分须三评', x: 35 + sx * 6.0, y: y + 1.0, z: -75.9, yaw: 0, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
    light(out, 35 + sx * 7.5, y + 3.0, -74.8, 0xffe6c8, 0.9, 5);
  }
  // ④ 试卷收发台（盒体：胡桃木台身 + 黑石台面 + 铜踢脚；职员坐东侧面朝西）
  { const cx = 47.6, cz = -64.5, w = 0.7, d = 4.2;
    out.push({ fixed: true, m: '固定:收发台', x: cx, y, z: cz, yaw: 0, size: [w, 1.05, d], col: [w, 1.05, d], tag: '④ 收发台', on: 'floor' });
    out.push({ box: 'dz_wain', x: cx, y: y + 0.5, z: cz, w, h: 1.0, d, uv: 0.6, tag: '④ 收发台', on: 'partv' });
    out.push({ box: 'onyx', x: cx - 0.03, y: y + 1.025, z: cz, w: w + 0.12, h: 0.05, d: d + 0.1, uv: 0.5, tag: '④ 收发台', on: 'partv' });
    out.push({ box: 'dz_brassDim', x: cx - w / 2 - 0.005, y: y + 0.06, z: cz, w: 0.02, h: 0.12, d, tag: '④ 收发台', on: 'partv' });
    out.push({ box: 'dz_brassDim', x: cx - w / 2 - 0.005, y: y + 0.97, z: cz, w: 0.02, h: 0.03, d, tag: '④ 收发台', on: 'partv' });
    out.push({ sign: '试 卷 收 发', sub: '领卷签字 · 交卷清点', x: cx - w / 2 - 0.02, y: y + 0.72, z: cz, yaw: ROT.W, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
    for (const dz of [-1.4, 0, 1.4]) out.push({ m: 'r2/dining_chair_02', x: cx + 0.75, y, z: cz + dz, yaw: ROT.W, h: 0.98, tag: '④ 收发台', on: 'floor' });
    const top = y + 1.05;
    for (const [dz, k] of [[-1.7, 0], [-1.25, 1], [-0.6, 2], [0.9, 3], [1.6, 4]]) out.push({ box: 'kraft', x: cx - 0.05, y: top + 0.03 + (k % 2) * 0.02, z: cz + dz, w: 0.32, h: 0.06 + (k % 2) * 0.04, d: 0.24, yaw: 0, tag: '④ 收发台', on: 'desk' });
    for (const dz of [-1.7, -1.25, 0.9, 1.6]) out.push({ box: 'dz_pipeRed', x: cx - 0.05, y: top + 0.075 + 0.02, z: cz + dz, w: 0.33, h: 0.012, d: 0.04, yaw: 0, tag: '④ 收发台 封条', on: 'desk' });
    out.push({ m: 'r2/bankers_lamp', x: cx + 0.1, y: top, z: cz + 0.3, yaw: ROT.W, h: 0.36, tag: '④ 收发台', on: 'desk' });
    out.push({ m: 'r2/document_letter_tray_documents_organizer', x: cx, y: top, z: cz - 0.05 + 0.5, yaw: ROT.W, w: 0.3, tag: '④ 收发台', on: 'desk' });
    out.push({ fixed: true, m: '固定:剧情试卷/便签', x: cx - 0.1, y: top, z: cz - 0.05 - 0.15, yaw: 0, size: [0.3, 0.02, 0.3], tag: '④ 收发台', on: 'desk' });
    out.push({ m: 'r2/hand_truck', x: 47.5, y, z: -67.4, yaw: ROT.W, h: 1.1, tag: '④ 收发台', on: 'floor' });
    light(out, cx, y + 2.8, cz, 0xfff0dc, 1.2, 6);
    hang(out, '试 卷 收 发', cx - 0.3, y + 3.2, cz, ROT.W, 1.9, 0.42, y + H); }
  // ⑤ 封存柜（西墙壁柱 z −65.3 / −73.9 之间）
  for (let i = 0; i < 12; i++) { const z = -66.1 - i * 0.6;
    out.push({ m: 'file_cabinet', x: 20.72, y, z, yaw: ROT.E, h: 1.32, tag: '⑤ 封存柜', on: 'floor', col: [0.7, 1.32, 0.5] });
    out.push({ box: 'dz_pipeRed', x: 21.08, y: y + 0.9, z, w: 0.006, h: 0.5, d: 0.05, yaw: 0, tag: '⑤ 封条', on: 'partv' });
    out.push({ box: 'dz_paper', x: 21.083, y: y + 0.9, z, w: 0.004, h: 0.07, d: 0.06, yaw: 0, tag: '⑤ 封条', on: 'partv' }); }
  out.push({ sign: '试 卷 封 存', sub: '双人双锁 · 启封须登记', x: 20.5, y: y + 1.75, z: -69.4, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
  light(out, 22.0, y + 2.8, -69.4, 0xffe6c8, 0.9, 6);
  // ⑥ 南墙门西侧倒计时告示 + 西南角灭火器；门内吊牌
  out.push({ flip: '距 高 考 还 有', days: 222, x: 30.0, y: y + 2.6, z: -61.21, yaw: ROT.N, w: 1.6, h: 0.9, size: [1.76, 1.06, 0.14], tag: '⑥ 翻牌倒计时', on: 'sign' }); // 批次16：机械翻牌（原 B04 平板电视图不合年代）
  out.push({ m: 'r2/fire_extinguisher', x: 20.66, y, z: -61.55, yaw: ROT.E, h: 0.6, tag: '消防', on: 'floor' });
  hang(out, '阅 卷 区', 41.5, y + 3.3, -63.0, 0, 1.9, 0.42, y + H);
  // 照明：两列乳白球吊灯（东西两块考位正上方）+ 暖白补光
  for (const x of [28.4, 41.6]) for (const z of [-65.35, -69.85]) for (const dx of [-2.2, 2.2]) globe(out, x + dx, z, y, H, 3.6, { r: 0.24, dim: true }); // 批次15：r3_globeDim 防过曝
  for (const x of [28.4, 41.6]) for (const z of [-65.35, -69.85]) light(out, x, y + 3.4, z, 0xfff0dc, 2.4, 10);
  return { room, items: out };
}
PLANS.exam_center = (Y) => fixYaw(planExamCenter(Y)); R3.exam_center = true;

// ================= R3 批次16 · 区域管控室 zone_control（东翼 3F 北区：x 20…50，z −32…−61，层高 7.1；1960–80 年代机关管控/调度室） =================
// 平面功能规划（北 = −Z）：
//  入口：东墙 z −44…−47.5 门洞（楼梯井列）、东南角楼梯井开敞段（z −54…−61）、北墙 x 40…43 门（副本投放调度室）。
//  中央：原有 22 × 9 m 实体沙盘（x 24…46，z −51…−42，剧情锚点 int_zone_sandbox），四周留 ≥1.4 m 环形通道。
//  ① 北墙：整面区域地图 / 灯光标示板两块（x 22.4…32.4、37.6…47.6），正中留原「分级挂牌」doc_zone_grading（x 35）。
//  ② 监控台：两排 × 每排 8 台（中轴 x 32.7…37.3 主通道对着分级挂牌），操作员坐南侧面朝北（地图墙），每台 2 屏 CRT + 斜面按键板 + 写字沿。
//  ③ 电话台：东墙北段（z −36.6…−41.4），胡桃木长台靠墙，接线员坐西侧面朝东；墙上电话交换盘 + 铜牌。
//  ④ 档案架：西墙北段铁皮柜成排（z −54.4…−60.4，壁柱 −53.5 以北）+ 西墙南段两只钢架档案架（卡片墙以南）。
//  ⑤ 值班台：南墙前原调度台（x 32…38，z −34.6，剧情锚点 doc_zone_dispatch）补成值班台：两把椅子坐南面朝北、台灯、电话、值班日志、铜牌「值 班 台」。
//  墙面：胡桃木墙裙（原有）+ 方石上墙；地面：哑光深色大理石 + 黑石收边，环形通道磨损；照明：两排日光灯管（监控台上方）+ 暖白补光。
export function planZoneControl(y) {
  const out = []; const H = 7.1;
  const room = { name: '东翼 3F · 区域管控室（批次16）', x0: 20.2, x1: 49.86, z0: -60.86, z1: -32.0, y, H,
    doors: [{ wall: 'E', a: -47.5, b: -44, label: '楼梯井' }, { wall: 'E', a: -61, b: -54, label: '楼梯井列（开敞）' }, { wall: 'N', a: 40, b: 43, label: '副本投放调度室' }],
    windows: [],
    rooms: [['① 地图墙', 35, -60.2], ['② 监控台', 35, -56.2], ['③ 电话台', 48.6, -39.0], ['④ 档案架', 21.2, -57.4], ['⑤ 值班台', 35, -33.6], ['沙盘（原有）', 35, -46.5], ['⑥ 会商长桌', 27, -36.2], ['⑥ 资料台', 42.5, -36.6]],
    aisles: [{ label: '地图墙前通道', x0: 21.4, x1: 49.6, z0: -60.5, z1: -58.2 }, { label: '中轴主通道', x0: 32.8, x1: 37.2, z0: -60.5, z1: -51.2 },
      { label: '沙盘北环道', x0: 22.2, x1: 47.8, z0: -53.2, z1: -51.15 }, { label: '沙盘南环道', x0: 22.2, x1: 47.8, z0: -41.85, z1: -39.6 }, { label: '值班台—沙盘通道', x0: 31.6, x1: 38.4, z0: -39.6, z1: -35.4 },
      { label: '沙盘西环道', x0: 22.0, x1: 23.9, z0: -53.2, z1: -35.4 }, { label: '沙盘东环道', x0: 46.1, x1: 47.6, z0: -53.2, z1: -42.2 },
      { label: '东门净空', x0: 47.7, x1: 49.8, z0: -47.5, z1: -44 }] };
  floorZ(out, 'r3_marbleHoned', 20.3, 49.84, -60.6, -32.4, y, { border: 0.3, bmat: 'r3_stoneBorder', uv: 0.5 });
  wear(out, 32.9, 37.1, -60.3, -53.4, y); wear(out, 22.4, 47.6, -52.9, -51.5, y); wear(out, 47.8, 49.6, -47.3, -44.2, y);
  // 墙面：方石上墙（墙裙原有）
  const AH = H - 1.25, AY = y + 1.25 + AH / 2;
  // 批次23：北墙方石护面原是整块 29.6 m，盖住了 x 40…43 调度室门洞（zone_r3_b 门后永远黑 / 看不到任务板）→ 让出门洞（门洞上方 y+3.2 以上补回）
  out.push({ box: 'dz_ashlarEC', x: 30.1, y: AY, z: -60.845, w: 19.8, h: AH, d: 0.01, tag: '墙面', on: 'partv' });
  out.push({ box: 'dz_ashlarEC', x: 46.4, y: AY, z: -60.845, w: 6.8, h: AH, d: 0.01, tag: '墙面', on: 'partv' });
  out.push({ box: 'dz_ashlarEC', x: 41.5, y: y + 3.2 + (H - 3.2) / 2, z: -60.845, w: 3.0, h: H - 3.2, d: 0.01, tag: '墙面', on: 'partv' });
  out.push({ box: 'dz_ashlarEC', x: 35.0, y: AY, z: -32.005, w: 29.6, h: AH, d: 0.01, tag: '墙面', on: 'partv' });
  out.push({ box: 'dz_ashlarEC', x: 20.235, y: AY, z: -46.4, w: 0.01, h: AH, d: 28.6, tag: '墙面', on: 'partv' });
  for (const [a, c] of [[-32.2, -44], [-47.5, -54]]) out.push({ box: 'dz_ashlarEC', x: 49.845, y: y + H / 2, z: (a + c) / 2, w: 0.01, h: H, d: a - c, tag: '墙面', on: 'partv' });
  out.push({ box: 'dz_ashlarEC', x: 49.845, y: y + 3 + (H - 3) / 2, z: -45.75, w: 0.01, h: H - 3, d: 3.5, tag: '墙面', on: 'partv' });
  out.push({ box: 'dz_wain', x: 49.8, y: y + 0.575, z: -38.1, w: 0.06, h: 1.15, d: 11.8, tag: '墙面', on: 'partv' });
  out.push({ box: 'dz_wain', x: 49.8, y: y + 0.575, z: -50.75, w: 0.06, h: 1.15, d: 6.5, tag: '墙面', on: 'partv' });
  // ① 地图墙（两块）+ 顶部标语
  for (const [cx, sd, mw] of [[27.4, 1, 9.6], [46.45, 2, 5.6]]) { // 批次23：东片原 x 37.8…47.4 横跨调度室门洞（x 40…43）→ 缩为 5.6 m 移到门洞东侧 x 43.65…49.25
    out.push({ mapwall: sd === 1 ? '区 域 管 控 · 西 片' : '区 域 管 控 · 东 片', seed: sd, x: cx, y: y + 3.1, z: -60.8, yaw: 0, w: mw, h: 3.6, size: [mw + 0.2, 3.8, 0.1], tag: '① 地图墙', on: 'sign' });
    light(out, cx, y + 5.6, -58.4, 0xfff0dc, 1.2, 7); }
  out.push({ wtext: '统 一 调 度　分 级 管 控', x: 35, y: y + 5.75, z: -60.82, yaw: 0, w: 6.4, h: 0.56, size: [6.66, 0.78, 0.05], tag: '① 标语', on: 'sign' });
  // ② 监控台两排
  const CX = [23.3, 26.0, 28.7, 31.4, 38.6, 41.3, 44.0, 46.7];
  for (const [r, z] of [[0, -57.6], [1, -54.9]]) for (const [i, x] of CX.entries()) {
    out.push({ console: true, n: 2, seed: r * 8 + i, x, y, z, yaw: 0, w: 2.6, size: [2.6, 1.62, 0.9], col: [2.6, 1.62, 0.9], tag: '② 监控台', on: 'floor' });
    for (const dx of [-0.65, 0.65]) out.push({ m: 'r2/old_computer_chair', x: x + dx, y, z: z + 0.95, yaw: Math.PI + (i % 3 - 1) * 0.12 * dx, h: 0.92, tag: '② 监控台', on: 'floor' });
    out.push({ box: 'dz_paper', x: x - 0.35, y: y + 0.765, z: z + 0.5, w: 0.21, h: 0.004, d: 0.297, yaw: 0.06, tag: '② 记录纸', on: 'desk' });
    if (i % 2 === 1) out.push({ m: 'r2/vintage_radio', x: x + 0.95, y: y + 1.62, z: z - 0.1, yaw: 0, w: 0.34, tag: '② 对讲机', on: 'desk' }); // 屏架顶
  }
  for (const x of [27.35, 42.65]) out.push({ sign: x < 35 ? '监 控 一 组' : '监 控 二 组', sub: '西片 · 十六路' + (x < 35 ? '' : '（东）'), x, y: y + 1.62 + 0.25, z: -55.32, yaw: Math.PI, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
  for (const x of [27.35, 42.65]) for (const z of [-57.1, -54.4]) out.push({ troffer: true, x, y: y + H - 0.25, z, len: 10.6, size: [10.6, 0.1, 0.34], tag: '日光灯', on: 'light' });
  for (const x of [27.35, 42.65]) light(out, x, y + 3.6, -55.6, 0xf4f0e4, 2.0, 11);
  // ③ 电话台（东墙北段）
  { const cx = 49.3, cz = -39.0, d = 4.8;
    out.push({ fixed: true, m: '固定:电话台', x: cx, y, z: cz, yaw: 0, size: [0.8, 0.78, d], col: [0.8, 0.78, d], tag: '③ 电话台', on: 'floor' });
    out.push({ box: 'dz_wain', x: cx, y: y + 0.37, z: cz, w: 0.8, h: 0.74, d, uv: 0.6, tag: '③ 电话台', on: 'partv' });
    out.push({ box: 'onyx', x: cx - 0.02, y: y + 0.76, z: cz, w: 0.86, h: 0.04, d: d + 0.06, uv: 0.5, tag: '③ 电话台', on: 'partv' });
    out.push({ box: 'dz_brassDim', x: cx - 0.405, y: y + 0.06, z: cz, w: 0.02, h: 0.12, d, tag: '③ 电话台', on: 'partv' });
    const top = y + 0.78;
    for (const [k, dz] of [-1.8, -0.6, 0.6, 1.8].entries()) {
      out.push({ m: ['r2/phone_vef_ta_68', 'r2/rotary_telephone'][k % 2], x: cx - 0.05, y: top, z: cz + dz, yaw: ROT.W, w: 0.22, tag: '③ 电话台', on: 'desk' });
      out.push({ box: 'dz_paper2', x: cx - 0.15, y: top + 0.003, z: cz + dz + 0.3, w: 0.21, h: 0.004, d: 0.297, yaw: 0.05, tag: '③ 记录本', on: 'desk' });
      out.push({ m: 'r2/old_computer_chair', x: cx - 0.95, y, z: cz + dz, yaw: ROT.E, h: 0.92, tag: '③ 电话台', on: 'floor' }); }
    out.push({ m: 'r2/bankers_lamp', x: cx + 0.1, y: top, z: cz, yaw: ROT.W, h: 0.36, tag: '③ 电话台', on: 'desk' });
    out.push({ mapwall: '电 话 交 换 · 各 区 专 线', seed: 7, x: 49.84, y: y + 2.3, z: cz, yaw: ROT.W, w: 3.6, h: 1.3, size: [3.8, 1.5, 0.1], tag: '③ 交换盘', on: 'sign' });
    out.push({ sign: '电 话 台', sub: '各区专线 · 二十四小时值守', x: cx - 0.42, y: y + 0.55, z: cz, yaw: ROT.W, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
    light(out, 48.2, y + 3.0, cz, 0xfff0dc, 1.2, 6); }
  // ④ 档案架：西墙北段铁皮柜 + 南段钢架
  for (let i = 0; i < 11; i++) { const z = -54.4 - i * 0.6;
    out.push({ m: 'file_cabinet', x: 20.86, y, z, yaw: ROT.E, h: 1.32, tag: '④ 档案柜', on: 'floor', col: [0.7, 1.32, 0.5] });
    out.push({ box: 'dz_paper', x: 21.22, y: y + 1.1, z, w: 0.004, h: 0.06, d: 0.12, yaw: 0, tag: '④ 标签', on: 'partv' }); }
  out.push({ sign: '区 域 档 案', sub: '按片区 · 按年份', x: 20.6, y: y + 1.75, z: -57.4, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
  for (const z of [-37.5, -39.3]) { out.push({ m: 'r2/steel_frame_shelves_02', x: 20.95, y, z, yaw: ROT.E, h: 2.0, tag: '④ 档案架', on: 'floor' });
    for (let s = 0; s < 3; s++) for (let k = 0; k < 3; k++) out.push({ box: 'kraft', x: 20.95, y: y + 0.42 + s * 0.6, z: z - 0.4 + k * 0.4, w: 0.3, h: 0.28, d: 0.3, tag: '④ 档案盒', on: 'partv' }); }
  // ⑤ 值班台（原调度台 6 × 1.2 盒体在 x 35，z −34.6，台面 y+1.0）：南侧两把椅子坐南面朝北
  { const top = y + 1.06, cz = -34.6;
    out.push({ fixed: true, m: '固定:值班台desk（eastwing 原有盒体）', x: 35, y, z: cz, yaw: 0, size: [6, 1.06, 1.2], col: [6, 1.06, 1.2], tag: '⑤ 值班台', on: 'floor' });
    // 批次19：zone_r3_b 看图值班台是一整块纯黑盒（eastwing b.box('wood') 渲黑）→ 套胡桃木柜身 + 两面凸起芯板 + 深色台面 + 踢脚
    out.push({ box: 'r3_walnutLt', x: 35, y: y + 0.5, z: cz, w: 6.03, h: 0.98, d: 1.23, uv: 0.5, tag: '⑤ 值班台饰面', on: 'partv' });
    out.push({ box: 'dz_beam', x: 35, y: y + 1.03, z: cz, w: 6.1, h: 0.06, d: 1.28, uv: 0.5, tag: '⑤ 值班台饰面', on: 'partv' });
    out.push({ box: 'dz_paintLow', x: 35, y: y + 0.05, z: cz, w: 6.06, h: 0.1, d: 1.26, uv: 0.5, tag: '⑤ 值班台饰面', on: 'partv' });
    // 批次23：芯板 dz_wain2（深褐）→ 浅胡桃木 r3_walnutLt 凸芯板 + 深色框条（立梃 / 上下冒头），北面（会商区一侧，zone_r3_b 看到的正面）+ 西端面；北面低位补光
    for (const sz of [-1, 1]) { for (let k = 0; k < 4; k++) out.push({ box: 'r3_walnutLt', x: 35 - 2.25 + k * 1.5, y: y + 0.55, z: cz + sz * 0.63, w: 1.3, h: 0.62, d: 0.04, uv: 0.7, tag: '⑤ 值班台芯板', on: 'partv' });
      for (let k = 0; k <= 4; k++) out.push({ box: 'dz_beam', x: 35 - 3.0 + k * 1.5, y: y + 0.55, z: cz + sz * 0.625, w: 0.1, h: 0.86, d: 0.035, uv: 0.5, tag: '⑤ 值班台立梃', on: 'partv' });
      for (const hy of [0.16, 0.94]) out.push({ box: 'dz_beam', x: 35, y: y + hy, z: cz + sz * 0.625, w: 6.0, h: 0.08, d: 0.035, uv: 0.5, tag: '⑤ 值班台冒头', on: 'partv' }); }
    for (const sx of [-1, 1]) out.push({ box: 'r3_walnutLt', x: 35 + sx * 3.03, y: y + 0.55, z: cz, w: 0.04, h: 0.62, d: 0.9, uv: 0.7, tag: '⑤ 值班台端板', on: 'partv' });
    light(out, 33.5, y + 0.7, cz - 1.7, 0xffe2b8, 1.6, 4); light(out, 31.4, y + 0.8, cz - 0.4, 0xffe2b8, 1.2, 3.5);
    for (const dx of [-1.4, 1.4]) out.push({ m: 'r2/literary_club_chair_preview', x: 35 + dx, y, z: -33.45, yaw: ROT.N, h: 1.05, tag: '⑤ 值班台', on: 'floor' });
    out.push({ m: 'r2/bankers_lamp', x: 33.0 - 0.5, y: top, z: cz + 0.2, yaw: ROT.N, h: 0.36, tag: '⑤ 值班台', on: 'desk' });
    out.push({ m: 'r2/phone_vef_ta_68', x: 37.4, y: top, z: cz + 0.15, yaw: ROT.N, w: 0.22, tag: '⑤ 值班台', on: 'desk' });
    out.push({ m: 'r2/rotary_telephone', x: 36.6, y: top, z: cz + 0.15, yaw: ROT.N, w: 0.22, tag: '⑤ 值班台', on: 'desk' });
    out.push({ m: 'r2/several_folders', x: 33.8, y: top, z: cz + 0.1, yaw: 0.2, h: 0.3, tag: '⑤ 值班台', on: 'desk' });
    out.push({ sign: '值 班 台', sub: '交接班须签字登记', x: 35, y: y + 0.7, z: cz - 0.61, yaw: ROT.N, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
    hang(out, '值 班 台', 35, y + 3.6, cz, 0, 1.9, 0.42, y + H);
    light(out, 35, y + 3.0, cz + 0.4, 0xfff0dc, 1.2, 6); }
  out.push({ m: 'r2/fire_extinguisher', x: 49.55, y, z: -50.3, yaw: ROT.W, h: 0.6, tag: '消防', on: 'floor' }); // 批次18：原 −43.4 让位给东门南门扇
  // ⑥ 批次18：南侧环道外 6 m 空地补成组陈设（zone_r3_b 看图：沙盘与值班台之间大片空地）。
  //   西组 会商长桌（x 23.6…30.4，z −38.6…−37.4）：长桌垂直于沙盘、两侧各 4 把实木椅 + 东端主位；桌上摊开区域图、文件夹、茶杯、烟灰缸、台灯。
  //   东组 资料台（x 39…46.2）：两张斜面资料台并排（台面放分片册子 / 图纸）+ 南墙一排 6 只铁皮资料柜 + 铜牌。中段 x 31.5…38.5 留给值班台 ↔ 沙盘通道。
  { const cx = 27.0, cz = -38.0, top = y + 0.76;
    out.push({ m: 'r2/conference_table_rectangular_6m', x: cx, y, z: cz, yaw: 0, fit: [6.0, 0.76, 1.2], tag: '⑥ 会商长桌', on: 'floor', col: [6.0, 0.78, 1.2] });
    for (let i = 0; i < 4; i++) { const x = cx - 2.1 + i * 1.4;
      out.push({ m: 'r4/exam_chair', x, y, z: cz - 0.95, yaw: 0, h: 0.84, tag: '⑥ 会商长桌', on: 'floor' });
      out.push({ m: 'r4/exam_chair', x, y, z: cz + 0.95, yaw: Math.PI, h: 0.84, tag: '⑥ 会商长桌', on: 'floor' });
      out.push({ m: 'r2/coffee_mug', x: x + 0.3, y: top, z: cz + (i % 2 ? -0.38 : 0.38), yaw: i, h: 0.095, tag: '⑥ 茶杯', on: 'desk' }); }
    out.push({ m: 'r4/exam_chair', x: cx + 3.55, y, z: cz, yaw: ROT.W, h: 0.84, tag: '⑥ 会商主位', on: 'floor' });
    out.push({ box: 'r3_mapPaper', x: cx, y: top + 0.003, z: cz, w: 1.6, h: 0.004, d: 0.9, yaw: 0.04, tag: '⑥ 摊开区域图', on: 'desk' });
    for (const [dx, dz, m, o] of [[-2.4, 0.15, 'r2/several_folders', { h: 0.3 }], [2.2, -0.2, 'r2/document_letter_tray_documents_organizer', { w: 0.3 }], [1.2, 0.3, 'r2/ptish_exceptionally_full_ashtray', { w: 0.16 }], [-1.3, -0.3, 'r2/ptish_exceptionally_full_ashtray', { w: 0.16 }], [2.6, 0.32, 'r2/bankers_lamp', { h: 0.36 }]])
      out.push({ m, x: cx + dx, y: top, z: cz + dz, yaw: Math.PI, ...o, tag: '⑥ 会商长桌', on: 'desk' });
    for (const dx of [-1.8, -0.4, 0.9, 2.0]) out.push({ box: 'dz_paper', x: cx + dx, y: top + 0.003, z: cz + (dx > 0 ? -0.25 : 0.25), w: 0.21, h: 0.004, d: 0.297, yaw: dx * 0.05, tag: '⑥ 会商记录', on: 'desk' });
    out.push({ sign: '会 商 桌', sub: '跨片区联合研判', x: cx - 3.02, y: y + 0.55, z: cz, yaw: ROT.W, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
    hang(out, '联 合 会 商', cx, y + 3.6, cz, 0, 1.9, 0.42, y + H);
    light(out, cx, y + 2.8, cz, 0xfff0dc, 1.3, 6); }
  { const cz = -38.2, top = y + 0.9;
    for (const cx of [40.6, 44.4]) {
      out.push({ m: 'r2/woodentable_01', x: cx, y, z: cz, yaw: 0, fit: [2.6, 0.9, 1.0], tag: '⑥ 资料台', on: 'floor', col: [2.6, 0.92, 1.0] });
      for (const [dx, m, o] of [[-0.8, 'r2/several_folders', { h: 0.3 }], [0.1, 'r2/medieval_book_stack', { w: 0.34 }], [0.85, 'r2/document_letter_tray_documents_organizer', { w: 0.3 }]]) out.push({ m, x: cx + dx, y: top, z: cz - 0.15, yaw: Math.PI, ...o, tag: '⑥ 资料台', on: 'desk' });
      out.push({ box: 'r3_mapPaper', x: cx - 0.2, y: top + 0.003, z: cz + 0.22, w: 1.1, h: 0.004, d: 0.5, yaw: -0.03, tag: '⑥ 图纸', on: 'desk' });
      out.push({ m: 'r2/old_computer_chair', x: cx, y, z: cz + 0.85, yaw: Math.PI, h: 0.92, tag: '⑥ 资料台', on: 'floor' }); }
    out.push({ sign: '资 料 台', sub: '分片册 · 图纸 · 阅后归位', x: 42.5, y: y + 0.6, z: cz - 0.51, yaw: 0, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
    for (let i = 0; i < 6; i++) { const x = 40.2 + i * 0.95;
      out.push({ m: 'file_cabinet', x, y, z: -32.4, yaw: ROT.N, h: 1.32, tag: '⑥ 资料柜', on: 'floor', col: [0.7, 1.32, 0.5] }); }
    out.push({ sign: '分 片 资 料', sub: '甲—己 六片 · 按号取阅', x: 42.6, y: y + 1.75, z: -32.06, yaw: Math.PI, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
    light(out, 42.5, y + 2.8, cz, 0xfff0dc, 1.2, 6); }
  // ⑧ 批次20：北墙门洞（x 40…43 → 副本投放调度室，zone_r3_b 后墙中部那块深色门洞）：钢门套 + 门楣铜牌 + 门头壁灯（门后灯在 eastwing.js）
  { const zw = -60.8; for (const x of [40.05, 42.95]) out.push({ box: 'r3_steelOld', x, y: y + 1.6, z: zw, w: 0.12, h: 3.2, d: 0.1, tag: '⑧ 门套', on: 'partv' });
    out.push({ box: 'r3_steelOld', x: 41.5, y: y + 3.25, z: zw, w: 3.02, h: 0.12, d: 0.1, tag: '⑧ 门套', on: 'partv' });
    out.push({ sign: '副本投放调度室', sub: '闲人免进', x: 41.5, y: y + 3.55, z: zw + 0.06, yaw: ROT.S, size: [0.34, 0.12, 0.01], tag: '⑧ 门楣铜牌', on: 'sign' });
    out.push({ box: 'dz_glow', x: 41.5, y: y + 3.85, z: zw + 0.08, w: 0.4, h: 0.1, d: 0.1, tag: '⑧ 门头壁灯', on: 'partv' });
    light(out, 41.5, y + 3.4, zw + 0.8, 0xfff0dc, 1.2, 5);
    // 值班台饰面在 zone_r3_b 里仍近乎全黑 → 台前补一盏低位暖光
    light(out, 35, y + 1.6, -35.6, 0xffe6c0, 1.4, 4.5); light(out, 33.2, y + 0.9, -33.3, 0xffe2b8, 1.3, 3.5); light(out, 36.8, y + 0.9, -33.3, 0xffe2b8, 1.3, 3.5); } // 批次22：值班台仍黑 → 柜身换浅胡桃木 r3_walnutLt + 正面两盏低位补光
  // ⑦ 批次18：东门（楼梯井门洞 z −44…−47.5）原是一块纯黑洞 → 钢门套 + 两扇木门扇向室内开到 180° 贴墙 + 门后走廊吸顶灯
  { const X = 49.8, a = -44, b = -47.5;
    for (const z of [a + 0.04, b - 0.04]) out.push({ box: 'r3_steelOld', x: X, y: y + 1.52, z, w: 0.16, h: 3.04, d: 0.08, tag: '⑦ 门套', on: 'partv' });
    out.push({ box: 'r3_steelOld', x: X, y: y + 3.0, z: (a + b) / 2, w: 0.16, h: 0.08, d: 3.6, tag: '⑦ 门套', on: 'partv' });
    for (const [z0, sg] of [[a, 1], [b, -1]]) { const zc = z0 + sg * 0.875;
      out.push({ box: 'dz_wain2', x: 49.72, y: y + 1.45, z: zc, w: 0.05, h: 2.9, d: 1.72, uv: 0.6, tag: '⑦ 门扇', on: 'partv' });
      for (const yy of [0.8, 2.1]) out.push({ box: 'dz_wain', x: 49.685, y: y + yy, z: zc, w: 0.02, h: 0.95, d: 1.3, uv: 0.6, tag: '⑦ 门扇芯板', on: 'partv' });
      out.push({ box: 'dz_brassDim', x: 49.67, y: y + 1.05, z: zc + sg * 0.7, w: 0.04, h: 0.24, d: 0.03, tag: '⑦ 拉手', on: 'partv' });
      out.push({ box: 'dz_brassDim', x: 49.69, y: y + 0.08, z: zc, w: 0.02, h: 0.16, d: 1.72, tag: '⑦ 踢板', on: 'partv' }); }
    out.push({ sign: '楼 梯 间', sub: '通往东侧楼梯 · 随手关门', x: 49.83, y: y + 3.3, z: (a + b) / 2, yaw: ROT.W, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' }); }
  return { room, items: out };
}
PLANS.zone_control = (Y) => fixYaw(planZoneControl(Y)); R3.zone_control = true;

// ================= R3 批次17 · 3F 理化实验室 lab3（3F 东区：x 9.75…28，z −119.8…−92.2，层高 5.4；1960–80 年代机关研究所实验室） =================
// 平面（北 = −Z）：西墙门洞 z −99.1…−95.9 从医务室进 → 南侧入口通道（东西向）；
//  ① 西半区四排岛式实验台（3.0 × 1.5，环氧黑台面 + 灰绿喷漆柜身 + 中脊双层木试剂架），每排南北各两只实验凳；② 北墙五樘通风橱（下柜 + 白瓷砖内衬 + 玻璃拉门 + 排风管上顶棚）；
//  ③ 北墙东段：两台样本冷柜 + 试剂钢架 + 水槽台 + 东北角洗眼/紧急淋浴站；④ 东墙窗间墙两组玻璃门仪器柜 + 南墙一排六只仪器柜；⑤ 西墙黑板（化学式 + 安全规程）+ 实验守则告示；
//  原剧情锚点保留：篇幅测量仪（18, −110）、拓印台（24, −100）、命名会议桌（15, −99）、阶位刻度墙（东墙 z −113…−107）、鉴定流程板（西墙 z −94.5）。全部成排、定点，无随机散布。
export function planLab3(y) {
  const out = []; const H = 5.4, X0 = 9.75, X1 = 28.0, Z0 = -119.8, Z1 = -92.2;
  const room = { name: '3F 东 · 理化实验室（批次17）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'W', a: -99.1, b: -95.9, label: '← 医务室' }], windows: [],
    rooms: [['① 实验台', 12.75, -108.5], ['② 通风橱', 14.6, -119.0], ['③ 冷柜·水槽·洗眼', 24.3, -119.0], ['④ 仪器柜', 22, -92.8], ['⑤ 黑板', 10.1, -108], ['测量仪（原）', 18, -110], ['拓印台（原）', 24, -100], ['会议桌（原）', 15, -99]],
    aisles: [{ label: '入口通道', x0: 9.8, x1: 26.9, z0: -97.4, z1: -95.6 }, { label: '西通道', x0: 9.8, x1: 11.1, z0: -116.2, z1: -101.2 }, { label: '中通道', x0: 14.5, x1: 16.6, z0: -116.2, z1: -101.2 },
      { label: '通风橱前通道', x0: 9.8, x1: 27.0, z0: -118.3, z1: -116.3 }, { label: '东侧通道', x0: 25.4, x1: 27.0, z0: -116.2, z1: -97.6 }] };
  const F = (lab, x, z, w, d, h = 1) => out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, h, d], tag: '原锚点', on: 'floor' });
  F('篇幅测量仪', 18, -110, 2.2, 2.2, 2); F('拓印台', 24, -100, 2.4, 1.2, 0.9); F('命名会议桌+椅', 15, -99, 3.6, 2.6, 0.9);
  floorZ(out, 'r3_terrDark', X0 + 0.05, X1 - 0.05, Z0 + 0.05, Z1 - 0.05, y, { uv: 1.6, border: 0.25, bmat: 'r3_stoneBorder' }); // 批次18：浅水磨石 → 深色水磨石 + 黑石收边
  // 批次18 吊顶：原白色 T 形网格 → 深色木格藻井（底板 dz_ceil + 1.5 m 胡桃木格梁），日光灯管吊在梁下
  out.push({ box: 'dz_ceil', x: (X0 + X1) / 2, y: y + H - 0.02, z: (Z0 + Z1) / 2, w: X1 - X0, h: 0.04, d: Z1 - Z0, uv: 0.3, tag: '吊顶', on: 'partv' });
  for (let x = X0 + 1.5; x < X1 - 0.5; x += 1.5) out.push({ box: 'dz_beam', x, y: y + H - 0.12, z: (Z0 + Z1) / 2, w: 0.14, h: 0.16, d: Z1 - Z0, uv: 0.5, tag: '吊顶木格', on: 'partv' });
  for (let z = Z0 + 1.5; z < Z1 - 0.5; z += 1.5) out.push({ box: 'dz_beam', x: (X0 + X1) / 2, y: y + H - 0.12, z, w: X1 - X0, h: 0.16, d: 0.14, uv: 0.5, tag: '吊顶木格', on: 'partv' });
  wear(out, 9.9, 26.8, -97.2, -95.8, y); wear(out, 14.6, 16.5, -116, -101.4, y); wear(out, 10, 26.8, -118.1, -116.5, y);
  // ① 岛式实验台 × 4 排
  const BX0 = 12.75; let n = 0; // 西组 x 12.75 + 东组 x 22.0（测量仪两侧各四排，中通道/东侧通道保持净空）
  for (const [BX, z] of [12.75, 22.0].flatMap((bx) => [-104.0, -107.0, -110.0, -113.0].map((z) => [bx, z]))) {
    out.push({ fixed: true, m: '固定:实验台', x: BX, y, z, yaw: 0, size: [3.0, 0.9, 1.5], col: [3.0, 0.9, 1.5], tag: '① 实验台', on: 'floor' });
    out.push({ box: 'paintedGreen', x: BX, y: y + 0.47, z, w: 2.96, h: 0.78, d: 1.36, uv: 1, tag: '① 实验台', on: 'partv' });
    // 批次18：柜身两侧各 4 扇柜门（门板凸出 + 门缝 + 拉手）+ 内凹踢脚 + 端头编号牌
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const dx = -1.11 + k * 0.74;
      out.push({ box: 'paintedGreen', x: BX + dx, y: y + 0.49, z: z + s * 0.69, w: 0.7, h: 0.68, d: 0.018, uv: 1, tag: '① 柜门', on: 'partv' });
      out.push({ box: 'blackMetal', x: BX + dx + 0.365, y: y + 0.49, z: z + s * 0.684, w: 0.012, h: 0.7, d: 0.012, tag: '① 门缝', on: 'partv' }); }
    out.push({ sign: '第 ' + '一二三四五六七八'[n] + ' 台', sub: n < 4 ? '理化一组' : '理化二组', x: BX - 1.505, y: y + 0.66, z, yaw: ROT.W, size: [0.34, 0.12, 0.01], tag: '① 编号牌', on: 'sign' });
    out.push({ box: 'blackMetal', x: BX, y: y + 0.04, z, w: 2.86, h: 0.08, d: 1.26, tag: '① 内凹踢脚', on: 'partv' });
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) out.push({ box: 'dz_brassDim', x: BX - 1.11 + k * 0.74, y: y + 0.74, z: z + s * 0.705, w: 0.12, h: 0.022, d: 0.02, tag: '① 柜门拉手', on: 'partv' });
    out.push({ box: 'r3_epoxyBlack', x: BX, y: y + 0.88, z, w: 3.04, h: 0.04, d: 1.54, uv: 0.5, tag: '① 环氧台面', on: 'partv' });
    // 中脊试剂架：两立柱 + 两层木隔板 + 试剂瓶（棕瓶 / 白瓶交替，定点）
    for (const dx of [-1.38, 1.38]) out.push({ box: 'steel', x: BX + dx, y: y + 1.25, z, w: 0.04, h: 0.7, d: 0.04, tag: '① 试剂架', on: 'partv' });
    for (const hy of [1.18, 1.56]) { out.push({ box: 'wood', x: BX, y: y + hy, z, w: 2.8, h: 0.025, d: 0.26, uv: 0.6, tag: '① 试剂架', on: 'partv' });
      for (let k = 0; k < 9; k++) { const dz = (k % 2 ? 0.06 : -0.06); out.push({ box: (k + n) % 3 === 0 ? 'glassClear' : 'dz_glassDark', x: BX - 1.2 + k * 0.3, y: y + hy + 0.0125 + 0.08, z: z + dz, w: 0.08, h: 0.16, d: 0.08, tag: '① 试剂瓶', on: 'partv' });
        out.push({ box: 'blackMetal', x: BX - 1.2 + k * 0.3, y: y + hy + 0.0125 + 0.175, z: z + dz, w: 0.05, h: 0.03, d: 0.05, tag: '① 瓶盖', on: 'partv' }); } }
    // 台面：两侧各一个水嘴/气嘴（铜）+ 一份实验记录纸；偶数排放显微镜、奇数排放玻璃器皿组
    for (const s of [-1, 1]) { out.push({ box: 'dz_brassDim', x: BX + 1.25, y: y + 0.95, z: z + s * 0.25, w: 0.03, h: 0.1, d: 0.03, tag: '① 气嘴', on: 'partv' });
      out.push({ box: 'dz_paper', x: BX - 0.6, y: y + 0.902, z: z + s * 0.5, w: 0.21, h: 0.004, d: 0.297, yaw: 0.05 * s, tag: '① 记录纸', on: 'desk' }); }
    out.push(n % 2 ? { m: 'chem_set', x: BX + 0.4, y: y + 0.9, z: z + 0.42, yaw: 0, w: 0.6, tag: '① 器皿', on: 'desk' } : { m: 'microscope', x: BX + 0.5, y: y + 0.9, z: z + 0.45, yaw: Math.PI, h: 0.4, tag: '① 显微镜', on: 'desk' });
    // 批次18：R4 实验器皿（Blender 预览验收 work/r3/b18/prev/）成组摆台面北侧：烧杯组 + 圆底烧瓶组 + 广口试剂瓶 + 软木塞瓶
    out.push({ m: 'r4/lab_beakers_set', x: BX - 0.15, y: y + 0.9, z: z - 0.45, yaw: Math.PI / 2, h: 0.15, tag: '① 烧杯组', on: 'desk' });
    out.push({ m: 'r4/lab_round_bottom_flasks', x: BX + 0.75, y: y + 0.9, z: z - 0.42, yaw: Math.PI / 2, h: 0.17, tag: '① 烧瓶组', on: 'desk' });
    for (const [dx, m, h] of [[-1.1, 'r4/container_jar_glass_silver_a01', 0.19], [-0.88, 'r4/misc_bottle_corked_a01', 0.1], [-0.76, 'r4/misc_bottle_corked_a01', 0.1]]) out.push({ m, x: BX + dx, y: y + 0.9, z: z - 0.48, yaw: 0, h, tag: '① 试剂瓶', on: 'desk' });
    for (const dx of [-0.75, 0.75]) out.push({ m: 'r2/laboratory_stool', x: BX + dx, y, z: z + 1.05, yaw: 0, h: 0.6, tag: '① 实验凳', on: 'floor' });
    out.push({ troffer: true, x: BX, y: y + H - 0.25, z, len: 3.0, size: [3.0, 0.1, 0.34], tag: '日光灯', on: 'light' });
    n++;
  }
  // ② 北墙通风橱 × 5
  for (let i = 0; i < 5; i++) { const x = 11.0 + i * 1.75, z = -119.33, W = 1.65;
    out.push({ fixed: true, m: '固定:通风橱', x, y, z, yaw: 0, size: [W, 2.9, 0.9], col: [W, 2.9, 0.9], tag: '② 通风橱', on: 'floor' });
    out.push({ box: 'paintedGreen', x, y: y + 0.42, z, w: W, h: 0.84, d: 0.88, uv: 1, tag: '② 下柜', on: 'partv' });
    out.push({ box: 'r3_epoxyBlack', x, y: y + 0.86, z: z + 0.01, w: W + 0.02, h: 0.04, d: 0.9, uv: 0.5, tag: '② 台面', on: 'partv' });
    for (const s of [-1, 1]) out.push({ box: 'paintedGreen', x: x + s * (W / 2 - 0.04), y: y + 1.62, z, w: 0.08, h: 1.48, d: 0.88, uv: 1, tag: '② 侧板', on: 'partv' });
    out.push({ box: 'r3_tile', x, y: y + 1.62, z: z - 0.43, w: W - 0.16, h: 1.48, d: 0.02, uv: 0.5, tag: '② 白瓷砖内衬', on: 'partv' });
    out.push({ box: 'paintedGreen', x, y: y + 2.62, z, w: W, h: 0.52, d: 0.88, uv: 1, tag: '② 顶箱', on: 'partv' });
    out.push({ box: 'glassClear', x, y: y + 1.98, z: z + 0.4, w: W - 0.18, h: 0.72, d: 0.015, tag: '② 玻璃拉门', on: 'partv' });
    for (const hy of [1.6, 2.36]) out.push({ box: 'steel', x, y: y + hy, z: z + 0.41, w: W - 0.16, h: 0.04, d: 0.04, tag: '② 拉门框', on: 'partv' });
    out.push({ box: 'blackMetal', x, y: y + 2.88 + (H - 2.88) / 2, z: z - 0.1, w: 0.34, h: H - 2.88, d: 0.34, tag: '② 排风管', on: 'partv' });
    out.push({ box: 'dz_glassDark', x: x - 0.35, y: y + 0.98, z: z - 0.15, w: 0.1, h: 0.2, d: 0.1, tag: '② 烧瓶', on: 'partv' });
    out.push({ box: 'glassClear', x: x + 0.2, y: y + 0.96, z: z - 0.1, w: 0.12, h: 0.16, d: 0.12, tag: '② 烧杯', on: 'partv' });
    light(out, x, y + 2.25, z - 0.1, 0xf6f2e8, 0.35, 1.6); }
  out.push({ wtext: '严 谨 求 实　安 全 第 一', x: 14.5, y: y + 4.25, z: -119.78, yaw: 0, w: 5.6, h: 0.5, size: [5.86, 0.72, 0.05], tag: '② 标语', on: 'sign' });
  // ③ 冷柜 × 2 + 试剂钢架 + 水槽台 + 洗眼站
  for (const x of [20.25, 21.3]) { out.push({ fixed: true, m: '固定:样本冷柜', x, y, z: -119.38, yaw: 0, size: [0.95, 1.85, 0.8], col: [0.95, 1.85, 0.8], tag: '③ 冷柜', on: 'floor' });
    out.push({ box: 'whiteMarble', x, y: y + 0.925, z: -119.38, w: 0.93, h: 1.85, d: 0.78, uv: 0.3, tag: '③ 冷柜', on: 'partv' });
    out.push({ box: 'steel', x: x + 0.36, y: y + 1.1, z: -118.97, w: 0.04, h: 0.5, d: 0.04, tag: '③ 冷柜把手', on: 'partv' });
    out.push({ notice: '样本冷藏', lines: ['温度 4 ℃', '双人登记'], red: true, x, y: y + 1.5, z: -118.985, yaw: 0, w: 0.3, h: 0.2, size: [0.3, 0.2, 0.01], tag: '③ 标签', on: 'sign' }); }
  out.push({ m: 'r2/steel_frame_shelves_02', x: 23.0, y, z: -119.4, yaw: 0, h: 2.0, tag: '③ 试剂架', on: 'floor' });
  for (let s = 0; s < 3; s++) for (let k = 0; k < 6; k++) out.push({ box: k % 2 ? 'dz_glassDark' : 'glassClear', x: 22.45 + k * 0.22, y: y + 0.5 + s * 0.6, z: -119.4, w: 0.1, h: 0.2, d: 0.1, tag: '③ 试剂瓶', on: 'partv' });
  out.push({ fixed: true, m: '固定:水槽台', x: 25.25, y, z: -119.45, yaw: 0, size: [1.5, 0.9, 0.65], col: [1.5, 0.9, 0.65], tag: '③ 水槽台', on: 'floor' });
  out.push({ box: 'paintedGreen', x: 25.25, y: y + 0.42, z: -119.45, w: 1.48, h: 0.84, d: 0.62, uv: 1, tag: '③ 水槽台', on: 'partv' });
  out.push({ box: 'r3_epoxyBlack', x: 25.25, y: y + 0.87, z: -119.44, w: 1.52, h: 0.04, d: 0.66, uv: 0.5, tag: '③ 水槽台面', on: 'partv' });
  out.push({ box: 'whiteMarble', x: 25.05, y: y + 0.86, z: -119.42, w: 0.6, h: 0.05, d: 0.42, uv: 0.3, tag: '③ 白瓷水盆', on: 'partv' });
  out.push({ box: 'steel', x: 25.05, y: y + 1.1, z: -119.68, w: 0.04, h: 0.42, d: 0.04, tag: '③ 鹅颈龙头', on: 'partv' });
  out.push({ box: 'steel', x: 25.05, y: y + 1.31, z: -119.55, w: 0.04, h: 0.04, d: 0.26, tag: '③ 鹅颈龙头', on: 'partv' });
  // 洗眼 / 紧急淋浴站（黄色立管 + 顶部淋浴盘 + 洗眼盆 + 绿色标牌）
  { const x = 27.3, z = -119.1; // 批次18：程序化黄管洗眼站 → R4 safety_eyewashStation_combo_shower_a01（Blender 预览验收）
    out.push({ m: 'r4/safety_eyewashStation_combo_shower_a01', x: 27.35, y, z: -119.58, yaw: Math.PI, h: 2.3, tag: '③ 洗眼站', on: 'floor' });
    out.push({ notice: '紧急洗眼 · 淋浴', lines: ['拉下手柄', '冲洗十五分钟'], x: x + 0.66, y: y + 1.75, z: -119.785, yaw: 0, w: 0.42, h: 0.3, size: [0.42, 0.3, 0.01], tag: '③ 标牌', on: 'sign' }); }
  light(out, 23.8, y + 3.2, -117.6, 0xf4f0e4, 1.4, 7);
  // ④ 仪器柜：东墙窗间墙两组（每组两只）+ 南墙一排六只（灰绿柜身 + 玻璃门 + 内部仪器剪影）
  const cab = (x, z, yaw, tag) => { const [nx, nz] = [Math.sin(yaw), Math.cos(yaw)];
    out.push({ fixed: true, m: '固定:仪器柜', x, y, z, yaw, size: [0.95, 2.0, 0.5], col: [0.95, 2.0, 0.5], tag, on: 'floor' });
    out.push({ box: 'paintedGreen', x, y: y + 1.0, z, w: 0.95, h: 2.0, d: 0.48, uv: 1, yaw, tag, on: 'partv' });
    out.push({ box: 'glassClear', x: x + nx * 0.245, y: y + 1.32, z: z + nz * 0.245, w: 0.82, h: 1.2, d: 0.012, yaw, tag, on: 'partv' });
    for (const hy of [0.95, 1.35, 1.75]) out.push({ box: 'wood', x: x + nx * 0.02, y: y + hy, z: z + nz * 0.02, w: 0.86, h: 0.02, d: 0.4, uv: 0.6, yaw, tag, on: 'partv' });
    for (const [hy, k] of [[0.96, 0], [1.36, 1], [1.76, 2]]) out.push({ box: k === 1 ? 'dz_brassDim' : 'dz_glassDark', x: x + nx * 0.02, y: y + hy + 0.1, z: z + nz * 0.02, w: 0.3, h: 0.18, d: 0.2, yaw, tag, on: 'partv' });
    out.push({ box: 'dz_brassDim', x: x + nx * 0.25, y: y + 1.05, z: z + nz * 0.25, w: 0.02, h: 0.12, d: 0.02, yaw, tag, on: 'partv' }); };
  for (const z of [-96.95, -98.05, -101.95, -103.05]) cab(27.72, z, ROT.W, '④ 仪器柜');
  for (let i = 0; i < 6; i++) cab(18.9 + i * 1.0, -92.47, ROT.N, '④ 仪器柜');
  out.push({ sign: '精 密 仪 器', sub: '取用须登记 · 用毕归位', x: 21.4, y: y + 2.2, z: -92.71, yaw: ROT.N, size: [0.34, 0.12, 0.01], tag: '铜牌', on: 'sign' });
  // 批次19：进门近景「样品预检台」（x 12.1，z −101.6，命名会议桌与第一台之间，lab_r3 机位 ~4 m 处）：钢架推车 + 黑环氧台面 + 下层隔板；
  //   台面自西向东：显微镜 / 试管架（6 支试管，三色试液，定点）/ 摊开的实验记录本 + 钢笔 / 台灯；下层：文件堆 + 烧杯组
  { const tx = 12.1, tz = -101.6, top = y + 0.9;
    out.push({ box: 'r3_epoxyBlack', x: tx, y: top - 0.02, z: tz, w: 1.4, h: 0.04, d: 0.62, uv: 0.5, tag: '⑥ 预检台', on: 'floor', col: [1.4, 0.9, 0.62] });
    for (const dx of [-0.66, 0.66]) for (const dz of [-0.27, 0.27]) out.push({ box: 'steel', x: tx + dx, y: y + 0.44, z: tz + dz, w: 0.04, h: 0.88, d: 0.04, tag: '⑥ 预检台架', on: 'partv' });
    out.push({ box: 'r3_steelGrey', x: tx, y: y + 0.25, z: tz, w: 1.34, h: 0.025, d: 0.56, tag: '⑥ 预检台下层', on: 'partv' });
    out.push({ m: 'microscope', x: tx - 0.48, y: top, z: tz, yaw: ROT.N, h: 0.4, tag: '⑥ 显微镜', on: 'desk' });
    // 试管架：木底座 + 立柱 + 打孔横板 + 6 支试管
    out.push({ box: 'wood', x: tx - 0.06, y: top + 0.012, z: tz + 0.05, w: 0.34, h: 0.024, d: 0.1, uv: 0.6, tag: '⑥ 试管架', on: 'partv' });
    for (const dx of [-0.16, 0.16]) out.push({ box: 'wood', x: tx - 0.06 + dx, y: top + 0.08, z: tz + 0.05, w: 0.02, h: 0.12, d: 0.08, tag: '⑥ 试管架', on: 'partv' });
    out.push({ box: 'wood', x: tx - 0.06, y: top + 0.13, z: tz + 0.05, w: 0.34, h: 0.016, d: 0.08, uv: 0.6, tag: '⑥ 试管架', on: 'partv' });
    const liq = ['dz_pipeRed', 'r3_paintYellow', 'dz_tileG', 'dz_pipeRed', 'r3_paintYellow', 'dz_tileG'];
    for (let k = 0; k < 6; k++) { const x = tx - 0.06 - 0.125 + k * 0.05;
      out.push({ box: 'glassClear', x, y: top + 0.1, z: tz + 0.05, w: 0.018, h: 0.16, d: 0.018, tag: '⑥ 试管', on: 'partv' });
      out.push({ box: liq[k], x, y: top + 0.05, z: tz + 0.05, w: 0.014, h: 0.06 + (k % 3) * 0.015, d: 0.014, tag: '⑥ 试液', on: 'partv' }); }
    out.push({ m: 'r4/book_open_a01', x: tx + 0.3, y: top, z: tz + 0.08, yaw: ROT.N + 0.12, w: 0.36, tag: '⑥ 实验记录本', on: 'desk' });
    out.push({ box: 'dz_bakelite', x: tx + 0.48, y: top + 0.006, z: tz + 0.16, w: 0.13, h: 0.012, d: 0.012, yaw: 0.4, tag: '⑥ 钢笔', on: 'partv' });
    out.push({ m: 'r2/bankers_lamp', x: tx + 0.55, y: top, z: tz - 0.18, yaw: ROT.N, h: 0.36, tag: '⑥ 台灯', on: 'desk' });
    out.push({ m: 'r4/paper_stack_a04', x: tx - 0.35, y: y + 0.263, z: tz, yaw: 0, w: 0.3, tag: '⑥ 文件堆', on: 'partv' });
    out.push({ m: 'r4/lab_beakers_set', x: tx + 0.3, y: y + 0.263, z: tz, yaw: Math.PI / 2, h: 0.15, tag: '⑥ 烧杯组', on: 'partv' });
    light(out, tx + 0.4, y + 1.5, tz - 0.1, 0xffe4b8, 0.9, 2.6); }
  // ⑤ 西墙黑板 + 实验守则告示
  light(out, 11.2, y + 2.9, -108.5, 0xfff2e0, 1.6, 4.5); // 批次18：黑板专门补光
  out.push({ chalk: true, x: 9.8, y: y + 1.75, z: -108.5, yaw: ROT.E, w: 4.0, h: 1.3, size: [4.2, 1.5, 0.06], tag: '⑤ 黑板', on: 'sign' });
  out.push({ box: 'wood', x: 9.84, y: y + 1.04, z: -108.5, w: 0.1, h: 0.04, d: 4.0, uv: 0.6, tag: '⑤ 粉笔槽', on: 'partv' });
  out.push({ notice: '实验室守则', lines: ['一、进入实验室须穿工作服', '二、严禁在室内饮食吸烟', '三、易燃试剂入柜双人双锁', '四、废液分类回收', '五、离室断水断电关气'], red: true, x: 9.77, y: y + 1.6, z: -102.6, yaw: ROT.E, w: 0.6, h: 0.82, size: [0.6, 0.82, 0.01], tag: '⑤ 守则', on: 'sign' });
  out.push({ m: 'r2/fire_extinguisher', x: 10.05, y, z: -100.6, yaw: ROT.E, h: 0.6, tag: '消防', on: 'floor' });
  hang(out, '理 化 分 析 组', BX0, y + 3.9, -101.6, 0, 2.0, 0.42, y + H);
  for (const bx of [BX0, 22.0]) for (const z of [-104.5, -110.5]) light(out, bx, y + 3.4, z, 0xf4f0e4, 1.8, 9);
  light(out, 23.5, y + 3.4, -101, 0xf4f0e4, 1.4, 8);
  return { room, items: out };
}
PLANS.lab3 = (Y) => fixYaw(planLab3(Y)); R3.lab3 = true;

// ======== 批次19：B3 证物收容库 · 开架区（vault.js 房间 x −20…20，z −128…−92，H 6.2，入口气闸在南墙 z −92 x 0，北为 −z）========
//  功能平面：① 入口——气闸两侧加铆钉钢板防爆门扇（开启贴南墙内侧）+ 混凝土门垛 + 门楣「证物收容库 B3」；② 登记台（入口西侧，面向入口）；
//  ③ 东西两侧各 6 间收容格（混凝土隔墙 + 前脸 R4 钢网隔离门 + 钢门楣 + 编号铜牌 + 红色警示灯 + 格内证物箱）；
//  ④ 中央通道（原黄黑警示线 x ±2.4 + 原中轴展示台/电饭锅剧情件保留）；⑤ 两侧中区沿 z 交替：深灰绿钢架（证物箱）/ 标本罐柜；
//  ⑥ 北墙（z −128）铆钉钢板 + 观察窗（向转运缓冲间）。全部成排定点，无随机。
export function planVaultB3(y) {
  const out = []; const H = 6.2, X0 = -20, X1 = 20, Z0 = -128, Z1 = -92;
  const room = { name: 'B3 证物收容库 · 开架区（批次19）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H,
    doors: [{ wall: 'S', a: -2.3, b: 2.3, label: '气闸 ↓ 电梯厅' }], windows: [],
    rooms: [['① 防爆门', 0, -92.8], ['② 登记台', -5.5, -93.9], ['③ 收容格 西', -17.7, -111], ['③ 收容格 东', 17.7, -111], ['④ 中央通道', 0, -111], ['⑤ 钢架/标本柜 西', -9.5, -111], ['⑤ 钢架/标本柜 东', 9.5, -111], ['⑥ 观察窗', 0, -127.6]],
    aisles: [{ label: '中央通道（东半）', x0: 0.6, x1: 2.3, z0: -126.5, z1: -96.0 }, { label: '入口横道', x0: -14.8, x1: 14.8, z0: -97.2, z1: -95.6 },
      { label: '西收容格前道', x0: -15.1, x1: -12.2, z0: -126.5, z1: -96.0 }, { label: '东收容格前道', x0: 12.2, x1: 15.1, z0: -126.5, z1: -96.0 },
      { label: '西中道', x0: -6.9, x1: -3.0, z0: -126.5, z1: -96.0 }, { label: '东中道', x0: 3.0, x1: 6.9, z0: -126.5, z1: -96.0 }, { label: '南横道', x0: -14.8, x1: 14.8, z0: -127.2, z1: -125.8 }] };
  const F = (lab, x, z, w, d, h = 1) => out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, h, d], col: [w, h, d], tag: '原锚点', on: 'floor' });
  for (let i = 0; i < 6; i++) F('展示台' + (i + 1), 0, -99.5 - i * 4.6, 1.0, 1.0);
  F('电饭锅台', -1.6, -104.1, 0.8, 0.8); F('气闸门框', 0, -92.3, 5.0, 0.5, 3.6);
  // ① 防爆门：门垛（混凝土）+ 两扇铆钉钢板厚门扇开启贴南墙内侧 + 门楣铭牌
  for (const s of [-1, 1]) { const x = s * 5.6;
    out.push({ box: 'r3_bunkerConc', x: s * 2.95, y: y + 1.9, z: -92.45, w: 0.7, h: 3.8, d: 0.5, uv: 0.5, tag: '① 门垛', on: 'partv' });
    out.push({ box: 'r3_steelOld', x, y: y + 1.6, z: -92.38, w: 2.2, h: 3.2, d: 0.3, uv: 0.6, tag: '① 防爆门扇', on: 'partv' });
    for (const dy of [0.3, 1.6, 2.9]) out.push({ box: 'r3_rackGreen', x, y: y + dy, z: -92.55, w: 2.2, h: 0.14, d: 0.04, tag: '① 门扇横筋', on: 'partv' });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) out.push({ box: 'dz_pipe', x: x - 0.95 + c * 0.38, y: y + 0.2 + r * 0.95, z: -92.55, w: 0.04, h: 0.04, d: 0.03, tag: '① 铆钉', on: 'partv' });
    out.push({ box: 'dz_pipe', x: x - s * 0.8, y: y + 1.5, z: -92.62, w: 0.08, h: 0.5, d: 0.08, tag: '① 闩杆把手', on: 'partv' }); }
  out.push({ box: 'r3_bunkerConc', x: 0, y: y + 3.95, z: -92.45, w: 6.6, h: 0.5, d: 0.5, uv: 0.5, tag: '① 门楣', on: 'partv' });
  out.push({ sign: '证 物 收 容 库  B3', sub: '开架区 · 1–3 级 · 进出登记', x: 0, y: y + 3.95, z: -92.71, yaw: 0, size: [0.34, 0.12, 0.01], tag: '① 铜牌', on: 'sign' });
  // ② 登记台（入口西侧，台面朝入口，人员背门而坐、面朝库内——注：r3plan ROT.N 朝 −z）
  { const x = -5.5, z = -93.9, top = y + 0.9;
    out.push({ fixed: true, m: '固定:登记台', x, y, z, yaw: 0, size: [2.5, 0.9, 0.86], col: [2.5, 0.9, 0.86], tag: '② 登记台', on: 'floor' });
    out.push({ box: 'r3_rackGreen', x, y: y + 0.45, z, w: 2.4, h: 0.88, d: 0.8, uv: 0.6, tag: '② 登记台', on: 'partv' });
    out.push({ box: 'dz_beam', x, y: top - 0.015, z, w: 2.5, h: 0.04, d: 0.86, uv: 0.5, tag: '② 台面', on: 'partv' });
    out.push({ m: 'r4/book_open_a01', x: x - 0.3, y: top, z: z + 0.05, yaw: ROT.N, w: 0.4, tag: '② 登记簿', on: 'desk' });
    out.push({ m: 'r2/bankers_lamp', x: x + 0.85, y: top, z: z + 0.15, yaw: ROT.N, h: 0.36, tag: '② 台灯', on: 'desk' });
    out.push({ m: 'r2/rotary_telephone', x: x + 0.35, y: top, z: z + 0.1, yaw: ROT.N, w: 0.22, tag: '② 电话', on: 'desk' });
    out.push({ m: 'r4/exam_chair', x, y, z: z - 0.85, yaw: ROT.N, h: 0.9, tag: '② 值守椅', on: 'floor' });
    out.push({ sign: '登 记 台', sub: '证物出入库 · 双人签字', x, y: y + 0.6, z: z + 0.41, yaw: 0, size: [0.34, 0.12, 0.01], tag: '② 铜牌', on: 'sign' });
    light(out, x + 0.6, y + 1.6, z, 0xffe0b0, 0.8, 3); }
  // ③ 收容格：两侧各 6 间（z 中心 −98.5 … −123.5，每间 5 m），进深 4.3 m
  const cases = [['r4/case_a01', 0.62], ['r4/case_c02', 0.78], ['r4/case_d01', 0.48]];
  // 批次20：证物箱改 军绿 / 冷灰涂装钢箱 + 牛皮纸档案箱（程序化，定点轮换；R4 黑铝箱在暖光下像藤箱 → 只留格内少量）
  const crate = (kind, x, by, z, w, h, d, tag, yawX = false) => { const [W2, D2] = yawX ? [d, w] : [w, d];
    if (kind === 2) { out.push({ box: 'r3_kraftBox', x, y: by + h / 2, z, w: W2, h, d: D2, uv: 0.5, tag, on: 'partv' });
      out.push({ box: 'r3_kraftBox', x, y: by + h - 0.02, z, w: W2 + 0.03, h: 0.06, d: D2 + 0.03, uv: 0.5, tag: tag + '·盒盖', on: 'partv' });
      out.push(yawX ? { box: 'r3_stencil', x: x + Math.sign(x || 1) * -(W2 / 2 + 0.003), y: by + h * 0.5, z, w: 0.004, h: 0.1, d: D2 * 0.5, tag: tag + '·标签', on: 'partv' } : { box: 'r3_stencil', x, y: by + h * 0.5, z: z + D2 / 2 + 0.003, w: W2 * 0.5, h: 0.1, d: 0.004, tag: tag + '·标签', on: 'partv' }); return; }
    const m = kind === 0 ? 'r3_crateOlive' : 'r3_crateGrey';
    out.push({ box: m, x, y: by + h / 2, z, w: W2, h, d: D2, uv: 0.6, tag, on: 'partv' });
    out.push({ box: 'r3_steelOld', x, y: by + h - 0.06, z, w: W2 + 0.02, h: 0.03, d: D2 + 0.02, tag: tag + '·箱盖缝', on: 'partv' });
    if (yawX) { const fx = x + Math.sign(x || 1) * -(W2 / 2 + 0.006); for (const dz of [-D2 * 0.3, D2 * 0.3]) out.push({ box: 'dz_pipe', x: fx, y: by + h - 0.1, z: z + dz, w: 0.02, h: 0.07, d: 0.05, tag: tag + '·搭扣', on: 'partv' });
      out.push({ box: 'r3_stencil', x: fx, y: by + h * 0.42, z, w: 0.004, h: 0.07, d: D2 * 0.45, tag: tag + '·喷码', on: 'partv' }); }
    else { for (const dx of [-W2 * 0.3, W2 * 0.3]) out.push({ box: 'dz_pipe', x: x + dx, y: by + h - 0.1, z: z + D2 / 2 + 0.006, w: 0.05, h: 0.07, d: 0.02, tag: tag + '·搭扣', on: 'partv' });
      out.push({ box: 'r3_stencil', x, y: by + h * 0.42, z: z + D2 / 2 + 0.004, w: W2 * 0.45, h: 0.07, d: 0.004, tag: tag + '·喷码', on: 'partv' }); } };
  for (const s of [-1, 1]) { const xf = s * 15.5, xw = s * 19.8, xm = (xf + xw) / 2;
    for (let k = 0; k <= 6; k++) out.push({ box: 'r3_bunkerConc', x: xm, y: y + 1.5, z: -96 - k * 5, w: 4.3, h: 3.0, d: 0.24, uv: 0.5, tag: '③ 隔墙', on: 'partv' });
    for (let k = 0; k < 6; k++) { const zc = -98.5 - k * 5, n = String((s < 0 ? 1 : 7) + k).padStart(2, '0');
      for (const dz of [-1.13, 1.13]) out.push({ m: 'r4/wire_securityRoom_b01', x: xf, y, z: zc + dz, yaw: ROT.E, h: 2.6, tag: '③ 钢网隔离门', on: 'floor' });
      out.push({ box: 'r3_steelOld', x: xf, y: y + 2.8, z: zc, w: 0.24, h: 0.4, d: 4.76, uv: 0.6, tag: '③ 钢门楣', on: 'partv' });
      out.push({ sign: 'B3-收-' + n, sub: (k % 3) + 1 + ' 级 · 开架', x: xf - s * 0.13, y: y + 2.8, z: zc + 1.4, yaw: s < 0 ? ROT.E : ROT.W, size: [0.34, 0.12, 0.01], tag: '③ 编号铜牌', on: 'sign' });
      out.push({ box: 'r3_warnRed', x: xf - s * 0.16, y: y + 2.82, z: zc - 1.4, w: 0.1, h: 0.14, d: 0.14, tag: '③ 警示灯', on: 'partv' });
      out.push({ box: 'blackMetal', x: xf - s * 0.13, y: y + 2.82, z: zc - 1.4, w: 0.04, h: 0.2, d: 0.2, tag: '③ 警示灯座', on: 'partv' });
      light(out, xf - s * 0.5, y + 2.6, zc - 1.4, 0xff3020, 0.5, 2.2);
      { const zz = zc + (k % 2 ? 0.8 : -0.8); crate(k % 3 === 2 ? 1 : 0, s * 18.4, y, zz, 1.0, 0.55, 0.62, '③ 格内钢箱', true); crate(k % 2 ? 2 : 1, s * 18.4, y + 0.55, zz, 0.8, 0.4, 0.5, '③ 格内叠箱', true);
        if (k % 2 === 0) { const [m, w] = cases[k % 3]; out.push({ m, x: s * 18.3, y, z: zc + 1.2 * (k % 2 ? -1 : 1), yaw: ROT.N, w: Math.min(w, 0.6), tag: '③ 格内黑铝箱', on: 'floor' }); } }
      light(out, s * 17.7, y + 2.7, zc, 0xdfe8ff, 0.7, 4); } }
  // ⑤ 两侧中区：沿 z 交替 深灰绿钢架（z −99 / −111 / −123）与 标本罐柜（z −105 / −117）
  for (const s of [-1, 1]) { const cx = s * 9.5;
    for (const z of [-99, -111, -123]) {
      out.push({ fixed: true, m: '固定:钢架', x: cx, y, z, yaw: 0, size: [4.0, 2.1, 0.7], col: [4.0, 2.1, 0.7], tag: '⑤ 钢架', on: 'floor' });
      for (const dx of [-1.97, 0, 1.97]) for (const dz of [-0.33, 0.33]) out.push({ box: 'r3_rackGreen', x: cx + dx, y: y + 1.05, z: z + dz, w: 0.05, h: 2.1, d: 0.05, tag: '⑤ 立柱', on: 'partv' });
      for (const [lv, hy] of [0.12, 0.72, 1.32, 1.92].entries()) { out.push({ box: 'r3_rackGreen', x: cx, y: y + hy, z, w: 4.0, h: 0.04, d: 0.7, tag: '⑤ 层板', on: 'partv' });
        if (lv === 3) continue;
        for (let i = 0; i < 4; i++) { const kind = (i + lv + (z === -111 ? 1 : 0)) % 3, xx = cx - 1.45 + i * 0.97; crate(kind, xx, y + hy + 0.02, z, kind === 2 ? 0.7 : 0.82, kind === 2 ? 0.34 : 0.4, 0.5, '⑤ 证物箱');
          out.push({ box: 'dz_paper', x: xx + 0.28, y: y + hy + 0.16, z: z + 0.256, w: 0.12, h: 0.07, d: 0.004, tag: '⑤ 编号签', on: 'partv' }); } } }
    for (const z of [-105, -117]) {
      out.push({ fixed: true, m: '固定:标本罐柜', x: cx, y, z, yaw: 0, size: [3.0, 2.0, 0.6], col: [3.0, 2.0, 0.6], tag: '⑤ 标本罐柜', on: 'floor' });
      out.push({ box: 'r3_rackGreen', x: cx, y: y + 0.15, z, w: 3.0, h: 0.3, d: 0.6, tag: '⑤ 柜座', on: 'partv' });
      out.push({ box: 'r3_rackGreen', x: cx, y: y + 1.97, z, w: 3.0, h: 0.06, d: 0.6, tag: '⑤ 柜顶', on: 'partv' });
      for (const dx of [-1.48, 1.48]) out.push({ box: 'r3_rackGreen', x: cx + dx, y: y + 1.0, z, w: 0.04, h: 1.94, d: 0.6, tag: '⑤ 柜侧板', on: 'partv' });
      for (const sz of [-1, 1]) out.push({ box: 'glassClear', x: cx, y: y + 1.12, z: z + sz * 0.29, w: 2.9, h: 1.6, d: 0.01, tag: '⑤ 玻璃门', on: 'partv' });
      for (const hy of [0.32, 0.86, 1.4]) { out.push({ box: 'r3_steelGrey', x: cx, y: y + hy, z, w: 2.9, h: 0.02, d: 0.54, tag: '⑤ 隔板', on: 'partv' });
        for (let i = 0; i < 5; i++) out.push({ m: 'r4/specimen_octopus_jar', x: cx - 1.16 + i * 0.58, y: y + hy + 0.01, z, yaw: (i % 2) * Math.PI, h: 0.36, tag: '⑤ 标本罐', on: 'partv' }); }
      out.push({ sign: '浸 制 标 本', sub: '勿开盖 · 勿对视', x: cx, y: y + 2.15, z: z + 0.31, yaw: 0, size: [0.34, 0.12, 0.01], tag: '⑤ 铜牌', on: 'sign' });
      light(out, cx, y + 2.6, z, 0xdfe8ff, 0.7, 3.5); } }
  // ⑥ 北墙（z −128）：铆钉钢板护墙 + 观察窗（钢框 + 深色玻璃 + 内侧冷光）
  out.push({ box: 'r3_steelOld', x: 0, y: y + 1.5, z: -127.85, w: 30, h: 3.0, d: 0.06, uv: 0.4, tag: '⑥ 钢板护墙', on: 'partv' });
  for (let x = -14.5; x <= 14.5; x += 1.5) out.push({ box: 'r3_rackGreen', x, y: y + 1.5, z: -127.8, w: 0.08, h: 3.0, d: 0.04, tag: '⑥ 钢板接缝', on: 'partv' });
  for (let x = -14.75; x <= 14.75; x += 0.5) for (const hy of [0.15, 2.85]) out.push({ box: 'dz_pipe', x, y: y + hy, z: -127.79, w: 0.04, h: 0.04, d: 0.03, tag: '⑥ 铆钉', on: 'partv' });
  out.push({ box: 'dz_glassDark', x: 0, y: y + 1.75, z: -127.76, w: 3.0, h: 1.1, d: 0.02, tag: '⑥ 观察窗', on: 'partv' });
  out.push({ box: 'r3_bunkerConc', x: 0, y: y + 1.75, z: -127.62, w: 3.5, h: 0.22, d: 0.3, uv: 0.5, tag: '⑥ 窗台', on: 'partv' });
  for (const dx of [-1.6, 1.6]) out.push({ box: 'blackMetal', x: dx, y: y + 1.75, z: -127.7, w: 0.16, h: 1.4, d: 0.12, tag: '⑥ 窗框', on: 'partv' });
  out.push({ box: 'blackMetal', x: 0, y: y + 2.38, z: -127.7, w: 3.36, h: 0.16, d: 0.12, tag: '⑥ 窗框', on: 'partv' });
  out.push({ sign: '观 察 窗', sub: '转运缓冲间 · 4 级以上候检', x: 0, y: y + 2.65, z: -127.72, yaw: 0, size: [0.34, 0.12, 0.01], tag: '⑥ 铜牌', on: 'sign' });
  light(out, 0, y + 2.2, -126.8, 0xcfe0ff, 1.0, 4);
  // 批次19 看图（vault_r3）：四面墙 / 天花几乎纯黑、空间像空仓库 → 墙面整面浅灰混凝土护面 + 天花混凝土主梁（5 m 一道，避开灯带）+ 墙面洗墙灯
  for (const s of [-1, 1]) out.push({ box: 'r3_bunkerConc', x: s * 19.93, y: y + H / 2, z: -110, w: 0.1, h: H, d: 36, uv: 0.35, tag: '墙面护面', on: 'partv' });
  out.push({ box: 'r3_bunkerConc', x: 0, y: y + H / 2, z: -127.95, w: 40, h: H, d: 0.08, uv: 0.35, tag: '墙面护面', on: 'partv' });
  for (const s of [-1, 1]) out.push({ box: 'r3_bunkerConc', x: s * 14.7, y: y + H / 2, z: -92.07, w: 10.6, h: H, d: 0.1, uv: 0.35, tag: '墙面护面', on: 'partv' });
  out.push({ box: 'r3_bunkerConc', x: 0, y: y + 5.7, z: -92.07, w: 18.8, h: 1.0, d: 0.1, uv: 0.35, tag: '墙面护面', on: 'partv' });
  out.push({ box: 'r3_bunkerConc', x: 0, y: y + H - 0.03, z: -110, w: 39.8, h: 0.05, d: 35.8, uv: 0.3, tag: '天花', on: 'partv' });
  for (let z = -97.5; z > -127; z -= 5) out.push({ box: 'r3_bunkerConc', x: 0, y: y + H - 0.35, z, w: 39.8, h: 0.6, d: 0.45, uv: 0.4, tag: '天花主梁', on: 'partv' });
  for (const s of [-1, 1]) for (const z of [-100, -110, -120]) light(out, s * 17.6, y + 4.6, z, 0xd8e2f0, 1.2, 8);
  light(out, 0, y + 4.6, -125.5, 0xd8e2f0, 1.0, 9);
  // 批次20：亮度提升但保留压迫感——两侧墙防爆壁灯成排（隔墙上方，钢底座 + 冷白灯罩 + 黑钢护笼）+ 中央 / 中道冷白吸顶灯管（梁间）
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { const z = -98.5 - k * 5, xw = s * 19.82;
    out.push({ box: 'r3_steelGrey', x: xw, y: y + 3.75, z, w: 0.1, h: 0.42, d: 0.3, tag: '防爆壁灯座', on: 'partv' });
    out.push({ box: 'dz_glowCold', x: xw - s * 0.13, y: y + 3.72, z, w: 0.16, h: 0.26, d: 0.18, tag: '防爆壁灯罩', on: 'partv' });
    for (const dz of [-0.1, 0.1]) out.push({ box: 'blackMetal', x: xw - s * 0.22, y: y + 3.72, z: z + dz, w: 0.02, h: 0.32, d: 0.02, tag: '防爆灯护笼', on: 'partv' });
    out.push({ box: 'blackMetal', x: xw - s * 0.15, y: y + 3.89, z, w: 0.18, h: 0.03, d: 0.24, tag: '防爆灯护笼', on: 'partv' });
    if (k % 2 === 0) light(out, xw - s * 0.8, y + 3.6, z - 2.5, 0xe4ecff, 1.1, 7); }
  for (const x of [-4.95, 4.95]) for (let z = -100; z > -126; z -= 5) { // x 0 已有 vault.js 荧光灯带
    out.push({ box: 'r3_steelGrey', x, y: y + H - 0.12, z, w: 0.3, h: 0.08, d: 2.6, tag: '吸顶灯槽', on: 'partv' });
    out.push({ box: 'dz_glowCold', x, y: y + H - 0.175, z, w: 0.16, h: 0.03, d: 2.4, tag: '冷白灯管', on: 'partv' }); }
  for (const z of [-102.5, -117.5]) light(out, 0, y + 4.9, z, 0xeef3ff, 1.3, 11);
  return { room, items: out };
}
PLANS.vault_b3 = (Y) => fixYaw(planVaultB3(Y)); R3.vault_b3 = true;

// ======== 批次20：中央竖井（书脊井）spine_b3 / b4 / b5 ========
// 平面（每层电梯厅 x −9…9，z −92…−84，H 5.2；电梯金门在南墙 z −84 的 x ±6；北侧 z −92 通 B3 收容库气闸 / B4、B5 中门 x ±2.2）：
//   竖井洞口 x −1.8…1.8，z −89.2…−86.4（居中偏南，北侧留 2.8 m 横道通库门，东西两侧各 7 m 通电梯门）；
//   B3、B4 洞口一圈铸铁栏杆（立柱 + 花饰竖杆 + 扶手 + 踢脚）+ 黄漆地面警戒边；B5 是井底：货运电梯轿厢停靠，栏杆南侧留闸口 + 折叠钢闸门；
//   井内：四角钢立柱 + 每 2 m 横撑 + 南北两面导轨 + 4 根钢索（B3 顶曳引轮 → B5 轿厢顶）+ 东侧通长检修梯（带护笼）+ 西侧管线束；
//   层间楼板段（B3 地面以下 / B4 地面以下）四面混凝土井壁，井壁内侧刷下一层层号；每层厅内西墙层号大字、东墙管线束、井架四角防爆灯。
const SP = { x0: -1.8, x1: 1.8, z0: -89.2, z1: -86.4, zc: -87.8 };
// ================= R3 批次22 · B 层电梯厅地下化（B1–B6 共用；电梯厅 x −9…9，z −92…−84，层高 5.2） =================
//  功能平面：南墙两部电梯——西 x −6 客梯（铜门）、东 x +6 货梯（门洞内两侧收拢的折叠铁闸门 + 顶部滑轨 + 门前黄黑警示带）；两门前 1.2 m 黄线候梯线；
//  西墙：防爆壁灯 ×2（z −85.5 / −90.5）、通行须知告示框（z −85.6）、层号大字（z −88，竖井层已有）、消火栓箱（z −90.6）；
//  东墙：防爆壁灯 ×2（z −85.5 / −89.6）、成对长凳 ×2（z −85.9 / −88.1，坐东面西）、层号大字（z −87.0）、北端管线束（竖井层已有）；
//  三面墙 0–1.3 m 铆钉钢板墙裙（墙面 / 顶棚由 vault.js 换素混凝土 + 环氧地坪）；顶棚 x ±4.5 两道纵向混凝土梁（避开竖井洞口）；北门槛黄黑警示带（通收容库 / 本层主区）。
function basementHall(out, y, lv, spine) {
  const H = 5.2, B = (box, x, yy, z, w, h, d, tag, uv = 1) => out.push({ box, x, y: yy, z, w, h, d, uv, tag, on: 'partv' });
  // 铆钉钢板墙裙：西 / 东墙通长，北墙门两侧
  // 批次23：墙裙换 r3_steelRivet（贴图自带 1.3 m 一块的板缝凹槽 / 凸台 / 铆钉法线 / 锈流 / 底锈；uv 1/1.3，竖向对齐楼面）+ 底部钢踢脚 + 顶压条
  const RU = 1 / 1.3, RO = [0, -y * RU + 0.0001];
  const wain = (alongZ, c, a0, a1) => { const L = a1 - a0, m = (a0 + a1) / 2, off = c < 0 ? 0.03 : -0.03;
    if (alongZ) out.push({ box: 'r3_steelRivet', x: c, y: y + 0.65, z: m, w: 0.05, h: 1.3, d: L, uv: RU, uvOff: RO, tag: 'B 墙裙', on: 'partv' });
    else out.push({ box: 'r3_steelRivet', x: m, y: y + 0.65, z: c, w: L, h: 1.3, d: 0.05, uv: RU, uvOff: RO, tag: 'B 墙裙', on: 'partv' });
    if (alongZ) B('r3_steelOld', c + off * 1.6, y + 0.06, m, 0.05, 0.12, L, 'B 钢踢脚'); else B('r3_steelOld', m, y + 0.06, c + off * 1.6, L, 0.12, 0.05, 'B 钢踢脚');
    if (alongZ) B('r3_steelGrey', c + off * 1.3, y + 1.32, m, 0.06, 0.05, L, 'B 墙裙压条'); else B('r3_steelGrey', m, y + 1.32, c + off * 1.3, L, 0.05, 0.06, 'B 墙裙压条'); };
  wain(true, -8.97, -91.8, -84.25); wain(true, 8.97, -91.8, -84.25);
  wain(false, lv === 'B3' ? -91.97 : -91.77, -8.9, -2.75); wain(false, lv === 'B3' ? -91.97 : -91.77, 2.75, 8.9);
  // 顶棚纵梁（x ±4.5，避开竖井洞口 x ±1.8）
  for (const x of [-4.5, 4.5]) B('r3_bunkerConc', x, y + H - 0.25, -88, 0.42, 0.5, 7.5, 'B 顶棚梁', 0.5);
  // 防爆壁灯：钢灯座 + 冷白灯罩 + 黑钢护笼 + 补光
  for (const [x, z] of [[-8.95, -85.5], [-8.95, -90.5], [8.95, -85.5], [8.95, -89.6]]) { const s = Math.sign(x);
    B('r3_steelGrey', x - s * 0.08, y + 3.3, z, 0.12, 0.32, 0.22, 'B 防爆灯座'); B('dz_glowCold', x - s * 0.2, y + 3.24, z, 0.14, 0.2, 0.14, 'B 防爆灯罩');
    for (const dz of [-0.085, 0.085]) B('blackMetal', x - s * 0.2, y + 3.24, z + dz, 0.16, 0.24, 0.012, 'B 护笼');
    B('blackMetal', x - s * 0.285, y + 3.24, z, 0.012, 0.24, 0.17, 'B 护笼'); light(out, x - s * 0.7, y + 3.0, z, 0xf2ead8, 1.3, 6); }
  // 层号大字（东墙；西墙竖井层已有，非竖井层补上）
  out.push({ wtext: lv, x: 8.9, y: y + 2.6, z: -87.0, yaw: ROT.W, w: 1.6, h: 1.0, size: [1.6, 1.0, 0.05], tag: 'B 层号大字', on: 'sign' });
  if (!spine) out.push({ wtext: lv, x: -8.9, y: y + 2.6, z: -88.0, yaw: ROT.E, w: 1.8, h: 1.1, size: [1.8, 1.1, 0.05], tag: 'B 层号大字', on: 'sign' });
  // 西墙：通行须知告示框 + 消火栓箱
  out.push({ plaque: true, title: lv + ' 通 行 须 知', lines: ['凭证件进入　双人同行', '货梯限载 3000 kg', '证物转运走货梯', '黄线外候梯　禁止倚靠闸门', '', '安全保卫科'], x: -8.92, y: y + 1.85, z: -85.6, yaw: ROT.E, w: 0.8, h: 1.0, size: [0.86, 1.06, 0.04], tag: 'B 告示框', on: 'pic' });
  B('dz_pipeRed', -8.83, y + 0.88, -90.6, 0.22, 1.0, 0.7, 'B 消火栓箱'); B('dz_glassDark', -8.715, y + 0.95, -90.6, 0.01, 0.62, 0.5, 'B 消火栓箱玻璃');
  B('r3_steelGrey', -8.705, y + 0.95, -90.32, 0.02, 0.12, 0.03, 'B 消火栓箱把手');
  out.push({ sign: '消 火 栓', sub: '火警 119 · 内线 0', x: -8.93, y: y + 1.58, z: -90.6, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: 'B 消火栓牌', on: 'sign' });
  // 东墙：成对长凳（坐东面西）
  for (const z of [-85.9, -88.1]) out.push({ m: 'r2/church_pew_bench', x: 8.42, y, z, yaw: ROT.W, w: 1.5, tag: 'B 候梯长凳', on: 'floor' });
  // 南墙两部电梯：客梯 / 货梯铭牌 + 候梯黄线 + 货梯门前黄黑警示带 + 收拢折叠铁闸门 + 滑轨
  out.push({ sign: '客 梯', sub: '限乘 13 人', x: -8.25, y: y + 2.1, z: -84.23, yaw: ROT.N, size: [0.34, 0.12, 0.01], tag: 'B 电梯铭牌', on: 'sign' });
  out.push({ sign: '货 梯', sub: '限载 3000 kg · 证物转运', x: 8.25, y: y + 2.1, z: -84.23, yaw: ROT.N, size: [0.34, 0.12, 0.01], tag: 'B 电梯铭牌', on: 'sign' });
  for (const x of [-6, 6]) B('r3_paintYellow', x, y + 0.006, -85.45, 2.8, 0.012, 0.1, 'B 候梯黄线');
  B('r3_hazard', 6, y + 0.007, -84.62, 2.4, 0.014, 0.36, 'B 货梯警示带', 0.8);
  for (const s of [-1, 1]) { const xs = 6 + s * 1.12;
    for (let k = 0; k < 6; k++) B('r3_steelOld', xs - s * k * 0.03, y + 1.5, -84.42, 0.018, 3.0, 0.02, 'B 折叠闸门（收拢）');
    for (const hy of [0.3, 1.5, 2.7]) B('r3_steelOld', xs - s * 0.075, y + hy, -84.44, 0.17, 0.03, 0.025, 'B 闸门拉杆'); }
  B('r3_steelGrey', 6, y + 3.05, -84.42, 2.5, 0.08, 0.08, 'B 闸门滑轨'); B('r3_hazard', 6, y + 3.2, -84.3, 2.6, 0.18, 0.04, 'B 货梯门楣警示', 0.8);
  // 批次23 提亮：两道顶棚梁下各挂一根冷白灯管（钢灯槽 + 灯管 + 补光，避开竖井洞口）
  for (const x of [-4.5, 4.5]) { B('r3_steelGrey', x, y + H - 0.54, -88, 0.3, 0.08, 3.0, 'B 梁下灯槽'); B('dz_glowCold', x, y + H - 0.595, -88, 0.16, 0.03, 2.8, 'B 梁下灯管'); light(out, x, y + H - 0.9, -88, 0xf0eadc, 1.5, 8); }
  // 批次23：长凳对面（西墙 z −86.4…−88.0）成组陈设——疏散示意图框 + 壁挂灭火器（托架 + 红瓶 + 喷管 + 牌）+ 铁皮垃圾桶（带盖 + 拉手）
  out.push({ plaque: true, title: '疏 散 示 意 图', lines: ['您在此处　' + lv + ' 电梯厅', '↑ 北门 → 本层主区', '← 西 → 东楼梯（B 层不通）', '火警时禁乘电梯', '', '安全保卫科'], x: -8.92, y: y + 1.55, z: -87.1, yaw: ROT.E, w: 0.7, h: 0.5, size: [0.74, 0.54, 0.04], tag: 'B 疏散图', on: 'pic' });
  B('r3_steelGrey', -8.93, y + 0.95, -86.55, 0.04, 0.3, 0.12, 'B 灭火器托架');
  out.push({ cyl: true, mat: 'dz_pipeRed', x: -8.8, y: y + 0.84, z: -86.55, r: 0.085, h: 0.5, size: [0.17, 0.5, 0.17], tag: 'B 灭火器', on: 'partv' });
  B('blackMetal', -8.8, y + 1.12, -86.55, 0.06, 0.06, 0.06, 'B 灭火器阀头'); B('blackMetal', -8.74, y + 0.88, -86.47, 0.02, 0.36, 0.02, 'B 灭火器喷管');
  out.push({ sign: '灭 火 器', sub: 'MFZ/ABC4', x: -8.93, y: y + 1.32, z: -86.55, yaw: ROT.E, size: [0.26, 0.1, 0.01], tag: 'B 灭火器牌', on: 'sign' });
  out.push({ cyl: true, mat: 'r3_steelGrey', x: -8.66, y: y + 0.33, z: -87.6, r: 0.2, h: 0.66, size: [0.4, 0.66, 0.4], tag: 'B 垃圾桶', on: 'floor' });
  out.push({ cyl: true, mat: 'r3_steelOld', x: -8.66, y: y + 0.68, z: -87.6, r: 0.215, h: 0.04, size: [0.43, 0.04, 0.43], tag: 'B 垃圾桶盖', on: 'partv' });
  B('blackMetal', -8.66, y + 0.72, -87.6, 0.16, 0.03, 0.03, 'B 垃圾桶拉手');
  // 北门槛黄黑警示带
  B('r3_hazard', 0, y + 0.007, -91.55, 4.4, 0.014, 0.3, 'B 门槛警示带', 0.8);
}
export function planBLobby(y, lv) {
  const out = [];
  const room = { name: lv + ' 电梯厅 · 地下化（批次22）', x0: -9, x1: 9, z0: -92, z1: -84, y, H: 5.2,
    doors: [{ wall: 'S', a: -7.2, b: -4.8, label: '客梯' }, { wall: 'S', a: 4.8, b: 7.2, label: '货梯' }, { wall: 'N', a: -2.3, b: 2.3, label: '本层主区' }], windows: [],
    rooms: [['客梯（铜门）', -6, -85.0], ['货梯（铁闸门）', 6, -85.0], ['告示 / 消火栓', -8.3, -88.5], ['候梯长凳', 8.2, -87.0]],
    aisles: [{ label: '候梯区', x0: -7.4, x1: 7.4, z0: -86.6, z1: -84.6 }, { label: '中轴通道', x0: -2.3, x1: 2.3, z0: -91.8, z1: -84.6 }] };
  basementHall(out, y, lv, false);
  light(out, 0, y + 3.4, -88, 0xf2e6d2, 1.6, 9);
  return { room, items: out };
}
for (const [id, lv] of [['blobby_b1', 'B1'], ['blobby_b2', 'B2'], ['blobby_b6', 'B6']]) { PLANS[id] = (Y) => fixYaw(planBLobby(Y, lv)); R3[id] = true; }
function planSpine(y, lv) {
  const out = []; const H = 5.2, top = y + H, ceil = lv === 'B3' ? top : top + 0.3; // B3 顶即曳引机房楼板；B4/B5 顶板开洞，井架穿过
  const below = { B3: -34 + 5.5, B4: -42 + 5.5, B5: y }[lv]; // 本层地面下面井壁 / 井架延伸到下一层顶板上沿（B5 为井底）
  const room = { name: '书脊井 · ' + lv + ' 电梯厅 + 中央竖井（批次20）', x0: -9, x1: 9, z0: -92, z1: -84, y, H,
    doors: [{ wall: 'S', a: -7.2, b: -4.8, label: '电梯' }, { wall: 'S', a: 4.8, b: 7.2, label: '电梯' }, { wall: 'N', a: -2.3, b: 2.3, label: lv === 'B3' ? '收容库气闸' : '库门' }], windows: [],
    rooms: [['① 竖井洞口', 0, SP.zc], ['② 层号', -8.6, -88], ['③ 管线束', 8.5, -90.6], ['④ 检修梯', 1.55, SP.zc]],
    aisles: [{ label: '北横道（通库门）', x0: -8.5, x1: 8.5, z0: -91.8, z1: -89.8 }, { label: '西侧通道', x0: -8.0, x1: -2.6, z0: -91.8, z1: -84.6 }, { label: '东侧通道', x0: 2.6, x1: 7.6, z0: -91.8, z1: -84.6 }] };
  const B = (box, x, yy, z, w, h, d, tag, uv = 1) => out.push({ box, x, y: yy, z, w, h, d, uv, tag, on: 'partv' });
  const C = (x, yy, z, w, h, d, tag) => out.push({ part: true, x, y: yy, z, size: [w, h, d], tag: tag + '·碰撞', on: 'partv' });
  out.push({ fixed: true, m: lv === 'B5' ? '固定:井底轿厢+栏杆闸口' : '固定:竖井洞口+铸铁栏杆', x: 0, y, z: SP.zc, yaw: 0, size: [3.9, 1.1, 3.1], tag: '① 竖井洞口', on: 'floor' }); // 平面图占位（实际碰撞见栏杆 part）
  const y0 = lv === 'B5' ? y : below, y1 = ceil, hh = y1 - y0, ym = (y0 + y1) / 2;
  // 井架：四角立柱 + 横撑 + 南北导轨
  for (const x of [SP.x0 + 0.15, SP.x1 - 0.15]) for (const z of [SP.z0 + 0.15, SP.z1 - 0.15]) B('r3_steelOld', x, ym, z, 0.16, hh, 0.16, '① 井架立柱');
  for (let yy = Math.ceil((y0 - y) / 2) * 2 + y; yy < y1 - 0.2; yy += 2) { if (yy <= y0 + 0.1) continue;
    for (const z of [SP.z0 + 0.15, SP.z1 - 0.15]) B('r3_steelOld', 0, yy, z, 3.2, 0.1, 0.1, '① 井架横撑');
    for (const x of [SP.x0 + 0.15, SP.x1 - 0.15]) B('r3_steelOld', x, yy, SP.zc, 0.1, 0.1, 2.5, '① 井架横撑'); }
  for (const z of [SP.z0 + 0.3, SP.z1 - 0.3]) { B('r3_steelGrey', 0, ym, z, 0.12, hh, 0.06, '① 导轨'); B('r3_steelGrey', 0, ym, z + (z < SP.zc ? -0.05 : 0.05), 0.04, hh, 0.06, '① 导轨'); }
  // 钢索：B3 顶曳引轮 → B5 轿厢顶（y −42 + 2.7）
  const carTop = -42 + 2.75, cy0 = Math.max(y0, carTop), cy1 = lv === 'B3' ? top - 0.7 : y1;
  if (cy1 > cy0) for (const dx of [-0.15, -0.05, 0.05, 0.15]) B('dz_pipe', dx, (cy0 + cy1) / 2, SP.zc, 0.025, cy1 - cy0, 0.025, '① 钢索');
  if (lv === 'B3') { // 曳引轮（顶板下）+ 钢梁
    B('r3_steelOld', 0, top - 0.25, SP.zc, 3.4, 0.3, 0.3, '① 曳引机钢梁');
    for (const [w, h] of [[0.9, 0.3], [0.7, 0.62], [0.36, 0.86]]) B('r3_rackGreen', 0, top - 0.85, SP.zc, w, h, 0.22, '① 曳引轮');
    B('dz_pipe', 0, top - 0.85, SP.zc, 0.1, 0.1, 0.5, '① 曳引轮轴'); }
  // 检修梯（井内东侧，靠东面横撑）：两根梯梁 + 0.3 m 踏棍 + 每 1.2 m 一道护笼
  { const xl = SP.x1 - 0.32; for (const dz of [-0.22, 0.22]) B('r3_rackGreen', xl, ym, SP.zc + dz, 0.05, hh, 0.05, '④ 检修梯梁');
    for (let yy = y0 + 0.3; yy < y1 - 0.1; yy += 0.3) B('r3_rackGreen', xl, yy, SP.zc, 0.03, 0.03, 0.44, '④ 踏棍');
    for (let yy = y0 + 1.2; yy < y1 - 0.2; yy += 1.2) { B('r3_rackGreen', xl - 0.36, yy, SP.zc, 0.03, 0.04, 0.7, '④ 护笼'); for (const dz of [-0.35, 0.35]) B('r3_rackGreen', xl - 0.18, yy, SP.zc + dz, 0.36, 0.04, 0.03, '④ 护笼'); } }
  // 井内西侧管线束（4 根，竖向通长）
  [['r3_rackGreen', 0.16], ['r3_steelGrey', 0.12], ['r3_crateOlive', 0.1], ['dz_pipe', 0.08]].forEach(([m, w], i) => { B(m, SP.x0 + 0.38, ym, SP.zc - 0.7 + i * 0.32, w, hh, w, '③ 井内管线'); });
  // 层间井壁（本层地面以下到下一层顶板上沿）+ 井壁内侧下一层层号
  if (lv !== 'B5') { const yb = (y - 0.2 + below) / 2, hb = y - 0.2 - below;
    B('r3_bunkerConc', 0, yb, SP.z0 - 0.12, 3.84, hb, 0.24, '层间井壁', 0.5); B('r3_bunkerConc', 0, yb, SP.z1 + 0.12, 3.84, hb, 0.24, '层间井壁', 0.5);
    for (const x of [SP.x0 - 0.12, SP.x1 + 0.12]) B('r3_bunkerConc', x, yb, SP.zc, 0.24, hb, 3.04, '层间井壁', 0.5);
    out.push({ wtext: lv === 'B3' ? 'B4' : 'B5', x: 0, y: yb, z: SP.z0 + 0.06, yaw: ROT.S, w: 1.0, h: 0.62, size: [1.0, 0.62, 0.05], tag: '② 井壁层号', on: 'sign' }); }
  // 栏杆（铸铁）：B3/B4 一圈；B5 南侧闸口
  { const rx = SP.x1 + 0.14, rz0 = SP.z0 - 0.14, rz1 = SP.z1 + 0.14, gate = lv === 'B5';
    const seg = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), alongX = Math.abs(bx - ax) > 0.01, mx = (ax + bx) / 2, mz = (az + bz) / 2;
      for (const [hy, th] of [[1.05, 0.07], [0.55, 0.035]]) B('iron', mx, y + hy, mz, alongX ? L : th, th, alongX ? th : L, '⑤ 栏杆扶手');
      B('iron', mx, y + 0.08, mz, alongX ? L : 0.03, 0.15, alongX ? 0.03 : L, '⑤ 栏杆踢脚');
      const n = Math.round(L / 0.13); for (let k = 1; k < n; k++) { const t = k / n; B('iron', ax + (bx - ax) * t, y + 0.6, az + (bz - az) * t, 0.022, 0.9, 0.022, '⑤ 栏杆竖杆'); }
      const np = Math.max(1, Math.round(L / 1.3)); for (let k = 0; k <= np; k++) { const t = k / np; B('iron', ax + (bx - ax) * t, y + 0.56, az + (bz - az) * t, 0.08, 1.12, 0.08, '⑤ 栏杆立柱'); B('iron', ax + (bx - ax) * t, y + 1.14, az + (bz - az) * t, 0.11, 0.06, 0.11, '⑤ 立柱帽'); }
      C(mx, y, mz, alongX ? L : 0.1, 1.1, alongX ? 0.1 : L, '⑤ 栏杆'); };
    seg(-rx, rz0, rx, rz0); seg(-rx, rz0, -rx, rz1); seg(rx, rz0, rx, rz1);
    if (gate) { seg(-rx, rz1, -0.95, rz1); seg(0.95, rz1, rx, rz1); for (let k = 0; k < 9; k++) B('r3_steelOld', 0.95 - 0.06 - k * 0.04, y + 1.0, rz1 + 0.06, 0.02, 2.0, 0.02, '⑤ 折叠闸门（收拢）'); B('r3_steelOld', 0.75, y + 2.02, rz1 + 0.06, 0.45, 0.05, 0.05, '⑤ 闸门滑轨');
      // 井底轿厢：钢底盘 + 四角立柱 + 顶框 + 三面钢网 + 顶灯
      B('r3_steelOld', 0, y + 0.08, SP.zc, 2.8, 0.16, 2.1, '⑥ 轿厢底盘'); for (const x of [-1.35, 1.35]) for (const z of [SP.zc - 1.0, SP.zc + 1.0]) B('r3_steelOld', x, y + 1.4, z, 0.08, 2.6, 0.08, '⑥ 轿厢立柱');
      B('r3_steelOld', 0, y + 2.72, SP.zc, 2.8, 0.1, 2.1, '⑥ 轿厢顶框'); B('r3_rackGreen', 0, y + 1.4, SP.zc - 1.0, 2.62, 2.4, 0.02, '⑥ 轿厢后网');
      for (const x of [-1.35, 1.35]) B('r3_rackGreen', x, y + 1.4, SP.zc, 0.02, 2.4, 1.92, '⑥ 轿厢侧网'); B('dz_glowCold', 0, y + 2.62, SP.zc, 0.8, 0.04, 0.16, '⑥ 轿厢顶灯');
      out.push({ sign: '货 运 电 梯', sub: '限载 2000 kg · 证物转运专用', x: 0.9 + 0.25, y: y + 1.6, z: rz1 + 0.1, yaw: ROT.S, size: [0.34, 0.12, 0.01], tag: '⑥ 铭牌', on: 'sign' }); }
    else seg(-rx, rz1, rx, rz1);
    // 黄漆警戒边（地面，栏杆外 0.35 m 一圈）
    B('r3_paintYellow', 0, y + 0.006, rz0 - 0.35, 2 * rx + 0.8, 0.012, 0.12, '⑤ 警戒边'); B('r3_paintYellow', 0, y + 0.006, rz1 + 0.35, 2 * rx + 0.8, 0.012, 0.12, '⑤ 警戒边');
    for (const s of [-1, 1]) B('r3_paintYellow', s * (rx + 0.35), y + 0.006, SP.zc, 0.12, 0.012, rz1 - rz0 + 0.8, '⑤ 警戒边'); }
  // 井架四角防爆灯（本层 y+2.7，朝外）+ 井内冷光
  for (const x of [SP.x0 + 0.15, SP.x1 - 0.15]) for (const z of [SP.z0 + 0.15, SP.z1 - 0.15]) { const sx = Math.sign(x), sz = z < SP.zc ? -1 : 1;
    B('r3_steelGrey', x + sx * 0.12, y + 2.9, z + sz * 0.12, 0.14, 0.24, 0.14, '⑦ 防爆灯座'); B('dz_glowCold', x + sx * 0.16, y + 2.78, z + sz * 0.16, 0.12, 0.18, 0.12, '⑦ 防爆灯罩'); }
  for (const x of [-5.4, 5.4]) light(out, x, y + 3.6, -88.4, 0xffe2b8, 1.4, 8); // 批次20 spine_top 看图：电梯厅地面近乎全黑 → 东西两侧补暖光（未重拍）
  light(out, 0, y + 3.0, SP.zc, 0xf0eadc, 1.6, 7); light(out, 0, y + 0.6 - (lv === 'B5' ? 0 : 1.4), SP.zc, 0xe8e0d0, 0.9, 5); // 批次22：spine_r3 看图地面泛蓝 → 井内光去蓝
  // 厅内：西墙层号大字 + 东墙管线束（竖向 4 根 + 管卡）+ 层号铜牌
  out.push({ wtext: lv, x: -8.75, y: y + 2.6, z: -88, yaw: ROT.E, w: 1.8, h: 1.1, size: [1.8, 1.1, 0.05], tag: '② 层号大字', on: 'sign' });
  out.push({ sign: lv + ' · 书脊井', sub: { B3: '证物收容库 开架区 · 1–3 级', B4: '单独收容柜 · 4–6 级', B5: '深库 · 双人双锁' }[lv], x: -8.85, y: y + 1.55, z: -88, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '② 层号铜牌', on: 'sign' });
  [['r3_rackGreen', 0.18], ['r3_steelGrey', 0.12], ['r3_crateOlive', 0.1], ['dz_pipe', 0.08]].forEach(([m, w], i) => { const z = -91.5 + i * 0.3; B(m, 8.72 - w / 2, y + H / 2, z, w, H, w, '③ 管线束'); });
  for (const yy of [0.8, 2.6, 4.4]) B('blackMetal', 8.62, y + yy, -91.05, 0.06, 0.08, 1.15, '③ 管卡');
  basementHall(out, y, lv, true); // 批次22：B 层电梯厅地下化（墙裙 / 防爆灯 / 消火栓 / 告示 / 长凳 / 货梯闸门）
  return { room, items: out };
}
for (const lv of ['B3', 'B4', 'B5']) { const id = 'spine_' + lv.toLowerCase(); PLANS[id] = (Y) => fixYaw(planSpine(Y, lv)); R3[id] = true; }

// ================= R3 批次23 · 东楼梯前室走廊 east_ante（2F / 3F；东翼楼梯井列南段 x 50…56，z −54…−32） =================
//  功能平面：北端 z −54 开敞接东楼梯（到达口），西墙 z −44…−47.5 门洞进本层大房间（2F 监测指挥中心 / 3F 区域管控室），南端 z −32 封墙。
//  动线：楼梯口 → 沿走廊中轴 → 西门；中轴 x 51.0…54.6 净宽 3.6 m 不放任何落地件。
//  ① 地面：浅水磨石 + 深色石材收边（与东廊 / 电梯厅同系）；楼梯口与西门前磨损
//  ② 墙面：0–1.15 m 胡桃木墙裙 + 压线 + 踢脚，上墙方石护面到吊顶；吊顶 y+4.6 白色抹灰 + 檐口线脚，楼梯口一道过梁
//  ③ 西门：木门套 + 门楣铜牌（房间名）；门两侧墙面各一块楼层导览 / 值班告示
//  ④ 东墙（正对西门）：公告栏（木框软木板 + 告示）居中，两侧成对长凳（坐东面西，靠墙）；北端楼梯口旁消火栓箱 + 灭火器
//  ⑤ 照明：中轴乳白球吊灯 ×4（z −35.5 / −40.5 / −45.75 / −51），东墙公告栏洗墙暖光；南端墙挂局徽铜牌
function planEastAnte(y, lv) {
  const out = [], X0 = 50.15, X1 = 55.97, ZN = -54, ZS = -32.03, CH = 4.6, room2 = lv === '2F' ? '监测指挥中心' : '区域管控室';
  const room = { name: '东楼梯前室走廊 · ' + lv + '（批次23）', x0: X0, x1: X1, z0: ZN, z1: ZS, y, H: CH,
    doors: [{ wall: 'N', a: 50.2, b: 55.8, label: '东楼梯（开敞）' }, { wall: 'W', a: -47.5, b: -44, label: room2 }], windows: [],
    rooms: [['楼梯口', 53, -52.8], ['公告栏', 55.2, -45.75], ['长凳', 55.2, -42.4], ['长凳', 55.2, -49.1], ['消火栓', 55.4, -52.6]],
    aisles: [{ label: '中轴通道', x0: 51.0, x1: 54.6, z0: -53.9, z1: -32.8 }, { label: '西门口', x0: X0, x1: 54.6, z0: -47.7, z1: -43.8 }] };
  const B = (box, x, yy, z, w, h, d, tag, uv = 1) => out.push({ box, x, y: yy, z, w, h, d, uv, tag, on: 'partv' });
  // ① 地面
  floorZ(out, 'r3_corr', X0, X1, ZN, ZS, y, { border: 0.3, bmat: 'r3_stoneBorder', uv: 0.5 });
  wear(out, 51.4, 54.4, -53.6, -50.5, y); wear(out, 50.4, 52.6, -47.2, -44.3, y);
  // ② 墙面（墙裙 + 压线 + 踢脚 + 方石上墙）
  const wall = (alongZ, c, a0, a1, s, hi = CH) => { const L = a1 - a0, m = (a0 + a1) / 2;
    if (alongZ) { B('dz_wain', c + s * 0.03, y + 0.575, m, 0.06, 1.15, L, '② 墙裙', 0.6); B('dz_beam', c + s * 0.06, y + 1.17, m, 0.05, 0.05, L, '② 墙裙压线'); B('stoneDark', c + s * 0.04, y + 0.08, m, 0.08, 0.16, L, '② 踢脚');
      B('dz_ashlarEC', c + s * 0.005, y + 1.2 + (hi - 1.2) / 2, m, 0.01, hi - 1.2, L, '② 方石上墙', 1); }
    else { B('dz_wain', m, y + 0.575, c + s * 0.03, L, 1.15, 0.06, '② 墙裙', 0.6); B('dz_beam', m, y + 1.17, c + s * 0.06, L, 0.05, 0.05, '② 墙裙压线'); B('stoneDark', m, y + 0.08, c + s * 0.04, L, 0.16, 0.08, '② 踢脚');
      B('dz_ashlarEC', m, y + 1.2 + (hi - 1.2) / 2, c + s * 0.005, L, hi - 1.2, 0.01, '② 方石上墙', 1); } };
  wall(true, X0, -53.9, -47.6, 1); wall(true, X0, -43.9, ZS, 1); wall(true, X1, -53.9, ZS, -1); wall(false, ZS, X0, X1, -1);
  B('dz_ashlarEC', X0 + 0.005, y + 3.1 + (CH - 3.1) / 2, -45.75, 0.01, CH - 3.1, 3.7, '② 门头上墙');
  // 吊顶 + 檐口 + 楼梯口过梁
  B('r3_labUpper', 53.06, y + CH + 0.04, (ZN + ZS) / 2, X1 - X0, 0.08, ZS - ZN, '② 吊顶', 0.5);
  for (const [x, w] of [[X0 + 0.08, 0.16], [X1 - 0.08, 0.16]]) B('dz_beam', x, y + CH - 0.08, (ZN + ZS) / 2, w, 0.16, ZS - ZN, '② 檐口');
  B('dz_beam', 53.06, y + CH - 0.08, ZS - 0.08, X1 - X0, 0.16, 0.16, '② 檐口');
  B('dz_ashlarEC', 53.06, y + CH - 0.3, ZN + 0.15, X1 - X0, 0.6, 0.3, '② 楼梯口过梁');
  // ③ 西门：木门套 + 门楣铜牌 + 两侧告示
  for (const z of [-43.92, -47.58]) B('dz_beam', X0 + 0.05, y + 1.55, z, 0.12, 3.1, 0.16, '③ 门套');
  B('dz_beam', X0 + 0.05, y + 3.13, -45.75, 0.12, 0.16, 3.82, '③ 门套');
  out.push({ sign: room2, sub: lv + ' · 东翼', x: X0 + 0.03, y: y + 3.45, z: -45.75, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '③ 门楣铜牌', on: 'sign' });
  out.push({ plaque: true, title: lv + ' 楼 层 导 览', lines: lv === '2F' ? ['监测指挥中心　西', '阅卷中心　北（经楼梯井列）', '东楼梯　↑3F　↓1F', '', '', '办公室'] : ['区域管控室　西', '副本投放调度室　经管控室北门', '东楼梯　↓2F　↓1F', '', '', '办公室'], x: X0 + 0.04, y: y + 1.75, z: -41.6, yaw: ROT.E, w: 0.75, h: 1.0, size: [0.8, 1.05, 0.04], tag: '③ 导览', on: 'pic' });
  out.push({ plaque: true, title: '值 班 告 示', lines: ['进出须佩戴证件', '夜间值班　内线 3' + (lv === '2F' ? '2' : '3') + '0', '外来人员请在楼梯口等候', '', '', '保卫科'], x: X0 + 0.04, y: y + 1.75, z: -49.9, yaw: ROT.E, w: 0.75, h: 1.0, size: [0.8, 1.05, 0.04], tag: '③ 告示', on: 'pic' });
  // ④ 东墙：公告栏 + 成对长凳 + 消火栓 / 灭火器
  B('dz_wain2', X1 - 0.04, y + 1.85, -45.75, 0.05, 1.3, 2.6, '④ 公告栏木框'); B('dz_cork', X1 - 0.075, y + 1.85, -45.75, 0.02, 1.14, 2.44, '④ 公告栏软木');
  out.push({ plaque: true, title: '公　告', lines: ['关于加强夜间巡查的通知', '本周会商：周三 14:00', '寻物：一枚铜质证章', '', '', '办公室'], x: X1 - 0.1, y: y + 1.92, z: -45.2, yaw: ROT.W, w: 0.8, h: 0.9, size: [0.84, 0.94, 0.02], tag: '④ 告示', on: 'pic' });
  out.push({ plaque: true, title: '值 班 表', lines: ['周一　　周二', '周三　　周四', '周五　　周六', '', '', ''], x: X1 - 0.1, y: y + 1.88, z: -46.55, yaw: ROT.W, w: 0.56, h: 0.72, size: [0.6, 0.76, 0.02], tag: '④ 告示', on: 'pic' });
  for (const z of [-42.4, -49.1]) out.push({ m: 'r2/church_pew_bench', x: X1 - 0.52, y, z, yaw: ROT.W, w: 1.5, tag: '④ 长凳', on: 'floor' });
  B('dz_pipeRed', X1 - 0.11, y + 0.88, -52.6, 0.22, 1.0, 0.7, '④ 消火栓箱'); B('dz_glassDark', X1 - 0.225, y + 0.95, -52.6, 0.01, 0.62, 0.5, '④ 消火栓玻璃'); B('r3_steelGrey', X1 - 0.235, y + 0.95, -52.32, 0.02, 0.12, 0.03, '④ 消火栓把手');
  out.push({ sign: '消 火 栓', sub: '火警 119 · 内线 0', x: X1 - 0.02, y: y + 1.58, z: -52.6, yaw: ROT.W, size: [0.34, 0.12, 0.01], tag: '④ 消火栓牌', on: 'sign' });
  B('r3_steelGrey', X1 - 0.03, y + 0.95, -51.7, 0.04, 0.3, 0.12, '④ 灭火器托架');
  out.push({ cyl: true, mat: 'dz_pipeRed', x: X1 - 0.16, y: y + 0.84, z: -51.7, r: 0.085, h: 0.5, size: [0.17, 0.5, 0.17], tag: '④ 灭火器', on: 'partv' });
  B('blackMetal', X1 - 0.16, y + 1.12, -51.7, 0.06, 0.06, 0.06, '④ 灭火器阀头');
  // 批次23 拾取（run 41118118143）：zone_r3_b 后墙那块「黑门洞 + 白竖棂」实为楼梯井列开敞段（z −54…−64）的东外墙内面 x 56（panelWall 深色、无光）→ 护面 + 壁灯
  if (lv === '3F') { B('dz_wain', 55.94, y + 0.575, -59.2, 0.06, 1.15, 9.8, '⑥ 井列东墙墙裙', 0.6); B('dz_ashlarEC', 55.965, y + 1.2 + 3.0, -59.2, 0.01, 6.0, 9.8, '⑥ 井列东墙护面', 1);
    for (const z of [-56.6, -61.8]) { B('dz_brassDim', 55.9, y + 2.6, z, 0.1, 0.3, 0.16, '⑥ 铜壁灯座'); B('dz_shade', 55.78, y + 2.72, z, 0.16, 0.22, 0.2, '⑥ 壁灯罩'); light(out, 55.0, y + 2.8, z, 0xffdcb0, 2.2, 7); } }
  // ⑤ 照明 + 南端局徽铜牌
  for (const z of [-35.5, -40.5, -45.75, -51]) { globe(out, 52.8, z, y, CH, CH - 1.1); light(out, 52.8, y + CH - 1.4, z, 0xffe2b8, 1.6, 7); }
  light(out, X1 - 1.0, y + 3.2, -45.75, 0xffe6c4, 1.4, 4);
  out.push({ m: 'r2/old_radiator', x: 53.06, y, z: ZS - 0.22, yaw: ROT.N, w: 1.0, tag: '⑤ 南墙暖气片', on: 'floor' }); // 南端墙下老式铸铁暖气片
  out.push({ sign: '叙 事 管 理 局', sub: '东翼 · ' + lv, x: 53.06, y: y + 2.4, z: ZS - 0.03, yaw: ROT.N, size: [0.5, 0.16, 0.01], tag: '⑤ 局徽铜牌', on: 'sign' });
  return { room, items: out };
}
PLANS.east_ante = (Y) => fixYaw(planEastAnte(Y, '3F')); R3.east_ante = true;
PLANS.east_ante2 = (Y) => fixYaw(planEastAnte(Y, '2F')); R3.east_ante2 = true;

// ================= R3 批次23 · 屋顶停机坪 helipad_roof（机库平屋顶 x 73…99，z −87…−53，顶面 y 12.4；先做平面 + 主体） =================
//  原有（surface.js）：混凝土屋面、黄色接地圈 r 8.2…8.8 + 白圈 + 局徽、16 盏圈灯 r 9.4、东北角风向袋、石砌女儿墙 1.1 m。
//  功能平面：中心 (86, −70) 起降区 TLOF——白色 H 标识（压在局徽外圈上，H 竖笔 6 m）+ 22 m 方形 FATO 白色虚线框；
//   西南角停机位（飞行器挪离 H，黄色停机框 x 74.4…82.6，z −63.6…−54.6）；
//   西北角楼梯间出口（x 74…78.4，z −86.4…−81.6，门朝东）→ 黄色步行线到 FATO 边；东北偏西设备房（x 90…95.6，z −86.4…−82.2，百叶 + 屋顶风机）；
//   女儿墙顶加钢栏杆（立柱 2 m 一根 + 两道扶手）；探照灯 ×2（东南角 / 西侧中段，钢座 + 灯筒）。远景天际线 = exterior.js 城墙外城市体量（已有）。
function planHelipadRoof(y) {
  const out = [], X0 = 73.2, X1 = 98.8, Z0 = -86.8, Z1 = -53.2, cx = 86, cz = -70;
  const room = { name: '屋顶停机坪（批次23 · 平面 + 主体）', x0: X0, x1: X1, z0: Z0, z1: Z1, y, H: 6,
    doors: [{ wall: 'N', a: 74, b: 78.4, label: '楼梯间出口' }], windows: [],
    rooms: [['TLOF / H', cx, cz], ['停机位', 77.4, -57.2], ['楼梯间', 76.2, -84], ['设备房', 92.8, -84.3], ['探照灯', 97.2, -55], ['探照灯', 74.6, -72]],
    aisles: [{ label: '步行线', x0: 78.6, x1: 84.2, z0: -84.0, z1: -82.6 }, { label: 'FATO 东侧净空', x0: 90.0, x1: 96.0, z0: -78.0, z1: -62.0 }] };
  const B = (box, x, yy, z, w, h, d, tag, uv = 1) => out.push({ box, x, y: yy, z, w, h, d, uv, tag, on: 'partv' });
  // ① H 标识 + FATO 虚线框
  for (const dx of [-1.8, 1.8]) B('r3_stencil', cx + dx, y + 0.013, cz, 0.9, 0.01, 6.0, '① H 竖笔'); /* 批次24：局徽已移出 TLOF（surface.js），H 贴回屋面 */
  B('r3_stencil', cx, y + 0.013, cz, 2.7, 0.01, 0.9, '① H 横笔');
  for (let t = -7.5; t <= 7.5; t += 3) { for (const zz of [cz - 9, cz + 9]) B('r3_stencil', cx + t, y + 0.011, zz, 1.5, 0.008, 0.3, '① FATO 虚线');
    for (const xx of [cx - 9, cx + 9]) B('r3_stencil', xx, y + 0.011, cz + t, 0.3, 0.008, 1.5, '① FATO 虚线'); } /* 批次24 看图（heli_top）：22 m FATO 与停机框重叠 → FATO 缩 18 m、停机框缩到 6×6 m 移出 FATO */
  // ② 停机位黄框 + 步行线
  for (const [x, z, w, d] of [[77.4, -60.2, 6.0, 0.15], [77.4, -54.2, 6.0, 0.15], [74.4, -57.2, 0.15, 6.0], [80.4, -57.2, 0.15, 6.0]]) B('r3_paintYellow', x, y + 0.011, z, w, 0.008, d, '② 停机框');
  for (const z of [-84.0, -82.6]) B('r3_paintYellow', 81.4, y + 0.011, z, 5.6, 0.008, 0.12, '② 步行线');
  // ③ 楼梯间出口（混凝土小屋，门朝东）
  out.push({ fixed: true, m: '固定:楼梯间', x: 76.2, y, z: -84.0, yaw: 0, size: [4.4, 3.0, 4.8], col: [4.4, 3.0, 4.8], tag: '③ 楼梯间', on: 'floor' });
  B('r3_bunkerConc', 76.2, y + 1.5, -84.0, 4.4, 3.0, 4.8, '③ 楼梯间墙体', 0.4);
  B('r3_bunkerConc', 76.2, y + 3.08, -84.0, 4.8, 0.16, 5.2, '③ 楼梯间顶板', 0.4);
  B('r3_steelOld', 78.42, y + 1.05, -83.3, 0.06, 2.1, 1.1, '③ 钢门'); B('r3_steelGrey', 78.44, y + 1.05, -83.3, 0.04, 2.24, 1.26, '③ 门框');
  B('blackMetal', 78.47, y + 1.05, -82.85, 0.03, 0.04, 0.16, '③ 门把手'); B('r3_hazard', 78.43, y + 2.3, -83.3, 0.02, 0.16, 1.3, '③ 门楣警示', 0.8);
  out.push({ sign: '楼梯间', sub: '下至机库 · 随手关门', x: 78.44, y: y + 2.6, z: -83.3, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '③ 门牌', on: 'sign' });
  B('dz_glow', 78.5, y + 2.85, -83.3, 0.12, 0.14, 0.3, '③ 门头灯'); light(out, 79.2, y + 2.6, -83.3, 0xffe2b8, 1.4, 6);
  // ④ 设备房（百叶 + 门 + 屋顶两台风机）
  out.push({ fixed: true, m: '固定:设备房', x: 92.8, y, z: -84.3, yaw: 0, size: [5.6, 2.8, 4.2], col: [5.6, 2.8, 4.2], tag: '④ 设备房', on: 'floor' });
  B('r3_bunkerConc', 92.8, y + 1.4, -84.3, 5.6, 2.8, 4.2, '④ 设备房墙体', 0.4); B('r3_bunkerConc', 92.8, y + 2.88, -84.3, 6.0, 0.16, 4.6, '④ 设备房顶板', 0.4);
  for (let k = 0; k < 9; k++) B('r3_steelGrey', 94.2, y + 0.7 + k * 0.16, -82.17, 2.0, 0.05, 0.06, '④ 百叶');
  B('r3_steelOld', 91.2, y + 1.05, -82.17, 1.0, 2.1, 0.06, '④ 钢门');
  out.push({ sign: '设备房', sub: '高压危险 · 非请勿入', x: 91.2, y: y + 2.4, z: -82.14, yaw: ROT.S, size: [0.34, 0.12, 0.01], tag: '④ 门牌', on: 'sign' });
  for (const x of [91.4, 94.2]) { B('r3_steelGrey', x, y + 3.36, -84.3, 1.6, 0.8, 1.6, '④ 屋顶风机'); out.push({ cyl: true, mat: 'blackMetal', x, y: y + 3.78, z: -84.3, r: 0.6, h: 0.04, size: [1.2, 0.04, 1.2], tag: '④ 风机格栅', on: 'partv' }); }
  // ③b / ④b 批次24 细化：檐口泛水、雨渍、管线、百叶、门框；停机位系留环 + 轮挡（飞行器已移除，留空停机位）
  const C = (mat, x, yy, z, r, h, tag) => out.push({ cyl: true, mat, x, y: yy, z, r, h, size: [r * 2, h, r * 2], tag, on: 'partv' });
  B('r3_steelOld', 76.2, y + 2.98, -84.0, 4.86, 0.1, 5.26, '③ 檐口泛水'); B('r3_bunkerConc', 76.2, y + 2.86, -84.0, 4.6, 0.14, 5.0, '③ 檐口线脚', 0.4);
  B('r3_rainStain', 78.408, y + 2.2, -85.2, 0.004, 1.5, 2.0, '③ 东面雨渍', 1); B('r3_rainStain', 76.2, y + 2.0, -81.592, 4.2, 1.8, 0.004, '③ 南面雨渍', 1);
  for (let k = 0; k < 7; k++) B('r3_steelGrey', 76.2, y + 1.9 + k * 0.13, -81.57, 1.3, 0.04, 0.07, '③ 南面百叶'); for (const e of [-1, 1]) { B('r3_steelOld', 76.2 + e * 0.68, y + 2.3, -81.57, 0.06, 1.04, 0.06, '③ 百叶框立边'); B('r3_steelOld', 76.2, y + 2.3 + e * 0.5, -81.57, 1.42, 0.06, 0.06, '③ 百叶框横边'); }
  C('r3_steelOld', 78.32, y + 1.5, -81.7, 0.06, 3.0, '③ 落水管'); B('r3_steelOld', 78.32, y + 0.08, -81.45, 0.14, 0.06, 0.4, '③ 落水管弯头');
  B('r3_steelGrey', 76.0, y + 2.62, -81.56, 3.4, 0.05, 0.05, '③ 电线管'); B('r3_steelGrey', 74.5, y + 2.4, -81.55, 0.26, 0.34, 0.1, '③ 接线盒');
  B('r3_steelGrey', 78.43, y + 2.17, -83.3, 0.08, 0.08, 1.4, '③ 门框上槛');
  B('r3_steelOld', 92.8, y + 2.78, -84.3, 6.06, 0.1, 4.66, '④ 檐口泛水'); B('r3_bunkerConc', 92.8, y + 2.68, -84.3, 5.8, 0.12, 4.4, '④ 檐口线脚', 0.4);
  B('r3_rainStain', 92.8, y + 1.9, -82.192, 5.4, 1.7, 0.004, '④ 南面雨渍', 1); B('r3_rainStain', 95.608, y + 1.9, -84.3, 0.004, 1.7, 4.0, '④ 东面雨渍', 1);
  for (const e of [-1, 1]) { B('r3_steelGrey', 94.2 + e * 1.04, y + 1.34, -82.15, 0.06, 1.6, 0.06, '④ 百叶框立边'); B('r3_steelGrey', 94.2, y + 1.34 + e * 0.78, -82.15, 2.14, 0.06, 0.06, '④ 百叶框横边'); } /* 批次24 看图：整块框板盖住百叶 → 改四边框 */ B('r3_steelGrey', 91.2, y + 1.05, -82.15, 1.16, 2.24, 0.03, '④ 门框');
  C('r3_steelOld', 95.5, y + 1.4, -82.32, 0.06, 2.8, '④ 落水管'); C('r3_steelGrey', 90.3, y + 1.5, -82.3, 0.09, 3.0, '④ 电缆竖管');
  B('r3_steelGrey', 93.0, y + 3.0, -82.3, 5.4, 0.12, 0.12, '④ 屋面电缆槽'); B('r3_hazard', 92.6, y + 1.7, -82.16, 0.3, 0.3, 0.01, '④ 高压警示牌', 0.5);
  for (const [x, z] of [[75.9, -58.7], [78.9, -58.7], [75.9, -55.7], [78.9, -55.7]]) C('r3_steelOld', x, y + 0.02, z, 0.12, 0.04, '② 系留环');
  for (const dz of [0, 0.5]) B('r3_paintYellow', 79.6, y + 0.09, -54.9 - dz, 0.5, 0.18, 0.22, '② 轮挡（收存）');
  // ⑤ 女儿墙顶钢栏杆（女儿墙顶 y+1.1；立柱 2 m 一根 + 两道扶手）
  const rail = (alongX, c, a0, a1) => { const L = a1 - a0, m = (a0 + a1) / 2;
    for (let t = a0; t <= a1 + 0.01; t += 2) alongX ? B('r3_steelGrey', t, y + 1.4, c, 0.05, 0.6, 0.05, '⑤ 栏杆立柱') : B('r3_steelGrey', c, y + 1.4, t, 0.05, 0.6, 0.05, '⑤ 栏杆立柱');
    for (const hy of [1.45, 1.7]) alongX ? B('r3_steelGrey', m, y + hy, c, L, 0.04, 0.04, '⑤ 扶手') : B('r3_steelGrey', c, y + hy, m, 0.04, 0.04, L, '⑤ 扶手'); };
  rail(true, -53.0, 73.5, 98.5); rail(true, -87.0, 73.5, 98.5); rail(false, 73.0, -86.5, -53.5); rail(false, 99.0, -86.5, -53.5);
  // ⑥ 探照灯 ×2（钢座 + 叉架 + 灯筒 + 冷白灯面）
  for (const [x, z, yaw] of [[97.2, -55.0, -2.4], [74.6, -72.0, 1.57]]) {
    out.push({ cyl: true, mat: 'r3_steelGrey', x, y: y + 0.45, z, r: 0.22, h: 0.9, size: [0.44, 0.9, 0.44], tag: '⑥ 探照灯座', on: 'floor' });
    for (const s of [-1, 1]) out.push({ box: 'blackMetal', x: x + Math.cos(yaw) * s * 0.36, y: y + 1.15, z: z - Math.sin(yaw) * s * 0.36, w: 0.06, h: 0.5, d: 0.06, tag: '⑥ 叉架', on: 'partv' });
    out.push({ box: 'r3_steelOld', x, y: y + 1.25, z, w: 0.62, h: 0.62, d: 0.7, yaw, tag: '⑥ 灯筒', on: 'partv' });
    out.push({ box: 'dz_glowCold', x: x + Math.sin(yaw) * 0.36, y: y + 1.25, z: z + Math.cos(yaw) * 0.36, w: 0.52, h: 0.52, d: 0.02, yaw, tag: '⑥ 灯面', on: 'partv' });
    light(out, x + Math.sin(yaw) * 1.5, y + 1.4, z + Math.cos(yaw) * 1.5, 0xe8f0ff, 1.6, 10); }
  return { room, items: out };
}
PLANS.helipad_roof = (Y) => fixYaw(planHelipadRoof(Y)); R3.helipad_roof = true;

// ================= 城墙岗哨 wall_posts（批次26 R3 功能平面，check-only）=================
// 岗亭建在 surface.js（Frame 旋转到 12 号塔内侧，yaw = 334° + π），这里用岗亭**局部坐标**（x 东西 ±3.25，z：N = 后墙 −2.25 / S = 门面 +2.25）
// 列出全部室内件做穿模 / 越界 / 挡道检查与俯视图；**不进 R3 / ZONE_OF，不由 r3build 实例化**——实际摆放在 surface.js「R3 批次26」段，数字一一对应，改一处必须同步另一处。
// 功能：后墙 = 值班桌（监控屏墙 / 电话 / 登记簿 / 暖瓶 / 台灯）+ 值班椅 + 上方执勤表、挂钟；西墙 N→S = 文件柜 → 钥匙板 → 塔楼附图 → 取暖炉（+煤斗）→ 衣帽架 → 灭火器；
// 东墙 N→S = 储物柜 → 行军床 → 步枪架（空）；门面 = 中门 2.2 m + 两窗（窗下暖气片）；屋面西前角探照灯（室外，窗外可见）。动线：门 → 中轴 → 值班椅。
export function planWallPosts(y) {
  const out = []; const room = { name: '城墙岗哨 · 十二号塔（批次26 R3，局部坐标）', x0: -3.25, x1: 3.25, z0: -2.25, z1: 2.25, y, H: 4.2,
    doors: [{ wall: 'S', a: -1.1, b: 1.1, label: '岗亭门（朝内院）' }], windows: [{ wall: 'S', a: -3.1, b: -1.5 }, { wall: 'S', a: 1.5, b: 3.1 }],
    rooms: [['① 值班桌', 0, -1.8], ['② 取暖', -2.4, 0.9], ['③ 行军床', 2.8, 0.3], ['④ 枪架（空）', 3.0, 1.85]],
    aisles: [{ label: '门 → 值班椅中轴', x0: -0.9, x1: 0.9, z0: -0.6, z1: 2.25 }] };
  const F = (lab, x, z, w, d, h, on = 'floor') => out.push({ fixed: true, m: '固定:' + lab, x, y, z, yaw: 0, size: [w, h, d], tag: '岗亭', on });
  const N = (lab, x, z, w, d, h, on = 'floor') => out.push({ fixed: true, m: '新:' + lab, x, y, z, yaw: 0, size: [w, h, d], tag: '批次26', on });
  F('值班桌（监控台）', 0, -1.8, 4.5, 0.85, 0.84); F('值班椅 chair', 0.2, -0.95, 0.6, 0.6, 1.0); F('监控屏墙', 0, -2.2, 3.6, 0.04, 1.2, 'wall'); F('挂钟', -2.75, -2.2, 0.34, 0.06, 0.34, 'wall');
  F('文件柜 cabinet', -3.0, -1.95, 0.5, 0.5, 1.32); F('塔楼附图', -3.21, 0, 0.04, 1.2, 1.0, 'wall'); F('衣帽架', -3.0, 1.55, 0.5, 0.5, 1.8); F('灭火器', -3.05, 1.95, 0.25, 0.25, 0.55);
  F('暖气片（西窗下）', -2.3, 2.12, 0.9, 0.18, 0.6); F('暖气片（东窗下）', 2.3, 2.12, 0.9, 0.18, 0.6); F('守则牌', -1.25, 2.22, 0.7, 0.04, 0.95, 'wall');
  F('储物柜', 3.0, -1.6, 0.5, 0.9, 1.85); F('行军床', 2.8, 0.3, 0.8, 1.9, 0.66);
  N('取暖炉（铁桶炉 + 烟囱出屋面）', -2.55, 0.75, 0.62, 0.62, 0.9); N('煤斗', -1.85, 1.15, 0.32, 0.26, 0.28); N('钥匙板', -3.21, -1.05, 0.05, 0.52, 0.62, 'wall');
  N('执勤表', 0.2, -2.22, 1.56, 0.03, 0.56, 'wall'); N('步枪架（空）', 3.09, 1.85, 0.32, 0.8, 1.6);
  return { room, items: out };
}
PLANS.wall_posts = (Y) => planWallPosts(Y);
