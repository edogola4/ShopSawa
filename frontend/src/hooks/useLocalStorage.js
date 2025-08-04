// frontend/src/hooks/useLocalStorage.js

/**
 * =============================================================================
 * USE LOCAL STORAGE HOOK
 * =============================================================================
 * Custom hook for managing localStorage with React state synchronization
 */

import { useState, useEffect, useCallback } from 'react';
import { secureStorage } from '../utils/helpers';

/**
 * Hook for managing localStorage with React state
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @param {object} options - Configuration options
 * @returns {Array} [value, setValue, removeValue]
 */
export const useLocalStorage = (key, initialValue, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncAcrossTabs = true,
    onError = null
  } = options;

  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      
      return deserialize(item);
    } catch (error) {
      if (onError) {
        onError(error);
      }
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Set value in both state and localStorage
   */
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (valueToStore === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, serialize(valueToStore));
      }
    } catch (error) {
      if (onError) {
        onError(error);
      }
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, storedValue, onError]);

  /**
   * Remove value from localStorage
   */
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      localStorage.removeItem(key);
    } catch (error) {
      if (onError) {
        onError(error);
      }
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, onError]);

  /**
   * Check if key exists in localStorage
   */
  const hasValue = useCallback(() => {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      if (onError) {
        onError(error);
      }
      console.error(`Error checking localStorage key "${key}":`, error);
      return false;
    }
  }, [key, onError]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e) => {
      if (e.key !== key) return;

      try {
        if (e.newValue === null) {
          setStoredValue(initialValue);
        } else {
          setStoredValue(deserialize(e.newValue));
        }
      } catch (error) {
        if (onError) {
          onError(error);
        }
        console.error(`Error handling storage change for key "${key}":`, error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue, deserialize, syncAcrossTabs, onError]);

  return [storedValue, setValue, removeValue, hasValue];
};

/**
 * Hook for managing multiple localStorage keys
 * @param {object} keys - Object with key-value pairs for localStorage
 * @param {object} options - Configuration options
 * @returns {object} Object with values and setter functions
 */
export const useMultipleLocalStorage = (keys, options = {}) => {
  const [values, setValues] = useState(() => {
    const initialValues = {};
    
    Object.entries(keys).forEach(([name, { key, initialValue }]) => {
      try {
        const item = localStorage.getItem(key);
        initialValues[name] = item !== null ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        initialValues[name] = initialValue;
      }
    });
    
    return initialValues;
  });

  /**
   * Set value for specific key
   */
  const setValue = useCallback((name, value) => {
    const keyConfig = keys[name];
    if (!keyConfig) {
      console.error(`Key configuration for "${name}" not found`);
      return;
    }

    try {
      const valueToStore = value instanceof Function ? value(values[name]) : value;
      
      setValues(prev => ({
        ...prev,
        [name]: valueToStore
      }));
      
      if (valueToStore === undefined) {
        localStorage.removeItem(keyConfig.key);
      } else {
        localStorage.setItem(keyConfig.key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${keyConfig.key}":`, error);
    }
  }, [keys, values]);

  /**
   * Remove value for specific key
   */
  const removeValue = useCallback((name) => {
    const keyConfig = keys[name];
    if (!keyConfig) {
      console.error(`Key configuration for "${name}" not found`);
      return;
    }

    try {
      setValues(prev => ({
        ...prev,
        [name]: keyConfig.initialValue
      }));
      localStorage.removeItem(keyConfig.key);
    } catch (error) {
      console.error(`Error removing localStorage key "${keyConfig.key}":`, error);
    }
  }, [keys]);

  /**
   * Clear all values
   */
  const clearAll = useCallback(() => {
    Object.entries(keys).forEach(([name, { key, initialValue }]) => {
      try {
        localStorage.removeItem(key);
        setValues(prev => ({
          ...prev,
          [name]: initialValue
        }));
      } catch (error) {
        console.error(`Error clearing localStorage key "${key}":`, error);
      }
    });
  }, [keys]);

  return {
    values,
    setValue,
    removeValue,
    clearAll
  };
};

/**
 * Hook for managing localStorage with expiration
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial value
 * @param {number} expirationMs - Expiration time in milliseconds
 * @returns {Array} [value, setValue, removeValue, isExpired]
 */
export const useLocalStorageWithExpiry = (key, initialValue, expirationMs) => {
  const [value, setValue, removeValue] = useLocalStorage(
    key,
    initialValue,
    {
      serialize: (value) => JSON.stringify({
        value,
        timestamp: Date.now(),
        expiry: Date.now() + expirationMs
      }),
      deserialize: (item) => {
        const parsed = JSON.parse(item);
        
        // Check if expired
        if (Date.now() > parsed.expiry) {
          localStorage.removeItem(key);
          return initialValue;
        }
        
        return parsed.value;
      }
    }
  );

  /**
   * Check if value is expired
   */
  const isExpired = useCallback(() => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return true;
      
      const parsed = JSON.parse(item);
      return Date.now() > parsed.expiry;
    } catch (error) {
      return true;
    }
  }, [key]);

  /**
   * Refresh expiration time
   */
  const refreshExpiry = useCallback(() => {
    setValue(value);
  }, [setValue, value]);

  return [value, setValue, removeValue, isExpired, refreshExpiry];
};

/**
 * Hook for managing localStorage with validation
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial value
 * @param {Function} validator - Validation function
 * @returns {Array} [value, setValue, removeValue, isValid]
 */
export const useValidatedLocalStorage = (key, initialValue, validator) => {
  const [isValid, setIsValid] = useState(true);
  
  const [value, setValue, removeValue] = useLocalStorage(
    key,
    initialValue,
    {
      deserialize: (item) => {
        try {
          const parsed = JSON.parse(item);
          const valid = validator ? validator(parsed) : true;
          
          setIsValid(valid);
          
          if (!valid) {
            console.warn(`Invalid data in localStorage for key "${key}"`);
            return initialValue;
          }
          
          return parsed;
        } catch (error) {
          setIsValid(false);
          return initialValue;
        }
      }
    }
  );

  /**
   * Set value with validation
   */
  const setValidatedValue = useCallback((newValue) => {
    const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
    
    if (validator) {
      const valid = validator(valueToStore);
      setIsValid(valid);
      
      if (!valid) {
        console.warn(`Attempting to store invalid data for key "${key}"`);
        return false;
      }
    }
    
    setValue(valueToStore);
    return true;
  }, [setValue, validator, value, key]);

  return [value, setValidatedValue, removeValue, isValid];
};

/**
 * Hook for managing secure localStorage (using secureStorage utility)
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial value
 * @returns {Array} [value, setValue, removeValue]
 */
export const useSecureLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    const item = secureStorage.get(key);
    return item !== null ? item : initialValue;
  });

  const setValue = useCallback((value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    
    if (valueToStore === undefined) {
      secureStorage.remove(key);
    } else {
      secureStorage.set(key, valueToStore);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    secureStorage.remove(key);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;