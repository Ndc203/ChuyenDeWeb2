<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class CsrfProtection
{
    /**
     * Các route được miễn trừ khỏi CSRF protection
     * 
     * @var array
     */
    protected $except = [
        'api/login',
        'api/register',
        'api/forgot-password',
        'api/reset-password',
        'api/test',
        'api/v1/*', // API routes với token authentication không cần CSRF
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Kiểm tra nếu route được miễn trừ
        if ($this->inExceptArray($request)) {
            return $next($request);
        }

        // Chỉ kiểm tra CSRF cho các phương thức thay đổi dữ liệu
        if ($this->isReading($request)) {
            return $next($request);
        }

        // Lấy CSRF token từ header hoặc request
        $token = $request->header('X-CSRF-TOKEN') ?? $request->input('_token');

        // Lấy session token
        $sessionToken = Session::token();

        // Kiểm tra token
        if (!$token || !hash_equals($sessionToken, $token)) {
            return response()->json([
                'message' => 'CSRF token mismatch.',
                'error' => 'InvalidCsrfToken'
            ], 419);
        }

        return $next($request);
    }

    /**
     * Kiểm tra request có phải là phương thức đọc dữ liệu
     */
    protected function isReading(Request $request): bool
    {
        return in_array($request->method(), ['HEAD', 'GET', 'OPTIONS']);
    }

    /**
     * Kiểm tra route có trong danh sách miễn trừ
     */
    protected function inExceptArray(Request $request): bool
    {
        foreach ($this->except as $except) {
            if ($except !== '/') {
                $except = trim($except, '/');
            }

            // Kiểm tra exact match
            if ($request->is($except)) {
                return true;
            }

            // Kiểm tra wildcard match
            if (str_contains($except, '*')) {
                $pattern = preg_quote($except, '#');
                $pattern = str_replace('\*', '.*', $pattern);
                
                if (preg_match('#^' . $pattern . '\z#u', $request->path())) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Thêm route vào danh sách miễn trừ
     */
    public function except(array $routes): self
    {
        $this->except = array_merge($this->except, $routes);
        return $this;
    }
}
