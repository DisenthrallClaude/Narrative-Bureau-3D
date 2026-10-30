// 局内网截图：每个终端单独新开页面（SwiftShader 单张新页，避免同会话着色器变体堆积 OOM）
// 用法：node tools/intranet_shot.mjs <终端id,...> [--ui 页1,页2] [--out screenshots/intranet] [--q high] [--wide 1]
//   每个终端：net_<id> 近景（屏幕贴图）→ 可选 net_<id>_w 中景 → 可选打开覆盖层逐页截图（--ui home,people,mail,reg,dept 或 people:yexun / home:doc_office_notice / mail:m3）
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve('dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.woff2': 'font/woff2', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.bin': 'application/octet-stream', '.txt': 'text/plain; charset=utf-8', '.ktx2': 'image/ktx2' };
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const ids = (process.argv[2] || 'legal').split(','); const out = arg('out', 'screenshots/intranet'); fs.mkdirSync(out, { recursive: true });
const uis = (arg('ui', '') || '').split(',').filter(Boolean);
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] ?? 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const port = srv.address().port;
const exe = process.env.CHROME || '/workspace/work/tools/pw-browsers/chromium_headless_shell-1148/chrome-linux/headless_shell';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox'] });
const W = +arg('w', 1600), H = +arg('h', 900); const t0 = Date.now(); const T = () => ((Date.now() - t0) / 1000).toFixed(0) + 's';
const ready = (page) => page.waitForFunction(() => window.__READY__ === true, null, { timeout: 1500000, polling: 1000 });
for (const id of ids) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' || /局内网|PAGEERROR/.test(t)) console.log('  ', T(), m.type(), t.slice(0, 220)); });
  page.on('pageerror', (e) => console.log('  PAGEERROR', e.message.slice(0, 220)));
  try {
    await page.goto(`http://localhost:${port}/?shot=net_${id}&q=${arg('q', 'high')}&frames=${arg('frames', 6)}`);
    await ready(page);
    let calm = 0; const tw = Date.now(); while (calm < 3 && Date.now() - tw < 900000) { const st = await page.evaluate(() => window.__LOADSTATE__?.() ?? { pending: 0 }).catch(() => ({ pending: 0 })); calm = st.pending <= 0 ? calm + 1 : 0; await page.waitForTimeout(1000); }
    await page.evaluate(() => new Promise((r) => setTimeout(r, 1500))); // 局内网迟到补贴（4 s 定时）之前的屏幕
    await page.evaluate((n) => window.__setShot(n), 'net_' + id); await ready(page);
    console.log(T(), id, 'screens', JSON.stringify(await page.evaluate(() => window.__INTRANET__?.screens().length)));
    await page.screenshot({ path: path.join(out, `net_${id}.png`) }); console.log(T(), 'shot', `net_${id}.png`);
    if (arg('wide', '')) { await page.evaluate((n) => window.__setShot(n), 'net_' + id + '_w'); await ready(page); await page.screenshot({ path: path.join(out, `net_${id}_w.png`) }); console.log(T(), 'shot', `net_${id}_w.png`); }
    for (const u of uis) {
      const [tab, v] = u.split(':');
      await page.evaluate(([id, tab, v]) => { const I = window.__INTRANET__; if (!I.isOpen()) I.open(id, tab); const view = !v ? null : tab === 'people' ? { person: v } : tab === 'home' ? { doc: v, no: '叙管办〔2026〕117 号' } : null; if (tab === 'mail' && v) I.state.mail = v; I.go(tab, view); }, [id, tab, v]);
      await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1200);
      const f = `ui_${id}_${tab}${v ? '_' + v : ''}.png`; await page.screenshot({ path: path.join(out, f) }); console.log(T(), 'shot', f);
    }
  } catch (e) { console.log('ERROR', id, String(e.message).slice(0, 200)); }
  await page.close().catch(() => {});
}
await browser.close(); srv.close(); console.log(T(), 'done');
