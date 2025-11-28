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
        DB::statement('PRAGMA foreign_keys = OFF;');
        DB::table('users')->delete();
        DB::table('userprofile')->delete();
        DB::statement('PRAGMA foreign_keys = ON;');

        // 2. Admin
        $admin = User::create([
            'username' => 'admin',
            'password' => Hash::make('123456789'),
            'email' => 'admin@gmail.com',
            'status' => 'active',
            'role' => 'admin',
        ]);

        $admin->profile()->create([
            'full_name' => 'Admin',
            'phone' => '0987654321',
            'address' => 'Thành Phố HCM, Việt Nam',
        ]);

        // 3. NguyenVanA
        $ngocanh = User::create([
            'username' => 'NguyenVanA',
            'password' => Hash::make('password'),
            'email' => 'NguyenVanA@gmail.com',
            'status' => 'active',
            'role' => 'customer',
        ]);

        $ngocanh->profile()->create([
            'full_name' => 'Nguyen Van A',
            'phone' => '0912345678',
            'address' => 'TP.HCM',
        ]);

        // 4. NguyenVanB
        $thanhdat = User::create([
            'username' => 'NguyenVanB',
            'password' => Hash::make('123456'),
            'email' => 'NguyenVanB@gmai.com',
            'status' => 'active',
            'role' => 'customer',
        ]);

        $thanhdat->profile()->create([
            'full_name' => 'Nguyen Van B',
            'phone' => '0901111222',
            'address' => 'Đà Nẵng',
        ]);
    }
}
