// 局内网终端点位（纯数据，无 THREE 依赖：游戏与 tools/intranet_check.mjs 共用）
// 约定同 r3plan.js：yaw 绕 Y，模型正面 = +Z；桌子 yaw = 使用侧朝向；本地 (lx, lz) → 世界 (x + lx·cos + lz·sin, z − lx·sin + lz·cos)。
// 三类：
//   desk   —— 在已有 R3 桌面上加一台 CRT 终端 + 键盘（桌面空位经 tools/intranet_check.mjs 核对：与桌面小件 0 重叠、落在台面上）
//   table  —— 新加一张小桌接在已有桌子旁（L 形转角），再放 CRT + 键盘（落地件进 r3plan_draw 检查：穿模/越界/占道 0）
//   model  —— 场景里已有的显示器模型（宣传处运营组、机要室密电终端、B2 监看台、B5 值守台），只贴屏 + 挂交互
//   console—— 指挥中心阶梯席位的程序化三联屏（eastwing.js），中屏叠一层局内网画面
export const CRT = 'r2/crt_computer_monitor', KBD = 'keyboard', TABLE = 'r2/small_wooden_table_01';
export const CRT_H = 0.4;
const rot = (yaw, lx, lz) => [lx * Math.cos(yaw) + lz * Math.sin(yaw), -lx * Math.sin(yaw) + lz * Math.cos(yaw)];

// y 一律是「该区规划的楼面 Y」的相对值（运行时 + 楼面）；plan = r3plan.js 的规划 id（检查用）
export const STATIONS = [
  { id: 'legal', kind: 'desk', plan: 'floor3_office', zone: 'floor3', floor: '3F', page: 'legal', label: '法务处 · 政策研究室', term: '3F-FW-07',
    desk: { x: -18.04, z: -105.75, yaw: 0, D: 0.914, top: 0.76 }, lx: -0.15 },
  { id: 'liaison', kind: 'desk', plan: 'floor2_liaison', zone: 'floor2', floor: '2F', page: 'liaison', label: '国际联络处 · 翻译电报组', term: '2F-LL-03',
    desk: { x: 6.2, z: -107.34, yaw: 0, D: 0.914, top: 0.76 }, lx: -0.2 },
  { id: 'medical', kind: 'desk', plan: 'medical', zone: 'floor3', floor: '3F', page: 'medical', label: '医务 · 诊室', term: '3F-YW-02',
    desk: { x: 7.6, z: -107.6, yaw: Math.PI / 2, D: 0.914, top: 0.76 }, lx: -0.2 },
  { id: 'archive', kind: 'desk', plan: 'archive', zone: 'archive', floor: '1F', page: 'archive', label: '人事档案馆 · 还档分拣台', term: '1F-DA-01',
    desk: { x: -23.2, z: -47.6, yaw: Math.PI, D: 0.8, top: 0.82 }, lx: -0.35 },
  // 局长室秘书台：原秘书台（office_desk @ −6.00,−95.60，yaw −π/2，使用侧朝西）桌面已满（台灯/打字机/双电话/文件）→ 南端接一张小桌成 L 形转角，台面放终端
  { id: 'director', kind: 'table', plan: 'director', zone: 'director', floor: '12F', page: 'director', label: '局长室 · 秘书台', term: '12F-MS-01',
    desk: { x: -6.17, z: -93.96, yaw: -Math.PI / 2, D: 0.59, top: 0.72, w: 1.24 }, lx: 0.12 },
  { id: 'publicity', kind: 'model', plan: 'floor2_pub', zone: 'floor2', floor: '2F', page: 'publicity', label: '宣传处 · 运营组', term: '2F-XC-04',
    near: [-16.1, 0.76, -96.2] },
  { id: 'jiyao', kind: 'model', zone: 'director', floor: '12F', page: 'director', sub: 'classified', label: '局长室 · 机要室　密电终端', term: '12F-JY-00',
    near: [11.8, 0.76, -102.85] },
  { id: 'command', kind: 'console', zone: 'command_center', floor: '2F', page: 'command', label: '监测指挥中心 · 席位 A-04', term: 'EW2-ZH-A04',
    screen: { x: 36.8, y: 1.12, z: -40.05 - 0.006, yaw: Math.PI, w: 0.84, h: 0.46 } },
  { id: 'interrogation', kind: 'model', plan: 'interrogation', zone: 'interrogation', floor: 'B2', page: 'interrogation', label: 'B2 · 观察间监看台', term: 'B2-SX-01',
    near: [-5.6, 0.885, -95.65] },
  { id: 'vault', kind: 'model', plan: 'b5_deep', zone: 'vault_b5', floor: 'B5', page: 'vault', label: 'B5 · 深库值守台', term: 'B5-ZS-01',
    near: [4.3, 0.76, -102.9] },
];

/** desk / table 类终端要新加的规划条目（相对楼面 Y） */
export function stationItems(s, Y = 0) {
  if (s.kind !== 'desk' && s.kind !== 'table') return [];
  const d = s.desk, out = [];
  const at = (lx, lz) => { const [dx, dz] = rot(d.yaw, lx, lz); return [d.x + dx, d.z + dz]; };
  if (s.kind === 'table') out.push({ m: TABLE, x: d.x, y: Y, z: d.z, yaw: d.yaw, w: d.w, tag: '局内网终端', on: 'floor', col: [d.w, d.top, d.D] });
  const crtD = 0.388 * CRT_H / 0.4, lzC = -d.D / 2 + crtD / 2 + 0.04, lzK = Math.min(d.D / 2 - 0.1, lzC + crtD / 2 + 0.14);
  const [cx, cz] = at(s.lx, lzC), [kx, kz] = at(s.lx, lzK);
  out.push({ m: CRT, x: cx, y: Y + d.top, z: cz, yaw: d.yaw, h: CRT_H, tag: '局内网终端', on: 'desk' });
  out.push({ m: KBD, x: kx, y: Y + d.top, z: kz, yaw: d.yaw, w: 0.42, tag: '局内网终端', on: 'desk' });
  return out;
}

/** 终端屏幕的大致中心与朝向（截图机位、交互热点用；model 类运行时再吸附到真实屏幕） */
export function stationScreenGuess(s, Y = 0) {
  if (s.kind === 'console') return { c: [s.screen.x, Y + s.screen.y, s.screen.z], yaw: s.screen.yaw };
  if (s.kind === 'model') return { c: [s.near[0], Y + s.near[1] + 0.22, s.near[2]], yaw: null };
  const it = stationItems(s, Y).find((i) => i.m === CRT); const [fx, fz] = rot(s.desk.yaw, 0, 0.16);
  return { c: [it.x + fx, it.y + CRT_H * 0.56, it.z + fz], yaw: s.desk.yaw };
}
