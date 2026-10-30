import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve('dist');
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const browser = await chromium.launch({ executablePath: '/workspace/work/tools/pw-browsers/chromium_headless_shell-1148/chrome-linux/headless_shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--enable-precise-memory-info'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
let done = false;
page.on('console', async (m) => { const t = m.text(); if (t.includes('bake b5') && !done) { done = true;
  const r = await page.evaluate(() => { const S = window.__NB_G__.scene; const bufs = new Set(), ims = new Map(); let geo = 0;
    const addB = (a) => { const b = a?.buffer; if (b && !bufs.has(b)) { bufs.add(b); geo += b.byteLength; } };
    S.traverse((x) => { const g = x.geometry; if (g) { for (const k in g.attributes) { const at = g.attributes[k]; addB(at.isInterleavedBufferAttribute ? at.data.array : at.array); } if (g.index) addB(g.index.array); }
      if (x.isInstancedMesh) addB(x.instanceMatrix.array);
      const ms = Array.isArray(x.material) ? x.material : x.material ? [x.material] : []; for (const m of ms) for (const k in m) { const v = m[k]; if (v && v.isTexture) { const im = v.source?.data; if (im && !ims.has(im)) ims.set(im, [im.constructor.name, (im.width || 0) * (im.height || 0) * 4 + (im.data?.byteLength || 0)]); } } });
    const byType = {}; for (const [t, b] of ims.values()) { byType[t] = byType[t] || [0, 0]; byType[t][0]++; byType[t][1] += b / 1e6; }
    return { heap: performance.memory.usedJSHeapSize / 1e6, geoMB: geo / 1e6, nbuf: bufs.size, byType }; });
  console.log(JSON.stringify(r)); await browser.close(); srv.close(); process.exit(0); } });
await page.goto(`http://localhost:${srv.address().port}/?shot=cs_r3&q=high&frames=8`);
setTimeout(() => process.exit(1), 300000);
