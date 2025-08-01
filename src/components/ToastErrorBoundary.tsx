import React from 'react';

interface ToastErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ToastErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ToastErrorBoundary extends React.Component<ToastErrorBoundaryProps, ToastErrorBoundaryState> {
  constructor(props: ToastErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ToastErrorBoundaryState {
    console.error('Toast system error caught by boundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Toast Error Boundary caught an error:', error, errorInfo);
    
    // Attempt to recover by clearing any problematic toast state
    try {
      // Clear any localStorage that might be causing issues
      localStorage.removeItem('toast-state');
    } catch (clearError) {
      console.warn('Could not clear toast storage:', clearError);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="fixed bottom-4 right-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">Toast system temporarily unavailable</p>
        </div>
      );
    }

    return this.props.children;
  }
}