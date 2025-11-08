<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
// Không cần import OrderItem vì nó đã được --model

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // Chúng ta KHÔNG cần 'order_id' ở đây, 
            // vì seeder sẽ tự động gán nó.
            
            'product_id' => null, // Bỏ qua nếu chưa có bảng products
            'product_name' => fake()->words(3, true), // vd: "Áo Thun Nam"
            'quantity' => fake()->numberBetween(1, 3),
            'unit_price' => fake()->randomElement([150000, 200000, 350000, 500000]),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}