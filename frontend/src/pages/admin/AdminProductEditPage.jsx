import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";
import axiosClient from "../../api/axiosClient"; // Import axiosClient

// URL gốc để hiển thị ảnh từ server
const IMAGE_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// Helper an toàn để lấy dữ liệu từ object (tránh lỗi null/undefined)
const getEntityValue = (entity, keys = []) => {
  if (!entity) return "";
  for (const key of keys) {
    if (entity[key] !== undefined && entity[key] !== null) {
      return entity[key];
    }
  }
  return "";
};

const getEntityLabel = (entity, fallbackPrefix, preferredKeys = []) => {
  if (!entity) return `${fallbackPrefix} #?`;
  return (
    entity?.name ??
    entity?.label ??
    entity?.title ??
    entity?.slug ??
    `${fallbackPrefix} #${
      getEntityValue(entity, [...preferredKeys, "id", "value"]) || "?"
    }`
  );
};

export default function AdminProductEditPage() {
  const navigate = useNavigate();
  const { id: hashedId } = useParams(); // ID sản phẩm từ URL
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true); // Loading ban đầu
  const [error, setError] = useState("");
  
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount: "",
    category_id: "",
    brand_id: "",
    stock: "",
    image: null,
    currentImage: "", // Lưu tên ảnh cũ
    updated_at: null,
    is_flash_sale: false,
    is_new: false,
    tags: [],
  });

  const [imagePreview, setImagePreview] = useState(null);

  // === 1. Load Tất cả dữ liệu cần thiết (Product, Categories, Brands) ===
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        // Gọi song song 3 API để tiết kiệm thời gian
        const [productRes, categoriesRes, brandsRes] = await Promise.all([
          axiosClient.get(`/products/${hashedId}`),
          axiosClient.get('/categories'),
          axiosClient.get('/brands')
        ]);

        // 1. Setup Product Data
        const data = productRes.data;
        if (data) {
          setFormData({
            name: data.name || "",
            description: data.description || "",
            price: data.price || "",
            discount: data.discount || "",
            category_id: data.category_id || "",
            brand_id: data.brand_id || "",
            stock: data.stock || "",
            image: null,
            currentImage: data.image || "",
            is_flash_sale: !!data.is_flash_sale, // Ép kiểu boolean
            is_new: !!data.is_new,
            tags: data.tags ? data.tags.split(",").filter(Boolean) : [],
          });

          // Hiển thị ảnh cũ
            // Hiển thị ảnh cũ; backend có thể trả về URL hoặc filename hoặc null
            if (data.image) {
              const imageUrl = typeof data.image === 'string' && data.image.startsWith('http')
                ? data.image
                : `${IMAGE_BASE_URL}/images/products/${data.image}`;
              setImagePreview(imageUrl);
            } else {
              setImagePreview(null);
            }
            // Lưu timestamp updated_at để dùng cho optimistic locking
            setFormData(prev => ({ ...prev, updated_at: data.updated_at ?? null }));
        }

        // 2. Setup Categories
        const catData = categoriesRes.data;
        setCategories(Array.isArray(catData) ? catData : catData.data || []);

        // 3. Setup Brands
        const brandData = brandsRes.data;
        setBrands(Array.isArray(brandData) ? brandData : brandData.data || []);

      } catch (err) {
        console.error("Error loading data:", err);
        const status = err.response?.status;
        const serverMsg = err.response?.data?.message;
        if (status === 404) {
          setError(serverMsg || 'Không tìm thấy trang');
        } else {
          setError(serverMsg || "Không thể tải thông tin sản phẩm. Vui lòng thử lại.");
        }
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [hashedId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Client-side normalization helpers (same logic as Add page)
  const toAsciiDigits = (s) => {
    if (typeof s !== 'string') return s;
    const full = ['０','１','２','３','４','５','６','７','８','９'];
    const ascii = ['0','1','2','3','4','5','6','7','8','9'];
    return full.reduce((acc, ch, i) => acc.split(ch).join(ascii[i]), s);
  };

  const normalizeWhitespace = (s) => {
    if (typeof s !== 'string') return s;
    let out = s.replace(/\u3000/g, ' ');
    out = out.replace(/[\u00A0\u2000-\u200B\u202F\u205F]+/g, ' ');
    out = out.replace(/\s+/g, ' ').trim();
    return out;
  };

  const containsHtml = (s) => {
    if (typeof s !== 'string') return false;
    return s !== s.replace(/<[^>]*>/g, '');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      // Preview ảnh mới ngay lập tức
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTagToggle = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  // === 2. Submit Form (Update) ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate cơ bản
    if (!formData.name.trim()) {
      setError("Tên sản phẩm không được để trống");
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Giá bán phải lớn hơn 0");
      setLoading(false);
      return;
    }

    // Client-side normalization and checks
    const normalized = { ...formData };
    normalized.name = normalizeWhitespace(String(normalized.name || ''));
    normalized.description = normalizeWhitespace(String(normalized.description || ''));
    normalized.price = toAsciiDigits(String(normalized.price || '')).trim();
    normalized.discount = toAsciiDigits(String(normalized.discount || '')).trim();
    normalized.stock = toAsciiDigits(String(normalized.stock || '')).trim();

    if (containsHtml(normalized.name)) {
      setError('Tên sản phẩm không được chứa thẻ HTML.');
      setLoading(false);
      return;
    }
    if (containsHtml(normalized.description)) {
      setError('Mô tả không được chứa thẻ HTML.');
      setLoading(false);
      return;
    }

    // Tạo FormData
    const formPayload = new FormData();
    formPayload.append("name", normalized.name.trim());
    formPayload.append("description", normalized.description.trim());
    formPayload.append("price", normalized.price ? parseFloat(normalized.price) : '');
    formPayload.append("discount", normalized.discount ? parseInt(normalized.discount) : 0);
    formPayload.append("category_id", normalized.category_id ? parseInt(normalized.category_id) : "");
    formPayload.append("brand_id", normalized.brand_id ? parseInt(normalized.brand_id) : "");
    formPayload.append("stock", normalized.stock ? parseInt(normalized.stock) : 0);
    formPayload.append("is_flash_sale", normalized.is_flash_sale ? 1 : 0);
    formPayload.append("is_new", normalized.is_new ? 1 : 0);
    formPayload.append("tags", normalized.tags.join(","));
    formPayload.append("status", "active");
    // Gửi updated_at để server kiểm tra optimistic lock (nếu có)
    if (normalized.updated_at) {
      formPayload.append("updated_at", normalized.updated_at);
    }
    
    // QUAN TRỌNG: Laravel không hỗ trợ PUT với Multipart form-data trực tiếp
    // Phải dùng POST và thêm _method = PUT
    formPayload.append("_method", "PUT");
    
    if (formData.image) {
      formPayload.append("image", formData.image);
    }

    try {
      // Dùng axiosClient.post (vì có _method: PUT bên trong body)
      const res = await axiosClient.post(`/products/${hashedId}`, formPayload);

      // Thành công -> Quay về danh sách
      navigate("/admin/products");
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setError(err.response?.data?.message || 'Dữ liệu đã được thay đổi. Vui lòng tải lại trang trước khi cập nhật.');
      } else if (status === 422) {
        const errors = err.response?.data?.errors;
        if (errors) {
          const flat = Object.values(errors).flat().join(" ");
          setError(flat || 'Dữ liệu không hợp lệ.');
        } else {
          setError(err.response?.data?.message || 'Dữ liệu không hợp lệ.');
        }
      } else {
        const message = err.response?.data?.message ||
          (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(", ") : "Không thể cập nhật sản phẩm.");
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/products");
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-600 flex flex-col items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
             Đang tải dữ liệu...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">
              Chỉnh sửa Sản phẩm
            </h1>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="max-w-4xl">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {/* Cột trái */}
                <div className="space-y-4">
                  {/* Tên */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tên sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Giá */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Giá bán <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="1000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {formData.price && (
                      <p className="text-sm text-blue-600 mt-1">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(formData.price)}
                      </p>
                    )}
                  </div>

                  {/* Giảm giá */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Giảm giá (%)
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Danh mục */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Danh mục <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((cat, index) => {
                        const value = getEntityValue(cat, ["category_id", "id"]).toString();
                        return (
                          <option key={value || index} value={value}>
                            {getEntityLabel(cat, "Danh mục", ["category_id"])}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Thương hiệu */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Thương hiệu <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="brand_id"
                      value={formData.brand_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Chọn thương hiệu</option>
                      {brands.map((brand, index) => {
                        const value = getEntityValue(brand, ["brand_id", "id"]).toString();
                        return (
                          <option key={value || index} value={value}>
                            {getEntityLabel(brand, "Thương hiệu", ["brand_id"])}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Tồn kho */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Số lượng tồn kho <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Ảnh */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hình ảnh sản phẩm (Thay đổi nếu cần)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                {/* Cột phải */}
                <div className="space-y-4">
                  {/* Mô tả */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Mô tả sản phẩm
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["new", "hot", "sale", "premium", "bestseller"].map(
                        (tag) => (
                          <label
                            key={tag}
                            className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={formData.tags.includes(tag)}
                              onChange={() => handleTagToggle(tag)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700 capitalize">
                              {tag}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_new"
                      checked={formData.is_new}
                      onChange={handleInputChange}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-slate-700">
                      Đánh dấu là sản phẩm HOT/Mới
                    </label>
                  </div>

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Xem trước
                    </label>
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="flex gap-3">
                        <div className="h-20 w-20 rounded-lg bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                setImagePreview(null);
                              }}
                            />
                          ) : (
                            <Upload className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">
                            {formData.name || "Tên sản phẩm"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formData.price
                              ? new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(formData.price)
                              : "Giá chưa nhập"}
                          </p>
                          {formData.discount > 0 && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded">
                              -{formData.discount}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang cập nhật..." : "Cập nhật sản phẩm"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}