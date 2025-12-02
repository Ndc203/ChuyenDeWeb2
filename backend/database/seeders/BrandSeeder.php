<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::table('brands')->truncate();
        Schema::enableForeignKeyConstraints();

        $brands = [
            ['name' => 'Apple', 'description' => 'Thiet bi cao cap, he sinh thai dong bo.'],
            ['name' => 'Samsung', 'description' => 'Thuong hieu Han Quoc dan dau ve dien tu va gia dung.'],
            ['name' => 'Sony', 'description' => 'Am thanh, hinh anh va giai tri tu Nhat Ban.'],
            ['name' => 'Xiaomi', 'description' => 'Cong nghe gia tot, he sinh thai IoT phong phu.'],
            ['name' => 'Huawei', 'description' => 'Thiet bi di dong va giai phap doanh nghiep.'],
            ['name' => 'Asus', 'description' => 'Laptop va gaming gear cho game thu va designer.'],
            ['name' => 'Lenovo', 'description' => 'Laptop ThinkPad, IdeaPad va giai phap may tram.'],
            ['name' => 'Dell', 'description' => 'May tinh doanh nghiep va man hinh chuyen nghiep.'],
            ['name' => 'LG', 'description' => 'Gia dung, TV OLED va dien tu tieu dung.'],
            ['name' => 'Philips', 'description' => 'Gia dung, cham soc suc khoe va chieu sang.'],
            ['name' => 'Nike', 'description' => 'Thoi trang the thao va giay dep.'],
            ['name' => 'Loreal', 'description' => 'My pham va cham soc da.'],
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
