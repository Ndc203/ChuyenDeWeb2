import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import ShopHeader from "../../components/shop/ShopHeader";
import "react-quill-new/dist/quill.snow.css";

export default function ShopPostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [search, setSearch] = useState("");

  const userData = JSON.parse(localStorage.getItem("userData") || "null");
  const authToken = localStorage.getItem("authToken");

  // Lấy chi tiết bài viết
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

  // Lấy comment
  const fetchComments = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/comments?post_id=${id}`);
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

  // Gửi comment mới
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent || commentContent === "<p><br></p>") return;

    if (!authToken || !userData) {
      alert("Bạn cần đăng nhập để bình luận.");
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          post_id: id,
          content: commentContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Thêm bình luận thất bại.");

      setComments((prev) => [data.data, ...prev]);
      setCommentContent("");
    } catch (err) {
      console.error("Server response:", err);
      alert(err.message || "Thêm bình luận thất bại.");
    }
  };

  if (loading) return <div className="p-8">Đang tải...</div>;
  if (!post) return <div className="p-8">Bài viết không tồn tại.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader onSearch={setSearch} />

      <div className="max-w-4xl mx-auto px-4 py-8">
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
            className="prose"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {userData && authToken && (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <ReactQuill
              theme="snow"
              value={commentContent}
              onChange={setCommentContent}
              placeholder="Viết bình luận..."
              modules={{
                toolbar: [
                  [{ header: [1, 2, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link", "image"],
                  ["clean"],
                ],
              }}
            />
            <button
              type="submit"
              className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Gửi bình luận
            </button>
          </form>
        )}

        {!userData && <p className="text-red-500 mb-4">Bạn cần đăng nhập để bình luận.</p>}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500">Chưa có bình luận nào.</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div
                  className="text-gray-800"
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                />
                <p className="text-sm text-gray-500 mt-2">
                  {comment.user_name || "Ẩn danh"} -{" "}
                  {new Date(comment.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
