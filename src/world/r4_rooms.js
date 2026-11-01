// 批次 R4-C：自由探索区室内充实（开源资源复用）——宿舍三号楼 2F 公共活动室 + 1F 大堂
// 模型：Above the Desk by Wh1tZz (github.com/Wh1tZz/above-the-desk)，Tripo 生成，经作者许可使用；gltf-transform 减面 + 1k webp + meshopt，public/assets/models/r4c/
// 平面规划（work/r4c/plan/*.png，r3plan_draw 0 错）：
//  2F 活动室（x 53.2…62，z 12…28.1，北 = −Z）：
//   ① 沙发背后（东侧，x 58.95，离沙发背 0.25 m、离东侧通道 1.4 m）沙发背桌：留声机 + 座钟 + 铜摇臂台灯 + 暖光池（听唱片角）
//   ② 北墙西段写实书柜（x 55.4，背贴北墙），与原书柜成排
//   ③ 西南角（西墙下 z 25.2，避开楼梯洞 z≥26 与海报 z 23.6）公用缝纫机台 + 木椅 + 低位暖光——1970 年代宿舍公共缝纫机
//  1F 大堂：两条候办长椅之间（x 57.55，z 16.2/16.9）新人行李箱 ×2（立放，不进排队带 z≤14.4 / 门厅通道 z 18.6…21.4）
// 剧情锚点、触发器不动；`?nor4c=1` 关闭。
export const NO_R4C = typeof location !== 'undefined' && /[?&]nor4c=1/.test(location.search);
const W = -Math.PI / 2, E = Math.PI / 2;
const light = (out, x, y, z, c, i, d) => out.push({ light: true, x, y, z, c, i, d, size: [0.2, 0.2, 0.2], tag: '灯', on: 'light' });
const X = {
  dorm2(out, y) {
    // ① 沙发背桌（长边沿 z）
    out.push({ m: 'r2/woodentable_01', x: 58.95, y, z: 20.0, yaw: W, fit: [1.5, 0.72, 0.45], tag: 'R4C 唱片角', on: 'floor', col: [0.45, 0.72, 1.5] });
    out.push({ m: 'r4c/atd_gramophone', x: 58.95, y: y + 0.72, z: 19.55, yaw: E, h: 0.5, tag: 'R4C 唱片角', on: 'desk' });
    out.push({ m: 'r4c/atd_wind_clock', x: 59.0, y: y + 0.72, z: 20.02, yaw: E, h: 0.3, tag: 'R4C 唱片角', on: 'desk' });
    out.push({ m: 'r4c/atd_desk_lamp', x: 58.98, y: y + 0.72, z: 20.5, yaw: E, h: 0.5, tag: 'R4C 唱片角', on: 'desk' });
    light(out, 58.9, y + 1.45, 20.4, 0xffcf96, 1.1, 3.2);
    // ② 北墙写实书柜
    out.push({ m: 'r4c/atd_realistic_bookcase', x: 55.4, y, z: 12.29, yaw: 0, h: 1.9, tag: 'R4C 书架', on: 'floor', col: [1.4, 1.9, 0.52] });
    light(out, 55.4, y + 2.5, 13.3, 0xffd8a8, 0.8, 3.5);
    // ③ 缝纫机台（背贴西墙，人面朝西）
    out.push({ m: 'r2/woodentable_01', x: 53.5, y, z: 25.2, yaw: E, fit: [1.0, 0.74, 0.55], tag: 'R4C 缝纫角', on: 'floor', col: [0.55, 0.74, 1.0] });
    out.push({ m: 'r4c/atd_sewing_machine', x: 53.5, y: y + 0.74, z: 25.2, yaw: E, w: 0.55, tag: 'R4C 缝纫角', on: 'desk' });
    out.push({ m: 'r2/dining_chair_02', x: 54.25, y, z: 25.2, yaw: W, h: 0.95, tag: 'R4C 缝纫角', on: 'floor' });
    light(out, 53.95, y + 1.6, 25.2, 0xffcf96, 1.0, 3.2);
  },
  dorm(out, y) {
    out.push({ m: 'r4c/atd_suitcase', x: 57.55, y, z: 16.2, yaw: W, w: 0.6, tag: 'R4C 新人行李', on: 'floor' });
    out.push({ m: 'r4c/atd_suitcase', x: 57.55, y, z: 16.95, yaw: W + 0.12, w: 0.52, tag: 'R4C 新人行李', on: 'floor' });
  },
};
export function applyR4C(PLANS, fixYaw) {
  if (NO_R4C) return;
  for (const [id, f] of Object.entries(X)) { const base = PLANS[id]; if (!base) continue; PLANS[id] = (Y) => { const p = base(Y); const n0 = p.items.length; f(p.items, Y, p.room); fixYaw({ items: p.items.slice(n0) }); return p; }; }
}
