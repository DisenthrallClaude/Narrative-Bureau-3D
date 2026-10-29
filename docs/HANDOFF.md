# HANDOFF · R3 全区域重建（r3-lead，接手 2026-10-29 23:06 CST）
崩溃后接续：从「R3 进度」最后一条往下做。R2 记录在下面保留。

## R3 规则（用户 23:08 新反馈，务必遵守）
每个区**先做平面功能规划**（动线、门窗、工位/柜体朝向、靠墙对齐、成组成排、真实间距和尺度），写进下面「每区布局说明」，再按规划摆放；禁止随机散布、悬空、穿模、朝向乱。截图时附俯视布局图。
- 规划代码：`src/world/r3plan.js`（纯数据，`R3` 开关表 + `PLANS`），实例化 `src/world/r3build.js`（dressing.js 末尾调用）。开了 R3 的区，旧的随意摆件在 upper.js / dressing.js 里用 `if (!R3.<区>)` 关掉；**剧情锚点一律不动**（在规划里登记为 `fixed` 参与检查）。
- 模型朝向：所有入选模型「正面/使用侧 = +Z」已逐个核对（Blender 正视+俯视接触表 `work/r3/orient_sheet_0/1/2.png`，脚本 `work/r3/orient.py`）。桌子使用侧 = 人坐一侧；椅子 yaw = 桌 yaw + π。新加模型先进接触表再用。
- 检查：`node tools/r3plan_dump.mjs <planId> <y> > plan.json`（按目标尺寸算真实包围盒）→ `python3 tools/r3plan_draw.py plan.json plan.png`：画俯视布局图（门窗、通道、锚点、朝向箭头）并检查 穿模/悬空/越界/占通道，有错误退出码 1。**0 错误才允许构建。**
- 俯视实拍：shots.js 里 `*_top` 机位带 `clipY`（main.js applyShot 用全局裁剪面切掉顶棚）。
- 模型：R3 313 个已在本地 assets/sourced（不用再从 Drive 下）；325 个未处理的源模型分 5 片在 zz/aa/bb/cc/dd 并行跑 tools/models_all.mjs（每台约 6 分钟），回收后合并进 public/assets/models/r2（catalog 671 项；5 个同名冲突加了 _后缀 6 位，如 banker_lamp_a71cef）。旧管线 legacy 名（office_desk / file_cabinet 等）在根目录 models/ 下，路径不带 r2/。
- 云电脑：`work/r3/ib.py <机> '<命令>'`（paramiko，stdin→远端；PYTHONPATH=/workspace/work/pylib）；`work/r3/push_new.sh <机>` 增量推新构建；`work/r3/rshot.sh <机> 机位,...` 后台截图（/usr/bin/chromium + SwiftShader，4 核下 1600×900 high 每张 5–70 s，比本机快 5–10 倍）；`work/r3/rpull.sh <机> <目录>` 取回。ssh 令牌缓存在 work/r3/.ibtok_*.json（6 h），用完 `tools/instabox ssh-token --revoke` 或等过期。
- 不要用含路径/文件名的 `pkill -f`/`pgrep -f`：会把自己的 shell 杀掉（本轮踩了两次）。

## R3 每区布局说明
### 3F 西 · 政策研究室 / 法务处（floor3_office，y=15.8，x −27.85…−9.9，z −119.8…−92.2，层高 5.4）
- 门：东墙 z −99…−96（来自医务室/电梯厅）；窗：西墙 z −95/−100/−105/−110/−115（宽 1.6）。锚点：西墙白板 z −112、东墙法务处铜牌 z −100.5。
- 动线：门 → 主通道（z −98.6…−96.6，东西向贯通）→ 两条南北通道（x −22…−20.4、−16.4…−14.8）→ 岛间通道（z −105…−103.6）→ 会议区北通道（z −110.5…−108.6）→ 档案墙取档带。
- ① 工位：3 列 × 2 排 K2 四人岛 = 24 席。金属办公桌按桌面 0.76 m 等比（1.93×0.91 m），两桌并排、两排背靠背，中间 0.4 m 绿色隔板；人面朝南北（侧对西窗，不背光不逆光）。每桌：左后台灯、右后电话（三款轮换）、文件盘/文件夹轮换、每 3 桌 1 台打字机、一半桌有杯子、右脚纸篓；每 4 席 1 个空位（椅子拉出斜放）。每岛上方 2 盏链吊灯（灯底 2.6 m，黑铁吊杆到顶）。
- ② 会议区：3.6×1.2 m 长桌垂直于西墙白板，两侧各 4 椅，白板端留 2.2 m 讲解空间。
- ③ 科长位（东北）：写字台背靠档案墙、面向全屋和门，2 把客椅。
- ④ 北墙档案墙：4 抽文件柜成排贴墙（正面朝南），中间 1 组书柜，柜顶档案盒成组 + 1 盆绿萝；柜前 1.5 m 取档带。
- ⑤ 东墙：门北侧复印机 + 纸箱；门南侧衣帽架、配电箱、灭火器（距门 0.5 m）、出口标识（门顶）。K3：西窗下暖气片 ×4、南墙挂钟、对角 2 个监控、顶棚烟感 6 个。K4 保洁角（西南角）；K5 待归档纸箱 + 搬运车（南墙西段）。
- 检查：277 件，穿模/悬空/越界/占道 0。
### 2F 东 · 国际联络处（floor2_liaison，y=8.8，x 0.32…27.85，z −117.55…−92.2，层高 6）
- 开口：南面电梯厅 x 0.3…9.4；西墙 z −99…−96 通宣传处。窗：东墙 5 扇（窗间是原有书架）。锚点：北墙势力评估墙 13 框、西墙世界钟 4 面 + 势力地图 + 简介牌、会客茶几来电便签、渡鸦标本台、保险柜玻璃罩、礼宾旗——全部原位保留。
- 动线：入口通道（x 1.5…8.5）→ 会客区；主通道 x 15…19.4 南北贯通；会商台前通道 z −112.6…−111.2。
- ① 会客区：茶几（锚点）北侧三人沙发朝南，南侧两把扶手椅朝北微内收，沙发两端边几 + 台灯，原海军蓝地毯。
- ② 联络官席：两张写字台背靠东窗间书架、面朝入口，每席 1 把客椅（面朝联络官）。
- ③ 评估会商台：4.4 m 长桌平行于北墙评估墙，5 把椅子只放南侧（人面朝评估墙），桌上文件 + 地球仪。原来挡住评估墙下排的 4 个文件柜已撤。
- ④ 西墙世界钟下长边台；南墙东段档案柜 ×6 + 书柜（正面朝北）。K3：东窗下暖气片 ×5、配电箱、监控、烟感 9 个、灭火器；入口衣帽架；绿植 2 盆（角落）。
- 检查：70 件（含 8 个固定锚点），0 错误。

## R3 进度
- [23:06] 接手，读 HANDOFF/PLACEMENT/IMAGE-PLAN/INSTABOX；[23:08] 收到「先平面规划再摆」新规则。
- [23:40] 325 个源模型在 5 台云电脑并行处理完并合并（catalog 367→671）。
- [23:55] 模型朝向接触表 90 个；r3plan/r3build/dump/draw 工具链完成。
- [00:30] 3F 西办公区、2F 联络处 规划 0 错误，构建、云电脑截图。


---
# HANDOFF · R2 美术重建（blender-lead-2，接手 2026-10-29 19:08 CST）
崩溃后接续：从「R2 当前进度」最后一条往下做。旧 M7 交接记录保留在文末。

## R2 任务（本轮只做样板 A/B）
1. 样板 A：主楼外观+广场，远/中/近 3 机位（plaza_aerial / plaza / facade）
2. 样板 B：安检大厅 4 机位（hall / hall_gates / hall_vault / hall_aisle）
3. three 接入：buildHall 用 hero_hall.glb（光照贴图 WebP + 反射探针 hall_probe.hdr + 削减实时灯）
4. 截图 1600×900 → screenshots/r2/，旧版对比拼图（m6/、m4b/）；commit+push；Drive 快照
下一轮：铺开到其他区域、IMAGE-USAGE 生图落位、全部网上模型落位、Credits 页、极致画质档

## 环境要点（务必看）
- 机器 2 核 / 7 GB、无 swap：**Blender 烘焙与 SwiftShader 截图不能同时跑**（19:3x 实测 OOM 杀掉了 hall 烘焙）。所有重任务串行。
- 沙箱会重启：/tmp 会被清空 → 临时文件放 P/work/r2/tmp；OpenCV 装在 /workspace/work/pylib（PYTHONPATH）。
- 此 arm64 Blender 4.3 **没有 OIDN**：离线渲染不开去噪，渲完用 tools/denoise.py（OpenCV NLM）。
- 「SwiftShader 截图不出帧」不是死锁：首帧要编译 ~80 个着色器程序（每个 ~4.5 s）+ 3000 drawcall / 850 万三角面。legacy 低画质 960×540 实测 462 s 出图。之前 25 分钟无帧是因为与 Blender 烘焙抢 CPU/内存。
  调试：`DIAG=1 node tools/shot.mjs ...` 会打印 draws/links 进度；frame 日志不再被过滤。同一会话多机位（逗号分隔）可复用已编译程序。
- 杀进程别用含路径的 pgrep 模式（命令行里有同样字符串会把自己的 shell 杀掉）。

## R2 当前进度
- [19:30] 二分结论见上；facade/plaza 已按「碰撞体不遮光」重烘 AO（facade 2.58M 三角，meshopt 后 45 MB；plaza 2.4 MB）→ public/assets/hero/
- [19:45] 新增 tools/blender/pbr.py（按材质名接 Poly Haven/ambientCG 实拍贴图 + 色差/雨痕/AO 污垢层 + 按角度平滑修黑面）、apply_pbr.py、render_views.py（Cycles 样板渲染）、tools/denoise.py
- [19:45] three：hero.js hallMats()（与 pbr.py 同贴图同色调）、placeHero lmInPlace；interiors.js buildHall 在 HERO_HALL 下建筑/固定陈设改走 bA 丢弃批次 + heroHall()；reflect.js patch 串联；main.js 大厅探针 hall_probe.hdr、精修地面平面反射；shots.js 加 hall_aisle
- [20:07] 拱廊墙 t 1.2→0.9（墙面在束柱细柱间露出成黑条）；Cycles 实测 ~7 万采样/秒 → 4096/64spp 要 2 小时，改 2048/24spp（探针 768×384/24spp）重烘中；tools/bake_hall.sh 一键烘焙+转 WebP+探针+meshopt；tools/shot_r2.sh A|B 截图会话；tools/r2_compare.py 拼图
- [20:44 接手 blender-lead-3] save.sh → e5b47c8 推送 + Drive 快照（1AxRm2Q4…，468 MB）。旧 r2/hall.png「只有地面」不是代码版本问题：低画质完整显示，**ultra/high 才不出**。
- [21:25] 根因定位：shadowsLocal（16 盏投影聚光灯）开启时 hero 大厅材质在 SwiftShader 下整体不出图（无 shader 报错），?qo=shadowsLocal=false 即完整显示。修复第1版（只关 security_hall 组内聚光）无效——大厅自身投影聚光在 HERO 下已去掉，16 盏来自同屏相邻分区；第2版 main.js spotShadows()：凡 hero 大厅可见的分区（VIS[z].security_hall）全局关局部聚光投影，setZone/applyQuality 都调用。探针确认大厅可见时投影聚光 0 盏。renderer.js 新增调试参数 ?qo=key=val,...（覆盖画质档开关）。
- 下一步：hall 光照贴图烘焙（apply_pbr + bake_lm，4096/64spp）→ lm 转 WebP、probe → public/assets/hdri/hall_probe.hdr、GLB meshopt → 构建 → A 截图会话 → B 截图会话 → Cycles 样板 → 拼图 → 提交


---
# HANDOFF · build-lead-6（接手 2026-10-29 06:30 CST）
崩溃后接续：从「当前进度」最后一条往下做。

## 任务顺序
1. 未提交改动构建+save+Pages 检查
2. 宿舍改造（地面哑光、金属上下铺+床品、家具）
3. playwright 走查 tools/walk.mjs → docs/WALKTHROUGH.md
4. 复拍 screenshots/m7/（两批×4）
5. docs/PERF.md

## 当前进度
- [06:30] 接手，读完简报；未提交改动 = 字体子集、hall_board 机位、盆栽叶片、外立面窗深、桥合并、海报外移。
- [06:33] 步骤1完成：a0f3b73 推送，Pages success，Drive 快照已更新（注：sandbox 缺 brotli，已 pip install brotli）
- [06:55] 宿舍改造代码完成（src/world/dorm.js 新建；surface.js 勒脚改环形——金色镜面根因是 annex 实心 0.5m Marble016 石台盖住地坪；dorm envI 0.22）；正在拍 m7 dorm_* 4 张
- [07:20] 宿舍第二轮：外墙内衬、207 加室友空铺/书架/暖气片/地毯/衣钩、101 晾衣绳+补光；已 build；下一步复拍 dorm 4 张
- 技巧：长命令后台用 `( setsid nohup bash tools/shotq.sh ... > /tmp/x.log 2>&1 < /dev/null & )`，再 sleep 轮询日志；普通 nohup & 会在 shell 超时时被杀。1280×720 medium 每张约 100–330 s。
- [07:45] 宿舍完成（m7/dorm_lobby, dorm_room, dorm_101b, dorm_207）。下一步：walk.mjs 走查
- [08:05] 走查第1轮 23/8：根因 physics.js y<-60 一律重生到广场 → 墨渊(-300)/装订线(-500) 进不去；已修（深区带例外）。test 模式改为不预编译不渲染（加载 60s）。重跑中
- [08:25] 走查 31/0 通过，WALKTHROUGH.md 已写。下一步：m7 复拍第1批 abyss_core,abyss_tide,seventh_gutter,seventh_rewrite
- [08:50] m7 第1批完成（abyss_core OK、seventh_rewrite OK、seventh_gutter 斑马条纹已改、abyss_tide 潮面白片已改待复拍）；第2批 library,director,metro,hangar 拍摄中
- [09:15] 第2批完成：library/director 良好；metro 地面略泛光、入口亭灰盒；hangar 灰盒偏重(WIP)。复拍 abyss_tide,seventh_gutter 中
- [09:40] seventh_gutter 斑马条纹已修；abyss_tide 潮面改 Lambert 复拍中；下一步 perf.mjs → PERF.md
- [09:50] abyss_tide 白片已消（潮面全黑，细节不足→WIP）。perf.mjs 全机位采样中 → docs/perf.json
- [10:30] PERF：zonestat.mjs（test 模式静态统计）完成 before；GLB 二次减面 17 个（tools/decimate_m7.sh，备份 P/work/models_pre_m7）、教堂 357k→32k（decimate_soup.mjs）、阳光时室内组不投影。正在跑 after 统计；之后写 PERF.md、复走查、save
