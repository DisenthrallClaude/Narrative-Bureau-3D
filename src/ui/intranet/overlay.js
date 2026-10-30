// 局内网 2D 覆盖层（与 3D 无关，可单独挂在预览页 tools/intranet-preview.html）
import './intranet.css';
import { frame, page, TABS } from './pages.js';
import { MAILS } from './data.js';
import { STATIONS } from './stations.js';

let fontsDone = false;
export function loadMonoFont() { if (fontsDone) return; fontsDone = true; try { for (const [w, f] of [['400', 'mono-regular'], ['500', 'mono-medium']]) { const ff = new FontFace('NB Mono', `url(fonts/${f}.woff2)`, { weight: w }); ff.load().then((x) => document.fonts.add(x)).catch(() => {}); } } catch { /* */ } }

/** UI：ui.js 模块（用 ui.state / setPrompt）；G：可选（audio） */
export function createOverlay(UI, G = {}) {
  loadMonoFont();
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
  return { open, close, go: (tab, view) => go(tab, view), state, isOpen: () => isOpen };
}
