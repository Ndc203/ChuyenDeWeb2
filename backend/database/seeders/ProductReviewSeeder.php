<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProductReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $reviews = [
            [
                'product_id' => 1,
                'user_id' => 1,
                'rating' => 5,
                'comment' => 'Sản phẩm rất tuyệt vời! Chất lượng camera xuất sắc, hiệu năng mượt mà. Đáng đồng tiền bát gạo.',
                'status' => 'approved',
                'helpful_count' => 12,
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(5),
            ],
            [
                'product_id' => 2,
                'user_id' => 2,
                'rating' => 4,
                'comment' => 'Điện thoại tốt. 5 Pen rất ích cho công việc. Tuy nhiên pin yếu ích nếu sử dụng nhiều.',
                'status' => 'approved',
                'helpful_count' => 8,
                'created_at' => Carbon::now()->subDays(3),
                'updated_at' => Carbon::now()->subDays(3),
            ],
            [
                'product_id' => 1,
                'user_id' => 3,
                'rating' => 2,
                'comment' => 'Giá quá đắt so với chất lượng. Không đáng tiền.',
                'status' => 'rejected',
                'helpful_count' => 0,
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ],
            [
                'product_id' => 1,
                'user_id' => 1,
                'rating' => 5,
                'comment' => 'Máy chạy mượt, thiết kế đẹp. Rất hài lòng với sản phẩm này!',
                'status' => 'pending',
                'helpful_count' => 0,
                'created_at' => Carbon::now()->subDays(1),
                'updated_at' => Carbon::now()->subDays(1),
            ],
        ];

        foreach ($reviews as $review) {
            DB::table('productreviews')->insert($review);
        }
    }
}
