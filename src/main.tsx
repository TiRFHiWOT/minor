import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 UNHANDLED PROMISE REJECTION:', event.reason);
  console.error('Promise:', event.promise);
  console.error('Reason stack:', event.reason?.stack);
  event.preventDefault();
});

// Handle unhandled errors
window.addEventListener('error', (event) => {
  console.error('🔴 UNHANDLED ERROR:', event.error);
  console.error('Message:', event.message);
  console.error('Filename:', event.filename);
  console.error('Line:', event.lineno);
  console.error('Column:', event.colno);
});

// Add console.log to track app initialization
console.log('🚀 Starting React app initialization...');

const root = document.getElementById("root");
if (!root) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found, creating React app...');
  try {
    const reactRoot = createRoot(root);
    console.log('✅ React root created, rendering app...');
    reactRoot.render(<App />);
    console.log('✅ React app rendered successfully');
  } catch (error) {
    console.error('❌ Error rendering React app:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
  }
}
