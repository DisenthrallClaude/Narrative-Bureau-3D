#!/usr/bin/env bash
# 资产压缩：gltf-transform optimize（meshopt + webp + 减面）
# 用法：bash tools/process_models.sh [名称过滤]
cd "$(dirname "$0")/.."
S=../assets/sourced; O=public/assets/models; mkdir -p $O
# name|src|texsize|simplify_ratio(1=不减)
LIST="
fountain|01_plaza_exterior/sf_burdett_coutts_fountain_b0ec2e/burdett_coutts_fountain.glb|1024|0.05
spire|01_plaza_exterior/sf_gothic_memorial_spire_rookwood_cemetery__74a9e2/gothic_memorial_spire_rookwood_cemetery_.glb|1024|0.08
rose_window|01_plaza_exterior/sf_rose_window_valencia_cathedral_spain_628a1d/rose_window_valencia_cathedral_spain.glb|1024|0.15
fan_vault|01_plaza_exterior/sf_gothic_fan_vaulting_96f57f/gothic_fan_vaulting.glb|1024|0.2
cathedral|01_plaza_exterior/sf_gothic_cathedral_8b8f08/gothic_cathedral.glb|1024|0.06
gothic_statue|01_plaza_exterior/gothic_statue/gothic_statue_2k.gltf|1024|0.5
lion_head|01_plaza_exterior/lion_head/lion_head_2k.gltf|1024|0.4
castle_door|01_plaza_exterior/large_castle_door/large_castle_door_2k.gltf|2048|1
iron_gate|01_plaza_exterior/large_iron_gate/large_iron_gate_2k.gltf|1024|1
street_lamp_01|01_plaza_exterior/street_lamp_01/street_lamp_01_1k.gltf|1024|1
street_lamp_02|01_plaza_exterior/street_lamp_02/street_lamp_02_1k.gltf|1024|1
street_seating|01_plaza_exterior/modular_street_seating/modular_street_seating_1k.gltf|1024|0.6
park_bench|01_plaza_exterior/g3_park-bench/park-bench.glb|1024|1
flag_pole|01_plaza_exterior/g3_flag-pole/flag-pole.glb|1024|1
bollard|01_plaza_exterior/g3_bollard/bollard.glb|512|1
planter|01_plaza_exterior/g3_street-planter/street-planter.glb|1024|0.5
planter_box|01_plaza_exterior/planter_box_01/planter_box_01_1k.gltf|1024|1
manhole|01_plaza_exterior/water_manhole_cover/water_manhole_cover_1k.gltf|1024|1
road_barrier|01_plaza_exterior/concrete_road_barrier_02/concrete_road_barrier_02_1k.gltf|1024|1
metal_detector|02_security_hall/metal_detector/metal_detector_1k.gltf|1024|1
turnstile|02_security_hall/sf_subway_turnstile_eed7f0/subway_turnstile.glb|1024|1
turnstile_full|02_security_hall/sf_double_full_height_turnstile_low_poly_993581/double_full_height_turnstile_low_poly.glb|1024|1
cctv|02_security_hall/sf_cctv_camera_e69d5e/cctv_camera.glb|1024|1
security_camera|02_security_hall/security_camera_01/security_camera_01_1k.gltf|1024|1
potted_plant|02_security_hall/potted_plant_02/potted_plant_02_1k.gltf|1024|0.5
extinguisher|02_security_hall/korean_fire_extinguisher_01/korean_fire_extinguisher_01_1k.gltf|512|1
wet_sign|02_security_hall/WetFloorSign_01/WetFloorSign_01_1k.gltf|512|1
ceiling_lamp|02_security_hall/modern_ceiling_lamp_01/modern_ceiling_lamp_01_1k.gltf|512|1
armchair|02_security_hall/modern_arm_chair_01/modern_arm_chair_01_1k.gltf|1024|1
fire_alarm|02_security_hall/fire_alarm/fire_alarm_1k.gltf|512|1
shelves_03|04_archive/steel_frame_shelves_03/steel_frame_shelves_03_2k.gltf|1024|1
shelves_01|04_archive/steel_frame_shelves_01/steel_frame_shelves_01_1k.gltf|1024|1
filing_cabinets|04_archive/sf_filing_cabinets_7ef1ca/filing_cabinets.glb|1024|1
file_cabinet|04_archive/sf_file_cabinet_f07427/file_cabinet.glb|1024|1
cardboard_box|04_archive/cardboard_box_01/cardboard_box_01_1k.gltf|1024|1
box_stack|04_archive/g3_cardboard-box-stack/cardboard-box-stack.glb|1024|1
binder|04_archive/binder_notebook/binder_notebook_1k.gltf|1024|1
magnifier|04_archive/magnifying_glass_01/magnifying_glass_01_1k.gltf|512|1
stapler|04_archive/vintage_stapler/vintage_stapler_1k.gltf|512|1
stationery|04_archive/stationery_supplies/stationery_supplies_1k.gltf|1024|1
drawer_cabinet|04_archive/drawer_cabinet/drawer_cabinet_1k.gltf|1024|1
books|04_archive/book_encyclopedia_set_01/book_encyclopedia_set_01_1k.gltf|1024|1
worn_rack|04_archive/worn_metal_rack/worn_metal_rack_1k.gltf|1024|1
office_desk|03_command_center/metal_office_desk/metal_office_desk_2k.gltf|1024|1
office_chair|03_command_center/sf_office_chair_41973a/office_chair.glb|1024|0.4
wall_clock|03_command_center/wall_clock/wall_clock_1k.gltf|512|1
desk_lamp|06_director_office/desk_lamp_arm_01/desk_lamp_arm_01_1k.gltf|512|1
clipboard|03_command_center/clipboard/clipboard_1k.gltf|512|1
laptop|03_command_center/classic_laptop/classic_laptop_1k.gltf|1024|1
"
echo "$LIST" | while IFS='|' read n src tex r; do
  [ -z "$n" ] && continue
  [ -n "$1" ] && ! echo "$n" | grep -qE "$1" && continue
  [ -f "$O/$n.glb" ] && [ -z "$FORCE" ] && continue
  if [ "$r" = "1" ]; then SIMP="--simplify false"; else SIMP="--simplify-ratio $r --simplify-error 0.002"; fi
  npx gltf-transform optimize "$S/$src" "$O/$n.glb" --compress meshopt --texture-compress webp --texture-size $tex $SIMP >/tmp/gt_$n.log 2>&1 && echo "OK $n $(du -k $O/$n.glb|cut -f1)K" || { echo "FAIL $n"; tail -3 /tmp/gt_$n.log; }
done
