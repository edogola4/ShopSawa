import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EnhancedSearchBar = ({
  query,
  searchLoading,
  searchResults = [],
  onSearchChange,
  onSearchSubmit,
  onResultClick,
  onClearSearch,
  placeholder = 'Search products...',
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Popular search suggestions
  const popularSearches = [
    'Smartphones',
    'Laptops',
    'Headphones',
    'Smart Watches',
    'Cameras'
  ];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClear = () => {
    onClearSearch?.();
    setShowSuggestions(false);
  };

  return (
    <div className={`relative w-full max-w-2xl ${className}`} ref={searchRef}>
      <form onSubmit={onSearchSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => {
              onSearchChange(e);
              setShowSuggestions(true);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`block w-full pl-10 pr-10 py-3 border ${
              isFocused 
                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                : 'border-gray-300 dark:border-gray-600'
            } rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all duration-200`}
            placeholder={placeholder}
            aria-label="Search products"
          />
          
          <AnimatePresence>
            {(query || isFocused) && (
              <motion.button
                type="button"
                onClick={handleClear}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                transition={{ duration: 0.15 }}
                aria-label="Clear search"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" />
              </motion.button>
            )}
          </AnimatePresence>
          
          {searchLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            </div>
          )}
        </div>
      </form>

      {/* Search Suggestions and Results */}
      <AnimatePresence>
        {showSuggestions && (query || isFocused) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {searchResults.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => {
                      onResultClick?.(product);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={product.images?.[0]?.url || '/placeholder-40x40.png'}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-md"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-40x40.png';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                        KES {product.price?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                  </button>
                ))}
                {query && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                    <button
                      onClick={() => {
                        onSearchSubmit?.({ preventDefault: () => {} });
                        setShowSuggestions(false);
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium w-full text-left"
                    >
                      View all results for "{query}"
                    </button>
                  </div>
                )}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p>No products found for "{query}"</p>
                <p className="text-sm mt-1">Try different keywords or check spelling</p>
              </div>
            ) : (
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Popular Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((searchTerm) => (
                    <button
                      key={searchTerm}
                      onClick={() => {
                        onSearchChange?.({ target: { value: searchTerm } });
                        onSearchSubmit?.({ preventDefault: () => {} });
                      }}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-full transition-colors"
                    >
                      {searchTerm}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSearchBar;
