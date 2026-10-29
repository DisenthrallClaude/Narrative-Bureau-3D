#!/bin/bash
# R2 样板截图会话：bash tools/shot_r2.sh A|B [q=ultra] [w=1600] [h=900]
cd "$(dirname "$0")/.."
export LD_LIBRARY_PATH=/workspace/work/tools/libs/usr/lib/aarch64-linux-gnu DIAG=1
Q=${2:-ultra}; W=${3:-1600}; H=${4:-900}
if [ "$1" = A ]; then S=plaza,plaza_aerial,facade,plaza_fountain; else S=hall,hall_gates,hall_vault,hall_aisle; fi
exec node tools/shot.mjs screenshots/r2 $S --w $W --h $H --q $Q --frames 2 --timeout 5400000
