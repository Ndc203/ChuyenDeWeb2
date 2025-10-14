<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PostCommentSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('postcomments')->insert([
            ['post_id' => 1, 'user_id' => 2, 'content' => 'Bài viết rất hay!'],
            ['post_id' => 2, 'user_id' => 1, 'content' => 'Cảm ơn thông tin hữu ích.'],
        ]);
    }
}
