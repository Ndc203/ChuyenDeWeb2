<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF;');
        Brand::query()->delete();
        DB::statement('PRAGMA foreign_keys = ON;');

        $brands = [
            [
                'name' => 'Apple',
                'description' => 'Thiết bị cao cấp, hệ sinh thái khép kín dành cho người dùng sáng tạo.',
            ],
            [
                'name' => 'Samsung',
                'description' => 'Thương hiệu Hàn Quốc dẫn đầu về điện thoại, TV và đồ gia dụng thông minh.',
            ],
            [
                'name' => 'Sony',
                'description' => 'Thiết bị nghe nhìn, máy ảnh và giải trí đẳng cấp từ Nhật Bản.',
            ],
            [
                'name' => 'Xiaomi',
                'description' => 'Công nghệ giá tốt với hệ sinh thái IoT phong phú cho gia đình.',
            ],
            [
                'name' => 'Huawei',
                'description' => 'Thiết bị di động, mạng viễn thông và giải pháp doanh nghiệp toàn cầu.',
            ],
            [
                'name' => 'Asus',
                'description' => 'Laptop, gaming gear và thiết bị sáng tạo dành cho game thủ, designer.',
            ],
            [
                'name' => 'Lenovo',
                'description' => 'Laptop ThinkPad, IdeaPad và giải pháp máy trạm bền bỉ.',
            ],
            [
                'name' => 'Dell',
                'description' => 'Máy tính doanh nghiệp, máy trạm Precision và màn hình chuyên nghiệp.',
            ],
            [
                'name' => 'LG',
                'description' => 'Thiết bị gia dụng, TV OLED và các sản phẩm điện tử tiên tiến.',
            ],
            [
                'name' => 'Philips',
                'description' => 'Thương hiệu Hà Lan với đồ gia dụng, chăm sóc sức khỏe và chiếu sáng.',
            ],
            [
                'name' => 'Nike',
                'description' => 'Thời trang thể thao, giày dép và phụ kiện luyện tập hàng đầu thế giới.',
            ],
            [
                'name' => 'L\'Oréal',
                'description' => 'Mỹ phẩm, chăm sóc da và tóc với công nghệ làm đẹp tiên phong.',
            ],
        ];

        foreach ($brands as $brand) {
            Brand::create([
                'name' => $brand['name'],
                'description' => $brand['description'],
                'slug' => Brand::generateUniqueSlug($brand['name']),
                'status' => 'active',
            ]);
        }
    }
}
