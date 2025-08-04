// frontend/src/components/layout/Layout.js

/**
 * =============================================================================
 * LAYOUT COMPONENT
 * =============================================================================
 * Main layout wrapper that includes header, footer, and content area
 */

import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { NotificationContainer } from '../common/Notification';
import { LoadingOverlay } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children, className = '', showFooter = true }) => {
  const { 
    notifications, 
    isOffline, 
    error,
    clearError,
    addNotification
  } = useApp();
  
  const { 
    isLoading: authLoading,
    error: authError,
    clearError: clearAuthError
  } = useAuth();

  // Handle global app errors
  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Application Error',
        message: error,
        duration: 8000,
        dismissible: true
      });
      clearError();
    }
  }, [error, addNotification, clearError]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      addNotification({
        type: 'error',
        title: 'Authentication Error',
        message: authError,
        duration: 8000,
        dismissible: true
      });
      clearAuthError();
    }
  }, [authError, addNotification, clearAuthError]);

  // Handle offline status
  useEffect(() => {
    if (isOffline) {
      addNotification({
        type: 'warning',
        title: 'Connection Lost',
        message: 'You are currently offline. Some features may not be available.',
        persistent: true,
        dismissible: true
      });
    }
  }, [isOffline, addNotification]);

  // Scroll to top on route change (optional)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main 
        className={`flex-1 ${className}`}
        role="main"
        id="main-content"
      >
        {children}
      </main>

      {/* Footer */}
      {showFooter && <Footer />}

      {/* Global Notifications */}
      <NotificationContainer 
        notifications={notifications}
        position="top-right"
        maxNotifications={5}
      />

      {/* Global Loading Overlay */}
      <LoadingOverlay 
        show={authLoading}
        message="Initializing..."
        backdrop={true}
      />

      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Offline</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Page wrapper for consistent spacing
export const PageContainer = ({ 
  children, 
  className = '',
  maxWidth = '7xl',
  padding = true 
}) => {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full'
  };

  return (
    <div className={`
      ${maxWidthClasses[maxWidth]} 
      mx-auto 
      ${padding ? 'px-4 sm:px-6 lg:px-8' : ''} 
      ${className}
    `}>
      {children}
    </div>
  );
};

// Section wrapper with consistent spacing
export const Section = ({ 
  children, 
  className = '',
  padding = 'normal',
  background = 'transparent' 
}) => {
  const paddingClasses = {
    none: '',
    small: 'py-8',
    normal: 'py-12',
    large: 'py-16',
    xl: 'py-20'
  };

  const backgroundClasses = {
    transparent: '',
    white: 'bg-white dark:bg-gray-800',
    gray: 'bg-gray-50 dark:bg-gray-900',
    primary: 'bg-blue-50 dark:bg-blue-900',
    gradient: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900'
  };

  return (
    <section className={`
      ${paddingClasses[padding]} 
      ${backgroundClasses[background]} 
      ${className}
    `}>
      {children}
    </section>
  );
};

// Hero section wrapper
export const HeroSection = ({ 
  children, 
  className = '',
  background = 'gradient',
  height = 'auto' 
}) => {
  const heightClasses = {
    auto: '',
    screen: 'min-h-screen',
    '1/2': 'min-h-[50vh]',
    '2/3': 'min-h-[66vh]',
    '3/4': 'min-h-[75vh]'
  };

  return (
    <Section 
      padding="large"
      background={background}
      className={`
        ${heightClasses[height]}
        flex items-center justify-center
        ${className}
      `}
    >
      {children}
    </Section>
  );
};

// Card container for consistent card layouts
export const CardGrid = ({ 
  children, 
  className = '',
  columns = {
    default: 1,
    sm: 2,
    lg: 3,
    xl: 4
  },
  gap = 'normal'
}) => {
  const gapClasses = {
    none: '',
    small: 'gap-4',
    normal: 'gap-6',
    large: 'gap-8'
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  };

  const gridColsResponsive = `
    ${gridCols[columns.default]}
    ${columns.sm ? `sm:${gridCols[columns.sm]}` : ''}
    ${columns.md ? `md:${gridCols[columns.md]}` : ''}
    ${columns.lg ? `lg:${gridCols[columns.lg]}` : ''}
    ${columns.xl ? `xl:${gridCols[columns.xl]}` : ''}
    ${columns['2xl'] ? `2xl:${gridCols[columns['2xl']]}` : ''}
  `.trim();

  return (
    <div className={`
      grid 
      ${gridColsResponsive}
      ${gapClasses[gap]} 
      ${className}
    `}>
      {children}
    </div>
  );
};

// Breadcrumb component
export const Breadcrumb = ({ items = [], className = '' }) => {
  const { navigate } = useApp();

  if (items.length === 0) return null;

  return (
    <nav 
      className={`flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 ${className}`}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-gray-300 dark:text-gray-600">/</span>
          )}
          {item.href && index < items.length - 1 ? (
            <button
              onClick={() => navigate(item.href)}
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span 
              className={index === items.length - 1 ? 'text-gray-900 dark:text-gray-100 font-medium' : ''}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Error Boundary Layout
export const ErrorBoundaryLayout = ({ error, retry }) => {
  return (
    <Layout>
      <Section padding="large">
        <PageContainer>
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We apologize for the inconvenience. Please try refreshing the page.
              </p>
              {error && (
                <details className="text-left mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto">
                    {error.toString()}
                  </pre>
                </details>
              )}
              <div className="space-y-3">
                <button
                  onClick={retry}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>
    </Layout>
  );
};

export default Layout;