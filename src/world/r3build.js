// R3：按 r3plan.js 的平面规划实例化（GLB → Props/InstancedMesh，色块 → Batch），并加碰撞盒
import { Batch } from '../engine/batch.js';
import { Props } from './dress.js';
import { PLANS, R3 } from './r3plan.js';
import { UPPER } from './upper.js';

const ZONE_OF = { floor3_office: ['floor3', () => UPPER['3F']], floor2_liaison: ['floor2', () => UPPER['2F']] };

export async function buildR3(ctx, world, MAT) {
  const jobs = [];
  for (const [id, on] of Object.entries(R3)) {
    if (!on || !ZONE_OF[id]) continue;
    const [zn, yf] = ZONE_OF[id]; const zone = ctx.zones[zn]; if (!zone) continue;
    const plan = PLANS[id](yf()); const P = new Props(), b = new Batch();
    for (const it of plan.items) {
      if (it.fixed) continue;
      if (it.box) { b.box(it.box, it.w, it.h, it.d, [it.x, it.y, it.z], { uv: 1, rot: [0, it.yaw ?? 0, 0] }); continue; }
      P.add(it.m, [it.x, it.y, it.z], { h: it.h, w: it.w, d: it.d, s: it.s, fit: it.fit, yaw: it.yaw ?? 0, rx: it.rx, rz: it.rz });
      if (it.col) world.box(it.x, it.y + it.col[1] / 2, it.z, it.col[0], it.col[1], it.col[2], it.yaw ?? 0);
    }
    b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g);
    jobs.push(P.build(zone, { shadow: true }).then((ms) => { for (const m of ms) if (m.name.includes('ceiling_light') || m.name.includes('smoke')) m.castShadow = false; }));
    ctx.r3 = ctx.r3 ?? {}; ctx.r3[id] = plan;
  }
  await Promise.all(jobs);
}
