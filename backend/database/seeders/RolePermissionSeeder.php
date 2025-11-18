<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Xóa cache của Spatie (rất quan trọng)
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // --- TẠO CÁC QUYỀN (PERMISSIONS) ---
        // Quyền chung (sau này có thể thêm 'edit settings', v.v.)
        Permission::firstOrCreate(['name' => 'access admin dashboard']);

        // Quyền quản lý User
        Permission::firstOrCreate(['name' => 'view users']);
        Permission::firstOrCreate(['name' => 'create users']);
        Permission::firstOrCreate(['name' => 'edit users']);
        Permission::firstOrCreate(['name' => 'delete users']);
        
        // Quyền quản lý Order
        Permission::firstOrCreate(['name' => 'view orders']);
        Permission::firstOrCreate(['name' => 'edit orders']); // (vd: cập nhật trạng thái)
        
        // Quyền quản lý Product (ví dụ)
        Permission::firstOrCreate(['name' => 'view products']);
        Permission::firstOrCreate(['name' => 'create products']);
        Permission::firstOrCreate(['name' => 'edit products']);
        Permission::firstOrCreate(['name' => 'delete products']);
        
        // Quyền quản lý Báo cáo
        Permission::firstOrCreate(['name' => 'view reports']);

        // --- TẠO CÁC VAI TRÒ (ROLES) ---

        // 1. Vai trò "Staff" (Nhân viên)
        $staffRole = Role::firstOrCreate(['name' => 'staff']);
        $staffRole->givePermissionTo([
            'access admin dashboard',
            'view orders',
            'edit orders',
            'view products',
        ]);

        // 2. Vai trò "Editor" (Biên tập viên - ví dụ)
        $editorRole = Role::firstOrCreate(['name' => 'editor']);
        $editorRole->givePermissionTo([
            'access admin dashboard',
            'view products',
            'create products',
            'edit products',
        ]);

        // 3. Vai trò "Admin" (Quản trị viên)
        // Admin có thể làm mọi thứ
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all()); // Gán tất cả các quyền

        // --- GÁN VAI TRÒ CHO USER HIỆN CÓ ---
        // (Chúng ta sẽ gán dựa trên UserSeeder của bạn)

        $this->command->info('Assigning roles to existing users...');

        $adminUser = User::where('username', 'admin')->first();
        if ($adminUser) {
            $adminUser->assignRole('admin');
        }

        $customerUser1 = User::where('username', 'ngocanh')->first();
        if ($customerUser1) {
            $customerUser1->assignRole('staff'); // Gán 'ngocanh' làm Staff (ví dụ)
        }
        
        $customerUser2 = User::where('username', 'thanhdat')->first();
        if ($customerUser2) {
            $customerUser2->assignRole('editor'); // Gán 'thanhdat' làm Editor (ví dụ)
        }
        
        // (User "Customer" thông thường không cần Role admin)
    }
}