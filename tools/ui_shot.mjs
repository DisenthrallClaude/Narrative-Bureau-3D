// 批次46：UI 截图（加载画面 / 主菜单 / HUD+交互提示 / 文档阅读 / 暂停）。不渲 3D：canvas 隐藏，HUD 叠在 tools/ui_bg.jpg 静帧上。
// node tools/ui_shot.mjs <输出目录> [all|loading,menu,hud,reader,pause]
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve('dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const out = process.argv[2] || 'out/ui'; let states = (process.argv[3] || 'all'); states = states === 'all' ? ['loading', 'menu', 'hud', 'reader', 'pause'] : states.split(',');
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const port = srv.address().port;
const bg = 'data:image/jpeg;base64,' + fs.readFileSync('tools/ui_bg.jpg').toString('base64');
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--disable-gpu'] });
for (const st of states) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  // 阻断 3D：不加载 GLB / HDR，世界构建停在加载画面（只截 HTML）
  await page.route(/\.(glb|hdr|bin)(\?|$)/, (r) => r.abort());
  await page.goto(`http://localhost:${port}/`);
  await page.waitForTimeout(st === 'loading' ? 2500 : 4000);
  await page.evaluate(({ st, bg }) => {
    const $ = (i) => document.getElementById(i);
    document.body.style.background = `#000 url(${bg}) center/cover`; $('c').style.visibility = 'hidden';
    if (st === 'loading') { $('loadbar').style.width = '62%'; $('loadtip').textContent = '正在装订页面……'; return; }
    if (st === 'menu') { $('loadbar').style.width = '100%'; $('loadtip').textContent = '点击「进入」开始（建议佩戴耳机）'; $('start').classList.remove('hidden'); return; }
    $('loading').classList.add('hidden'); $('hud').classList.remove('hidden');
    $('objm').textContent = '前往西翼人事档案馆，向管理员领取本人入职档案'; $('objo').textContent = '';
    if (st === 'hud') { $('prompt').innerHTML = '<b>E</b>查阅 卡片目录柜 · 甲字 07 屉'; $('cross').classList.add('on'); $('arean').textContent = '人事档案馆'; $('areae').textContent = 'PERSONNEL ARCHIVE'; $('area').classList.add('on'); return; }
    if (st === 'reader') { $('reader').classList.remove('hidden'); $('paper').className = 'paper'; $('paper').innerHTML = '<h2>入职登记表 · 第一页</h2><div class="txt">姓名：＿＿＿＿　　编号：NB-0731\n所属：叙事管理局 京城总部 · 监测指挥中心（实习）\n\n凡本局在编人员，所经手之一切文本，须如实登记、逐页装订、按期归档。\n任何未经登记之叙事，视同不存在。\n\n<span class="red">「本条不存在。」</span></div><div class="pg">1 / 3</div>'; return; }
    if (st === 'pause') { $('pause').classList.remove('hidden'); $('qseg').innerHTML = '<span>低</span><span class="on">中</span><span>高</span>'; $('todseg').firstElementChild.classList.add('on'); }
  }, { st, bg });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, `${st}.png`) }); console.log('ui shot', st);
  await page.close();
}
await Promise.race([browser.close().catch(() => {}), new Promise((r) => setTimeout(r, 10000))]); srv.close(); process.exit(0);
