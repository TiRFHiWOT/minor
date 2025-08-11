import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

// More robust error handling for third-party scripts
window.addEventListener('error', (event) => {
  // Prevent any script errors from crashing React
  if (event.filename?.includes('sync.min.js') || 
      event.filename?.includes('tags.crwdcntrl.net') ||
      event.message === 'Script error.' ||
      event.message?.includes('SYNC.JS')) {
    console.log('Blocked problematic third-party script error:', event.message);
    event.stopPropagation();
    event.preventDefault();
    return false;
  }
  console.log('Allowed error:', event.message, event.filename);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent default handling
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
