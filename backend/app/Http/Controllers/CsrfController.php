<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class CsrfController extends Controller
{
    /**
     * Lấy CSRF token hiện tại
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getToken()
    {
        // Tạo hoặc lấy CSRF token từ session
        $token = Session::token();
        
        return response()->json([
            'csrf_token' => $token,
            'expires_at' => now()->addMinutes(config('session.lifetime'))->toIso8601String()
        ]);
    }

    /**
     * Làm mới CSRF token
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function refreshToken()
    {
        // Regenerate session token
        Session::regenerateToken();
        
        $token = Session::token();
        
        return response()->json([
            'csrf_token' => $token,
            'expires_at' => now()->addMinutes(config('session.lifetime'))->toIso8601String(),
            'message' => 'CSRF token đã được làm mới'
        ]);
    }

    /**
     * Kiểm tra CSRF token có hợp lệ
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyToken(Request $request)
    {
        $token = $request->header('X-CSRF-TOKEN') ?? $request->input('_token');
        $sessionToken = Session::token();

        $isValid = $token && hash_equals($sessionToken, $token);

        return response()->json([
            'valid' => $isValid,
            'message' => $isValid ? 'CSRF token hợp lệ' : 'CSRF token không hợp lệ'
        ]);
    }
}
