// 时段（设置菜单「时段」）：批次27 E8 起黄昏为默认（天空盒落日 + 低角暖阳 + 立面洗墙灯 + 亮窗统一一个时段），白昼为可选。切换后重新载入（天空雾贴图在着色器编译时绑定）。
import * as THREE from 'three';
const p = new URLSearchParams(location.search);
export const TOD_NAME = (p.get('tod') || localStorage.getItem('nb_tod') || 'dusk') === 'day' ? 'day' : 'dusk';
const PRESETS = {
  // 太阳方向取自 kloofendal_48d_partly_cloudy 全景图中太阳位置（东南方高约 40°，略压低以拉长阴影）
  day: { sky: 'sky_day.jpg', skyI: 1.0, sunDir: new THREE.Vector3(0.60, 0.62, 0.50).normalize(), sunColor: 0xfff0dc, sunMul: 1.15, hemiSky: 0xb8cdf0, hemiGround: 0x4a4238, hemiMul: 1.6, winLit: 0.45, cityLit: 0.05, cityColor: 0x40434c, plazaExp: 1.0, label: '白昼' },
  dusk: { sky: 'sky_dusk.jpg', skyI: 1.45, sunDir: new THREE.Vector3(-0.80, 0.2, 0.57).normalize(), sunColor: 0xffb27c, sunMul: 1.0, hemiSky: 0x9a96c8, hemiGround: 0x3a2c26, hemiMul: 1.0, winLit: 1.7, cityLit: 0.3, cityColor: 0x2a2b31, plazaExp: 1.05, label: '黄昏' },
};
export const TOD = PRESETS[TOD_NAME];
export function setTod(name) { localStorage.setItem('nb_tod', name); const u = new URL(location.href); u.searchParams.delete('tod'); location.href = u.toString(); }
