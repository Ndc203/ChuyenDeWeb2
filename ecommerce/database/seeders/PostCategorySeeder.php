<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PostCategorySeeder extends Seeder
{
    public function run(): void
    {
        DB::table('postcategories')->insert([
            [
                'name' => 'Tin công nghệ',
                'description' => 'Cập nhật xu hướng và tin tức mới nhất trong lĩnh vực công nghệ.',
            ],
            [
                'name' => 'Đánh giá sản phẩm',
                'description' => 'Các bài đánh giá chi tiết về laptop, PC và linh kiện.',
            ],
            [
                'name' => 'Thủ thuật máy tính',
                'description' => 'Chia sẻ mẹo, hướng dẫn, tối ưu hệ thống cho người dùng.',
            ],
        ]);
    }
}
