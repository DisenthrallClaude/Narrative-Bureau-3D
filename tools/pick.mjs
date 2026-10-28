// 调试：加载机位，对若干屏幕点做射线拾取，打印命中材质（不截图）。node tools/pick.mjs dorm_room "0,-0.6;0.5,-0.3"
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve('dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const browser = await chromium.launch({ executablePath: '/workspace/work/tools/pw-browsers/chromium_headless_shell-1148/chrome-linux/headless_shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${srv.address().port}/?shot=${process.argv[2]}&q=low&frames=2`);
await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 600000, polling: 1000 });
for (const pt of (process.argv[3] || '0,-0.6').split(';')) { const [x, y] = pt.split(',').map(Number); console.log(pt, JSON.stringify(await page.evaluate(([x, y]) => window.__PICK__(x, y), [x, y]))); }
console.log('info', JSON.stringify(await page.evaluate(() => window.__SHOT_INFO__())));
await browser.close(); srv.close();
