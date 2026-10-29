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
