<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile information.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProfile(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Update the authenticated user's profile information.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->user_id, 'user_id'),
            ],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'department' => 'nullable|string|max:255',
            'about_me' => 'nullable|string',
            'social_links' => 'nullable|array',
            // Add validation for avatar if you handle file uploads
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        // Separate user-level fields and profile-level fields
        $userFields = Arr::only($validated, ['email', 'status', 'role']);
        $profileFields = Arr::only($validated, ['full_name', 'avatar', 'phone', 'address', 'date_of_birth', 'gender', 'department', 'about_me', 'social_links']);

        DB::beginTransaction();
        try {
            // Update user fields if present
            if (!empty($userFields)) {
                $user->fill($userFields);
                $user->save();
            }

            // Ensure profile table has the columns we attempt to write to (guard against schema drift)
            $profileTable = $user->profile()->getRelated()->getTable();
            $safeProfileData = [];
            foreach ($profileFields as $k => $v) {
                if (Schema::hasColumn($profileTable, $k)) {
                    $safeProfileData[$k] = $v;
                }
            }

            if (!empty($safeProfileData)) {
                // updateOrCreate on relation
                $user->profile()->updateOrCreate(
                    ['user_id' => $user->user_id],
                    $safeProfileData
                );
            }

            DB::commit();

            // Reload user with profile and flatten profile fields for frontend convenience
            $user = $user->fresh()->load('profile');
            $userArr = $user->toArray();
            if (isset($userArr['profile']) && is_array($userArr['profile'])) {
                foreach ($userArr['profile'] as $k => $v) {
                    $userArr[$k] = $v;
                }
                unset($userArr['profile']);
            }

            // Normalize date formats to ISO (YYYY-MM-DD) so frontend <input type="date"> and
            // new Date(...) parsing behave predictably regardless of locale/timezone.
            if (!empty($userArr['date_of_birth'])) {
                try {
                    $userArr['date_of_birth'] = Carbon::parse($userArr['date_of_birth'])->toDateString();
                } catch (\Exception $e) {
                    // If parsing fails, leave the raw value but log for debugging
                    logger()->warning('Unable to parse date_of_birth for user', [
                        'user_id' => $user->user_id,
                        'value' => $userArr['date_of_birth']
                    ]);
                }
            }

            return response()->json([
                'message' => 'Cập nhật thông tin thành công',
                'user' => $userArr,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            // Log error and return generic message
            logger()->error('Profile update failed', ['user_id' => $user->user_id, 'exception' => $e->getMessage()]);
            return response()->json(['message' => 'Đã có lỗi khi cập nhật thông tin.'], 500);
        }
    }

    /**
     * Change the authenticated user's password.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
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

        // Check if the current password is correct
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Mật khẩu hiện tại không đúng.'], 400);
        }

        // Update the password
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Đổi mật khẩu thành công.']);
    }
}
