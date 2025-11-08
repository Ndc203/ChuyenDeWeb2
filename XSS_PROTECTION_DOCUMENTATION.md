# Tài Liệu Chống Tấn Công XSS (Cross-Site Scripting)

## Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Backend - Laravel](#backend---laravel)
3. [Frontend - React](#frontend---react)
4. [Ví Dụ Sử Dụng](#ví-dụ-sử-dụng)
5. [Best Practices](#best-practices)
6. [Testing](#testing)

---

## Giới Thiệu

XSS (Cross-Site Scripting) là một lỗ hổng bảo mật web phổ biến cho phép kẻ tấn công inject mã độc (thường là JavaScript) vào các trang web. Dự án này đã được trang bị một hệ thống bảo vệ toàn diện chống lại các cuộc tấn công XSS.

### Các Loại XSS

1. **Stored XSS**: Mã độc được lưu trên server (database)
2. **Reflected XSS**: Mã độc được phản chiếu từ request đến response
3. **DOM-based XSS**: Mã độc thực thi hoàn toàn ở client-side

---

## Backend - Laravel

### 1. Middleware XSS Protection

Middleware `XssProtection` tự động sanitize tất cả input và thêm security headers.

**Location**: `backend/app/Http/Middleware/XssProtection.php`

**Tính năng**:
- Tự động sanitize tất cả input requests
- Thêm security headers (X-XSS-Protection, Content-Security-Policy, etc.)
- Ngăn chặn clickjacking với X-Frame-Options
- Content-Type protection với X-Content-Type-Options

**Đã được đăng ký tự động** cho tất cả API routes trong `bootstrap/app.php`

### 2. XSS Helper Functions

Helper class cung cấp các methods để sanitize dữ liệu.

**Location**: `backend/app/Helpers/XssHelper.php`

#### Các Methods Chính

```php
use App\Helpers\XssHelper;

// 1. Sanitize text đơn giản (loại bỏ tất cả HTML)
$clean = XssHelper::sanitize($userInput);

// 2. Sanitize HTML content (cho phép một số thẻ an toàn)
$cleanHtml = XssHelper::sanitizeHtml($htmlContent);

// 3. Escape output để hiển thị
$escaped = XssHelper::escape($output);

// 4. Sanitize URL
$cleanUrl = XssHelper::sanitizeUrl($url);

// 5. Sanitize email
$cleanEmail = XssHelper::sanitizeEmail($email);

// 6. Sanitize filename
$cleanFilename = XssHelper::sanitizeFilename($filename);

// 7. Sanitize array
$cleanArray = XssHelper::sanitizeArray($data);

// 8. Kiểm tra có chứa XSS không
if (XssHelper::containsXss($input)) {
    // Handle dangerous input
}
```

### 3. Sử Dụng Trong Controllers

```php
use App\Helpers\XssHelper;

class ProductController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Sanitize description nếu cho phép HTML
        if (isset($data['description'])) {
            $data['description'] = XssHelper::sanitizeHtml($data['description']);
        }

        // Hoặc sanitize toàn bộ array
        $data = XssHelper::sanitizeArray($data);

        Product::create($data);
    }
}
```

### 4. Sử Dụng Trong Models

```php
use App\Helpers\XssHelper;

class Post extends Model
{
    // Tự động sanitize khi set attribute
    public function setContentAttribute($value)
    {
        $this->attributes['content'] = XssHelper::sanitizeHtml($value);
    }

    // Tự động escape khi get attribute
    public function getTitleAttribute($value)
    {
        return XssHelper::escape($value);
    }
}
```

### 5. Sử Dụng Trong Blade Views

```php
<!-- Escape output (tự động với {{ }}) -->
<h1>{{ $title }}</h1>

<!-- Raw output (NGUY HIỂM - chỉ dùng với dữ liệu đã sanitize) -->
<div>{!! $sanitizedContent !!}</div>

<!-- Với helper -->
<div>{!! XssHelper::sanitizeHtml($content) !!}</div>
```

---

## Frontend - React

### 1. Utility Functions

**Location**: `frontend/src/utils/xssProtection.js`

#### Import và Sử Dụng

```javascript
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  escapeHtml,
  containsXss,
  SafeHtml
} from '../utils/xssProtection';

// 1. Sanitize HTML (cho phép một số thẻ an toàn)
const cleanHtml = sanitizeHtml(userInput);

// 2. Sanitize text (loại bỏ tất cả HTML)
const cleanText = sanitizeText(userInput);

// 3. Sanitize URL
const cleanUrl = sanitizeUrl(url);

// 4. Escape HTML
const escaped = escapeHtml(text);

// 5. Kiểm tra XSS
if (containsXss(input)) {
  alert('Cảnh báo: Nội dung nguy hiểm!');
}

// 6. Component để hiển thị HTML đã sanitize
<SafeHtml html={content} className="content" />
```

### 2. React Hooks

**Location**: `frontend/src/hooks/useXssProtection.js`

#### useSanitizedInput Hook

```javascript
import { useSanitizedInput } from '../hooks/useXssProtection';

function MyComponent() {
  const [value, setValue, sanitizedValue] = useSanitizedInput('', 'text');

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Enter text"
    />
  );
}
```

#### useSanitizedForm Hook

```javascript
import { useSanitizedForm } from '../hooks/useXssProtection';

function ProductForm() {
  const {
    formData,
    handleChange,
    handleBlur,
    getSanitizedData,
    errors,
    hasErrors
  } = useSanitizedForm(
    { name: '', description: '' },
    { name: 'text', description: 'html' }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasErrors) {
      const cleanData = getSanitizedData();
      // Submit cleanData to API
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        onBlur={() => handleBlur('name')}
      />
      {errors.name && <span className="error">{errors.name}</span>}

      <textarea
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        onBlur={() => handleBlur('description')}
      />
      {errors.description && <span className="error">{errors.description}</span>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

#### useXssCheck Hook

```javascript
import { useXssCheck } from '../hooks/useXssProtection';

function CommentBox() {
  const [comment, setComment] = useState('');
  const { hasXss, message } = useXssCheck(comment);

  return (
    <div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className={hasXss ? 'border-red-500' : ''}
      />
      {hasXss && (
        <div className="text-red-500 text-sm">{message}</div>
      )}
    </div>
  );
}
```

#### useSanitizedPaste Hook

```javascript
import { useSanitizedPaste } from '../hooks/useXssProtection';

function Editor() {
  const handlePaste = useSanitizedPaste();

  return (
    <textarea
      onPaste={(e) => handlePaste(e, 'html')}
      placeholder="Paste content here"
    />
  );
}
```

---

## Ví Dụ Sử Dụng

### 1. Form Tạo Sản Phẩm

```javascript
import { useSanitizedForm } from '../hooks/useXssProtection';

function CreateProductForm() {
  const {
    formData,
    handleChange,
    getSanitizedData,
    errors
  } = useSanitizedForm(
    {
      name: '',
      description: '',
      price: ''
    },
    {
      name: 'text',
      description: 'html',
      price: 'text'
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const cleanData = getSanitizedData();
    
    try {
      await axios.post('/api/products', cleanData);
      alert('Sản phẩm đã được tạo!');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Tên sản phẩm"
      />
      
      <textarea
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Mô tả"
      />
      
      <button type="submit">Tạo Sản Phẩm</button>
    </form>
  );
}
```

### 2. Hiển Thị Nội Dung HTML An Toàn

```javascript
import { SafeHtml } from '../utils/xssProtection';

function ProductDetails({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      
      {/* Hiển thị HTML đã được sanitize */}
      <SafeHtml 
        html={product.description} 
        className="product-description"
      />
    </div>
  );
}
```

### 3. Hiển Thị Danh Sách Comments

```javascript
import { sanitizeText, sanitizeHtml } from '../utils/xssProtection';

function CommentList({ comments }) {
  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id} className="comment">
          <h4>{sanitizeText(comment.author)}</h4>
          <div dangerouslySetInnerHTML={{
            __html: sanitizeHtml(comment.content)
          }} />
        </div>
      ))}
    </div>
  );
}
```

---

## Best Practices

### 1. Backend

✅ **NÊN**:
- Luôn validate input với Laravel validation rules
- Sử dụng `XssHelper::sanitize()` cho text đơn giản
- Sử dụng `XssHelper::sanitizeHtml()` cho content có HTML
- Sanitize data trước khi lưu vào database
- Escape output khi hiển thị trong views

❌ **KHÔNG NÊN**:
- Tin tưởng user input mà không validate
- Sử dụng raw output `{!! !!}` với dữ liệu chưa sanitize
- Disable XSS middleware cho routes nhạy cảm

### 2. Frontend

✅ **NÊN**:
- Sử dụng hooks `useSanitizedForm` cho forms
- Sử dụng `SafeHtml` component cho HTML content
- Validate input ở client-side trước khi gửi
- Sanitize data nhận từ API
- Sử dụng `sanitizeUrl()` cho tất cả URLs

❌ **KHÔNG NÊN**:
- Sử dụng `dangerouslySetInnerHTML` trực tiếp
- Skip sanitization vì "trust the source"
- Concatenate HTML strings từ user input

### 3. General

- **Defense in Depth**: Sanitize cả input (frontend) và output (backend)
- **Whitelist approach**: Chỉ cho phép các thẻ HTML và attributes an toàn
- **Context-aware**: Chọn method sanitize phù hợp với context
- **Regular updates**: Cập nhật DOMPurify và security packages

---

## Testing

### 1. Test Cases Backend

```php
// tests/Feature/XssProtectionTest.php
public function test_xss_sanitization()
{
    $malicious = '<script>alert("XSS")</script>Hello';
    $clean = XssHelper::sanitize($malicious);
    
    $this->assertStringNotContainsString('<script>', $clean);
    $this->assertStringContainsString('Hello', $clean);
}

public function test_middleware_blocks_xss()
{
    $response = $this->post('/api/products', [
        'name' => '<script>alert("XSS")</script>Product'
    ]);
    
    $response->assertStatus(422); // hoặc check sanitized
}
```

### 2. Test Cases Frontend

```javascript
// __tests__/xssProtection.test.js
import { sanitizeHtml, containsXss } from '../utils/xssProtection';

test('sanitizes script tags', () => {
  const input = '<script>alert("XSS")</script>Hello';
  const output = sanitizeHtml(input);
  
  expect(output).not.toContain('<script>');
  expect(output).toContain('Hello');
});

test('detects XSS attempts', () => {
  const malicious = '<script>alert(1)</script>';
  expect(containsXss(malicious)).toBe(true);
});
```

### 3. Manual Testing

Thử các payload XSS phổ biến:

```javascript
// Basic XSS
<script>alert('XSS')</script>

// IMG tag
<img src=x onerror=alert('XSS')>

// Event handlers
<div onmouseover="alert('XSS')">Hover me</div>

// JavaScript protocol
<a href="javascript:alert('XSS')">Click</a>

// Data URI
<a href="data:text/html,<script>alert('XSS')</script>">Click</a>
```

---

## Troubleshooting

### 1. Content bị xóa sau khi sanitize

**Nguyên nhân**: Content chứa các thẻ không được phép

**Giải pháp**: 
- Kiểm tra `ALLOWED_TAGS` trong config
- Sử dụng `sanitizeHtml()` thay vì `sanitizeText()` nếu cần giữ HTML

### 2. CSP headers block resources

**Nguyên nhân**: Content Security Policy quá strict

**Giải pháp**: 
- Cập nhật CSP trong `XssProtection` middleware
- Thêm domains cần thiết vào whitelist

### 3. Performance issues

**Nguyên nhân**: Sanitize quá nhiều lần

**Giải pháp**:
- Cache sanitized content
- Chỉ sanitize khi cần thiết
- Sử dụng memoization trong React

---

## Tài Liệu Tham Khảo

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Laravel Security Best Practices](https://laravel.com/docs/security)

---

## Liên Hệ & Support

Nếu có câu hỏi hoặc phát hiện lỗ hổng bảo mật, vui lòng liên hệ team development.

**Version**: 1.0
**Last Updated**: 08/11/2025
