// 同屏三角面实测：node tools/tristat.mjs <out.json> 机位1,机位2 [--q high] [--extra '&x=1']
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve('dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const out = process.argv[2]; const shots = process.argv[3].split(',');
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 270 } });
page.on('pageerror', (e) => console.log('PAGEERROR: ' + e.message));
await page.goto(`http://localhost:${srv.address().port}/?shot=${shots[0]}&q=${arg('q', 'high')}&frames=2${arg('extra', '')}`);
const res = {};
for (let i = 0; i < shots.length; i++) {
  const s = shots[i];
  if (i > 0) await page.evaluate((n) => window.__setShot(n), s);
  await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 2400000, polling: 1000 });
  if (i === 0) { let calm = 0; while (calm < 3) { const st = await page.evaluate(() => window.__LOADSTATE__?.() ?? { pending: 0 }); calm = st.pending <= 0 ? calm + 1 : 0; await new Promise((r) => setTimeout(r, 1000)); } await page.evaluate((n) => window.__setShot(n), s); await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 2400000, polling: 1000 }); }
  res[s] = await page.evaluate(() => window.__TRISTAT__()); res[s].passes = await page.evaluate(() => window.__FRAME__?.());
  const r = res[s]; console.log(s, JSON.stringify(r.passes), 'frame', (r.frame.tris / 1e6).toFixed(2) + 'M', 'calls', r.frame.calls, 'main', (r.main / 1e6).toFixed(2) + 'M', 'shadow', (r.shadow / 1e6).toFixed(2) + 'M', JSON.stringify(Object.fromEntries(Object.entries(r.groups).filter(([, v]) => v.main + v.shadow > 50000).map(([k, v]) => [k, [(v.main / 1e6).toFixed(2), (v.shadow / 1e6).toFixed(2)]]))));
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
}
await browser.close(); srv.close();
