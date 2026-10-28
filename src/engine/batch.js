// 静态几何合批：按材质合并，世界空间盒式投影 UV（大尺度程序化建筑贴图连续不拉伸）
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const _m = new THREE.Matrix4();
const _n = new THREE.Vector3();

function normalizeGeo(g) {
  let geo = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
  if (!geo.attributes.normal) geo.computeVertexNormals();
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
  geo.clearGroups();
  return geo;
}

/** 世界空间盒式投影 UV；scale = 每米贴图重复次数 */
export function boxUV(geo, scale = 0.25, offset = [0, 0]) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    _n.fromBufferAttribute(n, i);
    const ax = Math.abs(_n.x), ay = Math.abs(_n.y), az = Math.abs(_n.z);
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let u, v;
    if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
    uv.setXY(i, u * scale + offset[0], v * scale + offset[1]);
  }
  uv.needsUpdate = true;
}

export class Batch {
  constructor() { this.parts = new Map(); this.colliders = []; }
  /**
   * @param key 材质键
   * @param geo 几何
   * @param matrix 变换（或 {pos, rot, scale}）
   * @param o { uv: 每米重复(数字)，或 false 保留原 UV；collide: 是否加入碰撞 }
   */
  add(key, geo, matrix, o = {}) {
    let mtx = matrix;
    if (!matrix) mtx = _m.identity();
    else if (!(matrix instanceof THREE.Matrix4)) {
      const { pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1] } = matrix;
      mtx = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...(Array.isArray(scale) ? scale : [scale, scale, scale])));
    }
    const g = normalizeGeo(geo);
    if (o.fitUV || (key === 'glassIn' && o.uv === false)) { // 彩窗：每扇窗 UV 归一化到 0..1，整窗构图贴图不被裁切
      g.computeBoundingBox(); const bb = g.boundingBox, uv = g.attributes.uv, p = g.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - bb.min.x) / Math.max(1e-4, bb.max.x - bb.min.x), (p.getY(i) - bb.min.y) / Math.max(1e-4, bb.max.y - bb.min.y));
    }
    g.applyMatrix4(mtx);
    if (o.uv !== false) boxUV(g, o.uv ?? 0.25);
    if (!this.parts.has(key)) this.parts.set(key, []);
    this.parts.get(key).push(g);
    if (o.collide) this.colliders.push(g);
    return g;
  }
  box(key, w, h, d, pos, o = {}) {
    return this.add(key, new THREE.BoxGeometry(w, h, d), { pos, rot: o.rot || [0, 0, 0] }, o);
  }
  /** 合并输出到 parent；mats: {key: Material} */
  build(parent, mats, { shadow = true } = {}) {
    const meshes = [];
    for (const [key, list] of this.parts) {
      const mat = mats[key];
      if (!mat) { console.warn('缺少材质', key); continue; }
      // 分块合并，避免单个几何过大
      for (let i = 0; i < list.length; i += 4000) {
        const merged = mergeGeometries(list.slice(i, i + 4000), false);
        merged.computeBoundingSphere();
        const mesh = new THREE.Mesh(merged, mat);
        mesh.castShadow = shadow && !mat.transparent && !mat.userData.noShadow;
        mesh.receiveShadow = true;
        mesh.name = key;
        mesh.matrixAutoUpdate = false;
        parent.add(mesh);
        meshes.push(mesh);
      }
    }
    this.parts.clear();
    return meshes;
  }
}
