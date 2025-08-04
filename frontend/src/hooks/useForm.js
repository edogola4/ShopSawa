// frontend/src/hooks/useForm.js

/**
 * =============================================================================
 * USE DEBOUNCE HOOK
 * =============================================================================
 * Custom hooks for debouncing values and functions to improve performance
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Hook to debounce a value
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook to debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {object} options - Configuration options
 * @returns {Function} Debounced function
 */
export const useDebouncedFunction = (func, delay, options = {}) => {
  const {
    leading = false,
    trailing = true,
    maxWait = null
  } = options;

  const funcRef = useRef(func);
  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const lastCallTimeRef = useRef(0);
  const lastInvokeTimeRef = useRef(0);

  // Update function reference
  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const debouncedFunction = useCallback((...args) => {
    const invokeFunc = () => {
      lastInvokeTimeRef.current = Date.now();
      return funcRef.current(...args);
    };

    const shouldInvoke = () => {
      const time = Date.now();
      const timeSinceLastCall = time - lastCallTimeRef.current;
      const timeSinceLastInvoke = time - lastInvokeTimeRef.current;

      return (
        lastCallTimeRef.current === 0 ||
        timeSinceLastCall >= delay ||
        (maxWait && timeSinceLastInvoke >= maxWait)
      );
    };

    const leadingEdge = () => {
      lastInvokeTimeRef.current = Date.now();
      timeoutRef.current = setTimeout(timerExpired, delay);
      return leading ? invokeFunc() : undefined;
    };

    const trailingEdge = () => {
      timeoutRef.current = null;
      return trailing ? invokeFunc() : undefined;
    };

    const timerExpired = () => {
      const time = Date.now();
      const timeSinceLastCall = time - lastCallTimeRef.current;

      if (timeSinceLastCall < delay) {
        timeoutRef.current = setTimeout(timerExpired, delay - timeSinceLastCall);
      } else {
        timeoutRef.current = null;
        if (trailing) {
          return invokeFunc();
        }
      }
      return undefined;
    };

    lastCallTimeRef.current = Date.now();

    if (timeoutRef.current === null) {
      return leadingEdge();
    }

    if (maxWait && maxTimeoutRef.current === null) {
      maxTimeoutRef.current = setTimeout(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        maxTimeoutRef.current = null;
        invokeFunc();
      }, maxWait);
    }

    if (shouldInvoke()) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = null;
      }
      return invokeFunc();
    }

    return undefined;
  }, [delay, leading, trailing, maxWait]);

  /**
   * Cancel pending executions
   */
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
    lastCallTimeRef.current = 0;
    lastInvokeTimeRef.current = 0;
  }, []);

  /**
   * Immediately invoke the function
   */
  const flush = useCallback((...args) => {
    cancel();
    return funcRef.current(...args);
  }, [cancel]);

  /**
   * Check if function is pending
   */
  const pending = useCallback(() => {
    return timeoutRef.current !== null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  // Return the debounced function and control methods
  return useMemo(() => 
    Object.assign(debouncedFunction, {
      cancel,
      flush,
      pending
    }), 
    [debouncedFunction, cancel, flush, pending]
  );
};

/**
 * Hook for debounced search functionality
 * @param {Function} searchFunction - Function to execute search
 * @param {number} delay - Debounce delay
 * @param {object} options - Configuration options
 * @returns {object} Search state and control functions
 */
export const useDebouncedSearch = (searchFunction, delay = 300, options = {}) => {
  const {
    minLength = 2,
    immediate = false
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search function
  const debouncedSearch = useDebouncedFunction(
    async (searchQuery) => {
      if (!searchQuery || searchQuery.length < minLength) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchResults = await searchFunction(searchQuery);
        setResults(searchResults);
      } catch (err) {
        setError(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    delay
  );

  /**
   * Update search query and trigger search
   */
  const search = useCallback((newQuery) => {
    setQuery(newQuery);
    debouncedSearch(newQuery);
  }, [debouncedSearch]);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  /**
   * Execute immediate search
   */
  const searchNow = useCallback((searchQuery = query) => {
    debouncedSearch.flush(searchQuery);
  }, [debouncedSearch, query]);

  // Execute immediate search if specified
  useEffect(() => {
    if (immediate && query && query.length >= minLength) {
      searchNow();
    }
  }, [immediate, query, minLength, searchNow]);

  return {
    query,
    results,
    loading,
    error,
    search,
    clearSearch,
    searchNow,
    isPending: debouncedSearch.pending(),
    // Helper properties
    hasQuery: query.length > 0,
    hasResults: results.length > 0,
    canSearch: query.length >= minLength
  };
};

/**
 * Hook for debounced input validation
 * @param {any} value - Value to validate
 * @param {Function} validator - Validation function
 * @param {number} delay - Debounce delay
 * @returns {object} Validation state
 */
export const useDebouncedValidation = (value, validator, delay = 300) => {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const debouncedValidator = useDebouncedFunction(
    async (valueToValidate) => {
      setIsValidating(true);
      setError(null);

      try {
        const validationResult = await validator(valueToValidate);
        
        if (typeof validationResult === 'boolean') {
          setIsValid(validationResult);
        } else if (validationResult && typeof validationResult === 'object') {
          setIsValid(validationResult.isValid);
          setError(validationResult.error || null);
        }
      } catch (err) {
        setIsValid(false);
        setError(err.message || 'Validation error');
      } finally {
        setIsValidating(false);
      }
    },
    delay
  );

  // Trigger validation when value changes
  useEffect(() => {
    if (value !== null && value !== undefined && value !== '') {
      debouncedValidator(value);
    } else {
      setIsValid(true);
      setError(null);
      setIsValidating(false);
    }
  }, [value, debouncedValidator]);

  return {
    isValid,
    error,
    isValidating,
    // Helper properties
    hasError: !!error,
    isPending: debouncedValidator.pending() || isValidating
  };
};

/**
 * Hook for debounced API calls
 * @param {Function} apiFunction - API function to call
 * @param {number} delay - Debounce delay
 * @param {array} dependencies - Dependencies that trigger the API call
 * @returns {object} API state and control functions
 */
export const useDebouncedApi = (apiFunction, delay = 300, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedApiCall = useDebouncedFunction(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        setData(result);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    delay
  );

  /**
   * Execute API call
   */
  const execute = useCallback((...args) => {
    debouncedApiCall(...args);
  }, [debouncedApiCall]);

  /**
   * Execute API call immediately
   */
  const executeNow = useCallback((...args) => {
    debouncedApiCall.flush(...args);
  }, [debouncedApiCall]);

  /**
   * Cancel pending API call
   */
  const cancel = useCallback(() => {
    debouncedApiCall.cancel();
    setLoading(false);
  }, [debouncedApiCall]);

  // Execute when dependencies change
  useEffect(() => {
    if (dependencies.length > 0) {
      execute(...dependencies);
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    execute,
    executeNow,
    cancel,
    isPending: debouncedApiCall.pending(),
    // Helper properties
    hasData: data !== null,
    hasError: !!error
  };
};

export default useDebounce;