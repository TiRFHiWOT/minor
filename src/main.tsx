import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const root = document.getElementById("root");
if (!root) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Creating React app...');
  
  // Add immediate visual feedback
  root.innerHTML = '<div style="padding: 20px; background: lime; color: black; font-size: 24px;">React is starting...</div>';
  
  const reactRoot = createRoot(root);
  
  // Add a slight delay to see the green message
  setTimeout(() => {
    console.log('✅ Rendering App component...');
    
    try {
      // Try to render with error boundary
      reactRoot.render(
        <div style={{ minHeight: '100vh', background: 'yellow', padding: '20px' }}>
          <div style={{ background: 'blue', color: 'white', padding: '10px', marginBottom: '10px' }}>
            App component wrapper is rendering...
          </div>
          <App />
        </div>
      );
      console.log('✅ App component rendered successfully');
    } catch (error) {
      console.error('❌ Error rendering App:', error);
      reactRoot.render(
        <div style={{ padding: '20px', background: 'red', color: 'white', minHeight: '100vh' }}>
          <h1>App Component Error</h1>
          <p>Error: {error?.message || 'Unknown error'}</p>
          <p>Check console for details</p>
        </div>
      );
    }
  }, 500);
}