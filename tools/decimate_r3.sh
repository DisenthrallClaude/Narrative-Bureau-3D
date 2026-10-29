#!/usr/bin/env bash
# R3 批次2：高面小件减面（目标 ≤5k，近景大件 ≤8k），原件备份到 P/work/models_pre_r3/
cd "$(dirname "$0")/.."
BK=../work/models_pre_r3; mkdir -p $BK/r2
LIST="literary_club_chair_preview:0.11 apollo_smoke_detector:0.02 rotary_telephone:0.1 phone_vef_ta_68:0.1 fire_extinguisher:0.13 book_cabinet_vintage:0.25 1930s_style_typewriter_w_o_branding:0.18 dining_chair_02:0.22 plastic_broom:0.1 free_pothos_potted_plant_money_plant:0.33 hand_truck:0.25 bankers_lamp:0.25 paper_waste_bin:0.15 document_letter_tray_documents_organizer:0.2 ceiling_light_with_chain:0.25 paper_tray_with_paper_for_bank:0.3 old_radiator:0.4"; [ -n "$ONLY" ] && LIST=""; for e in $LIST $EXTRA; do
  n=${e%%:*}; r=${e##*:}; f=public/assets/models/r2/$n.glb; [ -f "$f" ] || { echo "skip $n"; continue; }
  [ -f $BK/r2/$n.glb ] || cp $f $BK/r2/$n.glb
  npx gltf-transform simplify $BK/r2/$n.glb /tmp/dr_$n.glb --ratio $r --error 0.01 >/dev/null 2>&1 && npx gltf-transform meshopt /tmp/dr_$n.glb /tmp/dr2_$n.glb >/dev/null 2>&1 && cp /tmp/dr2_$n.glb $f && echo "$n $r $(stat -c%s $BK/r2/$n.glb) -> $(stat -c%s $f)"
done
