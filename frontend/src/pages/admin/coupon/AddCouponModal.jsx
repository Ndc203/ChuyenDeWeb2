import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import axiosClient from '../../../api/axiosClient'; // Import Client đã cấu hình

// Component này nhận 3 props từ AdminCouponsPage
export default function AddCouponModal({ isOpen, onClose, onSuccess }) {
  // State cho các trường trong form
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('percentage'); // 'percentage' hoặc 'fixed_amount'
  const [value, setValue] = useState(0);
  const [maxValue, setMaxValue] = useState(''); // Để chuỗi rỗng để dễ xử lý input
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [maxUsage, setMaxUsage] = useState(100);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Nếu không 'isOpen', không render gì cả
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn form reload
    setIsLoading(true);
    setErrors({}); // Reset lỗi

    // Chuẩn bị dữ liệu gửi đi
    const couponData = {
      code: code.toUpperCase(), // Viết hoa mã
      description,
      type,
      value: Number(value),
      // Nếu là % và có nhập max value thì lấy số, ngược lại gửi null
      max_value: type === 'percentage' && maxValue ? Number(maxValue) : null,
      min_order_value: Number(minOrderValue),
      max_usage: Number(maxUsage),
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    };

    try {
      // --- SỬA ĐỔI: Dùng axiosClient ---
      // Không cần header Token hay Content-Type, axiosClient tự lo
      await axiosClient.post('/coupons', couponData);

      // Nếu chạy đến đây tức là thành công (không có lỗi ném ra)
      onSuccess(); // Báo trang cha refresh
      handleClose(); // Đóng modal

    } catch (error) {
      console.error("Lỗi thêm coupon:", error);
      
      // Xử lý lỗi từ Laravel trả về (thường là status 422)
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        // Lỗi chung chung (ví dụ 500 hoặc mất mạng)
        setErrors({ general: [error.response?.data?.message || 'Đã có lỗi xảy ra, vui lòng thử lại.'] });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm reset form và đóng modal
  const handleClose = () => {
    setCode('');
    setDescription('');
    setValue(0);
    setMaxValue('');
    setMinOrderValue(0);
    setMaxUsage(100);
    setStartDate('');
    setEndDate('');
    setErrors(null);
    onClose(); 
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
          
          {/* Hiển thị Lỗi Chung (nếu có) */}
          {errors?.general && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex gap-2 items-start">
              <AlertCircle size={16} className="mt-0.5" />
              <div>
                {errors.general.map((err, idx) => <p key={idx}>{err}</p>)}
              </div>
            </div>
          )}

          {/* Mã giảm giá & Mô tả */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput 
              label="Mã giảm giá" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              required 
              error={errors?.code} // Truyền lỗi xuống input để hiển thị
            />
            <FormInput 
              label="Mô tả" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              error={errors?.description}
            />
          </div>

          {/* Loại & Giá trị */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelect label="Loại" value={type} onChange={e => setType(e.target.value)}>
              <option value="percentage">Phần trăm</option>
              <option value="fixed_amount">Số tiền</option>
            </FormSelect>
            <FormInput 
              label="Giá trị" 
              type="number" 
              value={value} 
              onChange={e => setValue(e.target.value)} 
              required 
              error={errors?.value}
            />
            {type === 'percentage' && (
              <FormInput 
                label="Giảm tối đa (VNĐ)" 
                type="number" 
                value={maxValue} 
                onChange={e => setMaxValue(e.target.value)} 
                placeholder="Không giới hạn" 
                error={errors?.max_value}
              />
            )}
          </div>

          {/* Điều kiện */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput 
              label="Đơn tối thiểu (VNĐ)" 
              type="number" 
              value={minOrderValue} 
              onChange={e => setMinOrderValue(e.target.value)} 
              error={errors?.min_order_value}
            />
            <FormInput 
              label="Tổng lượt sử dụng" 
              type="number" 
              value={maxUsage} 
              onChange={e => setMaxUsage(e.target.value)} 
              required 
              error={errors?.max_usage}
            />
          </div>

          {/* Thời gian */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput 
              label="Ngày bắt đầu" 
              type="datetime-local" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              required 
              error={errors?.start_date}
            />
            <FormInput 
              label="Ngày kết thúc" 
              type="datetime-local" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              required 
              error={errors?.end_date}
            />
          </div>
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
            onClick={handleSubmit} 
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

// Component phụ cho Form (đã nâng cấp để hiển thị lỗi ngay dưới input)
function FormInput({ label, type = 'text', value, onChange, error, ...props }) {
  return (
    <label className="block w-full">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input 
        type={type} 
        value={value} 
        onChange={onChange}
        className={`mt-1 block w-full rounded-lg border shadow-sm focus:ring-indigo-500 sm:text-sm 
          ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
        {...props} 
      />
      {/* Hiển thị lỗi validation ngay dưới input */}
      {error && <span className="text-xs text-red-500 mt-1 block">{error[0]}</span>}
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