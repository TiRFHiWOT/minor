import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 [main.tsx] Starting app initialization...');

const root = document.getElementById("root");
if (!root) {
  console.error('❌ [main.tsx] Root element not found!');
} else {
  console.log('✅ [main.tsx] Root element found - rendering app');
  try {
    const reactRoot = createRoot(root);
    console.log('✅ [main.tsx] React root created');
    reactRoot.render(<App />);
    console.log('✅ [main.tsx] App rendered successfully');
  } catch (error) {
    console.error('❌ [main.tsx] Error during app rendering:', error);
  }
}