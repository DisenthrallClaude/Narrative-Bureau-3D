// 碰撞：静态几何合并为 BVH 碰撞体；胶囊体角色控制（可上台阶/坡道，重力，贴地）
import * as THREE from 'three';
import { MeshBVH, computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export class World {
  constructor() { this.geos = []; this.collider = null; this.surfaces = []; }
  /** 加入碰撞几何（已是世界坐标） */
  addGeo(g) {
    let geo = g.index ? g.toNonIndexed() : g.clone();
    for (const k of Object.keys(geo.attributes)) if (k !== 'position') geo.deleteAttribute(k);
    this.geos.push(geo);
  }
  /** 轴对齐碰撞盒 */
  box(cx, cy, cz, w, h, d, rotY = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(cx, cy, cz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY), new THREE.Vector3(1, 1, 1)));
    this.addGeo(g);
  }
  /** 斜坡（楼梯碰撞）：从 (x0,y0,z0) 到 (x1,y1,z1)，宽 w，沿两点连线 */
  ramp(a, b, w) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const dir = B.clone().sub(A); const len = dir.length();
    const g = new THREE.BoxGeometry(w, 0.1, len);
    const yaw = Math.atan2(dir.x, dir.z);
    const pitch = -Math.asin(dir.y / len);
    g.applyMatrix4(new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ')), new THREE.Vector3(1, 1, 1)));
    this.addGeo(g);
  }
  /** 从对象包围盒加碰撞（道具） */
  boundsOf(obj, shrink = 0.9) {
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    const s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    this.box(c.x, c.y, c.z, s.x * shrink, s.y, s.z * shrink);
  }
  /** 地面材质区域（脚步声）：{ box: Box3, type } */
  surface(minX, minZ, maxX, maxZ, type, minY = -100, maxY = 100) { this.surfaces.push({ b: new THREE.Box3(new THREE.Vector3(minX, minY, minZ), new THREE.Vector3(maxX, maxY, maxZ)), type }); }
  surfaceAt(p) { for (let i = this.surfaces.length - 1; i >= 0; i--) if (this.surfaces[i].b.containsPoint(p)) return this.surfaces[i].type; return 'stone'; }
  build() {
    const merged = mergeGeometries(this.geos, false);
    merged.boundsTree = new MeshBVH(merged);
    this.collider = new THREE.Mesh(merged, new THREE.MeshBasicMaterial({ wireframe: true, color: 0x00ff00 }));
    this.collider.visible = false;
    this.geos = [];
    return this.collider;
  }
}

const tmpBox = new THREE.Box3(), tmpSeg = new THREE.Line3(), tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tri = new THREE.Vector3();

export class Player {
  constructor(world) {
    this.world = world;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.radius = 0.32;
    this.seg = new THREE.Line3(new THREE.Vector3(0, 0.34, 0), new THREE.Vector3(0, 1.42, 0));
    this.onGround = false;
    this.eye = 1.62;
    this.yaw = 0; this.pitch = 0;
    this.walk = 3.2; this.run = 6.0;
    this.bob = 0; this.stepDist = 0;
    this.noclip = false;
  }
  update(dt, input) {
    const steps = 4; const h = Math.min(dt, 0.05) / steps;
    for (let i = 0; i < steps; i++) this.step(h, input);
  }
  step(dt, input) {
    const speed = input.run ? this.run : this.walk;
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wish = new THREE.Vector3().addScaledVector(fwd, input.f).addScaledVector(right, input.r);
    if (wish.lengthSq() > 1) wish.normalize();
    const target = wish.multiplyScalar(speed);
    const acc = this.onGround ? 12 : 3;
    this.vel.x += (target.x - this.vel.x) * Math.min(1, acc * dt);
    this.vel.z += (target.z - this.vel.z) * Math.min(1, acc * dt);
    if (this.noclip) { this.pos.addScaledVector(this.vel, dt); this.pos.y += (input.up - input.down) * speed * dt; this.vel.y = 0; return; }
    this.vel.y += (this.onGround ? -2 : -22) * dt;
    if (input.jump && this.onGround) { this.vel.y = 5.2; this.onGround = false; }
    const before = this.pos.clone();
    this.pos.addScaledVector(this.vel, dt);
    const col = this.world.collider; if (!col) return;
    tmpSeg.copy(this.seg); tmpSeg.start.add(this.pos); tmpSeg.end.add(this.pos);
    tmpBox.makeEmpty(); tmpBox.expandByPoint(tmpSeg.start); tmpBox.expandByPoint(tmpSeg.end);
    tmpBox.min.addScalar(-this.radius); tmpBox.max.addScalar(this.radius);
    const r = this.radius;
    col.geometry.boundsTree.shapecast({
      intersectsBounds: (box) => box.intersectsBox(tmpBox),
      intersectsTriangle: (t) => {
        const triPoint = tmpV, capPoint = tmpV2;
        const d = t.closestPointToSegment(tmpSeg, triPoint, capPoint);
        if (d < r) {
          const depth = r - d;
          const dir = capPoint.sub(triPoint).normalize();
          tmpSeg.start.addScaledVector(dir, depth); tmpSeg.end.addScaledVector(dir, depth);
        }
      },
    });
    const newPos = tri.copy(tmpSeg.start).sub(this.seg.start);
    const delta = newPos.clone().sub(this.pos);
    this.onGround = delta.y > Math.abs(dt * this.vel.y * 0.25);
    const off = Math.max(0, delta.length() - 1e-5);
    delta.normalize().multiplyScalar(off);
    this.pos.add(delta);
    if (this.onGround) this.vel.y = 0; else if (delta.y < 0 && this.vel.y > 0) this.vel.y = 0;
    else { delta.normalize(); this.vel.addScaledVector(delta, -delta.dot(this.vel)); }
    // M7：坠落重生——墨渊（地坪 −300）与装订线（地坪 −500）在深处，原先 y<−60 一律拉回广场，导致两大隐藏区一进去就被弹回开场
    { const y = this.pos.y, deep = (y > -340 && y < -150) || (y > -540 && y < -380); if ((y < -60 && !deep) || y < -540) { this.pos.copy(this.spawn ?? new THREE.Vector3(0, 2, 60)); this.vel.set(0, 0, 0); }
      else if (deep && y < -315 && y > -340) { this.pos.set(0, -299.95, -58); this.vel.set(0, 0, 0); } // 墨渊坠落 → 折页门
      else if (deep && y < -515) { this.pos.set(0, -499.95, -57); this.vel.set(0, 0, 0); } } // 装订线坠落 → 页缝入口
    const moved = Math.hypot(this.pos.x - before.x, this.pos.z - before.z);
    if (this.onGround) { this.stepDist += moved; this.bob += moved * 2.2; }
  }
  applyCamera(cam) {
    cam.position.set(this.pos.x, this.pos.y + this.eye + Math.sin(this.bob) * 0.025, this.pos.z);
    cam.rotation.set(this.pitch, this.yaw, Math.sin(this.bob * 0.5) * 0.002, 'YXZ');
  }
}
