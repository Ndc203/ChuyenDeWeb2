<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PostCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('postcategories')->insert([
            [
                'name' => 'Tin công nghệ',
                'description' => 'Cập nhật xu hướng và tin tức mới nhất trong lĩnh vực công nghệ.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Đánh giá sản phẩm',
                'description' => 'Các bài đánh giá chi tiết về laptop, PC và linh kiện.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Thủ thuật máy tính',
                'description' => 'Chia sẻ mẹo, hướng dẫn, tối ưu hệ thống cho người dùng.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
