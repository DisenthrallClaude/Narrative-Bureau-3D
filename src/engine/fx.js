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
        float fadeEnds = smoothstep(0.0, 0.12, t) * (1. - smoothstep(0.65, 1.0, t));
        float edge = pow(abs(dot(normalize(vN), vView)), 1.6);
        float n = n3(vW*0.35 + vec3(0., -uTime*0.08, uTime*0.05)) * 0.6 + n3(vW*1.3 + vec3(uTime*0.1,0.,0.))*0.4;
        float a = fadeEnds * edge * (0.55 + 0.45*n) * uInt;
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
    fragmentShader: `uniform float uTime; varying vec2 vUv; float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
      void main(){ float x = floor(vUv.x*90.); float s = h(vec2(x,1.)); float v = fract(vUv.y*2. + uTime*(1.2+s) + s*10.);
        float streak = smoothstep(0.0,0.4,v)*smoothstep(1.0,0.6,v); float a = streak*(0.12+0.18*s)*smoothstep(0.,0.15,vUv.y);
        gl_FragColor = vec4(vec3(0.75,0.85,0.95)*a, a); }`,
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
  const W = 512, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const pick = () => { const r = rnd(); return r < 0.5 ? ['#123a9a', '#0c2a78', '#1b4fb8'][Math.floor(rnd() * 3)] : r < 0.68 ? '#8f1a26' : r < 0.86 ? ['#d9a640', '#f0c95a'][Math.floor(rnd() * 2)] : r < 0.95 ? '#1d6f80' : '#e8e0c8'; };
  c.fillStyle = '#0a0a0c'; c.fillRect(0, 0, W, H);
  // 菱形格底
  const cell = 46;
  for (let y = -cell; y < H + cell; y += cell / 2) for (let x = -cell; x < W + cell; x += cell) {
    const ox = ((y / (cell / 2)) % 2) * cell / 2;
    c.fillStyle = pick(); c.beginPath(); c.moveTo(x + ox, y - cell / 2 + 3); c.lineTo(x + ox + cell / 2 - 3, y); c.lineTo(x + ox, y + cell / 2 - 3); c.lineTo(x + ox - cell / 2 + 3, y); c.closePath(); c.fill();
  }
  // 圆形纹章（每块面板一个）
  for (let k = 0; k < 3; k++) {
    const cy = H * (0.2 + k * 0.3), r = W * 0.3;
    c.fillStyle = '#0a0a0c'; c.beginPath(); c.arc(W / 2, cy, r + 8, 0, Math.PI * 2); c.fill();
    for (let j = 0; j < 12; j++) { c.fillStyle = j % 2 ? '#123a9a' : '#d9a640'; c.beginPath(); c.moveTo(W / 2, cy); c.arc(W / 2, cy, r, (j / 12) * Math.PI * 2 + 0.03, ((j + 1) / 12) * Math.PI * 2 - 0.03); c.closePath(); c.fill(); }
    c.fillStyle = '#0a0a0c'; c.beginPath(); c.arc(W / 2, cy, r * 0.45, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f0c95a'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2; const rr = i % 2 ? r * 0.12 : r * 0.4; c.lineTo(W / 2 + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); c.fill();
  }
  // 竖向铅条
  c.fillStyle = '#0a0a0c'; for (const x of [W * 0.33, W * 0.66]) c.fillRect(x - 4, 0, 8, H);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
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
