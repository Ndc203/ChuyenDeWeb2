<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        Category::query()->delete();
        Schema::enableForeignKeyConstraints();

        $catalogues = [
            [
                'name' => 'Điện tử',
                'description' => 'Thiết bị điện tử, gia dụng thông minh và phụ kiện.',
                'status' => 'active',
                'children' => [
                    [
                        'name' => 'Điện thoại & Tablet',
                        'description' => 'Điện thoại thông minh, tablet và phụ kiện đi kèm.',
                        'status' => 'active',
                        'children' => [
                            [
                                'name' => 'Điện thoại thông minh',
                                'description' => 'iPhone, Android flagship và phân khúc tầm trung.',
                            ],
                            [
                                'name' => 'Máy tính bảng',
                                'description' => 'iPad, tablet Android phục vụ học tập và giải trí.',
                            ],
                            [
                                'name' => 'Phụ kiện di động',
                                'description' => 'Ốp lưng, sạc nhanh, pin dự phòng.',
                            ],
                        ],
                    ],
                    [
                        'name' => 'Máy tính & Laptop',
                        'description' => 'Laptop học tập, làm việc và máy tính để bàn.',
                        'children' => [
                            [
                                'name' => 'Laptop văn phòng',
                                'description' => 'Laptop mỏng nhẹ, pin bền cho dân công sở.',
                            ],
                            [
                                'name' => 'Laptop gaming',
                                'description' => 'Laptop cấu hình mạnh, card rời cho game thủ.',
                            ],
                            [
                                'name' => 'PC lắp ráp',
                                'description' => 'Máy tính để bàn theo cấu hình đặt hàng.',
                            ],
                        ],
                    ],
                    [
                        'name' => 'Âm thanh & Phụ kiện',
                        'description' => 'Tai nghe, loa bluetooth và phụ kiện công nghệ.',
                        'children' => [
                            [
                                'name' => 'Tai nghe',
                                'description' => 'Tai nghe bluetooth, true wireless, chống ồn.',
                            ],
                            [
                                'name' => 'Loa bluetooth',
                                'description' => 'Loa di động, loa mini cho không gian nhỏ.',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Nhà cửa & Đời sống',
                'description' => 'Sản phẩm giúp tối ưu không gian sống gia đình.',
                'status' => 'active',
                'children' => [
                    [
                        'name' => 'Bếp & Nấu nướng',
                        'description' => 'Thiết bị bếp, đồ gia dụng hỗ trợ nấu ăn nhanh.',
                        'children' => [
                            [
                                'name' => 'Thiết bị bếp điện',
                                'description' => 'Bếp điện từ, nồi chiên không dầu, lò nướng.',
                            ],
                            [
                                'name' => 'Dụng cụ nấu ăn',
                                'description' => 'Nồi, chảo chống dính, dao kéo và đồ nhà bếp.',
                            ],
                        ],
                    ],
                    [
                        'name' => 'Vệ sinh gia đình',
                        'description' => 'Thiết bị làm sạch, đồ dùng chăm sóc nhà cửa.',
                        'children' => [
                            [
                                'name' => 'Thiết bị làm sạch',
                                'description' => 'Máy hút bụi, robot lau nhà, máy lọc không khí.',
                            ],
                            [
                                'name' => 'Đồ giặt ủi',
                                'description' => 'Máy giặt mini, bàn ủi hơi nước, giá phơi thông minh.',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Thời trang & Làm đẹp',
                'description' => 'Thời trang, phụ kiện và sản phẩm chăm sóc cá nhân.',
                'status' => 'active',
                'children' => [
                    [
                        'name' => 'Thời trang nam',
                        'description' => 'Trang phục, phụ kiện dành cho nam giới.',
                        'children' => [
                            [
                                'name' => 'Áo & Quần nam',
                                'description' => 'Áo sơ mi, áo thun, quần jeans, quần âu.',
                            ],
                            [
                                'name' => 'Giày dép nam',
                                'description' => 'Giày thể thao, giày da, dép sandal.',
                            ],
                        ],
                    ],
                    [
                        'name' => 'Thời trang nữ',
                        'description' => 'Trang phục, phụ kiện dành cho nữ giới.',
                        'children' => [
                            [
                                'name' => 'Đầm & Váy',
                                'description' => 'Đầm dạ hội, váy công sở, váy maxi.',
                            ],
                            [
                                'name' => 'Phụ kiện nữ',
                                'description' => 'Túi xách, khăn choàng, trang sức thời trang.',
                            ],
                        ],
                    ],
                    [
                        'name' => 'Chăm sóc sắc đẹp',
                        'description' => 'Mỹ phẩm, dụng cụ làm đẹp và spa tại nhà.',
                        'children' => [
                            [
                                'name' => 'Trang điểm',
                                'description' => 'Kem nền, son môi, bảng phấn mắt.',
                            ],
                            [
                                'name' => 'Chăm sóc da',
                                'description' => 'Sữa rửa mặt, serum, kem chống nắng.',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Thể thao & Dã ngoại',
                'description' => 'Thiết bị thể thao, du lịch và outdoor.',
                'status' => 'active',
                'children' => [
                    [
                        'name' => 'Dụng cụ tập luyện',
                        'description' => 'Máy tập, tạ đơn, dây kháng lực hỗ trợ gym tại nhà.',
                    ],
                    [
                        'name' => 'Thể thao ngoài trời',
                        'description' => 'Xe đạp, ván trượt, đồ leo núi, camping.',
                    ],
                ],
            ],
            [
                'name' => 'Mẹ & Bé',
                'description' => 'Sản phẩm cho mẹ bầu, trẻ sơ sinh và trẻ nhỏ.',
                'status' => 'active',
                'children' => [
                    [
                        'name' => 'Đồ sơ sinh',
                        'description' => 'Quần áo, chăn ủ, bình sữa cho bé sơ sinh.',
                    ],
                    [
                        'name' => 'Đồ chơi giáo dục',
                        'description' => 'Đồ chơi phát triển tư duy, sách vải, bảng số.',
                    ],
                ],
            ],
        ];

        foreach ($catalogues as $root) {
            $this->seedTree($root);
        }
    }

    private function seedTree(array $data, ?int $parentId = null): void
    {
        $category = Category::create([
            'name' => $data['name'],
            'slug' => Category::generateUniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'parent_id' => $parentId,
            'status' => $data['status'] ?? 'active',
        ]);

        foreach ($data['children'] ?? [] as $child) {
            $this->seedTree($child, $category->category_id);
        }
    }
}
