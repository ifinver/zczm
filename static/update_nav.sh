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

# 5. 获取“明见网”的新 URL 并随机选取一条；异常时留空，后续 jq 跳过更新
# ## 明见网 API
# ming_raw=$(curl -s "http://www.szzd.org/v.php?api=geturl.jump.https&action=text&uri=https://www.ming-jian.net/")
# mapfile -t ming_candidates < <(printf '%s\n' "$ming_raw" | grep -E '^https?://')
# if [ ${#ming_candidates[@]} -gt 0 ]; then
#     ming_url=${ming_candidates[RANDOM % ${#ming_candidates[@]}]}
# else
#     echo "警告：明见网 API 返回异常或无有效 URL，跳过更新明见网"
#     ming_url=""
# fi

# ## 干净世界 API（已注释）
# gan_raw=$(curl -s "http://www.szzd.org/v.php?api=geturl.jump.https&action=text&uri=https://www.ganjingworld.com")
# mapfile -t gan_candidates < <(printf '%s\n' "$gan_raw" | grep -E '^https?://')
# if [ ${#gan_candidates[@]} -gt 0 ]; then
#     gan_url=${gan_candidates[RANDOM % ${#gan_candidates[@]}]}
# else
#     echo "警告：干净世界 API 返回异常或无有效 URL，跳过更新干净世界"
#     gan_url=""
# fi

# ## 新增：大法网站 API
# dafa_raw=$(curl -s "http://www.szzd.org/v.php?api=geturl.jump.https&action=text&uri=https://www.falundafa.org")
# mapfile -t dafa_candidates < <(printf '%s\n' "$dafa_raw" | grep -E '^https?://')
# if [ ${#dafa_candidates[@]} -gt 0 ]; then
#     dafa_url=${dafa_candidates[RANDOM % ${#dafa_candidates[@]}]}
# else
#     echo "警告：大法网站 API 返回异常或无有效 URL，跳过更新大法网站"
#     dafa_url=""
# fi

# 6. 更新 nav.json 文件
nav_file="/home/mediacms.io/mediacms/static/nav.json"
tmp_file="/tmp/nav.json.tmp"

jq --arg tele "$tele" \
   --arg ming_url "" \
   --arg dafa_url "" \
'  map(
    if .title=="视图驿站" then
      .url = $tele
    elif .title=="明见网" and ($ming_url != "") then
      .url = $ming_url
    # elif .title=="干净世界" and ($gan_url != "") then
    #   .url = $gan_url
    elif .title=="大法网站" and ($dafa_url != "") then
      .url = $dafa_url
    else
      .
    end
  )' "$nav_file" > "$tmp_file"

if [ $? -eq 0 ]; then
    mv "$tmp_file" "$nav_file"
    chmod 777 "$nav_file"
    echo "nav.json 更新成功."
else
    echo "错误：更新 nav.json 时出错."
    exit 1
fi

