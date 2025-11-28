<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

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
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => 'active', // Set status to "active" on registration
            'role' => 'customer',
        ]);

        // Log registration event
        try {
            ActivityLog::create([
                'user_id' => $user->user_id,
                'username' => $user->username,
                'event' => 'register',
                'status' => 'success',
                'ip_address' => $request->ip(),
                'device' => $request->header('User-Agent'),
                'location' => null,
                'response_time_ms' => null,
                'meta' => null,
            ]);
        } catch (\Exception $e) {
            // ignore logging errors
        }

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký thành công',
            'data' => $user,
        ], 201);
    }

    // API: POST /api/login
    public function login(Request $request)
    {
        $start = microtime(true);
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

        // Update status and last login time on successful login
        $user->status = 'active';
        $user->save();

        // Tạo token bằng Sanctum
        $token = $user->createToken('apitoken')->plainTextToken;

        // Log activity
        $end = microtime(true);
        $responseTimeMs = (int)(($end - $start) * 1000);

        try {
            ActivityLog::create([
                'user_id' => $user->user_id,
                'username' => $user->username,
                'event' => 'login',
                'status' => 'success',
                'ip_address' => $request->ip(),
                'device' => $request->header('User-Agent'),
                'location' => null,
                'response_time_ms' => $responseTimeMs,
                'meta' => null,
            ]);
        } catch (\Exception $e) {
            // swallow logging errors so login still succeeds
        }

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

    // API: POST /api/forgot-password
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

        // Generate a token
        $token = Str::random(60);

        // Delete any existing tokens for this email
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Save the new token
        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => $token,
            'created_at' => Carbon::now()
        ]);

        // Build reset link from FRONTEND_URL env (fallback to APP_URL)
        $frontendUrl = rtrim(env('FRONTEND_URL', env('APP_URL', 'http://localhost')), '/');
        $resetLink = $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        // Send the email
        try {
            Mail::raw("Nhấp vào liên kết này để đặt lại mật khẩu của bạn: " . $resetLink, function ($message) use ($request) {
                $message->to($request->email)
                        ->subject('Yêu cầu đặt lại mật khẩu');
            });

            return response()->json([
                'success' => true,
                'message' => 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.',
            ]);

        } catch (\Exception $e) {
            // Log the error for debugging
            // Log::error('Mail sending failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Không thể gửi email. Vui lòng thử lại sau.',
            ], 500);
        }
    }

    // API: POST /api/reset-password
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
                'errors' => $validator->errors()
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

        // Check if the token is expired (e.g., 60 minutes)
        $expiresAt = Carbon::parse($resetRecord->created_at)->addMinutes(config('auth.passwords.users.expire', 60));
        if (Carbon::now()->isAfter($expiresAt)) {
            // Delete the expired token
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

        // Update password
        $user->password = Hash::make($request->password);
        $user->save();

        // Delete the token after successful reset
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đặt lại mật khẩu thành công, vui lòng đăng nhập lại.',
        ]);
    }
}
