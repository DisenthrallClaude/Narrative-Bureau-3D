// 交互：准星射线命中热点 → 提示 → E 触发；触发体积（进入区域、扫描门、静止计时、凝视）
import * as THREE from 'three';

const ray = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

export class Interactions {
  constructor(camera) { this.camera = camera; this.spots = []; this.volumes = []; this.looks = []; this.current = null; this.proxies = new THREE.Group(); this.proxies.name = 'interactProxies'; }
  /**
   * 热点：{ id, obj?(可射线命中对象), box?:[cx,cy,cz,w,h,d], range, prompt()|string, use(), enabled() }
   */
  add(spot) {
    if (!spot.obj && spot.box) {
      const [x, y, z, w, h, d] = spot.box;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
      m.position.set(x, y, z); this.proxies.add(m); spot.obj = m;
    }
    spot.range = spot.range ?? 3.2;
    spot.obj.traverse((o) => { o.userData.spot = spot; });
    this.spots.push(spot);
    return spot;
  }
  /** 触发体积：{ box: Box3 或 [minx,miny,minz,maxx,maxy,maxz], enter(), exit(), inside(dt), once } */
  volume(v) { if (Array.isArray(v.box)) v.box = new THREE.Box3(new THREE.Vector3(...v.box.slice(0, 3)), new THREE.Vector3(...v.box.slice(3))); v.in = false; this.volumes.push(v); return v; }
  /** 凝视：看向 target 点（半径 r 内）并保持 t 秒 */
  look(l) { l.acc = 0; this.looks.push(l); return l; }
  update(dt, playerPos, active) {
    // 体积
    const feet = playerPos.clone().add(new THREE.Vector3(0, 0.8, 0));
    for (const v of this.volumes) {
      if (v.done) continue;
      const inside = v.box.containsPoint(feet) && (!v.enabled || v.enabled());
      if (inside && !v.in) { v.in = true; v.enter?.(); if (v.once) v.done = true; }
      else if (!inside && v.in) { v.in = false; v.exit?.(); }
      if (inside) v.inside?.(dt);
    }
    if (!active) { this.current = null; return null; }
    // 凝视
    const dir = this.camera.getWorldDirection(new THREE.Vector3());
    for (const l of this.looks) {
      if (l.done || (l.enabled && !l.enabled())) continue;
      const to = l.target.clone().sub(this.camera.position); const dist = to.length();
      const ang = dir.angleTo(to);
      if (dist < (l.maxDist ?? 20) && Math.sin(ang) * dist < (l.r ?? 1) && ang < Math.PI / 2) { l.acc += dt; if (l.acc > (l.t ?? 3)) { l.done = !l.repeat; l.acc = 0; l.fire(); } } else l.acc = Math.max(0, l.acc - dt);
    }
    // 射线
    ray.setFromCamera(center, this.camera);
    ray.far = 32; ray.firstHitOnly = true;
    const objs = this.spots.filter((s) => !s.enabled || s.enabled()).map((s) => s.obj);
    const hit = ray.intersectObjects(objs, true)[0];
    let spot = null;
    if (hit) { let o = hit.object; while (o && !o.userData.spot) o = o.parent; spot = o?.userData.spot; if (spot && hit.distance > spot.range) spot = null;
      if (spot && this.blocker) { const bh = ray.intersectObject(this.blocker, false)[0]; if (bh && bh.distance < hit.distance - 0.35) spot = null; } }
    this.current = spot;
    return spot;
  }
}
