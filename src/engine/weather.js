// 材质老化：世界空间程序化噪声 → 大尺度色差（打破平铺）、竖墙雨痕、墙根脏污、积灰、金属氧化与磨损、粗糙度起伏
// 用法：weather(material, { macro, streak, grime, tarnish, dust, ground })；对已有 onBeforeCompile 的材质会串联
import * as THREE from 'three';

const NOISE = /* glsl */`
float nbH(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float nbN(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(nbH(i), nbH(i + vec3(1,0,0)), f.x), mix(nbH(i + vec3(0,1,0)), nbH(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(nbH(i + vec3(0,0,1)), nbH(i + vec3(1,0,1)), f.x), mix(nbH(i + vec3(0,1,1)), nbH(i + vec3(1,1,1)), f.x), f.y), f.z); }
float nbF(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * nbN(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
`;

export function weather(mat, o = {}) {
  if (!mat || mat.userData.weathered) return mat;
  const P = { macro: 0.22, streak: 0.0, grime: 0.0, tarnish: 0.0, dust: 0.0, ground: 0.0, rough: 0.18, scale: 1.0, ...o };
  mat.userData.weathered = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vNbW; varying vec3 vNbN;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        { vec4 nbw = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            nbw = instanceMatrix * nbw;
          #endif
          vNbW = (modelMatrix * nbw).xyz; vNbN = normalize(mat3(modelMatrix) * objectNormal); }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vNbW; varying vec3 vNbN;\n' + NOISE)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 nbP = vNbW * ${P.scale.toFixed(3)};
        vec3 nbNn = normalize(vNbN);
        float nbWall = 1.0 - smoothstep(0.35, 0.7, abs(nbNn.y));
        float nbUp = smoothstep(0.6, 0.95, nbNn.y);
        float nbMac = nbF(nbP * 0.11);
        float nbFine = nbF(nbP * 1.7);
        // 大尺度色差
        diffuseColor.rgb *= mix(1.0 - ${P.macro.toFixed(3)}, 1.0 + ${P.macro.toFixed(3)} * 0.6, nbMac);
        // 竖墙雨痕（沿高度拉长的噪声）
        float nbAlong = abs(nbNn.x) > abs(nbNn.z) ? nbP.z : nbP.x;
        float nbSt = nbF(vec3(nbAlong * 2.2, nbP.y * 0.09, 3.1)) * (0.6 + 0.4 * nbFine);
        float nbStreak = smoothstep(0.48, 0.78, nbSt) * nbWall * ${P.streak.toFixed(3)};
        // 墙根返潮脏污
        float nbGr = (1.0 - smoothstep(0.0, 1.6 + nbFine * 1.2, vNbW.y - ${P.ground.toFixed(3)})) * nbWall * ${P.grime.toFixed(3)};
        // 朝上表面积灰
        float nbDu = nbUp * smoothstep(0.35, 0.75, nbF(nbP * 0.6)) * ${P.dust.toFixed(3)};
        diffuseColor.rgb *= 1.0 - 0.45 * nbStreak - 0.35 * nbGr;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.40, 0.37) * 0.5, nbDu * 0.5);
        // 金属氧化
        float nbTar = smoothstep(0.45, 0.8, nbF(nbP * 0.9 + 5.0)) * ${P.tarnish.toFixed(3)};
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.5, 0.42, 0.33), nbTar);
        float nbRoughAdd = (nbFine - 0.5) * ${P.rough.toFixed(3)} + nbStreak * 0.25 + nbGr * 0.2 + nbDu * 0.35 + nbTar * 0.35;`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = clamp(roughnessFactor + nbRoughAdd, 0.04, 1.0);');
  };
  const prevKey = mat.customProgramCacheKey?.bind(mat);
  mat.customProgramCacheKey = () => (prevKey ? prevKey() : '') + '|nbw' + JSON.stringify(P);
  mat.needsUpdate = true;
  return mat;
}
