import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient'; // Import axiosClient

export default function AdminProductHistoryPage() {
    const { productId } = useParams(); // Lấy ID sản phẩm từ URL (hashed_id hoặc id)
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [restoring, setRestoring] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [productId]);

    // === 1. Lấy dữ liệu lịch sử (Dùng axiosClient) ===
    const fetchHistory = async () => {
        try {
            setLoading(true);
            // axiosClient tự động gắn Base URL
            const response = await axiosClient.get(`/products/${productId}/history`);
            
            // Giả sử API trả về: { product: {...}, history: [...] }
            setProduct(response.data.product);
            setHistory(response.data.history);
        } catch (error) {
            console.error('Lỗi khi tải lịch sử:', error);
            // Không alert lỗi ở đây để tránh spam nếu user vào trang chưa có lịch sử
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = (item) => {
        setSelectedHistory(item);
        setShowDetailModal(true);
    };

    // === 2. Khôi phục phiên bản cũ (Dùng axiosClient) ===
    const handleRestore = async (historyId) => {
        if (!confirm('Bạn có chắc chắn muốn khôi phục sản phẩm về trạng thái này?')) {
            return;
        }

        try {
            setRestoring(true);
            await axiosClient.post(`/product-history/${historyId}/restore`);
            
            alert('Khôi phục thành công!');
            fetchHistory(); // Tải lại dữ liệu mới nhất
        } catch (error) {
            console.error('Lỗi khi khôi phục:', error);
            const message = error.response?.data?.message || 'Không thể khôi phục dữ liệu';
            alert(message);
        } finally {
            setRestoring(false);
        }
    };

    // --- Các hàm Helper UI (Giữ nguyên) ---
    const getActionBadge = (action) => {
        const badges = {
            created: { text: 'Tạo mới', class: 'bg-green-100 text-green-800' },
            updated: { text: 'Cập nhật', class: 'bg-blue-100 text-blue-800' },
            deleted: { text: 'Xóa', class: 'bg-red-100 text-red-800' },
            restored: { text: 'Khôi phục', class: 'bg-purple-100 text-purple-800' },
        };
        const badge = badges[action] || { text: action, class: 'bg-gray-100 text-gray-800' };
        return (
            <span className={`px-2 py-1 text-xs rounded-full ${badge.class}`}>
                {badge.text}
            </span>
        );
    };

    const renderChanges = (item) => {
        if (!item.changed_fields || item.changed_fields.length === 0) {
            return <span className="text-gray-500 italic">Không có thay đổi chi tiết</span>;
        }

        return (
            <div className="space-y-1">
                {item.changed_fields.map((field, idx) => {
                    const oldValue = item.old_values?.[field];
                    const newValue = item.new_values?.[field];
                    return (
                        <div key={idx} className="text-sm">
                            <span className="font-medium capitalize">{field.replace('_', ' ')}:</span>
                            <span className="text-red-600 line-through mx-1">{String(oldValue ?? 'Trống')}</span>
                            →
                            <span className="text-green-600 mx-1 font-semibold">{String(newValue ?? 'Trống')}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải lịch sử...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-slate-50">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/products')}
                    className="text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1"
                >
                    ← Quay lại danh sách sản phẩm
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Lịch sử thay đổi sản phẩm
                </h1>
                {product && (
                    <p className="text-gray-600 mt-2">
                        Sản phẩm: <span className="font-semibold text-indigo-600">{product.name}</span>
                        {product.status === 'deleted' && (
                            <span className="ml-2 text-red-600 font-bold">(Đã xóa)</span>
                        )}
                    </p>
                )}
            </div>

            {/* History List */}
            {history.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">Chưa có lịch sử thay đổi nào</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Thời gian
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Hành động
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Người thực hiện
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Mô tả / Thay đổi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {history.map((item) => (
                                <tr key={item.history_id || item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {new Date(item.created_at).toLocaleString('vi-VN')}
                                        </div>
                                        <div className="text-xs text-gray-500">{item.created_at_human}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getActionBadge(item.action)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.user ? (
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.user.full_name || item.user.username || item.user.name}
                                                </div>
                                                <div className="text-xs text-gray-500">{item.user.email}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-xs">System / Unknown</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 mb-1">{item.description}</div>
                                        {/* Hiển thị tóm tắt thay đổi ngay tại bảng */}
                                        {item.changed_fields && item.changed_fields.length > 0 && (
                                            <div className="text-xs text-gray-500 truncate max-w-xs">
                                                Thay đổi: {item.changed_fields.join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleViewDetail(item)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3 font-medium"
                                        >
                                            Chi tiết
                                        </button>
                                        {item.action === 'updated' && (
                                            <button
                                                onClick={() => handleRestore(item.history_id || item.id)}
                                                disabled={restoring}
                                                className="text-green-600 hover:text-green-900 disabled:opacity-50 font-medium"
                                            >
                                                Khôi phục
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">
                                Chi tiết lịch sử thay đổi
                            </h3>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <div className="px-6 py-4 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Hành động</label>
                                    <div className="mt-1">{getActionBadge(selectedHistory.action)}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Thời gian</label>
                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                        {new Date(selectedHistory.created_at).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Người thực hiện</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                        {selectedHistory.user?.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedHistory.user?.full_name || selectedHistory.user?.username || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-500">{selectedHistory.user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedHistory.ip_address && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">IP Address</label>
                                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedHistory.ip_address}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Mô tả</label>
                                <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border">{selectedHistory.description}</p>
                            </div>

                            {selectedHistory.changed_fields && selectedHistory.changed_fields.length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                                        Chi tiết thay đổi
                                    </label>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        {renderChanges(selectedHistory)}
                                    </div>
                                </div>
                            )}

                            {/* Debug Data (Ẩn đi nếu không cần thiết, hoặc để cho Admin xem) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Dữ liệu cũ (Raw)</label>
                                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-40">
                                        {JSON.stringify(selectedHistory.old_values, null, 2)}
                                    </pre>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Dữ liệu mới (Raw)</label>
                                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-40">
                                        {JSON.stringify(selectedHistory.new_values, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}