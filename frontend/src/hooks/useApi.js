// frontend/src/hooks/useApi.js

/**
 * =============================================================================
 * USE API HOOK
 * =============================================================================
 * Custom hook for handling API operations with loading, error states, and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FEATURES } from '../utils/constants';

/**
 * Hook for handling async API operations
 * @param {Function} apiFunction - API function to call
 * @param {object} options - Configuration options
 * @returns {object} API state and control functions
 */
export const useApi = (apiFunction, options = {}) => {
  const {
    immediate = false,
    initialData = null,
    onSuccess = null,
    onError = null,
    dependencies = [],
    cacheKey = null,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    retryAttempts = 0
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const mountedRef = useRef(true);
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  /**
   * Execute API call with error handling and caching
   */
  const execute = useCallback(async (...args) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Check cache first
    if (cacheKey) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        if (mountedRef.current) {
          setData(cached.data);
          setLastUpdated(new Date(cached.timestamp));
          return { data: cached.data, fromCache: true };
        }
        return;
      }
    }

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    let attempts = 0;
    let lastError;

    while (attempts <= retryAttempts) {
      try {
        if (FEATURES.DEBUG_MODE) {
          console.log(`API call attempt ${attempts + 1}:`, apiFunction.name, args);
        }

        const result = await apiFunction(...args, {
          signal: abortControllerRef.current?.signal
        });

        if (mountedRef.current) {
          setData(result);
          setLoading(false);
          setError(null);
          setLastUpdated(new Date());

          // Cache successful result
          if (cacheKey) {
            cacheRef.current.set(cacheKey, {
              data: result,
              timestamp: Date.now()
            });
          }

          // Call success callback
          if (onSuccess) {
            onSuccess(result);
          }
        }

        return { data: result, fromCache: false };
      } catch (err) {
        lastError = err;
        
        // Don't retry if request was aborted
        if (err.name === 'AbortError') {
          break;
        }

        attempts++;
        
        // Wait before retry (exponential backoff)
        if (attempts <= retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
    }

    // All attempts failed
    if (mountedRef.current) {
      setLoading(false);
      setError(lastError);

      // Call error callback
      if (onError) {
        onError(lastError);
      }
    }

    throw lastError;
  }, [apiFunction, cacheKey, cacheTimeout, onSuccess, onError, retryAttempts]);

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    if (mountedRef.current) {
      setData(initialData);
      setLoading(false);
      setError(null);
      setLastUpdated(null);
    }
  }, [initialData]);

  /**
   * Clear cache for this API call
   */
  const clearCache = useCallback(() => {
    if (cacheKey) {
      cacheRef.current.delete(cacheKey);
    }
  }, [cacheKey]);

  /**
   * Cancel ongoing request
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Execute immediately if specified
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    execute,
    reset,
    clearCache,
    cancel,
    // Computed states
    isIdle: !loading && !error && !data,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && !!error,
    // Cache info
    isCached: cacheKey && cacheRef.current.has(cacheKey)
  };
};

/**
 * Hook for handling paginated API calls
 * @param {Function} apiFunction - API function that accepts page parameter
 * @param {object} options - Configuration options
 * @returns {object} Paginated API state and control functions
 */
export const usePaginatedApi = (apiFunction, options = {}) => {
  const {
    initialPage = 1,
    pageSize = 10,
    ...apiOptions
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [allData, setAllData] = useState([]);
  const [pagination, setPagination] = useState({
    page: initialPage,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  const {
    data,
    loading,
    error,
    execute: originalExecute,
    ...rest
  } = useApi(apiFunction, {
    ...apiOptions,
    cacheKey: apiOptions.cacheKey ? `${apiOptions.cacheKey}_page_${currentPage}` : null
  });

  /**
   * Load specific page
   */
  const loadPage = useCallback(async (page) => {
    try {
      const result = await originalExecute({ page, limit: pageSize });
      
      if (result?.data) {
        setPagination({
          page: result.pagination?.page || page,
          pages: result.pagination?.pages || 1,
          total: result.pagination?.total || 0,
          hasNext: (result.pagination?.page || page) < (result.pagination?.pages || 1),
          hasPrev: (result.pagination?.page || page) > 1
        });
        
        setCurrentPage(page);
      }
      
      return result;
    } catch (err) {
      throw err;
    }
  }, [originalExecute, pageSize]);

  /**
   * Load next page
   */
  const loadNext = useCallback(async () => {
    if (pagination.hasNext) {
      return loadPage(currentPage + 1);
    }
  }, [loadPage, currentPage, pagination.hasNext]);

  /**
   * Load previous page
   */
  const loadPrevious = useCallback(async () => {
    if (pagination.hasPrev) {
      return loadPage(currentPage - 1);
    }
  }, [loadPage, currentPage, pagination.hasPrev]);

  /**
   * Load all pages (use with caution)
   */
  const loadAll = useCallback(async () => {
    const firstPage = await loadPage(1);
    const totalPages = firstPage?.pagination?.pages || 1;
    
    if (totalPages > 1) {
      const promises = [];
      for (let page = 2; page <= totalPages; page++) {
        promises.push(originalExecute({ page, limit: pageSize }));
      }
      
      const results = await Promise.all(promises);
      const combinedData = [
        ...(firstPage?.data || []),
        ...results.flatMap(result => result?.data || [])
      ];
      
      setAllData(combinedData);
      return combinedData;
    }
    
    setAllData(firstPage?.data || []);
    return firstPage?.data || [];
  }, [loadPage, originalExecute, pageSize]);

  /**
   * Reset pagination to first page
   */
  const resetPagination = useCallback(() => {
    setCurrentPage(initialPage);
    setAllData([]);
    setPagination({
      page: initialPage,
      pages: 1,
      total: 0,
      hasNext: false,
      hasPrev: false
    });
  }, [initialPage]);

  // Update allData when data changes
  useEffect(() => {
    if (data) {
      setAllData(prev => {
        const newData = [...prev];
        const startIndex = (currentPage - 1) * pageSize;
        
        if (Array.isArray(data)) {
          newData.splice(startIndex, pageSize, ...data);
        }
        
        return newData;
      });
    }
  }, [data, currentPage, pageSize]);

  return {
    data,
    allData,
    loading,
    error,
    pagination,
    currentPage,
    loadPage,
    loadNext,
    loadPrevious,
    loadAll,
    resetPagination,
    ...rest
  };
};

/**
 * Hook for handling infinite scroll API calls
 * @param {Function} apiFunction - API function
 * @param {object} options - Configuration options
 * @returns {object} Infinite scroll state and control functions
 */
export const useInfiniteApi = (apiFunction, options = {}) => {
  const { pageSize = 10, ...apiOptions } = options;
  
  const [allData, setAllData] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const {
    loading,
    error,
    execute: originalExecute,
    ...rest
  } = useApi(apiFunction, apiOptions);

  /**
   * Load more data
   */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      const result = await originalExecute({ page, limit: pageSize });
      
      if (result?.data) {
        setAllData(prev => [...prev, ...result.data]);
        setPage(prev => prev + 1);
        
        // Check if there's more data
        const totalLoaded = (page * pageSize) + result.data.length;
        const totalAvailable = result.pagination?.total || totalLoaded;
        setHasMore(totalLoaded < totalAvailable);
      }
      
      return result;
    } catch (err) {
      throw err;
    }
  }, [originalExecute, page, pageSize, loading, hasMore]);

  /**
   * Reset infinite scroll
   */
  const reset = useCallback(() => {
    setAllData([]);
    setPage(1);
    setHasMore(true);
  }, []);

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    ...rest
  };
};

/**
 * Hook for handling multiple API calls
 * @param {Array} apiCalls - Array of API call configurations
 * @param {object} options - Configuration options
 * @returns {object} Combined API states
 */
export const useMultipleApi = (apiCalls, options = {}) => {
  const { immediate = false } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});

  /**
   * Execute all API calls
   */
  const executeAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const promises = apiCalls.map(({ apiFunction, args = [], key }) => 
        apiFunction(...args).then(result => ({ key, result }))
      );

      const results = await Promise.all(promises);
      
      const dataMap = {};
      results.forEach(({ key, result }) => {
        dataMap[key] = result;
      });

      setData(dataMap);
      setLoading(false);
      
      return dataMap;
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, [apiCalls]);

  /**
   * Execute specific API call by key
   */
  const executeOne = useCallback(async (key) => {
    const apiCall = apiCalls.find(call => call.key === key);
    if (!apiCall) {
      throw new Error(`API call with key "${key}" not found`);
    }

    try {
      const result = await apiCall.apiFunction(...(apiCall.args || []));
      setData(prev => ({ ...prev, [key]: result }));
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [apiCalls]);

  // Execute immediately if specified
  useEffect(() => {
    if (immediate) {
      executeAll();
    }
  }, [immediate, executeAll]);

  return {
    data,
    loading,
    error,
    executeAll,
    executeOne,
    // Helper methods
    getDataByKey: (key) => data[key],
    isLoading: loading,
    hasError: !!error
  };
};

export default useApi;