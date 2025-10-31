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
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";

const emptyProductForm = () => ({
  name: "",
  brand: "",
  price: "",
  discount: "",
  category: "",
  stock: "",
  status: "Còn hàng",
  rating: "0",
  reviews: "0",
  badges: [],
});

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = (
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

  // Load products từ API
  const loadProducts = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
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
  }, [API_URL]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Lọc sản phẩm
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchQuery = (r.name || "")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchCategory =
        categoryFilter === "all" || r.category === categoryFilter;
      return matchQuery && matchCategory;
    });
  }, [rows, query, categoryFilter]);

  // Danh sách danh mục
  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.category));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

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
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "Tất cả danh mục" : cat}
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
                {!loading &&
                  filtered.map((product, i) => (
                    <tr
                      key={product.id}
                      className={i % 2 ? "bg-white" : "bg-slate-50/50"}
                    >
                      {/* Sản phẩm */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-xs overflow-hidden">
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
                            <div className="font-medium text-slate-800">
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
                        {product.category}
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

                      {/* Trạng thái */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {product.badges.map((badge) => (
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
                            className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-slate-600 hover:bg-slate-50"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            title="Sửa"
                            className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-100"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            title="Xóa"
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
    </div>
  );
}

