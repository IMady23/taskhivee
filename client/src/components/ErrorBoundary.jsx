import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorId: errorId
    });
    
    // Log error for debugging and monitoring
    console.error('ErrorBoundary caught an error:', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  handleRefresh = () => {
    this.setState(prevState => ({ 
      retryCount: prevState.retryCount + 1 
    }));
    window.location.reload();
  };

  handleGoHome = () => {
    // Clear any potentially corrupted state
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    });
  };

  handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Create mailto link with error details
    const subject = encodeURIComponent(`TaskHive Error Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error Details:
- Error ID: ${errorReport.errorId}
- Message: ${errorReport.message}
- URL: ${errorReport.url}
- Timestamp: ${errorReport.timestamp}

Please describe what you were doing when this error occurred:
[Your description here]

Technical Details:
${errorReport.stack}
    `);
    
    window.open(`mailto:support@taskhive.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message?.includes('fetch') || 
                            this.state.error?.message?.includes('network') ||
                            this.state.error?.message?.includes('Failed to load');

      const isAuthError = this.state.error?.message?.includes('auth') ||
                         this.state.error?.message?.includes('token') ||
                         this.state.error?.message?.includes('permission');

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              
              <p className="text-gray-600 mb-4">
                {isNetworkError && "We're having trouble connecting to our servers. Please check your internet connection and try again."}
                {isAuthError && "There was an authentication issue. Please try signing in again."}
                {!isNetworkError && !isAuthError && "We encountered an unexpected error. Our team has been notified and we're working on a fix."}
              </p>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-500">
                  Error ID: <code className="font-mono text-xs">{this.state.errorId}</code>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Primary action based on error type */}
              {isNetworkError ? (
                <button
                  onClick={this.handleRefresh}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Connection
                </button>
              ) : isAuthError ? (
                <button
                  onClick={this.handleGoHome}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
                >
                  <Home className="w-4 h-4" />
                  Sign In Again
                </button>
              ) : (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              )}
              
              {/* Secondary actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleRefresh}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>

              {/* Report error button */}
              <button
                onClick={this.handleReportError}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2 text-sm"
              >
                <Bug className="w-4 h-4" />
                Report This Error
              </button>
            </div>

            {/* Retry count indicator */}
            {this.state.retryCount > 0 && (
              <div className="mt-4 text-xs text-gray-500">
                Retry attempts: {this.state.retryCount}
              </div>
            )}

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 font-medium">
                  🔧 Developer Details
                </summary>
                <div className="mt-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-xs font-mono text-red-800 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs overflow-auto max-h-32 bg-white p-2 rounded border">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs overflow-auto max-h-32 bg-white p-2 rounded border">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </div>
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

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = (Component, fallback) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Hook for error boundary in functional components
export const useErrorHandler = () => {
  return (error, errorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo);
    // You can also trigger error reporting here
  };
};

export default ErrorBoundary;