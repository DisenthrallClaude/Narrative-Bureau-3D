// M4 书芯「墨渊」（驯化 8 级畸变空间，y≈−300）与 M5 第七局「装订线」（页缝空间，y≈−500）
// 入口：B6 训练场西墙维护通道 / B5 深库北门 → 墨渊折页门；定稿厅镇纸柱底红线 → 装订线回廊；
//       档案馆 B1 第 7 排缝隙（q5_b1 后）/ 电梯 B6+关门 7 秒（B7）/ 局长室南墙无名书 → 装订线入口；回写台三结局。
// 视觉：墨黑 + 纸白 + 金（墨渊）；暗红线 + 牛皮纸（装订线）。区域判定见 main.js zoneAt（y < −250）。
import * as THREE from 'three';
import { Batch } from '../engine/batch.js';
import { content } from '../engine/content.js';
import { dust } from '../engine/fx.js';
import { mats } from './mats.js';
import { Frame, archShape, archRingGeo, emblem, goldText } from './gothic.js';
import { point, spot, person, signMaterial, brassPlaqueMaterial } from './interiors.js';
import { vaultMats, tagMaterial } from './vault.js';
import { dressMats, Props, hangingSign, paperStack, folderStack, greenLamp, spineMaterial, spineShelf } from './dress.js';
import { m5Mats } from './dress_m5.js';
import { UNDER } from './rooms.js';
import { buildM1Seventh, buildM5Seventh } from './m1_seventh.js';
import { buildM10Seventh, NO_M10 } from './m10_seventh.js';
import { buildM13Abyss, M13_ABYSS } from './m13_abyss.js';

export const AY = -300, SY = -500; // 墨渊 / 装订线 地坪
const rnd = (() => { let s = 23; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const TXT = '万物皆文本作者在上此页不应存在这段太平淡了删留白第七条本条不存在你又一次来报到了墨还没干别相信页码请勿回头阅读此页即进入叙事安全第一';
function cvTex(w, h, draw, rep) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
// M6：墙面/地面文字改为真实文本排版（审阅 R5 P1-2：原 70 字短句循环成「字汤」）——取 content 文档正文 + 《叙事安全法》节选，竖排右起、段落换列、标题大字
const LAW = '《中华人民共和国叙事安全法》（节选）\n第一条　为维护现实稳定，防范叙事污染，保障公民免受畸变侵害，制定本法。\n第三条　万物皆文本。任何单位和个人不得擅自续写、删改、署名于正本。\n第九条　现实稳定度低于百分之九十时，所在区域即进入叙事管制状态。\n第十七条　觉醒者应于觉醒之日起七日内向叙事管理局登记，领取临时入职证。\n第二十二条　禁止在公共场所朗读未经审定的结局。\n第四十一条　考场内发生不可读事件的，视同归档处理。\n第五十五条　任何人不得以作者之名发布指令。\n附则　本法自公布之日起施行。第七条：本条不存在。\n定稿记录\n京城一章，第三十二稿。删去雨夜一段，改为晴。删去一名路人。保留广场喷泉。\n第三十三稿。此页不应存在。\n第三十四稿。留白。';
let CORPUS = null;
function corpus() {
  if (CORPUS) return CORPUS;
  const docs = (content.m?.documents ?? []).filter((d) => /^(abyss|seventh|archive|vault)/.test(d.area ?? '') && d.text).map((d) => (d.title ? d.title + '\n' : '') + d.text.replace(/[ \t]+/g, ''));
  CORPUS = [LAW, ...docs].join('\n'); if (CORPUS.length < 400) CORPUS = (LAW + '\n').repeat(3);
  return CORPUS;
}
function textPage(bg, ink, cols = true, size = 22, alpha = 0.75) {
  return cvTex(1024, 1024, (c, w, h) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = ink; c.globalAlpha = alpha; const T = corpus(); let i = Math.floor(rnd() * T.length); const S = size * 1.6;
    const next = () => { const ch = T[i % T.length]; i++; return ch; };
    if (cols) {
      let x = w - S * 1.4;
      while (x > S * 0.4) { let y = S * 1.6; let title = rnd() < 0.08; c.font = `${title ? 700 : 400} ${title ? S * 1.3 : S}px "NB Serif", serif`; const step = title ? S * 1.4 : S * 1.08;
        while (y < h - S * 0.6) { const ch = next(); if (ch === '\n') { y += step * 2; if (rnd() < 0.5) break; continue; } c.fillText(ch, x, y); y += step; }
        x -= (title ? S * 1.7 : S * 1.42); }
    } else {
      let y = S * 1.8; c.font = `${S}px "NB Serif", serif`;
      while (y < h - S * 0.4) { let x = S * 0.8, line = ''; while (x < w - S * 1.2) { const ch = next(); if (ch === '\n') { if (line) break; else continue; } c.fillText(ch, x, y); x += S * 1.02; line += ch; } y += S * 1.55; if (rnd() < 0.12) y += S * 0.8; }
    }
    c.globalAlpha = 1; c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 4; c.strokeRect(0, 0, w, h);
  }, true);
}

let DMAT = null;
function depthMats(M) {
  if (DMAT) return DMAT;
  const page = textPage('#e9e1cc', '#1a140e', true, 24, 0.55);
  const street = textPage('#d9cfb6', '#2a2018', false, 20, 0.22);
  const kraftTxt = textPage('#b48f5e', '#3a2410', true, 22, 0.35);
  const inkTex = cvTex(256, 256, (c, w, h) => { c.fillStyle = '#050506'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(200,180,120,0.18)'; c.font = '20px "NB Serif", serif'; for (let i = 0; i < 40; i++) c.fillText(TXT[i % TXT.length], rnd() * w, rnd() * h); }, true);
  DMAT = {
    dp_page: new THREE.MeshStandardMaterial({ map: page, roughness: 0.92, color: 0xf0ead8 }),
    dp_pageDark: new THREE.MeshStandardMaterial({ map: page, roughness: 0.92, color: 0x6a6458 }),
    dp_street: new THREE.MeshStandardMaterial({ map: street, roughness: 0.95, color: 0xd8d0bc }),
    dp_kraft: new THREE.MeshStandardMaterial({ map: kraftTxt, roughness: 0.9, color: 0xc8a070 }),
    dp_ink: new THREE.MeshLambertMaterial({ color: 0x050608, map: inkTex, emissive: 0xc89a48, emissiveMap: inkTex, emissiveIntensity: 0.5 }), // M7：潮面掠射角被聚光/清漆打成整片白（R5 P0-2 复发）→ 改无高光 Lambert，墨面只靠金字自发光
    dp_inkMatte: new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: 0.7 }),
    dp_red: new THREE.MeshStandardMaterial({ color: 0x5a0a0c, emissive: 0x9a1014, emissiveIntensity: 1.4, roughness: 0.6 }),
    dp_redText: new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff2a1a, emissiveIntensity: 2.2, transparent: true, side: THREE.DoubleSide, depthWrite: false, map: cvTex(1024, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '900 120px "NB Title", "NB Serif", serif'; c.fillText('此页不应存在', 20, 160); }) }),
    dp_redText2: new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff2a1a, emissiveIntensity: 2.2, transparent: true, side: THREE.DoubleSide, depthWrite: false, map: cvTex(1024, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '900 120px "NB Title", "NB Serif", serif'; c.fillText('删？　删？　删？', 20, 160); }) }),
    dp_goldGlow: new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: 0xffc35a, emissiveIntensity: 1.6, roughness: 0.4 }),
    dp_blank: new THREE.MeshStandardMaterial({ color: 0xf6f2e8, emissive: 0xfff6e0, emissiveIntensity: 0.25, roughness: 0.9 }),
  };
  for (const k of ['dp_redText', 'dp_redText2']) DMAT[k].userData.noShadow = true;
  return DMAT;
}

/** 巨书（书脊 + 书页块 + 封面），用于书墙与倒悬书城 */
function bigBook(b, x, y, z, w, h, d, yaw = 0, cover = 'dp_inkMatte') {
  const f = new Frame([x, y, z], yaw);
  b.add(cover, new THREE.BoxGeometry(w, h, d), f.at(0, h / 2, 0), { uv: 0.4 });
  b.add('dp_page', new THREE.BoxGeometry(w * 0.96, h * 0.94, d * 1.01), f.at(0.03 * w, h / 2, 0), { uv: 0.5 });
  b.add('gold', new THREE.BoxGeometry(w * 1.01, 0.06, d * 1.02), f.at(0, h * 0.85, 0), { uv: 1 }); b.add('gold', new THREE.BoxGeometry(w * 1.01, 0.06, d * 1.02), f.at(0, h * 0.15, 0), { uv: 1 });
}
/** 倒悬哥特塔（从「天顶」垂下） */
function hangingTower(b, x, top, z, w, h) {
  b.add('dp_inkMatte', new THREE.BoxGeometry(w, h, w), { pos: [x, top - h / 2, z] }, { uv: 0.3 });
  b.add('dp_inkMatte', new THREE.ConeGeometry(w * 0.72, h * 0.6, 4), { pos: [x, top - h - h * 0.3, z], rot: [Math.PI, Math.PI / 4, 0] }, { uv: 0.3 });
  b.add('gold', new THREE.BoxGeometry(w * 1.04, 0.15, w * 1.04), { pos: [x, top - h * 0.3, z] }, { uv: 1 }); b.add('gold', new THREE.BoxGeometry(w * 1.04, 0.15, w * 1.04), { pos: [x, top - h + 0.2, z] }, { uv: 1 });
  for (let k = 0; k < Math.floor(h / 4); k++) for (const [dx, dz, ry] of [[0, w / 2 + 0.01, 0], [0, -w / 2 - 0.01, Math.PI], [w / 2 + 0.01, 0, Math.PI / 2], [-w / 2 - 0.01, 0, -Math.PI / 2]]) b.add('dz_shade', new THREE.ShapeGeometry(archShape(w * 0.18, 0.9)), { pos: [x + dx, top - 2.5 - k * 4, z + dz], rot: [Math.PI, ry, 0] }, { uv: false });
  b.add('gold', new THREE.ConeGeometry(0.15, 3, 6), { pos: [x, top - h - h * 0.6 - 1.4, z], rot: [Math.PI, 0, 0] }, { uv: 1 });
}

export async function buildDepths(scene, world, ctx) {
  const M = mats(); const MAT = { ...M, ...vaultMats(M), ...dressMats(M), ...m5Mats(M), ...depthMats(M), spine: spineMaterial() };
  const D = depthMats(M);
  const mk = (name) => { const g = new THREE.Group(); g.name = name; scene.add(g); ctx.zones[name] = g; return g; };
  const anchor = (id, obj, range) => { ctx.anchors[id] = range ? { obj, range } : obj; };
  const plane = (zone, mat, w, h, x, y, z, yaw = 0, pitch = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.set(pitch, yaw, 0, 'YXZ'); zone.add(m); return m; };
  const docMat = (id, fb) => { const d = content.get(id); const t = d?.texture ? content.tex(d.texture) : null; return t ? new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }) : fb; };
  const jobs = [];
  ctx.depths = { redTexts: [], tide: null, floatFile: null, pages: [] };

  // ============================== 墨渊 ==============================
  {
    const zone = mk('abyss'), b = new Batch(), P = new Props(), Y = AY;
    // —— 折页门广场 abyss_gate (z −55…−85) ——
    b.box('dp_street', 30, 0.4, 34, [0, Y - 0.2, -70], { uv: 0.3, collide: true });
    b.box('dp_inkMatte', 32, 0.8, 0.8, [0, Y - 0.4, -53], { uv: 0.4 });
    // 来路：书脊井维护梯厅（南端黑色金门）
    { const f = new Frame([0, Y, -54], Math.PI); b.add('dp_inkMatte', new THREE.BoxGeometry(14, 8, 1), f.at(0, 4, -0.5), { uv: 0.3, collide: true }); b.add('elevDoor', new THREE.BoxGeometry(2.6, 3.6, 0.1), f.at(0, 1.8, 0.02), { uv: false }); b.add('gold', archRingGeo(3.4, 2.4, 2.8, 2.4, 0.2), f.at(0, 0, 0.1), { uv: 1 }); const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.36), tagMaterial('书脊井 · 维护梯　返回')); pl.position.set(0, Y + 4.6, -54.1 + 0.2); pl.rotation.y = 0; zone.add(pl); ctx.depths.returnDoor = pl; }
    // 折页门：由层层书页折成的尖拱巨门（z −80），门内是城市
    { const gz = -80; if (M13_ABYSS) jobs.push(buildM13Abyss(zone, world, Y)); // 批次 M13：石拱深渊门 hero（m13_abyss.js），下面书页拱圈 / 书柱在 M13 下不画
      if (!M13_ABYSS) for (let k = 0; k < 9; k++) { const s = 1 - k * 0.07; const f = new Frame([0, Y, gz - k * 0.35], 0); b.add(k % 2 ? 'dp_page' : 'dp_pageDark', archRingGeo(14 * s + 1.2, 12 * s, 14 * s, 12 * s, 0.3), f.at(0, 0, 0, [0, 0, (k % 2 ? 0.015 : -0.015)]), { uv: 0.3 }); }
      if (!M13_ABYSS) for (const sx of [-1, 1]) { b.box('dp_inkMatte', 4, 26, 4, [sx * 9.5, Y + 13, gz], { uv: 0.3, collide: true }); for (let k = 0; k < 12; k++) bigBook(b, sx * 9.5 + (rnd() - 0.5) * 0.6, Y + k * 2.1, gz + 2.1, 3.6, 2.0, 0.6, (rnd() - 0.5) * 0.1, k % 3 ? 'dp_inkMatte' : 'navy'); }
      const fold = new THREE.Mesh(new THREE.ShapeGeometry(archShape(12.4, 10.6)), new THREE.MeshStandardMaterial(M13_ABYSS ? { map: textPage('#efe8d6', '#20180f', true, 30, 0.5), color: 0x8a6c48, emissive: 0x3a2814, emissiveIntensity: 0.45, roughness: 0.95, side: THREE.DoubleSide, transparent: true, opacity: 0.92 } /* M15：白纸过曝 → 暖羊皮纸、压亮度（color 乘子 + 弱暖自发光 0.45），文字纹理保留 */ : { map: textPage('#efe8d6', '#20180f', true, 30, 0.5), emissive: 0xfff2d0, emissiveIntensity: 0.18, side: THREE.DoubleSide, transparent: true, opacity: 0.92 }));
      fold.position.set(0, Y, gz - 0.8); zone.add(fold); ctx.depths.fold = fold; ctx.anchors.int_abyss_fold = { obj: fold, range: 7 };
      const gp = plane(zone, docMat('doc_abyss_gate_plate', brassPlaqueMaterial('第八号驯化空间 · 墨渊', ['驯化度 99.98%', '入内请报出自己的名字', '若想不起名字，请勿入内'])), 1.2, 1.5, 7.2, Y + 1.8, gz + 2.12, 0); anchor('doc_abyss_gate_plate', gp);
      const guard = person(M, { coat: 0x0c0c10, material: null }); guard.position.set(-6.4, Y, gz + 3.4); guard.rotation.y = 0.4; zone.add(guard);
      const face = plane(zone, D.dp_blank, 0.22, 0.28, -6.4 + Math.sin(0.4) * 0.12, Y + 1.62, gz + 3.4 + Math.cos(0.4) * 0.12, 0.4); void face;
      ctx.anchors.int_abyss_guard = { box: [-6.4, Y + 1.0, gz + 3.4, 1.2, 2, 1.2] };
      point(zone, 0xffe2b0, 30, [0, Y + 8, gz + 6], 26); }
    // —— 倒悬书城 abyss_city (z −85…−185)：纸页街道、书墙、倒悬塔、漂浮路牌、居民告示 ——
    b.box('dp_street', 26, 0.4, 104, [0, Y - 0.2, -136], { uv: 0.3, collide: true });
    for (const sx of [-1, 1]) { for (let z = -88; z > -184; z -= 4.2) { const hh = 6 + rnd() * 9; let yy = 0; while (yy < hh) { const bh = 1.4 + rnd() * 1.2; bigBook(b, sx * (13 + rnd() * 0.6), Y + yy, z + (rnd() - 0.5) * 0.4, 2.2 + rnd() * 0.8, bh, 3.8, (rnd() - 0.5) * 0.15 + (sx < 0 ? 0 : Math.PI), ['dp_inkMatte', 'navy', 'leather', 'dp_inkMatte'][Math.floor(rnd() * 4)]); yy += bh + 0.04; } } world.box(sx * 13.5, Y + 6, -136, 3, 12, 104); }
    // 两侧「街巷口」：西 → 考场母本，东 → 墨潮带（书墙留口）
    for (let k = 0; k < 26; k++) hangingTower(b, (rnd() - 0.5) * 70, Y + 70, -90 - rnd() * 100, 4 + rnd() * 6, 14 + rnd() * 26);
    b.box('dp_inkMatte', 120, 2, 140, [0, Y + 71, -130], { uv: 0.1 }); // 天顶（倒置地面）
    for (let k = 0; k < 120; k++) { const x = (rnd() - 0.5) * 100, z = -70 - rnd() * 130; b.box('dp_page', 2.2 + rnd() * 2, 0.02, 3 + rnd() * 2, [x, Y + 69.9, z], { uv: false, rot: [0, rnd() * 3, 0] }); }
    // 漂浮的书页（动画）+ 路牌
    for (let k = 0; k < 60; k++) { const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), D.dp_page); pg.position.set((rnd() - 0.5) * 22, Y + 3 + rnd() * 18, -90 - rnd() * 95); pg.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); pg.userData.v = 0.2 + rnd() * 0.5; zone.add(pg); ctx.depths.pages.push(pg); }
    { const sg = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), docMat('doc_abyss_city_sign', new THREE.MeshStandardMaterial({ map: cvTex(1024, 200, (c, w, h) => { c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, w, h); c.fillStyle = '#f0e6c8'; c.font = '900 96px "NB Title", "NB Serif", serif'; c.fillText('↑ 定稿厅　← 考场　墨潮 →', 20, 130); }), transparent: true, emissive: 0xffe8b0, emissiveIntensity: 0.6, side: THREE.DoubleSide }))); sg.position.set(0, Y + 7, -92); zone.add(sg); anchor('doc_abyss_city_sign', sg, 12); }
    { const n = plane(zone, docMat('doc_abyss_resident_notice', signMaterial('书城居民告示', ['一、请勿把自己的名字', '　　念出声', '二、正本只可阅，不可抄', '三、看见祂的红字', '　　请原地不动'], 480, 640)), 1.1, 1.5, -11.6, Y + 1.9, -112, Math.PI / 2); anchor('doc_abyss_resident_notice', n); }
    // 居民（纸面人）
    for (let k = 0; k < 7; k++) { const p = person(M, { coat: [0x1a1a1e, 0x2a2420, 0x20242a][k % 3] }); p.position.set((rnd() - 0.5) * 16, Y, -100 - k * 11); p.rotation.y = rnd() * 6; zone.add(p); const f2 = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), D.dp_blank); f2.position.set(p.position.x + Math.sin(p.rotation.y) * 0.13, Y + 1.62, p.position.z + Math.cos(p.rotation.y) * 0.13); f2.rotation.y = p.rotation.y; zone.add(f2); }
    // 街灯（金色书签灯柱）
    for (let z = -92; z > -182; z -= 10) for (const sx of [-1, 1]) { b.box('gold', 0.12, 4.2, 0.12, [sx * 9, Y + 2.1, z], { uv: 1 }); b.add('dp_goldGlow', new THREE.OctahedronGeometry(0.28), { pos: [sx * 9, Y + 4.5, z] }, { uv: false }); }
    for (let z = -95; z > -180; z -= 20) point(zone, 0xffcf8a, 14, [0, Y + 6, z], 22);
    // 正本档案塔（街道尽头 z −172）：环形书架塔 + 中央悬浮档案袋
    { const tz = -172, R = 7; for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; if (Math.abs(Math.sin(a)) < 0.26 && Math.cos(a) > 0) continue; const f = new Frame([Math.sin(a) * R, Y, tz + Math.cos(a) * R], a + Math.PI); spineShelf(b, f, 1.9, 24, 0.6, { seed: k * 3.1, wood: 'dp_inkMatte' }); }
      for (let L = 1; L <= 7; L++) { const r = new THREE.RingGeometry(R - 0.8, R + 0.4, 48, 1, Math.PI * 0.6, Math.PI * 1.8); r.rotateX(-Math.PI / 2); b.add('gold', r, { pos: [0, Y + L * 3.4, tz] }, { uv: 1 }); }
      const ff = new THREE.Group(); const env = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.46, 0.03), M.kraft); ff.add(env); const ink = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.08), new THREE.MeshBasicMaterial({ color: 0x050505 })); ink.position.set(0, 0.1, 0.017); ff.add(ink); ff.position.set(0, Y + 1.6, tz); zone.add(ff); ctx.depths.floatFile = ff; anchor('doc_abyss_true_file', ff, 3);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.02, 6, 40), D.dp_goldGlow); halo.position.set(0, Y + 1.6, tz); zone.add(halo); point(zone, 0xffd890, 8, [0, Y + 3, tz], 10);
      const tag = goldText('正本档案塔', 4, 0.5, M.goldBright, { res: 96 }); tag.position.set(0, Y + 25, tz + R + 0.3); zone.add(tag);
      const sh = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.75, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(1, 2.4, 1); sh.position.set(3.2, Y + 0.02, tz + R + 2.2); zone.add(sh); ctx.anchors.int_abyss_yexun_shadow = { obj: sh, range: 2.6 }; }
    // —— 上行阶梯 → 定稿厅 abyss_core（平台 y +20，z −195…−230）——
    { const n = 60, za = -178, zb = -196, top = 20; for (let i = 0; i < n; i++) { const t = i / n; const a = t * Math.PI * 1.5; const x = Math.sin(a) * 9, z = -186 - Math.cos(a) * 9 * 0 + (zb - za) * t * 0 + 0; void x; void z; }
      // 螺旋：绕塔后方，简化为两跑直梯
      const run = (x0, z0, x1, z1, y0, y1) => { const m = 30; for (let i = 0; i < m; i++) { const t = (i + 0.5) / m; b.box('dp_page', 3, 0.25, Math.hypot(x1 - x0, z1 - z0) / m + 0.05, [x0 + (x1 - x0) * t, Y + y0 + (y1 - y0) * (i + 1) / m - 0.12, z0 + (z1 - z0) * t], { uv: 0.6, rot: [0, Math.atan2(x1 - x0, z1 - z0), 0] }); } world.ramp([x0, Y + y0, z0], [x1, Y + y1, z1], 3); };
      run(-10, -160, -10, -188, 0, 10); b.box('dp_page', 6, 0.4, 6, [-10, Y + 9.8, -191], { uv: 0.4, collide: true }); run(-10, -194, 6, -210, 10, 20); }
    b.box('dp_street', 46, 0.5, 46, [8, Y + 19.75, -228], { uv: 0.12, collide: true });
    { const cx = 8, cz = -228, R = 16; for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; if (a < 0.42 || a > Math.PI * 2 - 0.42) continue; /* 北侧留口迎上行阶梯 */ bigBook(b, cx + Math.sin(a) * R, Y + 20, cz + Math.cos(a) * R, 2.6, 14 + rnd() * 6, 3.4, a, k % 4 ? 'dp_inkMatte' : 'navy'); }
      // 环形书桌 + 摊开的「京城」一章
      const ring = new THREE.RingGeometry(5.2, 6.6, 64); ring.rotateX(-Math.PI / 2); b.add('wood', ring, { pos: [cx, Y + 21.0, cz] }, { uv: 0.5 }); const ringS = new THREE.CylinderGeometry(6.6, 6.6, 1.0, 64, 1, true); b.add('dp_inkMatte', ringS, { pos: [cx, Y + 20.5, cz] }, { uv: 0.4 }); world.box(cx, Y + 20.5, cz - 6, 6, 1, 1.4);
      const rev = plane(zone, docMat('doc_abyss_revisions', new THREE.MeshStandardMaterial({ map: textPage('#efe8d6', '#20180f', true, 18, 0.7), roughness: 0.9 })), 1.6, 1.1, cx, Y + 21.03, cz - 5.9, 0, -Math.PI / 2); anchor('doc_abyss_revisions', rev, 3);
      // 镇纸巨柱：从天顶插下
      b.add('dp_inkMatte', new THREE.CylinderGeometry(2.4, 2.4, 60, 8), { pos: [cx, Y + 50, cz] }, { uv: 0.2, collide: true }); for (let k = 0; k < 8; k++) b.add('gold', new THREE.TorusGeometry(2.45, 0.08, 6, 8), { pos: [cx, Y + 22 + k * 6, cz], rot: [Math.PI / 2, 0, Math.PI / 8] }, { uv: 1 });
      const pw = plane(zone, docMat('doc_abyss_paperweight', brassPlaqueMaterial('镇纸', ['驯化第八号空间', '压住：京城一章', '勿动。'])), 1.2, 1.4, cx, Y + 21.6, cz + 2.42, 0); anchor('doc_abyss_paperweight', pw);
      // 祂的红批注（漂浮在页边）
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; const m = plane(zone, k % 2 ? D.dp_redText : D.dp_redText2, 6, 1.5, cx + Math.sin(a) * 12, Y + 32 + k * 2.2, cz + Math.cos(a) * 12, a + Math.PI); ctx.depths.redTexts.push(m); }
      ctx.anchors.int_abyss_core_look_up = { box: [cx, Y + 21.5, cz, 6, 3, 6] };
      // 柱底暗红线 → 装订线
      const thread = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(cx, Y + 20.05, cz + 2.6), new THREE.Vector3(cx + 3, Y + 20.05, cz + 7), new THREE.Vector3(cx + 9, Y + 20.05, cz + 9), new THREE.Vector3(cx + 13.5, Y + 20.05, cz + 4)]), 40, 0.04, 5), D.dp_red); zone.add(thread);
      const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 4), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xc01818, emissiveIntensity: 2.0 })); seam.position.set(cx + 14.3, Y + 22, cz + 4); seam.rotation.y = -Math.PI / 2; zone.add(seam); ctx.depths.coreSeam = seam;
      point(zone, 0xffd8a0, 22, [cx, Y + 28, cz], 30); point(zone, 0xff3020, 6, [cx + 13, Y + 22, cz + 4], 8); spot(zone, 0xfff0d0, 120, [cx, Y + 45, cz + 10], [cx, Y + 20, cz], 0.5, true, 40); }
    // —— 考场母本 abyss_exam（西巷 x −14…−70，z −120…−160）——
    b.box('dp_street', 58, 0.4, 44, [-43, Y - 0.2, -140], { uv: 0.12, collide: true });
    { for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { const x = -22 - c * 5.4, z = -124 - r * 3.6; b.box('wood', 1.2, 0.05, 0.6, [x, Y + 0.76, z], { uv: 0.6 }); for (const dx of [-0.55, 0.55]) b.box('blackMetal', 0.04, 0.74, 0.5, [x + dx, Y + 0.37, z], { uv: 1 }); b.box('wood', 0.45, 0.45, 0.42, [x, Y + 0.23, z + 0.62], { uv: 0.6 }); b.box('wood', 0.45, 0.5, 0.04, [x, Y + 0.7, z + 0.82], { uv: 0.6 }); b.box('dp_page', 0.3, 0.004, 0.42, [x, Y + 0.79, z], { uv: false, rot: [0, (rnd() - 0.5) * 0.2, 0] }); }
      const x77 = -22 - 6 * 5.4, z77 = -124 - 6 * 3.6; const ep = plane(zone, docMat('doc_abyss_exam_paper', new THREE.MeshStandardMaterial({ map: textPage('#f4efe2', '#1a1a1a', false, 16, 0.8), roughness: 0.9 })), 0.32, 0.44, x77, Y + 0.795, z77, 0, -Math.PI / 2); anchor('doc_abyss_exam_paper', ep, 2.4); ctx.anchors.int_abyss_exam_sit = { box: [x77, Y + 0.6, z77 + 0.62, 0.8, 1.2, 0.8] }; const lp = point(zone, 0xfff2d8, 5, [x77, Y + 3, z77], 7); void lp;
      b.box('dp_inkMatte', 10, 3.2, 0.3, [-24, Y + 3.5, -120.2], { uv: 0.4 }); const bd = goldText('2023 · 京城 07 考场', 8, 0.9, M.goldBright, { res: 128 }); bd.position.set(-24, Y + 3.6, -120.0); zone.add(bd);
      for (let k = 0; k < 6; k++) b.add('dz_glowCold', new THREE.BoxGeometry(6, 0.06, 0.3), { pos: [-30 - k * 6, Y + 6, -140] }, { uv: false }); point(zone, 0xdfe8ff, 12, [-40, Y + 5, -140], 26); }
    // —— 墨潮带 abyss_tide（东巷 x 14…70，z −120…−160）——
    b.box('dp_street', 30, 0.4, 44, [29, Y - 0.2, -140], { uv: 0.12, collide: true });
    { const tide = new THREE.Mesh(new THREE.PlaneGeometry(60, 60, 60, 60), D.dp_ink); tide.rotation.x = -Math.PI / 2; tide.position.set(74, Y - 0.1, -140); zone.add(tide); ctx.depths.tide = tide; world.box(44.2, Y + 1, -140, 0.4, 2, 44);
      for (let k = 0; k < 9; k++) { const z = -122 - k * 4.4; b.box('paintR', 0.18, 1.4, 0.18, [43.6, Y + 0.7, z], { uv: false }); b.box('paintW', 0.19, 0.2, 0.19, [43.6, Y + 1.1, z], { uv: false }); }
      const post = plane(zone, docMat('doc_abyss_tide_post', signMaterial('边界警示', ['墨潮带', '禁止越过红桩', '不要读它们身上的字'], 420, 520)), 0.7, 0.86, 43.3, Y + 1.0, -139.2, -Math.PI / 2); anchor('doc_abyss_tide_post', post);
      const rec = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.2), M.blackMetal); rec.position.set(42.6, Y + 0.03, -141.4); rec.rotation.set(0.3, 0.6, 0.1); zone.add(rec); const rl = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xff3020 })); rl.position.set(42.6, Y + 0.07, -141.35); rl.rotation.x = -Math.PI / 2; zone.add(rl); anchor('doc_abyss_recorder', rec, 2.4);
      for (let k = 0; k < 14; k++) { const p = person(M, { coat: 0x050506 }); p.position.set(52 + rnd() * 30, Y - 0.9 - rnd() * 0.6, -125 - rnd() * 30); p.rotation.y = rnd() * 6; zone.add(p); }
      point(zone, 0x9a2018, 10, [40, Y + 4, -140], 20); point(zone, 0x3a5a8a, 8, [80, Y + 10, -140], 40); }
    // M6：倒悬主楼（AREAS A0 核心画面：抬头看见地面上的叙事管理局倒插下来）——黑石主体 + 收分塔 + 倒尖顶 + 金线 + 发光尖窗 + 倒写招牌
    { const cx = 0, cz = -150, top = Y + 70; const win = new THREE.MeshStandardMaterial({ color: 0x0a0806, emissive: 0xffc35a, emissiveIntensity: 1.2, roughness: 0.6 });
      const blk = (w, h, d, y0, mat = 'dp_inkMatte') => { b.box(mat, w, h, d, [cx, y0 - h / 2, cz], { uv: 0.2 }); b.box('gold', w + 0.3, 0.3, d + 0.3, [cx, y0 - h + 0.15, cz], { uv: 1 }); return y0 - h; };
      b.box('dp_inkMatte', 70, 4, 36, [cx, top - 2, cz], { uv: 0.2 }); // 倒置的大台基
      for (const sx of [-1, 1]) { b.box('dp_inkMatte', 18, 16, 22, [cx + sx * 24, top - 4 - 8, cz], { uv: 0.2 }); b.add('dp_inkMatte', new THREE.ConeGeometry(9, 14, 4), { pos: [cx + sx * 24, top - 20 - 7, cz], rot: [Math.PI, Math.PI / 4, 0] }, { uv: 0.2 });
        for (const k of [-1, 1]) { b.box('dp_inkMatte', 2.4, 26, 2.4, [cx + sx * 30 + k * 4, top - 4 - 13, cz + 11], { uv: 0.3 }); b.add('dp_inkMatte', new THREE.ConeGeometry(1.6, 9, 4), { pos: [cx + sx * 30 + k * 4, top - 30 - 4.5, cz + 11], rot: [Math.PI, Math.PI / 4, 0] }, { uv: 0.3 }); } }
      let y = top - 4; y = blk(28, 24, 22, y); y = blk(20, 22, 18, y); y = blk(13, 16, 13, y);
      b.add('dp_inkMatte', new THREE.ConeGeometry(8.4, 34, 8), { pos: [cx, y - 17, cz], rot: [Math.PI, Math.PI / 8, 0] }, { uv: 0.2 });
      b.add('gold', new THREE.ConeGeometry(0.5, 8, 6), { pos: [cx, y - 34 - 3.5, cz], rot: [Math.PI, 0, 0] }, { uv: 1 });
      for (const tt of [0.15, 0.45]) b.add('gold', new THREE.CylinderGeometry(8.4 * (1 - tt) + 0.2, 8.4 * (1 - tt) + 0.2, 0.4, 8, 1, true), { pos: [cx, y - 34 * tt, cz], rot: [0, Math.PI / 8, 0] }, { uv: 1 });
      // 南立面（朝来路）尖窗：倒置发光
      for (const [wx, wy, ww, wh] of [[-8, top - 10, 2.6, 9], [8, top - 10, 2.6, 9], [0, top - 30, 2.2, 8], [-5, top - 30, 1.6, 6], [5, top - 30, 1.6, 6], [0, top - 52, 1.6, 7], [-24, top - 10, 2.4, 7], [24, top - 10, 2.4, 7]]) { const m = new THREE.Mesh(new THREE.ShapeGeometry(archShape(ww, wh - ww * 0.87)), win); m.position.set(cx + wx, wy, cz + (Math.abs(wx) > 20 ? 11.02 : wy < top - 26 ? (wy < top - 48 ? 6.52 : 9.02) : 11.02)); m.rotation.z = Math.PI; zone.add(m); }
      const em = emblem(4.2, M.goldBright, M.navy); em.position.set(cx, top - 22, cz + 11.1); em.rotation.z = Math.PI; zone.add(em);
      const sign = goldText('叙事管理局', 16, 2.4, M.goldBright, { res: 128 }); sign.position.set(cx, top - 7, cz + 11.2); sign.rotation.z = Math.PI; zone.add(sign);
      point(zone, 0xffd890, 40, [cx, top - 40, cz + 26], 60); }
    // 天顶改为倒置的纸页街道（微自发光，远看是一块倒扣的地面，不再是纯黑虚空）
    { const sky = new THREE.Mesh(new THREE.PlaneGeometry(160, 220), new THREE.MeshStandardMaterial({ map: textPage('#d9cfb6', '#2a2018', false, 26, 0.28), color: 0x8a8070, emissive: 0x6a6050, emissiveIntensity: 0.35, roughness: 1 })); sky.material.map.repeat.set(8, 11); sky.rotation.x = Math.PI / 2; sky.position.set(0, Y + 69.8, -140); zone.add(sky); }
    // 墨潮带远景：墨黑 → 墨蓝渐变雾幕（R5 P0-2：不露纯黑）
    { const fogT = cvTex(16, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#000000'); gr.addColorStop(0.55, '#0b1424'); gr.addColorStop(0.85, '#1c2a40'); gr.addColorStop(1, '#0a0e16'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
      const fm = new THREE.MeshBasicMaterial({ map: fogT, fog: false, side: THREE.DoubleSide }); for (const [x, z, ry, w] of [[104, -140, -Math.PI / 2, 80], [74, -172, 0, 64], [74, -108, Math.PI, 64]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 60), fm); m.position.set(x, Y + 26, z); m.rotation.y = ry; zone.add(m); } }
    zone.add(dust([0, Y, -140], [80, 30, 140], 900, 0xe8dcc0));
    b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g); jobs.push(P.build(zone));
    world.surface(-80, -240, 80, -50, 'wood', Y - 2, Y + 30);
  }

  // ============================== 装订线 ==============================
  {
    const zone = mk('seventh'), b = new Batch(), P = new Props(), Y = SY; const M10 = { pendants: [], chairs: [], stools: [] }; // 批次 M10
    // 入口 seventh_entry（z −55…−66）：牛皮纸页缝，头顶暗红线
    b.box('dp_kraft', 8, 0.3, 14, [0, Y - 0.15, -60], { uv: 0.2, collide: true });
    for (const sx of [-1, 1]) { b.box('dp_kraft', 0.4, 9, 14, [sx * 3.2, Y + 4.5, -60], { uv: 0.45, collide: true }); }
    b.box('dp_kraft', 7, 9, 0.4, [0, Y + 4.5, -53], { uv: 0.45, collide: true });
    const back = plane(zone, new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffeedd, emissiveIntensity: 0.6 }), 0.3, 6, 0, Y + 3, -53.3, Math.PI); back.userData.exit = true; ctx.depths.exitSeam = back;
    { const frag = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.14), docMat('doc_seventh_metro_fragment', new THREE.MeshStandardMaterial({ map: cvTex(128, 90, (c, w, h) => { c.fillStyle = '#efe9dc'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; c.font = '13px "NB Sans", sans-serif'; c.fillText('7. 若你已在车上', 6, 30); c.fillText('　 请……', 6, 52); }), roughness: 0.9 }))); frag.rotation.x = -Math.PI / 2; frag.rotation.z = 0.4; frag.position.set(0.8, Y + 0.01, -58); zone.add(frag); anchor('doc_seventh_metro_fragment', frag, 2.2);
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.005, 0.18), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.8 })); card.position.set(-2.9, Y + 1.3, -61); card.rotation.set(0, 0, Math.PI / 2 - 0.1); zone.add(card); anchor('doc_seventh_punchcard', card, 2.2); }
    // 回廊 seventh_gutter（弧形，z −66…−112）：两面巨页墙（一面透出反字），头顶装订线 + 线结铭牌
    const gpts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; gpts.push(new THREE.Vector3(Math.sin(t * Math.PI) * 9, 0, -66 - t * 46)); }
    const gcur = new THREE.CatmullRomCurve3(gpts);
    for (let i = 0; i < 46; i++) { const t0 = i / 46, t1 = (i + 1) / 46; const p0 = gcur.getPoint(t0), p1 = gcur.getPoint(t1); const mid = p0.clone().add(p1).multiplyScalar(0.5); const yaw = Math.atan2(p1.x - p0.x, p1.z - p0.z); const len = p0.distanceTo(p1) + 0.08; const nx = Math.cos(yaw), nz = -Math.sin(yaw);
      b.add('dp_kraft', new THREE.BoxGeometry(3.6, 0.3, len), { pos: [mid.x, Y - 0.15, mid.z], rot: [0, yaw, 0] }, { uv: 0.2, collide: true });
      b.add('dp_kraft', new THREE.BoxGeometry(0.3, 12, len), { pos: [mid.x + nx * 1.9, Y + 6, mid.z + nz * 1.9], rot: [0, yaw, 0] }, { uv: 0.45, collide: true });
      b.add('dp_page', new THREE.BoxGeometry(0.3, 12, len), { pos: [mid.x - nx * 1.9, Y + 6, mid.z - nz * 1.9], rot: [0, yaw, 0] }, { uv: 0.45, collide: true });
      for (const sd of [-1, 1]) b.add('dp_kraft', new THREE.BoxGeometry(2.3, 0.12, len), { pos: [mid.x + nx * sd * 0.98, Y + 12.35, mid.z + nz * sd * 0.98], rot: [0, yaw, -sd * 0.42] }, { uv: 0.45 }); // M6：书脊折角天花
      if (i % 4 === 0) b.add('dp_red', new THREE.BoxGeometry(0.05, 0.05, len), { pos: [mid.x, Y + 12.82, mid.z], rot: [0, yaw, 0] }, { uv: false });
      if (i % 3 === 0) { b.add('dp_red', new THREE.CylinderGeometry(0.03, 0.03, 3.8, 5), { pos: [mid.x, Y + 7.5, mid.z], rot: [0, yaw, Math.PI / 2] }, { uv: false }); }
      if (i % 6 === 3) { const kn = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.18), tagMaterial(['2019 · 三号 · 已缝合', '2021 · 五号 · 已缝合', '2023 · 七号 · 未缝合', '2024 · 七号 · 未缝合', '2025 · 七号 · 未缝合', '2026 · 七号 · ——', '——', '——'][(i / 6) | 0])); kn.position.set(mid.x, Y + 7.0, mid.z); kn.rotation.y = yaw + Math.PI / 2; zone.add(kn); if (i === 15) anchor('doc_gutter_knots', kn, 6); }
      if (i % 8 === 4) point(zone, 0xc02018, 3, [mid.x, Y + 6.5, mid.z], 9); }
    b.add('dp_red', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gpts.map((p) => p.clone().setY(Y + 7.6))), 80, 0.05, 5), null, { uv: false });
    { const p = gcur.getPoint(0.5); const mt = plane(zone, docMat('doc_gutter_mirror_text', new THREE.MeshStandardMaterial({ map: cvTex(512, 256, (c, w, h) => { c.fillStyle = '#e9e1cc'; c.fillRect(0, 0, w, h); c.save(); c.translate(w, 0); c.scale(-1, 1); c.fillStyle = '#5a1010'; c.font = '900 40px "NB Title", "NB Serif", serif'; c.fillText('第七局人员守则', 40, 70); c.font = '28px "NB Serif", serif'; c.fillText('一、我们不存在', 40, 130); c.fillText('二、所以我们记得', 40, 180); c.restore(); }), roughness: 0.9 })), 2.6, 1.3, p.x - 1.74, Y + 2.4, p.z, Math.PI / 2 * 0 + Math.atan2(1, 0)); anchor('doc_gutter_mirror_text', mt, 3); }
    jobs.push(buildM1Seventh(zone, world, Y, gcur, D, M)); // 批次 M1：入口 + 回廊 Blender 精建壳（m1_seventh.js）
    // 作战室 seventh_ops（z −112…−134，x −10…10）
    const room = (z0, z1, x0, x1, h, floor = 'dp_kraft') => { b.box(floor, x1 - x0, 0.3, z0 - z1, [(x0 + x1) / 2, Y - 0.15, (z0 + z1) / 2], { uv: 0.45, collide: true }); b.box('dp_kraft', x1 - x0, 0.3, z0 - z1, [(x0 + x1) / 2, Y + h + 0.15, (z0 + z1) / 2], { uv: 0.2 }); /* M6：页缝天花（纸背）而非纯黑 */ for (const x of [x0, x1]) b.box('dp_kraft', 0.4, h, z0 - z1, [x, Y + h / 2, (z0 + z1) / 2], { uv: 0.45, collide: true }); };
    room(-112, -134, -10, 10, 6);
    b.box('dp_kraft', 7.8, 6, 0.4, [-6.1, Y + 3, -112], { uv: 0.45, collide: true }); b.box('dp_kraft', 7.8, 6, 0.4, [6.1, Y + 3, -112], { uv: 0.45, collide: true });
    { const bt = cvTex(1024, 512, (c, w, h) => { c.fillStyle = '#120808'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8c87a'; c.font = '900 48px "NB Title", "NB Serif", serif'; c.fillText('S 级以上危机看板　·　第七局', 30, 70); c.font = '28px "NB Sans", sans-serif'; ['S-01　第二草稿：重写计划　进行中', 'S-02　灰塔：档案交换　冻结', 'S-03　余辉剧团：京城巡演　监视', 'S-07　留白：第四次写回　——'].forEach((l, i) => { c.fillStyle = i === 3 ? '#ff5a4a' : '#d8cfc0'; c.fillText(l, 40, 150 + i * 70); }); });
      const bm = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffffff, emissiveIntensity: 0.6, map: bt, emissiveMap: bt });
      const bd = plane(zone, docMat('doc_ops_board', bm), 8, 4, 0, Y + 3.2, -133.6, 0); anchor('doc_ops_board', bd, 9); }
    { const tw = plane(zone, docMat('doc_ops_traitor_wall', new THREE.MeshStandardMaterial({ map: cvTex(768, 512, (c, w, h) => { c.fillStyle = '#8a6a44'; c.fillRect(0, 0, w, h); const pts = []; for (let i = 0; i < 9; i++) { const x = 60 + (i % 3) * 250, y = 60 + Math.floor(i / 3) * 150; pts.push([x + 60, y + 50]); c.fillStyle = '#e8e0cc'; c.fillRect(x, y, 120, 100); c.fillStyle = '#2a2420'; c.fillRect(x + 20, y + 14, 80, 60); } c.strokeStyle = '#b01010'; c.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = pts[(i * 4) % 9], bq = pts[(i * 7 + 2) % 9]; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(bq[0], bq[1]); c.stroke(); } c.fillStyle = '#f0e8d0'; c.font = '900 36px "NB Title", "NB Serif", serif'; c.fillText('内鬼？', 330, 490); }), roughness: 0.9 })), 6, 4, 9.75, Y + 3, -123, -Math.PI / 2); anchor('doc_ops_traitor_wall', tw, 7); }
    { const dx = -6, dz = -126; b.box('wood', 2.6, 0.06, 1.2, [dx, Y + 0.76, dz], { uv: 0.6, collide: true }); for (const ex of [-1.2, 1.2]) b.box('wood', 0.08, 0.74, 1.1, [dx + ex, Y + 0.37, dz], { uv: 0.6 }); s7Lamp(b, dx - 0.9, Y + 0.79, dz - 0.3, 0); folderStack(b, dx + 0.9, Y + 0.79, dz - 0.2, 0.2, 4);
      const nb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.3), docMat('doc_ops_k_notes', new THREE.MeshStandardMaterial({ map: textPage('#f0e9d8', '#3a1010', false, 16, 0.8), roughness: 0.9 }))); nb.position.set(dx, Y + 0.8, dz); zone.add(nb); anchor('doc_ops_k_notes', nb, 2.4);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.09, 14), M.whiteMarble); cup.position.set(dx + 0.5, Y + 0.835, dz + 0.25); zone.add(cup); ctx.anchors.int_ops_tea = { obj: cup, range: 2.2 }; if (NO_M10) P.add('office_chair', [dx, Y, dz + 0.9], { h: 1.05, yaw: Math.PI }); else M10.chairs.push([dx, Y, dz + 0.9, Math.PI]); }
    for (let k = 0; k < 4; k++) { const x = -4 + k * 2.6; b.box('dp_inkMatte', 2.2, 0.06, 4, [x + 4, Y + 0.76, -120], { uv: 0.4 }); world.box(x + 4, Y + 0.4, -120, 2.2, 0.8, 4); paperStack(b, x + 4, Y + 0.79, -119.5, k, 5); }
    { const ex = emblem(1.2, M.goldBright, M.leather); ex.position.set(-9.75, Y + 3.6, -122); ex.rotation.y = Math.PI / 2; zone.add(ex); const qi = goldText('柒', 1.4, 1.4, new THREE.MeshStandardMaterial({ color: 0x7a1010, metalness: 0.4, roughness: 0.4, emissive: 0x400404 }), { res: 256 }); qi.position.set(-9.75, Y + 1.6, -122); qi.rotation.y = Math.PI / 2; zone.add(qi); }
    point(zone, 0xffc8a0, 10, [0, Y + 5, -118], 16); point(zone, 0xc02018, 6, [0, Y + 4, -130], 10);
    // 杀青室 seventh_wrap（z −134…−158）：档案柜列 + 三只空白档案袋 + 落地镜
    room(-134, -158, -8, 8, 5.4);
    b.box('dp_kraft', 6.6, 5.4, 0.4, [-4.7, Y + 2.7, -134], { uv: 0.45, collide: true }); b.box('dp_kraft', 6.6, 5.4, 0.4, [4.7, Y + 2.7, -134], { uv: 0.45, collide: true });
    for (let r = 0; r < 4; r++) for (const sx of [-1, 1]) { const f = new Frame([sx * 7.4, Y, -138 - r * 4.6], sx > 0 ? -Math.PI / 2 : Math.PI / 2); spineShelf(b, f, 3.3, 3.0, 0.6, { seed: r * 7 + sx, wood: 'dp_inkMatte' }); world.box(sx * 7.4, Y + 1.5, -138 - r * 4.6, 0.6, 3.0, 3.3); } // M8：书架 4.4→3.0 m 高、3.6→3.3 m 宽，壁柱/护墙/分格墙露出
    { const wi = plane(zone, docMat('doc_wrap_intro', signMaterial('杀青室', ['此处存放已杀青之人', '请勿唤其名'], 400, 320)), 0.9, 0.72, 2.6, Y + 1.9, -134.25, 0); anchor('doc_wrap_intro', wi); }
    { b.box('wood', 3.4, 0.9, 0.9, [0, Y + 0.45, -146], { uv: 0.6, collide: true }); ['doc_wrap_file_2023', 'doc_wrap_file_2024', 'doc_wrap_file_2025'].forEach((id, k) => { const env = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.42), M.kraft); env.position.set(-1 + k, Y + 0.91, -146); env.rotation.y = (k - 1) * 0.08; zone.add(env); const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.06), tagMaterial('07-0-0000 · ' + (2023 + k))); lb.rotation.x = -Math.PI / 2; lb.position.set(-1 + k, Y + 0.92, -146.1); zone.add(lb); anchor(id, env, 2.0); }); point(zone, 0xffe0b0, 4, [0, Y + 2.6, -146], 6); }
    { b.box('gold', 1.5, 2.6, 0.08, [0, Y + 1.5, -157.7], { uv: 1 }); const mir = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.4), new THREE.MeshPhysicalMaterial({ color: 0x9aa0a8, metalness: 1, roughness: 0.04, envMapIntensity: 1.4 })); mir.position.set(0, Y + 1.5, -157.64); zone.add(mir); const bf = plane(zone, D.dp_blank, 0.22, 0.3, 0, Y + 1.62, -157.62, 0); void bf; ctx.anchors.int_wrap_mirror = { box: [0, Y + 1, -156.4, 1.6, 2, 1.4] }; }
    point(zone, 0xd8c8a8, 5, [0, Y + 4.4, -140], 12);
    // 回写台 seventh_rewrite（z −158…−186）：长桌 + 空白巨书 + 墨池金笔 + 柒字印章
    room(-158, -186, -9, 9, 9);
    b.box('dp_kraft', 7.4, 9, 0.4, [-5.3, Y + 4.5, -158], { uv: 0.45, collide: true }); b.box('dp_kraft', 7.4, 9, 0.4, [5.3, Y + 4.5, -158], { uv: 0.45, collide: true }); b.box('dp_kraft', 18, 9, 0.4, [0, Y + 4.5, -186], { uv: 0.45, collide: true });
    { b.box('dp_inkMatte', 3.2, 0.9, 7, [0, Y + 0.45, -174], { uv: 0.4, collide: true }); b.box('gold', 3.24, 0.05, 7.04, [0, Y + 0.92, -174], { uv: 1 });
      const book = new THREE.Group(); for (const s of [-1, 1]) { const pg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 1.7), D.dp_blank); pg.position.set(s * 0.62, 0.04, 0); pg.rotation.z = s * -0.05; book.add(pg); } const cov = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 1.8), M.leather); cov.position.y = -0.02; book.add(cov); book.position.set(0, Y + 0.95, -173); zone.add(book); anchor('doc_rewrite_last_page', book, 3);
      const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.08, 20), D.dp_ink); pool.position.set(1.1, Y + 0.97, -175.3); zone.add(pool); const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.006, 0.32, 8), M.goldBright); pen.position.set(1.1, Y + 1.05, -175.3); pen.rotation.z = 0.6; zone.add(pen);
      const seal = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.12), new THREE.MeshStandardMaterial({ color: 0x6a0c0c, roughness: 0.4 })); seal.position.set(-1.1, Y + 1.0, -175.2); zone.add(seal); ctx.depths.rewrite = book; ctx.depths.rewriteBox = [0, Y + 1.0, -174.5, 3.4, 1.6, 3.4];
      const rp = plane(zone, docMat('doc_rewrite_plate', brassPlaqueMaterial('回写台', ['此处可将已归档之人', '写回正文'])), 0.8, 0.6, 0, Y + 0.6, -170.48, 0); anchor('doc_rewrite_plate', rp);
      for (let k = 0; k < 9; k++) b.add('dp_red', new THREE.CylinderGeometry(0.025, 0.025, 9, 5), { pos: [-8 + k * 2, Y + 4.5, -185.7] }, { uv: false });
      spot(zone, 0xffe8c0, 90, [0, Y + 8.6, -170], [0, Y + 1, -174], 0.4, true, 14); point(zone, 0xc02018, 6, [0, Y + 6, -184], 12); }
    // —— 加密：天花梁与红线网、作战室桌椅地图台灯、档案柜、电报机、回写台红线纸条林、烛台、地面线结圆环 ——
    for (const [z0, z1, x0, x1, h] of [[-112, -134, -10, 10, 6], [-134, -158, -8, 8, 5.4], [-158, -186, -9, 9, 9]]) { for (let z = z0 - 2; z > z1; z -= 3) b.box('dp_kraft', x1 - x0, 0.35, 0.3, [(x0 + x1) / 2, Y + h - 0.2, z], { uv: 0.5 }); for (let x = x0 + 2; x < x1; x += 4) b.add('dp_red', new THREE.CylinderGeometry(0.015, 0.015, z0 - z1, 4), { pos: [x, Y + h - 0.4, (z0 + z1) / 2], rot: [Math.PI / 2, 0, 0] }, { uv: false }); }
    for (let k = 0; k < 4; k++) { const x = k * 2.6; for (const dz of [-1.4, 0, 1.4]) { if (NO_M10) P.add('office_chair', [x + 1.2 * (dz ? 1 : 0) - 0.6, Y, -120 + dz * 1.6], { h: 1.0, yaw: (k + dz) * 0.7 }); else M10.chairs.push([x + 1.2 * (dz ? 1 : 0) - 0.6, Y, -120 + dz * 1.6, (k + dz) * 0.7]); } b.add('dp_page', new THREE.PlaneGeometry(1.6, 1.1), { pos: [x, Y + 0.795, -120.3], rot: [-Math.PI / 2, 0, k * 0.2] }, { uv: false }); s7Lamp(b, x - 0.8, Y + 0.79, -121.5, 0); if (NO_M10) { b.add('dz_cable', new THREE.CylinderGeometry(0.01, 0.01, 4, 4), { pos: [x, Y + 4, -120] }, { uv: false }); b.add('dz_shade', new THREE.ConeGeometry(0.35, 0.3, 16, 1, true), { pos: [x, Y + 2.2, -120] }, { uv: false }); } else { b.add('dz_cable', new THREE.CylinderGeometry(0.01, 0.01, 2.85, 4), { pos: [x, Y + 4.575, -120] }, { uv: false }); M10.pendants.push([x, Y + 3.15, -120]); } } // M10：白圆锥罩 → 暖黑搪瓷工业吊灯（罩口仍在 Y+2.2）
    for (let k = 0; k < 8; k++) P.add('file_cabinet', [-9.4, Y, -114 - k * 0.65], { h: 1.4, yaw: Math.PI / 2 }); world.box(-9.4, Y + 0.7, -116.3, 0.7, 1.4, 5.2);
    P.add('telegraph', [-6.9, Y + 0.79, -126.3], { h: 0.25, yaw: 0.4 }); P.add('wall_clock', [0, Y + 5.2, -133.7], { w: 0.8 });
    for (let k = 0; k < 120; k++) { const x = (rnd() - 0.5) * 16, z = -160 - rnd() * 24; if (Math.abs(x) < 2.2 && z < -169 && z > -179) continue; const len = 3 + rnd() * 5; b.add('dp_red', new THREE.CylinderGeometry(0.008, 0.008, len, 3), { pos: [x, Y + 9 - len / 2, z] }, { uv: false }); b.add('dp_page', new THREE.PlaneGeometry(0.12, 0.22), { pos: [x, Y + 9 - len - 0.1, z], rot: [0, rnd() * 3, 0] }, { uv: false }); }
    for (const [x, z] of [[-2.2, -170.5], [2.2, -170.5], [-2.2, -177.5], [2.2, -177.5]]) { b.add('gold', new THREE.CylinderGeometry(0.08, 0.14, 1.3, 10), { pos: [x, Y + 0.65, z] }, { uv: 1 }); b.add('dz_glow', new THREE.CylinderGeometry(0.03, 0.03, 0.18, 6), { pos: [x, Y + 1.4, z] }, { uv: false }); point(zone, 0xffb870, 1.6, [x, Y + 1.6, z], 4); }
    { const r = new THREE.RingGeometry(4.6, 4.8, 64); r.rotateX(-Math.PI / 2); b.add('dp_red', r, { pos: [0, Y + 0.01, -174] }, { uv: false }); const r2 = new THREE.RingGeometry(5.6, 5.65, 64); r2.rotateX(-Math.PI / 2); b.add('gold', r2, { pos: [0, Y + 0.01, -174] }, { uv: false }); }
    for (let r = 0; r < 4; r++) for (const sx of [-1, 1]) { if (NO_M10) { b.add('dz_shade', new THREE.ConeGeometry(0.3, 0.26, 14, 1, true), { pos: [sx * 3, Y + 3.6, -138 - r * 4.6] }, { uv: false }); b.add('dz_cable', new THREE.CylinderGeometry(0.01, 0.01, 1.8, 4), { pos: [sx * 3, Y + 4.5, -138 - r * 4.6] }, { uv: false }); } else { b.add('dz_cable', new THREE.CylinderGeometry(0.01, 0.01, 0.85, 4), { pos: [sx * 3, Y + 4.975, -138 - r * 4.6] }, { uv: false }); M10.pendants.push([sx * 3, Y + 4.55, -138 - r * 4.6]); } } // M10：杀青室吊灯同换
    b.box('dp_kraft', 2.4, 0.04, 20, [0, Y + 0.01, -146], { uv: false }); for (let k = 0; k < 6; k++) { if (NO_M10) b.box('wood', 0.5, 0.45, 0.5, [-1.6 + (k % 2) * 3.2, Y + 0.23, -138 - Math.floor(k / 2) * 6], { uv: 0.6 }); else M10.stools.push([-1.6 + (k % 2) * 3.2, Y, -138 - Math.floor(k / 2) * 6]); } // M10：纯黑方块 = 杀青室木凳（无碰撞、非锚点）→ 胡桃框皮面方凳
    zone.add(dust([0, Y, -120], [24, 10, 140], 400, 0xd8b890));
    b.build(zone, MAT); for (const g of b.colliders) world.addGeo(g); jobs.push(P.build(zone)); jobs.push(buildM5Seventh(zone, world, Y, D, M)); if (!NO_M10) jobs.push(buildM10Seventh(zone, M10)); // 批次 M5：作战室/杀青室/回写台精建壳
  }
  // —— 入口道具：B6 维护门、B5 深库后门、局长室无名书 ——
  { const z = ctx.zones.training; if (z) { const y = UNDER.B6, g = new THREE.Group(); const fr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.4, 2.2), M.blackMetal); fr.position.set(0, 1.7, 0); g.add(fr); const dr = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.0, 1.8), M.paintedSteel); dr.position.set(0.12, 1.5, 0); g.add(dr); const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.3), tagMaterial('维护通道　·　通往书芯')); pl.position.set(0.19, 3.1, 0); pl.rotation.y = Math.PI / 2; g.add(pl); const lt = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff3020, emissiveIntensity: 3 })); lt.position.set(0.2, 3.5, 0); g.add(lt); g.position.set(-31.75, y, -146); z.add(g); ctx.depths.b6Door = dr; } }
  { const z = ctx.zones.vault_b5; if (z) { const y = -42; const dr = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.2, 0.2), M.iron); dr.position.set(0, y + 2.1, -133.9); z.add(dr); const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.3), tagMaterial('深库后门　·　墨渊')); pl.position.set(0, y + 4.5, -133.7); z.add(pl); ctx.depths.b5Door = dr; } }
  { const z = ctx.zones.director; if (z) { const bk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.26), new THREE.MeshStandardMaterial({ color: 0x5a0c0c, roughness: 0.5 })); bk.position.set(-4.6, 71.8 + 1.62, -92.95); bk.rotation.z = 0.12; z.add(bk); ctx.directorBook = bk; } }
  await Promise.all(jobs);
}

/** M5：第七局台灯——原 greenLamp 绿玻璃罩改暗铜座 + 烟褐纸罩（禁人造物蓝绿） */
function s7Lamp(b, x, y, z) {
  b.add('gold', new THREE.CylinderGeometry(0.08, 0.1, 0.03, 16), { pos: [x, y + 0.015, z] }, { uv: 1 });
  b.add('gold', new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), { pos: [x, y + 0.17, z] }, { uv: 1 });
  b.add(NO_M10 ? 'dz_shade' : 'dz_brassDim', new THREE.ConeGeometry(0.13, 0.12, 14, 1, true), { pos: [x, y + 0.36, z] }, { uv: false }); // M10：白色发光小圆锥（自发光 1.2）→ 暗铜罩
}

export function updateDepths(ctx, dt, t) {
  const d = ctx.depths; if (!d) return;
  for (const p of d.pages) { p.position.y += Math.sin(t * p.userData.v + p.id) * 0.004; p.rotation.y += dt * p.userData.v * 0.3; }
  for (const [i, m] of d.redTexts.entries()) { m.material.opacity = 0.55 + 0.45 * Math.sin(t * 1.3 + i); }
  if (d.floatFile) { d.floatFile.position.y = AY + 1.6 + Math.sin(t * 1.1) * 0.08; d.floatFile.rotation.y += dt * 0.4; }
  if (d.tide) { d.tide.material.map.offset.set(t * 0.01, t * 0.004); const pa = d.tide.geometry.attributes.position; for (let i = 0; i < pa.count; i += 1) { const x = pa.getX(i), y = pa.getY(i); pa.setZ(i, Math.sin(x * 0.4 + t * 0.8) * 0.12 + Math.cos(y * 0.33 + t * 0.6) * 0.1); } pa.needsUpdate = true; }
  if (d.fold) d.fold.material.opacity = 0.85 + Math.sin(t * 0.7) * 0.07;
}

/** 区域判定（main.zoneAt 调用）：返回墨渊/装订线子区域或 null */
export function depthZone(p) {
  if (p.y > -250) return null;
  if (p.y > -450) {
    if (p.y > AY + 12 && p.z < -186) return 'abyss_core';
    if (p.x < -14) return 'abyss_exam';
    if (p.x > 14) return 'abyss_tide';
    if (p.z > -82) return 'abyss_gate';
    return 'abyss_city';
  }
  if (p.z > -66) return 'seventh_entry';
  if (p.z > -112) return 'seventh_gutter';
  if (p.z > -134) return 'seventh_ops';
  if (p.z > -158) return 'seventh_wrap';
  return 'seventh_rewrite';
}

/** 入口、转场、结局 */
export function setupDepths(G, { toast, dialog, fade, chapterCard, updateObjective, docPages }) {
  const { inter, ctx, audio, player } = G;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const go = async (pos, yaw, text) => { G.freeze(true); audio.sfx('S17', 0.6); fade(true); await sleep(900); player.pos.set(...pos); player.vel?.set(0, 0, 0); player.yaw = yaw; player.pitch = 0; if (text) toast(text, { ms: 4200, whisper: true }); await sleep(1100); fade(false); G.freeze(false); G.glitch?.(0.8); };
  G.toAbyss = () => go([0, AY + 0.05, -58], Math.PI, '（电梯一直往下。数字跳过了 B7，屏幕上只剩一个「墨」字。）');
  G.toSeventh = () => go([0, SY + 0.05, -57], Math.PI, '（缝隙比看上去宽。纸的背面，有人用红线缝着整栋楼。）');
  G.toB6 = () => go([0, UNDER.B6 + 0.05, -95], Math.PI, '（你回到训练场。身后的门只是一扇普通的维护门。）');
  // B6 训练场西墙 维护通道
  const md = ctx.depths?.b6Door; if (md) inter.add({ id: 'depth_b6_door', obj: md, range: 3, prompt: () => '按 E 打开维护通道', use: async () => { const c = await dialog(['（门上写着：维护通道 · 通往书芯。下方一行小字被划掉了。）', '> 选项 A：推门进去', '> 选项 B：离开']); if (c === 'A') await G.toAbyss(); } });
  const b5 = ctx.depths?.b5Door; if (b5) inter.add({ id: 'depth_b5_door', obj: b5, range: 3, prompt: () => '按 E 推开深库后门', use: async () => { await G.toAbyss(); } });
  if (ctx.depths?.returnDoor) inter.add({ id: 'depth_return', obj: ctx.depths.returnDoor, range: 4, prompt: () => '按 E 乘维护梯返回 B6', use: () => G.toB6() });
  if (ctx.depths?.coreSeam) inter.add({ id: 'depth_core_seam', obj: ctx.depths.coreSeam, range: 3, prompt: () => '按 E 跟着红线走进页缝', use: () => go([1.2, SY + 0.05, -68], Math.PI, '（红线把你领进两页纸之间。）') });
  if (ctx.depths?.exitSeam) inter.add({ id: 'depth_seventh_exit', obj: ctx.depths.exitSeam, range: 3, prompt: () => '按 E 从缝隙回到 B1', use: () => go([-35.7, (ctx.b1Y ?? -4.2) + 0.05, -39.0], Math.PI, null) });
  // 折页门：交互后穿门（transition 由 manifest 提供文本）
  ctx.hooks = ctx.hooks ?? {};
  ctx.hooks.int_abyss_fold = () => { player.pos.set(0, AY + 0.05, -88); player.vel?.set(0, 0, 0); G.glitch?.(1.4); };
  // 局长室无名书 → 装订线
  if (ctx.directorBook) inter.add({ id: 'depth_director_book', obj: ctx.directorBook, range: 2.6, prompt: () => '按 E 抽出那本没有书名的书', use: async () => { toast('（书柜向内转开。后面不是墙，是一页纸的背面。）', { ms: 3500, whisper: true }); await sleep(1600); await G.toSeventh(); } });
  // B1 第 7 排缝隙（第一章完成后）
  if (ctx.seam) inter.add({ id: 'depth_b1_seam', obj: ctx.seam, range: 2.4, enabled: () => content.has('q5_b1') && !!ctx.seam.visible, prompt: () => '按 E 侧身挤进缝隙', use: () => G.toSeventh() });
  // 回写台：三结局
  const ch = content.inter('int_rewrite_choice');
  if (ctx.depths?.rewriteBox) inter.add({ id: 'int_rewrite_choice', box: ctx.depths.rewriteBox, range: 3, prompt: () => ch.prompt ?? '按 E 拿起笔', use: async () => {
    const opts = ch.choices ?? [{ id: 'a', label: '写下名字', result: '结局 A：署名。' }, { id: 'b', label: '按下「柒」字印章', result: '结局 B：装订。' }, { id: 'c', label: '合上书，走回地面', result: '结局 C：留白。' }];
    G.freeze(true); const c = await dialog(['（空白巨书摊开在你面前。墨池里的金笔，旁边是一枚「柒」字印章。）', ...opts.map((o, i) => `> 选项 ${'ABC'[i]}：${o.label}`)]); G.freeze(false);
    const pick = opts['ABC'.indexOf(c)]; if (!pick) return;
    content.set('ending:' + pick.id); audio.sfx('S17', 0.8);
    const lines = (pick.result ?? '').split('\n').filter(Boolean); const title = lines.find((l) => l.startsWith('结局')) ?? '结局';
    G.freeze(true); for (const l of lines.filter((l) => l !== title)) { toast(l, { ms: 3600, whisper: l.startsWith('（') }); await sleep(3300); }
    await chapterCard(title, pick.id === 'end_c_close' ? '下一轮报到开始。' : '叙事管理局　·　终', 7000);
    fade(true); await sleep(900); player.pos.set(0, 0.05, 72); player.yaw = 0; player.pitch = 0; player.vel?.set(0, 0, 0); await sleep(700); fade(false); G.freeze(false);
    if (pick.id === 'end_c_close') { await G.read?.(docPages('doc_plaza_notice_phone')); }
    updateObjective?.();
  } });
}
