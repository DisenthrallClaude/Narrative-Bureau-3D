// 中文 UI：HUD、目标栏、区域标题、提示、对话、文档阅读、暂停菜单、章节卡
import './style.css';
import { content } from '../engine/content.js';

const $ = (id) => document.getElementById(id);
export const ui = {
  state: 'loading', // loading | play | dialog | reader | pause | cutscene
  onClose: null,
};

export function loadProgress(p, tip) { $('loadbar').style.width = `${Math.round(p * 100)}%`; if (tip) $('loadtip').textContent = tip; }
export function loadDone(onStart) {
  $('loadtip').textContent = '点击「进入」开始（建议佩戴耳机）';
  const b = $('start'); b.classList.remove('hidden');
  b.onclick = () => { $('loading').style.opacity = 0; setTimeout(() => $('loading').classList.add('hidden'), 1200); $('hud').classList.remove('hidden'); onStart(); };
}

export function setPrompt(text, key = 'E') { $('prompt').innerHTML = text ? (key ? `<b>${key}</b>${text.replace(/^按\s*E\s*/, '')}` : text) : ''; $('cross').classList.toggle('on', !!text); }

let toastT = 0;
export function toast(text, { ms = 4200, whisper = false } = {}) {
  const t = $('toast'); t.textContent = text; t.classList.toggle('whisper', whisper); t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms);
}
let areaT = 0;
export function showArea(name, en) { $('arean').textContent = name; $('areae').textContent = en; const a = $('area'); a.classList.add('on'); clearTimeout(areaT); areaT = setTimeout(() => a.classList.remove('on'), 3800); }

export function updateObjective() {
  const { main, opt } = content.objectives();
  let m = main?.text ?? '';
  if (m.includes('0/3')) { const n = ['q4_read_1', 'q4_read_2', 'q4_read_3'].filter((f) => content.has(f)).length; m = m.replace('0/3', `${n}/3`); }
  $('objm').textContent = m || (opt[0]?.text ?? '自由探索');
  $('objo').textContent = main ? '' : opt.slice(1).map((o) => o.text).join('\n');
}

export function updateInventory() {
  $('inv').innerHTML = content.itemsList().map((it) => { const u = it.texture && content.texUrl(it.texture); return `<div class="it" style="${u ? `background-image:url('${u}')` : ''}" title="${it.desc ?? ''}">${u ? '' : '<div style="font-size:22px;text-align:center;line-height:54px;color:#d8b469">' + (it.name?.[0] ?? '?') + '</div>'}<span>${it.name}</span></div>`; }).join('');
}

// —— 对话 ——
let dlgResolve = null, dlgAdvance = null;
export function dialog(lines, { auto = false } = {}) {
  return new Promise((resolve) => {
    ui.state = 'dialog'; $('dlg').classList.remove('hidden');
    const L = lines.slice(); let i = 0; let choice = null;
    const showLine = () => {
      $('dlgch').innerHTML = '';
      while (i < L.length) {
        let line = L[i];
        const m = line.match(/^(.+?)（([A-Z])）：/);
        if (m && choice && m[2] !== choice) { i++; continue; }
        if (m && !choice) { i++; continue; }
        break;
      }
      if (i >= L.length) return finish();
      let line = L[i];
      if (line.startsWith('>')) {
        const opts = []; while (i < L.length && L[i].startsWith('>')) { opts.push(L[i].replace(/^>\s*/, '')); i++; }
        $('dlgwho').textContent = ''; $('dlgline').textContent = ''; $('dlgline').className = 'line';
        let sel = 0;
        const render = () => { $('dlgch').innerHTML = opts.map((o, k) => `<div class="${k === sel ? 'sel' : ''}" data-k="${k}">${o.replace(/^选项\s*/, '')}</div>`).join(''); };
        render();
        const pick = (k) => { const mm = opts[k].match(/选项\s*([A-Z])/); choice = mm ? mm[1] : String.fromCharCode(65 + k); dlgAdvance = adv; document.removeEventListener('keydown', kd); showLine(); };
        const kd = (e) => { if (e.code === 'KeyW' || e.code === 'ArrowUp') { sel = (sel + opts.length - 1) % opts.length; render(); } if (e.code === 'KeyS' || e.code === 'ArrowDown') { sel = (sel + 1) % opts.length; render(); } if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') { e.stopPropagation(); pick(sel); } if (/Digit[1-9]/.test(e.code)) pick(Math.min(opts.length - 1, +e.code.slice(5) - 1)); };
        dlgAdvance = null;
        setTimeout(() => document.addEventListener('keydown', kd), 50);
        $('dlgch').onclick = (e) => { const k = e.target.dataset?.k; if (k != null) pick(+k); };
        return;
      }
      const mm = line.match(/^([^：（]{1,8}(?:（[^）]*）)?)：(.*)$/);
      if (mm && !line.startsWith('（')) { $('dlgwho').textContent = mm[1].replace(/（[A-Z]）/, ''); $('dlgline').textContent = mm[2]; $('dlgline').className = 'line'; }
      else { $('dlgwho').textContent = ''; $('dlgline').textContent = line; $('dlgline').className = 'line narr'; }
      i++;
      if (auto) setTimeout(adv, 2600);
    };
    const finish = () => { $('dlg').classList.add('hidden'); ui.state = 'play'; dlgAdvance = null; resolve(choice); };
    const adv = () => showLine();
    dlgAdvance = adv; dlgResolve = resolve;
    showLine();
  });
}
export function dialogNext() { if (dlgAdvance) dlgAdvance(); }
$('dlg').addEventListener('click', () => dialogNext());

// —— 文档阅读 ——
let pages = [], pi = 0, readerDone = null;
function renderPage() {
  const p = pages[pi]; const el = $('paper');
  el.className = 'paper ' + (p.style ?? '');
  const txt = (p.text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/「本条不存在。」/g, '<span class="red">「本条不存在。」</span>');
  el.innerHTML = `${p.title ? `<h2>${p.title}</h2>` : ''}${p.img ? `<img class="full" src="${p.img}">` : ''}${p.text ? `<div class="txt">${txt}</div>` : ''}${p.stamp ? `<div class="stamp">${p.stamp}</div>` : ''}${pages.length > 1 ? `<div class="pg">${pi + 1} / ${pages.length}</div>` : ''}`;
  p.onShow?.();
}
export function openReader(pg, { onClose } = {}) {
  pages = pg; pi = 0; ui.state = 'reader'; $('reader').classList.remove('hidden'); renderPage();
  return new Promise((res) => { readerDone = () => { onClose?.(); res(); }; });
}
export function readerFlip(d) { const n = Math.max(0, Math.min(pages.length - 1, pi + d)); if (n !== pi) { pi = n; renderPage(); return true; } return false; }
export function readerNextOrClose() { if (!readerFlip(1)) closeReader(); }
export function closeReader() { $('reader').classList.add('hidden'); ui.state = 'play'; const d = readerDone; readerDone = null; d?.(); }
$('reader').addEventListener('wheel', (e) => readerFlip(e.deltaY > 0 ? 1 : -1));
$('reader').addEventListener('click', (e) => { if (e.target.id === 'reader') closeReader(); else readerNextOrClose(); });

/** manifest 文档 → 阅读页 */
export function docPages(id, extra = {}) {
  const d = content.doc(id);
  const style = { phone_message: 'phone', screen: 'screen', file_page: d.page === 3 ? 'dark' : '' }[d.type] ?? '';
  const img = d.texture ? content.texUrl(d.texture) : null;
  const out = [];
  if (img && d.type === 'personnel_file') { out.push({ title: d.title, img }); out.push({ title: d.title, text: d.text }); }
  else if (img && ['file_page', 'file_cover'].includes(d.type)) out.push({ img, title: '' });
  else out.push({ title: d.title, text: d.text, style, img: img && d.type === 'sign' ? img : null, ...extra });
  return out;
}

// —— 暂停菜单 ——
export function initPause({ quality, setQuality, tod, setTod, setSens, setFov, setVol, setMusic, setFps, credits }) {
  const ts = $('todseg'); if (ts) { ts.querySelectorAll('span').forEach((s) => s.classList.toggle('on', s.dataset.t === tod)); ts.onclick = (e) => { const t = e.target.dataset.t; if (t && t !== tod) setTod(t); }; }
  const qs = $('qseg');
  qs.innerHTML = Object.entries(quality).map(([k, v]) => `<span data-q="${k}">${v.label}</span>`).join('');
  qs.onclick = (e) => { const q = e.target.dataset.q; if (!q) return; setQuality(q); markQ(q); };
  const markQ = (q) => qs.querySelectorAll('span').forEach((s) => s.classList.toggle('on', s.dataset.q === q));
  ui.markQ = markQ;
  $('sens').oninput = (e) => setSens(+e.target.value);
  $('fov').oninput = (e) => setFov(+e.target.value);
  $('vol').oninput = (e) => setVol(+e.target.value);
  $('volm').oninput = (e) => setMusic(+e.target.value);
  $('fpsseg').onclick = (e) => { const v = e.target.dataset.v; if (v == null) return; $('fpsseg').querySelectorAll('span').forEach((s) => s.classList.toggle('on', s.dataset.v === v)); setFps(v === '1'); };
  $('showcred').onclick = () => { const c = $('credits'); c.textContent = credits; c.classList.toggle('hidden'); };
}
export function showPause(on) { $('pause').classList.toggle('hidden', !on); if (on) ui.state = 'pause'; else if (ui.state === 'pause') ui.state = 'play'; }
export function onResume(fn) { $('resume').onclick = fn; }

export function chapterCard(a, b, ms = 6000) {
  return new Promise((res) => { $('chapa').textContent = a; $('chapb').textContent = b ?? ''; $('chapter').classList.add('on'); setTimeout(() => { $('chapter').classList.remove('on'); setTimeout(res, 2000); }, ms); });
}
export function fade(on) { $('fade').classList.toggle('on', on); }
export function setFpsText(t) { $('fps').textContent = t; }
