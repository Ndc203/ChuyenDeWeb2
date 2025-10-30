import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Plus,
  RefreshCcw,
  Edit,
  Trash2,
  Loader2,
  Power,
  CheckCircle2,
  Circle,
  Eye,
  RotateCcw,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  Upload,
  X,
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";

const emptyBrandForm = () => ({
  name: "",
  description: "",
  status: "active",
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("active");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [form, setForm] = useState(emptyBrandForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [slugState, setSlugState] = useState(initialSlugState);
  const [slugError, setSlugError] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [importSelected, setImportSelected] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const importInputRef = useRef(null);

  const isDeletedView = viewMode === "deleted";

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
    const endpoint =
      viewMode === "deleted" ? "/api/brands/trashed" : "/api/brands";

    return fetch(`${API_URL}${endpoint}`)
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? setRows(data) : setRows([])))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [API_URL, viewMode]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!exportRef.current || exportRef.current.contains(event.target)) {
        return;
      }
      setExportOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = useCallback(
    (format) => {
      window.open(`${API_URL}/api/brands/export?format=${format}`, "_blank");
      setExportOpen(false);
    },
    [API_URL]
  );

  const resetImportState = useCallback(() => {
    setImportLoading(false);
    setImportError("");
    setImportPreview(null);
    setImportSelected([]);
    setImportResult(null);
    setImportSubmitting(false);
  }, []);

  const handleCloseImport = useCallback(() => {
    setImportOpen(false);
    resetImportState();
    setImportFile(null);
    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
  }, [resetImportState, importInputRef]);

  const handleTriggerImport = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleSelectImportFile = useCallback(
    async (event) => {
      const input = event.target;
      const file = input?.files?.[0];
      if (!file) {
        return;
      }

      resetImportState();
      setImportFile(file);
      setImportOpen(true);
      setImportLoading(true);
      setImportError("");
      setImportPreview(null);
      setImportSelected([]);
      setImportResult(null);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${API_URL}/api/brands/import/preview`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const message =
            data?.message ||
            data?.errors?.file?.[0] ||
            "Không thể đọc file. Vui lòng kiểm tra lại.";
          setImportError(message);
          setImportPreview(null);
          setImportSelected([]);
        } else {
          const data = await response.json();
          setImportPreview(data);
          const validIndexes = Array.isArray(data?.rows)
            ? data.rows
                .filter((row) => row?.is_valid)
                .map((row) => Number(row.index))
            : [];
          setImportSelected(validIndexes);
        }
      } catch (error) {
        setImportError("Không thể kết nối tới máy chủ. Vui lòng thử lại sau.");
        setImportPreview(null);
        setImportSelected([]);
      } finally {
        setImportLoading(false);
        if (importInputRef.current) {
          importInputRef.current.value = "";
        }
      }
    },
    [API_URL, resetImportState]
  );

  const handleToggleImportRow = useCallback((index) => {
    setImportResult(null);
    setImportError("");
    setImportSelected((prev) => {
      const exists = prev.includes(index);
      if (exists) {
        return prev.filter((value) => value !== index);
      }
      return [...prev, index];
    });
  }, []);

  const handleToggleImportAll = useCallback(
    (checked) => {
      setImportResult(null);
      setImportError("");
      if (!Array.isArray(importPreview?.rows) || !importPreview.rows.length) {
        setImportSelected([]);
        return;
      }

      if (checked) {
        const indexes = importPreview.rows
          .filter((row) => row?.is_valid)
          .map((row) => Number(row.index));
        setImportSelected(indexes);
      } else {
        setImportSelected([]);
      }
    },
    [importPreview]
  );

  const handleConfirmImport = useCallback(async () => {
    if (!importFile) {
      setImportError("Vui lòng chọn file Excel trước.");
      return;
    }

    if (!importSelected.length) {
      setImportError("Vui lòng chọn ít nhất một dòng hợp lệ.");
      return;
    }

    setImportSubmitting(true);
    setImportError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", importFile);
    importSelected.forEach((index) => {
      formData.append("selected[]", String(index));
    });

    try {
      const response = await fetch(`${API_URL}/api/brands/import`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.message || "Không thể nhập thương hiệu. Vui lòng thử lại.";
        setImportError(message);
        setImportResult(null);
      } else {
        setImportResult(data);
        await loadBrands();
      }
    } catch (error) {
      setImportError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
      setImportResult(null);
    } finally {
      setImportSubmitting(false);
    }
  }, [API_URL, importFile, importSelected, loadBrands]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const byKeyword = keyword
      ? rows.filter((brand) => {
          const haystack = [
            brand.name || "",
            brand.slug || "",
            brand.description || "",
            brand.deleted_at || "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(keyword);
        })
      : rows;

    if (statusFilter === "all") {
      return byKeyword;
    }

    return byKeyword.filter((brand) => brand.status === statusFilter);
  }, [rows, query, statusFilter]);

  useEffect(() => {
    setStatusFilter("all");
  }, [viewMode]);

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
    if (isDeletedView) {
      setViewMode("active");
    }
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
      status: brand.status || "active",
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
      description: form.description.trim() ? form.description.trim() : null,
      status: form.status === "inactive" ? "inactive" : "active",
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
    if (isDeletedView) {
      return;
    }

    if (
      !window.confirm(
        `Xoa thuong hieu "${brand.name}"?\nThuong hieu se duoc dua vao thung rac va tu dong xoa vinh vien sau 30 ngay.`
      )
    ) {
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

  const handleToggleStatus = async (brand) => {
    if (isDeletedView) return;

    setTogglingId(brand.id);
    try {
      const response = await fetch(`${API_URL}/api/brands/${brand.id}/toggle`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.message || "Khong the cap nhat trang thai thuong hieu.";
        throw new Error(message);
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === brand.id ? { ...row, status: data.status } : row
        )
      );
    } catch (error) {
      alert(
        error.message || "Khong the cap nhat trang thai. Vui long thu lai."
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenView = (brand) => {
    setViewTarget(brand);
  };

  const handleCloseView = () => {
    setViewTarget(null);
  };

  const handleRestore = async (brand) => {
    setRestoringId(brand.id);
    try {
      const response = await fetch(
        `${API_URL}/api/brands/${brand.id}/restore`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || "Khong the khoi phuc thuong hieu.");
      }

      setRows((prev) => prev.filter((row) => row.id !== brand.id));
    } catch (error) {
      alert(
        error.message || "Khong the khoi phuc thuong hieu. Vui long thu lai."
      );
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <input
          ref={importInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleSelectImportFile}
        />
        <AdminSidebar />
        <main className="flex-1 px-4 py-6 sm:px-8">
          <header className="mb-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-800">
                  Quản lý Thương hiệu
                </h1>
                <p className="text-sm text-slate-500">
                  Dữ liệu đồng bộ từ Laravel API. Quản lý trạng thái và thông
                  tin thương hiệu.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="relative" ref={exportRef}>
                  <button
                    onClick={() => setExportOpen((value) => !value)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <Download size={16} />
                    Xuất file
                  </button>
                  {exportOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => handleExport("excel")}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <span>📊 Tải Excel</span>
                      </button>
                      <button
                        onClick={() => handleExport("pdf")}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <span>📄 Tải PDF</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleTriggerImport}
                  disabled={importLoading || importSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Upload size={16} />
                  Nhập Excel
                </button>
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Plus size={16} />
                  Thêm thương hiệu
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Chế độ hiển thị
                </span>
                <div className="inline-flex rounded-full border bg-white p-1 text-xs shadow-sm">
                  <button
                    type="button"
                    onClick={() => setViewMode("active")}
                    className={`rounded-full px-3 py-1 font-medium transition ${
                      isDeletedView
                        ? "text-slate-600 hover:bg-slate-100"
                        : "bg-indigo-600 text-white shadow"
                    }`}
                  >
                    hoat dong
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("deleted")}
                    className={`rounded-full px-3 py-1 font-medium transition ${
                      isDeletedView
                        ? "bg-rose-600 text-white shadow"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Da xoa
                  </button>
                </div>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-[minmax(260px,1fr),220px]">
                <div className="relative w-full">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tim kiem thuong hieu..."
                    className="w-full rounded-xl border bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  disabled={isDeletedView}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 pr-8 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="all">Tat ca trang thai</option>
                  <option value="active">Hoat dong</option>
                  <option value="inactive">Tam dung</option>
                </select>
              </div>
            </div>
          </header>

          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <Th>Ten thuong hieu</Th>
                    <Th>Slug</Th>
                    <Th className="w-1/3">Mo ta</Th>
                    <Th className="w-32">Trang thai</Th>
                    <Th className="w-40">
                      {isDeletedView ? "Ngay xoa" : "Ngay tao"}
                    </Th>
                    <Th className="w-40 text-right pr-4">Thao tac</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-6 text-center text-slate-500"
                      >
                        Dang tai du lieu...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-6 text-center text-slate-400"
                      >
                        {isDeletedView
                          ? "Khong co thuong hieu nao trong thung rac."
                          : "Chua co thuong hieu nao."}
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-6 text-center text-slate-400"
                      >
                        Khong tim thay thuong hieu phu hop.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((brand, index) => (
                      <tr
                        key={brand.id}
                        className={index % 2 ? "bg-white" : "bg-slate-50/50"}
                      >
                        <td className="px-4 py-3 font-medium">{brand.name}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {brand.slug}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {brand.description?.trim() ? brand.description : "--"}
                        </td>
                        <td className="px-4 py-3">
                          {isDeletedView ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600">
                                Da xoa
                              </span>
                              <StatusBadge status={brand.status} />
                            </div>
                          ) : (
                            <StatusBadge status={brand.status} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(
                            isDeletedView ? brand.deleted_at : brand.created_at
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {isDeletedView ? (
                              <>
                                <IconBtn
                                  title="Xem chi tiet"
                                  intent="neutral"
                                  onClick={() => handleOpenView(brand)}
                                >
                                  <Eye size={16} />
                                </IconBtn>
                                <IconBtn
                                  title="Khoi phuc"
                                  intent="primary"
                                  onClick={() => handleRestore(brand)}
                                  disabled={restoringId === brand.id}
                                >
                                  {restoringId === brand.id ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <RotateCcw size={16} />
                                  )}
                                </IconBtn>
                              </>
                            ) : (
                              <>
                                <IconBtn
                                  title={
                                    brand.status === "active"
                                      ? "Chuyen sang tam dung"
                                      : "Kich hoat thuong hieu"
                                  }
                                  intent={
                                    brand.status === "active"
                                      ? "danger"
                                      : "primary"
                                  }
                                  disabled={togglingId === brand.id}
                                  onClick={() => handleToggleStatus(brand)}
                                >
                                  {togglingId === brand.id ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Power size={16} />
                                  )}
                                </IconBtn>
                                <IconBtn
                                  title="Xem chi tiet"
                                  intent="neutral"
                                  onClick={() => handleOpenView(brand)}
                                >
                                  <Eye size={16} />
                                </IconBtn>
                                <IconBtn
                                  title="Sua"
                                  intent="primary"
                                  onClick={() => handleOpenEdit(brand)}
                                >
                                  <Edit size={16} />
                                </IconBtn>
                                <IconBtn
                                  title="Xoa"
                                  intent="danger"
                                  onClick={() => handleDelete(brand)}
                                  disabled={deletingId === brand.id}
                                >
                                  {deletingId === brand.id ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </IconBtn>
                              </>
                            )}
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

      <ImportBrandsModal
        open={importOpen}
        loading={importLoading}
        preview={importPreview}
        selected={importSelected}
        onToggleRow={handleToggleImportRow}
        onToggleAll={handleToggleImportAll}
        onClose={handleCloseImport}
        onSubmit={handleConfirmImport}
        fileName={importFile?.name || ""}
        error={importError}
        submitting={importSubmitting}
        result={importResult}
        onPickFile={handleTriggerImport}
      />

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

      <BrandViewModal brand={viewTarget} onClose={handleCloseView} />
    </div>
  );
}

function ImportBrandsModal({
  open,
  loading,
  preview,
  selected,
  onToggleRow,
  onToggleAll,
  onClose,
  onSubmit,
  fileName,
  error,
  submitting,
  result,
  onPickFile,
}) {
  if (!open) return null;

  const rows = Array.isArray(preview?.rows) ? preview.rows : [];
  const summary = preview?.summary ?? {};
  const selectableRows = rows.filter((row) => row?.is_valid);
  const allSelected =
    selectableRows.length > 0 &&
    selectableRows.every((row) => selected.includes(Number(row.index)));
  const selectedCount = selected.length;
  const hasPreview = rows.length > 0;
  const submitLabel = submitting
    ? "Đang nhập..."
    : result
    ? "Nhập lại"
    : "Nhập thương hiệu";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
      <div className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Nhập thương hiệu từ Excel
            </h2>
            <p className="text-sm text-slate-500">
              Xem trước dữ liệu và chọn những dòng cần thêm vào hệ thống.
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

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">
                File đang xử lý
              </p>
              <p className="text-xs text-slate-500">
                {fileName || "Chưa chọn file"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPickFile}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
              >
                Chọn file khác
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  Đã thêm {result.summary?.inserted ?? 0} thương hiệu mới.
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Số dòng thất bại: {result.summary?.failed ?? 0}.
                </div>
              </div>
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  <p className="font-medium">Chi tiết lỗi:</p>
                  <ul className="mt-1 space-y-1 list-disc pl-4">
                    {result.errors.map((row) => (
                      <li key={row.index ?? row.message}>
                        <span className="font-medium">
                          Dòng {row.index ?? "?"}:
                        </span>{" "}
                        {row.message}
                        {Array.isArray(row.errors) && row.errors.length > 0 && (
                          <ul className="mt-1 space-y-1 list-disc pl-4 text-amber-600">
                            {row.errors.map((msg, idx) => (
                              <li key={idx}>{msg}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
              <p className="text-sm text-slate-500">Đang đọc file...</p>
            </div>
          ) : hasPreview ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                  Tổng dòng: {summary.total ?? rows.length}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                  Hợp lệ: {summary.valid ?? 0}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
                  Lỗi: {summary.invalid ?? 0}
                </span>
                <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-700">
                  Trùng DB: {summary.duplicates_in_db ?? 0}
                </span>
                <span className="rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-700">
                  Trùng file: {summary.duplicates_in_file ?? 0}
                </span>
                <span className="ml-auto text-slate-600">
                  Đã chọn {selectedCount} dòng hợp lệ
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(event) =>
                            onToggleAll(event.target.checked)
                          }
                          disabled={submitting || selectableRows.length === 0}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-3 py-2">Dòng</th>
                      <th className="px-3 py-2">Tên thương hiệu</th>
                      <th className="px-3 py-2">Mô tả</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2">Cảnh báo</th>
                      <th className="px-3 py-2">Lỗi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => {
                      const index = Number(row.index);
                      const isSelected = selected.includes(index);
                      const isValid = !!row?.is_valid;
                      const rowErrors = Array.isArray(row?.errors)
                        ? row.errors
                        : [];
                      const hasDuplicatesInFile = row?.duplicate_in_file;
                      const existing =
                        Array.isArray(row?.existing) && row.existing.length
                          ? row.existing
                          : [];

                      return (
                        <tr
                          key={index}
                          className={isValid ? "bg-white" : "bg-rose-50/60"}
                        >
                          <td className="px-3 py-2 align-top">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleRow(index)}
                              disabled={!isValid || submitting}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2 align-top text-xs text-slate-500">
                            #{index}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <p className="text-sm font-medium text-slate-700">
                              {row?.data?.name || "Chưa có tên"}
                            </p>
                          </td>
                          <td className="px-3 py-2 align-top text-sm text-slate-600">
                            {row?.data?.description || "—"}
                          </td>
                          <td className="px-3 py-2 align-top text-xs">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                                (row?.data?.status ?? "inactive") === "active"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {row?.data?.status ?? "inactive"}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top space-y-1 text-xs text-slate-600">
                            {hasDuplicatesInFile && (
                              <span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-600">
                                Trùng tên trong file
                              </span>
                            )}
                            {existing.length > 0 && (
                              <span className="block rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                                Trùng DB:{" "}
                                {existing
                                  .map((item) => item?.name)
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top text-xs text-rose-600">
                            {rowErrors.length > 0 ? (
                              <ul className="space-y-1 list-disc pl-4">
                                {rowErrors.map((message, idx) => (
                                  <li key={idx}>{message}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-400">---</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Không tìm thấy dữ liệu hợp lệ trong file này.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <div className="text-xs text-slate-500">
            Chỉ những dòng hợp lệ mới được chọn để nhập.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading || submitting || selectedCount === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
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

function formatDate(value) {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const isActive = status === "active";
  const Icon = isActive ? CheckCircle2 : Circle;
  const styles = isActive
    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
    : "bg-amber-50 text-amber-600 border border-amber-100";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${styles}`}
    >
      <Icon size={14} />
      {isActive ? "Hoạt động" : "Tạm dừng"}
    </span>
  );
}

function IconBtn({ children, title, intent = "primary", onClick, disabled }) {
  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-slate-600 transition disabled:opacity-50";
  const palette = {
    primary: "border-indigo-200 text-indigo-600 hover:bg-indigo-50",
    danger: "border-rose-200 text-rose-600 hover:bg-rose-50",
    neutral: "border-slate-200 text-slate-600 hover:bg-slate-100",
  };
  const tone = palette[intent] ?? palette.primary;

  return (
    <button
      type="button"
      className={`${base} ${tone}`}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function BrandViewModal({ brand, onClose }) {
  if (!brand) return null;
  const { name, slug, description, status, created_at, deleted_at } = brand;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Thong tin thuong hieu
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
          >
            Dong
          </button>
        </div>

        <div className="space-y-3 text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase text-slate-500">Ten thuong hieu</p>
            <p className="font-medium text-slate-800">{name}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Slug</p>
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              {slug}
            </code>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Trang thai</p>
            <StatusBadge status={status} />
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Mo ta</p>
            <p className="whitespace-pre-line text-slate-700">
              {description?.trim() ? description : "Chua co mo ta"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Ngay tao</p>
            <p>{formatDate(created_at)}</p>
          </div>
          {deleted_at && (
            <div>
              <p className="text-xs uppercase text-slate-500">Ngay xoa</p>
              <p>{formatDate(deleted_at)}</p>
            </div>
          )}
        </div>
      </div>
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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Trang thai
            </label>
            <select
              value={form.status || "active"}
              onChange={(e) => onChange("status", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="active">hoat dong</option>
              <option value="inactive">Tam dung</option>
            </select>
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
