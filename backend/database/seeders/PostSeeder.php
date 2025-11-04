<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PostSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('posts')->insert([
            [
                'user_id' => 1,
                'category_id' => 1,
                'title' => 'Top 5 xu hướng công nghệ nổi bật năm 2025',
                'excerpt' => 'Khám phá những xu hướng công nghệ dẫn đầu năm 2025 như AI, IoT và thực tế ảo.',
                'content' => <<<'HTML'
                    <p><strong>Công nghệ đang thay đổi thế giới</strong> với tốc độ chóng mặt. Năm 2025 hứa hẹn sẽ là bước ngoặt lớn trong nhiều lĩnh vực.</p>
                    <ul>
                        <li><b>AI toàn diện:</b> Tích hợp AI vào mọi lĩnh vực, từ giáo dục đến y tế.</li>
                        <li><b>IoT thế hệ mới:</b> Thiết bị kết nối thông minh hơn và an toàn hơn.</li>
                        <li><b>Thực tế ảo:</b> Ứng dụng rộng rãi trong đào tạo và du lịch.</li>
                    </ul>
                    <p>Đây là thời điểm vàng để các doanh nghiệp đầu tư vào <em>chuyển đổi số</em> và tối ưu trải nghiệm người dùng.</p>
                HTML,
                'image' => 'top5xuhuongcn.jpg',
                'status' => 'published',
                'is_trending' => 1,
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(2),
            ],
            [
                'user_id' => 2,
                'category_id' => 2,
                'title' => 'Đánh giá chi tiết MacBook Air M3 – Siêu mỏng, siêu mạnh',
                'excerpt' => 'MacBook Air M3 mang đến hiệu năng vượt trội và thiết kế cực kỳ mỏng nhẹ.',
                'content' => <<<'HTML'
                    <p>Apple vừa ra mắt <strong>MacBook Air M3</strong> – chiếc laptop mỏng nhẹ nhưng cực kỳ mạnh mẽ.</p>
                    <p><b>Ưu điểm:</b></p>
                    <ul>
                        <li>Hiệu năng tăng 20% so với M2.</li>
                        <li>Pin kéo dài đến 18 tiếng.</li>
                        <li>Màn hình Retina cực sắc nét.</li>
                    </ul>
                    <p><b>Nhược điểm:</b> Giá vẫn khá cao, chưa phù hợp với sinh viên.</p>
                    <p>Tổng thể: <em>MacBook Air M3 là lựa chọn hoàn hảo cho dân văn phòng.</em></p>
                HTML,
                'image' => 'macbook.jpg',
                'status' => 'published',
                'is_trending' => 1,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ],
            [
                'user_id' => 3,
                'category_id' => 3,
                'title' => 'Cách tăng tốc máy tính Windows chỉ trong 5 phút',
                'excerpt' => 'Hướng dẫn đơn giản giúp tăng hiệu suất máy tính Windows nhanh chóng.',
                'content' => <<<'HTML'
                    <p>Nếu máy tính của bạn chạy chậm, hãy thử các cách dưới đây:</p>
                    <ol>
                        <li>Tắt chương trình khởi động cùng Windows.</li>
                        <li>Xóa file tạm bằng Disk Cleanup.</li>
                        <li>Gỡ phần mềm không cần thiết.</li>
                        <li>Cập nhật driver mới nhất.</li>
                    </ol>
                    <p>Chỉ với vài thao tác đơn giản, <strong>hiệu suất máy tăng 30%</strong>.</p>
                HTML,
                'image' => 'tang-toc-may-tinh.jpg',
                'status' => 'published',
                'is_trending' => 0,
                'created_at' => now()->subDay(),
                'updated_at' => now()->subDay(),
            ],
        ]);
    }
}
