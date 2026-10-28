# 剧情自动化走查（tools/walk.mjs）

## M7 修复记录（build-lead-6，2026-10-29）
- **P0 墨渊 / 装订线一进去就被弹回广场**：`src/engine/physics.js` 坠落重生条件是 `y < −60`，而墨渊地坪 −300、装订线地坪 −500 → 每帧判定为坠落、拉回出生点。改为深区高度带例外；深区内坠落改回各自入口（墨渊折页门 / 装订线页缝入口），不再回广场。
- **P0 定稿厅红缝落点在虚空**：`depth_core_seam` 落点 (0, −499.95, −70) 在弧形回廊地板之外 → 坠落。改为 (1.2, −499.95, −68)。
- **走查脚本自身**：seventh_gutter 取样点改到弧形回廊中线 (7.3, −80)。
- **test 模式提速**：`?test=1` 不再预编译全部着色器、不渲染画面（SwiftShader 下原先加载 >10 分钟），只跑逻辑；加载约 60 s，全程约 200 s。
- 首轮 23 过 / 8 败 → 末轮 **31 过 / 0 败，控制台错误 0**。

运行：`LD_LIBRARY_PATH=/workspace/work/tools/libs/usr/lib/aarch64-linux-gnu node tools/walk.mjs --out docs/WALKTHROUGH.md`（需先 build）

---

运行时间：2026-10-28T23:32:01.729Z　通过 31 / 失败 0 / 控制台错误 0

- `61s` 游戏加载完成（test 模式）
- `61s` —— 第一章「报到」——
- `61s` 目标栏：前往管理局正门报到
- `63s` ✅ 出生在广场 zone=plaza
- `64s` ✅ 进入正门 zone=gate
- `64s` ✅ 服务台领临时入职证 q1_badge + item_badge
- `64s` 目标栏：通过安检大厅第 7 号闸机的文本完整性扫描
- `66s` 站上 7 号扫描门（x=7.50），等待扫描事件与殷泽对话……
- `78s` ✅ 7 号扫描门异常 → 殷泽放行 q2_scan
- `78s` 目标栏：前往西翼人事档案馆，向管理员领取本人入职档案
- `79s` ✅ 进入人事档案馆 zone=archive
- `86s` ✅ 叶寻领档案 q3_file
- `86s` ✅ 读完档案三页 q4_read_1..3
- `86s` 登记簿已签字；目标栏：前往东翼二层监测指挥中心报到实习
- `88s` B1 密集库 zone=archive_b1
- `88s` ✅ 拨错档号（A）→ 密集架合拢，不推进
- `112s` ✅ 拨对 07-0-0000 → 第 7 排缝隙打开 q5_b1（第一章完）
- `112s` ✅ 缝隙可见
- `112s` —— B1 第 7 排缝隙 → 装订线 ——
- `112s` ✅ 缝隙热点已启用
- `117s` ✅ 进入装订线入口 zone=seventh_entry
- `118s` ✅ 走到 seventh_gutter（zone=seventh_gutter，脚底 y=-500.02 未掉出地面）
- `120s` ✅ 走到 seventh_ops（zone=seventh_ops，脚底 y=-500.02 未掉出地面）
- `121s` ✅ 走到 seventh_wrap（zone=seventh_wrap，脚底 y=-500.02 未掉出地面）
- `122s` ✅ 走到 seventh_rewrite（zone=seventh_rewrite，脚底 y=-500.02 未掉出地面）
- `137s` ✅ 结局 A（end_a_name）：旗标 已置，回到 plaza (0.0, -0.0, 72.0)
- `151s` ✅ 结局 B（end_b_seal）：旗标 已置，回到 plaza (0.0, -0.0, 72.0)
- `169s` ✅ 结局 C（end_c_close）：旗标 已置，回到 plaza (0.0, -0.0, 72.0)
- `169s` ✅ 结局 C 后重新弹出开场手机消息（回到开场）：章节卡 结局 C：留白。 / 下一轮报到开始。 | 阅读 1 页：【叙事管理局人事处】报到通知
- `169s` —— 入口抽查 ——
- `169s` ✅ 热点存在：depth_b6_door
- `169s` ✅ 热点存在：depth_b5_door
- `169s` ✅ 热点存在：depth_director_book
- `169s` ✅ 热点存在：depth_core_seam
- `169s` ✅ 热点存在：depth_seventh_exit
- `169s` ✅ 热点存在：depth_return
- `176s` ✅ 局长室无名书 → 装订线入口 zone=seventh_entry
- `182s` ✅ 装订线白缝 → 回 B1 zone=archive_b1
- `187s` ✅ B5 后门 → 墨渊 zone=abyss_gate
- `193s` ✅ 定稿厅红缝 → 装订线 zone=seventh_gutter
- `199s` ✅ 墨渊金门 → 回 B6 zone=training
- `199s` —— 结果：通过 31，失败 0；控制台错误 0 ——
