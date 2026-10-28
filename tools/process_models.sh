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
grandfather_clock|06_director_office/vintage_grandfather_clock_01/vintage_grandfather_clock_01_2k.gltf|1024|1
picture_frame|06_director_office/fancy_picture_frame_01/fancy_picture_frame_01_1k.gltf|1024|1
fluorescent|07_underground_machine/mounted_fluorescent_lights/mounted_fluorescent_lights_1k.gltf|512|1
chandelier|06_director_office/Chandelier_01/Chandelier_01_2k.gltf|1024|1
gothic_cabinet|06_director_office/GothicCabinet_01/GothicCabinet_01_2k.gltf|1024|1
caged_light|07_underground_machine/caged_hanging_light/caged_hanging_light_1k.gltf|512|1
tv_screen|02_security_hall/usd_tv_100mrgb95bu/tv_100mrgb95bu.glb|1024|0.05
vault_door_anim|05_containment_vault/sc_vault_door_animated/vault_door_animated.glb|1024|0.3
vault_door|05_containment_vault/sf_vault_door_20d25f/vault_door.glb|1024|0.5
armored_cabinet|05_containment_vault/sf_armored_cabinet_d16736/armored_cabinet.glb|1024|1
safe_small|05_containment_vault/sf_safe_small_square_digital_6e8a44/safe_small_square_digital.glb|1024|1
gem_skull|05_containment_vault/sc_gemstone_skull/gemstone_skull.glb|1024|0.2
rusty_lantern|05_containment_vault/sc_rusty_lantern/rusty_lantern.glb|1024|0.5
amber|05_containment_vault/kh_MosquitoInAmber/MosquitoInAmber.glb|1024|0.5
chrono_watch|05_containment_vault/kh_ChronographWatch/ChronographWatch.glb|1024|0.5
candle_holder|05_containment_vault/kh_GlassHurricaneCandleHolder/GlassHurricaneCandleHolder.glb|1024|1
vase|05_containment_vault/antique_ceramic_vase_01/antique_ceramic_vase_01_1k.gltf|512|1
bull_head|05_containment_vault/bull_head/bull_head_2k.gltf|1024|0.5
chem_set|05_containment_vault/chemistry_set/chemistry_set_1k.gltf|1024|1
plastic_container|05_containment_vault/industrial_pastic_container/industrial_pastic_container_1k.gltf|512|1
storage_cart|05_containment_vault/industrial_storage_cart/industrial_storage_cart_1k.gltf|1024|1
marble_bust|05_containment_vault/marble_bust_01/marble_bust_01_2k.gltf|1024|0.5
gas_mask|05_containment_vault/old_gas_mask/old_gas_mask_1k.gltf|512|1
military_crate|05_containment_vault/old_military_crate/old_military_crate_1k.gltf|1024|1
ornate_mirror|05_containment_vault/ornate_mirror_01/ornate_mirror_01_2k.gltf|1024|1
pocket_watch|05_containment_vault/pocket_watch/pocket_watch_1k.gltf|512|1
microscope|05_containment_vault/vintage_microscope/vintage_microscope_1k.gltf|1024|1
bronze_fangyi|05_containment_vault/si_d8c62f94/f1930_54-part_02-smartscan-fixed-textured-150k-4096_std.glb|1024|0.25
bronze_gong|05_containment_vault/si_d8c646aa/f1961_33-part_01-laser-ortery_texture-150k-4096_std.glb|1024|0.25
bronze_gui|05_containment_vault/sf_gui_food_vessel_10th_century_bce_12073f/gui_food_vessel_10th_century_bce.glb|1024|0.4
coral|05_containment_vault/si_1d711ba1/Flabellum_-Ulocyathus-_marenzelleri-150k-4096_std.glb|1024|0.25
monitor|03_command_center/usd_computer_monitor_office_a01/computer_monitor_office_a01.glb|512|0.5
keyboard|03_command_center/usd_computer_keyboard_a01/sm_computer_keyboard_a01_01.glb|512|0.5
wall_console|03_command_center/sf_large_wall_mounted_computer_console_298b7d/large_wall_mounted_computer_console.glb|1024|1
projector|03_command_center/projector_screen/projector_screen_1k.gltf|512|1
telegraph|03_command_center/si_ed99f44d/morse-telegraph-key-150k-4096.glb|1024|0.2
notepads|03_command_center/office_notepads/office_notepads_1k.gltf|512|1
server_rack|07_underground_machine/sf_server_rack_c144d8/server_rack.glb|1024|0.5
"
echo "$LIST" | while IFS='|' read n src tex r; do
  [ -z "$n" ] && continue
  [ -n "$1" ] && ! echo "$n" | grep -qE "$1" && continue
  [ -f "$O/$n.glb" ] && [ -z "$FORCE" ] && continue
  if [ "$r" = "1" ]; then SIMP="--simplify false"; else SIMP="--simplify-ratio $r --simplify-error 0.002"; fi
  npx gltf-transform optimize "$S/$src" "$O/$n.glb" --compress meshopt --texture-compress webp --texture-size $tex $SIMP >/tmp/gt_$n.log 2>&1 && echo "OK $n $(du -k $O/$n.glb|cut -f1)K" || { echo "FAIL $n"; tail -3 /tmp/gt_$n.log; }
done
