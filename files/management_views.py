import json
import os
import subprocess
from drf_yasg import openapi as openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.utils.timezone import now

from users.models import User
from users.serializers import UserSerializer

from .methods import is_mediacms_manager
from .models import Comment, Media, SantuiApplication
from .permissions import IsMediacmsEditor
from .serializers import CommentSerializer, MediaSerializer


class MediaList(APIView):
    """Media listings
    Used on management pages of MediaCMS
    Should be available only to MediaCMS editors,
    managers and admins
    """

    permission_classes = (IsMediacmsEditor,)
    parser_classes = (JSONParser,)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(name='sort_by', type=openapi.TYPE_STRING, in_=openapi.IN_QUERY, description='Sort by any of: title, add_date, edit_date, views, likes, reported_times'),
            openapi.Parameter(name='ordering', type=openapi.TYPE_STRING, in_=openapi.IN_QUERY, description='Order by: asc, desc'),
            openapi.Parameter(name='state', type=openapi.TYPE_STRING, in_=openapi.IN_QUERY, description='Media state, options: private", "public", "unlisted'),
            openapi.Parameter(name='encoding_status', type=openapi.TYPE_STRING, in_=openapi.IN_QUERY, description='Encoding status, options "pending", "running", "fail", "success"'),
        ],
        tags=['Manage'],
        operation_summary='Manage Media',
        operation_description='Manage media for MediaCMS managers and reviewers',
    )
    def get(self, request, format=None):
        params = self.request.query_params
        ordering = params.get("ordering", "").strip()
        sort_by = params.get("sort_by", "").strip()
        state = params.get("state", "").strip()
        encoding_status = params.get("encoding_status", "").strip()
        media_type = params.get("media_type", "").strip()

        featured = params.get("featured", "").strip()
        is_reviewed = params.get("is_reviewed", "").strip()

        sort_by_options = [
            "title",
            "add_date",
            "edit_date",
            "views",
            "likes",
            "reported_times",
        ]
        if sort_by not in sort_by_options:
            sort_by = "add_date"
        if ordering == "asc":
            ordering = ""
        else:
            ordering = "-"

        if media_type not in ["video", "image", "audio", "pdf"]:
            media_type = None

        if state not in ["private", "public", "unlisted"]:
            state = None

        if encoding_status not in ["pending", "running", "fail", "success"]:
            encoding_status = None

        if featured == "true":
            featured = True
        elif featured == "false":
            featured = False
        else:
            featured = "all"
        if is_reviewed == "true":
            is_reviewed = True
        elif is_reviewed == "false":
            is_reviewed = False
        else:
            is_reviewed = "all"

        pagination_class = api_settings.DEFAULT_PAGINATION_CLASS
        qs = Media.objects.filter()
        if state:
            qs = qs.filter(state=state)
        if encoding_status:
            qs = qs.filter(encoding_status=encoding_status)
        if media_type:
            qs = qs.filter(media_type=media_type)

        if featured != "all":
            qs = qs.filter(featured=featured)
        if is_reviewed != "all":
            qs = qs.filter(is_reviewed=is_reviewed)

        media = qs.order_by(f"{ordering}{sort_by}")

        paginator = pagination_class()

        page = paginator.paginate_queryset(media, request)

        serializer = MediaSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    @swagger_auto_schema(
        manual_parameters=[],
        tags=['Manage'],
        operation_summary='Delete Media',
        operation_description='Delete media for MediaCMS managers and reviewers',
    )
    def delete(self, request, format=None):
        tokens = request.GET.get("tokens")
        if tokens:
            tokens = tokens.split(",")
            Media.objects.filter(friendly_token__in=tokens).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentList(APIView):
    """Comments listings
    Used on management pages of MediaCMS
    Should be available only to MediaCMS editors,
    managers and admins
    """

    permission_classes = (IsMediacmsEditor,)
    parser_classes = (JSONParser,)

    @swagger_auto_schema(
        manual_parameters=[],
        tags=['Manage'],
        operation_summary='Manage Comments',
        operation_description='Manage comments for MediaCMS managers and reviewers',
    )
    def get(self, request, format=None):
        params = self.request.query_params
        ordering = params.get("ordering", "").strip()
        sort_by = params.get("sort_by", "").strip()

        sort_by_options = ["text", "add_date"]
        if sort_by not in sort_by_options:
            sort_by = "add_date"
        if ordering == "asc":
            ordering = ""
        else:
            ordering = "-"

        pagination_class = api_settings.DEFAULT_PAGINATION_CLASS

        qs = Comment.objects.filter()
        media = qs.order_by(f"{ordering}{sort_by}")

        paginator = pagination_class()

        page = paginator.paginate_queryset(media, request)

        serializer = CommentSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    @swagger_auto_schema(
        manual_parameters=[],
        tags=['Manage'],
        operation_summary='Delete Comments',
        operation_description='Delete comments for MediaCMS managers and reviewers',
    )
    def delete(self, request, format=None):
        comment_ids = request.GET.get("comment_ids")
        if comment_ids:
            comments = comment_ids.split(",")
            Comment.objects.filter(uid__in=comments).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class NavDetail(APIView):
    """管理导航
    """

    permission_classes = (IsMediacmsEditor,)
    parser_classes = (JSONParser,)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(name="detail", in_=openapi.IN_FORM, type=openapi.TYPE_STRING, required=True, description="nav.json detail"),
        ],
        tags=['Manage'],
        operation_summary='update nav.json',
        operation_description='ate nav.json',
    )
    def post(self, request, format=None):
        detail = request.data.get("detail")
        # 判断 detail 是否是合法的 JSON
        try:
            parsed_detail = json.loads(detail)  # 尝试解析 detail 为 JSON
            
            file_path = os.path.join(os.path.dirname(__file__), "../static/nav.json")
            file_path = os.path.normpath(file_path)
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(parsed_detail, f, ensure_ascii=False, indent=4)
            return Response(
                {"msg": "ok"},
                status=status.HTTP_200_OK,
            )
        except (ValueError, TypeError):
            return Response(
                {"msg": "json格式不正确"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"msg": "服务器内部错误", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class PopDetail(APIView):
    """管理导航
    """

    permission_classes = (IsMediacmsEditor,)
    parser_classes = (JSONParser,)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(name="detail", in_=openapi.IN_FORM, type=openapi.TYPE_STRING, required=True, description="nav.json detail"),
        ],
        tags=['Manage'],
        operation_summary='update pop.json',
        operation_description='ate pop.json',
    )
    def post(self, request, format=None):
        detail = request.data.get("detail")
        # 判断 detail 是否是合法的 JSON
        try:
            parsed_detail = json.loads(detail)  # 尝试解析 detail 为 JSON
            
            file_path = os.path.join(os.path.dirname(__file__), "../static/pop.json")
            file_path = os.path.normpath(file_path)
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(parsed_detail, f, ensure_ascii=False, indent=4)
            return Response(
                {"msg": "ok"},
                status=status.HTTP_200_OK,
            )
        except (ValueError, TypeError):
            return Response(
                {"msg": "json格式不正确"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"msg": "服务器内部错误", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

OPENRESTY_NUMBER_SITES_DIR = "/usr/local/openresty/nginx/conf/sites-numbers/" 
class NumberSites(APIView):
    """查看和管理当前绑定的数字域名"""

    permission_classes = (IsMediacmsEditor,)
    parser_classes = (JSONParser,)

    @swagger_auto_schema(
        manual_parameters=[],
        tags=['Manage'],
        operation_summary='Get all binded sites',
        operation_description='查看所有已绑定的数字域名',
    )
    def get(self, request, format=None):
        """
        获取目录 /etc/openresty/sites-numbers/ 下所有文件名及其创建时间戳，
        按创建时间排序（最新创建的在最下面），并返回给客户端。
        """
        try:
            items = os.listdir(OPENRESTY_NUMBER_SITES_DIR)
            domains = []
            for item in items:
                file_path = os.path.join(OPENRESTY_NUMBER_SITES_DIR, item)
                if os.path.isfile(file_path):
                    # 获取文件创建时间戳（单位秒）
                    ctime = os.path.getctime(file_path)
                    domains.append({"domain": item, "ctime": ctime})
            # 按创建时间升序排序（最新的在最后）
            domains.sort(key=lambda x: x["ctime"])
            return Response({"domains": domains}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"msg": f"无法读取目录: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @swagger_auto_schema(
        manual_parameters=[],
        tags=['Manage'],
        operation_summary='delete some sites',
        operation_description='删除指定域名并重启openresty',
    )
    def delete(self, request, format=None):
        """
        根据传入的域名数组删除对应的配置文件，
        删除成功后调用 "openresty -s reload" 重启 openresty 使配置生效
        请求参数示例：
            {
                "domains": ["abc.xyz", "def.com"]
            }
        返回删除成功和失败的详细信息。
        """
        domains = request.data.get("domains")
        if not domains or not isinstance(domains, list) or len(domains) == 0:
            return Response(
                {"msg": "请传入一个域名数组"},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted_domains = []
        failed_domains = []

        for domain in domains:
            # 基本校验：域名不能为空字符串
            if not isinstance(domain, str) or domain.strip() == "":
                failed_domains.append({
                    "domain": domain,
                    "error": "无效的域名"
                })
                continue

            file_path = os.path.join(OPENRESTY_NUMBER_SITES_DIR, domain)
            if not os.path.exists(file_path):
                failed_domains.append({
                    "domain": domain,
                    "error": "对应的配置文件不存在"
                })
                continue

            try:
                os.remove(file_path)
                deleted_domains.append(domain)
            except Exception as e:
                failed_domains.append({
                    "domain": domain,
                    "error": f"删除失败: {str(e)}"
                })

        # 如果至少有一个文件被成功删除，则尝试重载 openresty 配置
        if deleted_domains:
            try:
                result_reload = subprocess.run(
                    ["sudo", "openresty", "-s", "reload"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                if result_reload.returncode != 0:
                    error_msg = result_reload.stderr.strip() or result_reload.stdout.strip()
                    return Response(
                        {"msg": f"openresty 重载失败: {error_msg}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            except Exception as e:
                return Response(
                    {"msg": f"执行 openresty 重载命令失败: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # 返回部分或全部删除成功的信息
            if failed_domains:
                return Response(
                    {
                        "msg": "部分域名删除失败，但 openresty 已重载",
                        "deleted": deleted_domains,
                        "failed": failed_domains
                    },
                    status=status.HTTP_207_MULTI_STATUS  # 部分成功
                )
            else:
                return Response(
                    {
                        "msg": "删除成功，配置已生效！",
                        "deleted": deleted_domains
                    },
                    status=status.HTTP_200_OK
                )
        else:
            # 如果没有任何文件被删除，则直接返回失败信息
            return Response(
                {
                    "msg": "没有删除任何域名配置",
                    "failed": failed_domains
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                name="id", in_=openapi.IN_QUERY, type=openapi.TYPE_INTEGER, required=True, description="三退申请的 ID"
            ),
        ],
        tags=['Manage'],
        operation_summary='Mark Santui Application as Completed',
        operation_description='将指定三退申请标记为已完成，并记录完成时间',
    )
    def post(self, request, format=None):
        """增加绑定域名"""

        domain = request.data.get("domain")
        if not domain or domain.strip() == "":
            return Response({"msg": "域名必填"}, status=status.HTTP_400_BAD_REQUEST)
        if domain.count(".") != 1:
            return Response(
                {"msg": "域名写错了，只能包含一个小数点，不需要写前缀"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 构造 openresty 配置文件内容，注意 f-string 中双大括号用于输出字面量 "{" 和 "}"
        config_content = f"""
server {{
    listen 80;
    listen [::]:80;
    server_name {domain} *.{domain};

    # 强制 HTTPS（若请求头非 https，则重定向）
    if ($http_x_forwarded_proto != "https") {{
        return 301 https://$host$request_uri;
    }}

    gzip on;
    access_log /var/log/openresty/mediacms.io.access.log;
    error_log /var/log/openresty/mediacms.io.error.log warn;

    # 全局 Lua 拦截：仅对 Accept 包含 text/html 的请求生效，
    # 对 /captcha 页面本身不拦截，若未通过验证码验证则重定向到 /captcha
    access_by_lua_block {{
        local headers = ngx.req.get_headers()
        local accept = headers["Accept"] or ""
        if not accept:find("text/html", 1, true) then
            return
        end
        if ngx.var.uri == "/captcha" then
            return
        end
        local verified = ngx.var.cookie_captcha_verified
        if verified ~= "1" then
            local req_uri = ngx.var.request_uri or "/"
            return ngx.redirect("/captcha?return_url=" .. ngx.escape_uri(req_uri))
        end
    }}

    location /static {{
        alias /home/mediacms.io/mediacms/static;
    }}

    location /media/original {{
        alias /home/mediacms.io/mediacms/media_files/original;
    }}

    location /media {{
        alias /home/mediacms.io/mediacms/media_files;
    }}

    location / {{
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';

        include /usr/local/openresty/openresty/conf/sites-enabled/uwsgi_params;
        uwsgi_pass 127.0.0.1:9000;
    }}

    # 验证码页面，仅用于生成和验证验证码
    location = /captcha {{
        content_by_lua_block {{
            ngx.header["Content-Type"] = "text/html; charset=utf-8"

            -- 定义一个简单的 HTML 转义函数
            local function escape_html(s)
                s = s or ""
                s = s:gsub("&", "&amp;")
                s = s:gsub("<", "&lt;")
                s = s:gsub(">", "&gt;")
                s = s:gsub("\"", "&quot;")
                s = s:gsub("'", "&#39;")
                return s
            end

            -- 获取查询参数
            local args = ngx.req.get_uri_args()
            local raw_return_url = args.return_url or "/"
            local return_url
            if raw_return_url == "%2F" then
                return_url = "/"
            else
                return_url = ngx.unescape_uri(raw_return_url)
            end

            local user_answer = args.answer

            -- 尝试从 Cookie 中获取之前保存的操作数（格式 "a,b"）
            local captcha_numbers = ngx.var.cookie_captcha_numbers
            local a, b, answer

            if captcha_numbers then
                local numbers = {{}}
                local count = 0
                for num in string.gmatch(captcha_numbers, "([^,]+)") do
                    count = count + 1
                    numbers[count] = tonumber(num)
                end
                if #numbers == 2 then
                    a = numbers[1]
                    b = numbers[2]
                    answer = a + b
                else
                    captcha_numbers = nil  -- 格式错误则重新生成
                end
            end

            if not captcha_numbers then
                a = math.random(1, 10)
                b = math.random(1, 10)
                answer = a + b
                ngx.header["Set-Cookie"] = "captcha_numbers=" .. a .. "," .. b .. "; Path=/; HttpOnly; Max-Age=86400"
            end

            if user_answer then
                if not answer then
                    ngx.say("<html><head><meta charset='utf-8'><style>")
                    ngx.say("body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }")
                    ngx.say("</style></head><body>")
                    ngx.say("验证码已失效，请 <a href='/captcha?return_url=" .. ngx.escape_uri(return_url) .. "'>刷新页面</a>。")
                    ngx.say("</body></html>")
                    return
                end

                if tonumber(user_answer) == answer then
                    ngx.header["Set-Cookie"] = {{
                        "captcha_verified=1; Path=/; HttpOnly; Max-Age=86400",
                        "captcha_numbers=; Path=/; HttpOnly; Max-Age=0"
                    }}
                    ngx.redirect(return_url)
                    return
                else
                    ngx.say("<html><head><meta charset='utf-8'><style>")
                    ngx.say("body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif; }")
                    ngx.say("</style></head><body>")
                    ngx.say("答案错误！请 <a href='/captcha?return_url=" .. ngx.escape_uri(return_url) .. "'>重新验证</a>。")
                    ngx.say("</body></html>")
                    return
                end
            else
                ngx.say("<html><head><meta charset='utf-8'><style>")
                ngx.say("body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif; }")
                ngx.say("</style></head>")
                ngx.say("<body>")
                ngx.say(string.format("<form method='get' action='/captcha'>"))
                ngx.say(string.format("请回答：%d + %d = <input name='answer' autocomplete='off'/>", a, b))
                ngx.say(string.format("<input type='hidden' name='return_url' value='%s'/>", escape_html(return_url)))
                ngx.say("<input type='submit' value='提交'/>")
                ngx.say("</form>")
                ngx.say("</body></html>")
                return
            end
        }}
    }}
}}
"""
        return Response(
            {"msg": "域名写错了，只能包含一个小数dfsdfs点，不需要写前缀"},
            status=status.HTTP_400_BAD_REQUEST
        )
        config_path = os.path.join(OPENRESTY_NUMBER_SITES_DIR, domain)
        config_path = os.path.normpath(config_path)
        try:
            with open(config_path, "w") as f:
                f.write(config_content)
        except Exception as e:
            return Response(
                {"msg": f"写入openresty配置文件失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 调用 openresty -t 测试配置文件
        try:
            result_test = subprocess.run(
                ["sudo", "openresty", "-t"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            if result_test.returncode != 0:
                # 如果 stderr 没有内容，则尝试从 stdout 中提取错误信息
                error_msg = result_test.stderr.strip() or result_test.stdout.strip()
                return Response(
                    {"msg": f"openresty配置测试失败: {error_msg}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {"msg": f"执行openresty测试命令失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 调用 openresty -s reload 重启 openresty
        try:
            result_reload = subprocess.run(
                ["sudo", "openresty", "-s", "reload"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            if result_reload.returncode != 0:
                error_msg = result_reload.stderr.strip() or result_reload.stdout.strip()
                return Response(
                    {"msg": f"openresty重启失败: {error_msg}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            return Response(
                {"msg": f"执行openresty重启命令失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({"msg": "绑定成功，已生效！"}, status=status.HTTP_200_OK)

class Santui(APIView):
    """查看和操作三退申请"""

    permission_classes = (IsMediacmsEditor,)
    parser_classes = (JSONParser,)
    
    @swagger_auto_schema(
        manual_parameters=[],
        tags=['Manage'],
        operation_summary='Get all Santui applications',
        operation_description='获取所有三退申请，未完成的排在上面，已完成的排在下面；第二排序条件是按申请时间先后排序',
    )
    def get(self, request, format=None):
        """处理 GET 请求，返回排序后的所有数据"""
        try:
            # 查询并排序数据
            santui_list = SantuiApplication.objects.all().order_by(
                'is_completed',  # 未完成排在上面
                'created_at'     # 申请时间早的排在上面
            )
            # 格式化数据
            data = [
                {
                    "id": app.id,
                    "name": app.name,
                    "content": app.content,
                    "note": app.note,
                    "is_completed": app.is_completed,
                    "completed_at": app.completed_at,
                    "created_at": app.created_at,
                }
                for app in santui_list
            ]
            return Response({"data": data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"msg": "获取数据失败", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                name="id", in_=openapi.IN_QUERY, type=openapi.TYPE_INTEGER, required=True, description="三退申请的 ID"
            ),
        ],
        tags=['Manage'],
        operation_summary='Mark Santui Application as Completed',
        operation_description='将指定三退申请标记为已完成，并记录完成时间',
    )
    def post(self, request, format=None):
        """处理标记为已完成的逻辑"""

        application_id = request.data.get("id")

        if not application_id:
            return Response({"msg": "ID 不能为空"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 获取对应的记录
            application = SantuiApplication.objects.get(id=application_id)
            if application.is_completed:
                return Response({"msg": "该条目已完成，无需重复操作"}, status=status.HTTP_400_BAD_REQUEST)

            # 更新完成状态和完成时间
            application.is_completed = True
            application.completed_at = now()
            application.save()

            return Response({"msg": "标记成功", "data": {"id": application_id}}, status=status.HTTP_200_OK)
        except SantuiApplication.DoesNotExist:
            return Response({"msg": "记录不存在"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"msg": "操作失败", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserList(APIView):
    """Users listings
    Used on management pages of MediaCMS
    Should be available only to MediaCMS editors,
    managers and admins. Delete should be option
    for managers+admins only.
    """

    permission_classes = (IsMediacmsEditor,)
    parser_classes = (JSONParser,)

    @swagger_auto_schema(
        manual_parameters=[],
        tags=['Manage'],
        operation_summary='Manage Users',
        operation_description='Manage users for MediaCMS managers and reviewers',
    )
    def get(self, request, format=None):
        params = self.request.query_params
        ordering = params.get("ordering", "").strip()
        sort_by = params.get("sort_by", "").strip()
        role = params.get("role", "all").strip()

        sort_by_options = ["date_added", "name"]
        if sort_by not in sort_by_options:
            sort_by = "date_added"
        if ordering == "asc":
            ordering = ""
        else:
            ordering = "-"

        pagination_class = api_settings.DEFAULT_PAGINATION_CLASS

        qs = User.objects.filter()
        if role == "manager":
            qs = qs.filter(is_manager=True)
        elif role == "editor":
            qs = qs.filter(is_editor=True)

        users = qs.order_by(f"{ordering}{sort_by}")

        paginator = pagination_class()

        page = paginator.paginate_queryset(users, request)

        serializer = UserSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    @swagger_auto_schema(
        manual_parameters=[],
        tags=['Manage'],
        operation_summary='Delete Users',
        operation_description='Delete users for MediaCMS managers',
    )
    def delete(self, request, format=None):
        if not is_mediacms_manager(request.user):
            return Response({"detail": "bad permissions"}, status=status.HTTP_400_BAD_REQUEST)

        tokens = request.GET.get("tokens")
        if tokens:
            tokens = tokens.split(",")
            User.objects.filter(username__in=tokens).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)