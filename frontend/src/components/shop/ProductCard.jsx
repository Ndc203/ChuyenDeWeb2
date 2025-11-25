import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const ProductCard = ({ product }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'SALE':
        return 'bg-green-500';
      case 'MỚI':
        return 'bg-blue-500';
      case 'HOT':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`half-${product.id}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#half-${product.id})`}
              d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
            />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      }
    }
    return stars;
  };

  const handleAddToCart = async (e) => {
    // Ngăn chặn sự kiện click lan ra ngoài (để không bị nhảy vào trang chi tiết khi bấm nút Mua)
    e.preventDefault();
    e.stopPropagation();

    try {
      // 1. Kiểm tra đăng nhập
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert("Vui lòng đăng nhập để mua hàng!");
        return;
      }

      // 2. Lấy ID sản phẩm an toàn (phòng trường hợp API trả về id hoặc product_id)
      const idToSend = product.product_id || product.id;
      if (!idToSend) {
        alert("Lỗi dữ liệu: Không tìm thấy ID sản phẩm.");
        return;
      }

      // 3. Cấu hình Header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // 4. Gọi API Thêm vào giỏ
      await axios.post(`${API_URL}/api/cart/add`, {
        product_id: idToSend,
        quantity: 1
      });

      // 5. Thông báo thành công
      alert(`Đã thêm "${product.name}" vào giỏ hàng!`);

      // 6. QUAN TRỌNG: Bắn tín hiệu để Header cập nhật số lượng ngay lập tức
      window.dispatchEvent(new CustomEvent('cartUpdated'));

    } catch (err) {
      console.error("Lỗi thêm vào giỏ:", err);

      // 7. Xử lý các loại lỗi
      if (err.response) {
        if (err.response.status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        } else if (err.response.status === 500) {
          alert("Lỗi Server (500). Vui lòng thử lại sau.");
        } else {
          // Hiển thị tin nhắn lỗi từ Backend trả về (nếu có)
          alert(err.response.data.message || "Có lỗi xảy ra khi thêm sản phẩm.");
        }
      } else {
        alert("Không thể kết nối đến Server.");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
      <Link to={`/product/${product.slug || product.product_id}`}>
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {/* Badges */}
          {product.badges && product.badges.length > 0 && (
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
              {product.badges.map((badge, index) => (
                <span
                  key={index}
                  className={`${getBadgeColor(badge)} text-white text-xs font-bold px-2 py-1 rounded`}
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* Product Image */}
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button className="bg-white text-gray-900 px-4 py-2 rounded-md font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              Xem nhanh
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
          )}

          {/* Product Name */}
          <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 h-10">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2 h-8">
              {product.description}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              {renderStars(product.rating || 0)}
            </div>
            <span className="text-xs text-gray-600">
              ({product.reviews || 0})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-red-600">
              {formatPrice(product.final_price)}
            </span>
            {product.discount > 0 && (
              <>
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                  -{product.discount}%
                </span>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Còn {product.stock} sản phẩm
            </span>
            {product.stock > 0 ? (
              <span className="text-xs text-green-600 font-medium">
                Còn hàng
              </span>
            ) : (
              <span className="text-xs text-red-600 font-medium">
                Hết hàng
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={handleAddToCart}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md font-medium hover:bg-indigo-100"
        >
          <ShoppingCart size={18} />
          Thêm vào giỏ
        </button>
        <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
