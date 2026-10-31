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
