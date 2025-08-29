import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error, resetErrorBoundary}: {error: Error, resetErrorBoundary: () => void}) {
  console.warn('[ErrorBoundaryGlobal] Caught error:', error);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
        <p className="text-muted-foreground">
          The page encountered an error. This is usually temporary.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

interface ErrorBoundaryGlobalProps {
  children: React.ReactNode;
}

export const ErrorBoundaryGlobal: React.FC<ErrorBoundaryGlobalProps> = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log error but don't let it crash the app
        console.warn('[ErrorBoundaryGlobal] Error caught:', error.message);
      }}
      onReset={() => {
        // Reload the page to reset state
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
};