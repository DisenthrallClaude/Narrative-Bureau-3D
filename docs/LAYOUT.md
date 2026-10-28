# 叙事管理局 · 总体布局与路线（build-lead，依据 P/content/AREAS.md v1）

坐标：米；+X 东，-Z 北（朝主楼），+Y 上。广场地面 y=0；主楼一层地坪 y=1.8（正门 10 级台阶）。

## 地表 S
| id | 位置 | 里程碑 |
|---|---|---|
| plaza | 喷泉中心 (0,0,30)，广场 z +85…-5，南端大台阶下到 y=-4 | M1 |
| metro_exit | z +95…+150，y=-4 迎宾大道，玻璃顶地铁口 (0,-4,140) | M2 |
| wall_posts | 环形城墙圆心 (0,-35)，半径 118，11 座塔（编号 1–12，无 7 号；6–8 之间墙体加厚） | M1 外观 / M2 可进入 |
| helipad | 东北塔顶 (85, 22, -95) | M2 |
| memorial | 广场西侧柏树林 x -60…-90, z +10…+60 | M3 |
| dorm | 城墙内侧东南附楼 x +60…+95, z +20…+60 | M3 |

## 主楼地上 F（一层 y=1.8；二层 +7.8；三层 +13.8；主塔 4–12F 每层 6m）
| id | 范围 | 里程碑 |
|---|---|---|
| gate 正门门廊+服务台 | x -14…14, z -5…-30 | M1 |
| security_hall 安检大厅（中殿，扇形拱顶 26m） | x -17…17, z -30…-76 | M1 |
| archive 人事档案馆（西翼 1–2F 通高 + B1 密集库 y=-4.2） | x -56…-20, z -32…-70 | M1 |
| citizen_service 市民服务 | 东翼 1F x 20…56, z -32…-52 | M2 |
| exam_center 考务中心 1–3F | 东翼 1F x 20…56, z -54…-76，楼上 2–3F | M2 |
| command_center 指挥中心 | 东翼 2F x 20…56, z -32…-70 | M2 |
| zone_control 禁区调度厅 | 东翼 3F / 后楼东 x 20…56, z -78…-110 | M2 |
| canteen 食堂与中庭 | 后楼 x -18…18, z -110…-140（中庭玻璃顶） | M2 |
| offices 办公区 2–3F | 后楼西 x -56…-20, z -78…-110 | M2 |
| liaison 国际联络处 | 西翼 2F（档案馆回廊北侧） | M3 |
| medical / lab | 后楼 2–3F | M3 |
| publicity | 后楼东 1F | M3 |
| library 典籍藏书阁 | 主塔 x -14…14, z -78…-106, 4–11F 环形书井 | M3 |
| director_office 机要室与局长室 | 主塔 12F | M3 |

## 地下 B（书脊井 (0, *, -92) 贯穿）
| id | 层 | 里程碑 |
|---|---|---|
| spine_shaft | 全层电梯厅 | M2 |
| armory | B1 | M3 |
| interrogation | B2 | M3 |
| vault | B3–B5 | M2 |
| training | B6 | M3 |
| 墨渊 abyss_* (5) | 书芯：倒悬书城（独立场景，经电梯转场） | M4 |
| 装订线 seventh_* (5) | 页缝空间（独立场景；入口：档案馆 B1 第 7 排 / 电梯 B7 / 局长室书柜） | M1 露出入口，M3–M4 |

## 主线动线 v1
广场 → 正门（服务台领临时入职证）→ 安检大厅（扫描异常）→ 西侧拱门 → 人事档案馆（领档案）→ 楼梯下 B1 → 第 7 排缝隙（悬念止步）。

## M2/M3 增补（2026-10-29，接手的 build-lead）
- 书脊井电梯：安检大厅北墙 x=±6 金门旁呼梯面板 → 楼层对话框 → 黑场转场。各层电梯厅在 z −84…−92（金门在 z=−84），楼层登记表 `src/world/vault.js` 的 `FLOORS`。B6+关门键 7 秒 → `int_spine_b7` 彩蛋；B5 需先与 B4 齐仇交谈（`used:int_vault_qichou`）。
- 地下：B1 外勤整备库 y=−10，B2 审讯羁押 y=−18，B3 开架收容 y=−26，B4 收容柜走廊 y=−34，B5 深库 y=−42（圆形金库门 z=−100，靠近自动开启），B6 训练场 y=−52。
- 地上：后楼 1F 食堂中庭 x±18 z −110…−140（安检大厅北墙铁门 → 连廊 z −76…−110），2F 联络处+宣传处 y=8.8，3F 办公/医务/实验室 y=15.8，4F–11F 藏书阁书井 y=22.8（圆心 0,−106，半径 13），12F 局长室 y=71.8。
- 区域判定 `zoneAt()`（main.js）按坐标 + 高度；场景分组可见性 `VIS` / `GROUP_OF`；区域 → manifest 区域 id 映射 `AREA_OF`（用于 enter_area）。

## M4 布景加密（2026-10-29，build-lead 第三任）
- 新模块：`src/world/dress.js`（工具包：wallDress/roomDress 护墙板·壁柱·檐口·壁灯，coffered 藻井，tGrid 吊顶格栅，bunkerCeiling 桥架风管，rug/floorInlay，deskSet/cabinetRow/bookcase/spineShelf 成组家具，Props = GLB→InstancedMesh），`src/world/dressing.js`（按区域在 M3 结构上加布景，坐标见各段注释）。
- 面光 `rectLight()` 改为分区半球补光（RectAreaLight 在光泽墙面映出矩形高光，是「悬空半透明板」的根因）；`main.js` 的 `FILLS` 只在当前分区生效。
- 时段：`src/engine/tod.js`，默认白昼（`public/assets/tex/sky_day.jpg`，由 Poly Haven kloofendal_48d_partly_cloudy 4k 色调映射），设置菜单「时段」切换黄昏（保存到 localStorage 后重载）。截图 `--tod dusk`。
- `zoneAt()`：地上楼层用平面包围盒判定，包围盒外高空一律算室外（修 R2 P0-1 俯瞰隐藏外景）。食堂挑台脚底 y≈8.25，floor2 下界 8.55。
- 电梯 `WIP` 集合（vault.js）：放入楼层名即在面板显示「施工中」并拒绝到达。
- 主塔：92 m 方塔 + 30 m 收分方塔 + 16 m 八角灯笼亭 + 108 m 尖顶（总高约 250 m）。
- 截图：`tools/shotq.sh` 排队（等其它 shot.mjs 结束再跑，防 OOM）；截图模式加载期间不渲染（11 秒加载完）。
- 食堂二层挑台可登临：西侧楼梯 x=−13，z −112.2→−128（`ctx.canteenStair`）。B6 控制塔挪到 (−22, −99)。

## M5（2026-10-29，build-lead 第四任）
- **材质根因修复**：抛光石材 PBR 的粗糙度图均值只有 0.03–0.1（Marble/Granite/Onyx），three.js 把 roughness 参数与图相乘 → 任何 roughness 都成了镜面。新增归一化图 `public/assets/tex/<set>_roughN.webp`（均值≈0.8），`pbr(set, { rn: true })` 使用；hallFloor/hallFloorDark/terrazzo/wallStone/panelWall/woodFloor/dz_pil 已切换。
- **室内 HDR 限亮**：`main.js tameHDR(hall_1k, 2.5)`，原图峰值 762（窗口），2% 像素被压，档案馆/大厅「白光溢出」根因。
- **字体**：新增 `NB Title`（站酷小薇 ZCOOL XiaoWei，仅简体字形，fonts/title.woff2）。goldText 默认字体与所有 `700 … "NB Serif"` 画布标题改用它；Noto Serif SC 的「叙」右部「又」带衬线三角易被看成「敘」。生图 B02 通缉公告栏底部「敘」用 `content.texPatched()` 运行时改写。
- **显示器**：GLB `decal_screen` 材质替换为 `screenUI()` 界面池（档案检索 / 稳定度曲线 / 内部邮件 / 锁屏局徽）。
- `src/world/dress_m5.js`：B1/B6 哑光地坪（epoxy / trainFloor）、车位标线、轮胎印/油渍/磨损贴花、龙门吊、充电桩、防暴盾墙、背心架、托盘、油桶、拖车、工具车、路锥、地面喷字；B6 射击区（8 靶道 z −141…−155）、体能障碍区（x −31…−21）、格斗区沙袋架、器械架、母带运输拖车、教官。
- 食堂玻璃顶：尖拱铁艺主肋（每 3 m，每 9 m 加粗+金线）+ 纵向檩条 + 拱脚圆形花窗格 + 脊线金条；吊灯加吊杆。
- `src/world/surface.js`（分组 `surface`，随广场可见）：附楼群（西北后勤车库 (−86,−70)、西档案附楼 (−80,−20)、东外勤附楼 (82,−20)）、内院环形车道、**宿舍 dorm** (52…80, 0…40) 1F 大厅/宿管室小卖部/洗衣房/101/102，2F 活动室/207（家书），**机库 helipad** (73…99, −87…−53) 两架飞行器 + 屋顶停机坪 y=12（南侧外挂钢梯），**岗哨 wall_posts** 12 号塔内侧 (−47.3, 62.1)（监控墙、登记本、守则、塔楼附图、顶部望远镜），**无字碑廊 memorial** (−76…−50, 2…44) 7×8 碑 + 07-0-0000，**地铁口 metro_exit** (0,−4,140) 玻璃出站厅、扶梯、站名柱、守则立牌、城市信息屏、便利店、单车/外卖车。
- **东廊 east_cloister**：东翼北墙门洞 x 24.4…27.8 → 走廊 x 24.2…28 北行至 z −111 → 西转进食堂东墙门洞 z −111.4…−114.6。
- `src/world/depths.js`：**墨渊**（y=−300）abyss_gate 折页门 z −80 / abyss_city 纸页街道 + 书墙 + 倒悬塔 + 正本档案塔 z −172 / abyss_core 定稿厅（平台 y −280，(8,−228)，镇纸巨柱、环形书桌、红批注）/ abyss_exam 考场母本（西巷，第 7 排第 7 桌）/ abyss_tide 墨潮带（东巷）。**装订线**（y=−500）seventh_entry z −53…−66 / gutter 弧形回廊 z −66…−112 / ops 作战室 / wrap 杀青室 / rewrite 回写台（三结局）。
- 入口：B6 西墙维护通道 (−31.75, −146) 与 B5 北墙后门 → 墨渊；定稿厅镇纸柱旁红缝 → 装订线；B1 第 7 排缝隙（q5_b1 后）/ 电梯 B6+关门 7 秒 / 局长室南墙红色无名书 (−4.6, 73.4, −92.95) → 装订线入口；装订线入口北端白缝 → 回 B1；墨渊南端金门 → 回 B6。
