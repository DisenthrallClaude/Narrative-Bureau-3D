// 氛围特效：体积光柱、尘埃、水面、旗帜布料、LED 屏、彩色玻璃
import * as THREE from 'three';

export const time = { value: 0 };

/** 体积光柱：从 (from) 沿方向投射的截锥，叠加噪声与视角衰减 */
export function lightShaft({ from, to, r0 = 1, r1 = 3, color = 0xffe2b0, intensity = 0.25, shape = 'cone' }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  let geo;
  if (shape === 'box') { geo = new THREE.BoxGeometry(r0 * 2, len, r0 * 0.5, 1, 8, 1); }
  else geo = new THREE.CylinderGeometry(r0, r1, len, 24, 8, true);
  geo.translate(0, -len / 2, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: time, uColor: { value: new THREE.Color(color) }, uInt: { value: intensity }, uLen: { value: len } },
    vertexShader: `varying vec3 vPos; varying vec3 vN; varying vec3 vView; varying vec3 vW;
      void main(){ vPos = position; vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; vN = normalize(mat3(modelMatrix)*normal); vView = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uInt; uniform float uLen; varying vec3 vPos; varying vec3 vN; varying vec3 vView; varying vec3 vW;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      void main(){
        float t = clamp(-vPos.y / uLen, 0., 1.);
        float fadeEnds = smoothstep(0.0, 0.12, t) * (1. - smoothstep(0.45, 0.95, t));
        vec3 toC = cameraPosition - vW; float near = smoothstep(0.5, 4.0, length(toC));
        float edge = pow(abs(dot(normalize(vN), vView)), 1.6);
        float n = n3(vW*0.35 + vec3(0., -uTime*0.08, uTime*0.05)) * 0.6 + n3(vW*1.3 + vec3(uTime*0.1,0.,0.))*0.4;
        float a = fadeEnds * edge * near * (0.55 + 0.45*n) * uInt;
        gl_FragColor = vec4(uColor * a, a);
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(a);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), b.clone().sub(a).normalize());
  m.renderOrder = 10;
  m.userData.noShadow = true;
  m.castShadow = false; m.receiveShadow = false;
  m.userData.isShaft = true;
  return m;
}

/** 漂浮尘埃（体积光内的微粒） */
export function dust(center, size, count = 600, color = 0xffe8c0) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3), s = new Float32Array(count);
  for (let i = 0; i < count; i++) { p[i * 3] = (Math.random() - 0.5) * size[0]; p[i * 3 + 1] = Math.random() * size[1]; p[i * 3 + 2] = (Math.random() - 0.5) * size[2]; s[i] = Math.random(); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(s, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: time, uColor: { value: new THREE.Color(color) }, uH: { value: size[1] } },
    vertexShader: `attribute float seed; uniform float uTime; uniform float uH; varying float vA;
      void main(){ vec3 p = position; p.y = mod(p.y + uTime*0.05*(0.3+seed), uH); p.x += sin(uTime*0.3+seed*30.)*0.4; p.z += cos(uTime*0.25+seed*20.)*0.4;
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; gl_PointSize = min(3.5, (0.6+seed*1.2) * (14. / -mv.z)); vA = 0.5*smoothstep(30.,3.,-mv.z)*smoothstep(1.5,4.,-mv.z); }`,
    fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(uColor, vA*(1.-d*2.)); }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.position.set(...center);
  pts.frustumCulled = false;
  return pts;
}

/** 程序化水面法线贴图 */
let waterNormal = null;
function getWaterNormal() {
  if (waterNormal) return waterNormal;
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(N, N);
  const hgt = new Float32Array(N * N);
  for (let k = 0; k < 40; k++) {
    const fx = Math.floor(Math.random() * 6 + 1), fy = Math.floor(Math.random() * 6 + 1), ph = Math.random() * 6.28, amp = 1 / (fx + fy);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) hgt[y * N + x] += Math.sin(((x * fx + y * fy) / N) * Math.PI * 2 + ph) * amp;
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = hgt[y * N + ((x + 1) % N)] - hgt[y * N + ((x + N - 1) % N)];
    const dy = hgt[((y + 1) % N) * N + x] - hgt[((y + N - 1) % N) * N + x];
    const v = new THREE.Vector3(-dx * 2, -dy * 2, 1).normalize();
    const i = (y * N + x) * 4; img.data[i] = (v.x * 0.5 + 0.5) * 255; img.data[i + 1] = (v.y * 0.5 + 0.5) * 255; img.data[i + 2] = (v.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  waterNormal = new THREE.CanvasTexture(cv); waterNormal.wrapS = waterNormal.wrapT = THREE.RepeatWrapping;
  return waterNormal;
}
export function waterMaterial(color = 0x0a1a24) {
  const n1 = getWaterNormal().clone(); n1.repeat.set(3, 3);
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.04, metalness: 0.0, normalMap: n1, normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 1.4, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.92 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = time;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <normal_fragment_maps>', `
        vec3 mapN = texture2D(normalMap, vNormalMapUv + vec2(uTime*0.02, uTime*0.013)).xyz * 2.0 - 1.0;
        vec3 mapN2 = texture2D(normalMap, vNormalMapUv*1.7 - vec2(uTime*0.017, -uTime*0.021)).xyz * 2.0 - 1.0;
        mapN = normalize(vec3((mapN.xy + mapN2.xy) * normalScale, mapN.z * mapN2.z));
        normal = normalize( tbn * mapN );`);
  };
  m.userData.noShadow = true;
  return m;
}
/** 下落水帘（滚动透明） */
export function waterfallMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uTime: time },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      float h(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      void main(){
        // 细长下落水丝：x 方向高频、y 方向随时间滚动（平滑噪声，无块状走样）
        float t = uTime;
        float a1 = n(vec2(vUv.x * 140.0, vUv.y * 3.0 + t * 2.6));
        float a2 = n(vec2(vUv.x * 310.0 + 7.0, vUv.y * 6.0 + t * 3.9));
        float a3 = n(vec2(vUv.x * 60.0 + 3.0, vUv.y * 1.5 + t * 1.7));
        float s = pow(a1 * 0.55 + a2 * 0.3 + a3 * 0.35, 2.2);
        float edge = smoothstep(0.0, 0.12, vUv.y) * (0.65 + 0.35 * smoothstep(1.0, 0.7, vUv.y));
        float foam = smoothstep(0.25, 0.0, vUv.y) * n(vec2(vUv.x * 80.0, t * 6.0)) * 0.5;
        float a = clamp(s * 0.55 + foam, 0.0, 1.0) * edge;
        gl_FragColor = vec4(vec3(0.78, 0.88, 0.98) * a, a);
      }`,
  });
}

/** 旗帜布料：顶点着色器风动 */
export function bannerMaterial(map, color = 0x14244d) {
  const m = new THREE.MeshStandardMaterial({ map, color, roughness: 0.75, metalness: 0.05, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = time;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float wv = (1.0 - uv.y);
        float ph = position.x * 0.8 + modelMatrix[3][0]*0.3 + modelMatrix[3][2]*0.2;
        transformed.z += sin(uTime*1.6 + position.y*0.9 + ph) * 0.18 * wv + sin(uTime*2.7 + position.y*2.1)*0.05*wv;`);
  };
  m.customProgramCacheKey = () => 'banner';
  return m;
}

/** 动态 canvas 屏幕（LED 大屏）：draw(ctx, t) 每 0.5s 调用 */
export class CanvasScreen {
  constructor(w, h, draw, { fps = 2, intensity = 1.6 } = {}) {
    this.cv = document.createElement('canvas'); this.cv.width = w; this.cv.height = h;
    this.ctx = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.draw = draw; this.interval = 1 / fps; this.acc = 1e9;
    this.mat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: this.tex, emissiveIntensity: intensity, roughness: 0.25, metalness: 0 });
  }
  update(dt, t) { this.acc += dt; if (this.acc >= this.interval) { this.acc = 0; this.draw(this.ctx, t, this.cv.width, this.cv.height); this.tex.needsUpdate = true; } }
}

/** 彩色玻璃（程序化铅条花窗），用于室内侧发光窗 */
export function stainedGlassTexture(seed = 1) {
  // M4：整窗构图（UV 已按每扇窗归一化）：宝石红/金边框 + 深蓝菱格底 + 三个纹章圆（罗盘十字 / 翻开的书 / 天平与钥匙）+ 粗铅条
  const W = 512, H = 1400, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const lead = '#060606';
  c.fillStyle = lead; c.fillRect(0, 0, W, H);
  // 菱格底（深蓝明暗变化）
  const cell = 40;
  for (let y = 0; y < H + cell; y += cell / 2) for (let x = 0; x < W + cell; x += cell) {
    const ox = ((y / (cell / 2)) % 2) * cell / 2, v = rnd();
    c.fillStyle = v < 0.08 ? '#d9a640' : v < 0.14 ? '#8f1a26' : ['#123a9a', '#0c2a78', '#1b4fb8', '#163a8a'][Math.floor(rnd() * 4)];
    c.beginPath(); c.moveTo(x + ox, y - cell / 2 + 3); c.lineTo(x + ox + cell / 2 - 3, y); c.lineTo(x + ox, y + cell / 2 - 3); c.lineTo(x + ox - cell / 2 + 3, y); c.closePath(); c.fill();
  }
  // 边框：宝石红与金色交替小块
  for (let y = 0; y < H; y += 28) for (const x of [0, W - 34]) { c.fillStyle = lead; c.fillRect(x, y, 34, 28); c.fillStyle = (y / 28) % 2 ? '#8f1a26' : '#d9a640'; c.fillRect(x + 5, y + 4, 24, 20); }
  const medal = (cy, r, draw) => {
    c.fillStyle = lead; c.beginPath(); c.arc(W / 2, cy, r + 12, 0, 7); c.fill();
    c.fillStyle = '#d9a640'; c.beginPath(); c.arc(W / 2, cy, r + 6, 0, 7); c.fill();
    c.fillStyle = lead; c.beginPath(); c.arc(W / 2, cy, r, 0, 7); c.fill();
    c.fillStyle = '#0e2c74'; c.beginPath(); c.arc(W / 2, cy, r - 6, 0, 7); c.fill();
    c.save(); c.translate(W / 2, cy); draw(r - 6); c.restore();
  };
  const star = (R, ri, n, rot, col) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 + rot; const rr = i % 2 ? ri : R; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); };
  medal(H * 0.24, W * 0.3, (r) => { star(r * 0.92, r * 0.14, 4, -Math.PI / 2, '#f0c95a'); star(r * 0.5, r * 0.1, 4, -Math.PI / 4, '#e8e0c8'); c.strokeStyle = lead; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, r * 0.62, 0, 7); c.stroke(); c.fillStyle = '#8f1a26'; c.beginPath(); c.arc(0, 0, r * 0.12, 0, 7); c.fill(); });
  medal(H * 0.52, W * 0.3, (r) => { c.fillStyle = '#e8e0c8'; for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(0, r * 0.25); c.quadraticCurveTo(sx * r * 0.4, r * 0.05, sx * r * 0.78, r * 0.2); c.lineTo(sx * r * 0.78, -r * 0.35); c.quadraticCurveTo(sx * r * 0.4, -r * 0.5, 0, -r * 0.3); c.closePath(); c.fill(); } c.strokeStyle = lead; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -r * 0.3); c.lineTo(0, r * 0.25); c.stroke(); c.fillStyle = '#d9a640'; c.beginPath(); c.moveTo(r * 0.1, -r * 0.85); c.lineTo(r * 0.2, -r * 0.82); c.lineTo(-r * 0.05, r * 0.05); c.closePath(); c.fill(); for (let k = 0; k < 5; k++) { c.fillStyle = '#f0c95a'; c.fillRect(-r * 0.9 + k * r * 0.4, r * 0.45, r * 0.18, r * 0.35); } });
  medal(H * 0.8, W * 0.3, (r) => { c.strokeStyle = '#f0c95a'; c.lineWidth = 8; c.beginPath(); c.moveTo(0, -r * 0.7); c.lineTo(0, r * 0.6); c.moveTo(-r * 0.65, -r * 0.4); c.lineTo(r * 0.65, -r * 0.4); c.stroke(); for (const sx of [-1, 1]) { c.fillStyle = '#d9a640'; c.beginPath(); c.arc(sx * r * 0.55, r * 0.05, r * 0.25, 0, Math.PI); c.fill(); } c.fillStyle = '#e8e0c8'; c.fillRect(-r * 0.4, r * 0.55, r * 0.8, r * 0.12); c.fillStyle = '#8f1a26'; c.beginPath(); c.arc(0, -r * 0.75, r * 0.1, 0, 7); c.fill(); });
  // 顶部三叶花格
  for (const [x, y, r] of [[W / 2, H * 0.06, 34], [W / 2 - 46, H * 0.09, 26], [W / 2 + 46, H * 0.09, 26]]) { c.fillStyle = lead; c.beginPath(); c.arc(x, y, r + 7, 0, 7); c.fill(); c.fillStyle = '#d9a640'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  // 横向铅条（窗格）
  c.fillStyle = lead; for (let y = H * 0.38; y < H; y += H * 0.28) c.fillRect(0, y - 5, W, 10);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** 玫瑰窗彩色玻璃（径向花瓣） */
export function roseGlassTexture() {
  const N = 1024, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d'); c.translate(N / 2, N / 2);
  c.fillStyle = '#0a0a0c'; c.fillRect(-N / 2, -N / 2, N, N);
  const cols = ['#123a9a', '#8f1a26', '#d9a640', '#1b4fb8', '#1d6f80', '#0c2a78'];
  for (let ring = 0; ring < 4; ring++) {
    const r0 = 60 + ring * 110, r1 = r0 + 100, n = 8 * (ring + 1);
    for (let j = 0; j < n; j++) { c.fillStyle = cols[(j + ring) % cols.length]; c.beginPath(); c.arc(0, 0, r1, (j / n) * Math.PI * 2 + 0.02, ((j + 1) / n) * Math.PI * 2 - 0.02); c.arc(0, 0, r0, ((j + 1) / n) * Math.PI * 2 - 0.02, (j / n) * Math.PI * 2 + 0.02, true); c.closePath(); c.fill(); }
  }
  c.fillStyle = '#f0c95a'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2; const rr = i % 2 ? 14 : 52; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
