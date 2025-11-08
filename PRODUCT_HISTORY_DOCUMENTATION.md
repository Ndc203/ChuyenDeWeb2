# 📋 Tài Liệu Chức Năng Lịch Sử Thay Đổi Sản Phẩm

## 📖 Tổng Quan

Chức năng **Lịch Sử Thay Đổi Sản Phẩm** được xây dựng để ghi lại toàn bộ các hành động chỉnh sửa, tạo mới, xóa và khôi phục sản phẩm trong hệ thống. Chức năng này giúp:

- ✅ Theo dõi ai đã thay đổi sản phẩm
- ✅ Xem thời gian thay đổi chính xác
- ✅ Biết được nội dung thay đổi (giá, tồn kho, mô tả, v.v.)
- ✅ Khôi phục dữ liệu về trạng thái cũ
- ✅ So sánh giữa các phiên bản
- ✅ Thống kê hoạt động của người dùng

---

## 🗄️ Cấu Trúc Database

### Bảng `product_history`

```sql
CREATE TABLE product_history (
    history_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    user_id BIGINT NULL,
    action VARCHAR(50) NOT NULL,  -- 'created', 'updated', 'deleted', 'restored'
    old_values JSON NULL,
    new_values JSON NULL,
    changed_fields JSON NULL,
    description TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);
```

### Các Trường Dữ Liệu

| Trường | Kiểu | Mô Tả |
|--------|------|-------|
| `history_id` | BIGINT | ID duy nhất của bản ghi lịch sử |
| `product_id` | BIGINT | ID của sản phẩm được thay đổi |
| `user_id` | BIGINT | ID của người thực hiện thay đổi |
| `action` | VARCHAR | Loại hành động: created, updated, deleted, restored |
| `old_values` | JSON | Giá trị cũ trước khi thay đổi |
| `new_values` | JSON | Giá trị mới sau khi thay đổi |
| `changed_fields` | JSON | Danh sách các trường đã thay đổi |
| `description` | TEXT | Mô tả chi tiết về thay đổi |
| `ip_address` | VARCHAR | Địa chỉ IP của người thực hiện |
| `user_agent` | VARCHAR | Thông tin trình duyệt/thiết bị |
| `created_at` | TIMESTAMP | Thời gian thực hiện thay đổi |

---

## 🔧 Backend Implementation

### 1. Model: `ProductHistory`

**File:** `backend/app/Models/ProductHistory.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductHistory extends Model
{
    protected $table = 'product_history';
    protected $primaryKey = 'history_id';
    public $timestamps = false;

    protected $fillable = [
        'product_id', 'user_id', 'action', 'old_values', 
        'new_values', 'changed_fields', 'description', 
        'ip_address', 'user_agent'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'changed_fields' => 'array',
        'created_at' => 'datetime',
    ];

    // Relationships
    public function product() { ... }
    public function user() { ... }

    // Static method để ghi log
    public static function logChange(Product $product, $action, $oldValues = [], $newValues = [], $user = null) { ... }
}
```

### 2. Controller: `ProductHistoryController`

**File:** `backend/app/Http/Controllers/ProductHistoryController.php`

#### Các Methods:

1. **`index($productId)`** - Lấy lịch sử của một sản phẩm
2. **`show($historyId)`** - Xem chi tiết một bản ghi lịch sử
3. **`restoreFromHistory($historyId)`** - Khôi phục sản phẩm về trạng thái cũ
4. **`compare($id1, $id2)`** - So sánh hai phiên bản
5. **`all(Request $request)`** - Lấy tất cả lịch sử (có lọc, phân trang)
6. **`statistics()`** - Thống kê lịch sử thay đổi

### 3. Cập Nhật ProductController

Các phương thức sau đã được cập nhật để tự động ghi lại lịch sử:

- ✅ `store()` - Ghi log khi tạo sản phẩm mới
- ✅ `update()` - Ghi log khi cập nhật sản phẩm
- ✅ `destroy()` - Ghi log khi xóa sản phẩm
- ✅ `restore()` - Ghi log khi khôi phục sản phẩm
- ✅ `toggleStatus()` - Ghi log khi thay đổi trạng thái

---

## 🌐 API Endpoints

### 1. Lịch Sử Của Một Sản Phẩm

```http
GET /api/products/{productId}/history
```

**Response:**
```json
{
  "product": {
    "id": 1,
    "name": "Sản phẩm A",
    "status": "active"
  },
  "history": [
    {
      "history_id": 10,
      "action": "updated",
      "user": {
        "id": 1,
        "username": "admin",
        "full_name": "Admin User",
        "email": "admin@example.com"
      },
      "old_values": { "price": 100000, "stock": 50 },
      "new_values": { "price": 120000, "stock": 45 },
      "changed_fields": ["price", "stock"],
      "description": "Giá: '100000' → '120000', Tồn kho: '50' → '45'",
      "ip_address": "127.0.0.1",
      "created_at": "2025-11-06 22:30:00",
      "created_at_human": "2 giờ trước"
    }
  ]
}
```

### 2. Xem Chi Tiết Bản Ghi Lịch Sử

```http
GET /api/product-history/{id}
```

### 3. Khôi Phục Từ Lịch Sử

```http
POST /api/product-history/{id}/restore
```

**Response:**
```json
{
  "message": "Đã khôi phục sản phẩm về trạng thái trước đó thành công.",
  "data": { ... }
}
```

### 4. So Sánh Hai Phiên Bản

```http
GET /api/product-history/compare/{id1}/{id2}
```

### 5. Lấy Tất Cả Lịch Sử (Admin)

```http
GET /api/product-history?action=updated&user_id=1&from_date=2025-11-01&to_date=2025-11-30&per_page=50
```

**Query Parameters:**
- `action` - Lọc theo hành động (created, updated, deleted, restored)
- `user_id` - Lọc theo người thực hiện
- `from_date` - Từ ngày
- `to_date` - Đến ngày
- `per_page` - Số bản ghi mỗi trang (mặc định: 50)

### 6. Thống Kê

```http
GET /api/product-history/statistics
```

**Response:**
```json
{
  "total_changes": 1234,
  "by_action": {
    "created": 300,
    "updated": 800,
    "deleted": 100,
    "restored": 34
  },
  "today": 45,
  "this_week": 234,
  "this_month": 891,
  "top_editors": [
    {
      "user": {
        "id": 1,
        "username": "admin",
        "full_name": "Admin User"
      },
      "changes_count": 456
    }
  ]
}
```

---

## 💻 Frontend Implementation

### 1. Trang Lịch Sử Sản Phẩm

**File:** `frontend/src/pages/admin/AdminProductHistoryPage.jsx`

**Route:** `/admin/products/:productId/history`

#### Tính Năng:

1. **Hiển thị danh sách lịch sử:**
   - Thời gian thay đổi
   - Hành động (created, updated, deleted, restored)
   - Người thực hiện
   - Mô tả chi tiết
   - Các trường đã thay đổi

2. **Xem chi tiết:**
   - Modal hiển thị đầy đủ thông tin
   - Giá trị cũ và mới
   - IP address
   - User agent

3. **Khôi phục dữ liệu:**
   - Nút "Khôi phục" cho các bản ghi type "updated"
   - Confirm trước khi khôi phục
   - Tự động reload sau khi thành công

### 2. Thêm Nút Lịch Sử Vào AdminProductsPage

Đã thêm nút **Lịch Sử** (History icon) vào table actions:

```jsx
<button
  title="Lịch sử thay đổi"
  onClick={() => navigate(`/admin/products/${product.id}/history`)}
  className="inline-flex items-center justify-center rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-purple-600 hover:bg-purple-100"
>
  <History size={16} />
</button>
```

---

## 🎯 Cách Sử Dụng

### 1. Xem Lịch Sử Sản Phẩm

1. Vào trang **Quản lý Sản phẩm** (`/admin/products`)
2. Click vào icon **History** (màu tím) ở cột Thao tác
3. Trang lịch sử sẽ hiển thị tất cả các thay đổi của sản phẩm đó

### 2. Xem Chi Tiết Thay Đổi

1. Ở trang lịch sử, click nút **"Chi tiết"** trên hàng bất kỳ
2. Modal sẽ hiển thị:
   - Hành động
   - Thời gian
   - Người thực hiện
   - IP address
   - Các trường đã thay đổi với giá trị cũ → mới
   - JSON đầy đủ của old_values và new_values

### 3. Khôi Phục Dữ Liệu

1. Tìm bản ghi lịch sử muốn khôi phục (chỉ áp dụng cho action "updated")
2. Click nút **"Khôi phục"**
3. Xác nhận trong dialog
4. Hệ thống sẽ:
   - Khôi phục sản phẩm về giá trị cũ
   - Tạo một bản ghi lịch sử mới ghi nhận việc khôi phục
   - Reload trang để hiển thị lịch sử mới nhất

### 4. Xem Thống Kê (API)

```bash
curl http://127.0.0.1:8000/api/product-history/statistics
```

---

## 🔍 Ví Dụ Thực Tế

### Kịch Bản 1: Cập Nhật Giá Sản Phẩm

1. **Trước khi thay đổi:**
   - Giá: 100,000 VNĐ
   - Tồn kho: 50

2. **Sau khi thay đổi:**
   - Giá: 120,000 VNĐ
   - Tồn kho: 45

3. **Bản ghi lịch sử tạo ra:**
```json
{
  "action": "updated",
  "old_values": {
    "price": 100000,
    "stock": 50
  },
  "new_values": {
    "price": 120000,
    "stock": 45
  },
  "changed_fields": ["price", "stock"],
  "description": "Giá: '100000' → '120000', Tồn kho: '50' → '45'",
  "user_id": 1,
  "ip_address": "192.168.1.100"
}
```

### Kịch Bản 2: Khôi Phục Giá Cũ

1. Admin nhận thấy giá mới nhập nhầm
2. Vào lịch sử sản phẩm
3. Tìm bản ghi thay đổi giá trước đó
4. Click "Khôi phục"
5. Sản phẩm sẽ trở về giá 100,000 VNĐ và tồn kho 50

---

## 🛡️ Bảo Mật & Quyền Hạn

### Ai Có Thể Xem Lịch Sử?
- ✅ Admin (full access)
- ✅ Manager (có thể cấu hình quyền)
- ❌ User thường (không có quyền)

### Ai Có Thể Khôi Phục?
- ✅ Admin
- ⚠️ Manager (tùy cấu hình)

### Thông Tin Được Ghi Lại
- User ID của người thực hiện
- IP Address
- User Agent (trình duyệt/thiết bị)
- Thời gian chính xác

---

## 🚀 Migration & Setup

### 1. Chạy Migration

```bash
cd backend
php artisan migrate
```

Migration sẽ tạo bảng `product_history` với đầy đủ cấu trúc và indexes.

### 2. Kiểm Tra Bảng

```sql
DESCRIBE product_history;
```

### 3. Test Chức Năng

1. Tạo một sản phẩm mới
2. Cập nhật sản phẩm (thay đổi giá, tồn kho)
3. Xóa sản phẩm
4. Khôi phục sản phẩm
5. Vào `/admin/products/{id}/history` để xem lịch sử

---

## 📊 Performance & Optimization

### Indexes Được Tạo

```sql
INDEX idx_product_id (product_id)      -- Tìm lịch sử theo sản phẩm
INDEX idx_user_id (user_id)            -- Tìm lịch sử theo user
INDEX idx_action (action)              -- Lọc theo hành động
INDEX idx_created_at (created_at)      -- Sắp xếp theo thời gian
```

### Best Practices

1. **Pagination:** Luôn sử dụng phân trang khi lấy danh sách lịch sử
2. **Filtering:** Sử dụng filters để giảm số lượng bản ghi trả về
3. **Cleanup:** Có thể xóa lịch sử cũ (> 1 năm) để tiết kiệm dung lượng
4. **Monitoring:** Theo dõi kích thước bảng và tối ưu hóa khi cần

---

## 🔄 Tích Hợp Với Các Module Khác

Chức năng lịch sử có thể mở rộng cho:

- 📦 **Categories** - Lịch sử thay đổi danh mục
- 🏷️ **Brands** - Lịch sử thay đổi thương hiệu
- 👥 **Users** - Lịch sử thay đổi thông tin người dùng
- 📝 **Posts** - Lịch sử chỉnh sửa bài viết
- 💰 **Orders** - Lịch sử thay đổi đơn hàng

### Cách Tích Hợp

1. Tạo migration tương tự với tên bảng phù hợp
2. Tạo Model kế thừa cấu trúc của ProductHistory
3. Thêm logging vào các Controller tương ứng
4. Tạo UI để xem lịch sử

---

## 📝 Changelog

### Version 1.0.0 (2025-11-06)

✨ **Tính năng mới:**
- Ghi lại lịch sử tạo, sửa, xóa, khôi phục sản phẩm
- API endpoints đầy đủ
- UI xem lịch sử và khôi phục
- Thống kê hoạt động
- Tích hợp vào trang quản lý sản phẩm

🛠️ **Cải tiến:**
- Tự động ghi IP và User Agent
- Mô tả chi tiết các thay đổi
- Support cả ID và Hashed ID

---

## 🤝 Support

Nếu có vấn đề hoặc câu hỏi:

1. Kiểm tra logs: `backend/storage/logs/laravel.log`
2. Kiểm tra console trình duyệt (F12)
3. Đảm bảo migration đã chạy thành công
4. Kiểm tra API responses với Postman/Insomnia

---

## 📚 Tài Liệu Liên Quan

- [HASH_ID_DOCUMENTATION.md](./HASH_ID_DOCUMENTATION.md) - Hướng dẫn về Hashed ID
- [API_TOKEN_DOCUMENTATION.md](./API_TOKEN_DOCUMENTATION.md) - Hướng dẫn về API Token
- [SETUP_PRODUCTS.md](./SETUP_PRODUCTS.md) - Hướng dẫn setup sản phẩm

---

**Cập nhật lần cuối:** 06/11/2025  
**Version:** 1.0.0  
**Tác giả:** Development Team
