// 第一章「报到」：把 manifest 中的文档/交互/提示接到场景热点上
import * as THREE from 'three';
import { content } from './engine/content.js';
import { toast, dialog, openReader, docPages, updateObjective, updateInventory, chapterCard, ui } from './ui/ui.js';
import { drawScanAlert, envelopeMesh } from './world/interiors.js';
import { FLOOR } from './world/exterior.js';
import { mats } from './world/mats.js';

const Y = FLOOR;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function setupStory(G) {
  const { inter, ctx, audio, scene } = G;
  const read = async (docId, extra) => { audio.sfx('S08', 0.7); await G.read(docPages(docId, extra)); };
  const lines = (id) => content.inter(id).lines ?? [content.inter(id).result_text ?? ''];
  const prompt = (id, fallback = '按 E 查看') => () => content.inter(id).prompt ?? fallback;
  const spotRead = (docId, box, p = '按 E 查看', range = 3.2) => inter.add({ id: docId, box, range, prompt: () => p, use: () => read(docId) });
  const objRead = (docId, obj, p = '按 E 查看', range = 3.2) => inter.add({ id: docId, obj, range, prompt: () => p, use: () => read(docId) });

  // ———————— 广场 ————————
  spotRead('doc_plaza_fountain_plaque', [ctx.fountainPlaque.x, ctx.fountainPlaque.y, ctx.fountainPlaque.z, 1.8, 1.2, 1.0], '按 E 阅读铭牌');
  inter.add({ id: 'int_plaza_fountain_coin', obj: ctx.fountainWater, range: 5.5, prompt: prompt('int_plaza_fountain_coin'), use: () => { audio.sfx('S15'); toast(content.inter('int_plaza_fountain_coin').result_text, { ms: 6500 }); } });
  // 泉边静止 30 秒
  let still = 0; const wait = content.inter('int_plaza_fountain_wait');
  inter.volume({ box: [-19, -1, 11, 19, 4, 49], inside: (dt) => { if (wait.done) return; const v = G.player.vel; if (Math.hypot(v.x, v.z) < 0.15 && ui.state === 'play') still += dt; else still = 0; if (still > 30) { wait.done = true; audio.sfx('S16'); toast(wait.result_text, { ms: 9000, whisper: true }); if (ctx.lawFloor) { ctx.lawFloor.material.emissive = new THREE.Color(0x8a5a10); ctx.lawFloor.material.emissiveIntensity = 1.2; setTimeout(() => { ctx.lawFloor.material.emissiveIntensity = 0; }, 7000); } } } });
  // 水面倒影凝视
  inter.look({ target: ctx.fountainCenter.clone().add(V(0, 0.6, 7)), r: 3, t: 3, maxDist: 16, enabled: () => G.camera.position.y < 4 && G.pitchDown(), fire: () => toast(content.inter('int_plaza_reflection').result_text, { ms: 7000, whisper: true }) });
  // 报纸（东侧第三张长椅）
  if (ctx.newspaperBench) {
    const p = ctx.newspaperBench.position;
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.01, 0.3), new THREE.MeshStandardMaterial({ map: newspaperTexture(), roughness: 0.9 }));
    paper.position.set(p.x - 0.1, 0.47, p.z + 0.3); paper.rotation.set(0.05, 0.6, 0.1); paper.castShadow = true; scene.add(paper);
    objRead('doc_plaza_newspaper', paper, '按 E 捡起报纸', 2.5);
  }
  if (ctx.countdownScreen) objRead('doc_plaza_screen_countdown', ctx.countdownScreen, '按 E 查看公告屏', 14);
  spotRead('doc_plaza_flagpole', [-14.5, 0.8, 44, 1.2, 1.6, 1.2], '按 E 阅读旗杆铭文', 2.6);
  inter.add({ id: 'int_plaza_old_painter', box: [ctx.painterPos.x, 1.0, ctx.painterPos.z, 1.4, 2, 1.4], range: 3, prompt: prompt('int_plaza_old_painter', '按 E 查看'), use: () => dialog(lines('int_plaza_old_painter')) });

  // ———————— 正门 ————————
  objRead('doc_gate_visitor_rules', ctx.visitorStele, '按 E 阅读访客须知');
  objRead('doc_gate_newcomer', ctx.newcomerPlaque, '按 E 阅读铜牌');
  objRead('doc_gate_directory', ctx.directorySign, '按 E 查看导视牌');
  objRead('doc_gate_queue_screen', ctx.queueScreen, '按 E 查看叫号屏', 10);
  spotRead('doc_gate_brochure', [10.1, Y + 1.32, -23.2, 0.6, 0.5, 0.8], '按 E 拿一份折页', 2.4);
  const desk = content.inter('int_gate_desk');
  inter.add({
    id: 'int_gate_desk', box: [10.5, Y + 1.4, -17.0, 1.6, 1.4, 2.6], range: 3.0,
    enabled: () => !content.has(desk.completes ?? 'q1_badge'),
    prompt: prompt('int_gate_desk', '按 E 办理报到'),
    use: async () => {
      await dialog(desk.lines ?? ['干事：拿好，临时证。']);
      content.give(desk.gives ?? 'item_badge'); content.set(desk.completes ?? 'q1_badge');
      audio.sfx('S16'); toast('获得：临时入职证'); updateInventory(); updateObjective();
      // 卡纸：废卡可拾取
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.004, 0.055), new THREE.MeshStandardMaterial({ color: 0xf4f0e6, roughness: 0.6 }));
      card.position.copy(ctx.printerPos).add(V(-0.1, 0.02, 0)); scene.add(card);
      const sp = objRead('doc_gate_misprint', card, '按 E 拾起废卡', 2.6);
      sp.enabled = () => !sp.taken; const u = sp.use; sp.use = async () => { sp.taken = true; card.visible = false; audio.sfx('S07'); await u(); };
    },
  });
  inter.look({ target: ctx.emblemWallGem, r: 0.45, t: 2.5, maxDist: 3.2, fire: () => toast(content.inter('int_gate_emblem_wall').result_text, { ms: 6000, whisper: true }) });

  // ———————— 安检大厅 ————————
  objRead('doc_sec_main_screen', G.mainScreenProxy, '按 E 查看监测大屏', 30);
  objRead('doc_sec_rules', ctx.secRules, '按 E 阅读安检规定');
  objRead('doc_sec_wanted_board', ctx.wantedBoard, '按 E 查看通缉公告栏', 3.5);
  spotRead('doc_sec_contraband_label', [ctx.contrabandCase.x, ctx.contrabandCase.y, ctx.contrabandCase.z, 1.0, 1.4, 1.2], '按 E 查看展示柜标签', 2.6);
  const clk = content.inter('int_sec_clock');
  inter.add({ id: 'int_sec_clock', box: [ctx.clockPos.x, ctx.clockPos.y, ctx.clockPos.z, 0.9, 2.6, 0.8], range: 2.8, prompt: prompt('int_sec_clock', '按 E 看钟'), use: async () => { audio.sfx('S18'); toast(clk.result_text, { ms: 6500 }); setTimeout(() => read('doc_sec_clock'), 2600); } });
  // 闸机：未领证不得通过
  const GZ = -40;
  inter.volume({ box: [-13, Y - 1, GZ + 0.2, 13, Y + 3, GZ + 1.6], enabled: () => !content.has('item_badge'), enter: () => { toast('闸机没有反应。\n请先在正门服务台领取临时入职证。'); G.player.pos.z = GZ + 2.6; G.player.vel.set(0, 0, 0); } });
  // 只有 7 号道开放（其余道顶着翼闸）
  // 7 号扫描门事件
  const scanner = content.inter('int_sec_scanner');
  const lane7 = ctx.lanes[6];
  let scanning = false;
  inter.volume({
    box: [lane7 - 0.6, Y - 1, GZ - 3.8, lane7 + 0.6, Y + 3, GZ - 2.6],
    enabled: () => content.has('item_badge') && !content.has('q2_scan') && !scanning,
    enter: async () => {
      scanning = true; G.freeze(true);
      const ring = ctx.scanRings[6].ring; const t0 = performance.now();
      audio.sfx('S05');
      const seq = scanner.sequence ?? [];
      const anim = () => { const t = (performance.now() - t0) / 1000; ring.position.y = Y + 2.25 - Math.min(1, t / 3.5) * 1.15; ring.material.emissiveIntensity = 4 + Math.sin(t * 12) * 1.5; if (t < 6) requestAnimationFrame(anim); };
      anim();
      for (const l of seq) { toast(l, { ms: 3000, whisper: l.startsWith('（') }); await sleep(2700); }
      ctx.scanScreen.draw = drawScanAlert; audio.sfx('S06', 0.7);
      ctx.scanRings[6].ind.material.emissive.set(0xffa020);
      // 殷泽走近
      const yz = ctx.yinze; yz.position.set(lane7 + 0.4, Y, GZ - 5.6); yz.lookAt(G.player.pos.x, Y, G.player.pos.z);
      await sleep(600);
      await dialog(content.inter('dlg_yinze_review').lines ?? ['殷泽：放行。']);
      content.set(content.inter('dlg_yinze_review').completes ?? 'q2_scan'); updateObjective();
      ctx.scanRings[6].ind.material.emissive.set(0x44ff88);
      G.freeze(false); scanning = false;
      setTimeout(() => toast(content.hint('hint_ctx_archive_way') ?? '← 西翼　人事档案馆', { ms: 4000 }), 1200);
    },
  });
  // 回头张望
  let lookedBack = false;
  G.onUpdate.push(() => {
    if (lookedBack || !content.has('q2_scan') || G.zone !== 'security_hall' || content.has('q3_file')) return;
    const d = G.camera.getWorldDirection(new THREE.Vector3());
    if (d.z > 0.85 && G.player.pos.z < -46) { lookedBack = true; toast(content.hint('hint_ctx_lookback') ?? '', { ms: 6000, whisper: true }); G.glitch(0.8); }
  });
  // 殷泽保持两步距离
  G.onUpdate.push((dt) => {
    const yz = ctx.yinze; if (!yz || G.zone !== 'security_hall' || scanning) return;
    const dx = yz.position.x - G.player.pos.x, dz = yz.position.z - G.player.pos.z; const d = Math.hypot(dx, dz);
    if (d < 2.0 && d > 0.01) { const k = (2.0 - d) / d; yz.position.x = THREE.MathUtils.clamp(yz.position.x + dx * k, -11, 11); yz.position.z = THREE.MathUtils.clamp(yz.position.z + dz * k, -74, -44); }
    if (d < 8) { const a = Math.atan2(G.player.pos.x - yz.position.x, G.player.pos.z - yz.position.z); yz.rotation.y += (a - yz.rotation.y) * Math.min(1, dt * 3); }
  });
  let whispered = false;
  G.onZone.push((z) => { if (z === 'security_hall' && !whispered && content.has('q1_badge')) { whispered = true; setTimeout(() => toast(content.hint('hint_ctx_gate_way') ?? '', { ms: 4500, whisper: true }), 1500); } });

  // ———————— 档案馆 ————————
  objRead('doc_archive_rules', ctx.archiveRules, '按 E 阅读规章铜牌');
  objRead('doc_archive_note_yexun', ctx.stickyNote, '按 E 看便利贴', 2.2);
  objRead('doc_archive_public_intro', ctx.pubIntro, '按 E 阅读说明牌');
  for (const c of ctx.pubCases) objRead(c.id, c.obj, '按 E 查看档案', 3.2);
  const lb = content.inter('int_archive_logbook');
  inter.add({ id: 'int_archive_logbook', obj: ctx.ledger, range: 2.6, prompt: () => content.requiresMet(lb) ? (lb.prompt ?? '按 E 翻看登记簿') : '按 E 翻看登记簿（核对完档案后再签字）', use: () => { if (!content.requiresMet(lb)) { toast('叶寻：先核对档案，再签字。'); return; } read(lb.doc ?? 'doc_archive_logbook'); } });
  const yx = content.inter('int_archive_yexun');
  inter.add({
    id: 'int_archive_yexun', box: [ctx.yexun.position.x + 0.9, Y + 1.2, ctx.yexun.position.z, 1.6, 1.6, 2.2], range: 3.2,
    enabled: () => !content.has('q3_file'),
    prompt: () => content.requiresMet(yx) ? (yx.prompt ?? '按 E 领取档案') : '按 E 交谈',
    use: async () => {
      if (!content.requiresMet(yx)) { await dialog(['叶寻：……新人？先去安检。没扫描过的人，档案调不出来。']); return; }
      const L = yx.lines ?? [];
      const idx = L.findIndex((l) => l.includes('影子'));
      await dialog(L.slice(0, idx >= 0 ? idx : L.length));
      if (idx >= 0) {
        // 影子去取档案
        const sh = ctx.yexunShadow; sh.visible = true; const start = sh.position.clone(); const t0 = performance.now();
        await new Promise((res) => { const step = () => { const t = (performance.now() - t0) / 1000; const k = t < 2 ? t / 2 : t < 3 ? 1 : Math.max(0, 1 - (t - 3) / 2); sh.position.set(start.x - k * 0.2, Y, start.z - k * 4.5); sh.rotation.y = t < 2.5 ? Math.PI : 0; if (t < 5) requestAnimationFrame(step); else { sh.visible = false; res(); } }; step(); });
        await dialog(L.slice(idx));
      }
      content.give(yx.gives ?? 'item_file'); content.set(yx.completes ?? 'q3_file'); updateInventory(); updateObjective(); audio.sfx('S07');
      await openFile();
    },
  });
  // 档案袋：拿起 → 解绕线 → 翻开
  const openFile = async () => {
    const M = mats(); const env = envelopeMesh(M); env.scale.setScalar(1.6);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.004, 0.1), M.kraft); flap.position.set(0, 0.008, 0.18); flap.geometry.translate(0, 0, -0.05); env.add(flap);
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 20), M.waxRed); seal.position.set(0, 0.011, 0.11); env.add(seal);
    G.camera.add(env); env.position.set(0, -0.08, -0.5); env.rotation.set(1.2, 0, 0);
    audio.sfx('S09');
    const t0 = performance.now();
    await new Promise((res) => { const step = () => { const t = (performance.now() - t0) / 1000; flap.rotation.x = -Math.min(1, t / 1.2) * 2.6; env.position.y = -0.08 + Math.sin(Math.min(1, t) * Math.PI / 2) * 0.02; if (t < 1.5) requestAnimationFrame(step); else res(); }; step(); });
    G.camera.remove(env);
    const ids = ['doc_archive_file_cover', 'doc_archive_file_p1', 'doc_archive_file_p2', 'doc_archive_file_p3'];
    const pages = [];
    for (const id of ids) {
      const d = content.doc(id); const pg = docPages(id);
      for (const p of pg) { p.onShow = () => { if (d.completes_on_read) { content.set(d.completes_on_read); updateObjective(); } audio.sfx('S08', 0.6); }; if (id === 'doc_archive_file_cover' && !p.img) p.stamp = '柒'; }
      // 有贴图的页附上文字页
      if (pg[0].img && d.text) pages.push(...pg, { title: d.title, text: d.text, style: d.page === 3 ? 'dark' : '', onShow: pg[0].onShow }); else pages.push(...pg);
    }
    await G.read(pages);
    if (['q4_read_1', 'q4_read_2', 'q4_read_3'].every((f) => content.has(f))) { setTimeout(() => toast('（登记簿就在柜台左侧。）', { ms: 4000, whisper: true }), 800); }
  };
  // 档案袋也可在物品栏重读
  G.reopenFile = () => content.has('item_file') && openFile();
  // B1 第 7 排密集架
  const cp = content.inter('int_archive_compactor');
  inter.add({
    id: 'int_archive_compactor', obj: ctx.compactPanel, range: 2.4,
    enabled: () => !content.has('q5_b1'),
    prompt: () => content.requiresMet(cp) ? (cp.prompt ?? '按 E 操作密集架') : '密集架控制面板（需要档号）',
    use: async () => {
      if (!content.requiresMet(cp)) { toast('面板上是四位档号拨盘。你还不知道该拨什么。'); return; }
      const sol = cp.solution ?? '07-0-0000';
      const choice = await dialog(['（拨盘上能拨出几组数字。）', '> 选项 A：「XS-2026-1029-07」', '> 选项 B：「' + sol + '」', '> 选项 C：「2023-06-08」', '（你松开手。）']);
      if (choice !== 'B') { audio.sfx('S10', 0.6); toast(cp.fail_text ?? '密集架动了一下，又合拢了。'); return; }
      audio.sfx('S10');
      const r6 = ctx.compactRows[5], r7 = ctx.compactRows[6];
      r6.spin = r7.spin = true; ctx.compactLed.material.emissive.set(0x40ff70);
      const s6 = r6.grp.position.x, s7 = r7.grp.position.x, s8 = []; for (let i = 7; i < 12; i++) s8.push(ctx.compactRows[i].grp.position.x);
      const t0 = performance.now();
      await new Promise((res) => { const step = () => { const t = Math.min(1, (performance.now() - t0) / 3500); const e = t * t * (3 - 2 * t); r7.grp.position.x = s7 + e * 0.0; for (let i = 7; i < 12; i++) ctx.compactRows[i].grp.position.x = s8[i - 7] + e * 0.32; r6.grp.position.x = s6 - e * 0.0; if (t < 1) requestAnimationFrame(step); else res(); }; step(); });
      r6.spin = r7.spin = false;
      ctx.seam.visible = true; ctx.seam.position.x = ctx.compactRows[6].grp.position.x + 1.16; ctx.seamGlow.intensity = 3;
      for (const l of cp.success_sequence ?? []) { toast(l, { ms: 3400, whisper: l.startsWith('（') }); await sleep(3200); }
      content.set(cp.completes ?? 'q5_b1'); updateObjective();
      objRead('doc_seventh_entry_plate', ctx.seam.children[2], '按 E 凑近缝隙', 2.6);
      const hint = content.get('hint_end1')?.text ?? '第一章 · 报到　完\n\n你又一次来报到了。';
      const [a, ...rest] = hint.split('\n').filter(Boolean);
      await sleep(2500); audio.sfx('S17', 0.6);
      await chapterCard(a, rest.join(' '), 6500);
    },
  });
  G.onZone.push((z) => { content.set('area:' + z); updateObjective(); });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function newspaperTexture() {
  const cv = document.createElement('canvas'); cv.width = 420; cv.height = 300; const c = cv.getContext('2d');
  c.fillStyle = '#e4dccb'; c.fillRect(0, 0, 420, 300); c.fillStyle = '#1a1a1a'; c.font = '900 40px \"NB Title\", \"NB Serif\", serif'; c.fillText('京城晚报', 20, 52);
  c.font = '900 22px \"NB Title\", \"NB Serif\", serif'; c.fillText('通州区现实稳定度连续三日低于 96%', 20, 100);
  c.fillStyle = '#555'; for (let y = 120; y < 290; y += 14) c.fillRect(20 + (y % 3) * 4, y, 180 + ((y * 7) % 170), 6);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
