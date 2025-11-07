import { useState, useEffect } from "react";
import { Search, Star, ThumbsUp, Trash2, Check, X } from "lucide-react";
import axios from "axios";
import AdminSidebar from "../layout/AdminSidebar.jsx";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [currentPage, searchTerm, statusFilter, ratingFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/reviews", {
        params: {
          page: currentPage,
          search: searchTerm,
          status: statusFilter,
          rating: ratingFilter,
          per_page: 10,
        },
      });
      setReviews(response.data.data);
      setTotalPages(response.data.last_page);
      setTotalReviews(response.data.total);
    } catch (error) {
      console.error("Lỗi khi tải đánh giá:", error);
      alert("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reviewId, newStatus) => {
    try {
      await axios.patch(
        `http://127.0.0.1:8000/api/reviews/${reviewId}/status`,
        { status: newStatus }
      );
      alert("Cập nhật trạng thái thành công");
      fetchReviews();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      alert("Không thể cập nhật trạng thái");
    }
  };

  const deleteReview = async (reviewId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/api/reviews/${reviewId}`);
      alert("Xóa đánh giá thành công");
      fetchReviews();
    } catch (error) {
      console.error("Lỗi khi xóa đánh giá:", error);
      alert("Không thể xóa đánh giá");
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { label: "Đã duyệt", class: "bg-green-100 text-green-700" },
      pending: { label: "Chờ duyệt", class: "bg-yellow-100 text-yellow-700" },
      rejected: { label: "Từ chối", class: "bg-red-100 text-red-700" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />

      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur border-b">
          <div className="w-full px-10 py-4">
            <h1 className="text-lg md:text-xl font-semibold">Quản lý Đánh giá</h1>
            <p className="text-xs text-slate-500 mt-1">
              Hiển thị {reviews.length} / {totalReviews} đánh giá
            </p>
          </div>

          {/* Filters */}
          <div className="w-full px-10 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Tìm đánh giá..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>

              {/* Rating Filter */}
              <select
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">Tất cả cao</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews List - Table Format */}
        <div className="w-full px-10 pb-10 pt-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-slate-500">Đang tải...</div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-slate-500">Không có đánh giá nào</div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                    Đánh giá
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                    Nội dung
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-right pr-4">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review, i) => (
                  <tr
                    key={review.review_id}
                    className={i % 2 ? "bg-white" : "bg-slate-50/50"}
                  >
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-xs overflow-hidden flex-shrink-0">
                          {review.product?.main_image_url ? (
                            <img
                              src={review.product.main_image_url}
                              alt={review.product.product_name}
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
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800 truncate">
                            {review.product?.product_name || "N/A"}
                          </div>
                          <div className="text-xs text-slate-500">
                            ID: {review.product?.product_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-indigo-600">
                            {review.user?.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-700 truncate">
                            {review.user?.name || "Anonymous"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDate(review.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {renderStars(review.rating)}
                        <span className="text-xs text-slate-600">
                          {review.rating}/5
                        </span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <ThumbsUp size={12} />
                          <span className="text-xs">{review.helpful_count || 0}</span>
                        </div>
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {review.comment}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">{getStatusBadge(review.status)}</td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {review.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                updateStatus(review.review_id, "approved")
                              }
                              className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-green-600 hover:bg-green-100"
                              title="Duyệt"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() =>
                                updateStatus(review.review_id, "rejected")
                              }
                              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 hover:bg-slate-50"
                              title="Từ chối"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {review.status === "approved" && (
                          <button
                            onClick={() =>
                              updateStatus(review.review_id, "rejected")
                            }
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 hover:bg-slate-50"
                            title="Ẩn"
                          >
                            <X size={16} />
                          </button>
                        )}
                        {review.status === "rejected" && (
                          <button
                            onClick={() =>
                              updateStatus(review.review_id, "approved")
                            }
                            className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-green-600 hover:bg-green-100"
                            title="Duyệt"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteReview(review.review_id)}
                          className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-rose-600 hover:bg-rose-100"
                          title="Xóa"
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
        )}

          {/* Pagination */}
          {!loading && reviews.length > 0 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Trước
              </button>
              <span className="text-sm text-slate-600">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
