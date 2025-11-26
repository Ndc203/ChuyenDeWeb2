import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, User, MapPin, Mail, Phone, Calendar, Printer, CheckCircle, AlertCircle } from "lucide-react";

// Lấy API URL từ biến môi trường
const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// *** QUAN TRỌNG: Phải trùng tên với key bên AdminOrdersPage ***
const TOKEN_KEY = 'authToken'; 

// --- Helper Functions ---
const formatCurrency = (value) => {
  if (isNaN(value)) return "N/A";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

const formatSimpleDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleString('vi-VN', options);
};
// --- Hết Helper Functions ---


export default function OrderDetailModal({ isOpen, onClose, orderId, onStatusChange }) {
  const [fullOrder, setFullOrder] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("");

  // useEffect để tải chi tiết đơn hàng khi modal mở
  useEffect(() => {
    // Chỉ tải nếu modal đang mở (isOpen) VÀ có orderId
    if (isOpen && orderId) {
      setIsLoading(true);
      setError(null);
      setFullOrder(null); 
      
      const token = localStorage.getItem(TOKEN_KEY);

      // Thêm headers chứa Authorization vào fetch
      fetch(`${API_URL}/api/orders/${orderId}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- SỬA QUAN TRỌNG TẠI ĐÂY
        }
      })
        .then(res => {
          if (res.status === 401) {
             throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          }
          if (!res.ok) throw new Error('Không thể tải chi tiết đơn hàng.');
          return res.json();
        })
        .then(data => {
          setFullOrder(data);
          setCurrentStatus(data.status); 
        })
        .catch(err => {
          console.error("Lỗi fetch chi tiết đơn hàng:", err);
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, orderId]); 

  const handleClose = () => {
    onClose();
  };

  const handleSaveStatus = () => {
    // Gọi hàm onStatusChange từ cha (đã bao gồm logic gọi API update)
    onStatusChange(orderId, currentStatus);
    onClose(); 
  };
  
  const handlePrint = () => {
    // Lưu ý: Nếu route in ấn cũng bảo mật, window.open có thể bị chặn.
    // Tạm thời giữ nguyên, nếu lỗi thì cần dùng axios tải blob về.
    window.open(`${API_URL}/api/orders/${orderId}/print`, '_blank');
  };
  
  // Tính toán tổng phụ
  const subtotal = fullOrder?.items?.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0) || 0;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Lớp phủ (Backdrop) */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Nội dung Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900">
                    Chi tiết Đơn hàng #{orderId}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    onClick={handleClose}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {isLoading && <p className="text-center p-10">Đang tải chi tiết...</p>}
                  {error && (
                    <div className="text-center p-10 text-red-600 flex flex-col items-center gap-2">
                       <AlertCircle size={24} /> {error}
                    </div>
                  )}
                  
                  {/* Chỉ hiển thị khi đã tải xong và có dữ liệu */}
                  {!isLoading && fullOrder && (
                    <div className="space-y-6">
                      
                      {/* 1. Thông tin chung & Trạng thái */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Cột thông tin khách hàng */}
                        <div className="md:col-span-2 space-y-4 p-4 bg-slate-50 rounded-lg border">
                          <h4 className="font-semibold text-slate-700">Thông tin Khách hàng & Vận chuyển</h4>
                          <div className="flex items-center gap-3">
                            <User size={16} className="text-slate-500 flex-shrink-0" />
                            <span>{fullOrder.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail size={16} className="text-slate-500 flex-shrink-0" />
                            <span>{fullOrder.customer_email}</span>
                          </div>
                           <div className="flex items-center gap-3">
                            <Phone size={16} className="text-slate-500 flex-shrink-0" />
                            <span>{fullOrder.customer_phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin size={16} className="text-slate-500 flex-shrink-0 mt-1" />
                            <span>{fullOrder.shipping_address || 'N/A'}</span>
                          </div>
                        </div>
                        
                        {/* Cột Trạng thái & Ngày */}
                        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                          <h4 className="font-semibold text-slate-700">Trạng thái & Thao tác</h4>
                          {/* A. Ngày Đặt Hàng */}
                           <div className="flex items-start gap-3">
                            <Calendar size={16} className="text-slate-500 flex-shrink-0 mt-1" />
                            <div>
                              <p className="font-medium text-sm">Ngày đặt hàng</p>
                              {formatSimpleDate(fullOrder.created_at)}
                            </div>
                          </div>

                          {/* B. Ngày Hoàn Thành */}
                           {fullOrder.status === 'Hoàn thành' && (
                             <div className="flex items-start gap-3">
                              <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-1" />
                              <div>
                                <p className="font-medium text-sm text-green-700">Ngày hoàn thành</p>
                                {formatSimpleDate(fullOrder.updated_at)}
                              </div>
                            </div>
                           )}

                          {/* C. Cập nhật trạng thái */}
                          <div>
                            <label htmlFor="orderStatus" className="block text-sm font-medium text-slate-700 mb-1">Cập nhật trạng thái</label>
                            <select
                              id="orderStatus"
                              value={currentStatus}
                              onChange={(e) => setCurrentStatus(e.target.value)}
                              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              disabled={fullOrder.status === 'Hoàn thành' || fullOrder.status === 'Đã hủy'} >
                              <option value="Chờ thanh toán">Chờ thanh toán</option>
                              <option value="Đang xử lý">Đang xử lý</option>
                              <option value="Đang giao">Đang giao</option>
                              <option value="Hoàn thành">Hoàn thành</option>
                              <option value="Đã hủy">Đã hủy</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* 2. Chi tiết sản phẩm */}
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Sản phẩm trong đơn hàng</h4>
                        <div className="overflow-x-auto border rounded-lg">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                              <tr className="text-left text-slate-600">
                                <th className="px-4 py-2 font-medium">Sản phẩm</th>
                                <th className="px-4 py-2 font-medium text-center">Số lượng</th>
                                <th className="px-4 py-2 font-medium text-right">Đơn giá</th>
                                <th className="px-4 py-2 font-medium text-right">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {fullOrder.items && fullOrder.items.map(item => (
                                <tr key={item.order_item_id}>
                                  <td className="px-4 py-3 font-medium text-slate-800">{item.product_name}</td>
                                  <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                                  <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(item.unit_price * item.quantity)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* 3. Tổng kết tài chính */}
                      <div className="flex justify-end">
                        <div className="w-full max-w-sm space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Tổng phụ (sản phẩm):</span>
                            <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Giảm giá ({fullOrder.coupon_code || 'Không'}):</span>
                            <span className="font-medium text-red-600">- {formatCurrency(fullOrder.discount_amount)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t text-base">
                            <span className="font-bold text-slate-900">Tổng cộng:</span>
                            <span className="font-bold text-slate-900">{formatCurrency(fullOrder.final_amount)}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Footer (Actions) */}
                <div className="flex items-center justify-between p-5 border-t border-slate-200 bg-slate-50">
                   <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border bg-white text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50 shadow-sm"
                    onClick={handlePrint}
                    disabled={!fullOrder}
                  >
                    <Printer size={16} /> In đơn
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="rounded-lg border border-transparent bg-slate-100 text-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-200"
                      onClick={handleClose}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                      onClick={handleSaveStatus}
                      disabled={!fullOrder || isLoading || currentStatus === fullOrder.status || fullOrder.status === 'Hoàn thành' || fullOrder.status === 'Đã hủy'}
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}