import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'

console.log('🔥 MAIN.TSX STARTED');

// Add global error handlers
window.addEventListener('error', (event) => {
  console.error('🔴 GLOBAL ERROR:', event.error);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `<div style="padding: 20px; background: red; color: white; font-family: Arial;">
      <h1>Global JavaScript Error</h1>
      <p>Message: ${event.message}</p>
      <p>File: ${event.filename}:${event.lineno}</p>
      <p>Error: ${event.error?.message || 'Unknown'}</p>
    </div>`;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 UNHANDLED PROMISE REJECTION:', event.reason);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `<div style="padding: 20px; background: orange; color: black; font-family: Arial;">
      <h1>Unhandled Promise Rejection</h1>
      <p>Reason: ${event.reason?.message || event.reason}</p>
    </div>`;
  }
});

const TestApp = () => {
  console.log('🧪 TestApp component rendering...');
  
  React.useEffect(() => {
    console.log('🔄 TestApp useEffect running - testing App import...');
    
    const testAppImport = async () => {
      try {
        console.log('📦 Starting App.tsx import...');
        
        const AppModule = await import('./App.tsx');
        console.log('✅ App.tsx imported successfully:', AppModule);
        
        const App = AppModule.default;
        console.log('✅ App component extracted:', App);
        
        // Test if we can create the App element
        const appElement = React.createElement(App);
        console.log('✅ App element created successfully');
        
        // Show success message
        const root = document.getElementById("root");
        if (root) {
          root.innerHTML = `<div style="padding: 20px; background: blue; color: white; font-family: Arial;">
            <h1>✅ App Import Successful!</h1>
            <p>App.tsx imported and element created successfully</p>
            <p>Now attempting to render...</p>
          </div>`;
        }
        
        // Attempt to render after short delay
        setTimeout(() => {
          const reactRoot = createRoot(root);
          reactRoot.render(appElement);
          console.log('✅ App rendered successfully!');
        }, 1000);
        
      } catch (error) {
        console.error('❌ App import/create error:', error);
        const root = document.getElementById("root");
        if (root) {
          root.innerHTML = `<div style="padding: 20px; background: red; color: white; font-family: Arial;">
            <h1>App Import/Create Error</h1>
            <p>Error: ${error.message}</p>
            <p>Stack: ${error.stack}</p>
          </div>`;
        }
      }
    };
    
    // Add delay before testing
    setTimeout(testAppImport, 2000);
    
  }, []);
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'lightgreen', 
      padding: '20px',
      fontSize: '16px',
      color: 'black'
    }}>
      <h1>✅ React Component Working</h1>
      <p>UseEffect will test App import in 2 seconds...</p>
      <p>Wait for blue or red message...</p>
    </div>
  );
};

const root = document.getElementById("root");
if (!root) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found');
  
  root.innerHTML = '<div style="padding: 20px; background: lime; color: black; font-size: 24px;">React is starting...</div>';
  
  const reactRoot = createRoot(root);
  
  setTimeout(() => {
    console.log('🚀 Rendering test component...');
    
    try {
      reactRoot.render(React.createElement(TestApp));
      console.log('✅ Test component rendered successfully');
      
    } catch (renderError) {
      console.error('❌ Test component render error:', renderError);
      root.innerHTML = `<div style="padding: 20px; background: red; color: white;">Test Component Error: ${renderError.message}</div>`;
    }
    
  }, 500);
}