import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";
import axiosClient from "../../api/axiosClient"; // Import axiosClient

export default function AdminProductAddPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    is_flash_sale: false,
    is_new: false,
    tags: [],
  });

  const [imagePreview, setImagePreview] = useState(null);

  // === 1. Load Categories & Brands (Dùng Promise.all cho nhanh) ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          axiosClient.get('/categories'),
          axiosClient.get('/brands')
        ]);

        // Xử lý dữ liệu categories
        const catData = categoriesRes.data;
        setCategories(Array.isArray(catData) ? catData : catData.data || []);

        // Xử lý dữ liệu brands
        const brandData = brandsRes.data;
        setBrands(Array.isArray(brandData) ? brandData : brandData.data || []);

      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      // Create preview
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

  // === 2. Submit Form (Dùng axiosClient + FormData) ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate
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

    // Prepare FormData
    const formPayload = new FormData();
    formPayload.append("name", formData.name.trim());
    formPayload.append("description", formData.description.trim());
    formPayload.append("price", parseFloat(formData.price));
    formPayload.append("discount", formData.discount ? parseInt(formData.discount) : 0);
    formPayload.append("category_id", formData.category_id ? parseInt(formData.category_id) : "");
    formPayload.append("brand_id", formData.brand_id ? parseInt(formData.brand_id) : "");
    formPayload.append("stock", formData.stock ? parseInt(formData.stock) : 0);
    formPayload.append("is_flash_sale", formData.is_flash_sale ? 1 : 0);
    formPayload.append("is_new", formData.is_new ? 1 : 0);
    formPayload.append("tags", formData.tags.join(","));
    formPayload.append("status", "active");
    
    if (formData.image) {
      formPayload.append("image", formData.image);
    }

    try {
      // axiosClient tự động xử lý Content-Type: multipart/form-data
      await axiosClient.post('/products', formPayload);

      // Thành công - chuyển về trang danh sách
      navigate("/admin/products");
    } catch (error) {
      // Xử lý lỗi chuẩn từ Laravel (message hoặc errors array)
      const message = error.response?.data?.message || 
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(", ") : "Không thể tạo sản phẩm mới.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/products");
  };

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
              Thêm Sản phẩm Mới
            </h1>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="max-w-4xl">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {/* Cột trái */}
                <div className="space-y-4">
                  {/* Tên sản phẩm */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tên sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nhập tên sản phẩm"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Giá bán */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Giá bán <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0"
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
                      placeholder="0"
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
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
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
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Số lượng tồn kho */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Số lượng tồn kho <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Hình ảnh sản phẩm */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hình ảnh sản phẩm
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Định dạng: JPG, PNG, GIF, WEBP. Tối đa 2MB
                    </p>
                  </div>
                </div>

                {/* Cột phải */}
                <div className="space-y-4">
                  {/* Mô tả sản phẩm */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Mô tả sản phẩm
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Nhập mô tả chi tiết về sản phẩm..."
                      rows="6"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["hot", "new", "sale", "premium", "bestseller"].map(
                        (tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleTagToggle(tag)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              formData.tags.includes(tag)
                                ? "bg-blue-500 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {tag}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Checkbox: Đánh dấu là sản phẩm HOT */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_flash_sale"
                      id="is_flash_sale"
                      checked={formData.is_flash_sale}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="is_flash_sale"
                      className="text-sm text-slate-700"
                    >
                      Đánh dấu là sản phẩm SALE
                    </label>
                  </div>

                  {/* Checkbox: Sản phẩm mới */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_new"
                      id="is_new"
                      checked={formData.is_new}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_new" className="text-sm text-slate-700">
                      Sản phẩm mới
                    </label>
                  </div>

                  {/* Preview */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <h3 className="text-sm font-medium text-slate-700 mb-2">
                      Xem trước
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
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

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Đang lưu..." : "Thêm sản phẩm"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}