import React, { useState } from 'react';

const ShopFilters = ({ categories = [], brands = [], filters, onFilterChange }) => {
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(100000000);

  const handlePriceFilter = () => {
    onFilterChange({
      priceRange: [priceMin, priceMax],
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Nếu dữ liệu chưa có thì hiển thị đang tải
  if (!Array.isArray(categories) || !Array.isArray(brands)) {
    return <div className="p-4 text-gray-500">Đang tải bộ lọc...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h3>

        {/* Category Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Danh mục</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="category"
                value="all"
                checked={filters.category === 'all'}
                onChange={(e) => onFilterChange({ category: e.target.value })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Tất cả</span>
            </label>

            {(categories || []).map((category, index) => (
              <label key={category?.category_id ?? index} className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  value={category?.category_id ?? ''}
                  checked={
                    filters.category === (category?.category_id?.toString() ?? '')
                  }
                  onChange={(e) => onFilterChange({ category: e.target.value })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {category?.name ?? 'Không xác định'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Brand Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Thương hiệu</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="brand"
                value="all"
                checked={filters.brand === 'all'}
                onChange={(e) => onFilterChange({ brand: e.target.value })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Tất cả</span>
            </label>

            {(brands || []).map((brand, index) => (
              <label key={brand?.brand_id ?? index} className="flex items-center">
                <input
                  type="radio"
                  name="brand"
                  value={brand?.brand_id ?? ''}
                  checked={
                    filters.brand === (brand?.brand_id?.toString() ?? '')
                  }
                  onChange={(e) => onFilterChange({ brand: e.target.value })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {brand?.name ?? 'Không xác định'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Khoảng giá</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Từ</label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Đến</label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                placeholder="100000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handlePriceFilter}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Áp dụng
            </button>
          </div>

          {/* Quick price filters */}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => {
                onFilterChange({ priceRange: [0, 5000000] });
                setPriceMin(0);
                setPriceMax(5000000);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
            >
              Dưới 5 triệu
            </button>
            <button
              onClick={() => {
                onFilterChange({ priceRange: [5000000, 10000000] });
                setPriceMin(5000000);
                setPriceMax(10000000);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
            >
              5 triệu - 10 triệu
            </button>
            <button
              onClick={() => {
                onFilterChange({ priceRange: [10000000, 20000000] });
                setPriceMin(10000000);
                setPriceMax(20000000);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
            >
              10 triệu - 20 triệu
            </button>
            <button
              onClick={() => {
                onFilterChange({ priceRange: [20000000, 100000000] });
                setPriceMin(20000000);
                setPriceMax(100000000);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
            >
              Trên 20 triệu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopFilters;
