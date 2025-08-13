import React, { useEffect, useState } from 'react';

interface ScriptError {
  message: string;
  stack?: string;
  timestamp: number;
}

export const ScriptErrorDebugger: React.FC = () => {
  const [errors, setErrors] = useState<ScriptError[]>([]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.log('🚨 Script Error Detected:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });

      setErrors(prev => [...prev, {
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        timestamp: Date.now()
      }]);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('🚨 Unhandled Promise Rejection:', event.reason);
      
      setErrors(prev => [...prev, {
        message: `Promise rejection: ${event.reason}`,
        timestamp: Date.now()
      }]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Simple fallback component that always renders
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(255, 0, 0, 0.1)',
      border: '1px solid red',
      padding: '8px',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      maxHeight: '200px',
      overflow: 'auto'
    }}>
      <div>🔍 Script Error Debugger Active</div>
      {errors.length > 0 && (
        <div>
          <div>Errors detected: {errors.length}</div>
          {errors.slice(-3).map((error, index) => (
            <div key={index} style={{ margin: '4px 0', fontSize: '10px' }}>
              {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};