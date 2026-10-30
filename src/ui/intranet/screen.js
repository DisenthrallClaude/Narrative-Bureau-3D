// 局内网「屏幕截图」：把各终端当前页画到 Canvas（静态纹理，近看像真的在显示局内网）。与 intranet.css 同一套配色和字体。
import * as THREE from 'three';
import { content } from '../../engine/content.js';
import { NET, NOTICES, DEPT, LEGAL_CASES, LEGAL_REFS, FACTIONS, CMD, LOANS, SANITY, DIR, B2, B5 } from './data.js';

const C = { bg: '#06100e', ivory: '#e9e0c8', dim: '#8f9c91', gold: '#d8b469', gold2: '#f0d898', ph: '#8fdcb0', red: '#d0473b', line: 'rgba(216,180,105,0.35)' };
const F = { title: '"NB Title", "NB Serif", serif', serif: '"NB Latin", "NB Serif", serif', zh: '"NB Serif", serif', mono: '"NB Mono", "NB Sans", monospace', latin: '"NB Latin Title", serif' };
let emblem = null; const waiters = [];
function loadEmblem() { if (emblem) return; const u = content.texUrl('tex_emblem_hd'); if (!u) return; emblem = new Image(); emblem.onload = () => waiters.splice(0).forEach((f) => f()); emblem.src = u; }

// 每个页面在屏幕上显示的摘要（标题 + 表格行）
function summary(st) {
  const D = DEPT[st.page];
  switch (st.page) {
    case 'legal': return { t: '契约类能力合同解除登记', rows: [...LEGAL_CASES.map((r) => [r[0], r[1].replace('（姓名已遮挡）', ''), r[4]]), ...LEGAL_REFS.map((r) => ['法规速查', r[0], ''])], note: '叙管办〔2026〕117 号　·　法律顾问 方妍' };
    case 'liaison': return { t: '势力评估摘要', rows: FACTIONS.slice(0, 8).map((f, i) => [String(i + 1).padStart(2, '0'), f[0], f[2]]), note: '灰塔来电 10-28 21:40　答复：是我们的人。' };
    case 'publicity': return { t: '通稿审核队列', rows: [['XC-1028-03', '通州区「重复路段」通稿', '第三稿'], ['XC-1027-01', '2027 加试报名启动', '已发布'], ['4.1', '对「祂」一律称「不可描述的自然现象」', '口径']], note: '短视频后台：热门评论 5 条（已折叠 3 条）' };
    case 'command': return { t: '全国现实稳定度 ' + CMD.national, rows: CMD.hourly.slice(2).map((h) => [h[0], h[1], h[2] ? '自动消除' : '正常']), note: '冀 橙色　粤 黄色　京 通州 黄色', big: true };
    case 'archive': return { t: '电子借阅记录', rows: LOANS.map((r) => [r[0], r[1], r[2] + '（' + r[3] + '）']), note: '调阅本人档案须由管理员陪同' };
    case 'medical': return { t: '理智值记录（脱敏）', rows: SANITY.map((r) => [r[0], r[1].replace('外勤缉拿处', '外勤'), r[2]]), note: '本表不适用于文本过短者。' };
    case 'director': return st.sub === 'classified' ? { t: '机要文件目录', rows: ['墨渊驯化协议', '镇纸保管与转动权限', '叙事高考加试副本来源保密规定', '█████████████'].map((x, i) => [['第一条', '第二条', '第三条', '第七条'][i], x, '']), note: '密电终端 · 禁止打印' } : { t: '日程', rows: DIR.schedule.map((r) => [r[0], r[1], r[2]]), note: '局长今日不见客' };
    case 'interrogation': return { t: '羁押台账', rows: B2.map((r) => [r[0], r[2], r[3]]), note: '监看期间请勿与被审讯人对视超过十秒' };
    case 'vault': return { t: '深库收容台账', rows: B5.map((r) => [r[0], r[1], r[2]]), note: '钟摆固定于三时零七分，禁止敲击' };
    default: return { t: '局内公告', rows: NOTICES.slice(0, 5).map((n) => [n.date, n.title, '']), note: D?.title ?? '' };
  }
}

export function drawScreen(c, W, H, st) {
  loadEmblem();
  const s = H / 600; // 以 600 高为基准缩放
  const g = c.createRadialGradient(W * 0.5, H * 0.42, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.75); g.addColorStop(0, '#0d1f1a'); g.addColorStop(0.7, C.bg); g.addColorStop(1, '#020605');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const pad = 26 * s;
  // 顶栏
  if (emblem?.complete && emblem.naturalWidth) { c.save(); c.globalCompositeOperation = 'screen'; c.drawImage(emblem, pad, 14 * s, 62 * s, 62 * s); c.restore(); }
  c.fillStyle = C.gold2; c.font = `900 ${30 * s}px ${F.title}`; c.textBaseline = 'alphabetic'; spaced(c, '叙事管理局　局内网', pad + 78 * s, 50 * s, 0.32);
  c.fillStyle = '#a3aa9c'; c.font = `600 ${10.5 * s}px ${F.latin}`; spaced(c, 'BUREAU OF NARRATIVE ADMINISTRATION · INTRANET', pad + 78 * s, 70 * s, 0.32);
  c.textAlign = 'right'; c.fillStyle = C.dim; c.font = `${13 * s}px ${F.mono}`; c.fillText('终端 ' + st.term, W - pad, 40 * s); c.fillText(NET.date.replace('　', ' '), W - pad, 60 * s); c.textAlign = 'left';
  line(c, 0, 88 * s, W, C.line, 1.5 * s);
  // 导航
  const D = DEPT[st.page]; const tabs = ['门户首页', '人员档案', '内部邮件', '异常登记簿', D.short ?? D.title]; let x = pad;
  c.font = `600 ${14 * s}px ${F.zh}`;
  tabs.forEach((t, i) => { const w = c.measureText(t).width + 54 * s; if (i === 4) { c.fillStyle = 'rgba(216,180,105,0.12)'; c.fillRect(x - 8 * s, 90 * s, w, 32 * s); line(c, x - 8 * s, 120 * s, x - 8 * s + w, C.gold, 2 * s); }
    c.strokeStyle = 'rgba(216,180,105,0.6)'; c.lineWidth = 1; c.strokeRect(x, 99 * s, 22 * s, 15 * s); c.fillStyle = C.gold; c.font = `${10 * s}px ${F.mono}`; c.fillText('F' + (i + 1), x + 4 * s, 111 * s);
    c.fillStyle = i === 4 ? C.gold2 : '#b4bbae'; c.font = `600 ${14 * s}px ${F.zh}`; c.fillText(t, x + 30 * s, 112 * s); x += w + 6 * s; });
  line(c, 0, 122 * s, W, 'rgba(216,180,105,0.18)', 1);
  // 本处标题
  let y = 162 * s;
  c.fillStyle = C.gold2; c.font = `900 ${22 * s}px ${F.title}`; const tx = spaced(c, D.title, pad, y, 0.2);
  c.fillStyle = '#7f8b80'; c.font = `600 ${10 * s}px ${F.latin}`; spaced(c, D.en, tx + 18 * s, y, 0.35);
  y += 12 * s; const gr = c.createLinearGradient(pad, 0, W * 0.8, 0); gr.addColorStop(0, C.gold); gr.addColorStop(1, 'rgba(216,180,105,0)'); c.fillStyle = gr; c.fillRect(pad, y, W * 0.75, 1.5 * s);
  const S = summary(st); y += 40 * s;
  c.fillStyle = S.big ? C.ph : C.ivory; c.font = S.big ? `${30 * s}px ${F.mono}` : `600 ${18 * s}px ${F.zh}`; c.fillText(S.t, pad, y); y += 16 * s;
  const cols = [pad, pad + W * (W / H > 1.5 ? 0.2 : 0.27), pad + W * (W / H > 1.5 ? 0.62 : 0.66)];
  for (const r of S.rows.slice(0, Math.floor((H - y - 90 * s) / (36 * s)))) {
    y += 36 * s; line(c, pad, y + 12 * s, W - pad, 'rgba(216,180,105,0.13)', 1);
    c.fillStyle = '#cfe0cf'; c.font = `${15 * s}px ${F.mono}`; clip(c, r[0], cols[0], y, cols[1] - cols[0] - 12 * s);
    c.fillStyle = C.ivory; c.font = `${16 * s}px ${F.zh}`; clip(c, r[1], cols[1], y, cols[2] - cols[1] - 14 * s);
    c.fillStyle = /自动消除|待解除|第三稿/.test(r[2]) ? '#e9c58f' : C.ph; c.font = `${15 * s}px ${F.zh}`; clip(c, r[2], cols[2], y, W - pad - cols[2]);
  }
  c.fillStyle = C.dim; c.font = `${13.5 * s}px ${F.zh}`; c.fillText(S.note, pad, H - 52 * s);
  // 状态栏
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, H - 34 * s, W, 34 * s); line(c, 0, H - 34 * s, W, 'rgba(216,180,105,0.2)', 1);
  c.fillStyle = '#7f8c83'; c.font = `${12 * s}px ${F.mono}`; c.fillText('NB-NET 连接正常　京城总部　现实稳定度 ' + NET.stab + '　叙事污染指数 37', pad, H - 12 * s);
  c.fillStyle = C.ph; c.fillRect(W - pad - 10 * s, H - 24 * s, 10 * s, 14 * s);
  // 显像管：扫描线 + 暗角 + 绿色辉光
  c.fillStyle = 'rgba(0,0,0,0.22)'; for (let yy = 0; yy < H; yy += 3) c.fillRect(0, yy, W, 1);
  const v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
}
function spaced(c, t, x, y, em) { const fs = parseFloat(c.font.match(/(\d+(\.\d+)?)px/)[1]); for (const ch of t) { c.fillText(ch, x, y); x += c.measureText(ch).width + fs * em; } return x; }
function line(c, x0, y, x1, col, w) { c.fillStyle = col; c.fillRect(x0, y, x1 - x0, w); }
function clip(c, t, x, y, maxW) { t = String(t ?? ''); if (c.measureText(t).width <= maxW) return c.fillText(t, x, y); while (t.length > 1 && c.measureText(t + '…').width > maxW) t = t.slice(0, -1); c.fillText(t + '…', x, y); }

const cache = new Map();
/** 某终端在给定宽高比下的屏幕纹理（同一终端同一比例共用） */
export function screenTexture(st, aspect) {
  const key = st.id + ':' + aspect.toFixed(2); if (cache.has(key)) return cache.get(key);
  loadEmblem();
  const H = 600, W = Math.round(H * aspect); const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  const draw = () => { drawScreen(cv.getContext('2d'), W, H, st); t.needsUpdate = true; };
  draw(); waiters.push(draw); document.fonts?.ready?.then(draw);
  cache.set(key, t); return t;
}
