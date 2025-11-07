# Tài liệu API Token System

## 📋 Tổng quan
Hệ thống API Token cho phép bạn tạo các token riêng biệt để truy cập API với:
- **Rate Limiting**: Giới hạn số lượng request/phút
- **Permissions**: Quyền truy cập chi tiết (read, create, update, delete)
- **Expiration**: Thời gian hết hạn tùy chỉnh
- **Tracking**: Theo dõi lần sử dụng cuối

---

## 🚀 Bắt đầu nhanh

### 1. Chạy Migration

```bash
cd backend
php artisan migrate
```

### 2. Tạo Token đầu tiên

**Request:**
```bash
POST http://localhost:8000/api/api-tokens
Content-Type: application/json

{
  "user_id": 1,
  "name": "My First API Token",
  "permissions": ["products.*"],
  "rate_limit": 60,
  "expires_at": "2025-12-31 23:59:59"
}
```

**Response:**
```json
{
  "message": "API token created successfully",
  "token": {
    "id": 1,
    "user_id": 1,
    "name": "My First API Token",
    "permissions": ["products.*"],
    "rate_limit": 60,
    "is_active": true,
    "created_at": "2025-11-06T10:00:00.000000Z"
  },
  "plain_token": "abcd1234efgh5678ijkl9012mnop3456qrst7890",
  "warning": "Please save this token securely. You will not be able to see it again!"
}
```

⚠️ **Quan trọng**: Lưu `plain_token` ngay lập tức! Bạn sẽ không thể xem lại token này.

### 3. Sử dụng Token

```bash
GET http://localhost:8000/api/v1/products
Authorization: Bearer abcd1234efgh5678ijkl9012mnop3456qrst7890
```

---

## 🔐 Permissions (Quyền)

### Danh sách Permissions có sẵn:

| Permission | Mô tả |
|------------|-------|
| `*` | Toàn quyền truy cập tất cả API |
| `products.*` | Toàn quyền quản lý sản phẩm |
| `products.read` | Chỉ xem sản phẩm |
| `products.create` | Tạo sản phẩm mới |
| `products.update` | Cập nhật sản phẩm |
| `products.delete` | Xóa sản phẩm |
| `reviews.*` | Toàn quyền quản lý đánh giá |
| `reviews.read` | Chỉ xem đánh giá |
| `reviews.update` | C ập nhật đánh giá |
| `reviews.delete` | Xóa đánh giá |

### Lấy danh sách permissions:

```bash
GET http://localhost:8000/api/api-tokens/permissions
```

---

## 📡 API Endpoints

### 1. Quản lý Tokens

#### Lấy danh sách tokens
```bash
GET /api/api-tokens
GET /api/api-tokens?user_id=1  # Lọc theo user
```

#### Tạo token mới
```bash
POST /api/api-tokens
Content-Type: application/json

{
  "user_id": 1,
  "name": "Production API Key",
  "permissions": ["products.read", "products.create"],
  "rate_limit": 100,
  "expires_at": "2025-12-31 23:59:59"
}
```

#### Xem chi tiết token
```bash
GET /api/api-tokens/{id}
```

#### Cập nhật token
```bash
PUT /api/api-tokens/{id}
Content-Type: application/json

{
  "name": "Updated Token Name",
  "rate_limit": 200,
  "permissions": ["products.*"]
}
```

#### Vô hiệu hóa token
```bash
PATCH /api/api-tokens/{id}/deactivate
```

#### Kích hoạt token
```bash
PATCH /api/api-tokens/{id}/activate
```

#### Xóa token
```bash
DELETE /api/api-tokens/{id}
```

#### Thống kê sử dụng
```bash
GET /api/api-tokens/{id}/statistics
```

### 2. API với Token Authentication

#### Products API

**Xem danh sách sản phẩm** (Yêu cầu: `products.read`)
```bash
GET /api/v1/products
Authorization: Bearer YOUR_TOKEN
```

**Xem chi tiết sản phẩm** (Yêu cầu: `products.read`)
```bash
GET /api/v1/products/{id}
Authorization: Bearer YOUR_TOKEN
```

**Tạo sản phẩm** (Yêu cầu: `products.create`)
```bash
POST /api/v1/products
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "iPhone 15 Pro Max",
  "price": 29990000,
  "stock": 100
}
```

**Cập nhật sản phẩm** (Yêu cầu: `products.update`)
```bash
PUT /api/v1/products/{id}
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "iPhone 15 Pro Max Updated",
  "price": 28990000
}
```

**Xóa sản phẩm** (Yêu cầu: `products.delete`)
```bash
DELETE /api/v1/products/{id}
Authorization: Bearer YOUR_TOKEN
```

#### Reviews API

**Xem đánh giá** (Yêu cầu: `reviews.read`)
```bash
GET /api/v1/reviews
Authorization: Bearer YOUR_TOKEN
```

**Cập nhật trạng thái** (Yêu cầu: `reviews.update`)
```bash
PATCH /api/v1/reviews/{id}/status
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "status": "approved"
}
```

**Xóa đánh giá** (Yêu cầu: `reviews.delete`)
```bash
DELETE /api/v1/reviews/{id}
Authorization: Bearer YOUR_TOKEN
```

---

## ⚡ Rate Limiting

### Cách hoạt động:
- Mỗi token có giới hạn số request/phút (mặc định: 60)
- Counter được reset sau mỗi phút
- Rate limit headers được trả về trong response

### Response Headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1699999999
```

### Khi vượt quá giới hạn:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "rate_limit": 60,
  "retry_after": 60
}
```

---

## 🚨 Error Responses

### 401 Unauthorized - Token không hợp lệ
```json
{
  "error": "Unauthorized",
  "message": "Invalid API token"
}
```

### 403 Forbidden - Không có quyền
```json
{
  "error": "Forbidden",
  "message": "Permission denied. Required permission: products.create"
}
```

### 429 Too Many Requests - Vượt rate limit
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "rate_limit": 60,
  "retry_after": 60
}
```

---

## 💡 Use Cases

### 1. Mobile App Integration
```json
{
  "name": "Mobile App - Production",
  "permissions": ["products.read", "reviews.read"],
  "rate_limit": 100,
  "expires_at": "2026-12-31 23:59:59"
}
```

### 2. Third-party Integration
```json
{
  "name": "Partner API Access",
  "permissions": ["products.read"],
  "rate_limit": 60,
  "expires_at": "2025-06-30 23:59:59"
}
```

### 3. Admin Dashboard
```json
{
  "name": "Admin Dashboard",
  "permissions": ["*"],
  "rate_limit": 200,
  "expires_at": null
}
```

### 4. Testing/Development
```json
{
  "name": "Development Token",
  "permissions": ["products.*", "reviews.*"],
  "rate_limit": 1000,
  "expires_at": "2025-12-31 23:59:59"
}
```

---

## 🔒 Best Practices

### 1. Token Security
- ✅ Lưu token ở nơi an toàn (environment variables)
- ✅ Sử dụng HTTPS cho tất cả API calls
- ✅ Không commit token vào Git
- ❌ Không share token publicly

### 2. Permissions
- ✅ Sử dụng quyền tối thiểu cần thiết (Principle of Least Privilege)
- ✅ Read-only token cho các ứng dụng chỉ cần xem dữ liệu
- ✅ Tách biệt token cho từng môi trường (dev, staging, prod)

### 3. Rate Limiting
- ✅ Đặt rate limit phù hợp với use case
- ✅ Implement retry logic với exponential backoff
- ✅ Cache dữ liệu để giảm số lượng API calls

### 4. Token Management
- ✅ Đặt thời gian hết hạn hợp lý
- ✅ Rotate tokens định kỳ
- ✅ Xóa tokens không sử dụng
- ✅ Monitor token usage

---

## 📊 Monitoring

### Kiểm tra token usage:
```bash
GET /api/api-tokens/{id}/statistics

Response:
{
  "token_id": 1,
  "token_name": "My API Token",
  "user": "Admin",
  "created_at": "2025-11-06T10:00:00.000000Z",
  "last_used_at": "2025-11-06T15:30:00.000000Z",
  "is_active": true,
  "expires_at": "2025-12-31T23:59:59.000000Z",
  "rate_limit": 60,
  "permissions": ["products.*"],
  "days_since_last_use": 0
}
```

---

## 🧪 Testing với cURL

### 1. Tạo token
```bash
curl -X POST http://localhost:8000/api/api-tokens \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "Test Token",
    "permissions": ["products.read"],
    "rate_limit": 60
  }'
```

### 2. Sử dụng token
```bash
curl -X GET http://localhost:8000/api/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test rate limiting
```bash
# Chạy 61 requests liên tục để test rate limit
for i in {1..61}; do
  echo "Request $i"
  curl -X GET http://localhost:8000/api/v1/products \
    -H "Authorization: Bearer YOUR_TOKEN"
  echo ""
done
```

---

## 🐛 Troubleshooting

### Token không hoạt động?
1. Kiểm tra token có đúng format không
2. Kiểm tra token còn active không
3. Kiểm tra token chưa hết hạn
4. Kiểm tra permissions phù hợp với route

### Rate limit bị vượt quá nhanh?
1. Tăng rate_limit của token
2. Implement caching ở client
3. Batch multiple requests

### Permission denied?
1. Kiểm tra token có quyền cần thiết không
2. Kiểm tra middleware configuration
3. Xem logs để debug

---

## 📚 Code Examples

### PHP/Laravel
```php
$response = Http::withToken('YOUR_API_TOKEN')
    ->get('http://localhost:8000/api/v1/products');

$products = $response->json();
```

### JavaScript/Axios
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN'
  }
});

const products = await api.get('/products');
```

### Python/Requests
```python
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_TOKEN'
}

response = requests.get(
    'http://localhost:8000/api/v1/products',
    headers=headers
)

products = response.json()
```

---

## 📞 Support
Nếu có vấn đề, kiểm tra:
1. Token còn active và chưa hết hạn
2. Permissions được cấu hình đúng
3. Rate limit chưa bị vượt quá
4. Headers được gửi đúng format

---

## 🔄 Migration Guide

Để áp dụng cho models khác, copy cấu trúc và cập nhật permissions phù hợp với business logic của bạn.

---

**Version**: 1.0.0  
**Last Updated**: November 6, 2025  
**Author**: Development Team
