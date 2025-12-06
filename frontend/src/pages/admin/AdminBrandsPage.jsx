import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
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
import axiosClient from "../../api/axiosClient"; // Import axiosClient
import Swal from "sweetalert2";

// Helper de tao object rong
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
const NAME_PATTERN = /^[\p{L}\d\s'-]+$/u;
const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 1000;
const NAME_REQUIRED_ERROR = "Ten khong duoc de trong.";
const INVALID_VALUE_ERROR = "Vui long nhap gia tri hop le.";
const lengthError = (max) => `Gia tri qua dai. Toi da ${max} ky tu.`;
const descriptionLengthError = (max) => `Mo ta khong duoc vuot ${max} ky tu.`;
const SLUG_DUPLICATE_ERROR = "Slug da ton tai.";
const STALE_DATA_MESSAGE =
  "Du lieu da thay doi. Vui long tai lai trang roi thao tac lai.";
const INVALID_PARAM_MESSAGE = "Tham so khong hop le.";
const MAX_PAGE_PARAM = 1000;
const isBlank = (value = "") => /^\s*$/u.test(value);
const truncateText = (value, max = 15) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return str.length > max ? `${str.slice(0, max)}...` : str;
};
const PAGE_SIZE = 10;
const pageSummary = (page, pageSize, total) => {
  if (total === 0) return "Khong co muc nao";
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  return `Hien thi ${start} den ${end} trong ${total} muc`;
};
const normalizeDeleteError = (message) => {
  if (!message) return "Khong the xoa thuong hieu.";
  if (/no query results/i.test(message)) return "Thuong hieu khong ton tai hoac da bi xoa.";
  return message;
};

export default function AdminBrandsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("active");
  const [page, setPage] = useState(1);
  const [pageError, setPageError] = useState("");
  const [searchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [form, setForm] = useState(emptyBrandForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [slugState, setSlugState] = useState(initialSlugState);
  const [slugError, setSlugError] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
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

  const normalizeName = useCallback(
    (text = "") =>
      (text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, ""),
    []
  );
  const hasInvalidChars = useCallback(
    (text = "") => !NAME_PATTERN.test(text),
    []
  );

  // --- 1. Load Brands ---
  const loadBrands = useCallback(() => {
    setLoading(true);
    const endpoint = viewMode === "deleted" ? "/brands/trashed" : "/brands";

    axiosClient
      .get(endpoint)
      .then((res) => {
        // Tuy backend tra ve, gia su la res.data hoac res.data.data
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setRows(data);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [viewMode]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (!pageParam) {
      setPageError("");
      setPage(1);
      return;
    }
    if (!/^\d+$/.test(pageParam)) {
      setPageError(INVALID_PARAM_MESSAGE);
      setPage(1);
      return;
    }
    const numeric = Number(pageParam);
    if (numeric <= 0 || numeric > MAX_PAGE_PARAM) {
      setPageError(INVALID_PARAM_MESSAGE);
      setPage(1);
      return;
    }
    setPageError("");
    setPage(numeric);
  }, [searchParams]);

  // Click outside export dropdown
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

  // --- 2. Handle Export ---
  const handleExport = useCallback(async (format) => {
    try {
      setExportOpen(false);
      // Goi API lay file blob
      const response = await axiosClient.get(
        `/brands/export?format=${format}`,
        { responseType: "blob" }
      );

      // Tao link tai xuong
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // Dat ten file tu header neu can thiet
      link.setAttribute(
        "download",
        `brands_export.${format === "excel" ? "xlsx" : "pdf"}`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      Swal.fire({
        icon: "error",
        title: "Xuat file that bai",
        text: "Vui long thu lai.",
      });
    }
  }, []);

  // --- 3. Handle Import ---
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
  }, [resetImportState]);

  const handleTriggerImport = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleSelectImportFile = useCallback(
    async (event) => {
      const input = event.target;
      const file = input?.files?.[0];
      if (!file) return;

      resetImportState();
      setImportFile(file);
      setImportOpen(true);
      setImportLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        // Dung axiosClient post FormData
        const response = await axiosClient.post(
          "/brands/import/preview",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" }, // Axios tu set nhung ghi ro cung tot
          }
        );

        const data = response.data;
        setImportPreview(data);

        // Auto select valid rows
        const validIndexes = Array.isArray(data?.rows)
          ? data.rows
              .filter((row) => row?.is_valid)
              .map((row) => Number(row.index))
          : [];
        setImportSelected(validIndexes);
      } catch (error) {
        const message =
          error.response?.data?.message ||
          "Khong the doc file. Vui long kiem tra lai.";
        setImportError(message);
        setImportPreview(null);
        setImportSelected([]);
      } finally {
        setImportLoading(false);
        if (importInputRef.current) {
          importInputRef.current.value = "";
        }
      }
    },
    [resetImportState]
  );

  const handleToggleImportRow = useCallback((index) => {
    setImportResult(null);
    setImportError("");
    setImportSelected((prev) => {
      const exists = prev.includes(index);
      if (exists) return prev.filter((value) => value !== index);
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
      setImportError("Vui long chon file Excel truoc.");
      return;
    }
    if (!importSelected.length) {
      setImportError("Vui long chon it nhat mot dong hop le.");
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
      const response = await axiosClient.post("/brands/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(response.data);
      await loadBrands(); // Reload bang sau khi import thanh cong
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Khong the nhap thuong hieu. Vui long thu lai.";
      setImportError(message);
    } finally {
      setImportSubmitting(false);
    }
  }, [importFile, importSelected, loadBrands]);

  // --- 4. Search Filter ---
  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const byKeyword = keyword
      ? rows.filter((brand) => {
          const haystack = [
            brand.name || "",
            brand.slug || "",
            brand.description || "",
            brand.deleted_at || "",
            brand.auto_delete_at || "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(keyword);
        })
      : rows;

    if (statusFilter === "all") return byKeyword;
    return byKeyword.filter((brand) => brand.status === statusFilter);
  }, [rows, query, statusFilter]);

  useEffect(() => {
    setStatusFilter("all");
    setPage(1);
  }, [viewMode]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  // --- 5. Slugify Logic ---
  useEffect(() => {
    if (!formOpen) return;

    const name = form.name.trim();
    const ignoreId =
      formMode === "edit" && editTarget ? String(editTarget.id) : null;

    if (!name) {
      setSlugState(initialSlugState);
      setSlugError("");
      return;
    }

    let cancelled = false;
    // Axios CancelToken source
    const controller = new AbortController();

    setSlugState((prev) => ({ ...prev, loading: true }));
    setSlugError("");

    const timer = setTimeout(() => {
      const params = new URLSearchParams({ text: name });
      if (ignoreId) params.set("ignore", ignoreId);

      axiosClient
        .get(`/brands/slugify?${params.toString()}`, {
          signal: controller.signal,
        })
        .then((res) => {
          if (cancelled) return;
          const data = res.data;
          setSlugState({
            slug: data?.slug || "",
            base: data?.base || "",
            available:
              typeof data?.available === "boolean" ? data.available : true,
            modified: Boolean(data?.modified),
            loading: false,
          });
        })
        .catch((err) => {
          if (axiosClient.isCancel(err) || cancelled) return;
          setSlugError("Khong the sinh slug tu dong.");
          setSlugState(initialSlugState);
        });
    }, 350);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [editTarget, form.name, formMode, formOpen]);

  // --- 6. Form Handlers ---
  const handleOpenCreate = () => {
    if (isDeletedView) setViewMode("active");
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
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitForm = async (event) => {
    event.preventDefault();
    if (formLoading) return;

    const rawName = form.name ?? "";
    const name = rawName.trim();
    const description = form.description ?? "";

    if (!rawName) {
      setFormError(NAME_REQUIRED_ERROR);
      Swal.fire({
        icon: "error",
        title: "Khong hop le",
        text: NAME_REQUIRED_ERROR,
      });
      return;
    }
    if (isBlank(rawName)) {
      setFormError(INVALID_VALUE_ERROR);
      Swal.fire({
        icon: "error",
        title: "Khong hop le",
        text: INVALID_VALUE_ERROR,
      });
      return;
    }
    if (hasInvalidChars(name)) {
      setFormError(INVALID_VALUE_ERROR);
      Swal.fire({
        icon: "error",
        title: "Khong hop le",
        text: INVALID_VALUE_ERROR,
      });
      return;
    }
    if (name.length > NAME_MAX_LENGTH) {
      const msg = lengthError(NAME_MAX_LENGTH);
      setFormError(msg);
      Swal.fire({
        icon: "error",
        title: "Khong hop le",
        text: msg,
      });
      return;
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      const msg = descriptionLengthError(DESCRIPTION_MAX_LENGTH);
      setFormError(msg);
      Swal.fire({
        icon: "error",
        title: "Khong hop le",
        text: msg,
      });
      return;
    }
    if (slugState.loading) {
      setFormError("Dang kiem tra slug, vui long cho...");
      return;
    }
    if (!slugState.available) {
      setFormError(SLUG_DUPLICATE_ERROR);
      Swal.fire({
        icon: "error",
        title: "Khong hop le",
        text: SLUG_DUPLICATE_ERROR,
      });
      return;
    }
    const normalized = normalizeName(name);
    const isDuplicate = rows.some(
      (row) =>
        (formMode !== "edit" || !editTarget || row.id !== editTarget.id) &&
        normalizeName(row.name || "") === normalized
    );
    if (isDuplicate) {
      const message = "Ten thuong hieu da ton tai.";
      setFormError(message);
      Swal.fire({
        icon: "error",
        title: "Khong hop le",
        text: message,
      });
      return;
    }

    const sanitizedDescription = description.trim();
    const payload = {
      name,
      description: sanitizedDescription ? sanitizedDescription : null,
      status: form.status === "inactive" ? "inactive" : "active",
    };

    if (formMode === "edit" && editTarget) {
      if (!editTarget.updated_at) {
        const message = "Khong xac dinh phien ban du lieu. Vui long tai lai.";
        setFormError(message);
        Swal.fire({
          icon: "error",
          title: "Khong the luu thuong hieu",
          text: message,
        });
        return;
      }
      payload.updated_at = editTarget.updated_at;
    }

    setFormLoading(true);
    setFormError("");

    try {
      const action = formMode === "edit" && editTarget ? "edit" : "create";
      if (formMode === "edit" && editTarget) {
        await axiosClient.put(`/brands/${editTarget.id}`, payload);
      } else {
        await axiosClient.post("/brands", payload);
      }
      await loadBrands();
      Swal.fire({
        icon: "success",
        title:
          action === "edit" ? "Da cap nhat thuong hieu" : "Da them thuong hieu",
        text:
          action === "edit"
            ? "Thong tin thuong hieu da duoc luu."
            : "Thuong hieu moi da duoc tao.",
      });
      handleCloseForm();
    } catch (error) {
      const isConflict = error.response?.status === 409;
      const message =
        (isConflict && STALE_DATA_MESSAGE) ||
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(", ")
          : "Loi he thong.");

      setFormError(message);
      Swal.fire({
        icon: "error",
        title: isConflict ? "Du lieu thay doi" : "Khong the luu thuong hieu",
        text: message,
      });

      if (isConflict) {
        await loadBrands();
      }
    } finally {
      setFormLoading(false);
    }
  };
  // --- 7. Action Handlers (Delete, Restore, Toggle) ---
  const handleAskDelete = (brand) => {
    if (isDeletedView || !brand) return;
    setDeleteError("");
    setDeleteTarget({ id: brand.id, name: brand.name, slug: brand.slug });
  };

  const handleCloseDelete = () => {
    if (deleteLoading) return;
    setDeleteError("");
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await axiosClient.delete(`/brands/${deleteTarget.id}`);
      setRows((prev) => prev.filter((row) => row.id !== deleteTarget.id));
      Swal.fire({ icon: "success", title: "Da xoa thuong hieu" });
      setDeleteTarget(null);
    } catch (error) {
      const message = normalizeDeleteError(
        error.response?.data?.message || "Khong the xoa thuong hieu."
      );
      setDeleteError(message);
      Swal.fire({
        icon: "error",
        title: "Khong the xoa thuong hieu",
        text: message,
      });
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleToggleStatus = async (brand) => {
    if (isDeletedView) return;
    setTogglingId(brand.id);
    try {
      const response = await axiosClient.patch(`/brands/${brand.id}/toggle`);
      setRows((prev) =>
        prev.map((row) =>
          row.id === brand.id ? { ...row, status: response.data.status } : row
        )
      );
      Swal.fire({ icon: "success", title: "Da cap nhat trang thai" });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Khong the cap nhat trang thai",
        text: "Vui long thu lai.",
      });
    } finally {
      setTogglingId(null);
    }
  };
  const handleRestore = async (brand) => {
    setRestoringId(brand.id);
    try {
      await axiosClient.patch(`/brands/${brand.id}/restore`);
      setRows((prev) => prev.filter((row) => row.id !== brand.id));
      Swal.fire({ icon: "success", title: "Da khoi phuc thuong hieu" });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Khong the khoi phuc thuong hieu",
        text: "Vui long thu lai.",
      });
    } finally {
      setRestoringId(null);
    }
  };

  const handleOpenView = (brand) => setViewTarget(brand);
  const handleCloseView = () => setViewTarget(null);

  // --- RENDER ---
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
          {pageError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
              {pageError}
            </div>
          )}
          <header className="mb-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-800">
                  Quan ly Thuong hieu
                </h1>
                <p className="text-sm text-slate-500">
                  Du lieu dong bo tu Laravel API. Quan ly trang thai va thong
                  tin thuong hieu.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="relative" ref={exportRef}>
                  <button
                    onClick={() => setExportOpen((value) => !value)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <Download size={16} />
                    Xuat file
                  </button>
                  {exportOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => handleExport("excel")}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <span>Tai Excel</span>
                      </button>
                      <button
                        onClick={() => handleExport("pdf")}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <span>Tai PDF</span>
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
                  Nhap Excel
                </button>
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Plus size={16} />
                  Them thuong hieu
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Che do hien thi
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
                    Hoat dong
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
                    paginatedRows.map((brand, index) => (
                      <tr
                        key={brand.id}
                        className={index % 2 ? "bg-white" : "bg-slate-50/50"}
                      >
                        <td
                          className="px-4 py-3 font-medium"
                          title={brand.name}
                        >
                          {truncateText(brand.name)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <span title={brand.slug}>
                            {truncateText(brand.slug)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <span
                            title={
                              brand.description?.trim()
                                ? brand.description
                                : "--"
                            }
                          >
                            {brand.description?.trim()
                              ? truncateText(brand.description)
                              : "--"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isDeletedView ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600">
                                  Da xoa
                                </span>
                                <StatusBadge status={brand.status} />
                              </div>
                              {brand.auto_delete_at && (
                                <p className="text-xs text-slate-500">
                                  Tu dong xoa vinh vien vao{" "}
                                  {formatDate(brand.auto_delete_at)}
                                </p>
                              )}
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
                                  title="KhAi phac"
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
                                  title="Xem chi tiat"
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
                                  onClick={() => handleAskDelete(brand)}
                                  disabled={
                                    deleteLoading &&
                                    deleteTarget?.id === brand.id
                                  }
                                >
                                  {deleteLoading &&
                                  deleteTarget?.id === brand.id ? (
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
            <div className="flex flex-col gap-2 border-t bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>{pageSummary(page, PAGE_SIZE, filteredRows.length)}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden="true">&lt;</span>
                </button>
                <span className="px-2 text-xs font-semibold text-slate-800">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden="true">&gt;</span>
                </button>
              </div>
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

      <DeleteBrandModal
        open={Boolean(deleteTarget)}
        brand={deleteTarget}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        error={deleteError}
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

// --- Cac component con ImportBrandsModal, BrandFormModal... giu nguyen logic UI ---
// (Minh chi paste lai phan ImportBrandsModal de dam bao file chay,
// cac component nho khac nhu Th, StatusBadge... giu nguyen nhu file cu cua ban)

function DeleteBrandModal({ open, brand, onClose, onConfirm, loading, error }) {
  if (!open || !brand) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Xoa thuong hieu
            </h2>
            <p className="text-sm text-slate-500">
              Thuong hieu se duoc xoa mem va an khoi danh sach hien thi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p>
            Ban co chac muon xoa thuong hieu{" "}
            <span className="font-semibold text-slate-800 break-words">
              {brand.name}
            </span>
            ?
          </p>
          <p className="text-xs text-amber-600">
            Luu y: Khong the xoa khi thuong hieu dang duoc su dung.
          </p>
        </div>
        {error && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Huy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700"
          >
            {loading ? "Dang xoa..." : "Xac nhan xoa"}
          </button>
        </div>
      </div>
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
    ? "Dang nhap..."
    : result
    ? "Nhap lai"
    : "Nhap thuong hieu";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
      <div className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Nhap thuong hieu tu Excel
            </h2>
            <p className="text-sm text-slate-500">
              Xem truoc du lieu va chon nhung dong can them vao he thong.
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
                File dang xu ly
              </p>
              <p className="text-xs text-slate-500">
                {fileName || "Chua chon file"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPickFile}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
              >
                Chon file khac
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Dong
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
                  Da them {result.summary?.inserted ?? 0} thuong hieu moi.
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  So dong that bai: {result.summary?.failed ?? 0}.
                </div>
              </div>
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  <p className="font-medium">Chi tiet loi:</p>
                  <ul className="mt-1 space-y-1 list-disc pl-4">
                    {result.errors.map((row) => (
                      <li key={row.index ?? row.message}>
                        <span className="font-medium">
                          Dong {row.index ?? "?"}:
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
              <p className="text-sm text-slate-500">Dang doc file...</p>
            </div>
          ) : hasPreview ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                  Tong dong: {summary.total ?? rows.length}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                  Hop le: {summary.valid ?? 0}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
                  Loi: {summary.invalid ?? 0}
                </span>
                <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-700">
                  Trung DB: {summary.duplicates_in_db ?? 0}
                </span>
                <span className="rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-700">
                  Trung file: {summary.duplicates_in_file ?? 0}
                </span>
                <span className="ml-auto text-slate-600">
                  Da chon {selectedCount} dong hop le
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
                      <th className="px-3 py-2">Dong</th>
                      <th className="px-3 py-2">Ten thuong hieu</th>
                      <th className="px-3 py-2">Mo ta</th>
                      <th className="px-3 py-2">Trang thai</th>
                      <th className="px-3 py-2">Canh bao</th>
                      <th className="px-3 py-2">Loi</th>
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
                            #{index - 1}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <p className="text-sm font-medium text-slate-700">
                              {row?.data?.name || "Chua co ten"}
                            </p>
                          </td>
                          <td className="px-3 py-2 align-top text-sm text-slate-600">
                            {row?.data?.description || "--"}
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
                                Trung ten trong file
                              </span>
                            )}
                            {existing.length > 0 && (
                              <span className="block rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                                Trung DB:{" "}
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
              Khong tim thay du lieu hop le trong file nay.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <div className="text-xs text-slate-500">
            Chi nhung dong hop le moi duoc chon de nhap.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              disabled={submitting}
            >
              Huy
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
      {isActive ? "Hoat dong" : "Tam dung"}
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
  const {
    name,
    slug,
    description,
    status,
    created_at,
    deleted_at,
    auto_delete_at,
  } = brand;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Thong tin thuong hieu
            </h2>
            <p className="text-sm text-slate-500">
              Xem chi tiet thuong hieu va trang thai hien tai.
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

        <div className="mt-5 space-y-4 text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Ten thuong hieu
            </p>
            <p className="text-base font-semibold text-slate-800 break-words">
              {name || "(Khong co ten)"}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Slug
              </p>
              <p className="font-medium text-slate-700 break-all">
                {slug || "(Khong co)"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Trang thai
              </p>
              <StatusBadge status={status} />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Ngay tao
              </p>
              <p className="font-medium text-slate-700">
                {formatDate(created_at)}
              </p>
            </div>
            {deleted_at && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Ngay xoa
                </p>
                <p className="font-medium text-slate-700">
                  {formatDate(deleted_at)}
                </p>
              </div>
            )}
            {auto_delete_at && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Tu dong xoa vinh vien
                </p>
                <p className="font-medium text-slate-700">
                  {formatDate(auto_delete_at)}
                </p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Mo ta
            </p>
            <p className="rounded-xl border bg-slate-50 px-3 py-2 text-slate-600 whitespace-pre-wrap break-words">
              {description?.trim() ? description : "Khong co mo ta"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Dong
          </button>
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
                <span className="font-medium text-slate-700">Slug du kien:</span>{" "}
                <code className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px] break-all">
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
              onChange={(e) =>
                onChange(
                  "description",
                  e.target.value.slice(0, DESCRIPTION_MAX_LENGTH)
                )
              }
              maxLength={DESCRIPTION_MAX_LENGTH}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Mo ta ngan gon ve thuong hieu"
            />
            <div className="mt-1 text-right text-xs text-slate-500">
              {(form.description?.length || 0)}/{DESCRIPTION_MAX_LENGTH} ky tu
            </div>
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
              <option value="active">Hoat dong</option>
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








