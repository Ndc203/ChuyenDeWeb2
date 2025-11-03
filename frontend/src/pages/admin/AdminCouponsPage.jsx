import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Tag, Percent, Calendar, BarChart, CheckCircle, XCircle, Clock, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// Helper function to format currency
const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('vi-VN');
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

// Badge Components
const TypeBadge = ({ type }) => {
  const isPercent = type === 'percentage';
  const style = isPercent
    ? "bg-blue-100 text-blue-700"
    : "bg-purple-100 text-purple-700";
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${style}`}>
    {isPercent ? <Percent size={12} /> : <Tag size={12} />}
    {isPercent ? 'Phần trăm' : 'Số tiền'}
  </span>;
};

const StatusBadge = ({ status }) => {
  const styles = {
    'Hoạt động': "bg-green-100 text-green-700",
    'Hết hạn': "bg-red-100 text-red-700",
    'Vô hiệu hóa': "bg-slate-100 text-slate-600",
    'Sắp diễn ra': "bg-yellow-100 text-yellow-700",
    'Đã hết lượt': "bg-orange-100 text-orange-700",
  };
  const icons = {
    'Hoạt động': <CheckCircle size={12} />,
    'Hết hạn': <XCircle size={12} />,
    'Vô hiệu hóa': <XCircle size={12} />,
    'Sắp diễn ra': <Clock size={12} />,
    'Đã hết lượt': <Zap size={12} />,
  };
  const style = styles[status] || "bg-gray-100 text-gray-700";
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${style}`}>
    {icons[status]}
    {status}
  </span>;
};

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.total <= pagination.per_page) return null;

  return (
    <div className="p-4 flex items-center justify-between flex-wrap gap-4">
      <p className="text-sm text-slate-600">
        Hiển thị {pagination.from} đến {pagination.to} trong tổng số {pagination.total} mã
      </p>
      <div className="flex items-center gap-2">
        <button onClick={() => onPageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={20} /></button>
        <span className="text-sm font-medium">{pagination.current_page} / {pagination.last_page}</span>
        <button onClick={() => onPageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={20} /></button>
      </div>
    </div>
  );
};

export default function AdminCouponsPage() {
  const [paginationData, setPaginationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage,
      search: searchQuery,
      status: statusFilter,
      type: typeFilter,
    });

    fetch(`${API_URL}/api/coupons?${params.toString()}`)
      .then((res) => {
        if (!res.ok) {
          // Nếu response có lỗi (vd: 404, 500), ném ra lỗi để .catch() xử lý
          throw new Error(`Lỗi HTTP! Trạng thái: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setPaginationData(data))
      .catch((error) => {
        console.error("Không thể tải dữ liệu mã giảm giá:", error);
        setPaginationData(null); // Đặt lại dữ liệu khi có lỗi
      })
      .finally(() => setLoading(false));
  }, [currentPage, searchQuery, statusFilter, typeFilter]);

  const getCouponStatus = useCallback((coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);

    if (!coupon.is_active) return 'Vô hiệu hóa';
    if (now > endDate) return 'Hết hạn';
    if (coupon.usage_count >= coupon.max_usage) return 'Đã hết lượt';
    if (now < startDate) return 'Sắp diễn ra';
    return 'Hoạt động';
  }, []);

  const processedCoupons = useMemo(() => {
    if (!paginationData?.data) return [];
    return paginationData.data.map(c => ({ ...c, derived_status: getCouponStatus(c) }));
  }, [paginationData, getCouponStatus]);

  const stats = useMemo(() => {
    // Note: Stats are now based on paginated data. For global stats, a separate API endpoint would be better.
    const total = paginationData?.total || 0;
    return { total, active: '...', expired: '...', usedUp: '...' }; // Placeholder for stats
  }, [paginationData]);

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xoá mã giảm giá này?")) return;
    // ... Delete logic (can be implemented later)
    alert(`Đã yêu cầu xoá mã giảm giá ID: ${id}`);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />
      <main className="flex-1 w-full min-w-0">
        <div className="w-full px-6 md:px-10 py-6">
          {/* 1. Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Quản lý Mã giảm giá</h1>
              <p className="text-sm text-slate-500 mt-1">Tạo và quản lý các mã giảm giá cho khách hàng.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 shadow-sm">
              <Plus size={18} /> Thêm mã giảm giá
            </button>
          </div>

          {/* 2. Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <StatCard icon={<BarChart size={24} className="text-slate-500" />} title="Tổng mã giảm giá" value={stats.total} color="bg-slate-100" loading={loading} />
            <StatCard icon={<CheckCircle size={24} className="text-green-600" />} title="Đang hoạt động" value={stats.active} color="bg-green-100" loading={loading} />
            <StatCard icon={<XCircle size={24} className="text-red-600" />} title="Đã hết hạn" value={stats.expired} color="bg-red-100" loading={loading} />
            <StatCard icon={<Zap size={24} className="text-orange-600" />} title="Đã hết lượt" value={stats.usedUp} color="bg-orange-100" loading={loading} />
          </div>

          {/* 3. Toolbar */}
          <div className="p-4 bg-white rounded-xl shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-lg border-slate-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Tìm kiếm theo mã hoặc mô tả..."
              />
            </div>
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full md:w-auto border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Hết hạn">Hết hạn</option>
                <option value="Đã hết lượt">Đã hết lượt</option>
                <option value="Sắp diễn ra">Sắp diễn ra</option>
                <option value="Vô hiệu hóa">Vô hiệu hóa</option>
              </select>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full md:w-auto border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">Tất cả loại</option>
                <option value="percentage">Phần trăm</option>
                <option value="fixed_amount">Số tiền</option>
              </select>
            </div>
          </div>

          {/* 4. Data Table */}
          <div className="overflow-hidden shadow-sm rounded-xl bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <Th>Mã giảm giá</Th>
                    <Th>Loại & Giá trị</Th>
                    <Th>Điều kiện & Thời gian</Th>
                    <Th>Sử dụng</Th>
                    <Th>Trạng thái</Th>
                    <Th className="text-right">Thao tác</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr><td colSpan="6" className="p-6 text-center text-slate-500">Đang tải...</td></tr>
                  ) : processedCoupons.length === 0 ? (
                    <tr><td colSpan="6" className="p-6 text-center text-slate-500">Không tìm thấy mã giảm giá nào.</td></tr>
                  ) : (
                    processedCoupons.map((coupon) => (
                      <tr key={coupon.coupon_id} className="hover:bg-slate-50">
                        {/* Mã giảm giá */}
                        <td className="px-5 py-4 align-top">
                          <p className="font-semibold text-slate-800 font-mono">{coupon.code}</p>
                          <p className="text-slate-500 text-xs mt-1 truncate max-w-xs">{coupon.description}</p>
                        </td>

                        {/* Loại & Giá trị */}
                        <td className="px-5 py-4 align-top">
                          <TypeBadge type={coupon.type} />
                          <p className="font-semibold text-slate-700 mt-1.5">
                            {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                          </p>
                          {coupon.type === 'percentage' && coupon.max_value && (
                            <p className="text-xs text-slate-500">Tối đa: {formatCurrency(coupon.max_value)}</p>
                          )}
                        </td>

                        {/* Điều kiện & Thời gian */}
                        <td className="px-5 py-4 align-top text-slate-600">
                          <p>Đơn tối thiểu: <span className="font-medium text-slate-700">{formatCurrency(coupon.min_order_value)}</span></p>
                          <p className="mt-1">Hiệu lực: <span className="font-medium text-slate-700">{formatDate(coupon.start_date)} - {formatDate(coupon.end_date)}</span></p>
                        </td>

                        {/* Sử dụng */}
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-slate-700">{coupon.usage_count} / {coupon.max_usage}</span>
                            <span className="text-xs text-slate-500">{((coupon.usage_count / coupon.max_usage) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full"
                              style={{ width: `${(coupon.usage_count / coupon.max_usage) * 100}%` }}
                            ></div>
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td className="px-5 py-4 align-top">
                          <StatusBadge status={coupon.derived_status} />
                        </td>

                        {/* Thao tác */}
                        <td className="px-5 py-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-md"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(coupon.coupon_id)} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600 rounded-md"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination pagination={paginationData} onPageChange={setCurrentPage} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th scope="col" className={`px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>{children}</th>;
}
