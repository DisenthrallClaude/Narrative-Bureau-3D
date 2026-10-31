// 批次 E2：特效批第二轮 + B1 冷色治理（续 E1，全部暖色，禁蓝绿；新增自发光 / 输出峰值 < 1.0）。
//   1. b1warm：archive_b1 分区内灯光改 3000K 暖白（0xffb46e），冷色自发光灯管改暖，所有受光材质在片元里去蓝 → 暖灰（克隆材质，不影响其它分区）。
//   2. fog（替换 E1 雾团）：沿前通道中线的低矮贴地雾带——自写体积着色器（盒内解析求交 + 步进 3D 噪声），密度 ≈0.3、高 0.6 m，
//      六个方向边界全部平滑淡出（无深度缓冲可读，用体积边界淡出代替软粒子，避免贴墙 / 贴物硬边），暖灰、缓慢流动。
//   3. runes：回写台浮晶片元输出改琥珀（按亮度乘琥珀色，峰值 0.9）。
//   4. gate：星纹提细节 / 密度；门洞内侧竖向铜框加贴边暖光（PointLight 不投影，挂在 abyss 分区组上，跟随分区可见性）。
// 开关沿用 E1：?nofx=1 全关；?e1off=gate,fog,runes；新增 ?e1off=b1warm,gaterim；?noe2=1 只关 E2 改动（回到 E1 状态）。
import * as THREE from 'three';

const P = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const E2 = !P.has('noe2');
export const E2_OFF = new Set((P.get('e1off') || '').split(',').filter(Boolean));
const WARM = 0xffb46e; // ≈3000K

const zoneGroup = (G, name) => { let z = null; G.scene.traverse((o) => { if (!z && o.name === name && o.parent === G.scene) z = o; }); return z; };

// —— 1. B1 冷色治理 ——
export function warmB1(G) {
  if (!E2 || E2_OFF.has('b1warm')) return 0;
  const zone = zoneGroup(G, 'archive_b1'); if (!zone) { console.warn('[E2] 缺 archive_b1 分组'); return 0; }
  const cache = new Map(); let nm = 0, nl = 0;
  const warmMat = (m) => {
    if (cache.has(m)) return cache.get(m);
    let c = m;
    if (m && (m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial)) {
      c = m.clone(); c.onBeforeCompile = m.onBeforeCompile; c.name = (m.name || '') + '_e2w';
      if (c.emissive && c.emissiveIntensity > 0 && c.emissive.b > c.emissive.r * 0.98 && c.emissive.b > 0.05) c.emissive.setHex(WARM); // 冷光灯管 → 暖
      const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey?.bind(m);
      c.onBeforeCompile = function (s, r) {
        if (prev) prev.call(this, s, r);
        s.fragmentShader = s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        { vec3 c0 = diffuseColor.rgb; float l0 = dot(c0, vec3(.299, .587, .114)); float cool = clamp((c0.b - c0.r) * 8.0, 0.0, 1.0);
          diffuseColor.rgb = mix(c0, l0 * vec3(1.10, 0.98, 0.80), max(cool, 0.55)); }`);
      };
      c.customProgramCacheKey = () => (prevKey ? prevKey() : '') + '|e2w';
      nm++;
    }
    cache.set(m, c); return c;
  };
  zone.traverse((o) => {
    if (o.isLight && o.color && o.color.b >= o.color.r * 0.98) { o.color.setHex(WARM); nl++; }
    if (o.isMesh && o.material && !o.userData.e2w) { o.userData.e2w = true; o.material = Array.isArray(o.material) ? o.material.map(warmMat) : warmMat(o.material); }
  });
  console.log('[E2] B1 warm', nm, 'mats', nl, 'lights');
  return nm;
}

// —— 2. 贴地雾带（体积） ——
const FOG_VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FOG_FS = `
uniform float uTime, uDensity; uniform vec3 uColor, uMin, uMax; uniform vec4 uFade; varying vec3 vW;
float h3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
float dens(vec3 p){
  // 边界软淡出：两端 uFade.x、两侧 uFade.y、顶部（高度指数衰减）；底面 = 地坪
  float fx = smoothstep(uMin.x, uMin.x + uFade.x, p.x) * (1.0 - smoothstep(uMax.x - uFade.x, uMax.x, p.x));
  float zc = (uMin.z + uMax.z) * .5, zh = (uMax.z - uMin.z) * .5; float fz = 1.0 - smoothstep(zh - uFade.y, zh, abs(p.z - zc));
  float hy = clamp((p.y - uMin.y) / (uMax.y - uMin.y), 0.0, 1.0); float fy = exp(-hy * 3.2) * (1.0 - smoothstep(.75, 1.0, hy));
  vec3 q = p * vec3(.55, 1.6, .9) + vec3(uTime * .10, 0.0, uTime * .035);
  float n = n3(q) * .6 + n3(q * 2.1 + vec3(3.1, uTime * .05, 1.7)) * .4;
  return fx * fz * fy * smoothstep(.28, .85, n);
}
void main(){
  vec3 ro = cameraPosition, rd = normalize(vW - cameraPosition);
  vec3 t0 = (uMin - ro) / rd, t1 = (uMax - ro) / rd; vec3 tn = min(t0, t1), tf = max(t0, t1);
  float a = max(max(max(tn.x, tn.y), tn.z), 0.0), b = min(min(tf.x, tf.y), tf.z); if (b <= a) discard;
  float st = (b - a) / float(STEPS), acc = 0.0; float j = h3(vW * 7.0 + uTime);
  for (int i = 0; i < STEPS; i++) { acc += dens(ro + rd * (a + (float(i) + j) * st)) * st; }
  float alpha = (1.0 - exp(-acc * 2.2)) * uDensity / 0.3 * 0.3; // uDensity 0.3 → 峰值不透明度约 0.3
  alpha = min(alpha, uDensity); if (alpha < .004) discard;
  gl_FragColor = vec4(uColor, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export function buildFogBand(root, { low = false, x0 = -52, x1 = -36.2, zc = -36.6, hw = 1.35, y0 = -4.2, h = 0.6, density = 0.3 } = {}) {
  const mn = new THREE.Vector3(x0, y0 + 0.01, zc - hw), mx = new THREE.Vector3(x1, y0 + h, zc + hw);
  const mat = new THREE.ShaderMaterial({
    vertexShader: FOG_VS, fragmentShader: FOG_FS, defines: { STEPS: low ? 6 : 12 }, transparent: true, depthWrite: false, depthTest: true,
    uniforms: { uTime: { value: 0 }, uDensity: { value: low ? density * 0.8 : density }, uColor: { value: new THREE.Color(0x8a7c68) }, uMin: { value: mn }, uMax: { value: mx }, uFade: { value: new THREE.Vector4(3.0, 0.9, 0, 0) } },
  });
  const geo = new THREE.BoxGeometry(mx.x - mn.x, mx.y - mn.y, mx.z - mn.z);
  const mesh = new THREE.Mesh(geo, mat); mesh.position.copy(mn).add(mx).multiplyScalar(0.5); mesh.name = 'e2_fogband'; mesh.renderOrder = 5;
  root.add(mesh);
  return { group: mesh, update(dt) { mat.uniforms.uTime.value += dt * 0.6; }, dispose() { geo.dispose(); mat.dispose(); } };
}

// —— 3. 浮晶琥珀：片元输出按亮度乘琥珀色（库 color 参数对晶体主体基本不生效） ——
export function amberize(group) {
  let n = 0;
  group.traverse((o) => {
    if (!o.isMesh || !o.material?.isShaderMaterial || o.userData.e2a) return; o.userData.e2a = true;
    const m = o.material; const fs = m.fragmentShader; const k = fs.lastIndexOf('}'); if (k < 0) return;
    m.fragmentShader = fs.slice(0, k) + `{ float l2 = dot(gl_FragColor.rgb, vec3(.299, .587, .114)); gl_FragColor.rgb = min(l2 * vec3(1.0, .64, .26) * 0.9, vec3(.9)); }\n` + fs.slice(k);
    m.needsUpdate = true; n++;
  });
  return n;
}

// —— 4. 深渊门内侧竖向铜框贴边暖光（不投影） ——
export function gateRim(G, AY = -300) {
  if (!E2 || E2_OFF.has('gaterim')) return 0;
  const zone = zoneGroup(G, 'abyss'); if (!zone) { console.warn('[E2] 缺 abyss 分组'); return 0; }
  let n = 0;
  for (const s of [-1, 1]) for (const y of [3.2, 8.4]) {
    const l = new THREE.PointLight(0xffb070, 6, 3.6, 2); l.castShadow = false; l.position.set(s * 5.3, AY + y, -79.4); l.name = 'e2_gate_rim'; zone.add(l); n++;
  }
  return n;
}
