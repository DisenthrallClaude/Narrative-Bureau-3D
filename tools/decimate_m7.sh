#!/usr/bin/env bash
# M7 性能：对实例多/面数高的道具 GLB 二次减面（gltf-transform simplify，meshoptimizer），原件备份在 P/work/models_pre_m7/
cd "$(dirname "$0")/.."
BK=../work/models_pre_m7; mkdir -p $BK
for e in keyboard:0.15 street_lamp_02:0.25 military_crate:0.3 cardboard_box:0.12 gas_mask:0.3 fluorescent:0.25 potted_plant:0.3 armchair:0.45 extinguisher:0.4 chandelier:0.45 desk_lamp:0.3 park_bench:0.4 rose_window:0.4 server_rack:0.4 road_barrier:0.3 iron_gate:0.5; do
  n=${e%%:*}; r=${e##*:}; f=public/assets/models/$n.glb; [ -f "$f" ] || { echo "skip $n"; continue; }
  [ -f $BK/$n.glb ] || cp $f $BK/$n.glb
  npx gltf-transform simplify $BK/$n.glb /tmp/dec_$n.glb --ratio $r --error 0.003 >/dev/null 2>&1 && cp /tmp/dec_$n.glb $f && echo "$n $r $(stat -c%s $BK/$n.glb) -> $(stat -c%s $f)"
done
# 远景大教堂（8 个克隆，400–1500 m 外）：npx gltf-transform simplify $BK/cathedral.glb out --ratio 0.06 --error 0.05
# 大教堂：node tools/decimate_soup.mjs $BK/cathedral.glb /tmp/c.glb 0.1 0.02 && npx gltf-transform meshopt /tmp/c.glb public/assets/models/cathedral.glb
