<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('categories')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $trees = [
            [
                'name' => 'Dien tu',
                'description' => 'Thiet bi cong nghe va phu kien',
                'children' => [
                    [
                        'name' => 'Dien thoai',
                        'description' => 'Smartphone va feature phone',
                    ],
                    [
                        'name' => 'Laptop',
                        'description' => 'Laptop, ultrabook va gaming',
                    ],
                    [
                        'name' => 'Phu kien cong nghe',
                        'description' => 'Tai nghe, sac du phong, day cap',
                    ],
                ],
            ],
            [
                'name' => 'Gia dung',
                'description' => 'Do gia dung cho gia dinh',
                'children' => [
                    [
                        'name' => 'Nau nuong',
                        'description' => 'Noi com dien, bep dien tu, noi chien',
                    ],
                    [
                        'name' => 'Ve sinh nha cua',
                        'description' => 'May hut bui, cay lau nha',
                    ],
                ],
            ],
            [
                'name' => 'Thoi trang',
                'description' => 'Quan ao, phu kien thoi trang',
                'children' => [
                    [
                        'name' => 'Thoi trang nam',
                        'children' => [
                            [
                                'name' => 'Ao thun nam',
                                'description' => 'Ao thun cotton, form rong',
                            ],
                            [
                                'name' => 'Giay the thao nam',
                                'description' => 'Giay sneaker va chay bo',
                            ],
                        ],
                    ],
                    [
                        'name' => 'Thoi trang nu',
                        'children' => [
                            [
                                'name' => 'Dam ngu nu',
                                'description' => 'Dam ngu lua va cotton',
                            ],
                            [
                                'name' => 'Tui xach nu',
                                'description' => 'Tui xach vai, tui deo cheo',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Noi that',
                'description' => 'Do noi that cho can ho',
                'children' => [
                    [
                        'name' => 'Phong khach',
                        'description' => 'Sofa, ban tra, ke tivi',
                    ],
                    [
                        'name' => 'Phong ngu',
                        'description' => 'Giuong, tu quan ao, nem',
                    ],
                ],
            ],
        ];

        foreach ($trees as $tree) {
            $this->seedTree($tree);
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
