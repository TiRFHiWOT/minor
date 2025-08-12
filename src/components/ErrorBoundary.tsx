import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Ignore cross-origin script errors from ad networks
    if (error.message === 'Script error.' || error.message.includes('SYNC.JS')) {
      console.log('Ignored cross-origin error from ad script:', error.message);
      return { hasError: false };
    }

    // Ignore MediaQueryList listener compatibility errors (older Safari/WebViews)
    const msg = (error as any)?.message || '';
    const stack = (error as any)?.stack || '';
    if (/addEventListener is not a function/i.test(msg) && (/MediaQueryList|matchMedia|use-mobile/i.test(msg + ' ' + stack))) {
      console.warn('Ignored MediaQueryList listener error:', msg);
      return { hasError: false };
    }

    // Ignore AdSense TagErrors that should not crash the UI
    if (/adsbygoogle\.push\(\) error/i.test(msg) || /No slot size for availableWidth=0/i.test(msg) || /All 'ins' elements.*already have ads/i.test(msg)) {
      console.warn('Ignored AdSense TagError:', msg);
      return { hasError: false };
    }
    
    console.error('Error caught by boundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}