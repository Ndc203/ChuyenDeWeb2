import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";

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
  const { id: hashedId } = useParams(); // Nhận hashed_id từ URL
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
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
    image: "",
    is_flash_sale: false,
    is_new: false,
    tags: [],
  });

  const API_URL = (
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

  // Load product data
  useEffect(() => {
    setLoadingProduct(true);
    // Sử dụng hashed_id để load sản phẩm
    fetch(`${API_URL}/api/products/${hashedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setFormData({
            name: data.name || "",
            description: data.description || "",
            price: data.price || "",
            discount: data.discount || "",
            category_id: data.category_id || "",
            brand_id: data.brand_id || "",
            stock: data.stock || "",
            image: data.image || "",
            is_flash_sale: data.is_flash_sale || false,
            is_new: data.is_new || false,
            tags: data.tags ? data.tags.split(",").filter(Boolean) : [],
          });
        }
      })
      .catch((error) => {
        console.error("Error loading product:", error);
        setError("Không thể tải thông tin sản phẩm");
      })
      .finally(() => setLoadingProduct(false));
  }, [API_URL, hashedId]);

  // Load categories và brands
  useEffect(() => {
    // Load categories
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((error) => console.error("Error loading categories:", error));

    // Load brands
    fetch(`${API_URL}/api/brands`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBrands(data);
        }
      })
      .catch((error) => console.error("Error loading brands:", error));
  }, [API_URL]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTagToggle = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

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

    // Prepare payload
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      discount: formData.discount ? parseInt(formData.discount) : 0,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      image: formData.image.trim() || null,
      is_flash_sale: formData.is_flash_sale,
      is_new: formData.is_new,
      tags: formData.tags.join(","),
      status: "active",
    };

    try {
      // Sử dụng hashed_id để update sản phẩm
      const response = await fetch(`${API_URL}/api/products/${hashedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.message ||
          (data?.errors
            ? Object.values(data.errors).flat().join(", ")
            : "Không thể cập nhật sản phẩm.");
        setError(message);
        return;
      }

      // Thành công - chuyển về trang danh sách
      navigate("/admin/products");
    } catch (error) {
      setError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/products");
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-600">Đang tải dữ liệu...</div>
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
                      {categories.map((cat, index) => {
                        const rawValue = getEntityValue(cat, [
                          "category_id",
                          "id",
                          "value",
                        ]);
                        if (rawValue === "" || rawValue === null) {
                          return null;
                        }
                        const value = rawValue.toString();
                        return (
                          <option key={value || index} value={value}>
                            {getEntityLabel(cat, "Danh muc", ["category_id"])}
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
                        const rawValue = getEntityValue(brand, [
                          "brand_id",
                          "id",
                          "value",
                        ]);
                        if (rawValue === "" || rawValue === null) {
                          return null;
                        }
                        const value = rawValue.toString();
                        return (
                          <option key={value || index} value={value}>
                            {getEntityLabel(brand, "Thuong hieu", ["brand_id"])}
                          </option>
                        );
                      })}
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
                      placeholder="Nhập mô tả sản phẩm"
                      rows="4"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* URL Hình ảnh */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      URL Hình ảnh
                    </label>
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                  {/* Đánh dấu là sản phẩm HOT */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_new"
                      checked={formData.is_new}
                      onChange={handleInputChange}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-slate-700">
                      Đánh dấu là sản phẩm HOT
                    </label>
                  </div>

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Preview
                    </label>
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="flex gap-3">
                        <div className="h-20 w-20 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-xs overflow-hidden flex-shrink-0">
                          {formData.image ? (
                            <img
                              src={formData.image}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.innerHTML =
                                  '<div class="flex items-center justify-center w-full h-full"><svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
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

              {/* Buttons */}
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
