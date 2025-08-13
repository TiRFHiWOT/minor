import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const root = document.getElementById("root");
if (!root) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found - rendering with mobile-safe storage');
  const reactRoot = createRoot(root);
  reactRoot.render(<App />);
}