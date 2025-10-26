import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Download,
  Search,
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  Circle,
  Image as ImageIcon,
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";


const emptyPostForm = () => ({
  title: "",
  excerpt: "",
  content: "",
  category_id: "",
  image: null,
  status: "draft",
  is_trending: false,
  category_id: "", 
});

export default function AdminPostPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyPostForm);

  const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

  // === Lấy danh sách bài viết ===
  const loadPosts = useCallback(() => {
    setLoading(true);
    return fetch(`${API_URL}/api/posts`)
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? setRows(data) : setRows([])))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [API_URL]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // === Mở modal tạo bài viết ===
  const handleOpenCreate = () => {
    setForm(emptyPostForm());
    setFormError("");
    setCreateLoading(false);
    setOpenCreate(true);
  };

  const handleCloseCreate = () => {
    setOpenCreate(false);
    setForm(emptyPostForm());
    setFormError("");
    setCreateLoading(false);
  };

  const updateFormValue = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // === Gửi bài viết mới ===
  const handleSubmitCreate = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setFormError("Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title.trim());
    formData.append("excerpt", form.excerpt.trim());
    formData.append("content", form.content.trim());
    formData.append("status", form.status);
    formData.append("is_trending", form.is_trending ? 1 : 0);
    if (form.category_id) formData.append("category_id", form.category_id);
    if (form.image) formData.append("image", form.image);

    setCreateLoading(true);
    setFormError("");

    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(", ") : "Không thể tạo bài viết mới.");
        setFormError(message);
        return;
      }

      await loadPosts();
      handleCloseCreate();
    } catch (error) {
      setFormError("Không thể kết nối tới máy chủ.");
    } finally {
      setCreateLoading(false);
    }
  };

  // === Đổi trạng thái bài viết ===
  async function handleToggleStatus(id) {
    setRows((prev) =>
      prev.map((it) => (it.id === id ? { ...it, _updating: true } : it))
    );
    try {
      const res = await fetch(`${API_URL}/api/posts/${id}/toggle`, {
        method: "PATCH",
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      setRows((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                status:
                  data?.status ||
                  (it.status === "published" ? "draft" : "published"),
                _updating: false,
              }
            : it
        )
      );
    } catch {
      alert("Không thể đổi trạng thái");
      setRows((prev) =>
        prev.map((it) => (it.id === id ? { ...it, _updating: false } : it))
      );
    }
  }

  // === Xuất file ===
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);
  useEffect(() => {
    const close = (e) =>
      !exportRef.current?.contains(e.target) && setOpenExport(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const handleExport = (format) => {
    window.open(`${API_URL}/api/posts/export?format=${format}`, "_blank");
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchQuery = (r.title || "")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [rows, query, statusFilter]);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur border-b">
          <div className="w-full px-10 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-semibold">Quản lý Bài viết</h1>
              <p className="text-xs text-slate-500 mt-1">
                Dữ liệu lấy từ Laravel API thật
              </p>
            </div>
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
                <Plus size={16} /> Thêm bài viết
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
                placeholder="Tìm kiếm bài viết..."
                className="w-full rounded-xl border bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={["all", "draft", "published"]}
              mapLabel={(v) =>
                v === "all"
                  ? "Tất cả trạng thái"
                  : v === "draft"
                  ? "Bản nháp"
                  : "Đã xuất bản"
              }
            />
          </div>
        </div>

        {/* Table */}
        <div className="w-full px-10 pb-10">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <Th>ẢNH</Th>
                  <Th>TIÊU ĐỀ</Th>
                  <Th>TRẠNG THÁI</Th>
                  <Th>NỔI BẬT</Th>
                  <Th>NGÀY TẠO</Th>
                  <Th className="text-right pr-4">THAO TÁC</Th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
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
                      <td className="px-4 py-3">
                        {r.image ? (
                          <img
                            src={`${API_URL}/images/posts/${r.image}`}
                            alt={r.title}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-16 h-16 flex items-center justify-center border rounded-lg text-slate-400">
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{r.title}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.is_trending ? "🔥" : "—"}
                      </td>
                      <td className="px-4 py-3">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <IconBtn
                            title="Đổi trạng thái"
                            intent={
                              r.status === "published" ? "primary" : "danger"
                            }
                            disabled={r._updating}
                            onClick={() => handleToggleStatus(r.id)}
                          >
                            <Eye size={16} />
                          </IconBtn>
                          <IconBtn title="Sửa" intent="primary">
                            <Edit size={16} />
                          </IconBtn>
                          <IconBtn title="Xoá" intent="danger">
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

      <CreatePostModal
        open={openCreate}
        form={form}
        onChange={updateFormValue}
        onClose={handleCloseCreate}
        onSubmit={handleSubmitCreate}
        loading={createLoading}
        error={formError}
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
function IconBtn({ children, title, intent, onClick, disabled }) {
  const base =
    "inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50";
  const color =
    intent === "primary"
      ? "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
      : "border-rose-200 text-rose-600 hover:bg-rose-50";
  return (
    <button
      className={`${base} ${color}`}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
function StatusBadge({ status }) {
  const active = status === "published";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium border ${
        active
          ? "text-emerald-700 border-emerald-200 bg-emerald-50"
          : "text-amber-700 border-amber-200 bg-amber-50"
      }`}
    >
      {active ? <CheckCircle2 size={14} /> : <Circle size={12} />}
      {active ? "Đã xuất bản" : "Bản nháp"}
    </span>
  );
}
function Select({ value, onChange, options, mapLabel }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 appearance-none"
        style={{
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
        }}
      >
        {options.map((op) => (
          <option key={op} value={op}>
            {mapLabel ? mapLabel(op) : op}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
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

/* === Modal Tạo Bài Viết === */
function CreatePostModal({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  loading,
  error,
}) {
  const [categories, setCategories] = useState([]);

  // Lấy danh mục bài viết từ API postcategories
  useEffect(() => {
    if (!open) return;
    fetch("http://127.0.0.1:8000/api/postcategories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Thêm bài viết
            </h2>
            <p className="text-sm text-slate-500">
              Nhập thông tin bài viết mới.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* Tiêu đề */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tiêu đề
            </label>
            <input
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Nhập tiêu đề bài viết"
              required
            />
          </div>

          {/* Tóm tắt */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tóm tắt
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => onChange("excerpt", e.target.value)}
              className="w-full min-h-[60px] rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Tóm tắt nội dung bài viết"
            />
          </div>

          {/* Danh mục bài viết */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Danh mục bài viết
            </label>
            <select
              value={form.category_id}
              onChange={(e) => onChange("category_id", e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              required
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nội dung */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nội dung
            </label>
            <ReactQuill
              theme="snow"
              value={form.content}
              onChange={(value) => onChange("content", value)}
              className="bg-white rounded-xl"
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link", "image"],
                  ["clean"],
                ],
              }}
            />
          </div>

          {/* Ảnh đại diện */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ảnh đại diện
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onChange("image", e.target.files[0])}
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border file:border-indigo-200 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {form.image && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={URL.createObjectURL(form.image)}
                  alt="preview"
                  className="w-20 h-20 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => onChange("image", null)}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Xoá ảnh
                </button>
              </div>
            )}
          </div>

          {/* Trạng thái + Trending */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) => onChange("status", e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="draft">Bản nháp</option>
                <option value="published">Đã xuất bản</option>
              </select>
            </div>
            <div className="flex items-center mt-6">
              <input
                id="is_trending"
                type="checkbox"
                checked={form.is_trending}
                onChange={(e) => onChange("is_trending", e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label
                htmlFor="is_trending"
                className="ml-2 text-sm text-slate-700 select-none"
              >
                Nổi bật (Trending)
              </label>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Tạo bài viết"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
