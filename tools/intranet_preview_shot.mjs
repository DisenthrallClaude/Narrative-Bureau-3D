// 局内网覆盖层 / 屏幕纹理截图（不加载 3D 世界，内存小）：node tools/intranet_preview_shot.mjs [out] "名称=查询串" ...
// 例：node tools/intranet_preview_shot.mjs screenshots/intranet "ui_legal_dept=st=legal&tab=dept" "screens=screens=1"
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2] || 'screenshots/intranet'; fs.mkdirSync(out, { recursive: true });
const jobs = process.argv.slice(3).map((s) => { const i = s.indexOf('='); return [s.slice(0, i), s.slice(i + 1)]; });
const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' }); await server.listen();
const port = server.httpServer.address().port;
const exe = process.env.CHROME || '/workspace/work/tools/pw-browsers/chromium_headless_shell-1148/chrome-linux/headless_shell';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
for (const [name, q] of jobs) {
  const page = await browser.newPage({ viewport: { width: +(process.env.W ?? 1600), height: +(process.env.H ?? 900) } });
  page.on('pageerror', (e) => console.log('PAGEERROR', name, e.message.slice(0, 200))); page.on('console', (m) => { if (m.type() === 'error') console.log('  console', name, m.text().slice(0, 160)); });
  await page.goto(`http://127.0.0.1:${port}/tools/intranet-preview.html?${q}`);
  await page.waitForFunction(() => window.__PREVIEW_READY__ === true, null, { timeout: 120000 });
  await page.screenshot({ path: path.join(out, name + '.png'), fullPage: false }); console.log('shot', name);
  await page.close();
}
await browser.close(); await server.close();
