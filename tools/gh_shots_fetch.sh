#!/usr/bin/env bash
# 取回某次 Screenshots run 的全部 artifact：bash fetch.sh <run_id> <目标根>（解压成 <目标根>/<组>/<机位>.png + .log）
R=$1; DST=$2; mkdir -p $DST /tmp/afz
curl -sS "https://api.github.com/repos/DisenthrallClaude/Narrative-Bureau-3D/actions/runs/$R/artifacts?per_page=100" > /tmp/afz/list.json
python3 -c "import json;[print(a['id'],a['name']) for a in json.load(open('/tmp/afz/list.json'))['artifacts']]" | while read id name; do
  [ -f /tmp/afz/$id.done ] && continue
  curl -sS -L -o /tmp/afz/$id.zip https://api.github.com/repos/DisenthrallClaude/Narrative-Bureau-3D/actions/artifacts/$id/zip && unzip -qo /tmp/afz/$id.zip -d $DST && touch /tmp/afz/$id.done && echo "got $name"
done
