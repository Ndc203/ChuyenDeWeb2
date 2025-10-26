<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            [
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'email' => 'admin@example.com',
                'phone' => '0987654321',
                'address' => 'Hà Nội, Việt Nam',
                'status' => 'active',
                'role' => 'admin',
                'created_at' => now(),
            ],
            [
                'username' => 'ngocanh',
                'password' => Hash::make('password'),
                'email' => 'ngocanh@example.com',
                'phone' => '0912345678',
                'address' => 'TP.HCM',
                'status' => 'active',
                'role' => 'customer',
                'created_at' => now(),
            ],
            [
                'username' => 'thanhdat',
                'password' => Hash::make('123456'),
                'email' => 'thanhdat@example.com',
                'phone' => '0901111222',
                'address' => 'Đà Nẵng',
                'status' => 'active',
                'role' => 'customer',
                'created_at' => now(),
            ],
        ]);
    }
}
