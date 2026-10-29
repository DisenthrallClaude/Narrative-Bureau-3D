// R3 平面功能规划（纯数据，无 THREE 依赖：游戏与 tools/r3plan_dump.mjs 共用）
// 约定：所有入选模型的「正面/使用侧」= 模型 +Z（已用 work/r3/orient_sheet_*.png 逐个核对）。
// yaw 按 three.js 绕 Y 轴：+Z → (sin yaw, cos yaw)。桌子的使用侧 = 人坐的一侧；椅子正面 = 人脸朝向。
// 每个条目：{ m: 模型路径(相对 assets/models), x, y, z, yaw, h|w|d: 目标尺寸, tag: 功能分组, on: 'floor'|'desk'|'wall'|'ceil', col: [w,h,d] 碰撞盒 }
// 每个区的「平面规划说明」同时写进 docs/HANDOFF.md「R3 每区布局说明」。

export const R3 = { floor3_office: true, floor2_liaison: true, floor2_pub: true, director: true };

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
    box('dz_wain', m, L, y + 0.56, 0.88, PT);
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
  out.push({ m: 'r2/woodenchair_01', x: -19.55, y, z: -94.75, yaw: ROT.E, h: 0.95, tag: '茶水间', on: 'floor' });
  out.push({ m: 'r2/woodenchair_01', x: -17.65, y, z: -94.95, yaw: ROT.W + 0.2, h: 0.95, tag: '茶水间', on: 'floor' });
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
  out.push({ win: true, x: X0 + 0.3, y: y + 2.0, z: -105, look: [X0 + 6, y + 0.8, -105], w: 0.6, h: 22, c: 0xc0d0ff, i: 1.6, size: [0.1, 0.1, 22], tag: '窗光', on: 'light' });
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
  out.push({ win: true, x: 27.5, y: y + 2.2, z: -105, look: [21, y + 0.8, -105], w: 0.6, h: 22, c: 0xc0d0ff, i: 1.4, size: [0.1, 0.1, 22], tag: '窗光', on: 'light' });
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
  // 前厅签到台（面向发布厅门）+ 绿植
  out.push({ m: 'r2/conference_table_rectangular_6m', x: -14.5, y, z: -101.0, yaw: 0, fit: [2.4, 0.76, 0.7], tag: '前厅', on: 'floor', col: [2.4, 0.76, 0.7] });
  for (const dx of [-0.6, 0.6]) out.push({ m: 'r2/dining_chair_02', x: -14.5 + dx, y, z: -101.0 + 0.62, yaw: Math.PI, h: 0.98, tag: '前厅', on: 'floor' });
  for (const [dx, m, w] of [[-0.8, 'r2/document_letter_tray_documents_organizer', 0.3], [0.1, 'r2/several_folders', 0], [0.75, 'r2/desk_bell', 0.1]]) out.push({ m, x: -14.5 + dx, y: y + 0.76, z: -101.0, yaw: 0, ...(w ? { w } : { h: 0.3 }), tag: '前厅', on: 'desk' });
  for (const x of [-20.4, -8.6]) out.push({ m: 'r2/free_pothos_potted_plant_money_plant', x, y, z: -100.4, yaw: 0, h: 0.7, tag: '前厅', on: 'floor' });
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
  out.push({ win: true, x: X0 + 0.3, y: y + 2.2, z: -105, look: [X0 + 6, y + 0.8, -105], w: 0.6, h: 22, c: 0xc0d0ff, i: 1.4, size: [0.1, 0.1, 22], tag: '窗光', on: 'light' });
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
  return { room, items: out };
}

export const PLANS = { floor3_office: (Y) => planFloor3Office(Y), floor2_liaison: (Y) => planFloor2Liaison(Y), floor2_pub: (Y) => planFloor2Pub(Y), director: (Y) => planDirector(Y) };
