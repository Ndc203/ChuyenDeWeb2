<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ?string $permission = null): Response
    {
        // Lấy token từ header
        $tokenString = $request->bearerToken();

        if (!$tokenString) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'API token is required'
            ], 401);
        }

        // Tìm token trong database
        $token = ApiToken::where('token', hash('sha256', $tokenString))
                         ->with('user')
                         ->first();

        if (!$token) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Invalid API token'
            ], 401);
        }

        // Kiểm tra token hợp lệ
        if (!$token->isValid()) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'API token is inactive or expired'
            ], 401);
        }

        // Kiểm tra quyền nếu có
        if ($permission && !$token->hasPermission($permission)) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => "Permission denied. Required permission: {$permission}"
            ], 403);
        }

        // Kiểm tra rate limiting
        $rateLimitKey = 'api_token_rate_limit:' . $token->id;
        $currentCount = Cache::get($rateLimitKey, 0);

        if ($currentCount >= $token->rate_limit) {
            return response()->json([
                'error' => 'Too Many Requests',
                'message' => 'Rate limit exceeded. Please try again later.',
                'rate_limit' => $token->rate_limit,
                'retry_after' => 60
            ], 429);
        }

        // Tăng counter
        Cache::put($rateLimitKey, $currentCount + 1, now()->addMinute());

        // Update thời gian sử dụng cuối (async để không ảnh hưởng performance)
        dispatch(function () use ($token) {
            $token->updateLastUsed();
        })->afterResponse();

        // Thêm thông tin token và user vào request
        $request->merge([
            'api_token' => $token,
            'api_user' => $token->user
        ]);

        // Thêm rate limit headers
        $response = $next($request);
        
        $response->headers->set('X-RateLimit-Limit', $token->rate_limit);
        $response->headers->set('X-RateLimit-Remaining', max(0, $token->rate_limit - $currentCount - 1));
        $response->headers->set('X-RateLimit-Reset', now()->addMinute()->timestamp);

        return $response;
    }
}
