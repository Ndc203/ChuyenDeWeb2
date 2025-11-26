import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import axiosClient from "../../api/axiosClient"; // Import axiosClient

// Lấy URL ảnh để hiển thị (nếu cần hiển thị ảnh preview từ server)
const IMAGE_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// === Form mặc định ===
const emptyPostForm = () => ({
  title: "",
  excerpt: "",
  content: "",
  post_category_id: "",
  image: null,
  status: "draft",
  is_trending: false,
});

export default function AdminPostPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyPostForm());

  const [openDetail, setOpenDetail] = useState(false);
  const [detailPost, setDetailPost] = useState(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editPost, setEditPost] = useState(null);

  const [openHistory, setOpenHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);

  // === 1. Load danh sách bài viết (Dùng axiosClient) ===
  const loadPosts = useCallback(() => {
    setLoading(true);
    axiosClient.get('/posts')
      .then((res) => {
        // Xử lý data trả về (array hoặc { data: [] })
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setRows(data);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // === 2. Xem chi tiết (Dùng axiosClient) ===
  async function handleViewDetail(id) {
    try {
      const res = await axiosClient.get(`/posts/${id}`);
      setDetailPost(res.data);
      setOpenDetail(true);
    } catch (err) {
      alert("Không thể tải chi tiết bài viết");
    }
  }
  function handleCloseDetail() {
    setOpenDetail(false);
    setDetailPost(null);
  }

  // === 3. Lịch sử chỉnh sửa (Dùng axiosClient) ===
  async function handleViewHistory(id) {
    try {
      const res = await axiosClient.get(`/posts/${id}/versions`);
      setHistoryData(res.data);
      setSelectedPostId(id);
      setOpenHistory(true);
    } catch (err) {
      alert("Không thể tải lịch sử chỉnh sửa.");
    }
  }

  // === 4. Tạo bài viết (Dùng axiosClient + FormData) ===
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
  const updateFormValue = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError("Vui lòng nhập tiêu đề bài viết.");
      return;
    }
    if (!form.post_category_id) {
      setFormError("Vui lòng chọn danh mục bài viết.");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title.trim());
    formData.append("excerpt", form.excerpt.trim());
    formData.append("content", form.content.trim());
    formData.append("status", form.status);
    formData.append("is_trending", form.is_trending ? 1 : 0);
    if (form.post_category_id) formData.append("post_category_id", Number(form.post_category_id));
    if (form.image) formData.append("image", form.image);

    // Logic check quyền admin ở frontend (lưu ý backend vẫn cần check lại)
    const user = JSON.parse(localStorage.getItem("userData") || "{}");
    if (user.role !== "admin") {
      formData.set("status", "draft");
      formData.set("is_trending", 0);
    }

    setCreateLoading(true);
    setFormError("");

    try {
      // axiosClient tự động xử lý header Multipart/form-data
      await axiosClient.post('/posts', formData);
      
      await loadPosts();
      handleCloseCreate();
    } catch (err) {
      const message = err.response?.data?.message || "Không thể tạo bài viết mới.";
      setFormError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  // === 5. Xóa bài viết (Dùng axiosClient) ===
  async function handleDelete(id) {
    if (!confirm("Bạn có chắc chắn muốn xoá bài viết này?")) return;

    try {
      await axiosClient.delete(`/posts/${id}`);
      setRows((prev) => prev.filter((it) => it.id !== id));
      alert("Đã xoá bài viết thành công!");
    } catch (err) {
      const message = err.response?.data?.message || "Không thể xoá bài viết.";
      alert(message);
    }
  }

  // === 6. Sửa bài viết (Get data) ===
  async function handleEdit(id) {
    try {
      const res = await axiosClient.get(`/posts/${id}`);
      setEditPost(res.data);
      setOpenEdit(true);
    } catch (err) {
      alert("Lỗi kết nối tới máy chủ.");
    }
  }
  const handleCloseEdit = () => {
    setOpenEdit(false);
    setEditPost(null);
  };

  // === 7. Xuất file (Dùng Blob) ===
  useEffect(() => {
    const close = (e) =>
      !exportRef.current?.contains(e.target) && setOpenExport(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleExport = async (format) => {
    try {
      setOpenExport(false);
      const response = await axiosClient.get(`/posts/export?format=${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `posts_export.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Export failed", error);
      alert("Xuất file thất bại.");
    }
  };

  // === Filter (Giữ nguyên) ===
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
      <AdminSidebar />
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur border-b">
          <div className="w-full px-10 py-4 flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-semibold">
              Quản lý Bài viết
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Không có bài viết nào.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, i) => {
                    const user = JSON.parse(
                      localStorage.getItem("userData") || "{}"
                    );
                    const isOwner =
                      user.role === "admin" ||
                      Number(r.user_id) === Number(user.user_id);

                    return (
                      <tr
                        key={r.id}
                        className={i % 2 ? "bg-white" : "bg-slate-50/50"}
                      >
                        <td className="px-4 py-3">
                          {r.image ? (
                            <img
                              src={`${IMAGE_BASE_URL}/images/posts/${r.image}`}
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
                        <td className="px-4 py-3">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <IconBtn
                              title="Xem chi tiết"
                              intent="primary"
                              onClick={() => handleViewDetail(r.id)}
                            >
                              <Eye size={16} />
                            </IconBtn>
                            <IconBtn
                              title="Lịch sử chỉnh sửa"
                              intent="info"
                              onClick={() => handleViewHistory(r.id)}
                            >
                              <Clock size={16} />
                            </IconBtn>
                            {isOwner ? (
                              <>
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
                              </>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                Không có quyền
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreatePostModal
        open={openCreate}
        form={form}
        onChange={updateFormValue}
        onClose={handleCloseCreate}
        onSubmit={handleSubmitCreate}
        loading={createLoading}
        error={formError}
      />
      <PostDetailModal
        open={openDetail}
        onClose={handleCloseDetail}
        post={detailPost}
      />
      <EditPostModal
        open={openEdit}
        onClose={handleCloseEdit}
        post={editPost}
        onUpdated={loadPosts}
      />
      <HistoryModal
        open={openHistory}
        onClose={() => setOpenHistory(false)}
        history={historyData}
        postId={selectedPostId}
      />
    </div>
  );
}

/* === CÁC COMPONENT PHỤ (Th, IconBtn, StatusBadge, Select, formatDate) GIỮ NGUYÊN === */
function Th({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}
function IconBtn({ children, title, intent, onClick, disabled }) {
  const base = "inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50";
  const color = intent === "primary" ? "border-indigo-200 text-indigo-600 hover:bg-indigo-50" : intent === "danger" ? "border-rose-200 text-rose-600 hover:bg-rose-50" : "border-gray-200 text-gray-600 hover:bg-gray-50";
  return (
    <button className={`${base} ${color}`} title={title} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
function StatusBadge({ status }) {
  const active = status === "published";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium border ${active ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-amber-700 border-amber-200 bg-amber-50"}`}>
      {active ? <CheckCircle2 size={14} /> : <Circle size={12} />}
      {active ? "Đã xuất bản" : "Bản nháp"}
    </span>
  );
}
function Select({ value, onChange, options, mapLabel }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 appearance-none">
        {options.map((op) => <option key={op} value={op}>{mapLabel ? mapLabel(op) : op}</option>)}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
function formatDate(s) {
  const d = new Date(s);
  if (Number.isNaN(+d)) return "";
  return d.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

/* === Modal Tạo Bài Viết === */
function CreatePostModal({ open, onClose, form, onChange, onSubmit, loading, error }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!open) return;
    // Dùng axiosClient để load danh mục
    axiosClient.get("/postcategories")
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Thêm bài viết</h2>
            <p className="text-sm text-slate-500">Nhập thông tin bài viết mới.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>

        {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* Fields... (Giữ nguyên) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tiêu đề</label>
            <input value={form.title} onChange={(e) => onChange("title", e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tóm tắt</label>
            <textarea value={form.excerpt} onChange={(e) => onChange("excerpt", e.target.value)} className="w-full min-h-[60px] rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Danh mục</label>
            <select value={form.post_category_id} onChange={(e) => onChange("post_category_id", e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" required>
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => <option key={cat.post_category_id} value={cat.post_category_id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nội dung</label>
            <ReactQuill theme="snow" value={form.content} onChange={(value) => onChange("content", value)} className="bg-white rounded-xl" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ảnh đại diện</label>
            <input type="file" accept="image/*" onChange={(e) => onChange("image", e.target.files[0])} className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border file:border-indigo-200 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100" />
            {form.image && <img src={URL.createObjectURL(form.image)} alt="preview" className="mt-2 w-20 h-20 object-cover rounded-lg border" />}
          </div>
          
          {/* Footer Buttons */}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50">Huỷ</button>
            <button type="submit" disabled={loading} className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50">{loading ? "Đang lưu..." : "Tạo bài viết"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* === Modal Chi Tiết === */
function PostDetailModal({ open, onClose, post }) {
  if (!open || !post) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Chi tiết bài viết</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="space-y-4 text-sm">
          <div><strong className="block text-slate-700 mb-1">Tiêu đề:</strong><p>{post.title}</p></div>
          {post.image && (
            <div>
              <strong className="block text-slate-700 mb-1">Ảnh:</strong>
              <img src={`${IMAGE_BASE_URL}/images/posts/${post.image}`} alt={post.title} className="w-full max-h-60 object-cover rounded-xl border" />
            </div>
          )}
          <div><strong className="block text-slate-700 mb-1">Tóm tắt:</strong><p>{post.excerpt}</p></div>
          <div><strong className="block text-slate-700 mb-1">Nội dung:</strong><div dangerouslySetInnerHTML={{ __html: post.content }} /></div>
        </div>
      </div>
    </div>
  );
}

/* === Modal Sửa (Updated Axios) === */
function EditPostModal({ open, onClose, post, onUpdated }) {
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", status: "draft", post_category_id: "", image: null, is_trending: false });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!open) return;
    axiosClient.get("/postcategories").then((res) => setCategories(res.data)).catch(() => setCategories([]));
  }, [open]);

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title || "",
        excerpt: post.excerpt || "",
        content: post.content || "",
        status: post.status || "draft",
        post_category_id: post.post_category_id || "",
        is_trending: !!post.is_trending,
        image: null,
      });
    }
  }, [post]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("excerpt", form.excerpt);
      formData.append("content", form.content);
      formData.append("status", form.status);
      formData.append("post_category_id", Number(form.post_category_id));
      formData.append("is_trending", form.is_trending ? 1 : 0);
      if (form.image) formData.append("image", form.image);
      formData.append("_method", "PUT"); // Spoofing Method

      await axiosClient.post(`/posts/${post.id}`, formData); // Dùng POST vì có FormData + _method

      alert("✅ Cập nhật bài viết thành công!");
      onUpdated();
      onClose();
    } catch (err) {
      alert("Không thể cập nhật bài viết.");
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">✏️ Sửa bài viết</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-600">Tiêu đề</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
          <div><label className="block text-sm font-medium text-slate-600">Tóm tắt</label><textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-slate-600">Danh mục</label><select value={form.post_category_id} onChange={(e) => setForm({ ...form, post_category_id: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" required>{categories.map((cat) => <option key={cat.post_category_id} value={cat.post_category_id}>{cat.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-slate-600">Nội dung</label><ReactQuill value={form.content} onChange={(value) => setForm({ ...form, content: value })} theme="snow" /></div>
          <div><label className="block text-sm font-medium text-slate-600">Ảnh mới</label><input type="file" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} className="w-full border rounded-lg px-3 py-2" accept="image/*" /></div>
          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50">Huỷ</button>
            <button type="submit" className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* === Modal Lịch sử === */
function HistoryModal({ open, onClose, history, postId }) {
  if (!open) return null;

  async function handleRestore(versionId) {
    if (!confirm("Bạn có chắc chắn muốn khôi phục phiên bản này?")) return;
    try {
      await axiosClient.post(`/posts/${postId}/restore/${versionId}`);
      alert("✅ Đã khôi phục phiên bản bài viết thành công!");
      onClose();
    } catch (err) {
      alert("Không thể khôi phục.");
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">🕒 Lịch sử chỉnh sửa</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
        {/* Table History (Giữ nguyên) */}
        {!history || history.length === 0 ? (
          <p className="text-center text-slate-500">Không có lịch sử chỉnh sửa.</p>
        ) : (
          <table className="w-full text-sm border rounded-xl overflow-hidden">
            <thead className="bg-slate-50">
              <tr><th className="px-4 py-2 text-left">Tiêu đề</th><th className="px-4 py-2">Người sửa</th><th className="px-4 py-2">Ngày sửa</th><th className="px-4 py-2 text-right">Thao tác</th></tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-2">{h.title}</td>
                  <td className="px-4 py-2 text-center">{h.user_name || "—"}</td>
                  <td className="px-4 py-2 text-center">{formatDate(h.updated_at)}</td>
                  <td className="px-4 py-2 text-right"><button onClick={() => handleRestore(h.id)} className="text-indigo-600 hover:underline">Khôi phục</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}