import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const ShopHeader = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const [cartCount, setCartCount] = useState(0);

  // 2. Tách hàm fetchCartCount ra ngoài
  // Dùng useCallback để đảm bảo hàm này không bị tạo lại
  const fetchCartCount = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_URL}/api/cart`);
        
        // SỬA: Đếm TỔNG SỐ LƯỢNG (thay vì .length)
        const totalQuantity = response.data.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalQuantity); 

      } catch (err) {
        console.error("Lỗi lấy cart count:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 404)) {
           setCartCount(0);
        }
      }
    }
  }, []); // [] = hàm này chỉ tạo 1 lần

  // 3. SỬA LẠI useEffect để LẮNG NGHE
  useEffect(() => {
    // 3.1. Lấy count 1 lần khi tải trang
    fetchCartCount();
    
    // 3.2. Định nghĩa hàm xử lý khi nghe thấy sự kiện
    const handleCartUpdate = () => {
      console.log('Event "cartUpdated" đã được nghe! Đang tải lại số lượng...');
      fetchCartCount(); // Gọi lại hàm fetch
    };

    // 3.3. Bắt đầu lắng nghe
    window.addEventListener('cartUpdated', handleCartUpdate);

    // 3.4. Dọn dẹp (rất quan trọng)
    // Khi component bị gỡ (unmount), ngừng lắng nghe
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [fetchCartCount]); // [] = Chạy 1 lần khi header tải



  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/shop" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">TechStore</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/shop" className="text-gray-700 hover:text-blue-600 font-medium">
              Sản phẩm
            </Link>
             <Link to="/shop/posts" className="text-gray-700 hover:text-blue-600 font-medium">
              Bài viết
            </Link>
            <Link to="/shop/contact" className="text-gray-700 hover:text-blue-600 font-medium">
              Liên hệ
            </Link>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            {/* Wishlist */}
            <button className="relative p-2 text-gray-700 hover:text-blue-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            {/* Cart */}
            <Link to={"/shop/cart"} className="relative p-2 text-gray-700 hover:text-blue-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartCount > 0 && ( // Chỉ hiển thị nếu count > 0
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
            </Link>

            {/* User Account */}
            <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="hidden lg:inline text-sm font-medium">
                Tài khoản
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ShopHeader;
