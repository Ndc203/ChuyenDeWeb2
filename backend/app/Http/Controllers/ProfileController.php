<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * API: PUT /api/me/update
     * Cập nhật thông tin cá nhân
     */
    public function updateProfile(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 1. Validate
        $validated = $request->validate([
            // Bảng users
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->user_id, 'user_id')],
            
            // Bảng userprofile
            'full_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
        ]);

        // 2. Cập nhật bảng Users
        $user->update([
            'email' => $validated['email'],
        ]);

        // 3. Cập nhật bảng UserProfile (1-1)
        // Dùng updateOrCreate để nếu chưa có profile thì tự tạo
        $user->profile()->updateOrCreate(
            ['user_id' => $user->user_id],
            [
                'full_name' => $validated['full_name'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'date_of_birth' => $validated['date_of_birth'],
                'gender' => $validated['gender'],
            ]
        );

        return response()->json([
            'message' => 'Cập nhật hồ sơ thành công!',
            'user' => $user->load('profile')
        ]);
    }

    /**
     * API: POST /api/me/change-password
     * Đổi mật khẩu
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|string|min:8|confirmed', // Cần field new_password_confirmation
        ]);

        $user = Auth::user();

        // 1. Kiểm tra mật khẩu cũ
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Mật khẩu hiện tại không đúng.'], 400);
        }

        // 2. Cập nhật mật khẩu mới
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json(['message' => 'Đổi mật khẩu thành công!']);
    }
}