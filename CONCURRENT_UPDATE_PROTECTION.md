# Bảo vệ Cập nhật Đồng thời (Concurrent Update Protection)

## Tổng quan

Hệ thống đã được triển khai **Optimistic Locking** (Khóa lạc quan) để ngăn chặn xung đột khi nhiều người dùng cùng chỉnh sửa sản phẩm trong các tab/cửa sổ khác nhau.

## Vấn đề

### Tình huống xung đột điển hình:

```
1. Tab A: Mở sản phẩm ID=1 để chỉnh sửa (Giá: 100,000đ)
2. Tab B: Mở sản phẩm ID=1 để chỉnh sửa (Giá: 100,000đ)
3. Tab A: Thay đổi giá thành 150,000đ → Click "Cập nhật" → Thành công ✓
4. Tab B: Thay đổi giá thành 200,000đ → Click "Cập nhật" → ???
```

**Kết quả không có bảo vệ:** Tab B ghi đè lên thay đổi của Tab A (mất dữ liệu)

**Kết quả có bảo vệ:** Tab B bị từ chối với thông báo yêu cầu tải lại trang ✓

## Giải pháp: Optimistic Locking

### Cách hoạt động

#### 1. Backend (Laravel)

**File:** `backend/app/Http/Controllers/ProductController.php`

```php
public function update(Request $request, $id)
{
    $product = $this->findProduct($id);

    $data = $request->validate([
        // ... các field khác ...
        'current_updated_at' => ['nullable', 'string'], // Timestamp để kiểm tra
    ]);

    // Kiểm tra xung đột
    if ($request->has('current_updated_at')) {
        $currentUpdatedAt = $request->input('current_updated_at');
        $dbUpdatedAt = $product->updated_at->format('Y-m-d H:i:s');
        
        // Nếu timestamp không khớp → Có người khác đã cập nhật
        if ($currentUpdatedAt !== $dbUpdatedAt) {
            return response()->json([
                'message' => 'Sản phẩm đã được cập nhật bởi người dùng khác. Vui lòng tải lại trang.',
                'error' => 'concurrent_update',
                'current_version' => $dbUpdatedAt,
            ], 409); // HTTP 409 Conflict
        }
    }

    // Xóa current_updated_at trước khi update
    unset($data['current_updated_at']);

    // Tiếp tục cập nhật bình thường
    $product->update($data);
    
    return response()->json([
        'message' => 'Cập nhật thành công',
        'data' => $product->fresh()
    ]);
}
```

#### 2. Frontend (React)

**File:** `frontend/src/pages/admin/AdminProductEditPage.jsx`

```javascript
// 1. Lưu updated_at khi load sản phẩm
const [currentUpdatedAt, setCurrentUpdatedAt] = useState(null);

useEffect(() => {
    const fetchData = async () => {
        const productRes = await axiosClient.get(`/products/${hashedId}`);
        const data = productRes.data;
        
        // Lưu timestamp hiện tại
        setCurrentUpdatedAt(data.updated_at);
        
        // Load form data...
    };
    fetchData();
}, [hashedId]);

// 2. Gửi timestamp khi cập nhật
const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formPayload = new FormData();
    // ... append các field khác ...
    
    // Gửi timestamp để kiểm tra
    if (currentUpdatedAt) {
        formPayload.append("current_updated_at", currentUpdatedAt);
    }
    
    try {
        await axiosClient.post(`/products/${hashedId}`, formPayload);
        navigate("/admin/products"); // Thành công
    } catch (error) {
        // 3. Xử lý lỗi conflict (409)
        if (error.response?.status === 409) {
            setError(
                "⚠️ Cảnh báo: Sản phẩm đã được cập nhật bởi người dùng khác. " +
                "Vui lòng tải lại trang để xem thay đổi mới nhất."
            );
        }
    }
};
```

## Luồng hoạt động chi tiết

### Trường hợp 1: Cập nhật thành công (Không xung đột)

```
┌─────────────┐        ┌─────────────┐        ┌──────────┐
│   Browser   │        │   Backend   │        │ Database │
└─────────────┘        └─────────────┘        └──────────┘
      │                       │                      │
      │ GET /products/1       │                      │
      │──────────────────────>│                      │
      │                       │ SELECT * FROM...     │
      │                       │─────────────────────>│
      │                       │                      │
      │                       │<─────────────────────│
      │<──────────────────────│                      │
      │ { updated_at:         │                      │
      │   "2025-11-29 22:00" }│                      │
      │                       │                      │
      │ PUT /products/1       │                      │
      │ current_updated_at:   │                      │
      │ "2025-11-29 22:00"    │                      │
      │──────────────────────>│                      │
      │                       │ Kiểm tra timestamp   │
      │                       │ → MATCH ✓            │
      │                       │                      │
      │                       │ UPDATE products...   │
      │                       │─────────────────────>│
      │                       │                      │
      │<──────────────────────│                      │
      │ 200 OK ✓              │                      │
```

### Trường hợp 2: Xung đột phát hiện (Conflict detected)

```
Tab A                   Tab B                   Backend         Database
  │                       │                        │               │
  │ GET /products/1       │                        │               │
  │──────────────────────────────────────────────>│               │
  │<──────────────────────────────────────────────│               │
  │ updated_at: "22:00"   │                        │               │
  │                       │                        │               │
  │                       │ GET /products/1        │               │
  │                       │───────────────────────>│               │
  │                       │<───────────────────────│               │
  │                       │ updated_at: "22:00"    │               │
  │                       │                        │               │
  │ PUT (current: 22:00)  │                        │               │
  │──────────────────────────────────────────────>│               │
  │                       │                        │ UPDATE ✓      │
  │                       │                        │──────────────>│
  │<──────────────────────────────────────────────│               │
  │ 200 OK ✓              │                        │ updated_at:   │
  │                       │                        │ "22:05" (new) │
  │                       │                        │               │
  │                       │ PUT (current: 22:00)   │               │
  │                       │───────────────────────>│               │
  │                       │                        │ Check:        │
  │                       │                        │ 22:00 ≠ 22:05 │
  │                       │                        │ → CONFLICT ✗  │
  │                       │<───────────────────────│               │
  │                       │ 409 Conflict ✗         │               │
  │                       │ "Vui lòng tải lại"    │               │
```

## HTTP Status Codes

| Code | Ý nghĩa | Hành động |
|------|---------|-----------|
| **200** | Cập nhật thành công | Chuyển về danh sách sản phẩm |
| **409** | Conflict - Có xung đột | Hiển thị cảnh báo, yêu cầu reload trang |
| **422** | Validation Error | Hiển thị lỗi validation |
| **500** | Server Error | Hiển thị lỗi chung |

## Ưu điểm của Optimistic Locking

### ✅ Ưu điểm

1. **Không khóa database**: Hiệu suất cao, nhiều người dùng có thể đọc/chỉnh sửa đồng thời
2. **Phát hiện xung đột**: Ngăn chặn ghi đè dữ liệu không mong muốn
3. **Trải nghiệm người dùng tốt**: Chỉ cảnh báo khi thực sự có xung đột
4. **Dễ triển khai**: Không cần queue hoặc lock mechanism phức tạp

### ⚠️ Lưu ý

1. Yêu cầu timestamp `updated_at` chính xác
2. Người dùng phải tải lại trang để xem thay đổi mới nhất
3. Không phù hợp nếu xung đột xảy ra quá thường xuyên

## Mở rộng cho các Entity khác

### Áp dụng cho Categories, Brands, Posts...

**Backend Controller:**

```php
public function update(Request $request, $id)
{
    $entity = $this->findEntity($id);
    
    // Thêm validation cho current_updated_at
    $data = $request->validate([
        // ... fields khác ...
        'current_updated_at' => ['nullable', 'string'],
    ]);
    
    // Kiểm tra xung đột
    if ($request->has('current_updated_at')) {
        $currentUpdatedAt = $request->input('current_updated_at');
        $dbUpdatedAt = $entity->updated_at->format('Y-m-d H:i:s');
        
        if ($currentUpdatedAt !== $dbUpdatedAt) {
            return response()->json([
                'message' => 'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang.',
                'error' => 'concurrent_update',
            ], 409);
        }
    }
    
    unset($data['current_updated_at']);
    $entity->update($data);
    
    return response()->json(['message' => 'Cập nhật thành công', 'data' => $entity]);
}
```

**Frontend Component:**

```javascript
const [currentUpdatedAt, setCurrentUpdatedAt] = useState(null);

// Khi load data
useEffect(() => {
    const fetchData = async () => {
        const res = await api.get(`/entities/${id}`);
        setCurrentUpdatedAt(res.data.updated_at); // Lưu timestamp
        // Load form...
    };
}, [id]);

// Khi submit
const handleSubmit = async (e) => {
    const payload = {
        ...formData,
        current_updated_at: currentUpdatedAt, // Gửi timestamp
    };
    
    try {
        await api.put(`/entities/${id}`, payload);
    } catch (error) {
        if (error.response?.status === 409) {
            alert("Vui lòng tải lại trang để xem thay đổi mới nhất!");
        }
    }
};
```

## Testing

### Test Case 1: Cập nhật bình thường

```bash
# Mở sản phẩm và cập nhật
1. Vào /admin/products
2. Click Edit sản phẩm
3. Thay đổi thông tin
4. Click "Cập nhật sản phẩm"
5. ✓ Thành công, quay về danh sách
```

### Test Case 2: Duplicate tab và cập nhật trùng lặp

```bash
# Tạo xung đột
1. Mở Tab A: /admin/products/edit/1
2. Duplicate thành Tab B (Ctrl+Shift+D hoặc right-click → Duplicate)
3. Tab A: Thay đổi giá → Click "Cập nhật" → ✓ Thành công
4. Tab B: Thay đổi tồn kho → Click "Cập nhật"
5. ✗ Lỗi 409: "Vui lòng tải lại trang..."
6. Tab B: Reload (F5) → Thấy thay đổi từ Tab A
7. Tab B: Thay đổi lại → Click "Cập nhật" → ✓ Thành công
```

### Test Case 3: Hai người dùng khác nhau

```bash
# User A và User B cùng edit sản phẩm
1. User A: Mở edit sản phẩm #1
2. User B: Mở edit sản phẩm #1
3. User A: Cập nhật trước → ✓ Thành công
4. User B: Cập nhật sau → ✗ Lỗi 409
5. User B: Refresh → Thấy thay đổi của User A → OK
```

## Troubleshooting

### Vấn đề 1: Luôn báo lỗi 409

**Nguyên nhân:** Format timestamp không khớp

**Giải pháp:**
```php
// Backend - đảm bảo format giống nhau
$dbUpdatedAt = $product->updated_at->format('Y-m-d H:i:s');
```

### Vấn đề 2: Không phát hiện conflict

**Nguyên nhân:** Không gửi `current_updated_at`

**Giải pháp:**
```javascript
// Frontend - đảm bảo gửi timestamp
if (currentUpdatedAt) {
    formPayload.append("current_updated_at", currentUpdatedAt);
}
```

### Vấn đề 3: Timestamp null

**Nguyên nhân:** Chưa lưu timestamp khi load

**Giải pháp:**
```javascript
// Kiểm tra data có updated_at không
if (data.updated_at) {
    setCurrentUpdatedAt(data.updated_at);
}
```

## Kết luận

Optimistic Locking là giải pháp hiệu quả để ngăn chặn xung đột cập nhật trong các ứng dụng web với nhiều người dùng đồng thời. Hệ thống đã được triển khai cho Products và có thể mở rộng dễ dàng cho các entity khác.

**Lợi ích chính:**
- ✅ Bảo vệ dữ liệu khỏi ghi đè không mong muốn
- ✅ Hiệu suất cao, không khóa database
- ✅ Thông báo rõ ràng cho người dùng
- ✅ Dễ bảo trì và mở rộng

---

**Ngày cập nhật:** 29/11/2025  
**Version:** 1.0  
