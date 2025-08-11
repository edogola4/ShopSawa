// frontend/src/components/product/ProductFilter.js

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import { productService } from '../../services/product.service';
import { PRICE_RANGES } from '../../utils/constants';

const ProductFilter = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isOpen, 
  onToggle 
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: true,
    availability: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await productService.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type, value) => {
    const newFilters = { ...filters };
    
    if (type === 'category') {
      if (newFilters.categories?.includes(value)) {
        newFilters.categories = newFilters.categories.filter(cat => cat !== value);
      } else {
        newFilters.categories = [...(newFilters.categories || []), value];
      }
    } else if (type === 'priceRange') {
      newFilters.priceRange = newFilters.priceRange === value ? null : value;
    } else if (type === 'rating') {
      newFilters.minRating = newFilters.minRating === value ? null : value;
    } else if (type === 'availability') {
      newFilters.inStock = newFilters.inStock === value ? null : value;
    } else {
      newFilters[type] = value;
    }
    
    onFiltersChange(newFilters);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const FilterSection = ({ title, section, children }) => (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-blue-600 transition-colors"
      >
        <span>{title}</span>
        {expandedSections[section] ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {expandedSections[section] && (
        <div className="mt-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  );

  const activeFiltersCount = [
    filters.categories?.length || 0,
    filters.priceRange ? 1 : 0,
    filters.minRating ? 1 : 0,
    filters.inStock !== null ? 1 : 0,
    filters.search ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={onToggle}
        className="md:hidden mb-4 w-full"
        icon={Filter}
      >
        Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
      </Button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Search Filter */}
      <div className="mb-6">
        <Input
          placeholder="Search products..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full"
        />
      </div>

      {/* Categories Filter */}
      <FilterSection title="Categories" section="category">
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={`category-skeleton-${i}`} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <label
                key={`category-${category._id}`}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(category._id) || false}
                  onChange={() => handleFilterChange('category', category._id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{category.name}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  ({category.productCount || 0})
                </span>
              </label>
            ))}
          </div>
        )}
      </FilterSection>

      {/* Price Range Filter */}
      <FilterSection title="Price Range" section="price">
        <div className="space-y-2">
          {PRICE_RANGES.filter(range => range && range.id).map((range) => (
            <label
              key={`price-${range.id}`}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <input
                type="radio"
                name="priceRange"
                checked={filters.priceRange === range.id}
                onChange={() => handleFilterChange('priceRange', range.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{range.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Rating Filter */}
      <FilterSection title="Customer Rating" section="rating">
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label
              key={`rating-${rating}`}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === rating}
                onChange={() => handleFilterChange('rating', rating)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => {
                    const starKey = `star-${rating}-${i}`;
                    return (
                      <span
                        key={starKey}
                        className={`text-sm ${
                          i < rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    );
                  })}
                </div>
                <span className="text-sm text-gray-700">& up</span>
              </div>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Availability Filter */}
      <FilterSection title="Availability" section="availability">
        <div className="space-y-2">
          <label 
            key="in-stock"
            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
          >
            <input
              type="checkbox"
              checked={filters.inStock === true}
              onChange={() => handleFilterChange('availability', true)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">In Stock</span>
          </label>
          <label 
            key="out-of-stock"
            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
          >
            <input
              type="checkbox"
              checked={filters.inStock === false}
              onChange={() => handleFilterChange('availability', false)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Out of Stock</span>
          </label>
        </div>
      </FilterSection>

      {/* Mobile Apply Button */}
      <div className="md:hidden mt-6 space-y-2">
        <Button onClick={onToggle} className="w-full">
          Apply Filters
        </Button>
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="w-full"
          >
            Clear All Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductFilter;