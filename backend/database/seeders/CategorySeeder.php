<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::table('categories')->truncate();
        Schema::enableForeignKeyConstraints();

        $catalogues = [
            [
                'name' => 'Dien tu',
                'description' => 'Thiet bi dien tu, gia dung va phu kien.',
                'status' => 'active',
                'children' => [
                    [
                        'name' => 'Dien thoai & Tablet',
                        'description' => 'Dien thoai thong minh, tablet va phu kien.',
                        'status' => 'active',
                        'children' => [
                            ['name' => 'Dien thoai', 'description' => 'Smartphone cac phan khuc.'],
                            ['name' => 'May tinh bang', 'description' => 'Tablet cho hoc tap va giai tri.'],
                            ['name' => 'Phu kien di dong', 'description' => 'Op lung, sac nhanh, pin du phong.'],
                        ],
                    ],
                    [
                        'name' => 'May tinh & Laptop',
                        'description' => 'Laptop, PC lap rap va phu kien.',
                        'children' => [
                            ['name' => 'Laptop', 'description' => 'Laptop van phong, mong nhe.'],
                            ['name' => 'Laptop gaming', 'description' => 'Laptop cau hinh cao cho game.'],
                            ['name' => 'PC lap rap', 'description' => 'May tinh theo cau hinh dat hang.'],
                        ],
                    ],
                    [
                        'name' => 'Am thanh & Phu kien',
                        'description' => 'Tai nghe, loa, phu kien cong nghe.',
                        'children' => [
                            ['name' => 'Phu kien cong nghe', 'description' => 'Do choi cong nghe, thiet bi deo.'],
                            ['name' => 'Tai nghe', 'description' => 'Tai nghe bluetooth, true wireless.'],
                            ['name' => 'Loa bluetooth', 'description' => 'Loa di dong, loa mini.'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Nha cua & Doi song',
                'description' => 'San pham giup toi uu khong gian song.',
                'status' => 'active',
                'children' => [
                    [
                        'name' => 'Bep & Nau nuong',
                        'description' => 'Thiet bi bep, noi chien, lo nuong.',
                        'children' => [
                            ['name' => 'Thiet bi bep dien', 'description' => 'Bep dien tu, noi chien khong dau.'],
                            ['name' => 'Dung cu nau an', 'description' => 'Noi, chao chong dinh, dao keo.'],
                        ],
                    ],
                    [
                        'name' => 'Ve sinh gia dinh',
                        'description' => 'Thiet bi lam sach, cham soc nha cua.',
                        'children' => [
                            ['name' => 'Thiet bi lam sach', 'description' => 'May hut bui, robot lau nha.'],
                            ['name' => 'Do giat ui', 'description' => 'May giat mini, ban ui hoi nuoc.'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Thoi trang & Lam dep',
                'description' => 'Thoi trang, phu kien va cham soc ca nhan.',
                'status' => 'active',
                'children' => [
                    [
                        'name' => 'Thoi trang nam',
                        'description' => 'Trang phuc va phu kien cho nam.',
                        'children' => [
                            ['name' => 'Ao & Quan nam', 'description' => 'Ao so mi, ao thun, quan jeans.'],
                            ['name' => 'Giay dep nam', 'description' => 'Giay the thao, giay da, sandal.'],
                        ],
                    ],
                    [
                        'name' => 'Thoi trang nu',
                        'description' => 'Trang phuc va phu kien cho nu.',
                        'children' => [
                            ['name' => 'Dam & Vay', 'description' => 'Dam du tiec, vay cong so.'],
                            ['name' => 'Phu kien nu', 'description' => 'Tui xach, khan choang, trang suc.'],
                        ],
                    ],
                    [
                        'name' => 'Cham soc sac dep',
                        'description' => 'My pham, cham soc da va spa tai nha.',
                        'children' => [
                            ['name' => 'Trang diem', 'description' => 'Kem nen, son moi, bang phan.'],
                            ['name' => 'Cham soc da', 'description' => 'Sua rua mat, serum, kem chong nang.'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'The thao & Da ngoai',
                'description' => 'Thiet bi the thao, du lich va outdoor.',
                'status' => 'active',
                'children' => [
                    ['name' => 'Dung cu tap luyen', 'description' => 'May tap, ta don, day khang luc.'],
                    ['name' => 'The thao ngoai troi', 'description' => 'Xe dap, van truot, leo nui, camping.'],
                ],
            ],
            [
                'name' => 'Me & Be',
                'description' => 'San pham cho me bau va tre nho.',
                'status' => 'active',
                'children' => [
                    ['name' => 'Do so sinh', 'description' => 'Quan ao, chan goi, binh sua.'],
                    ['name' => 'Do choi giao duc', 'description' => 'Do choi phat trien tu duy, sach tranh.'],
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
