<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User; // <-- THÊM: Import model User
use App\Models\UserProfile; // <-- THÊM: Import model UserProfile

class UserSeeder extends Seeder
{
    public function run(): void
    {
       // 1. Truncate (làm rỗng) cả 2 bảng
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('users')->truncate();
        DB::table('userprofile')->truncate(); // <-- THÊM: Truncate bảng profile
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // 2. Admin
        $admin = User::create([
            'username' => 'admin',
            'password' => Hash::make('admin123'),
            'email' => 'admin@example.com',
            'status' => 'active',
            'role' => 'admin',
        ]);

        $admin->profile()->create([
            'full_name' => 'Admin User',
            'phone' => '0987654321',
            'address' => 'Hà Nội, Việt Nam',
        ]);

        // 3. Ngọc Ánh
        $ngocanh = User::create([
            'username' => 'ngocanh',
            'password' => Hash::make('password'),
            'email' => 'ngocanh@example.com',
            'status' => 'active',
            'role' => 'customer',
        ]);

        $ngocanh->profile()->create([
            'full_name' => 'Ngọc Ánh',
            'phone' => '0912345678',
            'address' => 'TP.HCM',
        ]);

        // 4. Thành Đạt
        $thanhdat = User::create([
            'username' => 'thanhdat',
            'password' => Hash::make('123456'),
            'email' => 'thanhdat@example.com',
            'status' => 'active',
            'role' => 'customer',
        ]);

        $thanhdat->profile()->create([
            'full_name' => 'Thành Đạt',
            'phone' => '0901111222',
            'address' => 'Đà Nẵng',
        ]);
    }
}
