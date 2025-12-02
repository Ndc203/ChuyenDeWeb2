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

        // --- TẠO CÁC QUYỀN (PERMISSIONS) BẰNG TIẾNG VIỆT ---

        // Quyền Admin Chung
        Permission::firstOrCreate(['name' => 'Truy cập Admin']);
        Permission::firstOrCreate(['name' => 'Xem Báo cáo']);

        // Quyền Quản lý User (Thường chỉ Super-Admin có)
        Permission::firstOrCreate(['name' => 'Xem Người dùng']);
        Permission::firstOrCreate(['name' => 'Tạo Người dùng']);
        Permission::firstOrCreate(['name' => 'Sửa Người dùng']);
        Permission::firstOrCreate(['name' => 'Xóa Người dùng']);
        Permission::firstOrCreate(['name' => 'Quản lý Phân quyền']); // Quyền xem trang phân quyền

        // Quyền Quản lý Đơn hàng
        Permission::firstOrCreate(['name' => 'Xem Đơn hàng']);
        Permission::firstOrCreate(['name' => 'Sửa Đơn hàng']); // (Cập nhật trạng thái)

        // Quyền Quản lý Sản phẩm
        Permission::firstOrCreate(['name' => 'Xem (tất cả) Sản phẩm']);
        Permission::firstOrCreate(['name' => 'Xóa (tất cả) Sản phẩm']);
        Permission::firstOrCreate(['name' => 'Quản lý (riêng) Sản phẩm Shop']); // <-- QUYỀN CHO SHOP

        // Quyền Quản lý Bài viết
        Permission::firstOrCreate(['name' => 'Xem (tất cả) Bài viết']);
        Permission::firstOrCreate(['name' => 'Xóa (tất cả) Bài viết']);
        Permission::firstOrCreate(['name' => 'Quản lý (riêng) Bài viết']); // <-- QUYỀN CHO USER

        // --- TẠO CÁC VAI TRÒ (ROLES) VÀ GÁN QUYỀN ---

        // 1. Vai trò "User" (Khách hàng)
        $userRole = Role::firstOrCreate(['name' => 'customer']); // Thống nhất là 'customer' nhé
        $userRole->syncPermissions([
            'Quản lý (riêng) Bài viết',
        ]);

        // 2. Vai trò "Admin" (Quản trị viên - Quản lý TẤT CẢ)
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        // --- GÁN VAI TRÒ CHO USER HIỆN CÓ ---
        // (Chúng ta sẽ gán lại dựa trên UserSeeder của bạn)

        $this->command->info('Assigning roles to existing users...');

        $adminUser = User::where('username', 'admin')->first();
        if ($adminUser) {
            $adminUser->assignRole('admin');
        }

        // Ví dụ: gán 'ngocanh' làm Staff, 'thanhdat' làm Shop Owner
        $customerUser1 = User::where('username', 'ngocanh')->first();
        if ($customerUser1) {
            $customerUser1->assignRole('customer');
        }
        
        $customerUser2 = User::where('username', 'thanhdat')->first();
        if ($customerUser2) {
            $customerUser2->assignRole('customer');
        }
    }
}