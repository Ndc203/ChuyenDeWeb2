import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Download,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  History,
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";
import axiosClient from "../../api/axiosClient"; // Import axiosClient

// Helper formating (đưa ra ngoài component để tái sử dụng)
const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Modal/Confirm
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const [categoryOptions, setCategoryOptions] = useState([
    { value: "all", label: "Tất cả danh mục" },
  ]);

  // 1. Load products từ API dùng Axios
  const loadProducts = useCallback(() => {
    setLoading(true);
    axiosClient.get('/products')
      .then((res) => {
        // Tùy cấu trúc backend trả về: res.data (nếu là array) hoặc res.data.data (nếu có pagination)
        const data = res.data.data || res.data; 
        if (Array.isArray(data)) {
          setRows(data);
        } else {
          setRows([]);
        }
      })
      .catch((error) => {
        console.error("Error loading products:", error);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Xem chi tiết sản phẩm
  const handleViewDetail = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  // Click nút xóa
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  // 2. Xác nhận xóa dùng Axios
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      // Dùng axiosClient.delete (Tự động gắn Token)
      // Lưu ý: Dùng hashed_id như logic cũ của bạn
      await axiosClient.delete(`/products/${productToDelete.hashed_id}`);

      // Xóa thành công
      loadProducts(); // Reload lại bảng
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      alert("Xóa sản phẩm thành công!");

    } catch (error) {
      console.error("Error deleting product:", error);
      const message = error.response?.data?.message || "Không thể xóa sản phẩm.";
      alert(message);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 3. Load danh mục dùng Axios
  useEffect(() => {
    // Axios có cơ chế CancelToken, nhưng để đơn giản ta dùng cờ cancelled như cũ cũng ổn
    let cancelled = false;

    axiosClient.get('/categories')
      .then((res) => {
        if (cancelled) return;
        const data = res.data; // Axios trả data ở đây

        if (!Array.isArray(data)) {
          // Log nhẹ để debug nếu data trả về lạ
          console.warn("Categories response is not an array:", data); 
          return;
        }

        // Logic map danh mục giữ nguyên vì nó khá phức tạp để xử lý ID/Value
        const map = new Map();
        data.forEach((category) => {
          const rawId =
            category?.category_id ??
            category?.id ??
            (typeof category?.value !== "undefined" ? category.value : null);
          if (rawId === undefined || rawId === null) {
            return;
          }

          const value = rawId.toString();
          if (map.has(value)) {
            return;
          }

          const label = category?.name || category?.label || `Danh muc #${value}`;
          map.set(value, label);
        });

        setCategoryOptions([
          { value: "all", label: "Tất cả danh mục" },
          ...Array.from(map.entries()).map(([value, label]) => ({
            value,
            label,
          })),
        ]);
      })
      .catch((err) => {
        console.error("Error loading categories:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Logic lọc sản phẩm (Giữ nguyên)
  const getProductCategoryValue = (product) => {
    if (!product) return "";
    if (product.category_id !== undefined && product.category_id !== null) {
      return product.category_id.toString();
    }
    // Nếu API trả về object category (e.g. product.category.id)
    if (typeof product.category === 'object' && product.category?.id) {
        return product.category.id.toString();
    }
    // Nếu API trả về tên category dạng string
    if (product.category) {
      return product.category.toString();
    }
    return "";
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchQuery = (r.name || "")
        .toLowerCase()
        .includes(query.toLowerCase());
        
      // Logic lọc danh mục: so sánh ID hoặc Tên
      // Lưu ý: Nếu categoryFilter là ID (số), mà product.category là Tên (chữ) thì sẽ lỗi logic.
      // Bạn cần đảm bảo API trả về category_id hoặc logic lọc này phải khớp nhau.
      const matchCategory =
        categoryFilter === "all" ||
        getProductCategoryValue(r) === categoryFilter;

      return matchQuery && matchCategory;
    });
  }, [rows, query, categoryFilter]);


  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />

      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur border-b">
          <div className="w-full px-10 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-semibold">
                Quản lý Sản phẩm
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Hiển thị {filtered.length} / {rows.length} sản phẩm
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">
                <Download size={16} /> Xuất file
              </button>
              <button
                onClick={() => navigate("/admin/products/add")}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700"
              >
                <Plus size={16} /> Thêm sản phẩm
              </button>
            </div>
          </div>

          {/* Bộ lọc */}
          <div className="w-full px-10 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="w-full rounded-xl border bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {categoryOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="w-full px-10 pb-10 pt-6">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                    Giá bán
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                    Đánh giá
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-right pr-4">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                   <tr>
                   <td colSpan={7} className="p-6 text-center text-slate-500">
                     Không tìm thấy sản phẩm nào.
                   </td>
                 </tr>
                )}
                {!loading &&
                  filtered.map((product, i) => (
                    <tr
                      key={product.id}
                      className={i % 2 ? "bg-white" : "bg-slate-50/50"}
                    >
                      {/* Sản phẩm */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-xs overflow-hidden shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.parentElement.innerHTML = "IMG";
                                }}
                              />
                            ) : (
                              "IMG"
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 line-clamp-2 max-w-[200px]">
                              {product.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {product.brand}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Giá bán */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">
                          {product.discount > 0
                            ? formatPrice(product.final_price)
                            : formatPrice(product.price)}
                        </div>
                        {product.discount > 0 && (
                          <div className="text-xs text-slate-400 line-through">
                            {formatPrice(product.price)}
                          </div>
                        )}
                        {product.discount > 0 && (
                          <div className="text-xs text-rose-600">
                            Giảm {product.discount}%
                          </div>
                        )}
                      </td>

                      {/* Danh mục */}
                      <td className="px-4 py-3 text-slate-600">
                         {/* Xử lý hiển thị nếu category là object hoặc string */}
                         {typeof product.category === 'object' ? product.category?.name : product.category}
                      </td>

                      {/* Tồn kho */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {product.stock}
                        </div>
                        <div className="text-xs text-slate-500">
                          {product.stock_status}
                        </div>
                      </td>

                      {/* Trạng thái (Badges) */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                          {product.badges && product.badges.map((badge) => (
                            <span
                              key={badge}
                              className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${
                                badge === "HOT"
                                  ? "bg-rose-100 text-rose-700"
                                  : badge === "MỚI"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Đánh giá */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          <span className="font-medium text-slate-800">
                            {product.rating}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({product.reviews})
                          </span>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(product)}
                            className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-slate-600 hover:bg-slate-50"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            title="Lịch sử thay đổi"
                            onClick={() => navigate(`/admin/products/${product.hashed_id}/history`)}
                            className="inline-flex items-center justify-center rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-purple-600 hover:bg-purple-100"
                          >
                            <History size={16} />
                          </button>
                          <button
                            title="Sửa"
                            onClick={() => navigate(`/admin/products/edit/${product.hashed_id}`)}
                            className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-100"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            title="Xóa"
                            onClick={() => handleDeleteClick(product)}
                            className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-rose-600 hover:bg-rose-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal xem chi tiết sản phẩm */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-slate-800">
                Chi tiết Sản phẩm
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Ảnh sản phẩm */}
              {selectedProduct.image && (
                <div className="flex justify-center bg-slate-50 p-4 rounded-lg">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="max-w-full h-auto max-h-64 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Tên sản phẩm
                  </label>
                  <p className="text-slate-800 font-medium">
                    {selectedProduct.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Thương hiệu
                  </label>
                  <p className="text-slate-800">{selectedProduct.brand || "—"}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Danh mục
                  </label>
                  <p className="text-slate-800">
                     {typeof selectedProduct.category === 'object' ? selectedProduct.category?.name : selectedProduct.category || "—"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Giá bán
                  </label>
                  <p className="text-slate-800 font-semibold">
                    {formatPrice(selectedProduct.price)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Giảm giá
                  </label>
                  <p className="text-slate-800">
                    {selectedProduct.discount > 0
                      ? `${selectedProduct.discount}%`
                      : "Không"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Giá sau giảm
                  </label>
                  <p className="text-green-600 font-semibold">
                    {formatPrice(selectedProduct.final_price)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Tồn kho
                  </label>
                  <p className="text-slate-800">{selectedProduct.stock}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Trạng thái
                  </label>
                  <p className="text-slate-800">{selectedProduct.stock_status}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Đánh giá
                  </label>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-slate-800">
                      {selectedProduct.rating} ({selectedProduct.reviews} đánh giá)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Badges
                  </label>
                  <div className="flex gap-1">
                    {selectedProduct.badges && selectedProduct.badges.length > 0 ? (
                      selectedProduct.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded"
                        >
                          {badge}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              {selectedProduct.description && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Mô tả
                  </label>
                  <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* Thời gian */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Ngày tạo
                  </label>
                  <p className="text-slate-600 text-sm">
                    {selectedProduct.created_at}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Cập nhật lần cuối
                  </label>
                  <p className="text-slate-600 text-sm">
                    {selectedProduct.updated_at}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3 z-10">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  navigate(`/admin/products/edit/${selectedProduct.hashed_id}`);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog xác nhận xóa */}
      {showDeleteConfirm && productToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Xác nhận xóa sản phẩm
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Bạn có chắc chắn muốn xóa sản phẩm này?
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="font-medium text-slate-800">{productToDelete.name}</p>
                <p className="text-sm text-slate-600 mt-1">
                  Thương hiệu: {productToDelete.brand || "—"}
                </p>
              </div>

              <p className="text-sm text-red-600 mb-4">
                ⚠️ Hành động này không thể hoàn tác!
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setProductToDelete(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Đang xóa..." : "Xóa sản phẩm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}