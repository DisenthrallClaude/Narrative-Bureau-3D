#!/bin/bash
# R2 安检大厅：PBR 材质 → Cycles 光照贴图 + 反射探针烘焙 → 导出 → 压缩进游戏（务必单独运行，别和 SwiftShader 截图同时跑）
# 用法：bash tools/bake_hall.sh [res=4096] [spp=64]
set -e
P=/workspace/projects/b2c90d19-7034-43fd-aea1-521ddd72406e; W=$P/work/r2; G=$P/game
RES=${1:-4096}; SPP=${2:-64}
cd $W
PBR_KIND=hall PBR_BAKE=1 /workspace/work/blender.sh -b hall.blend --python $G/tools/blender/apply_pbr.py --python $G/tools/blender/bake_lm.py -- $W/hero_hall.glb $RES $SPP 0,5.3,-53 4
cd $G
python3 -c "
from PIL import Image; im=Image.open('$W/hero_hall_lm.png').convert('RGB'); im.save('public/assets/hero/hero_hall_lm.webp', quality=92, method=4); print('lm webp', im.size)"
cp $W/hero_hall_probe.hdr public/assets/hdri/hall_probe.hdr
npx gltf-transform meshopt $W/hero_hall.glb public/assets/hero/hero_hall.glb
cp $W/hero_hall_col.glb public/assets/hero/hero_hall_col.glb
ls -la public/assets/hero public/assets/hdri/hall_probe.hdr
echo BAKE_HALL_DONE
