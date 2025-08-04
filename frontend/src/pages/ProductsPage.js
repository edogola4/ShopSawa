// frontend/src/pages/ProductsPage.js

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Grid, 
  List, 
  SlidersHorizontal, 
  Search, 
  ChevronDown,
  Filter,
  X
} from 'lucide-react';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProductCard from '../components/product/ProductCard';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter';
import { productService } from '../services/product.service';
import { useNotification } from '../hooks/useNotification';
import { useDebounce } from '../hooks/useDebounce';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showNotification } = useNotification();

  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categories: searchParams.getAll('category') || [],
    priceRange: searchParams.get('priceRange') || null,
    minRating: searchParams.get('minRating') ? parseInt(searchParams.get('minRating')) : null,
    inStock: searchParams.get('inStock') ? searchParams.get('inStock') === 'true' : null
  });

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(filters.search, 500);

  const productsPerPage = 12;

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
    { value: 'name-a-z', label: 'Name: A to Z' },
    { value: 'name-z-a', label: 'Name: Z to A' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' }
  ];

  useEffect(() => {
    loadProducts();
  }, [debouncedSearch, filters.categories, filters.priceRange, filters.minRating, filters.inStock, sortBy, currentPage]);

  useEffect(() => {
    // Update URL params when filters change
    updateUrlParams();
  }, [filters, sortBy]);

  const updateUrlParams = () => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.categories.length) {
      filters.categories.forEach(cat => params.append('category', cat));
    }
    if (filters.priceRange) params.set('priceRange', filters.priceRange);
    if (filters.minRating) params.set('minRating', filters.minRating.toString());
    if (filters.inStock !== null) params.set('inStock', filters.inStock.toString());
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());

    setSearchParams(params);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      const queryParams = {
        page: currentPage,
        limit: productsPerPage,
        sort: sortBy,
        search: debouncedSearch,
        ...filters
      };

      // Remove empty/null values
      Object.keys(queryParams).forEach(key => 
        (queryParams[key] === null || queryParams[key] === '' || 
         (Array.isArray(queryParams[key]) && queryParams[key].length === 0)) && 
        delete queryParams[key]
      );

      const response = await productService.getProducts(queryParams);
      
      setProducts(response.data.products || []);
      setTotalProducts(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load products:', error);
      showNotification('error', 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      priceRange: null,
      minRating: null,
      inStock: null
    });
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const hasActiveFilters = filters.search || filters.categories.length > 0 || 
                          filters.priceRange || filters.minRating || filters.inStock !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {filters.search ? `Search results for "${filters.search}"` : 'All Products'}
          </h1>
          <p className="text-gray-600">
            {totalProducts > 0 
              ? `Showing ${((currentPage - 1) * productsPerPage) + 1}-${Math.min(currentPage * productsPerPage, totalProducts)} of ${totalProducts} products`
              : 'No products found'
            }
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <ProductFilter
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              isOpen={true}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Toggle & Search */}
            <div className="lg:hidden mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <ProductFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                isOpen={showFilters}
                onToggle={() => setShowFilters(!showFilters)}
              />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
              {/* Active Filters & Clear */}
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <>
                    <span className="text-sm text-gray-600">Active filters:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      icon={X}
                    >
                      Clear All
                    </Button>
                  </>
                )}
              </div>

              {/* Sort & View Options */}
              <div className="flex items-center gap-4">
                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : products.length > 0 ? (
              <ProductGrid 
                products={products} 
                viewMode={viewMode}
                className="mb-8"
              />
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-6">
                  {hasActiveFilters 
                    ? 'Try adjusting your filters or search terms'
                    : 'No products are available at the moment'
                  }
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    icon={X}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  size="sm"
                >
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    const showPage = page === 1 || page === totalPages || 
                                   (page >= currentPage - 2 && page <= currentPage + 2);
                    
                    if (!showPage) {
                      if (page === currentPage - 3 || page === currentPage + 3) {
                        return <span key={page} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'primary' : 'outline'}
                        onClick={() => handlePageChange(page)}
                        size="sm"
                        className="w-10 h-10"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;