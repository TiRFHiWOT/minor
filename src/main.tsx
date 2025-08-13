import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'

console.log('🔥 MAIN.TSX STARTED');

// Test App components gradually with proper ES6 imports
const TestApp = () => {
  console.log('🧪 TestApp component rendering...');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'lightgreen', 
      padding: '20px',
      fontSize: '16px',
      color: 'black'
    }}>
      <h1>✅ Testing App.tsx Imports</h1>
      <p>About to test importing your actual App component...</p>
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
    console.log('🚀 Rendering test app...');
    
    try {
      reactRoot.render(React.createElement(TestApp));
      console.log('✅ Test app rendered, now testing actual App import...');
      
      // Test actual App import after a delay
      setTimeout(() => {
        console.log('📦 Testing actual App.tsx import...');
        
        import('./App.tsx').then(AppModule => {
          console.log('✅ App.tsx imported successfully');
          const App = AppModule.default;
          
          try {
            console.log('🔧 Creating actual App element...');
            const appElement = React.createElement(App);
            console.log('✅ App element created, rendering...');
            
            reactRoot.render(appElement);
            console.log('✅ Actual App rendered successfully!');
            
          } catch (appRenderError) {
            console.error('❌ App render error:', appRenderError);
            reactRoot.render(React.createElement('div', {
              style: { padding: '20px', background: 'red', color: 'white', minHeight: '100vh' }
            }, [
              React.createElement('h1', { key: 'title' }, 'App Render Error'),
              React.createElement('p', { key: 'msg' }, `Error: ${appRenderError.message}`),
              React.createElement('pre', { key: 'stack' }, appRenderError.stack || 'No stack trace')
            ]));
          }
          
        }).catch(appImportError => {
          console.error('❌ App import error:', appImportError);
          reactRoot.render(React.createElement('div', {
            style: { padding: '20px', background: 'red', color: 'white', minHeight: '100vh' }
          }, [
            React.createElement('h1', { key: 'title' }, 'App Import Error'),
            React.createElement('p', { key: 'msg' }, `Error: ${appImportError.message}`)
          ]));
        });
        
      }, 1000);
      
    } catch (renderError) {
      console.error('❌ Test render error:', renderError);
      root.innerHTML = `<div style="padding: 20px; background: red; color: white;">Test Render Error: ${renderError.message}</div>`;
    }
    
  }, 500);
}