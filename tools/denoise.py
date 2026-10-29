# 离线渲染去噪（此 Blender arm64 构建无 OIDN）：OpenCV 非局部均值 + 轻度锐化回补
# 用法：python3 tools/denoise.py in.png out.png [h=6]
import sys, cv2
im = cv2.imread(sys.argv[1]); h = float(sys.argv[3]) if len(sys.argv) > 3 else 6
d = cv2.fastNlMeansDenoisingColored(im, None, h, h, 7, 21)
bl = cv2.GaussianBlur(d, (0, 0), 1.2); d = cv2.addWeighted(d, 1.35, bl, -0.35, 0)
cv2.imwrite(sys.argv[2], d)
