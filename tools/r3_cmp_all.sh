#!/bin/bash
# 批次5 全区对比图：bash work/r3/cmp_all.sh [只跑的 key...]
P=/workspace/projects/b2c90d19-7034-43fd-aea1-521ddd72406e; S=$P/game/screenshots; R=$S/r3; W=$P/work/r3; B=$W/before
export PYTHONPATH=/workspace/work/pylib
c(){ k=$1; shift; if [ -n "$ONLY" ] && [[ " $ONLY " != *" $k "* ]]; then return; fi; python3 $P/game/tools/r3_compare3.py $W/cmp_$k.png "$@" | tail -1; }
c floor3_office "3F 西 · 政策研究室/法务处" "R3 前（batch0）" $B/floor3.png $R/floor3_office.png $W/plan_floor3_office.png $R/floor3_office_top.png $R/floor3_legal.png $R/floor3_pantry.png $R/floor3_office_b.png
c floor2_liaison "2F 东 · 国际联络处" "R3 前" $B/liaison.png $R/liaison_r3.png $W/plan_floor2_liaison.png $R/liaison_r3_top.png $R/liaison_r3_b.png $R/liaison_office.png $R/liaison_wall.png
c floor2_pub "2F 西 · 宣传处" "R3 前" $B/publicity.png $R/pub_r3.png $W/plan_floor2_pub.png $R/pub_r3_top.png $R/pub_r3_b.png $R/pub_press.png $R/pub_edit.png $R/pub_lobby.png
c director "12F · 局长室" "R3 前" $B/director.png $R/director_r3.png $W/plan_director.png $R/director_top.png $R/director_r3_b.png
c gate "1F · 正门门廊/服务台" "M6 旧" $S/m6/gate.png $R/gate_r3.png $W/plan_gate.png $R/gate_top.png $R/gate_r3_b.png
c archive "档案馆" "M6 旧" $S/m6/archive.png $R/archive_r3.png $W/plan_archive.png $R/archive_top.png $R/archive_shelf.png $R/archive_west.png
c command_center "指挥中心" "旧（无同机位）" - $R/cc_r3.png $W/plan_command_center.png $R/cc_top.png $R/cc_r3_b.png $R/cc_comm.png
c canteen "食堂" "M4b 旧" $S/m4b/canteen.png $R/canteen_r3.png $W/plan_canteen.png $R/canteen_top.png $R/canteen_line.png $R/canteen_side.png
c medical "3F 东 · 医务室" "旧（无同机位）" - $R/med_r3.png $W/plan_medical.png $R/med_top.png $R/med_b.png $R/med_ward.png
c dorm "宿舍 1F/2F" "M7 旧" $S/m7/dorm_lobby.png $R/dorm_lobby.png $W/plan_dorm.png $R/dorm_top.png $R/dorm_lobby_b.png $R/dorm_lounge.png $R/dorm2_top.png $W/plan_dorm2.png
c interrogation "B2 · 审讯室" "M4b 旧" $S/m4b/interrogation.png $R/int_r3.png $W/plan_interrogation.png $R/int_top.png $R/int_obs.png
c hangar "飞行器机库" "M7 旧" $S/m7/hangar.png $R/hangar_r3.png $W/plan_hangar.png $R/hangar_top.png $R/hangar_b.png
c b1 "B1 · 装卸区/档案分库" "M4b 旧" $S/m4b/b1.png $R/b1_dock.png $W/plan_b1.png - $R/ab1_r3.png $R/ab1_east.png $W/plan_archive_b1.png
c b2 "B2 · 机电间" "旧（无同机位）" - $R/b2_mech.png $W/plan_b2.png - $R/b2_mech_b.png
c b4 "B4" "旧（无同机位）" - $R/b4_r3.png $W/plan_b4.png -
c b5 "B5" "旧（无同机位）" - $R/b5_r3.png $W/plan_b5.png -
c b6 "B6 · 检修层" "旧（无同机位）" - $R/b6_maint.png $W/plan_b6.png -
c b7 "B7 · 深渊门" "M5 旧" $S/m5/abyss_gate.png $R/b7_r3.png $W/plan_b7.png -
# —— 批次7 新做区 / 补全 / 墙面 PBR ——
c training "B6 · 驯化副本训练场（批次7）" "批次6" $B/training_b6.png $R/training_r3.png $W/plan_training.png $R/training_top.png $R/training_b.png $R/training_range.png
c metro "地铁管理局站 B 口 · 地面广场（批次7）" "批次6（M7 机位）" $B/metro_b6.png $R/metro_r3.png $W/plan_metro.png $R/metro_top.png $R/metro_b.png
c memorial "无字碑廊（批次7 补强）" "M5 旧" $S/m5/memorial.png $R/memorial_r3.png $W/plan_memorial.png - $R/memorial.png
c s7_ops "第七局 · 作战室（批次7）" "批次6" $B/seventh_ops_b6.png $R/seventh_ops.png $W/plan_s7_ops.png $R/s7_ops_top.png $R/s7_ops_b.png
c s7_wrap "第七局 · 杀青室（批次7）" "批次6" $B/seventh_wrap_b6.png $R/seventh_wrap.png $W/plan_s7_wrap.png -
c abyss "墨渊 · 倒悬书城 / 考场母本（批次7）" "批次6" $B/abyss_city_b6.png $R/abyss_city.png $W/plan_abyss_city.png - $R/abyss_exam.png $W/plan_abyss_exam.png $B/abyss_exam_b6.png
c b5_deep "B5 · 深库主室（批次7 补全黑空间）" "批次6（前室机位）" $B/b5_r3_b6.png $R/b5_deep.png $W/plan_b5_deep.png -
