<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User; // <-- THÊM: Import model User

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Xóa dữ liệu đơn hàng cũ
        Order::query()->delete(); // Bảng 'order_items' sẽ tự xóa theo

        // Lấy ID của các user bạn đã tạo trong UserSeeder
        // Dùng 'firstOrFail()' để đảm bảo seeder dừng nếu không tìm thấy user
        $adminId = User::where('username', 'admin')->firstOrFail()->user_id;
        $ngocanhId = User::where('username', 'NguyenVanA')->firstOrFail()->user_id;
        $thanhdatId = User::where('username', 'NguyenVanB')->firstOrFail()->user_id;
        
        $userIds = [$adminId, $ngocanhId, $thanhdatId];

        // Tạo 20 đơn "Đang xử lý"
        Order::factory()
            ->count(20)
            ->has(OrderItem::factory()->count(3), 'items') // Mỗi đơn có 3 sản phẩm
            ->state(function (array $attributes) use ($userIds) {
                // Gán ngẫu nhiên 1 user_id và trạng thái
                return [
                    'user_id' => $userIds[array_rand($userIds)],
                    'status' => 'Đang xử lý'
                ];
            })
            ->create();

        // Tạo 15 đơn "Hoàn thành"
        Order::factory()
            ->count(15)
            ->has(OrderItem::factory()->count(fake()->numberBetween(1, 2)), 'items')
            ->state(function (array $attributes) use ($userIds) {
                return [
                    'user_id' => $userIds[array_rand($userIds)],
                    'status' => 'Hoàn thành'
                ];
            })
            ->create();
            
        // Tạo 10 đơn "Chờ thanh toán"
        Order::factory()
            ->count(10)
            ->has(OrderItem::factory()->count(2), 'items')
            ->state(function (array $attributes) use ($userIds) {
                return [
                    'user_id' => $userIds[array_rand($userIds)],
                    'status' => 'Chờ thanh toán'
                ];
            })
            ->create();

        // Tạo 5 đơn "Đã hủy" (và 5 đơn không có user_id - khách vãng lai)
        Order::factory()
            ->count(5)
            ->has(OrderItem::factory()->count(1), 'items')
            ->state(['status' => 'Đã hủy', 'user_id' => $userIds[array_rand($userIds)]])
            ->create();
            
        Order::factory()
            ->count(5) // 5 đơn của khách vãng lai
            ->has(OrderItem::factory()->count(1), 'items')
            ->state(['status' => 'Hoàn thành', 'user_id' => null])
            ->create();
    }
}
