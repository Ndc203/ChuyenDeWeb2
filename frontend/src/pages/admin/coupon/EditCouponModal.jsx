import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import axiosClient from '../../../api/axiosClient'; // Import Client

// Hàm helper để convert ngày từ Backend (YYYY-MM-DD HH:mm:ss) sang Input (YYYY-MM-DDTHH:mm)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  // Cách đơn giản nhất: Nếu dateString dạng "2023-11-25 14:30:00" -> thay khoảng trắng bằng T
  if (dateString.includes(' ')) {
      return dateString.replace(' ', 'T').slice(0, 16);
  }
  // Nếu là dạng ISO chuẩn
  return dateString.slice(0, 16);
};

export default function EditCouponModal({ isOpen, onClose, onSuccess, coupon }) {
  // State cho các trường
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState(0);
  const [maxValue, setMaxValue] = useState(''); 
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [maxUsage, setMaxUsage] = useState(100);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // === 1. Đổ dữ liệu vào form khi mở modal ===
  useEffect(() => {
    if (coupon && isOpen) {
      setCode(coupon.code || '');
      setDescription(coupon.description || '');
      setType(coupon.type || 'percentage');
      setValue(coupon.value || 0);
      // Nếu null thì để rỗng, nếu có số thì lấy số
      setMaxValue(coupon.max_value !== null ? coupon.max_value : ''); 
      setMinOrderValue(coupon.min_order_value || 0);
      setMaxUsage(coupon.max_usage || 100);
      
      // Format ngày
      setStartDate(formatDateForInput(coupon.start_date));
      setEndDate(formatDateForInput(coupon.end_date));
      
      // Reset lỗi cũ
      setErrors(null);
    }
  }, [coupon, isOpen]); 

  // === 2. Xử lý Submit ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const couponData = {
      code: code.toUpperCase(),
      description,
      type,
      value: Number(value),
      max_value: type === 'percentage' && maxValue ? Number(maxValue) : null,
      min_order_value: Number(minOrderValue),
      max_usage: Number(maxUsage),
      start_date: startDate,
      end_date: endDate,
      // is_active: true, // Thường edit sẽ không tự kích hoạt lại nếu đang stắt, tùy logic bạn
      last_updated_at: coupon.updated_at
    };

    try {
      if (!coupon?.coupon_id) throw new Error("Thiếu ID mã giảm giá");

      // --- DÙNG AXIOS PUT ---
      await axiosClient.put(`/coupons/${coupon.coupon_id}`, couponData);

      onSuccess(); // Refresh list
      handleClose(); // Đóng modal

    } catch (error) {
      console.error("Lỗi cập nhật:", error);

      // === BẮT LỖI XUNG ĐỘT DỮ LIỆU (409) ===
      if (error.response && error.response.status === 409) {
        alert("⚠️ CẢNH BÁO: " + error.response.data.message);
        
        // Tùy chọn: Tự động đóng modal và tải lại dữ liệu mới
        handleClose();
        onSuccess(); // Gọi hàm này để trang cha load lại dữ liệu mới nhất
        return;
      }
       // Xử lý lỗi validation từ Laravel (422)
       if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: [error.response?.data?.message || 'Lỗi hệ thống, vui lòng thử lại.'] });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrors(null);
    onClose(); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
             Chỉnh sửa mã #{coupon?.coupon_id}
          </h2>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          
           {/* Hiển thị lỗi chung */}
           {errors?.general && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex gap-2 items-start">
              <AlertCircle size={16} className="mt-0.5" />
              <div>{errors.general.map((err, idx) => <p key={idx}>{err}</p>)}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput 
                label="Mã giảm giá" 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                required 
                error={errors?.code}
            />
            <FormInput 
                label="Mô tả" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                error={errors?.description} 
            />
          </div>

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

        {/* Footer */}
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
            {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        </div>
      </div>
    </div>
  );
}

// === Component phụ (Đã đồng bộ với AddCouponModal) ===
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