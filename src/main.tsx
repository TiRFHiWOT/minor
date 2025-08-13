import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'

console.log('🔥 MAIN.TSX STARTED');

// Create a minimal test App component
const TestApp = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'lightgreen', 
      padding: '20px',
      fontSize: '18px',
      color: 'black'
    }}>
      <h1>✅ Test App Component Working!</h1>
      <p>React is rendering successfully on mobile</p>
      <p>This confirms the basic setup is working</p>
    </div>
  );
};

const root = document.getElementById("root");
if (!root) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found');
  
  root.innerHTML = '<div style="padding: 20px; background: lime; color: black; font-size: 24px;">React is starting...</div>';
  
  console.log('✅ About to create React root');
  const reactRoot = createRoot(root);
  console.log('✅ React root created');
  
  setTimeout(() => {
    console.log('🚀 TIMEOUT EXECUTING - Testing simple App!');
    
    try {
      console.log('🔧 Creating test React element...');
      const testElement = React.createElement(TestApp);
      console.log('✅ Test React element created');
      
      console.log('🎯 Rendering test App...');
      reactRoot.render(testElement);
      console.log('✅ Test App rendered successfully');
      
    } catch (renderError) {
      console.error('❌ Test render error:', renderError);
      root.innerHTML = `<div style="padding: 20px; background: red; color: white;">Test Render Error: ${renderError.message}</div>`;
    }
    
  }, 500);
  
  console.log('✅ setTimeout registered');
}