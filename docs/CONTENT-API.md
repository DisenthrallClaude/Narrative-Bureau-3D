# 内容接口（build-lead ⇄ art-content）

游戏在运行时读取 `content/manifest.json`（由 `tools/sync_content.mjs` 从 P/content 同步到 `public/content/`）。

| 字段 | 引擎用法 |
|---|---|
| documents[] | `id` 被场景热点引用；`type` 决定阅读版式：phone_message=手机、screen=屏幕、file_page(page=3)=黑纸金字、其余=牛皮纸；`texture`（textures 的 id，status=ready 才使用）：personnel_file 先显示海报再显示文字；file_page/file_cover 显示图片页再显示文字页；`completes_on_read` 在该页显示时置位。 |
| interactables[] | 按 id 接线：`prompt` 准星提示；`lines` 对话（「名字：台词」；「（…）」旁白；「> 选项 A：…」选项；「名字（A）：」按选项分支）；`result_text` 提示条；`sequence` 事件分步字幕；`gives` 给物品；`completes` 置任务旗标；`requires` 前置（物品或旗标，`&` 连接）；`solution`/`success_sequence`/`fail_text` 谜题。 |
| hints[] | objective / objective_optional 按 `order` 显示在左上目标栏，`done_when` 满足即跳到下一条（支持 `enter_area:<区域id>`、旗标、`a&b&c`）；whisper/wayfinding 由剧本在对应时机弹出；chapter_card 为章节卡。 |
| textures[] | `path` 相对 content/；仅 `status: ready` 被加载，pending 时用代码生成的占位。 |
| items[] | 物品栏显示 `name`/`desc`/`texture`。 |

音频：`content/audio/<编号>.(mp3|ogg|wav|m4a)`（M01–M06 BGM、A01–A06 环境、S01–S22 音效），同步时自动生成 `audio/index.json`，缺失文件静默。区域→音频映射见 `src/engine/audio.js` 的 ZONE_AUDIO。

新增区域时：在 AREAS.md 的区域 id 下写 documents/interactables，build-lead 在场景里放置同 id 热点即可接通。

## 通用绑定器（src/engine/binder.js）
场景代码只需登记锚点：`ctx.anchors[<manifest id>] = Mesh | { obj, range } | { box:[cx,cy,cz,w,h,d] }`，绑定器在 `setupStory` 之后自动把 documents / interactables 接成热点（已被 story.js 手工接线的 id 跳过）。交互按类型执行：lines 对话 → sequence 字幕 → result_text → doc → gives/completes/quest_step/unlocks → then 链；未满足 requires 时提示 fail_text/locked_text。读完文档置 `read:<id>`，用过交互置 `used:<id>`（hints 的 done_when 可直接引用）。`ctx.slots[area] = [{pos,yaw,w,h,kind}]` 可给没有锚点的文档自动摆一张纸/铜牌。
