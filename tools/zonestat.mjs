// 各区静态负载（test 模式，不渲染）：切到每个区后统计可见组的网格数/三角面、阳光阴影投射三角面；并列出大头网格。
// node tools/zonestat.mjs [--out docs/zonestat.json]
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve('dist');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/workspace/work/tools/pw-browsers/chromium_headless_shell-1148/chrome-linux/headless_shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${srv.address().port}/?test=1&q=medium`);
await page.waitForFunction(() => window.__NB_READY__ === true, null, { timeout: 600000, polling: 1000 });
const res = await page.evaluate(([__ZONES__, __TOP__]) => {
  const N = window.__NB__; const out = { zones: {}, groups: window.__GROUPS__(), top: {} };
  for (const z of (__ZONES__ ? __ZONES__ : N.zones())) { N.setZone(z); const gs = window.__GROUPS__().filter((g) => g.visible); const sun = N.sunOf(z) > 0;
    out.zones[z] = { groups: gs.map((g) => g.name), meshes: gs.reduce((a, g) => a + g.meshes, 0), tris: gs.reduce((a, g) => a + g.tris, 0), sunShadowTris: sun ? gs.reduce((a, g) => a + g.shadowTris, 0) : 0, sun }; }
  for (const g of (__TOP__ || ['exterior', 'surface', 'floor3', 'armory', 'east_wing', 'canteen', 'security_hall'])) out.top[g] = N.topMeshes(g, 25);
  return out; }, [process.env.ZONES ? process.env.ZONES.split(',') : null, process.env.TOP ? process.env.TOP.split(',') : null]);
fs.writeFileSync(arg('out', 'docs/zonestat.json'), JSON.stringify(res, null, 1));
for (const [z, v] of Object.entries(res.zones)) console.log(z.padEnd(18), String(v.meshes).padStart(5), (v.tris / 1e6).toFixed(2) + 'M', 'shadow ' + (v.sunShadowTris / 1e6).toFixed(2) + 'M', v.groups.join(','));
for (const [g, l] of Object.entries(res.top)) { console.log('== ' + g); for (const m of l) console.log('  ', m.tris, m.inst, m.name, m.mat, m.shadow ? 'S' : ''); }
await browser.close(); srv.close();
