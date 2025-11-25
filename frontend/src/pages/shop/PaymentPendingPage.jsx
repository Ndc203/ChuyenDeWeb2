import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import ShopHeader from '../../components/shop/ShopHeader';

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function PaymentPendingPage() {
  const { orderId } = useParams(); // Lấy ID từ URL
  const location = useLocation();
  const navigate = useNavigate();
  const { finalTotal } = location.state || {}; // Lấy số tiền từ trang trước

  // --- CẤU HÌNH NGÂN HÀNG (Sửa lại cho đúng của bạn) ---
  const MY_BANK = {
    BANK_ID: "BIDV", 
    ACCOUNT_NO: "3142955963", 
    ACCOUNT_NAME: "CHU THANH LONG", 
    TEMPLATE: "compact" 
  };

  // 15 phút = 900 giây
  const [timeLeft, setTimeLeft] = useState(900); 
  const [isExpired, setIsExpired] = useState(false);

  // Link QR động
  const qrUrl = `https://img.vietqr.io/image/${MY_BANK.BANK_ID}-${MY_BANK.ACCOUNT_NO}-${MY_BANK.TEMPLATE}.png?amount=${finalTotal}&addInfo=THANHTOAN DONHANG ${orderId}&accountName=${encodeURIComponent(MY_BANK.ACCOUNT_NAME)}`;

  // 1. LOGIC ĐẾM NGƯỢC
  useEffect(() => {
    if (timeLeft <= 0) {
        setIsExpired(true);
        return;
    }
    const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  // 2. LOGIC POLLING (Hỏi thăm trạng thái mỗi 3 giây)
  useEffect(() => {
    if (isExpired) return;

    const checkStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/orders/${orderId}/status`);
        const status = res.data.status;

        // Nếu trạng thái đã thay đổi (Đã thanh toán)
        if (status === 'Đang xử lý' || status === 'Đang giao' || status === 'Hoàn thành') {
            // CHUYỂN HƯỚNG SANG TRANG THÀNH CÔNG NGAY LẬP TỨC
            navigate(`/order-success/${orderId}`, { 
                state: { orderId, finalTotal, paymentMethod: 'banking' } 
            });
        }
      } catch (err) {
        console.error("Lỗi kiểm tra trạng thái:", err);
      }
    };

    const intervalId = setInterval(checkStatus, 3000); // 3 giây hỏi 1 lần
    return () => clearInterval(intervalId);
  }, [orderId, isExpired, navigate, finalTotal]);

  // Helper format thời gian mm:ss
  const formatTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader />
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-t-4 border-blue-600">
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán đơn hàng #{orderId}</h1>
          
          {isExpired ? (
            <div className="mt-8 text-red-500">
                <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Mã thanh toán đã hết hạn!</h3>
                <p className="text-gray-600 mt-2">Vui lòng đặt lại đơn hàng mới.</p>
                <button onClick={() => navigate('/')} className="mt-6 bg-gray-800 text-white px-6 py-2 rounded-lg">Về trang chủ</button>
            </div>
          ) : (
            <>
                <p className="text-gray-500 mb-6">Vui lòng quét mã QR để thanh toán</p>
                
                <div className="bg-blue-50 p-4 rounded-xl inline-block mb-6 border border-blue-100">
                    <img src={qrUrl} alt="VietQR" className="w-64 h-auto mx-auto" />
                </div>

                <div className="flex items-center justify-center gap-2 text-lg font-bold text-orange-600 bg-orange-50 py-3 px-6 rounded-full w-fit mx-auto mb-6 border border-orange-100">
                    <Clock size={24} />
                    <span>Thanh toán trong: {formatTime(timeLeft)}</span>
                </div>

                <div className="text-left bg-gray-50 p-4 rounded-lg text-sm space-y-3 border border-gray-200">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Số tiền:</span>
                        <span className="font-bold text-blue-600 text-lg">{formatCurrency(finalTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Nội dung:</span>
                        <span className="font-bold text-red-500 bg-yellow-100 px-2 rounded">THANHTOAN DONHANG {orderId}</span>
                    </div>
                    <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-200 mt-2">
                        * Hệ thống sẽ tự động chuyển trang khi nhận được tiền.
                    </div>
                </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}