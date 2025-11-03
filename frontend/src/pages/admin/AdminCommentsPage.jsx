import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Search,
  Trash2,
  Eye,
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";

export default function AdminCommentPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailComment, setDetailComment] = useState(null);

  const API_URL = (
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

  // === Lấy danh sách bình luận ===
  const loadComments = useCallback(() => {
    setLoading(true);
    return fetch(`${API_URL}/api/comments`)
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? setRows(data) : setRows([])))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [API_URL]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // === Xem chi tiết ===
  async function handleViewDetail(id) {
    try {
      const res = await fetch(`${API_URL}/api/comments/${id}`);
      if (!res.ok) throw new Error("Không thể tải chi tiết bình luận");
      const data = await res.json();
      setDetailComment(data);
      setOpenDetail(true);
    } catch (err) {
      alert(err.message || "Lỗi kết nối máy chủ");
    }
  }

  function handleCloseDetail() {
    setOpenDetail(false);
    setDetailComment(null);
  }

  // === Xoá bình luận ===
  async function handleDelete(id) {
    if (!confirm("Bạn có chắc chắn muốn xoá bình luận này?")) return;

    try {
      const res = await fetch(`${API_URL}/api/comments/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Không thể xoá bình luận.");
        return;
      }

      setRows((prev) => prev.filter((it) => it.id !== id));
      alert("✅ Đã xoá bình luận thành công!");
    } catch {
      alert("Không thể kết nối tới máy chủ.");
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
    window.open(`${API_URL}/api/comments/export?format=${format}`, "_blank");
  };

  // === Lọc dữ liệu ===
  const filtered = useMemo(() => {
    return rows.filter((r) =>
      (r.content || "").toLowerCase().includes(query.toLowerCase())
    );
  }, [rows, query]);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur border-b">
          <div className="w-full px-10 py-4 flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-semibold">Quản lý Bình luận</h1>
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
          </div>

          {/* Ô tìm kiếm */}
          <div className="w-full px-10 pb-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm bình luận..."
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
                  <Th>NGƯỜI DÙNG</Th>
                  <Th>BÀI VIẾT</Th>
                  <Th>NỘI DUNG</Th>
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
                      <td className="px-4 py-3 font-medium">{r.user_name}</td>
                      <td className="px-4 py-3">{r.post_title}</td>
                      <td className="px-4 py-3 truncate max-w-xs">{r.content}</td>
                      <td className="px-4 py-3">{formatDate(r.created_at)}</td>
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

      <CommentDetailModal
        open={openDetail}
        onClose={handleCloseDetail}
        comment={detailComment}
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
  const base =
    "inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-slate-600 hover:bg-slate-50";
  const color =
    intent === "primary"
      ? "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
      : "border-rose-200 text-rose-600 hover:bg-rose-50";
  return (
    <button className={`${base} ${color}`} title={title} onClick={onClick}>
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

/* === Modal xem chi tiết bình luận === */
function CommentDetailModal({ open, onClose, comment }) {
  if (!open || !comment) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Chi tiết bình luận
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <strong className="text-slate-700">Người dùng:</strong>{" "}
            {comment.user_name || "Ẩn danh"}
          </div>
          <div>
            <strong className="text-slate-700">Bài viết:</strong>{" "}
            {comment.post_title || "—"}
          </div>
          <div>
            <strong className="text-slate-700">Nội dung:</strong>
            <p className="text-slate-800 mt-1 whitespace-pre-line">
              {comment.content}
            </p>
          </div>
          <div>
            <strong className="text-slate-700">Ngày tạo:</strong>{" "}
            {formatDate(comment.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}
