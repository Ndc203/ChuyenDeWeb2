import React, { useState, useEffect } from "react";
import ShopHeader from "../../components/shop/ShopHeader";
import PostFilters from "../../components/shop/PostFilters";
import PostCard from "../../components/shop/PostCard";


const ShopPostPage = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    sortBy: "default", // default | name-asc | name-desc | newest | trending
  });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [posts, filters]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/posts");
      const data = await response.json();
      setPosts(data.filter(p => p.status === "published"));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/postcategories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

const applyFilters = () => {
  let filtered = [...posts];

  // Search by title
  if (filters.search) {
    filtered = filtered.filter((post) =>
      post.title.toLowerCase().includes(filters.search.toLowerCase())
    );
  }

  // Filter by category
  if (filters.category !== "all") {
    filtered = filtered.filter(
      (post) => post.category_id === parseInt(filters.category)
    );
  }

  // Filter by trending
  if (filters.trending) {
    filtered = filtered.filter((post) => post.is_trending === 1);
  }

  // Sort
  switch (filters.sortBy) {
    case "name-asc":
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "name-desc":
      filtered.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "newest":
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case "trending":
      filtered.sort((a, b) => b.is_trending - a.is_trending);
      break;
    default:
      break;
  }

  setFilteredPosts(filtered);
};


  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ShopHeader onSearch={(search) => handleFilterChange({ search })} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="w-64 flex-shrink-0">
            <PostFilters
              categories={categories}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </aside>

          {/* Posts Grid */}
          <main className="flex-1">
            {/* Header with count and sort */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-700">
                  Hiển thị{" "}
                  <span className="font-semibold">{filteredPosts.length}</span>{" "}
                  bài viết
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Sắp xếp:</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange({ sortBy: e.target.value })
                    }
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="default">Mặc định</option>
                    <option value="name-asc">Tên A-Z</option>
                    <option value="name-desc">Tên Z-A</option>
                    <option value="newest">Mới nhất</option>
                    <option value="trending">Bài viết nổi bật</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Posts Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Không tìm thấy bài viết
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Thử điều chỉnh bộ lọc của bạn.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  // hoặc dùng PostCard nếu bạn muốn tách riêng
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ShopPostPage;
