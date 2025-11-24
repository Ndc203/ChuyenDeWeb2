import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const ShopHeader = ({ onSearch }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // State cho Giỏ hàng & User
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  // 1. LOGIC AUTH: Kiểm tra đăng nhập khi load trang
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('userInfo');
    const storedRole = localStorage.getItem('userRole');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
    }
  }, []);

  const handleLogout = async () => {
    try {
        const token = localStorage.getItem('authToken');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            await axios.post(`${API_URL}/api/logout`);
        }
    } catch (error) {
        console.error("Logout error", error);
    } finally {
        localStorage.clear(); // Xóa hết token
        setUser(null);
        setRole(null);
        setCartCount(0); // Reset giỏ hàng về 0
        navigate('/login');
    }
  };

  // 2. LOGIC CART: Tải số lượng giỏ hàng
  const fetchCartCount = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(`${API_URL}/api/cart`);

      // Kiểm tra kỹ dữ liệu trả về để tránh lỗi .reduce
      let items = [];
      if (Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        items = response.data.data;
      }

      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(totalQuantity);

    } catch (err) {
      // Token hết hạn hoặc lỗi mạng
      if (err.response && (err.response.status === 401 || err.response.status === 404)) {
         setCartCount(0);
      }
    }
  }, []);

  // 3. LOGIC EVENT: Lắng nghe sự thay đổi giỏ hàng
  useEffect(() => {
    fetchCartCount(); // Gọi lần đầu

    const handleCartUpdate = () => {
      fetchCartCount(); // Gọi lại khi có sự kiện
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [fetchCartCount]);


  // Logic Search (Giữ nguyên của bạn)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if(onSearch) onSearch(searchTerm);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">TechStore</span>
          </Link>

          {/* Navigation (Desktop) */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Sản phẩm
            </Link>
             <Link to="/posts" className="text-gray-700 hover:text-blue-600 font-medium">
              Bài viết
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
              Liên hệ
            </Link>
            
            {/* Link Phân Quyền (Chỉ hiện khi đủ quyền) */}
            {(role === 'admin' || role === 'Admin') && (
               <Link to="/admin/dashboard" className="text-red-600 font-bold hover:underline">
                 Quản trị
               </Link>
            )}
            {role === 'Shop Owner' && (
               <Link to="/shop/dashboard" className="text-purple-600 font-bold hover:underline">
                 Kênh người bán
               </Link>
            )}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg mx-8 hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* Icons Area */}
          <div className="flex items-center space-x-4">
            
            {/* Wishlist */}
            <button className="relative p-2 text-gray-700 hover:text-blue-600 hidden sm:block">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* Cart (Đã sửa thành Link và Logic đếm) */}
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-blue-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                </span>
              )}
            </Link>

            {/* User Account (Dropdown thông minh) */}
            {user ? (
                // -- Đã đăng nhập --
                <div className="relative group">
                    <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none">
                        {/* Avatar hoặc Icon */}
                        {user.avatar ? (
                             <img src={user.avatar} alt="Avatar" className="h-8 w-8 rounded-full object-cover border"/>
                        ) : (
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        )}
                        <span className="hidden lg:inline text-sm font-medium max-w-[100px] truncate">
                            {user.full_name || user.username}
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block border border-gray-100 before:block before:absolute before:-top-2 before:left-0 before:w-full before:h-2 before:bg-transparent">
                        <div className="px-4 py-2 border-b">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.full_name || user.username}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        
                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">Trang cá nhân</Link>
                        <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">Đơn hàng của tôi</Link>
                        
                        <button 
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            ) : (
                // -- Chưa đăng nhập --
                <Link to="/login" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden lg:inline text-sm font-medium">
                        Đăng nhập
                    </span>
                </Link>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};

export default ShopHeader;