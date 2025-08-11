import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

// Handle cross-origin script errors from third-party scripts
window.addEventListener('error', (event) => {
  // Ignore cross-origin script errors from ad scripts
  if (event.message === 'Script error.' && event.filename === '') {
    console.log('Ignored cross-origin script error (likely from ad script)');
    event.preventDefault();
    return false;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
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
