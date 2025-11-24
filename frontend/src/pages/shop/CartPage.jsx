import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, Tag } from 'lucide-react';
import ShopHeader from '../../components/shop/ShopHeader';

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const BASE_URL = API_URL.replace('/api', ''); // Để xử lý ảnh

// Helper format tiền
const formatCurrency = (value) => {
  if (isNaN(value)) value = 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

// Helper xử lý ảnh (tránh lỗi 404)
const getImageUrl = (imageName) => {
  if (!imageName) return 'https://placehold.co/100x100?text=No+Image';
  if (imageName.startsWith('http')) return imageName;
  return `${BASE_URL}/images/products/${imageName}`;
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // State lưu các ID được chọn
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState(''); // State lưu mã nhập vào
  const [appliedCoupon, setAppliedCoupon] = useState(null); // State lưu mã đã áp dụng thành công { code, discount }
  const [couponMessage, setCouponMessage] = useState(''); // Thông báo lỗi/thành công

  // 1. Tải giỏ hàng
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

  // 2. Xử lý Checkbox

  // Chọn một sản phẩm
  const handleSelectItem = (cartItemId) => {
    setSelectedItems(prev => {
      if (prev.includes(cartItemId)) {
        return prev.filter(id => id !== cartItemId); // Bỏ chọn
      } else {
        return [...prev, cartItemId]; // Chọn
      }
    });
  };

  // Chọn tất cả
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Lấy tất cả ID của sản phẩm hợp lệ
      const allIds = cartItems
        .filter(item => item.product) // Chỉ chọn sản phẩm còn tồn tại
        .map(item => item.cartitem_id);
      setSelectedItems(allIds);
    } else {
      setSelectedItems([]);
    }
  };

  // 3. Xử lý Cập nhật & Xóa (Giữ nguyên logic cũ)
  const handleRemoveItem = async (cartItemId) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await axios.delete(`${API_URL}/api/cart/items/${cartItemId}`);
      setCartItems(prev => prev.filter(item => item.cartitem_id !== cartItemId));
      setSelectedItems(prev => prev.filter(id => id !== cartItemId)); // Xóa khỏi danh sách chọn luôn
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (err) {
      alert('Lỗi xóa sản phẩm.');
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const response = await axios.put(`${API_URL}/api/cart/items/${cartItemId}`, {
        quantity: newQuantity
      });
      setCartItems(prev => prev.map(item => item.cartitem_id === cartItemId ? response.data : item));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (err) { /* Im lặng hoặc alert */ }
  };

  // 4. Tính toán (Chỉ tính những cái ĐƯỢC CHỌN)
  const selectedSubtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      // Chỉ cộng nếu item nằm trong danh sách selectedItems VÀ sản phẩm tồn tại
      if (selectedItems.includes(item.cartitem_id) && item.product) {
        return total + (item.product.price * item.quantity);
      }
      return total;
    }, 0);
  }, [cartItems, selectedItems]);

  // 5. Xử lý Áp dụng Mã Giảm Giá
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    // Reset trước khi check
    setCouponMessage('');
    setAppliedCoupon(null);

    try {
      const response = await axios.post(`${API_URL}/api/coupons/apply`, {
        code: couponCode,
        order_total: selectedSubtotal // Gửi tổng tiền của CÁC MÓN ĐÃ CHỌN
      });

      // Thành công
      setAppliedCoupon({
        code: response.data.coupon_code,
        discount: parseFloat(response.data.discount_amount),
        id: response.data.coupon_id
      });
      setCouponMessage({ type: 'success', text: response.data.message });

    } catch (err) {
      // Thất bại
      setAppliedCoupon(null);
      setCouponMessage({
        type: 'error',
        text: err.response?.data?.message || 'Mã không hợp lệ'
      });
    }
  };

  // --- CẬP NHẬT LẠI LOGIC TỔNG TIỀN ---
  // Tổng tiền cuối cùng = (Tổng món chọn) - (Giảm giá)
  const finalTotal = useMemo(() => {
    let total = selectedSubtotal;
    if (appliedCoupon) {
      total -= appliedCoupon.discount;
    }
    return Math.max(0, total);
  }, [selectedSubtotal, appliedCoupon]);

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
      return;
    }

    // Lọc ra các item object dựa trên ID đã chọn
    const itemsToCheckout = cartItems.filter(item => selectedItems.includes(item.cartitem_id));

    // Chuyển sang trang checkout và gửi kèm dữ liệu
    navigate('/checkout', {
      state: {
        items: itemsToCheckout,
        subtotal: selectedSubtotal,
        discount: appliedCoupon ? appliedCoupon.discount : 0,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        finalTotal: finalTotal
      }
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader />
      <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <ShopHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Giỏ hàng</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Giỏ hàng của bạn còn trống</p>
            <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">Mua ngay</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* BẢNG SẢN PHẨM (GIAO DIỆN SHOPEE STYLE) */}
            <div className="flex-1">
              {/* Header Bảng */}
              <div className="bg-white p-4 rounded-t-lg shadow-sm mb-3 grid grid-cols-12 gap-4 items-center text-sm text-gray-500 font-medium">
                <div className="col-span-1 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={cartItems.length > 0 && selectedItems.length === cartItems.filter(i => i.product).length}
                  />
                </div>
                <div className="col-span-5">Sản phẩm</div>
                <div className="col-span-2 text-center">Đơn giá</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-1 text-center">Số tiền</div>
                <div className="col-span-1 text-center">Thao tác</div>
              </div>

              {/* Danh sách Item */}
              <div className="space-y-3">
                {cartItems.map(item => (
                  item.product ? (
                    <div key={item.cartitem_id} className="bg-white p-4 rounded-sm shadow-sm grid grid-cols-12 gap-4 items-center border border-gray-100 hover:border-blue-200 transition">

                      {/* Checkbox */}
                      <div className="col-span-1 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer"
                          checked={selectedItems.includes(item.cartitem_id)}
                          onChange={() => handleSelectItem(item.cartitem_id)}
                        />
                      </div>

                      {/* Ảnh & Tên */}
                      <div className="col-span-5 flex gap-3 items-center">
                        <Link to={`/product/${item.product.slug || item.product.product_id}`}>
                          <img
                            src={getImageUrl(item.product.image)}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded border border-gray-200"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link to={`/product/${item.product.slug || item.product.product_id}`} className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-blue-600">
                            {item.product.name}
                          </Link>
                          {/* Nếu có phân loại hàng thì hiện ở đây */}
                        </div>
                      </div>

                      {/* Đơn giá */}
                      <div className="col-span-2 text-center text-gray-600 text-sm">
                        {formatCurrency(item.product.price)}
                      </div>

                      {/* Số lượng */}
                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            onClick={() => handleUpdateQuantity(item.cartitem_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-2 py-1 hover:bg-gray-100 border-r border-gray-300 disabled:opacity-50"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="text"
                            readOnly
                            value={item.quantity}
                            className="w-10 text-center text-sm font-medium focus:outline-none"
                          />
                          <button
                            onClick={() => handleUpdateQuantity(item.cartitem_id, item.quantity + 1)}
                            className="px-2 py-1 hover:bg-gray-100 border-l border-gray-300"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Thành tiền */}
                      <div className="col-span-1 text-center text-blue-600 font-bold text-sm">
                        {formatCurrency(item.product.price * item.quantity)}
                      </div>

                      {/* Xóa */}
                      <div className="col-span-1 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.cartitem_id)}
                          className="text-gray-400 hover:text-red-500 transition"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div key={item.cartitem_id} className="bg-white p-4 rounded text-red-500 flex justify-between items-center">
                      <span>Sản phẩm không còn tồn tại.</span>
                      <button onClick={() => handleRemoveItem(item.cartitem_id)} className="underline text-sm">Xóa bỏ</button>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* THANH THANH TOÁN (STICKY BOTTOM GIỐNG SHOPEE HOẶC CỘT PHẢI) */}
            <div className="lg:w-80 shrink-0">
              <div className="bg-white p-5 rounded-lg shadow-sm sticky top-24 border border-gray-100">
                {/* Áp dụng Mã Giảm Giá */}
                <div className="mb-6 border-b border-gray-100 pb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Tag size={16} className="text-indigo-600" /> Mã giảm giá
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 uppercase"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || selectedSubtotal === 0}
                      className="bg-indigo-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {/* Thông báo lỗi/thành công */}
                  {couponMessage && (
                    <p className={`text-xs mt-2 ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                      {couponMessage.text}
                    </p>
                  )}
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 text-sm">Đã chọn:</span>
                  <span className="font-bold text-gray-800">{selectedItems.length} sản phẩm</span>
                </div>

                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(selectedSubtotal)}</span>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-600">Giảm giá:</span>
                  <span className="font-medium text-green-600">-{formatCurrency(appliedCoupon ? appliedCoupon.discount : 0)}</span>
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-gray-800">Tổng cộng:</span>
                    <div className="text-right">
                      <span className="block text-2xl font-bold text-blue-600">
                        {formatCurrency(finalTotal)}
                      </span>
                      <span className="text-xs text-gray-500">(Đã bao gồm VAT)</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition shadow-lg ${selectedItems.length > 0
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                      : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  disabled={selectedItems.length === 0}
                >
                  Mua Hàng ({selectedItems.length})
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}