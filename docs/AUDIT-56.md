# AUDIT-56 · 穿模 / 图片比例 / 图片支撑 / 配色 审计（脚本 tools/audit56.sh + tools/audit56.py）

## 1 落地件 ↔ 隔断 / 墙板 / 屏风 穿插（三轴都 >3 cm）：2 处
|区|物件|tag|x|z|撞到|隔断tag|水平穿入 m|
|-|-|-|-|-|-|-|-|
|floor2_liaison|r2/coat_rack|联络官室|21|-101.95|dz_wain|门扇|0.352|
|floor2_liaison|file_cabinet|联络官室|21|-107.05|dz_wain|门扇|0.352|

## 2 落地件 ↔ 落地件 互插（水平 >6 cm）：90 处
|区|A|B|x|z|穿入 m|
|-|-|-|-|-|-|
|abyss_core|r2/antique_desk|r2/worn_leather_office_chair|0.33|-235.32|1.581|
|abyss_core|r2/antique_desk|r2/worn_leather_office_chair|1.09|-219.96|1.542|
|abyss_core|r2/antique_desk|r2/worn_leather_office_chair|-1.1|-222.57|1.385|
|abyss_core|r2/antique_desk|r2/worn_leather_office_chair|13.0|-237.34|1.335|
|abyss_core|r2/antique_desk|r2/worn_leather_office_chair|17.64|-232.41|1.264|
|abyss_core|r2/antique_desk|r2/worn_leather_office_chair|4.07|-218.16|1.205|
|abyss_core|r2/antique_desk|r2/worn_leather_office_chair|6.33|-238.47|0.886|
|abyss_core|r2/antique_desk|r2/worn_leather_office_chair|-2.53|-229.19|0.803|
|library|r2/woodentable_01|r2/dining_chair_02|5.23|-111.23|0.622|
|library|r2/woodentable_01|r2/dining_chair_02|5.23|-111.23|0.622|
|library|r2/woodentable_01|r2/dining_chair_02|5.23|-111.23|0.622|
|library|r2/woodentable_01|r2/dining_chair_02|5.23|-111.23|0.622|
|library|r2/woodentable_01|r2/dining_chair_02|-5.23|-111.23|0.622|
|library|r2/woodentable_01|r2/dining_chair_02|-5.23|-111.23|0.622|
|library|r2/woodentable_01|r2/dining_chair_02|-5.23|-111.23|0.622|
|library|r2/woodentable_01|r2/dining_chair_02|-5.23|-111.23|0.622|
|abyss_exam|r2/antique_desk|r2/worn_leather_office_chair|-43.6|-121|0.341|
|abyss_core|r2/worn_leather_office_chair|r2/worn_leather_office_chair|-1.83|-222.14|0.278|
|abyss_core|r2/worn_leather_office_chair|r2/medieval_book_stack|3.75|-217.37|0.237|
|b1|r2/plastic_broom|r2/dustpan|-15.5|-115.4|0.196|
|abyss_core|r2/worn_leather_office_chair|r2/medieval_book_stack|-3.38|-229.28|0.176|
|abyss_core|r2/worn_leather_office_chair|r2/medieval_book_stack|13.4|-238.09|0.153|
|floor2_pub|r2/coffee_table_round_01|r2/dining_chair_02|-11.2|-101.6|0.121|
|floor2_pub|r2/coffee_table_round_01|r2/dining_chair_02|-11.2|-101.6|0.121|
|b4|r2/old_computer_chair|r2/paper_waste_bin|0.18|-103.69|0.112|
|command_center|r2/old_computer_chair|r2/paper_waste_bin|28.42|-59.11|0.112|
|floor2_liaison|r2/old_computer_chair|r2/paper_waste_bin|11.18|-106.44|0.112|
|floor2_pub|r2/old_computer_chair|r2/paper_waste_bin|-15.82|-95.09|0.112|
|floor2_pub|r2/old_computer_chair|r2/paper_waste_bin|-23.61|-107.36|0.112|
|floor2_pub|r2/old_computer_chair|r2/paper_waste_bin|-23.25|-110.04|0.112|
|floor3_office|r2/old_computer_chair|r2/paper_waste_bin|-23.25|-100.24|0.112|
|floor3_office|r2/old_computer_chair|r2/paper_waste_bin|-17.86|-100.24|0.112|
|floor3_office|r2/old_computer_chair|r2/paper_waste_bin|-23.25|-104.84|0.112|
|floor3_office|r2/old_computer_chair|r2/paper_waste_bin|-17.86|-104.84|0.112|
|floor3_office|r2/old_computer_chair|r2/paper_waste_bin|-24.93|-93.61|0.112|
|floor2_pub|r2/coffee_table_round_01|r2/dining_chair_02|-11.2|-101.6|0.103|
|abyss_core|r2/antique_desk|r2/medieval_book_stack|4.07|-218.16|0.096|
|abyss_core|r2/worn_leather_office_chair|r2/medieval_book_stack|18.41|-232.76|0.089|
|floor3_office|office_desk|r2/old_computer_chair|-25.36|-102.05|0.089|
|floor3_office|office_desk|r2/old_computer_chair|-23.43|-106.66|0.088|
|floor3_office|office_desk|r2/old_computer_chair|-25.36|-105.75|0.088|
|floor2_pub|office_desk|r2/old_computer_chair|-25|-96|0.085|
|floor2_pub|office_desk|r2/old_computer_chair|-23.43|-105.55|0.085|
|floor3_office|office_desk|r2/old_computer_chair|-25.36|-106.66|0.085|
|floor2_pub|office_desk|r2/old_computer_chair|-25.36|-110.95|0.083|
|floor3_office|office_desk|r2/old_computer_chair|-19.96|-101.14|0.083|
|medical|office_desk|r2/old_computer_chair|5|-101.1|0.083|
|floor2_liaison|office_desk|r2/old_computer_chair|6.2|-107.34|0.082|
|floor2_pub|office_desk|r2/old_computer_chair|-25.36|-111.86|0.082|
|floor3_office|office_desk|r2/old_computer_chair|-19.96|-105.75|0.082|
|floor3_office|office_desk|r2/old_computer_chair|-22.77|-92.7|0.082|
|floor3_office|office_desk|r2/old_computer_chair|-11.3|-108.75|0.081|
|floor2_pub|office_desk|r2/old_computer_chair|-25.36|-106.45|0.08|
|floor2_pub|office_desk|r2/old_computer_chair|-23.43|-111.86|0.08|
|floor3_office|office_desk|r2/old_computer_chair|-19.96|-102.05|0.079|
|floor3_office|office_desk|r2/old_computer_chair|-11.3|-111.55|0.079|
|medical|office_desk|r2/old_computer_chair|7.6|-107.6|0.079|
|floor3_office|office_desk|r2/old_computer_chair|-23.43|-102.05|0.078|
|floor2_pub|office_desk|r2/old_computer_chair|-25.36|-105.55|0.076|
|command_center|office_desk|r2/old_computer_chair|26.4|-58.2|0.075|
|floor2_pub|office_desk|r2/old_computer_chair|-19|-96|0.075|
|floor2_pub|office_desk|r2/old_computer_chair|-0.7|-101|0.075|
|floor3_office|office_desk|r2/old_computer_chair|-19.96|-106.66|0.074|
|floor3_office|office_desk|r2/old_computer_chair|-18.04|-106.66|0.074|
|director|office_desk|r2/old_computer_chair|-6|-95.6|0.073|
|floor3_office|office_desk|r2/old_computer_chair|-26.73|-92.7|0.073|
|floor3_office|office_desk|r2/old_computer_chair|-18.04|-102.05|0.072|
|archive_b1|r2/antique_desk|r2/literary_club_chair_preview|-48.5|-34.6|0.071|
|exam_center|r2/antique_desk|r2/literary_club_chair_preview|31.8|-74|0.071|
|exam_center|r2/antique_desk|r2/literary_club_chair_preview|38.2|-74|0.071|
|floor2_liaison|r2/antique_desk|r2/literary_club_chair_preview|23.6|-100|0.071|
|floor2_liaison|r2/antique_desk|r2/literary_club_chair_preview|23.6|-105|0.071|
|floor2_liaison|office_desk|r2/old_computer_chair|11|-108.25|0.071|
|floor2_liaison|r2/antique_desk|r2/literary_club_chair_preview|3.6|-100|0.071|
|floor2_pub|office_desk|r2/old_computer_chair|-22|-96|0.071|
|floor2_pub|r2/antique_desk|r2/literary_club_chair_preview|-17.9|-101.5|0.071|
|floor2_pub|office_desk|r2/old_computer_chair|-0.7|-103.3|0.071|
|floor3_office|r2/antique_desk|r2/literary_club_chair_preview|-12.4|-104.6|0.071|
|floor3_office|r2/antique_desk|r2/literary_club_chair_preview|-18|-112.4|0.071|
|floor3_office|office_desk|r2/old_computer_chair|-25.36|-101.14|0.07|
|floor2_liaison|office_desk|r2/old_computer_chair|6.2|-108.25|0.069|
|abyss_core|r2/antique_desk|r2/medieval_book_stack|13.0|-237.34|0.063|
|library|r2/woodentable_01|r2/dining_chair_02|7.4|-106|0.061|
|library|r2/woodentable_01|r2/dining_chair_02|7.4|-106|0.061|
|library|r2/woodentable_01|r2/dining_chair_02|-7.4|-106|0.061|
|library|r2/woodentable_01|r2/dining_chair_02|-7.4|-106|0.061|
|library|r2/woodentable_01|r2/dining_chair_02|7.4|-106|0.06|
|library|r2/woodentable_01|r2/dining_chair_02|7.4|-106|0.06|
|library|r2/woodentable_01|r2/dining_chair_02|-7.4|-106|0.06|
|library|r2/woodentable_01|r2/dining_chair_02|-7.4|-106|0.06|

## 3 图片宽高比偏差 >3%：32 张
|区|图|x|z|原图|原比|平面w|平面h|平面比|偏差%|
|-|-|-|-|-|-|-|-|-|-|
|s7_wrap|textures/b06/B06_杀青室档案墙.png|-2.6|-157.77|1536x864|1.778|0.9|1.2|0.75|57.8|
|east_cloister|textures/emblems/势力档案-无妄城.jpg|24.23|-86|1600x900|1.778|0.8|1|0.8|55.0|
|east_cloister|textures/emblems/势力档案-深瞳.jpg|24.23|-92|1600x900|1.778|0.8|1|0.8|55.0|
|east_cloister|textures/emblems/势力档案-焚稿会.jpg|24.23|-98|1600x900|1.778|0.8|1|0.8|55.0|
|east_cloister|textures/emblems/势力档案-余辉剧团.jpg|24.23|-104|1600x900|1.778|0.8|1|0.8|55.0|
|b5_deep|textures/b07/B07_畸变物上交须知.png|2.9|-100.42|1536x1152|1.333|0.6|0.8|0.75|43.8|
|s7_ops|textures/b06/B06_K的工作笔记.png|-9.77|-128.4|1536x1152|1.333|0.6|0.8|0.75|43.8|
|training|textures/b07/B07_副本投放调度单.png|-6.4|-92.25|1536x1152|1.333|0.6|0.8|0.75|43.8|
|training|textures/b07/B07_副本投放调度单.png|6.4|-92.25|1536x1152|1.333|0.6|0.8|0.75|43.8|
|metro|textures/b01/B01_02_局旗深蓝.png|-11|104.22|1024x1536|0.667|0.55|1.3|0.423|36.5|
|metro|textures/b01/B01_08_海报_规则之泉.png|-11|116.22|1024x1536|0.667|0.55|1.3|0.423|36.5|
|metro|textures/b01/B01_02_局旗深蓝.png|-11|136.22|1024x1536|0.667|0.55|1.3|0.423|36.5|
|metro|textures/b01/B01_08_海报_规则之泉.png|-11|148.22|1024x1536|0.667|0.55|1.3|0.423|36.5|
|metro|textures/b01/B01_02_局旗深蓝.png|-11|160.22|1024x1536|0.667|0.55|1.3|0.423|36.5|
|metro|textures/b01/B01_08_海报_规则之泉.png|11|104.22|1024x1536|0.667|0.55|1.3|0.423|36.5|
|metro|textures/b01/B01_02_局旗深蓝.png|11|115.82|1024x1536|0.667|0.55|1.3|0.423|36.5|
|metro|textures/b01/B01_08_海报_规则之泉.png|11|136.22|1024x1536|0.667|0.55|1.3|0.423|36.5|
|metro|textures/b01/B01_02_局旗深蓝.png|11|152.22|1024x1536|0.667|0.55|1.3|0.423|36.5|
|metro|textures/b01/B01_08_海报_规则之泉.png|11|160.22|1024x1536|0.667|0.55|1.3|0.423|36.5|
|training|textures/b01/B01_02_局旗深蓝.png|-4.6|-104|1024x1536|0.667|1.4|3.2|0.437|34.4|
|training|textures/b01/B01_02_局旗深蓝.png|4.6|-104|1024x1536|0.667|1.4|3.2|0.437|34.4|
|training|textures/b01/B01_02_局旗深蓝.png|-4.6|-112|1024x1536|0.667|1.4|3.2|0.437|34.4|
|training|textures/b01/B01_02_局旗深蓝.png|4.6|-112|1024x1536|0.667|1.4|3.2|0.437|34.4|
|command_center|textures/b07/B07_预警发布流程.png|45.4|-60.8|1536x1536|1.0|0.75|1|0.75|25.0|
|dorm|textures/b07/B07_员工公告栏.png|53.23|16|1536x864|1.778|1.1|0.82|1.341|24.5|
|citizen_service|textures/b01/T01_正门大厅告示牌.png|28.9|-32.45|1152x1536|0.75|2.1|2.5|0.84|12.0|
|citizen_service|textures/b01/B01_18_档案馆规章铜牌.png|41.1|-32.45|1152x1536|0.75|2.1|2.5|0.84|12.0|
|gate|textures/b01/T01_访客须知告示牌.png|-13.84|-20.15|1152x1536|0.75|0.6|0.85|0.706|5.9|
|exam_center|textures/b07/B07_高考真题卷.png|26|-75.95|1152x1536|0.75|0.9|1.27|0.709|5.5|
|exam_center|textures/b06/B06_考场母本试卷.png|44|-75.95|1024x1365|0.75|0.9|1.27|0.709|5.5|
|metro|textures/b05/B05_海报_篇幅补充剂.png|11.2|167.31|1024x1536|0.667|1.1|1.6|0.688|3.1|
|metro|textures/b01/B01_07_海报_叙事高考.png|8.8|167.31|1024x1536|0.667|1.1|1.6|0.688|3.1|

## 4 图片背后 9 cm 内无墙/板/展架（疑似悬空；hero GLB 内建墙不在规划数据里，需逐张核对）：17 张
|区|图|x|y|z|yaw|tag|
|-|-|-|-|-|-|-|
|b5_deep|textures/b07/B07_分级收容制度.png|-2.9|-40.2|-100.42|3.14|挂画|
|b5_deep|textures/b07/B07_畸变物上交须知.png|2.9|-40.2|-100.42|3.14|挂画|
|east_cloister|textures/emblems/势力档案-无妄城.jpg|24.23|3.95|-86|1.57|局史挂框|
|east_cloister|textures/emblems/势力档案-深瞳.jpg|24.23|3.95|-92|1.57|局史挂框|
|east_cloister|textures/emblems/势力档案-焚稿会.jpg|24.23|3.95|-98|1.57|局史挂框|
|east_cloister|textures/emblems/势力档案-余辉剧团.jpg|24.23|3.95|-104|1.57|局史挂框|
|east_cloister|textures/emblems/N01.jpg|24.23|3.9|-80.2|1.57|局史挂框|
|east_cloister|textures/emblems/N02.jpg|24.23|3.9|-109.4|1.57|局史挂框|
|s7_entry|textures/emblems/N02.jpg|0|-494.4|-53.45|3.14|挂画|
|s7_ops|textures/emblems/N02.jpg|-4.6|-495.8|-133.58|0|挂画|
|security_hall|textures/emblems/N01.jpg|0|13.8|-75.08|0|局徽主墙|
|training|textures/b07/B07_副本投放调度单.png|-6.4|-50.3|-92.25|3.14|挂画|
|training|textures/b07/B07_副本投放调度单.png|6.4|-50.3|-92.25|3.14|挂画|
|training|textures/b01/B01_02_局旗深蓝.png|-4.6|-41.3|-104|0|局旗|
|training|textures/b01/B01_02_局旗深蓝.png|4.6|-41.3|-104|0|局旗|
|training|textures/b01/B01_02_局旗深蓝.png|-4.6|-41.3|-112|0|局旗|
|training|textures/b01/B01_02_局旗深蓝.png|4.6|-41.3|-112|0|局旗|

## 5 本批处理结果（批次56，2026-10-31 22:21 接手，35 分钟上限）
- **已修**：市民大厅候号座椅（eastwing 固定 6 张）4.2→3.7 m，端部离两侧屏风 0.75 m；5 号窗等候 2 张 4.2→3.5 m、x 45.9→46.25，端部离 x 43.4 屏风 1.1 m。规划数据层面原本「名义间距」0.4–0.5 m 就未判为穿模，但用户截图里椅面明显插进屏风木墙裙 → 判断模型实际椅面比包围盒中心偏移/屏风腿座占位，故加大余量；**游戏内未复拍验收**。citizen_service r3plan 482 件 0 错 0 警。
- 表 1 两处（联络官室 coat_rack / file_cabinet ↔ 门扇 dz_wain）是开门 72° 门扇包围盒与柜重叠，门扇实际为斜放薄板，**未修，待下批游戏内看**。
- 表 2 大部分是「桌↔椅」（椅子塞进桌下，属正常），需人工剔除后再看；未逐条处理。
- 表 3 / 4（图片比例、悬空）**本批未修**，仅列清单。表 4 不含 hero GLB 内建墙，挂在 GLB 墙上的会被误报。
- 配色（全局材质，影响所有使用处）：M.wallPlaster 灰绿 0x6a7a72→米灰 0x8c8274（档案馆大墙）；M.carpet 0x6a2228→深酒红褐 0x4e2c22；M.baize 绿台呢→深棕皮革 0x3a281c；M.paintedGreen→暖灰 0x575046；dz_damaskGreen→暖灰褐 0x6b5b4a；r3_carpetGreen→驼色 0x7a6248；r3_carpetRed→深酒红褐 0x5c2c22；r3_feltGreen→驼色呢 0x5a4030。**未做**：dz_rugGreen、r3_rackGreen、市民大厅红面高脚凳（r2/metal_stool_01）、配色扫描脚本。
