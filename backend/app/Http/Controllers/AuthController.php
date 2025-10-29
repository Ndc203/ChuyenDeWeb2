<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // API: POST /api/register
    public function register(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'username' => $validated['username'],     // ĐÚNG CỘT
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => 'active',
            'role' => 'customer',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký thành công',
            'data' => $user,
        ], 201);
    }

    // API: POST /api/login
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Sai email hoặc mật khẩu',
            ], 401);
        }

        // Tạo token bằng Sanctum
        $token = $user->createToken('apitoken')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'data' => $user,
            'token' => $token,
        ]);
    }

    // API: POST /api/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công',
        ]);
    }
}