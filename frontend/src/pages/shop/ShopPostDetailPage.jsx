import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import ShopHeader from "../../components/shop/ShopHeader";
import "react-quill-new/dist/quill.snow.css";

// --- Helper decode HTML ---
function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

// --- Normalize utilities ---
function normalizeFullWidthNumbers(s) {
  if (typeof s !== "string") return s;
  return s.replace(/[\uFF10-\uFF19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
}

// Remove all unicode spaces (including full-width U+3000) and then trim
function stripUnicodeSpaces(s) {
  if (!s) return "";
  // replace non-breaking spaces, full-width spaces and other unicode space separators
  return s.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, "").trim();
}

// Check if HTML content is effectively empty (e.g. "<p><br></p>" or only spaces & tags)
function isHtmlEmpty(html) {
  if (!html) return true;
  // Create element and get text content
  const el = document.createElement("div");
  el.innerHTML = html;
  const text = el.textContent || el.innerText || "";
  // Normalize full-width spaces and other unicode spaces
  const cleaned = stripUnicodeSpaces(text);
  return cleaned.length === 0;
}

export default function ShopPostDetailPage() {
  const { id } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [commentContent, setCommentContent] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingUpdatedAt, setEditingUpdatedAt] = useState(null);

  // disable states to prevent duplicate actions
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // CHUẨN KEY LOCAL STORAGE
  const userData = JSON.parse(localStorage.getItem("userInfo") || "null");
  const authToken = localStorage.getItem("authToken");

  // --- API helper (improved error handling) ---
  const fetchJSON = async (url, options = {}) => {
    const res = await fetch(url, options);
    const type = res.headers.get("content-type") || "";

    let data = null;

    if (type.includes("application/json")) {
      data = await res.json();
    } else {
      throw { message: "API không trả JSON (Lỗi server)", status: res.status };
    }

    if (!res.ok) {
      // return structured error to caller
      throw {
        message: data?.message || "Lỗi API",
        errors: data?.errors || null,
        status: res.status,
      };
    }

    return data;
  };

  // --- FETCH bài viết ---
  const fetchPost = async () => {
    try {
      const data = await fetchJSON(`http://127.0.0.1:8000/api/posts/${id}`);
      setPost(data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- FETCH comments ---
  const fetchComments = async () => {
    try {
      const data = await fetchJSON(
        `http://127.0.0.1:8000/api/posts/${id}/comments`
      );

      // API may return array directly or { data: [...] }
      const list = Array.isArray(data) ? data : data?.data || [];

      // Normalize: ensure id, parent_id, updated_at exist
      const normalized = list.map((c) => ({
        ...c,
        id: c.id ?? c.comment_id,
        parent_id: c.parent_id ?? null,
        updated_at: c.updated_at ?? c.created_at ?? null,
      }));

      setComments(normalized);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchPost();
      await fetchComments();
      setLoading(false);
    })();
  }, [id]);

  // ----------------------------------------------------------------
  // BUILD TREE — FIXED
  // ----------------------------------------------------------------
  const buildCommentTree = (list, parentId = null, visited = new Set()) =>
    list
      .filter((c) => (c.parent_id === parentId || String(c.parent_id) === String(parentId)))
      .map((c) => {
        if (visited.has(c.id)) {
          // vòng lặp phát hiện — ngắt để tránh infinite recursion
          return { ...c, children: [] };
        }
        visited.add(c.id);
        return { ...c, children: buildCommentTree(list, c.id, visited) };
      });

  const commentTree = buildCommentTree(comments);

  // --------------------------------------------------------------------
  // ADD COMMENT
  // --------------------------------------------------------------------
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!authToken) return alert("Bạn cần đăng nhập để bình luận.");

    // normalize pasted full-width numbers (defensive)
    const normalizedContent = normalizeFullWidthNumbers(commentContent);

    if (isHtmlEmpty(normalizedContent)) {
      return alert("Nội dung bình luận không được để trống.");
    }

    if (submitting) return; // prevent duplicate
    setSubmitting(true);

    try {
      const res = await fetchJSON("http://127.0.0.1:8000/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          post_id: Number(normalizeFullWidthNumbers(String(id))),
          content: normalizedContent,
          parent_id: null,
        }),
      });

      // backend returns { success: true, data: { ... } }
      const newComment = res.data ?? res;
      // normalize field names
      const normalized = {
        ...newComment,
        id: newComment.id ?? newComment.comment_id,
        parent_id: newComment.parent_id ?? null,
        updated_at: newComment.updated_at ?? newComment.created_at,
      };

      setComments((prev) => [...prev, normalized]);
      setCommentContent("");
    } catch (err) {
      // show specific messages if available
      if (err?.status === 422 && err.errors) {
        // show first validation message
        const firstField = Object.keys(err.errors)[0];
        alert(err.errors[firstField][0]);
      } else {
        alert(err.message || "Lỗi khi gửi bình luận.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------------------------
  // REPLY COMMENT
  // --------------------------------------------------------------------
  const handleReplySubmit = async (parentId) => {
    if (!authToken) return alert("Bạn cần đăng nhập để trả lời.");

    const normalizedContent = normalizeFullWidthNumbers(replyContent);

    if (isHtmlEmpty(normalizedContent)) {
      return alert("Nội dung trả lời không được để trống.");
    }

    if (replyingTo === parentId) return; // already sending
    setReplyingTo(parentId);

    try {
      const res = await fetchJSON("http://127.0.0.1:8000/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          post_id: Number(normalizeFullWidthNumbers(String(id))),
          content: normalizedContent,
          parent_id: parentId,
        }),
      });

      const newComment = res.data ?? res;
      const normalized = {
        ...newComment,
        id: newComment.id ?? newComment.comment_id,
        parent_id: newComment.parent_id ?? null,
        updated_at: newComment.updated_at ?? newComment.created_at,
      };

      setComments((prev) => [...prev, normalized]);
      setReplyToId(null);
      setReplyContent("");
    } catch (err) {
      if (err?.status === 422 && err.errors) {
        const firstField = Object.keys(err.errors)[0];
        alert(err.errors[firstField][0]);
      } else {
        alert(err.message || "Lỗi khi gửi trả lời.");
      }
    } finally {
      setReplyingTo(null);
    }
  };

  // --------------------------------------------------------------------
  // START EDIT — set editing states (capture updated_at for optimistic lock)
  // --------------------------------------------------------------------
  const startEditing = (c) => {
    setEditingCommentId(c.id);
    setEditingContent(c.content);
    // keep updated_at for optimistic locking (backend expects ISO string)
    setEditingUpdatedAt(c.updated_at);
  };

  // --------------------------------------------------------------------
  // UPDATE COMMENT
  // --------------------------------------------------------------------
  const handleUpdateComment = async (commentId) => {
    if (!editingContent) return alert("Nội dung không được để trống.");

    if (updatingId === commentId) return;
    setUpdatingId(commentId);

    try {
      const payload = {
        content: editingContent,
        updated_at: editingUpdatedAt, // optimistic locking
      };

      const res = await fetchJSON(`http://127.0.0.1:8000/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const updated = res.data ?? res;

      const normalized = {
        ...updated,
        id: updated.id ?? updated.comment_id,
        updated_at: updated.updated_at ?? updated.created_at,
      };

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: normalized.content, updated_at: normalized.updated_at } : c))
      );

      setEditingCommentId(null);
      setEditingContent("");
    } catch (err) {
      if (err?.status === 409) {
        // optimistic lock conflict
        alert(err.message || "Dữ liệu đã thay đổi. Vui lòng tải lại trang trước khi cập nhật.");
        // refresh comments so user can reload latest
        await fetchComments();
      } else if (err?.status === 422 && err.errors) {
        const firstField = Object.keys(err.errors)[0];
        alert(err.errors[firstField][0]);
      } else {
        alert(err.message || "Lỗi khi cập nhật bình luận.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // --------------------------------------------------------------------
  // DELETE COMMENT
  // --------------------------------------------------------------------
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa?")) return;

    if (deletingId === commentId) return;
    setDeletingId(commentId);

    try {
      const res = await fetchJSON(`http://127.0.0.1:8000/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // success
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      if (err?.status === 404) {
        alert(err.message || "Bình luận không tồn tại.");
        // reload comments in case it was already deleted elsewhere
        await fetchComments();
      } else {
        alert(err.message || "Lỗi khi xóa bình luận.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  // --------------------------------------------------------------------
  // RENDER COMMENTS
  // --------------------------------------------------------------------
  const renderComments = (list, level = 0) =>
    list.map((c) => {
      const isOwner =
        userData &&
        (userData.user_id === c.user_id ||
          localStorage.getItem("userRole") === "admin");

      return (
        <div
          key={c.id}
          className={`mt-4 ${level > 0 ? "ml-8 border-l pl-4" : ""}`}
        >
          <div className="flex gap-3">
            <img
              src={`https://i.pravatar.cc/40?u=${c.user_email}`}
              className="w-10 h-10 rounded-full"
              alt={c.user_name || "avatar"}
            />

            <div className="bg-white p-4 rounded-lg shadow flex-1">
              {/* User */}
              <div className="flex justify-between items-center">
                <span className="font-semibold">{c.user_name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(c.created_at).toLocaleString("vi-VN")}
                </span>
              </div>

              {/* Nội dung */}
              {editingCommentId === c.id ? (
                <>
                  <ReactQuill
                    theme="snow"
                    value={editingContent}
                    onChange={setEditingContent}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleUpdateComment(c.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                      disabled={updatingId === c.id}
                    >
                      {updatingId === c.id ? "Đang lưu..." : "Lưu"}
                    </button>
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="px-3 py-1 bg-gray-300 rounded"
                      disabled={updatingId === c.id}
                    >
                      Hủy
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className="prose mt-2"
                  dangerouslySetInnerHTML={{
                    __html: decodeHtml(c.content),
                  }}
                />
              )}

              {/* Action */}
              <div className="mt-2 flex gap-3">
                <button
                  className="text-blue-600 text-sm"
                  onClick={() => setReplyToId(c.id)}
                >
                  ↳ Trả lời
                </button>

                {isOwner && editingCommentId !== c.id && (
                  <>
                    <button
                      className="text-yellow-600 text-sm"
                      onClick={() => startEditing(c)}
                    >
                      Sửa
                    </button>
                    <button
                      className="text-red-600 text-sm"
                      onClick={() => handleDeleteComment(c.id)}
                      disabled={deletingId === c.id}
                    >
                      {deletingId === c.id ? "Đang xóa..." : "Xóa"}
                    </button>
                  </>
                )}
              </div>

              {/* Reply box */}
              {replyToId === c.id && (
                <div className="mt-3">
                  <ReactQuill
                    theme="snow"
                    value={replyContent}
                    onChange={setReplyContent}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleReplySubmit(c.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                      disabled={replyingTo === c.id}
                    >
                      {replyingTo === c.id ? "Đang gửi..." : "Gửi"}
                    </button>
                    <button
                      onClick={() => setReplyToId(null)}
                      className="px-3 py-1 bg-gray-300 rounded"
                      disabled={replyingTo === c.id}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Children */}
          {c.children?.length > 0 && renderComments(c.children, level + 1)}
        </div>
      );
    });

  // --------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------
  if (loading) return <div className="p-8">Đang tải...</div>;
  if (!post)
    return <div className="p-8 text-red-500">Không thể tải bài viết.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Bài viết */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          {post.image && (
            <img
              src={`http://127.0.0.1:8000/images/posts/${post.image}`}
              className="w-full h-64 object-cover rounded mb-6"
              alt={post.title}
            />
          )}

          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

          <div className="text-gray-600 mb-3">
            <span>Danh mục: </span>
            <strong>{post.category?.name}</strong>
          </div>

          <div
            className="prose max-w-full"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* FORM COMMENT */}
        {authToken ? (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <ReactQuill
              theme="snow"
              value={commentContent}
              onChange={setCommentContent}
            />
            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
              disabled={submitting}
            >
              {submitting ? "Đang gửi..." : "Gửi bình luận"}
            </button>
          </form>
        ) : (
          <p className="text-red-500">Bạn cần đăng nhập để bình luận.</p>
        )}

        {/* COMMENTS */}
        <div>
          {commentTree.length === 0 ? (
            <p className="text-gray-500">Chưa có bình luận.</p>
          ) : (
            renderComments(commentTree)
          )}
        </div>
      </div>
    </div>
  );
}
