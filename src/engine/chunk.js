// R3 批次8 性能：把跨越整片地表的合批网格 / 实例网格按世界空间网格切块，让视锥剔除（主相机 + 太阳阴影相机）和距离剔除真正生效。
// - 普通网格：按三角形质心分格，各格共享原顶点属性（GPU 只上传一次），只换索引；包围球按子集重算。
// - 实例网格：按实例位置分格。
// - 其他对象（Group / 小网格 / 人物等）不动；距离剔除只看对象自身包围球。
import * as THREE from 'three';

const _v = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _m = new THREE.Matrix4();

function subsetBounds(pos, idx) {
  const box = new THREE.Box3();
  for (let i = 0; i < idx.length; i++) { _v.fromBufferAttribute(pos, idx[i]); box.expandByPoint(_v); }
  const sp = new THREE.Sphere(); box.getBoundingSphere(sp);
  // 收紧半径
  let r2 = 0; for (let i = 0; i < idx.length; i++) { _v.fromBufferAttribute(pos, idx[i]); r2 = Math.max(r2, _v.distanceToSquared(sp.center)); }
  sp.radius = Math.sqrt(r2); return { box, sp };
}

function cloneProps(src, dst) {
  dst.name = src.name; dst.castShadow = src.castShadow; dst.receiveShadow = src.receiveShadow; dst.renderOrder = src.renderOrder; dst.frustumCulled = src.frustumCulled;
  dst.layers.mask = src.layers.mask; dst.userData = { ...src.userData, chunkOf: src.uuid }; dst.visible = src.visible;
  dst.position.copy(src.position); dst.quaternion.copy(src.quaternion); dst.scale.copy(src.scale); dst.matrix.copy(src.matrix); dst.matrixAutoUpdate = src.matrixAutoUpdate;
  if (src.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender) dst.onBeforeRender = src.onBeforeRender;
}

/** 切块：root 下所有足够大的网格。cell 格宽（米）；minTris 小于此面数不切；minR 包围球半径小于此不切 */
const _sp = new THREE.Sphere();
function cellKeyOf(o, cell) { o.updateMatrixWorld(true); const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); _sp.copy(o.isInstancedMesh && o.boundingSphere ? o.boundingSphere : g.boundingSphere).applyMatrix4(o.matrixWorld); return Math.floor(_sp.center.x / cell) + ',' + Math.floor(_sp.center.z / cell); }
// 远处（离城心 > far 米）的城景只按 512 m 大格分，避免远景城区被切成上千块（批次8：plaza 首版 6671 块 → OOM）
const keyOf = (x, z, cell, far) => { const c = Math.hypot(x, z + 35) > far ? 512 : cell; return Math.floor(x / c) + ',' + Math.floor(z / c) + (c === cell ? '' : 'F'); };
export function chunkGroup(root, { cell = 32, minTris = 1500, minR = 30, skip = null, far = 170, instCell = 64 } = {}) {
  root.updateMatrixWorld(true);
  const list = []; root.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh && o.geometry && !(skip && skip(o))) list.push(o); });
  let split = 0, made = 0;
  for (const o of list) {
    const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
    const rW = g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis();
    if (o.isInstancedMesh) {
      if (o.count < 8 || rW < minR) continue;
      const cells = new Map();
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, _m); _v.setFromMatrixPosition(_m).applyMatrix4(o.matrixWorld); const k = keyOf(_v.x, _v.z, instCell, far); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(i); }
      if (cells.size < 2) continue;
      for (const ids of cells.values()) {
        const im = new THREE.InstancedMesh(g, o.material, ids.length);
        ids.forEach((id, j) => { o.getMatrixAt(id, _m); im.setMatrixAt(j, _m); });
        im.instanceMatrix.needsUpdate = true; cloneProps(o, im); im.computeBoundingSphere(); im.userData.cell = cellKeyOf(im, cell); im.userData.inst = true; o.parent.add(im); made++;
      }
      o.parent.remove(o); split++; continue;
    }
    if (Array.isArray(o.material) || g.groups.length > 1 || g.morphAttributes.position) continue;
    const pos = g.attributes.position; const triN = (g.index ? g.index.count : pos.count) / 3;
    if (triN < minTris || rW < minR) continue;
    const ix = g.index ? g.index.array : null; const cells = new Map(); const mw = o.matrixWorld;
    for (let t = 0; t < triN; t++) {
      const i0 = ix ? ix[t * 3] : t * 3, i1 = ix ? ix[t * 3 + 1] : t * 3 + 1, i2 = ix ? ix[t * 3 + 2] : t * 3 + 2;
      _a.fromBufferAttribute(pos, i0); _b.fromBufferAttribute(pos, i1); _c.fromBufferAttribute(pos, i2); _v.copy(_a).add(_b).add(_c).multiplyScalar(1 / 3).applyMatrix4(mw);
      const k = keyOf(_v.x, _v.z, cell, far); let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(i0, i1, i2);
    }
    if (cells.size < 2) continue;
    const big = pos.count > 65535;
    for (const [k, idx] of cells) {
      const ng = new THREE.BufferGeometry(); for (const [n, a] of Object.entries(g.attributes)) ng.setAttribute(n, a);
      ng.setIndex(new THREE.BufferAttribute(big ? new Uint32Array(idx) : new Uint16Array(idx), 1));
      const { box, sp } = subsetBounds(pos, idx); ng.boundingBox = box; ng.boundingSphere = sp;
      const nm = new THREE.Mesh(ng, o.material); cloneProps(o, nm); nm.userData.cell = k; o.parent.add(nm); made++;
    }
    o.parent.remove(o); split++;
  }
  return { split, made };
}

/** 距离剔除：对 root 下网格按「到相机距离 − 半径」> 阈值隐藏。阈值由 rule(o, radius) 给出（返回 Infinity 表示不剔除） */
export class DistCull {
  constructor() { this.items = []; this._sp = new THREE.Sphere(); }
  add(root, rule) {
    root.updateMatrixWorld(true);
    root.traverse((o) => { if (!o.isMesh || !o.geometry) return; const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); const sp = (o.isInstancedMesh && o.boundingSphere ? o.boundingSphere : g.boundingSphere).clone().applyMatrix4(o.matrixWorld); const d = rule(o, sp.radius); if (!isFinite(d)) return; this.items.push({ o, c: sp.center, r: sp.radius, d, culled: false }); });
  }
  /** 只在「本类隐藏」与「恢复」之间切换，不覆盖其他代码对 visible 的设置 */
  update(cam, mul = 1) {
    const p = cam.position;
    for (const it of this.items) { const far = p.distanceTo(it.c) - it.r > it.d * mul;
      if (far && !it.culled) { if (it.o.visible) { it.o.visible = false; it.culled = true; } } else if (!far && it.culled) { it.o.visible = true; it.culled = false; } }
  }
}

/** 近/远两级 LOD：同格 hi / lo 网格成对，相机到该格包围球表面 < near 用 hi，否则用 lo（阴影随可见性，近处 hi 投影、远处 lo 投影）。
 *  userData.zoneHide = true 的网格（如门廊内隐藏的 F_trim）两级都不显示。 */
export class LodCells {
  constructor(near = 40) { this.near = near; this.cells = new Map(); }
  add(root, lvl, cell = 32) {
    root.updateMatrixWorld(true);
    root.traverse((o) => { if (!o.isMesh || !o.geometry) return; const k = o.userData.cell ?? cellKeyOf(o, cell); let c = this.cells.get(k); if (!c) this.cells.set(k, c = { hi: [], lo: [], box: new THREE.Box3() });
      const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); c.box.union(g.boundingBox.clone().applyMatrix4(o.matrixWorld)); c[lvl].push(o); });
  }
  finish() { for (const c of this.cells.values()) { c.sp = c.box.getBoundingSphere(new THREE.Sphere()); if (!c.lo.length) c.static = true; } }
  update(cam, force = false) {
    const p = cam.position;
    for (const c of this.cells.values()) { if (c.static) continue; const near = c.box.distanceToPoint(p) < this.near; if (near === c.near && !force) continue; c.near = near;
      for (const o of c.hi) o.visible = near && !o.userData.zoneHide; for (const o of c.lo) o.visible = !near && !o.userData.zoneHide; }
  }
  refresh(cam) { this.update(cam, true); }
}

/** 门洞（portal）剔除：相机在某个室内盒内时，盒外的网格只有落在「相机 → 门洞四边」视锥内才保留（用图层 0 开关，不碰 visible，阴影 pass 同样跳过）。
 *  defs: [{ id, box: [x0, x1, y0, y1, z0, z1], portals: [[[x,y,z] ×4], ...] }] */
export class PortalCull {
  constructor(defs) { this.defs = defs.map((d) => ({ ...d, b3: new THREE.Box3(new THREE.Vector3(d.box[0], d.box[2], d.box[4]), new THREE.Vector3(d.box[1], d.box[3], d.box[5])), P: d.portals.map((q) => q.map((v) => new THREE.Vector3(...v))) })); this.items = []; this.cur = null; this.last = new THREE.Vector3(1e9, 0, 0); }
  add(root) { root.updateMatrixWorld(true); root.traverse((o) => { if (!o.isMesh || !o.geometry) return; const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); const sp = (o.isInstancedMesh && o.boundingSphere ? o.boundingSphere : g.boundingSphere).clone().applyMatrix4(o.matrixWorld); this.items.push({ o, sp, off: false }); }); }
  _set(it, off) { if (off === it.off) return; it.off = off; if (off) it.o.layers.disable(0); else it.o.layers.enable(0); }
  update(cam) {
    const p = cam.position; const def = this.defs.find((d) => d.b3.containsPoint(p)) ?? null;
    if (!def) { if (this.cur) { for (const it of this.items) this._set(it, false); this.cur = null; } return; }
    this.cur = def; this.last.copy(p);
    // 盒外物体：必须同时在「门洞视锥」与「主相机视锥」内（阴影 pass 也只画这些——门外物体投到室内的影子可忽略）
    cam.updateMatrixWorld(); this._m = this._m ?? new THREE.Matrix4(); this._f = this._f ?? new THREE.Frustum(); this._m.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); this._f.setFromProjectionMatrix(this._m);
    // 每个门洞：4 个侧平面 + 门洞平面（法线背离相机）
    const fr = def.P.map((q) => { const pl = []; const c = new THREE.Vector3(); q.forEach((v) => c.add(v)); c.multiplyScalar(0.25);
      for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4]; const P0 = new THREE.Plane().setFromCoplanarPoints(p, a, b); if (P0.distanceToPoint(c) < 0) P0.negate(); pl.push(P0); }
      const Pp = new THREE.Plane().setFromCoplanarPoints(q[0], q[1], q[2]); if (Pp.distanceToPoint(p) > 0) Pp.negate(); pl.push(Pp); return pl; });
    for (const it of this.items) {
      const sp = it.sp; if (def.b3.intersectsSphere(sp)) { this._set(it, false); continue; }
      if (!this._f.intersectsSphere(sp)) { this._set(it, true); continue; }
      let vis = false; for (const pl of fr) { if (pl.every((P) => P.distanceToPoint(sp.center) >= -sp.radius)) { vis = true; break; } }
      this._set(it, !vis);
    }
  }
}
