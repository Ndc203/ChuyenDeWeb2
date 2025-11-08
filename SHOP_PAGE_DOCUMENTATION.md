# Tài liệu Chức năng Trang Shop

## Mô tả
Trang Shop cho phép khách hàng xem tất cả các sản phẩm đang được bày bán trên website với đầy đủ tính năng tìm kiếm, lọc và sắp xếp.

## Cấu trúc Files đã tạo

### 1. Pages
- **frontend/src/pages/shop/ShopPage.jsx**
  - Component chính hiển thị trang shop
  - Quản lý state cho products, filters, categories, brands
  - Xử lý logic lọc và sắp xếp sản phẩm
  - Fetch dữ liệu từ API backend

### 2. Components

#### ShopHeader (frontend/src/components/shop/ShopHeader.jsx)
- Header chứa logo, navigation, search bar
- Icons: wishlist, giỏ hàng, tài khoản
- Thanh tìm kiếm sản phẩm
- Responsive design

#### ShopFilters (frontend/src/components/shop/ShopFilters.jsx)
- Bộ lọc theo danh mục
- Bộ lọc theo thương hiệu
- Bộ lọc theo khoảng giá
- Quick filters cho giá (dưới 5tr, 5-10tr, 10-20tr, trên 20tr)

#### ProductCard (frontend/src/components/shop/ProductCard.jsx)
- Hiển thị thông tin sản phẩm:
  - Hình ảnh
  - Badges (SALE, MỚI, HOT)
  - Tên sản phẩm
  - Thương hiệu
  - Mô tả ngắn
  - Đánh giá (rating với sao)
  - Giá gốc và giá sau giảm
  - Trạng thái tồn kho
- Buttons: Thêm vào giỏ, Yêu thích
- Hover effects và animations

## API Endpoints sử dụng

### 1. Lấy danh sách sản phẩm
```
GET http://127.0.0.1:8000/api/products
```
Response bao gồm:
- id, hashed_id, name, slug
- description, brand, brand_id
- price, discount, final_price
- category, category_id
- stock, stock_status, status
- rating, reviews
- badges (SALE, MỚI, HOT)
- image
- created_at, updated_at

### 2. Lấy danh sách categories
```
GET http://127.0.0.1:8000/api/categories
```

### 3. Lấy danh sách brands
```
GET http://127.0.0.1:8000/api/brands
```

## Tính năng chính

### 1. Hiển thị sản phẩm
- Grid layout responsive (1 cột mobile, 2 cột tablet, 3 cột desktop)
- Hiển thị đầy đủ thông tin sản phẩm
- Badges động (SALE, MỚI, HOT)
- Hiển thị rating với sao
- Hiển thị giá gốc và giá sau giảm với % giảm giá

### 2. Tìm kiếm
- Thanh search trong header
- Tìm kiếm theo tên sản phẩm
- Real-time filter khi nhập

### 3. Bộ lọc (Filters)
- **Theo danh mục**: Radio buttons để chọn danh mục
- **Theo thương hiệu**: Radio buttons để chọn thương hiệu
- **Theo khoảng giá**: 
  - Input tùy chỉnh min-max
  - Quick filters (< 5tr, 5-10tr, 10-20tr, > 20tr)

### 4. Sắp xếp (Sort)
- Mặc định
- Tên A-Z / Z-A
- Giá thấp đến cao / cao đến thấp
- Mới nhất

### 5. UI/UX Features
- Loading spinner khi fetch data
- Empty state khi không có sản phẩm
- Hover effects trên product cards
- Smooth transitions và animations
- Sticky header
- Count số lượng sản phẩm hiển thị

## Routes đã cấu hình

Đã thêm vào **frontend/src/main.jsx**:
```javascript
{ path: "/shop", element: <ShopPage /> }
```

## Truy cập trang Shop

Sau khi khởi động cả backend và frontend:
- Backend: http://127.0.0.1:8000
- Frontend: http://localhost:5174
- Truy cập Shop: http://localhost:5174/shop

## Các tính năng có thể mở rộng trong tương lai

1. **Chi tiết sản phẩm**: Trang detail khi click vào product
2. **Giỏ hàng**: Chức năng thêm/xóa sản phẩm khỏi giỏ
3. **Wishlist**: Lưu sản phẩm yêu thích
4. **So sánh sản phẩm**: So sánh nhiều sản phẩm
5. **Pagination**: Phân trang khi có nhiều sản phẩm
6. **Lazy loading**: Load ảnh khi scroll
7. **Filters nâng cao**: Lọc theo nhiều tiêu chí hơn
8. **View modes**: Grid view / List view
9. **Recently viewed**: Sản phẩm đã xem gần đây
10. **Recommendations**: Gợi ý sản phẩm tương tự

## Styling

- Sử dụng **Tailwind CSS** cho styling
- Responsive design với breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- Color scheme:
  - Primary: Blue (#2563eb)
  - Success: Green
  - Danger: Red
  - Text: Gray shades

## Performance

- Component memoization có thể được thêm vào
- Lazy loading cho images
- Debounce cho search input
- Cache API responses nếu cần

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

Frontend packages đã có:
- React
- React Router DOM
- Tailwind CSS

## Testing

Để test chức năng:
1. Đảm bảo có dữ liệu sản phẩm trong database
2. Khởi động backend: `cd backend && php artisan serve`
3. Khởi động frontend: `cd frontend && npm run dev`
4. Truy cập http://localhost:5174/shop
5. Test các tính năng:
   - Tìm kiếm sản phẩm
   - Lọc theo category
   - Lọc theo brand
   - Lọc theo giá
   - Sắp xếp sản phẩm
   - Responsive trên các màn hình khác nhau

## Notes

- Code đã được tổ chức theo component-based architecture
- Dễ dàng maintain và mở rộng
- Responsive và user-friendly
- Tích hợp hoàn chỉnh với backend API hiện có
