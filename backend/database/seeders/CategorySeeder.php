<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Tầng gốc
        $dienTu = Category::create(['name' => 'Điện tử', 'description' => 'Các sản phẩm điện tử']);
        $thoiTrang = Category::create(['name' => 'Thời trang']);
        $giaDung = Category::create(['name' => 'Gia dụng']);
        $noiThat = Category::create(['name' => 'Nội thất']);

        // Con của Điện tử
        $dt = Category::create(['name' => 'Điện thoại', 'parent_id' => $dienTu->category_id]);
        $lap = Category::create(['name' => 'Laptop', 'parent_id' => $dienTu->category_id]);

        // Con của Thời trang
        $aoNam = Category::create(['name' => 'Áo nam', 'parent_id' => $thoiTrang->category_id]);
        Category::create(['name' => 'Áo sơ mi nam', 'parent_id' => $aoNam->category_id]);
    }
}
