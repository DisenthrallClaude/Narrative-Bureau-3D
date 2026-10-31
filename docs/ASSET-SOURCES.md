# 素材来源（新增素材登记；历史素材见 public/assets/CREDITS.txt）

| 批次 | 素材 | 来源 | 许可 | 校验 / 版本 | 用途 / 修改 |
|---|---|---|---|---|---|
| E1 | 星紋之門 astral-gate | https://00gamedevs.com/downloads/effects/astral-gate.js | MIT（00GameDevs；Three.js MIT 声明保留） | catalog v2 contentVersion ef7ce13c6faa4569…；sha256 67269f20e758dcc000f9a54380c7143102303b6e9a4c3c65f87cab32b05278aa | 深渊门门洞星纹膜；去掉自带门框；色 #7a5420、speed 0.35 |
| E1 | 貼地薄霧 ground-fog | https://00gamedevs.com/downloads/effects/ground-fog.js | MIT | sha256 acd6a5c3a554e9d9b91c90c45c6fd596cb849ec96b7593e08925d1b43313d243 | 档案馆 B1 贴地薄雾 ×5（low 档 3）；暖灰 #6e655a、speed 0.4 |
| E1 | 浮符矩陣 arcane-matrix | https://00gamedevs.com/downloads/effects/arcane-matrix.js | MIT | sha256 7b9d89f84d0e4172580ea61dd7015e4c43964b9684041bb70b307ea45829849e | 第七局回写台浮符；琥珀 #a87a34、quantity 5、speed 0.3 |

注：三个下载件共用同一份运行时（仅末尾 preset 不同），仓库只存一份 src/vendor/gdevs-vfx.js（来自 astral-gate.js，去掉末尾 preset/default 导出），preset 写在 src/world/e1_fx.js。原件与 metadata 存于项目工作区 work/r3/e1/fxlib/。库依赖 three 0.187.0，本项目 0.186.1：静态核对所用 THREE.* 符号全部存在，游戏内实测见 HANDOFF E1 节。
