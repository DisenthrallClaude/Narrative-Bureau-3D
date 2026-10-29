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
