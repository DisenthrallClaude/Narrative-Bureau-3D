# 展示片录制模式（?rec=1）

文件：`src/rec/recorder.js`（录制逻辑）、`src/rec/path.json`（机位路径，可直接改）；`main.js` 只有 6 处一行改动，`?rec=1` 不开时 `REC = null`，游戏 / walk 行为不变。

## 用法
```
index.html?rec=1&q=high&qo=shadow=2048        # 推荐：高画质，阳光阴影贴图降一档（4096→2048）
await page.waitForFunction(() => window.__REC__?.booted)
await page.evaluate(() => window.__REC__.ready())            // 等字体 / 主楼构建；ready({ athena: true }) 额外等墨渊古城构建
const info = await page.evaluate((f) => window.__REC__.seek(f), 1234)   // 任意帧独立跳转，返回 { f, seg, zone, ms, buildMs, calls, tris }
await page.screenshot({ type: 'jpeg', quality: 95 })
```
- `__REC__.total` 总帧数；`__REC__.segments()` 各段起止帧；`__REC__.poseAt(f)` 某帧机位。
- 兼容 cloud-render 约定：`window.__ready`、`window.renderAt(t)`（= seek(round(t*30))）。
- 固定步长：rAF 被接管（只在 seek 时跑一帧 loop），`performance.now` 在 seek 渲染期间定格为 f/30 s，`time.value = f/30`，曝光不做时间平滑；墨渊古城的天空 / 云 / 水 / 植被风时间定格为 f/30，远处 / 小件剔除每帧重算。
- 隐藏 HUD / 准星 / 对话 / 阅读器 / 暂停 / 章节卡；首页段显示主菜单（加载层 .live + 右侧实时广场机位，CSS 动画按帧号定格），`open` 秒后整层淡出。
- 墨渊古城：第一次 seek 到 `abyss_athena` 段时按需构建（≈50 s，GitHub runner），之后同一页面内复用。
- 不预编译整场景（同 ?test=1）；各区第一帧会同步编译该区着色器。

## path.json
- 当前版本：3600 帧 = 120 s（首页 4 s、广场 8 s、正门→大厅→档案馆 12 s、各自由探索区 2–3 s、室外块停机坪/碑廊/岗哨/地铁口各 2 s、墨渊古城 21.5 s）。室外段（帧 0–360、2640–2880）落在 60 帧分片边界上，渲染农场对这些分片用低画质参数（q=medium、阴影 1024）。
- 渲染侧每个浏览器会话先完整渲一帧别的区作预热（不输出），再跳到目标帧（规避正门/大厅作为会话首帧渲成空世界）。
- `segments[]`：`{ id, dur(秒), zone('auto' 按机位判区 | 区名), cut('none' 连续 | 'cut' 硬切 | 'fade' 0.3 s 黑场), out('fade' 段尾淡出), oy(段内 y 偏移，古城 −3000), keys:[{pos, look, fov}] }`；`type:'menu'` 为首页段（`open` = 开始淡出的秒数）。
- 段内机位 / 注视点 / FOV 各走一条 centripetal Catmull-Rom；时间按「位移 + turnK × 视线转角」分配（转弯 / 摇镜自动减速），再混 `ease` 的首尾缓入缓出。
- 生成脚本在制作侧（work/nbvid/tools/mkpath.py），也可直接手改 JSON。
