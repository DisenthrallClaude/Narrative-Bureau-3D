// 通用绑定器：把场景里登记的锚点（ctx.anchors[id]）与插槽（ctx.slots[area]）自动接成 manifest 热点。
// 所有区域复用。已被 story.js 手工接线的 id 会跳过（inter.spots 中已有同 id）。
// 锚点写法：ctx.anchors[id] = Mesh/Object3D | { obj } | { box:[cx,cy,cz,w,h,d] } | { pos:[x,y,z], r }
// 插槽写法：ctx.slots[area] = [{ pos:[x,y,z], yaw, w, h, kind? }] —— 该区域中没有锚点的文档依次落到插槽上（自动放一张纸/铜牌）
import * as THREE from 'three';
import { content } from './content.js';
import { toast, dialog, docPages, updateObjective, updateInventory, chapterCard } from '../ui/ui.js';

const PROMPT_BY_TYPE = {
  screen: '按 E 查看屏幕', sign: '按 E 阅读', plaque: '按 E 阅读铭牌', notice: '按 E 阅读公告', notice_board: '按 E 查看展示墙', poster: '按 E 查看海报',
  form: '按 E 拿起表格', ledger: '按 E 翻看记录本', printout: '按 E 查看打印条', note: '按 E 看便条', exam_paper: '按 E 查看试卷', letter: '按 E 阅读信件',
  book: '按 E 翻开', manual: '按 E 翻阅手册', report: '按 E 阅读报告', map: '按 E 查看地图', chart: '按 E 查看图表', whiteboard: '按 E 查看白板',
  audio_log: '按 E 播放录音', card: '按 E 查看卡片', receipt: '按 E 查看收据', evidence_label: '按 E 查看标签', monument: '按 E 阅读碑文', graffiti: '按 E 细看涂鸦',
  personnel_file: '按 E 查看档案', faction_file: '按 E 查看档案', medical_record: '按 E 查看病历', transcript: '按 E 阅读笔录', draft: '按 E 查看草稿', notebook: '按 E 翻开笔记本',
  newspaper: '按 E 查看报纸', brochure: '按 E 拿一份折页', manuscript: '按 E 查看手稿', index: '按 E 查看索引', label: '按 E 查看标签',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function bindAll(G) {
  const { inter, ctx, audio, scene } = G;
  const bound = new Set(inter.spots.map((s) => s.id).filter(Boolean));
  const anchors = ctx.anchors ?? {};
  const m = content.m;
  const byArea = {};
  for (const d of m.documents ?? []) (byArea[d.area] = byArea[d.area] ?? []).push(d);

  const toObj = (a) => {
    if (!a) return null;
    if (a.isObject3D) return { obj: a };
    if (a.obj) return { obj: a.obj, range: a.range };
    if (a.box) return { box: a.box, range: a.range };
    if (a.pos) { const r = a.r ?? 0.6; return { box: [...a.pos, r * 2, r * 2, r * 2], range: a.range }; }
    return null;
  };
  const range = (o, def) => o.range ?? (o.obj ? Math.max(def, objSize(o.obj) * 0.9) : def);

  const readDoc = async (id) => {
    const d = content.doc(id);
    if (d.requires && !content.evalCond(d.requires)) { toast('现在还看不清上面写了什么。'); return; }
    audio.sfx('S08', 0.7);
    const pages = docPages(id);
    if (d.completes_on_read) pages[pages.length - 1].onShow = () => { content.set(d.completes_on_read); updateObjective(); };
    await G.read(pages);
    content.set('read:' + id); updateObjective();
  };

  // —— 文档 ——
  let nDoc = 0, nInt = 0, nSlot = 0;
  for (const d of m.documents ?? []) {
    if (bound.has(d.id) || !anchors[d.id]) continue;
    const o = toObj(anchors[d.id]); if (!o) continue;
    inter.add({ id: d.id, ...o, range: range(o, 3.0), prompt: () => d.prompt ?? PROMPT_BY_TYPE[d.type] ?? '按 E 查看', use: () => readDoc(d.id) });
    bound.add(d.id); nDoc++;
  }
  // —— 插槽：本区剩余文档 ——
  for (const [area, slots] of Object.entries(ctx.slots ?? {})) {
    const left = (byArea[area] ?? []).filter((d) => !bound.has(d.id) && !anchors[d.id]);
    slots.forEach((s, i) => {
      const d = left[i]; if (!d) return;
      const mesh = slotProp(d, s); (s.parent ?? ctx.zones?.[s.zone] ?? scene).add(mesh);
      inter.add({ id: d.id, obj: mesh, range: 3.0, prompt: () => PROMPT_BY_TYPE[d.type] ?? '按 E 查看', use: () => readDoc(d.id) });
      bound.add(d.id); nSlot++;
    });
  }
  // —— 交互 ——
  for (const it of m.interactables ?? []) {
    if (bound.has(it.id) || !anchors[it.id]) continue;
    const o = toObj(anchors[it.id]); if (!o) continue;
    const spot = inter.add({
      id: it.id, ...o, range: range(o, 3.0),
      enabled: () => !spot.done,
      prompt: () => (content.requiresMet(it) ? it.prompt : it.locked_prompt ?? it.prompt) ?? '按 E 查看',
      use: () => runInteractable(G, it, spot),
    });
    // 自定义钩子：ctx.hooks[id](it, spot) 可在默认行为后追加效果
    bound.add(it.id); nInt++;
  }
  if (window.__SHOT__) console.log('[NB] binder', nDoc, 'docs', nSlot, 'slots', nInt, 'interactables');
  G.bound = bound;
  return bound;
}

/** 按 manifest 类型执行一个交互 */
export async function runInteractable(G, it, spot) {
  const { audio, ctx } = G;
  if (!content.requiresMet(it)) { toast(it.fail_text ?? it.locked_text ?? reqText(it.requires), { ms: 4200 }); return; }
  const sfx = /^S\d\d$/.test(it.sfx ?? '') ? it.sfx : null;
  if (sfx) audio.sfx(sfx, 0.7);
  let choice = null;
  if (it.lines?.length) { G.freeze(true); choice = await dialog(it.lines); G.freeze(false); }
  if (it.sequence?.length) {
    G.freeze(true);
    for (const l of it.sequence) { toast(l, { ms: 3200, whisper: l.startsWith('（') }); await sleep(2900); }
    G.freeze(false);
  }
  if (it.solution && it.success_sequence) for (const l of it.success_sequence) { toast(l, { ms: 3200, whisper: l.startsWith('（') }); await sleep(2900); }
  if (it.result_text) toast(it.result_text, { ms: 6500, whisper: it.type === 'look' || it.type === 'trigger_easter_egg' });
  if (it.fx && /glitch|annotation|fold/.test(it.fx)) G.glitch?.(1);
  if (it.doc) await G.read(docPages(it.doc));
  if (it.gives) { content.give(it.gives); audio.sfx('S16'); toast('获得：' + (content.get(it.gives)?.name ?? it.gives)); updateInventory(); }
  if (it.completes) content.set(it.completes);
  if (it.quest_step) content.set(it.quest_step);
  if (it.unlocks) content.set('unlock:' + it.unlocks);
  content.set('used:' + it.id);
  if (it.easter_egg && it.type === 'trigger_easter_egg') audio.sfx('S17', 0.5);
  ctx.hooks?.[it.id]?.(it, spot, choice);
  if (it.then) { const nx = content.get(it.then); if (nx && nx.lines) await runInteractable(G, nx, null); }
  if (it.repeat !== true && it.repeat !== 'True' && spot && (it.type === 'trigger_easter_egg' || it.gives || it.completes)) spot.done = true;
  updateObjective();
}

function reqText(r) {
  if (!r) return '';
  if (r.includes('item_badge')) return '需要临时入职证。先去正门服务台。';
  if (r.includes('item_file')) return '需要你的入职档案。';
  return '时机未到。';
}
function objSize(o) { const b = new THREE.Box3().setFromObject(o); const s = b.getSize(new THREE.Vector3()); return Number.isFinite(s.x) ? Math.max(s.x, s.y, s.z) : 1; }

// 插槽默认陈设：纸页（桌面/台面）或墙面铜牌
const _paper = new THREE.MeshStandardMaterial({ color: 0xf1ead8, roughness: 0.85 });
const _plaque = new THREE.MeshStandardMaterial({ color: 0x8a6a30, metalness: 1, roughness: 0.35 });
function slotProp(d, s) {
  const wall = s.kind === 'wall' || ['sign', 'plaque', 'notice', 'poster', 'notice_board', 'monument', 'graffiti', 'chart', 'map', 'whiteboard'].includes(d.type) && s.kind !== 'desk';
  let mesh;
  const tex = d.texture ? content.tex(d.texture) : null;
  if (wall) {
    mesh = new THREE.Mesh(new THREE.PlaneGeometry(s.w ?? 0.9, s.h ?? 1.2), tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }) : _plaque);
  } else {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.004, 0.3), tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }) : _paper);
  }
  mesh.position.set(...s.pos); mesh.rotation.y = s.yaw ?? 0; mesh.castShadow = false; mesh.receiveShadow = true;
  return mesh;
}
