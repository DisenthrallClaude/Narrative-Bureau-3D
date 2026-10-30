// R3 批次10：程序化室内区的离线环境光遮蔽烘焙（AO 光照贴图）
// 流程：截图模式页面里 exportBake(id) 把该区「接收面」（墙/地/顶等非实例网格，世界坐标三角形）+「遮挡体」（区内全部可见网格，实例化件按实例矩阵）
//      POST 给 tools/bake_export.mjs → Blender（tools/blender/bake_ao_zone.py）Cycles AO 烘焙到 2048 图集，输出每个接收面每个三角角点的 uv1
//      → public/assets/bake/<id>_ao.webp + <id>_uv.bin + <id>.json。运行时 applyBakes 按「世界包围盒 + 顶点数」键匹配网格，换成带 uv1 的非索引几何，
//      材质按区克隆并打 aoPatch（压间接漫反射/镜面 + 部分直射，补家具落地、墙角、柜间的接触阴影）。
import * as THREE from 'three';
import { hallMats } from '../world/hero.js';

// box = [x0, x1, y0, y1, z0, z1]（世界坐标）
export const BAKES = {
  training: { group: 'training', box: [-33, 33, -52.6, -30, -157, -91] },
  command_center: { group: 'east_wing', box: [17.2, 57.2, 8.3, 15.4, -61.6, -30.6] },
  archive: { group: 'archive', box: [-57.6, -17.2, 1.3, 40, -71.6, -30.6] },
  s7_ops: { group: 'seventh', box: [-10.4, 10.4, -500.6, -485, -134.4, -111.6] },
  b5: { group: 'vault_b5', box: [-40, 40, -42.6, -34.5, -140, -85] },
};

const _b = new THREE.Box3();
function wbox(o) { const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); return _b.copy(g.boundingBox).applyMatrix4(o.matrixWorld); }
export function bakeKey(o) {
  const g = o.geometry, b = wbox(o), r = (v) => Math.round(v * 100);
  return `${g.attributes.position.count}_${g.index ? g.index.count : 0}_${r(b.min.x)}_${r(b.min.y)}_${r(b.min.z)}_${r(b.max.x)}_${r(b.max.y)}_${r(b.max.z)}`;
}
const inBox = (b, B, pad = 0) => b.max.x > B[0] - pad && b.min.x < B[1] + pad && b.max.y > B[2] - pad && b.min.y < B[3] + pad && b.max.z > B[4] - pad && b.min.z < B[5] + pad;
const okMat = (m) => m && !Array.isArray(m) && m.visible !== false && !m.isMeshBasicMaterial && !m.isShaderMaterial && !(m.transparent && m.opacity < 0.6) && !m.userData.lm;
// 已经用到第二套 UV 的材质（大厅光照贴图补丁 lightmapPatch、three 原生 lightMap/aoMap、任一贴图 channel≠0）不能再接 uv1：原来 uv1 缺省=(0,0) 只采一个像素，
// 换上烘焙 uv1 后会把整张别的贴图铺上墙（批次10 档案馆绿墙变成大厅照片的根因）
let HALLSET = null;
const usesUv1 = (m) => { HALLSET ??= new Set(Object.values(hallMats())); if (m.lightMap || m.aoMap || m.userData.lm || m.userData.reflStrength !== undefined || HALLSET.has(m)) return true; /* 大厅精修材质异步打光照贴图补丁（导出时可能还没打）→ 一律跳过 */ for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'bumpMap', 'alphaMap']) if (m[k] && m[k].channel) return true; try { if (String(m.customProgramCacheKey?.() ?? '').includes('|lm')) return true; } catch { /* */ } return false; };
function isRecv(o, B) {
  if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.geometry?.attributes.position || !okMat(o.material)) return false;
  if (!(o.material.isMeshStandardMaterial || o.material.isMeshLambertMaterial || o.material.isMeshPhongMaterial) || usesUv1(o.material)) return false;
  const g = o.geometry; const n = g.index ? g.index.count : g.attributes.position.count; if (n > 600000 || n < 3) return false;
  const b = wbox(o); if (!inBox(b, B)) return false;
  const s = b.getSize(new THREE.Vector3()); return Math.max(s.x, s.y, s.z) > 0.9; // 小件（<0.9 m）只当遮挡体
}
function visibleChain(o, root) { for (let a = o; a && a !== root; a = a.parent) if (!a.visible) return false; return true; }

/** 截图模式：导出一个区的接收面 + 遮挡体，POST 到 url */
export async function exportBake(scene, id, url) {
  const S = BAKES[id]; const root = scene.getObjectByName(S.group); const B = S.box;
  scene.updateMatrixWorld(true);
  const recv = [], occG = [], occI = [], bufs = []; let off = 0, occTris = 0;
  const push = (arr) => { bufs.push(arr); const o = off; off += arr.byteLength; return o; };
  const gid = new Map();
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes.position || !visibleChain(o, root)) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m.visible === false || m.isMeshBasicMaterial || (m.transparent && m.opacity < 0.6)) return;
    const g = o.geometry; const pos = g.attributes.position;
    if (isRecv(o, B)) {
      const n = pos.count; const P = new Float32Array(n * 3); const v = new THREE.Vector3();
      for (let i = 0; i < n; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; }
      let I;
      if (g.index) I = Uint32Array.from(g.index.array);
      else { // 非索引：按位置焊接（角点顺序不变 → 运行时直接按原顶点顺序贴 uv1）
        const h = new Map(); I = new Uint32Array(n);
        for (let i = 0; i < n; i++) { const k = `${Math.round(P[i * 3] * 1e4)},${Math.round(P[i * 3 + 1] * 1e4)},${Math.round(P[i * 3 + 2] * 1e4)}`; let j = h.get(k); if (j === undefined) { j = i; h.set(k, i); } I[i] = j; }
      }
      recv.push({ key: bakeKey(o), nv: n, ni: I.length, v: push(P), i: push(I), name: o.name || m.name || '' });
      occTris += I.length / 3; return;
    }
    // 遮挡体：几何共享（实例/克隆）+ 世界矩阵
    if (o.isInstancedMesh) { g.computeBoundingBox(); }
    const n = g.index ? g.index.count : pos.count; if (n < 3) return;
    const mats = [];
    if (o.isInstancedMesh) { const im = new THREE.Matrix4(), w = new THREE.Matrix4(); for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, im); w.multiplyMatrices(o.matrixWorld, im); if (!g.boundingBox) g.computeBoundingBox(); _b.copy(g.boundingBox).applyMatrix4(w); if (inBox(_b, B, 0.5)) mats.push(w.clone()); } }
    else { if (inBox(wbox(o), B, 0.5)) mats.push(o.matrixWorld.clone()); }
    if (!mats.length) return;
    let gi = gid.get(g.uuid);
    if (gi === undefined) {
      const P = new Float32Array(pos.count * 3); for (let i = 0; i < pos.count; i++) { P[i * 3] = pos.getX(i); P[i * 3 + 1] = pos.getY(i); P[i * 3 + 2] = pos.getZ(i); }
      const I = g.index ? Uint32Array.from(g.index.array) : Uint32Array.from({ length: pos.count }, (_, i) => i);
      gi = occG.length; gid.set(g.uuid, gi); occG.push({ nv: pos.count, ni: I.length, v: push(P), i: push(I) });
    }
    for (const w of mats) { occI.push({ g: gi, m: Array.from(w.elements) }); occTris += n / 3; }
  });
  const head = { id, box: B, recv, occG, occI, bytes: off };
  const blob = new Blob(bufs);
  await fetch(url + '?name=' + id + '.bin', { method: 'POST', body: blob });
  await fetch(url + '?name=' + id + '.json', { method: 'POST', body: JSON.stringify(head) });
  return { id, recv: recv.length, recvTris: recv.reduce((s, r) => s + r.ni / 3, 0), occGeoms: occG.length, occInst: occI.length, occTris, mb: (off / 1048576).toFixed(1) };
}

/** AO 补丁：uv1 采样 AO 图；压间接漫反射 / 间接镜面，直射按 direct 比例压（点光无实时投影 → 用 AO 补接触阴影） */
export function aoPatch(mat, tex, { direct = 0.5, gamma = 1.0, norm = 0.9 } = {}) { // norm：AO≥norm 视为全亮（开阔地面不整体压暗，只加接触阴影）
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r);
    sh.uniforms.nbAO = { value: tex };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 uv1;\nvarying vec2 vNbAOuv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvNbAOuv = uv1;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D nbAO; varying vec2 vNbAOuv;')
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        { float nbA = pow(clamp(texture2D(nbAO, vNbAOuv).r / ${norm.toFixed(3)}, 0.0, 1.0), ${gamma.toFixed(2)});
          reflectedLight.indirectDiffuse *= nbA;
          reflectedLight.indirectSpecular *= mix(1.0, nbA, 0.85);
          reflectedLight.directDiffuse *= mix(1.0, nbA, ${direct.toFixed(2)});
          reflectedLight.directSpecular *= mix(1.0, nbA, ${(direct * 0.7).toFixed(2)}); }`);
  };
  const k = mat.customProgramCacheKey?.bind(mat);
  mat.customProgramCacheKey = () => (k ? k() : '') + '|bakeao' + direct + gamma + norm;
  mat.userData.bakeAO = true; mat.needsUpdate = true;
  return mat;
}
function cloneMat(m) {
  const c = m.clone();
  if (Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile')) c.onBeforeCompile = m.onBeforeCompile;
  if (Object.prototype.hasOwnProperty.call(m, 'customProgramCacheKey')) c.customProgramCacheKey = m.customProgramCacheKey;
  return c;
}

const STATE = {};
/** 加载并应用烘焙（可重复调用：只匹配尚未匹配的键；?noao=1 关闭） */
export async function applyBakes(scene, ids = Object.keys(BAKES), opts = {}) {
  if (/[?&]noao=1/.test(location.search)) return;
  const loader = new THREE.TextureLoader();
  for (const id of ids) {
    let st = STATE[id];
    if (!st) {
      st = STATE[id] = { pending: null };
      st.pending = (async () => {
        const base = './assets/bake/' + id;
        const head = await fetch(base + '.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
        if (!head) { st.dead = true; return; }
        const uv = await fetch(base + '_uv.bin').then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
        if (!uv) { st.dead = true; return; }
        const tex = await loader.loadAsync(base + '_ao.webp').catch(() => null);
        if (!tex) { st.dead = true; return; }
        tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
        st.tex = /[?&]aowhite=1/.test(location.search) ? Object.assign(new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1), { needsUpdate: true }) : tex; st.uv = new Uint16Array(uv); st.map = new Map(head.recv.map((r) => [r.key, r])); st.left = new Set(st.map.keys()); st.mats = new Map(); st.direct = 0.5; st.norm = 0.9;
      })();
    }
    await st.pending;
    if (st.dead || !st.left.size) continue;
    const S = BAKES[id]; const root = scene.getObjectByName(S.group); if (!root) continue;
    root.updateMatrixWorld(true); let hit = 0;
    root.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.userData.bakeAO || !o.geometry?.attributes.position || Array.isArray(o.material) || usesUv1(o.material)) return;
      const k = bakeKey(o); if (!st.left.has(k)) return;
      const r = st.map.get(k); const g0 = o.geometry;
      const g = g0.index ? g0.toNonIndexed() : g0.clone();
      if (g.attributes.position.count !== r.ni) return;
      const a = new Float32Array(r.ni * 2); const src = st.uv.subarray(r.uv, r.uv + r.ni * 2);
      for (let i = 0; i < a.length; i++) a[i] = src[i] / 65535;
      g.setAttribute('uv1', new THREE.BufferAttribute(a, 2));
      o.geometry = g; o.userData.bakeAO = true;
      let m = st.mats.get(o.material.uuid);
      if (!m) { m = aoPatch(cloneMat(o.material), st.tex, { direct: st.direct, norm: st.norm }); st.mats.set(o.material.uuid, m); }
      o.material = m; st.left.delete(k); hit++;
    });
    opts.log?.(`bake ${id}: +${hit} matched, ${st.left.size} left / ${st.map.size}`);
  }
}
