import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, ChevronRight, Calendar, DollarSign, Eye } from 'lucide-react';
import ShopHeader from '../../components/shop/ShopHeader';

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // API này giờ đã tự lọc theo user (như bước 1)
        const response = await axios.get(`${API_URL}/api/orders`);
        setOrders(response.data.data); // Laravel paginate trả về object có key 'data'
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [navigate]);

  // Helper màu trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case 'Hoàn thành': return 'bg-green-100 text-green-700 border-green-200';
      case 'Đang xử lý': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Đang giao': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Đã hủy': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Chờ thanh toán
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Package className="text-indigo-600" /> Lịch sử đơn hàng
        </h1>

        {loading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" alt="Empty" className="w-24 h-24 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500">Bạn chưa có đơn hàng nào.</p>
            <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline font-medium">Mua sắm ngay</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.order_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Header Card */}
                <div className="bg-gray-50 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-gray-100">
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="block text-gray-500 text-xs uppercase tracking-wide">Mã đơn hàng</span>
                      <span className="font-bold text-gray-900">#{order.order_id}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs uppercase tracking-wide">Ngày đặt</span>
                      <span className="font-medium text-gray-700 flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(order.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs uppercase tracking-wide">Tổng tiền</span>
                      <span className="font-bold text-indigo-600">{formatCurrency(order.final_amount)}</span>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Body Card (Danh sách món tóm tắt) */}
                <div className="p-6 flex items-center justify-between">
                  <div className="flex-1">
                    {/* Hiển thị 1-2 sản phẩm đầu tiên */}
                    {order.items && order.items.slice(0, 2).map((item) => (
                        <div key={item.order_item_id} className="flex items-center gap-3 mb-2 last:mb-0">
                            <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                                {/* Giả sử product có image, nếu không dùng placeholder */}
                                <img src={item.product?.image ? `${API_URL.replace('/api','')}/image/${item.product.image}` : 'https://placehold.co/100'} className="w-full h-full object-cover"/>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product_name}</p>
                                <p className="text-xs text-gray-500">x{item.quantity}</p>
                            </div>
                        </div>
                    ))}
                    {order.item_count > 2 && (
                        <p className="text-xs text-gray-500 mt-2 italic">+ và {order.item_count - 2} sản phẩm khác</p>
                    )}
                  </div>

                  <div className="ml-4">
                    <Link 
                        to={`/orders/${order.order_id}`}
                        className="flex items-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                    >
                        Xem chi tiết <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}