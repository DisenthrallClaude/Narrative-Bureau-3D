// 哥特建筑程序化构件库：尖拱、拱门券、尖窗花格、扶壁、飞扶壁、小尖塔、尖顶、塔楼、屋顶、金线脚
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const S3 = Math.sqrt(3) / 2;

/** 等边尖拱轮廓（底边 y=0），w 宽、hs 起拱高度；返回 Shape */
export function archShape(w, hs, Cls = THREE.Shape, segs = 10) {
  const s = new Cls();
  const h = w / 2;
  s.moveTo(-h, 0);
  s.lineTo(-h, hs);
  // 左弧：圆心 (h, hs)，半径 w，从 π 到 2π/3
  for (let i = 1; i <= segs; i++) { const a = Math.PI - (Math.PI / 3) * (i / segs); s.lineTo(h + w * Math.cos(a), hs + w * Math.sin(a)); }
  // 右弧：圆心 (-h, hs)，从 π/3 到 0
  for (let i = 1; i <= segs; i++) { const a = Math.PI / 3 - (Math.PI / 3) * (i / segs); s.lineTo(-h + w * Math.cos(a), hs + w * Math.sin(a)); }
  s.lineTo(h, 0);
  s.lineTo(-h, 0);
  return s;
}
export const archApex = (w, hs) => hs + w * S3;

/** 尖拱环（外拱减内拱），用于门券、窗框 */
export function archRingGeo(wOut, hsOut, wIn, hsIn, depth, bevel = 0) {
  const outer = archShape(wOut, hsOut);
  const inner = archShape(wIn, hsIn, THREE.Path);
  // 内孔需反向
  outer.holes.push(new THREE.Path(inner.getPoints().reverse()));
  const g = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 6 });
  g.translate(0, 0, -depth / 2);
  return g;
}
export function archSolidGeo(w, hs, depth) {
  const g = new THREE.ExtrudeGeometry(archShape(w, hs), { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** 在 Batch 中放置对象的帮助：基于 (位置, 朝向 yaw) 的局部坐标系 */
export class Frame {
  constructor(pos = [0, 0, 0], yaw = 0) { this.m = new THREE.Matrix4().compose(V(...pos), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(1, 1, 1)); }
  at(x, y, z, rot = [0, 0, 0], scale = [1, 1, 1]) {
    const l = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), V(...scale));
    return new THREE.Matrix4().multiplyMatrices(this.m, l);
  }
}

/** 尖拱窗：石框 + 花格 + 玻璃。f 为墙面局部系（窗面朝 +z），窗底中心 (x,y,z) */
export function lancetWindow(b, f, x, y, z, w, h, o = {}) {
  const hs = h - w * S3;
  const frame = o.frame ?? Math.max(0.15, w * 0.12);
  const depth = o.depth ?? 0.6;
  b.add(o.stone ?? 'stone', archRingGeo(w + frame * 2, hs, w, hs, depth), f.at(x, y, z), { uv: 0.5 });
  // 第二道内凹券（层次）
  b.add(o.stone ?? 'stone', archRingGeo(w, hs, w - frame * 0.8, hs, depth * 0.5), f.at(x, y, z - depth * 0.35), { uv: 0.5 });
  // 金色细线
  if (o.gold !== false) b.add('gold', archRingGeo(w + frame * 2 + 0.08, hs, w + frame * 2, hs, 0.06), f.at(x, y, z + depth / 2 + 0.03), { uv: 1 });
  // 中梃与花格圆
  const ww = w - frame * 0.8;
  if (w > 1.2 && o.tracery !== false) {
    // M6：窗棂改金色（审阅 R2–R5 P1：盲窗读不出窗格）
    const tm = o.traceryMat ?? (o.gold === false ? (o.stone ?? 'stone') : 'gold');
    b.add(tm, new THREE.BoxGeometry(0.14, hs + ww * 0.3, 0.16), f.at(x, y + (hs + ww * 0.3) / 2, z - depth * 0.3), { uv: 1 });
    const r = ww * 0.22;
    b.add(tm, new THREE.TorusGeometry(r, 0.08, 6, 24), f.at(x, y + hs + ww * 0.42, z - depth * 0.3), { uv: 1 });
    for (let k = 0; k < 3; k++) { const a = Math.PI / 2 + (k * Math.PI * 2) / 3; b.add(tm, new THREE.TorusGeometry(r * 0.42, 0.04, 5, 16), f.at(x + Math.cos(a) * r * 0.5, y + hs + ww * 0.42 + Math.sin(a) * r * 0.5, z - depth * 0.3), { uv: 1 }); }
    if (w > 2.2) for (const sx of [-1, 1]) b.add(tm, new THREE.BoxGeometry(0.1, hs * 0.95, 0.12), f.at(x + sx * ww * 0.25, y + hs * 0.475, z - depth * 0.3), { uv: 1 });
    // 横档
    for (let k = 1; k < 4; k++) b.add('iron', new THREE.BoxGeometry(ww, 0.04, 0.05), f.at(x, y + (hs * k) / 4, z - depth * 0.32), { uv: 1 });
  }
  else if (w > 0.6 && o.tracery !== false) { // M4：小窗也有窗棂——一道竖棂 + 顶部三叶圆环（金）
    b.add('gold', new THREE.CylinderGeometry(0.04, 0.04, hs + ww * 0.25, 6), f.at(x, y + (hs + ww * 0.25) / 2, z - depth * 0.3), { uv: 1 });
    b.add('gold', new THREE.TorusGeometry(ww * 0.2, 0.035, 5, 16), f.at(x, y + hs + ww * 0.4, z - depth * 0.3), { uv: 1 });
    for (let k = 1; k < 3; k++) b.add('iron', new THREE.BoxGeometry(ww, 0.03, 0.04), f.at(x, y + (hs * k) / 3, z - depth * 0.32), { uv: 1 });
  }
  if (w > 1.2 && o.tracery !== false) b.add('gold', new THREE.TorusGeometry(ww * 0.22 + 0.07, 0.03, 5, 24), f.at(x, y + hs + ww * 0.42, z - depth * 0.28), { uv: 1 });
  // 玻璃
  b.add(o.glass ?? 'glassOut', new THREE.ShapeGeometry(archShape(ww, hs)), f.at(x, y, z - depth * 0.36), { uv: false });
  // 窗台
  b.add(o.stone ?? 'stone', new THREE.BoxGeometry(w + frame * 2 + 0.3, 0.18, depth + 0.3), f.at(x, y - 0.09, z + 0.1), { uv: 0.5 });
}

/** 小尖塔（pinnacle）：方柱 + 山花 + 四棱锥 + 卷叶饰 + 金色顶饰 */
export function pinnacle(b, f, x, y, z, s = 1, o = {}) {
  const sh = 3 * s;
  b.add('stone', new THREE.BoxGeometry(s, sh, s), f.at(x, y + sh / 2, z), { uv: 0.5 });
  // 小尖拱盲窗（四面）
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const fx = Math.sin(a) * (s / 2 + 0.01), fz = Math.cos(a) * (s / 2 + 0.01);
    b.add('stoneDark', new THREE.ShapeGeometry(archShape(s * 0.5, sh * 0.5)), f.at(x + fx, y + sh * 0.2, z + fz, [0, a, 0]), { uv: 1 });
    // 小山花
    const gab = new THREE.Shape(); gab.moveTo(-s / 2, 0); gab.lineTo(0, s * 0.8); gab.lineTo(s / 2, 0); gab.lineTo(-s / 2, 0);
    b.add('stone', new THREE.ExtrudeGeometry(gab, { depth: 0.12 * s, bevelEnabled: false }), f.at(x + fx * 0.95, y + sh, z + fz * 0.95, [0, a, 0]), { uv: 1 });
  }
  const ph = 4 * s;
  b.add('stone', new THREE.ConeGeometry(s * 0.62, ph, 4), f.at(x, y + sh + ph / 2, z, [0, Math.PI / 4, 0]), { uv: 0.5 });
  // 卷叶饰（crockets）
  for (let k = 1; k < 4; k++) for (let e = 0; e < 4; e++) {
    const t = k / 4, r = s * 0.62 * (1 - t) * 0.75;
    const a = (e * Math.PI) / 2;
    b.add('stone', new THREE.ConeGeometry(0.1 * s, 0.32 * s, 4), f.at(x + Math.cos(a) * r, y + sh + ph * t, z + Math.sin(a) * r, [0, 0, 0]), { uv: 1 });
  }
  if (o.gold !== false) {
    b.add('gold', new THREE.SphereGeometry(0.16 * s, 8, 6), f.at(x, y + sh + ph + 0.1 * s, z), { uv: 1 });
    b.add('gold', new THREE.BoxGeometry(0.06 * s, 0.9 * s, 0.06 * s), f.at(x, y + sh + ph + 0.5 * s, z), { uv: 1 });
    b.add('gold', new THREE.BoxGeometry(0.42 * s, 0.06 * s, 0.06 * s), f.at(x, y + sh + ph + 0.65 * s, z), { uv: 1 });
  }
  return y + sh + ph + s;
}

/** 八角尖顶：锥体 + 金色棱线 + 金箍 + 老虎窗 + 顶饰十字罗盘 */
export function spire(b, f, x, y, z, r, h, o = {}) {
  const sides = o.sides ?? 8;
  b.add(o.mat ?? 'slate', new THREE.ConeGeometry(r, h, sides, 1), f.at(x, y + h / 2, z, [0, Math.PI / sides, 0]), { uv: 0.3 });
  // 棱线
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const p0 = V(Math.cos(a) * r, 0, Math.sin(a) * r);
    const p1 = V(0, h, 0);
    const len = p0.distanceTo(p1);
    const mid = p0.clone().add(p1).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), p1.clone().sub(p0).normalize());
    const e = new THREE.Euler().setFromQuaternion(q);
    b.add('gold', new THREE.BoxGeometry(r * 0.05, len, r * 0.05), f.at(x + mid.x, y + mid.y, z + mid.z, [e.x, e.y, e.z]), { uv: 1 });
  }
  // 金箍
  for (const t of o.bands ?? [0.0, 0.33, 0.62, 0.85]) {
    const rr = r * (1 - t);
    b.add('gold', new THREE.CylinderGeometry(rr * 1.02, rr * 1.02, Math.max(0.12, r * 0.04), sides, 1, true), f.at(x, y + h * t + 0.05, z, [0, Math.PI / sides, 0]), { uv: 1 });
  }
  // 老虎窗（lucarne）
  if (o.lucarnes !== false) for (let i = 0; i < sides; i += 2) {
    const a = (i / sides) * Math.PI * 2 + Math.PI / sides;
    const t = 0.18, rr = r * (1 - t) * 0.92;
    const lw = r * 0.32;
    const yaw = -a + Math.PI / 2;
    b.add('stone', new THREE.BoxGeometry(lw, lw * 1.4, lw * 0.6), f.at(x + Math.cos(a) * rr, y + h * t, z + Math.sin(a) * rr, [0, yaw, 0]), { uv: 0.5 });
    const gab = new THREE.Shape(); gab.moveTo(-lw * 0.6, 0); gab.lineTo(0, lw * 1.1); gab.lineTo(lw * 0.6, 0); gab.lineTo(-lw * 0.6, 0);
    const gg = new THREE.ExtrudeGeometry(gab, { depth: lw * 0.7, bevelEnabled: false }); gg.translate(0, 0, -lw * 0.35);
    b.add('stone', gg, f.at(x + Math.cos(a) * rr, y + h * t + lw * 0.7, z + Math.sin(a) * rr, [0, yaw, 0]), { uv: 0.5 });
    b.add('gold', new THREE.ConeGeometry(lw * 0.08, lw * 0.6, 4), f.at(x + Math.cos(a) * rr, y + h * t + lw * 2.0, z + Math.sin(a) * rr), { uv: 1 });
  }
  // 顶饰
  const top = y + h;
  b.add('gold', new THREE.SphereGeometry(r * 0.09, 10, 8), f.at(x, top, z), { uv: 1 });
  b.add('gold', new THREE.BoxGeometry(r * 0.04, r * 0.9, r * 0.04), f.at(x, top + r * 0.45, z), { uv: 1 });
  b.add('gold', new THREE.BoxGeometry(r * 0.45, r * 0.04, r * 0.04), f.at(x, top + r * 0.6, z), { uv: 1 });
  b.add('gold', new THREE.TorusGeometry(r * 0.17, r * 0.018, 6, 24), f.at(x, top + r * 0.6, z), { uv: 1 });
  return top;
}

/** 带角扶壁、多层尖窗、金色腰线、雉堞与尖顶的塔楼 */
export function tower(b, x, z, w, h, o = {}) {
  const y0 = o.y0 ?? 0;
  const f = new Frame([x, y0, z], o.yaw ?? 0);
  b.add('stone', new THREE.BoxGeometry(w, h, w), f.at(0, h / 2, 0), { uv: 0.2, collide: o.collide !== false });
  // 角扶壁（逐级收分）
  const bw = w * 0.16;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    let yy = 0, bwk = bw * 1.25;
    for (let k = 0; k < 4; k++) {
      const hh = h * [0.32, 0.28, 0.22, 0.12][k];
      b.add('stone', new THREE.BoxGeometry(bwk, hh, bwk), f.at(sx * (w / 2 + bwk * 0.25), yy + hh / 2, sz * (w / 2 + bwk * 0.25)), { uv: 0.3 });
      b.add('gold', new THREE.BoxGeometry(bwk + 0.08, 0.12, bwk + 0.08), f.at(sx * (w / 2 + bwk * 0.25), yy + hh, sz * (w / 2 + bwk * 0.25)), { uv: 1 });
      yy += hh; bwk *= 0.84;
    }
    pinnacle(b, f, sx * (w / 2), h, sz * (w / 2), w * 0.09);
  }
  // 腰线
  const levels = o.levels ?? Math.max(2, Math.round(h / 14));
  for (let k = 1; k <= levels; k++) {
    const yy = (h * k) / (levels + 0.6);
    b.add('gold', new THREE.BoxGeometry(w + 0.16, 0.16, w + 0.16), f.at(0, yy, 0), { uv: 1 });
    b.add('stone', new THREE.BoxGeometry(w + 0.5, 0.35, w + 0.5), f.at(0, yy - 0.3, 0), { uv: 0.5 });
  }
  // 各面尖窗
  const ww = w * 0.2;
  for (let side = 0; side < 4; side++) {
    const yaw = (side * Math.PI) / 2;
    const ff = new Frame([x, y0, z], (o.yaw ?? 0) + yaw);
    for (let k = 0; k < levels; k++) {
      const yb = (h * k) / (levels + 0.6) + 1.5;
      const wh = (h / (levels + 0.6)) * 0.62;
      const n = w > 12 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const xx = n === 1 ? 0 : (i - 0.5) * w * 0.38;
        lancetWindow(b, ff, xx, yb, w / 2 + 0.05, ww, wh, { tracery: ww > 1.2 });
      }
    }
    // 竖向金色线脚
    for (const xx of [-w * 0.36, w * 0.36]) b.add('gold', new THREE.BoxGeometry(0.1, h * 0.92, 0.1), ff.at(xx, h * 0.46, w / 2 + 0.05), { uv: 1 });
    // 女儿墙雉堞
    const nC = Math.max(3, Math.round(w / 2));
    for (let i = 0; i < nC; i++) {
      const xx = -w / 2 + (w / nC) * (i + 0.5);
      b.add('stone', new THREE.BoxGeometry((w / nC) * 0.55, 1.4, 0.5), ff.at(xx, h + 0.7, w / 2 - 0.25), { uv: 0.5 });
    }
    b.add('gold', new THREE.BoxGeometry(w + 0.2, 0.14, 0.2), ff.at(0, h + 0.02, w / 2 + 0.05), { uv: 1 });
    if (o.banner) o.banner(ff, w);
  }
  if (o.spire !== false) {
    const sr = w * 0.42;
    // 八角鼓座
    b.add('stone', new THREE.CylinderGeometry(sr * 1.02, sr * 1.08, w * 0.35, 8), f.at(0, h + w * 0.175, 0, [0, Math.PI / 8, 0]), { uv: 0.3 });
    return spire(b, f, 0, h + w * 0.35, 0, sr, o.spireH ?? w * 3.2);
  }
  return y0 + h;
}

/** 坡屋顶（三角截面沿 z 方向），宽 w，长 len，高 rh；金色屋脊饰 */
export function gableRoof(b, cx, y, cz, w, len, rh, o = {}) {
  const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.4, 0); s.lineTo(0, rh); s.lineTo(w / 2 + 0.4, 0); s.lineTo(-w / 2 - 0.4, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2);
  const f = new Frame([cx, y, cz], o.yaw ?? 0);
  b.add('slate', g, f.at(0, 0, 0), { uv: 0.35 });
  b.add('gold', new THREE.BoxGeometry(0.22, 0.22, len), f.at(0, rh + 0.05, 0), { uv: 1 });
  // 屋脊镂空饰
  const n = Math.floor(len / 2.2);
  for (let i = 0; i < n; i++) {
    const zz = -len / 2 + (len / n) * (i + 0.5);
    b.add('gold', new THREE.ConeGeometry(0.12, 0.9, 4), f.at(0, rh + 0.55, zz), { uv: 1 });
    b.add('gold', new THREE.TorusGeometry(0.18, 0.03, 4, 10), f.at(0, rh + 0.4, zz, [0, Math.PI / 2, 0]), { uv: 1 });
  }
  // 屋面老虎窗
  if (o.dormers) for (let i = 0; i < o.dormers; i++) {
    const zz = -len / 2 + (len / o.dormers) * (i + 0.5);
    for (const sx of [-1, 1]) {
      const yaw = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
      const ff = new Frame([cx + sx * w * 0.24, y + rh * 0.42, cz + zz], (o.yaw ?? 0));
      b.add('stone', new THREE.BoxGeometry(1.6, 2.2, 1.6), ff.at(0, 0.6, 0), { uv: 0.5 });
      pinnacle(b, ff, 0, 1.7, 0, 0.35, { gold: true });
      void yaw;
    }
  }
}

/**
 * 立面墙段（沿局部 x，面向局部 +z）：墙体 + 扶壁 + 尖窗 + 金腰线 + 檐口 + 扶壁尖塔
 * f: Frame（墙中心底部），len, h, bays
 */
export function bayWall(b, f, len, h, bays, o = {}) {
  const t = o.thick ?? 1.2;
  b.add('stone', new THREE.BoxGeometry(len, h, t), f.at(0, h / 2, -t / 2), { uv: 0.2, collide: o.collide });
  const bayW = len / bays;
  for (let i = 0; i <= bays; i++) {
    const xx = -len / 2 + i * bayW;
    // 扶壁
    let yy = 0, d = o.buttressD ?? 1.6, bw = 1.1;
    for (let k = 0; k < 3; k++) {
      const hh = h * [0.45, 0.35, 0.2][k];
      b.add('stone', new THREE.BoxGeometry(bw, hh, d), f.at(xx, yy + hh / 2, d / 2), { uv: 0.3 });
      // 斜面水盘
      b.add('stoneDark', new THREE.BoxGeometry(bw + 0.05, 0.25, d + 0.05), f.at(xx, yy + hh - 0.12, d / 2), { uv: 0.5 });
      yy += hh; d *= 0.7;
    }
    if (o.pinnacles !== false) pinnacle(b, f, xx, h, 0.25, 0.75);
  }
  for (let i = 0; i < bays; i++) {
    const xx = -len / 2 + (i + 0.5) * bayW;
    const ww = Math.min(bayW * 0.5, o.winW ?? 3);
    if (o.twoTier) {
      lancetWindow(b, f, xx, 2.2, 0.05, ww * 0.8, h * 0.32);
      lancetWindow(b, f, xx, h * 0.48, 0.05, ww, h * 0.4);
    } else lancetWindow(b, f, xx, o.sill ?? h * 0.18, 0.05, ww, h * 0.62);
  }
  // 腰线与檐口
  b.add('gold', new THREE.BoxGeometry(len, 0.14, 0.14), f.at(0, h * 0.44, 0.07), { uv: 1 });
  b.add('stone', new THREE.BoxGeometry(len + 0.4, 0.6, 0.8), f.at(0, h - 0.3, 0.2), { uv: 0.5 });
  b.add('gold', new THREE.BoxGeometry(len + 0.4, 0.12, 0.12), f.at(0, h - 0.62, 0.62), { uv: 1 });
  // 镂空女儿墙（尖拱连续孔）
  const n = Math.max(2, Math.round(len / 1.4));
  for (let i = 0; i < n; i++) {
    const xx = -len / 2 + (len / n) * (i + 0.5);
    b.add('stone', archRingGeo(len / n, 0.5, len / n - 0.24, 0.5, 0.25), f.at(xx, h, 0.3), { uv: 1 });
  }
  b.add('stone', new THREE.BoxGeometry(len + 0.4, 0.2, 0.3), f.at(0, h + 0.5 + (len / n) * S3 + 0.1, 0.3), { uv: 1 });
}

/** 飞扶壁：从外侧墩柱(局部 x=0) 拱向墙面 (x=span)，高度 y0→y1 */
export function flyingButtress(b, f, span, y0, y1, thick = 0.7) {
  const s = new THREE.Shape();
  const hgt = y1 - y0;
  s.moveTo(0, 0);
  s.quadraticCurveTo(span * 0.15, hgt * 0.95, span, hgt * 0.92);
  s.lineTo(span, hgt * 1.08);
  s.lineTo(0, hgt * 0.42);
  s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -thick / 2);
  b.add('stone', g, f.at(0, y0, 0), { uv: 0.4 });
  // 顶部金线
  const top = new THREE.Shape(); top.moveTo(0, hgt * 0.42); top.lineTo(span, hgt * 1.08); top.lineTo(span, hgt * 1.1); top.lineTo(0, hgt * 0.44);
  const tg = new THREE.ExtrudeGeometry(top, { depth: thick + 0.06, bevelEnabled: false }); tg.translate(0, 0, -(thick + 0.06) / 2);
  b.add('gold', tg, f.at(0, y0, 0), { uv: 1 });
}

/** 罗盘十字局徽（金色），返回 Group；r 外环半径 */
export function emblem(r, mat, matDark) {
  const g = new THREE.Group();
  const add = (geo, x = 0, y = 0, z = 0, rz = 0, m = mat) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.rotation.z = rz; me.castShadow = true; g.add(me); return me; };
  add(new THREE.TorusGeometry(r, r * 0.06, 12, 96));
  add(new THREE.TorusGeometry(r * 0.78, r * 0.025, 8, 96));
  // 刻度
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    add(new THREE.BoxGeometry(r * 0.02, i % 4 === 0 ? r * 0.14 : r * 0.07, r * 0.03), Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.88, 0, a - Math.PI / 2);
  }
  // 四芒星
  const star = new THREE.Shape();
  const N = 4, R = r * 1.25, ri = r * 0.16;
  for (let i = 0; i < N * 2; i++) { const a = (i / (N * 2)) * Math.PI * 2 + Math.PI / 2; const rr = i % 2 === 0 ? R : ri; i === 0 ? star.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) : star.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  const sg = new THREE.ExtrudeGeometry(star, { depth: r * 0.08, bevelEnabled: true, bevelSize: r * 0.03, bevelThickness: r * 0.04, bevelSegments: 2 });
  add(sg, 0, 0, -r * 0.04);
  // 斜向小芒
  const star2 = new THREE.Shape();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 4 + Math.PI / 2; const rr = i % 2 === 0 ? r * 0.7 : r * 0.12; i === 0 ? star2.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) : star2.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  add(new THREE.ExtrudeGeometry(star2, { depth: r * 0.05, bevelEnabled: true, bevelSize: r * 0.02, bevelThickness: r * 0.02, bevelSegments: 1 }), 0, 0, -r * 0.06, Math.PI / 4);
  // 中心菱形宝石（深蓝）
  const gem = add(new THREE.OctahedronGeometry(r * 0.13, 0), 0, 0, r * 0.08, 0, matDark ?? mat);
  gem.scale.set(0.8, 1.2, 0.5);
  g.userData.gem = gem;
  return g;
}

/** 金色凸字（canvas → alpha+bump） */
export function goldText(text, w, h, mat, o = {}) {
  const cv = document.createElement('canvas');
  const scale = o.res ?? 256;
  cv.width = Math.round(scale * (w / h)); cv.height = scale;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#fff';
  ctx.font = `${o.weight ?? 400} ${Math.round(scale * 0.78)}px ${o.font ?? '"NB Title","NB Serif","Noto Serif SC",serif'}`; // M5：标题字体换 站酷小薇（仅简体字形，「叙」右部为「又」，不会被看成「敘」）
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (o.spacing) ctx.letterSpacing = `${o.spacing}px`;
  ctx.fillText(text, cv.width / 2, cv.height * 0.54); if (o.stroke !== 0) { ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.lineWidth = scale * (o.stroke ?? 0.022); ctx.strokeText(text, cv.width / 2, cv.height * 0.54); }
  const tex = new THREE.CanvasTexture(cv);
  const m = mat.clone();
  m.alphaMap = tex; m.transparent = false; m.alphaTest = 0.5; m.bumpMap = tex; m.bumpScale = o.bump ?? 0.6; tex.anisotropy = 8; tex.colorSpace = THREE.NoColorSpace;
  m.map = null;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  return mesh;
}
