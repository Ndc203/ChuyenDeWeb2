<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;

class ProductSeeder extends Seeder
{
    /**
     * Tải ảnh từ URL và lưu vào thư mục local
     */
    private function downloadImage($url, $filename)
    {
        try {
            $path = public_path('images/products/' . $filename);
            
            // Tạo thư mục nếu chưa tồn tại
            if (!File::exists(public_path('images/products'))) {
                File::makeDirectory(public_path('images/products'), 0755, true);
            }
            
            // Tải ảnh từ URL
            $imageContent = @file_get_contents($url);
            
            if ($imageContent !== false) {
                file_put_contents($path, $imageContent);
                return $filename;
            }
            
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Lấy category_id và brand_id từ database
        $categories = DB::table('categories')->pluck('category_id', 'name');
        $brands = DB::table('brands')->pluck('brand_id', 'name');
        $products = [
            [
                'name' => 'iPhone 15 Pro Max',
                'slug' => Str::slug('iPhone 15 Pro Max'),
                'description' => 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình Super Retina XDR 6.7 inch.',
                'price' => 29990000,
                'discount' => 5,
                'stock' => 25,
                'category_id' => $categories['Điện thoại'] ?? null,
                'brand_id' => $brands['Apple'] ?? null,
                'is_flash_sale' => false,
                'is_new' => true,
                'tags' => 'hot',
                'image' => 'iphone-15-pro-max.jpg',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Samsung Galaxy S24 Ultra',
                'slug' => Str::slug('Samsung Galaxy S24 Ultra'),
                'description' => 'Samsung Galaxy S24 Ultra với bút S Pen, camera 200MP, màn hình Dynamic AMOLED 2X.',
                'price' => 26990000,
                'discount' => 10,
                'stock' => 18,
                'category_id' => $categories['Điện thoại'] ?? null,
                'brand_id' => $brands['Samsung'] ?? null,
                'is_flash_sale' => true,
                'is_new' => false,
                'tags' => null,
                'image' => 'samsung.jpg',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'MacBook Pro M3',
                'slug' => Str::slug('MacBook Pro M3'),
                'description' => 'MacBook Pro 14 inch với chip M3, RAM 16GB, SSD 512GB, màn hình Liquid Retina XDR.',
                'price' => 43990000,
                'discount' => 0,
                'stock' => 12,
                'category_id' => $categories['Laptop'] ?? null,
                'brand_id' => $brands['Apple'] ?? null,
                'is_flash_sale' => false,
                'is_new' => false,
                'tags' => 'hot',
                'image' => 'macbookM3.jpg',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Dell XPS 13',
                'slug' => Str::slug('Dell XPS 13'),
                'description' => 'Dell XPS 13 với Intel Core i7 Gen 13, RAM 16GB, SSD 512GB, màn hình InfinityEdge.',
                'price' => 32990000,
                'discount' => 15,
                'stock' => 8,
                'category_id' => $categories['Laptop'] ?? null,
                'brand_id' => $brands['Dell'] ?? null,
                'is_flash_sale' => true,
                'is_new' => false,
                'tags' => null,
                'image' => 'dellXPS13.jpg',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'iPad Pro 12.9',
                'slug' => Str::slug('iPad Pro 12.9'),
                'description' => 'iPad Pro 12.9 inch với chip M2, màn hình Liquid Retina XDR, hỗ trợ Apple Pencil.',
                'price' => 24990000,
                'discount' => 8,
                'stock' => 15,
                'category_id' => $categories['Điện tử'] ?? null,
                'brand_id' => $brands['Apple'] ?? null,
                'is_flash_sale' => false,
                'is_new' => true,
                'tags' => null,
                'image' => 'ipad-pro.jpg',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'AirPods Pro 2',
                'slug' => Str::slug('AirPods Pro 2'),
                'description' => 'AirPods Pro thế hệ 2 với chip H2, chống ồn chủ động, hộp sạc MagSafe.',
                'price' => 6490000,
                'discount' => 12,
                'stock' => 45,
                'category_id' => $categories['Phụ kiện công nghệ'] ?? null,
                'brand_id' => $brands['Apple'] ?? null,
                'is_flash_sale' => true,
                'is_new' => false,
                'tags' => 'hot',
                'image' => 'apr2.jpg',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sony WH-1000XM5',
                'slug' => Str::slug('Sony WH-1000XM5'),
                'description' => 'Tai nghe Sony WH-1000XM5 chống ồn hàng đầu, thời lượng pin 30 giờ.',
                'price' => 8990000,
                'discount' => 0,
                'stock' => 20,
                'category_id' => $categories['Phụ kiện công nghệ'] ?? null,
                'brand_id' => $brands['Sony'] ?? null,
                'is_flash_sale' => false,
                'is_new' => true,
                'tags' => 'hot',
                'image' => 'Sony WH-1000XM5.jpg',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Apple Watch Series 9',
                'slug' => Str::slug('Apple Watch Series 9'),
                'description' => 'Apple Watch Series 9 với chip S9, màn hình Always-On Retina, theo dõi sức khỏe.',
                'price' => 10990000,
                'discount' => 7,
                'stock' => 30,
                'category_id' => $categories['Phụ kiện công nghệ'] ?? null,
                'brand_id' => $brands['Apple'] ?? null,
                'is_flash_sale' => false,
                'is_new' => true,
                'tags' => null,
                'image' => 'apple-watch-series-9.jpg',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('products')->insert($products);
        
        echo "✓ Đã thêm " . count($products) . " sản phẩm vào database.\n";

        // Tạo một số review mẫu
        $productIds = DB::table('products')->pluck('product_id');
        $userIds = DB::table('users')->pluck('user_id');

        if ($productIds->isNotEmpty() && $userIds->isNotEmpty()) {
            $reviews = [];
            foreach ($productIds as $productId) {
                // Tạo 3-5 review cho mỗi sản phẩm
                $reviewCount = rand(3, 5);
                for ($i = 0; $i < $reviewCount; $i++) {
                    $reviews[] = [
                        'product_id' => $productId,
                        'user_id' => $userIds->random(),
                        'rating' => rand(4, 5), // Rating từ 4-5 sao
                        'comment' => 'Sản phẩm rất tốt, đáng mua!',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
            DB::table('productreviews')->insert($reviews);
        }
    }
}
