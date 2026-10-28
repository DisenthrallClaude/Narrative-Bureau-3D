// 剧情内容接口：读取 content/manifest.json（art-content 维护），缺失时用占位
// 约定：documents / interactables / hints / textures / items / quest_flow；见 docs/CONTENT-API.md
import * as THREE from 'three';
import { fetchJSON, loadTex } from './assets.js';

const PLACEHOLDER = { documents: [], interactables: [], hints: [], textures: [], items: [], quest_flow: [] };

export class Content {
  constructor() { this.m = PLACEHOLDER; this.byId = new Map(); this.flags = new Set(); this.items = new Set(); this.listeners = []; }
  async load() {
    const m = await fetchJSON('content/manifest.json');
    if (m) this.m = { ...PLACEHOLDER, ...m };
    for (const k of ['documents', 'interactables', 'hints', 'textures', 'items']) for (const e of this.m[k] ?? []) this.byId.set(e.id, e);
    return this;
  }
  get(id) { return this.byId.get(id); }
  doc(id) { return this.byId.get(id) ?? { id, title: '（文本待接入）', text: `【占位】${id}\n内容由 art-content 编写，接入 content/manifest.json 后自动显示。` }; }
  inter(id) { return this.byId.get(id) ?? { id, prompt: '按 E 查看', result_text: `【占位】${id}` }; }
  /** 贴图 URL（仅 status=ready） */
  texUrl(id) { const t = this.byId.get(id); if (!t || t.status !== 'ready' || !t.path) return null; return `content/${t.path}`; }
  tex(id, opts = {}) { const u = this.texUrl(id); if (!u) return null; const t = loadTex(u, { srgb: true }); if (opts.flipY === false) t.flipY = false; return t; }
  // —— 任务状态 ——
  has(flag) { return this.flags.has(flag) || this.items.has(flag); }
  set(flag) { if (this.flags.has(flag)) return; this.flags.add(flag); this.emit(flag); }
  give(item) { if (!item || this.items.has(item)) return; this.items.add(item); this.emit(item); }
  emit(f) { for (const l of this.listeners) l(f); }
  on(fn) { this.listeners.push(fn); }
  evalCond(cond) {
    if (!cond) return true;
    return cond.split('&').every((c) => {
      c = c.trim();
      if (c.startsWith('enter_area:')) return this.flags.has('area:' + c.slice(11));
      return this.has(c);
    });
  }
  requiresMet(e) { return !e?.requires || this.evalCond(e.requires); }
  /** 当前主线目标 */
  objectives() {
    const hs = (this.m.hints ?? []).filter((h) => h.type === 'objective' || h.type === 'objective_optional').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const main = hs.find((h) => h.type === 'objective' && !this.evalCond(h.done_when));
    const opt = hs.filter((h) => h.type === 'objective_optional' && !this.evalCond(h.done_when) && (!main || (main.order ?? 0) > (h.order ?? 0) - 1));
    return { main, opt: main ? [] : opt };
  }
  hint(id) { return this.byId.get(id)?.text; }
  itemsList() { return [...this.items].map((i) => this.byId.get(i) ?? { id: i, name: i }); }
}

export const content = new Content();
export function texOrNull(id) { return content.tex(id); }
export { THREE };
