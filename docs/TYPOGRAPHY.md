# 叙事管理局 · 字体规范（R2，2026-10-29）

目标：官方机构的庄重感——像国家档案馆、最高法院的碑刻与公文，而不是游戏 UI。全部使用可商用的开源字体（SIL OFL 1.1），按「用途 → 字族 → 字重 → 字号/字距」统一，不允许在代码里随手写别的字体。

## 1. 字族与文件

| 角色 | CSS 名 / 变量 | 字体（许可） | 字重 | 文件（public/fonts/） | 用在哪 |
|---|---|---|---|---|---|
| 中文标题（碑刻、门额、区域名、档案标题） | `NB Title` / `--title` | 思源宋体 Noto Serif SC **Black**（OFL） | 900 | `title.woff2` | 主楼门额「叙事管理局」、区域名浮层、加载页标题、阅读器标题、所有 canvas 金字（`goldText`） |
| 中文小标题 / 人名 | `NB Serif` 600 / `--serif-zh` | 思源宋体 **SemiBold** | 600 | `serif-semibold.woff2` | 对话框说话人、告示小标题、铜牌条目 |
| 中文正文 | `NB Serif` 400 / 700 / `--serif` | 思源宋体 Regular / Bold | 400、700 | `serif-regular.woff2`、`serif-bold.woff2` | 对话、旁白、档案正文、目标提示、纸质告示与海报正文 |
| 界面数字 / 屏幕系统字 | `NB Sans` / `--sans` | 思源黑体 Noto Sans SC Regular / Medium（OFL） | 400、500 | `sans-regular.woff2`、`sans-medium.woff2` | 只用于「电子屏幕」：安检屏、监测大屏、电脑界面、手机、帧率面板、按键提示框 |
| 西文标题（英文副标题、徽记铭文） | `NB Latin Title` / `--latin` | **Cinzel** SemiBold（OFL，罗马碑刻大写） | 600 | `latin-title.woff2` | 区域名英文副标题（`#area .e`）、局徽环铭、门额英文 |
| 西文正文 / 斜体 | `NB Latin` | **Cormorant Garamond** Medium / Medium Italic（OFL） | 500 | `latin-serif.woff2`、`latin-italic.woff2` | 正文里的英文与数字（`--serif` 先取它，汉字自动回落到思源宋体），旁白斜体 |

字体源文件在 `P/work/fonts/`：Noto Serif SC 可变字体（`NotoSerifSC-VF.ttf`，用 fontTools instancer 切出 W900/W600 静态字重）、Noto Serif/Sans SC 静态 OTF、Cinzel / Cormorant Garamond 可变字体（切出 600 / 500）。
构建时 `tools/subset_fonts.py` 扫描全部源码与文案，把中文字体子集化为 woff2（新增牌子不会缺字成方块）；西文字体保留完整 ASCII。

> 不再使用：站酷小薇（ZCOOL XiaoWei，M5 曾用作标题；笔画偏手写、不够庄重）。
> 「叙」字说明：思源宋体的「叙」是规范简体（右为「又」），R3/R4 审阅中「像敘」的问题来自旧生图，已用 `content.texPatched` 改写；标题回到宋体不影响。

## 2. 层级与排版参数（UI）

| 层级 | 字族 | 字号 | 字距 | 颜色 |
|---|---|---|---|---|
| 加载页主标题 | `--title` 900 | 40 px | 0.5 em | `--gold2` #f3dc9c，外发光 0.35 |
| 区域名浮层 | `--title` 900 | 34 px | 0.45 em | `--gold2` |
| 区域英文副标题 | `--latin` 600 | 12 px | 0.5 em | #aab3c6 |
| 阅读器标题 | `--title` 900 | 24 px | 0.12 em | 墨色 #2b2116 |
| 对话说话人 | `--serif-zh` 600 | 14 px | 0.3 em | `--gold2` |
| 对话 / 旁白正文 | `--serif` 400 | 19 px / 行高 1.75 | 0.02 em | #efe8d8（旁白 #b9b4a8 斜体） |
| 目标提示 | `--serif` 400 | 17 px | 0.06 em | #f2ead8 |
| 按键框 / 屏幕字 | `--sans` 500 | 12 px | 0 | `--gold2` |

规则：
1. 中文标题一律宋体 Black，**不加粗描边、不加斜体**；字距 ≥ 0.12 em，碑刻感来自字距和留白。
2. 正文行高 1.75–2.0，不用两端对齐（中文标点挤压在 Canvas 里不可控）。
3. 黑体只出现在电子屏幕里；纸、石、铜、木上的字一律宋体（真实机构的印刷品与刻字就是这样）。
4. 金色只给标题和关键数字；正文用暖白 / 墨色。

## 3. 场景文字（Canvas 贴图）

| 载体 | 写法 |
|---|---|
| 鎏金刻字（门额、门牌、方向标识） | `goldText(text, w, h, mat)`，默认 `NB Title`（宋体 Black），字距 `spacing` 按字数 40–60 px |
| 铜牌 / 告示 / 海报 | 标题 `900 … "NB Title"`，正文 `400 … "NB Serif"`；不要用 `NB Sans` |
| 档案袋签条、卷宗封面 | 标题 `600 … "NB Serif"`，编号用 `"NB Latin"`（Cormorant 数字是旧式数字，有档案感） |
| 显示器、LED 屏、手机 | `"NB Sans"` 400/500 |
| 生图（GPT image）里的字 | 生图提示词统一写「宋体 / 思源宋体风格，鎏金或黑色印刷」 |

Canvas 绘字前必须等字体加载（`main.js boot()` 里 `document.fonts.load` 已预载全部字重），否则会落回系统字体。

## 4. 许可

- Noto Serif SC / Noto Sans SC：SIL Open Font License 1.1（Google / Adobe）
- Cinzel：SIL OFL 1.1（Natanael Gama）
- Cormorant Garamond：SIL OFL 1.1（Christian Thalmann, Catharsis Fonts）

均允许商用、嵌入、子集化；Credits 页已列出。
