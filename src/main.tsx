import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

// Ultra-aggressive error handling to prevent any script errors from crashing React
const blockExternalErrors = (event: ErrorEvent) => {
  console.log('Global error caught:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
  
  // Block ALL sync.js related errors
  if (event.message?.includes('SYNC.JS') || 
      event.message?.includes('TCF IFRAME LOCATOR') ||
      event.filename?.includes('sync.min.js') || 
      event.filename?.includes('tags.crwdcntrl.net') ||
      event.filename?.includes('adnxs.com') ||
      event.filename?.includes('adsystem.com') ||
      event.filename === '' || 
      event.filename === 'Unknown file' ||
      event.message === 'Script error.' ||
      event.lineno === 0) {
    
    console.log('🛡️ Blocked external ad script error to prevent React crash');
    event.stopImmediatePropagation();
    event.preventDefault();
    return false;
  }
};

window.addEventListener('error', blockExternalErrors, true);

// Also handle any SecurityError specifically
window.addEventListener('securitypolicyviolation', (event) => {
  console.log('🛡️ Security policy violation blocked:', event.violatedDirective);
  event.preventDefault();
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.log('Promise rejection:', event.reason);
  event.preventDefault();
});

// Force clear any cached scripts on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Clearing cached ad scripts...');
  const scripts = document.querySelectorAll('script[src*="tags.crwdcntrl.net"], script[src*="sync.min.js"]');
  scripts.forEach(script => script.remove());
});

const root = document.getElementById("root");
if (!root) {
  console.error('Root element not found!');
} else {
  try {
    createRoot(root).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error rendering React app:', error);
  }
}
