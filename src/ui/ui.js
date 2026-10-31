// 中文 UI：HUD、目标栏、区域标题、提示、对话、文档阅读、暂停菜单、章节卡
import './style.css';
import { content } from '../engine/content.js';

const $ = (id) => document.getElementById(id);
export const ui = {
  state: 'loading', // loading | play | dialog | reader | pause | cutscene
  onClose: null,
};

{ const tk = document.getElementById('tk'); if (tk) for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2, r0 = k % 4 ? 41 : 38; tk.insertAdjacentHTML('beforeend', `<line x1="${(Math.sin(a) * r0).toFixed(2)}" y1="${(-Math.cos(a) * r0).toFixed(2)}" x2="${(Math.sin(a) * 45).toFixed(2)}" y2="${(-Math.cos(a) * 45).toFixed(2)}"/>`); } } // 批次46：局徽刻度环
// U2：首页按钮一开始就可点；点「开始游戏」→ 齿轮加载层（真实进度），加载完且齿轮至少转满 2.4 s 后淡出进游戏
let loadP = 0, loaded = false, wantStart = false, t0 = 0, onStartFn = null;
export function loadProgress(p, tip) { loadP = p; const pc = Math.round(p * 100); $('loadbar').style.width = `${pc}%`; $('loadpct').textContent = `${pc}%`; const arc = $('gearArc'); if (arc) arc.style.strokeDasharray = `${pc} 100`; if (tip) $('loadtip').textContent = tip; }
function enterGame() {
  const wait = Math.max(0, 2400 - (performance.now() - t0));
  setTimeout(() => { loadProgress(1, '就绪'); setTimeout(() => { $('loading').classList.add('open'); setTimeout(() => $('loading').classList.add('hidden'), 1500); $('hud').classList.remove('hidden'); onStartFn?.(); }, 450); }, wait);
}
$('start').onclick = () => { if (wantStart) return; wantStart = true; t0 = performance.now(); $('loading').classList.add('go'); loadProgress(loadP); if (loaded) enterGame(); };
export function loadDone(onStart) { loaded = true; onStartFn = onStart; if (wantStart) enterGame(); }

export function setPrompt(text, key = 'E') { $('prompt').innerHTML = text ? (key ? `<b class="key">${key}</b><span class="pt">${text.replace(/^按\s*E\s*/, '')}</span>` : `<span class="pt">${text}</span>`) : ''; $('cross').classList.toggle('on', !!text); }

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
  const ob = $('obj'); if (ob.dataset.m !== m) { ob.dataset.m = m; ob.classList.add('flash'); clearTimeout(objT); objT = setTimeout(() => ob.classList.remove('flash'), 5000); } // U2：目标平时半隐，更新时亮起 5 s
}
let objT = 0;

export function updateInventory() {
  $('inv').innerHTML = content.itemsList().map((it) => { const u = it.texture && content.texUrl(it.texture); return `<div class="it" style="${u ? `background-image:url('${u}')` : ''}" title="${it.desc ?? ''}">${u ? '' : '<div style="font-size:22px;text-align:center;line-height:54px;color:#d8b469">' + (it.name?.[0] ?? '?') + '</div>'}<span>${it.name}</span></div>`; }).join('');
}

// —— 对话 ——
const replay = (el) => { el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); };
let dlgResolve = null, dlgAdvance = null;
// 批次12（用户要求不放人物模型）：场景里不再有人形，NPC 台词改为经由终端 / 广播 / 对讲 / 纸条传达——说话人后标注渠道
const CHANNEL = { 殷泽: '安检广播', 叶寻: '窗口对讲', 齐凌云: '局长室内线', 齐仇: '收容库终端', 周闻: '指挥台对讲', 周也: '装备库留言', 干事: '窗口对讲', 职员甲: '窗口对讲', 职员乙: '窗口对讲', 卫队员: '对讲机', 大妈: '留在台上的纸条', 老人: '来信', 宿管: '宿管窗口纸条' };
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
        if (window.__NB_AUTO__) { const want = window.__NB_AUTO__.choices?.shift?.() ?? 'A'; const k = Math.max(0, opts.findIndex((o) => o.includes('选项 ' + want) || o.includes('选项' + want))); window.__NB_AUTO__.log?.push('选择 ' + opts[k]); setTimeout(() => pick(k), 0); return; }
        setTimeout(() => document.addEventListener('keydown', kd), 50);
        $('dlgch').onclick = (e) => { const k = e.target.dataset?.k; if (k != null) pick(+k); };
        return;
      }
      const mm = line.match(/^([^：（]{1,8}(?:（[^）]*）)?)：(.*)$/);
      if (mm && !line.startsWith('（')) { const who = mm[1].replace(/（[A-Z]）/, ''); $('dlgwho').textContent = CHANNEL[who] ? `${who} · ${CHANNEL[who]}` : who; $('dlgline').textContent = mm[2]; $('dlgline').className = 'line'; }
      else { $('dlgwho').textContent = ''; $('dlgline').textContent = line; $('dlgline').className = 'line narr'; }
      replay($('dlg'));
      i++;
      if (window.__NB_AUTO__) { setTimeout(adv, 0); return; }
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
  if (p.style === 'phone') { // U2：手机消息 = 胡桃木壳 + 黄铜边框 + 象牙纸屏，短信为页边批注式纸条
    const m = /^【(.+?)】(.*)$/.exec(p.title ?? ''); const from = m ? m[1] : '叙事管理局'; const subj = m ? m[2] : (p.title ?? '');
    el.innerHTML = `<div class="sb"><span>09:00</span><span class="op">NB · 局内网</span><span class="bt"><i></i><i></i><i></i><i></i></span></div><div class="from"><b class="av">${from.replace(/^叙事管理局/, '').slice(0, 2) || '局'}</b><div><strong>${from}</strong><em>短信 · 今天 08:12 · NVNTIVS</em></div></div><div class="bub">${subj ? `<h2>${subj}</h2>` : ''}<div class="txt">${txt}</div></div>${pages.length > 1 ? `<div class="pg">${pi + 1} / ${pages.length}</div>` : ''}<div class="home"></div>`;
    replay(el); p.onShow?.(); return;
  }
  el.innerHTML = `${p.title ? `<h2>${p.title}</h2>` : ''}${p.img ? `<img class="full" src="${p.img}">` : ''}${p.text ? `<div class="txt">${txt}</div>` : ''}${p.stamp ? `<div class="stamp">${p.stamp}</div>` : ''}${!p.style && !p.img ? '<div class="seal">叙事管理局<br>档案专用</div>' : ''}${pages.length > 1 ? `<div class="pg">${pi + 1} / ${pages.length}</div>` : ''}`;
  replay(el);
  p.onShow?.();
}
export function openReader(pg, { onClose } = {}) {
  pages = pg; pi = 0; ui.state = 'reader'; $('reader').classList.remove('hidden'); renderPage();
  if (window.__NB_AUTO__) { for (let k = 1; k < pages.length; k++) readerFlip(1); window.__NB_AUTO__.log?.push('阅读 ' + pg.length + ' 页：' + (pg[0]?.title ?? '')); return new Promise((res) => { readerDone = () => { onClose?.(); res(); }; setTimeout(closeReader, 0); }); }
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

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const CN = '一二三四五六七八九十';
/** U1：章节卡 = 扉页。「第一章 · 报到」→ CAPITVLVM I + 彩饰首字「报」+「到」 */
export function chapterLayout(a, b) {
  const parts = String(a).split(/\s*[·・]\s*/); let head = '', ttl = String(a);
  if (parts.length > 1) { head = parts[0]; ttl = parts.slice(1).join(' · '); }
  const m = head.match(/第([一二三四五六七八九十]+)章/); let no = head ? head : 'LIBER PRIMVS';
  if (m) { const n = m[1].length === 1 ? CN.indexOf(m[1]) + 1 : (m[1].startsWith('十') ? 10 + CN.indexOf(m[1][1]) + 1 : 0); no = `CAPITVLVM ${ROMAN[n - 1] ?? ''} · ${head}`; }
  if (/终/.test(String(a) + (b ?? ''))) no = 'EXPLICIT · 结卷';
  const chars = [...ttl]; $('chapi').textContent = chars[0] ?? ''; $('chapa').textContent = chars.slice(1).join('');
  $('chapb').textContent = b ?? ''; $('chapno').textContent = no;
}
export function chapterCard(a, b, ms = 6000) {
  if (window.__NB_AUTO__) { window.__NB_AUTO__.log?.push('章节卡 ' + a + ' / ' + (b ?? '')); ms = 50; }
  return new Promise((res) => { chapterLayout(a, b); const c = $('chapter'); c.classList.remove('out'); c.classList.add('on'); setTimeout(() => { c.classList.add('out'); setTimeout(() => { c.classList.remove('on', 'out'); res(); }, 1400); }, ms); });
}
window.__NB_chapterLayout = chapterLayout;
export function fade(on) { $('fade').classList.toggle('on', on); }
export function setFpsText(t) { $('fps').textContent = t; }
