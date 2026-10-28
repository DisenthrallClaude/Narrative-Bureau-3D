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
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const t0 = Date.now(); const logs = []; page.on('console', (m) => { logs.push(m.type() + ': ' + m.text()); if (m.text().startsWith('[NB]') || m.type() === 'error') console.log('  ', ((Date.now() - t0) / 1000).toFixed(0) + 's', m.text().slice(0, 300)); }); page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message)); page.on('crash', () => { console.log('PAGE CRASH'); console.log(logs.slice(-15).join('\n')); });
  await page.goto(`http://localhost:${port}/?shot=${s}&q=${arg('q', 'high')}&frames=${arg('frames', 8)}${arg('hud', '') ? '&hud=1' : ''}`);
  try { await page.waitForFunction(() => window.__READY__ === true, null, { timeout: +arg('timeout', 600000), polling: 1000 }); }
  catch (e) { logs.push('TIMEOUT ' + e.message); }
  const info = await page.evaluate(() => window.__SHOT_INFO__?.()).catch(() => null);
  try { await page.screenshot({ path: path.join(out, `${s}.png`), timeout: 300000 }); } catch (e) { console.log('shot fail', e.message.slice(0, 80)); console.log(logs.slice(-15).join('\n')); continue; }
  console.log(s, ((Date.now() - t0) / 1000).toFixed(0) + 's', JSON.stringify(info));
  const errs = logs.filter((l) => /error|ERROR|warn/i.test(l)); if (errs.length) console.log(errs.slice(0, 12).join('\n'));
  await page.close();
}
await browser.close(); srv.close();
