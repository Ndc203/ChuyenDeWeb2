import React, { useState, useEffect, Fragment } from "react";
import { Search, Edit, Printer, Package, Clock, RefreshCw, Truck, CheckCircle, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import AdminSidebar from "../../layout/AdminSidebar.jsx";
import OrderDetailModal from "./OrderDetailModal.jsx";
import axiosClient from '../../../api/axiosClient'; // Import axiosClient đã cấu hình

// Helper function to format currency
const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// Helper function to format date
const formatSimpleDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleString('vi-VN', options);
};

// --- CÁC COMPONENT CON (Giữ nguyên logic UI) ---
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

const OrderStatusBadge = ({ status }) => {
    const styles = {
        'Hoàn thành': "bg-green-100 text-green-700",
        'Đang xử lý': "bg-blue-100 text-blue-700",
        'Đang giao': "bg-purple-100 text-purple-700",
        'Chờ thanh toán': "bg-yellow-100 text-yellow-700",
        'Đã hủy': "bg-red-100 text-red-700",
    };
    const icons = {
        'Hoàn thành': <CheckCircle size={12} />,
        'Đang xử lý': <RefreshCw size={12} />,
        'Đang giao': <Truck size={12} />,
        'Chờ thanh toán': <Clock size={12} />,
        'Đã hủy': <XCircle size={12} />,
    };

    const style = styles[status] || "bg-slate-100 text-slate-600";
    const icon = icons[status] || <Package size={12} />;

    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${style}`}>
        {icon}
        {status}
    </span>;
};

const Pagination = ({ pagination, onPageChange }) => {
    if (!pagination || pagination.total <= pagination.per_page) return null;
    return (
        <div className="flex flex-col gap-2 border-t bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
                Hiển thị {pagination.from} đến {pagination.to} trong tổng số {pagination.total} đơn hàng
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="px-2 text-xs font-semibold text-slate-800">
                    {pagination.current_page} / {pagination.last_page}
                </span>
                <button
                    onClick={() => onPageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

function Th({ children, className = "" }) {
    return <th scope="col" className={`px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>{children}</th>;
}

// --- MAIN COMPONENT ---
export default function AdminOrdersPage() {
    const [paginationData, setPaginationData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // State cho modal xem chi tiết
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // 1. TẢI DANH SÁCH ĐƠN HÀNG (Dùng axiosClient)
    useEffect(() => {
        setLoading(true);
        const params = {
            page: currentPage,
            search: searchQuery,
            status: statusFilter,
        };

        axiosClient.get('/orders', { params })
            .then((res) => {
                setPaginationData(res.data);
            })
            .catch((error) => {
                console.error("Lỗi tải đơn hàng:", error);
                setPaginationData(null);
            })
            .finally(() => setLoading(false));
    }, [currentPage, searchQuery, statusFilter, refreshTrigger]);

    // 2. TẢI THỐNG KÊ (Dùng axiosClient)
    useEffect(() => {
        setLoadingStats(true);
        axiosClient.get('/orders/statistics')
            .then(res => {
                setStats(res.data);
            })
            .catch(error => {
                console.error("Không thể tải thống kê:", error);
            })
            .finally(() => setLoadingStats(false));
    }, [refreshTrigger]);

    // Xử lý mở modal xem chi tiết
    const handleOpenViewModal = (order) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
    };

    // 3. IN ĐƠN HÀNG (Dùng axiosClient Blob)
    const handlePrint = async (orderId) => {
        try {
            const response = await axiosClient.get(`/orders/${orderId}/print`, {
                responseType: 'blob'
            });

            // Tạo URL ảo từ dữ liệu blob nhận được
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);

            // Mở URL trong tab mới
            window.open(fileURL, '_blank');

        } catch (error) {
            console.error("Lỗi in đơn hàng:", error);
            alert("Không thể in đơn hàng. Vui lòng kiểm tra lại.");
        }
    };

    // 4. CẬP NHẬT TRẠNG THÁI (Dùng axiosClient.patch)
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await axiosClient.patch(`/orders/${orderId}/status`, { 
                status: newStatus 
            });

            alert('Cập nhật trạng thái thành công!');
            setRefreshTrigger(prev => prev + 1); // Load lại dữ liệu

        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái:", error);
            const message = error.response?.data?.message || 'Cập nhật thất bại!';
            alert(`Đã xảy ra lỗi: ${message}`);
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
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Quản lý Đơn hàng</h1>
                                <p className="text-sm text-slate-500 mt-1">Theo dõi và xử lý các đơn hàng của khách.</p>
                            </div>
                        </div>

                        {/* Dashboard Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
                            <StatCard icon={<Package size={24} className="text-slate-500" />} title="Tổng Đơn hàng" value={stats?.total ?? '0'} color="bg-slate-100" loading={loadingStats} />
                            <StatCard icon={<Clock size={24} className="text-yellow-600" />} title="Chờ thanh toán" value={stats?.pending ?? '0'} color="bg-yellow-100" loading={loadingStats} />
                            <StatCard icon={<RefreshCw size={24} className="text-blue-600" />} title="Đang xử lý" value={stats?.processing ?? '0'} color="bg-blue-100" loading={loadingStats} />
                            <StatCard icon={<Truck size={24} className="text-purple-600" />} title="Đang giao" value={stats?.shipped ?? '0'} color="bg-purple-100" loading={loadingStats} />
                            <StatCard icon={<CheckCircle size={24} className="text-green-600" />} title="Hoàn thành" value={stats?.completed ?? '0'} color="bg-green-100" loading={loadingStats} />
                        </div>

                        {/* Toolbar */}
                        <div className="p-4 bg-white rounded-xl shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="relative flex-grow max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full rounded-lg border-slate-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Tìm theo ID đơn hàng, tên hoặc email..."
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="w-full md:w-auto border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="Chờ thanh toán">Chờ thanh toán</option>
                                    <option value="Đang xử lý">Đang xử lý</option>
                                    <option value="Đang giao">Đang giao</option>
                                    <option value="Hoàn thành">Hoàn thành</option>
                                    <option value="Đã hủy">Đã hủy</option>
                                </select>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="overflow-hidden shadow-sm rounded-xl bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr className="text-left text-slate-600">
                                            <Th>ID Đơn hàng</Th>
                                            <Th>Khách hàng</Th>
                                            <Th>Ngày</Th>
                                            <Th>Sản phẩm</Th>
                                            <Th>Tổng tiền</Th>
                                            <Th>Trạng thái</Th>
                                            <Th className="text-right">Thao tác</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {loading ? (
                                            <tr><td colSpan="7" className="p-6 text-center text-slate-500">Đang tải...</td></tr>
                                        ) : !paginationData || paginationData.data.length === 0 ? (
                                            <tr><td colSpan="7" className="p-6 text-center text-slate-500">Không tìm thấy đơn hàng nào.</td></tr>
                                        ) : (
                                            paginationData.data.map((order) => (
                                                <tr key={order.order_id} className="hover:bg-slate-50">
                                                    <td className="px-5 py-4 align-top">
                                                        <p className="font-semibold text-slate-800 font-mono">#{order.order_id}</p>
                                                    </td>
                                                    <td className="px-5 py-4 align-top">
                                                        <p className="font-semibold text-slate-800">{order.customer?.name ?? 'Khách lẻ'}</p>
                                                        <p className="text-slate-500 text-xs mt-1">{order.customer?.email}</p>
                                                    </td>
                                                    <td className="px-5 py-4 align-top text-slate-600">
                                                        {formatSimpleDate(order.created_at)}
                                                    </td>
                                                    <td className="px-5 py-4 align-top text-slate-600">
                                                        {order.item_count} sản phẩm
                                                    </td>
                                                    <td className="px-5 py-4 align-top">
                                                        <p className="font-semibold text-slate-700">{formatCurrency(order.final_amount)}</p>
                                                    </td>
                                                    <td className="px-5 py-4 align-top">
                                                        <OrderStatusBadge status={order.status} />
                                                    </td>
                                                    <td className="px-5 py-4 align-top text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => handleOpenViewModal(order)} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-md" title="Xem chi tiết/ Sửa trạng thái">
                                                                <Edit size={16} />
                                                            </button>
                                                            <button onClick={() => handlePrint(order.order_id)} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600 rounded-md" title="In đơn hàng">
                                                                <Printer size={16} />
                                                            </button>
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

            {/* Modal */}
            <OrderDetailModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                orderId={selectedOrder?.order_id}
                onStatusChange={handleUpdateOrderStatus}
            />
        </Fragment>
    );
}