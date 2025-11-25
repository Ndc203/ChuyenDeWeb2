import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Phone, User, CreditCard, Truck, CheckCircle } from 'lucide-react';
import ShopHeader from '../../components/shop/ShopHeader';

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy dữ liệu từ trang Giỏ hàng gửi sang
    const { items, subtotal, discount, couponCode, finalTotal } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        shipping_address: '',
        payment_method: 'cod', // Mặc định thanh toán khi nhận hàng
        note: ''
    });

    // Kiểm tra nếu không có dữ liệu (truy cập trực tiếp link) -> Đá về giỏ hàng
    useEffect(() => {
        if (!items || items.length === 0) {
            navigate('/cart');
        }

        // Điền sẵn thông tin từ LocalStorage (nếu có)
        const savedUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
        // Nếu userInfo có profile lồng bên trong
        const profile = savedUser.profile || {};

        setFormData(prev => ({
            ...prev,
            customer_name: profile.full_name || savedUser.username || '',
            customer_phone: profile.phone || '',
            shipping_address: profile.address || ''
        }));
    }, [items, navigate]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmitOrder = async () => {
        if (!formData.customer_name || !formData.customer_phone || !formData.shipping_address) {
            alert("Vui lòng điền đầy đủ thông tin giao hàng!");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const payload = {
                ...formData,
                items: items, // Danh sách sản phẩm
                total_amount: subtotal,
                discount_amount: discount,
                final_amount: finalTotal,
                coupon_code: couponCode
            };

            const response = await axios.post(`${API_URL}/api/orders`, payload);

            const orderId = response.data.order_id;

            // Xử lý điều hướng dựa trên phương thức thanh toán
            if (formData.payment_method === 'banking') {
                // Nếu là Chuyển khoản -> Sang trang QR đếm ngược
                navigate(`/payment-pending/${orderId}`, {
                    state: { orderId, finalTotal }
                });
            } else {
                // Nếu là COD -> Sang trang Thành công luôn
                navigate(`/order-success/${orderId}`, {
                    state: { orderId, finalTotal, paymentMethod: 'cod' }
                });
            }

            window.dispatchEvent(new CustomEvent('cartUpdated'));

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Đặt hàng thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    if (!items) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <ShopHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Thanh toán</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. Địa chỉ nhận hàng */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <MapPin className="text-blue-600" size={20} /> Địa chỉ nhận hàng
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input
                                            type="text" name="customer_name"
                                            value={formData.customer_name} onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input
                                            type="text" name="customer_phone"
                                            value={formData.customer_phone} onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="0909..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết</label>
                                <textarea
                                    name="shipping_address" rows="2"
                                    value={formData.shipping_address} onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                                ></textarea>
                            </div>
                        </div>

                        {/* 2. Phương thức thanh toán */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <CreditCard className="text-blue-600" size={20} /> Phương thức thanh toán
                            </h2>

                            <div className="space-y-3">

                                {/* OPTION 1: COD (Tiền mặt) */}
                                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${formData.payment_method === 'cod' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}>
                                    <input
                                        type="radio" name="payment_method" value="cod"
                                        checked={formData.payment_method === 'cod'}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-blue-600"
                                    />
                                    {/* Icon/Logo */}
                                    <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-100 shadow-sm">
                                        <Truck className="text-green-600" size={20} />
                                    </div>

                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">Thanh toán khi nhận hàng (COD)</p>
                                        <p className="text-xs text-gray-500">Được kiểm tra hàng trước khi thanh toán</p>
                                    </div>
                                </label>

                                {/* OPTION 2: BANKING (VietQR + Logo Ngân hàng) */}
                                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${formData.payment_method === 'banking' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}>
                                    <input
                                        type="radio" name="payment_method" value="banking"
                                        checked={formData.payment_method === 'banking'}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-blue-600"
                                    />

                                    {/* Logo VietQR & Bank */}
                                    <div className="flex -space-x-2 overflow-hidden">
                                        <img src="https://img.vietqr.io/image/MB-0987654321-compact.png" alt="VietQR" className="w-10 h-10 rounded-full border-2 border-white object-cover bg-white" />
                                        {/* <img src="https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_BIDV.svg" alt="BIDV Logo" width="200" /> */}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900">Chuyển khoản ngân hàng</p>
                                            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">KHUYÊN DÙNG</span>
                                        </div>
                                        <p className="text-xs text-gray-500">Hỗ trợ tất cả ngân hàng (VietQR) - Xác nhận tức thì</p>
                                    </div>
                                </label>

                                {/* OPTION 3: MOMO (Ví dụ thêm cho đẹp) */}
                                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${formData.payment_method === 'momo' ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-500' : 'border-gray-200 hover:border-pink-300'}`}>
                                    <input
                                        type="radio" name="payment_method" value="momo"
                                        checked={formData.payment_method === 'momo'}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-pink-600 accent-pink-600"
                                    />

                                    {/* Logo MoMo */}
                                    <div className="w-10 h-10 bg-white rounded-full border border-gray-100 shadow-sm overflow-hidden p-1">
                                        <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" className="w-full h-full object-contain" />
                                    </div>

                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">Ví MoMo</p>
                                        <p className="text-xs text-gray-500">Quét mã QR MoMo siêu tốc</p>
                                    </div>
                                </label>

                            </div>
                        </div>

                    </div>

                    {/* CỘT PHẢI: TỔNG KẾT ĐƠN HÀNG */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
                            <h2 className="text-lg font-semibold mb-4">Đơn hàng ({items.length} sản phẩm)</h2>

                            {/* List sản phẩm rút gọn */}
                            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                                {items.map((item) => (
                                    <div key={item.cartitem_id} className="flex justify-between text-sm">
                                        <div className="flex gap-2">
                                            <span className="font-medium text-gray-500">{item.quantity}x</span>
                                            <span className="text-gray-800 line-clamp-1 w-40">{item.product.name}</span>
                                        </div>
                                        <span className="text-gray-600 font-medium">
                                            {formatCurrency(item.product.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-2">
                                <div className="flex justify-between text-gray-600">
                                    <span>Tạm tính</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>Giảm giá {couponCode ? `(${couponCode})` : ''}</span>
                                    <span>-{formatCurrency(discount)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Phí vận chuyển</span>
                                    <span>Miễn phí</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mt-4 mb-6">
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-gray-800 text-lg">Tổng cộng</span>
                                    <span className="font-bold text-blue-600 text-2xl">{formatCurrency(finalTotal)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmitOrder}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center gap-2"
                            >
                                {loading ? 'Đang xử lý...' : (
                                    <>Đặt hàng <CheckCircle size={20} /></>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}