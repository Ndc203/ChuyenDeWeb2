import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  Plus,
  Download,
  Search,
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  RotateCcw,
  Upload,
  X,
  CheckCircle2,
  Circle,
  Power,
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";

const emptyCategoryForm = () => ({
  name: "",
  description: "",
  parentId: "",
  status: "active",
});
const ROOT_PARENT_LABEL = "Danh muc goc";
const ALL_PARENT_FILTER = "Tat ca danh muc cha";


export default function AdminCategoriesPage() {
  const [query, setQuery] = useState("");
  const [parentFilter, setParentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("active");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyCategoryForm);
  const [importOpen, setImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [importSelected, setImportSelected] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState(emptyCategoryForm);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [treeLock, setTreeLock] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOver, setDragOver] = useState({ id: null, type: null });
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkTarget, setBulkTarget] = useState("");
  const [treeMessage, setTreeMessage] = useState("");
  const treeSnapshotRef = useRef(null);
  const rowsSnapshotRef = useRef(null);
  const treeNoticeTimeout = useRef(null);
  const importInputRef = useRef(null);

  const API_URL = (
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
  ).replace(/\/$/, "");
  const isDeletedView = viewMode === "deleted";

  const buildFormFromCategory = useCallback((category) => {
    if (!category) {
      return emptyCategoryForm();
    }
    return {
      name: category.name || "",
      description: category.description || "",
      parentId: category.parent_id ? String(category.parent_id) : "",
      status: category.status || "active",
    };
  }, []);

  // === Fetch danh muc thuc te ===
  const loadCategories = useCallback(() => {
    setLoading(true);
    const endpoint =
      viewMode === "deleted"
        ? `${API_URL}/api/categories/trashed`
        : `${API_URL}/api/categories`;
    return fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setRows(list);
        if (!isDeletedView) {
          setTreeData(buildCategoryTree(list));
          setBulkSelected(new Set());
        } else {
          setTreeData([]);
          setBulkSelected(new Set());
        }
        return list;
      })
      .catch(() => {
        setRows([]);
        setTreeData([]);
      })
      .finally(() => setLoading(false));
  }, [API_URL, viewMode, isDeletedView]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (isDeletedView) {
      setParentFilter("all");
      setStatusFilter("all");
    }
  }, [isDeletedView]);

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
            ? Object.values(data.errors).flat().join(", ")
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

  const updateEditFormValue = (key, value) => {
    setEditForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleOpenEdit = (category) => {
    if (!category) return;
    setEditTarget(category);
    setEditForm(buildFormFromCategory(category));
    setEditError("");
    setEditLoading(false);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    if (editLoading) {
      return;
    }
    setEditOpen(false);
    setEditTarget(null);
    setEditForm(emptyCategoryForm());
    setEditError("");
  };

  const handleSubmitEdit = async (event) => {
    event.preventDefault();
    if (!editTarget) return;
    const name = editForm.name.trim();
    if (!name) {
      setEditError("Vui long nhap ten danh muc.");
      return;
    }

    setEditLoading(true);
    setEditError("");

    const payload = {
      name,
      description: editForm.description?.trim()
        ? editForm.description.trim()
        : null,
      parent_id: editForm.parentId ? Number(editForm.parentId) : null,
      status: editForm.status || "active",
    };

    try {
      const response = await fetch(`${API_URL}/api/categories/${editTarget.id}`, {
        method: "PUT",
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
            : "Khong the cap nhat danh muc.");
        setEditError(message);
        return;
      }

      await loadCategories();
      setEditOpen(false);
      setEditTarget(null);
      setEditForm(emptyCategoryForm());
      setEditError("");
    } catch (error) {
      setEditError("Khong the ket noi toi may chu.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenView = (category) => {
    if (!category) return;
    setViewTarget(category);
  };

  const handleCloseView = () => {
    setViewTarget(null);
  };

  const resetImportState = useCallback(() => {
    setImportLoading(false);
    setImportError("");
    setImportPreview(null);
    setImportSelected([]);
    setImportResult(null);
    setImportSubmitting(false);
    setImportFile(null);
  }, []);

  const handleCloseImport = () => {
    setImportOpen(false);
    resetImportState();
  };

  const handleTriggerImport = () => {
    importInputRef.current?.click();
  };

  const handleSelectImportFile = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    resetImportState();
    setImportFile(file);
    setImportOpen(true);
    setImportLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/categories/import/preview`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.message ||
          (data?.errors
            ? Object.values(data.errors).flat().join(", ")
            : "Khong the doc file da tai len.");
        setImportPreview(null);
        setImportSelected([]);
        setImportError(message);
        return;
      }

      setImportPreview(data);
      const validIndexes = Array.isArray(data?.rows)
        ? data.rows
            .filter((row) => row?.is_valid)
            .map((row) => Number(row.index))
        : [];
      setImportSelected(validIndexes);
      setImportError("");
    } catch (error) {
      setImportError("Khong the ket noi toi may chu.");
    } finally {
      setImportLoading(false);
      setImportResult(null);
      setImportSubmitting(false);
      if (input) {
        input.value = "";
      }
    }
  };

  const handleToggleImportRow = (index) => {
    setImportResult(null);
    setImportError("");
    setImportSelected((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index]
    );
  };

  const handleToggleImportAll = (checked) => {
    setImportResult(null);
    setImportError("");
    if (!importPreview?.rows?.length) {
      setImportSelected([]);
      return;
    }
    if (checked) {
      const valid = importPreview.rows
        .filter((row) => row?.is_valid)
        .map((row) => Number(row.index));
      setImportSelected(valid);
    } else {
      setImportSelected([]);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile) {
      setImportError("Vui long chon file Excel truoc.");
      return;
    }
    if (!importSelected.length) {
      setImportError("Vui long chon it nhat 1 dong hop le.");
      return;
    }

    setImportSubmitting(true);
    setImportError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", importFile);
    importSelected.forEach((index) =>
      formData.append("selected[]", String(index))
    );

    try {
      const response = await fetch(`${API_URL}/api/categories/import`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.message ||
          (data?.errors
            ? Object.values(data.errors).flat().join(", ")
            : "Khong the nhap danh muc.");
        setImportError(message);
        return;
      }

      setImportResult(data);
      await loadCategories();
    } catch (error) {
      setImportError("Khong the ket noi toi may chu.");
    } finally {
      setImportSubmitting(false);
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

  async function handleRestore(id) {
    setRows((prev) =>
      prev.map((it) => (it.id === id ? { ...it, _restoring: true } : it))
    );

    try {
      const res = await fetch(`${API_URL}/api/categories/${id}/restore`, {
        method: "PATCH",
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.message || "Khong the khoi phuc danh muc.");
        setRows((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, _restoring: false } : it
          )
        );
        return;
      }

      await loadCategories();
    } catch (error) {
      alert("Khong the ket noi toi may chu.");
      setRows((prev) =>
        prev.map((it) => (it.id === id ? { ...it, _restoring: false } : it))
      );
    }
  }

  // === Xoa danh muc ===
  const handleAskDelete = (category) => {
    if (!category || deleteLoading) {
      return;
    }
    setDeleteError("");
    setDeleteTarget({
      id: category.id,
      name: category.name,
      slug: category.slug,
    });
  };

  const handleCloseDelete = () => {
    if (deleteLoading) {
      return;
    }
    setDeleteError("");
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const response = await fetch(
        `${API_URL}/api/categories/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setDeleteError(
          data?.message || "Khong the xoa danh muc."
        );
        return;
      }

      await loadCategories();
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError("Khong the ket noi toi may chu.");
    } finally {
      setDeleteLoading(false);
    }
  };

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
    if (isDeletedView) {
      return [];
    }
    const set = new Set(rows.map((r) => r.parent || ROOT_PARENT_LABEL));
    return [ALL_PARENT_FILTER, ...Array.from(set)];
  }, [rows, isDeletedView]);

  const parentOptions = useMemo(() => {
    if (isDeletedView) {
      return [{ value: "", label: "Khong co danh muc cha" }];
    }
    return [
      { value: "", label: "Khong co danh muc cha" },
      ...rows.map((r) => ({
        value: String(r.id),
        label: r.name || `Danh muc #${r.id}`,
      })),
    ];
  }, [rows, isDeletedView]);

  const editParentOptions = useMemo(() => {
    if (!editTarget) {
      return parentOptions;
    }
    const excludeId = String(editTarget.id);
    return parentOptions.filter(
      (option) => option.value === "" || option.value !== excludeId
    );
  }, [parentOptions, editTarget]);

  useEffect(() => {
    if (isDeletedView) {
      setTreeData([]);
      setBulkSelected(new Set());
      return;
    }
    setTreeData(buildCategoryTree(rows));
  }, [rows, isDeletedView]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchQuery = (r.name || "")
        .toLowerCase()
        .includes(query.toLowerCase());
      if (isDeletedView) {
        return matchQuery;
      }
      const matchParent =
        parentFilter === "all" ||
        (parentFilter === ROOT_PARENT_LABEL
          ? !r.parent
          : r.parent === parentFilter);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchQuery && matchParent && matchStatus;
    });
  }, [rows, query, parentFilter, statusFilter, isDeletedView]);

  useEffect(
    () => () => {
      if (treeNoticeTimeout.current) {
        clearTimeout(treeNoticeTimeout.current);
      }
    },
    []
  );

  const emitTreeMessage = useCallback((msg) => {
    if (treeNoticeTimeout.current) {
      clearTimeout(treeNoticeTimeout.current);
    }
    setTreeMessage(msg);
    treeNoticeTimeout.current = setTimeout(() => setTreeMessage(""), 2500);
  }, []);

  const canDrop = useCallback(
    (dragId, targetId) => {
      if (!dragId || !targetId) return false;
      if (dragId === targetId) return false;
      return !isDescendant(treeData, dragId, targetId);
    },
    [treeData]
  );

  const handleDragStart = useCallback(
    (id) => {
      if (treeLock) return;
      setDraggingId(id);
      treeSnapshotRef.current = cloneTree(treeData);
      rowsSnapshotRef.current = rows;
    },
    [treeData, rows, treeLock]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOver({ id: null, type: null });
  }, []);

  const persistMoves = useCallback(
    async (moves) => {
      const response = await fetch(`${API_URL}/api/categories/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ moves }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data?.message ||
            (data?.errors
              ? Object.values(data.errors).flat().join(", ")
              : "Khong the cap nhat cay danh muc.")
        );
      }
      return data;
    },
    [API_URL]
  );

  const applyMove = useCallback(
    async ({ nodeId, newParentId, position }) => {
      const prevTree = cloneTree(treeData);
      const prevRows = rows;
      const movedTree = moveNodeInTree(treeData, nodeId, newParentId, position);
      if (!movedTree) {
        emitTreeMessage("Khong the di chuyen nut nay.");
        return;
      }
      setTreeData(movedTree);
      setRows(updateRowsForMove(rows, nodeId, newParentId));
      setTreeLock(true);
      setDragOver({ id: null, type: null });
      try {
        await persistMoves([
          {
            id: nodeId,
            parent_id: newParentId,
            position: typeof position === "number" ? position : null,
          },
        ]);
      } catch (error) {
        setTreeData(prevTree);
        setRows(prevRows);
        emitTreeMessage(error.message || "Khong the cap nhat cay.");
      } finally {
        setTreeLock(false);
        handleDragEnd();
      }
    },
    [
      treeData,
      rows,
      emitTreeMessage,
      persistMoves,
      handleDragEnd,
    ]
  );

  const handleDropNode = useCallback(
    (targetId, dropType) => {
      if (!draggingId || treeLock) {
        return;
      }
      const found = findNodeWithParent(treeData, targetId);
      if (!found) return;
      const { node: target, parent } = found;
      let parentId = null;
      let position = null;

      if (dropType === "inside") {
        parentId = target.id;
        position = target.children?.length || 0;
      } else {
        parentId = parent ? parent.id : null;
        const siblings = parent ? parent.children : treeData;
        const targetIndex = siblings.findIndex((x) => x.id === target.id);
        position =
          dropType === "before"
            ? targetIndex
            : Math.min(siblings.length, targetIndex + 1);
      }

      if (draggingId === parentId) {
        emitTreeMessage("Khong the di chuyen vao chinh no.");
        handleDragEnd();
        return;
      }

      if (parentId && isDescendant(treeData, draggingId, parentId)) {
        emitTreeMessage("Khong the tao vong lap (node con cua chinh no).");
        handleDragEnd();
        return;
      }

      applyMove({ nodeId: draggingId, newParentId: parentId, position });
    },
    [draggingId, treeData, treeLock, emitTreeMessage, applyMove, handleDragEnd]
  );

  const toggleBulk = useCallback((id) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearBulk = useCallback(() => {
    setBulkSelected(new Set());
  }, []);

  const handleBulkMove = useCallback(async () => {
    if (!bulkSelected.size) {
      emitTreeMessage("Chua chon danh muc de di chuyen.");
      return;
    }
    const targetParentId = bulkTarget ? Number(bulkTarget) : null;
    const selectedIds = Array.from(bulkSelected);

    const invalid = selectedIds.some(
      (id) => id === targetParentId || isDescendant(treeData, id, targetParentId)
    );
    if (invalid) {
      emitTreeMessage("Khong the di chuyen vao chinh no hoac nhanh con.");
      return;
    }

    treeSnapshotRef.current = cloneTree(treeData);
    rowsSnapshotRef.current = rows;
    setTreeLock(true);

    let nextTree = treeData;
    let nextRows = rows;
    selectedIds.forEach((id, idx) => {
      const updated = moveNodeInTree(nextTree, id, targetParentId, idx);
      if (updated) {
        nextTree = updated;
        nextRows = updateRowsForMove(nextRows, id, targetParentId);
      }
    });

    setTreeData(nextTree);
    setRows(nextRows);

    try {
      await persistMoves(
        selectedIds.map((id, idx) => ({
          id,
          parent_id: targetParentId,
          position: idx,
        }))
      );
      emitTreeMessage("Da di chuyen nhom thanh cong.");
      clearBulk();
    } catch (error) {
      setTreeData(treeSnapshotRef.current || treeData);
      setRows(rowsSnapshotRef.current || rows);
      emitTreeMessage(error.message || "Khong the di chuyen nhom.");
    } finally {
      setTreeLock(false);
    }
  }, [
    bulkSelected,
    bulkTarget,
    emitTreeMessage,
    treeData,
    rows,
    persistMoves,
    clearBulk,
  ]);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <input
        ref={importInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleSelectImportFile}
      />
      {/* Sidebar */}
      <AdminSidebar />

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
                type="button"
                onClick={handleTriggerImport}
                disabled={importLoading || importSubmitting}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <Upload size={16} /> Nhap Excel
              </button>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700"
              >
                <Plus size={16} /> Them danh muc
              </button>
            </div>
          </div>

          <div className="w-full px-10 pb-3 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Che do hien thi</span>
            <div className="inline-flex rounded-full border bg-white p-1 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("active")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  viewMode === "active"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Dang hoat dong
              </button>
              <button
                type="button"
                onClick={() => setViewMode("deleted")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  viewMode === "deleted"
                    ? "bg-rose-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Da xoa
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
              options={
                isDeletedView
                  ? ["all"]
                  : [
                      "all",
                      ...uniqueParents.filter((p) => p !== ALL_PARENT_FILTER),
                    ]
              }
              mapLabel={(v) =>
                v === "all" ? ALL_PARENT_FILTER : v || ROOT_PARENT_LABEL
              }
              disabled={isDeletedView}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={["all", "active", "inactive"]}
              mapLabel={(v) =>
                v === "all"
                  ? "Tat ca trang thai"
                  : v === "active"
                  ? "Hoat dong"
                  : "Tam dung"
              }
              disabled={isDeletedView}
            />
          </div>
        </div>

        {/* Tree + Table */}
        <div className="w-full px-10 pb-10">
          <div
            className={`grid gap-6 ${
              isDeletedView ? "" : "lg:grid-cols-[minmax(260px,320px),1fr]"
            }`}
          >
            {!isDeletedView && (
              <div className="rounded-2xl border bg-white shadow-sm">
                <div className="border-b px-5 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                        Cay danh muc nang cao
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Keo tha de doi thu tu/cha-con. Chon nhieu de di chuyen nhom.
                      </p>
                    </div>
                    {treeLock && (
                      <span className="text-[11px] font-medium text-indigo-600">
                        Dang cap nhat...
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="rounded-lg border px-2 py-1 text-xs"
                      value={bulkTarget}
                      onChange={(e) => setBulkTarget(e.target.value)}
                    >
                      <option value="">Chon goc</option>
                      {rows.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleBulkMove}
                      disabled={treeLock || !bulkSelected.size}
                      className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Di chuyen nhom ({bulkSelected.size || 0})
                    </button>
                    <button
                      type="button"
                      onClick={clearBulk}
                      disabled={!bulkSelected.size || treeLock}
                      className="rounded-lg border px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50"
                    >
                      Bo chon
                    </button>
                    {treeMessage && (
                      <span className="text-[11px] text-amber-600">
                        {treeMessage}
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-[520px] overflow-y-auto px-3 py-4">
                  <CategoryTree
                    nodes={treeData}
                    onDropNode={handleDropNode}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    draggingId={draggingId}
                    dragOver={dragOver}
                    setDragOver={setDragOver}
                    canDrop={canDrop}
                    bulkSelected={bulkSelected}
                    onToggleBulk={toggleBulk}
                    lock={treeLock}
                  />
                </div>
              </div>
            )}
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <Th>Ten danh muc</Th>
                    <Th>Slug</Th>
                    <Th>Danh muc cha</Th>
                    <Th className="w-48">Trang thai</Th>
                    <Th className="w-40">{isDeletedView ? "Ngay xoa" : "Ngay tao"}</Th>
                    <Th className="w-40 text-right pr-4">Thao tac</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-6 text-center text-slate-500"
                      >
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
                          {r.parent || ROOT_PARENT_LABEL}
                        </td>

                        {/* === Trạng thái nằm giữa các cột === */}
                        <td className="px-4 py-3">
                          {isDeletedView ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600">
                                  Da xoa
                                </span>
                                <StatusBadge status={r.status} />
                              </div>
                              {r.auto_delete_at && (
                                <p className="text-xs text-slate-500">
                                  Tu dong xoa vinh vien vao{" "}
                                  {formatDate(r.auto_delete_at)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <StatusBadge status={r.status} />
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {formatDate(isDeletedView ? r.deleted_at : r.created_at)}
                        </td>

                        {/* === Cột thao tác === */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isDeletedView ? (
                              <>
                                <IconBtn
                                  title="Xem chi tiet"
                                  intent="neutral"
                                  onClick={() => handleOpenView(r)}
                                >
                                  <Eye size={16} />
                                </IconBtn>
                                <IconBtn
                                  title="Khoi phuc"
                                  intent="primary"
                                  onClick={() => handleRestore(r.id)}
                                  disabled={r._restoring}
                                >
                                  <RotateCcw size={16} />
                                </IconBtn>
                              </>
                            ) : (
                              <>
                                <IconBtn
                                  title={
                                    r.status === "active"
                                      ? "Chuyen sang tam dung"
                                      : "Kich hoat danh muc"
                                  }
                                  intent={r.status === "active" ? "danger" : "primary"}
                                  disabled={r._updating}
                                  onClick={() => handleToggleStatus(r.id)}
                                >
                                  <Power size={16} />
                                </IconBtn>
                                <IconBtn
                                  title="Xem chi tiet"
                                  intent="neutral"
                                  onClick={() => handleOpenView(r)}
                                >
                                  <Eye size={16} />
                                </IconBtn>
                                <IconBtn
                                  title="Sua"
                                  intent="primary"
                                  onClick={() => handleOpenEdit(r)}
                                  disabled={r._updating}
                                >
                                  <Edit size={16} />
                                </IconBtn>
                                <IconBtn
                                  title="Xoa"
                                  intent="danger"
                                  onClick={() => handleAskDelete(r)}
                                  disabled={
                                    r._updating ||
                                    (deleteLoading && deleteTarget?.id === r.id)
                                  }
                                >
                                  <Trash2 size={16} />
                                </IconBtn>
                              </>
                            )}
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
      <ImportCategoriesModal
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
      <DeleteCategoryModal
        open={Boolean(deleteTarget)}
        category={deleteTarget}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        error={deleteError}
      />
      <ViewCategoryModal category={viewTarget} onClose={handleCloseView} />
      <CategoryFormModal
        mode="edit"
        open={editOpen}
        form={editForm}
        onChange={updateEditFormValue}
        onClose={handleCloseEdit}
        onSubmit={handleSubmitEdit}
        parentOptions={editParentOptions}
        loading={editLoading}
        error={editError}
      />
      <CategoryFormModal
        mode="create"
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

function DeleteCategoryModal({
  open,
  category,
  onClose,
  onConfirm,
  loading,
  error,
}) {
  if (!open || !category) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Xoa danh muc
            </h2>
            <p className="text-sm text-slate-500">
              Danh muc se duoc xoa mem va an khoi danh sach hien thi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p>
            Ban co chac muon xoa danh muc{" "}
            <span className="font-semibold text-slate-800">
              {category.name || `Danh muc #${category.id}`}
            </span>
            ?
          </p>
          {category.slug && (
            <p className="text-xs text-slate-400">Slug: {category.slug}</p>
          )}
          <p className="text-xs text-amber-600">
            Luu y: Khong the xoa khi danh muc con dang ton tai.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Huy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? "Dang xoa..." : "Xac nhan xoa"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryFormModal({
  mode = "create",
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

  const isEdit = mode === "edit";
  const title = isEdit ? "Sua danh muc" : "Them danh muc";
  const subtitle = isEdit
    ? "Cap nhat thong tin danh muc."
    : "Nhap thong tin danh muc moi.";
  const submitLabel = isEdit ? "Luu danh muc" : "Tao danh muc";
  const processingLabel = isEdit ? "Dang luu..." : "Dang tao...";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {title}
            </h2>
            <p className="text-sm text-slate-500">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
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
              disabled={loading}
              className="rounded-xl border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? processingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportCategoriesModal({
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
    : "Nhap danh muc";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
      <div className="flex w-full max-w-5xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between px-6 py-5 border-b">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Nhap danh muc tu Excel
            </h2>
            <p className="text-sm text-slate-500">
              Xem truoc cac dong hop le truoc khi chen vao he thong.
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

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
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
                  Da chen {result.summary?.inserted ?? 0} danh muc moi.
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  So dong that bai: {result.summary?.failed ?? 0}.
                </div>
              </div>
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  <p className="font-medium">Chi tiet loi:</p>
                  <ul className="mt-1 space-y-1 pl-4 list-disc">
                    {result.errors.map((row) => (
                      <li key={row.index ?? row.message}>
                        <span className="font-medium">
                          Dong {row.index ?? "?"}:
                        </span>{" "}
                        {row.message}
                        {Array.isArray(row.errors) && row.errors.length > 0 && (
                          <ul className="mt-1 space-y-1 pl-4 list-disc text-amber-600">
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
                          onChange={(e) => onToggleAll(e.target.checked)}
                          disabled={!selectableRows.length || submitting}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-3 py-2">Dong</th>
                      <th className="px-3 py-2">Ten danh muc</th>
                      <th className="px-3 py-2">Danh muc cha</th>
                      <th className="px-3 py-2">Trang thai</th>
                      <th className="px-3 py-2">Canh bao</th>
                      <th className="px-3 py-2">Loi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => {
                      const index = Number(row.index);
                      const checked = selected.includes(index);
                      const disabled = !row.is_valid || submitting;
                      const parent = row.parent;
                      const parentLabel =
                        !parent || !parent.type
                          ? "Danh muc goc"
                          : parent.type === "existing"
                          ? `${parent.label} (ID ${parent.id})`
                          : `${parent.label} (dong ${parent.index})`;

                      return (
                        <tr
                          key={row.index}
                          className={
                            row.is_valid
                              ? "bg-white"
                              : "bg-rose-50/60"
                          }
                        >
                          <td className="px-3 py-2 align-top">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => onToggleRow(index)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2 align-top text-xs text-slate-500">
                            #{index}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <p className="text-sm font-medium text-slate-700">
                              {row.data?.name || "Chua co ten"}
                            </p>
                            {row.data?.description && (
                              <p className="mt-1 text-xs text-slate-400">
                                {row.data.description}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top text-sm text-slate-600">
                            {parentLabel}
                          </td>
                          <td className="px-3 py-2 align-top text-xs">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                                row.data?.status === "active"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {row.data?.status || "unknown"}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top space-y-1 text-xs text-slate-600">
                            {row.duplicate_in_file && (
                              <span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-600">
                                Trung ten trong file
                              </span>
                            )}
                            {Array.isArray(row.existing) &&
                              row.existing.length > 0 && (
                                <span className="block rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                                  Trung DB:{" "}
                                  {row.existing
                                    .map((item) => item.name)
                                    .join(", ")}
                                </span>
                              )}
                          </td>
                          <td className="px-3 py-2 align-top text-xs text-rose-600">
                            {Array.isArray(row.errors) && row.errors.length ? (
                              <ul className="space-y-1 list-disc pl-4">
                                {row.errors.map((msg, idx) => (
                                  <li key={`${row.index}-err-${idx}`}>
                                    {msg}
                                  </li>
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
            !loading && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Khong tim thay du lieu hop le trong file nay.
              </div>
            )
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
            >
              Huy
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || !selectedCount}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* === COMPONENTS === */
function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}
function IconBtn({ children, title, intent = "primary", onClick, disabled }) {
  const base =
    "inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50";
  const palette = {
    primary: "border-indigo-200 text-indigo-600 hover:bg-indigo-50",
    danger: "border-rose-200 text-rose-600 hover:bg-rose-50",
    neutral: "border-slate-200 text-slate-600 hover:bg-slate-100",
  };
  const color = palette[intent] ?? palette.primary;
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

function ViewCategoryModal({ category, onClose }) {
  if (!category) return null;
  const {
    name,
    slug,
    status,
    parent,
    created_at,
    deleted_at,
    auto_delete_at,
    description,
  } = category;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Thong tin danh muc
            </h2>
            <p className="text-sm text-slate-500">
              Xem chi tiet danh muc va trang thai hien tai.
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
              Ten danh muc
            </p>
            <p className="text-base font-semibold text-slate-800">
              {name || "(Khong co ten)"}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Slug
              </p>
              <p className="font-medium text-slate-700">
                {slug || "(Khong co)"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Trang thai
              </p>
              <StatusBadge status={status} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Danh muc cha
              </p>
              <p className="font-medium text-slate-700">
                {parent || "Danh muc goc"}
              </p>
            </div>
            <div>
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
            <p className="rounded-xl border bg-slate-50 px-3 py-2 text-slate-600">
              {description ? description : "Khong co mo ta"}
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
function Select({ value, onChange, options, mapLabel, disabled = false }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 appearance-none disabled:cursor-not-allowed disabled:opacity-60"
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

function CategoryTree({
  nodes,
  onDropNode,
  onDragStart,
  onDragEnd,
  draggingId,
  dragOver,
  setDragOver,
  canDrop,
  bulkSelected,
  onToggleBulk,
  lock,
}) {
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

  const ensureExpanded = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

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
      <p className="px-2 text-sm text-slate-500">Khong co danh muc nao.</p>
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
          ensureExpanded={ensureExpanded}
          onDropNode={onDropNode}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          draggingId={draggingId}
          dragOver={dragOver}
          setDragOver={setDragOver}
          canDrop={canDrop}
          bulkSelected={bulkSelected}
          onToggleBulk={onToggleBulk}
          lock={lock}
        />
      ))}
    </div>
  );
}

function DropZone({ active, onDrop, onDragOver }) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.();
      }}
      className={`h-1.5 rounded-full transition-colors ${
        active ? "bg-indigo-400" : "bg-transparent hover:bg-indigo-100"
      }`}
    />
  );
}

function CategoryTreeNode({
  node,
  depth,
  expanded,
  onToggle,
  ensureExpanded,
  onDropNode,
  onDragStart,
  onDragEnd,
  draggingId,
  dragOver,
  setDragOver,
  canDrop,
  bulkSelected,
  onToggleBulk,
  lock,
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const isDragging = draggingId === node.id;
  const isDragOver =
    dragOver?.id === node.id && ["before", "after", "inside"].includes(dragOver?.type);
  const selected = bulkSelected.has(node.id);

  const handleDrop = (type) => {
    onDropNode(node.id, type);
    ensureExpanded(node.id);
  };

  const allowDropHere = !lock && draggingId && canDrop(draggingId, node.id);

  return (
    <div>
      <DropZone
        active={dragOver?.id === node.id && dragOver?.type === "before"}
        onDragOver={() => {
          if (!allowDropHere) return;
          setDragOver({ id: node.id, type: "before" });
        }}
        onDrop={() => handleDrop("before")}
      />
      <div
        className={`flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50 ${
          isDragging ? "opacity-60" : ""
        } ${isDragOver ? "ring-1 ring-indigo-300" : ""}`}
        style={{ paddingLeft: depth * 14 }}
        draggable={!lock}
        onDragStart={() => onDragStart(node.id)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => {
          if (!allowDropHere) return;
          e.preventDefault();
          setDragOver({ id: node.id, type: "inside" });
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (!allowDropHere) return;
          handleDrop("inside");
        }}
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
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={selected}
          onChange={() => onToggleBulk(node.id)}
          disabled={lock}
        />
        <div className="flex flex-1 items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-slate-700">{node.name}</p>
            <p className="text-xs text-slate-400">{node.slug}</p>
          </div>
          <StatusBadge status={node.status} />
        </div>
      </div>
      <DropZone
        active={dragOver?.id === node.id && dragOver?.type === "after"}
        onDragOver={() => {
          if (!allowDropHere) return;
          setDragOver({ id: node.id, type: "after" });
        }}
        onDrop={() => handleDrop("after")}
      />
      {hasChildren && isOpen && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              ensureExpanded={ensureExpanded}
              onDropNode={onDropNode}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              draggingId={draggingId}
              dragOver={dragOver}
              setDragOver={setDragOver}
              canDrop={canDrop}
              bulkSelected={bulkSelected}
              onToggleBulk={onToggleBulk}
              lock={lock}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function cloneTree(nodes) {
  return nodes.map((node) => ({
    ...node,
    children: cloneTree(node.children || []),
  }));
}

function findNodeWithParent(nodes, id, parent = null) {
  for (const node of nodes) {
    if (node.id === id) {
      return { node, parent };
    }
    const found = findNodeWithParent(node.children || [], id, node);
    if (found) return found;
  }
  return null;
}

function nodeContains(node, targetId) {
  if (!node) return false;
  if (node.id === targetId) return true;
  return (node.children || []).some((child) => nodeContains(child, targetId));
}

function isDescendant(nodes, ancestorId, childId) {
  if (!ancestorId || !childId) return false;
  const ancestor = findNodeWithParent(nodes, ancestorId)?.node;
  if (!ancestor) return false;
  return nodeContains(ancestor, childId);
}

function removeNodeFromTree(nodes, id) {
  const result = [];
  let removed = null;

  nodes.forEach((node) => {
    if (node.id === id) {
      removed = { ...node };
      return;
    }
    const { tree: childTree, removed: childRemoved } = removeNodeFromTree(
      node.children || [],
      id
    );
    const newNode = childRemoved
      ? { ...node, children: childTree }
      : { ...node, children: cloneTree(node.children || []) };
    if (childRemoved) {
      removed = childRemoved;
    }
    result.push(newNode);
  });

  return { tree: result, removed };
}

function insertNodeIntoTree(nodes, node, parentId, position = null) {
  if (!parentId) {
    const roots = [...nodes];
    const insertPos =
      position !== null ? Math.min(position, roots.length) : roots.length;
    roots.splice(insertPos, 0, node);
    return roots;
  }

  return nodes.map((n) => {
    if (n.id === parentId) {
      const children = [...(n.children || [])];
      const insertPos =
        position !== null ? Math.min(position, children.length) : children.length;
      children.splice(insertPos, 0, node);
      return { ...n, children };
    }
    const updatedChildren = insertNodeIntoTree(
      n.children || [],
      node,
      parentId,
      position
    );
    if (updatedChildren !== n.children) {
      return { ...n, children: updatedChildren };
    }
    return n;
  });
}

function moveNodeInTree(tree, nodeId, newParentId, position) {
  const { tree: withoutNode, removed } = removeNodeFromTree(tree, nodeId);
  if (!removed) return null;
  const movedNode = { ...removed, parent_id: newParentId ?? null };
  return insertNodeIntoTree(withoutNode, movedNode, newParentId, position);
}

function updateRowsForMove(rows, id, parentId) {
  const parentName = parentId
    ? rows.find((r) => r.id === parentId)?.name || null
    : null;
  return rows.map((r) =>
    r.id === id
      ? {
          ...r,
          parent_id: parentId ?? null,
          parent: parentId ? parentName : null,
        }
      : r
  );
}
