# 素材来源（新增素材登记；历史素材见 public/assets/CREDITS.txt）

| 批次 | 素材 | 来源 | 许可 | 校验 / 版本 | 用途 / 修改 |
|---|---|---|---|---|---|
| E1 | 星紋之門 astral-gate | https://00gamedevs.com/downloads/effects/astral-gate.js | MIT（00GameDevs；Three.js MIT 声明保留） | catalog v2 contentVersion ef7ce13c6faa4569…；sha256 67269f20e758dcc000f9a54380c7143102303b6e9a4c3c65f87cab32b05278aa | 深渊门门洞星纹膜；去掉自带门框；色 #7a5420、speed 0.35 |
| E1 | 貼地薄霧 ground-fog | https://00gamedevs.com/downloads/effects/ground-fog.js | MIT | sha256 acd6a5c3a554e9d9b91c90c45c6fd596cb849ec96b7593e08925d1b43313d243 | 档案馆 B1 贴地薄雾 ×5（low 档 3）；暖灰 #6e655a、speed 0.4 |
| E1 | 浮符矩陣 arcane-matrix | https://00gamedevs.com/downloads/effects/arcane-matrix.js | MIT | sha256 7b9d89f84d0e4172580ea61dd7015e4c43964b9684041bb70b307ea45829849e | 第七局回写台浮符；琥珀 #a87a34、quantity 5、speed 0.3 |
| I1 | Kenney Interface Sounds 1.0 | https://kenney.nl/assets/interface-sounds（官方 zip） | CC0 1.0 | sha256 f2193d072726d6758a5f7871b2dcc54dcce0d5c35c6f0a62f92549b327c81232 | tick_002 / click_002 / confirmation_002 / close_002 / open_002 → K_ui_hover/click/confirm/back/open.ogg；lowpass 4.2 kHz + 降调 0.89、mono 44.1k、vorbis q3、按均值响度统一 |
| I1 | Kenney Impact Sounds | https://kenney.nl/assets/impact-sounds（官方 zip） | CC0 1.0 | sha256 029d734af1582474edf3a694d1b0cebc97c1c152f2f39fa34d4c2bafc5de77f8 | footstep_concrete/wood/carpet_000–003 → K_step_stone/wood/carpet_0–3；impactMetal_light_000–003 截 0.25 s → K_step_metal_0–3；impactWood_light_000、impactMetal_medium_000 混入 K_drawer / K_cabinet |
| I1 | Kenney RPG Audio | https://kenney.nl/assets/rpg-audio（官方 zip） | CC0 1.0 | sha256 6dbeaf8544da958d8f2adcb4a4a4b76c1ade34a05f8ab9edccd327da7375f38b | bookFlip1–3、bookOpen → K_paper_0–2 / K_paper_open；doorOpen_1 / doorClose_1 → K_door_open/close；creak3 + 木撞 → K_drawer；metalLatch + 金属撞 → K_cabinet |
| I1 | Kenney UI Audio | https://kenney.nl/assets/ui-audio（官方 zip） | CC0 1.0 | sha256 946fc23a63d535d693eb31b2eabb80c8c28d6351e2186b344ceb71b2cb1d5eb6 | 已下载备选，本批未入仓 |

注：三个下载件共用同一份运行时（仅末尾 preset 不同），仓库只存一份 src/vendor/gdevs-vfx.js（来自 astral-gate.js，去掉末尾 preset/default 导出），preset 写在 src/world/e1_fx.js。原件与 metadata 存于项目工作区 work/r3/e1/fxlib/。库依赖 three 0.187.0，本项目 0.186.1：静态核对所用 THREE.* 符号全部存在，游戏内实测见 HANDOFF E1 节。

## 批次 S1（第七局开源资源，2026-11-01）
| 文件 | 来源 | 作者 | 许可 | 处理 | 大小 |
|---|---|---|---|---|---|
| models/s1/metal_office_desk.glb | https://polyhaven.com/a/metal_office_desk | Ulan Cabanilla | CC0 | 1k webp + meshopt | 170 KB |
| models/s1/binder_notebook.glb | https://polyhaven.com/a/binder_notebook | DaDrood | CC0 | 1k webp + meshopt，减面 50% | 218 KB |
| models/s1/book_encyclopedia_set_01.glb | https://polyhaven.com/a/book_encyclopedia_set_01 | John Malcolm | CC0 | 1k webp + meshopt，减面 25%（6.7 万→约 1.7 万面） | 536 KB |
| models/s1/vintage_grandfather_clock_01.glb | https://polyhaven.com/a/vintage_grandfather_clock_01 | Yann Kervran, James Ray Cock | CC0 | 1k webp + meshopt | 342 KB |
已下载但弃用：vintage_stapler（青绿漆，违反禁蓝绿）、stationery_supplies（蓝色笔杆）。

## 批次 S3（资源第二轮，2026-11-01）
| 文件 | 来源 | 作者 | 许可 | 处理 | 大小 |
|---|---|---|---|---|---|
| models/s3/side_table_tall_01.glb | https://polyhaven.com/a/side_table_tall_01 | James Ray Cock | CC0 | 1k webp + meshopt | 163 KB |
| models/s3/mantel_clock_01.glb | https://polyhaven.com/a/mantel_clock_01 | Yann Kervran, Rico Cilliers | CC0 | 1k webp + meshopt | 326 KB |

已下载、核过许可但本批未入库：tea_set_01 / wooden_display_shelves_01（Poly Haven CC0，未找到经核实的空位）、round_spectacles（深色墨镜片，不合时代）、Khronos glTF-Sample-Assets Lantern（CC0，中世纪木杆路灯不合风格）。弃用：Khronos AntiqueCamera（CC0 但含 UX3D 商标，LICENSE 明确排除商标）。

## 批次 R4-A（第七局中部充实，2026-11-01）
Above the Desk by Wh1tZz (github.com/Wh1tZz/above-the-desk)，模型由 Tripo 生成，经作者许可使用（用户转述作者公开同意），本项目非商业开源。

| 文件 | 来源 | 作者 | 许可 | 处理 | 大小 |
|---|---|---|---|---|---|
| models/r4a/typewriter.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/typewriter.glb | Wh1tZz（Tripo 生成） | 经作者许可（非商业开源） | 1k webp + meshopt | 250 KB |
| models/r4a/desk_lamp.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/desk-lamp.glb | Wh1tZz（Tripo 生成） | 经作者许可（非商业开源） | 1k webp + meshopt，简化 30% | 349 KB |
| models/r4a/library_cart.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/library-cart.glb | Wh1tZz（Tripo 生成） | 经作者许可（非商业开源） | 1k webp + meshopt | 185 KB |
| models/r4a/realistic_bookcase.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/realistic-bookcase.glb | Wh1tZz（Tripo 生成） | 经作者许可（非商业开源） | 1k webp + meshopt | 262 KB |
| models/r4a/lower_cabinet.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/lower-cabinet.glb | Wh1tZz（Tripo 生成） | 经作者许可（非商业开源） | 1k webp + meshopt | 200 KB |
| models/r4a/desk_globe.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/desk-globe.glb | Wh1tZz（Tripo 生成） | 经作者许可（非商业开源） | 1k webp + meshopt | 147 KB |
| models/r4a/wind_clock.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/wind-clock.glb | Wh1tZz（Tripo 生成） | 经作者许可（非商业开源） | 1k webp + meshopt | 230 KB |
| models/r4a/tea_service.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/tea-service.glb | Wh1tZz（Tripo 生成） | 经作者许可（非商业开源） | 1k webp + meshopt | 380 KB |
| models/r4a/correspondence_set.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/correspondence-set.glb | Wh1tZz（Tripo 生成） | 经作者许可（非商业开源） | 1k webp + meshopt | 164 KB |
| models/r4a/armillary.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/armillary.glb | Wh1tZz（Tripo 生成） | 经作者许可（非商业开源） | 1k webp + meshopt，简化 30% | 467 KB |

另复用已入库 r2/woodenchair_01、r2/armchair_01、r2/woodentable_02、r2/rotary_telephone、s1/book_encyclopedia_set_01。处理件共 29 个放 /workspace/work/atd/out/（供其它批次复用）；ink-bottle（青绿墨水瓶）、antique-book-stack（蓝绿书脊）未用。
## 批次 R4-B（外观远景，2026-11-01）
| 文件 | 来源 | 作者 | 许可 | 处理 | 大小 |
|---|---|---|---|---|---|
| models/r4b/library_hall.glb | https://www.innerscene.com/tools/library/3d-parts/library-building-362b4104 | Innerscene（原创模型） | CC0 1.0 | 贴图 2048→512 webp q78 + meshopt（26.4 MB → 0.75 MB，约 1 万面不减面）；运行时材质压暗暖、铜绿/青铜去饱和成暗铜、玻璃改暗暖不透明 | 751 KB |

候选未用：Innerscene Synagogue（CC0，铜绿圆顶需大改色）、Residential tower（CC0，现代玻璃幕墙不合时代）；Quaternius / Kenney 卡通风按要求不用。
### 批次 R4-C（宿舍三号楼 2F 活动室 / 1F 大堂）
署名：Above the Desk by Wh1tZz (github.com/Wh1tZz/above-the-desk)，模型由 Tripo 生成，经作者许可使用（用户转述作者公开同意），本项目非商业开源。

| 文件 | 来源 | 作者 | 许可 | 处理 | 大小 |
|---|---|---|---|---|---|
| models/r4c/atd_gramophone.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/gramophone.glb | Wh1tZz（Tripo 生成） | 作者许可（非商业开源，用户转述） | 减面 50% + 1k webp + meshopt | 161 KB |
| models/r4c/atd_desk_lamp.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/desk-lamp.glb | Wh1tZz（Tripo 生成） | 作者许可（非商业开源，用户转述） | 减面 50% + 1k webp + meshopt | 351 KB |
| models/r4c/atd_wind_clock.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/wind-clock.glb | Wh1tZz（Tripo 生成） | 作者许可（非商业开源，用户转述） | 减面 50% + 1k webp + meshopt | 194 KB |
| models/r4c/atd_realistic_bookcase.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/realistic-bookcase.glb | Wh1tZz（Tripo 生成） | 作者许可（非商业开源，用户转述） | 减面 50% + 1k webp + meshopt | 240 KB |
| models/r4c/atd_sewing_machine.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/sewing-machine.glb | Wh1tZz（Tripo 生成） | 作者许可（非商业开源，用户转述） | 减面 50% + 1k webp + meshopt | 216 KB |
| models/r4c/atd_suitcase.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/suitcase.glb | Wh1tZz（Tripo 生成） | 作者许可（非商业开源，用户转述） | 减面 50% + 1k webp + meshopt | 152 KB |

### 批次 R4-A 补（改写之手）
| 文件 | 来源 | 作者 | 许可 | 处理 | 大小 |
|---|---|---|---|---|---|
| models/r4a/giant_hand.glb | https://github.com/Wh1tZz/above-the-desk/blob/main/assets/models/giant-hand-rigged.glb | Wh1tZz（Tripo 生成） | 经作者许可（非商业开源；用户特许人物类例外） | Blender 去骨骼静态 + 减面 30% + webp + meshopt | 144 KB |

paper-courier（纸人主角）未用：绑定姿态为 T-pose、披风为蓝色（禁蓝），静态摆件效果不佳。
