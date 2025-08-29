// Global error handler to prevent external script errors from crashing the app
export const setupGlobalErrorHandler = () => {
  console.log('🛡️ [GlobalErrorHandler] Setting up global error handling...');
  
  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    console.log('🚨 [GlobalErrorHandler] Error caught:', event);
    const { message, filename, lineno, colno, error } = event;
    
    // Filter out cross-origin script errors that we can't control
    if (
      message === 'Script error.' || 
      !filename || 
      filename === 'Unknown file' ||
      filename.includes('admetricspro.com') ||
      filename.includes('doubleclick.net') ||
      filename.includes('googletagservices.com') ||
      filename.includes('googlesyndication.com')
    ) {
      console.warn('[GlobalErrorHandler] External script error filtered:', {
        message,
        filename,
        lineno,
        colno
      });
      event.preventDefault();
      return true; // Prevent default error handling
    }
    
    // Allow other errors to be handled normally
    console.error('[GlobalErrorHandler] Unhandled error:', {
      message,
      filename,
      lineno,
      colno,
      stack: error?.stack
    });
    
    return false; // Allow default error handling
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[GlobalErrorHandler] Unhandled promise rejection:', event.reason);
    
    // Filter out ad-related promise rejections
    if (
      event.reason?.message?.includes('admetricspro') ||
      event.reason?.message?.includes('doubleclick') ||
      event.reason?.stack?.includes('admetricspro') ||
      event.reason?.stack?.includes('doubleclick')
    ) {
      console.warn('[GlobalErrorHandler] Ad-related promise rejection filtered');
      event.preventDefault();
      return;
    }
  });
};

// Clean up error handlers
export const cleanupGlobalErrorHandler = () => {
  // Note: In practice, we usually don't remove these listeners
  // as they should persist for the entire app lifecycle
};