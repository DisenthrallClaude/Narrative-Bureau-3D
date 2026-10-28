// 截图：node tools/shot.mjs <输出目录> 机位1,机位2 [--q high] [--w 1600] [--h 900] [--frames 8]
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve('dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const out = process.argv[2] || 'screenshots/tmp'; const shots = (process.argv[3] || 'plaza').split(',');
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const port = srv.address().port;
const exe = process.env.CHROME || '/workspace/work/tools/pw-browsers/chromium_headless_shell-1148/chrome-linux/headless_shell';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox'] });
const W = +arg('w', 1600), H = +arg('h', 900);
const page = await browser.newPage({ viewport: { width: W, height: H } });
const t0 = Date.now(); const logs = [];
page.on('console', (m) => { logs.push(m.type() + ': ' + m.text()); if (m.text().startsWith('[NB]') && !m.text().includes('frame') || m.type() === 'error') console.log('  ', ((Date.now() - t0) / 1000).toFixed(0) + 's', m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('PAGEERROR: ' + e.message));
page.on('crash', () => console.log('PAGE CRASH'));
await page.goto(`http://localhost:${port}/?shot=${shots[0]}&q=${arg('q', 'high')}&frames=${arg('frames', 8)}${arg('hud', '') ? '&hud=1' : ''}`);
for (let i = 0; i < shots.length; i++) {
  const s = shots[i]; const ts = Date.now();
  if (i > 0) await page.evaluate((n) => window.__setShot(n), s);
  try { await page.waitForFunction(() => window.__READY__ === true, null, { timeout: +arg('timeout', 900000), polling: 1000 }); } catch (e) { console.log('TIMEOUT', s); }
  const info = await page.evaluate(() => window.__SHOT_INFO__?.()).catch(() => null);
  try { await page.screenshot({ path: path.join(out, `${s}.png`), timeout: 300000 }); } catch (e) { console.log('shot fail', e.message.slice(0, 80)); continue; }
  console.log(s, ((Date.now() - ts) / 1000).toFixed(0) + 's', JSON.stringify(info));
}
await browser.close(); srv.close();
