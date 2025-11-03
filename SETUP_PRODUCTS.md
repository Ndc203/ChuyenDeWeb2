# Hướng dẫn Setup Backend cho Products

## 🚀 Các bước thực hiện:

### 1. Chạy Migration để tạo bảng products
```bash
cd backend
php artisan migrate:fresh
```

Hoặc nếu chỉ muốn chạy migration products:
```bash
php artisan migrate --path=/database/migrations/2025_10_04_000006_create_products_table.php
```

### 2. Tạo dữ liệu mẫu (Seeder)

Trước tiên, cần có dữ liệu Categories và Brands. Nếu chưa có, tạo một số mẫu:

```bash
# Vào tinker để tạo categories và brands mẫu
php artisan tinker
```

Trong tinker, chạy:
```php
// Tạo Categories
DB::table('categories')->insert([
    ['name' => 'Điện thoại', 'slug' => 'dien-thoai', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
    ['name' => 'Laptop', 'slug' => 'laptop', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
    ['name' => 'Tablet', 'slug' => 'tablet', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
    ['name' => 'Phụ kiện', 'slug' => 'phu-kien', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
]);

// Tạo Brands
DB::table('brands')->insert([
    ['name' => 'Apple', 'slug' => 'apple', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
    ['name' => 'Samsung', 'slug' => 'samsung', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
    ['name' => 'Dell', 'slug' => 'dell', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
    ['name' => 'Sony', 'slug' => 'sony', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
]);

exit
```

### 3. Chạy ProductSeeder
```bash
php artisan db:seed --class=ProductSeeder
```

### 4. Khởi động Laravel server
```bash
php artisan serve
```

Server sẽ chạy tại: `http://127.0.0.1:8000`

### 5. Test API

Kiểm tra API products:
```bash
# Lấy danh sách sản phẩm
curl http://127.0.0.1:8000/api/products

# Lấy chi tiết sản phẩm
curl http://127.0.0.1:8000/api/products/1
```

## 📋 Các API Endpoints đã tạo:

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/products` | Lấy danh sách sản phẩm |
| GET | `/api/products/{id}` | Lấy chi tiết sản phẩm |
| POST | `/api/products` | Tạo sản phẩm mới |
| PUT | `/api/products/{id}` | Cập nhật sản phẩm |
| DELETE | `/api/products/{id}` | Xóa sản phẩm (soft delete) |
| GET | `/api/products/trashed` | Lấy danh sách sản phẩm đã xóa |
| PATCH | `/api/products/{id}/restore` | Khôi phục sản phẩm đã xóa |
| PATCH | `/api/products/{id}/toggle` | Chuyển đổi trạng thái active/inactive |
| GET | `/api/products/slugify?text=...` | Tạo slug từ tên |

## 🎨 Chạy Frontend

```bash
cd frontend
npm run dev
```

Truy cập: `http://localhost:5173/admin/products`

## ✅ Checklist

- [x] Model Product đã tạo
- [x] Model ProductReview đã tạo
- [x] Migration products đã cập nhật (thêm slug, discount, status, soft deletes)
- [x] ProductController đã tạo với đầy đủ CRUD
- [x] Routes API đã thêm
- [x] ProductSeeder đã tạo với 8 sản phẩm mẫu
- [x] Frontend đã cập nhật để lấy dữ liệu từ API

## 🔧 Troubleshooting

### Lỗi: Foreign key constraint fails
Đảm bảo đã có dữ liệu trong bảng `categories` và `brands` trước khi chạy seeder.

### Lỗi: CORS
Kiểm tra file `backend/config/cors.php` đã cho phép origin từ frontend:
```php
'allowed_origins' => ['http://localhost:5173'],
```

### Lỗi: 404 Not Found
Đảm bảo Laravel server đang chạy tại `http://127.0.0.1:8000`

## 📝 Dữ liệu mẫu

Seeder sẽ tạo 8 sản phẩm:
1. iPhone 15 Pro Max (HOT, MỚI)
2. Samsung Galaxy S24 Ultra (SALE)
3. MacBook Pro M3 (HOT)
4. Dell XPS 13 (SALE)
5. iPad Pro 12.9 (MỚI)
6. AirPods Pro 2 (HOT, SALE)
7. Sony WH-1000XM5 (HOT, MỚI)
8. Apple Watch Series 9 (MỚI)

Mỗi sản phẩm sẽ có 3-5 review với rating 4-5 sao.

