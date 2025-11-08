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

        // --- User 1: Admin ---
        // 2. Tạo user trong bảng 'users'
        $admin = User::create([
            'username' => 'admin',
            'password' => Hash::make('admin123'),
            'email' => 'admin@example.com',
            'status' => 'active',
            'role' => 'admin',
        ]);
        
        // 3. Dùng quan hệ 'profile()' để tạo profile trong 'userprofile'
        $admin->profile()->create([
            'full_name' => 'Admin User', // (Chúng ta thêm full_name)
            'phone' => '0987654321',
            'address' => 'Hà Nội, Việt Nam',
        ]);

        // --- User 2: Ngoc Anh ---
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

        // --- User 3: Thanh Dat ---
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
