<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class XssProtection
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Sanitize tất cả input trước khi xử lý
        $input = $request->all();
        
        // Lọc các trường dữ liệu
        array_walk_recursive($input, function(&$input) {
            if (is_string($input)) {
                // Chuyển đổi các ký tự đặc biệt thành HTML entities
                $input = $this->sanitizeInput($input);
            }
        });

        $request->merge($input);

        $response = $next($request);

        // Thêm các security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Content Security Policy
        $csp = implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: http:",
            "connect-src 'self' http://localhost:* http://127.0.0.1:*",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'"
        ]);
        $response->headers->set('Content-Security-Policy', $csp);

        return $response;
    }

    /**
     * Sanitize input để ngăn chặn XSS
     *
     * @param string $input
     * @return string
     */
    private function sanitizeInput(string $input): string
    {
        // Chuyển đổi các ký tự đặc biệt
        $input = htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);
        
        // Loại bỏ các thẻ script và các thẻ nguy hiểm
        $input = strip_tags($input);
        
        // Loại bỏ các chuỗi javascript:
        $input = preg_replace('/javascript:/i', '', $input);
        
        // Loại bỏ các event handlers
        $input = preg_replace('/on\w+\s*=/i', '', $input);
        
        return $input;
    }
}
