// frontend/src/components/common/Notification.js

/**
 * =============================================================================
 * NOTIFICATION COMPONENT
 * =============================================================================
 * Toast notifications and alert components with animations and auto-dismiss
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X,
  Bell,
  Zap
} from 'lucide-react';

// Single Notification Component
const Notification = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  position = 'top-right',
  showIcon = true,
  dismissible = true,
  persistent = false,
  actions = [],
  onDismiss,
  onAction,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Auto-dismiss timer
  useEffect(() => {
    // Show notification with animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Auto-dismiss if not persistent
    let dismissTimer;
    if (!persistent && duration > 0) {
      dismissTimer = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration, persistent]);

  // Handle dismiss with animation
  const handleDismiss = useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => {
      if (onDismiss) {
        onDismiss(id);
      }
    }, 300); // Match exit animation duration
  }, [id, onDismiss]);

  // Handle action click
  const handleAction = useCallback((action) => {
    if (onAction) {
      onAction(id, action);
    }
    if (action.dismissOnClick !== false) {
      handleDismiss();
    }
  }, [id, onAction, handleDismiss]);

  // Type configurations
  const typeConfig = {
    success: {
      icon: CheckCircle,
      colors: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-100',
      iconColor: 'text-green-400 dark:text-green-300'
    },
    error: {
      icon: AlertCircle,
      colors: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-100',
      iconColor: 'text-red-400 dark:text-red-300'
    },
    warning: {
      icon: AlertTriangle,
      colors: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100',
      iconColor: 'text-yellow-400 dark:text-yellow-300'
    },
    info: {
      icon: Info,
      colors: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100',
      iconColor: 'text-blue-400 dark:text-blue-300'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = config.icon;

  // Animation classes
  const animationClasses = isRemoving
    ? 'animate-slide-up opacity-0 transform -translate-y-2'
    : isVisible
    ? 'animate-slide-down opacity-100 transform translate-y-0'
    : 'opacity-0 transform translate-y-2';

  return (
    <div
      className={`
        max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border
        transition-all duration-300 ease-in-out
        ${config.colors}
        ${animationClasses}
        ${className}
      `}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          {showIcon && (
            <div className="flex-shrink-0">
              <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
            </div>
          )}

          {/* Content */}
          <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
            {title && (
              <h4 className="text-sm font-medium mb-1">
                {title}
              </h4>
            )}
            {message && (
              <p className="text-sm opacity-90">
                {message}
              </p>
            )}

            {/* Actions */}
            {actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleAction(action)}
                    className={`
                      text-sm font-medium px-3 py-1 rounded-md transition-colors
                      ${action.variant === 'primary'
                        ? 'bg-current bg-opacity-20 hover:bg-opacity-30'
                        : 'hover:bg-current hover:bg-opacity-10'
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleDismiss}
                className="rounded-md inline-flex text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current transition-opacity"
                aria-label="Dismiss notification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {!persistent && duration > 0 && (
        <div className="h-1 bg-current bg-opacity-20">
          <div
            className="h-full bg-current bg-opacity-40 transition-all ease-linear"
            style={{
              width: isVisible ? '0%' : '100%',
              transitionDuration: `${duration}ms`
            }}
          />
        </div>
      )}
    </div>
  );
};

// Notification Container Component
export const NotificationContainer = ({
  notifications = [],
  position = 'top-right',
  spacing = 'normal',
  maxNotifications = 5,
  onDismiss,
  onAction,
  className = ''
}) => {
  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4'
  };

  // Spacing classes
  const spacingClasses = {
    tight: 'space-y-2',
    normal: 'space-y-4',
    loose: 'space-y-6'
  };

  // Limit notifications
  const visibleNotifications = notifications.slice(0, maxNotifications);

  if (visibleNotifications.length === 0) return null;

  const containerContent = (
    <div
      className={`
        fixed z-50 pointer-events-none
        ${positionClasses[position]}
        ${className}
      `}
    >
      <div className={`flex flex-col ${spacingClasses[spacing]}`}>
        {visibleNotifications.map((notification) => (
          <Notification
            key={notification.id}
            {...notification}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );

  return createPortal(containerContent, document.body);
};

// Toast Hook for easy usage
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  // Add notification
  const addNotification = useCallback((notification) => {
    const id = notification.id || Date.now().toString();
    const newNotification = {
      id,
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      duration: 8000, // Longer duration for errors
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      ...options
    });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// In-page Alert Component
export const Alert = ({
  type = 'info',
  title,
  message,
  children,
  dismissible = false,
  onDismiss,
  showIcon = true,
  actions = [],
  onAction,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleAction = (action) => {
    if (onAction) {
      onAction(action);
    }
  };

  if (!isVisible) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle,
      colors: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-100',
      iconColor: 'text-green-400 dark:text-green-300'
    },
    error: {
      icon: AlertCircle,
      colors: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-100',
      iconColor: 'text-red-400 dark:text-red-300'
    },
    warning: {
      icon: AlertTriangle,
      colors: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100',
      iconColor: 'text-yellow-400 dark:text-yellow-300'
    },
    info: {
      icon: Info,
      colors: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100',
      iconColor: 'text-blue-400 dark:text-blue-300'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <div
      className={`
        border rounded-lg p-4 transition-all duration-200
        ${config.colors}
        ${className}
      `}
      role="alert"
      {...props}
    >
      <div className="flex">
        {/* Icon */}
        {showIcon && (
          <div className="flex-shrink-0">
            <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
          </div>
        )}

        {/* Content */}
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          {message && (
            <p className="text-sm opacity-90">
              {message}
            </p>
          )}
          {children && (
            <div className="mt-2">
              {children}
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(action)}
                  className="text-sm font-medium px-3 py-1 rounded-md bg-current bg-opacity-20 hover:bg-opacity-30 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              onClick={handleDismiss}
              className="rounded-md inline-flex text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current transition-opacity"
              aria-label="Dismiss alert"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Notification Badge Component
export const NotificationBadge = ({
  count = 0,
  max = 99,
  showZero = false,
  size = 'md',
  color = 'red',
  position = 'top-right',
  className = '',
  children,
  ...props
}) => {
  const displayCount = count > max ? `${max}+` : count.toString();
  const shouldShow = count > 0 || showZero;

  const sizes = {
    sm: 'min-w-[16px] h-4 text-xs px-1',
    md: 'min-w-[20px] h-5 text-xs px-1.5',
    lg: 'min-w-[24px] h-6 text-sm px-2'
  };

  const colors = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    gray: 'bg-gray-500 text-white'
  };

  const positions = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  };

  return (
    <div className="relative inline-flex" {...props}>
      {children}
      {shouldShow && (
        <span
          className={`
            absolute inline-flex items-center justify-center
            rounded-full font-medium
            ${sizes[size]}
            ${colors[color]}
            ${positions[position]}
            ${className}
          `}
        >
          {displayCount}
        </span>
      )}
    </div>
  );
};

// Notification Bell Component
export const NotificationBell = ({
  count = 0,
  onClick,
  size = 'md',
  animated = true,
  className = '',
  ...props
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when count changes
  useEffect(() => {
    if (count > 0 && animated) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [count, animated]);

  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  return (
    <NotificationBadge count={count} position="top-right">
      <button
        onClick={onClick}
        className={`
          p-2 rounded-full transition-colors
          hover:bg-gray-100 dark:hover:bg-gray-800
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${isAnimating ? 'animate-bounce' : ''}
          ${className}
        `}
        aria-label={`Notifications ${count > 0 ? `(${count} unread)` : ''}`}
        {...props}
      >
        <Bell className={`${sizes[size]} text-gray-600 dark:text-gray-400`} />
      </button>
    </NotificationBadge>
  );
};

export default Notification;