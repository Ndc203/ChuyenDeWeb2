import React, { useState, useEffect } from 'react';
import ShopHeader from '../../components/shop/ShopHeader';
import ShopFilters from '../../components/shop/ShopFilters';
import ProductCard from '../../components/shop/ProductCard';
import ShopLogin from '../../components/ShopAuth/ShopLogin';
import ShopRegister from '../../components/ShopAuth/ShopRegister';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    brand: 'all',
    priceRange: [0, 100000000],
    sortBy: 'default'
  });
  const [authMode, setAuthMode] = useState('products'); // 'products', 'login', 'register'

  const handleLoginSuccess = () => {
    setAuthMode('products'); // After login, show products
    // Optionally, refresh user data or show a success message
  };

  const handleRegisterSuccess = () => {
    setAuthMode('login'); // After registration, prompt for login
    // Optionally, show a success message
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
  };

  const handleSwitchToRegister = () => {
    setAuthMode('register');
  };

  // Fetch products
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [products, filters]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/products');
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/brands');
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(product => 
        product.category_id === parseInt(filters.category)
      );
    }

    // Filter by brand
    if (filters.brand !== 'all') {
      filtered = filtered.filter(product => 
        product.brand_id === parseInt(filters.brand)
      );
    }

    // Filter by price range
    filtered = filtered.filter(product =>
      product.final_price >= filters.priceRange[0] &&
      product.final_price <= filters.priceRange[1]
    );

    // Sort products
    switch (filters.sortBy) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.final_price - b.final_price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.final_price - a.final_price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ShopHeader
        onSearch={(search) => handleFilterChange({ search })}
        onSwitchToLogin={handleSwitchToLogin}
        onSwitchToRegister={handleSwitchToRegister}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {authMode === 'login' && (
          <ShopLogin
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={handleSwitchToRegister}
          />
        )}
        {authMode === 'register' && (
          <ShopRegister
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={handleSwitchToLogin}
          />
        )}
        {authMode === 'products' && (
          <div className="flex gap-6">
            {/* Sidebar Filters */}
            <aside className="w-64 flex-shrink-0">
              <ShopFilters
                categories={categories}
                brands={brands}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </aside>

            {/* Products Grid */}
            <main className="flex-1">
              {/* Header with count and sort */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between">
                  <p className="text-gray-700">
                    Hiển thị <span className="font-semibold">{filteredProducts.length}</span> sản phẩm
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Sắp xếp:</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="default">Mặc định</option>
                      <option value="name-asc">Tên A-Z</option>
                      <option value="name-desc">Tên Z-A</option>
                      <option value="price-asc">Giá thấp đến cao</option>
                      <option value="price-desc">Giá cao đến thấp</option>
                      <option value="newest">Mới nhất</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy sản phẩm</h3>
                  <p className="mt-1 text-sm text-gray-500">Thử điều chỉnh bộ lọc của bạn.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
