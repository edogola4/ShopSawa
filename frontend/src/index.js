// frontend/src/index.js - FIXED VERSION

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AdminApp from './AdminApp';

// Import global styles
import './styles/globals.css';

// Error boundary component for better error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Application Error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service (if available)
    if (window.reportError) {
      window.reportError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go to Homepage
              </button>
            </div>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
                  <p className="font-medium text-red-800 mb-2">Error:</p>
                  <pre className="text-red-700 whitespace-pre-wrap mb-4">
                    {this.state.error.toString()}
                  </pre>
                  
                  <p className="font-medium text-red-800 mb-2">Stack Trace:</p>
                  <pre className="text-red-700 whitespace-pre-wrap text-xs">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create root container
const container = document.getElementById('root');
const root = createRoot(container);

// Render application with error boundary
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {process.env.REACT_APP_ADMIN_ONLY === 'true' ? <AdminApp /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
);

// Service worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Performance monitoring (optional)
if (process.env.NODE_ENV === 'production') {
  // Web Vitals reporting
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    function sendToAnalytics(metric) {
      // Send to your analytics service
      console.log('Web Vital:', metric);
      
      // Example: Send to Google Analytics
      if (window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }
    }

    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  });
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent the default behavior (console error)
  event.preventDefault();
  
  // Report to monitoring service
  if (window.reportError) {
    window.reportError(event.reason, { type: 'unhandledrejection' });
  }
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('Global JavaScript error:', event.error);
  
  // Report to monitoring service
  if (window.reportError) {
    window.reportError(event.error, { 
      type: 'javascript',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  }
});

// Development mode helpers
if (process.env.NODE_ENV === 'development') {
  // React Developer Tools message
  console.log(
    '%cShopSawa Frontend',
    'color: #2563eb; font-size: 24px; font-weight: bold;'
  );
  console.log(
    '%cRunning in development mode',
    'color: #059669; font-size: 14px;'
  );
  
  // FIXED: Performance monitoring in development (prevents NaN)
  if (window.performance && window.performance.getEntriesByType) {
    setTimeout(() => {
      const navigationEntries = window.performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navigation = navigationEntries[0];
        
        // Helper function to safely calculate timing differences
        const safeTimingDiff = (end, start) => {
          const diff = end - start;
          return isFinite(diff) && diff >= 0 ? Math.round(diff) : 0;
        };
        
        const performanceMetrics = {
          'DNS Lookup': safeTimingDiff(navigation.domainLookupEnd, navigation.domainLookupStart),
          'TCP Connection': safeTimingDiff(navigation.connectEnd, navigation.connectStart),
          'Request/Response': safeTimingDiff(navigation.responseEnd, navigation.requestStart),
          'DOM Processing': safeTimingDiff(navigation.domComplete, navigation.responseEnd),
          'Total Load Time': navigation.loadEventEnd > 0 
            ? safeTimingDiff(navigation.loadEventEnd, navigation.navigationStart)
            : 'Still loading...'
        };
        
        console.log('Page Load Performance:', performanceMetrics);
      }
    }, 1000);
  }
}

// Expose development utilities
if (process.env.NODE_ENV === 'development') {
  window.__SHOPSAWA_DEV__ = {
    version: process.env.REACT_APP_VERSION || '1.0.0',
    buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'
  };
}