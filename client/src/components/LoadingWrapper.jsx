import React from 'react';
import LoadingSpinner, { SkeletonLoader } from './LoadingSpinner';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * LoadingWrapper - A reusable component for handling loading, error, and empty states
 * Provides consistent UX patterns across the application
 */
const LoadingWrapper = ({
  loading = false,
  error = null,
  empty = false,
  children,
  loadingComponent = null,
  errorComponent = null,
  emptyComponent = null,
  onRetry = null,
  className = '',
  // Loading options
  loadingMessage = 'Loading...',
  loadingVariant = 'default', // 'default', 'skeleton', 'pulse'
  skeletonLines = 3,
  // Error options
  errorTitle = 'Something went wrong',
  errorMessage = null,
  showRetryButton = true,
  // Empty options
  emptyTitle = 'No data available',
  emptyMessage = 'There\'s nothing to show here yet.',
  emptyIcon = null,
}) => {
  // Custom loading component
  if (loading) {
    if (loadingComponent) {
      return loadingComponent;
    }

    if (loadingVariant === 'skeleton') {
      return (
        <div className={`space-y-4 ${className}`}>
          <SkeletonLoader lines={skeletonLines} />
        </div>
      );
    }

    return (
      <LoadingSpinner 
        message={loadingMessage} 
        variant={loadingVariant}
        className={className}
      />
    );
  }

  // Custom error component
  if (error) {
    if (errorComponent) {
      return errorComponent;
    }

    return (
      <div className={`flex items-center justify-center min-h-64 ${className}`}>
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{errorTitle}</h3>
          <p className="text-gray-600 mb-4">
            {errorMessage || (typeof error === 'string' ? error : 'An unexpected error occurred.')}
          </p>
          {showRetryButton && onRetry && (
            <button
              onClick={onRetry}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Custom empty component
  if (empty) {
    if (emptyComponent) {
      return emptyComponent;
    }

    return (
      <div className={`flex items-center justify-center min-h-64 ${className}`}>
        <div className="text-center max-w-md">
          {emptyIcon || <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{emptyTitle}</h3>
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Render children when not loading, no error, and not empty
  return <div className={className}>{children}</div>;
};

// Higher-order component version
export const withLoadingWrapper = (Component, defaultOptions = {}) => {
  return function WrappedComponent(props) {
    const { loadingWrapperProps = {}, ...componentProps } = props;
    const mergedOptions = { ...defaultOptions, ...loadingWrapperProps };

    return (
      <LoadingWrapper {...mergedOptions}>
        <Component {...componentProps} />
      </LoadingWrapper>
    );
  };
};

// Hook for managing loading states
export const useLoadingState = (initialState = false) => {
  const [loading, setLoading] = React.useState(initialState);
  const [error, setError] = React.useState(null);

  const startLoading = () => {
    setLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setLoading(false);
  };

  const setErrorState = (errorMessage) => {
    setLoading(false);
    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  const reset = () => {
    setLoading(false);
    setError(null);
  };

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setErrorState,
    clearError,
    reset,
    // Convenience methods
    isLoading: loading,
    hasError: !!error,
  };
};

export default LoadingWrapper;