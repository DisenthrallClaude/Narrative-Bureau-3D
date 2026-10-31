// 批次46：UI 截图（加载画面 / 主菜单 / HUD+交互提示 / 文档阅读 / 暂停）。不渲 3D：canvas 隐藏，HUD 叠在 tools/ui_bg.jpg 静帧上。
// node tools/ui_shot.mjs <输出目录> [all|loading,menu,hud,reader,pause]
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve('dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const out = process.argv[2] || 'out/ui'; let states = (process.argv[3] || 'all'); states = states === 'all' ? ['loading', 'menu', 'hud', 'dialog', 'reader', 'phone', 'reader_dark', 'terminal', 'chapter', 'pause'] : states.split(',');
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const port = srv.address().port;
const bg = 'data:image/jpeg;base64,' + fs.readFileSync('tools/ui_bg.jpg').toString('base64');
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--disable-gpu'] });
for (const st of states) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  // 阻断 3D：不加载 GLB / HDR，世界构建停在加载画面（只截 HTML）
  await page.route(/\.(glb|hdr|bin|js)(\?|$)/, (r) => r.abort()); // 不跑游戏 JS（世界构建会占满主线程，page.screenshot 超时）；CSS 由 index.html <link> 加载
  await page.goto(`http://localhost:${port}/`);
  await page.waitForTimeout(2500);
  await page.evaluate(({ st, bg }) => {
    const $ = (i) => document.getElementById(i);
    const tk = document.getElementById('tk'); if (tk && !tk.childElementCount) for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2, r0 = k % 4 ? 41 : 38; tk.insertAdjacentHTML('beforeend', `<line x1="${Math.sin(a) * r0}" y1="${-Math.cos(a) * r0}" x2="${Math.sin(a) * 45}" y2="${-Math.cos(a) * 45}"/>`); } // 同 ui.js
    document.body.style.background = `#000 url(${bg}) center/cover`; $('obj').classList.add('flash'); $('c').style.visibility = 'hidden';
    if (st === 'loading') { $('loading').classList.add('go'); $('loadbar').style.width = '62%'; $('loadpct').textContent = '62%'; $('gearArc').style.strokeDasharray = '62 100'; $('loadtip').textContent = '正在建造主楼……'; return; } // U2：点开始后的齿轮加载层
    if (st === 'menu') { $('loadbar').style.width = '100%'; if ($('loadpct')) $('loadpct').textContent = '100%'; $('loadtip').textContent = '点击「进入」开始（建议佩戴耳机）'; $('start').classList.remove('hidden'); return; }
    $('loading').classList.add('hidden'); $('hud').classList.remove('hidden');
    $('objm').textContent = '前往西翼人事档案馆，向管理员领取本人入职档案'; $('objo').textContent = '';
    $('inv').innerHTML = ['工作证', '钥匙', '便签'].map((n) => `<div class="it"><div style="font-size:22px;text-align:center;line-height:54px;color:#d8b469">${n[0]}</div><span>${n}</span></div>`).join('');
    if (st === 'dialog') { $('dlg').classList.remove('hidden'); $('dlgwho').textContent = '叶寻 · 档案馆'; $('dlgline').textContent = '你的档案在甲字七号屉。别翻别人的——翻了，也要登记。'; $('dlg').classList.add('in'); return; }
    if (st === 'phone') { $('reader').classList.remove('hidden'); $('paper').className = 'paper phone'; $('paper').innerHTML = '<div class="sb"><span>09:00</span><span class="op">NB · 局内网</span><span class="bt"><i></i><i></i><i></i><i></i></span></div><div class="from"><b class="av">人事</b><div><strong>叙事管理局人事处</strong><em>短信 · 今天 08:12 · NVNTIVS</em></div></div><div class="bub"><h2>报到通知</h2><div class="txt">您好，留白同志：\n\n经审核，您已被录用为叙事管理局京城总部新入职人员。请于二〇二六年十月二十九日上午九时至十一时，前往总部正门服务台报到。\n\n报到须知：\n1. 请携带本通知与本人有效证件。\n2. 入局须经安检大厅文本完整性扫描，请勿携带任何来源不明的纸质物品。\n3. 报到后请前往西翼人事档案馆领取并核对本人入职档案。\n\n欢迎加入。我们制定规则，不是为了折断谁的笔，而是为了不让这人间沦为废稿。\n\n——叙事管理局 人事处\n（本短信由系统自动发送，请勿回复。此号码已于 2023 年 6 月 8 日向您发送过同一条通知。）</div></div><div class="home"></div>'; return; } // U2：同 ui.js renderPage phone 分支
    if (st === 'reader_dark') { $('reader').classList.remove('hidden'); $('paper').className = 'paper dark'; $('paper').innerHTML = '<h2>内部通报 · 第三页</h2><div class="txt">经查，监测指挥中心本周叫号记录中有一条无法归档的条目。\n该条目编号与在编人员重复，来源不明。\n\n请各处室勿私自查阅、勿转述。\n\n<span class="red">「本条不存在。」</span></div><div class="pg">3 / 3</div>'; return; } // 批次48
    if (st === 'terminal') { $('reader').classList.remove('hidden'); $('paper').className = 'paper screen'; $('paper').innerHTML = '<h2>监测终端 · 叫号记录</h2><div class="txt">&gt; QUERY  NB-0731\n&gt; 状态：待报到\n&gt; 所属：京城总部 · 监测指挥中心（实习）\n&gt; 备注：本条不存在。\n&gt; </div><div class="pg">1 / 2</div>'; return; }
    if (st === 'chapter') { $('hud').classList.add('hidden'); if ($('chapi')) { $('chapno').textContent = 'CAPITVLVM I · 第一章'; $('chapi').textContent = '报'; $('chapa').textContent = '到'; } else $('chapa').textContent = '第一章 · 报到'; $('chapb').textContent = '你又一次来报到了。'; $('chapter').style.transition = 'none'; $('chapter').classList.add('on'); return; }
    if (st === 'hud') { $('prompt').innerHTML = '<b class="key">E</b><span class="pt">查阅 卡片目录柜 · 甲字 07 屉</span>'; $('cross').classList.add('on'); $('arean').textContent = '人事档案馆'; $('areae').textContent = 'PERSONNEL ARCHIVE'; $('area').classList.add('on'); return; }
    if (st === 'reader') { $('reader').classList.remove('hidden'); $('paper').className = 'paper'; $('paper').innerHTML = '<h2>入职登记表 · 第一页</h2><div class="txt">姓名：＿＿＿＿　　编号：NB-0731\n所属：叙事管理局 京城总部 · 监测指挥中心（实习）\n\n凡本局在编人员，所经手之一切文本，须如实登记、逐页装订、按期归档。\n任何未经登记之叙事，视同不存在。\n\n<span class="red">「本条不存在。」</span></div><div class="pg">1 / 3</div><div class="seal">叙事管理局<br>档案专用</div>'; return; }
    if (st === 'pause') { $('pause').classList.remove('hidden'); $('qseg').innerHTML = '<span>低</span><span class="on">中</span><span>高</span>'; $('todseg').firstElementChild.classList.add('on'); }
  }, { st, bg });
  await page.waitForTimeout(st === 'chapter' || st === 'loading' || st === 'menu' ? 3200 : 1500); // U1：入场动画最长约 2.9 s
  try { await page.screenshot({ path: path.join(out, `${st}.png`), timeout: 90000 }); console.log('ui shot', st); } catch (e) { console.log('ui shot fail', st, e.message.slice(0, 120)); }
  await page.close();
}
await Promise.race([browser.close().catch(() => {}), new Promise((r) => setTimeout(r, 10000))]); srv.close(); process.exit(0);
