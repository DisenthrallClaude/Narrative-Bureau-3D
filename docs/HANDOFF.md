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
