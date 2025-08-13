import React from 'react';

interface ErrorBoundaryEnhancedState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

interface ErrorBoundaryEnhancedProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  maxRetries?: number;
}

export class ErrorBoundaryEnhanced extends React.Component<ErrorBoundaryEnhancedProps, ErrorBoundaryEnhancedState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryEnhancedProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryEnhancedState> {
    console.error('🔴 Enhanced Error Boundary triggered:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 Enhanced Error Boundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Enhanced error details
    const errorDetails = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      component: {
        stack: errorInfo.componentStack
      },
      retryCount: this.state.retryCount,
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        onLine: navigator.onLine
      }
    };
    
    console.error('📊 Error Details:', errorDetails);
    
    // Auto-retry mechanism for transient errors
    const maxRetries = this.props.maxRetries || 3;
    if (this.state.retryCount < maxRetries) {
      console.log(`🔄 Auto-retrying in 2 seconds (attempt ${this.state.retryCount + 1}/${maxRetries})`);
      this.retryTimeout = setTimeout(() => {
        this.handleRetry();
      }, 2000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleRetry = () => {
    console.log('🔄 Retrying after error...');
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleManualRetry = () => {
    console.log('🔄 Manual retry triggered...');
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      const maxRetries = this.props.maxRetries || 3;
      const canAutoRetry = this.state.retryCount < maxRetries;
      
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-6 bg-background min-h-[300px] text-center">
          <div className="space-y-4 max-w-md">
            <h3 className="text-lg font-semibold text-destructive">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {canAutoRetry && (
              <p className="text-xs text-muted-foreground">
                Auto-retrying... (attempt {this.state.retryCount + 1}/{maxRetries})
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <button 
                onClick={this.handleManualRetry}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90"
              >
                Reload Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs cursor-pointer">Error Details</summary>
                <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}