<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order; // <-- Import
use App\Models\OrderItem; // <-- Import

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Xóa dữ liệu cũ để tránh trùng lặp (nếu muốn)
        // Order::query()->delete(); // Bảng 'order_items' sẽ tự xóa theo (cascadeOnDelete)

        // Tạo 20 đơn hàng "Đang xử lý", mỗi đơn có 3 sản phẩm
        Order::factory()
            ->count(20) // Tạo 20 đơn hàng
            ->has(OrderItem::factory()->count(3), 'items') // Mỗi đơn có 3 sản phẩm (quan hệ 'items')
            ->state(['status' => 'Đang xử lý']) // Ghi đè trạng thái
            ->create();

        // Tạo 15 đơn "Hoàn thành", mỗi đơn có 1-2 sản phẩm
        Order::factory()
            ->count(15)
            ->has(OrderItem::factory()->count(fake()->numberBetween(1, 2)), 'items')
            ->state(['status' => 'Hoàn thành'])
            ->create();
            
        // Tạo 10 đơn "Chờ thanh toán"
        Order::factory()
            ->count(10)
            ->has(OrderItem::factory()->count(2), 'items')
            ->state(['status' => 'Chờ thanh toán'])
            ->create();

        // Tạo 5 đơn "Đã hủy"
        Order::factory()
            ->count(5)
            ->has(OrderItem::factory()->count(1), 'items')
            ->state(['status' => 'Đã hủy'])
            ->create();
    }
}