import React, { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";

export default function AdminStockPage() {
  const [activeTab, setActiveTab] = useState("list"); // "list" hoặc "history"
  const [stocks, setStocks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [updateType, setUpdateType] = useState("import"); // "import" hoặc "export"
  const [updateQuantity, setUpdateQuantity] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const API_URL = (
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

  // Load danh sách tồn kho
  useEffect(() => {
    loadStocks();
    loadHistory();
  }, []);

  const loadStocks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/stock`);
      const data = await response.json();
      setStocks(data);
    } catch (error) {
      console.error("Error loading stocks:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stock/history`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  // Filter stocks
  const filteredStocks = stocks.filter((stock) => {
    const query = searchQuery.toLowerCase();
    return (
      stock.name.toLowerCase().includes(query) ||
      (stock.brand && stock.brand.toLowerCase().includes(query)) ||
      (stock.category && stock.category.toLowerCase().includes(query))
    );
  });

  // Filter history
  const filteredHistory = history.filter((item) =>
    item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status, color) => {
    const colors = {
      green: "bg-green-100 text-green-700",
      yellow: "bg-yellow-100 text-yellow-700",
      red: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`px-2 py-1 rounded-md text-xs font-medium ${colors[color]}`}
      >
        {status}
      </span>
    );
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct || !updateQuantity) {
      alert("Vui lòng chọn sản phẩm và nhập số lượng");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${API_URL}/api/stock/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          product_id: selectedProduct.hashed_id || selectedProduct.id, // Use hashed_id for security
          type: updateType,
          quantity: parseInt(updateQuantity),
          note: updateNote,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setShowUpdateModal(false);
        setSelectedProduct(null);
        setUpdateQuantity("");
        setUpdateNote("");
        loadStocks();
        loadHistory();
      } else {
        alert(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Không thể kết nối tới máy chủ");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />
      <main className="flex-1 w-full min-w-0">
        <div className="w-full px-6 md:px-10 py-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Quản lý Tồn kho
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Theo dõi và quản lý tồn kho sản phẩm
              </p>
            </div>
            <button
              onClick={() => setShowUpdateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Cập nhật tồn kho
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "list"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Danh sách Tồn kho
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "history"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Lịch sử Nhập/Xuất
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 mt-2">Đang tải...</p>
            </div>
          ) : activeTab === "list" ? (
            // Tab Danh sách Tồn kho
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Thương hiệu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Danh mục
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Tồn kho hiện tại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Tồn kho tối thiểu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Cập nhật cuối
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredStocks.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        Không tìm thấy sản phẩm nào
                      </td>
                    </tr>
                  ) : (
                    filteredStocks.map((stock) => (
                      <tr key={stock.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {stock.image && (
                              <img
                                src={stock.image}
                                alt={stock.name}
                                className="w-10 h-10 rounded object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            )}
                            <span className="font-medium text-slate-900">
                              {stock.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {stock.brand}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {stock.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {stock.current_stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {stock.min_stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(stock.status, stock.status_color)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-sm">
                          {stock.last_updated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedProduct(stock);
                              setShowUpdateModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Cập nhật
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            // Tab Lịch sử Nhập/Xuất
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Số lượng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Ngày
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Ghi chú
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Người thực hiện
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        Chưa có lịch sử nhập/xuất
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                          {item.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              item.type === "import"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.type === "import" ? "Nhập kho" : "Xuất kho"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-sm">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {item.note}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-sm">
                          {item.user}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Cập nhật tồn kho */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">
                Cập nhật tồn kho
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Chọn sản phẩm */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sản phẩm
                </label>
                <select
                  value={selectedProduct?.id || ""}
                  onChange={(e) => {
                    const product = stocks.find(
                      (s) => s.id === parseInt(e.target.value)
                    );
                    setSelectedProduct(product);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {stocks.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.name} (Tồn: {stock.current_stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Loại giao dịch */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Loại giao dịch
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="import"
                      checked={updateType === "import"}
                      onChange={(e) => setUpdateType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Nhập kho</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="export"
                      checked={updateType === "export"}
                      onChange={(e) => setUpdateType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Xuất kho</span>
                  </label>
                </div>
              </div>

              {/* Số lượng */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số lượng
                </label>
                <input
                  type="number"
                  value={updateQuantity}
                  onChange={(e) => setUpdateQuantity(e.target.value)}
                  placeholder="Nhập số lượng"
                  min="1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Nhập ghi chú (tùy chọn)"
                  rows="3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedProduct(null);
                  setUpdateQuantity("");
                  setUpdateNote("");
                }}
                disabled={updating}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateStock}
                disabled={updating || !selectedProduct || !updateQuantity}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Đang xử lý..." : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
