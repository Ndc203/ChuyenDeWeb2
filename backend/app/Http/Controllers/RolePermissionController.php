<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class RolePermissionController extends Controller
{
    /**
     * API: GET /api/roles
     * Lấy danh sách Vai trò (Roles)
     * Kèm theo số lượng user và số lượng quyền
     */
    public function getRoles()
    {
        // Gói Spatie cho phép dùng 'withCount'
        // để tự động đếm 'users_count' và 'permissions_count'
        $roles = Role::withCount('users')->with('permissions')->get();
        
        return response()->json($roles);
    }

    /**
     * API: GET /api/permissions
     * Lấy danh sách tất cả Quyền hạn (Permissions)
     */
    public function getPermissions()
    {
        $permissions = Permission::all();
        return response()->json($permissions);
    }
    

    /**
     * API: PUT /api/roles/{role}
     * Cập nhật Vai trò và các Quyền hạn của nó
     */
    public function update(Request $request, Role $role)
    {
        // 1. Validate dữ liệu
        $validated = $request->validate([
            // Tên là bắt buộc, và phải là duy nhất (trừ chính nó)
            'name' => [
                'required',
                'string',
                Rule::unique('roles')->ignore($role->id)
            ],
            // 'permissions' phải là một mảng
            'permissions' => 'present|array',
            // Mỗi phần tử trong mảng 'permissions' phải tồn tại trong bảng 'permissions'
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        // 2. Cập nhật tên
        $role->update([
            'name' => $validated['name']
        ]);

        // 3. Đồng bộ (sync) các Quyền
        // 'syncPermissions' là hàm "thần kỳ" của Spatie:
        // - Tự động gán quyền mới
        // - Tự động gỡ quyền cũ
        $role->syncPermissions($validated['permissions']);

        // 4. Trả về role đã cập nhật
        return response()->json(
            $role->load('permissions')->loadCount('users')
        );
    }

    /**
     * API: POST /api/roles
     * Tạo một Vai trò mới
     */
    public function store(Request $request)
    {
        // 1. Validate dữ liệu
        $validated = $request->validate([
            // Tên là bắt buộc, và phải là duy nhất
            'name' => [
                'required',
                'string',
                'unique:roles,name'
            ],
            // 'permissions' phải là một mảng
            'permissions' => 'present|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        try {
            DB::beginTransaction();
            
            // 2. Tạo Role mới
            $role = Role::create([
                'name' => $validated['name']
            ]);

            // 3. Gán (sync) các Quyền
            $role->syncPermissions($validated['permissions']);
            
            DB::commit();

            // 4. Trả về role đã tạo
            return response()->json(
                $role->load('permissions')->loadCount('users'), 
                201 // 201 Created
            );

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Tạo vai trò thất bại', 'error' => $e->getMessage()], 500);
        }
    }
}