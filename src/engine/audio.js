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
  menu: { bgm: 'M01', amb: null },
};
export const FOOTSTEP = { stone: 'S01', marble: 'S01', carpet: 'S02', metal: 'S03', wood: 'S02', grate: 'S03' };

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
  async sfx(id, vol = 1, rate = 1) {
    const b = await this.buffer(id); if (!b) return;
    const s = new THREE.Audio(this.listener); s.setBuffer(b); s.setVolume(vol * this.vol.sfx); s.setPlaybackRate(rate); s.play();
  }
  /** 三维点声源（喷泉、闸机、座钟） */
  async positional(id, obj, { vol = 1, ref = 4, loop = true } = {}) {
    const b = await this.buffer(id); if (!b) return null;
    const s = new THREE.PositionalAudio(this.listener); s.setBuffer(b); s.setRefDistance(ref); s.setLoop(loop); s.setVolume(vol * this.vol.amb);
    obj.add(s); if (loop) s.play(); return s;
  }
  footstep(surface) { this.sfx(FOOTSTEP[surface] ?? 'S01', 0.35 + Math.random() * 0.1, 0.92 + Math.random() * 0.16); }
  setVolumes(v) { Object.assign(this.vol, v); this.listener.setMasterVolume(this.vol.master); if (this.music) this.music.setVolume(this.vol.music); if (this.amb) this.amb.setVolume(this.vol.amb); }
}
