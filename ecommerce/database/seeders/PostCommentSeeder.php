<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PostCommentSeeder extends Seeder
{
    public function run(): void
    {
       $posts = DB::table('posts')->pluck('id'); // lấy danh sách post_id
       $users = DB::table('users')->pluck('id'); // lấy danh sách user_id (nếu có)

        $allComments = [];

        foreach ($posts as $postId) {
            $commentCount = rand(2, 4); // mỗi bài 2-4 bình luận
            for ($i = 0; $i < $commentCount; $i++) {
                $userId = $users->random();

                $comments = [
                    '<p>Hay quá! Cảm ơn bạn đã chia sẻ ❤️</p>',
                    '<p><strong>Bài viết rất hữu ích</strong>, mình đã áp dụng thành công.</p>',
                    '<p>Thực sự chi tiết, mong có thêm phần 2 nha 😍</p>',
                    '<p>Mình thấy phần này cần thêm ví dụ thực tế hơn!</p>',
                    '<p>👍 Bài viết chất lượng, viết thêm về chủ đề AI đi bạn!</p>',
                    '<p>Wow, đọc xong hiểu rõ luôn. Cảm ơn tác giả 💪</p>',
                    '<p>Không đồng ý lắm, nhưng cũng rất đáng đọc!</p>',
                    '<p>Mình thử rồi, đúng như bạn nói luôn <br>Rất hiệu quả!</p>',
                ];

                $allComments[] = [
                    'post_id' => $postId,
                    'user_id' => $userId,
                    'content' => $comments[array_rand($comments)],
                    'created_at' => now()->subDays(rand(1, 10))->addMinutes(rand(5, 500)),
                    'updated_at' => now(),
                ];
            }
        }

        DB::table('comments')->insert($allComments);
    }
}
