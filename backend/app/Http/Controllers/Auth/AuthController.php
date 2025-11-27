<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * API: POST /api/login
     * Đăng nhập và trả về Token + Role
     */
    public function login(Request $request)
    {
        // 1. Validate dữ liệu đầu vào
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 2. Thử đăng nhập
        if (!Auth::attempt($credentials)) {
            // Ghi log đăng nhập thất bại
            $this->logActivity(null, $request->email, 'login', 'failed', $request);
            return response()->json([
                'message' => 'Thông tin đăng nhập không chính xác'
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 3. Kiểm tra trạng thái tài khoản (nếu có cột status)
        if ($user->status === 'banned') {
            $user->tokens()->delete(); // Xóa token cũ nếu có
            return response()->json([
                'message' => 'Tài khoản của bạn đã bị khóa.'
            ], 403);
        }

        // 4. Tạo Token mới (Sanctum)
        $token = $user->createToken('auth_token')->plainTextToken;

        // 5. Lấy vai trò (Role) quan trọng nhất
        // Spatie trả về Collection, ta lấy tên role đầu tiên
        // Nếu chưa có role, mặc định là 'customer'
        $role = $user->getRoleNames()->first() ?? $user->role;

        // Ghi log đăng nhập thành công
        $this->logActivity($user->user_id, $user->username, 'login', 'success', $request);

        // 6. Trả về dữ liệu JSON cho Frontend
        return response()->json([
            'message' => 'Đăng nhập thành công',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('profile'), // Tải kèm profile nếu có
            'role' => $role, // <--- QUAN TRỌNG: React dùng cái này để điều hướng
        ]);
    }

    /**
     * API: POST /api/register
     * Đăng ký tài khoản mới (Mặc định là Customer)
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed', // Cần field password_confirmation
            'full_name' => 'required|string', // Để tạo profile
        ]);

        // 1. Tạo User
        $user = User::create([
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => 'active',
            // 'role' => 'customer', // Nếu bạn vẫn dùng cột role cũ
        ]);

        // 2. Tạo Profile liên kết (1-1)
        $user->profile()->create([
            'full_name' => $validated['full_name'],
        ]);

        // 3. Gán quyền Spatie (Mặc định là Customer)
        $user->assignRole('customer'); // Hoặc 'User' tùy tên bạn đặt trong Seeder

        // 4. Tự động đăng nhập luôn (Tạo token)
        $token = $user->createToken('auth_token')->plainTextToken;
        $role = 'customer';

        $this->logActivity($user->user_id, $user->username, 'register', 'success', $request);

        return response()->json([
            'message' => 'Đăng ký thành công',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('profile'),
            'role' => $role,
        ], 201);
    }

    /**
     * API: POST /api/logout
     * Đăng xuất (Xóa token hiện tại)
     */
    public function logout(Request $request)
    {
        // Xóa token đang sử dụng để đăng nhập
        $request->user()->currentAccessToken()->delete();

        $this->logActivity($request->user()->user_id, $request->user()->username, 'logout', 'success', $request);

        return response()->json([
            'message' => 'Đăng xuất thành công'
        ]);
    }

    /**
     * API: GET /api/me
     * Lấy thông tin người dùng hiện tại (để check token)
     */
    public function me(Request $request)
    {
        $user = $request->user()->load('profile');
        $role = $user->getRoleNames()->first() ?? 'customer';

        return response()->json([
            'user' => $user,
            'role' => $role
        ]);
    }

    /**
     * Ghi log hoạt động đăng nhập / đăng ký / đăng xuất.
     */
    protected function logActivity($userId, $username, $event, $status, Request $request)
    {
        ActivityLog::create([
            'user_id' => $userId,
            'username' => $username,
            'event' => $event,
            'status' => $status,
            'ip_address' => $request->ip(),
            'device' => $request->userAgent(),
            'location' => null,
            'response_time_ms' => null,
            'meta' => [],
        ]);
    }
}
