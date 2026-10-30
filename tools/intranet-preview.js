// 局内网预览：?st=<终端id>&tab=<页>&view=<详情>  或  ?screens=1（所有终端的屏幕纹理）
import { content } from '../src/engine/content.js';
import { createOverlay } from '../src/ui/intranet/overlay.js';
import { STATIONS } from '../src/ui/intranet/stations.js';
import { drawScreen } from '../src/ui/intranet/screen.js';
const P = new URLSearchParams(location.search);
await content.load();
await document.fonts.ready; await Promise.all(['900 20px "NB Title"', '400 20px "NB Serif"', '600 20px "NB Serif"', '20px "NB Mono"', '600 20px "NB Latin Title"', '20px "NB Latin"'].map((f) => document.fonts.load(f, '叙A1').catch(() => {})));
if (P.get('flags')) for (const f of P.get('flags').split(',')) content.set(f);
if (P.get('screens')) {
  const box = document.createElement('div'); box.id = 'screens'; document.body.appendChild(box);
  const em = new Image(); em.src = content.texUrl('tex_emblem_hd'); await em.decode().catch(() => {});
  for (const st of STATIONS) { const a = st.kind === 'console' ? 0.84 / 0.46 : st.kind === 'model' && /publicity|jiyao|vault/.test(st.id) ? 1.85 : 4 / 3; const cv = document.createElement('canvas'); cv.height = 600; cv.width = Math.round(600 * a); box.appendChild(cv); drawScreen(cv.getContext('2d'), cv.width, cv.height, st); }
  setTimeout(() => { for (const [i, st] of STATIONS.entries()) { const cv = box.children[i]; drawScreen(cv.getContext('2d'), cv.width, cv.height, st); } window.__PREVIEW_READY__ = true; }, 800);
} else {
  const UI = { ui: { state: 'play' }, setPrompt() {} };
  const ov = createOverlay(UI); window.__INTRANET__ = ov;
  ov.open(P.get('st') ?? 'legal', P.get('tab') ?? undefined);
  const v = P.get('view'); if (v) { const tab = P.get('tab'); if (tab === 'mail') { ov.state.mail = v; ov.go('mail'); } else ov.go(tab, tab === 'people' ? { person: v } : tab === 'home' ? { doc: v, no: P.get('no') ?? '' } : tab === 'dept' ? { san: 1 } : null); }
  if (P.get('q')) { ov.state.q = P.get('q'); ov.go('people'); }
  if (P.get('pset')) { ov.state.pset = P.get('pset'); ov.go('people'); }
  setTimeout(() => { window.__PREVIEW_READY__ = true; }, 1200);
}
