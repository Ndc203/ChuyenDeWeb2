import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Minus, Plus, ArrowLeft, CheckCircle } from 'lucide-react';
import ShopHeader from '../../components/shop/ShopHeader';
import ProductReviews from './ProductReviews';

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const BASE_URL = API_URL.replace('/api', '');

const formatCurrency = (value) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const ProductDetail = () => {
    const { slug } = useParams(); // Lấy slug từ URL
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                // Gọi API lấy sản phẩm theo slug
                const response = await axios.get(`${API_URL}/api/products/${slug}`);
                setProduct(response.data);
                setMainImage(response.data.image);
            } catch (err) {
                console.error("Lỗi tải sản phẩm:", err);
                setError('Không tìm thấy sản phẩm hoặc có lỗi xảy ra.');
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchProduct();
    }, [slug]);

    // --- HÀM XỬ LÝ URL ẢNH (QUAN TRỌNG) ---
    const getImageUrl = (imageName) => {
        if (!imageName) return 'https://placehold.co/600x600?text=No+Image';

        // Nếu trong DB đã lưu link full (http...) thì dùng luôn
        if (imageName.startsWith('http')) return imageName;

        return `${BASE_URL}/images/products/${imageName}`;
    };

    // Hàm xử lý khi ảnh bị lỗi
    const handleImageError = (e) => {
        e.target.src = 'https://placehold.co/600x600?text=No+Image';
    };
    // Xử lý thêm vào giỏ hàng
    const handleAddToCart = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert("Vui lòng đăng nhập để mua hàng!");
                navigate('/login');
                return;
            }

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            await axios.post(`${API_URL}/api/cart/add`, {
                product_id: product.product_id, // Đảm bảo backend trả về product_id
                quantity: quantity
            });

            alert(`Đã thêm ${quantity} sản phẩm vào giỏ!`);
            window.dispatchEvent(new CustomEvent('cartUpdated')); // Cập nhật Header

        } catch (err) {
            console.error(err);
            alert('Lỗi khi thêm vào giỏ hàng.');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <ShopHeader />
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        </div>
    );

    if (error || !product) return (
        <div className="min-h-screen bg-gray-50">
            <ShopHeader />
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Rất tiếc!</h2>
                <p className="text-red-500 mb-6">{error || 'Sản phẩm không tồn tại.'}</p>
                <button onClick={() => navigate('/')} className="text-blue-600 hover:underline flex items-center justify-center gap-2">
                    <ArrowLeft size={16} /> Quay lại trang chủ
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <ShopHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb & Back */}
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Quay lại
                </button>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

                        {/* Cột Trái: Hình ảnh */}
                        <div className="p-8 bg-white flex flex-col items-center border-b md:border-b-0 md:border-r border-gray-100">
                            <div className="w-full aspect-square relative mb-4 flex items-center justify-center overflow-hidden rounded-xl bg-gray-50">
                                <img
                                    src={getImageUrl(mainImage)}
                                    alt={product?.name}
                                    className="object-contain max-h-full max-w-full hover:scale-105 transition-transform duration-300"
                                    onError={handleImageError}
                                />
                            </div>
                            {/* (Nếu có nhiều ảnh nhỏ, bạn map ở đây) */}
                        </div>

                        {/* Cột Phải: Thông tin */}
                        <div className="p-8 md:p-10 flex flex-col">
                            <div className="flex-1">
                                {product.brand && (
                                    <span className="text-sm font-semibold text-blue-600 tracking-wider uppercase mb-2 block">
                                        {product.brand.name}
                                    </span>
                                )}
                                <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>

                                {/* Giá & Tình trạng */}
                                <div className="flex items-end gap-4 mb-6">
                                    <p className="text-3xl font-bold text-blue-600">
                                        {formatCurrency(product.price)}
                                    </p>
                                    {product.old_price && (
                                        <p className="text-lg text-gray-400 line-through mb-1">
                                            {formatCurrency(product.old_price)}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-green-600 mb-6 bg-green-50 px-3 py-1 rounded-full w-fit">
                                    <CheckCircle size={16} />
                                    <span className="font-medium">Còn hàng ({product.stock || 100} sản phẩm)</span>
                                </div>

                                <p className="text-gray-600 leading-relaxed mb-8">
                                    {product.description || "Đang cập nhật mô tả cho sản phẩm này..."}
                                </p>

                                {/* Bộ chọn số lượng */}
                                <div className="mb-8">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                                    <div className="flex items-center w-fit border border-gray-300 rounded-lg">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="p-3 hover:bg-gray-100 rounded-l-lg text-gray-600 transition-colors"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-16 text-center font-semibold text-gray-900 border-x border-gray-300 py-2 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => setQuantity(q => q + 1)}
                                            className="p-3 hover:bg-gray-100 rounded-r-lg text-gray-600 transition-colors"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Nút Mua */}
                            <div className="pt-6 border-t border-gray-100">
                                <button
                                    onClick={handleAddToCart}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <ShoppingCart size={24} />
                                    Thêm vào giỏ hàng
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
                {/* Phần Đánh giá */}
                {product && <ProductReviews productId={product.product_id} />}
            </div>
        </div>
    );
};

export default ProductDetail;