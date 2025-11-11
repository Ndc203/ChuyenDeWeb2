<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PostCommentSeeder extends Seeder
{
    public function run(): void
    {
        // ✅ Lấy danh sách ID đúng cột
        $posts = DB::table('posts')->pluck('post_id');
        $users = DB::table('users')->pluck('user_id');

        $allComments = [];
        $now = Carbon::now();

        foreach ($posts as $postId) {
            $commentCount = rand(2, 4); // Mỗi bài 2-4 bình luận

            for ($i = 0; $i < $commentCount; $i++) {
                $userId = $users->random();

                $comments = [
                    '<p>Hay quá! Cảm ơn bạn đã chia sẻ.</p>',
                    '<p><strong>Bài viết rất hữu ích</strong>, mình đã áp dụng thành công.</p>',
                    '<p>Thực sự chi tiết, mong có thêm phần 2 nhé!</p>',
                    '<p>Mình thấy phần này cần thêm ví dụ thực tế hơn!</p>',
                    '<p>Bài viết chất lượng, viết thêm về chủ đề AI đi bạn!</p>',
                    '<p>Wow, đọc xong hiểu rõ luôn. Cảm ơn tác giả!</p>',
                    '<p>Không đồng ý lắm, nhưng cũng rất đáng đọc!</p>',
                    '<p>Mình thử rồi, đúng như bạn nói.<br>Rất hiệu quả!</p>',
                ];

                $allComments[] = [
                    'post_id' => $postId,
                    'user_id' => $userId,
                    'content' => $comments[array_rand($comments)],
                    'created_at' => $now->copy()->subDays(rand(1, 10))->addMinutes(rand(5, 500)),
                    'updated_at' => $now,
                ];
            }
        }

        // ✅ Chèn dữ liệu vào bảng comments
        DB::table('comments')->insert($allComments);
    }
}
