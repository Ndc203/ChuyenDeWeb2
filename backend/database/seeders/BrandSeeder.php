<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('brands')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $brands = [
            [
                'name' => 'Apple',
                'description' => 'Thiet bi cong nghe cao cap cho nguoi dung cao cap.',
            ],
            [
                'name' => 'Samsung',
                'description' => 'Nha san xuat dien tu va thiet bi gia dung lon nhat Han Quoc.',
            ],
            [
                'name' => 'Sony',
                'description' => 'Thuong hieu Nhat Ban voi cac san pham nghe nhin chat luong cao.',
            ],
            [
                'name' => 'Xiaomi',
                'description' => 'Thuong hieu cong nghe voi gia thanh canh tranh va da dang san pham.',
            ],
            [
                'name' => 'LG',
                'description' => 'Do gia dung va dien tu tich hop nhieu cong nghe hien dai.',
            ],
            [
                'name' => 'Dell',
                'description' => 'Thuong hieu may tinh pho bien cho ca doanh nghiep va ca nhan.',
            ],
            [
                'name' => 'HP',
                'description' => 'San pham may tinh, thiet bi van phong dang tin cay.',
            ],
            [
                'name' => 'Lenovo',
                'description' => 'Do ben va hieu nang tot cho laptop va thiet bi doanh nghiep.',
            ],
            [
                'name' => 'Asus',
                'description' => 'Laptop, gaming gear va phu kien cong nghe thiet ke dep.',
            ],
            [
                'name' => 'Microsoft',
                'description' => 'Thiet bi Surface va phu kien diem nhan trong he sinh thai Windows.',
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
