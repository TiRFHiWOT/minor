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
    
    console.error('🔴 MAIN ERROR BOUNDARY TRIGGERED 🔴');
    console.error('Error caught by main boundary:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 MAIN ERROR BOUNDARY - componentDidCatch 🔴');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    
    // Log detailed mobile debugging info
    const debugInfo = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack,
      device: {
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined'
      }
    };
    
    console.error('🐛 DEBUG INFO:', JSON.stringify(debugInfo, null, 2));
    
    // Try to identify what's failing
    const stack = errorInfo.componentStack;
    if (stack.includes('AuthProvider')) {
      console.error('❌ ERROR IN AUTH PROVIDER');
    }
    if (stack.includes('SessionManager') || stack.includes('sessionManager')) {
      console.error('❌ ERROR IN SESSION MANAGER');
    }
    if (stack.includes('useIsMobile')) {
      console.error('❌ ERROR IN useIsMobile HOOK');
    }
    if (stack.includes('MobileBottomNav')) {
      console.error('❌ ERROR IN MOBILE BOTTOM NAV');
    }
    if (stack.includes('ForumLayout')) {
      console.error('❌ ERROR IN FORUM LAYOUT');
    }
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