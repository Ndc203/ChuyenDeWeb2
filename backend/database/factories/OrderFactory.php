<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Order; // <-- Nhớ import Model

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // Dùng thư viện Faker (fake()) để tạo dữ liệu ngẫu nhiên
            'user_id' => null, // Giả sử là khách vãng lai
            'customer_name' => fake()->name(),
            'customer_email' => fake()->unique()->safeEmail(),
            'customer_phone' => fake()->phoneNumber(),
            'shipping_address' => fake()->address(),
            
            // Tạm thời để tổng tiền là 0, chúng ta sẽ cập nhật sau
            'total_amount' => 0,
            'discount_amount' => 0,
            'final_amount' => 0,
            
            'coupon_code' => fake()->randomElement([null, 'SALE50K', 'VIP100']),
            
            // Tạo trạng thái ngẫu nhiên
            'status' => fake()->randomElement([
                'Chờ thanh toán', 
                'Đang xử lý', 
                'Đang giao', 
                'Hoàn thành', 
                'Đã hủy'
            ]),
            
            'created_at' => fake()->dateTimeBetween('-1 year', 'now'), // Ngày ngẫu nhiên trong 1 năm qua
            'updated_at' => fn (array $attributes) => $attributes['created_at'],
        ];
    }

    /**
     * Cấu hình factory - Đây là phần quan trọng
     */
    public function configure(): static
    {
        // Chạy hàm này SAU KHI đơn hàng (Order) đã được tạo
        // và các order_items của nó cũng đã được tạo
        return $this->afterCreating(function (Order $order) {
            
            // 1. Lấy tổng tiền từ các 'items' của đơn hàng
            $total = $order->items->sum(function ($item) {
                return $item->unit_price * $item->quantity;
            });

            // 2. Tính tiền giảm giá (nếu có coupon)
            $discount = $order->coupon_code ? fake()->randomElement([50000, 100000]) : 0;
            
            // 3. Tính tiền cuối cùng
            $final = $total - $discount;
            if ($final < 0) {
                $final = 0; // Đảm bảo không bị âm
            }

            // 4. Cập nhật lại đơn hàng với số tiền chính xác
            $order->update([
                'total_amount' => $total,
                'discount_amount' => $discount,
                'final_amount' => $final,
            ]);
        });
    }
}