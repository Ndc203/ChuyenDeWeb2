import React from "react";

export default function PostFilters({ categories, filters, onFilterChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Bộ lọc</h2>

      {/* Danh mục */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Danh mục
        </label>
        <select
          value={filters.category}
          onChange={(e) => onFilterChange({ category: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Bài viết nổi bật */}
      <div className="flex items-center gap-2">
        <input
          id="trending"
          type="checkbox"
          checked={filters.trending || false}
          onChange={(e) => onFilterChange({ trending: e.target.checked })}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="trending" className="text-sm text-gray-700">
          Chỉ hiển thị bài viết nổi bật
        </label>
      </div>

      {/* Tìm kiếm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tìm kiếm tiêu đề
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Nhập từ khóa..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
