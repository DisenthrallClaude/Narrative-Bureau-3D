// 批次 E2：特效批第二轮 + B1 冷色治理（续 E1，全部暖色，禁蓝绿；新增自发光 / 输出峰值 < 1.0）。
//   1. b1warm：archive_b1 分区内灯光改 3000K 暖白（0xffb46e），冷色自发光灯管改暖，所有受光材质在片元里去蓝 → 暖灰（克隆材质，不影响其它分区）。
//   2. fog：E1 雾团在 E2 下关闭；E2 体积雾带试一次失败（不可读 + 推车上罩白斑）已删除，B1 现在无雾。
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

// —— 2. B1 雾带：已删除 ——
// E2 只试一次的方案（通道中线 x −52…−36.2、z −36.6±1.35、高 0.6 m、密度 0.3 的盒内步进体积雾，边界软淡出）实拍 run 41230989821 ab1_r3：
// 通道里几乎看不见，且雾盒与推车相交处在推车下半截罩出一块发白方斑（无深度缓冲可读，推车在体积内被整体覆盖）→ 按规则删除、不再尝试。
// 若将来要做，需要先在渲染管线里提供场景深度纹理（soft particle），再谈贴地雾。

// —— 3. 浮晶琥珀：片元输出按亮度乘琥珀色（库 color 参数对晶体主体基本不生效） ——
export function amberize(group) {
  let n = 0;
  group.traverse((o) => {
    if (!o.isMesh || !o.material?.isShaderMaterial || o.userData.e2a) return; o.userData.e2a = true;
    // 库的 main() 在持续段（uLifeStage==1）会提前 return，尾部插入不会执行 → 把原 main 改名 e2Main，外包一层再乘色
    const m = o.material; const fs = m.fragmentShader; const k = fs.lastIndexOf('void main()'); if (k < 0) return;
    m.fragmentShader = fs.slice(0, k) + 'void e2Main()' + fs.slice(k + 11) + `\nvoid main(){ e2Main(); float l2 = dot(gl_FragColor.rgb, vec3(.299, .587, .114)); gl_FragColor.rgb = min(l2 * vec3(1.0, .64, .26) * 0.9, vec3(.9)); }\n`;
    m.needsUpdate = true; n++;
  });
  return n;
}

// —— 4. 深渊门内侧竖向铜框贴边暖光（不投影） ——
export function gateRim(G, AY = -300) {
  if (!E2 || E2_OFF.has('gaterim')) return 0;
  const zone = zoneGroup(G, 'abyss'); if (!zone) { console.warn('[E2] 缺 abyss 分组'); return 0; }
  let n = 0;
  // 一拍（x ±5.3 / z −79.4 / 6 / 3.6 m）实拍：铜框只略亮，光主要打在折页面上成两团亮斑 → 二拍（最后一次）贴近门洞侧壁、离折页面 ≥1.7 m、缩照距
  for (const s of [-1, 1]) for (const y of [3.0, 7.6]) {
    const l = new THREE.PointLight(0xffb070, 4, 2.0, 2); l.castShadow = false; l.position.set(s * 5.8, AY + y, -79.0); l.name = 'e2_gate_rim'; zone.add(l); n++;
  }
  return n;
}
