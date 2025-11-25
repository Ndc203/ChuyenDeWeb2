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

    // Auth
    const userData = JSON.parse(localStorage.getItem("userData") || "null");
    const authToken = localStorage.getItem("authToken");

    // --- API helper ---
    const fetchJSON = async (url, options = {}) => {
        const res = await fetch(url, options);
        const contentType = res.headers.get("content-type") || "";

        let data = null;

        if (contentType.includes("application/json")) {
            data = await res.json();
        } else {
            throw new Error("API không trả JSON (Lỗi server)");
        }

        if (!res.ok) {
            throw new Error(data.message || "Lỗi xử lý API");
        }

        return data;
    };

    // --- FETCH BÀI VIẾT ---
    const fetchPost = async () => {
        try {
            const data = await fetchJSON(`http://127.0.0.1:8000/api/posts/${id}`);
            setPost(data); // API trả về object trực tiếp
        } catch (err) {
            console.error("Lỗi load bài viết:", err);
        }
    };

    // --- FETCH COMMENTS ---
    const fetchComments = async () => {
        try {
            const data = await fetchJSON(`http://127.0.0.1:8000/api/posts/${id}/comments`);
            setComments(data);
        } catch (err) {
            console.error("Lỗi tải comments:", err);
        }
    };

    // Load data
    useEffect(() => {
        const load = async () => {
            await fetchPost();
            await fetchComments();
            setLoading(false);
        };
        load();
    }, [id]);

    // --------------------------------------------------------------------
    // COMMENT TREE
    // --------------------------------------------------------------------
    const buildCommentTree = (list, parentId = null) =>
        list
            .filter((c) => c.parent_id === parentId)
            .map((c) => ({
                ...c,
                children: buildCommentTree(list, c.id),
            }));

    const commentTree = buildCommentTree(comments);

    // --------------------------------------------------------------------
    // ADD COMMENT
    // --------------------------------------------------------------------
    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        if (!authToken) return alert("Bạn cần đăng nhập để bình luận.");
        if (!commentContent || commentContent === "<p><br></p>") return;

        try {
            const data = await fetchJSON("http://127.0.0.1:8000/api/comments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    post_id: id,
                    content: commentContent,
                    parent_id: null,
                }),
            });

            setComments((prev) => [...prev, data.data]);
            setCommentContent("");
        } catch (err) {
            alert(err.message);
        }
    };

    // --------------------------------------------------------------------
    // REPLY COMMENT
    // --------------------------------------------------------------------
    const handleReplySubmit = async (parentId) => {
        if (!authToken) return alert("Bạn cần đăng nhập để trả lời.");
        if (!replyContent || replyContent === "<p><br></p>") return;

        try {
            const data = await fetchJSON("http://127.0.0.1:8000/api/comments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    post_id: id,
                    content: replyContent,
                    parent_id: parentId,
                }),
            });

            setComments((prev) => [...prev, data.data]);
            setReplyToId(null);
            setReplyContent("");
        } catch (err) {
            alert(err.message);
        }
    };

    // --------------------------------------------------------------------
    // UPDATE COMMENT
    // --------------------------------------------------------------------
    const handleUpdateComment = async (commentId) => {
        if (!editingContent) return;

        try {
            await fetchJSON(`http://127.0.0.1:8000/api/comments/${commentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    content: editingContent,
                }),
            });

            setComments((prev) =>
                prev.map((c) => (c.id === commentId ? { ...c, content: editingContent } : c))
            );

            setEditingCommentId(null);
        } catch (err) {
            alert(err.message);
        }
    };

    // --------------------------------------------------------------------
    // DELETE COMMENT
    // --------------------------------------------------------------------
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa?")) return;

        try {
            await fetchJSON(`http://127.0.0.1:8000/api/comments/${commentId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (err) {
            alert(err.message);
        }
    };

    // --------------------------------------------------------------------
    // RENDER COMMENTS (NESTED)
    // --------------------------------------------------------------------
    const renderComments = (list, level = 0) =>
        list.map((c) => {
            const isOwner =
                userData &&
                (userData.user_id === c.user_id || userData.role === "admin");

            return (
                <div
                    key={c.id}
                    className={`mt-4 ${level > 0 ? "ml-8 border-l pl-4" : ""}`}
                >
                    <div className="flex gap-3">
                        <img
                            src={`https://i.pravatar.cc/40?u=${c.user_email}`}
                            className="w-10 h-10 rounded-full"
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
                                        >
                                            Lưu
                                        </button>
                                        <button
                                            onClick={() => setEditingCommentId(null)}
                                            className="px-3 py-1 bg-gray-300 rounded"
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
                                            onClick={() => {
                                                setEditingCommentId(c.id);
                                                setEditingContent(c.content);
                                            }}
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            className="text-red-600 text-sm"
                                            onClick={() => handleDeleteComment(c.id)}
                                        >
                                            Xóa
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
                                        >
                                            Gửi
                                        </button>
                                        <button
                                            onClick={() => setReplyToId(null)}
                                            className="px-3 py-1 bg-gray-300 rounded"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Children */}
                    {c.children?.length > 0 &&
                        renderComments(c.children, level + 1)}
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
                {/* BÀI VIẾT */}
                <div className="bg-white p-6 rounded-lg shadow mb-8">
                    {post.image && (
                        <img
                            src={`http://127.0.0.1:8000/images/posts/${post.image}`}
                            className="w-full h-64 object-cover rounded mb-6"
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
                        >
                            Gửi bình luận
                        </button>
                    </form>
                ) : (
                    <p className="text-red-500">
                        Bạn cần đăng nhập để bình luận.
                    </p>
                )}

                {/* COMMENTS LIST */}
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
