// 截图机位（?shot=名称）：用于里程碑截图与视觉审阅
const Y = 1.8;
export const SHOTS = {
  plaza: { pos: [0, 1.7, 74], look: [0, 30, -40], fov: 70 },
  plaza_aerial: { pos: [70, 95, 150], look: [0, 25, -40], fov: 55 },
  plaza_fountain: { pos: [-22, 3.2, 48], look: [0, 6, 28], fov: 65 },
  facade: { pos: [6, 1.7, 14], look: [0, 30, -6], fov: 75 },
  gate: { pos: [-8, Y + 1.65, -8], look: [11, Y + 3, -18], fov: 72 },
  hall: { pos: [0, Y + 1.65, -32.5], look: [0, Y + 9, -60], fov: 75 },
  hall_vault: { pos: [6, Y + 1.6, -47], look: [-1, Y + 22, -58], fov: 80 },
  hall_gates: { pos: [-6, Y + 1.7, -35], look: [6, Y + 1.5, -44], fov: 70 },
  archive: { pos: [-22, Y + 1.7, -50], look: [-50, Y + 3, -52], fov: 75 },
  archive_gallery: { pos: [-54.6, Y + 6.2 + 1.6, -36], look: [-30, Y + 5, -40], fov: 75 },
  b1: { pos: [-27, Y - 6 + 1.7, -33.5], look: [-40, Y - 6 + 1.2, -40], fov: 72 },
};
