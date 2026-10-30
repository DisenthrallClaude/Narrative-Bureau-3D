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
const EXTRA_ARGS=(process.env.CHROME_ARGS||'').split(' ').filter(Boolean);
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox', ...EXTRA_ARGS] });
const W = +arg('w', 1600), H = +arg('h', 900);
// R3 批次8 收尾：--fresh 1 每个机位新开页面（关旧页释放内存）；默认对带 clipY 的俯视机位（*_top）也新开——
// 俯视机位之后的下一张也新开（实测 hangar_top 之后的 wall_post 同样链接失败）。SwiftShader 在同会话里补编译大批新着色器变体（裁剪面有/无）时内存吃紧，链接失败（日志空）→ GL 1282 连锁，后续机位全黑/变暗（gate_r3、wall_post、hangar_top 的根因）
const FRESH = arg('fresh', '') === '1';
let page;
const t0 = Date.now(); const logs = [];
async function openPage() {
page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('console', (m) => { logs.push(m.type() + ': ' + m.text()); if (m.text().startsWith('[NB]') || m.type() === 'error') console.log('  ', ((Date.now() - t0) / 1000).toFixed(0) + 's', m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('PAGEERROR: ' + e.message));
page.on('crash', () => console.log('PAGE CRASH'));
}
await openPage();
if (process.env.DIAG) await page.addInitScript(() => {
  const P = WebGL2RenderingContext.prototype; let links = 0, draws = 0, t0 = performance.now(), maxT = 0;
  const wrap = (n, f) => { const o = P[n]; P[n] = function (...a) { const t = performance.now(); const r = o.apply(this, a); const d = performance.now() - t; f(d, a); return r; }; };
  wrap('linkProgram', () => { links++; });
  wrap('getProgramParameter', (d) => { if (d > 500) console.log('[NB] slow getProgramParameter', d.toFixed(0), 'links', links); });
  for (const n of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) wrap(n, (d, a) => { draws++; if (d > maxT) maxT = d; if (d > 1000) console.log('[NB] slow', n, d.toFixed(0), 'count', a[1]); if (draws % 200 === 0) console.log('[NB] draws', draws, 'links', links, ((performance.now() - t0) / 1000).toFixed(0) + 's'); });
  wrap('texImage2D', (d, a) => { if (d > 1000) console.log('[NB] slow texImage2D', d.toFixed(0)); });
});
const urlOf = (s) => `http://localhost:${port}/?shot=${s}&q=${arg('q', 'high')}&frames=${arg('frames', 8)}${arg('hud', '') ? '&hud=1' : ''}${arg('tod', '') ? '&tod=' + arg('tod', '') : ''}${arg('extra', '')}`;
await page.goto(urlOf(shots[0]));
let needFresh = false;
for (let i = 0, first = 0; i < shots.length; i++) {
  const s = shots[i]; const ts = Date.now();
  try {
  if (i > 0 && (needFresh || FRESH || /_top$/.test(s) || /_top$/.test(shots[i - 1]))) { await page.close().catch(() => {}); await openPage(); await page.goto(urlOf(s)); first = i; needFresh = false; console.log('  fresh page for', s); }
  else if (i > 0) await page.evaluate((n) => window.__setShot(n), s);
  try { await page.waitForFunction(() => window.__READY__ === true, null, { timeout: +arg('timeout', 900000), polling: 1000 }); } catch (e) { console.log('TIMEOUT', s); }
  if (i === first) { // R3 批次6：首张等资源全部加载完（manager 无挂起、贴图/模型回调结束）再整套重拍一次——首张曾在资源未齐时出「空世界」
    let calm = 0; const tw = Date.now();
    while (calm < 3 && Date.now() - tw < 600000) { const st = await page.evaluate(() => window.__LOADSTATE__?.() ?? { pending: 0, timeouts: [] }).catch(() => ({ pending: 0, timeouts: [] })); calm = st.pending <= 0 ? calm + 1 : 0; if (st.timeouts.length) console.log('  model timeouts', st.timeouts.join(',')); await new Promise((r) => setTimeout(r, 1000)); }
    console.log('  loaded, warm re-shot', ((Date.now() - tw) / 1000).toFixed(0) + 's');
    await page.evaluate((n) => window.__setShot(n), s);
    try { await page.waitForFunction(() => window.__READY__ === true, null, { timeout: +arg('timeout', 900000), polling: 1000 }); } catch (e) { console.log('TIMEOUT(warm)', s); }
  }
  const info = await page.evaluate(() => window.__SHOT_INFO__?.()).catch(() => null);
  if (process.env.DIAG) console.log('DRAWN', await page.evaluate(() => [...(window.__DRAWN__ ?? [])].join(',')).catch(() => '?'));
  // 批次29：安检大厅 page.screenshot 在 SwiftShader 下等合成器 flush 卡死（8 帧 556 s 渲完后挂到超时）。
  // 默认改为 READY 后 gl.finish() + 直接从 canvas toDataURL 取图（shot 模式 renderer 已开 preserveDrawingBuffer），不经合成器；
  // --hud 1（需要 HTML 叠层）或取图失败时才回退 page.screenshot。
  let grabbed = false;
  if (!arg('hud', '') && arg('grab', 'canvas') === 'canvas') {
    try {
      const durl = await Promise.race([
        page.evaluate(() => { const c = document.getElementById('c'); const gl = c.getContext('webgl2') || c.getContext('webgl'); gl?.finish(); return c.toDataURL('image/png'); }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('grab timeout')), +arg('gtimeout', 240000))),
      ]);
      if (typeof durl === 'string' && durl.startsWith('data:image/png;base64,') && durl.length > 5000) { fs.writeFileSync(path.join(out, `${s}.png`), Buffer.from(durl.slice(22), 'base64')); grabbed = true; console.log('  canvas grab ok', s); }
      else console.log('  canvas grab empty', s);
    } catch (e) { console.log('  canvas grab fail', s, String(e.message).slice(0, 80)); }
  }
  if (!grabbed) { try { await page.screenshot({ path: path.join(out, `${s}.png`), timeout: +arg('stimeout', 300000) }); } catch (e) { console.log('shot fail', e.message.slice(0, 80)); continue; } }
  console.log(s, ((Date.now() - ts) / 1000).toFixed(0) + 's', JSON.stringify(info));
  } catch (e) { console.log('SHOT ERROR', s, String(e.message).slice(0, 120)); needFresh = true; } // 页面崩溃（OOM）不终止整批，下一机位新开页面
}
await browser.close(); srv.close();
