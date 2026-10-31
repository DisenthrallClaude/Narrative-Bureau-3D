// 批次 E1：特效批第一轮（低存在感，全部暗金 / 琥珀 / 暖灰，禁蓝绿）。
// 素材：00GameDevs Three.js 特效库（MIT），运行时 src/vendor/gdevs-vfx.js（动态 import，独立 chunk，不进主包）。
//   1. abyss_gate：星紋之門（astral-gate）去掉自带门框，只留星纹膜 + 微粒，贴在折页面 int_abyss_fold 前 6 cm，暗金、慢速。
//   2. archive_b1：貼地薄霧（ground-fog）×5 团，暖灰，贴地 ≤0.9 m，慢速。
//   3. seventh_rewrite：浮符矩陣（arcane-matrix），淡琥珀，围绕回写排字台（0, SY, −174），浮晶数量少。
// 开关：?nofx=1 全关；?e1off=gate,fog,runes 单关；运行时 G.e1fx.set('fog', false)。
// 画质：low 档（核显）降密度 / 降细节 / 雾只放 3 团；只在对应区域（G.zone）可见时 update，其余时间 group.visible=false。
// 预热：在主循环 compileAsync 之前加入场景并推进一帧，让着色器随全场景一起预编译（同 kit/warm.js 思路），首次进入不卡。
import * as THREE from 'three';

const P = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const OFF = new Set((P.get('e1off') || '').split(',').filter(Boolean));
export const E1_FX = !P.has('nofx');

const PRESETS = {
  gate: { id: 'astral-gate', lifecycle: { start: 0.8, end: 0.8 }, name: '星紋之門', category: 'portal', color: '#c1b8ff', maxParticles: 512, kind: 8, variant: 0, duration: 5, burst: false, seed: 385854, schools: ['astral'] },
  fog: { id: 'ground-fog', lifecycle: { start: 0.5, end: 1.2 }, name: '貼地薄霧', category: 'smoke', color: '#a6c9ca', maxParticles: 128, kind: 5, variant: 1, duration: 5, burst: false, seed: 202114 },
  runes: { id: 'arcane-matrix', quantity: { min: 1, max: 18, default: 9 }, lifecycle: { start: 0.7, end: 1 }, name: '浮符矩陣', kind: 2, variant: 4, color: '#bd9aff', duration: 5, burst: false, category: 'area', schools: ['arcane'], maxParticles: 512, seed: 322133 },
};

export async function initE1FX(G, { AY = -300, SY = -500, quality = 'high' } = {}) {
  if (!E1_FX) return null;
  let createEffect;
  try { ({ createEffect } = await import('../vendor/gdevs-vfx.js')); } catch (e) { console.warn('E1 fx', e); return null; }
  const low = quality === 'low';
  const items = [];
  const add = (name, zone, build) => {
    if (OFF.has(name)) return;
    const root = new THREE.Group(); root.name = 'e1fx_' + name; root.userData.noShadow = true;
    const fxs = build(root);
    root.traverse((o) => { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; });
    G.scene.add(root);
    items.push({ name, zone, root, fxs, on: true });
  };

  // 1. 深渊门：星纹膜（门洞等边尖拱 w12.4 / 起拱 10.6 / 顶 ≈21.3，折页面 z −80.8）
  add('gate', 'abyss_gate', (root) => {
    const fx = createEffect(PRESETS.gate, { color: '#7a5420', size: 1, speed: 0.35, density: low ? 0.2 : 0.4, detail: low ? 0.5 : 1 });
    fx.group.traverse((o) => { if (o.name === 'utility-gate-frame') o.visible = false; }); // 石拱已是门框
    fx.group.rotation.y = -Math.PI / 2; // 特效门面法线 +X → 朝玩家 +Z
    fx.group.scale.setScalar(5.6);
    fx.group.position.set(0, AY + 0.6, -80.74);
    root.add(fx.group);
    return [fx];
  });

  // 2. 档案馆 B1 贴地薄雾（地坪 −4.2；变体 1 粒子在原点下 1.12…0.67 → 原点抬 1.12×缩放）
  add('fog', 'archive_b1', (root) => {
    const pts = [[-36, -38.5], [-44, -41.5], [-29, -41], [-52, -44.5], [-40, -50]].slice(0, low ? 3 : 5);
    const s = 1.6;
    return pts.map(([x, z], i) => {
      const fx = createEffect({ ...PRESETS.fog, seed: PRESETS.fog.seed + i * 977 }, { color: '#6e655a', size: 1, speed: 0.4, density: low ? 0.18 : 0.3, detail: low ? 0.5 : 1 });
      fx.group.scale.setScalar(s); fx.group.position.set(x, -4.2 + 1.12 * s - 0.08, z); fx.group.rotation.y = i * 1.3;
      root.add(fx.group); return fx;
    });
  });

  // 3. 第七局 回写台：浮符矩阵围绕排字台（长桌 3.2×7，中心 0, SY, −174）
  add('runes', 'seventh_rewrite', (root) => {
    const fx = createEffect(PRESETS.runes, { color: '#a87a34', size: 1, speed: 0.3, density: low ? 0.2 : 0.35, detail: low ? 0.5 : 0.8, quantity: low ? 3 : 5 });
    fx.group.scale.setScalar(2.4); fx.group.position.set(0, SY + 0.03, -174);
    fx.group.traverse((o) => { if (o.material && !o.material.depthWrite) { o.material.polygonOffset = true; o.material.polygonOffsetFactor = -2; o.material.polygonOffsetUnits = -4; } });
    root.add(fx.group);
    return [fx];
  });

  // 推进到持续段（跳过开场动画，进入时直接是稳定态），并让所有层可见以便 compileAsync 预热
  for (const it of items) for (const fx of it.fxs) for (let k = 0; k < 20 + Math.round(10 * (+P.get('e1adv') || 0)); k++) fx.update(0.1); // ?e1adv=秒：截图连帧用（同机位不同时刻）

  const api = {
    items,
    set(name, on) { const it = items.find((i) => i.name === name); if (it) it.on = !!on; },
    // 预热结束后调用：按区域隐藏
    update(dt) {
      for (const it of items) {
        const vis = it.on && G.zone === it.zone;
        it.root.visible = vis;
        if (vis) for (const fx of it.fxs) fx.update(dt);
      }
    },
    dispose() { for (const it of items) { for (const fx of it.fxs) fx.dispose(); it.root.removeFromParent(); } items.length = 0; },
  };
  G.e1fx = api;
  return api;
}
