#!/usr/bin/env bash
# 一键构建：同步内容 → 字体子集（扫描全部源码与文案，防止新牌子缺字成方块）→ vite build
set -eo pipefail
cd "$(dirname "$0")/.."
node tools/sync_content.mjs | tail -1
python3 tools/subset_fonts.py | tail -1
npx vite build 2>&1 | grep -E "error|built"
