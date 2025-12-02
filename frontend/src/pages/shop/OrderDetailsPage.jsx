import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin, Phone, CreditCard, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import ShopHeader from '../../components/shop/ShopHeader';

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const formatDate = (dateString) => new Date(dateString).toLocaleString('vi-VN');

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const token = localStorage.getItem('authToken');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_URL}/api/orders/${id}`);
        setOrder(response.data);
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center">Loading...</div>;
  if (!order) return <div className="min-h-screen bg-gray-50 text-center pt-20">Không tìm thấy đơn hàng.</div>;

  const isUnpaid = order.status === 'Chờ thanh toán' && order.payment_method === 'banking';

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/orders')} className="flex items-center text-gray-500 hover:text-indigo-600 mb-6">
            <ArrowLeft size={18} className="mr-1" /> Quay lại danh sách
        </button>

        {/* Header Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-l-4 border-indigo-500 flex justify-between items-center">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Đơn hàng #{order.order_id}</h1>
                <p className="text-sm text-gray-500">Đặt ngày: {formatDate(order.created_at)}</p>
            </div>
            <div className="text-right">
                <span className="block text-sm text-gray-500 mb-1">Trạng thái</span>
                <span className="text-lg font-bold text-indigo-600">{order.status}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cột Trái: Thông tin */}
            <div className="md:col-span-2 space-y-6">
                
                {/* Danh sách sản phẩm */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package size={20}/> Sản phẩm</h2>
                    <div className="divide-y divide-gray-100">
                        {order.items.map(item => (
                            <div key={item.order_item_id} className="py-4 flex gap-4">
                                <img 
                                    src={item.product?.image ? `${API_URL.replace('/api','')}/image/${item.product.image}` : 'https://placehold.co/100'} 
                                    alt={item.product_name} 
                                    className="w-20 h-20 object-cover rounded-lg border"
                                />
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                                    <p className="text-sm text-gray-500">x {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{formatCurrency(item.unit_price * item.quantity)}</p>
                                    <p className="text-xs text-gray-400">{formatCurrency(item.unit_price)}/cái</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Thanh toán (Nếu chưa trả tiền) */}
                {isUnpaid && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 flex justify-between items-center">
                        <div className="flex gap-3 items-center text-orange-800">
                            <AlertCircle />
                            <div>
                                <p className="font-bold">Đơn hàng chưa được thanh toán</p>
                                <p className="text-sm">Vui lòng thanh toán để chúng tôi xử lý đơn hàng.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate(`/payment-pending/${order.order_id}`, { 
                                state: { orderId: order.order_id, finalTotal: order.final_amount } 
                            })}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 shadow-sm"
                        >
                            Thanh toán ngay
                        </button>
                    </div>
                )}

            </div>

            {/* Cột Phải: Info */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Địa chỉ nhận hàng</h2>
                    <div className="flex gap-3">
                        <MapPin className="text-indigo-500 shrink-0" size={20} />
                        <div>
                            <p className="font-bold text-gray-900">{order.customer_name}</p>
                            <p className="text-sm text-gray-600">{order.customer_phone}</p>
                            <p className="text-sm text-gray-600 mt-1">{order.shipping_address}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Thanh toán</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Tạm tính</span>
                            <span>{formatCurrency(order.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                            <span>Giảm giá</span>
                            <span>-{formatCurrency(order.discount_amount)}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-100 flex justify-between items-end">
                            <span className="font-bold text-gray-900">Tổng cộng</span>
                            <span className="font-bold text-xl text-indigo-600">{formatCurrency(order.final_amount)}</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 items-center text-sm text-gray-600">
                        <CreditCard size={16} /> 
                        Phương thức: <span className="font-medium text-gray-900 capitalize">{order.payment_method === 'cod' ? 'Tiền mặt (COD)' : 'Chuyển khoản'}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}