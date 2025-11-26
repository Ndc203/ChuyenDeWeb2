import React, { useState, useEffect, Fragment } from "react";
import AdminSidebar from "../../layout/AdminSidebar.jsx";
import { DollarSign, ShoppingCart, Package, Mail, Box } from "lucide-react";
import axiosClient from '../../../api/axiosClient.js'; // Import centralized Axios client

// --- Helper Components ---
const formatCurrency = (value) => {
  if (isNaN(value)) value = 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

const formatSimpleDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour:'2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleString('vi-VN', options);
};

// Stat Card Component
const StatCard = ({ icon, title, value, color, loading }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm flex items-center gap-5">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      {loading ? (
        <div className="h-7 w-12 bg-slate-200 rounded animate-pulse mt-1"></div>
      ) : (
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      )}
    </div>
  </div>
);

// Helper Th
function Th({ children, className = "" }) {
  return <th scope="col" className={`px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>{children}</th>;
}
// --- End Helper Components ---


export default function AdminRevenueReportPage() {
  const [reportType, setReportType] = useState("daily"); // daily, monthly, yearly
  // Lấy ngày hôm nay theo YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null); // Sẽ lưu { stats, completedOrders, productsSold }

  // useEffect để tải dữ liệu khi Filter thay đổi
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      type: reportType,
      date: selectedDate,
    });
    
    // --- SỬA ĐỔI: Dùng axiosClient ---
    axiosClient.get(`/reports/revenue?${params.toString()}`)
      .then(res => {
        setData(res.data); // Dữ liệu nằm trong res.data
      })
      .catch(error => {
        console.error("Lỗi tải báo cáo:", error);
        setData(null); // Xóa dữ liệu cũ nếu lỗi
      })
      .finally(() => setLoading(false));
      
  }, [reportType, selectedDate]); // Chạy lại khi 2 state này thay đổi

  // Lấy dữ liệu từ state (có ?? 0 để tránh lỗi)
  const stats = data?.stats;
  const completedOrders = data?.completedOrders ?? [];
  const productsSold = data?.productsSold ?? [];

  return (
    <Fragment>
      <div className="min-h-screen flex bg-slate-50 text-slate-800">
        <AdminSidebar />
        <main className="flex-1 w-full min-w-0">
          <div className="w-full px-6 md:px-10 py-6">
            
            {/* 1. Header */}
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Báo cáo Doanh thu</h1>
            <p className="text-sm text-slate-500 mt-1">Theo dõi doanh thu và sản phẩm đã bán.</p>
            
            {/* 2. Filters */}
            <div className="p-4 bg-white rounded-xl shadow-sm my-6 flex flex-wrap items-center gap-4">
              {/* Lọc theo Loại */}
              <div>
                <label htmlFor="reportType" className="block text-xs font-medium text-slate-600 mb-1">Loại báo cáo</label>
                <select
                  id="reportType"
                  value={reportType}
                  onChange={e => setReportType(e.target.value)}
                  className="border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="daily">Theo ngày</option>
                  <option value="monthly">Theo tháng</option>
                  <option value="yearly">Theo năm</option>
                </select>
              </div>
              
              {/* Lọc theo Ngày/Tháng/Năm (RENDER CÓ ĐIỀU KIỆN) */}
              <div>
                <label htmlFor="selectedDate" className="block text-xs font-medium text-slate-600 mb-1">
                  Chọn {reportType === 'monthly' ? 'tháng' : reportType === 'yearly' ? 'năm' : 'ngày'}
                </label>
                <div className="relative">
                  
                  {/* 1. Khi chọn THEO NGÀY */}
                  {reportType === 'daily' && (
                    <input
                      type="date"
                      id="selectedDate"
                      value={selectedDate} // Giá trị là YYYY-MM-DD
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  )}
                  
                  {/* 2. Khi chọn THEO THÁNG */}
                  {reportType === 'monthly' && (
                    <input
                      type="month"
                      id="selectedMonth"
                      // Giá trị phải là YYYY-MM
                      value={selectedDate.substring(0, 7)} 
                      // Khi thay đổi, nó trả về 'YYYY-MM',
                      // ta thêm '-01' để state luôn là một ngày hợp lệ
                      onChange={(e) => setSelectedDate(e.target.value + '-01')}
                      className="border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  )}
                  
                  {/* 3. Khi chọn THEO NĂM */}
                  {reportType === 'yearly' && (
                    <input
                      type="number"
                      id="selectedYear"
                      min="2020"
                      max="2099"
                      step="1"
                      // Giá trị là YYYY
                      value={selectedDate.substring(0, 4)}
                      // Khi thay đổi, nó trả về 'YYYY',
                      // ta thêm '-01-01'
                      onChange={(e) => setSelectedDate(e.target.value + '-01-01')}
                      className="border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  )}

                </div>
              </div>
            </div>

            {/* 3. Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <StatCard 
                icon={<DollarSign size={24} className="text-green-600" />} 
                title="Tổng doanh thu" 
                value={formatCurrency(stats?.totalRevenue ?? 0)} 
                color="bg-green-100" 
                loading={loading} />
              <StatCard 
                icon={<ShoppingCart size={24} className="text-blue-600" />} 
                title="Số đơn hàng" 
                value={stats?.orderCount ?? 0} 
                color="bg-blue-100" 
                loading={loading} />
              <StatCard 
                icon={<Package size={24} className="text-purple-600" />} 
                title="Sản phẩm đã bán" 
                value={stats?.productsSoldCount ?? 0} 
                color="bg-purple-100" 
                loading={loading} />
            </div>

            {/* 4. Large Cards (Danh sách) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Card Đơn hàng đã hoàn thành */}
              <div className="lg:col-span-3 bg-white p-5 rounded-xl shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Đơn hàng đã hoàn thành</h3>
                <ReportCardContent loading={loading} items={completedOrders} type="orders" />
              </div>
              
              {/* Card Sản phẩm đã bán */}
              <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm">
                 <h3 className="font-semibold text-slate-800 mb-4">Sản phẩm đã bán</h3>
                 <ReportCardContent loading={loading} items={productsSold} type="products" />
              </div>

            </div>

          </div>
        </main>
      </div>
    </Fragment>
  );
}

// Component con để xử lý logic hiển thị Bảng/Loading/Empty
function ReportCardContent({ loading, items, type }) {
  if (loading) {
    return <div className="text-center p-8 text-slate-500">Đang tải dữ liệu...</div>;
  }
  
  if (items.length === 0) {
    const message = type === 'orders' 
      ? "Không có đơn hàng nào trong khoảng thời gian này" 
      : "Không có sản phẩm nào được bán trong khoảng thời gian này";
    const icon = type === 'orders' ? <Mail size={32} /> : <Box size={32} />;
      
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 text-slate-400 gap-3">
        {icon}
        <p className="text-sm">{message}</p>
      </div>
    );
  }
  
  // Nếu có dữ liệu, render bảng
  if (type === 'orders') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <Th>Đơn hàng</Th>
            <Th>Khách hàng</Th>
            <Th>Tổng tiền</Th>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map(order => (
              <tr key={order.order_id}>
                <td className="px-5 py-3">
                  <p className="font-medium font-mono text-slate-800">#{order.order_id}</p>
                  <p className="text-xs text-slate-500">{formatSimpleDate(order.updated_at)}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-800">{order.customer_name}</p>
                  <p className="text-xs text-slate-500">{order.customer_email}</p>
                </td>
                <td className="px-5 py-3 font-semibold text-slate-800">{formatCurrency(order.final_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'products') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <Th>Sản phẩm</Th>
            <Th>Đã bán</Th>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map(product => (
              <tr key={product.product_id || product.product_name}>
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-800">{product.product_name}</p>
                  <p className="text-xs text-slate-500">Doanh thu: {formatCurrency(product.total_revenue)}</p>
                </td>
                <td className="px-5 py-3 font-semibold text-slate-800 text-center">{product.total_quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}