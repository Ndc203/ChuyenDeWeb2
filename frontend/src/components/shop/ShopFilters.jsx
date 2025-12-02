import React, { useState, useEffect, useMemo } from 'react';

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="18" r="1" fill="currentColor" />
  </svg>
);

const LaptopIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect x="3" y="5" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 18h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const AudioIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path
      d="M7 4v10m0 0a3 3 0 1 0 6 0V4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="5" y="14" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="14" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 9h16l-1-3h-4l-1-2H10L9 6H5L4 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const AccessoryIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path
      d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const PriceIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path
      d="M12 6v12m-4-6h8M7 10h10M7 14h10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const ChevronIcon = ({ open = false }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
    fill="none"
  >
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const iconSet = [PhoneIcon, LaptopIcon, AudioIcon, CameraIcon, AccessoryIcon];
const depthPadding = ['pl-4 pr-4', 'pl-8 pr-4', 'pl-12 pr-4', 'pl-16 pr-4'];

const ShopFilters = ({ categories = [], brands = [], filters = {}, onFilterChange }) => {
  const activePriceRange = Array.isArray(filters?.priceRange) ? filters.priceRange : [0, 100000000];
  const [priceMin, setPriceMin] = useState(activePriceRange[0].toString());
  const [priceMax, setPriceMax] = useState(activePriceRange[1].toString());
  const [openCategoryIds, setOpenCategoryIds] = useState(() => new Set());

  useEffect(() => {
    if (Array.isArray(filters?.priceRange)) {
      setPriceMin((filters.priceRange[0] ?? 0).toString());
      setPriceMax((filters.priceRange[1] ?? 0).toString());
    }
  }, [filters?.priceRange?.[0], filters?.priceRange?.[1]]);

  useEffect(() => {
    setOpenCategoryIds(new Set());
  }, [categories]);

  const parsePrice = (value, fallback = 0) => {
    if (value === '' || value === null || value === undefined) {
      return fallback;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0, numeric) : fallback;
  };

  const quickPriceFilters = useMemo(
    () => [
      { label: 'Duoi 5 trieu', range: [0, 5000000] },
      { label: '5 trieu - 10 trieu', range: [5000000, 10000000] },
      { label: '10 trieu - 20 trieu', range: [10000000, 20000000] },
      { label: 'Tren 20 trieu', range: [20000000, 100000000] },
    ],
    []
  );

  const categoryTree = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    const nodes = categories.map((category, index) => {
      const rawId = category?.category_id ?? category?.id ?? `category-${index}`;
      return {
        ...category,
        _id: rawId?.toString(),
        children: [],
      };
    });

    const nodeMap = new Map(nodes.map((node) => [node._id, node]));
    const roots = [];

    nodes.forEach((node) => {
      const parentRaw = node?.parent_id ?? node?.parentId ?? null;
      const parentId =
        parentRaw !== null && parentRaw !== undefined ? parentRaw.toString() : null;

      if (parentId && nodeMap.has(parentId)) {
        nodeMap.get(parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortNodes = (list) => {
      list.sort((a, b) => (a?.name ?? '').localeCompare(b?.name ?? ''));
      list.forEach((node) => {
        if (node.children.length) {
          sortNodes(node.children);
        }
      });
    };

    sortNodes(roots);
    return roots;
  }, [categories]);

  const toggleCategoryOpen = (id) => {
    setOpenCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getPaddingClass = (depth = 0) =>
    depthPadding[Math.min(depth, depthPadding.length - 1)] ?? 'pl-4 pr-4';

  const renderCategoryNode = (node, iconIndex, depth = 0) => {
    if (!node) return null;

    const nodeId = (node?._id ?? node?.category_id ?? node?.id ?? '').toString();
    const displayName = node?.name ?? 'Chua xac dinh';
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = openCategoryIds.has(nodeId);
    const isActive = filters.category === nodeId;
    const Icon = iconSet[iconIndex % iconSet.length] || PhoneIcon;

    return (
      <div key={nodeId || `${displayName}-${depth}`} className={depth === 0 ? 'border-b border-gray-100' : ''}>
        <button
          type="button"
          onClick={() => {
            if (hasChildren) {
              toggleCategoryOpen(nodeId);
            } else {
              onFilterChange({ category: nodeId });
            }
          }}
          className={`w-full flex items-center justify-between py-3 text-sm font-medium transition ${getPaddingClass(
            depth
          )} ${
            isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-3">
            {depth === 0 ? (
              <span className="text-blue-500">
                <Icon />
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
            {displayName}
          </span>
          {hasChildren ? (
            <span className="flex items-center gap-2 text-blue-500 text-xs font-semibold uppercase">
              Xem them <ChevronIcon open={isExpanded} />
            </span>
          ) : (
            <span className={`text-xs font-semibold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
              Chon
            </span>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="bg-blue-50/40 border-t border-blue-100">
            <div className="px-4 py-3 space-y-1">
              <button
                type="button"
                onClick={() => onFilterChange({ category: nodeId })}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-100'
                }`}
              >
                Tat ca {displayName}
              </button>
              {node.children.map((child, childIdx) =>
                renderCategoryNode(child, iconIndex + childIdx + 1, depth + 1)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const FilterSection = ({ title, description, icon: Icon = PhoneIcon, children }) => {
    const [open, setOpen] = useState(true);

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          onClick={() => setOpen((prev) => !prev)}
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Icon />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>
          </div>
          <ChevronIcon open={open} />
        </button>
        {open && <div className="border-t border-gray-100">{children}</div>}
      </div>
    );
  };

  if (!Array.isArray(categories) || !Array.isArray(brands)) {
    return <div className="p-4 text-gray-500">Dang tai bo loc...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl border border-blue-100 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-blue-500 font-semibold">Bo loc thong minh</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">Tim dung san pham ban can</h3>
        <p className="text-sm text-gray-500 mt-1">Loc nhanh theo danh muc, thuong hieu va tam gia yeu thich.</p>
      </div>

      <FilterSection title="Danh muc noi bat" description="Kham pha theo nhu cau" icon={PhoneIcon}>
        <div className="divide-y divide-gray-100">
          <button
            type="button"
            onClick={() => onFilterChange({ category: 'all' })}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition ${
              filters.category === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-blue-500">
                <PhoneIcon />
              </span>
              Tat ca san pham
            </span>
            <ChevronIcon />
          </button>
          {categoryTree.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">Chua co danh muc nao.</p>
          ) : (
            categoryTree.map((category, index) => renderCategoryNode(category, index))
          )}
        </div>
      </FilterSection>

      <FilterSection title="Thuong hieu" description="Suu tap chinh hang" icon={LaptopIcon}>
        <div className="divide-y divide-gray-100">
          <button
            type="button"
            onClick={() => onFilterChange({ brand: 'all' })}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition ${
              filters.brand === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-blue-500">
                <LaptopIcon />
              </span>
              Tat ca thuong hieu
            </span>
            <ChevronIcon />
          </button>
          {(brands || []).map((brand, index) => {
            const Icon = iconSet[(index + 2) % iconSet.length] || LaptopIcon;
            const brandId = brand?.brand_id ?? brand?.id ?? '';
            const brandValue = brandId !== '' ? brandId.toString() : '';
            const isActive = filters.brand === brandValue;

            return (
              <button
                type="button"
                key={brandId || index}
                onClick={() => onFilterChange({ brand: brandValue })}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-blue-500">
                    <Icon />
                  </span>
                  {brand?.name ?? 'Chua xac dinh'}
                </span>
                <span className={`text-xs font-semibold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  Chon
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Tam gia" description="Dieu chinh linh hoat" icon={PriceIcon}>
        <form
          className="px-4 py-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const minValue = parsePrice(priceMin, 0);
            const maxValue = Math.max(minValue, parsePrice(priceMax, 100000000));
            setPriceMin(minValue.toString());
            setPriceMax(maxValue.toString());
            onFilterChange({ priceRange: [minValue, maxValue] });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Tu</label>
              <input
                type="number"
                min={0}
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Den</label>
              <input
                type="number"
                min={0}
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition"
          >
            Ap dung muc gia
          </button>
          <div className="grid grid-cols-1 gap-2">
            {quickPriceFilters.map((option) => {
              const isActive =
                Array.isArray(filters.priceRange) &&
                filters.priceRange[0] === option.range[0] &&
                filters.priceRange[1] === option.range[1];

              return (
                <button
                  type="button"
                  key={option.label}
                  onClick={() => {
                    setPriceMin(option.range[0].toString());
                    setPriceMax(option.range[1].toString());
                    onFilterChange({ priceRange: option.range });
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </form>
      </FilterSection>
    </div>
  );
};

export default ShopFilters;
