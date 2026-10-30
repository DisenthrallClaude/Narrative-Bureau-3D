// 批次15 拾取探针：node tools/_pick.mjs <机位> <ndcX> <ndcY> [<ndcX> <ndcY> ...] —— 等机位就绪后从相机打射线，打印命中物体名/材质/世界坐标
import { chromium } from 'playwright-core'; import http from 'http'; import fs from 'fs'; import path from 'path';
const ROOT = path.resolve('dist'); const shot = process.argv[2]; const pts = process.argv.slice(3).map(Number);
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200); fs.createReadStream(f).pipe(res); }).listen(0);
const exe = process.env.CHROME || '/workspace/work/tools/pw-browsers/chromium_headless_shell-1148/chrome-linux/headless_shell';
const b = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 320, height: 180 } });
await page.goto(`http://localhost:${srv.address().port}/?shot=${shot}&q=low&frames=1`);
await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 600000, polling: 1000 });
const r = await page.evaluate((pts) => { const T = window.__THREE__, G = window.G, rc = new T.Raycaster(), out = [];
  for (let i = 0; i < pts.length; i += 2) { rc.setFromCamera(new T.Vector2(pts[i], pts[i + 1]), G.camera); const hs = rc.intersectObjects(G.scene.children, true).filter((h) => h.object.visible && h.object.isMesh).slice(0, 4);
    out.push([pts[i], pts[i + 1], hs.map((h) => { let p = h.object, chain = []; while (p && chain.length < 4) { chain.push(p.name || p.type); p = p.parent; } const m = Array.isArray(h.object.material) ? h.object.material[0] : h.object.material;
      return { d: +h.distance.toFixed(2), p: h.point.toArray().map((v) => +v.toFixed(2)), chain: chain.join('<'), mat: m?.name || '', col: m?.color?.getHexString?.(), map: m?.map?.image?.src?.slice(-50) || m?.map?.name || '', inst: h.instanceId ?? null, ud: JSON.stringify(h.object.userData).slice(0, 120) }; })]); }
  return out; }, pts);
console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close();
