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
    reactRoot.render(<App />);
  }, 500);
}