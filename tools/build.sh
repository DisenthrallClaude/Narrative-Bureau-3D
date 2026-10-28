#!/usr/bin/env bash
# 一键构建：同步内容 → 字体子集（扫描全部源码与文案，防止新牌子缺字成方块）→ vite build
set -eo pipefail
cd "$(dirname "$0")/.."
python3 -c "import brotli" 2>/dev/null || pip install -q brotli 2>/dev/null  # 沙箱重置后会丢 brotli（woff2 子集需要）
node tools/sync_content.mjs | tail -1
python3 tools/subset_fonts.py | tail -1
npx vite build 2>&1 | grep -E "error|built"
