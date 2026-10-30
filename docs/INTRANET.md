# 局内网（游戏内电脑的「自己做的网站」）· intranet 分支

用户要求：游戏里的电脑要有自己制作的网站。本分支做了一套 1960–80 年代机关终端风格的「叙事管理局 局内网」：
2D 覆盖层（玩家对办公区终端按 E 打开，Esc 关闭，期间锁定移动）+ 所有显示器屏幕上的局内网静态画面（CanvasTexture）。

## 文件（全部新增，除 main.js 3 行挂接外不改现有文件）
| 文件 | 内容 |
|---|---|
| `src/ui/intranet/index.js` | `buildIntranet(scene, world, ctx)`：在世界碰撞 build 之前放终端模型（CRT + 键盘 + 秘书台 L 形小桌）、登记小桌碰撞、注册截图机位 `net_<id>` / `net_<id>_w`；`setupIntranet(G, UI)`：给场景里每台显示器（`props:monitor` 屏幕贴花、`props:r2/crt_computer_monitor` 玻璃）按实例算屏幕面并贴局内网画面，指挥中心席位中屏叠一层，挂 E 交互热点，建覆盖层 DOM、键盘处理 |
| `src/ui/intranet/stations.js` | 终端点位（纯数据，游戏与检查工具共用）。10 台：法务处、联络处、医务诊室、档案馆还档分拣台、局长室秘书台（新加 L 形小桌）、宣传处运营组（已有显示器）、机要室密电终端（已有）、指挥中心席位 A-04（程序化三联屏中屏）、B2 观察间监看台（已有 CRT）、B5 深库值守台（已有） |
| `src/ui/intranet/data.js` | 局内网文案：公告、通讯录、8 封内部邮件、叙事异常登记簿、各处室专页数据。数字全部取自 STORY.md「数字统一」与 manifest |
| `src/ui/intranet/pages.js` | 覆盖层页面 HTML：门户首页 / 人员档案检索（20 份公开档案 + 2 名高危通缉，用 content 里的角色档案图）/ 内部邮件 / 异常登记簿 / 本处专页；剧情原文运行时取 `content.doc(id)` |
| `src/ui/intranet/screen.js` | 屏幕纹理：同一配色字体把「本处专页」画到 Canvas（扫描线 + 暗角） |
| `src/ui/intranet/intranet.css` | 覆盖层样式：铸铁机壳 + 铜铭牌 + 深墨绿荧光屏；宋体 Black 标题 / 思源宋体正文 / IBM Plex Mono 数据 |
| `public/fonts/mono-regular.woff2`、`mono-medium.woff2` | IBM Plex Mono（SIL OFL 1.1，Google Fonts 拉丁子集）；index.js 用 FontFace 注册为 `NB Mono` |
| `tools/intranet_check.mjs` | 新增终端并入所在区 R3 规划 → `r3plan_draw.py` 查 穿模/悬空/越界/占道/穿墙，另查桌面层重叠。俯视图 `screenshots/intranet/plan_<id>.png` |
| `tools/intranet_shot.mjs` | 截图：每个终端新开页面，近景/中景 + 覆盖层逐页 |

## 交互
- 准星对准终端屏幕 2.6 m 内：提示「按 E 登录局内网终端 · <席位>」。E 打开 → `UI.ui.state = 'intranet'`（主循环只在 `play` 下移动/交互，所以移动、E、Tab、R 全部停止），并 `exitPointerLock` 让鼠标可点。
- 覆盖层内：F1–F5 / 数字 1–5 切页，鼠标点击；人员档案输入框回车检索；邮件 ↑↓ 切换；Esc 先退出详情页，再退出登录（退出时 `requestPointerLock`，失败则点画面即可回到游戏）。
- 覆盖层打开时在 window capture 阶段 `stopImmediatePropagation` 吞掉 keydown，main.js 的按键逻辑不会触发；keyup 不拦（避免按住的移动键卡住）。
- 不设置任何剧情旗标（不会替玩家完成 `read:doc_*` 目标）。唯一按剧情变化的是首页「今日报到」一行（领证 `q1_badge` 后显示「姓名：——（人工处理中）」）。
- 调试：`?intranet=<终端id>[/<页>]` 启动即打开；`window.__INTRANET__.open(id, tab)` / `.go(tab, view)` / `.screens()`。

## 内容与世界观（不新增矛盾设定）
- 公告：117 号通知（原文）、报到须知、口径手册第 4 章、通缉公告、冀-03 封锁调度、工会/食堂。今日态势：97.3% / 37（良 · 二级）/ 99.98% / 全国 96.8% / 距 2027 高考 222 天。
- 邮件 8 封全部呼应已有钩子：人事处开户（姓名写入失败）、方妍解除【画押】合同、叶寻答周闻（2023-06-08 那一格本来就是空的）、灰塔来电（齐凌云：是我们的人）、通州通稿（他们还在第三遍）、苏予（新同事测不出理智值是正常的）、后勤处「柒」字书签、03:07 无发件人的「第七排」（K 的手写扫描件，呼应借阅登记簿与 B1 第七排）。
- 人员档案检索：搜 07-0-0000 / XS-2026-1029-07 →「电子档案系统中无此档号」；搜「留白」→ 0 条结果（该检索词已记录）；搜「K」「第七局」→「请参见 4.4」；萧难档案「暂停调阅」。
- 异常登记簿：03:07 心跳样波动 37 秒 / 38 秒「已自动消除 · 按惯例不上报」、通州重复路段、TRN-2026-1028-03 路牌、冀-03、粤-12、朝阳-001、SEC-2026-0417、LIA-2026-0919、VLT-INC-2025-0611。
- 新增的小设定（无冲突、可删）：通讯录分机号、借阅记录里两条齐仇/周也的档号、法务处两条解除登记号、审讯笔录编号、通稿稿号。

## 合并到 main 时需要改动的现有文件
1. `src/main.js`（+3 行）：`import { buildIntranet, setupIntranet } from './ui/intranet/index.js';`；`await buildR3(ctx, world, ctx._r3mat, true);` 之后 `await buildIntranet(scene, world, ctx);`（必须在 `world.build()` 之前，小桌碰撞才生效）；`setupStory(G);` 之后 `setupIntranet(G, UI);`。
2. `public/fonts/*.woff2`（6 个中文子集）：本分支用 `tools/subset_fonts.py` 重新生成以收录局内网新字。**合并时不要手工解决二进制冲突**，任取一边后重跑 `python3 tools/subset_fonts.py`（或 `bash tools/build.sh`）。
3. 无其它现有文件改动。`r3plan.js` 未改：新增终端不进 PLANS，由 `intranet_check.mjs` 单独并入检查；若 main 之后改了这些桌面（法务 K1 东列桌 −18.04,−105.75；联络处翻译组 6.20,−107.34；医务诊室 7.60,−107.60；档案馆还档分拣台 −23.20,−47.60；局长室秘书台 −6.00,−95.60），合并后重跑 `node tools/intranet_check.mjs` 确认 0 错误。
