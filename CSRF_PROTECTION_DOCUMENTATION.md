# 🛡️ CSRF Protection Documentation

## Tổng Quan

Tài liệu này mô tả cách triển khai bảo vệ chống tấn công CSRF (Cross-Site Request Forgery) trong dự án ChuyenDeWeb2.

### CSRF Attack là gì?

CSRF (Cross-Site Request Forgery) là một loại tấn công mạng trong đó kẻ tấn công lừa người dùng thực hiện các hành động không mong muốn trên một website mà họ đã đăng nhập. Ví dụ:
- Chuyển tiền từ tài khoản ngân hàng
- Thay đổi mật khẩu
- Xóa dữ liệu quan trọng
- Thực hiện các hành động với quyền của người dùng

### Cơ chế bảo vệ

Hệ thống sử dụng **CSRF Token** - một token ngẫu nhiên được tạo ra cho mỗi session:
1. Server tạo CSRF token và lưu trong session
2. Client nhận token và lưu trong localStorage
3. Mỗi request thay đổi dữ liệu (POST, PUT, PATCH, DELETE) phải kèm token
4. Server kiểm tra token có khớp với session hay không
5. Nếu không khớp → request bị từ chối (HTTP 419)

---

## 📁 Cấu Trúc Thư Mục

```
ChuyenDeWeb2/
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── CsrfController.php          # Controller quản lý CSRF token
│   │   │   └── Middleware/
│   │   │       └── CsrfProtection.php          # Middleware kiểm tra CSRF
│   │   └── bootstrap/
│   │       └── app.php                         # Cấu hình middleware
│   ├── config/
│   │   └── session.php                         # Cấu hình session
│   └── routes/
│       └── api.php                             # Routes CSRF
└── frontend/
    └── src/
        ├── utils/
        │   ├── csrfProtection.js               # Utility functions
        │   └── axiosConfig.js                  # Axios interceptors
        └── hooks/
            └── useCsrfProtection.js            # React hooks
```

---

## 🔧 Backend Implementation

### 1. CSRF Middleware (`backend/app/Http/Middleware/CsrfProtection.php`)

Middleware này kiểm tra CSRF token cho tất cả các request thay đổi dữ liệu:

```php
<?php
namespace App\Http\Middleware;

class CsrfProtection
{
    protected $except = [
        'api/login',           // Login không cần CSRF
        'api/register',        // Register không cần CSRF
        'api/forgot-password', // Quên mật khẩu không cần CSRF
        'api/reset-password',  // Reset mật khẩu không cần CSRF
        'api/test',           // Test endpoint
        'api/v1/*',           // API với token authentication
    ];
    
    public function handle(Request $request, Closure $next): Response
    {
        // Kiểm tra route có được miễn trừ không
        if ($this->inExceptArray($request)) {
            return $next($request);
        }

        // Chỉ kiểm tra cho POST, PUT, PATCH, DELETE
        if ($this->isReading($request)) {
            return $next($request);
        }

        // Lấy token từ header hoặc request body
        $token = $request->header('X-CSRF-TOKEN') ?? $request->input('_token');
        $sessionToken = Session::token();

        // Kiểm tra token
        if (!$token || !hash_equals($sessionToken, $token)) {
            return response()->json([
                'message' => 'CSRF token mismatch.',
                'error' => 'InvalidCsrfToken'
            ], 419);
        }

        return $next($request);
    }
}
```

**Đặc điểm:**
- ✅ Tự động kiểm tra CSRF token
- ✅ Exception list cho các route không cần CSRF
- ✅ Chỉ kiểm tra POST, PUT, PATCH, DELETE
- ✅ Hỗ trợ token từ header hoặc request body
- ✅ Sử dụng `hash_equals()` để chống timing attack

### 2. CSRF Controller (`backend/app/Http/Controllers/CsrfController.php`)

Controller cung cấp endpoints để quản lý CSRF token:

```php
<?php
namespace App\Http\Controllers;

class CsrfController extends Controller
{
    // GET /api/csrf-token - Lấy token hiện tại
    public function getToken()
    {
        $token = Session::token();
        return response()->json([
            'csrf_token' => $token,
            'expires_at' => now()->addMinutes(config('session.lifetime'))
        ]);
    }

    // POST /api/csrf-token/refresh - Làm mới token
    public function refreshToken()
    {
        Session::regenerateToken();
        $token = Session::token();
        
        return response()->json([
            'csrf_token' => $token,
            'expires_at' => now()->addMinutes(config('session.lifetime')),
            'message' => 'CSRF token đã được làm mới'
        ]);
    }

    // POST /api/csrf-token/verify - Kiểm tra token
    public function verifyToken(Request $request)
    {
        $token = $request->header('X-CSRF-TOKEN') ?? $request->input('_token');
        $sessionToken = Session::token();
        $isValid = $token && hash_equals($sessionToken, $token);

        return response()->json([
            'valid' => $isValid,
            'message' => $isValid ? 'CSRF token hợp lệ' : 'CSRF token không hợp lệ'
        ]);
    }
}
```

### 3. Routes (`backend/routes/api.php`)

```php
// CSRF Token routes (public - không cần authentication)
Route::controller(CsrfController::class)->group(function () {
    Route::get('/csrf-token', 'getToken');
    Route::post('/csrf-token/refresh', 'refreshToken');
    Route::post('/csrf-token/verify', 'verifyToken');
});
```

### 4. Middleware Configuration (`backend/bootstrap/app.php`)

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'csrf.protection' => \App\Http\Middleware\CsrfProtection::class,
    ]);

    $middleware->appendToGroup('api', [
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \App\Http\Middleware\CsrfProtection::class,
    ]);
})
```

**Quan trọng:**
- Sessions phải được bật cho API routes
- Cookie middleware để gửi session cookie
- CSRF middleware kiểm tra sau khi session đã start

---

## 💻 Frontend Implementation

### 1. CSRF Utility (`frontend/src/utils/csrfProtection.js`)

Cung cấp các hàm tiện ích để xử lý CSRF token:

```javascript
// Lấy CSRF token
const token = await getCsrfToken();

// Làm mới CSRF token
const newToken = await refreshCsrfToken();

// Clear token cache
clearCsrfToken();

// Verify token
const isValid = await verifyCsrfToken(token);

// Tạo headers với CSRF token
const headers = await createCsrfHeaders();

// Fetch với CSRF protection
const response = await csrfFetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(data)
});
```

**Tính năng:**
- ✅ Token caching (memory + localStorage)
- ✅ Tự động lấy token từ server
- ✅ Tự động refresh token khi hết hạn
- ✅ Retry request khi CSRF error
- ✅ Token validation trước khi gửi request

### 2. React Hooks (`frontend/src/hooks/useCsrfProtection.js`)

```javascript
// Hook chính
const { 
    token, 
    loading, 
    error, 
    refresh, 
    clear, 
    verify, 
    fetchWithCsrf, 
    getHeaders 
} = useCsrfProtection();

// Hook đơn giản - chỉ lấy token
const token = useCsrfToken();

// Hook cho form submission
const { submit, loading, error, response } = useCsrfForm();
await submit('/api/products', {
    method: 'POST',
    body: JSON.stringify(formData)
});
```

### 3. Axios Configuration (`frontend/src/utils/axiosConfig.js`)

Axios đã được cấu hình sẵn với CSRF protection:

```javascript
import axiosInstance, { api } from './utils/axiosConfig';

// Sử dụng axios instance trực tiếp
const response = await axiosInstance.post('/products', data);

// Hoặc sử dụng api helpers
await api.post('/products', data);
await api.put('/products/1', data);
await api.patch('/products/1', data);
await api.delete('/products/1');
await api.get('/products'); // GET không cần CSRF token
```

**Tính năng:**
- ✅ Tự động thêm CSRF token vào header
- ✅ Tự động retry khi CSRF error (419)
- ✅ Chỉ thêm token cho POST, PUT, PATCH, DELETE
- ✅ withCredentials: true (gửi cookies)

---

## 🚀 Cách Sử Dụng

### 1. Sử dụng với Axios (Khuyến nghị)

```javascript
import axiosInstance from './utils/axiosConfig';

// Tất cả requests tự động có CSRF protection
const createProduct = async (productData) => {
    try {
        const response = await axiosInstance.post('/products', productData);
        return response.data;
    } catch (error) {
        console.error('Error:', error);
    }
};
```

### 2. Sử dụng với React Hook

```javascript
import { useCsrfForm } from '../hooks/useCsrfProtection';

function ProductForm() {
    const { submit, loading, error } = useCsrfForm();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const result = await submit('/api/products', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            console.log('Success:', result);
        } catch (err) {
            console.error('Error:', err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Form fields */}
            <button type="submit" disabled={loading}>
                {loading ? 'Đang gửi...' : 'Gửi'}
            </button>
            {error && <div className="error">{error}</div>}
        </form>
    );
}
```

### 3. Sử dụng với Fetch API

```javascript
import { csrfFetch } from './utils/csrfProtection';

const createProduct = async (data) => {
    const response = await csrfFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    
    return await response.json();
};
```

### 4. Custom Implementation

```javascript
import { getCsrfToken } from './utils/csrfProtection';

const createProduct = async (data) => {
    const token = await getCsrfToken();
    
    const response = await fetch('/api/products', {
        method: 'POST',
        credentials: 'include', // Quan trọng!
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(data)
    });
    
    return await response.json();
};
```

---

## ⚙️ Configuration

### Backend Configuration

#### 1. Session Configuration (`backend/config/session.php`)

```php
return [
    'driver' => env('SESSION_DRIVER', 'database'),
    'lifetime' => env('SESSION_LIFETIME', 120), // 2 hours
    'expire_on_close' => false,
    'cookie' => env('SESSION_COOKIE', 'laravel-session'),
    'path' => '/',
    'domain' => env('SESSION_DOMAIN', null),
    'secure' => env('SESSION_SECURE_COOKIE', false),
    'http_only' => true,
    'same_site' => 'lax', // Quan trọng cho CSRF
];
```

#### 2. Environment Variables (`.env`)

```env
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_COOKIE=myapp-session
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
```

**Development:**
```env
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
```

**Production:**
```env
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=strict
SESSION_DOMAIN=.yourdomain.com
```

### Frontend Configuration

#### API Base URL (`frontend/src/utils/csrfProtection.js`)

```javascript
const API_BASE_URL = 'http://127.0.0.1:8000/api';
```

Cập nhật URL cho production:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.yourdomain.com/api';
```

---

## 🔍 Testing

### 1. Test với cURL

```bash
# Lấy CSRF token
curl -i -X GET http://127.0.0.1:8000/api/csrf-token \
     -H "Accept: application/json" \
     -c cookies.txt

# Sử dụng token trong request
curl -X POST http://127.0.0.1:8000/api/products \
     -H "Content-Type: application/json" \
     -H "X-CSRF-TOKEN: YOUR_TOKEN_HERE" \
     -b cookies.txt \
     -d '{"name":"Test Product"}'
```

### 2. Test với Postman

1. **Lấy CSRF token:**
   - GET `http://127.0.0.1:8000/api/csrf-token`
   - Lưu cookie từ response

2. **Gửi request với token:**
   - POST `http://127.0.0.1:8000/api/products`
   - Headers: `X-CSRF-TOKEN: <token>`
   - Đảm bảo cookies được gửi kèm

### 3. Test Frontend

```javascript
// Test lấy token
import { getCsrfToken } from './utils/csrfProtection';

const testToken = async () => {
    const token = await getCsrfToken();
    console.log('CSRF Token:', token);
};

// Test request với CSRF
import axiosInstance from './utils/axiosConfig';

const testRequest = async () => {
    try {
        const response = await axiosInstance.post('/test', { data: 'test' });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error);
    }
};
```

---

## 🐛 Troubleshooting

### Lỗi "CSRF token mismatch" (419)

**Nguyên nhân:**
- Session cookie không được gửi
- Token đã hết hạn
- Cookie domain không khớp
- SameSite cookie policy

**Giải pháp:**

1. **Kiểm tra cookies được gửi:**
```javascript
// Đảm bảo withCredentials: true
axios.defaults.withCredentials = true;

// Hoặc với fetch
fetch('/api/endpoint', {
    credentials: 'include'
});
```

2. **Kiểm tra session configuration:**
```php
// config/session.php
'domain' => env('SESSION_DOMAIN', null), // null cho localhost
'same_site' => 'lax', // không dùng 'strict' cho API
```

3. **Clear cache và cookies:**
```javascript
import { clearCsrfToken } from './utils/csrfProtection';
clearCsrfToken();
localStorage.clear();
```

4. **Refresh token:**
```javascript
import { refreshCsrfToken } from './utils/csrfProtection';
await refreshCsrfToken();
```

### CORS Issues

Nếu frontend và backend ở domain khác nhau:

```php
// backend/config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:5173'], // Frontend URL
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true, // Quan trọng!
];
```

### Session không lưu

1. **Tạo sessions table:**
```bash
php artisan session:table
php artisan migrate
```

2. **Kiểm tra session driver:**
```env
SESSION_DRIVER=database
```

3. **Test session:**
```php
// routes/web.php
Route::get('/test-session', function() {
    session(['test' => 'value']);
    return session('test');
});
```

---

## 🔒 Security Best Practices

### 1. Token Lifecycle

- ✅ Token được tạo mới cho mỗi session
- ✅ Token được refresh định kỳ
- ✅ Token bị vô hiệu hóa khi logout
- ✅ Token có thời gian sống giới hạn

### 2. Cookie Security

```php
'http_only' => true,        // Không thể truy cập từ JavaScript
'secure' => true,           // Chỉ gửi qua HTTPS (production)
'same_site' => 'strict',    // Chống CSRF (production)
```

### 3. Exception Handling

Chỉ miễn trừ CSRF cho:
- Login/Register endpoints
- Public API endpoints
- Endpoints với authentication khác (API tokens)

### 4. Rate Limiting

```php
// Thêm rate limiting cho CSRF token endpoint
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/csrf-token', [CsrfController::class, 'getToken']);
});
```

---

## 📊 Monitoring & Logging

### Log CSRF Errors

```php
// app/Http/Middleware/CsrfProtection.php
if (!$token || !hash_equals($sessionToken, $token)) {
    Log::warning('CSRF token mismatch', [
        'ip' => $request->ip(),
        'user_agent' => $request->userAgent(),
        'url' => $request->fullUrl(),
    ]);
    
    return response()->json([...], 419);
}
```

### Monitor Failed Attempts

```javascript
// frontend/src/utils/csrfProtection.js
export const handleCsrfError = async (error, retryFn) => {
    if (error.status === 419) {
        // Log to analytics
        console.error('CSRF Error:', {
            url: error.config?.url,
            timestamp: new Date().toISOString()
        });
        
        // Refresh and retry
        await refreshCsrfToken();
        return await retryFn();
    }
};
```

---

## 🎯 Kết Luận

CSRF Protection đã được triển khai đầy đủ với:

✅ **Backend:**
- Middleware kiểm tra CSRF token
- Controller quản lý token
- Routes để lấy/refresh token
- Session configuration

✅ **Frontend:**
- Utility functions cho token management
- React hooks cho easy integration
- Axios interceptors tự động xử lý
- Token caching & auto-refresh

✅ **Features:**
- Tự động thêm token vào requests
- Tự động retry khi token mismatch
- Token validation & verification
- Exception list cho public endpoints

✅ **Security:**
- HttpOnly cookies
- SameSite protection
- Token expiration
- Hash comparison (timing attack prevention)

---

## 📚 Tài Liệu Tham Khảo

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Laravel CSRF Protection](https://laravel.com/docs/11.x/csrf)
- [MDN: CSRF](https://developer.mozilla.org/en-US/docs/Glossary/CSRF)
- [SameSite Cookie Attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

---

**Last Updated:** 2025-11-08  
**Version:** 1.0.0  
**Author:** ChuyenDeWeb2 Team
