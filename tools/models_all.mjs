// R2：把 assets/sourced/ 下全部网上模型批量处理进游戏（减面 + meshopt + WebP 贴图），并生成目录 public/assets/models/r2/catalog.json
// 用法：node tools/models_all.mjs [过滤正则]   （已处理过的跳过；FORCE=1 重做）
// 目录项：{ id, src, tris, size:[x,y,z]（米，原始单位×unit）, mb }。旧的 86 个（tools/process_models.sh）也登记进去（legacy:true）。
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const S = '../assets/sourced', O = 'public/assets/models/r2', CAT = path.join(O, 'catalog.json');
fs.mkdirSync(O, { recursive: true });
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const filt = process.argv[2] ? new RegExp(process.argv[2]) : null;
const cat = fs.existsSync(CAT) ? JSON.parse(fs.readFileSync(CAT, 'utf8')) : {};

// 旧管线已处理的（name|src|...）
const legacy = {};
for (const line of fs.readFileSync('tools/process_models.sh', 'utf8').split('\n')) { const m = line.match(/^([a-z0-9_]+)\|([^|]+)\|/); if (m) legacy[m[2].split('/').slice(0, 2).join('/')] = m[1]; }

function shortId(dir) {
  let n = path.basename(dir).replace(/^(sf|si|kh|usd|g3|sc|acg)_/, '').replace(/_[0-9a-f]{6}$/, '');
  return n.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
}
async function stats(file) {
  const doc = await io.read(file);
  let tris = 0; const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
  const visit = (node, parentM) => {
    const m = multiply(parentM, node.getMatrix());
    const mesh = node.getMesh();
    if (mesh) for (const p of mesh.listPrimitives()) {
      const idx = p.getIndices(), pos = p.getAttribute('POSITION'); if (!pos) continue;
      tris += (idx ? idx.getCount() : pos.getCount()) / 3;
      const pmin = pos.getMin([]), pmax = pos.getMax([]);
      for (const cx of [pmin[0], pmax[0]]) for (const cy of [pmin[1], pmax[1]]) for (const cz of [pmin[2], pmax[2]]) {
        const v = apply(m, [cx, cy, cz]); for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], v[k]); max[k] = Math.max(max[k], v[k]); }
      }
    }
    for (const c of node.listChildren()) visit(c, m);
  };
  for (const n of scene?.listChildren() ?? []) visit(n, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  return { tris: Math.round(tris), size: max.map((v, k) => +(v - min[k]).toFixed(3)) };
}
function multiply(a, b) { const o = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) o[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return o; }
function apply(m, v) { return [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]]; }

const dirs = [];
for (const zone of fs.readdirSync(S)) {
  if (/^00_/.test(zone)) continue;
  const zd = path.join(S, zone); if (!fs.statSync(zd).isDirectory()) continue;
  for (const d of fs.readdirSync(zd)) {
    const dd = path.join(zd, d); if (!fs.statSync(dd).isDirectory()) continue;
    const files = fs.readdirSync(dd).filter((f) => /\.(glb|gltf)$/i.test(f));
    if (!files.length) continue;
    const pick = files.find((f) => /2k/.test(f)) ?? files.find((f) => /1k/.test(f)) ?? files[0];
    dirs.push({ zone, dir: d, file: path.join(dd, pick) });
  }
}
console.log('sourced models', dirs.length);
let n = 0;
for (const it of dirs) {
  const key = it.zone + '/' + it.dir;
  if (filt && !filt.test(key)) continue;
  let id = legacy[key] ?? shortId(it.dir);
  if (!legacy[key] && cat[id] && cat[id].src !== key) id = id + '_' + it.dir.slice(-6);
  const out = legacy[key] ? `public/assets/models/${id}.glb` : path.join(O, id + '.glb');
  if (cat[id] && fs.existsSync(out) && !process.env.FORCE) continue;
  try {
    if (!legacy[key]) {
      const st = await stats(it.file);
      const target = /gothic_architecture|cathedral|portal|vault|bridge|minster|carpet/.test(key) ? 150000 : /car|heli|ec_135|police|benz|bus|truck|van|statue|lion|fountain|napoleon|gargoyle/.test(key) ? 80000 : 30000;
      const ratio = Math.min(1, target / Math.max(1, st.tris));
      const tex = st.tris > 50000 || /car|heli|statue|fountain|lion|gargoyle|portal|window/.test(key) ? 1024 : 512;
      const args = ['gltf-transform', 'optimize', it.file, out, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', String(tex), '--flatten', 'false', '--join', 'true', '--instance', 'false'];
      if (ratio < 0.98) args.push('--simplify-ratio', ratio.toFixed(4), '--simplify-error', '0.01'); else args.push('--simplify', 'false');
      execFileSync('npx', args, { stdio: 'pipe', timeout: 900000 });
    }
    const st2 = await stats(out);
    cat[id] = { id, src: key, zone: it.zone, tris: st2.tris, size: st2.size, kb: Math.round(fs.statSync(out).size / 1024), legacy: !!legacy[key], url: out.replace('public/', './') };
    fs.writeFileSync(CAT, JSON.stringify(cat, null, 1));
    console.log('OK', ++n, id, st2.tris, st2.size.join('×'), cat[id].kb + 'KB');
  } catch (e) { console.log('FAIL', id, (e.stderr?.toString() || e.message).slice(-300)); }
}
console.log('done', Object.keys(cat).length);
