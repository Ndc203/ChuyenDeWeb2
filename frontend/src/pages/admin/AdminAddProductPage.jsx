import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../layout/AdminSidebar.jsx";
import { ArrowLeft } from "lucide-react";

const defaultTags = ["hot", "new", "sale", "premium", "bestseller"];

export default function AdminAddProductPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [stock, setStock] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [isHot, setIsHot] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError] = useState("");

  const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

  useEffect(() => {
    let cancelled = false;
    setCatsLoading(true);
    setCatsError("");

    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length) {
            // if user hasn't selected a category yet, default to first
            setCategory((prev) => prev || (data[0].name || data[0].title || ""));
          }
        } else {
          setCategories([]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCatsError("Không thể tải danh mục từ máy chủ.");
        setCategories([]);
      })
      .finally(() => {
        if (cancelled) return;
        setCatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  const handleToggleTag = (t) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // basic validation
    if (!title.trim()) return setError("Vui lòng nhập tên sản phẩm.");
    if (!category) return setError("Chọn danh mục.");
    if (!brand) return setError("Chọn thương hiệu.");

    const newProduct = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      discountPercent: Number(discountPercent) || 0,
      category,
      brand,
      stock: Number(stock) || 0,
      image: imageUrl || "/src/assets/placeholder-phone.png",
      status: [isHot ? "HOT" : null].filter(Boolean),
      tags,
      rating: 0,
      reviews: 0,
    };

    // persist in sessionStorage so AdminProductsPage can pick it up
    try {
      const key = "ndc_created_products";
      const prev = JSON.parse(sessionStorage.getItem(key) || "[]");
      sessionStorage.setItem(key, JSON.stringify([newProduct, ...prev]));
    } catch (err) {
      // ignore storage errors
    }

    // navigate back to product list
    navigate("/admin/products");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-full mx-auto px-4 py-6 flex gap-6">
        <AdminSidebar />

        <main className="flex-1">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-50">
                <ArrowLeft />
              </button>
              <h3 className="text-lg font-semibold">Thêm Sản phẩm Mới</h3>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-6">
              <div className="col-span-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Nhập tên sản phẩm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Giá bán *</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Giảm giá (%)</label>
                    <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Danh mục *</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm">
                      <option value="">Chọn danh mục</option>
                      {catsLoading && <option value="" disabled>Đang tải danh mục...</option>}
                      {catsError && <option value="" disabled>Không thể tải danh mục</option>}
                      {!catsLoading && !catsError && categories.length === 0 && (
                        <option value="" disabled>Chưa có danh mục</option>
                      )}
                      {!catsLoading && !catsError && categories.map((c) => (
                        <option key={c.category_id ?? c.id ?? c.slug ?? c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Thương hiệu *</label>
                    <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm">
                      <option value="">Chọn thương hiệu</option>
                      <option value="Apple">Apple</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Dell">Dell</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Số lượng tồn kho *</label>
                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Mô tả sản phẩm</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm h-28" placeholder="Nhập mô tả chi tiết về sản phẩm..."></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">URL Hình ảnh</label>
                  <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="https://example.com/image.jpg" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tags</label>
                  <div className="flex gap-2 flex-wrap">
                    {defaultTags.map((t) => (
                      <button type="button" key={t} onClick={() => handleToggleTag(t)} className={`px-3 py-1 rounded-full text-sm border ${tags.includes(t) ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-slate-600'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input id="isHot" type="checkbox" checked={isHot} onChange={(e) => setIsHot(e.target.checked)} />
                  <label htmlFor="isHot" className="text-sm">Đánh dấu là sản phẩm HOT</label>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="flex items-center justify-end gap-3 mt-6">
                  <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-2xl border text-sm">Hủy</button>
                  <button type="submit" className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-sm">Thêm sản phẩm</button>
                </div>
              </div>

              <aside className="col-span-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-sm text-slate-500 mb-2">Xem trước</div>
                  <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                    <div className="w-20 h-20 bg-slate-100 rounded-md overflow-hidden flex items-center justify-center">
                      <img src={imageUrl || "/src/assets/placeholder-phone.png"} alt="preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-semibold">{title || "Tên sản phẩm"}</div>
                      <div className="text-xs text-slate-400">{price ? price + " đ" : "Giá chưa nhập"}</div>
                    </div>
                  </div>
                </div>
              </aside>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
