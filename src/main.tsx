import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

// Aggressive error handling to prevent any script errors from crashing React
window.addEventListener('error', (event) => {
  console.log('Global error caught:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
  
  // Block all external script errors
  if (event.filename && (
    event.filename.includes('sync.min.js') || 
    event.filename.includes('tags.crwdcntrl.net') ||
    event.filename.includes('adnxs.com') ||
    event.filename.includes('adsystem.com') ||
    event.filename === '' || 
    event.filename === 'Unknown file'
  )) {
    console.log('Blocked external script error');
    event.stopImmediatePropagation();
    event.preventDefault();
    return false;
  }
  
  // Block generic script errors
  if (event.message === 'Script error.' || event.message?.includes('SYNC.JS')) {
    console.log('Blocked generic script error');
    event.stopImmediatePropagation();
    event.preventDefault();
    return false;
  }
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
