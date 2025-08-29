// Global error handler to prevent script errors from crashing the app
export const setupGlobalErrorHandler = () => {
  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    // Filter out cross-origin errors from external scripts
    if (event.filename === '' || event.lineno === 0 || event.message === 'Script error.') {
      console.warn('[GlobalErrorHandler] Cross-origin script error filtered:', event.message);
      event.preventDefault();
      return false;
    }
    
    // Filter out Lovable development tool errors
    if (event.message?.includes('DataCloneError') || 
        event.message?.includes('postMessage') ||
        event.filename?.includes('lovable.js') ||
        event.filename?.includes('gpteng.co')) {
      console.warn('[GlobalErrorHandler] Development tool error filtered:', event.message);
      event.preventDefault();
      return false;
    }

    // Filter out ad-related errors
    if (event.filename?.includes('doubleclick') ||
        event.filename?.includes('googlesyndication') ||
        event.filename?.includes('amazon-adsystem') ||
        event.filename?.includes('admetricspro')) {
      console.warn('[GlobalErrorHandler] Ad script error filtered:', event.message);
      event.preventDefault();
      return false;
    }

    console.warn('[GlobalErrorHandler] Unfiltered error:', event);
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[GlobalErrorHandler] Unhandled promise rejection:', event.reason);
    
    // Filter out fetch-related errors from development tools
    if (event.reason?.message?.includes('DataCloneError') ||
        event.reason?.message?.includes('postMessage')) {
      event.preventDefault();
      return false;
    }
  });

  // Override fetch to handle cross-origin issues
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).catch(error => {
      // Silently handle fetch errors that might be related to development tools
      if (error.message?.includes('DataCloneError')) {
        console.warn('[GlobalErrorHandler] Fetch error filtered:', error.message);
        return new Response('{}', { status: 200 });
      }
      throw error;
    });
  };

  console.log('[GlobalErrorHandler] Global error handlers initialized');
};