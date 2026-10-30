// 局内网终端点位检查：把 src/ui/intranet/stations.js 新增的终端（CRT/键盘/小桌）并入所在区的 R3 规划，
// ① 按模型真实包围盒算尺寸 → r3plan_draw.py 画俯视图并查 穿模/悬空/越界/占道/穿墙；② 另查桌面小件互相重叠（r3plan_draw 不查桌面层）。
// 用法：node tools/intranet_check.mjs [outDir=screenshots/intranet]   有错误退出码 1
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { PLANS } from '../src/world/r3plan.js';
import { STATIONS, stationItems } from '../src/ui/intranet/stations.js';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const out = process.argv[2] || 'screenshots/intranet'; fs.mkdirSync(out, { recursive: true });
const mul = (a, b) => { const o = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) o[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return o; };
const ap = (m, v) => [0, 1, 2].map((k) => m[k] * v[0] + m[4 + k] * v[1] + m[8 + k] * v[2] + m[12 + k]);
const cache = {};
async function bbox(m) {
  if (cache[m]) return cache[m];
  const doc = await io.read(`public/assets/models/${m}.glb`); const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
  const visit = (n, pm) => { const mm = mul(pm, n.getMatrix()); const me = n.getMesh(); if (me) for (const p of me.listPrimitives()) { const pos = p.getAttribute('POSITION'); if (!pos) continue; const a = pos.getMin([]), b = pos.getMax([]); for (const x of [a[0], b[0]]) for (const y of [a[1], b[1]]) for (const z of [a[2], b[2]]) { const v = ap(mm, [x, y, z]); for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], v[k]); max[k] = Math.max(max[k], v[k]); } } } for (const c of n.listChildren()) visit(c, mm); };
  const sc = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]; for (const n of sc.listChildren()) visit(n, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  return (cache[m] = max.map((v, k) => v - min[k]));
}
async function sized(it) { if (it.fixed || it.size) return it; if (it.box) { it.size = [it.w, it.h, it.d]; return it; } const s0 = await bbox(it.m); if (it.fit) { it.size = it.fit; return it; } const s = it.h ? it.h / s0[1] : it.w ? it.w / s0[0] : it.d ? it.d / s0[2] : (it.s ?? 1); it.size = s0.map((v) => +(v * s).toFixed(3)); return it; }
// 桌面层 OBB 重叠（SAT）
const obb = (it, pad = 0) => { const [w, , d] = it.size, c = Math.cos(it.yaw ?? 0), s = Math.sin(it.yaw ?? 0); return [[-w / 2 - pad, -d / 2 - pad], [w / 2 + pad, -d / 2 - pad], [w / 2 + pad, d / 2 + pad], [-w / 2 - pad, d / 2 + pad]].map(([lx, lz]) => [it.x + lx * c + lz * s, it.z - lx * s + lz * c]); };
const sat = (a, b) => { for (const poly of [a, b]) for (let i = 0; i < 4; i++) { const [x1, z1] = poly[i], [x2, z2] = poly[(i + 1) % 4]; const nx = z1 - z2, nz = x2 - x1; const pa = a.map(([x, z]) => nx * x + nz * z), pb = b.map(([x, z]) => nx * x + nz * z); if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false; } return true; };
let bad = 0;
for (const s of STATIONS) {
  const mine = stationItems(s, 0); if (!mine.length || !s.plan) continue;
  const plan = PLANS[s.plan](0); for (const it of plan.items) await sized(it); for (const it of mine) await sized(it);
  const tops = plan.items.filter((t) => t.on === 'desk' && t.size && !t.box);
  const errs = [];
  for (const a of mine.filter((m) => m.on === 'desk')) for (const b of [...tops, ...mine.filter((m) => m !== a && m.on === 'desk')]) { if (Math.abs(a.y - b.y) > 0.08) continue; if (sat(obb(a, -0.005), obb(b, -0.005))) errs.push(`桌面重叠：${a.m.split('/').pop()}@(${a.x.toFixed(2)},${a.z.toFixed(2)}) ↔ ${b.m.split('/').pop()}@(${b.x.toFixed(2)},${b.z.toFixed(2)})`); }
  plan.items.push(...mine); plan.room = { ...plan.room, name: (plan.room?.name ?? s.plan) + '　＋ 局内网终端' };
  const jf = `/tmp/intranet_plan_${s.id}.json`; fs.writeFileSync(jf, JSON.stringify(plan));
  let rep = ''; let code = 0; try { rep = execFileSync('python3', ['tools/r3plan_draw.py', jf, `${out}/plan_${s.id}.png`]).toString(); } catch (e) { rep = (e.stdout ?? '').toString(); code = e.status; }
  const mineErr = rep.split('\n').filter((l) => /错误|穿模|悬空|越界|占道|穿墙/.test(l) && mine.some((m) => l.includes(m.m.split('/').pop()) && l.includes(m.x.toFixed(2))));
  console.log(`== ${s.id}（${s.plan}）draw 退出码 ${code}；本终端相关：${mineErr.length + errs.length} 处`); for (const l of [...errs, ...mineErr]) console.log('   ✗', l);
  if (code) console.log('   （规划自身报告）', rep.split('\n').filter((l) => l.trim()).slice(-3).join(' | '));
  bad += errs.length + mineErr.length + (code ? 1 : 0);
}
console.log(bad ? `共 ${bad} 处问题` : '全部 0 错误');
process.exit(bad ? 1 : 0);
