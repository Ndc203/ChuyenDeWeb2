import React, { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, Package, Truck, CreditCard } from 'lucide-react';
import ShopHeader from '../../components/shop/ShopHeader';
//import Confetti from 'react-confetti';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy dữ liệu được gửi từ trang Checkout hoặc PaymentPending
  const { orderId, finalTotal, paymentMethod } = location.state || {};

  // Bảo vệ: Nếu ko có orderId (khách tự gõ link), đá về trang chủ
  useEffect(() => {
    if (!orderId) {
      navigate('/');
    }
  }, [orderId, navigate]);

  if (!orderId) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader />
      
      {/* Hiệu ứng pháo giấy (Nếu bạn cài npm install react-confetti) */}
      {/* <Confetti recycle={false} numberOfPieces={500} /> */}

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 text-center border border-gray-100">
          
          {/* Icon Thành công lớn */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Đặt hàng thành công!</h1>
          <p className="text-gray-500 text-lg mb-8">
            Cảm ơn bạn đã mua sắm tại TechStore. <br/>
            Đơn hàng của bạn đang được xử lý.
          </p>

          {/* Card Thông tin đơn hàng */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 max-w-lg mx-auto text-left border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
                <span className="text-gray-500">Mã đơn hàng:</span>
                <span className="font-bold text-lg text-indigo-600">#{orderId}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
                <span className="text-gray-500">Phương thức thanh toán:</span>
                <span className="font-medium flex items-center gap-2 text-gray-800">
                    {paymentMethod === 'cod' ? <Truck size={18} /> : <CreditCard size={18} />}
                    {paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}
                </span>
            </div>

            <div className="flex justify-between items-center">
                <span className="text-gray-500">Tổng thanh toán:</span>
                <span className="font-bold text-xl text-gray-900">{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          {/* Lời nhắc nhở dựa trên phương thức thanh toán */}
          {paymentMethod === 'cod' ? (
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-8 text-sm max-w-lg mx-auto">
                💡 <strong>Lưu ý:</strong> Vui lòng chú ý điện thoại. Shipper sẽ liên hệ với bạn sớm để giao hàng và thu tiền.
            </div>
          ) : (
            <div className="bg-green-50 text-green-800 p-4 rounded-xl mb-8 text-sm max-w-lg mx-auto">
                ✅ <strong>Đã ghi nhận thanh toán:</strong> Hệ thống đã nhận được tiền chuyển khoản của bạn. Chúng tôi sẽ tiến hành đóng gói ngay lập tức.
            </div>
          )}

          {/* Nút điều hướng */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
                to="/" 
                className="px-8 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Home size={20} /> Về trang chủ
            </Link>
            
            <Link 
                to="/orders" // Giả sử bạn sẽ làm trang Lịch sử đơn hàng
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              <Package size={20} /> Quản lý đơn hàng
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}