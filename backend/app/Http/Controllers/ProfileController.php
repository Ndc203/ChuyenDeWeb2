<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Lấy thông tin người dùng kèm profile.
     */
    public function getProfile(Request $request)
    {
        $user = $request->user()->load('profile');
        return response()->json($user, 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Cập nhật thông tin cá nhân.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            // Bảng users
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->user_id, 'user_id')],
            // Bảng userprofile
            'full_name' => 'sometimes|string|max:255',
            'avatar' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'department' => 'nullable|string|max:255',
            'about_me' => 'nullable|string',
            'social_links' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Cập nhật user
        $userData = array_intersect_key($data, array_flip(['email']));
        if (!empty($userData)) {
            $user->update($userData);
        }

        // Cập nhật profile
        $profileData = array_intersect_key($data, array_flip([
            'full_name',
            'avatar',
            'phone',
            'address',
            'date_of_birth',
            'gender',
            'department',
            'about_me',
            'social_links',
        ]));

        if (!empty($profileData)) {
            if (isset($profileData['social_links']) && is_array($profileData['social_links'])) {
                $profileData['social_links'] = json_encode($profileData['social_links']);
            }
            $profile = $user->profile()->firstOrCreate([]);
            $profile->update($profileData);
        }

        return response()->json([
            'message' => 'Cap nhat thong tin thanh cong',
            'user' => $user->load('profile'),
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Đổi mật khẩu.
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Mat khau hien tai khong dung.'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Doi mat khau thanh cong.'], 200, [], JSON_UNESCAPED_UNICODE);
    }
}
