<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Product;
use App\Models\User;

class ProductReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Xóa tất cả reviews cũ
        DB::table('productreviews')->truncate();

        // Lấy danh sách sản phẩm và users thực sự tồn tại
        $products = Product::pluck('product_id')->toArray();
        $users = User::pluck('user_id')->toArray();

        if (empty($products)) {
            $this->command->warn('Không có sản phẩm nào trong database. Vui lòng chạy ProductSeeder trước.');
            return;
        }

        if (empty($users)) {
            $this->command->warn('Không có user nào trong database. Vui lòng chạy UserSeeder trước.');
            return;
        }

        // Lấy một vài sản phẩm đầu tiên để tạo reviews
        $reviewProducts = array_slice($products, 0, min(3, count($products)));

        $comments = [
            'Sản phẩm rất tốt, đáng mua!',
            'Chất lượng tuyệt vời, giao hàng nhanh!',
            'Sản phẩm ổn, giá hợp lý.',
            'Rất hài lòng với sản phẩm này!',
            'Sản phẩm như mô tả, đóng gói cẩn thận.',
            'Chất lượng không tốt lắm, hơi thất vọng.',
            'Giá hơi đắt nhưng chất lượng xứng đáng.',
            'Sẽ mua lại lần sau!',
            'Shop phục vụ tốt, sản phẩm đẹp.',
            'Màu sắc đẹp, kiểu dáng hiện đại.',
        ];

        $reviews = [];

        foreach ($reviewProducts as $productId) {
            // Tạo 3-5 reviews cho mỗi sản phẩm
            $numReviews = rand(3, 5);
            
            for ($i = 0; $i < $numReviews; $i++) {
                $userId = $users[array_rand($users)];
                
                // Kiểm tra xem user đã review sản phẩm này chưa
                $exists = DB::table('productreviews')
                    ->where('product_id', $productId)
                    ->where('user_id', $userId)
                    ->exists();
                
                if (!$exists) {
                    $reviews[] = [
                        'product_id' => $productId,
                        'user_id' => $userId,
                        'rating' => rand(3, 5), // Rating từ 3-5 sao
                        'comment' => $comments[array_rand($comments)],
                        'status' => ['approved', 'pending', 'approved', 'approved'][rand(0, 3)], // 75% approved
                        'helpful_count' => rand(0, 15),
                        'created_at' => Carbon::now()->subDays(rand(1, 30)),
                        'updated_at' => Carbon::now()->subDays(rand(1, 30)),
                    ];
                }
            }
        }

        if (!empty($reviews)) {
            foreach ($reviews as $review) {
                DB::table('productreviews')->insert($review);
            }
            $this->command->info('✓ Đã tạo ' . count($reviews) . ' đánh giá sản phẩm');
        } else {
            $this->command->warn('Không tạo được review nào.');
        }
    }
}
