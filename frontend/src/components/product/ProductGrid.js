// frontend/src/components/product/ProductGrid.js

/**
 * =============================================================================
 * PRODUCT GRID COMPONENT
 * =============================================================================
 * Product grid/list view with filtering, sorting, and pagination
 */

import React, { useState, useEffect } from 'react';
import { Grid, List, Filter, ChevronDown, ChevronUp } from 'lucide-react';

import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common/LoadingSpinner';
import Button from '../common/Button';
import { Select } from '../common/Input';
import { useApp } from '../../context/AppContext';
import { formatPrice } from '../../utils/helpers';

const ProductGrid = ({ 
  products = [], 
  loading = false,
  error = null,
  pagination = null,
  onPageChange,
  onSortChange,
  onFilterChange,
  showFilters = true,
  showSorting = true,
  showViewToggle = true,
  className = ''
}) => {
  const { viewMode, setViewMode } = useApp();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' }
  ];

  // Handle sort change
  const handleSortChange = (e) => {
    if (onSortChange) {
      onSortChange(e.target.value);
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array.from({ length: 12 }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ));
  };

  // Render pagination
  const renderPagination = () => {
    if (!pagination || pagination.pages <= 1) return null;

    const { page, pages, total } = pagination;
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 mt-8">
        {/* Results info */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {((page - 1) * 12) + 1} to {Math.min(page * 12, total)} of {total} results
        </div>

        {/* Pagination controls */}
        <div className="flex items-center space-x-1">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-3"
          >
            Previous
          </Button>

          {/* First page */}
          {startPage > 1 && (
            <>
              <Button
                variant={1 === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(1)}
                className="px-3"
              >
                1
              </Button>
              {startPage > 2 && (
                <span className="px-2 text-gray-500">...</span>
              )}
            </>
          )}

          {/* Page numbers */}
          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === page ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(pageNum)}
              className="px-3"
            >
              {pageNum}
            </Button>
          ))}

          {/* Last page */}
          {endPage < pages && (
            <>
              {endPage < pages - 1 && (
                <span className="px-2 text-gray-500">...</span>
              )}
              <Button
                variant={pages === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(pages)}
                className="px-3"
              >
                {pages}
              </Button>
            </>
          )}

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pages}
            className="px-3"
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Grid className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No products found
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
        We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
      </p>
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="col-span-full flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
        <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Failed to load products
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
        {error || 'There was an error loading the products. Please try again.'}
      </p>
      <Button
        onClick={() => window.location.reload()}
        variant="primary"
        size="sm"
      >
        Try Again
      </Button>
    </div>
  );

  // Grid columns based on view mode
  const gridCols = viewMode === 'grid' 
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'grid-cols-1';

  return (
    <div className={className}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 mb-6">
        {/* Results count */}
        <div className="flex items-center space-x-4">
          {pagination && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pagination.total} products found
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Mobile filter toggle */}
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden"
              startIcon={Filter}
              endIcon={showMobileFilters ? ChevronUp : ChevronDown}
            >
              Filters
            </Button>
          )}

          {/* Sort dropdown */}
          {showSorting && (
            <Select
              placeholder="Sort by"
              options={sortOptions}
              onChange={handleSortChange}
              className="w-48"
              size="sm"
            />
          )}

          {/* View mode toggle */}
          {showViewToggle && (
            <div className="hidden sm:flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('grid')}
                className="rounded-none border-0"
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
                className="rounded-none border-0 border-l border-gray-300 dark:border-gray-600"
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters */}
      {showMobileFilters && showFilters && (
        <div className="sm:hidden mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {/* Mobile filter content will go here */}
          <p className="text-sm text-gray-500">Mobile filters coming soon...</p>
        </div>
      )}

      {/* Product Grid */}
      <div className={`grid ${gridCols} gap-6`}>
        {loading ? (
          renderSkeletons()
        ) : error ? (
          renderErrorState()
        ) : products.length === 0 ? (
          renderEmptyState()
        ) : (
          products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
              showQuickActions={viewMode === 'grid'}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && products.length > 0 && renderPagination()}
    </div>
  );
};

// Product Filter Sidebar Component
export const ProductFilterSidebar = ({
  categories = [],
  priceRange = { min: 0, max: 10000 },
  selectedFilters = {},
  onFilterChange,
  className = ''
}) => {
  const [localPriceRange, setLocalPriceRange] = useState({
    min: selectedFilters.minPrice || priceRange.min,
    max: selectedFilters.maxPrice || priceRange.max
  });

  // Handle category filter
  const handleCategoryChange = (categoryId) => {
    onFilterChange({
      ...selectedFilters,
      category: selectedFilters.category === categoryId ? '' : categoryId
    });
  };

  // Handle price range change
  const handlePriceRangeChange = () => {
    onFilterChange({
      ...selectedFilters,
      minPrice: localPriceRange.min,
      maxPrice: localPriceRange.max
    });
  };

  // Handle rating filter
  const handleRatingChange = (rating) => {
    onFilterChange({
      ...selectedFilters,
      minRating: selectedFilters.minRating === rating ? 0 : rating
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setLocalPriceRange({ min: priceRange.min, max: priceRange.max });
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(selectedFilters).some(
    key => selectedFilters[key] !== '' && selectedFilters[key] !== 0
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Filters
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-sm text-blue-600 dark:text-blue-400"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Categories
          </h4>
          <div className="space-y-2">
            {categories.map((category) => (
              <label
                key={category._id}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedFilters.category === category._id}
                  onChange={() => handleCategoryChange(category._id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {category.name}
                </span>
                {category.productCount && (
                  <span className="text-xs text-gray-500">
                    ({category.productCount})
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          Price Range
        </h4>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Min</label>
              <input
                type="number"
                value={localPriceRange.min}
                onChange={(e) => setLocalPriceRange({
                  ...localPriceRange,
                  min: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                min={priceRange.min}
                max={priceRange.max}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Max</label>
              <input
                type="number"
                value={localPriceRange.max}
                onChange={(e) => setLocalPriceRange({
                  ...localPriceRange,
                  max: parseInt(e.target.value) || priceRange.max
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                min={priceRange.min}
                max={priceRange.max}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatPrice(priceRange.min)}</span>
            <span>{formatPrice(priceRange.max)}</span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePriceRangeChange}
            className="w-full"
          >
            Apply Price Filter
          </Button>
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          Customer Rating
        </h4>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedFilters.minRating === rating}
                onChange={() => handleRatingChange(rating)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-4 h-4 ${
                      index < rating 
                        ? 'text-yellow-400' 
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  >
                    ★
                  </div>
                ))}
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  & up
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductGrid;