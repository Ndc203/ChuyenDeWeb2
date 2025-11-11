// src/components/AddCouponModal.jsx

import React, { useState } from 'react';
import { X } from 'lucide-react';

// Lấy API_URL từ biến môi trường (giống file kia)
const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// Component này nhận 3 props từ AdminCouponsPage
export default function AddCouponModal({ isOpen, onClose, onSuccess }) {
  // State cho các trường trong form
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('percentage'); // 'percentage' hoặc 'fixed_amount'
  const [value, setValue] = useState(0);
  const [maxValue, setMaxValue] = useState(null); // 'max_value' (chỉ cho %)
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [maxUsage, setMaxUsage] = useState(100);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(null);

  // Nếu không 'isOpen', không render gì cả
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn form submit
    setIsLoading(true);
    setErrors(null);

    // Chuẩn bị dữ liệu gửi đi
    const couponData = {
      code: code.toUpperCase(), // Viết hoa mã
      description,
      type,
      value,
      max_value: type === 'percentage' ? maxValue : null,
      min_order_value: minOrderValue,
      max_usage: maxUsage,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    };

    try {
      const response = await fetch(`${API_URL}/api/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Nếu cần auth, thêm 'Authorization': 'Bearer ...'
        },
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        // Nếu server trả về lỗi (vd: 422 - validation)
        const errorData = await response.json();
        setErrors(errorData.errors || { general: ['Đã có lỗi xảy ra.'] });
        throw new Error('Lỗi khi thêm mã');
      }

      // Nếu thành công
      onSuccess(); // Báo cho trang cha biết để refresh
      handleClose(); // Tự đóng modal

    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm reset form và đóng modal
  const handleClose = () => {
    setCode('');
    setDescription('');
    // ... reset các state khác nếu muốn ...
    setErrors(null);
    onClose(); // Gọi hàm onClose từ prop
  };

  return (
    // Lớp "phủ" (overlay)
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      
      {/* Khung nội dung Modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Thêm mã giảm giá mới</h2>
          <button 
            onClick={handleClose} 
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form - Cho phép cuộn nếu nội dung dài */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Mã giảm giá & Mô tả */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Mã giảm giá" value={code} onChange={e => setCode(e.target.value)} required />
            <FormInput label="Mô tả" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          {/* Loại & Giá trị */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelect label="Loại" value={type} onChange={e => setType(e.target.value)}>
              <option value="percentage">Phần trăm</option>
              <option value="fixed_amount">Số tiền</option>
            </FormSelect>
            <FormInput label="Giá trị" type="number" value={value} onChange={e => setValue(e.target.value)} required />
            {type === 'percentage' && (
              <FormInput label="Giảm tối đa (VNĐ)" type="number" value={maxValue} onChange={e => setMaxValue(e.target.value)} placeholder="Bỏ trống nếu không giới hạn" />
            )}
          </div>

          {/* Điều kiện */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Đơn tối thiểu (VNĐ)" type="number" value={minOrderValue} onChange={e => setMinOrderValue(e.target.value)} />
            <FormInput label="Tổng lượt sử dụng" type="number" value={maxUsage} onChange={e => setMaxUsage(e.target.value)} required />
          </div>

          {/* Thời gian */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Ngày bắt đầu" type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            <FormInput label="Ngày kết thúc" type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} required />
          </div>
          
          {/* Hiển thị Lỗi (nếu có) */}
          {errors && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {Object.values(errors).map(errArray => errArray.map((err, idx) => (
                <p key={idx}>- {err}</p>
              )))}
            </div>
          )}
        </form>

        {/* Footer (Nút bấm) */}
        <div className="p-5 border-t flex justify-end gap-3">
          <button 
            type="button" 
            onClick={handleClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
          >
            Hủy
          </button>
          <button 
            type="submit" 
            onClick={handleSubmit} // Thêm onClick ở đây để submit form
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Đang lưu...' : 'Lưu lại'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Component phụ cho Form (để code gọn gàng)
function FormInput({ label, type = 'text', value, onChange, ...props }) {
  return (
    <label className="block w-full">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input 
        type={type} 
        value={value} 
        onChange={onChange}
        className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        {...props} 
      />
    </label>
  );
}

function FormSelect({ label, value, onChange, children }) {
  return (
    <label className="block w-full">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <select 
        value={value} 
        onChange={onChange}
        className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        {children}
      </select>
    </label>
  );
}