// 批次 M13：墨渊 abyss_gate 深渊门 Blender hero 接入。
// 模型：public/assets/models/m13/abyss_gate.glb（tools/blender/m13_abyss.py，meshopt 压缩；游戏绝对 x/z，原点 = 墨渊地坪 AY）。
// 四层退缩尖拱券（拱石 + 拱心石 + 小圆柱）+ 暗铜铆钉门框 + 两侧门座（右座=原铜铭牌底墙，左座=暗铜符刻板）+ 立面墙/扶壁/束腰线/檐口
// + 门侧石台阶 + 深井围合（东西侧墙壁柱、南墙）。门洞 = 等边尖拱 w12.4 / 起拱 10.6，与折页面 int_abyss_fold 完全重合 → 折页面即后续特效贴面（z −80.8）。
// M13 下 depths.js 原「书页拱圈 ×9 + 书柱 ×2」不画（碰撞由本模块补）；折页面 / 守门人 / 铭牌 / 灯 / 触发器 / zone 判定全部不动。?nom13=1 回旧。
import { loadModel, pbr } from '../engine/assets.js';

export const M13_ABYSS = typeof location !== 'undefined' && !new URLSearchParams(location.search).has('nom13');

function mats() {
  return {
    m13_stone: pbr('Concrete034', { color: 0x8a7e70, roughness: 0.82, env: 0.4 }),
    m13_stoneDark: pbr('Concrete034', { color: 0x5a5148, roughness: 0.78, env: 0.4 }),
    m13_porph: pbr('Concrete034', { color: 0x5e2a22, roughness: 0.6, env: 0.4 }),
    m2_bronze: pbr('Metal046A', { color: 0x8a6238, metalness: 0.9, roughness: 0.5, env: 0.5 }),
  };
}
const pick = (MAT, m) => MAT[(m?.name || '').replace(/\.\d+$/, '')] ?? m;

export function buildM13Abyss(zone, world, Y) {
  if (!M13_ABYSS || !zone) return Promise.resolve();
  const MAT = mats();
  const job = loadModel('m13/abyss_gate').then((src) => {
    const g = src.clone(true); g.name = 'm13_abyss_gate'; g.position.set(0, Y, 0);
    g.traverse((o) => { if (!o.isMesh) return; o.material = pick(MAT, o.material); o.receiveShadow = true; o.castShadow = false; });
    zone.add(g);
  });
  if (world) {
    for (const s of [-1, 1]) {
      world.box(s * 7.6, Y + 15, -79.93, 2.8, 30, 3.95);    // 门座 + 拱券墩（x 6.2..9.0，前脸 −77.95）
      world.box(s * 12.0, Y + 15, -79.35, 6.0, 30, 5.3);    // 墙墩 + 扶壁 + 台阶（前缘 −76.7）
      world.box(s * 15.4, Y + 12, -66.05, 1.8, 24, 24.1);   // 侧墙（含壁柱，内缘 x ±14.5）
      world.box(s * 11.4, Y + 12, -53.5, 8.8, 24, 1.0);     // 南墙（回程门两侧）
    }
  }
  return job.catch((e) => console.warn('M13 abyss', e));
}
