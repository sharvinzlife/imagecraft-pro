import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report error to monitoring service if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }

    // Send error to API if user is authenticated
    if (window.apiService?.token) {
      try {
        window.apiService.request('/errors/report', {
          method: 'POST',
          body: JSON.stringify({
            error: error.toString(),
            stack: error.stack,
            errorInfo: errorInfo.componentStack,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            errorId: this.state.errorId
          })
        }).catch(console.error);
      } catch (reportError) {
        console.error('Failed to report error:', reportError);
      }
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, level = 'component' } = this.props;

      // If a custom fallback is provided, use it
      if (Fallback) {
        return (
          <Fallback 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
          />
        );
      }

      // Default error UI based on error level
      if (level === 'app') {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-red-50">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h1 
                    className="text-2xl font-bold text-gray-900 mb-2"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Something went wrong
                  </h1>
                  <p 
                    className="text-gray-600"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    We're sorry, but something unexpected happened. Our team has been notified.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="glassPrimary"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={this.handleGoHome}
                    variant="glassSecondary"
                    className="w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                {/* Error ID for support */}
                {this.state.errorId && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Error ID: {this.state.errorId}
                    </p>
                  </div>
                )}

                {/* Development mode error details */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-6 text-left">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                      Error Details (Development)
                    </summary>
                    <div className="bg-gray-100 p-3 rounded-md overflow-auto max-h-32">
                      <pre className="text-xs text-red-600 whitespace-pre-wrap">
                        {this.state.error.toString()}
                      </pre>
                      {this.state.errorInfo && (
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap mt-2">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }

      // Component-level error UI
      return (
        <Card variant="glass" className="border-red-200 bg-red-50/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 
                  className="text-lg font-semibold text-red-800 mb-2"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Component Error
                </h3>
                <p 
                  className="text-red-700 mb-4"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  This section encountered an error and couldn't load properly.
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={this.handleRetry}
                    size="sm"
                    variant="glass"
                    className="border-red-300 hover:bg-red-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </div>

            {/* Development mode error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-red-700 mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-red-100 p-3 rounded-md overflow-auto max-h-32">
                  <pre className="text-xs text-red-800 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for error reporting in functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, errorInfo = {}) => {
    console.error('Error caught by useErrorHandler:', error);
    
    // Report to monitoring service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }

    // Send to API if available
    if (window.apiService?.token) {
      window.apiService.request('/errors/report', {
        method: 'POST',
        body: JSON.stringify({
          error: error.toString(),
          stack: error.stack,
          errorInfo,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        })
      }).catch(console.error);
    }
  }, []);

  return handleError;
};

export default ErrorBoundary;