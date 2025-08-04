// frontend/src/components/common/Modal.js

/**
 * =============================================================================
 * MODAL COMPONENT
 * =============================================================================
 * Reusable modal component with accessibility features and customizable variants
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import Button from './Button';

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  preventScroll = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  footer,
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Size variants
  const sizes = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  // Visual variants
  const variants = {
    default: {
      overlay: 'bg-black bg-opacity-50',
      content: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
      border: 'border-gray-200 dark:border-gray-700'
    },
    success: {
      overlay: 'bg-green-900 bg-opacity-20',
      content: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-l-4 border-green-500',
      border: 'border-gray-200 dark:border-gray-700'
    },
    warning: {
      overlay: 'bg-yellow-900 bg-opacity-20',
      content: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-l-4 border-yellow-500',
      border: 'border-gray-200 dark:border-gray-700'
    },
    danger: {
      overlay: 'bg-red-900 bg-opacity-20',
      content: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-l-4 border-red-500',
      border: 'border-gray-200 dark:border-gray-700'
    },
    info: {
      overlay: 'bg-blue-900 bg-opacity-20',
      content: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-l-4 border-blue-500',
      border: 'border-gray-200 dark:border-gray-700'
    }
  };

  // Handle backdrop click
  const handleBackdropClick = useCallback((event) => {
    if (closeOnBackdrop && event.target === event.currentTarget && onClose) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  // Handle escape key
  const handleEscapeKey = useCallback((event) => {
    if (closeOnEscape && event.key === 'Escape' && onClose) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  // Focus management
  const focusFirstElement = useCallback(() => {
    if (modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      if (firstElement) {
        firstElement.focus();
      }
    }
  }, []);

  // Trap focus within modal
  const handleTabKey = useCallback((event) => {
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          event.preventDefault();
        }
      }
    }
  }, []);

  // Handle modal opening
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement;

      // Prevent body scroll
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
      }

      // Add event listeners
      document.addEventListener('keydown', handleEscapeKey);
      document.addEventListener('keydown', handleTabKey);

      // Focus first element after a brief delay
      setTimeout(focusFirstElement, 100);
    }

    return () => {
      // Restore body scroll
      if (preventScroll) {
        document.body.style.overflow = 'unset';
      }

      // Remove event listeners
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('keydown', handleTabKey);

      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, preventScroll, handleEscapeKey, handleTabKey, focusFirstElement]);

  if (!isOpen) return null;

  const currentVariant = variants[variant] || variants.default;

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClassName}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 transition-opacity ${currentVariant.overlay}`} />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizes[size]} mx-auto rounded-lg shadow-xl 
          transform transition-all ${currentVariant.content} ${contentClassName}
        `}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`flex items-center justify-between p-6 border-b ${currentVariant.border} ${headerClassName}`}>
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={`p-6 ${bodyClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`flex items-center justify-end space-x-3 p-6 border-t ${currentVariant.border} ${footerClassName}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Create portal to render modal at document body level
  return createPortal(modalContent, document.body);
};

// Confirmation Modal Component
export const ConfirmModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  loading = false,
  ...props
}) => {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        variant={variant === 'danger' ? 'danger' : 'primary'}
        onClick={handleConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      variant={variant}
      footer={footer}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      {...props}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

// Alert Modal Component
export const AlertModal = ({
  isOpen = false,
  onClose,
  title,
  message,
  variant = 'info',
  buttonText = 'OK',
  ...props
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'danger':
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      default:
        return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const footer = (
    <Button onClick={onClose} variant="primary">
      {buttonText}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      variant={variant}
      footer={footer}
      {...props}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

// Loading Modal Component
export const LoadingModal = ({
  isOpen = false,
  message = 'Loading...',
  ...props
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing during loading
      size="sm"
      showCloseButton={false}
      closeOnBackdrop={false}
      closeOnEscape={false}
      {...props}
    >
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-700 dark:text-gray-300 text-center">
          {message}
        </p>
      </div>
    </Modal>
  );
};

// Drawer Component (Side Modal)
export const Drawer = ({
  isOpen = false,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footer,
  ...props
}) => {
  const drawerRef = useRef(null);

  // Position classes
  const positions = {
    left: {
      container: 'justify-start',
      content: 'h-full max-w-full transform transition-transform',
      open: 'translate-x-0',
      closed: '-translate-x-full'
    },
    right: {
      container: 'justify-end',
      content: 'h-full max-w-full transform transition-transform',
      open: 'translate-x-0',
      closed: 'translate-x-full'
    },
    top: {
      container: 'items-start justify-center',
      content: 'w-full max-h-full transform transition-transform',
      open: 'translate-y-0',
      closed: '-translate-y-full'
    },
    bottom: {
      container: 'items-end justify-center',
      content: 'w-full max-h-full transform transition-transform',
      open: 'translate-y-0',
      closed: 'translate-y-full'
    }
  };

  // Size classes
  const sizes = {
    sm: position === 'left' || position === 'right' ? 'w-80' : 'h-80',
    md: position === 'left' || position === 'right' ? 'w-96' : 'h-96',
    lg: position === 'left' || position === 'right' ? 'w-[28rem]' : 'h-[28rem]',
    xl: position === 'left' || position === 'right' ? 'w-[32rem]' : 'h-[32rem]',
    full: position === 'left' || position === 'right' ? 'w-full' : 'h-full'
  };

  // Handle backdrop click
  const handleBackdropClick = useCallback((event) => {
    if (closeOnBackdrop && event.target === event.currentTarget && onClose) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (closeOnEscape && event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const currentPosition = positions[position];

  const drawerContent = (
    <div
      className={`fixed inset-0 z-50 flex ${currentPosition.container}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Drawer Content */}
      <div
        ref={drawerRef}
        className={`
          relative bg-white dark:bg-gray-800 shadow-xl flex flex-col
          ${currentPosition.content}
          ${sizes[size]}
          ${isOpen ? currentPosition.open : currentPosition.closed}
          ${contentClassName}
        `}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 ${headerClassName}`}>
            {title && (
              <h2 id="drawer-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={`flex-1 overflow-y-auto p-6 ${bodyClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};

export default Modal;