import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// Helper format tiền
const formatCurrency = (value) => {
  if (isNaN(value)) value = 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Hàm tải giỏ hàng
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login'); // Chuyển về login nếu chưa đăng nhập
        return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get(`${API_URL}/api/cart`);
      setCartItems(response.data);
    } catch (err) {
      setError('Không thể tải giỏ hàng.');
    } finally {
      setLoading(false);
    }
  };

  // Tải giỏ hàng khi vào trang
  useEffect(() => {
    fetchCart();
  }, []);

  // Hàm xử lý Xóa
  const handleRemoveItem = async (cartItemId) => {
    try {
      await axios.delete(`${API_URL}/api/cart/items/${cartItemId}`);
      // Xóa item khỏi state (để UI cập nhật ngay)
      setCartItems(prevItems => prevItems.filter(item => item.cartitem_id !== cartItemId));
    } catch (err) {
      alert('Lỗi! Không thể xóa sản phẩm.');
    }
  };

  // Hàm xử lý Cập nhật Số lượng
  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return; // Không cho số lượng < 1
    
    try {
      // Cập nhật ở backend
      const response = await axios.put(`${API_URL}/api/cart/items/${cartItemId}`, {
        quantity: newQuantity
      });
      
      // Cập nhật state ở frontend
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.cartitem_id === cartItemId ? response.data : item
        )
      );
    } catch (err) {
      alert('Lỗi! Không thể cập nhật số lượng.');
    }
  };

  // Tính tổng tiền (dùng useMemo để tối ưu)
  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      // Đảm bảo 'product' tồn tại
      if (item.product) {
        return total + (item.product.price * item.quantity);
      }
      return total;
    }, 0);
  }, [cartItems]);

  if (loading) {
    return <div className="text-center p-10">Đang tải giỏ hàng...</div>;
  }
  
  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Bạn có thể thêm Header/Navbar của trang user ở đây */}
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Giỏ hàng của bạn</h1>
        
        {cartItems.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-lg text-gray-600 mb-4">Giỏ hàng của bạn đang trống.</p>
            <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 1. Danh sách sản phẩm (Cột trái) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Sản phẩm</h2>
              <div className="space-y-4">
                {cartItems.map(item => (
                  // Đảm bảo item.product tồn tại
                  item.product ? (
                    <div key={item.cartitem_id} className="flex flex-col md:flex-row items-center gap-4 border-b pb-4">
                      {/* Ảnh */}
                      <img 
                        src={item.product.image || 'https://via.placeholder.com/100'} 
                        alt={item.product.name} 
                        className="w-24 h-24 object-cover rounded-md"
                      />
                      {/* Tên & Giá */}
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{item.product.name}</h3>
                        <p className="text-gray-600">{formatCurrency(item.product.price)}</p>
                      </div>
                      {/* Nút số lượng */}
                      <div className="flex items-center gap-2 border rounded-md p-1">
                        <button 
                          onClick={() => handleUpdateQuantity(item.cartitem_id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <input 
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.cartitem_id, parseInt(e.target.value))}
                          className="w-12 text-center font-medium outline-none [appearance:textfield]"
                          style={{MozAppearance: 'textfield'}} // Ẩn mũi tên trên Firefox
                        />
                        <button 
                          onClick={() => handleUpdateQuantity(item.cartitem_id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      {/* Tổng (của riêng item) */}
                      <div className="w-24 text-right">
                        <p className="font-semibold">{formatCurrency(item.product.price * item.quantity)}</p>
                      </div>
                      {/* Nút Xóa */}
                      <button 
                        onClick={() => handleRemoveItem(item.cartitem_id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-md"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ) : (
                    // Hiển thị nếu sản phẩm bị lỗi (vd: đã bị xóa)
                    <div key={item.cartitem_id} className="text-red-500">
                      Sản phẩm với ID {item.product_id} không còn tồn tại.
                      <button onClick={() => handleRemoveItem(item.cartitem_id)} className="ml-4 text-xs underline">Xóa</button>
                    </div>
                  )
                ))}
              </div>
            </div>
            
            {/* 2. Tổng kết (Cột phải) */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md sticky top-8">
                <h2 className="text-xl font-semibold mb-4">Tổng kết đơn hàng</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng phụ</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span className="font-medium">Miễn phí</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/checkout')} // Chuyển sang trang Thanh toán
                  className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  Tiến hành Thanh toán <ArrowRight size={20} />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}