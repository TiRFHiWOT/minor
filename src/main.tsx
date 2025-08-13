import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'

console.log('🔥 MAIN.TSX STARTED');

const root = document.getElementById("root");
if (!root) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found');
  
  // Add immediate visual feedback
  root.innerHTML = '<div style="padding: 20px; background: lime; color: black; font-size: 24px;">React is starting...</div>';
  
  console.log('✅ About to create React root');
  const reactRoot = createRoot(root);
  console.log('✅ React root created');
  
  // Test setTimeout execution
  console.log('✅ Setting up setTimeout...');
  setTimeout(() => {
    console.log('🚀 TIMEOUT EXECUTING!');
    
    root.innerHTML = '<div style="padding: 20px; background: orange; color: black; font-size: 24px;">setTimeout executed, testing App import...</div>';
    
    // Test App import
    try {
      console.log('📦 Testing App import...');
      import('./App.tsx').then(AppModule => {
        console.log('✅ App imported successfully:', AppModule);
        const App = AppModule.default;
        
        root.innerHTML = '<div style="padding: 20px; background: purple; color: white; font-size: 24px;">App imported, creating element...</div>';
        
        try {
          console.log('🔧 Creating React element...');
          const appElement = React.createElement(App);
          console.log('✅ React element created');
          
          root.innerHTML = '<div style="padding: 20px; background: blue; color: white; font-size: 24px;">About to render App...</div>';
          
          reactRoot.render(appElement);
          console.log('✅ App rendered successfully');
          
        } catch (renderError) {
          console.error('❌ Render error:', renderError);
          root.innerHTML = `<div style="padding: 20px; background: red; color: white;">Render Error: ${renderError.message}</div>`;
        }
        
      }).catch(importError => {
        console.error('❌ App import error:', importError);
        root.innerHTML = `<div style="padding: 20px; background: red; color: white;">Import Error: ${importError.message}</div>`;
      });
      
    } catch (syncError) {
      console.error('❌ Sync error in timeout:', syncError);
      root.innerHTML = `<div style="padding: 20px; background: red; color: white;">Sync Error: ${syncError.message}</div>`;
    }
    
  }, 500);
  
  console.log('✅ setTimeout registered');
}