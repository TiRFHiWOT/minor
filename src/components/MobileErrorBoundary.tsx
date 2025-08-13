import React from 'react';

interface MobileErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface MobileErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class MobileErrorBoundary extends React.Component<MobileErrorBoundaryProps, MobileErrorBoundaryState> {
  constructor(props: MobileErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): MobileErrorBoundaryState {
    console.error('Mobile component error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mobile Error Boundary caught an error:', error, errorInfo);
    
    // Log mobile-specific error details
    console.error('Mobile error details:', {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-4 bg-background min-h-[200px]">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Mobile View Unavailable</h3>
            <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}