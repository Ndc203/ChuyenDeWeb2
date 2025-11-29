# Tài liệu Hệ thống Đánh giá Sản phẩm

## Tổng quan
Hệ thống đánh giá sản phẩm cho phép khách hàng đánh giá và bình luận về sản phẩm sau khi đăng nhập. Admin có thể quản lý, duyệt hoặc từ chối các đánh giá.

## Các thay đổi đã thực hiện

### 1. Backend - ProductReviewController
**File:** `backend/app/Http/Controllers/ProductReviewController.php`

#### Thêm method `store()` để tạo đánh giá mới:
```php
public function store(Request $request)
{
    // Validate dữ liệu đầu vào
    // Kiểm tra user đã đăng nhập
    // Kiểm tra user đã đánh giá sản phẩm chưa (1 user chỉ đánh giá 1 lần/sản phẩm)
    // Tạo review với status = 'pending' (chờ admin duyệt)
    // Trả về review với message
}
```

#### Cập nhật method `index()`:
- Thêm filter theo `product_id` (cho trang shop)
- Chỉ hiển thị đánh giá **approved** cho user thường
- Admin xem được tất cả đánh giá (với param `admin=true`)

**Các tính năng:**
- ✅ Tạo đánh giá mới (user phải đăng nhập)
- ✅ Lọc theo trạng thái (pending/approved/rejected)
- ✅ Lọc theo rating (1-5 sao)
- ✅ Tìm kiếm theo sản phẩm, người dùng, nội dung
- ✅ Cập nhật trạng thái đánh giá
- ✅ Xóa đánh giá
- ✅ Thống kê đánh giá

### 2. Frontend - ProductReviews Component
**File:** `frontend/src/pages/shop/ProductReviews.jsx`

**Chức năng:**
- Hiển thị danh sách đánh giá đã được duyệt của sản phẩm
- Form viết đánh giá (yêu cầu đăng nhập)
- Chọn số sao (1-5)
- Nhập nội dung đánh giá (tối thiểu 10 ký tự)
- Hiển thị thông báo khi gửi thành công

**Key changes:**
- Sử dụng `product_review_id` thay vì `review_id`
- Xử lý response từ backend (message + review object)
- Hiển thị thông báo "Đánh giá đang chờ duyệt"

### 3. Frontend - AdminReviewsPage
**File:** `frontend/src/pages/admin/AdminReviewsPage.jsx`

**Chức năng:**
- Hiển thị tất cả đánh giá (bao gồm pending, approved, rejected)
- Lọc theo trạng thái và rating
- Tìm kiếm đánh giá
- Duyệt/Từ chối đánh giá
- Xóa đánh giá
- Phân trang

**Key changes:**
- Thêm param `admin: true` khi gọi API
- Hiển thị đầy đủ thông tin sản phẩm và người dùng
- Sử dụng `product_review_id` cho tất cả operations

### 4. Database Seeder
**File:** `backend/database/seeders/ProductReviewSeeder.php`

**Cải tiến:**
- Tự động lấy `product_id` và `user_id` thực sự tồn tại trong database
- Kiểm tra trước khi insert để tránh duplicate reviews
- Tạo 3-5 reviews cho mỗi sản phẩm
- Random rating, status, và comments
- 75% reviews có status "approved"

**Chạy seeder:**
```bash
cd backend
php artisan db:seed --class=ProductReviewSeeder
```

## Luồng hoạt động

### User đánh giá sản phẩm:
1. User đăng nhập và vào trang chi tiết sản phẩm
2. User chọn số sao (1-5) và nhập nội dung đánh giá
3. Click "Gửi đánh giá"
4. Backend kiểm tra:
   - User đã đăng nhập chưa?
   - User đã đánh giá sản phẩm này chưa?
5. Tạo review với `status = 'pending'`
6. Hiển thị thông báo: "Đánh giá đang chờ duyệt"

### Admin quản lý đánh giá:
1. Admin vào trang `/admin/reviews`
2. Xem tất cả đánh giá (pending, approved, rejected)
3. Có thể:
   - Duyệt (approved): Review hiển thị công khai
   - Từ chối (rejected): Review bị ẩn
   - Xóa: Xóa vĩnh viễn khỏi database

### Hiển thị đánh giá trên shop:
1. Chỉ hiển thị reviews có `status = 'approved'`
2. Hiển thị theo product_id
3. Sắp xếp theo thời gian (mới nhất trước)

## API Endpoints

### Public (User)
- `GET /api/reviews?product_id={id}` - Lấy reviews của sản phẩm (chỉ approved)
- `POST /api/reviews` - Tạo review mới (yêu cầu auth)

### Admin
- `GET /api/reviews?admin=true` - Lấy tất cả reviews
- `PATCH /api/reviews/{id}/status` - Cập nhật trạng thái
- `DELETE /api/reviews/{id}` - Xóa review

## Database Schema

```sql
CREATE TABLE productreviews (
    product_review_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT,
    user_id BIGINT,
    rating TINYINT (1-5),
    comment TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

## Validation Rules

### Tạo review:
- `product_id`: required, exists in products table
- `rating`: required, integer, min:1, max:5
- `comment`: required, string, min:10, max:1000

### Cập nhật status:
- `status`: required, in:['pending', 'approved', 'rejected']

## Bảo mật

1. **Authentication**: User phải đăng nhập (Sanctum token)
2. **Duplicate prevention**: 1 user chỉ đánh giá 1 lần/sản phẩm
3. **Admin verification**: Chỉ admin mới xem được tất cả reviews
4. **XSS Protection**: Comment được sanitized

## Testing

### Test user tạo review:
1. Đăng nhập với user account
2. Vào trang sản phẩm bất kỳ
3. Viết đánh giá và submit
4. Kiểm tra thông báo "Đánh giá đang chờ duyệt"

### Test admin duyệt review:
1. Đăng nhập với admin account
2. Vào `/admin/reviews`
3. Thấy review vừa tạo với status "Chờ duyệt"
4. Click nút "Duyệt"
5. Quay lại trang shop kiểm tra review đã hiển thị

### Test duplicate prevention:
1. User đã đánh giá sản phẩm
2. Thử đánh giá lại sản phẩm đó
3. Nhận thông báo lỗi: "Bạn đã đánh giá sản phẩm này rồi"

## Troubleshooting

### Lỗi: "Sản phẩm đã xóa" trong Admin
**Nguyên nhân:** Dữ liệu seeder dùng product_id không tồn tại
**Giải pháp:** Chạy lại seeder với ProductReviewSeeder đã cập nhật

### Lỗi: Review không hiển thị trên shop
**Nguyên nhân:** Review có status = 'pending' hoặc 'rejected'
**Giải pháp:** Admin cần duyệt review (set status = 'approved')

### Lỗi: Không gửi được review
**Nguyên nhân:** User chưa đăng nhập hoặc đã review sản phẩm rồi
**Giải pháp:** Kiểm tra authentication token và database

## Kết luận

Hệ thống đánh giá sản phẩm đã hoàn thiện với đầy đủ chức năng:
- ✅ User có thể đánh giá sản phẩm sau khi đăng nhập
- ✅ Review được gửi về admin để duyệt
- ✅ Admin có thể quản lý tất cả reviews
- ✅ Chỉ hiển thị reviews đã duyệt trên shop
- ✅ Ngăn chặn duplicate reviews
