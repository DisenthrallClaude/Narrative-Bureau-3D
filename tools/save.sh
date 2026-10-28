#!/usr/bin/env bash
# 每步存档：git commit+push，并把 P/game（不含 node_modules/dist）打包覆盖上传到 Drive
# 用法：bash tools/save.sh "提交说明"
set -e
cd "$(dirname "$0")/.."
MSG="${1:-checkpoint}"
git add -A
git commit -qm "$MSG" || echo "nothing to commit"
git -c http.sslCAInfo="$SSL_CERT_FILE" push -q origin HEAD:main 2>&1 | tail -2 || true
TMP=/tmp/nb_snap; mkdir -p $TMP
tar --exclude=node_modules --exclude=dist -czf $TMP/narrative-bureau-game.tar.gz -C .. game
cd $TMP
FOLDER=18vB1aDfMtrfcfEtNnoX8F8OyD_1jyGVi
IDF=/workspace/projects/b2c90d19-7034-43fd-aea1-521ddd72406e/game/.drive_snapshot_id
if [ -s "$IDF" ]; then
  gws drive files update --params "{\"fileId\":\"$(cat $IDF)\"}" --upload narrative-bureau-game.tar.gz >/dev/null && echo "drive updated $(cat $IDF)"
else
  ID=$(gws drive files create --json "{\"name\":\"narrative-bureau-game.tar.gz\",\"parents\":[\"$FOLDER\"]}" --upload narrative-bureau-game.tar.gz | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
  echo "$ID" > $IDF; echo "drive created $ID"
fi
ls -la narrative-bureau-game.tar.gz
