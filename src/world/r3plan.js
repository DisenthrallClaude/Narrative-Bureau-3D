// R3 平面功能规划（纯数据，无 THREE 依赖：游戏与 tools/r3plan_dump.mjs 共用）
// 约定：所有入选模型的「正面/使用侧」= 模型 +Z（已用 work/r3/orient_sheet_*.png 逐个核对）。
// yaw 按 three.js 绕 Y 轴：+Z → (sin yaw, cos yaw)。桌子的使用侧 = 人坐的一侧；椅子正面 = 人脸朝向。
// 每个条目：{ m: 模型路径(相对 assets/models), x, y, z, yaw, h|w|d: 目标尺寸, tag: 功能分组, on: 'floor'|'desk'|'wall'|'ceil', col: [w,h,d] 碰撞盒 }
// 每个区的「平面规划说明」同时写进 docs/HANDOFF.md「R3 每区布局说明」。

export const R3 = { floor3_office: true, floor2_liaison: true, floor2_pub: true, director: true, gate: true, archive: true, command_center: true, canteen: true, b1: true, b2: true, archive_b1: true, b4: true, b5: true, b6: true, b7: true };

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
function globe(out, x, z, y, H, drop = 3.0, o = {}) { out.push({ globe: true, x, y: y + drop, z, top: y + H, r: o.r ?? 0.2, cold: !!o.cold, size: [0.4, 0.4, 0.4], tag: '吊灯', on: 'light' }); }
/** 吸顶灯槽（乳白灯罩 + 铜边），用于小间/走廊 */
function troffer(out, x, z, y, H, yaw = 0, len = 1.2, o = {}) { out.push({ troffer: true, x, y: y + H - 0.04, z, yaw, len, cold: !!o.cold, size: [len, 0.06, 0.32], tag: '灯具', on: 'light' }); }
/** 窗光：体积光柱（从窗口斜射到地面）+ 无投影聚光在地面打亮斑。n = 窗外法线方向（指向室内） */
function winShaft(out, x, y, z, nx, nz, o = {}) { out.push({ shaft: true, x, y, z, nx, nz, w: o.w ?? 1.5, len: o.len ?? 7, spot: o.spot ?? true, i: o.i ?? 1, size: [0.1, 0.1, 0.1], tag: '窗光', on: 'light' }); }

/** 长条展示柜：木柜身 + 玻璃罩 + 内陈文件（L 沿 yaw 的 x 轴） */
function vitrine(out, x, z, y, L, yaw, tag = '展示柜') {
  out.push({ fixed: true, m: '固定:' + tag, x, y, z, yaw, size: [L, 1.05, 0.62], col: [L, 1.05, 0.62], tag, on: 'floor' });
  out.push({ box: 'dz_wain', x, y: y + 0.41, z, w: L, h: 0.82, d: 0.6, yaw, tag, on: 'partv' });
  out.push({ box: 'dz_wain2', x, y: y + 0.83, z, w: L + 0.04, h: 0.03, d: 0.64, yaw, tag, on: 'partv' });
  out.push({ box: 'r3_mapPaper', x, y: y + 0.851, z, w: L - 0.1, h: 0.004, d: 0.5, yaw, tag, on: 'partv' });
  out.push({ box: 'r3_glassCase', x, y: y + 0.96, z, w: L - 0.02, h: 0.22, d: 0.58, yaw, tag, on: 'partv' });
  for (const k of [-1, 1]) { const [px, pz] = at([x, z], yaw, k * (L / 2 - 0.01), 0); out.push({ box: 'dz_brassDim', x: px, y: y + 0.96, z: pz, w: 0.02, h: 0.24, d: 0.6, yaw, tag, on: 'partv' }); }
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
  out.push({ win: true, x: X0 + 0.3, y: y + 2.0, z: -105, look: [X0 + 6, y + 0.8, -105], w: 0.6, h: 22, c: 0xc0d0ff, i: 1.6, size: [0.1, 0.1, 22], tag: '窗光', on: 'light' });
  // —— 批次3：地面分区（走廊水磨石 + 石材收边 / 开敞区与处室地毯 / 茶水间地砖 / 档案区地胶 / 打字室拼花）+ 磨损 ——
  floorZ(out, 'r3_check', X0, -15.4, -98.6, -96.5, y, { uv: 0.21, border: 0.14 });
  floorZ(out, 'r3_check', -15.4, X1, -101.4, -96.5, y, { uv: 0.21, border: 0.14 });
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
  out.push({ win: true, x: 27.5, y: y + 2.2, z: -105, look: [21, y + 0.8, -105], w: 0.6, h: 22, c: 0xc0d0ff, i: 1.4, size: [0.1, 0.1, 22], tag: '窗光', on: 'light' });
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
  floorZ(out, 'r3_check', 0.32, 27.85, -97.5, -92.2, y, { uv: 0.21, border: 0.16 });
  floorZ(out, 'r3_check', 14.6, 20.6, -111.2, -97.5, y, { uv: 0.21, border: 0.16 });
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
  out.push({ m: 'r2/44_pocket_rotating_newspaper_stand', x: -8.7, y, z: -101.2, yaw: 0.3, h: 1.6, tag: '记者等候', on: 'floor' });
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
  out.push({ win: true, x: X0 + 0.3, y: y + 2.2, z: -105, look: [X0 + 6, y + 0.8, -105], w: 0.6, h: 22, c: 0xc0d0ff, i: 1.4, size: [0.1, 0.1, 22], tag: '窗光', on: 'light' });
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
  floorZ(out, 'r3_check', X0, X1, -99.6, -97.0, y, { uv: 0.21, border: 0.14 });
  floorZ(out, 'r3_check', -8.0, X1, -97.0, Z1, y, { uv: 0.21, border: 0.14 });
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
  floorZ(out, 'r3_check', -3.0, 1.2, -102.6, -92.9, y, { uv: 0.21, border: 0.12 });
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
  floorZ(out, 'r3_check', -27.4, -20.15, -56.4, -46.6, y, { uv: 0.21, border: 0.14 });
  out.push({ m: 'r2/woodentable_01', x: -23.2, y, z: -47.6, yaw: Math.PI, fit: [2.2, 0.82, 0.8], tag: '还档分拣台', on: 'floor', col: [2.2, 0.82, 0.8] });
  for (const [dx, m, sz] of [[-0.7, 'r2/wooden_flat_filing_tray', { w: 0.34 }], [0.0, 'r2/several_folders', { h: 0.3 }], [0.7, 'r2/desk_bell', { w: 0.1 }]]) out.push({ m, x: -23.2 + dx, y: y + 0.82, z: -47.65, yaw: Math.PI, ...sz, tag: '还档分拣台', on: 'desk' });
  out.push({ sign: '还档处', sub: '请勿直接放回架上', x: -23.2, y: y + 1.25, z: -47.2 - 0.01, yaw: 0, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  out.push({ m: 'r2/fire_extinguisher', x: -20.45, y, z: -46.9, yaw: ROT.W, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/fire_extinguisher', x: -20.45, y, z: -56.1, yaw: ROT.W, h: 0.58, tag: 'K3', on: 'floor' });
  out.push({ m: 'r2/exit_sign', x: -20.1, y: y + 5.5, z: -51.5, yaw: ROT.W, w: 0.36, tag: 'K3', on: 'wall' });
  globe(out, -23.8, -51.5, y, TOP - y, 3.4, { r: 0.22 });
  // ③ 西南（近南墙）：历届叙事事件陈列柜 ×2 + 卡片目录柜（西墙一排）+ 地球仪
  vitrine(out, -51.4, -38.2, y, 4.0, 0, '叙事事件陈列'); vitrine(out, -51.4, -42.2, y, 4.0, 0, '叙事事件陈列');
  for (let k = 0; k < 8; k++) out.push({ m: 'drawer_cabinet', x: -55.45, y, z: -36.2 - k * 0.9, yaw: ROT.E, h: 1.4, tag: '卡片目录', on: 'floor', col: [0.85, 1.4, 0.36] });
  out.push({ sign: '卡片目录', sub: '按姓氏笔画 · 按入局年份', x: -55.24, y: y + 1.7, z: -39.3, yaw: ROT.E, size: [0.34, 0.12, 0.01], tag: '门牌', on: 'sign' });
  out.push({ m: 'r2/antique_globe', x: -48.4, y, z: -45.2, yaw: 0.6, h: 1.0, tag: '陈列', on: 'floor' });
  globe(out, -51.4, -40.2, y, TOP - y, 3.4, { r: 0.2 });
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
  out.push({ m: 'r2/woodentable_01', x: 47.2, y: yp, z: -60.45, yaw: 0, fit: [2.6, 0.76, 0.8], tag: '通讯室', on: 'floor', col: [2.6, 0.76, 0.8] });
  for (const [dx, m, sz] of [[-0.85, 'r2/ww2_german_field_telephone_equipment', { w: 0.6 }], [0.1, 'r2/vintage_radio_transceiver', { w: 0.6 }], [0.95, 'r2/vintage_radio_model_95t5', { h: 0.3 }]]) out.push({ m, x: 47.2 + dx, y: yp + 0.76, z: -60.5, yaw: 0, ...sz, tag: '通讯室', on: 'desk' });
  for (const dx of [-0.7, 0.6]) out.push({ m: 'r2/old_computer_chair', x: 47.2 + dx, y: yp, z: -59.55, yaw: Math.PI + dx * 0.2, h: 0.92, tag: '通讯室', on: 'floor' });
  cabRow(out, 49.6, -57.4, yp, 3, ROT.W, '通讯室', 0.52, false); for (const it of out.slice(-3)) { it.x = 49.62; it.z = -57.3 - it.i * 0.52; }
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
  out.push({ m: 'r2/fire_extinguisher', x: -12.3, y, z: -119.0, yaw: ROT.E, h: 0.58, tag: 'K3', on: 'floor' });
  // ③ 阀门站（东南）：竖管 + 阀门手轮 + 压力表；顶部主管线沿 z
  for (const [x, r, mat] of [[-4.2, 0.1, 'dz_pipe'], [-5.0, 0.08, 'dz_pipeRed'], [-5.7, 0.08, 'dz_pipe']]) { out.push({ box: mat, x, y: y + H / 2, z: Z0 + 0.25, w: r * 2, h: H, d: r * 2, tag: '阀门站', on: 'partv' }); out.push({ m: 'r2/valve_wheel_3d_scan', x, y: y + 1.35, z: Z0 + 0.25 + r + 0.06, yaw: 0, h: 0.34, tag: '阀门站', on: 'wall' }); out.push({ m: 'r2/pressure_gauge', x, y: y + 1.75, z: Z0 + 0.25 + r + 0.04, yaw: 0, h: 0.16, tag: '阀门站', on: 'wall' }); }
  for (const [c, mat, r] of [[-3.0, 'dz_pipe', 0.12], [-3.4, 'dz_pipeRed', 0.09], [-11.9, 'dz_pipe', 0.1]]) pipe(out, mat, 'z', Z0 + 0.2, Z1 - 0.2, c, y + H - 0.35, r);
  pipe(out, 'dz_pipe', 'x', X0 + 0.2, X1 - 0.2, Z0 + 0.6, y + H - 0.55, 0.1);
  out.push({ m: 'r2/power_box_01', x: -2.75, y: y + 1.2, z: -119.0, yaw: ROT.W, h: 0.6, tag: '阀门站', on: 'wall' });
  // ④ 照明 + 设备带：吸顶灯槽、监控、工具箱
  for (const z of [-112.6, -117.2, -121.8]) troffer(out, -7.5, z, y, H, Math.PI / 2, 1.2, { cold: true });
  light(out, -7.5, y + 3.2, -114.0, 0xdfe8ff, 2.4, 7); light(out, -7.5, y + 3.2, -121.0, 0xdfe8ff, 2.2, 7);
  out.push({ m: 'r2/metal_toolbox', x: -7.0, y, z: -123.8, yaw: 0.4, w: 0.5, tag: '工具', on: 'floor' });
  out.push({ m: 'r2/cctv_camera', x: -2.7, y: y + 3.6, z: -110.4, yaw: -Math.PI * 0.75, h: 0.3, tag: 'K3', on: 'wall' });
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
  light(out, -9.6, y + 2.2, -57.0, 0xffb070, 2.2, 7); light(out, 10.0, y + 2.4, -58.6, 0xff8a50, 1.8, 7);
  return { room, items: out };
}

// 批次3：Blender 接触表（work/r3/orient4/sheet_*.jpg）核对出「正面不是 +Z」的模型 → 额外 yaw 修正（正面 +X → −π/2）
export const YAWFIX = { 'r2/bookshelf': -Math.PI / 2, 'r2/dusty_bookshelfs': -Math.PI / 2, 'r2/electric_meters_and_panels_1': -Math.PI / 2, 'r2/ergonomic_mesh_office_chair': -Math.PI / 2, 'r2/hallway_bench': -Math.PI / 2, 'r2/heavy_metal_door': -Math.PI / 2, 'r2/microfiche_reader': -Math.PI / 2, 'r2/retro_computer': -Math.PI / 2, 'r2/wooden_display_shelves_01': -Math.PI / 2 };
const fixYaw = (p) => { for (const it of p.items) if (it.m && YAWFIX[it.m] !== undefined && !it.fixed) { it.yaw = (it.yaw ?? 0) + YAWFIX[it.m]; it.yawFixed = YAWFIX[it.m]; } return p; };
export const PLANS = { floor3_office: (Y) => fixYaw(planFloor3Office(Y)), floor2_liaison: (Y) => fixYaw(planFloor2Liaison(Y)), floor2_pub: (Y) => fixYaw(planFloor2Pub(Y)), director: (Y) => fixYaw(planDirector(Y)), gate: (Y) => fixYaw(planGate(Y)), archive: (Y) => fixYaw(planArchive(Y)), command_center: (Y) => fixYaw(planCommand(Y)), canteen: (Y) => fixYaw(planCanteen(Y)), b1: (Y) => fixYaw(planB1(Y)), b2: (Y) => fixYaw(planB2(Y)), archive_b1: (Y) => fixYaw(planArchiveB1(Y)), b4: (Y) => fixYaw(planB4(Y)), b5: (Y) => fixYaw(planB5(Y)), b6: (Y) => fixYaw(planB6(Y)), b7: (Y) => fixYaw(planB7(Y)) };
