import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import ShopHeader from "../../components/shop/ShopHeader";
import "react-quill-new/dist/quill.snow.css";

// helper function: decode HTML entities
function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export default function ShopPostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const userData = JSON.parse(localStorage.getItem("userData") || "null");
  const authToken = localStorage.getItem("authToken");

  // Fetch post
  const fetchPost = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/posts/${id}`);
      if (!res.ok) throw new Error("Post not found");
      const data = await res.json();
      setPost(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/comments?post_id=${id}`
      );
      if (!res.ok) throw new Error("Không thể lấy bình luận");
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
    setLoading(false);
  }, [id]);

  const fetchJSON = async (url, options = {}) => {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error("Server returned non-JSON:", text);
      throw new Error("Server trả về dữ liệu không hợp lệ");
    }
    if (!res.ok) throw new Error(data.message || "Lỗi server");
    return data;
  };

  // Thêm comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent || commentContent === "<p><br></p>") return;
    if (!authToken || !userData) {
      alert("Bạn cần đăng nhập để bình luận.");
      return;
    }

    try {
      const data = await fetchJSON(`http://127.0.0.1:8000/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ post_id: id, content: commentContent }),
      });

      setComments((prev) => [data.data, ...prev]);
      setCommentContent("");
    } catch (err) {
      console.error(err);
      alert(err.message || "Thêm bình luận thất bại.");
    }
  };

  // Cập nhật comment
  const handleUpdateComment = async (commentId) => {
    if (!editingContent || editingContent === "<p><br></p>") return;
    try {
      const data = await fetchJSON(
        `http://127.0.0.1:8000/api/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ content: editingContent }),
        }
      );

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, content: editingContent } : c
        )
      );
      setEditingCommentId(null);
      setEditingContent("");
    } catch (err) {
      console.error(err);
      alert(err.message || "Cập nhật thất bại.");
    }
  };

  // Xóa comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    try {
      await fetchJSON(`http://127.0.0.1:8000/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error(err);
      alert(err.message || "Xóa thất bại.");
    }
  };

  if (loading) return <div className="p-8">Đang tải...</div>;
  if (!post) return <div className="p-8">Bài viết không tồn tại.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Post */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          {post.image && (
            <img
              src={`http://127.0.0.1:8000/images/posts/${post.image}`}
              alt={post.title}
              className="w-full h-64 object-cover rounded mb-4"
            />
          )}
          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
          <div
            className="prose max-w-full"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Add Comment */}
        {userData && authToken ? (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <ReactQuill
              theme="snow"
              value={commentContent}
              onChange={setCommentContent}
              placeholder="Viết bình luận..."
              modules={{
                toolbar: [
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link", "image"],
                  ["clean"],
                ],
              }}
            />
            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Gửi bình luận
            </button>
          </form>
        ) : (
          <p className="text-red-500 mb-4">Bạn cần đăng nhập để bình luận.</p>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500">Chưa có bình luận nào.</p>
          ) : (
            comments.map((c) => {
              const isOwner =
                userData &&
                (userData.user_id === c.user_id || userData.role === "admin");

              return (
                <div
                  key={c.id}
                  className="flex gap-3 items-start p-4 rounded-lg shadow border border-gray-200"
                >
                  <img
                    src={`https://i.pravatar.cc/40?u=${
                      c.user_email ?? "guest@example.com"
                    }`}
                    alt={c.user_name}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">{c.user_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(c.created_at).toLocaleString()}
                      </p>
                    </div>

                    {editingCommentId === c.id ? (
                      <>
                        <ReactQuill
                          theme="snow"
                          value={editingContent}
                          onChange={setEditingContent}
                          modules={{
                            toolbar: [
                              ["bold", "italic", "underline", "strike"],
                              [{ list: "ordered" }, { list: "bullet" }],
                              ["link", "image"],
                              ["clean"],
                            ],
                          }}
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleUpdateComment(c.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                          >
                            Hủy
                          </button>
                        </div>
                      </>
                    ) : (
                      <div
                        className="comment-content max-w-full mt-1"
                        dangerouslySetInnerHTML={{
                          __html: decodeHtml(c.content),
                        }}
                      />
                    )}

                    {isOwner && editingCommentId !== c.id && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCommentId(c.id);
                            setEditingContent(c.content);
                          }}
                          className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Inline CSS for Quill comment display */}
      <style>
        {`
          .comment-content p { margin: 0.5rem 0; }
          .comment-content strong { font-weight: bold; }
          .comment-content em { font-style: italic; }
          .comment-content u { text-decoration: underline; }
          .comment-content ul, .comment-content ol { margin-left: 1.5rem; }
          .comment-content a { color: #2563eb; text-decoration: underline; }
          .comment-content img { max-width: 100%; height: auto; display: block; margin: 0.5rem 0; }
        `}
      </style>
    </div>
  );
}
