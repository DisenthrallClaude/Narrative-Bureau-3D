// 展示片录制模式（?rec=1）：固定步长 1/30 s、任意帧独立跳转、机位走 src/rec/path.json 的 Catmull-Rom 样条。
// 不开 ?rec=1 时本模块只导出 REC = null，不劫持任何东西（零影响）。
// 用法（playwright / 渲染农场）：
//   await page.goto('index.html?rec=1&q=high&qo=shadow=2048');
//   await page.waitForFunction(() => window.__REC__?.booted);  await page.evaluate(() => window.__REC__.ready());
//   for (f of frames) { await page.evaluate((f) => window.__REC__.seek(f), f); await page.screenshot(...); }
// 兼容 cloud-render 约定：window.__ready（ready 完成后为 true）、window.renderAt(t) = seek(round(t*30))。
// API：__REC__.total（总帧数）· segments()（各段起止帧）· seek(f) → {f, seg, zone, ms} · ready({athena}) · poseAt(f)
import * as THREE from 'three';
import { time } from '../engine/fx.js';
import PATH from './path.json';

const ON = typeof location !== 'undefined' && /[?&]rec=1\b/.test(location.search);

// —— 劫持 rAF 与 performance.now（模块求值时即生效，早于 main.js 的 loop()）——
const rafQ = [];
let frozenNow = null; // 启动完成后 performance.now 永久定格在虚拟时钟上：每次 seek 前进 1/30 s（单调递增，AudioListener 等内部 Clock 不会倒走）
const VBASE = 1e9;
if (ON) {
  let id = 0;
  window.requestAnimationFrame = (cb) => { rafQ.push(cb); return ++id; };
  window.cancelAnimationFrame = () => {};
  const realNow = performance.now.bind(performance);
  performance.now = () => (frozenNow ?? realNow());
  const st = document.createElement('style'); // 录制：隐藏 HUD / 准星 / 对话 / 阅读器 / 暂停 / 章节卡；黑场遮罩
  st.textContent = '#hud,#dlg,#reader,#pause,#chapter{display:none!important}#recfade{position:fixed;inset:0;z-index:99;background:#000;opacity:0;pointer-events:none}html,body{cursor:none!important}';
  document.head.appendChild(st);
}

// —— 路径预计算 ——
const FPS = PATH.fps ?? 30;
function buildPath() {
  let f0 = 0; const segs = [];
  for (const s of PATH.segments) {
    const n = Math.round(s.dur * FPS); const seg = { ...s, f0, n, f1: f0 + n }; f0 += n;
    if (s.keys?.length) {
      const oy = s.oy ?? 0; const V = (a) => new THREE.Vector3(a[0], a[1] + oy, a[2]);
      const P = s.keys.map((k) => V(k.pos)), L = s.keys.map((k) => V(k.look));
      if (P.length === 1) { P.push(P[0].clone()); L.push(L[0].clone()); }
      seg.pc = new THREE.CatmullRomCurve3(P, false, 'centripetal'); seg.lc = new THREE.CatmullRomCurve3(L, false, 'centripetal');
      seg.fovs = s.keys.map((k) => k.fov ?? 72);
      // 时间映射：代价 = 位移 + turnK × 视线转角（转弯 / 摇镜时自动减速），再混一点首尾缓入缓出
      const M = 240 * (P.length - 1), K = s.turnK ?? PATH.turnK ?? 6; const cum = [0]; let pp = seg.pc.getPoint(0), pd = seg.lc.getPoint(0).sub(pp).normalize();
      for (let i = 1; i <= M; i++) { const u = i / M, p = seg.pc.getPoint(u), d = seg.lc.getPoint(u).sub(p).normalize(); cum.push(cum[i - 1] + p.distanceTo(pp) + K * Math.acos(THREE.MathUtils.clamp(d.dot(pd), -1, 1)) + 1e-4); pp = p; pd = d; }
      const tot = cum[M]; seg.cum = cum.map((c) => c / tot); seg.M = M;
    }
    segs.push(seg);
  }
  return { segs, total: f0 };
}
const smooth = (x) => x * x * (3 - 2 * x);
function uAt(seg, tau) { // tau∈[0,1] 段内时间 → 样条参数 u
  const e = seg.ease ?? PATH.ease ?? 0.35, c = tau + (smooth(tau) - tau) * e;
  const a = seg.cum; let lo = 0, hi = seg.M; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (a[m] < c) lo = m; else hi = m; }
  const w = a[hi] === a[lo] ? 0 : (c - a[lo]) / (a[hi] - a[lo]); return (lo + w) / seg.M;
}

function createRec() {
  const { segs, total } = buildPath();
  const R = { on: true, booted: false, total, dt: 1 / FPS, frame: -1, log: [] };
  let H = null, fadeEl = null, athena = null, skyAcc = 0, kTick = 0, nSeek = 0, readyP = null;
  const segAt = (f) => segs.find((s) => f >= s.f0 && f < s.f1) ?? segs[segs.length - 1];
  const menuPose = (f) => { const M = PATH.menu, t = f / FPS, k = 0.5 - 0.5 * Math.cos(t * Math.PI * 2 / M.period);
    const pos = new THREE.Vector3().lerpVectors(new THREE.Vector3(...M.A), new THREE.Vector3(...M.B), k); pos.y += Math.sin(t * 0.21) * 0.25;
    return { pos, look: new THREE.Vector3(...M.look), fov: M.fov }; };
  R.poseAt = (f) => {
    const s = segAt(f); const tau = THREE.MathUtils.clamp((f - s.f0) / Math.max(1, s.n - 1), 0, 1);
    if (s.type === 'menu') { const p = menuPose(f); const o0 = PATH.menu.offset, ft = (s.open ?? s.dur) * FPS; const k = f < ft ? 0 : smooth(Math.min(1, (f - ft) / (s.n - ft))); return { ...p, seg: s, offset: o0 * (1 - k), ui: 1 - k, uiT: (f - ft) / FPS }; }
    const u = uAt(s, tau), n = s.fovs.length - 1, x = u * n, i = Math.min(n - 1, Math.floor(x)), w = x - i;
    return { pos: s.pc.getPoint(u), look: s.lc.getPoint(u), fov: s.fovs[i] + (s.fovs[Math.min(n, i + 1)] - s.fovs[i]) * w, seg: s, offset: 0 };
  };
  R.segments = () => segs.map((s) => ({ id: s.id, f0: s.f0, f1: s.f1, zone: s.zone ?? 'auto', cut: s.cut ?? 'cut' }));
  // 黑场：本段 cut='fade' → 段首 fade 秒从黑淡入，且上一段末尾 fade 秒淡出到黑（合计 0.3 s）；out='fade' → 片尾淡出
  const fadeAt = (f) => { const F = (PATH.fade ?? 0.15) * FPS; const s = segAt(f), i = segs.indexOf(s), nx = segs[i + 1]; let a = 0;
    if (s.cut === 'fade' && f - s.f0 < F) a = Math.max(a, 1 - (f - s.f0 + 0.5) / F);
    if (nx?.cut === 'fade' && s.f1 - f <= F) a = Math.max(a, 1 - (s.f1 - f - 0.5) / F);
    if (s.out === 'fade' && s.f1 - f <= 2 * F) a = Math.max(a, 1 - (s.f1 - f - 0.5) / (2 * F));
    return THREE.MathUtils.clamp(a, 0, 1); };

  // 首页 UI：加载层 .live（主菜单 + 右侧实时机位），CSS 动画按帧号定格；open 之后整层按帧淡出
  function menuUI(p, f) {
    const L = document.getElementById('loading'); if (!L) return;
    if (!p || p.ui <= 0) { L.style.display = 'none'; return; }
    L.style.display = ''; L.classList.remove('hidden', 'go', 'open'); L.classList.add('live'); L.style.transition = 'none'; L.style.opacity = String(p.ui);
    for (const a of L.getAnimations({ subtree: true })) { try { if (a instanceof CSSTransition) a.finish(); else { a.pause(); a.currentTime = Math.min(f / FPS, 60) * 1000; } } catch { /* */ } }
  }
  // 古城：按需构建（进入 abyss_* 区由 setupMoyuanAthena 后台开工），等到 ready
  async function ensureAthena() {
    const st = () => window.__MOYUAN_STATE__?.()?.state;
    if (!window.__MOYUAN_STATE__) throw new Error('athena not enabled');
    if (st() === 'ready') return;
    if (!athena) athena = (async () => { const t0 = Date.now(); H.setZone('abyss_athena'); let s;
      while ((s = st()) !== 'ready') { if (s === 'failed') throw new Error('athena build failed'); if (Date.now() - t0 > 40 * 60e3) throw new Error('athena build timeout'); await new Promise((r) => setTimeout(r, 250)); }
      const ms = Date.now() - t0; R.athenaMs = ms; console.log('[REC] athena ready', (ms / 1000).toFixed(1) + 's', JSON.stringify(window.__MOYUAN__?.() ?? {}).slice(0, 300)); })();
    await athena;
  }
  // 古城时间（天空 / 云 / 水 / 植被风）按帧号定格：包一层 moyuanTick，让其内部累计时间 = f/30（同时每次都触发其 0.4 s 一次的剔除）
  function wrapMoyuan() {
    const G = H.G, orig = G.moyuanTick; if (!orig || orig.__rec) return;
    // 第一次调用量 = d + 1000k（必然 ≥0.4 → 触发剔除），第二次 = −1000k（净增 d）；k 递增保证上次残留的负量被抵掉
    const w = (dt) => { const root = H.scene.getObjectByName('moyuan_athena'); if (!root?.visible) return orig(dt);
      const d = R.frame / FPS - skyAcc; kTick++; orig(d + 1000 * kTick); orig(-1000 * kTick); skyAcc = R.frame / FPS; };
    w.__rec = true; G.moyuanTick = w;
  }

  // 录制专用阴影开关：?recls=0 关掉点光 / 聚光的实时投影（只留太阳）；?recsm=basic|vsm 换阴影贴图类型
  const QP = new URLSearchParams(location.search), LS = QP.get('recls'), SM = QP.get('recsm');
  function shadowOverrides() {
    if (LS === '0') H.scene.traverse((o) => { if ((o.isPointLight || o.isSpotLight) && o.castShadow) o.castShadow = false; });
  }
  R.init = (h) => { H = h; frozenNow = VBASE;
    if (SM) { H.renderer.shadowMap.type = SM === 'vsm' ? THREE.VSMShadowMap : SM === 'basic' ? THREE.BasicShadowMap : THREE.PCFShadowMap; H.renderer.shadowMap.needsUpdate = true; } fadeEl = document.createElement('div'); fadeEl.id = 'recfade'; document.body.appendChild(fadeEl);
    wrapMoyuan(); R.booted = true; console.log('[REC] booted total', total, 'frames', segs.length, 'segments'); };
  // 资源：LoadingManager 无挂起（GLB / 贴图异步回调全部结束）且连续 calm 秒保持，最多等 cap 秒
  const pending = () => window.__LOADSTATE__?.().pending ?? 0;
  async function settle(calm = 3, cap = 900) { const t0 = Date.now(); let ok = 0;
    while (ok < calm * 4 && Date.now() - t0 < cap * 1000) { ok = pending() <= 0 ? ok + 1 : 0; await new Promise((r) => setTimeout(r, 250)); }
    return { ms: Date.now() - t0, pending: pending() }; }
  R.ready = (opt = {}) => (readyP ??= (async () => {
    while (!R.booted) await new Promise((r) => setTimeout(r, 200));
    try { await document.fonts.ready; } catch { /* */ }
    const st = await settle(3); console.log('[REC] assets settled', (st.ms / 1000).toFixed(1) + 's', 'pending', st.pending);
    window.__ready = true; return { total, settleMs: st.ms };
  })()).then(async (v) => { if (opt.athena) await ensureAthena(); return v; });

  R.seek = async (f) => {
    f = Math.max(0, Math.min(total - 1, Math.round(f)));
    if (!R.booted) await R.ready();
    const t0 = Date.now(); const p0 = R.poseAt(f), s = p0.seg; nSeek++; frozenNow = VBASE + nSeek * 1000 / FPS;
    if (s.zone === 'abyss_athena') await ensureAthena();
    if (pending() > 0) { const st = await settle(1, 300); console.log('[REC] late assets', f, (st.ms / 1000).toFixed(1) + 's', 'pending', st.pending); }
    const tb = Date.now();
    const { camera, setZone, zoneAt } = H;
    const p = p0; R.frame = f;
    camera.position.copy(p.pos); camera.up.set(0, 1, 0); camera.lookAt(p.look);
    camera.fov = p.fov; camera.updateMatrixWorld();
    const zone = !s.zone || s.zone === 'auto' ? zoneAt(new THREE.Vector3(p.pos.x, p.pos.y - 1.6, p.pos.z)) : s.zone;
    setZone(zone); shadowOverrides();
    if (s.zone === 'abyss_athena' || /^abyss/.test(zone)) wrapMoyuan();
    if (p.offset) camera.setViewOffset(innerWidth, innerHeight, p.offset * innerWidth, 0, innerWidth, innerHeight); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    menuUI(s.type === 'menu' ? p : null, f);
    fadeEl.style.opacity = String(fadeAt(f));
    // 跑一帧：固定步长；time.value 定格为 f/30
    time.value = f / FPS - R.dt;
    const q = rafQ.splice(0); for (const cb of q) cb(frozenNow);
    const gl = H.renderer.getContext(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); // 等 GPU 画完（计时真实）
    const ms = Date.now() - t0; const info = { f, seg: s.id, zone, ms, buildMs: tb - t0, calls: H.renderer.info.render.calls, tris: H.renderer.info.render.triangles };
    if (R.log.length < 20000) R.log.push(info);
    return info;
  };
  window.renderAt = (t) => R.seek(Math.round(t * FPS));
  return R;
}

export const REC = ON ? createRec() : null;
if (REC) window.__REC__ = REC;
