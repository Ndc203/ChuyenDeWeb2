import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, User } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export default function ProductReviews({ productId }) {
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false); // Loading khi gửi
    const [error, setError] = useState('');

    const token = localStorage.getItem('authToken'); // Kiểm tra đăng nhập

    // 1. Tải danh sách đánh giá
    useEffect(() => {
        if (productId) {
            axios.get(`${API_URL}/api/reviews?product_id=${productId}`)
                .then(res => {
                    // KIỂM TRA AN TOÀN:
                    if (Array.isArray(res.data)) {
                        setReviews(res.data); // Nếu là mảng -> OK
                    } else if (res.data && Array.isArray(res.data.data)) {
                        setReviews(res.data.data); // Nếu là object có key 'data' (phân trang) -> Lấy data
                    } else {
                        setReviews([]); // Nếu không phải mảng -> Set rỗng để tránh lỗi
                        console.warn("API reviews trả về định dạng lạ:", res.data);
                    }
                })
                .catch(err => {
                    console.error("Lỗi tải review:", err);
                    setReviews([]); // Lỗi -> Set rỗng
                });
        }
    }, [productId]);

    // 2. Xử lý gửi đánh giá
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            alert("Vui lòng đăng nhập để đánh giá!");
            return;
        }

        setLoading(true);
        setError('');

        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await axios.post(`${API_URL}/api/reviews`, {
                product_id: productId,
                rating,
                comment
            });

            // Thêm review mới vào đầu danh sách ngay lập tức
            setReviews([response.data, ...reviews]);

            // Reset form
            setComment('');
            setRating(5);
            alert("Cảm ơn bạn đã đánh giá!");

        } catch (err) {
            setError("Gửi đánh giá thất bại. Vui lòng thử lại.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Render ngôi sao
    const renderStars = (count) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={16}
                className={`${i < count ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} inline-block`}
            />
        ));
    };

    return (
        <div className="mt-12 border-t border-gray-100 pt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Đánh giá sản phẩm ({reviews.length})</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* Cột Trái: Danh sách Review */}
                <div className="space-y-6">
                    {!Array.isArray(reviews) || reviews.length === 0 ? (
                        <p className="text-gray-500 italic">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.review_id} className="bg-gray-50 p-4 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {/* Avatar giả lập hoặc thật */}
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                            {review.user?.profile?.avatar ? (
                                                <img src={review.user.profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                review.user?.username?.[0]?.toUpperCase() || <User size={16} />
                                            )}
                                        </div>
                                        <span className="font-semibold text-sm">{review.user?.profile?.full_name || review.user?.username || 'Người dùng ẩn danh'}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="mb-2">{renderStars(review.rating)}</div>
                                <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Cột Phải: Form Viết Review */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Viết đánh giá của bạn</h3>

                    {!token ? (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <p className="text-gray-600 mb-2">Vui lòng đăng nhập để viết đánh giá.</p>
                            {/* Link tới trang login */}
                            <a href="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập ngay</a>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Chọn Sao */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ hài lòng</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={24}
                                                className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Nội dung */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung đánh giá</label>
                                <textarea
                                    rows="4"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                                    required
                                ></textarea>
                            </div>

                            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                        </form>
                    )}
                </div>

            </div>
        </div>
    );
}