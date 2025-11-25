<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PostCommentSeeder extends Seeder
{
    public function run(): void
    {
        $posts = DB::table('posts')->pluck('post_id');
        $users = DB::table('users')->pluck('user_id');

        $now = Carbon::now();
        $commentSamples = [
            '<p>Hay quá! Cảm ơn bạn đã chia sẻ.</p>',
            '<p><strong>Bài viết rất hữu ích</strong>, mình đã áp dụng thành công.</p>',
            '<p>Thực sự chi tiết, mong có thêm phần 2 nhé!</p>',
            '<p>Mình thấy phần này cần thêm ví dụ thực tế hơn!</p>',
            '<p>Bài viết chất lượng, viết thêm về chủ đề AI đi bạn!</p>',
            '<p>Wow, đọc xong hiểu rõ luôn. Cảm ơn tác giả!</p>',
            '<p>Không đồng ý lắm, nhưng cũng rất đáng đọc!</p>',
            '<p>Mình thử rồi, đúng như bạn nói.<br>Rất hiệu quả!</p>',
        ];

        $commentsBatch = [];

        foreach ($posts as $postId) {
            $firstLevelCount = rand(2, 4); // Số comment cấp 1

            for ($i = 0; $i < $firstLevelCount; $i++) {
                $parentCommentId = DB::table('comments')->insertGetId([
                    'post_id' => $postId,
                    'user_id' => $users->random(),
                    'content' => $commentSamples[array_rand($commentSamples)],
                    'parent_id' => null,
                    'created_at' => $now->copy()->subDays(rand(1, 5))->addMinutes(rand(50, 500)),
                    'updated_at' => $now,
                ]);

                // Cấp 2 (trả lời comment cấp 1)
                if (rand(0, 1)) {
                    $secondLevelCount = rand(1, 3);

                    for ($j = 0; $j < $secondLevelCount; $j++) {
                        $childId = DB::table('comments')->insertGetId([
                            'post_id' => $postId,
                            'user_id' => $users->random(),
                            'content' => '<p>↳ ' . $commentSamples[array_rand($commentSamples)] . '</p>',
                            'parent_id' => $parentCommentId,
                            'created_at' => $now->copy()->subDays(rand(1, 5))->addMinutes(rand(50, 500)),
                            'updated_at' => $now,
                        ]);

                        // Cấp 3 (lồng sâu hơn)
                        if (rand(0, 1)) {
                            DB::table('comments')->insert([
                                'post_id' => $postId,
                                'user_id' => $users->random(),
                                'content' => '<p>↳↳ ' . $commentSamples[array_rand($commentSamples)] . '</p>',
                                'parent_id' => $childId,
                                'created_at' => $now->copy()->subDays(rand(1, 5))->addMinutes(rand(50, 500)),
                                'updated_at' => $now,
                            ]);
                        }
                    }
                }
            }
        }
    }
}
