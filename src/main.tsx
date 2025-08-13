import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.log('Promise rejection:', event.reason);
  event.preventDefault();
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
