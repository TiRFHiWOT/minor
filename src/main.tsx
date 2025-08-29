import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandler } from "./utils/globalErrorHandler";
import { ErrorBoundaryGlobal } from "./components/ErrorBoundaryGlobal";

// Initialize global error handling before anything else
setupGlobalErrorHandler();

const root = document.getElementById("root");
if (!root) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found - rendering with mobile-safe storage');
  const reactRoot = createRoot(root);
  reactRoot.render(
    <ErrorBoundaryGlobal>
      <App />
    </ErrorBoundaryGlobal>
  );
}