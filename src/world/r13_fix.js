// 批次 R13：两项小修（`?nor13=1` 全部回退）
// ① 第七局作战室 seventh_ops 机位左上角「偏蓝灯罩」= M8 沙盘上方铜链碗灯组（m8/ops.glb 的 m1_bronze，pick 后贴 Metal046A + 金属度 1，
//    罩顶掠射反出 hall HDR 冷色 → 读成蓝；M13/R5-D 已把 env 压到 0.1 仍偏蓝）。glb 按材质合并成一个网格，无法单拆灯罩 →
//    只对灯组包围盒（x −5.4…−3.2，y Y+2.35…Y+4.6，z −124…−118.6）内的片元：底色改暗铜 0x8a5a2b、出光去饱和后映暗琥珀、
//    叠极弱暗琥珀自发光（≤0.15，远低于 0.8 上限）。只克隆 ops 模型材质，不动其它房间共享材质。
//    作战室长桌椅区（会商长桌两侧椅排 z ≈ −117.8 / −122.2）补两盏暖白点光，局部照度约 +15–20%。
// ② 宿舍 207（R5-E 方案之上）：南墙书桌补木椅 + 南墙书桌与小木桌之间写实书柜（与书桌、小桌成排背贴南墙）；东墙两只立放行李箱
//    改为真实立放尺寸（高 0.70 / 0.62 m），见 r5_rooms.js。
import * as THREE from 'three';
export const NO_R13 = typeof location !== 'undefined' && /[?&]nor13=1/.test(location.search);

const LAMP_BOX = (Y) => [-5.4, Y + 2.35, -124.0, -3.2, Y + 4.6, -118.6];

function tintMat(src, box) {
  const m = src.clone();
  const prev = src.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(m, sh, r);
    sh.uniforms.uR13Min = { value: new THREE.Vector3(box[0], box[1], box[2]) };
    sh.uniforms.uR13Max = { value: new THREE.Vector3(box[3], box[4], box[5]) };
    sh.vertexShader = 'varying vec3 vR13W;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vR13W = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'varying vec3 vR13W;\nuniform vec3 uR13Min;\nuniform vec3 uR13Max;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\n  float r13In = step(uR13Min.x, vR13W.x) * step(vR13W.x, uR13Max.x) * step(uR13Min.y, vR13W.y) * step(vR13W.y, uR13Max.y) * step(uR13Min.z, vR13W.z) * step(vR13W.z, uR13Max.z);\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.541, 0.353, 0.169), r13In);')
      .replace('#include <opaque_fragment>', '{ float r13L = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));\n  vec3 r13A = r13L * vec3(1.32, 0.86, 0.42) + vec3(0.541, 0.353, 0.169) * 0.12;\n  outgoingLight = mix(outgoingLight, r13A, r13In); }\n#include <opaque_fragment>');
  };
  const key = src.customProgramCacheKey ? src.customProgramCacheKey.bind(src) : () => '';
  m.customProgramCacheKey = () => key() + '|r13lamp';
  return m;
}

/** m8/ops 模型加入场景后调用：灯组包围盒内去蓝 */
export function r13OpsLamp(o, Y) {
  if (NO_R13) return;
  const box = LAMP_BOX(Y); const cache = new Map();
  const bb = new THREE.Box3(), lb = new THREE.Box3(new THREE.Vector3(box[0], box[1], box[2]), new THREE.Vector3(box[3], box[4], box[5]));
  o.updateMatrixWorld(true);
  o.traverse((m) => {
    if (!m.isMesh || !m.material || Array.isArray(m.material)) return;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    bb.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); if (!bb.intersectsBox(lb)) return;
    if (!cache.has(m.material)) cache.set(m.material, tintMat(m.material, box));
    m.material = cache.get(m.material);
  });
}

/** 作战室椅区补光 */
export function r13OpsChairLight(zone, Y) {
  if (NO_R13) return;
  for (const [x, z] of [[1.4, -116.9], [6.4, -116.9], [3.9, -123.0]]) { const l = new THREE.PointLight(0xffd2a0, 1.25, 6.0, 2); l.position.set(x, Y + 2.5, z); zone.add(l); l.castShadow = false; l.name = 'r13_chairFill'; }
}
