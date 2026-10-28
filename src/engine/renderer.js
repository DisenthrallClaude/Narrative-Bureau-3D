// 渲染器与后处理（pmndrs postprocessing + N8AO）：HDR 管线、SSAO、Bloom、AgX 色调映射、暗角、SMAA；画质档位
import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect, SMAAEffect, SMAAPreset, NoiseEffect, BlendFunction, ChromaticAberrationEffect, HueSaturationEffect, BrightnessContrastEffect } from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

export const QUALITY = {
  low: { label: '低', pixelRatio: 0.75, shadow: 1024, ao: false, bloom: true, reflect: 0, smaa: false, shadowsLocal: false, shafts: true, anis: 2 },
  medium: { label: '中', pixelRatio: 1.0, shadow: 2048, ao: 'half', bloom: true, reflect: 0.35, smaa: true, shadowsLocal: false, shafts: true, anis: 4 },
  high: { label: '高', pixelRatio: 1.25, shadow: 4096, ao: 'full', bloom: true, reflect: 0.5, smaa: true, shadowsLocal: true, shafts: true, anis: 8 },
  ultra: { label: '极致', pixelRatio: 2.0, shadow: 4096, ao: 'ultra', bloom: true, reflect: 0.75, smaa: true, shadowsLocal: true, shafts: true, anis: 16 },
};

export class Renderer {
  constructor(canvas, scene, camera) {
    this.scene = scene; this.camera = camera;
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, depth: true, preserveDrawingBuffer: !!window.__SHOT__ });
    this.gl.outputColorSpace = THREE.SRGBColorSpace;
    this.gl.toneMapping = THREE.NoToneMapping;
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = THREE.PCFSoftShadowMap;
    this.composer = new EffectComposer(this.gl, { frameBufferType: THREE.HalfFloatType, multisampling: 0 });
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);
    this.ao = new N8AOPostPass(scene, camera, innerWidth, innerHeight);
    this.ao.configuration.aoRadius = 2.5;
    this.ao.configuration.distanceFalloff = 1.0;
    this.ao.configuration.intensity = 2.2;
    this.ao.configuration.gammaCorrection = false;
    this.ao.configuration.color = new THREE.Color(0, 0, 0);
    this.composer.addPass(this.ao);
    this.bloom = new BloomEffect({ intensity: 0.9, luminanceThreshold: 0.85, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.72, levels: 7 });
    this.tone = new ToneMappingEffect({ mode: ToneMappingMode.AGX });
    this.grade = new HueSaturationEffect({ saturation: 0.08 });
    this.contrast = new BrightnessContrastEffect({ contrast: 0.06 });
    this.vignette = new VignetteEffect({ offset: 0.32, darkness: 0.55 });
    this.noise = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: false });
    this.noise.blendMode.opacity.value = 0.06;
    this.ca = new ChromaticAberrationEffect({ offset: new THREE.Vector2(0.0006, 0.0004), radialModulation: true, modulationOffset: 0.4 });
    this.smaa = new SMAAEffect({ preset: SMAAPreset.HIGH });
    this.exposure = 1.0;
    this.setQuality('high');
    addEventListener('resize', () => this.resize());
    this.resize();
  }
  setQuality(q) {
    this.q = QUALITY[q] ?? QUALITY.high;
    this.qName = q;
    const pr = Math.min(this.q.pixelRatio, devicePixelRatio || 1) * (window.__SHOT__ ? 1 : 1);
    this.gl.setPixelRatio(window.__SHOT__ ? 1 : pr);
    // 重建效果通道
    if (this.fxPass) { this.composer.removePass(this.fxPass); this.fxPass.dispose?.(); }
    if (this.smaaPass) { this.composer.removePass(this.smaaPass); this.smaaPass = null; }
    const effects = [];
    if (this.q.bloom) effects.push(this.bloom);
    effects.push(this.ca, this.grade, this.contrast, this.tone, this.vignette, this.noise);
    this.fxPass = new EffectPass(this.camera, ...effects);
    this.composer.addPass(this.fxPass);
    if (this.q.smaa) { this.smaaPass = new EffectPass(this.camera, this.smaa); this.composer.addPass(this.smaaPass); }
    this.ao.enabled = !!this.q.ao;
    if (this.q.ao) {
      this.ao.configuration.halfRes = this.q.ao === 'half';
      this.ao.setQualityMode(this.q.ao === 'ultra' ? 'High' : this.q.ao === 'full' ? 'Medium' : 'Low');
    }
    this.resize();
    this.onQuality?.(this.q);
  }
  resize() {
    const w = innerWidth, h = innerHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.gl.setSize(w, h, false);
    this.composer.setSize(w, h);
  }
  setExposure(e) { this.exposure = e; this.tone.exposure = e; if (this.tone.uniforms?.get?.('exposure')) this.tone.uniforms.get('exposure').value = e; this.gl.toneMappingExposure = e; }
  render(dt) { this.composer.render(dt); }
}
