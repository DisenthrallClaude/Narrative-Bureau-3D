// 性能采样：逐机位渲染 1 帧（320×180，画质可选），记录整帧 drawcall / 三角面 / 程序 / 几何 / 贴图。node tools/perf.mjs [--q medium] [--shots a,b] [--out docs/perf.json]
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve('dist');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const src = fs.readFileSync('src/shots.js', 'utf8'); const all = [...src.matchAll(/^  ([a-z0-9_]+):/gm)].map((m) => m[1]);
const shots = arg('shots', '') ? arg('shots').split(',') : all;
const out = arg('out', 'docs/perf.json'); const res = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {};
const browser = await chromium.launch({ executablePath: '/workspace/work/tools/pw-browsers/chromium_headless_shell-1148/chrome-linux/headless_shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${srv.address().port}/?shot=${shots[0]}&q=${arg('q', 'medium')}&frames=1`);
for (let i = 0; i < shots.length; i++) {
  const s = shots[i]; const t = Date.now();
  if (i > 0) await page.evaluate((n) => window.__setShot(n), s);
  await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 600000, polling: 500 });
  const info = await page.evaluate(() => ({ ...window.__SHOT_INFO__(), ...(window.__PERF__ ? (({ geometries, textures, programs }) => ({ geometries, textures, programs }))(window.__PERF__()) : {}) }));
  res[s] = info; fs.writeFileSync(out, JSON.stringify(res, null, 1));
  console.log(s, ((Date.now() - t) / 1000).toFixed(0) + 's', JSON.stringify(info));
}
await browser.close(); srv.close();
