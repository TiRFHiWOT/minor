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
    console.error('🔴 MOBILE ERROR BOUNDARY TRIGGERED 🔴');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    
    // Enhanced mobile-specific error details
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
      device: {
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        pixelRatio: window.devicePixelRatio,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      browser: {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        fetch: typeof fetch !== 'undefined'
      },
      memory: (window.performance as any)?.memory ? {
        used: (window.performance as any).memory.usedJSHeapSize,
        total: (window.performance as any).memory.totalJSHeapSize,
        limit: (window.performance as any).memory.jsHeapSizeLimit
      } : 'not available'
    };
    
    console.error('📱 Mobile Error Details:', errorDetails);
    
    // Attempt to identify the failing component
    const componentStack = errorInfo.componentStack;
    if (componentStack.includes('AuthProvider')) {
      console.error('❌ AUTH PROVIDER ERROR DETECTED');
    }
    if (componentStack.includes('SessionManager') || componentStack.includes('useTempUser')) {
      console.error('❌ SESSION MANAGER ERROR DETECTED');
    }
    if (componentStack.includes('MobileBottomNav')) {
      console.error('❌ MOBILE BOTTOM NAV ERROR DETECTED');
    }
    if (componentStack.includes('useIsMobile')) {
      console.error('❌ USE IS MOBILE HOOK ERROR DETECTED');
    }
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