// 截图机位（?shot=名称）：用于里程碑截图与视觉审阅
const Y = 1.8;
export const SHOTS = {
  plaza: { pos: [0, 1.7, 74], look: [0, 30, -40], fov: 70 },
  plaza_aerial: { pos: [70, 95, 150], look: [0, 25, -40], fov: 55 },
  plaza_fountain: { pos: [-22, 3.2, 48], look: [0, 6, 28], fov: 65 },
  facade_text: { pos: [0, 22, 42], look: [0, 33, -5], fov: 50 },
  facade: { pos: [6, 1.7, 14], look: [0, 30, -6], fov: 75 },
  gate: { pos: [-8, Y + 1.65, -8], look: [11, Y + 3, -18], fov: 72 },
  hall: { pos: [0, Y + 1.65, -32.5], look: [0, Y + 9, -60], fov: 75 },
  hall_vault: { pos: [6, Y + 1.6, -47], look: [-1, Y + 22, -58], fov: 80 },
  hall_aisle: { pos: [14.6, Y + 1.65, -33.5], look: [11, Y + 2.7, -66], fov: 72 },
  hall_gates: { pos: [-6, Y + 1.7, -35], look: [6, Y + 1.5, -44], fov: 70 },
  archive: { pos: [-22, Y + 1.7, -50], look: [-50, Y + 3, -52], fov: 75 },
  archive_gallery: { pos: [-54.6, Y + 6.2 + 1.6, -36], look: [-30, Y + 5, -40], fov: 75 },
  b1: { pos: [-26.5, Y - 6 + 1.7, -38.6], look: [-37, Y - 6 + 1.3, -40.5], fov: 72 },
  b1_seam: { pos: [-35.7, Y - 6 + 1.65, -39.0], look: [-36.2, Y - 6 + 1.5, -42], fov: 70 },
  east_door: { pos: [10, Y + 1.65, -48], look: [30, Y + 2.5, -46], fov: 72 },
  citizen: { pos: [22, Y + 1.65, -34], look: [40, Y + 2, -50], fov: 75 },
  exam: { pos: [44, Y + 1.65, -56], look: [26, Y + 2, -72], fov: 75 },
  command: { pos: [35, Y + 7 + 1.8 + 1.65, -58], look: [35, Y + 10, -34], fov: 75 },
  zonectl: { pos: [46, Y + 14 + 1.65, -36], look: [33, Y + 14.5, -48], fov: 72 },
  dispatch: { pos: [24, Y + 14 + 1.65, -64], look: [36, Y + 16, -74], fov: 72 },
  elev_hall: { pos: [3, Y + 1.65, -66], look: [-6, Y + 3, -76], fov: 72 },
  b3: { pos: [-3, -26 + 1.65, -94], look: [8, -26 + 1.5, -112], fov: 75 },
  b3_hall: { pos: [0, -26 + 1.65, -91], look: [6, -26 + 2, -84.5], fov: 75 },
  b4: { pos: [0, -34 + 1.65, -94], look: [0, -34 + 1.4, -130], fov: 72 },
  b5_door: { pos: [1.5, -42 + 1.65, -93], look: [0, -42 + 2.2, -100], fov: 72 },
  b5: { pos: [-2, -42 + 1.65, -103], look: [9, -42 + 1.6, -110], fov: 75 },
  b5_clock: { pos: [-6.5, -42 + 1.65, -106.5], look: [-9.6, -42 + 1.9, -108], fov: 65 },
  canteen: { pos: [12, Y + 1.65, -112], look: [-4, Y + 4, -134], fov: 75 },
  armory: { pos: [-12, -10 + 1.65, -95], look: [6, -10 + 1.5, -118], fov: 75 },
  interrogation: { pos: [0, -18 + 1.65, -94], look: [0.5, -18 + 1.4, -134], fov: 70 },
  training: { pos: [4, -52 + 2.2, -96], look: [0, -52 + 3, -134], fov: 78 },
  training_range: { pos: [10, -52 + 2.0, -136], look: [-2, -52 + 1.6, -152], fov: 75 },
  armory_bay: { pos: [-2, -10 + 1.65, -96], look: [10, -10 + 1.2, -116], fov: 75 },
  hall_board: { pos: [14.2, 1.8 + 1.65, -62.6], look: [17.4, 1.8 + 2.2, -64], fov: 60 },
  facade_sign: { pos: [0, 25, 20], look: [0, 33.0, -5], fov: 30 },
  canteen_roof: { pos: [-10, 1.8 + 1.65, -114], look: [4, 1.8 + 14, -130], fov: 80 },
  floor2: { pos: [3, 8.8 + 1.65, -95], look: [14, 8.8 + 2.6, -117], fov: 75 },
  floor3: { pos: [-11.5, 15.8 + 1.65, -94.5], look: [-24, 15.8 + 1.0, -114], fov: 75 },
  floor3_lab: { pos: [11.5, 15.8 + 1.65, -95], look: [22, 15.8 + 1.4, -114], fov: 75 },
  floor3_med: { pos: [-7.5, 15.8 + 1.65, -95.5], look: [4, 15.8 + 1.2, -114], fov: 75 },
  // R3 3F 西办公区：入口视角 / 科长位回看 / 俯视（裁顶棚）
  floor3_office: { pos: [-10.8, 15.8 + 1.65, -97.6], look: [-22, 15.8 + 1.1, -106], fov: 72 },
  floor3_office_b: { pos: [-26.5, 15.8 + 1.65, -97.9], look: [-14, 15.8 + 1.0, -104.5], fov: 72 },
  floor3_legal: { pos: [-10.3, 15.8 + 1.6, -101.95], look: [-13.6, 15.8 + 0.9, -105.6], fov: 72 },
  floor3_meet: { pos: [-21.3, 15.8 + 1.6, -116.7], look: [-26.2, 15.8 + 1.0, -110.6], fov: 72 },
  floor3_pantry: { pos: [-20.5, 15.8 + 1.6, -96.1], look: [-17.0, 15.8 + 0.9, -93.0], fov: 72 },
  liaison_office: { pos: [21.0, 8.8 + 1.6, -98.0], look: [25.2, 8.8 + 0.9, -101.6], fov: 72 },
  pub_r3: { pos: [-1.5, 8.8 + 1.65, -93.0], look: [-16, 8.8 + 1.2, -103.5], fov: 74 },
  pub_r3_b: { pos: [-26.6, 8.8 + 1.65, -116.6], look: [-22, 8.8 + 1.0, -100], fov: 72 },
  pub_press: { pos: [-14.0, 8.8 + 1.7, -104.9], look: [-14, 8.8 + 1.5, -116], fov: 72 },
  pub_edit: { pos: [-7.2, 8.8 + 1.6, -100.2], look: [-1.5, 8.8 + 1.0, -104.2], fov: 74 },
  pub_lobby: { pos: [-14.5, 8.8 + 1.65, -97.6], look: [-14.5, 8.8 + 1.3, -104], fov: 74 },
  pub_gear: { pos: [-0.8, 8.8 + 1.6, -107.7], look: [-7.0, 8.8 + 1.0, -107.7], fov: 78 },
  gate_r3: { pos: [-1.5, 1.8 + 1.65, -11.6], look: [9, 1.8 + 1.4, -19], fov: 74, zone: 'gate' },
  gate_r3_b: { pos: [8.6, 1.8 + 1.65, -27.8], look: [-8, 1.8 + 1.0, -14], fov: 74, zone: 'gate' },
  gate_top: { pos: [0, 1.8 + 34, -17.99], look: [0, 1.8, -18], fov: 50, clipY: 1.8 + 4.5, zone: 'gate' },
  archive_r3: { pos: [-21.0, 1.8 + 1.65, -51.5], look: [-40, 1.8 + 1.4, -55], fov: 76 },
  archive_shelf: { pos: [-28.2, 1.8 + 1.6, -40.65], look: [-21, 1.8 + 1.2, -40.65], fov: 72 },
  archive_west: { pos: [-46.5, 1.8 + 1.65, -46.0], look: [-55, 1.8 + 1.0, -36], fov: 74 },
  archive_loan: { pos: [-45.6, 1.8 + 1.6, -48.6], look: [-50.2, 1.8 + 0.85, -51.5], fov: 62, zone: 'archive' }, // 批次33：借阅柜台近景
  archive_top: { pos: [-38, 1.8 + 40, -50.99], look: [-38, 1.8, -51], fov: 52, clipY: 1.8 + 4.0, zone: 'archive' },
  cc_r3: { pos: [24.0, 8.8 + 1.7, -35.6], look: [36, 8.8 + 1.2, -50], fov: 76, zone: 'command_center' },
  cc_r3_b: { pos: [33.0, 8.8 + 1.8 + 1.65, -57.4], look: [35, 8.8 + 2.0, -36], fov: 76, zone: 'command_center' },
  cc_comm: { pos: [47.6, 8.8 + 1.8 + 1.6, -57.0], look: [43.6, 8.8 + 1.8 + 0.9, -60.7], fov: 78, zone: 'command_center' },
  cs_r3: { pos: [24.2, 1.8 + 1.7, -33.0], look: [37, 1.8 + 1.2, -50.5], fov: 74, zone: 'citizen_service' }, // 批次11：市民服务大厅（西南角看窗口）
  cs_r3_c: { pos: [23.5, 1.8 + 1.6, -46.1], look: [22.3, 1.8 + 0.6, -43.2], fov: 60, zone: 'citizen_service' }, // 批次36：西门内看引导台正面（Blender 精建 guide_desk 验收）
  cs_r3_e: { pos: [38.5, 1.8 + 1.7, -40.3], look: [56, 1.8 + 3.6, -40.3], fov: 72, zone: 'citizen_service' }, // 批次38：东墙两樘高窗线脚 + 来信投递验收
  cs_r3_b: { pos: [47.5, 1.8 + 1.7, -49.6], look: [27, 1.8 + 1.0, -37], fov: 74, zone: 'citizen_service' }, // 东北角回看候号区/填单台
  // 批次13：人物图片（通缉海报 / 证件照小卡）特写
  hall_wanted: { pos: [12.6, 1.8 + 2.0, -64], look: [17.4, 1.8 + 2.2, -64], fov: 70 },
  b1_wanted: { pos: [-13.0, -10 + 1.8, -114], look: [-15.75, -10 + 2.0, -114], fov: 60 },
  int_reg: { pos: [-8.5, -18 + 1.6, -101.7], look: [-8.5, -18 + 1.55, -104], fov: 60, zone: 'interrogation' },
  id_yexun: { target: 'pframe_叶寻', fov: 30, /* 批次33：tcam 删掉回默认 */ zone: 'archive',  pos: [-49.35, 1.8 + 1.9, -51.5], look: [-51.25, 1.8 + 0.62, -51.5] }, // 越过管理员柜台看叶寻空椅
  id_zhouwen: { target: 'pframe_周闻', fov: 30,  pos: [35.12, 10.6 + 1.3, -59.3], look: [35.12, 10.6 + 0.6, -59.95], /* 批次18：拉近、收窄视角让证件卡可读，配 eastwing 椅前补光 */ zone: 'command_center' }, // 批次16：再抬高后退一点，带上椅背与大衣 // 值班台高 1.06 > 椅背卡 0.86，只能从台北沿上方俯看
  id_yinze: { target: 'pframe_殷泽', fov: 30,  pos: [9.55, 1.8 + 1.45, -48.1], look: [9.4, 1.8 + 0.75, -47.05] },
  id_zhouye: { target: 'pframe_周也', fov: 30, pos: [3.6, -10 + 1.5, -122.6], look: [3.6, -10 + 0.7, -123.6], zone: 'armory' }, // 批次32
  id_qichou: { target: 'pframe_齐仇', fov: 30, pos: [-0.6, -34 + 1.5, -138.6], look: [-0.6, -34 + 0.7, -137.8], zone: 'vault_b4' }, // 批次32
  id_qilingyun: { target: 'pframe_齐凌云', fov: 30,  pos: [-2.7, 71.8 + 1.25, -109.0], look: [-2.55, 71.8 + 0.55, -109.95] }, // 批次31：对准椅面 A5 档案照片卡
  // 批次33：六处边几俯视（相框局部上方 3.2 m）
  top_yinze: { target: 'pframe_殷泽', tcam: [0, 3.2, 0.5], fov: 60, pos: [9.55, 6, -48.1], look: [9.4, 1.8, -47.05] },
  top_zhouye: { target: 'pframe_周也', tcam: [0, 3.2, 0.5], fov: 60, zone: 'armory', pos: [3.6, -6, -122.6], look: [3.6, -10, -123.6] },
  top_qichou: { target: 'pframe_齐仇', tcam: [0, 3.2, 0.5], fov: 60, zone: 'vault_b4', pos: [-0.6, -30, -138.6], look: [-0.6, -34, -137.8] },
  top_qilingyun: { target: 'pframe_齐凌云', tcam: [0, 3.2, 0.5], fov: 60, pos: [-2.7, 75, -109.0], look: [-2.55, 71.8, -109.95] },
  top_yexun: { target: 'pframe_叶寻', tcam: [0, 3.2, 0.5], fov: 60, zone: 'archive', pos: [-49.35, 5.5, -51.5], look: [-51.25, 1.8, -51.5] },
  top_zhouwen: { target: 'pframe_周闻', tcam: [0, 3.2, 0.5], fov: 60, zone: 'command_center', pos: [35.12, 14, -59.3], look: [35.12, 10.6, -59.95] },
  lobby_r3: { pos: [1.2, 15.8 + 1.65, -91.2], look: [-3.5, 15.8 + 1.6, -84.4], fov: 74, zone: 'floor3' }, // 批次12：3F 电梯厅（北口看电梯墙与西凳）
  lobby_r3_b: { pos: [7.6, 15.8 + 1.65, -85.0], look: [-6.5, 15.8 + 1.2, -91.4], fov: 74, zone: 'floor3' }, // 东南角回看北口/导览/花钵
  lobby_top: { pos: [0, 15.8 + 30, -87.99], look: [0, 15.8, -88], fov: 40, clipY: 15.8 + 4.6, zone: 'floor3' },
  lobby_4f: { pos: [1.2, 22.8 + 1.65, -91.2], look: [-3.5, 22.8 + 1.6, -84.4], fov: 74, zone: 'library' }, // 4F 藏书阁电梯厅
  es_land: { pos: [54.4, 5.3 + 1.65, -63.6], look: [54.6, 8.8 + 1.2, -54.5], fov: 72, zone: 'east_stair' }, // 批次12：东楼梯 1F→2F 中间平台看东跑上行
  es_land_b: { pos: [54.6, 5.3 + 1.65, -55.2], look: [51.8, 3.0, -63.0], fov: 72, zone: 'east_stair' }, // 东跑中段回看平台、层间铜牌、西跑
  lib_lec: { pos: [3.2, 22.8 + 1.7, -99.2], look: [0, 22.8 + 1.3, -106], fov: 58, zone: 'library' }, // 批次39：圆厅中轴东南看讲经台（Blender 精建 lib_lectern，正面雕饰 + 侧面）
  lib_lec_n: { pos: [2.6, 22.8 + 1.75, -102.9], look: [0, 22.8 + 1.35, -106], fov: 55, zone: 'library' }, // 批次40：讲经台东南 ≈4 m 近景（雕饰 + 诵经灯 + 补光）
  lib_lec_s: { pos: [-2.4, 22.8 + 1.8, -110.0], look: [0, 22.8 + 0.95, -106.8], fov: 58, zone: 'library' }, // 批次40：讲经台北侧（诵读者视角）看两级诵读台阶 + 斜面书托
  lib_vit: { pos: [-2.9, 22.8 + 1.55, -94.5], look: [-4.4, 22.8 + 1.0, -97.4], fov: 60, zone: 'library' }, // 批次38：入口西侧限阅陈列柜（Blender 精建 lib_vitrine）
  lib_globe: { pos: [4.6, 22.8 + 1.6, -110.2], look: [2.39, 22.8 + 0.85, -112.58], fov: 55, zone: 'library' }, // 批次41：北区东侧地球仪近景（Blender 精建 lib_globe）
  lib_r3: { pos: [0.4, 22.8 + 1.65, -94.4], look: [0, 22.8 + 1.0, -106], fov: 76, zone: 'library' }, // 批次12：藏书阁底层（入口看讲经台、借阅台/限阅柜）
  lib_r3_b: { pos: [8.6, 22.8 + 1.65, -111.8], look: [-3.0, 22.8 + 1.0, -100.5], fov: 76, zone: 'library' }, // 东北阅览桌旁回看入口
  lib_top: { pos: [0, 22.8 + 36, -105.99], look: [0, 22.8, -106], fov: 44, clipY: 22.8 + 4.0, zone: 'library' },
  cs_top: { pos: [35, 1.8 + 40, -42.49], look: [35, 1.8, -42.5], fov: 50, clipY: 1.8 + 4.8, zone: 'citizen_service' },
  ec_r3: { pos: [26.3, 1.8 + 1.65, -79.6], look: [25.0, 1.8 + 1.2, -100], fov: 70, zone: 'east_cloister' }, // 批次11：东廊（南口看陈列面）
  ec_r3_b: { pos: [25.2, 1.8 + 1.65, -110.2], look: [27.4, 1.8 + 1.0, -88], fov: 70, zone: 'east_cloister' }, // 拐角回看长凳面
  ec_vit_a: { pos: [25.75, 1.8 + 1.5, -86.9], look: [24.56, 1.8 + 0.88, -86.1], fov: 50, zone: 'east_cloister' }, // 批次12 收尾：展柜 1 特写（摊开的书/怀表/墨水瓶）
  ec_vit_b: { pos: [25.75, 1.8 + 1.5, -92.9], look: [24.56, 1.8 + 0.88, -92.1], fov: 50, zone: 'east_cloister' }, // 展柜 2 特写（档案盒/印章/旧相机）
  exam_r3: { pos: [41.5, 8.8 + 1.7, -62.0], look: [35, 8.8 + 1.5, -75.5], fov: 70, zone: 'exam_center' }, // 批次14 阅卷中心：进门 → 考位 / 监考台 / 钟
  exam_r3_b: { pos: [23.2, 8.8 + 2.2, -75.0], look: [44, 8.8 + 0.6, -63.5], fov: 66, zone: 'exam_center' }, // 西北角 → 考位成排 / 收发台
  exam_top: { pos: [35, 8.8 + 6.0, -61.8], look: [35, 8.8, -70.5], fov: 78, zone: 'exam_center' },
  zone_r3: { pos: [47.0, 15.8 + 1.75, -52.4], look: [30, 15.8 + 2.0, -60.4], fov: 70, zone: 'zone_control' }, // 批次16 区域管控室：东侧 → 监控台两排 + 地图墙
  zone_r3_b: { pos: [22.8, 15.8 + 2.1, -33.6], look: [42, 15.8 + 0.9, -52], fov: 70, zone: 'zone_control' }, // 西南角 → 沙盘 / 监控台 / 电话台
  lab_r3: { pos: [10.6, 15.8 + 1.7, -97.2], look: [20, 15.8 + 1.2, -116], fov: 72, zone: 'floor3' }, // 批次17 3F 理化实验室：进门 → 两组实验台 / 通风橱 / 测量仪
  lab_r3_b: { pos: [26.6, 15.8 + 1.8, -115.6], look: [11, 15.8 + 1.0, -103], fov: 70, zone: 'floor3' }, // 东北角（洗眼站旁）→ 实验台成排 / 黑板 / 仪器柜
  lab_top: { pos: [18.9, 15.8 + 30, -105.99], look: [18.9, 15.8, -106], fov: 55, clipY: 15.8 + 3.3, zone: 'floor3' },
  hall_r3: { pos: [0, 1.8 + 1.7, -45.6], look: [0, 1.8 + 4.2, -76], fov: 74, zone: 'security_hall' }, // 批次25 安检大厅 R3：扫描门后 → 查验柜台 / 等候区 / 局徽主墙
  hall_r3_b: { pos: [-13.4, 1.8 + 1.75, -45.4], look: [8, 1.8 + 1.1, -51.0], fov: 70, zone: 'security_hall' }, // 查验柜台一排
  hall_top: { pos: [0, 1.8 + 44, -52.99], look: [0, 1.8, -53], fov: 58, clipY: 1.8 + 5.0, zone: 'security_hall' },
  plaza_r3: { pos: [0, 1.7, 79.2], look: [0, 4.0, 36], fov: 72, zone: 'plaza' }, // 批次25 广场 R3：南口 → 岗亭 / 罗盘地徽 / 行道树列 / 泉
  plaza_r3_b: { pos: [15.6, 1.7, 70.5], look: [18.5, 2.6, 34], fov: 68, zone: 'plaza' }, // 批次26 原机位贴着东岗亭被挡 → 移到岗亭北侧；东侧带：告示栏 / 行道树 / 长椅 / 旗杆
  plaza_top: { pos: [0, 78, 40.01], look: [0, 0, 40], fov: 62, zone: 'plaza', expMul: 1.45 },
  wall_r3: { pos: [-46.37, 1.65, 56.2], look: [-44.37, 1.1, 60.3], fov: 74, zone: 'wall_posts' }, // 批次26 岗亭 R3：门内东侧 → 值班桌 / 执勤表 / 钥匙板 / 取暖炉
  wall_r3_b: { pos: [-44.46, 1.7, 59.58], look: [-47.45, 1.0, 55.45], fov: 74, zone: 'wall_posts' }, // 西北角 → 行军床 / 空步枪架 / 门窗（窗外探照灯光）
  wall_top: { pos: [-45.59, 30, 58.48], look: [-45.59, 0, 58.47], fov: 20, clipY: 3.9, zone: 'wall_posts' },
  ext_door_near: { pos: [0, 1.7, 9], look: [0, 6, -2], fov: 70, zone: 'plaza' }, // 批次26 外观诊断 ×6
  ext_door_mid: { pos: [10, 2.2, 21], look: [0, 16, -5], fov: 66, zone: 'plaza' }, // 批次27：原 [0,3,34] 镜头埋进泉心雕像
  ext_bird: { pos: [55, 60, 95], look: [0, 0, 20], fov: 55, zone: 'plaza' },
  ext_street: { pos: [0, 1.7, 96], look: [0, 3, 135], fov: 75, zone: 'plaza' },
  ext_side: { pos: [44, 26, 40], look: [10, 18, -20], fov: 66, zone: 'plaza' }, // 批次27：原 [70,10,20] 贴着附楼墙
  ext_booth: { pos: [6.5, 1.7, 66.5], look: [13, 1.6, 75], fov: 60, zone: 'plaza' }, // 批次27 E5 东岗亭近景
  ext_tree: { pos: [73.9, -4.4 + 1.6, 110.9], look: [75.4, -4.4 + 2.4, 113.9], fov: 50, zone: 'plaza' }, // 批次36：R160 内圈行道树树干近景（树皮 Bark007 验收）
  ext_house: { pos: [70.1, -4.4 + 1.7, 106.6], look: [84.9, -4.4 + 7, 113.4], fov: 65, zone: 'plaza' }, // 批次33：最内圈街屋立面模块近看（路心 R160 外看）
  ext_busstop: { pos: [39.5, -4.2 + 1.6, 111.8], look: [39.6, -4.4 + 1.8, 130.3], fov: 58, zone: 'plaza' }, // 批次39：改到环路内侧人行道隔路正看候车亭组（车道标线 / 路缘 / 人行道 / 报刊亭同框）
  ext_green: { pos: [-31.2, -4.32 + 1.6, 98.4], look: [-53.4, -4.4 + 2.2, 91.2], fov: 65, zone: 'plaza' }, // 批次39：南侧街心绿地人视角（西片，沿两列高干行道树看）
  ext_wallfoot: { pos: [-51.49, -4.4 + 1.6, 80.65], look: [-35.9, -4.4 + 0.8, 82.43], fov: 62, zone: 'plaza' }, // 批次42：城墙脚人视角（西片绿地内缘 r126.6 / −24° 看向 r122.8 / −17°），验收勒脚 / 散水 / 修剪绿篱带
  ext_sky: { pos: [0, 40, 200], look: [0, 20, -40], fov: 50, zone: 'plaza' },
  heli_r3: { pos: [96.5, 12.4 + 1.8, -56.0], look: [80, 12.4 + 0.6, -80], fov: 70, zone: 'helipad' }, // 批次23 屋顶停机坪：东南角 → H / 楼梯间 / 设备房
  heli_r3_b: { pos: [84.5, 12.4 + 1.7, -71.0], look: [84.0, 12.4 + 1.4, -84.0], fov: 78, zone: 'helipad' }, // 批次24：楼梯间 / 设备房南立面近景（檐口 / 雨渍 / 管线 / 百叶）
  heli_top: { pos: [86, 12.4 + 45, -69.99], look: [86, 12.4, -70], fov: 50, zone: 'helipad' },
  esa_r3: { pos: [53.4, 15.8 + 1.65, -53.4], look: [52.6, 15.8 + 1.4, -33], fov: 66, zone: 'zone_control' }, // 批次23 东楼梯前室走廊 3F：楼梯口 → 南（西门 / 公告栏 / 长凳 / 吊灯）
  esa_r3_b: { pos: [54.9, 15.8 + 1.7, -33.0], look: [51.4, 15.8 + 1.3, -50.5], fov: 66, zone: 'zone_control' }, // 南端东侧 → 北（西门门套铜牌 + 楼梯口 + 消火栓）
  esa_top: { pos: [53.06, 15.8 + 30, -43.01], look: [53.06, 15.8, -43], fov: 54, clipY: 15.8 + 4.4, zone: 'zone_control' },
  zone_top: { pos: [35, 15.8 + 40, -46.49], look: [35, 15.8, -46.5], fov: 50, clipY: 15.8 + 5.2, zone: 'zone_control' },
  ec_corner: { pos: [26.6, 1.8 + 1.6, -112.0], look: [19.0, 1.8 + 1.4, -114.2], fov: 70, zone: 'east_cloister' }, // 东西段公告栏 → 食堂口
  ec_top: { pos: [23.2, 1.8 + 46, -95.79], look: [23.2, 1.8, -95.8], fov: 50, clipY: 1.8 + 4.4, zone: 'east_cloister' },
  cc_r3_c: { pos: [37.6, 8.8 + 1.8 + 1.55, -56.5], look: [35, 8.8 + 1.8 + 0.7, -58.8], fov: 62, zone: 'command_center' }, // 批次36：平台前沿看北，正对值班长台精建（芯板立面 / 交换机 / 背墙挂图 / 壁灯）
  cc_top: { pos: [35, 8.8 + 34, -46.49], look: [35, 8.8, -46.5], fov: 50, clipY: 8.8 + 4.6, zone: 'command_center' },
  canteen_r3: { pos: [-3.0, 1.8 + 1.65, -111.6], look: [6, 1.8 + 1.3, -136], fov: 76 },
  canteen_line: { pos: [-7.0, 1.8 + 1.6, -134.8], look: [6, 1.8 + 1.1, -138.6], fov: 72 },
  canteen_side: { pos: [12.6, 1.8 + 1.6, -112.6], look: [16.5, 1.8 + 1.0, -134], fov: 70 },
  canteen_top: { pos: [0, 1.8 + 34, -124.99], look: [0, 1.8, -125], fov: 52, clipY: 1.8 + 5.6, zone: 'canteen' },
  b1_dock: { pos: [-8.8, -10 + 1.65, -113.0], look: [-15.5, -10 + 1.2, -121.5], fov: 76, zone: 'armory' },
  b2_mech: { pos: [-3.2, -18 + 1.65, -116.0], look: [-11.5, -18 + 1.0, -114.5], fov: 80, zone: 'interrogation' },
  b2_mech_b: { pos: [-11.8, -18 + 1.65, -114.6], look: [-4, -18 + 1.0, -123.5], fov: 80, zone: 'interrogation' },
  ab1_r3: { pos: [-30.0, -4.2 + 1.65, -33.2], look: [-50, -4.2 + 1.0, -40], fov: 76, zone: 'archive_b1' },
  ab1_east: { pos: [-23.2, -4.2 + 1.6, -38.6], look: [-21.0, -4.2 + 1.0, -58], fov: 72, zone: 'archive_b1' },
  vault_r3: { pos: [3.6, -26 + 1.7, -94.6], look: [-5.5, -26 + 1.1, -118], fov: 72, zone: 'vault_b3' }, // 批次19 B3 收容库：入口内 → 西侧收容格 / 钢架 / 标本柜 / 中轴展台
  vault_r3_b: { pos: [13.6, -26 + 1.75, -126.4], look: [9.5, -26 + 1.0, -100], fov: 70, zone: 'vault_b3' }, // 东北角 → 东侧收容格成排 + 钢架
  spine_r3: { pos: [-7.5, -26 + 1.7, -84.75], look: [1.2, -26 + 0.2, -89.4], fov: 72, zone: 'spine_b3' }, // 批次22：平视（原低头只拍到黑地面） // 批次20 中央竖井：B3 电梯厅西南角俯看竖井（栏杆 → B4 / B5 井架 / 井底轿厢）
  spine_r3_b: { pos: [-7.4, -42 + 1.65, -84.75], look: [0.6, -42 + 2.4, -88.6], fov: 72, zone: 'spine_b5' }, // 批次22：改平视 B5 井底轿厢（原仰拍顶棚） // B5 井底旁仰看：钢索 / 检修梯 / 上两层栏杆 + 层号
  blobby_r3: { pos: [-7.7, -10 + 1.65, -91.2], look: [5.5, -10 + 1.5, -84.3], fov: 72, zone: 'armory' }, // 批次22 B1 电梯厅（地下化）：西北角看两部电梯（客梯铜门 / 货梯铁闸门）+ 东墙长凳
  blobby_r3_b: { pos: [7.6, -10 + 1.65, -91.0], look: [-9, -10 + 1.5, -86.6], fov: 72, zone: 'armory' }, // 东北角看西墙：告示 / 层号 / 消火栓 / 防爆灯
  blobby_top: { pos: [0, -10 + 30, -87.99], look: [0, -10, -88], fov: 30, clipY: -10 + 4.9, zone: 'armory' },
  spine_top: { pos: [0, -26 + 40, -87.99], look: [0, -26, -88], fov: 32, clipY: -26 + 4.9, zone: 'spine_b3' },
  vault_top: { pos: [0, -26 + 42, -109.99], look: [0, -26, -110], fov: 50, clipY: -26 + 5.6, zone: 'vault_b3' },
  b4_r3: { pos: [0.6, -34 + 1.65, -97.0], look: [0, -34 + 1.0, -116], fov: 72, zone: 'vault_b4' },
  b5_r3: { pos: [-2.0, -42 + 1.65, -92.8], look: [5.5, -42 + 1.0, -97.5], fov: 80, zone: 'vault_b5' },
  // 批次7 新做区
  training_r3: { pos: [-4, -52 + 2.4, -95.5], look: [-14, -52 + 1.0, -112], fov: 76, zone: 'training' },
  training_b: { pos: [4, -52 + 2.4, -100], look: [12, -52 + 1.0, -112], fov: 74, zone: 'training' },
  training_top: { pos: [0, -52 + 62, -123.99], look: [0, -52, -124], fov: 58, clipY: -52 + 6.5, zone: 'training' },
  metro_r3: { pos: [6, -4 + 1.7, 166], look: [-4, -4 + 1.0, 148], fov: 72, zone: 'metro_exit' },
  metro_b: { pos: [-4, -4 + 1.7, 100.5], look: [-10, -4 + 1.0, 116], fov: 72, zone: 'metro_exit' },
  metro_top: { pos: [0, -4 + 62, 135.01], look: [0, -4, 135], fov: 60, zone: 'metro_exit' },
  memorial_r3: { pos: [-63, 1.7, 21.0], look: [-72, 1.0, 27], fov: 72, zone: 'memorial' },
  s7_ops_b: { pos: [-7.5, -500 + 1.7, -114], look: [6, -500 + 1.0, -126], fov: 76, zone: 'seventh_ops' },
  s7_ops_top: { pos: [0, -500 + 24, -122.99], look: [0, -500, -123], fov: 50, clipY: -500 + 4.2, zone: 'seventh_ops' },
  b5_deep: { pos: [0.5, -42 + 1.7, -101.2], look: [-1, -42 + 1.0, -124], fov: 76, zone: 'vault_b5' },
  b6_maint: { pos: [-27.5, -52 + 1.7, -138.0], look: [-31.8, -52 + 2.6, -148], fov: 76, zone: 'training' },
  med_r3: { pos: [0.6, 15.8 + 1.65, -93.0], look: [-3.5, 15.8 + 1.0, -107], fov: 76, zone: 'floor3' },
  med_b: { pos: [8.4, 15.8 + 1.65, -118.6], look: [-2, 15.8 + 1.0, -101], fov: 76, zone: 'floor3' },
  med_ward: { pos: [-3.8, 15.8 + 1.6, -99.9], look: [-8.5, 15.8 + 0.8, -107], fov: 72, zone: 'floor3' },
  med_top: { pos: [0, 15.8 + 27, -105.99], look: [0, 15.8, -106], fov: 55, clipY: 15.8 + 3.3, zone: 'floor3' },
  int_r3: { pos: [-12.0, -18 + 1.6, -95.8], look: [-9.4, -18 + 0.8, -102.5], fov: 76, zone: 'interrogation' },
  int_obs: { pos: [-3.0, -18 + 1.65, -96.0], look: [-7.4, -18 + 1.2, -102.0], fov: 76, zone: 'interrogation' },
  int_top: { pos: [-7.5, -18 + 22, -100.99], look: [-7.5, -18, -101], fov: 44, clipY: -18 + 3.6, zone: 'interrogation' },
  b7_r3: { pos: [0, -300 + 1.7, -64.5], look: [0, -300 + 1.6, -54], fov: 80, zone: 'abyss_gate' },
  liaison_wall: { pos: [11.0, 8.8 + 1.7, -103.5], look: [11.0, 8.8 + 1.5, -117.5], fov: 76 },
  pub_r3_top: { pos: [-14.0, 8.8 + 27, -104.99], look: [-14.0, 8.8, -105], fov: 55, clipY: 8.8 + 3.6, zone: 'floor2' },
  floor3_office_desk: { pos: [-19.2, 15.8 + 1.5, -99.2], look: [-23.2, 15.8 + 0.7, -102.6], fov: 65 },
  floor3_office_top: { pos: [-18.8, 15.8 + 28, -105.99], look: [-18.8, 15.8, -106], fov: 55, clipY: 15.8 + 3.3, zone: 'floor3' },
  // R3 2F 国际联络处
  liaison_r3: { pos: [4.0, 8.8 + 1.65, -93.4], look: [16, 8.8 + 1.2, -108], fov: 72 },
  liaison_r3_b: { pos: [26.0, 8.8 + 1.65, -116.4], look: [8, 8.8 + 1.0, -99], fov: 72 },
  liaison_r3_top: { pos: [14.1, 8.8 + 27, -104.99], look: [14.1, 8.8, -105], fov: 55, clipY: 8.8 + 3.6, zone: 'floor2' },
  library: { pos: [0, 22.8 + 1.65, -95], look: [0, 22.8 + 14, -112], fov: 80 },
  director: { pos: [5, 71.8 + 1.65, -94], look: [-2, 71.8 + 2, -110], fov: 72 },
  director_r3: { pos: [-2.2, 71.8 + 1.65, -93.0], look: [3, 71.8 + 1.0, -104], fov: 74 },
  director_r3_b: { pos: [-11.2, 71.8 + 1.7, -109.6], look: [4, 71.8 + 1.0, -96], fov: 72 },
  director_top: { pos: [0, 71.8 + 30, -101.99], look: [0, 71.8, -102], fov: 52, clipY: 71.8 + 4.2, zone: 'director' },
  director_fire: { pos: [-4, 71.8 + 1.65, -106], look: [-12, 71.8 + 1.8, -98], fov: 72 },
  liaison: { pos: [3, 8.8 + 1.65, -116], look: [20, 8.8 + 2.2, -98], fov: 75 },
  publicity: { pos: [-3, 8.8 + 1.65, -95], look: [-20, 8.8 + 2.4, -113], fov: 75 },
  dorm_lobby: { pos: [60.5, 1.65, 13.4], look: [55, 1.4, 22], fov: 78 },
  dorm_lobby_b: { pos: [54.4, 1.65, 18.6], look: [60, 1.2, 25], fov: 76, zone: 'dorm' },
  dorm_lounge: { pos: [61.2, 4.6 + 1.65, 25.0], look: [55, 4.6 + 1.0, 15.5], fov: 76, zone: 'dorm' },
  dorm_top: { pos: [57.6, 26, 20.01], look: [57.6, 0, 20], fov: 50, clipY: 3.9, zone: 'dorm' },
  dorm_r3: { pos: [64.0, 9.24 + 1.65, 29.0], look: [63.0, 9.24 + 1.1, 4.0], fov: 72, zone: 'dorm' }, // 批次21：3F 单间层中走廊（北 → 南）
  dorm_r3_b: { pos: [61.5, 9.24 + 1.6, 20.3], look: [57.4, 9.24 + 0.8, 21.0], fov: 76, zone: 'dorm' }, // 306 剧情锚点间：空床 + 信 + 合影
  dorm_r3_c: { pos: [57.5, 9.24 + 1.7, 19.2], look: [60.6, 9.24 + 0.75, 22.2], fov: 80, zone: 'dorm' }, // 批次35：306 西南角（书桌旁）看东北——左缘床头枕头 + 毛毯卷、正前门扇、右缘衣柜（验收深胡桃）
  dorm3_top: { pos: [63.3, 9.24 + 30, 20.01], look: [63.3, 9.24, 20], fov: 54, clipY: 9.24 + 3.0, zone: 'dorm' },
  dorm2_top: { pos: [57.6, 30, 20.01], look: [57.6, 4.6, 20], fov: 50, clipY: 4.6 + 3.6, zone: 'dorm' },
  dorm_room: { pos: [66, 1.65, 9.6], look: [76, 1.0, 3], fov: 75 },
  dorm_207: { pos: [66.6, 4.6 + 1.65, 27.8], look: [77, 4.6 + 0.9, 22.5], fov: 75 },
  dorm_101b: { pos: [77.4, 1.6, 9.8], look: [67, 1.0, 3.6], fov: 75 },
  hangar: { pos: [75, 1.7, -72], look: [92, 3, -64], fov: 75 },
  hangar_r3: { pos: [74.6, 1.7, -70], look: [90, 2.2, -70], fov: 78 },
  hangar_b: { pos: [97, 2.2, -55], look: [80, 1.5, -78], fov: 76 },
  hangar_top: { pos: [86.2, 46, -69.99], look: [86.2, 0, -70], fov: 50, clipY: 11.2, zone: 'hangar' },
  helipad_roof: { pos: [77.5, 14.1, -57.5], look: [86, 13, -72], fov: 75 },
  wall_post: { pos: [-43.6, 1.7, 54.6], look: [-47.3, 2.2, 62.1], fov: 70, zone: 'wall_posts' },
  wall_post_out: { pos: [-45.2, 2.1, 48.7], look: [-46.2, 1.9, 59.85], fov: 66, zone: 'wall_posts' }, // 批次10：门外前坪全景（正前 13 m、偏西 4 m）
  memorial: { pos: [-60.5, 1.7, 44], look: [-66, 1.0, 20], fov: 72 },
  metro: { pos: [-10, -2.3, 108], look: [2, -1, 140], fov: 72 },
  east_cloister: { pos: [26.1, 3.45, -78], look: [26.1, 3.8, -110], fov: 72 },
  courtyard_aerial: { pos: [140, 70, 70], look: [40, 0, -30], fov: 55 },
  abyss_gate: { pos: [0, -298.3, -60], look: [0, -294, -82], fov: 75 },
  abyss_city: { pos: [3, -298.3, -94], look: [0, -292, -160], fov: 75 },
  abyss_core: { pos: [9.6, -278.3, -215.1], look: [3.5, -278.7, -222], fov: 76, zone: 'abyss_core' }, // 批次10：主机位移进书环南口内（r≈13，书环与书桌环之间），南口两席校对台 + 烛台在左中景，巨柱在右（原 [6,-278.3,-208] 仰拍巨柱、校对席只占画面底部一角）
  abyss_exam: { pos: [-19, -298.3, -121], look: [-45, -299, -146], fov: 72 },
  abyss_tide: { pos: [36, -298.3, -130], look: [62, -300, -146], fov: 72 },
  // R3 批次8
  seventh_entry: { pos: [0.6, -500 + 1.7, -54.4], look: [-0.6, -500 + 1.3, -66], fov: 74, zone: 'seventh_entry' },
  abyss_core_b: { pos: [-2, -280 + 1.7, -236], look: [14, -280 + 1.0, -222], fov: 76, zone: 'abyss_core' },  // 收尾：原机位在书环巨书内（距中心 17.8 m），移到书桌环与书环之间（12.8 m）
  abyss_core_top: { pos: [8, -280 + 42, -227.99], look: [8, -280, -228], fov: 62, clipY: -280 + 11, zone: 'abyss_core' },
  abyss_tide_b: { pos: [30, -300 + 1.7, -120.5], look: [41, -300 + 0.5, -150], fov: 72, zone: 'abyss_tide' },
  training_mid: { pos: [0, -52 + 1.7, -93.5], look: [0, -52 + 6, -130], fov: 80, zone: 'training' },
  metro_mid: { pos: [0, -4 + 1.7, 102], look: [0, -4 + 2.5, 160], fov: 74, zone: 'metro_exit' },
  seventh_gutter: { pos: [4.1, -498.3, -72.9], look: [8.4, -497.6, -84], fov: 75 },
  seventh_ops: { pos: [0, -498.3, -114], look: [0, -497.2, -133], fov: 75 },
  seventh_wrap: { pos: [0, -498.3, -136.5], look: [0, -498.6, -157], fov: 72 },
  seventh_rewrite: { pos: [0, -497.8, -163], look: [0, -499.2, -176], fov: 72 },
  east_stair: { pos: [51, Y + 1.65, -54], look: [52, Y + 5, -62], fov: 75 },
};
