// 剧情内容接口：读取 content/manifest.json（art-content 维护），缺失时用占位
// 约定：documents / interactables / hints / textures / items / quest_flow；见 docs/CONTENT-API.md
import * as THREE from 'three';
import { fetchJSON, loadTex } from './assets.js';

const PLACEHOLDER = { documents: [], interactables: [], hints: [], textures: [], items: [], quest_flow: [] };

export class Content {
  constructor() { this.m = PLACEHOLDER; this.byId = new Map(); this.flags = new Set(); this.items = new Set(); this.listeners = []; }
  async load() {
    const m = await fetchJSON('content/manifest.json');
    this.files = new Set((await fetchJSON('content/files.json')) ?? []);
    if (m) this.m = { ...PLACEHOLDER, ...m };
    for (const k of ['documents', 'interactables', 'hints', 'textures', 'items']) for (const e of this.m[k] ?? []) this.byId.set(e.id, e);
    return this;
  }
  get(id) { return this.byId.get(id); }
  doc(id) { return this.byId.get(id) ?? { id, title: '（文本待接入）', text: `【占位】${id}\n内容由 art-content 编写，接入 content/manifest.json 后自动显示。` }; }
  inter(id) { return this.byId.get(id) ?? { id, prompt: '按 E 查看', result_text: `【占位】${id}` }; }
  /** 贴图 URL（仅 status=ready） */
  texUrl(id) { const t = this.byId.get(id); if (!t || !t.path) return null; if (t.status !== 'ready' && !this.files?.has(t.path)) return null; return `content/${t.path}`; }
  tex(id, opts = {}) { const u = this.texUrl(id); if (!u) return null; const t = loadTex(u, { srgb: true }); if (opts.flipY === false) t.flipY = false; return t; }
  /** 生图贴图上的错字修补（如繁体「敘」→简体「叙」）：载入后画到画布，按比例坐标盖底色并重写文字 */
  texPatched(id, patches) {
    const u = this.texUrl(id); if (!u) return null;
    const cv = document.createElement('canvas'); cv.width = cv.height = 4; const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const img = new Image(); img.onload = async () => {
      try { await document.fonts.load('700 40px \"NB Title\", \"NB Serif\"', '叙'); } catch { /* */ }
      cv.width = img.naturalWidth; cv.height = img.naturalHeight; const c = cv.getContext('2d'); c.drawImage(img, 0, 0); const W = cv.width, H = cv.height;
      for (const p of patches) { const [x, y, w, h] = [p.rect[0] * W, p.rect[1] * H, p.rect[2] * W, p.rect[3] * H]; c.fillStyle = p.fill; c.fillRect(x, y, w, h); c.fillStyle = p.color; c.font = `700 ${Math.round(h * (p.size ?? 0.8))}px \"NB Title\", \"NB Serif\", serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.text, x + w / 2, y + h * 0.54); }
      t.needsUpdate = true;
    }; img.src = u; return t;
  }
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
