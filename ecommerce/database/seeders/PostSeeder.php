<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PostSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('posts')->insert([
            [
                'user_id' => 1,
                'category_id' => 1,
                'title' => 'Chào mừng đến với blog công nghệ',
                'content' => 'Bài viết đầu tiên trên website của chúng tôi.',
                'is_trending' => true,
            ],
            [
                'user_id' => 2,
                'category_id' => 2,
                'title' => 'Giảm giá lớn mùa lễ hội',
                'content' => 'Cơ hội mua hàng giá sốc!',
                'is_trending' => false,
            ],
        ]);
    }
}
