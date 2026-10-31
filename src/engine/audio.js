// 音频系统：按编号加载 content/audio/<ID>.(mp3|ogg|wav|m4a)，缺失时静默
// BGM(M01–M06) 与环境音(A01–A06) 按区域交叉淡入淡出；SFX(S01–S22)；脚步按地面材质；PositionalAudio 点声源
import * as THREE from 'three';

const EXTS = ['mp3', 'ogg', 'wav', 'm4a'];
export const ZONE_AUDIO = {
  plaza: { bgm: 'M02', amb: 'A01' },
  gate: { bgm: 'M03', amb: 'A02' },
  security_hall: { bgm: 'M03', amb: 'A02' },
  archive: { bgm: 'M04', amb: 'A04' },
  archive_b1: { bgm: 'M04', amb: 'A04' },
  seventh_entry: { bgm: 'M06', amb: 'A06' },
  command_center: { bgm: 'M03', amb: 'A03' },
  citizen_service: { bgm: 'M03', amb: 'A02' },
  exam_center: { bgm: 'M03', amb: 'A03' },
  zone_control: { bgm: 'M05', amb: 'A03' },
  east_stair: { bgm: 'M03', amb: 'A02' },
  vault: { bgm: 'M05', amb: 'A05' },
  vault_b3: { bgm: 'M05', amb: 'A05' }, vault_b4: { bgm: 'M05', amb: 'A05' }, vault_b5: { bgm: 'M05', amb: 'A05' },
  spine_b3: { bgm: 'M05', amb: 'A05' }, spine_b4: { bgm: 'M05', amb: 'A05' }, spine_b5: { bgm: 'M05', amb: 'A05' },
  abyss: { bgm: 'M05', amb: 'A06' },
  canteen: { bgm: 'M03', amb: 'A02' }, armory: { bgm: 'M06', amb: 'A03' }, interrogation: { bgm: 'M05', amb: 'A05' }, training: { bgm: 'M06', amb: 'A06' },
  floor2: { bgm: 'M03', amb: 'A02' }, floor3: { bgm: 'M03', amb: 'A03' }, library: { bgm: 'M04', amb: 'A04' }, director: { bgm: 'M01', amb: 'A04' },
  menu: { bgm: 'M01', amb: null },
};
export const FOOTSTEP = { stone: 'S01', marble: 'S01', carpet: 'S02', metal: 'S03', wood: 'S02', grate: 'S03' };
// I1：Kenney CC0 交互音效（content/audio/K_*.ogg）。缺文件时回落到原 Sxx。
const KSET = {
  ui_hover: ['K_ui_hover'], ui_click: ['K_ui_click'], ui_confirm: ['K_ui_confirm'], ui_back: ['K_ui_back'], ui_open: ['K_ui_open'],
  step_stone: [0, 1, 2, 3].map((i) => 'K_step_stone_' + i), step_wood: [0, 1, 2, 3].map((i) => 'K_step_wood_' + i),
  step_carpet: [0, 1, 2, 3].map((i) => 'K_step_carpet_' + i), step_metal: [0, 1, 2, 3].map((i) => 'K_step_metal_' + i),
  paper: ['K_paper_0', 'K_paper_1', 'K_paper_2'], paper_open: ['K_paper_open'],
  door_open: ['K_door_open'], door_close: ['K_door_close'], drawer: ['K_drawer'], cabinet: ['K_cabinet'],
};
const KSTEP = { stone: 'step_stone', marble: 'step_stone', concrete: 'step_stone', wood: 'step_wood', carpet: 'step_carpet', metal: 'step_metal', grate: 'step_metal' };
// 旧编号 → Kenney 组（覆盖全部现有调用点，不改调用方）：S08 翻页、S11 木门、S22 菜单
const KALIAS = { S08: ['paper', 0.55], S11: ['door_open', 0.8], S22: ['ui_open', 0.5] };
// 交互按提示语分类（门/抽屉/柜），其余用克制的确认音
const KINTER = [[/抽屉|投放口|drawer/i, 'drawer', 0.6], [/柜|锁|箱|cabinet|locker/i, 'cabinet', 0.55], [/门|door/i, 'door_open', 0.6]];

export class Audio {
  constructor(camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    this.buffers = new Map();
    this.missing = new Set();
    this.vol = { master: 0.8, music: 0.55, amb: 0.7, sfx: 0.9 };
    this.listener.setMasterVolume(this.vol.master);
    this.music = null; this.amb = null; this.zone = null;
    this.loader = new THREE.AudioLoader();
    this.manifestFiles = null; // 可选：content/audio/index.json 列出可用文件
  }
  async init() {
    try { const r = await fetch('./content/audio/index.json'); if (r.ok) this.manifestFiles = await r.json(); } catch { /* 无索引则逐一尝试 */ }
  }
  resume() { const c = this.listener.context; if (c.state !== 'running') c.resume(); }
  async buffer(id) {
    if (this.buffers.has(id)) return this.buffers.get(id);
    if (this.missing.has(id)) return null;
    const p = (async () => {
      const cands = this.manifestFiles ? this.manifestFiles.filter((f) => f.startsWith(id + '.') || f.startsWith(id + '_')) : EXTS.map((e) => `${id}.${e}`);
      for (const f of cands) {
        try {
          const r = await fetch(`./content/audio/${f}`);
          if (!r.ok) continue;
          const ab = await r.arrayBuffer();
          return await this.listener.context.decodeAudioData(ab);
        } catch { /* 下一个 */ }
      }
      this.missing.add(id); return null;
    })();
    this.buffers.set(id, p);
    const b = await p; if (!b) this.buffers.delete(id);
    return b;
  }
  async loop(id, vol) {
    const b = id && await this.buffer(id); if (!b) return null;
    const s = new THREE.Audio(this.listener); s.setBuffer(b); s.setLoop(true); s.setVolume(0); s.play();
    s.userData = { target: vol }; return s;
  }
  fade(s, to, t = 2.5) {
    if (!s) return; const g = s.gain.gain, c = this.listener.context;
    g.cancelScheduledValues(c.currentTime); g.setValueAtTime(g.value, c.currentTime); g.linearRampToValueAtTime(to, c.currentTime + t);
    if (to === 0) setTimeout(() => { try { s.stop(); } catch { /* */ } }, t * 1000 + 100);
  }
  async setZone(zone) {
    if (zone === this.zone) return; this.zone = zone;
    const z = ZONE_AUDIO[zone] ?? ZONE_AUDIO.security_hall;
    if (!this.music || this.music.userData.id !== z.bgm) {
      const old = this.music; this.fade(old, 0);
      this.music = await this.loop(z.bgm, this.vol.music); if (this.music) { this.music.userData.id = z.bgm; this.fade(this.music, this.vol.music); }
    }
    if (!this.amb || this.amb.userData.id !== z.amb) {
      const old = this.amb; this.fade(old, 0);
      this.amb = await this.loop(z.amb, this.vol.amb); if (this.amb) { this.amb.userData.id = z.amb; this.fade(this.amb, this.vol.amb); }
    }
  }
  /** 播放 Kenney 组里随机一个变体；成功返回 true */
  async kfx(set, vol = 1, rate = 1) {
    const ids = KSET[set]; if (!ids) return false;
    const b = await this.buffer(ids[(Math.random() * ids.length) | 0]); if (!b) return false;
    this._play(b, vol, rate); return true;
  }
  _play(b, vol, rate) { const s = new THREE.Audio(this.listener); s.setBuffer(b); s.setVolume(vol * this.vol.sfx); s.setPlaybackRate(rate); s.play(); }
  get running() { return this.listener.context.state === 'running'; }
  /** E 键交互：按提示语选门/抽屉/金属柜，否则 UI 确认音 */
  interact(spot) {
    let t = ''; try { t = typeof spot?.prompt === 'function' ? spot.prompt() : (spot?.prompt ?? ''); } catch { /* */ }
    t = `${t} ${spot?.id ?? ''}`;
    for (const [re, set, v] of KINTER) if (re.test(t)) {
      if (set === 'door_open') setTimeout(() => { if (this.running) this.kfx('door_close', 0.45, 0.97 + Math.random() * 0.06); }, 1150); // 批次 S2：门开后约 1.15 s 自动回关（门无独立关闭事件）
      return this.kfx(set, v, 0.95 + Math.random() * 0.1).then((ok) => ok || this.sfx('S15', 0.5));
    }
    return this.kfx('ui_confirm', 0.35).then((ok) => ok || this.sfx('S15', 0.5));
  }
  /** UI 钩子：悬停/点击（只接音效，不动样式）；AudioContext 未解锁前悬停静默，点击先 resume */
  bindUI() {
    if (this._ui) return; this._ui = true;
    // 批次 S2：阅读器开合 / 暂停菜单关闭（ui.js 派发 nb:reader / nb:pause 事件，不互相 import）
    window.addEventListener('nb:reader', (e) => { if (!this.running) return; if (e.detail === 'open') this.kfx('paper_open', 0.5); else this.kfx('ui_back', 0.32); });
    window.addEventListener('nb:pause', (e) => { if (this.running && e.detail === 'close') this.kfx('ui_back', 0.3); });
    const SEL = 'button, .btn, .seg span, #dlgch div, #dlg .choices div';
    let last = null, lt = 0;
    document.addEventListener('pointerover', (e) => {
      const el = e.target.closest?.(SEL); if (!el || el === last || !this.running) return;
      const n = performance.now(); if (n - lt < 60) return; last = el; lt = n; this.kfx('ui_hover', 0.22);
    }, true);
    document.addEventListener('pointerout', (e) => { if (e.target.closest?.(SEL) === last) last = null; }, true);
    document.addEventListener('click', (e) => {
      const el = e.target.closest?.(SEL); if (!el) return;
      this.resume();
      if (el.id === 'start') { this.kfx('ui_confirm', 0.4); this.gears(2.8); } else this.kfx('ui_click', 0.4);
    }, true);
  }
  /** 齿轮加载：程序化低沉机械齿轮（低频锯齿底噪 + 棘轮咔嗒），走 listener 总线，受主音量控制 */
  gears(dur = 2.8) {
    const c = this.listener.context; if (c.state === 'closed') return;
    const t0 = c.currentTime + 0.05, out = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 900; out.connect(this.listener.getInput()); lp.connect(out);
    const pk = 0.16 * this.vol.sfx;
    out.gain.setValueAtTime(0, t0); out.gain.linearRampToValueAtTime(pk, t0 + 0.35); out.gain.setValueAtTime(pk, t0 + dur - 0.6); out.gain.linearRampToValueAtTime(0, t0 + dur);
    for (const [f, g] of [[46, 0.5], [69.5, 0.25]]) { // 两路失谐锯齿 = 转轴低吟
      const o = c.createOscillator(), og = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.8, t0); o.frequency.linearRampToValueAtTime(f, t0 + 0.8);
      og.gain.value = g; o.connect(og); og.connect(lp); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    // 棘轮咔嗒：短噪声脉冲过带通（仿 teardown sfx click/impact：噪声瞬态 + 低频体）
    const n = Math.floor(c.sampleRate * 0.03), nb = c.createBuffer(1, n, c.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.004)) + Math.sin(i / c.sampleRate * 2 * Math.PI * 180) * Math.exp(-i / (c.sampleRate * 0.012)) * 0.8;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 1.2; bp.connect(out);
    for (let t = 0.12, k = 0; t < dur - 0.2; t += 0.19 + (k % 4 === 3 ? 0.07 : 0), k++) {
      const s = c.createBufferSource(), g = c.createGain(); s.buffer = nb; s.playbackRate.value = 0.85 + (k % 3) * 0.08; g.gain.value = 0.55 + (k % 2) * 0.2;
      s.connect(g); g.connect(bp); s.start(t0 + t);
    }
    setTimeout(() => { try { out.disconnect(); } catch { /* */ } }, (dur + 0.5) * 1000);
  }
  async sfx(id, vol = 1, rate = 1) {
    const al = KALIAS[id]; if (al && await this.kfx(al[0], vol * al[1] / 0.7, rate)) return;
    const b = await this.buffer(id); if (!b) return;
    const s = new THREE.Audio(this.listener); s.setBuffer(b); s.setVolume(vol * this.vol.sfx); s.setPlaybackRate(rate); s.play();
  }
  /** 三维点声源（喷泉、闸机、座钟） */
  async positional(id, obj, { vol = 1, ref = 4, loop = true } = {}) {
    const b = await this.buffer(id); if (!b) return null;
    const s = new THREE.PositionalAudio(this.listener); s.setBuffer(b); s.setRefDistance(ref); s.setLoop(loop); s.setVolume(vol * this.vol.amb);
    obj.add(s); if (loop) s.play(); return s;
  }
  async footstep(surface) {
    // 物理层未登记金属地面：东楼梯 / 书脊竖井（钢格栅梯）按区域判金属
    if ((surface ?? 'stone') === 'stone' && /^(east_stair|spine_b)/.test(this.zone ?? '')) surface = 'metal';
    const v = 0.3 + Math.random() * 0.08, r = 0.92 + Math.random() * 0.14;
    if (await this.kfx(KSTEP[surface] ?? 'step_stone', surface === 'carpet' ? v * 0.8 : v, r)) return;
    this.sfx(FOOTSTEP[surface] ?? 'S01', 0.35 + Math.random() * 0.1, r);
  }
  setVolumes(v) { Object.assign(this.vol, v); this.listener.setMasterVolume(this.vol.master); if (this.music) this.music.setVolume(this.vol.music); if (this.amb) this.amb.setVolume(this.vol.amb); }
}
