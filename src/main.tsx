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
  
  // Block known external ad script errors and AdSense TagErrors
  const msg = String(event.message || '');
  const file = String(event.filename || '');
  if (
    msg.includes('SYNC.JS') || 
    msg.includes('TCF IFRAME LOCATOR') ||
    file.includes('sync.min.js') || 
    file.includes('tags.crwdcntrl.net') ||
    file.includes('adnxs.com') ||
    file.includes('adsystem.com') ||
    file === '' || 
    file === 'Unknown file' ||
    msg === 'Script error.' ||
    event.lineno === 0 ||
    /adsbygoogle\.push\(\) error/i.test(msg) ||
    /No slot size for availableWidth=0/i.test(msg) ||
    /All 'ins' elements.*already have ads/i.test(msg)
  ) {
    console.log('🛡️ Blocked external ad/AdSense TagError to prevent React crash', { msg, file });
    event.stopImmediatePropagation();
    event.preventDefault();
    return false;
  }
};

window.addEventListener('error', blockExternalErrors, true);

// Fallback: suppress generic cross-origin "Script error." via window.onerror
window.onerror = function (message: any, source?: string, lineno?: number, colno?: number, error?: any) {
console.log('🚀 App starting...');

try {
    const msg = String(message || '');
    const src = source || '';
    if (msg === 'Script error.' || src === '' || src === 'Unknown file' || (lineno === 0 && colno === 0)) {
      console.warn('🛡️ Suppressed cross-origin script error via window.onerror', { msg, src, lineno, colno });
      return true; // prevent default logging and potential blank screen reports
    }
  } catch {}
  return false;
};

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
