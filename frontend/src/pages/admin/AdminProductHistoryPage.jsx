import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function AdminProductHistoryPage() {
    const { productId } = useParams();
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

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/products/${productId}/history`);
            setProduct(response.data.product);
            setHistory(response.data.history);
        } catch (error) {
            console.error('Lỗi khi tải lịch sử:', error);
            alert('Không thể tải lịch sử sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = (item) => {
        setSelectedHistory(item);
        setShowDetailModal(true);
    };

    const handleRestore = async (historyId) => {
        if (!confirm('Bạn có chắc chắn muốn khôi phục sản phẩm về trạng thái này?')) {
            return;
        }

        try {
            setRestoring(true);
            await axios.post(`${API_BASE_URL}/product-history/${historyId}/restore`);
            alert('Khôi phục thành công!');
            fetchHistory();
        } catch (error) {
            console.error('Lỗi khi khôi phục:', error);
            alert(error.response?.data?.message || 'Không thể khôi phục dữ liệu');
        } finally {
            setRestoring(false);
        }
    };

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
                            <span className="font-medium">{field}:</span>
                            <span className="text-red-600 line-through mx-1">{String(oldValue)}</span>
                            →
                            <span className="text-green-600 mx-1">{String(newValue)}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải lịch sử...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/products')}
                    className="text-blue-600 hover:text-blue-800 mb-2"
                >
                    ← Quay lại danh sách sản phẩm
                </button>
                <h1 className="text-3xl font-bold text-gray-800">
                    Lịch sử thay đổi sản phẩm
                </h1>
                {product && (
                    <p className="text-gray-600 mt-2">
                        Sản phẩm: <span className="font-semibold">{product.name}</span>
                        {product.status === 'deleted' && (
                            <span className="ml-2 text-red-600">(Đã xóa)</span>
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
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Thời gian
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Hành động
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Người thực hiện
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Mô tả
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {history.map((item) => (
                                <tr key={item.history_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{item.created_at}</div>
                                        <div className="text-xs text-gray-500">{item.created_at_human}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getActionBadge(item.action)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.user ? (
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.user.full_name || item.user.username}
                                                </div>
                                                <div className="text-xs text-gray-500">{item.user.email}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Không rõ</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{item.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleViewDetail(item)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            Chi tiết
                                        </button>
                                        {item.action === 'updated' && (
                                            <button
                                                onClick={() => handleRestore(item.history_id)}
                                                disabled={restoring}
                                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
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
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900">
                                Chi tiết lịch sử thay đổi
                            </h3>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Hành động:</label>
                                <div className="mt-1">{getActionBadge(selectedHistory.action)}</div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Thời gian:</label>
                                <p className="mt-1 text-sm text-gray-900">{selectedHistory.created_at}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Người thực hiện:</label>
                                <p className="mt-1 text-sm text-gray-900">
                                    {selectedHistory.user?.full_name || selectedHistory.user?.username || 'Không rõ'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">IP Address:</label>
                                <p className="mt-1 text-sm text-gray-900">{selectedHistory.ip_address || 'N/A'}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mô tả:</label>
                                <p className="mt-1 text-sm text-gray-900">{selectedHistory.description}</p>
                            </div>

                            {selectedHistory.changed_fields && selectedHistory.changed_fields.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Các trường đã thay đổi:
                                    </label>
                                    {renderChanges(selectedHistory)}
                                </div>
                            )}

                            {selectedHistory.old_values && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Giá trị cũ:
                                    </label>
                                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(selectedHistory.old_values, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedHistory.new_values && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Giá trị mới:
                                    </label>
                                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(selectedHistory.new_values, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
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
