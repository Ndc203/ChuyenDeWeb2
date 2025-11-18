import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';

import ShopHeader from '../../components/shop/ShopHeader'; 

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

  // Hàm tải giỏ hàng (Giữ nguyên)
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login'); 
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

  useEffect(() => {
    fetchCart();
  }, []);

  // Hàm xử lý Xóa (Giữ nguyên)
  const handleRemoveItem = async (cartItemId) => {
    try {
      await axios.delete(`${API_URL}/api/cart/items/${cartItemId}`);
      setCartItems(prevItems => prevItems.filter(item => item.cartitem_id !== cartItemId));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (err) {
      alert('Lỗi! Không thể xóa sản phẩm.');
    }
  };

  // Hàm xử lý Cập nhật Số lượng (Giữ nguyên)
  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      const response = await axios.put(`${API_URL}/api/cart/items/${cartItemId}`, {
        quantity: newQuantity
      });
      
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.cartitem_id === cartItemId ? response.data : item
        )
      );
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (err) {
      alert('Lỗi! Không thể cập nhật số lượng.');
    }
  };

  // Tính tổng tiền (Giữ nguyên)
  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      if (item.product) {
        return total + (item.product.price * item.quantity);
      }
      return total;
    }, 0);
  }, [cartItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ShopHeader />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // --- SỬA BỐ CỤC CHO GIỐNG ShopPage.jsx ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Header (Dùng chung) */}
      <ShopHeader />

      {/* 2. Main Content (Dùng chung layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error ? (
           <div className="bg-white rounded-lg shadow-sm p-12 text-center text-red-500">
             <p>{error}</p>
           </div>
        ) : cartItems.length === 0 ? (
          // GIỎ HÀNG RỖNG
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Giỏ hàng của bạn đang trống</h3>
            <p className="mt-1 text-sm text-gray-500">Hãy thêm sản phẩm để tiếp tục.</p>
            <div className="mt-6">
              <Link to="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        ) : (
          // GIỎ HÀNG CÓ SẢN PHẨM
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 3. Cột trái: Danh sách sản phẩm (Giống <main>) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
              <h1 className="text-2xl font-semibold mb-4">Giỏ hàng ({cartItems.length} sản phẩm)</h1>
              <div className="space-y-4">
                {cartItems.map(item => (
                  item.product ? (
                    <div key={item.cartitem_id} className="flex flex-col md:flex-row items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0">
                      <img 
                        src={item.product.image || 'https://via.placeholder.com/100'} 
                        alt={item.product.name} 
                        className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 text-center md:text-left">
                        <Link to={`/product/${item.product.slug}`} className="font-medium text-lg hover:text-indigo-600">{item.product.name}</Link>
                        <p className="text-gray-600">{formatCurrency(item.product.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 border rounded-md p-1">
                        <button 
                          onClick={() => handleUpdateQuantity(item.cartitem_id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.cartitem_id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="w-24 text-right">
                        <p className="font-semibold">{formatCurrency(item.product.price * item.quantity)}</p>
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(item.cartitem_id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-md"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ) : (
                    <div key={item.cartitem_id} className="text-red-500 border-b pb-4">
                      Một sản phẩm trong giỏ hàng không còn tồn tại.
                      <button onClick={() => handleRemoveItem(item.cartitem_id)} className="ml-4 text-xs underline">Xóa</button>
                    </div>
                  )
                ))}
              </div>
            </div>
            
            {/* 4. Cột phải: Tổng kết (Giống <aside>) */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-sm sticky top-8">
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
      
      {/* Bạn có thể thêm ShopFooter (nếu có) ở đây */}
    </div>
  );
}