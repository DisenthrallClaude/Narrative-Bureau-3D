// 局内网：终端模型（CRT + 键盘 + L 形小桌）、所有显示器屏幕贴图、E 交互打开 2D 覆盖层（Esc 关闭，期间锁定移动）
// 挂接（main.js 只需两处）：
//   1) 世界碰撞 build 之前：await buildIntranet(scene, world, ctx)        —— 放终端模型、登记碰撞、注册截图机位
//   2) setupStory(G) 之后：setupIntranet(G, UI)                            —— 屏幕贴图、交互热点、覆盖层
import * as THREE from 'three';
import './intranet.css';
import { Props } from '../../world/dress.js';
import { UPPER } from '../../world/upper.js';
import { FLOOR } from '../../world/exterior.js';
import { SHOTS } from '../../shots.js';
import { STATIONS, stationItems, stationScreenGuess, CRT, TABLE } from './stations.js';
import { frame, page, TABS } from './pages.js';
import { screenTexture } from './screen.js';
import { MAILS } from './data.js';

const ZY = { floor3: () => UPPER['3F'], floor2: () => UPPER['2F'], director: () => UPPER['12F'], archive: () => FLOOR, command_center: () => FLOOR + 7, interrogation: () => -18, vault_b5: () => -42 };
const GROUP = { floor3: 'floor3', floor2: 'floor2', director: 'director', archive: 'archive', command_center: 'east_wing', interrogation: 'interrogation', vault_b5: 'vault_b5' };
// 屏幕子网格（按材质名识别）：旧管线 monitor 的屏幕贴花、Sketchfab CRT 的玻璃
const SCREEN_MATS = { 'props:monitor': /unique_decal_screen/, ['props:' + CRT]: /monitor_glass/ };
const PORTAL = { id: 'portal', page: 'portal', term: 'NB-4', label: '局内网' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export async function buildIntranet(scene, world, ctx) {
  const byGroup = new Map();
  for (const s of STATIONS) {
    s.Y = ZY[s.zone](); s.group = GROUP[s.zone];
    const items = stationItems(s, s.Y); if (!items.length) continue;
    const zone = ctx.zones?.[s.group]; if (!zone) { console.warn('[NB] 局内网：缺分区', s.group); continue; }
    if (!byGroup.has(zone)) byGroup.set(zone, new Props());
    const P = byGroup.get(zone);
    for (const it of items) { P.add(it.m, [it.x, it.y, it.z], { h: it.h, w: it.w, yaw: it.yaw }); if (it.col) world.box(it.x, it.y + it.col[1] / 2, it.z, it.col[0], it.col[1], it.col[2], it.yaw); }
  }
  await Promise.all([...byGroup].map(([zone, P]) => P.build(zone).then((ims) => ims.forEach((m) => { m.userData.intranet = true; if (m.name === 'props:' + TABLE) m.userData.noCull = true; }))));
  // 截图机位：net_<id> 近景（正对屏幕）、net_<id>_w 中景（斜侧，带桌面）
  for (const s of STATIONS) {
    const g = stationScreenGuess(s, s.Y); const n = V(Math.sin(g.yaw), 0, Math.cos(g.yaw)), side = V(n.z, 0, -n.x), c = V(...g.c);
    const near = c.clone().addScaledVector(n, s.kind === 'console' ? 0.78 : 0.66).add(V(0, 0.04, 0));
    const wide = c.clone().addScaledVector(n, 1.7).addScaledVector(side, 0.85).add(V(0, 0.42, 0));
    SHOTS['net_' + s.id] = { pos: near.toArray(), look: c.toArray(), zone: s.zone, fov: 50 };
    SHOTS['net_' + s.id + '_w'] = { pos: wide.toArray(), look: c.clone().add(V(0, -0.12, 0)).toArray(), zone: s.zone, fov: 60 };
  }
}

// —— 屏幕：在每个显示器实例的屏幕面前贴一张局内网页面 ——
const done = new WeakMap();
function screensOf(im) {
  const re = SCREEN_MATS[im.name]; if (!re || !im.isInstancedMesh) return [];
  const mat = Array.isArray(im.material) ? im.material[0] : im.material; if (!re.test(mat?.name ?? '')) return [];
  const g = im.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox; const sz = bb.getSize(V()), ctr = bb.getCenter(V());
  const sib = im.parent.children.filter((o) => o.isInstancedMesh && o.name === im.name && o.count === im.count);
  const out = []; const m = new THREE.Matrix4(), ms = new THREE.Matrix4();
  for (let i = 0; i < im.count; i++) {
    im.getMatrixAt(i, m); m.premultiply(im.matrix);
    const c = ctr.clone().applyMatrix4(m); const A = [0, 1, 2].map((k) => V().setFromMatrixColumn(m, k).multiplyScalar(sz.getComponent(k) / 2));
    const L = A.map((a) => a.length()); const t = L[0] < L[1] && L[0] < L[2] ? 0 : L[1] < L[2] ? 1 : 2;
    // 模型整体中心（判断屏幕法线朝外）
    const mc = V(); let nb = 0; for (const s of sib) { if (!s.geometry.boundingBox) s.geometry.computeBoundingBox(); s.getMatrixAt(i, ms); ms.premultiply(s.matrix); mc.add(s.geometry.boundingBox.getCenter(V()).applyMatrix4(ms)); nb++; } mc.divideScalar(nb);
    const nrm = A[t].clone(); const thick = nrm.length(); nrm.normalize(); if (nrm.dot(c.clone().sub(mc)) < 0) nrm.negate();
    const [a1, a2] = [0, 1, 2].filter((k) => k !== t).map((k) => A[k]); const up = Math.abs(a1.clone().normalize().y) > Math.abs(a2.clone().normalize().y) ? a1 : a2, rt = up === a1 ? a2 : a1;
    out.push({ c: c.addScaledVector(nrm, thick + 0.003), n: nrm, w: rt.length() * 2, h: up.length() * 2, up: up.clone().normalize(), parent: im.parent });
  }
  return out;
}
function placeScreen(sc, st, scale = 0.95) {
  const aspect = sc.w / sc.h; const tex = screenTexture(st, aspect);
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0xd8d8d8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(sc.w * scale, sc.h * scale), mat); mesh.name = 'intranet_screen:' + st.id;
  const up = sc.up.clone(); if (up.y < 0) up.negate(); const n = sc.n.clone(); const x = new THREE.Vector3().crossVectors(up, n).normalize(); up.crossVectors(n, x);
  mesh.matrix.makeBasis(x, up, n).setPosition(sc.c); mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale); mesh.renderOrder = 2; mesh.userData.noCull = true;
  sc.parent.add(mesh); return mesh;
}
function stationFor(sc, groupName) {
  let best = null, bd = 1e9; for (const s of STATIONS) { if (s.group !== groupName || !s.guess) continue; const d = sc.c.distanceTo(V(...s.guess.c)); if (d < bd) { bd = d; best = s; } }
  return bd < 14 ? best : PORTAL;
}
function scan(scene, ctx) {
  const groupOf = (o) => { for (let a = o; a; a = a.parent) for (const [k, g] of Object.entries(ctx.zones ?? {})) if (g === a) return k; return null; };
  let n = 0;
  scene.traverse((o) => { if (!o.isInstancedMesh || !SCREEN_MATS[o.name] || done.get(o) === o.count) return; done.set(o, o.count);
    const gname = groupOf(o); for (const sc of screensOf(o)) { const st = stationFor(sc, gname); const mine = st !== PORTAL && sc.c.distanceTo(V(...st.guess.c)) < 0.35; if (mine) st.screen3 = sc; placeScreen(sc, st); n++; } });
  return n;
}

// —— 覆盖层 ——
export function setupIntranet(G, UI) {
  const { scene, ctx, inter } = G;
  try { for (const [w, f] of [['400', 'mono-regular'], ['500', 'mono-medium']]) { const ff = new FontFace('NB Mono', `url(fonts/${f}.woff2)`, { weight: w }); ff.load().then((x) => document.fonts.add(x)).catch(() => {}); } } catch { /* */ }
  for (const s of STATIONS) { s.Y ??= ZY[s.zone](); s.group ??= GROUP[s.zone]; s.guess = stationScreenGuess(s, s.Y); }
  // 指挥中心席位：程序化三联屏的中屏（eastwing.js），直接叠一层
  for (const s of STATIONS.filter((x) => x.kind === 'console')) { const zone = ctx.zones?.[s.group]; if (!zone) continue; const sc = { c: V(...s.guess.c), n: V(Math.sin(s.screen.yaw), 0, Math.cos(s.screen.yaw)), w: s.screen.w, h: s.screen.h, up: V(0, 1, 0), parent: zone }; s.screen3 = sc; placeScreen(sc, s, 1.0); }
  const n0 = scan(scene, ctx); if (window.__SHOT__) console.log('[NB] 局内网屏幕', n0);
  for (const ms of [4000, 15000, 40000]) setTimeout(() => scan(scene, ctx), ms); // 迟到的模型（截图模式慢机）补贴
  G.onZone.push(() => scan(scene, ctx));
  // 交互热点
  for (const s of STATIONS) {
    const c = s.screen3?.c ?? V(...s.guess.c);
    inter.add({ id: 'intranet_' + s.id, box: [c.x, c.y - 0.05, c.z, 0.62, 0.55, 0.62], range: 2.6, prompt: () => `按 E 登录局内网终端 · ${s.label}`, use: () => open(s.id) });
  }

  const root = document.createElement('div'); root.id = 'intranet'; root.className = 'hidden'; document.body.appendChild(root);
  const state = { st: null, tab: 'home', view: null, q: '', pset: 'pub', mail: MAILS[0].id };
  let isOpen = false;
  const render = (full = false) => {
    if (full || !root.firstChild) root.innerHTML = frame(state);
    else { root.querySelector('#nbmain').innerHTML = page(state); root.querySelectorAll('.nav span[data-tab]').forEach((e) => e.classList.toggle('on', e.dataset.tab === state.tab)); }
    root.querySelector('#nbmain').scrollTop = 0;
    const q = root.querySelector('#nbq'); if (q) { q.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') { state.q = q.value; render(); root.querySelector('#nbq')?.focus(); } if (e.key === 'Escape') { if (q.value) { q.value = ''; state.q = ''; render(); } else q.blur(); } }; }
  };
  const go = (tab, view = null) => { state.tab = tab; state.view = view; render(); };
  function open(id, tab) {
    const st = STATIONS.find((s) => s.id === id) ?? STATIONS[0];
    Object.assign(state, { st, tab: tab ?? (st.page === 'portal' ? 'home' : 'dept'), view: null, q: '', pset: 'pub' });
    UI.ui.state = 'intranet'; isOpen = true; G.audio?.sfx?.('S15', 0.4);
    root.classList.remove('hidden'); render(true);
    if (!window.__SHOT__ && !window.__NB_AUTO__) { const b = document.createElement('div'); b.className = 'boot'; b.textContent = `NB-4 TERMINAL　${st.term}\n叙事管理局 局内网　NB-NET / 京城总部\n\n> 读取临时入职证 …… XS-2026-1029-07\n> 文本完整性校验 …… 跳过（临时权限）\n> 登录 ${st.label} 席位 …… 完成`; root.querySelector('.screen').appendChild(b); setTimeout(() => b.remove(), 900); }
    if (document.pointerLockElement) document.exitPointerLock?.();
    UI.setPrompt('');
  }
  function close() {
    if (!isOpen) return; isOpen = false; root.classList.add('hidden'); UI.ui.state = 'play';
    if (!window.__SHOT__ && !window.__NB_AUTO__) document.getElementById('c')?.requestPointerLock?.();
  }
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab],[data-act],[data-doc],[data-person],[data-wanted],[data-mail],[data-pset]'); if (!t) return;
    const d = t.dataset;
    if (d.tab) go(d.tab); else if (d.act === 'close') close(); else if (d.act === 'back') go(state.tab);
    else if (d.act === 'san') { state.view = { san: 1 }; render(); }
    else if (d.doc) go('home', { doc: d.doc, no: d.no }); else if (d.person) go('people', { person: d.person }); else if (d.wanted != null) go('people', { person: 'w' + d.wanted });
    else if (d.mail) { state.mail = d.mail; render(); } else if (d.pset) { state.pset = d.pset; state.q = ''; render(); }
  });
  // 覆盖层打开时吞掉全部按键（主循环的 E / Tab / R / WASD 都不响应），Esc 先退一级再退出
  window.addEventListener('keydown', (e) => {
    if (!isOpen) return; e.stopImmediatePropagation();
    if (e.target?.id === 'nbq') return;
    if (e.code === 'Escape') { e.preventDefault(); if (state.view) go(state.tab); else close(); return; }
    const f = /^(?:F|Digit)([1-5])$/.exec(e.code); if (f) { e.preventDefault(); go(TABS[+f[1] - 1][0]); return; }
    if (state.tab === 'mail' && (e.code === 'ArrowDown' || e.code === 'ArrowUp')) { e.preventDefault(); const i = MAILS.findIndex((m) => m.id === state.mail); state.mail = MAILS[(i + (e.code === 'ArrowDown' ? 1 : MAILS.length - 1)) % MAILS.length].id; render(); }
    if (e.code === 'Tab') e.preventDefault();
  }, true);
  window.__INTRANET__ = { open, close, go: (tab, view) => go(tab, view), state, stations: STATIONS, isOpen: () => isOpen, screens: () => { const out = []; scene.traverse((o) => { if (o.name?.startsWith('intranet_screen:')) out.push(o.name); }); return out; } };
  const q = new URLSearchParams(location.search).get('intranet'); if (q) { const [id, tab] = q.split('/'); setTimeout(() => open(id, tab), 0); }
}
