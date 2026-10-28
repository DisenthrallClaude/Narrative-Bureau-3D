#!/usr/bin/env bash
# 排队截图：等其它 shot.mjs（视觉审阅）结束再跑，避免两个 SwiftShader 同时 OOM
cd "$(dirname "$0")/.."
export LD_LIBRARY_PATH=/workspace/work/tools/libs/usr/lib/aarch64-linux-gnu
while pgrep -f "tools/shot.mjs" >/dev/null; do sleep 10; done
exec node tools/shot.mjs "$@"
