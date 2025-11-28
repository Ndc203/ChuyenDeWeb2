<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
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

    /**
     * API: POST /api/forgot-password
     * Tạo token reset và gửi liên kết về email.
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Email không tồn tại trong hệ thống.',
            ], 404);
        }

        $token = Str::random(60);

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => $token,
            'created_at' => Carbon::now(),
        ]);

        $frontendUrl = rtrim(env('FRONTEND_URL', env('APP_URL', 'http://localhost')), '/');
        $resetLink = $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        try {
            Mail::raw(
                "Nhấp vào liên kết này để đặt lại mật khẩu của bạn: " . $resetLink,
                function ($message) use ($request) {
                    $message->to($request->email)
                        ->subject('Yêu cầu đặt lại mật khẩu');
                }
            );

            return response()->json([
                'success' => true,
                'message' => 'Hướng dẫn đặt lại mật khẩu đã được gửi tới email của bạn.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể gửi email. Vui lòng thử lại sau.',
            ], 500);
        }
    }

    /**
     * API: POST /api/reset-password
     * Đặt lại mật khẩu bằng token.
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Token không hợp lệ.',
            ], 400);
        }

        $expiresAt = Carbon::parse($resetRecord->created_at)
            ->addMinutes(config('auth.passwords.users.expire', 60));

        if (Carbon::now()->isAfter($expiresAt)) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'success' => false,
                'message' => 'Liên kết đã hết hạn hoặc không đúng.',
            ], 400);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Người dùng không tồn tại.',
            ], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đặt lại mật khẩu thành công, vui lòng đăng nhập lại.',
        ]);
    }
}
