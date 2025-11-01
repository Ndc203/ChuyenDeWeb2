import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Plus,
  Download,
  Search,
  Edit,
  Trash2,
  X,
  ChevronDown,
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";

export default function AdminPostCategoriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [openExport, setOpenExport] = useState(false);

  const API_URL = (
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

  const exportRef = useRef(null);
  useEffect(() => {
    const close = (e) =>
      !exportRef.current?.contains(e.target) && setOpenExport(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const loadCategories = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/api/postcategories`)
      .then((res) => res.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [API_URL]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      r.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [rows, query]);

  function handleOpenCreate() {
    setForm({ name: "", description: "" });
    setFormError("");
    setOpenCreate(true);
  }
  function handleCloseCreate() {
    setOpenCreate(false);
    setFormError("");
  }

  async function handleSubmitCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Vui lòng nhập tên danh mục.");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/postcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormError(data.message || "Không thể tạo danh mục mới.");
        return;
      }

      await loadCategories();
      handleCloseCreate();
    } catch (err) {
      setFormError("Không thể kết nối tới máy chủ.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xoá danh mục này?")) return;

    try {
      const res = await fetch(`${API_URL}/api/postcategories/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Không thể xoá danh mục.");
        return;
      }

      setRows((prev) => prev.filter((it) => it.id !== id));
      alert("Đã xoá danh mục thành công!");
    } catch {
      alert("Không thể kết nối tới máy chủ.");
    }
  }

  async function handleEdit(id) {
    try {
      const res = await fetch(`${API_URL}/api/postcategories/${id}`);
      if (!res.ok) throw new Error("Không thể tải thông tin danh mục.");
      const data = await res.json();
      setEditCategory(data);
      setOpenEdit(true);
    } catch (err) {
      alert(err.message);
    }
  }

  function handleCloseEdit() {
    setOpenEdit(false);
    setEditCategory(null);
  }

  async function handleSubmitEdit(e) {
    e.preventDefault();
    if (!editCategory?.name.trim()) {
      alert("Vui lòng nhập tên danh mục.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/postcategories/${editCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCategory.name,
          description: editCategory.description || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Không thể cập nhật danh mục.");
        return;
      }

      alert("✅ Đã cập nhật danh mục thành công!");
      handleCloseEdit();
      loadCategories();
    } catch {
      alert("Không thể kết nối tới máy chủ.");
    }
  }

  const handleExport = (format) => {
    window.open(`${API_URL}/api/postcategories/export?format=${format}`, "_blank");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur border-b">
          <div className="w-full px-10 py-4 flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-semibold">
              Quản lý Danh mục bài viết
            </h1>
            <div className="flex items-center gap-2">
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setOpenExport((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <Download size={16} /> Xuất file
                </button>
                {openExport && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-md z-50">
                    <button
                      onClick={() => handleExport("excel")}
                      className="block px-4 py-2 text-sm hover:bg-slate-50 w-full text-left"
                    >
                      📊 Tải Excel
                    </button>
                    <button
                      onClick={() => handleExport("pdf")}
                      className="block px-4 py-2 text-sm hover:bg-slate-50 w-full text-left"
                    >
                      📄 Tải PDF
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700"
              >
                <Plus size={16} /> Thêm danh mục
              </button>
            </div>
          </div>

          {/* Bộ lọc */}
          <div className="w-full px-10 pb-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm danh mục..."
                className="w-full rounded-xl border bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full px-10 pb-10">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <Th>ID</Th>
                  <Th>TÊN DANH MỤC</Th>
                  <Th>MÔ TẢ</Th>
                  <Th>NGÀY TẠO</Th>
                  <Th className="text-right pr-4">THAO TÁC</Th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}
                {!loading &&
                  filtered.map((r, i) => (
                    <tr
                      key={r.id}
                      className={i % 2 ? "bg-white" : "bg-slate-50/50"}
                    >
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3">{r.description || "—"}</td>
                      <td className="px-4 py-3">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <IconBtn
                            title="Sửa"
                            intent="warning"
                            onClick={() => handleEdit(r.id)}
                          >
                            <Edit size={16} />
                          </IconBtn>
                          <IconBtn
                            title="Xoá"
                            intent="danger"
                            onClick={() => handleDelete(r.id)}
                          >
                            <Trash2 size={16} />
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateCategoryModal
        open={openCreate}
        onClose={handleCloseCreate}
        onSubmit={handleSubmitCreate}
        form={form}
        setForm={setForm}
        loading={createLoading}
        error={formError}
      />
      <EditCategoryModal
        open={openEdit}
        onClose={handleCloseEdit}
        category={editCategory}
        setCategory={setEditCategory}
        onSubmit={handleSubmitEdit}
      />
    </div>
  );
}

/* === COMPONENTS === */
function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

function IconBtn({ children, title, intent, onClick }) {
  const color =
    intent === "warning"
      ? "border-amber-200 text-amber-600 hover:bg-amber-50"
      : "border-rose-200 text-rose-600 hover:bg-rose-50";
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-slate-600 ${color}`}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function formatDate(s) {
  const d = new Date(s);
  if (Number.isNaN(+d)) return "";
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/* === MODALS === */
function CreateCategoryModal({ open, onClose, onSubmit, form, setForm, loading, error }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Thêm danh mục</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
            <X size={18} />
          </button>
        </div>
        {error && (
          <div className="mb-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên danh mục</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full min-h-[60px] rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Mô tả ngắn về danh mục"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Tạo danh mục"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCategoryModal({ open, onClose, category, setCategory, onSubmit }) {
  if (!open || !category) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Sửa danh mục</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên danh mục</label>
            <input
              value={category.name}
              onChange={(e) => setCategory({ ...category, name: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea
              value={category.description || ""}
              onChange={(e) => setCategory({ ...category, description: e.target.value })}
              className="w-full min-h-[60px] rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
