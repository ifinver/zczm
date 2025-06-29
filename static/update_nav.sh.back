#!/bin/bash
# 请确保系统已安装 curl 与 jq，如未安装请使用：
# sudo apt-get install curl jq

# 1. 调用接口获取数据
result=$(curl -s "https://jp1.advapi.in.net/get_current_hostname?uid=dfjwqiofhweg")

# 解析 gw 与 tele 的值
gw=$(echo "$result" | jq -r '.gw')
tele=$(echo "$result" | jq -r '.tele')

# 2. 检查数据有效性：字段必须包含 '.' 且最后一个字符不能为 '.'
if [[ "$gw" != *.* || "${gw: -1}" == "." || "$tele" != *.* || "${tele: -1}" == "." ]]; then
    echo "接口返回异常数据：$result"
    exit 0
fi

# 3. 去除 gw 和 tele 中的协议前缀（http:// 或 https://）
gw_cleaned=$(echo "$gw" | sed -E 's~^https?://~~')
tele_cleaned=$(echo "$tele" | sed -E 's~^https?://~~')

# 4. 加上人机验证域名前缀
gw="https://$gw_cleaned"
tele="https://$tele_cleaned"

# 5. 更新 nav.json 文件
nav_file="/home/mediacms.io/mediacms/static/nav.json"
tmp_file="/tmp/nav.json.tmp"

jq --arg gw "$gw" --arg tele "$tele" '
  map(
    if .title=="干净世界" then .url = $gw
    elif .title=="视图驿站" then .url = $tele
    else . end
  )
' "$nav_file" > "$tmp_file"

if [ $? -eq 0 ]; then
    mv "$tmp_file" "$nav_file"
    chmod 777 "$nav_file"
    echo "nav.json 更新成功."
else
    echo "错误：更新 nav.json 时出错."
    exit 1
fi

