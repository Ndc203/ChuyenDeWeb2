import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import ShopHeader from "../../components/shop/ShopHeader";
import "react-quill-new/dist/quill.snow.css";
import Swal from "sweetalert2";

// --- Helper ---
function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  let decoded = txt.value;

  // Giải mã nhiều lớp (2-3 lần)
  for (let i = 0; i < 3; i++) {
    if (decoded.includes("&lt;") || decoded.includes("&gt;")) {
      txt.innerHTML = decoded;
      decoded = txt.value;
    }
  }

  return decoded;
}

function normalizeFullWidthNumbers(s) {
  if (typeof s !== "string") return s;
  return s.replace(/[\uFF10-\uFF19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
}

function stripUnicodeSpaces(s) {
  if (!s) return "";
  return s.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, "").trim();
}
function htmlToText(html) {
  const div = document.createElement("div");
  div.innerHTML = decodeHtml(html); // xử lý &lt; &gt; nếu có
  return div.textContent || div.innerText || "";
}

function isHtmlEmpty(html) {
  if (!html) return true;
  const el = document.createElement("div");
  el.innerHTML = html;
  const text = el.textContent || el.innerText || "";
  const cleaned = stripUnicodeSpaces(text);
  return cleaned.length === 0;
}

// --- Component ---
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
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const userData = JSON.parse(localStorage.getItem("userInfo") || "null");
  const authToken = localStorage.getItem("authToken");

  const fetchJSON = async (url, options = {}) => {
    const res = await fetch(url, options);
    const type = res.headers.get("content-type") || "";
    let data = null;
    if (type.includes("application/json")) data = await res.json();
    else throw { message: "API không trả JSON", status: res.status };
    if (!res.ok)
      throw { message: data?.message || "Lỗi API", status: res.status };
    return data;
  };
  const markPostAsDeleted = () => {
    setPost(null);
    setComments([]);
  };

  // --- Fetch post & comments ---
  const fetchPostAndComments = async () => {
    try {
      const postData = await fetchJSON(`http://127.0.0.1:8000/api/posts/${id}`);

      // Nếu API trả về null hoặc không có post → post bị xoá
      if (!postData || postData === null || postData?.deleted_at) {
        setPost(null);
        setComments([]);
        setLoading(false);
        return; // ⛔ dừng tại đây, không fetch comments nữa
      }

      setPost(postData);

      const commentData = await fetchJSON(
        `http://127.0.0.1:8000/api/posts/${id}/comments`
      );

      const list = Array.isArray(commentData)
        ? commentData
        : commentData?.data || [];

      const normalized = list.map((c) => ({
        ...c,
        id: c.id ?? c.comment_id,
        parent_id: c.parent_id ?? null,
        updated_at: c.updated_at ?? c.created_at ?? null,
      }));

      setComments(normalized);
    } catch (err) {
      // Nếu backend trả về 404 → bài viết đã bị xoá
      if (err.status === 404) {
        setPost(null);
        setComments([]);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostAndComments();
  }, [id]);

  // --- Build comment tree ---
  const commentTree = useMemo(() => {
    const buildTree = (list, parentId = null, visited = new Set()) =>
      list
        .filter(
          (c) =>
            c.parent_id === parentId || String(c.parent_id) === String(parentId)
        )
        .map((c) => {
          if (visited.has(c.id)) return { ...c, children: [] };
          visited.add(c.id);
          return { ...c, children: buildTree(list, c.id, visited) };
        });

    return buildTree(comments);
  }, [comments]);

  // --- Submit comment ---
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!authToken)
      return Swal.fire(
        "Thông báo",
        "Bạn cần đăng nhập để bình luận.",
        "warning"
      );
    if (submitting) return;

    const content = normalizeFullWidthNumbers(commentContent);
    if (isHtmlEmpty(content))
      return Swal.fire(
        "Lỗi",
        "Nội dung bình luận không được để trống.",
        "error"
      );

    setSubmitting(true);
    try {
      const payload = { post_id: Number(id), content, parent_id: null };

      const res = await fetchJSON("http://127.0.0.1:8000/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const apiComment = res.comment ?? res.data ?? res;

      const newComment = {
        ...apiComment,
        id: apiComment.id,
        parent_id: null,

        // thêm info user để render ngay
        user_id: userData?.user_id,
        user_name: userData?.name,
        user_email: userData?.email,
      };

      setComments((prev) => [...prev, newComment]);
    } catch (err) {
      if (err.status === 404) {
        markPostAsDeleted();
        return;
      }
      if (err.status === 422) {
        Swal.fire(
          "Lỗi",
          "Nội dung bình luận không hợp lệ hoặc bài viết đã bị xoá.",
          "error"
        );
        return;
      }
      Swal.fire("Lỗi", err.message || "Lỗi khi gửi bình luận.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Reply ---
  const handleReplySubmit = async (parentId) => {
    if (!authToken)
      return Swal.fire("Thông báo", "Bạn cần đăng nhập để trả lời.", "warning");
    if (replyingTo === parentId) return;

    const content = normalizeFullWidthNumbers(replyContent);
    if (isHtmlEmpty(content))
      return Swal.fire("Lỗi", "Nội dung trả lời không được để trống.", "error");

    setReplyingTo(parentId);
    try {
      const payload = { post_id: Number(id), content, parent_id: parentId };

      const res = await fetchJSON("http://127.0.0.1:8000/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const apiComment = res.comment ?? res.data ?? res;

      const newReply = {
        ...apiComment,
        id: apiComment.id,
        parent_id: parentId,

        user_id: userData?.user_id,
        user_name: userData?.name,
        user_email: userData?.email,
      };

      setComments((prev) => [...prev, newReply]);

      setReplyToId(null);
      setReplyContent("");
    } catch (err) {
      if (err.status === 404) {
        markPostAsDeleted();
        return;
      }
      Swal.fire("Lỗi", err.message || "Lỗi khi gửi trả lời.", "error");
    } finally {
      setReplyingTo(null);
    }
  };

  // --- Edit ---
  const startEditing = (c) => {
    setEditingCommentId(c.id);
    setEditingContent(decodeHtml(c.content));
  };

  const handleUpdateComment = async (commentId) => {
    if (updatingId === commentId) return;

    if (isHtmlEmpty(editingContent))
      return Swal.fire("Lỗi", "Nội dung không được để trống.", "error");

    setUpdatingId(commentId);

    try {
      const original = comments.find((c) => c.id === commentId);

      if (!original) {
        Swal.fire("Lỗi", "Không tìm thấy comment cần sửa.", "error");
        return;
      }

      const payload = {
        content: editingContent,
        updated_at: original.updated_at, // 🔥 BẮT BUỘC
      };

      const res = await fetchJSON(
        `http://127.0.0.1:8000/api/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const updated = res.data ?? res.comment ?? res;

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content: updated.content, updated_at: updated.updated_at }
            : c
        )
      );

      setEditingCommentId(null);
      setEditingContent("");
    } catch (err) {
      if (err.status === 404) {
        markPostAsDeleted();
        return;
      }
      Swal.fire("Lỗi", err.message || "Lỗi khi cập nhật bình luận.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // --- Delete ---
  const handleDeleteComment = async (commentId) => {
    const result = await Swal.fire({
      title: "Bạn chắc chắn muốn xóa?",
      text: "Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;
    if (deletingId === commentId) return;

    setDeletingId(commentId);

    try {
      await fetchJSON(`http://127.0.0.1:8000/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      if (err.status === 404) {
        markPostAsDeleted();
        return;
      }
      Swal.fire("Lỗi", err.message || "Lỗi khi xóa bình luận.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // --- Render comment tree ---
  const renderComments = (list, level = 0) =>
    list.map((c) => {
      const isOwner =
        userData &&
        (userData.user_id === c.user_id ||
          localStorage.getItem("userRole") === "admin");

      return (
        <div key={c.id} className="mt-4">
          <div
            className={`p-3 rounded ${level > 0 ? "ml-8 border-l pl-4" : ""}`}
          >
            <div className="flex items-center gap-3">
              <img
                src={`https://i.pravatar.cc/40?u=${c.user_email}`}
                className="w-10 h-10 rounded-full"
                alt={c.user_name || "avatar"}
              />
              <div className="font-semibold">{c.user_name}</div>
              <div className="text-sm text-gray-500">
                {new Date(c.created_at).toLocaleString("vi-VN")}
              </div>
            </div>

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
                  __html: decodeHtml(c.content || ""),
                }}
              />
            )}

            <div className="mt-2 flex gap-3 text-sm">
              <button
                className="text-blue-600"
                onClick={() => setReplyToId(c.id)}
              >
                ↳ Trả lời
              </button>

              {isOwner && editingCommentId !== c.id && (
                <>
                  <button
                    className="text-yellow-600"
                    onClick={() => startEditing(c)}
                  >
                    Sửa
                  </button>

                  <button
                    className="text-red-600"
                    onClick={() => handleDeleteComment(c.id)}
                    disabled={deletingId === c.id}
                  >
                    {deletingId === c.id ? "Đang xóa..." : "Xóa"}
                  </button>
                </>
              )}
            </div>

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

          {c.children?.length > 0 && renderComments(c.children, level + 1)}
        </div>
      );
    });

  if (loading) return <>Đang tải...</>;
  if (!post)
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">Bài viết đã bị xóa</h2>
        <p className="mt-2 text-gray-600">
          Bài viết này không còn tồn tại hoặc đã bị tác giả xoá.
        </p>
      </div>
    );

  return (
    <div>
      <ShopHeader />

      <div className="max-w-4xl mx-auto p-4">
        {post.image && (
          <img
            src={`http://127.0.0.1:8000/images/posts/${post.image}`}
            className="w-full h-64 object-cover rounded mb-6"
            alt={post.title}
          />
        )}

        <h1 className="text-3xl font-bold">{post.title}</h1>

        <p className="text-gray-600 mt-1">
          Danh mục: <span className="font-semibold">{post.category?.name}</span>
        </p>

        <div
          className="prose max-w-full mt-4"
          dangerouslySetInnerHTML={{
            __html: decodeHtml(post.content || ""),
          }}
        />

        {/* Comment form */}
        {authToken ? (
          <form onSubmit={handleCommentSubmit} className="mb-6 mt-6">
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
          <p className="text-red-500 mt-4">Bạn cần đăng nhập để bình luận.</p>
        )}

        {/* Comment List */}
        <div className="mt-6">
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
