import React from 'react';

interface AdErrorBoundaryState {
  hasError: boolean;
}

interface AdErrorBoundaryProps {
  children: React.ReactNode;
}

export class AdErrorBoundary extends React.Component<AdErrorBoundaryProps, AdErrorBoundaryState> {
  constructor(props: AdErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AdErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log if it's not a common cross-origin error
    if (!error.message.includes('Script error') && !error.message.includes('postMessage')) {
      console.warn('Ad Error Boundary caught an error:', error, errorInfo);
    }
  }

  componentDidMount() {
    // Filter out cross-origin script errors
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (
        message === 'Script error.' ||
        message.toString().includes('postMessage') ||
        message.toString().includes('DataCloneError')
      ) {
        return true; // Suppress these errors
      }
      
      if (originalOnError) {
        return originalOnError.call(window, message, source, lineno, colno, error);
      }
      return false;
    };
  }

  render() {
    if (this.state.hasError) {
      // Silently continue rendering children
      return this.props.children;
    }

    return this.props.children;
  }
}