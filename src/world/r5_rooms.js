// 批次 R5-E：宿舍三号楼禁蓝清零 + 大堂行李箱真实尺度 + 2F 207 室（自由探索区最空的宿舍单间）按平面规划充实
// 模型：Above the Desk by Wh1tZz (github.com/Wh1tZz/above-the-desk)，Tripo 生成，经作者许可使用；models/r5e/（kneehole 写字台、桌面文具座）+ 复用 models/r4c/ 与 r2/ 库存家具
// 禁蓝：1F 大堂两块深蓝红边地毯（门垫 r3plan + 大地毯 surface.js）、2F 活动室深蓝地毯、207 深蓝地毯 → dz_rugGreen（批次57 起即酒红褐底 + 暗褐边 + 驼色纹）；
//       2F 活动室 3 只青蓝漆 book_cabinet_vintage → 胡桃色（r3build.js 只换偏蓝/偏青像素，木框不动）
// 207 平面规划（work/r5e/plan/，r3plan_draw 0 错；房间 x 65.1…78.7，z 20.1…29.3，北 = −Z，门在西墙 z 25.25…26.35）：
//   ① 北墙西段（衣柜 x≤65.75 与东侧双层床 x≥74.5 之间）：室友 kneehole 写字台 + 文具座 + 摇臂台灯 + 木椅（成组背贴北墙）
//   ② 北墙中段：写实书柜（与写字台成排，留 0.9 m 间隙）
//   ③ 房间北半部：方茶桌 + 两把椅（东西对坐）+ 暖瓶两杯，地毯随之北移到桌下；门 → 窗 / 南墙书桌通道 z 24.4…27.8 留空
//   ④ 东南角：靠南墙小木桌 + 座钟；东墙窗南侧两只立放行李箱（新人刚搬来，靠墙成组）
// `?nor5e=1` 关闭。
import { NO_R13 } from './r13_fix.js'; // 批次 R13
export const NO_R5E = typeof location !== 'undefined' && /[?&]nor5e=1/.test(location.search);
const W = -Math.PI / 2, E = Math.PI / 2, S = Math.PI;
const light = (out, x, y, z, c, i, d) => out.push({ light: true, x, y, z, c, i, d, size: [0.2, 0.2, 0.2], tag: '灯', on: 'light' });
const deBlueRug = (items) => { for (const it of items) if (it.box === 'dz_rugNavy') it.box = 'dz_rugGreen'; };
const X = {
  dorm(out) {
    deBlueRug(out);
    // 行李箱：R4-C 两只 0.6/0.52 m 太小 → 真实尺度（硬壳箱 0.75×0.51×0.32 / 0.65×0.44×0.28），立放在两条候办长椅之间的 0.7 m 空当里成组
    for (let k = out.length - 1; k >= 0; k--) if (out[k].tag === 'R4C 新人行李') out.splice(k, 1);
    out.push({ m: 'r4c/atd_suitcase', x: 57.385, y: out.Y, z: 16.5, yaw: E, w: 0.75, tag: 'R5E 新人行李', on: 'floor', col: [0.32, 0.51, 0.75] });
    out.push({ m: 'r4c/atd_suitcase', x: 57.745, y: out.Y, z: 16.58, yaw: E + 0.06, w: 0.65, tag: 'R5E 新人行李', on: 'floor', col: [0.28, 0.44, 0.65] });
  },
  dorm2(out) {
    deBlueRug(out);
    const y = out.Y;
    // ① 207 北墙西段：室友写字台组
    out.push({ m: 'r5e/atd_lower_cabinet', x: 68.0, y, z: 20.36, yaw: 0, w: 1.0, tag: 'R5E 207 写字台', on: 'floor', col: [1.0, 0.77, 0.47] });
    out.push({ m: 'r5e/atd_writing_station', x: 67.82, y: y + 0.768, z: 20.38, yaw: 0, w: 0.5, tag: 'R5E 207 写字台', on: 'desk' });
    out.push({ m: 'r4c/atd_desk_lamp', x: 68.33, y: y + 0.768, z: 20.32, yaw: 0.3, h: 0.45, tag: 'R5E 207 写字台', on: 'desk' });
    out.push({ m: 'r2/dining_chair_02', x: 68.0, y, z: 21.0, yaw: S, h: 0.95, tag: 'R5E 207 写字台', on: 'floor' });
    light(out, 68.2, y + 1.45, 20.7, 0xffcf96, 0.9, 3.0);
    // ② 北墙中段：写实书柜
    out.push({ m: 'r4c/atd_realistic_bookcase', x: 69.95, y, z: 20.39, yaw: 0, h: 1.9, tag: 'R5E 207 书柜', on: 'floor', col: [1.41, 1.9, 0.53] });
    // ③ 茶桌组
    out.push({ m: 'r2/woodentable_01', x: 71.5, y, z: 23.3, yaw: 0, fit: [0.95, 0.76, 0.8], tag: 'R5E 207 茶桌', on: 'floor', col: [0.95, 0.76, 0.8] });
    out.push({ m: 'r2/dining_chair_02', x: 70.7, y, z: 23.3, yaw: E, h: 0.95, tag: 'R5E 207 茶桌', on: 'floor' });
    out.push({ m: 'r2/dining_chair_02', x: 72.3, y, z: 23.36, yaw: W + 0.08, h: 0.95, tag: 'R5E 207 茶桌', on: 'floor' });
    out.push({ m: 'r2/modified_thermos', x: 71.3, y: y + 0.76, z: 23.15, yaw: 0.4, h: 0.32, tag: 'R5E 207 茶桌', on: 'desk' });
    for (const [dx, dz] of [[0.2, 0.15], [-0.05, 0.3]]) out.push({ m: 'r2/coffee_mug', x: 71.5 + dx, y: y + 0.76, z: 23.3 + dz, yaw: dx * 9, h: 0.095, tag: 'R5E 207 茶桌', on: 'desk' });
    // ④ 东南角：靠南墙小木桌 + 座钟；窗南侧立放行李箱 ×2
    out.push({ m: 'r2/woodentable_01', x: 75.6, y, z: 29.02, yaw: 0, fit: [1.0, 0.74, 0.5], tag: 'R5E 207 小桌', on: 'floor', col: [1.0, 0.74, 0.5] });
    out.push({ m: 'r4c/atd_wind_clock', x: 75.35, y: y + 0.74, z: 29.05, yaw: S, h: 0.32, tag: 'R5E 207 小桌', on: 'desk' });
    out.push({ m: 'r4c/atd_suitcase', x: 78.5, y, z: 27.6, yaw: W, w: 0.72, tag: 'R5E 207 行李', on: 'floor', col: [0.31, 0.49, 0.72] });
    out.push({ m: 'r4c/atd_suitcase', x: 78.52, y, z: 28.42, yaw: W - 0.05, w: 0.62, tag: 'R5E 207 行李', on: 'floor', col: [0.27, 0.42, 0.62] });
    light(out, 75.6, y + 1.5, 28.6, 0xffcf96, 0.7, 3.0);
    if (!NO_R13) r13Dorm207(out, y);
  },
};
export function applyR5E(PLANS, fixYaw) {
  if (NO_R5E) return;
  for (const [id, f] of Object.entries(X)) { const base = PLANS[id]; if (!base) continue; PLANS[id] = (Y) => { const p = base(Y); const old = new Set(p.items); p.items.Y = Y; f(p.items); delete p.items.Y; fixYaw({ items: p.items.filter((it) => !old.has(it)) }); return p; }; }
}

// 批次 R13：207 南半补一组成套家具（新人自己的写字台组）+ 东墙行李箱真实尺度（`?nor13=1` 回 R5-E）
// 南墙（z 29.3）由西向东成排背贴：西墙脸盆架 | 小书架 x 67.8…69.0 | 写实书柜 x 69.45…70.86（新）| 原书桌带椅 x 71.3…72.7 |
// kneehole 写字台 x 73.45…74.45（新，配文具座 + 摇臂台灯 + 木椅）| 小木桌 x 75.1…76.1 | 东墙行李箱。各件间留 0.45–0.75 m，
// 进深 ≤ 0.53 m（前沿 z ≥ 28.5，椅 z 28.42），门 → 窗通道 z 24.4…27.8 不占。与北墙室友组同款模型，镜像朝北。
function r13Dorm207(out, y) {
  out.push({ m: 'r4c/atd_realistic_bookcase', x: 70.155, y, z: 29.025, yaw: S, h: 1.9, tag: 'R13 207 南墙书柜', on: 'floor', col: [1.41, 1.9, 0.53] });
  out.push({ m: 'r5e/atd_lower_cabinet', x: 73.95, y, z: 29.06, yaw: S, w: 1.0, tag: 'R13 207 南墙写字台', on: 'floor', col: [1.0, 0.77, 0.47] });
  out.push({ m: 'r5e/atd_writing_station', x: 74.13, y: y + 0.768, z: 29.04, yaw: S, w: 0.5, tag: 'R13 207 南墙写字台', on: 'desk' });
  out.push({ m: 'r4c/atd_desk_lamp', x: 73.62, y: y + 0.768, z: 29.1, yaw: S + 0.3, h: 0.45, tag: 'R13 207 南墙写字台', on: 'desk' });
  out.push({ m: 'r2/dining_chair_02', x: 73.95, y, z: 28.42, yaw: 0, h: 0.95, tag: 'R13 207 南墙写字台', on: 'floor' });
  light(out, 73.8, y + 1.45, 28.7, 0xffcf96, 0.8, 3.0);
  // 行李箱：R5-E 两只按 w 缩放（模型 x 向含提手/包角，箱体读着偏小）→ 按真实硬壳箱 fit：0.74×0.50×0.27 / 0.68×0.46×0.25（长×高含提手×厚，箱体≈0.7×0.45×0.25），仍立放靠东墙
  for (const it of out) if (it.tag === 'R5E 207 行李') { const big = it.z < 28; it.tag = 'R13 207 行李'; delete it.w; it.fit = big ? [0.74, 0.5, 0.27] : [0.68, 0.46, 0.25]; it.col = big ? [0.27, 0.5, 0.74] : [0.25, 0.46, 0.68]; it.x = big ? 78.53 : 78.55; }
}
