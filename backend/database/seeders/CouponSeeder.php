<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        // Xóa dữ liệu cũ tránh trùng lặp
        DB::table('coupons')->delete();

        DB::table('coupons')->insert([
            [
                'code' => 'HE2024',
                'description' => 'Giảm 15% cho tất cả đơn hàng mùa hè.',
                'type' => 'percentage',
                'value' => 15,
                'max_value' => 50000,
                'min_order_value' => 200000,
                'max_usage' => 1000,
                'usage_count' => 245,
                'start_date' => Carbon::now()->subDays(10),
                'end_date' => Carbon::now()->addDays(20),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'WELCOME50K',
                'description' => 'Giảm 50.000đ cho khách hàng mới.',
                'type' => 'fixed_amount',
                'value' => 50000,
                'max_value' => null,
                'min_order_value' => 150000,
                'max_usage' => 500,
                'usage_count' => 500, // Đã dùng hết
                'start_date' => Carbon::now()->subMonths(1),
                'end_date' => Carbon::now()->addMonths(2),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'FLASHSEP',
                'description' => 'Flash sale tháng 9, giảm 100.000đ.',
                'type' => 'fixed_amount',
                'value' => 100000,
                'max_value' => null,
                'min_order_value' => 500000,
                'max_usage' => 100,
                'usage_count' => 12,
                'start_date' => Carbon::now()->subDays(5),
                'end_date' => Carbon::now()->subDays(1), // Đã hết hạn
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'VIP20',
                'description' => 'Ưu đãi 20% dành cho thành viên VIP.',
                'type' => 'percentage',
                'value' => 20,
                'max_value' => 150000,
                'min_order_value' => 300000,
                'max_usage' => 200,
                'usage_count' => 0,
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addYear(1),
                'is_active' => false, // Bật lại khi cần kích hoạt
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
