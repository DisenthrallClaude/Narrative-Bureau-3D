// 平面反射（抛光大理石地面）：镜像相机 + 斜裁剪投影，结果按粗糙度取 mip 模糊并以菲涅尔混入 PBR 材质
import * as THREE from 'three';

export class PlanarReflector {
  constructor(renderer, { y = 0, res = 0.5 } = {}) {
    this.renderer = renderer; this.y = y; this.res = res;
    this.rt = new THREE.WebGLRenderTarget(8, 8, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
    this.cam = new THREE.PerspectiveCamera();
    this.textureMatrix = new THREE.Matrix4();
    this.uniforms = { tReflect: { value: this.rt.texture }, reflMatrix: { value: this.textureMatrix }, reflStrength: { value: 0.6 }, reflOn: { value: 0 } };
    this.materials = new Set();
    this.hide = [];
    this.enabled = false;
  }
  setY(y) { this.y = y; }
  /** 给材质注入反射采样 */
  patch(mat, strength = 0.6, distort = 0.04) {
    const U = this.uniforms;
    mat.userData.reflStrength = strength;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.tReflect = U.tReflect; sh.uniforms.reflMatrix = U.reflMatrix; sh.uniforms.reflOn = U.reflOn;
      sh.uniforms.reflStrength = { value: strength };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 reflMatrix;\nvarying vec4 vReflUv;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvReflUv = reflMatrix * modelMatrix * vec4(transformed, 1.0);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tReflect;\nuniform float reflStrength;\nuniform float reflOn;\nvarying vec4 vReflUv;')
        .replace('#include <opaque_fragment>', `
          if (reflOn > 0.5) {
            vec4 ru = vReflUv;
            ru.xy += normal.xy * ${distort.toFixed(3)} * ru.w;
            vec2 ruv = ru.xy / ru.w;
            float lod = roughnessFactor * 7.0;
            vec3 refl = textureLod(tReflect, ruv, lod).rgb;
            float ndv = clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);
            float fres = 0.05 + 0.95 * pow(1.0 - ndv, 5.0);
            float k = reflStrength * mix(0.35, 1.0, fres) * (1.0 - roughnessFactor * 0.85);
            outgoingLight = mix(outgoingLight, refl, clamp(k, 0.0, 1.0));
          }
          #include <opaque_fragment>`);
    };
    mat.customProgramCacheKey = () => 'refl' + strength + distort;
    mat.needsUpdate = true;
    this.materials.add(mat);
  }
  update(scene, camera, quality) {
    const on = this.enabled && quality > 0;
    this.uniforms.reflOn.value = on ? 1 : 0;
    if (!on) return;
    const gl = this.renderer;
    const size = gl.getDrawingBufferSize(new THREE.Vector2());
    const w = Math.max(64, Math.floor(size.x * quality)), h = Math.max(64, Math.floor(size.y * quality));
    if (this.rt.width !== w || this.rt.height !== h) this.rt.setSize(w, h);
    // 镜像相机
    const cam = this.cam;
    cam.copy(camera);
    const p = camera.position.clone(); p.y = 2 * this.y - p.y;
    const dir = camera.getWorldDirection(new THREE.Vector3()); dir.y = -dir.y;
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion); up.y = -up.y;
    cam.position.copy(p); cam.up.copy(up); cam.lookAt(p.clone().add(dir));
    cam.updateMatrixWorld(); cam.projectionMatrix.copy(camera.projectionMatrix);
    // 纹理矩阵
    this.textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.textureMatrix.multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
    // 斜裁剪（剪掉平面以下）
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.y);
    plane.applyMatrix4(cam.matrixWorldInverse);
    const cp = new THREE.Vector4(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const pm = cam.projectionMatrix;
    const q = new THREE.Vector4((Math.sign(cp.x) + pm.elements[8]) / pm.elements[0], (Math.sign(cp.y) + pm.elements[9]) / pm.elements[5], -1, (1 + pm.elements[10]) / pm.elements[14]);
    cp.multiplyScalar(2 / cp.dot(q));
    pm.elements[2] = cp.x; pm.elements[6] = cp.y; pm.elements[10] = cp.z + 1 - 0.003; pm.elements[14] = cp.w;
    // 渲染
    for (const o of this.hide) o.visible = false;
    this.uniforms.reflOn.value = 0;
    const prevRT = gl.getRenderTarget();
    const prevShadow = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false;
    gl.setRenderTarget(this.rt); gl.clear(); gl.render(scene, cam);
    gl.setRenderTarget(prevRT);
    gl.shadowMap.autoUpdate = prevShadow;
    this.uniforms.reflOn.value = 1;
    for (const o of this.hide) o.visible = true;
  }
}
