# Hướng dẫn sử dụng chức năng Thêm Sản phẩm

## 🎯 Tính năng đã hoàn thành:

### ✅ Backend:
- API `/api/products` (POST) - Tạo sản phẩm mới
- API `/api/categories` (GET) - Lấy danh sách danh mục
- API `/api/brands` (GET) - Lấy danh sách thương hiệu
- Validation đầy đủ cho dữ liệu sản phẩm
- Tự động tạo slug từ tên sản phẩm
- Lưu vào MySQL database

### ✅ Frontend:
- Trang thêm sản phẩm: `/admin/products/add`
- Form nhập liệu với đầy đủ trường:
  - Tên sản phẩm (*)
  - Mô tả sản phẩm
  - Giá bán (*)
  - Giảm giá (%)
  - Danh mục (*) - Dropdown lấy từ API
  - Thương hiệu (*) - Dropdown lấy từ API
  - Số lượng tồn kho (*)
  - URL Hình ảnh
  - Tags (hot, new, sale, premium, bestseller)
  - Checkbox: Sản phẩm SALE
  - Checkbox: Sản phẩm mới
  - Preview sản phẩm
- Nút "Thêm sản phẩm" trên trang danh sách
- Validation form
- Hiển thị lỗi từ backend
- Chuyển về trang danh sách sau khi thêm thành công

## 🚀 Cách sử dụng:

### 1. Đảm bảo Backend đang chạy:
```bash
cd backend
php artisan serve
```

### 2. Đảm bảo Frontend đang chạy:
```bash
cd frontend
npm run dev
```

### 3. Truy cập trang quản lý sản phẩm:
```
http://localhost:5173/admin/products
```

### 4. Click nút "Thêm sản phẩm"

### 5. Điền thông tin sản phẩm:

**Các trường bắt buộc (*):**
- Tên sản phẩm
- Giá bán
- Danh mục
- Thương hiệu
- Số lượng tồn kho

**Các trường tùy chọn:**
- Mô tả sản phẩm
- Giảm giá (%)
- URL Hình ảnh
- Tags
- Đánh dấu SALE
- Đánh dấu sản phẩm mới

### 6. Click "Thêm sản phẩm" để lưu

Sau khi lưu thành công, bạn sẽ được chuyển về trang danh sách sản phẩm và thấy sản phẩm mới được thêm vào.

## 📋 Ví dụ thêm sản phẩm:

**Tên sản phẩm:** iPhone 16 Pro Max  
**Mô tả:** iPhone 16 Pro Max với chip A18 Pro, camera 48MP, màn hình Super Retina XDR 6.9 inch  
**Giá bán:** 35990000  
**Giảm giá:** 5  
**Danh mục:** Điện thoại  
**Thương hiệu:** Apple  
**Số lượng tồn kho:** 50  
**URL Hình ảnh:** https://example.com/iphone-16-pro-max.jpg  
**Tags:** hot, new  
**Sản phẩm SALE:** ☑  
**Sản phẩm mới:** ☑  

## 🔍 Kiểm tra dữ liệu trong MySQL:

### Cách 1: Qua phpMyAdmin
1. Truy cập: http://localhost/phpmyadmin
2. Chọn database của bạn
3. Mở bảng `products`
4. Xem dữ liệu vừa thêm

### Cách 2: Qua MySQL Command Line
```sql
USE your_database_name;
SELECT * FROM products ORDER BY product_id DESC LIMIT 5;
```

### Cách 3: Qua API
```bash
curl http://127.0.0.1:8000/api/products
```

## 🎨 Giao diện:

Giao diện được thiết kế theo hình bạn cung cấp với:
- Layout 2 cột
- Cột trái: Các trường nhập liệu chính
- Cột phải: Mô tả, Tags, Checkboxes, Preview
- Nút "Hủy" và "Thêm sản phẩm" ở cuối form
- Màu sắc: Blue (#3B82F6) cho nút chính
- Responsive design

## ⚠️ Lưu ý:

1. **Danh mục và Thương hiệu** phải tồn tại trong database trước khi thêm sản phẩm
2. **Giá bán** phải là số dương
3. **Giảm giá** phải từ 0-100%
4. **Số lượng tồn kho** phải là số nguyên không âm
5. **URL Hình ảnh** là tùy chọn, nếu không có sẽ hiển thị placeholder
6. **Tags** có thể chọn nhiều hoặc không chọn
7. **Slug** sẽ được tự động tạo từ tên sản phẩm

## 🐛 Xử lý lỗi:

### Lỗi: "Không thể kết nối tới máy chủ"
- Kiểm tra Laravel server đang chạy
- Kiểm tra URL API trong file `.env` của frontend

### Lỗi: "Danh mục không tồn tại"
- Đảm bảo đã có dữ liệu categories trong database
- Chạy seeder: `php artisan db:seed --class=CategorySeeder`

### Lỗi: "Thương hiệu không tồn tại"
- Đảm bảo đã có dữ liệu brands trong database
- Chạy seeder: `php artisan db:seed --class=BrandSeeder`

### Lỗi validation khác
- Đọc thông báo lỗi hiển thị trên form
- Kiểm tra các trường bắt buộc đã điền đầy đủ chưa

## 📝 Cấu trúc dữ liệu gửi lên API:

```json
{
  "name": "iPhone 16 Pro Max",
  "description": "iPhone 16 Pro Max với chip A18 Pro...",
  "price": 35990000,
  "discount": 5,
  "category_id": 2,
  "brand_id": 1,
  "stock": 50,
  "image": "https://example.com/image.jpg",
  "is_flash_sale": true,
  "is_new": true,
  "tags": "hot,new",
  "status": "active"
}
```

## 🎯 Các bước tiếp theo (nếu cần):

1. ✅ Thêm chức năng upload hình ảnh (thay vì nhập URL)
2. ✅ Thêm chức năng sửa sản phẩm
3. ✅ Thêm chức năng xóa sản phẩm
4. ✅ Thêm chức năng xem chi tiết sản phẩm
5. ✅ Thêm phân trang cho danh sách sản phẩm

Bạn muốn tôi làm thêm chức năng nào không? 😊

