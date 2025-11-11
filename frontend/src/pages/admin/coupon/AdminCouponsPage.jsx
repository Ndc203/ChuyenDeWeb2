import React, { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { Plus, Search, Edit, Trash2, Tag, Percent, BarChart, CheckCircle, XCircle, Clock, Zap, ChevronLeft, ChevronRight, Power } from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";
import AddCouponModal from "./coupon/AddCouponModal.jsx";
import EditCouponModal from "./coupon/EditCouponModal.jsx";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// Helper function to format currency
const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  
  const options = {
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false // <-- Chìa khóa để bật 24h
  };
  
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); //add coupon modal
  // 'refreshTrigger' là một "mẹo" để làm mới bảng
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null); // <-- Để lưu coupon đang được sửa

  // State mới để theo dõi thời gian
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // useEffect để cập nhật 'currentTime' sau mỗi 30 giây
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000); // 30,000 ms = 30 giây

    // Dọn dẹp khi component bị gỡ
    return () => clearInterval(intervalId);
  }, []); // [] nghĩa là chỉ chạy 1 lần khi tải trang

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage,
      search: searchQuery,
      status: statusFilter,
      type: typeFilter,
    });

    fetch(`${API_URL}/api/coupons?${params.toString()}`,
      { cache: 'no-store' }) // tránh cache để luôn lấy dữ liệu mới nhất(nhất là sau khi thêm mới)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Lỗi HTTP! Trạng thái: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setPaginationData(data))
      .catch((error) => {
        console.error("Không thể tải dữ liệu mã giảm giá:", error);
        setPaginationData(null);
      })
      .finally(() => setLoading(false));
  }, [currentPage, searchQuery, statusFilter, typeFilter, refreshTrigger]);

  useEffect(() => {
    setLoadingStats(true);
    fetch(`${API_URL}/api/coupons/statistics`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(error => console.error("Không thể tải thống kê:", error))
      .finally(() => setLoadingStats(false));
  }, []);

  const getCouponStatus = useCallback((coupon) => {
    const now = currentTime;
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);

    if (!coupon.is_active) return 'Vô hiệu hóa';
    if (now > endDate) return 'Hết hạn';
    if (coupon.usage_count >= coupon.max_usage) return 'Đã hết lượt';
    if (now < startDate) return 'Sắp diễn ra';
    return 'Hoạt động';
  }, [currentTime]);

  const processedCoupons = useMemo(() => {
    if (!paginationData?.data) return [];
    return paginationData.data.map(c => ({ ...c, derived_status: getCouponStatus(c) }));
  }, [paginationData, getCouponStatus]);


  //sửa coupon
  const handleOpenEditModal = (coupon) => {
    setSelectedCoupon(coupon); // 1. Lưu coupon được chọn
    setIsEditModalOpen(true);    // 2. Mở modal
  };

  //xóa coupon
  const handleDelete = async (id) => {
    // 1. Xác nhận trước khi xóa
    if (!confirm("Bạn có chắc muốn xoá mã giảm giá này? Thao tác này không thể hoàn tác.")) {
      return; // Người dùng hủy
    }

    try {
      // 2. Gọi API với method DELETE
      const response = await fetch(`${API_URL}/api/coupons/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          // 'Authorization': 'Bearer ...' // Thêm nếu cần
        },
      });

      // 3. Xử lý kết quả
      if (!response.ok) {
        // Nếu server trả về lỗi (vd: 404, 500)
        throw new Error('Xoá thất bại!');
      }

      // 4. Thành công -> Tải lại bảng
      alert('Đã xoá mã giảm giá thành công!');
      setCurrentPage(1); // Đưa về trang 1
      setRefreshTrigger(prev => prev + 1); // Kích hoạt refresh

    } catch (error) {
      console.error("Lỗi khi xoá mã giảm giá:", error);
      alert('Đã xảy ra lỗi khi xoá mã giảm giá.');
    }
  };

  //bật/tắt trạng thái của coupon
  const handleToggleStatus = async (coupon) => {
    // 1. Hỏi xác nhận (nếu muốn)
    const action = coupon.is_active ? "Vô hiệu hóa" : "Kích hoạt";
    if (!confirm(`Bạn có chắc muốn ${action} mã [${coupon.code}]?`)) {
      return;
    }

    try {
      // 2. Gửi request PATCH (cập nhật một phần)
      // Chúng ta sẽ tạo API này ở back-end
      const response = await fetch(`${API_URL}/api/coupons/${coupon.coupon_id}/toggle`, {
        method: 'PATCH', // PATCH là chuẩn nhất để cập nhật 1 trường
        headers: {
          'Accept': 'application/json',
          // 'Authorization': 'Bearer ...' // Thêm nếu cần
        },
      });

      if (!response.ok) {
        throw new Error('Cập nhật trạng thái thất bại!');
      }

      // 3. Thành công -> Tải lại bảng
      alert(`Đã ${action} mã giảm giá!`);
      setRefreshTrigger(prev => prev + 1); // Kích hoạt refresh

    } catch (error) {
      console.error("Lỗi khi đổi trạng thái:", error);
      alert('Đã xảy ra lỗi.');
    }
  };

  return (
    // Fragment cho phép return nhiều element
    <Fragment>
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
              <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 shadow-sm">
                <Plus size={18} /> Thêm mã giảm giá
              </button>
            </div>

            {/* 2. Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <StatCard icon={<BarChart size={24} className="text-slate-500" />} title="Tổng mã giảm giá" value={stats?.total ?? '0'} color="bg-slate-100" loading={loadingStats} />
              <StatCard icon={<CheckCircle size={24} className="text-green-600" />} title="Đang hoạt động" value={stats?.active ?? '0'} color="bg-green-100" loading={loadingStats} />
              <StatCard icon={<XCircle size={24} className="text-red-600" />} title="Đã hết hạn" value={stats?.expired ?? '0'} color="bg-red-100" loading={loadingStats} />
              <StatCard icon={<Zap size={24} className="text-orange-600" />} title="Đã hết lượt" value={stats?.usedUp ?? '0'} color="bg-orange-100" loading={loadingStats} />
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
                              <button
                                onClick={() => handleToggleStatus(coupon)}
                                // Đổi màu dựa trên trạng thái
                                className={`p-2 rounded-md hover:bg-slate-100 
        ${coupon.is_active ? 'text-green-500 hover:text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title={coupon.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                              >
                                <Power size={16} />
                              </button>
                              <button onClick={() => handleOpenEditModal(coupon)} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-md"><Edit size={16} /></button>
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
      {/* 5. MODAL THÊM MỚI */}
      <AddCouponModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        // Thêm một prop để tải lại dữ liệu sau khi thêm thành công
        onSuccess={() => {
          setIsAddModalOpen(false);//đóng modal
          setRefreshTrigger(prev => prev + 1); // Kích hoạt refresh
        }}
      />
      {/* 6. MODAL SỬA */}
      <EditCouponModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false); // 1. Đóng modal
          setRefreshTrigger(prev => prev + 1); // 2. Kích hoạt refresh dữ liệu bảng
        }}
        coupon={selectedCoupon} // <-- Prop quan trọng để truyền dữ liệu
      />
    </Fragment>
  );
}

function Th({ children, className = "" }) {
  return <th scope="col" className={`px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>{children}</th>;
}