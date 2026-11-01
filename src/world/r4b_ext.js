// R4-B 外观修补：门楼尖塔暖化、远景写实砖石公馆（Innerscene「Library building」CC0）、去蓝小工具
import * as THREE from 'three';
import { loadModel } from '../engine/assets.js';

const NO = /[?&]nor4b=1/.test(location.search); // ?nor4b=1 关闭本批全部改动对比
export const R4B_OFF = NO;

/** 色相锁（亮度保留）：把出射光换成指定暖色相 × 亮度；boxes 给出时只在这些世界坐标盒内生效 */
export function warmLock(mat, hue = [0.62, 0.5, 0.38], { mix = 0.82, gain = 1.0, boxes = null, key = 'r4bwarm' } = {}) {
  if (NO || !mat) return mat;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  const nb = boxes ? boxes.length : 0;
  mat.onBeforeCompile = function (sh, r) {
    if (prev) prev.call(this, sh, r);
    sh.uniforms.uR4bHue = { value: new THREE.Vector3(...hue) };
    if (nb) {
      sh.uniforms.uR4bBox = { value: boxes.flatMap((b) => [new THREE.Vector3(b[0], b[1], b[2]), new THREE.Vector3(b[3], b[4], b[5])]) };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vR4bW;')
        .replace('#include <project_vertex>', `#include <project_vertex>
          { vec4 r4w = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
          r4w = instanceMatrix * r4w;
          #endif
          vR4bW = (modelMatrix * r4w).xyz; }`);
    }
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nuniform vec3 uR4bHue;${nb ? `\nvarying vec3 vR4bW; uniform vec3 uR4bBox[${nb * 2}];` : ''}`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        { float r4in = ${nb ? '0.0' : '1.0'};
          ${nb ? `for (int i = 0; i < ${nb}; i++) { vec3 a = uR4bBox[i * 2], b = uR4bBox[i * 2 + 1]; if (all(greaterThan(vR4bW, a)) && all(lessThan(vR4bW, b))) r4in = 1.0; }` : ''}
          float L = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114)); vec3 hn = uR4bHue / dot(uR4bHue, vec3(0.299, 0.587, 0.114));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, hn * L * ${gain.toFixed(2)}, ${mix.toFixed(2)} * r4in); }`);
  };
  mat.customProgramCacheKey = function () { return (prevKey ? prevKey.call(this) : '') + '|' + key + nb; };
  mat.needsUpdate = true;
  return mat;
}

/** 正门门楼两侧尖塔（hero_facade 内 F_trim，x ±6.3…7.7、y 19.3…25.7、z −4.1…−2.6）：背光面吃黄昏半球紫光 + 天空反射 → 偏紫灰、边缘发蓝。
 *  只在这两个世界盒内（用 weather() 已有的世界坐标 varying vNbW）：间接漫反射换成暖色、天空镜面反射压到 25%，出射光再锁暖石色相；其余线脚不动。
 *  第 1 版（自建 varying + 末端色相锁）截图无效，第 2 版改走 vNbW + 光照阶段替换 */
export function warmPortalPinnacles(trim) {
  if (NO || !trim || trim.userData.r4bPin) return trim;
  trim.userData.r4bPin = true;
  const prev = trim.onBeforeCompile, prevKey = trim.customProgramCacheKey;
  const IN = 'float r4in = (step(5.9, abs(vNbW.x)) * step(abs(vNbW.x), 8.1) * step(19.0, vNbW.y) * step(vNbW.y, 26.4) * step(-4.4, vNbW.z) * step(vNbW.z, -2.3));';
  trim.onBeforeCompile = function (sh, r) {
    if (prev) prev.call(this, sh, r);
    if (!sh.fragmentShader.includes('vNbW')) console.warn('[NB] r4b 尖塔：trim 无 vNbW');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        { ${IN}
          vec3 r4w = vec3(1.0, 0.80, 0.60);
          float r4l = dot(reflectedLight.indirectDiffuse, vec3(0.299, 0.587, 0.114));
          reflectedLight.indirectDiffuse = mix(reflectedLight.indirectDiffuse, r4l * r4w * 1.25, r4in);
          reflectedLight.indirectSpecular *= mix(1.0, 0.25, r4in);
          reflectedLight.directDiffuse *= mix(vec3(1.0), r4w * 1.1, r4in); }`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        { ${IN}
          float L = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114)); vec3 hn = vec3(0.62, 0.50, 0.38) / 0.5106;
          gl_FragColor.rgb = mix(gl_FragColor.rgb, hn * L * 1.15, 0.85 * r4in); }`);
  };
  trim.customProgramCacheKey = function () { return (prevKey ? prevKey.call(this) : '') + '|r4bpin2'; };
  trim.needsUpdate = true;
  console.log('[NB] r4b 尖塔暖化已挂');
  return trim;
}

/** 去蓝：材质贴图先去饱和再乘暖色（报刊亭蓝色瓦楞铁皮等） */
export function deBlueMap(mat, tint = [0.56, 0.42, 0.3], amt = 0.92) {
  if (NO || !mat) return mat;
  const m = mat.clone();
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      { float l = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)); diffuseColor.rgb = mix(diffuseColor.rgb, l * vec3(${tint.map((v) => (v * 1.9).toFixed(3)).join(',')}), ${amt.toFixed(2)}); }`);
  };
  m.customProgramCacheKey = () => 'r4bdeblue' + tint.join() + amt;
  return m;
}

/** 远景写实砖石公馆：Innerscene「Library building」（CC0，Beaux-Arts 红砖 + 石灰岩门廊 + 陶瓦四坡顶），
 *  贴图 2048→512 webp + meshopt（26.4 MB → 0.75 MB）。放在 R305 街屋圈外、程序远景方块圈（r ≥ 470）内的空带 r 380–420，正面朝局；
 *  材质压暗暖（砖暗酒红褐、石灰岩暖灰、铜绿 → 暗铜、玻璃暗暖），远处雾中读作厚重砖石天际线体量 */
export function farHalls(g, world, place) {
  if (NO) return;
  const spots = [ // [角度°（自 +z 顺时针），半径，缩放]
    [16, 400, 1.9], [-16, 400, 1.9], [44, 392, 2.1], [-44, 392, 2.1], [78, 410, 2.0], [-78, 410, 2.0],
    [112, 395, 2.2], [-112, 395, 2.2], [146, 400, 2.0], [-146, 400, 2.0], [180, 410, 2.3],
  ];
  loadModel('r4b/library_hall').then((src) => {
    if (!src) return;
    const warm = (m, c, extra = {}) => { const n = m.clone(); n.color = new THREE.Color(c); Object.assign(n, extra); n.envMapIntensity = Math.min(n.envMapIntensity ?? 1, 0.4); return n; };
    const remap = new Map();
    src.traverse((o) => {
      if (!o.isMesh) return; o.castShadow = false; o.receiveShadow = false;
      o.material = [].concat(o.material).map((m) => {
        if (remap.has(m)) return remap.get(m);
        const nm = m.name || ''; let r;
        if (/copper|bronze/i.test(nm)) r = deBlueMap(warm(m, 0x6a5038, { metalness: 0.5, roughness: 0.6 }), [0.5, 0.36, 0.24], 0.95);
        else if (/brick/i.test(nm)) r = warm(m, 0x9a6e5c);
        else if (/tile roof/i.test(nm)) r = deBlueMap(warm(m, 0x8a6a58), [0.46, 0.32, 0.24], 0.5);
        else if (/glass/i.test(nm)) r = warm(m, 0x2a2018, { transparent: false, opacity: 1, transmission: 0, roughness: 0.35, metalness: 0 });
        else if (/lamp/i.test(nm)) r = warm(m, 0xffc890);
        else if (/interior/i.test(nm)) r = warm(m, 0x1a1410);
        else r = warm(m, 0xb8a894); // 石灰岩 / 花岗岩 / 砂岩 / 木作：暖灰
        remap.set(m, r); return r;
      });
      if (o.material.length === 1) o.material = o.material[0];
    });
    const bb = new THREE.Box3().setFromObject(src);
    for (const [deg, r, s] of spots) {
      const a = THREE.MathUtils.degToRad(deg); const x = Math.sin(a) * r, z = -35 + Math.cos(a) * r;
      if (place && !place(x, z)) continue;
      const o = src.clone(true); o.scale.setScalar(s); o.position.set(x, -4.4 - bb.min.y * s, z); o.rotation.y = a + Math.PI; // 模型正面 +Z → 转向局（环心）
      o.traverse((m) => { if (m.isMesh) m.userData.noCull = true; }); o.name = 'r4b_hall'; g.add(o);
      if (world) { const w = (bb.max.x - bb.min.x) * s, d = (bb.max.z - bb.min.z) * s; world.box?.(x, -4.4 + 8, z, Math.max(w, d), 16, Math.max(w, d)); }
    }
  }).catch((e) => console.warn('[NB] r4b halls', e));
}
