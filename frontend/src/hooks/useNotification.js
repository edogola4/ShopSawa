// frontend/src/hooks/useNotification.js

import { useState, useCallback } from 'react';

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Global notification state (simple implementation)
let globalNotifications = [];
let globalSetNotifications = null;

export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  // Register global setter on first use
  if (!globalSetNotifications) {
    globalSetNotifications = setNotifications;
    globalNotifications = notifications;
  }

  const showNotification = useCallback((type, message, options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      message,
      duration: options.duration || 5000,
      persistent: options.persistent || false,
      action: options.action || null,
      ...options
    };

    // Add to notifications array
    const newNotifications = [...globalNotifications, notification];
    globalNotifications = newNotifications;
    
    if (globalSetNotifications) {
      globalSetNotifications(newNotifications);
    }

    // Auto-dismiss if not persistent
    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, notification.duration);
    }

    return id;
  }, []);

  const dismissNotification = useCallback((id) => {
    const newNotifications = globalNotifications.filter(n => n.id !== id);
    globalNotifications = newNotifications;
    
    if (globalSetNotifications) {
      globalSetNotifications(newNotifications);
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    globalNotifications = [];
    if (globalSetNotifications) {
      globalSetNotifications([]);
    }
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options) => 
    showNotification(NOTIFICATION_TYPES.SUCCESS, message, options), [showNotification]);

  const showError = useCallback((message, options) => 
    showNotification(NOTIFICATION_TYPES.ERROR, message, options), [showNotification]);

  const showWarning = useCallback((message, options) => 
    showNotification(NOTIFICATION_TYPES.WARNING, message, options), [showNotification]);

  const showInfo = useCallback((message, options) => 
    showNotification(NOTIFICATION_TYPES.INFO, message, options), [showNotification]);

  return {
    notifications,
    showNotification,
    dismissNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useNotification;