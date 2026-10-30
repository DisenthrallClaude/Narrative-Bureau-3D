// 剧情自动化走查：node tools/walk.mjs [--out docs/WALKTHROUGH.md]
// 通过 ?test=1 暴露的 window.__NB__（传送 / 触发热点 / 读旗标）+ __NB_AUTO__（对话自动选项、阅读器自动翻页）
// 链路：第一章（服务台→7 号扫描门→叶寻领档案→读完三页→登记簿→B1 第 7 排密集架）→ 缝隙进装订线 → 回写台三结局（A/B/C）→ 结局 C 回到开场
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve('dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg' };
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const port = srv.address().port;
const exe = process.env.CHROME || '/workspace/work/tools/pw-browsers/chromium_headless_shell-1148/chrome-linux/headless_shell';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
const errors = [], report = []; const t0 = Date.now();
const T = () => ((Date.now() - t0) / 1000).toFixed(0) + 's';
const log = (s) => { console.log(T(), s); report.push(`- \`${T()}\` ${s}`); };
page.on('console', (m) => { if (m.type() === 'error' && !/A user gesture is required to request Pointer Lock/.test(m.text())) { errors.push(m.text().slice(0, 300)); console.log('  CONSOLE ERROR', m.text().slice(0, 200)); } });
// 批次17：无头 runner 没有用户手势，requestPointerLock 必然抛这一条——只屏蔽这一条环境错误（记为 envSkipped，不计入控制台错误）
const ENV_IGNORE = /A user gesture is required to request Pointer Lock/; let envSkipped = 0;
page.on('pageerror', (e) => { if (ENV_IGNORE.test(e.message)) { envSkipped++; return; } errors.push('PAGEERROR ' + e.message.slice(0, 300)); console.log('  PAGEERROR', e.message.slice(0, 200)); });
page.on('requestfailed', (r) => { if (!/\.(mp3|ogg|wav|m4a)$/.test(r.url())) errors.push('REQFAIL ' + r.url()); });
await page.goto(`http://localhost:${port}/?test=1&q=low`);
await page.waitForFunction(() => window.__NB_READY__ === true, null, { timeout: 600000, polling: 1000 });
log('游戏加载完成（test 模式）');
const ev = (fn, a) => page.evaluate(fn, a);
const flags = () => ev(() => window.__NB__.flags());
const has = async (f) => (await flags()).includes(f);
const choose = (...c) => ev((c) => { window.__NB_AUTO__.choices = c; }, c);
const use = async (id) => { try { await ev((id) => window.__NB__.use(id), id); return true; } catch (e) { log(`❌ 触发 ${id} 失败：${e.message.split('\n')[0]}`); return false; } };
const tp = (x, y, z, yaw = 0) => ev(([x, y, z, yaw]) => window.__NB__.tp(x, y, z, yaw), [x, y, z, yaw]);
const zone = () => ev(() => window.__NB__.G.zone);
const waitFlag = async (f, ms = 90000) => { const s = Date.now(); while (Date.now() - s < ms) { if (await has(f)) return true; await page.waitForTimeout(1000); } return false; };
const check = (ok, s) => log((ok ? '✅ ' : '❌ ') + s);
const objective = () => ev(() => { const o = window.__NB__.content.objectives(); return o?.main?.text ?? o?.main?.id ?? JSON.stringify(o).slice(0, 80); });
const Y = 1.8;
let pass = 0, fail = 0; const ok = (c, s) => { c ? pass++ : fail++; check(c, s); };

// ===== 第一章 =====
log('—— 第一章「报到」——'); log('目标栏：' + await objective());
await tp(0, 0.05, 60); await page.waitForTimeout(1500); ok((await zone()) === 'plaza', '出生在广场 zone=' + await zone());
await tp(7.5, Y + 0.05, -17, -Math.PI / 2); await page.waitForTimeout(1500); ok((await zone()) === 'gate', '进入正门 zone=' + await zone());
await use('int_gate_desk'); ok(await has('q1_badge') && (await ev(() => window.__NB__.items())).includes('item_badge'), '服务台领临时入职证 q1_badge + item_badge');
log('目标栏：' + await objective());
const lane7 = await ev(() => window.__NB__.G.ctx.lanes[6]);
await tp(lane7, Y + 0.05, -36, Math.PI); await page.waitForTimeout(1500);
await tp(lane7, Y + 0.05, -43.2, Math.PI); log('站上 7 号扫描门（x=' + lane7.toFixed(2) + '），等待扫描事件与殷泽对话……');
ok(await waitFlag('q2_scan', 120000), '7 号扫描门异常 → 殷泽放行 q2_scan');
log('目标栏：' + await objective());
await tp(-30, Y + 0.05, -50, Math.PI / 2); await page.waitForTimeout(1500); ok((await zone()) === 'archive', '进入人事档案馆 zone=' + await zone());
await use('int_archive_yexun'); await page.waitForTimeout(500);
ok(await has('q3_file'), '叶寻领档案 q3_file');
ok(await has('q4_read_1') && await has('q4_read_2') && await has('q4_read_3'), '读完档案三页 q4_read_1..3');
await use('int_archive_logbook'); log('登记簿已签字；目标栏：' + await objective());
const cp = await ev(() => { const p = window.__NB__.G.ctx.compactPanel.getWorldPosition(new (window.__NB__.G.camera.position.constructor)()); return [p.x, p.y, p.z]; });
await tp(cp[0] + 1.2, (await ev(() => window.__NB__.G.ctx.b1Y ?? -4.2)) + 0.05, cp[2], -Math.PI / 2); await page.waitForTimeout(1500); log('B1 密集库 zone=' + await zone());
await choose('A'); await use('int_archive_compactor'); ok(!(await has('q5_b1')), '拨错档号（A）→ 密集架合拢，不推进');
await choose('B'); await use('int_archive_compactor'); ok(await waitFlag('q5_b1', 60000), '拨对 07-0-0000 → 第 7 排缝隙打开 q5_b1（第一章完）');
ok(await ev(() => !!window.__NB__.G.ctx.seam.visible), '缝隙可见');

// ===== 装订线 =====
log('—— B1 第 7 排缝隙 → 装订线 ——');
ok(await ev(() => window.__NB__.spot('depth_b1_seam')?.enabled?.() ?? false), '缝隙热点已启用');
await use('depth_b1_seam'); await page.waitForTimeout(3000);
let z = await zone(); ok(z === 'seventh_entry', '进入装订线入口 zone=' + z);
for (const [nm, p] of [['seventh_gutter', [7.3, -499.95, -80]], ['seventh_ops', [0, -499.95, -120]], ['seventh_wrap', [0, -499.95, -140]], ['seventh_rewrite', [0, -499.95, -166]]]) { await tp(...p, Math.PI); await page.waitForTimeout(1200); const zz = await zone(); const py = await ev(() => window.__NB__.player.pos.y); ok(zz === nm && py > -501 && py < -498, `走到 ${nm}（zone=${zz}，脚底 y=${py.toFixed(2)} 未掉出地面）`); }

// ===== 三结局 =====
const endings = [['A', 'end_a_name'], ['B', 'end_b_seal'], ['C', 'end_c_close']];
for (const [c, id] of endings) {
  await tp(0, -499.95, -170, Math.PI); await page.waitForTimeout(1000);
  await choose(c); await use('int_rewrite_choice');
  const f = await has('ending:' + id); const pos = await ev(() => { const p = window.__NB__.player.pos; return [p.x, p.y, p.z]; }); const zz = await zone();
  ok(f && zz === 'plaza' && Math.abs(pos[2] - 72) < 2, `结局 ${c}（${id}）：旗标 ${f ? '已置' : '缺失'}，回到 ${zz} (${pos.map((v) => v.toFixed(1)).join(', ')})`);
}
const auto = await ev(() => window.__NB_AUTO__.log.slice(-6));
ok(auto.some((l) => l.includes('阅读')), '结局 C 后重新弹出开场手机消息（回到开场）：' + auto.filter((l) => l.includes('阅读') || l.includes('章节卡')).slice(-2).join(' | '));

// ===== 其它入口抽查 =====
log('—— 入口抽查 ——');
for (const id of ['depth_b6_door', 'depth_b5_door', 'depth_director_book', 'depth_core_seam', 'depth_seventh_exit', 'depth_return']) ok(await ev((id) => !!window.__NB__.spot(id), id), `热点存在：${id}`);
await use('depth_director_book'); await page.waitForTimeout(3500); z = await zone(); ok(z === 'seventh_entry', '局长室无名书 → 装订线入口 zone=' + z);
await use('depth_seventh_exit'); await page.waitForTimeout(3500); z = await zone(); ok(z === 'archive_b1' || z === 'archive', '装订线白缝 → 回 B1 zone=' + z);
await use('depth_b5_door'); await page.waitForTimeout(3500); z = await zone(); ok(z?.startsWith('abyss'), 'B5 后门 → 墨渊 zone=' + z);
await use('depth_core_seam'); await page.waitForTimeout(3500); z = await zone(); ok(z?.startsWith('seventh'), '定稿厅红缝 → 装订线 zone=' + z);
await use('depth_return'); await page.waitForTimeout(3500); z = await zone(); ok(z === 'training', '墨渊金门 → 回 B6 zone=' + z);

log(`—— 结果：通过 ${pass}，失败 ${fail}；控制台错误 ${errors.length}（已屏蔽无头 Pointer Lock 环境报错 ${envSkipped} 条）——`);
for (const e of [...new Set(errors)].slice(0, 30)) report.push('  - ERR ' + e);
const out = arg('out', 'docs/WALKTHROUGH.md');
fs.writeFileSync(out, `# 剧情自动化走查（tools/walk.mjs）\n\n运行时间：${new Date().toISOString()}　通过 ${pass} / 失败 ${fail} / 控制台错误 ${errors.length}（已屏蔽无头 Pointer Lock 环境报错 ${envSkipped} 条）\n\n${report.join('\n')}\n`);
await browser.close(); srv.close();
process.exit(fail ? 1 : 0);
