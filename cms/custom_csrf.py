from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

class CustomCsrfMiddleware(MiddlewareMixin):
    """
    自定义 CSRF 中间件：允许对特定路径禁用 CSRF 验证
    """

    def process_view(self, request, callback, callback_args, callback_kwargs):
        exempt_paths = getattr(settings, 'CSRF_EXEMPT_PATHS', [])
        if any(request.path.startswith(path) for path in exempt_paths):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None
