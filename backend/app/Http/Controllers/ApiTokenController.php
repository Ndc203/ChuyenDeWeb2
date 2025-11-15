<?php

namespace App\Http\Controllers;

use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApiTokenController extends Controller
{
    /**
     * Lấy danh sách tokens của user
     */
    public function index(Request $request)
    {
        $userId = $request->input('user_id');
        
        $query = ApiToken::with('user:user_id,name,email');
        
        if ($userId) {
            $query->where('user_id', $userId);
        }
        
        $tokens = $query->latest()->get();
        
        return response()->json($tokens);
    }

    /**
     * Tạo token mới
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,user_id',
            'name' => 'required|string|max:255',
            'permissions' => 'required|array',
            'permissions.*' => 'required|string',
            'rate_limit' => 'nullable|integer|min:1|max:1000',
            'expires_at' => 'nullable|date|after:now',
        ]);

        // Validate permissions
        $validPermissions = [
            '*', // Full access
            'products.*', // All product permissions
            'products.read',
            'products.create',
            'products.update',
            'products.delete',
            'reviews.*',
            'reviews.read',
            'reviews.update',
            'reviews.delete',
        ];

        foreach ($request->permissions as $permission) {
            if (!in_array($permission, $validPermissions)) {
                return response()->json([
                    'error' => 'Invalid permission: ' . $permission,
                    'valid_permissions' => $validPermissions
                ], 400);
            }
        }

        // Generate plain token (để trả về cho user 1 lần duy nhất)
        $plainToken = Str::random(40);
        $hashedToken = hash('sha256', $plainToken);

        // Tạo token
        $token = ApiToken::create([
            'user_id' => $request->user_id,
            'name' => $request->name,
            'token' => $hashedToken,
            'permissions' => $request->permissions,
            'rate_limit' => $request->rate_limit ?? 60,
            'expires_at' => $request->expires_at,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'API token created successfully',
            'token' => $token,
            'plain_token' => $plainToken, // Chỉ hiển thị 1 lần
            'warning' => 'Please save this token securely. You will not be able to see it again!'
        ], 201);
    }

    /**
     * Xem chi tiết token
     */
    public function show($id)
    {
        $token = ApiToken::with('user:user_id,name,email')->findOrFail($id);
        
        return response()->json($token);
    }

    /**
     * Cập nhật token
     */
    public function update(Request $request, $id)
    {
        $token = ApiToken::findOrFail($id);
        
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'permissions' => 'sometimes|array',
            'rate_limit' => 'sometimes|integer|min:1|max:1000',
            'expires_at' => 'nullable|date',
            'is_active' => 'sometimes|boolean',
        ]);

        $token->update($request->only([
            'name',
            'permissions',
            'rate_limit',
            'expires_at',
            'is_active'
        ]));

        return response()->json([
            'message' => 'API token updated successfully',
            'token' => $token
        ]);
    }

    /**
     * Xóa token
     */
    public function destroy($id)
    {
        $token = ApiToken::findOrFail($id);
        $token->delete();

        return response()->json([
            'message' => 'API token deleted successfully'
        ]);
    }

    /**
     * Vô hiệu hóa token
     */
    public function deactivate($id)
    {
        $token = ApiToken::findOrFail($id);
        $token->is_active = false;
        $token->save();

        return response()->json([
            'message' => 'API token deactivated successfully',
            'token' => $token
        ]);
    }

    /**
     * Kích hoạt token
     */
    public function activate($id)
    {
        $token = ApiToken::findOrFail($id);
        $token->is_active = true;
        $token->save();

        return response()->json([
            'message' => 'API token activated successfully',
            'token' => $token
        ]);
    }

    /**
     * Lấy danh sách quyền có sẵn
     */
    public function permissions()
    {
        return response()->json([
            'permissions' => [
                [
                    'value' => '*',
                    'label' => 'Full Access',
                    'description' => 'Toàn quyền truy cập tất cả API'
                ],
                [
                    'value' => 'products.*',
                    'label' => 'All Product Permissions',
                    'description' => 'Toàn quyền quản lý sản phẩm'
                ],
                [
                    'value' => 'products.read',
                    'label' => 'Read Products',
                    'description' => 'Chỉ xem sản phẩm'
                ],
                [
                    'value' => 'products.create',
                    'label' => 'Create Products',
                    'description' => 'Tạo sản phẩm mới'
                ],
                [
                    'value' => 'products.update',
                    'label' => 'Update Products',
                    'description' => 'Cập nhật sản phẩm'
                ],
                [
                    'value' => 'products.delete',
                    'label' => 'Delete Products',
                    'description' => 'Xóa sản phẩm'
                ],
                [
                    'value' => 'reviews.*',
                    'label' => 'All Review Permissions',
                    'description' => 'Toàn quyền quản lý đánh giá'
                ],
                [
                    'value' => 'reviews.read',
                    'label' => 'Read Reviews',
                    'description' => 'Chỉ xem đánh giá'
                ],
                [
                    'value' => 'reviews.update',
                    'label' => 'Update Reviews',
                    'description' => 'Cập nhật đánh giá'
                ],
                [
                    'value' => 'reviews.delete',
                    'label' => 'Delete Reviews',
                    'description' => 'Xóa đánh giá'
                ],
            ]
        ]);
    }

    /**
     * Thống kê sử dụng token
     */
    public function statistics($id)
    {
        $token = ApiToken::findOrFail($id);
        
        return response()->json([
            'token_id' => $token->id,
            'token_name' => $token->name,
            'user' => $token->user->name,
            'created_at' => $token->created_at,
            'last_used_at' => $token->last_used_at,
            'is_active' => $token->is_active,
            'expires_at' => $token->expires_at,
            'rate_limit' => $token->rate_limit,
            'permissions' => $token->permissions,
            'days_since_last_use' => $token->last_used_at ? 
                now()->diffInDays($token->last_used_at) : null,
        ]);
    }
}
