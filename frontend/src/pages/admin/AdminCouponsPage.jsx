import React, { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import {
  Plus, Search, Edit, Trash2, Tag, Percent, BarChart,
  CheckCircle, XCircle, Clock, Zap, ChevronLeft, ChevronRight, Power
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";
import AddCouponModal from "./cart/AddCouponModal.jsx";
import EditCouponModal from "./cart/EditCouponModal.jsx";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// Helper: Format currency
const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// Helper: Format date + time (24h)
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  return new Date(dateString).toLocaleString('vi-VN', options);
};

// Stat Card
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

// Badge: Type
const TypeBadge = ({ type }) => {
  const isPercent = type === 'percentage';
  const style = isPercent
    ? "bg-blue-100 text-blue-700"
    : "bg-purple-100 text-purple-700";
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${style}`}>
      {isPercent ? <Percent size={12} /> : <Tag size={12} />}
      {isPercent ? 'Phần trăm' : 'Số tiền'}
    </span>
  );
};

// Badge: Status
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
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${style}`}>
      {icons[status]}
      {status}
    </span>
  );
};

// Pagination
const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.total <= pagination.per_page) return null;
  return (
    <div className="p-4 flex items-center justify-between flex-wrap gap-4">
      <p className="text-sm text-slate-600">
        Hiển thị {pagination.from} đến {pagination.to} trong tổng số {pagination.total} mã
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(pagination.current_page - 1)}
          disabled={pagination.current_page === 1}
          className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium">
          {pagination.current_page} / {pagination.last_page}
        </span>
        <button
          onClick={() => onPageChange(pagination.current_page + 1)}
          disabled={pagination.current_page === pagination.last_page}
          className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default function AdminCouponsPage() {
  const [paginationData, setPaginationData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Cập nhật thời gian mỗi 5 giây
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Load danh sách mã giảm giá
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage,
      search: searchQuery,
      status: statusFilter,
      type: typeFilter,
    });
    fetch(`${API_URL}/api/coupons?${params.toString()}`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
        return res.json();
      })
      .then(data => setPaginationData(data))
      .catch(err => {
        console.error("Lỗi tải dữ liệu:", err);
        setPaginationData(null);
      })
      .finally(() => setLoading(false));
  }, [currentPage, searchQuery, statusFilter, typeFilter, refreshTrigger]);

  // Load thống kê
  useEffect(() => {
    setLoadingStats(true);
    fetch(`${API_URL}/api/coupons/statistics`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Lỗi tải thống kê:", err))
      .finally(() => setLoadingStats(false));
  }, []);

  // Xác định trạng thái mã giảm giá theo thời gian thực
  const getCouponStatus = useCallback((coupon) => {
    const now = currentTime;
    const start = new Date(coupon.start_date);
    const end = new Date(coupon.end_date);
    if (!coupon.is_active) return 'Vô hiệu hóa';
    if (now > end) return 'Hết hạn';
    if (coupon.usage_count >= coupon.max_usage) return 'Đã hết lượt';
    if (now < start) return 'Sắp diễn ra';
    return 'Hoạt động';
  }, [currentTime]);

  const processedCoupons = useMemo(() => {
    if (!paginationData?.data) return [];
    return paginationData.data.map(c => ({
      ...c,
      derived_status: getCouponStatus(c)
    }));
  }, [paginationData, getCouponStatus]);

  // Mở modal sửa
  const handleOpenEditModal = (coupon) => {
    setSelectedCoupon(coupon);
    setIsEditModalOpen(true);
  };

  // Xóa mã
  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xoá mã giảm giá này? Thao tác này không thể hoàn tác.")) return;
    try {
      const res = await fetch(`${API_URL}/api/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Xoá thất bại!');
      alert('Đã xoá mã giảm giá thành công!');
      setCurrentPage(1);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xoá mã giảm giá.');
    }
  };

  // Bật/tắt trạng thái
  const handleToggleStatus = async (coupon) => {
    const action = coupon.is_active ? "Vô hiệu hóa" : "Kích hoạt";
    if (!confirm(`Bạn có chắc muốn ${action} mã [${coupon.code}]?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/coupons/${coupon.coupon_id}/toggle`, {
        method: 'PATCH',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Cập nhật thất bại!');
      alert(`Đã ${action} mã giảm giá!`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi cập nhật trạng thái.');
    }
  };

  return (
    <Fragment>
      <div className="min-h-screen flex bg-slate-50 text-slate-800">
        <AdminSidebar />
        <main className="flex-1 w-full min-w-0">
          <div className="w-full px-6 md:px-10 py-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Quản lý Mã giảm giá</h1>
                <p className="text-sm text-slate-500 mt-1">Tạo và quản lý các mã giảm giá cho khách hàng.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 shadow-sm"
              >
                <Plus size={18} /> Thêm mã giảm giá
              </button>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <StatCard icon={<BarChart size={24} className="text-slate-500" />} title="Tổng mã giảm giá" value={stats?.total ?? '...'} color="bg-slate-100" loading={loadingStats} />
              <StatCard icon={<CheckCircle size={24} className="text-green-600" />} title="Đang hoạt động" value={stats?.active ?? '...'} color="bg-green-100" loading={loadingStats} />
              <StatCard icon={<XCircle size={24} className="text-red-600" />} title="Đã hết hạn" value={stats?.expired ?? '...'} color="bg-red-100" loading={loadingStats} />
              <StatCard icon={<Zap size={24} className="text-orange-600" />} title="Đã hết lượt" value={stats?.usedUp ?? '...'} color="bg-orange-100" loading={loadingStats} />
            </div>

            </div> {/* Closing div for "w-full px-6 md:px-10 py-6" */}

            {/* Toolbar */}
        </main>
      </div>
    </Fragment>
  );
}
