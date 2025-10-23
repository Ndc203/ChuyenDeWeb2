import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Plus,
  Download,
  Search,
  ChevronDown,
  LayoutGrid,
  Home,
  ListTree,
  Tag,
  Image as ImageIcon,
  Package,
  Users,
  UserCheck,
  LogOut,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  Circle,
  HardDrive,
} from "lucide-react";

const emptyCategoryForm = () => ({
  name: "",
  description: "",
  parentId: "",
  status: "active",
});

export default function AdminCategoriesPage() {
  const [query, setQuery] = useState("");
  const [parentFilter, setParentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyCategoryForm);

  const API_URL = (
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

  // === Fetch danh mục thật ===
  const loadCategories = useCallback(() => {
    setLoading(true);
    return fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? setRows(data) : setRows([])))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [API_URL]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // === Đổi trạng thái khi click con mắt ===
  const handleOpenCreate = () => {
    setForm(emptyCategoryForm());
    setFormError("");
    setCreateLoading(false);
    setOpenCreate(true);
  };

  const handleCloseCreate = () => {
    setOpenCreate(false);
    setForm(emptyCategoryForm());
    setFormError("");
    setCreateLoading(false);
  };

  const updateFormValue = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmitCreate = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError("Vui long nhap ten danh muc.");
      return;
    }

    setCreateLoading(true);
    setFormError("");

    const payload = {
      name,
      description: form.description?.trim() ? form.description.trim() : null,
      parent_id: form.parentId ? Number(form.parentId) : null,
      status: form.status || "active",
    };

    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.message ||
          (data?.errors
            ? Object.values(data.errors)
                .flat()
                .join(", ")
            : "Khong the tao danh muc moi.");
        setFormError(message);
        return;
      }

      await loadCategories();
      handleCloseCreate();
    } catch (error) {
      setFormError("Khong the ket noi toi may chu.");
    } finally {
      setCreateLoading(false);
    }
  };

  async function handleToggleStatus(id) {
    setRows((prev) =>
      prev.map((it) => (it.id === id ? { ...it, _updating: true } : it))
    );
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}/toggle`, {
        method: "PATCH",
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      setRows((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                status:
                  data?.status ||
                  (it.status === "active" ? "inactive" : "active"),
                _updating: false,
              }
            : it
        )
      );
    } catch {
      alert("Không thể đổi trạng thái");
      setRows((prev) =>
        prev.map((it) => (it.id === id ? { ...it, _updating: false } : it))
      );
    }
  }

  // === Xuất file ===
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);
  useEffect(() => {
    const close = (e) =>
      !exportRef.current?.contains(e.target) && setOpenExport(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const handleExport = (format) => {
    window.open(`${API_URL}/api/categories/export?format=${format}`, "_blank");
  };

  const uniqueParents = useMemo(() => {
    const set = new Set(rows.map((r) => r.parent || "Danh mục gốc"));
    return ["Tất cả danh mục cha", ...Array.from(set)];
  }, [rows]);

  const parentOptions = useMemo(
    () => [
      { value: "", label: "Khong co danh muc cha" },
      ...rows.map((r) => ({
        value: String(r.id),
        label: r.name || `Danh muc #${r.id}`,
      })),
    ],
    [rows]
  );

  const categoryTree = useMemo(() => buildCategoryTree(rows), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchQuery = (r.name || "")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchParent =
        parentFilter === "all" ||
        (parentFilter === "Danh mục gốc"
          ? !r.parent
          : r.parent === parentFilter);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchQuery && matchParent && matchStatus;
    });
  }, [rows, query, parentFilter, statusFilter]);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 hidden md:flex flex-col gap-4 border-r bg-white/90 backdrop-blur-sm">
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold">
            A
          </div>
          <div>
            <div className="font-semibold leading-5">Admin Panel</div>
            <div className="text-xs text-slate-500">admin@example.com</div>
          </div>
        </div>

        <nav className="px-2">
          <SideItem icon={<LayoutGrid size={18} />} label="Tổng quan" />
          <SectionLabel>QUẢN LÝ SẢN PHẨM</SectionLabel>
          <SideItem icon={<Package size={18} />} label="Danh sách Sản phẩm" />
          <SideItem icon={<HardDrive size={18} />} label="Tồn kho" />
          <SideItem icon={<Tag size={18} />} label="Thuộc tính SP" />
          <SectionLabel>QUẢN LÝ CẤU TRÚC</SectionLabel>
          <SideItem
            active
            icon={<ListTree size={18} />}
            label="Danh mục Sản phẩm"
          />
          <SideItem icon={<ImageIcon size={18} />} label="Banner & Quảng cáo" />
          <SectionLabel>QUẢN LÝ GIAO DỊCH</SectionLabel>
          <SideItem icon={<Home size={18} />} label="Đơn hàng" />
          <SideItem icon={<Tag size={18} />} label="Mã giảm giá" />
          <SectionLabel>NGƯỜI DÙNG</SectionLabel>
          <SideItem icon={<Users size={18} />} label="Danh sách Người dùng" />
          <SideItem icon={<UserCheck size={18} />} label="Lịch sử hoạt động" />
        </nav>

        <div className="mt-auto p-4">
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm hover:bg-slate-50">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur border-b">
          <div className="w-full px-10 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-semibold">
                Quản lý Danh mục Sản phẩm
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Dữ liệu lấy từ Laravel API thật
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setOpenExport((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <Download size={16} /> Xuất file
                </button>
                {openExport && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-md z-50">
                    <button
                      onClick={() => handleExport("excel")}
                      className="block px-4 py-2 text-sm hover:bg-slate-50 w-full text-left"
                    >
                      📊 Tải Excel
                    </button>
                    <button
                      onClick={() => handleExport("pdf")}
                      className="block px-4 py-2 text-sm hover:bg-slate-50 w-full text-left"
                    >
                      📄 Tải PDF
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700"
              >
                <Plus size={16} /> Them danh muc
              </button>
            </div>
          </div>

          {/* Bộ lọc */}
          <div className="w-full px-10 pb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm danh mục..."
                className="w-full rounded-xl border bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <Select
              value={parentFilter}
              onChange={setParentFilter}
              options={[
                "all",
                ...uniqueParents.filter((p) => p !== "Tất cả danh mục cha"),
              ]}
              mapLabel={(v) => (v === "all" ? "Tất cả danh mục cha" : v)}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={["all", "active", "inactive"]}
              mapLabel={(v) =>
                v === "all"
                  ? "Tất cả trạng thái"
                  : v === "active"
                  ? "Hoạt động"
                  : "Tạm ẩn"
              }
            />
          </div>
        </div>

        {/* Tree + Table */}
        <div className="w-full px-10 pb-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px),1fr]">
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-5 py-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                  Cay danh muc
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Hien thi cau truc cha - con.
                </p>
              </div>
              <div className="max-h-[520px] overflow-y-auto px-3 py-4">
                <CategoryTree nodes={categoryTree} />
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <Th>TÊN DANH MỤC</Th>
                  <Th>SLUG</Th>
                  <Th>DANH MỤC CHA</Th>
                  <Th className="w-48">TRẠNG THÁI</Th>
                  <Th className="w-40">NGÀY TẠO</Th>
                  <Th className="w-40 text-right pr-4">THAO TÁC</Th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}
                {!loading &&
                  filtered.map((r, i) => (
                    <tr
                      key={r.id}
                      className={i % 2 ? "bg-white" : "bg-slate-50/50"}
                    >
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-slate-500">{r.slug}</td>
                      <td className="px-4 py-3">
                        {r.parent || "Danh mục gốc"}
                      </td>

                      {/* === Trạng thái nằm giữa các cột === */}
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="px-4 py-3">{formatDate(r.created_at)}</td>

                      {/* === Cột thao tác === */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <IconBtn
                            title="Đổi trạng thái"
                            intent={
                              r.status === "active" ? "primary" : "danger"
                            }
                            disabled={r._updating}
                            onClick={() => handleToggleStatus(r.id)}
                          >
                            <Eye size={16} />
                          </IconBtn>
                          <IconBtn title="Sửa" intent="primary">
                            <Edit size={16} />
                          </IconBtn>
                          <IconBtn title="Xoá" intent="danger">
                            <Trash2 size={16} />
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </main>
      <CreateCategoryModal
        open={openCreate}
        form={form}
        onChange={updateFormValue}
        onClose={handleCloseCreate}
        onSubmit={handleSubmitCreate}
        parentOptions={parentOptions}
        loading={createLoading}
        error={formError}
      />
    </div>
  );
}

function CreateCategoryModal({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  parentOptions,
  loading,
  error,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Them danh muc
            </h2>
            <p className="text-sm text-slate-500">
              Nhap thong tin danh muc moi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ten danh muc
            </label>
            <input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Vi du: Do dien tu"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Mo ta
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              className="w-full min-h-[80px] rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Thong tin mo ta nganh hang"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Danh muc cha
              </label>
              <select
                value={form.parentId}
                onChange={(e) => onChange("parentId", e.target.value)}
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {parentOptions.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Trang thai
              </label>
              <select
                value={form.status}
                onChange={(e) => onChange("status", e.target.value)}
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="active">Dang hoat dong</option>
                <option value="inactive">Tam dung</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Dang luu..." : "Luu danh muc"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
/* === COMPONENT PHỤ === */
function SectionLabel({ children }) {
  return (
    <div className="px-4 mt-3 mb-1 text-[10px] font-semibold tracking-wider text-slate-400">
      {children}
    </div>
  );
}
function SideItem({ icon, label, active }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon} {label}
    </button>
  );
}
function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}
function IconBtn({ children, title, intent, onClick, disabled }) {
  const base =
    "inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50";
  const color =
    intent === "primary"
      ? "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
      : "border-rose-200 text-rose-600 hover:bg-rose-50";
  return (
    <button
      className={`${base} ${color}`}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
function StatusBadge({ status }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium border ${
        active
          ? "text-emerald-700 border-emerald-200 bg-emerald-50"
          : "text-amber-700 border-amber-200 bg-amber-50"
      }`}
    >
      {active ? <CheckCircle2 size={14} /> : <Circle size={12} />}
      {active ? "Hoạt động" : "Tạm ẩn"}
    </span>
  );
}
function Select({ value, onChange, options, mapLabel }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 appearance-none"
        style={{
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
        }}
      >
        {options.map((op) => (
          <option key={op} value={op}>
            {mapLabel ? mapLabel(op) : op}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function buildCategoryTree(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const nodeMap = new Map();

  items.forEach((item) => {
    if (!item || typeof item.id === "undefined") {
      return;
    }
    nodeMap.set(item.id, {
      id: item.id,
      name: item.name,
      slug: item.slug,
      status: item.status,
      parent_id: item.parent_id ?? null,
      parent: item.parent,
      created_at: item.created_at,
      children: [],
    });
  });

  const roots = [];

  nodeMap.forEach((node) => {
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (list) => {
    list.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "vi", {
        sensitivity: "base",
      })
    );
    list.forEach((child) => {
      if (child.children.length) {
        sortNodes(child.children);
      }
    });
  };

  sortNodes(roots);
  return roots;
}

function formatDate(s) {
  const d = new Date(s);
  if (Number.isNaN(+d)) return "";
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function CategoryTree({ nodes }) {
  const [expanded, setExpanded] = useState(() => new Set());

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      const ensure = (items) => {
        items.forEach((item) => {
          if (!next.has(item.id)) {
            next.add(item.id);
          }
          if (item.children && item.children.length) {
            ensure(item.children);
          }
        });
      };
      ensure(nodes);
      return next;
    });
  }, [nodes]);

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!nodes.length) {
    return (
      <p className="px-2 text-sm text-slate-500">
        Khong co danh muc nao.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <CategoryTreeNode
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}

function CategoryTreeNode({ node, depth, expanded, onToggle }) {
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = expanded.has(node.id);

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50"
        style={{ paddingLeft: depth * 14 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
          >
            <ChevronDown
              size={14}
              className={`transition-transform ${isOpen ? "" : "-rotate-90"}`}
            />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <div className="flex flex-1 items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-slate-700">{node.name}</p>
            <p className="text-xs text-slate-400">{node.slug}</p>
          </div>
          <StatusBadge status={node.status} />
        </div>
      </div>
      {hasChildren && isOpen && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}


