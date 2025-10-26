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
                'excerpt' => 'Khám phá các xu hướng công nghệ nổi bật trong năm 2025 như AI, IoT và thực tế ảo.',
                'content' => '
                    <p><strong>Công nghệ đang thay đổi thế giới</strong> với tốc độ chóng mặt. Năm 2025 hứa hẹn sẽ là bước ngoặt lớn trong nhiều lĩnh vực.</p>
                    <ul>
                        <li><b>AI toàn diện:</b> Tích hợp AI vào mọi lĩnh vực, từ giáo dục đến y tế.</li>
                        <li><b>IoT thế hệ mới:</b> Thiết bị kết nối thông minh hơn và an toàn hơn.</li>
                        <li><b>Thực tế ảo:</b> Ứng dụng rộng rãi trong đào tạo và du lịch.</li>
                    </ul>
                    <p>Đây là thời điểm vàng để các doanh nghiệp đầu tư vào <em>chuyển đổi số</em> và tối ưu trải nghiệm người dùng.</p>
                    
                ',
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
                'content' => '
                    <p>Apple vừa ra mắt <strong>MacBook Air M3</strong> – chiếc laptop mỏng nhẹ nhưng cực kỳ mạnh mẽ.</p>
                    <p><b>Ưu điểm:</b></p>
                    <ul>
                        <li>Hiệu năng tăng 20% so với M2</li>
                        <li>Pin kéo dài đến 18 tiếng</li>
                        <li>Màn hình Retina cực sắc nét</li>
                    </ul>
                    <p><b>Nhược điểm:</b> Giá vẫn khá cao, chưa phù hợp với sinh viên.</p>
                    <p>Tổng thể: <em>MacBook Air M3 là lựa chọn hoàn hảo cho dân văn phòng.</em></p>
                    
                ',
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
                'content' => '
                    <p>Nếu máy tính của bạn chạy chậm, hãy thử các cách dưới đây:</p>
                    <ol>
                        <li>Tắt ứng dụng khởi động cùng Windows.</li>
                        <li>Xóa file tạm bằng Disk Cleanup.</li>
                        <li>Gỡ phần mềm không cần thiết.</li>
                        <li>Cập nhật driver mới nhất.</li>
                    </ol>
                    <p>Chỉ với vài thao tác đơn giản, <strong>hiệu suất máy tăng 30%</strong>.</p>
                    
                ',
                'image' => 'tang-toc-may-tinh.png',
                'status' => 'published',
                'is_trending' => 0,
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1),
            ],
            [
                'user_id' => 1,
                'category_id' => 2,
                'title' => 'So sánh Dell XPS 13 và MacBook Air M3 – Đâu là laptop tốt hơn?',
                'excerpt' => 'Đánh giá chi tiết hai mẫu laptop cao cấp Dell XPS 13 và MacBook Air M3.',
                'content' => '
                    <p>Hai mẫu laptop <strong>Dell XPS 13</strong> và <strong>MacBook Air M3</strong> đều là biểu tượng của sự cao cấp.</p>
                    <table border="1" cellpadding="5">
                        <tr><th>Tiêu chí</th><th>Dell XPS 13</th><th>MacBook Air M3</th></tr>
                        <tr><td>Hiệu năng</td><td>Intel Core Ultra 7</td><td>Apple M3</td></tr>
                        <tr><td>Màn hình</td><td>OLED 3K</td><td>Retina</td></tr>
                        <tr><td>Giá</td><td>36 triệu</td><td>33 triệu</td></tr>
                    </table>
                    <p>Kết luận: Nếu bạn cần sự ổn định và tối ưu pin – chọn MacBook; còn nếu thích tùy chỉnh – chọn Dell.</p>
                ',
                'image' => 'dell-vs-mac.jpg',
                'status' => 'published',
                'is_trending' => 1,
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5),
            ],
            [
                'user_id' => 2,
                'category_id' => 1,
                'title' => 'AI và bảo mật – Cuộc chiến mới trên không gian mạng',
                'excerpt' => 'AI vừa là công cụ mạnh mẽ, vừa là mối đe dọa trong lĩnh vực an ninh mạng.',
                'content' => '
                    <p><strong>Trí tuệ nhân tạo (AI)</strong> không chỉ giúp ích mà còn tạo ra nhiều mối đe dọa mới.</p>
                    <ul>
                        <li>Tự động tấn công hệ thống.</li>
                        <li>Giả mạo email, giọng nói hoặc hình ảnh.</li>
                    </ul>
                    <p>Các doanh nghiệp cần triển khai hệ thống <em>AI phòng thủ</em> để chống lại chính AI tấn công.</p>
                ',
                'image' => 'tan-cong-ai-1.png',
                'status' => 'published',
                'is_trending' => 0,
                'created_at' => now()->subDays(7),
                'updated_at' => now()->subDays(7),
            ],
            [
                'user_id' => 3,
                'category_id' => 3,
                'title' => '5 phần mềm miễn phí thay thế Photoshop',
                'excerpt' => 'Danh sách các phần mềm chỉnh sửa ảnh miễn phí có thể thay thế Photoshop.',
                'content' => '
                    <p>Không cần Photoshop, bạn vẫn có thể chỉnh sửa ảnh chuyên nghiệp với các công cụ sau:</p>
                    <ul>
                        <li><strong>GIMP:</strong> Nhiều tính năng tương tự Photoshop.</li>
                        <li><strong>Photopea:</strong> Chạy trực tiếp trên trình duyệt.</li>
                        <li><strong>Krita:</strong> Tuyệt vời cho họa sĩ kỹ thuật số.</li>
                        <li><strong>Pixlr:</strong> Dễ dùng, có sẵn bộ lọc đẹp.</li>
                    </ul>
                    <p>Hầu hết đều hỗ trợ <b>layer, brush, và định dạng PSD</b>.</p>
                ',
                'image' => 'ung-dung-thay-the-photoshop.jpg',
                'status' => 'published',
                'is_trending' => 0,
                'created_at' => now()->subDays(8),
                'updated_at' => now()->subDays(8),
            ],
            [
                'user_id' => 1,
                'category_id' => 1,
                'title' => 'Blockchain 2025 – Không chỉ là tiền mã hóa',
                'excerpt' => 'Ứng dụng mới của blockchain vượt xa lĩnh vực tiền mã hóa truyền thống.',
                'content' => '
                    <p><strong>Blockchain</strong> đang mở rộng ứng dụng sang nhiều lĩnh vực mới như:</p>
                    <ul>
                        <li>Chuỗi cung ứng minh bạch.</li>
                        <li>Quản lý bản quyền nội dung.</li>
                        <li>Giấy tờ công chứng điện tử.</li>
                    </ul>
                    <p>Đây sẽ là công nghệ nền tảng cho <em>Web 3.0</em>.</p>
                ',
                'image' => 'blockchain.jpg',
                'status' => 'published',
                'is_trending' => 1,
                'created_at' => now()->subDays(10),
                'updated_at' => now()->subDays(10),
            ],
            [
                'user_id' => 2,
                'category_id' => 2,
                'title' => 'Hướng dẫn chọn laptop học lập trình năm 2025',
                'excerpt' => 'Gợi ý cấu hình laptop phù hợp cho sinh viên và lập trình viên web.',
                'content' => '
                    <p>Khi chọn laptop lập trình, bạn nên chú ý:</p>
                    <ol>
                        <li>CPU tối thiểu Core i5 hoặc Ryzen 5.</li>
                        <li>RAM 16GB là lý tưởng cho lập trình web hoặc mobile.</li>
                        <li>SSD từ 512GB trở lên.</li>
                    </ol>
                    <p>Một vài mẫu khuyên dùng: <b>ThinkPad X1, MacBook Air, HP Envy</b>.</p>
                ',
                'image' => 'lap.jpg',
                'status' => 'published',
                'is_trending' => 0,
                'created_at' => now()->subDays(4),
                'updated_at' => now()->subDays(4),
            ],
            [
                'user_id' => 3,
                'category_id' => 3,
                'title' => '10 extension VS Code nên cài cho lập trình viên web',
                'excerpt' => 'Danh sách các extension giúp tối ưu hiệu suất lập trình web trên VS Code.',
                'content' => '
                    <p>Dưới đây là danh sách extension giúp tăng hiệu suất lập trình:</p>
                    <ul>
                        <li><strong>Prettier</strong> – Format code tự động.</li>
                        <li><strong>Live Server</strong> – Xem thay đổi ngay lập tức.</li>
                        <li><strong>GitLens</strong> – Theo dõi lịch sử Git.</li>
                        <li><strong>Path Intellisense</strong> – Gợi ý đường dẫn file.</li>
                    </ul>
                    <p>Mỗi lập trình viên web nên cài ít nhất 5 trong số này.</p>
                ',
                'image' => 'best-visual-studio-code-extensions.jpg',
                'status' => 'published',
                'is_trending' => 0,
                'created_at' => now()->subDays(6),
                'updated_at' => now()->subDays(6),
            ],
            [
                'user_id' => 1,
                'category_id' => 1,
                'title' => 'Tương lai của lập trình viên trong kỷ nguyên AI',
                'excerpt' => 'AI sẽ không thay thế lập trình viên, nhưng sẽ thay đổi cách họ làm việc.',
                'content' => '
                    <p><strong>AI không thay thế lập trình viên</strong>, nhưng sẽ thay đổi cách họ làm việc.</p>
                    <p>Các công cụ như <b>GitHub Copilot</b> hay <b>ChatGPT</b> giúp viết code nhanh hơn, nhưng vẫn cần con người để:</p>
                    <ul>
                        <li>Kiểm tra logic nghiệp vụ.</li>
                        <li>Đảm bảo tính bảo mật.</li>
                        <li>Tối ưu hiệu năng hệ thống.</li>
                    </ul>
                    <p>Học cách làm việc cùng AI chính là kỹ năng quan trọng nhất trong thập kỷ này.</p>
                ',
                'image' => 'tuong-lai-lap-trinh-vien.png',
                'status' => 'published',
                'is_trending' => 1,
                'created_at' => now()->subDays(9),
                'updated_at' => now()->subDays(9),
            ],
        ]);
    }
}
