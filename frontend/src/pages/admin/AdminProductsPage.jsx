import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Star,
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";

const sampleProducts = [
  {
    id: 1,
    title: "iPhone 15 Pro Max",
    brand: "Apple",
    price: "29.990.000 đ",
    discount: "Giảm 5%",
    category: "Điện thoại",
    stock: 25,
    status: ["HOT", "MỚI"],
    rating: 4.8,
    reviews: 156,
    image: "/src/assets/placeholder-phone.png",
  },
  {
    id: 2,
    title: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    price: "26.990.000 đ",
    discount: "Giảm 10%",
    category: "Điện thoại",
    stock: 18,
    status: ["SALE"],
    rating: 4.7,
    reviews: 89,
    image: "/src/assets/placeholder-phone.png",
  },
  {
    id: 3,
    title: "MacBook Pro M3",
    brand: "Apple",
    price: "45.990.000 đ",
    discount: "",
    category: "Laptop",
    stock: 12,
    status: ["HOT"],
    rating: 4.9,
    reviews: 234,
    image: "/src/assets/placeholder-laptop.png",
  },
];

// read persisted created products from sessionStorage (created via the add product form)
function loadCreatedProducts() {
  try {
    const key = "ndc_created_products";
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    return [];
  }
}

export default function AdminProductsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const navigate = useNavigate();

  // include created products from sessionStorage so newly added items appear
  const created = loadCreatedProducts();
  const allProducts = [...created, ...sampleProducts];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allProducts.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        (p.title || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      );
    });
  }, [query, category, allProducts]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-full mx-auto px-4 py-6 flex gap-6">
        <AdminSidebar />
        <main className="flex-1">
          <h2 className="text-lg font-semibold mb-4">Quản lý Sản phẩm</h2>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-3 flex-1">
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 w-80">
                  <Search size={16} className="text-slate-400" />
                  <input
                    className="bg-transparent outline-none text-sm w-full"
                    placeholder="Tìm sản phẩm..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <select
                  className="text-sm rounded-xl border px-3 py-2 bg-white"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="all">Tất cả danh mục</option>
                  <option value="Điện thoại">Điện thoại</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Tablet">Tablet</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-500">Hiển thị {rows.length} / {allProducts.length} sản phẩm</div>
                <button onClick={() => navigate('/admin/products/new')} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-2xl text-sm">
                  <Plus size={16} /> Thêm sản phẩm
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-3">SẢN PHẨM</th>
                    <th className="py-3">GIÁ BÁN</th>
                    <th className="py-3">DANH MỤC</th>
                    <th className="py-3">TỒN KHO</th>
                    <th className="py-3">TRẠNG THÁI</th>
                    <th className="py-3">ĐÁNH GIÁ</th>
                    <th className="py-3">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="align-top border-b">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden">
                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-semibold">{p.title}</div>
                            <div className="text-xs text-slate-400">{p.brand}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4">
                        <div className="font-semibold">{p.price}</div>
                        {p.discount && <div className="text-xs text-green-500">{p.discount}</div>}
                      </td>

                      <td className="py-4">{p.category}</td>

                      <td className="py-4">
                        <div className={`text-sm ${p.stock > 10 ? 'text-green-600' : p.stock>0? 'text-amber-600' : 'text-red-600'}`}> {p.stock} </div>
                        <div className="text-xs text-slate-400">{p.stock>0 ? 'Còn hàng' : 'Hết hàng'}</div>
                      </td>

                      <td className="py-4">
                        <div className="flex gap-2">
                          {(p.status || []).map((s, i) => (
                            <div key={i} className="px-2 py-1 rounded-full text-[11px] bg-pink-50 text-pink-600">{s}</div>
                          ))}
                        </div>
                      </td>

                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Star size={14} className="text-amber-400" />
                          <div className="font-medium">{p.rating}</div>
                          <div className="text-xs text-slate-400">({p.reviews})</div>
                        </div>
                      </td>

                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <button className="text-slate-500 hover:text-slate-700"><Eye size={16} /></button>
                          <button className="text-slate-500 hover:text-slate-700"><Edit size={16} /></button>
                          <button className="text-slate-500 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
