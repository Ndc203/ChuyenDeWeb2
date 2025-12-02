# Tài liệu Hướng dẫn: Hash & Mã hóa ID Sản phẩm

## 📋 Mô tả
Hệ thống đã được tích hợp chức năng mã hóa ID sản phẩm bằng **Hashids**. Thay vì hiển thị ID thật (1, 2, 3...), hệ thống sẽ hiển thị ID đã được mã hóa (ví dụ: `gY3kM8D1wZ`).

### ✨ Lợi ích:
- **Bảo mật cao hơn**: Khó đoán ID của sản phẩm khác
- **Chống brute-force**: Ngăn chặn kẻ xấu dò ID để truy cập/sửa sản phẩm
- **Professional**: Giao diện chuyên nghiệp hơn với ID không dự đoán được

---

## 🔧 Cài đặt

### 1. Package đã cài đặt
```bash
composer require vinkla/hashids
```

### 2. Các file đã tạo/sửa

#### a) Trait HashesId (`backend/app/Traits/HashesId.php`)
- Encode ID thành hash string
- Decode hash string về ID
- Tìm model bằng hashed ID

####b) Product Model (`backend/app/Models/Product.php`)
- Sử dụng trait `HashesId`
- Tự động thêm `hashed_id` vào JSON response

#### c) ProductController (`backend/app/Http/Controllers/ProductController.php`)
- Hỗ trợ cả ID thật và Hashed ID trong các API
- Method `findProduct()` tự động xử lý cả 2 loại ID

---

## 📖 Cách sử dụng

### 1. Lấy danh sách sản phẩm
```bash
GET /api/products
```

**Response:**
```json
[
  {
    "id": 1,
    "hashed_id": "gY3kM8D1wZ",
    "name": "iPhone 15 Pro Max",
    "price": 29990000,
    ...
  }
]
```

### 2. Xem chi tiết sản phẩm

**Cách 1: Dùng ID thật** (vẫn hoạt động)
```bash
GET /api/products/1
```

**Cách 2: Dùng Hashed ID** (khuyên dùng)
```bash
GET /api/products/gY3kM8D1wZ
```

### 3. Cập nhật sản phẩm

**Với Hashed ID:**
```bash
PUT /api/products/gY3kM8D1wZ
Content-Type: application/json

{
  "name": "iPhone 15 Pro Max Updated",
  "price": 28990000
}
```

### 4. Xóa sản phẩm

```bash
DELETE /api/products/gY3kM8D1wZ
```

---

## 💻 Sử dụng trong Code

### Trong PHP (Laravel)

#### Lấy Hashed ID của sản phẩm:
```php
$product = Product::find(1);
$hashedId = $product->hashed_id;  // "gY3kM8D1wZ"
```

#### Tìm sản phẩm bằng Hashed ID:
```php
$hashedId = "gY3kM8D1wZ";
$product = Product::findByHashedId($hashedId);
```

#### Decode Hashed ID về ID thật:
```php
$hashedId = "gY3kM8D1wZ";
$realId = Product::decodeHashedId($hashedId);  // 1
```

### Trong JavaScript/React

#### Sử dụng Hashed ID trong URL:
```javascript
// Thay vì dùng ID thật
navigate(`/admin/products/edit/${product.id}`);  // ❌ Không an toàn

// Dùng Hashed ID
navigate(`/admin/products/edit/${product.hashed_id}`);  // ✅ An toàn
```

#### API Call với Hashed ID:
```javascript
// Xem chi tiết
const response = await axios.get(`/api/products/${product.hashed_id}`);

// Cập nhật
await axios.put(`/api/products/${product.hashed_id}`, data);

// Xóa
await axios.delete(`/api/products/${product.hashed_id}`);
```

---

## 🔐 Cấu hình Bảo mật

### Thay đổi Salt (Khuyến nghị)
Mặc định, hệ thống sử dụng `APP_KEY` làm salt. Để tăng cường bảo mật, có thể cấu hình riêng:

**File: `backend/.env`**
```env
APP_KEY=base64:your-very-secret-key-here
HASHIDS_SALT=your-custom-salt-for-hashids  # (Tùy chọn)
```

**Cập nhật Trait nếu dùng custom salt:**
```php
// backend/app/Traits/HashesId.php
public function getHashedIdAttribute()
{
    $salt = env('HASHIDS_SALT', config('app.key'));
    $hashids = new Hashids($salt, 10);
    return $hashids->encode($this->getKey());
}
```

---

## ⚠️ Lưu ý quan trọng

### 1. Backward Compatibility
- Hệ thống vẫn hỗ trợ ID thật để đảm bảo tương thích ngược
- Chỉ nên dùng ID thật cho admin/internal tools
- **Public API nên dùng Hashed ID**

### 2. Frontend Migration
- Cập nhật tất cả frontend code để dùng `hashed_id` thay vì `id`
- Đặc biệt chú ý: Edit, Delete, View actions

### 3. Database
- Không lưu hashed_id vào database
- Hashed ID được tạo động mỗi lần query
- Không thể search bằng hashed_id trong database

### 4. SEO & URLs
- Nên dùng `slug` cho public URLs (SEO friendly)
- Dùng `hashed_id` cho API và internal actions
```javascript
// Public URL (SEO)
/products/iphone-15-pro-max

// API Call (Security)
/api/products/gY3kM8D1wZ
```

---

## 🧪 Testing

### Test với Postman/cURL

```bash
# Lấy danh sách (lấy hashed_id)
curl http://localhost:8000/api/products

# Test với Hashed ID
curl http://localhost:8000/api/products/gY3kM8D1wZ

# Test vẫn hoạt động với ID thật
curl http://localhost:8000/api/products/1
```

---

## 📝 Checklist Triển khai
- [x] Cài đặt package Hashids
- [x] Tạo Trait HashesId
- [x] Cập nhật Product Model
- [x] Cập nhật ProductController
- [x] Cập nhật Frontend để dùng hashed_id
  - [x] AdminProductsPage.jsx
  - [x] AdminProductEditPage.jsx
  - [x] AdminStockPage.jsx
- [x] Cập nhật StockController để hỗ trợ hashed_id
- [x] Test toàn bộ chức năng CRUD
- [ ] Deploy lên production

---

## 🔄 Mở rộng cho Models khác

Muốn áp dụng Hash ID cho model khác (User, Category, v.v.):

```php
// backend/app/Models/YourModel.php
use App\Traits\HashesId;

class YourModel extends Model
{
    use HashesId;
    
    protected $appends = ['hashed_id'];
}
```

---

## 📞 Hỗ trợ
Nếu có vấn đề, kiểm tra:
1. Package đã cài đúng chưa: `composer show vinkla/hashids`
2. APP_KEY đã được set trong `.env`
3. Cache đã clear: `php artisan config:clear`

---

## 📚 Tài liệu tham khảo
- [Hashids PHP](https://github.com/vinkla/hashids)
- [Laravel Best Practices](https://laravel.com/docs/master)
