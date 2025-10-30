import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Plus,
  RefreshCcw,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";

const emptyBrandForm = () => ({
  name: "",
  description: "",
});

const initialSlugState = {
  slug: "",
  base: "",
  available: true,
  modified: false,
  loading: false,
};

export default function AdminBrandsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [form, setForm] = useState(emptyBrandForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [slugState, setSlugState] = useState(initialSlugState);
  const [slugError, setSlugError] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const API_URL = useMemo(
    () =>
      (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(
        /\/$/,
        ""
      ),
    []
  );

  const loadBrands = useCallback(() => {
    setLoading(true);
    return fetch(`${API_URL}/api/brands`)
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? setRows(data) : setRows([])))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [API_URL]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    if (!formOpen) {
      return;
    }

    const name = form.name.trim();
    const ignoreId =
      formMode === "edit" && editTarget ? String(editTarget.id) : null;

    if (!name) {
      setSlugState(initialSlugState);
      setSlugError("");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setSlugState((prev) => ({ ...prev, loading: true }));
    setSlugError("");

    const timer = setTimeout(() => {
      const params = new URLSearchParams({ text: name });
      if (ignoreId) {
        params.set("ignore", ignoreId);
      }

      fetch(`${API_URL}/api/brands/slugify?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          setSlugState({
            slug: data?.slug || "",
            base: data?.base || "",
            available:
              typeof data?.available === "boolean" ? data.available : true,
            modified: Boolean(data?.modified),
            loading: false,
          });
        })
        .catch(() => {
          if (cancelled) return;
          setSlugError("Khong the sinh slug tu dong. Vui long thu lai.");
          setSlugState(initialSlugState);
        });
    }, 350);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [API_URL, editTarget, form.name, formMode, formOpen]);

  const handleOpenCreate = () => {
    setFormMode("create");
    setForm(emptyBrandForm());
    setFormError("");
    setSlugState(initialSlugState);
    setSlugError("");
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (brand) => {
    setFormMode("edit");
    setEditTarget(brand);
    setForm({
      name: brand.name || "",
      description: brand.description || "",
    });
    setFormError("");
    setSlugState({
      slug: brand.slug || "",
      base: brand.slug || "",
      available: true,
      modified: false,
      loading: false,
    });
    setSlugError("");
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setForm(emptyBrandForm());
    setFormError("");
    setSlugState(initialSlugState);
    setSlugError("");
    setEditTarget(null);
    setFormLoading(false);
  };

  const updateFormValue = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmitForm = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError("Vui long nhap ten thuong hieu.");
      return;
    }

    const payload = {
      name,
      description: form.description.trim()
        ? form.description.trim()
        : null,
    };

    setFormLoading(true);
    setFormError("");

    try {
      const endpoint =
        formMode === "edit" && editTarget
          ? `${API_URL}/api/brands/${editTarget.id}`
          : `${API_URL}/api/brands`;
      const method = formMode === "edit" && editTarget ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
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
            ? Object.values(data.errors).flat().join(", ")
            : "Khong the luu thuong hieu.");
        setFormError(message);
        return;
      }

      await loadBrands();
      handleCloseForm();
    } catch (error) {
      setFormError("Khong the ket noi toi may chu. Vui long thu lai.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (brand) => {
    if (!window.confirm(`Xoa thuong hieu "${brand.name}"?`)) {
      return;
    }

    setDeletingId(brand.id);
    try {
      const response = await fetch(`${API_URL}/api/brands/${brand.id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error();
      }

      setRows((prev) => prev.filter((row) => row.id !== brand.id));
    } catch (error) {
      alert("Khong the xoa thuong hieu. Vui long thu lai.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 px-4 py-6 sm:px-8">
          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Thuong hieu
              </h1>
              <p className="text-sm text-slate-500">
                Quan ly danh sach thuong hieu va slug tu dong.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadBrands}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                disabled={loading}
              >
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                Lam moi
              </button>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus size={16} />
                Them thuong hieu
              </button>
            </div>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Danh sach thuong hieu
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ten thuong hieu</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium w-1/3">
                      Mo ta
                    </th>
                    <th className="px-4 py-3 font-medium">Ngay tao</th>
                    <th className="px-4 py-3 font-medium text-right">Thao tac</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        Dang tai du lieu...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                        Chua co thuong hieu nao.
                      </td>
                    </tr>
                  ) : (
                    rows.map((brand) => (
                      <tr key={brand.id}>
                        <td className="px-4 py-3 font-medium">{brand.name}</td>
                        <td className="px-4 py-3 text-slate-500">{brand.slug}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {brand.description || "--"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {brand.created_at || "--"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(brand)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              <Edit size={14} className="mr-1 inline-block" />
                              Sua
                            </button>
                            <button
                              onClick={() => handleDelete(brand)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                              disabled={deletingId === brand.id}
                            >
                              {deletingId === brand.id ? (
                                <Loader2 size={14} className="mr-1 inline-block animate-spin" />
                              ) : (
                                <Trash2 size={14} className="mr-1 inline-block" />
                              )}
                              Xoa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      <BrandFormModal
        open={formOpen}
        mode={formMode}
        form={form}
        onChange={updateFormValue}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        loading={formLoading}
        error={formError}
        slugState={slugState}
        slugError={slugError}
      />
    </div>
  );
}

function BrandFormModal({
  open,
  mode,
  form,
  onChange,
  onClose,
  onSubmit,
  loading,
  error,
  slugState,
  slugError,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            {mode === "edit" ? "Chinh sua thuong hieu" : "Them thuong hieu"}
          </h3>
          <p className="text-sm text-slate-500">
            Slug se duoc sinh tu dong dua tren ten.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ten thuong hieu
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Nhap ten thuong hieu"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {slugState.loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-indigo-500" />
                Dang sinh slug...
              </span>
            ) : slugError ? (
              <span className="text-rose-500">{slugError}</span>
            ) : (
              <>
                <span className="font-medium text-slate-700">
                  Slug du kien:
                </span>{" "}
                <code className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px]">
                  {slugState.slug || "(Chua xac dinh)"}
                </code>
                {slugState.modified && (
                  <p className="mt-1 text-amber-600">
                    Da dieu chinh slug de tranh trung lap.
                  </p>
                )}
                {!slugState.available && !slugState.modified && (
                  <p className="mt-1 text-rose-500">
                    Slug da ton tai. Vui long doi ten thuong hieu.
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Mo ta (khong bat buoc)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Mo ta ngan gon ve thuong hieu"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "edit" ? "Luu thay doi" : "Them thuong hieu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
