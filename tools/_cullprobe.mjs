// R3 批次10：metro 视角同屏三角面按距离统计（window.__CULLPROBE__，main.js ?probe=1）
// node tools/bake_export.mjs <输出目录> <id1,id2,...> [--shot training_r3]
// 输出 <id>.json + <id>.bin，交给 tools/blender/bake_ao_zone.py
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve('dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const out = process.argv[2]; const ids = [];
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((req, res) => {
  if (req.method === 'POST') { const name = new URL(req.url, 'http://x').searchParams.get('name'); const ws = fs.createWriteStream(path.join(out, path.basename(name))); req.pipe(ws); ws.on('finish', () => { res.writeHead(200); res.end('ok'); }); return; }
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
const port = srv.address().port;
const exe = process.env.CHROME || '/workspace/work/tools/pw-browsers/chromium_headless_shell-1148/chrome-linux/headless_shell';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox', '--js-flags=--max-old-space-size=6000'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
const t0 = Date.now();
page.on('console', (m) => { if (m.text().startsWith('[NB]') || m.type() === 'error') console.log('  ', ((Date.now() - t0) / 1000).toFixed(0) + 's', m.text().slice(0, 200)); });
page.on('pageerror', (e) => console.log('PAGEERROR: ' + e.message));
await page.goto(`http://localhost:${port}/?shot=${arg('shot', 'training_r3')}&q=low&frames=1&noao=1&probe=1`);
await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 1800000, polling: 1000 });
let calm = 0; while (calm < 4) { const st = await page.evaluate(() => window.__LOADSTATE__?.() ?? { pending: 0 }); calm = st.pending <= 0 ? calm + 1 : 0; await new Promise((r) => setTimeout(r, 1000)); }
const r = await page.evaluate(() => window.__CULLPROBE__());
console.log(JSON.stringify(r, null, 1));
await browser.close(); srv.close();
console.log('DONE', ((Date.now() - t0) / 1000).toFixed(0) + 's');
